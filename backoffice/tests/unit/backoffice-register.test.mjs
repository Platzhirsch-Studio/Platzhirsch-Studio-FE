// Register des Fundaments (P0-1, G-01/G-02, MASTER § 3.5): Bereiche, Palette, Seed, QA-Routen,
// Kürzel, Arbeitsplätze, Betrieb – keine doppelten Slugs/Routen/Kürzel, Aufteilung ohne Verhaltensänderung.
//   node --test tests/unit/backoffice-register.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { BEREICHE, BEREICH_SLUGS, MODUL_ZU_BEREICH, REIHENFOLGE, ROLLEN_NAMEN, ROUTEN, ZUSATZ_ROLLEN, bereichFuerDoctype, kanonischeRoute, navigationFuer, pruefeBereiche, umleitungFuerD, zentraleSeite } from "../../src/lib/backoffice/bereiche/index.js";
import * as bereicheAlt from "../../src/lib/backoffice/bereiche.js";
import { HILFE, NUMMERNMUSTER, SCHNELLAKTIONEN, SUCHE_BEREICHE, nummerErkennen, pruefeSuche } from "../../src/lib/backoffice/suche/index.js";
import { ausSerie, beispielAusSerie } from "../../src/lib/backoffice/suche/muster.js";
import { ANZAHL, SEED_BEREICHE, baueDatenbank, nachlaufReihenfolge, pruefeSeed } from "../../src/lib/backoffice/mock/seed/index.js";
import * as seedAlt from "../../src/lib/backoffice/mock/seed.js";
import { alleRouten, festeRouten, pruefeRouten, ROUTEN_BEREICHE } from "../../tools/qa/routen/index.mjs";
import * as routenAlt from "../../tools/qa/routen.mjs";
import { KUERZEL, KUERZEL_BEREICHE, aufloesen, gZiele, pruefeKuerzel, pruefeRegister, registriere } from "../../src/lib/backoffice/kuerzel/index.js";
import { anzeigeText, istEinzeltaste, normalisiere, tasteAusEreignis } from "../../src/lib/backoffice/kuerzel/kern.js";
import { ARBEITSPLAETZE, pruefeArbeitsplaetze } from "../../src/lib/backoffice/arbeitsplaetze.js";
import { ARBEITSPLAETZE as AP_RECHTE, darf, erlaubteArbeitsplaetze, sichtbareBereiche, zerlegeRolle } from "../../src/lib/backoffice/auth/rechte.js";
import { BETRIEB, betrieb } from "../../src/lib/backoffice/config.js";
import { erkenneCode, eanGueltig, normalisiereGutschein } from "../../src/lib/backoffice/codes.js";
import { ladeMetaIndex } from "../../src/lib/backoffice/frappe/meta.js";

const ZWOELF = ["zentrale", "crm", "projekte", "faktura", "shop", "sortiment", "logistik", "service", "kundenkarte", "marketing", "personal", "kassa"];
/** Q-B2 plus die Querschnittsbereiche Ablage (ph_ablage) und E-Mails (ph_microsoft, Slug „posteingang“). */
const ALLE = [...ZWOELF, "ablage", "posteingang"];

// ------------------------------------------------------------------ Bereiche --

test("Bereiche: vierzehn Teildateien, Reihenfolge Q-B2 + Ablage/E-Mails, keine Befunde", () => {
  assert.deepEqual(REIHENFOLGE, ALLE);
  assert.deepEqual(BEREICH_SLUGS, ALLE);
  assert.deepEqual(pruefeBereiche(), []);
  assert.equal(bereicheAlt.BEREICHE, BEREICHE, "Kompatibilitäts-Export bereiche.js zeigt auf dasselbe Register");
});

test("Bereiche: Modul-Zuordnung wie vor der Aufteilung", () => {
  assert.deepEqual(MODUL_ZU_BEREICH, {
    "PH Core": "zentrale", Core: "zentrale", "PH CRM": "crm", "PH Sortiment": "sortiment", "PH Projekte": "projekte", "PH Shop": "shop", "PH Faktura": "faktura",
    "PH Logistik": "logistik", "PH Personal": "personal", "PH Marketing": "marketing", "PH Kassa": "kassa", "PH Service": "service", "PH Kundenkarte": "kundenkarte",
    "PH Ablage": "ablage", "PH Microsoft": "posteingang",
  });
  assert.equal(bereichFuerDoctype("PH Aufgabe"), "crm", "PH Aufgabe: erster Nicht-Zentrale-Bereich wie bisher");
  assert.equal(bereichFuerDoctype("PH Rechnung"), "faktura");
  assert.equal(bereichFuerDoctype("PH Unbekannt", "PH Shop"), "shop");
  assert.equal(bereichFuerDoctype("PH Unbekannt"), "zentrale");
});

