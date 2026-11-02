// src/components/Katalog/preis.js
// Preisanzeige des Herstellerkatalogs (Inhaber-Entscheidungen Nr. 26/27).
// Rein (ohne "@/"), damit node --test sie prüfen kann.
//   uvp-ab (Küchengeräte):  „UVP ab € 2.490 inkl. 20 % MwSt. · Stand 31.10.2026“
//                            bzw. mit bezeichnung "herstellerpreis" (Nr. 34)
//                            „Herstellerpreis ab € …“ + optional zusatz + „Preis Österreich“
//                            · „Ihr Preis mit Lieferung, Einbau und Montage auf Anfrage“ (eine Zeile)
//   verkaufspreis (Baobab):  „€ 79 inkl. 20 % MwSt.“ bzw. je Variante + Stand
import { preisAb, preisAktiv, preisBezeichnung, preisGueltigBis, textOf } from "../../lib/katalog/schema.js";
import { heuteIso, katalogPreiseAn } from "../../lib/katalog/config.js";

const NUM = { de: "de-AT", en: "en-GB", fr: "fr-FR", it: "it-IT" };

/** „€ 2.490“ (de-AT) / „€2,490“ (en-GB) …; Cent nur, wenn vorhanden. */
export function formatEuro(betrag, locale = "de") {
  const ganz = Number.isInteger(betrag);
  return new Intl.NumberFormat(NUM[locale] || "de-AT", { style: "currency", currency: "EUR", minimumFractionDigits: ganz ? 0 : 2, maximumFractionDigits: ganz ? 0 : 2 }).format(betrag);
}

export function formatDatum(iso, locale = "de") {
  try {
    return new Intl.DateTimeFormat(NUM[locale] || "de-AT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
  } catch {
    return iso;
  }
}

/** Anzeigbarer Preis eines Produkts (Schalter KATALOG_PREISE, Alter, Struktur) oder null. */
export function anzeigePreis(p, { heute = heuteIso(), an = katalogPreiseAn() } = {}) {
  return preisAktiv(p, { heute, an });
}

/**
 * Texte für Kachel und Detail.
 * @param {object} preis  Ergebnis von anzeigePreis()
 * @param {Function} t    next-intl-Übersetzer (Namespace katalog)
 */
export function preisTexte(preis, t, locale) {
  if (!preis) return null;
  const datum = formatDatum(preis.stand, locale);
  if (preis.art === "uvp-ab") {
    const p = formatEuro(preis.uvpAb, locale);
    // Nr. 34: „Herstellerpreis ab“ (Hersteller-Shop) oder „UVP ab“ (Standard)
    const h = preisBezeichnung(preis) === "herstellerpreis";
    return {
      kurz: t(h ? "preis.herstellerKurz" : "preis.kurz", { preis: p }),
      zeilen: [t(h ? "preis.herstellerAb" : "preis.uvpAb", { preis: p, datum })],
      zusatz: preis.zusatz ? textOf(preis.zusatz, locale) : null,
      land: t("preis.land"),
      paket: null, // in der Preiszeile enthalten (Nr. 34)
      varianten: [],
    };
  }
  if (preis.betrag != null) {
    const p = formatEuro(preis.betrag, locale);
    return { kurz: p, zeilen: [t("preis.verkauf", { preis: p }), t("preis.stand", { datum })], land: t("preis.land"), paket: null, varianten: [] };
  }
  const ab = formatEuro(preisAb(preis), locale);
  return {
    kurz: t("preis.ab", { preis: ab }),
    zeilen: [t("preis.stand", { datum })],
    land: t("preis.land"),
    paket: null,
    varianten: preis.varianten.map((v) => ({ name: textOf(v.name, locale), preis: t("preis.verkauf", { preis: formatEuro(v.betrag, locale) }) })),
  };
}

/**
 * JSON-LD-Angebot (Inhaber-Entscheidung Nr. 26/27: bewusste Ausnahme von der
 * Regel „nie offers“ – NUR für Katalogprodukte mit anzeigbarem Preis):
 * uvp-ab → AggregateOffer mit lowPrice; verkaufspreis → Offer bzw.
 * AggregateOffer (Varianten). Nie aggregateRating/review.
 */
export function preisOffer(preis, url) {
  if (!preis) return null;
  const base = { priceCurrency: "EUR", priceValidUntil: preisGueltigBis(preis), url };
  if (preis.art === "uvp-ab") return { "@type": "AggregateOffer", lowPrice: preis.uvpAb, ...base };
  if (preis.betrag != null) return { "@type": "Offer", price: preis.betrag, ...base };
  const b = preis.varianten.map((v) => v.betrag);
  return { "@type": "AggregateOffer", lowPrice: Math.min(...b), highPrice: Math.max(...b), offerCount: b.length, ...base };
}
