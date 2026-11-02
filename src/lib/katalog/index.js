// src/lib/katalog/index.js
// Sammel-Index des statischen Herstellerkatalogs (schema.js, welten.js).
// Neue Marke: Datei src/lib/katalog/marken/<marke>.js anlegen und HIER eine
// Import-Zeile + Eintrag in MARKEN_DATEIEN ergänzen (sonst nichts).
// Rein, ohne "@/"-Importe (node --test, tools/wellness/export-frappe.mjs).
import * as agape from "./marken/agape.js";
import * as dornbracht from "./marken/dornbracht.js";
import * as antoniolupi from "./marken/antoniolupi.js";
import * as starpool from "./marken/starpool.js";
import * as soleum from "./marken/soleum.js";
import * as fabioAlemanno from "./marken/fabio-alemanno.js";
import * as aquaviaSpa from "./marken/aquavia-spa.js";
import * as naggura from "./marken/naggura.js";
import * as gaggenau from "./marken/gaggenau.js";
import * as miele from "./marken/miele.js";
import * as vZug from "./marken/v-zug.js";
import * as bora from "./marken/bora.js";
import * as liebherr from "./marken/liebherr.js";
import * as quooker from "./marken/quooker.js";
import * as baobabCollection from "./marken/baobab-collection.js";
import * as riedel from "./marken/riedel.js";
import * as cireTrudon from "./marken/cire-trudon.js";
// Nr. 32 (31.10.2026): Shop-Erweiterung Accessoire-Welt
import * as zalto from "./marken/zalto.js";
import * as assouline from "./marken/assouline.js";
import * as kahler from "./marken/kahler.js";
import * as lyngbyPorcelaen from "./marken/lyngby-porcelaen.js";
import * as flos from "./marken/flos.js";
import * as tomDixon from "./marken/tom-dixon.js";
// Nr. 34 (31.10.2026): Spiegelau und Nachtmann (Riedel-Gruppe, AT-Shop riedel.com) – ohne Händlersatz
import * as spiegelau from "./marken/spiegelau.js";
import * as nachtmann from "./marken/nachtmann.js";
import { KATEGORIEN } from "./schema.js";
import { WELTEN, kategoriePath, markePath, produktPath, produktePath, seitePath, weltOfBereich } from "./welten.js";

/** Reihenfolge = Reihenfolge auf den Seiten (wie /bad-wellness und /kuechengeraete). */
export const MARKEN_DATEIEN = Object.freeze({
  agape,
  dornbracht,
  antoniolupi,
  starpool,
  soleum,
  "fabio-alemanno": fabioAlemanno,
  "aquavia-spa": aquaviaSpa,
  naggura,
  gaggenau,
  miele,
  "v-zug": vZug,
  bora,
  liebherr,
  quooker,
  "baobab-collection": baobabCollection,
  riedel,
  "cire-trudon": cireTrudon,
  zalto,
  assouline,
  kahler,
  "lyngby-porcelaen": lyngbyPorcelaen,
  flos,
  "tom-dixon": tomDixon,
  spiegelau,
  nachtmann,
});

/** Alle Marken (MARKE-Objekte) in Seitenreihenfolge. */
export const KATALOG_MARKEN = Object.freeze(Object.values(MARKEN_DATEIEN).map((m) => m.MARKE));

/**
 * „Ausgewählte Produkte“ je Welt (K16, 31.10.2026) – zentral hier, nicht in den
 * Markendateien: höchstens 4 je Welt, je Marke eines. Das Feld `ausgewaehlt` in
 * den Markendateien wird ignoriert (Unit-Test prüft, dass es dort nicht steht).
 */
export const AUSGEWAEHLT = Object.freeze({
  kuechengeraete: Object.freeze(["gaggenau-go-250", "miele-dgc-7865", "bora-x-pure-max", "quooker-flex-round"]),
  "bad-wellness": Object.freeze(["starpool-classic-sauna", "soleum-lagoon", "dornbracht-comfort-shower", "antoniolupi-fortepiano"]),
  accessoires: Object.freeze(["baobab-collection-scented-candle-sand-siloli", "riedel-vinum-cabernet-sauvignon-merlot", "cire-trudon-cabinet-des-miroirs-duftkerze", "zalto-gravitas-omega"]),
});

const KAT_ORDER = Object.keys(KATEGORIEN);
/** Sortierung: Kategorie (Reihenfolge KATEGORIEN), dann Reihenfolge in der Marken-Datei. */
const byKategorie = (a, b) => KAT_ORDER.indexOf(a.kategorie) - KAT_ORDER.indexOf(b.kategorie) || a._i - b._i;

