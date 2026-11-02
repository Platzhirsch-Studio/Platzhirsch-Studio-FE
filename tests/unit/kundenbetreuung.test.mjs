// tests/unit/kundenbetreuung.test.mjs — Welle 2, automatische Kundenbetreuung.
// Run: node --test tests/unit/kundenbetreuung.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { REISEN, PFLEGE_MODULE, pruefeAlleReisen, reiseById } from "../../src/lib/kundenbetreuung/reisen.js";
import { darfSenden, pruefeReise } from "../../src/lib/kundenbetreuung/rechtsgrundlagen.js";
import { FUSSZEILEN, mailHtml, reiseMailHtml } from "../../src/lib/kundenbetreuung/mail.js";
import { SYSTEM_MAILS, systemMailHtml } from "../../src/lib/kundenbetreuung/systemMails.js";

test("die sieben beauftragten Reisen sind da", () => {
  assert.deepEqual(REISEN.map((r) => r.id), ["danke", "pflege", "bewertung", "outdoor", "advent", "jahrestag", "merkliste"]);
  assert.equal(reiseById("pflege").ausloeser.versatzTage, 14);
  assert.equal(reiseById("bewertung").ausloeser.versatzTage, 42);
  assert.match(reiseById("bewertung").vorlage.cta.url, /bewerten/);
});

test("jede Reise erfüllt die Regeln ihrer Rechtsgrundlage", () => {
  assert.deepEqual(pruefeAlleReisen(), []);
});

test("Regelprüfung erkennt Verstöße", () => {
  assert.ok(pruefeReise({ id: "x", werbung: true, rechtsgrundlage: ["V"], abmeldelink: true }).length);
  assert.ok(pruefeReise({ id: "x", werbung: true, rechtsgrundlage: ["B"], abmeldelink: true }).some((f) => /ähnliche/.test(f)));
  assert.ok(pruefeReise({ id: "merkliste", nurEinwilligung: true, werbung: true, rechtsgrundlage: ["E", "B"], zweck: "merkliste_erinnerung", abmeldelink: true, aehnlicheProdukte: "x", ecgAbgleich: true }).length);
  assert.ok(pruefeReise({ id: "x", werbung: false, rechtsgrundlage: ["V"], vorlage: { absaetze: ["Ihr Gutschein"] } }).length);
  assert.ok(pruefeReise({ id: "bewertung", werbung: true, rechtsgrundlage: ["B"], abmeldelink: true, aehnlicheProdukte: "x", ecgAbgleich: true, vorlage: { absaetze: ["Empfehlen Sie uns"] } }).length);
});

test("Service vs. Werbung: Grundlagen pro Reise", () => {
  for (const id of ["danke", "pflege"]) assert.deepEqual(reiseById(id).rechtsgrundlage, ["V"], id);
  assert.deepEqual(reiseById("merkliste").rechtsgrundlage, ["E"]);
  for (const r of REISEN.filter((r) => r.werbung)) assert.ok(r.abmeldelink, r.id);
});

test("darfSenden: Widerspruch, ECG, Einwilligung, Frequenz, Reklamation", () => {
  const outdoor = reiseById("outdoor");
  const kunde = { hatAuftrag: true, gekaufteSegmente: ["outdoor"], widerspruchshinweisBeiErhebung: { datum: "2026-05-02", quelle: "Kaufvertrag" } };
  assert.deepEqual(darfSenden(outdoor, kunde), { ok: true, grundlage: "B" });
  assert.equal(darfSenden(outdoor, { ...kunde, widerspruch: true }).ok, false);
  assert.equal(darfSenden(outdoor, { ...kunde, ecgListe: true }).ok, false);
  assert.equal(darfSenden(outdoor, { ...kunde, reklamationOffen: true }).grund, "reklamation_offen");
  assert.equal(darfSenden(outdoor, { ...kunde, werblicheMails30Tage: 2 }).grund, "frequenzgrenze");
  const merk = reiseById("merkliste");
  assert.equal(darfSenden(merk, kunde).ok, false, "Merkliste ohne Einwilligung nie");
  assert.deepEqual(darfSenden(merk, { einwilligungen: { merkliste_erinnerung: { doiBestaetigt: true } } }), { ok: true, grundlage: "E" });
  assert.equal(darfSenden(merk, { einwilligungen: { merkliste_erinnerung: { doiBestaetigt: true, widerrufen: true } } }).ok, false);
  assert.deepEqual(darfSenden(reiseById("pflege"), { widerspruch: true }), { ok: true, grundlage: "V" });
});

