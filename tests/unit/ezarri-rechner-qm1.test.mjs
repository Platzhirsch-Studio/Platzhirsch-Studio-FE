// tests/unit/ezarri-rechner-qm1.test.mjs – Team C, QM-Runde 1
// (qa-screenshots/ezarri/rechner/feedback-1.md): Mengen mit Mischung, Referenz im
// richtigen Format, Freischalt-Sperre, Anfrage mit Fuge/Format/Zubehör, Suche.
// Doku: Marktresearch/digital/features/ezarri-rechner.md
// Run: node --test tests/unit/ezarri-rechner-qm1.test.mjs
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

let core, fl, url, schema, versand, handler, palette, rateLimit, data, config;
before(async () => {
  core = await imp("lib/ezarri/rechner/core.js");
  fl = await imp("lib/ezarri/rechner/flaechen.js");
  url = await imp("lib/ezarri/rechner/url.js");
  schema = await imp("app/api/ezarri/anfrage/schema.js");
  versand = await imp("app/api/ezarri/anfrage/versand.js");
  handler = await imp("app/api/ezarri/anfrage/handler.js");
  palette = await imp("lib/ezarri/rechner/palette.server.js");
  rateLimit = await imp("lib/forms/rateLimit.js");
  data = await imp("lib/ezarri/data.js");
  config = await imp("lib/ezarri/config.js");
});

const gueltig = { art: "muster", name: "Erika Muster", email: "erika@beispiel.at", einwilligung: true };
const MIX_QM = [
  { id: "1", anteil: 64 },
  { id: "2", anteil: 7 },
  { id: "3", anteil: 4 },
  { id: "4", anteil: 25 },
];

function req(body, headers = {}) {
  return new Request("http://localhost:3000/api/ezarri/anfrage", {
    method: "POST",
    headers: { "content-type": "application/json", host: "localhost:3000", "x-forwarded-for": "10.0.1.9", ...headers },
    body: JSON.stringify(body),
  });
}

test("P1-1: Mit Mischung gilt die Summe der Einzelkartons (64/7/4/25 % → 55 statt 53)", () => {
  const f = fl.poolFlaechen({ l: 10, b: 5, tFlach: 1, tTief: 2 });
  const mixe = [MIX_QM, [{ id: "37", anteil: 70 }, { id: "38", anteil: 30 }], [{ id: "1", anteil: 100 }]];
  for (const format of ["25", "50", "hexa"]) {
    for (const m of mixe) {
      const q = core.quantities({ flaechen: f, margeProzent: 10, format, mix: m });
      const summe = q.mischung.reduce((s, x) => s + x.kartons, 0);
      assert.equal(summe, q.kartons, `${format} ${JSON.stringify(m)}`);
      assert.equal(q.m2, core.round(q.kartons * core.FORMATE[format].m2ProKarton, 2));
      assert.equal(q.kgKleber, Math.round(q.m2 * 2.5));
      assert.equal(q.blaetter, q.kartons * core.FORMATE[format].blattProKarton);
      assert.equal(q.mehrKartonsDurchMischung, q.kartons - q.kartonsUngemischt);
    }
  }
  const q = core.quantities({ flaechen: f, margeProzent: 10, mix: MIX_QM });
  assert.deepEqual(q.mischung.map((x) => x.kartons), [34, 4, 3, 14]);
  assert.deepEqual([q.kartons, q.m2, q.kartonsUngemischt, q.mehrKartonsDurchMischung], [55, 110, 53, 2]);
  // ohne Mischung unverändert (Prüfwert Ezarri)
  assert.equal(core.quantities({ flaechen: f, margeProzent: 10 }).kartons, 53);
});

