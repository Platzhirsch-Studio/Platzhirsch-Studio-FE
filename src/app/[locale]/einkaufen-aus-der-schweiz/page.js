// /de/einkaufen-aus-der-schweiz – Schweiz-Hub (Masterplan AP6 Nr. 2, R5-schweiz).
// ENTWURF: noindex,follow, eigener Canonical (Runde 3 P5), nicht in Sitemap, llms.txt oder
// Navigation, bis Steuerberater und Zollspediteur den Text freigeben.
// DE in de-CH-Schreibung ("ss" statt "ß"); EN, FR (Romandie) und IT (Tessin)
// seit 01.11.2026 aus src/lib/ch/content-intl.js (gleiche Struktur und Quellen,
// nur übersetzte Texte). Weiter noindex bis zur Freigabe, je Sprache eigene Canonical.
// Texte: src/lib/ch/content.js (jede Aussage mit Quelle, [prüfen]-Stellen
// werden nicht gerendert). Rechner: src/components/Schweiz/ChfRechner.js
// (Client-Insel) → Server Function src/lib/ch/actions.js.
// Doku: Marktresearch/digital/redesign/schweiz-hub.md
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Eyebrow, Heading, Section } from "@/components/ui";
import { CheckList, FaqSection, LandingClosing, LandingHero, ProcessNote, SectionHead, ShowroomFacts, beratungHref } from "@/components/Landing/parts";
import ChfRechner from "@/components/Schweiz/ChfRechner";
import DraftBanner from "@/components/Schweiz/DraftBanner";
import { getEurChf } from "@/components/Labs/Dreilaender/ecb.server";
import { getConfig } from "@/components/Labs/Dreilaender/store.server";
import { ABLAUF, AS_OF, BANNER, CLOSING, EINBAU, FAQ, HERO, RECHNER, SHOWROOM, SOURCES, WEGE, visible } from "@/lib/ch/content";
import { EXAMPLE, LABEL, ROUNDING, chf, estimateChf } from "@/lib/ch/estimate";
import { ECB_SOURCE, rateInfoView } from "@/lib/ch/view";
import { HTML_LANG, chCopy } from "@/lib/ch/content-intl";
import { ogLocale, seoAlternates } from "@/lib/seo/pageMetadata";

// EZB-Kurs: 12 h Data-Cache in ecb.server.js; die Seite folgt im gleichen Takt.
export const revalidate = 43200;

const CANONICAL = "https://platzhirsch.studio/de/einkaufen-aus-der-schweiz";
const urlOf = (locale) => `https://platzhirsch.studio/${locale}/einkaufen-aus-der-schweiz`;
// Sprachfassungen für hreflang – seoAlternates() lässt sie weg, solange die Seite noindex ist.
const LANGUAGES = { de: urlOf("de"), "de-CH": urlOf("de"), en: urlOf("en"), fr: urlOf("fr"), it: urlOf("it"), "x-default": urlOf("de") };

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = chCopy(locale);
  if (t) {
    const robots = { index: false, follow: true };
    const url = urlOf(locale);
    return {
      title: `${t.META.title} | Platzhirsch Home Living`,
      description: t.META.description,
      robots,
      alternates: seoAlternates({ canonical: url, languages: LANGUAGES, robots }),
      openGraph: { type: "website", url, title: t.META.title, description: t.META.description, siteName: "Platzhirsch Home Living", locale: ogLocale(locale) },
    };
  }
  if (locale !== "de") return {};
  const title = "Einkaufen aus der Schweiz";
  const description =
    "Möbel aus Lochau in die Schweiz: zwei Wege über die Grenze, Ablauf von Ausfuhr und Einfuhr und eine unverbindliche Kostenschätzung in Franken.";
  return {
    title: `${title} | Platzhirsch Home Living`,
    description,
    // Entwurf: nicht indexieren, Links aber folgen (seo P1-4, Runde 3 P5):
    // noindex und unverlinkt bis zur Freigabe, aber mit eigenem Canonical, damit
    // Parameter-Varianten (?ort=, ?thema=) auf die Seite selbst zeigen. Kein
    // hreflang: die Seite gibt es nur auf Deutsch (andere Locales 404).
    robots: { index: false, follow: true },
    alternates: { canonical: CANONICAL },
    openGraph: { type: "website", url: CANONICAL, title, description, siteName: "Platzhirsch Home Living", locale: "de_CH" },
  };
}

const COPY = {
  label: LABEL,
  rounding: ROUNDING,
  sourceUrl: ECB_SOURCE.url,
  amountLabel: "Preis in Euro (inkl. 20 % österreichischer USt)",
  amountHint: "Zum Beispiel 25000 oder 25’000",
  freightLabel: "Lieferkosten in Euro, falls bekannt (Weg B)",
  freightHint: "Leer lassen, wenn noch kein Angebot vorliegt. Die MWST wird dann auf die Lieferung mitgerechnet.",
  submit: "Kosten schätzen",
  pending: "Rechnet …",
  errorSummary: "Bitte die markierten Angaben prüfen.",
  rateLabel: "Kurs",
  dateLabel: "Datum",
  sourceLabel: "Quelle",
  inputLine: "Eingabe:",
  compareLabel: "österreichischer Bruttopreis in CHF:",
  totalLabel: "Ihre Kosten, geschätzt",
};

