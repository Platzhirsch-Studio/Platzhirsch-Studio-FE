// src/components/ShopStart/ShopSubHeader.js
// Shop-Kopfleiste unter dem Seitenkopf auf ALLEN Seiten unter /accessoires
// (src/app/[locale]/accessoires/layout.js): Shop-Name → Shop-Startseite ·
// Suche (GET-Formular → /accessoires/suche, funktioniert ohne JavaScript) ·
// Zeile mit den Abteilungen (mobil waagrecht scrollbar, kein Seiten-Querscrollen).
// KEIN eigener Warenkorb-Link: es gibt genau EIN Warenkorb-Symbol – CartLink in
// der Hauptkopfzeile (navbar.js, nur bei shopActive()), sonst zwei Symbole.
// Server Component; aria-current setzt die winzige Insel ShopNavCurrent nach
// dem Pfad (Layouts kennen den Pfad nicht). Feste Höhe, kein CLS.
// Optik-QA r2 (Telefon, Telefon quer, 200 % Textzoom): Titel, „Alle Produkte“, Suchfeld und Abteilungen
// belegten untereinander rund 160 px (bei Zoom die halbe Höhe). Unter sm jetzt zwei Zeilen: Titel + Lupe
// (Link zur Suchseite, dort steht das große Suchfeld), darunter die Abteilungen mit „Alle Produkte“ vorn.
// Auf der Suchseite selbst entfällt das Kopf-Suchfeld (dort steht schon eines mit dem Suchbegriff).
// Abteilungen: auf allen Breiten eine wischbare Zeile (vorher ab lg umbrechend → bei Zoom drei Zeilen).
import { Container } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { Search } from "@/components/ui/icons";
import { produktePath } from "@/lib/katalog/welten";
import { kategorieKey } from "@/lib/katalog/schema";
import { SHOP_START_PATH, SHOP_SUCHE_PATH, SHOP_WELT, abteilungLabel, abteilungen } from "@/lib/shop/shopStart";
import { startCopy } from "@/lib/shop/startCopy";
import ShopNavCurrent from "./ShopNavCurrent";

// Kopf-Suche ausblenden, sobald die Suchseite (data-shop-suche-seite) im Dokument steht – ohne JavaScript.
const AUF_SUCHSEITE_AUS = "[body:has([data-shop-suche-seite])_&]:hidden";

const CHIP =
  "inline-flex min-h-11 items-center whitespace-nowrap border-b-2 border-transparent px-1 text-ui text-text-soft transition-colors duration-(--duration-micro) hover:text-text aria-[current]:border-ink aria-[current]:text-text";

/**
 * @param {{ locale: string, katLabel: (k: string) => string }} props
 */
