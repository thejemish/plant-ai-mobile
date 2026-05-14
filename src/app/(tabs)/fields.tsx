import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFieldsStore } from "@/store/use-fields";
import { Button, Card, EmptyState, Pill } from "@/ui";

export default function FieldsScreen() {
  const fields = useFieldsStore((state) => state.fields);
  const hydrateFields = useFieldsStore((state) => state.hydrateFields);

  useEffect(() => {
    void hydrateFields();
  }, [hydrateFields]);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-safe-or-6">
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1">
          <Text className="text-sm font-semibold uppercase text-foreground-secondary">Fields</Text>
          <Text className="mt-2 text-3xl font-bold text-foreground">My fields</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-xl bg-primary"
          onPress={() => router.push("/fields/new")}
        >
          <MaterialCommunityIcons className="text-primary-on" name="plus" size={23} />
        </Pressable>
      </View>

      <View className="mt-6 gap-3">
        {fields.length > 0 ? (
          fields.map((field) => (
            <Pressable key={field.id} onPress={() => router.push(`/fields/${field.id}`)}>
              <Card>
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-foreground">{field.name}</Text>
                    <Text className="mt-1 text-sm text-foreground-secondary">
                      {field.crop ?? "Crop not set"}
                      {field.variety ? ` · ${field.variety}` : ""}
                    </Text>
                  </View>
                  {field.currentStage ? <Pill tone="info">{field.currentStage.label}</Pill> : null}
                </View>
                <Text className="mt-3 text-xs text-foreground-muted">
                  {field.area_acres ? `${field.area_acres} acres` : "Area not set"}
                  {field.currentStage ? ` · Day ${field.currentStage.day}` : ""}
                </Text>
              </Card>
            </Pressable>
          ))
        ) : (
          <EmptyState
            action={<Button onPress={() => router.push("/fields/new")}>Add field</Button>}
            icon={<MaterialCommunityIcons className="text-primary" name="sprout-outline" size={36} />}
            title="Add your first field"
            body="Fields connect scans to crop stage, reminders, and treatment context."
          />
        )}
      </View>
    </ScrollView>
  );
}
