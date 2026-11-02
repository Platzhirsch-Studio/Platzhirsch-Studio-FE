// src/lib/shop/catalog.js
// Verkaufbare Artikel des Shops – EINZIGE Preisquelle für Warenkorb,
// Versand und Stripe-Session. Preise kommen IMMER von hier (Server), nie vom
// Browser. Verkaufbar ist nur:
//   - eine Marke aus VERKAUF_MARKEN (Nr. 27/28/29: baobab-collection, riedel,
//     cire-trudon) – Möbel, Bad, Wellness, Küchengeräte nie,
//   - mit preis.art "verkaufspreis", gültiger Quelle und Stand ≤ 3 Monate
//     (preisAktiv aus dem Katalog-Schema, das wir NICHT ändern),
//   - bei Grundpreis-pflichtigen Kategorien (Raumduft, Nachfüller) nur mit
//     Inhaltsangabe; ohne sie im Testmodus mit Warnung, live gesperrt.
// Testartikel (TESTARTIKEL) gibt es nur im Testmodus: der Katalog ist noch
// leer (Daten-Teams füllen ihn), E2E und Vorschau brauchen etwas zum Kaufen.
// Sie sind klar als Testartikel benannt, haben keine Hersteller-Preise und
// erscheinen nie auf echten Produktseiten.
// Rein, ohne "@/"-Importe (node --test).
import { ALLE_PRODUKTE, markeBySlug } from "../katalog/index.js";
import { PREIS_ARTEN, SLUG_RE, preisAktiv, textOf } from "../katalog/schema.js";
import { kategorieHinweis } from "./paketprofile.js";
import { UST_NORMALSATZ_AT } from "./ust.js";
import { studioFassung } from "../../components/Katalog/studioFond.js";
// Grundpreis: eine Rechnung, eine Kategorienliste (Anzeige = Kasse) – lib/katalog/shopListe.js (importfrei).
import { GRUNDPREIS_ANZEIGE, grundpreis, inhaltDerVariante, inhaltDesArtikels } from "../katalog/shopListe.js";

export { grundpreis };

// Eine Quelle: alle Marken, die laut Katalog-Schema echte Verkaufspreise haben dürfen
// (Nr. 27/28 Baobab, Riedel, Trudon; Nr. 32 Zalto, Assouline, Kähler, Lyngby, Akku-Leuchten
// Flos/Tom Dixon; Nr. 34 Spiegelau, Nachtmann) – Inhaber 31.10.2026: alle im Onlineshop.
export const VERKAUF_MARKEN = PREIS_ARTEN.verkaufspreis.nurMarken;
/** Kategorien mit Grundpreis-Pflicht (PrAG § 10a, PAngV § 4: Ware nach Volumen). */
// fix-01: Parfum wird nach Volumen (ml) angeboten → grundpreispflichtig. Duftkerze (g) prüft die Kanzlei.
// Nicht Glas/Karaffe: dort ist inhaltMl das Fassungsvermögen, kein verkaufter Inhalt.
export const GRUNDPREIS_KATEGORIEN = GRUNDPREIS_ANZEIGE;
/** @deprecated Nur AT-Normalsatz – Sätze je Kategorie/Land kommen aus ./ust.js (ustSatz, ustAufteilung). */
export const MWST_SATZ = UST_NORMALSATZ_AT;

export const slugOf = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export const toCent = (euro) => Math.round(Number(euro) * 100);

/**
 * Testartikel (nur SHOP_MODE test). Beträge sind bewusst runde Testwerte,
 * KEINE Produktpreise. Paketprofil über die Kategorie wie echte Artikel.
 */
