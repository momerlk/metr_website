import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { consoleEndpoint, consoleOriginAllowed, limitedText } from "@/lib/console";
export const runtime = "nodejs";
const cookieName = process.env.NODE_ENV === "production" ? "__Host-metr_console" : "metr_console";
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
const noStore = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
const goToConsole = (site: string, result: string) => NextResponse.redirect(new URL(`/console?connection=${result}`, site), { headers: noStore });
const failure = (error: string, status: number) => NextResponse.json({ error }, { status, headers: noStore });
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: Request, context: Context) {
  const { path } = await context.params;
  const endpoint = consoleEndpoint(request.method, path);
  if (!endpoint) return failure("Console endpoint not found.", 404);
  const callback = endpoint.endsWith("/shopify/callback");
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
  if (!auth && (!token || !/^console_[a-f0-9]{32}_[a-f0-9]{32}$/.test(token))) {
    if (callback) return goToConsole(site, "sign_in");
    return failure("Sign in to continue.", 401);
  }
  let body: string | undefined;
  if (request.method === "POST" && path[0] !== "logout") {
    if (request.headers.get("content-type")?.split(";")[0] !== "application/json") return failure("Expected JSON.", 415);
    try { body = await limitedText(request.body, 12000); JSON.parse(body); } catch { return failure("Invalid or oversized request.", 400); }
  }
  try {
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
    if (callback) return goToConsole(site, upstream.ok ? "authorized" : "failed");
    if (!upstream.ok) {
      const response = failure(payload.error?.message || "Could not complete this request.", upstream.status);
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
