// tests/unit/ezarri-rechner.test.mjs – Team C: Mosaik-Rechner, Custom Mix, Anfrage.
// Doku: Marktresearch/digital/features/ezarri-rechner.md
// Run: node --test tests/unit/ezarri-rechner.test.mjs
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "src");
const imp = (p) => import(pathToFileURL(path.join(SRC, p)).href);
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    return next(specifier, context);
  },
});

let core, fl, url, mix, schema, versand, handler, palette, rateLimit;
before(async () => {
  core = await imp("lib/ezarri/rechner/core.js");
  fl = await imp("lib/ezarri/rechner/flaechen.js");
  url = await imp("lib/ezarri/rechner/url.js");
  mix = await imp("lib/ezarri/rechner/mischung.js");
  schema = await imp("app/api/ezarri/anfrage/schema.js");
  versand = await imp("app/api/ezarri/anfrage/versand.js");
  handler = await imp("app/api/ezarri/anfrage/handler.js");
  palette = await imp("lib/ezarri/rechner/palette.server.js");
  rateLimit = await imp("lib/forms/rateLimit.js");
});

// ---------------------------------------------------------------------------
// Rechner-Kern

test("Prüfwert Ezarri: 10 × 5 m, Tiefe 1/2 m (Ø 1,5), 10 % → 106 m², 265 kg Kleber, 127 kg Fuge", () => {
  const f = fl.poolFlaechen({ l: 10, b: 5, tFlach: 1, tTief: 2, spezial: false });
  assert.equal(f.boden, 50);
  assert.equal(f.waende, 45);
  assert.equal(f.gesamt, 95);
  const q = core.quantities({ flaechen: f, margeProzent: 10, format: "25" });
  assert.equal(q.mitMarge, 104.5);
  assert.equal(q.m2, 106);
  assert.equal(q.kartons, 53);
  assert.equal(q.blaetter, 53 * 13);
  assert.equal(q.kgKleber, 265);
  assert.equal(q.kgFuge, 127);
  assert.equal(q.paletten, 2); // 48 Kartons je Palette
  assert.deepEqual(q.volleKartonsPaletten, { paletten: 1, kartons: 5 });
  assert.equal(q.kgMosaik, Math.round(106 * 9.4));
});

test("Ezarri-Formel nachgebaut: Rundung auf volle Kartons, 50 mm (1,45 m²) und Fugenfaktoren", () => {
  // Ezarri-Skript: area = preArea + ((roundTo - preArea % roundTo) % roundTo)
  const ezarri = (net, marge, roundTo) => {
    const pre = Number((net * (1 + marge / 100)).toFixed(2));
    return Number((pre + ((roundTo - (pre % roundTo)) % roundTo)).toFixed(2));
  };
  for (const net of [12.3, 40, 57.81, 95, 104, 200.01]) {
    for (const marge of [0, 5, 10, 15]) {
      assert.equal(core.quantities({ flaechen: net, margeProzent: marge, format: "25" }).m2, ezarri(net, marge, 2), `25 mm ${net}/${marge}`);
      assert.equal(core.quantities({ flaechen: net, margeProzent: marge, format: "50" }).m2, ezarri(net, marge, 1.45), `50 mm ${net}/${marge}`);
    }
  }
  const q50 = core.quantities({ flaechen: 95, margeProzent: 10, format: "50" });
  assert.equal(q50.kgFuge, Math.round(q50.m2 * 0.7));
  const qh = core.quantities({ flaechen: 95, margeProzent: 10, format: "hexa" });
  assert.equal(qh.m2 % 1.75 < 1e-9 || Math.abs((qh.m2 / 1.75) - Math.round(qh.m2 / 1.75)) < 1e-9, true);
  assert.equal(qh.kgFuge, Math.round(qh.m2 * 0.9));
  // genau auf Kartongrenze: keine Extra-Kiste durch Binärfehler
  assert.equal(core.kartonsFuer(104, 2), 52);
  assert.equal(core.kartonsFuer(14.5, 1.45), 10);
  assert.equal(core.kartonsFuer(0, 2), 0);
});

test("Werkzeug laut Ezarri: Filze/Schwämme 1 je 5 m², Litonet 1 je 8 m²", () => {
  const w = Object.fromEntries(core.werkzeug(106).map((x) => [x.id, x.stueck]));
  assert.equal(w.filze, 21);
  assert.equal(w.schwaemme, 21);
  assert.equal(w.litonet, 13);
  assert.equal(w.zange, 1);
  assert.equal(core.werkzeug(0).every((x) => x.stueck === 0), true);
});

