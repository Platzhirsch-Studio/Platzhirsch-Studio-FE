// Unit-Tests Akte und Vorgang (Team P0-5a): G-12 Vorgangsleiste, G-14 Gerüst/Slots/Bezüge,
// G-16 ErgebnisKarte, G-28 PersonZelle – reine Logik ohne React.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  aktuellerIndex,
  bezier,
  fortschritt,
  kartenDerStufe,
  kompaktePunkte,
  normalisiereSchritte,
  personenDerReise,
  stufenZustand,
  verbindungen,
  zustandVon,
} from "../../src/lib/backoffice/akte/vorgang.js";
import { AKTE_TABS, SLOT_API_VERSION, ladeSlot, ladeSlotsFuer, pruefeSlot, pruefeSlots, slotZaehler, slotsFuer } from "../../src/lib/backoffice/akte/slots.js";
import { SLOTS } from "../../src/lib/backoffice/akte/slots/index.js";
import { aktiverTab, anteil, begrenzeKacheln, begrenzeTabs, tabHref, waehleBand } from "../../src/lib/backoffice/akte/geruest.js";
import { personAnzeige, personGroesse } from "../../src/lib/backoffice/akte/person.js";
import { ergebnisKnoepfe } from "../../src/lib/backoffice/akte/ergebnis.js";
import { TEXTE } from "../../src/lib/backoffice/akte/texte.js";
import { anlegenHref, bezuegeAnzahl, bezuegeVon, bezugsTabelle, gruppiereBezuege, ladeBezuege, listeHref } from "../../src/lib/backoffice/bezuege.js";
import { metaIndex } from "../../src/lib/backoffice/frappe/meta.js";

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const lies = (p) => readFileSync(path.join(WURZEL, p), "utf8");
const INDEX = metaIndex({ dir: path.resolve(WURZEL, "..", "Backend-Import") });

// ------------------------------------------------------------------ Vorgang (G-12)

test("zustandVon: Entwurfs- und Backend-Schreibweisen, Unbekanntes ist offen", () => {
  assert.equal(zustandVon("fertig"), "erledigt");
  assert.equal(zustandVon("Aktiv"), "aktuell");
  assert.equal(zustandVon("entfällt"), "uebersprungen");
  assert.equal(zustandVon("irgendwas"), "offen");
  assert.equal(zustandVon(undefined), "offen");
});

test("stufenZustand: aus Aufgaben abgeleitet", () => {
  assert.equal(stufenZustand([{ zustand: "erledigt" }, { zustand: "uebersprungen" }]), "erledigt");
  assert.equal(stufenZustand([{ zustand: "erledigt" }, { zustand: "aktuell" }]), "aktuell");
  assert.equal(stufenZustand([{ zustand: "erledigt" }, { zustand: "offen" }]), "teilweise");
  assert.equal(stufenZustand([{ zustand: "offen" }]), "offen");
  assert.equal(stufenZustand([]), "offen");
  assert.equal(stufenZustand([{ zustand: "uebersprungen" }]), "uebersprungen");
});

test("normalisiereSchritte: eindeutige Ids, Titel-Ersatz, leere Aufgaben fallen weg", () => {
  const s = normalisiereSchritte([{ id: "a", titel: "Anfrage", aufgaben: [{ titel: "" }, { titel: "Rückruf", zustand: "fertig" }] }, { id: "a" }, null]);
  assert.equal(s.length, 2);
  assert.notEqual(s[0].id, s[1].id);
  assert.equal(s[1].titel, "Stufe 2");
  assert.equal(s[0].aufgaben.length, 1);
  assert.equal(s[0].zustand, "erledigt");
  assert.equal(s[1].abgeleitet, true);
});

