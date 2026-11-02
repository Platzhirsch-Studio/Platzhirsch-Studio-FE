// src/components/Katalog/AccessoiresListe.js
// Listenseiten der Accessoire-Welt als Shop (Inhaber 31.10.2026: „echtes
// Webshop-Gefühl“) – ersetzt dort die gruppierte Katalogliste:
//   /accessoires/produkte                       alle Produkte (reihum je Marke)
//   /accessoires/kategorie/<kat>[/seite/<n>]    eine Kategorie (reihum je Marke)
//   /accessoires/marke/<marke>[/seite/<n>]      eine Marke (reihum je Kategorie)
// Server Component: kompakter Kopf, Kategorie-Leiste (Links, crawlbar), die
// Insel ShopGrid (klebende Filterleiste, Sortierung, Raster, „Weitere laden“)
// mit der ersten Seite im Server-HTML, darunter die crawlbare Paginierung.
// Gleiche Routen, Metadaten, Canonicals wie bisher (katalogRoutes.js).
// Händlersatz nur über den Claim-Guard (dealerStatement, MARKE.dealer).
import { useTranslations } from "next-intl";
import JsonLd from "@/components/Reusable/JsonLd";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs, CTABand, Eyebrow, Heading, Lead, LinkArrow, Section } from "@/components/ui";
import { SHOP_CRUMBS } from "./shopCrumbs";
import { schreibenHref } from "@/lib/forms/terminLink";
import { dealerStatement } from "@/lib/legal/claims";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { kategorieKey, textOf } from "@/lib/katalog/schema";
import { heuteIso } from "@/lib/katalog/config";
import { WELTEN, beratungThema, kategoriePath, markePath, produktePath, seitePath } from "@/lib/katalog/welten";
import { kategorienMitProdukten, looksVon, produkteByKategorie, produkteByMarke, produkteByWelt, seitenAnzahl } from "@/lib/katalog";
import { eintraegeFuer, facettenLabels, markenNamen } from "@/lib/katalog/shopIndex";
import { SEITE, facetten } from "@/lib/katalog/shopListe";
import { shopListeCopy } from "@/lib/katalog/shopListeCopy";
import { shopMode } from "@/lib/shop/mode";
import { abteilungen } from "@/lib/shop/shopStart";
import { kategoriePlural, startCopy } from "@/lib/shop/startCopy";
import { Paginierung } from "./KatalogListe";
import LooksBlock from "./LooksBlock";
import ShopGrid from "./ShopGrid";
import ZuletztAngesehen from "./ZuletztAngesehen";
import { produktListeSchema } from "./katalogSchema";

/**
 * @param {{locale: string, welt: string, modus: "uebersicht"|"kategorie"|"marke", marke?: object|null, kategorie?: string|null, seite?: number}} props
 */
