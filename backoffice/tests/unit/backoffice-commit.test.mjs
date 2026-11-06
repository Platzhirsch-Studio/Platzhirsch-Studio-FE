// Verzögerter Commit (G-03, Team P0-3): Server-Kern (Idempotenz, Verwerfen, Nachlauf, Meldungen),
// Anfrageprüfung der Route, Aktionen-Register und Client-Warteschlange (Queue je Datensatz, Pause, Gruppe,
// flush, Beacon, Netzfehler) mit falscher Uhr.
//   node --test tests/unit/backoffice-commit.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { MemorySessionStore } from "../../src/lib/backoffice/auth/store.js";
import { COMMIT_MS, NACHLAUF_MS, PAUSE_MAX_MS, erzeugeCommitDienst, istToken, normObjekt, objektSchluessel, pruefeAnfrage } from "../../src/lib/backoffice/commit/kern.js";
import { behalteZeilen, erzeugeWarteschlange } from "../../src/lib/backoffice/commit/warteschlange.js";
import { AKTIONEN, TEILE, commitAktion, pruefeAktionen } from "../../src/lib/backoffice/commit/aktionen/index.js";
import { COMMIT_TEXTE, grundAus } from "../../src/lib/backoffice/commit/texte.js";
import { REIHENFOLGE } from "../../src/lib/backoffice/bereiche/index.js";

const LENA = { user: "lena@demo.local", name: "Lena Moosbrugger", roles: ["PH CRM Mitarbeiter"], sid: "sid-lena", standort: "Lochau" };
const TOM = { user: "tom@demo.local", name: "Tom Riedmann", roles: ["PH CRM Mitarbeiter"], sid: "sid-tom" };

function aufbau({ aktionen = {}, sitzung = async (e) => ({ user: e.user, roles: e.roles }) } = {}) {
  let t = 1_000_000;
  const store = new MemorySessionStore({ jetzt: () => t });
  const aufrufe = [];
  const vermerkt = [];
  const tabelle = {
    "crm.annehmen": async ({ args, quelle, session }) => {
      aufrufe.push({ args, quelle, user: session.user });
      return { status: "Angenommen" };
    },
    ...aktionen,
  };
  const dienst = erzeugeCommitDienst({ store, aktion: (n) => tabelle[n], sitzungFuer: sitzung, vermerke: (e, q) => vermerkt.push({ name: e.objekt?.name, q }), jetzt: () => t, warte: async () => {} });
  return { dienst, store, aufrufe, vermerkt, uhr: { vor: (ms) => (t += ms), jetzt: () => t } };
}

// ------------------------------------------------------------------ Server-Kern --

test("Kern: planen → genau einmal ausführen (auch doppelt und gleichzeitig)", async () => {
  const { dienst, aufrufe } = aufbau();
  const p = await dienst.plane(LENA, { action: "crm.annehmen", args: { name: "AN-1" }, objekt: { doctype: "PH Anfrage", name: "AN-1" } });
  assert.equal(p.ok, true);
  assert.ok(istToken(p.token));
  assert.equal(p.ms, COMMIT_MS);
  assert.deepEqual(p.objekt, { doctype: "PH Anfrage", name: "AN-1" });
  const [a, b] = await Promise.all([dienst.fuehreAus(p.token, { session: LENA }), dienst.fuehreAus(p.token, { session: LENA })]);
  assert.equal(aufrufe.length, 1, "Aktion genau einmal");
  assert.ok(a.ok && b.ok);
  assert.ok([a, b].some((r) => r.bereits), "zweiter Aufruf bekommt das gespeicherte Ergebnis");
  const c = await dienst.fuehreAus(p.token, { session: LENA });
  assert.deepEqual(c, { ok: true, status: "ausgefuehrt", ergebnis: { status: "Angenommen" }, bereits: true });
  assert.equal(aufrufe.length, 1);
  assert.equal((await dienst.status(p.token)).zustand, "ausgefuehrt");
});