test("Bereiche: Prüfung meldet doppelte Slugs, Startseiten, Routen und generische Ziele", () => {
  const a = { slug: "aaa", titel: "A", icon: "X", startseite: "/a", doctypes: ["PH X", "PH Y"], routen: { "PH X": (n) => (n ? `/a/x/${n}` : "/a/x") } };
  const b = { slug: "aaa", titel: "B", icon: "X", startseite: "/a", doctypes: ["PH X"], routen: { "PH X": (n) => (n ? `/b/x/${n}` : "/a/x") } };
  const c = { slug: "ccc", titel: "C", icon: "X", startseite: "/c", doctypes: ["PH Z"], routen: { "PH Z": () => "/d/ph-z", "PH Fremd": () => "/c/f" }, navigation: [{ titel: "A", href: "/c" }, { titel: "B", href: "/c" }] };
  const befunde = pruefeBereiche([a, b, c]).join("\n");
  assert.match(befunde, /Slug doppelt: aaa/);
  assert.match(befunde, /Startseite doppelt: \/a/);
  assert.match(befunde, /Route doppelt: PH X/);
  assert.match(befunde, /Listenroute doppelt: \/a\/x/);
  assert.match(befunde, /kein eigenes Ziel \(\/d\/ph-z\)/);
  assert.match(befunde, /fremden DocType PH Fremd/);
  assert.match(befunde, /Navigation doppelt: \/c/);
  const r = pruefeBereiche([
    { slug: "rrr", titel: "R", icon: "X", startseite: "/r", rollenName: "CRM", doctypes: ["PH A"], rollen: { "PH CRM Mitarbeiter": "chef", "PH R Leitung": "leitung" } },
    { slug: "sss", titel: "S", icon: "X", startseite: "/s", rollenName: "CRM", doctypes: ["PH A"], rollen: { "PH CRM Leitung": "leitung" } },
  ]).join("\n");
  assert.match(r, /Rollenname doppelt: CRM/);
  assert.match(r, /Stufe für PH CRM Mitarbeiter ungültig/);
  assert.match(r, /eigene Rolle PH CRM Leitung gehört nicht in rollen/);
  assert.match(r, /DocType doppelt: PH A \(rrr, sss\)/);
});

test("Bereiche: Ablage und E-Mails – DocTypes der Apps, Navigation, Rollen aus dem Register", () => {
  const index = ladeMetaIndex();
  const ablage = BEREICHE.find((b) => b.slug === "ablage");
  const mail = BEREICHE.find((b) => b.slug === "posteingang");
  // Jeder DocType (ohne Kindtabellen) der Module PH Ablage / PH Microsoft gehört genau dem Bereich (Backend-Import, nur gelesen).
  for (const [b, modul] of [[ablage, "PH Ablage"], [mail, "PH Microsoft"]]) {
    const soll = [...index.doctypes.values()].filter((m) => m.module === modul && !m.istable).map((m) => m.name).sort();
    if (soll.length) assert.deepEqual([...b.doctypes].sort(), soll, `${b.slug}: DocTypes wie ${modul}`);
    for (const dt of b.doctypes) assert.equal(bereichFuerDoctype(dt), b.slug);
  }
  assert.equal(mail.titel, "E-Mails");
  assert.ok(!BEREICHE.some((b) => /posteingang/i.test(b.titel) || (b.navigation || []).some((n) => /posteingang/i.test(n.titel))), "Wort „Posteingang“ nie sichtbar (10-konzept-crm § 15)");
  assert.equal(ROLLEN_NAMEN.Ablage, "ablage");
  assert.deepEqual(zerlegeRolle("PH Ablage Leitung"), { bereich: "ablage", stufe: "leitung" });
  assert.equal(zerlegeRolle("PH Unbekannt Leitung"), null);
  assert.deepEqual(ZUSATZ_ROLLEN["PH CRM Mitarbeiter"].map((z) => z.bereich), ["ablage", "posteingang"]);
  const crm = { roles: ["PH CRM Mitarbeiter"] };
  assert.deepEqual(sichtbareBereiche(crm), ["zentrale", "crm", "ablage", "posteingang"]);
  assert.ok(darf(crm, "ablage", "create") && !darf(crm, "ablage", "export") && !darf(crm, "ablage", "delete"));
  assert.deepEqual(sichtbareBereiche({ roles: ["PH Ablage Mitarbeiter"] }), ["zentrale", "ablage"]);
  assert.deepEqual(sichtbareBereiche({ roles: ["PH Shop Mitarbeiter"] }), ["zentrale", "shop"], "Shop hat weder Ablage noch E-Mails");
  assert.ok(darf({ roles: ["PH Ablage Leitung"] }, "ablage", "export"));
  // Navigation mit Recht: Verlauf (Ablage) und Postfächer/Kalender/Abgleich (E-Mails) nur Leitung/GF/Admin.
  const erlaubtFuer = (sitzung) => (recht) => darf(sitzung, recht.bereich, recht.aktion);
  assert.deepEqual(navigationFuer(ablage, { erlaubt: erlaubtFuer(crm) }).map((n) => n.titel), ["Übersicht", "Dateien", "Ordner", "Freigabelinks"]);
  assert.deepEqual(navigationFuer(mail, { erlaubt: erlaubtFuer(crm) }).map((n) => n.titel), ["Nicht zugeordnet", "Adressen und Sperren"]);
  assert.equal(navigationFuer(mail, { erlaubt: erlaubtFuer({ roles: ["PH Geschäftsführung"] }) }).length, 5);
  // Jedes Navigationsziel /d/<slug> zeigt auf einen DocType des Bereichs.
  for (const b of [ablage, mail]) for (const n of b.navigation) if (n.doctype) assert.ok(b.doctypes.includes(n.doctype) && n.href === `/d/${n.doctype.toLowerCase().replace(/ /g, "-")}`, n.href);
});

