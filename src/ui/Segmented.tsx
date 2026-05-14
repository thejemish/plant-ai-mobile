import React from "react";
import { Pressable, Text, View } from "react-native";
import { cn } from "@/lib/cn";

type SegmentedOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentedProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function Segmented<T extends string>({ onChange, options, value }: SegmentedProps<T>) {
  return (
    <View className="flex-row rounded-xl border border-border bg-surface p-1">
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            className={cn("h-10 flex-1 items-center justify-center rounded-lg", selected && "bg-card")}
            key={option.value}
            onPress={() => onChange(option.value)}
          >
            <Text className={cn("text-sm font-semibold", selected ? "text-foreground" : "text-foreground-muted")}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