export default function ShopSubHeader({ locale, katLabel = (k) => kategorieKey(k) }) {
  const c = startCopy(locale);
  const gruppen = abteilungen();
  const sucheId = "shop-suche-q";
  return (
    // Druck 02.11.: Shop-Kopfleiste (Abteilungen, Suche) nicht im Ausdruck von Warenkorb und Bestellbestätigung.
    <nav aria-label={c.subLabel} className="border-b border-line bg-surface text-text print:hidden" data-shop-nav="">
      {/* Kompakt (Titel + Lupe, darunter die Abteilungen mit „Alle Produkte“ vorn) auch, wenn die Leiste in rem
          schmal ist – @container/shopnav: Optik-QA r3, Desktop mit 200 % Textzoom: Suchfeld und Kopfzeile belegten
          41 % der Höhe. Telefon quer (≤ 500 px hoch): alles in EINER Zeile (Titel · Abteilungen · Lupe). */}
      {/* QM Zoom 02.11. (Desktop 1440 × 900, 200 % Textzoom): Kopfzeile (144 px) + diese Leiste (Titel-Zeile und
          Abteilungs-Zeile je 88 px = 225 px) belegten 41 % der Höhe. Großer Bildschirm (lg, in px) UND Leiste
          in rem schmal (≤ 44rem, also vergrößerte Schrift) → dieselbe EINE Zeile wie am Telefon quer:
          Titel · Abteilungen (wischbar) · Lupe. Bei 100 % ist die Leiste ab lg immer ≥ 58rem breit – nichts ändert sich.
          Der Container sitzt dafür auf dem Container-Element (Inhaltsbreite = dieselbe wie vorher auf dem inneren Rahmen),
          weil ein Element seine eigene Container-Query nicht auswerten kann. */}
      <Container className="@container/shopnav">
        <div className="[@media(max-height:500px)]:flex [@media(max-height:500px)]:items-center [@media(max-height:500px)]:gap-x-4 lg:@max-[44rem]/shopnav:flex lg:@max-[44rem]/shopnav:items-center lg:@max-[44rem]/shopnav:gap-x-4">
        <div className="flex items-center gap-x-4 pt-1 sm:py-3 [@media(max-height:500px)]:contents lg:@max-[44rem]/shopnav:contents">
          <Link href={SHOP_START_PATH} className="inline-flex min-h-11 min-w-0 items-center font-display sm:shrink-0 sm:whitespace-nowrap text-lead text-text no-underline" data-shop-path={SHOP_START_PATH}>
            {c.subHome}
          </Link>
          <Link href={SHOP_SUCHE_PATH} aria-label={c.sucheLabel} className={`ph-press ml-auto inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center text-text [@media(max-height:500px)]:order-3 lg:@max-[44rem]/shopnav:order-3 sm:[@media(min-height:501px)]:@min-[44rem]/shopnav:hidden ${AUF_SUCHSEITE_AUS}`} data-shop-suche-link="">
            <Search aria-hidden="true" className="size-5" strokeWidth={1.5} />
          </Link>
          {/* „Alle Produkte“ in der Kopfzeile statt am Ende der Abteilungszeile: dort wurde es selbst bei 1920 px
              von der Maske angeschnitten – auf /accessoires/produkte ausgerechnet der aktive Punkt (Optik-QA r1). */}
          <Link href={produktePath(SHOP_WELT)} className={`${CHIP} ml-2 shrink-0 max-sm:hidden [@media(max-height:500px)]:hidden @max-[44rem]/shopnav:hidden`} data-shop-path={produktePath(SHOP_WELT)}>
            {c.navAlleProdukte}
          </Link>
          <form role="search" action={`/${locale}${SHOP_SUCHE_PATH}`} method="get" className={`ml-auto hidden w-full min-w-0 max-w-md items-stretch sm:[@media(min-height:501px)]:@min-[44rem]/shopnav:flex ${AUF_SUCHSEITE_AUS}`} data-shop-suche="">
            <label htmlFor={sucheId} className="sr-only">
              {c.sucheLabel}
            </label>
            <input
              id={sucheId}
              name="q"
              type="search"
              inputMode="search"
              autoComplete="off"
              enterKeyHint="search"
              minLength={2}
              maxLength={80}
              placeholder={c.suchePlatzhalter}
              className="min-h-11 w-full min-w-0 appearance-none rounded-none border border-line-strong bg-surface px-3 text-body text-text placeholder:text-text-soft [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
            />
            <button type="submit" className="ph-press inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 border border-l-0 border-ink bg-action px-3 text-ui text-paper transition-colors duration-(--duration-micro) ease-quiet hover:bg-action-hover">
              <Search className="size-5" strokeWidth={1.5} />
              <span className="sr-only sm:not-sr-only">{c.sucheButton}</span>
            </button>
          </form>
        </div>
        {/* Waagrecht scrollbar: rechts blendet die Leiste aus (sichtbarer Hinweis „es geht weiter“);
            pr-10 am Ende, damit der letzte Eintrag am Scroll-Ende voll lesbar ist. */}
        {/* Maske nur, solange rechts wirklich etwas verborgen ist (data-ueberlauf setzt ShopNavCurrent) – Optik-QA r3:
            bei 1280 px lag sie über „Geschenksets“, obwohl der Eintrag fast ganz hineinpasste. */}
        <div className="scrollbar-hide -mx-gutter overflow-x-auto px-gutter data-[ueberlauf]:[mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)] sm:mx-0 sm:px-0 [@media(max-height:500px)]:order-2 [@media(max-height:500px)]:min-w-0 [@media(max-height:500px)]:flex-1 lg:@max-[44rem]/shopnav:order-2 lg:@max-[44rem]/shopnav:min-w-0 lg:@max-[44rem]/shopnav:flex-1" data-shop-abteilungen="">
          {/* Immer eine Zeile: ab ~1100 px passen alle 8 Abteilungen, darunter (und bei Textzoom) wischbar mit Ausblendung rechts. */}
          <ul aria-label={c.subKategorien} className="flex w-max gap-x-5 pr-10 whitespace-nowrap lg:gap-x-3 xl:gap-x-4 lg:[&_a]:px-0">
            <li className="sm:[@media(min-height:501px)]:@min-[44rem]/shopnav:hidden">
              <Link href={produktePath(SHOP_WELT)} className={CHIP} data-shop-path={produktePath(SHOP_WELT)}>
                {c.navAlleProdukte}
              </Link>
            </li>
            {gruppen.map((g) => (
              <li key={g.id}>
                <Link
                  href={g.href}
                  className={CHIP}
                  data-shop-path={g.href}
                  // Unterkategorien der Abteilung markieren den Chip ebenfalls (aria-current="true").
                  data-shop-match={g.kategorien.map((k) => k.href).join(" ")}
                >
                  {abteilungLabel(g, locale, katLabel)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        </div>
      </Container>
      <ShopNavCurrent locale={locale} />
    </nav>
  );
}
