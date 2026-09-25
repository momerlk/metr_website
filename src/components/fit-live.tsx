"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Garment } from "@/components/demos";
import { quizSteps, quizAnswerPayload } from "@/lib/fit";
import { fitAssets } from "@/lib/fit-assets";
import type { FitProduct, Question, Questionnaire, Recommendation } from "@/lib/fit";
function readable(value: string) {
  const text = value.replace(/_/g, " ");
  const labels: Record<string, string> = {
    balanced: "About the same in both areas", fuller_chest: "Closer around my chest",
    fuller_waist: "Closer around my waist", fuller_hips: "Closer around my hips",
    narrow: "Narrower", average: "About average", broad: "Broader",
  };
  if (labels[value]) return labels[value];
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
function SilhouetteField({ question, value, onChange }: { question: Question; value: string; onChange: (value: string) => void }) {
  const id = useId();
  const [track, setTrack] = useState(value.startsWith("male_") ? "male" : "female");
  const asset = question.options?.find(option => option.startsWith(`${track}_`))?.split(":")[0];
  if (!asset || !fitAssets[asset]) return null;
  return <fieldset className="fit-profile" aria-describedby={`${id}-help`}>
    <legend>{question.label} <span className="fit-optional">Optional</span></legend>
    <p className="fit-help" id={`${id}-help`}>Choose the illustration closest to your proportions. You can switch sets or skip this question.</p>
    <div className="fit-illustration-track" aria-label="Illustration set">
      {["female", "male"].map(option => <button key={option} type="button" aria-pressed={track === option} onClick={() => { if (track !== option) { setTrack(option); onChange(""); } }}>{option === "female" ? "Female illustrations" : "Male illustrations"}</button>)}
    </div>
    <div className="fit-asset-sheet" style={{ backgroundImage: `url(/fit/${asset}.png)` }}>
      {fitAssets[asset].map((description, index) => {
        const option = `${asset}:${index + 1}`;
        return <label className="fit-asset-choice" key={option}>
          <input type="radio" name={id} value={option} checked={value === option} required={question.required}
            onChange={() => onChange(option)} aria-label={`Option ${index + 1}: ${description}`} />
          <span className="sr-only">{index + 1}. {description}</span>
        </label>;
      })}
    </div>
    <button type="button" className="fit-skip-answer" onClick={() => onChange("")}>None feels close / clear answer</button>
  </fieldset>;
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
  if (question.id.startsWith("silhouette_")) return <SilhouetteField question={question} value={value} onChange={onChange} />;
  if (question.id === "height_cm") {
    const [feet = "", inches = ""] = value.split(":");
    return <fieldset className="fit-profile" aria-describedby={help}>
      <legend>How tall are you? <span className="fit-optional">Optional</span></legend>
      <div className="fit-height-inputs">
        <label htmlFor={`${id}-feet`}>Feet<input id={`${id}-feet`} type="number" inputMode="numeric" min="3" max="7" step="1" placeholder="5" value={feet} required={question.required || inches !== ""} onChange={e => onChange(`${e.target.value}:${inches}`)} /></label>
        <label htmlFor={`${id}-inches`}>Inches<input id={`${id}-inches`} type="number" inputMode="decimal" min="0" max="11.99" step="any" placeholder="8" value={inches} required={question.required || feet !== ""} onChange={e => onChange(`${feet}:${e.target.value}`)} /></label>
      </div>
      {question.help && <span className="fit-help" id={help}>{question.help}</span>}
    </fieldset>;
  }
  const isMeasurement = question.id.startsWith("measurements.");
  const unit = isMeasurement ? "inches" : question.unit;
  if (question.id.endsWith("_profile")) return (
    <fieldset className="fit-profile" aria-describedby={help}>
      <legend>{question.label} {!question.required && <span className="fit-optional">Optional</span>}</legend>
      {question.options?.map(option => (
        <label className="fit-profile-choice" key={option}>
          <input type="radio" name={id} value={option} checked={value === option}
            required={question.required} onChange={() => onChange(option)} />
          <span>{readable(option)}</span>
        </label>
      ))}
      {!question.required && <button type="button" className="fit-skip-answer" onClick={() => onChange("")}>Not sure / clear answer</button>}
      {question.help && <span className="fit-help" id={help}>{question.help}</span>}
    </fieldset>
  );
  return (
    <label htmlFor={id}>
      {question.label}{unit && ` (${unit})`}
      {!question.required && <span className="fit-optional"> Optional</span>}
      {question.type === "number" ? (
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          required={question.required}
          min={isMeasurement ? 0.4 : question.min ?? undefined}
          max={isMeasurement ? 118.1 : question.max ?? undefined}
          step="any"
          aria-describedby={help}
          placeholder={unit ?? ""}
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
  const [stepIndex, setStepIndex] = useState(0);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const steps = quizSteps(questionnaire?.questions ?? []);
  const step = steps[stepIndex];
  useEffect(() => {
    if (questionnaire) stepHeading.current?.focus({ preventScroll: true });
  }, [stepIndex, questionnaire]);
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
    setSession("");
    setStepIndex(0);
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
    let body: Record<string, unknown>;
    try { body = quizAnswerPayload(answers); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Check your answers."); return; }
    setError("");
    if (stepIndex < steps.length - 1) {
      setStepIndex(index => index + 1);
      return;
    }
    setBusy(true);
    setError("");
    try {
      setRecommendation(await callFit({ action: "recommend", session_id: session, answers: body }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }
  async function editAnswers() {
    setBusy(true);
    setError("");
    try {
      const next = await callFit({ action: "start", product_id: product });
      setSession(next.session_id);
      setQuestionnaire(next.questionnaire);
      setRecommendation(null);
      setStepIndex(0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not restart the quiz.");
    } finally { setBusy(false); }
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
          {products && products.length > 1 ? (
            <label className="fit-product" htmlFor={productId}>
              <select
                aria-label="Product"
                id={productId}
                disabled={busy}
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
          ) : (
            <h3>{selected?.title ?? "Sizing quiz"}</h3>
          )}
          <p>
            {questionnaire
              ? `${readable(questionnaire.category)} · sizes in stock: ${questionnaire.available_sizes.join(", ")}`
              : "Requesting the questionnaire from the Metr Fit API."}
          </p>
          {!recommendation && step && (
            <form className="fit-controls fit-quiz" onSubmit={submit}>
              <div className="fit-quiz-progress">
                <span aria-live="polite">Step {stepIndex + 1} of {steps.length}</span>
                <progress value={stepIndex + 1} max={steps.length} aria-label="Quiz progress" />
              </div>
              <h4 ref={stepHeading} tabIndex={-1}>{step.title}</h4>
              {step.id === "measurements" && <p className="fit-help">Optional. Body measurements give the recommendation stronger evidence than your usual size or body shape alone.</p>}
              <fieldset className="fit-step-fields" disabled={busy}>
                <legend className="sr-only">{step.title}</legend>
                {step.questions.map(field)}
              </fieldset>
              <div className="fit-quiz-actions">
                {stepIndex > 0 && <button className="button secondary" type="button" disabled={busy} onClick={() => setStepIndex(index => index - 1)}>Back</button>}
                <button className="button" type="submit" disabled={busy || !session}>
                  {busy ? "Working…" : stepIndex === steps.length - 1 ? "Get my size" : "Continue"}
                </button>
              </div>
              {!step.questions.some(question => question.required) && <p className="fit-help">You can leave these answers blank and continue.</p>}
            </form>
          )}
          {recommendation && <button className="button secondary" type="button" disabled={busy} onClick={editAnswers}>{busy ? "Working…" : "Change my answers"}</button>}
          {products?.length === 0 && <p>No sample products are available yet.</p>}

        </div>
      </div>
      <div
        className={recommendation || error ? "fit-result" : "fit-result empty"}
        aria-live="polite"
      >
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
        ) : null}
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
        Live Metr Fit API, fictional sample catalog. Questions, sizes in stock
        and the recommendation come from that store’s verified chart. Confidence
        is an uncalibrated evidence score, not a probability of correct fit.
      </p>
    </div>
  );
}
