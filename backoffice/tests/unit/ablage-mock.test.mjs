// Ablage (B-ABL): Mock-Pfad der ph_ablage.api (methoden.js) gegen den festen Seed – gleiche Regeln wie die App
// (Ordner-Modus, Sperre, Aufbewahrung, Papierkorb, Freigabelinks mit Token-Hash, Upload in Teilen mit Prüfsumme),
// Seed deckt jeden Status ab, Register-Teildateien sind gültig.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { metaIndex } from "../../src/lib/backoffice/frappe/meta.js";
import { baueDatenbank } from "../../src/lib/backoffice/mock/seed/index.js";
import { MockClient } from "../../src/lib/backoffice/mock/client.js";
import { ablage, ablageCode, METHODEN, mockHat } from "../../src/lib/backoffice/ablage/methoden.js";
import { DEMO_PASSWORT, DEMO_TOKENS, istGesaet } from "../../src/lib/backoffice/mock/seed/ablage.js";
import abAktionen from "../../src/lib/backoffice/commit/aktionen/ablage.js";
import { pruefeAktionen } from "../../src/lib/backoffice/commit/aktionen/index.js";
import kuerzel from "../../src/lib/backoffice/kuerzel/ablage.js";
import quellen from "../../src/lib/backoffice/aufgaben/ablage.js";
import { pruefeQuellen } from "../../src/lib/backoffice/aufgaben/index.js";
import bereich from "../../src/lib/backoffice/bereiche/ablage.js";
import { ABLAGE } from "../../src/lib/backoffice/ablage/faehigkeiten.js";
import { readFileSync } from "node:fs";

const index = metaIndex();
function neueDb() {
  const g = baueDatenbank(index);
  return { ...g, kommentare: new Map(), versionen: new Map(), dateien: new Map(), protokoll: [] };
}
const ADMIN = { user: "admin@demo.local", roles: ["PH Backoffice-Admin", "System Manager"] };
const CRM = { user: "crm@demo.local", roles: ["PH CRM Mitarbeiter"] };
const PROJ = { user: "projekte@demo.local", roles: ["PH Projekte Leitung", "PH Projekte Mitarbeiter"] };
const GF = { user: "gf@demo.local", roles: ["PH Geschäftsführung"] };
const SERVICE = { user: "backoffice@platzhirsch.studio", roles: ["System Manager"] };
const client = (db, s = ADMIN) => new MockClient(s, { index, db });
const dateiNach = (db, name) => [...db.db.get("PH Datei").values()].find((d) => d.dateiname === name);
const b64 = (s) => Buffer.from(s).toString("base64");
const sha = (s) => createHash("sha256").update(s).digest("hex");

test("Seed: Festbestand erkennbar, jeder Fall vorhanden, Baum geschlossen", () => {
  const db = neueDb();
  assert.ok(istGesaet(db.db));
  const dateien = [...db.db.get("PH Datei").values()];
  const ordner = [...db.db.get("PH Ordner").values()];
  const links = [...db.db.get("PH Datei Freigabelink").values()];
  assert.ok(dateien.every((d) => db.db.get("PH Ordner").has(d.ordner)));
  assert.ok(ordner.every((o) => !o.parent_ph_ordner || db.db.get("PH Ordner").has(o.parent_ph_ordner)));
  for (const st of ["Aktiv", "Papierkorb"]) assert.ok(dateien.some((d) => d.status === st), st);
  for (const vs of ["Fertig", "Browser", "Ausstehend", "Fehler", "Nicht moeglich"]) assert.ok(dateien.some((d) => d.vorschau_status === vs), vs);
  for (const art of ["bild", "pdf", "office", "cad", "video"]) assert.ok(dateien.some((d) => d.vorschau_art === art), art);
  for (const st of ["Aktiv", "Abgelaufen", "Widerrufen", "Aufgebraucht"]) assert.ok(links.some((l) => l.status === st), st);
  assert.ok(dateien.some((d) => d.aufbewahrungsklasse === "Beleg" && d.loeschsperre === 1));
  assert.ok(dateien.some((d) => d.portal_freigabe === 1));
  assert.ok(dateien.some((d) => d.gesperrt_von === "projekte@demo.local") && dateien.some((d) => d.gesperrt_von === "admin@demo.local"));
  assert.ok(dateien.some((d) => d.aktuelle_version === 3 && d.versionen.length === 3));
  assert.ok(ordner.some((o) => o.titel === "Mitarbeiter" && o.effektiver_modus === "leitung"));
  assert.ok(dateien.every((d) => /^PH-DAT-\d{4}-\d{6}$/.test(d.name)) && ordner.every((o) => /^PH-ORD-\d{6}$/.test(o.name)));
  assert.ok(dateien.filter((d) => d._mock_bild).every((d) => /^\/entwurf\/lounge\/[a-z0-9-]+\.(jpg|webp)$/.test(d._mock_bild)));
  // Leerfall: „08 Service“ im dritten Projekt
  const leer = ordner.filter((o) => o.titel === "08 Service").some((o) => !dateien.some((d) => d.ordner === o.name));
  assert.ok(leer, "leerer Ordner vorhanden");
});

