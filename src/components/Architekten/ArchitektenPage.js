// /<locale>/architekten – Für Architekten, Bauträger und Makler (Welle 2).
// Kapitel: Auftakt · Angebot (+ Ansprechperson) · Zusammenarbeit (Handskizze
// als gemeinsame Sprache) · Bauträger · Home-Staging (die EINE Walnut-Fläche)
// · Muster + Anfrage · Fragen. Ein Primärknopf im Auftakt (Anker), der
// Senden-Knopf im Formular. Keine Bilder: Haralds Material folgt
// (Inhaber-Entscheidung Nr. 8), bis dahin trägt die Seite typografisch –
// keine Platzhalter sichtbar. Texte: src/lib/architekten/copy.js.
import { Suspense } from "react";
import { Mail } from "lucide-react";
import JsonLd from "@/components/Reusable/JsonLd";
import { Accordion, Breadcrumbs, Button, Eyebrow, Heading, Horizon, Lead, LinkArrow, Section, cx } from "@/components/ui";
import ArchitektenForm, { ArchitektenFormWithParams } from "./ArchitektenForm";
import { architektenCopy } from "@/lib/architekten/copy";
import { dealerStatement } from "@/lib/legal/claims";
import { ezarriDealerClaimVisible } from "@/lib/ezarri/config";
import StudioSchema from "@/components/Landing/schema/StudioSchema";
// Motion 01.11.2026: Reveal je Listenpunkt/Spalte (nur gemeinsame Tokens).
import { staggerStyle } from "@/components/Landing/motionLanding";
import { H1_FIT, PAGE_HY, fitHeading } from "@/components/Landing/typoLanding";

// Händler-Satz nur aus dem Claim-Register und, für Ezarri, nur mit offenem Schalter.
const dealerLine = (brand, locale) => (brand !== "ezarri" || ezarriDealerClaimVisible() ? dealerStatement(brand, locale) : "");

const CH_GRID = "grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-8";

function Head({ id, overline, title, lead, tone = "light" }) {
  const dark = tone === "dark";
  return (
    // QM R3: Titelspalte 5 statt 4 von 12 – in 4 Spalten brachen die H2 am iPad quer vier- bis fünfmal.
    <div className="lg:col-span-5">
      <Eyebrow tone={dark ? "inverse" : "accent"}>{overline}</Eyebrow>
      <Heading id={id} level={2} tone={dark ? "inverse" : "text"} className="mt-stack-s max-w-[20ch] text-balance">
        {fitHeading(title)}
      </Heading>
      {lead && <p className={`mt-stack-m max-w-measure text-body text-pretty ${dark ? "text-text-inverse-soft" : "text-text-soft"}`}>{lead}</p>}
    </div>
  );
}

