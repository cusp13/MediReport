import { getClient, MODEL } from "./client.js";

export interface CheckInSchema {
  primaryMetric: {
    label: string;        // UI label, e.g. "Fever (°F)", "Blood Sugar (mg/dL)"
    min: number;
    max: number;
    step: number;
    placeholder: string;
    isTemperature: boolean; // true = convert °F → °C before storing
  } | null;
  secondaryField: {
    label: string;
    min: number;
    max: number;
    step: number;
    placeholder: string;
    notesPrefix: string;  // prepended to notes: "Diastolic BP: 80 mmHg. "
  } | null;
  nauseaLabel: string | null;
  symptoms: string[];
}

const FEVER: CheckInSchema["primaryMetric"] = {
  label: "Fever (°F)", min: 95, max: 108, step: 0.1,
  placeholder: "e.g. 101.3", isTemperature: true
};

// Hardcoded schemas for common conditions — no LLM call, instant load
const BUILT_IN: Record<string, CheckInSchema> = {
  typhoid: {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["headache", "body ache", "chills", "diarrhoea", "loss of appetite", "vomiting", "rash", "fatigue", "abdominal pain", "constipation"]
  },
  dengue: {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["severe headache", "eye pain", "rash", "joint pain", "muscle pain", "bleeding gums", "nausea", "vomiting", "fatigue", "weakness"]
  },
  malaria: {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["chills", "sweating", "headache", "nausea", "vomiting", "body ache", "fatigue", "shivering", "diarrhoea", "weakness"]
  },
  influenza: {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["cough", "sore throat", "runny nose", "body ache", "chills", "fatigue", "headache", "vomiting", "diarrhoea", "loss of appetite"]
  },
  "covid-19": {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["cough", "shortness of breath", "fatigue", "loss of taste/smell", "sore throat", "headache", "body ache", "diarrhoea", "runny nose", "chest pain"]
  },
  pneumonia: {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["cough with phlegm", "chest pain", "shortness of breath", "fatigue", "chills", "sweating", "nausea", "vomiting", "wheezing", "confusion"]
  },
  tuberculosis: {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["persistent cough", "coughing blood", "chest pain", "night sweats", "weight loss", "fatigue", "loss of appetite", "chills", "weakness"]
  },
  chickenpox: {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["itchy rash/blisters", "fatigue", "loss of appetite", "headache", "body ache", "sore throat", "stomach ache"]
  },
  "hepatitis a": {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["jaundice (yellow skin/eyes)", "dark urine", "pale stools", "fatigue", "nausea", "vomiting", "abdominal pain", "loss of appetite", "itching"]
  },
  "hepatitis b": {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["jaundice (yellow skin/eyes)", "dark urine", "pale stools", "fatigue", "nausea", "vomiting", "abdominal pain", "loss of appetite", "joint pain", "itching"]
  },
  "hepatitis c": {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["fatigue", "nausea", "vomiting", "abdominal pain", "joint pain", "jaundice", "dark urine", "loss of appetite", "itching", "muscle aches"]
  },
  cholera: {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["watery diarrhoea", "vomiting", "muscle cramps", "dehydration", "fatigue", "nausea", "rapid heart rate", "dry mouth", "sunken eyes"]
  },
  diabetes: {
    primaryMetric: { label: "Blood Sugar (mg/dL)", min: 40, max: 500, step: 1, placeholder: "e.g. 120", isTemperature: false },
    secondaryField: null,
    nauseaLabel: null,
    symptoms: ["excessive thirst", "frequent urination", "blurred vision", "tingling fingers", "fatigue", "headache", "slow healing wounds", "dizziness"]
  },
  hypertension: {
    primaryMetric: { label: "Systolic BP (mmHg)", min: 70, max: 220, step: 1, placeholder: "e.g. 130", isTemperature: false },
    secondaryField: { label: "Diastolic BP (mmHg)", min: 40, max: 140, step: 1, placeholder: "e.g. 85", notesPrefix: "Diastolic BP: " },
    nauseaLabel: "Headache severity",
    symptoms: ["headache", "dizziness", "blurred vision", "shortness of breath", "chest pain", "palpitations", "nausea", "flushing", "nosebleed", "fatigue"]
  },
  "heart disease": {
    primaryMetric: { label: "Resting Heart Rate (bpm)", min: 30, max: 200, step: 1, placeholder: "e.g. 72", isTemperature: false },
    secondaryField: null,
    nauseaLabel: "Chest discomfort",
    symptoms: ["chest pain", "shortness of breath", "palpitations", "fatigue", "dizziness", "swollen ankles", "nausea", "cold sweat", "jaw/arm pain", "fainting"]
  },
  asthma: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Breathing difficulty",
    symptoms: ["wheezing", "shortness of breath", "chest tightness", "coughing", "night cough", "exercise-induced cough", "fatigue", "mucus production"]
  },
  copd: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Breathing difficulty",
    symptoms: ["shortness of breath", "chronic cough", "wheezing", "chest tightness", "excess mucus", "fatigue", "frequent respiratory infections", "blue lips/fingertips"]
  },
  arthritis: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Pain level",
    symptoms: ["joint pain", "joint stiffness", "swelling", "redness", "reduced range of motion", "fatigue", "morning stiffness", "warmth in joints", "weakness"]
  },
  anemia: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Dizziness",
    symptoms: ["dizziness", "shortness of breath", "cold hands/feet", "pale skin", "rapid heartbeat", "fatigue", "weakness", "headache", "chest pain"]
  },
  hypothyroidism: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: null,
    symptoms: ["fatigue", "weight gain", "cold sensitivity", "constipation", "dry skin", "hair loss", "muscle weakness", "brain fog", "depression", "slow heart rate"]
  },
  hyperthyroidism: {
    primaryMetric: { label: "Resting Heart Rate (bpm)", min: 40, max: 200, step: 1, placeholder: "e.g. 95", isTemperature: false },
    secondaryField: null,
    nauseaLabel: null,
    symptoms: ["rapid heartbeat", "weight loss", "anxiety", "tremors", "sweating", "heat sensitivity", "diarrhoea", "fatigue", "irritability", "sleep problems"]
  },
  migraine: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["throbbing headache", "nausea", "vomiting", "light sensitivity", "sound sensitivity", "visual aura", "dizziness", "neck pain", "fatigue"]
  },
  gastritis: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["stomach pain", "nausea", "vomiting", "bloating", "loss of appetite", "indigestion", "burning sensation", "belching", "dark stools"]
  },
  "acid reflux": {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["heartburn", "regurgitation", "chest pain", "difficulty swallowing", "bloating", "belching", "nausea", "hoarseness", "cough after eating"]
  },
  uti: {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Pain level",
    symptoms: ["painful urination", "frequent urination", "cloudy urine", "blood in urine", "pelvic pain", "lower back pain", "strong urine odour", "fever", "nausea"]
  },
  depression: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: null,
    symptoms: ["persistent sadness", "loss of interest", "fatigue", "sleep changes", "appetite changes", "concentration difficulty", "hopelessness", "irritability", "withdrawal"]
  },
  anxiety: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["excessive worry", "restlessness", "rapid heartbeat", "sweating", "trembling", "shortness of breath", "fatigue", "insomnia", "concentration difficulty", "muscle tension"]
  },

  // ── Infectious / Viral (continued) ────────────────────────────────────
  chikungunya: {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Joint pain",
    symptoms: ["joint pain", "joint swelling", "fever", "rash", "headache", "muscle pain", "fatigue", "nausea", "vomiting", "eye pain"]
  },
  measles: {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["red rash", "cough", "runny nose", "red eyes", "light sensitivity", "high fever", "fatigue", "sore throat", "koplik spots", "loss of appetite"]
  },
  mumps: {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["swollen salivary glands", "fever", "headache", "fatigue", "muscle aches", "loss of appetite", "difficulty chewing", "earache", "jaw pain"]
  },
  shingles: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Pain level",
    symptoms: ["painful rash/blisters", "burning sensation", "itching", "tingling", "skin sensitivity", "headache", "fatigue", "light sensitivity", "fever"]
  },
  "food poisoning": {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["nausea", "vomiting", "diarrhoea", "stomach cramps", "fever", "weakness", "dehydration", "loss of appetite", "headache"]
  },
  sinusitis: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Headache severity",
    symptoms: ["facial pain/pressure", "nasal congestion", "runny nose", "loss of smell", "headache", "cough", "fatigue", "sore throat", "tooth pain", "post-nasal drip"]
  },
  tonsillitis: {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Throat pain",
    symptoms: ["sore throat", "painful swallowing", "swollen tonsils", "fever", "headache", "ear pain", "bad breath", "swollen lymph nodes", "fatigue", "loss of appetite"]
  },
  "lyme disease": {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["bull's eye rash", "fever", "chills", "fatigue", "body ache", "headache", "joint pain", "stiff neck", "brain fog", "swollen lymph nodes"]
  },

  // ── Chronic / Autoimmune ──────────────────────────────────────────────
  "kidney disease": {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["fatigue", "swollen ankles/feet", "shortness of breath", "nausea", "loss of appetite", "frequent urination", "blood in urine", "muscle cramps", "itching", "foamy urine"]
  },
  gout: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Pain level",
    symptoms: ["sudden joint pain", "swelling", "redness", "warmth in joint", "tenderness", "limited range of motion", "fever", "fatigue"]
  },
  fibromyalgia: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Pain level",
    symptoms: ["widespread pain", "fatigue", "sleep problems", "brain fog", "headache", "morning stiffness", "tingling", "anxiety", "depression", "sensitivity to temperature"]
  },
  lupus: {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["butterfly rash", "joint pain", "fatigue", "fever", "hair loss", "sun sensitivity", "chest pain", "dry eyes", "shortness of breath", "swollen lymph nodes"]
  },
  "multiple sclerosis": {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Pain level",
    symptoms: ["fatigue", "numbness/tingling", "weakness", "vision problems", "balance issues", "muscle spasms", "difficulty walking", "bladder problems", "brain fog", "depression"]
  },
  "parkinson's disease": {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: null,
    symptoms: ["tremors", "muscle stiffness", "slow movement", "balance problems", "speech changes", "difficulty swallowing", "fatigue", "sleep problems", "depression", "constipation"]
  },
  epilepsy: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["seizures", "confusion", "staring spells", "loss of consciousness", "muscle jerking", "fatigue after seizure", "anxiety", "headache", "sleep problems"]
  },
  psoriasis: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Itch severity",
    symptoms: ["red patches with scales", "itching", "burning", "dry/cracked skin", "thickened nails", "joint pain", "stiffness", "bleeding from scratching"]
  },
  eczema: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Itch severity",
    symptoms: ["itchy rash", "dry skin", "red/inflamed patches", "cracked skin", "oozing/crusting", "swelling", "sleep disruption", "skin thickening", "burning"]
  },

  // ── Digestive ─────────────────────────────────────────────────────────
  "crohn's disease": {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["abdominal pain", "diarrhoea", "blood in stool", "fatigue", "weight loss", "nausea", "loss of appetite", "mouth sores", "joint pain", "fever"]
  },
  "ulcerative colitis": {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["abdominal pain", "bloody diarrhoea", "urgency to defecate", "fatigue", "weight loss", "fever", "nausea", "rectal bleeding", "cramping", "loss of appetite"]
  },
  ibs: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["abdominal pain", "bloating", "gas", "diarrhoea", "constipation", "mucus in stool", "nausea", "fatigue", "urgency", "incomplete bowel movement"]
  },
  "kidney stones": {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Pain level",
    symptoms: ["severe back/side pain", "blood in urine", "nausea", "vomiting", "fever", "frequent urination", "painful urination", "cloudy urine", "radiating groin pain"]
  },
  gallstones: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Nausea",
    symptoms: ["upper right abdominal pain", "nausea", "vomiting", "fever", "jaundice", "back pain", "shoulder pain", "indigestion", "bloating", "intolerance to fatty foods"]
  },

  // ── Blood & Hormonal ──────────────────────────────────────────────────
  "sickle cell disease": {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Pain level",
    symptoms: ["pain crisis", "fatigue", "shortness of breath", "pale skin", "jaundice", "swollen hands/feet", "frequent infections", "delayed growth", "vision problems", "dizziness"]
  },
  pcos: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: null,
    symptoms: ["irregular periods", "weight gain", "acne", "excess hair growth", "hair thinning", "fatigue", "mood changes", "pelvic pain", "skin darkening", "sleep problems"]
  },

  // ── Mental Health ─────────────────────────────────────────────────────
  ptsd: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: null,
    symptoms: ["flashbacks", "nightmares", "hypervigilance", "anxiety", "avoidance", "emotional numbness", "irritability", "concentration difficulty", "depression", "sleep problems"]
  },
  "bipolar disorder": {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: null,
    symptoms: ["mood swings", "elevated mood/mania", "depressed mood", "reduced sleep need", "racing thoughts", "impulsivity", "irritability", "fatigue", "concentration difficulty", "appetite changes"]
  },
  ocd: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: null,
    symptoms: ["intrusive thoughts", "compulsive behaviors", "anxiety", "distress from rituals", "avoidance", "time loss to rituals", "sleep problems", "concentration difficulty"]
  },
  insomnia: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: null,
    symptoms: ["difficulty falling asleep", "frequent waking", "early waking", "daytime fatigue", "concentration difficulty", "irritability", "anxiety", "headache", "depression", "memory problems"]
  },

  // ── Recovery & Rehab ──────────────────────────────────────────────────
  "post-surgery recovery": {
    primaryMetric: FEVER, secondaryField: null,
    nauseaLabel: "Pain level",
    symptoms: ["incision pain", "swelling", "bruising", "fatigue", "nausea", "loss of appetite", "constipation", "limited mobility", "wound discharge", "breathlessness"]
  },
  "fracture recovery": {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Pain level",
    symptoms: ["pain at fracture site", "swelling", "bruising", "limited mobility", "stiffness", "muscle weakness", "numbness/tingling", "difficulty bearing weight", "fatigue"]
  },
  "back pain": {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Pain level",
    symptoms: ["lower back pain", "muscle spasm", "stiffness", "difficulty standing", "pain with sitting", "radiating leg pain", "numbness/tingling", "weakness", "limited range of motion"]
  },
  sciatica: {
    primaryMetric: null, secondaryField: null,
    nauseaLabel: "Pain level",
    symptoms: ["shooting leg pain", "lower back pain", "numbness/tingling", "weakness in leg", "burning sensation", "pain with sitting", "pain with standing", "difficulty walking"]
  }
};