test("Alle Methoden der App haben einen Mock-Pfad; Signaturen aus Backend-Import", () => {
  for (const m of METHODEN) assert.ok(mockHat(m), m);
  const api = readFileSync(new URL("../../../Backend-Import/ph_ablage/ph_ablage/api/__init__.py", import.meta.url), "utf8");
  for (const m of METHODEN) assert.match(api, new RegExp(`def ${m}\\(`), `ph_ablage.api.${m} existiert`);
});

test("Baum: Bereichsordner, Personalordner nur für Leitung, Bezug legt Stammordner an", async () => {
  const db = neueDb();
  const titel = (r) => r.wurzeln.map((w) => w.titel);
  assert.deepEqual(titel(await ablage(client(db), "ordner_baum", { tiefe: 0 })), ["Allgemein", "Kontakte", "Lieferanten", "Mitarbeiter", "Projekte"]);
  assert.ok(!titel(await ablage(client(db, CRM), "ordner_baum", {})).includes("Mitarbeiter"), "CRM sieht Personal nicht");
  assert.ok(!titel(await ablage(client(db, { user: "x", roles: ["PH Ablage Leitung"] }), "ordner_baum", {})).includes("Mitarbeiter"), "Ablage-Leitung sieht Personal nicht");
  assert.ok(titel(await ablage(client(db, { user: "p", roles: ["PH Personal Leitung"] }), "ordner_baum", {})).includes("Mitarbeiter"));
  const projekt = [...db.db.get("PH Projekt").values()][6];
  const r = await ablage(client(db), "ordner_baum", { bezug_doctype: "PH Projekt", bezug_name: projekt.name });
  assert.equal(r.wurzeln[0].kinder.length, 8, "Vorlage 01–08");
  assert.equal(r.wurzeln[0].kinder.find((k) => k.titel.startsWith("04")).aufbewahrungsklasse, "Beleg");
  const nochmal = await ablage(client(db), "ordner_baum", { bezug_doctype: "PH Projekt", bezug_name: projekt.name });
  assert.equal(nochmal.wurzeln[0].ordner, r.wurzeln[0].ordner, "idempotent");
});

test("Dateien: Sortierung, Endungsfilter, Suche, Papierkorb", async () => {
  const db = neueDb();
  const o = dateiNach(db, "Rendering Essplatz.jpg").ordner;
  const c = client(db);
  const r = await ablage(c, "dateien", { ordner: o, sort: "-groesse" });
  assert.ok(r.items.length >= 3 && r.items[0].groesse >= r.items[1].groesse);
  assert.equal(r.ordner.titel, "03 Renderings");
  assert.equal((await ablage(c, "dateien", { ordner: o, endung: "png" })).items.length, 1);
  const s = await ablage(c, "suche", { q: "Kochinsel Abend" });
  assert.ok(s.some((x) => x.dateiname === "Rendering Kochinsel Abend.jpg" && x.treffer_in.includes("name")));
  await assert.rejects(ablage(c, "suche", { q: "a" }), (e) => e.code === "invalid");
  const korb = await ablage(c, "dateien", { papierkorb: 1 });
  assert.ok(korb.items.length >= 3 && korb.items.every((d) => d.status === "Papierkorb"));
  await assert.rejects(ablage(c, "dateien", {}), (e) => e.code === "invalid");
});

