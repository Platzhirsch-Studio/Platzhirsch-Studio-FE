// tests/unit/r5-commerce.test.mjs — R5-commerce (AP9 hinter Schalter):
// Schalter, APIs im Modus off/anfrage, Preisregeln, Atelier-CSV mit zod-
// Fehlerzeilen, JSON-LD nur bei echten Daten, Gutscheinbedingungen-Entwurf.
// Run: node --test tests/unit/r5-commerce.test.mjs
// Kein Netz: fetch ist immer ein Mock, nichts geht ans Backoffice.
// Die Atelier-Daten unten sind TESTDATEN und stehen nur hier, nie auf der Seite.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { atelierEnabled, atelierMode, commercePreviewEnabled, voucherEnabled, voucherMode } from "../../src/lib/commerce/mode.js";
import { DELIVERY_NOTE, LOCATION_NOTE, VAT_NOTE, formatEuro, priceDisplay, priceTextIssues, uvpNote } from "../../src/lib/commerce/priceRules.js";
import { loadAtelier, parseAtelierCsv, parseCsv, parseEuro, resetAtelierCache, visibleItems } from "../../src/lib/commerce/atelierSource.js";
import { atelierJsonLd } from "../../src/lib/commerce/offerSchema.js";
import { AMOUNT_PRESETS, voucherSchema, voucherToBackoffice } from "../../src/lib/commerce/voucher.js";
import { reservationSchema } from "../../src/lib/commerce/reservation.js";
import { reservationHandler, voucherHandler } from "../../src/lib/commerce/handlers.js";
import { TERMS_SECTIONS, termsOpenCounts } from "../../src/lib/commerce/voucherTerms.js";
import { withOrigin } from "../../src/lib/commerce/client.js";
import { HERKUNFT_TITLE } from "../../src/lib/forms/leadPayload.js";
import { createRateLimiter } from "../../src/lib/forms/rateLimit.js";
import { findClaims } from "../../src/lib/legal/claims.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NOW = 1_800_000_000_000;
const SHEET = "https://docs.example.invalid/atelier.csv";
let ip = 0;
const freshIp = () => `198.51.100.${++ip}`;

function req(body, url = "http://localhost/api/x") {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": freshIp() },
    body: JSON.stringify(body),
  });
}

function mockFetch(answer = { status: 200, body: { message: { name: "KF-1" } } }) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, body: init?.body ? JSON.parse(init.body) : null });
    return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { "Content-Type": "application/json" } });
  };
  fn.calls = calls;
  return fn;
}

const csvFetch = (text, status = 200) => {
  const fn = async (url, init) => {
    fn.calls.push({ url, init });
    return new Response(text, { status });
  };
  fn.calls = [];
  return fn;
};

// ---------- TESTDATEN (nur hier) ----------
const HEADER = "slug,titel,marke,kategorie,preis_eur,zustand,masse,status,foto_url,foto_alt,uvp_eur,uvp_stand,uvp_quelle";
const ROW_OK = 'test-sofa,Testsofa Drei,Testmarke,Sofas,"2.490",Leichte Sitzspuren am linken Kissen,B 240 × T 100 cm,verfuegbar,/atelier/test-sofa.jpg,Testsofa in Grau,"4.980",2026-10-01,Preisliste Testmarke 2026';
const ROW_RESERVED = "test-tisch,Testtisch,,Tische,1290,Kleiner Kratzer an der Kante,,reserviert,,,,,";
const ROW_SOLD = "test-leuchte,Testleuchte,,Leuchten,390,Ohne Originalverpackung,,verkauft,,,,,";
const ROW_BAD_PRICE = "test-kaputt,Kaputte Zeile,,,keinpreis,Zustand ist beschrieben,,verfuegbar,,,,,";
const ROW_STATT = "test-statt,Sessel statt 3000,,,900,Zustand ist beschrieben,,verfuegbar,,,,,";
const ROW_UVP_NO_SOURCE = "test-uvp,Hocker,,,200,Zustand ist beschrieben,,verfuegbar,,,400,,";
const ROW_WIE_NEU = "test-neu,Liege,,,500,Wie neu und kaum benutzt,,verfuegbar,,,,,";
const CSV = [HEADER, ROW_OK, ROW_RESERVED, ROW_SOLD, ROW_BAD_PRICE, ROW_STATT, ROW_UVP_NO_SOURCE, ROW_WIE_NEU].join("\r\n");

