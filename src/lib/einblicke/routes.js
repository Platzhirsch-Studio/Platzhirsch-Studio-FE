// src/lib/einblicke/routes.js – Route → Vorlage (Konzept §2.1).
//
// Eine Vorlage fasst gleichartige Seiten zusammen, z. B. alle 2 000
// Produktseiten zu "/de/produkte/[category]/[product]". TABLE folgt den
// dynamischen Segmenten unter src/app/[locale]/** (ohne die nie erfassten
// Bereiche aus config.js EXCLUDED – Portal, Upload, Zahlung, Vorschau und die
// Routen mit Zugangsschlüssel im Pfad: /ideenboard/[shareId],
// /wunschliste/[id]). Übersetzte Abschnitte (/en/products, /it/chi-siamo …)
// bekommen dieselbe deutsche Vorlage.
//
// Statische Seiten sind ihre eigene Vorlage, aber NUR, wenn es sie gibt
// (STATIC + übersetzte Pfade aus src/utils/routing.js). Jede andere URL –
// vertippte Adressen, 404, auch solche mit Namen darin – wird zu
// "/<sprache>/(404)" zusammengefasst und nie wörtlich gespeichert
// (QA Recht Einblicke P2-3).
// tests/unit/einblicke.test.mjs prüft, dass jeder Seitenordner unter
// src/app/[locale] in STATIC, TABLE oder EXCLUDED steht.
// Rein, ohne "@/": node --test. Nur Server (Tagesabschluss), nicht im Sammler.
import { ROUTES } from "../../utils/routing.js";

const LOCALE = /^\/(de|en|fr|it)(?=\/|$)/;
export const NOT_FOUND = "/(404)";

// Übersetzte Abschnittsnamen (src/proxy.js TRANSLATED_SECTIONS).
const PRODUKTE = "(?:produkte|products|produits|prodotti)";
const ABOUT = "(?:ueber-uns|about-us|a-propos|chi-siamo)";
const MARKEN = "(?:marken|brands|marques|marche)";
const KARRIERE = "(?:karriere|career|carriere|carriera)";
const SEG = "[^/]+";
const re = (s) => new RegExp(`^${s}$`);

// [Muster nach der Sprache, Vorlage]. Reihenfolge: spezifisch vor allgemein.
export const TABLE = [
  [re(`/${PRODUKTE}/suche`), "/produkte/suche"],
  [re(`/${PRODUKTE}/${SEG}/${SEG}`), "/produkte/[category]/[product]"],
  [re(`/${PRODUKTE}/${SEG}`), "/produkte/[category]"],
  [re(`/${ABOUT}/${MARKEN}/${SEG}/${SEG}`), "/ueber-uns/marken/[title]/[collection]"],
  [re(`/${ABOUT}/${MARKEN}/${SEG}`), "/ueber-uns/marken/[title]"],
  [re(`/${ABOUT}/${KARRIERE}/${SEG}`), "/ueber-uns/karriere/[slug]"],
  [re(`/news/${SEG}`), "/news/[title]"],
  [re(`/newsletter/archiv/${SEG}`), "/newsletter/archiv/[ausgabe]"],
  [re(`/ratgeber/${SEG}`), "/ratgeber/[slug]"],
  [re(`/projekte/vorlage`), "/projekte/vorlage"],
  [re(`/projekte/${SEG}`), "/projekte/[slug]"],
  [re(`/atelierverkauf/${SEG}`), "/atelierverkauf/[slug]"],
  [re(`/3d-ansicht/${SEG}`), "/3d-ansicht/[produkt]"],
  [re(`/ezarri/kollektionen/${SEG}`), "/ezarri/kollektionen/[kollektion]"],
  [re(`/ezarri/mosaike/vergleich`), "/ezarri/mosaike/vergleich"],
  [re(`/ezarri/mosaike/${SEG}`), "/ezarri/mosaike/[referenz]"],
  [re(`/sofaplaner/katalog/${SEG}`), "/sofaplaner/katalog/[slug]"],
  [re(`/stil-finder/ergebnis/${SEG}`), "/stil-finder/ergebnis/[profil]"],
  // Herstellerkatalog (31.10.2026, src/lib/katalog): Produkt-, Marken- und
  // Kategorieseiten inkl. Paginierung (Nr. 25), Welten bad-wellness,
  // kuechengeraete und accessoires (Nr. 27).
  [re(`/bad-wellness/produkte/${SEG}`), "/bad-wellness/produkte/[slug]"],
  [re(`/bad-wellness/marke/${SEG}/seite/${SEG}`), "/bad-wellness/marke/[marke]/seite/[seite]"],
  [re(`/bad-wellness/marke/${SEG}`), "/bad-wellness/marke/[marke]"],
  [re(`/bad-wellness/kategorie/${SEG}/seite/${SEG}`), "/bad-wellness/kategorie/[kategorie]/seite/[seite]"],
  [re(`/bad-wellness/kategorie/${SEG}`), "/bad-wellness/kategorie/[kategorie]"],
  [re(`/kuechengeraete/produkte/${SEG}`), "/kuechengeraete/produkte/[slug]"],
  [re(`/kuechengeraete/marke/${SEG}/seite/${SEG}`), "/kuechengeraete/marke/[marke]/seite/[seite]"],
  [re(`/kuechengeraete/marke/${SEG}`), "/kuechengeraete/marke/[marke]"],
  [re(`/kuechengeraete/kategorie/${SEG}/seite/${SEG}`), "/kuechengeraete/kategorie/[kategorie]/seite/[seite]"],
  [re(`/kuechengeraete/kategorie/${SEG}`), "/kuechengeraete/kategorie/[kategorie]"],
  [re(`/accessoires/produkte/${SEG}`), "/accessoires/produkte/[slug]"],
  [re(`/accessoires/marke/${SEG}/seite/${SEG}`), "/accessoires/marke/[marke]/seite/[seite]"],
  [re(`/accessoires/marke/${SEG}`), "/accessoires/marke/[marke]"],
  [re(`/accessoires/kategorie/${SEG}/seite/${SEG}`), "/accessoires/kategorie/[kategorie]/seite/[seite]"],
  [re(`/accessoires/kategorie/${SEG}`), "/accessoires/kategorie/[kategorie]"],
];

