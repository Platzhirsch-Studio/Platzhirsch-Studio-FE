"use client";
// src/components/Katalog/ShopGrid.js
// Filter-, Sortier- und Raster-Insel der Shop-Liste (Accessoire-Welt).
//   - Erste Seite (48 Kacheln) kommt fertig vom Server (initial) → LCP/CLS wie
//     eine statische Seite, Crawler sehen Kacheln und Links.
//   - Der kompakte Index (/api/katalog/accessoires, ≈ 36 KB gzip, statisch)
//     wird erst bei der ersten Filter-/Sortier-/„Weitere laden“-Aktion geholt
//     (oder sofort, wenn die URL schon Filter trägt: Zurück-Navigation).
//   - Filterleiste klebt unter dem Header: Desktop je Facette ein Aufklapper
//     (<details>, Checkboxen mit Zählung), Telefon ein Knopf „Filter“ mit
//     <dialog> (showModal = Fokusfalle + Escape). Sortierung = natives <select>.
//   - Zustand in der URL (?marke=…&preis=…&sort=…) per replaceState: kein
//     Neuladen, „Produkt → zurück“ landet wieder auf derselben Auswahl.
//   - Trefferzahl in einer aria-live-Region; Chips der aktiven Filter mit „×“.
// Logik: lib/katalog/shopListe.js (importfrei, lädt nie die Katalogdaten).
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { useDelegatedNavigation } from "@/components/Reusable/LinkDelegate";
import AuswahlFeld from "@/components/Shop/AuswahlFeld";
import ShopKachel, { RASTER_LISTE } from "./ShopKachel";
import { FACETTEN, SEITE, auswahlAusQuery, facetten, filtern, hatAuswahl, leereAuswahl, mischen, queryAus, sortieren } from "@/lib/katalog/shopListe";

// Index einmal je Seitenaufruf (alle Inseln teilen ihn).
let indexPromise = null;
function ladeIndex(url) {
  if (!indexPromise)
    indexPromise = fetch(url, { credentials: "omit" })
      .then((r) => {
        if (!r.ok) throw new Error(`index ${r.status}`);
        return r.json();
      })
      .catch((err) => {
        indexPromise = null;
        throw err;
      });
  return indexPromise;
}

const noSubscribe = () => () => {};
const readSearch = () => window.location.search;
const serverSearch = () => "";

const fill = (s, o) => Object.entries(o).reduce((t, [k, v]) => t.replace(`{${k}}`, v), s);

// Filter-Dialog (Telefon) gleitet von rechts herein und wieder hinaus (translate; allow-discrete hält
// ihn beim Schließen im Top-Layer), Hintergrund blendet; ruhig (motion-reduce) = sofort.
const DIALOG_MOTION =
  "m-0 ml-auto h-dvh max-h-dvh w-full max-w-md translate-x-0 bg-surface p-0 text-text backdrop:bg-ink-deep/40 " +
  "transition-[translate,display,overlay] transition-discrete duration-(--duration-ui) ease-quiet starting:open:translate-x-full " +
  "not-open:translate-x-full not-open:duration-(--duration-exit) not-open:ease-exit " +
  "backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete backdrop:duration-(--duration-ui) starting:open:backdrop:opacity-0 not-open:backdrop:opacity-0 " +
  "motion-reduce:transition-none motion-reduce:backdrop:transition-none";

/**
 * @param {{
 *   locale: string, indexUrl: string, produktBase: string,
 *   scope: { key: "kategorie"|"marke"|null, value: string|null }, gruppe: "m"|"k",
 *   initial: object[], total: number, offset: number,
 *   startFacetten: Record<string, Array<{value: string, count: number}>>,
 *   labels: Record<string, Record<string, string>>, copy: Record<string, any>
 * }} props
 */
