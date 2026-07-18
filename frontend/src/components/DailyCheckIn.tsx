import { useEffect, useState } from "react";
import { addHealthLog, getTodayAdvice, fetchConditionSchema } from "../api/client";
import type { DailyAdvice } from "../types/account";

interface PrimaryMetric {
  label: string;
  min: number;
  max: number;
  step: number;
  placeholder: string;
  isTemperature: boolean;
}

interface SecondaryField {
  label: string;
  min: number;
  max: number;
  step: number;
  placeholder: string;
  notesPrefix: string;
}

interface CheckInSchema {
  primaryMetric: PrimaryMetric | null;
  secondaryField: SecondaryField | null;
  nauseaLabel: string | null;
  symptoms: string[];
}

// logText label sent to backend — uses stored unit, not display unit
function primaryLogLabel(schema: CheckInSchema): string | undefined {
  const pm = schema.primaryMetric;
  if (!pm) return undefined;
  if (pm.isTemperature) return "Fever (°C)";
  return pm.label;
}

export function DailyCheckIn({
  conditionId,
  conditionName,
  onAdviceReady
}: Readonly<{
  conditionId: string;
  conditionName: string;
  onAdviceReady: (advice: DailyAdvice) => void;
}>) {
  const [schema, setSchema] = useState<CheckInSchema | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(true);

  const [primaryValue, setPrimaryValue] = useState("");
  const [secondaryValue, setSecondaryValue] = useState("");
  const [energy, setEnergy] = useState(5);
  const [nausea, setNausea] = useState(1);
  const [sleep, setSleep] = useState("");
  const [hydration, setHydration] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [medTaken, setMedTaken] = useState<boolean | null>(null);
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"form" | "generating">("form");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSchemaLoading(true);
    fetchConditionSchema(conditionName)
      .then(({ schema: s }) => setSchema(s))
      .catch(() => setSchema({
        primaryMetric: { label: "Fever (°F)", min: 95, max: 108, step: 0.1, placeholder: "e.g. 101.3", isTemperature: true },
        secondaryField: null,
        nauseaLabel: "Discomfort",
        symptoms: ["headache", "fatigue", "nausea", "body ache", "dizziness", "loss of appetite", "vomiting", "chills", "rash", "weakness"]
      }))
      .finally(() => setSchemaLoading(false));
  }, [conditionName]);

  function toggleSymptom(s: string) {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function getPrimaryNumericValue(): number | undefined {
    if (!primaryValue || !schema?.primaryMetric) return undefined;
    const raw = Number(primaryValue);
    return schema.primaryMetric.isTemperature
      ? +((raw - 32) * 5 / 9).toFixed(1)
      : raw;
  }

  function buildNotes(): string | undefined {
    const sf = schema?.secondaryField;
    const diastolic = sf && secondaryValue
      ? `${sf.notesPrefix}${secondaryValue} mmHg.`
      : "";
    const userNotes = notes.trim();
    const combined = [diastolic, userNotes].filter(Boolean).join(" ");
    return combined || undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!schema) return;
    setError(null);
    setStep("generating");
    try {
      await addHealthLog({
        conditionId,
        fever: getPrimaryNumericValue(),
        primaryMetricLogLabel: primaryLogLabel(schema),
        energyLevel: energy,
        nauseaLevel: schema.nauseaLabel ? nausea : undefined,
        nauseaLogLabel: schema.nauseaLabel ?? undefined,
        sleepHours: sleep ? Number(sleep) : undefined,
        hydrationLitres: hydration ? Number(hydration) : undefined,
        symptoms,
        medicationTaken: medTaken ?? undefined,
        notes: buildNotes()
      });
      const { advice } = await getTodayAdvice(conditionId);
      onAdviceReady(advice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("form");
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-blue-400";

  if (schemaLoading) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        Building your personalised check-in form…
      </div>
    );
  }

  if (!schema) return null;

  if (step === "generating") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-blue-100 bg-white p-10 text-center shadow-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="text-sm font-medium text-gray-600">
          Analysing your check-in with AI…
        </p>
        <p className="text-xs text-gray-400">
          Retrieving your health history and medical guidelines
        </p>
      </div>
    );
  }

  const hasTwoCols = !!(schema.primaryMetric || schema.secondaryField);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-gray-900">
        Today's Check-in
      </h2>
      <p className="mb-5 text-sm text-gray-500">
        Log how you're feeling and get your personalised advice for today.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Primary metric + secondary or sleep */}
        <div className={`grid gap-3 ${hasTwoCols ? "grid-cols-2" : "grid-cols-1"}`}>
          {schema.primaryMetric && (
            <div>
              <label htmlFor="primary-metric" className="mb-1 block text-xs font-medium text-gray-600">
                {schema.primaryMetric.label}
              </label>
              <input
                id="primary-metric"
                type="number"
                step={schema.primaryMetric.step}
                min={schema.primaryMetric.min}
                max={schema.primaryMetric.max}
                value={primaryValue}
                onChange={(e) => setPrimaryValue(e.target.value)}
                placeholder={schema.primaryMetric.placeholder}
                className={inputClass}
              />
            </div>
          )}
          {schema.secondaryField ? (
            <div>
              <label htmlFor="secondary-field" className="mb-1 block text-xs font-medium text-gray-600">
                {schema.secondaryField.label}
              </label>
              <input
                id="secondary-field"
                type="number"
                step={schema.secondaryField.step}
                min={schema.secondaryField.min}
                max={schema.secondaryField.max}
                value={secondaryValue}
                onChange={(e) => setSecondaryValue(e.target.value)}
                placeholder={schema.secondaryField.placeholder}
                className={inputClass}
              />
            </div>
          ) : (
            <div>
              <label htmlFor="sleep-input" className="mb-1 block text-xs font-medium text-gray-600">
                Sleep (hours)
              </label>
              <input
                id="sleep-input"
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={sleep}
                onChange={(e) => setSleep(e.target.value)}
                placeholder="e.g. 7"
                className={inputClass}
              />
            </div>
          )}
        </div>

        {/* Sleep shown separately when secondary field occupies the second column */}
        {schema.secondaryField && (
          <div>
            <label htmlFor="sleep-input" className="mb-1 block text-xs font-medium text-gray-600">
              Sleep (hours)
            </label>
            <input
              id="sleep-input"
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
              placeholder="e.g. 7"
              className={inputClass}
            />
          </div>
        )}

        {/* Energy slider */}
        <div>
          <label htmlFor="energy-slider" className="mb-1 flex justify-between text-xs font-medium text-gray-600">
            <span>Energy level</span>
            <span className="font-semibold text-blue-600">{energy} / 10</span>
          </label>
          <input
            id="energy-slider"
            type="range"
            min={1}
            max={10}
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="mt-0.5 flex justify-between text-xs text-gray-400">
            <span>Exhausted</span>
            <span>Full energy</span>
          </div>
        </div>

        {/* Condition-specific discomfort slider */}
        {schema.nauseaLabel && (
          <div>
            <label htmlFor="nausea-slider" className="mb-1 flex justify-between text-xs font-medium text-gray-600">
              <span>{schema.nauseaLabel}</span>
              <span className="font-semibold text-blue-600">{nausea} / 5</span>
            </label>
            <input
              id="nausea-slider"
              type="range"
              min={1}
              max={5}
              value={nausea}
              onChange={(e) => setNausea(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="mt-0.5 flex justify-between text-xs text-gray-400">
              <span>None</span>
              <span>Severe</span>
            </div>
          </div>
        )}

        {/* Hydration */}
        <div>
          <label htmlFor="hydration-input" className="mb-1 block text-xs font-medium text-gray-600">
            Fluids drunk today (litres)
          </label>
          <input
            id="hydration-input"
            type="number"
            step="0.25"
            min="0"
            max="10"
            value={hydration}
            onChange={(e) => setHydration(e.target.value)}
            placeholder="e.g. 1.5"
            className={inputClass}
          />
        </div>

        {/* Condition-specific symptoms */}
        <fieldset>
          <legend className="mb-2 text-xs font-medium text-gray-600">
            Symptoms today
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {schema.symptoms.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSymptom(s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  symptoms.includes(s)
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Medication */}
        <fieldset>
          <legend className="mb-2 text-xs font-medium text-gray-600">
            Medication taken?
          </legend>
          <div className="flex gap-2">
            {(
              [
                { label: "Yes", value: true },
                { label: "No", value: false },
                { label: "N/A", value: null }
              ] as { label: string; value: boolean | null }[]
            ).map(({ label, value }) => (
              <button
                key={label}
                type="button"
                onClick={() => setMedTaken(value)}
                className={`rounded-xl border px-4 py-1.5 text-xs font-medium transition-colors ${
                  medTaken === value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Notes */}
        <div>
          <label htmlFor="notes-input" className="mb-1 block text-xs font-medium text-gray-600">
            Notes (optional)
          </label>
          <input
            id="notes-input"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="anything else to note…"
            className={inputClass}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Submit &amp; Get Today's Advice →
        </button>
      </form>
    </div>
  );
}
