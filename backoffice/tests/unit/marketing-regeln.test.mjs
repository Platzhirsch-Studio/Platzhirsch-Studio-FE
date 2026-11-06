// Bereich Marketing – reine Regeln (10-konzept-marketing § 13.3 regeln.js, § 14 Abnahme): Newsletter-Bereitschaft wie
// regeln.py, Werbefenster/Sperrtage, erster Donnerstag, nächste Kennung, interne Testadresse, Bestätigungsmail-Sperre,
// „Keine Werbung mehr“-Plan ohne doppelten Newsletter-Widerruf, Reise-Prüfung wie pruefe_reise, Kennzahlen-CSV,
// Event-Plätze/Anmeldung/Nachrücken/Check-in, Social-Prüfungen, Empfehlungs-Ampeln, Status-Töne, Band-Regel.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as R from "../../src/lib/backoffice/marketing/regeln.js";
import { ton } from "../../src/lib/backoffice/marketing/status.js";
import { bandFuer } from "../../src/lib/backoffice/marketing/band.js";
import { newsletterHtml, vorlageFuellen, sicheresHtml } from "../../src/lib/backoffice/marketing/vorschau.js";

const voll = [
  { typ: "brief", text: "Liebe Leserinnen" },
  { typ: "neueStuecke", text: "Tisch", bild: "/x.jpg", bild_alt: "Tisch", bildquelle: "eigen" },
  { typ: "skizze" },
  { typ: "gutZuWissen", titel: "Tipp", text: "Holz" },
];

test("Newsletter: Bereitschaft = Brief + Neue Stücke/Skizze + zwei Inhaltsblöcke (Spiegel regeln.py)", () => {
  assert.equal(R.versandbereit(voll), true);
  const b = R.bereitschaft(voll);
  assert.equal(b.bereit, true);
  assert.equal(b.ok, 3);
  const ohneBrief = R.bereitschaft(voll.slice(1));
  assert.equal(ohneBrief.bereit, false);
  assert.equal(ohneBrief.fehlt, "Brief fehlt");
  // Herstellerbild zählt nie im Newsletter (nur „eigen“)
  assert.equal(R.blockSichtbar({ ...voll[1], bildquelle: "Hersteller freigegeben" }), false);
  assert.deepEqual(R.offeneSlots(voll), ["skizze"]);
  assert.equal(R.blockZustand({ typ: "skizze" }).art, "leer");
  assert.equal(R.blockZustand({ typ: "skizze", text: "x", bild: "/a.jpg", bildquelle: "eigen" }).grund, "Bildbeschreibung fehlt");
});

test("Werbefenster: Montag nicht erlaubt, Dienstag erlaubt, 24.12. Sperrtag (gesperrt im Picker)", () => {
  assert.equal(R.werbungErlaubt("2026-11-02"), false); // Montag
  assert.equal(R.werbungErlaubt("2026-11-03"), true); // Dienstag
  assert.equal(R.istSperrtag("2026-12-24"), true);
  const p = R.pruefeVersandtermin("2026-12-24 18:00");
  assert.equal(p.gesperrt, true);
  assert.match(p.grund, /Sperrtag/);
  const sa = R.pruefeVersandtermin("2026-11-07 18:00");
  assert.equal(sa.gesperrt, false);
  assert.ok(sa.hinweis);
  assert.match(R.werbefensterSatz("2026-11-02").satz, /Montag/);
});

test("Vorschlag Versand: erster Donnerstag 18:00; nächste freie Kennung JJJJ-MM", () => {
  const d = R.ersterDonnerstag(new Date(2026, 10, 4, 10, 0));
  assert.equal(R.isoTag(d), "2026-11-05");
  assert.equal(d.getHours(), 18);
  assert.equal(R.isoTag(R.ersterDonnerstag(new Date(2026, 10, 6))), "2026-12-03");
  assert.equal(R.naechsteKennung(["2026-11", "2026-10", "2026-12-en"], new Date(2026, 10, 4)), "2026-12");
  assert.equal(R.naechsteKennung([], new Date(2026, 10, 4)), "2026-11");
  assert.equal(R.monatAusSlug("2026-11"), "November 2026");
});

