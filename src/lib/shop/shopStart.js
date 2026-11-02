// src/lib/shop/shopStart.js
// Daten der Shop-Startseite /<locale>/accessoires, der Shop-Kopfleiste und des
// Menüpunkts „Shop“ – ausschließlich aus dem statischen Katalog
// (src/lib/katalog) und der Shop-Konfiguration abgeleitet:
//   - Abteilungen (Kacheln): nur Katalog-Kategorien mit Produkten; eine
//     Kategorie, die keiner Abteilung zugeordnet ist, wird eigene Abteilung
//     (nichts verschwindet still).
//   - Edits: Geschenke (Kategorie geschenkset), Für den Tisch (glas, karaffe,
//     geschirr), Ausgewählt (AUSGEWAEHLT in src/lib/katalog/index.js) und
//     „Neu im Sortiment“ NUR aus NEU_IM_SORTIMENT (leer = Abschnitt fehlt).
//     Das Prüfdatum `stand` ist KEIN Aufnahmedatum (heute tragen alle 1 725
//     Produkte denselben Stand) – daraus wird nie „neu“ abgeleitet.
//   - Hero-Bild: eine Raumszene (MARKE.looks) mit belegter Quelle, unverändert
//     gezeigt, Bildnachweis „Bild: <Marke>“.
//   - Serviceleiste: aus SHOP_MODE und den Lieferländern (LAENDER) – nur
//     zutreffende Aussagen; bei SHOP_MODE off nur Showroom/Anfrage.
// Rein, ohne "@/"-Importe (node --test).
import { AUSGEWAEHLT, KATALOG_MARKEN, kategorienMitProdukten, looksVon, markenMitProdukten, produkteByKategorie, produkteByWelt } from "../katalog/index.js";
import { kategoriePath, markePath, produktePath } from "../katalog/welten.js";
import { laenderListe, startCopy } from "./startCopy.js";

export const SHOP_WELT = "accessoires";
export const SHOP_START_PATH = "/accessoires";
export const SHOP_SUCHE_PATH = "/accessoires/suche";
export const SHOP_WARENKORB_PATH = "/shop/warenkorb";
export const SHOP_LOCALES = Object.freeze(["de", "en", "fr", "it"]);

/**
 * Abteilungen des Shops (Reihenfolge = Kacheln, Kopfleiste, Menü). Die erste
 * Kategorie mit Produkten ist das Ziel der Kachel; die übrigen erscheinen als
 * Unterlinks. Neue Katalog-Kategorie der Accessoire-Welt: hier zuordnen
 * (sonst wird sie automatisch eigene Abteilung, Test prüft die Abdeckung).
 */
export const ABTEILUNGEN = Object.freeze([
  Object.freeze({ id: "duft", kategorien: Object.freeze(["duftkerze", "raumduft", "diffuser"]) }),
  Object.freeze({ id: "glas", kategorien: Object.freeze(["glas", "karaffe", "bar-zubehoer"]) }),
  Object.freeze({ id: "buecher", kategorien: Object.freeze(["bildband"]) }),
  Object.freeze({ id: "keramik", kategorien: Object.freeze(["vase", "geschirr"]) }),
  Object.freeze({ id: "leuchten", kategorien: Object.freeze(["tragbare-leuchte"]) }),
  Object.freeze({ id: "parfum", kategorien: Object.freeze(["parfum"]) }),
  Object.freeze({ id: "wohnen", kategorien: Object.freeze(["wohnaccessoire"]) }),
  Object.freeze({ id: "geschenke", kategorien: Object.freeze(["geschenkset"]) }),
]);

/**
 * „Neu im Sortiment“: Produkt-Slugs, die der Inhaber ausdrücklich als neu
 * aufgenommen bestätigt hat (Datum + Beleg im Commit). Leer = kein Abschnitt.
 * Nie aus `stand` (Prüfdatum) oder Dateireihenfolge ableiten.
 */
export const NEU_IM_SORTIMENT = Object.freeze([]);

/**
 * Kachelbild je Abteilung, wenn das automatisch gewählte nicht passt (Optik-QA r2): Parfum – das erste
 * Trudon-Flakonbild hat einen eigenen helleren Grund (RGB 250) und stand als Kasten in der Kachel;
 * Geschenksets – das erste Produkt (Kerzenlöscher-Box) war zugleich die erste Kachel der Geschenk-Reihe.
 * Beide Ersatzbilder: Freisteller auf reinem Weiß (Eckpixel 255). Fehlt ein Slug, gilt die Automatik.
 */
