// src/lib/shop/cart.js
// Warenkorb auf dem SERVER: Eingabe normalisieren (nur slug, variante,
// menge – alles andere, z. B. ein mitgeschickter Preis, wird verworfen) und
// mit den Katalogdaten bepreisen. Der Browser rechnet nur zur Anzeige mit
// denselben Server-Werten, die die Seite ihm gibt.
// Keine "@/"-Importe.
import { createHash } from "node:crypto";
import { findSellable, grundpreis } from "./catalog.js";
import { UST_NORMALSATZ_AT, ustAufteilung, ustAusBrutto, ustKlasse } from "./ust.js";
import { CART_MAX_LINES, CART_MAX_QTY } from "./cartLimits.js";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** → [{ slug, variante, menge }] (gültig, zusammengeführt, gekappt) */
export function normalizeCart(raw) {
  const out = new Map();
  for (const x of Array.isArray(raw) ? raw.slice(0, 50) : []) {
    const slug = String(x?.slug ?? "").trim().toLowerCase();
    const variante = String(x?.variante ?? "standard").trim().toLowerCase() || "standard";
    const menge = Math.trunc(Number(x?.menge));
    if (!SLUG_RE.test(slug) || slug.length > 120 || !SLUG_RE.test(variante) || variante.length > 64) continue;
    if (!(menge >= 1)) continue;
    const key = `${slug}|${variante}`;
    const prev = out.get(key);
    out.set(key, { slug, variante, menge: Math.min(CART_MAX_QTY, (prev?.menge || 0) + menge) });
    if (out.size >= CART_MAX_LINES) break;
  }
  return [...out.values()];
}

/** Enthaltene USt aus einem Bruttobetrag (Cent). Sätze/Regeln: ./ust.js. */
export const mwstAus = (bruttoCent, satz = UST_NORMALSATZ_AT) => ustAusBrutto(bruttoCent, satz);

/**
 * @param {Array<{slug, variante, menge}>} lines  normalizeCart-Ergebnis
 * @param {{ heute: string, mode: string, produkte?: object[], testartikel?: object[] }} opts
 */
export function priceCart(lines, opts) {
  const zeilen = [];
  const fehler = [];
  for (const l of lines) {
    const item = findSellable(l.slug, opts);
    if (!item) {
      fehler.push({ slug: l.slug, code: "nicht_verkaeuflich" });
      continue;
    }
    const v = item.varianten.find((x) => x.id === l.variante);
    if (!v) {
      fehler.push({ slug: l.slug, code: "variante" });
      continue;
    }
    zeilen.push({
      slug: item.slug,
      variante: v.id,
      varianteName: v.name,
      varianten: item.varianten,
      name: item.name,
      marke: item.marke,
      markeName: item.markeName,
      kategorie: item.kategorie,
      // USt-Klasse je Kategorie (ust.js: Bildband = ermäßigt 10 %, sonst 20 %).
      ustKlasse: ustKlasse(item.kategorie),
      test: item.test,
      // K17: Varianten-Feld vor Artikel-Wert; Versanddaten der Variante für das Paketprofil.
      zerbrechlich: typeof v.zerbrechlich === "boolean" ? v.zerbrechlich : item.zerbrechlich,
      versandGewichtG: v.versandGewichtG || null,
      versandMasseCm: v.versandMasseCm || null,
      // Paketgröße: Produktmaße + Inhalt (ml/g) der Variante (paketprofile.js pakettypOf)
      masse: item.masse || null,
      inhalt: v.inhalt || item.inhalt || null,
      menge: l.menge,
      einzelCent: v.cent,
      summeCent: v.cent * l.menge,
      // fix-01: Inhalt je Variante (inhaltMl/inhaltG), sonst Artikel. Nur bei Grundpreis-Pflicht
      // (catalog.js: GRUNDPREIS_KATEGORIEN) – ein Weinglas wird nicht nach Volumen verkauft
      // (Optik-QA r2: „Grundpreis: € 56,35 / 1 l“ beim Zalto Gravitas Omega aus 960 ml Füllmenge).
      grundpreis: item.grundpreisPflicht ? grundpreis(v.cent, v.inhalt || item.inhalt) : null,
      grundpreisFehlt: item.grundpreisPflicht && !(v.inhalt || item.inhalt),
      stand: item.stand,
      bild: item.bild,
    });
  }
  const warenCent = zeilen.reduce((s, z) => s + z.summeCent, 0);
  // Ohne Lieferziel: Abholung (AT-Sätze) – nur Anzeige; totals() rechnet mit dem echten Ziel.
  return { ok: fehler.length === 0 && zeilen.length > 0, zeilen, fehler, warenCent, mwstCent: ustAufteilung({ zeilen }).ustCent };
}

/**
 * Gesamtsumme mit Versand (Cent) und enthaltener USt je Satz (ust.js).
 * @param {{ lieferart?: "versand"|"abholung", land?: string|null, ossAktiv?: boolean }} [ziel]  ohne Ziel: Abholung (AT)
 * → { warenCent, versandCent, gesamtCent, mwstCent, ust: { steuerland, posten: [{ satz, bruttoCent, warenCent, versandCent, ustCent, nettoCent }] } }
 */
export function totals(priced, versandCent = 0, ziel = {}) {
  const v = versandCent || 0;
  const gesamtCent = priced.warenCent + v;
  const a = ustAufteilung({ zeilen: priced.zeilen || [], versandCent: v, lieferart: ziel.lieferart || (v ? "versand" : "abholung"), land: ziel.land ?? (v ? "AT" : null), ossAktiv: ziel.ossAktiv });
  return { warenCent: priced.warenCent, versandCent: v, gesamtCent, mwstCent: a.ustCent, ust: { steuerland: a.steuerland, posten: a.posten } };
}

/** Fingerabdruck von Warenkorb + Ziel: bindet einen Versandtarif an genau diese Bestellung. */
export function cartHash(zeilen, ziel = {}) {
  const s = [...zeilen]
    .map((z) => `${z.slug}:${z.variante}:${z.menge}:${z.einzelCent}`)
    .sort()
    .join(",");
  const z = [ziel.land, ziel.plz, ziel.ort, ziel.strasse, ziel.hausnr].map((x) => String(x ?? "").trim().toLowerCase()).join("|");
  return createHash("sha256").update(`${s}#${z}`).digest("hex").slice(0, 32);
}
