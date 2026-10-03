import test from "node:test";
import assert from "node:assert/strict";
import { consoleEndpoint, consoleOriginAllowed, limitedText, shopifyCallbackResult, shopifyAppLaunch, shopifyLaunchQuery, shopifyRequestID } from "../src/lib/console.ts";
test("console proxy only exposes explicit seller routes", () => {
  assert.equal(consoleEndpoint("POST", ["signup"]), "/v1/console/signup");
  assert.equal(consoleEndpoint("POST", ["stores", "sto_1", "shopify", "start"]), "/v1/console/stores/sto_1/shopify/start");
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
