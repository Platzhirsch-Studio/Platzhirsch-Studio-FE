// src/lib/stilfinder/weltPicks.js
// Profil-Kuratierung (31.10.2026): the Stil-Finder only drew on the
// backoffice catalogue (Wohnen, Essen, Poliform-Küche, Schlafen, Outdoor).
// The static manufacturer catalogue (src/lib/katalog: Bad & Wellness,
// Küchengeräte, Accessoires-Shop – 3 000+ products) never appeared in a
// result. This module adds per profile two hand-picked products per world.
//
// Rules (tested in tests/unit/stilfinder-welt-picks.test.mjs):
//   - only real catalogue slugs; the reason for each pick is a fact from the
//     product's own catalogue text (material, form), nothing invented;
//   - two per world, one brand once per profile, one category once per world,
//     no slug in two profiles (variety between the results);
//   - the product needs a picture (first `bilder` entry), shown unaltered;
//   - brand credit = MARKE.name; `dealer` only via the Claim-Guard
//     (isVerifiedDealerBrand) – the tile never writes its own dealer text;
//   - no prices here (the product page shows them where the owner allows).
// Pure module, no "@/..." imports: node --test loads it directly.
import { ALLE_PRODUKTE, WELTEN, markeBySlug, produktPath } from "../katalog/index.js";
import { isVerifiedDealerBrand } from "../legal/claims.js";

export const WELT_ORDER = ["bad-wellness", "kuechengeraete", "accessoires"];
export const PICKS_PER_WELT = 2;

// [slug, Begründung aus dem Katalogtext]
export const WELT_PICKS = {
  ruhe: {
    "bad-wellness": [
      ["antoniolupi-mina", "Waschtisch, laut Hersteller u. a. aus Holz und Marmor – ruhige, warme Flächen."],
      ["starpool-bridge-lounger", "Ruheliege mit geschwungenem Profil aus gebogenem Sperrholz und Eiche."],
    ],
    kuechengeraete: [
      ["dornbracht-vaia-kueche", "Küchenarmatur mit weichen Radien und feiner Silhouette."],
      ["quooker-flex-round", "Runder Auslauf, kochendes Wasser aus einer Armatur – eine Armatur weniger auf der Platte."],
    ],
    accessoires: [
      ["baobab-collection-scented-candle-sand-siloli", "Duftkerze der Linie Sand – Ihre Grundfarbe im Kerzenlicht."],
      ["kahler-hammershoei-vase", "Porzellanvase der Serie Hammershøi – zurückhaltend, Ton in Ton mit Ihrer Palette."],
    ],
  },
  warm: {
    "bad-wellness": [
      ["antoniolupi-legno", "Hängende Waschtischplatte Wood – Holz auch im Bad."],
      ["starpool-shade-sauna", "Finnische Sauna mit Blenden aus wechselnden Holzlamellen."],
    ],
    kuechengeraete: [
      ["miele-dgc-7865", "Dampfbackofen für die Küche, in der für viele gekocht wird."],
      ["quooker-classic-fusion-round", "Armatur im klassischen Design mit seitlichem Hebel."],
    ],
    accessoires: [
      ["kahler-omaggio-vase", "Vase aus Irdengut – Keramik mit Charakter."],
      ["baobab-collection-scented-candle-aspen", "Duftkerze der Duftfamilie holzig."],
    ],
  },
  see: {
    "bad-wellness": [
      ["soleum-omega", "Runde, fugenlose Spa-Kabine für innen und außen."],
      ["aquavia-spa-swimspa-sky", "Kompaktes Swimspa für innen und außen – Wasser auch zu Hause."],
    ],
    kuechengeraete: [
      ["bora-x-pure", "Kochfeld mit integriertem Abzug – offene Küche ohne Haube, der Blick bleibt frei."],
      ["liebherr-vinidor-unterbau-weinkuehlschrank", "Unterbau-Weinkühlschrank mit Glastür, für den Abend auf der Terrasse."],
    ],
    accessoires: [
      ["flos-in-vitro-unplugged", "Tragbare Außenleuchte in Laternenform – Licht für die Dämmerung draußen."],
      ["lyngby-porcelaen-lyngby-vase-glas", "Vase aus mundgeblasenem Glas."],
    ],
  },
  salon: {
    "bad-wellness": [
      ["dornbracht-madison", "Klassisch-historische Armaturenserie mit Porzellanplättchen in den Griffen."],
      ["starpool-starlit", "Ruheliege nach dem Vorbild klassischer Dormeuses des 17. Jahrhunderts."],
    ],
    kuechengeraete: [
      ["gaggenau-eb-333", "Backofen im Format 90 × 48 cm – ein Gerät mit Auftritt."],
      ["liebherr-grandcru-einbau-weinklimaschrank", "Weinklimaschrank für das Dinner mit Gästen."],
    ],
    accessoires: [
      ["cire-trudon-cabinet-des-miroirs-duftkerze", "Duftkerze „Cabinet des miroirs“ im Glas mit Trudon-Emblem."],
      ["riedel-amadeo-dekanter", "Handgefertigter Dekanter aus Kristallglas."],
    ],
  },
  klar: {
    "bad-wellness": [
      ["dornbracht-meta", "Minimalistische Armaturenserie auf Basis eines Zylinders."],
      ["soleum-snow-white", "Wärmeliege in weißer Betonoptik, puristisch in der Form."],
    ],
    kuechengeraete: [
      ["gaggenau-go-250", "Backofen der Serie Minimalistic."],
      ["bora-x-pure-max", "Kochfeld mit integriertem Abzug – alles in einer Fläche."],
    ],
    accessoires: [
      ["flos-gustave-residential", "Tragbare Tischleuchte aus Aluminium."],
      ["lyngby-porcelaen-lyngby-1936-vase", "Vase aus Edelstahl."],
    ],
  },
};

const firstImage = (p) => (Array.isArray(p?.bilder) ? p.bilder.find((b) => b?.src) : null) || null;
const text = (t) => (typeof t === "string" ? t : t?.de || "");

/**
 * weltEmpfehlungen(profileKey, { imageExists }) →
 *   [{ welt, items: [{ slug, name, brand, brandSlug, dealer, kategorie, href, image, alt, why }] }]
 * Unknown slugs, products of another world and products without a picture
 * (or whose file `imageExists(src)` rejects) are left out, never replaced by
 * a guess.
 */
export function weltEmpfehlungen(profileKey, { imageExists = () => true } = {}) {
  const picks = WELT_PICKS[profileKey];
  if (!picks) return [];
  return WELT_ORDER.filter((w) => WELTEN[w]).map((welt) => {
    const items = [];
    for (const [slug, why] of picks[welt] || []) {
      const p = ALLE_PRODUKTE.find((x) => x.slug === slug && x.welt === welt);
      const img = firstImage(p);
      if (!p || !img || !imageExists(img.src)) continue;
      const marke = markeBySlug(p.marke);
      items.push({
        slug: p.slug,
        name: p.name.trim(),
        brand: marke?.name || p.marke,
        brandSlug: p.marke,
        dealer: isVerifiedDealerBrand(p.marke),
        kategorie: p.kategorie,
        href: `/de${produktPath(welt, p.slug)}`,
        image: img.src,
        alt: text(img.alt) || `${marke?.name || p.marke} ${p.name.trim()}`,
        why,
      });
      if (items.length >= PICKS_PER_WELT) break;
    }
    return { welt, items };
  });
}
