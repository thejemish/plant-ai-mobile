import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { writeAppMeta } from "@/features/onboarding/app-meta";
import { Button, Card, Pill } from "@/ui";

const permissionRows = [
  { key: "camera", icon: "camera-outline", label: "Camera", required: true },
  { key: "storage", icon: "database-outline", label: "Storage", required: true },
  { key: "photos", icon: "image-multiple-outline", label: "Photo library", required: false },
  { key: "location", icon: "map-marker-outline", label: "Location", required: false },
  { key: "notifications", icon: "bell-outline", label: "Notifications", required: false },
] as const;

export default function PermissionsScreen() {
  const [granted, setGranted] = useState<Record<string, boolean>>({});
  const canContinue = Boolean(granted.camera && granted.storage);

  const next = async () => {
    await writeAppMeta("permissions", granted);
    await writeAppMeta("onboarding_step", "profile");
    router.push("/onboarding/profile");
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-8">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">Permissions</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">Prepare the phone</Text>
      <View className="mt-6 gap-3">
        {permissionRows.map((row) => {
          const isGranted = Boolean(granted[row.key]);

          return (
            <Card className="flex-row items-center gap-3" key={row.key}>
              <MaterialCommunityIcons className="text-primary" name={row.icon} size={25} />
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground">{row.label}</Text>
                <Text className="mt-1 text-xs text-foreground-secondary">
                  {row.required ? "Required" : "Optional"}
                </Text>
              </View>
              <Pressable
                className="h-9 justify-center rounded-full border border-border-strong px-3"
                onPress={() => setGranted((state) => ({ ...state, [row.key]: true }))}
              >
                <Text className="text-sm font-semibold text-foreground">{isGranted ? "Granted" : "Allow"}</Text>
              </Pressable>
              <Pill tone={isGranted ? "success" : row.required ? "warning" : "default"}>
                {isGranted ? "Ready" : row.required ? "Needed" : "Later"}
              </Pill>
            </Card>
          );
        })}
      </View>
      <View className="mt-8 gap-3">
        <Button disabled={!canContinue} onPress={next}>
          Continue
        </Button>
        {!canContinue ? (
          <Text className="text-center text-xs leading-normal text-foreground-muted">
            Camera and storage are required for the offline diagnosis demo.
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
