import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import {
  currentUserId,
  loadAskMessages,
  sendCitedAskMessage,
  type AskMessage,
  type GuideCitation,
} from "@/features/advisor/service";
import { Button, Card, EmptyState, Pill, Sheet } from "@/ui";

export default function AskThreadRoute() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<GuideCitation | null>(null);

  useEffect(() => {
    void loadAskMessages(threadId).then(setMessages);
  }, [threadId]);

  const hasMessages = messages.length > 0 || Boolean(streamingText);

  const send = async () => {
    const question = draft.trim();
    if (!question || isSending) {
      return;
    }

    const userId = await currentUserId();
    if (!userId) {
      Alert.alert("Sign in required", "Start a guest session before asking the advisor.");
      return;
    }

    setDraft("");
    setIsSending(true);
    setStreamingText("");
    const optimistic: AskMessage = {
      id: `optimistic:${Date.now()}`,
      thread_id: threadId,
      user_id: userId,
      role: "user",
      text: question,
      citations: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimistic]);

    try {
      await sendCitedAskMessage({
        onToken: setStreamingText,
        question,
        threadId,
        userId,
      });
      const next = await loadAskMessages(threadId);
      setMessages(next);
    } catch (error) {
      Alert.alert("Advisor failed", error instanceof Error ? error.message : "Could not answer this question.");
    } finally {
      setIsSending(false);
      setStreamingText("");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
      keyboardVerticalOffset={16}
    >
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-28 pt-safe-or-6">
        <Text className="text-sm font-semibold uppercase text-foreground-secondary">Ask</Text>
        <Text className="mt-2 text-3xl font-bold text-foreground">Offline advisor</Text>
        <Text className="mt-2 text-sm leading-normal text-foreground-secondary">
          Answers are grounded in local guide chunks and include citation chips.
        </Text>

        <View className="mt-6 gap-3">
          {hasMessages ? (
            <>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} onCitationPress={setSelectedCitation} />
              ))}
              {streamingText ? (
                <Card className="mr-8 border-primary/40 bg-card">
                  <Text className="text-sm leading-normal text-foreground">{streamingText}</Text>
                  <View className="mt-3 flex-row items-center gap-2">
                    <Ionicons className="text-primary" name="sparkles-outline" size={16} />
                    <Text className="text-xs font-semibold text-primary">Streaming from local content</Text>
                  </View>
                </Card>
              ) : null}
            </>
          ) : (
            <EmptyState
              icon={<Ionicons className="text-primary" name="leaf-outline" size={36} />}
              title="Ask a practical crop question"
              body="Try: How to treat rice blast organically?"
            />
          )}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-background px-5 pb-safe-or-4 pt-3">
        <View className="flex-row items-end gap-2">
          <TextInput
            className="max-h-28 min-h-12 flex-1 rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground"
            multiline
            onChangeText={setDraft}
            placeholder="Ask about symptoms, prevention, or organic care"
            placeholderTextColor="#7b8278"
            value={draft}
          />
          <Pressable
            accessibilityRole="button"
            className="h-12 w-12 items-center justify-center rounded-xl bg-voice disabled:opacity-50"
            disabled
          >
            <Ionicons className="text-primary-on" name="mic-outline" size={22} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="h-12 w-12 items-center justify-center rounded-xl bg-primary disabled:opacity-50"
            disabled={!draft.trim() || isSending}
            onPress={send}
          >
            <Ionicons className="text-primary-on" name="send" size={20} />
          </Pressable>
        </View>
      </View>

      <Sheet
        onClose={() => setSelectedCitation(null)}
        title={selectedCitation?.document_title ?? "Citation"}
        visible={Boolean(selectedCitation)}
      >
        <Text className="text-sm leading-normal text-foreground-secondary">
          {selectedCitation?.heading_path ?? `Chunk ${selectedCitation?.chunk_idx ?? 0}`}
        </Text>
        <Text className="mt-4 text-base leading-normal text-foreground">{selectedCitation?.chunk_text}</Text>
        <View className="mt-5">
          <Button variant="outline" onPress={() => setSelectedCitation(null)}>
            Close
          </Button>
        </View>
      </Sheet>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({
  message,
  onCitationPress,
}: {
  message: AskMessage;
  onCitationPress: (citation: GuideCitation) => void;
}) {
  const citations = useMemo(() => parseCitations(message.citations), [message.citations]);
  const isUser = message.role === "user";

  return (
    <View className={isUser ? "ml-8" : "mr-8"}>
      <Card className={isUser ? "border-primary bg-primary" : "bg-card"}>
        <Text className={isUser ? "text-sm leading-normal text-primary-on" : "text-sm leading-normal text-foreground"}>
          {stripRefMarkers(message.text)}
        </Text>
        {!isUser && citations.length > 0 ? (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {citations.map((citation, index) => (
              <Pressable key={citation.id} onPress={() => onCitationPress(citation)}>
                <Pill>ref:{index + 1}</Pill>
              </Pressable>
            ))}
          </View>
        ) : null}
      </Card>
    </View>
  );
}

function parseCitations(value: string | null) {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as GuideCitation[]) : [];
  } catch {
    return [];
  }
}

function stripRefMarkers(value: string) {
  return value.replace(/\s*\[ref:\d+\]/g, "");
}
