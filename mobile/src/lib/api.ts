import { API_URL, NETWORK_TIMEOUT_MS } from "../config";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export class NetworkError extends Error {
  constructor(message = "Unable to connect right now. Please check your internet connection and try again.") {
    super(message);
    this.name = "NetworkError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor() {
    super(401, "Your session has expired. Please sign in again.");
    this.name = "UnauthorizedError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  timeoutMs?: number;
  raw?: boolean;
}

export function warmUp(): void {
  // Wakes a sleeping free-tier backend early (e.g. Render) so first user
  // requests aren't aborted by the default timeout. Fire-and-forget.
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120000);
    fetch(`${API_URL}/health`, { method: "GET", signal: controller.signal })
      .catch(() => {})
      .finally(() => clearTimeout(timer));
  } catch {
    // Warm-up is optional; ignore failures.
  }
}

export async function apiRequest<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? NETWORK_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new NetworkError(
        "The server is taking too long to respond. Please try again in a moment."
      );
    }
    throw new NetworkError();
  } finally {
    clearTimeout(timer);
  }

  // 204 no-content
  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) {
    const msg =
      (typeof data === "object" && data !== null && "detail" in data &&
        typeof (data as { detail: unknown }).detail === "string"
        ? (data as { detail: string }).detail
        : `Request failed (${res.status}).`) || `Request failed (${res.status}).`;
    throw new ApiError(res.status, msg, data);
  }

  return data as T;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}