const SCHEMA_PROMPT = (condition: string) => `You are a medical expert. A patient has been diagnosed with "${condition}".

Design a concise daily health check-in form for them. Return ONLY valid JSON matching this exact structure:
{
  "primaryMetric": {
    "label": "...",
    "min": number,
    "max": number,
    "step": number,
    "placeholder": "...",
    "isTemperature": boolean
  } or null,
  "secondaryField": {
    "label": "...",
    "min": number,
    "max": number,
    "step": number,
    "placeholder": "...",
    "notesPrefix": "..."
  } or null,
  "nauseaLabel": "..." or null,
  "symptoms": ["...", "..."]
}

Rules:
- primaryMetric: the single most important daily numeric measurement for "${condition}" (e.g. blood glucose for diabetes, systolic BP for hypertension, fever for infections, peak flow for asthma). Set isTemperature: true ONLY if it is body temperature in °F. Null if no daily numeric measurement is typical.
- secondaryField: only if a second numeric reading is required (e.g. diastolic BP). Otherwise null.
- nauseaLabel: the most relevant subjective discomfort for this condition on a 1–5 scale (e.g. "Nausea", "Pain level", "Breathlessness", "Headache severity"). Null if not relevant.
- symptoms: exactly 8–12 of the most common symptoms patients report daily for "${condition}". Use plain English, lowercase.`;

