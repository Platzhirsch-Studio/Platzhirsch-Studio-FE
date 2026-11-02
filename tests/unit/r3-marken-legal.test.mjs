// node --test tests/unit/r3-marken-legal.test.mjs
// R3-marken-seo: Händler-/Stimm-/Lieferfilter für Herstellertexte liegt in
// src/lib/legal/manufacturerText.js; MarkenItems/showroomText.js ist nur noch
// ein Re-Export (die Produktseite importiert von dort). ClassiCon ausgenommen.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as legal from "../../src/lib/legal/manufacturerText.js";
import * as legacy from "../../src/components/MarkenItems/showroomText.js";
import { VERIFIED_DEALER_BRANDS } from "../../src/lib/legal/claims.js";

const { sanitizeManufacturerText, cleanProse, hasDeliveryClaim, hasVoiceViolation, hasDealerWording, isVerifiedDealer, resolveShowroomText, leadProse, cleanCraftEntries, auditManufacturerText } = legal;

test("Re-Export: alter Ort liefert dieselben Funktionen (Produktseite: cleanProse, isVerifiedDealer, sentences)", () => {
  for (const name of ["cleanProse", "isVerifiedDealer", "sentences", "resolveShowroomText", "hasVoiceViolation", "NEUTRAL_TEXT", "VERIFIED_DEALER_SLUGS"]) {
    assert.equal(legacy[name], legal[name], name);
  }
  assert.equal(legacy.hasDealerClaim, legal.hasDealerWording);
});

// Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Minotti ist belegt (minotti.com). In den
// Tests bis „auditManufacturerText“ ist Rimadesio (Giussano, 1956) das Beispiel für eine unbelegte Marke.
test("Eine Quelle für belegte Händler: claims.js (VERIFIED_DEALER_BRANDS)", () => {
  assert.deepEqual([...legal.VERIFIED_DEALER_SLUGS], [...VERIFIED_DEALER_BRANDS]);
  assert.equal(isVerifiedDealer("ClassiCon"), true);
  assert.equal(isVerifiedDealer("classicon"), true);
  assert.equal(isVerifiedDealer("Minotti"), true);
  // Inhaber-Entscheidung Nr. 32 (bewusst geändert, SEO-Team A 31.10.2026): Flos ist belegt → unbelegtes Beispiel Gloster.
  for (const b of ["Poliform", "Gloster", "Paola Lenti", "Rimadesio", "Agape", ""]) assert.equal(isVerifiedDealer(b), false, b);
  for (const b of ["Flos", "Tom Dixon"]) assert.equal(isVerifiedDealer(b), true, b);
});

test("Händlersätze fallen in 4 Sprachen weg – außer bei belegten Marken", () => {
  const cases = [
    "Platzhirsch Studio ist Ihr offizieller Rimadesio Händler in Vorarlberg. Rimadesio wurde 1956 gegründet.",
    "We are your authorised Rimadesio dealer. Rimadesio was founded in 1956.",
    "Revendeur officiel Rimadesio en Autriche. Rimadesio a été fondée en 1956.",
    "Siamo il rivenditore autorizzato Rimadesio. Rimadesio è stata fondata nel 1956.",
  ];
  for (const text of cases) {
    const out = sanitizeManufacturerText(text, { brand: "Rimadesio" });
    assert.ok(!hasDealerWording(out), out);
    assert.match(out, /1956/);
  }
  const cc = sanitizeManufacturerText("Platzhirsch ist offizieller ClassiCon Händler. ClassiCon wurde 1990 gegründet.", { brand: "ClassiCon" });
  assert.match(cc, /offizieller ClassiCon Händler/);
  assert.match(cc, /Platzhirsch Home Living|Platzhirsch ist/);
});

