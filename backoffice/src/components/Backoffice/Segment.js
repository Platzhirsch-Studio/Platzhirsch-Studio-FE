"use client";
import Link from "next/link";
import { useCallback, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import cx from "./cx";
import { Icon } from "./icons";

// Segmented Control im Lounge-/iOS-Stil (lounge.md §6, 03 §8.10): Kapsel aus 8 % Tinte, ein
// gleitender Indikator (Tinte, bzw. Kachel-Fläche bei `variante="hell"`) federt auf transform +
// Breite, Zähler je Option gedimmt, Druck-Feder 0,97. Höhe folgt der Dichte (40 / 44, Kiosk 52).
// Zwei Arten:
//   Link-Gruppe (optionen mit href; Liste/Kanban, Zeiträume) – reines GET, nav + aria-current.
//   Auswahl (ohne href; Netto/Brutto, Hell/Dunkel, Dichte) – role="radiogroup", ←/→/Pos1/Ende,
//   `wert` + `onWechsel` (nur aus Client-Komponenten) oder `name` für Formulare (verstecktes Feld).
// Props sind serialisierbar außer `onWechsel`; aus Server-Komponenten nur die Link-Gruppe nutzen.

export const TEXTE = {
  dichte: "Dichte",
  dichteOptionen: { auto: "Automatisch", kompakt: "Kompakt", komfortabel: "Komfortabel" },
  dichteHinweis: "Automatisch: kompakt mit Maus, komfortabel mit Touch.",
};

function useMarker(behaelter, aktivWert, optionen) {
  const [mass, setMass] = useState(null);
  useLayoutEffect(() => {
    const el = behaelter.current;
    if (!el) return undefined;
    const messen = () => {
      const ziel = el.querySelector('[data-segment-aktiv="true"]');
      if (!ziel) return setMass(null);
      setMass({ x: ziel.offsetLeft, w: ziel.offsetWidth });
    };
    messen();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(messen) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [behaelter, aktivWert, optionen]);
  return mass;
}

function Beschriftung({ o }) {
  return (
    <>
      {o.icon && <Icon name={o.icon} className="size-4" />}
      <span className="min-w-0 truncate">{o.titel}</span>
      {o.anzahl !== undefined && o.anzahl !== null && (
        <span className="bo-seg__n" aria-label={`, ${o.anzahl}`}>
          {o.anzahl}
        </span>
      )}
    </>
  );
}

/**
 * @param {object} p
 * @param {string} p.label   Name der Gruppe (Pflicht, Screenreader)
 * @param {Array<{wert:string, titel:string, href?:string, icon?:string, anzahl?:number|string, testid?:string, deaktiviert?:boolean}>} p.optionen
 * @param {string} [p.aktiv]   aktiver Wert (Link-Gruppe)
 * @param {string} [p.wert]    gewählter Wert (Auswahl); ohne `wert` ungesteuert ab `aktiv`
 * @param {(wert:string)=>void} [p.onWechsel]
 * @param {string} [p.name]    Formularfeld (verstecktes input)
 * @param {"m"|"s"} [p.groesse]
 * @param {"tinte"|"hell"} [p.variante]  Indikator in Tinte (Standard) oder als helle Kachel
 * @param {boolean} [p.breit]  volle Breite, Segmente gleich breit (Kassa-Zahlart, Packmittel)
 */
export default function Segment({ label, optionen = [], aktiv, wert, onWechsel, name, groesse = "m", variante = "tinte", breit = false, className, testid }) {
  const istLinks = optionen.some((o) => o.href);
  const [eigen, setEigen] = useState(wert ?? aktiv ?? optionen[0]?.wert);
  const gewaehlt = istLinks ? aktiv : (wert ?? eigen);
  const behaelter = useRef(null);
  const mass = useMarker(behaelter, gewaehlt, optionen.length);

  const waehle = useCallback(
    (w) => {
      if (wert === undefined) setEigen(w);
      onWechsel?.(w);
    },
    [onWechsel, wert]
  );

  const segmentKlasse = cx("bo-seg__i", breit && "flex-1");

  const marker = mass && <span aria-hidden="true" className="bo-seg__ind" style={{ width: mass.w, transform: `translateX(${mass.x}px)` }} />;

  const huelle = cx("bo-seg", groesse === "s" && "bo-seg--s", variante === "hell" && "bo-seg--hell", breit && "flex w-full", className);
  const gemessen = mass ? "" : undefined;

  if (istLinks) {
    return (
      <nav ref={behaelter} aria-label={label} className={huelle} data-testid={testid} data-gemessen={gemessen}>
        {marker}
        {optionen.map((o) => {
          const an = o.wert === gewaehlt;
          return (
            <Link key={o.wert} href={o.href} aria-current={an ? "page" : undefined} data-segment-aktiv={an ? "true" : undefined} data-testid={o.testid} className={segmentKlasse}>
              <Beschriftung o={o} />
            </Link>
          );
        })}
      </nav>
    );
  }

  const aktiveOptionen = optionen.filter((o) => !o.deaktiviert);
  const taste = (e) => {
    const i = aktiveOptionen.findIndex((o) => o.wert === gewaehlt);
    let ziel = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") ziel = aktiveOptionen[(i + 1) % aktiveOptionen.length];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") ziel = aktiveOptionen[(i - 1 + aktiveOptionen.length) % aktiveOptionen.length];
    else if (e.key === "Home") ziel = aktiveOptionen[0];
    else if (e.key === "End") ziel = aktiveOptionen[aktiveOptionen.length - 1];
    if (!ziel) return;
    e.preventDefault();
    waehle(ziel.wert);
    behaelter.current?.querySelector(`[data-wert="${CSS.escape(ziel.wert)}"]`)?.focus();
  };

  return (
    <div ref={behaelter} role="radiogroup" aria-label={label} className={huelle} onKeyDown={taste} data-testid={testid} data-gemessen={gemessen}>
      {marker}
      {optionen.map((o) => {
        const an = o.wert === gewaehlt;
        return (
          <button
            key={o.wert}
            type="button"
            role="radio"
            aria-checked={an}
            tabIndex={an ? 0 : -1}
            disabled={o.deaktiviert}
            data-wert={o.wert}
            data-segment-aktiv={an ? "true" : undefined}
            data-testid={o.testid}
            onClick={() => waehle(o.wert)}
            className={segmentKlasse}
          >
            <Beschriftung o={o} />
          </button>
        );
      })}
      {name && <input type="hidden" name={name} value={gewaehlt ?? ""} />}
    </div>
  );
}

// ---- Dichte-Umschaltung (03 §4, Q-G6, M-06) -------------------------------------------
// Wert „auto“ entfernt html[data-dichte] (CSS: kompakt bei Maus, komfortabel bei Touch).
// Speicher: localStorage `ph_bo_dichte` + Cookie gleichen Namens (Server kann ihn lesen;
// die Vorliebe je Benutzer liefert später auth/ (P0-8)). Vor dem ersten Paint setzt
// `DICHTE_SKRIPT` (Inline-Script im <head> des Wurzel-Layouts) das Attribut.

export const DICHTE_SCHLUESSEL = "ph_bo_dichte";
export const DICHTE_WERTE = ["auto", "kompakt", "komfortabel"];

/** Inline-Script für <head> (Leitfaden „preventing-flash-before-hydration“). */
export const DICHTE_SKRIPT = `(function(){try{var d=localStorage.getItem("${DICHTE_SCHLUESSEL}");if(d==="kompakt"||d==="komfortabel")document.documentElement.setAttribute("data-dichte",d)}catch(e){}})()`;

const zuhoerer = new Set();
function lesen() {
  try {
    const d = document.documentElement.getAttribute("data-dichte");
    return d === "kompakt" || d === "komfortabel" ? d : "auto";
  } catch {
    return "auto";
  }
}

/** Dichte setzen (auch außerhalb von React nutzbar, z. B. aus dem Benutzermenü). */
export function setzeDichte(wert) {
  const w = DICHTE_WERTE.includes(wert) ? wert : "auto";
  const html = document.documentElement;
  if (w === "auto") html.removeAttribute("data-dichte");
  else html.setAttribute("data-dichte", w);
  try {
    if (w === "auto") localStorage.removeItem(DICHTE_SCHLUESSEL);
    else localStorage.setItem(DICHTE_SCHLUESSEL, w);
  } catch {
    /* privater Modus: nur für diese Sitzung */
  }
  document.cookie = `${DICHTE_SCHLUESSEL}=${w}; path=/; max-age=31536000; SameSite=Lax`;
  zuhoerer.forEach((f) => f());
}

/** Aktuelle Dichte als Zustand: [wert, setzen]. Server/Hydration: „auto“. */
export function useDichte() {
  const wert = useSyncExternalStore(
    (f) => {
      zuhoerer.add(f);
      return () => zuhoerer.delete(f);
    },
    lesen,
    () => "auto"
  );
  // Entwicklung: React setzt <html>-Attribute beim Strict-Mode-Remount zurück – erneut anwenden.
  useLayoutEffect(() => {
    try {
      const d = localStorage.getItem(DICHTE_SCHLUESSEL);
      if ((d === "kompakt" || d === "komfortabel") && document.documentElement.getAttribute("data-dichte") !== d) {
        document.documentElement.setAttribute("data-dichte", d);
        zuhoerer.forEach((f) => f());
      }
    } catch {
      /* ohne Speicher bleibt „auto“ */
    }
  }, []);
  return [wert, setzeDichte];
}

/** Dichte-Schalter für Benutzermenü/Einstellungen: Automatisch · Kompakt · Komfortabel. */
export function DichteSchalter({ className, mitHinweis = false }) {
  const [dichte, setzen] = useDichte();
  return (
    <div className={cx("inline-flex flex-col gap-1", className)}>
      <Segment
        label={TEXTE.dichte}
        wert={dichte}
        onWechsel={setzen}
        testid="dichte-schalter"
        optionen={[
          { wert: "auto", titel: TEXTE.dichteOptionen.auto, testid: "dichte-auto" },
          { wert: "kompakt", titel: TEXTE.dichteOptionen.kompakt, icon: "Rows4", testid: "dichte-kompakt" },
          { wert: "komfortabel", titel: TEXTE.dichteOptionen.komfortabel, icon: "Rows3", testid: "dichte-komfortabel" },
        ]}
      />
      {mitHinweis && <span className="text-xs text-bo-text-faint">{TEXTE.dichteHinweis}</span>}
    </div>
  );
}
