// tests/unit/katalog-konfigurator.test.mjs
// Inhaber-Auftrag 31.10.2026 („konfigurierbar, starke Bilder – auch wie es im Raum wirkt“):
// Schema-Felder bilder[].typ, ausfuehrungen, zubehoer, MARKE.looks + Konfigurator-Logik.
// node --test --test-reporter=tap tests/unit/katalog-konfigurator.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const schema = await import("../../src/lib/katalog/schema.js");
const katalog = await import("../../src/lib/katalog/index.js");
const aus = await import("../../src/lib/katalog/ausfuehrung.js");
const logik = await import("../../src/lib/katalog/konfiguratorLogik.js");

const T = (de) => ({ de, en: de, fr: de, it: de });
const bild = (file, typ) => ({ src: `/Images/Wellness/produkte/soleum/${file}`, width: 100, height: 80, alt: T("Soleum X"), quelleUrl: "https://www.soleum.at/x", abgerufen: "2026-10-31", ...(typ ? { typ } : {}) });
const base = {
  slug: "soleum-x",
  marke: "soleum",
  bereich: "wellness",
  kategorie: "waermeliege",
  name: "X",
  kurz: T("Kurztext"),
  merkmale: [],
  bilder: [bild("a.jpg"), bild("b.jpg", "ambiente"), bild("c.jpg", "detail")],
  herstellerUrl: "https://www.soleum.at/x",
  quellen: ["https://www.soleum.at/x"],
  stand: "2026-10-31",
};
const gruppe = (optionen, name = T("Basis")) => ({ gruppe: name, optionen });
const errs = (p) => schema.validateProdukt({ ...base, ...p }, { marke: "soleum" });

test("Schema: neue Felder optional (rückwärtskompatibel) und gültige Beispiele ohne Fehler", () => {
  assert.deepEqual(schema.validateProdukt(base, { marke: "soleum" }), []);
  const ok = errs({
    ausfuehrungen: [
      gruppe([{ id: "weiss", name: T("Weiß"), standard: true, bilder: ["/Images/Wellness/produkte/soleum/a.jpg"] }, { id: "eiche", name: "Oak", bilder: [bild("eiche.jpg")] }]),
      gruppe([{ id: "beige", name: T("Beige"), code: "RAL 1013", farbe: "#EAE6CA" }], "Front-Paneel"),
    ],
    zubehoer: [{ slug: "soleum-y", hinweis: T("Passt an die Basis") }],
  });
  assert.deepEqual(ok, []);
  assert.equal(schema.bildTyp({}), "freisteller");
  assert.equal(schema.bildTyp({ typ: "ambiente" }), "ambiente");
});

