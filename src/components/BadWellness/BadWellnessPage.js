// src/components/BadWellness/BadWellnessPage.js
// /<locale>/bad-wellness – „Bad & Wellness – geplant wie ein Raum“
// (Inhaber-Entscheidungen Nr. 19, 20, 21 und 23 vom 31.10.2026).
//
// Aufbau: Auftakt (H1, Lead, Händler-Satz, Bild Starpool als LCP) →
// Einstieg nach Wunsch (6 Szenarien) → Bad (Agape, Dornbracht, antoniolupi) →
// Wellness (Starpool, Soleum, Fabio Alemanno, Aquavia Spa, Naggura) →
// Whirlpool (Aquavia Spa) + Außensauna (Starpool, Soleum), Texte badWellnessHub.js →
// Ablauf (Gespräch → Handzeichnung → 3D → Lieferung/Montage mit Gewerken) →
// Verbindungen (Ezarri-Pool, Outdoor, Hotel & Objekt, Yacht) → Gut zu wissen → CTA.
//
// Regeln: Händleraussage nur für Marken mit `dealer: true` (src/lib/wellness/
// marken.js), nie für Agape. Keine Preise, keine Kaufknöpfe, keine
// Showroom-Aussage, keine Wirkversprechen. Herstellerbilder unverändert
// (object-contain, Rahmen folgt dem Bildformat, kein Beschnitt), Quelle je
// Bild in docs/bildquellen/QUELLEN.md, data-pin-nopin an jedem Bild
// (Herstellerbild, nicht für Pinterest), kein PinterestSave.
// Server-Komponente ohne Insel. Texte: bwText() (Messages badWellness.*, sonst
// badWellnessCopy.js). CTA „Beratung anfragen“ → schreibenHref (immer das
// Anfrageformular der Sprache) mit ?thema=…&produkt=<Marke>.
import Image from "next/image";
import { useTranslations } from "next-intl";
import JsonLd from "@/components/Reusable/JsonLd";
import { Breadcrumbs, Button, CTABand, Eyebrow, Heading, Lead, LinkArrow, Section, cx } from "@/components/ui";
import { schreibenHref } from "@/lib/forms/terminLink";
import { localeUrl } from "@/lib/seo/pageMetadata";
import { brandNodeId } from "@/lib/seo/brandSchema";
import { ROUTES } from "@/utils/routing";
import { dealerStatement, dealerStatementList } from "@/lib/legal/claims";
import {
  ALLE_MARKEN,
  BAD_MARKEN,
  BAD_WELLNESS_PATH,
  DEALER_MARKEN,
  HERO_IMAGE,
  SZENARIEN,
  WELLNESS_MARKEN,
  beratungContext,
  markeAnchor,
  markeById,
  markeKey,
} from "@/lib/wellness/marken";
import { bwText } from "./badWellnessCopy";
// Lokal-SEO (31.10.2026): H1, Whirlpool-/Außensauna-Abschnitt und FAQ.
import { hubText } from "./badWellnessHub";
import { markePath } from "@/lib/katalog/welten";
import SeoFaq from "@/components/Reusable/SeoFaq";
// Herstellerkatalog (31.10.2026): Link je Markenkarte + „Ausgewählte Produkte“.
import KatalogMarkenLink from "@/components/Katalog/KatalogMarkenLink";
import AusgewaehlteProdukte from "@/components/Katalog/AusgewaehlteProdukte";
import { brandCell, reihenSpan } from "./brandFrame";
// Motion 01.11.2026: Reveal je Karte/Spalte, Link-Übergänge (nur gemeinsame Tokens).
import { LINK_EASE, staggerStyle } from "@/components/Landing/motionLanding";
import { ARROW_INLINE, H1_FIT, PAGE_HY, fitHeading } from "@/components/Landing/typoLanding";
import { softHyphenate } from "@/components/Landing/silben";