export default function ShopGrid({ locale, indexUrl, produktBase, scope, gruppe, initial, total, offset, startFacetten, labels, copy }) {
  const [index, setIndex] = useState(null);
  const [fehler, setFehler] = useState(false);
  const [angefragt, setAngefragt] = useState(false);
  // null = Besucher hat noch nichts gewählt → Auswahl aus der URL (Zurück-Navigation, geteilte Links)
  const [eigen, setEigen] = useState(null);
  const [anzahl, setAnzahl] = useState(SEITE);
  const dialogRef = useRef(null);
  const barRef = useRef(null);
  const delegate = useDelegatedNavigation();
  const gruppen = FACETTEN.filter((k) => k !== scope.key);

  // URL ohne Router-Abo lesen (Server und Hydration: "" = Server-HTML bleibt gültig; Muster aus ShopCatalog).
  const search = useSyncExternalStore(noSubscribe, readSearch, serverSearch);
  const ausUrl = useMemo(() => {
    const erlaubt = Object.fromEntries(gruppen.map((k) => [k, (startFacetten[k] || []).map((o) => o.value)]));
    return auswahlAusQuery(search, erlaubt);
    // gruppen folgt aus scope.key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, startFacetten, scope.key]);
  const sel = eigen?.sel ?? ausUrl.sel;
  const sort = eigen?.sort ?? ausUrl.sort;
  const brauchtIndex = angefragt || hatAuswahl(sel) || sort !== "empfohlen";

  // Index holen, sobald er gebraucht wird (setState nur im Promise-Callback).
  useEffect(() => {
    if (!brauchtIndex || index || fehler) return undefined;
    let aktiv = true;
    ladeIndex(indexUrl)
      .then((d) => {
        if (!aktiv) return;
        const items = scope.key ? d.items.filter((e) => (scope.key === "marke" ? e.m : e.k) === scope.value) : d.items;
        setIndex(mischen(items, gruppe));
      })
      .catch(() => aktiv && setFehler(true));
    return () => {
      aktiv = false;
    };
  }, [brauchtIndex, index, fehler, indexUrl, scope.key, scope.value, gruppe]);
  const status = fehler ? "fehler" : brauchtIndex && !index ? "laden" : "idle";
  const holen = useCallback(() => {
    setAngefragt(true);
    setFehler(false);
  }, []);

  // Zustand → URL (ohne Neuladen, ohne Scroll).
  const schreibeUrl = (s, so) => {
    try {
      const q = queryAus(s, so, window.location.search);
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${q}${window.location.hash}`);
    } catch {
      /* ohne History-API: nur Anzeige */
    }
  };

  const setzeAuswahl = (next) => {
    setEigen({ sel: next, sort });
    setAnzahl(SEITE);
    schreibeUrl(next, sort);
    holen();
  };
  const toggle = (key, value) => {
    const cur = sel[key] || [];
    setzeAuswahl({ ...sel, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] });
  };
  const zuruecksetzen = () => setzeAuswahl(leereAuswahl());
  const setzeSort = (so) => {
    setEigen({ sel, sort: so });
    setAnzahl(SEITE);
    schreibeUrl(sel, so);
    holen();
  };

  // Offene Aufklapper schließen bei Klick daneben oder Escape.
  useEffect(() => {
    const zu = (e) => {
      if (e.type === "keydown" && e.key !== "Escape") return;
      barRef.current?.querySelectorAll("details[open]").forEach((d) => {
        if (e.type === "keydown" || !d.contains(e.target)) {
          d.open = false;
          if (e.type === "keydown" && d.contains(document.activeElement)) d.querySelector("summary")?.focus();
        }
      });
    };
    document.addEventListener("pointerdown", zu);
    document.addEventListener("keydown", zu);
    return () => {
      document.removeEventListener("pointerdown", zu);
      document.removeEventListener("keydown", zu);
    };
  }, []);

  const aktiv = hatAuswahl(sel) || sort !== "empfohlen";
  const treffer = useMemo(() => (index ? sortieren(filtern(index, sel), sort, locale) : null), [index, sel, sort, locale]);
  const fac = useMemo(() => (index ? facetten(index, sel) : startFacetten), [index, sel, startFacetten]);
  // Unverändert sortiert und ungefiltert: ab der Seite weiterzählen, auf der man ist (/seite/n).
  const start = aktiv ? 0 : offset;
  // Solange der Index lädt (z. B. ?sort=… beim Aufruf), bleibt die erste Seite aus dem
  // Server-HTML stehen (aria-busy, abgeblendet) – kein leeres Raster, kein Layoutsprung.
  const wartet = !treffer && aktiv && status === "laden";
  const sichtbar = treffer ? treffer.slice(start, start + anzahl) : aktiv && !wartet ? [] : initial;
  const gesamt = treffer ? treffer.length : total;
  const nochMehr = treffer ? start + anzahl < gesamt : offset + initial.length < total;
  const aktiveChips = gruppen.flatMap((k) => (sel[k] || []).map((v) => ({ k, v, label: labelOf(k, v) })));
  const zahl = (n) => (n === 1 ? copy.treffer1 : fill(copy.treffer, { n: n.toLocaleString(locale === "de" ? "de-AT" : locale) }));

  function labelOf(k, v) {
    if (k === "preis") return copy.preisStufen[v] || v;
    return labels[k]?.[v] || v;
  }

  const optionen = (k) => (fac[k] || []).filter((o) => o.count > 0 || sel[k]?.includes(o.value));
  const sichtbareGruppen = gruppen.filter((k) => optionen(k).length >= 2 || sel[k]?.length);

  // Funktion, keine Komponente: sonst würde die Liste bei jedem Klick neu montiert (Fokus ginge verloren).
  const optionenListe = (k, idPrefix) => (
    <ul className="flex flex-col">
      {optionen(k).map((o) => {
        const id = `${idPrefix}-${k}-${o.value}`;
        const an = sel[k]?.includes(o.value) || false;
        return (
          <li key={o.value}>
            <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 py-1 text-body text-text">
              <input id={id} type="checkbox" checked={an} onChange={() => toggle(k, o.value)} className="size-5 shrink-0 accent-(--color-ink)" />
              <span className="flex-1">{labelOf(k, o.value)}</span>
              {/* Proportionale Ziffern wie der übrige Text (Optik-QA r3: tabular wirkte im Sheet wie eine Monospace-Schrift). */}
              <span className="text-small text-text-soft">{o.count}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );

  const anzahlAktiv = aktiveChips.length;

  return (
    // @container: Raster und Filterleiste richten sich nach der Breite in rem – bei 200 % Textzoom einspaltig,
    // Sortierfeld in voller Breite (Optik-QA r3: zwei Spalten mit „AusführungenAusführungen“, Sortierung „Er“).
    <div className="@container" data-kat-shopgrid={scope.value || "alle"}>
      {/* Filterleiste: klebt unter dem Header, volle Breite der Spalte. Bei niedriger Höhe (Telefon quer,
          ≤ 500 px) nicht: Header + Leiste nähmen sonst 30 % der Höhe ein (Optik-QA r1). */}
      <div ref={barRef} className="sticky top-header z-(--z-sticky) [@media(max-height:500px)]:static -mx-gutter border-y border-line bg-surface px-gutter lg:mx-0 lg:px-0" data-kat-filterleiste="">
        {/* Deckend (Optik-QA r3: durch die halbtransparente Leiste schienen die Produktbilder). */}
        <div className="flex min-h-14 flex-wrap items-center gap-2 py-1">
          <button
            type="button"
            className="ph-press inline-flex min-h-11 items-center gap-2 border border-line-strong px-3 text-ui text-text transition-colors duration-(--duration-micro) ease-quiet hover:border-ink lg:hidden"
            onClick={() => {
              holen();
              dialogRef.current?.showModal();
            }}
            aria-haspopup="dialog"
            data-kat-filter-knopf=""
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" strokeWidth={1.5} />
            {copy.filter}
            {anzahlAktiv > 0 && <span className="tabular">({anzahlAktiv})</span>}
          </button>
          <div className="hidden flex-wrap items-center gap-1 lg:flex">
            {sichtbareGruppen.map((k) => (
              <details key={k} name="kat-filter" className="group relative" onToggle={(e) => e.currentTarget.open && holen()}>
                <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 px-3 text-ui text-text transition-colors duration-(--duration-micro) hover:bg-ink/5 [&::-webkit-details-marker]:hidden">
                  {copy.gruppen[k]}
                  {sel[k]?.length > 0 && <span className="tabular">({sel[k].length})</span>}
                  <ChevronDown aria-hidden="true" className="size-4 text-text-soft transition-transform duration-(--duration-micro) ease-quiet group-open:rotate-180 motion-reduce:transition-none" strokeWidth={1.5} />
                </summary>
                {/* Aufklappen: Panel setzt sich 4 px von oben (nur opacity/transform, @starting-style); ruhig = sofort. */}
                <div className="absolute top-full left-0 z-10 mt-1 max-h-[60vh] w-72 overflow-y-auto border border-line bg-surface p-3 shadow-[0_12px_32px_rgb(31_37_43/0.12)] transition-[opacity,translate] duration-(--duration-micro) ease-quiet starting:-translate-y-1 starting:opacity-0 motion-reduce:transition-none">
                  <fieldset>
                    <legend className="sr-only">{copy.gruppen[k]}</legend>
                    {optionenListe(k, "d")}
                  </fieldset>
                </div>
              </details>
            ))}
          </div>
          <div className="ml-auto flex min-w-0 items-center gap-3 @max-[18rem]:ml-0 @max-[18rem]:w-full">
            <p className="hidden text-small text-text-soft tabular sm:block" aria-live="polite" data-kat-treffer="">
              {status === "laden" && aktiv ? copy.laden : zahl(gesamt)}
            </p>
            <label className="flex min-w-0 items-center gap-2 text-small text-text-soft @max-[18rem]:w-full">
              <span className="sr-only sm:not-sr-only">{copy.sortieren}</span>
              {/* Eckig auch in WebKit (Optik-QA r2: iOS zeigte grauen Grund, runde Ecken, schwarzes Dreieck). */}
              <AuswahlFeld wrapClassName="@max-[18rem]:w-full" value={sort} onChange={(e) => setzeSort(e.target.value)} className="min-h-11 border border-line-strong pl-2 text-ui text-text" data-kat-sort="">
                {Object.entries(copy.sort).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </AuswahlFeld>
            </label>
          </div>
        </div>
        {anzahlAktiv > 0 && (
          <ul className="flex flex-wrap items-center gap-2 pb-3" aria-label={copy.filter}>
            {aktiveChips.map((c) => (
              <li key={`${c.k}-${c.v}`}>
                <button type="button" onClick={() => toggle(c.k, c.v)} className="ph-press inline-flex min-h-9 items-center gap-1 bg-surface-band px-3 text-small text-text transition-colors duration-(--duration-micro) ease-quiet hover:bg-stone-deep/60" aria-label={fill(copy.entfernen, { wert: c.label })}>
                  {c.label}
                  <X aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
                </button>
              </li>
            ))}
            <li>
              <button type="button" onClick={zuruecksetzen} className="inline-flex min-h-9 items-center px-2 text-small text-text underline underline-offset-4">
                {copy.zuruecksetzen}
              </button>
            </li>
          </ul>
        )}
      </div>

      {/* Telefon/Tablet: alle Filter in einem Dialog */}
      <dialog ref={dialogRef} aria-labelledby="kat-filter-titel" className={DIALOG_MOTION} data-kat-filter-dialog="">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-gutter py-2">
            {/* Startfokus auf den Titel statt auf „Schließen“ (Optik-QA r3: dicker Fokusrahmen beim Öffnen). */}
            <h2 id="kat-filter-titel" tabIndex={-1} autoFocus className="text-title focus:outline-none">
              {copy.filter}
            </h2>
            <button type="button" onClick={() => dialogRef.current?.close()} className="inline-flex size-11 items-center justify-center" aria-label={copy.schliessen}>
              <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-gutter">
            {status === "fehler" && <p className="py-4 text-small text-text">{copy.fehler}</p>}
            {sichtbareGruppen.map((k) => (
              <fieldset key={k} className="border-b border-line py-4">
                <legend className="float-left mb-2 w-full text-ui text-text">{copy.gruppen[k]}</legend>
                <div className="clear-left">
                  {optionenListe(k, "m")}
                </div>
              </fieldset>
            ))}
          </div>
          <div className="flex items-center gap-3 border-t border-line px-gutter py-3">
            {anzahlAktiv > 0 && (
              <button type="button" onClick={zuruecksetzen} className="min-h-12 px-2 text-ui text-text underline underline-offset-4">
                {copy.zuruecksetzen}
              </button>
            )}
            <button type="button" onClick={() => dialogRef.current?.close()} className="ph-press ml-auto inline-flex min-h-12 flex-1 items-center justify-center bg-action px-5 text-ui text-paper transition-colors duration-(--duration-micro) ease-quiet hover:bg-action-hover" aria-live="polite">
              {/* Ohne Auswahl ist die Zahl schon bekannt (Server) – „wird geladen“ nur, wenn sie vom Index abhängt. */}
              {status === "laden" && aktiv ? copy.laden : fill(copy.anzeigen, { n: gesamt.toLocaleString(locale === "de" ? "de-AT" : locale) })}
            </button>
          </div>
        </div>
      </dialog>

      <p className="mt-4 text-small text-text-soft tabular sm:hidden" aria-live="polite">
        {status === "laden" && aktiv ? copy.laden : zahl(gesamt)}
      </p>
      {status === "fehler" && <p className="mt-4 text-small text-text">{copy.fehler}</p>}

      {sichtbar.length > 0 ? (
        <ul {...delegate} className={`mt-6 grid ${RASTER_LISTE} gap-x-4 gap-y-10 transition-opacity duration-(--duration-swap) ease-quiet md:gap-x-grid${wartet ? " opacity-60" : ""}`} aria-busy={status === "laden" || undefined} data-kat-raster="">
          {sichtbar.map((e, i) => (
            <li key={e.s} data-kat-item="" data-marke={e.m} data-kategorie={e.k}>
              <ShopKachel e={e} href={`${produktBase}/${e.s}`} locale={locale} marke={labels.marke?.[e.m] || e.m} copy={copy} eager={i < 4 && !treffer} />
            </li>
          ))}
        </ul>
      ) : (
        status !== "laden" && (
          <div className="mt-10 border-t border-line pt-6">
            <p className="text-body text-text">{copy.leer}</p>
            <button type="button" onClick={zuruecksetzen} className="mt-2 min-h-11 text-ui text-text underline underline-offset-4">
              {copy.zuruecksetzen}
            </button>
          </div>
        )
      )}

      {sichtbar.length > 0 && (
        <div className="mt-12 flex flex-col items-center gap-3">
          <p className="text-small text-text-soft tabular">{fill(copy.gezeigt, { a: (start + sichtbar.length).toLocaleString(locale === "de" ? "de-AT" : locale), n: gesamt.toLocaleString(locale === "de" ? "de-AT" : locale) })}</p>
          <div className="h-px w-48 bg-line" aria-hidden="true">
            {/* Fortschritt als scaleX statt width: nur transform, wächst nach „Weitere laden“ sanft nach. */}
            <div className="h-px origin-left bg-ink transition-transform duration-(--duration-ui) ease-quiet motion-reduce:transition-none" style={{ transform: `scaleX(${Math.min(1, (start + sichtbar.length) / Math.max(1, gesamt)).toFixed(3)})` }} />
          </div>
          {nochMehr && (
            <button
              type="button"
              onClick={() => {
                if (treffer) setAnzahl((n) => n + SEITE);
                else {
                  setAnzahl(initial.length + SEITE);
                  holen();
                }
              }}
              className="ph-press mt-2 inline-flex min-h-12 items-center justify-center border border-ink px-8 text-ui text-text transition-colors duration-(--duration-micro) ease-quiet hover:bg-action hover:text-paper focus-visible:bg-action focus-visible:text-paper"
              data-kat-mehr=""
            >
              {status === "laden" ? copy.laden : copy.mehr}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
