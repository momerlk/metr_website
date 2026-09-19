import Link from "next/link";
import { CTA, Label, Closing } from "@/components/site";
import { DiscoverDemo, FitDemo } from "@/components/demos";
import { Rule } from "@/components/rule";
export const metadata = { alternates: { canonical: "/" } };
export default function Home() {
  return (
    <>
      <section className="hero wrap">
        <div className="hero-copy">
          <Label>Metr · Early access</Label>
          <h1>
            AI search and sizing
            <br />
            for fashion stores.
          </h1>
          <p className="hero-tagline">
            Help customers find what to buy and in which size.
          </p>
          <p>
            Metr connects to your online store’s product catalog and size charts.
            It shows customers the clothes they ask for and recommends a size
            for the item they choose, directly on your website.
          </p>
          <div className="hero-actions">
            <CTA />
            <CTA href="#discover" secondary>
              Try the search demo
            </CTA>
          </div>
        </div>
        <div className="hero-demo">
          <DiscoverDemo />
        </div>
      </section>
      <div className="scale-strip" aria-label="The Metr platform">
        <Rule units={400} height={40} />
        <ol className="wrap">
          <li>
            <b>Product search</b> Customers describe the clothes they want.
            Metr shows matching items from your store.
          </li>
          <li>
            <b>Size recommendations</b> Customers enter their usual size and
            preferred fit. Metr suggests a size for the selected item.
          </li>
          <li>
            <b>Connected to your store</b> Your catalog and size charts supply
            the answers. Customers buy through your existing checkout.
          </li>
        </ol>
      </div>
      <section className="section wrap problem" id="platform">
        <div className="section-heading">
          <h2>
            From “a linen shirt”
            <br />
            to a shirt in your store.
          </h2>
          <p>
            A customer types “a relaxed linen shirt for summer.” Metr checks
            your product descriptions, fabrics and stock, then shows shirts
            that match. Every result links to a product on your website.
          </p>
        </div>
        <div className="bridge">
          <div>
            <span className="reading-label">Customer request · Example</span>
            <p className="bridge-quote">
              “A relaxed linen shirt for summer.”
            </p>
            <dl className="reading">
              <div>
                <dt>Fabric</dt>
                <dd>Linen</dd>
              </div>
              <div>
                <dt>Fit</dt>
                <dd>Relaxed</dd>
              </div>
              <div>
                <dt>Season</dt>
                <dd>Summer</dd>
              </div>
            </dl>
          </div>
          <div className="bridge-core">
            <img src="/brand/metr-icon-white.svg" alt="" width="96" height="96" />
            <span>Metr matches</span>
          </div>
          <div>
            <span className="reading-label">Matching product</span>
            <p className="bridge-quote">Relaxed linen shirt, SKU 2231</p>
            <dl className="reading">
              <div>
                <dt>Product</dt>
                <dd>shirt</dd>
              </div>
              <div>
                <dt>material</dt>
                <dd>linen, 100%</dd>
              </div>
              <div>
                <dt>fit</dt>
                <dd>relaxed</dd>
              </div>
              <div>
                <dt>stock</dt>
                <dd>S · M · L</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
      <section className="section wrap feature" id="discover">
        <div className="feature-copy">
          <Label>Product search · Metr Discover</Label>
          <h2>Show the clothes your customers ask for.</h2>
          <p>
            A customer types “a black shirt for dinner, under Rs 5,000.”
            Metr searches your catalog for black shirts within that budget
            and shows the matching products, prices and reasons to choose them.
          </p>
          <ul className="feature-list">
            <li>
              <b>Everyday language.</b> Customers can describe an occasion, a
              style or a budget.
            </li>
            <li>
              <b>Your products.</b> Results come from your catalog and use
              your stock data.
            </li>
            <li>
              <b>Relevant matches.</b> Price, colour and style help determine
              which products appear.
            </li>
          </ul>
          <Link className="text-link" href="/discover">
            See how product search works <span aria-hidden="true">→</span>
          </Link>
        </div>
        <DiscoverDemo large />
      </section>
      <section className="section wrap feature fit-section" id="fit">
        <FitDemo />
        <div className="feature-copy">
          <Label>Size recommendations · Metr Fit</Label>
          <h2>
            Answer “Which size
            <br />should I order?”
          </h2>
          <p>
            A customer selects their usual size and how they like clothes to
            fit. Metr compares those answers with the item’s size chart, then
            recommends a size and explains whether it will feel close,
            relaxed or roomy.
          </p>
          <p className="muted-copy">
            Each recommendation depends on the product’s measurements. Your
            brand provides and approves the size charts.
          </p>
          <Link className="text-link" href="/fit">
            See how size recommendations work <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
      <section className="section loop">
        <div className="wrap">
          <div className="section-heading">
            <h2>From your catalog to your checkout.</h2>
            <p>
              You provide the product catalog and size charts. Metr uses them
              to power search and size recommendations on your website.
              Your store handles the cart, payment and order.
            </p>
          </div>
          <ol className="loop-flow">
            {[
              ["Connect", "Share your catalog, prices, stock and size charts."],
              ["Set up", "Add search and size guidance to your website."],
              ["Search", "Customers describe what they want and see matching items."],
              ["Choose a size", "Customers get a recommendation for the product."],
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
            ["Shopify", "Planned"],
            ["WooCommerce", "Planned"],
            ["Custom storefront", "Early access"],
            ["APIs and SDKs", "In development"],
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
