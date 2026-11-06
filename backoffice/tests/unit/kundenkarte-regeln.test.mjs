// Kundenkarte (B-KKA): reine Regeln – Kartennummer, Textprüfung, Primäraktion/Band/Nächster Schritt,
// Storno-Erlaubnis, Anträge, Kontakt-Treffer, Stufenplan, Kanalregel, Feld-Allowlist, Verlauf.
import test from "node:test";
import assert from "node:assert/strict";
import { istKartennummer, normalisiereKartennummer, kartennummerAus, kartennummerMaskiert, wirktWieKartennummer } from "../../src/lib/backoffice/kundenkarte/kartennummer.js";
import { pruefeKundentext } from "../../src/lib/backoffice/kundenkarte/textpruefung.js";
import * as R from "../../src/lib/backoffice/kundenkarte/regeln.js";
import { filtereAntrag, filtereKarte, filtereBerichtZeilen } from "../../src/lib/backoffice/kundenkarte/felder.js";
import { stufeMonogramm, schriftAuf, kontrast, brauchtRing, KARTE_STATUS, ANTRAG_STATUS, EINLOESUNG_STATUS, VORTEIL_ART } from "../../src/lib/backoffice/kundenkarte/labels.js";
import { verlaufZeile } from "../../src/lib/backoffice/kundenkarte/verlauf.js";
import { T } from "../../src/lib/backoffice/kundenkarte/texte.js";

test("Kartennummer: Normalisierung und Prüfung wie utils/karte.py (Konzept §2.3)", () => {
  for (const x of ["kk 7k3qx9", "KK7K3QX9", " kk-7k3qx9 ", "KK-7K3QX9"]) {
    assert.equal(normalisiereKartennummer(x), "KK-7K3QX9");
    assert.equal(istKartennummer(x), true, x);
  }
  assert.equal(istKartennummer("KK-7K3QX"), false);
  assert.equal(istKartennummer("KK-7K3QXO"), false, "O ist nicht im Alphabet");
  assert.equal(istKartennummer("KK-7K3Q1X"), false, "1 ist nicht im Alphabet");
  assert.equal(normalisiereKartennummer(""), "");
  assert.equal(kartennummerMaskiert("KK-7K3QX9"), "KK-••••X9");
  assert.equal(wirktWieKartennummer("kk7"), true);
  assert.equal(wirktWieKartennummer("Anna"), false);
  const a = kartennummerAus(1);
  assert.equal(istKartennummer(a), true);
  assert.equal(kartennummerAus(1), a, "deterministisch");
});

test("Textprüfung: Geld, Gutschein, Superlative (K11, P13)", () => {
  assert.equal(pruefeKundentext("10 % Rabatt").ok, false);
  assert.equal(pruefeKundentext("Ein Gutschein zum Geburtstag").art, "zusatz");
  assert.equal(pruefeKundentext("gratis Lieferung").ok, false);
  assert.equal(pruefeKundentext("Die beste Beratung").art, "superlativ");
  assert.equal(pruefeKundentext("Wir liefern Ihre Bestellung im Liefergebiet.").ok, true);
  assert.equal(pruefeKundentext("").ok, true);
  assert.equal(pruefeKundentext("Bonuspunkte sammeln").ok, false);
});

test("Rollen: Leitung, Mitarbeiter, GF, Kassa", () => {
  assert.equal(R.rolleVon({ roles: ["PH Kundenkarte Mitarbeiter"] }), "mitarbeiter");
  assert.equal(R.rolleVon({ roles: ["PH Kundenkarte Leitung", "PH Kundenkarte Mitarbeiter"] }), "leitung");
  assert.equal(R.rolleVon({ roles: ["System Manager"] }), "leitung");
  assert.equal(R.rolleVon({ roles: ["PH Geschäftsführung"] }), "gf");
  assert.equal(R.rolleVon({ roles: ["PH Kassa Mitarbeiter"] }), null);
  assert.equal(R.darfBetraege("mitarbeiter"), false);
  assert.equal(R.darfBetraege("gf"), true);
  assert.equal(R.darfSchreiben("gf"), false);
});

