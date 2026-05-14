import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useScanResult } from "@/features/scan/use-scan";
import { cn } from "@/lib/cn";
import type { OfflineScanResult, TreatmentSection } from "@/lib/scan/types";

const bucketCopy = {
  high: "High confidence",
  medium: "Possible match",
  low: "Low confidence",
} as const;

const severityCopy = {
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
  unknown: "Unknown",
} as const;

const confidenceBorderClass = {
  high: "border-confidence-high",
  medium: "border-confidence-mid",
  low: "border-confidence-low",
} as const;

const pillToneClass = {
  high: "bg-success-muted",
  medium: "bg-warning-muted",
  low: "bg-danger-muted",
  neutral: "bg-card",
} as const;

export default function ScanResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const result = useScanResult(id);

  if (!result) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6 pt-safe">
        <Text className="text-center text-2xl font-semibold text-foreground">Scan not found</Text>
        <Pressable
          onPress={() => router.replace("/scan")}
          className="mt-6 h-12 items-center justify-center rounded-xl bg-primary px-5"
        >
          <Text className="text-base font-semibold text-primary-on">Back to scan</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background pt-safe">
      <ScrollView contentContainerClassName="pb-32">
        <View className="px-4 pt-2">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full bg-card"
          >
            <MaterialCommunityIcons className="text-foreground" name="arrow-left" size={22} />
          </Pressable>
        </View>

        <Header result={result} />
        <GemmaPanel result={result} />
        <Evidence result={result} />
        <ConfidenceBreakdown result={result} />
        <Candidates result={result} />
        <Treatment treatment={result.treatment} />
        <Citations result={result} />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-card px-4 pb-safe-or-3 pt-3">
        <Pressable
          onPress={() => router.push(`/treatment/${result.id}`)}
          className="h-12 flex-row items-center justify-center gap-2 rounded-xl bg-primary"
        >
          <MaterialCommunityIcons className="text-primary-on" name="clipboard-check-outline" size={21} />
          <Text className="text-base font-semibold text-primary-on">Open treatment plan</Text>
        </Pressable>
      </View>
    </View>
  );
}

