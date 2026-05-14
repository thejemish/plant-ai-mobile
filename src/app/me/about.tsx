import Constants from "expo-constants";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { CORE_ARCHITECTURE_DECISIONS, DEMO_SCOPE, EMBEDDING_CONTRACT } from "@/lib/architecture-contract";
import { MODEL_FILE, MMPROJ_FILE } from "@/store/use-model";
import { Card, Pill } from "@/ui";

export default function MeAboutRoute() {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-safe-or-6">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">Me</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">About Plant-AI</Text>
      <Text className="mt-2 text-sm leading-normal text-foreground-secondary">
        Frozen implementation contract for the offline farmer-assistant build.
      </Text>

      <Card className="mt-6">
        <Metric label="App version" value={Constants.expoConfig?.version ?? "1.0.0"} />
        <Metric label="Bundle id" value={Constants.expoConfig?.ios?.bundleIdentifier ?? "com.jemishmalaviya.plantai"} />
        <Metric label="Android package" value={Constants.expoConfig?.android?.package ?? "com.jemishmalaviya.plantai"} />
      </Card>

      <Card className="mt-5">
        <Text className="text-base font-bold text-foreground">Gemma model</Text>
        <Text className="mt-2 text-sm leading-normal text-foreground-secondary">{MODEL_FILE}</Text>
        <Text className="mt-1 text-sm leading-normal text-foreground-secondary">{MMPROJ_FILE}</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Pill tone="info">Q4_K_M</Pill>
          <Pill>llama.rn</Pill>
          <Pill>offline</Pill>
        </View>
      </Card>

      <Card className="mt-5">
        <Text className="text-base font-bold text-foreground">Embedding contract</Text>
        <Metric label="Model" value={EMBEDDING_CONTRACT.modelId} />
        <Metric label="Preprocess" value={EMBEDDING_CONTRACT.preprocessId} />
        <Metric label="Vector dimension" value={String(EMBEDDING_CONTRACT.vectorDimension)} />
      </Card>

      <Card className="mt-5">
        <Text className="text-base font-bold text-foreground">Architecture</Text>
        <View className="mt-3 gap-3">
          {CORE_ARCHITECTURE_DECISIONS.map((item) => (
            <View key={item.decision}>
              <Text className="text-sm font-bold text-foreground">{item.decision}</Text>
              <Text className="mt-1 text-sm leading-normal text-foreground-secondary">{item.value}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card className="mt-5">
        <Text className="text-base font-bold text-foreground">Judge demo scope</Text>
        <Text className="mt-2 text-sm leading-normal text-foreground-secondary">
          Bundled demo references cover {DEMO_SCOPE.totalTargetReferenceImages} reference images across{" "}
          {DEMO_SCOPE.crops.length} crop groups and {DEMO_SCOPE.languages.length} languages.
        </Text>
      </Card>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-3 border-t border-divider py-3 first:border-t-0 first:pt-0">
      <Text className="text-sm text-foreground-secondary">{label}</Text>
      <Text className="flex-1 text-right text-sm font-bold text-foreground">{value}</Text>
    </View>
  );
}
