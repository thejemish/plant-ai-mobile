import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { loadTreatmentPlan, parseDosage, type TreatmentPlan } from "@/features/treatment/service";
import { Card } from "@/ui";

export default function DosageRoute() {
  const { scanId } = useLocalSearchParams<{ scanId: string }>();
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [tankLiters, setTankLiters] = useState("15");
  const [areaAcres, setAreaAcres] = useState("1");

  useEffect(() => {
    void loadTreatmentPlan(scanId).then(setPlan);
  }, [scanId]);

  const chemical = plan?.treatments.find((row) => row.method === "chemical") ?? null;
  const dosage = parseDosage(chemical?.dosage ?? null);
  const computed = useMemo(() => {
    const tank = Number(tankLiters);
    const area = Number(areaAcres);
    if (!dosage?.amount || !Number.isFinite(tank) || !Number.isFinite(area)) {
      return null;
    }
    const tanksPerAcre = dosage.waterLiters / tank;
    const perTank = dosage.amount / tanksPerAcre;
    const total = dosage.amount * area;
    const harvestDate =
      dosage.phiDays !== null
        ? new Date(Date.now() + dosage.phiDays * 86_400_000).toLocaleDateString()
        : null;
    return { perTank, total, harvestDate };
  }, [areaAcres, dosage, tankLiters]);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-safe-or-6">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">Dosage</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">Calculator</Text>

      <Card className="mt-6">
        <Text className="text-base font-bold text-foreground">{chemical?.title ?? "Chemical treatment"}</Text>
        <Text className="mt-2 text-sm leading-normal text-foreground-secondary">
          Calculations use curated `disease_treatments.dosage` JSON. If dosage data is missing, ask an agronomist before mixing.
        </Text>
      </Card>

      <View className="mt-6 gap-4">
        <NumberInput label="Tank size (L)" value={tankLiters} onChangeText={setTankLiters} />
        <NumberInput label="Area (acres)" value={areaAcres} onChangeText={setAreaAcres} />
      </View>

      <Card className="mt-6">
        <Text className="text-base font-bold text-foreground">Mixing output</Text>
        {computed && dosage ? (
          <View className="mt-4 gap-3">
            <Metric label="Per tank" value={`${computed.perTank.toFixed(2)} ${dosage.unit}`} />
            <Metric label="Total product" value={`${computed.total.toFixed(2)} ${dosage.unit}`} />
            <Metric label="Water per acre" value={`${dosage.waterLiters} L`} />
            <Metric label="Safe harvest after" value={computed.harvestDate ?? "PHI not provided"} />
          </View>
        ) : (
          <Text className="mt-3 text-sm leading-normal text-foreground-secondary">
            No structured dosage is available for this treatment yet.
          </Text>
        )}
      </Card>
    </ScrollView>
  );
}

function NumberInput({ label, onChangeText, value }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View>
      <Text className="mb-2 text-sm font-semibold text-foreground">{label}</Text>
      <TextInput
        className="h-12 rounded-xl border border-border bg-card px-4 text-base text-foreground"
        keyboardType="decimal-pad"
        onChangeText={onChangeText}
        placeholderTextColor="#7b8278"
        value={value}
      />
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-3 border-t border-divider pt-3 first:border-t-0 first:pt-0">
      <Text className="text-sm text-foreground-secondary">{label}</Text>
      <Text className="text-sm font-bold text-foreground">{value}</Text>
    </View>
  );
}
