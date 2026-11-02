"use client";
// Suche und Filter für das Sortiment (QA R1 P2-1/P2-2).
//   Ohne JavaScript (und bis zur Hydration) ein normales GET-Formular – der Server filtert.
//   Danach: Suche nach 350 ms Ruhe per router.replace, Marke/Kategorie/Darstellung per
//   router.push (Zurück-Taste stellt den Filter zurück). Alle Felder sind kontrolliert
//   und folgen dem URL-Zustand (Zurücksetzen, Zurück-Taste).
//   Mobil liegen Marke, Kategorie und Darstellung in einem Bottom-Sheet (natives
//   <dialog>), Knopf „Filter (n)“; ab md stehen sie inline.
//   Fix-Runde 1 (F2): Optionen ohne Treffer werden ausgeblendet (außer der gerade
//   gewählten), „Noch ohne Bild“ ist kein öffentlicher Filter mehr.
//   QA R2 P2-2: Die verzögerte Tipp-Suche darf nie eine spätere Navigation überschreiben.
//   Der Timer wird bei Unmount, Marke/Chip, jedem Link-Klick und popstate abgebrochen,
//   und vor replace wird geprüft, ob die URL noch die vom Tippen ist. Das Suchfeld
//   bleibt während „pending“ bedienbar, die letzte Eingabe gewinnt.
//   QA R2 P1-1: partial = Teilkatalog → Zähler mit „mind.“.
import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { RAUM_STUFEN, STUFEN, STUFEN_REIHENFOLGE } from "@/lib/arviewer/stage";
import { useSortiment } from "./SortimentShell";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
const SELECT =
  "min-h-12 w-full appearance-none border border-line-control bg-paper bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2330373e%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:12px] bg-[right_14px_center] bg-no-repeat py-2.5 pl-3 pr-9 text-ui text-text " +
  FOCUS;
const RAUM = "raum";
const noopSubscribe = () => () => {};
const CHIPS = ["", RAUM, ...STUFEN_REIHENFOLGE.filter((s) => s !== "ohne-bild")];
const chipLabel = (s) => (s === RAUM ? "Im Raum ansehen" : s ? STUFEN[s].titel : "Alle");

export function buildUrl(v) {
  const sp = new URLSearchParams();
  for (const k of ["q", "marke", "kategorie", "stufe"]) {
    const x = String(v[k] || "").trim();
    if (x) sp.set(k, x);
  }
  const s = sp.toString();
  return `/de/3d-ansicht${s ? `?${s}` : ""}`;
}