test("Adressen: Tippfehler-Vorschlag und Testmail nur an interne Adressen (U19)", () => {
  assert.equal(R.domainVorschlag("anna@gmx.ar"), "anna@gmx.at");
  assert.equal(R.domainVorschlag("anna@gmx.at"), null);
  const k = { testadresse: "team@beispiel.invalid", benutzer: ["admin@demo.local"], domains: ["platzhirsch.studio"] };
  assert.equal(R.istIntern("team@beispiel.invalid", k), true);
  assert.equal(R.istIntern("info@platzhirsch.studio", k), true);
  assert.equal(R.istIntern("kunde@gmail.com", k), false);
});

test("Bestätigungsmail erneut: nur Unbestätigt, frühestens 60 min nach der letzten (R4)", () => {
  const jetzt = new Date(2026, 10, 4, 10, 0);
  assert.equal(R.bestaetigungErneut({ status: "Aktiv" }, jetzt).ok, false);
  assert.equal(R.bestaetigungErneut({ status: "Abgemeldet" }, jetzt).grund, "abgemeldet");
  const kurz = R.bestaetigungErneut({ status: "Angemeldet unbestaetigt", doi_gesendet_am: "2026-11-04 09:40:00" }, jetzt);
  assert.equal(kurz.ok, false);
  assert.equal(kurz.grund, "kurz");
  assert.equal(R.bestaetigungErneut({ status: "Angemeldet unbestaetigt", doi_gesendet_am: "2026-11-04 08:00:00" }, jetzt).ok, true);
  const v = R.vorschauBestaetigung([{ email: "a", status: "Angemeldet unbestaetigt" }, { email: "b", status: "Abgemeldet" }, { email: "c", status: "Beschwerde" }], jetzt);
  assert.equal(v.moeglich.length, 1);
  assert.match(v.gruende, /1 abgemeldet, 1 als Spam gemeldet/);
});

test("Keine Werbung mehr: ein Abmelden, je anderem werblichen Zweck ein Widerruf, nie doppelt für Newsletter", () => {
  const p = R.keineWerbungPlan({
    abo: { status: "Aktiv" },
    einwilligungen: [
      { name: "a", zweck: "newsletter", status: "Bestaetigt" },
      { name: "b", zweck: "einladungen", status: "Bestaetigt" },
      { name: "c", zweck: "einladungen", status: "Offen" },
      { name: "d", zweck: "foto_referenz", status: "Bestaetigt" },
      { name: "e", zweck: "pflege_nachkauf", status: "Widerrufen" },
    ],
  });
  assert.equal(p.abmelden, true);
  assert.deepEqual(p.widerrufen, ["b"]);
  assert.equal(R.keineWerbungPlan({ abo: { status: "Aktiv" }, umfang: "newsletter" }).widerrufen.length, 0);
  assert.equal(R.keineWerbungPlan({ abo: null, umfang: "kontakt" }).kontaktsperre, true);
  assert.equal(R.loeschenErlaubt({ status: "Aktiv" }), false);
  assert.equal(R.loeschenErlaubt({ status: "Abgemeldet" }), true);
});

test("Kundenreise: Regelprüfung wie pruefe_reise; aktive Reise mit Regeländerung braucht neue Freigabe", () => {
  assert.deepEqual(R.pruefeReise({ werbung: 0, grundlage_v: 1, trigger: [{}] }), []);
  assert.ok(R.pruefeReise({ werbung: 1, grundlage_v: 1, trigger: [{}] }).includes("Werbung kann nicht auf Vertrag/Service (V) gestützt werden"));
  assert.ok(R.pruefeReise({ werbung: 1, grundlage_b: 1, trigger: [{}] }).includes("B ohne Begründung eigene, ähnliche Produkte"));
  assert.ok(R.pruefeReise({ werbung: 1, grundlage_e: 1, zweck: "newsletter", trigger: [] }).includes("kein Auslöser"));
  assert.ok(R.pruefeReise({ werbung: 0, grundlage_v: 1, trigger: [{}] }, "<p>Ihr Gutschein</p>").some((f) => /Werbewörter/.test(f)));
  assert.ok(R.pruefeReise({ werbung: 1, grundlage_e: 1, zweck: "newsletter", trigger: [{}] }, "<p>Hallo</p>").includes("Werbung ohne Abmeldelink in der Vorlage"));
  assert.equal(R.reiseBrauchtNeueFreigabe({ status: "Aktiv", vorlage: "a" }, { status: "Aktiv", vorlage: "b" }), true);
  assert.equal(R.reiseBrauchtNeueFreigabe({ status: "Entwurf", vorlage: "a" }, { vorlage: "b" }), false);
  assert.equal(R.ausloeserSatz({ ausloeser_typ: "jaehrlich", tag_monat: "03-10" }), "jährlich am 10.03.");
  assert.equal(R.tagMonatSchluessel(10, 3), "03-10");
});