test("Kern: verwerfen schließt Ausführen aus – und umgekehrt", async () => {
  const { dienst, aufrufe } = aufbau();
  const p = await dienst.plane(LENA, { action: "crm.annehmen", args: {} });
  assert.deepEqual(await dienst.verwerfe(p.token, { session: LENA }), { ok: true, status: "verworfen" });
  const r = await dienst.fuehreAus(p.token, { session: LENA });
  assert.equal(r.ok, false);
  assert.equal(r.status, "verworfen");
  assert.equal(aufrufe.length, 0);
  assert.equal((await dienst.verwerfe(p.token, { session: LENA })).bereits, true);

  const q = await dienst.plane(LENA, { action: "crm.annehmen", args: {} });
  await dienst.fuehreAus(q.token, { session: LENA });
  const v = await dienst.verwerfe(q.token, { session: LENA });
  assert.equal(v.ok, false);
  assert.equal(v.code, "conflict");
  assert.equal(v.message, COMMIT_TEXTE.schonAusgefuehrt);
});

test("Kern: fremde Tokens und unbekannte Tokens", async () => {
  const { dienst, aufrufe } = aufbau();
  const p = await dienst.plane(LENA, { action: "crm.annehmen" });
  assert.equal((await dienst.fuehreAus(p.token, { session: TOM })).code, "forbidden");
  assert.equal((await dienst.verwerfe(p.token, { session: TOM })).code, "forbidden");
  assert.equal(await dienst.status(p.token, { session: TOM }), null);
  assert.equal((await dienst.fuehreAus("c_" + "x".repeat(32), { session: LENA })).code, "not_found");
  assert.equal((await dienst.fuehreAus("kaputt", { session: LENA })).code, "invalid");
  assert.equal(aufrufe.length, 0);
});

test("Kern: Schlüssel verhindert Doppelplanung, solange geplant", async () => {
  const { dienst } = aufbau();
  const a = await dienst.plane(LENA, { action: "crm.annehmen", schluessel: "annehmen:AN-1" });
  const b = await dienst.plane(LENA, { action: "crm.annehmen", schluessel: "annehmen:AN-1" });
  assert.equal(b.token, a.token);
  assert.equal(b.wiederverwendet, true);
  const fremd = await dienst.plane(TOM, { action: "crm.annehmen", schluessel: "annehmen:AN-1" });
  assert.notEqual(fremd.token, a.token, "Schlüssel gilt je Benutzer");
  await dienst.fuehreAus(a.token, { session: LENA });
  const c = await dienst.plane(LENA, { action: "crm.annehmen", schluessel: "annehmen:AN-1" });
  assert.notEqual(c.token, a.token, "nach dem Ausführen neu");
});

test("Kern: Programmierfehler werfen, Dauer wird begrenzt", async () => {
  const { dienst } = aufbau();
  await assert.rejects(() => dienst.plane(LENA, { action: "crm.gibtsnicht" }), /nicht registriert/);
  await assert.rejects(() => dienst.plane(LENA, { action: "Kaputt Name" }), /Ungültiger Aktionsname/);
  await assert.rejects(() => dienst.plane(null, { action: "crm.annehmen" }), /Sitzung/);
  await assert.rejects(() => dienst.plane(LENA, { action: "crm.annehmen", args: { n: 1n } }), /JSON/);
  await assert.rejects(() => dienst.plane(LENA, { action: "crm.annehmen", args: { t: "x".repeat(20_000) } }), /zu groß/);
  assert.equal((await dienst.plane(LENA, { action: "crm.annehmen", ms: 10 })).ms, 1000);
  assert.equal((await dienst.plane(LENA, { action: "crm.annehmen", ms: 600_000 })).ms, 60_000);
  assert.equal((await dienst.plane(LENA, { action: "crm.annehmen", ms: 6000 })).ms, 6000);
});