// Ziele außerhalb der Seite: in welchen Sprachen es sie gibt, und wohin
// die übrigen Sprachen fallen (wie deOnlyRedirects.cjs / hotel-objekt).
const LINKS = {
  // Sprach-Integration 01.11.2026: Ezarri-Welt, Outdoor und Yacht viersprachig.
  pool: { href: "/ezarri/pool", langs: ["de", "en", "fr", "it"], fallback: "de" },
  mosaik: { href: "/ezarri/mosaike", langs: ["de", "en", "fr", "it"], fallback: "de" },
  outdoor: { href: "/outdoor-gartenplanung", langs: ["de", "en", "fr", "it"], fallback: "de" },
  // Hotel & Objekt seit 01.11.2026 in allen vier Sprachen (Inhaber).
  hotel: { href: "/hotel-objekt", langs: ["de", "en", "fr", "it"], fallback: "de" },
  yacht: { href: "/yacht-interior", langs: ["de", "en", "fr", "it"], fallback: "de" },
  kueche: { href: "/kuechengeraete", langs: ["de", "en", "fr", "it"], fallback: "de" },
  // Ratgeber nur auf Deutsch (EN/FR/IT: 404, src/proxy.js FOREIGN_GATED_404).
  whirlpoolRatgeber: { href: "/ratgeber/whirlpool-swimspa-garten-planen", langs: ["de"], fallback: "de" },
  saunaRatgeber: { href: "/ratgeber/sauna-zuhause-planen", langs: ["de"], fallback: "de" },
};

/** Abschnitte „Whirlpool in Vorarlberg“ (Aquavia Spa) und „Außensauna“ (Starpool, Soleum). */
export const HUB_ABSCHNITTE = Object.freeze([
  Object.freeze({ id: "whirlpool", marken: Object.freeze([{ slug: "aquavia-spa", label: "markeLink" }]), ratgeber: "whirlpoolRatgeber" }),
  Object.freeze({
    id: "sauna",
    marken: Object.freeze([
      { slug: "starpool", label: "starpoolLink" },
      { slug: "soleum", label: "soleumLink" },
    ]),
    ratgeber: "saunaRatgeber",
  }),
]);

const HUB_NAMES = { "aquavia-spa": "Aquavia Spa", starpool: "Starpool", soleum: "Soleum" };

/** Link-Props für ein Ziel: eigene Sprache, sonst Rückfall mit hreflang und Sprachhinweis. */
function target(key, locale, tx) {
  const l = LINKS[key];
  if (l.langs.includes(locale)) return { href: l.href, suffix: "" };
  return {
    href: l.href,
    locale: l.fallback,
    hrefLang: l.fallback,
    suffix: ` (${tx(l.fallback === "en" ? "english" : "german")})`,
  };
}

/** JSON-LD: WebPage mit ItemList der Marken als `Brand` – kein Product, kein Offer, kein Preis. */
export function badWellnessSchema(locale, tx) {
  const url = localeUrl(locale, BAD_WELLNESS_PATH);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: hubText(locale, "title"),
    description: hubText(locale, "meta.description"),
    inLanguage: locale === "de" ? "de-AT" : locale,
    mainEntity: {
      "@type": "ItemList",
      "@id": `${url}#marken`,
      name: tx("schemaName"),
      numberOfItems: ALLE_MARKEN.length,
      itemListElement: ALLE_MARKEN.map((m, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: { "@type": "Brand", "@id": brandNodeId(m.id), name: m.name },
      })),
    },
  };
}

