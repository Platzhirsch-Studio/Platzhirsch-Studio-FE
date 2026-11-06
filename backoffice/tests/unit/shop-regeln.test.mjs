// Bereich Shop (B-SHO): reine Regeln aus 10-konzept-shop – Status, Geld, Fristen, Nächster Schritt, Primäraktion,
// Kanban, Ansichten, Kennzahlen, Texte. node --test tests/unit/shop-regeln.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { statusInfo, STATUS, zusatzChips, kanalText } from "../../src/lib/backoffice/shop/status.js";
import { offen, vollBezahlt, barEingang, erstattungGesperrt, zahlungVorschau, einloesBetrag, brauchtFreigabe, ustAusBrutto, erstattungRechnen, verteileAufZahlungen, VERBOTENE_BACKOFFICE_KANAELE } from "../../src/lib/backoffice/shop/geld.js";
import { zustellung, widerrufsFristen, abschliessenAb, ampel, belehrungNachweisbar, fristAblehnungErlaubt, hinsendekosten, abholfristVergleich, plusWerktage } from "../../src/lib/backoffice/shop/fristen.js";
import { naechsterSchritt, ruhtSeit } from "../../src/lib/backoffice/shop/naechsterSchritt.js";
import { bestellAktionen, bestellBaender, stornoErlaubt, AKTIONEN } from "../../src/lib/backoffice/shop/primaer.js";
import { zug, ziele, ABSCHLIESSEN, spaltenFuer } from "../../src/lib/backoffice/shop/kanban.js";
import { emailTipp } from "../../src/lib/backoffice/shop/emailTipp.js";
import { stripeTyp } from "../../src/lib/backoffice/shop/stripeTypen.js";
import { wendeAn, massenPruefung, passtSuche, LISTEN } from "../../src/lib/backoffice/shop/ansichten.js";
import { shopKennzahlen, zuErledigen, euVersand, zahlungenNachKanal } from "../../src/lib/backoffice/shop/kennzahlen.js";
import { T, verlaufText, mailKurz, GLOSSAR_VERBOTEN } from "../../src/lib/backoffice/shop/texte.js";
import { widerrufAktionen, zahlungAktionen, gutscheinAktionen, retoureAktionen } from "../../src/lib/backoffice/shop/aktenAktionen.js";

const H = "2026-11-04";
const B = (x = {}) => ({ name: "PH-S-261104-00001", status: "bezahlt", lieferart: "versand", bestellart: "Online", quelle: "website", gesamt_cent: 10000, betrag_bezahlt_cent: 10000, offen_cent: 0, waehrung: "EUR", angelegt: "2026-11-04 09:00:00", bezahlt_am: "2026-11-04 09:01:00", positionen: [], verlauf: [], ...x });

test("Status: Anzeige mit Umlauten, Töne – rot nur bei Problemen (N13/N14)", () => {
  assert.equal(statusInfo("PH Bestellung", "pruefen").anzeige, "Prüfen");
  assert.equal(statusInfo("PH Zahlung", "Angekuendigt").anzeige, "Angekündigt");
  assert.equal(statusInfo("PH Gutschein", "Teilweise eingeloest").anzeige, "Teilweise eingelöst");
  for (const s of ["storniert", "widerrufen", "erstattet", "abgelaufen"]) assert.equal(statusInfo("PH Bestellung", s).ton, "grau", s);
  const rot = Object.entries(STATUS["PH Bestellung"]).filter(([, v]) => v.ton === "rot").map(([k]) => k).sort();
  assert.deepEqual(rot, ["checkout_fehler", "fehlgeschlagen", "pruefen"]);
  assert.equal(statusInfo("PH Bestellung", "widerrufen", { erstattet_cent: 100, betrag_bezahlt_cent: 500 }).anzeige, "Teilweise widerrufen");
  assert.equal(statusInfo("PH Gutschein", "Abgelaufen", { rest_cent: 3750 }).ton, "orange");
  assert.equal(statusInfo("PH Bestellung", "gibtsnicht").anzeige, "gibtsnicht");
  for (const dt of Object.keys(STATUS)) for (const v of Object.values(STATUS[dt])) assert.doesNotMatch(v.anzeige, /ae|oe|ue(?!r)/, `${dt}: ${v.anzeige}`);
  assert.equal(kanalText("Ueberweisung"), "Überweisung");
  assert.deepEqual(zusatzChips(B({ modus: "test", radar_markiert: 1, waehrung: "CHF" })).map((c) => c.id), ["test", "risiko", "fremd"]);
});

