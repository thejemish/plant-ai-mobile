import * as Crypto from "expo-crypto";
import { supastash } from "supastash";
import { useFieldsStore } from "@/store/use-fields";

export type FieldInput = {
  name: string;
  crop: string | null;
  variety: string | null;
  sowing_date: string | null;
  area_acres: number | null;
};

function normalizeInput(input: FieldInput) {
  return {
    name: input.name.trim(),
    crop: input.crop || null,
    variety: input.variety?.trim() || null,
    sowing_date: input.sowing_date?.trim() || null,
    area_acres: Number.isFinite(input.area_acres) ? input.area_acres : null,
  };
}

export async function createField(userId: string, input: FieldInput) {
  const now = new Date().toISOString();
  const field = {
    id: Crypto.randomUUID(),
    user_id: userId,
    ...normalizeInput(input),
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  const result = await supastash.from("fields").insert(field).syncMode("localFirst").throwOnError().run();
  await useFieldsStore.getState().hydrateFields();
  return result.data?.[0] ?? field;
}

export async function updateField(fieldId: string, input: FieldInput) {
  const now = new Date().toISOString();
  const result = await supastash
    .from("fields")
    .update({ ...normalizeInput(input), updated_at: now })
    .eq("id", fieldId)
    .syncMode("localFirst")
    .throwOnError()
    .run();

  await useFieldsStore.getState().hydrateFields();
  return result.data?.[0] ?? null;
}

export async function deleteField(fieldId: string) {
  const now = new Date().toISOString();
  await supastash
    .from("fields")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", fieldId)
    .syncMode("localFirst")
    .throwOnError()
    .run();
  await useFieldsStore.getState().hydrateFields();
}
