// Supported languages for translation + voice read-aloud. `speechLang` is the
// BCP-47 tag the browser's speech engine uses.
export type Language = {
  code: string; // sent to the backend translate/chat API (the name it translates into)
  label: string; // shown in the selector (native script)
  speechLang: string; // BCP-47 for speechSynthesis
};

export const ENGLISH: Language = {
  code: "English",
  label: "English",
  speechLang: "en-IN"
};

export const LANGUAGES: Language[] = [
  ENGLISH,
  { code: "Hindi", label: "हिन्दी", speechLang: "hi-IN" },
  { code: "Tamil", label: "தமிழ்", speechLang: "ta-IN" },
  { code: "Telugu", label: "తెలుగు", speechLang: "te-IN" },
  { code: "Bengali", label: "বাংলা", speechLang: "bn-IN" },
  { code: "Marathi", label: "मराठी", speechLang: "mr-IN" }
];