test("Mischung: Kartons je Mosaik aus dem Anteil, jeweils aufgerundet", () => {
  const q = core.quantities({ flaechen: 95, margeProzent: 10, mix: [{ id: "37", anteil: 70 }, { id: "38", anteil: 30 }] });
  assert.equal(q.mischung.length, 2);
  assert.equal(q.mischung[0].kartons, core.kartonsFuer(104.5 * 0.7, 2));
  assert.equal(q.mischung[1].kartons, core.kartonsFuer(104.5 * 0.3, 2));
  assert.ok(q.mischung[0].kartons + q.mischung[1].kartons >= q.kartons);
});

test("Formen: L-Form, rund/oval, Freiform", () => {
  const l = fl.poolFlaechen({ form: "l", l: 10, b: 6, lAus: 4, bAus: 2, tFlach: 1.2, tTief: 1.2 });
  assert.equal(l.boden, 52);
  assert.equal(l.umfang, 32);
  assert.equal(l.waende, 38.4);
  const kreis = fl.poolFlaechen({ form: "rund", l: 4, b: 4, tFlach: 1.2, tTief: 1.2 });
  assert.equal(kreis.boden, core.round(Math.PI * 4, 2));
  assert.equal(kreis.umfang, core.round(Math.PI * 4, 2));
  const oval = fl.poolFlaechen({ form: "rund", l: 8, b: 4, tFlach: 1, tTief: 1 });
  assert.ok(Math.abs(oval.umfang - 19.38) < 0.01, `Ellipse ${oval.umfang}`);
  const frei = fl.poolFlaechen({ form: "frei", flaecheFrei: "40", umfangFrei: "28,5", tFlach: 1, tTief: 1.6 });
  assert.equal(frei.boden, 40);
  assert.equal(frei.waende, core.round(28.5 * 1.3, 2));
  const unmoeglich = fl.poolFlaechen({ form: "frei", flaecheFrei: 40, umfangFrei: 10 });
  assert.ok(unmoeglich.fehler.umfangFrei);
});

test("Ø-Tiefe: automatisch Mittelwert, eigener Wert nur für die Längswände, Grenzen", () => {
  const auto = fl.poolFlaechen({ l: 10, b: 5, tFlach: 1, tTief: 2 });
  assert.equal(auto.tiefeMittel, 1.5);
  assert.equal(auto.tiefeAuto, true);
  const eigen = fl.poolFlaechen({ l: 10, b: 5, tFlach: 1, tTief: 2, tMittel: "1,8" });
  assert.equal(eigen.waende, core.round(2 * 10 * 1.8 + 5 * 3, 2));
  const falsch = fl.poolFlaechen({ l: 10, b: 5, tFlach: 1, tTief: 2, tMittel: 3 });
  assert.ok(falsch.fehler.tMittel);
  const getauscht = fl.poolFlaechen({ l: 10, b: 5, tFlach: 2, tTief: 1 });
  assert.equal(getauscht.waende, 45);
  assert.equal(getauscht.hinweise.length, 1);
  assert.ok(fl.poolFlaechen({ l: "abc" }).fehler.l);
  assert.ok(fl.poolFlaechen({ l: 99 }).fehler.l);
});

