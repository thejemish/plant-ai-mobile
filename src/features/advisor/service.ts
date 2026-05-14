import * as Crypto from "expo-crypto";
import { supastash } from "supastash";
import { supabase } from "@/lib/supabase";
import { getSyncDb } from "@/store/db";
import { useActionsStore } from "@/store/use-actions";
import { useModelStore } from "@/store/use-model";
import { useThreadsStore } from "@/store/use-threads";

export type AskMessage = {
  id: string;
  thread_id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  text: string;
  citations: string | null;
  created_at: string;
  updated_at: string;
};

export type GuideCitation = {
  id: string;
  document_id: string | null;
  document_title: string | null;
  chunk_idx: number;
  chunk_text: string;
  heading_path: string | null;
  crop: string | null;
  disease_id: string | null;
};

export type GuideDocument = {
  id: string;
  title: string;
  slug: string | null;
  crop: string | null;
  disease_id: string | null;
  category: string | null;
  lang: string | null;
  updated_at: string;
};

export type GuideChunk = {
  id: string;
  document_id: string | null;
  chunk_idx: number;
  chunk_text: string;
  heading_path: string | null;
};

export type CalendarTask = {
  id: string;
  fieldId: string;
  fieldName: string;
  crop: string | null;
  stage: string;
  label: string;
  dayStart: number;
  dayEnd: number;
};