export const ABTEILUNG_BILD = Object.freeze({ parfum: "cire-trudon-carmen-parfum", geschenke: "cire-trudon-duftkerzen-set" });

/** Raumszene für den Hero: Marke + Look-ID aus MARKE.looks (Fallback: erste Szene der Welt). */
export const HERO_LOOK = Object.freeze({ marke: "riedel", look: "veritas-am-wasser" });

const markeName = (slug) => KATALOG_MARKEN.find((m) => m.slug === slug)?.name || slug;
const mitBild = (p) => Array.isArray(p.bilder) && p.bilder.length > 0;

/**
 * Abteilungen mit Produkten:
 * [{ id, href, anzahl, kategorien: [{ slug, href, anzahl }], bildProdukt }]
 * `label` setzt der Aufrufer (startCopy(locale).abteilung[id] bzw. Kategorie-Label bei Fremd-Kategorien).
 */
export function abteilungen(welt = SHOP_WELT) {
  const vorhanden = kategorienMitProdukten(welt);
  const zugeordnet = new Set(ABTEILUNGEN.flatMap((a) => a.kategorien));
  const liste = [
    ...ABTEILUNGEN.map((a) => ({ id: a.id, kategorien: a.kategorien.filter((k) => vorhanden.includes(k)), eigen: false })),
    // Nicht zugeordnete Kategorie → eigene Abteilung (id = Kategorie-Slug).
    ...vorhanden.filter((k) => !zugeordnet.has(k)).map((k) => ({ id: k, kategorien: [k], eigen: true })),
  ];
  return liste
    .filter((a) => a.kategorien.length)
    .map((a) => {
      const kategorien = a.kategorien.map((slug) => ({ slug, href: kategoriePath(welt, slug), anzahl: produkteByKategorie(welt, slug).length }));
      const produkte = a.kategorien.flatMap((k) => produkteByKategorie(welt, k));
      // Kachelbild: ein „Ausgewähltes“ Produkt der Abteilung, sonst das erste mit Bild (Katalogreihenfolge).
      const gesetzt = produkte.find((p) => p.slug === ABTEILUNG_BILD[a.id] && mitBild(p));
      const ausgewaehlt = gesetzt || produkte.find((p) => p.ausgewaehlt && mitBild(p));
      return {
        id: a.id,
        eigen: a.eigen,
        href: kategorien[0].href,
        anzahl: produkte.length,
        kategorien,
        bildProdukt: ausgewaehlt || produkte.find(mitBild) || null,
      };
    });
}

/** Label einer Abteilung (Fremd-Kategorien: Label der Katalog-Kategorie über katLabel). */
export function abteilungLabel(a, locale, katLabel = (k) => k) {
  return a.eigen ? katLabel(a.id) : startCopy(locale).abteilung[a.id] || katLabel(a.id);
}

/**
 * Bis zu n Produkte aus Kategorien, je Marke reihum (Vielfalt statt 4× dieselbe
 * Marke), nur mit Bild, deterministisch (Katalogreihenfolge).
 */
export function reihum(kategorien, n = 4, welt = SHOP_WELT) {
  const list = kategorien.flatMap((k) => produkteByKategorie(welt, k)).filter(mitBild);
  const jeMarke = new Map();
  for (const p of list) {
    if (!jeMarke.has(p.marke)) jeMarke.set(p.marke, []);
    jeMarke.get(p.marke).push(p);
  }
  // Je Kategorie abwechselnd, damit „Für den Tisch“ nicht nur Gläser zeigt.
  const queues = [...jeMarke.values()].map((ps) => {
    const byKat = kategorien.map((k) => ps.filter((p) => p.kategorie === k));
    const out = [];
    for (let i = 0; out.length < ps.length; i++) for (const q of byKat) if (q[i]) out.push(q[i]);
    return out;
  });
  const out = [];
  for (let i = 0; out.length < n && queues.some((q) => q[i]); i++) {
    for (const q of queues) {
      if (q[i] && out.length < n) out.push(q[i]);
    }
  }
  return out;
}

