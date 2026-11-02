// Shared building blocks of the landing pages (Neuauftritt, Design-Bibel §4–§9):
// the general template (landingPage.js) and the two special pages
// (Yacht/YachtLanding.js, Outdoor/OutdoorLanding.js) use the same hero,
// section header, FAQ, showroom facts and closing band.
// All server components (no "use client", not async): the copy stays in the
// HTML for crawlers.
//
// Wording rules for everything rendered here (Bibel §1, §11, §14; UWG audit):
// no superlatives, no dealer formula ("offizieller Händler" only ClassiCon),
// no "abgesicherte Anzahlung", no invented facts. The CTA word is
// "Termin anfragen" (Runde 2, ux P1-5: nothing is booked – it is a request;
// local override in ./copy.js, the messages keep their key), the Leitsatz
// appears once, in the closing band. Every CTA carries its context
// (?thema=…&ort=…, ux P1-1) via `appointmentHref`.
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Accordion,
  Breadcrumbs,
  Button,
  Container,
  Eyebrow,
  Heading,
  Lead,
  Leitsatz,
  LinkArrow,
  Media,
  Section,
  SmartLink,
  cx,
} from "@/components/ui";
import { menuTrail } from "@/components/ui/menuTrail";
import { breadcrumbSchemaItems, homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { ADDRESS, DIRECTIONS_URL, EMAIL, EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF, SITE_URL } from "@/lib/site";
import { ROUTES } from "@/utils/routing";
import { ownCalendarActive } from "@/components/Booking/config";
import { schreibenHref, terminHref, terminLabel } from "@/lib/forms/terminLink";
import { LOCAL_LANDING, PLANER as PLANER_DE, PROCESS_NOTE, PROCESS_STEPS, beratungHref } from "./copy";
import FaqMobileMore from "./FaqMobileMore";
import { ARROW_INLINE, H1_FIT, bindAbbreviations, fitHeading, mailText, splitFirstSentence } from "./typoLanding";

export { H1_FIT };
import { LINK_EASE, staggerStyle } from "./motionLanding";
import { softHyphenate } from "./silben";

export { beratungHref };

/**
 * Rat 9,5 B1 (UX1): EIN Terminweg. Ziel und Wort kommen zusammen aus dem
 * zentralen Helfer (src/lib/forms/terminLink.js, T1): mit eigenem Kalender
 * „Termin wählen“ → /termin, sonst „Termin anfragen“ → /beratung. Der Kontext
 * (thema, ort, rolle …) läuft immer mit. Server-only (liest process.env).
 * @param {{thema?: string, ort?: string, rolle?: string}} [context]
 * @param {string} [locale]
 * Mit Kalender kommt der Nebenweg „Lieber schreiben“ → /beratung (mit Kontext) dazu.
 * @returns {{href: string, label: string, write: {href: string, label: string} | null}}
 */
export function landingTermin(context = {}, locale = "de") {
  const calendar = ownCalendarActive();
  return {
    href: terminHref(locale, { calendar, context }),
    label: terminLabel(locale, { calendar }),
    write: calendar ? { href: schreibenHref(locale, { context }), label: terminLabel(locale, { kind: "write" }) } : null,
  };
}

/** Nebenweg „Lieber schreiben“ (B1) als ruhiger Link unter dem Terminknopf. */
function WriteLink({ write, className }) {
  if (!write?.href) return null;
  return (
    <LinkArrow href={write.href} className={className} data-termin-write="">
      {write.label}
    </LinkArrow>
  );
}

/**
 * Trail of a landing page for the JSON-LD: Startseite › [trail …] › crumb,
 * passed through menuTrail() exactly like the visible <Breadcrumbs> (so
 * "Interior Design" becomes Startseite › Planen & Erleben › Interior Design in
 * both). `trail` = middle steps as in the menu (gesamtwerk P2: Outdoor sits
 * under "Outdoor & Pool"), [{label, href?}].
 */
export function landingCrumbs(crumb, trail = [], swiss = false, locale = "de") {
  const home = swiss ? swissSpelling(homeCrumbLabel(locale)) : homeCrumbLabel(locale);
  return menuTrail([{ label: home, href: "/" }, ...trail, { label: crumb }], locale);
}

/**
 * BreadcrumbList as its own graph node (seo P2-5), built with
 * src/lib/seo/breadcrumbs.js from the SAME items as the visible trail.
 * @param {string} url absolute page URL (…/de/<path>)
 */
export function breadcrumbNode(items, url, locale = "de") {
  return { "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: breadcrumbSchemaItems(items, `${SITE_URL}/${locale}`) };
}

// Template copy: namespace `landing` in src/messages (the former German
// fallback table went with the Rat-9,5 take-over, 30.10.2026).

/**
 * Splits a lead into its first `count` sentences and the rest (Bibel P2: a
 * hero lead has at most two sentences; the rest moves into the intro, so no
 * copy is lost for readers or crawlers).
 * @returns {[string, string]} [head, rest]
 */
export function splitLead(text, count = 2) {
  if (!text) return ["", ""];
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ„"])/);
  return [sentences.slice(0, count).join(" "), sentences.slice(count).join(" ")];
}

/**
 * Template copy with Swiss spelling on de-CH pages (no "ß", Bibel §10.2).
 * Returns l(key) → string.
 */
export function useLandingCopy(swiss = false) {
  const t = useTranslations("landing");
  return (key) => {
    const text = key in LOCAL_LANDING ? LOCAL_LANDING[key] : t.has(key) ? t(key) : key;
    return swiss ? swissSpelling(text) : text;
  };
}

export const isSwiss = (content) => content?.inLanguage === "de-CH";

/**
 * de-CH spelling (no "ß", Bibel §10.2) – except the street name of the NAP:
 * "Landstraße 11" is the registered address (Firmenbuch, Google-Profil,
 * Inhaber-Entscheidung Nr. 2) and stays the same on every page (Rat 9,5 A10).
 */
export function swissSpelling(text) {
  return String(text).split(ADDRESS.street).map((part) => part.replace(/ß/g, "ss")).join(ADDRESS.street);
}

// The new header (56/72 px) is sticky and in the flow, so <main> already
// starts below it: the hero only needs its own breathing room.
const HERO_TOP = "pt-8 md:pt-12 lg:pt-16";

// ARROW_INLINE (Pfeil am Textende, QM R1/R3) lebt in typoLanding.js – auch für Bad/Küchengeräte.
export { ARROW_INLINE };

/** „Landstraße 11, 6911 Lochau“: Hausnummer bleibt bei der Straße, PLZ beim Ort (QM R1). */
export function addressLine() {
  const nb = (x) => String(x).replace(/ /g, " ");
  return `${nb(ADDRESS.street)}, ${nb(`${ADDRESS.postalCode} ${ADDRESS.city}`)}`;
}

const HERO_SIZES =
  "(min-width: 1440px) 1280px, (min-width: 1280px) calc(100vw - 160px), (min-width: 768px) calc(100vw - 96px), calc(100vw - 40px)";

/**
 * Light hero (Galerie look, Bibel §6/§7): breadcrumb, overline, H1 in Bodoni,
 * optional lead (max. 2 sentences, see splitLead), ONE primary action, a quiet
 * phone link and the fact line (hours, address). The photo stands still below
 * the text – no text on the image, so no contrast problem; 3:2 (room) up to
 * tablet, 21:9 on desktop. It is the LCP image → `preload`.
 *
 * Order (QM Runde 1 P2-1):
 * - mobile/tablet: H1 → photo → button → lead, so the photo AND the one
 *   primary action reach the first viewport.
 * - mobile/tablet without a released photo (R6, Schweiz P3-3): H1 → lead →
 *   button, so the fact sentence is read before the action; the hero closes
 *   with one hairline (or the fact row) instead of an empty image band.
 * - desktop: H1 with the lead below in columns 1–7, button + fact line in
 *   9–12 aligned to the bottom, the 21:9 photo spans below. No empty column.
 * @param {Array<{label, value}>} [facts] optional fact row below the photo
 * @param {string} [appointmentHref] /beratung with context (beratungHref)
 * @param {Array<{label, href?}>} [trail] middle breadcrumb steps (menu path)
 * @param {React.ReactNode} [schema] Rat 9,5 B7: Studio-Grafik (StudioSchema) für einen
 *   Hero ohne freigegebenes Foto. Mobil steht sie als flaches Band UNTER H1 und
 *   Knopf (≤ 40 % der Höhe, Design-Jury P1-4), danach der Lead; ab lg füllt sie die rechte Spalte
 *   (5 von 12), Text, Knopf und Faktenzeile stehen links – keine leere Hälfte.
 * @param {string} [leadShort] Rat 9,5 B10: kürzerer Lead nur für Telefone (≤ 3 Zeilen);
 *   der volle Lead bleibt ab sm sichtbar und im HTML.
 */
export function LandingHero({ title, eyebrow, lead, leadShort, image, alt, crumb, primaryLabel, facts, swiss = false, appointmentHref, trail, schema = null, write = null }) {
  const l = useLandingCopy(swiss);
  if (!image && schema) {
    return (
      <SchemaHero
        {...{ title, eyebrow, lead, leadShort, crumb, primaryLabel, facts, swiss, appointmentHref, trail, schema, write }}
      />
    );
  }
  const heroLead = lead ? (
    <Lead tone="soft" className="max-w-measure lg:col-span-7 lg:row-start-2 lg:mt-stack-m">
      {bindAbbreviations(lead)}
    </Lead>
  ) : null;
  return (
    <Section tone="surface" spacing="none" contained={false} labelledBy="landing-title" className={cx(HERO_TOP, image ? "pb-section" : "pb-[calc(var(--spacing-stack-m)*2)]")}>
      <Container>
        {/* 44 px target for the "Home" link without a visual change (§6, P3-6) */}
        <Breadcrumbs items={[{ label: l("home"), href: "/" }, ...(trail || []), { label: crumb }]} className="[&_a]:min-h-11" />
        <div className="mt-4 grid grid-cols-1 gap-y-6 lg:mt-stack-m lg:grid-cols-12 lg:gap-x-8 lg:gap-y-0">
          {/* QM R3: ohne Foto eine Spalte breiter (8 statt 7, bis an den Knopfblock ab Spalte 9). */}
          <div className={cx(image ? "lg:col-span-7" : "lg:col-span-8", "lg:col-start-1 lg:row-start-1")}>
            {eyebrow ? (
              <Eyebrow>{eyebrow}</Eyebrow>
            ) : (
              <Eyebrow>
                {/* Short overline on phones: one line instead of two (P3-1) */}
                <span className="sm:hidden">{l("overlineShort")}</span>
                <span className="hidden sm:inline">{l("overline")}</span>
              </Eyebrow>
            )}
            <Heading id="landing-title" level={1} size="display-l" className={cx("mt-stack-s max-w-[18ch] wrap-break-word", H1_FIT)}>
              {fitHeading(title)}
            </Heading>
          </div>
          {/* No photo when the image register holds the hero back (no release,
              wrong subject – imagery.js `released: false`): typographic hero.
              R6-landing-inhalt: no empty image band any more (Teamleiter
              decision; manufacturer photos without a release stay out). */}
          {image && (
            <Media
              src={image}
              alt={alt}
              ratio="3/2"
              sizes={HERO_SIZES}
              preload
              className="lg:col-span-12 lg:row-start-3 lg:mt-stack-m lg:aspect-21/9"
            />
          )}
          {/* Without a photo the lead comes BEFORE the primary action on
              phones (Schweiz P3-3): H1 → lead → button. With a photo the
              order stays H1 → photo → button → lead (QM P2-1). On desktop the
              grid places both explicitly, the DOM order does not matter. */}
          {!image && heroLead}
          <div className="flex flex-col lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:row-start-1 lg:justify-end">
            <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6 lg:flex-col lg:items-start lg:gap-1">
              <Button href={appointmentHref || ROUTES.beratung.de} variant="primary" arrow>
                {primaryLabel || l("appointment")}
              </Button>
              {/* Digits flush with the primary button's edge (P3-2) */}
              <Button href={PHONE_HREF} variant="ghost" className="justify-start self-start px-0! tabular hover:bg-transparent hover:underline sm:self-auto lg:self-start">
                <span className="sr-only">{l("call")}: </span>
                {PHONE_DISPLAY}
              </Button>
            </div>
            <WriteLink write={write} className="self-start" />
            {/* CLS (Qualität 01.11.2026, /de/moebel-bodensee 0,114): in the narrow
                desktop column the one-line text wrapped with the fallback font and
                fit with Instrument Sans – the row shrank on font swap and moved the
                photo. From lg on it is always two lines (hours / address). */}
            <p className="mt-2 text-small text-text-soft tabular">
              <span className="lg:block">{l("hoursShort")}</span>
              <span className="lg:hidden"> · </span>
              <span className="lg:block">
                {addressLine()}
              </span>
            </p>
          </div>
          {image && heroLead}
        </div>
        {/* Typographic close instead of the photo: one hairline at the stack
            rhythm, no surface, no gap. A fact row brings its own hairlines. */}
        {!image && !facts?.length && <div data-hero-close="" aria-hidden="true" className="mt-stack-m border-t border-line-strong" />}
        <FactRow items={facts} label={l("factsLabel")} />
      </Container>
    </Section>
  );
}

/**
 * Hero mit Studio-Grafik (Rat 9,5 B7) – gleiche Texte, gleicher Knopf, gleiche
 * Faktenzeile wie LandingHero, aber mit Bildsignal im ersten Bildschirm.
 * DOM-Reihenfolge = mobile Reihenfolge: Overline/H1 → Knopf → Grafik → Lead
 * (Design-Jury P1-4: die H1 steht am Handy zuerst, die Grafik danach).
 */
function SchemaHero({ title, eyebrow, lead, leadShort, crumb, primaryLabel, facts, swiss, appointmentHref, trail, schema, write }) {
  const l = useLandingCopy(swiss);
  return (
    <Section tone="surface" spacing="none" contained={false} labelledBy="landing-title" className={cx(HERO_TOP, "pb-[calc(var(--spacing-stack-m)*2)]")} data-hero-schema="">
      <Container>
        <Breadcrumbs items={[{ label: l("home"), href: "/" }, ...(trail || []), { label: crumb }]} className="[&_a]:min-h-11" />
        <div className="mt-4 grid grid-cols-1 gap-y-6 lg:mt-stack-m lg:grid-cols-12 lg:gap-x-8 lg:gap-y-0">
          <div className="lg:col-span-7 lg:col-start-1 lg:row-start-1">
            {eyebrow ? (
              <Eyebrow>{eyebrow}</Eyebrow>
            ) : (
              <Eyebrow>
                <span className="sm:hidden">{l("overlineShort")}</span>
                <span className="hidden sm:inline">{l("overline")}</span>
              </Eyebrow>
            )}
            <Heading id="landing-title" level={1} size="display-l" className={cx("mt-stack-s max-w-[18ch] wrap-break-word", H1_FIT)}>
              {fitHeading(title)}
            </Heading>
          </div>
          <div className="flex flex-col lg:col-span-7 lg:col-start-1 lg:row-start-3 lg:mt-stack-m">
            <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
              <Button href={appointmentHref || ROUTES.beratung.de} variant="primary" arrow>
                {primaryLabel || l("appointment")}
              </Button>
              <Button href={PHONE_HREF} variant="ghost" className="justify-start self-start px-0! tabular hover:bg-transparent hover:underline sm:self-auto">
                <span className="sr-only">{l("call")}: </span>
                {PHONE_DISPLAY}
              </Button>
            </div>
            <WriteLink write={write} className="self-start" />
            <p className="mt-2 text-small text-text-soft tabular">
              {l("hoursShort")} · {addressLine()}
            </p>
          </div>
          <div className="lg:col-span-5 lg:col-start-8 lg:row-span-3 lg:row-start-1">{schema}</div>
          {lead && (
            <div className="lg:col-span-7 lg:col-start-1 lg:row-start-2 lg:mt-stack-m">
              {leadShort && (
                <Lead tone="soft" className="max-w-measure sm:hidden" data-lead-short="">
                  {bindAbbreviations(leadShort)}
                </Lead>
              )}
              <Lead tone="soft" className={cx("max-w-measure", leadShort && "max-sm:hidden")}>
                {bindAbbreviations(lead)}
              </Lead>
            </div>
          )}
        </div>
        <FactRow items={facts} label={l("factsLabel")} />
      </Container>
    </Section>
  );
}

/**
 * Region facts as one <dl> row below the hero photo (Bibel §10.2, QM P2-4).
 * Only facts the page copy already states (no invented drive times, no
 * currency or delivery promise). Renders nothing without items.
 */
export function FactRow({ items = [], label }) {
  if (!items?.length) return null;
  return (
    // QM R3: drei Fakten ab sm in einer Zeile – zweispaltig stand der dritte allein (Handy quer, Tablet hoch).
    <dl aria-label={label} className={cx("mt-stack-m grid grid-cols-1 gap-x-8", items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3")}>
      {items.map((item) => (
        <div key={item.label} className="border-t border-line py-4">
          <dt className="text-overline uppercase text-text-soft">{item.label}</dt>
          <dd className="mt-2 text-body text-text">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Overline + H2 + optional text: the head of a section. */
export function SectionHead({ id, eyebrow, title, text, tone = "light", className, children }) {
  const dark = tone === "dark";
  return (
    <div className={cx("max-w-text", className)}>
      {eyebrow && <Eyebrow tone={dark ? "inverse" : "accent"}>{eyebrow}</Eyebrow>}
      <Heading id={id} level={2} size="display-m" tone={dark ? "inverse" : "text"} className={eyebrow ? "mt-stack-s" : undefined}>
        {fitHeading(title)}
      </Heading>
      {text && (
        <p className={cx("mt-stack-m max-w-measure text-body", dark ? "text-text-inverse-soft" : "text-text-soft")}>{bindAbbreviations(text)}</p>
      )}
      {children}
    </div>
  );
}

/** Check list (benefits, points). Icon in brass-700 on light surfaces only. */
export function CheckList({ items = [], className }) {
  if (!items.length) return null;
  return (
    <ul className={cx("border-t border-line", className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 border-b border-line py-4 text-body text-text">
          <Check aria-hidden="true" strokeWidth={1.5} className="mt-1 size-5 shrink-0 text-text-accent" />
          {/* QM R1: Textzoom – lange Wörter („Einrichtungsberatung“) trennen statt aus der Spalte zu laufen. */}
          <span className="min-w-0">{softHyphenate(item)}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Showroom facts – the page's ONE dark (walnut) surface (Bibel §4.2). Address,
 * hours and contact as a <dl>; links on dark in paper.
 */
export function ShowroomFacts({ heading, text, eyebrow, swiss = false, id = "showroom-title" }) {
  const l = useLandingCopy(swiss);
  const street = ADDRESS.street;
  const link =
    `inline-flex min-h-11 items-center underline decoration-line-inverse underline-offset-4 hover:decoration-current ${LINK_EASE}`;
  return (
    <Section tone="inverse" labelledBy={id}>
      <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-12 lg:gap-x-8">
        <SectionHead id={id} eyebrow={eyebrow || l("showroomEyebrow")} title={heading} text={text} tone="dark" className="lg:col-span-5" />
        {/* QM R3: Spalten nach der eigenen Breite in rem (Container) – bei Textzoom ×2 lief die Kontakt-Spalte rechts aus dem Bild. */}
        <div className="@container lg:col-span-6 lg:col-start-7 lg:self-end">
        <dl className="grid grid-cols-1 gap-8 @md:grid-cols-[1fr_1fr_auto]">
          <div>
            <dt className="text-overline uppercase text-accent-on-dark">{l("address")}</dt>
            <dd className="mt-3 text-body text-text-inverse">
              {street}
              <br />
              {ADDRESS.postalCode} {ADDRESS.city}
              <br />
              <a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" className={cx(link, "text-small text-text-inverse-soft")}>
                {l("route")}
                <span className="sr-only"> (Google Maps)</span>
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-overline uppercase text-accent-on-dark">{l("hours")}</dt>
            <dd className="mt-3 text-body text-text-inverse tabular">
              {/* nowrap per line: a time range never breaks after "10–" (QM ipad-quer) */}
              <span className="whitespace-nowrap">{l("hoursWeek")}</span>
              <br />
              <span className="whitespace-nowrap">{l("hoursSat")}</span>
            </dd>
          </div>
          <div>
            <dt className="text-overline uppercase text-accent-on-dark">{l("contact")}</dt>
            <dd className="mt-3 text-body text-text-inverse">
              <a href={PHONE_HREF} className={cx(link, "tabular")}>
                {PHONE_DISPLAY}
              </a>
              <br />
              <a href={EMAIL_HREF} className={cx(link, "whitespace-normal! [overflow-wrap:anywhere]")}>
                {mailText(EMAIL)}
              </a>
            </dd>
          </div>
        </dl>
        </div>
      </div>
    </Section>
  );
}

/**
 * FAQ – native <details> via <Accordion>, exclusive group, first item open.
 * The FAQPage JSON-LD is emitted by the page template, not here.
 */
export function FaqSection({ faq, swiss = false, tone = "surface", id = "faq-title", mobileMoreLabel, spacingClassName }) {
  const l = useLandingCopy(swiss);
  if (!faq?.items?.length) return null;
  const accordion = (
    <Accordion
      className={mobileMoreLabel ? undefined : "lg:col-span-7 lg:col-start-6"}
      name={faq.name}
      headingLevel={3}
      items={faq.items.map((item, index) => ({ title: bindAbbreviations(item.q), content: <p>{bindAbbreviations(item.a)}</p>, open: index === 0 }))}
    />
  );
  // Optional (Yacht): below md only four questions, a button shows the rest (FaqMobileMore).
  const hidden = Math.max(0, faq.items.length - 4);
  // Optik-QA: „Rufen Sie uns an: <Nummer>“ bleibt eine Gruppe in der zweiten Zeile –
  // vorher brach „an:“ allein vor die Nummer.
  const [missingHead, missingRest] = splitFirstSentence(l("faqMissing"));
  return (
    <Section tone={tone} labelledBy={id} {...(spacingClassName ? { spacing: "none", className: spacingClassName } : {})}>
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-8">
        {/* Kurze Kopfspalte bleibt ab lg neben der langen Fragenliste stehen (kein leeres Feld links). */}
        <div className="lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
          <Eyebrow>{l("faqEyebrow")}</Eyebrow>
          <Heading id={id} level={2} size="display-m" className="mt-stack-s">
            {fitHeading(faq.heading)}
          </Heading>
          <p className="mt-stack-m text-body text-text-soft">
            {missingHead}{" "}
            <span className="inline-block">
              {missingRest}{" "}
              <a href={PHONE_HREF} className={cx("text-text underline decoration-line-strong underline-offset-4 hover:decoration-current tabular", LINK_EASE)}>
                {PHONE_DISPLAY}
              </a>
            </span>
          </p>
        </div>
        {mobileMoreLabel && hidden > 0 ? (
          <FaqMobileMore className="lg:col-span-7 lg:col-start-6" hiddenCount={hidden} moreLabel={mobileMoreLabel.replace("{n}", hidden)}>
            {accordion}
          </FaqMobileMore>
        ) : (
          accordion
        )}
      </div>
    </Section>
  );
}

/**
 * Gallery with a set composition (Galerie look, §6; QM P2-3): 3:2 large in
 * 7 columns + 4:5 in 4 columns, both flush at the BOTTOM edge; a third photo
 * runs across the full width in 21:9. No offset third image, no hole.
 * Callers pass a cleaned list (no hero duplicate, no blocked file –
 * see imagery.js cleanGallery).
 * @param {Array<{src, alt}>} images first three are used
 * @param {string} label accessible name of the region
 */
export function LandingGallery({ images = [], label, className, bottom = true }) {
  const [a, b, c] = images;
  if (!a) return null;
  return (
    // `bottom={false}`: der folgende Block bringt den Abstand selbst mit (Outdoor: HandBridge).
    <section aria-label={label} className={cx(bottom && "pb-section", className)}>
      <div className="mx-auto grid w-full max-w-page grid-cols-1 gap-grid px-gutter md:grid-cols-12 md:items-end">
        <Media
          src={a.src}
          alt={a.alt}
          ratio="3/2"
          sizes="(min-width: 1440px) 740px, (min-width: 768px) 58vw, 100vw"
          className={cx("reveal", b ? "md:col-span-7" : "md:col-span-8")}
        />
        {b && (
          <Media
            src={b.src}
            alt={b.alt}
            ratio="4/5"
            // Optik-QA 01.11.2026: die Quellen sind Querformate (3:2) – im 4:5-Rahmen (cover) braucht
            // das Bild ~1,9× die Rahmenbreite, sonst lieferte next/image eine zu kleine Stufe (1,6–2× unscharf).
            sizes="(min-width: 1440px) 800px, (min-width: 768px) 63vw, 190vw"
            // QM 01.11.2026: ab md exakt so hoch wie Bild a (4:5 war ~7 % höher – wirkte wie
            // ein knapp verfehltes Raster); bleibt hochformatig (~6:7), mobil unverändert 4:5.
            className="reveal [--reveal-start:4%] [--reveal-end:44%] md:col-span-4 md:col-start-9 md:aspect-auto md:self-stretch"
          />
        )}
        {c && (
          <Media
            src={c.src}
            alt={c.alt}
            ratio="3/2"
            sizes="(min-width: 1440px) 1280px, (min-width: 768px) calc(100vw - 96px), 100vw"
            className="reveal md:col-span-12 md:aspect-21/9"
          />
        )}
      </div>
    </section>
  );
}

/**
 * Brands typographically (card-brand, §9): name in Bodoni ≥ 32 px, one
 * sentence, whole row is the link to the brand page. No logos, no seal, no
 * dealer formula – "in unserer Ausstellung" wording stays in the page copy.
 * Also used by the template for its brand section: manufacturer press photos
 * stay out until the image register records a written release (§7.1/§14,
 * QM P2-5). Without a group title the brand names are the H3s.
 * @param {Array<{title?, items: Array<{name, slug, text}>}>} groups
 */
export function BrandGroups({ groups = [], cols = 3, locale = "de" }) {
  const COLS = { 2: "", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };
  return groups.map((group, index) => {
    const Name = group.title ? "p" : "h3";
    return (
    <div key={group.title || index} className="mt-stack-m first:mt-0 md:mt-16">
      {group.title && <h3 className="text-overline uppercase text-text-soft">{group.title}</h3>}
      <ul className={cx("grid grid-cols-1 gap-x-8 sm:grid-cols-2", group.title && "mt-4", COLS[cols] ?? COLS[3])}>
        {group.items.map((brand, i) => (
          <li key={brand.slug} className="reveal group relative border-t border-line py-6" style={staggerStyle(i, cols)}>
            <Name className="font-display text-display-m text-text">
              <SmartLink
                href={`${ROUTES.marken[locale] || ROUTES.marken.de}/${brand.slug}`}
                className={cx("ph-stretched underline decoration-transparent underline-offset-8 group-hover:decoration-current", LINK_EASE)}
              >
                {brand.name}
              </SmartLink>
            </Name>
            <p className="mt-3 max-w-measure text-body text-text-soft">{brand.text}</p>
          </li>
        ))}
      </ul>
    </div>
    );
  });
}

/** Facts as <dl> with hairlines (materials, care). Works on light and dark. */
export function FactList({ items = [], tone = "light", className }) {
  const dark = tone === "dark";
  return (
    <dl className={cx("grid grid-cols-1 gap-x-8 sm:grid-cols-2", className)}>
      {items.map((item) => (
        <div key={item.name} className={cx("border-t py-6", dark ? "border-line-inverse" : "border-line")}>
          <dt className={cx("text-title", dark ? "text-text-inverse" : "text-text")}>{item.name}</dt>
          <dd className={cx("mt-2 text-body", dark ? "text-text-inverse-soft" : "text-text-soft")}>{item.text}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Closing band – light (the dark surface is used elsewhere). The Leitsatz
 * "Nehmen Sie Platz." is the ONE display line and the one centred element
 * (QM P2-2): the H2 below is a quiet Instrument title, text at stack-m.
 * ONE primary "Termin anfragen", one secondary, then a small TrustBlock (§11)
 * near the action – only process facts the pages already describe (showroom,
 * samples, plan before the order); no prices, no deposit, no CHF promise.
 * Built here instead of the shared CTABand so the fundament's band stays as is.
 * @param {{href,label}} [secondary] default: Kontakt
 */
export function LandingClosing({ heading, text, primaryLabel, secondary, swiss = false, showPhone = false, note, id = "cta-title", appointmentHref, write = null }) {
  const l = useLandingCopy(swiss);
  const second = secondary || { href: ROUTES.kontakt.de, label: l("contact") };
  const trust = [l("trustSit"), l("trustSamples"), l("trustPlan")];
  return (
    <Section tone="band" labelledBy={id} contained="text">
      <div className="flex flex-col items-center text-center">
        <Leitsatz size="l" />
        <Heading id={id} level={2} size="title" className="mt-stack-m">
          {heading}
        </Heading>
        <div className="mt-stack-m max-w-measure text-body text-text-soft">
          <p>{text}</p>
          {showPhone && (
            <p className="mt-3 text-small">
              {l("callAlt")}{" "}
              <a href={PHONE_HREF} className={cx("whitespace-nowrap text-text underline decoration-line-strong underline-offset-4 hover:decoration-current tabular", LINK_EASE)}>
                {PHONE_DISPLAY}
              </a>
            </p>
          )}
          {note && <p className="mt-3 text-small">{note}</p>}
        </div>
        <div className="mt-stack-m flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center">
          <Button href={appointmentHref || ROUTES.beratung.de} variant="primary" arrow>
            {primaryLabel || l("appointment")}
          </Button>
          <Button href={second.href} variant="secondary">
            {second.label}
          </Button>
        </div>
        <WriteLink write={write} className="mt-1" />
        {/* Optik-QA: drei Punkte passen erst ab lg in eine Zeile – vorher untereinander
            statt 2 + 1 mit einem verwaisten dritten Punkt. Ab lg darf die Zeile breiter
            als die Textspalte sein (zentriert, w-max). */}
        <ul
          aria-label={l("trustLabel")}
          className="mt-stack-m grid w-full grid-cols-[minmax(0,max-content)] justify-center border-t border-line pt-4 text-small text-text lg:flex lg:w-max lg:max-w-[calc(100vw-2*var(--spacing-gutter))] lg:flex-row lg:justify-center lg:gap-x-8"
        >
          {/* QM R3: Punkt schmiegt sich an seinen Text (Häkchen oben am Zeilenanfang) – zentriert
              stand das Häkchen bei Textzoom weit links neben einem umbrochenen Block.
              QM R4: unter lg ein linksbündiger Block, der als Ganzes zentriert steht (eine
              Spalte in Breite der längsten Zeile) – Häkchen untereinander statt Flatterkante. */}
          {trust.map((item, i) => (
            <li key={item} className="reveal flex max-w-full items-start gap-2 py-1 text-left" style={staggerStyle(i, 3)}>
              <Check aria-hidden="true" strokeWidth={1.5} className="mt-[0.2em] size-4 shrink-0 text-text-accent" />
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/**
 * Kern-USP as a short section (Entscheidung Nr. 8, gesamtwerk P1-4; a
 * HandBridge variant for landing and region pages): the seven step names in
 * one row, the standard sentence, the on-site sentence and the link to
 * /arbeitsweise. Typography only – no picture until Harald's real material
 * exists (no AI sketch). `text` lets a region page set its own sentence
 * (Doorway rule: no identical paragraph on every region page is required,
 * but a local sentence is better). One per page.
 * @param {string} [text] own sentence instead of the standard one
 * @param {"surface"|"band"} [tone]
 */
// `copy` (optional): { eyebrow, heading, text, vorOrt, stepsLabel, steps, link } in der Sprache der Seite (EN/FR/IT).
export function ProcessNote({ text, heading, tone = "band", swiss = false, id = "prozess-title", copy = null }) {
  const s = (v) => (swiss ? swissSpelling(v) : v);
  const PN = copy ? { ...PROCESS_NOTE, ...copy } : PROCESS_NOTE;
  const STEPS = copy?.steps || PROCESS_STEPS;
  return (
    <Section tone={tone} spacing="compact" labelledBy={id} data-process-note="">
      <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-8">
        <div className="lg:col-span-5">
          <Eyebrow>{PN.eyebrow}</Eyebrow>
          <Heading id={id} level={2} size="display-m" className="mt-stack-s max-w-[18ch] text-balance">
            {s(heading || PN.heading)}
          </Heading>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <p className="max-w-measure text-body text-text">{s(text || PN.text)}</p>
          <p className="mt-3 max-w-measure text-body text-text-soft">{s(PN.vorOrt)}</p>
          {/* QM R1: als Spalten statt Fließreihe – die Reihe brach je Breite anders um
              (2/2/3, „07 Umsetzung“ allein). Handy eine Spalte, ab sm zwei Spalten
              von oben nach unten (01–04 | 05–07). */}
          <ol
            aria-label={PN.stepsLabel}
            className="mt-stack-m grid grid-cols-1 gap-x-8 gap-y-2 border-t border-line pt-4 text-small text-text sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-4"
          >
            {STEPS.map((name, i) => (
              <li key={name} className="reveal flex items-baseline gap-2" style={staggerStyle(i, STEPS.length)}>
                <span aria-hidden="true" className="tabular text-text-soft">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{s(name)}</span>
              </li>
            ))}
          </ol>
          {/* QM R1: eigener Absatz mit Abstand – der Link klebte an der letzten Schrittzeile. */}
          <p className="mt-stack-m border-t border-line pt-2">
            <LinkArrow href={PN.link.href} className={ARROW_INLINE}>
              {s(PN.link.label)}
            </LinkArrow>
          </p>
        </div>
      </div>
    </Section>
  );
}

/** Studio contact line (phone + e-mail) for the Objekt and Planer blocks. */
function StudioContact({ label, note }) {
  const link = `whitespace-nowrap text-text underline decoration-line-strong underline-offset-4 hover:decoration-current ${LINK_EASE}`;
  return (
    <div className="border-t border-line pt-4">
      <p className="text-overline uppercase text-text-soft">{label}</p>
      <p className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-body">
        <a href={PHONE_HREF} className={cx(link, "tabular inline-flex min-h-11 items-center")}>
          {PHONE_DISPLAY}
        </a>
        {/* QM R3: Umbruch nach „@“ / vor „.studio“ statt mitten im Wort (Textzoom). */}
        <a href={EMAIL_HREF} className={cx(link, "inline-flex min-h-11 items-center whitespace-normal! wrap-anywhere")}>
          <span>{mailText(EMAIL)}</span>
        </a>
      </p>
      {note && <p className="mt-1 text-small text-text-soft">{note}</p>}
    </div>
  );
}

/**
 * Hotel, Gastronomie & Objekt (ux P1-2) – anchor #objekt (menu "Hotel,
 * Gastronomie & Objekt"). The same process as a quality promise, extended by
 * room series; contact; CTA with ?thema=objekt. NO references, no projects.
 * data = { eyebrow, heading, text, steps: [{title, text}], contactLabel, contactNote, cta: {label} }
 */
export function ObjektSection({ data, tone = "band" }) {
  if (!data?.heading) return null;
  return (
    <Section tone={tone} labelledBy="objekt-title" id="objekt" className="scroll-mt-[88px]">
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-8">
        <div className="lg:col-span-5">
          <SectionHead id="objekt-title" eyebrow={data.eyebrow} title={data.heading} text={data.text} />
          <div className="mt-stack-m max-w-text space-y-4">
            <StudioContact label={data.contactLabel} note={data.contactNote} />
            <Button href={data.ctaHref || beratungHref({ thema: "objekt" })} variant="secondary" arrow>
              {data.cta.label}
            </Button>
            {/* Welle 2: the own page Hotel & Objekt (process, sample room, enquiry). */}
            <LinkArrow href={data.hotelHref || "/hotel-objekt"} className="block">
              {data.hotelLabel || "Alles zu Hotel & Objekt"}
            </LinkArrow>
          </div>
        </div>
        <ol className="lg:col-span-6 lg:col-start-7">
          {data.steps.map((step, i) => (
            <li key={step.title} className="reveal grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 border-t border-line py-5">
              <span aria-hidden="true" className="text-small tabular text-text-soft">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-title text-text">{step.title}</h3>
                <p className="mt-1 max-w-measure text-body text-text-soft">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

/**
 * "Für Architektinnen & Planer" (ux P1-3) – interior design and St. Gallen.
 * Copy in ./copy.js (PLANER); `text` and `ort` per page. CTA:
 * /beratung?rolle=architekt[&ort=…] (Runde 5, ux P1-3: no thema=objekt).
 */
// `copy` (optional, EN/FR/IT): { eyebrow, heading, text, points, contactLabel, contactNote, ctaLabel, architektenLink }; `beratungBase` = Beratungsseite der Sprache.
export function PlanerBlock({ text, ort, swiss = false, tone = "surface", copy = null, beratungBase = "/beratung", architektenHref = "/architekten" }) {
  const s = (v) => (v && swiss ? swissSpelling(v) : v);
  const PLANER = copy ? { ...PLANER_DE, ...copy, cta: { ...PLANER_DE.cta, label: copy.ctaLabel || PLANER_DE.cta.label } } : PLANER_DE;
  return (
    <Section tone={tone} labelledBy={`${PLANER.id}-title`} id={PLANER.id} className="scroll-mt-[88px]">
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-8">
        <div className="lg:col-span-5">
          <SectionHead id={`${PLANER.id}-title`} eyebrow={s(PLANER.eyebrow)} title={s(PLANER.heading)} text={s(text || PLANER.text)} />
          <div className="mt-stack-m max-w-text space-y-4">
            <StudioContact label={s(PLANER.contactLabel)} note={s(PLANER.contactNote)} />
            <Button href={beratungHref({ thema: PLANER.cta.thema, rolle: PLANER.cta.rolle, ort }, beratungBase)} variant="secondary" arrow>
              {s(PLANER.cta.label)}
            </Button>
            {/* Welle 2: the own page for architects and developers. */}
            <LinkArrow href={architektenHref} className="block">
              {s(PLANER.architektenLink || "Planungsdaten und Muster für Architekten")}
            </LinkArrow>
          </div>
        </div>
        <ul className="lg:col-span-6 lg:col-start-7">
          {PLANER.points.map((p) => (
            <li key={p.title} className="reveal border-t border-line py-5">
              <h3 className="text-title text-text">{s(p.title)}</h3>
              <p className="mt-1 max-w-measure text-body text-text-soft">{s(p.text)}</p>
              {p.link && (
                <LinkArrow href={p.link.href} className="mt-2">
                  {s(p.link.label)}
                </LinkArrow>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
