// Seite Hotel & Objekt (/<locale>/hotel-objekt, DE, EN, FR, IT) – Server-Komponente.
// Aufbau (Design-Bibel §6–§11, hotel-contract.md 3.1): typografischer Hero
// (kein Foto ohne dokumentierte Rechte) → Leistungen → Ablauf mit Kern-USP
// (Handzeichnung, Modell, 3D, Rendering, Musterzimmer, Montage im
// Saisonfenster) → Musterzimmer → Wer macht was → Objektqualitäten → Marken
// mit Ezarri-Herstellerbild (Quellenangabe) → Referenzen (nur mit Freigabe)
// → Einsatzgebiet → Projektanfrage (#anfrage) → FAQ → Showroom (die EINE
// dunkle Fläche) → Termin.
// Texte: src/lib/hotel/content.js. Nur die Formular-Insel ist Client-Code.
import JsonLd from "@/components/Reusable/JsonLd";
import { Button, Container, Eyebrow, Heading, Horizon, LinkArrow, Section, cx } from "@/components/ui";
import { ARROW_INLINE, CheckList, FaqSection, LandingClosing, LandingHero, SectionHead, ShowroomFacts, landingTermin } from "@/components/Landing/parts";
import { PAGE_HY, fitHeading } from "@/components/Landing/typoLanding";
import StudioSchema from "@/components/Landing/schema/StudioSchema";
import { hotelT3 } from "./t3Text";
import { ezarriDealerClaimVisible } from "@/lib/ezarri/config";
import { imageSources } from "@/lib/ezarri/images";
import { EZARRI_IMAGE } from "@/lib/hotel/content";
import { visibleReferences } from "@/lib/hotel/references";
import { hotelSchema } from "@/lib/hotel/seo";
import { ROUTES } from "@/utils/routing";
import HotelInquiryForm from "./HotelInquiryForm";
import HotelReferences from "./HotelReferences";
// Motion 01.11.2026: Reveal je Karte/Spalte, Link-Übergänge (nur gemeinsame Tokens).
import { LINK_EASE, staggerStyle } from "@/components/Landing/motionLanding";

/**
 * Interner Link; deutsche Seiten ohne eigene Fassung führen auf /de/…,
 * `lang: "en"` (FR/IT, Seiten mit englischer, aber ohne FR/IT-Fassung) auf /en/….
 */
function PageLink({ link, locale, className }) {
  if (!link?.href) return null;
  const target = link.lang && link.lang !== locale ? link.lang : link.deOnly && locale !== "de" ? "de" : null;
  const extra = target ? { locale: target, hrefLang: target } : {};
  return (
    <LinkArrow href={link.href} className={className} {...extra}>
      {link.label}
    </LinkArrow>
  );
}

// Rat 9,5 A6 (gesamtwerk M3): das freigegebene Ezarri-Bild steht jetzt früh, bei den
// Leistungen (Spa und Pool), statt erst bei den Marken. Unverändert, eigener Rahmen im
// Seitenverhältnis, sichtbarer Credit und Hinweis „kein Projekt von Platzhirsch“.
function SpaFigure({ brands }) {
  const img = imageSources({ web: EZARRI_IMAGE.web, breite: EZARRI_IMAGE.width, hoehe: EZARRI_IMAGE.height });
  if (!img) return null;
  return (
    <figure className="lg:col-span-5 lg:col-start-8 lg:self-end" data-hotel-ezarri="">
      <picture>
        <source type="image/avif" srcSet={img.avif} sizes="(min-width: 1440px) 520px, (min-width: 1024px) 36vw, 100vw" />
        <source type="image/webp" srcSet={img.webp} sizes="(min-width: 1440px) 520px, (min-width: 1024px) 36vw, 100vw" />
        <img
          src={img.src}
          alt={brands.ezarriAlt}
          width={img.width}
          height={img.height}
          loading="lazy"
          decoding="async"
          className="block h-auto w-full"
          style={{ aspectRatio: img.ratio }}
        />
      </picture>
      <figcaption className="mt-3 text-small text-text-soft">
        {brands.ezarriCaption} <span className="text-text">{brands.ezarriCredit}</span>
      </figcaption>
    </figure>
  );
}

