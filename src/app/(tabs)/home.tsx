import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSupastashSyncStatus } from "supastash";
import { Card, EmptyState, Pill } from "@/ui";
import { useActionsStore } from "@/store/use-actions";
import { useFieldsStore } from "@/store/use-fields";
import { useHistoryStore } from "@/store/use-history";
import { useModelStore } from "@/store/use-model";
import { useWeatherStore } from "@/store/use-weather";

export default function HomeScreen() {
  const modelStatus = useModelStore((state) => state.status);
  const recent = useHistoryStore((state) => state.recent);
  const hydrateScans = useHistoryStore((state) => state.hydrateScans);
  const fields = useFieldsStore((state) => state.fields);
  const hydrateFields = useFieldsStore((state) => state.hydrateFields);
  const actions = useActionsStore((state) => state.actions);
  const hydrateActions = useActionsStore((state) => state.hydrateActions);
  const advisory = useWeatherStore((state) => state.advisory);
  const hydrateWeather = useWeatherStore((state) => state.hydrateWeather);
  const { syncInfo, syncStatus } = useSupastashSyncStatus();
  const incompleteActions = actions.filter((action) => !action.done_at).slice(0, 3);
  const syncLabel =
    syncInfo.pull.inProgress || syncInfo.push.inProgress
      ? "Syncing"
      : syncStatus === "error"
        ? "Needs check"
        : "Up to date";

  useEffect(() => {
    void hydrateScans();
    void hydrateFields();
    void hydrateActions();
  }, [hydrateActions, hydrateFields, hydrateScans]);

  useEffect(() => {
    void hydrateWeather(fields);
  }, [fields, hydrateWeather]);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-safe-or-6">
      <View className="gap-6">
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Text className="text-sm font-semibold uppercase text-foreground-secondary">Plant-AI</Text>
            <Text className="mt-1 text-3xl font-bold text-foreground">Daily assistant</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-xl border border-border bg-card"
            onPress={() => router.push("/(tabs)/me")}
          >
            <MaterialCommunityIcons className="text-foreground" name="cog-outline" size={22} />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          className="rounded-2xl bg-primary p-5 active:opacity-85"
          onPress={() => router.push("/(tabs)/scan")}
        >
          <MaterialCommunityIcons className="text-primary-on" name="image-search-outline" size={34} />
          <Text className="mt-4 text-2xl font-bold text-primary-on">Scan a leaf</Text>
          <Text className="mt-1 text-base text-primary-on">Diagnose with Gemma vision and local evidence.</Text>
        </Pressable>

        <View className="flex-row gap-3">
          <Card className="flex-1">
            <Text className="text-xs font-semibold uppercase text-foreground-muted">Model</Text>
            <Text className="mt-2 text-base font-bold text-foreground">
              {modelStatus === "ready" ? "Ready" : "Setup"}
            </Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-xs font-semibold uppercase text-foreground-muted">Sync</Text>
            <Text className="mt-2 text-base font-bold text-foreground">{syncLabel}</Text>
          </Card>
          <Card className="flex-1">
            <Text className="text-xs font-semibold uppercase text-foreground-muted">Mode</Text>
            <Text className="mt-2 text-base font-bold text-foreground">Offline</Text>
          </Card>
        </View>

        <Card className="bg-info-muted">
          <View className="flex-row gap-3">
            <MaterialCommunityIcons className="text-info" name="weather-partly-cloudy" size={24} />
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">Weather advisory</Text>
              <Text className="mt-1 text-sm leading-normal text-foreground-secondary">
                {advisory?.summary ?? "Loading local spray-risk forecast..."}
              </Text>
              {advisory?.rainProbability !== null && advisory?.rainProbability !== undefined ? (
                <Text className="mt-2 text-xs font-semibold uppercase text-info">
                  Rain {Math.round(advisory.rainProbability)}% · max {advisory.maxTempC ?? "--"}C
                </Text>
              ) : null}
            </View>
          </View>
        </Card>

        <View className="gap-3">
          <Text className="text-xl font-bold text-foreground">Action checklist</Text>
          {incompleteActions.length > 0 ? (
            incompleteActions.map((action) => (
              <Card className="flex-row items-center justify-between gap-3" key={action.id}>
                <Text className="flex-1 text-sm font-semibold text-foreground">
                  {action.step_label ?? action.step_key}
                </Text>
                <Pill tone="warning">Open</Pill>
              </Card>
            ))
          ) : (
            <EmptyState title="No open actions" body="Treatment steps will appear here after the first diagnosis." />
          )}
        </View>

        <View className="gap-3">
          <Text className="text-xl font-bold text-foreground">Recent scans</Text>
          {recent.length > 0 ? (
            recent.slice(0, 5).map((scan) => (
              <Pressable key={scan.id} onPress={() => router.push(`/me/history/${scan.id}`)}>
                <Card>
                  <Text className="text-base font-bold text-foreground">
                    {scan.predicted_disease_label ?? "Diagnosis pending"}
                  </Text>
                  <Text className="mt-1 text-sm text-foreground-secondary">
                    {scan.predicted_crop ?? "Unknown crop"} · {scan.severity ?? "Severity pending"}
                  </Text>
                </Card>
              </Pressable>
            ))
          ) : (
            <EmptyState title="No scans yet" body="Tap Scan a leaf to start the first offline diagnosis." />
          )}
        </View>

        <View className="gap-3">
          <Text className="text-xl font-bold text-foreground">Field watchlist</Text>
          {fields.length > 0 ? (
            fields.slice(0, 5).map((field) => (
              <Card key={field.id}>
                <Text className="text-base font-bold text-foreground">{field.name}</Text>
                <Text className="mt-1 text-sm text-foreground-secondary">
                  {field.crop ?? "Crop not set"}
                  {field.currentStage ? ` · ${field.currentStage.label}` : " · Stage pending"}
                </Text>
              </Card>
            ))
          ) : (
            <EmptyState title="No fields yet" body="Fields land in Phase 2 and will drive crop-stage planning." />
          )}
        </View>
      </View>
    </ScrollView>
  );
}
