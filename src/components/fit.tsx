import { FitDemo } from "@/components/demos";
import { FitLiveDemo } from "@/components/fit-live";
import { fitConfig } from "@/lib/fit";
/** Uses the real Metr Fit API when it is configured, otherwise the illustrative demo. */
export function Fit() {
  return fitConfig() ? <FitLiveDemo /> : <FitDemo />;
}
