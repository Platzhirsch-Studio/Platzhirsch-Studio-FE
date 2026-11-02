// tests/unit/kuechengeraete.test.mjs – „Geräte, die wir einplanen“
// (Inhaber-Entscheidung Nr. 18, 30.10.2026).
// Run: node --test --test-reporter=tap tests/unit/kuechengeraete.test.mjs
//
// Prüft: genau die sechs Marken, vier Sprachen vollständig (Tabelle und
// Vorschlagsdatei gleich), keine Händler-/Partner-/Superlativ-Wörter, keine
// Preise, keine <img>/Herstellerbilder, Metadaten-Längen, CTA-Ziele, Schema
// ohne Product/Offer/seller.
//
// Inhaber-Entscheidung Nr. 24 (bewusst geändert, 31.10.2026): Platzhirsch ist
// Händler der sechs Marken, Herstellerbilder sind freigegeben. Das Händlerwort
// ist jetzt erlaubt, aber NUR über den Claim-Guard (dealerStatement/
// dealerStatementList aus src/lib/legal/claims.js) – in Texten und Code bleibt
// es verboten. Herstellerbilder nur über next/image, unverändert
// (object-contain), data-pin-nopin, Quelle in docs/bildquellen/QUELLEN-kueche.md.
// Preise, Superlative und Showroom-Behauptungen bleiben verboten; der Schutz
// für unbelegte Marken (Poliform, Rimadesio …) bleibt voll geprüft.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

const { GERAETE_MARKEN, GERAETE_LOCALES, GERAETE_PATH, geraetKey, planerHref, beratungContext } = await import("../../src/lib/kueche/geraete.js");
const { GERAETE_TEXT, geraeteText } = await import("../../src/components/Kuechengeraete/geraeteCopy.js");
const { withContext } = await import("../../src/lib/forms/pathContext.js");

const PROPOSAL = JSON.parse(read("Marktresearch/digital/features/geraete-messages.json"));
const COMPONENT_FILES = [
  "src/components/Kuechengeraete/KuechengeraetePage.js",
  "src/components/Kuechengeraete/geraeteCopy.js",
  "src/lib/kueche/geraete.js",
  "src/app/[locale]/kuechengeraete/page.js",
];

/** Alle Blätter (Pfad → Text) eines Objekts. */
function leaves(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj || {})) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") out.push(...leaves(v, p));
    else out.push([p, v]);
  }
  return out;
}

/** Ohne Kommentare (// … und /* … *\/), damit Doku-Hinweise wie „keine Händleraussage“ nicht zählen. */
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

const FORBIDDEN =
  /händler|haendler|partner|partenaire|offiziell|official|officiel|ufficial|autorisiert|authori[sz]ed|autoris[ée]|autorizzat|dealer|revendeur|rivenditore|concessionari|\bbeste[nrs]?\b|\bbest\b|führend|fuehrend|leading|leader|\bnr\.?\s*1\b|number one|meilleur|migliore|einzigartig|unique|unico/i;
