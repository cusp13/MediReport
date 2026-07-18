import { useState } from "react";
import type { Report } from "../types/report";
import { shareOnWhatsApp, shareNative, printSummary } from "../lib/share";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.5 14.4c-.3-.2-1.7-.8-2-.9-.3-.1-.5-.2-.6.2-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.4-1.4-.9-.8-1.5-1.8-1.6-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5s-.6-1.5-.9-2.1c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.2-.3-.2-.6-.4Z" />
      <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8.2 8.2 0 1 1 12 20.2Z" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <circle cx="6" cy="12" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <circle cx="18" cy="18" r="2.2" />
      <path strokeLinecap="round" d="m8 11 8-4M8 13l8 4" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v10m0 0 4-4m-4 4-4-4" />
      <path strokeLinecap="round" d="M5 19h14" />
    </svg>
  );
}

const BTN =
  "flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-700";

export function ShareButtons({ report }: { report: Report }) {
  const [shareLabel, setShareLabel] = useState("Share");

  async function onShare() {
    const result = await shareNative(report);
    if (result === "copied") {
      setShareLabel("Copied!");
      setTimeout(() => setShareLabel("Share"), 1800);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => shareOnWhatsApp(report)}
        className={`${BTN} hover:border-green-300 hover:text-green-700`}
      >
        <WhatsAppIcon className="h-4 w-4 text-green-600" />
        WhatsApp
      </button>
      <button type="button" onClick={onShare} className={BTN}>
        <ShareIcon className="h-4 w-4" />
        {shareLabel}
      </button>
      <button
        type="button"
        onClick={() => printSummary(report)}
        className={BTN}
      >
        <DownloadIcon className="h-4 w-4" />
        PDF
      </button>
    </div>
  );
}
