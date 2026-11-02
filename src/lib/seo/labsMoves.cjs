// src/lib/seo/labsMoves.cjs – alte /labs-URLs → feste, sprechende URLs
// (Inhaber-Entscheidung Nr. 9, 28.10.2026: keine separate Labs-Welt).
//
// CommonJS, weil next.config.js es mit require() lädt; tests/unit/
// integration-urls.test.mjs importiert es ebenfalls. Keine Pakete.
//
// Regeln:
// - 308 (permanent) für alle vier Sprachpräfixe. Die Seiten gibt es auf
//   Deutsch, deshalb zeigt jedes Ziel auf /de/… (vorher lieferten
//   /en|fr|it/labs/… ohnehin 404).
// - Unterpfade und Query bleiben erhalten (/de/labs/sofaplaner/katalog/x?a=1
//   → /de/sofaplaner/katalog/x?a=1; Next reicht die Query weiter).
// - NUR mit Sprachpräfix: /labs/… ohne Präfix sind statische Dateien in
//   public/labs/ (Texturen, 3D-Modelle, Bilder), die bleiben, wo sie sind.
//   Redirects laufen vor dem Dateisystem (redirects.md), ein Muster ohne
//   Präfix würde sie verbiegen.
// - /api/labs/* bleibt (interne Schnittstellen, nicht öffentlich verlinkt).
// - Runde 5 P6 (recht P2): /labs/yacht → /de/yacht-interior statt auf den Hub
//   /leistungen. Ziel direkt /de/… (nicht /<locale>/yacht-interior): die
//   Seite gibt es nur auf Deutsch, /en|fr|it/yacht-interior leitet selbst
//   per 308 auf /de/…?lang= um (deOnlyRedirects.cjs) – so bleibt es EIN Hop.
//   `rest: false`: /yacht-interior hat keine Unterseiten, Unterpfade der
//   alten Labs-Seite landen auf der Seite selbst statt auf einer 404.

/** Alter Pfad unter /labs (ohne Sprache) → neuer Pfad (ohne Sprache). */
const LABS_MOVES = [
  { from: "kuechenplaner", to: "/kuechenplaner" },
  { from: "sofaplaner", to: "/sofaplaner" },
  { from: "stilfinder", to: "/stil-finder" },
  { from: "ar-viewer", to: "/3d-ansicht" },
  { from: "dreilaender", to: "/dreilaender-rechner" },
  { from: "concierge", to: "/concierge" },
  { from: "upload-demo", to: "/upload" },
  { from: "yacht", to: "/yacht-interior", rest: false },
];

/** Die Übersicht /labs selbst. */
const LABS_HUB_TARGET = "/leistungen";

const LOCALE_PATTERN = ":locale(de|en|fr|it)";

/** Einträge für next.config.js redirects(). */
function labsRedirects() {
  const out = [];
  for (const m of LABS_MOVES) {
    out.push({ source: `/${LOCALE_PATTERN}/labs/${m.from}`, destination: `/de${m.to}`, permanent: true });
    out.push({
      source: `/${LOCALE_PATTERN}/labs/${m.from}/:rest*`,
      destination: m.rest === false ? `/de${m.to}` : `/de${m.to}/:rest*`,
      permanent: true,
    });
  }
  // Übersicht und alles Unbekannte darunter.
  out.push({ source: `/${LOCALE_PATTERN}/labs`, destination: `/de${LABS_HUB_TARGET}`, permanent: true });
  out.push({ source: `/${LOCALE_PATTERN}/labs/:rest*`, destination: `/de${LABS_HUB_TARGET}`, permanent: true });
  return out;
}

// Rat 9,5 B20 (T6): Teilen-Bilder der Werkzeuge liegen jetzt unter /og/
// (public/og/<id>.jpg, Inhaber-Entscheidung Nr. 9: keine Labs-Pfade nach
// außen). Die alten Adressen /labs/og/<id>.jpg (geteilte Links, Caches der
// Netzwerke) antworten mit EINEM 308 auf /og/<id>.jpg. Eigene Funktion, weil
// labsRedirects() nur Regeln MIT Sprachpräfix liefert (public/labs/* bleibt
// sonst unberührt). Einbindung in next.config.js redirects():
// ...labsAssetRedirects().
const LABS_ASSET_MOVES = Object.freeze([{ from: "/labs/og", to: "/og" }]);

/** 308-Regeln für verschobene öffentliche Dateien (ohne Sprachpräfix). */
function labsAssetRedirects() {
  return LABS_ASSET_MOVES.map((m) => ({ source: `${m.from}/:file`, destination: `${m.to}/:file`, permanent: true }));
}

/** Zielpfad (mit /de) für einen alten Pfad wie "/de/labs/ar-viewer/x" – für Tests und Doku. */
function newPathFor(oldPath) {
  const m = /^\/(de|en|fr|it)\/labs(?:\/([^/?#]+)(\/[^?#]*)?)?$/.exec(oldPath);
  if (!m) return null;
  const move = LABS_MOVES.find((x) => x.from === m[2]);
  if (!move) return `/de${LABS_HUB_TARGET}`;
  return `/de${move.to}${move.rest === false ? "" : m[3] || ""}`;
}

module.exports = { LABS_MOVES, LABS_HUB_TARGET, LABS_ASSET_MOVES, labsRedirects, labsAssetRedirects, newPathFor };
