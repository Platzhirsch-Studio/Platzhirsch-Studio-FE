// Kundenkarte (B-KKA): Mock-Pfad der Backend-Methoden (methoden.js) gegen den festen Seed – gleiche Regeln
// wie ph_kundenkarte (Limits über die Kartenkette, Sperrgründe, Leitungsrechte, sofort_aktiv, Zusammenführen),
// Seed deckt jeden Status ab, Commit-Aktionen sind registriert.
import test from "node:test";
import assert from "node:assert/strict";
import { metaIndex } from "../../src/lib/backoffice/frappe/meta.js";
import { baueDatenbank } from "../../src/lib/backoffice/mock/seed/index.js";
import { MockClient } from "../../src/lib/backoffice/mock/client.js";
import { methode, aufruf, M, kartenUebersicht, lookupImMock } from "../../src/lib/backoffice/kundenkarte/methoden.js";
import { istGesaet, SEED_KARTEN } from "../../src/lib/backoffice/mock/seed/kundenkarte.js";
import kkAktionen from "../../src/lib/backoffice/commit/aktionen/kundenkarte.js";
import { pruefeAktionen } from "../../src/lib/backoffice/commit/aktionen/index.js";
import { KARTE_STATUS, ANTRAG_STATUS } from "../../src/lib/backoffice/kundenkarte/labels.js";

const index = metaIndex();
const JETZT = () => new Date(2026, 10, 4, 12, 0, 0);
function neueDb() {
  const g = baueDatenbank(index);
  return { ...g, kommentare: new Map(), versionen: new Map(), dateien: new Map(), protokoll: [] };
}
const MA = { user: "kundenkarte@demo.local", roles: ["PH Kundenkarte Mitarbeiter"] };
const LEITUNG = { user: "admin@demo.local", roles: ["System Manager"] };
const client = (db, s = MA) => new MockClient(s, { index, db, jetzt: JETZT });

test("Seed: jeder Karten- und Antragsstatus, Stufen mit Zuordnung, Festbestand erkennbar", () => {
  const db = neueDb();
  assert.equal(istGesaet(db.db), true);
  const karten = [...db.db.get("PH Kundenkarte").values()];
  for (const st of Object.keys(KARTE_STATUS)) assert.ok(karten.some((k) => k.status === st), `Karte ${st}`);
  const antraege = [...db.db.get("PH Kundenkarte Antrag").values()];
  for (const st of Object.keys(ANTRAG_STATUS)) assert.ok(antraege.some((a) => a.status === st), `Antrag ${st}`);
  assert.ok(antraege.some((a) => a.status === "Neu" && Number(a.doi_noetig) === 1), "wartet auf Mail");
  assert.equal(db.db.get("PH Kundenkarte Stufe").size, 3);
  assert.ok([...db.db.get("PH Kundenkarte Einloesung").values()].some((e) => e.status === "Storniert"));
  assert.equal(karten.length, SEED_KARTEN.length);
  for (const k of karten) assert.ok(k.kontakt, `${k.name} hat Kontakt`);
});

test("Einlösen: Limit 1/Jahr, Fehlercode limit_reached; Limit zählt über die Ersatzkarten-Kette (K6, K36)", async () => {
  const db = neueDb();
  const c = client(db);
  const u = kartenUebersicht(c, "KK-7K3QX9");
  assert.ok(u.vorteile.some((v) => v.titel === "Lieferung im Liefergebiet" && v.verfuegbar));
  const name = await methode(c, "PH Kundenkarte", "KK-7K3QX9", "vorteil_einloesen", { vorteil: "PH-KKV-2026-00001", ort: "Showroom" });
  assert.match(name, /^PH-KKE-2026-\d{5}$/);
  await assert.rejects(() => methode(c, "PH Kundenkarte", "KK-4HRW7C", "vorteil_einloesen", { vorteil: "PH-KKV-2026-00007" }), (e) => e.detail?.code === "limit_reached");
  const nachfolger = kartenUebersicht(c, "KK-T8VH4M").vorteile.find((v) => v.titel === "Pflegetermin im Jahr");
  assert.equal(nachfolger.verbleibend, 0, "Pflege an der alten Karte zählt für die Ersatzkarte");
  await assert.rejects(() => methode(c, "PH Kundenkarte", "KK-B6TS8E", "vorteil_einloesen", { vorteil: "PH-KKV-2026-00001" }), /nicht aktiv/);
});

test("Sperren/Entsperren: Katalog, Sonstiges mit Text, Entsperren nur Leitung, Diebstahl endgültig (K7)", async () => {
  const db = neueDb();
  const c = client(db);
  await assert.rejects(() => methode(c, "PH Kundenkarte", "KK-P8D2NV", "sperren", { sperrgrund_art: "Sonstiges" }), /Beschreibung/);
  assert.equal(await methode(c, "PH Kundenkarte", "KK-P8D2NV", "sperren", { sperrgrund_art: "Kundenwunsch", grund: "Urlaub" }), "Gesperrt");
  await assert.rejects(() => methode(c, "PH Kundenkarte", "KK-P8D2NV", "entsperren", {}), /Leitung/);
  const l = client(db, LEITUNG);
  assert.equal(await methode(l, "PH Kundenkarte", "KK-P8D2NV", "entsperren", {}), "Aktiv");
  await assert.rejects(() => methode(l, "PH Kundenkarte", "KK-W3XK5R", "entsperren", {}), /endgültig/);
  assert.equal(db.db.get("PH Kontakt").get(db.db.get("PH Kundenkarte").get("KK-P8D2NV").kontakt).ph_kundenkarte_karte, "KK-P8D2NV");
});