test("Geld: offen, voll bezahlt, Kassa-Kanäle sperren Erstattung, Rechnung ohne Gutschrift-Hook (E4/E8/E9/E19)", () => {
  assert.equal(offen(B({ offen_cent: undefined, gesamt_cent: 8900, betrag_bezahlt_cent: 5000 })), 3900);
  assert.equal(offen(B({ offen_cent: -5 })), 0);
  assert.equal(vollBezahlt(B({ gesamt_cent: 0, bestellart: "Ersatz" })), true);
  assert.equal(vollBezahlt(B({ gesamt_cent: 0 })), false);
  assert.equal(barEingang([{ kanal: "Bar", art: "Eingang" }]), true);
  assert.equal(barEingang([{ kanal: "Stripe Checkout", art: "Eingang" }]), false);
  assert.equal(erstattungGesperrt(B(), { zahlungen: [{ kanal: "Karte extern" }] }).code, "bar");
  assert.equal(erstattungGesperrt(B(), { rechnungen: [{ name: "R1", docstatus: 1 }] }).code, "rechnung");
  assert.equal(erstattungGesperrt(B(), { rechnungen: [{ name: "R1", docstatus: 1 }], gutschriftHook: true }), null);
  assert.equal(erstattungGesperrt(B({ waehrung: "CHF" })).code, "fremd");
  assert.ok(VERBOTENE_BACKOFFICE_KANAELE.includes("Verrechnung"));
});

test("Geld: Teilzahlung (Gutschein 50 + Überweisung 39 auf 89), Einlösebetrag, Vier-Augen, USt", () => {
  const b = B({ status: "reserviert", gesamt_cent: 8900, betrag_bezahlt_cent: 5000, offen_cent: 3900 });
  assert.deepEqual(zahlungVorschau(b, 3900), { betrag: 3900, offenDanach: 0, vollDanach: true, gueltig: true });
  assert.equal(zahlungVorschau(b, 4000).gueltig, false);
  assert.equal(einloesBetrag({ rest: 6250, offenCent: 3900 }), 3900);
  assert.equal(einloesBetrag({ rest: 6250, offenCent: 3900, wunsch: 1000 }), 1000);
  assert.equal(brauchtFreigabe(145000, 100000), true);
  assert.equal(brauchtFreigabe(50000, 100000), false);
  assert.equal(brauchtFreigabe(1, 0), true);
  assert.equal(ustAusBrutto(12000, 2000), 2000);
});

test("Geld: Erstattung positionsgenau, letzte Menge = Rest, Verteilung Karte vor Gutschein", () => {
  const pos = [{ idx: 1, menge: 3, summe_cent: 1000, ust_satz_promille: 2000 }, { idx: 2, menge: 1, summe_cent: 28900, ust_satz_promille: 2000 }];
  const r1 = erstattungRechnen(pos, { 1: 1 });
  assert.equal(r1.betrag_cent, 333);
  const r2 = erstattungRechnen(pos, { 1: 3, 2: 1 }, { versand_cent: 990 });
  assert.equal(r2.betrag_cent, 1000 + 28900 + 990);
  assert.equal(r2.posten[0].ust_cent, ustAusBrutto(30890, 2000));
  assert.match(erstattungRechnen(pos, { 2: 2 }).fehler, /übersteigt/);
  const v = verteileAufZahlungen(6000, [{ name: "G", kanal: "Gutschein", betrag_cent: 5000 }, { name: "S", kanal: "Stripe Checkout", betrag_cent: 3900 }]);
  assert.deepEqual(v.teile.map((t) => [t.name, t.betrag_cent]), [["S", 3900], ["G", 2100]]);
});