/** Herstellerbild unverändert: Rahmen folgt dem Bildformat, nichts wird beschnitten. */
function BrandImage({ image, alt, caption, sizes, preload = false, className = "" }) {
  return (
    <figure className={`flex flex-col items-start ${className}`}>
      <div className="w-full bg-linen">
        <Image
          src={image.src}
          width={image.width}
          height={image.height}
          alt={alt}
          sizes={sizes}
          preload={preload || undefined}
          quality={75}
          // CLS (Optik-QA 01.11.2026, pixel-7 0,026): `w-auto` hob das width-Attribut auf –
          // vor dem Laden 0 px hoch, Sprungnavigation und Bildquelle rutschten nach.
          // `w-full h-auto` hält das Format frei; object-contain zeigt das Bild unverändert.
          className="block h-auto max-h-[26rem] w-full object-contain"
          data-pin-nopin="true" // Herstellerbild: nicht für Pinterest
        />
      </div>
      <figcaption className="mt-2 text-small text-text-soft">{caption}</figcaption>
    </figure>
  );
}

/**
 * Markenkarte (Inhaber 31.10.2026, „alle Vorschaubilder gleich groß“): ein für
 * alle Karten gleicher 4:3-Rahmen auf ruhiger Fläche, Herstellerbilder darin
 * unverändert (object-contain). Mehrere Motive einer Marke (moreImages) stehen
 * nebeneinander im selben Rahmen – die Karte wird dadurch nicht höher.
 */
function BrandFrame({ images, caption, sizes }) {
  const multi = images.length > 1;
  return (
    <figure className="mb-6" data-bw-bild="">
      {/* QM R3: mehrere Motive gleich hoch nebeneinander (flex-grow = Seitenverhältnis) statt
          zwei halber Zellen mit object-contain – Hoch- neben Querformat stand sonst versetzt. */}
      {/* QM R1: gleiches Passepartout (p-[5%]) für alle Marken – vorher randlos (Fabio Alemanno)
          neben Bildern mit Balken (Starpool, Soleum, Agape). Bilder unverändert. */}
      <div className={multi ? "flex aspect-4/3 w-full items-center gap-2 overflow-hidden bg-linen p-[5%]" : "grid aspect-4/3 w-full grid-cols-1 grid-rows-1 overflow-hidden bg-linen p-[5%]"}>
        {images.map((image) => (
          <div
            key={image.src}
            className="relative flex min-h-0 min-w-0 items-center justify-center"
            style={multi ? brandCell(image) : undefined}
            data-bw-zelle=""
          >
            <Image
              src={image.src}
              width={image.width}
              height={image.height}
              alt={image.alt}
              sizes={sizes}
              quality={75}
              className="block h-full w-full object-contain mix-blend-multiply" // QM R3: weißer Bildgrund (Aquavia) verschmilzt mit dem Leinenton statt als harte Box
              data-pin-nopin="true" // Herstellerbild: nicht für Pinterest
            />
          </div>
        ))}
      </div>
      <figcaption className="mt-2 text-small text-text-soft">{caption}</figcaption>
    </figure>
  );
}