test("Primäraktion je Zustand (§3.5.1)", () => {
  assert.equal(R.primaeraktion({ status: "Aktiv" }, "mitarbeiter").id, "einloesen");
  assert.equal(R.primaeraktion({ status: "Beantragt" }, "mitarbeiter").id, "uebergabe");
  assert.equal(R.primaeraktion({ status: "Gesperrt", sperrgrund_art: "Verlust" }, "mitarbeiter").id, "ersatz");
  assert.equal(R.primaeraktion({ status: "Gesperrt", sperrgrund_art: "Verlust" }, "leitung").id, "entsperren");
  assert.equal(R.primaeraktion({ status: "Gesperrt", sperrgrund_art: "Diebstahl" }, "leitung").id, "ersatz", "Diebstahl ist nicht entsperrbar");
  const m = R.primaeraktion({ status: "Gesperrt", sperrgrund_art: "Kundenwunsch" }, "mitarbeiter");
  assert.equal(m.gesperrt, true);
  assert.match(m.grund, /Leitung/);
  assert.equal(R.primaeraktion({ status: "Gekuendigt" }, "mitarbeiter").id, "neu");
  assert.equal(R.primaeraktion({ status: "Ersetzt", nachfolger_karte: "KK-ABCDEF" }, "mitarbeiter").ziel, "KK-ABCDEF");
  assert.equal(R.primaeraktion({ status: "Aktiv" }, "gf"), null);
});

test("Band: höchstens eines, Rang Gesperrt > Endzustand > Beantragt", () => {
  assert.equal(R.bandFuer({ status: "Gesperrt", sperrgrund_art: "Verlust" }).ton, "gefahr");
  assert.match(R.bandFuer({ status: "Ersetzt", nachfolger_karte: "KK-ABCDEF" }).titel, /KK-ABCDEF/);
  assert.equal(R.bandFuer({ status: "Beantragt" }).ton, "warnung");
  assert.equal(R.bandFuer({ status: "Aktiv" }), null);
});

test("Nächster Schritt (§8.3) – nie „kurz vor Stufe“", () => {
  assert.equal(R.naechsterSchritt({ status: "Aktiv", persoenlicher_berater: "" }).id, "berater");
  assert.equal(R.naechsterSchritt({ status: "Aktiv", persoenlicher_berater: "x", einwilligung_auswertung: 1, umsatz_berechnet_am: null }).id, "neuberechnen");
  assert.equal(R.naechsterSchritt({ status: "Aktiv", persoenlicher_berater: "x" }, { ungenutzt: ["Pflegetermin im Jahr"], jetzt: new Date(2026, 10, 4) }).titel, "Pflegetermin im Jahr anbieten");
  assert.equal(R.naechsterSchritt({ status: "Aktiv", persoenlicher_berater: "x" }, { ungenutzt: ["Pflege"], jetzt: new Date(2026, 3, 4) }), null);
  assert.equal(R.naechsterSchritt({ status: "Gesperrt", sperrgrund_art: "Missbrauch" }).id, "leitung");
});

