import { useEffect, useState } from "react";
import type { FamilyMember } from "../types/account";
import { listFamily, addFamily, updateFamily, deleteFamily } from "../api/client";

type MedicationRow = { id: string; name: string; dose: string; frequency: string };

function emptyMedRow(): MedicationRow {
  return { id: crypto.randomUUID(), name: "", dose: "", frequency: "" };
}

// "Metformin 500mg twice daily, Atorvastatin 10mg at night" -> the string the
// backend stores and feeds straight into the OpenAI prompt.
function serializeMedications(rows: MedicationRow[]): string {
  return rows
    .map((r) => [r.name.trim(), r.dose.trim(), r.frequency.trim()].filter(Boolean).join(" "))
    .filter(Boolean)
    .join(", ");
}

// Best-effort split of a previously free-typed string back into rows for editing.
function parseMedications(text: string): MedicationRow[] {
  const rows = text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({ id: crypto.randomUUID(), name: s, dose: "", frequency: "" }));
  return rows.length > 0 ? rows : [emptyMedRow()];
}

function resetForm() {
  return { name: "", relation: "", age: "", preExistingConditions: "", medicalNotes: "" };
}

export function FamilyModal({ onClose }: { onClose: () => void }) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [age, setAge] = useState("");
  const [preExistingConditions, setPreExistingConditions] = useState("");
  const [medications, setMedications] = useState<MedicationRow[]>([emptyMedRow()]);
  const [medicalNotes, setMedicalNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateMedRow(index: number, field: keyof MedicationRow, value: string) {
    setMedications((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addMedRow() {
    setMedications((prev) => [...prev, emptyMedRow()]);
  }

  function removeMedRow(index: number) {
    setMedications((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : [emptyMedRow()]));
  }

  useEffect(() => {
    listFamily()
      .then((res) => setMembers(res.members))
      .catch(() => setError("Couldn't load family members."));
  }, []);

  function clearForm() {
    const f = resetForm();
    setName(f.name);
    setRelation(f.relation);
    setAge(f.age);
    setPreExistingConditions(f.preExistingConditions);
    setMedications([emptyMedRow()]);
    setMedicalNotes(f.medicalNotes);
  }

  function startEdit(m: FamilyMember) {
    setEditingId(m.id);
    setName(m.name);
    setRelation(m.relation ?? "");
    setAge(m.age ?? "");
    setPreExistingConditions(m.preExistingConditions ?? "");
    setMedications(m.currentMedications ? parseMedications(m.currentMedications) : [emptyMedRow()]);
    setMedicalNotes(m.medicalNotes ?? "");
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    clearForm();
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    const input = {
      name: name.trim(),
      relation: relation.trim() || undefined,
      age: age.trim() || undefined,
      preExistingConditions: preExistingConditions.trim() || undefined,
      currentMedications: serializeMedications(medications) || undefined,
      medicalNotes: medicalNotes.trim() || undefined
    };
    try {
      if (editingId) {
        const res = await updateFamily(editingId, input);
        setMembers((prev) => prev.map((m) => (m.id === editingId ? res.member : m)));
        setEditingId(null);
      } else {
        const res = await addFamily(input);
        setMembers((prev) => [...prev, res.member]);
      }
      clearForm();
    } catch {
      setError(editingId ? "Couldn't save changes." : "Couldn't add member.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    if (editingId === id) cancelEdit();
    await deleteFamily(id).catch(() => undefined);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="animate-fade-in-up w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900">Family members</h2>
        <p className="mt-1 text-sm text-gray-500">
          Add family members to track their reports separately.
        </p>

        <div className="mt-4 space-y-2">
          {members.length === 0 && (
            <p className="text-sm text-gray-400">No family members yet.</p>
          )}
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2"
            >
              <div className="min-w-0 text-sm">
                <div>
                  <span className="font-medium text-gray-800">{m.name}</span>
                  <span className="text-gray-400">
                    {m.relation ? ` · ${m.relation}` : ""}
                    {m.age ? ` · Age ${m.age}` : ""}
                  </span>
                </div>
                {(m.preExistingConditions || m.currentMedications) && (
                  <div className="truncate text-xs text-gray-400">
                    {m.preExistingConditions && `Conditions: ${m.preExistingConditions}`}
                    {m.preExistingConditions && m.currentMedications ? " · " : ""}
                    {m.currentMedications && `Meds: ${m.currentMedications}`}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 gap-3">
                <button
                  type="button"
                  onClick={() => startEdit(m)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  className="text-xs font-medium text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {editingId && (
          <p className="mt-4 text-xs font-medium text-blue-600">Editing {name || "member"}…</p>
        )}
        <form onSubmit={save} className="mt-2 space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
          <div className="flex gap-2">
            <input
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder="Relation (e.g. Mother)"
              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <input
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Age"
              className="w-20 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </div>
          <input
            value={preExistingConditions}
            onChange={(e) => setPreExistingConditions(e.target.value)}
            placeholder="Pre-existing conditions (e.g. diabetes, asthma)"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-gray-500">
              Current medications (optional)
            </div>
            {medications.map((med, i) => (
              <div key={med.id} className="flex gap-2">
                <input
                  value={med.name}
                  onChange={(e) => updateMedRow(i, "name", e.target.value)}
                  placeholder="Medication (e.g. Metformin)"
                  className="min-w-0 flex-[2] rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
                <input
                  value={med.dose}
                  onChange={(e) => updateMedRow(i, "dose", e.target.value)}
                  placeholder="Dose"
                  className="w-20 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
                <input
                  value={med.frequency}
                  onChange={(e) => updateMedRow(i, "frequency", e.target.value)}
                  placeholder="Frequency"
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
                <button
                  type="button"
                  onClick={() => removeMedRow(i)}
                  aria-label="Remove medication"
                  className="shrink-0 rounded-xl border border-gray-200 px-2.5 text-sm text-gray-400 hover:border-red-300 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addMedRow}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              + Add medication
            </button>
          </div>
          <input
            value={medicalNotes}
            onChange={(e) => setMedicalNotes(e.target.value)}
            placeholder="Anything else (allergies, etc.) — optional"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
          {error && <div className="text-xs text-red-600">{error}</div>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {editingId ? "Save changes" : "Add member"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Done
        </button>
      </div>
    </div>
  );
}
