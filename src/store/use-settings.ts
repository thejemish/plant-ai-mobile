import { create } from "zustand";
import { getSyncDb } from "./db";

export type AppLanguage = "en" | "hi" | "gu";
export type ThemePreference = "system" | "light" | "dark";

type SettingsState = {
  allowCellularDownload: boolean;
  isHydrating: boolean;
  language: AppLanguage;
  theme: ThemePreference;
  translations: Record<string, string>;
  hydrateSettings: () => Promise<void>;
  setAllowCellularDownload: (allowCellularDownload: boolean) => void;
  setLanguage: (language: AppLanguage) => Promise<void>;
  setTheme: (theme: ThemePreference) => Promise<void>;
  t: (key: string, fallback: string) => string;
};

const FALLBACK_TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: {
    "me.title": "Settings",
    "me.language": "Language",
    "me.storage": "Storage",
    "me.about": "About",
    "language.title": "Language",
    "language.body": "Choose the language used for local explanations and read-aloud flows.",
    "theme.title": "Appearance",
    "theme.system": "System",
    "theme.light": "Light",
    "theme.dark": "Dark",
  },
  hi: {
    "me.title": "सेटिंग्स",
    "me.language": "भाषा",
    "me.storage": "स्टोरेज",
    "me.about": "जानकारी",
    "language.title": "भाषा",
    "language.body": "स्थानीय समझाइश और पढ़कर सुनाने के लिए भाषा चुनें.",
    "theme.title": "रूप",
    "theme.system": "सिस्टम",
    "theme.light": "लाइट",
    "theme.dark": "डार्क",
  },
  gu: {
    "me.title": "સેટિંગ્સ",
    "me.language": "ભાષા",
    "me.storage": "સ્ટોરેજ",
    "me.about": "વિશે",
    "language.title": "ભાષા",
    "language.body": "સ્થાનિક સમજણ અને વાંચીને સંભળાવવા માટે ભાષા પસંદ કરો.",
    "theme.title": "દેખાવ",
    "theme.system": "સિસ્ટમ",
    "theme.light": "લાઇટ",
    "theme.dark": "ડાર્ક",
  },
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  allowCellularDownload: false,
  isHydrating: false,
  language: "en",
  theme: "system",
  translations: FALLBACK_TRANSLATIONS.en,
  hydrateSettings: async () => {
    set({ isHydrating: true });
    try {
      const db = await getSyncDb();
      const rows = await db.getAllAsync<{ key: string; value: string | null }>(
        `SELECT key, value FROM app_meta WHERE key IN ('lang', 'theme', 'allow_cellular_download')`,
      );
      const meta = Object.fromEntries(rows.map((row) => [row.key, row.value]));
      const language = isLanguage(meta.lang) ? meta.lang : "en";
      const theme = isTheme(meta.theme) ? meta.theme : "system";
      const remoteTranslations = await db.getAllAsync<{ field_name: string; human_text: string | null }>(
        `SELECT field_name, human_text
         FROM translations
         WHERE ref_table = 'ui'
           AND target_lang = ?
           AND status = 'approved'
           AND human_text IS NOT NULL`,
        language,
      );
      set({
        allowCellularDownload: meta.allow_cellular_download === "true",
        language,
        theme,
        translations: {
          ...FALLBACK_TRANSLATIONS[language],
          ...Object.fromEntries(remoteTranslations.map((row) => [row.field_name, row.human_text ?? ""])),
        },
      });
    } catch {
      set({ translations: FALLBACK_TRANSLATIONS[get().language] });
    } finally {
      set({ isHydrating: false });
    }
  },
  setAllowCellularDownload: (allowCellularDownload) => {
    set({ allowCellularDownload });
    void writeMeta("allow_cellular_download", String(allowCellularDownload));
  },
  setLanguage: async (language) => {
    set({ language, translations: FALLBACK_TRANSLATIONS[language] });
    await writeMeta("lang", language);
    await get().hydrateSettings();
  },
  setTheme: async (theme) => {
    set({ theme });
    await writeMeta("theme", theme);
  },
  t: (key, fallback) => get().translations[key] ?? fallback,
}));

async function writeMeta(key: string, value: string) {
  const db = await getSyncDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO app_meta (id, key, value, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key,
    key,
    value,
    now,
    now,
  );
}

function isLanguage(value: string | null | undefined): value is AppLanguage {
  return value === "en" || value === "hi" || value === "gu";
}

function isTheme(value: string | null | undefined): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}
