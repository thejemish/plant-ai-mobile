import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Button, Card } from "@/ui";
import { writeAppMeta } from "@/features/onboarding/app-meta";

const pillars = [
  { icon: "image-search-outline", title: "Scan", body: "Capture a leaf or use the demo path offline." },
  { icon: "brain", title: "Diagnose", body: "Gemma vision reads the photo on your phone." },
  { icon: "clipboard-check-outline", title: "Treat", body: "Curated treatment rules become step-by-step actions." },
] as const;

export default function WelcomeScreen() {
  const next = async () => {
    await writeAppMeta("onboarding_step", "language");
    router.push("/onboarding/language");
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="flex-grow px-5 pb-safe-or-8 pt-8">
      <View className="flex-1 justify-between gap-8">
        <View className="gap-6">
          <View className="h-24 w-24 items-center justify-center rounded-2xl bg-primary-muted">
            <MaterialCommunityIcons className="text-primary" name="sprout-outline" size={54} />
          </View>
          <View>
            <Text className="text-sm font-semibold uppercase text-foreground-secondary">Plant-AI</Text>
            <Text className="mt-2 text-4xl font-bold leading-tight text-foreground">Your pocket agronomist.</Text>
            <Text className="mt-3 text-base leading-normal text-foreground-secondary">
              Detect crop disease, understand the risk, and carry a field-ready action plan offline.
            </Text>
          </View>
          <View className="gap-3">
            {pillars.map((item) => (
              <Card className="flex-row gap-3" key={item.title}>
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary-muted">
                  <MaterialCommunityIcons className="text-primary" name={item.icon} size={23} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-foreground">{item.title}</Text>
                  <Text className="mt-1 text-sm leading-normal text-foreground-secondary">{item.body}</Text>
                </View>
              </Card>
            ))}
          </View>
        </View>
        <Button onPress={next}>Continue</Button>
      </View>
    </ScrollView>
  );
}
