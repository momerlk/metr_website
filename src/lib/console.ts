export type Seller = { account: { id: string; email: string }; merchant: { id: string; name: string }; shopify_enabled: boolean };
export type Store = { id: string; name: string; domain: string };
export type APIKey = { id: string; name: string; store_id: string; prefix: string; scopes: string[]; revoked_at?: string; expires_at?: string };
export type ShopifyConnection = { store_id: string; shop?: string; status: "not_connected" | "authorized" | "reauthorization_required" | "unknown"; expires_at?: string };
const identifier = /^[A-Za-z0-9_-]{1,64}$/;
export function consoleEndpoint(method: string, path: string[]): string | null {
  if (path.length === 1) {
    const allowed: Record<string, string[]> = { signup: ["POST"], login: ["POST"], logout: ["POST"], me: ["GET"], stores: ["GET", "POST"], "api-keys": ["GET", "POST"] };
    return allowed[path[0]]?.includes(method) ? `/v1/console/${path[0]}` : null;
  }
  if (path.length === 2 && path[0] === "api-keys" && identifier.test(path[1]) && method === "DELETE") return `/v1/console/api-keys/${path[1]}`;
  if (path.length === 2 && path[0] === "shopify" && path[1] === "callback" && method === "GET") return "/v1/console/shopify/callback";
  if (path[0] === "stores" && identifier.test(path[1] || "") && path[2] === "shopify") {
    if (path.length === 3 && ["GET", "DELETE"].includes(method)) return `/v1/console/stores/${path[1]}/shopify`;
    if (path.length === 4 && path[3] === "start" && method === "POST") return `/v1/console/stores/${path[1]}/shopify/start`;
  }
  return null;
}
export function consoleOriginAllowed(origin: string | null, expected: string): boolean {
  return !!origin && origin === expected;
}
export async function limitedText(stream: ReadableStream<Uint8Array> | null, max: number): Promise<string> {
  if (!stream) return "";
  const reader = stream.getReader(); const decoder = new TextDecoder(); let size = 0, text = "";
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > max) { await reader.cancel(); throw new Error("Request is too large."); } text += decoder.decode(value, { stream: true }); }
    return text + decoder.decode();
  } finally { reader.releaseLock(); }
}