test("Kern: Nachlauf führt 30 s nach der Frist selbst aus und vermerkt es", async () => {
  const { dienst, aufrufe, vermerkt, uhr } = aufbau();
  const p = await dienst.plane(LENA, { action: "crm.annehmen", args: { name: "AN-7" }, objekt: { doctype: "PH Anfrage", name: "AN-7" } });
  uhr.vor(COMMIT_MS + NACHLAUF_MS - 1);
  assert.deepEqual(await dienst.nachlauf(), []);
  assert.equal(aufrufe.length, 0);
  uhr.vor(1);
  const r = await dienst.nachlauf();
  assert.equal(r.length, 1);
  assert.equal(r[0].status, "ausgefuehrt");
  assert.deepEqual(aufrufe, [{ args: { name: "AN-7" }, quelle: "nachlauf", user: LENA.user }]);
  assert.deepEqual(vermerkt, [{ name: "AN-7", q: "nachlauf" }]);
  assert.deepEqual(await dienst.nachlauf(), [], "danach nichts mehr offen");
  const prot = await dienst.protokoll();
  assert.equal(prot[0].art, "nachlauf");
  assert.equal(prot[0].user, LENA.user);
  assert.equal("args" in prot[0], false, "Protokoll ohne Werte");
});

test("Kern: Nachlauf ohne Sitzung → fehlgeschlagen + Meldung, nie still verworfen", async () => {
  const { dienst, aufrufe, uhr } = aufbau({ sitzung: async () => null });
  await dienst.plane(LENA, { action: "crm.annehmen", objekt: { doctype: "PH Anfrage", name: "AN-9" }, titel: "Annehmen von AN-9" });
  uhr.vor(COMMIT_MS + NACHLAUF_MS);
  const [r] = await dienst.nachlauf();
  assert.equal(r.ok, false);
  assert.equal(r.code, "auth");
  assert.equal(aufrufe.length, 0);
  const m = await dienst.meldungen(LENA);
  assert.equal(m.length, 1);
  assert.equal(m[0].text, `Annehmen von AN-9 hat nicht geklappt – ${COMMIT_TEXTE.sitzungBeendet}`);
  assert.deepEqual(await dienst.meldungen(TOM), []);
  assert.equal(await dienst.quittiereMeldung(LENA, m[0].id), true);
  assert.deepEqual(await dienst.meldungen(LENA), []);
});

test("Kern: Fehler der Aktion → Zustand, Meldung, Codes nur aus der Liste", async () => {
  const { dienst } = aufbau({
    aktionen: {
      "crm.nein": async () => ({ ok: false, code: "conflict", message: "Die Anfrage ist schon vergeben." }),
      "crm.wirft": async () => {
        throw Object.assign(new Error("Keine Berechtigung."), { code: "forbidden" });
      },
      "crm.kaputt": async () => {
        throw new Error("geheim: stack");
      },
    },
  });
  const a = await dienst.plane(LENA, { action: "crm.nein", titel: "Annehmen von AN-3" });
  assert.deepEqual(await dienst.fuehreAus(a.token, { session: LENA }), { ok: false, code: "conflict", status: "fehlgeschlagen", message: "Die Anfrage ist schon vergeben." });
  const b = await dienst.plane(LENA, { action: "crm.wirft" });
  assert.equal((await dienst.fuehreAus(b.token, { session: LENA })).code, "forbidden");
  const c = await dienst.plane(LENA, { action: "crm.kaputt" });
  const rc = await dienst.fuehreAus(c.token, { session: LENA });
  assert.equal(rc.code, "unavailable");
  assert.equal(rc.message, COMMIT_TEXTE.unerwartet, "kein interner Text nach außen");
  const m = await dienst.meldungen(LENA);
  assert.equal(m.length, 3);
  assert.ok(m.some((x) => x.text === "Annehmen von AN-3 hat nicht geklappt – Die Anfrage ist schon vergeben"));
  // zweiter Aufruf liefert den gespeicherten Fehler, ohne erneut auszuführen
  const again = await dienst.fuehreAus(a.token, { session: LENA });
  assert.equal(again.bereits, true);
  assert.equal(again.status, "fehlgeschlagen");
});

