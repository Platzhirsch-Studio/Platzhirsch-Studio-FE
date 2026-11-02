// src/components/Kuechengeraete/KuechengeraetePage.js
// /<locale>/kuechengeraete – „Geräte, die wir einplanen“ (Inhaber-Entscheidung
// Nr. 18, 30.10.2026). Kuratiert, eingebettet in die Küchenplanung, ohne
// Preise und ohne Shop.
//
// Inhaber-Entscheidung Nr. 24 (31.10.2026, ersetzt die Einschränkung aus
// Nr. 18): Platzhirsch ist Händler der sechs Marken, Herstellerbilder sind
// freigegeben. Der Händlersatz kommt NUR aus dem Claim-Register
// (dealerStatementList im Auftakt, dealerStatement je Karte) – nie selbst
// formulieren (ESLint-Regel, tests/unit/kuechengeraete.test.mjs). Keine Logos,
// keine Preise, keine Aussage, dass die Geräte im Showroom stehen.
// Herstellerbild je Markenkarte optional (marke.image, sonst nur Typografie):
// unverändert, object-contain, data-pin-nopin; Quellen in
// docs/bildquellen/QUELLEN-kueche.md. Das LCP-Element bleibt die H1 (Bilder erst
// in den Karten, lazy). Server-Komponente ohne Insel: kein Client-JS außer der
// vorhandenen Shell.
// Texte: geraeteText() (Messages kuechengeraete.*, sonst geraeteCopy.js).
// Daten: src/lib/kueche/geraete.js. CTAs:
//   „In meine Küchenplanung aufnehmen“ → /de/kuechenplaner?geraet=<id> (Planer nur
//     Deutsch; in EN/FR/IT mit hreflang="de" und Sprachhinweis im Linktext)
//   „Beratung anfragen“ → Anfrageformular (schreibenHref, immer /beratung der
//     Sprache) mit ?thema=kueche&produkt=<Marke>; dasselbe Wort führt nie zu
//     zwei Zielen (src/lib/forms/terminLink.js).
import Image from "next/image";
import { useTranslations } from "next-intl";
import JsonLd from "@/components/Reusable/JsonLd";
import { Breadcrumbs, Button, CTABand, Eyebrow, Heading, Lead, LinkArrow, Section, cx } from "@/components/ui";
import { schreibenHref } from "@/lib/forms/terminLink";
import { dealerStatement, dealerStatementList } from "@/lib/legal/claims";
import { brandNodeId } from "@/lib/seo/brandSchema";
import SeoFaq from "@/components/Reusable/SeoFaq";
import { localeUrl } from "@/lib/seo/pageMetadata";
import { GERAETE_MARKEN, GERAETE_PATH, beratungContext, geraetAnchor, geraetKey, planerHref } from "@/lib/kueche/geraete";
import { geraeteText } from "./geraeteCopy";
// Herstellerkatalog (Inhaber Nr. 24): „Sortiment ansehen“ je Markenkarte, erst sichtbar mit Produkten.
import KatalogMarkenLink from "@/components/Katalog/KatalogMarkenLink";
import AusgewaehlteProdukte from "@/components/Katalog/AusgewaehlteProdukte";
import { katalogBild } from "@/lib/kueche/katalogBild";
// Motion 01.11.2026: Reveal je Karte/Spalte, Link-Übergänge (nur gemeinsame Tokens).
import { LINK_EASE, staggerStyle } from "@/components/Landing/motionLanding";
import { ARROW_INLINE, H1_FIT, PAGE_HY, fitHeading } from "@/components/Landing/typoLanding";
import { softHyphenate } from "@/components/Landing/silben";

/** JSON-LD: WebPage mit einer ItemList der Marken als `Brand` – kein Product, kein Offer, kein seller. */
export function geraeteSchema(locale, tx) {
  const url = localeUrl(locale, GERAETE_PATH);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: tx("title"),
    description: tx("meta.description"),
    inLanguage: locale === "de" ? "de-AT" : locale,
    mainEntity: {
      "@type": "ItemList",
      "@id": `${url}#marken`,
      name: tx("schemaName"),
      numberOfItems: GERAETE_MARKEN.length,
      itemListElement: GERAETE_MARKEN.map((m, i) => ({
        "@type": "ListItem",
        position: i + 1,
        // @id wie im Organization-Schema (DEALER_ONLY_BRANDS, src/lib/seo/siteSchema.js) → eine Entität.
        item: { "@type": "Brand", "@id": brandNodeId(m.id), name: m.name },
      })),
    },
  };
}

