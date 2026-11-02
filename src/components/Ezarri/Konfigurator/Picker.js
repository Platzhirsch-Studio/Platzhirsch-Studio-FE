"use client";
// Ezarri-Konfigurator – Mosaik-Auswahl als <dialog>: alle 457 Einträge (402 Referenzen + 55 Safe-Varianten) (Mosaik,
// Safe, Corner, Cove) mit Suche, Farbfamilie, Kollektion, Format, Typ, Wasserwirkung
// und „nur mischbar“. Filtert im Browser sofort; 48 je Schritt, „Weitere anzeigen“.
// Bilder: Ezarri-Produktfotos (600er AVIF/WebP, lazy) mit Quellenangabe.
import { useEffect, useMemo, useRef, useState } from "react";
// QM-Endabnahme 02.11.2026: Icon umbenannt – „X“ aus useKonfCopy (FR/IT-Texte, in DE null) überdeckte
// das Schließen-Icon, der Dialog brach beim Öffnen in die Fehlergrenze ab.
import { Search, X as CloseIcon } from "lucide-react";
import { WASSERWIRKUNG, facetsFor } from "@/lib/ezarri/facets";
import { baseName } from "@/lib/ezarri/konfigurator/katalog-index";
import { useKonfCopy } from "./useKonfCopy";
import { Choice, Thumb } from "./controls";

const STEP = 48;
const TYP_LABEL_DE = { mosaik: "Mosaike", safe: "Rutschhemmend (Safe)", corner: "Corner (Kante)", cove: "Cove (Hohlkehle)" };
const TYP_LABEL_EN = { mosaik: "Mosaics", safe: "Slip-resistant (Safe)", corner: "Corner (edge)", cove: "Cove (inside cove)" };

function typOf(r) {
  if (r.typ === "corner" || r.typ === "cove") return r.typ;
  return r.safe || r.typ === "safe-step" ? "safe" : "mosaik";
}