test("Bereiche: Navigation – Rückfall, Recht, leerer Bereich", () => {
  const crm = BEREICHE.find((b) => b.slug === "crm");
  const nav = navigationFuer(crm);
  assert.equal(nav[0].titel, "Übersicht");
  assert.equal(nav.length, 7, "Übersicht + sechs DocTypes");
  assert.equal(nav[1].href, "/d/ph-anfrage", "ohne kanonische Route bleibt /d/<slug>");
  const mitRecht = { slug: "x", startseite: "/x", doctypes: [], navigation: [{ titel: "Offen", href: "/x" }, { titel: "Leitung", href: "/x/l", recht: "admin" }, { titel: "Fremd", href: "/x/f", recht: { bereich: "faktura", aktion: "read" } }] };
  const gesehen = [];
  const nurLesen = navigationFuer(mitRecht, { erlaubt: (r) => (gesehen.push(r), r.aktion === "read" && r.bereich === "x") });
  assert.deepEqual(nurLesen.map((n) => n.titel), ["Offen"]);
  assert.deepEqual(gesehen, [{ aktion: "admin", bereich: "x" }, { aktion: "read", bereich: "faktura" }]);
  assert.deepEqual(navigationFuer({ slug: "leer", startseite: "/leer", doctypes: [] }), []);
});

test("Bereiche: kanonische Routen und 307-Ziel (noch nichts registriert → generische Seite bleibt)", () => {
  assert.equal(ROUTEN.size, [...BEREICHE].reduce((n, b) => n + Object.keys(b.routen || {}).length, 0));
  assert.equal(kanonischeRoute("PH Anfrage"), ROUTEN.has("PH Anfrage") ? kanonischeRoute("PH Anfrage") : null);
  if (!ROUTEN.has("PH Anfrage")) assert.equal(umleitungFuerD({ doctype: "PH Anfrage", name: "PH-ANF-2026-00001" }), null);
  assert.equal(umleitungFuerD({ doctype: "PH Anfrage", name: "neu" }), null, "Neu leitet nie um");
  assert.equal(zentraleSeite("einstellungen"), "/einstellungen");
  assert.equal(zentraleSeite("verwaltung"), null);
});

// -------------------------------------------------------------------- Palette --

