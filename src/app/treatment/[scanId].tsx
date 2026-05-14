import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import {
  currentUserId,
  loadTreatmentPlan,
  markScanOutcome,
  readoutText,
  stepsForMethod,
  toggleActionStep,
  type TreatmentMethod,
  type TreatmentPlan,
} from "@/features/treatment/service";
import { useActionsStore } from "@/store/use-actions";
import { useFieldsStore } from "@/store/use-fields";
import { useSettingsStore } from "@/store/use-settings";
import { useWeatherStore } from "@/store/use-weather";
import { Button, Card, Checkbox, Pill, Segmented } from "@/ui";

const methodOptions: { label: string; value: TreatmentMethod }[] = [
  { label: "Organic", value: "organic" },
  { label: "Chemical", value: "chemical" },
  { label: "Cultural", value: "cultural" },
  { label: "Prevent", value: "prevention" },
];

export default function TreatmentRoute() {
  const { scanId } = useLocalSearchParams<{ scanId: string }>();
  const actions = useActionsStore((state) => state.actions);
  const hydrateActions = useActionsStore((state) => state.hydrateActions);
  const fields = useFieldsStore((state) => state.fields);
  const hydrateFields = useFieldsStore((state) => state.hydrateFields);
  const advisory = useWeatherStore((state) => state.advisory);
  const hydrateWeather = useWeatherStore((state) => state.hydrateWeather);
  const language = useSettingsStore((state) => state.language);
  const [method, setMethod] = useState<TreatmentMethod>("organic");
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const next = await loadTreatmentPlan(scanId);
      if (mounted) {
        setPlan(next);
        setLoading(false);
      }
    }
    void load();
    void hydrateActions();
    void hydrateFields();
    return () => {
      mounted = false;
    };
  }, [hydrateActions, hydrateFields, scanId]);

  useEffect(() => {
    void hydrateWeather(fields);
  }, [fields, hydrateWeather]);

  const doneKeys = useMemo(
    () => new Set(actions.filter((action) => action.scan_id === scanId && action.done_at).map((action) => action.step_key)),
    [actions, scanId],
  );

  if (loading || !plan) {
    return (
      <View className="flex-1 justify-center bg-background px-5">
        <Text className="text-center text-base text-foreground-secondary">Loading treatment plan...</Text>
      </View>
    );
  }

  const todaySteps = stepsForMethod(plan.steps, "immediate");
  const methodSteps = stepsForMethod(plan.steps, method);
  const preventSteps = stepsForMethod(plan.steps, "prevention");
  const hasChemical = plan.treatments.some((row) => row.method === "chemical");

  const toggleStep = async (stepKey: string, label: string, treatmentId: string | null) => {
    const userId = await currentUserId();
    if (!userId) {
      Alert.alert("Sign in required", "Start a guest session before saving progress.");
      return;
    }
    await toggleActionStep({
      done: !doneKeys.has(stepKey),
      fieldId: plan.scan?.field_id ?? null,
      label,
      scanId,
      stepKey,
      treatmentId,
      userId,
    });
  };

  const readAloud = () => {
    void Speech.stop();
    Speech.speak(readoutText(plan, method), { language });
  };

  const setOutcome = async (outcome: "worked" | "partial" | "didnt_work") => {
    await markScanOutcome(scanId, outcome);
    Alert.alert("Outcome saved", "This feedback will sync with your scan history.");
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-safe-or-6">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">Treatment</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">
        {plan.scan?.predicted_disease_label ?? "Action plan"}
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {plan.scan?.predicted_crop ? <Pill>{plan.scan.predicted_crop}</Pill> : null}
        {plan.scan?.severity ? <Pill tone="warning">{plan.scan.severity}</Pill> : null}
        {plan.scan?.outcome ? <Pill tone="success">{plan.scan.outcome}</Pill> : null}
      </View>

      <Card className="mt-6">
        <Text className="text-base font-bold text-foreground">Why this plan</Text>
        <Text className="mt-2 text-sm leading-normal text-foreground-secondary">
          Steps come from curated treatment records and are filtered by disease, crop, severity, and method.
        </Text>
      </Card>

      <Card className="mt-5 bg-info-muted">
        <View className="flex-row gap-3">
          <MaterialCommunityIcons className="text-info" name="weather-partly-cloudy" size={24} />
          <View className="flex-1">
            <Text className="text-base font-bold text-foreground">Spray-risk advisory</Text>
            <Text className="mt-1 text-sm leading-normal text-foreground-secondary">
              {advisory?.summary ?? "Loading local weather advisory..."}
            </Text>
          </View>
        </View>
      </Card>

      <View className="mt-6">
        <Segmented options={methodOptions} value={method} onChange={setMethod} />
      </View>

      <Checklist title="Today" steps={todaySteps} doneKeys={doneKeys} onToggle={toggleStep} />
      <Checklist title="This week" steps={methodSteps} doneKeys={doneKeys} onToggle={toggleStep} />
      <Checklist title="Prevent" steps={preventSteps} doneKeys={doneKeys} onToggle={toggleStep} />

      <View className="mt-6 gap-3">
        {hasChemical ? (
          <Button
            icon={<MaterialCommunityIcons className="text-primary-on" name="calculator-variant-outline" size={21} />}
            onPress={() => router.push(`/treatment/${scanId}/dosage`)}
          >
            Dosage calculator
          </Button>
        ) : null}
        <Button variant="outline" onPress={readAloud}>
          Read aloud
        </Button>
      </View>

      <Card className="mt-6">
        <Text className="text-base font-bold text-foreground">I tried this</Text>
        <View className="mt-4 flex-row gap-2">
          <OutcomeButton label="Worked" onPress={() => setOutcome("worked")} />
          <OutcomeButton label="Partial" onPress={() => setOutcome("partial")} />
          <OutcomeButton label="Did not" onPress={() => setOutcome("didnt_work")} />
        </View>
      </Card>
    </ScrollView>
  );
}

function Checklist({
  doneKeys,
  onToggle,
  steps,
  title,
}: {
  doneKeys: Set<string>;
  onToggle: (stepKey: string, label: string, treatmentId: string | null) => void;
  steps: TreatmentPlan["steps"];
  title: string;
}) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <Card className="mt-5">
      <Text className="mb-3 text-lg font-bold text-foreground">{title}</Text>
      {steps.slice(0, 6).map((step) => (
        <View className="mb-3 flex-row gap-3" key={step.key}>
          <Checkbox checked={doneKeys.has(step.key)} onPress={() => onToggle(step.key, step.label, step.treatmentId)} />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">{step.title}</Text>
            <Text className="mt-1 text-sm leading-normal text-foreground-secondary">{step.label}</Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

function OutcomeButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable className="h-10 flex-1 items-center justify-center rounded-xl border border-border-strong px-2" onPress={onPress}>
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
    </Pressable>
  );
}