test("Vorteile: Zuordnung über Stufen, Limits, Bezugsregeln (§4.6, K38)", () => {
  const stufen = [{ name: "A", reihenfolge: 1 }, { name: "B", reihenfolge: 2 }, { name: "C", reihenfolge: 3 }];
  const sv = [{ stufe: "A", vorteil: "v1" }, { stufe: "B", vorteil: "v2" }, { stufe: "C", vorteil: "v3" }, { stufe: "B", vorteil: "v1" }];
  assert.deepEqual(R.vorteileFuerStufe(sv, stufen, "B").map((z) => z.vorteil), ["v1", "v2"]);
  assert.deepEqual(R.einloesungErlaubt({ kartenStatus: "Aktiv", vorteilAktiv: true, proJahr: 1, imJahr: 1 }), [false, "limit_reached"]);
  assert.deepEqual(R.einloesungErlaubt({ kartenStatus: "Gesperrt", vorteilAktiv: true }), [false, "card_inactive"]);
  assert.deepEqual(R.einloesungErlaubt({ kartenStatus: "Aktiv", vorteilAktiv: true, stufeRang: 1, giltAbRang: 2 }), [false, "tier_too_low"]);
  assert.equal(R.limitText(0, 3), "unbegrenzt");
  assert.equal(R.limitText(1, 1), "1 je Kalenderjahr · 0 verbleibend");
  assert.equal(R.wiederAb(2026), "wieder ab 01.01.2027");
  assert.equal(R.ohneBelegErlaubt("Lieferung"), false);
  assert.equal(R.ohneBelegErlaubt("Persoenlich"), true);
  assert.equal(R.ohneBelegErlaubt("Event"), true);
  assert.ok(R.bezugsTypen("Lieferung").includes("PH Bestellung"));
  assert.ok(!R.bezugsTypen("Lieferung").includes("PH Auftragsbestaetigung"), "AB erst nach Backend P5");
  assert.ok(R.bezugsTypen("Lieferung", { zielmodell: true }).includes("PH Auftragsbestaetigung"));
  for (const art of Object.keys(VORTEIL_ART)) for (const dt of R.bezugsTypen(art)) assert.ok(R.BEZUG_ERLAUBT.includes(dt), `${art}: ${dt} im Backend erlaubt`);
  assert.equal(R.belegTypAus("RE-2026-00114"), "PH Rechnung");
  assert.equal(R.belegTypAus("PH-S-261104-00012"), "PH Bestellung");
});

test("Storno: Leitung immer, eigene nur bis 23:59 desselben Tages (§3.6)", () => {
  const jetzt = new Date(2026, 10, 4, 15, 0);
  const e = { status: "Eingeloest", eingeloest_am: "2026-11-04 10:40:00", eingeloest_durch: "a@x" };
  assert.equal(R.stornoErlaubt(e, { user: "a@x", jetzt }).ok, true);
  assert.equal(R.stornoErlaubt(e, { user: "b@x", jetzt }).ok, false);
  assert.equal(R.stornoErlaubt({ ...e, eingeloest_am: "2026-11-03 10:40:00" }, { user: "a@x", jetzt }).ok, false);
  assert.equal(R.stornoErlaubt({ ...e, eingeloest_am: "2026-11-01 10:40:00" }, { user: "b@x", leitung: true, jetzt }).ok, true);
  assert.equal(R.stornoErlaubt({ ...e, status: "Storniert" }, { leitung: true }).ok, false);
});

test("Anträge: Reiter, Mailfrist, Ablehnungsgrund (K40), Kontakt-Treffer (K37)", () => {
  assert.equal(R.antragReiter({ status: "Bestaetigt" }), "entscheiden");
  assert.equal(R.antragReiter({ status: "Neu", doi_noetig: 1 }), "mail");
  assert.equal(R.antragReiter({ status: "Neu", doi_noetig: 0 }), "entscheiden");
  assert.equal(R.antragReiter({ status: "Doppelt" }), "erledigt");
  assert.match(R.mailFristText({ eingang: "2026-10-09 07:48:00" }, new Date(2026, 10, 4)), /läuft ab in 4 Tagen/);
  assert.equal(R.ablehnGrundText("", "x").ok, false);
  assert.equal(R.ablehnGrundText("Sonstiges", "").ok, false);
  assert.equal(R.ablehnGrundText("Kundenwunsch", "").wert, "[Kundenwunsch]");
  assert.deepEqual(R.zerlegeAblehnGrund("[Kundenwunsch] bitte nicht"), { grund: "Kundenwunsch", text: "bitte nicht" });
  const a = { email: "anna@x.at", nachname: "Muster", plz: "6900" };
  const sicher = R.kontaktTreffer(a, [{ name: "K1", titel: "Anna Muster", nachname: "Muster", email: "anna@x.at", plz: "6900" }]);
  assert.equal(sicher.vorauswahl, "K1");
  const anders = R.kontaktTreffer({ email: "anna@x.at", nachname: "Huber" }, [{ name: "K1", titel: "Anna Muster", nachname: "Muster", email: "anna@x.at" }]);
  assert.equal(anders.vorauswahl, null, "kein Auto-Kontakt bei anderem Nachnamen");
  assert.equal(anders.andererName.name, "K1");
  assert.equal(R.kontaktTreffer(a, []).vorauswahl, "neu");
  assert.equal(R.maskiereName("Anna Muster"), "A. M***");
  assert.equal(R.kartenstatusBeimAusstellen({ quelle: "showroom", sofortAktiv: false }), "Beantragt");
  assert.equal(R.kartenstatusBeimAusstellen({ quelle: "website", sofortAktiv: true, perMailBestaetigt: true }), "Aktiv");
});

