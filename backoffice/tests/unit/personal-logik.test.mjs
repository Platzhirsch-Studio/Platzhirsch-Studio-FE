// Bereich Personal – reine Logik (Konzept § 13.5 Schritt 1): Sichtbarkeit, Zeiten/Konten, Titelprüfung, Slots,
// Regeln (Züge, Primäraktion, Löschfrist, Checkliste, Anträge), Texte ohne Rohwerte, Register-Teildateien.
import { test } from "node:test";
import assert from "node:assert/strict";
import { maskiereAbwesenheit, maskiereListe, krankAlsAbwesenheit, VERBOTEN_FUER_FREMDE } from "../../src/lib/backoffice/personal/sichtbarkeit.js";
import { personalRolle, darfArtSehen, darfBewerbungen } from "../../src/lib/backoffice/personal/rollen.js";
import { zeitMin, hm, saldoText, nettoMin, istSumme, konto, urlaubskonto, zeitraumText, relativTage, arbeitstage, kw, pauseVorschlag, monatsTage } from "../../src/lib/backoffice/personal/zeit.js";
import { pruefeTitel, slugAusTitel } from "../../src/lib/backoffice/personal/titelpruefung.js";
import { belegteZeiten, freieZeiten, hatFreieZeit, wochenTageMoSa } from "../../src/lib/backoffice/personal/slots.js";
import { bewerbungsZug, zieleVon, primaerBewerbung, loeschfristInfo, kartenKennzeichen, stelleCheckliste, entgeltSatz, entgeltFehlt, antragEntscheidbar, teamStaerke, darfStornieren, selbstKorrigierbar, aufBoard } from "../../src/lib/backoffice/personal/regeln.js";
import { STATUS, statusText, statusTon } from "../../src/lib/backoffice/personal/status.js";
import { pruefeAbwesenheit } from "../../src/lib/backoffice/personal/methoden.js";
import { T } from "../../src/lib/backoffice/personal/texte.js";

const S = (roles, user = "x@demo.local") => ({ user, roles });

test("Rollen: stärkste Rolle gewinnt, Admin ohne Bewerbungen", () => {
  assert.equal(personalRolle(S(["PH Personal Leitung", "PH Personal Mitarbeiter"])), "leitung");
  assert.equal(personalRolle(S(["PH Geschäftsführung"])), "gf");
  assert.equal(personalRolle(S(["PH Personal Mitarbeiter"])), "sachbearbeitung");
  assert.equal(personalRolle(S(["PH Backoffice-Admin"])), "admin");
  assert.equal(personalRolle(S(["PH Personal Selbstservice"])), "selbst");
  assert.equal(personalRolle(S(["PH CRM Mitarbeiter"])), null);
  assert.equal(darfBewerbungen("admin"), false);
  assert.equal(darfArtSehen("sachbearbeitung"), false);
});

test("Sichtbarkeit (§ 1.2): fremde Art nur für Leitung/GF, eigene immer, Selbstservice nur mit Teamkalender", () => {
  const a = { name: "A1", mitarbeiter: "MA-2", mitarbeiter_name: "Lena", art: "Pflegefreistellung", von: "2026-11-02", bis: "2026-11-03", status: "Genehmigt", begruendung: "Kind krank", vertretung: "MA-3", ablehnungsgrund: "" };
  const m = maskiereAbwesenheit(a, { rolle: "sachbearbeitung", eigenerMitarbeiter: "MA-1" });
  assert.equal(m.art, "abwesend");
  assert.equal(m.maskiert, true);
  for (const f of ["begruendung", "vertretung", "ablehnungsgrund"]) assert.equal(f in m, false, f);
  const json = JSON.stringify(m);
  for (const w of VERBOTEN_FUER_FREMDE) assert.equal(json.includes(w), false, w);
  assert.equal(maskiereAbwesenheit(a, { rolle: "leitung" }).art, "Pflegefreistellung");
  assert.equal(maskiereAbwesenheit(a, { rolle: "gf" }).art, "Pflegefreistellung");
  assert.equal(maskiereAbwesenheit(a, { rolle: "selbst", eigenerMitarbeiter: "MA-2" }).art, "Pflegefreistellung");
  assert.equal(maskiereAbwesenheit(a, { rolle: "selbst", eigenerMitarbeiter: "MA-1" }), null);
  assert.equal(maskiereAbwesenheit(a, { rolle: "selbst", eigenerMitarbeiter: "MA-1", teamSelbstservice: true }).art, "abwesend");
  const k = krankAlsAbwesenheit({ name: "K1", mitarbeiter: "MA-2", mitarbeiter_name: "Lena", von: "2026-11-03", bis_offen: 1, status: "Gemeldet" }, "2026-11-08");
  assert.equal(k.bis, "2026-11-08");
  const km = maskiereAbwesenheit(k, { rolle: "admin" });
  assert.deepEqual([km.art, km.status], ["abwesend", "Genehmigt"], "Status verrät die Krankmeldung nicht");
  assert.equal(maskiereListe([a, k], { rolle: "selbst", eigenerMitarbeiter: "MA-9" }).length, 0);
});

