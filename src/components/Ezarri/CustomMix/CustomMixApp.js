"use client";
/* eslint-disable @next/next/no-img-element -- Ezarri-Vorschaubilder sind schon optimiert (148 px WebP, 2–3 KB), next/image brächte nur Umweg */
// src/components/Ezarri/CustomMix/CustomMixApp.js – Mischpult „Eigene Mischung“ (Team C).
// Bis zu 4 mischbare Ezarri-Mosaike mit Anteilen (Regler + Zahlenfeld + ±-Knöpfe,
// WCAG 2.5.7), Fuge, Format, Vorschau trocken/unter Wasser, neu mischen,
// Teilen-Link (URL), Bild speichern und Drucken (A4 mit QR), fertige
// Ezarri-Mischungen als Startpunkt, Übergabe an Rechner und Anfrage.
// Mischlogik: lib/ezarri/rechner/mischung.js, Zeichnen: flaeche2d.js, Export: ./mischExport.js.
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "next-intl";
import { Check, Copy, Download, Minus, Plus, Printer, RefreshCw, Search, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import LinkArrow from "@/components/ui/LinkArrow";
import cx from "@/components/ui/cx";
import { CUSTOM_MIX as CUSTOM_MIX_DE } from "@/lib/ezarri/rechner/copy";
import { CUSTOM_MIX as CUSTOM_MIX_EN } from "@/lib/ezarri/rechner/copy.en";
import { MAX_MIX, addToMix, newSeed, normalizeMix, removeFromMix, setAnteil, steineProM2 } from "@/lib/ezarri/rechner/mischung";
import { encodeCustomMix, encodeMix } from "@/lib/ezarri/rechner/url";
import { FARBFAMILIEN, facetsFor } from "@/lib/ezarri/facets";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { anfrageHref } from "@/components/Ezarri/Anfrage/AnfrageLink";
import MosaikFlaeche from "./MosaikFlaeche";
import { dateiname, mischBild, mosaikCanvas, qrDataUrl, speichern } from "./mischExport";
import { PANEL_RIGHT, scrollVerhalten } from "@/lib/ezarri/motion";

// Welle 2 (Englisch): Texte je Sprache über einen Hook (kein Modul-Zustand – der Server rendert de und en parallel).
const useCM = () => (useLocale() === "en" ? CUSTOM_MIX_EN : CUSTOM_MIX_DE);
const FORMAT_LABEL = { 25: "25 mm", 50: "50 mm", hexa: "Hexa" };
// Code nur nennen, wenn er mehr sagt als Name oder Serie + Name (QM2 P3-2)
const codeZusatz = ({ code, name, serie }) => {
  const norm = (t) => String(t ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  return code && ![norm(name), norm(`${serie} ${name}`), norm(`${name} ${serie}`)].includes(norm(code)) ? `, Code ${code}` : "";
};
const img = (thumb) => (thumb ? `${thumb}-600.webp` : null);
// Export immer hell (Papier/Tinte der Design-Bibel), unabhängig vom Dark Mode
const EXPORT_FARBEN = { papier: "#faf8f4", tinte: "#30373e", leise: "#5d646b" };

export default function CustomMixApp({ palette, rezepte = [], feste = [], fugen, initial }) {
  const C = useCM();
  const locale = useLocale();
  const en = locale === "en";
  const zahlLoc = en ? "en-GB" : "de-AT";
  const dez = (v) => (en ? String(v) : String(v).replace(".", ","));
  const byId = useMemo(() => new Map(palette.map((p) => [p.id, p])), [palette]);
  const toene = useMemo(() => Object.fromEntries(palette.map((p) => [p.id, p.toene])), [palette]);
  const [mix, setMix] = useState(() => normalizeMix(initial.mix.filter((x) => byId.has(x.id))));
  const [fuge, setFuge] = useState(initial.fuge && fugen.some((f) => f.id === initial.fuge) ? initial.fuge : fugen[0]?.id);
  const [format, setFormat] = useState(initial.format || "25");
  const [seed, setSeed] = useState(initial.seed || 4711);
  const [wasser, setWasser] = useState(Boolean(initial.wasser));
  const [meter, setMeter] = useState("1");
  const [kopiert, setKopiert] = useState(false);
  const [alleRezepte, setAlleRezepte] = useState(false);
  const [counts, setCounts] = useState({ list: [], n: 0 });
  const [exportStatus, setExportStatus] = useState("");
  const [druck, setDruck] = useState(null);
  const [mini, setMini] = useState({ an: false, top: 0 });
  const dialog = useRef(null);
  const vorschauRef = useRef(null);
  const sektionRef = useRef(null);
  const miniRef = useRef(null);
  const mischungRef = useRef(null);

  const items = mix.map((x) => ({ ...x, item: byId.get(x.id) })).filter((x) => x.item);
  const formate = ["25", "50", "hexa"].filter((f) => items.every((x) => x.item.formate.includes(f)));
  const aktivFormat = formate.includes(format) ? format : formate[0] || "25";
  const fugeObj = fugen.find((f) => f.id === fuge) || fugen[0];
  const query = encodeCustomMix({ mix, fuge, format: aktivFormat, seed, wasser });
  // Referenz im aktiven Format (QM P1-2), sonst 25 mm
  const refs = [...new Set(items.map((x) => x.item.refs?.[aktivFormat] || x.item.referenz).filter(Boolean))];
  const summe = mix.reduce((s, x) => s + x.anteil, 0);
  // Gesperrte Formate mit Grund (QM P2-7)
  const gesperrt = ["25", "50", "hexa"]
    .filter((f) => !formate.includes(f) && items.length > 0)
    .map((f) => ({ f, namen: items.filter((x) => !x.item.formate.includes(f)).map((x) => x.item.name) }));

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

  // Mobil: kleine Vorschau beim Mischen (QM P2-3, QM2 P2-1). Ab lg steht die Vorschau sticky daneben.
  // Sichtbar, solange die Mischung im Blick ist und von der Mosaikfläche unter 15 % zu sehen ist.
  // Position: unter dem Header, aber nie über der Vorschau-Sektion (Ansicht, Neu mischen,
  // Bild speichern, Drucken): Sie sitzt dann direkt unter deren Unterkante. Kein Platz oder
  // ein fokussiertes Element darunter (WCAG 2.4.11): ausgeblendet.
  useEffect(() => {
    const sektion = sektionRef.current;
    const flaeche = vorschauRef.current;
    const mischung = mischungRef.current;
    if (!sektion || !flaeche || !mischung) return undefined;
    const mq = window.matchMedia("(min-width: 64rem)");
    let f = 0;
    const messen = () => {
      f = 0;
      const vh = window.innerHeight;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const kopf = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 3.5) * rem;
      const fl = flaeche.getBoundingClientRect();
      const sk = sektion.getBoundingClientRect();
      const mi = mischung.getBoundingClientRect();
      const flaecheSichtbar = fl.height ? Math.max(0, Math.min(fl.bottom, vh) - Math.max(fl.top, kopf)) / fl.height : 1;
      const hoehe = miniRef.current?.offsetHeight || 124;
      const top = Math.round(Math.max(kopf + 12, sk.bottom + 12));
      const links = window.innerWidth - 16 - 96;
      let an = !mq.matches && mi.top < vh && mi.bottom > kopf && flaecheSichtbar < 0.15 && top + hoehe <= vh - 16;
      const fokus = document.activeElement;
      if (an && fokus && fokus !== document.body && mischung.contains(fokus)) {
        const r = fokus.getBoundingClientRect();
        if (r.right > links && r.left < links + 96 && r.bottom > top && r.top < top + hoehe) an = false;
      }
      setMini((m) => (m.an === an && (!an || m.top === top) ? m : { an, top }));
    };
    const los = () => {
      if (!f) f = requestAnimationFrame(messen);
    };
    los();
    window.addEventListener("scroll", los, { passive: true });
    window.addEventListener("resize", los, { passive: true });
    document.addEventListener("focusin", los);
    mq.addEventListener("change", los);
    return () => {
      cancelAnimationFrame(f);
      window.removeEventListener("scroll", los);
      window.removeEventListener("resize", los);
      document.removeEventListener("focusin", los);
      mq.removeEventListener("change", los);
    };
  }, []);

  // Fokussiertes Bedienelement hinter einer fixen Leiste (Concierge, Schnellkontakt):
  // über die Leisten scrollen, scroll-margin (scroll-mb-24) gibt den Abstand (QM2 P2-2, WCAG 2.4.11).
  function fokusFrei(e) {
    const el = e.target;
    if (!(el instanceof HTMLElement) || !el.matches("input, button, select, a, [tabindex]")) return;
    requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const x = Math.min(Math.max(r.left + r.width / 2, 0), window.innerWidth - 1);
      const y = r.top + r.height / 2;
      const treffer = y >= 0 && y < window.innerHeight ? document.elementFromPoint(x, y) : null;
      if (!treffer || (treffer !== el && !el.contains(treffer) && !treffer.contains(el))) {
        el.scrollIntoView({ block: "nearest", behavior: scrollVerhalten() });
      }
    });
  }

  async function teilen() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      /* Zwischenablage gesperrt: Link steht in der Adresszeile */
    }
    setKopiert(true);
    setTimeout(() => setKopiert(false), 2500);
  }

  const teilenUrl = () => `${SITE_URL}/${en ? "en" : "de"}/ezarri/custom-mix${query ? `?${query}` : ""}`;
  const zustand = () => ({ mix, toene, fuge: fugeObj?.hex, format: aktivFormat, seed, wasser, meter: Number(meter) });
  const rezeptZeilen = () =>
    items.map((x) => `${x.anteil} % ${x.item.name} (${x.item.serie})${codeZusatz(x.item)}`);
  const angabenZeile = () =>
    en
      ? `Grout ${fugeObj?.name ?? ""} · format ${FORMAT_LABEL[aktivFormat]} · detail ${dez(meter)} × ${dez(meter)} m · view: ${wasser ? C.vorschau.wasser : C.vorschau.trocken}`
      : `Fuge ${fugeObj?.name ?? ""} · Format ${FORMAT_LABEL[aktivFormat]} · Ausschnitt ${dez(meter)} × ${dez(meter)} m · Ansicht: ${wasser ? C.vorschau.wasser : C.vorschau.trocken}`;

  async function bildSpeichern() {
    if (!items.length) return;
    setExportStatus(C.export.erstellt);
    try {
      const schrift = getComputedStyle(document.body).fontFamily || "sans-serif";
      const blob = await mischBild(zustand(), {
        titel: C.export.titel,
        zeilen: [
          ...rezeptZeilen().map((text) => ({ text, stark: true })),
          { text: angabenZeile() },
          { text: `${C.export.link}: ${teilenUrl()}`, klein: true },
          { text: `${C.export.quelle} · ${C.vorschau.hinweis}`, klein: true },
          { text: `${SITE_NAME} · ${C.export.adresse}`, klein: true },
        ],
        schrift,
        ...EXPORT_FARBEN,
      });
      speichern(blob, dateiname(items.map((x) => x.item.name), aktivFormat));
      setExportStatus(C.export.gespeichert);
    } catch {
      setExportStatus(C.export.fehler);
    }
  }

  // qrcode schon beim Zeigen auf „Drucken“ laden (QM2 P3-7)
  const qrVorladen = () => import("qrcode").catch(() => {});

  async function drucken() {
    if (!items.length) return;
    setExportStatus(C.export.druckVorbereitet);
    try {
      const bild = mosaikCanvas(zustand(), 1200).toDataURL("image/png");
      const qr = await qrDataUrl(teilenUrl());
      // Druck 02.11.: Datum des Ausdrucks aufs Blatt
      const stand = new Intl.DateTimeFormat(zahlLoc, { dateStyle: "long", timeZone: "Europe/Vienna" }).format(new Date());
      setDruck({ bild, qr, rezept: rezeptZeilen(), angaben: angabenZeile(), url: teilenUrl(), stand: en ? `Printed on ${stand}` : `Stand ${stand}` });
    } catch {
      setExportStatus(C.export.fehler);
    }
  }

  // Sobald das Druckblatt im DOM ist und die Bilder geladen sind: drucken, danach aufräumen
  useEffect(() => {
    if (!druck) return undefined;
    let fertig = false;
    const ende = () => {
      if (fertig) return;
      fertig = true;
      setDruck(null);
      setExportStatus("");
    };
    window.addEventListener("afterprint", ende);
    const bilder = [...document.querySelectorAll("[data-cm-druck] img")];
    Promise.all(bilder.map((b) => (b.complete ? Promise.resolve() : new Promise((r) => b.addEventListener("load", r, { once: true }))))).then(() => {
      requestAnimationFrame(() => {
        window.print();
        // Browser ohne afterprint (oder print() ohne Dialog): nach kurzer Zeit aufräumen
        setTimeout(ende, 1500);
      });
    });
    return () => window.removeEventListener("afterprint", ende);
  }, [druck]);

  /** Dialog zu: Fokus zurück auf „Mosaik hinzufügen“, bei 4 Mosaiken auf die Überschrift (QM P2-2). */
  function fokusNachDialog() {
    requestAnimationFrame(() => {
      const knopf = document.getElementById("cm-hinzufuegen");
      if (knopf && !knopf.disabled) knopf.focus();
      else document.getElementById("cm-mischung")?.focus();
    });
  }

  const zusammenfassung = items.length
    ? C.zusammenfassung(items.map((x) => `${x.item.name} (${x.item.serie}) ${x.anteil} %`).join(", "), fugeObj?.name ?? "", FORMAT_LABEL[aktivFormat])
    : C.vorschau.leer;

  const flaecheProps = { mix, toene, fuge: fugeObj?.hex, format: aktivFormat, seed, wasser, meter: Number(meter) };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16" data-ezarri-custom-mix onFocus={fokusFrei}>
      {/* ------------------------------------------------------------ Vorschau */}
      <section aria-labelledby="cm-vorschau" ref={sektionRef} className="min-w-0 lg:sticky lg:top-[calc(var(--header-h)+4rem)] lg:self-start">
        <h2 id="cm-vorschau" className="sr-only">
          {C.vorschau.titel}
        </h2>
        <div ref={vorschauRef}>
          <MosaikFlaeche {...flaecheProps} onCounts={(list, n) => setCounts((c) => (c.n === n && c.list.join() === list.join() ? c : { list, n }))} />
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {zusammenfassung}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Umschalter
            legend={C.vorschau.titel}
            name="cm-wasser"
            value={wasser ? "1" : "0"}
            onChange={(v) => setWasser(v === "1")}
            options={[
              { value: "0", label: C.vorschau.trocken },
              { value: "1", label: C.vorschau.wasser },
            ]}
          />
          <Umschalter legend={C.vorschau.ausschnitt} name="cm-meter" value={meter} onChange={setMeter} options={C.vorschau.ausschnitte} />
          <Button variant="ghost" onClick={() => setSeed(newSeed())} disabled={!items.length} className="[&>span]:inline-flex [&>span]:items-center [&>span]:gap-2">
            <RefreshCw aria-hidden="true" className="size-4" strokeWidth={1.5} />
            <span>{C.vorschau.neu}</span>
          </Button>
        </div>
        <p className="mt-3 text-small text-text-soft">
          {counts.n
            ? `${C.vorschau.steine(counts.n.toLocaleString(zahlLoc))} (${dez(meter)} × ${dez(meter)} m, ${en ? "approx." : "ca."} ${steineProM2(aktivFormat).toLocaleString(zahlLoc)} ${en ? "tiles per m²" : "Steine je m²"}). `
            : ""}
          {C.vorschau.hinweis}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={bildSpeichern} disabled={!items.length} className="[&>span]:inline-flex [&>span]:items-center [&>span]:gap-2" data-cm-bild>
            <Download aria-hidden="true" className="size-4" strokeWidth={1.5} />
            <span>{C.export.bild}</span>
          </Button>
          <Button variant="ghost" onClick={drucken} onPointerEnter={qrVorladen} onFocus={qrVorladen} disabled={!items.length} className="[&>span]:inline-flex [&>span]:items-center [&>span]:gap-2" data-cm-drucken>
            <Printer aria-hidden="true" className="size-4" strokeWidth={1.5} />
            <span>{C.export.drucken}</span>
          </Button>
        </div>
        <p className="mt-2 text-small text-text-soft" role="status" aria-live="polite">
          {exportStatus || C.export.hinweis}
        </p>
      </section>

      {/* Mobil: kleine Vorschau beim Mischen */}
      {mini.an && items.length > 0 && (
        <div
          ref={miniRef}
          aria-hidden="true"
          style={{ top: mini.top }}
          className="pointer-events-none fixed right-4 z-(--z-sticky) w-24 border border-line bg-surface shadow-overlay motion-safe:animate-[cm-mini-in_var(--duration-ui)_ease-out] lg:hidden"
          data-cm-mini
        >
          <MosaikFlaeche {...flaecheProps} />
          <p className={cx("px-1 py-0.5 text-center text-small tabular-nums", summe === 100 ? "text-text" : "text-error")}>
            {summe} %
          </p>
          <style>{`@keyframes cm-mini-in{from{opacity:0}to{opacity:1}}`}</style>
        </div>
      )}

      {/* ------------------------------------------------------------ Mischpult */}
      <div className="flex min-w-0 flex-col gap-10">
        {/* data-cta: Die Schnellkontakt-Leiste (MobileCtaBar) weicht aus, solange die Mischung sichtbar ist (QM2 P2-2) */}
        <section aria-labelledby="cm-mischung" ref={mischungRef} data-cta="primary" className="[&_button]:scroll-mb-24 [&_input]:scroll-mb-24 [&_a]:scroll-mb-24">
          <div className="flex items-baseline justify-between gap-4">
            <Heading id="cm-mischung" level={2} size="title" tabIndex={-1} className="focus:outline-none">
              {C.mischung.titel}
            </Heading>
            <p className={cx("text-small tabular-nums", summe === 100 ? "text-text-soft" : "text-error")}>
              {C.mischung.summe} {summe} %
            </p>
          </div>
          {/* Anteilsband: zeigt die Mischung als eine Leiste */}
          {items.length > 0 && (
            <div className="mt-4 flex h-3 w-full overflow-hidden bg-linen" aria-hidden="true">
              {items.map((x) => (
                <span key={x.id} className="h-full bg-(--swatch) transition-[width] duration-(--duration-swap) motion-reduce:transition-none" style={{ width: `${x.anteil}%`, "--swatch": x.item.toene[0][0] }} />
              ))}
            </div>
          )}
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {items.map((x) => (
              <MischZeile
                key={x.id}
                eintrag={x}
                allein={items.length === 1}
                onAnteil={(v) => setMix((m) => setAnteil(m, x.id, v))}
                onEntfernen={() => setMix((m) => removeFromMix(m, x.id))}
              />
            ))}
          </ul>
          <div className="mt-4">
            <Button
              id="cm-hinzufuegen"
              variant="secondary"
              onClick={() => dialog.current?.showModal()}
              disabled={items.length >= MAX_MIX}
              fullWidth
              aria-haspopup="dialog"
              className="[&>span]:inline-flex [&>span]:items-center [&>span]:gap-2"
            >
              <Plus aria-hidden="true" className="size-4" strokeWidth={1.5} />
              <span>{C.mischung.hinzufuegen}</span>
            </Button>
            <p className="mt-2 text-small text-text-soft">{items.length >= MAX_MIX ? C.mischung.voll : C.mischung.nurMischbar}</p>
          </div>
        </section>

        <fieldset className="min-w-0">
          <legend className="text-title text-text">{C.fuge.titel}</legend>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {fugen.map((g) => (
              <label
                key={g.id}
                className={cx(
                  "flex min-h-12 cursor-pointer items-center gap-3 border px-3 text-small transition-colors duration-(--duration-micro)",
                  "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
                  fuge === g.id ? "border-2 border-ink bg-surface-raised px-[11px]" : "border-line-control hover:border-ink"
                )}
              >
                <input type="radio" name="cm-fuge" value={g.id} checked={fuge === g.id} onChange={() => setFuge(g.id)} className="sr-only" />
                <span aria-hidden="true" className="size-6 flex-none border border-line-strong bg-(--swatch)" style={{ "--swatch": g.hex }} />
                <span>{g.name}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-small text-text-soft">{C.fuge.quelle}</p>
        </fieldset>

        <fieldset className="min-w-0" aria-describedby={gesperrt.length ? "cm-format-hinweis" : undefined}>
          <legend className="text-title text-text">{C.format.titel}</legend>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {["25", "50", "hexa"].map((f) => {
              const ok = formate.includes(f);
              return (
                <label
                  key={f}
                  className={cx(
                    "flex min-h-12 items-center justify-center border text-ui transition-colors duration-(--duration-micro)",
                    "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
                    !ok ? "cursor-not-allowed border-line text-text-soft line-through" : aktivFormat === f ? "cursor-pointer border-ink bg-action text-paper" : "cursor-pointer border-line-control hover:border-ink"
                  )}
                >
                  <input type="radio" name="cm-format" value={f} checked={aktivFormat === f} disabled={!ok} onChange={() => setFormat(f)} className="sr-only" />
                  {FORMAT_LABEL[f]}
                  {!ok && <span className="sr-only">, {C.format.nichtVerfuegbar}</span>}
                </label>
              );
            })}
          </div>
          {gesperrt.length > 0 && (
            <ul id="cm-format-hinweis" className="mt-2 space-y-1 text-small text-text-soft">
              {gesperrt.map((g) => (
                <li key={g.f}>{C.format.gesperrt(FORMAT_LABEL[g.f], g.namen)}</li>
              ))}
            </ul>
          )}
        </fieldset>

        <div className="flex flex-col gap-3 border-t-2 border-ink bg-surface-raised p-5 sm:p-6">
          <Button href={anfrageHref({ art: "muster", refs, m: encodeMix(mix), fu: fuge, f: aktivFormat, quelle: "custom-mix" })} arrow fullWidth>
            {C.aktionen.anfrage}
          </Button>
          <Button href={`/ezarri/rechner?${new URLSearchParams({ ...(aktivFormat !== "25" ? { f: aktivFormat } : {}), m: encodeMix(mix) }).toString()}`} variant="secondary" fullWidth>
            {C.aktionen.rechner}
          </Button>
          <Button variant="ghost" onClick={teilen} className="[&>span]:inline-flex [&>span]:items-center [&>span]:gap-2">
            {kopiert ? <Check aria-hidden="true" className="size-4" strokeWidth={1.5} /> : <Copy aria-hidden="true" className="size-4" strokeWidth={1.5} />}
            <span>{kopiert ? C.aktionen.kopiert : C.aktionen.teilen}</span>
          </Button>
          <span role="status" className="sr-only">
            {kopiert ? C.aktionen.kopiert : ""}
          </span>
        </div>

        {rezepte.length > 0 && (
          <section aria-labelledby="cm-rezepte">
            <Heading id="cm-rezepte" level={2} size="title">
              {C.rezepte.titel}
            </Heading>
            <p className="mt-2 text-small text-text-soft">{C.rezepte.text}</p>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(alleRezepte ? rezepte : rezepte.slice(0, 6)).map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setMix(normalizeMix(r.mix));
                      setSeed(newSeed());
                    }}
                    className="group flex w-full flex-col text-left"
                    aria-label={`${C.rezepte.laden}: ${r.name} (${r.serie})`}
                  >
                    <Vorschaubild thumb={r.thumb} ton={r.ton} size={148} className="aspect-square w-full" />
                    <span className="mt-2 text-small text-text underline decoration-transparent underline-offset-4 group-hover:decoration-current">{r.name}</span>
                    <span className="text-small text-text-soft">{r.serie}</span>
                  </button>
                </li>
              ))}
            </ul>
            {rezepte.length > 6 && (
              <Button variant="link" onClick={() => setAlleRezepte((v) => !v)} aria-expanded={alleRezepte}>
                {alleRezepte ? C.rezepte.weniger : C.rezepte.alle(rezepte.length)}
              </Button>
            )}
          </section>
        )}
        <p className="text-small text-text-soft">{C.quelle}</p>
      </div>

      <AuswahlDialog
        ref={dialog}
        palette={palette}
        rezepte={rezepte}
        feste={feste}
        gewaehlt={new Set(mix.map((x) => x.id))}
        voll={items.length >= MAX_MIX}
        onToggle={(id) => setMix((m) => (m.some((x) => x.id === id) ? removeFromMix(m, id) : addToMix(m, id)))}
        onRezept={(r) => {
          setMix(normalizeMix(r.mix));
          setSeed(newSeed());
          dialog.current?.close();
        }}
        onClose={fokusNachDialog}
      />

      {druck && typeof document !== "undefined" && createPortal(<Druckblatt daten={druck} />, document.body)}
    </div>
  );
}

