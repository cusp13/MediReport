import { useState } from "react";
import type { Marker } from "../types/report";
import { CheckCircleIcon } from "./icons";

// Normal results are reassurance, not action — kept quiet and collapsed so the
// flagged markers carry the visual weight.
export function NormalResults({ markers }: { markers: Marker[] }) {
  const [open, setOpen] = useState(false);
  if (markers.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50"
      >
        <span className="flex items-center gap-2.5">
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium text-gray-700">
            {markers.length} result{markers.length > 1 ? "s" : ""} in the
            normal range
          </span>
        </span>
        <span
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="animate-fade-in divide-y divide-gray-100 border-t border-gray-100">
          {markers.map((marker) => (
            <div
              key={marker.name}
              className="flex items-center justify-between px-5 py-3"
            >
              <span className="text-sm text-gray-700">{marker.name}</span>
              <span className="text-sm text-gray-400">
                {marker.value} {marker.unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
