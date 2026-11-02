// Layout for /de/outdoor-gartenplanung. Same building blocks as the local
// landing pages (src/components/Landing/parts.js: hero, section heads, FAQ,
// closing band) and the design system of the Neuauftritt (Design-Bibel
// §4–§9). The former own palette (moss, leaf, dusk, water) is replaced by the
// tokens: light surfaces, ONE walnut surface (care and winter storage),
// hairlines instead of cards with radius and shadow. The season colours the
// page file passes (`season.items[].color`) are no longer drawn – seasonal
// colour is reserved for campaign modules (§4.3).
// Server component, no client JavaScript. Copy lives in the page file.
// Metadata (landingMetadata) and JSON-LD (WebPage + Service + FAQPage) unchanged.
//
// Wording rules (Marktresearch/30-geschaeftsfeld-outdoor-gartenplanung.md,
// Abschnitt 8): no "Bauleitung"/"Bauaufsicht"/"Generalunternehmer" as our own
// service, no "Gartenplaner"/"Landschaftsarchitektur", no "wir bauen Ihren
// Pool", no "Behördenwege/Baubewilligung übernehmen", no dealer claims, no
// "Nr. 1", no invented references. Garden plans, construction and site
// management are done by licensed firms the customer contracts directly.
import JsonLd from "@/components/Reusable/JsonLd";
import HandBridge from "@/components/Reusable/HandBridge";
import { staggerStyle } from "../motionLanding";
import { Horizon, LinkArrow, Section, cx } from "@/components/ui";
import { SITE_URL } from "@/lib/seo/pageMetadata";
import { graph, IN_LANGUAGE, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo/structuredData";
import { ROUTES } from "@/utils/routing";
import { PAGE_HY, fitHeading } from "../typoLanding";
// landing-kern (01.11.2026): EN/FR/IT tragen `content.locale`; Texte aus src/lib/content/landingKern.
import { localizeAlt, localeLink, sharedCopy } from "@/lib/content/landingKern";
import { EMAIL } from "@/lib/site";
import {
  BrandGroups,
  CheckList,
  FactList,
  FaqSection,
  LandingClosing,
  LandingGallery,
  LandingHero,
  SectionHead,
  beratungHref,
  breadcrumbNode,
  landingCrumbs,
  useLandingCopy,
  splitLead,
} from "../parts";

// ux P1-1: appointment buttons open the consultation with the outdoor topic.
const APPOINTMENT_HREF_DE = beratungHref({ thema: "outdoor" });
import { cleanGallery, heroImage, imageOverrides } from "../imagery";
import EzarriFigure from "../EzarriFigure";

// Rat 9,5 A6 (Inhaber-Entscheidung Nr. 7): Ezarri-Projektbild aus der Galerie
// (src/lib/ezarri/gallery.json, „Ash 25“), unverändert, mit Quellenangabe.
const POOL_IMAGE = {
  web: "/ezarri/zen/anw-ash-zen-mosaic-pool-ezarri-7a",
  breite: 1600,
  hoehe: 1200,
};

function outdoorSchema(content, path, hero) {
  const locale = content.locale || "de";
  const url = `${SITE_URL}/${locale}${path}`;
  // Same trail as the visible breadcrumb (menu path, gesamtwerk P2; seo P2-5).
  const crumbs = breadcrumbNode(landingCrumbs(content.hero.crumb, content.hero.trail, false, locale), url, locale);
  return graph(
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: content.hero.title,
      inLanguage: IN_LANGUAGE[locale] || "de-AT",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORGANIZATION_ID },
      primaryImageOfPage: `${SITE_URL}${hero.src}`,
      breadcrumb: { "@id": crumbs["@id"] },
    },
    crumbs,
    {
      "@type": "Service",
      "@id": `${url}#service`,
      name: content.schema.serviceName,
      serviceType: content.schema.serviceType,
      description: content.schema.description,
      provider: { "@id": ORGANIZATION_ID },
      areaServed: content.schema.areaServed.map((name) => ({ "@type": "Place", name })),
      url,
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: content.faq.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    }
  );
}