test("Treppe, Bank, Rinne: Formel je Teil, Wangen statt doppelter Fläche", () => {
  const voll = fl.poolFlaechen({ l: 10, b: 5, tFlach: 1, tTief: 2, treppe: "gerade", treppeBreite: 5, stufen: 4, auftritt: 0.3, steigung: 0.2 });
  assert.equal(voll.treppe, 0);
  const teil = fl.poolFlaechen({ l: 10, b: 5, tFlach: 1, tTief: 2, treppe: "gerade", treppeBreite: 2, stufen: 4, auftritt: 0.3, steigung: 0.2 });
  assert.equal(teil.treppe, core.round(2 * 0.3 * 0.2 * 10, 2));
  const ecke = fl.poolFlaechen({ l: 10, b: 5, tFlach: 1, tTief: 2, treppe: "ecke", treppeBreite: 2, stufen: 4, auftritt: 0.3, steigung: 0.2 });
  assert.equal(ecke.treppe, core.round(0.3 * 0.2 * 10, 2));
  const rom = fl.poolFlaechen({ l: 10, b: 5, tFlach: 1, tTief: 2, treppe: "roemisch", treppeBreite: 2, stufen: 4, auftritt: 0.3, steigung: 0.25 });
  const erwartet = Math.PI / 2 + Math.PI * (1 + 0.7 + 0.4 + 0.1) * 0.25 - 2 * 4 * 0.25;
  assert.equal(rom.treppe, core.round(erwartet, 2));
  assert.ok(rom.teile.find((t) => t.id === "treppe").formel.includes("Nische"));
  const zuHoch = fl.poolFlaechen({ tFlach: 1, tTief: 2, treppe: "gerade", stufen: 6, steigung: 0.25 });
  assert.ok(zuHoch.fehler.stufen);
  const bank = fl.poolFlaechen({ l: 10, b: 5, tFlach: 1, tTief: 2, bankLaenge: 3, bankTiefe: 0.4, bankUnterWasser: 0.5 });
  assert.equal(bank.bank, core.round(2 * 0.4 * 1.0, 2));
  const ueber = fl.poolFlaechen({ l: 10, b: 5, tFlach: 1, tTief: 2, rinne: "ueberlauf" });
  assert.equal(ueber.rinneLfm, 30);
  assert.equal(ueber.rinne, 12);
  const inf = fl.poolFlaechen({ l: 10, b: 5, tFlach: 1, tTief: 2, rinne: "infinity", rinneAbwicklung: "1" });
  assert.equal(inf.rinne, 10);
  for (const f of [voll, teil, rom, bank, ueber]) for (const t of f.teile) assert.match(t.formel, /= [\d.,\s]+ m²$/, t.id);
});

test("Spezialteile Corner/Cove in lfm", () => {
  const f = fl.poolFlaechen({ l: 10, b: 5, tFlach: 1, tTief: 2, treppe: "ecke", treppeBreite: 2, stufen: 4 });
  assert.equal(f.kantenLfm.corner, 30 + 8);
  assert.equal(f.kantenLfm.cove, 30 + 4 * 1.5);
  const aus = fl.poolFlaechen({ l: 10, b: 5, spezial: false });
  assert.deepEqual(aus.kantenLfm, { corner: 0, cove: 0 });
  const q = core.quantities({ flaechen: f });
  assert.equal(q.lfmCorner, 38);
  assert.equal(q.lfmCove, 36);
});

// ---------------------------------------------------------------------------
// URL

test("URL: nur Abweichungen vom Standard, Komma-Zahlen, Rundreise", () => {
  assert.equal(url.encodeRechner({ l: 10, b: 5, tFlach: 1, tTief: 2, format: "25", marge: 10 }), "");
  const q = url.encodeRechner({ form: "l", l: "12,5", b: 6, tTief: 2.2, boden: false, treppe: "roemisch" }, { mix: [{ id: "37", anteil: 70 }, { id: "38", anteil: 30 }] });
  const back = url.decodeRechner(q);
  assert.equal(back.eingabe.form, "l");
  assert.equal(back.eingabe.l, "12,5");
  assert.equal(back.eingabe.tTief, "2,2");
  assert.equal(back.eingabe.boden, false);
  assert.deepEqual(back.mix, [{ id: "37", anteil: 70 }, { id: "38", anteil: 30 }]);
  const f = fl.poolFlaechen(back.eingabe);
  assert.equal(f.werte.l, 12.5);
  // Next-searchParams-Objekt
  assert.equal(url.decodeRechner({ l: ["8"], fo: "rund" }).eingabe.form, "rund");
  // Unsinn
  assert.deepEqual(url.decodeMix("x-1.37-0.38-200.39-50.40-10.41-10.42-10"), [{ id: "38", anteil: 100 }, { id: "39", anteil: 50 }, { id: "40", anteil: 10 }, { id: "41", anteil: 10 }]);
});