function GemmaPanel({ result }: { result: OfflineScanResult }) {
  const gemma = result.gemma;

  if (!gemma) {
    return null;
  }

  const title =
    gemma.status === "complete"
      ? "Gemma vision diagnosis"
      : gemma.status === "error"
        ? "Gemma fallback"
        : "Gemma not loaded";

  return (
    <View className="mb-4 px-4">
      <Text className="mb-2 text-xs font-semibold uppercase text-foreground-muted">Gemma</Text>
      <View className="rounded-lg border border-border bg-card p-4">
        <View className="flex-row items-start gap-3">
          <MaterialCommunityIcons className="text-ai" name="brain" size={24} />
          <View className="flex-1">
            <Text className="text-base font-bold text-foreground">{title}</Text>
            <Text className="mt-1 text-sm leading-normal text-foreground-secondary">
              {gemma.status === "complete"
                ? "Structured JSON returned from the on-device vision-language model."
                : gemma.error ?? gemma.rawText ?? "Load the model to run direct vision diagnosis."}
            </Text>
          </View>
        </View>

        {gemma.json?.symptoms.length ? (
          <View className="mt-4">
            <Text className="mb-2 text-sm font-semibold text-foreground">Symptoms</Text>
            {gemma.json.symptoms.slice(0, 4).map((symptom) => (
              <View className="mb-1 flex-row gap-2" key={symptom}>
                <Text className="text-primary">{"\u2022"}</Text>
                <Text className="flex-1 text-sm leading-normal text-foreground-secondary">{symptom}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {gemma.json?.differential.length ? (
          <View className="mt-4">
            <Text className="mb-2 text-sm font-semibold text-foreground">Differential</Text>
            <Text className="text-sm leading-normal text-foreground-secondary">
              {gemma.json.differential.slice(0, 3).join(" · ")}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function Header({ result }: { result: OfflineScanResult }) {
  return (
    <View className="items-center px-6 py-5">
      <View
        className={cn(
          "h-24 w-24 items-center justify-center rounded-full border-8 bg-card",
          confidenceBorderClass[result.confidenceBucket],
        )}
      >
        <Text className="font-mono text-xl font-bold text-foreground">
          {Math.round(result.confidence * 100)}%
        </Text>
      </View>
      <Text className="mt-4 text-center text-2xl font-bold text-foreground">{result.disease}</Text>
      <View className="mt-3 flex-row flex-wrap justify-center gap-2">
        <Pill label={bucketCopy[result.confidenceBucket]} tone={result.confidenceBucket} />
        <Pill label={severityCopy[result.severity]} tone="neutral" />
        {result.crop ? <Pill label={result.crop} tone="neutral" /> : null}
      </View>
      {result.lowConfidenceReason ? (
        <Text className="mt-4 text-center text-base leading-normal text-foreground-secondary">
          {result.lowConfidenceReason}
        </Text>
      ) : null}
    </View>
  );
}

function Evidence({ result }: { result: OfflineScanResult }) {
  return (
    <View className="mb-4 px-4">
      <Text className="mb-2 text-xs font-semibold uppercase text-foreground-muted">Evidence</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
        <EvidenceCard label="Your leaf" score={null} tone="query" uri={result.queryPhotoUri} />
        {result.topMatches.map((match) => (
          <EvidenceCard
            key={match.sampleId}
            label={match.diseaseLabel}
            score={match.score}
            tone={match.diseaseId === result.diseaseId ? "match" : "other"}
            uri={match.thumbUri ?? match.imageUri}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function EvidenceCard({
  label,
  score,
  tone,
  uri,
}: {
  label: string;
  score: number | null;
  tone: "query" | "match" | "other";
  uri?: string;
}) {
  const showImage = uri && !uri.startsWith("plant-ai-demo://") && !uri.startsWith("plant-ai-symptoms://");

  return (
    <View className="w-32">
      <View
        className={cn(
          "aspect-square items-center justify-center rounded-lg border",
          tone === "match" ? "border-primary bg-primary-muted" : "border-border bg-card",
        )}
      >
        {showImage ? (
          <Image source={{ uri }} className="h-full w-full rounded-lg" resizeMode="cover" />
        ) : (
          <MaterialCommunityIcons
            className={tone === "match" ? "text-primary" : "text-foreground-muted"}
            name={tone === "query" ? "leaf" : "image-filter-vintage"}
            size={34}
          />
        )}
        {score !== null ? (
          <View className="absolute bottom-1 right-1 rounded-md bg-card px-1.5 py-0.5">
            <Text className="font-mono text-xs text-foreground">{Math.round(score * 100)}%</Text>
          </View>
        ) : null}
      </View>
      <Text className="mt-1.5 text-center text-xs text-foreground-secondary" numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function ConfidenceBreakdown({ result }: { result: OfflineScanResult }) {
  const rows = [
    { label: "Visual similarity", value: result.fusion.visual },
    { label: "Reference agreement", value: result.fusion.agreement },
    { label: "Image quality", value: result.fusion.quality },
    { label: "Final confidence", value: result.fusion.final },
  ];

  return (
    <View className="mb-4 px-4">
      <Text className="mb-2 text-xs font-semibold uppercase text-foreground-muted">Why we think so</Text>
      <View className="gap-3 rounded-lg border border-border bg-card p-4">
        {rows.map((row) => {
          const pct = Math.round(row.value * 100);

          return (
            <View key={row.label}>
              <View className="mb-1 flex-row justify-between">
                <Text className="text-sm text-foreground-secondary">{row.label}</Text>
                <Text className="font-mono text-sm text-foreground">{pct}%</Text>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-border">
                <ProgressSegments percent={pct} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Candidates({ result }: { result: OfflineScanResult }) {
  if (result.candidates.length === 0) {
    return null;
  }

  return (
    <View className="mb-4 px-4">
      <Text className="mb-2 text-xs font-semibold uppercase text-foreground-muted">Possible diseases</Text>
      <View className="overflow-hidden rounded-lg border border-border bg-card">
        {result.candidates.slice(0, 3).map((candidate, index) => (
          <View
            key={candidate.diseaseId}
            className="flex-row items-center justify-between gap-3 border-t border-divider p-4 first:border-t-0"
          >
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">{candidate.diseaseLabel}</Text>
              <Text className="mt-1 text-sm text-foreground-secondary">
                {candidate.matchCount} verified examples nearby
              </Text>
            </View>
            <Text className="font-mono text-sm text-foreground-muted">#{index + 1}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Treatment({ treatment }: { treatment: TreatmentSection }) {
  const sections = [
    { key: "immediate", title: "Immediate", items: treatment.immediate },
    { key: "organic", title: "Organic", items: treatment.organic },
    { key: "chemical", title: "Chemical", items: treatment.chemical },
    { key: "prevent", title: "Prevent", items: treatment.prevent },
  ];

  return (
    <View className="mb-4 px-4">
      <Text className="mb-2 text-xs font-semibold uppercase text-foreground-muted">Action</Text>
      <View className="gap-4 rounded-lg border border-border bg-card p-4">
        {sections.map((section) => (
          <View key={section.key}>
            <Text className="mb-2 text-base font-semibold text-foreground">{section.title}</Text>
            {section.items.slice(0, 3).map((item) => (
              <View key={item} className="mb-2 flex-row gap-2">
                <Text className="text-base text-primary">{"\u2022"}</Text>
                <Text className="flex-1 text-base leading-normal text-foreground-secondary">{item}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function Citations({ result }: { result: OfflineScanResult }) {
  if (result.citations.length === 0) {
    return null;
  }

  return (
    <View className="mb-4 px-4">
      <Text className="mb-2 text-xs font-semibold uppercase text-foreground-muted">Citations</Text>
      <View className="gap-2">
        {result.citations.map((citation) => (
          <View key={citation.chunkId} className="rounded-lg border border-border bg-card p-3">
            <Text className="text-sm font-semibold text-foreground">{citation.ref}</Text>
            <Text className="mt-1 text-sm leading-normal text-foreground-secondary">{citation.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Pill({ label, tone }: { label: string; tone: "high" | "medium" | "low" | "neutral" }) {
  return (
    <View
      className={cn(
        "rounded-full px-3 py-1",
        pillToneClass[tone],
      )}
    >
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
    </View>
  );
}

function ProgressSegments({ percent }: { percent: number }) {
  const activeSegments = Math.max(0, Math.min(10, Math.round(percent / 10)));

  return (
    <View className="h-full flex-row">
      {Array.from({ length: 10 }).map((_, index) => (
        <View
          key={index}
          className={cn(
            "h-full flex-1",
            index < activeSegments ? "bg-primary" : "bg-transparent",
          )}
        />
      ))}
    </View>
  );
}
