import React from "react";
import { View } from "react-native";
import { cn } from "@/lib/cn";

type ProgressBarProps = {
  value: number;
  className?: string;
};

export function ProgressBar({ className, value }: ProgressBarProps) {
  const width = `${Math.max(0, Math.min(1, value)) * 100}%` as `${number}%`;

  return (
    <View className={cn("h-1.5 overflow-hidden rounded-full bg-divider", className)}>
      <View className="h-full rounded-full bg-primary" style={{ width }} />
    </View>
  );
}