test("Custom-Mix-URL und Übergabe aus dem Konfigurator (?k=, Schema v1)", () => {
  const s = url.encodeCustomMix({ mix: [{ id: "37", anteil: 60 }, { id: "38", anteil: 40 }], fuge: "1", format: "50", seed: 4711, wasser: true });
  assert.deepEqual(url.decodeCustomMix(s), { mix: [{ id: "37", anteil: 60 }, { id: "38", anteil: 40 }], fuge: "1", format: "50", seed: 4711, wasser: true });
  const state = { v: 1, szene: "pool", becken: { form: "rechteck", l: 12, b: 6, tFlach: 1.1, tTief: 2, treppe: "roemisch", bank: true, rand: "ueberlauf" }, format: "50", mix: [{ id: "37", anteil: 50 }, { id: "38", anteil: 50 }], kanaele: [], fuge: "1", spezial: { corner: true, cove: false }, wasser: "bewegt" };
  const k = Buffer.from(JSON.stringify(state)).toString("base64url");
  const r = url.fromKonfigurator(k);
  assert.equal(r.eingabe.form, "rechteck");
  assert.equal(r.eingabe.l, 12);
  assert.equal(r.eingabe.treppe, "roemisch");
  assert.equal(r.eingabe.rinne, "ueberlauf");
  assert.equal(r.eingabe.format, "50");
  assert.ok(r.eingabe.bankLaenge > 0);
  assert.equal(r.mix.length, 2);
  assert.equal(url.fromKonfigurator("!!"), null);
  assert.equal(url.fromKonfigurator(Buffer.from(JSON.stringify({ v: 2 })).toString("base64url")), null);
});

// ---------------------------------------------------------------------------
// Mischung

test("Mischung: Summe 100, max. 4, Anteil setzen verteilt proportional", () => {
  assert.deepEqual(mix.normalizeMix([{ id: "1", anteil: 1 }, { id: "2", anteil: 1 }, { id: "3", anteil: 1 }]).map((x) => x.anteil), [34, 33, 33]);
  assert.equal(mix.normalizeMix([1, 2, 3, 4, 5].map((i) => ({ id: String(i), anteil: 20 }))).length, 4);
  for (const v of [-5, 0, 1, 50, 97, 99, 100, 150]) {
    const r = mix.setAnteil([{ id: "a", anteil: 50 }, { id: "b", anteil: 30 }, { id: "c", anteil: 20 }], "a", v);
    assert.equal(r.reduce((s, x) => s + x.anteil, 0), 100, `v=${v}`);
    assert.ok(r.every((x) => x.anteil >= 1));
  }
  const r = mix.setAnteil([{ id: "a", anteil: 50 }, { id: "b", anteil: 30 }, { id: "c", anteil: 20 }], "a", 80);
  assert.deepEqual(r.map((x) => x.anteil), [80, 12, 8]);
  const add = mix.addToMix([{ id: "a", anteil: 100 }], "b");
  assert.deepEqual(add.map((x) => x.anteil), [50, 50]);
  assert.deepEqual(mix.removeFromMix(add, "a"), [{ id: "b", anteil: 100 }]);
});

test("Mischung: mischbar-Regel und exakte, reproduzierbare Verteilung", () => {
  const pal = [{ id: "1", mischbar: true }, { id: "2", mischbar: true }, { id: "3", mischbar: false }];
  assert.equal(mix.canMix(pal, ["1", "2"]).ok, true);
  assert.equal(mix.canMix(pal, ["3"]).ok, true);
  assert.deepEqual(mix.canMix(pal, ["1", "3"]), { ok: false, grund: "nicht_mischbar", ids: ["3"] });
  assert.equal(mix.canMix(pal, ["9"]).grund, "unbekannt");
  const m = [{ id: "1", anteil: 70 }, { id: "2", anteil: 30 }];
  const a = mix.cellAssignment(42, m, 40, 40);
  const b = mix.cellAssignment(42, m, 40, 40);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, mix.cellAssignment(43, m, 40, 40));
  assert.equal(a.filter((x) => x === 0).length, 1120);
  assert.equal(a.filter((x) => x === 1).length, 480);
  assert.equal(mix.steineProM2("25"), 1476);
  assert.equal(mix.steineProM2("50"), 368);
});

test("Palette (Server): nur mischbare Mosaike, Töne gemessen, Rezepte ladbar", () => {
  const pal = palette.getMixPalette();
  assert.equal(pal.length, 90);
  assert.ok(pal.every((p) => p.mischbar && p.toene.length >= 1 && p.thumb));
  assert.ok(pal.every((p) => p.toene.reduce((s, t) => s + t[1], 0) === 100));
  const ids = new Set(pal.map((p) => p.id));
  const rez = palette.getMixRecipes();
  assert.ok(rez.length >= 20, `${rez.length} Rezepte`);
  assert.ok(rez.every((r) => r.mix.every((x) => ids.has(x.id)) && r.mix.length <= 4));
  assert.ok(JSON.stringify(pal).length < 40_000, "Palette klein genug für den Client");
  assert.equal(palette.getGroutList().length, 7);
  const chips = palette.getReferenceChips(["2512-C", "gibtsnicht", "2512-c", "dune"]);
  assert.deepEqual(chips.map((c) => c.id), ["2512-c", "dune"]);
});

