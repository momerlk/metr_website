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
        "Explore planned APIs and components for adding Metr product search and size recommendations to your online store.",
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
          <Label>Developers</Label>
          <h1>Add Metr search and sizing to your website.</h1>
          <p>
            Connect your catalog, prices, stock and size charts. Use Metr to
            show matching products and size recommendations within your
            existing online store.
          </p>
          <CTA />
        </section>
        <section className="developer-grid wrap">
          <div>
            <h2>
              Plan your integration.
            </h2>
            <p>
              Planned APIs and website components will support product search
              and size recommendations. During early access, we work with
              each brand to review its data and agree on the setup.
            </p>
            <div className="surface-list">
              <span>REST API</span>
              <span>JavaScript SDK</span>
              <span>React components</span>
              <span>Webhooks</span>
            </div>
            <p className="notice">
              Public APIs and SDKs are in development. Shopify and WooCommerce
              connectors are planned. Request access to discuss your storefront.
            </p>
          </div>
          <div className="code-panel">
            <div className="demo-top">
              <span>Integration concept</span>
              <span>Illustrative, not a live SDK</span>
            </div>
            <pre>
              <code>{`// Illustrative setup for your store\nMetr.init({\n  merchantId: "your_brand"\n});\n\n// Open product search\nMetr.openDiscover();\n\n// Product-specific size guidance\n// Built on your approved size charts`}</code>
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
