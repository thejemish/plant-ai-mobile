import { topKSimilarWithMetadata } from "@/lib/embedding/vector";
import { assessLeafImageQuality } from "@/lib/scan/quality";
import type {
  ConfidenceBucket,
  DiseaseCandidate,
  OfflineScanDataset,
  OfflineScanResult,
  ScanQualitySignals,
} from "@/lib/scan/types";

const TOP_K_MATCHES = 5;
const HIGH_CONFIDENCE = 0.78;
const MEDIUM_CONFIDENCE = 0.58;
const LOW_TOP_SCORE = 0.52;

export type RunOfflineScanInput = {
  id: string;
  queryPhotoUri: string;
  queryEmbedding: Float32Array;
  dataset: OfflineScanDataset;
  qualitySignals?: ScanQualitySignals;
};

export function runOfflineScan(input: RunOfflineScanInput): OfflineScanResult {
  const quality = assessLeafImageQuality(input.qualitySignals);

  if (!quality.ok) {
    return createRetakeResult(input, quality.issues.includes("blurry") ? "Image looks blurry" : "Leaf area is unclear");
  }

  const matches = topKSimilarWithMetadata(input.queryEmbedding, input.dataset.references, TOP_K_MATCHES);
  const candidates = aggregateDiseaseCandidates(matches);
  const best = candidates[0];

  if (!best) {
    return createRetakeResult(input, "No local reference examples are available");
  }

  const agreement = calculateAgreement(matches, best.diseaseId);
  const qualityScore = calculateQualityScore(input.qualitySignals);
  const confidence = clamp(best.topScore * 0.62 + agreement * 0.28 + qualityScore * 0.1, 0, 1);
  const bucket = bucketConfidence(confidence, best.topScore, agreement);
  const uncertain = bucket !== "high";
  const topMatches = matches.map((match) => ({
    ...match,
    thumbUri: match.thumbUri,
    imageUri: match.imageUri,
  }));

  return {
    id: input.id,
    queryPhotoUri: input.queryPhotoUri,
    createdAt: new Date().toISOString(),
    status: "complete",
    uncertain,
    confidence,
    confidenceBucket: bucket,
    disease: bucket === "low" ? "Uncertain leaf problem" : best.diseaseLabel,
    diseaseId: bucket === "low" ? null : best.diseaseId,
    crop: best.crop,
    severity: bucket === "high" ? "moderate" : "unknown",
    topMatches,
    candidates,
    quality,
    fusion: {
      visual: best.topScore,
      agreement,
      quality: qualityScore,
      final: confidence,
    },
    treatment:
      bucket === "low"
        ? lowConfidenceTreatment()
        : input.dataset.treatmentsByDiseaseId[best.diseaseId] ?? lowConfidenceTreatment(),
    citations: bucket === "low" ? [] : input.dataset.citationsByDiseaseId[best.diseaseId] ?? [],
    lowConfidenceReason:
      bucket === "low"
        ? "Closest examples did not agree strongly enough for a disease call. Retake in bright light or ask an expert."
        : undefined,
  };
}

export function aggregateDiseaseCandidates(matches: { diseaseId: string; diseaseLabel: string; crop: string; score: number }[]) {
  const grouped = new Map<string, DiseaseCandidate & { scores: number[] }>();

  matches.forEach((match) => {
    const current =
      grouped.get(match.diseaseId) ??
      ({
        diseaseId: match.diseaseId,
        diseaseLabel: match.diseaseLabel,
        crop: match.crop,
        score: 0,
        topScore: 0,
        averageTopScore: 0,
        matchCount: 0,
        scores: [],
      } satisfies DiseaseCandidate & { scores: number[] });

    current.scores.push(match.score);
    current.matchCount += 1;
    current.topScore = Math.max(current.topScore, match.score);
    grouped.set(match.diseaseId, current);
  });

  return Array.from(grouped.values())
    .map(({ scores, ...candidate }) => {
      const sorted = [...scores].sort((left, right) => right - left).slice(0, 3);
      const averageTopScore = sorted.reduce((sum, score) => sum + score, 0) / sorted.length;

      return {
        ...candidate,
        averageTopScore,
        score: candidate.topScore + averageTopScore * 0.25 + Math.min(candidate.matchCount, 3) * 0.025,
      };
    })
    .sort((left, right) => right.score - left.score);
}

function calculateAgreement(matches: { diseaseId: string; score: number }[], diseaseId: string) {
  if (matches.length === 0) {
    return 0;
  }

  const diseaseMatches = matches.filter((match) => match.diseaseId === diseaseId);
  const weightedAgreement =
    diseaseMatches.reduce((sum, match) => sum + Math.max(match.score, 0), 0) /
    matches.reduce((sum, match) => sum + Math.max(match.score, 0), 0);

  return clamp(Number.isFinite(weightedAgreement) ? weightedAgreement : 0, 0, 1);
}

function calculateQualityScore(signals?: ScanQualitySignals) {
  if (!signals?.blurVariance || !signals.foliageRatio) {
    return 0.72;
  }

  const blur = clamp(signals.blurVariance / 180, 0, 1);
  const foliage = clamp(signals.foliageRatio / 0.45, 0, 1);

  return blur * 0.45 + foliage * 0.55;
}

function bucketConfidence(confidence: number, topScore: number, agreement: number): ConfidenceBucket {
  if (confidence >= HIGH_CONFIDENCE && topScore >= 0.72 && agreement >= 0.55) {
    return "high";
  }

  if (confidence >= MEDIUM_CONFIDENCE && topScore >= LOW_TOP_SCORE) {
    return "medium";
  }

  return "low";
}

function createRetakeResult(input: RunOfflineScanInput, reason: string): OfflineScanResult {
  const quality = assessLeafImageQuality(input.qualitySignals);

  return {
    id: input.id,
    queryPhotoUri: input.queryPhotoUri,
    createdAt: new Date().toISOString(),
    status: "retake",
    uncertain: true,
    confidence: 0,
    confidenceBucket: "low",
    disease: "Retake needed",
    diseaseId: null,
    crop: null,
    severity: "unknown",
    topMatches: [],
    candidates: [],
    quality,
    fusion: {
      visual: 0,
      agreement: 0,
      quality: 0,
      final: 0,
    },
    treatment: lowConfidenceTreatment(),
    citations: [],
    lowConfidenceReason: reason,
  };
}

function lowConfidenceTreatment() {
  return {
    immediate: [
      "Retake the leaf in bright shade with one leaf filling the guide.",
      "Capture both the top and underside if symptoms are patchy.",
      "Avoid applying pesticide until the problem is confirmed.",
    ],
    organic: ["Remove only clearly damaged leaves if the plant can tolerate it."],
    chemical: ["Ask a local expert before chemical treatment."],
    prevent: ["Keep the plant record and compare again after 24 hours."],
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
