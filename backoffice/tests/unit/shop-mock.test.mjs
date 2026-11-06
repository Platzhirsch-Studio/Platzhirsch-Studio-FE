// Bereich Shop (B-SHO): Mock-Seed (jeder Fall aus 10-konzept-shop § 12) und Mock-Pfad der Methoden (mockWirkung.js),
// Commit-Register, RKSV-Grep über die Shop-Dialoge. node --test tests/unit/shop-mock.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ladeMetaIndex } from "../../src/lib/backoffice/frappe/meta.js";
import { MockClient } from "../../src/lib/backoffice/mock/client.js";
import { baueDatenbank } from "../../src/lib/backoffice/mock/seed.js";
import { mockMethode, mockCall, mockWorkflow } from "../../src/lib/backoffice/shop/mockWirkung.js";
import { pruefeAktionen, commitAktion } from "../../src/lib/backoffice/commit/aktionen/index.js";
import shopSlots from "../../src/lib/backoffice/akte/slots/shop.js";
import shopAufgaben from "../../src/lib/backoffice/aufgaben/shop.js";
import shopFreigaben from "../../src/lib/backoffice/freigaben/shop.js";
import { pruefeQuellen } from "../../src/lib/backoffice/aufgaben/index.js";
import { pruefeFreigaben } from "../../src/lib/backoffice/freigaben/index.js";
import { SHOP } from "../../src/lib/backoffice/shop/faehigkeiten.js";
import routen from "../../tools/qa/routen/shop.mjs";
import bereich from "../../src/lib/backoffice/bereiche/shop.js";

const index = ladeMetaIndex();
const frisch = () => ({ ...baueDatenbank(index), kommentare: new Map(), versionen: new Map(), dateien: new Map(), protokoll: [] });
const jetzt = () => new Date(2026, 10, 4, 12, 0, 0);
const admin = (db) => new MockClient({ user: "admin@demo.local", name: "Erika Beispiel", roles: ["System Manager"] }, { index, db, jetzt });
const team = (db) => new MockClient({ user: "shop@demo.local", name: "Lena Demo", roles: ["PH Shop Mitarbeiter"] }, { index, db, jetzt });
const tab = (db, dt) => db.db.get(dt);

test("Seed: alle Fälle aus § 12 vorhanden, keine echten Personen, Beträge stimmig", () => {
  const db = frisch();
  const b = tab(db, "PH Bestellung");
  const st = new Set([...b.values()].map((x) => x.status));
  for (const s of ["offen", "zahlung_ausstehend", "bezahlt", "versandbereit", "versendet", "reserviert", "abholbereit", "abgeholt", "abgeschlossen", "fehlgeschlagen", "abgelaufen", "storniert", "widerrufen", "checkout_fehler", "pruefen"]) assert.ok(st.has(s), s);
  assert.equal(b.get("PH-S-261103-00009").offen_cent, 3900, "Reservierung teilbezahlt (Gutschein 50 €)");
  assert.equal(b.get("PH-S-261104-00012").radar_markiert, 1);
  assert.equal(b.get("PH-S-261028-00005").rechnung_uid, "DE123456789");
  assert.ok([...b.values()].some((x) => x.modus === "test"));
  for (const x of b.values()) {
    assert.match(x.kunde_email, /@beispiel\.invalid$/);
    if (!["pruefen"].includes(x.status) && x.name !== "PH-S-261103-00009" && x.name !== "PH-S-261020-00006" && Number(x.betrag_bezahlt_cent) > 0) assert.equal(x.betrag_bezahlt_cent, x.gesamt_cent, x.name);
  }
  const z = tab(db, "PH Zahlung");
  assert.ok([...z.values()].some((x) => x.status === "Erstattung angefordert"));
  assert.ok([...z.values()].some((x) => x.dispute_status === "needs_response"));
  assert.ok([...z.values()].some((x) => x.kanal === "Bar" && x.bezug === "PH-S-261027-00001"));
  assert.ok([...tab(db, "PH Gutschein").values()].some((g) => g.status === "Abgelaufen" && g.rest_cent > 0));
  assert.ok([...tab(db, "PH Stripe Ereignis").values()].some((e) => e.status === "fehler"));
  assert.ok([...tab(db, "PH Stripe Auszahlung").values()].some((p) => p.differenz_cent !== 0));
  assert.ok([...tab(db, "PH Lieferschein").values()].some((l) => l.bestellung === "PH-S-261020-00003" && l.zugestellt_am));
  assert.ok([...tab(db, "PH Widerruf").values()].some((w) => !w.bestellung && !w.gutschein_bestellung));
  assert.equal(tab(db, "PH Shop Einstellungen").get("PH Shop Einstellungen").shop_modus, "test");
});

