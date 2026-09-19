import { CTA, Label } from "@/components/site";
export default function NotFound() {
  return (
    <section className="not-found">
      <Label>404, off the scale</Label>
      <h1>Nothing measured here.</h1>
      <p>The page you asked for is not in the catalog.</p>
      <CTA href="/">Back to Metr</CTA>
    </section>
  );
}
