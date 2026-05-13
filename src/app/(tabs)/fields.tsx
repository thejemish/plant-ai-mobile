import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

export default function FieldsScreen() {
  return (
    <View className="flex-1 bg-background px-5 pb-8 pt-6">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">Fields</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">My fields</Text>
      <View className="mt-8 rounded-lg border border-border bg-card p-5">
        <MaterialCommunityIcons className="text-primary" name="sprout" size={38} />
        <Text className="mt-4 text-lg font-bold text-foreground">Stage-aware reminders</Text>
        <Text className="mt-2 text-sm leading-normal text-foreground-secondary">
          Field records will drive crop stage, local reminders, and proactive treatment tips.
        </Text>
      </View>
    </View>
  );
}
