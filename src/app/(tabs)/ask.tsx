import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

export default function AskScreen() {
  return (
    <View className="flex-1 bg-background px-5 pb-8 pt-6">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">Ask</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">Crop questions</Text>
      <View className="mt-8 rounded-lg border border-border bg-card p-5">
        <Ionicons className="text-primary" name="chatbubbles-outline" size={34} />
        <Text className="mt-4 text-lg font-bold text-foreground">Guide-grounded answers</Text>
        <Text className="mt-2 text-sm leading-normal text-foreground-secondary">
          This tab is reserved for text and voice questions backed by local guide chunks and Gemma.
        </Text>
      </View>
    </View>
  );
}
