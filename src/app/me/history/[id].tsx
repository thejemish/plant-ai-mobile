import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useHistoryStore } from "@/store/use-history";
import { Button, Card, EmptyState, Pill } from "@/ui";

export default function HistoryDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const hydrateScans = useHistoryStore((state) => state.hydrateScans);
  const scan = useHistoryStore((state) => state.recent.find((candidate) => candidate.id === id));

  useEffect(() => {
    void hydrateScans();
  }, [hydrateScans]);

  if (!scan) {
    return (
      <View className="flex-1 bg-background px-5 pb-safe-or-8 pt-safe-or-6">
        <EmptyState
          action={<Button onPress={() => router.replace("/me/history")}>Back to history</Button>}
          title="Scan not found"
          body="It may still be syncing or was removed."
        />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-safe-or-6">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">History</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">
        {scan.predicted_disease_label ?? "Diagnosis pending"}
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {scan.predicted_crop ? <Pill>{scan.predicted_crop}</Pill> : null}
        {scan.severity ? <Pill tone="warning">{scan.severity}</Pill> : null}
        {scan.outcome ? <Pill tone="success">{scan.outcome}</Pill> : null}
      </View>

      <Card className="mt-6">
        <Metric label="Confidence" value={scan.confidence !== null ? `${Math.round(scan.confidence * 100)}%` : "Pending"} />
        <Metric label="Created" value={new Date(scan.created_at).toLocaleString()} />
        <Metric label="Disease ID" value={scan.predicted_disease_id ?? "Not set"} />
      </Card>

      <View className="mt-6 gap-3">
        <Button onPress={() => router.push(`/treatment/${scan.id}`)}>Open treatment plan</Button>
        <Pressable
          className="h-12 items-center justify-center rounded-xl border border-border-strong"
          onPress={() => router.replace("/me/history")}
        >
          <Text className="text-base font-semibold text-foreground">Back to history</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-3 border-t border-divider py-3 first:border-t-0 first:pt-0">
      <Text className="text-sm text-foreground-secondary">{label}</Text>
      <Text className="flex-1 text-right text-sm font-semibold text-foreground">{value}</Text>
    </View>
  );
}
