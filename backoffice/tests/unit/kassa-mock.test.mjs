// Kassa – Mock der Page-Methoden, Seed, Frappe-Argumente, Fähigkeiten, Register (Team B-KAS).
//   node --test tests/unit/kassa-mock.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { MockClient, mockDatenbank } from "../../src/lib/backoffice/mock/client.js";
import { argumente, PFADE, rufe } from "../../src/lib/backoffice/kassa/frappe.js";
import { MOCK_METHODEN, sicherstellen } from "../../src/lib/backoffice/kassa/mock.js";
import { ECHTBETRIEB_PFLICHT, echtbetriebFehlt, IDS, KASSA } from "../../src/lib/backoffice/kassa/faehigkeiten.js";
import { faehigkeit } from "../../src/lib/backoffice/faehigkeiten.js";
import { K1, K2, SEED_VERSION } from "../../src/lib/backoffice/mock/seed/kassa.js";
import bereich from "../../src/lib/backoffice/bereiche/kassa.js";
import kuerzel from "../../src/lib/backoffice/kuerzel/kassa.js";
import routen from "../../tools/qa/routen/kassa.mjs";
import { KIOSK } from "../../src/lib/backoffice/kassa/texte.js";

const db = () => mockDatenbank({ reset: true });
const mitarbeiter = (d) => new MockClient({ user: "kassa@demo.local", name: "David Vorlage", roles: ["PH Kassa Mitarbeiter"] }, { db: d });
const leitung = (d) => new MockClient({ user: "kassa-leitung@demo.local", name: "Julia Schema", roles: ["PH Kassa Leitung", "PH Kassa Mitarbeiter"] }, { db: d });
const kerze = { art: "Artikel", produkt: "acc-altair", bezeichnung: "Altaïr Duftkerze", menge: 1, einzel_brutto_cent: 12500, steuersatz: "Normal 20" };

test("Seed: jede Kassa-Tabelle, jeder Abschluss-Status, Kassenbuch-Bestand stimmt", () => {
  const d = db();
  const c = mitarbeiter(d);
  sicherstellen(c);
  const t = (dt) => [...d.db.get(dt).values()];
  assert.ok(t("PH Kasse").some((k) => k.name === K1) && t("PH Kasse").some((k) => k.name === K2));
  assert.ok(t("PH Kassenbeleg").length >= 30);
  const arten = new Set(t("PH Kassenbeleg").map((b) => b.belegart));
  for (const a of ["Startbeleg", "Standard", "Stornobeleg", "Nullbeleg", "Trainingsbeleg"]) assert.ok(arten.has(a), a);
  assert.ok(t("PH Kassenbeleg").some((b) => b.status === "Ausfall"));
  const status = new Set(t("PH Kassenabschluss").map((a) => a.status));
  for (const s of ["Offen", "Gezaehlt", "Abgeschlossen", "Korrigiert"]) assert.ok(status.has(s), s);
  assert.ok(t("PH Kassenabschluss").some((a) => a.differenz_cent < 0));
  assert.ok(t("PH Kassa Ereignis").some((e) => e.status === "Offen" && e.meldung_finanzonline_noetig));
  assert.equal(t("PH DEP Export").length, 2);
  for (const k of [K1, K2]) {
    const zeilen = t("PH Kassenbuch").filter((z) => z.kasse === k).sort((a, b) => a.zeitpunkt.localeCompare(b.zeitpunkt) || a.name.localeCompare(b.name));
    let b = 0;
    for (const z of zeilen) {
      b += z.bewegung_cent;
      assert.equal(z.bestand_danach_cent, b, `${k} ${z.name}`);
    }
  }
  // Abschluss: Ist = Soll + Differenz
  for (const a of t("PH Kassenabschluss").filter((x) => x.status === "Abgeschlossen")) assert.equal(a.bargeld_ist_cent, a.bargeld_soll_cent + a.differenz_cent, a.name);
  assert.equal(d.kassaSeed, SEED_VERSION);
});

