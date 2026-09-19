import type { Metadata } from "next";
import { Header, Footer } from "@/components/site";
import "./globals.css";
const description =
  "Metr is AI commerce infrastructure for fashion brands: product discovery and fit intelligence built on one structured reading of your catalog.";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "Metr — Commerce, measured.",
    template: "%s — Metr",
  },
  description,
  openGraph: {
    title: "Metr — Commerce, measured.",
    description,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/brand/metr-icon-white-on-black.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