function BrandCard({ marke, locale, tx, index = 0, className = "" }) {
  const anchor = markeAnchor(marke.id);
  const key = markeKey(marke.id);
  // Händler-Satz nur aus dem Claim-Register (leer, solange die Marke dort fehlt); Agape nie.
  const dealerLine = marke.dealer ? dealerStatement(marke.name, locale) : "";
  const brandPage = marke.brandPage ? marke.brandPage.replace("/ueber-uns/marken", (ROUTES.marken && ROUTES.marken[locale]) || "/ueber-uns/marken") : null;
  return (
    <li className={`reveal flex flex-col border-b border-line py-8 sm:py-10 ${className}`} style={staggerStyle(index, 3)}>
      <article id={anchor} aria-labelledby={`${anchor}-title`} className="flex h-full scroll-mt-[88px] flex-col" data-bw-marke={marke.id}>
        {/* Hauptbild + weitere Motive derselben Marke (Alt-Text alt.<marke>, alt.<marke>2 …) in einem Rahmen. */}
        {marke.image && (
          <BrandFrame
            images={[
              { ...marke.image, alt: marke.image.alt?.[locale] || marke.image.alt?.de || tx(`alt.${key}`) },
              ...(marke.moreImages || []).map((image, i) => ({ ...image, alt: tx(`alt.${key}${i + 2}`) })),
            ]}
            caption={tx("bildQuelle").replace("{marke}", marke.name)}
            // Mehrfach-Rahmen: das Querformat bekommt ~65 % der Kartenbreite (brandFrame.js).
            sizes={marke.moreImages?.length ? "(min-width: 1024px) 20vw, (min-width: 640px) 30vw, 65vw" : "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"}
          />
        )}
        <Heading id={`${anchor}-title`} level={3} size="display-m" className="text-balance">
          {fitHeading(marke.name)}
        </Heading>
        {/* QM R1 (Textzoom 200 %): je Angabe eine umbrechende Zeile statt Zwei-Spalten-Raster –
            Werte liefen sonst in die Nachbarkarte bzw. wurden abgeschnitten. */}
        <p className="mt-stack-s max-w-measure text-body text-text-soft">{tx(`marke.${key}.text`)}</p>
        {/* QM R3: Angaben unter dem Fließtext – so beginnen die Texte einer Reihe auf gleicher Höhe (Liebherr ohne Herkunft). */}
        <dl className="mt-stack-s space-y-1 text-small">
          <div className="flex flex-wrap gap-x-4">
            <dt className="text-text-soft">{tx(marke.originIsDesign ? "design" : "herkunft")}</dt>
            <dd className="min-w-0 text-text md:hyphens-none">{softHyphenate(tx(`laender.${marke.origin}`))}</dd>
          </div>
          <div className="flex flex-wrap gap-x-4">
            <dt className="text-text-soft">{tx("gruppenLabel")}</dt>
            <dd className="min-w-0 text-text md:hyphens-none">{softHyphenate(marke.groups.map((g) => tx(`gruppen.${g}`)).join(" · "))}</dd>
          </div>
        </dl>
        {dealerLine && (
          <p className="mt-2 text-small text-text" data-bw-dealer={marke.id}>
            {dealerLine}
          </p>
        )}
        <div className="mt-auto flex flex-col items-start pt-4">
          {brandPage && (
            <LinkArrow href={brandPage} className={ARROW_INLINE} data-bw-markenseite={marke.id}>
              {tx("bad.markenseite")}
              <span className="sr-only">: {marke.name}</span>
            </LinkArrow>
          )}
          <KatalogMarkenLink marke={marke.id} welt="bad-wellness" className={ARROW_INLINE} />
          {/* QM R3: Pfeil am Textende, Abstand je Link (bei Textzoom verschmolzen die Links). */}
          <LinkArrow href={schreibenHref(locale, { context: beratungContext(marke) })} className={ARROW_INLINE} data-bw-beratung={marke.id}>
            {tx("beratungCta")}
            <span className="sr-only">: {marke.name}</span>
          </LinkArrow>
        </div>
      </article>
    </li>
  );
}

function TargetLink({ name, locale, tx, label, className }) {
  const { suffix, ...props } = target(name, locale, tx);
  return (
    <LinkArrow {...props} className={className} data-bw-link={name}>
      {label}
      {suffix}
    </LinkArrow>
  );
}

/**
 * @param {{locale: "de"|"en"|"fr"|"it"}} props
 */