const VOUCHER = {
  betrag: 100,
  anzahl: 2,
  motiv: "seelicht",
  empfaenger: "Erika",
  grusstext: "Alles Gute",
  firma: "Muster GmbH",
  name: "Max Muster",
  email: "max@example.com",
  telefon: "",
  anmerkung: "",
};

// ---------- Schalter ----------

test("Schalter: Standard off, nur 'anfrage' schaltet ein, stripe_link ist in Welle 1 aus", () => {
  assert.equal(voucherMode({}), "off");
  assert.equal(atelierMode({}), "off");
  assert.equal(voucherMode({ VOUCHER_MODE: "anfrage" }, "freigegeben"), "anfrage");
  assert.equal(voucherMode({ VOUCHER_MODE: " ANFRAGE " }, "freigegeben"), "anfrage");
  assert.equal(voucherMode({ VOUCHER_MODE: "stripe_link" }), "off");
  assert.equal(atelierMode({ ATELIER_MODE: "on" }), "off");
  assert.equal(voucherEnabled({}), false);
  assert.equal(atelierEnabled({ ATELIER_MODE: "anfrage" }), true);
});

test("Vorschau: Entwicklung oder COMMERCE_PREVIEW=1, nie auf Vercel-Produktion", () => {
  assert.equal(commercePreviewEnabled({ NODE_ENV: "development" }), true);
  assert.equal(commercePreviewEnabled({ NODE_ENV: "production" }), false);
  assert.equal(commercePreviewEnabled({ NODE_ENV: "production", COMMERCE_PREVIEW: "1" }), true);
  assert.equal(commercePreviewEnabled({ NODE_ENV: "production", COMMERCE_PREVIEW: "1", VERCEL_ENV: "production" }), false);
});

test("API Modus off: 404, kein Backoffice-Aufruf, auch bei gültiger Anfrage", async () => {
  const backoffice = mockFetch();
  const POST = voucherHandler({ env: {}, fetchImpl: backoffice, limiter: createRateLimiter(), now: () => NOW });
  const res = await POST(req(VOUCHER));
  assert.equal(res.status, 404);
  assert.equal(backoffice.calls.length, 0);

  const sheet = csvFetch(CSV);
  const POST2 = reservationHandler({ env: { ATELIER_CSV_URL: SHEET }, fetchImpl: backoffice, sourceFetch: sheet, limiter: createRateLimiter(), now: () => NOW });
  const res2 = await POST2(req({ stueck: "test-sofa", name: "Max", email: "max@example.com", weg: "abholung" }));
  assert.equal(res2.status, 404);
  assert.equal(sheet.calls.length, 0, "Sheet wird im Modus off nicht gelesen");
  assert.equal(backoffice.calls.length, 0);
});

test("Seiten und Routen: Schalter vor allem anderen, keine Einträge in Navigation, Sitemap, llms", () => {
  const files = [
    "src/app/[locale]/gutscheine/page.js",
    "src/app/[locale]/gutscheinbedingungen/page.js",
    "src/app/[locale]/atelierverkauf/page.js",
    "src/app/[locale]/atelierverkauf/[slug]/page.js",
  ];
  for (const f of files) {
    const src = fs.readFileSync(path.join(ROOT, f), "utf8");
    assert.match(src, /notFound\(\)/, f);
    assert.match(src, /await connection\(\)/, `${f}: Schalter zur Anfragezeit`);
    assert.match(src, /(voucherEnabled|atelierEnabled|itemFor)\(/, f);
  }
  const preview = fs.readFileSync(path.join(ROOT, "src/app/[locale]/preview/commerce/page.js"), "utf8");
  assert.match(preview, /robots: NOINDEX/);
  // 03.11.2026 (Nr. 46): Gutscheinverkauf freigegeben, Banner nennt den Beleg und den offenen Steuerberater-Punkt.
  assert.match(preview, /Gutscheinverkauf vom Inhaber freigegeben \(Entscheidung Nr\. 46, 03\.11\.2026\)/);
  assert.match(preview, /Steuerberater bestätigt Mehrzweckgutschein noch/);
  assert.doesNotMatch(preview, /Insolvenzrechtler\/Steuerberater offen|anwaltlich prüfen/);
  assert.match(preview, /commercePreviewEnabled\(\)/);
  // Kein Link in Navigation, Sitemap oder llms (Integrator nach Freigabe).
  const scan = ["src/lib/seo", "src/components/Navbar", "src/app/llms.txt", "src/app/sitemap.xml"];
  for (const dir of scan) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    const walk = (p) => (fs.statSync(p).isDirectory() ? fs.readdirSync(p).flatMap((n) => walk(path.join(p, n))) : [p]);
    for (const file of walk(abs).filter((p) => /\.(js|mjs|json)$/.test(p))) {
      const src = fs.readFileSync(file, "utf8");
      assert.doesNotMatch(src, /\/(gutscheine|gutscheinbedingungen|atelierverkauf)\b/, `${path.relative(ROOT, file)} verlinkt Commerce`);
    }
  }
});

