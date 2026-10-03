import { Header, Footer } from "@/components/site";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <><Header /><main id="main">{children}</main><Footer /></>;
}