export default function AccessoiresListe({ locale, welt, modus, marke = null, kategorie = null, seite = 1 }) {
  const t = useTranslations("katalog");
  const w = WELTEN[welt];
  const wk = `welt.${w.key}`;
  const copy = shopListeCopy(locale);
  const sc = startCopy(locale);
  // Accessoire-Kategorien im Plural (Optik-QA r2: Chips „Duftkerze 124“ und H1 „Duftkerze“ neben „Duftkerzen & Raumduft“).
  const katLabel = (k) => kategoriePlural(locale, k, t(`kategorie.${kategorieKey(k)}`));
  // Ein Zahlenformat für Chips und Trefferzahl („1 725“, vorher „Alle 1725“ neben „1 725 Produkte“).
  const zahl = (n) => n.toLocaleString(locale === "de" ? "de-AT" : locale);

  const weltListe = produkteByWelt(welt);
  const roh = modus === "marke" ? produkteByMarke(marke.slug, welt) : modus === "kategorie" ? produkteByKategorie(welt, kategorie) : weltListe;
  const gruppe = modus === "marke" ? "k" : "m";
  const alle = eintraegeFuer(roh, { heute: heuteIso(), mode: shopMode(process.env) }, gruppe);
  const base = modus === "marke" ? markePath(welt, marke.slug) : modus === "kategorie" ? kategoriePath(welt, kategorie) : produktePath(welt);
  const seiten = modus === "uebersicht" ? 1 : seitenAnzahl(roh);
  const offset = (seite - 1) * SEITE;
  const initial = alle.slice(offset, offset + SEITE);
  const bySlug = new Map(roh.map((p) => [p.slug, p]));

  const title = modus === "marke" ? marke.name : modus === "kategorie" ? katLabel(kategorie) : t(`${wk}.produkteTitle`);
  const lead = modus === "marke" ? copy.markeLead.replace("{marke}", marke.name) : modus === "uebersicht" ? t(`${wk}.produkteLead`) : null;
  const crumbs = [
    { label: homeCrumbLabel(locale), href: "/" },
    ...(w.hub ? [{ label: t(`${wk}.crumb`), href: w.hub }] : []),
    ...(modus === "uebersicht" ? [{ label: copy.produkteCrumb }] : [{ label: copy.produkteCrumb, href: produktePath(welt) }, { label: modus === "marke" ? marke.name : katLabel(kategorie) }]),
  ];
  const dealerLine = marke?.dealer ? dealerStatement(marke.name, locale) : "";
  const beratung = schreibenHref(locale, { context: modus === "marke" ? { thema: beratungThema("accessoires"), produkt: marke.name } : { thema: beratungThema("accessoires") } });

  // Beschriftungen für die Insel (Namespace „katalog“ ist server-only).
  const fl = facettenLabels(weltListe);
  const labels = {
    marke: markenNamen(weltListe),
    kategorie: Object.fromEntries(kategorienMitProdukten(welt).map((k) => [k, katLabel(k)])),
    duft: Object.fromEntries(Object.entries(fl.duft).map(([s, l]) => [s, textOf(l, locale)])),
    material: Object.fromEntries(Object.entries(fl.material).map(([s, l]) => [s, textOf(l, locale)])),
  };
  // Kategorieseite: nur die Kategorien derselben Abteilung (Duftkerzen → Raumdüfte, Diffuser) statt aller 13 –
  // Optik-QA r2: „die Chips dort zeigen fremde Kategorien“. Übersicht: alle Kategorien.
  const geschwister = modus === "kategorie" ? abteilungen(welt).find((a) => a.kategorien.some((x) => x.slug === kategorie))?.kategorien.map((x) => x.slug) : null;
  const kategorien = kategorienMitProdukten(welt)
    .filter((k) => !geschwister || geschwister.includes(k))
    .map((k) => ({ k, n: produkteByKategorie(welt, k).length }));

  return (
    <>
      {/* ItemList nur der Kacheln dieser Seite (vorher: alle 1.700 im HTML). */}
      <JsonLd data={produktListeSchema(initial.map((e) => bySlug.get(e.s)).filter(Boolean), locale, { name: title, path: seitePath(base, seite) })} />
      <Section tone="surface" spacing="none" labelledBy="kat-title" className="pt-6 pb-4 md:pt-10 md:pb-6" data-kat-liste={modus} data-kat-shop="">
        <Breadcrumbs items={crumbs} schema className={SHOP_CRUMBS} />
        <div className="mt-3 flex flex-col gap-x-grid gap-y-3 lg:mt-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-text">
            {/* Telefon: ohne Eyebrow (der Zurück-Link darüber nennt die Ebene schon) und mit kleinerer H1 – Optik-QA r3,
                iPhone SE: Kopf, Intro und Chips füllten den ersten Bildschirm, kein einziges Produkt war zu sehen. */}
            <Eyebrow className="max-sm:hidden">{modus === "uebersicht" ? t(`${wk}.crumb`) : modus === "marke" ? copy.gruppen.marke : t(`${wk}.crumb`)}</Eyebrow>
            <Heading id="kat-title" level={1} size="display-l" className="mt-stack-s text-balance max-sm:mt-1 max-sm:text-display-m">
              {title}
            </Heading>
            {/* Intro unter md erst unter dem Raster (s. u.): oben stand es fünfzeilig vor der Ware. */}
            {lead && (
              <Lead tone="soft" className="mt-3 max-w-measure max-md:hidden">
                {lead}
              </Lead>
            )}
            {dealerLine && (
              <p className="mt-2 max-w-measure text-small text-text" data-kat-dealer={marke.slug}>
                {dealerLine}
              </p>
            )}
          </div>
          {marke && (
            <LinkArrow href={marke.herstellerUrl} target="_blank" className="shrink-0" data-kat-hersteller-marke={marke.slug}>
              {t("marke.herstellerSeite")}
              <span className="sr-only"> ({t("produkt.extern", { marke: marke.name })})</span>
            </LinkArrow>
          )}
        </div>

        {/* Kategorie-Leiste: echte Links (crawlbar), auf Telefonen waagrecht wischbar. */}
        {modus !== "marke" && (
          <nav aria-label={copy.kategorien} className="mt-6" data-kat-kategorien="">
            {/* Telefon/Tablet: rechts ausgeblendet als Hinweis aufs Weiterwischen (pr-10 = letzter Chip am Ende frei). */}
            {/* Auf allen Breiten EINE wischbare Zeile (Optik-QA r3, iPad quer: 14 Chips brachen in zwei Reihen um und
                schoben die Filterleiste an die Unterkante). */}
            <ul className="scrollbar-hide -mx-gutter flex gap-2 overflow-x-auto px-gutter pr-10 pb-1 [mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)] lg:mx-0 lg:px-0">
              <li className="shrink-0">
                {modus === "uebersicht" ? (
                  <span aria-current="page" className="inline-flex min-h-11 items-center border border-ink bg-ink px-4 text-ui text-paper">
                    {/* Gleiches Zahlenformat wie die Trefferzahl („1 725 Produkte“, Optik-QA r2: „Alle 1725“). */}
                    {copy.alle} <span className="ml-1 tabular opacity-80">{zahl(weltListe.length)}</span>
                  </span>
                ) : (
                  <Link href={produktePath(welt)} className="inline-flex min-h-11 items-center border border-line-strong px-4 text-ui text-text transition-colors duration-(--duration-micro) hover:border-ink">
                    {/* Zahl wie bei allen übrigen Chips (Optik-QA r3: „Alle“ hatte als einziger keine). */}
                    {copy.alle} <span className="ml-1 text-text-soft tabular">{zahl(weltListe.length)}</span>
                  </Link>
                )}
              </li>
              {kategorien.map(({ k, n }) => (
                <li key={k} className="shrink-0">
                  {modus === "kategorie" && k === kategorie ? (
                    <span aria-current="page" className="inline-flex min-h-11 items-center border border-ink bg-ink px-4 text-ui text-paper">
                      {katLabel(k)} <span className="ml-1 tabular opacity-80">{zahl(n)}</span>
                    </span>
                  ) : (
                    <Link href={kategoriePath(welt, k)} className="inline-flex min-h-11 items-center border border-line-strong px-4 text-ui text-text transition-colors duration-(--duration-micro) hover:border-ink" data-kat-kategorie-link={k}>
                      {katLabel(k)} <span className="ml-1 text-text-soft tabular">{zahl(n)}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        )}
      </Section>

      <Section tone="surface" spacing="none" className="pb-section" labelledBy="kat-title">
        <ShopGrid
          locale={locale}
          indexUrl="/api/katalog/accessoires"
          produktBase={`/${locale}${produktePath(welt)}`}
          scope={{ key: modus === "uebersicht" ? null : modus, value: modus === "marke" ? marke.slug : modus === "kategorie" ? kategorie : null }}
          gruppe={gruppe}
          initial={initial}
          total={alle.length}
          offset={offset}
          startFacetten={facetten(alle)}
          labels={labels}
          copy={copy}
        />
        <Paginierung base={base} seite={seite} seiten={seiten} t={t} />
        <div className="mt-stack-m max-w-text">
          {lead && <p className="mb-3 text-body text-text-soft md:hidden" data-kat-lead-unten="">{lead}</p>}
          <p className="text-small text-text-soft">{sc.preiseHinweis}</p>
          <p className="mt-1 text-small text-text-soft">{t("hinweis.marken")}</p>
        </div>
      </Section>

      <ZuletztAngesehen locale={locale} copy={{ zuletzt: copy.zuletzt, zuletztLeeren: copy.zuletztLeeren }} />

      {modus === "marke" && seite === 1 && <LooksBlock looks={looksVon(marke.slug, welt)} locale={locale} t={t} markeName={marke.name} />}

      <CTABand id="kat-cta-title" title={t("produkt.beratung")} text={modus === "marke" ? sc.beratungTextMarke.replace("{marke}", marke.name) : sc.beratungText} primary={{ href: beratung, label: t("produkt.beratung") }} />
    </>
  );
}
