import { shopifyRequestID } from "./console";

export async function consoleCall<T>(path: string, method = "GET", data?: unknown): Promise<T> {
  const response = await fetch(`/api/console/${path}`, { method, headers: { "Content-Type": "application/json", "X-Metr-Console": "1" }, ...(data !== undefined ? { body: JSON.stringify(data) } : {}), cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || "Please try again."), { status: response.status, code: result.code, requestID: shopifyRequestID(result.request_id) });
  return result;
}
