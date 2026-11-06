// Ablage (B-ABL): reine Regeln – Spiegel von Backend-Import/ph_ablage/ph_ablage/utils/regeln.py – und SHA-256.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  aufbewahrenBis, chunkPruefen, darfOrdner, darstellung, dateiAktionen, dateinameBereinigen, effektiverModus, endung, endungErlaubt, endungenListe,
  freigabeStatus, freigabeZustand, groesseText, istLeitung, kette, loeschenErlaubt, mimeFuer, neuerDateiname, papierkorbBis, resttage, sperreArt,
  tagsNormalisieren, teilePlan, tokenGueltig, uploadAnteil, uploadVorpruefung, vorschauArt, zeitGruppe,
} from "../../src/lib/backoffice/ablage/regeln.js";
import { sha256Hex, sha256Neu, mockPasswortHash } from "../../src/lib/backoffice/ablage/sha256.js";
import { T } from "../../src/lib/backoffice/ablage/texte.js";

test("Endung, Dateiname, MIME, Vorschau-Art wie regeln.py", () => {
  assert.equal(endung("Plan.final.DWG"), "dwg");
  assert.equal(endung(".bashrc"), "");
  assert.equal(endung("ohne"), "");
  assert.equal(endung("C:\\x\\Foto.JPG"), "jpg");
  assert.equal(dateinameBereinigen('a/b\\Plan:"1".pdf'), "Plan__1_.pdf");
  assert.equal(dateinameBereinigen("  ..  "), null);
  assert.equal(dateinameBereinigen("con.txt"), "_con.txt");
  assert.equal(dateinameBereinigen(`${"x".repeat(300)}.pdf`).length, 180);
  assert.equal(neuerDateiname("Neuer Name", "pdf"), "Neuer Name.pdf");
  assert.equal(neuerDateiname("Neu.pdf", "pdf"), "Neu.pdf");
  assert.equal(neuerDateiname("Neu.docx", "pdf"), "Neu.docx.pdf", "Endung bleibt fest");
  assert.equal(mimeFuer("a.dwg"), "application/acad");
  assert.equal(mimeFuer("a.unbekannt", "text/x-foo"), "text/x-foo");
  assert.equal(mimeFuer("a.unbekannt", "kaputt"), "application/octet-stream");
  assert.equal(vorschauArt("HEIC"), "bild");
  assert.equal(vorschauArt("skp"), "cad");
  assert.equal(vorschauArt("xlsx"), "office");
  assert.equal(vorschauArt("zip"), "keine");
});

test("Endungen: Sperrliste, Erlaubt-Liste, Liste aus Text", () => {
  assert.deepEqual(endungErlaubt("exe"), { ok: false, grund: "gesperrt" });
  assert.deepEqual(endungErlaubt("pdf"), { ok: true, grund: null });
  assert.deepEqual(endungErlaubt("pdf", ["dwg"]), { ok: false, grund: "nicht_erlaubt" });
  assert.deepEqual(endungErlaubt("exe", null, []), { ok: true, grund: null }, "leere Sperrliste = nichts gesperrt");
  assert.deepEqual([...endungenListe("pdf, .DOCX\n dwg ; ??")].sort(), ["docx", "dwg", "pdf"]);
});

test("Größe als Text wie der Server (1024er-Stufen, Komma)", () => {
  assert.equal(groesseText(0), "0 B");
  assert.equal(groesseText(1023), "1023 B");
  assert.equal(groesseText(1024), "1,0 KB");
  assert.equal(groesseText(3_620_000), "3,5 MB");
  assert.equal(groesseText(2 * 1024 ** 3), "2,0 GB");
});

test("Tags normalisieren: eindeutig, ohne #, höchstens 20 × 40 Zeichen", () => {
  assert.deepEqual(tagsNormalisieren("Küche, #küche; Rendering\nKunde"), ["Küche", "Rendering", "Kunde"]);
  assert.equal(tagsNormalisieren(Array.from({ length: 30 }, (_, i) => `t${i}`)).length, 20);
  assert.equal(tagsNormalisieren([`${"y".repeat(60)}`])[0].length, 40);
});

test("Aufbewahrung: Frist bis 31.12., Löschsperre Beleg, nur Leitung", () => {
  assert.equal(aufbewahrenBis("Beleg", "2026-03-10"), "2033-12-31");
  assert.equal(aufbewahrenBis("Marketing", "2026-03-10"), "2029-12-31");
  assert.equal(aufbewahrenBis("Allgemein", "2026-03-10"), null);
  assert.deepEqual(loeschenErlaubt("Beleg", "2033-12-31", "2026-11-04", true), { ok: false, grund: "aufbewahrung" });
  assert.deepEqual(loeschenErlaubt("Beleg", "2025-12-31", "2026-11-04", false), { ok: false, grund: "nur_leitung" });
  assert.deepEqual(loeschenErlaubt("Beleg", "2025-12-31", "2026-11-04", true), { ok: true, grund: null });
  assert.deepEqual(loeschenErlaubt("Personal", null, "2026-11-04", false), { ok: false, grund: "nur_leitung" });
  assert.deepEqual(loeschenErlaubt("Projekt", null, "2026-11-04", false), { ok: true, grund: null });
});