test("Stufenplan: Schwelle steigend, eine Wahrheit (gilt_ab), Widerspruch, Vorschau (K33)", () => {
  const s = [
    { stufenname: "A", reihenfolge: 1, schwelle_jahresumsatz_cent: 0, aktiv: 1, vorteile: [{ vorteil: "v1" }] },
    { stufenname: "B", reihenfolge: 2, schwelle_jahresumsatz_cent: 0, aktiv: 1, vorteile: [{ vorteil: "v2" }, { vorteil: "v1" }] },
  ];
  assert.match(R.stufenplanFehler(s).B, /steigen/);
  assert.deepEqual(R.stufenplanFehler([{ ...s[0] }, { ...s[1], schwelle_jahresumsatz_cent: 100 }]), {});
  assert.deepEqual(R.giltAbAusZuordnung(s), { v1: "A", v2: "B" });
  assert.equal(R.widersprueche([{ stufenname: "A", reihenfolge: 1, vorteile: [{ vorteil: "v2" }] }, { stufenname: "B", reihenfolge: 2, vorteile: [] }], [{ name: "v2", titel: "Lieferung", gilt_ab_stufe: "B" }]).length, 1);
  const v = R.stufenplanVorschau(
    [
      { name: "k1", stufe: "A", jahresumsatz_cent: 200, einwilligung_auswertung: 1 },
      { name: "k2", stufe: "B", jahresumsatz_cent: 0, einwilligung_auswertung: 1 },
      { name: "k3", stufe: "A", jahresumsatz_cent: 999, einwilligung_auswertung: 0 },
    ],
    [{ ...s[0] }, { ...s[1], schwelle_jahresumsatz_cent: 100 }]
  );
  assert.deepEqual([v.auf, v.ab, v.nicht_beurteilt], [1, 1, 1]);
  assert.match(R.vorschauSatz(v), /aufsteigen/);
  assert.equal(R.stufeNachUmsatz([{ stufenname: "A", reihenfolge: 1, schwelle_jahresumsatz_cent: 0 }, { stufenname: "B", reihenfolge: 2, schwelle_jahresumsatz_cent: 100 }], 150), "B");
});

test("Kanalregel TKG § 174: Widerspruch → keine Aufgabe, sonst Brief (K41)", () => {
  assert.equal(R.kanaeleFuer({ nicht_kontaktieren: 1 }).erlaubt, false);
  assert.deepEqual(R.kanaeleFuer({}).kanaele, ["Brief"]);
  assert.equal(R.kanaeleFuer({ werbung_telefon: true }).titelZusatz, "per Brief oder Telefon");
  const v = R.kanalVorschau([{ kontakt: {} }, { kontakt: { nicht_kontaktieren: 1 } }, { kontakt: { werbung_email: true } }]);
  assert.equal(v.moeglich, 2);
  assert.equal(v.widerspruch, 1);
  assert.equal(v.satz, "2 von 3 – 1 ohne Werbeeinwilligung (nur Brief möglich) · 1 mit Widerspruch (keine Aufgabe)");
});

test("Geburtstag und Idempotenz-Schlüssel", () => {
  assert.deepEqual(R.geburtstagParsen("12.5."), { ok: true, wert: "05-12" });
  assert.deepEqual(R.geburtstagParsen("29.02."), { ok: true, wert: "02-29" });
  assert.equal(R.geburtstagParsen("31.02.").ok, false);
  assert.equal(R.geburtstagAnzeige("05-12"), "12.05.");
  assert.match(R.idempotenzSchluessel("kk-neu", "anna@x.at", "1234-abcd"), /^kk-neu:anna@x\.at:1234-abcd$/);
});

