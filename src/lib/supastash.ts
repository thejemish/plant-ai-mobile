import { openDatabaseAsync } from "expo-sqlite";
import NetInfo from "@react-native-community/netinfo";
import { configureSupastash, defineLocalSchema } from "supastash";
import { supabase } from "./supabase";

const DB_NAME = "plant_ai_sync.db";
const LOCAL_ONLY_SYNC_EXCLUSIONS = [
  "app_meta",
  "weather_cache",
  "guide_chunks_fts",
  "guide_chunks_fts_data",
  "guide_chunks_fts_idx",
  "guide_chunks_fts_docsize",
  "guide_chunks_fts_config",
  "pests_fts",
  "pests_fts_data",
  "pests_fts_idx",
  "pests_fts_docsize",
  "pests_fts_config",
];

configureSupastash({
  supabaseClient: supabase,
  dbName: DB_NAME,
  sqliteClient: { openDatabaseAsync },
  sqliteClientType: "expo", // "rn-nitro" or "rn-storage"
  networkAdapter: NetInfo,

  onSchemaInit: async () => {
    await defineLocalSchema("crops", {
      id: "TEXT PRIMARY KEY",
      display_name: "TEXT NOT NULL",
      aliases: "TEXT",
      family: "TEXT",
      icon_url: "TEXT",
      status: "TEXT DEFAULT 'published'",
      updated_at: "TEXT NOT NULL",
      __indices: ["display_name", "status"],
    });

    await defineLocalSchema("diseases", {
      id: "TEXT PRIMARY KEY",
      slug: "TEXT NOT NULL",
      name: "TEXT NOT NULL",
      scientific_name: "TEXT",
      crops: "TEXT NOT NULL",
      aliases: "TEXT",
      cause: "TEXT",
      symptoms: "TEXT",
      symptoms_md: "TEXT",
      prevention_md: "TEXT",
      severity_levels: "TEXT",
      is_healthy: "INTEGER DEFAULT 0",
      status: "TEXT DEFAULT 'published'",
      updated_at: "TEXT NOT NULL",
      __indices: ["slug", "name", "status"],
    });

    await defineLocalSchema("disease_treatments", {
      id: "TEXT PRIMARY KEY",
      disease_id: "TEXT",
      crop: "TEXT",
      severity: "TEXT",
      method: "TEXT NOT NULL",
      title: "TEXT NOT NULL",
      steps_md: "TEXT NOT NULL",
      dosage: "TEXT",
      safety_notes_md: "TEXT",
      days_to_recover: "INTEGER",
      status: "TEXT DEFAULT 'published'",
      updated_at: "TEXT NOT NULL",
      __indices: ["disease_id", "crop", "severity", "method", "status"],
    });

    await defineLocalSchema("leaf_samples", {
      id: "TEXT PRIMARY KEY",
      disease_id: "TEXT",
      crop: "TEXT NOT NULL",
      disease_label: "TEXT NOT NULL",
      source: "TEXT",
      caption: "TEXT",
      symptoms_text: "TEXT",
      image_url: "TEXT NOT NULL",
      image_thumb_url: "TEXT",
      verified: "INTEGER DEFAULT 0",
      status: "TEXT DEFAULT 'published'",
      updated_at: "TEXT NOT NULL",
      __indices: ["crop", "disease_id", "disease_label", "status"],
    });

    await defineLocalSchema("leaf_sample_embeddings", {
      id: "TEXT PRIMARY KEY",
      sample_id: "TEXT NOT NULL UNIQUE",
      model_id: "TEXT NOT NULL",
      preprocess_id: "TEXT NOT NULL",
      dim: "INTEGER NOT NULL",
      normalized: "INTEGER DEFAULT 1",
      embedding_base64: "TEXT NOT NULL",
      updated_at: "TEXT NOT NULL",
      __indices: ["model_id", "preprocess_id"],
    });

    await defineLocalSchema("guide_documents", {
      id: "TEXT PRIMARY KEY",
      title: "TEXT NOT NULL",
      slug: "TEXT",
      crop: "TEXT",
      disease_id: "TEXT",
      category: "TEXT",
      lang: "TEXT DEFAULT 'en'",
      source_url: "TEXT",
      status: "TEXT DEFAULT 'published'",
      updated_at: "TEXT NOT NULL",
      __indices: ["slug", "crop", "disease_id", "category", "lang", "status"],
    });

    await defineLocalSchema("guide_chunks", {
      id: "TEXT PRIMARY KEY",
      document_id: "TEXT",
      chunk_idx: "INTEGER NOT NULL",
      chunk_text: "TEXT NOT NULL",
      heading_path: "TEXT",
      page_number: "INTEGER",
      crop: "TEXT",
      disease_id: "TEXT",
      category: "TEXT",
      stage: "TEXT",
      symptoms: "TEXT",
      lang: "TEXT DEFAULT 'en'",
      status: "TEXT DEFAULT 'published'",
      updated_at: "TEXT NOT NULL",
      __indices: ["crop", "disease_id", "lang", "category", "status"],
    });

    await defineLocalSchema("translations", {
      id: "TEXT PRIMARY KEY",
      ref_table: "TEXT NOT NULL",
      ref_id: "TEXT NOT NULL",
      field_name: "TEXT NOT NULL",
      source_lang: "TEXT DEFAULT 'en'",
      target_lang: "TEXT NOT NULL",
      source_text: "TEXT",
      human_text: "TEXT",
      status: "TEXT DEFAULT 'approved'",
      updated_at: "TEXT NOT NULL",
      __indices: ["ref_table", "ref_id", "target_lang", "status"],
    });

    await defineLocalSchema("crop_stage_rules", {
      id: "TEXT PRIMARY KEY",
      crop: "TEXT NOT NULL",
      stage: "TEXT NOT NULL",
      day_start: "INTEGER NOT NULL",
      day_end: "INTEGER NOT NULL",
      tasks: "TEXT",
      region: "TEXT",
      status: "TEXT DEFAULT 'published'",
      updated_at: "TEXT NOT NULL",
      __indices: ["crop", "stage", "status"],
    });

    await defineLocalSchema("pests", {
      id: "TEXT PRIMARY KEY",
      slug: "TEXT",
      name: "TEXT NOT NULL",
      scientific_name: "TEXT",
      crops: "TEXT",
      image_url: "TEXT",
      identification: "TEXT",
      damage: "TEXT",
      organic_md: "TEXT",
      chemical_md: "TEXT",
      beneficials: "TEXT",
      region: "TEXT",
      status: "TEXT DEFAULT 'published'",
      updated_at: "TEXT NOT NULL",
      __indices: ["slug", "name", "status", "region"],
    });

    await defineLocalSchema("fields", {
      id: "TEXT PRIMARY KEY",
      user_id: "TEXT NOT NULL",
      name: "TEXT NOT NULL",
      crop: "TEXT",
      variety: "TEXT",
      sowing_date: "TEXT",
      area_acres: "REAL",
      lat: "REAL",
      lng: "REAL",
      created_at: "TEXT NOT NULL",
      updated_at: "TEXT NOT NULL",
      deleted_at: "TEXT",
      __indices: ["user_id", "crop"],
    });

    await defineLocalSchema("scans", {
      id: "TEXT PRIMARY KEY",
      user_id: "TEXT NOT NULL",
      field_id: "TEXT",
      local_image_uri: "TEXT",
      image_url: "TEXT",
      predicted_crop: "TEXT",
      predicted_disease_id: "TEXT",
      predicted_disease_label: "TEXT",
      severity: "TEXT",
      confidence: "REAL",
      top_matches: "TEXT",
      embedding_model_id: "TEXT",
      embedding_preprocess_id: "TEXT",
      symptoms: "TEXT",
      model_json: "TEXT",
      user_correction: "TEXT",
      outcome: "TEXT",
      outcome_at: "TEXT",
      model_version: "TEXT",
      shared_anon: "INTEGER DEFAULT 0",
      created_at: "TEXT NOT NULL",
      updated_at: "TEXT NOT NULL",
      deleted_at: "TEXT",
      __indices: ["user_id", "field_id", "predicted_crop"],
    });

    await defineLocalSchema("ask_threads", {
      id: "TEXT PRIMARY KEY",
      user_id: "TEXT NOT NULL",
      title: "TEXT",
      crop: "TEXT",
      disease_id: "TEXT",
      scan_id: "TEXT",
      lang: "TEXT DEFAULT 'en'",
      last_message_at: "TEXT",
      created_at: "TEXT NOT NULL",
      updated_at: "TEXT NOT NULL",
      deleted_at: "TEXT",
      __indices: ["user_id", "scan_id", "last_message_at"],
    });

    await defineLocalSchema("ask_messages", {
      id: "TEXT PRIMARY KEY",
      thread_id: "TEXT NOT NULL",
      user_id: "TEXT NOT NULL",
      role: "TEXT NOT NULL",
      text: "TEXT NOT NULL",
      citations: "TEXT",
      image_uri: "TEXT",
      tokens_in: "INTEGER",
      tokens_out: "INTEGER",
      model_version: "TEXT",
      created_at: "TEXT NOT NULL",
      updated_at: "TEXT NOT NULL",
      deleted_at: "TEXT",
      __indices: ["thread_id", "user_id", "role"],
    });

    await defineLocalSchema("action_progress", {
      id: "TEXT PRIMARY KEY",
      user_id: "TEXT NOT NULL",
      scan_id: "TEXT",
      field_id: "TEXT",
      treatment_id: "TEXT",
      step_key: "TEXT NOT NULL",
      step_label: "TEXT",
      done_at: "TEXT",
      outcome: "TEXT",
      notify_id: "TEXT",
      scheduled_for: "TEXT",
      created_at: "TEXT NOT NULL",
      updated_at: "TEXT NOT NULL",
      deleted_at: "TEXT",
      __indices: ["user_id", "scan_id", "field_id", "done_at"],
    });

    const db = await openDatabaseAsync(DB_NAME);
    // app_meta is local-only and excluded from sync. Creating it manually
    // avoids Android expo-sqlite NPEs seen through Supastash defineLocalSchema.
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS app_meta (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced_at TEXT DEFAULT NULL,
        deleted_at TEXT DEFAULT NULL
      )
    `);
    await db.runAsync("CREATE INDEX IF NOT EXISTS idx_app_meta_key ON app_meta(key)");
    await db.runAsync("CREATE INDEX IF NOT EXISTS idx_app_meta_updated_at ON app_meta(updated_at)");
    await db.runAsync("CREATE INDEX IF NOT EXISTS idx_app_meta_deleted_at ON app_meta(deleted_at)");

    // weather_cache is local-only and excluded from Supastash sync. Creating it
    // manually avoids an Android expo-sqlite execAsync NPE seen through
    // defineLocalSchema on this table.
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS weather_cache (
        id TEXT PRIMARY KEY,
        field_id TEXT,
        lat REAL,
        lng REAL,
        fetched_at TEXT NOT NULL,
        forecast_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced_at TEXT DEFAULT NULL,
        deleted_at TEXT DEFAULT NULL
      );
    `);
    await db.runAsync("CREATE INDEX IF NOT EXISTS idx_weather_cache_field_id ON weather_cache(field_id);");
    await db.runAsync("CREATE INDEX IF NOT EXISTS idx_weather_cache_fetched_at ON weather_cache(fetched_at);");
    await db.runAsync("CREATE INDEX IF NOT EXISTS idx_weather_cache_updated_at ON weather_cache(updated_at);");
    await db.runAsync("CREATE INDEX IF NOT EXISTS idx_weather_cache_deleted_at ON weather_cache(deleted_at);");

    const ftsSchemaStatements = [
      `CREATE VIRTUAL TABLE IF NOT EXISTS guide_chunks_fts
       USING fts5(chunk_text, content='guide_chunks', content_rowid='rowid')`,
      "INSERT INTO guide_chunks_fts(guide_chunks_fts) VALUES('rebuild')",
      `CREATE TRIGGER IF NOT EXISTS guide_chunks_fts_ai
       AFTER INSERT ON guide_chunks BEGIN
         INSERT INTO guide_chunks_fts(rowid, chunk_text)
         VALUES (new.rowid, new.chunk_text);
       END`,
      `CREATE TRIGGER IF NOT EXISTS guide_chunks_fts_ad
       AFTER DELETE ON guide_chunks BEGIN
         INSERT INTO guide_chunks_fts(guide_chunks_fts, rowid, chunk_text)
         VALUES ('delete', old.rowid, old.chunk_text);
       END`,
      `CREATE TRIGGER IF NOT EXISTS guide_chunks_fts_au
       AFTER UPDATE ON guide_chunks BEGIN
         INSERT INTO guide_chunks_fts(guide_chunks_fts, rowid, chunk_text)
         VALUES ('delete', old.rowid, old.chunk_text);
         INSERT INTO guide_chunks_fts(rowid, chunk_text)
         VALUES (new.rowid, new.chunk_text);
       END`,
      `CREATE VIRTUAL TABLE IF NOT EXISTS pests_fts
       USING fts5(identification, damage, content='pests', content_rowid='rowid')`,
      "INSERT INTO pests_fts(pests_fts) VALUES('rebuild')",
      `CREATE TRIGGER IF NOT EXISTS pests_fts_ai
       AFTER INSERT ON pests BEGIN
         INSERT INTO pests_fts(rowid, identification, damage)
         VALUES (new.rowid, new.identification, new.damage);
       END`,
      `CREATE TRIGGER IF NOT EXISTS pests_fts_ad
       AFTER DELETE ON pests BEGIN
         INSERT INTO pests_fts(pests_fts, rowid, identification, damage)
         VALUES ('delete', old.rowid, old.identification, old.damage);
       END`,
      `CREATE TRIGGER IF NOT EXISTS pests_fts_au
       AFTER UPDATE ON pests BEGIN
         INSERT INTO pests_fts(pests_fts, rowid, identification, damage)
         VALUES ('delete', old.rowid, old.identification, old.damage);
         INSERT INTO pests_fts(rowid, identification, damage)
         VALUES (new.rowid, new.identification, new.damage);
       END`,
    ];

    for (const statement of ftsSchemaStatements) {
      await db.runAsync(statement);
    }
  },

  debugMode: __DEV__,
  replicationMode: "server-side",
  listeners: 500,
  syncEngine: {
    push: true,
    pull: true,
    useFiltersFromStore: true,
  },
  fullSyncTables: [
    "crops",
    "diseases",
    "disease_treatments",
    "leaf_samples",
    "leaf_sample_embeddings",
    "guide_chunks",
    "guide_documents",
    "translations",
    "crop_stage_rules",
    "pests",
  ],
  excludeTables: {
    push: [
      "crops",
      "diseases",
      "disease_treatments",
      "leaf_samples",
      "leaf_sample_embeddings",
      "guide_chunks",
      "guide_documents",
      "translations",
      "crop_stage_rules",
      "pests",
      ...LOCAL_ONLY_SYNC_EXCLUSIONS,
    ],
    pull: LOCAL_ONLY_SYNC_EXCLUSIONS,
  },
});
