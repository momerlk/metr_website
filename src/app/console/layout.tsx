import Link from "next/link";
import ConsoleIcon from "@/components/console-icon";
import "./console.css";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <div className="console-shell">
    <nav className="console-rail" aria-label="Metr">
      <Link href="/" className="console-rail-brand" aria-label="Metr website"><img src="/brand/metr-icon-white-on-black.svg" alt="" width="34" height="34" /></Link>
      <Link href="/console" className="console-rail-current" aria-label="Seller console" aria-current="page" title="Seller console"><ConsoleIcon name="stores" /></Link>
      <Link href="/docs" aria-label="API documentation" title="API documentation"><ConsoleIcon name="guide" /></Link>
      <span className="console-rail-caption" aria-hidden="true">METR FIT</span>
    </nav>
    <main id="main">{children}</main>
  </div>;
}
