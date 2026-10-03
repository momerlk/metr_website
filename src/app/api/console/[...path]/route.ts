import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { consoleEndpoint, consoleOriginAllowed, limitedText, shopifyCallbackResult, shopifyAppLaunch, shopifyLaunchQuery, shopifyRequestID } from "@/lib/console";
export const runtime = "nodejs";
const cookieName = process.env.NODE_ENV === "production" ? "__Host-metr_console" : "metr_console";
const launchCookieName = process.env.NODE_ENV === "production" ? "__Host-metr_shopify_launch" : "metr_shopify_launch";
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
const noStore = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
const goToConsole = (site: string, result: string, requestID?: unknown) => {
  const url = new URL(`/console?connection=${result}`, site);
  const id = shopifyRequestID(requestID);
  if (id) url.searchParams.set("request_id", id);
  return NextResponse.redirect(url, { headers: noStore });
};
const failure = (error: string, status: number, code?: unknown, requestID?: unknown) => NextResponse.json({
  error, ...(typeof code === "string" ? { code: shopifyCallbackResult(false, status, code) } : {}),
  ...(shopifyRequestID(requestID) ? { request_id: shopifyRequestID(requestID) } : {}),
}, { status, headers: noStore });
const clearLaunch = (response: NextResponse) => {
  response.cookies.set(launchCookieName, "", { ...cookieOptions, maxAge: 0 });
  return response;
};
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: Request, context: Context) {
  const { path } = await context.params;
  const endpoint = consoleEndpoint(request.method, path);
  if (!endpoint) return failure("Console endpoint not found.", 404);
  const callback = endpoint.endsWith("/shopify/callback");
  const params = new URL(request.url).searchParams;
  const launchRedirect = callback && shopifyAppLaunch(params);
  const launch = endpoint.endsWith("/shopify/launch") || launchRedirect;
  const auth = path.length === 1 && ["signup", "login"].includes(path[0]);
  let site: string;
  try {
    if (process.env.NODE_ENV === "production" && !process.env.SITE_URL) return failure("The console site address is not configured.", 503);
    const configured = new URL(process.env.SITE_URL || request.url);
    if (configured.username || configured.password || (configured.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && configured.protocol === "http:" && ["localhost", "127.0.0.1"].includes(configured.hostname)))) return failure("The console requires a valid HTTPS site address.", 503);
    site = configured.origin;
  } catch { return failure("The console site address is not configured.", 503); }
  if (request.method !== "GET" && (!consoleOriginAllowed(request.headers.get("origin"), site) || request.headers.get("x-metr-console") !== "1")) return failure("Invalid request origin. Reload the console and try again.", 403);
  const base = process.env.METR_API_URL?.replace(/\/+$/, ""); const proxyKey = process.env.CONSOLE_PROXY_KEY;
  if (!base || !proxyKey || proxyKey.length < 32) return failure("The seller console is not configured yet. Please try again later.", 503);
  try {
    const url = new URL(base);
    if (url.username || url.password || url.search || url.hash || (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))) return failure("Console configuration needs attention.", 503);
  } catch { return failure("Console configuration needs attention.", 503); }
  const jar = await cookies(); const token = jar.get(cookieName)?.value;
  if (!auth && !launch && (!token || !/^console_[a-f0-9]{32}_[a-f0-9]{32}$/.test(token))) {
    if (callback) return goToConsole(site, "sign_in");
    return failure("Sign in to continue.", 401);
  }
  let body: string | undefined;
  if (request.method === "POST" && path[0] !== "logout") {
    if (request.headers.get("content-type")?.split(";")[0] !== "application/json") return failure("Expected JSON.", 415);
    try { body = await limitedText(request.body, 12000); JSON.parse(body); } catch { return failure("Invalid or oversized request.", 400); }
  }
  try {
    if (launch) {
      let raw: string;
      try {
        if (launchRedirect) raw = shopifyLaunchQuery(new URL(request.url).search.slice(1));
        else if (request.method === "POST") raw = shopifyLaunchQuery(JSON.parse(body || "{}").query);
        else {
          const saved = jar.get(launchCookieName)?.value;
          if (!saved) return NextResponse.json({ shop: null }, { headers: noStore });
          raw = shopifyLaunchQuery(Buffer.from(saved, "base64url").toString("utf8"));
        }
      } catch { return clearLaunch(launchRedirect ? goToConsole(site, "invalid_launch") : failure("Invalid Shopify app launch. Open the app again from Shopify.", 400, "invalid_launch")); }
      const upstream = await fetch(`${base}/v1/console/shopify/launch`, {
        method: "POST", headers: { "Content-Type": "application/json", "X-Metr-Console-Key": proxyKey }, body: JSON.stringify({ query: raw }),
        cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
      });
      const payload = JSON.parse(await limitedText(upstream.body, 12000));
      if (!upstream.ok || typeof payload.shop !== "string" || !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(payload.shop)) {
        const response = launchRedirect ? goToConsole(site, shopifyCallbackResult(false, upstream.status, payload.error?.code), payload.error?.request_id) : failure("Shopify app launch expired or could not be verified. Open the app again from Shopify.", upstream.ok ? 502 : upstream.status, payload.error?.code, payload.error?.request_id);
        response.cookies.set(launchCookieName, "", { ...cookieOptions, maxAge: 0 });
        return response;
      }
      const response = launchRedirect ? goToConsole(site, "launch_verified") : NextResponse.json({ shop: payload.shop }, { headers: noStore });
      // Retain only the signed launch, not OAuth codes or session credentials.
      if (request.method === "POST" || launchRedirect) response.cookies.set(launchCookieName, Buffer.from(raw).toString("base64url"), { ...cookieOptions, maxAge: 600 });
      return response;
    }
    const start = request.method === "POST" && path.length === 4 && path[0] === "stores" && path[2] === "shopify" && path[3] === "start";
    if (start) {
      const input = JSON.parse(body || "{}");
      // Browser-supplied domain/proof overrides are never forwarded.
      if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length) return failure("Invalid Shopify authorization request.", 400);
      const saved = jar.get(launchCookieName)?.value;
      try {
        body = JSON.stringify(saved ? { launch_query: shopifyLaunchQuery(Buffer.from(saved, "base64url").toString("utf8")) } : {});
      } catch {
        return clearLaunch(failure("The retained Shopify launch is invalid. Open the app again from Shopify.", 400, "invalid_launch"));
      }
    }
    let query = callback ? new URL(request.url).search : "";
    if (request.method === "GET" && path.length === 1 && ["stores", "api-keys"].includes(path[0])) {
      const params = new URL(request.url).searchParams;
      const limit = params.get("limit") || "50"; const cursor = params.get("cursor");
      if (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 100 || (cursor && !/^[A-Za-z0-9_-]{1,64}$/.test(cursor))) return failure("Invalid pagination.", 400);
      query = "?" + new URLSearchParams({ limit, ...(cursor ? { cursor } : {}) }).toString();
    }
    if (query.length > 8192) return failure("Invalid Shopify callback.", 400);
    const upstream = await fetch(`${base}${endpoint}${query}`, {
      method: request.method, headers: { "Content-Type": "application/json", "X-Metr-Console-Key": proxyKey, ...(!auth && token ? { Authorization: `Bearer ${token}` } : {}) }, body,
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
    });
    const payload = JSON.parse(await limitedText(upstream.body, 256 * 1024));
    if (callback) return clearLaunch(goToConsole(site, shopifyCallbackResult(upstream.ok, upstream.status, payload.error?.code), payload.error?.request_id));
    if (!upstream.ok) {
      const response = failure(payload.error?.message || "Could not complete this request.", upstream.status, payload.error?.code, payload.error?.request_id);
      if (start && payload.error?.code === "invalid_launch") response.cookies.set(launchCookieName, "", { ...cookieOptions, maxAge: 0 });
      if (upstream.status === 401 && !auth) response.cookies.set(cookieName, "", { ...cookieOptions, maxAge: 0 });
      const retry = upstream.headers.get("retry-after"); if (retry && /^\d+$/.test(retry)) response.headers.set("Retry-After", retry);
      return response;
    }
    if (auth) {
      const session = payload.session_token; const expires = new Date(payload.expires_at);
      if (typeof session !== "string" || !/^console_[a-f0-9]{32}_[a-f0-9]{32}$/.test(session) || !Number.isFinite(expires.getTime()) || expires.getTime() <= Date.now()) return failure("Could not start your session.", 502);
      const response = NextResponse.json({ account: payload.account }, { status: upstream.status, headers: noStore });
      response.cookies.set(cookieName, session, { ...cookieOptions, expires });
      return response;
    }
    const response = NextResponse.json(payload, { status: upstream.status, headers: noStore });
    if (start || path[0] === "logout") response.cookies.set(launchCookieName, "", { ...cookieOptions, maxAge: 0 });
    if (path[0] === "logout") response.cookies.set(cookieName, "", { ...cookieOptions, maxAge: 0 });
    return response;
  } catch {
    if (callback) return goToConsole(site, "failed");
    return failure("The console service is unavailable. Please try again shortly.", 502);
  }
}
export const GET = handle;
export const POST = handle;
export const DELETE = handle;
