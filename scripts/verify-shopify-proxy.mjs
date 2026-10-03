// Run after npm run build. Exercises the real Next.js gateway with a fixture API,
// not Shopify token exchange or Atlas persistence. Uses only local sample data.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const gateway = randomBytes(32).toString("hex");
const session = `console_${randomBytes(16).toString("hex")}_${randomBytes(16).toString("hex")}`;
const launchQuery = "shop=canonical.myshopify.com&timestamp=123&hmac=fixture-signature";
const requestID = "req_" + "f".repeat(32);
let starts = 0, launches = 0, expired = false, syncFails = false;
const chartInput = { name: "Sample chart", category: "tops", unit: "cm", basis: "body", verified: false, measurements: [{ name: "chest", method: "circumference" }], rows: [{ size: "S", measurements: { chest: { min: 88, max: 92 } } }] };
const fixture = createServer(async (request, response) => {
  let raw = "";
  for await (const chunk of request) raw += chunk;
  const input = raw ? JSON.parse(raw) : {};
  const url = new URL(request.url, "http://fixture.test");
  assert.ok(request.headers["x-metr-console-key"] === gateway, "Gateway forwarding mismatch");
  const send = (status, payload) => { response.writeHead(status, { "Content-Type": "application/json" }); response.end(JSON.stringify(payload)); };
  if (url.pathname === "/v1/console/shopify/launch") {
    launches++;
    assert.equal(request.method, "POST");
    assert.equal(request.headers.authorization, undefined);
    return input.query === launchQuery && !expired ? send(200, { shop: "canonical.myshopify.com" }) : send(400, { error: { code: "invalid_launch", request_id: requestID } });
  }
  if (url.pathname === "/v1/console/login") return send(200, { account: { id: "acc_fixture" }, session_token: session, expires_at: new Date(Date.now() + 3600000).toISOString() });
  assert.ok(request.headers.authorization === `Bearer ${session}`, "Seller session forwarding mismatch");
  if (url.pathname === "/v1/console/stores/sto_fixture/products") {
    assert.equal(request.method, "GET"); assert.equal(url.searchParams.get("limit"), "20"); assert.equal(url.searchParams.get("cursor"), "prd_previous"); assert.equal(url.searchParams.get("merchant_id"), null);
    return send(200, { data: [{ id: "prd_fixture", title: "Sample shirt", product_type: "shirt" }], next_cursor: "prd_fixture" });
  }
  if (url.pathname === "/v1/console/stores/sto_fixture/products/prd_fixture/variants") {
    assert.equal(request.method, "GET"); assert.equal(url.searchParams.get("limit"), "20");
    return send(200, { data: [{ id: "var_fixture", size: "S", available: false, external_id: "sample-variant" }] });
  }
  if (url.pathname === "/v1/console/stores/sto_fixture/size-charts" && request.method === "POST" || url.pathname === "/v1/console/stores/sto_fixture/size-charts/cht_fixture" && request.method === "PUT") {
    assert.deepEqual(input, chartInput);
    return send(request.method === "POST" ? 201 : 200, { id: "cht_fixture", store_id: "sto_fixture", revision: request.method === "POST" ? 1 : 2, ...chartInput });
  }
  if (url.pathname === "/v1/console/stores/sto_fixture/size-charts/cht_fixture/products") {
    assert.equal(request.method, "POST");
    if (input.product_ids.includes("prd_missing")) return send(422, { error: { code: "invalid_reference", message: "A referenced resource does not exist in this store.", request_id: requestID } });
    assert.deepEqual(input, { product_ids: ["prd_one", "prd_two"] });
    return send(200, { chart_id: "cht_fixture", products_updated: 2 });
  }
  if (url.pathname === "/v1/console/stores/sto_fixture/shopify/start") {
    starts++;
    assert.equal(input.launch_query, launchQuery);
    if (expired) return send(400, { error: { code: "invalid_launch", request_id: requestID } });
    return send(200, { authorization_url: "https://canonical.myshopify.com/admin/oauth/authorize?state=fixture-state" });
  }
  if (url.pathname === "/v1/console/stores/sto_fixture/shopify/sync") {
    assert.equal(request.method, "POST");
    return syncFails ? send(502, { error: { code: "sync_failed", message: "Failed to sync Shopify catalog. Check the connection and retry.", request_id: requestID } }) : send(200, { shop: "canonical.myshopify.com", products_imported: 0, products_updated: 0, variants_imported: 0, variants_updated: 0, total_products: 0, total_variants: 0 });
  }
  if (url.pathname === "/v1/console/shopify/callback") {
    if (!url.searchParams.get("code") || !url.searchParams.get("state")) return send(400, { error: { code: "invalid_callback", request_id: requestID } });
    assert.equal(url.searchParams.get("state"), "fixture-state");
    return url.searchParams.get("shop") === "canonical.myshopify.com" ? send(200, { status: "authorized" }) : send(400, { error: { code: "shop_mismatch", request_id: requestID } });
  }
  if (url.pathname === "/v1/console/logout") return send(200, { status: "logged_out" });
  return send(404, { error: { code: "not_found" } });
});
await new Promise(resolve => fixture.listen(0, "127.0.0.1", resolve));
const portProbe = createServer();
await new Promise(resolve => portProbe.listen(0, "127.0.0.1", resolve));
const port = portProbe.address().port;
await new Promise(resolve => portProbe.close(resolve));
const root = new URL("../", import.meta.url);
const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: root, stdio: "ignore", env: { ...process.env, NODE_ENV: "production", SITE_URL: "https://metr.test", METR_API_URL: `http://127.0.0.1:${fixture.address().port}`, CONSOLE_PROXY_KEY: gateway },
});
const base = `http://127.0.0.1:${port}/api/console/`;
const request = (path, method = "GET", body, cookie = "") => fetch(base + path, {
  method, redirect: "manual", headers: { Origin: "https://metr.test", "X-Metr-Console": "1", "Content-Type": "application/json", Cookie: cookie }, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
const cookieValue = (response, name) => response.headers.getSetCookie().find(value => value.startsWith(name + "="))?.split(";")[0];
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { if ((await request("shopify/launch")).status === 200) { ready = true; break; } } catch {}
    if (next.exitCode !== null) throw new Error("Next.js test server exited. Build the website first.");
    await delay(100);
  }
  assert.ok(ready, "Next.js server did not start");
  let response = await request("shopify/launch", "POST", { query: "shop=unsigned.myshopify.com" });
  assert.equal(response.status, 400);
  assert.ok(!cookieValue(response, "__Host-metr_shopify_launch")?.split("=")[1]);
  response = await request("shopify/launch", "POST", { query: launchQuery });
  assert.deepEqual(await response.json(), { shop: "canonical.myshopify.com" });
  const launchCookie = cookieValue(response, "__Host-metr_shopify_launch");
  assert.ok(launchCookie);
  response = await request("shopify/launch", "GET", undefined, launchCookie);
  assert.deepEqual(await response.json(), { shop: "canonical.myshopify.com" });
  assert.equal(response.headers.getSetCookie().length, 0, "Reading a launch must not extend its expiry");
  response = await request("shopify/launch", "POST", { query: launchQuery });
  for (const flag of ["HttpOnly", "Secure", "SameSite=lax", "Max-Age=600"]) assert.ok(response.headers.get("set-cookie").includes(flag));
  response = await request("stores/sto_fixture/shopify/start", "POST", {}, launchCookie);
  assert.equal(response.status, 401); assert.equal(starts, 0);
  response = await request("login", "POST", { email: "fixture@example.com", password: "fixture-password" }, launchCookie);
  assert.ok(!cookieValue(response, "__Host-metr_shopify_launch"), "Sign-in must preserve the launch cookie");
  const sessionCookie = cookieValue(response, "__Host-metr_console");
  assert.ok(sessionCookie); assert.ok(!(await response.text()).includes(session));
  response = await request("stores/sto_fixture/shopify/sync", "POST", {}, sessionCookie);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { shop: "canonical.myshopify.com", products_imported: 0, products_updated: 0, variants_imported: 0, variants_updated: 0, total_products: 0, total_variants: 0 });
  syncFails = true;
  response = await request("stores/sto_fixture/shopify/sync", "POST", {}, sessionCookie);
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "Failed to sync Shopify catalog. Check the connection and retry.", code: "sync_failed", request_id: requestID });
  response = await request("stores/sto_fixture/products?limit=20&cursor=prd_previous&merchant_id=other", "GET", undefined, sessionCookie);
  assert.equal(response.status, 200); assert.equal((await response.json()).next_cursor, "prd_fixture");
  response = await request("stores/sto_fixture/products/prd_fixture/variants?limit=20", "GET", undefined, sessionCookie);
  assert.equal(response.status, 200); assert.equal((await response.json()).data[0].available, false);
  response = await request("stores/sto_fixture/products", "GET"); assert.equal(response.status, 401);
  response = await request("stores/sto_fixture/products?limit=101", "GET", undefined, sessionCookie); assert.equal(response.status, 400);
  response = await request("stores/sto_fixture/size-charts", "POST", chartInput, sessionCookie);
  assert.equal(response.status, 201); assert.equal((await response.json()).verified, false);
  response = await request("stores/sto_fixture/size-charts/cht_fixture", "PUT", chartInput, sessionCookie);
  assert.equal(response.status, 200); assert.equal((await response.json()).revision, 2);
  const chartHeaders = { Origin: "https://metr.test", "Content-Type": "application/json", "X-Metr-Console": "1", Cookie: sessionCookie };
  response = await fetch(base + "stores/sto_fixture/size-charts", { method: "POST", headers: chartHeaders, body: " ".repeat(13000) + JSON.stringify(chartInput) });
  assert.equal(response.status, 201, "Chart uploads allow the API's bounded JSON body size");
  response = await fetch(base + "stores/sto_fixture/size-charts", { method: "POST", headers: chartHeaders, body: " ".repeat(256 * 1024) + JSON.stringify(chartInput) });
  assert.equal(response.status, 400, "Oversized chart uploads are rejected by the gateway");
  response = await fetch(base + "stores/sto_fixture/size-charts/cht_fixture", { method: "PUT", headers: { ...chartHeaders, Origin: "https://evil.test" }, body: JSON.stringify(chartInput) });
  assert.equal(response.status, 403, "Chart updates require the same origin");
  response = await request("stores/sto_fixture/size-charts/cht_fixture/products", "POST", { product_ids: ["prd_one", "prd_two"] }, sessionCookie);
  assert.deepEqual(await response.json(), { chart_id: "cht_fixture", products_updated: 2 });
  response = await request("stores/sto_fixture/size-charts/cht_fixture/products", "POST", { product_ids: ["prd_missing"] }, sessionCookie);
  assert.equal(response.status, 422); assert.deepEqual(await response.json(), { error: "A referenced resource does not exist in this store.", code: "invalid_reference", request_id: requestID });
  const both = `${launchCookie}; ${sessionCookie}`;
  response = await request("stores/sto_fixture/shopify/start", "POST", { launch_query: "browser-override" }, both);
  assert.equal(response.status, 400); assert.equal(starts, 0);
  response = await fetch(base + "stores/sto_fixture/shopify/start", { method: "POST", headers: { Origin: "https://evil.test", "Content-Type": "application/json", "X-Metr-Console": "1", Cookie: both }, body: "{}" });
  assert.equal(response.status, 403); assert.equal(starts, 0);
  response = await request("stores/sto_fixture/shopify/start", "POST", {}, both);
  assert.equal(response.status, 200); assert.equal(starts, 1);
  assert.ok(response.headers.get("set-cookie").includes("Max-Age=0"));
  response = await request(`shopify/callback?${launchQuery}`);
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "https://metr.test/console?connection=launch_verified");
  assert.ok(cookieValue(response, "__Host-metr_shopify_launch"));
  for (const [shop, expected] of [["canonical.myshopify.com", "authorized"], ["wrong.myshopify.com", "shop_mismatch"]]) {
    response = await request(`shopify/callback?shop=${shop}&code=fixture-code&state=fixture-state`, "GET", undefined, sessionCookie);
    assert.equal(response.headers.get("location"), `https://metr.test/console?connection=${expected}${expected === "shop_mismatch" ? "&request_id=" + requestID : ""}`);
    assert.ok(response.headers.get("set-cookie").includes("Max-Age=0"));
  }
  response = await request("shopify/callback?shop=canonical.myshopify.com&code=", "GET", undefined, sessionCookie);
  assert.equal(response.headers.get("location"), `https://metr.test/console?connection=invalid_callback&request_id=${requestID}`);
  const malformed = "__Host-metr_shopify_launch=broken";
  response = await request("shopify/launch", "GET", undefined, malformed);
  assert.equal(response.status, 400); assert.ok(response.headers.get("set-cookie").includes("Max-Age=0"));
  response = await request("stores/sto_fixture/shopify/start", "POST", {}, `${malformed}; ${sessionCookie}`);
  assert.equal(response.status, 400); assert.ok(response.headers.get("set-cookie").includes("Max-Age=0"));
  assert.equal((await response.json()).code, "invalid_launch");
  expired = true;
  response = await request("stores/sto_fixture/shopify/start", "POST", {}, both);
  assert.equal(response.status, 400); assert.ok(response.headers.get("set-cookie").includes("Max-Age=0"));
  assert.equal((await response.json()).request_id, requestID);
  response = await request("shopify/launch", "GET", undefined, launchCookie);
  assert.equal(response.status, 400); assert.ok(response.headers.get("set-cookie").includes("Max-Age=0"));
  response = await request("logout", "POST", undefined, both);
  assert.equal(response.status, 200);
  assert.equal(response.headers.getSetCookie().length, 2);
  assert.ok(launches >= 4);
  console.log("PASS: real Next.js catalog pagination, chart uploads/updates/assignment, sync errors, OAuth, origin checks and cookie lifecycle with a fixture API.");
} finally {
  next.kill("SIGTERM");
  await new Promise(resolve => fixture.close(resolve));
}
