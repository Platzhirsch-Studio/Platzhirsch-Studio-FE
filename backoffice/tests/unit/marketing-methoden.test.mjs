// Bereich Marketing – Mock-Pfad der Fachaufrufe (MASTER § 5.3 Nr. 5) gegen den MockClient, Seed-Abdeckung, Register-
// Teildateien (Navigation, Kürzel, Zu tun, Freigaben, Commit-Aktionen), Fähigkeiten mit Text und Ersatzweg, Abnahme-Grep
// über die sichtbaren Strings (10-konzept-marketing § 14: kein „DOI“, „Bounce“, „Slot“, „Frappe“, „Workflow“ …).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ladeMetaIndex } from "../../src/lib/backoffice/frappe/meta.js";
import { baueDatenbank } from "../../src/lib/backoffice/mock/seed/index.js";
import { MockClient } from "../../src/lib/backoffice/mock/client.js";
import * as M from "../../src/lib/backoffice/marketing/methoden.js";
import { STATUS_TEXT, VERBOTEN } from "../../src/lib/backoffice/marketing/texte.js";
import { CHIP_REIHE, TOENE } from "../../src/lib/backoffice/marketing/status.js";
import { MARKETING, S } from "../../src/lib/backoffice/marketing/faehigkeiten.js";
import { pruefeAktionen } from "../../src/lib/backoffice/commit/aktionen/index.js";
import marketingAktionen from "../../src/lib/backoffice/commit/aktionen/marketing.js";
import bereich from "../../src/lib/backoffice/bereiche/marketing.js";
import { pruefeBereiche } from "../../src/lib/backoffice/bereiche/index.js";
import kuerzel from "../../src/lib/backoffice/kuerzel/marketing.js";
import { pruefeKuerzel } from "../../src/lib/backoffice/kuerzel/kern.js";
import { KUERZEL } from "../../src/lib/backoffice/kuerzel/index.js";
import aufgaben from "../../src/lib/backoffice/aufgaben/marketing.js";
import { pruefeQuellen } from "../../src/lib/backoffice/aufgaben/index.js";
import freigaben from "../../src/lib/backoffice/freigaben/marketing.js";
import { pruefeFreigaben } from "../../src/lib/backoffice/freigaben/index.js";
import { SEED_VERSION } from "../../src/lib/backoffice/mock/seed/marketing.js";

const index = ladeMetaIndex();
const LEITUNG = { user: "admin@demo.local", name: "Leitung", roles: ["System Manager"] };
const TEAM = { user: "marketing@demo.local", name: "Team", roles: ["PH Marketing Mitarbeiter"] };

function frisch(session = LEITUNG) {
  const db = { ...baueDatenbank(index), kommentare: new Map(), versionen: new Map(), dateien: new Map() };
  return new MockClient(session, { index, db, jetzt: () => new Date(2026, 10, 4, 10, 0) });
}

test("Seed: jeder Status je Liste ist vertreten, Seed-Marke gesetzt, nur Beispieladressen", () => {
  const c = frisch();
  const st = (dt) => new Set([...c.tabelle(dt).values()].map((d) => d.status));
  for (const s of ["Entwurf", "Freigabe", "Geplant", "Versendet", "Abgebrochen"]) assert.ok(st("PH Newsletter Ausgabe").has(s), s);
  for (const s of CHIP_REIHE.abo) assert.ok(st("PH Newsletter Abo").has(s), s);
  for (const s of CHIP_REIHE.einwilligung) assert.ok(st("PH Einwilligung").has(s), s);
  for (const s of CHIP_REIHE.event) assert.ok(st("PH Event").has(s), s);
  for (const s of CHIP_REIHE.kampagne) assert.ok(st("PH Kampagne").has(s), s);
  for (const s of ["Idee", "Entwurf", "Freigegeben", "Geplant", "Veroeffentlicht", "Verworfen"]) assert.ok(st("PH Social Beitrag").has(s), s);
  assert.equal(c.tabelle("PH Kundenreise").size, 7);
  assert.equal(c.tabelle("PH Mail Vorlage").size, 17);
  assert.equal(c.tabelle("PH Marketing Einstellungen").get("PH Marketing Einstellungen")._seed_marketing, SEED_VERSION);
  for (const a of c.tabelle("PH Newsletter Abo").values()) assert.match(a.email, /@beispiel\.invalid$/);
});