test("kartenDerStufe: Stufe ohne Aufgaben zeigt letztes Objekt bzw. „noch keins“", () => {
  const [mit, ohne] = normalisiereSchritte([
    { id: "an", titel: "Angebot", zustand: "erledigt", datum: "12.10.", objekte: [{ titel: "AG-1" }, { titel: "AG-2", href: "/x" }] },
    { id: "au", titel: "Auftrag", zustand: "offen" },
  ]);
  const k1 = kartenDerStufe(mit);
  assert.equal(k1[0].titel, "AG-2");
  assert.equal(k1[0].href, "/x");
  assert.equal(k1[0].datum, "12.10.");
  const k2 = kartenDerStufe(ohne, { nochKeins: TEXTE.vorgang.nochKeins });
  assert.equal(k2[0].titel, "noch keins");
  assert.equal(k2[0].leer, true);
});

test("aktuellerIndex + fortschritt: zählt Aufgaben, Übersprungenes nicht", () => {
  const s = normalisiereSchritte([
    { id: "1", aufgaben: [{ titel: "a", zustand: "erledigt" }, { titel: "b", zustand: "erledigt" }] },
    { id: "2", aufgaben: [{ titel: "c", zustand: "erledigt" }, { titel: "d", zustand: "aktuell" }, { titel: "e", zustand: "uebersprungen" }] },
    { id: "3", aufgaben: [{ titel: "f" }] },
  ]);
  assert.equal(aktuellerIndex(s), 1);
  const f = fortschritt(s);
  assert.deepEqual({ erledigt: f.erledigt, gesamt: f.gesamt, nr: f.nr, stufen: f.stufen }, { erledigt: 3, gesamt: 5, nr: 2, stufen: 3 });
});

test("aktuellerIndex: erste offene nach der letzten erledigten, alles erledigt → -1", () => {
  const s = normalisiereSchritte([{ zustand: "erledigt" }, { zustand: "uebersprungen" }, { zustand: "offen" }, { zustand: "offen" }]);
  assert.equal(aktuellerIndex(s), 2);
  assert.equal(aktuellerIndex(normalisiereSchritte([{ zustand: "erledigt" }, { zustand: "erledigt" }])), -1);
  assert.equal(aktuellerIndex(normalisiereSchritte([{ zustand: "offen" }, { zustand: "teilweise" }])), 1);
});

test("personenDerReise: eindeutig in Reihenfolge des Auftretens", () => {
  const s = normalisiereSchritte([{ aufgaben: [{ titel: "a", person: "Lena M" }, { titel: "b", person: { name: "Jonas F" } }] }, { aufgaben: [{ titel: "c", person: "Lena M" }, { titel: "d" }] }]);
  assert.deepEqual(personenDerReise(s).map((p) => p.name), ["Lena M", "Jonas F"]);
});

test("verbindungen: von letzter nicht offener Karte zur ersten der nächsten Spalte, offen gestrichelt", () => {
  const l = verbindungen([
    { links: 0, rechts: 100, karten: [{ mitte: 20 }, { mitte: 60 }, { mitte: 100, offen: true }] },
    { links: 128, rechts: 228, karten: [{ mitte: 30, offen: true }] },
    { links: 256, rechts: 356, karten: [] },
  ]);
  assert.equal(l.length, 1);
  assert.deepEqual({ x1: l[0].x1, y1: l[0].y1, x2: l[0].x2, y2: l[0].y2, offen: l[0].offen }, { x1: 100, y1: 60, x2: 128, y2: 30, offen: true });
  assert.equal(bezier(0, 0, 100, 10), "M 0 0 C 75 0, 25 10, 100 10");
});

test("kompaktePunkte: title mit Zustand und Datum", () => {
  const p = kompaktePunkte(normalisiereSchritte([{ titel: "Anfrage", zustand: "erledigt", datum: "01.11." }]), (z) => TEXTE.vorgang.zustand[z]);
  assert.equal(p[0].title, "Anfrage: erledigt · 01.11.");
});

// ------------------------------------------------------------------ Slots (G-14)

const slot = (x = {}) => ({ id: "faktura.belege", bereich: "faktura", akte: "kunde", tab: "projekte-belege", titel: "Belege", lade: async () => [1], Komponente: () => null, ...x });