export const TESTARTIKEL = Object.freeze([
  Object.freeze({ slug: "testartikel-kerze", marke: "testartikel", markeName: "Testartikel", name: "Testartikel Kerze (kein echtes Produkt)", kategorie: "duftkerze", test: true, preis: { art: "verkaufspreis", stand: "2026-10-31", quelle: "https://example.invalid/test", varianten: [{ name: "Klein", betrag: 10 }, { name: "Groß", betrag: 25.5 }] } }),
  Object.freeze({ slug: "testartikel-glas", marke: "testartikel", markeName: "Testartikel", name: "Testartikel Glas (kein echtes Produkt, zerbrechlich)", kategorie: "glas", test: true, zerbrechlich: true, preis: { art: "verkaufspreis", stand: "2026-10-31", quelle: "https://example.invalid/test", betrag: 12 } }),
  Object.freeze({ slug: "testartikel-raumduft", marke: "testartikel", markeName: "Testartikel", name: "Testartikel Raumduft (kein echtes Produkt)", kategorie: "raumduft", test: true, inhalt: { menge: 250, einheit: "ml" }, preis: { art: "verkaufspreis", stand: "2026-10-31", quelle: "https://example.invalid/test", betrag: 5 } }),
  // Prüft den ermäßigten Satz (ust.js: Kategorie bildband = 10 % AT), solange Assouline pausiert ist (PREISE_PAUSIERT).
  Object.freeze({ slug: "testartikel-bildband", marke: "testartikel", markeName: "Testartikel", name: "Testartikel Bildband (kein echtes Produkt, ermäßigte USt)", kategorie: "bildband", test: true, preis: { art: "verkaufspreis", stand: "2026-10-31", quelle: "https://example.invalid/test", betrag: 40 } }),
]);

/** Versand-/Shopfelder einer Preis-Variante (nur Herstellerangaben, null = fehlt). */
const versandFelder = (v) => ({
  sku: v?.sku || null,
  // fix-01: Schema-Felder preis.varianten[].inhaltMl / inhaltG (von den Daten-Teams erfasst)
  inhalt: inhaltDerVariante(v),
  zerbrechlich: typeof v?.zerbrechlich === "boolean" ? v.zerbrechlich : null,
  versandGewichtG: v?.versandGewichtG || null,
  versandMasseCm: Array.isArray(v?.versandMasseCm) ? v.versandMasseCm : null,
});

/**
 * Varianten eines Preises als [{ id, name(Text4|string), cent, sku, zerbrechlich, versandGewichtG, versandMasseCm }]
 * (ohne Varianten: eine mit id "standard"). id: Feld id der Variante (Slug, K10) oder Slug des deutschen Namens.
 */
export function variantenOf(preis) {
  if (!preis) return [];
  if (preis.betrag != null) return [{ id: "standard", name: null, cent: toCent(preis.betrag), ...versandFelder(null) }];
  const seen = new Set();
  return (preis.varianten || []).map((v, i) => {
    let id = (typeof v.id === "string" && SLUG_RE.test(v.id) ? v.id : slugOf(textOf(v.name, "de"))) || `v${i + 1}`;
    if (seen.has(id)) id = `${id}-${i + 1}`;
    seen.add(id);
    return { id, name: v.name, cent: toCent(v.betrag), ...versandFelder(v) };
  });
}

/**
 * K10: Ausführungs-Auswahl des Konfigurators → Varianten-ID des Warenkorbs.
 * Je Variante die passende Option je Gruppe (null = Gruppe egal):
 * → { [variantenId]: Array<optionId|null> }. Zuordnung: Options-id = Varianten-ID,
 * sonst Slug des Optionsnamens im Variantennamen, sonst (eine Gruppe) gleicher Betrag.
 */
export function ausfuehrungZuVariante(p, varianten = variantenOf(p?.preis)) {
  const gruppen = p?.ausfuehrungen || [];
  if (!gruppen.length || varianten.length < 2) return {};
  const tokens = (s) => `-${s}-`;
  const out = {};
  for (const v of varianten) {
    const vname = slugOf(textOf(v.name, "de"));
    const passend = gruppen.map((g) => {
      const exakt = g.optionen.find((o) => o.id === v.id);
      if (exakt) return exakt.id;
      const treffer = g.optionen.filter((o) => {
        const oname = slugOf(textOf(o.name, "de"));
        return o.id === v.id || (oname && (oname === vname || tokens(vname).includes(tokens(oname)))) || tokens(v.id).includes(tokens(o.id));
      });
      if (treffer.length === 1) return treffer[0].id;
      if (gruppen.length === 1) {
        const betrag = g.optionen.filter((o) => typeof o.betrag === "number" && toCent(o.betrag) === v.cent);
        if (betrag.length === 1 && varianten.filter((x) => x.cent === v.cent).length === 1) return betrag[0].id;
      }
      return null;
    });
    if (passend.some(Boolean)) out[v.id] = passend;
  }
  // Nur eindeutige Zuordnungen behalten (zwei Varianten mit gleicher Optionsfolge → verwerfen).
  const key = (a) => a.join("|");
  const zaehl = Object.values(out).reduce((m, a) => m.set(key(a), (m.get(key(a)) || 0) + 1), new Map());
  for (const [id, a] of Object.entries(out)) if (zaehl.get(key(a)) > 1) delete out[id];
  return out;
}