export default function Picker({ open, onClose, index, loading, target, onPick, format }) {
  const { FORMAT_LABEL, HINWEIS_MIX, t, en, locale, X, credit } = useKonfCopy();
  const TYP_LABEL = X ? X.typ : en ? TYP_LABEL_EN : TYP_LABEL_DE;
  // Filter-Labels in der Sprache der Seite (IDs und Werte bleiben gleich); FR/IT aus X.
  const facets = facetsFor(locale);
  const FARBFAMILIEN = X ? facets.FARBFAMILIEN.map((f) => ({ ...f, label: X.farbfamilien[f.id] ?? f.label })) : facets.FARBFAMILIEN;
  const WASSER_LISTE = X ? facets.WASSERWIRKUNG.map((w) => ({ ...w, label: X.wasserwirkung[w.id] ?? w.label })) : facets.WASSERWIRKUNG;
  const ref = useRef(null);
  const searchRef = useRef(null);
  const typen = target?.typen || ["mosaik", "safe"];
  const [q, setQ] = useState("");
  const [farbe, setFarbe] = useState("");
  const [kol, setKol] = useState("");
  const [fmt, setFmt] = useState("");
  const [typ, setTyp] = useState(typen[0]);
  const [wasser, setWasser] = useState("");
  const [nurMx, setNurMx] = useState(false);
  const [limit, setLimit] = useState(STEP);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      setTyp((target?.typen || ["mosaik"])[0]);
      setNurMx(Boolean(target?.nurMischbar));
      setFmt(target?.format || "");
      setLimit(STEP);
      requestAnimationFrame(() => searchRef.current?.focus());
    }
    if (!open && d.open) d.close();
  }, [open, target]);

  const kollektionen = useMemo(() => {
    const k = index?.katalog?.kollektionen || {};
    return Object.entries(k)
      .filter(([id]) => (index?.katalog?.refs || []).some((r) => r.kol === id))
      .map(([id, [name, linie]]) => ({ id, name, linie }));
  }, [index]);

  const list = useMemo(() => {
    const refs = index?.katalog?.refs || [];
    const needle = q.trim().toLowerCase();
    const wf = WASSERWIRKUNG.find((w) => w.id === wasser)?.value;
    return refs.filter((r) => {
      if (typOf(r) !== typ) return false;
      if (needle && !`${r.name} ${r.code} ${index.kollektion(r.kol)}`.toLowerCase().includes(needle)) return false;
      if (farbe && !r.ff.includes(farbe)) return false;
      if (kol && r.kol !== kol) return false;
      if (fmt && r.fmt !== fmt) return false;
      if (wf && !r.wf.includes(wf)) return false;
      if (nurMx && !r.mx) return false;
      return true;
    });
  }, [index, q, farbe, kol, fmt, typ, wasser, nurMx]);

  const shown = list.slice(0, limit);
  const titel = target?.titel || t("Mosaik wählen", "Choose a mosaic");

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby="ezk-picker-title"
      className="m-0 h-dvh max-h-none w-full max-w-none bg-paper p-0 text-text shadow-overlay backdrop:bg-ink-deep/40 md:ml-auto md:mr-0 md:w-[min(640px,100vw)]"
      data-ezk-picker=""
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 md:px-6">
          <h2 id="ezk-picker-title" className="text-title">
            {titel}
          </h2>
          <button type="button" onClick={onClose} className="flex size-11 items-center justify-center hover:bg-stone" aria-label={t("Auswahl schließen", "Close selection")}>
            <CloseIcon className="size-5" aria-hidden="true" strokeWidth={1.5} />
          </button>
        </header>
        <div className="space-y-3 border-b border-line px-4 py-3 md:px-6">
          <label className="relative block">
            <span className="sr-only">{t("Suche nach Name, Code oder Kollektion", "Search by name, code or collection")}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-soft" aria-hidden="true" strokeWidth={1.5} />
            <input
              ref={searchRef}
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setLimit(STEP);
              }}
              placeholder={t("Name, Code oder Kollektion", "Name, code or collection")}
              className="h-12 w-full border border-line-control bg-paper pl-9 pr-3 text-ui"
            />
          </label>
          {typen.length > 1 && (
            <Choice legend={t("Art", "Type")} legendHidden name="typ" value={typ} onChange={(v) => (setTyp(v), setLimit(STEP))} options={typen.map((t) => ({ id: t, label: TYP_LABEL[t] }))} />
          )}
          <details className="group">
            <summary className="flex min-h-11 cursor-pointer items-center text-ui underline decoration-line-strong underline-offset-4">{t("Weitere Filter", "More filters")}</summary>
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <label className="block text-small font-medium">
                {t("Kollektion", "Collection")}
                <select value={kol} onChange={(e) => (setKol(e.target.value), setLimit(STEP))} className="mt-1 h-11 w-full border border-line-control bg-paper px-2 text-ui">
                  <option value="">{t("Alle", "All")}</option>
                  {kollektionen.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} ({k.linie})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-small font-medium">
                {t("Wasserwirkung laut Ezarri", "Water effect according to Ezarri")}
                <select value={wasser} onChange={(e) => (setWasser(e.target.value), setLimit(STEP))} className="mt-1 h-11 w-full border border-line-control bg-paper px-2 text-ui">
                  <option value="">{t("Alle", "All")}</option>
                  {WASSER_LISTE.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </label>
              <Choice
                legend="Format"
                name="fmt"
                value={fmt}
                onChange={(v) => (setFmt(v), setLimit(STEP))}
                options={[{ id: "", label: t("Alle", "All") }, ...["25", "50", "hexa"].map((f) => ({ id: f, label: FORMAT_LABEL[f] }))]}
              />
              {target?.art !== "corner" && target?.art !== "cove" && (
                <label className="flex min-h-11 items-center gap-3 text-ui">
                  <input type="checkbox" checked={nurMx} onChange={(e) => setNurMx(e.target.checked)} className="size-5 accent-ink" />
                  {t("nur mischbare Mosaike", "blendable mosaics only")}
                </label>
              )}
            </div>
          </details>
          <fieldset className="relative">
            <legend className="sr-only">{t("Farbfamilie", "Colour family")}</legend>
            {/* horizontal scrollend; Verlauf rechts zeigt, dass es weitergeht (QM P2-3) */}
            <div className="-mr-4 flex snap-x gap-2 overflow-x-auto pb-1 pr-12 [scrollbar-width:thin] md:-mr-6" data-ezk-farben="">
              {[{ id: "", label: t("Alle Farben", "All colours"), swatch: null }, ...FARBFAMILIEN].map((f) => (
                <button
                  key={f.id || "alle"}
                  type="button"
                  aria-pressed={farbe === f.id}
                  onClick={() => (setFarbe(f.id), setLimit(STEP))}
                  className={`flex min-h-11 shrink-0 snap-start items-center gap-2 border px-3 text-ui ${farbe === f.id ? "border-ink bg-ink text-paper" : "border-line-control bg-paper text-text hover:border-ink"}`}
                >
                  {f.swatch && <span className="size-4 border border-line-strong bg-(--swatch)" style={{ "--swatch": f.swatch }} aria-hidden="true" />}
                  {f.label}
                </button>
              ))}
            </div>
            <span className="pointer-events-none absolute inset-y-0 -right-4 w-12 bg-linear-to-l from-paper to-transparent md:-right-6" aria-hidden="true" />
          </fieldset>
        </div>
        <p className="px-4 pt-3 text-small text-text-soft md:px-6" aria-live="polite">
          {loading ? t("Sortiment wird geladen …", "Loading the range …") : X ? t("", "", list.length === 1 ? "picker.treffer1" : "picker.trefferN", { n: list.length }) : `${list.length} ${en ? (list.length === 1 ? "result" : "results") : "Treffer"}`}
          {target?.nurMischbar ? t(" · in Mischungen nur mischbare Mosaike", " · only blendable mosaics in blends") : ""}
        </p>
        <ul className="grid flex-1 auto-rows-min grid-cols-3 gap-x-2 gap-y-3 overflow-y-auto px-4 py-3 sm:gap-x-3 sm:gap-y-4 md:px-6" data-ezk-results="">
          {shown.map((r, i) => {
            const fmtL = r.fmt ? FORMAT_LABEL[r.fmt] : "";
            const name = baseName(r.name) || r.name;
            const mxBlock = target?.art === "mix" && !r.mx;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onPick(r)}
                  className="group flex w-full flex-col text-left"
                  aria-label={`${name}, ${index.kollektion(r.kol)}${fmtL ? `, ${fmtL}` : ""}${r.safe ? t(", rutschhemmend", ", slip-resistant") : ""}${!r.mx ? `, ${HINWEIS_MIX.nichtMischbar}` : ""}`}
                  data-ref={r.id}
                >
                  <Thumb img={r.img} eager={i < 9} sizes="(max-width: 767px) 31vw, 190px" size="aspect-square w-full" className="transition-opacity duration-(--duration-micro) group-hover:opacity-90" />
                  <span className="mt-1 line-clamp-2 text-small font-medium text-text sm:text-ui sm:font-normal">{name}</span>
                  <span className="line-clamp-2 text-small text-text-soft">
                    {index.kollektion(r.kol)}
                    {fmtL ? ` · ${fmtL}` : ""}
                    {r.safe ? " · Safe" : ""}
                  </span>
                  {mxBlock && <span className="text-small text-notice">{t("allein, nicht mischbar", "on its own, cannot be blended")}</span>}
                </button>
              </li>
            );
          })}
        </ul>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 md:px-6">
          <p className="text-small text-text-soft">{credit("bild")}</p>
          {list.length > limit && (
            <button type="button" onClick={() => setLimit((l) => l + STEP)} className="min-h-11 border border-ink px-4 text-ui hover:bg-ink hover:text-paper">
              {t(`Weitere ${Math.min(STEP, list.length - limit)} anzeigen`, `Show ${Math.min(STEP, list.length - limit)} more`, "picker.mehr", { n: Math.min(STEP, list.length - limit) })}
            </button>
          )}
        </footer>
      </div>
    </dialog>
  );
}

export { typOf };