/** Druckansicht A4 (nur @media print sichtbar), als direktes Kind von <body>. */
function Druckblatt({ daten }) {
  const C = useCM();
  return (
    <div data-cm-druck className="hidden bg-white text-black print:block">
      {/* Druck 02.11.: body ohne Papierton und ohne Cookie-Polster (vorher leere beige Fläche unter dem Blatt) */}
      <style>{`@media print{@page{size:A4;margin:14mm}body>*:not([data-cm-druck]){display:none!important}[data-cm-druck]{display:block!important}body{background:#fff!important;padding:0!important;margin:0!important;min-height:0!important}}`}</style>
      <p className="text-small">{SITE_NAME} · {daten.stand}</p>
      <h1 className="mt-1 font-display text-display-m">{C.export.titel}</h1>
      <img src={daten.bild} alt="" width="600" height="600" className="mt-4 block aspect-square w-[120mm]" />
      <ul className="mt-4 space-y-1 text-body">
        {daten.rezept.map((z) => (
          <li key={z}>{z}</li>
        ))}
      </ul>
      <p className="mt-2 text-body">{daten.angaben}</p>
      <div className="mt-4 flex items-start gap-4">
        <img src={daten.qr} alt="" width="120" height="120" className="block size-[30mm]" />
        <p className="break-all text-small">
          {C.export.link}: {daten.url}
        </p>
      </div>
      <p className="mt-4 text-small">
        {C.export.quelle} · {C.vorschau.hinweis}
      </p>
      <p className="mt-1 text-small">
        {SITE_NAME} · {C.export.adresse}
      </p>
    </div>
  );
}

