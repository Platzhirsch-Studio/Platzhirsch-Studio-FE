"use client";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { CompositionThumb } from "./Glyph";
import Silhouette from "./Silhouette";
import { silhouetteSeats } from "../../../lib/sofaplaner/geometry.js";
import { sourceCopy, terminHref } from "../../../lib/sofaplaner/copy/source.js";
import { TERMIN_HREF as TERMIN_HREF_DE } from "../../../lib/sofaplaner/copy/index.js";
import { useT } from "./useT";
import s from "./sofaplaner.module.css";

// QM Sofaplaner R1 P2-5/P2-6: filters by possible shape, depth, height, area and
// construction; variants of one line grouped on one card ("Andersen · 6 Varianten");
// depth × height and the width range on every card (manufacturer values only);
// thumbnails drawn only when a card comes into view (smaller HTML, fewer nodes).
const FORM_LABEL = { gerade: "Gerade", "ecke-links": "Ecke", "ecke-rechts": "Ecke", u: "U-Form", chaise: "Chaise", peninsula: "Peninsula", insel: "Insel", sofa: "Sofa" };

const FILTERS = [
  {
    key: "form",
    label: "Form",
    options: [
      ["", "Alle Formen"],
      ["ecke", "Ecksofa möglich"],
      ["u", "U-Form möglich"],
      ["chaise", "Mit Chaiselongue"],
      ["insel", "Insel / frei im Raum"],
    ],
    test: (f, v) => (v === "ecke" ? f.forms.includes("ecke-links") || f.forms.includes("ecke-rechts") : f.forms.includes(v)),
  },
  {
    key: "tiefe",
    label: "Tiefe",
    options: [
      ["", "Alle Tiefen"],
      ["s", "bis 100 cm"],
      ["m", "101–120 cm"],
      ["l", "über 120 cm"],
    ],
    test: (f, v) => f.depth != null && (v === "s" ? f.depth <= 100 : v === "m" ? f.depth > 100 && f.depth <= 120 : f.depth > 120),
  },
  {
    key: "hoehe",
    label: "Höhe",
    options: [
      ["", "Alle Höhen"],
      ["n", "niedrig, bis 75 cm"],
      ["h", "höher, über 75 cm"],
    ],
    test: (f, v) => f.height != null && (v === "n" ? f.height <= 75 : f.height > 75),
  },
  {
    key: "bereich",
    label: "Bereich",
    options: [
      ["", "Innen und außen"],
      ["innen", "Innen"],
      ["outdoor", "Outdoor"],
    ],
    test: (f, v) => (v === "outdoor" ? f.outdoor : !f.outdoor),
  },
  {
    key: "bauart",
    label: "Bauart",
    options: [
      ["", "Alle Bauarten"],
      ["modular", "Modular"],
      ["fest", "Feste Größe"],
      ["sofabett", "Sofabett"],
    ],
    test: (f, v) => (v === "modular" ? f.modular : v === "fest" ? !f.modular : f.sofabed),
  },
];

// T = depth (Tiefe), D in English; numbers with the locale's decimal sign.
const NB = "\u00a0";
const dimText = (f, T) => {
  const d = T("T");
  return [f.depth != null ? `${d}${NB}${T.num(f.depth)}` : `${d}${NB}–`, f.height != null ? `H${NB}${T.num(f.height)}` : `H${NB}–`].join(" × ") + `${NB}cm`;
};
// QM planer-tools: Zahl und Einheit bleiben zusammen (schmale Karten auf 375 px
// brachen „82 / cm“ und „Breiten / 97,5–320 cm“ um).
const keepUnits = (t) => t.replace(/ cm/g, `${NB}cm`).replace(/^(\S+) (?=\d)/, `$1${NB}`);
const widthText = (f, T) => (f.wMin == null ? null : keepUnits(f.wMin === f.wMax ? T("Breite {w} cm", { w: T.num(f.wMin) }) : T("Breiten {a}–{b} cm", { a: T.num(f.wMin), b: T.num(f.wMax) })));

// QM r4: die ersten Karten (erster Bildschirm) zeichnen die Draufsicht schon im Server-HTML –
// vorher stand dort sekundenlang derselbe blasse L-Platzhalter auf allen Karten.
// QM r5: alle zuerst gezeigten Linien (FIRST) – ab Karte 7 stand sonst sekundenlang der Platzhalter.
const EAGER_THUMBS = 12;