function Sources({ keys, sources = SOURCES, newWindow = " (öffnet in neuem Fenster)" }) {
  const list = [...new Set(keys)].map((k) => sources[k]).filter(Boolean);
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-small text-text-soft">
      {list.map((s) => (
        <li key={s.url}>
          <a href={s.url} className="inline-flex min-h-6 items-center underline decoration-line-strong underline-offset-4 hover:decoration-current" rel="noopener noreferrer" target="_blank">
            {s.label}
            <span className="sr-only">{newWindow}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

// Deutsche Seitentexte (EN/FR/IT: content-intl.js → UI).
const UI_DE = {
  primaryLabel: "Termin anfragen",
  wegeEyebrow: "Wege A und B",
  fitLabel: "Geeignet für: ",
  wayA: "Weg A",
  wayB: "Weg B",
  stepEyebrow: "Schritt für Schritt",
  estimates: "Schätzwerte: Verzollungsgebühr {fee} zzgl. 8,1 %, eigener Transport {transport}. Speditionen veröffentlichen keine Tarife; lassen Sie sich die Gebühr vorab nennen.",
  asOf: "Stand {date}",
  sourcesHeading: "Quellen",
  newWindow: " (öffnet in neuem Fenster)",
  draftAria: "Hinweis zum Stand dieser Seite",
  sourcesNote: null,
};
const DE_CONTENT = { BANNER, HERO, WEGE, EINBAU, ABLAUF, RECHNER, FAQ, SHOWROOM, CLOSING, SOURCES };
const chfRangeShort = (r) => `${chf(r.min)}–${chf(r.max).replace(/^CHF\s*/, "")}`;

// Runde 2 (P3): Kern-USP auf dem Schweiz-Hub (gesamtwerk P1-4) und Termin-Knöpfe
// mit Herkunft (ux P1-1). Satz bewusst ohne Zusage zu Vor-Ort-Terminen in der
// Schweiz (Gebiet bestätigt der Inhaber).
const USP_TEXT =
  "Auch für Kundinnen und Kunden aus der Schweiz beginnt die Planung bei Ihren Räumen: Harald Menghin zeichnet Ihr Konzept von Hand, danach planen wir in 3D, und Sie sehen Ihren Raum fotorealistisch, bevor etwas bestellt wird.";
const APPOINTMENT_HREF = beratungHref({ ort: "schweiz" });

const keysOf = (items) => visible(items).flatMap((i) => i.src || []);

export default async function EinkaufenAusDerSchweizPage({ params }) {
  const { locale } = await params;
  const t = chCopy(locale);
  if (locale !== "de" && !t) notFound();
  setRequestLocale(locale);
  // Inhalte der Sprache (gleiche Struktur wie content.js); die Namen verdecken die DE-Importe.
  const { BANNER, HERO, WEGE, EINBAU, ABLAUF, RECHNER, FAQ, SHOWROOM, CLOSING, SOURCES } = t || DE_CONTENT;
  const UI = t?.UI || UI_DE;
  const rechnerCopy = t ? { ...COPY, ...t.RECHNER_COPY, lang: locale } : COPY;
  const src = { sources: SOURCES, newWindow: UI.newWindow };

  const [config, info] = await Promise.all([getConfig(), getEurChf()]);
  const rate = rateInfoView(info, t?.VIEW);
  const values = { betrag: "25’000", fracht: "" };
  const initial = rate.usable
    ? { status: "ok", values, rate, result: estimateChf({ grossEur: EXAMPLE.grossEur, rate: info.rate, config, text: t?.EST }) }
    : { status: "norate", values, rate };

  return (
    <div lang={HTML_LANG[locale] || "de-CH"}>
      <DraftBanner title={BANNER.title} text={BANNER.text} ariaLabel={UI.draftAria} />
      <LandingHero
        swiss
        title={HERO.title}
        eyebrow={HERO.eyebrow}
        lead={HERO.lead}
        crumb={HERO.title}
        primaryLabel={UI.primaryLabel}
        facts={visible(HERO.facts)}
        appointmentHref={APPOINTMENT_HREF}
      />

      <Section tone="surface" labelledBy="wege-title">
        <SectionHead id="wege-title" eyebrow={UI.wegeEyebrow} title={WEGE.heading} text={WEGE.text} />
        <div className="mt-12 lg:mt-16 grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:gap-x-12">
          {WEGE.items.map((weg) => (
            <article key={weg.id} aria-labelledby={`weg-${weg.id}`} className="border-t-2 border-ink pt-6">
              <Heading id={`weg-${weg.id}`} level={3} size="title">
                {weg.title}
              </Heading>
              <p className="mt-stack-s max-w-measure text-body text-text-soft">{weg.lead}</p>
              <CheckList className="mt-stack-m" items={visible(weg.points).map((p) => p.text)} />
              {weg.zoll && (
                <div className="mt-stack-m">
                  <h4 className="text-ui font-semibold text-text">{weg.zoll.heading}</h4>
                  <dl className="mt-2">
                    {visible(weg.zoll.items).map((z) => (
                      <div key={z.name} className="flex justify-between gap-4 border-b border-line py-2 text-small">
                        <dt className="text-text">{z.name}</dt>
                        <dd className="text-right text-text-soft tabular">{z.hours}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-2 text-small text-text-soft">{weg.zoll.note}</p>
                </div>
              )}
              <p className="mt-stack-m text-body text-text">
                <span className="font-semibold">{UI.fitLabel}</span>
                {weg.fit}
              </p>
              <Sources {...src} keys={[...keysOf(weg.points), ...(weg.zoll ? keysOf(weg.zoll.items) : [])]} />
            </article>
          ))}
        </div>
      </Section>

      <Section tone="band" labelledBy="einbau-title" spacing="compact">
        <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-8">
          <Heading id="einbau-title" level={2} size="title" className="lg:col-span-4">
            {EINBAU.heading}
          </Heading>
          <div className="max-w-measure space-y-4 text-body text-text lg:col-span-7 lg:col-start-6">
            {visible(EINBAU.paragraphs).map((p) => (
              <p key={p.text}>{p.text}</p>
            ))}
            <Sources {...src} keys={keysOf(EINBAU.paragraphs)} />
          </div>
        </div>
      </Section>

      <Section tone="surface" labelledBy="ablauf-title">
        <SectionHead id="ablauf-title" eyebrow={UI.stepEyebrow} title={ABLAUF.heading} />
        <ol className="mt-12 lg:mt-16 border-t border-line">
          {visible(ABLAUF.steps).map((s, i) => (
            <li key={s.title} className="grid grid-cols-1 gap-y-3 border-b border-line py-6 md:grid-cols-12 md:gap-x-8">
              <p className="text-ui font-semibold text-text md:col-span-3">
                <span className="mr-3 text-text-accent tabular">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </p>
              <dl className="grid grid-cols-1 gap-3 text-body md:col-span-9 md:grid-cols-2 md:gap-x-8">
                <div>
                  <dt className="text-overline uppercase text-text-soft">{UI.wayA}</dt>
                  <dd className="mt-1 text-text">{s.a}</dd>
                </div>
                <div>
                  <dt className="text-overline uppercase text-text-soft">{UI.wayB}</dt>
                  <dd className="mt-1 text-text">{s.b}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
        <Sources {...src} keys={keysOf(ABLAUF.steps)} />
      </Section>

      <Section tone="raised" labelledBy="rechner-title" id="rechner">
        <SectionHead id="rechner-title" eyebrow={rechnerCopy.label} title={RECHNER.heading} text={RECHNER.text} />
        <p className="mt-stack-s max-w-measure text-small text-text-soft">{RECHNER.example}</p>
        <div className="mt-12 lg:mt-16">
          <ChfRechner initial={initial} copy={rechnerCopy} />
        </div>
        <ul className="mt-stack-m max-w-measure space-y-2 border-t border-line pt-4 text-small text-text-soft">
          <li>{UI.estimates.replace("{fee}", chfRangeShort(config.customsFeeChf)).replace("{transport}", chfRangeShort(config.selfTransportChf))}</li>
          {RECHNER.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </Section>

      <FaqSection swiss faq={{ ...FAQ, items: visible(FAQ.items) }} />

      <Section tone="surface" labelledBy="quellen-title" spacing="compact">
        <Eyebrow>{UI.asOf.replace("{date}", AS_OF)}</Eyebrow>
        <Heading id="quellen-title" level={2} size="title" className="mt-stack-s">
          {UI.sourcesHeading}
        </Heading>
        {UI.sourcesNote && <p className="mt-stack-s max-w-measure text-small text-text-soft">{UI.sourcesNote}</p>}
        <ul className="mt-stack-m grid grid-cols-1 gap-x-8 text-small md:grid-cols-2">
          {Object.values(SOURCES).map((s) => (
            <li key={s.url} className="border-b border-line">
              <a href={s.url} rel="noopener noreferrer" target="_blank" className="flex min-h-11 items-center py-2 text-text underline decoration-line-strong underline-offset-4 hover:decoration-current">
                {s.label}
                <span className="sr-only">{UI.newWindow}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-stack-m max-w-measure text-small text-text-soft">{BANNER.text}</p>
      </Section>

      <ProcessNote swiss text={t ? UI.usp : USP_TEXT} copy={t?.PROCESS || null} />
      <ShowroomFacts swiss heading={SHOWROOM.heading} text={SHOWROOM.text} />
      <LandingClosing swiss heading={CLOSING.heading} text={CLOSING.text} primaryLabel={UI.primaryLabel} appointmentHref={APPOINTMENT_HREF} />
    </div>
  );
}
