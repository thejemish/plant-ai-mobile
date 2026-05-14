import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSupastashSyncStatus } from "supastash";
import { useSession } from "@/lib/auth/session";
import { Button, Card, Chip } from "@/ui";
import { useSettingsStore, type ThemePreference } from "@/store/use-settings";
import { useSyncStore } from "@/store/use-sync";

const rows = [
  { key: "me.language", label: "Language", href: "/me/language" },
  { label: "History", href: "/me/history" },
  { key: "me.storage", label: "Storage", href: "/me/storage" },
  { key: "me.about", label: "About", href: "/me/about" },
] as const;

const themes: { labelKey: string; fallback: string; value: ThemePreference }[] = [
  { labelKey: "theme.system", fallback: "System", value: "system" },
  { labelKey: "theme.light", fallback: "Light", value: "light" },
  { labelKey: "theme.dark", fallback: "Dark", value: "dark" },
];

export default function MeScreen() {
  const { session, signOut } = useSession();
  const { syncInfo, syncStatus } = useSupastashSyncStatus();
  const isSyncing = useSyncStore((state) => state.isSyncing);
  const triggerSync = useSyncStore((state) => state.triggerSync);
  const lastManualSyncAt = useSyncStore((state) => state.lastSyncAt);
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const t = useSettingsStore((state) => state.t);
  const lastAutoSyncAt = Math.max(syncInfo.pull.lastSyncedAt ?? 0, syncInfo.push.lastSyncedAt ?? 0);
  const lastSyncLabel = lastManualSyncAt
    ? new Date(lastManualSyncAt).toLocaleString()
    : lastAutoSyncAt
      ? new Date(lastAutoSyncAt).toLocaleString()
      : "Not yet";

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-safe-or-6">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">Me</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">{t("me.title", "Settings")}</Text>

      <View className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
        {rows.map((row) => (
          <Pressable
            className="flex-row items-center justify-between border-t border-divider p-4 first:border-t-0"
            key={row.label}
            onPress={() => router.push(row.href)}
          >
            <Text className="text-base font-semibold text-foreground">
              {"key" in row ? t(row.key, row.label) : row.label}
            </Text>
            <Ionicons className="text-foreground-secondary" name="chevron-forward" size={20} />
          </Pressable>
        ))}
      </View>

      <Card className="mt-5">
        <Text className="text-sm font-semibold text-foreground">{t("theme.title", "Appearance")}</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {themes.map((item) => (
            <Chip key={item.value} selected={theme === item.value} onPress={() => void setTheme(item.value)}>
              {t(item.labelKey, item.fallback)}
            </Chip>
          ))}
        </View>
      </Card>

      <Card className="mt-5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">Sync</Text>
            <Text className="mt-1 text-sm leading-normal text-foreground-secondary">
              {syncInfo.pull.inProgress || syncInfo.push.inProgress ? "Syncing" : syncStatus}
              {" · Last sync "}
              {lastSyncLabel}
            </Text>
          </View>
          <Button className="h-10 px-4" loading={isSyncing} onPress={triggerSync}>
            {isSyncing ? "Syncing" : "Sync now"}
          </Button>
        </View>
      </Card>

      <Card className="mt-5">
        <Text className="text-sm font-semibold text-foreground">Anonymous session</Text>
        <Text className="mt-1 text-sm leading-normal text-foreground-secondary" numberOfLines={1}>
          {session?.user.id ?? "No active session"}
        </Text>
        <Pressable
          accessibilityRole="button"
          className="mt-4 h-11 flex-row items-center justify-center gap-2 rounded-xl border border-border-strong"
          onPress={signOut}
        >
          <Ionicons className="text-foreground" name="log-out-outline" size={20} />
          <Text className="text-base font-semibold text-foreground">Sign out</Text>
        </Pressable>
      </Card>
    </ScrollView>
  );
}
