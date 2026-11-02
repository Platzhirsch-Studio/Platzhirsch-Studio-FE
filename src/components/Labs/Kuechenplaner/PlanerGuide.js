// Küchenplaner – Server-gerenderter Leitfaden unter dem Werkzeug (SEO-Team
// Küchenplaner, 31.10.2026): erklärt in Text, was der Planer kann, wie es nach
// der Online-Planung im Studio weitergeht, und beantwortet vier Fragen.
// Lesbar ohne JavaScript (der Planer selbst rendert im Client).
//
// Regeln: nur Funktionen, die der Planer wirklich hat (Grundformen aus
// catalog.js SHAPES, Öffnungen aus OPENINGS, Raster 60/55 cm, Prüfungen aus
// src/lib/kuechenplaner/norms.js – Zahlen kommen aus RULES, nicht aus dem Text).
// Keine Preise, kein Superlativ, kein Händlerwort (Gerätemarken nur „einplanen“,
// wie /kuechen-vorarlberg). FAQPage-JSON-LD aus denselben Einträgen wie die
// sichtbaren Fragen (Google: Markup nur für sichtbaren Inhalt).
import Link from "next/link";
import JsonLd from "@/components/Reusable/JsonLd";
import { SITE_URL } from "@/lib/seo/structuredData";
import { faqPageSchema } from "@/lib/seo/faqSchema";
import { keepTogether as kt } from "@/lib/kuechenplaner/typo";
// Sprachen (01.11.2026): Texte in src/lib/kuechenplaner/content.js (DE Mastertext, EN, FR, IT);
// die Zahlen der Prüfung kommen dort weiter aus norms.js (RULES).
import { kpPageCopy } from "@/lib/kuechenplaner/content";
import { BERATUNG_PATHS } from "@/lib/kuechenplaner/planTermin";

const pageUrl = (locale) => `${SITE_URL}/${locale}/kuechenplaner`;

/** FAQ der deutschen Seite (Mastertext, content.js). */
export const PLANER_FAQ = kpPageCopy("de").guide.faq;

const link = "underline underline-offset-4 hover:text-ink";

/** Ziel eines Querverweises in der Sprache der Seite (Beratung hat je Sprache einen eigenen Pfad). */
const hrefOf = (l, locale) => (l.key === "termin" ? `/${locale}${BERATUNG_PATHS[locale] || BERATUNG_PATHS.de}` : `/${locale}${l.href}`);

export default function PlanerGuide({ locale = "de", copy = kpPageCopy("de").guide }) {
  return (
    <section aria-labelledby="kp-guide" className="mx-auto mt-14 max-w-3xl text-[0.9375rem] leading-relaxed text-ink/85" data-kp-guide="">
      <JsonLd data={faqPageSchema(pageUrl(locale), locale, copy.faq)} />
      <h2 id="kp-guide" className="font-display text-2xl leading-tight text-ink sm:text-3xl">
        {copy.title}
      </h2>
      <p className="mt-3">
        {copy.intro}
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5">
        {copy.steps.map((s) => (
          <li key={s.t}>
            <strong className="font-semibold text-ink">{s.t}.</strong> {kt(s.d)}
          </li>
        ))}
      </ol>

      <h2 className="font-display mt-10 text-2xl leading-tight text-ink sm:text-3xl">{copy.studioTitle}</h2>
      <p className="mt-3">
        {copy.studioText}
      </p>
      <ul className="mt-4 space-y-1.5">
        {copy.links.map((l) => (
          <li key={l.key}><Link className={link} href={hrefOf(l, locale)}>{l.label}</Link></li>
        ))}
      </ul>

      <h2 className="font-display mt-10 text-2xl leading-tight text-ink sm:text-3xl">{copy.faqTitle}</h2>
      <dl className="mt-3 border-t border-ink/10">
        {copy.faq.map((it) => (
          <div key={it.q} className="border-b border-ink/10 py-4">
            <dt className="font-semibold text-ink">{it.q}</dt>
            <dd className="mt-1">{it.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
