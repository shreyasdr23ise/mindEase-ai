import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const TOKEN_KEY = "mindease.token";
const USER_KEY = "mindease.user";
const THEME_KEY = "mindease.theme";
const RECENT_MEDICINE_KEY = "mindease.recent_medicines";
const JOURNAL_DRAFT_KEY = "mindease.journal_draft";
const REMINDER_KEY = "mindease.reminder_enabled";

export function sanitize(value: string): string {
  return value
    .replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

// ── Auth session (token stored in the secure OS keystore) ────────────────
// On web, SecureStore is unavailable; fall back to localStorage so the web
// build of the app can persist login sessions too.
const isSecureStoreSupported = Platform.OS !== "web" && typeof window === "undefined";

export async function saveToken(token: string): Promise<void> {
  if (isSecureStoreSupported) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch { /* ignore */ }
  }
}
export async function loadToken(): Promise<string | null> {
  if (isSecureStoreSupported) {
    return SecureStore.getItemAsync(TOKEN_KEY);
  }
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export async function clearToken(): Promise<void> {
  if (isSecureStoreSupported) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } else {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch { /* ignore */ }
  }
}
export async function saveUser(user: unknown): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}
export async function loadUser<T = unknown>(): Promise<T | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
export async function clearUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY);
}

// ── Preferences ──────────────────────────────────────────────────────────
export const prefGet = (key: string) => AsyncStorage.getItem(key);
export const prefSet = (key: string, value: string) => AsyncStorage.setItem(key, value);
export const prefRemove = (key: string) => AsyncStorage.removeItem(key);

export async function loadThemeMode(): Promise<string | null> {
  return AsyncStorage.getItem(THEME_KEY);
}
export async function saveThemeMode(mode: string): Promise<void> {
  if (mode === "light" || mode === "dark" || mode === "system") {
    await AsyncStorage.setItem(THEME_KEY, mode);
  }
}

// ── Recently viewed medicines (local, non-sensitive) ─────────────────────
export interface RecentMedicine {
  id: string;
  name: string;
}

export async function pushRecentMedicine(item: RecentMedicine): Promise<void> {
  const raw = await AsyncStorage.getItem(RECENT_MEDICINE_KEY);
  let list: RecentMedicine[] = [];
  if (raw) {
    try {
      list = JSON.parse(raw) as RecentMedicine[];
    } catch {
      list = [];
    }
  }
  list = list.filter((m) => m.id !== item.id);
  list.unshift(item);
  await AsyncStorage.setItem(RECENT_MEDICINE_KEY, JSON.stringify(list.slice(0, 8)));
}

export async function getRecentMedicines(): Promise<RecentMedicine[]> {
  const raw = await AsyncStorage.getItem(RECENT_MEDICINE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RecentMedicine[];
  } catch {
    return [];
  }
}

// ── Journal draft (kept locally so writing is never lost) ────────────────
export interface JournalDraft {
  content: string;
  title: string;
  mood?: string;
  prompt?: string;
  updatedAt: string;
}

export async function saveJournalDraft(draft: JournalDraft | null): Promise<void> {
  if (!draft || !draft.content.trim()) {
    await AsyncStorage.removeItem(JOURNAL_DRAFT_KEY);
    return;
  }
  await AsyncStorage.setItem(JOURNAL_DRAFT_KEY, JSON.stringify(draft));
}

export async function loadJournalDraft(): Promise<JournalDraft | null> {
  const raw = await AsyncStorage.getItem(JOURNAL_DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as JournalDraft;
  } catch {
    return null;
  }
}

// ── Trusted contacts (device-only, never uploaded) ────────────────────────
const TRUST_KEY = "mindease.trust_contacts";

export interface TrustContact {
  name: string;
  number: string;
}

export async function saveTrustContacts(list: TrustContact[]): Promise<void> {
  await AsyncStorage.setItem(TRUST_KEY, JSON.stringify(list.slice(0, 5)));
}

export async function loadTrustContacts(): Promise<TrustContact[] | null> {
  const raw = await AsyncStorage.getItem(TRUST_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as TrustContact[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return null;
  }
}

// ── Local wellness check-in reminders (optional, user-controlled) ────────
export async function loadReminderEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(REMINDER_KEY)) === "1";
}
export async function saveReminderEnabled(on: boolean): Promise<void> {
  await AsyncStorage.setItem(REMINDER_KEY, on ? "1" : "0");
}