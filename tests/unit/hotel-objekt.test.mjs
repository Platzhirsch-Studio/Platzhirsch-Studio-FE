// tests/unit/hotel-objekt.test.mjs – Seite Hotel & Objekt (Welle 2, Team Hotel).
// Texte DE/EN deckungsgleich, keine verbotenen Aussagen, Referenz-Slot leer
// und streng, Anfrage-Payload passt zum bestehenden Lead-Schema.
// Run: node --test tests/unit/hotel-objekt.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { HOTEL_LOCALES, PATH, hotelCopy, hotelLocale } from "../../src/lib/hotel/content.js";
import { HOTEL_REFERENCES, isPublishableReference, visibleReferences } from "../../src/lib/hotel/references.js";
import { CHALET_HASH, EMPTY_INQUIRY, buildInquiryPayload, inquiryContext, inquiryMessage, pageContextOf, validateInquiry } from "../../src/lib/hotel/inquiry.js";
import { beratungSchema } from "../../src/lib/forms/schemas.js";
import { findClaims } from "../../src/lib/legal/claims.js";

const de = hotelCopy("de");
const en = hotelCopy("en");
const fr = hotelCopy("fr");
const it = hotelCopy("it");
const ALL = ["de", "en", "fr", "it"];
const LABELS = { topic: "ein Objekt oder Hotel", place: "in einem Hotel oder einer Gastronomie" };

/** Alle Strings eines Objekts. */
function strings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => strings(v, out));
  return out;
}

/** Struktur ohne Werte (Schlüssel und Listenlängen). */
function shape(value) {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((k) => [k, shape(value[k])]));
  return typeof value;
}

// Inhaber 01.11.2026 (bewusst geändert): FR und IT sind eigene Seiten (vorher 308 → /en).
test("Pfad und Sprachen: DE, EN, FR und IT mit eigener Fassung", () => {
  assert.equal(PATH, "/hotel-objekt");
  assert.deepEqual([...HOTEL_LOCALES], ALL);
  for (const l of ALL) assert.ok(hotelCopy(l), l);
  assert.equal(hotelCopy("es"), null);
  assert.equal(hotelLocale("fr"), "fr");
  assert.equal(hotelLocale("it"), "it");
});

/** Ohne Linkziel-Schalter (`deOnly`, FR/IT `lang`) – sonst identische Struktur. */
const withoutTarget = (value) => JSON.parse(JSON.stringify(value, (k, v) => (k === "lang" || k === "deOnly" ? undefined : v)));

test("DE, EN, FR und IT haben dieselbe Struktur", () => {
  assert.deepEqual(shape(en), shape(de));
  for (const c of [fr, it]) assert.deepEqual(shape(withoutTarget(c)), shape(withoutTarget(de)));
});

test("FR/IT: übersetzt, Backoffice-Felder deutsch, Herkunft mit Sprache, fremdsprachige Ziele markiert", () => {
  for (const [l, c] of [["fr", fr], ["it", it]]) {
    assert.notEqual(c.hero.title, de.hero.title);
    assert.notEqual(c.hero.title, en.hero.title);
    assert.deepEqual(c.form.messageLabels, de.form.messageLabels, `${l}: deutsche Labels fürs Backoffice`);
    assert.deepEqual(c.form.messageTitles, de.form.messageTitles);
    assert.equal(c.form.pageContext, `Seite: Hotel & Objekt (${l.toUpperCase()})`);
    for (const item of c.services.items) {
      for (const link of [item.link, item.more].filter(Boolean)) {
        if (link.lang === "en") assert.match(link.label, /\((en anglais|in inglese)\)$/, link.label);
        if (link.deOnly) assert.match(link.label, /\((en allemand|in tedesco)\)$/, link.label);
      }
    }
  }
});

