import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { createAskThread, currentUserId } from "@/features/advisor/service";
import { useThreadsStore } from "@/store/use-threads";
import { Button, Card, EmptyState } from "@/ui";

const tiles = [
  { href: "/advisor/library", icon: "book-outline", label: "Library", body: "Offline guide documents and FTS5 search." },
  { href: "/advisor/calendar", icon: "calendar-outline", label: "Calendar", body: "Crop-stage tasks and reminders." },
  { href: "/advisor/pests", icon: "bug-outline", label: "Pests", body: "Pest and beneficial insect reference." },
] as const;

export default function AdvisorScreen() {
  const threads = useThreadsStore((state) => state.threads);
  const hydrateThreads = useThreadsStore((state) => state.hydrateThreads);

  React.useEffect(() => {
    void hydrateThreads();
  }, [hydrateThreads]);

  const startThread = async () => {
    const userId = await currentUserId();
    if (!userId) {
      Alert.alert("Sign in required", "Start a guest session before asking the advisor.");
      return;
    }
    const threadId = await createAskThread({ title: "New question", userId });
    router.push(`/advisor/ask/${threadId}`);
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-safe-or-6">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">Advisor</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">Ask, learn, and plan</Text>
      <View className="mt-6">
        <Button
          icon={<Ionicons className="text-primary-on" name="chatbubbles-outline" size={22} />}
          onPress={startThread}
        >
          Ask a question
        </Button>
      </View>

      <View className="mt-6 gap-3">
        {tiles.map((tile) => (
          <Pressable key={tile.label} onPress={() => router.push(tile.href)}>
            <Card className="flex-row gap-3">
            {tile.icon === "bug-outline" ? (
              <MaterialCommunityIcons className="text-primary" name="bug-outline" size={28} />
            ) : (
              <Ionicons className="text-primary" name={tile.icon} size={27} />
            )}
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">{tile.label}</Text>
              <Text className="mt-1 text-sm leading-normal text-foreground-secondary">{tile.body}</Text>
            </View>
            </Card>
          </Pressable>
        ))}
      </View>

      <Text className="mb-3 mt-8 text-lg font-bold text-foreground">Recent questions</Text>
      <View className="gap-3">
        {threads.length > 0 ? (
          threads.slice(0, 6).map((thread) => (
            <Pressable key={thread.id} onPress={() => router.push(`/advisor/ask/${thread.id}`)}>
              <Card>
                <Text className="text-base font-bold text-foreground">{thread.title ?? "Question"}</Text>
                <Text className="mt-1 text-sm text-foreground-secondary">
                  {thread.crop ?? "General"} · {thread.last_message_at ? new Date(thread.last_message_at).toLocaleString() : "Draft"}
                </Text>
              </Card>
            </Pressable>
          ))
        ) : (
          <EmptyState
            icon={<Ionicons className="text-primary" name="chatbubbles-outline" size={34} />}
            title="No advisor threads"
            body="Ask a crop question to create an offline cited thread."
          />
        )}
      </View>
    </ScrollView>
  );
}
