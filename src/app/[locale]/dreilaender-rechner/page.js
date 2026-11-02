// /de/dreilaender-rechner – Labs: Dreiländer-Karte und Preisrechner AT/DE/CH/FL.
// Server Component: lädt EZB-Kurs (12 h gecacht) und Preis-Konfiguration über
// die Adapter-Schicht, die Interaktion steckt in DreilaenderClient.
// Doku: Marktresearch/digital/features/dreilaender-rechner.md
import { notFound } from "next/navigation";
import HandBridge from "@/components/Reusable/HandBridge";
import { Button } from "@/components/ui";
import { setRequestLocale } from "next-intl/server";
import DreilaenderClient from "@/components/Labs/Dreilaender/DreilaenderClient";
import { getEurChf } from "@/components/Labs/Dreilaender/ecb.server";
import { getConfig } from "@/components/Labs/Dreilaender/store.server";
import { SOURCES } from "@/components/Labs/Dreilaender/rules";
import { isoDate, rate as fmtRate } from "@/components/Labs/Dreilaender/format";
import { hasRate, rateNotice } from "@/components/Labs/Dreilaender/rate";
import HeroMiniMap from "@/components/Labs/Dreilaender/HeroMiniMap";
import { WerkzeugJsonLd, werkzeugMetadata } from "@/components/Labs/werkzeugSeo";
import JsonLd from "@/components/Reusable/JsonLd";
import { dreilaenderCopy } from "@/lib/dreilaender/copy-intl";
import { dreilaenderLanguages, dreilaenderMetadata, dreilaenderSchema } from "@/lib/dreilaender/seo";

export const revalidate = 43200;

// Feste URL seit der Integration (Inhaber-Entscheidung Nr. 9): indexierbar.
// Sprachen-Ausbau 01.11.2026 (Gruppe schweiz-service): DE, EN, FR und IT, je eigene
// Canonical, hreflang reziprok (src/lib/dreilaender/seo.js). Texte EN/FR/IT:
// src/lib/dreilaender/copy-intl.js (serverseitig, an die Insel als `copy`).
// DE: werkzeugMetadata (og:image) mit demselben hreflang-Satz.
const DE_META = werkzeugMetadata("dreilaender-rechner", {
  title: "Dreiländer-Rechner: Kauf aus CH, FL und DE | Platzhirsch",
  description:
    "Karte des Dreiländerecks mit Fahrzeiten ab Lochau und Richtwert-Rechner für Kundinnen und Kunden aus der Schweiz, Liechtenstein und Deutschland.",
  ogTitle: "Dreiländer-Rechner: Kauf aus CH, FL und DE",
});

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale === "de") return { ...DE_META, alternates: { canonical: DE_META.alternates?.canonical, languages: dreilaenderLanguages() } };
  return dreilaenderMetadata(locale);
}

// Deutscher Mastertext der Seite (EN/FR/IT: copy-intl.js → page).
const PAGE_DE = {
  badge: "Dreiländer-Rechner",
  title: "Ein Showroom, vier Länder.",
  lead: "Wie weit ist es nach Lochau, und was kostet ein Möbel am Ende bei Ihnen zu Hause – in der Schweiz, in Liechtenstein oder in Deutschland? Karte und Rechner beantworten das in Sekunden.",
  vatCh: "CH/FL MWST",
  vatChValue: "8,1 %",
  vatAt: "AT USt",
  vatAtValue: "20 %",
  rate: "1 € in CHF",
  rateFrom: "{label} vom {date}",
  rateFallback: " (aktueller Kurs nicht abrufbar)",
  rateNone: "Kurs derzeit nicht verfügbar",
  nav: "Auf dieser Seite",
  toMap: "Zur Karte",
  toCalc: "Direkt zum Rechner",
  howTitle: "So rechnen wir",
  how: [
    "Ausgangspunkt ist der österreichische Bruttopreis mit 20 % USt. Bei der Ausfuhr in die Schweiz oder nach Liechtenstein entfällt die österreichische USt.",
    "Auf die Einfuhr kommen 8,1 % Schweizer MWST – bei Lieferung auf Ware plus Transport.",
    "Verzollungsgebühren und Lieferkosten sind Beispielwerte. Spediteure veröffentlichen keine Preise.",
    "Der Kurs ist der EZB-Referenzkurs, 12 Stunden zwischengespeichert. Der Schweizer Zoll rechnet mit eigenem Tageskurs.",
  ],
  sourcesTitle: "Öffentliche Quellen",
  sources: null,
  disclaimer:
    "Richtwert, keine Steuer- oder Rechtsberatung. Ihre Eingaben bleiben in Ihrem Browser und werden nicht gespeichert oder übertragen. Die Karte ist eine eigene Grafik und lädt keine Kartendienste.",
  hand: null,
};
const fill = (s, vars) => String(s).replace(/[{]([A-Za-z]+)[}]/g, (_, k) => vars?.[k] ?? "");

