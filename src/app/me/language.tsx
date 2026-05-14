import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Button, Card, Chip } from "@/ui";
import { useSettingsStore, type AppLanguage } from "@/store/use-settings";

const languages: { code: AppLanguage; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી" },
];

export default function MeLanguageRoute() {
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const hydrateSettings = useSettingsStore((state) => state.hydrateSettings);
  const t = useSettingsStore((state) => state.t);

  React.useEffect(() => {
    void hydrateSettings();
  }, [hydrateSettings]);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-safe-or-6">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">Me</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">{t("language.title", "Language")}</Text>
      <Text className="mt-2 text-sm leading-normal text-foreground-secondary">
        {t("language.body", "Choose the language used for local explanations and read-aloud flows.")}
      </Text>

      <Card className="mt-6">
        <View className="gap-3">
          {languages.map((item) => (
            <Button
              key={item.code}
              variant={language === item.code ? "primary" : "outline"}
              onPress={() => void setLanguage(item.code)}
            >
              {item.nativeLabel} · {item.label}
            </Button>
          ))}
        </View>
      </Card>

      <Card className="mt-5">
        <Text className="text-base font-bold text-foreground">Translation source</Text>
        <Text className="mt-2 text-sm leading-normal text-foreground-secondary">
          UI labels use approved rows from the local `translations` table when present, then fall back to the bundled offline copy.
        </Text>
        <View className="mt-3 flex-row gap-2">
          <Chip selected>{language}</Chip>
        </View>
      </Card>
    </ScrollView>
  );
}