// QM R3: Nummer über dem Titel, solange die Seite schmaler als 30 rem ist (Handy, Textzoom ×2) –
// als eigene Spalte blieben dem Text dort nur 1–2 Wörter je Zeile.
function NumberedList({ items, tone = "light" }) {
  const dark = tone === "dark";
  return (
    <ol className="lg:col-span-7 lg:col-start-6">
      {items.map((s, i) => (
        <li key={s.title} className={`reveal grid grid-cols-1 gap-y-1 border-t py-5 @min-[30rem]/page:grid-cols-[2.5rem_minmax(0,1fr)] @min-[30rem]/page:gap-x-3 ${dark ? "border-line-inverse" : "border-line"}`}>
          <span aria-hidden="true" className={`pt-1 text-small tabular ${dark ? "text-text-inverse-soft" : "text-text-soft"}`}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <Heading level={3} tone={dark ? "inverse" : "text"}>
              {fitHeading(s.title)}
            </Heading>
            <p className={`mt-2 max-w-measure text-body text-pretty ${dark ? "text-text-inverse-soft" : "text-text-soft"}`}>{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function ArchitektenPage({ copy: copyProp, locale, contact = null, schema = null }) {
  const copy = copyProp || architektenCopy(locale);
  const { HERO, ANGEBOT, ABLAUF, BAUTRAEGER, STAGING, FAQ, CRUMBS } = copy;
  // Ezarri-Welt gibt es nur auf Deutsch (src/lib/ezarri/config.js EZARRI_LOCALES).
  const ezarriHref = locale === "de" ? "/ezarri/anfrage?art=muster&quelle=architekten" : null;
  const formProps = { copy, locale, ezarriHref };
  return (
    <div className={PAGE_HY}>
      <JsonLd data={schema} />
      <Section tone="surface" spacing="none" labelledBy="architekten-title" className="pt-8 pb-10 md:pt-12 md:pb-16">
        <Breadcrumbs items={CRUMBS} className="[&_a]:min-h-11" />
        {/* Rat 9,5 B7 + B10: Studio-Grafik (Schnitt mit Planungsdaten-Layer) als Bildsignal –
            mobil H1 → Knopf → Grafik (flaches Band) → Lead (Design-Jury P1-4: die H1
            zuerst); ab lg rechte Spalte, Text links (keine leere Hälfte). */}
        <div className="mt-4 grid grid-cols-1 gap-y-6 lg:mt-stack-m lg:grid-cols-12 lg:gap-x-8 lg:gap-y-0">
          <div className="lg:col-span-7 lg:col-start-1 lg:row-start-1">
            <Eyebrow>{HERO.overline}</Eyebrow>
            <Heading id="architekten-title" level={1} size="display-l" className={cx("mt-stack-s max-w-[16ch] text-balance", H1_FIT)}>
              {fitHeading(HERO.title)}
            </Heading>
          </div>
          <div className="flex flex-col items-start gap-1 lg:col-span-7 lg:col-start-1 lg:row-start-3 lg:mt-stack-m">
            <Button href="#anfrage" variant="primary" arrow>
              {HERO.cta}
            </Button>
            <p className="mt-1 text-small text-text-soft">{HERO.ctaNote}</p>
            <LinkArrow href="#home-staging" className="mt-2">
              {HERO.staging}
            </LinkArrow>
          </div>
          <div className="lg:col-span-5 lg:col-start-8 lg:row-span-3 lg:row-start-1">
            <StudioSchema kind="architekten" locale={locale} />
          </div>
          <Lead tone="soft" className="max-w-measure text-pretty lg:col-span-7 lg:col-start-1 lg:row-start-2 lg:mt-stack-m">
            {HERO.lead}
          </Lead>
        </div>
        <Horizon className="mt-10 lg:mt-16" />
      </Section>

      <Section tone="surface" spacing="none" labelledBy="angebot-title" className="pb-12 md:pb-20">
        <div className={CH_GRID}>
          <Head id="angebot-title" overline={ANGEBOT.overline} title={ANGEBOT.title} />
          <div className="lg:col-span-7 lg:col-start-6">
            <ul className="grid gap-x-8 sm:grid-cols-2">
              {ANGEBOT.items.map((it, i) => (
                <li key={it.id} id={`angebot-${it.id}`} className="reveal border-t border-line py-5" style={staggerStyle(i, 2)}>
                  <Heading level={3}>{fitHeading(it.title)}</Heading>
                  <p className="mt-2 max-w-measure text-body text-text-soft text-pretty">
                    {it.text}
                    {it.dealerBrand && dealerLine(it.dealerBrand, locale) ? <span data-architekten-dealer=""> {dealerLine(it.dealerBrand, locale)}</span> : null}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-6 bg-surface-raised p-5 sm:p-6" data-contact={contact ? "person" : "role"}>
              <p className="text-small text-text-soft">{ANGEBOT.contactRole}</p>
              {contact ? (
                <>
                  <p className="mt-1 text-title text-text">{contact.name}</p>
                  <p className="text-body text-text-soft">{contact.role}</p>
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="mt-2 inline-flex min-h-11 items-center gap-2 text-ui text-text underline underline-offset-4">
                      <Mail aria-hidden="true" className="size-4" strokeWidth={1.5} />
                      {ANGEBOT.contactMail.replace("{name}", contact.name)}
                    </a>
                  )}
                </>
              ) : (
                <p className="mt-1 text-body text-text">{ANGEBOT.contactFallback}</p>
              )}
            </div>
          </div>
        </div>
      </Section>

      <Section tone="band" spacing="compact" labelledBy="ablauf-title">
        <div className={CH_GRID}>
          <div className="lg:col-span-5">
            <Head id="ablauf-title" overline={ABLAUF.overline} title={ABLAUF.title} lead={ABLAUF.lead} />
            <LinkArrow href="/arbeitsweise" className="mt-4">
              {ABLAUF.processLink}
            </LinkArrow>
          </div>
          <NumberedList items={ABLAUF.steps} />
        </div>
      </Section>

      <Section tone="surface" spacing="compact" labelledBy="bautraeger-title">
        <div className={CH_GRID}>
          <Head id="bautraeger-title" overline={BAUTRAEGER.overline} title={BAUTRAEGER.title} lead={BAUTRAEGER.lead} />
          {/* QM R3: in der 7er-Spalte (lg/xl) waren drei Spalten nur ~190 px breit – die Überschriften
              trennten („Muster-/wohnung“, „Ausstat-/tungslinien“). Ab lg daher Zeilen: Titel links, Text rechts. */}
          <ul className="grid gap-x-8 md:grid-cols-3 lg:col-span-7 lg:col-start-6 lg:grid-cols-1" data-arch-bautraeger="">
            {BAUTRAEGER.items.map((it, i) => (
              <li key={it.title} className="reveal border-t border-line py-5 lg:grid lg:grid-cols-[minmax(0,9fr)_minmax(0,11fr)] lg:gap-x-8" style={staggerStyle(i, 3)}>
                {/* QM R1: Titelspalte als Anteil (9/20) statt fest 14 rem – „Ausstattungslinien“ passt ab lg
                    ganz; bei Textzoom wächst die Spalte nicht über den Text. Weiche Trennstellen
                    (fitHeading) statt overflow-wrap: nie mehr „Ausstattungslinie/n“ ohne Strich. */}
                <Heading level={3}>
                  {fitHeading(it.title)}
                </Heading>
                <p className="mt-2 max-w-measure text-body text-text-soft text-pretty lg:mt-0">{it.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="inverse" spacing="compact" labelledBy="staging-title" id="home-staging" className="scroll-mt-[72px]">
        <div className={CH_GRID}>
          <div className="lg:col-span-5">
            <Head id="staging-title" overline={STAGING.overline} title={STAGING.title} lead={STAGING.lead} tone="dark" />
            <p className="mt-4 text-small text-text-inverse-soft">{STAGING.note}</p>
            <Button href="/architekten?anliegen=staging#anfrage" variant="secondary" onDark className="mt-stack-s">
              {STAGING.cta}
            </Button>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <NumberedList items={STAGING.steps} tone="dark" />
            {/* QM R1: zieht mit dem Reveal der Schritte mit – sonst lief „04 Abbau“ beim Hereinscrollen über die Goldlinie. */}
            <div className="reveal border-t border-accent-on-dark pt-5">
              <Heading level={3} tone="inverse">
                {fitHeading(STAGING.buyer.title)}
              </Heading>
              <p className="mt-2 max-w-measure text-body text-text-inverse-soft">{STAGING.buyer.text}</p>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="surface" spacing="compact" labelledBy="anfrage-title" id="anfrage" className="scroll-mt-[72px]">
        <Suspense fallback={<ArchitektenForm {...formProps} />}>
          <ArchitektenFormWithParams {...formProps} />
        </Suspense>
      </Section>

      <Section tone="band" spacing="compact" labelledBy="faq-title">
        <div className={CH_GRID}>
          <Head id="faq-title" overline={FAQ.overline} title={FAQ.title} />
          <div className="lg:col-span-7 lg:col-start-6">
            <Accordion headingLevel={3} items={FAQ.items.map((f, i) => ({ id: `faq-${i}`, title: f.q, content: <p className="max-w-measure text-body text-text-soft">{f.a}</p> }))} />
          </div>
        </div>
      </Section>
    </div>
  );
}