test("Fristen: Zustellung aus Sendungsverfolgung, sonst geschätzt; Widerruf ab Zustellung (E11, § 3.7)", () => {
  const b = B({ status: "versendet", versendet_am: "2026-10-20 14:00:00", mail_status: "gesendet", widerrufsbelehrung_stand: "2026-10-01" });
  const z = zustellung(b, [{ bestellung: b.name, zugestellt_am: "2026-10-23 10:42:00" }]);
  assert.deepEqual(z, { datum: "2026-10-23", quelle: "Sendungsverfolgung", geschaetzt: false });
  assert.equal(zustellung(b, []).quelle, "geschätzt (Versand)");
  const f = widerrufsFristen({ eingegangen_am: "2026-11-02 18:20:00" }, z);
  assert.equal(f.widerrufBis, "2026-11-06");
  assert.equal(f.rueckzahlungBis, "2026-11-16");
  assert.equal(f.fristgerecht, true);
  assert.equal(abschliessenAb(b, [{ bestellung: b.name, zugestellt_am: "2026-10-23" }]), "2026-11-20");
  assert.equal(belehrungNachweisbar(b), true);
  assert.equal(belehrungNachweisbar({ ...b, mail_status: "nicht_gesendet" }), false);
  assert.equal(fristAblehnungErlaubt(b, z), true);
  assert.equal(fristAblehnungErlaubt(b, { datum: "2026-10-21", geschaetzt: true }), false);
  assert.equal(ampel("2026-11-10", H).ton, "orange");
  assert.equal(ampel("2026-11-30", H).ton, "gruen");
  assert.equal(ampel("2026-11-01", H).ton, "rot");
  assert.equal(ampel("2026-11-01", H, { erledigt: true }).text, "erledigt");
  const pos = [{ idx: 1, menge: 1 }, { idx: 2, menge: 1 }];
  assert.equal(hinsendekosten({ positionen: pos, versand_cent: 990 }, { 1: 1, 2: 1 }), 990);
  assert.equal(hinsendekosten({ positionen: pos, versand_cent: 990 }, { 1: 1 }), 0);
  assert.equal(abholfristVergleich("2026-11-24", "2026-11-11").art, "kuerzer");
  assert.equal(plusWerktage("2026-11-06", 1), "2026-11-09");
});

test("Nächster Schritt: Reihenfolge der Regeln (§ 6.1)", () => {
  const n = (x) => naechsterSchritt(B(x), { heute: H }).id;
  assert.equal(n({ status: "pruefen" }), "pruefen");
  assert.equal(n({ radar_markiert: 1 }), "risiko");
  assert.equal(n({ status: "zahlung_ausstehend" }), "unterwegs");
  assert.equal(n({ status: "offen", bestellart: "Telefon" }), "link");
  assert.equal(n({ status: "reserviert", lieferart: "abholung", offen_cent: 3900 }), "kassa");
  assert.equal(n({ status: "reserviert", lieferart: "abholung" }), "abholbereit");
  assert.equal(n({ rechnung_uid: "DE123", adresse_land: "DE" }), "steuerfall");
  assert.equal(n({}), "packen");
  assert.equal(n({ lieferart: "abholung" }), "abholbereit");
  assert.equal(n({ status: "versandbereit" }), "versendet");
  assert.equal(n({ status: "abholbereit", lieferart: "abholung", offen_cent: 100 }), "kassa");
  assert.equal(n({ status: "abholbereit", lieferart: "abholung" }), "uebergeben");
  assert.equal(n({ status: "versendet", rechnungswunsch: 1 }), "rechnung");
  assert.equal(n({ status: "versendet" }), "abschliessen");
  assert.equal(n({ status: "storniert", erstattet_cent: 0 }), "erstatten");
  assert.equal(n({ status: "abgeschlossen" }), null);
  assert.equal(ruhtSeit(B({ verlauf: [{ zeit: "2026-11-01 10:00:00" }] }), H), 3);
});

