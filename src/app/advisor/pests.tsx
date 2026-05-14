import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { searchPests, type PestRow } from "@/features/advisor/pests-service";
import { Card, EmptyState, Pill } from "@/ui";

export default function PestsRoute() {
  const [query, setQuery] = useState("");
  const [pests, setPests] = useState<PestRow[]>([]);

  useEffect(() => {
    void searchPests(query).then(setPests);
  }, [query]);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-safe-or-6">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">Pests</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">Pest guide</Text>

      <View className="mt-6 flex-row items-center gap-2 rounded-xl border border-border bg-card px-4">
        <MaterialCommunityIcons className="text-foreground-secondary" name="magnify" size={22} />
        <TextInput
          className="h-12 flex-1 text-base text-foreground"
          onChangeText={setQuery}
          placeholder="Search crop, insect, damage"
          placeholderTextColor="#7b8278"
          value={query}
        />
      </View>

      <View className="mt-6 gap-3">
        {pests.length > 0 ? (
          pests.map((pest) => (
            <Pressable key={pest.id} onPress={() => router.push(`/advisor/pests/${pest.id}`)}>
              <Card>
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground">{pest.name}</Text>
                    <Text className="mt-1 text-sm italic text-foreground-secondary">{pest.scientific_name}</Text>
                    <Text className="mt-2 text-sm leading-normal text-foreground-secondary" numberOfLines={2}>
                      {pest.damage ?? pest.identification ?? "Local pest reference"}
                    </Text>
                  </View>
                  {pest.crops ? <Pill>{pest.crops.split(",")[0]}</Pill> : null}
                </View>
              </Card>
            </Pressable>
          ))
        ) : (
          <EmptyState
            icon={<MaterialCommunityIcons className="text-primary" name="bug-outline" size={36} />}
            title="No pest records"
            body="Synced pest and beneficial insect references will appear here."
          />
        )}
      </View>
    </ScrollView>
  );
}
