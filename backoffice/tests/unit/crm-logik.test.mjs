// Unit-Tests Bereich CRM (Team B-CRM): reine Module – Status, Vorgang, Zu erledigen, Zeitleiste, E-Mails, Bilder.
//   node --test tests/unit/crm-logik.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { statusAnzeige, terminStatus, istVerfallen, toeneFuer } from "../../src/lib/backoffice/crm/status.js";
import { abgeleiteterStatus, alterText, aktuelleStufe, empfehlung, faelligText, kundenreise, kurzDatum, restTage, terminZeit, vorgangsSchritte } from "../../src/lib/backoffice/crm/vorgang.js";
import { heuteChips, hrefFuer, zuErledigenZeilen } from "../../src/lib/backoffice/crm/zuErledigen.js";
import { gruppiereZeitleiste, zeitleisteEintraege } from "../../src/lib/backoffice/crm/zeitleiste.js";
import { beispielMails, filtereMails, gruppiereMails, normalisiereMail, zuordnungErlaubt } from "../../src/lib/backoffice/crm/mails.js";
import { bildFuerName, raumBild } from "../../src/lib/backoffice/crm/bilder.js";
import { CRM_TEXTE as T, fehlerText } from "../../src/lib/backoffice/crm/texte.js";

const JETZT = new Date(2026, 10, 4, 12, 0, 0);

test("Status: Glossar statt gespeicherter Werte, Töne aus § 2.2", () => {
  assert.deepEqual(statusAnzeige("anfrage", "Qualifiziert"), { wert: "Qualifiziert", text: "Angenommen", ton: "tuerkis" });
  assert.equal(statusAnzeige("termin", "Bestaetigt").text, "Bestätigt");
  assert.equal(statusAnzeige("termin", "Unbestaetigt").ton, "orange");
  assert.equal(statusAnzeige("anfrage", "Spam").ton, "rot");
  assert.equal(statusAnzeige("kontakt", "Kunde").ton, "gruen");
  assert.ok(istVerfallen({ status: "Abgelehnt", storno_grund: "E-Mail nicht bestätigt" }));
  assert.equal(terminStatus({ status: "Abgelehnt", storno_grund: "E-Mail nicht bestätigt" }).text, "Verfallen");
  assert.equal(toeneFuer("gespraech").Abgeschlossen, "gruen");
});

test("Glossar: verbotene Wörter erscheinen in keinem Text (§ 15)", () => {
  const werte = [];
  const sammle = (x) => {
    if (typeof x === "string") werte.push(x);
    else if (typeof x === "function") werte.push(String(x(2, 3, 4)));
    else if (x && typeof x === "object") Object.values(x).forEach(sammle);
  };
  sammle(T);
  const alle = werte.join(" | ");
  for (const wort of ["Qualifizieren", "Posteingang", "Trichter", "Peek", "Studio", "Wiedervorlage", "Beratungsgespraech", "Bestaetigt", "Unbestaetigt"]) {
    assert.ok(!alle.includes(wort), `Text enthält „${wort}“`);
  }
  assert.ok(!/\b(beste[nrs]?\b|einzigartig|perfekt|revolution)/i.test(alle), "keine Superlative");
  assert.equal(fehlerText("not_found"), T.fehler.not_found);
  assert.equal(fehlerText("conflict", "Traceback ph_crm.x"), T.fehler.conflict, "technische Texte werden ersetzt");
});

