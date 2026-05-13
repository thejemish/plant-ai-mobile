import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useSession } from "@/lib/auth/session";

const settings = ["Language", "Sync", "Storage", "Privacy"];

export default function MoreScreen() {
  const { session, signOut } = useSession();

  return (
    <View className="flex-1 bg-background px-5 pb-8 pt-6">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">More</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">Settings</Text>
      <View className="mt-8 overflow-hidden rounded-lg border border-border bg-card">
        {settings.map((item) => (
          <View
            className="flex-row items-center justify-between border-t border-divider p-4 first:border-t-0"
            key={item}
          >
            <Text className="text-base font-semibold text-foreground">{item}</Text>
            <Ionicons className="text-foreground-secondary" name="chevron-forward" size={20} />
          </View>
        ))}
      </View>

      <View className="mt-5 rounded-lg border border-border bg-card p-4">
        <Text className="text-sm font-semibold text-foreground">Anonymous session</Text>
        <Text className="mt-1 text-sm leading-normal text-foreground-secondary" numberOfLines={1}>
          {session?.user.id ?? "No active session"}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={signOut}
          className="mt-4 h-11 flex-row items-center justify-center gap-2 rounded-xl border border-border-strong"
        >
          <Ionicons className="text-foreground" name="log-out-outline" size={20} />
          <Text className="text-base font-semibold text-foreground">Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}
