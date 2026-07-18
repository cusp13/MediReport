import OpenAI from "openai";

export const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

// Lazily constructed so the server can boot without an API key set (e.g. for
// /health), and shared across the analyze and chat modules.
let openai: OpenAI | undefined;
export function getClient(): OpenAI {
  openai ??= new OpenAI();
  return openai;
}
