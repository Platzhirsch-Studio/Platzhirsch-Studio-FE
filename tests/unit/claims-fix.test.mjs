// R1-legal Nachbesserung (QM-Feedback P1-2, P2-1…4). Run: node --test tests/unit/claims-fix.test.mjs
// Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Minotti ist jetzt belegter Händler
// (minotti.com, Minotti Studio by Platzhirsch). Beispiel für eine UNBELEGTE Marke ist in dieser
// Datei durchgehend Rimadesio, damit alle Schutz- und Falsch-Positiv-Prüfungen weiter greifen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeClaims, hasDealerClaim, findClaims } from "../../src/lib/legal/claims.js";
import { publicBrand, resolveShowroomText, brandRecordHasDealerClaim } from "../../src/lib/legal/brand.js";

// --- P2-2 Erkennungslücken --------------------------------------------------
test("F01 exklusiver/Premium-Partner werden erkannt und neutralisiert", () => {
  for (const s of ["Wir sind exklusiver Partner von Rimadesio.", "Premium-Partner von Rimadesio am Bodensee.", "Rimadesio Premiumpartner."]) {
    assert.ok(hasDealerClaim(s), s);
    assert.equal(sanitizeClaims(s, undefined, { locale: "de" }), "Rimadesio in unserer Ausstellung in Lochau.");
  }
});

test("F02 zertifiziert/lizenziert als Status, nicht als Produktangabe", () => {
  assert.ok(hasDealerClaim("Zertifizierter Rimadesio Partner in Vorarlberg."));
  assert.ok(hasDealerClaim("Wir sind von Rimadesio zertifiziert."));
  assert.ok(hasDealerClaim("Lizenzierter Fachhändler für Flos."));
  assert.equal(findClaims("Das Holz ist FSC-zertifiziert.", { brandSlug: "rimadesio" }).filter((f) => f.type === "dealer").length, 0);
  assert.equal(findClaims("Der Stoff ist von OEKO-TEX zertifiziert.", { brandSlug: "rimadesio" }).filter((f) => f.type === "dealer").length, 0);
  assert.equal(findClaims("Eine lizenzierte Neuauflage des Klassikers.", { brandSlug: "classicon" }).length, 0);
});

test("F03 EN/FR/IT: reseller, certified, exclusive partner, partenaire exclusif, partner esclusivo", () => {
  const cases = [
    ["en", "Your certified Rimadesio partner on Lake Constance.", "Rimadesio in our showroom in Lochau."],
    ["en", "We are an authorised Rimadesio reseller.", "Rimadesio in our showroom in Lochau."],
    ["en", "Exclusive partner of Rimadesio.", "Rimadesio in our showroom in Lochau."],
    ["en", "Official Rimadesio distributor.", "Rimadesio in our showroom in Lochau."],
    ["fr", "Votre partenaire exclusif Rimadesio.", "Rimadesio dans notre showroom à Lochau."],
    ["it", "Il vostro partner esclusivo Rimadesio.", "Rimadesio nel nostro showroom a Lochau."],
  ];
  for (const [locale, input, expected] of cases) assert.equal(sanitizeClaims(input, undefined, { locale }), expected, input);
});

// --- P2-3 HTML ---------------------------------------------------------------
test("F04 HTML: Tags und Folgeabsatz bleiben erhalten", () => {
  assert.equal(
    sanitizeClaims("<p>Ihr offizieller Rimadesio Händler.</p><p>Text</p>", "rimadesio"),
    "<p>Rimadesio in unserer Ausstellung in Lochau.</p><p>Text</p>",
  );
});

test("F05 HTML: Inline-Tags, <br>, Listen, mehrere Absätze", () => {
  assert.equal(
    sanitizeClaims("<p>Ihr <strong>offizieller</strong> Rimadesio Händler. Besuchen Sie uns.</p>", "rimadesio", { locale: "de" }),
    "<p>Rimadesio in unserer Ausstellung in Lochau.<strong></strong> Besuchen Sie uns.</p>",
  );
  assert.equal(
    sanitizeClaims("<ul><li>Größte Auswahl</li><li>Beratung</li></ul>", undefined, { locale: "de" }),
    "<ul><li>Große Auswahl</li><li>Beratung</li></ul>",
  );
  assert.equal(
    sanitizeClaims("Rimadesio-Händler<br>Seit 1998<br/>Ein <em>einzigartiges</em> Sofa", undefined, { locale: "de" }),
    "Rimadesio in unserer Ausstellung in Lochau<br>Seit 1998<br/>Ein <em>besonderes</em> Sofa",
  );
  const two = sanitizeClaims("<p>Ihr Rimadesio Händler.</p><p>Offizieller Rimadesio Partner.</p><p>Ende</p>", "rimadesio", { locale: "de" });
  assert.equal(two, "<p>Rimadesio in unserer Ausstellung in Lochau.</p><p></p><p>Ende</p>");
});

