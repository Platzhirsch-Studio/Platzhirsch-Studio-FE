// /de/ezarri/mosaike/<referenz> – Mosaik-Detailseite (Konzept §3.5), eine je
// Ezarri-Referenz (402, generateStaticParams). Safe-/Corner-/Cove-Seiten sind
// Hilfsseiten (noindex, follow bei EZARRI_PUBLIC) mit canonical aufs
// Basis-Mosaik, wenn es bekannt ist (§6.3). Kein Preis, keine Bewertungen.
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ExternalLink, FileText } from "lucide-react";
import {
  DATA_STAND,
  getBaseReference,
  getCollection,
  getDatasheet,
  getEignung,
  getGalleryForReference,
  getKombination,
  getOwnPackaging,
  ownFormatIds,
  getReference,
  getReferenceIds,
  getReferencesByCollection,
  getSimilar,
  getSlipResistance,
  getVariantGroups,
  getEigenerText,
  isIndexableMosaik,
  toReferenceCard,
} from "@/lib/ezarri/data";
import { mosaikHeading } from "@/lib/ezarri/indexierung";
import { limitPrerender } from "@/lib/build/prerender";
import { EZARRI_WELT_LOCALES, ezarriCredit, ezarriWeltLocaleEnabled, ezarriUrlFor } from "@/lib/ezarri/config";
import { ezLinkProps } from "@/lib/ezarri/deLinks";
import { dezimal, ezCopy, ezT, herstellerText, wert } from "@/lib/ezarri/lang";
import { FORMATE, facetsFor, formatIdsOf } from "@/lib/ezarri/facets";
import { Button, Container, Eyebrow, Heading, Section } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import EzImage from "@/components/Ezarri/Welt/EzImage";
import MosaicCard from "@/components/Ezarri/Katalog/MosaicCard";
import SheetDrawing from "@/components/Ezarri/Katalog/SheetDrawing";
import Kombination from "@/components/Ezarri/Katalog/Kombination";
import CompareBar from "@/components/Ezarri/Katalog/CompareBar";
import { CompareButton, MerkButton } from "@/components/Ezarri/Katalog/CardActions";
import { CreditNote, FactList, PageHead, Schluss, ezCrumbsFor } from "@/components/Ezarri/Welt/parts";
import { ezarriMetadata } from "@/components/Ezarri/Welt/meta";
import { brandNode, mosaikNode } from "@/components/Ezarri/Welt/schema";
import { konfiguratorHref } from "@/components/Ezarri/Katalog/konfigLink";
import { anfrageHref } from "@/components/Ezarri/Anfrage/AnfrageLink";
import { toMetaDescription } from "@/lib/seo/pageMetadata";
import { staggerStyle } from "@/lib/ezarri/motion";

const BASE = "/ezarri/mosaike";

/** Anzeige: „25mm“ → „25 mm“, „24,7 x 24,7“ → „24,7 × 24,7“ (nur Typografie, Daten unverändert). */
const masz = (v) => (typeof v === "string" ? v.replace(/(\d)mm\b/g, "$1 mm").replace(/(\d) x (\d)/g, "$1 × $2") : v);

// Volle Params (locale + referenz) wie ratgeber/[slug]; alle Sprachen der Ezarri-Welt (01.11.2026: de, en, fr, it).

export function generateStaticParams() {
  return limitPrerender(EZARRI_WELT_LOCALES.flatMap((locale) => getReferenceIds().map((referenz) => ({ locale, referenz }))));
}
// Technik R7 (r6-technik P0-1): complete local list → unknown referenz and
// other locales get the prerendered 404, no cache entry per URL.
// true: Referenzen ausserhalb von PRERENDER_SCOPE entstehen beim ersten Aufruf;
// unbekannte Referenz/Sprache -> notFound() in MosaikDetailPage.
export const dynamicParams = true;

