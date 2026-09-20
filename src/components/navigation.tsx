"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
export function Navigation() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <>
      <button
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="main-nav"
        onClick={() => setOpen(!open)}
      >
        {open ? "Close −" : "Menu +"}
      </button>
      <nav
        id="main-nav"
        className={open ? "navigation open" : "navigation"}
        aria-label="Main navigation"
      >
        {[
          ["/fit", "Fit"],
          ["/developers", "Developers"],
          ["/about", "About"],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            aria-current={path === href ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            {label}
          </Link>
        ))}
        <Link href="/access" className="nav-cta" onClick={() => setOpen(false)}>
          Request access <span aria-hidden="true">→</span>
        </Link>
      </nav>
    </>
  );
}
