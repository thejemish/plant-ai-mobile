import { EMBEDDING_CONTRACT } from "@/lib/architecture-contract";
import { l2Normalize } from "@/lib/embedding/vector";
import type { EvidenceMatch, OfflineScanDataset } from "@/lib/scan/types";

const DISEASES = [
  { diseaseId: "tomato-early-blight", diseaseLabel: "Tomato early blight", crop: "tomato" },
  { diseaseId: "tomato-late-blight", diseaseLabel: "Tomato late blight", crop: "tomato" },
  { diseaseId: "tomato-healthy", diseaseLabel: "Healthy tomato leaf", crop: "tomato" },
  { diseaseId: "rice-leaf-blast", diseaseLabel: "Rice leaf blast", crop: "rice" },
  { diseaseId: "rice-brown-spot", diseaseLabel: "Rice brown spot", crop: "rice" },
  { diseaseId: "rice-healthy", diseaseLabel: "Healthy rice leaf", crop: "rice" },
] as const;

function seededUnitVector(seed: number) {
  const values = new Float32Array(EMBEDDING_CONTRACT.vectorDimension);
  let state = seed;

  for (let index = 0; index < values.length; index += 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    values[index] = (state / 0xffffffff) * 2 - 1;
  }

  return l2Normalize(values);
}

function blendVectors(base: Float32Array, noise: Float32Array, noiseWeight: number) {
  const values = new Float32Array(base.length);

  for (let index = 0; index < values.length; index += 1) {
    values[index] = base[index] * (1 - noiseWeight) + noise[index] * noiseWeight;
  }

  return l2Normalize(values);
}

const CENTROIDS = DISEASES.reduce<Record<string, Float32Array>>((acc, disease, index) => {
  acc[disease.diseaseId] = seededUnitVector(3000 + index * 997);
  return acc;
}, {});

export function createDemoQueryEmbedding() {
  return blendVectors(CENTROIDS["tomato-early-blight"], seededUnitVector(8128), 0.12);
}

export function createLowConfidenceDemoEmbedding() {
  return seededUnitVector(99173);
}

export function createDemoScanDataset(): OfflineScanDataset {
  const references: EvidenceMatch[] = [];

  DISEASES.forEach((disease, diseaseIndex) => {
    for (let index = 0; index < 5; index += 1) {
      references.push({
        sampleId: `${disease.diseaseId}-sample-${index + 1}`,
        diseaseId: disease.diseaseId,
        diseaseLabel: disease.diseaseLabel,
        crop: disease.crop,
        embedding: blendVectors(
          CENTROIDS[disease.diseaseId],
          seededUnitVector(9000 + diseaseIndex * 100 + index),
          0.08 + index * 0.012,
        ),
        score: 0,
      });
    }
  });

  return {
    references,
    treatmentsByDiseaseId: {
      "tomato-early-blight": {
        immediate: [
          "Remove badly spotted lower leaves and keep them away from the field.",
          "Water at soil level; avoid wetting the leaf canopy.",
          "Check nearby tomato plants for matching target-like brown spots.",
        ],
        organic: [
          "Apply approved copper or biological fungicide where local guidance allows.",
          "Improve airflow by staking and pruning dense growth.",
        ],
        chemical: [
          "Use a locally approved protectant fungicide only after reading the label.",
          "Rotate fungicide groups to reduce resistance risk.",
        ],
        prevent: [
          "Mulch to stop soil splash onto leaves.",
          "Rotate away from tomato and potato family crops next season.",
        ],
      },
      "tomato-late-blight": {
        immediate: ["Isolate suspect plants and inspect stems for dark water-soaked lesions."],
        organic: ["Remove infected debris and increase spacing where possible."],
        chemical: ["Consult local extension guidance for fast-spreading blight treatment."],
        prevent: ["Avoid overhead irrigation and monitor after cool, wet nights."],
      },
      "rice-leaf-blast": {
        immediate: ["Inspect the field edges and nitrogen-rich patches for spindle lesions."],
        organic: ["Keep balanced nutrition and avoid excess nitrogen."],
        chemical: ["Use locally recommended blast fungicide if the disease is spreading."],
        prevent: ["Prefer tolerant varieties and keep field records by season."],
      },
      "tomato-healthy": {
        immediate: ["No disease action is needed; keep monitoring the canopy."],
        organic: ["Maintain airflow and remove dead lower leaves."],
        chemical: ["Do not spray without symptoms or local advisory need."],
        prevent: ["Keep mulch in place and water at soil level."],
      },
      "rice-brown-spot": {
        immediate: ["Check for small brown oval lesions and review field nutrition."],
        organic: ["Improve potassium balance and avoid plant stress where possible."],
        chemical: ["Use locally approved fungicide only if disease is spreading."],
        prevent: ["Use clean seed and balanced fertilization next season."],
      },
      "rice-healthy": {
        immediate: ["No disease action is needed; inspect again after weather changes."],
        organic: ["Maintain balanced nutrition and field hygiene."],
        chemical: ["Do not spray without a confirmed disease trigger."],
        prevent: ["Keep seasonal notes for variety and field performance."],
      },
    },
    citationsByDiseaseId: {
      "tomato-early-blight": [
        {
          ref: "Local guide",
          chunkId: "demo-tomato-early-blight-1",
          text: "Early blight often starts on lower tomato leaves as brown concentric spots.",
        },
        {
          ref: "Treatment table",
          chunkId: "demo-tomato-early-blight-2",
          text: "Reduce leaf wetness, remove infected debris, and use approved fungicides when needed.",
        },
      ],
      "tomato-late-blight": [
        {
          ref: "Local guide",
          chunkId: "demo-tomato-late-blight-1",
          text: "Late blight spreads quickly in cool, wet weather and needs urgent review.",
        },
      ],
      "rice-leaf-blast": [
        {
          ref: "Local guide",
          chunkId: "demo-rice-leaf-blast-1",
          text: "Rice blast lesions are often spindle shaped with gray centers.",
        },
      ],
      "tomato-healthy": [
        {
          ref: "Local guide",
          chunkId: "demo-tomato-healthy-1",
          text: "Healthy tomato leaves should not trigger pesticide action without visible disease signs.",
        },
      ],
      "rice-brown-spot": [
        {
          ref: "Local guide",
          chunkId: "demo-rice-brown-spot-1",
          text: "Rice brown spot often appears as small oval brown lesions and can worsen under plant stress.",
        },
      ],
      "rice-healthy": [
        {
          ref: "Local guide",
          chunkId: "demo-rice-healthy-1",
          text: "Healthy rice leaves should be monitored after rain, fertilizer changes, or pest pressure.",
        },
      ],
    },
  };
}