test("P1-2: Referenz im Format der Mischung – 25 mm für alle 90 mischbaren Mosaike", () => {
  const pal = palette.getMixPalette();
  assert.equal(pal.length, 90);
  for (const p of pal) {
    const [id] = palette.referencesForMix([{ id: p.id }], "25");
    assert.equal(data.getReference(id)?.format, "25mm", `${p.name}: ${id}`);
    assert.equal(p.referenz, id, `${p.name}: Standard-Referenz`);
    assert.ok(p.formate.every((f) => ["25", "50", "hexa"].includes(f)), `${p.name}: ${p.formate}`);
    for (const f of p.formate) {
      const r = data.getReference(palette.referencesForMix([{ id: p.id }], f)[0]);
      // Gibt es die Format-Variante im Katalog, muss sie es sein; sonst 25 mm
      // (20 Mosaike: Konfigurator bietet 50 mm, Katalog hat keine 50-mm-Referenz).
      const hatVariante = data.getVariants(data.getReference(p.referenz)).some((v) => v.gruppe === "Format" && v.id && core.formatId(v.label) === f && data.getReference(v.id));
      assert.equal(core.formatId(r?.format), hatVariante ? f : "25", `${p.name} ${f}: ${r?.id}`);
    }
  }
  const b = pal.find((p) => p.name === "2521-B");
  assert.deepEqual(palette.referencesForMix([{ id: b.id }]), ["2521-b"]);
  assert.deepEqual(palette.referencesForMix([{ id: b.id }], "50"), ["2521-b-50"]);
  assert.deepEqual(palette.referencesForMix([{ id: b.id }], "hexa"), ["2521-b"], "fehlende Variante → 25 mm");
  assert.ok(pal.filter((p) => p.formate.includes("hexa")).length >= 5, "Hexa erkannt (Ezarri schreibt „Hexa“)");
});

test("P1-4: Freischalt-Sperre – EZARRI_PUBLIC nur mit Backoffice-Anfrageweg", () => {
  assert.ok(
    versand.freischaltungZulaessig({ isPublic: config.EZARRI_PUBLIC, backoffice: versand.EZARRI_ANFRAGE_BACKOFFICE }),
    "EZARRI_PUBLIC = true, aber EZARRI_ANFRAGE_BACKOFFICE = false: echte Anfragen kämen nirgends an. Erst den Backoffice-Weg freischalten (versand.js)."
  );
  assert.equal(versand.freischaltungZulaessig({ isPublic: true, backoffice: false }), false);
  assert.equal(versand.freischaltungZulaessig({ isPublic: true, backoffice: true }), true);
  assert.equal(versand.freischaltungZulaessig({ isPublic: false, backoffice: false }), true);
  assert.equal(versand.postausgangAlsTest({ env: { NODE_ENV: "production" } }), false);
  assert.equal(versand.postausgangAlsTest({ env: { NODE_ENV: "production", EZARRI_ANFRAGE_DRY_RUN: "1" } }), true);
  assert.equal(versand.postausgangAlsTest({ env: { NODE_ENV: "development" } }), true);
});

