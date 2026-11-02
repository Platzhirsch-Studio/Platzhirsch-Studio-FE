// Claim guard (UWG / Preisangabenrecht): no dealer claims outside ClassiCon,
// no superlatives such as "größte"/"größten", no self-description as leading or
// only provider, no "abgesicherte Anzahlung", no old "bis zu 60 %" discount news.
// Reads the server-rendered HTML (no browser), desktop project only. Checked are
// the visible text AND the texts search results show: <title>, meta description,
// Open Graph / Twitter tags and every JSON-LD string (headText in helpers.js).
//
// Known violations are listed in KNOWN with the team that owns the fix and a
// pattern for the known wording. While only those hits are there the test ends
// as fixme (hits as annotation); any other hit fails, and so does every hit on a
// page or rule not listed in KNOWN. Remove entries once fixed.
import { test, expect } from "@playwright/test";
import { CORE_PAGES, getText, headText, htmlToText, locs, mapLimit, toLocal } from "./helpers.js";
import { OFF_PAGES, PROD } from "./prod-mode.js";
import { DEALER_BRAND_ALIASES, VERIFIED_DEALER_BRANDS, dealerStatement, dealerStatementList } from "../../src/lib/legal/claims.js";
import { GERAETE_MARKEN } from "../../src/lib/kueche/geraete.js";
import { geraeteEntries, wellnessEntries } from "../../src/lib/marken/indexGroups.js";
import { ortsMarkenBlock } from "../../src/lib/content/ortsMarken.js";

// Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Ausnahme für die Markenseiten aller
// belegten Händler-Marken aus dem Claim-Register (ClassiCon, Ezarri, Minotti, Bad & Wellness), nicht
// mehr nur ClassiCon. Unbelegte Marken (Poliform, Rimadesio, Agape …) werden weiter geprüft.
const VERIFIED_BRAND_PAGE = new RegExp(
  // Aliase (Backoffice-Slug ↔ Katalog-Slug, z. B. baobab → baobab-collection) gelten wie die belegte Marke.
  `/(ueber-uns/marken|about-us/brands|a-propos/marques|chi-siamo/marche)/(${[...VERIFIED_DEALER_BRANDS, ...Object.keys(DEALER_BRAND_ALIASES).filter((a) => VERIFIED_DEALER_BRANDS.includes(DEALER_BRAND_ALIASES[a]))].join("|")})$`
);

// Wording that names the brand's own website or an event, not us as a dealer;
// "führender Marken" describes the brands, not Platzhirsch; "mit größter Sorgfalt"
// is a set phrase about care, not a market claim.
const ALLOWED = [
  /offizielle(n)? (Website|Webseite|Seite|Eröffnung)/gi,
  /official (website|site|opening)/gi,
  /site officiel/gi,
  /(sito|pagina) ufficiale/gi,
  /offizielle Regeln/gi,
  /führende[nrms]? (Design)?(marken|hersteller|designer)/gi,
  /leading (design )?(brands|manufacturers|designers)/gi,
  /mit größter (Sorgfalt|Präzision|Maßgenauigkeit)/gi,
  /(avec )?le plus grand soin/gi,
];

const REGION =
  "(Vorarlberg|Bodensee|Westösterreich|Österreich|Austria|Autriche|Lake Constance|lac de Constance|Lago di Costanza|Rheintal)";

