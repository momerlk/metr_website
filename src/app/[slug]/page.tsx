import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CTA, Label, Closing } from "@/components/site";
import { DiscoverDemo, FitDemo } from "@/components/demos";
import { productPages } from "@/lib/content";
const pages = ["discover", "fit", "about", "developers", "privacy", "terms"];
export function generateStaticParams() {
  return pages.map((slug) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = productPages[slug as keyof typeof productPages];
  const title = product
    ? `Metr ${slug === "fit" ? "Fit — Size Recommendations" : "Discover — AI Product Search"}`
    : `${slug.charAt(0).toUpperCase() + slug.slice(1)}`;
  const description =
    product?.description ||
    {
      about:
        "Metr helps fashion stores offer AI product search and size recommendations using their own catalog and size charts.",
      developers:
        "Integrate Metr Fit sizing through its documented REST API, with product-specific questionnaires, recommendations and outcome events.",
      privacy:
        "Information about access requests and data handling on the Metr preview website.",
      terms: "Preview website terms and demonstration limitations.",
    }[slug] ||
    "Metr product search and size recommendations.";
  return {
    title,
    description,
    alternates: { canonical: `/${slug}` },
    openGraph: { title, description },
    ...(slug === "privacy" || slug === "terms"
      ? { robots: { index: false, follow: true } }
      : {}),
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!pages.includes(slug)) notFound();
  if (slug === "discover" || slug === "fit") {
    const content = productPages[slug];
    return (
      <>
        <section className="inner-hero wrap">
          <Label>{content.label}</Label>
          <h1>{content.title}</h1>
          <p>{content.description}</p>
          <CTA />
        </section>
        <div className="inner-demo">
          {slug === "discover" ? <DiscoverDemo large /> : <FitDemo />}
        </div>
        <section className="steps wrap">
          {content.steps.map(([title, body], i) => (
            <div key={title}>
              <span className="reading-label">0{i + 1}</span>
              <h2>{title}.</h2>
              <p>{body}</p>
            </div>
          ))}
        </section>
        <Closing />
      </>
    );
  }
  if (slug === "about")
    return (
      <>
        <section className="inner-hero wrap">
          <Label>About Metr</Label>
          <h1>Help customers find a product and choose a size.</h1>
          <p>We’re building AI product search and size recommendations for online fashion stores.</p>
        </section>
        <article className="article wrap">
          <p>
            Metr is a product of Juno Technologies. It brings two tools to a
            brand’s own website: Discover, for finding products, and Fit,
            for choosing a size.
          </p>
          <p>
            Customers often know the occasion or style they want before they
            know which product to buy. They may also be unsure which size to
            choose. Metr uses the brand’s product details and size charts to
            help answer both questions.
          </p>
          <h2>Your products. Your website. Your checkout.</h2>
          <p>
            Discover matches requests in everyday language to products in your
            catalog. Fit uses the selected garment’s measurements and the
            customer’s preferences to suggest a size. Customers stay in your
            store to complete their purchase.
          </p>
          <p>
            Metr is in early access. We review integration requirements with
            each brand. The interactive examples on this website use fictional
            products to demonstrate the planned customer experience.
          </p>
          <p className="notice">Metr is a product of Juno Technologies.</p>
        </article>
        <Closing />
      </>
    );
  if (slug === "developers")
    return (
      <>
        <section className="inner-hero wrap">
          <Label>Metr Fit / Developers</Label>
          <h1>Size recommendations through one API.</h1>
          <p>
            Send your products, available sizes and approved size charts.
            Receive a product-specific quiz and an explained size recommendation.
            Report purchases and returns through the same REST API.
          </p>
          <CTA href="/docs/quickstart">Read the quickstart</CTA>
        </section>
        <section className="developer-grid wrap">
          <div>
            <h2>Built for your store’s backend.</h2>
            <p>
              Metr Fit V1 includes store-scoped API keys, catalog and chart APIs,
              deterministic sizing, customer sessions and outcome events.
              Use the generated OpenAPI contract to integrate with your existing store.
            </p>
            <div className="surface-list">
              <span>REST /v1</span>
              <span>OpenAPI 3.1</span>
              <span>Store-scoped keys</span>
            </div>
            <p className="notice">
              Keep API keys on your server. A Shopify app and JavaScript SDK
              are not included in Fit V1. Discover remains a separate planned product.
            </p>
            <CTA href="/docs/api-reference" secondary>Explore the API</CTA>
          </div>
          <div className="code-panel">
            <div className="demo-top">
              <span>Submit quiz answers</span>
              <span>From your backend</span>
            </div>
            <pre><code>{`POST /v1/stores/{store_id}/fit-sessions/{session_id}/recommendations
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "answers": {
    "usual_size": "M",
    "size_consistency": "consistent",
    "preferred_fit": "regular",
    "measurements": { "chest": 98 }
  }
}`}</code></pre>
          </div>
        </section>
      </>
    );

  return (
    <>
      <section className="inner-hero wrap">
        <Label>Metr {slug}</Label>
        <h1>
          {slug === "privacy" ? "Privacy notice." : "Preview terms."}
        </h1>
        <p>This site is an early-access preview.</p>
      </section>
      <article className="article wrap">
        <p className="notice">
          This is a provisional notice. Final legal policies and company details
          must be reviewed and approved before public launch.
        </p>
        {slug === "privacy" ? (
          <>
            <h2>Information you choose to share</h2>
            <p>
              The access form collects your name, work email, brand, website,
              platform, order range, product interest, and optional message.
              These details are stored to review your early-access request.
            </p>
            <h2>Website demonstrations</h2>
            <p>
              Discover and Fit use fictional catalog examples. Their controls
              run in your browser and do not submit your preferences to an AI
              service.
            </p>
            <h2>Contact and retention</h2>
            <p>
              A verified privacy contact, retention schedule, and applicable
              rights information will be published with the approved launch
              policy.
            </p>
          </>
        ) : (
          <>
            <h2>Demonstrations, not live recommendations</h2>
            <p>
              The product examples illustrate planned storefront experiences.
              They do not offer products for sale, guarantee fit, or provide
              measured performance claims.
            </p>
            <h2>Early access</h2>
            <p>
              Submitting a request does not guarantee access. Product
              availability and integration scope will be agreed directly with
              participating merchants.
            </p>
            <h2>Before launch</h2>
            <p>
              Final service terms, company information, and contact details will
              be published following legal review.
            </p>
          </>
        )}
      </article>
    </>
  );
}