test("P1-4: Produktion ohne Backoffice → 503 unavailable, nichts abgelegt, kein Backoffice-Aufruf", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ezarri-outbox-"));
  let fetched = 0;
  const POST = handler.createAnfrageHandler({
    outboxDir: dir,
    limiter: rateLimit.createRateLimiter(),
    modus: () => "outbox",
    alsTest: () => false,
    fetchImpl: async () => {
      fetched++;
      return new Response("{}");
    },
  });
  const res = await POST(req({ ...gueltig, _t: 9000, website: "" }));
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.deepEqual([body.success, body.code], [false, "unavailable"]);
  assert.equal(fs.readdirSync(dir).length, 0);
  assert.equal(fetched, 0);
  // Das Formular wertet den Code aus und nennt Telefon und E-Mail
  const form = read("src/components/Ezarri/Anfrage/AnfrageForm.js");
  assert.match(form, /code === "unavailable"/);
  assert.match(form, /PHONE_HREF/);
  assert.match(form, /EMAIL_HREF/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("P2-5: Fuge, Format und Zubehör im Schema; Anfrage-Text mit Mengen und absoluten Links", async () => {
  const ok = schema.pruefeAnfrage({ ...gueltig, art: "angebot", fuge: "2", format: "25", zubehoer: { kleber: "275", fuge: 132, werkzeug: "1", corner: "", fremd: 3 } });
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.data.zubehoer, { kleber: 275, fuge: 132, werkzeug: 1 });
  assert.equal(ok.data.fuge, "2");
  assert.ok(schema.pruefeAnfrage({ ...gueltig, fuge: "9" }).fehler.fuge);
  assert.ok(schema.pruefeAnfrage({ ...gueltig, format: "75" }).fehler.format);
  assert.equal(schema.pruefeAnfrage({ ...gueltig, zubehoer: { kleber: "0" } }).fehler.zubehoer, schema.MELDUNGEN.zubehoer);

  const rechner = url.encodeRechner({ l: 10, b: 5, tFlach: 1, tTief: 2 }, { mix: MIX_QM });
  const d = schema.pruefeAnfrage({ ...gueltig, art: "angebot", rechner, m: "1-64.2-7.3-4.4-25", fuge: "2", format: "25", zubehoer: { kleber: 275, werkzeug: 1 } }).data;
  const text = versand.anfrageText(d, { mixNamen: { 1: { name: "Alpha" }, 2: { name: "Beta" } }, fugeName: (id) => (id === "2" ? "Grigio Ardesia 130" : undefined) });
  assert.match(text, /Fuge: Grigio Ardesia 130 · Format 25 mm/);
  assert.match(text, /110 m² = 55 Kartons/);
  assert.match(text, /Alpha 64 % = 34 Kartons; Beta 7 % = 4 Kartons/);
  assert.match(text, /\+2 gegenüber ungemischt/);
  assert.match(text, /Kleber ca\. 275 kg, Epoxidfuge ca\. 132 kg/);
  assert.match(text, /Zubehör mit anbieten: Kleber \(mind\. C2TE\) 275 kg, Werkzeugpaket laut Ezarri 1 Paket/);
  assert.match(text, /https:\/\/platzhirsch\.studio\/de\/ezarri\/custom-mix\?m=1-64\.2-7\.3-4\.4-25&fu=2/);
  assert.match(text, /https:\/\/platzhirsch\.studio\/de\/ezarri\/rechner\?/);
  assert.doesNotMatch(text, /(^|\s)\/de\/ezarri/m, "keine relativen Links");

  // Anfrage-Link trägt Fuge und Format (AnfrageLink.js importiert @/components/ui → Quelltext prüfen)
  const link = read("src/components/Ezarri/Anfrage/AnfrageLink.js");
  assert.match(link, /p\.set\("fu"/);
  assert.match(link, /p\.set\("f"/);
  assert.match(read("src/components/Ezarri/CustomMix/CustomMixApp.js"), /fu: fuge, f: aktivFormat/);
});

test("P2-6/P3-3/P3-4: Suche findet Farben, Finish, Serien und fertige Mischungen; Iridescent einheitlich", () => {
  const pal = palette.getMixPalette();
  const finde = (q) => pal.filter((p) => q.toLowerCase().split(/\s+/).every((w) => p.suche.includes(w)));
  assert.ok(finde("blau").length >= 10, "blau");
  assert.ok(finde("türkis").length >= 1, "türkis");
  assert.ok(finde("niebla").length >= 1, "Serie");
  assert.ok(finde("glänzend").length >= 1, "Finish");
  assert.ok(palette.getFesteMosaike().some((m) => m.suche.includes("mojito")), "Mojito als fertige Mischung");
  const namen = JSON.stringify([pal, palette.getMixRecipes(), palette.getFesteMosaike()].map((l) => l.map((x) => [x.name, x.serie])));
  assert.doesNotMatch(namen, /Iridiscent/);
  assert.ok(palette.getMixRecipes().every((r) => /^#[0-9a-f]{6}$/i.test(r.ton)), "Platzhalterfarbe je Rezept");
  assert.ok(JSON.stringify(pal).length + JSON.stringify(palette.getFesteMosaike()).length < 48_000, "Client-Daten klein");
});

test("P2-1/P2-2/P2-4: Rechenweg mobil als Liste, Tabelle fokussierbar; Fokus zurück; Rechner-Leiste als CTA", () => {
  const r = read("src/components/Ezarri/Rechner/RechnerApp.js");
  assert.match(r, /sm:hidden/);
  // Welle 2: Beschriftung aus der Copy der Sprache (deutsch „Rechenweg“ → „So ist gerechnet“).
  assert.match(r, /role="region" aria-label=\{C\.ergebnis\.rechenweg\} tabIndex=\{0\}/);
  assert.match(r, /data-cta="primary"/, "MobileCtaBar weicht der Rechner-Leiste aus");
  const c = read("src/components/Ezarri/CustomMix/CustomMixApp.js");
  assert.match(c, /onClose=\{onClose\}/);
  assert.match(c, /getElementById\("cm-hinzufuegen"\)/);
  assert.match(c, /id="cm-mischung" level=\{2\} size="title" tabIndex=\{-1\}/);
});
