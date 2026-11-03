"use client";
// src/components/Ezarri/Rechner/RechnerApp.js – Mosaik-Rechner (Team C).
// Eingaben links, Ergebnis rechts (mobil darunter, mit Kurzleiste). Rechnet bei
// jeder Eingabe neu (rein: lib/ezarri/rechner/flaechen.js + core.js), schreibt
// den Zustand in die URL (Teilen, Neuladen) und zeigt jede Teilfläche mit Formel.
// Keine Preise.
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useLocale } from "next-intl";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import LinkArrow from "@/components/ui/LinkArrow";
import cx from "@/components/ui/cx";
import { FieldError } from "@/components/Forms";
import { poolFlaechen, STANDARD } from "@/lib/ezarri/rechner/flaechen";
import { FORMATE, formatZahl as fmtZahl, quantities } from "@/lib/ezarri/rechner/core";
import { encodeMix, encodeRechner } from "@/lib/ezarri/rechner/url";
import { RECHNER as RECHNER_DE } from "@/lib/ezarri/rechner/copy";
import { RECHNER as RECHNER_EN } from "@/lib/ezarri/rechner/copy.en";
import { flaechenEn, werkzeugEn } from "@/lib/ezarri/rechner/en";
// FR/IT (01.11.2026): Texte vom Server über <ToolCopyProvider> (RECHNER, TABELLE, KONF.UI)
import { useToolCopy } from "@/components/Ezarri/Konfigurator/ToolCopy";
import { fill, flaechenUebersetzt, makeT, rechnerMitFunktionen, werkzeugUebersetzt } from "@/lib/ezarri/konfigurator/intl";
import { anfrageHref } from "@/components/Ezarri/Anfrage/AnfrageLink";
import PoolSkizze from "./PoolSkizze";
import { scrollVerhalten, wechselKlasse } from "@/lib/ezarri/motion";
import { useGeaendert } from "@/lib/ezarri/useGeaendert";
import { mitFesterEinheit } from "@/lib/ezarri/einheit";
import useConciergeAvoid from "@/components/Ezarri/Welt/useConciergeAvoid";

// Welle 2 (Englisch): Texte, Dezimalzeichen und Ergebnis-Beschriftungen je Sprache.
// Rechnen bleibt identisch (flaechen.js liest "1,5" und "1.5").
const strFor = (en) => (v) => (v === null || v === undefined ? "" : en ? String(v) : String(v).replace(".", ","));

/** Startwerte als Strings (Textfelder mit Komma, englisch mit Punkt). */
function startWerte(initial = {}, en = false) {
  const str = strFor(en);
  const out = {};
  for (const [k, v] of Object.entries(STANDARD)) out[k] = typeof v === "boolean" ? v : str(v);
  for (const [k, v] of Object.entries(initial)) out[k] = typeof v === "boolean" ? v : str(v);
  return out;
}

