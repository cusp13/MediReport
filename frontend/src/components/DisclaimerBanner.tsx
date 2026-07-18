import { InfoIcon } from "./icons";

export function DisclaimerBanner() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <span>
        This tool explains lab results in plain language. It is not a
        diagnosis. Always consult a doctor to interpret your results and
        decide on treatment.
      </span>
    </div>
  );
}
