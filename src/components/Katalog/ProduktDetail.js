// src/components/Katalog/ProduktDetail.js
// Produktdetail des statischen Herstellerkatalogs (/<welt>/produkte/<slug>).
// Server Component; Inseln: MerkenButton (Merkliste nimmt statische Einträge
// mit href/Bild auf, wie Ezarri-Konfigurator und Bodensee-Licht) und – nur bei
// `ausfuehrungen` – Konfigurator (Vorschau + Auswahl + „Beratung anfragen“ mit Ausführung).
// Galerie (Inhaber-Auftrag 31.10.2026): Raumbilder (typ "ambiente") zuerst und groß
// („So wirkt es im Raum“), danach Freisteller und Details; nur das erste Bild wird
// vorgeladen, alle anderen lazy. Inhaber 03.11.2026: Hero = detailBild (kachelBild.js:
// Raumbild > Freisteller > bilder[0]); og:image/JSON-LD/Sitemap der Seite folgen ihm. Darunter „Passend dazu“ (zubehoer + verwandt) und
// „Ganze Räume ansehen“ (MARKE.looks mit diesem Produkt).
// Regeln: Herstellerbilder unverändert (object-contain, Rahmen folgt dem
// Bildformat, data-pin-nopin, „Bild: <Marke>“), keine Preise, Händlersatz nur
// über den Claim-Guard (dealerStatement, nur bei MARKE.dealer), JSON-LD
// Product ohne offers/price/aggregateRating/review.
import Image from "next/image";
import { useTranslations } from "next-intl";
import JsonLd from "@/components/Reusable/JsonLd";
import { Breadcrumbs, Button, Eyebrow, Heading, LinkArrow, Section } from "@/components/ui";
import { schreibenHref } from "@/lib/forms/terminLink";
import { dealerStatement } from "@/lib/legal/claims";
import { bildTyp, kategorieKey, textOf } from "@/lib/katalog/schema";
import { WELTEN, beratungThema, kategoriePath, markePath, produktPath, produktePath } from "@/lib/katalog/welten";
import { looksMitProdukt, markeBySlug, produkteByMarke, querverweiseVon, verwandteVon, zubehoerVon } from "@/lib/katalog";
import { galerie, konfiguratorDaten } from "@/lib/katalog/ausfuehrung";
import BildZoom from "./BildZoom";
import Konfigurator from "./Konfigurator";
import LooksBlock from "./LooksBlock";
import MerkenButton from "./MerkenButton";
import ProduktKachel from "./ProduktKachel";
import { staggerStyle } from "@/components/Landing/motionLanding";
import { produktSchema } from "./katalogSchema";
import { anzeigePreis, preisOffer, preisTexte } from "./preis";
import ReservierenSlot from "./ReservierenSlot";
import { planerLinkFuer } from "./planerLink";
import { ohneKonfigDoppel } from "./galerieDoppel";
import { detailBild, leitbild } from "./kachelBild";
import { anzeigeName, produktTitel, produktTitelGroesse } from "./produktTitel";
import { fitHeading } from "@/components/Landing/typoLanding";
import { softHyphenate } from "@/components/Landing/silben";

