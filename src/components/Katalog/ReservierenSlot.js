// src/components/Katalog/ReservierenSlot.js
// Kaufaktionen der Accessoire-Marken (Inhaber-Entscheidungen Nr. 27–29) auf
// Produktdetailseiten mit Verkaufspreis. Server Component; entscheidet hier:
//   SHOP_MODE test/live + verkaufbarer Artikel (Marke baobab-collection,
//     riedel, cire-trudon; preis.art "verkaufspreis", Stand ≤ 3 Monate)
//     → Insel KaufBox: Preis je Ausführung (+ Grundpreis), Menge,
//       „In den Warenkorb“ + „Reservieren & im Showroom abholen“
//   sonst → „Im Showroom erhältlich – Verfügbarkeit anfragen“ (Anfrage-Link)
// Alle anderen Produkte (Möbel, Bad, Wellness, Küchengeräte): nichts.
// Die Insel bekommt nur fertig formatierte Anzeige-Preise; Warenkorb und
// Kasse rechnen weiterhin ausschließlich mit lib/shop/catalog.js (Server).
import { LinkArrow } from "@/components/ui";
import KaufBox from "./KaufBox";
import { studioFassung } from "./studioFond";
import { startVariante } from "./kaufAuswahl";
import { schreibenHref } from "@/lib/forms/terminLink";
import { heuteIso } from "@/lib/katalog/config";
import { standardAuswahl } from "@/lib/katalog/ausfuehrung";
import { leitbild } from "./kachelBild";
import { variantenAnzeige } from "@/lib/katalog/shopIndex";
import { pickListeCopy } from "@/lib/katalog/shopListeCopy";
import { VERKAUF_MARKEN, ausfuehrungZuVariante, sellableOf, varianteZurAuswahl } from "@/lib/shop/catalog";
import { ADD_TO_CART_KEYS, pickCopy, shopCopy } from "@/lib/shop/copy";
import { istSofortLieferbar } from "@/lib/shop/lieferzeit";
import { shopMode } from "@/lib/shop/mode";
import { anzeigeSatz } from "@/lib/shop/ust";

/**
 * @param {{p: object, marke: object, preis: object|null, locale: string, hinweis?: string|null}} props
 *   hinweis: Zeile unter der Kaufbox (z. B. „Preis Österreich · Stand …“)
 */
export default function ReservierenSlot({ p, marke, preis, locale, hinweis = null }) {
  if (!preis || !VERKAUF_MARKEN.includes(p?.marke)) return null;
  const mode = shopMode(process.env);
  const item = sellableOf(p, { heute: heuteIso(), mode });
  if (!item) {
    const href = schreibenHref(locale, { context: { thema: "accessoires", produkt: `${marke.name} ${p.name}` } });
    return (
      <LinkArrow href={href} data-shop-showroom={p.slug}>
        {shopCopy(locale).showroomOnly}
      </LinkArrow>
    );
  }
  const zuordnung = ausfuehrungZuVariante(p, item.varianten);
  // Gleiche IDs wie item.varianten (beide aus variantenOf(preis)); fehlt eine, Name ohne Preis nie anzeigen.
  const anzeige = variantenAnzeige(p, preis, locale).filter((v) => item.varianten.some((x) => x.id === v.id));
  // USt-Satz je Kategorie (Bildbände 10 %, sonst 20 %; lib/shop/ust.js). Bei OSS
  // hängt er vom Lieferland ab → dann nur „inkl. MwSt.“ ohne Zahl.
  const liste = pickListeCopy(locale, ["menge", "weniger", "mehrMenge", "ausfuehrung", "inklMwst", "grundpreis"]);
  const satz = anzeigeSatz({ kategorie: p.kategorie });
  // Leitbild (Inhaber 03.11.2026): dasselbe Bild wie Kachel und Produktseite (kachelBild.js).
  const roh = leitbild(p)?.src || null;
  // Zalto: helle „-frei“-Fassung wie Kachel und Warenkorb (studioFond.js).
  const bild = studioFassung(roh, p.marke, "frei") || roh;
  const inklMwst = satz == null ? liste.inklMwst.replace(/\s?\{satz\}\s?%/, "") : liste.inklMwst.replace("{satz}", String(satz));
  return (
    <KaufBox
      slug={item.slug}
      varianten={anzeige}
      // K10: gewählte Ausführung im Konfigurator → Warenkorb-Variante (Ereignis „katalog:ausfuehrung“).
      zuordnung={zuordnung}
      start={startVariante(anzeige, varianteZurAuswahl(zuordnung, standardAuswahl(p)))}
      vorschau={{ name: p.name, marke: marke.name, bild }}
      locale={locale}
      // Badge „Sofort lieferbar“ NUR für die vom Inhaber kuratierte Lagerliste (lib/shop/lieferzeit.js, UWG § 2 AT / § 5 DE).
      sofortLieferbar={istSofortLieferbar(item.slug)}
      copy={{
        ...pickCopy(locale, ADD_TO_CART_KEYS),
        inStock: shopCopy(locale).inStock,
        ...liste,
        inklMwst,
      }}
      hinweis={hinweis}
    />
  );
}
