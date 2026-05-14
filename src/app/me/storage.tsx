import * as FileSystem from "expo-file-system/legacy";
import React from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { wipeAllTables } from "supastash";
import { MODEL_FILE, MMPROJ_FILE, useModelStore } from "@/store/use-model";
import { getSyncDb, SYNC_DB_NAME } from "@/store/db";
import { useActionsStore } from "@/store/use-actions";
import { useHistoryStore } from "@/store/use-history";
import { Button, Card } from "@/ui";

type StorageStats = {
  dbBytes: number | null;
  mainModelBytes: number | null;
  mmprojBytes: number | null;
  scanCount: number;
};

const modelDir = `${FileSystem.documentDirectory ?? ""}models/gemma4-e2b/`;

export default function MeStorageRoute() {
  const loadIntoMemory = useModelStore((state) => state.loadIntoMemory);
  const unload = useModelStore((state) => state.unload);
  const modelStatus = useModelStore((state) => state.status);
  const [stats, setStats] = React.useState<StorageStats>({
    dbBytes: null,
    mainModelBytes: null,
    mmprojBytes: null,
    scanCount: 0,
  });

  const refresh = React.useCallback(async () => {
    const db = await getSyncDb();
    const scanRow = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM scans WHERE deleted_at IS NULL`);
    const dbInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory ?? ""}SQLite/${SYNC_DB_NAME}`);
    const mainInfo = await FileSystem.getInfoAsync(`${modelDir}${MODEL_FILE}`);
    const mmprojInfo = await FileSystem.getInfoAsync(`${modelDir}${MMPROJ_FILE}`);
    setStats({
      dbBytes: dbInfo.exists ? dbInfo.size : null,
      mainModelBytes: mainInfo.exists ? mainInfo.size : null,
      mmprojBytes: mmprojInfo.exists ? mmprojInfo.size : null,
      scanCount: scanRow?.count ?? 0,
    });
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const clearScanHistory = async () => {
    const db = await getSyncDb();
    await db.runAsync(`UPDATE scans SET deleted_at = ?, updated_at = ? WHERE deleted_at IS NULL`, new Date().toISOString(), new Date().toISOString());
    await useHistoryStore.getState().hydrateScans();
    await useActionsStore.getState().hydrateActions();
    await refresh();
  };

  const factoryReset = () => {
    Alert.alert("Factory reset", "This clears local Supastash tables on this device.", [
      { style: "cancel", text: "Cancel" },
      {
        style: "destructive",
        text: "Reset",
        onPress: () => {
          void wipeAllTables().then(refresh);
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-safe-or-6">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">Me</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">Storage</Text>

      <Card className="mt-6">
        <Metric label="SQLite cache" value={formatBytes(stats.dbBytes)} />
        <Metric label="Main Gemma file" value={formatBytes(stats.mainModelBytes)} />
        <Metric label="Vision projector" value={formatBytes(stats.mmprojBytes)} />
        <Metric label="Saved scans" value={String(stats.scanCount)} />
      </Card>

      <Card className="mt-5">
        <Text className="text-base font-bold text-foreground">Model runtime</Text>
        <Text className="mt-2 text-sm text-foreground-secondary">Current status: {modelStatus}</Text>
        <View className="mt-4 gap-3">
          <Button onPress={loadIntoMemory}>Rebuild Gemma context</Button>
          <Button variant="outline" onPress={unload}>Unload model</Button>
        </View>
      </Card>

      <Card className="mt-5">
        <Text className="text-base font-bold text-foreground">Local data</Text>
        <View className="mt-4 gap-3">
          <Button variant="outline" onPress={clearScanHistory}>Clear scan history</Button>
          <Button variant="danger" onPress={factoryReset}>Factory reset local cache</Button>
        </View>
      </Card>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-3 border-t border-divider py-3 first:border-t-0 first:pt-0">
      <Text className="text-sm text-foreground-secondary">{label}</Text>
      <Text className="text-sm font-bold text-foreground">{value}</Text>
    </View>
  );
}

function formatBytes(value: number | null) {
  if (value === null) {
    return "Not present";
  }
  if (value > 1024 * 1024 * 1024) {
    return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }
  if (value > 1024 * 1024) {
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
  }
  return `${Math.round(value / 1024)} KB`;
}