test("Kern: Objekt, Texte, Anfrage der Route", () => {
  assert.deepEqual(normObjekt("PH Anfrage:AN-1"), { doctype: "PH Anfrage", name: "AN-1" });
  assert.equal(objektSchluessel({ doctype: "PH Anfrage", name: "AN-1", titel: "x" }), "PH Anfrage:AN-1");
  assert.equal(objektSchluessel(null), null);
  assert.equal(grundAus({ message: "Gesperrt. " }), "Gesperrt");
  assert.equal(grundAus({}), COMMIT_TEXTE.unerwartet);
  const t = "c_" + "A".repeat(32);
  assert.deepEqual(pruefeAnfrage(JSON.stringify({ tokens: [t, t] })), { ok: true, art: "commit", tokens: [t] });
  assert.deepEqual(pruefeAnfrage(JSON.stringify({ art: "verwerfen", token: t })), { ok: true, art: "verwerfen", tokens: [t] });
  assert.equal(pruefeAnfrage(JSON.stringify({ art: "status", tokens: [t] })).art, "status");
  assert.equal(pruefeAnfrage(JSON.stringify({ art: "demo-plane", daten: { name: "X" } })).art, "demo-plane");
  for (const schlecht of ["", "{", "null", JSON.stringify({ tokens: [] }), JSON.stringify({ tokens: ["x"] }), JSON.stringify({ art: "loeschen", tokens: [t] }), JSON.stringify({ tokens: Array.from({ length: 21 }, (_, i) => "c_" + String(i).padStart(32, "A")) }), "x".repeat(9000)]) {
    assert.equal(pruefeAnfrage(schlecht).ok, false, schlecht.slice(0, 40));
  }
});

test("Texte: Umlaute korrekt, keine Ausrufezeichen", () => {
  const alle = Object.values(COMMIT_TEXTE).map((v) => (typeof v === "function" ? v(3, "Grund") : v));
  assert.ok(alle.every((s) => !s.includes("!")));
  assert.ok(!alle.some((s) => /ae|oe|ue/.test(s.replace(/Queue|aktuell|Steuer|neue|euer/gi, ""))), "keine Umschreibungen");
  assert.equal(COMMIT_TEXTE.ausstehend(6), "wird in 6 s gespeichert");
  assert.equal(COMMIT_TEXTE.rueckgaengigSekunden(6), "Rückgängig (6 s)");
});

// ------------------------------------------------------------------ Aktionen-Register --

test("Aktionen: Teildatei je Bereich, Namen passen, Fundament-Aktionen", async () => {
  assert.deepEqual(Object.keys(TEILE).sort(), ["fundament", ...REIHENFOLGE].sort());
  assert.deepEqual(pruefeAktionen(), []);
  assert.deepEqual(pruefeAktionen({ crm: { "shop.x": async () => 1 }, shop: { "shop.x": 1 } }).length, 3);
  for (const n of ["fundament.workflow", "fundament.methode", "fundament.demo"]) assert.equal(typeof commitAktion(n), "function");
  assert.equal(AKTIONEN.size >= 3, true);
  const demo = commitAktion("fundament.demo");
  assert.deepEqual(await demo({ client: { modus: "mock" }, args: {}, quelle: "client" }), { gespeichert: true, quelle: "client" });
  assert.equal((await demo({ client: { modus: "mock" }, args: { fehler: true } })).ok, false);
  assert.equal((await demo({ client: { modus: "frappe" }, args: {} })).code, "forbidden");
  const wf = commitAktion("fundament.workflow");
  const gerufen = [];
  const r = await wf({ client: { workflowAction: async (...a) => gerufen.push(a) }, args: { doctype: "PH Anfrage", name: "AN-1", aktion: "Annehmen", pfad: "/crm/anfragen" }, revalidiere: (p) => gerufen.push(p) });
  assert.deepEqual(r, { name: "AN-1" });
  assert.deepEqual(gerufen, [["PH Anfrage", "AN-1", "Annehmen"], "/crm/anfragen"]);
  assert.equal((await wf({ client: {}, args: { doctype: "PH Anfrage" }, revalidiere() {} })).code, "invalid");
});

// ------------------------------------------------------------------ Client-Warteschlange --

