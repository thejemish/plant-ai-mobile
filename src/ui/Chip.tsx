import React, { type ReactNode } from "react";
import { Pressable, Text, type PressableProps } from "react-native";
import { cn } from "@/lib/cn";

type ChipProps = PressableProps & {
  children: ReactNode;
  selected?: boolean;
};

export function Chip({ children, className, selected, ...props }: ChipProps) {
  return (
    <Pressable
      className={cn(
        "h-8 items-center justify-center rounded-full border px-3",
        selected ? "border-primary bg-primary-muted" : "border-border bg-card",
        className,
      )}
      {...props}
    >
      <Text className={cn("text-sm font-semibold", selected ? "text-primary" : "text-foreground-secondary")}>
        {children}
      </Text>
    </Pressable>
  );
}
