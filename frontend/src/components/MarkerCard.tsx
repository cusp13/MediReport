import type { Marker } from "../types/report";
import { ListIcon, LeafIcon, QuestionIcon } from "./icons";
import { MarkerGauge } from "./MarkerGauge";

const URGENCY_BADGE: Record<Marker["urgency"], string> = {
  green: "bg-green-100 text-green-700",
  yellow: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-600"
};

// Colored left accent so a flagged marker's severity reads at a glance.
const ACCENT: Record<Marker["urgency"], string> = {
  green: "before:bg-green-400",
  yellow: "before:bg-amber-400",
  red: "before:bg-red-400"
};

const STATUS_LABEL: Record<Marker["status"], string> = {
  low: "Low",
  normal: "Normal",
  high: "High"
};

function Section({
  icon,
  title,
  items
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {icon}
        {title}
      </div>
      <ul className="mt-1.5 space-y-1 text-sm text-gray-700">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-gray-300">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarkerCard({ marker }: { marker: Marker }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 pl-6 shadow-sm transition-shadow hover:shadow-md before:absolute before:left-0 before:top-0 before:h-full before:w-1.5 before:content-[''] ${ACCENT[marker.urgency]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">{marker.name}</h3>
          <div className="mt-0.5 text-sm text-gray-500">
            <span className="font-medium text-gray-700">
              {marker.value} {marker.unit}
            </span>
            <span className="mx-1.5 text-gray-300">|</span>
            Reference: {marker.refRange}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${URGENCY_BADGE[marker.urgency]}`}
        >
          {STATUS_LABEL[marker.status]}
        </span>
      </div>

      <MarkerGauge marker={marker} />

      <p className="mt-4 text-sm leading-relaxed text-gray-800">
        {marker.plainExplanation}
      </p>

      <div className="mt-4 space-y-3">
        <Section
          icon={<ListIcon className="h-3.5 w-3.5" />}
          title="May indicate"
          items={marker.mayIndicate}
        />
        <Section
          icon={<LeafIcon className="h-3.5 w-3.5" />}
          title="Lifestyle suggestions"
          items={marker.lifestyleSuggestions}
        />
        <Section
          icon={<QuestionIcon className="h-3.5 w-3.5" />}
          title="Questions for your doctor"
          items={marker.doctorQuestions}
        />
      </div>
    </div>
  );
}