// Format DIESER Referenz (Basalt 50 → „50 mm“); weitere Formate der Familie stehen unter „Ausführungen“.
// Ohne eigenes Format (Corner, Cove, Motive) die Formate der Familie.
const formatText = (r) => {
  const own = ownFormatIds(r);
  return (own.length ? own : formatIdsOf(r)).map((id) => FORMATE.find((f) => f.id === id)?.label).filter(Boolean).join(", ");
};
const wasserText = (r, locale = "de") =>
  [].concat(r.wasserfarbe ?? []).map((v) => facetsFor(locale).WASSERWIRKUNG.find((w) => w.value === v)?.label).filter(Boolean).join(", ");
// Eignung laut Datenblatt, dedupliziert (QM P1-3: kein „Wand innen, Wand innen und außen“).
const einsatzText = (r, locale = "de") => getEignung(r).map((id) => facetsFor(locale).EINSATZ.find((e) => e.id === id)?.label).filter(Boolean).join(", ");

export async function generateMetadata({ params }) {
  const { locale, referenz } = await params;
  const r = ezarriWeltLocaleEnabled(locale) ? getReference(referenz) : null;
  if (!r) return { robots: { index: false, follow: false } };
  const { DETAIL, alt: altText } = ezCopy(locale);
  const c = getCollection(r.kollektion);
  const base = getBaseReference(r);
  const fmt = formatText(r);
  const en = locale !== "de";
  const ober = wert("oberflaeche", r.oberflaeche, locale);
  const wt = wasserText(r, locale);
  const surface = { en: (o) => `${o} surface`, fr: (o) => `surface : ${o}`, it: (o) => `superficie: ${o}` }[locale];
  // R8 (seo P2-11): „Wasser Himmelblau“ war unverständlich → „Wasserwirkung himmelblau“.
  const facts = en
    ? [fmt && DETAIL.metaFormat(fmt), ober && surface(ober), wt && DETAIL.metaWasser(wt.toLowerCase())].filter(Boolean).join(", ")
    : [fmt && `Format ${fmt}`, r.oberflaeche, wt && `Wasserwirkung ${wt.toLowerCase()}`].filter(Boolean).join(", ");
  let factsText = en && facts ? facts[0].toUpperCase() + facts.slice(1) : facts;
  // fr/it (01.11.2026): längere Wörter → Fakten von hinten kürzen, bis die Description ≤ 150 ist
  // (sonst schneidet clampDescription den ganzen Faktensatz ab und es bleiben ~60 Zeichen).
  if (locale === "fr" || locale === "it") {
    const parts = [fmt && DETAIL.metaFormat(fmt), ober && surface(ober), wt && DETAIL.metaWasser(wt.toLowerCase())].filter(Boolean);
    const desc = (p) => DETAIL.metaDescription({ name: r.name, code: r.code, kollektion: c?.name ?? "", facts: p.length ? p.join(", ")[0].toUpperCase() + p.join(", ").slice(1) : "" });
    while (parts.length && desc(parts).length > 150) parts.pop();
    factsText = parts.length ? parts.join(", ")[0].toUpperCase() + parts.join(", ").slice(1) : "";
  }
  return ezarriMetadata({
    locale,
    path: `${BASE}/${r.id}`,
    title: `Ezarri ${r.name} – ${c?.name ?? r.kollektion}${fmt ? `, ${fmt}` : ""}`,
    description: toMetaDescription(
      en
        ? DETAIL.metaDescription({ name: r.name, code: r.code, kollektion: c?.name ?? "", facts: factsText })
        : `Glasmosaik Ezarri ${r.name} (${r.code}) aus der Kollektion ${c?.name ?? ""}. ${facts ? `${facts}. ` : ""}Muster und Beratung in Lochau.`
    ),
    image: r.bilder?.mosaik?.[0]?.web,
    imageAlt: altText.mosaik(r.name, fmt, ober),
    // Runde 4 P5 (seo P1-2): Mosaike ohne eigenen Text und mit >= 50 %
    // Ähnlichkeit in der Kollektion sind noindex,follow (src/lib/ezarri/indexierung.js).
    utility: r.typ !== "mosaik" || !isIndexableMosaik(r),
    canonicalPath: base ? `${BASE}/${base.id}` : undefined,
  });
}

