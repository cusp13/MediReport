import { UploadDropzone } from "./UploadDropzone";
import { HeroPreview } from "./HeroPreview";
import {
  SparkleIcon,
  UploadIcon,
  ScanIcon,
  FileTextIcon,
  LockIcon,
  ChatIcon,
  CalendarIcon,
  TrendUpIcon,
  ShieldCheckIcon
} from "./icons";

const ANALYSIS_STEPS = [
  {
    icon: UploadIcon,
    title: "Upload your report",
    body: "A PDF, photo, or scan of your lab results — any common format.",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    hoverBorder: "hover:border-blue-200",
    hoverShadow: "hover:shadow-blue-100"
  },
  {
    icon: ScanIcon,
    title: "AI reads every marker",
    body: "It finds each value, compares it to the normal range, and flags what needs attention.",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-500",
    hoverBorder: "hover:border-violet-200",
    hoverShadow: "hover:shadow-violet-100"
  },
  {
    icon: FileTextIcon,
    title: "Get plain explanations",
    body: "What each result means, possible causes, and questions to ask your doctor.",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-500",
    hoverBorder: "hover:border-teal-200",
    hoverShadow: "hover:shadow-teal-100"
  }
];

const RECOVERY_STEPS = [
  {
    icon: CalendarIcon,
    title: "Log your daily health",
    body: "Track food, exercise, sleep, and water intake in one place — every day.",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    hoverBorder: "hover:border-emerald-200",
    hoverShadow: "hover:shadow-emerald-100"
  },
  {
    icon: TrendUpIcon,
    title: "Personalized recovery advice",
    body: "AI generates a tailored plan each morning based on your actual logged data — not generic templates.",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    hoverBorder: "hover:border-orange-200",
    hoverShadow: "hover:shadow-orange-100"
  },
  {
    icon: ShieldCheckIcon,
    title: "Safe, private, and honest",
    body: "Never a diagnosis. Your file is never stored. Every response is safety-checked before you see it.",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    hoverBorder: "hover:border-rose-200",
    hoverShadow: "hover:shadow-rose-100"
  }
];


type Props = {
  onFileSelected: (file: File) => void;
  onTrySample: () => void;
  disabled?: boolean;
};

function FeatureCard({
  step,
  index,
  offset = 0
}: Readonly<{
  step: typeof ANALYSIS_STEPS[0];
  index: number;
  offset?: number;
}>) {
  const Icon = step.icon;
  return (
    <div
      className={`group relative rounded-2xl border border-gray-100 bg-white/80 p-5 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${step.hoverBorder} ${step.hoverShadow}`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${step.iconBg} ${step.iconColor} transition-transform duration-300 group-hover:scale-110`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs font-bold text-gray-200">
          {String(offset + index + 1).padStart(2, "0")}
        </span>
        <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{step.body}</p>
    </div>
  );
}

export function LandingHero({ onFileSelected, onTrySample, disabled }: Readonly<Props>) {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradient orbs — outside space-y so they don't create phantom gaps */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-100/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -top-16 right-0 h-80 w-80 rounded-full bg-teal-100/30 blur-3xl" />

      <div className="space-y-12">

      {/* Hero */}
      <div className="grid items-start gap-8 lg:grid-cols-2">
        {/* Left */}
        <div className="animate-fade-in-up space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600">
            <SparkleIcon className="h-3.5 w-3.5" />
            AI-powered lab report reader
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">
            Understand your{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                lab report
              </span>
            </span>
            {" "}in plain language
          </h1>

          <p className="mx-auto max-w-md text-base leading-relaxed text-gray-500 lg:mx-0">
            Upload your any lab test report and get clear, calm explanations of every marker —
            plus a daily AI recovery plan if you're managing an active condition.
          </p>

          <div className="pt-1">
            <UploadDropzone onFileSelected={onFileSelected} disabled={disabled} />
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400 lg:justify-start">
              <LockIcon className="h-3.5 w-3.5" />
              Analyzed privately · never stored · not a diagnosis
            </div>
          </div>

        </div>

        {/* Right */}
        <div className="animate-fade-in-up mt-14 lg:mt-14" style={{ animationDelay: "160ms" }}>
          <HeroPreview onTry={onTrySample} />
          <p className="mt-3 text-center text-xs text-gray-400">
            No file handy? Try the sample report to see how it works.
          </p>
          {/* Trust signals to fill vertical balance with left column */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { emoji: "🔒", text: "Never stored without consent" },
              { emoji: "🌐", text: "5+ languages" },
              { emoji: "✅", text: "Not a diagnosis" },
            ].map(item => (
              <div key={item.text} className="flex flex-col items-center gap-1 rounded-xl bg-white/70 py-3 text-center shadow-sm border border-gray-100">
                <span className="text-base">{item.emoji}</span>
                <span className="text-xs font-medium text-gray-500">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature cards — Lab Analysis */}
      <div className="animate-fade-in-up space-y-5" style={{ animationDelay: "240ms" }}>
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
            Lab Report Analysis
          </span>
          <h2 className="mt-2 text-xl font-bold text-gray-900">
            From confusing numbers to clear answers
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {ANALYSIS_STEPS.map((step, i) => (
            <FeatureCard key={step.title} step={step} index={i} offset={0} />
          ))}
        </div>
      </div>

      {/* Feature cards — Recovery Tracking */}
      <div className="animate-fade-in-up space-y-5" style={{ animationDelay: "300ms" }}>
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
            Recovery Tracking
          </span>
          <h2 className="mt-2 text-xl font-bold text-gray-900">
            Personalized advice, every single day
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {RECOVERY_STEPS.map((step, i) => (
            <FeatureCard key={step.title} step={step} index={i} offset={3} />
          ))}
        </div>
      </div>

      {/* Chat CTA */}
      <div
        className="animate-fade-in-up"
        style={{ animationDelay: "360ms" }}
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 p-px">
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-center">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500">
              <ChatIcon className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">Still have questions?</span>
              {" "}Chat with AI about your results — ask anything about your markers in plain language.
            </p>
          </div>
        </div>
      </div>

      </div>
    </div>
  );
}
