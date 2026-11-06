"use client";
import { useEffect, useId, useRef, useState } from "react";
import cx from "../cx";
import { Icon } from "../icons";
import { MONATE, WOCHENTAGE_KURZ, alsIso, ausIso, isoZuDeutsch, monatsRaster, parseDatum, parseZeit, verschiebe } from "@/lib/backoffice/datum";

/**
 * Deutsches Datumsfeld: Eingabe TT.MM.JJJJ (frei tippbar: „4.11.“, „041126“, „heute“, „+3“),
 * Kalender-Popover (Wochenstart Montag) per Knopf oder ↓/Alt+↓, Tastatur im Kalender
 * (Pfeile Tag/Woche, Bild↑/↓ Monat, Umschalt+Bild↑/↓ Jahr, Pos1/Ende Wochenanfang/-ende,
 * Enter wählt, Esc schließt). Der Wert ist immer ISO („JJJJ-MM-TT“, mit `mitZeit`
 * „JJJJ-MM-TT HH:MM“) – nie die Anzeigeform. Mit `name` liegt der ISO-Wert zusätzlich in
 * einem versteckten Feld (für GET-/FormData-Formulare).
 *
 * Gesteuert (`value` + `onChange`) oder ungesteuert (`defaultValue`).
 * @param {{id?:string, name?:string, value?:string, defaultValue?:string, onChange?:(iso:string)=>void, mitZeit?:boolean,
 *  zeitLabel?:string, gruppeLabelId?:string, disabled?:boolean, required?:boolean, invalid?:boolean, describedBy?:string, kompakt?:boolean,
 *  className?:string, "aria-label"?:string}} props
 */
