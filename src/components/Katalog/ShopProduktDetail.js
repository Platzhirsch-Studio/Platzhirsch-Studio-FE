// src/components/Katalog/ShopProduktDetail.js
// Produktseite der Accessoire-Welt als Shop-Seite (Inhaber 31.10.2026: „echtes
// Webshop-Gefühl“) – /accessoires/produkte/<slug>. Andere Welten nutzen weiter
// ProduktDetail.js. Server Component; Inseln: ProductGallery (Bühne, Wischen,
// Lightbox mit Zoom – gleiche Komponente wie die Möbel-Produktseite),
// KaufBox (über ReservierenSlot), MerkenButton, ggf. Konfigurator.
// Aufbau:
//   links  Galerie (Freisteller zuerst, dann Raumbilder – „wie es im Raum wirkt“ –, dann Details), „Bild: <Marke>“
//   rechts (ab lg klebend) Marke · Kategorie, Name, Kurztext, Händlersatz (Claim-Guard),
//          Kaufbox bzw. Preisblock + Anfrage, Liefer-/Abholhinweis, Merken,
//          Akkordeon: Details & Pflege (nur Herstellermerkmale), Maße,
//          Versand & Abholung, Widerruf & Rückgabe (Kanzlei-Slot)
//   darunter Räume (Looks), „Passt dazu“, „Mehr von <Marke>“, „Zuletzt angesehen“.
// Regeln: Herstellerbilder unverändert (object-contain, data-pin-nopin),
// Preise nur aus preisAktiv (pausierte Marken: keiner), JSON-LD Product mit
// Offer nur bei anzeigbarem Preis, nie aggregateRating/review/availability
// (keine Lagerdaten). Keine Lieferzeiten (Angabe ausstehend).
import { useTranslations } from "next-intl";
import { Truck, Store } from "lucide-react";
import JsonLd from "@/components/Reusable/JsonLd";
import LinkDelegate from "@/components/Reusable/LinkDelegate";
import { Link } from "@/i18n/navigation";
import { Accordion, AccordionItem, Breadcrumbs, Button, Heading, LinkArrow, Section } from "@/components/ui";
import ProductGallery from "@/components/ShopCatalog/productGallery";
import { schreibenHref } from "@/lib/forms/terminLink";
import { dealerStatement } from "@/lib/legal/claims";
import { kategorieKey, textOf } from "@/lib/katalog/schema";
import { heuteIso } from "@/lib/katalog/config";
import { WELTEN, beratungThema, kategoriePath, markePath, produktPath, produktePath } from "@/lib/katalog/welten";
import { looksMitProdukt, markeBySlug, produkteByMarke } from "@/lib/katalog";
import { galerie, konfiguratorDaten } from "@/lib/katalog/ausfuehrung";
import { eintragVon, passtDazu } from "@/lib/katalog/shopIndex";
import { shopListeCopy } from "@/lib/katalog/shopListeCopy";
import { legalSlot, legalSlotReleased } from "@/lib/shop/legal";
import { sellableOf } from "@/lib/shop/catalog";
import { shopMode } from "@/lib/shop/mode";
import Konfigurator from "./Konfigurator";
import LooksBlock from "./LooksBlock";
import MerkenButton from "./MerkenButton";
import ShopKachel, { RASTER_4 } from "./ShopKachel";
import { kategoriePlural } from "@/lib/shop/startCopy";
import { shopGalerie } from "./shopGalerie";
import { SHOP_CRUMBS } from "./shopCrumbs";
import { studioFassung } from "./studioFond";
import { massText } from "./kaufAuswahl";
import { halbgeviert, keinBindestrichUmbruch, ohneVersalien, shopTitel, titelTeile, trennerSchutz } from "./shopTitel";
import ReservierenSlot from "./ReservierenSlot";
import ZuletztAngesehen from "./ZuletztAngesehen";
import { produktSchema } from "./katalogSchema";
import { anzeigePreis, formatDatum, preisOffer, preisTexte } from "./preis";

