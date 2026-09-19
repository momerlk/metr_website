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
    ? `Metr ${slug === "fit" ? "Fit — AI Sizing Intelligence" : "Discover — AI Product Discovery"}`
    : `${slug.charAt(0).toUpperCase() + slug.slice(1)}`;
  const description =
    product?.description ||
    {
      about:
        "Metr is building commerce infrastructure that understands products and people.",
      developers:
        "Explore the Metr integration direction for storefront APIs, SDKs, and components.",
      privacy:
        "Information about access requests and data handling on the Metr preview website.",
      terms: "Preview website terms and demonstration limitations.",
    }[slug] ||
    "Metr commerce intelligence.";
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
          <h1>Commerce should be measured, not guessed.</h1>
          <p>Metr is AI commerce infrastructure for fashion brands.</p>
        </section>
        <article className="article wrap">
          <p>
            We started by fixing product discovery and sizing inside Juno, our
            own storefront. The fixes turned out to be infrastructure, so we are
            opening them to other fashion brands as Metr.
          </p>
          <p>
            A fashion catalog holds a lot of measurement already: sizes, points
            of measure, materials, stock, the words a brand uses for its own
            cuts. Most of it never reaches the shopper in a form they can use.
          </p>
          <h2>Measurement at the point of decision.</h2>
          <p>
            Metr takes one structured reading of that data and applies it where
            a shopper decides. What do they mean? Which products match? Which
            size will sit the way they like?
          </p>
          <p>
            V1 is Discover and Fit, built on the same reading of your catalog.
            One layer, designed around your brand, with room to grow into
            returns and operations later.
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
          <Label>Developers</Label>
          <h1>Commerce intelligence, exposed as infrastructure.</h1>
          <p>
            One reading of the catalog, reachable from your storefront, your
            backend and the commerce stack you already run.
          </p>
          <CTA />
        </section>
        <section className="developer-grid wrap">
          <div>
            <h2>
              One commerce model.
              <br />
              Multiple surfaces.
            </h2>
            <p>
              APIs and storefront components are being built around the same
              intelligence layer. Early integrations are scoped with each
              merchant, by hand.
            </p>
            <div className="surface-list">
              <span>REST API</span>
              <span>JavaScript SDK</span>
              <span>React components</span>
              <span>Webhooks</span>
            </div>
            <p className="notice">
              Public contracts are in development. Shopify and WooCommerce
              connectors are planned. Request access to discuss your storefront.
            </p>
          </div>
          <div className="code-panel">
            <div className="demo-top">
              <span>Integration concept</span>
              <span>Illustrative, not a live SDK</span>
            </div>
            <pre>
              <code>{`// Connect your brand context\nMetr.init({\n  merchantId: "your_brand"\n});\n\n// Bring intent to your storefront\nMetr.openDiscover();\n\n// Product-specific size guidance\n// Built on your approved size charts`}</code>
            </pre>
          </div>
        </section>
        <Closing />
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