test("FR: geschützte Leerzeichen vor : ; ? ! und in « », IT «» ohne Leerzeichen", () => {
  for (const t of strings(fr)) {
    assert.doesNotMatch(t, / [:;?!»]/, `normales Leerzeichen vor Satzzeichen: ${t}`);
    assert.doesNotMatch(t, /« /, t);
  }
  assert.match(fr.faq.items[0].q, / \?$/);
  assert.match(fr.brands.ezarriCredit, /^Image : Ezarri/);
  assert.match(fr.faq.items[4].q, /« B1 »/);
  assert.match(it.faq.items[4].q, /«B1»/);
});

test("SEO-Texte: Titel mit Suffix ≤ 60, FR/IT-Description 120–149 (wird nicht gekürzt)", () => {
  for (const l of ["fr", "it"]) {
    const { title, description } = hotelCopy(l).meta;
    assert.ok(title.length + " | Platzhirsch".length <= 60, `${l} title ${title.length}`);
    assert.ok(description.length >= 120 && description.length < 150, `${l} description ${description.length}`);
  }
});

test("keine Superlative, Preise, Fristzusagen oder erfundenen Referenzen", () => {
  const banned = [
    /\b(größte|beste|führend|einzigartig|Nr\. ?1|exklusiv|Luxus|best|largest|leading|unique|luxury)\b/i,
    /€|EUR\b|CHF|\bFranken\b/,
    /innerhalb von (zwei|2) Werktagen|within (two|2) working days|Rückruf in/i,
    /Contract-Partner|Minotti[- ](Händler|dealer|Partner)/i,
    /zertifiziert|certified/i,
    /Suite 11|Musterzimmer in Lochau|sample room in Lochau/i,
  ];
  // FR/IT (01.11.2026): dieselben Verbote in der jeweiligen Sprache.
  banned.push(
    // („un unico referente“ = „ein Ansprechpartner“ ist kein Superlativ, daher kein unico)
    /\b(meilleure?s?|leader|exclusi(f|ve)s?|luxe|migliore|esclusiv[oa]|lusso)\b/i,
    /\bcertifiée?s?\b|\bcertificat[oa]\b/i,
    /(deux|2) jours ouvrables|(due|2) giorni lavorativi/i,
    /chambre témoin à Lochau|camera campione a Lochau/i
  );
  for (const locale of ALL) {
    for (const text of strings(hotelCopy(locale))) {
      for (const re of banned) assert.doesNotMatch(text, re, `${locale}: ${text}`);
    }
  }
});

test("Händler-Aussage nur ClassiCon und Ezarri (Claim-Guard)", () => {
  for (const locale of ALL) {
    const unproven = strings(hotelCopy(locale))
      .flatMap((t) => findClaims(t, { locale }));
    assert.deepEqual(unproven, [], `${locale}: ${JSON.stringify(unproven)}`);
  }
  assert.match(de.brands.dealer, /ClassiCon/);
  assert.match(de.brands.dealer, /Ezarri/);
  assert.doesNotMatch(de.brands.dealerNoEzarri, /Ezarri/);
  for (const c of [fr, it]) {
    assert.match(c.brands.dealer, /ClassiCon/);
    assert.match(c.brands.dealer, /Ezarri/);
    assert.doesNotMatch(c.brands.dealerNoEzarri, /Ezarri/);
  }
});

test("Kern-USP im Ablauf: Bestandsbesuch → Handzeichnung → Modell → 3D → Rendering → Musterzimmer → … → Montage im Saisonfenster", () => {
  const titles = de.process.steps.map((s) => s.title);
  assert.deepEqual(titles.slice(0, 6), ["Bestandsbesuch", "Handzeichnung", "Modell", "3D-Planung", "Rendering", "Musterzimmer"]);
  assert.match(titles.at(-1), /Saisonfenster/);
  assert.match(de.process.steps[0].text, /Wenn Ihr Projekt es braucht/);
  assert.match(de.process.steps[1].text, /Harald Menghin/);
  for (const c of [en, fr, it]) {
    assert.equal(c.process.steps.length, de.process.steps.length);
    assert.match(c.process.steps[1].text, /Harald Menghin/);
  }
});

test("Leistungen: Zimmer, Lobby, Restaurant, Spa mit Ezarri, Outdoor, Yacht", () => {
  assert.deepEqual(de.services.items.map((i) => i.id), ["zimmer", "lobby", "restaurant", "spa", "outdoor", "yacht"]);
  assert.match(de.services.items.find((i) => i.id === "spa").name, /Ezarri/);
});

