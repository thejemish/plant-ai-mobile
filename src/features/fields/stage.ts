import { getSyncDb } from "@/store/db";

export type StageRule = {
  stage: string;
  day_start: number;
  day_end: number;
};

export type ResolvedStage = {
  label: string;
  day: number;
};

export function daysSince(dateString: string) {
  const started = new Date(`${dateString}T00:00:00.000Z`);

  if (Number.isNaN(started.getTime())) {
    return null;
  }

  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const startUtc = Date.UTC(started.getUTCFullYear(), started.getUTCMonth(), started.getUTCDate());

  return Math.max(0, Math.floor((todayUtc - startUtc) / 86_400_000));
}

export async function resolveCurrentStage(crop: string | null, sowingDate: string | null): Promise<ResolvedStage | null> {
  if (!crop || !sowingDate) {
    return null;
  }

  const day = daysSince(sowingDate);
  if (day === null) {
    return null;
  }

  try {
    const db = await getSyncDb();
    const rules = await db.getAllAsync<StageRule>(
      `SELECT stage, day_start, day_end
       FROM crop_stage_rules
       WHERE crop = ? AND status = 'published' AND deleted_at IS NULL
       ORDER BY day_start ASC`,
      crop,
    );
    const rule = rules.find((candidate) => day >= candidate.day_start && day <= candidate.day_end);

    return {
      day,
      label: rule?.stage ?? `Day ${day}`,
    };
  } catch {
    return {
      day,
      label: `Day ${day}`,
    };
  }
}
