import { EMBEDDING_CONTRACT } from "@/lib/architecture-contract";

export type ReferenceEmbedding = {
  sampleId: string;
  diseaseId: string;
  diseaseLabel: string;
  crop: string;
  embedding: Float32Array;
};

export type RetrievalMatch<T extends ReferenceEmbedding = ReferenceEmbedding> = T & {
  score: number;
};

export function assertEmbeddingContract(vector: Float32Array) {
  if (vector.length !== EMBEDDING_CONTRACT.vectorDimension) {
    throw new Error(
      `Expected ${EMBEDDING_CONTRACT.vectorDimension}-dim embedding, received ${vector.length}.`,
    );
  }
}

export function l2Normalize(vector: Float32Array) {
  let sumSquares = 0;

  for (const value of vector) {
    sumSquares += value * value;
  }

  const magnitude = Math.sqrt(sumSquares);

  if (!Number.isFinite(magnitude) || magnitude === 0) {
    throw new Error("Cannot normalize an empty or zero-magnitude embedding.");
  }

  const normalized = new Float32Array(vector.length);

  for (let index = 0; index < vector.length; index += 1) {
    normalized[index] = vector[index] / magnitude;
  }

  return normalized;
}

export function cosineSimilarity(left: Float32Array, right: Float32Array) {
  if (left.length !== right.length) {
    throw new Error(`Cannot compare embeddings with dimensions ${left.length} and ${right.length}.`);
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

export function topKSimilar(
  queryEmbedding: Float32Array,
  references: ReferenceEmbedding[],
  count: number,
): RetrievalMatch[] {
  assertEmbeddingContract(queryEmbedding);

  return references
    .map((reference) => {
      assertEmbeddingContract(reference.embedding);

      return {
        ...reference,
        score: cosineSimilarity(queryEmbedding, reference.embedding),
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, count);
}

export function topKSimilarWithMetadata<T extends ReferenceEmbedding>(
  queryEmbedding: Float32Array,
  references: T[],
  count: number,
): RetrievalMatch<T>[] {
  assertEmbeddingContract(queryEmbedding);

  return references
    .map((reference) => {
      assertEmbeddingContract(reference.embedding);

      return {
        ...reference,
        score: cosineSimilarity(queryEmbedding, reference.embedding),
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, count);
}

export function float32ArrayToBase64(vector: Float32Array) {
  const bytes = new Uint8Array(vector.buffer, vector.byteOffset, vector.byteLength);
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return globalThis.btoa(binary);
}

export function base64ToFloat32Array(value: string) {
  if (!globalThis.atob) {
    throw new Error("Base64 decoding is unavailable in this runtime.");
  }

  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  if (bytes.byteLength % Float32Array.BYTES_PER_ELEMENT !== 0) {
    throw new Error("Embedding payload byte length is not divisible by Float32 size.");
  }

  return new Float32Array(bytes.buffer);
}