test("Sperre: fremd → locked 423 (conflict), Leitung hebt auf, eigene Sperre einchecken", async () => {
  const db = neueDb();
  const d = dateiNach(db, "Ansicht Kochinsel.pdf");
  const c = client(db, CRM);
  await assert.rejects(ablage(c, "umbenennen", { datei: d.name, dateiname: "x" }), (e) => e.code === "conflict" && ablageCode(e) === "locked" && e.status === 423);
  await assert.rejects(ablage(c, "entsperren", { datei: d.name, erzwingen: 1 }), (e) => ablageCode(e) === "locked", "Mitarbeiterin darf nicht erzwingen");
  const auf = await ablage(client(db, ADMIN), "entsperren", { datei: d.name, erzwingen: 1 });
  assert.equal(auf.gesperrt_von, null);
  const zu = await ablage(c, "sperren", { datei: d.name, stunden: 2 });
  assert.equal(zu.gesperrt_von, "crm@demo.local");
  const frei = await ablage(c, "entsperren", { datei: d.name });
  assert.equal(frei.gesperrt_von, null);
});

test("Papierkorb: Beleg gesperrt, Löschen + Wiederherstellen, endgültig nur Leitung", async () => {
  const db = neueDb();
  const beleg = dateiNach(db, "Angebot AN-2026-0012 unterschrieben.pdf");
  await assert.rejects(ablage(client(db, ADMIN), "loeschen", { datei: beleg.name }), (e) => ablageCode(e) === "locked");
  const d = dateiNach(db, "Rendering Essplatz.jpg");
  const c = client(db, CRM);
  const weg = await ablage(c, "loeschen", { datei: d.name });
  assert.equal(weg.status, "Papierkorb");
  assert.ok(weg.papierkorb_bis);
  const zurueck = await ablage(c, "wiederherstellen", { datei: d.name });
  assert.equal(zurueck.status, "Aktiv");
  await ablage(c, "loeschen", { datei: d.name });
  await assert.rejects(ablage(c, "endgueltig_loeschen", { datei: d.name }), (e) => e.code === "forbidden");
  await assert.rejects(ablage(client(db, PROJ), "endgueltig_loeschen", { datei: d.name }), (e) => e.code === "forbidden", "nur DocType-Recht delete");
  const ende = await ablage(client(db, ADMIN), "endgueltig_loeschen", { datei: d.name });
  assert.equal(ende.geloescht, true);
  assert.ok(!db.db.get("PH Datei").has(d.name));
});

test("Upload in Teilen: Prüfsumme, Offset-Konflikt, Duplikat, neue Version mit gleicher Endung", async () => {
  const db = neueDb();
  const c = client(db, CRM);
  const ordner = dateiNach(db, "Grundriss Wohnung (aus E-Mail).pdf").ordner;
  const inhalt = "Hallo Ablage – Testinhalt";
  const s = await ablage(c, "upload_start", { ordner, dateiname: "Notiz Kunde.txt", groesse: Buffer.byteLength(inhalt), sha256: sha(inhalt) });
  assert.equal(s.ziel.art, "teile");
  await assert.rejects(ablage(c, "upload_chunk", { token: s.token, offset: 5, daten: b64("x") }), (e) => e.code === "conflict");
  const teil1 = Buffer.from(inhalt).subarray(0, 10);
  const teil2 = Buffer.from(inhalt).subarray(10);
  await ablage(c, "upload_chunk", { token: s.token, offset: 0, daten: teil1.toString("base64") });
  const wiederholt = await ablage(c, "upload_chunk", { token: s.token, offset: 0, daten: teil1.toString("base64") });
  assert.equal(wiederholt.erhalten, 10, "Wiederholung harmlos");
  const fertig = await ablage(c, "upload_chunk", { token: s.token, offset: 10, daten: teil2.toString("base64") });
  assert.equal(fertig.fertig, true);
  await assert.rejects(ablage(c, "upload_abschliessen", { token: s.token, sha256: sha("falsch") }), (e) => ablageCode(e) === "checksum_mismatch");
  const d = await ablage(c, "upload_abschliessen", { token: s.token, sha256: sha(inhalt) });
  assert.equal(d.status, "Aktiv");
  assert.equal(d.version, 1);
  assert.equal(d.dateiname, "Notiz Kunde.txt");
  // Duplikat wird gemeldet
  const s2 = await ablage(c, "upload_start", { ordner, dateiname: "Kopie.txt", groesse: Buffer.byteLength(inhalt), sha256: sha(inhalt) });
  assert.equal(s2.duplikate[0].datei, d.datei);
  // Neue Version: gleiche Endung
  await assert.rejects(ablage(c, "neue_version", { datei: d.datei, groesse: 3, dateiname: "x.pdf" }), (e) => e.code === "conflict");
  const v = await ablage(c, "neue_version", { datei: d.datei, groesse: 3 });
  await ablage(c, "upload_chunk", { token: v.token, offset: 0, daten: b64("neu") });
  const v2 = await ablage(c, "upload_abschliessen", { token: v.token, sha256: sha("neu") });
  assert.equal(v2.version, 2);
  const vs = await ablage(c, "versionen", { datei: d.datei });
  assert.equal(vs.versionen.length, 2);
  const w = await ablage(c, "version_wiederherstellen", { datei: d.datei, version: 1 });
  assert.equal(w.version, 3);
  assert.equal(w.versionen[0].wiederhergestellt_aus, 1);
  // Gesperrte Endung und zu groß
  await assert.rejects(ablage(c, "upload_start", { ordner, dateiname: "x.exe", groesse: 1 }), (e) => ablageCode(e) === "blocked_type");
  await assert.rejects(ablage(c, "upload_start", { ordner, dateiname: "x.pdf", groesse: 3 * 1024 ** 3 }), (e) => ablageCode(e) === "too_large");
});

