import { useEffect } from "react";
import { supastashEventBus } from "supastash";
import { useActionsStore } from "./use-actions";
import { useFieldsStore } from "./use-fields";
import { useHistoryStore } from "./use-history";
import { useThreadsStore } from "./use-threads";

const PREFIX = "supastash:refreshZustand:";

const HANDLERS: Record<string, () => Promise<void>> = {
  scans: () => useHistoryStore.getState().hydrateScans(),
  fields: () => useFieldsStore.getState().hydrateFields(),
  action_progress: () => useActionsStore.getState().hydrateActions(),
  ask_threads: () => useThreadsStore.getState().hydrateThreads(),
};

export function useHydrateStores() {
  useEffect(() => {
    for (const [table, handler] of Object.entries(HANDLERS)) {
      supastashEventBus.on(`${PREFIX}${table}`, handler);
      void handler();
    }

    return () => {
      for (const [table, handler] of Object.entries(HANDLERS)) {
        supastashEventBus.off(`${PREFIX}${table}`, handler);
      }
    };
  }, []);
}