test("Slot-API v1: eingefroren, je Akte genau 6 Reiter", () => {
  assert.equal(SLOT_API_VERSION, 1);
  assert.equal(AKTE_TABS.kunde.length, 6);
  assert.equal(AKTE_TABS.projekt.length, 6);
  assert.ok(Object.isFrozen(AKTE_TABS));
  assert.match(lies("src/lib/backoffice/akte/slots.js"), /SLOT-API v1 · EINGEFROREN/);
});

test("pruefeSlot: Pflichtfelder, Reiter der Akte, Bereichspräfix", () => {
  assert.deepEqual(pruefeSlot(slot()), []);
  assert.ok(pruefeSlot(slot({ tab: "planung" })).some((f) => f.includes("Reiter")));
  assert.ok(pruefeSlot(slot({ id: "crm.belege" })).some((f) => f.includes("Bereich")));
  assert.ok(pruefeSlot(slot({ lade: null })).some((f) => f.includes("lade")));
  assert.ok(pruefeSlot(slot({ akte: "rechnung" })).length > 0);
  assert.ok(pruefeSlot(slot({ breite: "drittel" })).length > 0);
  assert.ok(pruefeSlots([slot(), slot()]).some((f) => f.includes("doppelt")));
});

test("slotsFuer: Recht falsch oder werfend blendet aus, Reihenfolge stabil", () => {
  const reg = [
    slot({ id: "faktura.b", reihenfolge: 20 }),
    slot({ id: "faktura.a", reihenfolge: 10 }),
    slot({ id: "faktura.c", recht: () => false }),
    slot({ id: "faktura.d", recht: () => { throw new Error("x"); } }),
    slot({ id: "faktura.e", tab: "service" }),
    slot({ id: "kaputt" }),
  ];
  assert.deepEqual(slotsFuer({ akte: "kunde", tab: "projekte-belege", register: reg }).map((s) => s.id), ["faktura.a", "faktura.b"]);
  assert.equal(slotZaehler({ akte: "kunde", register: reg }).service, 1);
});

test("ladeSlot: wirft nie, Fehler/Zeitlimit nur für diesen Slot, leer()", async () => {
  const ok = await ladeSlot(slot({ lade: async () => [], leer: (d) => d.length === 0 }), {}, "K-1");
  assert.deepEqual(ok, { ok: true, daten: [], leer: true });
  const f = await ladeSlot(slot({ lade: async () => { throw Object.assign(new Error("Frappe 500"), { code: "unavailable" }); } }), {}, "K-1");
  assert.equal(f.ok, false);
  assert.equal(f.code, "unavailable");
  const z = await ladeSlot(slot({ lade: () => new Promise(() => {}), zeitlimitMs: 20 }), {}, "K-1");
  assert.equal(z.ok, false);
  const alle = await ladeSlotsFuer({ akte: "kunde", tab: "projekte-belege", id: "K-1", register: [slot({ id: "faktura.x", lade: async () => { throw new Error("y"); } }), slot({ id: "faktura.y" })] });
  assert.deepEqual(alle.map((e) => e.ergebnis.ok), [false, true]);
});

test("Slot-Register: leer und gültig (keine Beispiel-Slots im Betrieb)", () => {
  assert.deepEqual(pruefeSlots(SLOTS), []);
});

// ------------------------------------------------------------------ Gerüst (G-14)

test("waehleBand: höchstens eines, kleinster Rang gewinnt, inaktive fallen weg", () => {
  assert.equal(waehleBand([]), null);
  const b = waehleBand([{ rang: 3, titel: "C" }, { rang: 1, titel: "A", aktiv: false }, { rang: 2, titel: "B", ton: "warnung" }]);
  assert.equal(b.titel, "B");
  assert.equal(b.ton, "warnung");
  assert.equal(waehleBand([{ rang: 1, ton: "bunt", text: "x" }]).ton, "info");
});

test("begrenzeTabs/begrenzeKacheln: 6 Reiter, 4 Glas-Kacheln, Rest gemeldet", () => {
  const t = begrenzeTabs(Array.from({ length: 8 }, (_, i) => ({ id: `t${i}`, titel: `T${i}` })));
  assert.equal(t.tabs.length, 6);
  assert.equal(t.rest.length, 2);
  assert.equal(begrenzeKacheln([1, 2, 3, 4, 5]).kacheln.length, 4);
});