test("Kampagnen: Summen je Währung, Kennzahl-CSV (Dezimalkomma, Tausender, Kopf deutsch/englisch)", () => {
  const s = R.kampagnenSummen([{ budget_cent: 100, ausgaben_cent: 50, waehrung: "EUR" }, { budget_cent: 200, waehrung: "CHF" }]);
  assert.deepEqual(Object.keys(s).sort(), ["CHF", "EUR"]);
  const { zeilen, fehler } = R.kennzahlenCsvLesen("Datum;Impressionen;Klicks;Kosten\n01.11.2026;1.234;12;12,50\nGesamt;1;1;1\n02.11.2026;x;1;1");
  assert.equal(zeilen.length, 1);
  assert.deepEqual(zeilen[0], { datum: "2026-11-01", impressionen: 1234, klicks: 12, kosten_cent: 1250 });
  assert.equal(fehler.length, 1);
  assert.equal(R.kennzahlenCsvLesen("Day,Impressions,Clicks,Amount spent (EUR)\n2026-11-03,100,2,3.5").zeilen[0].kosten_cent, 350);
  assert.equal(R.kennzahlenCsvLesen("a;b\n1;2").zeilen.length, 0);
  assert.equal(R.kampagnenLink({ landingpage: "https://platzhirsch.studio/de/kueche", utm_source: "meta", utm_campaign: "k" }), "https://platzhirsch.studio/de/kueche?utm_source=meta&utm_campaign=k");
  assert.equal(R.kampagneSignal({ status: "Aktiv", zeitraum_bis: "2026-11-01" }, new Date(2026, 10, 4)).art, "vorbei");
});

test("Events: Plätze, Anmeldung (Warteliste/ausgebucht/doppelt), Nachrücken FIFO, Check-in-Entscheid und stabile Liste", () => {
  const ev = { status: "Offen", kapazitaet: 4, warteliste: 0, anmeldungen: [{ name: "a", email: "x@y.at", personen: 2, status: "angemeldet" }, { name: "b", personen: 1, status: "erschienen" }, { name: "w", personen: 1, status: "warteliste", angemeldet_am: "2026-11-01" }] };
  const p = R.plaetze(ev);
  assert.equal(p.belegt, 3);
  assert.equal(p.frei, 1);
  assert.equal(R.anmeldungPruefen(ev, { email: "X@y.at" }).art, "doppelt");
  assert.equal(R.anmeldungPruefen(ev, { email: "n@y.at", personen: 2 }).art, "ausgebucht");
  assert.equal(R.anmeldungPruefen({ ...ev, warteliste: 1 }, { email: "n@y.at", personen: 2 }).art, "warteliste");
  assert.equal(R.anmeldungPruefen({ ...ev, status: "Geplant" }, {}).art, "nicht_offen");
  assert.deepEqual(R.nachruecker(ev).map((a) => a.name), ["w"]);
  assert.equal(R.checkinEntscheiden({ status: "erschienen" }), "bereits");
  assert.equal(R.checkinEntscheiden({ status: "abgesagt" }), "abgesagt");
  const liste = R.checkinListe(ev.anmeldungen);
  assert.equal(liste.at(-1).status, "erschienen");
  assert.equal(R.checkinSuche([{ name_person: "Maria", telefon: "+43 664 000 1005" }], "1005").length, 1);
  assert.equal(R.eventPrimaer({ status: "Geplant" }).gesperrt, true);
});