test("Schema: Fehler bei Typ, IDs, standard, Farbe, Bildern, Preisen je Option, Zubehör", () => {
  const has = (e, re) => assert.ok(e.some((x) => re.test(x)), `${re} nicht in ${JSON.stringify(e)}`);
  has(errs({ bilder: [bild("a.jpg", "raum")] }), /typ/);
  has(errs({ ausfuehrungen: [gruppe([{ id: "a", name: "A" }, { id: "a", name: "B" }])] }), /doppelt/);
  has(errs({ ausfuehrungen: [gruppe([{ id: "A B", name: "A" }])] }), /id ungültig/);
  has(errs({ ausfuehrungen: [gruppe([{ id: "a", name: "A", standard: true }, { id: "b", name: "B", standard: true }])] }), /standard höchstens einmal/);
  has(errs({ ausfuehrungen: [gruppe([{ id: "a", name: "A", farbe: "blau" }])] }), /farbe/);
  has(errs({ ausfuehrungen: [gruppe([{ id: "a", name: "A", bilder: ["/Images/Wellness/produkte/soleum/fehlt.jpg"] }])] }), /steht nicht in bilder/);
  has(errs({ ausfuehrungen: [gruppe([{ id: "a", name: "A", bilder: [{ ...bild("x.jpg"), quelleUrl: "" }] }])] }), /quelleUrl/);
  has(errs({ ausfuehrungen: [gruppe([{ id: "a", name: "A", bilder: [bild("x.jpg").src.replace("soleum", "agape")] }])] }), /steht nicht/);
  has(errs({ ausfuehrungen: [gruppe([])] }), /optionen fehlen/);
  has(errs({ ausfuehrungen: [gruppe([{ id: "a", name: "A" }]), gruppe([{ id: "b", name: "B" }])] }), /gruppe "basis" doppelt/);
  has(errs({ ausfuehrungen: [gruppe([{ id: "a", name: "A", preis: 5 }])] }), /unbekannte Felder preis/);
  // Preise je Option NUR für Marken mit Verkaufspreis (Accessoires) – sonst nie.
  has(errs({ ausfuehrungen: [gruppe([{ id: "a", name: "A", betrag: 49 }])] }), /Preise je Option nur/);
  const acc = { ...base, slug: "riedel-x", marke: "riedel", bereich: "accessoires", kategorie: "glas", bilder: [], ausfuehrungen: [gruppe([{ id: "a", name: "A", betrag: 49 }])] };
  assert.deepEqual(schema.validateProdukt(acc, { marke: "riedel" }), []);
  has(schema.validateProdukt({ ...acc, ausfuehrungen: [gruppe([{ id: "a", name: "A", betrag: -1 }])] }, { marke: "riedel" }), /betrag/);
  // Wortregeln gelten auch für Optionsnamen.
  has(errs({ ausfuehrungen: [gruppe([{ id: "a", name: T("Die beste Farbe") }])] }), /Superlativ/);
  has(errs({ zubehoer: [{ slug: "soleum-x" }] }), /sich selbst/);
  has(errs({ zubehoer: [{ slug: "soleum-y", hinweis: "nur de" }] }), /hinweis/);
  // Looks
  const m = { slug: "soleum", name: "Soleum", welt: "bad-wellness", herstellerUrl: "https://www.soleum.at/", dealer: true };
  const look = { id: "raum-1", titel: T("Raum"), bild: bild("r.jpg", "ambiente"), produkte: ["soleum-x"] };
  assert.deepEqual(schema.validateLooks({ ...m, looks: [look] }), []);
  has(schema.validateLooks({ ...m, looks: [look, look] }), /doppelt/);
  has(schema.validateLooks({ ...m, looks: [{ ...look, produkte: [] }] }), /produkte/);
  has(schema.validateLooks({ ...m, looks: [{ ...look, bild: { ...look.bild, quelleUrl: "" } }] }), /quelleUrl/);
  has(schema.verweisFehler([base], [{ ...m, looks: [{ ...look, produkte: ["soleum-fehlt"] }] }]), /gibt es nicht/);
  has(schema.verweisFehler([{ ...base, zubehoer: [{ slug: "soleum-fehlt" }] }], []), /gibt es nicht/);
});

test("Katalog: alle Verweise (zubehoer, looks) zeigen auf vorhandene Produkte", () => {
  assert.deepEqual(schema.verweisFehler(katalog.ALLE_PRODUKTE, katalog.KATALOG_MARKEN), []);
});

// Streng für die in diesem Auftrag angereicherten Marken; für die übrigen (Teams noch in Arbeit)
// nur Hinweis im TAP-Log, damit deren Zwischenstand diesen Test nicht rot färbt.
const STRENG = new Set(["naggura", "aquavia-spa", "fabio-alemanno"]);
test("Bilder der Optionen und Looks: Datei existiert, Größe stimmt, ≤ 1600 px, Quelle in QUELLEN.md", async (t) => {
  const sharp = require("sharp");
  const quellen = read("docs/bildquellen/QUELLEN.md");
  const extra = [];
  for (const p of katalog.ALLE_PRODUKTE) for (const b of schema.produktBilderAlle(p)) if (!p.bilder.includes(b)) extra.push([p.marke, p.slug, b]);
  for (const m of katalog.KATALOG_MARKEN) for (const l of m.looks || []) extra.push([m.slug, `${m.slug}/${l.id}`, l.bild]);
  const hinweise = {};
  for (const [marke, wer, b] of extra) {
    const file = path.join(ROOT, "public", b.src);
    const fehler = [];
    if (!fs.existsSync(file)) fehler.push(`${wer}: ${b.src} fehlt`);
    else {
      const meta = await sharp(file).metadata();
      if (meta.width !== b.width || meta.height !== b.height) fehler.push(`${b.src}: Größe ${meta.width}×${meta.height} ≠ ${b.width}×${b.height}`);
      if (Math.max(meta.width, meta.height) > 1600) fehler.push(`${b.src} > 1600 px`);
    }
    if (!quellen.includes(b.src.replace("/Images/Wellness/", ""))) fehler.push(`${b.src} nicht in QUELLEN.md`);
    if (!quellen.includes(b.quelleUrl)) fehler.push(`${b.quelleUrl} nicht in QUELLEN.md`);
    if (STRENG.has(marke)) assert.deepEqual(fehler, []);
    else if (fehler.length) hinweise[marke] = (hinweise[marke] || 0) + fehler.length;
  }
  for (const [m, n] of Object.entries(hinweise)) t.diagnostic(`HINWEIS Options-/Look-Bilder ${m}: ${n} offene Punkte (Datei/Größe/QUELLEN.md)`);
});

