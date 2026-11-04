// tests/unit/shop-review.test.mjs — Adversarial-Review 31.10.2026 (Rechtstexte, USt,
// Paketprofile, Lieferzeit): Gefahrgut-Sperre ohne Sicherheitsdatenblatt, Streichhölzer,
// Lieferzeit mit Termin, USt-Grundlagen als Live-Sperre, keine OS-Plattform.
// Run: node --test --test-reporter=tap tests/unit/shop-review.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { PAKETTYPEN, GESPERRT_SDB, pakettypOf, profilNutzbar, versandGesperrtFuer } from "../../src/lib/shop/paketprofile.js";
import { profilOf } from "../../src/lib/commerce/shipping/config.js";
import { LIEFERZEIT, lieferzeitFuer, lieferzeitMitTermin, lieferzeitOffen, lieferzeitText } from "../../src/lib/shop/lieferzeit.js";
import { SHOP_COPY } from "../../src/lib/shop/copy.js";
import { ustOffen, OSS_AKTIV } from "../../src/lib/shop/ust.js";
import { liveBlockers } from "../../src/lib/shop/mode.js";
import { SHOP_LEGAL } from "../../src/lib/shop/legal.js";
import { blocksText } from "../../src/lib/shop/legalTexte.js";

const HOME_SPRAY = { kategorie: "raumduft", name: "Home Spray 180ml", varianteName: "180ml", inhalt: { menge: 180, einheit: "ml" } };

test("Diffuser/Raumspray: ohne geprüftes SDB nur im Testmodus versandfähig – live gesperrt, auch mit Herstellermaßen", () => {
  for (const id of ["diffuser", "raumspray"]) {
    const tp = PAKETTYPEN[id];
    assert.equal(tp.gefahrgutPruefen, true, id);
    assert.equal(tp.sdbGeprueft, false, id);
    assert.equal(versandGesperrtFuer(tp, "test"), null, id);
    assert.equal(versandGesperrtFuer(tp, "live"), GESPERRT_SDB, id);
    // Auch ein gemessener Karton (geprueft: true) hebt die SDB-Sperre nicht auf.
    assert.equal(profilNutzbar({ ...tp, geprueft: true }, "live"), false, id);
    assert.equal(profilNutzbar({ ...tp, geprueft: true, sdbGeprueft: true }, "live"), true, id);
  }
  assert.equal(pakettypOf(HOME_SPRAY), "raumspray");
  // Vollständige Variantenangaben (Gewicht + Maße) machen live trotzdem nicht versandfähig.
  const komplett = { ...HOME_SPRAY, versandGewichtG: 570, versandMasseCm: [22, 10, 10] };
  assert.equal(profilOf(komplett, { mode: "live" }).gesperrt, GESPERRT_SDB);
  assert.equal(profilOf(komplett, { mode: "test" }).gesperrt, null);
});

test("Parfum und Akku-Leuchten bleiben in jedem Modus gesperrt; Streichhölzer sind Gefahrgut (UN 1944/1945)", () => {
  for (const mode of ["test", "live"]) {
    assert.ok(versandGesperrtFuer(PAKETTYPEN.parfum, mode));
    assert.ok(versandGesperrtFuer(PAKETTYPEN.leuchte, mode));
    assert.ok(versandGesperrtFuer(PAKETTYPEN.streichhoelzer, mode));
  }
  assert.equal(pakettypOf({ kategorie: "wohnaccessoire", name: "Parfümierte Streichhölzer Ernesto", varianteName: "H 10 cm" }), "streichhoelzer");
  assert.equal(pakettypOf({ kategorie: "geschenkset", name: "Eau de Cologne Set" }), "parfum");
  assert.equal(pakettypOf({ kategorie: "wohnaccessoire", name: "Extrait Flakon" }), "parfum");
  const p = profilOf({ kategorie: "wohnaccessoire", name: "Parfümierte Streichhölzer", versandGewichtG: 200, versandMasseCm: [12, 8, 3] }, { mode: "test", mock: true });
  assert.ok(p.gesperrt);
  assert.equal(p.gewichtG, null);
});

test("Lieferzeit: jede Versand-Angabe hat einen Termin (min/max oder Höchstfrist) – reines „auf Anfrage“ bleibt live gesperrt", () => {
  for (const [land, z] of Object.entries(LIEFERZEIT.versand)) for (const [b, e] of Object.entries(z)) assert.ok(lieferzeitMitTermin(e), `${land}.${b}`);
  const ohneTermin = { versand: { DE: { bestellware: { key: "deliveryOnRequest", freigegeben: true, freigabe: { datum: "2026-11-01", durch: "Inhaber" } } } }, abholung: {} };
  assert.deepEqual(lieferzeitOffen(ohneTermin), ["versand.DE.bestellware"]);
  const r = lieferzeitFuer({ land: "DE", slugs: ["x"], mode: "test" });
  assert.equal(r.vars.maxTage, 30);
  for (const loc of ["de", "en", "fr", "it"]) assert.doesNotMatch(lieferzeitText(r, SHOP_COPY[loc]), /\{maxTage\}/, loc);
  assert.doesNotMatch(SHOP_COPY.en.inStock, /immediately/i, "kein Versprechen „ships immediately“");
});

test("USt: Live bleibt gesperrt, solange Fernverkaufszahlen fehlen oder die Schwelle ohne OSS überschritten ist", () => {
  assert.equal(OSS_AKTIV, false);
  assert.deepEqual(ustOffen(), ["regeln", "fernverkaeufe"]);
  const frei = { status: "freigegeben" };
  assert.deepEqual(ustOffen({ regeln: frei, fernverkaeufe: { vorjahr2025: 0, laufend2026: 500_000 } }), []);
  assert.deepEqual(ustOffen({ regeln: frei, fernverkaeufe: { vorjahr2025: 1_000_001, laufend2026: 0 } }), ["oss-pflicht"]);
  assert.deepEqual(ustOffen({ regeln: frei, fernverkaeufe: { vorjahr2025: 0, laufend2026: 1_000_000 } }), [], "genau 10.000 € = nicht überschritten (Art. 59c MwStSystRL)");
  assert.deepEqual(ustOffen({ regeln: frei, fernverkaeufe: { vorjahr2025: 2_000_000, laufend2026: 0 }, ossAktiv: true, registrierung: null }), ["oss-registrierung"]);
  const b = liveBlockers({});
  assert.ok(b.includes("ust:regeln") && b.includes("ust:fernverkaeufe"));
});

test("Rechtstexte: alle freigegeben (03.11.2026), kein Link zur OS-Plattform, Beschwerderecht nicht nur AT-Behörde", () => {
  for (const s of SHOP_LEGAL) {
    // Inhaber-Entscheidungen Nr. 40/45/46 (03.11.2026): Kanzlei-Freigabe, status "freigegeben" mit Beleg.
    assert.equal(s.status, "freigegeben", s.id);
    assert.equal(s.freigabe?.datum, "2026-11-03", s.id);
    assert.equal(s.hinweis, undefined, "kein Herkunftshinweis in den Slot-Daten");
    const txt = blocksText(s.text);
    assert.doesNotMatch(txt, /ec\.europa\.eu\/consumers\/odr|OS-Plattform/i, s.id);
  }
  const ds = blocksText(SHOP_LEGAL.find((s) => s.id === "datenschutz").text);
  assert.match(ds, /Art\. 77 DSGVO/);
});
