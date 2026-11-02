// src/lib/katalog/shopIndex.js
// Server-Seite der Shop-Liste (Accessoire-Welt): baut aus Katalogprodukten die
// kompakten Einträge für shopListe.js (Kachel, Filter, Sortierung) und die
// Varianten-Anzeige der Kaufbox. Quelle ausschließlich die Herstellerdaten
// (src/lib/katalog/marken/*) und die Preisregeln (preisAktiv, sellableOf):
//   - Preis nur, wenn anzeigbar (Schalter, Quelle, Stand ≤ 3 Monate, nicht
//     PREISE_PAUSIERT – Assouline/Tom Dixon bleiben ohne Preis),
//   - „Online bestellbar“ nur, wenn sellableOf() den Artikel liefert,
//   - Facetten nur aus Merkmalen mit Präfix „Duftfamilie:“ / „Material:“.
// Rein, ohne "@/"-Importe (node --test).
import { ALLE_PRODUKTE, AUSGEWAEHLT, markeBySlug, verwandteVon, zubehoerVon } from "./index.js";
import { KATALOG_LOCALES, preisAktiv, textOf } from "./schema.js";
import { galerie } from "./ausfuehrung.js";
import { heuteIso, katalogPreiseAn } from "./config.js";
import { sellableOf, slugOf, toCent, variantenOf } from "../shop/catalog.js";
import { GRUNDPREIS_ANZEIGE, bildKurz, euroAusCent, grundpreis, inhaltDesArtikels, mischen } from "./shopListe.js";

/** Merkmal-Präfixe (deutscher Text) → Facette. */
export const FACETTEN_PRAEFIX = Object.freeze({ duft: "Duftfamilie", material: "Material" });

const nachDoppelpunkt = (s) => {
  const i = String(s || "").indexOf(":");
  if (i < 0) return "";
  const v = s.slice(i + 1).trim();
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : "";
};

/** Facettenwerte eines Produkts: { duft?: { slug, label: Text4 }, material?: … }. */
export function facettenVon(p) {
  const out = {};
  for (const m of p?.merkmale || []) {
    const de = typeof m === "string" ? m : m?.de;
    for (const [key, praefix] of Object.entries(FACETTEN_PRAEFIX)) {
      if (out[key] || !de?.startsWith(`${praefix}:`)) continue;
      const slug = slugOf(nachDoppelpunkt(de));
      if (!slug) continue;
      out[key] = { slug, label: Object.fromEntries(KATALOG_LOCALES.map((l) => [l, nachDoppelpunkt(typeof m === "string" ? m : m[l] || de)])) };
    }
  }
  return out;
}

/** Bild als [pfad, w, h]; pfad kurz (bildKurz in shopListe.js), Herstellerbild unverändert. */
const bildTupel = (b, p) => (b ? [bildKurz(b.src, p), b.width, b.height] : null);

/** Kachelbild + Hover-Bild: Freisteller zuerst; Hover bevorzugt ein Raumbild, sonst die nächste Ansicht. */
export function kachelBilder(p) {
  const g = galerie(p);
  const erstes = g.freisteller[0] || g.ambiente[0] || g.detail[0] || p?.bilder?.[0] || null;
  const zweites = [...g.ambiente, ...g.freisteller, ...g.detail].find((b) => b && erstes && b.src !== erstes.src) || null;
  return { i: bildTupel(erstes, p), j: bildTupel(zweites, p) };
}

/**
 * Kompakter Eintrag eines Produkts (Format: shopListe.js).
 * @param {object} p
 * @param {{ heute?: string, mode?: "off"|"test"|"live", an?: boolean }} opts
 */