test("Naggura: konfigurierbar (Basis + Front-Paneel in 5 RAL-Farben), Raumbilder, Looks; nur Hotel-Wellness", () => {
  const n = katalog.produkteByMarke("naggura");
  const sb = katalog.produktBySlug("naggura-ikon-sideboard-4m");
  const gruppen = sb.ausfuehrungen.map((g) => schema.textOf(g.gruppe, "de"));
  assert.ok(gruppen.includes("Basis") && gruppen.includes("Front-Paneel"), gruppen.join());
  const panel = sb.ausfuehrungen.find((g) => schema.textOf(g.gruppe, "de") === "Front-Paneel");
  assert.deepEqual(panel.optionen.map((o) => o.code).sort(), ["RAL 1013", "RAL 3004", "RAL 5024", "RAL 6021", "RAL 7024"]);
  const basis = sb.ausfuehrungen.find((g) => schema.textOf(g.gruppe, "de") === "Basis");
  assert.ok(basis.optionen.length >= 3 && basis.optionen.every((o) => o.bilder?.length), "Basis-Optionen mit eigenem Bild");
  assert.ok(n.some((p) => p.bilder.some((b) => schema.bildTyp(b) === "ambiente")), "Raumbilder vorhanden");
  assert.ok(katalog.looksVon("naggura").length >= 1, "Looks vorhanden");
  // Inhaber 31.10.2026: Panels/Zubehör nicht als Produkt; keine Podologie/Physio-Produkte.
  assert.ok(!n.some((p) => /decorative-panel|headrest|podo|cushion|pillow/.test(p.slug)), "Zubehör/Panels nicht als Produkt");
  assert.ok(n.every((p) => ["therapieliege", "behandlungsraum"].includes(p.kategorie)));
  for (const p of n) assert.doesNotMatch(schema.textOf(p.kurz, "de"), /Therapie|Physio|Osteopath|Podolog|Praxis/, p.slug);
});

test("Galerie: Raumbilder zuerst, dann Freisteller, dann Details", () => {
  const g = aus.galerie(base);
  assert.deepEqual(g.ambiente.map((b) => b.src.split("/").pop()), ["b.jpg"]);
  assert.deepEqual(g.freisteller.map((b) => b.src.split("/").pop()), ["a.jpg"]);
  assert.deepEqual(g.detail.map((b) => b.src.split("/").pop()), ["c.jpg"]);
});

