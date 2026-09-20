import { fitConfig, validateAnswers, validateId } from "@/lib/fit";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// ponytail: per-instance counters suit one persistent server; use a shared store when running several.
const calls = new Map<string, { count: number; reset: number }>();
function limited(request: Request) {
  const source =
    process.env.TRUST_PROXY === "true"
      ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
      : "local";
  const now = Date.now();
  const entry = calls.get(source);
  if (!entry || entry.reset < now) {
    calls.set(source, { count: 1, reset: now + 60000 });
    if (calls.size > 5000) for (const [key, value] of calls) if (value.reset < now) calls.delete(key);
    return false;
  }
  entry.count += 1;
  return entry.count > 60;
}
async function readJson(request: Request, limit: number) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("empty");
  const decoder = new TextDecoder();
  let raw = "";
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) {
      await reader.cancel();
      throw new Error("large");
    }
    raw += decoder.decode(value, { stream: true });
  }
  return JSON.parse(raw + decoder.decode());
}
export async function POST(request: Request) {
  const config = fitConfig();
  if (!config)
    return Response.json({ error: "The live demo is not configured." }, { status: 503 });
  const origin = request.headers.get("origin");
  const requestOrigin = `${new URL(request.url).protocol}//${request.headers.get("host")}`;
  if (origin && origin !== requestOrigin && origin !== process.env.SITE_URL)
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  if (!request.headers.get("content-type")?.includes("application/json"))
    return Response.json({ error: "Expected JSON." }, { status: 415 });
  if (limited(request))
    return Response.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  let input;
  try {
    input = await readJson(request, 4000);
  } catch (error) {
    return error instanceof Error && error.message === "large"
      ? Response.json({ error: "Request is too large." }, { status: 413 })
      : Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const base = `${config.url}/v1/stores/${config.store}`;
  const call = async (path: string, body?: unknown) => {
    const response = await fetch(base + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Authorization: `Bearer ${config.key}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload?.error?.message;
      // Upstream messages are product copy, never credentials or internal detail.
      throw Object.assign(new Error(typeof message === "string" ? message : "The sizing service is unavailable."), {
        status: response.status >= 500 ? 502 : response.status,
      });
    }
    return payload;
  };
  try {
    switch (input?.action) {
      case "products": {
        const payload = await call("/products?limit=12");
        const products = (payload?.data ?? [])
          .filter((product: { title?: string }) => product?.title)
          .map(({ id, title, product_type }: Record<string, string>) => ({ id, title, product_type }));
        return Response.json({ products });
      }
      case "start": {
        const session = await call("/fit-sessions", {
          product_id: validateId(input.product_id),
          customer_reference: "metr-website-demo",
        });
        return Response.json({ session_id: session.id, questionnaire: session.questionnaire });
      }
      case "recommend": {
        const recommendation = await call(
          `/fit-sessions/${validateId(input.session_id)}/recommendations`,
          { answers: validateAnswers(input.answers) },
        );
        const {
          recommended_size,
          confidence,
          confidence_meaning,
          fit,
          explanation,
          warnings,
          algorithm_version,
          chart_revision,
        } = recommendation;
        return Response.json({
          recommended_size,
          confidence,
          confidence_meaning,
          fit,
          explanation,
          warnings,
          algorithm_version,
          chart_revision,
        });
      }
      default:
        return Response.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status)
      return Response.json({ error: (error as Error).message }, { status });
    if (error instanceof Error && !(error instanceof TypeError) && error.name !== "TimeoutError")
      return Response.json({ error: error.message }, { status: 400 });
    console.error("Metr Fit request failed. Check METR_API_URL and key configuration.");
    return Response.json(
      { error: "The sizing service is unavailable right now." },
      { status: 502 },
    );
  }
}
