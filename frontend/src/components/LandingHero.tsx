import { UploadDropzone } from "./UploadDropzone";
import { HeroPreview } from "./HeroPreview";
import {
  SparkleIcon,
  UploadIcon,
  ScanIcon,
  FileTextIcon,
  LockIcon,
  ChatIcon
} from "./icons";

const STEPS = [
  {
    icon: UploadIcon,
    title: "Upload your report",
    body: "A PDF photo or scan of your lab results — any common format."
  },
  {
    icon: ScanIcon,
    title: "AI reads every marker",
    body: "It finds each value and compares it to the normal range."
  },
  {
    icon: FileTextIcon,
    title: "Get plain explanations",
    body: "What each result means, and what to ask your doctor."
  }
];

type Props = {
  onFileSelected: (file: File) => void;
  onTrySample: () => void;
  disabled?: boolean;
};

export function LandingHero({ onFileSelected, onTrySample, disabled }: Props) {
  return (
    <div className="space-y-12">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        {/* Left: message + upload */}
        <div className="animate-fade-in-up space-y-5 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <SparkleIcon className="h-3.5 w-3.5" />
            AI-powered lab report reader
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">
            Understand your lab report,{" "}
            <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
              in plain language
            </span>
          </h1>
          <p className="mx-auto max-w-md text-base text-gray-600 lg:mx-0">
            Upload your results and get clear, calm explanations of what each
            number means — no medical jargon, no guesswork.
          </p>

          <div className="pt-2">
            <UploadDropzone onFileSelected={onFileSelected} disabled={disabled} />
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400 lg:justify-start">
              <LockIcon className="h-3.5 w-3.5" />
              Analyzed privately · your file is never stored · not a diagnosis
            </div>
          </div>
        </div>

        {/* Right: live, clickable sample preview */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "160ms" }}
        >
          <HeroPreview onTry={onTrySample} />
          <p className="mt-3 text-center text-xs text-gray-400">
            No file handy? Tap the sample to see how it works.
          </p>
        </div>
      </div>

      <div
        className="animate-fade-in-up grid gap-4 sm:grid-cols-3"
        style={{ animationDelay: "260ms" }}
      >
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={step.title}
              className="relative rounded-2xl border border-gray-100 bg-white/70 p-5 backdrop-blur"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs font-bold text-gray-300">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-sm font-semibold text-gray-900">
                  {step.title}
                </h3>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                {step.body}
              </p>
            </div>
          );
        })}
      </div>

      <div
        className="animate-fade-in-up flex items-center justify-center gap-2.5 rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-3.5 text-center"
        style={{ animationDelay: "320ms" }}
      >
        <ChatIcon className="h-5 w-5 shrink-0 text-blue-500" />
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-800">
            Still have questions?
          </span>{" "}
          Chat with AI about your results and get plain-language answers.
        </p>
      </div>
    </div>
  );
}
