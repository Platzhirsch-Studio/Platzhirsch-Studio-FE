"use client";
// Befehlspalette v2 (G-26, Q-F2): Strg/⌘+K oder runder Such-Knopf. Material-Fenster (Radius 28,
// blur 40) mit Pillen-Suchfeld; Präfixe > / # @ ? werden zum Token-Chip (Aktionen, Bereiche, Nummer,
// Person, Hilfe); Beträge („1.234,50“) werden erkannt; Enter wartet bis 600 ms auf den ersten Treffer;
// auf einem Datensatz steht oben die Gruppe „Dieser Datensatz“. Quelle: GET /api/suche (serverseitig
// nach Rechten gefiltert), Hilfe-Artikel über /hilfe/inhalt. Kombinationsfeld nach WAI-ARIA.

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Icon } from "../icons";
import cx from "../cx";
import { anzeige } from "@/lib/backoffice/labels";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { TEXTE } from "./texte";
import { datensatzAusPfad, filtereGruppen, zerlegeEingabe } from "./logik";

export { PRAEFIXE, datensatzAusPfad, filtereGruppen, zerlegeEingabe } from "./logik";

export const PALETTE_EREIGNIS = "ph-bo:palette";

/** Palette öffnen, ohne die Shell zu kennen (Such-Knopf, Scanner-Code außerhalb von Feldern). */
export function oeffnePalette(start = "") {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(PALETTE_EREIGNIS, { detail: { start } }));
}