test("tabHref: erster Reiter ohne Parameter, übrige Parameter bleiben, eigener Parametername", () => {
  assert.equal(tabHref("/projekte/P-1", "uebersicht", { tab: "planung", f: "1" }, "uebersicht"), "/projekte/P-1?f=1");
  assert.equal(tabHref("/projekte/P-1", "planung", {}, "uebersicht"), "/projekte/P-1?tab=planung");
  assert.equal(tabHref("/einstellungen", "planung", { tab: "system", baustein: "akte" }, "uebersicht", "reiter"), "/einstellungen?tab=system&baustein=akte&reiter=planung");
  assert.equal(aktiverTab([{ id: "a" }, { id: "b" }], "x"), "a");
  assert.equal(anteil(1.4), 1);
  assert.equal(anteil("x"), 0);
});

// ------------------------------------------------------------------ Bezüge (G-14, 05 § 5.3)

test("bezugsTabelle: aus Backend-Import, beide Richtungen, nur PH-DocTypes", () => {
  const t = bezugsTabelle(INDEX);
  assert.ok(t.length > 100);
  assert.ok(t.every((b) => b.doctype.startsWith("PH ")));
  assert.ok(t.some((b) => b.doctype === "PH Projekt" && b.feld === "kontakt" && b.zielDoctype === "PH Kontakt" && b.richtung === "zeigt_auf"));
  assert.ok(t.some((b) => b.doctype === "PH Kontakt" && b.zielDoctype === "PH Projekt" && b.richtung === "wird_gezeigt_von"));
});

test("bezuegeVon: Folgedokumente in der Reihenfolge des links-Abschnitts", () => {
  const { wirdGezeigtVon } = bezuegeVon("PH Projekt", INDEX);
  const links = INDEX.doctypes.get("PH Projekt").links.map((l) => l.link_doctype);
  assert.equal(wirdGezeigtVon[0].zielDoctype, links[0]);
  assert.equal(wirdGezeigtVon[0].gruppe, INDEX.doctypes.get("PH Projekt").links[0].group);
});

test("gruppiereBezuege: Kunde gehört dazu, Anfrage ist vorher, Rechte und „nicht verknüpft“", () => {
  const doc = { name: "PRJ-1", kontakt: "K-1", anfrage: "AN-1" };
  const g = gruppiereBezuege({ doctype: "PH Projekt", doc, index: INDEX, darf: (m, a) => !(m.name === "PH Anfrage" && a === "read") && !(a === "create" && m.name === "PH Rendering"), nachher: ["PH Planung", "PH Rendering", "PH Kassenbeleg"] });
  assert.deepEqual(g.gleichzeitig.map((e) => e.doctype), ["PH Kontakt"]);
  const anfrage = g.vorher.find((e) => e.doctype === "PH Anfrage");
  assert.equal(anfrage.keinZugriff, true);
  assert.equal(anfrage.href, null);
  assert.deepEqual(g.nachher.map((e) => e.doctype), ["PH Planung", "PH Rendering", "PH Kassenbeleg"]);
  assert.equal(g.nachher[0].href, listeHref("PH Planung", "projekt", "PRJ-1"));
  assert.equal(g.nachher[0].anlegenHref, anlegenHref("PH Planung", "projekt", "PRJ-1"));
  assert.equal(g.nachher[1].anlegenHref, null);
  assert.equal(g.nachher[2].nichtVerknuepft, true);
});

test("ladeBezuege: höchstens maxAbfragen Zähler, Fehler nur am Eintrag", async () => {
  let aufrufe = 0;
  const client = { count: async (dt, { filters }) => { aufrufe++; assert.deepEqual(filters, [[filters[0][0], "=", "PRJ-1"]]); if (dt === "PH Rendering") throw new Error("x"); return 2; } };
  const g = await ladeBezuege({ client, doctype: "PH Projekt", doc: { name: "PRJ-1" }, index: INDEX, darf: () => true, maxAbfragen: 3 });
  assert.equal(aufrufe, 3);
  assert.equal(g.abfragen, 3);
  assert.equal(g.nachher[0].anzahl, 2);
  assert.equal(g.nachher.find((e) => e.doctype === "PH Rendering").zaehlerFehlt, true);
  assert.equal(g.nachher[5].anzahl, null);
  assert.equal(bezuegeAnzahl(g), 4);
});

