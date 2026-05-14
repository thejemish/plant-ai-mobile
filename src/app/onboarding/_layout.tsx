import { Stack, usePathname } from "expo-router";
import React from "react";
import { View } from "react-native";
import { ProgressBar } from "@/ui";

const steps = ["welcome", "language", "permissions", "profile", "model"];

export default function OnboardingLayout() {
  const pathname = usePathname();
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => pathname.endsWith(step)),
  );

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pt-safe-or-5">
        <ProgressBar value={(activeIndex + 1) / steps.length} />
        <View className="mt-3 flex-row gap-2">
          {steps.map((step, index) => (
            <View
              className={index <= activeIndex ? "h-2 flex-1 rounded-full bg-primary" : "h-2 flex-1 rounded-full bg-divider"}
              key={step}
            />
          ))}
        </View>
      </View>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
