import { create } from "zustand";
import { getSyncDb } from "./db";

export type ActionProgress = {
  id: string;
  scan_id: string | null;
  field_id: string | null;
  treatment_id: string | null;
  step_key: string;
  step_label: string | null;
  done_at: string | null;
  outcome: string | null;
  notify_id: string | null;
  scheduled_for: string | null;
  updated_at: string;
};

type ActionsState = {
  actions: ActionProgress[];
  hydrateActions: () => Promise<void>;
};

export const useActionsStore = create<ActionsState>((set) => ({
  actions: [],
  hydrateActions: async () => {
    try {
      const db = await getSyncDb();
      const actions = await db.getAllAsync<ActionProgress>(
        `SELECT id, scan_id, field_id, treatment_id, step_key, step_label, done_at, outcome,
                notify_id, scheduled_for, updated_at
         FROM action_progress
         WHERE deleted_at IS NULL
         ORDER BY updated_at DESC`,
      );
      set({ actions });
    } catch {
      set({ actions: [] });
    }
  },
}));
