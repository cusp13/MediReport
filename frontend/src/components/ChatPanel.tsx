import { useRef, useState } from "react";
import type { ChatMessage, Report } from "../types/report";
import { askQuestionStream } from "../api/client";
import { buildSuggestions } from "../lib/suggestedQuestions";
import { ChatIcon, SendIcon, SparkleIcon } from "./icons";

const MAX_QUESTIONS = 5;

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

export function ChatPanel({
  report,
  language
}: {
  report: Report;
  language?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const askedCount = messages.filter((m) => m.role === "user").length;
  const remaining = MAX_QUESTIONS - askedCount;
  const atLimit = remaining <= 0;
  const suggestions = buildSuggestions(report);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    });
  }

  async function send(question: string) {
    const text = question.trim();
    if (!text || busy || atLimit) return;

    setError(null);
    setInput("");
    const history: ChatMessage[] = [
      ...messages,
      { role: "user", content: text }
    ];
    setMessages(history);
    setBusy(true);
    setStreaming("");
    scrollToBottom();

    try {
      let acc = "";
      await askQuestionStream(
        report,
        history,
        (delta) => {
          acc += delta;
          setStreaming(acc);
          scrollToBottom();
        },
        language
      );
      setMessages([...history, { role: "assistant", content: acc }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      // Roll back the unanswered question so the counter stays truthful.
      setMessages(messages);
    } finally {
      setStreaming(null);
      setBusy(false);
      scrollToBottom();
    }
  }

  return (
    <div className="animate-fade-in-up overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 text-white">
            <ChatIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">
              Ask about your report
            </div>
            <div className="text-xs text-gray-400">
              Answers are based on your results above
            </div>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            atLimit ? "bg-gray-100 text-gray-500" : "bg-blue-50 text-blue-600"
          }`}
        >
          {askedCount} / {MAX_QUESTIONS} questions
        </span>
      </div>

      {/* Conversation */}
      {(messages.length > 0 || streaming !== null) && (
        <div
          ref={scrollRef}
          className="max-h-96 space-y-3 overflow-y-auto px-5 py-4"
        >
          {messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {streaming !== null && (
            <div className="flex justify-start">
              <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-gray-100 px-3.5 py-2 text-sm leading-relaxed text-gray-800">
                {streaming === "" ? <TypingDots /> : streaming}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggested questions (before the conversation starts) */}
      {messages.length === 0 && streaming === null && (
        <div className="px-5 py-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-400">
            <SparkleIcon className="h-3.5 w-3.5" />
            Try asking
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mx-5 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 p-3">
        {atLimit ? (
          <p className="px-2 py-1.5 text-center text-xs text-gray-500">
            You've reached the {MAX_QUESTIONS}-question limit for this report —
            analyze another to keep chatting.
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              placeholder="Ask a question about your results…"
              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm outline-none transition-colors focus:border-blue-400 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={busy || input.trim() === ""}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
              aria-label="Send"
            >
              <SendIcon className="h-4 w-4" />
            </button>
          </form>
        )}
        <p className="mt-2 px-2 text-center text-[11px] text-gray-400">
          Informational only — not medical advice. Consult a doctor for
          decisions about your health.
        </p>
      </div>
    </div>
  );
}
