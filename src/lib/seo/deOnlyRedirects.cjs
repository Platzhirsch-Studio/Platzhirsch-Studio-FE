// Reine DE-Seiten in EN/FR/IT → ein 308 auf die deutsche Seite (P6 Runde 2,
// r2-technik.md P1-8, Gesamtwerk P1-5, Neuland P1).
//
// Vorher: /en/ezarri, /en/yacht-interior, /fr/sofaplaner … liefen in
// `if (locale !== "de") notFound()` und kamen als leere Client-Hülle
// (<html id="__next_error__">, ohne lang/h1, ~150 KB) an – eine Sackgasse
// für EN-Besucher und ein weicher Fehler für Crawler. Jetzt antwortet
// next.config.js redirects() (läuft VOR dem Proxy und dem Dateisystem, docs
// 01-next-config-js/redirects.md) mit genau EINEM 308 auf /de/<pfad>; der
// Parameter ?lang=<en|fr|it> sagt der Seite (und der Analyse), aus welcher
// Sprache der Besucher kam.
//
// Quelle der Liste: alle Seiten unter src/app/[locale]/ mit
// `if (locale !== "de") notFound()` bzw. ezarriLocaleEnabled(), deren DE-Fassung
// immer 200 liefert (am 28.10.2026 gegen :3000 und :3100 geprüft). Nicht hier:
// Seiten hinter Schaltern (gutscheine, atelierverkauf, portal, zahlung,
// upload, preview, projekte/vorlage) – sie bleiben 404, sonst führte der 308 auf
// eine deutsche 404. showroom ist mehrsprachig. Ebenso nicht: ratgeber und
// adventsabend – in Produktion bis zur Freigabe bzw. bestätigten Uhrzeit 404
// (recht P1-5/P2-6); ihre EN/FR/IT-Adressen bekommen im Proxy die echte 404.
//
// TREE = auch alle Unterseiten (/en/ezarri/pool → /de/ezarri/pool).
// EXACT = nur die Seite selbst (Unterpfade wie /kuechenplaner/druck oder
// /3d-ansicht/uebergabe sind Werkzeug-/API-Pfade und bleiben 404).

// Sprach-Integration 01.11.2026: "stil-finder" ist raus (Quiz und Ergebnis
// gibt es jetzt in DE/EN/FR/IT).
const DE_ONLY_TREE = Object.freeze(["projekte", "3d-ansicht"]);

// Welle 2 (Inhaber 29.10.2026, Nr. 13): Seiten in DE und EN, FR/IT → 308 auf /de.
// Sprach-Integration 01.11.2026: Yacht, Sofaplaner und die Ezarri-Welt gibt es
// jetzt auch auf Französisch und Italienisch – beide Listen sind leer (die
// Namen bleiben, andere Module lesen sie).
const FR_IT_ONLY_TREE = Object.freeze([]);
const FR_IT_ONLY_EXACT = Object.freeze([]);

// Ezarri-Werkzeuge nur in DE/EN (EZARRI_LOCALES in src/lib/ezarri/config.js):
// FR/IT → 308 auf die ENGLISCHE Fassung, wie die Links der Ezarri-Welt
// (deLinks.ezLinkProps). Konfigurator und Rechner sind viersprachig
// (konfigurator/intl.js TOOL_LOCALES) und stehen deshalb nicht hier.
const FR_IT_TO_EN_EZARRI_TOOLS = Object.freeze(["custom-mix", "anfrage"]);

// R5-fix P2 (gesamtwerk P1-2, bewusst geändert): "arbeitsweise" ist raus –
// die Seite gibt es jetzt in DE/EN/FR/IT (/en|fr|it/arbeitsweise = 200, eigene
// Canonical und hreflang); ein 308 auf /de wäre jetzt falsch.
const DE_ONLY_EXACT = Object.freeze([
  "bewerten",
  "bodensee-licht",
  "concierge",
  // Sprach-Integration 01.11.2026: dreilaender-rechner, einkaufen-aus-der-schweiz,
  // interior-design-vorarlberg, kuechen-vorarlberg, kuechenplaner, leistungen,
  // outdoor-gartenplanung und wohnzimmer-einrichten-vorarlberg sind raus – es
  // gibt sie jetzt in DE/EN/FR/IT (eigene Canonical, hreflang reziprok).
  "ki-assistenten",
  "moebel-bodensee",
  "regionen", // Rat 9,5 B15: Regionen-Hub (nur Deutsch)
  // Stadt-/Regionsseiten (Landing)
  "designermoebel-appenzell",
  "designermoebel-arlberg",
  "designermoebel-bregenz",
  "designermoebel-dornbirn",
  "designermoebel-feldkirch",
  "designermoebel-friedrichshafen",
  "designermoebel-kempten",
  "designermoebel-konstanz",
  "designermoebel-liechtenstein",
  "designermoebel-lindau",
  "designermoebel-ravensburg",
  "designermoebel-rheintal",
  "designermoebel-st-gallen",
]);

const FOREIGN = ":lang(en|fr|it)";
const FR_IT = ":lang(fr|it)";
// Unterpfade ohne Punkt: Dateien (opengraph-image.png …) bleiben
// unberührt, ebenso projekte/vorlage (Schalter, s. o.) und
// 3d-ansicht/uebergabe und ezarri/konfigurator/katalog (Route-Handler, kein
// Seitenziel).
const SUB = ":rest((?!(?:vorlage|uebergabe|konfigurator/katalog)(?:/|$))[^.]+)";

function deOnlyRedirects() {
  const exact = DE_ONLY_EXACT.concat(DE_ONLY_TREE).join("|");
  const tree = DE_ONLY_TREE.join("|");
  const frItExact = FR_IT_ONLY_EXACT.concat(FR_IT_ONLY_TREE).join("|");
  const frItTree = FR_IT_ONLY_TREE.join("|");
  // Leere Listen ergäben eine leere Gruppe ":page()" – solche Regeln entfallen.
  return [
    exact && { source: `/${FOREIGN}/:page(${exact})`, destination: "/de/:page?lang=:lang", permanent: true },
    tree && { source: `/${FOREIGN}/:page(${tree})/${SUB}`, destination: "/de/:page/:rest?lang=:lang", permanent: true },
    frItExact && { source: `/${FR_IT}/:page(${frItExact})`, destination: "/de/:page?lang=:lang", permanent: true },
    frItTree && { source: `/${FR_IT}/:page(${frItTree})/${SUB}`, destination: "/de/:page/:rest?lang=:lang", permanent: true },
    {
      source: `/${FR_IT}/ezarri/:tool(${FR_IT_TO_EN_EZARRI_TOOLS.join("|")})`,
      destination: "/en/ezarri/:tool?lang=:lang",
      permanent: true,
    },
  ].filter(Boolean);
}

module.exports = { DE_ONLY_TREE, DE_ONLY_EXACT, FR_IT_ONLY_TREE, FR_IT_ONLY_EXACT, FR_IT_TO_EN_EZARRI_TOOLS, deOnlyRedirects };