test("Newsletter: anlegen → speichern → zur Freigabe → freigeben (Termin) → jetzt versenden → Fortschritt → versendet", async () => {
  const c = frisch();
  const neu = await M.ausgabeAnlegen(c, { slug: "2027-01" });
  assert.equal(neu.status, "Entwurf");
  assert.equal(neu.bloecke.length, 5);
  const bloecke = [{ typ: "brief", text: "Hallo" }, { typ: "neueStuecke", text: "Tisch", bild: "/a.jpg", bild_alt: "Tisch" }, { typ: "gutZuWissen", titel: "T", text: "x" }];
  const { doc } = await M.ausgabeSpeichern(c, { name: neu.name, modified: neu.modified, felder: { betreff: "Januar" }, bloecke });
  assert.equal(doc.versandbereit, 1);
  assert.equal(doc.bloecke[1].bildquelle, "eigen", "die Action setzt die Bildquelle selbst");
  await assert.rejects(() => M.ausgabeSpeichern(c, { name: neu.name, modified: "2000-01-01 00:00:00", felder: {} }), (e) => e.code === "conflict");
  await M.ausgabeZurFreigabe(c, neu.name);
  assert.equal(c.tabelle("PH Newsletter Ausgabe").get(neu.name).status, "Freigabe");
  // Bearbeiten in „Wartet auf Freigabe“ setzt zurück auf Entwurf (P-M8)
  const zurueck = await M.ausgabeSpeichern(c, { name: neu.name, felder: { betreff: "Januar 2" } });
  assert.equal(zurueck.zurueck, true);
  assert.equal(zurueck.doc.status, "Entwurf");
  await M.ausgabeFreigeben(c, { name: neu.name, versand_geplant: "2027-01-07 18:00:00" });
  assert.equal(c.tabelle("PH Newsletter Ausgabe").get(neu.name).status, "Geplant");
  await M.ausgabeJetztVersenden(c, neu.name);
  const st = await M.ausgabeVersandStand(c, neu.name);
  assert.equal(st.status, "Versendet");
  await assert.rejects(() => M.ausgabeSpeichern(c, { name: neu.name, felder: { betreff: "x" } }), /versendet/i);
});

test("Empfänger: Keine Werbung = genau ein Abmelden + Widerruf je anderem Zweck; Papier-Einwilligung nur mit Beleg", async () => {
  const c = frisch();
  const email = "maria.muster@beispiel.invalid";
  await M.aboAbmelden(c, { email, kanal: "antwort_mail" });
  assert.equal(c.tabelle("PH Newsletter Abo").get(email).status, "Abgemeldet");
  const nl = [...c.tabelle("PH Einwilligung").values()].filter((w) => w.email === email && w.zweck === "newsletter");
  assert.ok(nl.every((w) => w.status === "Widerrufen"));
  const ein = [...c.tabelle("PH Einwilligung").values()].find((w) => w.email === email && w.zweck === "einladungen");
  await M.einwilligungWiderrufen(c, { name: ein.name });
  assert.equal(c.tabelle("PH Einwilligung").get(ein.name).status, "Widerrufen");
  await assert.rejects(() => M.einwilligungPapier(c, { email, zweck: "einladungen", textversion: "x" }), (e) => e.code === "invalid");
  const p = await M.einwilligungPapier(c, { email, zweck: "einladungen", textversion: "x", beleg: "/private/files/a.pdf" });
  assert.equal(p.doi_noetig, 0);
  assert.equal(p.status, "Bestaetigt");
  const r = await M.bestaetigungErneutSenden(c, ["julia.testner24@beispiel.invalid", email]);
  assert.ok(r.uebersprungen.length >= 1);
  await M.newsletterAnmelden(c, { email: "neu@beispiel.invalid", quelle: "showroom" });
  assert.equal(c.tabelle("PH Newsletter Abo").get("neu@beispiel.invalid").status, "Angemeldet unbestaetigt", "nie sofort aktiv");
});