// ---------- Gutschein-Anfrage ----------

test("Gutschein: Vorschläge 50/100/250/500/1.000 €, Betrag ab 25 €, ganze Euro", () => {
  assert.deepEqual([...AMOUNT_PRESETS], [50, 100, 250, 500, 1000]);
  assert.equal(voucherSchema.safeParse({ ...VOUCHER, betrag: 25 }).success, true);
  assert.equal(voucherSchema.safeParse({ ...VOUCHER, betrag: "1000" }).success, true);
  const low = voucherSchema.safeParse({ ...VOUCHER, betrag: 24 });
  assert.equal(low.success, false);
  assert.equal(low.error.issues[0].path[0], "betrag");
  assert.equal(voucherSchema.safeParse({ ...VOUCHER, betrag: 25.5 }).success, false);
  assert.equal(voucherSchema.safeParse({ ...VOUCHER, motiv: "gold" }).success, false);
  assert.equal(voucherSchema.safeParse({ ...VOUCHER, anzahl: 0 }).success, false);
  // Unbekannte Felder (z. B. ein Preis vom Browser) fallen weg.
  const parsed = voucherSchema.parse({ ...VOUCHER, preis: 1, zahlung: "stripe" });
  assert.equal("preis" in parsed, false);
  assert.equal("zahlung" in parsed, false);
});

test("Gutschein Modus anfrage: guardForm, Text an das Kontakt-Backoffice, ohne Zahlungsversprechen", async () => {
  const backoffice = mockFetch();
  const POST = voucherHandler({ env: { VOUCHER_MODE: "anfrage" }, termsStatus: "freigegeben", fetchImpl: backoffice, limiter: createRateLimiter(), now: () => NOW });
  const body = withOrigin(VOUCHER, "anmerkung", { attribution: {}, locale: "de", device: "mobil", leadRef: "0b6c3f5e-1d2a-4c3b-8a9f-0123456789ab" });
  const res = await POST(req({ ...body, website: "", _t: 9000 }));
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(backoffice.calls.length, 1);
  const sent = backoffice.calls[0].body;
  assert.deepEqual(Object.keys(sent).sort(), ["company", "email_address", "ihre_nachricht", "name", "telefon"]);
  assert.match(sent.ihre_nachricht, /Gutschein-Anfrage/);
  assert.match(sent.ihre_nachricht, /Wert je Gutschein: 100 €/);
  assert.match(sent.ihre_nachricht, /Gesamtwert: 200 €/);
  assert.match(sent.ihre_nachricht, /Motiv: Seelicht/);
  assert.match(sent.ihre_nachricht, /Firmengeschenk: Muster GmbH/);
  assert.ok(sent.ihre_nachricht.includes(HERKUNFT_TITLE), "Herkunftsblock aus src/lib/forms");
  assert.match(sent.ihre_nachricht, /keine Zahlung/);
  assert.equal("lead_ref" in sent, false);
  assert.equal("website" in sent, false);
});

test("Gutschein: Honeypot → Schein-Erfolg ohne Weiterleitung; ungültig → 400 mit Feld", async () => {
  const backoffice = mockFetch();
  const POST = voucherHandler({ env: { VOUCHER_MODE: "anfrage" }, termsStatus: "freigegeben", fetchImpl: backoffice, limiter: createRateLimiter(), now: () => NOW });
  const fake = await POST(req({ ...VOUCHER, website: "spam" }));
  assert.equal(fake.status, 200);
  assert.equal(backoffice.calls.length, 0);
  const bad = await POST(req({ ...VOUCHER, betrag: 10 }));
  assert.equal(bad.status, 400);
  const json = await bad.json();
  assert.equal(json.field, "betrag");
  assert.equal(backoffice.calls.length, 0);
});

