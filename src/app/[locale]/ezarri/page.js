// /de/ezarri – Startseite der Ezarri-Welt (Team A, Konzept §3.1).
// Einstieg über den Ort (5 Einsatz-Welten), dann Wasserwirkung, dann Mosaik.
// Alles am Schalter EZARRI_PUBLIC (robots, Händler-Aussage über copy.dealerLine()).
// Kein WebGL hier: der Konfigurator-Teaser zeigt nur ein Bild.
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ExternalLink } from "lucide-react";
import { Breadcrumbs, Button, Container, Eyebrow, Heading, Lead, LinkArrow, Leitsatz, Section } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import {
  countReferences,
  countWithProjectImage,
  getCollections,
  getGalleryImageById,
  getGalleryImages,
  getSortimentStats,
  isMadeToOrder,
  pickReferences,
  toCollectionCard,
} from "@/lib/ezarri/data";
import { EZARRI_SITE_URL, ezarriWeltLocaleEnabled } from "@/lib/ezarri/config";
import { mitFesterEinheit } from "@/lib/ezarri/einheit";
import { FORMATE, facetsFor } from "@/lib/ezarri/facets";
import { ezCopy, ezT } from "@/lib/ezarri/lang";
import { deLinkProps, ezLinkProps } from "@/lib/ezarri/deLinks";
import { EZARRI_SITE_URL_EN } from "@/lib/ezarri/config";
import { openingHoursLine } from "@/lib/site";
import EzImage from "@/components/Ezarri/Welt/EzImage";
import { HeroImage, WasserStreifen, WeltTile } from "@/components/Ezarri/Welt/Sections";
import { CreditNote, LinkRow, SectionHead, ezCrumbsFor } from "@/components/Ezarri/Welt/parts";
import { ezarriMetadata } from "@/components/Ezarri/Welt/meta";
import { brandNode, collectionPage, crumbsSchema, graph } from "@/components/Ezarri/Welt/schema";
import TerminZeile from "@/components/Ezarri/Welt/TerminZeile";
import JsonLd from "@/components/Reusable/JsonLd";
import { CARD_LINK, staggerStyle } from "@/lib/ezarri/motion";
import { weicheRaster } from "@/lib/ezarri/raster";
import styles from "@/components/Ezarri/Welt/ezarri.module.css";

const PATH = "/ezarri";
// Hero: Ezarri-Poolbild (Gemma Celestite), querformatig; mobil eine eigene
// 4:5-Fassung (-m480/-m853, nur Zuschnitt, QM Runde 2 P2-5).
// R8: mobil steht die H1 vor dem Bild (gesamtwerk P1-4); das Bild folgt direkt in 16:10.
// HERO_LINIE: Wasserkante (Beckenrand) in % der sichtbaren Bildhöhe (QM Runde 2 P3-1).
const HERO_FALLBACK = {
  web: "/ezarri/gemma/anw-celestite-25-gemma-mosaic-pool-ezarri-1",
  mobil: "/ezarri/gemma/anw-celestite-25-gemma-mosaic-pool-ezarri-1",
  // R7-P4: 4:3-Zuschnitt (-q480/-q720, sharp aus -1600.webp, mittig) als mobile LCP-Fassung
  mobil43: "/ezarri/gemma/anw-celestite-25-gemma-mosaic-pool-ezarri-1",
  breite: 1600,
  hoehe: 1067,
};
// R8: mobil 16:10 statt 4:3 (mittiger Zuschnitt zeigt 83 % der Höhe) → Kante bei 66 %.
const HERO_LINIE = { mobil: "66%", desktop: "70%" };
const HERO_GALERIE_ID = "anw-celestite-25-gemma-mosaic-pool-ezarri-1";
// Rat 9,5 A7 (gesamtwerk M8): kürzere H1 im Hero (iPhone ≤ 2 Zeilen). Der längere Titel aus
// src/lib/ezarri/copy.js (HUB.title) bleibt für Metadaten und JSON-LD. Vorschlag für die
// Übernahme: Marktresearch/digital/features/rat95-t3-messages.json (ezarri.hub.heroTitle).
const HERO_TITLE = { de: "Ezarri-Glasmosaik für Pool und Bad", en: "Ezarri glass mosaic for pools and bathrooms", fr: "Mosaïque Ezarri : piscine et bain", it: "Mosaico Ezarri per piscina e bagno" };
// Grundtitel ≤ 34 Zeichen (s. generateMetadata); fr/it 01.11.2026.
const META_TITLE = {
  de: (w) => (w ? `Ezarri-${w} am Bodensee` : "Ezarri Glasmosaik am Bodensee"),
  en: (w) => (w ? `Ezarri ${w} on Lake Constance` : "Ezarri mosaic on Lake Constance"),
  fr: (w) => (w ? "Revendeur Ezarri, lac de Constance" : "Mosaïque Ezarri, lac de Constance"),
  it: (w) => (w ? "Rivenditore Ezarri, Lago di Costanza" : "Mosaico Ezarri, Lago di Costanza"),
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) return {};
  const { HUB, dealerTitleWord } = ezCopy(locale);
  return ezarriMetadata({
    locale,
    path: PATH,
    // R2 seo P2-1: Händler-Aussage (Entscheidung Nr. 7) im Title, nur wenn freigeschaltet.
    // Einhängen 31.10.2026 (rat-neu „Titel-Suffix“): Grundtitel ≤ 34 Zeichen, damit wie auf
    // der Mehrheit der Seiten „| Platzhirsch Home Living“ passt (≤ 60) und nichts wegfällt.
    title: META_TITLE[locale](dealerTitleWord()),
    description: HUB.description(getSortimentStats()),
    image: HERO_FALLBACK.web,
  });
}

