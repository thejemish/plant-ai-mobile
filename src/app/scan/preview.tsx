import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useScanStore } from "@/features/scan/use-scan";
import { Button } from "@/ui";

export default function ScanPreviewRoute() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const startPhotoScan = useScanStore((state) => state.startPhotoScan);
  const [busy, setBusy] = useState(false);

  const usePhoto = async () => {
    if (!uri) {
      return;
    }

    setBusy(true);
    try {
      const id = await startPhotoScan(uri);
      router.replace({ pathname: "/scan/result/[id]", params: { id } });
    } finally {
      setBusy(false);
    }
  };

  if (!uri) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-5">
        <Text className="text-center text-xl font-bold text-foreground">No photo selected</Text>
        <View className="mt-5 w-full">
          <Button onPress={() => router.replace("/(tabs)/scan")}>Back to scan</Button>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Image className="flex-1" resizeMode="contain" source={{ uri }} />

      <View className="border-t border-border bg-card px-5 pb-safe-or-5 pt-4">
        <Button
          icon={<MaterialCommunityIcons className="text-primary-on" name="check" size={22} />}
          loading={busy}
          onPress={usePhoto}
        >
          Use this photo
        </Button>
        <View className="mt-3 flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            className="h-12 flex-1 items-center justify-center rounded-xl border border-border-strong"
            disabled={busy}
            onPress={() => router.back()}
          >
            <Text className="text-base font-semibold text-foreground">Retake</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="h-12 flex-1 items-center justify-center rounded-xl border border-border-strong"
            disabled={busy}
            onPress={() => router.replace("/(tabs)/scan")}
          >
            <Text className="text-base font-semibold text-foreground">Cancel</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
