import test from "node:test";
import assert from "node:assert/strict";
import { shopifySyncAction, shopifySyncMessage, shopifySyncFailure, preserveShopifySync, consoleErrorCode, consoleEndpoint, consoleOriginAllowed, limitedText, shopifyCallbackResult, shopifyAppLaunch, shopifyLaunchQuery, shopifyRequestID } from "../src/lib/console.ts";
test("console proxy only exposes explicit seller routes", () => {
  assert.equal(consoleEndpoint("POST", ["signup"]), "/v1/console/signup");
  assert.equal(consoleEndpoint("POST", ["stores", "sto_1", "shopify", "start"]), "/v1/console/stores/sto_1/shopify/start");
  assert.equal(consoleEndpoint("POST", ["stores", "sto_1", "shopify", "sync"]), "/v1/console/stores/sto_1/shopify/sync");
  for (const path of [["merchants"], ["..", "api-keys"], ["stores", "../merchant", "shopify"], ["stores", "sto_1", "products"], ["api-keys", "key_1", "extra"]]) assert.equal(consoleEndpoint("POST", path), null);
  assert.equal(consoleEndpoint("GET", ["login"]), null);
  assert.equal(consoleEndpoint("DELETE", ["api-keys", "key_1"]), "/v1/console/api-keys/key_1");
});
test("console mutations require exact same origin", () => {
  assert.ok(consoleOriginAllowed("https://metr.so", "https://metr.so"));
  for (const origin of [null, "https://evil.test", "https://metr.so.evil.test"]) assert.equal(consoleOriginAllowed(origin, "https://metr.so"), false);
});
test("streaming body limit rejects oversized input", async () => {
  assert.equal(await limitedText(new Response("hello").body, 5), "hello");
  await assert.rejects(() => limitedText(new Response("123456").body, 5));
});

test("Shopify callback preserves safe failure categories without leaking upstream data", () => {
  assert.equal(shopifyCallbackResult(true, 200, undefined), "authorized");
  assert.equal(shopifyCallbackResult(false, 401, "invalid_state"), "sign_in");
  assert.equal(shopifyCallbackResult(false, 400, "invalid_state"), "invalid_state");
  assert.equal(shopifyCallbackResult(false, 400, "invalid_callback"), "invalid_callback");
  for (const code of ["private-token", "__proto__", "constructor", undefined, {}]) {
    assert.equal(shopifyCallbackResult(false, 502, code), "failed");
  }
});

test("app launches are never classified as completed OAuth callbacks", () => {
  assert.equal(shopifyAppLaunch(new URLSearchParams("shop=canonical.myshopify.com&hmac=test&timestamp=123")), true);
  for (const raw of ["", "shop=x&code=", "shop=x&state=", "shop=x&code=c&state=s"]) assert.equal(shopifyAppLaunch(new URLSearchParams(raw)), false);
  assert.equal(shopifyLaunchQuery("shop=canonical.myshopify.com&hmac=test"), "shop=canonical.myshopify.com&hmac=test");
  for (const raw of [undefined, {}, "", "shop=x&code=private", "shop=x&state=private", "shop=" + "x".repeat(2000)]) assert.throws(() => shopifyLaunchQuery(raw));
  assert.equal(consoleEndpoint("POST", ["shopify", "launch"]), "/v1/console/shopify/launch");
  assert.equal(consoleEndpoint("GET", ["shopify", "launch"]), "/v1/console/shopify/launch");
  assert.equal(consoleEndpoint("DELETE", ["shopify", "launch"]), null);
  assert.equal(shopifyCallbackResult(false, 400, "shop_mismatch"), "shop_mismatch");
  assert.equal(shopifyCallbackResult(false, 400, "invalid_launch"), "invalid_launch");
});

test("only backend request IDs can cross callback redirects", () => {
  assert.equal(shopifyRequestID("req_" + "a".repeat(32)), "req_" + "a".repeat(32));
  for (const value of [undefined, {}, "session_private", "req_private", "req_" + "a".repeat(32) + "&token=private"]) assert.equal(shopifyRequestID(value), undefined);
});


test("sync validates the complete response, including a successfully empty catalog", () => {
  const result = { shop: "sample.myshopify.com", products_imported: 0, products_updated: 2, variants_imported: 0, variants_updated: 4, total_products: 2, total_variants: 4 };
  assert.equal(shopifySyncMessage(result), "Catalog synced: 2 products and 4 variants.");
  assert.equal(shopifySyncMessage({ ...result, products_updated: 0, variants_updated: 0, total_products: 0, total_variants: 0 }), "Catalog synced: 0 products and 0 variants.");
  for (const key of Object.keys(result)) { const incomplete = { ...result }; delete incomplete[key as keyof typeof result]; assert.throws(() => shopifySyncMessage(incomplete), /Could not confirm/); }
  for (const count of [-1, NaN, 1.5, "0"]) assert.throws(() => shopifySyncMessage({ ...result, total_products: count }));
});
test("request errors use a fixed allowlist independent of OAuth classification", () => {
  assert.equal(consoleErrorCode("sync_failed"), "sync_failed");
  assert.equal(consoleErrorCode("reauthorization_required"), "reauthorization_required");
  assert.equal(consoleErrorCode("sync_unconfirmed"), "sync_unconfirmed");
  for (const code of ["private-token", "__proto__", "constructor", undefined, {}]) assert.equal(consoleErrorCode(code), "failed");
  assert.equal(shopifySyncFailure({ status: 502, code: "sync_failed" }), "Failed to sync Shopify catalog. Check the connection and retry.");
});
test("browser and proxy timeouts report ambiguity rather than rollback", () => {
  for (const error of [new TypeError("Failed to fetch"), new DOMException("Timed out", "TimeoutError"), { status: 502, code: "sync_unconfirmed" }, { status: 504 }]) assert.equal(shopifySyncFailure(error), "Could not confirm sync completion.");
});
test("failed refresh and reconnect status preserve the last successful timestamp", () => {
  const previous = { store_id: "sto_1", status: "authorized" as const, last_sync_at: "2026-10-03T10:00:00Z" };
  for (const status of ["unknown", "reauthorization_required", "authorized", "not_connected"] as const) {
    const refreshed = preserveShopifySync(previous, { store_id: "sto_1", status });
    assert.equal(refreshed.status, status);
    assert.equal(refreshed.last_sync_at, previous.last_sync_at);
  }
  assert.equal(preserveShopifySync(previous, { ...previous, last_sync_at: "2026-10-03T11:00:00Z" }).last_sync_at, "2026-10-03T11:00:00Z");
  assert.equal(shopifySyncAction("reauthorization_required"), "reconnect");
  for (const status of ["authorized", "unknown", "not_connected", undefined] as const) assert.equal(shopifySyncAction(status), "retry");
});
