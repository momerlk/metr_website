"use client";
import Link from "next/link";
import { useState } from "react";
export function AccessForm() {
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error || "We couldn’t save your request. Please try again.",
        );
      setState("success");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect. Please try again.",
      );
      setState("error");
    }
  }
  if (state === "success")
    return (
      <div className="success-panel" role="status">
        <span className="success-mark">✓</span>
        <h2>Request received.</h2>
        <p>
          We’ll review your storefront and get in touch if Metr is a fit for the
          V1 program.
        </p>
        <Link href="/" className="text-link">
          Back to Metr <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  return (
    <form className="access-form" onSubmit={submit}>
      <label>
        Full name
        <input
          name="name"
          autoComplete="name"
          placeholder="Your name"
          required
          maxLength={100}
        />
      </label>
      <label>
        Work email
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@brand.com"
          required
          maxLength={254}
        />
      </label>
      <label>
        Brand name
        <input
          name="brand"
          autoComplete="organization"
          placeholder="Your brand"
          required
          maxLength={100}
        />
      </label>
      <label>
        Website URL
        <input
          name="website"
          type="url"
          autoComplete="url"
          placeholder="https://yourbrand.com"
          required
          maxLength={500}
        />
      </label>
      <label>
        Store platform
        <select name="platform" required defaultValue="">
          <option value="" disabled>
            Select platform
          </option>
          {["Shopify", "WooCommerce", "Custom", "Other"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <label>
        Monthly online orders
        <select name="orders" required defaultValue="">
          <option value="" disabled>
            Select range
          </option>
          {["<100", "100–500", "500–2,000", "2,000+"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <label className="full-field">
        Interested in
        <select name="interest" defaultValue="Both" required>
          <option>Both</option>
          <option>Discover</option>
          <option>Fit</option>
        </select>
      </label>
      <label className="full-field">
        Anything else?{" "}
        <textarea
          name="message"
          placeholder="A little about your storefront (optional)"
          maxLength={2000}
        />
      </label>
      <div className="honeypot" aria-hidden="true">
        <label>
          Leave this empty
          <input name="company_url" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p className="form-privacy full-field">
        We’ll use these details to review your request and contact you about
        early access. Read the <Link href="/privacy">privacy notice</Link>.
      </p>
      {error && (
        <p role="alert" id="form-error" className="form-error full-field">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="button full-field"
        disabled={state === "sending"}
        aria-describedby={error ? "form-error" : undefined}
      >
        {state === "sending" ? "Sending request…" : "Request access"}
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
