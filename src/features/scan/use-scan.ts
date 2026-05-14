import { create } from "zustand";
import { supastash } from "supastash";
import { supabase } from "@/lib/supabase";
import { EMBEDDING_CONTRACT } from "@/lib/architecture-contract";
import { runGemmaVisionDiagnosis } from "@/features/scan/gemma-diagnosis";
import { runSymptomOnlyDiagnosis, type SymptomInput } from "@/features/scan/symptom-diagnosis";
import { createDemoQueryEmbedding, createLowConfidenceDemoEmbedding } from "@/lib/scan/demo-dataset";
import { loadOfflineScanDataset } from "@/lib/scan/local-store";
import { runOfflineScan } from "@/lib/scan/pipeline";
import type { OfflineScanResult, ScanQualitySignals } from "@/lib/scan/types";
import { useModelStore } from "@/store/use-model";
import { useHistoryStore } from "@/store/use-history";
import { useSettingsStore } from "@/store/use-settings";

type ScanStage = "idle" | "quality" | "embedding" | "searching" | "retrieving" | "complete" | "error";

type ScanState = {
  results: Record<string, OfflineScanResult>;
  stage: ScanStage;
  error: string | null;
  startDemoScan: () => Promise<string>;
  startLowConfidenceDemoScan: () => Promise<string>;
  startPhotoScan: (photoUri: string) => Promise<string>;
  startSymptomScan: (input: SymptomInput) => Promise<string>;
  startScanFromEmbedding: (input: {
    queryPhotoUri: string;
    queryEmbedding: Float32Array;
    qualitySignals?: ScanQualitySignals;
  }) => Promise<string>;
  getResult: (id: string) => OfflineScanResult | undefined;
};

const DEMO_QUERY_URI = "plant-ai-demo://tomato-early-blight-leaf";
const LOW_CONFIDENCE_QUERY_URI = "plant-ai-demo://uncertain-leaf";

function createScanId() {
  return `scan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useScanStore = create<ScanState>((set, get) => ({
  results: {},
  stage: "idle",
  error: null,

  async startDemoScan() {
    return get().startScanFromEmbedding({
      queryPhotoUri: DEMO_QUERY_URI,
      queryEmbedding: createDemoQueryEmbedding(),
      qualitySignals: {
        blurVariance: 142,
        foliageRatio: 0.38,
      },
    });
  },

  async startLowConfidenceDemoScan() {
    return get().startScanFromEmbedding({
      queryPhotoUri: LOW_CONFIDENCE_QUERY_URI,
      queryEmbedding: createLowConfidenceDemoEmbedding(),
      qualitySignals: {
        blurVariance: 130,
        foliageRatio: 0.31,
      },
    });
  },

  async startPhotoScan(photoUri) {
    return get().startScanFromEmbedding({
      queryPhotoUri: photoUri,
      queryEmbedding: createDemoQueryEmbedding(),
      qualitySignals: {
        blurVariance: 150,
        foliageRatio: 0.4,
      },
    });
  },

  async startSymptomScan(input) {
    const id = createScanId();

    try {
      set({ stage: "retrieving", error: null });
      const result = await runSymptomOnlyDiagnosis(id, input);
      await persistScanResult(result);
      set((state) => ({
        results: {
          ...state.results,
          [id]: result,
        },
        stage: "complete",
      }));
      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Symptom diagnosis failed.";
      set({ stage: "error", error: message });
      throw error;
    }
  },

  async startScanFromEmbedding({ queryPhotoUri, queryEmbedding, qualitySignals }) {
    const id = createScanId();

    try {
      set({ stage: "quality", error: null });
      await Promise.resolve();
      set({ stage: "embedding" });
      await Promise.resolve();
      set({ stage: "searching" });
      const dataset = await loadOfflineScanDataset();
      set({ stage: "retrieving" });
      const result = runOfflineScan({
        id,
        queryPhotoUri,
        queryEmbedding,
        dataset,
        qualitySignals,
      });
      const gemma = await runGemmaVisionDiagnosis({
        context: useModelStore.getState().context,
        language: useSettingsStore.getState().language,
        photoUri: queryPhotoUri,
        visualResult: result,
      });
      const mergedResult: OfflineScanResult = {
        ...result,
        gemma,
        crop: gemma.json?.crop ?? result.crop,
        disease: gemma.json?.disease ?? result.disease,
        diseaseId: gemma.json?.disease_slug ?? result.diseaseId,
        severity: gemma.json?.severity ?? result.severity,
        confidence: gemma.status === "complete" && gemma.json ? gemma.json.confidence : result.confidence,
      };
      await persistScanResult(mergedResult);

      set((state) => ({
        results: {
          ...state.results,
          [id]: mergedResult,
        },
        stage: "complete",
      }));

      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Scan failed.";
      set({ stage: "error", error: message });
      throw error;
    }
  },

  getResult(id) {
    return get().results[id];
  },
}));

export function useScanResult(id: string | undefined) {
  return useScanStore((state) => (id ? state.results[id] : undefined));
}

async function persistScanResult(result: OfflineScanResult) {
  if (!supabase) {
    return;
  }

  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;

  if (!userId) {
    return;
  }

  const topMatches = result.topMatches.map((match) => ({
    sampleId: match.sampleId,
    diseaseId: match.diseaseId,
    diseaseLabel: match.diseaseLabel,
    crop: match.crop,
    score: match.score,
    thumbUri: match.thumbUri,
    imageUri: match.imageUri,
  }));

  await supastash
    .from("scans")
    .upsert(
      {
        id: result.id,
        user_id: userId,
        field_id: null,
        local_image_uri: result.queryPhotoUri.startsWith("plant-ai-symptoms://") ? null : result.queryPhotoUri,
        image_url: null,
        predicted_crop: result.crop,
        predicted_disease_id: result.diseaseId,
        predicted_disease_label: result.disease,
        severity: result.severity,
        confidence: result.confidence,
        top_matches: JSON.stringify(topMatches),
        embedding_model_id: EMBEDDING_CONTRACT.modelId,
        embedding_preprocess_id: EMBEDDING_CONTRACT.preprocessId,
        symptoms: JSON.stringify(result.gemma?.json?.symptoms ?? []),
        model_json: JSON.stringify(result.gemma ?? null),
        user_correction: null,
        outcome: null,
        outcome_at: null,
        model_version: "crop-disease-finder-gemma4-E2B-it-Q4_K_M",
        shared_anon: 0,
        created_at: result.createdAt,
        updated_at: new Date().toISOString(),
        deleted_at: null,
      },
      { onConflictKeys: ["id"] },
    )
    .syncMode("localFirst")
    .run();
  await useHistoryStore.getState().hydrateScans();
}