// ---------------------------------------------------------------------------
// Anfrage

const gueltig = { art: "muster", name: "Erika Muster", email: "erika@beispiel.at", einwilligung: true };

test("Anfrage-Schema: 4 Pflichtfelder, E-Mail ODER Telefon, Allowlist", () => {
  assert.equal(schema.pruefeAnfrage(gueltig).ok, true);
  assert.equal(schema.pruefeAnfrage({ ...gueltig, email: undefined, telefon: "+43 5574 12345" }).ok, true);
  const leer = schema.pruefeAnfrage({});
  assert.equal(leer.ok, false);
  for (const k of ["art", "name", "einwilligung"]) assert.ok(leer.fehler[k], k);
  assert.equal(schema.pruefeAnfrage({ ...gueltig, email: "" }).fehler.email, schema.MELDUNGEN.kontakt);
  assert.ok(schema.pruefeAnfrage({ ...gueltig, email: "x@y" }).fehler.email);
  assert.ok(schema.pruefeAnfrage({ ...gueltig, einwilligung: "true" }).fehler.einwilligung);
  assert.ok(schema.pruefeAnfrage({ ...gueltig, referenzen: Array.from({ length: 7 }, (_, i) => `r${i}`) }).fehler.referenzen);
  assert.ok(schema.pruefeAnfrage({ ...gueltig, m2: "0" }).fehler.m2);
  const ok = schema.pruefeAnfrage({ ...gueltig, m2: "106,5", referenzen: ["2512-C", "2512-c"], fremd: "weg", profil: "" });
  assert.equal(ok.data.m2, 106.5);
  assert.deepEqual(ok.data.referenzen, ["2512-c"]);
  assert.equal("fremd" in ok.data, false);
  assert.equal(ok.data.profil, undefined);
  assert.ok(schema.pruefeAnfrage({ ...gueltig, k: "<script>" }).fehler.k);
});

// Integration 28.10.2026 (Inhaber-Entscheidung Nr. 7 + 9): EZARRI_PUBLIC ist an, die Freischalt-Sperre verlangt den
// Backoffice-Weg. Im Dev/Test (NODE_ENV ≠ production) bleibt es beim Postausgang.
test("Versand: Schalter aus → immer Postausgang; Backoffice nur mit Schalter + Produktion + ohne Dry-Run", () => {
  assert.equal(versand.EZARRI_ANFRAGE_BACKOFFICE, true);
  assert.equal(versand.freischaltungZulaessig(), true);
  assert.equal(versand.versandModus({ env: { NODE_ENV: "test" } }), "outbox");
  assert.equal(versand.versandModus({ schalter: false, env: { NODE_ENV: "production" } }), "outbox");
  assert.equal(versand.versandModus({ schalter: true, env: { NODE_ENV: "development" } }), "outbox");
  assert.equal(versand.versandModus({ schalter: true, env: { NODE_ENV: "production", EZARRI_ANFRAGE_DRY_RUN: "1" } }), "outbox");
  assert.equal(versand.versandModus({ schalter: true, env: { NODE_ENV: "production" } }), "backoffice");
  const p = versand.toBackofficePayload({ ...gueltig, m2: 106, referenzen: ["2512-c"] });
  assert.equal(p.vorname, "Erika");
  assert.equal(p.nachname, "Muster");
  assert.match(p.bitte_beschreiben_sie_ihr_vorhaben, /Muster/);
  assert.match(p.bitte_beschreiben_sie_ihr_vorhaben, /106 m²/);
  assert.doesNotMatch(JSON.stringify(p), /€|Preis/);
});

