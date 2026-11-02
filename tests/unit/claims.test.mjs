// Claim-Guard (src/lib/legal/claims.js). Run: node --test tests/unit/claims.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  VERIFIED_DEALER_BRANDS,
  CLAIM_REGISTER,
  sanitizeClaims,
  hasDealerClaim,
  neutralDealerText,
  findClaims,
  splitSentences,
  toBrandSlug,
  isVerifiedDealerBrand,
  dealerStatement,
  dealerStatementList,
  verifiedDealersSentence,
} from "../../src/lib/legal/claims.js";

const noDealerWords = (s) =>
  assert.doesNotMatch(s, /händler|offiziell|autorisiert|vertragspartner|flagship|dealer|official|authori[sz]ed|revendeur|officiel|agréé|rivenditor|ufficial|autorizzat/i);

// --- Register ---------------------------------------------------------------
// Integration 28.10.2026: Ezarri kommt hinzu (Inhaber-Entscheidung Nr. 7, Händlervertrag).
// Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Minotti (öffentlicher Beleg minotti.com)
// und die 7 Bad-&-Wellness-Marken (Nr. 19/21) kommen hinzu; die Liste wird weiter exakt erwartet.
// Inhaber-Entscheidung Nr. 24 (bewusst geändert, 31.10.2026): die 6 Küchengeräte-Marken kommen hinzu
// (Wortwahl „Händler“, Beleg laut Inhaber); weiterhin exakte Liste.
// Inhaber-Entscheidungen Nr. 27/28 (bewusst geändert, SEO-Team A 31.10.2026): Baobab Collection, Riedel und Cire Trudon kommen hinzu
// (Händlerstatus laut Inhaber bestätigt, Wortwahl „Händler“, Slugs wie src/lib/katalog/marken/); weiterhin exakte Liste.
test("01 belegte Händler: ClassiCon, Ezarri, Minotti, 7 Bad-&-Wellness-, 6 Küchengeräte- und 3 Accessoire-Marken", () => {
  assert.deepEqual([...VERIFIED_DEALER_BRANDS], [
    "classicon", "ezarri", "minotti",
    "starpool", "soleum", "fabio-alemanno", "aquavia-spa", "naggura", "dornbracht", "antoniolupi",
    "gaggenau", "miele", "v-zug", "bora", "liebherr", "quooker",
    "baobab-collection", "riedel", "cire-trudon",
    // Inhaber-Entscheidung Nr. 32 (bewusst geändert, SEO-Team A 31.10.2026): Flos, Tom Dixon, Zalto, Assouline, Kähler, Lyngby Porcelæn (Händlerstatus laut Inhaber).
    "flos", "tom-dixon", "zalto", "assouline", "kahler", "lyngby-porcelaen",
  ]);
  assert.equal(CLAIM_REGISTER.length, 25);
  for (const c of CLAIM_REGISTER.slice(10)) {
    assert.equal(c.wording, "dealer", c.id);
    assert.equal(c.evidenceUrl, null, c.id);
    assert.match(c.evidence, /Inhaber-Bestätigung 31\.10\.2026/, c.id);
  }
  assert.deepEqual(CLAIM_REGISTER.map((c) => c.brandSlug), [...VERIFIED_DEALER_BRANDS]);
  for (const c of CLAIM_REGISTER) {
    assert.ok(c.evidenceUrl || c.evidence, `${c.id}: Beleg fehlt`);
    assert.match(c.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
  }
  assert.equal(CLAIM_REGISTER[0].brandSlug, "classicon");
  assert.equal(CLAIM_REGISTER[0].evidenceUrl, "https://www.classicon.com/de/haendler.html");
  assert.equal(CLAIM_REGISTER[1].brandSlug, "ezarri");
  assert.match(CLAIM_REGISTER[1].evidence, /Händlervertrag/);
  assert.ok(Object.isFrozen(VERIFIED_DEALER_BRANDS));
});

test("02 toBrandSlug / isVerifiedDealerBrand", () => {
  assert.equal(toBrandSlug("Tréca"), "treca");
  assert.equal(toBrandSlug("Paola Lenti"), "paola-lenti");
  assert.ok(isVerifiedDealerBrand("ClassiCon"));
  // Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Minotti ist belegt; Poliform/Rimadesio/Agape nicht.
  assert.ok(isVerifiedDealerBrand("Minotti"));
  assert.ok(!isVerifiedDealerBrand("Poliform"));
  assert.ok(!isVerifiedDealerBrand("Rimadesio"));
  assert.ok(!isVerifiedDealerBrand("Agape"));
});

// --- Händler-Claims DE ------------------------------------------------------
// Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Minotti ist belegt → Beispiel für eine
// unbelegte Marke ist jetzt Rimadesio bzw. Poliform.
test("03 Rimadesio-Händler wird neutralisiert", () => {
  const out = sanitizeClaims("Ihr offizieller Rimadesio-Händler in Vorarlberg.");
  assert.equal(out, "Rimadesio in unserer Ausstellung in Lochau.");
});

test("04 Händler-Satz mit brandSlug ohne Markennamen", () => {
  const out = sanitizeClaims("Als autorisierter Händler beraten wir Sie gerne.", "poliform", { locale: "de" });
  assert.equal(out, "Poliform in unserer Ausstellung in Lochau.");
});

test("05 brandName-Option bestimmt die Schreibweise", () => {
  const out = sanitizeClaims("Wir sind Vertragspartner.", "paola-lenti", { locale: "de", brandName: "Paola Lenti" });
  assert.equal(out, "Paola Lenti in unserer Ausstellung in Lochau.");
});

test("06 ClassiCon-Händler bleibt stehen (Text)", () => {
  const s = "Wir sind offizieller ClassiCon-Händler.";
  assert.equal(sanitizeClaims(s), s);
  assert.equal(findClaims(s).length, 0);
});

test("07 ClassiCon-Händler bleibt stehen (brandSlug)", () => {
  const s = "Ihr offizieller Händler am Bodensee.";
  assert.equal(sanitizeClaims(s, "classicon"), s);
  assert.equal(hasDealerClaim(s, "classicon"), false);
});

test("08 'Offizielle Website' bleibt stehen", () => {
  const s = "Zur offiziellen Website von Minotti";
  assert.equal(sanitizeClaims(s, "minotti"), s);
  assert.equal(hasDealerClaim("Offizielle Website"), false);
});

test("09 'Offizielle Regeln' bleibt stehen", () => {
  const s = "Es gelten die offiziellen Regeln des Gewinnspiels von Poliform.";
  assert.equal(sanitizeClaims(s), s);
  assert.equal(hasDealerClaim("Offizielle Regeln"), false);
});

test("10 Flagship-Store einer Marke wird neutralisiert, Folgesatz bleibt", () => {
  const out = sanitizeClaims("Der Poliform Flagship-Store am See. Kommen Sie vorbei!", undefined, { locale: "de" });
  assert.equal(out, "Poliform in unserer Ausstellung in Lochau. Kommen Sie vorbei!");
});

test("11 ohne Marken-Kontext bleibt 'Händler' stehen", () => {
  const s = "Händler nennen öffentlich Lieferzeiten von 8 bis 10 Wochen.";
  assert.equal(sanitizeClaims(s), s);
  assert.equal(findClaims(s).length, 0);
});

// Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Rimadesio statt Minotti (unbelegt).
test("12 mehrere Händler-Sätze: neutral nur einmal", () => {
  const out = sanitizeClaims("Offizieller Rimadesio-Händler. Autorisierter Rimadesio-Partner. Wir freuen uns.", undefined, { locale: "de" });
  assert.equal(out, "Rimadesio in unserer Ausstellung in Lochau. Wir freuen uns.");
});

test("13 Meta-Wörter (Händlerverzeichnis, Händlerstatus) sind keine Claims", () => {
  assert.equal(findClaims("Minotti führt uns nicht im Händlerverzeichnis; kein Händlerstatus.").length, 0);
});

test("14 'offizieller Einstiegspreis' ist Herstellerangabe", () => {
  assert.equal(findClaims("Einen offiziellen Einstiegspreis veröffentlicht Minotti nicht.").length, 0);
});

// --- Händler-Claims EN/FR/IT ------------------------------------------------
test("15 EN: authorized Poliform dealer", () => {
  const out = sanitizeClaims("We are an authorized Poliform dealer.", undefined, { locale: "en" });
  assert.equal(out, "Poliform in our showroom in Lochau.");
  noDealerWords(out);
});

test("16 EN: official website bleibt", () => {
  const s = "Visit the official Minotti website";
  assert.equal(sanitizeClaims(s, "minotti"), s);
});

// Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Poliform statt Minotti (unbelegt).
test("17 FR: revendeur officiel Poliform", () => {
  const out = sanitizeClaims("Revendeur officiel Poliform au bord du lac.", undefined, { locale: "fr" });
  assert.equal(out, "Poliform dans notre showroom à Lochau.");
});

test("18 FR: site officiel bleibt", () => {
  const s = "Voir le site officiel de Minotti";
  assert.equal(sanitizeClaims(s, "minotti"), s);
});

// Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Rimadesio statt Minotti (unbelegt).
test("19 IT: rivenditore autorizzato Rimadesio", () => {
  const out = sanitizeClaims("Il più grande showroom. Rivenditore autorizzato Rimadesio.", undefined, { locale: "it" });
  assert.equal(out, "Un grande showroom. Rimadesio nel nostro showroom a Lochau.");
});

test("20 IT: sito ufficiale bleibt", () => {
  const s = "Visita il sito ufficiale di Minotti";
  assert.equal(sanitizeClaims(s, "minotti"), s);
});

// --- Superlative ------------------------------------------------------------
test("21 DE: 'größte' wird abgeschwächt", () => {
  assert.equal(sanitizeClaims("Die größte Minotti-Ausstellung der Region."), "Die große Minotti-Ausstellung der Region.");
});

test("22 DE: 'führende' wird 'renommierte'", () => {
  assert.equal(sanitizeClaims("Möbel führender Marken wie Minotti."), "Möbel renommierter Marken wie Minotti.");
});

test("23 DE: 'weiterführend' ist kein Superlativ", () => {
  const s = "Weiterführende Informationen finden Sie hier.";
  assert.equal(sanitizeClaims(s), s);
  assert.equal(findClaims(s).length, 0);
});

test("24 DE: 'einzigartig' wird 'besonders'", () => {
  assert.equal(sanitizeClaims("Sie träumen von einem einzigartigen Interieur?"), "Sie träumen von einem besonderen Interieur?");
  assert.equal(sanitizeClaims("Das ist einzigartig."), "Das ist besonders.");
});

test("25 DE: 'Nr. 1' entfernt den Satz", () => {
  assert.equal(sanitizeClaims("Wir sind die Nr. 1 für Designmöbel. Besuchen Sie uns."), "Besuchen Sie uns.");
});

test("26 EN: largest, leading, unique", () => {
  assert.equal(sanitizeClaims("The largest Poliform showroom on Lake Constance."), "A large Poliform showroom on Lake Constance.");
  assert.equal(sanitizeClaims("Leading Brands", undefined, { locale: "en" }), "Renowned Brands");
  assert.equal(sanitizeClaims("Dreaming of a unique interior?", undefined, { locale: "en" }), "Dreaming of a distinctive interior?");
});

test("27 EN: Tailwind 'leading-tight' ist kein Superlativ", () => {
  assert.equal(findClaims("mt-4 text-4xl leading-tight").length, 0);
});

test("28 EN: 'number one' entfernt den Satz", () => {
  assert.equal(sanitizeClaims("We are the number one for design. Visit us.", undefined, { locale: "en" }), "Visit us.");
});

test("29 FR: plus grande, unique, leader", () => {
  assert.equal(
    sanitizeClaims("Un intérieur unique. La plus grande exposition Minotti.", undefined, { locale: "fr" }),
    "Un intérieur remarquable. Une grande exposition Minotti.",
  );
  assert.equal(sanitizeClaims("Le leader du design.", undefined, { locale: "fr" }), "Le spécialiste du design.");
});

test("30 IT: unico/unica", () => {
  assert.equal(sanitizeClaims("Sogni un interno unico?", undefined, { locale: "it" }), "Sogni un interno speciale?");
  assert.equal(sanitizeClaims("Un'esperienza unica.", undefined, { locale: "it" }), "Un'esperienza speciale.");
});

test("31 Superlative auch bei ClassiCon", () => {
  assert.equal(sanitizeClaims("Die größte ClassiCon-Auswahl.", "classicon"), "Die große ClassiCon-Auswahl.");
});

test("32 Großschreibung am Satzanfang bleibt", () => {
  assert.equal(sanitizeClaims("Einzigartige Stücke."), "Besondere Stücke.");
});

// --- Hilfsfunktionen --------------------------------------------------------
test("33 neutralDealerText in 4 Sprachen (+ Fallback)", () => {
  assert.equal(neutralDealerText("Minotti", "de"), "Minotti in unserer Ausstellung in Lochau");
  assert.equal(neutralDealerText("Minotti", "en"), "Minotti in our showroom in Lochau");
  assert.equal(neutralDealerText("Minotti", "fr"), "Minotti dans notre showroom à Lochau");
  assert.equal(neutralDealerText("Minotti", "it"), "Minotti nel nostro showroom a Lochau");
  assert.equal(neutralDealerText("Minotti", "es"), "Minotti in unserer Ausstellung in Lochau");
  assert.equal(neutralDealerText("", "en"), "The brand in our showroom in Lochau");
});

test("34 hasDealerClaim", () => {
  assert.equal(hasDealerClaim("Ihr offizieller Händler in Vorarlberg"), true);
  assert.equal(hasDealerClaim("Your authorized dealer"), true);
  assert.equal(hasDealerClaim("Votre revendeur agréé"), true);
  assert.equal(hasDealerClaim("Il vostro rivenditore"), true);
  assert.equal(hasDealerClaim("Besuchen Sie unsere Ausstellung"), false);
  assert.equal(hasDealerClaim(""), false);
  assert.equal(hasDealerClaim(null), false);
});

test("35 splitSentences: Abkürzungen und Rundreise", () => {
  const text = "Zum Beispiel z. B. Minotti. Wir sind Nr. 1 nicht.\nNeue Zeile";
  const parts = splitSentences(text);
  assert.equal(parts.map((p) => p.text + p.sep).join(""), text);
  assert.equal(parts.length, 3);
});

test("36 leere und ungültige Eingaben", () => {
  assert.equal(sanitizeClaims(""), "");
  assert.equal(sanitizeClaims(undefined), "");
  assert.deepEqual(findClaims(42), []);
});

// --- Inhaber-Entscheidungen Nr. 19, 21, 22 (31.10.2026) -----------------------
test("37 Minotti-Studio-Aussage ist erlaubt und belegt (minotti.com)", () => {
  const s = "Minotti Studio by Platzhirsch Home Living – autorisierter Minotti-Händler in Lochau.";
  assert.equal(sanitizeClaims(s, "minotti", { locale: "de" }), s);
  assert.equal(hasDealerClaim(s, "minotti"), false);
  const entry = CLAIM_REGISTER.find((c) => c.brandSlug === "minotti");
  assert.equal(entry.evidenceUrl, "https://www.minotti.com/de/%C3%B6sterreichminotti-weiht-das-neue-minotti-studio-by-platzhirsch-home-living-ein");
  assert.match(entry.text, /Minotti Studio by Platzhirsch Home Living/);
});

test("38 Poliform und Rimadesio bleiben neutralisiert (4 Sprachen)", () => {
  for (const brand of ["Poliform", "Rimadesio"]) {
    assert.equal(sanitizeClaims(`Offizieller ${brand}-Händler am Bodensee.`, undefined, { locale: "de" }), `${brand} in unserer Ausstellung in Lochau.`);
    assert.equal(sanitizeClaims(`Authorized ${brand} dealer.`, undefined, { locale: "en" }), `${brand} in our showroom in Lochau.`);
    assert.equal(sanitizeClaims(`Revendeur officiel ${brand}.`, undefined, { locale: "fr" }), `${brand} dans notre showroom à Lochau.`);
    assert.equal(sanitizeClaims(`Rivenditore autorizzato ${brand}.`, undefined, { locale: "it" }), `${brand} nel nostro showroom a Lochau.`);
    assert.equal(hasDealerClaim(`Wir sind ${brand}-Händler.`), true);
  }
});

test("39 Bad-&-Wellness-Marken mit Liefervereinbarung: Händleraussage erlaubt", () => {
  const names = ["Starpool", "Soleum", "Fabio Alemanno", "Aquavia Spa", "Naggura", "Dornbracht", "antoniolupi"];
  for (const name of names) {
    const s = `Platzhirsch Home Living ist Händler von ${name}.`;
    assert.ok(isVerifiedDealerBrand(name), name);
    assert.equal(sanitizeClaims(s, undefined, { locale: "de" }), s, name);
    assert.equal(findClaims(s).length, 0, name);
  }
});

test("40 Agape bleibt ohne Händleraussage", () => {
  assert.ok(!isVerifiedDealerBrand("Agape"));
  assert.equal(sanitizeClaims("Wir sind Agape-Händler.", undefined, { locale: "de" }), "Agape in unserer Ausstellung in Lochau.");
  assert.equal(hasDealerClaim("Offizieller Agape-Partner", "agape"), true);
});

test("41 Händlersatz /bad-wellness: 7 Liefermarken „Händler“ (nicht „Vertragshändler“), nie Agape", () => {
  const list = ["Dornbracht", "antoniolupi", "Starpool", "Soleum", "Fabio Alemanno", "Aquavia Spa", "Naggura", "Agape"];
  const de = dealerStatementList(list, "de");
  assert.equal(de, "Platzhirsch Home Living ist Händler von Dornbracht, antoniolupi, Starpool, Soleum, Fabio Alemanno, Aquavia Spa und Naggura.");
  for (const l of ["de", "en", "fr", "it"]) {
    const s = dealerStatementList(list, l);
    assert.doesNotMatch(s, /Agape|Vertragshändler/, l);
    assert.deepEqual(findClaims(s, { locale: l }), [], l);
  }
  assert.equal(dealerStatement("Agape", "de"), "");
  assert.equal(dealerStatementList(["Agape", "Poliform"], "de"), "");
  // ClassiCon/Ezarri bleiben „Vertragshändler“.
  assert.equal(dealerStatementList(["classicon", "ezarri"], "de"), "Platzhirsch Home Living ist Vertragshändler von ClassiCon und Ezarri.");
});

test("42 Minotti: Studio-Wortlaut statt „Vertragshändler“, ohne Flächenangabe", () => {
  for (const l of ["de", "en", "fr", "it"]) {
    const s = dealerStatement("minotti", l);
    assert.match(s, /Minotti Studio by Platzhirsch Home Living/, l);
    assert.match(s, /2019/, l);
    assert.doesNotMatch(s, /m²|400|Vertragshändler|dealer|revendeur|rivenditore|offiziell|official/i, l);
  }
  assert.doesNotMatch(verifiedDealersSentence(), /Vertragshändler von [^.]*Minotti/);
});