test("Papierkorb: Frist und Resttage", () => {
  assert.equal(papierkorbBis("2026-11-02 10:00:00", 30), "2026-12-02");
  assert.equal(resttage("2026-11-08", new Date(2026, 10, 4, 18)), 4);
  assert.equal(resttage("2026-11-01", new Date(2026, 10, 4)), 0);
  assert.equal(resttage(null), null);
});

test("Freigabelinks: Zustand wie freigabe_zustand", () => {
  const jetzt = new Date(2026, 10, 4, 12);
  assert.equal(freigabeZustand("Widerrufen", "2027-01-01", jetzt), "widerrufen");
  assert.equal(freigabeZustand("Aktiv", "2026-11-04 11:00:00", jetzt), "abgelaufen");
  assert.equal(freigabeZustand("Aktiv", "2026-11-10", jetzt, 3, 3), "aufgebraucht");
  assert.equal(freigabeZustand("Aktiv", "2026-11-10", jetzt, 2, 3), "ok");
  assert.equal(freigabeStatus({ status: "Aktiv", ablauf: "2026-11-01", downloads: 0 }, jetzt), "Abgelaufen");
  assert.equal(freigabeStatus({ status: "Aktiv", ablauf: "2026-12-01", downloads: 0 }, jetzt), "Aktiv");
  assert.ok(tokenGueltig("demoKuecheAbend01") && !tokenGueltig("kurz") && !tokenGueltig("<script>alert(1)</script>"));
});

test("Rechte: Leitung je Bezug, Personal nur Personal-Leitung, Ordner-Modus", () => {
  assert.ok(istLeitung(["PH Projekte Leitung"], "PH Projekt"));
  assert.ok(!istLeitung(["PH Projekte Leitung"], "PH Kontakt"));
  assert.ok(istLeitung(["PH Ablage Leitung"], "PH Kontakt"));
  assert.ok(!istLeitung(["PH Ablage Leitung"], "PH Mitarbeiter"), "Personal ersetzt die allgemeinen Leitungen");
  assert.ok(istLeitung(["PH Personal Leitung"], "PH Mitarbeiter"));
  assert.ok(!darfOrdner("leitung", ["PH CRM Mitarbeiter"], "PH Kontakt"));
  assert.ok(darfOrdner("leitung", ["PH CRM Leitung"], "PH Kontakt"));
  assert.ok(darfOrdner("team", ["PH CRM Mitarbeiter"], "PH Kontakt"));
  assert.ok(!darfOrdner("intern", ["PH CRM Mitarbeiter"], "PH Mitarbeiter"));
  assert.equal(effektiverModus(["intern", "team", ""]), "team");
  assert.equal(effektiverModus(["leitung", "intern"]), "leitung");
});

test("Sperre und Aktionen: fremd/eigen, Beleg gesperrt mit Grund, Papierkorb", () => {
  const jetzt = new Date(2026, 10, 4, 12);
  const basis = { status: "Aktiv", aufbewahrungsklasse: "Projekt", bezug_doctype: "PH Projekt" };
  const fremd = { ...basis, gesperrt_von: "b@x", gesperrt_bis: "2026-11-04 18:00:00" };
  assert.equal(sperreArt(fremd, "a@x", jetzt), "fremd");
  assert.equal(sperreArt(fremd, "b@x", jetzt), "eigen");
  assert.equal(sperreArt({ ...fremd, gesperrt_bis: "2026-11-04 10:00:00" }, "a@x", jetzt), null);
  const a = dateiAktionen(fremd, { user: "a@x", rollen: ["PH CRM Mitarbeiter"], jetzt });
  assert.equal(a.umbenennen.an, false);
  assert.match(a.umbenennen.grund, /ausgecheckt/i);
  assert.equal(a.aufheben.an, false);
  assert.equal(dateiAktionen(fremd, { user: "a@x", rollen: ["PH Projekte Leitung"], jetzt }).aufheben.an, true);
  const beleg = dateiAktionen({ ...basis, aufbewahrungsklasse: "Beleg", aufbewahren_bis: "2033-12-31" }, { user: "a@x", rollen: ["PH Ablage Leitung"], jetzt });
  assert.equal(beleg.papierkorb.an, false);
  assert.match(beleg.papierkorb.grund, /Aufbewahrungspflicht bis 31\.12\.2033/);
  const korb = dateiAktionen({ ...basis, status: "Papierkorb" }, { user: "a@x", rollen: ["PH CRM Mitarbeiter"], jetzt });
  assert.equal(korb.wiederherstellen.an, true);
  assert.equal(korb.endgueltig.an, false);
  assert.equal(korb.endgueltig.grund, "Nur Ablage-Leitung");
  assert.equal(dateiAktionen({ ...basis, status: "Papierkorb" }, { user: "a@x", rollen: ["PH Ablage Leitung"], jetzt }).endgueltig.an, true);
  const lesen = dateiAktionen(basis, { user: "a@x", rollen: ["PH Geschäftsführung"], jetzt, schreiben: false });
  assert.ok(lesen.herunterladen.an && !lesen.teilen.an && !lesen.papierkorb.an);
  assert.equal(dateiAktionen(basis, { user: "a@x", rollen: [], jetzt, portal: false }).portal.grund, "Kundenportal nicht eingerichtet");
});

