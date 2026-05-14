import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, type PressableProps } from "react-native";
import { cn } from "@/lib/cn";

type CheckboxProps = PressableProps & {
  checked: boolean;
};

export function Checkbox({ checked, className, ...props }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      className={cn(
        "h-7 w-7 items-center justify-center rounded-md border",
        checked ? "border-primary bg-primary" : "border-border-strong bg-card",
        className,
      )}
      {...props}
    >
      {checked ? <Ionicons className="text-primary-on" name="checkmark" size={18} /> : null}
    </Pressable>
  );
}
