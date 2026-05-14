import { create } from "zustand";
import { getSyncDb } from "./db";

export type AskThread = {
  id: string;
  title: string | null;
  crop: string | null;
  lang: string | null;
  scan_id: string | null;
  last_message_at: string | null;
};

type ThreadsState = {
  threads: AskThread[];
  hydrateThreads: () => Promise<void>;
};

export const useThreadsStore = create<ThreadsState>((set) => ({
  threads: [],
  hydrateThreads: async () => {
    try {
      const db = await getSyncDb();
      const threads = await db.getAllAsync<AskThread>(
        `SELECT id, title, crop, lang, scan_id, last_message_at
         FROM ask_threads
         WHERE deleted_at IS NULL
         ORDER BY last_message_at DESC`,
      );
      set({ threads });
    } catch {
      set({ threads: [] });
    }
  },
}));