test("Darstellung: Bild/PDF inline, Office nur mit Vorschau", () => {
  assert.equal(darstellung({ endung: "jpg" }), "bild");
  assert.equal(darstellung({ endung: "pdf" }), "pdf");
  assert.equal(darstellung({ endung: "docx", vorschau_status: "Fertig" }), "kachel");
  assert.equal(darstellung({ endung: "docx", vorschau_status: "Fertig" }, { officeVorschau: true }), "pdf");
  assert.equal(darstellung({ endung: "dwg" }), "kachel");
});

test("Upload: Teile, Chunk-Prüfung, Vorprüfung, Fortschritt", () => {
  assert.deepEqual(teilePlan(10, 4), [{ offset: 0, laenge: 4 }, { offset: 4, laenge: 4 }, { offset: 8, laenge: 2 }]);
  assert.deepEqual(teilePlan(0, 4), []);
  assert.deepEqual(chunkPruefen(0, 4, 0, 10, 8), { ok: true, code: null });
  assert.deepEqual(chunkPruefen(4, 4, 0, 10, 8), { ok: false, code: "offset" });
  assert.deepEqual(chunkPruefen(0, 9, 0, 10, 8), { ok: false, code: "zu_gross" });
  assert.deepEqual(chunkPruefen(8, 4, 8, 10, 8), { ok: false, code: "ueber_groesse" });
  assert.equal(uploadVorpruefung({ name: "x.exe", size: 1 }, {}, T.upload), ".exe ist nicht erlaubt");
  assert.equal(uploadVorpruefung({ name: "x.pdf", size: 3 * 1024 ** 3 }, { max_bytes: 2 * 1024 ** 3 }, T.upload), "größer als 2,0 GB");
  assert.equal(uploadVorpruefung({ name: "x.pdf", size: 3 }, { max_bytes: 10 }, T.upload), null);
  assert.ok(Math.abs(uploadAnteil({ pruefung: 1, gesendet: 5, groesse: 10 }) - 0.6) < 1e-9);
});

test("Baum: Kette, Zeitgruppen", () => {
  const karte = new Map([["a", { ordner: "a", eltern: null }], ["b", { ordner: "b", eltern: "a" }], ["c", { ordner: "c", eltern: "b" }]]);
  assert.deepEqual(kette("c", karte).map((o) => o.ordner), ["a", "b", "c"]);
  const j = new Date(2026, 10, 4, 12);
  assert.equal(zeitGruppe("2026-11-04 08:00:00", j), "heute");
  assert.equal(zeitGruppe("2026-11-03 23:00:00", j), "gestern");
  assert.equal(zeitGruppe("2026-10-30 08:00:00", j), "woche");
  assert.equal(zeitGruppe("2026-09-01", j), "aelter");
});

test("SHA-256 streamend = node:crypto (auch über Blockgrenzen)", () => {
  for (const n of [0, 1, 55, 56, 63, 64, 65, 1000, 70_000]) {
    const b = new Uint8Array(n).map((_, i) => (i * 31 + 7) & 0xff);
    assert.equal(sha256Hex(b), createHash("sha256").update(b).digest("hex"), `Länge ${n}`);
    const h = sha256Neu();
    for (let o = 0; o < n; o += 17) h.update(b.subarray(o, o + 17));
    assert.equal(h.hex(), createHash("sha256").update(b).digest("hex"), `Teile ${n}`);
  }
  assert.equal(sha256Hex("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.notEqual(mockPasswortHash("seeblick"), mockPasswortHash("Seeblick"));
});

test("Texte: keine Ausrufezeichen, keine Superlative", () => {
  const alle = [];
  const sammle = (x) => {
    if (typeof x === "string") alle.push(x);
    else if (typeof x === "function") {
      const r = x("X", "Y");
      if (typeof r === "string") alle.push(r);
      else if (r && typeof r === "object") sammle(r);
    } else if (x && typeof x === "object") Object.values(x).forEach(sammle);
  };
  sammle(T);
  for (const t of alle) {
    assert.ok(!t.includes("!"), `Ausrufezeichen: ${t}`);
    assert.ok(!/\b(beste|perfekt|super|einfach genial|erfolgreich)\b/i.test(t), `Floskel: ${t}`);
  }
});
