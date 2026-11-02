// Brand index (/ueber-uns/marken, all four locales) – Neuauftritt.
// Server Component. Bibel §9 card-brand: the name set in type (Bodoni from
// 32 px), origin and year – no logo wall, no logo as a seal (§11, §14).
// Brands are "gezeigt" or "geplant", never "geführt" (Jury §3.4).
// Below the A–Z list two static groups without the backoffice
// (lib/marken/indexGroups.js): Bad & Wellness (manufacturer files unchanged,
// cropped to the frame in CSS only, not pinnable) and Küchengeräte (typographic until the data
// team delivers images; the tile takes an optional image). Dealer sentences
// only from the claim guard (dealerStatementList), never written here; Agape
// never gets one.
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs, CTABand, Container, Eyebrow, Heading, Lead, Leitsatz, LinkArrow, Section } from "@/components/ui";
import { ROUTES } from "@/utils/routing";
import { generateSlug } from "@/lib/slugify";
import { displayBrandName } from "@/lib/content/brands";
import { makeTr } from "@/components/MarkenItems/copy";
import { localizedCountry } from "@/components/MarkenItems/brandData";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { dealerStatementList } from "@/lib/legal/claims";
import { geraeteEntries, wellnessEntries } from "@/lib/marken/indexGroups";
import { GERAETE_MARKEN } from "@/lib/kueche/geraete";
import { katalogBild } from "@/lib/kueche/katalogBild";
import { softHyphens } from "@/components/UberUns/softHyphens";
import { spanEntry } from "@/components/ShopCatalog/gridSpan";

// QM wm-fix3: one size for every name in a grid (wm-fix2 made only names of
// 14+ characters smaller – 101 Copenhagen, Brand van Egmond and Fabio
// Alemanno then stood out). From two columns on all names are 32 px, the
// display-m minimum, where the longest name keeps one line even at 1280;
// display-m again from 1536 (wide columns). At 200 % text size long words
// are hyphenated instead of being cut off at the edge (WCAG 1.4.4).
// On phones the size is capped at 11vw (wm-fix4, 15vw still split "Copenha-gen",
// "ClassiCo-n" at 200 %): no effect at normal size (display-m
// is 32–34 px there), but at 200 % text size "Copenhagen" still fits the line.
// QM wm-r4: brand names are never hyphenated („Copen-hagen“, „Clas-siCon“ at
// 200 % read cheap) – the columns follow the page container instead, so a
// doubled text size gets fewer, wider columns; break-words stays the last
// resort. One size (2 rem) also at 1920 px, where display-m wrapped
// „Brand van Egmond“ onto two lines.
const NAME_SIZE = "min-w-0 break-words hyphens-manual max-sm:text-[length:min(var(--text-display-m),11vw)] sm:text-[2rem]";
// Columns of the name lists and tile groups (page container, rem-based).
const GRID_COLS = "grid-cols-1 @min-[40rem]/page:grid-cols-2 @min-[40rem]/page:gap-x-grid @5xl/page:grid-cols-3";

const LINK_TILE =
  "underline decoration-transparent decoration-1 underline-offset-8 transition-colors duration-(--duration-micro) hover:decoration-current focus-visible:decoration-current";

// QM wm-fix3: fitting the whole photo ("contain") left beige bars beside portrait/square photos
// (Agape, Dornbracht, V-ZUG …) and above wide ones (antoniolupi, BORA) – an
// uneven grid. Every tile now fills its 3:2 frame (object-cover). That is a
// crop in CSS only, the manufacturer file stays unchanged; for tall photos
// the focus point keeps the product in view.
const FOCUS = { agape: "object-[50%_78%]" };
// QM wm-r4: a cut-out on white (Aquavia Spa: the only manufacturer picture is
// a product shot) sits whole on the linen frame instead of a cropped white
// rectangle among room photos – same frame, same rhythm.
const CUTOUT = { "aquavia-spa": "object-contain p-[8%] mix-blend-multiply" };

/** Herstellerbild unverändert (Datei), im Rahmen bildfüllend beschnitten (CSS). */
function TileImage({ image, alt, id, wide = false }) {
  return (
    <div className={`relative mb-4 aspect-3/2 w-full overflow-hidden bg-linen ${wide ? "@5xl/page:aspect-[3/1]" : ""}`}>
      <Image
        src={image.src}
        width={image.width}
        height={image.height}
        alt={alt}
        sizes={wide ? "(min-width: 1024px) 62vw, (min-width: 640px) 45vw, 100vw" : "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"}
        quality={75}
        className={`absolute inset-0 size-full ${CUTOUT[id] || `object-cover ${FOCUS[id] || "object-center"}`}`}
        data-pin-nopin="true" // Herstellerbild: nicht für Pinterest
      />
    </div>
  );
}

/**
 * One static group (Bad & Wellness / Küchengeräte): tiles like the A–Z list,
 * the name is the link (stretched over the tile), image optional.
 */
