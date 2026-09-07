// Device/session context headers sent with every API request.
//
// These power the backend's centralized activity_logs table (device model, OS,
// network, session). They contain NO sensitive identifiers (no IMEI, no
// serial, no phone number).
import { Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { prefGet, prefSet } from "./storage";

let sessionIdPromise: Promise<string> | null = null;
let netTypePromise: Promise<string> | null = null;

export function requestId(): string {
  let out = "";
  try {
    // @ts-ignore available in Hermes/modern runtimes
    out = globalThis.crypto?.randomUUID?.() || "";
  } catch {
    out = "";
  }
  if (!out) {
    out = "req-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  return out;
}

async function getOrCreateSessionId(): Promise<string> {
  const existing = await prefGet("mindease_session_id");
  if (existing) return existing;
  const created =
    "sess-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  await prefSet("mindease_session_id", created);
  return created;
}

function deviceInfoStatic(): Record<string, string> {
  const info: Record<string, string> = {
    "X-Device-Type": "mobile",
  };
  try {
    const constants = (Platform as unknown as { constants?: Record<string, unknown> }).constants ?? {};
    if (Platform.OS === "android") {
      const manufacturer = constants.Manufacturer;
      const model = constants.Model;
      const brand = constants.Brand;
      if (typeof manufacturer === "string" && manufacturer) info["X-Device-Manufacturer"] = manufacturer.slice(0, 64);
      if (typeof model === "string" && model) info["X-Device-Model"] = model.slice(0, 64);
      else if (typeof brand === "string" && brand) info["X-Device-Model"] = brand.slice(0, 64);
      info["X-Os"] = "android";
      info["X-Os-Version"] = String(constants.Release ?? "").slice(0, 32);
    } else {
      const model = constants.model ?? constants.Machine ?? "iPhone";
      if (typeof model === "string" && model) info["X-Device-Model"] = String(model).slice(0, 64);
      info["X-Device-Manufacturer"] = "Apple";
      info["X-Os"] = "ios";
      const ver = constants.osVersion ?? constants.systemVersion ?? "";
      info["X-Os-Version"] = String(ver).slice(0, 32);
    }
  } catch {
    // Best-effort only.
  }
  return info;
}

async function currentNetworkType(): Promise<string> {
  try {
    const state = await NetInfo.fetch();
    return state.type ?? "unknown";
  } catch {
    return "unknown";
  }
}

export async function deviceHeaders(): Promise<Record<string, string>> {
  const staticInfo = deviceInfoStatic();
  if (!sessionIdPromise) sessionIdPromise = getOrCreateSessionId();
  if (!netTypePromise) netTypePromise = currentNetworkType();
  const [sessionId, netType] = await Promise.all([sessionIdPromise, netTypePromise]);
  return {
    ...staticInfo,
    "X-Session-Id": sessionId,
    "X-Request-Id": requestId(),
    "X-Network-Type": netType,
    "X-App-Version": "1.0.0",
  };
}