// src/components/Katalog/ShopKachel.js
// Shop-Kachel der Accessoire-Welt (Format: lib/katalog/shopListe.js).
// Server-tauglich, ohne Hooks: rendert in der Insel ShopGrid.js und auf der
// Produktseite („Passt dazu“, Server Component).
//   - einheitlicher 4:5-Rahmen auf ruhiger Fläche, Herstellerbild unverändert
//     (object-contain, nichts beschnitten, mix-blend-multiply lässt weiße
//     Studiohintergründe in die Fläche übergehen), data-pin-nopin (TileImage)
//   - zweites Bild nur auf Geräten mit Hover (auf Touch display:none → wird
//     nicht geladen), Überblendung nur ohne „reduzierte Bewegung“
//   - Motion (motion-shop): Bild zoomt im festen Rahmen um 3 % (Hover UND
//     Tastaturfokus, --duration-ui/ease-drift, nur transform); ruhig = steht
//   - Marke · Name · Preis („ab …“ bei Spanne) · Anzahl Ausführungen
//   - Badges nur aus Daten: „Online bestellbar“ (sellableOf), „Auf Anfrage“
//     (Verkaufsmarke, aber derzeit nicht bestellbar), „Unsere Auswahl“
//   - ganze Kachel klickbar über den Namenslink (.ph-stretched), echtes <a>
//     (crawlbar, ohne JS); die Liste delegiert Klicks an den Router.
// Bilder tragen alt="": der Produktname steht als Linktext direkt daneben.
import TileImage from "@/components/ShopCatalog/tileImage";
import { bildSrc, kachelPreis } from "@/lib/katalog/shopListe";
import { titelTeile } from "./shopTitel";
import { STUDIO_FOND, studioFassung } from "./studioFond";

export const KACHEL_SIZES = "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw";

// Spalten der Kachel-Raster per Container-Query in rem (Elternelement trägt „@container“). rem folgt der Schriftgröße:
// bei 200 % Textzoom (Optik-QA r3, iPhone 15: zwei Spalten mit ineinanderlaufenden Namen) wird es einspaltig, am
// Desktop-Zoom zweispaltig. Normale Schrift: Telefon (≥ 272 px) 2, ab ~640 px Abschnittsbreite 4 (bzw. 3, ab ~1090 px 4).
export const RASTER_4 = "grid-cols-1 @min-[17rem]:grid-cols-2 @min-[40rem]:grid-cols-4";
export const RASTER_LISTE = "grid-cols-1 @min-[17rem]:grid-cols-2 @min-[40rem]:grid-cols-3 @min-[68rem]:grid-cols-4";

// Zalto (eigener Studiogrund mit Horizont): die Kachel zeigt die „-frei“-Fassung (studioFond.js,
// Optik-QA r2) – Studiogrund weiß, daher wie jeder Freisteller mit Innenabstand und multiply:
// ein einheitliches Raster, keine grauen Fotos und keine Seitenbänder mehr.
export { STUDIO_FOND };
const BILD_FREI = "object-contain p-[6%] mix-blend-multiply";
const BILD_STUDIO = "object-contain mix-blend-multiply";
/** Bildklassen je Bild (rein, für Tests exportiert): randlos nur für die alte verlängerte 4:5-Fassung. */
export const bildKlasse = (istStudio) => (istStudio ? BILD_STUDIO : BILD_FREI);

/**
 * @param {{ e: object, href: string, locale: string, marke: string, copy: Record<string,string>, eager?: boolean, headingLevel?: 2|3, hinweis?: string|null, sizes?: string, auf?: "surface"|"raised", ohneAuswahl?: boolean }} props
 *   ohneAuswahl: Sektion „Ausgewählt im Showroom“ – dort stünde „Unsere Auswahl“ doppelt auf jeder Kachel
 *   href: Pfad MIT Locale (/de/accessoires/produkte/…)
 *   auf: Ton des umgebenden Abschnitts – auf „raised“ wäre die Bildfläche unsichtbar, dann hellere Fläche
 */