export default async function DreilaenderLabsPage({ params }) {
  const { locale } = await params;
  const copy = dreilaenderCopy(locale);
  if (locale !== "de" && !copy) notFound();
  setRequestLocale(locale);
  const P = copy?.page || PAGE_DE;

  const [config, rateInfo] = await Promise.all([getConfig(), getEurChf()]);

  return (
    <div className="bg-white text-ink">
      {copy ? <JsonLd data={dreilaenderSchema(locale)} /> : <WerkzeugJsonLd id="dreilaender-rechner" description={DE_META.description} />}
      <header className="relative isolate overflow-hidden bg-night text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_70%_120%,rgba(209,178,80,0.28),transparent_60%),radial-gradient(40rem_24rem_at_10%_-10%,rgba(236,232,225,0.12),transparent_60%)]"
        />
        {/* Fix-Runde 1 (F2): Ränder nach Design-Bibel (px-gutter) und ohne den früheren 224-px-Abstand für einen festen Header */}
        <div className="mx-auto grid max-w-page gap-10 px-gutter pb-10 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:pb-16 lg:pt-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/85">
              {P.badge}
            </p>
            <h1 className="mt-5 max-w-3xl font-display text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
              {P.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
              {P.lead}
            </p>
            <dl className="mt-8 grid max-w-xl grid-cols-3 gap-4 border-t border-white/15 pt-6 text-sm">
              <div>
                <dt className="text-white/75">{P.vatCh}</dt>
                <dd className="mt-1 font-display text-2xl">{P.vatChValue}</dd>
              </div>
              <div>
                <dt className="text-white/75">{P.vatAt}</dt>
                <dd className="mt-1 font-display text-2xl">{P.vatAtValue}</dd>
              </div>
              <div>
                <dt className="text-white/75">{P.rate}</dt>
                <dd className="mt-1 font-display text-2xl tabular-nums">{hasRate(rateInfo) ? fmtRate(rateInfo.rate) : "–"}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-white/75">
              {hasRate(rateInfo)
                ? `${fill(P.rateFrom, { label: rateNotice(rateInfo, undefined, copy?.client?.rate).label, date: isoDate(rateInfo.date) })}${rateInfo.fallback ? P.rateFallback : ""}`
                : P.rateNone}
            </p>
            <nav aria-label={P.nav} className="mt-8 flex flex-wrap gap-3">
              {/* r8-leads (ux P1-6): standard buttons of the site on the dark hero
                  (components/ui Button onDark), normal case instead of gold capitals. */}
              <Button href="#dl-karte-section" variant="primary" onDark>
                {P.toMap}
              </Button>
              <Button href="#dl-rechner-section" variant="secondary" onDark>
                {P.toCalc}
              </Button>
            </nav>
          </div>
          <HeroMiniMap countries={copy?.client?.map?.countries} />
        </div>
      </header>

      <DreilaenderClient config={config} initialRate={rateInfo} copy={copy?.client || null} />

      <section aria-labelledby="dl-quellen" className="mx-auto max-w-page px-gutter py-12 md:py-16">
        <h2 id="dl-quellen" className="font-display text-2xl text-ink">
          {P.howTitle}
        </h2>
        <div className="mt-4 grid gap-6 text-sm leading-relaxed text-ink/80 md:grid-cols-2">
          <ul className="list-disc space-y-2 pl-5">
            {P.how.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <div>
            <p className="font-semibold text-ink">{P.sourcesTitle}</p>
            <ul className="mt-1">
              {SOURCES.map((src) => (
                <li key={src.href}>
                  <a
                    href={src.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block py-1.5 underline decoration-gold decoration-2 underline-offset-4 hover:text-gold-text"
                  >
                    {P.sources?.[src.href] || src.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-ink/75">
              {P.disclaimer}
            </p>
          </div>
        </div>
      </section>

      {/* R2 gesamtwerk P1-4: Kern-USP (Entscheidung Nr. 8) auch beim Dreiländer-Rechner */}
      <HandBridge className="py-12" variant="feld" copy={P.hand} />
    </div>
  );
}
