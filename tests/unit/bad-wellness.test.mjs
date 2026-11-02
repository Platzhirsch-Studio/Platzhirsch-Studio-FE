// tests/unit/bad-wellness.test.mjs – „Bad & Wellness – geplant wie ein Raum“
// (Inhaber-Entscheidungen Nr. 19, 20, 21 vom 31.10.2026).
// Run: node --test --test-reporter=tap tests/unit/bad-wellness.test.mjs
//
// Prüft: genau 5 Wellness- + 3 Bad-Marken; Händler-Aussage nur über den
// Claim-Guard für die sieben Marken mit Liefervereinbarung (nie Agape); vier Sprachen
// vollständig (Tabelle = Vorschlagsdatei); keine Superlative, Preise,
// Showroom-Aussage, Heilversprechen; Naggura nur „Wellness- und
// Spa-Behandlungsräume in Hotels“, kein Therapie-/Praxis-Wort; jedes Bild mit Quelle in QUELLEN.md, nicht pinbar;
// Metadaten-Längen; CTA-Ziele; Schema ohne Product/Offer.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

const M = await import("../../src/lib/wellness/marken.js");
const { BW_TEXT, bwText } = await import("../../src/components/BadWellness/badWellnessCopy.js");
const { withContext } = await import("../../src/lib/forms/pathContext.js");
const { findClaims, dealerStatement, dealerStatementList, isVerifiedDealerBrand } = await import("../../src/lib/legal/claims.js");

const LOCALES = M.BAD_WELLNESS_LOCALES;
const PROPOSAL = JSON.parse(read("Marktresearch/digital/features/bad-wellness-messages.json"));
const QUELLEN = read("docs/bildquellen/QUELLEN.md");
const COMPONENT_FILES = [
  "src/components/BadWellness/BadWellnessPage.js",
  "src/components/BadWellness/badWellnessCopy.js",
  "src/lib/wellness/marken.js",
  "src/app/[locale]/bad-wellness/page.js",
];

function leaves(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj || {})) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") out.push(...leaves(v, p));
    else out.push([p, v]);
  }
  return out;
}
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

const WELLNESS = ["Starpool", "Soleum", "Fabio Alemanno", "Aquavia Spa", "Naggura"];
const BAD = ["Agape", "Dornbracht", "antoniolupi"];
const DEALERS = [...WELLNESS, "Dornbracht", "antoniolupi"];

const DEALER_WORD = /händler|haendler|dealer|revendeur|rivenditore|retailer|distribut|concessionari|vertragspartner|vertriebspartner/i;
const OFFICIAL = /offiziell|official|officiel|ufficial|autorisiert|authori[sz]ed|autoris[ée]|autorizzat|exklusiv|exclusive|exclusif|esclusiv|gebietsschutz/i;
const SUPERLATIVE =
  /\bbeste[nrs]?\b|\bbest\b|führend|fuehrend|leading|leader|\bnr\.?\s*1\b|number one|meilleur|migliore|einzigartig|\bunique\b|\bunico\b|größte|groesste|largest|renommiert|weltweit führend|perfekt|perfect|parfait|perfett/i;
