// Crawl 01.11.2026 (ezarri-yacht): EN-Ezarri-Links auf rein deutsche Seiten
// zeigen direkt auf /de/… statt über die Weiterleitung /en/… → /de/…?lang=en.
import { test } from "node:test";
import assert from "node:assert/strict";
import { deLinkProps, isDeOnlyHref } from "../../src/lib/ezarri/deLinks.js";
import * as EN from "../../src/lib/ezarri/copy.en.js";

test("rein deutsche Ziele der Ezarri-Welt werden erkannt", () => {
  // Sprach-Integration 01.11.2026 (bewusst geändert): Küchen, Outdoor, Interior,
  // Einkaufen aus der Schweiz und Stil-Finder sind viersprachig – nicht mehr „nur Deutsch“.
  for (const href of ["/bodensee-licht?szene=pool", "/3d-ansicht", "/projekte/x", "/regionen"]) {
    assert.equal(isDeOnlyHref(href), true, href);
  }
  for (const href of ["/", "/ezarri", "/ezarri/pool", "/hotel-objekt", "/arbeitsweise", "/consultation?thema=ezarri", "/kuechenplaner/druck", "/kuechen-vorarlberg", "/outdoor-gartenplanung", "/interior-design-vorarlberg", "/einkaufen-aus-der-schweiz", "/stil-finder/quiz", "https://x.y/kuechen-vorarlberg", undefined]) {
    assert.equal(isDeOnlyHref(href), false, String(href));
  }
});

test("deLinkProps: nur auf Nicht-DE-Seiten locale de + hrefLang de", () => {
  assert.deepEqual(deLinkProps("en", "/bodensee-licht?szene=pool"), { locale: "de", hrefLang: "de" });
  assert.deepEqual(deLinkProps("de", "/bodensee-licht?szene=pool"), {});
  assert.deepEqual(deLinkProps("en", "/ezarri/mosaike"), {});
});

test("alle Platzhirsch-Links der englischen Einsatz-Welten auf DE-Seiten bekommen locale de", () => {
  const welten = Object.values(EN).filter((v) => v && typeof v === "object").flatMap((v) => Object.values(v)).filter((w) => w && w.platzhirsch?.href);
  assert.ok(welten.length >= 1);
  for (const w of welten) {
    if (isDeOnlyHref(w.platzhirsch.href)) assert.equal(deLinkProps("en", w.platzhirsch.href).locale, "de");
  }
  // Sprach-Integration 01.11.2026: Einkaufen aus der Schweiz gibt es auf Englisch.
  assert.equal(isDeOnlyHref(EN.STUDIO.schweizHref), false);
});
