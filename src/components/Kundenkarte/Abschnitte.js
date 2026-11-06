// Abschnitte der Seite /[locale]/kundenkarte: Vorteile je Stufe (Tabelle),
// „So funktioniert es“ (3 Schritte) und FAQ (sichtbar + FAQPage JSON-LD mit
// demselben Text). Server-Komponenten; Texte aus src/lib/kundenkarte/copy.js.
import { Check, Minus } from "lucide-react";
import { Container, Eyebrow, Heading } from "@/components/ui";
import { STUFEN, VORTEILE } from "@/lib/kundenkarte/copy";
import { SITE_URL } from "@/lib/site";

export function VorteileTabelle({ copy, id = "vorteile" }) {
  const t = copy.stufen;
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 border-t border-line bg-surface" data-kundenkarte-vorteile="">
      <Container size="page" className="py-16 md:py-24">
        <div className="max-w-measure">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <Heading id={`${id}-title`} level={2} className="mt-stack-s text-balance">
            {t.title}
          </Heading>
          <p className="mt-5 text-body text-text-soft">{t.intro}</p>
        </div>

        {/* Tabelle: ab md drei Stufen-Spalten; auf dem Handy wird jede Zeile zu einem Block mit drei Zellen. */}
        <div className="mt-10 overflow-hidden border border-line">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">{t.title}</caption>
            <thead>
              <tr className="hidden md:table-row">
                <th scope="col" className="w-[40%] border-b border-line-strong bg-surface-raised px-5 py-4 text-ui text-text">
                  {t.vorteilLabel}
                </th>
                {STUFEN.map((s) => (
                  <th key={s.key} scope="col" className="border-b border-l border-line-strong bg-surface-raised px-5 py-4 align-top">
                    <span className="block font-display text-title leading-tight text-text">{t.names[s.key]}</span>
                    <span className="mt-1 block text-small font-normal text-text-soft">{t.tierNote[s.key]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VORTEILE.map((v) => (
                <tr key={v.key} className="block border-b border-line last:border-b-0 md:table-row">
                  <th scope="row" className="block px-5 pt-5 pb-3 text-left font-normal md:table-cell md:py-5 md:align-top">
                    <span className="block text-ui text-text">{copy.vorteile[v.key].titel}</span>
                    <span className="mt-1 block max-w-[40ch] text-small text-text-soft">{copy.vorteile[v.key].text}</span>
                  </th>
                  {STUFEN.map((s) => {
                    const on = v.stufen.includes(s.key);
                    return (
                      <td key={s.key} className="flex items-center justify-between gap-3 px-5 py-2 md:table-cell md:border-l md:border-line md:py-5 md:align-top" data-stufe={s.key} data-inklusive={on ? "1" : "0"}>
                        <span className="text-small text-text-soft md:hidden">{t.names[s.key]}</span>
                        <span className={`inline-flex items-center gap-2 text-small ${on ? "text-text" : "text-text-soft"}`}>
                          {on ? <Check size={18} strokeWidth={1.75} aria-hidden="true" className="text-success" /> : <Minus size={18} strokeWidth={1.5} aria-hidden="true" />}
                          {on ? t.included : t.notIncluded}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-5 max-w-measure text-small text-text-soft">{t.footnote}</p>
      </Container>
    </section>
  );
}

export function Schritte({ copy, id = "ablauf" }) {
  const t = copy.schritte;
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 border-t border-line bg-surface-raised" data-kundenkarte-schritte="">
      <Container size="page" className="py-16 md:py-24">
        <Eyebrow>{t.eyebrow}</Eyebrow>
        <Heading id={`${id}-title`} level={2} className="mt-stack-s text-balance">
          {t.title}
        </Heading>
        <ol className="mt-10 grid gap-6 md:grid-cols-3 md:gap-grid">
          {t.items.map((step, i) => (
            <li key={step.titel} className="flex gap-5 border-t border-line-strong pt-5">
              <span aria-hidden="true" className="font-display text-display-m leading-none text-text-accent">
                {i + 1}
              </span>
              <div className="min-w-0">
                <h3 className="text-title text-text">
                  {step.titel}
                  {i === 2 && <span className="ml-2 inline-block align-middle border border-line-control px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-soft">{t.inPreparation}</span>}
                </h3>
                <p className="mt-2 text-body text-text-soft">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/** FAQPage JSON-LD für die Seiten-URL (ohne Domain, z. B. "/de/kundenkarte"). */
export function faqSchema(copy, pagePath, locale) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}${pagePath}#faq`,
    inLanguage: locale,
    mainEntity: copy.faq.items.map((it) => ({ "@type": "Question", name: it.q, acceptedAnswer: { "@type": "Answer", text: it.a } })),
  };
}

export function Faq({ copy, id = "faq" }) {
  const t = copy.faq;
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 border-t border-line bg-surface" data-kundenkarte-faq="">
      <Container size="page" className="py-16 md:py-24">
        <div className="grid grid-cols-1 gap-x-grid gap-y-8 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-4 lg:self-start lg:sticky lg:top-28">
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <Heading id={`${id}-title`} level={2} className="mt-stack-s text-balance">
              {t.title}
            </Heading>
          </div>
          <dl className="min-w-0 border-t border-line-strong lg:col-span-7 lg:col-start-6">
            {t.items.map((it) => (
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
