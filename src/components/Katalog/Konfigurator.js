"use client";
// src/components/Katalog/Konfigurator.js
// Ausführungs-Konfigurator der Katalog-Produktseite (Inhaber-Auftrag 31.10.2026).
// Kleine Insel: Daten aus konfiguratorDaten() (lib/katalog/ausfuehrung.js), Texte
// als Props (Namespace „katalog“ ist server-only), Logik importfrei aus
// lib/katalog/konfiguratorLogik.js.
//   - je Gruppe eine Radiogruppe (role=radiogroup/radio, aria-checked, Pfeiltasten,
//     roving tabindex), Farbfelder nur mit belegtem `farbe`, Name immer sichtbar
//   - Vorschau (QM R3): kleines Quadrat neben der Zusammenfassung, nur mit eigenem
//     Optionsbild; object-contain, Bild unverändert, data-pin-nopin, „Bild: <Marke>“
//   - „Beratung anfragen“ trägt die gewählte Ausführung (produkt=…)
//   - Übergabe an den Shop (Marken mit Verkaufspreis): Ereignis
//     window "katalog:ausfuehrung" { slug, auswahl: string[], label } bei jeder Änderung.
import { useId, useRef, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { schreibenHref } from "@/lib/forms/terminLink";
import { auswahlLabel, auswahlZeilen, naechsterIndex, ohneVorschauSatz, optionsVorschau, waehle } from "@/lib/katalog/konfiguratorLogik";
import { produktTitel } from "./produktTitel";
import { softHyphenate } from "@/components/Landing/silben";

const cx = (...c) => c.filter(Boolean).join(" ");

/**
 * @param {{
 *   slug: string, locale: string, produkt: string, thema: string,
 *   daten: {gruppen: Array<{name: string, optionen: Array<{id: string, name: string, code: string|null, farbe: string|null, bild: {src: string, w: number, h: number, alt: string}|null}>}>, start: object|null, standard: string[], ratio: number},
 *   texte: {titel: string, gewaehlt: string, hinweis: string, vorschau: string, beratung: string, bildQuelle: string}
 * }} props
 */
// hauptSrc (QM R1): Hauptbild der Seite – dasselbe Motiv erscheint nicht noch einmal als Vorschau.
export default function Konfigurator({ slug, locale, produkt, thema, daten, texte, hauptSrc = null }) {
  const id = useId();
  const [auswahl, setAuswahl] = useState(daten.standard);
  const [zuletzt, setZuletzt] = useState(null);
  const refs = useRef({});
  const label = auswahlLabel(daten, auswahl);
  const bild = optionsVorschau(daten, auswahl, zuletzt, hauptSrc);
  const zeilen = auswahlZeilen(daten, auswahl);
  // „Gewählt: {auswahl}“ → Präfix „Gewählt“ für die Zeilenliste.
  const gewaehltWort = texte.gewaehlt.split("{auswahl}")[0].replace(/[\s:]+$/u, "");
  const href = schreibenHref(locale, { context: { thema, produkt: label ? `${produkt} – ${label}` : produkt } });

  const setze = (gi, oid) => {
    const neu = waehle(auswahl, gi, oid);
    setAuswahl(neu);
    setZuletzt(gi);
    try {
      window.dispatchEvent(new CustomEvent("katalog:ausfuehrung", { detail: { slug, auswahl: neu, label: auswahlLabel(daten, neu) } }));
    } catch {
      /* ohne CustomEvent: nur Anzeige */
    }
  };

  const onKey = (e, gi, oi) => {
    const n = daten.gruppen[gi].optionen.length;
    const j = naechsterIndex(e.key, oi, n);
    if (j == null) return;
    e.preventDefault();
    const o = daten.gruppen[gi].optionen[j];
    setze(gi, o.id);
    refs.current[`${gi}-${j}`]?.focus();
  };

  return (
    <div className="mt-stack-m w-full border-t border-line pt-4" data-kat-konfigurator={slug}>
      <h2 className="text-title text-text">{texte.titel}</h2>
      {daten.gruppen.map((g, gi) => {
        const gid = `${id}-g${gi}`;
        return (
          <div key={g.name} className="mt-4">
            <p id={gid} className="text-small text-text-soft">
              {softHyphenate(g.name)}
            </p>
            <div role="radiogroup" aria-labelledby={gid} className="mt-2 flex flex-wrap gap-2" data-kat-gruppe-auswahl={gi}>
              {g.optionen.map((o, oi) => {
                const an = auswahl[gi] === o.id;
                return (
                  <button
                    key={o.id}
                    ref={(el) => {
                      refs.current[`${gi}-${oi}`] = el;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={an}
                    tabIndex={an ? 0 : -1}
                    onClick={() => setze(gi, o.id)}
                    onKeyDown={(e) => onKey(e, gi, oi)}
                    // Optik-QA 01.11.2026: lange Artikel-Optionen (Agape „AVAS1099_ – freistehend, L 184 × B 85 × H 57 cm“)
                    // brachen zentriert um, „cm“ stand allein – linksbündig, Maße gebunden (produktTitel).
                    className={`ph-press inline-flex min-h-11 max-w-full items-center gap-2 border px-3 py-1.5 text-left text-ui text-text duration-(--duration-micro) ease-quiet ${an ? "border-ink bg-ink/5 outline-1 outline-ink" : "border-line-strong hover:border-ink"}`}
                    data-kat-option={o.id}
                  >
                    {o.farbe && <span aria-hidden="true" className="size-5 shrink-0 border border-line-strong" style={{ backgroundColor: o.farbe }} />}
                    <span className="min-w-0 wrap-break-word">
                      {produktTitel(o.name)}
                      {o.code && !o.name.includes(o.code) && <span className="text-text-soft"> {o.code}</span>}
                      {o.detail && <span className="block text-small text-text-soft">{produktTitel(o.detail)}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {/* QM R1/R3: Zusammenfassung immer als Zeilen (Gruppe: Wahl), auch bei einer Gruppe.
          Vorschau (QM R3): nur ein eigenes Optionsbild, klein neben der Zusammenfassung –
          vorher schob sich nach der Wahl ein großes Bild zwischen Titel und Knöpfe, der
          geklickte Knopf rutschte unter den Rand. Bild object-contain, unverändert.
          Live-Region bleibt stehen; nur der Inhalt kommt nach einer Wahl neu (.ph-arrive). */}
      <div aria-live="polite" className="mt-4 min-h-6 border-t border-line pt-3 text-body text-text" data-kat-auswahl="">
        <div key={label} className={cx("flex items-start gap-4", zuletzt !== null && "ph-arrive")}>
          {bild && (
            // QM R4: Rahmen im Seitenverhältnis des Optionsbilds (kein Leinenstreifen oben/unten),
            // weißer Bildgrund verschmilzt mit der Fläche; etwas größer, damit der Unterschied
            // der Ausführungen (BORA CKA2: Edelstahl- vs. schwarzes Gitter) erkennbar ist.
            <figure className="w-32 shrink-0 sm:w-40">
              <div className="relative aspect-square w-full bg-linen" style={bild.w && bild.h ? { aspectRatio: `${bild.w} / ${bild.h}` } : undefined} data-kat-vorschau="">
                <Image
                  src={bild.src}
                  alt={bild.alt}
                  fill
                  sizes="160px"
                  quality={75}
                  className="object-contain mix-blend-multiply"
                  data-pin-nopin="true" // Herstellerbild: nicht für Pinterest
                />
              </div>
              <figcaption className="mt-1 text-small text-text-soft">
                {texte.bildQuelle}
                <span className="sr-only"> · {texte.vorschau.replace("{auswahl}", label)}</span>
              </figcaption>
            </figure>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-small text-text-soft">{gewaehltWort}</p>
            <dl className="mt-1 space-y-1">
              {zeilen.map((z) => (
                <div key={z.name} className="flex flex-wrap gap-x-2">
                  <dt className="text-text-soft">{z.name.replace(/\s*\(.*\)$/u, "")}:</dt>
                  <dd className="min-w-0 wrap-break-word">{produktTitel(z.wert)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
      {/* QM R1: ohne Vorschaubild entfällt der erste Satz „Vorschau der gewählten Ausführung.“ */}
      <p className="mt-1 text-small text-text-soft">{bild ? texte.hinweis : ohneVorschauSatz(texte.hinweis, texte.vorschau)}</p>
      <Button href={href} variant="primary" arrow className="mt-4" data-kat-beratung={slug}>
        {texte.beratung}
      </Button>
    </div>
  );
}