const RULES = {
  haendler: {
    label: "Händler-Behauptung",
    // FR "agréé" / IT "autorizzato" only next to a dealer noun: "entreprises agréées"
    // (licensed garden contractors on the outdoor teaser) is not a brand claim.
    re: /\b\S*(händler|haendler|offiziell\w*|autorisiert\w*|vertragspartner|dealer|retailer|authori[sz]ed|revendeur\w*|(distributeur|partenaire)s? agréé\w*|officiel\w*|rivenditor\w*|(distributore|partner) autorizzat\w*|ufficial\w*)\b/gi,
    skip: (path) => VERIFIED_BRAND_PAGE.test(path),
  },
  superlativ: {
    label: "Superlativ",
    // All inflections: größte, größten, größter, größtes, größtem. Only true
    // superlatives in FR/IT: "texte plus grand" / "testo più grande" (comparatives
    // in the calm-view switch) are fine, "le plus grand" / "il più grande" are not.
    re: new RegExp(
      [
        "\\bgr(ö|oe)(ß|ss)te[nrms]?\\b",
        "\\b(largest|biggest)\\b",
        "\\b(le|la|les) plus grande?s?\\b",
        "\\b(il|la|i|le) più grand[ei]\\b",
        // Self-description as leader, number one or only provider in the region.
        "\\b(markt)?führend\\w*|\\bmarktführer\\w*",
        "\\b(market[- ])?leading\\b|\\bmarket leader\\b|\\bleader (du|di) (marché|mercato)\\b",
        "\\b(Nr\\.|Nummer|number|numéro|numero|n°) ?(1|eins|one)\\b",
        `\\b(einzige[nrms]?|only|seule?|unic[oa])\\s+(\\S+\\s+){0,4}(in|im|am|au|en|nel|nella|del|della|di)\\s+(der |dem |the |du |de la )?${REGION}`,
      ].join("|"),
      "gi"
    ),
  },
  anzahlung: {
    label: "abgesicherte Anzahlung",
    re: /(abgesichert\w* Anzahlung|Anzahlung\w* (ist |wird )?abgesichert|secured deposit)/gi,
  },
  rabatt: {
    label: "Rabatt-Werbung bis zu X %",
    re: /\b(bis zu|up to|jusqu'à|fino al) -?\d+\s?%/gi,
  },
};

// `${rule} ${path}` → { owner, match } (match without the g flag). Only hits
// matching `match` count as known; any other hit on the same page fails.
// Stand 26.10.2026: the dealer phrase on the brand pages (Team 3) and the
// superlatives / "bis zu 60 %" on the news overview are gone. Still live are two
// old news ARTICLES (found by the news collection below, all 4 languages).
// Leer seit Runde 3 (R3-release, Lauf 2 gegen next start): Die News-Superlative
// („größte Minotti-Ausstellung“, „größte im Umkreis von 500 km“) sind entschärft.
// Neue Einträge: { owner, match } unter dem Schlüssel "<regel> <seitengruppe>".
const KNOWN = {};

// R3 (P4-technik, technik P1-4): /de/ratgeber und /de/adventsabend sind im
// Produktions-Build absichtlich 404 (kein freigegebener Artikel bzw. keine Uhrzeit,
// Kriterium in tests/e2e/prod-mode.js wie auf der Seite). Dort gibt es keinen Text zu
// prüfen; stattdessen belegt der Test „absichtlich aus“ unten den 404. Im Dev-Server
// und sobald der Schalter umgelegt ist, werden die Seiten wieder voll geprüft.
const PAGES = [
  ...CORE_PAGES.filter((p) => !OFF_PAGES.includes(p)),
  "/en/news",
  "/fr/news",
  "/it/news",
  // Marken-Übersicht in allen Sprachen (statische Gruppen Bad & Wellness, Küchengeräte).
  "/en/about-us/brands",
  "/fr/a-propos/marques",
  "/it/chi-siamo/marche",
  "/en/about-us/brands/minotti",
  "/fr/a-propos/marques/minotti",
  "/it/chi-siamo/marche/minotti",
  "/de/moebel-bodensee",
  "/de/interior-design-vorarlberg",
  "/de/wohnzimmer-einrichten-vorarlberg",
  "/de/designermoebel-bregenz",
  "/de/designermoebel-dornbirn",
  "/de/designermoebel-friedrichshafen",
  // Inhaber-Entscheidung Nr. 24 (bewusst geändert, 31.10.2026): Küchengeräte mit Händlersatz aus dem
  // Claim-Guard – nur genau diese Sätze fallen heraus (withoutGuardSentences), alles andere wird geprüft.
  "/de/kuechengeraete",
  "/en/kuechengeraete",
  "/fr/kuechengeraete",
  "/it/kuechengeraete",
];

/** Returns the matching snippets for one rule in one text. */
function hitsFor(rule, text) {
  let clean = text;
  for (const a of ALLOWED) clean = clean.replace(a, " ");
  const hits = [];
  for (const m of clean.matchAll(rule.re)) {
    const from = Math.max(0, m.index - 50);
    hits.push(clean.slice(from, m.index + m[0].length + 40).trim());
  }
  return [...new Set(hits)];
}

/** Fails on unknown hits; turns hits that all match the KNOWN pattern into fixme. */
function verdict(testInfo, key, hits, where) {
  if (!hits.length) return;
  const known = KNOWN[key];
  const unknown = known ? hits.filter((h) => !known.match.test(h)) : hits;
  expect(unknown, `${where}: unzulässige Formulierung`).toEqual([]);
  testInfo.annotations.push({ type: "bekannter Verstoß", description: `${known.owner}\n${hits.slice(0, 10).join("\n")}` });
  test.fixme(true, `Bekannter Verstoß (${known.owner}), ${hits.length} Fundstelle(n)`);
}

/** Visible text plus title, meta, OG/Twitter and JSON-LD of one server response. */
function claimText(html) {
  return `${htmlToText(html)} ‖ ${headText(html)}`;
}

const textCache = new Map();
async function pageText(request, path) {
  if (!textCache.has(path)) {
    const res = await getText(request, path);
    expect(res.status, `HTTP-Status ${path}`).toBe(200);
    textCache.set(path, withoutGuardSentences(path, claimText(res.text)));
  }
  return textCache.get(path);
}

// Marken-Übersicht (Inhaber-Entscheidungen Nr. 19–24, 31.10.2026): Die Gruppen
// „Bad & Wellness“ und „Küchengeräte“ tragen je einen Händler-Satz, der allein
// aus dem Claim-Guard kommt (dealerStatementList über die belegten Marken der
// Gruppe, src/components/MarkenClient/Marken.js). Nur GENAU diese Sätze fallen
// vor der Prüfung heraus; jede andere Händler-Formulierung auf der Übersicht
// schlägt weiter fehl.
const BRAND_INDEX = /^\/(de\/ueber-uns\/marken|en\/about-us\/brands|fr\/a-propos\/marques|it\/chi-siamo\/marche)$/;
const GERAETE_PAGE = /^\/(de|en|fr|it)\/kuechengeraete$/;
// QM-Endabnahme 02.11.2026 (bewusst geändert): Stadtseiten tragen seit QM R3 den Block „Bei uns als …“
// (src/components/Landing/OrtsMarken.js). Überschrift und Händler-Satz kommen allein aus dem Claim-Register
// (dealerTitleWord/dealerStatementList über ortsMarkenBlock). Nur GENAU diese beiden fallen vor der Prüfung
// heraus (weiche Trennstellen vorher entfernt); jede andere Händler-Formulierung schlägt weiter fehl.
const ORTS_PAGE = /^\/de(\/designermoebel-[a-z-]+)$/;
function withoutGuardSentences(path, text) {
  const ort = path.match(ORTS_PAGE);
  const block = ort ? ortsMarkenBlock(ort[1]) : null;
  if (block) {
    const plain = text.replace(/­/g, "");
    return [block.statement, block.heading].filter(Boolean).reduce((t, s) => t.split(s).join(" "), plain);
  }
  if (GERAETE_PAGE.test(path)) {
    const locale = path.split("/")[1];
    const ids = GERAETE_MARKEN.map((m) => m.id);
    const sentences = [dealerStatementList(ids, locale), ...ids.map((id) => dealerStatement(id, locale))].filter(Boolean);
    return sentences.reduce((t, s) => t.split(s).join(" "), text);
  }
  if (!BRAND_INDEX.test(path)) return text;
  const locale = path.split("/")[1];
  const sentences = [
    dealerStatementList(wellnessEntries(locale).filter((b) => b.dealer).map((b) => b.id), locale),
    dealerStatementList(geraeteEntries(locale).map((b) => b.id), locale),
  ].filter(Boolean);
  return sentences.reduce((t, s) => t.split(s).join(" "), text);
}

test("Produktion: absichtlich ausgeschaltete Seiten liefern 404", async ({ request }) => {
  test.skip(!OFF_PAGES.length, PROD ? "alle Schalter an" : "Dev-Server: Ratgeber und Adventsabend sind sichtbar");
  for (const p of OFF_PAGES) expect((await getText(request, p)).status, p).toBe(404);
});

for (const path of PAGES) {
  test.describe(`Claims ${path}`, () => {
    for (const [id, rule] of Object.entries(RULES)) {
      test(`${rule.label}`, async ({ request }, testInfo) => {
        test.skip(rule.skip?.(path) ?? false, "belegte Händler-Marke (Claim-Register)");
        const text = await pageText(request, path);
        verdict(testInfo, `${id} ${path}`, hitsFor(rule, text), path);
      });
    }
  });
}

// Whole collections from the sitemaps: all DE brand pages, all news articles in 4 languages.
const COLLECTIONS = [
  {
    label: "allen Markenseiten (DE, aus sitemap-marken.xml)",
    key: "marken/*",
    sitemap: "/sitemap-marken.xml",
    path: /^\/de\/ueber-uns\/marken\/[^/]+$/,
    min: 5,
  },
  {
    label: "allen News-Artikeln (4 Sprachen, aus sitemap-news.xml)",
    key: "news/*",
    sitemap: "/sitemap-news.xml",
    path: /^\/(de|en|fr|it)\/news\/[^/]+$/,
    min: 4,
  },
];

for (const c of COLLECTIONS) {
  test.describe(`Claims auf ${c.label}`, () => {
    test.describe.configure({ timeout: 600_000 });
    let texts;

    test.beforeAll(async ({ request, baseURL }) => {
      const sm = await getText(request, c.sitemap);
      expect(sm.status).toBe(200);
      const paths = locs(sm.text)
        .map((u) => new URL(u).pathname)
        .filter((p) => c.path.test(p));
      expect(paths.length, `Seiten in ${c.sitemap}`).toBeGreaterThan(c.min);
      texts = await mapLimit(paths, 3, async (p) => {
        const url = toLocal(new URL(p, "https://x").toString(), baseURL);
        let res = await getText(request, url);
        // Team Grün 30.10.2026 (Stabilisierung): Die News-Seite antwortet bei einem kurzen
        // Ausfall des Backoffice absichtlich mit 500 (news/[title]/page.js, „retriable 5xx“).
        // Ein einziger zweiter Abruf nach 3 s, wie ein Crawler es täte; bleibt es 5xx,
        // schlägt „alle Seiten erreichbar“ weiter fehl.
        if (res.status >= 500) {
          await new Promise((r) => setTimeout(r, 3000));
          res = await getText(request, url);
        }
        return { path: p, status: res.status, text: claimText(res.text) };
      });
    });

    for (const [id, rule] of Object.entries(RULES)) {
      test(`${rule.label}`, async ({}, testInfo) => {
        const broken = texts.filter((b) => b.status !== 200).map((b) => `${b.path} → ${b.status}`);
        expect(broken, "alle Seiten erreichbar").toEqual([]);
        const hits = texts
          .filter((b) => !(rule.skip?.(b.path) ?? false))
          .flatMap((b) => hitsFor(rule, b.text).map((h) => `${b.path}: ${h}`));
        verdict(testInfo, `${id} ${c.key}`, hits, c.label);
      });
    }
  });
}
