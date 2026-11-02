// src/lib/pinterest/rights.js — welche Bilder einen „Merken auf Pinterest“-Link
// bekommen (Inhaber-Entscheidung Nr. 14, 29.10.2026).
//
// Regel: AUF PINTEREST NUR eigene Fotos, Haralds echtes Material und
// Ezarri-Bilder (Nutzung erlaubt, Quelle „Ezarri“). Minotti-, Poliform- und
// Custom-Line-Bilder NIE – deren Freigaben gelten für Sofaplaner und
// Yacht-Seite, nicht für Pinterest. Alles, was hier nicht ausdrücklich steht,
// ist gesperrt (Allowlist, Standard = nein). Ein gesperrtes Bild zeigt keinen
// Merken-Link; „Zum Ideenboard“ bleibt (das Board ist privat).
//
// Neue Quelle freigeben = einen Eintrag in ALLOW ergänzen, mit Verweis auf
// das Bildregister (Marktresearch/recht/bildrechte.csv). Keine KI-Bilder als
// echte Räume: Material mit kiStufe außer "keine"/"retusche" bleibt gesperrt.
//
// Rein, ohne Importe (Client, Server und node --test).

export const SITE_HOST = "platzhirsch.studio";

// Harte Sperre vor jeder Freigabe: Herstellerbilder ohne Pinterest-Recht.
export const DENY_RE = /(?:minotti|poliform|custom[-_ ]?line|navetta|ferretti|rimadesio|classicon|(?:^|[^a-z])flos(?:[^a-z]|$))/i;

/**
 * Freigegebene Bildquellen. `match` ist ein Pfad-Präfix (endet auf "/") oder
 * ein exakter Pfad; `quelle` steht in der Pin-Beschreibung bzw. im Export.
 */
export const ALLOW = Object.freeze([
  // Ezarri: Händlervertrag + schriftliche Nutzungserlaubnis (Entscheidung Nr. 7)
  { match: "/ezarri/", quelle: "Ezarri", art: "ezarri" },
  // Showroom-Foto Lochau (/Images/Home/aboutHome.jpg): NICHT freigegeben,
  // bis der Inhaber den Umfang inkl. Pinterest bestätigt und das Bildregister
  // auf „frei“ steht (QA Recht P1-3; Nr. 11 nennt nur „Rechte am Foto“).
  // Dann wieder aufnehmen:
  // { match: "/Images/Home/aboutHome.jpg", quelle: "Platzhirsch Home Living", art: "eigen" },
  // Haralds Material (Handzeichnung, Modell, Rendering) – nur über
  // src/lib/arbeitsweise/media.js eingetragen, mit Einwilligung
  { match: "/arbeitsweise/", quelle: "Harald Menghin, Platzhirsch", art: "harald" },
  // Referenzprojekte: eigene Fotos (bildSchema: nutzungsrecht "Web, Social …").
  // Der Merken-Link erscheint zusätzlich NUR, wenn die Einwilligung der
  // Bauherrschaft den Kanal nennt: einwilligung.umfang enthält "pinterest"
  // (ProjektArtikel.js, QA Recht P1-1).
  { match: "/projekte/", quelle: "Platzhirsch Home Living", art: "projekt" },
  // Projekt-Tagebuch (/api/portal/tagebuch/referenz/) bewusst NICHT: die
  // Einwilligung (src/lib/portal/tagebuch/config.js, EINWILLIGUNG) deckt nur
  // die Website unter /projekte. Erst mit eigener, getrennter Einwilligung
  // „Social Media / Pinterest“ (neue EINWILLIGUNG.version, Kanzlei) aufnehmen
  // (QA Recht P0).
  // Eigene Grafik: Stil-Finder-Palette als 2:3-Karte (keine Fotos darin)
  { match: "/stil-palette/", quelle: "Platzhirsch Stil-Finder", art: "grafik" },
]);

/** Pfad eines Bildes (relativ oder absolut auf unserer Domain), sonst null. */
export function imagePath(src) {
  if (typeof src !== "string" || !src || src.length > 600) return null;
  if (src.startsWith("/") && !src.startsWith("//")) return src.split("#")[0];
  try {
    const u = new URL(src);
    const host = u.hostname.replace(/^www\./, "");
    if (u.protocol !== "https:" || host !== SITE_HOST) return null;
    return u.pathname + u.search;
  } catch {
    return null;
  }
}

/**
 * Darf dieses Bild auf Pinterest gemerkt werden?
 * @param {string} src Bildpfad oder absolute URL
 * @param {{kiStufe?: string}} [meta] optionale Angaben aus dem Bildregister
 * @returns {{ok: true, quelle: string, art: string} | {ok: false, grund: string}}
 */
export function pinRights(src, meta = {}) {
  const p = imagePath(src);
  if (!p) return { ok: false, grund: "fremd" };
  if (p.includes("..")) return { ok: false, grund: "pfad" };
  const pathOnly = p.split("?")[0];
  if (DENY_RE.test(decodeSafe(pathOnly))) return { ok: false, grund: "hersteller" };
  if (meta.kiStufe && !["keine", "retusche"].includes(meta.kiStufe)) return { ok: false, grund: "ki" };
  const hit = ALLOW.find((a) => (a.match.endsWith("/") ? pathOnly.startsWith(a.match) : pathOnly === a.match));
  if (!hit) return { ok: false, grund: "nicht-freigegeben" };
  return { ok: true, quelle: hit.quelle, art: hit.art };
}

export const canPin = (src, meta) => pinRights(src, meta).ok;

function decodeSafe(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
