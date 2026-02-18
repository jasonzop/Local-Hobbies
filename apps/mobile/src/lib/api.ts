const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!BASE_URL) throw new Error("EXPO_PUBLIC_API_BASE_URL is missing");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${txt}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: any) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: any) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};
