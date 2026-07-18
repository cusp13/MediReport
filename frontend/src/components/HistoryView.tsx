import { useEffect, useState } from "react";
import type { Report } from "../types/report";
import type { FamilyMember, SavedReport } from "../types/account";
import { listReports, listFamily, deleteReport } from "../api/client";

const STATUS_STYLE: Record<Report["overallUrgency"], string> = {
  green: "bg-green-100 text-green-700",
  yellow: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-600"
};

export function HistoryView({
  onOpenReport,
  onBack
}: {
  onOpenReport: (report: Report) => void;
  onBack: () => void;
}) {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listReports(), listFamily()])
      .then(([r, f]) => {
        setReports(r.reports);
        setMembers(f.members);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  function memberName(memberId: string | null): string {
    if (!memberId) return "Myself";
    return members.find((m) => m.id === memberId)?.name ?? "Family member";
  }

  async function remove(id: string) {
    setReports((prev) => prev.filter((r) => r.id !== id));
    await deleteReport(id).catch(() => undefined);
  }

  const shown =
    filter === "all"
      ? reports
      : reports.filter((r) => (r.memberId ?? "self") === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back
        </button>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none"
        >
          <option value="all">Everyone</option>
          <option value="self">Myself</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        Report history
      </h1>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No saved reports yet. Analyze a report and tap “Save to history”.
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map((r) => {
            const flagged = r.report.markers.filter(
              (m) => m.status !== "normal"
            ).length;
            return (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {memberName(r.memberId)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[r.report.overallUrgency]}`}
                    >
                      {flagged > 0 ? `${flagged} flagged` : "All clear"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleString()} ·{" "}
                    {r.report.markers.length} markers
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenReport(r.report)}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:border-red-300 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
