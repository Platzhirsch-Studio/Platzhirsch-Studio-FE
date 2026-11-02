// tests/unit/newsletter-archiv.test.mjs — Welle 2, Newsletter „Post aus Lochau“.
// Run: node --test tests/unit/newsletter-archiv.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { AUSGABEN } from "../../src/lib/kundenbetreuung/newsletter/ausgaben.js";
import {
  archivAusgaben,
  ausgabeMailHtml,
  blockSichtbar,
  inhaltZeile,
  offeneSlots,
  sichtbareBloecke,
  versandbereit,
} from "../../src/lib/kundenbetreuung/newsletter/newsletter.js";

test("drei Ausgaben mit Brief, beiden Slots, Terminen", () => {
  assert.equal(AUSGABEN.length, 3);
  for (const a of AUSGABEN) {
    const typen = a.bloecke.map((b) => b.typ);
    for (const t of ["brief", "neueStuecke", "skizze", "termine"]) assert.ok(typen.includes(t), `${a.slug}: ${t}`);
  }
});

test("leere Slots rendern nie (keine erfundenen Stücke, keine KI-Skizzen)", () => {
  for (const a of AUSGABEN) {
    const sichtbar = sichtbareBloecke(a).map((b) => b.typ);
    assert.ok(!sichtbar.includes("neueStuecke") && !sichtbar.includes("skizze"), a.slug);
    assert.deepEqual(offeneSlots(a), ["neueStuecke", "skizze"]);
    const html = ausgabeMailHtml(a);
    assert.doesNotMatch(html, /Haralds Skizze des Monats|Neu in der Ausstellung/, a.slug);
  }
  // Bild nur aus /newsletter/ (eigene Dateien), mit Alt-Text
  assert.equal(blockSichtbar({ typ: "skizze", bild: { src: "https://example.com/x.jpg", alt: "x" }, text: "t" }), false);
  assert.equal(blockSichtbar({ typ: "skizze", bild: { src: "/newsletter/2026-11/skizze.jpg", alt: "" }, text: "t" }), false);
  assert.equal(blockSichtbar({ typ: "skizze", bild: { src: "/newsletter/2026-11/skizze.jpg", alt: "Handskizze Wohnzimmer" }, text: "t" }), true);
});

test("versandbereit erst mit gefülltem Slot; Archiv nur versendete", () => {
  for (const a of AUSGABEN) assert.equal(versandbereit(a), false, a.slug);
  assert.deepEqual(archivAusgaben(), []);
  assert.equal(archivAusgaben(undefined, { vorschau: true }).length, 3);
  const gefuellt = {
    ...AUSGABEN[0],
    versendetAm: "2026-11-05",
    bloecke: AUSGABEN[0].bloecke.map((b) =>
      b.typ === "skizze" ? { ...b, bild: { src: "/newsletter/2026-11/skizze.jpg", alt: "Handskizze eines Wohnraums" }, text: "Erste Skizze." } : b
    ),
  };
  assert.equal(versandbereit(gefuellt), true);
  assert.deepEqual(archivAusgaben([gefuellt, AUSGABEN[1]]).map((a) => a.slug), ["2026-11"]);
  assert.match(inhaltZeile(gefuellt), /Haralds Skizze des Monats/);
  assert.match(ausgabeMailHtml(gefuellt), /\/newsletter\/2026-11\/skizze\.jpg/);
});

test("Termine nur mit echtem Datum (Adventsabend 26.11.2026 aus event.js)", () => {
  const t = AUSGABEN[0].bloecke.find((b) => b.typ === "termine");
  assert.equal(t.eintraege[0].datum, "2026-11-26");
  assert.equal(blockSichtbar({ typ: "termine", eintraege: [{ datum: "", titel: "x" }] }), false);
});

test("Mail-Fassung: Fußzeile A mit Abmeldelink, UTM, ein Knopf, kein Ausrufezeichen", () => {
  for (const a of AUSGABEN) {
    const html = ausgabeMailHtml(a);
    assert.match(html, /\{\{ abmelde_url \}\}/);
    assert.match(html, /utm_source=newsletter/);
    assert.ok((html.match(/margin:8px 0 24px/g) || []).length <= 1, `${a.slug}: höchstens ein Knopf`);
    assert.doesNotMatch(html.replace(/<!doctype html>/i, ""), /[a-zäöü]!\s/i);
    assert.match(html, /Landstraße 11/);
  }
});
