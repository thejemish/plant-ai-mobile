import React from "react";
import { Text, View } from "react-native";
import { Card } from "./Card";

type RoutePlaceholderProps = {
  title: string;
  eyebrow?: string;
  body: string;
};

export function RoutePlaceholder({ body, eyebrow = "Plant-AI", title }: RoutePlaceholderProps) {
  return (
    <View className="flex-1 bg-background px-5 pb-safe-or-8 pt-safe-or-6">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">{eyebrow}</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">{title}</Text>
      <Card className="mt-6">
        <Text className="text-base leading-normal text-foreground-secondary">{body}</Text>
      </Card>
    </View>
  );
}