function BrandGroup({ id, title, text, dealerLine, more, entries, meta, imageAlt, imageCredit }) {
  const hasImages = entries.some((b) => b.image);
  const wideId = hasImages ? spanEntry(entries, CUTOUT) : null;
  return (
    <Container as="section" aria-labelledby={`${id}-title`} className="pb-16 lg:pb-24" data-marken-gruppe={id}>
      <div className="grid grid-cols-1 gap-6 border-t border-line pt-10 @5xl/page:grid-cols-12 @5xl/page:gap-grid">
        <div className="@5xl/page:col-span-5">
          <Heading id={`${id}-title`} level={2}>
            {softHyphens(title)}
          </Heading>
        </div>
        <div className="flex flex-col items-start gap-3 @5xl/page:col-span-7">
          <p className="max-w-measure text-body text-text-soft">{text}</p>
          {dealerLine && (
            <p className="max-w-measure text-small text-text" data-marken-guard={id}>
              {dealerLine}
            </p>
          )}
          <LinkArrow href={more.href}>{more.label}</LinkArrow>
        </div>
      </div>
      <ul className={`mt-8 grid border-t border-line ${GRID_COLS}`}>
        {entries.map((b) => (
          <li
            key={b.id}
            className={`relative flex min-w-0 flex-col border-b border-line py-5 ${hasImages ? "" : "pr-4 sm:pr-8"} ${b.id === wideId ? "@5xl/page:col-span-2" : ""}`}
            data-marke={b.id}
          >
            {b.image ? (
              <TileImage image={b.image} alt={imageAlt(b)} id={b.id} wide={b.id === wideId} />
            ) : (
              // Same rhythm as the tiles with an image: an empty frame, the name stays on one line.
              hasImages && <div aria-hidden="true" className="mb-4 aspect-3/2 w-full bg-linen" />
            )}
            <Link
              href={b.href}
              className={`font-display text-display-m text-balance text-text after:absolute after:inset-0 ${LINK_TILE} ${NAME_SIZE}`}
            >
              {b.name}
            </Link>
            {meta(b).map((line, i) =>
              line ? (
                <span key={i} className="mt-1 text-small text-text-soft">
                  {line}
                </span>
              ) : null
            )}
          </li>
        ))}
      </ul>
      {imageCredit && hasImages && <p className="mt-4 text-small text-text-soft">{imageCredit}</p>}
    </Container>
  );
}

// H1 with the search term and the place, no showroom or dealer claim for
// every brand (the list also holds brands planned on request).
const H1 = {
  de: "Designmarken am Bodensee",
  en: "Design brands on Lake Constance",
  fr: "Marques de design au lac de Constance",
  it: "Marchi di design sul Lago di Costanza",
};

/**
 * @param {Array} marken  raw Marken doctype rows (fetchRawMarkenData)
 * @param {string} locale
 */
