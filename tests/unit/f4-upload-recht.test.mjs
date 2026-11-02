// tests/unit/f4-upload-recht.test.mjs — Fix-Runde 1, Team F4 (Recht, Upload,
// Portal, KI-Assistenten, Ratgeber). Grundlage: qa-screenshots/fertig/
// r1-recht-inhalt.md P0-1/P0-2/P0-4, P1-1/P1-7 und r1-technik.md P0-1, Abschn. 3.
// Run: node --test tests/unit/f4-upload-recht.test.mjs
// No network, no backoffice; the upload store writes into a temp folder.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "src");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (specifier === "next/server") return next("next/server.js", context);
    let spec = specifier;
    if (spec.startsWith("@/")) spec = pathToFileURL(path.join(SRC, spec.slice(2))).href;
    const fromSrc = spec.startsWith("file:") || ((spec.startsWith("./") || spec.startsWith("../")) && context.parentURL?.includes("/src/"));
    if (fromSrc && !/\.[cm]?js$/.test(spec)) {
      const url = new URL(spec, context.parentURL);
      for (const ext of [".js", "/index.js"]) {
        const candidate = fileURLToPath(url) + ext;
        if (fs.existsSync(candidate)) return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
    return next(spec, context);
  },
});

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "ph-f4-test-"));
const CWD = process.cwd();
let config, service, token, inquiry, sessionRoute;
const imp = (p) => import(pathToFileURL(path.join(SRC, p)).href);

before(async () => {
  delete process.env.UPLOAD_ACCEPT_UNCONFIRMED;
  process.chdir(TMP);
  config = await imp("lib/upload/config.js");
  service = await imp("lib/upload/service.js");
  token = await imp("lib/upload/token.js");
  inquiry = await imp("lib/upload/inquiry.js");
  sessionRoute = await imp("app/api/upload/session/route.js");
});
after(() => {
  process.chdir(CWD);
  fs.rmSync(TMP, { recursive: true, force: true });
});