export default function SortimentFilters({ filters, brands, categories, counts, total, partial = false }) {
  const { pending, navigate } = useSortiment();
  const timer = useRef(null);
  const ownUrl = useRef(null); // zuletzt von hier ausgelöste URL (laufende Tipp-Suche ist keine „andere“ Navigation)
  const inputRef = useRef(null);
  const sheetRef = useRef(null);
  const sheetTitle = useId();
  // Bis zur Hydration bleibt der native GET-Submit aktiv (QA R1 P2-2, Punkt 5).
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [q, setQ] = useState(filters.q);
  const [sentQ, setSentQ] = useState(filters.q);
  const urlSel = `${filters.marke}|${filters.kategorie}|${filters.stufe}`;
  const [sel, setSel] = useState({ marke: filters.marke, kategorie: filters.kategorie, stufe: filters.stufe });
  const [prev, setPrev] = useState({ sel: urlSel, q: filters.q });
  // URL → Felder (Zurück-Taste, Zurücksetzen): Zustand beim Rendern angleichen.
  // Die Suche nur, wenn die URL einen anderen Begriff bringt als zuletzt getippt.
  if (prev.sel !== urlSel || prev.q !== filters.q) {
    setPrev({ sel: urlSel, q: filters.q });
    if (prev.sel !== urlSel) setSel({ marke: filters.marke, kategorie: filters.kategorie, stufe: filters.stufe });
    if (prev.q !== filters.q && filters.q !== sentQ) {
      setQ(filters.q);
      setSentQ(filters.q);
    }
  }
  useEffect(() => {
    const cancel = () => clearTimeout(timer.current);
    // Klick auf irgendeinen Link (Karte, Seitenzahl, Zurücksetzen) oder Zurück-Taste: Tipp-Suche verwerfen.
    const onClick = (e) => {
      if (e.target instanceof Element && e.target.closest("a[href]")) cancel();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", cancel);
    return () => {
      cancel();
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", cancel);
    };
  }, []);
  const mind = partial ? "mind. " : "";

  const go = (patch, { push }) => {
    clearTimeout(timer.current);
    const next = { q, ...sel, ...patch };
    setSentQ(String(next.q || "").trim());
    if (patch.marke !== undefined || patch.kategorie !== undefined || patch.stufe !== undefined) {
      setSel((s) => ({ ...s, ...Object.fromEntries(Object.entries(patch).filter(([k]) => k !== "q")) }));
    }
    ownUrl.current = buildUrl(next);
    navigate(ownUrl.current, { push });
  };
  const searchSoon = (value) => {
    clearTimeout(timer.current);
    const at = window.location.pathname + window.location.search;
    timer.current = setTimeout(() => {
      // Hat sich die URL seit dem Tippen geändert (andere Navigation), nicht mehr ersetzen.
      const now = window.location.pathname + window.location.search;
      if (now !== at && now !== ownUrl.current) return;
      go({ q: value }, { push: false });
    }, 350);
  };

  const active = Boolean(filters.q || filters.marke || filters.kategorie || filters.stufe);
  const nFilters = [filters.marke, filters.kategorie, filters.stufe].filter(Boolean).length;
  const stufeTotal = Object.entries(counts.stufe)
    // „Alle“ = Standardliste: ohne „Noch ohne Bild“, außer bei einer Suche
    .filter(([k]) => k !== RAUM && (k !== "ohne-bild" || filters.q))
    .reduce((a, [, b]) => a + b, 0);

  const openSheet = () => sheetRef.current?.showModal();
  const closeSheet = () => sheetRef.current?.close();

  const fields = (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="arv-marke" className="text-small font-medium text-text">
            Marke
          </label>
          <select
            id="arv-marke"
            name="marke"
            value={sel.marke}
            onChange={(e) => go({ marke: e.target.value }, { push: true })}
            className={`mt-1.5 ${SELECT}`}
          >
            <option value="">Alle Marken</option>
            {brands.map((b) => {
              const n = counts.marke[b.key] || 0;
              if (!n && sel.marke !== b.key) return null;
              return (
                <option key={b.key} value={b.key}>
                  {b.label} ({n})
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label htmlFor="arv-kat" className="text-small font-medium text-text">
            Kategorie
          </label>
          <select
            id="arv-kat"
            name="kategorie"
            value={sel.kategorie}
            onChange={(e) => go({ kategorie: e.target.value }, { push: true })}
            className={`mt-1.5 ${SELECT}`}
          >
            <option value="">Alle Kategorien</option>
            {categories.map((c) => {
              const n = counts.kategorie[c.key] || 0;
              if (!n && sel.kategorie !== c.key) return null;
              return (
                <option key={c.key} value={c.key}>
                  {c.label} ({n})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="text-small font-medium text-text">Darstellung</legend>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {CHIPS.map((s) => {
            const n = s ? counts.stufe[s] || 0 : stufeTotal;
            if (s && !n && sel.stufe !== s) return null; // keine leeren Filter zeigen
            // R2 neuland P1-1: „Im Raum ansehen“ nur, wenn es mehr als eine Raum-Ansicht
            // zusammenfasst – sonst stünde dieselbe Menge unter zwei Namen nebeneinander.
            if (s === RAUM && sel.stufe !== RAUM && RAUM_STUFEN.filter((x) => (counts.stufe[x] || 0) > 0).length < 2) return null;
            return (
              <label key={s || "alle"} className="cursor-pointer">
                <input
                  type="radio"
                  name="stufe"
                  value={s}
                  checked={sel.stufe === s}
                  onChange={() => go({ stufe: s }, { push: true })}
                  className="peer sr-only"
                />
                <span
                  className={`inline-flex min-h-11 items-center gap-2 border border-line-strong bg-paper px-3.5 text-small text-text transition-colors duration-(--duration-micro) hover:border-ink peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-disabled:opacity-50 peer-disabled:hover:border-line-strong peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus ${
                    s === RAUM ? "font-medium" : ""
                  }`}
                >
                  {chipLabel(s)}
                  <span className="tabular-nums opacity-75">
                    {n ? mind : ""}
                    {n}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </>
  );

  return (
    <form
      action="/de/3d-ansicht"
      method="get"
      role="search"
      aria-label="Sortiment durchsuchen"
      onSubmit={(e) => {
        if (!ready) return; // native GET bis zur Hydration
        e.preventDefault();
        clearTimeout(timer.current);
        closeSheet();
        go({ q }, { push: true });
      }}
      className="grid gap-4"
      data-pending={pending ? "" : undefined}
      data-ready={ready ? "" : undefined}
    >
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="arv-q" className="text-small font-medium text-text">
            Produkt, Marke oder Art
          </label>
          <div className="relative mt-1.5">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-soft" strokeWidth={1.75} />
            <input
              ref={inputRef}
              id="arv-q"
              name="q"
              type="search"
              inputMode="search"
              autoComplete="off"
              enterKeyHint="search"
              maxLength={80}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                if (ready) searchSoon(e.target.value);
              }}
              placeholder="z. B. Connery, Lampe, Sessel"
              className={`min-h-12 w-full border border-line-control bg-paper py-2.5 pl-9 pr-11 text-ui text-text placeholder:text-text-soft [&::-webkit-search-cancel-button]:appearance-none ${FOCUS}`}
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  clearTimeout(timer.current);
                  go({ q: "" }, { push: false });
                }}
                className={`absolute right-0 top-0 grid h-12 w-11 place-items-center text-text-soft hover:text-text ${FOCUS}`}
                aria-label="Suche leeren"
              >
                <X aria-hidden="true" className="size-4" strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>
        {/* Mobil: Filter im Bottom-Sheet */}
        <button
          type="button"
          onClick={openSheet}
          aria-haspopup="dialog"
          className={`inline-flex min-h-12 shrink-0 items-center gap-2 border border-ink bg-paper px-4 text-small font-medium text-text md:hidden ${FOCUS}`}
        >
          <SlidersHorizontal aria-hidden="true" className="size-4" strokeWidth={1.5} />
          Filter{nFilters ? ` (${nFilters})` : ""}
        </button>
        <button type="submit" className={`hidden min-h-12 shrink-0 border border-ink px-5 text-small font-medium text-text hover:bg-ink hover:text-paper md:inline-flex md:items-center ${FOCUS}`}>
          Suchen
        </button>
      </div>

      {/* Ab md inline, mobil als Bottom-Sheet (gleiches DOM, kein doppeltes Formular) */}
      <dialog
        ref={sheetRef}
        aria-labelledby={sheetTitle}
        onClick={(e) => e.target === sheetRef.current && closeSheet()}
        className="arv-sheet mx-0 mb-0 mt-auto border-0 max-h-[85svh] w-full max-w-none overflow-auto bg-surface p-0 text-text shadow-overlay backdrop:bg-ink-deep/45 md:static md:!block md:max-h-none md:overflow-visible md:bg-transparent md:shadow-none"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-5 py-3 md:hidden">
          <h2 id={sheetTitle} className="text-title">
            Filter
          </h2>
          <button type="button" onClick={closeSheet} aria-label="Filter schließen" className={`grid h-11 w-11 place-items-center ${FOCUS}`}>
            <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="px-5 py-5 md:p-0">{fields}</div>
        <div className="sticky bottom-0 flex gap-3 border-t border-line bg-surface px-5 py-3 md:hidden">
          <button type="button" onClick={closeSheet} className={`inline-flex min-h-12 flex-1 items-center justify-center bg-action text-ui text-paper ${FOCUS}`}>
            {mind}
            {total.toLocaleString("de-AT")} {total === 1 && !partial ? "Produkt" : "Produkte"} zeigen
          </button>
        </div>
      </dialog>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <p className="text-small text-text-soft" aria-live="polite">
          {pending ? (
            <span className="inline-flex items-center gap-2" data-testid="arv-zaehler-laedt">
              <span aria-hidden="true" className="inline-block h-4 w-10 bg-ink/10 motion-safe:animate-pulse" />
              Liste wird aktualisiert …
            </span>
          ) : (
            <>
              <span className="font-medium tabular-nums text-text">
                {mind}
                {total.toLocaleString("de-AT")}
              </span>{" "}
              {total === 1 && !partial ? "Produkt" : "Produkte"}
            </>
          )}
        </p>
        {active && (
          <Link
            href="/de/3d-ansicht#sortiment"
            onClick={() => setQ("")}
            className={`inline-flex min-h-11 items-center px-3 text-small text-text underline underline-offset-4 ${FOCUS}`}
          >
            Filter zurücksetzen
          </Link>
        )}
      </div>
    </form>
  );
}
