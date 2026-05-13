import { create } from "zustand";
import { createDemoQueryEmbedding, createLowConfidenceDemoEmbedding } from "@/lib/scan/demo-dataset";
import { loadOfflineScanDataset } from "@/lib/scan/local-store";
import { runOfflineScan } from "@/lib/scan/pipeline";
import type { OfflineScanResult, ScanQualitySignals } from "@/lib/scan/types";

type ScanStage = "idle" | "quality" | "embedding" | "searching" | "retrieving" | "complete" | "error";

type ScanState = {
  results: Record<string, OfflineScanResult>;
  stage: ScanStage;
  error: string | null;
  startDemoScan: () => Promise<string>;
  startLowConfidenceDemoScan: () => Promise<string>;
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

      set((state) => ({
        results: {
          ...state.results,
          [id]: result,
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
