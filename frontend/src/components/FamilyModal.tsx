import { useEffect, useState } from "react";
import type { FamilyMember } from "../types/account";
import { listFamily, addFamily, deleteFamily } from "../api/client";

export function FamilyModal({ onClose }: { onClose: () => void }) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [age, setAge] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listFamily()
      .then((res) => setMembers(res.members))
      .catch(() => setError("Couldn't load family members."));
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await addFamily({
        name: name.trim(),
        relation: relation.trim() || undefined,
        age: age.trim() || undefined
      });
      setMembers((prev) => [...prev, res.member]);
      setName("");
      setRelation("");
      setAge("");
    } catch {
      setError("Couldn't add member.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
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
              <div className="text-sm">
                <span className="font-medium text-gray-800">{m.name}</span>
                <span className="text-gray-400">
                  {m.relation ? ` · ${m.relation}` : ""}
                  {m.age ? ` · Age ${m.age}` : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={() => remove(m.id)}
                className="text-xs font-medium text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={add} className="mt-4 space-y-2">
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
          {error && <div className="text-xs text-red-600">{error}</div>}
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="w-full rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            Add member
          </button>
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
