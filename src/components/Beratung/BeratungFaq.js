// src/components/Beratung/BeratungFaq.js
// Rat 9,5 C6 (SEO12): questions about the consultation on /beratung, visible
// on the page AND as FAQPage JSON-LD (same text, Google's rule). Only facts
// the site states elsewhere: hand drawing + model before 3D (Inhaber-
// Entscheidung Nr. 8), studio address, visits on request, what to bring,
// opening hours from src/lib/site.js. No price, no "kostenlos", no reply time.
// Server Component; texts: inhalt.beratung.faq in src/messages (übernommen 30.10.2026).
import { Container, Heading } from "@/components/ui";
// QM content-legal r3: the house time format of footer and menu („Di.–Fr. 10–18 Uhr“).
import { menuHoursLine } from "@/components/Navbar/menuHours";
import { getTranslations } from "next-intl/server";
import { keepRanges, softHyphens } from "@/components/UberUns/softHyphens";

const SITE = "https://platzhirsch.studio";

/** [{ q, a }] in the locale, opening hours filled in. */
export async function faqItems(locale) {
  const t = await getTranslations({ locale, namespace: "inhalt.beratung.faq" });
  const hours = menuHoursLine(locale);
  return (t.raw("items") || []).map((it) => ({ q: it.q, a: it.a.replace("{hours}", hours) }));
}

/** FAQPage JSON-LD for the page URL ("/de/beratung"). */
export async function faqSchema(locale, pageUrl) {
  const items = await faqItems(locale);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE}${pageUrl}#faq`,
    inLanguage: locale,
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

export default async function BeratungFaq({ locale }) {
  const t = await getTranslations({ locale, namespace: "inhalt.beratung.faq" });
  const items = await faqItems(locale);
  if (!items.length) return null;
  return (
    <section aria-labelledby="beratung-faq" className="border-t border-line" data-beratung-faq="">
      <Container size="page" className="py-16 md:py-24">
        {/* QM r3 (Zoom 200 %): explicit minmax(0,1fr) column – the implicit auto column grew to the longest word. */}
        <div className="grid grid-cols-1 gap-y-8 gap-x-grid hyphens-auto wrap-break-word lg:grid-cols-12">
          <Heading id="beratung-faq" level={2} className="min-w-0 lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
            {t("title")}
          </Heading>
          <dl className="min-w-0 reveal-group border-t border-line-strong [--reveal-y:12px] lg:col-span-7 lg:col-start-6">
            {items.map((it) => (
              <div key={it.q} className="border-b border-line py-6">
                {/* QM r3: soft hyphens at compound joints („Einrichtungs-/beratung“, WebKit
                    without dictionary cut mid-word at 200 %); ranges (Di–Fr) stay together. */}
                <dt className="text-title text-text">{softHyphens(it.q)}</dt>
                <dd className="mt-2 max-w-measure text-body text-text-soft">{keepRanges(softHyphens(it.a))}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
