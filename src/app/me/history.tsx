import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useHistoryStore } from "@/store/use-history";
import { Card, EmptyState, Pill } from "@/ui";

export default function HistoryRoute() {
  const scans = useHistoryStore((state) => state.recent);
  const hydrateScans = useHistoryStore((state) => state.hydrateScans);

  useEffect(() => {
    void hydrateScans();
  }, [hydrateScans]);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-safe-or-6">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">History</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">Scan history</Text>

      <View className="mt-6 gap-3">
        {scans.length > 0 ? (
          scans.map((scan) => (
            <Pressable key={scan.id} onPress={() => router.push(`/me/history/${scan.id}`)}>
              <Card>
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground">
                      {scan.predicted_disease_label ?? "Diagnosis pending"}
                    </Text>
                    <Text className="mt-1 text-sm text-foreground-secondary">
                      {scan.predicted_crop ?? "Unknown crop"} · {scan.severity ?? "unknown"}
                    </Text>
                  </View>
                  {scan.outcome ? <Pill tone="success">{scan.outcome}</Pill> : null}
                </View>
              </Card>
            </Pressable>
          ))
        ) : (
          <EmptyState
            icon={<MaterialCommunityIcons className="text-primary" name="history" size={36} />}
            title="No saved scans"
            body="Saved diagnoses and treatment outcomes will appear here."
          />
        )}
      </View>
    </ScrollView>
  );
}
