import { create } from "zustand";
import { getSyncDb } from "./db";

export type ScanSummary = {
  id: string;
  local_image_uri: string | null;
  predicted_crop: string | null;
  predicted_disease_id: string | null;
  predicted_disease_label: string | null;
  severity: string | null;
  confidence: number | null;
  outcome: string | null;
  created_at: string;
};

type HistoryState = {
  recent: ScanSummary[];
  isHydrating: boolean;
  hydrateScans: (limit?: number) => Promise<void>;
};

export const useHistoryStore = create<HistoryState>((set) => ({
  recent: [],
  isHydrating: false,
  hydrateScans: async (limit = 50) => {
    set({ isHydrating: true });
    try {
      const db = await getSyncDb();
      const recent = await db.getAllAsync<ScanSummary>(
        `SELECT id, local_image_uri, predicted_crop, predicted_disease_id, predicted_disease_label,
                severity, confidence, outcome, created_at
         FROM scans
         WHERE deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT ?`,
        limit,
      );
      set({ recent });
    } catch {
      set({ recent: [] });
    } finally {
      set({ isHydrating: false });
    }
  },
}));