export async function currentUserId() {
  if (!supabase) {
    return null;
  }
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function createAskThread({
  crop,
  diseaseId,
  scanId,
  title,
  userId,
}: {
  crop?: string | null;
  diseaseId?: string | null;
  scanId?: string | null;
  title?: string | null;
  userId: string;
}) {
  const now = new Date().toISOString();
  const id = Crypto.randomUUID();
  await supastash
    .from("ask_threads")
    .upsert(
      {
        id,
        user_id: userId,
        title: title ?? "New question",
        crop: crop ?? null,
        disease_id: diseaseId ?? null,
        scan_id: scanId ?? null,
        lang: "en",
        last_message_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      { onConflictKeys: ["id"] },
    )
    .syncMode("localFirst")
    .throwOnError()
    .run();
  await useThreadsStore.getState().hydrateThreads();
  return id;
}

export async function loadAskMessages(threadId: string) {
  const db = await getSyncDb();
  return db.getAllAsync<AskMessage>(
    `SELECT id, thread_id, user_id, role, text, citations, created_at, updated_at
     FROM ask_messages
     WHERE thread_id = ? AND deleted_at IS NULL
     ORDER BY created_at ASC`,
    threadId,
  );
}

export async function sendCitedAskMessage({
  onToken,
  question,
  threadId,
  userId,
}: {
  onToken?: (text: string) => void;
  question: string;
  threadId: string;
  userId: string;
}) {
  const now = new Date().toISOString();
  const userMessageId = Crypto.randomUUID();
  const assistantMessageId = Crypto.randomUUID();
  const context = await loadThreadContext(threadId);
  const citations = await searchGuideCitations(question, {
    crop: context?.crop ?? null,
    diseaseId: context?.disease_id ?? null,
    limit: 4,
  });
  const gemmaAnswer = await runGemmaAdvisorAnswer(question, citations);
  const answer = gemmaAnswer ?? buildGroundedAnswer(question, citations);
  const modelVersion = gemmaAnswer ? "gemma-fts" : "local-fts";

  await supastash
    .from("ask_messages")
    .upsert(
      {
        id: userMessageId,
        thread_id: threadId,
        user_id: userId,
        role: "user",
        text: question,
        citations: null,
        image_uri: null,
        tokens_in: question.split(/\s+/).length,
        tokens_out: null,
        model_version: modelVersion,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      { onConflictKeys: ["id"] },
    )
    .syncMode("localFirst")
    .throwOnError()
    .run();

  await streamText(answer, onToken);

  const doneAt = new Date().toISOString();
  await supastash
    .from("ask_messages")
    .upsert(
      {
        id: assistantMessageId,
        thread_id: threadId,
        user_id: userId,
        role: "assistant",
        text: answer,
        citations: JSON.stringify(citations),
        image_uri: null,
        tokens_in: question.split(/\s+/).length,
        tokens_out: answer.split(/\s+/).length,
        model_version: modelVersion,
        created_at: doneAt,
        updated_at: doneAt,
        deleted_at: null,
      },
      { onConflictKeys: ["id"] },
    )
    .syncMode("localFirst")
    .throwOnError()
    .run();

  await supastash
    .from("ask_threads")
    .update({
      title: question.slice(0, 64),
      last_message_at: doneAt,
      updated_at: doneAt,
    })
    .eq("id", threadId)
    .syncMode("localFirst")
    .throwOnError()
    .run();
  await useThreadsStore.getState().hydrateThreads();
  return { answer, citations };
}

export async function searchGuideCitations(
  query: string,
  options: { crop?: string | null; diseaseId?: string | null; limit?: number } = {},
) {
  const limit = options.limit ?? 4;
  const db = await getSyncDb();
  const match = toFtsQuery(query);
  const crop = options.crop ?? "";
  const diseaseId = options.diseaseId ?? "";

  if (match) {
    try {
      const rows = await db.getAllAsync<GuideCitation>(
        `SELECT c.id, c.document_id, d.title AS document_title, c.chunk_idx, c.chunk_text,
                c.heading_path, c.crop, c.disease_id
         FROM guide_chunks_fts
         JOIN guide_chunks c ON c.rowid = guide_chunks_fts.rowid
         LEFT JOIN guide_documents d ON d.id = c.document_id
         WHERE guide_chunks_fts MATCH ?
           AND c.status = 'published'
           AND (? = '' OR c.crop IS NULL OR c.crop = ?)
           AND (? = '' OR c.disease_id IS NULL OR c.disease_id = ?)
         ORDER BY rank
         LIMIT ?`,
        match,
        crop,
        crop,
        diseaseId,
        diseaseId,
        limit,
      );
      if (rows.length > 0) {
        return rows;
      }
    } catch {
      // Fall back to LIKE below when the platform FTS parser rejects a query.
    }
  }

  return db.getAllAsync<GuideCitation>(
    `SELECT c.id, c.document_id, d.title AS document_title, c.chunk_idx, c.chunk_text,
            c.heading_path, c.crop, c.disease_id
     FROM guide_chunks c
     LEFT JOIN guide_documents d ON d.id = c.document_id
     WHERE c.status = 'published'
       AND c.chunk_text LIKE ?
       AND (? = '' OR c.crop IS NULL OR c.crop = ?)
       AND (? = '' OR c.disease_id IS NULL OR c.disease_id = ?)
     ORDER BY c.updated_at DESC
     LIMIT ?`,
    `%${query.trim()}%`,
    crop,
    crop,
    diseaseId,
    diseaseId,
    limit,
  );
}

export async function loadGuideDocuments(search = "") {
  const db = await getSyncDb();
  const term = `%${search.trim()}%`;
  return db.getAllAsync<GuideDocument>(
    `SELECT id, title, slug, crop, disease_id, category, lang, updated_at
     FROM guide_documents
     WHERE status = 'published'
       AND (? = '%%' OR title LIKE ? OR crop LIKE ? OR category LIKE ?)
     ORDER BY updated_at DESC, title ASC
     LIMIT 80`,
    term,
    term,
    term,
    term,
  );
}

export async function loadGuideDocument(docId: string) {
  const db = await getSyncDb();
  const document = await db.getFirstAsync<GuideDocument>(
    `SELECT id, title, slug, crop, disease_id, category, lang, updated_at
     FROM guide_documents
     WHERE id = ? AND status = 'published'
     LIMIT 1`,
    docId,
  );
  const chunks = await db.getAllAsync<GuideChunk>(
    `SELECT id, document_id, chunk_idx, chunk_text, heading_path
     FROM guide_chunks
     WHERE document_id = ? AND status = 'published'
     ORDER BY chunk_idx ASC`,
    docId,
  );
  return { chunks, document };
}

export async function loadBookmarkedGuideIds() {
  const db = await getSyncDb();
  const row = await db.getFirstAsync<{ value: string | null }>(
    `SELECT value FROM app_meta WHERE key = 'guide_bookmarks' LIMIT 1`,
  );
  if (!row?.value) {
    return [];
  }
  try {
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export async function setGuideBookmark(docId: string, bookmarked: boolean) {
  const db = await getSyncDb();
  const current = new Set(await loadBookmarkedGuideIds());
  if (bookmarked) {
    current.add(docId);
  } else {
    current.delete(docId);
  }
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO app_meta (id, key, value, created_at, updated_at)
     VALUES ('guide_bookmarks', 'guide_bookmarks', ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    JSON.stringify([...current]),
    now,
    now,
  );
  return [...current];
}

export async function loadCalendarTasks() {
  const db = await getSyncDb();
  const rows = await db.getAllAsync<{
    field_id: string;
    field_name: string;
    crop: string | null;
    stage: string;
    day_start: number;
    day_end: number;
    tasks: string | null;
    rule_id: string;
  }>(
    `SELECT f.id AS field_id, f.name AS field_name, f.crop, r.stage, r.day_start, r.day_end, r.tasks, r.id AS rule_id
     FROM fields f
     JOIN crop_stage_rules r ON r.crop = f.crop
     WHERE f.deleted_at IS NULL
       AND r.status = 'published'
       AND f.sowing_date IS NOT NULL
       AND CAST(julianday('now') - julianday(f.sowing_date) AS INTEGER) BETWEEN r.day_start AND r.day_end
     ORDER BY f.updated_at DESC, r.day_start ASC`,
  );

  return rows.flatMap((row) =>
    parseTasks(row.tasks).map((label, index) => ({
      id: `${row.field_id}:${row.rule_id}:${index}`,
      fieldId: row.field_id,
      fieldName: row.field_name,
      crop: row.crop,
      stage: row.stage,
      label,
      dayStart: row.day_start,
      dayEnd: row.day_end,
    })),
  );
}

export async function scheduleCalendarReminder({ task, userId }: { task: CalendarTask; userId: string }) {
  const Notifications = await import("expo-notifications");
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Notifications permission was not granted.");
  }

  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + 1);
  scheduledAt.setHours(8, 0, 0, 0);

  const notifyId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${task.fieldName}: ${task.stage}`,
      body: task.label,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: scheduledAt,
    },
  });

  const now = new Date().toISOString();
  await supastash
    .from("action_progress")
    .upsert(
      {
        id: `calendar:${task.id}`,
        user_id: userId,
        scan_id: null,
        field_id: task.fieldId,
        treatment_id: null,
        step_key: `calendar:${task.id}`,
        step_label: task.label,
        done_at: null,
        outcome: JSON.stringify({ notifyId, source: "advisor-calendar" }),
        notify_id: notifyId,
        scheduled_for: scheduledAt.toISOString(),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      { onConflictKeys: ["id"] },
    )
    .syncMode("localFirst")
    .throwOnError()
    .run();
  await useActionsStore.getState().hydrateActions();
  return { notifyId, scheduledAt: scheduledAt.toISOString() };
}

async function loadThreadContext(threadId: string) {
  const db = await getSyncDb();
  return db.getFirstAsync<{ crop: string | null; disease_id: string | null }>(
    `SELECT crop, disease_id
     FROM ask_threads
     WHERE id = ? AND deleted_at IS NULL
     LIMIT 1`,
    threadId,
  );
}

function buildGroundedAnswer(question: string, citations: GuideCitation[]) {
  if (citations.length === 0) {
    return [
      `I could not find a local guide citation for "${question}".`,
      "Try naming the crop, disease, visible symptom, or treatment method so I can search the offline library more precisely.",
    ].join("\n\n");
  }

  const points = citations.map((citation, index) => {
    const text = citation.chunk_text.replace(/\s+/g, " ").trim();
    return `${index + 1}. ${text.slice(0, 220)}${text.length > 220 ? "..." : ""} [ref:${index + 1}]`;
  });

  return [
    `Based on the offline guide library for "${question}", here are the most relevant notes:`,
    ...points,
    "Use the cited guide chunks for decisions, and keep chemical dosage or PHI tied to curated treatment records.",
  ].join("\n\n");
}

async function runGemmaAdvisorAnswer(question: string, citations: GuideCitation[]) {
  const context = useModelStore.getState().context;
  if (!context || citations.length === 0) {
    return null;
  }

  const evidence = citations
    .map((citation, index) => `[ref:${index + 1}] ${citation.chunk_text.replace(/\s+/g, " ").trim()}`)
    .join("\n\n");
  const prompt = [
    "You are Plant-AI's offline farmer advisor.",
    "Answer using only the cited local guide excerpts below.",
    "Keep the answer practical and concise.",
    "Preserve citation markers like [ref:1] beside claims that use an excerpt.",
    "Do not invent pesticide dosage, product names, or pre-harvest intervals.",
    "",
    `Question: ${question}`,
    "",
    "Local guide excerpts:",
    evidence,
  ].join("\n");

  try {
    const completion = await context.completion({
      messages: [{ role: "user", content: prompt }],
      n_predict: 420,
      temperature: 0.2,
    });
    const text = (completion.content || completion.text || "").trim();
    return text || null;
  } catch {
    return null;
  }
}

function parseTasks(value: string | null): string[] {
  if (!value) {
    return ["Inspect crop health and record any disease symptoms."];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map(String).filter(Boolean);
    }
    if (Array.isArray(parsed.tasks)) {
      return parsed.tasks.map((label: unknown) => String(label)).filter(Boolean);
    }
  } catch {
    // Treat plain markdown/text as task lines.
  }

  return value
    .split(/\n+/)
    .map((line: string) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function toFtsQuery(query: string) {
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2)
    .slice(0, 8);
  return terms.length ? terms.map((term) => `${term}*`).join(" OR ") : "";
}

function streamText(text: string, onToken?: (text: string) => void) {
  if (!onToken) {
    return Promise.resolve();
  }
  const words = text.split(/(\s+)/);
  let rendered = "";
  return new Promise<void>((resolve) => {
    let index = 0;
    const tick = () => {
      rendered += words[index] ?? "";
      onToken(rendered);
      index += 1;
      if (index >= words.length) {
        resolve();
        return;
      }
      setTimeout(tick, 8);
    };
    tick();
  });
}
