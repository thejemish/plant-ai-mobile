import * as Crypto from "expo-crypto";
import { supastash } from "supastash";
import { supabase } from "@/lib/supabase";
import { getSyncDb } from "@/store/db";
import { useActionsStore } from "@/store/use-actions";
import { useHistoryStore } from "@/store/use-history";

export type ScanRow = {
  id: string;
  user_id: string;
  field_id: string | null;
  predicted_crop: string | null;
  predicted_disease_id: string | null;
  predicted_disease_label: string | null;
  severity: string | null;
  confidence: number | null;
  model_json: string | null;
  outcome: string | null;
  created_at: string;
};

export type TreatmentMethod = "organic" | "chemical" | "cultural" | "prevention" | "immediate";

export type TreatmentRow = {
  id: string;
  disease_id: string | null;
  crop: string | null;
  severity: string | null;
  method: TreatmentMethod;
  title: string;
  steps_md: string;
  dosage: string | null;
  safety_notes_md: string | null;
  days_to_recover: number | null;
};

export type TreatmentStep = {
  key: string;
  method: TreatmentMethod;
  title: string;
  label: string;
  treatmentId: string | null;
};

export type TreatmentPlan = {
  scan: ScanRow | null;
  treatments: TreatmentRow[];
  steps: TreatmentStep[];
};

export async function loadTreatmentPlan(scanId: string): Promise<TreatmentPlan> {
  const db = await getSyncDb();
  const scan = await db.getFirstAsync<ScanRow>(
    `SELECT id, user_id, field_id, predicted_crop, predicted_disease_id, predicted_disease_label,
            severity, confidence, model_json, outcome, created_at
     FROM scans
     WHERE id = ? AND deleted_at IS NULL
     LIMIT 1`,
    scanId,
  );

  if (!scan) {
    return { scan: null, treatments: [], steps: fallbackSteps(scanId) };
  }

  const treatments = scan.predicted_disease_id
    ? await db.getAllAsync<TreatmentRow>(
        `SELECT id, disease_id, crop, severity, method, title, steps_md, dosage, safety_notes_md, days_to_recover
         FROM disease_treatments
         WHERE disease_id = ?
           AND status = 'published'
           AND deleted_at IS NULL
           AND (crop IS NULL OR crop = ?)
           AND (severity IS NULL OR severity = 'any' OR severity = ?)
         ORDER BY method, title`,
        scan.predicted_disease_id,
        scan.predicted_crop,
        scan.severity,
      )
    : [];

  const steps = treatments.length > 0 ? rowsToSteps(treatments) : fallbackSteps(scanId);

  return { scan, treatments, steps };
}

export async function toggleActionStep({
  done,
  fieldId,
  label,
  scanId,
  stepKey,
  treatmentId,
  userId,
}: {
  done: boolean;
  fieldId: string | null;
  label: string;
  scanId: string;
  stepKey: string;
  treatmentId: string | null;
  userId: string;
}) {
  const now = new Date().toISOString();
  await supastash
    .from("action_progress")
    .upsert(
      {
        id: `${scanId}:${stepKey}`,
        user_id: userId,
        scan_id: scanId,
        field_id: fieldId,
        treatment_id: treatmentId,
        step_key: stepKey,
        step_label: label,
        done_at: done ? now : null,
        outcome: null,
        notify_id: null,
        scheduled_for: null,
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
}

export async function markScanOutcome(scanId: string, outcome: "worked" | "partial" | "didnt_work") {
  const now = new Date().toISOString();
  await supastash
    .from("scans")
    .update({ outcome, outcome_at: now, updated_at: now })
    .eq("id", scanId)
    .syncMode("localFirst")
    .throwOnError()
    .run();
  await useHistoryStore.getState().hydrateScans();
}

export async function currentUserId() {
  if (!supabase) {
    return null;
  }
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export function stepsForMethod(steps: TreatmentStep[], method: TreatmentMethod) {
  if (method === "immediate") {
    return steps.filter((step) => step.method === "immediate");
  }
  return steps.filter((step) => step.method === method);
}

export function readoutText(plan: TreatmentPlan, method: TreatmentMethod) {
  const methodSteps = stepsForMethod(plan.steps, method);
  return [
    plan.scan?.predicted_disease_label ? `Plan for ${plan.scan.predicted_disease_label}.` : "Treatment plan.",
    ...methodSteps.map((step) => step.label),
  ].join(" ");
}

export function parseDosage(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const amount =
      asNumber(parsed.amount_per_acre) ??
      asNumber(parsed.rate_per_acre) ??
      asNumber(parsed.amount) ??
      asNumber(parsed.dose);
    const unit = String(parsed.unit ?? parsed.amount_unit ?? "unit");
    const waterLiters = asNumber(parsed.water_l_per_acre) ?? asNumber(parsed.water_liters_per_acre) ?? 200;
    const phiDays = asNumber(parsed.phi_days) ?? asNumber(parsed.pre_harvest_interval_days) ?? null;

    return { amount, unit, waterLiters, phiDays, raw: parsed };
  } catch {
    return null;
  }
}

function rowsToSteps(rows: TreatmentRow[]): TreatmentStep[] {
  return rows.flatMap((row) => {
    const lines = splitMarkdown(row.steps_md);
    return (lines.length ? lines : [row.title]).map((line, index) => ({
      key: `${row.method}:${row.id}:${index}`,
      method: row.method,
      title: row.title,
      label: line,
      treatmentId: row.id,
    }));
  });
}

function fallbackSteps(scanId: string): TreatmentStep[] {
  return [
    {
      key: `immediate:${scanId}:retake`,
      method: "immediate",
      title: "Confirm diagnosis",
      label: "Retake the leaf in bright shade if symptoms are unclear.",
      treatmentId: null,
    },
    {
      key: `prevention:${scanId}:observe`,
      method: "prevention",
      title: "Observe",
      label: "Avoid pesticide until the disease is confirmed by a strong match.",
      treatmentId: null,
    },
  ];
}

function splitMarkdown(markdown: string) {
  return markdown
    .split(/\n+/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function asNumber(value: unknown) {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(number) ? number : null;
}

export function makeLocalOutcomeId() {
  return Crypto.randomUUID();
}
