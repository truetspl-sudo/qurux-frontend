/**
 * QURUX API Client
 * Central fetch wrapper with JWT auth, error handling, and base URL config.
 */

// NEXT_PUBLIC_API_URL is the server root (e.g. https://api.example.com).
// All backend routes live under /api, so append it here. If the env value
// already ends with /api (older convention), don't double it.
const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const API_BASE = API_ROOT.endsWith("/api") ? API_ROOT : `${API_ROOT}/api`;

// ── Token helpers ──────────────────────────
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("qurux_token");
}

export function setToken(token: string) {
  localStorage.setItem("qurux_token", token);
}

export function clearToken() {
  localStorage.removeItem("qurux_token");
}

// ── Types ──────────────────────────────────
interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
  message?: string;
}

// ── Core fetch wrapper ─────────────────────
export async function api<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { body, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...rest,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data: data as T,
        message: (data as any)?.message || `Error ${res.status}`,
      };
    }

    return { ok: true, status: res.status, data: data as T };
  } catch (error: any) {
    return {
      ok: false,
      status: 0,
      data: null as T,
      message: error?.message || "Network error",
    };
  }
}

// ── Convenience methods ────────────────────
export const apiGet = <T = unknown>(path: string) => api<T>(path);

export const apiPost = <T = unknown>(path: string, body: unknown) =>
  api<T>(path, { method: "POST", body });

export const apiPut = <T = unknown>(path: string, body: unknown) =>
  api<T>(path, { method: "PUT", body });

export const apiPatch = <T = unknown>(path: string, body: unknown) =>
  api<T>(path, { method: "PATCH", body });

export const apiDelete = <T = unknown>(path: string) =>
  api<T>(path, { method: "DELETE" });

// ── Auth-specific helpers ──────────────────
export async function login(userIdOrEmail: string, password: string) {
  const res = await apiPost<{
    token: string;
    user: any;
    message: string;
  }>("/auth/login", { userId: userIdOrEmail, password });

  if (res.ok && res.data.token) {
    setToken(res.data.token);
    localStorage.setItem("qurux_user", JSON.stringify(res.data.user));
  }

  return res;
}

export async function register(fullName: string, email: string, mobile: string, password: string) {
  const res = await apiPost<{
    token: string;
    user: any;
    message: string;
  }>("/auth/register", { fullName, email, mobile, password });

  if (res.ok && res.data.token) {
    setToken(res.data.token);
    localStorage.setItem("qurux_user", JSON.stringify(res.data.user));
  }

  return res;
}

export function logout() {
  clearToken();
  localStorage.removeItem("qurux_user");
  if (typeof window !== "undefined") {
    window.location.href = "/account";
  }
}

export function getLoggedInUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("qurux_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
