import Link from "next/link";
import "./console.css";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <div className="console-shell">
    <header className="console-topbar">
      <Link href="/console" className="console-brand" aria-label="Metr console"><img src="/brand/metr-horizontal-white.svg" alt="Metr" width="100" height="22" /><span>Console</span></Link>
      <div className="console-topbar-links"><Link href="/docs">API docs ↗</Link><Link href="/">Metr website ↗</Link></div>
    </header>
    <main id="main">{children}</main>
  </div>;
}