test("Ezarri-Bild nur mit Quellenangabe und als Herstellerbild beschriftet", () => {
  for (const c of [de, en, fr, it]) {
    assert.match(c.brands.ezarriCredit, /Ezarri, ezarri\.com/);
    assert.match(c.brands.ezarriCaption, /Platzhirsch/);
  }
});

test("Referenz-Slot: leer, und unvollständige Einträge werden nie gezeigt", () => {
  assert.equal(HOTEL_REFERENCES.length, 0);
  assert.deepEqual(visibleReferences("de"), []);
  const ok = {
    id: "test",
    name: "Haus Beispiel",
    ort: "Bregenz",
    jahr: 2027,
    leistungen: { de: ["Lobby"], en: ["Lobby"] },
    freigabe: { datum: "2027-05-01", durch: "Geschäftsführung des Hauses", ablage: "Projektakte" },
  };
  assert.equal(isPublishableReference(ok), true);
  assert.equal(isPublishableReference({ ...ok, freigabe: undefined }), false);
  assert.equal(isPublishableReference({ ...ok, freigabe: { ...ok.freigabe, datum: "bald" } }), false);
  assert.equal(isPublishableReference({ ...ok, leistungen: { de: [] } }), false);
  assert.equal(isPublishableReference({ ...ok, bild: { src: "/x.jpg", alt: { de: "x" } } }), false, "Bild ohne Credit");
  assert.equal(visibleReferences("de", [ok, { id: "x" }]).length, 1);
});

test("Anfrage: Pflichtfelder Haus, Ort, Art, Zeitfenster, Name, E-Mail", () => {
  const errors = validateInquiry({ ...EMPTY_INQUIRY }, de.form);
  assert.deepEqual(Object.keys(errors).sort(), ["art", "email", "haus", "nachname", "ort", "vorname", "zeitfenster"].sort());
  const bad = validateInquiry({ ...EMPTY_INQUIRY, zimmer: "viele", telefon: "abc" }, de.form);
  assert.ok(bad.zimmer && bad.telefon);
});

const FILLED = {
  ...EMPTY_INQUIRY,
  haus: "Hotel Seeblick",
  ort: "Lindau",
  art: "hotel",
  zimmer: "42",
  bereiche: ["lobby", "spa", "unbekannt"],
  zeitfenster: "12",
  rolle: "eigentuemer",
  vorname: "Erika",
  nachname: "Muster",
  firma: "Seeblick GmbH",
  email: "erika@example.com",
  telefon: "+43 5574 0000",
  nachricht: "Umbau der Lobby vor Ostern.",
};

test("Anfrage: Payload passt zum bestehenden beratungSchema (Lead-Weg)", () => {
  assert.deepEqual(validateInquiry(FILLED, de.form), {});
  const payload = buildInquiryPayload(FILLED, de.form, LABELS);
  const parsed = beratungSchema.safeParse(payload);
  assert.ok(parsed.success, JSON.stringify(parsed.error?.issues));
  assert.equal(payload.bei_meiner_anfrage_geht_es_um, LABELS.topic);
  assert.equal(payload.das_projekt_soll_verwirklicht_werden, LABELS.place);
});

test("Anfrage: Freitext mit Thema-Zeile, Haus, Zimmerzahl, Bereichen, Zeitfenster", () => {
  const text = inquiryMessage(FILLED, de.form);
  const lines = text.split("\n");
  assert.equal(lines[0], "[Anfrage Hotel & Objekt]");
  assert.match(text, /^Haus: Hotel Seeblick$/m);
  assert.match(text, /^Zimmer\/Einheiten: 42$/m);
  assert.match(text, /^Bereiche: Lobby und Empfang, Spa und Pool$/m);
  assert.match(text, /^Zeitfenster: In 6 bis 12 Monaten$/m);
  assert.match(text, /^Rolle: Eigentümer oder Betreiber$/m);
  assert.match(text, /Nachricht: Umbau der Lobby vor Ostern\.$/);
  assert.doesNotMatch(text, /unbekannt/);
  // EN: deutsche Labels fürs Backoffice, Werte in der Sprache der Seite
  const enText = inquiryMessage(FILLED, en.form);
  assert.match(enText, /^Zeitfenster: In 6 to 12 months$/m);
});

