import { LANGUAGES, type Language } from "../lib/languages";
import { SpinnerIcon } from "./icons";

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9Z" />
    </svg>
  );
}

type Props = {
  value: Language;
  onChange: (lang: Language) => void;
  loading?: boolean;
};

export function LanguageSelector({ value, onChange, loading }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 py-1 pl-3 pr-1 backdrop-blur">
      {loading ? (
        <SpinnerIcon className="h-4 w-4 text-blue-500" />
      ) : (
        <GlobeIcon className="h-4 w-4 text-gray-400" />
      )}
      <select
        value={value.code}
        onChange={(e) => {
          const lang = LANGUAGES.find((l) => l.code === e.target.value);
          if (lang) onChange(lang);
        }}
        disabled={loading}
        aria-label="Language"
        className="cursor-pointer rounded-full bg-transparent py-1 pl-1 pr-2 text-sm font-medium text-gray-700 outline-none disabled:opacity-60"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
