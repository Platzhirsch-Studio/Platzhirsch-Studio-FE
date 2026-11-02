// /de/ezarri/kollektionen – 17 Kollektionen + 4 Sonderanfertigungen nach Linie (Team A, Konzept §2/§3.3).
// card-brand-Prinzip: Name in Bodoni, Faktenzeile, kein Logo-Raster.
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { getCollections, getDownloads, getSortimentStats, toCollectionCard } from "@/lib/ezarri/data";
import { ezarriWeltLocaleEnabled } from "@/lib/ezarri/config";
import { FORMATE } from "@/lib/ezarri/facets";
import { ezCopy, ezT } from "@/lib/ezarri/lang";
import EzImage from "@/components/Ezarri/Welt/EzImage";
import { breitImZweier, spurenDreier, spurKlasse } from "@/lib/ezarri/raster";
import { mitFesterEinheit } from "@/lib/ezarri/einheit";
import MixKachel from "@/components/Ezarri/Welt/MixKachel";
import { getMixItems, getMixRecipes } from "@/lib/ezarri/rechner/palette.server";
import { CreditNote, PageHead, Schluss, ezCrumbsFor } from "@/components/Ezarri/Welt/parts";
import { ezarriMetadata } from "@/components/Ezarri/Welt/meta";
import { brandNode, collectionPage } from "@/components/Ezarri/Welt/schema";
import { CARD_LINK, IMAGE_HOVER, staggerStyle } from "@/lib/ezarri/motion";

const PATH = "/ezarri/kollektionen";
/** Custom Mix hat kein Herstellerbild: Mosaikfeld aus der ersten blauen Ezarri-Mischung (wie Start im Mischpult). */
function startMischung() {
  const rezepte = getMixRecipes();
  const items = new Map(getMixItems(rezepte.flatMap((r) => r.mix.map((x) => x.id))).map((m) => [m.id, m]));
  const r = rezepte.find((x) => x.mix.every((m) => items.get(m.id)?.farben?.includes("blau"))) || rezepte[0];
  return (r?.mix || []).map((m) => ({ anteil: m.anteil, toene: items.get(m.id)?.toene || [] }));
}

// QM r1: Trenner hängt mit geschütztem Leerzeichen am Wort davor – keine Zeile beginnt mit „· “.
const SEP = "\u00a0· ";
// QM r2 (Handys DPR ≥ 2): Zwischenstufen statt 1600w für eine ~340 px breite Kachel (public/ezarri/…-900/-1200).
const STUFEN = [900, 1200];
// QM r4: sizes je Kachelbreite – breite Kacheln (3 von 6 Spuren ab lg, über beide Spalten im
// Zweierraster) sind 540–630 px breit; vorher „400px“ bzw. „30vw“ für alle → 600er-Datei hochskaliert.
function kachelSizes(i, n) {
  const lg = spurenDreier(i, n) === 3 ? "(min-width: 1280px) 640px, (min-width: 1024px) 47vw" : "(min-width: 1280px) 420px, (min-width: 1024px) 31vw";
  const sm = breitImZweier(i, n) ? "(min-width: 640px) 100vw" : "(min-width: 640px) 50vw";
  return `${lg}, ${sm}, calc(100vw - 2.5rem)`;
}
const fmtLabel = (ids) => ids.map((id) => mitFesterEinheit(FORMATE.find((f) => f.id === id)?.label ?? id)).join(SEP);

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) return {};
  const { KOLLEKTIONEN, LINIE_LABEL } = ezCopy(locale);
  return ezarriMetadata({ locale, path: PATH, title: KOLLEKTIONEN.seoTitle, description: KOLLEKTIONEN.description(getSortimentStats()) });
}