test("Zeit: h:mm, Saldo mit Vorzeichen −, Netto, Pause ab 6 h", () => {
  assert.equal(zeitMin("07:55:00"), 475);
  assert.equal(zeitMin("25:00"), null);
  assert.equal(hm(252), "4:12");
  assert.equal(saldoText(-36), "−0:36 h");
  assert.equal(saldoText(135), "+2:15 h");
  assert.equal(saldoText(0), "0:00 h");
  assert.equal(nettoMin({ kommen: "08:00", gehen: "16:30", pause_min: 30 }), 480);
  assert.equal(nettoMin({ kommen: "08:00" }, 600), 120, "laufend ohne Pause");
  assert.equal(istSumme([{ kommen: "08:00", gehen: "12:00", pause_min: 0 }, { kommen: "13:00", gehen: "17:00", pause_min: 0 }]), 480);
  assert.equal(pauseVorschlag(361), 30);
  assert.equal(pauseVorschlag(360), 0);
  assert.equal(monatsTage(2026, 2).length, 28);
  assert.equal(arbeitstage("2026-11-02", "2026-11-08"), 5);
  assert.equal(kw("2026-11-04"), 45);
});

test("Zeit: Texte ausgeschrieben, nie „T.“", () => {
  assert.equal(zeitraumText("2026-11-23", "2026-11-27"), "23.–27.11.");
  assert.equal(zeitraumText("2026-11-30", "2026-12-02"), "30.11.–02.12.");
  assert.equal(relativTage("2026-11-10", "2026-11-04"), "in 6 Tagen");
  assert.equal(relativTage("2026-11-02", "2026-11-04"), "vor 2 Tagen");
  assert.equal(relativTage("2026-11-05", "2026-11-04"), "morgen");
});

test("Konto (Mock-Rechnung): Gutschrift-Matrix, Zeitausgleich ohne Gutschrift, Urlaubskonto", () => {
  const b = [{ datum: "2026-11-02", kommen: "08:00", gehen: "16:30", pause_min: 30 }, { datum: "2026-11-03", kommen: "08:00", gehen: "16:30", pause_min: 30 }];
  const k = konto({ buchungen: b, abwesenheiten: [], wochenstunden: 38.5, von: "2026-11-02", bis: "2026-11-03" });
  assert.equal(k.saldo, 36, "QA 13: 2 × 8:00 gegen 2 × 7:42 = +0:36");
  const za = konto({ buchungen: [], abwesenheiten: [{ art: "Zeitausgleich", status: "Genehmigt", von: "2026-11-04", bis: "2026-11-04" }], wochenstunden: 38.5, von: "2026-11-04", bis: "2026-11-04" });
  assert.equal(za.saldo, -462, "QA 40: Zeitausgleich senkt den Saldo um das Tagessoll");
  const ur = konto({ buchungen: [], abwesenheiten: [{ art: "Urlaub", status: "Genehmigt", von: "2026-11-04", bis: "2026-11-04" }], wochenstunden: 38.5, von: "2026-11-04", bis: "2026-11-04" });
  assert.equal(ur.saldo, 0);
  const u = urlaubskonto({ anspruch: 25, abwesenheiten: [{ art: "Urlaub", status: "Genehmigt", von: "2026-08-10", bis: "2026-08-21" }, { art: "Urlaub", status: "Beantragt", von: "2026-12-22", bis: "2026-12-31" }], jahr: 2026 });
  assert.deepEqual(u, { anspruch: 25, genommen: 10, beantragt: 8, rest: 7 });
});

test("Titelprüfung GlBG § 9 Abs 1 und Adresse wie generateSlug", () => {
  for (const t of ["Monteur:in", "Monteur*in", "CAD-Planer/in (m/w/d)", "Verkäufer (w/m/d)", "VerkäuferIn", "Verkäuferin oder Verkäufer", "Monteurin / Monteur"]) assert.equal(pruefeTitel(t).neutral, true, t);
  for (const t of ["Monteur", "Installateur Sanitär/Heizung", ""]) assert.equal(pruefeTitel(t).neutral, false, t);
  assert.equal(slugAusTitel("CAD-Planer/in (m/w/d)"), "cad-planer-in-m-w-d");
  assert.equal(slugAusTitel("Verkäufer/in Einrichtungsberatung (m/w/d)"), "verkaeufer-in-einrichtungsberatung-m-w-d");
});

