import { create } from "zustand";
import { refreshAllTables } from "supastash";

type SyncState = {
  isSyncing: boolean;
  lastSyncAt: string | null;
  error: string | null;
  triggerSync: () => Promise<void>;
};

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  lastSyncAt: null,
  error: null,
  triggerSync: async () => {
    set({ isSyncing: true, error: null });
    try {
      await refreshAllTables();
      set({ lastSyncAt: new Date().toISOString() });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Sync failed" });
    } finally {
      set({ isSyncing: false });
    }
  },
}));
