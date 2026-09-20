"use client";
import { useEffect, useId, useState } from "react";
import { Garment } from "@/components/demos";
import type { FitProduct, Question, Questionnaire, Recommendation } from "@/lib/fit";
function readable(value: string) {
  const text = value.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
async function callFit(body: Record<string, unknown>) {
  const response = await fetch("/api/fit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || "The sizing service is unavailable.");
  return payload;
}
function Field({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const help = question.help ? `${id}-help` : undefined;
  return (
    <label htmlFor={id}>
      {question.label}
      {!question.required && <span className="fit-optional"> Optional</span>}
      {question.type === "number" ? (
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          min={question.min ?? undefined}
          max={question.max ?? undefined}
          step="0.5"
          aria-describedby={help}
          placeholder={question.unit ?? ""}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <select
          id={id}
          value={value}
          required={question.required}
          aria-describedby={help}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Select</option>
          {question.options?.map((option) => (
            <option key={option} value={option}>
              {readable(option)}
            </option>
          ))}
        </select>
      )}
      {question.help && (
        <span className="fit-help" id={help}>
          {question.help}
        </span>
      )}
    </label>
  );
}
export function FitLiveDemo() {
  const [products, setProducts] = useState<FitProduct[] | null>(null);
  const [product, setProduct] = useState("");
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [session, setSession] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const productId = useId();
  useEffect(() => {
    let active = true;
    callFit({ action: "products" })
      .then((payload) => {
        if (!active) return;
        setProducts(payload.products);
        setProduct(payload.products[0]?.id ?? "");
      })
      .catch((cause: Error) => active && setError(cause.message))
      .finally(() => active && setBusy(false));
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!product) return;
    let active = true;
    setBusy(true);
    setError("");
    setRecommendation(null);
    setAnswers({});
    setQuestionnaire(null);
    callFit({ action: "start", product_id: product })
      .then((payload) => {
        if (!active) return;
        setSession(payload.session_id);
        setQuestionnaire(payload.questionnaire);
      })
      .catch((cause: Error) => active && setError(cause.message))
      .finally(() => active && setBusy(false));
    return () => {
      active = false;
    };
  }, [product]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const measurements: Record<string, string> = {};
    const body: Record<string, unknown> = { measurements };
    for (const [id, value] of Object.entries(answers)) {
      if (!value) continue;
      if (id.startsWith("measurements.")) measurements[id.slice(13)] = value;
      else body[id] = value;
    }
    try {
      setRecommendation(await callFit({ action: "recommend", session_id: session, answers: body }));
      // A session accepts one recommendation, so start a fresh one for the next answer set.
      const next = await callFit({ action: "start", product_id: product });
      setSession(next.session_id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }
  const field = (question: Question) => (
    <Field
      key={question.id}
      question={question}
      value={answers[question.id] ?? ""}
      onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))}
    />
  );
  const selected = products?.find((item) => item.id === product);
  return (
    <div className="demo fit-demo">
      <div className="demo-top">
        <span>Fit / Sizing</span>
        <span>Live API</span>
      </div>
      {products && products.length > 1 && (
        <div className="fit-controls fit-product">
          <label htmlFor={productId}>
            Product
            <select
              id={productId}
              value={product}
              onChange={(event) => setProduct(event.target.value)}
            >
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <div className="fit-body">
        <div className="fit-garment">
          <Garment
            color="#b6b09e"
            type={
              selected?.product_type?.includes("trouser") || selected?.product_type?.includes("jean")
                ? "trousers"
                : selected?.product_type?.includes("shirt")
                  ? "shirt"
                  : "tee"
            }
          />
        </div>
        <div className="fit-side">
          <span className="reading-label">
            {questionnaire ? `Verified size chart · revision ${questionnaire.chart_revision}` : "Loading"}
          </span>
          <h3>{selected?.title ?? "Sizing quiz"}</h3>
          <p>
            {questionnaire
              ? `${readable(questionnaire.category)} · sizes in stock: ${questionnaire.available_sizes.join(", ")}`
              : "Requesting the questionnaire from the Metr Fit API."}
          </p>
          <form className="fit-controls" onSubmit={submit}>
            {questionnaire?.questions.filter((question) => question.required).map(field)}
            {questionnaire?.questions.some((question) => !question.required) && (
              <details className="fit-optional-group">
                <summary>Add optional details for a closer match</summary>
                <div className="fit-controls">
                  {questionnaire.questions.filter((question) => !question.required).map(field)}
                </div>
              </details>
            )}
            {questionnaire && (
              <button className="button" type="submit" disabled={busy}>
                {busy ? "Working…" : "Get my size"}
              </button>
            )}
          </form>
        </div>
      </div>
      <div className="fit-result" aria-live="polite">
        {error ? (
          <p className="fit-error">{error}</p>
        ) : recommendation ? (
          <>
            <div>
              <span className="reading-label">Recommended</span>
              <strong key={recommendation.recommended_size}>{recommendation.recommended_size}</strong>
            </div>
            <dl className="reading">
              {Object.entries(recommendation.fit).map(([area, value]) => (
                <div key={area}>
                  <dt>{readable(area)}</dt>
                  <dd>{readable(value)}</dd>
                </div>
              ))}
              <div>
                <dt>Confidence</dt>
                <dd>{Math.round(recommendation.confidence * 100)}% evidence score</dd>
              </div>
            </dl>
          </>
        ) : (
          <p>Answer the questions to request a recommendation.</p>
        )}
      </div>
      {recommendation && (
        <div className="fit-explanation">
          <p>{recommendation.explanation}</p>
          <p className="demo-note">Confidence: {readable(recommendation.confidence_meaning)}.</p>
          {recommendation.warnings.map((warning) => (
            <p key={warning} className="fit-warning">
              {warning}
            </p>
          ))}
        </div>
      )}
      <p className="demo-note">
        This runs against the Metr Fit API: the questionnaire, available sizes and
        recommendation come from the store’s verified size chart and live variant
        stock. The catalog is a fictional sample store. Confidence is an
        uncalibrated evidence score, not a probability of correct fit.
      </p>
    </div>
  );
}