// QA Welle 2 P1-5 / P2-9
test("B nur mit Widerspruchshinweis bei der Erhebung, Outdoor-B nur mit Outdoor-Kauf, Bewertung nur E", () => {
  const outdoor = reiseById("outdoor");
  const hinweis = { datum: "2026-05-02", quelle: "Kaufvertrag" };
  const ohneHinweis = darfSenden(outdoor, { hatAuftrag: true, gekaufteSegmente: ["outdoor"] });
  assert.deepEqual(ohneHinweis, { ok: false, grund: "kein_widerspruchshinweis", ersatz: "brief" });
  assert.equal(darfSenden(outdoor, { hatAuftrag: true, gekaufteSegmente: ["outdoor"], widerspruchshinweisBeiErhebung: { datum: "2026-05-02" } }).ok, false, "Quelle fehlt");
  assert.equal(darfSenden(outdoor, { hatAuftrag: true, gekaufteSegmente: [], widerspruchshinweisBeiErhebung: hinweis }).grund, "b_ohne_passenden_kauf");
  assert.deepEqual(darfSenden(outdoor, { einwilligungen: { newsletter: { doiBestaetigt: true } } }), { ok: true, grundlage: "E" }, "Interesse nur über E");
  assert.deepEqual(darfSenden(reiseById("jahrestag"), { hatAuftrag: true, widerspruchshinweisBeiErhebung: hinweis }), { ok: true, grundlage: "B" });
  const bew = reiseById("bewertung");
  assert.deepEqual(bew.rechtsgrundlage, ["E"]);
  assert.equal(darfSenden(bew, { hatAuftrag: true, widerspruchshinweisBeiErhebung: hinweis }).ok, false);
  assert.deepEqual(darfSenden(bew, { einwilligungen: { rueckmeldung: { doiBestaetigt: true } } }), { ok: true, grundlage: "E" });
  assert.ok(pruefeReise({ ...bew, rechtsgrundlage: ["B"], aehnlicheProdukte: "x" }).some((f) => /Kanzlei/.test(f)));
  assert.ok(pruefeReise({ ...outdoor, bNurMitKauf: undefined }).some((f) => /Interessen/.test(f)));
});

test("Mails: Fußzeile passt zur Grundlage, Werbung mit Abmeldelink, Impressum Landstraße 11", () => {
  for (const r of REISEN) {
    const html = reiseMailHtml(r);
    assert.match(html, /Landstraße 11/);
    assert.doesNotMatch(html, /Landstraße 9\b/);
    assert.doesNotMatch(html, /[a-zäöü]!(\s|<)/i, r.id);
    if (r.werbung) assert.match(html, /abmelde_url|fusszeile_html/, r.id);
    else assert.doesNotMatch(html, /abmelde_url/, r.id);
  }
  assert.throws(() => mailHtml({ betreff: "x", inhalt: "", fusszeile: "Z" }));
  assert.match(FUSSZEILEN.B, /kostenlos/);
  for (const m of SYSTEM_MAILS) assert.match(systemMailHtml(m), /Antwort auf Ihre Anfrage oder Anmeldung/);
});

test("Pflegemodule: Herstellerhinweis, keine Marken-/Preisaussagen", () => {
  assert.match(reiseById("pflege").vorlage.absaetze.join(" "), /Pflegeanleitung des Herstellers/);
  for (const [k, m] of Object.entries(PFLEGE_MODULE)) {
    assert.ok(m.titel && m.text, k);
    assert.doesNotMatch(m.text, /€|Rabatt|Minotti|Poliform/, k);
  }
});

test("Bewertungsbitte: kein Anreiz, keine Kopplung an die Empfehlung", () => {
  const txt = JSON.stringify(reiseById("bewertung").vorlage);
  assert.doesNotMatch(txt, /Gutschein|empfehl|Gewinn|5 Sterne/i);
  assert.equal(reiseById("bewertung").einmalig, true);
});