export default function ShopKachel({ e, href, locale, marke, copy, eager = false, headingLevel = 3, hinweis = null, sizes = KACHEL_SIZES, auf = "surface", ohneAuswahl = false }) {
  const H = `h${headingLevel}`;
  const flaeche = auf === "raised" ? "bg-surface" : "bg-surface-raised";
  const original = bildSrc(e, e.i?.[0]);
  const src = studioFassung(original, e.m, "frei") || original;
  // Studiomarken (Zalto): kein Hover-Wechsel – das zweite Bild ist wieder ein schmales 2:3-Studiofoto
  // bzw. ein Szenenbild (Optik-QA r2: Restweinkaraffe 50 beim Hover). Alle übrigen Hover-Bilder sind
  // Raumbilder (kachelBilder: Raumbild bevorzugt) → object-cover füllt den 4:5-Rahmen ohne helle
  // Streifen oben/unten (Optik-QA r2 Desktop: Cire Trudon „Galerie des flammes“ 285 von 345 px).
  const hover = STUDIO_FOND.has(e.m) ? null : bildSrc(e, e.j?.[0]);
  const titel = titelTeile(e.n);
  const preis = kachelPreis(e, locale, copy);
  // Ohne Preis steht „Auf Anfrage“ in der Preiszeile (gleiche Kachelhöhe wie die Nachbarn), nicht doppelt als Badge.
  const preisZeile = preis || (e.o === 0 ? copy.badgeAnfrage : null);
  const badges = [e.o === 1 ? copy.badgeOnline : e.o === 0 && preis ? copy.badgeAnfrage : null, e.a && !ohneAuswahl ? copy.badgeAuswahl : null].filter(Boolean);
  return (
    <article className="group relative flex h-full flex-col" data-kat-kachel={e.s}>
      <div className={`relative aspect-[4/5] overflow-hidden ${flaeche}`}>
        {src ? (
          <TileImage
            src={src}
            alt=""
            sizes={sizes}
            eager={eager}
            quality={75}
            className={`${bildKlasse(false)} transition-transform duration-(--duration-ui) ease-drift motion-safe:group-hover:scale-[1.03] motion-safe:group-focus-within:scale-[1.03]`}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center p-4 text-center text-small text-text-soft">{copy.keinBild}</span>
        )}
        {hover && (
          <TileImage
            src={hover}
            alt=""
            sizes={sizes}
            quality={75}
            className={`hidden object-cover opacity-0 transition-[opacity,scale] duration-(--duration-swap) ease-quiet [@media(hover:hover)]:block group-hover:opacity-100 motion-safe:group-hover:scale-[1.03] motion-reduce:transition-none`}
          />
        )}
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-1">
        {/* Badges auf ALLEN Breiten als ruhige Textzeile unter dem Bild (Zeile immer reserviert, damit Marke/Name
            einer Reihe fluchten). Optik-QA r3: als Overline auf der Bildfläche deckten sie in 4er-Reihen (iPad quer,
            Laptop) Kerzenrand, Flammen und Glasrand ab – die Bildfläche gehört jetzt allein dem Produkt. */}
        <p className="min-h-[1lh] text-small text-text-soft" data-kat-badges="">
          {badges.join(" · ") || null}
        </p>
        <p className="text-overline uppercase text-text-soft">{marke}</p>
        {/* Kein line-clamp: WebKit kappte nach dem ersten Block („Ibiza Bohemia…“), mit WCAG-1.4.12-Abständen sogar
            „Die klassische…“ (Optik-QA r3) – Namen stehen immer vollständig. */}
        <H className="text-ui break-words text-text">
          <a href={href} className="ph-stretched underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) group-hover:decoration-current" data-kat-produkt={e.s}>
            {/* „Die klassische Kerze – Cabinet des miroirs“: Zusatz in eigener Zeile statt hängendem „–“ (Optik-QA r2). */}
            {titel.haupt}
            {titel.zusatz && (
              <>
                <span className="sr-only"> – </span>
                <br aria-hidden="true" />
                {titel.zusatz}
              </>
            )}
          </a>
        </H>
        {hinweis && <p className="text-small text-text-soft">{hinweis}</p>}
        {/* Preis oben im Fußblock, „n Ausführungen“ darunter – beide Zeilen immer reserviert:
            so stehen die Preise einer Reihe auf einer Linie, auch bei „Auf Anfrage“ oder ohne Ausführungen. */}
        <div className="mt-auto pt-1 text-small">
          <p className={`min-h-[1lh] tabular ${preis ? "text-text" : "text-text-soft"}`} data-kat-preis={e.s}>
            {preisZeile}
          </p>
          <p className="min-h-[1lh] text-text-soft">{e.v > 0 ? copy.ausfuehrungen.replace("{n}", e.v) : null}</p>
        </div>
      </div>
    </article>
  );
}