test("Primäraktion je Status × Zahlungsweg × Geld (§ 5.1, QA 6) – parametrisiert", () => {
  const faelle = [
    [{ status: "offen" }, null],
    [{ status: "offen", bestellart: "Telefon" }, "zahlungslink-senden"],
    [{ status: "zahlung_ausstehend" }, null],
    [{ status: "reserviert", lieferart: "abholung", offen_cent: 8900 }, "an-die-kassa"],
    [{ status: "reserviert", lieferart: "abholung" }, "abholbereit"],
    [{ status: "bezahlt" }, "packen"],
    [{ status: "bezahlt", lieferart: "abholung" }, "abholbereit"],
    [{ status: "versandbereit" }, "versendet"],
    [{ status: "abholbereit", lieferart: "abholung" }, "uebergeben"],
    [{ status: "abholbereit", lieferart: "abholung", offen_cent: 100 }, "an-die-kassa"],
    [{ status: "versendet", versendet_am: "2026-10-01 10:00:00" }, "abschliessen"],
    [{ status: "versendet", versendet_am: "2026-11-03 10:00:00" }, null],
    [{ status: "abgeschlossen" }, null],
    [{ status: "pruefen" }, "geprueft"],
    [{ status: "fehlgeschlagen" }, "zurueck-offen"],
    [{ status: "checkout_fehler" }, "zurueck-offen"],
    [{ status: "abgelaufen" }, "zurueck-offen"],
    [{ status: "storniert", erstattet_cent: 0 }, "erstatten"],
    [{ status: "storniert", erstattet_cent: 10000 }, null],
  ];
  for (const [x, erwartet] of faelle) assert.equal(bestellAktionen(B(x), { leitung: true, heute: H }).primaer?.id ?? null, erwartet, JSON.stringify(x));
  // RKSV: keine Aktion mit Bar/Karte, AnDieKassa statt Zahlung bei unbezahlter Reservierung
  assert.ok(!Object.values(AKTIONEN).some((a) => /\bBar\b|Karte/.test(a.titel)));
  // E4: unbezahlte Abholung – kein Übergeben irgendwo
  const ak = bestellAktionen(B({ status: "abholbereit", lieferart: "abholung", offen_cent: 100 }), { leitung: true, heute: H });
  assert.ok(![ak.primaer, ...ak.sekundaer, ...ak.menue].some((a) => a?.id === "uebergeben"));
  // E7: aus versendet kein Storno, sondern Widerruf erfassen
  const v = bestellAktionen(B({ status: "versendet" }), { leitung: true, heute: H });
  assert.ok(![v.primaer, ...v.sekundaer, ...v.menue].some((a) => a?.id?.startsWith("stornieren")));
  assert.ok(v.sekundaer.some((a) => a.id === "widerruf-erfassen"));
  assert.equal(stornoErlaubt("abgeholt"), false);
  // E8: Bar-Eingang sperrt Storno mit Erstattung, Team sieht Leitungsaktion gesperrt
  const bar = bestellAktionen(B({ lieferart: "abholung" }), { leitung: true, zahlungen: [{ kanal: "Bar" }], heute: H });
  assert.equal(bar.menue.find((a) => a.id === "stornieren").sperre, "bar");
  const team = bestellAktionen(B(), { leitung: false, heute: H });
  assert.equal(team.menue.find((a) => a.id === "stornieren").grund, T.nurLeitung);
  // Rechnung ohne Hook: deaktiviert mit Ersatzweg (E6)
  const r = bestellAktionen(B({ status: "versendet" }), { leitung: true, heute: H, faehigkeiten: { rechnung: false } });
  assert.match(r.sekundaer.find((a) => a.id === "rechnung").grund, /Faktura/);
  // Lesende Rollen: alles außer Links gesperrt; kein Löschen
  const l = bestellAktionen(B(), { schreiben: false, heute: H });
  assert.equal(l.primaer.deaktiviert, true);
  assert.ok(![...l.sekundaer, ...l.menue].some((a) => /lösch/i.test(a.titel)));
});