test("Mock: Kontext, Katalog, Suche, Kundenkarte ohne Geldwert", async () => {
  const c = mitarbeiter(db());
  const k = await rufe(c, "kontext", {});
  assert.equal(k.kasse, K1);
  assert.equal(k.trainings, 0);
  assert.ok(k.terminals.length >= 1);
  assert.ok(k.schnelltasten.some((s) => s.aktion === "Gutschein Verkauf"));
  assert.ok((await rufe(c, "kassen_katalog", {})).produkte.some((p) => p.ean === "2000000040042"));
  assert.equal((await rufe(c, "suche_produkt", { q: "altaïr" }))[0].produkt, "acc-altair");
  const karte = [...c.db.db.get("PH Kundenkarte").values()].find((x) => x.status === "Aktiv");
  const e = await rufe(c, "code_erkennen", { code: karte.kartennummer });
  assert.equal(e.art, "kundenkarte");
  assert.equal(e.treffer.code, "ok");
  assert.ok(e.treffer.vorteile.length >= 1);
  assert.equal(JSON.stringify(e.treffer).match(/punkte|guthaben|_cent/i), null, "keine Beträge an der Kassa");
});

test("Mock: Barverkauf mit Rückgeld, Idempotenz (gleicher Schlüssel = gleicher Beleg)", async () => {
  const c = mitarbeiter(db());
  const args = { kasse: K1, positionen: [kerze], zahlarten: [{ zahlart: "Bar", gegeben_cent: 15000 }], idempotency_key: "kassa:K1:test-1" };
  const a = await rufe(c, "beleg_buchen", args);
  assert.equal(a.rueckgeld_cent, 2500);
  const b = await rufe(c, "beleg_buchen", args);
  assert.equal(b.beleg, a.beleg);
  assert.equal(b.wiederholung, true);
  const beleg = c.db.db.get("PH Kassenbeleg").get(a.beleg);
  assert.equal(beleg.trainings, 0);
  assert.ok([...c.db.db.get("PH Kassenbuch").values()].some((z) => z.beleg === a.beleg && z.art === "Bareinnahme"));
});

