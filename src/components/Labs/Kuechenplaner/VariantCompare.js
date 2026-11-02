"use client";
// Küchenplaner – Varianten A/B nebeneinander (Feinschliff, QA-Feedback 2 P3-9).
// Zwei Merkplätze im Browser (localStorage, nur Komfort). Ohne Speicher (privater Modus,
// gesperrt) gelten die Merkplätze bis zum Neuladen im React-State (Fix 3, P3-5).
// Ist nur A gemerkt, vergleicht B die aktuelle Planung. Je Variante: Grundriss, Öffnen im Planer (mit Rückgängig),
// überschreiben, entfernen. Darunter eine Tabelle mit Unterschieden (B gegenüber A).
// Fix 3: Öffnen merkt eine ungemerkte Live-Planung zuerst auf der Gegenseite (P2-3),
// Differenz sichtbar beschriftet (P2-2), Miniaturen ohne Kürzel (P3-3), Platzhalter bis
// zum Lesen des Speichers statt „Noch leer“ (P3-7).
import { useMemo, useState, useSyncExternalStore } from "react";
import { ArrowLeftRight, FolderOpen, RefreshCw, Trash2 } from "lucide-react";
import { decodePlan, encodePlan } from "./planState";
import { buildKitchen } from "./geometry";
import { priceRange } from "./pricing";
import { PlanSvg } from "./Drawings";
import { runChecks } from "../../../lib/kuechenplaner/checks";
import { compareRows, moduleDiff, planMetrics } from "../../../lib/kuechenplaner/compare";
import { openVariant, parseSlots } from "../../../lib/kuechenplaner/variants";
import { useKpT } from "./KpCopy";