test("Bänder nach Schwere (§ 5.1)", () => {
  const b = bestellBaender(B({ status: "pruefen", radar_markiert: 1 }), { heute: H });
  assert.deepEqual(b.map((x) => x.id).slice(0, 2), ["pruefen", "risiko"]);
  assert.equal(bestellBaender(B({ status: "storniert", erstattet_cent: 0 }), { heute: H })[0].id, "storno-offen");
  assert.equal(bestellBaender(B({ status: "zahlung_ausstehend" }), { heute: H })[0].id, "unterwegs");
  assert.ok(bestellBaender(B(), { zahlungen: [{ status: "Erstattung angefordert", erstattung_angefordert_cent: 145000 }], heute: H }).some((x) => x.id === "freigabe"));
});

test("Kanban: nur Dokumentmethoden, Geldprüfung, Gründe (§ 4.4)", () => {
  assert.deepEqual(zug(B(), "versandbereit"), { ok: true, aktion: "packen" });
  assert.equal(zug(B(), "versendet").grund, T.kanbanVerboten.ersterPacken);
  assert.equal(zug(B({ status: "reserviert", lieferart: "abholung", offen_cent: 100 }), "abholbereit").grund, T.kanbanVerboten.erstZahlung);
  assert.equal(zug(B({ status: "abholbereit", lieferart: "abholung", offen_cent: 100 }), "abgeholt").ok, false);
  assert.equal(zug(B({ status: "versendet" }), ABSCHLIESSEN).aktion, "abschliessen");
  assert.equal(zug(B({ status: "pruefen" }), "bezahlt").ok, false);
  assert.equal(zug(B({ status: "pruefen" }), "bezahlt", { leitung: true }).aktion, "geprueft");
  assert.deepEqual(ziele(B(), ["bezahlt", "versandbereit", "versendet"]), ["versandbereit"]);
  const sp = spaltenFuer("abholung", [B({ lieferart: "abholung", status: "reserviert" }), B({ status: "pruefen" })]);
  assert.equal(sp[0].status, "reserviert");
});

test("Ansichten, Suche, Massenprüfung (§ 3.5, Q-C10)", () => {
  const zeilen = [B({ name: "A", status: "bezahlt" }), B({ name: "B", status: "bezahlt", modus: "test" }), B({ name: "C", status: "pruefen", kunde_name: "Anna Beispiel" }), B({ name: "D", status: "reserviert", lieferart: "abholung", gesamt_cent: 8900 })];
  const r = wendeAn("bestellungen", zeilen, { ansicht: "zu-packen" }, { heute: H });
  assert.deepEqual(r.zeilen.map((x) => x.name), ["A", "C"].filter((n) => n === "A"));
  assert.equal(r.ansichten.length <= 5, true);
  assert.equal(wendeAn("bestellungen", zeilen, { test: "1", ansicht: "zu-packen" }, { heute: H }).gesamt, 2);
  assert.equal(passtSuche("bestellungen", zeilen[2], "anna"), true);
  assert.equal(passtSuche("bestellungen", zeilen[3], "€ 89"), true);
  assert.equal(passtSuche("gutscheine", { code_letzte4: "7K3Q", name: "x" }, "PH-ABCD-EFGH-7K3Q"), true);
  const m = massenPruefung("abholbereit", [B({ status: "pruefen", lieferart: "abholung" }), B({ status: "reserviert", lieferart: "abholung", offen_cent: 100 }), B({ name: "OK", status: "reserviert", lieferart: "abholung" })]);
  assert.deepEqual(m.ok, ["OK"]);
  assert.deepEqual(m.skip.map((s) => s.grund), ["zuerst prüfen – Leitung", "erst nach Zahlung"]);
  for (const def of Object.values(LISTEN)) assert.ok(def.ansichten.length <= 5, def.doctype);
});

