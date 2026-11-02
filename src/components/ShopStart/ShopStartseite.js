// src/components/ShopStart/ShopStartseite.js
// Shop-Startseite /<locale>/accessoires (Server Component, kein Client-JS):
//   Hero (Raumszene einer Marke, unverändert, „Bild: <Marke>“) · Serviceleiste
//   aus der Konfiguration · Kategorie-Kacheln (nur Kategorien mit Produkten) ·
//   Edits (Geschenke, Für den Tisch, Ausgewählt, „Neu“ nur mit Inhaber-Liste) ·
//   Markenleiste (Händlersatz nur über dealerStatementList) · Café im selben Haus.
// Kacheln der Edits = ShopKachel (dieselbe Kachel wie Liste, Suche und „Passt dazu“,
// mobil zweispaltig; Preise nur über shopIndex → pausierte Marken ohne Preis). Daten: src/lib/shop/shopStart.js,
// Texte: src/lib/shop/startCopy.js (server-only, nicht im Client-Budget).
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import JsonLd from "@/components/Reusable/JsonLd";
import { Breadcrumbs, Button, Eyebrow, Heading, Lead, LinkArrow, Section } from "@/components/ui";
import LinkDelegate from "@/components/Reusable/LinkDelegate";
import ShopKachel, { RASTER_4 } from "@/components/Katalog/ShopKachel";
import { dealerStatementList } from "@/lib/legal/claims";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { kategorieKey, textOf } from "@/lib/katalog/schema";
import { produktPath, produktePath } from "@/lib/katalog/welten";
import { heuteIso } from "@/lib/katalog/config";
import { eintragVon } from "@/lib/katalog/shopIndex";
import { galerie } from "@/lib/katalog/ausfuehrung";
import { shopListeCopy } from "@/lib/katalog/shopListeCopy";
import { produkteByWelt } from "@/lib/katalog";
import { SHOP_WELT, abteilungLabel, abteilungen, edits, heroLook, shopMarken } from "@/lib/shop/shopStart";
import { kategoriePlural, startCopy } from "@/lib/shop/startCopy";
import { shopStartSchema } from "./shopStartSchema";
import ServiceLeiste from "./ServiceLeiste";

const CAFE_URL = "https://platzhirsch.cafe/";
const KACHEL_SIZES = "(min-width: 768px) 22vw, 46vw";
// Gleiches Raster wie „Passt dazu“ auf der Produktseite (ShopProduktDetail).
// reveal-group: Kacheln kommen beim Hereinscrollen nacheinander (globals.css, nur transform, ruhig = stehen).
// Gleiche Range für alle Kacheln (Optik-QA r1): keine Treppe, wenn eine Reihe im Ruhezustand angeschnitten ist.
const REIHE = "[&>*]:[--reveal-start:0%] [&>*]:[--reveal-end:40%]";
// Spalten per Container-Query (RASTER_4): bei 200 % Textzoom einspaltig statt abgeschnitten (Optik-QA r3).
const GRID = `reveal-group [&>*]:[--reveal-start:0%] [&>*]:[--reveal-end:40%] grid ${RASTER_4} gap-x-4 gap-y-10 md:gap-x-grid`;

/**
 * @param {{ locale: string, service: Array<{id: string, text: string}>, mode?: string, cafeBild?: {src: string, width: number, height: number, credit: string}|null }} props
 *   mode: Shop-Modus (shopMode) – steuert die Badges „Online bestellbar“/„Auf Anfrage“ wie in der Liste
 */
