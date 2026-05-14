import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useScanStore } from "@/features/scan/use-scan";
import { Button, Card, Chip, Pill } from "@/ui";

const steps = [
  {
    key: "crop",
    title: "Crop",
    options: ["rice", "tomato", "potato", "cotton", "wheat", "chilli"],
  },
  {
    key: "part",
    title: "Part affected",
    options: ["leaves", "stem", "fruit", "root", "flower", "whole plant"],
  },
  {
    key: "symptoms",
    title: "Symptoms",
    options: ["spots", "yellowing", "wilting", "powder", "holes", "rot", "curling", "blight"],
  },
  {
    key: "spread",
    title: "Spread",
    options: ["one plant", "several plants", "patch in field", "fast spread", "whole field"],
  },
  {
    key: "weather",
    title: "Recent weather",
    options: ["humid", "rainy", "hot", "cold nights", "dry", "cloudy"],
  },
] as const;

export default function SymptomsRoute() {
  const startSymptomScan = useScanStore((state) => state.startSymptomScan);
  const stage = useScanStore((state) => state.stage);
  const [step, setStep] = useState(0);
  const [crop, setCrop] = useState("tomato");
  const [part, setPart] = useState("leaves");
  const [symptoms, setSymptoms] = useState<string[]>(["spots"]);
  const [spread, setSpread] = useState("several plants");
  const [weather, setWeather] = useState("humid");
  const [notes, setNotes] = useState("");

  const current = steps[step];
  const canGoNext = step < steps.length - 1;
  const selected = useMemo(() => ({ crop, part, spread, weather }), [crop, part, spread, weather]);

  const choose = (value: string) => {
    if (current.key === "crop") {
      setCrop(value);
    } else if (current.key === "part") {
      setPart(value);
    } else if (current.key === "symptoms") {
      setSymptoms((items) => (items.includes(value) ? items.filter((item) => item !== value) : [...items, value]));
    } else if (current.key === "spread") {
      setSpread(value);
    } else {
      setWeather(value);
    }
  };

  const run = async () => {
    if (symptoms.length === 0 && !notes.trim()) {
      Alert.alert("Add symptoms", "Select at least one symptom or add a short note.");
      return;
    }

    try {
      const id = await startSymptomScan({
        crop,
        part,
        symptoms: [...symptoms, notes.trim()].filter(Boolean),
        spread,
        weather,
      });
      router.replace(`/scan/result/${id}`);
    } catch (error) {
      Alert.alert("Symptom scan failed", error instanceof Error ? error.message : "Could not rank symptoms.");
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-safe-or-6">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">No photo</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">Symptom check</Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {steps.map((item, index) => (
          <Pill key={item.key} tone={index === step ? "info" : index < step ? "success" : "default"}>
            {index + 1}
          </Pill>
        ))}
      </View>

      <Card className="mt-6">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary-muted">
            <Ionicons className="text-primary" name="leaf-outline" size={22} />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">{current.title}</Text>
            <Text className="mt-1 text-sm text-foreground-secondary">Choose what best matches the field.</Text>
          </View>
        </View>

        <View className="mt-5 flex-row flex-wrap gap-2">
          {current.options.map((option) => (
            <Chip
              key={option}
              selected={current.key === "symptoms" ? symptoms.includes(option) : selected[current.key] === option}
              onPress={() => choose(option)}
            >
              {option}
            </Chip>
          ))}
        </View>

        {current.key === "symptoms" ? (
          <TextInput
            className="mt-5 min-h-20 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
            multiline
            onChangeText={setNotes}
            placeholder="Add a symptom note"
            placeholderTextColor="#7b8278"
            value={notes}
          />
        ) : null}
      </Card>

      <View className="mt-6 flex-row gap-3">
        <Pressable
          className="h-14 flex-1 items-center justify-center rounded-xl border border-border-strong disabled:opacity-50"
          disabled={step === 0}
          onPress={() => setStep((value) => Math.max(0, value - 1))}
        >
          <Text className="text-base font-semibold text-foreground">Back</Text>
        </Pressable>
        {canGoNext ? (
          <Button className="flex-1" onPress={() => setStep((value) => Math.min(steps.length - 1, value + 1))}>
            Next
          </Button>
        ) : (
          <Button className="flex-1" loading={stage === "retrieving"} onPress={run}>
            Rank disease
          </Button>
        )}
      </View>
    </ScrollView>
  );
}
