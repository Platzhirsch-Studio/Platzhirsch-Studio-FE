// /de/ezarri/kollektionen/<kollektion> – Kollektionsseite (Team A, Konzept §3.3), alle 21.
// Kopf mit Datenblatt-Fakten, Raster aller Referenzen (Basis-Mosaike zuerst,
// Safe/Corner/Cove gruppiert), nach 9 Kacheln ein Vollbreiten-Anwendungsbild.
// Individuelle Linien (Custom) sind Dienstleistungen → Links auf Custom Mix (Team C).
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { FileText } from "lucide-react";
import { Button, Container, Heading, Section } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import {
  getCollection,
  getCollectionFacts,
  getCollectionFormats,
  getCollectionIds,
  getDatasheet,
  getGalleryImages,
  getPatterns,
  getReferencesByCollection,
  isServiceCollection,
  toReferenceCard,
} from "@/lib/ezarri/data";
import { EZARRI_WELT_LOCALES, ezarriCredit, ezarriWeltLocaleEnabled, ezarriUrlFor } from "@/lib/ezarri/config";
import { ezLinkProps } from "@/lib/ezarri/deLinks";
import { ezCopy, ezT, herstellerText } from "@/lib/ezarri/lang";
import EzImage from "@/components/Ezarri/Welt/EzImage";
import MosaicCard from "@/components/Ezarri/Katalog/MosaicCard";
import CompareBar from "@/components/Ezarri/Katalog/CompareBar";
import { CreditNote, FactList, PageHead, Schluss, ezCrumbsFor } from "@/components/Ezarri/Welt/parts";
import { ezarriMetadata } from "@/components/Ezarri/Welt/meta";
import { intro, kollektionDescription, kollektionH1 } from "@/lib/ezarri/kollektionSeo";
import { brandNode, collectionPage } from "@/components/Ezarri/Welt/schema";
import { staggerStyle } from "@/lib/ezarri/motion";
import { BAND_NACH, fuellKlasse } from "@/lib/ezarri/raster";

const BASE = "/ezarri/kollektionen";

// Dienstleistungs-Kollektionen → Werkzeuge von Team C (Konzept §2).
// R2 technik P1-4c: /ezarri/custom-mix/{motive,pixel} gibt es nicht (404). Motive,
// Pixel-Bilder und Verläufe planen wir im Gespräch → Beratungsanfrage der Ezarri-Welt.
// R8 (ux P2-7): Beratung einheitlich über /beratung?thema=ezarri (LINKS.beratung).
const SERVICE_DE = {
  "custom-mix": "Eigene Mischung im Mischpult",
  "custom-pixel": "Pixel-Mosaik aus eigenem Bild anfragen",
  "custom-printed": "Druckmotiv im Gespräch planen",
  "standard-printed": "Druckmotive im Gespräch auswählen",
  "standard-pixel": "Pixel-Motive im Gespräch auswählen",
  patterns: "Patterns im Gespräch auswählen",
  "fading-out": "Verlauf im Gespräch planen",
};
// Welle 2: Ziel und Text je Sprache (Beratung = LINKS.beratung der Sprache; englische Texte in copy.en.js KOLLEKTIONEN.service).
function serviceLinkFor(id, locale) {
  const { LINKS, KOLLEKTIONEN } = ezCopy(locale);
  const label = locale !== "de" ? KOLLEKTIONEN.service?.[id] : SERVICE_DE[id];
  if (!label) return null;
  return { href: id === "custom-mix" ? "/ezarri/custom-mix" : LINKS.beratung, label };
}

export function generateStaticParams() {
  // Alle Sprachen der Ezarri-Welt vorrendern (01.11.2026: de, en, fr, it).
  return EZARRI_WELT_LOCALES.flatMap((locale) => getCollectionIds().map((kollektion) => ({ locale, kollektion })));
}
// Technik R7 (r6-technik P0-1): the list above is complete (local data), so
// anything else gets the prerendered 404 instead of an on-demand notFound()
// that Next kept as a cache entry per URL.
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { locale, kollektion } = await params;
  const c = ezarriWeltLocaleEnabled(locale) ? getCollection(kollektion) : null;
  if (!c) return { robots: { index: false, follow: false } };
  const refs = getReferencesByCollection(c.id);
  const { LINIE_LABEL, KOLLEKTIONEN } = ezCopy(locale);
  return ezarriMetadata({
    locale,
    path: `${BASE}/${c.id}`,
    title: locale !== "de" ? KOLLEKTIONEN.metaTitle(c.name, LINIE_LABEL[c.linie] ?? "") : `Ezarri ${c.name} – Glasmosaik ${LINIE_LABEL[c.linie] ?? ""}`.trim(),
    description: kollektionDescription(c, refs, undefined, locale),
    image: c.titelbild?.web,
  });
}

