import Link from "next/link";
import { CTA, Label, Closing } from "@/components/site";
import { Fit } from "@/components/fit";
import { Rule } from "@/components/rule";
export const metadata = { alternates: { canonical: "/" } };
export default function Home() {
  return (
    <>
      <section className="hero wrap">
        <div className="hero-copy">
          <Label>Metr Fit · Early access</Label>
          <h1>
            Size recommendations
            <br />
            for fashion stores.
          </h1>
          <p className="hero-tagline">
            Help customers choose a size before they buy.
          </p>
          <p>
            Metr connects to your product catalog and approved size charts. On
            the product page, a customer answers a short quiz and receives a
            size for that garment, with an explanation of how it should fit.
          </p>
          <div className="hero-actions">
            <CTA />
            <CTA href="/docs/quickstart" secondary>
              Read the quickstart
            </CTA>
          </div>
        </div>
        <div className="hero-demo">
          <Fit />
        </div>
      </section>
      <div className="scale-strip" aria-label="How Metr Fit works">
        <Rule units={400} height={40} />
        <ol className="wrap">
          <li>
            <b>Your size charts</b> You supply each garment’s measurements. A
            recommendation only uses the chart you approved for that product.
          </li>
          <li>
            <b>A short quiz</b> Customers give their usual size, preferred fit
            and, if they want, body measurements.
          </li>
          <li>
            <b>Connected to your store</b> Only sizes you currently have in
            stock are recommended. Customers buy through your existing checkout.
          </li>
        </ol>
      </div>
      <section className="section wrap problem" id="platform">
        <div className="section-heading">
          <h2>
            From “which size
            <br />
            should I order?” to an answer.
          </h2>
          <p>
            A customer usually wears M and likes a relaxed fit. Metr compares
            those answers with the garment’s chest, shoulder and length
            measurements, then recommends the closest available size and says
            how it should feel.
          </p>
        </div>
        <div className="bridge">
          <div>
            <span className="reading-label">Customer answers · Example</span>
            <p className="bridge-quote">“I usually wear M, relaxed.”</p>
            <dl className="reading">
              <div>
                <dt>Usual size</dt>
                <dd>M</dd>
              </div>
              <div>
                <dt>Across brands</dt>
                <dd>Consistent</dd>
              </div>
              <div>
                <dt>Preferred fit</dt>
                <dd>Relaxed</dd>
              </div>
            </dl>
          </div>
          <div className="bridge-core">
            <img src="/brand/metr-icon-white.svg" alt="" width="96" height="96" />
            <span>Metr compares</span>
          </div>
          <div>
            <span className="reading-label">Your approved chart</span>
            <p className="bridge-quote">Relaxed linen shirt, SKU 2231</p>
            <dl className="reading">
              <div>
                <dt>chest, size M</dt>
                <dd>104 cm</dd>
              </div>
              <div>
                <dt>shoulder, size M</dt>
                <dd>48 cm</dd>
              </div>
              <div>
                <dt>length, size M</dt>
                <dd>70 cm</dd>
              </div>
              <div>
                <dt>in stock</dt>
                <dd>S · M · L</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
      <section className="section loop">
        <div className="wrap">
          <div className="section-heading">
            <h2>From your size charts to your checkout.</h2>
            <p>
              You provide the catalog, available variants and approved size
              charts. Metr returns the quiz and the recommendation. Your store
              handles the cart, payment and order.
            </p>
          </div>
          <ol className="loop-flow">
            {[
              ["Connect", "Share your products, stock and approved size charts."],
              ["Set up", "Add the size quiz to your product pages."],
              ["Ask", "Customers answer a few questions about fit."],
              ["Recommend", "Metr returns a size, expected fit and explanation."],
              ["Buy", "Customers complete the purchase in your store."],
            ].map(([step, note]) => (
              <li key={step}>
                <h3>{step}</h3>
                <p>{note}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="section wrap integration">
        <div>
          <Label>Integration</Label>
          <h2>Connect the store you already run.</h2>
          <p>
            During early access, we review your website, catalog and size charts
            with you to agree on an integration plan. Shopify and WooCommerce
            connectors are planned; setup is not yet self-service.
          </p>
          <Link href="/developers" className="text-link">
            For developers <span aria-hidden="true">→</span>
          </Link>
        </div>
        <dl className="integration-list">
          {[
            ["REST API", "Available"],
            ["Shopify", "Planned"],
            ["WooCommerce", "Planned"],
            ["JavaScript SDK", "Not in V1"],
          ].map(([name, status]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{status}</dd>
            </div>
          ))}
        </dl>
      </section>
      <Closing />
    </>
  );
}
