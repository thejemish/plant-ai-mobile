import React, { type ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";

type ButtonProps = PressableProps & {
  children: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  variant?: ButtonVariant;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  outline: "border border-border-strong bg-transparent",
  ghost: "bg-transparent",
  danger: "bg-danger",
};

const textClass: Record<ButtonVariant, string> = {
  primary: "text-primary-on",
  outline: "text-foreground",
  ghost: "text-foreground",
  danger: "text-foreground-inverse",
};

export function Button({ children, className, disabled, icon, loading, variant = "primary", ...props }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        "h-14 flex-row items-center justify-center gap-2 rounded-xl px-5 active:opacity-85 disabled:opacity-50",
        variantClass[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <ActivityIndicator className={textClass[variant]} /> : icon}
      <Text className={cn("text-base font-semibold", textClass[variant])}>{children}</Text>
    </Pressable>
  );
}