// Statische Seiten (Pfad nach der Sprache), Stand 29.10.2026; 04.11.2026: Link-Seiten
// /newsletter/bestaetigen, /newsletter/abmelden, /adventsabend/absagen (noindex) und
// /service/reklamation (index) – aus den
// Ordnern unter src/app/[locale] ohne dynamische Segmente und ohne EXCLUDED.
export const STATIC = [
  "/3d-ansicht", "/accessoires", "/accessoires/produkte", "/accessoires/suche", "/adventsabend", "/adventsabend/absagen", "/agb", "/arbeitsweise", "/architekten", "/atelierverkauf", "/bad-wellness", "/bad-wellness/produkte", "/barrierefreiheit", "/beratung", "/bewerten",
  "/bodensee-licht", "/concierge", "/datenschutz", "/designermoebel-appenzell", "/designermoebel-arlberg",
  "/designermoebel-bregenz", "/designermoebel-dornbirn", "/designermoebel-feldkirch", "/designermoebel-friedrichshafen",
  "/designermoebel-kempten", "/designermoebel-konstanz", "/designermoebel-liechtenstein", "/designermoebel-lindau",
  "/designermoebel-ravensburg", "/designermoebel-rheintal", "/designermoebel-st-gallen", "/dreilaender-rechner",
  "/einkaufen-aus-der-schweiz", "/empfehlen", "/ezarri", "/ezarri/anfrage", "/ezarri/bad", "/ezarri/custom-mix",
  "/ezarri/fassade", "/ezarri/galerie", "/ezarri/kollektionen", "/ezarri/konfigurator", "/ezarri/konfigurator/blatt",
  "/ezarri/kueche", "/ezarri/mosaik", "/ezarri/mosaike", "/ezarri/pool", "/ezarri/rechner", "/ezarri/technik",
  "/ezarri/technik/downloads", "/ezarri/technik/fragen", "/ezarri/technik/jointpoint", "/ezarri/technik/pflege",
  "/ezarri/technik/verlegung", "/ezarri/wasser", "/ezarri/wellness", "/gutscheinbedingungen", "/gutscheine",
  "/hotel-objekt", "/ideenboard", "/impressum", "/interior-design-vorarlberg", "/ki-assistenten",
  "/ki-assistenten/bestaetigen", "/kontakt", "/kuechen-vorarlberg", "/kuechengeraete", "/kuechengeraete/produkte", "/kuechenplaner", "/kuechenplaner/druck", "/kundenkarte", "/kundenkarte/bedingungen", "/kundenkarte/bestaetigen",
  "/leistungen", "/merkliste", "/moebel-bodensee", "/news", "/newsletter", "/newsletter/abmelden", "/newsletter/archiv", "/newsletter/bestaetigen",
  "/outdoor-gartenplanung", "/outdoor-kueche", "/outdoor-winterservice", "/pflege-service", "/produkte", "/projekte", "/ratgeber", "/regionen", "/service/reklamation",
  "/sauna-kaufen", "/showroom", "/sofaplaner", "/stil-finder", "/swim-spa", "/termin", "/termin/bestaetigen", "/termin/verwalten",
  "/ueber-uns/karriere", "/ueber-uns/marken", "/ueber-uns/partner", "/ueber-uns/platzhirsch", "/ueber-uns/presse",
  "/ueber-uns/team", "/ueber-uns/team/harald-menghin", "/whirlpool-kaufen", "/widerruf", "/wohnzimmer-einrichten-vorarlberg", "/wunschliste", "/wunschliste/verwalten", "/yacht-interior",
];
const KNOWN = new Set([...STATIC, ...Object.values(ROUTES).flatMap((t) => Object.values(t))]);

/** Pfad ohne Query/Fragment und ohne Schluss-Schrägstrich. */
export function normalizePath(p) {
  const s = String(p || "").split(/[?#]/)[0] || "/";
  return s.length > 1 ? s.replace(/\/+$/, "") || "/" : s;
}

/** Sprache der Route (de/en/fr/it), sonst "de". */
export function localeOf(route) {
  const m = LOCALE.exec(route);
  return m ? m[1] : "de";
}

/**
 * Vorlage der Route, z. B. "/de/produkte/lamps/lamps-2097-18" →
 * "/de/produkte/[category]/[product]"; unbekannte URL → "/de/(404)".
 */
export function templateOf(route) {
  const r = normalizePath(route);
  const m = LOCALE.exec(r);
  const prefix = m ? m[0] : "";
  const rest = r.slice(prefix.length) || "";
  if (!prefix) return `/de${NOT_FOUND}`;
  if (!rest || rest === "/") return r;
  for (const [pattern, tpl] of TABLE) if (pattern.test(rest)) return prefix + tpl;
  return KNOWN.has(rest) ? r : prefix + NOT_FOUND;
}

/** Route, wie sie gespeichert werden darf: bekannte Seite wörtlich, sonst "/<sprache>/(404)". */
export function routeOf(route) {
  const r = normalizePath(route);
  const t = templateOf(r);
  return t.endsWith(NOT_FOUND) ? t : r;
}
