import type { ChatMessage, Report } from "../types/report";
import type {
  User,
  FamilyMember,
  SavedReport,
  HealthProfile,
  FoodLog,
  ExerciseLog,
  DashboardData,
  ConditionLog,
  DailyHealthLog,
  DailyAdvice
} from "../types/account";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:4000";

export type AnalyzeError = { error: string };

// --- auth token (set by AuthContext; attached to authed requests) ---
let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}
function authHeaders(json = true): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  if (authToken) h["Authorization"] = `Bearer ${authToken}`;
  return h;
}

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as AnalyzeError).error ?? "Something went wrong.");
  }
  return body as T;
}

export async function analyzeReport(file: File): Promise<Report> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    body: formData
  });

  const body = await res.json();

  if (!res.ok) {
    const message = (body as AnalyzeError).error ?? "Analysis failed.";
    throw new Error(message);
  }

  return body as Report;
}

export async function translateReport(
  report: Report,
  language: string
): Promise<Report> {
  const res = await fetch(`${API_BASE}/api/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ report, language })
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error((body as AnalyzeError).error ?? "Translation failed.");
  }
  return body as Report;
}

// Streams the assistant's answer, invoking onToken for each chunk as it arrives.
// Resolves with the full text. Throws with the server's message on non-OK.
export async function askQuestionStream(
  report: Report,
  messages: ChatMessage[],
  onToken: (delta: string) => void,
  language?: string
): Promise<string> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ report, messages, language })
  });

  if (!res.ok || !res.body) {
    let message = "The assistant is unavailable. Please try again.";
    try {
      const body = (await res.json()) as AnalyzeError;
      if (body.error) message = body.error;
    } catch {
      // non-JSON error body — keep the default message
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const delta = decoder.decode(value, { stream: true });
    if (delta) {
      full += delta;
      onToken(delta);
    }
  }
  return full;
}

// --- Auth ---
export async function signup(
  name: string,
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name, email, password })
  });
  return parse(res);
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, password })
  });
  return parse(res);
}

export async function fetchMe(): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: authHeaders(false)
  });
  return parse(res);
}

// --- Family ---
export async function listFamily(): Promise<{ members: FamilyMember[] }> {
  const res = await fetch(`${API_BASE}/api/family`, {
    headers: authHeaders(false)
  });
  return parse(res);
}

export async function addFamily(input: {
  name: string;
  relation?: string;
  age?: string;
  preExistingConditions?: string;
  currentMedications?: string;
  medicalNotes?: string;
}): Promise<{ member: FamilyMember }> {
  const res = await fetch(`${API_BASE}/api/family`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input)
  });
  return parse(res);
}

export async function updateFamily(
  id: string,
  input: {
    name?: string;
    relation?: string;
    age?: string;
    preExistingConditions?: string;
    currentMedications?: string;
    medicalNotes?: string;
  }
): Promise<{ member: FamilyMember }> {
  const res = await fetch(`${API_BASE}/api/family/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input)
  });
  return parse(res);
}

export async function deleteFamily(id: string): Promise<void> {
  await fetch(`${API_BASE}/api/family/${id}`, {
    method: "DELETE",
    headers: authHeaders(false)
  });
}

// --- Saved reports ---
export async function listReports(
  memberId?: string
): Promise<{ reports: SavedReport[] }> {
  const q = memberId ? `?memberId=${encodeURIComponent(memberId)}` : "";
  const res = await fetch(`${API_BASE}/api/reports${q}`, {
    headers: authHeaders(false)
  });
  return parse(res);
}

export async function saveReport(input: {
  report: Report;
  memberId?: string | null;
  title?: string;
}): Promise<{ report: SavedReport }> {
  const res = await fetch(`${API_BASE}/api/reports`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input)
  });
  return parse(res);
}

export async function deleteReport(id: string): Promise<void> {
  await fetch(`${API_BASE}/api/reports/${id}`, {
    method: "DELETE",
    headers: authHeaders(false)
  });
}

// --- Referrals (anonymous-friendly) ---
export async function recordReferral(input: {
  partnerId: string;
  partnerName: string;
  specialty?: string;
}): Promise<void> {
  await fetch(`${API_BASE}/api/referrals`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input)
  }).catch(() => {
    // best-effort — a failed referral log shouldn't disrupt the user.
  });
}

// --- Health profile ---
export async function getProfile(): Promise<{ profile: HealthProfile | null }> {
  const res = await fetch(`${API_BASE}/api/profile`, {
    headers: authHeaders(false)
  });
  return parse(res);
}

export async function putProfile(
  profile: HealthProfile
): Promise<{ profile: HealthProfile }> {
  const res = await fetch(`${API_BASE}/api/profile`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(profile)
  });
  return parse(res);
}