test("Events: Anmeldung (keine Werbe-Einwilligung), doppelt, Check-in doppelt erkannt, Nachrücken, Erinnerung, Absage", async () => {
  const c = frisch();
  const vorher = c.tabelle("PH Einwilligung").size;
  const r = await M.anmeldungHinzufuegen(c, { event: "designabend-licht", name_person: "Neu", email: "neu.gast@beispiel.invalid", personen: 1 });
  assert.equal(r.status, "angemeldet");
  assert.equal(c.tabelle("PH Einwilligung").size, vorher, "R1: Anmeldung speichert keine Einwilligung");
  await assert.rejects(() => M.anmeldungHinzufuegen(c, { event: "designabend-licht", name_person: "Neu", email: "neu.gast@beispiel.invalid" }), (e) => e.code === "conflict");
  await assert.rejects(() => M.anmeldungHinzufuegen(c, { event: "adventsabend-2026", name_person: "X", email: "x@beispiel.invalid" }), /Veröffentlichen/);
  const ev = c.tabelle("PH Event").get("designabend-licht");
  const zeile = ev.anmeldungen.find((a) => a.status === "angemeldet").name;
  assert.equal((await M.einchecken(c, { event: ev.name, zeile })).status, "ok");
  assert.equal((await M.einchecken(c, { event: ev.name, zeile })).status, "bereits");
  assert.equal(await M.nachruecken(c, { event: "kuechenabend-2026" }), 1);
  assert.ok((await M.erinnerungSenden(c, { event: "designabend-licht" })) > 0);
  const abs = await M.eventAbsagen(c, { event: "pflege-workshop", grund: "Krankheit" });
  assert.equal(c.tabelle("PH Event").get("pflege-workshop").status, "Abgesagt");
  assert.equal(abs.mails, 0);
});

test("Social: Zur Freigabe → wartet (Aufgabe) → Freigeben → automatisch Geplant; Kennzahlen; Datum für jeden Status", async () => {
  const c = frisch();
  const name = "PH-SOC-2026-0011"; // Entwurf mit Bild
  await M.socialZurFreigabe(c, { name });
  assert.ok((await M.wartendeSocial(c)).has(name));
  await M.socialFreigeben(c, { name });
  assert.equal(c.tabelle("PH Social Beitrag").get(name).status, "Geplant");
  assert.equal((await M.wartendeSocial(c)).has(name), false);
  await M.socialDatumSetzen(c, { name: "PH-SOC-2026-0005", datum: "2026-11-20" });
  assert.equal(c.tabelle("PH Social Beitrag").get("PH-SOC-2026-0005").datum_geplant, "2026-11-20");
  await assert.rejects(() => c.workflowAction("PH Social Beitrag", "PH-SOC-2026-0007", "Freigeben"), /Bedingung/);
});

test("Kampagnen: Kennzahl „12,50“ → 1 250 Cent, Aggregate ohne Neuladen; Empfehlung: Zuordnung nur mit Zustimmung", async () => {
  const c = frisch();
  const vorher = c.tabelle("PH Kampagne").get("PH-KAM-2026-0002").ausgaben_cent;
  const doc = await M.kennzahlErfassen(c, { name: "PH-KAM-2026-0002", zeile: { datum: "2026-11-04", kosten_cent: 1250, klicks: 4 } });
  assert.equal(doc.ausgaben_cent, vorher + 1250);
  assert.equal(doc.klicks_gesamt, 4);
  await assert.rejects(() => M.auftragZuordnen(c, { code: "EMP-2B8MN4", auftrag: "AB-2026-00001" }), /Zustimmung/);
  await M.empfehlungAblehnen(c, { code: "EMP-2B8MN4", grund: "Test" });
  assert.equal(c.tabelle("PH Empfehlung").get("EMP-2B8MN4").status, "Abgelehnt");
});