test("Freigabelinks: erstellen, auflösen (Service), Passwort, abgelaufen, aufgebraucht, widerrufen", async () => {
  const db = neueDb();
  const svc = client(db, SERVICE);
  const info = await ablage(svc, "freigabe_aufloesen", { token: DEMO_TOKENS.aktiv, nur_info: 1 });
  assert.equal(info.dateiname, "Rendering Kochinsel Abend.jpg");
  assert.equal(info.url, undefined, "nur_info ohne URL");
  await assert.rejects(ablage(svc, "freigabe_aufloesen", { token: DEMO_TOKENS.passwort }), (e) => ablageCode(e) === "password_required");
  await assert.rejects(ablage(svc, "freigabe_aufloesen", { token: DEMO_TOKENS.passwort, passwort: "falsch1" }), (e) => e.code === "forbidden");
  const ok = await ablage(svc, "freigabe_aufloesen", { token: DEMO_TOKENS.passwort, passwort: DEMO_PASSWORT });
  assert.ok(ok.url.startsWith("mock:"));
  await assert.rejects(ablage(svc, "freigabe_aufloesen", { token: DEMO_TOKENS.abgelaufen }), (e) => ablageCode(e) === "expired");
  await assert.rejects(ablage(svc, "freigabe_aufloesen", { token: DEMO_TOKENS.aufgebraucht }), (e) => ablageCode(e) === "expired");
  await assert.rejects(ablage(svc, "freigabe_aufloesen", { token: DEMO_TOKENS.widerrufen }), (e) => ablageCode(e) === "invalid_token");
  await assert.rejects(ablage(svc, "freigabe_aufloesen", { token: "gibtEsNicht123" }), (e) => ablageCode(e) === "invalid_token");
  await assert.rejects(ablage(client(db, CRM), "freigabe_aufloesen", { token: DEMO_TOKENS.aktiv }), (e) => e.code === "forbidden", "nur Service/Admin");
  // Neuer Link: Token nur einmal, Passwortregel, keine E-Mail im Hinweis
  const d = dateiNach(db, "Rendering Essplatz.jpg");
  const c = client(db, CRM);
  await assert.rejects(ablage(c, "freigabelink_erstellen", { datei: d.name, passwort: "kurz" }), (e) => e.code === "invalid");
  await assert.rejects(ablage(c, "freigabelink_erstellen", { datei: d.name, empfaenger_hinweis: "a@b.at" }), (e) => e.code === "invalid");
  const l = await ablage(c, "freigabelink_erstellen", { datei: d.name, tage: 3, max_downloads: 2 });
  assert.ok(l.token && l.url.endsWith(`/f/${l.token}`));
  const liste = await ablage(c, "freigabelinks", { datei: d.name });
  assert.equal(liste.items.length, 1);
  assert.equal(liste.items[0].token, undefined, "Token nie wieder");
  assert.equal(db.db.get("PH Datei").get(d.name).freigabelinks_aktiv, 1);
  await ablage(svc, "freigabe_aufloesen", { token: l.token });
  await ablage(svc, "freigabe_aufloesen", { token: l.token });
  await assert.rejects(ablage(svc, "freigabe_aufloesen", { token: l.token }), (e) => ablageCode(e) === "expired", "Download-Grenze");
  const w = await ablage(c, "freigabelink_widerrufen", { freigabelink: l.freigabelink });
  assert.ok(["Widerrufen", "Aufgebraucht"].includes(w.status));
});

