import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import "expo-sqlite/localStorage/install";
import { AppState } from "react-native";
import "react-native-url-polyfill/auto";

const extra = Constants.expoConfig?.extra;

const supabaseUrl = extra?.supabaseUrl as string | undefined;
const supabaseKey = extra?.supabaseKey as string | undefined;
const authStorage =
  typeof globalThis.localStorage?.getItem === "function" ? globalThis.localStorage : undefined;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        storage: authStorage,
        autoRefreshToken: true,
        persistSession: Boolean(authStorage),
        detectSessionInUrl: false,
      },
    })
  : null;

AppState.addEventListener("change", (state) => {
  if (!supabase) {
    return;
  }

  if (state === "active") {
    supabase.auth.startAutoRefresh();
    return;
  }

  supabase.auth.stopAutoRefresh();
});