test("Vorgang E1: abgeleiteter Status aus Termin und Angebot, Termin entfallen, passt nicht", () => {
  const a = { name: "A1", status: "Qualifiziert" };
  assert.equal(abgeleiteterStatus(a, { termine: [{ name: "T1", anfrage: "A1", status: "Bestaetigt", start: "2026-11-05 10:00:00" }] }).status, "Termin vereinbart");
  const entfallen = abgeleiteterStatus(a, { termine: [{ name: "T1", anfrage: "A1", status: "Storniert" }] });
  assert.equal(entfallen.entfallen, true);
  assert.equal(entfallen.text, "Termin entfallen");
  assert.equal(empfehlung(entfallen).id, "neuerTermin");
  const angebot = abgeleiteterStatus({ name: "A1", status: "Termin vereinbart" }, { angebote: [{ name: "AN-1", anfrage: "A1", status: "Gesendet" }, { name: "AN-0", anfrage: "A1", status: "Ersetzt" }] });
  assert.equal(angebot.status, "Angebot");
  assert.equal(angebot.passtNicht, true);
  assert.equal(abgeleiteterStatus({ name: "A2", status: "Gewonnen" }, { termine: [{ anfrage: "A2", status: "Bestaetigt" }] }).status, "Gewonnen", "Endzustand bleibt");
  assert.equal(empfehlung(abgeleiteterStatus({ name: "A3", status: "Neu" })).titel, "Annehmen");
  assert.equal(empfehlung(abgeleiteterStatus({ name: "A4", status: "Verloren" })), null);
});

test("Vorgang: Vorgangsleiste hat genau eine aktuelle Stufe", () => {
  const s = vorgangsSchritte({ anfrage: { name: "A", status: "Termin vereinbart", eingang: "2026-11-01 09:00:00" }, termine: [{ name: "T", status: "Bestaetigt", start: "2026-11-05 10:00:00" }] }, { href: (dt, n) => `/${dt}/${n}` });
  assert.deepEqual(s.map((x) => x.id), ["anfrage", "termin", "gespraech", "angebot", "auftrag"]);
  assert.equal(s.filter((x) => x.zustand === "aktuell").length, 1);
  assert.equal(s[1].zustand, "aktuell");
  assert.equal(s[1].objekte[0].href, "/PH Termin/T");
  const neu = vorgangsSchritte({ anfrage: { name: "A", status: "Neu" } });
  assert.equal(neu[0].zustand, "aktuell");
});

test("Kundenreise: 7 Stufen, verträgt fehlende Bereiche (null) und markiert eine aktuelle Karte", () => {
  const r = kundenreise({ anfragen: [{ name: "A", status: "Qualifiziert", eingang: "2026-10-01 09:00:00", quelle: "website" }], termine: [{ name: "T", status: "Bestaetigt", start: "2026-11-05 10:00:00", modus: "Showroom" }], angebote: null, rechnungen: null });
  assert.equal(r.length, 7);
  assert.equal(r[0].zustand, "erledigt");
  assert.equal(aktuelleStufe(r), 1);
  assert.equal(r.flatMap((x) => x.aufgaben).filter((x) => x.zustand === "aktuell").length, 1);
  assert.equal(kundenreise({}).every((x) => x.zustand === "offen"), true);
});

test("Zeit: Alter mit Wort, Fälligkeit, Datumsformen", () => {
  assert.equal(alterText("2026-11-04 06:00:00", { jetzt: JETZT, status: "Neu" }).wort, "wartet");
  assert.equal(alterText("2026-11-02 06:00:00", { jetzt: JETZT, status: "Neu" }).wort, "überfällig");
  assert.equal(alterText("2026-11-02 06:00:00", { jetzt: JETZT, status: "Qualifiziert" }).wort, "");
  assert.equal(faelligText("2026-11-04", JETZT).text, "heute · fällig");
  assert.match(faelligText("2026-11-01", JETZT).text, /überfällig/);
  assert.equal(kurzDatum("2026-11-04"), "4. Nov");
  assert.equal(terminZeit("2026-11-04 14:00:00"), "Mi 04.11. 14:00");
  assert.equal(restTage("2026-11-09", JETZT), 5);
  assert.equal(restTage("2026-11-03", JETZT), -1);
});