/** Varianten-ID zur Auswahl (Optionen je Gruppe) oder null. */
export function varianteZurAuswahl(zuordnung, auswahl = []) {
  const treffer = Object.entries(zuordnung || {}).filter(([, a]) => a.every((o, i) => o == null || o === auswahl[i]));
  if (!treffer.length) return null;
  // Genaueste Zuordnung (meiste festgelegte Gruppen) gewinnt.
  treffer.sort((x, y) => y[1].filter(Boolean).length - x[1].filter(Boolean).length);
  return treffer[0][0];
}

/**
 * Verkaufbarer Artikel (öffentliche Sicht für Server-Seiten) oder null.
 * @param {object} p  Katalogprodukt
 * @param {{ heute: string, mode: "off"|"test"|"live" }} opts
 */
export function sellableOf(p, { heute, mode }) {
  if (!p || mode === "off") return null;
  if (p.test) {
    if (mode !== "test") return null;
  } else {
    if (!VERKAUF_MARKEN.includes(p.marke)) return null;
    if (p.bereich !== "accessoires") return null;
  }
  const preis = p.test ? p.preis : preisAktiv(p, { heute });
  if (!preis || preis.art !== "verkaufspreis") return null;
  const grundpreisPflicht = GRUNDPREIS_KATEGORIEN.includes(p.kategorie);
  const inhalt = inhaltDesArtikels(p);
  let varianten = variantenOf(preis).map((v) => ({ ...v, inhalt: v.inhalt || inhalt }));
  if (varianten.some((v) => !(v.cent > 0))) return null;
  // fix-01: live nur Varianten MIT Inhaltsangabe (Grundpreis) statt den ganzen Artikel zu sperren.
  if (grundpreisPflicht && mode === "live") varianten = varianten.filter((v) => v.inhalt);
  if (!varianten.length) return null;
  return {
    slug: p.slug,
    marke: p.marke,
    markeName: p.markeName || markeBySlug(p.marke)?.name || p.marke,
    name: p.name,
    kategorie: p.kategorie,
    test: Boolean(p.test),
    // K17: aus dem Varianten-Feld (irgendeine Variante zerbrechlich), sonst Kategorie – nicht mehr fest „Riedel“.
    zerbrechlich: Boolean(p.zerbrechlich) || varianten.some((v) => v.zerbrechlich === true) || (varianten.every((v) => v.zerbrechlich == null) && kategorieHinweis(p.kategorie).zerbrechlich),
    grundpreisPflicht,
    inhalt,
    grundpreisFehlt: grundpreisPflicht && varianten.some((v) => !v.inhalt),
    stand: preis.stand,
    varianten,
    // Produktmaße für die Paketgröße (paketprofile.js pakettypOf), unverändert aus dem Katalog.
    masse: Array.isArray(p.masse) ? p.masse : null,
    // Zalto: helle „-frei“-Fassung (Optik-QA r2: graues Hochformat im hellen Quadrat des Mini-Warenkorbs).
    bild: studioFassung(p.bilder?.[0]?.src, p.marke, "frei") || p.bilder?.[0]?.src || null,
  };
}

/** Alle verkaufbaren Artikel (Katalog + im Test die Testartikel). */
export function sellableList({ heute, mode, produkte = ALLE_PRODUKTE, testartikel = TESTARTIKEL }) {
  return [...produkte, ...(mode === "test" ? testartikel : [])].map((p) => sellableOf(p, { heute, mode })).filter(Boolean);
}

/** Artikel zum Slug oder null. */
export function findSellable(slug, opts) {
  const list = [...(opts.produkte || ALLE_PRODUKTE), ...(opts.mode === "test" ? opts.testartikel || TESTARTIKEL : [])];
  return sellableOf(list.find((p) => p.slug === slug), opts);
}

// grundpreis(cent, inhalt): siehe lib/katalog/shopListe.js (oben re-exportiert).
