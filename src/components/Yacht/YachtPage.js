// Layout for /de/yacht-interior (R7-P4, Release-Rat R2: gesamtwerk P1-6, ux P2-4,
// technik P1-5). Abgeleitet aus src/components/Landing/Yacht/YachtLanding.js, aber
// kürzer und mit klarer Bildhierarchie „echtes Material vor eigener Grafik vor KI“:
//   - kein bildschirmbreites KI-Kapitel „Sechs Boote, sechs Welten“ mehr; die
//     KI-Bilder stehen nur noch kartengroß in den Beispielkonzepten, jedes mit
//     „KI-Visualisierung“ (ConceptImage/KiLabel);
//   - „Beach Club / Superyacht (Inspiration)“ entfällt (page.js filtert das Konzept);
//   - „Wer macht was“ steht genau einmal (Kurs durchs Winterlager); weniger
//     Produktlinks (Konzept: höchstens 4, Markenregal: 1 je Marke);
//   - mobil: USP-Satz und Termin (beratung?thema=yacht) im ersten Bildschirm (YachtHero).
// Ziel: mobil ≤ 12 000 px Seitenhöhe. Server component.
//
// Wording rules (Marktresearch/29-geschaeftsfeld-yacht-interior.md, Abschnitt 8):
// no "Nr. 1"/"führend", no dealer or partner claims, no "marine-zertifiziert"
// or "schwer entflammbar", no "Bauleitung"/"Komplett-Refit aus einer Hand",
// no names of yards or upholsterers, no invented references, no prices.
import { MapPin } from "lucide-react";
import JsonLd from "@/components/Reusable/JsonLd";
import { Horizon, LinkArrow, Section } from "@/components/ui";
import { SITE_URL } from "@/lib/seo/pageMetadata";
import { breadcrumbList, graph, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo/structuredData";
import { EMAIL } from "@/lib/site";
import { schreibenHref } from "@/lib/forms/terminLink";
import { islandConcepts } from "@/lib/yacht/model";
import YachtHero from "@/components/Yacht/YachtHero";
import ConceptGallery from "@/components/Yacht/ConceptGallery";
import Werfthalle from "@/components/Yacht/Werfthalle";
import BrandShelf from "@/components/Yacht/BrandShelf";
import NavettaReference from "@/components/Yacht/NavettaReference";
import YachtReferences from "@/components/Yacht/YachtReferences";
import HandBridge from "@/components/Reusable/HandBridge";
import ProcessBridge from "@/components/Yacht/ProcessBridge";
import DayArc from "@/components/Yacht/DayArc";
import MobileSnapRow from "@/components/Yacht/MobileSnapRow";
import SnapHint from "@/components/Yacht/SnapHint";
import { ezarriInNavigation } from "@/lib/ezarri/config";

// Welle 2 (Inhaber 29.10.2026): cross-links to the hotel page and the Ezarri
// world (Ezarri only while it is public, EZARRI_PUBLIC).
const withEzarri = (links) => links.filter((l) => l.href !== "/ezarri" || ezarriInNavigation());
const CROSS_LINKS = {
  de: [
    { href: "/hotel-objekt", label: "Hotel & Objekt" },
    { href: "/ezarri", label: "Ezarri Glasmosaik für Pool und Spa" },
    // Bad & Wellness (Inhaber-Entscheidungen Nr. 19–21): heated loungers by Fabio Alemanno.
    { href: "/bad-wellness#marke-fabio-alemanno", label: "Wellness an Bord" },
  ],
  en: [
    { href: "/hotel-objekt", label: "Hotels & projects" },
    { href: "/ezarri", label: "Ezarri glass mosaic for pool and spa" },
    { href: "/bad-wellness#marke-fabio-alemanno", label: "Wellness on board" },
  ],
  // FR/IT: the Ezarri world exists in all four languages since 01.11.2026.
  fr: [
    { href: "/hotel-objekt", label: "Hôtels & projets" },
    { href: "/ezarri", label: "Mosaïque Ezarri pour piscine et spa" },
    { href: "/bad-wellness#marke-fabio-alemanno", label: "Bien-être à bord" },
  ],
  it: [
    { href: "/hotel-objekt", label: "Hotel & progetti" },
    { href: "/ezarri", label: "Mosaico Ezarri per piscina e spa" },
    { href: "/bad-wellness#marke-fabio-alemanno", label: "Benessere a bordo" },
  ],
};
import { yachtUi } from "@/lib/yacht/ui";
import { NAVETTA_RELEASED, navettaCopy, navettaSrc } from "@/lib/yacht/navetta";

// Rat 9,5 A6: Hero-Foto „Salon zum Achterdeck“ – Innenraum und Deck, also das, was wir an Bord planen.
const HERO_NAVETTA_FILE = "30396_z_04_Minotti_CustomLine_Navetta42_1.jpg";
function navettaHeroPhoto({ images, credit, disclaimer }) {
  const img = images.find((i) => i.file === HERO_NAVETTA_FILE) || images[0];
  return img ? { src: navettaSrc(img), alt: img.alt, width: img.width, height: img.height, credit, disclaimer } : null;
}
import styles from "@/components/Yacht/yacht.module.css";
import light from "@/components/Yacht/materialLight.module.css";
import { FaqSection, LandingClosing, SectionHead, landingTermin, useLandingCopy } from "@/components/Landing/parts";
import { heroImage } from "@/components/Landing/imagery";

/** Compact section rhythm of this page (QA round 2, P2.4: page length). */
const SECTION_Y = "py-8 md:py-16";
/** Chapter openers (Kinosaal, Werfthalle) breathe more: three tempi instead of one (visual-design 31.10.2026). */
const SECTION_Y_WIDE = "py-10 md:py-24 lg:py-28";
/**
 * Phones only (below sm): a list as a horizontal scroll-snap row instead of a
 * stack (Inhaber-Entscheidung Nr. 11: page ≤ 12 600 px). SNAP_ROW on the
 * scrolling wrapper (MobileSnapRow), SNAP_LIST on the list, SNAP_ITEM per item.
 */
// QM r2 (200 % Text): die Reihe scrollt nur, solange ihr Container ≥ 20 rem ist (rem wächst mit der
// Schrift) – bei vergrößerter Schrift stapeln die Karten, statt rechts angeschnitten zu stehen.
const SNAP_ROW = "@container/snap max-sm:-mx-gutter max-sm:snap-x max-sm:snap-mandatory max-sm:overflow-x-auto max-sm:scroll-px-gutter max-sm:px-gutter max-sm:[scrollbar-width:thin] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus";
const SNAP_LIST = "max-sm:@xs/snap:flex max-sm:@xs/snap:gap-x-4 max-sm:gap-y-4";
const SNAP_ITEM = "max-sm:@xs/snap:w-[78%] max-sm:@xs/snap:max-w-[22rem] max-sm:@xs/snap:shrink-0 max-sm:@xs/snap:snap-start";

// Welle 2 (EN): one schema for both languages – URL, inLanguage and the
// breadcrumb follow the page locale.
const IN_LANGUAGE = { de: "de-AT", en: "en-GB", fr: "fr", it: "it" };
function yachtSchema(content, path, primaryImage, locale = "de") {
  const url = `${SITE_URL}/${locale}${path}`;
  return graph(
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: content.hero.title,
      description: content.hero.lead,
      inLanguage: IN_LANGUAGE[locale] || IN_LANGUAGE.de,
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORGANIZATION_ID },
      primaryImageOfPage: `${SITE_URL}${primaryImage}`,
      breadcrumb: breadcrumbList(
        [{ name: "Home", url: `${SITE_URL}/${locale}` }, { name: content.hero.crumb }],
        `${url}#breadcrumb`
      ),
    },
    {
      "@type": "Service",
      "@id": `${url}#service`,
      name: content.schema.serviceName,
      serviceType: content.schema.serviceType,
      ...(content.schema.alternateName ? { alternateName: content.schema.alternateName } : {}),
      description: content.schema.description,
      provider: { "@id": ORGANIZATION_ID },
      // texte-seo-ki 31.10.2026: owners, yards and upholsterers as the stated audience
      ...(content.schema.audience ? { audience: content.schema.audience.map((audienceType) => ({ "@type": "Audience", audienceType })) } : {}),
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

/** Materials as drawn swatches on the page's one walnut surface. */
// Desktop: head on top, three columns of materials. Phones: a compact list
// with a small swatch next to the name (QA round 2, P2.4).
function Materials({ data }) {
  return (
    <Section tone="inverse" labelledBy="materials-title" spacing="none" className={SECTION_Y}>
      <SectionHead id="materials-title" eyebrow={data.eyebrow} title={data.heading} text={data.text} tone="dark" className={`[&>p:last-child]:max-sm:hidden ${styles.fitHead}`} />
      {/* QM r4 (200 % Text): Spalten nach Containerbreite in rem statt nach Viewport – bei großer
          Schrift einspaltig (Handy) bzw. ein-/zweispaltig (Desktop), damit kein Titel über den Rand
          oder unter das Muster der Nachbarspalte läuft. Normale Schrift: 2 / 3 Spalten wie bisher. */}
      <div className="@container/mat">
      <ul className="reveal-group mt-stack-m grid grid-cols-1 gap-x-4 max-sm:@[18rem]/mat:grid-cols-2 sm:gap-x-8 sm:gap-y-8 sm:@[41rem]/mat:grid-cols-2 sm:@[62rem]/mat:grid-cols-3">
        {data.items.map((m) => (
          <li key={m.name} className={`flex min-w-0 gap-3 border-t border-line-inverse py-4 sm:gap-4 sm:pb-0 sm:pt-5 ${styles.fitMat}`}>
            <span aria-hidden="true" className={`mt-1 block size-6 shrink-0 sm:mt-0 sm:size-12 lg:size-20 ${light.rake} ${styles[m.swatch] || ""}`} />
            <div className="min-w-0">
              <h3 className="text-ui text-text-inverse sm:text-title">{m.name}</h3>
              <p className="mt-1 text-small text-text-inverse-soft max-sm:hidden sm:mt-2 sm:text-body">{m.text}</p>
            </div>
          </li>
        ))}
      </ul>
      </div>
    </Section>
  );
}

/**
 * Course through the winter storage: Gantt on desktop, list on phones. The
 * three parties stand once, as the legend above the Gantt (the former
 * section "Drei Beteiligte" is merged in here – QA round 2, P2.5).
 */
function Course({ data, roles, t }) {
  const n = data.months.length;
  return (
    <Section tone="surface" labelledBy="course-title" spacing="none" className={SECTION_Y}>
      {/* mobil ohne Einleitungstext (Seitenlänge ≤ 12 000 px, R2 gesamtwerk P1-6) */}
      <SectionHead id="course-title" eyebrow={data.eyebrow} title={data.heading} text={data.text} className={`scroll-mt-28 [&>p:last-child]:max-sm:hidden ${styles.fitHead}`} />
      <div className="mt-stack-m border-t border-line-strong pt-6">
        <h3 className="text-overline uppercase text-text-soft">{roles.heading}</h3>
        <p className="mt-2 max-w-text text-body text-text-soft max-sm:hidden">{roles.text}</p>
        <MobileSnapRow label={roles.heading} className={`mt-6 ${SNAP_ROW}`}>
        {/* QM r4 (1440 px, 200 % Text): drei Spalten erst ab 42 rem Containerbreite statt ab md –
            bei großer Schrift untereinander statt schmaler Spalten, die über den Rand laufen. */}
        <dl className={`grid grid-cols-1 gap-x-8 gap-y-5 @2xl/snap:grid-cols-3 ${SNAP_LIST}`}>
          {roles.columns.map((col) => (
            <div key={col.title} className={`${SNAP_ITEM} max-sm:border-t max-sm:border-line max-sm:pt-3`}>
              <dt className="text-overline uppercase text-text-accent">{col.title}</dt>
              {/* QM r2: je Leistung eine Zeile statt Fließtext mit „·“ (kein Trenner am Zeilenanfang/-ende) */}
              <dd className="mt-2 text-small text-text">
                <ul className="space-y-1">
                  {col.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
        </MobileSnapRow>
        <SnapHint label={t.swipeHint} />
      </div>
      <Horizon className="mt-stack-m" />
      {/* QM r2: Zweispaltigkeit mobil per Container-Query in rem – bei 200 % Text (oder unter 20 rem
          Breite) einspaltig, damit Monate und Titel nicht ineinanderlaufen.
          QM r4: auch der Zeitplan (12 Spalten, Balken) hängt an der Containerbreite in rem (≥ 56 rem)
          statt an lg – bei 1440 px mit 200 % Text steht er einspaltig, nichts läuft über den Rand. */}
      <div className="@container/kurs">
      <div aria-hidden="true" className="mt-4 hidden grid-cols-12 gap-x-8 @4xl/kurs:grid">
        <div className="col-span-4" />
        <div className="col-span-8 grid text-overline uppercase text-text-soft" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {data.months.map((m) => (
            <span key={m} className="border-l border-line pl-2">
              {m}
            </span>
          ))}
        </div>
      </div>
      <ol className="mt-4 max-sm:grid max-sm:grid-cols-1 max-sm:gap-x-4 max-sm:@xs/kurs:grid-cols-2">
        {data.items.map((step, i) => (
          <li key={step.title} className="grid min-w-0 grid-cols-1 gap-y-3 border-b border-line py-3 sm:py-4 @4xl/kurs:grid-cols-12 @4xl/kurs:gap-x-8">
            <div className="min-w-0 @4xl/kurs:col-span-4">
              <p className="text-overline uppercase text-text-accent">
                <span className="tabular">{String(i + 1).padStart(2, "0")}</span>{" · "}{step.when}
              </p>
              <h3 className="mt-2 text-title text-text hyphens-auto [overflow-wrap:break-word]">{step.title}</h3>
            </div>
            <div className="min-w-0 @4xl/kurs:col-span-8">
              <div aria-hidden="true" className="relative hidden h-2 bg-stone @4xl/kurs:block">
                <span
                  className="absolute inset-y-0 bg-see"
                  style={{ left: `${(step.from / n) * 100}%`, width: `${((step.to - step.from + 1) / n) * 100}%` }}
                />
              </div>
              {/* mobil nur unser Anteil – die Aufteilung steht einmal oben (R2 ux P2-4: „Wer macht was“ nicht dreifach) */}
              <dl className="hidden grid-cols-1 gap-3 text-small sm:grid sm:@2xl/kurs:grid-cols-3 @4xl/kurs:mt-4">
                <div>
                  <dt className="text-overline uppercase text-text-soft">{t.partyUs}</dt>
                  <dd className="mt-1 text-text">{step.us}</dd>
                </div>
                <div>
                  <dt className="text-overline uppercase text-text-soft">{t.partySattler}</dt>
                  <dd className="mt-1 text-text">{step.sattler}</dd>
                </div>
                <div>
                  <dt className="text-overline uppercase text-text-soft">{t.partyWerft}</dt>
                  <dd className="mt-1 text-text">{step.werft}</dd>
                </div>
              </dl>
            </div>
          </li>
        ))}
      </ol>
      </div>
    </Section>
  );
}

/**
 * Benchmark fix-02: a second path for the trades (yard, upholsterer, skipper /
 * yacht management) – the B2B way in that the contract divisions of the big
 * furniture brands offer and our page lacked. Mail with its own subject per
 * role, so the inbox can sort it. Renders nothing without content.trade.
 * Wording §8: no partner names, no "Partner"/"Bauleitung" claims.
 */
function TradePaths({ data, t, tradeHref }) {
  if (!data?.paths?.length) return null;
  return (
    <Section tone="surface" labelledBy="trade-title" id="fachleute" spacing="none" className={`scroll-mt-20 ${SECTION_Y}`}>
      {/* QM r4: kein Umbruch mitten im Wort mehr („Bootssattl|er“) – die Überschrift wird bei großer
          Schrift auf die Spaltenbreite gedeckelt (fitHead), statt mit overflow-wrap zu zerbrechen. */}
      <SectionHead id="trade-title" eyebrow={data.eyebrow} title={data.heading} text={data.text} className={styles.fitHead} />
      {/* Mobil (unter md) eine waagrechte Reihe mit Einrasten statt drei gestapelter Blöcke
          (Inhaber-Entscheidung Nr. 11: Seite ≤ 12 600 px); ab md unverändert drei Spalten. */}
      {/* QM r2: bei 200 % Text (Container < 20 rem) gestapelt statt angeschnittener Reihe */}
      {/* QM r4: drei Spalten erst ab 42 rem Containerbreite (1440 px mit 200 % Text: untereinander) */}
      <div className="@container/trade">
      <ul
        className="mt-stack-m grid grid-cols-1 gap-x-8 md:@2xl/trade:grid-cols-3 max-md:-mx-gutter max-md:@xs/trade:flex max-md:snap-x max-md:snap-mandatory max-md:gap-x-4 max-md:overflow-x-auto max-md:scroll-px-gutter max-md:px-gutter max-md:[scrollbar-width:thin]"
        data-yacht-trade=""
        aria-label={data.heading}
      >
        {data.paths.map((p) => (
          <li key={p.title} className={`min-w-0 border-t border-line-strong py-5 max-md:@xs/trade:w-[78%] max-md:@xs/trade:max-w-[22rem] max-md:@xs/trade:shrink-0 max-md:snap-start ${styles.fitTitle}`}>
            <h3 className="text-title text-text">{p.title}</h3>
            <p className="mt-2 max-w-measure text-body text-text-soft">{p.text}</p>
            <LinkArrow href={`mailto:${EMAIL}?subject=${encodeURIComponent(p.subject)}`} className="mt-3">
              {p.label}
            </LinkArrow>
          </li>
        ))}
      </ul>
      </div>
      <SnapHint label={t.swipeHint} bp="md" />
      {/* Yacht team (anfrage-mobil-code fix-02, 31.10.2026): the form entry for yards and upholsterers
          lives in this one section (no second block) – /beratung?thema=yacht&rolle=werft opens on
          "Yacht-Interieur" with its own line and "Fachweg: Werft/Bootssattler" (lib/forms/beratungContext.js). */}
      {tradeHref ? (
        <p className="mt-6 max-w-text text-body text-text" data-yacht-trade-form="">
          {t.tradeText}{" "}
          <LinkArrow href={tradeHref} prefetch={false}>
            {t.tradeLink}
          </LinkArrow>
        </p>
      ) : null}
    </Section>
  );
}

export default function YachtPage({ content, path, concepts, brandConcepts, locale = "de" }) {
  const t = yachtUi(locale);
  const { hero, intro, werfthalle, materials, course, roles, brands, area, cta, faq } = content;
  const l = useLandingCopy();
  // Yacht team (31.10.2026): the mail starts with the four questions that qualify a boat (ui.js mailBody).
  const mailHref = `mailto:${EMAIL}?subject=${encodeURIComponent(cta.mailSubject)}&body=${encodeURIComponent(t.mailBody)}`;
  const allImages = concepts.flatMap((c) => c.images);
  const filmImage = allImages[0];
  // JSON-LD primaryImageOfPage: the register's hero (unchanged) – the AI
  // image is a visualisation, not the page's photo.
  const heroImg = heroImage(path, filmImage?.webp[2400], hero.title);
  const island = islandConcepts(concepts);
  // Rat 9,5 A6: Hero mit dem freigegebenen Navetta-Foto (unverändert, mit Bildnachweis und
  // Hinweis „nicht von Platzhirsch eingerichtet“, src/lib/yacht/navetta.js).
  const heroPhoto = NAVETTA_RELEASED ? navettaHeroPhoto(navettaCopy(locale)) : null;
  // primaryImageOfPage folgt dem gezeigten Foto.
  const primaryImage = heroPhoto ? heroPhoto.src : heroImg.src;
  // Rat 9,5 B1: Ziel und Wort des Terminknopfs aus dem zentralen Helfer (Kontext thema=yacht).
  const termin = landingTermin({ thema: "yacht" }, locale);

  return (
    <div>
      <JsonLd data={yachtSchema(content, path, primaryImage, locale)} />
      {/* visual-design 31.10.2026: „Ein Tag am See“ – Sonnenstand als stille Scroll-Uhr (lg, CSS only) */}
      <DayArc />

      <YachtHero
        title={hero.title}
        eyebrow={hero.eyebrow}
        lead={hero.lead}
        crumb={hero.crumb}
        motto={hero.motto}
        primaryLabel={termin.label}
        secondary={hero.secondary}
        usp={hero.usp}
        ctaHref={termin.href}
        image={heroImg.show ? heroImg.src : null}
        alt={heroImg.alt}
        photo={heroPhoto}
      />

      {/* Prologue: the three rules on board */}
      <Section tone="surface" labelledBy="intro-title" spacing="none" className={SECTION_Y}>
        {/* QM r4 (1440 px, 200 % Text): zweispaltig erst ab 56 rem Containerbreite statt ab lg –
            sonst ragte „Sattlerhandwerk“ aus der 5er-Spalte in den Spaltenabstand. */}
        <div className="@container/intro">
        <div className="grid grid-cols-1 gap-y-12 @4xl/intro:grid-cols-12 @4xl/intro:gap-x-8">
          <div className="min-w-0 @4xl/intro:col-span-5">
            <SectionHead id="intro-title" eyebrow={intro.eyebrow} title={intro.heading} className={styles.fitHead} />
            <div className="mt-stack-m max-w-measure space-y-4 text-body text-text">
              {intro.paragraphs.map((p, i) => (
                <p key={p} className={i > 0 ? "max-sm:hidden" : undefined}>
                  {p}
                </p>
              ))}
            </div>
          </div>
          <MobileSnapRow label={intro.heading} className={`@4xl/intro:col-span-6 @4xl/intro:col-start-7 @4xl/intro:self-end ${SNAP_ROW}`}>
          <ol className={`grid grid-cols-1 gap-x-8 sm:@2xl/intro:grid-cols-3 sm:@4xl/intro:grid-cols-1 ${SNAP_LIST}`}>
            {intro.rules.map((r, i) => (
              <li key={r.name} className={`min-w-0 border-t border-line-strong py-4 sm:py-6 ${SNAP_ITEM} ${styles.fitTitle}`}>
                <p className="font-display text-display-m text-text-soft tabular max-sm:hidden" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-title text-text">{r.name}</h3>
                <p className="mt-2 max-w-measure text-body text-text-soft">{r.text}</p>
              </li>
            ))}
          </ol>
          </MobileSnapRow>
          <SnapHint label={t.swipeHint} />
        </div>
        </div>
      </Section>

      {/* visual-design 31.10.2026 (Bildfolge): echtes Material zuerst – der Kinosaal folgt direkt auf den Prolog,
          vor Werfthalle (eigene Grafik) und Beispielkonzepten (KI), wie es der Kopf dieser Datei verlangt. */}
      {/* Reference: Minotti on a yacht – real photos, unchanged, credited, no AI
          label. Written release of Minotti and Custom Line by mail 28.10.2026
          (Inhaber-Entscheidung Nr. 11; NAVETTA_RELEASED, src/lib/yacht/navetta.js). */}
      {NAVETTA_RELEASED ? (
        <Section tone="band" labelledBy="navetta-title" spacing="none" className={`overflow-x-clip bg-ink-deep! text-text-inverse! ${SECTION_Y_WIDE}`}>
          {/* visual-design 31.10.2026: „Kinosaal“ – dark stage, the photos glow; overflow-x-clip (not hidden) keeps sticky working */}
          <NavettaReference tone="dark" />
        </Section>
      ) : null}

      {/* Signature: Die Werfthalle */}
      <Section tone="band" labelledBy="werfthalle-title" id="werfthalle" className={`scroll-mt-20 ${SECTION_Y_WIDE}`} spacing="none">
        <SectionHead id="werfthalle-title" eyebrow={werfthalle.eyebrow} title={werfthalle.heading} text={werfthalle.text} className={styles.fitHead} />
        <div className="mt-stack-m">
          <Werfthalle concepts={island} initial={werfthalle.initial} />
        </div>
        <p className="mt-stack-m max-w-measure text-small text-text-soft max-sm:hidden">{werfthalle.note}</p>
      </Section>

      {/* Six concepts */}
      <Section tone="surface" labelledBy="konzepte-title" id="konzepte" spacing="none" className={SECTION_Y}>
        {/* QM r2 (200 % Text): zweispaltig nur, wenn der Container ≥ 64 rem ist – sonst stand der KI-Hinweis
            in einer 18-zeiligen Schmalspalte. */}
        <div className="@container/konz">
        <div className="grid grid-cols-1 gap-y-6 @5xl/konz:grid-cols-12 @5xl/konz:gap-x-8">
          <SectionHead id="konzepte-title" eyebrow={content.concepts.eyebrow} title={content.concepts.heading} text={content.concepts.text} className={`@5xl/konz:col-span-7 ${styles.fitHead}`} />
          <p className="min-w-0 max-w-measure border-l-2 border-see pl-4 text-small text-text-soft [overflow-wrap:break-word] @5xl/konz:col-span-4 @5xl/konz:col-start-9 @5xl/konz:self-end" data-ki-hinweis="">
            {content.concepts.aiNote}
          </p>
        </div>
        </div>
        <div className="mt-stack-m">
          <ConceptGallery concepts={concepts} />
        </div>
      </Section>

      <Materials data={materials} />

      <Course data={course} roles={roles} t={t} />


      {/* Rat 9,5 C7: Fallstudien-Slot – erst sichtbar mit freigegebenem eigenem Projekt (src/lib/yacht/references.js). */}
      <YachtReferences locale={locale} />

      {/* Kern-USP (Inhaber-Entscheidung Nr. 8): the same process on board */}
      {/* Welle 2: Yacht ↔ Hotel & Objekt ↔ Ezarri (all three in DE and EN). */}
      {locale === "de" ? (
        <HandBridge variant="feld" links={withEzarri(CROSS_LINKS.de)} className="py-12" />
      ) : (
        <ProcessBridge locale={locale} variant="feld" links={withEzarri(CROSS_LINKS[locale] || CROSS_LINKS.en)} className="py-12" />
      )}

      {/* Brands – only collections with the maker's stated use */}
      <Section tone="surface" labelledBy="brands-title" spacing="none" className={SECTION_Y}>
        <SectionHead id="brands-title" eyebrow={brands.eyebrow} title={brands.heading} text={brands.text} className={styles.fitHead} />
        <div className="mt-stack-m">
          <BrandShelf groups={brands.groups} concepts={brandConcepts ?? concepts} perBrand={1} />
        </div>
        {/* Outdoor planning exists in all four languages since 01.11.2026 (Sprach-Integration). */}
        <LinkArrow href="/outdoor-gartenplanung" className="mt-stack-m">
          {l("outdoorLink")}
        </LinkArrow>
      </Section>

      {/* Area – Bodensee and Mediterranean (typographic, no foreign place photos) */}
      {/* one block, two columns: head + showroom left, the two areas right (QA round 2, P2.4) */}
      <Section tone="band" labelledBy="area-title" spacing="none" className={SECTION_Y}>
        {/* QM r4 (1440 px, 200 % Text): Kopf und Reviere nebeneinander erst ab 56 rem Containerbreite,
            die zwei Reviere ab 42 rem – bei großer Schrift untereinander statt 2–3 Wörter je Zeile. */}
        <div className="@container/area">
        <div className="grid grid-cols-1 gap-y-6 @4xl/area:grid-cols-12 @4xl/area:gap-x-8">
          <div className="min-w-0 @4xl/area:col-span-5">
            <SectionHead id="area-title" eyebrow={area.eyebrow} title={area.heading} className={styles.fitHead} />
            <p className="mt-stack-m flex max-w-measure items-start gap-3 text-body text-text-soft">
              <MapPin aria-hidden="true" strokeWidth={1.5} className="mt-1 size-5 shrink-0 text-text-soft" />
              <span>{area.showroom}</span>
            </p>
          </div>
          {/* mobil die zwei Reviere nebeneinander (nur Titel, Seitenlänge); bei 200 % Text (< 20 rem) untereinander (QM r2) */}
          <ul className="reveal-group grid grid-cols-1 gap-x-4 max-sm:@xs/area:grid-cols-2 sm:gap-x-8 sm:@2xl/area:grid-cols-2 @4xl/area:col-span-6 @4xl/area:col-start-7 @4xl/area:self-end">
            {area.regions.map((r) => (
              <li key={r.title} className={`min-w-0 border-t border-line-strong py-5 ${styles.fitTitle}`}>
                <h3 className="text-title text-text">{r.title}</h3>
                <p className="mt-2 max-w-measure text-body text-text-soft max-sm:hidden">{r.text}</p>
              </li>
            ))}
          </ul>
        </div>
        </div>
      </Section>

      <TradePaths data={content.trade} t={t} tradeHref={schreibenHref(locale, { context: { thema: "yacht", rolle: "werft" } })} />

      {/* Inhaber-Entscheidung Nr. 11 (Seite mobil ≤ 12 600 px): unter md vier Fragen, der Rest per Knopf;
          alle Antworten bleiben im HTML und im FAQPage-JSON-LD. Desktop unverändert. */}
      {/* QM r2 (pixel-7): die automatische Silbentrennung trennte hier falsch („lösungsge-färbtes“,
          „Entflamm-barkeit“) – die FAQ-Antworten (linksbündig, Flattersatz) brechen nur an Wortgrenzen. */}
      <div className={`[&_:is(p,dd,li)]:hyphens-manual ${styles.fitFaq}`}>
        <FaqSection faq={faq} mobileMoreLabel={t.faqMore} spacingClassName="py-10 md:py-section" />
      </div>

      <LandingClosing
        heading={cta.heading}
        text={cta.text}
        primaryLabel={termin.label}
        secondary={{ href: mailHref, label: l("mail") }}
        showPhone
        // r8-leads (ux P1-3): the closing CTA keeps ?thema=yacht like the hero.
        appointmentHref={termin.href}
        write={termin.write}
      />
    </div>
  );
}