test("Gutschein: Backoffice-Fehler → 502 ohne Details", async () => {
  const backoffice = mockFetch({ status: 500, body: { exc: "Traceback geheim" } });
  const POST = voucherHandler({ env: { VOUCHER_MODE: "anfrage" }, termsStatus: "freigegeben", fetchImpl: backoffice, limiter: createRateLimiter(), now: () => NOW });
  const res = await POST(req(VOUCHER));
  assert.equal(res.status, 502);
  assert.doesNotMatch(await res.text(), /Traceback/);
});

test("voucherToBackoffice: keine Zahlungs-, Liefer- oder Sicherungsversprechen", () => {
  const text = voucherToBackoffice(voucherSchema.parse(VOUCHER)).ihre_nachricht;
  assert.doesNotMatch(text, /abgesichert|bezahlt|Rechnung folgt|innerhalb von 24/i);
});

// ---------- Preisregeln ----------

test("Preisregeln: Pflichtzusätze inkl. USt, Lieferung nach Aufwand, Standort Lochau", () => {
  const p = priceDisplay({ preis: 2490 });
  assert.equal(p.price, "2.490 €");
  assert.deepEqual(p.notes, [VAT_NOTE, DELIVERY_NOTE, LOCATION_NOTE]);
  assert.equal(VAT_NOTE, "inkl. USt");
  assert.equal(DELIVERY_NOTE, "zzgl. Lieferung nach Aufwand");
  assert.match(LOCATION_NOTE, /Lochau/);
  assert.equal(p.uvp, null);
  assert.equal(priceDisplay({ preis: 0 }), null);
  assert.equal(priceDisplay({}), null);
  assert.equal(formatEuro(89.5), "89,50 €");
  assert.equal(formatEuro(1000000), "1.000.000 €");
});

test("Preisregeln: UVP nur mit Betrag, Stand und Quelle; nie 'statt' oder Prozent", () => {
  assert.equal(uvpNote({ uvp: 4980 }), null);
  assert.equal(uvpNote({ uvp: 4980, uvpStand: "2026-10-01" }), null);
  assert.equal(uvpNote({ uvp: 4980, uvpQuelle: "Preisliste" }), null);
  assert.equal(uvpNote({ uvp: 4980, uvpStand: "2026-13-01", uvpQuelle: "Preisliste" }), null);
  const note = uvpNote({ uvp: 4980, uvpStand: "2026-10-01", uvpQuelle: "Preisliste 2026" });
  assert.equal(note, "Unverbindliche Preisempfehlung des Herstellers für Neuware: 4.980 € (Stand 01.10.2026, Quelle: Preisliste 2026)");
  const all = JSON.stringify(priceDisplay({ preis: 2490, uvp: 4980, uvpStand: "2026-10-01", uvpQuelle: "Preisliste" }));
  assert.doesNotMatch(all, /statt|%|Rabatt|sparen|reduziert/i);
});

test("Preisregeln: verbotene Formulierungen werden erkannt", () => {
  assert.deepEqual(priceTextIssues("Leichte Sitzspuren"), []);
  assert.ok(priceTextIssues("statt 3.000 €").includes("statt"));
  assert.ok(priceTextIssues("−40 %").includes("prozent"));
  assert.ok(priceTextIssues("bis zu 60 Prozent").includes("bis-zu"));
  assert.ok(priceTextIssues("wie neu").includes("wie-neu"));
  assert.ok(priceTextIssues("Anzahlung abgesichert").includes("abgesichert"));
  assert.ok(priceTextIssues("nur noch 1 Stück").includes("knappheit"));
  // "Stattlich" ist kein "statt".
  assert.deepEqual(priceTextIssues("Ein stattlicher Tisch"), []);
});

// ---------- Atelier-CSV (zod) ----------

test("CSV-Leser: Anführungszeichen, Kommas, Zeilenumbruch im Feld, Semikolon", () => {
  assert.deepEqual(parseCsv('a,b\n"1,5","x ""y"""\n'), [["a", "b"], ["1,5", 'x "y"']]);
  assert.deepEqual(parseCsv('a;b\r\n"z\nz";2'), [["a", "b"], ["z\nz", "2"]]);
  assert.equal(parseEuro("2.490"), 2490);
  assert.equal(parseEuro("1290,50 €"), 1290.5);
  assert.ok(Number.isNaN(parseEuro("keinpreis")));
});

