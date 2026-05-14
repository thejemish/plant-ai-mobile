import { create } from "zustand";
import * as FileSystem from "expo-file-system/legacy";
import type { LlamaContext } from "llama.rn";
import { writeAppMeta } from "@/features/onboarding/app-meta";

export type ModelStatus = "idle" | "missing" | "downloading_main" | "downloading_mmproj" | "loading" | "ready" | "error";

const MODEL_BASE = "https://huggingface.co/thejemish/crop-disease-finder-gemma4-E2B-GGUF/resolve/main";
export const MODEL_FILE = "crop-disease-finder-gemma4-E2B-it-Q4_K_M.gguf";
export const MMPROJ_FILE = "mmproj-crop-disease-finder-gemma4-E2B-it-F16.gguf";
const MODEL_DIR = `${FileSystem.documentDirectory ?? ""}models/gemma4-e2b/`;

type ModelState = {
  status: ModelStatus;
  modelPath: string | null;
  mmprojPath: string | null;
  progress: number;
  mainProgress: number;
  mmprojProgress: number;
  bytesDownloaded: number;
  bytesTotal: number;
  context: LlamaContext | null;
  error: string | null;
  setStatus: (status: ModelStatus) => void;
  setPaths: (paths: { modelPath: string | null; mmprojPath: string | null }) => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  checkLocalFiles: () => Promise<boolean>;
  startDownload: () => Promise<void>;
  loadIntoMemory: () => Promise<void>;
  unload: () => Promise<void>;
};

function modelPath() {
  return `${MODEL_DIR}${MODEL_FILE}`;
}

function mmprojPath() {
  return `${MODEL_DIR}${MMPROJ_FILE}`;
}

async function fileExists(path: string) {
  const info = await FileSystem.getInfoAsync(path);
  return info.exists;
}

export const useModelStore = create<ModelState>((set) => ({
  status: "missing",
  modelPath: null,
  mmprojPath: null,
  progress: 0,
  mainProgress: 0,
  mmprojProgress: 0,
  bytesDownloaded: 0,
  bytesTotal: 0,
  context: null,
  error: null,
  setStatus: (status) => set({ status }),
  setPaths: ({ modelPath, mmprojPath }) => set({ modelPath, mmprojPath }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error, status: error ? "error" : "missing" }),
  checkLocalFiles: async () => {
    const main = modelPath();
    const mmproj = mmprojPath();
    const ready = Boolean(FileSystem.documentDirectory) && (await fileExists(main)) && (await fileExists(mmproj));

    if (ready) {
      set({
        status: "idle",
        modelPath: main,
        mmprojPath: mmproj,
        progress: 1,
        mainProgress: 1,
        mmprojProgress: 1,
        error: null,
      });
    } else {
      set({ status: "missing", modelPath: main, mmprojPath: mmproj });
    }

    return ready;
  },
  startDownload: async () => {
    if (!FileSystem.documentDirectory) {
      set({ status: "error", error: "Document directory is unavailable on this device." });
      return;
    }

    const main = modelPath();
    const mmproj = mmprojPath();

    try {
      await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });

      const mainExists = await fileExists(main);
      if (!mainExists) {
        set({ status: "downloading_main", error: null, mainProgress: 0, progress: 0 });
        const download = FileSystem.createDownloadResumable(`${MODEL_BASE}/${MODEL_FILE}`, main, {}, (event) => {
          const total = event.totalBytesExpectedToWrite || 0;
          const written = event.totalBytesWritten || 0;
          const mainProgress = total > 0 ? written / total : 0;
          set({
            mainProgress,
            progress: mainProgress * 0.78,
            bytesDownloaded: written,
            bytesTotal: total,
          });
        });
        await download.downloadAsync();
      }

      const mmprojExists = await fileExists(mmproj);
      if (!mmprojExists) {
        set({ status: "downloading_mmproj", error: null, mmprojProgress: 0 });
        const download = FileSystem.createDownloadResumable(`${MODEL_BASE}/${MMPROJ_FILE}`, mmproj, {}, (event) => {
          const total = event.totalBytesExpectedToWrite || 0;
          const written = event.totalBytesWritten || 0;
          const mmprojProgress = total > 0 ? written / total : 0;
          set({
            mmprojProgress,
            progress: 0.78 + mmprojProgress * 0.22,
            bytesDownloaded: written,
            bytesTotal: total,
          });
        });
        await download.downloadAsync();
      }

      set({
        modelPath: main,
        mmprojPath: mmproj,
        progress: 1,
        mainProgress: 1,
        mmprojProgress: 1,
      });
      await writeAppMeta("model", { modelPath: main, mmprojPath: mmproj, quant: "Q4_K_M" });
      await useModelStore.getState().loadIntoMemory();
    } catch (error) {
      set({
        status: "error",
        error: error instanceof Error ? error.message : "Model download failed.",
      });
    }
  },
  loadIntoMemory: async () => {
    const main = modelPath();
    const mmproj = mmprojPath();

    try {
      if (!(await fileExists(main)) || !(await fileExists(mmproj))) {
        set({ status: "missing", error: "Both Gemma files are required before loading." });
        return;
      }

      set({ status: "loading", error: null });
      const { initLlama } = await import("llama.rn");
      const context = await initLlama({
        model: main,
        n_ctx: 4096,
        n_gpu_layers: 0,
      });
      await context.initMultimodal({ path: mmproj, use_gpu: false, image_max_tokens: 512 });
      set({ status: "ready", context, modelPath: main, mmprojPath: mmproj, error: null });
      await writeAppMeta("model", { modelPath: main, mmprojPath: mmproj, quant: "Q4_K_M", loadedAt: new Date().toISOString() });
    } catch (error) {
      set({
        context: null,
        status: "error",
        error: error instanceof Error ? error.message : "Could not load Gemma.",
      });
    }
  },
  unload: async () => {
    const context = useModelStore.getState().context;
    if (context) {
      await context.releaseMultimodal().catch(() => undefined);
      await context.release().catch(() => undefined);
    }
    set({ context: null, status: "idle" });
  },
}));