// R8 (seo P2-11): Varianten einer Familie (-50, -gold, -hexa) hatten fast denselben
// Text. Ein eigener Satz je Seite – NUR aus den Daten der Referenz (keine Erfindung):
// Kollektion, Format, Oberfläche, Wasserwirkung laut Ezarri und die übrigen
// Ausführungen derselben Familie, damit klar ist, worin sich diese Seite unterscheidet.
function variantLead(r, c, fmt, wasser, groups, locale = "de") {
  const others = (groups.find((g) => g.gruppe === "Format")?.items || []).filter((v) => !v.current && !v.sameAsPage).map((v) => fmtSpace(v.label));
  if (locale !== "de") {
    return ezCopy(locale).DETAIL.lead({ name: r.name, kollektion: c?.name ?? r.kollektion, fmt: fmt ? fmtSpace(fmt) : "", oberflaeche: wert("oberflaeche", r.oberflaeche, locale), wasser: wasser?.toLowerCase(), others });
  }
  return [
    `${r.name} ist ein Glasmosaik aus der Ezarri-Kollektion ${c?.name ?? r.kollektion}${fmt ? `, hier in der Ausführung ${fmtSpace(fmt)}` : ""}${r.oberflaeche ? `, Oberfläche ${r.oberflaeche}` : ""}.`,
    wasser ? `Wasserwirkung laut Ezarri: ${wasser}.` : null,
    others.length ? `Dieselbe Familie gibt es auch als ${others.join(", ")}.` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

// „25mm“ (Ezarri-Schreibweise) → „25 mm“ mit schmalem Leerzeichen (QM Runde 2 P3-4).
const fmtSpace = (s) => String(s).replace(/(\d)\s?mm\b/g, "$1\u202Fmm");

function VariantGroups({ groups, locale }) {
  const { DETAIL } = ezCopy(locale);
  const t = ezT(locale);
  const title = { Format: DETAIL.formate, "Anti-Rutsch": DETAIL.safe, "Special Pieces": DETAIL.spezial };
  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => (
        <div key={g.gruppe}>
          <p className="mb-2 text-overline uppercase text-text-soft">{title[g.gruppe] ?? g.gruppe}</p>
          <ul className="flex flex-wrap gap-2">
            {g.items.map((v) => (
              <li key={fmtSpace(v.label)}>
                {v.current ? (
                  <span aria-current="page" className="inline-flex min-h-11 items-center border border-see bg-see px-3 text-small text-paper">
                    {fmtSpace(v.label)}
                  </span>
                ) : v.sameAsPage ? (
                  <span className="inline-flex min-h-11 items-center border border-line px-3 text-small text-text">
                    {fmtSpace(v.label)} <span className="ml-1 text-text-soft">({DETAIL.aufDieserSeite})</span>
                  </span>
                ) : v.id ? (
                  <Link href={`${BASE}/${v.id}`} className="inline-flex min-h-11 items-center border border-line-control px-3 text-small text-text hover:border-ink">
                    {fmtSpace(v.label)}
                  </Link>
                ) : (
                  <span className="inline-flex min-h-11 items-center border border-dashed border-line-strong px-3 text-small text-text-soft">
                    {fmtSpace(v.label)} <span className="sr-only">{t("(bei Ezarri, hier noch ohne eigene Seite)", DETAIL.ohneSeite)}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default async function MosaikDetailPage({ params }) {
  const { locale, referenz } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const { DETAIL, LINKS, LINIE_LABEL, MISCHUNG, TYP_LABEL, alt: altText } = ezCopy(locale);
  const t = ezT(locale);
  // Nicht-Deutsch (en/fr/it): Texte aus copy.<lang>.js; der eigene Text (getEigenerText) ist nur deutsch.
  const en = locale !== "de";
  const r = getReference(referenz);
  if (!r) notFound();
  const ober = wert("oberflaeche", r.oberflaeche, locale);
  // Englisch: Ezarris eigener Produkttext (ezarri.com/en, Entscheidung Nr. 7) mit Quelle.
  const hersteller = herstellerText(r.text_ezarri, locale);
  const quelleUrl = ezarriUrlFor(r.quelle, locale);

  const card = toReferenceCard(r);
  const kombi = getKombination(r);
  const mischbarText = r.konfigurator
    ? r.konfigurator.mischbar
      ? t("ja, im Konfigurator mischbar", DETAIL.mischbarJa)
      : kombi
        ? MISCHUNG.nurFertig
        : t("nein, im Konfigurator nur allein wählbar", DETAIL.mischbarNein)
    : null;
  const c = getCollection(r.kollektion);
  const groups = getVariantGroups(r);
  const slip = getSlipResistance(r);
  const sheet = getDatasheet(c);
  const fmt = formatText(r);
  const wasser = wasserText(r, locale);
  const pack = getOwnPackaging(r);
  const formate = r.formate_verfuegbar || [];
  const gallery = getGalleryForReference(r.id, 8).filter((g) => g.bild);
  const anwendung = [...(r.bilder?.anwendung || []), ...gallery.map((g) => g.bild)]
    .filter((b, i, a) => b?.web && a.findIndex((x) => x?.web === b.web) === i)
    .slice(0, 6);
  const mosaikBilder = (r.bilder?.mosaik || []).slice(0, 2);
  const similar = getSimilar(r, 4).map(toReferenceCard);
  const sameCol = getReferencesByCollection(r.kollektion)
    .filter((x) => x.id !== r.id && x.typ === "mosaik" && !similar.some((s) => s.id === x.id))
    .slice(0, 4)
    .map(toReferenceCard);
  const path = `${BASE}/${r.id}`;
  const crumbs = ezCrumbsFor(locale, { label: t("Mosaike", "Mosaics", "Mosaïques", "Mosaici"), href: BASE }, { label: r.name });
  // Runde 4 P5 (seo P1-2): H1 nennt Ezarri, Art, Name/Code und Kollektion.
  const h1 = mosaikHeading(r, c?.name ?? r.kollektion, TYP_LABEL[r.typ]?.split(",")[0] ?? t("Mosaik", DETAIL.heading?.typ), locale);
  const eigenerText = getEigenerText(r);

  const facts = [
    { label: DETAIL.labels.code, value: r.code },
    { label: DETAIL.labels.kollektion, value: c?.name ?? r.kollektion },
    { label: DETAIL.labels.linie, value: LINIE_LABEL[r.linie] ?? r.linie },
    { label: DETAIL.labels.typ, value: TYP_LABEL[r.typ] ?? r.typ },
    { label: DETAIL.labels.format, value: fmt },
    { label: DETAIL.labels.stein, value: masz(dezimal(r.masse?.stein_mm, locale)) },
    { label: DETAIL.labels.dicke, value: dezimal(r.masse?.dicke, locale) },
    { label: DETAIL.labels.fugeMm, value: dezimal(r.masse?.fuge_mm?.split(" / ")[0], locale) },
    { label: DETAIL.labels.oberflaeche, value: ober },
    { label: DETAIL.labels.farbe, value: (r.farben || []).map((f) => wert("farbe", f, locale)).join(", ") },
    ...(kombi ? [{ label: MISCHUNG.zeile, value: kombi.teile.map((t) => `${t.name} ${t.anteil}\u202F%`).join(", ") }] : []),
    { label: DETAIL.labels.wasser, value: wasser ? `${wasser} (${t("laut Ezarri", DETAIL.lautEzarri)})` : null },
    { label: DETAIL.labels.einsatz, value: einsatzText(r, locale) },
    ...(slip
      ? [
          { label: DETAIL.labels.rutschBarfuss, value: slip.barfuss },
          { label: DETAIL.labels.rutschSchuh, value: slip.schuh },
          { label: DETAIL.labels.rutschPendel, value: slip.pendel },
        ]
      : []),
    { label: DETAIL.fuge, value: r.fuge_empfehlung },
    ...(mischbarText ? [{ label: DETAIL.labels.mischbar, value: mischbarText }] : []),
  ];

  const ld = [
    brandNode(),
    mosaikNode({
      locale,
      farben: (r.farben || []).map((f) => wert("farbe", f, locale)),
      ref: r,
      path,
      kollektionName: c?.name,
      kollektionPath: c ? `/ezarri/kollektionen/${c.id}` : undefined,
      images: [...mosaikBilder, ...anwendung.slice(0, 2)].map((b) => `${b.web}-1600.webp`),
      facts: [
        { name: "Format", value: fmt },
        { name: t("Stein", DETAIL.labels.stein), value: dezimal(r.masse?.stein_mm, locale) },
        { name: t("Dicke", DETAIL.labels.dicke), value: dezimal(r.masse?.dicke, locale) },
        { name: t("Oberfläche", DETAIL.labels.oberflaeche), value: ober },
        { name: t("Rutschhemmung", "Slip resistance", "Résistance au glissement", "Resistenza allo scivolamento"), value: slip ? [slip.schuh, slip.barfuss].filter(Boolean).join(", ") : null },
      ],
    }),
  ];

  return (
    <>
      <PageHead crumbs={crumbs} title={null} jsonLd={ld} />
      <Container className="pb-section">
        {/* Mobil: Mosaikbild → Angaben (H1, Preis, Anfrage) → Projektbilder; ab lg Bilder links, Angaben rechts angeheftet. */}
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-grid lg:gap-y-grid">
          {/* Bilder */}
          <div className="flex flex-col gap-grid lg:col-span-7 lg:row-start-1">
            {mosaikBilder.length > 0 ? (
              mosaikBilder.map((b, i) => (
                <EzImage
                  key={b.web}
                  image={b}
                  alt={altText.mosaik(r.name, fmt, ober)}
                  ratio="1/1"
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  preload={i === 0}
                  credit
                />
              ))
            ) : (
              <div className="flex aspect-square items-center justify-center bg-linen text-small text-text-soft">{t("Bild laut Ezarri nicht vorhanden", DETAIL.keinBild)}</div>
            )}
          </div>
          {anwendung.length > 0 && (
            <div className="grid grid-cols-1 gap-grid sm:grid-cols-2 lg:col-span-7 lg:row-start-2 max-lg:order-last">
                {anwendung.map((b) => (
                  <EzImage key={b.web} image={b} alt={altText.anwendung(r.name, wasser)} ratio="3/2" sizes="(min-width: 1024px) 27vw, (min-width: 640px) 50vw, 100vw" credit />
                ))}
            </div>
          )}

          {/* Angaben */}
          <div className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
            <div className="flex flex-col gap-6 lg:sticky lg:top-[calc(var(--header-h)+4rem)]">
              <div>
                <Eyebrow>
                  Ezarri · <Link href={`/ezarri/kollektionen/${r.kollektion}`} className="underline underline-offset-4">{c?.name ?? r.kollektion}</Link>
                </Eyebrow>
                <Heading level={1} size="display-l" className="mt-stack-s text-balance" data-ezarri-h1="">
                  {h1.main}
                  {h1.kollektion && (
                    <>
                      <span className="sr-only"> · </span>
                      <span className="mt-2 block font-sans text-title font-normal text-text-soft">{h1.kollektion}</span>
                    </>
                  )}
                </Heading>
                <p className="mt-2 text-small tabular-nums text-text-soft">
                  {DETAIL.labels.code} {r.code} · {LINIE_LABEL[r.linie] ?? r.linie}
                  {r.typ !== "mosaik" ? ` · ${TYP_LABEL[r.typ]}` : ""}
                </p>
                <p className="mt-3 max-w-measure text-body text-pretty text-text-soft" data-ezarri-variant-lead="">
                  {variantLead(r, c, fmt, wasser, groups, locale)}
                </p>
                {eigenerText && !en && <p className="mt-3 max-w-measure text-body text-pretty text-text" data-ezarri-eigener-text="">{eigenerText}</p>}
                {hersteller && (
                  <figure className="mt-4 max-w-measure border-l-2 border-line-strong pl-4" data-ezarri-herstellertext="">
                    <figcaption className="text-overline uppercase text-text-soft">{DETAIL.herstellerTitel}</figcaption>
                    <blockquote cite={quelleUrl} className="mt-2 text-body text-pretty text-text">
                      <p>{hersteller}</p>
                    </blockquote>
                    <p className="mt-1 text-small text-text-soft">{ezarriCredit("text", locale)}</p>
                  </figure>
                )}
              </div>
              <div>
                <p className="text-title text-text">{DETAIL.preis}</p>
                <p className="mt-1 text-small text-text-soft">{DETAIL.preisHinweis}</p>
              </div>
              {kombi && <Kombination mosaik={r} kombination={kombi} />}
              {groups.length > 0 && (
                <section aria-labelledby="ez-ausf">
                  <h2 id="ez-ausf" className="mb-3 text-ui text-text">
                    {DETAIL.ausfuehrungen}
                  </h2>
                  <VariantGroups groups={groups} locale={locale} />
                </section>
              )}
              <div className="flex flex-col gap-3">
                <Button href={anfrageHref({ art: "muster", refs: [r.id], quelle: "katalog" })} {...ezLinkProps(locale, "/ezarri/anfrage")} arrow fullWidth>
                  {DETAIL.muster}
                </Button>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {r.konfigurator && (
                    <Button href={konfiguratorHref([{ konfId: r.konfigurator.id, ref: r.id }], formatIdsOf(r)[0])} {...ezLinkProps(locale, LINKS.konfigurator)} variant="secondary">
                      {DETAIL.konfigurator}
                    </Button>
                  )}
                  <Button href={`${LINKS.rechner}?ref=${encodeURIComponent(r.id)}`} {...ezLinkProps(locale, LINKS.rechner)} variant="secondary">
                    {DETAIL.rechner}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <MerkButton card={card} variant="full" />
                  <CompareButton card={card} variant="full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technik */}
        <div className="mt-section grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-grid">
          <section aria-labelledby="ez-fakten" className="lg:col-span-7">
            <Heading id="ez-fakten" level={2} size="display-m">
              {DETAIL.fakten}
            </Heading>
            <FactList rows={facts} gap={DETAIL.luecke} className="mt-stack-m" />
            {slip?.korrigiert && <p className="mt-3 text-small text-text-soft">{DETAIL.rutschKorrigiert}</p>}
            <p className="mt-3 text-small text-text-soft">
              {ezarriCredit("daten", locale)}, {t("Stand", DETAIL.stand)} {DATA_STAND.split("-").reverse().join(".")} ·{" "}
              <a href={quelleUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-6 items-center gap-1 underline underline-offset-4">
                {DETAIL.ezarriSeite}
                <ExternalLink aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
                <span className="sr-only">{t("(öffnet ezarri.com)", DETAIL.oeffnetEzarri)}</span>
              </a>
            </p>
          </section>
          <section aria-labelledby="ez-mass" className="flex flex-col gap-8 lg:col-span-5">
            <div>
              <Heading id="ez-mass" level={2} size="title">
                {DETAIL.massTitle}
              </Heading>
              <div className="mt-4">
                <SheetDrawing
                  blatt={r.masse?.blatt_cm}
                  steine={r.masse?.steine_pro_blatt}
                  stein={masz(dezimal(r.masse?.stein_mm, locale))}
                  fuge={dezimal(r.masse?.fuge_mm?.split(" / ")[0], locale)}
                  hexa={formatIdsOf(r).includes("hexa") && !formatIdsOf(r).includes("25mm")}
                />
                {!r.masse?.blatt_cm && <p className="text-small italic text-text-soft">{t("Blattmaß", DETAIL.blattmass)} {DETAIL.luecke}</p>}
              </div>
            </div>
            {formate.length > 0 && (
              <div>
                <h3 className="text-ui text-text">{DETAIL.verpackung}</h3>
                <div className="relative mt-3 overflow-x-auto">
                  <table className="w-full min-w-[22rem] border-t border-line text-left text-small tabular-nums">
                    <caption className="sr-only">{t("Verpackung je Format", DETAIL.verpackungCaption)}</caption>
                    <thead className="text-text-soft">
                      <tr>
                        <th scope="col" className="border-b border-line py-2 pr-3 font-medium">{t("Format", DETAIL.verpackungSpalten?.format)}</th>
                        <th scope="col" className="border-b border-line py-2 pr-3 font-medium">{t("Blatt/Karton", DETAIL.verpackungSpalten?.blatt)}</th>
                        <th scope="col" className="border-b border-line py-2 pr-3 font-medium">{t("m²/Karton", DETAIL.verpackungSpalten?.m2)}</th>
                        <th scope="col" className="border-b border-line py-2 pr-3 font-medium">{t("m²/Palette", DETAIL.verpackungSpalten?.palette)}</th>
                        <th scope="col" className="border-b border-line py-2 font-medium">kg/m²</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formate.map((x) => (
                        <tr key={x.id + x.label}>
                          <th scope="row" className="whitespace-nowrap border-b border-line py-2 pr-3 font-normal text-text">{masz(x.label)}</th>
                          <td className="border-b border-line py-2 pr-3">{x.blatt_pro_karton ?? "–"}</td>
                          <td className="border-b border-line py-2 pr-3">{x.m2_pro_karton ?? "–"}</td>
                          <td className="border-b border-line py-2 pr-3">{x.m2_pro_palette ?? "–"}</td>
                          <td className="border-b border-line py-2">{dezimal(x.kg_pro_m2, locale) ?? "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!pack && <p className="mt-2 text-small italic text-text-soft">{t("Verpackung", DETAIL.verpackung)} {DETAIL.luecke}</p>}
              </div>
            )}
            <ul className="flex flex-col gap-1">
              {sheet && (
                <li>
                  <a href={sheet.href} className="inline-flex min-h-11 items-center gap-2 text-ui text-text underline underline-offset-4" type="application/pdf">
                    <FileText aria-hidden="true" className="size-4" strokeWidth={1.5} />
                    {en ? DETAIL.datenblattPdf(c?.name) : `${DETAIL.datenblatt} ${c?.name ?? ""} (PDF, englisch)`}
                  </a>
                  <p className="text-small text-text-soft">{ezarriCredit("datenblatt", locale)}</p>
                </li>
              )}
              {(r.einsatz || []).some((e) => e.startsWith("pool")) && (
                <li>
                  <Link href="/ezarri/technik/verlegung" className="inline-flex min-h-11 items-center text-ui text-text underline underline-offset-4">
                    {DETAIL.verlegung}
                  </Link>
                </li>
              )}
              {(r.video || []).map((v) => (
                <li key={v}>
                  <a href={v} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-ui text-text underline underline-offset-4">
                    {t(`Video zu ${r.name} bei YouTube`, DETAIL.video?.(r.name))}
                    <ExternalLink aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
                    <span className="sr-only">{t("(öffnet youtube.com)", DETAIL.oeffnetYoutube)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Container>

      {(similar.length > 0 || sameCol.length > 0) && (
        <Section tone="raised" labelledBy="ez-aehnlich" spacing="compact">
          {similar.length > 0 && (
            <>
              <Heading id="ez-aehnlich" level={2} size="display-m">
                {DETAIL.aehnlich}
              </Heading>
              <ul className="mt-stack-m grid grid-cols-2 gap-x-grid gap-y-10 lg:grid-cols-4">
                {similar.map((s, i) => (
                  <li key={s.id} className="reveal" style={staggerStyle(i, 4)}>
                    <MosaicCard card={s} />
                  </li>
                ))}
              </ul>
            </>
          )}
          {sameCol.length > 0 && (
            <>
              <Heading id={similar.length ? undefined : "ez-aehnlich"} level={2} size="title" className={similar.length ? "mt-16" : ""}>
                {DETAIL.passtZu} {c?.name}
              </Heading>
              <ul className="mt-6 grid grid-cols-2 gap-x-grid gap-y-10 lg:grid-cols-4">
                {sameCol.map((s, i) => (
                  <li key={s.id} className="reveal" style={staggerStyle(i, 4)}>
                    <MosaicCard card={s} />
                  </li>
                ))}
              </ul>
            </>
          )}
          <CreditNote className="mt-8" />
        </Section>
      )}
      <Schluss refIds={[r.id]} />
      <CompareBar />
    </>
  );
}
