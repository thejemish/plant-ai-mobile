import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { loadBookmarkedGuideIds, loadGuideDocuments, type GuideDocument } from "@/features/advisor/service";
import { Card, EmptyState, Pill } from "@/ui";

export default function LibraryRoute() {
  const [documents, setDocuments] = useState<GuideDocument[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void loadGuideDocuments(query).then(setDocuments);
  }, [query]);

  useEffect(() => {
    void loadBookmarkedGuideIds().then(setBookmarks);
  }, []);

  const sorted = useMemo(
    () => [...documents].sort((a, b) => Number(bookmarks.includes(b.id)) - Number(bookmarks.includes(a.id))),
    [bookmarks, documents],
  );

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-safe-or-8 pt-safe-or-6">
      <Text className="text-sm font-semibold uppercase text-foreground-secondary">Library</Text>
      <Text className="mt-2 text-3xl font-bold text-foreground">Knowledge library</Text>

      <View className="mt-6 flex-row items-center gap-2 rounded-xl border border-border bg-card px-4">
        <Ionicons className="text-foreground-secondary" name="search" size={20} />
        <TextInput
          className="h-12 flex-1 text-base text-foreground"
          onChangeText={setQuery}
          placeholder="Search crop, category, or title"
          placeholderTextColor="#7b8278"
          value={query}
        />
      </View>

      <View className="mt-6 gap-3">
        {sorted.length > 0 ? (
          sorted.map((doc) => (
            <Pressable key={doc.id} onPress={() => router.push(`/advisor/library/${doc.id}`)}>
              <Card>
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground">{doc.title}</Text>
                    <Text className="mt-1 text-sm text-foreground-secondary">
                      {[doc.crop, doc.category, doc.lang].filter(Boolean).join(" · ") || "General guide"}
                    </Text>
                  </View>
                  {bookmarks.includes(doc.id) ? <Pill tone="success">Saved</Pill> : null}
                </View>
              </Card>
            </Pressable>
          ))
        ) : (
          <EmptyState
            icon={<Ionicons className="text-primary" name="book-outline" size={36} />}
            title="No local guides"
            body="Synced guide documents will appear here for offline reading."
          />
        )}
      </View>
    </ScrollView>
  );
}
