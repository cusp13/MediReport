import { useEffect, useState } from "react";
import { listConditions, listHealthLogs, getTodayAdvice, updateCondition } from "../api/client";
import type { ConditionLog, DailyHealthLog, DailyAdvice } from "../types/account";
import { ConditionSetup } from "./ConditionSetup";
import { DailyCheckIn } from "./DailyCheckIn";
import { AdviceCard } from "./AdviceCard";
import { RecoveryChart } from "./RecoveryChart";

const STAGE_LABELS: Record<ConditionLog["stage"], string> = {
  acute: "Acute",
  recovery: "Recovery",
  resolved: "Resolved"
};

const STAGE_COLORS: Record<ConditionLog["stage"], string> = {
  acute: "bg-red-50 text-red-700 border-red-200",
  recovery: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-green-50 text-green-700 border-green-200"
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RecoveryView({ onBack }: { onBack: () => void }) {
  const [conditions, setConditions] = useState<ConditionLog[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [logs, setLogs] = useState<DailyHealthLog[]>([]);
  const [advice, setAdvice] = useState<DailyAdvice | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);

  const activeCondition = conditions.find((c) => c.id === activeId) ?? null;
  const todayLogged = logs.some((l) => l.date === today());

  // Load conditions on mount
  useEffect(() => {
    listConditions()
      .then(({ conditions: list }) => {
        setConditions(list);
        if (list.length > 0) setActiveId(list[0].id);
      })
      .catch(() => undefined)
      .finally(() => setLoadingInit(false));
  }, []);

  // Load logs + cached advice when active condition changes
  useEffect(() => {
    if (!activeId) return;
    setAdvice(null);
    setLogs([]);

    listHealthLogs(activeId).then(({ logs: l }) => setLogs(l)).catch(() => undefined);

    // Check for cached advice for today
    setLoadingAdvice(true);
    getTodayAdvice(activeId)
      .then(({ advice: a }) => setAdvice(a))
      .catch(() => undefined)
      .finally(() => setLoadingAdvice(false));
  }, [activeId]);

  function handleConditionCreated(condition: ConditionLog) {
    setConditions((prev) => [condition, ...prev]);
    setActiveId(condition.id);
  }

  function handleAdviceReady(a: DailyAdvice) {
    setAdvice(a);
    // Refresh logs after check-in
    if (activeId) {
      listHealthLogs(activeId).then(({ logs: l }) => setLogs(l)).catch(() => undefined);
    }
  }

  async function handleMarkResolved() {
    if (!activeId) return;
    try {
      const { condition } = await updateCondition(activeId, {
        stage: "resolved",
        endDate: today()
      });
      setConditions((prev) => prev.map((c) => (c.id === activeId ? condition : c)));
    } catch {
      // ignore
    }
  }

  if (loadingInit) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        ← Back
      </button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Recovery Monitor
        </h1>
        <p className="text-sm text-gray-500">
          AI-powered daily guidance using your health history
        </p>
      </div>

      {/* No conditions yet — show setup */}
      {conditions.length === 0 && (
        <ConditionSetup onCreated={handleConditionCreated} />
      )}

      {/* Conditions exist — show selector + main content */}
      {conditions.length > 0 && (
        <>
          {/* Condition selector */}
          <div className="flex flex-wrap items-center gap-2">
            {conditions.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                className={`rounded-full border px-3.5 py-1 text-sm font-medium transition-colors ${
                  c.id === activeId
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {c.name.charAt(0).toUpperCase() + c.name.slice(1)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setConditions([])}
              className="rounded-full border border-dashed border-gray-300 px-3.5 py-1 text-sm text-gray-400 hover:border-gray-400"
            >
              + Add condition
            </button>
          </div>

          {/* Active condition header */}
          {activeCondition && (
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-800 capitalize">
                  {activeCondition.name}
                </p>
                <p className="text-xs text-gray-400">
                  Since {activeCondition.startDate}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STAGE_COLORS[activeCondition.stage]}`}
                >
                  {STAGE_LABELS[activeCondition.stage]}
                </span>
                {activeCondition.stage !== "resolved" && (
                  <button
                    type="button"
                    onClick={handleMarkResolved}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Mark resolved
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Recovery chart if we have logs */}
          {logs.length >= 2 && <RecoveryChart logs={logs} />}

          {/* Today's advice (cached) or loading */}
          {loadingAdvice && (
            <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-500 shadow-sm">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
              Checking for today's advice…
            </div>
          )}

          {advice && !loadingAdvice && <AdviceCard advice={advice} />}

          {/* Check-in form (if no advice yet today) */}
          {!advice && !loadingAdvice && activeId && activeCondition && (
            <DailyCheckIn
              conditionId={activeId}
              conditionName={activeCondition.name}
              onAdviceReady={handleAdviceReady}
            />
          )}

          {/* Already have advice today — allow re-check-in if user wants to update */}
          {advice && todayLogged && (
            <p className="text-center text-xs text-gray-400">
              You've already checked in today. Come back tomorrow for updated advice.
            </p>
          )}
        </>
      )}
    </div>
  );
}
