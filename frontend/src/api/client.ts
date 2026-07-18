import type { ChatMessage, Report } from "../types/report";
import type {
  User,
  FamilyMember,
  SavedReport,
  HealthProfile,
  FoodLog,
  ExerciseLog,
  DashboardData
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
}): Promise<{ member: FamilyMember }> {
  const res = await fetch(`${API_BASE}/api/family`, {
    method: "POST",
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
}): Promise<{ log: ExerciseLog }> {
  const res = await fetch(`${API_BASE}/api/logs/exercise`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input)
  });
  return parse(res);
}

// --- Dashboard ---
export async function getDashboard(): Promise<DashboardData> {
  const res = await fetch(`${API_BASE}/api/dashboard`, {
    headers: authHeaders(false)
  });
  return parse(res);
}
