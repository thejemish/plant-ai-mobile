import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { Button, Card, ProgressBar } from "@/ui";
import { MMPROJ_FILE, MODEL_FILE, useModelStore } from "@/store/use-model";

export default function ModelSetupRoute() {
  const status = useModelStore((state) => state.status);
  const error = useModelStore((state) => state.error);
  const progress = useModelStore((state) => state.progress);
  const mainProgress = useModelStore((state) => state.mainProgress);
  const mmprojProgress = useModelStore((state) => state.mmprojProgress);
  const startDownload = useModelStore((state) => state.startDownload);
  const loadIntoMemory = useModelStore((state) => state.loadIntoMemory);
  const checkLocalFiles = useModelStore((state) => state.checkLocalFiles);
  const busy = status === "downloading_main" || status === "downloading_mmproj" || status === "loading";

  useEffect(() => {
    void checkLocalFiles();
  }, [checkLocalFiles]);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-safe-or-6">
      <Card className="bg-ai-muted">
        <MaterialCommunityIcons className="text-ai" name="brain" size={38} />
        <Text className="mt-4 text-2xl font-bold text-foreground">On-device crop assistant</Text>
        <Text className="mt-2 text-sm leading-normal text-foreground-secondary">
          Gemma vision needs the main GGUF plus the mmproj projector before it can read leaf photos offline.
        </Text>
      </Card>

      <View className="mt-6 gap-3">
        <FileRow label={MODEL_FILE} progress={mainProgress} size="3.43 GB" />
        <FileRow label={MMPROJ_FILE} progress={mmprojProgress} size="986 MB" />
      </View>

      <Card className="mt-5">
        <Text className="text-sm font-semibold text-foreground">Status</Text>
        <Text className="mt-1 text-base text-foreground-secondary">{status.replaceAll("_", " ")}</Text>
        <ProgressBar className="mt-4" value={progress} />
        {error ? <Text className="mt-3 text-sm text-danger">{error}</Text> : null}
      </Card>

      <View className="mt-6 gap-3">
        <Button loading={busy} onPress={status === "idle" ? loadIntoMemory : startDownload}>
          {status === "ready" ? "Ready" : status === "idle" ? "Load into memory" : "Start download"}
        </Button>
        <Button variant="outline" onPress={() => router.back()}>
          Close
        </Button>
      </View>
    </ScrollView>
  );
}

function FileRow({ label, progress, size }: { label: string; progress: number; size: string }) {
  return (
    <Card>
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <Text className="mt-1 text-xs text-foreground-muted">{size}</Text>
      <ProgressBar className="mt-3" value={progress} />
    </Card>
  );
}