test("Ersatzkarte übernimmt Stufe, Einwilligung, Berater; alte Karte „Ersetzt“", async () => {
  const db = neueDb();
  const c = client(db);
  const neu = await methode(c, "PH Kundenkarte", "KK-B6TS8E", "ersatzkarte_ausstellen", { sperrgrund_art: "Verlust" });
  const alt = db.db.get("PH Kundenkarte").get("KK-B6TS8E");
  const n = db.db.get("PH Kundenkarte").get(neu);
  assert.equal(alt.status, "Ersetzt");
  assert.equal(alt.nachfolger_karte, neu);
  assert.equal(n.vorgaenger_karte, "KK-B6TS8E");
  assert.equal(n.stufe, alt.stufe);
  assert.equal(n.einwilligung_auswertung, alt.einwilligung_auswertung);
  assert.equal(n.persoenlicher_berater, alt.persoenlicher_berater);
});

test("Antrag annehmen: sofort_aktiv=0 → Beantragt, Website ohne aktiv → Beantragt, vorhandene Karte → Doppelt", async () => {
  const db = neueDb();
  const c = client(db);
  const nr = await methode(c, "PH Kundenkarte Antrag", "PH-KKA-2026-00026", "annehmen", { sofort_aktiv: 0 });
  assert.equal(db.db.get("PH Kundenkarte").get(nr).status, "Beantragt");
  const w = await methode(c, "PH Kundenkarte Antrag", "PH-KKA-2026-00031", "annehmen", { aktiv: 1 });
  assert.equal(db.db.get("PH Kundenkarte").get(w).status, "Aktiv");
  assert.equal(await methode(c, "PH Kundenkarte Antrag", "PH-KKA-2026-00030", "annehmen", {}), "Doppelt");
  await assert.rejects(() => methode(c, "PH Kundenkarte Antrag", "PH-KKA-2026-00029", "annehmen", {}), /nur die Leitung/);
  assert.equal(await methode(c, "PH Kundenkarte Antrag", "PH-KKA-2026-00027", "ablehnen", { grund: "[Kundenwunsch]" }), "Abgelehnt");
});

test("Kassa-Lookup: nur Name, Stufe, Vorteile; gesperrt ohne Vorteile mit Kassa-Text (K13)", () => {
  const db = neueDb();
  const c = client(db, { user: "kassa@demo.local", roles: ["PH Kassa Mitarbeiter"] });
  const r = lookupImMock(c, "kk 7k3qx9");
  assert.equal(r.ok, true);
  assert.equal(r.name, "Anna Muster");
  const json = JSON.stringify(r);
  assert.ok(!/email|telefon|umsatz|kontakt/i.test(json), json);
  const g = lookupImMock(c, "KK-W3XK5R");
  assert.equal(g.code, "card_blocked");
  assert.deepEqual(g.vorteile, []);
  assert.equal(lookupImMock(c, "KK-K3SA7Y").weitergeleitet_von, "KK-K3SA7Y");
});

test("Dubletten und Zusammenführen: Plan für alle, Ausführen nur Leitung", async () => {
  const db = neueDb();
  const l = client(db, LEITUNG);
  const d = await aufruf(l, M.dubletten_finden, {});
  assert.equal(d.length, 1);
  const plan = await methode(client(db), "PH Kundenkarte", "KK-V7PF5K", "zusammenfuehren_mit", { andere_karte: "KK-S4JC9B", nur_plan: 1 });
  assert.equal(plan.ziel, "KK-V7PF5K");
  await assert.rejects(() => methode(client(db), "PH Kundenkarte", "KK-V7PF5K", "zusammenfuehren_mit", { andere_karte: "KK-S4JC9B" }), /Leitung/);
  await methode(l, "PH Kundenkarte", "KK-V7PF5K", "zusammenfuehren_mit", { andere_karte: "KK-S4JC9B" });
  assert.equal(db.db.get("PH Kundenkarte").get("KK-S4JC9B").status, "Zusammengefuehrt");
});

test("Neu berechnen nur mit Einwilligung, Stufenwechsel als Ereignis", async () => {
  const db = neueDb();
  const c = client(db);
  const ohne = await methode(c, "PH Kundenkarte", "KK-P8D2NV", "umsatz_neu_berechnen", {});
  assert.equal(ohne.berechnet, false);
  const mit = await methode(c, "PH Kundenkarte", "KK-Z5QG3J", "umsatz_neu_berechnen", {});
  assert.equal(mit.berechnet, true);
  const ev = [...db.db.get("PH Kundenkarte Ereignis").values()].filter((e) => e.kundenkarte === "KK-Z5QG3J" && e.art === "Umsatz berechnet");
  assert.ok(ev.length >= 1);
});

test("Commit-Aktionen registriert und gültig (G-03)", () => {
  assert.deepEqual(Object.keys(kkAktionen).sort(), ["kundenkarte.einloesen", "kundenkarte.sperren", "kundenkarte.uebergabe"]);
  assert.deepEqual(pruefeAktionen().filter((b) => /kundenkarte/.test(b)), []);
});

test("Commit „einloesen“ führt im Mock genau eine Einlösung aus; ungültige Nummer → invalid", async () => {
  const db = neueDb();
  const c = client(db);
  const vorher = db.db.get("PH Kundenkarte Einloesung").size;
  const r = await kkAktionen["kundenkarte.einloesen"]({ client: c, args: { karte: "KK-7K3QX9", vorteil: "PH-KKV-2026-00004", bezug_doctype: null, bezug: null, ort: "Showroom" }, revalidiere: () => {} });
  assert.ok(r.name);
  assert.equal(db.db.get("PH Kundenkarte Einloesung").size, vorher + 1);
  assert.equal((await kkAktionen["kundenkarte.sperren"]({ client: c, args: { karte: "kk", art: "Verlust" }, revalidiere: () => {} })).code, "invalid");
});
