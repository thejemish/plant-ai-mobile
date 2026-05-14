import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { writeAppMeta } from "@/features/onboarding/app-meta";
import { Button } from "@/ui";
import { useSettingsStore, type AppLanguage } from "@/store/use-settings";
import { cn } from "@/lib/cn";

const languages: { code: AppLanguage; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી" },
];

export default function LanguageScreen() {
  const current = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const [selected, setSelected] = useState<AppLanguage>(current);

  const next = async () => {
    await setLanguage(selected);
    await writeAppMeta("onboarding_step", "permissions");
    router.push("/onboarding/permissions");
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-8">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">Language</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">Choose your language</Text>
      <View className="mt-6 gap-3">
        {languages.map((language) => {
          const active = language.code === selected;

          return (
            <Pressable
              className={cn(
                "rounded-lg border p-4",
                active ? "border-primary bg-primary-muted" : "border-border bg-card",
              )}
              key={language.code}
              onPress={() => setSelected(language.code)}
            >
              <Text className={cn("text-lg font-bold", active ? "text-primary" : "text-foreground")}>
                {language.nativeLabel}
              </Text>
              <Text className="mt-1 text-sm text-foreground-secondary">{language.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View className="mt-8">
        <Button onPress={next}>Continue</Button>
      </View>
    </ScrollView>
  );
}