const FMT_ORDER = ["25mm", "50mm", "hexa"];
// Sortiment-Raster ab lg (QM r1): Spaltenbreite je Linie nach Anzahl der Einträge.
// QM r2: Listen fließen in CSS-Spalten (oben nach unten) statt im Zeilenraster – keine leeren
// Rasterzellen („Space/Fosfo“ neben Leerzelle), ungleich hohe Namen erzeugen keine Löcher.
// QM r4 (200 % Text): Spaltenzahl nach Breite des Linien-Blocks in rem (Container „linie“) statt
// nach Viewport – bei großer Schrift einspaltig statt angeschnittener Namen („Metal…“).
const LINIE_LAYOUT = {
  Premium: { section: "lg:col-span-12", list: "@[36rem]/linie:columns-2 @[54rem]/linie:columns-3" },
  Classic: { section: "lg:col-span-4", list: "@[36rem]/linie:columns-2" },
  Custom: { section: "lg:col-span-8", list: "@[36rem]/linie:columns-2" },
};
// QM r1: Trenner mit geschütztem Leerzeichen am Wort davor – keine Zeile beginnt mit „· “.
const SEP = "\u00a0· ";
const fmtLabel = (ids) => [...ids].sort((a, b) => (FMT_ORDER.indexOf(a) + 1 || 9) - (FMT_ORDER.indexOf(b) + 1 || 9)).map((id) => mitFesterEinheit(FORMATE.find((f) => f.id === id)?.label ?? id)).join(SEP);