const PRICE = /(?:€|\bEUR\b|\bCHF\b)\s*\d|\d[\d.,']*\s*(?:€|\bEUR\b|\bCHF\b|euro\b|franken\b)/i;
// Keine Aussage, dass Geräte im Showroom stehen (nicht bestätigt).
const SHOWROOM_CLAIM = /showroom|ausstellung|ausgestellt|exposition|esposizion|exhibit|on display|vorführ/i;

test("genau die sechs Marken in fester Schreibweise, eindeutige IDs", () => {
  assert.deepEqual(
    GERAETE_MARKEN.map((m) => m.name),
    ["Gaggenau", "Miele", "V-ZUG", "BORA", "Liebherr", "Quooker"]
  );
  const ids = GERAETE_MARKEN.map((m) => m.id);
  assert.equal(new Set(ids).size, 6);
  for (const m of GERAETE_MARKEN) {
    assert.match(m.id, /^[a-z0-9-]+$/);
    assert.ok(m.groups.length >= 1, `${m.name}: Produktgruppen`);
  }
});

test("Herkunft nur wie belegt (Liebherr ohne Land)", () => {
  const origin = Object.fromEntries(GERAETE_MARKEN.map((m) => [m.name, m.origin]));
  assert.deepEqual(origin, { Gaggenau: "DE", Miele: "DE", "V-ZUG": "CH", BORA: "DE", Liebherr: null, Quooker: "NL" });
});

test("vier Sprachen vollständig: gleiche Schlüssel wie Deutsch, kein leerer Text", () => {
  assert.deepEqual(GERAETE_LOCALES, ["de", "en", "fr", "it"]);
  const deKeys = leaves(GERAETE_TEXT.de).map(([k]) => k).sort();
  for (const l of GERAETE_LOCALES) {
    const entries = leaves(GERAETE_TEXT[l]);
    assert.deepEqual(entries.map(([k]) => k).sort(), deKeys, `${l}: Schlüssel`);
    for (const [k, v] of entries) assert.ok(typeof v === "string" && v.trim().length > 0, `${l}.${k} leer`);
    // jede Marke, jede Gruppe, jedes Land hat einen Text
    for (const m of GERAETE_MARKEN) {
      assert.ok(GERAETE_TEXT[l].marke[geraetKey(m.id)]?.text, `${l}: Text ${m.name}`);
      for (const g of m.groups) assert.ok(GERAETE_TEXT[l].gruppen[g], `${l}: Gruppe ${g}`);
      if (m.origin) assert.ok(GERAETE_TEXT[l].laender[m.origin], `${l}: Land ${m.origin}`);
    }
  }
});

test("Vorschlagsdatei = Rückfall-Tabelle (Namespace kuechengeraete)", () => {
  assert.equal(typeof PROPOSAL._hinweis, "string");
  for (const l of GERAETE_LOCALES) assert.deepEqual(PROPOSAL[l]?.kuechengeraete, GERAETE_TEXT[l], l);
});

test("keine Händler-/Partner-/offiziell-/Superlativ-Wörter, keine Preise, keine Showroom-Behauptung", () => {
  for (const l of GERAETE_LOCALES) {
    for (const [k, v] of leaves(GERAETE_TEXT[l])) {
      assert.doesNotMatch(v, FORBIDDEN, `${l}.${k}: ${v}`);
      assert.doesNotMatch(v, PRICE, `${l}.${k}: ${v}`);
      // Inhaber 30.10.2026: „3 oder 4 Schauküchen“, nicht alle Marken – nur ablauf.schauraum nennt den Showroom.
      if (k !== "ablauf.schauraum") assert.doesNotMatch(v, SHOWROOM_CLAIM, `${l}.${k}: ${v}`);
    }
  }
  // auch kein fest verdrahteter Kundentext im Code.
  // Inhaber-Entscheidung Nr. 24 (bewusst geändert, 31.10.2026): erlaubt sind nur die Bezeichner des
  // Claim-Guards (dealerStatement, dealerStatementList, dealerLine), nie ein selbst geschriebenes Händlerwort.
  for (const f of COMPONENT_FILES) {
    const code = stripComments(read(f));
    assert.doesNotMatch(code, /Händler|Partner|offiziell|autorisiert|authorized|(?<![\w-])dealer\b|revendeur|rivenditore|\bbeste[nrs]?\b|führend/i, f);
    assert.doesNotMatch(code, PRICE, f);
  }
});

// Inhaber-Entscheidung Nr. 24 (bewusst geändert, 31.10.2026): Händlersatz nur über den Claim-Guard.
test("Händlersatz der sechs Marken nur aus dem Claim-Register, in vier Sprachen", async () => {
  const { dealerStatement, dealerStatementList, findClaims, isVerifiedDealerBrand } = await import("../../src/lib/legal/claims.js");
  const ids = GERAETE_MARKEN.map((m) => m.id);
  for (const m of GERAETE_MARKEN) assert.ok(isVerifiedDealerBrand(m.id), m.id);
  const WORD = { de: /ist Händler von /, en: /dealer\.$/, fr: /est revendeur /, it: /è rivenditore / };
  for (const l of GERAETE_LOCALES) {
    const s = dealerStatementList(ids, l);
    assert.match(s, WORD[l], l);
    for (const m of GERAETE_MARKEN) {
      assert.ok(s.includes(m.name), `${l}: ${m.name}`);
      assert.ok(dealerStatement(m.id, l).includes(m.name), `${l}: Einzelsatz ${m.name}`);
    }
    // „Händler“, nicht „Vertragshändler“; kein offiziell/autorisiert/exklusiv, kein Superlativ, kein Preis, kein Showroom.
    assert.doesNotMatch(s, /Vertragshändler|offiziell|official|officiel|ufficial|autoris|authori|exklusiv|exclusive|premium/i, l);
    assert.doesNotMatch(s, PRICE, l);
    assert.doesNotMatch(s, SHOWROOM_CLAIM, l);
    assert.deepEqual(findClaims(s, { locale: l }), [], `${l}: Claim-Guard`);
  }
  // Die Seite holt die Sätze aus dem Claim-Guard.
  const page = stripComments(read("src/components/Kuechengeraete/KuechengeraetePage.js"));
  assert.match(page, /import \{ dealerStatement, dealerStatementList \} from "@\/lib\/legal\/claims"/);
  assert.match(page, /dealerStatementList\(GERAETE_MARKEN\.map\(\(m\) => m\.id\), locale\)/);
  assert.match(page, /dealerStatement\(marke\.id, locale\)/);
  // Schutz für unbelegte Marken bleibt voll: Händler-Aussagen zu Poliform, Rimadesio, Agape … werden gefunden.
  for (const [text, l] of [
    ["Platzhirsch ist Händler von Poliform.", "de"],
    ["Platzhirsch ist offizieller Rimadesio Händler.", "de"],
    // Inhaber-Entscheidung Nr. 32 (bewusst geändert, SEO-Team A 31.10.2026): Flos ist belegt → unbelegtes Beispiel Rimadesio.
    ["Platzhirsch Home Living is an official Rimadesio dealer.", "en"],
    ["Wir sind autorisierter Partner von Agape.", "de"],
  ]) assert.ok(findClaims(text, { locale: l }).some((f) => f.type === "dealer"), text);
});

test("Markennamen korrekt geschrieben (V-ZUG, BORA) in allen Texten", () => {
  for (const l of GERAETE_LOCALES) {
    for (const [k, v] of leaves(GERAETE_TEXT[l])) {
      assert.doesNotMatch(v, /V-Zug|VZUG|V ZUG|\bBora\b|\bQUOOKER\b|\bMIELE\b/, `${l}.${k}`);
    }
  }
});

// Inhaber-Entscheidung Nr. 24 (bewusst geändert, 31.10.2026): Herstellerbilder erlaubt – nur über
// next/image in der Seitenkomponente, unverändert (object-contain), nicht pinbar, Quelle dokumentiert.
test("Herstellerbilder: nur next/image, object-contain, data-pin-nopin, Quelle in QUELLEN.md, keine Logos", () => {
  for (const f of COMPONENT_FILES) {
    const code = stripComments(read(f));
    assert.doesNotMatch(code, /<img\b|<Media\b/, f);
    assert.doesNotMatch(code, /logo/i, f);
    if (f !== "src/components/Kuechengeraete/KuechengeraetePage.js") assert.doesNotMatch(code, /<Image\b|next\/image/, f);
  }
  const page = read("src/components/Kuechengeraete/KuechengeraetePage.js");
  assert.match(page, /import Image from "next\/image"/);
  assert.match(page, /object-contain/);
  assert.match(page, /data-pin-nopin="true"/);
  assert.doesNotMatch(page, /object-cover|fill(=|\s)/);
  // Keine Herstellerbilder von fremden Servern im Code (Dateien liegen lokal unter /Images/Kueche/).
  for (const f of ["src/components/Kuechengeraete/KuechengeraetePage.js", "src/components/Kuechengeraete/geraeteCopy.js", "src/app/[locale]/kuechengeraete/page.js"]) {
    assert.doesNotMatch(stripComments(read(f)), /https?:\/\/[^"'\s]*(gaggenau|miele|vzug|v-zug|bora|liebherr|quooker)/i, f);
  }
  const quellen = read("docs/bildquellen/QUELLEN-kueche.md");
  assert.match(quellen, /Inhaber-Entscheidung Nr\. 24/);
  const HOST = { gaggenau: /gaggenau\.com/, miele: /miele\./, "v-zug": /vzug\.com/, bora: /bora\.com/, liebherr: /liebherr\.com/, quooker: /quooker\./ };
  for (const m of GERAETE_MARKEN) {
    assert.ok("image" in m, `${m.id}: Feld image (null = kein Bild)`);
    if (!m.image) continue;
    const { src, width, height, source } = m.image;
    assert.match(src, /^\/Images\/Kueche\/[a-z0-9-]+\.(jpg|png|webp)$/, m.id);
    assert.ok(src.slice("/Images/Kueche/".length).startsWith(`${m.id}-`), `${m.id}: Dateiname`);
    assert.ok(fs.existsSync(path.join(ROOT, "public", src)), `${m.id}: Datei fehlt`);
    assert.ok(width > 0 && height > 0 && Math.max(width, height) <= 1600, `${m.id}: Maße`);
    assert.match(source, HOST[m.id], `${m.id}: Fundstelle beim Hersteller`);
    assert.ok(quellen.includes(path.basename(src)), `${m.id}: Quelle in QUELLEN.md`);
    for (const l of GERAETE_LOCALES) {
      const alt = GERAETE_TEXT[l].alt?.[geraetKey(m.id)];
      assert.ok(alt && alt.startsWith(`${m.name}`), `${l}: Alt-Text ${m.name}`);
    }
  }
});

test("Metadaten: Titel ≤ 60, Beschreibung ≤ 150 (Seitenregel) in allen Sprachen, alle sechs Marken genannt", () => {
  for (const l of GERAETE_LOCALES) {
    const { title, description } = GERAETE_TEXT[l].meta;
    assert.ok(title.length <= 60, `${l}: Titel ${title.length}`);
    assert.ok(description.length <= 150, `${l}: Description ${description.length}`);
    for (const m of GERAETE_MARKEN) assert.ok(description.includes(m.name), `${l}: ${m.name} in Description`);
  }
});

test("geraeteText: Messages zuerst (mit Namespace), sonst Tabelle, sonst Deutsch", () => {
  const fake = { has: (k) => k === "kuechengeraete.title", raw: () => "Aus den Messages" };
  assert.equal(geraeteText("en", "title", fake), "Aus den Messages");
  assert.equal(geraeteText("en", "crumb", fake), GERAETE_TEXT.en.crumb);
  assert.equal(geraeteText("xx", "title"), GERAETE_TEXT.de.title);
  assert.equal(geraeteText("fr", "marke.vzug.text"), GERAETE_TEXT.fr.marke.vzug.text);
});

test("CTA-Ziele: Küchenplaner mit ?geraet=, Beratung mit thema=kueche und produkt=<Marke>", () => {
  assert.equal(GERAETE_PATH, "/kuechengeraete");
  assert.equal(planerHref("v-zug"), "/kuechenplaner?geraet=v-zug");
  assert.equal(planerHref(), "/kuechenplaner");
  const bora = GERAETE_MARKEN.find((m) => m.id === "bora");
  assert.equal(withContext("/beratung", beratungContext(bora)), "/beratung?thema=kueche&produkt=BORA");
  assert.equal(withContext("/consultation", beratungContext(null)), "/consultation?thema=kueche");
  // Geräte-Anbindung fix-04: der Planer wertet ?geraet= aus (Marke oder Produkt-Slug).
  const planer = read("src/app/[locale]/kuechenplaner/page.js");
  assert.match(planer, /const \{ k, t, geraet \} = await searchParams/);
});

test("Schema: ItemList mit Brand, kein Product, kein Offer, kein seller, kein Preis", () => {
  const code = stripComments(read("src/components/Kuechengeraete/KuechengeraetePage.js"));
  assert.match(code, /"@type": "ItemList"/);
  assert.match(code, /"@type": "Brand"/);
  assert.doesNotMatch(code, /"Product"|"Offer"|seller|priceCurrency|"price"/);
});

test("Seite: alle vier Sprachen, buildPageMetadata (Canonical + hreflang), keine gesperrte Datei nötig", () => {
  const page = read("src/app/[locale]/kuechengeraete/page.js");
  assert.match(page, /buildPageMetadata\(/);
  assert.match(page, /GERAETE_LOCALES\.includes\(locale\)/);
  assert.doesNotMatch(page, /locale !== "de"/);
});

test("Schauküchen: allgemein, ohne bestimmte Marke und ohne Vorführ-Versprechen", () => {
  for (const l of GERAETE_LOCALES) {
    const v = GERAETE_TEXT[l].ablauf.schauraum;
    assert.ok(v, l);
    assert.doesNotMatch(v, /Gaggenau|Miele|V-ZUG|BORA|Liebherr|Quooker|ausprobier|vorführ|try out|essayer|provare|[34]/i, l);
  }
});

// Inhaber 31.10.2026 („alle Vorschaubilder gleich groß“): jede Markenkarte hat ein Bild – eigenes
// oder aus dem Herstellerkatalog (katalogBild) – in einem gleichen 4:3-Rahmen, object-contain.
test("Inhaber 31.10.2026: alle Markenkarten mit Bild im gleichen Rahmen", async () => {
  const { katalogBild } = await import("../../src/lib/kueche/katalogBild.js");
  const quellen = read("docs/bildquellen/QUELLEN.md");
  for (const m of GERAETE_MARKEN) {
    if (m.image) continue;
    const b = katalogBild(m, "de");
    assert.ok(b, `${m.id}: katalogBild fehlt oder löst nicht auf`);
    assert.ok(fs.existsSync(path.join(ROOT, "public", b.src)), `${m.id}: Datei ${b.src}`);
    assert.ok(quellen.includes(b.src.replace(/^\/Images\/Wellness\//, "")), `${m.id}: Quelle in QUELLEN.md`);
    for (const l of GERAETE_LOCALES) assert.ok(katalogBild(m, l).alt.length > 5, `${m.id} ${l}: Alt-Text`);
  }
  const page = read("src/components/Kuechengeraete/KuechengeraetePage.js");
  assert.match(page, /aspect-4\/3[^"]*bg-linen/);
  assert.doesNotMatch(page, /max-h-\[26rem\]/);
});