test("Mock: Packen → versandbereit, Übergeben nur bei offen = 0 (E4), Teilzahlung bis bezahlt", async () => {
  const db = frisch();
  const c = team(db);
  assert.equal(await mockMethode(c, "PH Bestellung", "PH-S-261104-00012", "packen"), "versandbereit");
  assert.equal(tab(db, "PH Bestellung").get("PH-S-261104-00012").workflow_state, "PH Versandbereit");
  await assert.rejects(mockMethode(c, "PH Bestellung", "PH-S-261029-00002", "abgeholt_melden"), (e) => e.code === "invalid");
  const name = await mockMethode(c, "PH Bestellung", "PH-S-261103-00009", "zahlung_erfassen", { kanal: "Ueberweisung", betrag_cent: 1900, referenz: "Test" });
  assert.match(name, /^PH-ZAH-2026-/);
  assert.equal(tab(db, "PH Bestellung").get("PH-S-261103-00009").status, "reserviert");
  await mockMethode(c, "PH Bestellung", "PH-S-261103-00009", "zahlung_erfassen", { kanal: "Ueberweisung", betrag_cent: 2000, referenz: "Test" });
  const b = tab(db, "PH Bestellung").get("PH-S-261103-00009");
  assert.equal(b.betrag_bezahlt_cent, 8900);
  assert.equal(b.status, "bezahlt");
  await assert.rejects(mockMethode(c, "PH Bestellung", "PH-S-261104-00015", "zahlung_erfassen", { kanal: "Bar", betrag_cent: 100 }), (e) => e.code === "invalid");
});

test("Mock: Storno nur Leitung, über der Grenze Freigabe angefordert, GF gibt frei", async () => {
  const db = frisch();
  await assert.rejects(mockMethode(team(db), "PH Bestellung", "PH-S-261104-00012", "stornieren", { grund: "x" }), (e) => e.code === "forbidden");
  const leitung = new MockClient({ user: "leitung@demo.local", name: "Leitung", roles: ["PH Shop Leitung"] }, { index, db, jetzt });
  const r = await mockMethode(leitung, "PH Bestellung", "PH-S-261028-00005", "stornieren", { grund: "Kundenwunsch" });
  assert.equal(r.status, "storniert");
  assert.equal(r.zahlungen.length, 1);
  assert.ok(r.zahlungen[0].gegenbuchung, "unter der Grenze sofort erstattet");
  const gf = new MockClient({ user: "gf@demo.local", name: "GF", roles: ["PH Geschäftsführung"] }, { index, db, jetzt });
  const fr = await mockMethode(gf, "PH Zahlung", "PH-ZAH-2026-00069", "erstattung_freigeben");
  assert.ok(fr.gegenbuchung);
  assert.equal(tab(db, "PH Zahlung").get("PH-ZAH-2026-00069").status, "Erstattet");
});

test("Mock: Gutschein prüfen/einlösen, ohne Verkauf nur Leitung, Ersetzen gibt Code einmalig", async () => {
  const db = frisch();
  const c = admin(db);
  const p = await mockCall(c, "ph_shop.api.backoffice.check_voucher", { code: "PHAAAABBBBCCCC7K3Q" });
  assert.equal(p.ok, true);
  assert.equal(p.rest_cent, 5000);
  assert.equal((await mockCall(c, "ph_shop.api.backoffice.check_voucher", { code: "XXXXH8KD" })).ok, false);
  const e = await mockMethode(c, "PH Bestellung", "PH-S-261104-00015", "gutschein_einloesen", { code: "7K3Q", betrag_cent: 2000 });
  assert.equal(e.rest_cent, 3000);
  await assert.rejects(mockCall(team(db), "ph_shop.api.backoffice.issue_voucher", { wert_cent: 2500, grund: "Kulanz" }), (x) => x.code === "forbidden");
  const neu = await mockCall(c, "ph_shop.api.backoffice.issue_voucher", { wert_cent: 2500, grund: "Kulanz" });
  assert.match(neu.code, /^PH-[A-Z2-9]{4}-/);
  assert.equal(tab(db, "PH Gutschein").get(neu.gutschein).art, "Mehrzweck");
  assert.ok(!JSON.stringify(tab(db, "PH Gutschein").get(neu.gutschein)).includes(neu.code), "Code nie im Klartext gespeichert");
  const er = await mockMethode(c, "PH Gutschein", "PH-GS-2026-00031", "ersetzen");
  assert.equal(tab(db, "PH Gutschein").get("PH-GS-2026-00031").ersetzt_durch, er.gutschein);
});