function falscheUhr() {
  let t = 0;
  let nr = 0;
  const timer = new Map();
  const ruhe = async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve();
  };
  return {
    jetzt: () => t,
    setTimeout: (fn, ms) => {
      timer.set(++nr, { fn, bis: t + ms });
      return nr;
    },
    clearTimeout: (id) => timer.delete(id),
    offen: () => timer.size,
    async vor(ms) {
      const ziel = t + ms;
      for (;;) {
        const n = [...timer.entries()].filter(([, x]) => x.bis <= ziel).sort((a, b) => a[1].bis - b[1].bis)[0];
        if (!n) break;
        t = n[1].bis;
        timer.delete(n[0]);
        n[1].fn();
        await ruhe();
      }
      t = ziel;
      await ruhe();
    },
    ruhe,
  };
}

const TOK = (i) => "c_" + String(i).padStart(32, "T");

function schlange(opts = {}) {
  const uhr = falscheUhr();
  const ausgefuehrt = [];
  const verworfen = [];
  const beacons = [];
  const ereignisse = [];
  const q = erzeugeWarteschlange({
    uhr,
    ausfuehren: async (tokens) => {
      ausgefuehrt.push(tokens);
      if (opts.ausfuehren) return opts.ausfuehren(tokens);
      return { ok: true, ergebnisse: tokens.map((token) => ({ token, ok: true, status: "ausgefuehrt" })) };
    },
    verwerfen: async (tokens) => {
      verworfen.push(tokens);
      if (opts.verwerfen) return opts.verwerfen(tokens);
      return { ok: true, ergebnisse: tokens.map((token) => ({ token, ok: true, status: "verworfen" })) };
    },
    beacon: (tokens) => {
      beacons.push(tokens);
      return true;
    },
  });
  q.hoere((e) => ereignisse.push(e.art));
  return { q, uhr, ausgefuehrt, verworfen, beacons, ereignisse };
}

test("Queue: nach 8 s ausgeführt; Rückgängig davor → kein Ausführen", async () => {
  const { q, uhr, ausgefuehrt, verworfen, ereignisse } = schlange();
  const erfolg = [];
  q.starte("Anfrage angenommen", { token: TOK(1), objekt: "PH Anfrage:AN-1", onErfolg: (r) => erfolg.push(r.token) });
  assert.equal(q.ausstehend({ doctype: "PH Anfrage", name: "AN-1" }).rest, COMMIT_MS);
  await uhr.vor(COMMIT_MS - 1);
  assert.deepEqual(ausgefuehrt, []);
  await uhr.vor(1);
  assert.deepEqual(ausgefuehrt, [[TOK(1)]]);
  assert.deepEqual(erfolg, [TOK(1)]);
  assert.equal(q.ausstehend("PH Anfrage:AN-1"), null);

  const zurueck = [];
  const id = q.starte("Anfrage angenommen", { token: TOK(2), objekt: "PH Anfrage:AN-2", onVerworfen: () => zurueck.push(2) });
  await uhr.vor(3000);
  await q.rueckgaengig(id);
  await uhr.vor(20_000);
  assert.deepEqual(ausgefuehrt, [[TOK(1)]], "nach Rückgängig kein Server-Aufruf zum Ausführen");
  assert.deepEqual(verworfen, [[TOK(2)]]);
  assert.deepEqual(zurueck, [2]);
  assert.deepEqual(ereignisse, ["neu", "fertig", "neu", "verworfen"]);
  assert.equal(uhr.offen(), 0);
});

