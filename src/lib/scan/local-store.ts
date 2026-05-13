import { openDatabaseAsync } from "expo-sqlite";
import { EMBEDDING_CONTRACT } from "@/lib/architecture-contract";
import { assertEmbeddingContract, base64ToFloat32Array, l2Normalize } from "@/lib/embedding/vector";
import { createDemoScanDataset } from "@/lib/scan/demo-dataset";
import type { EvidenceMatch, GuideCitation, OfflineScanDataset, TreatmentSection } from "@/lib/scan/types";

const SYNC_DB_NAME = "plant_ai_sync.db";

type ReferenceRow = {
  sample_id: string;
  disease_id: string | null;
  disease_label: string;
  crop: string;
  image_url: string | null;
  image_thumb_url: string | null;
  embedding_base64: string;
};

type TreatmentRow = {
  disease_id: string;
  method: string;
  title: string;
  steps_md: string;
  safety_notes_md: string | null;
};

type CitationRow = {
  id: string;
  disease_id: string | null;
  chunk_text: string;
  heading_path: string | null;
};

function emptyTreatment(): TreatmentSection {
  return {
    immediate: [],
    organic: [],
    chemical: [],
    prevent: [],
  };
}

function splitBullets(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function pushTreatment(section: TreatmentSection, row: TreatmentRow) {
  const method = row.method.toLowerCase();
  const bullets = [row.title, ...splitBullets(row.steps_md)];

  if (row.safety_notes_md) {
    bullets.push(...splitBullets(row.safety_notes_md));
  }

  if (method.includes("organic") || method.includes("biological")) {
    section.organic.push(...bullets);
    return;
  }

  if (method.includes("chemical") || method.includes("fungicide")) {
    section.chemical.push(...bullets);
    return;
  }

  if (method.includes("prevent") || method.includes("cultural")) {
    section.prevent.push(...bullets);
    return;
  }

  section.immediate.push(...bullets);
}

function fallbackTreatment(): TreatmentSection {
  return {
    immediate: [
      "Retake from another angle if symptoms are hard to see.",
      "Keep the affected leaf sample and compare nearby plants.",
    ],
    organic: ["Remove visibly infected debris where safe to do so."],
    chemical: ["Ask a local agronomist before applying any pesticide."],
    prevent: ["Keep leaves dry where possible and record the field condition."],
  };
}

export async function loadOfflineScanDataset(dbName = SYNC_DB_NAME): Promise<OfflineScanDataset> {
  try {
    const db = await openDatabaseAsync(dbName);
    const rows = await db.getAllAsync<ReferenceRow>(
      `SELECT
        e.sample_id,
        s.disease_id,
        s.disease_label,
        s.crop,
        s.image_url,
        s.image_thumb_url,
        e.embedding_base64
      FROM leaf_sample_embeddings e
      JOIN leaf_samples s ON s.id = e.sample_id
      WHERE e.model_id = ? AND e.preprocess_id = ? AND e.dim = ? AND s.status = 'published'`,
      EMBEDDING_CONTRACT.modelId,
      EMBEDDING_CONTRACT.preprocessId,
      EMBEDDING_CONTRACT.vectorDimension,
    );

    if (rows.length === 0) {
      return createDemoScanDataset();
    }

    const references: EvidenceMatch[] = rows.map((row) => {
      const embedding = l2Normalize(base64ToFloat32Array(row.embedding_base64));
      assertEmbeddingContract(embedding);

      return {
        sampleId: row.sample_id,
        diseaseId: row.disease_id ?? row.disease_label,
        diseaseLabel: row.disease_label,
        crop: row.crop,
        imageUri: row.image_url ?? undefined,
        thumbUri: row.image_thumb_url ?? row.image_url ?? undefined,
        embedding,
        score: 0,
      };
    });

    const diseaseIds = Array.from(new Set(references.map((reference) => reference.diseaseId)));
    const treatmentsByDiseaseId = await loadTreatments(dbName, diseaseIds);
    const citationsByDiseaseId = await loadCitations(dbName, diseaseIds);

    return {
      references,
      treatmentsByDiseaseId,
      citationsByDiseaseId,
    };
  } catch {
    return createDemoScanDataset();
  }
}

async function loadTreatments(dbName: string, diseaseIds: string[]) {
  const db = await openDatabaseAsync(dbName);
  const byDisease: Record<string, TreatmentSection> = {};

  for (const diseaseId of diseaseIds) {
    const rows = await db.getAllAsync<TreatmentRow>(
      `SELECT disease_id, method, title, steps_md, safety_notes_md
      FROM disease_treatments
      WHERE disease_id = ? AND status = 'published'
      ORDER BY method, title`,
      diseaseId,
    );
    const section = emptyTreatment();

    rows.forEach((row) => pushTreatment(section, row));
    byDisease[diseaseId] = section.immediate.length > 0 || section.organic.length > 0 ? section : fallbackTreatment();
  }

  return byDisease;
}

async function loadCitations(dbName: string, diseaseIds: string[]) {
  const db = await openDatabaseAsync(dbName);
  const byDisease: Record<string, GuideCitation[]> = {};

  for (const diseaseId of diseaseIds) {
    const rows = await db.getAllAsync<CitationRow>(
      `SELECT id, disease_id, chunk_text, heading_path
      FROM guide_chunks
      WHERE disease_id = ? AND status = 'published'
      ORDER BY chunk_idx
      LIMIT 3`,
      diseaseId,
    );

    byDisease[diseaseId] = rows.map((row) => ({
      ref: row.heading_path ?? "Guide",
      chunkId: row.id,
      text: row.chunk_text,
    }));
  }

  return byDisease;
}