test("Mock: Karte erst nach „bezahlt“ buchbar; Gutschein-Verkauf liefert Code", async () => {
  const c = mitarbeiter(db());
  const t = await rufe(c, "terminal_start", { kasse: K1, terminal: "tmr_MOCK_LOCHAU_01", betrag_cent: 12500 });
  await assert.rejects(rufe(c, "beleg_buchen", { kasse: K1, positionen: [kerze], zahlarten: [{ zahlart: "Karte Stripe Terminal", betrag_cent: 12500, terminal_payment_intent: t.payment_intent }] }), /noch nicht bestätigt/);
  await rufe(c, "terminal_simulieren", { terminal: "tmr_MOCK_LOCHAU_01" });
  assert.equal((await rufe(c, "terminal_status", { payment_intent: t.payment_intent })).bezahlt, true);
  const ok = await rufe(c, "beleg_buchen", { kasse: K1, positionen: [kerze], zahlarten: [{ zahlart: "Karte Stripe Terminal", betrag_cent: 12500, terminal_payment_intent: t.payment_intent }], idempotency_key: "kassa:K1:k" });
  assert.ok(ok.beleg);
  const g = await rufe(c, "beleg_buchen", { kasse: K1, positionen: [{ art: "Gutschein Verkauf", bezeichnung: "Gutschein", menge: 1, einzel_brutto_cent: 5000 }], zahlarten: [{ zahlart: "Bar", gegeben_cent: 5000 }] });
  assert.match(g.gutschein_codes[0].code, /^PH-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
  const p = await rufe(c, "gutschein_pruefen", { code: g.gutschein_codes[0].code });
  assert.equal(p.gueltig, true);
  assert.equal(p.rest_cent, 5000);
});

test("Mock: Rechnung über 400 € braucht Empfänger; mit Empfänger entsteht ein Kontakt", async () => {
  const c = mitarbeiter(db());
  const pos = [{ ...kerze, menge: 4 }];
  await assert.rejects(rufe(c, "beleg_buchen", { kasse: K1, positionen: pos, zahlarten: [{ zahlart: "Bar", gegeben_cent: 50000 }] }), /Rechnungsempfänger/);
  const r = await rufe(c, "beleg_buchen", { kasse: K1, positionen: pos, zahlarten: [{ zahlart: "Bar", gegeben_cent: 50000 }], empfaenger: { name: "Beispiel Hotel GmbH", firma: "Beispiel Hotel GmbH", strasse: "Seestraße 1", plz: "6911", ort: "Lochau" } });
  assert.ok(c.db.db.get("PH Kassenbeleg").get(r.beleg).kontakt);
});

test("Mock: Storno – fremder Beleg braucht Freigabe der Leitung (PIN), Leitung direkt", async () => {
  const d = db();
  const m = mitarbeiter(d);
  const fremd = [...d.db.get("PH Kassenbeleg").values()].find((b) => b.kasse === K1 && b.belegart === "Standard" && b.bediener === "kassa-leitung@demo.local" && !b.storniert_durch && !String(b.datum_uhrzeit).startsWith(new Date().toISOString().slice(0, 10)));
  sicherstellen(m);
  const ziel = fremd || [...d.db.get("PH Kassenbeleg").values()].find((b) => b.belegart === "Standard" && !b.storniert_durch);
  await assert.rejects(rufe(m, "storno", { beleg: ziel.name, grund: "Fehlbuchung" }), (e) => e.code === "forbidden" && /Freigabe der Leitung/.test(e.message));
  await assert.rejects(rufe(m, "storno", { beleg: ziel.name, grund: "Fehlbuchung", freigabe: { email: "kassa-leitung@demo.local", pin: "0000" } }), (e) => e.code === "auth");
  const s = await rufe(m, "storno", { beleg: ziel.name, grund: "Fehlbuchung", freigabe: { email: "kassa-leitung@demo.local", pin: "4102" } });
  assert.equal(s.freigabe_von, "kassa-leitung@demo.local");
  assert.equal(d.db.get("PH Kassenbeleg").get(ziel.name).storniert_durch, s.beleg);
  await assert.rejects(rufe(leitung(d), "storno", { beleg: ziel.name, grund: "Doppelt" }), /bereits storniert/);
});

test("Mock: Tagesabschluss – zählen (Mitarbeiter), abschließen (Leitung), danach gesperrt", async () => {
  const d = db();
  const m = mitarbeiter(d);
  const a = await rufe(m, "abschluss_laden", { kasse: K1 });
  assert.equal(a.status, "Offen");
  const soll = a.bargeld_soll_cent;
  const z = await rufe(m, "abschluss_zaehlen", { kasse: K1, zaehlprotokoll: [{ stueckelung_cent: 1, anzahl: soll - 240 }] });
  assert.equal(z.status, "Gezaehlt");
  assert.equal(z.differenz_cent, -240);
  await assert.rejects(rufe(m, "abschluss_abschliessen", { kasse: K1 }), (e) => e.code === "forbidden");
  const l = leitung(d);
  await assert.rejects(rufe(l, "abschluss_abschliessen", { kasse: K1, unterschrift_name: "Julia" }), /Grund angeben/);
  const fertig = await rufe(l, "abschluss_abschliessen", { kasse: K1, differenz_grund: "Zählfehler", unterschrift_name: "Julia Schema", tresor_entnahme_cent: 10000 });
  assert.equal(fertig.status, "Abgeschlossen");
  assert.equal((await rufe(m, "kontext", {})).gesperrt, true);
  await assert.rejects(rufe(m, "beleg_buchen", { kasse: K1, positionen: [kerze], zahlarten: [{ zahlart: "Bar", gegeben_cent: 12500 }] }), /abgeschlossen/);
  // Vortag nur Leitung
  await assert.rejects(rufe(m, "abschluss_laden", { kasse: K1, datum: "2026-01-01" }), (e) => e.code === "forbidden");
});

test("Mock: Retoure mit Originalbeleg, Bar braucht Freigabe; Netzfehler-Schalter nur im Mock", async () => {
  const d = db();
  const m = mitarbeiter(d);
  const r = await rufe(m, "beleg_buchen", { kasse: K1, positionen: [{ ...kerze, menge: 2 }], zahlarten: [{ zahlart: "Bar", gegeben_cent: 25000 }] });
  const v = await rufe(m, "retoure_vorbereiten", { beleg: r.beleg, auswahl: { "pos-1": 1 }, grund: "Mangel" });
  assert.equal(v.betrag_cent, -12500);
  await assert.rejects(rufe(m, "beleg_buchen", { kasse: K1, positionen: v.positionen, zahlarten: [{ zahlart: "Bar", betrag_cent: -12500 }], retoure_original: r.beleg }), /Freigabe/);
  const ok = await rufe(m, "beleg_buchen", { kasse: K1, positionen: v.positionen, zahlarten: [{ zahlart: "Bar", betrag_cent: -12500 }], retoure_original: r.beleg, freigabe: { email: "kassa-leitung@demo.local", pin: "4102" } });
  assert.equal(ok.gesamt_cent, -12500);
  assert.equal((await rufe(m, "retoure_vorbereiten", { beleg: r.beleg })).zeilen[0].ruecknehmbar, 1);
  const args = { kasse: K1, positionen: [kerze], zahlarten: [{ zahlart: "Bar", gegeben_cent: 12500 }], idempotency_key: "kassa:K1:netz", _simuliere: "netz" };
  for (let i = 0; i < 3; i++) await assert.rejects(rufe(m, "beleg_buchen", args), (e) => e.code === "unavailable");
  const nach = await rufe(m, "beleg_buchen", args);
  assert.ok(nach.beleg, "vierter Versuch mit gleichem Schlüssel bucht");
});

test("Frappe-Argumente: JSON als Text, nie `trainings` an beleg_buchen, keine Mock-Schalter", () => {
  const a = argumente("beleg_buchen", { kasse: "K1", positionen: [kerze], zahlarten: [], trainings: 1, _simuliere: "netz", leer: "" });
  assert.equal(typeof a.positionen, "string");
  assert.equal("trainings" in a, false);
  assert.equal("_simuliere" in a, false);
  assert.equal("leer" in a, false);
  for (const [name, pfad] of Object.entries(PFADE)) {
    assert.match(pfad, /^ph_(kassa|kundenkarte)\./, name);
    if (pfad.includes(".page.")) assert.ok(MOCK_METHODEN[name], `Mock fehlt für ${name}`);
  }
});

test("Fähigkeiten: Proben gegen Backend-Import, Echtbetriebs-Schranke", async () => {
  const s = { user: "kassa-leitung@demo.local", roles: ["PH Kassa Leitung"] };
  const opts = { katalog: KASSA, modus: "mock", env: {} };
  assert.equal((await faehigkeit(s, "kassa.idempotenz", opts)).an, true);
  assert.equal((await faehigkeit(s, "kassa.retoure", opts)).an, true);
  assert.equal((await faehigkeit(s, "kassa.kassenbuch_projekt", opts)).an, false, "PH Kassenbuch hat kein Feld projekt");
  assert.equal((await faehigkeit(s, "kassa.kassenbuch_zweck", opts)).an, false);
  assert.equal((await faehigkeit(s, "kassa.bediener_sitzung", opts)).an, false);
  assert.equal((await faehigkeit(s, "kassa.ueberweisung", opts)).an, false);
  assert.equal((await faehigkeit(s, "kassa.retoure", { ...opts, ueberschreibung: "-kassa.retoure" })).an, false);
  assert.equal(IDS.length, Object.keys(KASSA).length);
  assert.ok(ECHTBETRIEB_PFLICHT.every((id) => KASSA[id]));
  const fehlt = echtbetriebFehlt({ bediener_sitzung: { an: false, titel: "PIN-Sitzung" }, idempotenz: { an: true }, training_server: { an: true }, rechnung_snapshot: { an: true } }, [{ titel: "Startbeleg geprüft", erledigt: false }]);
  assert.deepEqual(fehlt, ["PIN-Sitzung", "Startbeleg geprüft"]);
});

test("Register: Navigation, Routen, Kürzel und QA-Routen der Kassa", () => {
  assert.equal(bereich.startseite, "/kassa/verwaltung");
  assert.ok(bereich.navigation.every((n) => n.href.startsWith("/kassa/verwaltung")));
  assert.equal(bereich.routen["PH Kassenbeleg"]("K-1"), "/kassa/verwaltung/belege/K-1");
  assert.ok(bereich.doctypes.includes("PH Kassa Ereignis"));
  assert.ok(kuerzel.every((k) => k.kontext === "kiosk-kassa" && !/^[a-z]$/.test(k.taste)), "Kiosk: keine Einzelbuchstaben");
  assert.equal(new Set(kuerzel.map((k) => k.taste)).size, kuerzel.length);
  assert.ok(routen.some((r) => r.pfad === "/kassa"));
  assert.equal(routen.find((r) => r.pfad === "/kassa").rang, 70);
});

test("Texte: keine Frappe-Begriffe, keine Bezahlanbieter-Namen in Kiosk-Texten (K41/X1)", () => {
  const t = JSON.stringify(KIOSK, (k, v) => (typeof v === "function" ? v("X", 1, "Y", "Z") : v));
  assert.equal(/Submit|Cancel|DocType|Draft|Faktura|Shop-Verwaltung|Stripe/.test(t), false);
});