// --- Logs ---
export async function addFoodLog(input: {
  items: string[];
  notes?: string;
  memberId?: string | null;
}): Promise<{ log: FoodLog }> {
  const res = await fetch(`${API_BASE}/api/logs/food`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input)
  });
  return parse(res);
}

export async function addExerciseLog(input: {
  type: string;
  durationMin?: number;
  steps?: number;
  memberId?: string | null;
}): Promise<{ log: ExerciseLog }> {
  const res = await fetch(`${API_BASE}/api/logs/exercise`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input)
  });
  return parse(res);
}

// --- Dashboard ---
export async function getDashboard(memberId?: string | null): Promise<DashboardData> {
  const q = memberId ? `?memberId=${encodeURIComponent(memberId)}` : "";
  const res = await fetch(`${API_BASE}/api/dashboard${q}`, {
    headers: authHeaders(false)
  });
  return parse(res);
}

// --- Health Recovery Monitor ---

export async function listConditions(
  memberId?: string | null
): Promise<{ conditions: ConditionLog[] }> {
  const q = memberId ? `?memberId=${encodeURIComponent(memberId)}` : "";
  const res = await fetch(`${API_BASE}/api/conditions${q}`, {
    headers: authHeaders(false)
  });
  return parse(res);
}

export async function addCondition(input: {
  name: string;
  startDate?: string;
  stage?: "acute" | "recovery" | "resolved";
  notes?: string;
  memberId?: string | null;
}): Promise<{ condition: ConditionLog }> {
  const res = await fetch(`${API_BASE}/api/conditions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input)
  });
  return parse(res);
}

export async function updateCondition(
  id: string,
  input: { stage?: "acute" | "recovery" | "resolved"; endDate?: string; notes?: string }
): Promise<{ condition: ConditionLog }> {
  const res = await fetch(`${API_BASE}/api/conditions/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input)
  });
  return parse(res);
}

export async function fetchConditionSchema(conditionName: string): Promise<{
  schema: {
    primaryMetric: { label: string; min: number; max: number; step: number; placeholder: string; isTemperature: boolean } | null;
    secondaryField: { label: string; min: number; max: number; step: number; placeholder: string; notesPrefix: string } | null;
    nauseaLabel: string | null;
    symptoms: string[];
  }
}> {
  const res = await fetch(
    `${API_BASE}/api/conditions/form-schema?name=${encodeURIComponent(conditionName)}`,
    { headers: authHeaders(false) }
  );
  return parse(res);
}

export async function addHealthLog(input: {
  conditionId: string;
  date?: string;
  fever?: number;
  primaryMetricLogLabel?: string;
  energyLevel?: number;
  nauseaLevel?: number;
  nauseaLogLabel?: string;
  sleepHours?: number;
  hydrationLitres?: number;
  symptoms?: string[];
  medicationTaken?: boolean;
  notes?: string;
}): Promise<{ log: DailyHealthLog }> {
  const res = await fetch(`${API_BASE}/api/health-logs`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input)
  });
  return parse(res);
}

export async function listHealthLogs(
  conditionId: string,
  limit = 14
): Promise<{ logs: DailyHealthLog[] }> {
  const res = await fetch(
    `${API_BASE}/api/health-logs?conditionId=${encodeURIComponent(conditionId)}&limit=${limit}`,
    { headers: authHeaders(false) }
  );
  return parse(res);
}

export async function getTodayAdvice(
  conditionId: string
): Promise<{ advice: DailyAdvice }> {
  const res = await fetch(
    `${API_BASE}/api/advice/today?conditionId=${encodeURIComponent(conditionId)}`,
    { headers: authHeaders(false) }
  );
  return parse(res);
}

export interface DailyGoals {
  reportBased: boolean;
  reportDate?: string;
  waterTargetL: number;
  stepsTarget: number;
  exerciseMinutes: number;
  exerciseType: string;
  foodsToEat: string[];
  foodsToAvoid: string[];
  sleepHours: number;
  tips: string[];
}

export interface TodayStats {
  waterLitres: number | null;
  sleepHours: number | null;
  mood: number | null;
  steps: number;
  exerciseMinutes: number;
}

export async function getDailyGoals(
  memberId?: string | null
): Promise<{ goals: DailyGoals; today: TodayStats }> {
  const q = memberId ? `?memberId=${encodeURIComponent(memberId)}` : "";
  const res = await fetch(`${API_BASE}/api/daily-goals${q}`, { headers: authHeaders(false) });
  return parse(res);
}

export async function logDailyVitals(input: {
  waterLitres?: number;
  sleepHours?: number;
  mood?: number;
  memberId?: string | null;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/api/daily-vitals`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input)
  });
  await parse(res);
}