/** Link in den Küchenplaner – seit der Sprach-Integration (01.11.2026) in der Seitensprache. */
function PlanerLink({ locale, tx, marke, as = "link", className }) {
  const href = planerHref(marke?.id);
  const content = (
    <>
      {tx("planerCta")}
      {marke && <span className="sr-only">: {marke.name}</span>}
    </>
  );
  const props = { href, locale, "data-geraet-planer": marke?.id || "" };
  if (as === "button") {
    return (
      <Button {...props} variant="primary" arrow className={className}>
        {content}
      </Button>
    );
  }
  return (
    <LinkArrow {...props} className={className}>
      {content}
    </LinkArrow>
  );
}

/**
 * Bild einer Markenkarte: eigenes Bild (marke.image, Alt aus den Texten) oder –
 * Inhaber 31.10.2026, „alle Vorschaubilder gleich groß“ – ein Bild aus dem
 * Herstellerkatalog (marke.katalogBild, Alt aus dem Katalog). Sonst null.
 */
export function markenBild(marke, locale, tx) {
  if (marke.image) return { ...marke.image, alt: tx(`alt.${geraetKey(marke.id)}`) };
  return katalogBild(marke, locale);
}

/**
 * Herstellerbild unverändert (object-contain, nichts beschnitten) in einem für
 * alle Karten gleichen 4:3-Rahmen auf ruhiger Fläche – das Raster bleibt ruhig,
 * egal ob das Bild hoch oder quer ist (Inhaber 31.10.2026).
 */
function BrandImage({ image, caption }) {
  return (
    <figure className="mb-6" data-geraet-bild="">
      <div className="relative flex aspect-4/3 w-full items-center justify-center overflow-hidden bg-linen">
        <Image
          src={image.src}
          width={image.width}
          height={image.height}
          alt={image.alt}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          quality={75}
          // QM R1: gleiches Passepartout für alle Marken – vorher randabfallend (Gaggenau, Miele)
          // neben Bildern mit Balken (V-ZUG, Liebherr). Bild unverändert, nur Abstand im Rahmen.
          className="block h-full w-full object-contain p-[5%] mix-blend-multiply" // QM R3: weißer Grund (V-ZUG) verschmilzt mit dem Leinenton
          data-pin-nopin="true" // Herstellerbild: nicht für Pinterest
        />
      </div>
      <figcaption className="mt-2 text-small text-text-soft">{caption}</figcaption>
    </figure>
  );
}

function BrandCard({ marke, locale, tx, index = 0 }) {
  const anchor = geraetAnchor(marke.id);
  // Händlersatz nur aus dem Claim-Register (leer, solange die Marke dort fehlt).
  const dealerLine = dealerStatement(marke.id, locale);
  const key = geraetKey(marke.id);
  const bild = markenBild(marke, locale, tx);
  return (
    <li className="reveal flex flex-col border-b border-line py-8 sm:py-10" style={staggerStyle(index, 3)}>
      <article id={anchor} aria-labelledby={`${anchor}-title`} className="flex h-full scroll-mt-[88px] flex-col" data-geraet={marke.id}>
        {bild && <BrandImage image={bild} caption={tx("bildQuelle").replace("{marke}", marke.name)} />}
        <Heading id={`${anchor}-title`} level={3} size="display-m" className="text-balance">
          {fitHeading(marke.name)}
        </Heading>
        {/* QM R1 (Textzoom 200 %, Handy-Zoom): je Angabe eine umbrechende Zeile statt eines
            Zwei-Spalten-Rasters – die Werte („Backöfen“, „Deutschland“) wurden rechts
            abgeschnitten bzw. liefen in die Nachbarkarte. Ist kein Platz, rutscht der Wert unter
            die Bezeichnung. */}
        <p className="mt-stack-s max-w-measure text-body text-text-soft">{tx(`marke.${key}.text`)}</p>
        {/* QM R3: Angaben unter dem Fließtext – so beginnen die Texte einer Reihe auf gleicher Höhe (Liebherr ohne Herkunft). */}
        <dl className="mt-stack-s space-y-1 text-small">
          {marke.origin && (
            <div className="flex flex-wrap gap-x-4">
              <dt className="text-text-soft">{tx("herkunft")}</dt>
              <dd className="min-w-0 text-text md:hyphens-none">{softHyphenate(tx(`laender.${marke.origin}`))}</dd>
            </div>
          )}
          <div className="flex flex-wrap gap-x-4">
            <dt className="text-text-soft">{tx("gruppenLabel")}</dt>
            <dd className="min-w-0 text-text md:hyphens-none">{softHyphenate(marke.groups.map((g) => tx(`gruppen.${g}`)).join(" · "))}</dd>
          </div>
        </dl>
        {dealerLine && (
          <p className="mt-2 text-small text-text" data-geraet-haendler={marke.id}>
            {dealerLine}
          </p>
        )}
        <div className="mt-auto flex flex-col items-start pt-4">
          {/* QM R3: Pfeil am Textende, Abstand je Link (bei Textzoom verschmolzen „In meine Küchenplanung aufnehmen“ und „Sortiment ansehen“). */}
          <PlanerLink locale={locale} tx={tx} marke={marke} className={ARROW_INLINE} />
          <KatalogMarkenLink marke={marke.id} welt="kuechengeraete" className={ARROW_INLINE} />
          <LinkArrow href={schreibenHref(locale, { context: beratungContext(marke) })} className={ARROW_INLINE} data-geraet-beratung={marke.id}>
            {tx("beratungCta")}
            <span className="sr-only">: {marke.name}</span>
          </LinkArrow>
        </div>
      </article>
    </li>
  );
}