test("Palette: Schnellaktionen in alter Reihenfolge und Form", () => {
  assert.deepEqual(
    SCHNELLAKTIONEN.map((a) => [a.titel, a.href, a.bereich, a.aktion, a.doctype ?? null]),
    [
      ["Neue Anfrage", "/d/ph-anfrage/neu", "crm", "create", "PH Anfrage"],
      ["Neuer Kontakt", "/d/ph-kontakt/neu", "crm", "create", "PH Kontakt"],
      ["Neuer Termin", "/d/ph-termin/neu", "crm", "create", "PH Termin"],
      ["Neue Aufgabe", "/d/ph-aufgabe/neu", "zentrale", "read", "PH Aufgabe"],
      ["Neues Projekt", "/d/ph-projekt/neu", "projekte", "create", "PH Projekt"],
      ["Neues Angebot", "/d/ph-angebot/neu", "faktura", "create", "PH Angebot"],
      ["Neuer Servicefall", "/d/ph-servicefall/neu", "service", "create", "PH Servicefall"],
      ["Arbeitsplatz wechseln", "/arbeitsplatz", "zentrale", "read", null],
      ["Gerät registrieren", "/geraet", "zentrale", "read", null],
    ]
  );
  assert.deepEqual(Object.keys(SUCHE_BEREICHE).sort(), [...ALLE].sort());
  assert.deepEqual(HILFE, []);
});

test("Palette: Nummernmuster aus den naming_series, eindeutig, keine Überschneidung", () => {
  assert.deepEqual(pruefeSuche(undefined, beispielAusSerie), []);
  assert.ok(NUMMERNMUSTER.length >= 70);
  assert.equal(ausSerie("PH-S-.YY.MM.DD.-.#####").source, "^PH-S-\\d{2}\\d{2}\\d{2}-\\d{5,}$");
  assert.equal(beispielAusSerie("PH-ANF-.YYYY.-.#####"), "PH-ANF-2026-00001");
  assert.deepEqual(nummerErkennen(" re-2026-00114 "), { doctype: "PH Rechnung", name: "RE-2026-00114", bereich: "faktura" });
  assert.equal(nummerErkennen("PH-S-261104-00012").doctype, "PH Bestellung");
  assert.equal(nummerErkennen("PH-LB-00001").doctype, "PH Lagerbestand");
  assert.equal(nummerErkennen("PH-LBW-2026-00001").doctype, "PH Lagerbewegung");
  assert.equal(nummerErkennen("ENTW-2026-00007").doctype, "PH Rechnung");
  assert.deepEqual(nummerErkennen("ph-dat-2026-000042"), { doctype: "PH Datei", name: "PH-DAT-2026-000042", bereich: "ablage" });
  assert.equal(nummerErkennen("PH-ORD-000007").doctype, "PH Ordner");
  assert.equal(nummerErkennen("Sofa grau"), null);
  // Jede Serie der DocType-JSONs hat ein Muster (Abgleich mit Backend-Import, nur gelesen).
  const index = ladeMetaIndex();
  const serien = [...index.doctypes.values()].filter((m) => !m.istable).map((m) => ({ dt: m.name, f: m.fields.find((f) => f.fieldname === "naming_series") })).filter((x) => x.f?.default);
  for (const { dt, f } of serien) assert.equal(nummerErkennen(beispielAusSerie(f.default))?.doctype, dt, `Nummernmuster fehlt für ${dt} (${f.default})`);
  const ueberlapp = pruefeSuche({ crm: { nummernmuster: [{ serie: "PH-X-.#####", doctype: "PH A" }, { regex: /^PH-X-\d+$/, doctype: "PH B" }] } }, beispielAusSerie);
  assert.match(ueberlapp.join("\n"), /passt auf mehrere DocTypes/);
  assert.match(pruefeSuche({ crm: { schnellaktionen: [{ id: "x", titel: "T", href: "/x" }, { id: "x", titel: "T", href: "/x" }] } }).join("\n"), /Aktions-ID doppelt: x/);
});

// ----------------------------------------------------------------------- Seed --

function fingerabdruck(index) {
  const { db, zaehler } = baueDatenbank(index);
  const zufall = /^[a-z0-9]{10}$/; // autoname "hash" nutzt Math.random – nur Position zählt
  const obj = { db: [...db].map(([k, m]) => [k, [...m].map(([n, d], i) => (zufall.test(n) ? [`#${i}`, { ...d, name: `#${i}` }] : [n, d]))]), zaehler: [...zaehler] };
  return createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}