test("Feld-Allowlist: Mitarbeitende ohne Beträge, Intern, Hashes; Monat statt Datum (K32, K9)", () => {
  const karte = { name: "KK-ABCDEF", jahresumsatz_cent: 1476000, gesamtumsatz_cent: 1, umsatz_berechnet_am: "x", ip_hash: "h", idempotency_key: "k", notizen_intern: "n", letzter_einkauf: "2026-10-21", einwilligung_auswertung: 1 };
  const m = filtereKarte(karte, "mitarbeiter");
  for (const f of ["jahresumsatz_cent", "gesamtumsatz_cent", "umsatz_berechnet_am", "ip_hash", "idempotency_key", "notizen_intern", "letzter_einkauf"]) assert.ok(!(f in m), f);
  assert.equal(m.letzter_einkauf_monat, "10/2026");
  const ohne = filtereKarte({ ...karte, einwilligung_auswertung: 0 }, "leitung");
  assert.equal(ohne.jahresumsatz_cent, null, "ohne Einwilligung nie Umsatz");
  assert.equal(ohne.letzter_einkauf_monat, null);
  const l = filtereKarte(karte, "leitung");
  assert.equal(l.jahresumsatz_cent, 1476000);
  assert.ok(!("ip_hash" in l));
  assert.equal(l.notizen_intern, "n");
  const a = filtereAntrag({ name: "A", email: "x@y", ip_hash: "h", doi_token_hash: "t", notizen_intern: "n" }, "mitarbeiter", { liste: true });
  assert.deepEqual(Object.keys(a), ["name"]);
  assert.deepEqual(filtereBerichtZeilen([{ a: 1, jahresumsatz: 5 }], "mitarbeiter", ["jahresumsatz"]), [{ a: 1 }]);
});

test("Labels: keine Rohwerte, Monogramm, Kontrast der Stufenfarbe (K31)", () => {
  assert.equal(KARTE_STATUS.Gekuendigt.label, "Gekündigt");
  assert.equal(ANTRAG_STATUS.Bestaetigt.label, "Bestätigt");
  assert.equal(EINLOESUNG_STATUS.Eingeloest.label, "Eingelöst");
  assert.equal(stufeMonogramm("Platzhirsch"), "P");
  assert.equal(stufeMonogramm("Platzhirsch Plus"), "P+");
  assert.equal(stufeMonogramm("Platzhirsch Privé"), "PP");
  for (const f of ["#5b626a", "#b08850", "#8f5230", "#cdbfa8"]) assert.ok(kontrast(f, schriftAuf(f)) >= 3, f);
  assert.equal(brauchtRing("#fbfaf8"), true);
  assert.equal(brauchtRing("#30373e"), false);
});

test("Verlauf in Menschensprache", () => {
  assert.match(verlaufZeile({ art: "Stufenwechsel", alt: "Platzhirsch", neu: "Platzhirsch Plus", automatisch: 1 }).titel, /Platzhirsch → Platzhirsch Plus \(automatisch\)/);
  assert.equal(verlaufZeile({ art: "Umsatz berechnet", hinweis: "5 Einkäufe berücksichtigt", automatisch: 1 }).titel, "Einstufung geprüft");
  assert.match(verlaufZeile({ art: "Einloesung", titel: "Pflegetermin im Jahr", beleg: "PFL-2026-0012", wer: "t.steiner@x", status: "Eingeloest" }).unter, /zu Beleg PFL-2026-0012/);
});

test("Texte: keine Superlative/Ausrufezeichen, Umlaute statt Umschreibungen (Q-K2, K22)", () => {
  const alle = [];
  const sammle = (o) => {
    for (const v of Object.values(o)) {
      if (typeof v === "string") alle.push(v);
      else if (typeof v === "function") {
        const r = v(1, "X", "Y");
        if (typeof r === "string") alle.push(r);
      } else if (v && typeof v === "object") sammle(v);
    }
  };
  sammle(T);
  for (const t of alle) {
    assert.ok(!/!(?!=)/.test(t), `Ausrufezeichen: ${t}`);
    assert.ok(!/\b(beste|einzigartig|unschlagbar|super)\b/i.test(t), `Superlativ: ${t}`);
    assert.ok(!/(Bestaetigt|Gekuendigt|Eingeloest|Uebertragen|Zusammengefuehrt|Persoenlich)/.test(t), `Rohwert: ${t}`);
  }
});