test("zod-Fehlerzeilen: übersprungen und protokolliert, die Liste bricht nicht", () => {
  const logs = [];
  const { items, skipped } = parseAtelierCsv(CSV, { log: (m) => logs.push(m) });
  assert.deepEqual(items.map((i) => i.slug), ["test-sofa", "test-tisch", "test-leuchte"]);
  assert.deepEqual(
    skipped.map((s) => [s.line, s.field]),
    [
      [5, "preis_eur"],
      [6, "titel"],
      [7, "uvp_eur"],
      [8, "zustand"],
    ]
  );
  assert.equal(logs.length, 4);
  assert.match(logs[0], /^Zeile 5 übersprungen \(preis_eur/);
  // Protokoll ohne Inhalte aus dem Sheet.
  assert.ok(logs.every((m) => !/Kaputte Zeile|Sessel|Hocker|Liege/.test(m)));
  assert.deepEqual(visibleItems(items).map((i) => i.slug), ["test-sofa"]);
});

test("loadAtelier: ohne URL Leerzustand ohne Anfrage; Sheet-Ausfall → zuletzt gute Version", async () => {
  resetAtelierCache();
  const never = csvFetch(CSV);
  const empty = await loadAtelier({ env: {}, fetchImpl: never });
  assert.equal(empty.state, "empty");
  assert.deepEqual(empty.items, []);
  assert.equal(never.calls.length, 0);
  assert.equal((await loadAtelier({ env: { ATELIER_CSV_URL: "http://unsicher.invalid/x.csv" }, fetchImpl: never })).state, "empty");

  const ok = csvFetch(CSV);
  const first = await loadAtelier({ env: { ATELIER_CSV_URL: SHEET }, fetchImpl: ok, log: () => {} });
  assert.equal(first.state, "ok");
  assert.deepEqual(first.items.map((i) => i.slug), ["test-sofa"]);
  assert.deepEqual(ok.calls[0].init.next, { revalidate: 3600, tags: ["atelier"] });

  const down = csvFetch("", 503);
  const stale = await loadAtelier({ env: { ATELIER_CSV_URL: SHEET }, fetchImpl: down, log: () => {} });
  assert.equal(stale.state, "stale");
  assert.deepEqual(stale.items.map((i) => i.slug), ["test-sofa"]);

  resetAtelierCache();
  const error = await loadAtelier({ env: { ATELIER_CSV_URL: SHEET }, fetchImpl: down, log: () => {} });
  assert.equal(error.state, "error");
  assert.deepEqual(error.items, []);
  resetAtelierCache();
});

// ---------- JSON-LD ----------

test("JSON-LD Product/Offer nur bei echten, verfügbaren Daten; ohne Bewertung und Vergleichspreis", () => {
  const { items } = parseAtelierCsv(CSV, { log: () => {} });
  const sofa = items.find((i) => i.slug === "test-sofa");
  const ld = atelierJsonLd(sofa);
  assert.equal(ld["@type"], "Product");
  assert.equal(ld.offers.price, "2490.00");
  assert.equal(ld.offers.priceCurrency, "EUR");
  assert.equal(ld.offers.availability, "https://schema.org/InStock");
  assert.equal(ld.image[0], "https://platzhirsch.studio/atelier/test-sofa.jpg");
  assert.equal("aggregateRating" in ld, false);
  assert.equal("review" in ld, false);
  assert.doesNotMatch(JSON.stringify(ld), /statt|4980|offizieller|Händler/i);
  // Reserviert / ohne Sheet-Herkunft / Platzhalter → kein Schema.
  assert.equal(atelierJsonLd(items.find((i) => i.slug === "test-tisch")), null);
  assert.equal(atelierJsonLd({ ...sofa, origin: undefined }), null);
  assert.equal(atelierJsonLd({ slug: "x", titel: "Platzhalter", preis: 100, status: "verfuegbar" }), null);
  assert.equal(atelierJsonLd(null), null);
});

// ---------- Reservierung ----------

test("Reservierung Modus anfrage: Stück aus dem Sheet, Preis vom Server, keine Anzahlung", async () => {
  resetAtelierCache();
  const backoffice = mockFetch();
  const env = { ATELIER_MODE: "anfrage", ATELIER_CSV_URL: SHEET };
  const POST = reservationHandler({ env, fetchImpl: backoffice, sourceFetch: csvFetch(CSV), limiter: createRateLimiter(), now: () => NOW });
  const res = await POST(req({ stueck: "test-sofa", name: "Max Muster", email: "max@example.com", weg: "lieferung", plz_ort: "6900 Bregenz", besichtigung: true, preis: 1 }));
  assert.equal(res.status, 200);
  const text = backoffice.calls[0].body.ihre_nachricht;
  assert.match(text, /Reservierungsanfrage/);
  assert.match(text, /Testsofa Drei/);
  assert.match(text, /2\.490 €/);
  assert.match(text, /noch nicht reserviert/);
  assert.match(text, /Lieferung nach 6900 Bregenz/);
  assert.doesNotMatch(text, /abgesichert|Anzahlung/i);

  // Reserviertes oder unbekanntes Stück → 400 stueck, nichts ans Backoffice.
  for (const stueck of ["test-tisch", "gibt-es-nicht"]) {
    const r = await POST(req({ stueck, name: "Max Muster", email: "max@example.com", weg: "abholung" }));
    assert.equal(r.status, 400);
    assert.equal((await r.json()).field, "stueck");
  }
  assert.equal(backoffice.calls.length, 1);
  assert.equal(reservationSchema.safeParse({ stueck: "x", name: "Max", email: "max@example.com", weg: "versand" }).success, false);
  resetAtelierCache();
});

// ---------- Gutscheinbedingungen-Entwurf ----------

test("Gutscheinbedingungen: unbefristet, Teileinlösung, keine Barablöse, keine Marker mehr (03.11.2026), kein OS-Link", () => {
  const text = TERMS_SECTIONS.flatMap((s) => s.paragraphs).join("\n");
  assert.match(text, /unbefristet gültig/);
  assert.match(text, /30 Jahren \(§ 1478 ABGB\)/);
  assert.match(text, /Teilbeträgen eingelöst/);
  assert.match(text, /Auszahlung des Gutscheinwerts in bar oder per Überweisung ist ausgeschlossen/);
  assert.match(text, /14 Tagen/);
  // Inhaber-Entscheidungen Nr. 17 (Café), 38 (Aussteller), 40/45 (Schlichtung), 46 (online, Mehrzweck)
  assert.match(text, /MW Immobilienverwaltungs GmbH, FN 443753 d, Landesgericht Feldkirch, UID ATU70035339/);
  assert.match(text, /Mehrzweckgutschein/);
  assert.match(text, /Bestellungen in unserem Onlineshop/);
  assert.match(text, /Café, Restaurant & Bar können sie nicht eingelöst werden/);
  assert.match(text, /Verbraucherschlichtungsstelle nehmen wir nicht teil/);
  assert.doesNotMatch(text, /\[[^\]]+\]/, "keine eckigen Klammern im freigegebenen Text");
  assert.deepEqual(Object.values(termsOpenCounts()), [0, 0, 0]);
  assert.doesNotMatch(text, /Online-Streitbeilegung|ec\.europa\.eu\/consumers\/odr|abgesichert/i);
  assert.doesNotMatch(text, /gültig (1|ein|3|drei) Jahr/i);
});

// ---------- Claims ----------

test("Commerce-Texte: keine Händler-Behauptungen, keine Superlative, kein 'abgesichert'", () => {
  const dirs = ["src/lib/commerce", "src/components/Gutschein", "src/components/Atelier", "src/app/[locale]/preview/commerce", "src/app/[locale]/gutscheine", "src/app/[locale]/atelierverkauf"];
  const walk = (p) => (fs.statSync(p).isDirectory() ? fs.readdirSync(p).flatMap((n) => walk(path.join(p, n))) : [p]);
  for (const dir of dirs) {
    for (const file of walk(path.join(ROOT, dir))) {
      const code = fs
        .readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      assert.deepEqual(findClaims(code), [], path.relative(ROOT, file));
      // Regex-Listen in priceRules.js nennen die verbotenen Wörter selbst.
      if (!file.endsWith("priceRules.js")) assert.doesNotMatch(code, /abgesichert/i, path.relative(ROOT, file));
    }
  }
});
