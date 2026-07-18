import { useEffect, useState } from "react";
import { CheckCircleIcon, SpinnerIcon } from "./icons";

// Narrated loading — turns dead-air wait time into a calm, legible sequence
// that also shows the user what the AI is actually doing.
const STEPS = [
  "Reading your report",
  "Finding your results",
  "Explaining them in plain language"
];

// Steps advance on a gentle timer. The last step stays "in progress" until
// the real response lands and this component unmounts.
const STEP_MS = 2600;

export function AnalyzingState() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((i) => Math.min(i + 1, STEPS.length - 1));
    }, STEP_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="animate-fade-in rounded-2xl border border-gray-200 bg-white p-6">
      <div className="space-y-4">
        {STEPS.map((label, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <div key={label} className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                {done ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : current ? (
                  <SpinnerIcon className="h-4 w-4 text-blue-500" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-gray-200" />
                )}
              </div>
              <span
                className={`text-sm transition-colors ${
                  done
                    ? "text-gray-400"
                    : current
                      ? "font-medium text-gray-900"
                      : "text-gray-300"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