/**
 * Alle Produkte aller Marken, mit `welt` ergänzt (Feld welt des Produkts, sonst
 * MARKE.welt – K2, 31.10.2026: Welt je Produkt, z. B. Dornbracht-Küchenarmaturen
 * in der Küchengeräte-Welt), nach Kategorie sortiert (stabil je Marke).
 */
export const ALLE_PRODUKTE = Object.freeze(
  Object.values(MARKEN_DATEIEN)
    .flatMap((m) => m.PRODUKTE.map((p, i) => {
      const welt = p.welt || m.MARKE.welt;
      return { ...p, welt, ausgewaehlt: (AUSGEWAEHLT[welt] || []).includes(p.slug), _i: i };
    }))
    .sort((a, b) => KATALOG_MARKEN.findIndex((m) => m.slug === a.marke) - KATALOG_MARKEN.findIndex((m) => m.slug === b.marke) || byKategorie(a, b))
    .map(({ _i, ...p }) => Object.freeze(p))
);

/**
 * Inhaber-Entscheidung Nr. 25: alle Produkte je Marke (auch 100+). Seiten
 * werden darum gruppiert (nach Kategorie) und paginiert:
 *   Übersicht      je Kategorie höchstens UEBERSICHT_JE_KATEGORIE Kacheln + Link,
 *   Kategorie/Marke höchstens SEITE_GROESSE Kacheln je Seite (/seite/<n>).
 */
export const SEITE_GROESSE = 48;
// QM R1 (01.11.2026): 6 statt 8 – passt in das 2er- (Handy) und 3er-Raster (Desktop) ohne
// Lücke am Gruppenende (3+3+2), und die Übersicht Bad & Wellness wird ein Viertel kürzer.
export const UEBERSICHT_JE_KATEGORIE = 6;

/** Anzahl Seiten einer Liste (mind. 1). */
export const seitenAnzahl = (list, size = SEITE_GROESSE) => Math.max(1, Math.ceil(list.length / size));
/** Ausschnitt der Seite n (1-basiert). */
export const seiteVon = (list, n, size = SEITE_GROESSE) => list.slice((n - 1) * size, n * size);

/** Gruppen nach Kategorie (Reihenfolge KATEGORIEN): [{kategorie, produkte}]. */
export function nachKategorie(list) {
  const map = new Map();
  for (const p of [...list].sort((a, b) => KAT_ORDER.indexOf(a.kategorie) - KAT_ORDER.indexOf(b.kategorie))) {
    if (!map.has(p.kategorie)) map.set(p.kategorie, []);
    map.get(p.kategorie).push(p);
  }
  return [...map].map(([kategorie, produkte]) => ({ kategorie, produkte }));
}

export const markeBySlug = (slug) => KATALOG_MARKEN.find((m) => m.slug === slug) || null;
export const produktBySlug = (slug) => ALLE_PRODUKTE.find((p) => p.slug === slug) || null;
/** Produkte einer Marke; mit welt nur die dieser Welt (Markenseite /<welt>/marke/<marke>). */
export const produkteByMarke = (slug, welt = null) => ALLE_PRODUKTE.filter((p) => p.marke === slug && (!welt || p.welt === welt));
export const produkteByWelt = (welt) => ALLE_PRODUKTE.filter((p) => p.welt === welt);
/** Produkte einer Kategorie in einer Welt (sortiert nach Marke). */
export const produkteByKategorie = (welt, kategorie) => produkteByWelt(welt).filter((p) => p.kategorie === kategorie);
/** Kategorien einer Welt mit mindestens einem Produkt. */
export const kategorienMitProdukten = (welt) => nachKategorie(produkteByWelt(welt)).map((g) => g.kategorie);

/**
 * Marken mit mindestens einem Produkt in dieser Welt (nur diese bekommen dort eine Seite und den Link).
 * Auch Marken einer anderen Heimat-Welt (Feld welt am Produkt, z. B. Dornbracht in der Küche).
 */
export function markenMitProdukten(welt) {
  const slugs = new Set(produkteByWelt(welt).map((p) => p.marke));
  const liste = KATALOG_MARKEN.filter((m) => slugs.has(m.slug));
  // Marken dieser Welt zuerst, dann Gäste (stabile Reihenfolge wie KATALOG_MARKEN).
  return [...liste.filter((m) => m.welt === welt), ...liste.filter((m) => m.welt !== welt)];
}

/** true, wenn die Marke eine Katalogseite hat (≥ 1 Produkt). */
export const hatProdukte = (markeSlug) => ALLE_PRODUKTE.some((p) => p.marke === markeSlug);

