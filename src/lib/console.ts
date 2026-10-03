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
  if (path.length === 2 && path[0] === "shopify" && path[1] === "launch" && ["GET", "POST"].includes(method)) return "/v1/console/shopify/launch";
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

// Only known error categories may cross the callback redirect; never forward
// raw upstream messages, authorization codes, state, or tokens in the URL.
export const shopifyCallbackErrors: Record<string, string> = {
  invalid_shop: "The selected Metr store needs a valid https://name.myshopify.com address before Shopify authorization.",
  invalid_launch: "Shopify’s app launch expired or could not be verified. Open Metr again from Shopify, then select your Metr store to authorize it.",
  shop_mismatch: "Shopify returned a different shop from the one you authorized. Open Metr from Shopify and select the Metr store to connect; Metr will start a new authorization for Shopify’s verified shop.",
  invalid_callback: "Shopify’s callback could not be verified. Start a new connection from this console. If it fails again, the app credentials and callback settings need checking.",
  invalid_state: "This connection attempt expired, was already used, or returned a different Shopify store. Check the store’s permanent myshopify.com address, then reconnect in the same signed-in browser.",
  store_changed: "The store details changed during authorization. Check the saved store address and start again.",
  shopify_unavailable: "Metr could not exchange Shopify’s authorization code. The backend app credentials or Shopify token exchange need checking.",
  shopify_unconfigured: "Shopify authorization is not configured on the backend yet.",
};
export function shopifyCallbackResult(ok: boolean, status: number, code: unknown): string {
  if (ok) return "authorized";
  if (status === 401) return "sign_in";
  return typeof code === "string" && Object.hasOwn(shopifyCallbackErrors, code) ? code : "failed";
}

// Presence checks distinguish app launches from partial/invalid OAuth callbacks.
export function shopifyAppLaunch(params: URLSearchParams): boolean {
  return params.has("shop") && !params.has("code") && !params.has("state");
}
export function shopifyLaunchQuery(raw: unknown): string {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2000 || !shopifyAppLaunch(new URLSearchParams(raw))) throw new Error("Invalid app launch.");
  return raw; // Authenticity and freshness are verified by Go, never by this check.
}

export function shopifyRequestID(value: unknown): string | undefined {
  return typeof value === "string" && /^req_[a-f0-9]{32}$/.test(value) ? value : undefined;
}
