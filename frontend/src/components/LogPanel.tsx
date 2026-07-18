import { useState } from "react";
import { addFoodLog, addExerciseLog } from "../api/client";

export function LogPanel({ onLogged }: Readonly<{ onLogged: () => void }>) {
  const [food, setFood] = useState("");
  const [exType, setExType] = useState("");
  const [exMin, setExMin] = useState("");
  const [exSteps, setExSteps] = useState("");
  const [savedFood, setSavedFood] = useState(false);
  const [savedEx, setSavedEx] = useState(false);

  async function logFood(e: React.FormEvent) {
    e.preventDefault();
    const items = food
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length === 0) return;
    await addFoodLog({ items });
    setFood("");
    setSavedFood(true);
    setTimeout(() => setSavedFood(false), 1800);
    onLogged();
  }

  async function logExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!exMin && !exSteps) return;
    await addExerciseLog({
      type: exType.trim() || "General",
      durationMin: exMin ? Number(exMin) : undefined,
      steps: exSteps ? Number(exSteps) : undefined
    });
    setExType("");
    setExMin("");
    setExSteps("");
    setSavedEx(true);
    setTimeout(() => setSavedEx(false), 1800);
    onLogged();
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-blue-400";
  const btnClass =
    "shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <form
        onSubmit={logFood}
        className="rounded-2xl border border-gray-200 bg-white p-4"
      >
        <div className="mb-2 text-sm font-semibold text-gray-900">
          🍽️ Log today's food
        </div>
        <div className="flex gap-2">
          <input
            value={food}
            onChange={(e) => setFood(e.target.value)}
            placeholder="e.g. 2 roti, dal, salad"
            className={inputClass}
          />
          <button type="submit" disabled={!food.trim()} className={btnClass}>
            {savedFood ? "✓" : "Add"}
          </button>
        </div>
      </form>

      <form
        onSubmit={logExercise}
        className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2"
      >
        <div className="text-sm font-semibold text-gray-900">🏃 Log exercise</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="ex-min" className="mb-1 block text-xs font-medium text-gray-500">Duration (min) *</label>
            <input
              id="ex-min"
              value={exMin}
              onChange={(e) => setExMin(e.target.value)}
              type="number"
              min="0"
              placeholder="e.g. 30"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ex-type" className="mb-1 block text-xs font-medium text-gray-500">Activity (optional)</label>
            <input
              id="ex-type"
              value={exType}
              onChange={(e) => setExType(e.target.value)}
              placeholder="e.g. Walking"
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="ex-steps" className="mb-1 block text-xs font-medium text-gray-500">Steps (optional)</label>
            <input
              id="ex-steps"
              value={exSteps}
              onChange={(e) => setExSteps(e.target.value)}
              type="number"
              min="0"
              placeholder="e.g. 5000"
              className={inputClass}
            />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={!exMin && !exSteps} className={btnClass}>
              {savedEx ? "✓" : "Add"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
