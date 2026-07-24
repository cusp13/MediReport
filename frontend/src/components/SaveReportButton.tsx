import { useEffect, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberError, setMemberError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Close on any click outside the button/dropdown — no forced selection.
  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  async function handleClick() {
    if (!user) {
      onNeedAuth();
      return;
    }
    const next = !open;
    setOpen(next);
    if (next) {
      setLoadingMembers(true);
      setMemberError(false);
      try {
        const res = await listFamily();
        setMembers(res.members);
      } catch {
        setMemberError(true);
      } finally {
        setLoadingMembers(false);
      }
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
    <div ref={containerRef} className="relative">
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
          {loadingMembers && (
            <p className="px-3 py-2 text-xs text-gray-400">Loading family…</p>
          )}
          {memberError && (
            <p className="px-3 py-2 text-xs text-red-500">Couldn't load family members.</p>
          )}
          {!loadingMembers && !memberError && members.map((m) => (
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
      )}
    </div>
  );
}