test("Slots: belegte Gespräche und Abwesenheit sperren, Vergangenheit entfällt", () => {
  const tage = wochenTageMoSa("2026-11-09");
  assert.equal(tage.length, 6);
  const belegt = belegteZeiten({ verantwortlich: "a", gespraeche: [{ name: "G", verantwortlich: "a", status: "Geplant", start: "2026-11-10 10:00:00", dauer_min: 60 }, { name: "H", verantwortlich: "b", status: "Geplant", start: "2026-11-10 11:00:00" }], abwesenheiten: [{ name: "A", von: "2026-11-12", bis: "2026-11-12" }], tage });
  const frei = freieZeiten({ tage, belegt, dauer: 60, jetzt: new Date(2026, 10, 9, 12, 0) });
  const di = frei.find((t) => t.tag === "2026-11-10").zeiten;
  assert.ok(!di.includes("10:00") && !di.includes("09:30") && di.includes("11:00") && di.includes("09:00"));
  assert.equal(frei.find((t) => t.tag === "2026-11-12").zeiten.length, 0);
  assert.ok(!frei.find((t) => t.tag === "2026-11-09").zeiten.includes("11:00"), "vor jetzt");
  assert.equal(hatFreieZeit([{ tag: "x", zeiten: [] }]), false);
});

test("Bewerbung: Züge nach Workflow und Rolle (§ 5.5)", () => {
  assert.deepEqual(bewerbungsZug("Eingegangen", "Gesichtet", "sachbearbeitung"), { art: "workflow", aktion: "Sichten", erlaubt: true });
  const abs = bewerbungsZug("Gesichtet", "Abgesagt", "sachbearbeitung");
  assert.equal(abs.erlaubt, false);
  assert.equal(abs.grund, "leitung");
  assert.deepEqual(bewerbungsZug("Eingegangen", "Gespraech", "leitung").kette, ["Sichten"]);
  assert.equal(bewerbungsZug("Gespraech", "Eingestellt", "leitung").art, "assistent");
  assert.equal(bewerbungsZug("Abgesagt", "Gesichtet", "leitung", { pseudonymisiert: 1 }), null);
  assert.ok(zieleVon("Angebot", "sachbearbeitung").some((z) => z.nach === "Eingestellt" && !z.zug.erlaubt));
});

test("Bewerbung: Primäraktion, Löschfrist, Kennzeichen, Board", () => {
  assert.equal(primaerBewerbung({ status: "Eingegangen" }, "sachbearbeitung").id, "gespraech");
  assert.equal(primaerBewerbung({ status: "Gespraech" }, "leitung", { gespraechVorbeiOffen: true }).id, "ergebnis");
  assert.equal(primaerBewerbung({ status: "Gespraech" }, "sachbearbeitung").id, "neuerTermin");
  assert.equal(primaerBewerbung({ status: "Angebot" }, "sachbearbeitung"), null);
  assert.equal(primaerBewerbung({ status: "Angebot", pseudonymisiert: 1 }, "leitung"), null);
  const f = loeschfristInfo({ loeschfrist: "2026-11-13" }, "2026-11-04");
  assert.deepEqual([f.rest, f.warnung, f.zustand], [9, true, "laeuft"]);
  assert.equal(loeschfristInfo({ loeschfrist: "2026-11-01" }, "2026-11-04").zustand, "faellig");
  assert.equal(loeschfristInfo({ loeschfrist: "2026-11-01", einwilligung_evidenz: 1, einwilligung_evidenz_bis: "2027-06-01" }, "2026-11-04").zustand, "laeuft");
  assert.equal(kartenKennzeichen({ quelle: "Website", unterlagen: [] }, { heute: "2026-11-04" }).art, "ohneUnterlagen");
  assert.equal(kartenKennzeichen({ loeschfrist: "2026-11-10" }, { naechstesGespraech: { start: "2026-11-05 10:00" }, heute: "2026-11-04" }).art, "gespraech");
  assert.equal(aufBoard({ status: "Eingestellt", entschieden_am: "2026-01-01 10:00:00" }, "2026-11-04"), false);
});