export default function RechnerApp({ initialEingabe = {}, initialMix = [], mixNamen = {}, hinweise = [] }) {
  const locale = useLocale();
  const en = locale === "en";
  const intl = useToolCopy();
  const fremd = intl?.RECHNER ? intl : null;
  const C = useMemo(() => (fremd ? rechnerMitFunktionen(fremd.RECHNER) : en ? RECHNER_EN : RECHNER_DE), [fremd, en]);
  const F = C.felder;
  const t = useMemo(() => (fremd ? makeT(fremd.KONF) : (de, eng) => (en ? eng : de)), [fremd, en]);
  const formatZahl = (v, digits) => fmtZahl(v, digits, locale);
  const [werte, setWerte] = useState(() => startWerte(initialEingabe, en));
  const conciergeAusweichen = useConciergeAvoid();
  const [mix] = useState(initialMix);
  const [kopiert, setKopiert] = useState(false);
  // QM r2 (ipad-hoch, WCAG 2.4.11): Browser scrollen beim Tabben nicht, wenn das Feld „sichtbar“ ist –
  // auch wenn es hinter der Sticky-Kurzleiste liegt. Dann das Feld über die Leiste schieben.
  const leisteRef = useRef(null);
  function fokusVorLeiste(e) {
    const leiste = leisteRef.current;
    if (!leiste || leiste.contains(e.target)) return;
    const l = leiste.getBoundingClientRect();
    if (l.height === 0) return;
    const r = (e.target.closest?.("label") ?? e.target).getBoundingClientRect();
    const ueber = r.bottom + 16 - l.top;
    if (ueber > 0) window.scrollBy({ top: ueber, behavior: "instant" });
  }

  const roh = useMemo(() => poolFlaechen(werte), [werte]);
  const qRoh = useMemo(() => quantities({ flaechen: roh, margeProzent: roh.margeProzent, format: roh.format, mix }), [roh, mix]);
  const f = useMemo(() => (fremd ? flaechenUebersetzt(roh, fremd.TABELLE) : en ? flaechenEn(roh) : roh), [roh, en, fremd]);
  const q = useMemo(() => (fremd ? { ...qRoh, werkzeug: werkzeugUebersetzt(qRoh.werkzeug, fremd.TABELLE) } : en ? { ...qRoh, werkzeug: werkzeugEn(qRoh.werkzeug) } : qRoh), [qRoh, en, fremd]);
  const query = useMemo(() => encodeRechner(werte, { mix }), [werte, mix]);
  const m2Bewegt = useGeaendert(q.m2);
  const fehlerAnzahl = Object.keys(f.fehler).length;

  // URL aktuell halten (ohne Navigation, ohne Verlaufseinträge)
  // Erst nach der ersten Änderung in die URL schreiben: kein replaceState, bevor der
  // Next-Router initialisiert ist (Dev: „Router action dispatched before initialization“).
  const ersteQuery = useRef(query);
  useEffect(() => {
    if (ersteQuery.current !== null) {
      if (query === ersteQuery.current) return undefined;
      ersteQuery.current = null;
    }
    const t = setTimeout(() => {
      const url = `${window.location.pathname}${query ? `?${query}` : ""}`;
      if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, "", url);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const set = (key) => (e) => {
    const v = e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
    setWerte((w) => ({ ...w, [key]: v }));
  };

  async function teilen() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = window.location.href;
      document.body.append(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setKopiert(true);
    setTimeout(() => setKopiert(false), 2500);
  }

  const zahlFeld = (key, label, opts = {}) => (
    <ZahlFeld
      key={key}
      id={`rr-${key}`}
      label={label}
      unit={opts.unit ?? C.einheit.m}
      hint={opts.hint}
      placeholder={opts.placeholder}
      value={werte[key]}
      onChange={set(key)}
      error={f.fehler[key]}
      className={opts.className}
    />
  );

  const fmtFormat = FORMATE[f.format].label;
  const anfrage = anfrageHref({ art: "angebot", m2: q.m2, rechner: query, m: encodeMix(mix), f: f.format, projekt: "pool", quelle: "rechner" });
  // Rechenweg als Zeilen: Tabelle ab sm, Liste darunter (QM P2-1, kein Querscroll mobil)
  const kartonFormel = q.mischung.length
    ? `${C.ergebnis.mischSumme}: ${q.mischung.map((x) => x.kartons).join(" + ")} = ${q.kartons} ${t("Kartons", "boxes")} × ${formatZahl(FORMATE[f.format].m2ProKarton)} m²`
    : fremd
      ? fill(fremd.KONF.UI_TPL["rr.kartonFormel"], { mitMarge: formatZahl(q.mitMarge), m2: formatZahl(FORMATE[f.format].m2ProKarton), n: q.kartons })
      : en
      ? `${formatZahl(q.mitMarge)} ÷ ${formatZahl(FORMATE[f.format].m2ProKarton)} m² per box, rounded up = ${q.kartons} boxes`
      : `${formatZahl(q.mitMarge)} ÷ ${formatZahl(FORMATE[f.format].m2ProKarton)} m² je Karton, aufgerundet = ${q.kartons} Kartons`;
  const wegZeilen = [
    ...f.teile.map((t) => ({ id: t.id, label: t.label, formel: t.formel, m2: t.m2 })),
    { id: "summe", label: C.ergebnis.summe, formel: t("Summe der Teilflächen", "Sum of the surfaces"), m2: q.netto },
    { id: "marge", label: `+ ${formatZahl(q.margeProzent)} %`, formel: `${formatZahl(q.netto)} × ${formatZahl(1 + q.margeProzent / 100, 4)}`, m2: q.mitMarge },
    { id: "kartons", label: t("Volle Kartons", "Full boxes"), formel: kartonFormel, m2: q.m2, end: true },
  ];

  // QM r1 (WCAG 1.4.4, 200 % Text): Spalten über Container-Queries statt Viewport-Breakpoints.
  // Container-Queries rechnen rem mit der echten Root-Schrift – bei vergrößertem Text bleibt
  // der Rechner einspaltig, statt die Formularspalte auf ~250 px zu quetschen.
  return (
    <div className="@container/rr relative data-concierge-avoid:after:absolute data-concierge-avoid:after:inset-y-0 data-concierge-avoid:after:left-full data-concierge-avoid:after:w-(--space-gutter) data-concierge-avoid:after:content-['']" data-concierge-avoid={conciergeAusweichen ? "" : undefined}>
    <div className="grid gap-stack-m @5xl/rr:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] @5xl/rr:gap-16" data-ezarri-rechner>
      {/* ------------------------------------------------------------ Eingaben */}
      <form className="@container/rf flex min-w-0 flex-col gap-12 [&_input]:scroll-mb-24 [&_select]:scroll-mb-24 [&_button]:scroll-mb-24" onSubmit={(e) => e.preventDefault()} onFocus={fokusVorLeiste} aria-label={t("Eingaben des Mosaik-Rechners", "Mosaic calculator inputs")} noValidate>
        {hinweise.length > 0 && (
          <ul className="border-l-2 border-see bg-surface-raised px-5 py-4 text-small text-text">
            {hinweise.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}

        <Gruppe titel={C.schritte.form} nr={1}>
          <Segmente legend={t("Form des Beckens", "Pool shape")} name="form" options={C.formen} value={werte.form} onChange={set("form")} icons />
          <div className="grid gap-6 @sm/rf:grid-cols-2">
            {werte.form === "frei" ? (
              <>
                {zahlFeld("flaecheFrei", F.flaecheFrei.label, { unit: C.einheit.m2, hint: F.flaecheFrei.hint })}
                {zahlFeld("umfangFrei", F.umfangFrei.label, { hint: F.umfangFrei.hint })}
                {zahlFeld("ecken", F.ecken.label, { unit: C.einheit.stueck, hint: F.ecken.hint })}
              </>
            ) : (
              <>
                {zahlFeld("l", werte.form === "rund" ? F.lRund.label : F.l.label, { hint: werte.form === "rund" ? F.lRund.hint : F.l.hint })}
                {zahlFeld("b", F.b.label, { hint: F.b.hint })}
                {werte.form === "l" && (
                  <>
                    {zahlFeld("lAus", F.lAus.label, { hint: F.lAus.hint })}
                    {zahlFeld("bAus", F.bAus.label)}
                  </>
                )}
              </>
            )}
          </div>
        </Gruppe>

        <Gruppe titel={C.schritte.tiefe} nr={2}>
          <div className="grid gap-6 @sm/rf:grid-cols-2">
            {zahlFeld("tFlach", F.tFlach.label, { hint: F.tFlach.hint })}
            {zahlFeld("tTief", F.tTief.label, { hint: F.tTief.hint })}
            {zahlFeld("tMittel", F.tMittel.label, {
              hint: F.tMittel.hint,
              placeholder: f.tiefeAuto ? `${formatZahl(f.tiefeMittel, 3)} (${t("automatisch", "automatic")})` : undefined,
              className: "@sm/rf:col-span-2",
            })}
          </div>
        </Gruppe>

        <Gruppe titel={C.schritte.einbauten} nr={3}>
          <Segmente legend={t("Treppe", "Steps")} name="treppe" options={C.treppen} value={werte.treppe} onChange={set("treppe")} />
          {werte.treppe !== "keine" && (
            <div className="grid gap-6 @sm/rf:grid-cols-2">
              {zahlFeld("treppeBreite", F.treppeBreite.label)}
              {zahlFeld("stufen", F.stufen.label, { unit: C.einheit.stueck })}
              {zahlFeld("auftritt", F.auftritt.label, { hint: F.auftritt.hint })}
              {zahlFeld("steigung", F.steigung.label, { hint: F.steigung.hint })}
            </div>
          )}
          <div className="grid gap-6 @sm/rf:grid-cols-2">
            {zahlFeld("bankLaenge", F.bankLaenge.label, { hint: F.bankLaenge.hint })}
            {Number.parseFloat(String(werte.bankLaenge).replace(",", ".")) > 0 && (
              <>
                {zahlFeld("bankTiefe", F.bankTiefe.label)}
                {zahlFeld("bankUnterWasser", F.bankUnterWasser.label)}
              </>
            )}
          </div>
        </Gruppe>

        <Gruppe titel={C.schritte.rinne} nr={4}>
          <Segmente legend={t("Art des Beckenrands", "Type of pool edge")} name="rinne" options={C.rinnen} value={werte.rinne} onChange={set("rinne")} />
          {werte.rinne !== "skimmer" && (
            <div className="grid gap-6 @sm/rf:grid-cols-2">
              {zahlFeld("rinneLfm", F.rinneLfm.label, { hint: F.rinneLfm.hint, placeholder: `${formatZahl(f.rinneLfm)} (${t("automatisch", "automatic")})` })}
              {zahlFeld("rinneAbwicklung", F.rinneAbwicklung.label, { hint: F.rinneAbwicklung.hint, placeholder: werte.rinne === "ueberlauf" ? t("0,4", "0.4") : t("0,9", "0.9") })}
            </div>
          )}
        </Gruppe>

        <Gruppe titel={C.schritte.mosaik} nr={5}>
          <Segmente legend="Format" name="format" options={C.formate} value={werte.format} onChange={set("format")} />
          <div className="grid gap-6 @sm/rf:grid-cols-2">{zahlFeld("marge", F.marge.label, { unit: C.einheit.prozent, hint: F.marge.hint })}</div>
          <div className="flex flex-col gap-1">
            {["boden", "waende", "spezial"].map((key) => (
              <label key={key} className="flex min-h-11 cursor-pointer items-center gap-3 text-body text-text">
                <input type="checkbox" checked={Boolean(werte[key])} onChange={set(key)} className="size-5 flex-none accent-ink" />
                {C.schalter[key]}
              </label>
            ))}
          </div>
        </Gruppe>

        {/* Kurzleiste mobil (Druck 02.11.: nicht im Ausdruck) */}
        <div ref={leisteRef} className="sticky bottom-0 z-(--z-sticky) -mx-gutter flex items-center justify-between gap-4 border-t border-line bg-surface px-gutter py-3 @5xl/rr:hidden print:hidden">
          <p className="text-ui tabular-nums text-text" aria-hidden="true">
            {fehlerAnzahl ? C.ergebnis.leer : `${formatZahl(q.m2)} m² · ${q.kartons} ${C.ergebnis.kartons}`}
          </p>
          <a
            href="#rr-ergebnis"
            data-cta="primary"
            onClick={(e) => {
              e.preventDefault();
              const ziel = document.getElementById("rr-ergebnis-titel");
              document.getElementById("rr-ergebnis")?.scrollIntoView({ block: "start", behavior: scrollVerhalten() });
              ziel?.focus({ preventScroll: true });
            }}
            className="inline-flex min-h-11 items-center text-ui text-text underline underline-offset-4">
            {C.mobilLeiste}
          </a>
        </div>
      </form>

      {/* ------------------------------------------------------------ Ergebnis */}
      <section id="rr-ergebnis" aria-labelledby="rr-ergebnis-titel" className="min-w-0 scroll-mt-24 @5xl/rr:sticky @5xl/rr:top-[calc(var(--header-h)+4rem)] @5xl/rr:self-start">
        <div className="border-t-2 border-ink bg-surface-raised p-5 sm:p-8">
          <Heading id="rr-ergebnis-titel" level={2} size="title" tabIndex={-1} className="focus:outline-none">
            {C.ergebnis.titel}
          </Heading>
          {/* Skizze auf Tablets nicht bildschirmbreit aufblasen (Beschriftung wüchse mit) */}
          <PoolSkizze flaechen={f} className="mx-auto mt-6 w-full max-w-[26rem]" />

          <div role="status" aria-live="polite" aria-atomic="true" className="mt-6">
            {fehlerAnzahl ? (
              <p className="flex items-start gap-2 text-ui text-error">{C.ergebnis.leer}</p>
            ) : (
              <>
                <p className="font-display text-display-m tabular-nums text-text">
                  {/* Zahlwechsel: neu eingesetzt, 0,6 → 1 in 280 ms (.ph-arrive), bei ruhiger Ansicht sofort */}
                  <span key={q.m2} className={wechselKlasse(m2Bewegt)}>{formatZahl(q.m2)}</span> <span className="text-title">m²</span>
                </p>
                <p className="mt-1 text-small text-text-soft">
                  {C.ergebnis.flaeche}. {C.ergebnis.flaecheText(formatZahl(q.netto), formatZahl(q.margeProzent))} ({fmtFormat}).
                </p>
                {q.mehrKartonsDurchMischung > 0 && <p className="mt-1 text-small text-text">{C.ergebnis.mischRundung(q.mehrKartonsDurchMischung)}</p>}
              </>
            )}
          </div>

          <dl className={cx("mt-6 grid grid-cols-2 gap-x-6 border-t border-line text-small", fehlerAnzahl && "opacity-40")} aria-hidden={fehlerAnzahl ? true : undefined}>
            <Wert label={C.ergebnis.kartons} value={`${q.kartons}`} sub={t(`à ${formatZahl(FORMATE[f.format].m2ProKarton)} m²`, `${formatZahl(FORMATE[f.format].m2ProKarton)} m² each`, "rr.proKarton", { m2: formatZahl(FORMATE[f.format].m2ProKarton) })} />
            <Wert label={C.ergebnis.blaetter} value={formatZahl(q.blaetter)} sub={t(`${FORMATE[f.format].blattProKarton} je Karton`, `${FORMATE[f.format].blattProKarton} per box`, "rr.jeKarton", { n: FORMATE[f.format].blattProKarton })} />
            <Wert label={C.ergebnis.paletten} value={`${q.paletten}`} sub={q.paletten ? t(`${q.volleKartonsPaletten.paletten} voll + ${q.volleKartonsPaletten.kartons} Kartons`, `${q.volleKartonsPaletten.paletten} full + ${q.volleKartonsPaletten.kartons} boxes`, "rr.paletten", { p: q.volleKartonsPaletten.paletten, k: q.volleKartonsPaletten.kartons }) : ""} />
            <Wert label={C.ergebnis.gewicht} value={`${formatZahl(q.kgMosaik)} kg`} />
            <Wert label={C.ergebnis.kleber} value={`${formatZahl(q.kgKleber)} kg`} sub={t("2,5 kg/m²", "2.5 kg/m²")} />
            <Wert label={C.ergebnis.fuge} value={`${formatZahl(q.kgFuge)} kg`} sub={`${formatZahl(q.fugeKgProM2)} kg/m²`} />
            {werte.spezial && (
              <>
                <Wert label={C.ergebnis.corner} value={`${formatZahl(q.lfmCorner, 1)} ${t("lfm", "running m")}`} />
                <Wert label={C.ergebnis.cove} value={`${formatZahl(q.lfmCove, 1)} ${t("lfm", "running m")}`} />
              </>
            )}
          </dl>

          {q.mischung.length > 0 && !fehlerAnzahl && (
            <div className="mt-6">
              <h3 className="text-ui text-text">{C.ergebnis.mischung}</h3>
              <ul className="mt-2 divide-y divide-line border-y border-line text-small">
                {q.mischung.map((x) => (
                  <li key={x.id} className="flex justify-between gap-4 py-2">
                    <span>
                      {mixNamen[x.id]?.name ?? x.id} <span className="text-text-soft">{mixNamen[x.id]?.serie} · {x.anteil} %</span>
                    </span>
                    <span className="tabular-nums">
                      {x.kartons} {t("Kartons", "boxes")} · {formatZahl(x.m2)} m²
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-6 text-small text-text-soft">{C.ergebnis.preis}</p>

          {/* Druck 02.11.: Anfrage, Link kopieren, Custom Mix sind Bedienung – nicht im Ausdruck */}
          <div className="mt-6 flex flex-col gap-3 print:hidden">
            {/* QM r1 (iphone-se): zweizeiliger CTA bekommt Luft oben/unten, Text mittig; Hinweis mit Abstand darunter */}
            <div className="flex flex-col gap-2">
              <Button href={anfrage} arrow fullWidth className="py-3 text-center leading-snug [&>span]:text-balance">
                {C.aktionen.anfrage}
              </Button>
              <p className="text-small text-text-soft">{C.aktionen.anfrageSub}</p>
            </div>
            <Button variant="secondary" onClick={teilen} fullWidth className="[&>span]:inline-flex [&>span]:items-center [&>span]:gap-2">
              {kopiert ? <Check aria-hidden="true" className="size-4" strokeWidth={1.5} /> : <Copy aria-hidden="true" className="size-4" strokeWidth={1.5} />}
              <span>{kopiert ? C.aktionen.kopiert : C.aktionen.teilen}</span>
            </Button>
            <span role="status" className="sr-only">
              {kopiert ? C.aktionen.kopiert : ""}
            </span>
            <LinkArrow href={`/ezarri/custom-mix${mix.length ? `?m=${encodeMix(mix)}` : ""}`}>{C.aktionen.customMix}</LinkArrow>
          </div>
        </div>
        <p className="mt-3 text-small text-text-soft">{C.ergebnis.quelle}</p>
      </section>

      {/* ------------------------------------------------------------ Rechenweg */}
      <section aria-labelledby="rr-weg" className="min-w-0 @5xl/rr:col-span-2">
        <Heading id="rr-weg" level={2} size="display-m">
          {C.ergebnis.rechenweg}
        </Heading>
        {/* Handy: Liste mit umbrechender Formel */}
        <ul className="mt-stack-m border-t border-line-strong text-small sm:hidden" aria-label={C.ergebnis.teile}>
          {wegZeilen.map((z) => (
            <li key={z.id} className={cx("py-3", z.end ? "border-b border-line-strong" : "border-b border-line")}>
              <p className="flex items-baseline justify-between gap-4">
                <span className="font-medium text-text">{z.label}</span>
                <span className={cx("flex-none tabular-nums text-text", z.end && "font-medium")}>{formatZahl(z.m2)} m²</span>
              </p>
              <p className="mt-1 break-words text-text-soft">{z.formel}</p>
            </li>
          ))}
        </ul>
        {/* Ab sm: Tabelle */}
        <div className="mt-stack-m hidden overflow-x-auto sm:block" role="region" aria-label={C.ergebnis.rechenweg} tabIndex={0}>
          <table className="w-full border-collapse text-left text-small">
            <caption className="sr-only">{C.ergebnis.teile}</caption>
            <thead>
              <tr className="border-b border-line-strong text-text-soft">
                <th scope="col" className="py-3 pr-4 font-medium">
                  {C.ergebnis.teile}
                </th>
                <th scope="col" className="py-3 pr-4 font-medium">
                  {C.ergebnis.formel}
                </th>
                <th scope="col" className="py-3 text-right font-medium">
                  m²
                </th>
              </tr>
            </thead>
            <tbody>
              {wegZeilen.map((z) => (
                <tr key={z.id} className={cx("align-top", z.end ? "border-b border-line-strong" : "border-b border-line")}>
                  <th scope="row" className="py-3 pr-4 font-medium text-text">
                    {z.label}
                  </th>
                  <td className="py-3 pr-4 text-text-soft">{z.formel}</td>
                  <td className={cx("whitespace-nowrap py-3 text-right tabular-nums text-text", z.end && "font-medium")}>{formatZahl(z.m2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {werte.spezial && (f.kantenFormel.corner || f.kantenFormel.cove) && (
          <ul className="mt-4 space-y-1 text-small text-text-soft">
            {f.kantenFormel.corner && <li>Corner: {f.kantenFormel.corner}</li>}
            {f.kantenFormel.cove && <li>Cove: {f.kantenFormel.cove}</li>}
          </ul>
        )}
        {f.hinweise.map((h) => (
          <p key={h} className="mt-3 text-small text-notice">
            {h}
          </p>
        ))}

        <div className="mt-12 grid gap-10 md:grid-cols-2">
          <div>
            <Heading level={3} size="title">
              {C.ergebnis.werkzeug}
            </Heading>
            {[
              ["epoxid", C.ergebnis.werkzeugEpoxid],
              ["werkzeug", C.ergebnis.werkzeugVerlegung],
            ].map(([gruppe, titel]) => (
              <div key={gruppe} className="mt-4">
                <p className="text-ui text-text">{titel}</p>
                <ul className="mt-2 divide-y divide-line border-y border-line text-small">
                  {q.werkzeug
                    .filter((w) => w.gruppe === gruppe)
                    .map((w) => (
                      <li key={w.id} className="flex justify-between gap-4 py-2">
                        <span>
                          {w.label}
                          {w.regel && <span className="text-text-soft"> · {w.regel}</span>}
                        </span>
                        <span className="whitespace-nowrap tabular-nums">{`${w.stueck} ${t("Stk.", "pcs")}`}</span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
            <p className="mt-3 text-small text-text-soft">{C.ergebnis.blaetterHint}</p>
          </div>
          <div>
            <Heading level={3} size="title">
              {C.vergleich.titel}
            </Heading>
            <ul className="mt-4 space-y-2 text-body text-text">
              {C.vergleich.punkte.map((p) => (
                <li key={p} className="flex gap-3">
                  <span aria-hidden="true" className="mt-3 h-px w-4 flex-none bg-see" />
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-measure text-small text-text-soft">{C.ergebnis.hinweis}</p>
          </div>
        </div>
      </section>
    </div>
    </div>
  );
}

function Gruppe({ titel, nr, children }) {
  const id = `rr-gruppe-${nr}`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-6 border-t border-line pt-6">
      <h2 id={id} className="flex items-baseline gap-3 text-title text-text">
        <span aria-hidden="true" className="text-small tabular-nums text-text-soft">
          {String(nr).padStart(2, "0")}
        </span>
        {titel}
      </h2>
      {children}
    </section>
  );
}

function Wert({ label, value, sub }) {
  const bewegt = useGeaendert(value);
  return (
    <div className="border-b border-line py-3">
      <dt className="text-text-soft">{label}</dt>
      <dd className="mt-0.5 text-ui tabular-nums text-text">
        <span key={value} className={wechselKlasse(bewegt)}>{value}</span>
      </dd>
      {sub ? <dd className="text-small text-text-soft">{sub}</dd> : null}
    </div>
  );
}

const FORM_ICON = {
  rechteck: <rect x="3" y="6" width="18" height="12" />,
  l: <path d="M3 6h11v5h7v7H3z" />,
  rund: <ellipse cx="12" cy="12" rx="9" ry="6" />,
  // QM r4: Nierenform mit Einbuchtung oben – vorher ein fast gleiches Oval wie „Rund oder oval“
  frei: <path d="M3 11c0-3.5 2.6-5.5 5.5-4.8 2.2.5 2.3 2.8 4.5 2.8s2.6-3 5.6-2.4S22 10 21 13.5 17.6 18.6 14 18c-2.3-.4-2.6-1.8-5-1.6S3 16.5 3 11z" />,
};

/** Radiogruppe als Segmentleiste (native Radios, Pfeiltasten, 48 px). */
function Segmente({ legend, name, options, value, onChange, icons = false }) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-ui text-text">{legend}</legend>
      {/* QM r2: Spalten per Container-Query in rem – bei 200 % Text (rem verdoppelt) fallen die Gruppen
          auf eine Spalte zurück, statt Wörter Buchstabe für Buchstabe zu zerbrechen. */}
      <div className={cx("mt-2 grid gap-2", options.length === 4 ? "grid-cols-1 @xs/rf:grid-cols-2 @2xl/rf:grid-cols-4" : "grid-cols-1 @xs/rf:grid-cols-3")}>
        {options.map((o) => (
          <label
            key={o.value}
            className={cx(
              // Mit Symbol: Symbol über dem Text – alle Formen bleiben einzeilig und gleich hoch (QM r2, laptop „Rund oder oval“).
              "relative flex min-h-12 min-w-0 cursor-pointer items-center justify-center border px-2 py-2 text-center text-ui text-balance sm:px-3 transition-colors duration-(--duration-micro)",
              icons ? "flex-col gap-1 @xs/rf:min-h-16" : "gap-2",
              "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
              value === o.value ? "border-ink bg-action text-paper" : "border-line-control bg-surface text-text hover:border-ink"
            )}
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            {icons && FORM_ICON[o.value] && (
              <svg viewBox="0 0 24 24" className="size-5 flex-none fill-none stroke-current" strokeWidth="1.5" aria-hidden="true">
                {FORM_ICON[o.value]}
              </svg>
            )}
            {/* lange Wörter („Überlaufrinne“) trennen statt über den Rand zu laufen */}
            <span className="min-w-0 hyphens-manual [overflow-wrap:break-word]">{mitFesterEinheit(o.trenn ?? o.label)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Zahlenfeld mit Komma (inputmode decimal), Einheit im Label, Fehler am Feld. */
function ZahlFeld({ id, label, unit, hint, placeholder, value, onChange, error, className }) {
  const described = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cx("min-w-0", className)}>
      <label htmlFor={id} className="block text-ui text-text">
        {label} {unit && <span className="font-normal text-text-soft">({unit})</span>}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={onChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={described}
        className={cx(
          "mt-2 block h-13 w-full bg-surface px-4 text-ui font-normal tabular-nums text-text placeholder:text-text-soft",
          error ? "border-2 border-error" : "border border-line-control hover:border-ink"
        )}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-2 text-small text-text-soft">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}