test("Ordner: anlegen (idempotent), umbenennen, verschieben (nicht in sich selbst), löschen nur leer; GF nur lesend", async () => {
  const db = neueDb();
  const c = client(db, PROJ);
  const eltern = dateiNach(db, "Baustelle Tag 1.jpg").ordner;
  const o = await ablage(c, "ordner_anlegen", { titel: "Detailfotos", eltern });
  const o2 = await ablage(c, "ordner_anlegen", { titel: "detailfotos", eltern });
  assert.equal(o2.ordner, o.ordner);
  assert.equal(o.bezug_doctype, "PH Projekt");
  const u = await ablage(c, "ordner_umbenennen", { ordner: o.ordner, titel: "Details" });
  assert.match(u.pfad, /\/ Details$/);
  await assert.rejects(ablage(c, "ordner_verschieben", { ordner: o.ordner, eltern: o.ordner }), (e) => e.code === "invalid");
  await assert.rejects(ablage(c, "ordner_loeschen", { ordner: eltern }), (e) => e.code === "conflict");
  assert.equal((await ablage(c, "ordner_loeschen", { ordner: o.ordner })).geloescht, true);
  await assert.rejects(ablage(client(db, GF), "ordner_anlegen", { titel: "X", eltern }), (e) => e.code === "forbidden");
  await assert.rejects(ablage(client(db, GF), "umbenennen", { datei: dateiNach(db, "Rendering Essplatz.jpg").name, dateiname: "x" }), (e) => e.code === "forbidden");
});

test("Portal, Aufbewahrung, Tags, Verschieben (Personal bleibt im Personalordner)", async () => {
  const db = neueDb();
  const c = client(db, PROJ);
  const d = dateiNach(db, "Rendering Essplatz.jpg");
  const p = await ablage(c, "portal_freigeben", { datei: d.name, freigeben: 1 });
  assert.equal(p.portal_freigabe, 1);
  const allgemein = dateiNach(db, "Briefpapier Platzhirsch.docx");
  await assert.rejects(ablage(client(db, ADMIN), "portal_freigeben", { datei: allgemein.name, freigeben: 1 }), (e) => e.code === "invalid");
  const t = await ablage(c, "tags_setzen", { datei: d.name, tags: ["Kunde", "kunde", "Abend"], beschreibung: "Für die Präsentation" });
  assert.deepEqual(t.tags, ["Kunde", "Abend"]);
  const a = await ablage(c, "aufbewahrung_setzen", { datei: d.name, aufbewahrungsklasse: "Beleg", belegdatum: "2026-11-04" });
  assert.equal(a.aufbewahren_bis, "2033-12-31");
  assert.equal(a.loeschsperre, 1);
  const vertrag = dateiNach(db, "Dienstvertrag.pdf");
  await assert.rejects(ablage(client(db, ADMIN), "verschieben", { datei: vertrag.name, ordner: d.ordner }), (e) => e.code === "forbidden");
});

test("Register: Commit-Aktion, Kürzel, Zu-tun, Routen, Fähigkeiten", () => {
  assert.equal(typeof abAktionen["ablage.portal"], "function");
  assert.deepEqual(pruefeAktionen({ ablage: abAktionen }), []);
  assert.ok(kuerzel.every((k) => /^shift\+[a-z]$/.test(k.taste) && k.id.startsWith("ablage.")));
  assert.ok(kuerzel.filter((k) => k.aussenwirkung).every((k) => k.nurDialog), "Außenwirkung nur als Dialog");
  assert.deepEqual(pruefeQuellen({ ablage: quellen }), []);
  assert.equal(bereich.routen["PH Datei"]("PH-DAT-2026-000001"), "/ablage/datei/PH-DAT-2026-000001");
  assert.equal(bereich.routen["PH Ordner"]("PH-ORD-000001"), "/ablage?ordner=PH-ORD-000001");
  assert.ok(Object.keys(ABLAGE).every((id) => id.startsWith("ablage.")));
  assert.equal(ABLAGE["ablage.ordner_freigabe"].erwartet, false);
});
