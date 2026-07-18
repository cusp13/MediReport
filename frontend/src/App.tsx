import { useState } from "react";
import { UploadDropzone } from "./components/UploadDropzone";
import { UrgencySummary } from "./components/UrgencySummary";
import { MarkerCard } from "./components/MarkerCard";
import { NormalResults } from "./components/NormalResults";
import { AnalyzingState } from "./components/AnalyzingState";
import { LandingHero } from "./components/LandingHero";
import { ChatPanel } from "./components/ChatPanel";
import { PatientBadge } from "./components/PatientBadge";
import { LanguageSelector } from "./components/LanguageSelector";
import { TrendView } from "./components/TrendView";
import { DoctorRecommendations } from "./components/DoctorRecommendations";
import { ShareButtons } from "./components/ShareButtons";
import { SaveReportButton } from "./components/SaveReportButton";
import { UserMenu } from "./components/UserMenu";
import { AuthModal } from "./components/AuthModal";
import { FamilyModal } from "./components/FamilyModal";
import { HistoryView } from "./components/HistoryView";
import { DashboardView } from "./components/DashboardView";
import { RecoveryView } from "./components/RecoveryView";
import { DisclaimerBanner } from "./components/DisclaimerBanner";
import {
  SparkleIcon,
  AlertCircleIcon,
  SpinnerIcon,
  TrendUpIcon
} from "./components/icons";
import { analyzeReport, translateReport } from "./api/client";
import { ENGLISH, type Language } from "./lib/languages";
import { SAMPLE_REPORT } from "./data/sampleReport";
import type { Marker, Report } from "./types/report";

function isFlagged(marker: Marker): boolean {
  return marker.status !== "normal";
}

function BrandBar() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 text-white">
        <SparkleIcon className="h-4 w-4" />
      </div>
      <span className="font-semibold tracking-tight text-gray-900">
        MediReport AI
      </span>
    </div>
  );
}