test("F06 HTML ohne Claim bleibt byte-gleich", () => {
  const html = '<p class="x">Sofa <a href="/de/produkte">ansehen</a>.</p>\n<p>Zweiter Absatz.</p>';
  assert.equal(sanitizeClaims(html, "rimadesio"), html);
});

// --- P2-4 Sinnerhaltung -------------------------------------------------------
test("F07 'offiziell gegründet/eröffnet' ist eine Tatsache, kein Händler-Claim", () => {
  const s = "Poliform wurde offiziell 1970 gegründet.";
  assert.equal(sanitizeClaims(s, "poliform"), s);
  assert.equal(sanitizeClaims("The store was officially opened in 2019 by Rimadesio.", undefined, { locale: "en" }), "The store was officially opened in 2019 by Rimadesio.");
  // Händler-Claim im selben Text wird trotzdem ersetzt.
  assert.equal(
    sanitizeClaims("Poliform wurde offiziell 1970 gegründet. Wir sind offizieller Poliform Händler.", "poliform", { locale: "de" }),
    "Poliform wurde offiziell 1970 gegründet. Poliform in unserer Ausstellung in Lochau.",
  );
});

test("F08 Unikat-Wendungen und Funktionsbezeichnungen bleiben", () => {
  assert.equal(sanitizeClaims("Une pièce unique signée Rimadesio.", undefined, { locale: "fr" }), "Une pièce unique signée Rimadesio.");
  assert.equal(sanitizeClaims("Des pièces uniques.", undefined, { locale: "fr" }), "Des pièces uniques.");
  assert.equal(sanitizeClaims("Un pezzo unico.", undefined, { locale: "it" }), "Un pezzo unico.");
  assert.equal(sanitizeClaims("Our team leader will advise you.", undefined, { locale: "en" }), "Our team leader will advise you.");
  assert.equal(sanitizeClaims("A unique piece for your home.", undefined, { locale: "en" }), "A unique piece for your home.");
  // echte Superlative weiterhin ersetzt
  assert.equal(sanitizeClaims("Un intérieur unique.", undefined, { locale: "fr" }), "Un intérieur remarquable.");
  assert.equal(sanitizeClaims("The leader in design.", undefined, { locale: "en" }), "The specialist in design.");
  assert.equal(findClaims("Une pièce unique.", { locale: "fr" }).length, 0);
});

// --- P1-2 / P2-1 brand.js ------------------------------------------------------
const MARKE = {
  name1: "Rimadesio",
  grundungsjahr: "1948",
  bild_anhagen: [{ bild_anhagen: "/files/rimadesio hero.jpg" }],
  dealers_title_de: "Ihr Rimadesio Händler",
  dealers_title_en: "Your Rimadesio dealer",
  dealers_description_de: "Platzhirsch Studio ist Ihr offizieller Rimadesio Händler in Vorarlberg. In unserer Ausstellung zeigen wir die Kollektion.",
  dealers_description_en: "Platzhirsch Studio is your official Rimadesio dealer. Visit us.",
  dealers_description: "Platzhirsch Studio ist Ihr offizieller Rimadesio Händler in Vorarlberg.",
  beschreibung: "<p>Rimadesio ist einer der führenden Hersteller.</p><p>Gegründet 1948.</p>",
  produkte_en: "The largest selection of Rimadesio sofas.",
};