export function eintragVon(p, { heute = heuteIso(), mode = "off", an = katalogPreiseAn() } = {}) {
  const preis = preisAktiv(p, { heute, an });
  const cents = preis?.art === "verkaufspreis" ? variantenOf(preis).map((v) => v.cent).filter((c) => c > 0) : preis?.art === "uvp-ab" ? [toCent(preis.uvpAb)] : [];
  const varianten = preis?.varianten?.length || 0;
  const optionen = p.ausfuehrungen?.[0]?.optionen?.length || 0;
  const f = Object.fromEntries(Object.entries(facettenVon(p)).map(([k, v]) => [k, v.slug]));
  const online = mode === "off" ? null : sellableOf(p, { heute, mode }) ? 1 : 0;
  return {
    s: p.slug,
    n: p.name,
    m: p.marke,
    k: p.kategorie,
    ...kachelBilder(p),
    p: cents.length ? Math.min(...cents) : null,
    x: cents.length ? Math.max(...cents) : null,
    v: Math.max(varianten, optionen) >= 2 ? Math.max(varianten, optionen) : 0,
    o: online,
    a: (AUSGEWAEHLT[p.welt] || []).includes(p.slug) ? 1 : 0,
    ...(Object.keys(f).length ? { f } : {}),
  };
}

/**
 * Einträge einer Liste in Standard-Reihenfolge (mischen: reihum je Marke, auf
 * Markenseiten reihum je Kategorie).
 */
export function eintraegeFuer(list, opts = {}, gruppe = "m") {
  return mischen(list.map((p) => eintragVon(p, opts)), gruppe);
}

/** Beschriftungen der Facetten duft/material in allen Sprachen: { duft: { slug: Text4 }, material: {…} }. */
export function facettenLabels(list) {
  const out = { duft: {}, material: {} };
  for (const p of list) for (const [k, v] of Object.entries(facettenVon(p))) out[k][v.slug] ||= v.label;
  return out;
}

/** Markennamen { slug: name } der Liste. */
export const markenNamen = (list) => Object.fromEntries([...new Set(list.map((p) => p.marke))].map((s) => [s, markeBySlug(s)?.name || s]));

/**
 * Varianten für die Kaufbox: gleiche IDs wie der Warenkorb (variantenOf), Preis
 * je Variante und – in Volumen-Kategorien mit belegtem Inhalt – Grundpreis.
 * → [{ id, name, cent, preis, grundpreis: string|null }]
 */
export function variantenAnzeige(p, preis, locale = "de") {
  if (preis?.art !== "verkaufspreis") return [];
  const gp = GRUNDPREIS_ANZEIGE.includes(p?.kategorie);
  const artikelInhalt = inhaltDesArtikels(p);
  // Gleiche Quelle wie Warenkorb/Kasse (sellableOf, cart.js): Inhalt je Variante, sonst Artikel.
  return variantenOf(preis).map((v) => {
    const g = gp ? grundpreis(v.cent, v.inhalt || artikelInhalt) : null;
    return {
      id: v.id,
      name: v.name ? textOf(v.name, locale) : null,
      cent: v.cent,
      preis: euroAusCent(v.cent, locale),
      grundpreis: g ? `${euroAusCent(g.cent, locale)} / ${g.je}` : null,
    };
  });
}

/**
 * „Passt dazu“: Zubehör und verwandte Produkte aus den Daten, aufgefüllt mit
 * derselben Marke + Kategorie, dann derselben Kategorie anderer Marken
 * (nur mit Bild, ohne das Produkt selbst). → [{ p, hinweis: Text4|null }]
 */
export function passtDazu(p, n = 4, alle = ALLE_PRODUKTE) {
  const out = [];
  const seen = new Set([p.slug]);
  const add = (x, hinweis = null) => {
    if (!x || seen.has(x.slug) || x.welt !== p.welt || !x.bilder?.length || out.length >= n) return;
    seen.add(x.slug);
    out.push({ p: x, hinweis });
  };
  for (const z of zubehoerVon(p)) add(z.p, z.hinweis);
  for (const x of verwandteVon(p)) add(x);
  for (const x of alle) if (x.marke === p.marke && x.kategorie === p.kategorie) add(x);
  for (const x of alle) if (x.kategorie === p.kategorie) add(x);
  return out;
}
