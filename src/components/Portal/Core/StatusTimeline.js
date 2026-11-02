import { Check } from "lucide-react";
import { PROJECT_STEPS } from "@/lib/portal/constants";
import { formatShortDate } from "@/lib/portal/format";

// Project status timeline Anfrage -> ... -> Übergabe.
// Mobile: current step + 8-segment bar, full list behind <details>.
// md+: horizontal stepper. Only one variant is displayed at a time
// (display:none removes the other from the accessibility tree).

function merge(steps) {
  const byKey = Object.fromEntries((steps || []).map((s) => [s.key, s]));
  return PROJECT_STEPS.map((s) => ({ ...s, state: byKey[s.key]?.state || "offen", date: byKey[s.key]?.date || null }));
}

// A planned date that has passed is not shown as "geplant <date>" (looks
// stale); an active step then reads "in Vorbereitung".
function dateLabel(s) {
  if (!s.date) return "";
  if (s.state === "erledigt") return formatShortDate(s.date);
  if (Date.parse(s.date) < Date.now()) return s.state === "aktiv" ? "in Vorbereitung" : "";
  return `geplant ${formatShortDate(s.date)}`;
}

function Dot({ state }) {
  if (state === "erledigt") {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center bg-ink text-white">
        <Check size={14} strokeWidth={2.5} aria-hidden="true" />
      </span>
    );
  }
  if (state === "aktiv") {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center border-2 border-gold bg-white">
        <span className="size-2.5 rounded-full bg-gold motion-safe:animate-pulse" />
      </span>
    );
  }
  return <span className="size-6 shrink-0 border border-ink/25 bg-white" />;
}

const stateText = { erledigt: "erledigt", aktiv: "aktueller Schritt", offen: "offen" };

export default function StatusTimeline({ steps, labelledBy }) {
  const list = merge(steps);
  const activeIndex = Math.max(0, list.findIndex((s) => s.state === "aktiv"));
  const active = list[activeIndex];

  return (
    <div>
      {/* Mobile */}
      <div className="md:hidden">
        <p className="text-sm text-ink/70">
          Schritt {activeIndex + 1} von {list.length}
        </p>
        <p className="mt-0.5 text-lg font-semibold text-ink">{active.label}</p>
        <div className="mt-3 grid grid-cols-8 gap-1" aria-hidden="true">
          {list.map((s) => (
            <span
              key={s.key}
              className={`h-1.5 ${s.state === "erledigt" ? "bg-ink" : s.state === "aktiv" ? "bg-gold" : "bg-ink/15"}`}
            />
          ))}
        </div>
        <details className="group mt-3">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-sm font-medium text-ink underline decoration-ink/30 underline-offset-4 focus-visible:outline-2 focus-visible:outline-gold">
            <span className="group-open:hidden">Alle Schritte anzeigen</span>
            <span className="hidden group-open:inline">Schritte ausblenden</span>
          </summary>
          <ol className="mt-2 space-y-0" aria-labelledby={labelledBy}>
            {list.map((s, i) => (
              <li key={s.key} className="relative flex gap-3 pb-4 last:pb-0" aria-current={s.state === "aktiv" ? "step" : undefined}>
                {i < list.length - 1 && (
                  <span aria-hidden="true" className={`absolute left-3 top-6 h-[calc(100%-1.5rem)] w-px ${s.state === "erledigt" ? "bg-ink" : "bg-ink/15"}`} />
                )}
                <Dot state={s.state} />
                <div className="min-w-0">
                  <p className={`text-sm ${s.state === "aktiv" ? "font-semibold text-ink" : s.state === "erledigt" ? "text-ink" : "text-ink/70"}`}>
                    {s.label}
                    <span className="sr-only"> – {stateText[s.state]}</span>
                  </p>
                  {dateLabel(s) && <p className="text-xs text-ink/70">{dateLabel(s)}</p>}
                </div>
              </li>
            ))}
          </ol>
        </details>
      </div>

      {/* Desktop */}
      <ol className="hidden grid-cols-8 md:grid" aria-labelledby={labelledBy}>
        {list.map((s, i) => (
          <li key={s.key} className="relative flex flex-col items-start pr-2" aria-current={s.state === "aktiv" ? "step" : undefined}>
            {i < list.length - 1 && (
              <span aria-hidden="true" className={`absolute left-6 right-0 top-3 h-px ${s.state === "erledigt" ? "bg-ink" : "bg-ink/15"}`} />
            )}
            <Dot state={s.state} />
            <p className={`mt-3 text-[13px] leading-snug ${s.state === "aktiv" ? "font-semibold text-ink" : s.state === "erledigt" ? "text-ink" : "text-ink/70"}`}>
              {s.label}
              <span className="sr-only"> – {stateText[s.state]}</span>
            </p>
            {dateLabel(s) && <p className="mt-0.5 text-xs text-ink/70">{dateLabel(s)}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
