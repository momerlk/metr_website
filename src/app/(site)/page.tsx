import Link from "next/link";
import { CTA, Closing } from "@/components/site";
import { Fit } from "@/components/fit";
import { Rule } from "@/components/rule";
export const metadata = { alternates: { canonical: "/" } };
/** Line-drawn tech flat: the example shirt from the chart below, with its measured points. */
function TechFlat() {
  return (
    <svg className="tech-flat" viewBox="0 0 250 216" aria-hidden="true">
      <g className="tech-flat-garment">
        <path pathLength={1} d="M91 35L62 45 28 99 61 120 76 99 71 207Q125 214 180 207L175 99 191 120 223 99 189 45 159 35Q125 47 91 35Z" />
        <path pathLength={1} d="M92 35L107 65 124 48 143 65 159 35 140 28 125 43 109 28Z" />
        <path pathLength={1} d="M125 48V208M143 81H164V103H143ZM74 61L76 99M177 61L175 99M38 95L63 111M187 111L214 95" />
      </g>
      <g className="tech-flat-dims">
        <path d="M76 132H175M76 128V136M175 128V136" />
        <text x="125.5" y="126" textAnchor="middle">104</text>
        <path d="M238 35V207M234 35H242M234 207H242" />
        {/* 70 cm over 172 units: a tick every 5 cm, longer every 10 */}
        <path
          className="tech-flat-ticks"
          d={Array.from({ length: 13 }, (_, i) => {
            const y = 35 + ((i + 1) * 5 * 172) / 70;
            return `M${i % 2 ? 234 : 236} ${y.toFixed(1)}H238`;
          }).join("")}
        />
        <text x="246" y="124" textAnchor="middle" transform="rotate(90 246 124)">70</text>
        <path d="M91 20H159M91 16V24M159 16V24" />
        <text x="125" y="13" textAnchor="middle">48</text>
      </g>
    </svg>
  );
}
export default function Home() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="wrap hero-grid">
          <div>
            <p className="hero-backers">
              Backed by{" "}
              <abbr title="National Incubation Center Lahore">NICL</abbr>
              <abbr title="LUMS Center for Entrepreneurship">LCE</abbr>
            </p>
            <h1 id="hero-title">
              AI sizing for
              <br />
              <span>fashion stores.</span>
            </h1>
            <p className="hero-tagline">
              Help customers choose a size before they buy.
            </p>
            <div className="hero-actions">
              <CTA />
              <Link href="/docs/quickstart" className="text-link">
                Read the quickstart <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <figure className="hero-figure">
            <TechFlat />
            <figcaption>
              <span>Example · Relaxed linen shirt</span>
              <span className="hero-sizes">
                Recommended <span aria-hidden="true">S</span>
                <b>M</b>
                <span aria-hidden="true">L</span>
              </span>
            </figcaption>
          </figure>
        </div>
      </section>
      <Rule units={400} className="hero-rule" />
      <section className="wrap principles" aria-label="How Metr Fit works">
        <ol>
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
      </section>
      <section className="section wrap demo-section" aria-labelledby="demo-title">
        <div className="demo-heading">
          <h2 id="demo-title">Try the sizing experience.</h2>
          <p>
            The same quiz a customer answers on a product page, from their
            answers to a recommended size.
          </p>
        </div>
        <Fit />
      </section>
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