/** Vorschaubild mit dem gemessenen Hauptton als Platzhalter statt einer grauen Fläche (QM P3-4). */
function Vorschaubild({ thumb, ton, size, className }) {
  const src = img(thumb);
  if (!src) return <span aria-hidden="true" className={cx("block bg-(--swatch)", className)} style={{ "--swatch": ton || "var(--color-linen)" }} />;
  return <img src={src} alt="" width={size} height={size} loading="lazy" decoding="async" className={cx("bg-(--swatch) object-cover", className)} style={{ "--swatch": ton || "var(--color-linen)" }} />;
}

function MischZeile({ eintrag, allein, onAnteil, onEntfernen }) {
  const C = useCM();
  const { item, anteil, id } = eintrag;
  const [text, setText] = useState(String(anteil));
  const [fokus, setFokus] = useState(false);
  const max = 100;
  const anzeige = fokus ? text : String(anteil);
  return (
    <li className="flex flex-col gap-3 py-4">
      <div className="flex items-center gap-3">
        <Vorschaubild thumb={item.thumb} ton={item.toene[0][0]} size={48} className="size-12 flex-none" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-ui text-text">{item.name}</p>
          <p className="text-small text-text-soft">{item.serie}</p>
        </div>
        <button type="button" onClick={onEntfernen} className="inline-flex size-11 flex-none items-center justify-center text-text-soft hover:text-text" aria-label={C.mischung.entfernen(item.name)}>
          <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
        </button>
      </div>
      {!allein && (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onAnteil(anteil - 1)} disabled={anteil <= 1} className="inline-flex size-11 flex-none items-center justify-center border border-line-control hover:border-ink disabled:opacity-40" aria-label={C.mischung.weniger(item.name)}>
            <Minus aria-hidden="true" className="size-4" strokeWidth={1.5} />
          </button>
          <input
            type="range"
            min="1"
            max={max - 1}
            step="1"
            value={anteil}
            onChange={(e) => onAnteil(Number(e.target.value))}
            aria-label={C.mischung.anteil(item.name)}
            aria-valuetext={`${anteil} %`}
            className="h-11 min-w-0 flex-1 accent-ink"
            data-anteil-regler={id}
          />
          <button type="button" onClick={() => onAnteil(anteil + 1)} disabled={anteil >= 99} className="inline-flex size-11 flex-none items-center justify-center border border-line-control hover:border-ink disabled:opacity-40" aria-label={C.mischung.mehr(item.name)}>
            <Plus aria-hidden="true" className="size-4" strokeWidth={1.5} />
          </button>
          <label className="flex flex-none items-center gap-1 text-ui">
            <span className="sr-only">{C.mischung.anteil(item.name)}</span>
            <input
              type="text"
              inputMode="numeric"
              value={anzeige}
              onFocus={() => {
                setText(String(anteil));
                setFokus(true);
              }}
              onBlur={() => setFokus(false)}
              onChange={(e) => {
                setText(e.target.value);
                const n = Number.parseInt(e.target.value, 10);
                if (Number.isFinite(n) && n >= 1 && n <= 99) onAnteil(n);
              }}
              className="h-11 w-14 border border-line-control bg-surface text-center tabular-nums text-text"
              data-anteil-feld={id}
            />
            <span aria-hidden="true">%</span>
          </label>
        </div>
      )}
      {allein && <p className="text-small text-text-soft tabular-nums">100 %</p>}
    </li>
  );
}