function sanitize(raw: unknown): CheckInSchema {
  const r = (raw ?? {}) as Record<string, unknown>;
  const pm = r.primaryMetric as Record<string, unknown> | null;
  const sf = r.secondaryField as Record<string, unknown> | null;
  return {
    primaryMetric: pm && typeof pm === "object" ? {
      label: String(pm.label ?? "Measurement"),
      min: Number(pm.min ?? 0),
      max: Number(pm.max ?? 500),
      step: Number(pm.step ?? 1),
      placeholder: String(pm.placeholder ?? ""),
      isTemperature: Boolean(pm.isTemperature)
    } : null,
    secondaryField: sf && typeof sf === "object" ? {
      label: String(sf.label ?? ""),
      min: Number(sf.min ?? 0),
      max: Number(sf.max ?? 200),
      step: Number(sf.step ?? 1),
      placeholder: String(sf.placeholder ?? ""),
      notesPrefix: String(sf.notesPrefix ?? "")
    } : null,
    nauseaLabel: r.nauseaLabel ? String(r.nauseaLabel) : null,
    symptoms: Array.isArray(r.symptoms) ? (r.symptoms as unknown[]).map(String).slice(0, 12) : []
  };
}

const llmCache = new Map<string, CheckInSchema>();

export async function getCheckInSchema(condition: string): Promise<CheckInSchema> {
  const key = condition.toLowerCase().trim();
  if (BUILT_IN[key]) return BUILT_IN[key];
  if (llmCache.has(key)) return llmCache.get(key)!;

  const response = await getClient().chat.completions.create({
    model: MODEL,
    temperature: 0,
    messages: [{ role: "user", content: SCHEMA_PROMPT(key) }],
    response_format: { type: "json_object" }
  });

  const schema = sanitize(JSON.parse(response.choices[0]?.message.content ?? "{}"));
  llmCache.set(key, schema);
  return schema;
}
