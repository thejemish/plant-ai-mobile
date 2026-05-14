import { getSyncDb } from "@/store/db";

export async function writeAppMeta(key: string, value: unknown) {
  const db = await getSyncDb();
  const now = new Date().toISOString();
  const serialized = typeof value === "string" ? value : JSON.stringify(value);

  await db.runAsync(
    `INSERT INTO app_meta (id, key, value, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key,
    key,
    serialized,
    now,
    now,
  );
}
