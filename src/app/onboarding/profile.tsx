import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { writeAppMeta } from "@/features/onboarding/app-meta";
import { Button, Chip, Segmented } from "@/ui";

const crops = ["Tomato", "Rice", "Cotton", "Wheat", "Maize", "Sugarcane"];
const styles = [
  { label: "Organic", value: "organic" },
  { label: "Mixed", value: "mixed" },
  { label: "Conventional", value: "conventional" },
] as const;

export default function ProfileScreen() {
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [farmingStyle, setFarmingStyle] = useState<(typeof styles)[number]["value"]>("mixed");

  const toggleCrop = (crop: string) => {
    setSelectedCrops((state) => (state.includes(crop) ? state.filter((item) => item !== crop) : [...state, crop]));
  };

  const next = async () => {
    await writeAppMeta("profile", { primaryCrops: selectedCrops, farmingStyle });
    await writeAppMeta("onboarding_step", "model");
    router.push("/onboarding/model");
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-8">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">Profile</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">Tune the assistant</Text>

      <Text className="mt-6 text-base font-bold text-foreground">Primary crops</Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {crops.map((crop) => (
          <Chip key={crop} onPress={() => toggleCrop(crop)} selected={selectedCrops.includes(crop)}>
            {crop}
          </Chip>
        ))}
      </View>

      <Text className="mt-7 text-base font-bold text-foreground">Farming style</Text>
      <View className="mt-3">
        <Segmented options={styles} value={farmingStyle} onChange={setFarmingStyle} />
      </View>

      <View className="mt-8">
        <Button onPress={next}>Continue</Button>
      </View>
    </ScrollView>
  );
}