const KEY = "kp-variants-v1";
const EVENT = "kp-variants-change";
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:shadow-[0_0_0_2px_#fff]";
const btn = `inline-flex min-h-11 items-center justify-center gap-1.5 border border-ink/25 bg-paper px-3 text-sm text-ink hover:border-ink/60 disabled:opacity-40 ${focusRing}`;
const btnDark = `inline-flex min-h-11 items-center justify-center gap-1.5 border border-ink bg-ink px-3 text-sm text-paper hover:bg-ink/90 ${focusRing}`;

// P3-5: In-Memory-Ersatz auf Modulebene – überlebt Reiterwechsel (die Komponente wird
// dabei neu gemountet), gilt aber nur bis zum Neuladen der Seite.
let memRaw = null;

function snapshot() {
  if (memRaw !== null) return memRaw;
  try {
    return window.localStorage.getItem(KEY) || "{}";
  } catch {
    return "{}";
  }
}
function subscribe(cb) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
/** Schreibt die Merkplätze; false = nur im Speicher der Seite (Browser speichert nicht). */
function write(next) {
  const raw = JSON.stringify(next);
  let ok = false;
  if (memRaw === null) {
    try {
      window.localStorage.setItem(KEY, raw);
      ok = true;
    } catch {
      ok = false;
    }
  }
  if (!ok) memRaw = raw;
  window.dispatchEvent(new Event(EVENT));
  return ok;
}

function evaluate(plan, priceTable) {
  const kitchen = buildKitchen(plan);
  const checks = runChecks(plan, kitchen);
  const price = priceTable ? priceRange(plan, priceTable, kitchen) : null;
  return { plan, kitchen, checks, metrics: planMetrics(plan, kitchen, checks, price) };
}

function Column({ id, label, v, isCurrent, live, onOpen, onOverwrite, onRemove, onStore }) {
  const tr = useKpT();
  const ID = id.toUpperCase();
  return (
    <div className="flex min-w-0 flex-col gap-2" data-kp-variant={id}>
      {/* P3-4: Kopf in fester Struktur – die Zeile „Im Planer geöffnet“ ist immer reserviert,
          damit A und B auf gleicher Höhe beginnen. */}
      <div className="flex flex-col gap-0.5">
        <div className="flex min-h-7 items-center gap-2">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center bg-ink text-sm font-semibold text-paper" aria-hidden="true">{id.toUpperCase()}</span>
          <span className="min-w-0 text-sm font-semibold leading-tight text-ink">{label}</span>
        </div>
        <div className="flex h-5 items-center">
          {isCurrent && <span className="whitespace-nowrap text-xs leading-none text-success" data-kp-variant-open="">{tr("Im Planer geöffnet")}</span>}
        </div>
      </div>
      <div className="border border-ink/15 bg-[#faf8f4] p-1.5">
        {v ? (
          <PlanSvg plan={v.plan} kitchen={v.kitchen} checks={v.checks} triangle={false} labels={false} className="block h-36 w-full sm:h-48" title={tr("Grundriss Variante {w}: {shape}, {room}", { w: ID, shape: tr(v.metrics.shape), room: tr(v.metrics.room) })} t={tr} />
        ) : (
          <p className="flex h-36 items-center justify-center px-2 text-center text-[0.8125rem] text-ink-soft sm:h-48">{tr("Noch leer")}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {live ? (
          <button type="button" className={btnDark} onClick={onStore}>{tr("Als {w} merken", { w: ID })}</button>
        ) : v ? (
          <>
            <button type="button" className={btn} onClick={onOpen} disabled={isCurrent} aria-label={tr("Variante {w} im Planer öffnen", { w: ID })}>
              <FolderOpen size={16} aria-hidden="true" /> {tr("Öffnen")}
            </button>
            <button type="button" className={btn} onClick={onOverwrite} disabled={isCurrent} aria-label={tr("Variante {w} durch die aktuelle Planung ersetzen", { w: ID })} title={tr("Durch aktuelle Planung ersetzen")}>
              <RefreshCw size={16} aria-hidden="true" /> {tr("Aktualisieren")}
            </button>
            <button type="button" className={`${btn} w-11 px-0`} onClick={onRemove} aria-label={tr("Variante {w} entfernen", { w: ID })} title={tr("Entfernen")}>
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </>
        ) : (
          <button type="button" className={btnDark} onClick={onStore}>{tr("Aktuelle als {w} merken", { w: ID })}</button>
        )}
      </div>
    </div>
  );
}

function Placeholder() {
  const tr = useKpT();
  // Gleiche Höhe wie der Vergleich mit zwei Spalten, damit nichts springt (P3-7)
  return (
    <section aria-labelledby="kp-var" aria-busy="true" className="space-y-3" data-kp-compare="" data-kp-compare-pending="">
      <h3 id="kp-var" className="text-base font-semibold text-ink">{tr("Varianten A/B vergleichen")}</h3>
      <p className="text-[0.8125rem] text-ink/75">{tr("Gemerkte Varianten werden gelesen …")}</p>
      <div className="grid grid-cols-2 gap-2 sm:gap-4" aria-hidden="true">
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-[3.25rem]" />
            <div className="border border-ink/10 bg-[#faf8f4] p-1.5">
              <div className="h-36 sm:h-48" />
            </div>
            <div className="h-11" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function VariantCompare(props) {
  // Server und erster Client-Render: null → Platzhalter; danach der echte Speicherinhalt.
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  if (raw === null) return <Placeholder />;
  return <Compare raw={raw} {...props} />;
}

function Compare({ raw, plan, priceTable = null, onLoad }) {
  const tr = useKpT();
  const fromStore = useMemo(() => parseSlots(raw), [raw]);
  const slots = fromStore;
  const [msg, setMsg] = useState("");
  const [onlyDiff, setOnlyDiff] = useState(false);
  const code = useMemo(() => encodePlan(plan), [plan]);

  const stored = useMemo(() => {
    const out = {};
    for (const id of ["a", "b"]) {
      const p = slots[id] ? decodePlan(slots[id].k) : null;
      out[id] = p ? evaluate(p, priceTable) : null;
    }
    return out;
  }, [slots, priceTable]);
  const current = useMemo(() => evaluate(plan, priceTable), [plan, priceTable]);

  // Nur A gemerkt → B zeigt die aktuelle Planung (live). Nur B gemerkt → A zeigt die aktuelle.
  const liveB = Boolean(stored.a && !stored.b);
  const liveA = Boolean(!stored.a && stored.b);
  const A = stored.a || (liveA ? current : null);
  const B = stored.b || (liveB ? current : null);
  const rows = A && B ? compareRows(A.metrics, B.metrics) : [];
  const mdiff = A && B ? moduleDiff(A.metrics, B.metrics) : null;
  const nDiff = rows.filter((r) => r.diff).length;
  const shown = onlyDiff ? rows.filter((r) => r.diff) : rows;

  // Schreiben mit Ersatz: klappt localStorage nicht, bleiben die Merkplätze im Speicher der Seite.
  const NO_STORE = ` ${tr("Der Browser speichert hier nicht – die Varianten gelten nur bis zum Neuladen.")}`;
  const commit = (next) => (write(next) ? "" : NO_STORE);
  const store = (id) => {
    const next = { ...slots, [id]: { k: code, at: Date.now() } };
    const note = commit(next);
    setMsg(`${tr("Aktuelle Planung als Variante {w} gemerkt.", { w: id.toUpperCase() })}${!next.a || !next.b ? ` ${tr("Ändern Sie jetzt die Planung – der Vergleich rechnet live mit.")}` : ""}${note}`);
  };
  const remove = (id) => {
    const note = commit({ ...slots, [id]: null });
    setMsg(`${tr("Variante {w} entfernt.", { w: id.toUpperCase() })}${note}`);
  };
  const open = (id) => {
    if (!stored[id]) return;
    // P2-3: Ungemerkte Live-Planung zuerst auf der Gegenseite merken
    const { slots: next, kept } = openVariant(slots, id, code);
    const note = kept ? commit(next) : "";
    onLoad?.(stored[id].plan);
    setMsg(kept
      ? `${tr("Aktuelle Planung als {w1} gemerkt, Variante {w2} geöffnet.", { w1: kept.toUpperCase(), w2: id.toUpperCase() })}${note}`
      : tr("Variante {w} im Planer geöffnet – mit Rückgängig kommen Sie zurück.", { w: id.toUpperCase() }));
  };
  const swap = () => {
    const note = commit({ a: slots.b, b: slots.a });
    setMsg(`${tr("Varianten A und B getauscht.")}${note}`);
  };
  const dateLoc = { de: "de-AT", en: "en-GB", fr: "fr-FR", it: "it-IT" }[tr.locale] || "de-AT";
  const label = (id, live) => (live ? tr("Aktuelle Planung") : `${tr("Variante {w}", { w: id.toUpperCase() })}${stored[id] ? ` · ${new Date(slots[id].at).toLocaleDateString(dateLoc)}` : ""}`);
  const hasDelta = shown.some((r) => r.delta);
  const groups = [...new Set(shown.map((r) => r.group))];

  return (
    <section aria-labelledby="kp-var" className="space-y-3" data-kp-compare="">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="kp-var" className="text-base font-semibold text-ink">{tr("Varianten A/B vergleichen")}</h3>
        {stored.a && stored.b && (
          <button type="button" className={btn} onClick={swap}>
            <ArrowLeftRight size={16} aria-hidden="true" /> {tr("Tauschen")}
          </button>
        )}
      </div>
      <p className="text-[0.8125rem] text-ink/75">
        {tr("Merken Sie eine Planung als A, probieren Sie dann eine andere Form, andere Geräte oder Materialien – B rechnet live mit. Gespeichert wird nur in diesem Browser.")}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <Column id="a" label={label("a", liveA)} v={A} live={liveA} isCurrent={Boolean(stored.a) && slots.a.k === code} onOpen={() => open("a")} onOverwrite={() => store("a")} onRemove={() => remove("a")} onStore={() => store("a")} />
        <Column id="b" label={label("b", liveB)} v={B} live={liveB} isCurrent={Boolean(stored.b) && slots.b.k === code} onOpen={() => open("b")} onOverwrite={() => store("b")} onRemove={() => remove("b")} onStore={() => store("b")} />
      </div>
      {msg && <p className="text-[0.8125rem] text-ink" role="status">{msg}</p>}

      {rows.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink" data-kp-diffcount={nDiff}>
              {nDiff ? tr(nDiff > 1 ? "{n} Unterschiede" : "{n} Unterschied", { n: nDiff }) : tr("Beide Varianten sind gleich.")}
            </p>
            <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
              <input type="checkbox" className="h-5 w-5 accent-ink" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} />
              {tr("Nur Unterschiede")}
            </label>
          </div>
          {hasDelta && (
            <p className="text-xs text-ink-soft" data-kp-delta-note="">
              <span aria-hidden="true" className="font-medium">Δ</span> {tr("Kleine Zahl unter B: Differenz von B gegenüber A.")}
            </p>
          )}
          <table className="w-full table-fixed border-collapse text-left text-[0.8125rem] text-ink" data-kp-compare-table="">
            <caption className="sr-only">{tr("Vergleich Variante A und B. Abweichungen sind markiert, die Differenz zeigt B gegenüber A.")}</caption>
            <colgroup>
              <col className="w-[34%]" />
              <col className="w-[33%]" />
              <col className="w-[33%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-ink/20">
                <th scope="col" className="py-1.5 pr-2 font-medium text-ink-soft">{tr("Merkmal")}</th>
                <th scope="col" className="py-1.5 pr-2 font-semibold">A</th>
                <th scope="col" className="py-1.5 font-semibold">B</th>
              </tr>
            </thead>
            {groups.map((g) => (
              <tbody key={g}>
                <tr>
                  <th scope="rowgroup" colSpan={3} className="pb-1 pt-3 text-xs font-medium uppercase tracking-[0.14em] text-gold-text">{tr(g)}</th>
                </tr>
                {shown.filter((r) => r.group === g).map((r) => (
                  <tr key={r.key} className={`border-t border-ink/10 align-top ${r.diff ? "bg-[#f6efe2]" : ""}`} data-kp-row={r.key} data-diff={r.diff ? "1" : "0"}>
                    <th scope="row" className={`py-1.5 pl-1.5 pr-2 font-normal ${r.diff ? "border-l-2 border-notice" : "border-l-2 border-transparent"}`}>
                      {tr(r.label)}
                      {r.diff && <span className="sr-only"> ({tr("unterschiedlich")})</span>}
                    </th>
                    <td className="break-words py-1.5 pr-2 tabular-nums">{tr(r.a)}</td>
                    <td className="break-words py-1.5 tabular-nums">
                      {tr(r.b)}
                      {r.delta && <span className="block whitespace-nowrap text-xs font-medium text-ink-soft" data-kp-delta=""><span aria-hidden="true">Δ </span>{tr(r.delta)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
          {mdiff && (mdiff.onlyA.length > 0 || mdiff.onlyB.length > 0) && (
            <div className="grid grid-cols-2 gap-2 text-[0.8125rem] text-ink sm:gap-4" data-kp-moddiff="">
              <p><span className="font-medium">{tr("Nur in A:")}</span> {mdiff.onlyA.length ? mdiff.onlyA.map((x) => tr(x)).join(", ") : "–"}</p>
              <p><span className="font-medium">{tr("Nur in B:")}</span> {mdiff.onlyB.length ? mdiff.onlyB.map((x) => tr(x)).join(", ") : "–"}</p>
            </div>
          )}
          <p className="text-xs text-ink/70">{tr("Stauraum als Frontbreite in cm (ohne Geräte, Passstücke und Haubenschrank). Kennzahlen sind Planungswerte, kein Aufmaß.")}</p>
        </>
      )}
    </section>
  );
}