const DATUM = { de: "de-AT", en: "en-GB", fr: "fr-FR", it: "it-IT" };
const datumLang = (iso, locale) => {
  try {
    // Geschützte Leerzeichen: das Datum bricht nie um („geprüft am 31.“ / „Oktober 2026“, Optik-QA r2).
    return new Intl.DateTimeFormat(DATUM[locale] || "de-AT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`)).replace(/ /g, " ");
  } catch {
    return iso;
  }
};
// reveal-group: „Passt dazu“/„Weitere“ kommen beim Hereinscrollen nacheinander (nur transform, ruhig = stehen).
// Gleiche Range für alle Kacheln (Optik-QA r1): angeschnittene Reihe steht nicht treppenförmig.
// Spalten nach der Breite des Abschnitts in rem (RASTER_4, Container-Query): bei 200 % Textzoom eine Spalte statt
// zwei überlappender (Optik-QA r3). Normale Schrift: Telefon 2, ab ~670 px Abschnittsbreite 4 – wie bisher.
const GRID = `reveal-group [&>*]:[--reveal-start:0%] [&>*]:[--reveal-end:40%] grid ${RASTER_4} gap-x-4 gap-y-10 md:gap-x-grid`;
// Telefon quer (niedrig, ≥ 640 px breit, Variante [@media(min-width:640px)_and_(max-height:500px)]): zweispaltig wie ab lg –
// vorher kam der Name erst nach 2,6 Bildschirmen (Optik-QA r3). Klassen ausgeschrieben, damit Tailwind sie findet.


/**
 * @param {{locale: string, p: object, marke: object}} props
 */
export default function ShopProduktDetail({ locale, p, marke }) {
  const t = useTranslations("katalog");
  const c = shopListeCopy(locale);
  const w = WELTEN[p.welt];
  const wk = `welt.${w.key}`;
  const kat = t(`kategorie.${kategorieKey(p.kategorie)}`);
  // Sichtbare Kategorie-Links im Plural wie Kategorieseite und Kopfzeile („Duftkerzen“, „Gläser“ – Optik-QA r3);
  // JSON-LD und Merkliste behalten den Singular (eine Sache).
  const katListe = kategoriePlural(locale, p.kategorie, kat);
  const caption = t("produkt.bildQuelle", { marke: marke.name });
  const dealerLine = marke.dealer ? dealerStatement(marke.name, locale) : "";
  const beratung = schreibenHref(locale, { context: { thema: beratungThema(p.bereich), produkt: `${marke.name} ${p.name}` } });
  const heute = heuteIso();
  const mode = shopMode(process.env);
  const preis = anzeigePreis(p);
  const pt = preisTexte(preis, t, locale);
  const offer = preisOffer(preis, `https://platzhirsch.studio/${locale}${produktPath(p.welt, p.slug)}`);
  const kaufbar = Boolean(preis?.art === "verkaufspreis" && sellableOf(p, { heute, mode }));
  const g = galerie(p);
  // Shop: Freisteller zuerst (wie Kachel, Merkliste und JSON-LD), Raumbilder direkt danach –
  // sonst eröffnet z. B. Zalto Gravitas Omega mit einem 16:7-Szenenfoto und die Bühne wird flach.
  // Zalto: Hauptbild als seitlich verlängerte 5:4-Fassung (studioFond.js) – füllt die Bühne statt als
  // schmales graues 2:3-Rechteck zwischen hellen Seitenbalken zu stehen (Optik-QA r1).
  const bilder = shopGalerie(g).map((b, i) => {
    const studio = i === 0 ? studioFassung(b.src, p.marke, "5x4") : null;
    return studio ? { ...b, src: studio, width: Math.round(b.height * 1.25), height: b.height } : b;
  });
  const erstes = bilder[0];
  // Nie hochskalieren (Optik-QA r1: Cire Trudon 733 px erschien auf iPad hoch 1,29-fach): die Bühne
  // wird höchstens so breit, wie das erste Bild bei ihrem Seitenverhältnis Pixel hat. Rahmen wie ProductGallery.
  const buehne = erstes ? Math.min(2, Math.max(1.25, erstes.width / erstes.height)) : 1.5;
  // Tablet/Desktop mit 2x-Display (iPad): höchstens halb so breit, damit 733-px-Bilder (Cire Trudon) auch in
  // Gerätepixeln nicht hochskaliert werden (Optik-QA r2: 1,08–1,29-fach). Telefone: volle Breite bleibt wichtiger.
  const buehneMax = erstes ? Math.round(Math.max(erstes.width, erstes.height * buehne)) : null;
  const konfig = p.ausfuehrungen?.length ? konfiguratorDaten(p, locale) : null;
  // Mit Kaufbox wählt die Kaufbox die Ausführung; der Konfigurator bleibt nur, wenn er Bilder je Option zeigt.
  const zeigeKonfig = konfig && (!kaufbar || konfig.gruppen.some((gr) => gr.optionen.some((o) => o.bild)));
  const crumbs = [
    { label: "Home", href: "/" },
    ...(w.hub ? [{ label: t(`${wk}.crumb`), href: w.hub }] : []),
    { label: c.produkteCrumb, href: produktePath(p.welt) },
    { label: katListe, href: kategoriePath(p.welt, p.kategorie) },
    { label: shopTitel(p.name) },
  ];
  const titel = titelTeile(p.name);
  const merkItem = {
    id: `katalog-${p.slug}`,
    name: `${marke.name} ${p.name}`,
    image: studioFassung((g.freisteller[0] || p.bilder[0])?.src, p.marke, "frei") || (g.freisteller[0] || p.bilder[0])?.src || null,
    category: kat,
    href: produktPath(p.welt, p.slug),
    slug: p.slug,
  };
  const widerruf = legalSlot("widerruf");
  const versand = legalSlot("versand");

  const opts = { heute, mode };
  const kachel = (x, hinweis = null, auf = "surface") => (
    <li key={x.slug}>
      <ShopKachel
        e={eintragVon(x, opts)}
        href={`/${locale}${produktPath(x.welt, x.slug)}`}
        locale={locale}
        marke={markeBySlug(x.marke)?.name || x.marke}
        copy={c}
        hinweis={hinweis}
        sizes="(min-width: 768px) 22vw, 46vw"
        auf={auf}
      />
    </li>
  );
  const passt = passtDazu(p, 4);
  const schonGezeigt = new Set([p.slug, ...passt.map((x) => x.p.slug)]);
  const weitere = produkteByMarke(marke.slug, p.welt).filter((x) => !schonGezeigt.has(x.slug) && x.bilder.length).slice(0, 4);

  return (
    <>
      <JsonLd data={produktSchema(p, marke, locale, kat, offer)} />
      <Section tone="surface" spacing="none" labelledBy="kat-produkt-title" className="pt-6 pb-12 md:pt-10 md:pb-16" data-kat-detail={p.slug} data-kat-shop="">
        <Breadcrumbs items={crumbs} schema className={SHOP_CRUMBS} />
        <div className={`mt-4 grid grid-cols-1 gap-y-6 lg:mt-6 lg:grid-cols-12 lg:gap-x-12 [@media(min-width:640px)_and_(max-height:500px)]:grid-cols-12 [@media(min-width:640px)_and_(max-height:500px)]:gap-x-8`}>
          {/* Ab lg klebt die Galerie (Optik-QA r2): vorher klebte die rechte Spalte, die weit höher als der Bildschirm ist –
              wirkungslos, links blieb ab ~900 px Scrolltiefe die Hälfte leer. */}
          <div className={`lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:col-span-7 lg:self-start [@media(min-width:640px)_and_(max-height:500px)]:sticky [@media(min-width:640px)_and_(max-height:500px)]:top-[calc(var(--header-h)+0.5rem)] [@media(min-width:640px)_and_(max-height:500px)]:col-span-6 [@media(min-width:640px)_and_(max-height:500px)]:self-start [@media(min-width:640px)_and_(max-height:500px)]:[&_.snap-center]:max-h-[68svh]`}>
            {erstes ? (
              // Telefon: die Galerie deckelt die Bühne auf 28svh (Möbelseiten) – im Shop stand das Produkt damit als
              // schmales Bild zwischen hellen Balken (Optik-QA r2, iPhone SE). Hier 36svh: 5:4-Bühne füllt die Breite und
              // Marke/Name stehen auf dem iPhone SE noch im ersten Bildschirm. Linksbündig an der Spaltenkante statt
              // zentriert eingerückt (Optik-QA r2 iPad: Baobab 153 px, Trudon 219 px gegenüber 80 px Spaltenkante).
              <figure
                // Querformat (≥ 1,2 : 1, z. B. Zalto 5:4): keine Höhenkappe – sonst stand die Bühne schmaler als die
                // Spalte mit hellen Balken daneben (Nachprüfung r3, iPhone SE). Hochformat: 36svh.
                className={`max-w-(--buehne-max) ${erstes.width / erstes.height >= 1.2 ? "max-sm:[&_.snap-center]:max-h-none" : "max-sm:[&_.snap-center]:max-h-[36svh]"} md:[@media(min-resolution:2dppx)]:max-w-(--buehne-max-2x)`}
                style={buehneMax ? { "--buehne-max": `${buehneMax}px`, "--buehne-max-2x": `${Math.round(buehneMax / 2)}px` } : undefined}
                data-kat-buehne-max={buehneMax || undefined}
              >
                <ProductGallery images={bilder.map((b) => b.src)} alt={`${marke.name} ${p.name}`} ratio={erstes.width / erstes.height} />
                <figcaption className="mt-1 text-small text-text-soft">{caption}</figcaption>
              </figure>
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center bg-linen text-small text-text-soft">{t("produkt.keinBild")}</div>
            )}
          </div>

          <div className={`lg:col-span-5 [@media(min-width:640px)_and_(max-height:500px)]:col-span-6`}>
            <div>
              <p className="text-overline uppercase text-text-soft">
                <Link href={markePath(p.welt, marke.slug)} className="inline-flex min-h-6 items-center text-text underline decoration-transparent underline-offset-4 hover:decoration-current" data-kat-marke-link={marke.slug}>
                  {marke.name}
                </Link>
                <span aria-hidden="true"> · </span>
                <Link href={kategoriePath(p.welt, p.kategorie)} className="underline decoration-transparent underline-offset-4 hover:decoration-current">
                  {katListe}
                </Link>
              </p>
              <Heading id="kat-produkt-title" level={1} size="display-m" className="mt-2 text-balance">
                {/* Zusatz nach „ – “ in eigener Zeile: kein Halbgeviertstrich am Zeilenende (Optik-QA r2). */}
                {titel.haupt}
                {titel.zusatz && (
                  <>
                    <span className="sr-only"> – </span>
                    <span className="block">{titel.zusatz}</span>
                  </>
                )}
              </Heading>
              {p.serie && (
                <p className="mt-2 text-small text-text-soft">
                  {t("produkt.serie")}: {p.serie}
                </p>
              )}
              {/* „Ibiza Bohemia - Travel From Home Candle“ → Halbgeviertstrich wie im Titel (Optik-QA r2). */}
              <p className="mt-4 max-w-measure text-body text-text-soft">{trennerSchutz(halbgeviert(textOf(p.kurz, locale)))}</p>
              {dealerLine && (
                <p className="mt-2 max-w-measure text-small text-text" data-kat-dealer={marke.slug}>
                  {dealerLine}
                </p>
              )}

              <div className="mt-6 border-t border-line pt-5">
                {kaufbar ? (
                  <ReservierenSlot p={p} marke={marke} preis={preis} locale={locale} hinweis={pt ? keinBindestrichUmbruch(t("preis.stand", { datum: formatDatum(preis.stand, locale) })) : null} />
                ) : (
                  <>
                    {pt && (
                      <div data-kat-preisblock={preis.art}>
                        <p className="text-small text-text-soft">{pt.land}</p>
                        {pt.varianten.length > 0 && (
                          <dl className="mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1 text-body">
                            {pt.varianten.map((v) => (
                              <div key={v.name} className="contents">
                                <dt className="text-text-soft">{v.name}</dt>
                                <dd className="text-text tabular">{v.preis}</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                        {pt.zeilen.map((z) => (
                          <p key={z} className="mt-1 text-body text-text tabular">
                            {z}
                          </p>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex flex-col items-start gap-2">
                      <ReservierenSlot p={p} marke={marke} preis={preis?.art === "verkaufspreis" ? preis : null} locale={locale} />
                      {!zeigeKonfig && (
                        <Button href={beratung} variant="primary" arrow data-kat-beratung={p.slug}>
                          {t("produkt.beratung")}
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {kaufbar && (
                  <ul className="mt-4 space-y-2 border-t border-line pt-4 text-small text-text" data-kat-lieferung="">
                    <li className="flex gap-3">
                      <Truck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-text-soft" strokeWidth={1.5} />
                      <span>
                        {c.liefern}
                        <span className="block text-text-soft">{c.lieferKosten}</span>
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <Store aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-text-soft" strokeWidth={1.5} />
                      <span>{c.abholung}</span>
                    </li>
                  </ul>
                )}
              </div>

              {zeigeKonfig && (
                <Konfigurator
                  slug={p.slug}
                  locale={locale}
                  produkt={`${marke.name} ${p.name}`}
                  thema={beratungThema(p.bereich)}
                  daten={konfig}
                  texte={{
                    titel: t("produkt.ausfuehrungTitel"),
                    gewaehlt: t("produkt.ausfuehrungGewaehlt", { auswahl: "{auswahl}" }),
                    hinweis: t("produkt.ausfuehrungHinweis"),
                    vorschau: t("produkt.vorschau", { auswahl: "{auswahl}" }),
                    beratung: t("produkt.beratung"),
                    bildQuelle: caption,
                  }}
                />
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1">
                <MerkenButton item={merkItem} label={t("produkt.merken")} />
                <LinkArrow href={p.herstellerUrl} target="_blank" data-kat-hersteller={p.slug}>
                  {t("produkt.hersteller")}
                  <span className="sr-only"> ({t("produkt.extern", { marke: marke.name })})</span>
                </LinkArrow>
              </div>

              <Accordion className="mt-6" headingLevel={2}>
                {(p.merkmale.length > 0 || p.designer) && (
                  <AccordionItem title={c.detailsTitel} headingLevel={2} open>
                    {p.merkmale.length > 0 && (
                      // Gleiche Größe wie der übrige Spaltentext (vorher ~18 px neben 14 px); Versalien der Hersteller-
                      // daten („CLASSIQUE: …“) in gemischter Schreibung wie im Namen (Optik-QA r2).
                      <ul className="list-disc space-y-1 pl-5 text-small">
                        {p.merkmale.map((m, i) => (
                          // „Gewicht 500 g · bis zu 50 Stunden“: Kommas statt „·“ wie bei den Ausführungen (Optik-QA r3, iPad
                          // quer: hängender Mittelpunkt am Zeilenende in der schmalen Spalte). Werte bleiben.
                          <li key={i}>{trennerSchutz(ohneVersalien(massText(textOf(m, locale)) || ""))}</li>
                        ))}
                      </ul>
                    )}
                    {p.designer && (
                      <p className="mt-2">
                        {t("produkt.designer")}: {p.designer}
                      </p>
                    )}
                    <p className="mt-3 text-small">{t("produkt.angaben", { datum: datumLang(p.stand, locale) })}</p>
                  </AccordionItem>
                )}
                {p.masse?.length > 0 && (
                  <AccordionItem title={c.masseTitel} headingLevel={2}>
                    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1">
                      {p.masse.map((m) => (
                        <div key={m.key} className="contents">
                          <dt>{t(`mass.${m.key}`)}</dt>
                          <dd className="text-text tabular">{m.wert}</dd>
                        </div>
                      ))}
                    </dl>
                  </AccordionItem>
                )}
                {kaufbar && (
                  <AccordionItem title={c.versandTitel} headingLevel={2}>
                    <p>{c.liefern}.</p>
                    <p className="mt-2">{c.lieferKosten}</p>
                    <p className="mt-2">{c.abholung}</p>
                    <p className="mt-2 text-small">{legalSlotReleased(versand) ? versand.text : c.ausstehend}</p>
                  </AccordionItem>
                )}
                {kaufbar && (
                  <AccordionItem title={c.rueckgabeTitel} headingLevel={2}>
                    <p>{legalSlotReleased(widerruf) ? widerruf.text : c.ausstehend}</p>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          </div>
        </div>
      </Section>

      <LooksBlock looks={looksMitProdukt(p.slug)} locale={locale} t={t} markeName={marke.name} aktuell={p.slug} />

      {passt.length > 0 && (
        <Section tone="surface" spacing="compact" labelledBy="kat-passend-title" data-kat-passend={p.slug}>
          <Heading id="kat-passend-title" level={2}>
            {c.passt}
          </Heading>
          <div className="@container mt-8">
            <LinkDelegate as="ul" className={GRID}>
              {passt.map((x) => kachel(x.p, x.hinweis ? textOf(x.hinweis, locale) : null))}
            </LinkDelegate>
          </div>
          <LinkArrow href={kategoriePath(p.welt, p.kategorie)} className="mt-6">
            {c.mehrAus.replace("{kategorie}", katListe)}
          </LinkArrow>
        </Section>
      )}

      {weitere.length > 0 && (
        <Section tone="raised" spacing="compact" labelledBy="kat-weitere-title">
          <Heading id="kat-weitere-title" level={2}>
            {t("produkt.weitere", { marke: marke.name })}
          </Heading>
          <div className="@container mt-8">
            <LinkDelegate as="ul" className={GRID}>
              {/* Gleicher Haupttitel (Assouline „Ibiza Bohemia“ = Bildband neben der Kerze „Ibiza Bohemia – …“): die
                  Kategorie als Hinweis, sonst wirkt die Kachel wie das gerade geöffnete Produkt (Optik-QA r3). Gleiche Kategorie
                (XL-Kerze): der volle Name unterscheidet, seit Kachelnamen nicht mehr gekappt werden. */}
              {weitere.map((x) => kachel(x, titelTeile(x.name).haupt === titel.haupt && x.kategorie !== p.kategorie ? t(`kategorie.${kategorieKey(x.kategorie)}`) : null, "raised"))}
            </LinkDelegate>
          </div>
          <LinkArrow href={markePath(p.welt, marke.slug)} className="mt-6">
            {t("produkt.alleVonMarke", { marke: marke.name })}
          </LinkArrow>
        </Section>
      )}

      <ZuletztAngesehen
        locale={locale}
        copy={{ zuletzt: c.zuletzt, zuletztLeeren: c.zuletztLeeren }}
        aktuell={{ s: p.slug, n: p.name, b: marke.name, h: produktPath(p.welt, p.slug), i: merkItem.image }}
      />
    </>
  );
}
