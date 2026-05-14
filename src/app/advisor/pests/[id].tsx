import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { loadPest, type PestRow } from "@/features/advisor/pests-service";
import { Card, EmptyState, Pill } from "@/ui";

export default function PestDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pest, setPest] = useState<PestRow | null>(null);

  useEffect(() => {
    void loadPest(id).then(setPest);
  }, [id]);

  if (!pest) {
    return (
      <View className="flex-1 bg-background px-5 pb-safe-or-8 pt-safe-or-6">
        <EmptyState
          icon={<MaterialCommunityIcons className="text-primary" name="bug-outline" size={36} />}
          title="Pest not found"
          body="This record may still be syncing."
        />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-safe-or-6">
      {pest.image_url ? (
        <Image className="h-48 rounded-lg bg-surface" contentFit="cover" source={{ uri: pest.image_url }} />
      ) : null}
      <Text className="mt-5 text-sm font-semibold uppercase text-foreground-secondary">Pest guide</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">{pest.name}</Text>
      {pest.scientific_name ? <Text className="mt-1 text-base italic text-foreground-secondary">{pest.scientific_name}</Text> : null}
      <View className="mt-3 flex-row flex-wrap gap-2">
        {pest.crops ? <Pill>{pest.crops}</Pill> : null}
        {pest.region ? <Pill tone="info">{pest.region}</Pill> : null}
      </View>

      <Section title="Identification" value={pest.identification} />
      <Section title="Damage" value={pest.damage} />
      <Section title="Organic care" value={pest.organic_md} />
      <Section title="Chemical care" value={pest.chemical_md} />
      <Section title="Beneficials" value={pest.beneficials} />
    </ScrollView>
  );
}

function Section({ title, value }: { title: string; value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <Card className="mt-5">
      <Text className="text-base font-bold text-foreground">{title}</Text>
      <Text className="mt-2 text-sm leading-normal text-foreground-secondary">{stripMarkdown(value)}</Text>
    </Card>
  );
}

function stripMarkdown(value: string) {
  return value.replace(/^[-*]\s*/gm, "").trim();
}
