import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { deleteField, updateField } from "@/features/fields/field-service";
import { useFieldsStore } from "@/store/use-fields";
import { Button, Card, Chip, EmptyState, Pill } from "@/ui";

const crops = ["tomato", "rice", "cotton", "wheat", "maize", "sugarcane"];

export default function FieldDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const field = useFieldsStore((state) => state.fields.find((candidate) => candidate.id === id));
  const hydrateFields = useFieldsStore((state) => state.hydrateFields);
  const [name, setName] = useState("");
  const [crop, setCrop] = useState<string | null>(null);
  const [variety, setVariety] = useState("");
  const [sowingDate, setSowingDate] = useState("");
  const [area, setArea] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void hydrateFields();
  }, [hydrateFields]);

  useEffect(() => {
    if (!field) {
      return;
    }
    setName(field.name);
    setCrop(field.crop);
    setVariety(field.variety ?? "");
    setSowingDate(field.sowing_date ?? "");
    setArea(field.area_acres ? String(field.area_acres) : "");
  }, [field]);

  if (!field) {
    return (
      <View className="flex-1 bg-background px-5 pb-safe-or-8 pt-safe-or-6">
        <EmptyState
          title="Field not found"
          body="It may still be syncing or it was deleted."
          action={<Button onPress={() => router.replace("/(tabs)/fields")}>Back to fields</Button>}
        />
      </View>
    );
  }

  const save = async () => {
    if (!name.trim()) {
      return;
    }

    setSaving(true);
    try {
      await updateField(field.id, {
        name,
        crop,
        variety,
        sowing_date: sowingDate,
        area_acres: area ? Number(area) : null,
      });
      Alert.alert("Field saved", "Your local changes will sync in the background.");
    } catch (error) {
      Alert.alert("Could not save field", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    Alert.alert("Delete field?", "This removes the field locally and syncs the delete marker.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteField(field.id);
          router.replace("/(tabs)/fields");
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-safe-or-6">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-sm font-semibold uppercase text-foreground-secondary">Fields</Text>
          <Text className="mt-2 text-3xl font-bold text-foreground">{field.name}</Text>
        </View>
        {field.currentStage ? <Pill tone="info">{field.currentStage.label}</Pill> : null}
      </View>

      <Card className="mt-6">
        <Text className="text-base font-bold text-foreground">Stage timeline</Text>
        <Text className="mt-2 text-sm leading-normal text-foreground-secondary">
          {field.currentStage
            ? `${field.crop ?? "Crop"} is on day ${field.currentStage.day}, currently ${field.currentStage.label}.`
            : "Add crop and sowing date to resolve the current stage from crop_stage_rules."}
        </Text>
      </Card>

      <View className="mt-6 gap-5">
        <FieldInput label="Field name" value={name} onChangeText={setName} />
        <View>
          <Text className="mb-2 text-sm font-semibold text-foreground">Crop</Text>
          <View className="flex-row flex-wrap gap-2">
            {crops.map((item) => (
              <Chip key={item} selected={crop === item} onPress={() => setCrop(item)}>
                {item}
              </Chip>
            ))}
          </View>
        </View>
        <FieldInput label="Variety" value={variety} onChangeText={setVariety} />
        <FieldInput label="Sowing date" value={sowingDate} onChangeText={setSowingDate} placeholder="YYYY-MM-DD" />
        <FieldInput keyboardType="decimal-pad" label="Area acres" value={area} onChangeText={setArea} />

        <Button disabled={!name.trim()} loading={saving} onPress={save}>
          Save changes
        </Button>

        <Pressable
          accessibilityRole="button"
          className="h-12 flex-row items-center justify-center gap-2 rounded-xl border border-danger"
          onPress={remove}
        >
          <MaterialCommunityIcons className="text-danger" name="delete-outline" size={21} />
          <Text className="text-base font-semibold text-danger">Delete field</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function FieldInput({
  label,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "decimal-pad";
}) {
  return (
    <View>
      <Text className="mb-2 text-sm font-semibold text-foreground">{label}</Text>
      <TextInput
        className="h-12 rounded-xl border border-border bg-card px-4 text-base text-foreground"
        placeholderTextColor="#7b8278"
        {...props}
      />
    </View>
  );
}
