import { Label } from "@/components/site";
import { AccessForm } from "@/components/access-form";
export const metadata = {
  title: "Request access",
  description:
    "Request early access to Metr Fit size recommendations for your fashion store.",
  alternates: { canonical: "/access" },
};
export default function AccessPage() {
  return (
    <section className="access-layout wrap">
      <div className="inner-hero">
        <Label>Early access for fashion brands</Label>
        <h1>Let’s explore Metr for your store.</h1>
        <p>
          Tell us about your online store and the size charts you work with.
          We’ll review your details and get in touch if your store is a fit for
          early access.
        </p>
        <div className="access-note">
          <p>
            The next step is a discussion about your catalog, size charts and
            website setup. Submitting this form does not install Metr or
            commit you to a purchase.
          </p>
        </div>
      </div>
      <AccessForm />
    </section>
  );
}