test("Kennzahlen: nur live, Eingänge ohne Kassa, Restwert ohne Ersetzte (§ 7)", () => {
  const k = shopKennzahlen({
    bestellungen: [B(), B({ name: "T", modus: "test" }), B({ status: "pruefen" })],
    zahlungen: [{ art: "Eingang", status: "Bezahlt", betrag_cent: 1000, zeitpunkt: "2026-11-02 10:00:00", quelle: "stripe", bezug_doctype: "PH Bestellung", kanal: "Stripe Checkout", livemode: 1 }, { art: "Eingang", status: "Bezahlt", betrag_cent: 5000, zeitpunkt: "2026-11-02", quelle: "kassa", bezug_doctype: "PH Bestellung", livemode: 1 }],
    gutscheine: [{ status: "Aktiv", rest_cent: 5000 }, { status: "Gesperrt", sperrgrund_art: "Ersetzt", rest_cent: 5000 }, { status: "Abgelaufen", rest_cent: 3750 }],
    widerrufe: [],
  }, { heute: H });
  assert.equal(k.zuPacken, 1);
  assert.equal(k.pruefen, 1);
  assert.equal(k.eingaengeMonat, 1000);
  assert.equal(k.gutscheinRest, 8750);
  const z = zuErledigen({ bestellungen: [B({ status: "pruefen" }), B({ name: "X", verlauf: [{ zeit: "2026-11-01 10:00:00" }] })] }, { heute: H, leitung: true });
  assert.equal(z[0].titel, "Prüfen");
  assert.ok(z.length <= 8);
  assert.equal(euVersand([B({ adresse_land: "DE", gesamt_cent: 900000, ust_cent: 0 })], { jahr: "2026" }).warnung, true);
  assert.deepEqual(zahlungenNachKanal([{ art: "Eingang", status: "Bezahlt", kanal: "Ueberweisung", betrag_cent: 10, livemode: 1 }])[0].label, "Überweisung");
});

test("Akten-Aktionen: Widerruf erst ab Ware oder Nachweis, Zahlung bar → Kassa, Gutschein ohne freies Einlösen", () => {
  const w = widerrufAktionen({ status: "Ware erwartet", bestellung: "B1" }, { leitung: true });
  assert.equal(w.sekundaer.find((a) => a.id === "widerruf-erstatten").deaktiviert, true);
  assert.equal(widerrufAktionen({ status: "Ware erwartet", bestellung: "B1" }, { leitung: true, nachweis: true }).sekundaer.find((a) => a.id === "widerruf-erstatten").deaktiviert, undefined);
  assert.equal(widerrufAktionen({ status: "Eingegangen" }).primaer.id, "widerruf-bestaetigen");
  assert.equal(zahlungAktionen({ art: "Eingang", status: "Bezahlt", kanal: "Bar", betrag_cent: 100 }).primaer.id, "an-die-kassa");
  assert.equal(zahlungAktionen({ art: "Eingang", status: "Bezahlt", kanal: "Stripe Checkout", betrag_cent: 100 }, { leitung: false }).primaer.deaktiviert, true);
  assert.equal(gutscheinAktionen({ status: "Aktiv", rest_cent: 100 }).primaer.id, "anrechnen");
  assert.equal(retoureAktionen({ status: "Eingegangen" }).primaer.id, "pruefung-abschliessen");
});

test("Texte: Glossar ohne Technikbegriffe, E-Mail-Tipp, Stripe-Klartext, Verlauf übersetzt (N13, QA 18)", () => {
  const alle = JSON.stringify(T);
  for (const w of GLOSSAR_VERBOTEN) assert.ok(!alle.includes(w), w);
  assert.doesNotMatch(alle, /!/);
  assert.equal(emailTipp("huber@gmial.com").vorschlag, "huber@gmail.com");
  assert.equal(emailTipp("x@gmx.ar").vorschlag, "x@gmx.at");
  assert.equal(emailTipp("kein").gueltig, false);
  assert.equal(emailTipp("a@b").fehler, "Endung fehlt (z. B. .at, .de, .com)");
  assert.equal(stripeTyp("checkout.session.completed"), "Bezahlvorgang abgeschlossen");
  assert.equal(stripeTyp("review.opened"), "Risikoprüfung");
  assert.equal(stripeTyp("x.y"), "x.y");
  assert.equal(verlaufText("Checkout-Session abgelaufen (Scheduler)"), "Bezahlvorgang abgelaufen (automatisch)");
  assert.equal(verlaufText("Teilzahlung 3900 Cent"), "Teilzahlung 39,00 €");
  assert.equal(mailKurz("huber@beispiel.invalid"), "h…@beispiel.invalid");
});
