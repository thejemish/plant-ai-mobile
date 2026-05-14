import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
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
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
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

  const capturePhoto = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.9 });
    if (photo?.uri) {
      router.push({ pathname: "/scan/preview", params: { uri: photo.uri } });
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      router.push({ pathname: "/scan/preview", params: { uri: result.assets[0].uri } });
    }
  };

  if (!permission?.granted) {
    return (
      <View className="flex-1 justify-center bg-background px-5 pb-safe-or-8 pt-safe-or-6">
        <View className="items-center rounded-2xl bg-primary-muted p-8">
          <MaterialCommunityIcons className="text-primary" name="camera-outline" size={60} />
          <Text className="mt-4 text-center text-2xl font-bold text-foreground">Camera access</Text>
          <Text className="mt-2 text-center text-sm leading-normal text-foreground-secondary">
            Camera access lets Plant-AI capture a leaf and send it to Gemma vision on device.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          className="mt-6 h-14 flex-row items-center justify-center gap-2 rounded-xl bg-primary px-5"
          onPress={requestPermission}
        >
          <Text className="text-base font-semibold text-primary-on">Allow camera</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="mt-3 h-12 flex-row items-center justify-center gap-2 rounded-xl border border-border-strong px-5"
          onPress={pickPhoto}
        >
          <Text className="text-base font-semibold text-foreground">Pick from gallery</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <CameraView ref={cameraRef} className="flex-1" facing="back">
        <View className="flex-1 justify-between px-5 pb-safe-or-8 pt-safe-or-6">
          <View className="flex-row items-center justify-between">
            <Text className="rounded-full bg-overlay px-3 py-1 text-sm font-semibold uppercase text-foreground-inverse">
              Scan
            </Text>
            <Pressable
              accessibilityRole="button"
              className="h-10 rounded-full bg-overlay px-4 items-center justify-center"
              onPress={() => router.push("/scan/symptoms")}
            >
              <Text className="text-sm font-semibold text-foreground-inverse">No photo?</Text>
            </Pressable>
          </View>

          <View className="items-center">
            <View className="h-72 w-56 rounded-full border-2 border-primary" />
            <Text className="mt-4 rounded-full bg-overlay px-4 py-2 text-sm font-semibold text-foreground-inverse">
              Frame one leaf
            </Text>
          </View>

          <View className="gap-3">
            <View className="rounded-lg bg-overlay p-3">
              <View className="flex-row items-center justify-between gap-3">
                <Text className="flex-1 text-sm font-semibold text-foreground-inverse">Current step</Text>
                <Text className="text-sm text-foreground-inverse">{stageText[stage]}</Text>
              </View>
              {error ? <Text className="mt-2 text-sm text-danger">{error}</Text> : null}
            </View>

            <View className="flex-row items-center justify-between">
              <Pressable
                accessibilityRole="button"
                className="h-14 w-14 items-center justify-center rounded-full bg-overlay"
                disabled={busy}
                onPress={pickPhoto}
              >
                <MaterialCommunityIcons className="text-foreground-inverse" name="image-multiple-outline" size={26} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                className="h-20 w-20 items-center justify-center rounded-full bg-primary"
                disabled={busy}
                onPress={capturePhoto}
              >
                <View className="h-14 w-14 rounded-full border-4 border-primary-on" />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                className="h-14 w-14 items-center justify-center rounded-full bg-overlay"
                disabled={busy}
                onPress={() => runScan("candidate")}
              >
                <MaterialCommunityIcons className="text-foreground-inverse" name="test-tube" size={24} />
              </Pressable>
            </View>
          </View>
        </View>
      </CameraView>

      <View className="border-t border-border bg-card px-5 py-3">
        <Text className="text-center text-xs leading-normal text-foreground-muted">
          Evidence uses {EMBEDDING_CONTRACT.modelId}; Gemma vision runs when the model is loaded.
        </Text>
      </View>
    </View>
  );
}
