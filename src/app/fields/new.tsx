import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { createField } from "@/features/fields/field-service";
import { useSession } from "@/lib/auth/session";
import { Button, Chip } from "@/ui";

const crops = ["tomato", "rice", "cotton", "wheat", "maize", "sugarcane"];

export default function NewFieldRoute() {
  const { session } = useSession();
  const [name, setName] = useState("");
  const [crop, setCrop] = useState<string | null>(null);
  const [variety, setVariety] = useState("");
  const [sowingDate, setSowingDate] = useState("");
  const [area, setArea] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!session || !name.trim()) {
      return;
    }

    setSaving(true);
    try {
      const field = await createField(session.user.id, {
        name,
        crop,
        variety,
        sowing_date: sowingDate,
        area_acres: area ? Number(area) : null,
      });
      router.replace(`/fields/${field.id}`);
    } catch (error) {
      Alert.alert("Could not save field", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-safe-or-6">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">Fields</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">New field</Text>

      <View className="mt-6 gap-5">
        <FieldInput label="Field name" value={name} onChangeText={setName} placeholder="North plot" />

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

        <FieldInput label="Variety" value={variety} onChangeText={setVariety} placeholder="Optional" />
        <FieldInput label="Sowing date" value={sowingDate} onChangeText={setSowingDate} placeholder="YYYY-MM-DD" />
        <FieldInput
          keyboardType="decimal-pad"
          label="Area acres"
          value={area}
          onChangeText={setArea}
          placeholder="1.5"
        />

        <Button disabled={!name.trim()} loading={saving} onPress={save}>
          Save field
        </Button>
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
