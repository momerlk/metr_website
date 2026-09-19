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
        <div className="product-menu">
          <button aria-haspopup="true">
            Product <span aria-hidden="true">⌄</span>
          </button>
          <div className="product-dropdown">
            <Link href="/discover" onClick={() => setOpen(false)}>
              Discover <span>Search that reads intent</span>
            </Link>
            <Link href="/fit" onClick={() => setOpen(false)}>
              Fit <span>Size charts into decisions</span>
            </Link>
          </div>
        </div>
        {[
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
