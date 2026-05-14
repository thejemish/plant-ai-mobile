import { create } from "zustand";
import { resolveCurrentStage, type ResolvedStage } from "@/features/fields/stage";
import { getSyncDb } from "./db";

export type FieldSummary = {
  id: string;
  name: string;
  crop: string | null;
  variety: string | null;
  sowing_date: string | null;
  area_acres: number | null;
  lat: number | null;
  lng: number | null;
  updated_at: string;
  currentStage: ResolvedStage | null;
};

type FieldsState = {
  fields: FieldSummary[];
  isHydrating: boolean;
  hydrateFields: () => Promise<void>;
};

export const useFieldsStore = create<FieldsState>((set) => ({
  fields: [],
  isHydrating: false,
  hydrateFields: async () => {
    set({ isHydrating: true });
    try {
      const db = await getSyncDb();
      const rows = await db.getAllAsync<Omit<FieldSummary, "currentStage">>(
        `SELECT id, name, crop, variety, sowing_date, area_acres, lat, lng, updated_at
         FROM fields
         WHERE deleted_at IS NULL
         ORDER BY updated_at DESC`,
      );
      const fields = await Promise.all(
        rows.map(async (field) => ({
          ...field,
          currentStage: await resolveCurrentStage(field.crop, field.sowing_date),
        })),
      );
      set({ fields });
    } catch {
      set({ fields: [] });
    } finally {
      set({ isHydrating: false });
    }
  },
}));