test("Stelle: Checkliste, Entgeltsatz wie logik.entgelt_text", () => {
  const s = { titel: "Monteur", kv_mindest_brutto_cent: 217800, entgelt_zeitraum: "Monat", kollektivvertrag: "KV Handel Arbeiter:innen", ueberzahlung: "ja", stellenbeschreibung: "x", aufgaben_de: [{}], anforderungen_de: [] };
  const c = stelleCheckliste(s);
  assert.deepEqual(c.map((x) => [x.id, x.blockiert]), [["anforderungen", true], ["titel", false]]);
  assert.match(entgeltSatz(s), /^Das kollektivvertragliche Mindestentgelt beträgt € 2\.178,00 brutto pro Monat \(KV Handel Arbeiter:innen\)\. Bereitschaft zur Überzahlung/);
  assert.deepEqual(entgeltFehlt({}), ["betrag", "zeitraum", "kollektivvertrag", "ueberzahlung"]);
});

test("Abwesenheit: Entscheidbarkeit, Teamstärke, Storno, Prüfung", () => {
  const a = { status: "Beantragt", owner: "chef@x" };
  assert.deepEqual(antragEntscheidbar(a, { rolle: "leitung", user: "chef@x", mitarbeiterUser: "anna@x" }), { darf: false, grund: "angelegt" });
  assert.deepEqual(antragEntscheidbar(a, { rolle: "leitung", user: "anna@x", mitarbeiterUser: "anna@x" }), { darf: false, grund: "eigen" });
  assert.equal(antragEntscheidbar(a, { rolle: "leitung", user: "chef@x", mitarbeiterUser: "anna@x", gleichGenehmigen: true }).darf, true);
  assert.equal(antragEntscheidbar(a, { rolle: "sachbearbeitung", user: "s@x" }).darf, false);
  const ma = [{ name: "1", team_verkauf: 1, status: "Aktiv" }, { name: "2", team_verkauf: 1, status: "Aktiv" }, { name: "3", team_verkauf: 1, status: "Karenz" }];
  assert.deepEqual(teamStaerke("verkauf", ma, [{ mitarbeiter: "1", von: "2026-11-04", bis: "2026-11-05", status: "Genehmigt" }], "2026-11-04"), { gesamt: 2, da: 1 });
  assert.equal(darfStornieren({ status: "Genehmigt", von: "2026-12-01" }, { eigen: true, rolle: "selbst", heute: "2026-11-04" }), false);
  assert.equal(darfStornieren({ status: "Beantragt" }, { eigen: true, rolle: "selbst" }), true);
  assert.equal(selbstKorrigierbar({ datum: "2026-11-03" }, "2026-11-04"), false);
  assert.equal(pruefeAbwesenheit({ mitarbeiter: "1", von: "2026-11-07", bis: "2026-11-08" }).text, "Der Zeitraum enthält keinen Arbeitstag");
  assert.equal(pruefeAbwesenheit({ mitarbeiter: "1", von: "2026-11-02", bis: "2026-11-03", halbtags: 1 }).text, "Halber Tag nur bei einem einzelnen Tag");
  assert.equal(pruefeAbwesenheit({ mitarbeiter: "1", von: "2026-11-02", bis: "2026-11-02", vertretung: "1" }).feld, "vertretung");
  assert.match(pruefeAbwesenheit({ mitarbeiter: "1", von: "2026-11-02", bis: "2026-11-04" }, [{ name: "x", mitarbeiter: "1", status: "Genehmigt", art: "Urlaub", von: "2026-11-04", bis: "2026-11-06" }]).text, /^Überschneidung/);
});

test("Status und Texte: keine Rohwerte, Krankenstand nie Rot, keine Ausrufezeichen", () => {
  assert.equal(statusText("bewerbung", "Gespraech"), "Gespräch");
  assert.equal(statusText("bewerbung", "Zurueckgezogen"), "Zurückgezogen");
  assert.equal(statusText("gespraech", "Durchgefuehrt"), "Durchgeführt");
  assert.equal(statusText("gespraech", "Abgesagt"), "Termin abgesagt");
  for (const s of Object.keys(STATUS.krank)) assert.notEqual(statusTon("krank", s), "rot");
  assert.equal(statusTon("stelle", "Aktiv"), "gruen");
  const alle = JSON.stringify(T, (k, v) => (typeof v === "function" ? v.toString() : v));
  for (const roh of ["Gespraech", "Zurueckgezogen", "Durchgefuehrt", "Slug", "Evidenz", "pseudonymisiert", "Cache"]) assert.equal(alle.includes(`"${roh}`) || new RegExp(`[ "„]${roh}[ ".“]`).test(alle), false, roh);
  assert.equal(/!["\s]/.test(alle.replace(/!==|!=|!\(|!\w/g, "")), false, "kein Ausrufezeichen");
});