test("F09 publicBrand: kein Händler-Satz und kein Roh-Feld im serialisierten Objekt", () => {
  for (const locale of ["de", "en", "fr", "it"]) {
    const safe = publicBrand(MARKE, { locale });
    const json = JSON.stringify(Object.values(safe));
    assert.doesNotMatch(json, /händler|dealer|offiziell|official/i, locale);
    assert.equal(brandRecordHasDealerClaim(safe), false);
    assert.deepEqual(
      Object.keys(safe).filter((k) => k.startsWith("dealers_")).sort(),
      [`dealers_description_${locale}`, `dealers_title_${locale}`],
    );
  }
  const de = publicBrand(MARKE, { locale: "de" });
  assert.equal(de.dealers_title_de, "Rimadesio in unserer Ausstellung in Lochau");
  assert.equal(de.dealers_description_de, "In unserer Ausstellung zeigen wir die Kollektion.");
  assert.equal(de.beschreibung, "<p>Rimadesio ist einer der renommierten Hersteller.</p><p>Gegründet 1948.</p>");
  assert.equal(de.produkte_en, "A large selection of Rimadesio sofas.");
  assert.equal(de.bild_anhagen[0].bild_anhagen, "/files/rimadesio hero.jpg");
  assert.equal(de.grundungsjahr, "1948");
  assert.equal(brandRecordHasDealerClaim(MARKE), true);
});

test("F10 publicBrand: EN bekommt keinen deutschen Satz, ClassiCon bleibt", () => {
  const en = publicBrand(MARKE, { locale: "en" });
  assert.equal(en.dealers_title_en, "Rimadesio in our showroom in Lochau");
  assert.equal(en.dealers_description_en, "Visit us.");
  const cc = publicBrand(
    { name1: "ClassiCon", dealers_title_de: "Ihr ClassiCon Händler", dealers_description_de: "Wir sind im Händlerverzeichnis von ClassiCon gelistet." },
    { locale: "de" },
  );
  assert.equal(cc.dealers_title_de, "Ihr ClassiCon Händler");
  assert.equal(cc.dealers_description_de, "Wir sind im Händlerverzeichnis von ClassiCon gelistet.");
});

// Inhaber-Entscheidung Nr. 32 (bewusst geändert, SEO-Team A 31.10.2026): Flos ist jetzt belegt → unbelegtes Beispiel Paola Lenti.
test("F11 resolveShowroomText: gleiche Signatur wie showroomText.js, Muster aus claims.js", () => {
  const r = resolveShowroomText(
    { name1: "Paola Lenti", dealers_description_de: "Wir sind zertifizierter Partner von Paola Lenti. Leuchten zum Ausprobieren." },
    "de",
    { title: "{brand} bei uns", text: "Neutral {brand}." },
  );
  assert.equal(r.title, "Paola Lenti bei uns");
  assert.equal(r.text, "Leuchten zum Ausprobieren.");
  assert.equal(r.source, "filtered");
  assert.equal(r.removed.length, 1);
  const n = resolveShowroomText({ name1: "Paola Lenti", dealers_description_de: "Exklusiver Partner von Paola Lenti." }, "de");
  assert.equal(n.source, "neutral");
  assert.match(n.text, /^Wir zeigen und planen Paola Lenti/);
});

test("F12 check-claims liest den Flight-Payload (P1-2: Leak wird live gefunden)", async () => {
  const { flightTexts } = await import("../../tools/checks/check-claims.mjs");
  const inner = JSON.stringify({ marke: { dealers_description_de: "Platzhirsch Studio ist Ihr offizieller Rimadesio Händler in Vorarlberg." } });
  const html = `<body><p>Hallo</p><script>self.__next_f.push([1,${JSON.stringify("5:" + inner)}])</script></body>`;
  const texts = flightTexts(html);
  assert.ok(texts.includes("Platzhirsch Studio ist Ihr offizieller Rimadesio Händler in Vorarlberg."));
  assert.ok(texts.some((t) => findClaims(t, { brandSlug: "rimadesio" }).some((f) => f.type === "dealer")));
});

test("F13 'exklusive Partnerschaft' zwischen Herstellern ist kein Händler-Claim", () => {
  const s = "In exklusiver Partnerschaft mit Trip Trap setzt TRAPA auf Ölfinishes.";
  assert.equal(findClaims(s, { brandSlug: "trapa" }).filter((f) => f.type === "dealer").length, 0);
  assert.ok(hasDealerClaim("Ihr exklusiver Partner für Trapa."));
});