// Inhaber-Zusatz 29.10.2026: Chalets & Ferienwohnungen.
test("Chalets & Ferienwohnungen: Arlberg, Bodensee, Vorarlberg; Bad/Spa mit Ezarri, Outdoor, Textilien, Übergabe; DE und EN", () => {
  for (const c of [de.chalets, en.chalets, fr.chalets, it.chalets]) {
    assert.ok(c.heading && c.text);
    assert.deepEqual(c.regions.map((r) => r.name).filter((n) => /Arlberg|Bodensee|Lake Constance|Lac de Constance|Lago di Costanza|Vorarlberg/.test(n)).length, 3);
    const all = strings(c).join(" ");
    assert.match(all, /Ezarri/);
    assert.match(all, /Outdoor|outdoor|extérieur/);
    assert.match(all, /Textil|textile|tessili/i);
    assert.match(all, /vermietungsfertig|ready to let|prêt à louer|pronto da affittare/);
    assert.equal(c.cta.href, CHALET_HASH);
  }
  assert.match(en.chalets.note, /Switzerland/);
});

test("Anfrage mit Kontext chalet: eigene Thema-Zeile, Schritt 2 Chalet, Herkunft 'Kontext: chalet'", () => {
  const data = { ...EMPTY_INQUIRY, haus: "Chalet Test", ort: "Lech", art: "chalet", zeitfenster: "12", vorname: "Erika", nachname: "Muster", email: "erika@example.com" };
  assert.equal(inquiryContext(data), "chalet");
  assert.equal(inquiryContext({ ...data, art: "hotel" }), "hotel");
  for (const copy of [de, en, fr, it]) {
    const payload = buildInquiryPayload(data, copy.form, LABELS);
    assert.equal(payload.das_projekt_soll_verwirklicht_werden, copy.form.placeChalet);
    assert.match(payload.bitte_beschreiben_sie_ihr_vorhaben, /^\[Anfrage Chalet & Ferienwohnung\]/);
    assert.ok(beratungSchema.safeParse(payload).success);
    assert.match(pageContextOf(data, copy.form), /Kontext: chalet$/);
  }
  const hotel = buildInquiryPayload({ ...data, art: "hotel" }, de.form, LABELS);
  assert.equal(hotel.das_projekt_soll_verwirklicht_werden, LABELS.place);
  assert.match(inquiryMessage({ ...data, art: "hotel" }, de.form), /^\[Anfrage Hotel & Objekt\]/);
});

// Inhaber 01.11.2026: FR/IT-Fassung – Anfrage und Sitemap.
test("FR/IT: Anfrage-Text mit Werten in der Sprache der Seite, Payload passt zum Schema", () => {
  assert.match(inquiryMessage(FILLED, fr.form), /^Zeitfenster: Dans 6 à 12 mois$/m);
  assert.match(inquiryMessage(FILLED, it.form), /^Bereiche: Lobby e reception, Spa e piscina$/m);
  for (const c of [fr, it]) {
    assert.deepEqual(validateInquiry(FILLED, c.form), {});
    assert.ok(beratungSchema.safeParse(buildInquiryPayload(FILLED, c.form, LABELS)).success);
    assert.equal(inquiryMessage(FILLED, c.form).split("\n").slice(0, 2).join("|"), "[Anfrage Hotel & Objekt]|Haus: Hotel Seeblick");
  }
});

test("Sitemap: Hotel & Objekt in DE, EN, FR und IT", async () => {
  const { MULTILINGUAL_PAGES } = await import("../../src/lib/seo/sitemap/extraPages.js");
  const page = MULTILINGUAL_PAGES.find((p) => p.path === PATH);
  assert.deepEqual(page.locales, ALL);
});