export default function Datumsfeld({ id, name, value, defaultValue = "", onChange, mitZeit = false, zeitLabel = "Uhrzeit", gruppeLabelId, disabled = false, required = false, invalid = false, describedBy, kompakt = false, className, "aria-label": ariaLabel }) {
  const eigeneId = useId();
  const feldId = id || `${eigeneId}-datum`;
  const fehlerId = `${feldId}-format`;
  const [intern, setIntern] = useState(defaultValue);
  const wert = normalisiere(value !== undefined ? value : intern);
  const isoDatum = wert.slice(0, 10);
  const zeit = mitZeit ? wert.slice(11, 16) : "";

  const [text, setText] = useState(isoZuDeutsch(isoDatum));
  const [zeitText, setZeitText] = useState(zeit);
  const [vorher, setVorher] = useState(wert);
  const [formatFehler, setFormatFehler] = useState(false);
  const [offen, setOffen] = useState(false);
  const wrap = useRef(null);
  const eingabe = useRef(null);

  // Wert von außen geändert: Anzeige während des Renders nachziehen (kein Effekt).
  if (vorher !== wert) {
    setVorher(wert);
    setText(isoZuDeutsch(isoDatum));
    setZeitText(zeit);
    setFormatFehler(false);
  }

  const melde = (datumIso, zeitWert = zeit) => {
    const neu = !datumIso ? "" : mitZeit ? `${datumIso} ${zeitWert || "00:00"}` : datumIso;
    setVorher(neu);
    if (value === undefined) setIntern(neu);
    onChange?.(neu);
  };

  const uebernehmeText = (eingabeText) => {
    const t = eingabeText;
    // Mit Uhrzeit: „04.11.2026 10:00“ oder „2026-11-04T10:00“ im Datumsfeld → Datum + Zeit übernehmen.
    if (mitZeit) {
      const m = /^(.+?)[ T](\d{1,2}:\d{2})(?::\d{2})?$/.exec(String(t).trim());
      if (m) {
        const iso = parseDatum(m[1]);
        const z = parseZeit(m[2]);
        if (iso && z) {
          setFormatFehler(false);
          setText(isoZuDeutsch(iso));
          setZeitText(z);
          if (iso !== isoDatum || z !== zeit) melde(iso, z);
          return;
        }
      }
    }
    const iso = parseDatum(t);
    if (iso === null) {
      setFormatFehler(true);
      return;
    }
    setFormatFehler(false);
    setText(isoZuDeutsch(iso));
    if (iso !== isoDatum) melde(iso);
  };

  useEffect(() => {
    if (!offen) return;
    const h = (e) => wrap.current && !wrap.current.contains(e.target) && setOffen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [offen]);

  const beschr = [describedBy, formatFehler ? fehlerId : null].filter(Boolean).join(" ") || undefined;
  const hoehe = kompakt ? "min-h-8 py-1 text-sm" : "";

  return (
    <div ref={wrap} className={cx("relative min-w-0", className)} role={mitZeit && gruppeLabelId ? "group" : undefined} aria-labelledby={mitZeit && gruppeLabelId ? gruppeLabelId : undefined}>
      {name && <input type="hidden" name={name} value={wert} />}
      <div className="flex min-w-0 gap-2">
        <div className="relative flex min-w-0 flex-1">
          <input
            ref={eingabe}
            id={feldId}
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="TT.MM.JJJJ"
            value={text}
            disabled={disabled}
            required={required}
            aria-label={ariaLabel}
            aria-invalid={invalid || formatFehler || undefined}
            aria-describedby={beschr}
            onChange={(e) => {
              setText(e.target.value);
              if (formatFehler) setFormatFehler(false);
              // Vollständig getippt → sofort übernehmen (Formular merkt die Änderung).
              if (/^\d{2}\.\d{2}\.\d{4}$/.test(e.target.value)) {
                const iso = parseDatum(e.target.value);
                if (iso && iso !== isoDatum) melde(iso);
              }
              if (!e.target.value && isoDatum) melde("");
            }}
            onBlur={(e) => uebernehmeText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" && (e.altKey || !text)) {
                e.preventDefault();
                setOffen(true);
              } else if (e.key === "Enter") {
                // Erst übernehmen, dann (nach dem Rendern) das Formular absenden – sonst ginge der alte Wert mit.
                const form = e.currentTarget.form;
                uebernehmeText(e.currentTarget.value);
                if (form) {
                  e.preventDefault();
                  requestAnimationFrame(() => form.requestSubmit());
                }
              } else if (e.key === "Escape" && offen) {
                setOffen(false);
              }
            }}
            className={cx("bo-input pr-11 tabular-nums", hoehe)}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOffen((o) => !o)}
            aria-label="Kalender öffnen"
            aria-haspopup="dialog"
            aria-expanded={offen}
            className="bo-motion bo-ziel absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-bo-text-soft transition-colors duration-150 hover:bg-bo-fill-2 hover:text-bo-text disabled:pointer-events-none disabled:text-bo-text-faint"
          >
            <Icon name="Calendar" className="size-4" />
          </button>
        </div>
        {mitZeit && (
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="HH:MM"
            aria-label={zeitLabel}
            value={zeitText}
            disabled={disabled}
            onChange={(e) => setZeitText(e.target.value)}
            onBlur={(e) => {
              const z = parseZeit(e.target.value);
              if (z === null) return setZeitText(zeit);
              setZeitText(z);
              if (isoDatum && z !== zeit) melde(isoDatum, z);
            }}
            onKeyDown={(e) => {
              if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
              e.preventDefault();
              const z = parseZeit(zeitText) || "00:00";
              const [h, m] = z.split(":").map(Number);
              let min = (h * 60 + m + (e.key === "ArrowUp" ? 15 : -15) + 1440) % 1440;
              min = Math.round(min / 15) * 15 % 1440;
              const neu = `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
              setZeitText(neu);
              if (isoDatum) melde(isoDatum, neu);
            }}
            className={cx("bo-input w-[5.5rem] shrink-0 text-center tabular-nums", hoehe)}
          />
        )}
      </div>
      {formatFehler && (
        <p id={fehlerId} className="mt-1 text-xs text-bo-danger">
          Datum im Format TT.MM.JJJJ
        </p>
      )}
      {offen && (
        <Kalender
          wert={isoDatum}
          onWahl={(iso) => {
            setText(isoZuDeutsch(iso));
            setFormatFehler(false);
            melde(iso);
            setOffen(false);
            eingabe.current?.focus();
          }}
          onLeeren={() => {
            setText("");
            melde("");
            setOffen(false);
            eingabe.current?.focus();
          }}
          onSchliessen={() => {
            setOffen(false);
            eingabe.current?.focus();
          }}
        />
      )}
    </div>
  );
}

function normalisiere(v) {
  // "2026-11-04T09:30" (datetime-local, Default „Now“) → "2026-11-04 09:30"
  return String(v ?? "").replace("T", " ");
}

/** Kalender-Popover (Raster 6×7, roving tabindex). */
function Kalender({ wert, onWahl, onLeeren, onSchliessen }) {
  const heute = alsIso(new Date());
  const [fokus, setFokus] = useState(wert || heute);
  const raster = useRef(null);
  const titelId = useId();
  const d = ausIso(fokus) || new Date();
  const jahr = d.getFullYear();
  const monat = d.getMonth();
  const tage = monatsRaster(jahr, monat);

  useEffect(() => {
    raster.current?.querySelector(`[data-iso="${fokus}"]`)?.focus();
  }, [fokus]);

  const taste = (e) => {
    const schritte = { ArrowLeft: { tage: -1 }, ArrowRight: { tage: 1 }, ArrowUp: { tage: -7 }, ArrowDown: { tage: 7 }, PageUp: e.shiftKey ? { monate: -12 } : { monate: -1 }, PageDown: e.shiftKey ? { monate: 12 } : { monate: 1 } };
    if (schritte[e.key]) {
      e.preventDefault();
      setFokus(verschiebe(fokus, schritte[e.key]));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const wt = ((ausIso(fokus) || new Date()).getDay() + 6) % 7;
      setFokus(verschiebe(fokus, { tage: e.key === "Home" ? -wt : 6 - wt }));
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onSchliessen();
    }
  };

  return (
    <div role="dialog" aria-modal="false" aria-labelledby={titelId} className="bo-pop absolute left-0 top-full z-40 mt-2 w-[18rem] max-w-[calc(100vw-2rem)] rounded-bo-karte bg-bo-surface p-3 shadow-(--bo-sh-float)" onKeyDown={taste}>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => setFokus(verschiebe(fokus, { monate: -1 }))} aria-label="Vorheriger Monat" className="inline-flex size-8 items-center justify-center rounded-full text-bo-text-soft hover:bg-bo-fill-2 hover:text-bo-text">
          <Icon name="ChevronLeft" className="size-4" />
        </button>
        <p id={titelId} className="text-sm font-medium" aria-live="polite">
          {MONATE[monat]} {jahr}
        </p>
        <button type="button" onClick={() => setFokus(verschiebe(fokus, { monate: 1 }))} aria-label="Nächster Monat" className="inline-flex size-8 items-center justify-center rounded-full text-bo-text-soft hover:bg-bo-fill-2 hover:text-bo-text">
          <Icon name="ChevronRight" className="size-4" />
        </button>
      </div>
      <table ref={raster} role="grid" aria-labelledby={titelId} className="w-full border-collapse text-center text-sm">
        <thead>
          <tr>
            {WOCHENTAGE_KURZ.map((w) => (
              <th key={w} scope="col" className="pb-1 text-[11px] font-medium text-bo-text-faint">
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, r) => (
            <tr key={r}>
              {tage.slice(r * 7, r * 7 + 7).map((t) => {
                const gewaehlt = t.iso === wert;
                return (
                  <td key={t.iso} role="gridcell" aria-selected={gewaehlt} className="p-0.5">
                    <button
                      type="button"
                      data-iso={t.iso}
                      tabIndex={t.iso === fokus ? 0 : -1}
                      aria-current={t.iso === heute ? "date" : undefined}
                      aria-label={isoZuDeutsch(t.iso)}
                      onClick={() => onWahl(t.iso)}
                      className={cx(
                        "bo-motion inline-flex size-9 items-center justify-center rounded-full tabular-nums transition-colors duration-150",
                        gewaehlt ? "bg-bo-action font-medium text-bo-action-text shadow-(--bo-sh-ink)" : "hover:bg-bo-fill-2",
                        !gewaehlt && !t.imMonat && "text-bo-text-faint",
                        !gewaehlt && t.iso === heute && "ring-1 ring-inset ring-bo-line-control"
                      )}
                    >
                      {t.tag}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex items-center justify-between pt-1 text-[13px]">
        <button type="button" onClick={() => onWahl(heute)} className="h-8 rounded-pill px-3 font-medium hover:bg-bo-fill-2">
          Heute
        </button>
        <button type="button" onClick={onLeeren} className="h-8 rounded-pill px-3 text-bo-text-soft hover:bg-bo-fill-2 hover:text-bo-text">
          Leeren
        </button>
      </div>
    </div>
  );
}
