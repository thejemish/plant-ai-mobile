import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import {
  DEMO_SCOPE,
  EMBEDDING_CONTRACT,
  CORE_ARCHITECTURE_DECISIONS,
  SUPABASE_TABLE_CONTRACT,
} from "@/lib/architecture-contract";

const statusItems = [
  { label: "Visual classifier", value: "Local MobileCLIP image embedding similarity" },
  {
    label: "Embedding contract",
    value: `${EMBEDDING_CONTRACT.modelId}, ${EMBEDDING_CONTRACT.vectorDimension} dimensions`,
  },
  { label: "Reference tables", value: `${SUPABASE_TABLE_CONTRACT.length} offline sync tables` },
  {
    label: "Demo scope",
    value: `${DEMO_SCOPE.crops.length} crops, ${DEMO_SCOPE.totalTargetReferenceImages} reference images`,
  },
  { label: "Gemma role", value: "Explain evidence and answer follow-up questions" },
];

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-6 px-5 pb-8 pt-6">
        <View className="gap-2">
          <Text className="text-sm font-semibold uppercase text-foreground-secondary">Plant-AI</Text>
          <Text className="text-3xl font-bold text-foreground">
            Offline crop help, ready for the field.
          </Text>
          <Text className="text-base leading-normal text-foreground-secondary">
            Scan leaves, ask crop questions, and keep field notes grounded in the local knowledge
            base.
          </Text>
        </View>

        <View className="rounded-lg border border-border bg-card p-4">
          <View className="mb-3 flex-row items-center gap-2">
            <MaterialCommunityIcons className="text-primary" name="progress-check" size={22} />
            <Text className="text-lg font-bold text-foreground">Build readiness</Text>
          </View>
          {statusItems.map((item) => (
            <View
              className="border-t border-divider py-3 first:border-t-0"
              key={item.label}
            >
              <Text className="text-sm font-semibold text-foreground">{item.label}</Text>
              <Text className="mt-1 text-sm text-foreground-secondary">{item.value}</Text>
            </View>
          ))}
        </View>

        <View className="rounded-lg bg-primary-muted p-4">
          <Text className="text-base font-bold text-foreground">Frozen decisions</Text>
          {CORE_ARCHITECTURE_DECISIONS.map((item) => (
            <View className="mt-3" key={item.decision}>
              <Text className="text-sm font-semibold text-foreground">{item.decision}</Text>
              <Text className="mt-1 text-sm leading-normal text-foreground-secondary">{item.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
