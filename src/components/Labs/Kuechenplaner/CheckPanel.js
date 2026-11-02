"use client";
// Küchenplaner – Reiter „Prüfen“: Kollisionen, Ergonomie, Anschlüsse und Maße
// mit Quellen, dazu Bemaßung: Draufsicht mit Maßketten und Ansicht je Wand.
// Wird erst geladen, wenn der Reiter geöffnet wird (next/dynamic).
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from "lucide-react";
import { PlanSvg, WallElevation, elevationWalls } from "./Drawings";
import { keepTogether as kt } from "@/lib/kuechenplaner/typo";
import { useKpT } from "./KpCopy";

const ICON = { error: OctagonAlert, warn: AlertTriangle, hint: Info, ok: CheckCircle2 };
const TONE = { error: "text-error", warn: "text-notice", hint: "text-ink-soft", ok: "text-success" };
// Fix 2 (P3-5): eine Bezeichnung je Stufe, wie im Kasten unter den Reitern (warn = „Hinweis“, ocker)
const LEVEL = { error: "Kollision", warn: "Hinweis", hint: "Tipp", ok: "In Ordnung" };
const CATS = [
  ["kollision", "Kollisionen"],
  // Fix 1, P3-5: Hinweise ohne echte Kollision (z. B. Griffe in der Ecke) nicht unter „Kollisionen“
  ["planung", "Hinweise zur Planung"],
  ["ergonomie", "Ergonomie und Laufwege"],
  ["anschluss", "Anschlüsse"],
  ["maß", "Maße und Geräte"],
];
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:shadow-[0_0_0_2px_#fff]";

export default function CheckPanel({ plan, kitchen, checks, onSelect }) {
  const tr = useKpT();
  const walls = elevationWalls(plan, kitchen);
  const [wall, setWall] = useState(walls[0] || "a");
  const current = walls.includes(wall) ? wall : walls[0];
  const { counts } = checks;
  return (
    <div className="space-y-8">
      <section aria-labelledby="kp-chk">
        <h3 id="kp-chk" className="text-base font-semibold text-ink">{tr("Prüfung Ihrer Planung")}</h3>
        <p className="mt-1 text-sm text-ink-soft" role="status">
          {counts.error ? tr(counts.error > 1 ? "{n} Kollisionen" : "{n} Kollision", { n: counts.error }) : tr("Keine Kollisionen")} · {tr(counts.warn === 1 ? "{n} Hinweis zur Ergonomie" : "{n} Hinweise zur Ergonomie", { n: counts.warn })} · {tr("Richtwerte, die wir beim Aufmaß persönlich prüfen.")}
        </p>
        {CATS.map(([cat, label]) => {
          const catOf = (i) => (i.cat === "kollision" && i.level !== "error" ? "planung" : i.cat);
          const list = checks.items.filter((i) => catOf(i) === cat);
          if (!list.length) return null;
          return (
            <div key={cat} className="mt-5">
              <h4 className="text-xs font-medium uppercase tracking-[0.14em] text-gold-text">{tr(label)}</h4>
              <ul className="mt-2 divide-y divide-ink/10 border-y border-ink/10">
                {list.map((i) => {
                  const Icon = ICON[i.level];
                  return (
                    <li key={i.text} className="flex gap-2.5 py-2.5 text-sm text-ink">
                      <Icon size={18} className={`mt-0.5 shrink-0 ${TONE[i.level]}`} aria-hidden="true" />
                      <div className="min-w-0">
                        <p>
                          <span className="sr-only">{tr(LEVEL[i.level])}: </span>
                          {kt(tr(i.text))}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[0.8125rem]">
                          {i.ids?.length > 0 && onSelect && (
                            <button type="button" className={`inline-flex min-h-8 items-center text-ink underline decoration-ink/30 underline-offset-2 ${focusRing}`} onClick={() => onSelect(i.ids[0])}>
                              {tr("Im Plan zeigen")}
                            </button>
                          )}
                          {i.source && (
                            <a href={i.source.url} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-8 items-center text-ink-soft underline decoration-ink/30 underline-offset-2 ${focusRing}`} title={i.source.title}>
                              {tr("Quelle")}
                            </a>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </section>

      <section aria-labelledby="kp-mass">
        <h3 id="kp-mass" className="text-base font-semibold text-ink">{tr("Draufsicht mit Maßketten")}</h3>
        <p className="mt-1 text-[0.8125rem] text-ink-soft">{tr("Alle Maße in cm. Innen: Module, Mitte: Fenster/Türen, außen: Wandlänge.")}</p>
        <div className="mt-3 border border-ink/10 bg-paper p-2">
          <PlanSvg plan={plan} kitchen={kitchen} checks={checks} dims triangle className="h-auto w-full" title={tr("Draufsicht mit Maßketten")} t={tr} />
        </div>
      </section>

      {walls.length > 0 && (
        <section aria-labelledby="kp-ansicht">
          <h3 id="kp-ansicht" className="text-base font-semibold text-ink">{tr("Ansicht je Wand")}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={tr("Wand wählen")}>
            {walls.map((w) => (
              <button
                key={w}
                type="button"
                aria-pressed={current === w}
                onClick={() => setWall(w)}
                className={`min-h-11 border px-3 text-sm ${focusRing} ${current === w ? "border-ink bg-ink text-paper" : "border-ink/20 bg-paper text-ink"}`}
              >
                {w === "i" ? tr(plan.shape === "halbinsel" ? "Halbinsel" : "Insel") : tr("Wand {w}", { w: w.toUpperCase() })}
              </button>
            ))}
          </div>
          <div className="mt-3 border border-ink/10 bg-paper p-2">
            <WallElevation plan={plan} kitchen={kitchen} wall={current} className="h-auto w-full" t={tr} />
          </div>
          <p className="mt-1 text-[0.8125rem] text-ink-soft">{tr("Ansicht von der Raumseite. Links die Höhenkette: Sockel, Arbeitshöhe, Hängeschrank-Unterkante, Oberkante, Raumhöhe.")}</p>
        </section>
      )}
    </div>
  );
}
