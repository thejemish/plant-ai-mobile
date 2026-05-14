import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import {
  loadBookmarkedGuideIds,
  loadGuideDocument,
  setGuideBookmark,
  type GuideChunk,
  type GuideDocument,
} from "@/features/advisor/service";
import { Button, Card, EmptyState, Pill } from "@/ui";

export default function LibraryDocumentRoute() {
  const { docId } = useLocalSearchParams<{ docId: string }>();
  const [document, setDocument] = useState<GuideDocument | null>(null);
  const [chunks, setChunks] = useState<GuideChunk[]>([]);
  const [bookmarked, setBookmarked] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void loadGuideDocument(docId).then((next) => {
      setDocument(next.document);
      setChunks(next.chunks);
    });
    void loadBookmarkedGuideIds().then((ids) => setBookmarked(ids.includes(docId)));
  }, [docId]);

  const visibleChunks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return chunks;
    }
    return chunks.filter((chunk) => `${chunk.heading_path ?? ""} ${chunk.chunk_text}`.toLowerCase().includes(needle));
  }, [chunks, query]);

  const toggleBookmark = async () => {
    const ids = await setGuideBookmark(docId, !bookmarked);
    setBookmarked(ids.includes(docId));
  };

  if (!document) {
    return (
      <View className="flex-1 bg-background px-5 pb-safe-or-8 pt-safe-or-6">
        <EmptyState title="Guide not found" body="This document may still be syncing." />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-safe-or-6">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">Library</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">{document.title}</Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {document.crop ? <Pill>{document.crop}</Pill> : null}
        {document.category ? <Pill tone="warning">{document.category}</Pill> : null}
        {bookmarked ? <Pill tone="success">Saved</Pill> : null}
      </View>

      <View className="mt-6 flex-row gap-3">
        <Button
          className="flex-1"
          icon={<Ionicons className="text-primary-on" name={bookmarked ? "bookmark" : "bookmark-outline"} size={20} />}
          onPress={toggleBookmark}
        >
          {bookmarked ? "Saved" : "Save"}
        </Button>
      </View>

      <View className="mt-6 flex-row items-center gap-2 rounded-xl border border-border bg-card px-4">
        <Ionicons className="text-foreground-secondary" name="search" size={20} />
        <TextInput
          className="h-12 flex-1 text-base text-foreground"
          onChangeText={setQuery}
          placeholder="Search inside guide"
          placeholderTextColor="#7b8278"
          value={query}
        />
      </View>

      <View className="mt-6 gap-3">
        {visibleChunks.map((chunk) => (
          <Card key={chunk.id}>
            {chunk.heading_path ? <Text className="text-sm font-bold text-foreground">{chunk.heading_path}</Text> : null}
            <Text className="mt-2 text-base leading-normal text-foreground-secondary">{chunk.chunk_text}</Text>
            <Text className="mt-3 text-xs font-semibold uppercase text-foreground-tertiary">Chunk {chunk.chunk_idx + 1}</Text>
          </Card>
        ))}
        {visibleChunks.length === 0 ? (
          <EmptyState
            icon={<Ionicons className="text-primary" name="document-text-outline" size={36} />}
            title="No matching chunks"
            body="Try a broader word from the guide title or crop."
          />
        ) : null}
      </View>
    </ScrollView>
  );
}
