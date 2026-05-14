import React, { type ReactNode } from "react";
import { Text, View } from "react-native";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
};

export function EmptyState({ action, body, icon, title }: EmptyStateProps) {
  return (
    <View className="items-center rounded-lg border border-border bg-card p-6">
      {icon}
      <Text className="mt-3 text-center text-lg font-bold text-foreground">{title}</Text>
      {body ? <Text className="mt-2 text-center text-sm leading-normal text-foreground-secondary">{body}</Text> : null}
      {action ? <View className="mt-4 w-full">{action}</View> : null}
    </View>
  );
}
