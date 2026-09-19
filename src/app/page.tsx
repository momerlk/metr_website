import Link from "next/link";
import { CTA, Label, Closing } from "@/components/site";
import { DiscoverDemo, FitDemo } from "@/components/demos";
import { Rule, Measured } from "@/components/rule";
export const metadata = { alternates: { canonical: "/" } };
export default function Home() {
  return (
    <>
      <section className="hero wrap">
        <div className="hero-copy">
          <Label>AI commerce infrastructure for fashion brands</Label>
          <Measured>
            <h1>
              Commerce,
              <br />
              measured.
            </h1>
          </Measured>
          <p>
            Metr reads your catalog and your shopper, then closes the distance
            between them: what they mean, what you sell, and what will fit.
          </p>
          <div className="hero-actions">
            <CTA />
            <CTA href="#discover" secondary>
              See how it works
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
            <b>Core</b> One structured reading of your products, sizing, stock
            and brand.
          </li>
          <li>
            <b>Discover</b> Shoppers ask in their own words. They get what you
            actually sell.
          </li>
          <li>
            <b>Fit</b> One recommended size per garment, and how it will sit.
          </li>
        </ol>
      </div>
      <section className="section wrap problem" id="platform">
        <div className="section-heading">
          <h2>
            Shoppers speak in intent.
            <br />
            Catalogs speak in attributes.
          </h2>
          <p>
            Search runs on keywords. Size charts run on interpretation. Product
            data runs on whoever typed it last. Metr takes one structured
            reading of your catalog and puts it to work at the moment a shopper
            decides.
          </p>
        </div>
        <div className="bridge">
          <div>
            <span className="reading-label">Shopper</span>
            <p className="bridge-quote">
              “Something for a slow summer weekend.”
            </p>
            <dl className="reading">
              <div>
                <dt>Occasion</dt>
                <dd>Weekend, warm</dd>
              </div>
              <div>
                <dt>Mood</dt>
                <dd>Easy, unstructured</dd>
              </div>
              <div>
                <dt>Preference</dt>
                <dd>Breathable</dd>
              </div>
            </dl>
          </div>
          <div className="bridge-core">
            <img src="/brand/metr-icon-white.svg" alt="" width="96" height="96" />
            <span>Metr Core</span>
          </div>
          <div>
            <span className="reading-label">Catalog</span>
            <p className="bridge-quote">Relaxed linen shirt, SKU 2231</p>
            <dl className="reading">
              <div>
                <dt>product_type</dt>
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
          <Label>Metr Discover</Label>
          <h2>Search that reads intent, not keywords.</h2>
          <p>
            A shopper describes what they want. Metr works out the occasion,
            budget, colour and register behind it, retrieves from your live
            catalog, and explains why each product made the cut.
          </p>
          <ul className="feature-list">
            <li>
              <b>In their own words.</b> No translating a mood into a filter.
            </li>
            <li>
              <b>Only what you sell.</b> Every result is a real, in-stock
              product. Nothing invented.
            </li>
            <li>
              <b>Constraints hold.</b> Budget, occasion and style shape the
              ranking, not just the wording.
            </li>
          </ul>
          <Link className="text-link" href="/discover">
            Explore Discover <span aria-hidden="true">→</span>
          </Link>
        </div>
        <DiscoverDemo large />
      </section>
      <section className="section wrap feature fit-section" id="fit">
        <FitDemo />
        <div className="feature-copy">
          <Label>Metr Fit</Label>
          <h2>
            A size chart is a table.
            <br />A person is not.
          </h2>
          <p>
            Metr Fit reads the garment’s own points of measure against the
            shopper’s usual size and how they like clothes to sit. It
            recommends one size and says how it will fit, area by area.
          </p>
          <p className="muted-copy">
            A medium is not the same across your range. Fit works from each
            product’s approved chart, not a generic one.
          </p>
          <Link className="text-link" href="/fit">
            Explore Fit <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
      <section className="section loop">
        <div className="wrap">
          <div className="section-heading">
            <h2>Built to get sharper with every order.</h2>
            <p>
              Discovery, sizing and future post-purchase intelligence share one
              commerce model, so each interaction becomes a structured signal
              instead of a disconnected event.
            </p>
          </div>
          <ol className="loop-flow">
            {[
              ["Understand", "Catalog, sizing, stock and brand, structured."],
              ["Discover", "Intent matched to real products."],
              ["Fit", "One size, explained."],
              ["Purchase", "A confident decision."],
              ["Learn", "Outcomes feed the model."],
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
          <h2>Add intelligence without rebuilding your store.</h2>
          <p>
            Metr sits on top of the commerce stack you already run. Connect the
            catalog once. Discover and Fit draw from the same reading.
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
