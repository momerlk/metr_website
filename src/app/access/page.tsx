import { Label } from "@/components/site";
import { AccessForm } from "@/components/access-form";
export const metadata = {
  title: "Request access",
  description:
    "Bring Metr discovery and fit intelligence to your fashion storefront.",
  alternates: { canonical: "/access" },
};
export default function AccessPage() {
  return (
    <section className="access-layout wrap">
      <div className="inner-hero">
        <Label>Early access, V1</Label>
        <h1>Put a rule to your storefront.</h1>
        <p>
          Tell us about your brand. We are onboarding a small number of fashion
          merchants for V1 and scoping each integration by hand.
        </p>
        <div className="access-note">
          <p>
            Start with Discover, Fit, or both. We review your storefront and
            catalog, then come back with what makes sense for your range.
          </p>
        </div>
      </div>
      <AccessForm />
    </section>
  );
}