export default function OutdoorLanding({ content, path }) {
  const { hero, intro, services, roles, season, gallery, brands, care, cta, faq } = content;
  const l = useLandingCopy();
  const locale = content.locale || "de";
  const intl = locale !== "de" ? sharedCopy(locale) : null;
  const APPOINTMENT_HREF = intl ? beratungHref({ thema: "outdoor" }, ROUTES.beratung[locale]) : APPOINTMENT_HREF_DE;
  const link = (l2) => (intl ? localeLink(l2, locale) : l2);
  const poolLink = link({ href: "/ezarri/pool", label: l("outdoorEzarriLink") });
  const bridgeDe = ["Pool mit Ezarri-Glasmosaik", "Sonne auf Terrasse und Becken", "Whirlpool & Kaltwasserbecken im Garten", "Bootshaus, Steg und Boot"];
  const bridgeLabels = content.bridgeLinks || bridgeDe;
  const bridgeLinks = ["/ezarri/pool", "/bodensee-licht?szene=pool", "/bad-wellness#marke-aquavia-spa", "/yacht-interior"].map((href, i) => link({ href, label: bridgeLabels[i] }));
  const mailHref = `mailto:${EMAIL}?subject=${encodeURIComponent(cta.mailSubject)}`;
  // Image register: no Provence/sea motif, own hero, gallery without the hero
  // (QM P1-2, P2-3).
  const heroRaw = heroImage(path, hero.image, hero.alt);
  const heroImg = intl ? { ...heroRaw, alt: localizeAlt(content, heroRaw.src, heroRaw.alt) } : heroRaw;
  const images = cleanGallery(gallery, heroImg.src, imageOverrides(path).gallery).map((img) => (intl ? { ...img, alt: localizeAlt(content, img.src, img.alt) } : img));
  // Hero lead max. two sentences (P2-1); the rest opens the intro.
  const [leadHead, leadRest] = splitLead(hero.lead);
  const introParagraphs = leadRest ? [leadRest, ...intro.paragraphs] : intro.paragraphs;

  return (
    <div className={PAGE_HY}>
      <JsonLd data={outdoorSchema(content, path, heroImg)} />

      <LandingHero
        title={hero.title}
        eyebrow={hero.eyebrow}
        lead={leadHead}
        image={heroImg.show ? heroImg.src : null}
        alt={heroImg.alt}
        crumb={hero.crumb}
        trail={hero.trail}
        appointmentHref={APPOINTMENT_HREF}
        primaryLabel={cta.primaryLabel}
      />

      {/* Intro — one contact, one concept */}
      <Section tone="surface" labelledBy="intro-title" className="pt-0!">
        <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-12 lg:gap-x-8">
          <div className="lg:col-span-6">
            <SectionHead id="intro-title" eyebrow={intro.eyebrow} title={intro.heading} />
            <div className="mt-stack-m max-w-measure space-y-4 text-body text-text">
              {introParagraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
          <div className="reveal lg:col-span-5 lg:col-start-8">
            {/* Rat 9,5 A6: freigegebenes Ezarri-Bild früh auf der Seite (Pool im Garten), eigenes Modul mit Credit. */}
            <EzarriFigure image={POOL_IMAGE} locale={locale} alt={l("outdoorEzarriAlt")} caption={l("outdoorEzarriCaption")} sizes="(min-width: 1440px) 520px, (min-width: 1024px) 36vw, 100vw" data-outdoor-ezarri="" />
            <LinkArrow href={poolLink.href} className="mt-2">
              {poolLink.label}
            </LinkArrow>
            <CheckList items={intro.points} className="mt-stack-m" />
          </div>
        </div>
      </Section>

      {/* Services — seven building blocks of an outdoor space + closing cell */}
      <Section tone="band" labelledBy="services-title">
        <SectionHead id="services-title" eyebrow={services.eyebrow} title={services.heading} text={services.text} />
        <ul className="mt-stack-m grid grid-cols-1 gap-x-8 @min-[40rem]/page:grid-cols-2 @5xl/page:grid-cols-3">
          {services.items.map(({ icon: Icon, title, text, by }, index) => (
            <li key={title} className="reveal flex flex-col border-t border-line-strong py-8" style={staggerStyle(index, 3)}>
              {Icon && <Icon aria-hidden="true" strokeWidth={1.5} className="size-6 text-text-soft" />}
              <h3 className="mt-4 text-title text-text">{fitHeading(title)}</h3>
              <p className="mt-2 max-w-measure flex-1 text-body text-text-soft">{text}</p>
              {by && <p className="mt-4 text-small text-text">{by}</p>}
            </li>
          ))}
          {/* Closing cell fills the last row (7 items: 1 free cell on sm, 2 on lg) */}
          <li className="reveal flex flex-col justify-between gap-6 border-t border-line-strong py-8 lg:col-span-2" style={staggerStyle(services.items.length, 3)}>
            <div>
              {services.closingEyebrow && <p className="text-overline uppercase text-text-accent">{services.closingEyebrow}</p>}
              <p className="mt-stack-s max-w-measure text-lead text-text">{services.closingText}</p>
            </div>
            <LinkArrow href={APPOINTMENT_HREF}>{cta.primaryLabel}</LinkArrow>
          </li>
        </ul>
      </Section>

      {/* Roles — who does what (the legally important part) */}
      <Section tone="surface" labelledBy="roles-title">
        <SectionHead id="roles-title" eyebrow={roles.eyebrow} title={roles.heading} text={roles.text} />
        <ul className="mt-stack-m grid grid-cols-1 gap-x-8 gap-y-10 @3xl/page:grid-cols-3">
          {roles.columns.map(({ icon: Icon, title, subtitle, items = [] }, index) => (
            <li key={title} className={cx("reveal border-t pt-6", index === 0 ? "border-t-2 border-text" : "border-line-strong")} style={staggerStyle(index, 3)}>
              {Icon && <Icon aria-hidden="true" strokeWidth={1.5} className="size-6 text-text-soft" />}
              <h3 className="mt-4 text-title text-text">{fitHeading(title)}</h3>
              {subtitle && <p className="mt-1 text-small text-text-soft">{subtitle}</p>}
              <ul className="mt-4 border-t border-line">
                {items.map((item) => (
                  <li key={item} className="border-b border-line py-3 text-body text-text">
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        {roles.note && <p className="mt-stack-m max-w-measure text-small text-text-soft">{roles.note}</p>}
      </Section>

      {/* Season — the process as a year; the page's one Horizontlinie */}
      <Section tone="band" labelledBy="season-title">
        <SectionHead id="season-title" eyebrow={season.eyebrow} title={season.heading} text={season.text} />
        <Horizon className="mt-stack-m" />
        <ol className="mt-8 grid grid-cols-1 gap-x-8 gap-y-10 @min-[40rem]/page:grid-cols-2 @5xl/page:grid-cols-5">
          {season.items.map((step, index) => (
            <li key={step.title} className="reveal" style={staggerStyle(index, 5)}>
              <span aria-hidden="true" className="font-display text-display-m text-text-soft tabular">
                {String(index + 1).padStart(2, "0")}
              </span>
              {step.when && <p className="mt-stack-s text-overline uppercase text-text-accent">{step.when}</p>}
              <h3 className="mt-2 text-title text-text">{fitHeading(step.title)}</h3>
              <p className="mt-2 text-body text-text-soft">{step.text}</p>
            </li>
          ))}
        </ol>
        {season.highlight && (
          // QM R3: deutlich abgesetzt von der Zeitachse (vorher ~15 px Abstand)
          <p className="mt-12 max-w-text border-l border-line-strong pl-6 text-lead text-text md:mt-16">{season.highlight}</p>
        )}
      </Section>

      {/* Gallery — terraces and outdoor lounges */}
      <LandingGallery images={images} label={hero.title} className="pt-section" bottom={false} />

      {/* Kern-USP (Inhaber-Entscheidung Nr. 8) + Pool (Ezarri), Licht (Bodensee-Licht),
          Whirlpool & Kaltwasserbecken (Bad & Wellness, Nr. 19–21: Aquavia Spa) */}
      <HandBridge variant="feld" className="py-16 md:py-20" copy={intl ? { aria: intl.handBridge.aria, text: intl.handBridge.feld, link: intl.handBridge.work } : null} links={bridgeLinks} />

      {/* Brands — outdoor collections from our range */}
      <Section tone="surface" labelledBy="brands-title" className="pt-0!">
        <SectionHead id="brands-title" eyebrow={brands.eyebrow} title={brands.heading} text={brands.text} />
        <div className="mt-stack-m">
          <BrandGroups groups={brands.groups} cols={4} locale={locale} />
        </div>
      </Section>

      {/* Care — maintenance and winter storage: the page's ONE dark surface */}
      <Section tone="inverse" labelledBy="care-title">
        <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-8">
          <SectionHead id="care-title" eyebrow={care.eyebrow} title={care.heading} text={care.text} tone="dark" className="lg:col-span-5" />
          <FactList items={care.items} tone="dark" className="lg:col-span-6 lg:col-start-7" />
        </div>
      </Section>

      <FaqSection faq={faq} />

      {/* Closing — appointment; showroom line from the page copy */}
      <LandingClosing
        heading={cta.heading}
        text={cta.text}
        primaryLabel={cta.primaryLabel}
        secondary={{ href: mailHref, label: l("mail") }}
        showPhone
        note={cta.showroom}
        appointmentHref={APPOINTMENT_HREF}
      />
    </div>
  );
}
