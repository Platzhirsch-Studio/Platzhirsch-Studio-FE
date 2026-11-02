// src/components/Reusable/SeoFaq.js
// FAQ block for GEO W5 (SEO-Team A, 31.10.2026): visible questions AND the
// FAQPage JSON-LD from the same items (src/lib/seo/faqSchema.js). Texts in
// messages seoGeo.faq.<page> (server-only namespace). Placeholders such as
// {dealers} are filled by the caller – dealer sentences only from the
// Claim-Guard (dealerStatementList in src/lib/legal/claims.js).
// Async Server Component, no client JS. One block per page (one FAQPage).
import { getTranslations } from "next-intl/server";
import JsonLd from "@/components/Reusable/JsonLd";
import { Container, Heading } from "@/components/ui";
import { faqItemsFrom, faqPageSchema } from "@/lib/seo/faqSchema";

/**
 * `title` + `items` (optional): eigene Fragen statt seoGeo.faq.<page>, etwa aus
 * einer Server-Texttabelle (Bad & Wellness: badWellnessHub.js). Gleiche
 * Platzhalter- und Schema-Regeln.
 * `flush` (optional, QM 01.11.2026): Überschrift ab xl an der Inhaltskante statt in
 * Spalte 2 eingerückt – für Seiten, deren übrige Blöcke alle bei Spalte 1 beginnen
 * (Küchengeräte, Bad & Wellness). Ohne `flush` bleibt das Layout unverändert.
 * @param {{locale: string, page: "about"|"badWellness"|"kuechengeraete", pageUrl: string, vars?: Record<string,string>, title?: string, items?: {q: string, a: string}[], flush?: boolean}} props
 */
export default async function SeoFaq({ locale, page, pageUrl, vars = {}, title, items: ownItems, flush = false }) {
  const t = ownItems ? null : await getTranslations({ locale, namespace: `seoGeo.faq.${page}` });
  const items = faqItemsFrom(ownItems ?? t.raw("items"), vars);
  if (!items.length) return null;
  const id = `faq-${page}`;
  return (
    <section aria-labelledby={id} className="border-t border-line" data-seo-faq={page}>
      <JsonLd data={faqPageSchema(pageUrl, locale, items)} />
      <Container size="page" className="py-16 md:py-24">
        <div className="grid gap-y-8 gap-x-grid lg:grid-cols-12">
          <Heading id={id} level={2} className={flush ? "text-balance lg:col-span-4" : "lg:col-span-4 xl:col-start-2 xl:col-span-3"}>
            {title ?? t?.("title")}
          </Heading>
          <dl className="border-t border-line-strong lg:col-span-7 lg:col-start-6">
            {items.map((it) => (
              <div key={it.q} className="border-b border-line py-6">
                <dt className="text-title text-text">{it.q}</dt>
                <dd className="mt-2 max-w-measure text-body text-text-soft">{it.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