test("Seed: vierzehn Teildateien, keine Befunde, Reihenfolge der alten Erzeugung", () => {
  assert.deepEqual(Object.keys(SEED_BEREICHE).sort(), [...ALLE].sort());
  assert.deepEqual(pruefeSeed(), []);
  assert.deepEqual(Object.keys(ANZAHL).slice(0, 4), ["PH Anfrage", "PH Kontakt", "PH Termin", "PH Aufgabe"]);
  assert.equal(ANZAHL["PH API Protokoll"], 40);
  assert.equal(seedAlt.baueDatenbank, baueDatenbank, "Kompatibilitäts-Export mock/seed.js zeigt auf dasselbe Modul");
});

test("Seed: deterministisch und Fachwissen je Bereich greift", () => {
  const index = ladeMetaIndex();
  assert.equal(fingerabdruck(index), fingerabdruck(index));
  const { db } = baueDatenbank(index);
  const anfragen = [...db.get("PH Anfrage").values()];
  assert.equal(anfragen.length, 24);
  assert.ok(anfragen.every((a) => a.workflow_state === `PH ${a.status}` && a.titel.startsWith(`${a.art}: `)));
  assert.ok([...db.get("PH Kontakt").values()].every((k) => !k.email || k.email.endsWith("@beispiel.invalid")));
  assert.equal(db.get("PH Firma").size, 1);
  assert.ok(db.get("PH Kasse").has("KASSE-LOCHAU-01"));
});

test("Seed: Ablage und E-Mails nur über eigene Nachläufe (Fachbereiche unverändert)", () => {
  // Ablage/E-Mails setzen weder anzahl noch kern – beides liefe über den gemeinsamen Zufall.
  for (const slug of ["ablage", "posteingang"]) {
    assert.deepEqual(SEED_BEREICHE[slug].anzahl, {});
    assert.deepEqual(SEED_BEREICHE[slug].kern, {});
  }
  const index = ladeMetaIndex();
  if (!index.doctypes.has("PH Datei") || !index.doctypes.has("PH Postfach")) return;
  const { db } = baueDatenbank(index);
  const ordner = [...db.get("PH Ordner").values()];
  const dateien = [...db.get("PH Datei").values()];
  assert.ok(ordner.length > 8 && dateien.length > 6);
  assert.ok(dateien.every((d) => db.get("PH Ordner").has(d.ordner)), "jede Datei liegt in einem Ordner");
  assert.ok(ordner.every((o) => !o.parent_ph_ordner || db.get("PH Ordner").has(o.parent_ph_ordner)), "Ordnerbaum geschlossen");
  assert.ok(dateien.some((d) => d.status === "Papierkorb") && dateien.some((d) => d.gesperrt_von), "Papierkorb und Check-out als Fälle");
  assert.ok(dateien.every((d) => /^PH-DAT-\d{4}-\d{6}$/.test(d.name)));
  const pf = [...db.get("PH Postfach").values()];
  assert.ok(pf.length === 3 && pf.every((p) => p.adresse.endsWith("@beispiel.invalid") && p.benutzer.length === 1));
  const adr = [...db.get("PH Mail Adresse").values()];
  assert.ok(adr.some((a) => a.art === "Sperre") && adr.filter((a) => a.art === "Zuordnung").every((a) => db.get("PH Kontakt").has(a.kontakt_name)));
});

test("Seed: Nachlauf-Reihenfolge über `nach`, Kreis und Doppelbesitz werden gemeldet", () => {
  assert.equal(nachlaufReihenfolge().length, 14);
  assert.ok(nachlaufReihenfolge().indexOf("projekte") < nachlaufReihenfolge().indexOf("ablage"));
  assert.deepEqual(nachlaufReihenfolge({ a: { nach: ["b"] }, b: { nach: [] }, c: {} }), ["b", "a", "c"]);
  assert.match(pruefeSeed({ a: { nach: ["b"] }, b: { nach: ["a"] } }).join("\n"), /im Kreis/);
  assert.match(pruefeSeed({ a: { nach: ["zz"] } }).join("\n"), /unbekannte Abhängigkeit/);
  assert.match(pruefeSeed({ a: { anzahl: { "PH X": 2 } }, b: { kern: { "PH X": () => {} } } }).join("\n"), /PH X in a und b/);
  assert.match(pruefeSeed({ a: { anzahl: { "PH X": 2.5 } } }).join("\n"), /Anzahl für PH X ungültig/);
});

// ----------------------------------------------------------------- QA-Routen --

