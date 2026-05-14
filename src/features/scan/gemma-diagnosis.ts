import type { LlamaContext } from "llama.rn";
import type { OfflineScanResult } from "@/lib/scan/types";

export type GemmaDiagnosis = {
  crop: string | null;
  disease: string | null;
  disease_slug: string | null;
  severity: "mild" | "moderate" | "severe" | "unknown";
  confidence: number;
  symptoms: string[];
  differential: string[];
  next_steps: string[];
  language: string;
};

export type GemmaDiagnosisState = {
  status: "unavailable" | "complete" | "error";
  json: GemmaDiagnosis | null;
  rawText?: string;
  error?: string;
};

const DIAGNOSIS_SCHEMA = {
  type: "object",
  properties: {
    crop: { type: "string" },
    disease: { type: "string" },
    disease_slug: { type: "string" },
    severity: { enum: ["mild", "moderate", "severe"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    symptoms: { type: "array", items: { type: "string" } },
    differential: { type: "array", items: { type: "string" } },
    next_steps: { type: "array", items: { type: "string" } },
    language: { type: "string" },
  },
  required: ["crop", "disease", "disease_slug", "severity", "confidence", "symptoms", "differential", "next_steps", "language"],
};

export function fallbackGemmaDiagnosis(result: OfflineScanResult): GemmaDiagnosis {
  return {
    crop: result.crop,
    disease: result.disease,
    disease_slug: result.diseaseId,
    severity: result.severity,
    confidence: result.confidence,
    symptoms: result.candidates.slice(0, 3).map((candidate) => `${candidate.diseaseLabel} visual evidence`),
    differential: result.candidates.slice(1, 4).map((candidate) => candidate.diseaseLabel),
    next_steps: result.treatment.immediate.slice(0, 3),
    language: "en",
  };
}

export async function runGemmaVisionDiagnosis({
  context,
  language,
  photoUri,
  visualResult,
}: {
  context: LlamaContext | null;
  language: string;
  photoUri: string;
  visualResult: OfflineScanResult;
}): Promise<GemmaDiagnosisState> {
  if (!context) {
    return {
      status: "unavailable",
      json: fallbackGemmaDiagnosis(visualResult),
      rawText: "Gemma model is not loaded; using local evidence fallback.",
    };
  }

  const prompt = [
    "You are a crop disease specialist.",
    "Look at the leaf image and reply ONLY with JSON.",
    `Use language code: ${language}.`,
    "Do not invent dosage, product names, or pre-harvest intervals.",
    "Schema:",
    JSON.stringify(DIAGNOSIS_SCHEMA),
  ].join("\n");

  try {
    const completion = await context.completion({
      messages: [{ role: "user", content: prompt }],
      media_paths: [photoUri],
      response_format: { type: "json_schema", schema: DIAGNOSIS_SCHEMA },
      n_predict: 512,
      temperature: 0.1,
    });
    const rawText = completion.content || completion.text;
    return {
      status: "complete",
      json: normalizeDiagnosis(JSON.parse(extractJson(rawText))),
      rawText,
    };
  } catch (error) {
    return {
      status: "error",
      json: fallbackGemmaDiagnosis(visualResult),
      error: error instanceof Error ? error.message : "Gemma diagnosis failed.",
    };
  }
}

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Gemma response did not include JSON.");
  }

  return text.slice(start, end + 1);
}

function normalizeDiagnosis(value: Partial<GemmaDiagnosis>): GemmaDiagnosis {
  return {
    crop: value.crop ?? null,
    disease: value.disease ?? null,
    disease_slug: value.disease_slug ?? null,
    severity: value.severity ?? "unknown",
    confidence: typeof value.confidence === "number" ? Math.max(0, Math.min(1, value.confidence)) : 0,
    symptoms: Array.isArray(value.symptoms) ? value.symptoms.filter(Boolean) : [],
    differential: Array.isArray(value.differential) ? value.differential.filter(Boolean) : [],
    next_steps: Array.isArray(value.next_steps) ? value.next_steps.filter(Boolean) : [],
    language: value.language ?? "en",
  };
}
