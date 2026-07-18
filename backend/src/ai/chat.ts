import type { Report } from "../schemas/report.js";
import { getClient, MODEL } from "./client.js";
import { buildChatSystemPrompt } from "./chatPrompt.js";

export type ChatMessage = { role: "user" | "assistant"; content: string };

// Returns the OpenAI streaming iterable; the route pipes deltas to the client.
export async function streamAnswer(
  report: Report,
  messages: ChatMessage[],
  language?: string
) {
  return getClient().chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    stream: true,
    messages: [
      { role: "system", content: buildChatSystemPrompt(report, language) },
      ...messages
    ]
  });
}
