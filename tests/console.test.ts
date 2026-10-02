import test from "node:test";
import assert from "node:assert/strict";
import { consoleEndpoint, consoleOriginAllowed, limitedText } from "../src/lib/console.ts";
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