function withEnv(vars, fn) {
  const old = {};
  for (const [k, v] of Object.entries(vars)) {
    old[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return fn();
  } finally {
    for (const [k, v] of Object.entries(old)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

// ---- Upload (P0-4, r1-technik P0-1) -----------------------------------------

test("Upload: Frist als Konstante für F3, ohne bestätigte Frist nimmt der Upload nichts an", () => {
  assert.equal(config.UPLOAD_RETENTION_DAYS, config.UPLOAD_CONFIG.retentionDays);
  assert.equal(config.UPLOAD_RETENTION_CONFIRMED, config.UPLOAD_CONFIG.retentionConfirmed);
  if (config.UPLOAD_CONFIG.retentionConfirmed) return; // owner decided: nothing to pause
  assert.equal(config.uploadsAccepting({}), false);
  assert.equal(config.uploadsAccepting({ NODE_ENV: "development", UPLOAD_ACCEPT_UNCONFIRMED: "1" }), true);
  assert.equal(config.uploadsAccepting({ NODE_ENV: "production", UPLOAD_ACCEPT_UNCONFIRMED: "1" }), false, "Override wirkt nie in Produktion");
  assert.doesNotMatch(read("src/lib/upload/config.js").replace(/\/\/.*$/gm, ""), /\[[^\]]*(festzulegen|Inhaber)/);
});

test("Upload pausiert: kein Link, keine Datei, Session-Route 503, Anfrage ohne Ticket", async () => {
  if (config.UPLOAD_CONFIG.retentionConfirmed) return;
  await assert.rejects(() => service.mintSession({ ticket: "x".repeat(40) }), (e) => e.status === 503 && e.code === "upload_paused");
  const t = token.signToken({ kind: "kontakt", ref: "PH-K261028-ABCDEF", id: token.newId(), expiresAt: new Date(Date.now() + 3600e3) });
  await assert.rejects(() => service.initFile(t, { name: "a.jpg", size: 10, category: "photo" }), (e) => e.code === "upload_paused");
  await assert.rejects(() => service.saveNote(t, { note: "x", submit: true }), (e) => e.code === "upload_paused");
  const opened = await service.openSession(t);
  assert.equal(service.publicSession(opened.session).uploadsEnabled, false);

  const res = await sessionRoute.POST(new Request("http://localhost:3000/api/upload/session", { method: "POST", body: JSON.stringify({ ticket: "x".repeat(40) }) }));
  assert.equal(res.status, 503);
  assert.equal((await res.json()).error, "upload_paused");

  const handlers = { kontakt: async () => Response.json({ success: true, message: "ok", data: {} }) };
  const req = new Request("http://localhost:3000/api/upload/inquiry/kontakt", { method: "POST", body: JSON.stringify({ email_address: "qa@example.invalid" }) });
  const r = await inquiry.handleInquiry(req, "kontakt", { handlers, sign: () => "TICKET" });
  const body = await r.json();
  assert.equal(body.success, true);
  assert.ok(!("upload" in body), "kein Upload-Ticket, solange pausiert");
});

test("Upload: fehlendes UPLOAD_TOKEN_SECRET in Produktion wirft nicht (kein 500), sondern „unavailable“", async () => {
  await withEnv({ NODE_ENV: "production", UPLOAD_TOKEN_SECRET: undefined }, async () => {
    assert.equal(token.tokensAvailable(), false);
    assert.deepEqual(token.verifyToken("A".repeat(60)), { ok: false, reason: "unavailable" });
    assert.deepEqual(token.verifyTicket("A".repeat(40) + "." + "B".repeat(22)), { ok: false, reason: "unavailable" });
    assert.throws(() => token.signTicket({ kind: "kontakt" }), (e) => e.code === "secret_missing");
    await assert.rejects(() => service.openSession("A".repeat(60)), (e) => e.status === 503 && e.code === "unavailable");
  });
  const page = read("src/app/[locale]/upload/[token]/page.js");
  assert.match(page, /e\.code === "unavailable"\) problem = UPLOAD_PROBLEM\.paused/);
});

test("Upload-Texte: keine Platzhalterklammer, keine Demo und kein Test-Link auf /de/upload", () => {
  for (const f of ["src/components/Upload/ConsentText.js", "src/components/Portal/Raum/LoeschenBereich.js", "src/lib/raumzwilling/einwilligung.js"]) {
    assert.doesNotMatch(read(f), /\[Frist vom Inhaber festzulegen\]/, f);
  }
  const page = read("src/app/[locale]/upload/page.js").replace(/^\/\/.*$/gm, "");
  assert.doesNotMatch(page, /demoSession|PH-DEMO|Test-Link|Test-Hinweise|Demo/);
  assert.match(page, /\/de\/beratung/);
  assert.match(page, /\/de\/kontakt/);
  assert.match(read("src/components/Upload/UploadHandoff.js"), /if \(!uploadsAccepting\(\)\) return null;/);
});

// ---- Datenschutz und Impressum (P0-1, P0-2) ---------------------------------

test("Datenschutz: keine falschen Tatsachen, neue Abschnitte vorhanden", () => {
  const ds = read("src/components/Datenschutz/datenschutz.js");
  const visible = ds.replace(/^\/\/.*$/gm, "");
  assert.doesNotMatch(visible, /Privacy Shield|TKG 2003|§ 96 Abs 3|Komission|26 Monate/);
  assert.match(visible, /EU-US Data Privacy Framework/);
  assert.match(visible, /2023\/1795/);
  assert.match(visible, /§ 165 Abs\. 3 TKG\s+2021/);
  for (const id of ["ki-concierge", "ki-assistenten", "upload", "portal", "planer", "anfragen"]) assert.match(visible, new RegExp(`id="${id}"`), id);
  assert.match(visible, /Anthropic PBC/);
  assert.match(visible, /Ezarri/);
  const jsx = visible.slice(visible.indexOf("const Datenschutz = () =>"));
  assert.doesNotMatch(jsx, /\[[^\]]*\]/, "keine eckige Klammer im sichtbaren Text");
  // Bewusst geändert (Inhaber-Entscheidung Nr. 11, 29.10.2026): Kanzlei-Freigabe liegt vor.
  assert.match(ds, /lawyerApproved: true/, "Kanzlei-Freigabe intern dokumentiert");
});

test("Impressum: kein Werbetext, Pflichtangaben mit belegten Daten, keine Platzhalter", () => {
  const imp = read("src/components/Impressum/impressum.js").replace(/^\/\/.*$/gm, "");
  assert.doesNotMatch(imp, /Livings|Herzlich willkommen|Vielen Dank für Ihr Interesse|Transparenz/);
  assert.match(imp, /wird betrieben von der/);
  assert.match(imp, /Landesgericht Feldkirch/);
  assert.match(imp, /seat: "Lochau"/);
  assert.match(imp, /https:\/\/www\.ris\.bka\.gv\.at/);
  assert.match(imp, /Gewerbeordnung 1994/);
  assert.match(imp, /Offenlegung nach § 25 MedienG/);
  const jsx = imp.slice(imp.indexOf("const Impressum = () =>"));
  assert.doesNotMatch(jsx, /WKO|Wirtschaftskammer/, "Kammer erst, wenn belegt");
  assert.doesNotMatch(jsx, /\[[^\]]*\]/);
  const meta = read("src/app/[locale]/impressum/page.js");
  assert.doesNotMatch(meta, /Livings|Transparenz|Transparency|transparence|Trasparenza/);
});

// ---- KI-Assistenten (P1-1, r1-technik Abschn. 3) -----------------------------

test("KI-Assistenten: in Produktion ohne Live-Freigabe kein Terminwunsch-Werkzeug, kein Testbetrieb", async () => {
  const cfg = await imp("lib/agent/config.js");
  assert.equal(cfg.appointmentMode({}, { nodeEnv: "production" }).mode, "off");
  assert.equal(cfg.appointmentMode({ AGENT_APPOINTMENT_MODE: "dryrun" }, { nodeEnv: "production" }).mode, "off");
  assert.equal(cfg.appointmentMode({}, { nodeEnv: "development" }).mode, "dryrun");
  const tools = await imp("lib/agent/tools.js");
  assert.ok(!tools.mcpToolList({ appointment: false }).some((t) => t.name === "request_appointment"));
  assert.ok(tools.mcpToolList({ appointment: true }).some((t) => t.name === "request_appointment"));
  const { handleMessage, instructionsFor } = await imp("lib/agent/jsonrpc.js");
  const { createAdapter } = await imp("lib/agent/adapter.js");
  const off = createAdapter({ catalog: {}, appointment: () => ({ mode: "off" }) });
  const list = await handleMessage({ jsonrpc: "2.0", id: 1, method: "tools/list" }, { adapter: off });
  // Rat 9,5 C10 (T2): +2 nur lesende Werkzeuge (ezarri_quantities, idea_board_appointment_link) – 8 → 10.
  assert.equal(list.body.result.tools.length, 10);
  assert.ok(!list.body.result.tools.some((t) => t.name === "request_appointment"));
  const init = await handleMessage({ jsonrpc: "2.0", id: 2, method: "initialize", params: {} }, { adapter: off });
  assert.doesNotMatch(init.body.result.instructions, /request_appointment/);
  assert.match(instructionsFor(false), /\/de\/beratung/);
  const copy = read("src/lib/agent/copy.js").replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(copy, /Testbetrieb/);
  assert.doesNotMatch(read("src/lib/agent/appointment.js"), /`Testbetrieb/);
});

test("MCP-Endpunkt: fremde Browser-Origin 403, eigene und ohne Origin erlaubt", async () => {
  const { createMcpPost, originAllowed, allowedOriginsFrom } = await imp("lib/agent/http.js");
  const { createAdapter } = await imp("lib/agent/adapter.js");
  const adapter = createAdapter({ catalog: {}, appointment: () => ({ mode: "off" }) });
  const limiter = { message: async () => ({ ok: true }), appointment: async () => ({ ok: true }) };
  const post = createMcpPost({ adapter, limiter, allowedOrigins: ["https://claude.ai"] });
  const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" });
  const call = (headers) => post(new Request("http://localhost:3000/api/agent/mcp", { method: "POST", headers: { "Content-Type": "application/json", host: "localhost:3000", ...headers }, body }));
  assert.equal((await call({ Origin: "https://evil.example" })).status, 403);
  assert.equal((await call({})).status, 200);
  assert.equal((await call({ Origin: "http://localhost:3000" })).status, 200);
  assert.equal((await call({ Origin: "https://claude.ai" })).status, 200);
  const h = (o, host = "platzhirsch.studio") => new Headers({ origin: o, host });
  assert.equal(originAllowed(h("https://platzhirsch.studio")), true);
  assert.equal(originAllowed(h("https://www.platzhirsch.studio")), true);
  assert.equal(originAllowed(h("null")), false);
  assert.equal(originAllowed(h("file:///x")), false);
  assert.deepEqual(allowedOriginsFrom({ AGENT_ALLOWED_ORIGINS: "https://a.example/, nope, http://b.example:8080" }), ["https://a.example", "http://b.example:8080"]);
});

// ---- Ratgeber (P1-7) -----------------------------------------------------------

test("Ratgeber: keine Wettbewerberpreise, Meta-Zeile ohne verirrtes Komma", () => {
  const md = read("src/content/ratgeber/was-kostet-ein-minotti-sofa.md");
  const published = md.split("<!-- REDAKTION")[0];
  assert.doesNotMatch(published, /Wetscher|Whoppah|DDC|\d\.\d{3} €|US-\$/);
  assert.doesNotMatch(read("src/components/Ratgeber/RatgeberParts.js"), /<span className="sr-only">, <\/span>/);
});
