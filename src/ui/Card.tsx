import React, { type ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/cn";

type CardProps = ViewProps & {
  children: ReactNode;
};

export function Card({ children, className, ...props }: CardProps) {
  return (
    <View className={cn("rounded-lg border border-border bg-card p-4", className)} {...props}>
      {children}
    </View>
  );
}
