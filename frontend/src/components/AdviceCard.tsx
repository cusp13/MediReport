import type { DailyAdvice } from "../types/account";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function AdviceCard({ advice }: { advice: DailyAdvice }) {
  return (
    <div className="animate-fade-in-up space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      {/* Assessment banner */}
      <div className="rounded-xl bg-blue-50 px-4 py-3">
        <p className="text-sm font-medium text-blue-800">{advice.recoveryAssessment}</p>
        {advice.cached && (
          <p className="mt-0.5 text-xs text-blue-500">Cached from earlier today</p>
        )}
      </div>

      {/* Warning flags */}
      {advice.warningFlags.length > 0 && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-500">
            ⚠ Warning signs — seek care if you notice:
          </p>
          <ul className="space-y-0.5">
            {advice.warningFlags.map((flag) => (
              <li key={flag} className="text-sm text-red-700">
                • {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Diet plan */}
      <Section title="Today's Diet Plan">
        <div className="space-y-1.5 rounded-xl bg-green-50 p-4">
          {(
            [
              ["Breakfast", advice.dietPlan.breakfast],
              ["Lunch", advice.dietPlan.lunch],
              ["Dinner", advice.dietPlan.dinner],
              ["Snacks", advice.dietPlan.snacks]
            ] as [string, string][]
          ).map(([meal, text]) => (
            <div key={meal} className="flex gap-2 text-sm">
              <span className="w-20 shrink-0 font-medium text-gray-500">{meal}</span>
              <span className="text-gray-700">{text}</span>
            </div>
          ))}
          {advice.dietPlan.avoid.length > 0 && (
            <div className="mt-2 border-t border-green-100 pt-2 text-sm">
              <span className="font-medium text-red-500">Avoid: </span>
              <span className="text-gray-600">{advice.dietPlan.avoid.join(", ")}</span>
            </div>
          )}
        </div>
      </Section>

      {/* Hydration + Exercise */}
      <div className="grid grid-cols-2 gap-3">
        <Section title="Hydration">
          <div className="rounded-xl bg-cyan-50 p-3 text-sm text-cyan-800">
            {advice.hydrationTarget}
          </div>
        </Section>
        <Section title="Activity">
          <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            {advice.exerciseAdvice}
          </div>
        </Section>
      </div>

      {/* Tomorrow's goal */}
      <Section title="Tomorrow's Goal">
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          {advice.tomorrowGoal}
        </div>
      </Section>
    </div>
  );
}