export default async function Marken({ marken = [], locale = "de" }) {
  const t = await getTranslations({ locale, namespace: "markenIndex" });
  const tr = makeTr(t, locale, "markenIndex");

  const markenPath = ROUTES.marken[locale] || ROUTES.marken.de;
  const brands = marken
    .filter((m) => m?.status === "Aktiv" && m?.name1)
    .map((m) => ({
      slug: generateSlug(m.name1),
      href: m.href || `${markenPath}/${generateSlug(m.name1)}`,
      name: displayBrandName(m.name1),
      country: localizedCountry(m.herkunftsland, locale),
      founded: m.grundungsjahr ? String(m.grundungsjahr) : "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: "base" }));

  const paragraphs = tr.raw("paragraphs") || [];

  // Static groups: labels for countries and product groups come from the
  // namespaces of the two pages (one text source), group texts from markenIndex.
  const tb = await getTranslations({ locale, namespace: "badWellness" });
  const tg = await getTranslations({ locale, namespace: "kuechengeraete" });
  const wellness = wellnessEntries(locale, { markenPath });
  // Inhaber 31.10.2026: Gerätemarken ohne eigenes Bild mit Katalogbild (gleicher Rahmen für alle).
  const geraete = geraeteEntries(locale).map((b) => {
    if (b.image) return b;
    const bild = katalogBild(GERAETE_MARKEN.find((m) => m.id === b.id), locale);
    return bild ? { ...b, image: bild, imageAlt: bild.alt } : b;
  });
  const country = (tx, code) => (code && tx.has(`laender.${code}`) ? tx(`laender.${code}`) : "");
  const wellnessMeta = (b) => [
    b.originIsDesign && country(tb, b.origin) ? `${tb("design")}: ${country(tb, b.origin)}` : country(tb, b.origin),
    b.groups.map((g) => tb(`gruppen.${g}`)).join("\u00a0· "),
    b.objektOnly ? tr("objektOnly") : "",
  ];
  const geraeteMeta = (b) => [country(tg, b.origin), b.groups.map((g) => tg(`gruppen.${g}`)).join("\u00a0· ")];

  return (
    <div className="bg-surface text-text">
      <Section spacing="none" labelledBy="marken-title" className="pt-8 pb-12 md:pt-12 md:pb-16">
        <Breadcrumbs
          items={[
            // Same home step as the JSON-LD of the page (lib/seo/breadcrumbs.js).
            { label: homeCrumbLabel(locale), href: "/" },
            { label: tr("title") },
          ]}
        />
        <div className="mt-8 grid grid-cols-1 gap-8 @5xl/page:mt-12 @5xl/page:grid-cols-12 @5xl/page:gap-grid">
          <div className="min-w-0 @5xl/page:col-span-7">
            <Eyebrow className="mb-stack-s">{tr("count", { count: brands.length })}</Eyebrow>
            {/* Runde 3 P5 (seo-tech P2): descriptive H1 instead of only "Marken". */}
            <Heading id="marken-title" level={1} className="break-words hyphens-manual max-sm:text-[length:min(var(--text-display-l),12vw)]">
              {softHyphens(H1[locale] || H1.de)}
            </Heading>
            <Lead className="mt-stack-m">{tr("lead")}</Lead>
          </div>
        </div>
      </Section>

      {/* Typographic index A–Z */}
      <Container as="section" aria-labelledby="marken-list-title" className="pb-16 lg:pb-24">
        <h2 id="marken-list-title" className="sr-only">
          {tr("listLabel")}
        </h2>
        <ul className={`grid border-t border-line ${GRID_COLS}`}>
          {brands.map((b) => (
            <li key={b.slug} className="min-w-0 border-b border-line">
              <Link
                href={b.href}
                className="flex h-full min-h-24 flex-col justify-center py-5 pr-4 sm:pr-8 underline decoration-transparent decoration-1 underline-offset-8 transition-colors duration-(--duration-micro) hover:decoration-current focus-visible:decoration-current"
              >
                {/* Long names (14+ characters, e.g. "Brand van Egmond", "101 Copenhagen" –
                    QM wm-fix2: at 14 it still wrapped on the 1280 laptop) one step smaller
                    from two columns on, so every row keeps one line and one
                    baseline (Abnahme Marken, Restliste 2; display-m minimum 32 px). */}
                <span className={`font-display text-display-m text-balance text-text ${NAME_SIZE}`}>
                  {b.name}
                </span>
                {(b.country || b.founded) && (
                  <span className="mt-1 text-small text-text-soft">
                    {[b.country, b.founded && tr("since", { year: b.founded })].filter(Boolean).join(" · ")}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      <BrandGroup
        id="marken-bad-wellness"
        title={tr("bwTitle")}
        text={tr("bwText")}
        dealerLine={dealerStatementList(wellness.filter((b) => b.dealer).map((b) => b.id), locale)}
        more={{ href: "/bad-wellness", label: tr("bwLink") }}
        entries={wellness}
        meta={wellnessMeta}
        imageAlt={(b) => (tb.has(`alt.${b.key}`) ? tb(`alt.${b.key}`) : b.name)}
        imageCredit={tr("imageCredit")}
      />

      <BrandGroup
        id="marken-kuechengeraete"
        title={tr("kgTitle")}
        text={tr("kgText")}
        dealerLine={dealerStatementList(geraete.map((b) => b.id), locale)}
        more={{ href: "/kuechengeraete", label: tr("kgLink") }}
        entries={geraete}
        meta={geraeteMeta}
        imageAlt={(b) => b.imageAlt || (t.has(`geraetAlt.${b.key}`) ? t(`geraetAlt.${b.key}`) : b.name)}
        imageCredit={tr("imageCredit")}
      />

      {/* What you find here – keeps the area/brand overview for readers and crawlers */}
      {paragraphs.length > 0 && (
        <Section tone="band" labelledBy="marken-intro" spacing="compact">
          <div className="grid grid-cols-1 gap-8 @5xl/page:grid-cols-12 @5xl/page:gap-grid">
            <div className="@5xl/page:col-span-4">
              <Heading id="marken-intro" level={2}>
                {tr("introTitle")}
              </Heading>
            </div>
            <div className="flex flex-col gap-4 text-body text-text-soft @5xl/page:col-span-7 @5xl/page:col-start-6">
              {paragraphs.map((p, i) => (
                <p key={i} className="max-w-measure">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Optik-Runde (01.11.2026): wie die Produktseite – der Leitsatz IST die
          H2, die zweite Zeile ein Instrument-Lead (keine zwei Display-Zeilen
          übereinander, QA P3-5). */}
      <CTABand
        id="marken-cta"
        tone="raised"
        title={<Leitsatz as="span" size="m" className="block pb-2" />}
        text={
          <>
            <p className="text-lead text-text">{tr("ctaTitle")}</p>
            <p className="mt-2">{tr("ctaText")}</p>
          </>
        }
        primary={{ href: ROUTES.beratung[locale] || ROUTES.beratung.de, label: tr("ctaAppointment") }}
        secondary={{ href: ROUTES.produkte[locale] || ROUTES.produkte.de, label: tr("ctaProducts") }}
      />

      <Container className="pb-12">
        <p className="max-w-measure border-t border-line pt-6 text-small text-text-soft">{tr("legalNote")}</p>
      </Container>
    </div>
  );
}
