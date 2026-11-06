"use client";
// G-07 Sheet und Peek (Team P0-4) im Lounge-Stil.
// Sheet: schwebende Material-Karte rechts (12 px vom Rand, Radius 28, blur 40, Schatten „float“),
// Breite sm 400 · md 480 · lg 640, Kopf 56 (Titel, „Als ganze Seite öffnen“, Schließen), leichter
// Scrim. Unter 640 px von unten mit Griff 40×5: folgt dem Finger, schließt beim Wurf nach unten,
// federt sonst zurück. Gleitet mit Feder ein (bo-motion.css), schließt in 120 ms.
// Ungespeicherte Änderungen → Rückfrage vor dem Schließen. `panel` schreibt ?panel=<name> in die URL.
// Peek: Vorschau zu einer Liste, nicht modal (die Liste bleibt bedienbar, die Zeile ist markiert),
// J/K bzw. ↑/↓ blättert, Esc schließt, Fokus kehrt zur Zeile zurück.

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import cx from "../cx";
import { Icon } from "../icons";
import Bestaetigen from "../Bestaetigen";
import { useDialogOffen, useSchmal, useZiehen } from "./hilfen";
import { breiteFuer, naechsterIndex, panelAusSuche, panelUrl } from "./logik";
import { TEXTE } from "./texte";
import "./overlay.css";

/** Panel-Parameter in die URL schreiben (ohne Navigation, Next bekommt es über die History mit). */
function setzePanelInUrl(name) {
  if (typeof window === "undefined") return;
  const ziel = panelUrl(window.location.href, name);
  const jetzt = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (ziel !== jetzt) window.history.replaceState(window.history.state, "", ziel);
}

/**
 * Offen-Zustand, der `?panel=<name>` in der URL spiegelt (Deep-Link, Neuladen öffnet wieder).
 * @param {string} name
 * @returns {[boolean, (offen: boolean) => void]}
 */