test("Kundenreise: Aktivieren prüft Regeln und Kanzlei-Freigabe; Zielgruppen-Vorschau mit Ausschlussgründen", async () => {
  const c = frisch();
  await M.reiseAktivieren(c, "pflege");
  await assert.rejects(() => M.reiseAktivieren(c, "outdoor"), /Kanzlei/);
  const v = await M.segmentVorschau(c, { name: "kueche-bodensee" });
  assert.ok(v.treffer >= v.empfaenger);
  assert.ok(v.ausgeschlossen);
  const dup = await M.reiseDuplizieren(c, { quelle: "danke", titel: "Danke Outdoor" });
  assert.equal(dup.status, "Entwurf");
});

test("Register: Navigation 6 + Mehr, Routen, Kürzel kollisionsfrei, Zu tun, Freigaben, Commit-Aktionen", () => {
  assert.equal(bereich.navigation.length, 13);
  assert.ok(bereich.navigation.slice(0, 6).every((n) => !n.recht));
  assert.equal(bereich.routen["PH Newsletter Ausgabe"]("PH-NL-2026-001"), "/marketing/newsletter/PH-NL-2026-001");
  assert.deepEqual(pruefeBereiche().filter((b) => /marketing/i.test(b)), []);
  assert.deepEqual(pruefeKuerzel(KUERZEL).filter((b) => /marketing/.test(b)), []);
  assert.ok(kuerzel.every((k) => !/^[a-z]$/.test(k.taste)), "keine Einzelbuchstaben");
  assert.deepEqual(pruefeQuellen({ marketing: aufgaben }), []);
  assert.deepEqual(pruefeFreigaben({ marketing: freigaben }), []);
  assert.deepEqual(pruefeAktionen({ marketing: marketingAktionen }), []);
});

test("Fähigkeiten: jede Sperre hat Titel und Ersatzweg; Kernmethoden aus api/backoffice.py vorhanden", () => {
  for (const [id, d] of Object.entries(MARKETING)) {
    assert.ok(d.titel, id);
    assert.ok(d.ersatz?.titel, `${id} ohne Ersatzweg`);
  }
  assert.ok(MARKETING[S.anmeldung] && MARKETING[S.checkin] && MARKETING[S.gutschein]);
});

test("Status-Texte vollständig (Umlaute), keine verbotenen Wörter in sichtbaren Strings des Bereichs", () => {
  for (const [gruppe, toene] of Object.entries(TOENE)) for (const s of Object.keys(toene)) assert.ok(STATUS_TEXT[gruppe]?.[s], `${gruppe}.${s}`);
  assert.equal(STATUS_TEXT.social.Veroeffentlicht, "Veröffentlicht");
  const wurzel = path.resolve("src");
  const dateien = [];
  const lauf = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) lauf(p);
      else if (/\.js$/.test(e.name) && e.name !== "texte.js") dateien.push(p);
    }
  };
  for (const d of ["app/marketing", "app/(kiosk)/checkin", "components/Backoffice/Marketing"]) lauf(path.join(wurzel, d));
  const befunde = [];
  for (const f of dateien) {
    const text = fs.readFileSync(f, "utf8").split("\n").filter((z) => !/^\s*(\/\/|\*|\/\*)/.test(z) && !/^\s*import /.test(z));
    for (const zeile of text) {
      // nur sichtbare Texte: JSX-Text zwischen > und < sowie Zeichenketten in Anführungszeichen
      const kandidaten = [...zeile.matchAll(/>([^<>{}]+)</g), ...zeile.matchAll(/"([^"]{3,})"/g)].map((m) => m[1]);
      for (const k of kandidaten) for (const w of VERBOTEN) if (new RegExp(`(^|[^\\w-])${w}([^\\w-]|$)`).test(k) && !/^[\w./@-]+$/.test(k)) befunde.push(`${path.relative(wurzel, f)}: „${k.trim()}“ enthält ${w}`);
    }
  }
  assert.deepEqual(befunde, []);
});