function Services({ data, brands, locale }) {
  return (
    <Section tone="surface" labelledBy="ho-leistungen" id="leistungen" className="scroll-mt-[88px] pt-[calc(var(--spacing-stack-m)*2)]!">
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-8">
        <SectionHead id="ho-leistungen" eyebrow={data.eyebrow} title={data.heading} text={data.text} className="lg:col-span-6" />
        <SpaFigure brands={brands} />
      </div>
      <ul className="mt-stack-m grid grid-cols-1 gap-x-8 @min-[40rem]/page:grid-cols-2 @5xl/page:grid-cols-3" data-hotel-services="">
        {data.items.map((item, index) => (
          <li key={item.id} className="reveal border-t border-line py-6" style={staggerStyle(index, 3)}>
            <h3 className="text-title text-text">{fitHeading(item.name)}</h3>
            <p className="mt-2 max-w-measure text-body text-text-soft">{item.text}</p>
            <PageLink link={item.link} locale={locale} className="mt-2" />
            {/* Bad & Wellness (Nr. 19–21): second text link of the spa item, own line. */}
            {item.more ? (
              <div>
                <PageLink link={item.more} locale={locale} />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * Chalets & Ferienwohnungen (Inhaber-Zusatz 29.10.2026): schlüsselfertig für
 * Eigentümer und Vermieter am Arlberg, am Bodensee und in Vorarlberg. Der
 * Knopf führt auf #anfrage-chalet, das Formular belegt dann "Chalet" vor.
 * Keine Preise, keine Referenzen.
 */
function Chalets({ data }) {
  if (!data?.heading) return null;
  return (
    <Section tone="raised" labelledBy="ho-chalets" id={data.id} className="scroll-mt-[88px]" data-hotel-chalets="">
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-8">
        <div className="lg:col-span-5">
          <SectionHead id="ho-chalets" eyebrow={data.eyebrow} title={data.heading} text={data.text} />
          <dl className="mt-stack-m border-t border-line">
            {data.regions.map((r) => (
              <div key={r.name} className="border-b border-line py-3">
                <dt className="text-overline uppercase text-text-soft">{r.name}</dt>
                <dd className="mt-1 text-body text-text">{r.text}</dd>
              </div>
            ))}
          </dl>
          {/* QM R1: am Handy bricht der Knopf zweizeilig um – dann ohne den verlorenen Pfeil, Text ausgeglichen. */}
          <Button href={data.cta.href} variant="secondary" arrow className="mt-stack-m text-balance max-sm:[&_svg]:hidden">
            {data.cta.label}
          </Button>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <ul>
            {data.items.map((item) => (
              <li key={item.name} className="reveal border-t border-line py-5">
                <h3 className="text-title text-text">{fitHeading(item.name)}</h3>
                <p className="mt-1 max-w-measure text-body text-text-soft">{item.text}</p>
              </li>
            ))}
          </ul>
          <p className="mt-stack-s max-w-measure border-t border-line pt-4 text-body text-text">{data.note}</p>
        </div>
      </div>
    </Section>
  );
}

function Process({ data }) {
  return (
    <Section tone="band" labelledBy="ho-ablauf" id="ablauf" className="scroll-mt-[88px]">
      <SectionHead id="ho-ablauf" eyebrow={data.eyebrow} title={data.heading} text={data.text} />
      <Horizon className="mt-stack-m" />
      <ol className="mt-stack-m grid grid-cols-1 gap-x-8 gap-y-10 @min-[40rem]/page:grid-cols-2 @5xl/page:grid-cols-4" data-hotel-process="">
        {data.steps.map((step, index) => (
          <li key={step.title} className="reveal" style={staggerStyle(index, 4)}>
            <span aria-hidden="true" className="font-display text-display-m text-text-soft tabular">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-stack-s text-title text-text">{fitHeading(step.title)}</h3>
            <p className="mt-2 max-w-measure text-body text-text-soft">{step.text}</p>
          </li>
        ))}
      </ol>
      <p className="mt-stack-m max-w-measure border-t border-line pt-4 text-body text-text">{data.note}</p>
      <p className="mt-stack-s">
        <LinkArrow href={data.link.href} className={ARROW_INLINE}>
          {data.link.label}
        </LinkArrow>
      </p>
    </Section>
  );
}

function SampleRoom({ data }) {
  return (
    <Section tone="surface" labelledBy="ho-musterzimmer" id="musterzimmer" className="scroll-mt-[88px]">
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-8">
        <SectionHead id="ho-musterzimmer" eyebrow={data.eyebrow} title={data.heading} text={data.text} className="lg:col-span-5" />
        <CheckList items={data.points} className="lg:col-span-6 lg:col-start-7 lg:self-end" />
      </div>
    </Section>
  );
}

function Roles({ data }) {
  return (
    <Section tone="band" labelledBy="ho-rollen">
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-8">
        {/* QM R4: in 4 Spalten brach die H2 treppenartig auf 4 Zeilen („Ein“ / „klare“ einzeln) –
            5 Spalten und ausgeglichener Umbruch ergeben zwei ruhige Zeilen. */}
        <SectionHead id="ho-rollen" eyebrow={data.eyebrow} title={data.heading} text={data.text} className="lg:col-span-5 [&_h2]:text-balance" />
        <table className="w-full border-collapse text-left lg:col-span-7 lg:col-start-6" data-hotel-roles="">
          <caption className="sr-only">{data.heading}</caption>
          <thead>
            <tr className="text-overline uppercase text-text-soft">
              <th scope="col" className="pb-3 pr-4 font-normal">
                {data.taskLabel}
              </th>
              <th scope="col" className="pb-3 font-normal">
                {data.whoLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.task} className="border-t border-line align-top">
                <th scope="row" className="w-1/2 py-4 pr-4 text-body font-normal text-text">
                  {row.task}
                </th>
                <td className="py-4 text-body text-text-soft">{row.who}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function Quality({ data }) {
  return (
    <Section tone="surface" labelledBy="ho-qualitaet">
      <SectionHead id="ho-qualitaet" eyebrow={data.eyebrow} title={data.heading} text={data.text} />
      <dl className="mt-stack-m grid grid-cols-1 gap-x-8 @min-[40rem]/page:grid-cols-2 @5xl/page:grid-cols-3" data-hotel-quality="">
        {data.items.map((item, index) => (
          <div key={item.name} className="reveal border-t border-line py-6" style={staggerStyle(index, 3)}>
            <dt className="text-title text-text">{item.name}</dt>
            <dd className="mt-2 max-w-measure text-body text-text-soft">{item.text}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-stack-s max-w-measure text-small text-text-soft">{data.note}</p>
    </Section>
  );
}

function Brands({ data }) {
  const ezarri = ezarriDealerClaimVisible();
  return (
    <Section tone="band" labelledBy="ho-marken">
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-8">
        <div className="lg:col-span-7">
          <SectionHead id="ho-marken" eyebrow={data.eyebrow} title={data.heading} />
          <p className="mt-stack-m max-w-measure text-body text-text" data-hotel-dealer="">
            {ezarri ? data.dealer : data.dealerNoEzarri}
          </p>
          <p className="mt-3 max-w-measure text-body text-text-soft">{data.text}</p>
          <p className="mt-3 max-w-measure text-body text-text-soft">
            {data.ezarriNote}{" "}
            <a
              href={data.ezarriLink.href}
              target="_blank"
              rel="noopener noreferrer"
              // Optik-QA: Link im Fließtext ohne inline-flex/min-h – sonst springt der Zeilenabstand
              // (WCAG 2.5.8 nimmt Links im Satz von der Zielgröße aus).
              className={`text-text underline decoration-line-strong underline-offset-4 hover:decoration-current ${LINK_EASE}`}
            >
              {data.ezarriLink.label}
              <span className="sr-only"> (ezarri.com)</span>
            </a>
          </p>
        </div>
      </div>
    </Section>
  );
}

function Area({ data, arlberg, locale }) {
  return (
    <Section tone="surface" spacing="compact" labelledBy="ho-gebiet">
      <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-8">
        <div className="lg:col-span-5">
          <Eyebrow>{data.eyebrow}</Eyebrow>
          <Heading id="ho-gebiet" level={2} size="display-m" className="mt-stack-s">
            {fitHeading(data.heading)}
          </Heading>
        </div>
        <div className="lg:col-span-6 lg:col-start-7 lg:self-end">
          <p className="max-w-measure text-body text-text">{data.text}</p>
          {/* Rat 9,5 C7: Hotel ↔ Arlberg (Regionsseite nur auf Deutsch) */}
          {arlberg && <PageLink link={{ ...arlberg, deOnly: true }} locale={locale} className="mt-stack-s" />}
        </div>
      </div>
    </Section>
  );
}

/**
 * Rat 9,5 B10 (ux 6): Sprungnavigation – die Seite ist auf dem Telefon sehr lang.
 * Eine Zeile Anker unter dem Kopf, mobil waagerecht scrollbar (nur die Zeile,
 * nie die Seite), Ziele 44 px hoch.
 */
function JumpNav({ label, items }) {
  return (
    // QM R1: rechts eine Ausblendung als Hinweis, dass die Zeile weiterscrollt (nur bis md,
    // dort brechen die Anker um); pointer-events-none, damit der letzte Anker klickbar bleibt.
    <nav
      aria-label={label}
      className="relative border-y border-line after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-12 after:bg-linear-to-l after:from-surface after:to-transparent md:after:hidden"
      data-hotel-jump=""
    >
      <Container>
        {/* QM R3: scroll-padding = Innenabstand – sonst rastete WebKit den ersten Anker an die Kante (scrollLeft 20). */}
        <ul className="-mx-gutter flex snap-x scroll-px-gutter gap-x-6 overflow-x-auto px-gutter pr-12 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 md:scroll-px-0">
          {items.map((it) => (
            <li key={it.href} className="shrink-0 snap-start">
              <a href={it.href} className={`inline-flex min-h-11 items-center text-ui text-text underline decoration-transparent underline-offset-4 hover:decoration-current ${LINK_EASE}`}>
                {it.label}
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}

function Inquiry({ data, labels, terminHref, terminLabel, locale }) {
  return (
    <Section tone="band" labelledBy="ho-anfrage" id={data.id} className="scroll-mt-[88px]">
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-8">
        <SectionHead id="ho-anfrage" eyebrow={data.eyebrow} title={data.heading} text={data.text} className="lg:col-span-4" />
        <div className={cx("lg:col-span-7 lg:col-start-6")}>
          {/* Sprungziel des Chalet-Knopfs (#anfrage-chalet → Art "Chalet" vorbelegt). */}
          <span id="anfrage-chalet" aria-hidden="true" className="block scroll-mt-[104px]" />
          <HotelInquiryForm form={data} labels={labels} terminHref={terminHref} terminLabel={terminLabel} locale={locale} />
        </div>
      </div>
    </Section>
  );
}

/**
 * @param {object} props
 * @param {string} props.locale "de" | "en" | "fr" | "it"
 * @param {object} props.copy hotelCopy(locale)
 * @param {{topic: string, place: string}} props.labels Wizard-Beschriftungen für das Backoffice
 */
export default function HotelPage({ locale, copy, labels }) {
  // Rat 9,5 B1: Ziel und Wort des Terminknopfs aus dem zentralen Helfer (Kontext thema=hotel).
  const termin = landingTermin({ thema: "hotel" }, locale);
  const terminHref = termin.href;
  const contactHref = ROUTES.kontakt[locale] || ROUTES.kontakt.de;
  const references = visibleReferences(locale);
  const t3 = hotelT3(locale);
  return (
    <div className={PAGE_HY} data-hotel-page="">
      <JsonLd data={hotelSchema(locale)} />
      <LandingHero
        title={copy.hero.title}
        eyebrow={copy.hero.eyebrow}
        lead={copy.hero.lead}
        crumb={copy.hero.crumb}
        primaryLabel={copy.hero.primary}
        appointmentHref={`#${copy.form.id}`}
        facts={copy.hero.facts}
        leadShort={t3.leadShort}
        schema={<StudioSchema kind="hotel" locale={locale} />}
      />
      <JumpNav label={t3.jumpLabel} items={t3.jump} />
      <Services data={copy.services} brands={copy.brands} locale={locale} />
      <Chalets data={copy.chalets} />
      <Process data={copy.process} />
      <SampleRoom data={copy.sampleRoom} />
      <Roles data={copy.roles} />
      <Quality data={copy.quality} />
      <Brands data={copy.brands} />
      <HotelReferences data={copy.references} items={references} locale={locale} />
      <Area data={copy.area} arlberg={t3.arlberg} locale={locale} />
      <Inquiry data={copy.form} labels={labels} terminHref={terminHref} terminLabel={termin.label} locale={locale} />
      <FaqSection faq={copy.faq} />
      <ShowroomFacts heading={copy.showroom.heading} text={copy.showroom.text} />
      <LandingClosing
        heading={copy.closing.heading}
        text={copy.closing.text}
        primaryLabel={termin.label}
        write={termin.write}
        secondary={{ href: contactHref, label: copy.closing.secondary }}
        appointmentHref={terminHref}
      />
    </div>
  );
}
