import { openDatabaseAsync } from "expo-sqlite";

export const SYNC_DB_NAME = "plant_ai_sync.db";

export async function getSyncDb() {
  return openDatabaseAsync(SYNC_DB_NAME);
}
