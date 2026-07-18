import { useState } from "react";
import { addCondition } from "../api/client";
import type { ConditionLog } from "../types/account";

const CONDITION_GROUPS: { group: string; conditions: { value: string; label: string }[] }[] = [
  {
    group: "Infectious & Viral",
    conditions: [
      { value: "typhoid", label: "Typhoid" },
      { value: "dengue", label: "Dengue" },
      { value: "malaria", label: "Malaria" },
      { value: "chikungunya", label: "Chikungunya" },
      { value: "covid-19", label: "COVID-19" },
      { value: "influenza", label: "Influenza (Flu)" },
      { value: "pneumonia", label: "Pneumonia" },
      { value: "tuberculosis", label: "Tuberculosis (TB)" },
      { value: "hepatitis a", label: "Hepatitis A" },
      { value: "hepatitis b", label: "Hepatitis B" },
      { value: "hepatitis c", label: "Hepatitis C" },
      { value: "chickenpox", label: "Chickenpox" },
      { value: "measles", label: "Measles" },
      { value: "mumps", label: "Mumps" },
      { value: "shingles", label: "Shingles (Herpes Zoster)" },
      { value: "cholera", label: "Cholera" },
      { value: "food poisoning", label: "Food Poisoning" },
      { value: "lyme disease", label: "Lyme Disease" },
      { value: "uti", label: "UTI (Urinary Tract Infection)" },
      { value: "sinusitis", label: "Sinusitis" },
      { value: "tonsillitis", label: "Tonsillitis" }
    ]
  },
  {
    group: "Chronic & Lifestyle",
    conditions: [
      { value: "diabetes", label: "Diabetes" },
      { value: "hypertension", label: "Hypertension (High Blood Pressure)" },
      { value: "heart disease", label: "Heart Disease" },
      { value: "asthma", label: "Asthma" },
      { value: "copd", label: "COPD" },
      { value: "arthritis", label: "Arthritis" },
      { value: "gout", label: "Gout" },
      { value: "hypothyroidism", label: "Hypothyroidism" },
      { value: "hyperthyroidism", label: "Hyperthyroidism" },
      { value: "kidney disease", label: "Kidney Disease (CKD)" },
      { value: "epilepsy", label: "Epilepsy" }
    ]
  },
  {
    group: "Autoimmune & Inflammatory",
    conditions: [
      { value: "lupus", label: "Lupus (SLE)" },
      { value: "fibromyalgia", label: "Fibromyalgia" },
      { value: "multiple sclerosis", label: "Multiple Sclerosis" },
      { value: "psoriasis", label: "Psoriasis" },
      { value: "eczema", label: "Eczema / Atopic Dermatitis" }
    ]
  },
  {
    group: "Digestive & Gut",
    conditions: [
      { value: "gastritis", label: "Gastritis" },
      { value: "acid reflux", label: "Acid Reflux (GERD)" },
      { value: "crohn's disease", label: "Crohn's Disease" },
      { value: "ulcerative colitis", label: "Ulcerative Colitis" },
      { value: "ibs", label: "IBS (Irritable Bowel Syndrome)" },
      { value: "gallstones", label: "Gallstones" },
      { value: "kidney stones", label: "Kidney Stones" }
    ]
  },
  {
    group: "Mental Health",
    conditions: [
      { value: "depression", label: "Depression" },
      { value: "anxiety", label: "Anxiety" },
      { value: "ptsd", label: "PTSD" },
      { value: "bipolar disorder", label: "Bipolar Disorder" },
      { value: "ocd", label: "OCD" },
      { value: "insomnia", label: "Insomnia" }
    ]
  },
  {
    group: "Blood, Hormonal & Neurological",
    conditions: [
      { value: "anemia", label: "Anemia" },
      { value: "sickle cell disease", label: "Sickle Cell Disease" },
      { value: "pcos", label: "PCOS" },
      { value: "parkinson's disease", label: "Parkinson's Disease" },
      { value: "migraine", label: "Migraine" }
    ]
  },
  {
    group: "Recovery & Rehabilitation",
    conditions: [
      { value: "post-surgery recovery", label: "Post-Surgery Recovery" },
      { value: "fracture recovery", label: "Fracture Recovery" },
      { value: "back pain", label: "Back Pain" },
      { value: "sciatica", label: "Sciatica" }
    ]
  },
  {
    group: "Other",
    conditions: [
      { value: "other", label: "Other (specify below)" }
    ]
  }
];

export function ConditionSetup({
  onCreated
}: Readonly<{
  onCreated: (condition: ConditionLog) => void;
}>) {
  const [name, setName] = useState("typhoid");
  const [customName, setCustomName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const conditionName = name === "other" ? customName.trim() : name;
    if (!conditionName) {
      setError("Please enter a condition name.");
      return;
    }
    setSaving(true);
    try {
      const { condition } = await addCondition({
        name: conditionName,
        stage: "acute",
        notes: notes.trim() || undefined
      });
      onCreated(condition);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-blue-400";

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-gray-900">
        Start Recovery Tracking
      </h2>
      <p className="mb-5 text-sm text-gray-500">
        Tell us your diagnosis and we'll build a personalised daily check-in
        and recovery plan using AI.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="condition-select" className="mb-1 block text-xs font-medium text-gray-600">
            Condition
          </label>
          <select
            id="condition-select"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          >
            {CONDITION_GROUPS.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.conditions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {name === "other" && (
          <div>
            <label htmlFor="custom-condition" className="mb-1 block text-xs font-medium text-gray-600">
              Condition name
            </label>
            <input
              id="custom-condition"
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. sciatica, kidney stones…"
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label htmlFor="condition-notes" className="mb-1 block text-xs font-medium text-gray-600">
            Notes (optional)
          </label>
          <input
            id="condition-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. started antibiotics on day 1"
            className={inputClass}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Begin Recovery Tracking →"}
        </button>
      </form>
    </div>
  );
}
