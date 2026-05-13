import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { EMBEDDING_CONTRACT } from "@/lib/architecture-contract";
import { useScanStore } from "@/features/scan/use-scan";

const stageText = {
  idle: "Ready",
  quality: "Checking image quality",
  embedding: "Generating local embedding",
  searching: "Searching offline references",
  retrieving: "Retrieving treatments and citations",
  complete: "Complete",
  error: "Scan failed",
} as const;

export default function ScanScreen() {
  const stage = useScanStore((state) => state.stage);
  const error = useScanStore((state) => state.error);
  const startDemoScan = useScanStore((state) => state.startDemoScan);
  const startLowConfidenceDemoScan = useScanStore((state) => state.startLowConfidenceDemoScan);
  const [busy, setBusy] = useState(false);

  const runScan = async (mode: "candidate" | "uncertain") => {
    setBusy(true);

    try {
      const id = mode === "candidate" ? await startDemoScan() : await startLowConfidenceDemoScan();
      router.push({ pathname: "/scan/result/[id]", params: { id } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 justify-between bg-background px-5 pb-safe-or-8 pt-safe-or-6">
      <View className="gap-3">
        <Text className="text-sm font-semibold uppercase text-foreground-secondary">Scan</Text>
        <Text className="text-3xl font-bold text-foreground">Offline leaf diagnosis</Text>
        <Text className="text-base leading-normal text-foreground-secondary">
          The phase 5 path now checks image quality, searches local MobileCLIP reference embeddings,
          aggregates disease candidates, and returns evidence without network access.
        </Text>
      </View>

      <View className="gap-4 rounded-lg border border-border bg-card p-5">
        <View className="items-center rounded-lg bg-primary-muted p-8">
          <MaterialCommunityIcons className="text-primary" name="leaf-circle-outline" size={76} />
          <Text className="mt-4 text-center text-lg font-semibold text-foreground">
            Offline scan core
          </Text>
          <Text className="mt-2 text-center text-sm leading-normal text-foreground-secondary">
            {EMBEDDING_CONTRACT.modelId} with {EMBEDDING_CONTRACT.vectorDimension}-dimension
            L2 vectors and cosine top-K retrieval.
          </Text>
        </View>

        <View className="rounded-lg border border-border bg-surface p-4">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 text-sm font-semibold text-foreground">Current step</Text>
            <Text className="text-sm text-foreground-secondary">{stageText[stage]}</Text>
          </View>
          {error ? <Text className="mt-2 text-sm text-danger">{error}</Text> : null}
        </View>
      </View>

      <View className="gap-3">
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => runScan("candidate")}
          className="h-14 flex-row items-center justify-center gap-2 rounded-xl bg-primary px-5 active:opacity-85 disabled:opacity-50"
        >
          <MaterialCommunityIcons className="text-primary-on" name="image-search-outline" size={22} />
          <Text className="text-base font-semibold text-primary-on">Run offline test scan</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => runScan("uncertain")}
          className="h-12 flex-row items-center justify-center gap-2 rounded-xl border border-border-strong px-5 active:opacity-85 disabled:opacity-50"
        >
          <MaterialCommunityIcons className="text-foreground" name="alert-circle-outline" size={20} />
          <Text className="text-base font-semibold text-foreground">Test uncertain result</Text>
        </Pressable>

        <Text className="text-center text-xs leading-normal text-foreground-muted">
          Native capture and gallery selection can plug into startScanFromEmbedding once the camera
          preprocessing bridge supplies the query tensor.
        </Text>
      </View>
    </View>
  );
}
