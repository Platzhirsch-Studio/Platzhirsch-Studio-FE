"use client";
import { useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import cx from "./cx";
import { markiere } from "./motion";
import { CommitKontext } from "@/lib/backoffice/commit/kontext";
import { useAusstehend, useCommitEreignis } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { behalteZeilen } from "@/lib/backoffice/commit/warteschlange";
import { objektSchluessel } from "@/lib/backoffice/commit/konstanten";
import { COMMIT_TEXTE as T } from "@/lib/backoffice/commit/texte";

// `Ausstehend` (G-03, Q-C5, C-12; Team P0-3): Zeile, Karte oder Akte zeigt, dass eine Änderung noch
// nicht gespeichert ist – „wird in 6 s gespeichert“. Lounge: weiche Pille (Füllung 5 % Tinte), gestrichelter
// Ring, 12 px gedämpft, kleiner Restzeit-Ring. Erscheint nur, solange die Warteschlange etwas für das
// Objekt hält; rendert sonst nichts (kein Platzhalter, kein Springen der Zeilenhöhe: Pillenhöhe = Status-Pille).
//
//   <Ausstehend objekt={{ doctype: "PH Anfrage", name }} />
//   const ref = useCommitMarke({ doctype: "PH Anfrage", name });   // <tr ref={ref} className="bo-row"> – 1200 ms Salbei nach dem Speichern
//   const zeilen = useBehalteZeilen(serverZeilen, (z) => `PH Anfrage:${z.name}`); // Zeile bleibt im Filter bis zum Commit

const UMFANG = 2 * Math.PI * 4.5;
const LEER = { version: 0, vorgaenge: [] };
const keinAbo = () => () => {};
const leer = () => LEER;

function useRestMs(v) {
  const [jetzt, setJetzt] = useState(() => Date.now());
  const laeuft = v && v.zustand === "wartet" && !v.pausiert;
  useEffect(() => {
    if (!laeuft) return undefined;
    const t = setInterval(() => setJetzt(Date.now()), 250);
    return () => clearInterval(t);
  }, [laeuft, v?.frist]);
  if (!v) return 0;
  return v.pausiert ? v.rest : Math.max(0, v.frist - jetzt);
}

/** Restzeit-Ring 12 px (leert sich; bei reduzierter Bewegung springt er sekundenweise ohne Übergang). */
function Ring({ anteil }) {
  return (
    <svg viewBox="0 0 12 12" className="size-3 shrink-0 -rotate-90" aria-hidden="true">
      <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" />
      <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray={UMFANG} strokeDashoffset={UMFANG * (1 - Math.min(1, Math.max(0, anteil)))} className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-[250ms] motion-safe:ease-linear" />
    </svg>
  );
}

/**
 * @param {object} p
 * @param {{doctype:string, name:string}|string} p.objekt
 * @param {boolean} [p.nurSymbol]  nur Ring (Kanban-Karte, enge Zellen) – Text als Tooltip/aria-label
 */
export default function Ausstehend({ objekt, nurSymbol = false, className }) {
  const v = useAusstehend(objekt);
  const rest = useRestMs(v);
  if (!v) return null;
  const sekunden = Math.max(1, Math.ceil(rest / 1000));
  const text = v.zustand === "laeuft" || v.zustand === "verwirft" ? T.ausstehendLaeuft : v.pausiert ? T.ausstehendAngehalten : T.ausstehend(sekunden);
  const anteil = v.zustand === "wartet" && v.ms ? rest / v.ms : 0;
  return (
    <span
      role="status"
      aria-label={nurSymbol ? `${T.ausstehendLabel}: ${text}` : undefined}
      data-tip={nurSymbol ? text : undefined}
      data-testid="ausstehend"
      data-zustand={v.zustand}
      className={cx(
        "inline-flex h-(--bo-pille-h) shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill bg-bo-fill text-[12px] font-medium tabular-nums text-bo-text-soft",
        "outline-1 -outline-offset-1 outline-dashed outline-bo-line-strong",
        nurSymbol ? "bo-tip w-(--bo-pille-h) justify-center" : "pl-2 pr-2.5",
        className
      )}
    >
      <Ring anteil={anteil} />
      {!nurSymbol && <span>{text}</span>}
    </span>
  );
}

/**
 * Ref für Zeile/Karte: nach erfolgreichem Speichern dieses Objekts 1200 ms Salbei-Hervorhebung
 * (markiere aus motion.js; Element braucht .bo-row oder .bo-markierbar).
 */
export function useCommitMarke(objekt) {
  const ref = useRef(null);
  const schluessel = objektSchluessel(objekt);
  useCommitEreignis((e) => {
    if (e.art !== "fertig" || !schluessel) return;
    if ((e.ergebnisse || []).some((r) => r.ok && r.objekt === schluessel)) markiere(ref.current, { ton: "ok", scrollen: false });
  });
  return ref;
}

/** Objekt-Schlüssel mit ausstehendem Commit (reaktiv). */
export function useOffeneObjekte() {
  const q = useContext(CommitKontext);
  const snap = useSyncExternalStore(q ? q.abonniere : keinAbo, q ? q.schnappschuss : leer, leer);
  return useMemo(() => new Set(snap.vorgaenge.filter((v) => v.zustand !== "erledigt").flatMap((v) => v.objekte)), [snap]);
}

/**
 * Zeilen, die nach einer Änderung aus dem Filter fallen würden, bleiben bis zum Commit an ihrer Stelle (Q-C5).
 * @param {any[]} zeilen
 * @param {(zeile:any)=>string} schluesselVon  Zeile → „Doctype:Name“ (wie das objekt von starte())
 */
export function useBehalteZeilen(zeilen, schluesselVon) {
  const offen = useOffeneObjekte();
  const [stand, setStand] = useState(() => ({ zeilen, offen, merk: [] }));
  let merk = stand.merk;
  if (stand.zeilen !== zeilen || stand.offen !== offen) {
    const vorher = behalteZeilen(stand.zeilen, stand.merk, stand.offen, schluesselVon);
    merk = vorher.map((zeile, index) => ({ zeile, index })).filter(({ zeile }) => offen.has(schluesselVon(zeile)));
    setStand({ zeilen, offen, merk });
  }
  return behalteZeilen(zeilen, merk, offen, schluesselVon);
}