test("Zu erledigen: Reihenfolge nach Dringlichkeit, je Zeile genau ein Knopf", () => {
  const z = zuErledigenZeilen({
    aufgaben: [{ name: "K1", titel: "Angebot nachfassen", faellig: "2026-11-03", referenz_doctype: "PH Anfrage", referenz_name: "A9" }],
    neu: [{ name: "A2", titel: "Beratung: Max Muster", vorname: "Max", nachname: "Muster", eingang: "2026-11-04 10:00:00" }, { name: "A1", eingang: "2026-11-02 10:00:00", nachname: "Probe" }],
    zuBestaetigen: [{ name: "T1", start: "2026-11-05 10:00:00", modus: "Video", nachname: "Keller", email_verifiziert: 1 }],
    datenschutz: [{ name: "D1", art: "Auskunft", frist: "2026-11-09" }],
  }, { jetzt: JETZT });
  assert.deepEqual(z.map((x) => x.art), ["neu", "neu", "bestaetigen", "nachfassen", "datenschutz"]);
  assert.equal(z[0].objekt.name, "A1", "älteste zuerst");
  assert.equal(z[0].wort, "überfällig");
  assert.ok(z.every((x) => x.knopf && x.knopf.titel && (x.knopf.aktion || x.knopf.href)));
  assert.equal(z[3].href, "/crm/anfragen/A9");
  assert.equal(hrefFuer("PH Kontakt", "PH-KON-1"), "/kunden/PH-KON-1");
  assert.equal(heuteChips({ termine: 0, neu: 2 }).length, 1);
  assert.equal(heuteChips({}).length, 0);
});

test("Zeitleiste: Einträge aus allen Bezügen, Filter, Tagesgruppen", () => {
  const e = zeitleisteEintraege({
    anfragen: [{ name: "A", quelle: "website", status: "Neu", eingang: "2026-11-04 09:00:00", anliegen: "<p>Küche</p>" }],
    termine: [{ name: "T", modus: "Showroom", status: "Bestaetigt", start: "2026-11-03 10:00:00" }],
    rechnungen: null,
    docinfo: { comments: [{ name: "K", content: "Rückruf erledigt", creation: "2026-10-01 08:00:00", comment_type: "Comment", owner: "x" }] },
  });
  assert.equal(e.length, 3);
  assert.equal(e[0].zitat, "Küche");
  const g = gruppiereZeitleiste(e, { jetzt: JETZT });
  assert.deepEqual(g.gruppen.slice(0, 2).map((x) => x.titel), ["Heute", "Gestern"]);
  assert.equal(gruppiereZeitleiste(e, { filter: "kommentare", jetzt: JETZT }).anzahl, 1);
  assert.equal(gruppiereZeitleiste(e, { filter: "unbekannt", jetzt: JETZT }).filter, "alles");
});

test("E-Mails (Nr. 52): Live-Liste normalisiert, vertraulich nie automatisch, Filter", () => {
  const roh = beispielMails({ kontakte: [{ name: "K1", titel: "Familie Muster" }], jetzt: JETZT });
  const g = gruppiereMails(roh);
  assert.equal(g.gesamt, roh.length);
  assert.equal(g.zaehler.vertraulich, 1);
  assert.ok(g.mails[0].datum >= g.mails[1].datum, "neueste zuerst");
  const v = normalisiereMail({ message_id: "x", vertraulich: true });
  assert.equal(v.grund, "vertraulich");
  assert.equal(zuordnungErlaubt(v, { vonHand: false }), false);
  assert.equal(zuordnungErlaubt(v, { vonHand: true }), true);
  assert.equal(normalisiereMail({ message_id: "y", grund: "quatsch" }).grund, "unbekannt");
  assert.equal(filtereMails(g.mails, { grund: "mehrdeutig" }).every((m) => m.grund === "mehrdeutig"), true);
  assert.ok(roh.every((m) => /@beispiel\.invalid$|@architektur-beispiel\.invalid$/.test(m.gegenadresse)), "keine echten Adressen");
});

test("Bilder: nur im Mock ein Sortimentsbild, sonst eigenes Bild oder keins", () => {
  assert.equal(raumBild("Küche", { mock: false }), null);
  assert.match(raumBild("Küche", { mock: true }).src, /kueche/);
  assert.equal(raumBild("x", { eigen: "/files/a.jpg" }).src, "/files/a.jpg");
  assert.equal(bildFuerName("PH-KON-1", { mock: false }), null);
  assert.deepEqual(bildFuerName("PH-KON-1", { mock: true }), bildFuerName("PH-KON-1", { mock: true }));
});