const DATUM = { de: "de-AT", en: "en-GB", fr: "fr-FR", it: "it-IT" };
const datum = (iso, locale) => {
  try {
    return new Intl.DateTimeFormat(DATUM[locale] || "de-AT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
  } catch {
    return iso;
  }
};

/** Herstellerbild unverändert: Rahmen folgt dem Bildformat. */
// Optik-QA 01.11.2026: Höhe auch an die Bildschirmhöhe gebunden – am Handy quer (390 px)
// war das Raumbild fast zwei Bildschirme hoch.
// `kachel` (QM R3): im zweispaltigen Raster ein gleicher quadratischer Leinenrahmen für
// alle Bilder – sonst standen Hoch- und Querformat versetzt, Bildunterschriften ungleich hoch.
// QM R3 (Küche/Bad/Outdoor, 02.11.2026):
// - nie stärker vergrößert als 1,33-fach auf Retina (dpr 2): kleine Herstellerbilder (BORA-
//   Raumbild 960 px) wurden auf 738 CSS-px gezogen und wirkten weich – jetzt höchstens
//   Originalbreite ÷ 1,5 CSS-px; `sizes` nennt diese Breite, damit der Browser die passende
//   Datei wählt (und ihre Auflösung richtig meldet);
// - Breite statt max-height begrenzt (Höhe ≤ maxH über das Seitenverhältnis) – vorher
//   blieben links/rechts 4 px Leinen-Streifen, weil object-contain im zu breiten Kasten saß;
// - Klick/Enter vergrößert das Bild (BildZoom, natives <dialog>).
// QM R4: Kachelrahmen im mittleren Format der Reihe (statt immer quadratisch) – zwei
// Hochformat-Ansichten standen sonst mit breiten Leinenbalken links und rechts im Quadrat.
export function kachelFormat(bilder = []) {
  const r = bilder.filter((b) => b?.width && b?.height).map((b) => b.width / b.height).sort((a, b) => a - b);
  if (!r.length) return 1;
  const m = r[Math.floor((r.length - 1) / 2)];
  return Math.min(1.6, Math.max(0.6, m));
}

function Bild({ b, locale, caption, sizes, zoom, preload = false, maxH = "min(34rem,80svh)", kachel = false, kachelAr = 1 }) {
  const alt = textOf(b.alt, locale);
  const ratio = b.width && b.height ? b.width / b.height : 1;
  const maxW = Math.round((b.width || 1200) / 1.5);
  const bildSizes = kachel ? sizes : `(min-width: 1024px) min(55vw, ${maxW}px), min(100vw, ${maxW}px)`;
  const img = (
    <Image
      src={b.src}
      width={b.width}
      height={b.height}
      alt={alt}
      sizes={bildSizes}
      preload={preload || undefined}
      quality={75}
      // CLS (Qualität 01.11.2026): `w-full` + `h-auto` hält das Format aus width/height frei.
      className={kachel ? "absolute inset-0 m-auto block h-full w-full object-contain" : "block h-auto w-full object-contain"}
      style={kachel ? { maxWidth: maxW, maxHeight: Math.round((b.height || 1200) / 1.5) } : undefined}
      data-pin-nopin="true" // Herstellerbild: nicht für Pinterest
    />
  );
  // QM R4: ein schmales Hauptbild (Hochformat, über maxH begrenzt – Agape Cenote ~400 px in
  // 730 px Spalte) stand links mit großer Leerfläche rechts. Die Figur hat jetzt die Breite des
  // Bildes und steht mittig in der Spalte; die Bildunterschrift bleibt bündig unter dem Bild.
  const breite = `min(100%, ${maxW}px, calc(${maxH} * ${ratio.toFixed(4)}))`;
  return (
    <figure className={kachel ? "flex flex-col items-start" : "mx-auto flex max-w-full flex-col items-start"} style={kachel ? undefined : { width: breite }} data-kat-figur={kachel ? undefined : "zentriert"}>
      <div
        className={kachel ? "relative aspect-square w-full bg-linen" : "w-full bg-linen"}
        style={kachel && kachelAr !== 1 ? { aspectRatio: kachelAr.toFixed(4) } : undefined}
        data-kat-bildrahmen={kachel ? "kachel" : undefined}
      >
        {zoom ? (
          <BildZoom src={b.src} width={b.width} height={b.height} alt={alt} label={zoom.label} closeLabel={zoom.close} className={kachel ? "absolute inset-0 h-full w-full" : "w-full"}>
            {img}
          </BildZoom>
        ) : (
          img
        )}
      </div>
      <figcaption className="mt-2 text-small text-text-soft">{caption}</figcaption>
    </figure>
  );
}

/**
 * @param {{locale: string, p: object, marke: object}} props
 */
export default function ProduktDetail({ locale, p, marke }) {
  const t = useTranslations("katalog");
  const ts = useTranslations("shop");
  const w = WELTEN[p.welt];
  const wk = `welt.${w.key}`;
  const kat = t(`kategorie.${kategorieKey(p.kategorie)}`);
  const caption = t("produkt.bildQuelle", { marke: marke.name });
  // QM R3: Bilder vergrößerbar – Beschriftungen aus dem Shop-Namespace (gleiche Lightbox-Texte).
  let zoomN = 0;
  const zoom = () => ({ label: ts("atelier.openLightbox", { n: ++zoomN }), close: ts("atelier.close") });
  const dealerLine = marke.dealer ? dealerStatement(marke.name, locale) : "";
  const beratung = schreibenHref(locale, { context: { thema: beratungThema(p.bereich), produkt: `${marke.name} ${p.name}` } });
  const weitere = produkteByMarke(marke.slug, p.welt).filter((x) => x.slug !== p.slug).slice(0, 3);
  // Nr. 28: verwandte Produkte (Feld verwandt) und Querverweise der Marke (z. B. Riedel → Weinklima).
  // Zubehör zuerst (mit Hinweis), dann verwandte Produkte ohne Doppelte.
  const zubehoer = zubehoerVon(p);
  const verwandt = verwandteVon(p).filter((x) => !zubehoer.some((z) => z.p.slug === x.slug));
  const looks = looksMitProdukt(p.slug);
  const querverweise = querverweiseVon(marke.slug).filter((q) => q.welt !== p.welt);
  const crumbs = [
    { label: "Home", href: "/" },
    ...(w.hub ? [{ label: t(`${wk}.crumb`), href: w.hub }] : []),
    { label: t(`${wk}.produkteCrumb`), href: produktePath(p.welt) },
    { label: marke.name, href: markePath(p.welt, marke.slug) },
    { label: p.name },
  ];
  const preis = anzeigePreis(p);
  const pt = preisTexte(preis, t, locale);
  const offer = preisOffer(preis, `https://platzhirsch.studio/${locale}${produktPath(p.welt, p.slug)}`);
  const g = galerie(p);
  // Hero (Inhaber 03.11.2026, kachelBild.js detailBild): Raumbild > Freisteller > bilder[0] – das
  // Raum-Motiv eröffnet die Seite (Dornbracht TARA: tara-3) und wird als einziges vorgeladen;
  // og:image, JSON-LD und Sitemap der Produktseite zeigen dasselbe Bild. Ist der Hero ein Raumbild,
  // bleibt der Aufbau wie bisher („So wirkt es im Raum“ zuerst, groß); sonst folgen die Raumbilder
  // als eigener Block nach dem Hero, danach die übrigen Ansichten – ohne Doppelung.
  const leit = detailBild(p);
  const leitIstRaum = Boolean(leit) && bildTyp(leit) === "ambiente";
  const raumRest = g.ambiente.filter((b) => b.src !== leit?.src);
  const ansichten = [...g.freisteller, ...g.detail].filter((b) => b.src !== leit?.src);
  const raumErstes = leitIstRaum ? leit : null;
  const erstes = leitIstRaum ? null : leit;
  const restAlle = ansichten;
  const raumTitel = t(p.bereich === "objekt" ? "produkt.raumObjekt" : "produkt.raumTitel");
  const konfig = p.ausfuehrungen?.length ? konfiguratorDaten(p, locale) : null;
  // Optik-QA R3: Ausführungsbilder zeigt die Konfigurator-Vorschau – nicht noch einmal als Ansicht.
  // QM R1: das Startbild bleibt als Ansicht, wenn die Vorschau es nicht zeigt (Vorschau nur mit
  // eigenem Optionsbild, das nicht schon das Hauptbild ist – Konfigurator hauptSrc).
  const rest = konfig ? ohneKonfigDoppel(restAlle, p) : restAlle;
  const hauptSrc = leit?.src || null;
  // Raumbilder als eigener Block unter dem Hero (nur wenn das Leitbild kein Raumbild ist).
  const raumBlock = !raumErstes && raumRest.length > 0;
  // Küchengeräte im Planer-Sortiment: „In meine Küchenplanung aufnehmen“ (?geraet=<slug>, planerLink.js).
  const planer = planerLinkFuer(p, locale);
  // Optik-QA: Geräte mit Konfigurator haben eine lange rechte Spalte, die Galerie
  // ist kurz – Merkmale und Maße stehen dann ab lg unter der Galerie (links), statt
  // links ein leeres Feld zu lassen. Mobil bleibt die Reihenfolge gleich.
  const detailsLinks = Boolean(konfig) && (leit ? 1 : 0) + raumRest.length + rest.length <= 3;
  const merkItem = {
    id: `katalog-${p.slug}`,
    name: `${marke.name} ${p.name}`,
    // Merkliste: Kachelbild (leitbild) wie in den Listen.
    image: leitbild(p)?.src || null,
    category: kat,
    href: produktPath(p.welt, p.slug),
    slug: p.slug,
  };

  const details = (
    <>
      {p.merkmale.length > 0 && (
        <>
          <h2 className="mt-stack-m text-title text-text">{t("produkt.merkmale")}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-body text-text-soft">
            {p.merkmale.map((m, i) => (
              <li key={i}>{softHyphenate(textOf(m, locale))}</li>
            ))}
          </ul>
        </>
      )}
      {p.masse?.length > 0 && (
        <>
          <h2 className="mt-stack-m text-title text-text">{t("produkt.masse")}</h2>
          {/* QM R3: bei Textzoom (Container in rem) Bezeichnung über dem Wert statt zweier zu schmaler Spalten. */}
          <div className="@container">
          <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-body @xs:grid-cols-[auto_minmax(0,1fr)]">
            {p.masse.map((m) => (
              <div key={m.key} className="contents">
                <dt className="text-text-soft">{softHyphenate(t(`mass.${m.key}`))}</dt>
                <dd className="text-text tabular">{m.wert}</dd>
              </div>
            ))}
          </dl>
          </div>
        </>
      )}
      {p.designer && (
        <p className="mt-stack-s text-body text-text-soft">
          {t("produkt.designer")}: {p.designer}
        </p>
      )}
      <p className="mt-stack-m text-small text-text-soft">{softHyphenate(t("produkt.angaben", { datum: datum(p.stand, locale) }))}</p>
      {!pt && p.welt === "bad-wellness" && <p className="mt-1 text-small text-text-soft">{t("hinweis.preise")}</p>}
    </>
  );

  return (
    <>
      <JsonLd data={produktSchema(p, marke, locale, kat, offer)} />
      <Section tone="surface" spacing="none" labelledBy="kat-produkt-title" className="pt-8 pb-12 wrap-break-word md:pt-12 md:pb-16" data-kat-detail={p.slug}>
        <Breadcrumbs items={crumbs} schema className="[&_a]:min-h-11" />
        <div className={`mt-4 grid grid-cols-1 gap-y-8 lg:mt-stack-m lg:grid-cols-12 lg:gap-x-8 ${detailsLinks ? "lg:grid-rows-[auto_1fr]" : ""}`}>
          <div className="lg:col-span-7 lg:col-start-1 lg:row-start-1">
            {erstes && <Bild b={erstes} locale={locale} caption={caption} sizes="(min-width: 1024px) 55vw, 100vw" preload maxH="min(40rem,80svh)" zoom={zoom()} />}
            {raumBlock && (
              <div data-kat-raum={p.slug}>
                <p className="mt-stack-m mb-3 border-t border-line pt-4 text-ui text-text">{raumTitel}</p>
                <ul className={`grid ${raumRest.length > 1 ? "grid-cols-2" : "grid-cols-1"} gap-4 sm:gap-6`}>
                  {raumRest.map((b, i) => (
                    <li key={b.src} className="reveal" style={staggerStyle(i, 2)}>
                      <Bild b={b} locale={locale} caption={caption} sizes={raumRest.length > 1 ? "(min-width: 1024px) 27vw, 50vw" : "(min-width: 1024px) 55vw, 100vw"} kachel={raumRest.length > 1} kachelAr={kachelFormat(raumRest)} zoom={zoom()} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {raumErstes && (
              <div data-kat-raum={p.slug}>
                <p className="mb-3 text-ui text-text">{raumTitel}</p>
                <Bild b={raumErstes} locale={locale} caption={caption} sizes="(min-width: 1024px) 55vw, 100vw" preload maxH="min(42rem,80svh)" zoom={zoom()} />
                {raumRest.length > 0 && (
                  <ul className="mt-4 grid grid-cols-2 gap-4 sm:mt-6 sm:gap-6">
                    {raumRest.map((b, i) => (
                      <li key={b.src} className="reveal" style={staggerStyle(i, 2)}>
                        <Bild b={b} locale={locale} caption={caption} sizes="(min-width: 1024px) 27vw, 50vw" kachel kachelAr={kachelFormat(raumRest)} zoom={zoom()} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {(raumErstes || raumBlock) && rest.length > 0 && <p className="mt-stack-m mb-3 border-t border-line pt-4 text-ui text-text">{t("produkt.ansichten")}</p>}
            {!leit && <div className="flex aspect-[4/3] w-full items-center justify-center bg-linen text-small text-text-soft">{t("produkt.keinBild")}</div>}
            {rest.length > 0 && (
              // Optik-QA 01.11.2026: auch am Handy zweispaltig – sonst stehen zwei fast gleiche
              // Freisteller untereinander und schieben Titel und Preis aus dem ersten Bildschirm.
              // QM R1: eine einzelne Ansicht in voller Breite statt halb (rechts blieb eine Lücke).
              <ul className={`${erstes && !raumBlock ? "mt-4 sm:mt-6" : ""} grid ${rest.length > 1 ? "grid-cols-2" : "grid-cols-1"} gap-4 sm:gap-6`} data-kat-ansichten={p.slug}>
                {rest.map((b, i) => (
                  <li key={b.src} className="reveal" style={staggerStyle(i, 2)}>
                    <Bild b={b} locale={locale} caption={caption} sizes={rest.length > 1 ? "(min-width: 1024px) 27vw, 50vw" : "(min-width: 1024px) 55vw, 100vw"} kachel={rest.length > 1} kachelAr={kachelFormat(rest)} zoom={zoom()} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={`lg:col-span-5 lg:col-start-8 lg:row-start-1 ${detailsLinks ? "lg:row-span-2" : ""}`}>
            <Eyebrow>
              {marke.name} · {kat}
            </Eyebrow>
            <Heading id="kat-produkt-title" level={1} size={produktTitelGroesse(p.name)} className="mt-stack-s text-balance">
              {/* QM R3: Trennstellen nur, wenn die Spalte zu schmal ist (Textzoom ×2: „Kochfeldabzug“ lief unter den Concierge-Reiter). */}
              {fitHeading(produktTitel(anzeigeName(p.name, marke)))}
            </Heading>
            {p.serie && (
              <p className="mt-2 text-small text-text-soft">
                {t("produkt.serie")}: {p.serie}
              </p>
            )}
            <p className="mt-stack-m max-w-measure text-body text-text">{textOf(p.kurz, locale)}</p>
            {dealerLine && (
              <p className="mt-stack-s max-w-measure text-small text-text" data-kat-dealer={marke.slug}>
                {dealerLine}
              </p>
            )}
            {pt && (
              <div className="mt-stack-m border-t border-line pt-4" data-kat-preisblock={preis.art}>
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
                {pt.zusatz && (
                  <p className="mt-1 text-small text-text-soft" data-kat-preiszusatz="">
                    {pt.zusatz}
                  </p>
                )}
                {pt.paket && <p className="mt-1 text-small text-text-soft">{pt.paket}</p>}
              </div>
            )}
            {konfig && (
              <Konfigurator
                slug={p.slug}
                locale={locale}
                produkt={`${marke.name} ${p.name}`}
                thema={beratungThema(p.bereich)}
                daten={konfig}
                hauptSrc={hauptSrc}
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
            <div className="mt-stack-m flex flex-col items-start gap-2">
              <ReservierenSlot p={p} marke={marke} preis={preis?.art === "verkaufspreis" ? preis : null} locale={locale} />
              {!konfig && (
                <Button href={beratung} variant="primary" arrow data-kat-beratung={p.slug}>
                  {t("produkt.beratung")}
                </Button>
              )}
              {planer && (
                <LinkArrow href={planer.href} locale={planer.locale} hrefLang={planer.hrefLang} data-kat-planer={p.slug}>
                  {planer.label}
                  {planer.hinweis}
                </LinkArrow>
              )}
              <LinkArrow href={p.herstellerUrl} target="_blank" data-kat-hersteller={p.slug}>
                {t("produkt.hersteller")}
                <span className="sr-only"> ({t("produkt.extern", { marke: marke.name })})</span>
              </LinkArrow>
              <MerkenButton item={merkItem} label={t("produkt.merken")} />
            </div>

            {!detailsLinks && details}
          </div>
          {detailsLinks && (
            <div className="max-w-measure lg:col-span-7 lg:col-start-1 lg:row-start-2 lg:border-t lg:border-line lg:[&>:first-child]:mt-4" data-kat-details-links="">
              {details}
            </div>
          )}
        </div>
      </Section>

      <LooksBlock looks={looks} locale={locale} t={t} markeName={marke.name} aktuell={p.slug} />

      {(zubehoer.length > 0 || verwandt.length > 0 || querverweise.length > 0) && (
        <Section tone="surface" spacing="compact" labelledBy="kat-passend-title" data-kat-passend={p.slug}>
          <Heading id="kat-passend-title" level={2}>
            {t("produkt.passend")}
          </Heading>
          {(zubehoer.length > 0 || verwandt.length > 0) && (
            <ul className="mt-8 grid grid-cols-1 gap-x-grid gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {zubehoer.map((z, i) => (
                <ProduktKachel key={z.p.slug} p={z.p} index={i} markeName={markeBySlug(z.p.marke)?.name || z.p.marke} locale={locale} t={t} hinweis={z.hinweis ? textOf(z.hinweis, locale) : null} />
              ))}
              {verwandt.map((x, i) => (
                <ProduktKachel key={x.slug} p={x} index={zubehoer.length + i} markeName={markeBySlug(x.marke)?.name || x.marke} locale={locale} t={t} />
              ))}
            </ul>
          )}
          {querverweise.map((q) => (
            <LinkArrow key={`${q.welt}-${q.kategorie}`} href={kategoriePath(q.welt, q.kategorie)} className="mt-4" data-kat-querverweis={q.kategorie}>
              {t("produkt.querverweis", { kategorie: t(`kategorie.${kategorieKey(q.kategorie)}`) })}
            </LinkArrow>
          ))}
        </Section>
      )}

      {weitere.length > 0 && (
        <Section tone="raised" spacing="compact" labelledBy="kat-weitere-title">
          <Heading id="kat-weitere-title" level={2}>
            {t("produkt.weitere", { marke: marke.name })}
          </Heading>
          <ul className="mt-8 grid grid-cols-1 gap-x-grid gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {weitere.map((x, i) => (
              <ProduktKachel key={x.slug} p={x} index={i} markeName={marke.name} locale={locale} t={t} />
            ))}
          </ul>
          <LinkArrow href={markePath(p.welt, marke.slug)} className="mt-6">
            {t("produkt.alleVonMarke", { marke: marke.name })}
          </LinkArrow>
          {marke.weitereSeite && (
            <LinkArrow href={marke.weitereSeite.href} className="mt-2" data-kat-weitere-marke={marke.slug}>
              {t(`marke.${marke.weitereSeite.text}`, { marke: marke.name })}
            </LinkArrow>
          )}
        </Section>
      )}
    </>
  );
}