function LazyThumb({ items, eager = false }) {
  const ref = useRef(null);
  const [show, setShow] = useState(eager);
  useEffect(() => {
    const el = ref.current;
    if (!el || show) return;
    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setShow(true));
      return;
    }
    // QM R2 P3-D: printing draws every thumbnail, not only those seen so far
    const all = () => setShow(true);
    window.addEventListener("beforeprint", all);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.removeEventListener("beforeprint", all);
    };
  }, [show]);
  return (
    <span ref={ref} className={s.thumbSlot}>
      {/* QM R2 P3-D: neutral placeholder (server-rendered) until the card is in view – no empty card in print or share previews */}
      {show ? <CompositionThumb items={items} /> : <span className={s.thumbPh} aria-hidden="true" />}
    </span>
  );
}

// Fix-Runde 1 (F2): mobil deutlich kürzer – zuerst 12 Linien, weitere auf Wunsch;
// Varianten einer Linie aufklappbar. Früher Ausgang zum Termin schon in Schritt 1.
const FIRST = 12;

export default function ModelPicker({ index, current, loading, error, onPick }) {
  const T = useT();
  const SC = sourceCopy(T.locale);
  const TERMIN_HREF = T.foreign ? terminHref(T.locale) : TERMIN_HREF_DE;
  const [sel, setSel] = useState({});
  const [limit, setLimit] = useState(FIRST);
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query.trim().toLowerCase());
  const active = FILTERS.filter((f) => sel[f.key]);
  const list = useMemo(
    () =>
      index.filter((f) => {
        for (const flt of FILTERS.filter((x) => sel[x.key])) if (!flt.test(f, sel[flt.key])) return false;
        if (q && !`${f.name} ${f.designer || ""} ${f.character}`.toLowerCase().includes(q)) return false;
        return true;
      }),
    [index, sel, q]
  );
  const groups = useMemo(() => {
    const m = new Map();
    for (const f of list) {
      if (!m.has(f.line)) m.set(f.line, []);
      m.get(f.line).push(f);
    }
    return [...m.values()].map((v) => [...v].sort((a, b) => a.name.length - b.name.length || a.name.localeCompare(b.name, "de")));
  }, [list]);

  return (
    <section className={s.picker} aria-labelledby="sp-step1">
      <div className={s.stepHead} data-step-head>
        <p className={s.overline}>{T("Schritt {n} von 6", { n: 1 })}</p>
        <h2 id="sp-step1" className={s.stepTitle} tabIndex={-1} data-step-title>
          {T("Modell wählen")}
        </h2>
        <p className={s.earlyExit}>
          <a href={TERMIN_HREF} className={s.linkBtn}>
            <CalendarDays size={16} aria-hidden="true" /> {T("Lieber gleich beraten lassen? Termin im Showroom")}
          </a>
        </p>
        <p className={`${s.lead} ${s.leadLong}`}>
          {SC.pickerLead(index.length)}
        </p>
      </div>
      <div className={s.pickerTools}>
        <label className={s.search}>
          <Search size={18} aria-hidden="true" />
          <span className={s.srOnly}>{T("Modell suchen")}</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={T("Modell oder Designer suchen")} className={s.searchInput} />
        </label>
        <details className={s.filterBox}>
          <summary className={s.filterSummary}>
            <SlidersHorizontal size={16} aria-hidden="true" /> {T("Filter")}{active.length ? ` ${T("({n} aktiv)", { n: active.length })}` : ""}
          </summary>
          <div className={s.filterGrid}>
            {FILTERS.map((f) => (
              <label key={f.key} className={s.field}>
                <span>{T(f.label)}</span>
                <select className={s.input} value={sel[f.key] || ""} onChange={(e) => setSel((p) => ({ ...p, [f.key]: e.target.value }))}>
                  {f.options.map(([v, l]) => (
                    <option key={v} value={v}>
                      {T(l)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            {active.length > 0 && (
              <button type="button" className={s.btnGhost} onClick={() => setSel({})}>
                {T("Filter zurücksetzen")}
              </button>
            )}
          </div>
        </details>
      </div>
      {error && (
        <p role="alert" className={s.err}>
          {error}
        </p>
      )}
      <p className={s.small} aria-live="polite">
        {T(list.length === 1 ? "{n} Modell" : "{n} Modelle", { n: list.length })} {T("in")} {T(groups.length === 1 ? "{n} Linie" : "{n} Linien", { n: groups.length })}
      </p>
      {groups.length === 0 ? (
        <p className={s.note}>{T("Kein Modell passt zu Suche und Filter.")}</p>
      ) : (
        <>
        <ul className={s.modelGrid}>
          {groups.slice(0, Math.max(limit, groups.findIndex((g) => g.some((v) => v.slug === current)) + 1)).map((vars, gi) => {
            const f = vars[0];
            const rest = vars.slice(1);
            const activeHere = vars.some((v) => v.slug === current);
            const busy = loading === f.slug;
            const forms = [...new Set(f.forms.map((k) => FORM_LABEL[k]).filter(Boolean))].map((x) => T(x));
            const wt = widthText(f, T);
            return (
              <li key={f.line} className={s.modelItem}>
                <button type="button" className={s.modelCard} aria-pressed={f.slug === current} aria-busy={busy || undefined} onClick={() => onPick(f.slug)} data-model={f.slug}>
                  <span className={s.modelThumb}>
                    <Silhouette height={f.height} depth={f.depth} seat={f.seat} places={silhouetteSeats(f.thumb, f.seat)} className={s.silhouette} />
                    <span className={s.topInset} title={T("Draufsicht der Startform")}>
                      <LazyThumb items={f.thumb} eager={gi < EAGER_THUMBS} />
                    </span>
                    {f.slug === current && (
                      <span className={s.modelActive}>
                        <Check size={14} aria-hidden="true" /> {T("Gewählt")}
                      </span>
                    )}
                  </span>
                  <span className={s.modelBody}>
                    <span className={s.modelName}>{f.name}</span>
                    {SC.brand ? (
                      <span className={s.modelMeta}>
                        {f.designer ? `Design ${f.designer}` : T("Designer nicht angegeben")}
                        {f.year ? `, ${f.year}` : ""}
                      </span>
                    ) : (
                      <span className={s.modelMeta}>{T("Planungstyp in Rastermaßen")}</span>
                    )}
                    <span className={s.modelDims}>
                      {dimText(f, T)}
                      {wt ? <span className={s.muted}>{NB}· {wt}</span> : null}
                    </span>
                    <span className={s.modelChar}>{f.character}</span>
                    <span className={s.modelFacts}>
                      <span>{T(f.modular ? "Modular" : "Feste Größe")}</span>
                      {f.outdoor && <span>Outdoor</span>}
                      <span>{T("{n} Elemente", { n: f.count })}</span>
                    </span>
                    {forms.length > 0 && <span className={s.modelForms}>{T("Formen:")} {forms.join(", ")}</span>}
                    {busy && <span className={s.small}>{T("Wird geladen …")}</span>}
                  </span>
                </button>
                {rest.length > 0 && (
                  <details className={s.variants} open={activeHere && f.slug !== current ? true : undefined}>
                    <summary className={s.variantsHead}>
                      {f.line} · {T("{n} Varianten", { n: vars.length })}{activeHere && f.slug !== current ? ` · ${T("eine davon gewählt")}` : ""}
                      <ChevronDown size={14} aria-hidden="true" className={s.variantsChevron} />
                    </summary>
                    <ul className={s.variantList}>
                      {rest.map((v) => (
                        <li key={v.slug}>
                          <button type="button" className={s.variantBtn} aria-pressed={v.slug === current} aria-busy={loading === v.slug || undefined} onClick={() => onPick(v.slug)} data-model={v.slug}>
                            <span className={s.variantName}>{v.name}</span>
                            <span className={s.variantDims}>
                              {dimText(v, T)}
                              {v.outdoor ? " · Outdoor" : ""}
                              {loading === v.slug ? ` · ${T("wird geladen …")}` : ""}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
        {groups.length > limit && (
          <p className={s.moreRow}>
            <button type="button" className={s.btnGhost} onClick={() => setLimit((n) => n + FIRST)}>
              {T("Weitere Modelle zeigen ({n})", { n: groups.length - limit })}
            </button>
            <button type="button" className={s.linkBtn} onClick={() => setLimit(groups.length)}>
              {T("Alle {n} Linien zeigen", { n: groups.length })}
            </button>
          </p>
        )}
        </>
      )}
      <p className={s.small}>{SC.dimsNote}</p>
    </section>
  );
}
