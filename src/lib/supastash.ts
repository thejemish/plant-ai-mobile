import { openDatabaseAsync } from "expo-sqlite";
import NetInfo from "@react-native-community/netinfo";
import { configureSupastash, defineLocalSchema } from "supastash";
import { supabase } from "./supabase";

configureSupastash({
  supabaseClient: supabase,
  dbName: "plant_ai_sync.db",
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
      sample_id: "TEXT PRIMARY KEY",
      model_id: "TEXT NOT NULL",
      preprocess_id: "TEXT NOT NULL",
      dim: "INTEGER NOT NULL",
      normalized: "INTEGER DEFAULT 1",
      embedding_base64: "TEXT NOT NULL",
      updated_at: "TEXT NOT NULL",
      __indices: ["model_id", "preprocess_id"],
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
      updated_at: "TEXT NOT NULL",
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
      shared_anon: "INTEGER DEFAULT 0",
      created_at: "TEXT NOT NULL",
      updated_at: "TEXT NOT NULL",
      __indices: ["user_id", "field_id", "predicted_crop"],
    });
  },

  debugMode: __DEV__,
  syncEngine: {
    push: true,
    pull: true,
  },
  fullSyncTables: [
    "crops",
    "diseases",
    "disease_treatments",
    "leaf_samples",
    "leaf_sample_embeddings",
    "guide_chunks",
    "translations",
    "crop_stage_rules",
  ],
  excludeTables: {
    push: [
      "crops",
      "diseases",
      "disease_treatments",
      "leaf_samples",
      "leaf_sample_embeddings",
      "guide_chunks",
      "translations",
      "crop_stage_rules",
    ],
    pull: [],
  },
});
