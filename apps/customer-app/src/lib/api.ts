import { Platform } from "react-native";

const API_BASE = "https://gateway-production-af6e.up.railway.app/api/v1";

type Tokens = { accessToken: string; refreshToken: string };

let _tokens: Tokens | null = null;
let _onUnauthorized: (() => void) | null = null;

export function setTokens(tokens: Tokens | null) {
  _tokens = tokens;
}

export function getAccessToken() {
  return _tokens?.accessToken;
}

export function onUnauthorized(handler: () => void) {
  _onUnauthorized = handler;
}

async function request(method: string, path: string, body?: any, customAuth?: string) {
  const headers: Record<string, string> = {};
  if (body) headers["Content-Type"] = "application/json";

  if (customAuth) {
    headers["Authorization"] = customAuth;
  } else if (_tokens?.accessToken) {
    headers["Authorization"] = `Bearer ${_tokens.accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && _onUnauthorized) {
    _onUnauthorized();
    throw new Error("Session expired");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ─── API Methods ────────────────────────────────────────────────

export const authApi = {
  login: (firebaseToken: string) =>
    request("POST", "/auth/login", undefined, `Bearer ${firebaseToken}`),

  getProfile: () => request("GET", "/users/me"),

  updateProfile: (data: { name?: string; email?: string; gender?: string }) =>
    request("PUT", "/users/me", data),
};

// ─── Token Persistence ──────────────────────────────────────────

export async function loadTokens(): Promise<Tokens | null> {
  try {
    if (Platform.OS === "web") {
      const raw = localStorage.getItem("@spinzo/tokens");
      return raw ? JSON.parse(raw) : null;
    }
    const { default: SecureStore } = await import("expo-secure-store");
    const raw = await SecureStore.getItemAsync("@spinzo/tokens");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveTokens(tokens: Tokens | null) {
  try {
    if (Platform.OS === "web") {
      if (tokens) localStorage.setItem("@spinzo/tokens", JSON.stringify(tokens));
      else localStorage.removeItem("@spinzo/tokens");
      return;
    }
    const { default: SecureStore } = await import("expo-secure-store");
    if (tokens) await SecureStore.setItemAsync("@spinzo/tokens", JSON.stringify(tokens));
    else await SecureStore.deleteItemAsync("@spinzo/tokens");
  } catch (e) {
    console.error("Failed to save tokens:", e);
  }
}
