import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useSession } from "@/lib/auth/session";
import { writeAppMeta } from "@/features/onboarding/app-meta";
import { Button, Card, ProgressBar } from "@/ui";
import { useModelStore } from "@/store/use-model";

const files = [
  "crop-disease-finder-gemma4-E2B-it-Q4_K_M.gguf · 3.43 GB",
  "mmproj-crop-disease-finder-gemma4-E2B-it-F16.gguf · 986 MB",
];

export default function ModelOnboardingScreen() {
  const { error, isSigningIn, signIn } = useSession();
  const modelStatus = useModelStore((state) => state.status);
  const modelError = useModelStore((state) => state.error);
  const progress = useModelStore((state) => state.progress);
  const startDownload = useModelStore((state) => state.startDownload);
  const checkLocalFiles = useModelStore((state) => state.checkLocalFiles);
  const busy = modelStatus === "downloading_main" || modelStatus === "downloading_mmproj" || modelStatus === "loading";

  useEffect(() => {
    void checkLocalFiles();
  }, [checkLocalFiles]);

  const continueAsGuest = async () => {
    await writeAppMeta("onboarding_complete", "true");
    const signedIn = await signIn();
    if (signedIn) {
      router.replace("/(tabs)/home");
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-8">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">Model</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">On-device crop assistant</Text>

      <Card className="mt-6 bg-ai-muted">
        <MaterialCommunityIcons className="text-ai" name="brain" size={38} />
        <Text className="mt-4 text-xl font-bold text-foreground">Powered by Gemma 4</Text>
        <Text className="mt-2 text-sm leading-normal text-foreground-secondary">
          The final scan flow downloads both the main model and the vision projector so Gemma can read leaf photos directly.
        </Text>
      </Card>

      <View className="mt-5 gap-3">
        {files.map((file) => (
          <Card key={file}>
            <Text className="text-sm font-semibold text-foreground">{file}</Text>
            <ProgressBar className="mt-3" value={progress} />
          </Card>
        ))}
      </View>

      {error || modelError ? (
        <View className="mt-5 rounded-lg bg-danger-muted p-3">
          <Text className="text-sm leading-normal text-foreground">{error ?? modelError}</Text>
        </View>
      ) : null}

      <View className="mt-8 gap-3">
        <Button loading={busy} onPress={startDownload} variant={modelStatus === "ready" ? "outline" : "primary"}>
          {modelStatus === "ready" ? "Model ready" : "Download model"}
        </Button>
        <Button loading={isSigningIn} onPress={continueAsGuest}>
          {isSigningIn ? "Starting..." : "Continue as guest"}
        </Button>
        <Button variant="outline" onPress={continueAsGuest}>
          Skip & try demo
        </Button>
        {isSigningIn ? <ActivityIndicator className="text-primary" /> : null}
        <Text className="text-center text-xs leading-normal text-foreground-muted">
          Download controls land in Phase 3; Phase 1 verifies the onboarding, auth, and local database path.
        </Text>
      </View>
    </ScrollView>
  );
}