const PRICE = /(?:€|\bEUR\b|\bCHF\b)\s*\d|\d[\d.,']*\s*(?:€|\bEUR\b|\bCHF\b|euro\b|franken\b)/i;
const SHOWROOM = /showroom|ausstellung|ausgestellt|exposition|esposizion|exhibit|on display|vorführ|ausprobier|probeliegen|try out|essayer|provare|schauraum/i;
// Heil-/Wirkversprechen (HWG/UWG).
const HEALTH =
  /heil(?:t|en|ung|end)|therapie gegen|immunsystem|immune|immunit|regenerat|rigenera|stärkt|strengthen|renforce|rafforz|gesund werden|lindert|relieve|soulage|allevia|schmerz|\bpain\b|douleur|dolore|stress|\bschlaf(?:en)?\b|\bsleep|sommeil|sonno|longevity|anti-?aging|detox|entgift|heilmittel|wirkung gegen|hilft bei|helps with|guérit|guarisce|cura (?:il|la|le|i)\b/i;
// Inhaber 31.10.2026: Naggura nur Hotel-Wellness – früher war „Therapie“ in
// „Therapie- und Behandlungsräume“ erlaubt; jetzt gar kein Therapie-, Praxis-
// oder Physio-Wort mehr, Naggura-Texte nennen Wellness/Spa im Hotel.
const THERAPIE = /therap|terap|thérap|praxis|practice|\bcabinets?\b|\bstudi\b|physio|fisio|kinési|osteopat|podolog/i;
const NAGGURA_HOTEL = { de: /Wellness- und Spa-Behandlungsräume in Hotels/, en: /wellness and spa treatment rooms in hotels/, fr: /salles de soins wellness et spa des hôtels/, it: /sale trattamenti wellness e spa negli hotel/ };

test("genau 5 Wellness- und 3 Bad-Marken in fester Schreibweise, eindeutige IDs", () => {
  assert.deepEqual(M.WELLNESS_MARKEN.map((m) => m.name), WELLNESS);
  assert.deepEqual(M.BAD_MARKEN.map((m) => m.name), BAD);
  assert.equal(M.ALLE_MARKEN.length, 8);
  const ids = M.ALLE_MARKEN.map((m) => m.id);
  assert.equal(new Set(ids).size, 8);
  for (const m of M.ALLE_MARKEN) {
    assert.match(m.id, /^[a-z0-9-]+$/);
    assert.ok(m.groups.length >= 1, `${m.name}: Produktgruppen`);
  }
});

test("Händlerstatus: sieben Marken ja, Agape nein; Naggura nur Objektgeschäft", () => {
  assert.deepEqual([...M.DEALER_MARKEN].sort(), [...DEALERS].sort());
  assert.equal(M.markeById("agape").dealer, false);
  assert.equal(M.markeById("naggura").objektOnly, true);
  assert.deepEqual(
    M.SZENARIEN.filter((s) => s.marken.includes("naggura")).map((s) => s.id),
    ["therapie"],
    "Naggura nur im Szenario Wellness- und Spa-Behandlungsräume (Schlüssel „therapie“ bleibt intern)"
  );
  // Inhaber 31.10.2026: Naggura nur Hotel-Wellness – Karte nennt die Positionierung in allen vier Sprachen.
  for (const l of LOCALES) assert.match(BW_TEXT[l].marke.naggura.text, NAGGURA_HOTEL[l], `${l}: Naggura-Karte`);
});

test("Herkunft wie auf den Herstellerseiten belegt", () => {
  const origin = Object.fromEntries(M.ALLE_MARKEN.map((m) => [m.name, m.origin]));
  assert.deepEqual(origin, {
    Agape: "IT", Dornbracht: "DE", antoniolupi: "IT",
    Starpool: "IT", Soleum: "AT", "Fabio Alemanno": "IT", "Aquavia Spa": "ES", Naggura: "ES",
  });
  assert.equal(M.markeById("fabio-alemanno").originIsDesign, true, "Fabio Alemanno: „Design“ statt Firmensitz");
});

test("vier Sprachen vollständig: gleiche Schlüssel wie Deutsch, kein leerer Text, jede Marke/Gruppe/Land/Alt-Text", () => {
  assert.deepEqual(LOCALES, ["de", "en", "fr", "it"]);
  const deKeys = leaves(BW_TEXT.de).map(([k]) => k).sort();
  for (const l of LOCALES) {
    const entries = leaves(BW_TEXT[l]);
    assert.deepEqual(entries.map(([k]) => k).sort(), deKeys, `${l}: Schlüssel`);
    for (const [k, v] of entries) assert.ok(typeof v === "string" && v.trim().length > 0, `${l}.${k} leer`);
    for (const m of M.ALLE_MARKEN) {
      const key = M.markeKey(m.id);
      assert.ok(BW_TEXT[l].marke[key]?.text, `${l}: Text ${m.name}`);
      for (const g of m.groups) assert.ok(BW_TEXT[l].gruppen[g], `${l}: Gruppe ${g}`);
      assert.ok(BW_TEXT[l].laender[m.origin], `${l}: Land ${m.origin}`);
      if (m.image) assert.ok(BW_TEXT[l].alt[key], `${l}: Alt-Text ${m.name}`);
      (m.moreImages || []).forEach((_, i) => assert.ok(BW_TEXT[l].alt[`${key}${i + 2}`], `${l}: Alt-Text ${m.name} ${i + 2}`));
    }
    for (const s of M.SZENARIEN) assert.ok(BW_TEXT[l].einstieg.szenario[s.id]?.title, `${l}: Szenario ${s.id}`);
    assert.ok(BW_TEXT[l].alt.hero, `${l}: Alt-Text Auftakt`);
  }
});

test("Vorschlagsdatei = Rückfall-Tabelle (Namespace badWellness)", () => {
  assert.equal(typeof PROPOSAL._hinweis, "string");
  for (const l of LOCALES) assert.deepEqual(PROPOSAL[l]?.badWellness, BW_TEXT[l], l);
});

test("Händler-Aussage: nur über den Claim-Guard, nur für die sieben Marken, nie für Agape", () => {
  // 1) Die Texttabelle enthält kein Händler-/Offiziell-Wort – der Satz kommt aus claims.js.
  for (const l of LOCALES) {
    for (const [k, v] of leaves(BW_TEXT[l])) {
      assert.doesNotMatch(v, DEALER_WORD, `${l}.${k}: ${v}`);
      assert.doesNotMatch(v, OFFICIAL, `${l}.${k}: ${v}`);
    }
  }
  // 2) dealer: true genau für die sieben Marken (Inhaber Nr. 19 + 21), Agape false.
  for (const m of M.ALLE_MARKEN) assert.equal(m.dealer, DEALERS.includes(m.name), m.name);
  // 3) Die Seite holt den Satz aus dealerStatement/dealerStatementList und nur für DEALER_MARKEN.
  const page = stripComments(read("src/components/BadWellness/BadWellnessPage.js"));
  assert.ok(page.includes("dealerStatementList(DEALER_MARKEN, locale)"));
  assert.ok(page.includes("marke.dealer ? dealerStatement(marke.name, locale)"));
  // 4) Selbst wenn Agape übergeben würde: ohne Register-Eintrag kein Satz.
  for (const l of LOCALES) {
    assert.equal(dealerStatement("Agape", l), "", l);
    const list = dealerStatementList([...DEALERS, "Agape"], l);
    assert.doesNotMatch(list, /Agape/, l);
    // Nur Marken aus dem Register erscheinen; heute (vor der Übergabe) ggf. leer.
    for (const b of DEALERS) if (list.includes(b)) assert.ok(isVerifiedDealerBrand(b), `${l}: ${b} nicht im Register`);
  }
});

test("keine Superlative, keine Preise, keine Showroom-Aussage, keine Heilversprechen", () => {
  for (const l of LOCALES) {
    for (const [k, v] of leaves(BW_TEXT[l])) {
      assert.doesNotMatch(v, SUPERLATIVE, `${l}.${k}: ${v}`);
      assert.doesNotMatch(v, PRICE, `${l}.${k}: ${v}`);
      assert.doesNotMatch(v, SHOWROOM, `${l}.${k}: ${v}`);
      assert.doesNotMatch(v, HEALTH, `${l}.${k}: ${v}`);
      assert.doesNotMatch(v, THERAPIE, `${l}.${k}: kein Therapie-/Praxis-Wort (Inhaber 31.10.2026: Naggura nur Hotel-Wellness)`);
    }
    const sup = findClaims(leaves(BW_TEXT[l]).map(([, v]) => v).join("\n"), { locale: l }).filter((f) => f.type === "superlative");
    assert.deepEqual(sup, [], `${l}: Superlativ (Claim-Guard)`);
  }
  for (const f of COMPONENT_FILES) {
    const code = stripComments(read(f));
    assert.doesNotMatch(code, PRICE, f);
    assert.doesNotMatch(code, /"Product"|"Offer"|priceCurrency|"price"|seller/, f);
  }
});

test("kein fest verdrahteter Kundentext mit Händler-/Showroom-Wort im Code", () => {
  for (const f of ["src/components/BadWellness/BadWellnessPage.js", "src/lib/wellness/marken.js", "src/app/[locale]/bad-wellness/page.js"]) {
    const code = stripComments(read(f));
    assert.doesNotMatch(code, /"[^"\n]*\b(?:Händler|dealer|revendeur|rivenditore|Showroom|Ausstellung)\b[^"\n]*"|>[^<>{}]*\b(?:Händler|dealer|revendeur|rivenditore|Showroom|Ausstellung)\b[^<>{}]*</i, f);
  }
});

test("Bilder: Datei vorhanden, Quelle in QUELLEN.md, antoniolupi-Slot dokumentiert", () => {
  const images = [M.HERO_IMAGE, ...M.ALLE_MARKEN.flatMap((m) => [m.image, ...(m.moreImages || [])]).filter(Boolean)];
  assert.ok(images.length >= 6);
  for (const img of images) {
    const file = path.join(ROOT, "public", img.src);
    assert.ok(fs.existsSync(file), `fehlt: ${img.src}`);
    const name = path.basename(img.src);
    // QM R1: Bilder aus dem Katalog stehen in QUELLEN.md mit Pfad relativ zu public/Images/Wellness/.
    const rel = img.src.replace(/^\/Images\/Wellness\//, "");
    assert.ok(QUELLEN.includes(`\`${name}\``) || QUELLEN.includes(`\`${rel}\``), `QUELLEN.md: ${name}`);
    assert.match(img.source, /^https:\/\//);
    assert.ok(img.width > 0 && img.height > 0);
  }
  // Agape: Bild freigegeben (Inhaber Nr. 23), Händleraussage bleibt aus (dealer: false, s. oben).
  assert.ok(M.markeById("agape").image, "Agape-Bild");
  assert.match(QUELLEN, /antoniolupi/);
  // Herstellerbilder: unverändert (contain, kein fill/cover) und nicht für Pinterest.
  const page = stripComments(read("src/components/BadWellness/BadWellnessPage.js"));
  assert.match(page, /data-pin-nopin="true"/);
  assert.match(page, /object-contain/);
  assert.doesNotMatch(page, /object-cover|PinterestSave|\bfill\b/);
  assert.match(page, /preload/);
});

test("Metadaten: Titel ≤ 60, Beschreibung ≤ 150 in allen Sprachen", () => {
  for (const l of LOCALES) {
    const { title, description } = BW_TEXT[l].meta;
    assert.ok(title.length <= 60, `${l}: Titel ${title.length}`);
    assert.ok(description.length <= 150, `${l}: Description ${description.length}`);
  }
});

test("bwText: Messages zuerst (mit Namespace), sonst Tabelle, sonst Deutsch", () => {
  const fake = { has: (k) => k === "badWellness.title", raw: () => "Aus den Messages" };
  assert.equal(bwText("en", "title", fake), "Aus den Messages");
  assert.equal(bwText("en", "crumb", fake), BW_TEXT.en.crumb);
  assert.equal(bwText("xx", "title"), BW_TEXT.de.title);
  assert.equal(bwText("fr", "marke.aquaviaspa.text"), BW_TEXT.fr.marke.aquaviaspa.text);
});

test("CTA-Ziele: Anfrageformular mit thema=wellness|bad und produkt=<Marke>, keine Kaufknöpfe", () => {
  assert.equal(M.BAD_WELLNESS_PATH, "/bad-wellness");
  const starpool = M.markeById("starpool");
  assert.equal(withContext("/beratung", M.beratungContext(starpool)), "/beratung?thema=wellness&produkt=Starpool");
  assert.equal(withContext("/beratung", M.beratungContext(M.markeById("dornbracht"))), "/beratung?thema=bad&produkt=Dornbracht");
  assert.equal(withContext("/conseil", M.beratungContext(M.markeById("naggura"))), "/conseil?thema=wellness%2Cobjekt&produkt=Naggura");
  const page = stripComments(read("src/components/BadWellness/BadWellnessPage.js"));
  assert.match(page, /schreibenHref\(/);
  assert.doesNotMatch(page, /warenkorb|cart|kaufen|checkout|addToCart/i);
});

test("Schema: WebPage + ItemList mit Brand, BreadcrumbList über <Breadcrumbs schema>", () => {
  const code = stripComments(read("src/components/BadWellness/BadWellnessPage.js"));
  assert.match(code, /"@type": "WebPage"/);
  assert.match(code, /"@type": "ItemList"/);
  assert.match(code, /"@type": "Brand"/);
  assert.match(code, /<Breadcrumbs[^>]*\bschema\b/);
});

test("Seite: alle vier Sprachen, buildPageMetadata (Canonical + hreflang)", () => {
  const page = read("src/app/[locale]/bad-wellness/page.js");
  assert.match(page, /buildPageMetadata\(/);
  assert.match(page, /BAD_WELLNESS_LOCALES\.includes\(locale\)/);
});

// QM Inhaber-Entscheidung Nr. 6, 02.11.: Dornbracht-Markenkachel ohne Farbverlauf-Render –
// stattdessen ein Herstellerbild aus dem Katalog (Raumbild TARA, Bild 3), Quelle in QUELLEN.md.
test("Dornbracht-Markenkachel: Katalog-Raumbild statt Farbverlauf (Nr. 6)", () => {
  const d = M.markeById("dornbracht");
  assert.equal(d.image.src, "/Images/Wellness/produkte/dornbracht/dornbracht-tara-3.webp");
  assert.notEqual(d.image.src, "/Images/Wellness/dornbracht-tara.webp", "Render vor Farbverlauf nicht mehr auf der Kachel");
  assert.ok(fs.existsSync(path.join(ROOT, "public", d.image.src)));
  assert.match(d.image.source, /dornbracht\.com\/de-at\/designserien\/badserien\/tara/);
  assert.match(QUELLEN, /Markenkachel \/bad-wellness seit 02\.11\.2026/);
  for (const l of ["de", "en", "fr", "it"]) assert.match(BW_TEXT[l].alt.dornbracht, /TARA/, `${l}: Alt-Text zum neuen Motiv`);
});