export default async function EzarriHubPage({ params }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const { HUB, KOLLEKTIONEN, LINKS, LINIE_LABEL, STUDIO, TECHNIK, WELTEN, dealerClaim, dealerLine } = ezCopy(locale);
  const { WASSERWIRKUNG } = facetsFor(locale);
  const t = ezT(locale);
  // Nicht-Deutsch (en/fr/it): Texte aus copy.<lang>.js; HUB.usp = Kern-USP (Entscheidung Nr. 8).
  const en = locale !== "de";
  const usp = en
    ? HUB.usp
    : {
        eyebrow: "Planung mit Platzhirsch",
        title: "Ihr Pool, zuerst von Hand gezeichnet.",
        text: "Mosaik wirkt erst im Licht und am Ort. Wir sehen uns Ihren Pool oder Ihr Bad vor Ort an. Harald Menghin zeichnet Muster, Farbverläufe und Übergänge von Hand. Danach planen wir in 3D und zeigen Ihnen ein Rendering mit den Ezarri-Farben, bevor bestellt wird.",
        arbeitsweise: "So arbeiten wir",
        licht: "Sonnenstand am Becken ansehen",
      };

  const hero = HERO_FALLBACK;
  const stats = getSortimentStats();
  // Jedes Bild nur einmal je Seite (QM P1-2): Hero, kuratierte Kacheln, dann Wasser und Teaser.
  const used = new Set([HERO_GALERIE_ID, ...WELTEN.map((w) => w.bild?.galerie).filter(Boolean)]);
  const welten = WELTEN.map((w) => ({
    w,
    count: countReferences(w.filter),
    mitBild: w.galerie.length ? countWithProjectImage(w.galerie) : 0,
    image: (w.bild && getGalleryImageById(w.bild.galerie)?.bild) ?? pickReferences(w.filter, 1)[0]?.bild,
    alt: w.bild?.alt,
  }));
  const wasser = WASSERWIRKUNG.map((w) => {
    const g = getGalleryImages({ wasser: w.id, limit: 1, exclude: used })[0];
    return { w, image: g?.bild ?? pickReferences({ wasser: [w.id] }, 1)[0]?.bild, imageName: g?.referenzName ?? null, mosaics: pickReferences({ wasser: [w.id] }, 3) };
  });
  const linien = ["Premium", "Classic", "Custom"].map((l) => {
    const cols = getCollections({ linie: l });
    return { linie: l, kollektionen: cols.filter((c) => !isMadeToOrder(c)).length, items: cols.map(toCollectionCard) };
  });
  const teaser = getGalleryImages({ einsatz: ["pool-privat"], limit: 1, exclude: used })[0]?.bild ?? hero;
  // Deutsch: Startseite › Outdoor & Pool › Ezarri Glasmosaik; Englisch: Home › Ezarri glass mosaic.
  const crumbs = ezCrumbsFor(locale);
  const ld = graph(
    crumbsSchema(crumbs, { locale }), // Runde 4 P5: letzte Stufe „Ezarri Glasmosaik“ mit item (href = /ezarri)
    brandNode(),
    collectionPage({ locale, path: PATH, name: HUB.title, description: HUB.lead(stats), items: WELTEN.map((w) => ({ name: w.title, href: `/ezarri/${w.id}` })) })
  );

  return (
    <>
      <JsonLd data={ld} />
      {/* 1 Hero. R8 (gesamtwerk P1-4, offen seit R2): mobil zuerst Eyebrow und H1,
          dann das Bild (16:10, ≤ 40 svh), dann Lead und Knöpfe – H1 und Bild stehen bei
          390 × 844 im ersten Bildschirm. Ab lg wie bisher: H1 links, Lead rechts, Bild darunter.
          Rat 9,5 A7 (gesamtwerk M8): H1 zweizeilig, mobil H1 → Poolbild → Händler-Zeile und
          „Termin anfragen“ (bei 393 × 852 weiter über der Cookie-Leiste), höchstens zwei Knöpfe. */}
      <Container className="pt-4 md:pt-10">
        <Breadcrumbs items={[...crumbs.slice(0, -1), { label: crumbs.at(-1).label }]} />
      </Container>
      <Container as="header" className="grid grid-cols-[minmax(0,1fr)] pb-section pt-4 lg:grid-cols-12 lg:items-end lg:gap-x-8 lg:pt-8">
        <div className="lg:col-span-7 lg:row-start-1">
          <Eyebrow className="[overflow-wrap:anywhere]">{HUB.eyebrow}</Eyebrow>
          {/* A7: mobil display-l, damit die H1 in zwei Zeilen steht; ab lg display-xl. */}
          <Heading level={1} size="display-xl" className="mt-stack-s text-balance [overflow-wrap:break-word] max-lg:text-display-l max-sm:text-[length:min(var(--text-display-l),12vw)] lg:text-[length:min(5.25rem,6.2vw)]" data-ezarri-h1="">
            {HERO_TITLE[locale] ?? HERO_TITLE.de}
          </Heading>
        </div>
        <div className="mt-5 lg:col-span-12 lg:row-start-3 lg:mt-10">
          <HeroImage image={hero} alt={HUB.heroAlt} linie={HERO_LINIE} />
        </div>
        <div className="lg:col-span-7 lg:row-start-2">
          {/* Design-Jury P2-21: beide Inhaltswege in einer Zeile unter der H1 – „Termin anfragen“
              als einziger gefüllter Knopf, „Becken gestalten“ als Textlink daneben. */}
          <TerminZeile className="mt-5 lg:mt-8" textClassName="lg:hidden">
            <p className="flex flex-wrap items-center gap-x-3">
              <LinkArrow href={LINKS.konfigurator} {...ezLinkProps(locale, LINKS.konfigurator)}>{HUB.primary.label}</LinkArrow>
              <span className="text-small text-text-soft">{HUB.primary.sub}</span>
            </p>
          </TerminZeile>
        </div>
        <div className="mt-6 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:mt-0">
          <Lead className="text-pretty">{HUB.lead(stats)}</Lead>
          {dealerClaim() && (
            <p className="mt-3 text-ui text-text" data-ezarri-dealer="intro">
              {dealerClaim()}
            </p>
          )}
          {/* Ein Primärknopf je Ansicht (Bibel §9): „Termin anfragen“ links ist primär, „Becken
              gestalten“ steht als Textlink in derselben Zeile (Design-Jury P2-21). A7: höchstens
              zwei Wege im Einstieg – „Muster anfragen“ steht in der lokalen Navigation. */}
        </div>
      </Container>

      {/* 2 Weiche */}
      <Section labelledBy="ez-weiche" spacing="none" className="pb-section">
        <SectionHead id="ez-weiche" eyebrow={HUB.weiche.eyebrow} title={HUB.weiche.title} text={HUB.weiche.text} />
        {/* QM r2: Spalten per Container-Query in rem – bei 200 % Text 3 statt 5 Spalten (Titel liefen ineinander) */}
        {/* QM r4: bei 200 % Text einspaltig; keine leere Rasterzelle mehr (iphone-se: „Fassade“ allein,
            ipad-hoch: 3 + 2) – breite Kacheln füllen die letzte Zeile (lib/ezarri/raster.js weicheRaster). */}
        <div className="@container/weiche">
        <ul className="mt-stack-m grid grid-cols-1 gap-x-grid gap-y-10 @[18rem]/weiche:grid-cols-2 @lg/weiche:grid-cols-6 @5xl/weiche:grid-cols-5">
          {welten.map(({ w, count, mitBild, image, alt }, i) => {
            const r = weicheRaster(i, welten.length);
            return (
              <li key={w.id} className={`reveal min-w-0 ${r.li}`} style={staggerStyle(i, 5)}>
                <WeltTile welt={w} image={image} alt={alt} meta={HUB.kachel(count, mitBild)} boxClassName={r.box} sizes={r.breit ? "(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw" : undefined} />
              </li>
            );
          })}
        </ul>
        </div>
        {/* QM r1: Quellenzeile mit Linie und Abstand klar von den Kacheln getrennt (las sich als Kacheltext). */}
        <CreditNote className="mt-12 border-t border-line pt-3" />
      </Section>

      {/* 3 Wasserwirkung (Signature) */}
      {/* Kern-USP (Inhaber-Entscheidung Nr. 8, USP-Plan 11.1): Pool zuerst von Hand gezeichnet. */}
      {/* QM r2: weniger Luft. QM r4: die zwei Wege stehen direkt unter dem Text (eine Zeile, linksbündig) –
          die rechte Spalte mit Linie stand über leerer Fläche und wirkte vom Text abgekoppelt. */}
      <Section labelledBy="ez-usp" spacing="none" className="pb-16 md:pb-20" data-ezarri-usp="">
        <div className="grid gap-6">
        <SectionHead id="ez-usp" eyebrow={usp.eyebrow} title={usp.title} text={usp.text} />
        {/* R2 recht P2-2: keine zweite HandBridge direkt unter demselben USP-Satz */}
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <Link href="/arbeitsweise" className="inline-flex min-h-11 items-center text-ui text-text underline underline-offset-4">
            {usp.arbeitsweise}
          </Link>
          <Link href="/bodensee-licht?szene=pool" {...deLinkProps(locale, "/bodensee-licht?szene=pool")} className="inline-flex min-h-11 items-center text-ui text-text underline underline-offset-4">
            {usp.licht}
          </Link>
        </div>
        </div>
      </Section>

      <Section tone="band" labelledBy="ez-wasser">
        <SectionHead id="ez-wasser" eyebrow={HUB.wasser.eyebrow} title={HUB.wasser.title} text={HUB.wasser.text} />
        <div className="mt-stack-m">
          <WasserStreifen items={wasser} />
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <CreditNote />
          <Link href="/ezarri/wasser" className="inline-flex min-h-11 items-center text-ui text-text underline underline-offset-4">
            {HUB.wasser.alle}
          </Link>
        </div>
      </Section>

      {/* 4 Kollektionen typografisch */}
      {/* QM r2 (iphone-se): mobil halbe Abschnittsluft am Übergang zum Konfigurator-Teaser */}
      <Section labelledBy="ez-kol" spacing="none" className="pt-section pb-12 md:pb-section">
        <SectionHead id="ez-kol" eyebrow={HUB.kollektionen.eyebrow} title={HUB.kollektionen.title(stats)} />
        {/* QM r1: Premium (11) über die volle Breite in drei Spalten, darunter Classic (3) und
            Individuell (7, zweispaltig) – statt drei ungleich langer Spalten mit Loch unter Classic. */}
        {/* QM r4 (200 % Text): Spur minmax(0, 1fr) statt auto – lange Namen dehnten das Raster über den
            Bildschirmrand (x = 40–409 bei 393 px), rechts wurde abgeschnitten. */}
        <div className="reveal-group mt-stack-m grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-12 lg:gap-x-grid">
          {linien.map(({ linie, kollektionen, items }) => (
            <section key={linie} aria-labelledby={`ez-linie-${linie}`} className={`@container/linie min-w-0 ${styles.fitNamen} ${LINIE_LAYOUT[linie]?.section ?? ""}`}>
              <h3 id={`ez-linie-${linie}`} className="text-overline uppercase text-text-accent">
                {LINIE_LABEL[linie]} · {kollektionen}
                {items.length > kollektionen && ` + ${KOLLEKTIONEN.sonderN(items.length - kollektionen)}`}
              </h3>
              <p className="mt-2 max-w-measure text-small text-text-soft text-pretty lg:min-h-[2lh]">{KOLLEKTIONEN.linien[linie]}</p>
              <ul className={`mt-4 border-t border-line md:gap-x-grid ${LINIE_LAYOUT[linie]?.list ?? ""}`}>
                {items.map((k) => (
                  <li key={k.id} className="group relative break-inside-avoid border-b border-line py-3">
                    <Link href={`/ezarri/kollektionen/${k.id}`} className={`ph-stretched font-display text-display-m text-text underline-offset-8 ${CARD_LINK}`}>
                      {k.name}
                    </Link>
                    <p className="text-small tabular-nums text-text-soft">
                      {[k.anzahl ? (en ? HUB.referenzen(k.anzahl) : `${k.anzahl} Referenzen`) : KOLLEKTIONEN.sonder, fmtLabel(k.formate)].filter(Boolean).join(SEP)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <Link href="/ezarri/kollektionen" className="mt-8 inline-flex min-h-11 items-center text-ui text-text underline underline-offset-4">
          {HUB.kollektionen.alle}
        </Link>
      </Section>

      {/* 5 Konfigurator-Teaser (Bild, kein WebGL) */}
      <Section tone="raised" labelledBy="ez-konf" spacing="none" className="pt-12 pb-12 md:py-section">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-12 lg:items-center lg:gap-x-grid">
          <div className="min-w-0 lg:col-span-7">
            <EzImage image={teaser} alt={t("Privatpool mit Ezarri-Glasmosaik", HUB.teaserAlt)} ratio="3/2" sizes="(min-width: 1024px) 55vw, 100vw" credit />
          </div>
          <div className="min-w-0 lg:col-span-5">
            <SectionHead id="ez-konf" eyebrow={HUB.konfigurator.eyebrow} title={HUB.konfigurator.title} text={HUB.konfigurator.text} />
            <ul className="mt-stack-m border-t border-line">
              <LinkRow href={LINKS.konfigurator} title={HUB.konfigurator.link} />
              <LinkRow href={LINKS.rechner} title={HUB.konfigurator.rechner} />
              <LinkRow href={LINKS.customMix} title={HUB.konfigurator.customMix} />
            </ul>
          </div>
        </div>
      </Section>

      {/* 6 Technik kurz + 7 Markenkopf */}
      <Section labelledBy="ez-technik" spacing="none" className="pt-12 pb-section md:pt-section">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-12 lg:gap-x-grid">
          <div className="min-w-0 lg:col-span-7">
            <SectionHead id="ez-technik" eyebrow={HUB.technik.eyebrow} title={HUB.technik.title} />
            <ul className="mt-stack-m border-t border-line">
              {TECHNIK.bereiche.slice(0, 5).map((b) => (
                <LinkRow key={b.href} href={b.href} title={b.title} text={b.text} />
              ))}
            </ul>
          </div>
          <aside aria-labelledby="ez-marke" className="lg:col-span-4 lg:col-start-9">
            <Eyebrow>{HUB.marke.eyebrow}</Eyebrow>
            <h2 id="ez-marke" className="mt-stack-s text-title text-text">
              Ezarri
            </h2>
            <p className="mt-2 text-body text-text-soft">{HUB.marke.text}</p>
            <p className="mt-4 text-ui text-text">{dealerLine()}</p>
            <a href={en ? EZARRI_SITE_URL_EN : EZARRI_SITE_URL} hrefLang={en ? "en" : "de"} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-2 text-ui text-text underline underline-offset-4">
              {HUB.marke.website}
              <ExternalLink aria-hidden="true" className="size-4" strokeWidth={1.5} />
              <span className="sr-only">{t("(öffnet ezarri.com)", HUB.oeffnet)}</span>
            </a>
          </aside>
        </div>
      </Section>

      {/* 8 Gastgeber-Band (die eine Walnut-Fläche) + 9 Schluss */}
      <Section tone="inverse" labelledBy="ez-gast">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-grid">
          <div className="lg:col-span-7">
            <Eyebrow tone="inverse">{HUB.gastgeber.eyebrow}</Eyebrow>
            <Heading id="ez-gast" level={2} size="display-m" tone="inverse" className="mt-stack-s">
              {HUB.gastgeber.title}
            </Heading>
            <p className="mt-stack-m max-w-measure text-body text-text-inverse-soft">{HUB.gastgeber.text}</p>
            <p className="mt-4 text-small text-text-inverse-soft">{STUDIO.muster}</p>
          </div>
          <div className="flex flex-col gap-4 lg:col-span-4 lg:col-start-9">
            <p className="text-ui text-text-inverse">{STUDIO.ort}</p>
            <p className="text-small tabular-nums text-text-inverse-soft">{openingHoursLine(locale)}</p>
            <p className="text-small text-text-inverse-soft">
              {STUDIO.laender}{" "}
              <Link href={STUDIO.schweizHref} {...deLinkProps(locale, STUDIO.schweizHref)} className="underline underline-offset-4">
                {t("Einkaufen aus der Schweiz", HUB.schweiz)}
              </Link>
            </p>
          </div>
        </div>
        <div className="mt-section flex flex-col items-center text-center">
          <Leitsatz size="l" tone="inverse" />
          <div className="mt-stack-m flex flex-col gap-3 sm:flex-row">
            {en ? (
              <Button href={LINKS.beratung} arrow onDark>
                {HUB.gastgeber.termin}
              </Button>
            ) : (
              <Button href="/beratung?thema=ezarri" arrow onDark>
                {HUB.gastgeber.termin}
              </Button>
            )}
          </div>
        </div>
      </Section>
    </>
  );
}
