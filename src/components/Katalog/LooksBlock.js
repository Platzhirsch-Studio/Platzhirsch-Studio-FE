// src/components/Katalog/LooksBlock.js
// „Ganze Räume ansehen“: Raumszenen (MARKE.looks) mit den gezeigten Produkten,
// auf Marken- und Produktseiten (Server Component, kein JS). Herstellerbild
// unverändert; Rahmen nach Bildformat (looksLayout.js, QM R4: am Handy im
// Seitenverhältnis des Fotos, ab sm gleich hohe Reihen, Füllen nur bei ≤ 15 % Abweichung),
// lazy, data-pin-nopin, „Bild: <Marke>“.
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Heading, Section } from "@/components/ui";
import { kategorieKey, textOf } from "@/lib/katalog/schema";
import { markeBySlug, produkteByMarke } from "@/lib/katalog";
import { lookName, lookRaster } from "./looksLayout";
import { produktPath } from "@/lib/katalog/welten";

/**
 * @param {{looks: Array<object>, locale: string, t: Function, markeName: string, aktuell?: string, id?: string}} props
 */
export default function LooksBlock({ looks, locale, t, markeName, aktuell = null, id = "kat-looks-title" }) {
  if (!looks?.length) return null;
  // QM R1/R3: Raster nach Bildformaten (looksLayout.js) – Hochformate in 4:5-Rahmen, Querformate
  // über zwei Spalten (8:5, gleiche Höhe) statt als Letterbox mit Leinenflächen; ein einzelner
  // Raum steht neben seinem Text statt in halber Breite mit leerer rechter Hälfte.
  const raster = lookRaster(looks.map((l) => l.bild));
  const einzeln = looks.length === 1;
  return (
    <Section tone="raised" spacing="compact" labelledBy={id} data-kat-looks="">
      <Heading id={id} level={2}>
        {t("produkt.looksTitel")}
      </Heading>
      <p className="mt-2 max-w-measure text-body text-text-soft">{t("produkt.looksLead", { marke: markeName })}</p>
      <ul className={`mt-8 grid grid-cols-1 gap-x-grid gap-y-10 ${einzeln ? "" : raster.ul}`}>
        {looks.map((l, li) => {
          // QM R1/R3: Produkte gleichen Namens (Memory Spiegel, Armatur, WC …) tragen die Kategorie
          // in Klammern – geprüft gegen das ganze Sortiment der Marke, nicht nur gegen diesen Raum
          // (vorher stand „Memory“ ohne Zusatz, wenn im Raum nur eines davon vorkam). Echte Doppel
          // (gleicher Slug) fallen weg.
          const produkte = l.produkte.filter((x, i, arr) => arr.findIndex((y) => y.slug === x.slug) === i);
          const name = (x) => lookName(x, { markeName, markenName: markeBySlug(x.marke)?.name, sortiment: produkteByMarke(x.marke), kategorie: (k) => t(`kategorie.${kategorieKey(k)}`) });
          const zelle = raster.zellen[li];
          return (
          <li key={l.id} data-kat-look={l.id} className={einzeln ? "lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-8" : zelle.li}>
            <figure className={einzeln ? zelle.einzelFigur : undefined}>
              <div className={`relative flex ${einzeln ? zelle.einzelRahmen : zelle.rahmen} w-full items-center justify-center overflow-hidden bg-linen`} style={zelle.style}>
                <Image
                  src={l.bild.src}
                  width={l.bild.width}
                  height={l.bild.height}
                  alt={textOf(l.bild.alt, locale)}
                  sizes={einzeln ? "(min-width: 1024px) 55vw, 100vw" : zelle.sizes}
                  quality={75}
                  className={`block h-full w-full ${einzeln ? "object-cover" : zelle.bild}`}
                  data-pin-nopin="true" // Herstellerbild: nicht für Pinterest
                />
              </div>
              <figcaption className="mt-2 text-small text-text-soft">{t("produkt.bildQuelle", { marke: markeName })}</figcaption>
            </figure>
            <div className={einzeln ? (zelle.einzelFigur === "lg:col-span-5" ? "lg:col-span-7" : "lg:col-span-5") : undefined}>
            <h3 className="mt-3 text-title text-text">{textOf(l.titel, locale)}</h3>
            <p className="mt-2 text-small text-text-soft">{t("produkt.lookProdukte")}:</p>
            <ul className="mt-1 flex flex-wrap gap-x-4">
              {produkte.map((x) => (
                <li key={x.slug}>
                  {x.slug === aktuell ? (
                    <span className="inline-flex min-h-11 items-center text-ui text-text" aria-current="page">
                      {name(x)}
                    </span>
                  ) : (
                    <Link href={produktPath(x.welt, x.slug)} className="inline-flex min-h-11 items-center text-ui text-text underline decoration-line-strong underline-offset-4 hover:decoration-current" data-kat-look-produkt={x.slug}>
                      {name(x)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            </div>
          </li>
          );
        })}
      </ul>
    </Section>
  );
}
