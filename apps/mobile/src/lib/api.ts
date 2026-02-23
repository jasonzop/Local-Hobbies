// src/lib/api.ts

const RAW_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

// normalize (remove trailing slash)
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

function isProbablyHtml(text: string) {
  const t = text.trim().toLowerCase();
  return t.startsWith("<!doctype html") || t.startsWith("<html");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!BASE_URL) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL is missing. Set it in .env (example: http://localhost:8080) then restart: npx expo start -c"
    );
  }

  // ensure path starts with /
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${BASE_URL}${cleanPath}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      // only set JSON header if we are sending a body or using non-GET
      ...(init.method && init.method !== "GET"
        ? { "Content-Type": "application/json" }
        : {}),
      ...(init.headers || {}),
    },
  });

  const ct = res.headers.get("content-type") || "";
  const text = await res.text().catch(() => "");

  // helpful debugging if you still hit HTML
  if (isProbablyHtml(text)) {
    throw new Error(
      [
        "Your API request returned HTML (you are hitting the Expo web server, not your backend).",
        `URL called: ${url}`,
        "Fix: set EXPO_PUBLIC_API_BASE_URL to your Spring Boot server URL.",
        "Example .env:",
        "EXPO_PUBLIC_API_BASE_URL=http://localhost:8080",
      ].join("\n")
    );
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
  }

  // parse JSON when appropriate, otherwise return text
  if (ct.includes("application/json")) {
    try {
      return JSON.parse(text) as T;
    } catch {
      // backend said json but sent something else
      throw new Error(`Expected JSON but got: ${text.slice(0, 200)}`);
    }
  }

  return text as unknown as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: any) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: any) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};