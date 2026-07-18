import { useState } from "react";
import type { Report } from "../types/report";
import type { FamilyMember } from "../types/account";
import { useAuth } from "../auth/AuthContext";
import { listFamily, saveReport } from "../api/client";

type Props = {
  report: Report;
  onNeedAuth: () => void;
  onManageFamily: () => void;
};

export function SaveReportButton({ report, onNeedAuth, onManageFamily }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleClick() {
    if (!user) {
      onNeedAuth();
      return;
    }
    const next = !open;
    setOpen(next);
    if (next) {
      const res = await listFamily().catch(() => ({ members: [] }));
      setMembers(res.members);
    }
  }

  async function save(memberId: string | null) {
    setOpen(false);
    setSaving(true);
    try {
      await saveReport({ report, memberId });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } finally {
      setSaving(false);
    }
  }

  const label = saved ? "Saved ✓" : saving ? "Saving…" : "Save to history";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={saving}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
          saved
            ? "border-green-300 bg-green-50 text-green-700"
            : "border-gray-200 bg-white/80 text-gray-700 hover:border-blue-300 hover:text-blue-700"
        }`}
      >
        {label}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="animate-fade-in absolute left-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Save under
            </div>
            <button
              type="button"
              onClick={() => save(null)}
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              Myself
            </button>
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => save(m.id)}
                className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                {m.name}
                {m.relation ? ` · ${m.relation}` : ""}
              </button>
            ))}
            <div className="border-t border-gray-100" />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onManageFamily();
              }}
              className="block w-full px-3 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              + Add family member
            </button>
          </div>
        </>
      )}
    </div>
  );
}