export default async function KollektionPage({ params }) {
  const { locale, kollektion } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const { KOLLEKTIONEN, LINIE_LABEL, LINKS, MISCHUNG, SCHLUSS, STUDIO, TYP_LABEL } = ezCopy(locale);
  const t = ezT(locale);
  const en = locale === "en";
  const c = getCollection(kollektion);
  if (!c) notFound();

  const refs = getReferencesByCollection(c.id);
  const cards = refs.map(toReferenceCard);
  const groups = [
    { id: "mosaik", title: t("Mosaike", KOLLEKTIONEN.mosaike), items: cards.filter((x) => x.typ === "mosaik") },
    { id: "safe-step", title: TYP_LABEL["safe-step"], items: cards.filter((x) => x.typ === "safe-step") },
    { id: "corner", title: TYP_LABEL.corner, items: cards.filter((x) => x.typ === "corner") },
    { id: "cove", title: TYP_LABEL.cove, items: cards.filter((x) => x.typ === "cove") },
  ].filter((g) => g.items.length);
  const facts = getCollectionFacts(c, locale);
  const formats = getCollectionFormats(c);
  const sheet = getDatasheet(c);
  const service = isServiceCollection(c);
  const serviceLink = serviceLinkFor(c.id, locale);
  // Englisch: Ezarris eigene Kollektionsbeschreibung (ezarri.com/en, Nutzung laut Entscheidung Nr. 7) mit Quelle.
  const hersteller = herstellerText(c.beschreibung_en, locale);
  const patterns = c.id === "patterns" ? getPatterns() : [];
  const extraImages = (c.bilder || []).filter((b) => b?.web).slice(0, 6);
  const band = getGalleryImages({ kollektion: c.id, limit: 2 })[1]?.bild ?? c.titelbild;
  const konfSerie = cards.some((x) => x.imKonfigurator) ? c.name : null;
  const path = `${BASE}/${c.id}`;
  const dez = (v) => (en && v ? String(v).replace(/(\d),(\d)/g, "$1.$2") : v);
  const crumbs = ezCrumbsFor(locale, { label: KOLLEKTIONEN.crumb, href: BASE }, { label: c.name });
  const ld = [brandNode(), collectionPage({ locale, path, name: `Ezarri ${c.name}`, description: intro(c, refs, locale), items: cards.map((x) => ({ name: `Ezarri ${x.name}`, href: `/ezarri/mosaike/${x.id}` })) })];

  return (
    <>
      <PageHead crumbs={crumbs} eyebrow={`Ezarri · ${LINIE_LABEL[c.linie] ?? c.linie}`} title={kollektionH1(c, locale)} lead={intro(c, refs, locale)} jsonLd={ld}>
        <div className="mt-stack-m flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {service && serviceLink ? (
            <Button href={serviceLink.href} {...ezLinkProps(locale, serviceLink.href)} arrow>
              {serviceLink.label}
            </Button>
          ) : (
            <Button href={LINKS.muster()} {...ezLinkProps(locale, LINKS.muster())} arrow>
              {t("Muster anfragen", KOLLEKTIONEN.muster)}
            </Button>
          )}
          {konfSerie && (
            <Button href={`${LINKS.konfigurator}?serie=${encodeURIComponent(konfSerie)}`} {...ezLinkProps(locale, LINKS.konfigurator)} variant="secondary">
              {KOLLEKTIONEN.konfigurator}
            </Button>
          )}
        </div>
        {service && <p className="mt-4 max-w-measure text-body text-text-soft">{KOLLEKTIONEN.custom}</p>}
        {hersteller && (
          <figure className="mt-stack-m max-w-measure border-l-2 border-line-strong pl-4" data-ezarri-herstellertext="">
            <figcaption className="text-overline uppercase text-text-soft">{KOLLEKTIONEN.herstellerTitel}</figcaption>
            <blockquote cite={ezarriUrlFor(c.quelle, locale)} className="mt-2 text-body text-pretty text-text">
              <p>{hersteller}</p>
            </blockquote>
            <p className="mt-2 text-small text-text-soft">
              {ezarriCredit("text", locale)} ·{" "}
              <a href={ezarriUrlFor(c.quelle, locale)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-6 items-center underline underline-offset-4">
                {MISCHUNG.quelleLink}
                <span className="sr-only"> {t("(öffnet ezarri.com)", "(opens ezarri.com)", "(ouvre ezarri.com)", "(apre ezarri.com)")}</span>
              </a>
            </p>
          </figure>
        )}
      </PageHead>

      {c.titelbild?.web && (
        <Container className="pb-section">
          <EzImage image={c.titelbild} alt={t(`Ezarri ${c.name}, Anwendungsbild`, KOLLEKTIONEN.anwendungsbild?.(c.name))} ratio="21/9" sizes="100vw" preload credit className="[&>div]:max-md:aspect-[4/5]" />
        </Container>
      )}

      {(facts.length > 0 || formats.length > 0 || sheet) && (
        <Section tone="raised" labelledBy="ez-k-fakten" spacing="compact">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-x-grid">
            <div className="lg:col-span-6">
              <Heading id="ez-k-fakten" level={2} size="title">
                {t("Angaben laut Datenblatt", KOLLEKTIONEN.fakten)}
              </Heading>
              {facts.length > 0 && <FactList rows={facts} className="mt-4" />}
              {sheet && (
                <a href={sheet.href} type="application/pdf" className="mt-4 inline-flex min-h-11 items-center gap-2 text-ui text-text underline underline-offset-4">
                  <FileText aria-hidden="true" className="size-4" strokeWidth={1.5} />
                  {KOLLEKTIONEN.datenblatt}
                </a>
              )}
              <p className="mt-2 text-small text-text-soft">{ezarriCredit("datenblatt", locale)}</p>
            </div>
            {formats.length > 0 && (
              <div className="lg:col-span-6">
                <h3 className="text-ui text-text">{t("Formate", KOLLEKTIONEN.formate)}</h3>
                <div className="relative mt-4 overflow-x-auto">
                  <table className="w-full min-w-[24rem] border-t [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap border-line text-left text-small tabular-nums">
                    <caption className="sr-only">{t(`Formate der Kollektion ${c.name} laut Datenblatt`, KOLLEKTIONEN.formateCaption?.(c.name))}</caption>
                    <thead className="text-text-soft">
                      <tr>
                        <th scope="col" className="border-b border-line py-2 pr-3 font-medium">{t("Format", KOLLEKTIONEN.spalten?.format)}</th>
                        <th scope="col" className="border-b border-line py-2 pr-3 font-medium">{t("Stein", KOLLEKTIONEN.spalten?.stein)}</th>
                        <th scope="col" className="border-b border-line py-2 pr-3 font-medium">{t("Blatt", KOLLEKTIONEN.spalten?.blatt)}</th>
                        <th scope="col" className="border-b border-line py-2 pr-3 font-medium">{t("Dicke", KOLLEKTIONEN.spalten?.dicke)}</th>
                        <th scope="col" className="border-b border-line py-2 font-medium">{t("Verklebung", KOLLEKTIONEN.spalten?.verklebung)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formats.map((f) => (
                        <tr key={f.format}>
                          <th scope="row" className="border-b border-line py-2 pr-3 font-normal">{f.format === "HEXA" ? "Hexa" : `${f.format} mm`}</th>
                          <td className="border-b border-line py-2 pr-3">{dez(f.stein)?.split(" x ").join(" × ") || "–"}</td>
                          <td className="border-b border-line py-2 pr-3">{dez(f.blatt)?.split(" x ").join(" × ") || "–"}</td>
                          <td className="border-b border-line py-2 pr-3">{dez(f.dicke?.split(" / ")[0]) || "–"}</td>
                          <td className="border-b border-line py-2">{f.verklebung || "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      <Container className="py-section">
        {groups.map((g, gi) => (
          <section key={g.id} aria-labelledby={`ez-g-${g.id}`} className={gi ? "mt-section" : ""}>
            <h2 id={`ez-g-${g.id}`} className="font-display text-display-m text-text">
              {g.title} <span className="font-sans text-ui tabular-nums text-text-soft">({g.items.length})</span>
            </h2>
            {/* QM r4: Spalten nach Containerbreite in rem (1 / 2 / 3 / 4 ab 0 / 18 / 34 / 62 rem) – bei
                200 % Text höchstens drei Spalten, das Merken-Herz wird nicht mehr gequetscht. Das Projektbild
                steht nach 12 Kacheln (volle Zeilen bei 1–4 Spalten, vorher „Sponge 50“ allein vor dem Band),
                und eine Musteranfrage-Kachel füllt die letzte Zeile (lib/ezarri/raster.js fuellKlasse). */}
            <div className="@container/mos">
            <ul className="mt-stack-m grid grid-cols-1 gap-x-grid gap-y-10 @[18rem]/mos:grid-cols-2 @[34rem]/mos:grid-cols-3 @[62rem]/mos:grid-cols-4">
              {g.items.flatMap((x, i) => [
                <li key={x.id} className="reveal min-w-0" style={staggerStyle(i, 4)}>
                  <MosaicCard card={x} />
                </li>,
                gi === 0 && i === BAND_NACH - 1 && g.items.length > BAND_NACH && band?.web ? (
                  <li key="band" className="col-span-full">
                    <EzImage image={band} alt={t(`Projekt mit Ezarri ${c.name}`, KOLLEKTIONEN.projektMit?.(c.name))} ratio="21/9" sizes="100vw" className="[&>div]:max-md:aspect-[3/2]" />
                  </li>
                ) : null,
              ])}
              <li className={fuellKlasse(g.items.length)} data-ez-fuellkachel="">
                <Link href={LINKS.muster()} {...ezLinkProps(locale, LINKS.muster())} className="group flex h-full min-h-40 flex-col justify-end gap-2 border border-dashed border-line-strong p-5 transition-colors duration-(--duration-micro) hover:border-ink">
                  <span className="text-small text-text-soft">{STUDIO.muster}</span>
                  <span className="text-ui text-text underline underline-offset-4">{SCHLUSS.secondary}</span>
                </Link>
              </li>
            </ul>
            </div>
          </section>
        ))}
        {patterns.length > 0 && (
          <section aria-labelledby="ez-patterns">
            <h2 id="ez-patterns" className="font-display text-display-m text-text">Patterns ({patterns.length})</h2>
            <ul className="mt-stack-m grid grid-cols-2 gap-x-grid gap-y-8 sm:grid-cols-4 xl:grid-cols-5">
              {patterns.map((p) => (
                <li key={p.id}>
                  <EzImage image={p.bild} alt={t(`Ezarri ${p.name}, Pattern mit ${p.kanaele} Farben`, KOLLEKTIONEN.patternAlt?.(p.name, p.kanaele))} ratio="1/1" sizes="(min-width: 1280px) 18vw, (min-width: 640px) 24vw, 50vw" />
                  <p className="mt-2 text-small text-text">{p.name.replace("Pattern", "Pattern ")}</p>
                  <p className="text-small text-text-soft">{t(`${p.kanaele} Farben`, KOLLEKTIONEN.patternFarben?.(p.kanaele))}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
        {extraImages.length > 0 && (
          <section aria-labelledby="ez-k-bilder" className={groups.length || patterns.length ? "mt-section" : ""}>
            <h2 id="ez-k-bilder" className="text-title text-text">{t(`${KOLLEKTIONEN.anwendung}e`, KOLLEKTIONEN.anwendungen)}</h2>
            <ul className="mt-6 grid grid-cols-1 gap-grid sm:grid-cols-2 lg:grid-cols-3">
              {extraImages.map((b) => (
                <li key={b.web}>
                  <EzImage image={b} alt={t(`Ezarri ${c.name}, Beispiel`, KOLLEKTIONEN.beispiel?.(c.name))} ratio="3/2" sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" />
                </li>
              ))}
            </ul>
          </section>
        )}
        {groups.length === 0 && patterns.length === 0 && extraImages.length === 0 && (
          <p className="max-w-measure text-body text-text-soft">
            {t("Für diese Dienstleistung zeigt Ezarri keine einzelnen Referenzen. Wir planen die Mischung mit Ihnen –", KOLLEKTIONEN.leerService)}{" "}
            <Link href={serviceLink?.href ?? LINKS.customMix} {...ezLinkProps(locale, serviceLink?.href ?? LINKS.customMix)} className="underline underline-offset-4">
              {serviceLink?.label ?? KOLLEKTIONEN.customLink}
            </Link>
            .
          </p>
        )}
        <CreditNote kinds={["bild", "daten"]} className="mt-10" />
      </Container>
      <Schluss />
      <CompareBar />
    </>
  );
}