export default async function KollektionenPage({ params }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const { KOLLEKTIONEN, LINIE_LABEL } = ezCopy(locale);
  const t = ezT(locale);
  const linien = ["Premium", "Classic", "Custom"].map((l) => ({ linie: l, items: getCollections({ linie: l }).map(toCollectionCard) }));
  const all = linien.flatMap((l) => l.items);
  const { alt } = getDownloads();
  const ld = [brandNode(), collectionPage({ locale, path: PATH, name: KOLLEKTIONEN.title, description: KOLLEKTIONEN.description(getSortimentStats()), items: all.map((k) => ({ name: `Ezarri ${k.name}`, href: `${PATH}/${k.id}` })) })];
  let n = 0;
  return (
    <>
      <PageHead crumbs={ezCrumbsFor(locale, { label: KOLLEKTIONEN.crumb })} eyebrow={KOLLEKTIONEN.eyebrow} title={KOLLEKTIONEN.title} lead={KOLLEKTIONEN.lead} jsonLd={ld} />
      <Container className="flex flex-col gap-section pb-section">
        {linien.map(({ linie, items }) => (
          <section key={linie} aria-labelledby={`ez-l-${linie}`}>
            <h2 id={`ez-l-${linie}`} className="font-display text-display-m text-text">
              {LINIE_LABEL[linie]}
            </h2>
            <p className="mt-2 max-w-measure text-body text-text-soft">{KOLLEKTIONEN.linien[linie]}</p>
            {/* QM r2: 6 Spuren ab lg, letzte Zeile bündig (lib/ezarri/raster.js) statt einer Kachel neben zwei Leerspalten
                QM r4: auch im Zweierraster (Tablet hoch, Handy quer) keine Einzelkachel neben leerer Spalte (spurKlasse) */}
            <ul className="mt-stack-m grid grid-cols-1 gap-x-grid gap-y-12 sm:grid-cols-2 lg:grid-cols-6">
              {items.map((k, i) => {
                n += 1;
                return (
                  <li key={k.id} className={`reveal group @container/kk relative ${spurKlasse(i, items.length)}`} style={staggerStyle(i, 3)}>
                    {k.bild ? (
                      <EzImage image={k.bild} alt={t(`Ezarri ${k.name}, Anwendungsbild`, KOLLEKTIONEN.anwendungsbild?.(k.name))} ratio="3/2" preload={n === 1} sizes={kachelSizes(i, items.length)} stufen={STUFEN} imgClassName={IMAGE_HOVER} boxClassName={breitImZweier(i, items.length) ? "sm:max-lg:aspect-[21/9]" : undefined} />
                    ) : (
                      <MixKachel mix={startMischung()} ratio="3/2" className={breitImZweier(i, items.length) ? "sm:max-lg:aspect-[21/9]" : undefined} />
                    )}
                    {/* QM r2: schmale Kachel bei 200 % Text (< 17 rem) → kleinerer Titel statt Wortbruch („Aquarell|e“) */}
                    <h3 className="mt-4 font-display text-display-m text-text [overflow-wrap:break-word] @max-[17rem]/kk:text-title">
                      <Link href={`${PATH}/${k.id}`} className={`ph-stretched underline-offset-8 ${CARD_LINK}`}>
                        {k.name}
                      </Link>
                    </h3>
                    <p className="mt-1 min-h-[2lh] text-small tabular-nums text-text-soft">
                      {[k.anzahl ? t(`${k.anzahl} Referenzen`, `${k.anzahl} references`, `${k.anzahl} références`, `${k.anzahl} referenze`) : KOLLEKTIONEN.sonder, fmtLabel(k.formate)].filter(Boolean).join(SEP)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        <CreditNote />
        <section aria-labelledby="ez-alt" className="border-t border-line pt-8">
          <h2 id="ez-alt" className="text-title text-text">{KOLLEKTIONEN.alt}</h2>
          <ul className="mt-4 flex flex-col gap-1">
            {alt.map((a) => (
              <li key={a.id}>
                <a href={a.href} className="inline-flex min-h-11 items-center text-ui text-text underline underline-offset-4">
                  {t(`${a.name} – Datenblatt (PDF, englisch)`, KOLLEKTIONEN.datenblattVon?.(a.name))}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-small text-text-soft">{t("Diese Kollektionen führt Ezarri nicht mehr auf der Website. Datenblatt: Ezarri, ezarri.com", KOLLEKTIONEN.altHinweis)}</p>
        </section>
      </Container>
      <Schluss />
    </>
  );
}