export default function Befehlspalette({ aus = false }) {
  const router = useRouter();
  const pfad = usePathname();
  const dialog = useRef(null);
  const eingabe = useRef(null);
  const [offen, setOffen] = useState(false);
  const [roh, setRoh] = useState("");
  const [gruppen, setGruppen] = useState([]);
  const [aktiv, setAktiv] = useState(0);
  const [laedt, setLaedt] = useState(false);
  const [hinweis, setHinweis] = useState("");
  const listboxId = useId();
  const abbruch = useRef(null);
  const wartend = useRef(false);

  const { praefix, text, betrag } = zerlegeEingabe(roh);

  const oeffnen = useCallback(
    (start = "") => {
      if (aus) return;
      setRoh(start);
      setGruppen([]);
      setAktiv(0);
      setHinweis("");
      setOffen(true);
    },
    [aus]
  );
  useEffect(() => {
    const h = (e) => oeffnen(typeof e.detail?.start === "string" ? e.detail.start : "");
    window.addEventListener(PALETTE_EREIGNIS, h);
    return () => window.removeEventListener(PALETTE_EREIGNIS, h);
  }, [oeffnen]);

  useKuerzel("global", { "global.palette": () => (offen ? setOffen(false) : oeffnen()) }, { aktiv: !aus });
  // Solange die Palette offen ist, überdeckt der modale Kontext die Seiten-Kürzel.
  useKuerzel("palette", {}, { aktiv: offen });

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (offen && !d.open) {
      d.showModal();
      requestAnimationFrame(() => eingabe.current?.focus());
    }
    if (!offen && d.open) d.close();
  }, [offen]);

  const lade = useCallback(async (q, p) => {
    abbruch.current?.abort();
    const ac = new AbortController();
    abbruch.current = ac;
    setLaedt(true);
    try {
      const anfragen = [];
      if (p !== "?") anfragen.push(fetch(`/api/suche?q=${encodeURIComponent(q)}`, { signal: ac.signal, headers: { Accept: "application/json" } }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))));
      else anfragen.push(Promise.resolve({ gruppen: [] }));
      if (p === "?" || (q.length >= 3 && !p)) {
        anfragen.push(
          fetch(`/hilfe/inhalt?q=${encodeURIComponent(q)}`, { signal: ac.signal, headers: { Accept: "application/json" } })
            .then((r) => (r.ok ? r.json() : { treffer: [] }))
            .catch(() => ({ treffer: [] }))
        );
      }
      const [suche, hilfe] = await Promise.all(anfragen);
      const g = [...(suche.gruppen || [])];
      if (hilfe?.treffer?.length) g.push({ titel: TEXTE.gruppeHilfe, eintraege: hilfe.treffer.map((t) => ({ titel: t.titel, hinweis: t.bereich, href: t.href })) });
      setGruppen(g);
      setAktiv(0);
    } catch (err) {
      if (err?.name !== "AbortError") setGruppen([{ titel: TEXTE.paletteFehler, eintraege: [] }]);
    } finally {
      if (abbruch.current === ac) setLaedt(false);
    }
  }, []);

  useEffect(() => {
    if (!offen) return undefined;
    const t = setTimeout(() => lade(text.trim(), praefix), text ? 180 : 0);
    return () => clearTimeout(t);
  }, [text, praefix, offen, lade]);

  const datensatz = datensatzAusPfad(pfad);
  const eigene = datensatz && !praefix && !text
    ? [{
        titel: TEXTE.gruppeDieserDatensatz,
        eintraege: [
          { titel: TEXTE.zurListe, href: `/d/${datensatz.slug}`, symbol: "ArrowLeft" },
          { titel: TEXTE.nummerKopieren(datensatz.name), kopieren: datensatz.name, symbol: "Paperclip" },
        ],
      }]
    : [];
  const sichtbar = [...eigene, ...filtereGruppen(gruppen, praefix)].filter((g) => g.eintraege.length || g.titel === TEXTE.paletteFehler);
  let lauf = 0;
  const nummeriert = sichtbar.map((g) => ({ ...g, eintraege: g.eintraege.map((e) => ({ ...e, i: lauf++ })) }));
  const flach = nummeriert.flatMap((g) => g.eintraege.map((e) => ({ ...e, gruppe: g.titel })));

  const ausfuehren = useCallback(
    (e) => {
      if (!e) return;
      if (e.kopieren) {
        navigator.clipboard?.writeText(e.kopieren).catch(() => {});
        setHinweis(TEXTE.nummerKopiert);
        return;
      }
      if (!e.href) return;
      setOffen(false);
      router.push(e.href);
    },
    [router]
  );

  // Enter, solange noch gesucht wird: bis 600 ms auf den ersten Treffer warten.
  useEffect(() => {
    if (!wartend.current || laedt) return;
    wartend.current = false;
    ausfuehren(flach[0]);
  });

  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAktiv((a) => Math.min(flach.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAktiv((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (laedt && !flach.length) {
        wartend.current = true;
        setTimeout(() => {
          wartend.current = false;
        }, 600);
        return;
      }
      ausfuehren(flach[aktiv]);
    } else if (e.key === "Backspace" && praefix && !text) {
      e.preventDefault();
      setRoh("");
    }
  };

  return (
    <dialog
      ref={dialog}
      className="bo-dialog bo-schale-palette"
      aria-label={TEXTE.palette}
      onClose={() => setOffen(false)}
      onClick={(e) => {
        if (e.target === dialog.current) setOffen(false);
      }}
      data-testid="palette"
    >
      <div className="bo-schale-palette__feld">
        <Icon name="Search" className="size-5 shrink-0 text-bo-text-soft" />
        {praefix && (
          <button type="button" className="bo-schale-token" onClick={() => setRoh(text)} aria-label={TEXTE.praefixEntfernen(TEXTE.praefixe[praefix])}>
            <span aria-hidden="true">{praefix}</span> {TEXTE.praefixe[praefix]}
            <Icon name="X" className="size-3" />
          </button>
        )}
        {betrag && <span className="bo-schale-token bo-schale-token--ruhig">€ {betrag}</span>}
        <input
          ref={eingabe}
          role="combobox"
          aria-expanded="true"
          aria-controls={listboxId}
          aria-activedescendant={flach[aktiv] ? `${listboxId}-${aktiv}` : undefined}
          aria-autocomplete="list"
          aria-label={TEXTE.paletteLabel}
          value={praefix ? text : roh}
          onChange={(e) => setRoh(praefix ? `${praefix}${e.target.value}` : e.target.value)}
          onKeyDown={onKey}
          placeholder={TEXTE.palettePlatzhalter}
          className="bo-schale-palette__eingabe"
          autoComplete="off"
          spellCheck={false}
          data-testid="palette-eingabe"
        />
        {laedt && <span className="bo-spinner text-bo-text-faint" aria-hidden="true" />}
        <kbd className="bo-schale-kappe">{TEXTE.esc}</kbd>
      </div>
      <ul id={listboxId} role="listbox" aria-label={TEXTE.palette} className="bo-schale-palette__liste">
        {flach.length === 0 && (
          <li className="bo-schale-leer" role="presentation">
            {laedt ? TEXTE.paletteSucht : sichtbar.some((g) => g.titel === TEXTE.paletteFehler) ? TEXTE.paletteFehler : TEXTE.paletteLeer}
          </li>
        )}
        {nummeriert.map((g) =>
          g.eintraege.length ? (
            <li key={g.titel} role="presentation" className="bo-schale-palette__gruppe">
              <p className="bo-schale-gruppentitel" aria-hidden="true">
                {g.titel}
              </p>
              <ul role="group" aria-label={g.titel}>
                {g.eintraege.map((e) => {
                  const { i } = e;
                  return (
                    <li
                      key={`${g.titel}-${e.href || e.kopieren}-${e.titel}`}
                      id={`${listboxId}-${i}`}
                      role="option"
                      aria-selected={i === aktiv}
                      onMouseMove={() => i !== aktiv && setAktiv(i)}
                      onClick={() => ausfuehren(e)}
                      className={cx("bo-schale-zeile bo-schale-zeile--option", i === aktiv && "is-aktiv")}
                    >
                      <span className="bo-schale-symbol" aria-hidden="true">
                        <Icon name={e.symbol || (g.titel === "Datensätze" ? "FileText" : g.titel === "Aktionen" ? "Plus" : g.titel === TEXTE.gruppeHilfe ? "LifeBuoy" : "ArrowRight")} className="size-4" />
                      </span>
                      <span className="bo-schale-zeile__titel min-w-0 flex-1 truncate">{g.titel === "Datensätze" ? e.titel : anzeige(e.titel)}</span>
                      {e.hinweis && <span className="bo-schale-klein max-w-[45%] shrink-0 truncate">{anzeige(e.hinweis)}</span>}
                    </li>
                  );
                })}
              </ul>
            </li>
          ) : null
        )}
      </ul>
      <p className="bo-schale-palette__fuss" aria-live="polite">
        {hinweis || (betrag ? TEXTE.paletteBetrag(betrag) : TEXTE.paletteHinweis)}
      </p>
    </dialog>
  );
}
