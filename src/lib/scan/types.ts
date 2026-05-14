import type { RetrievalMatch } from "@/lib/embedding/vector";
import type { GemmaDiagnosisState } from "@/features/scan/gemma-diagnosis";

export type ScanQualitySignals = {
  blurVariance?: number;
  foliageRatio?: number;
};

export type ScanQualityResult = {
  ok: boolean;
  blurVariance: number | null;
  foliageRatio: number | null;
  issues: ("blurry" | "not_leaf" | "missing_quality_signals")[];
};

export type ConfidenceBucket = "high" | "medium" | "low";

export type DiseaseCandidate = {
  diseaseId: string;
  diseaseLabel: string;
  crop: string;
  score: number;
  topScore: number;
  averageTopScore: number;
  matchCount: number;
};

export type TreatmentSection = {
  immediate: string[];
  organic: string[];
  chemical: string[];
  prevent: string[];
};

export type GuideCitation = {
  ref: string;
  chunkId: string;
  text: string;
};

export type EvidenceMatch = RetrievalMatch & {
  thumbUri?: string;
  imageUri?: string;
};

export type OfflineScanResult = {
  id: string;
  queryPhotoUri: string;
  createdAt: string;
  status: "complete" | "retake";
  uncertain: boolean;
  confidence: number;
  confidenceBucket: ConfidenceBucket;
  disease: string;
  diseaseId: string | null;
  crop: string | null;
  severity: "mild" | "moderate" | "severe" | "unknown";
  topMatches: EvidenceMatch[];
  candidates: DiseaseCandidate[];
  quality: ScanQualityResult;
  fusion: {
    visual: number;
    agreement: number;
    quality: number;
    final: number;
  };
  treatment: TreatmentSection;
  citations: GuideCitation[];
  lowConfidenceReason?: string;
  gemma?: GemmaDiagnosisState;
};

export type OfflineScanDataset = {
  references: EvidenceMatch[];
  treatmentsByDiseaseId: Record<string, TreatmentSection>;
  citationsByDiseaseId: Record<string, GuideCitation[]>;
};
