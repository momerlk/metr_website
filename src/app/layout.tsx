import type { Metadata } from "next";
import { Header, Footer } from "@/components/site";
import "./globals.css";
const description =
  "Size recommendations for fashion stores. Metr asks customers a short fit quiz and recommends a size for the product they are viewing, using your approved size charts.";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "AI Sizing for Fashion Stores",
    template: "%s — Metr",
  },
  description,
  openGraph: {
    title: "Metr — Size Recommendations for Fashion Stores",
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