// ------------------------------------------------------------------ Person (G-28)

test("personAnzeige: fremde Abwesenheit nur „abwesend“, eigene mit Art", () => {
  const p = { name: "Sarah Bösch", abwesend: { art: "Krankenstand", bis: "07.11." } };
  assert.equal(personAnzeige(p).abwesendText, "abwesend");
  assert.ok(!JSON.stringify(personAnzeige(p)).includes("Krankenstand"));
  assert.equal(personAnzeige(p, { eigen: true }).abwesendText, "Krankenstand · bis 07.11.");
  assert.equal(personAnzeige(null).name, TEXTE.person.niemand);
  assert.equal(personAnzeige("x@beispiel.invalid").name, "x@beispiel.invalid");
  assert.equal(personAnzeige({ name: "A" }, { rolle: "Beratung" }).rolle, "Beratung");
  assert.equal(personGroesse(20), 24);
  assert.equal(personGroesse(40), 32);
});

// ------------------------------------------------------------------ ErgebnisKarte (G-16)

test("ergebnisKnoepfe: höchstens 3, Weiter hat Vorrang und steht zuletzt", () => {
  const k = ergebnisKnoepfe({ weiter: { titel: "Weiter", href: "/w" }, aktionen: [{ titel: "A", href: "/a" }, { titel: "B", onClick: () => {} }, { titel: "C", href: "/c" }, { titel: "" }] });
  assert.deepEqual(k.map((x) => x.titel), ["A", "B", "Weiter"]);
  assert.equal(k.at(-1).art, "weiter");
  assert.deepEqual(ergebnisKnoepfe({ weiter: { titel: "Ohne Ziel" } }), []);
});

// ------------------------------------------------------------------ Texte, Gestaltung

test("Texte: keine Ausrufezeichen, keine Superlative, Umlaute statt Umschreibung", () => {
  const werte = [];
  const sammle = (o) => Object.values(o).forEach((v) => (typeof v === "function" ? werte.push(String(v(1, 2, "X"))) : typeof v === "object" ? sammle(v) : werte.push(String(v))));
  sammle(TEXTE);
  const roh = werte.join(" | ");
  assert.ok(!roh.includes("!"));
  assert.ok(!/(beste|einzigartig|perfekt|erfolgreich)/i.test(roh));
  assert.ok(!/(Bezuege|Rueck|Uebersicht|Gespraech|naechst|zurueck|fuer|ueber)/i.test(roh), "Umschreibung statt Umlaut");
  assert.match(roh, /Bezüge/);
});

test("Akte-CSS: nur Token, keine Hex-Farben, keine Versalien", () => {
  for (const d of ["src/components/Backoffice/Akte/akte.css"]) {
    const css = lies(d);
    assert.ok(!/#[0-9a-f]{3,8}\b/i.test(css.replace(/\/\*[\s\S]*?\*\//g, "")), `${d}: Hex-Farbe`);
    assert.ok(!/text-transform:\s*uppercase/.test(css), `${d}: Versalien`);
    const globals = lies("src/app/globals.css") + lies("src/app/bo-motion.css");
    for (const m of css.matchAll(/var\((--[a-z0-9-]+)/g)) {
      if (m[1].startsWith("--bo-reise-") || m[1] === "--av") continue;
      assert.ok(globals.includes(`${m[1]}:`), `${d}: ${m[1]} ist nicht definiert`);
    }
  }
  for (const d of ["src/components/Backoffice/Akte/Vorgangsleiste.js", "src/components/Backoffice/Akte/Akte.js", "src/components/Backoffice/PersonZelle.js", "src/components/Backoffice/Ergebnis/ErgebnisKarte.js"]) {
    assert.ok(!/\buppercase\b/.test(lies(d)), `${d}: Versalien`);
  }
});