/** Segment-Umschalter (Radiogruppe), kompakt. */
function Umschalter({ legend, name, value, onChange, options }) {
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{legend}</legend>
      <div className="flex">
        {options.map((o) => (
          <label
            key={o.value}
            className={cx(
              "-ml-px flex min-h-11 cursor-pointer items-center border px-3 text-small first:ml-0",
              "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
              value === o.value ? "z-10 border-ink bg-action text-paper" : "border-line-control text-text hover:border-ink"
            )}
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Auswahl der mischbaren Mosaike im <dialog>. Suche über Name, Serie, Code,
 * Farbfamilie (deutsch, mit Alltagswörtern wie „türkis“) und Finish; fertige
 * Mischungen erscheinen als eigene Treffer (z. B. „Mojito“). QM P2-6.
 */
function AuswahlDialog({ ref, palette, rezepte, feste = [], gewaehlt, voll, onToggle, onRezept, onClose }) {
  const C = useCM();
  const locale = useLocale();
  const FAMILIEN = facetsFor(locale).FARBFAMILIEN;
  const [q, setQ] = useState("");
  const [serie, setSerie] = useState("");
  const [farbe, setFarbe] = useState("");
  const serien = useMemo(() => [...new Set(palette.map((p) => p.serie))], [palette]);
  const farben = FAMILIEN.filter((f) => palette.some((p) => p.farben.includes(f.id)));
  // Englische Farbnamen zusätzlich durchsuchbar („blue“, „green“).
  const enFarben = (p) => (locale === "en" ? ` ${p.farben.map((id) => FARBFAMILIEN.find((x) => x.id === id)?.en ?? "").join(" ").toLowerCase()}` : "");
  const woerter = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const passt = (text) => woerter.every((w) => text.includes(w));
  const liste = palette.filter(
    (p) => (!serie || p.serie === serie) && (!farbe || p.farben.includes(farbe)) && (!woerter.length || passt((p.suche ?? `${p.name} ${p.serie} ${p.code ?? ""}`.toLowerCase()) + enFarben(p)))
  );
  const byId = useMemo(() => new Map(palette.map((p) => [p.id, p])), [palette]);
  const rezeptTreffer = woerter.length
    ? rezepte
        .filter((r) => passt(`${r.name} ${r.serie} mischung blend`.toLowerCase()))
        .filter((r) => !serie || r.serie === serie)
        .filter((r) => !farbe || r.mix.some((x) => byId.get(x.id)?.farben.includes(farbe)))
        .slice(0, 6)
    : [];
  // Nicht mischbare Treffer nur bei Suche ohne Serien-/Farbfilter, höchstens 4
  const festeTreffer = woerter.length && !serie && !farbe ? feste.filter((m) => passt(m.suche)).slice(0, 4) : [];
  const filterAktiv = Boolean(q || serie || farbe);
  const zuruecksetzen = () => {
    setQ("");
    setSerie("");
    setFarbe("");
  };
  const close = () => ref.current?.close();
  return (
    <dialog
      ref={ref}
      aria-labelledby="cm-auswahl-titel"
      className={`m-0 ml-auto h-dvh max-h-dvh w-full max-w-xl bg-surface p-0 text-text shadow-overlay backdrop:bg-ink-deep/40 ${PANEL_RIGHT}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      onClose={onClose}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
          <h2 id="cm-auswahl-titel" className="text-title">
            {C.auswahl.titel}
          </h2>
          <button type="button" onClick={close} className="inline-flex size-11 items-center justify-center" aria-label={C.auswahl.schliessen}>
            <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4">
          <label className="relative block">
            <span className="sr-only">{C.auswahl.suche}</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-text-soft" strokeWidth={1.5} />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={C.auswahl.suche} className="h-12 w-full border border-line-control bg-surface pl-11 pr-4 text-ui font-normal" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-small text-text">
              {C.auswahl.serie}
              <select value={serie} onChange={(e) => setSerie(e.target.value)} className="mt-1 h-11 w-full border border-line-control bg-surface px-3 text-ui font-normal">
                <option value="">{C.auswahl.alle}</option>
                {serien.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-small text-text">
              {C.auswahl.farbe}
              <select value={farbe} onChange={(e) => setFarbe(e.target.value)} className="mt-1 h-11 w-full border border-line-control bg-surface px-3 text-ui font-normal">
                <option value="">{C.auswahl.alle}</option>
                {farben.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-small text-text-soft" role="status" aria-live="polite">
            {C.auswahl.treffer(liste.length)}
            {rezeptTreffer.length ? ` · ${C.auswahl.mischungen(rezeptTreffer.length)}` : ""}
            {voll ? ` · ${C.mischung.voll}` : ""}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {rezeptTreffer.length > 0 && (
            <section aria-labelledby="cm-auswahl-rezepte" className="mb-6">
              <h3 id="cm-auswahl-rezepte" className="text-ui text-text">
                {C.rezepte.titel}
              </h3>
              <ul className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {rezeptTreffer.map((r) => (
                  <li key={r.id}>
                    <button type="button" onClick={() => onRezept(r)} className="group flex w-full flex-col text-left" aria-label={`${C.rezepte.laden}: ${r.name} (${r.serie})`}>
                      <Vorschaubild thumb={r.thumb} ton={r.ton} size={148} className="aspect-square w-full" />
                      <span className="mt-1 truncate text-small text-text">{r.name}</span>
                      <span className="truncate text-small text-text-soft">{C.rezepte.laden}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <ul className="grid grid-cols-3 content-start gap-3 sm:grid-cols-4">
            {liste.map((p) => {
              const an = gewaehlt.has(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-pressed={an}
                    disabled={!an && voll}
                    onClick={() => onToggle(p.id)}
                    className={cx("group flex w-full flex-col text-left disabled:cursor-not-allowed disabled:opacity-40", an && "outline-2 outline-offset-2 outline-ink")}
                  >
                    <span className="relative block">
                      <Vorschaubild thumb={p.thumb} ton={p.toene[0][0]} size={148} className="block aspect-square w-full" />
                      {an && (
                        <span className="absolute right-1 top-1 inline-flex size-6 items-center justify-center bg-action text-paper">
                          <Check aria-hidden="true" className="size-4" strokeWidth={2} />
                        </span>
                      )}
                    </span>
                    <span className="mt-1 truncate text-small text-text">{p.name}</span>
                    <span className="truncate text-small text-text-soft">
                      {p.serie}
                      {an ? <span className="sr-only">, {C.auswahl.gewaehlt}</span> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {festeTreffer.length > 0 && (
            <section aria-labelledby="cm-auswahl-feste" className="mt-6 border-t border-line pt-4">
              <h3 id="cm-auswahl-feste" className="text-ui text-text">
                {C.auswahl.festeTitel}
              </h3>
              <p className="mt-1 text-small text-text-soft">{C.auswahl.festeText}</p>
              <ul className="mt-2 divide-y divide-line border-y border-line">
                {festeTreffer.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-4 py-2 text-small">
                    <span>
                      {m.name} <span className="text-text-soft">{m.serie}</span>
                    </span>
                    <LinkArrow href={`/ezarri/mosaike/${m.referenz}`} className="text-small">
                      {C.auswahl.festeLink}
                    </LinkArrow>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {!liste.length && !rezeptTreffer.length && (
            <div className="flex flex-col items-start gap-3">
              <p className="text-small text-text-soft">{C.auswahl.keine}</p>
              {filterAktiv && (
                <Button variant="secondary" onClick={zuruecksetzen}>
                  {C.auswahl.zuruecksetzen}
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="border-t border-line px-5 py-3">
          <Button onClick={close} fullWidth>
            {C.auswahl.schliessen}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
