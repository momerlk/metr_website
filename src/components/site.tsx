import Link from "next/link";
import { Navigation } from "./navigation";
import { Rule } from "./rule";
export function Arrow() {
  return <span aria-hidden="true">→</span>;
}
export function CTA({
  children = "Request access",
  href = "/access",
  secondary = false,
}: {
  children?: React.ReactNode;
  href?: string;
  secondary?: boolean;
}) {
  return (
    <Link className={`button ${secondary ? "secondary" : ""}`} href={href}>
      {children}
      <Arrow />
    </Link>
  );
}
export function Label({ children }: { children: React.ReactNode }) {
  return <div className="kicker">{children}</div>;
}
export function Header() {
  return (
    <header className="site-header">
      <Link href="/" aria-label="Metr home" className="brand">
        <img
          src="/brand/metr-horizontal-white.svg"
          alt="Metr"
          width="144"
          height="31"
        />
      </Link>
      <Navigation />
      <div className="progress" aria-hidden="true" />
    </header>
  );
}
export function Closing() {
  return (
    <section className="closing">
      <div className="wrap">
        <Label>Early access for fashion brands</Label>
        <h2>
          Help customers find
          <br />
          what to buy and in which size.
        </h2>
        <p>
          Request early access to Metr. We’ll review your product catalog,
          size charts and website to plan how search and size recommendations
          would work in your store.
        </p>
        <CTA />
      </div>
      <Rule vertical units={60} height={72} className="closing-rule" />
    </section>
  );
}
export function Footer() {
  return (
    <footer>
      <Rule units={300} height={28} className="footer-rule" />
      <div className="wrap footer-grid">
        <Link href="/" className="brand">
          <img
            src="/brand/metr-horizontal-white.svg"
            alt="Metr"
            width="144"
            height="31"
          />
        </Link>
        <nav aria-label="Footer">
          <Link href="/discover">Discover</Link>
          <Link href="/fit">Fit</Link>
          <Link href="/developers">Developers</Link>
          <Link href="/about">About</Link>
          <Link href="/access">Request access</Link>
        </nav>
        <nav aria-label="Legal">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
        <span>
          © {new Date().getFullYear()} Juno Technologies. AI product search
          and size recommendations for fashion stores.
        </span>
      </div>
    </footer>
  );
}