test("QA-Routen: Teildateien, feste Seiten in alter Reihenfolge, keine Dubletten", () => {
  assert.deepEqual(Object.keys(ROUTEN_BEREICHE).sort(), [...ALLE, "fundament"].sort());
  assert.deepEqual(pruefeRouten(), []);
  assert.deepEqual(
    festeRouten().slice(0, 15).map((r) => r.pfad),
    ["/login", "/", "/arbeitsplatz", "/d/PH%20Anfrage", "/d/PH%20Anfrage?ansicht=kanban", null, "/kassa", "/packtisch", "/montage", "/technik", "/einstellungen", "/benutzer", "/protokoll", "/geraet", "/wechsel"]
  );
  const alle = alleRouten();
  const pfade = alle.map((r) => r.pfad).filter(Boolean);
  assert.equal(new Set(pfade).size, pfade.length);
  assert.ok(alle.every((r) => !("rang" in r)));
  assert.ok(alle.some((r) => r.pfad === "/einstellungen?tab=system&baustein=register"));
  assert.ok(alle.some((r) => r.pfad === "/ablage" && r.bereich === "ablage") && alle.some((r) => r.pfad === "/posteingang" && r.bereich === "posteingang"));
  assert.equal(routenAlt.alleRouten, alleRouten);
  assert.match(pruefeRouten({ a: [{ pfad: "/x", titel: "X" }], b: [{ pfad: "/x", titel: "Y" }, { pfad: null, titel: "Z" }] }).join("\n"), /Route doppelt: \/x[\s\S]*ohne ersterDatensatz/);
});

// ------------------------------------------------------------------- Kürzel --

const ev = (key, o = {}) => ({ key, target: null, ...o });
const feld = { tagName: "INPUT", closest: () => ({}) };

test("Kürzel: keine Doppelbelegung je Kontext, Bereichsregeln eingehalten", () => {
  assert.deepEqual(pruefeRegister(), []);
  assert.deepEqual(Object.keys(KUERZEL_BEREICHE).sort(), [...ALLE].sort());
  assert.ok(KUERZEL.some((k) => k.kontext === "kiosk-kassa@kassa" && k.taste === "f2"));
  for (const k of KUERZEL) assert.equal(normalisiere(k.taste), k.taste, `${k.id} kanonisch`);
  const g = KUERZEL.filter((k) => k.gruppe === "Gehe zu").map((k) => k.taste.split(" ")[1]).sort().join("");
  assert.equal(g, "abcdefhklmopstvwz", "K-10: siebzehn Gehe-zu-Buchstaben");
});

test("Kürzel: Prüfung erkennt Kollisionen und Regelverstöße", () => {
  const basis = [{ kontext: "global", taste: "n", id: "global.neu", titel: "Neu" }];
  const b = pruefeKuerzel([
    ...basis,
    { kontext: "liste", taste: "n", id: "liste.n", titel: "Doppelt zu global" },
    { kontext: "akte@faktura", taste: "alt+r", id: "faktura.r", titel: "Alt-Buchstabe" },
    { kontext: "akte@faktura", taste: "shift+m", id: "faktura.mail", titel: "Mail", aussenwirkung: true },
    { kontext: "kiosk-kassa@kassa", taste: "b", id: "kassa.b", titel: "Buchstabe im Kiosk" },
    { kontext: "liste", taste: "g", id: "liste.g", titel: "G allein" },
    { kontext: "liste", taste: "g x", id: "liste.gx", titel: "G-Folge" },
    { kontext: "akte", taste: "Shift+P", id: "akte.p", titel: "nicht kanonisch" },
    { kontext: "nirgends", taste: "q", id: "x.q", titel: "Kontext" },
  ]).join("\n");
  assert.match(b, /Doppelbelegung „n“ in \[global, liste\]/);
  assert.match(b, /faktura\.r: Bereichsaktion nur als Umschalt\+Buchstabe/);
  assert.match(b, /faktura\.mail: Aktion mit Außenwirkung/);
  assert.match(b, /kassa\.b: Kiosk ohne Einzelbuchstaben/);
  assert.match(b, /„g“ \(liste\.g\) ist zugleich Anfang der Folge „g x“/);
  assert.match(b, /akte\.p: Taste nicht kanonisch/);
  assert.match(b, /unbekannter Kontext nirgends/);
  // Zwei Bereiche dürfen dieselbe Umschalt-Taste in ihrem eigenen Akten-Kontext haben.
  assert.deepEqual(pruefeKuerzel([{ kontext: "akte@crm", taste: "shift+r", id: "crm.r", titel: "R" }, { kontext: "akte@faktura", taste: "shift+r", id: "faktura.r", titel: "R" }]), []);
  assert.throws(() => registriere("global", "Strg+K", { id: "test.doppelt", titel: "Doppelt" }), /Doppelbelegung/);
  const ab = registriere("liste", "shift+q", { id: "test.q", titel: "Q" });
  assert.equal(aufloesen(ev("Q", { shiftKey: true }), ["global", "liste"])?.eintrag.id, "test.q");
  ab();
  assert.equal(aufloesen(ev("Q", { shiftKey: true }), ["global", "liste"]), null);
});

