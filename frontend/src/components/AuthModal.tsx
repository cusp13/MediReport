import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { putProfile } from "../api/client";
import { SparkleIcon } from "./icons";

const COMMON_CONDITIONS = [
  "Thyroid",
  "Diabetes",
  "Hypertension",
  "High cholesterol",
  "Anemia",
  "PCOS"
];

export function AuthModal({ onClose }: { onClose: () => void }) {
  const { login, signup } = useAuth();
  const [step, setStep] = useState<"auth" | "profile">("auth");
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Health profile step
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [diet, setDiet] = useState("");
  const [activity, setActivity] = useState("");

  async function submitAuth(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        await signup(name, email, password);
        setStep("profile"); // collect health details next
      } else {
        await login(email, password);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function submitProfile() {
    setBusy(true);
    try {
      await putProfile({
        age: age || undefined,
        sex: sex || undefined,
        conditions,
        dietPreference: diet || undefined,
        activityLevel: activity || undefined
      });
    } catch {
      // non-blocking — the account is already created
    } finally {
      setBusy(false);
      onClose();
    }
  }

  function toggleCondition(c: string) {
    setConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  const selectClass =
    "w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="animate-fade-in-up w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 text-white">
            <SparkleIcon className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {step === "profile"
              ? "A few health details"
              : mode === "signup"
                ? "Create your account"
                : "Welcome back"}
          </h2>
        </div>

        {step === "auth" ? (
          <>
            <p className="mb-4 text-sm text-gray-500">
              Save reports, track your health, and get a personal dashboard.
            </p>
            <form onSubmit={submitAuth} className="space-y-3">
              {mode === "signup" && (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className={selectClass}
                />
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className={selectClass}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 characters)"
                required
                minLength={6}
                className={selectClass}
              />
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {busy
                  ? "Please wait…"
                  : mode === "signup"
                    ? "Create account"
                    : "Log in"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signup" ? "login" : "signup");
                setError(null);
              }}
              className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700"
            >
              {mode === "signup"
                ? "Already have an account? Log in"
                : "New here? Create an account"}
            </button>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500">
              This personalizes your dashboard. You can skip and add it later.
            </p>
            <div className="space-y-3">
              <div>
                <div className="mb-1.5 text-xs font-medium text-gray-500">
                  Health conditions
                </div>
                <div className="flex flex-wrap gap-2">
                  {COMMON_CONDITIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCondition(c)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        conditions.includes(c)
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-blue-300"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Age"
                  className={`${selectClass} w-24`}
                />
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Sex</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>

              <select
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
                className={selectClass}
              >
                <option value="">Diet preference</option>
                <option>Vegetarian</option>
                <option>Non-vegetarian</option>
                <option>Vegan</option>
                <option>Eggetarian</option>
              </select>

              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className={selectClass}
              >
                <option value="">Activity level</option>
                <option>Sedentary</option>
                <option>Light</option>
                <option>Moderate</option>
                <option>Active</option>
              </select>

              <button
                type="button"
                onClick={submitProfile}
                disabled={busy}
                className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Finish"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
              >
                Skip for now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