function Results({
  report,
  onNeedAuth,
  onManageFamily
}: {
  report: Report;
  onNeedAuth: () => void;
  onManageFamily: () => void;
}) {
  const [lang, setLang] = useState<Language>(ENGLISH);
  // Translations are cached per language so re-selecting one is instant + free.
  const [cache, setCache] = useState<Record<string, Report>>({});
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  const [tab, setTab] = useState<"report" | "doctors">("report");
  const [doctorsOpened, setDoctorsOpened] = useState(false);

  // Trend comparison against a second, previously-taken report.
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareReport, setCompareReport] = useState<Report | null>(null);
  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  async function handleCompareFile(file: File) {
    setCompareError(null);
    setComparing(true);
    try {
      setCompareReport(await analyzeReport(file));
      setCompareOpen(false);
    } catch (err) {
      setCompareError(
        err instanceof Error ? err.message : "Couldn't read that report."
      );
    } finally {
      setComparing(false);
    }
  }

  async function handleLanguage(next: Language) {
    setTranslateError(null);
    if (next.code === ENGLISH.code || cache[next.code]) {
      setLang(next);
      return;
    }
    setTranslating(true);
    try {
      const translated = await translateReport(report, next.code);
      setCache((prev) => ({ ...prev, [next.code]: translated }));
      setLang(next);
    } catch (err) {
      setTranslateError(
        err instanceof Error ? err.message : "Couldn't translate. Try again."
      );
    } finally {
      setTranslating(false);
    }
  }

  if (report.markers.length === 0) {
    return (
      <div className="animate-fade-in-up rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        No lab markers were found in this report.
      </div>
    );
  }

  const shown =
    lang.code === ENGLISH.code ? report : cache[lang.code] ?? report;
  const flagged = shown.markers.filter(isFlagged);
  const normal = shown.markers.filter((m) => !isFlagged(m));
  const lowCount = shown.markers.filter((m) => m.status === "low").length;
  const highCount = shown.markers.filter((m) => m.status === "high").length;

  return (
    <>
      <div className="animate-fade-in-up mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <SaveReportButton
            report={report}
            onNeedAuth={onNeedAuth}
            onManageFamily={onManageFamily}
          />
          <ShareButtons report={report} />
          {!compareReport && (
            <button
              type="button"
              onClick={() => setCompareOpen((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                compareOpen
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white/80 text-gray-700 hover:border-blue-300 hover:text-blue-700"
              }`}
            >
              <TrendUpIcon className="h-4 w-4" />
              Compare with Previous report
            </button>
          )}
        </div>
        <LanguageSelector
          value={lang}
          onChange={handleLanguage}
          loading={translating}
        />
      </div>

      {translateError && (
        <div className="animate-fade-in mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {translateError}
        </div>
      )}

      {compareOpen && !compareReport && (
        <div className="animate-fade-in-up mb-4 rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-2 text-sm font-medium text-gray-700">
            Upload an earlier report to see what changed
          </div>
          {comparing ? (
            <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
              <SpinnerIcon className="h-4 w-4" />
              Reading your other report…
            </div>
          ) : (
            <UploadDropzone onFileSelected={handleCompareFile} compact />
          )}
          {compareError && (
            <div className="mt-2 text-xs text-red-600">{compareError}</div>
          )}
        </div>
      )}

      {compareReport && (
        <div className="mb-4">
          <TrendView
            current={report}
            previous={compareReport}
            onClear={() => setCompareReport(null)}
          />
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: tabbed report / doctors */}
        <div className="space-y-4">
          <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setTab("report")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === "report"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Your Report
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("doctors");
                setDoctorsOpened(true);
              }}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === "doctors"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Find Doctors
            </button>
          </div>

          {/* Report panel */}
          <div className={tab === "report" ? "space-y-4" : "hidden"}>
            <div className="animate-fade-in-up">
              <UrgencySummary
                overallUrgency={shown.overallUrgency}
                totalCount={shown.markers.length}
                lowCount={lowCount}
                highCount={highCount}
              />
            </div>

            {flagged.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Needs attention
                </div>
                {flagged.map((marker) => (
                  <MarkerCard key={marker.name} marker={marker} />
                ))}
              </div>
            )}

            <NormalResults markers={normal} />
          </div>

          {/* Doctors panel — lazily mounted on first open, then kept alive */}
          {doctorsOpened && (
            <div className={tab === "doctors" ? "" : "hidden"}>
              <DoctorRecommendations report={report} autoStartClinics />
            </div>
          )}
        </div>

        {/* Right: chat as a sticky companion rail (stacks below on mobile) */}
        <div className="lg:sticky lg:top-6">
          <ChatPanel report={shown} language={lang.code} />
        </div>
      </div>

      <div className="animate-fade-in-up mt-6">
        <DisclaimerBanner />
      </div>
    </>
  );
}

export function App() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [authOpen, setAuthOpen] = useState(false);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [view, setView] = useState<"analyze" | "history" | "dashboard" | "recovery">(
    "analyze"
  );

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const result = await analyzeReport(file);
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // Open a saved report from history straight into the results view (no cost).
  function openSavedReport(saved: Report) {
    setReport(saved);
    setError(null);
    setLoading(false);
    setView("analyze");
  }

  // Plays the same narrated-loading beat, then reveals the canned result — so
  // one click shows off the whole experience, with no upload or API cost.
  function handleTrySample() {
    setError(null);
    setReport(null);
    setLoading(true);
    setTimeout(() => {
      setReport(SAMPLE_REPORT);
      setLoading(false);
    }, 2600);
  }

  // First-run landing shows while there's nothing to display yet; once we're
  // loading or have a result, the page collapses to a compact working view.
  const showLanding = !report && !loading;

  // Widen for the two-column results (report + chat rail); stay narrow while
  // loading, on the landing hero, or on the dashboard/history views.
  const isSubView = view === "dashboard" || view === "history" || view === "recovery";
  const containerWidth = isSubView
    ? "max-w-2xl"
    : report
      ? "max-w-6xl"
      : showLanding
        ? "max-w-5xl"
        : "max-w-2xl";

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-blue-50/30 to-white">
      {/* Soft decorative glow — calm, medical-warm depth without imagery. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 right-0 h-72 w-72 rounded-full bg-teal-200/20 blur-3xl"
      />

      <div className="relative px-4 py-8">
        <div
          className={`mx-auto transition-[max-width] duration-500 ${containerWidth}`}
        >
          <header className="mb-8 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setView("analyze")}
              className="text-left"
            >
              <BrandBar />
            </button>
            <div className="flex items-center gap-2">
              {report && view === "analyze" && (
                <PatientBadge report={report} />
              )}
              <UserMenu
                onSignIn={() => setAuthOpen(true)}
                onDashboard={() => setView("dashboard")}
                onHistory={() => setView("history")}
                onFamily={() => setFamilyOpen(true)}
                onRecovery={() => setView("recovery")}
              />
            </div>
          </header>

          {view === "dashboard" ? (
            <DashboardView onBack={() => setView("analyze")} />
          ) : view === "history" ? (
            <HistoryView
              onOpenReport={openSavedReport}
              onBack={() => setView("analyze")}
            />
          ) : view === "recovery" ? (
            <RecoveryView onBack={() => setView("analyze")} />
          ) : showLanding ? (
            <LandingHero
              onFileSelected={handleFile}
              onTrySample={handleTrySample}
              disabled={loading}
            />
          ) : (
            <div className="space-y-6">
              <UploadDropzone
                onFileSelected={handleFile}
                disabled={loading}
                compact
              />

              {loading && <AnalyzingState />}

              {report && (
                <Results
                  report={report}
                  onNeedAuth={() => setAuthOpen(true)}
                  onManageFamily={() => setFamilyOpen(true)}
                />
              )}
            </div>
          )}

          {/* A failed upload keeps the landing view; show the error beneath it. */}
          {view === "analyze" && showLanding && error && (
            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {familyOpen && <FamilyModal onClose={() => setFamilyOpen(false)} />}
    </div>
  );
}