test("Superlative fallen in 4 Sprachen weg (Stimme + Claim-Guard), auch für ClassiCon", () => {
  const bad = [
    "Rimadesio ist die führende Marke für Sofas.",
    "Die größte Rimadesio-Ausstellung am Bodensee.",
    "Ein einzigartiges Sofa.",
    "The leading brand for sofas.",
    "A unique sofa for your home.",
    "La marque leader du design italien.",
    "Le plus grand showroom de la région.",
    "Il più grande marchio italiano.",
    "Un divano unico nel suo genere.",
    "Luxuriöses italienisches Design.",
    "Nr. 1 für Designmöbel.",
  ];
  for (const s of bad) {
    assert.equal(hasVoiceViolation(s), true, s);
    assert.equal(sanitizeManufacturerText(`${s} Gegründet 1956.`, { brand: "Rimadesio" }), "Gegründet 1956.", s);
    assert.equal(sanitizeManufacturerText(`${s} Gegründet 1990.`, { brand: "ClassiCon" }), "Gegründet 1990.", s);
  }
  // Feste Wendungen ohne Werturteil bleiben ("pièce unique", "pezzo unico").
  assert.equal(hasVoiceViolation("Chaque tapis est une pièce unique."), false);
  assert.equal(hasVoiceViolation("Ogni tappeto è un pezzo unico."), false);
  assert.equal(hasVoiceViolation("Rimadesio wurde 1956 in Giussano gegründet."), false);
});

test("Liefer- und Verfügbarkeitszusagen fallen in 4 Sprachen weg", () => {
  const bad = [
    "Erhältlich bei Platzhirsch Studio in Lochau.",
    "Lieferung und Montage in ganz Österreich.",
    "Wir liefern kostenlos nach Hause.",
    "Available at Platzhirsch in Lochau.",
    "Free delivery throughout Austria.",
    "Disponible chez Platzhirsch à Lochau.",
    "Livraison gratuite dans toute l’Autriche.",
    "Disponibile presso Platzhirsch a Lochau.",
    "Consegna gratuita in tutta Italia.",
  ];
  for (const s of bad) {
    assert.equal(hasDeliveryClaim(s), true, s);
    assert.equal(sanitizeManufacturerText(`Gegründet 1956. ${s}`, { brand: "Rimadesio" }), "Gegründet 1956.", s);
  }
  for (const ok of ["Lieferung und Montage auf Anfrage.", "Delivery and assembly on request.", "Die Sofas sind in vielen Stoffen erhältlich."]) {
    assert.equal(hasDeliveryClaim(ok), false, ok);
  }
  // cleanProse behält ohne dropDelivery das alte Verhalten der Markenseite.
  assert.equal(cleanProse("Erhältlich bei uns in Lochau."), "Erhältlich bei uns in Lochau.");
  assert.equal(cleanProse("Erhältlich bei uns in Lochau.", { dropDelivery: true }), "");
});

test("leadProse: fällt der erste Satz weg, bleibt nichts (kein Text mitten im Gedanken)", () => {
  assert.equal(leadProse("Rimadesio, italienisches Luxusdesign. Erhältlich bei uns."), "");
  assert.equal(leadProse("Rimadesio aus Giussano. Erhältlich bei Platzhirsch in Lochau.", { dropDelivery: true }), "Rimadesio aus Giussano.");
  assert.equal(leadProse("Ihr Rimadesio Händler. Mehr Text."), "");
  assert.equal(leadProse("Ihr ClassiCon Händler. Mehr Text.", { allowDealer: true }), "Ihr ClassiCon Händler. Mehr Text.");
});

test("Handwerk-Einträge: Titel mit Superlativ entfällt, Text bereinigt", () => {
  // Runde 2 (Inhaber-offen Nr. 28): nur Einträge MIT Quelle werden gezeigt –
  // die Beispiele tragen deshalb eine Quelle; ohne Quelle siehe unten.
  const out = cleanCraftEntries([
    { title: "Feinste Polsterung", eyeline: "", text: "Von Hand.", source: "Hersteller-Freigabe" },
    { title: "Polsterung", eyeline: "Giussano", text: "Von Hand gefertigt. Die beste Qualität.", source: "Hersteller-Freigabe" },
    { title: "Holz", eyeline: "", text: "Die größte Auswahl.", source: "Hersteller-Freigabe" },
  ]);
  assert.deepEqual(out.map((c) => [c.title, c.text]), [["Polsterung", "Von Hand gefertigt."]]);
  // Ohne Quelle bleibt der Handwerk-Abschnitt aus (recht P1-2).
  assert.deepEqual(cleanCraftEntries([{ title: "Polsterung", eyeline: "", text: "Von Hand gefertigt." }]), []);
});

