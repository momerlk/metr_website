import type { Metadata } from "next";
import { Header, Footer } from "@/components/site";
import "./globals.css";
const description =
  "AI search and sizing for fashion stores. Metr shows customers clothes from your catalog and recommends which size to buy using your size charts.";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "Metr — AI Search and Sizing for Fashion Stores",
    template: "%s — Metr",
  },
  description,
  openGraph: {
    title: "Metr — AI Search and Sizing for Fashion Stores",
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
