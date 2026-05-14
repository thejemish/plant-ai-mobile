import type { GemmaDiagnosis, GemmaDiagnosisState } from "@/features/scan/gemma-diagnosis";
import { getSyncDb } from "@/store/db";
import { useModelStore } from "@/store/use-model";
import { useSettingsStore } from "@/store/use-settings";
import type { DiseaseCandidate, OfflineScanResult } from "@/lib/scan/types";

export type SymptomInput = {
  crop: string;
  part: string;
  symptoms: string[];
  spread: string;
  weather: string;
};

type DiseaseRow = {
  id: string;
  name: string;
  slug: string | null;
  crops: string;
  symptoms: string | null;
  symptoms_md: string | null;
};

type CitationRow = {
  id: string;
  chunk_text: string;
};

export async function runSymptomOnlyDiagnosis(id: string, input: SymptomInput): Promise<OfflineScanResult> {
  const db = await getSyncDb();
  const rows = await db.getAllAsync<DiseaseRow>(
    `SELECT id, name, slug, crops, symptoms, symptoms_md
     FROM diseases
     WHERE status = 'published'
     ORDER BY name ASC`,
  );
  const candidates = rankDiseaseRows(rows, input);
  const best = candidates[0] ?? fallbackCandidate(input);
  const citations = await loadSymptomCitations(best.diseaseId, input);
  const gemma = await runGemmaSymptomRanker(input, candidates);
  const confidence = best.score;
  const now = new Date().toISOString();

  return {
    id,
    queryPhotoUri: `plant-ai-symptoms://${encodeURIComponent(input.crop)}`,
    createdAt: now,
    status: confidence >= 0.45 ? "complete" : "retake",
    uncertain: confidence < 0.55,
    confidence,
    confidenceBucket: confidence >= 0.75 ? "high" : confidence >= 0.55 ? "medium" : "low",
    disease: best.diseaseLabel,
    diseaseId: best.diseaseId,
    crop: input.crop,
    severity: severityFromSpread(input.spread),
    topMatches: [],
    candidates,
    quality: {
      ok: true,
      blurVariance: null,
      foliageRatio: null,
      issues: ["missing_quality_signals"],
    },
    fusion: {
      visual: 0,
      agreement: confidence,
      quality: 1,
      final: confidence,
    },
    treatment: {
      immediate: ["Inspect affected plants and compare with cited symptoms.", "Take a clear leaf photo when possible."],
      organic: ["Remove badly affected leaves and avoid overhead irrigation until diagnosis is confirmed."],
      chemical: ["Use the treatment screen only when a curated dosage record is available."],
      prevent: ["Improve airflow, monitor spread, and keep field notes for the next inspection."],
    },
    citations,
    lowConfidenceReason: confidence < 0.55 ? "Symptom-only match needs photo confirmation." : undefined,
    gemma,
  };
}

function rankDiseaseRows(rows: DiseaseRow[], input: SymptomInput): DiseaseCandidate[] {
  const terms = [input.part, input.spread, input.weather, ...input.symptoms].map(normalize).filter(Boolean);
  return rows
    .map((row) => {
      const haystack = normalize([row.name, row.crops, row.symptoms, row.symptoms_md].filter(Boolean).join(" "));
      const cropMatch = normalize(row.crops).includes(normalize(input.crop)) || normalize(input.crop).includes(normalize(row.crops));
      const hits = terms.filter((term) => haystack.includes(term) || term.split(" ").some((word) => word.length > 3 && haystack.includes(word)));
      const score = Math.min(0.95, 0.25 + hits.length * 0.14 + (cropMatch ? 0.22 : 0));
      return {
        diseaseId: row.id,
        diseaseLabel: row.name,
        crop: input.crop,
        score,
        topScore: score,
        averageTopScore: score,
        matchCount: hits.length,
      };
    })
    .filter((candidate) => candidate.matchCount > 0 || candidate.score > 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

async function loadSymptomCitations(diseaseId: string | null, input: SymptomInput) {
  if (!diseaseId) {
    return [];
  }
  const db = await getSyncDb();
  const rows = await db.getAllAsync<CitationRow>(
    `SELECT id, chunk_text
     FROM guide_chunks
     WHERE status = 'published'
       AND disease_id = ?
     ORDER BY updated_at DESC
     LIMIT 3`,
    diseaseId,
  );
  const fallbackText = `${input.crop} symptoms: ${input.symptoms.join(", ")}. Spread: ${input.spread}. Weather: ${input.weather}.`;
  return (rows.length ? rows : [{ id: "symptom-input", chunk_text: fallbackText }]).map((row, index) => ({
    ref: `symptom-${index + 1}`,
    chunkId: row.id,
    text: row.chunk_text,
  }));
}

async function runGemmaSymptomRanker(input: SymptomInput, candidates: DiseaseCandidate[]): Promise<GemmaDiagnosisState> {
  const context = useModelStore.getState().context;
  const language = useSettingsStore.getState().language;
  const fallbackJson = {
    crop: input.crop,
    disease: candidates[0]?.diseaseLabel ?? "Unknown crop stress",
    disease_slug: candidates[0]?.diseaseId ?? null,
    severity: severityFromSpread(input.spread),
    confidence: candidates[0]?.score ?? 0.35,
    symptoms: input.symptoms,
    differential: candidates.slice(1, 4).map((candidate) => candidate.diseaseLabel),
    next_steps: ["Confirm with a leaf photo when possible.", "Use cited guide content before treatment decisions."],
    language,
  };

  if (!context || candidates.length === 0) {
    return {
      status: "unavailable",
      json: fallbackJson,
      rawText: "Gemma model is not loaded; using local symptom ranking.",
    };
  }

  try {
    const completion = await context.completion({
      messages: [
        {
          role: "user",
          content: [
            "Rank this symptom-only crop diagnosis using only the provided candidate list.",
            "Return concise JSON with crop, disease, disease_slug, severity, confidence, symptoms, differential, next_steps, language.",
            `Input: ${JSON.stringify(input)}`,
            `Candidates: ${JSON.stringify(candidates.slice(0, 5))}`,
          ].join("\n"),
        },
      ],
      n_predict: 360,
      temperature: 0.1,
    });
    return {
      status: "complete",
      json: fallbackJson,
      rawText: completion.content || completion.text,
    };
  } catch (error) {
    return {
      status: "error",
      json: fallbackJson,
      error: error instanceof Error ? error.message : "Gemma symptom ranking failed.",
    };
  }
}

function fallbackCandidate(input: SymptomInput): DiseaseCandidate {
  return {
    diseaseId: "unknown-crop-stress",
    diseaseLabel: "Unknown crop stress",
    crop: input.crop,
    score: 0.35,
    topScore: 0.35,
    averageTopScore: 0.35,
    matchCount: 0,
  };
}

function severityFromSpread(spread: string): GemmaDiagnosis["severity"] {
  const normalized = normalize(spread);
  if (normalized.includes("many") || normalized.includes("fast") || normalized.includes("whole")) {
    return "severe";
  }
  if (normalized.includes("patch") || normalized.includes("several")) {
    return "moderate";
  }
  return "mild";
}

function normalize(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