export default function BadWellnessPage({ locale }) {
  const t = useTranslations();
  const tx = (key) => bwText(locale, key, t);
  const beratung = schreibenHref(locale, { context: beratungContext(null) });
  const crumbs = [{ label: "Home", href: "/" }, { label: tx("crumb") }];
  const steps = [1, 2, 3, 4].map((n) => ({ n, title: tx(`ablauf.step${n}Title`), text: tx(`ablauf.step${n}Text`) }));
  const verbindungen = ["pool", "outdoor", "hotel", "yacht"];

  return (
    <div className={PAGE_HY}>
      <JsonLd data={badWellnessSchema(locale, tx)} />

      {/* Auftakt: Text links, Herstellerbild rechts (LCP, preload). */}
      <Section tone="surface" spacing="none" labelledBy="bw-title" className="pt-8 pb-12 md:pt-12 md:pb-16 lg:pt-16 lg:pb-20" data-bw-hero="">
        <Breadcrumbs items={crumbs} schema className="[&_a]:min-h-11" />
        <div className="mt-4 grid grid-cols-1 gap-y-8 lg:mt-stack-m lg:grid-cols-12 lg:gap-x-8">
          <div className="lg:col-span-6">
            <Eyebrow>{tx("eyebrow")}</Eyebrow>
            <Heading id="bw-title" level={1} size="display-l" className={cx("mt-stack-s max-w-[18ch] text-balance", H1_FIT)}>
              {fitHeading(hubText(locale, "title"))}
            </Heading>
            <Lead tone="soft" className="mt-stack-m">
              {tx("lead")}
            </Lead>
            <p className="mt-stack-s max-w-measure text-body text-text" data-bw-leistung="">
              {[dealerStatementList(DEALER_MARKEN, locale), tx("leistung")].filter(Boolean).join(" ")}
            </p>
            <div className="mt-stack-m flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button href={beratung} variant="primary" arrow data-bw-beratung="">
                {tx("beratungCta")}
              </Button>
            </div>
          </div>
          <BrandImage
            image={HERO_IMAGE}
            alt={tx("alt.hero")}
            caption={tx("bildQuelle").replace("{marke}", "Starpool")}
            sizes="(min-width: 1024px) 45vw, 100vw"
            preload
            className="lg:col-span-6 lg:self-center"
          />
        </div>
        <nav aria-label={tx("jumpLabel")} className="mt-10 border-t border-line pt-4">
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {ALLE_MARKEN.map((m) => (
              <li key={m.id}>
                <a
                  href={`#${markeAnchor(m.id)}`}
                  className={`inline-flex min-h-11 items-center text-ui text-text underline decoration-line-strong underline-offset-4 hover:decoration-current ${LINK_EASE}`}
                >
                  {m.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Section>

      {/* Einstieg nach Wunsch. */}
      <Section tone="raised" spacing="compact" labelledBy="bw-einstieg-title">
        <div className="max-w-text">
          <Eyebrow>{tx("einstieg.eyebrow")}</Eyebrow>
          <Heading id="bw-einstieg-title" level={2} className="mt-stack-s">
            {fitHeading(tx("einstieg.title"))}
          </Heading>
        </div>
        <ul className="mt-10 grid grid-cols-1 border-t border-line @min-[40rem]/page:grid-cols-2 @min-[40rem]/page:gap-x-grid @5xl/page:grid-cols-3">
          {SZENARIEN.map((s, index) => {
            const title = tx(`einstieg.szenario.${s.id}.title`);
            return (
              <li key={s.id} className="reveal flex flex-col border-b border-line py-6" style={staggerStyle(index, 3)} data-bw-szenario={s.id}>
                <h3 className="text-title text-text">{fitHeading(title)}</h3>
                <p className="mt-2 max-w-measure text-body text-text-soft">{tx(`einstieg.szenario.${s.id}.text`)}</p>
                <p className="mt-3 text-small text-text-soft">
                  <span>{tx("einstieg.marken")}: </span>
                  {s.marken.map((id, i) => (
                    <span key={id}>
                      {i > 0 && " · "}
                      <a href={`#${markeAnchor(id)}`} className={`text-text underline decoration-line-strong underline-offset-4 hover:decoration-current ${LINK_EASE}`}>
                        {markeById(id)?.name}
                      </a>
                    </span>
                  ))}
                </p>
                <div className="mt-auto pt-3">
                  <LinkArrow href={schreibenHref(locale, { context: beratungContext(null, s.thema) })} data-bw-beratung={s.id}>
                    {tx("beratungCta")}
                    <span className="sr-only">: {title}</span>
                  </LinkArrow>
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* Bad – das tägliche Ritual. */}
      <Section tone="surface" spacing="compact" labelledBy="bw-bad-title">
        <div className="max-w-text">
          <Eyebrow>{tx("bad.eyebrow")}</Eyebrow>
          <Heading id="bw-bad-title" level={2} className="mt-stack-s">
            {fitHeading(tx("bad.title"))}
          </Heading>
          <p className="mt-stack-m max-w-measure text-body text-text-soft">{tx("bad.text")}</p>
        </div>
        {/* QM R1: drei Marken ab md in einer Reihe – zweispaltig stand antoniolupi allein (Handy quer). */}
        <ul className="mt-10 grid grid-cols-1 border-t border-line @3xl/page:grid-cols-3 @3xl/page:gap-x-grid">
          {BAD_MARKEN.map((m, i) => (
            <BrandCard key={m.id} marke={m} locale={locale} tx={tx} index={i} />
          ))}
        </ul>
        <div className="mt-stack-m grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-x-grid">
          <div>
            <p className="max-w-measure text-body text-text">{tx("bad.mosaik")}</p>
            <TargetLink name="mosaik" locale={locale} tx={tx} label={tx("bad.mosaikLink")} className="mt-2" />
          </div>
          <div>
            <p className="max-w-measure text-body text-text">{tx("bad.kueche")}</p>
            <TargetLink name="kueche" locale={locale} tx={tx} label={tx("bad.kuecheLink")} className="mt-2" />
          </div>
        </div>
      </Section>

      {/* Wellness & Spa. */}
      <Section tone="raised" spacing="compact" labelledBy="bw-wellness-title">
        <div className="max-w-text">
          <Eyebrow>{tx("wellness.eyebrow")}</Eyebrow>
          <Heading id="bw-wellness-title" level={2} className="mt-stack-s">
            {fitHeading(tx("wellness.title"))}
          </Heading>
          <p className="mt-stack-m max-w-measure text-body text-text-soft">{tx("wellness.text")}</p>
        </div>
        {/* QM R4: 6 Spuren statt 3 – bei fünf Marken füllen die letzten zwei die Reihe (reihenSpan). */}
        <ul className="mt-10 grid grid-cols-1 border-t border-line @min-[40rem]/page:grid-cols-2 @min-[40rem]/page:gap-x-grid @5xl/page:grid-cols-6">
          {WELLNESS_MARKEN.map((m, i) => (
            <BrandCard key={m.id} marke={m} locale={locale} tx={tx} index={i} className={reihenSpan(i, WELLNESS_MARKEN.length)} />
          ))}
        </ul>
      </Section>

      {/* Whirlpool (Aquavia Spa) und Außensauna (Starpool, Soleum): Fakten aus dem Katalog, Händlersatz nur aus dem Claim-Guard. */}
      <Section tone="surface" spacing="compact" labelledBy="bw-whirlpool-title" data-bw-hub="">
        <div className="grid grid-cols-1 gap-y-12 md:grid-cols-2 md:gap-x-grid">
          {HUB_ABSCHNITTE.map((a) => (
            <div key={a.id} data-bw-abschnitt={a.id}>
              <Heading id={`bw-${a.id}-title`} level={2}>
                {fitHeading(hubText(locale, `${a.id}.title`))}
              </Heading>
              <p className="mt-stack-m max-w-measure text-body text-text-soft">{hubText(locale, `${a.id}.text`)}</p>
              <p className="mt-stack-s max-w-measure text-body text-text">
                {[hubText(locale, `${a.id}.planung`), dealerStatementList(a.marken.map((m) => HUB_NAMES[m.slug]), locale)].filter(Boolean).join(" ")}
              </p>
              <div className="mt-4 flex flex-col items-start">
                {a.marken.map((m) => (
                  <LinkArrow key={m.slug} href={markePath("bad-wellness", m.slug)} className={ARROW_INLINE} data-bw-hub-marke={m.slug}>
                    {hubText(locale, `${a.id}.${m.label}`)}
                  </LinkArrow>
                ))}
                <TargetLink name={a.ratgeber} locale={locale} tx={tx} label={hubText(locale, `${a.id}.ratgeberLink`)} className={ARROW_INLINE} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Ausgewählte Produkte aus dem Herstellerkatalog (nichts, solange leer). */}
      <AusgewaehlteProdukte locale={locale} welt="bad-wellness" />

      {/* Ablauf. */}
      <Section tone="band" spacing="compact" labelledBy="bw-ablauf-title">
        <div className="max-w-text">
          <Eyebrow>{tx("ablauf.eyebrow")}</Eyebrow>
          <Heading id="bw-ablauf-title" level={2} className="mt-stack-s">
            {fitHeading(tx("ablauf.title"))}
          </Heading>
        </div>
        <ol className="mt-10 grid grid-cols-1 border-t border-line @3xl/page:grid-cols-2 @3xl/page:gap-x-grid @5xl/page:grid-cols-4">
          {steps.map((s, index) => (
            <li key={s.n} className="reveal border-b border-line py-6" style={staggerStyle(index, 4)}>
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
      </Section>

      {/* Verbindungen: Pool/Ezarri, Outdoor, Hotel & Objekt, Yacht. */}
      <Section tone="surface" spacing="compact" labelledBy="bw-verbindungen-title">
        <div className="max-w-text">
          <Eyebrow>{tx("verbindungen.eyebrow")}</Eyebrow>
          <Heading id="bw-verbindungen-title" level={2} className="mt-stack-s">
            {fitHeading(tx("verbindungen.title"))}
          </Heading>
        </div>
        <ul className="mt-10 grid grid-cols-1 border-t border-line @min-[40rem]/page:grid-cols-2 @min-[40rem]/page:gap-x-grid @5xl/page:grid-cols-4">
          {verbindungen.map((v, index) => (
            <li key={v} className="reveal flex flex-col border-b border-line py-6" style={staggerStyle(index, 4)}>
              <h3 className="text-title text-text">{fitHeading(tx(`verbindungen.${v}.title`))}</h3>
              <p className="mt-2 text-body text-text-soft">{tx(`verbindungen.${v}.text`)}</p>
              <div className="mt-auto pt-3">
                <TargetLink name={v} locale={locale} tx={tx} label={tx(`verbindungen.${v}.link`)} />
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* Gut zu wissen. */}
      <Section tone="surface" spacing="compact" labelledBy="bw-hinweis-title">
        {/* Optik-QA: linksbündig im Seitenraster (vorher eingerückte Textspalte, die aus der Flucht fiel). */}
        <div className="max-w-text">
          <h2 id="bw-hinweis-title" className="text-title text-text">
            {fitHeading(tx("hinweis.title"))}
          </h2>
          <p className="mt-2 text-body text-text-soft">{tx("hinweis.preise")}</p>
          <p className="mt-2 text-body text-text-soft">{tx("hinweis.gesundheit")}</p>
          <p className="mt-2 text-small text-text-soft">{tx("hinweis.marken")}</p>
        </div>
      </Section>

      {/* FAQ + FAQPage (Lieferung, Standort, Elektro, Beratung) aus badWellnessHub.js; Händlersatz nur aus dem Claim-Guard. */}
      <SeoFaq locale={locale} page="badWellness" pageUrl={localeUrl(locale, BAD_WELLNESS_PATH)} title={hubText(locale, "faq.title")} items={hubText(locale, "faq.items")} vars={{ markenSatz: dealerStatementList(DEALER_MARKEN, locale) }} flush />

      <CTABand id="bw-cta-title" title={tx("closing.title")} text={tx("closing.text")} primary={{ href: beratung, label: tx("beratungCta") }} />
    </div>
  );
}
