// lead-mobil-i18n fix-01: „Termin mit diesem Plan“ mit aktivem Kalender.
// /termin kürzt ?produkt= auf 120 Zeichen – der Plan-Link darf dort nicht als
// halbe URL im Anliegen landen; er geht vollständig als ?plan= mit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { TERMIN_PRODUKT_MAX, handoffHref } from "../../src/lib/sofaplaner/handoff.js";
import { cleanText } from "../../src/lib/forms/beratungContext.js";

// echtes Token-Format: 16 Zeichen Id + "." + 22 Zeichen HMAC (server/store.js)
const SP = "https://platzhirsch.studio/de/sofaplaner?p=" + "a".repeat(16) + "." + "b".repeat(22);

test("Kalender: ?plan= vollständig, ?produkt= ohne (abgeschnittenen) Link und ≤ 120", () => {
  for (const name of ["Lounge", "Freeman Duvet Sofa – Wohnzimmer Ecke Fenster", "x".repeat(300)]) {
    const u = new URL(handoffHref({ locale: "de", name, count: 7, shareUrl: SP, calendar: true }), "https://platzhirsch.studio");
    assert.equal(u.pathname, "/de/termin");
    assert.equal(u.searchParams.get("plan"), SP);
    const produkt = u.searchParams.get("produkt");
    assert.ok(produkt.length <= TERMIN_PRODUKT_MAX, produkt);
    assert.doesNotMatch(produkt, /https?:/);
    // was /termin daraus macht, ist unverändert derselbe Text
    assert.equal(cleanText(produkt, 120), produkt);
  }
});

test("ohne Kalender (Beratung) bleibt der Link in ?produkt= (BeratungClient, 200 Zeichen)", () => {
  const u = new URL(handoffHref({ locale: "de", name: "Lounge", count: 4, shareUrl: SP }), "https://platzhirsch.studio");
  assert.equal(u.pathname, "/de/beratung");
  assert.ok(u.searchParams.get("produkt").endsWith(SP));
  assert.equal(u.searchParams.get("plan"), SP);
});

test("EN mit Kalender: englischer Kopf, Link nur als ?plan=", () => {
  const u = new URL(handoffHref({ locale: "en", name: "Lounge", count: 1, shareUrl: SP.replace("/de/", "/en/"), calendar: true }), "https://platzhirsch.studio");
  assert.equal(u.pathname, "/en/termin");
  assert.match(u.searchParams.get("produkt"), /1 element$/);
});