/**
 * Querverweise einer Marke (Nr. 28, z. B. Riedel → Weinklima), nur wenn das Ziel
 * Produkte hat: [{ welt, kategorie, anzahl }].
 */
export function querverweiseVon(markeSlug) {
  const m = markeBySlug(markeSlug);
  return (m?.querverweise || [])
    .map((q) => ({ ...q, anzahl: produkteByWelt(q.welt).filter((p) => p.kategorie === q.kategorie).length }))
    .filter((q) => q.anzahl > 0);
}

/** Verwandte Produkte (Feld verwandt: Slugs), nur vorhandene. */
export const verwandteVon = (p) => (p.verwandt || []).map((s) => ALLE_PRODUKTE.find((x) => x.slug === s)).filter(Boolean);

/** „Ausgewählte Produkte“ einer Welt (Reihenfolge wie AUSGEWAEHLT), höchstens n. */
export function ausgewaehlteProdukte(welt, n = 4) {
  return (AUSGEWAEHLT[welt] || [])
    .map((s) => ALLE_PRODUKTE.find((p) => p.slug === s && p.welt === welt))
    .filter(Boolean)
    .slice(0, n);
}

/** Filterwerte einer Welt, die wirklich vorkommen (Reihenfolge wie KATEGORIEN / Marken). */
export function filterOptionen(welt) {
  const list = produkteByWelt(welt);
  const has = (key, v) => list.some((p) => p[key] === v);
  return {
    bereiche: WELTEN[welt].bereiche.filter((b) => has("bereich", b)),
    kategorien: Object.keys(KATEGORIEN).filter((k) => has("kategorie", k)),
    marken: markenMitProdukten(welt).map((m) => m.slug),
  };
}

/** Pfade (ohne Locale) für Seiten, Sitemap und Einblicke – nur Seiten, die es gibt. */
export function katalogPfade() {
  const out = [];
  for (const welt of Object.keys(WELTEN)) {
    if (!produkteByWelt(welt).length) continue;
    out.push({ typ: "uebersicht", welt, path: produktePath(welt) });
    for (const kategorie of kategorienMitProdukten(welt)) {
      const base = kategoriePath(welt, kategorie);
      const list = produkteByKategorie(welt, kategorie);
      out.push({ typ: "kategorie", welt, kategorie, path: base });
      for (let n = 2; n <= seitenAnzahl(list); n++) out.push({ typ: "kategorie", welt, kategorie, seite: n, path: seitePath(base, n) });
    }
    for (const m of markenMitProdukten(welt)) {
      const base = markePath(welt, m.slug);
      out.push({ typ: "marke", welt, marke: m.slug, path: base });
      for (let n = 2; n <= seitenAnzahl(produkteByMarke(m.slug, welt)); n++) out.push({ typ: "marke", welt, marke: m.slug, seite: n, path: seitePath(base, n) });
    }
    for (const p of produkteByWelt(welt)) out.push({ typ: "produkt", welt, slug: p.slug, marke: p.marke, path: produktPath(welt, p.slug) });
  }
  return out;
}

/** Letztes Prüfdatum der Produkte einer Welt/Marke (lastmod der Sitemap), sonst null. */
export function letzterStand(list) {
  return list.map((p) => p.stand).sort().pop() || null;
}

export { WELTEN, kategoriePath, markePath, produktPath, produktePath, seitePath, weltOfBereich };

// ---------------------------------------------------------------------------
// Zubehör und Looks (Inhaber-Auftrag 31.10.2026, schema.js validateZubehoer/validateLooks)

/** Zubehör eines Produkts: [{ p, hinweis }] – nur vorhandene Produkte. */
export const zubehoerVon = (p) =>
  (p?.zubehoer || [])
    .map((z) => ({ p: ALLE_PRODUKTE.find((x) => x.slug === z.slug), hinweis: z.hinweis || null }))
    .filter((z) => z.p);

/** Looks (Raumszenen) einer Marke, mit aufgelösten Produkten: [{ ...look, produkte: Produkt[] }]; mit welt nur Looks mit Produkten dieser Welt. */
export const looksVon = (markeSlug, welt = null) =>
  (markeBySlug(markeSlug)?.looks || [])
    .map((l) => ({ ...l, produkte: l.produkte.map((s) => ALLE_PRODUKTE.find((x) => x.slug === s)).filter(Boolean) }))
    .filter((l) => l.produkte.length && (!welt || l.produkte.some((x) => x.welt === welt)));

/** Looks, in denen ein Produkt vorkommt (alle Marken). */
export const looksMitProdukt = (slug) => KATALOG_MARKEN.flatMap((m) => looksVon(m.slug).filter((l) => l.produkte.some((x) => x.slug === slug)));