test("Social: drei Prüfungen (Quelle, Kundenprojekt, Kennzeichnung), Formate je Kanal", () => {
  const b = { bild: "/a.jpg", alt_text: "x", bildquelle_freigabe: "eigen", text: "Schöner Tisch" };
  assert.equal(R.socialPruefungen(b).ok, true);
  assert.equal(R.socialPruefungen({ ...b, bildquelle_freigabe: "offen" }).ok, false);
  assert.equal(R.socialPruefungen(b, { kundenprojekt: true }).ok, false);
  assert.equal(R.socialPruefungen(b, { kundenprojekt: true, einwilligungOk: true }).ok, true);
  assert.equal(R.socialPruefungen(b, { kennzeichnung: "bezahlt" }).ok, false);
  assert.equal(R.socialPruefungen({ ...b, text: "Anzeige: Tisch" }, { kennzeichnung: "bezahlt" }).ok, true);
  assert.equal(R.formatErlaubt("Pinterest", "Reel"), false);
  assert.equal(R.formatErlaubt("Instagram", "Reel"), true);
  assert.equal(R.socialPrimaer("Entwurf", { leitung: false }), "zurFreigabe");
  assert.equal(R.socialPrimaer("Entwurf", { leitung: false, wartet: true }), null);
});

test("Empfehlung: Ampeln Storno · Lieferung · Zahlung · Frist; Gutschein erst, wenn alle grün", () => {
  const heute = new Date(2026, 10, 4);
  const offen = R.empfehlungAmpeln({ ab: { status: "Offen", offen_cent: 5000 }, lieferscheine: [], heute });
  assert.equal(offen.alleGruen, false);
  assert.equal(offen.lieferung.ok, false);
  const ok = R.empfehlungAmpeln({ ab: { status: "Geliefert", offen_cent: 0 }, lieferscheine: [{ zugestellt_am: "2026-10-01" }], heute, ruecktrittTage: 14 });
  assert.equal(ok.alleGruen, true);
  const storno = R.empfehlungAmpeln({ ab: { status: "Storniert", offen_cent: 0 }, heute });
  assert.equal(storno.storniert, true);
  assert.equal(R.empfehlungSchritt({ status: "Gutschein faellig" }, { ampeln: offen }), 3);
  assert.match(R.empfehlungsCode(() => 0), /^EMP-[A-Z2-9]{6}$/);
});

test("Status-Töne: Widerruf/Abgemeldet grau, Unzustellbar orange, Abgesagt mit Teilnehmern rot", () => {
  assert.equal(ton("einwilligung", "Widerrufen"), "grau");
  assert.equal(ton("abo", "Abgemeldet"), "grau");
  assert.equal(ton("abo", "Bounce"), "orange");
  assert.equal(ton("event", "Abgesagt", { mitTeilnehmern: true }), "rot");
  assert.equal(ton("event", "Abgesagt"), "grau");
});

test("Band: höchstens eines; Testmodus nur außerhalb des Mock (dort zeigt die Shell das Testband)", () => {
  assert.equal(bandFuer({ testmodus: true, mock: true }), null);
  assert.equal(bandFuer({ testmodus: true, mock: false, client: { modus: "frappe" } }).ton, "test");
  assert.deepEqual(bandFuer({ testmodus: false }, { ton: "info", inhalt: "x" }), { ton: "info", inhalt: "x" });
});

test("Vorschau: nur sichtbare Blöcke, HTML ohne Skript, Platzhalter gefüllt", () => {
  const { html } = newsletterHtml({ betreff: "Hallo", bloecke: [...voll, { typ: "skizze", text: "<script>x</script>" }] });
  assert.match(html, /Liebe Leserinnen/);
  assert.doesNotMatch(html, /<script>/);
  assert.equal(sicheresHtml('<p onclick="x">a</p><iframe></iframe>'), "<p>a</p>");
  const v = vorlageFuellen({ betreff: "Für {{ produkt }}", html: "<p>{{ anrede }} {{ unbekannt }}</p>" });
  assert.equal(v.betreff, "Für Ihr Sofa");
  assert.deepEqual(v.fehlend, ["unbekannt"]);
});