export default function ShopStartseite({ locale, service, mode = "off", cafeBild = null }) {
  const t = useTranslations("katalog");
  const c = startCopy(locale);
  const lc = shopListeCopy(locale);
  const kachelOpts = { heute: heuteIso(), mode };
  const katLabel = (k) => t(`kategorie.${kategorieKey(k)}`);
  // Unterlinks der Kategorie-Kacheln im Plural wie Kopfzeile und Listen (Optik-QA r2).
  // Zahlen wie in Liste und Trefferzahl („1 725“, Optik-QA r2: „Alle 1725“ neben „1 725 Produkte“).
  const zahl = (n) => n.toLocaleString(locale === "de" ? "de-AT" : locale);
  const katPlural = (k) => kategoriePlural(locale, k, katLabel(k));
  const alle = produkteByWelt(SHOP_WELT);
  const marken = shopMarken();
  const gruppen = abteilungen();
  const editListe = edits();
  const hero = heroLook();
  const nameOf = (slug) => marken.find((m) => m.slug === slug)?.name || slug;
  const dealerLine = dealerStatementList(marken.filter((m) => m.dealer).map((m) => m.slug), locale);
  // Optik-QA r1: Spiegelau/Nachtmann standen in der Liste, aber nicht im Händlersatz – ohne Erklärung uneinheitlich.
  // Kein Händlersatz für sie (nicht im Claim-Register), nur der Quellenhinweis; Liste: belegte Marken zuerst.
  const ohneHaendler = marken.filter((m) => !m.dealer).map((m) => m.name);
  const ohneHaendlerLine = ohneHaendler.length ? c.markenOhneHaendler(new Intl.ListFormat(locale, { type: "conjunction" }).format(ohneHaendler)) : "";
  const editTitel = { geschenke: c.editGeschenkeTitle, tisch: c.editTischTitle, auswahl: c.editAuswahlTitle, neu: c.editNeuTitle };
  const editLead = { geschenke: c.editGeschenkeLead, tisch: c.editTischLead, auswahl: c.editAuswahlLead, neu: c.editNeuLead };
  // „Für den Tisch“ verlinkt die Kategorie Gläser: Zahl und Wort nennen genau dieses Ziel (Optik-QA r2: „Alle 684
  // Gläser & Karaffen“ führte auf 485 Gläser, die Kachel „Gläser & Karaffen“ nannte 586).
  const tischZiel = (e) => e.kategorien?.[0];
  const editLink = (e) =>
    e.id === "geschenke"
      ? c.editMehr(c.abteilung.geschenke, zahl(e.anzahl))
      : e.id === "tisch" && tischZiel(e)
        ? c.editMehr(katPlural(tischZiel(e)), zahl(alle.filter((p) => p.kategorie === tischZiel(e)).length))
        : c.ctaAlle(zahl(e.anzahl));
  const crumbs = [{ label: homeCrumbLabel(locale), href: "/" }, { label: c.crumb }];

  return (
    <div data-shop-start="">
      <JsonLd data={shopStartSchema({ locale, name: c.title, description: c.lead(marken.length), gruppen: gruppen.map((g) => ({ ...g, label: abteilungLabel(g, locale, katLabel) })) })} />

      {/* Hero: Text zuerst (mobil oben), Raumszene in ihrem eigenen Format – nichts beschnitten. */}
      <Section tone="surface" spacing="none" labelledBy="shop-title" className="pt-6 pb-10 md:pt-10 md:pb-14">
        <Breadcrumbs items={crumbs} schema className="[&_a]:min-h-11" />
        {/* grid-cols-1 = minmax(0, 1fr): ohne feste Spalte wuchs die implizite Spalte bei 200 % Textzoom auf die
            Breite von „Accessoires“ – H1, Bild und CTA liefen rechts aus dem Bild (Optik-QA r3, WCAG 1.4.4). */}
        <div className="mt-4 grid grid-cols-1 gap-8 lg:mt-stack-m lg:grid-cols-12 lg:items-center lg:gap-grid">
          <div className="min-w-0 lg:col-span-6">
            <Eyebrow>{c.eyebrow}</Eyebrow>
            <Heading id="shop-title" level={1} size="display-l" className="mt-stack-s text-balance break-words">
              {c.title}
            </Heading>
            <Lead tone="soft" className="mt-stack-m max-w-measure">
              {c.lead(marken.length)}
            </Lead>
            <div className="mt-stack-m flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button href={produktePath(SHOP_WELT)} arrow className="max-w-full text-center" data-shop-cta="alle">
                {c.ctaAlle(zahl(alle.length))}
              </Button>
              {editListe.some((e) => e.id === "geschenke") && (
                <LinkArrow href="#shop-edit-geschenke" data-shop-cta="geschenke">
                  {c.ctaGeschenke}
                </LinkArrow>
              )}
            </div>
          </div>
          {hero && (
            <figure className="min-w-0 lg:col-span-6" data-shop-hero={hero.marke}>
              {/* Ohne Fläche dahinter und unter lg in voller Breite: auf iPad hoch stand das Bild mit beigen Balken links
                  und rechts in der Bühne (Optik-QA r2). Ab lg begrenzt die Höhe; nichts wird beschnitten. */}
              <div>
                <Image
                  src={hero.bild.src}
                  width={hero.bild.width}
                  height={hero.bild.height}
                  alt={textOf(hero.bild.alt, locale) || textOf(hero.titel, locale)}
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  loading="eager"
                  fetchPriority="high"
                  quality={75}
                  className="block h-auto w-full lg:mx-auto lg:max-h-[32rem] lg:w-auto lg:max-w-full"
                  data-pin-nopin="true" // Herstellerbild: nicht für Pinterest
                />
              </div>
              <figcaption className="mt-2 text-small text-text-soft">
                {textOf(hero.titel, locale)} · {c.bildVon(hero.markeName)}
              </figcaption>
            </figure>
          )}
        </div>
      </Section>

      <ServiceLeiste items={service} label={c.serviceLabel} />

      {/* Kategorien: Kachel = Hauptkategorie, Unterlinks = weitere Kategorien der Abteilung. */}
      <Section tone="surface" spacing="compact" labelledBy="shop-kategorien" data-shop-kategorien="">
        <Heading id="shop-kategorien" level={2}>
          {c.kategorienTitle}
        </Heading>
        {/* 8 Abteilungen: md gleich 4 Spalten (vorher 3 → letzte Reihe 3+3+2 mit Loch auf Tablet hoch/Phone quer). */}
        <div className="@container mt-8">
        <ul className={`reveal-group ${REIHE} grid ${RASTER_4} gap-x-4 gap-y-8 sm:gap-x-grid`}>
          {gruppen.map((g) => {
            const label = abteilungLabel(g, locale, katLabel);
            // Freisteller zuerst (wie die Produktkacheln), sonst das erste Bild.
            const bild = g.bildProdukt ? galerie(g.bildProdukt).freisteller[0] || g.bildProdukt.bilder?.[0] : null;
            return (
              <li key={g.id} className="flex flex-col" data-shop-abteilung={g.id}>
                <Link href={g.href} className="group flex flex-col text-text no-underline">
                  <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden bg-linen">
                    {bild ? (
                      <Image
                        src={bild.src}
                        width={bild.width}
                        height={bild.height}
                        alt=""
                        sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 45vw"
                        quality={75}
                        className="absolute inset-0 block h-full w-full object-contain p-[6%] mix-blend-multiply transition-transform duration-(--duration-ui) ease-drift motion-safe:group-hover:scale-[1.03] motion-safe:group-focus-visible:scale-[1.03]"
                        data-pin-nopin="true"
                      />
                    ) : null}
                  </div>
                  {/* Mobil 2 Spalten (~165 px): „Wohnaccessoires“ brach in text-lead mitten im Wort („Wohnaccessoire|s“,
                      WebKit ohne Trennmuster) → mobil die Kachel-Namensstufe text-ui (wie ShopKachel), ab sm text-title. */}
                  <h3 className="mt-3 min-h-[2lh] text-ui break-words text-text sm:text-title md:text-ui lg:text-title underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) group-hover:decoration-current">{label}</h3>
                  <p className="mt-1 text-small text-text-soft tabular">{c.produkte(g.anzahl)}</p>
                </Link>
                {g.kategorien.length > 1 && (
                  <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-small">
                    {g.kategorien.map((k) => (
                      <li key={k.slug}>
                        <Link href={k.href} className="inline-flex min-h-8 items-center py-1 text-text-soft underline decoration-line-strong underline-offset-4 transition-colors duration-(--duration-micro) hover:text-text hover:decoration-current">
                          {katPlural(k.slug)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
        </div>
      </Section>

      {/* Edits – nur aus echten Daten; „Neu im Sortiment“ nur mit Inhaber-Liste (NEU_IM_SORTIMENT). */}
      {editListe.map((e, i) => (
        <Section
          key={e.id}
          id={`shop-edit-${e.id}`}
          tone={i % 2 === 0 ? "raised" : "surface"}
          spacing="compact"
          labelledBy={`shop-edit-${e.id}-title`}
          className="scroll-mt-24"
          data-shop-edit={e.id}
        >
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
            <div className="max-w-text">
              <Heading id={`shop-edit-${e.id}-title`} level={2}>
                {editTitel[e.id]}
              </Heading>
              <p className="mt-stack-s text-body text-text-soft">{editLead[e.id]}</p>
            </div>
            {/* QM Zoom 02.11. (iPhone 15, 200 % Textzoom): `shrink-0` ließ „Alle 83 Geschenksets ansehen“ breiter als die
                Spalte werden – der Link lief rechts aus dem Bild (WCAG 1.4.10). max-w-full begrenzt ihn auf die
                Zeilenbreite, der Text bricht dann um; in der Normalansicht steht er unverändert in einer Zeile. */}
            <LinkArrow href={e.href} className="max-w-full shrink-0 [&>span]:min-w-0 [&>span]:[overflow-wrap:anywhere]">
              {editLink(e)}
            </LinkArrow>
          </div>
          <div className="@container mt-8">
            <LinkDelegate as="ul" className={GRID}>
              {e.produkte.map((p) => (
                <li key={p.slug} data-kat-item="" data-marke={p.marke} data-kategorie={p.kategorie}>
                  <ShopKachel ohneAuswahl={e.id === "auswahl"} e={eintragVon(p, kachelOpts)} href={`/${locale}${produktPath(p.welt, p.slug)}`} locale={locale} marke={nameOf(p.marke)} copy={lc} sizes={KACHEL_SIZES} auf={i % 2 === 0 ? "raised" : "surface"} />
                </li>
              ))}
            </LinkDelegate>
          </div>
        </Section>
      ))}

      {/* Markenleiste: Namen als Text (keine Logos ohne Freigabe), Händlersatz nur über den Claim-Guard. */}
      <Section tone="surface" spacing="compact" labelledBy="shop-marken" data-shop-marken="">
        <Heading id="shop-marken" level={2}>
          {c.markenTitle}
        </Heading>
        <ul className="mt-8 grid grid-cols-2 border-t border-line sm:grid-cols-3 lg:grid-cols-4">
          {[...marken.filter((m) => m.dealer), ...marken.filter((m) => !m.dealer)].map((m) => (
            <li key={m.slug} className="border-b border-line">
              <Link
                href={m.href}
                className="group flex min-h-16 flex-col justify-center py-3 pr-4 text-text no-underline"
                data-shop-marke={m.slug}
              >
                <span className="font-display text-title underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) group-hover:decoration-current">{m.name}</span>
                <span className="text-small text-text-soft tabular">{c.produkte(m.anzahl)}</span>
              </Link>
            </li>
          ))}
        </ul>
        {dealerLine && <p className="mt-stack-s max-w-measure text-small text-text-soft" data-shop-dealer="">{dealerLine}</p>}
        {ohneHaendlerLine && <p className="mt-1 max-w-measure text-small text-text-soft" data-shop-ohne-haendler="">{ohneHaendlerLine}</p>}
        <p className="mt-1 max-w-measure text-small text-text-soft">{t("hinweis.marken")}</p>
        {/* Preis-Fußnote bei den übrigen Hinweisen statt verwaist unter dem Café-Band (Optik-QA r2); „USt.“ wie Produktseite und Warenkorb. */}
        <p className="mt-1 max-w-measure text-small text-text-soft" data-shop-preise-hinweis="">{c.preiseHinweis}</p>
      </Section>

      {/* Café im selben Haus (eigene Seite, extern). */}
      <Section tone="band" spacing="compact" labelledBy="shop-cafe" data-shop-cafe="">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-grid">
          <div className={cafeBild ? "lg:col-span-6" : "lg:col-span-8"}>
            <Eyebrow>{c.cafeEyebrow}</Eyebrow>
            <Heading id="shop-cafe" level={2} className="mt-stack-s">
              {c.cafeTitle}
            </Heading>
            <p className="mt-stack-s max-w-measure text-body text-text-soft">{c.cafeText}</p>
            <LinkArrow href={CAFE_URL} target="_blank" className="mt-2" data-shop-cafe-link="">
              {c.cafeLink}
            </LinkArrow>
          </div>
          {cafeBild && (
            <figure className="lg:col-span-6">
              <Image src={cafeBild.src} width={cafeBild.width} height={cafeBild.height} alt={c.cafeBild} sizes="(min-width: 1024px) 45vw, 100vw" quality={75} className="block h-auto w-full" />
              <figcaption className="mt-2 text-small text-text-soft">{cafeBild.credit}</figcaption>
            </figure>
          )}
        </div>
      </Section>

    </div>
  );
}