test("Showroom-Text: neutral für alle unbelegten Marken (unverändertes Verhalten)", () => {
  const m = resolveShowroomText({ name1: "Rimadesio", dealers_description_de: "Platzhirsch Studio ist Ihr offizieller Rimadesio Händler in Vorarlberg. In unserer Ausstellung in Lochau erleben Sie Rimadesio." }, "de");
  assert.equal(m.title, "Rimadesio in unserer Ausstellung in Lochau");
  assert.equal(m.text, "In unserer Ausstellung in Lochau erleben Sie Rimadesio.");
  assert.equal(m.source, "filtered");
  const c = resolveShowroomText({ name1: "ClassiCon", dealers_title_de: "Ihr ClassiCon Händler", dealers_description_de: "Platzhirsch ist offizieller ClassiCon Händler." }, "de");
  assert.equal(c.source, "cms");
  // Runde 2 (recht P2-8): kein „offiziell … in Vorarlberg“ mehr, sondern der
  // Satz aus dem Claim-Register.
  assert.match(c.text, /Vertragshändler von ClassiCon/);
  assert.doesNotMatch(c.text, /offiziell/);
  const en = resolveShowroomText({ name1: "Flos", dealers_description_de: "Deutscher Text." }, "en");
  assert.equal(en.source, "neutral");
  assert.match(en.text, /^We show and plan Flos/);
});

test("auditManufacturerText nennt den Grund je Satz", () => {
  const a = auditManufacturerText("Ihr Rimadesio Händler. Lieferung in ganz Österreich. Gegründet 1956.", { brand: "Rimadesio" });
  // Runde 2: „in ganz Österreich“ ist zusätzlich ein Länderversprechen ("claim").
  assert.deepEqual(a.map((x) => x.reasons), [["dealer"], ["delivery", "claim"], []]);
});

// Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Minotti-Markenseite zeigt den belegten
// Studio-Wortlaut aus dem Claim-Register (nah an der Minotti-Pressemeldung) samt Beleg-Link;
// Backoffice-Händlersätze („offiziell … in Vorarlberg“) fallen weg, keine Flächenangabe.
test("Showroom-Text Minotti: Studio-Wortlaut aus dem Claim-Register, 4 Sprachen, Beleg-Link", () => {
  const marke = {
    name1: "Minotti",
    dealers_title_de: "Minotti bei Platzhirsch Home Living",
    dealers_description_de: "Platzhirsch Studio ist Ihr offizieller Minotti Händler in Vorarlberg. In unserer Ausstellung in Lochau erleben Sie Minotti.",
    dealers_description_en: "Platzhirsch Studio is your official Minotti dealer. Visit us in Lochau.",
  };
  const de = resolveShowroomText(marke, "de");
  assert.equal(de.title, "Minotti Studio by Platzhirsch Home Living – seit 2019 in Lochau");
  assert.equal(de.text, "Minotti hat das Minotti Studio by Platzhirsch Home Living in Lochau 2019 eröffnet; gestaltet hat es das hauseigene Kreativstudio von Minotti. In unserer Ausstellung in Lochau erleben Sie Minotti.");
  assert.equal(de.evidenceUrl, "https://www.minotti.com/de/%C3%B6sterreichminotti-weiht-das-neue-minotti-studio-by-platzhirsch-home-living-ein");
  const titles = { en: /in Lochau since 2019$/, fr: /à Lochau depuis 2019$/, it: /a Lochau dal 2019$/ };
  for (const loc of ["de", "en", "fr", "it"]) {
    const r = resolveShowroomText(marke, loc);
    assert.match(r.title, /^Minotti Studio by Platzhirsch Home Living – /, loc);
    if (titles[loc]) assert.match(r.title, titles[loc], loc);
    assert.match(r.text, /Minotti Studio by Platzhirsch Home Living/, loc);
    assert.doesNotMatch(r.text + r.title, /offiziell|official|officiel|ufficial|Vorarlberg|m²|400|größte|führend/i, loc);
  }
  // Unbelegte Marken bekommen den Studio-Wortlaut nie.
  const p = resolveShowroomText({ name1: "Poliform", dealers_description_de: "Ihr offizieller Poliform Händler." }, "de");
  assert.equal(p.title, "Poliform in unserer Ausstellung in Lochau");
  assert.equal(p.evidenceUrl, undefined);
});
