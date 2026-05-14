import { create } from "zustand";
import { getWeatherAdvisory, type WeatherAdvisory } from "@/features/weather/service";
import type { FieldSummary } from "./use-fields";

type WeatherState = {
  advisory: WeatherAdvisory | null;
  error: string | null;
  isLoading: boolean;
  hydrateWeather: (fields: FieldSummary[]) => Promise<void>;
};

export const useWeatherStore = create<WeatherState>((set) => ({
  advisory: null,
  error: null,
  isLoading: false,
  hydrateWeather: async (fields) => {
    set({ isLoading: true, error: null });
    try {
      const advisory = await getWeatherAdvisory(fields);
      set({ advisory });
    } catch (error) {
      set({
        advisory: {
          fetchedAt: null,
          fieldId: null,
          fieldName: null,
          maxTempC: null,
          rainMm: null,
          rainProbability: null,
          risk: "missing",
          summary: error instanceof Error ? error.message : "Weather forecast is unavailable.",
        },
        error: error instanceof Error ? error.message : "Weather forecast is unavailable.",
      });
    } finally {
      set({ isLoading: false });
    }
  },
}));