test("Kürzel: Auflösen – Eingabefeld, Einzeltasten aus, Folge, Mac, Alt", () => {
  assert.equal(aufloesen(ev("k", { ctrlKey: true }), ["global"]).eintrag.id, "global.palette");
  assert.equal(aufloesen(ev("k", { metaKey: true }), ["global"], { mac: true }).eintrag.id, "global.palette");
  assert.equal(aufloesen(ev("k", { metaKey: true }), ["global"]), null, "Windows-Taste ist kein Strg");
  assert.equal(aufloesen(ev("x", { target: feld }), ["global", "liste"]), null, "Einzeltaste nie im Eingabefeld");
  assert.equal(aufloesen(ev("x"), ["global", "liste"], { einzeltasten: false }), null, "Einzeltasten abschaltbar");
  assert.equal(aufloesen(ev("s", { ctrlKey: true, target: feld }), ["global", "akte"]).eintrag.id, "akte.speichern", "Strg+S wirkt im Feld");
  assert.equal(aufloesen(ev("z", { ctrlKey: true, target: feld }), ["global"]), null, "Strg+Z bleibt im Feld Text-Rückgängig");
  assert.equal(aufloesen(ev("Escape", { target: feld }), ["global"]).eintrag.id, "global.schliessen");
  assert.equal(aufloesen(ev("?", { shiftKey: true }), ["global"]).eintrag.id, "global.hilfe");
  assert.equal(aufloesen(ev("/", { ctrlKey: true, shiftKey: true }), ["global"]).eintrag.id, "global.kuerzel", "Strg+/ auch mit Umschalt (deutsche Tastatur)");
  assert.equal(aufloesen(ev("¡", { altKey: true, code: "Digit1" }), ["global", "akte"], { mac: true }).eintrag.id, "akte.tab-1");
  assert.equal(aufloesen(ev(" "), ["global", "liste"]).eintrag.id, "liste.vorschau");
  const f = aufloesen(ev("g"), ["global", "liste"], { jetzt: 1000 });
  assert.equal(f.art, "folge");
  assert.equal(f.bis, 2500);
  assert.equal(aufloesen(ev("c"), ["global"], { folge: f, jetzt: 1200 }).eintrag.id, "global.gehe-c");
  assert.equal(aufloesen(ev("Escape"), ["global"], { folge: f, jetzt: 1200 }).art, "abbruch");
  assert.equal(aufloesen(ev("c"), ["global", "liste"], { folge: f, jetzt: 3000 }).eintrag.id, "liste.kommentar", "nach 1,5 s gilt die Einzeltaste wieder");
  assert.equal(aufloesen(ev("F2"), ["kiosk", "kiosk-kassa@kassa"]).eintrag.id, "kassa.kunde");
  assert.equal(aufloesen(ev("F2"), ["kiosk", "kiosk-packtisch@logistik"]).eintrag.id, "logistik.scanfeld");
});

test("Kürzel: Schreibweise, Einzeltasten-Erkennung, Anzeige", () => {
  assert.equal(normalisiere("Strg+Umschalt+P"), "mod+shift+p");
  assert.equal(normalisiere("Ctrl+/"), "mod+/");
  assert.equal(normalisiere("G C"), "g c");
  assert.equal(normalisiere("Esc"), "escape");
  assert.equal(normalisiere("+"), "+");
  assert.equal(tasteAusEreignis({ key: "P", shiftKey: true }), "shift+p");
  assert.equal(tasteAusEreignis({ key: "Shift", shiftKey: true }), "");
  assert.equal(tasteAusEreignis({ key: "Enter", shiftKey: true }), "shift+enter");
  assert.ok(istEinzeltaste("shift+p") && istEinzeltaste("g c") && istEinzeltaste("?"));
  assert.ok(!istEinzeltaste("mod+k") && !istEinzeltaste("f8") && !istEinzeltaste("escape") && !istEinzeltaste("alt+1"));
  assert.equal(anzeigeText("mod+shift+p"), "Strg+Umschalt+P");
  assert.equal(anzeigeText("mod+shift+p", true), "⌘⇧P");
  assert.equal(anzeigeText("g c"), "G dann C");
});

