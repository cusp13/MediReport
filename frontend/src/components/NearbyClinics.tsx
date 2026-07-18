import { useEffect, useRef, useState } from "react";
import {
  fetchNearbyClinics,
  getCurrentLocation,
  directionsUrl,
  DEFAULT_LOCATION,
  type Clinic
} from "../lib/osm";
import { SpinnerIcon } from "./icons";

type State = "idle" | "loading" | "done" | "error";

// Small bounding box around a point for the OpenStreetMap embed.
function embedSrc(c: Clinic): string {
  const d = 0.004;
  const bbox = `${c.lng - d},${c.lat - d},${c.lng + d},${c.lat + d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${c.lat},${c.lng}`;
}

export function NearbyClinics({ autoStart }: { autoStart?: boolean }) {
  const [state, setState] = useState<State>("idle");
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [fallback, setFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openMapId, setOpenMapId] = useState<string | null>(null);
  const started = useRef(false);

  // Kick off the search automatically when opened via the Doctors tab.
  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      find();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  async function find() {
    setState("loading");
    setError(null);
    setFallback(false);

    let origin = { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng };
    try {
      origin = await getCurrentLocation();
    } catch {
      // Permission denied or unavailable — fall back to a default city.
      setFallback(true);
    }

    try {
      const results = await fetchNearbyClinics(origin);
      setClinics(results);
      setState("done");
      if (results.length === 0) setError("No clinics found nearby.");
    } catch {
      setState("error");
      setError("Couldn't load nearby clinics. Please try again.");
    }
  }

  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={find}
        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50"
      >
        Find clinics near me
      </button>
    );
  }

  if (state === "loading") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
        <SpinnerIcon className="h-4 w-4" />
        Finding clinics near you…
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}{" "}
        <button
          type="button"
          onClick={find}
          className="font-medium underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-400">
        Real clinics from OpenStreetMap
        {fallback ? ` · showing near ${DEFAULT_LOCATION.label} (location off)` : " · near you"}
      </div>
      {error && <div className="text-sm text-gray-500">{error}</div>}
      {clinics.map((c) => {
        const mapOpen = openMapId === c.id;
        return (
          <div
            key={c.id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white"
          >
            <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-gray-900">
                  {c.name}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                  <span className="capitalize">{c.kind}</span>
                  {c.specialty && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="capitalize">{c.specialty}</span>
                    </>
                  )}
                  <span className="text-gray-300">·</span>
                  <span>{c.distanceKm.toFixed(1)} km</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpenMapId(mapOpen ? null : c.id)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    mapOpen
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-700"
                  }`}
                >
                  {mapOpen ? "Hide map" : "Map"}
                </button>
                {c.phone && (
                  <a
                    href={`tel:${c.phone}`}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-700"
                  >
                    Call
                  </a>
                )}
                <a
                  href={directionsUrl(c)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Directions
                </a>
              </div>
            </div>

            {mapOpen && (
              <div className="animate-fade-in border-t border-gray-100">
                <iframe
                  title={`Map of ${c.name}`}
                  src={embedSrc(c)}
                  loading="lazy"
                  className="h-56 w-full border-0"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