test("Queue: Pause bei Hover verlängert, ist aber gedeckelt", async () => {
  const { q, uhr, ausgefuehrt } = schlange();
  const id = q.starte("Gespeichert", { token: TOK(3) });
  await uhr.vor(2000);
  q.pausiere(id);
  assert.equal(q.vorgang(id).pausiert, true);
  assert.equal(q.vorgang(id).rest, 6000);
  await uhr.vor(5000);
  q.fortsetzen(id);
  await uhr.vor(5999);
  assert.deepEqual(ausgefuehrt, []);
  await uhr.vor(1);
  assert.deepEqual(ausgefuehrt, [[TOK(3)]]);

  const id2 = q.starte("Gespeichert", { token: TOK(4) });
  q.pausiere(id2);
  await uhr.vor(PAUSE_MAX_MS);
  assert.equal(q.vorgang(id2).pausiert, false, "Deckel hebt die Pause auf");
  await uhr.vor(COMMIT_MS);
  assert.deepEqual(ausgefuehrt.at(-1), [TOK(4)]);
  assert.ok(PAUSE_MAX_MS + COMMIT_MS < COMMIT_MS + NACHLAUF_MS, "Client entscheidet immer vor dem Server-Nachlauf");
});

test("Queue: gleichartige werden zusammengefasst, Rückgängig nimmt alle zurück", async () => {
  const { q, uhr, ausgefuehrt, verworfen } = schlange();
  const a = q.starte("Anfrage angenommen", { token: TOK(5), objekt: "PH Anfrage:AN-5", gruppe: "annehmen", sammel: (n) => `${n} Anfragen angenommen` });
  await uhr.vor(4000);
  const b = q.starte("Anfrage angenommen", { token: TOK(6), objekt: "PH Anfrage:AN-6", gruppe: "annehmen", sammel: (n) => `${n} Anfragen angenommen` });
  assert.equal(a, b);
  const v = q.vorgang(a);
  assert.equal(v.text, "2 Anfragen angenommen");
  assert.equal(v.rest, COMMIT_MS, "Timer neu");
  assert.equal(v.lauf, 2, "Balken startet neu");
  await q.rueckgaengig(a);
  assert.deepEqual(verworfen, [[TOK(5), TOK(6)]]);
  await uhr.vor(30_000);
  assert.deepEqual(ausgefuehrt, []);
});

test("Queue je Datensatz: neue Aktion am selben Objekt speichert die vorige sofort; flush(objekt) teilt Gruppen", async () => {
  const { q, uhr, ausgefuehrt } = schlange();
  q.starte("Zuständig: Lena", { token: TOK(7), objekt: "PH Anfrage:AN-7" });
  q.starte("Anfrage angenommen", { token: TOK(8), objekt: "PH Anfrage:AN-7" });
  await uhr.ruhe();
  assert.deepEqual(ausgefuehrt, [[TOK(7)]], "Folgeaktion → vorher ausgeführt (Q-C4)");
  assert.equal(q.anzahl(), 1);

  const g = q.starte("x", { token: TOK(9), objekt: "PH Anfrage:AN-9", gruppe: "g", sammel: (n) => `${n} angenommen` });
  q.starte("x", { token: TOK(10), objekt: "PH Anfrage:AN-10", gruppe: "g", sammel: (n) => `${n} angenommen` });
  const r = await q.flush({ doctype: "PH Anfrage", name: "AN-9" });
  assert.deepEqual(r.map((x) => x.token), [TOK(9)]);
  assert.equal(q.vorgang(g).text, "1 angenommen");
  assert.deepEqual(q.vorgang(g).tokens, [TOK(10)]);
  await q.flush();
  assert.equal(q.anzahl(), 0);
  assert.deepEqual(ausgefuehrt.flat().sort(), [TOK(7), TOK(8), TOK(9), TOK(10)].sort());
  await uhr.vor(30_000);
  assert.equal(ausgefuehrt.flat().length, 4, "nichts doppelt");
});

test("Queue: Seite verlassen → alles per Beacon, nichts mehr offen", async () => {
  const { q, uhr, ausgefuehrt, beacons, ereignisse } = schlange();
  q.starte("a", { token: TOK(11) });
  q.starte("b", { token: TOK(12), objekt: "X:1" });
  assert.equal(q.beaconAlle(), 2);
  assert.deepEqual(beacons, [[TOK(11), TOK(12)]]);
  assert.equal(q.anzahl(), 0);
  await uhr.vor(20_000);
  assert.deepEqual(ausgefuehrt, []);
  assert.equal(q.beaconAlle(), 0);
  assert.equal(ereignisse.filter((e) => e === "gesendet").length, 2);
});

