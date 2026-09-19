import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { validateLead } from "@/lib/lead";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const requestOrigin = `${new URL(request.url).protocol}//${request.headers.get("host")}`;
  if (
    origin &&
    origin !== requestOrigin &&
    origin !== process.env.SITE_URL
  )
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  if (!request.headers.get("content-type")?.includes("application/json"))
    return Response.json({ error: "Expected JSON." }, { status: 415 });
  let raw = "";
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error();
    const decoder = new TextDecoder();
    let length = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 12000) {
        await reader.cancel();
        return Response.json(
          { error: "Request is too large." },
          { status: 413 },
        );
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
  } catch {
    return Response.json({ error: "Unable to read request." }, { status: 400 });
  }
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (input?.company_url)
    return Response.json(
      { error: "Unable to accept this request." },
      { status: 400 },
    );
  let lead;
  try {
    lead = validateLead(input);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid details." },
      { status: 400 },
    );
  }
  let db: DatabaseSync | undefined;
  try {
    const path = resolve(
      /* turbopackIgnore: true */ process.env.LEADS_DB_PATH ||
        "data/leads.sqlite",
    );
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    db = new DatabaseSync(path);
    db.exec(
      "PRAGMA busy_timeout = 5000; CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, email TEXT NOT NULL, payload TEXT NOT NULL, created_at INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL)",
    );
    const now = Date.now();
    // ponytail: local SQLite suits a single persistent server; use a shared database when scaling to multiple instances.
    // Only trust a forwarded IP when the deployment proxy strips incoming copies of this header.
    const source =
      process.env.TRUST_PROXY === "true"
        ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "unknown"
        : "local";
    const key = createHash("sha256").update(source).digest("hex");
    db.exec("BEGIN IMMEDIATE");
    db.prepare("DELETE FROM limits WHERE reset_at < ?").run(now);
    const limit = db
      .prepare("SELECT count FROM limits WHERE key = ?")
      .get(key) as { count: number } | undefined;
    const duplicate = db
      .prepare("SELECT id FROM leads WHERE email = ? AND created_at > ?")
      .get(lead.email, now - 60000);
    if ((limit?.count || 0) >= 5 || duplicate) {
      db.exec("ROLLBACK");
      return Response.json(
        { error: "Please wait a little before submitting another request." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }
    db.prepare(
      "INSERT INTO limits VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1",
    ).run(key, now + 60000);
    db.prepare("INSERT INTO leads VALUES (?, ?, ?, ?)").run(
      randomUUID(),
      lead.email,
      JSON.stringify(lead),
      now,
    );
    db.exec("COMMIT");
    return Response.json({ ok: true }, { status: 201 });
  } catch {
    console.error(
      "Access request persistence failed. Check database configuration.",
    );
    return Response.json(
      { error: "We couldn’t save your request. Please try again shortly." },
      { status: 503 },
    );
  } finally {
    db?.close();
  }
}
