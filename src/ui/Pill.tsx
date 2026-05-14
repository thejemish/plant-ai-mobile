import React, { type ReactNode } from "react";
import { Text, View, type ViewProps } from "react-native";
import { cn } from "@/lib/cn";

type PillTone = "default" | "success" | "warning" | "danger" | "info";

type PillProps = ViewProps & {
  children: ReactNode;
  tone?: PillTone;
};

const toneClass: Record<PillTone, string> = {
  default: "bg-surface text-foreground-secondary",
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  danger: "bg-danger-muted text-danger",
  info: "bg-info-muted text-info",
};

export function Pill({ children, className, tone = "default", ...props }: PillProps) {
  const [bg, text] = toneClass[tone].split(" ");

  return (
    <View className={cn("self-start rounded-full px-3 py-1", bg, className)} {...props}>
      <Text className={cn("text-xs font-semibold", text)}>{children}</Text>
    </View>
  );
}