test("Mock: Telefonbestellung mit Idempotenz, Showroom erzwingt Abholung, ohne E-Mail abgelehnt", async () => {
  const db = frisch();
  const c = team(db);
  const args = { kunde: { name: "Anna Beispiel", email: "anna@beispiel.invalid" }, positionen: [{ bezeichnung: "Glas", menge: 2, einzel_cent: 12900 }], lieferart: "versand", adresse: { strasse: "A", plz: "6911", ort: "Lochau", land: "AT" }, versand_cent: 990, bestellart: "Telefon", senden: 0, idempotency_key: "k1" };
  const a = await mockCall(c, "ph_shop.api.backoffice.create_phone_order", args);
  const b = await mockCall(c, "ph_shop.api.backoffice.create_phone_order", args);
  assert.equal(a.name, b.name);
  const doc = tab(db, "PH Bestellung").get(a.name);
  assert.equal(doc.gesamt_cent, 26790);
  assert.ok(doc.zahlungslink_url);
  assert.equal(doc.zahlungslink_gesendet_am || "", "", "senden=0: Link erst nach dem Undo-Fenster");
  const s = await mockCall(c, "ph_shop.api.backoffice.create_phone_order", { ...args, bestellart: "Showroom", idempotency_key: "k2" });
  assert.equal(tab(db, "PH Bestellung").get(s.name).lieferart, "abholung");
  assert.equal(tab(db, "PH Bestellung").get(s.name).status, "reserviert");
  await assert.rejects(mockCall(c, "ph_shop.api.backoffice.create_phone_order", { ...args, kunde: { name: "X" }, idempotency_key: "k3" }), (e) => e.code === "invalid");
});

test("Mock: Widerruf → Retoure → Eingang → Prüfung; Workflow Zurück auf Offen nur Leitung", async () => {
  const db = frisch();
  const c = admin(db);
  const rn = await mockMethode(c, "PH Widerruf", "PH-WID-2026-00006", "ware_erhalten");
  assert.equal(rn, "erhalten");
  assert.equal(await mockMethode(c, "PH Retoure", "PH-RET-2026-00004", "eingegangen"), "eingegangen");
  assert.equal(tab(db, "PH Widerruf").get("PH-WID-2026-00007").status, "Ware erhalten");
  assert.equal(await mockMethode(c, "PH Retoure", "PH-RET-2026-00004", "pruefung_abschliessen"), "geprueft");
  await assert.rejects(mockWorkflow(team(db), "PH Bestellung", "PH-S-261102-00014", "Zurück auf Offen"), (e) => e.code === "forbidden");
  await mockWorkflow(c, "PH Bestellung", "PH-S-261102-00014", "Zurück auf Offen");
  assert.equal(tab(db, "PH Bestellung").get("PH-S-261102-00014").status, "offen");
  const pick = await mockCall(c, "ph_shop.api.get_pickup_status", { code: "k7pl3q" });
  assert.equal(pick.gefunden, true);
});

test("Register: Commit-Aktionen, Slots, Zu tun, Freigaben, Fähigkeiten, QA-Routen, Navigation", () => {
  assert.deepEqual(pruefeAktionen(), []);
  for (const n of ["shop.methode", "shop.direkt-uebergeben", "shop.workflow", "shop.modus-test"]) assert.equal(typeof commitAktion(n), "function", n);
  assert.equal(shopSlots[0].akte, "kunde");
  assert.deepEqual(pruefeQuellen({ shop: shopAufgaben }), []);
  assert.deepEqual(pruefeFreigaben({ shop: shopFreigaben }), []);
  assert.ok(Object.keys(SHOP).every((id) => id.startsWith("shop.")));
  assert.ok(routen.every((r) => r.pfad.startsWith("/shop")));
  assert.equal(new Set(routen.map((r) => r.pfad)).size, routen.length);
  assert.equal(bereich.routen["PH Bestellung"]("X"), "/shop/bestellungen/X");
  assert.equal(bereich.routen["PH Retoure"](), "/shop/widerrufe?segment=retouren");
});

test("RKSV und Löschen: kein Bar/Karte/Terminal/Verrechnung als Wahl in Shop-Dialogen, kein Löschen-Knopf (QA 3, 27)", () => {
  const wurzel = path.resolve("src");
  const dateien = [];
  const lauf = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) lauf(p); else if (/\.js$/.test(e.name)) dateien.push(p); } };
  lauf(path.join(wurzel, "components/Backoffice/Shop"));
  lauf(path.join(wurzel, "app/shop"));
  for (const f of dateien) {
    const t = fs.readFileSync(f, "utf8");
    assert.doesNotMatch(t, /kanal:\s*"(Bar|Karte extern|Stripe Terminal|Verrechnung)"/, f);
    assert.doesNotMatch(t, />\s*Löschen\s*</, f);
    assert.doesNotMatch(t, /ip_hash/, f);
  }
});