/**
 * @param {{locale: "de"|"en"|"fr"|"it"}} props
 */
export default function KuechengeraetePage({ locale }) {
  const t = useTranslations();
  const tx = (key) => geraeteText(locale, key, t);
  const de = locale === "de";
  const beratung = schreibenHref(locale, { context: beratungContext(null) });
  const crumbs = [
    { label: "Home", href: "/" },
    ...(de ? [{ label: tx("crumbKueche"), href: "/kuechen-vorarlberg" }] : []),
    { label: tx("crumb") },
  ];
  const steps = [1, 2, 3].map((n) => ({ n, title: tx(`ablauf.step${n}Title`), text: tx(`ablauf.step${n}Text`) }));
  // Händlersatz aller sechs Marken (Inhaber-Entscheidung Nr. 24) – nur aus dem Claim-Register.
  const dealerLine = dealerStatementList(GERAETE_MARKEN.map((m) => m.id), locale);

  return (
    <div className={PAGE_HY}>
      <JsonLd data={geraeteSchema(locale, tx)} />

      {/* Auftakt: typografisch, die H1 ist das LCP-Element. */}
      <Section tone="surface" spacing="none" labelledBy="geraete-title" className="pt-8 pb-12 md:pt-12 md:pb-16 lg:pt-16 lg:pb-20" data-geraete-hero="">
        <Breadcrumbs items={crumbs} schema className="[&_a]:min-h-11" />
        <div className="mt-4 grid grid-cols-1 gap-y-6 lg:mt-stack-m lg:grid-cols-12 lg:gap-x-8">
          <div className="lg:col-span-8">
            <Eyebrow>{tx("eyebrow")}</Eyebrow>
            <Heading id="geraete-title" level={1} size="display-l" className={cx("mt-stack-s max-w-[18ch] text-balance", H1_FIT)}>
              {fitHeading(tx("title"))}
            </Heading>
            <Lead tone="soft" className="mt-stack-m">
              {tx("lead")}
            </Lead>
            {dealerLine && (
              <p className="mt-stack-s max-w-measure text-body text-text" data-geraete-haendler="">
                {dealerLine}
              </p>
            )}
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:col-span-12">
            <PlanerLink locale={locale} tx={tx} as="button" />
            <Button href={beratung} variant="secondary" data-geraet-beratung="">
              {tx("beratungCta")}
            </Button>
          </div>
        </div>
        <nav aria-label={tx("jumpLabel")} className="mt-10 border-t border-line pt-4">
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {GERAETE_MARKEN.map((m) => (
              <li key={m.id}>
                <a
                  href={`#${geraetAnchor(m.id)}`}
                  className={`inline-flex min-h-11 items-center text-ui text-text underline decoration-line-strong underline-offset-4 hover:decoration-current ${LINK_EASE}`}
                >
                  {m.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Section>

      {/* Die sechs Marken – Name als Typografie, keine Logos; Herstellerbild, wo vorhanden. */}
      <Section tone="raised" spacing="compact" labelledBy="geraete-marken-title">
        <div className="max-w-text">
          <Eyebrow>{tx("marken.eyebrow")}</Eyebrow>
          <Heading id="geraete-marken-title" level={2} className="mt-stack-s">
            {fitHeading(tx("marken.title"))}
          </Heading>
          <p className="mt-stack-m max-w-measure text-body text-text-soft">{tx("marken.text")}</p>
        </div>
        <ul className="mt-10 grid grid-cols-1 border-t border-line @min-[40rem]/page:grid-cols-2 @min-[40rem]/page:gap-x-grid @5xl/page:grid-cols-3">
          {GERAETE_MARKEN.map((m, i) => (
            <BrandCard key={m.id} marke={m} locale={locale} tx={tx} index={i} />
          ))}
        </ul>
      </Section>

      {/* Ausgewählte Produkte aus dem Herstellerkatalog (K16, zentral in src/lib/katalog/index.js AUSGEWAEHLT). */}
      <AusgewaehlteProdukte locale={locale} welt="kuechengeraete" />

      {/* So planen wir Geräte ein – Hand, 3D, Lieferung und Montage. */}
      <Section tone="band" spacing="compact" labelledBy="geraete-ablauf-title">
        <div className="max-w-text">
          <Eyebrow>{tx("ablauf.eyebrow")}</Eyebrow>
          <Heading id="geraete-ablauf-title" level={2} className="mt-stack-s">
            {fitHeading(tx("ablauf.title"))}
          </Heading>
        </div>
        <ol className="mt-10 grid grid-cols-1 border-t border-line @3xl/page:grid-cols-3 @3xl/page:gap-x-grid">
          {steps.map((s, index) => (
            <li key={s.n} className="reveal border-b border-line py-6" style={staggerStyle(index, 3)}>
              <h3 className="text-title text-text">
                <span aria-hidden="true" className="mb-1 block text-small tabular text-text-soft">
                  {String(s.n).padStart(2, "0")}
                </span>
                {fitHeading(s.title)}
              </h3>
              <p className="mt-2 max-w-measure text-body text-text-soft">{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-stack-m max-w-measure text-body text-text">{tx("ablauf.kueche")}</p>
        <p className="mt-stack-s max-w-measure text-body text-text" data-geraete-tausch>{tx("ablauf.tausch")}</p>
        <p className="mt-stack-s max-w-measure text-body text-text" data-geraete-schauraum>{tx("ablauf.schauraum")}</p>
        {/* Sprach-Integration 01.11.2026: Küchen-Seite in allen vier Sprachen. */}
        <LinkArrow href="/kuechen-vorarlberg" className="mt-2">
          {tx("ablauf.kuecheLink")}
        </LinkArrow>
        {/* Bad & Wellness (Inhaber-Entscheidungen Nr. 20/21): Dornbracht-Armaturen auch für die
            Küche – nur ein neutraler Satz mit Link, kein Bild (Seite in allen vier Sprachen). */}
        <p className="mt-stack-s max-w-measure text-body text-text" data-geraete-armaturen>{tx("ablauf.armaturen")}</p>
        <LinkArrow href="/bad-wellness#marke-dornbracht" className="mt-2">
          {tx("ablauf.armaturenLink")}
        </LinkArrow>
      </Section>

      {/* Gut zu wissen: Herstellerpreise nur zur Orientierung (QM R1), Markenhinweis. */}
      <Section tone="surface" spacing="compact" labelledBy="geraete-hinweis-title">
        {/* Optik-QA: linksbündig im Seitenraster (vorher eingerückte Textspalte, die aus der Flucht fiel). */}
        <div className="max-w-text">
          <h2 id="geraete-hinweis-title" className="text-title text-text">
            {fitHeading(tx("hinweis.title"))}
          </h2>
          <p className="mt-2 text-body text-text-soft">{tx("hinweis.preiseKatalog")}</p>
          <p className={cx("mt-2 text-small text-text-soft")}>{tx("hinweis.marken")}</p>
        </div>
      </Section>

      {/* SEO-Team A (GEO W5): FAQ + FAQPage. */}
      <SeoFaq locale={locale} page="kuechengeraete" pageUrl={localeUrl(locale, GERAETE_PATH)} flush />

      <CTABand id="geraete-cta-title" title={tx("closing.title")} text={tx("closing.text")} primary={{ href: beratung, label: tx("beratungCta") }} />
    </div>
  );
}