export function usePanel(name) {
  const [offen, setOffen] = useState(false);
  useEffect(() => {
    // Nach der Hydration aus der URL lesen (Server kennt den Zustand nicht).
    if (panelAusSuche(window.location.search) === name) setOffen(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, [name]);
  const setze = useCallback(
    (w) => {
      setOffen(w);
      setzePanelInUrl(w ? name : null);
    },
    [name]
  );
  return [offen, setze];
}

function Werkzeug({ icon, label, onClick, href, disabled, testid }) {
  const klasse = "bo-ov-rund bo-tip";
  if (href && !disabled) {
    return (
      <Link href={href} className={klasse} aria-label={label} data-tip={label} data-testid={testid}>
        <Icon name={icon} />
      </Link>
    );
  }
  return (
    <button type="button" className={klasse} aria-label={label} data-tip={label} onClick={onClick} disabled={disabled} data-testid={testid}>
      <Icon name={icon} />
    </button>
  );
}

/**
 * @param {object} p
 * @param {boolean} p.offen
 * @param {() => void} p.onSchliessen
 * @param {import("react").ReactNode} p.titel
 * @param {import("react").ReactNode} [p.unter]        Unterzeile 13 (Nummer, Status)
 * @param {"sm"|"md"|"lg"} [p.groesse]                 400 / 480 / 640
 * @param {string} [p.vollseite]                        Link „Als ganze Seite öffnen“ (maximize-2)
 * @param {import("react").ReactNode} [p.werkzeuge]    weitere runde Knöpfe im Kopf (links vom Schließen)
 * @param {import("react").ReactNode} [p.fuss]         Aktionen unten (eine Primäraktion)
 * @param {boolean} [p.ungespeichert]                  Rückfrage vor dem Schließen
 * @param {string} [p.panel]                           Name für ?panel=<name> (setzen/entfernen beim Öffnen/Schließen)
 * @param {boolean} [p.peek]                           nicht modal, ohne Scrim (Variante für Listen)
 * @param {(e: KeyboardEvent) => void} [p.onTaste]     zusätzliche Tasten (Peek: J/K)
 */
export default function Sheet({ offen, onSchliessen, titel, unter, groesse = "md", vollseite, werkzeuge, fuss, ungespeichert = false, panel, peek = false, onTaste, className, testid, children }) {
  const ref = useRef(null);
  const id = useId();
  const titelId = `${id}-titel`;
  const schmal = useSchmal();
  const [rueckfrage, setRueckfrage] = useState(false);
  useDialogOffen(ref, offen, { modal: !peek, fokusAufDialog: true });

  // ?panel=<name> spiegeln
  useEffect(() => {
    if (!panel) return;
    if (offen) setzePanelInUrl(panel);
    else if (panelAusSuche(typeof window !== "undefined" ? window.location.search : "") === panel) setzePanelInUrl(null);
  }, [offen, panel]);

  const versucheSchliessen = useCallback(() => {
    if (ungespeichert) setRueckfrage(true);
    else onSchliessen?.();
  }, [ungespeichert, onSchliessen]);

  const ziehen = useZiehen({ aktiv: schmal, onSchliessen: versucheSchliessen });

  // Peek ist nicht modal: Esc selbst behandeln (der Browser schickt dort kein cancel).
  const onKeyDown = (e) => {
    if (rueckfrage) return;
    if (e.key === "Escape" && peek) {
      e.preventDefault();
      versucheSchliessen();
      return;
    }
    onTaste?.(e);
  };

  return (
    <>
      <dialog
        ref={ref}
        aria-labelledby={titelId}
        aria-modal={peek ? "false" : undefined}
        data-seite={schmal ? "unten" : undefined}
        data-peek={peek ? "true" : undefined}
        data-testid={testid}
        className={cx("bo-sheet bo-ov-sheet", className)}
        style={{ "--bo-ov-breite": `${breiteFuer(groesse, "sheet")}px` }}
        onCancel={(e) => {
          e.preventDefault();
          versucheSchliessen();
        }}
        onClick={(e) => {
          if (e.target === ref.current && !peek) versucheSchliessen();
        }}
        onKeyDown={onKeyDown}
      >
        {schmal && <div className="bo-ov-griff" aria-hidden="true" title={TEXTE.griff} {...ziehen} />}
        <header className="bo-ov-sheet__kopf" {...(schmal ? ziehen : {})}>
          <div className="bo-ov-sheet__titel">
            <h2 id={titelId}>{titel}</h2>
            {unter && <p>{unter}</p>}
          </div>
          <div className="bo-ov-sheet__werkzeuge">
            {werkzeuge}
            {vollseite && !schmal && <Werkzeug icon="Maximize2" label={TEXTE.sheet.vollseite} href={vollseite} testid="sheet-vollseite" />}
            <Werkzeug icon="X" label={TEXTE.schliessen} onClick={versucheSchliessen} testid="sheet-schliessen" />
          </div>
        </header>
        <div className="bo-ov-sheet__koerper">{offen ? children : null}</div>
        {fuss && <footer className="bo-ov-sheet__fuss">{fuss}</footer>}
      </dialog>
      {ungespeichert && (
        <Bestaetigen
          offen={rueckfrage}
          titel={TEXTE.ungespeichert.titel}
          text={TEXTE.ungespeichert.text}
          abbrechen={TEXTE.ungespeichert.weiter}
          bestaetigen={TEXTE.ungespeichert.verwerfen}
          gefaehrlich
          symbol={false}
          onAbbrechen={() => setRueckfrage(false)}
          onBestaetigen={() => {
            setRueckfrage(false);
            onSchliessen?.();
          }}
          testid="sheet-rueckfrage"
        />
      )}
    </>
  );
}

/**
 * Zustand einer Liste mit Peek-Vorschau. Leertaste auf einer Zeile öffnet (Q-F3), J/K/↑/↓ blättert im
 * Peek, die aktive Zeile trägt data-peek-aktiv (Fläche + Tinte-Kante), Fokus kehrt beim Schließen zur Zeile.
 * Verwendung: <tbody {...peek.listenProps}>{liste.map((x, i) => <tr {...peek.zeilenProps(i)} onClick={() => peek.oeffne(i)}>…)}</tbody>
 * @param {{anzahl: number, panel?: string}} p
 */
export function useListenPeek({ anzahl, panel } = {}) {
  const [zustand, setZustand] = useState({ offen: false, index: -1 });
  const listeId = useId();
  const indexRef = useRef(-1);
  const zeile = (i) => (typeof document === "undefined" ? null : document.querySelector(`[data-peek-liste="${CSS.escape(listeId)}"] [data-peek-index="${i}"]`));
  useEffect(() => {
    indexRef.current = zustand.index;
  }, [zustand.index]);

  const oeffne = useCallback((i) => setZustand({ offen: true, index: i }), []);
  const setzeIndex = useCallback((i) => setZustand((z) => ({ ...z, index: i })), []);
  const schliesse = useCallback(() => {
    setZustand((z) => ({ ...z, offen: false }));
    const z = zeile(indexRef.current);
    if (z) requestAnimationFrame(() => z.focus({ preventScroll: true }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const blaettere = useCallback((schritt) => setZustand((z) => ({ ...z, index: naechsterIndex(z.index, anzahl, schritt) })), [anzahl]);

  // Markierte Zeile mitscrollen
  useEffect(() => {
    if (!zustand.offen) return;
    zeile(zustand.index)?.scrollIntoView?.({ block: "nearest" });
  }, [zustand]); // eslint-disable-line react-hooks/exhaustive-deps

  const zeilenProps = (i) => ({
    "data-peek-index": i,
    "data-peek-aktiv": zustand.offen && zustand.index === i ? "true" : undefined,
    "aria-current": zustand.offen && zustand.index === i ? "true" : undefined,
    tabIndex: 0,
    onKeyDown: (e) => {
      if (e.target !== e.currentTarget || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === " ") {
        e.preventDefault();
        if (zustand.offen && zustand.index === i) schliesse();
        else oeffne(i);
      } else if (zustand.offen && (e.key === "j" || e.key === "J" || e.key === "k" || e.key === "K")) {
        e.preventDefault();
        const ziel = naechsterIndex(i, anzahl, e.key.toLowerCase() === "j" ? 1 : -1);
        setzeIndex(ziel);
        e.currentTarget.parentElement?.querySelector(`[data-peek-index="${ziel}"]`)?.focus({ preventScroll: false });
      } else if (zustand.offen && e.key === "Escape") {
        e.preventDefault();
        schliesse();
      }
    },
  });

  /** Props für das Element, das die Zeilen enthält (tbody, ul). */
  const listenProps = { "data-peek-liste": listeId };

  return { offen: zustand.offen, index: zustand.index, oeffne, schliesse, setzeIndex, blaettere, zeilenProps, listenProps, panel };
}

/**
 * Peek = Sheet-Variante für Listen. Bekommt den Listen-Zustand aus useListenPeek.
 * @param {object} p
 * @param {ReturnType<typeof useListenPeek>} p.peek
 * @param {Array<any>} p.eintraege
 * @param {(e: any) => import("react").ReactNode} p.titel
 * @param {(e: any) => import("react").ReactNode} [p.unter]
 * @param {(e: any) => string} [p.vollseite]
 * @param {(e: any) => import("react").ReactNode} [p.fuss]
 * @param {(e: any) => import("react").ReactNode} p.children
 */
export function Peek({ peek, eintraege, titel, unter, vollseite, fuss, groesse = "md", testid = "peek", children }) {
  const e = peek.index >= 0 ? eintraege[peek.index] : null;
  const n = eintraege.length;
  const onTaste = (ev) => {
    if (ev.target.closest?.("input, textarea, select, [contenteditable='true']")) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.key === "j" || ev.key === "J" || ev.key === "ArrowDown") {
      ev.preventDefault();
      peek.blaettere(1);
    } else if (ev.key === "k" || ev.key === "K" || ev.key === "ArrowUp") {
      ev.preventDefault();
      peek.blaettere(-1);
    }
  };
  return (
    <Sheet
      offen={peek.offen && !!e}
      onSchliessen={peek.schliesse}
      titel={e ? titel(e) : ""}
      unter={e && unter ? unter(e) : undefined}
      vollseite={e && vollseite ? vollseite(e) : undefined}
      groesse={groesse}
      panel={peek.panel}
      peek
      onTaste={onTaste}
      testid={testid}
      werkzeuge={
        <>
          <span className="bo-ov-sheet__position" aria-live="polite" data-testid="peek-position">
            {TEXTE.sheet.position(peek.index + 1, n)}
          </span>
          <Werkzeug icon="ChevronUp" label={`${TEXTE.sheet.vorige} (K)`} onClick={() => peek.blaettere(-1)} disabled={peek.index <= 0} testid="peek-zurueck" />
          <Werkzeug icon="ChevronDown" label={`${TEXTE.sheet.naechste} (J)`} onClick={() => peek.blaettere(1)} disabled={peek.index >= n - 1} testid="peek-weiter" />
        </>
      }
      fuss={e && fuss ? fuss(e) : undefined}
    >
      {e ? children(e) : null}
    </Sheet>
  );
}