function req(body, headers = {}) {
  return new Request("http://localhost:3000/api/ezarri/anfrage", {
    method: "POST",
    headers: { "content-type": "application/json", host: "localhost:3000", "x-forwarded-for": "10.0.0.9", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

test("Route: Dry-Run schreibt in den Postausgang, ruft nie das Backoffice", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ezarri-outbox-"));
  let fetched = 0;
  const POST = handler.createAnfrageHandler({
    outboxDir: dir,
    limiter: rateLimit.createRateLimiter(),
    fetchImpl: async () => {
      fetched++;
      return new Response("{}");
    },
    resolveRefs: (ids) => ids.map((id) => ({ id, code: id.toUpperCase(), name: id })),
  });
  const res = await POST(req({ ...gueltig, referenzen: ["2512-c"], m2: 106, _t: 9000, website: "" }));
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.deepEqual([body.success, body.dryRun], [true, true]);
  const files = fs.readdirSync(dir);
  assert.equal(files.length, 1);
  const entry = JSON.parse(fs.readFileSync(path.join(dir, files[0]), "utf8"));
  assert.equal(entry.modus, "dry-run");
  assert.equal(entry.data.name, "Erika Muster");
  assert.equal("website" in entry.data, false);
  assert.match(entry.text, /2512-C/);
  assert.equal(fetched, 0);

  // ungültig → 400 mit Feld
  const bad = await POST(req({ ...gueltig, einwilligung: false, _t: 9000 }));
  assert.equal(bad.status, 400);
  assert.equal((await bad.json()).field, "einwilligung");
  // Honeypot → scheinbarer Erfolg, nichts abgelegt
  const hp = await POST(req({ ...gueltig, website: "spam", _t: 9000 }));
  assert.equal(hp.status, 200);
  assert.equal(fs.readdirSync(dir).length, 1);
  // fremde Herkunft
  assert.equal((await POST(req(gueltig, { origin: "https://boese.example" }))).status, 403);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("Route: Rate-Limit 5 Sendungen je IP in 10 Minuten", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ezarri-outbox-"));
  const POST = handler.createAnfrageHandler({ outboxDir: dir, limiter: rateLimit.createRateLimiter() });
  const codes = [];
  for (let i = 0; i < 7; i++) codes.push((await POST(req({ ...gueltig, _t: 9000 }, { "x-forwarded-for": "10.0.0.77" }))).status);
  assert.deepEqual(codes, [200, 200, 200, 200, 200, 429, 429]);
  fs.rmSync(dir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Seiten: Schalter, Sprache, keine Preise, keine Händler-Aussage

const PAGES = ["src/app/[locale]/ezarri/rechner/page.js", "src/app/[locale]/ezarri/custom-mix/page.js", "src/app/[locale]/ezarri/anfrage/page.js"];

test("Seiten: withEzarriRobots, ezarriLocaleEnabled → notFound, hreflang nur Deutsch", () => {
  for (const p of PAGES) {
    const src = read(p);
    assert.match(src, /withEzarriRobots\(/, p);
    // 01.11.2026: Rechner in de/en/fr/it (toolLocaleEnabled); Custom Mix und Anfrage weiter ezarriLocaleEnabled
    assert.match(src, p.includes("/rechner/") ? /toolLocaleEnabled\(locale\)\)\s*notFound\(\)/ : /ezarriLocaleEnabled\(locale\)\)\s*notFound\(\)/, p);
    assert.doesNotMatch(src, /hreflangAlternates|buildPageMetadata/, `${p}: volle hreflang-Liste zeigt auf 404-Sprachen`);
  }
});

test("Texte: keine Preise, keine Händler-Aussage, keine Superlative, Quelle genannt", () => {
  const files = [
    ...PAGES,
    ...fs.readdirSync(path.join(SRC, "components/Ezarri/Rechner")).map((f) => `src/components/Ezarri/Rechner/${f}`),
    ...fs.readdirSync(path.join(SRC, "components/Ezarri/CustomMix")).map((f) => `src/components/Ezarri/CustomMix/${f}`),
    ...fs.readdirSync(path.join(SRC, "components/Ezarri/Anfrage")).map((f) => `src/components/Ezarri/Anfrage/${f}`),
    "src/lib/ezarri/rechner/copy.js",
  ];
  // Kommentare zählen nicht (sie nennen die Regeln selbst, z. B. „keine Preise“).
  const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/ .*$/gm, "");
  const all = files.map((f) => stripComments(read(f))).join("\n");
  assert.doesNotMatch(all, /€|EUR\b|CHF\s?\d|\d\s?CHF|Preis(?!e auf Anfrage| auf Anfrage)/);
  assert.doesNotMatch(all, /[Hh]ändler|autorisiert|offizielle[rns]? Partner/);
  assert.doesNotMatch(all, /einzigartig|\bbeste[nrs]?\b|größte|Luxus|kostenlos/i);
  assert.match(all, /ezarriCredit\("daten"\)|Daten: Ezarri/);
});
