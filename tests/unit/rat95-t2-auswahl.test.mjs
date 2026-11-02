// Rat 9,5 (T2) B9 „Ihre Auswahl“ (Teilen im #Fragment, Texte in vier
// Sprachen) und A17 Wunschliste-Einstieg (Texte, keine Zusagen).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cleanItem, decodeSelection, encodeSelection, selectionShareUrl, shareFromHash, SHARE_MAX_ITEMS } from "../../src/components/CartPage/selectionShare.js";
import { selectionText } from "../../src/components/CartPage/selectionCopy.js";
import { landingText } from "../../src/components/Wunschliste/landingCopy.js";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
// Übernahme 30.10.2026: die Texte stehen in src/messages (cart.selection,
// wunschliste.landing); die Rückfall-Tabellen SELECTION_TEXT/LANDING_TEXT sind entfernt.
const MSG = Object.fromEntries(["de", "en", "fr", "it"].map((l) => [l, JSON.parse(read(`src/messages/${l}.json`))]));
const SELECTION_TEXT = Object.fromEntries(Object.entries(MSG).map(([l, m]) => [l, m.cart.selection]));
const LANDING_TEXT = Object.fromEntries(Object.entries(MSG).map(([l, m]) => [l, m.wunschliste.landing]));
const tr = (table) => (key, values) => key.split(".").reduce((o, k) => o[k], table).replace(/\{(\w+)\}/g, (m, k) => (values && k in values ? String(values[k]) : m));

const ITEMS = [
  { id: 1, produkte_id: 4711, name: "Twiggy", category: "Foscarini", href: "/de/produkte/lamps/lamps-2097-18", image: "/cmx/files/twiggy.jpg", quantity: 1 },
  { id: "e-2", name: "Ezarri Lux", category: "Ezarri", image: "/ezarri/lux.jpg" },
];

test("Teilen: Hin und zurück ohne Verlust, nur Produktdaten", () => {
  const code = encodeSelection(ITEMS);
  assert.match(code, /^[A-Za-z0-9_-]+$/);
  const back = decodeSelection(code);
  assert.equal(back.length, 2);
  assert.deepEqual(back[0], { id: 1, name: "Twiggy", category: "Foscarini", produkte_id: 4711, href: "/de/produkte/lamps/lamps-2097-18", image: "/cmx/files/twiggy.jpg" });
  assert.equal(back[1].href, undefined);
  assert.equal("quantity" in back[0], false);
  const url = selectionShareUrl({ origin: "https://platzhirsch.studio", pathname: "/de/merkliste", items: ITEMS });
  assert.ok(url.startsWith("https://platzhirsch.studio/de/merkliste#auswahl="));
  assert.equal(shareFromHash(new URL(url).hash), code);
  assert.equal(selectionShareUrl({ origin: "x", pathname: "/", items: [] }), "");
});

test("Teilen: fremde Links und Bilder, Skript-Text und zu viele Stücke werden abgewiesen", () => {
  assert.equal(cleanItem({ id: 1, name: "X", href: "https://evil.example/" }).href, undefined);
  assert.equal(cleanItem({ id: 1, name: "X", href: "//evil.example/" }).href, undefined);
  assert.equal(cleanItem({ id: 1, name: "X", image: "https://evil.example/a.jpg" }).image, undefined);
  assert.equal(cleanItem({ id: 1, name: "X", image: "/cmx/../../etc" }).image, undefined);
  assert.equal(cleanItem({ id: 1, name: "<script>alert(1)</script>" }).name.includes("<"), false);
  assert.equal(cleanItem({ name: "ohne id" }), null);
  assert.deepEqual(decodeSelection("kaputt!"), []);
  assert.deepEqual(decodeSelection(Buffer.from(JSON.stringify({ v: 2, i: [] })).toString("base64url")), []);
  const many = Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Stück ${i}` }));
  assert.equal(decodeSelection(encodeSelection(many)).length, SHARE_MAX_ITEMS);
  assert.equal(shareFromHash("#anders=1"), "");
});

test("Texte: vier Sprachen mit denselben Schlüsseln, aus den Messages", () => {
  const keys = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${p}${k}.`) : [`${p}${k}`])).sort();
  for (const table of [SELECTION_TEXT, LANDING_TEXT]) {
    const de = keys(table.de);
    for (const l of ["en", "fr", "it"]) assert.deepEqual(keys(table[l]), de, l);
  }
  assert.equal(selectionText((k) => `msg:${k}`, "de", "share"), "msg:selection.share");
  assert.equal(selectionText(tr(MSG.fr.cart), "fr", "print"), "Imprimer ou enregistrer en PDF");
  assert.equal(selectionText(tr(MSG.de.cart), "de", "tabs.ideas"), "Ideen");
  assert.equal(landingText(tr(MSG.de.wunschliste), "de", "retention", { months: 12 }), "Nach dem Anlass bleibt die Liste 12 Monate erreichbar, danach löschen wir sie.");
});

test("Stimme: keine Superlative, keine Preise, keine Antwortzeit-Zusage", () => {
  const all = JSON.stringify([SELECTION_TEXT, LANDING_TEXT]);
  assert.doesNotMatch(all, /beste|exklusiv|Luxus|Traum|kostenlos|gratis|innerhalb von \d|€|\bEUR\b|!/i);
});

test("B9: eine Überschrift, Reiter, drei Wege, Druck; A17: Seite existiert", () => {
  const cart = read("src/components/CartPage/CartPage.js");
  assert.doesNotMatch(cart, /<Heading level=\{2\} size="display-m">\s*\{tc\("selection\.title"\)\}/);
  assert.match(cart, /<SelectionTabs active="stuecke"/);
  assert.equal((cart.match(/data-selection-way="/g) || []).length, 3);
  assert.match(cart, /window\.print\(\)/);
  assert.match(read("src/components/Pinterest/IdeenboardPage.js"), /<SelectionTabs active="ideen"/);
  const wl = read("src/app/[locale]/wunschliste/page.js");
  assert.match(wl, /wunschlisteAvailable\(\)/);
  assert.match(wl, /contributionChannel\(voucherMode\(\)\) !== "aus"/);
});