test("Kürzel: Gehe-zu-Ziele nur für sichtbare Bereiche und vorhandene Seiten", () => {
  const z = gZiele({ bereiche: ["zentrale", "crm"] });
  assert.deepEqual(z.map((x) => x.taste), ["g z", "g a", "g c", "g e"]);
  assert.equal(z.find((x) => x.taste === "g c").href, "/crm");
  assert.deepEqual(gZiele({ bereiche: [] }), []);
});

// ------------------------------------------------------- Arbeitsplätze, Betrieb --

test("Arbeitsplätze: Register mit Ziffern 1–5, Rechte unverändert", () => {
  assert.deepEqual(pruefeArbeitsplaetze(), []);
  assert.equal(AP_RECHTE, ARBEITSPLAETZE, "auth/rechte.js liest das Register");
  assert.deepEqual(ARBEITSPLAETZE.map((a) => a.ziffer), [1, 2, 3, 4, 5]);
  assert.deepEqual(erlaubteArbeitsplaetze(["PH Kassa Mitarbeiter"]).map((a) => a.slug), ["backoffice", "kassa"]);
  assert.deepEqual(erlaubteArbeitsplaetze(["System Manager"]).map((a) => a.slug), ["backoffice", "kassa", "packtisch", "montage", "technik"]);
  assert.match(pruefeArbeitsplaetze([{ slug: "a", ziffer: 1, href: "/a", route: "/a", kiosk: true }, { slug: "a", ziffer: 1, href: "/b", route: "/a" }]).join("\n"), /slug doppelt[\s\S]*ziffer doppelt[\s\S]*route doppelt/);
});

test("Betrieb: Inhaber-Standards als Einstellungen (Q-A8)", () => {
  assert.equal(betrieb("vierAugenGrenzeCent"), 0);
  assert.equal(betrieb("mitarbeiterauswertung"), false);
  assert.equal(betrieb("kassaNotbetrieb"), false);
  assert.ok(Object.isFrozen(BETRIEB));
  assert.throws(() => betrieb("gibtsNicht"), /Unbekannte Betriebs-Einstellung/);
});

// --------------------------------------------------------------------- Codes --

test("Codes: Formate der Frappe-Apps", () => {
  assert.equal(erkenneCode("PHE1.EV-2026-01.Z1.ab12").art, "event-qr");
  assert.equal(erkenneCode("_R1-AT1_K1_1000_2026").art, "kassenbeleg-qr");
  assert.deepEqual([erkenneCode("ph-7k3q x9ma 2bcd-efgh").art, erkenneCode("ph-7k3q x9ma 2bcd-efgh").wert], ["gutschein", "PH-7K3Q-X9MA-2BCD-EFGH"]);
  assert.equal(erkenneCode("TEST-PH-7K3Q-X9MA-2BCD-EFGH").test, true);
  assert.equal(normalisiereGutschein("PH-0K3Q-X9MA-2BCD-EFGH"), null, "0 gehört nicht zum Alphabet");
  assert.equal(erkenneCode("kk-7k3qx9").name, "KK-7K3QX9");
  assert.equal(erkenneCode("RE-2026-00114").doctype, "PH Rechnung");
  assert.equal(erkenneCode("KASSE-LOCHAU-01-001000").art, "kassenbeleg");
  assert.ok(eanGueltig("4006381333931") && eanGueltig("96385074") && !eanGueltig("4006381333932"));
  assert.equal(erkenneCode("4006381333931").art, "ean");
  assert.equal(erkenneCode("12345678").art, "text", "falsche Prüfziffer ist kein EAN");
  assert.deepEqual([erkenneCode("Lager Lochau/R1-03").lagerort, erkenneCode("Lager Lochau/R1-03").platz], ["Lager Lochau", "R1-03"]);
  assert.equal(erkenneCode("https://platzhirsch.studio/p/sofa-240?x=1").slug, "sofa-240");
  assert.equal(erkenneCode("AB7KQ2").art, "text", "Abholcode nur auf Wunsch");
  assert.equal(erkenneCode("ab7kq2", { abholcode: true }).wert, "AB7KQ2");
  assert.equal(erkenneCode("").art, "text");
});
