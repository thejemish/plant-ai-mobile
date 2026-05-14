import { getSyncDb } from "@/store/db";
import type { FieldSummary } from "@/store/use-fields";

export type WeatherAdvisory = {
  fetchedAt: string | null;
  fieldId: string | null;
  fieldName: string | null;
  maxTempC: number | null;
  rainMm: number | null;
  rainProbability: number | null;
  risk: "good" | "rain" | "heat" | "cold" | "missing";
  summary: string;
};

type WeatherCacheRow = {
  fetched_at: string;
  forecast_json: string;
};

type OpenMeteoDaily = {
  precipitation_probability_max?: number[];
  precipitation_sum?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  time?: string[];
};

type OpenMeteoResponse = {
  daily?: OpenMeteoDaily;
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export async function getWeatherAdvisory(fields: FieldSummary[]): Promise<WeatherAdvisory> {
  const field = fields.find((candidate) => candidate.lat !== null && candidate.lng !== null);

  if (!field || field.lat === null || field.lng === null) {
    return {
      fetchedAt: null,
      fieldId: null,
      fieldName: null,
      maxTempC: null,
      rainMm: null,
      rainProbability: null,
      risk: "missing",
      summary: "Add a field location to show spray-risk weather.",
    };
  }

  const forecast = await loadCachedForecast(field);
  return summarizeForecast(field, forecast);
}

async function loadCachedForecast(field: FieldSummary) {
  const db = await getSyncDb();
  const cached = await db.getFirstAsync<WeatherCacheRow>(
    `SELECT fetched_at, forecast_json
     FROM weather_cache
     WHERE field_id = ?
     ORDER BY fetched_at DESC
     LIMIT 1`,
    field.id,
  );

  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    return JSON.parse(cached.forecast_json) as OpenMeteoResponse;
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(field.lat));
  url.searchParams.set("longitude", String(field.lng));
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max");
  url.searchParams.set("forecast_days", "3");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString());
  if (!response.ok) {
    if (cached) {
      return JSON.parse(cached.forecast_json) as OpenMeteoResponse;
    }
    throw new Error("Weather forecast is unavailable.");
  }

  const forecast = (await response.json()) as OpenMeteoResponse;
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO weather_cache (id, field_id, lat, lng, fetched_at, forecast_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       field_id = excluded.field_id,
       lat = excluded.lat,
       lng = excluded.lng,
       fetched_at = excluded.fetched_at,
       forecast_json = excluded.forecast_json,
       updated_at = excluded.updated_at,
       deleted_at = NULL`,
    `field:${field.id}`,
    field.id,
    field.lat,
    field.lng,
    now,
    JSON.stringify(forecast),
    now,
    now,
  );
  return forecast;
}

function summarizeForecast(field: FieldSummary, forecast: OpenMeteoResponse): WeatherAdvisory {
  const daily = forecast.daily ?? {};
  const maxTempC = firstNumber(daily.temperature_2m_max);
  const minTempC = firstNumber(daily.temperature_2m_min);
  const rainMm = firstNumber(daily.precipitation_sum);
  const rainProbability = firstNumber(daily.precipitation_probability_max);
  const fetchedAt = new Date().toISOString();

  if ((rainProbability ?? 0) >= 55 || (rainMm ?? 0) >= 2) {
    return {
      fetchedAt,
      fieldId: field.id,
      fieldName: field.name,
      maxTempC,
      rainMm,
      rainProbability,
      risk: "rain",
      summary: `Rain risk near ${field.name}; postpone spraying and recheck leaves after rain.`,
    };
  }

  if ((maxTempC ?? 0) >= 35) {
    return {
      fetchedAt,
      fieldId: field.id,
      fieldName: field.name,
      maxTempC,
      rainMm,
      rainProbability,
      risk: "heat",
      summary: `Heat risk near ${field.name}; spray only in cooler hours if treatment is needed.`,
    };
  }

  if ((minTempC ?? 99) <= 5) {
    return {
      fetchedAt,
      fieldId: field.id,
      fieldName: field.name,
      maxTempC,
      rainMm,
      rainProbability,
      risk: "cold",
      summary: `Cold stress risk near ${field.name}; avoid stressful sprays and monitor tender growth.`,
    };
  }

  return {
    fetchedAt,
    fieldId: field.id,
    fieldName: field.name,
    maxTempC,
    rainMm,
    rainProbability,
    risk: "good",
    summary: `Weather near ${field.name} looks suitable for field inspection today.`,
  };
}

function firstNumber(values: number[] | undefined) {
  const value = values?.[0];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