test("Konfigurator-Logik: Standard, Vorschau je Option, Text, Tastatur, Beratungs-Kontext", () => {
  const p = {
    ...base,
    ausfuehrungen: [
      gruppe([{ id: "weiss", name: T("Weiß"), bilder: ["/Images/Wellness/produkte/soleum/a.jpg"] }, { id: "eiche", name: T("Eiche"), standard: true, bilder: [bild("eiche.jpg")] }, { id: "grau", name: T("Grau") }]),
      gruppe([{ id: "blau", name: T("Blau"), code: "RAL 5024", bilder: [bild("blau.jpg")] }, { id: "rot", name: T("Rot RAL 3004"), code: "RAL 3004" }], T("Front-Paneel")),
    ],
  };
  assert.deepEqual(aus.standardAuswahl(p), ["eiche", "blau"]);
  assert.deepEqual(aus.normalisiereAuswahl(p, ["gibtsnicht", "rot"]), ["eiche", "rot"]);
  assert.equal(aus.auswahlText(p, ["eiche", "blau"]), "Basis: Eiche · Front-Paneel: Blau (RAL 5024)");
  assert.equal(aus.auswahlText(p, ["eiche", "rot"]), "Basis: Eiche · Front-Paneel: Rot RAL 3004", "Code nicht doppelt");
  assert.equal(aus.produktMitAusfuehrung("Soleum", p, ["eiche", "blau"]), "Soleum X – Basis: Eiche · Front-Paneel: Blau (RAL 5024)");
  assert.match(aus.vorschauBild(p, ["eiche", "blau"]).src, /eiche\.jpg$/);
  assert.match(aus.vorschauBild(p, ["eiche", "blau"], 1).src, /blau\.jpg$/, "zuletzt geänderte Gruppe gewinnt");
  assert.match(aus.vorschauBild(p, ["grau", "rot"]).src, /a\.jpg$/, "ohne Optionsbild: erster Freisteller");

  const d = aus.konfiguratorDaten(p, "de");
  assert.deepEqual(d.standard, ["eiche", "blau"]);
  assert.equal(d.gruppen[1].optionen[0].code, "RAL 5024");
  assert.ok(d.ratio > 0 && d.ratio <= 100 / 80 + 1e-9, "Rahmen nach höchstem Bild (kein Sprung)");
  assert.ok(!JSON.stringify(d).includes("quelleUrl"), "Insel bekommt keine Quellen/4 Sprachen");
  // Logik der Insel auf den kleinen Daten = Server-Logik
  assert.equal(logik.auswahlLabel(d, ["eiche", "blau"]), aus.auswahlText(p, ["eiche", "blau"]));
  assert.equal(logik.vorschau(d, ["weiss", "blau"], 0).src, "/Images/Wellness/produkte/soleum/a.jpg");
  assert.equal(logik.vorschau(d, ["grau", "rot"]).src, d.start.src);
  assert.deepEqual(logik.waehle(["eiche", "blau"], 1, "rot"), ["eiche", "rot"]);
  assert.equal(logik.naechsterIndex("ArrowRight", 2, 3), 0);
  assert.equal(logik.naechsterIndex("ArrowLeft", 0, 3), 2);
  assert.equal(logik.naechsterIndex("Home", 2, 3), 0);
  assert.equal(logik.naechsterIndex("End", 0, 3), 2);
  assert.equal(logik.naechsterIndex("a", 0, 3), null);
});

test("Insel klein: Konfigurator ohne Messages, Logik importfrei, kein Schema im Client", () => {
  const k = read("src/components/Katalog/Konfigurator.js");
  assert.match(k, /^"use client";/);
  const imports = k.split("\n").filter((z) => /^import /.test(z)).join("\n");
  assert.doesNotMatch(k, /useTranslations\(/);
  assert.doesNotMatch(imports, /katalog\/schema|katalog\/ausfuehrung|@\/lib\/katalog"/, "nur konfiguratorLogik im Client");
  assert.match(k, /role="radiogroup"/);
  assert.match(k, /aria-checked/);
  assert.match(k, /data-pin-nopin/);
  assert.doesNotMatch(read("src/lib/katalog/konfiguratorLogik.js"), /^import /m);
  const pd = read("src/components/Katalog/ProduktDetail.js");
  assert.match(pd, /produkt\.raumObjekt/);
  assert.match(pd, /LooksBlock/);
  for (const l of ["de", "en", "fr", "it"]) {
    const k2 = JSON.parse(read(`src/messages/${l}.json`)).katalog.produkt;
    for (const key of ["raumTitel", "raumObjekt", "ansichten", "ausfuehrungTitel", "ausfuehrungGewaehlt", "ausfuehrungHinweis", "vorschau", "looksTitel", "looksLead", "lookProdukte"]) assert.ok(k2[key], `${l}: katalog.produkt.${key}`);
  }
});