/** Curated Edits der Startseite (nur mit Produkten). */
export function edits(welt = SHOP_WELT, n = 4) {
  const alle = produkteByWelt(welt);
  const bySlug = (s) => alle.find((p) => p.slug === s);
  const out = [];
  const geschenke = produkteByKategorie(welt, "geschenkset");
  if (geschenke.length) out.push({ id: "geschenke", produkte: reihum(["geschenkset"], n, welt), href: kategoriePath(welt, "geschenkset"), anzahl: geschenke.length });
  const tischKats = ["glas", "karaffe", "geschirr"].filter((k) => produkteByKategorie(welt, k).length);
  if (tischKats.length) out.push({ id: "tisch", produkte: reihum(tischKats, n, welt), href: kategoriePath(welt, tischKats[0]), anzahl: tischKats.reduce((s, k) => s + produkteByKategorie(welt, k).length, 0), kategorien: tischKats });
  const auswahl = (AUSGEWAEHLT[welt] || []).map(bySlug).filter(Boolean).slice(0, n);
  if (auswahl.length) out.push({ id: "auswahl", produkte: auswahl, href: produktePath(welt), anzahl: alle.length });
  const neu = NEU_IM_SORTIMENT.map(bySlug).filter(Boolean).slice(0, n);
  if (neu.length) out.push({ id: "neu", produkte: neu, href: produktePath(welt), anzahl: neu.length });
  return out.filter((e) => e.produkte.length);
}

/** Marken mit Produkten in der Welt: [{ slug, name, href, anzahl, dealer }]. */
export function shopMarken(welt = SHOP_WELT) {
  return markenMitProdukten(welt).map((m) => ({
    slug: m.slug,
    name: m.name,
    href: markePath(welt, m.slug),
    anzahl: produkteByWelt(welt).filter((p) => p.marke === m.slug).length,
    dealer: m.dealer === true,
  }));
}

/** Hero-Raumszene { bild, marke, markeName, titel } oder null (dann Text-Hero). */
export function heroLook(welt = SHOP_WELT, wahl = HERO_LOOK) {
  const ok = (l) => l?.bild?.src && l.bild.width > 0 && l.bild.height > 0 && l.bild.quelleUrl;
  const gewaehlt = looksVon(wahl.marke, welt).find((l) => l.id === wahl.look);
  if (ok(gewaehlt)) return { bild: gewaehlt.bild, marke: wahl.marke, markeName: markeName(wahl.marke), titel: gewaehlt.titel };
  for (const m of markenMitProdukten(welt)) {
    const l = looksVon(m.slug, welt).find(ok);
    if (l) return { bild: l.bild, marke: m.slug, markeName: m.name, titel: l.titel };
  }
  return null;
}

/**
 * Serviceleiste aus der Konfiguration. mode: "off" | "test" | "live" (src/lib/shop/mode.js),
 * laender: LAENDER aus src/lib/commerce/shipping/config.js ({ AT: { versand: true }, … }).
 * → [{ id, text }] – nur zutreffende Aussagen.
 */
export function serviceLeiste(mode, laender, locale) {
  const c = startCopy(locale);
  if (mode !== "test" && mode !== "live") {
    return [
      { id: "showroom", text: c.serviceShowroom },
      { id: "anfrage", text: c.serviceAnfrage },
      { id: "beratung", text: c.serviceBeratung },
    ];
  }
  const mit = Object.keys(laender || {}).filter((k) => laender[k]?.versand === true);
  const ohne = Object.keys(laender || {}).filter((k) => laender[k]?.versand !== true);
  return [
    ...(mit.length ? [{ id: "versand", text: c.serviceVersand(laenderListe(mit, locale)) }] : []),
    { id: "abholung", text: c.serviceAbholung },
    { id: "zahlung", text: c.serviceZahlung },
    ...ohne.map((k) => ({ id: `ohne-${k.toLowerCase()}`, text: c.serviceVersandOhne(c.laender[k] || k) })),
  ];
}

/**
 * Soll-Tabelle des Menüpunkts „Shop“: [[abteilungId, zielPfad]]. shellNav.js
 * führt eine statische Kopie (NAV_SHOP), damit die Markendateien (mehrere MB)
 * nicht mit dem Layout in jede Seite kommen; tests/unit/shop-startseite.test.mjs
 * gleicht beide ab.
 */
export function navShopTabelle(welt = SHOP_WELT) {
  return abteilungen(welt)
    .filter((a) => !a.eigen)
    .map((a) => [a.id, a.href]);
}

/**
 * Sitemap-Eintrag der Shop-Startseite (alle vier Sprachen, hreflang wie die
 * Seite). lastModified = jüngstes Prüfdatum der Produkte der Welt – nie new Date().
 * null, solange die Welt keine Produkte hat (dann ist /accessoires 404).
 * Die Suche (/accessoires/suche) ist noindex und steht NICHT in der Sitemap.
 */
export function shopStartSitemapPage(welt = SHOP_WELT) {
  const list = produkteByWelt(welt);
  if (!list.length) return null;
  return { path: SHOP_START_PATH, locales: [...SHOP_LOCALES], lastModified: list.map((p) => p.stand).sort().pop() || null };
}