test("Queue: Fehler nach Ablauf → onFehler + Ereignis; Netzfehler → kein Zurücksetzen", async () => {
  let modus = "fehler";
  const { q, uhr, ereignisse } = schlange({
    ausfuehren: async (tokens) => {
      if (modus === "netz") throw new Error("Failed to fetch");
      return { ok: false, ergebnisse: tokens.map((token) => ({ token, ok: false, code: "conflict", message: "Schon vergeben" })) };
    },
  });
  const fehler = [];
  q.starte("Anfrage angenommen", { token: TOK(13), fehlerText: "Annehmen von AN-13", onFehler: (r) => fehler.push(r.code) });
  await uhr.vor(COMMIT_MS);
  assert.deepEqual(fehler, ["conflict"]);
  modus = "netz";
  q.starte("Anfrage angenommen", { token: TOK(14), onFehler: (r) => fehler.push(r.code) });
  await uhr.vor(COMMIT_MS);
  assert.deepEqual(fehler, ["conflict"], "Netzfehler: Server-Nachlauf übernimmt, kein Rücksetzen");
  assert.deepEqual(ereignisse, ["neu", "fehler", "neu", "netz"]);
});

test("Queue: Rückgängig bei Netzfehler wird wiederholt; zu spät → Erfolg gemeldet", async () => {
  let versuche = 0;
  const { q, uhr, ereignisse } = schlange({
    verwerfen: async (tokens) => {
      versuche += 1;
      if (versuche < 3) throw new Error("offline");
      return { ok: true, ergebnisse: tokens.map((token) => ({ token, ok: true, status: "verworfen" })) };
    },
  });
  const id = q.starte("x", { token: TOK(15) });
  const p = q.rueckgaengig(id);
  await uhr.ruhe();
  await uhr.vor(1000);
  await uhr.vor(2000);
  await p;
  assert.equal(versuche, 3);
  assert.equal(ereignisse.at(-1), "verworfen");

  const s2 = schlange({ verwerfen: async (tokens) => ({ ok: false, ergebnisse: tokens.map((token) => ({ token, ok: false, code: "conflict", status: "ausgefuehrt" })) }) });
  const ok = [];
  const id2 = s2.q.starte("x", { token: TOK(16), onErfolg: () => ok.push(1), onVerworfen: () => ok.push("falsch") });
  await s2.q.rueckgaengig(id2);
  assert.deepEqual(ok, [1]);
  assert.equal(s2.ereignisse.at(-1), "verwerfenZuSpaet");
});

test("Queue: starte ohne Token wirft, Schnappschuss ist stabil", () => {
  const { q } = schlange();
  assert.throws(() => q.starte("x", {}), /Token/);
  const a = q.schnappschuss();
  assert.equal(q.schnappschuss(), a, "gleiche Referenz ohne Änderung (useSyncExternalStore)");
  q.starte("x", { token: TOK(17) });
  assert.notEqual(q.schnappschuss(), a);
  assert.equal(q.schnappschuss().vorgaenge.length, 1);
  q.entsorge();
});

test("behalteZeilen: ausstehende Zeile bleibt an ihrer Stelle, bis der Commit durch ist", () => {
  const key = (z) => `PH Anfrage:${z.name}`;
  const alt = [{ name: "A" }, { name: "B" }, { name: "C" }];
  const merk = [{ zeile: alt[1], index: 1 }];
  const neu = [{ name: "A" }, { name: "C" }];
  assert.deepEqual(behalteZeilen(neu, merk, new Set(["PH Anfrage:B"]), key).map((z) => z.name), ["A", "B", "C"]);
  assert.deepEqual(behalteZeilen(neu, merk, new Set(), key).map((z) => z.name), ["A", "C"]);
  assert.deepEqual(behalteZeilen(alt, merk, new Set(["PH Anfrage:B"]), key).map((z) => z.name), ["A", "B", "C"], "nicht doppelt");
});
