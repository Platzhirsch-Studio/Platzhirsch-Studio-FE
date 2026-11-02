// tests/unit/upload.test.mjs — R2-upload: inquiry wrapper (ticket only for
// real successes, visitor headers passed on), ticket/token, session route,
// upload flow with error cases, German error texts.
// Run: node --test tests/unit/upload.test.mjs
// No network, no backoffice: the form handlers are mocks. The local store
// writes into a temporary folder (process.chdir), never into the repo.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src");

// F4 Fix-Runde 1 (r1-recht-inhalt P0-4): the upload takes nothing while the
// Löschfrist is unconfirmed (UPLOAD_CONFIG.retentionConfirmed = false). These
// tests check the upload mechanics themselves, so they open it with the
// development override (ignored in production). The paused state has its own
// tests in tests/unit/f4-upload-recht.test.mjs.
process.env.UPLOAD_ACCEPT_UNCONFIRMED = "1";

// The upload lib is written for Next.js: "server-only", "@/..." and
// extensionless imports. Map them for plain Node (only for this process).
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (specifier === "next/server") return next("next/server.js", context);
    let spec = specifier;
    if (spec.startsWith("@/")) spec = pathToFileURL(path.join(SRC, spec.slice(2))).href;
    const fromSrc = (spec.startsWith("file:") || ((spec.startsWith("./") || spec.startsWith("../")) && context.parentURL?.includes("/src/")));
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

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "ph-upload-test-"));
const CWD = process.cwd();
let inquiry, token, service, messages, config, sessionRoute;

before(async () => {
  process.chdir(TMP); // localStore uses <cwd>/.data/uploads
  inquiry = await import(pathToFileURL(path.join(SRC, "lib/upload/inquiry.js")).href);
  token = await import(pathToFileURL(path.join(SRC, "lib/upload/token.js")).href);
  service = await import(pathToFileURL(path.join(SRC, "lib/upload/service.js")).href);
  messages = await import(pathToFileURL(path.join(SRC, "lib/upload/messages.js")).href);
  config = await import(pathToFileURL(path.join(SRC, "lib/upload/config.js")).href);
  sessionRoute = await import(pathToFileURL(path.join(SRC, "app/api/upload/session/route.js")).href);
});
after(() => {
  process.chdir(CWD);
  fs.rmSync(TMP, { recursive: true, force: true });
});

// ---- helpers ---------------------------------------------------------------
const okAnswer = (data = { message: { name: "KF-0001" } }) => Response.json({ success: true, message: "ok", data });
function mockHandler(answer = () => okAnswer()) {
  const calls = [];
  const fn = async (req) => {
    calls.push({ headers: Object.fromEntries(req.headers), body: await req.text(), url: req.url });
    return answer();
  };
  fn.calls = calls;
  return fn;
}
function inquiryRequest(body, headers = {}) {
  return new Request("http://localhost:3000/api/upload/inquiry/kontakt", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
const KONTAKT = { name: "Erika Muster", email_address: "erika@example.invalid", telefon: "+43 660 1234567", ihre_nachricht: "Bitte um Rückruf zum Sofa." };
const sign = (...a) => token.signTicket(...a);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1]), Buffer.alloc(2000, 7), Buffer.from([0xff, 0xd9])]);
const sessionReq = (body, headers = { Origin: "http://localhost:3000", Host: "localhost:3000" }) =>
  new Request("http://localhost:3000/api/upload/session", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });

// ---- inquiry wrapper -------------------------------------------------------
test("inquiry: real success gets a verifiable ticket with kind, e-mail and lead ref", async () => {
  const h = mockHandler();
  const res = await inquiry.handleInquiry(inquiryRequest({ ...KONTAKT, _t: 9000 }), "kontakt", { handlers: { kontakt: h }, sign });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.message.name, "KF-0001", "form answer passes through");
  const t = token.verifyTicket(json.upload.ticket);
  assert.equal(t.ok, true);
  assert.equal(t.kind, "kontakt");
  assert.equal(t.email, "erika@example.invalid");
  assert.equal(t.leadRef, "KF-0001");
});

test("inquiry: body reaches the form route unchanged, visitor headers are passed on (XFF, Referer, Accept-Language)", async () => {
  const h = mockHandler();
  const raw = JSON.stringify({ ...KONTAKT, website: "", _t: 5000 });
  await inquiry.handleInquiry(
    inquiryRequest(raw, { "X-Forwarded-For": "10.0.0.1, 203.0.113.7", "X-Real-IP": "203.0.113.7", Referer: "http://localhost:3000/fr/contact", "Accept-Language": "fr-CH", Cookie: "secret=1" }),
    "kontakt",
    { handlers: { kontakt: h }, sign },
  );
  assert.equal(h.calls.length, 1);
  const { headers, body } = h.calls[0];
  assert.equal(body, raw);
  assert.equal(headers["x-forwarded-for"], "10.0.0.1, 203.0.113.7");
  assert.equal(headers["x-real-ip"], "203.0.113.7");
  assert.equal(headers.referer, "http://localhost:3000/fr/contact");
  assert.equal(headers["accept-language"], "fr-CH");
  assert.equal(headers.cookie, undefined, "cookies are not passed on");
});

test("inquiry: honeypot and time trap (fake success) get NO ticket", async () => {
  const fake = () => Response.json({ success: true, message: "ok", data: {} });
  for (const extra of [{ website: "http://spam.example" }, { _t: 800 }, { _t: String(Date.now() - 1000) }]) {
    const res = await inquiry.handleInquiry(inquiryRequest({ ...KONTAKT, ...extra }), "kontakt", { handlers: { kontakt: mockHandler(fake) }, sign });
    const json = await res.json();
    assert.equal(json.success, true, JSON.stringify(extra));
    assert.equal(json.upload, undefined, `no ticket for ${JSON.stringify(extra)}`);
  }
  // slow, honest visitor: ticket
  const res = await inquiry.handleInquiry(inquiryRequest({ ...KONTAKT, website: "", _t: 45000 }), "kontakt", { handlers: { kontakt: mockHandler(fake) }, sign });
  assert.ok((await res.json()).upload?.ticket);
});

test("inquiry: failures pass through unchanged, no ticket", async () => {
  for (const [status, body] of [[400, { success: false, code: "invalid", error: "x" }], [429, { success: false, code: "rate_limited", error: "y" }], [502, { success: false, code: "upstream" }]]) {
    const res = await inquiry.handleInquiry(inquiryRequest(KONTAKT), "kontakt", { handlers: { kontakt: mockHandler(() => Response.json(body, { status })) }, sign });
    assert.equal(res.status, status);
    assert.deepEqual(await res.json(), body);
  }
  // signing fails → the inquiry answer still goes through
  const res = await inquiry.handleInquiry(inquiryRequest(KONTAKT), "kontakt", { handlers: { kontakt: mockHandler() }, sign: () => { throw new Error("no secret"); }, log: { error() {} } });
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.upload, undefined);
});

test("inquiry: unknown kind 404, oversized body 413 (handler never called)", async () => {
  const h = mockHandler();
  assert.equal((await inquiry.handleInquiry(inquiryRequest(KONTAKT), "demo", { handlers: { kontakt: h }, sign })).status, 404);
  assert.equal((await inquiry.handleInquiry(inquiryRequest(KONTAKT), "__proto__", { handlers: { kontakt: h }, sign })).status, 404);
  assert.equal((await inquiry.handleInquiry(inquiryRequest("x".repeat(200_001)), "kontakt", { handlers: { kontakt: h }, sign })).status, 413);
  assert.equal(h.calls.length, 0);
});

test("inquiry: e-mail field per form, invalid e-mail is dropped", async () => {
  const res = await inquiry.handleInquiry(inquiryRequest({ anfrage_email: " a@b.example ", produkte: [1] }), "produkt", { handlers: { produkt: mockHandler() }, sign });
  assert.equal(token.verifyTicket((await res.json()).upload.ticket).email, "a@b.example");
  const res2 = await inquiry.handleInquiry(inquiryRequest({ email: "kein-mail" }), "beratung", { handlers: { beratung: mockHandler() }, sign });
  assert.equal(token.verifyTicket((await res2.json()).upload.ticket).email, null);
});

test("isTrapped mirrors the form guard", () => {
  const now = 1_800_000_000_000;
  assert.equal(inquiry.isTrapped({ website: " " }, now), false);
  assert.equal(inquiry.isTrapped({ website: "x" }, now), true);
  assert.equal(inquiry.isTrapped({ _t: 2999 }, now), true);
  assert.equal(inquiry.isTrapped({ _t: 3000 }, now), false);
  assert.equal(inquiry.isTrapped({ _t: 0 }, now), false);
  assert.equal(inquiry.isTrapped({ _t: now - 500 }, now), true);
  assert.equal(inquiry.isTrapped({ _t: now + 60_000 }, now), false, "device clock ahead is no bot");
  assert.equal(inquiry.isTrapped(null, now), false);
});

// ---- tickets / tokens ------------------------------------------------------
test("ticket: forged, altered and expired tickets are refused", () => {
  const t = token.signTicket({ kind: "beratung" });
  assert.equal(token.verifyTicket(t).ok, true);
  assert.equal(token.verifyTicket(t.slice(0, -1) + (t.endsWith("A") ? "B" : "A")).reason, "bad_ticket");
  assert.equal(token.verifyTicket("abc.def").reason, "bad_ticket");
  assert.equal(token.verifyTicket(token.signTicket({ kind: "beratung" }, Date.now() - 31 * 60 * 1000)).reason, "ticket_expired");
  assert.throws(() => token.signTicket({ kind: "demo" }));
});

test("upload token: invalid and expired are told apart", () => {
  const parts = { kind: "kontakt", ref: "PH-K261026-ABCDEF", id: token.newId(), expiresAt: new Date(Date.now() + 60_000) };
  const good = token.signToken(parts);
  assert.equal(token.verifyToken(good).ok, true);
  assert.equal(token.verifyToken(good.slice(0, -2) + "xx").reason, "invalid");
  assert.equal(token.verifyToken("kurz").reason, "invalid");
  assert.equal(token.verifyToken(token.signToken({ ...parts, expiresAt: new Date(Date.now() - 1000) })).reason, "expired");
});

// ---- session route ---------------------------------------------------------
test("session route: ticket → link; old payload { kind, email, leadRef } → 400 ticket_required; replay = same link", async () => {
  const t = token.signTicket({ kind: "kontakt", email: "e@example.invalid" });
  const r1 = await sessionRoute.POST(sessionReq({ ticket: t }));
  assert.equal(r1.status, 200);
  const j1 = await r1.json();
  assert.match(j1.url, /^http:\/\/localhost:3000\/de\/upload\/[A-Za-z0-9_-]{40,}$/);
  assert.match(j1.qr, /^data:image\/svg\+xml/);
  const j2 = await (await sessionRoute.POST(sessionReq({ ticket: t, kind: "kontakt" }))).json();
  assert.equal(j2.url, j1.url, "same ticket, same link; extra keys ignored");

  const old = await sessionRoute.POST(sessionReq({ kind: "kontakt", email: "e@example.invalid", leadRef: null }));
  assert.equal(old.status, 400);
  assert.equal((await old.json()).error, "ticket_required");
  assert.equal((await sessionRoute.POST(sessionReq({ ticket: "abc.def" }))).status, 400);
  const forged = await sessionRoute.POST(sessionReq({ ticket: `${"A".repeat(40)}.${"B".repeat(22)}` }));
  assert.equal(forged.status, 403);
  assert.equal((await sessionRoute.POST(sessionReq({ ticket: t }, { Host: "localhost:3000" }))).status, 403, "no Origin");
  assert.equal((await sessionRoute.POST(sessionReq({ ticket: t }, { Origin: "https://evil.example", Host: "localhost:3000" }))).status, 403);
});

// ---- upload flow + error cases (service) -----------------------------------
async function freshToken() {
  const minted = await service.mintSession({ ticket: token.signTicket({ kind: "beratung" }) });
  return minted.token;
}
const fileInput = (over = {}) => ({ name: "wohnzimmer.jpg", size: JPEG.length, type: "image/jpeg", lastModified: 1, category: "photo", consentVersion: config.CONSENT_VERSION, ...over });

test("flow: register, one chunk, complete, note + submit", async () => {
  const tk = await freshToken();
  const f = await service.initFile(tk, fileInput());
  assert.equal(f.totalChunks, 1);
  const done = await service.putChunk(tk, f.fileId, 0, JPEG);
  assert.equal(done.status, "complete");
  assert.equal(done.mime, "image/jpeg");
  const s = await service.saveNote(tk, { note: "Raumhöhe 2,60 m", submit: true, consentVersion: config.CONSENT_VERSION });
  assert.ok(s.submittedAt);
  assert.equal(s.files.length, 1);
  // same file again → same entry (resume), no duplicate
  assert.equal((await service.initFile(tk, fileInput())).fileId, f.fileId);
});

const rejects = (p, status, code) => assert.rejects(p, (e) => e instanceof service.UploadError && e.status === status && e.code === code);

test("errors: too large, wrong type (magic bytes), no consent, wrong chunk", async () => {
  const tk = await freshToken();
  await rejects(service.initFile(tk, fileInput({ size: config.UPLOAD_CONFIG.categories.photo.maxBytes + 1 })), 413, "too_large");
  await rejects(service.initFile(tk, fileInput({ consentVersion: "alt" })), 400, "consent_required");
  await rejects(service.initFile(tk, fileInput({ category: "exe" })), 400, "bad_category");
  const exe = Buffer.concat([Buffer.from("MZ\x90\x00", "latin1"), Buffer.alloc(500)]);
  const f = await service.initFile(tk, fileInput({ name: "programm.jpg", size: exe.length }));
  await rejects(service.putChunk(tk, f.fileId, 0, exe), 415, "unsupported_type");
  const g = await service.initFile(tk, fileInput({ name: "b.jpg" }));
  await rejects(service.putChunk(tk, g.fileId, 0, JPEG.subarray(0, 100)), 400, "bad_chunk_size");
  await rejects(service.putChunk(tk, g.fileId, 3, JPEG), 400, "bad_index");
  await rejects(service.putChunk(tk, "A".repeat(22), 0, JPEG), 404, "file_not_found");
});

test("errors: expired and invalid link", async () => {
  const parts = { kind: "kontakt", ref: "PH-K261026-ABCDEF", id: token.newId(), expiresAt: new Date(Date.now() - 1000) };
  await rejects(service.openSession(token.signToken(parts)), 410, "expired");
  await rejects(service.initFile(token.signToken(parts), fileInput()), 410, "expired");
  await rejects(service.openSession("nicht-gueltig-" + "x".repeat(40)), 404, "invalid");
});

test("demo limits: max files per demo link", async () => {
  const { token: tk } = service.demoSession();
  for (let i = 0; i < config.UPLOAD_CONFIG.demo.maxFiles; i++) await service.initFile(tk, fileInput({ name: `f${i}.jpg` }));
  await rejects(service.initFile(tk, fileInput({ name: "zu-viel.jpg" })), 409, "too_many_files");
});

// ---- German texts ----------------------------------------------------------
test("every error code of the upload API has a German text", () => {
  const codes = new Set();
  const scan = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) scan(p);
      else if (p.endsWith(".js")) {
        const src = fs.readFileSync(p, "utf8");
        for (const m of src.matchAll(/UploadError\(\d+, "([a-z_]+)"/g)) codes.add(m[1]);
        for (const m of src.matchAll(/error: "([a-z_]+)"/g)) codes.add(m[1]);
      }
    }
  };
  scan(path.join(SRC, "lib/upload"));
  scan(path.join(SRC, "app/api/upload/[token]"));
  ["expired", "invalid", "network"].forEach((c) => codes.add(c));
  assert.ok(codes.size > 10);
  for (const code of codes) assert.notEqual(messages.uploadErrorText(code), messages.FALLBACK_ERROR, `text for ${code}`);
  assert.equal(messages.uploadErrorText("__proto__"), messages.FALLBACK_ERROR);
  for (const text of Object.values(messages.UPLOAD_ERRORS)) assert.doesNotMatch(text, /\b(the|please|error|failed)\b/i, "German only");
});

test("link limit: per-link rate limit answers 429 rate_limited with Retry-After", async () => {
  const http = await import(pathToFileURL(path.join(SRC, "lib/upload/http.js")).href);
  const tk = "T".repeat(60);
  let res = null;
  for (let i = 0; i <= http.LINK_LIMITS.note; i++) res = await http.linkLimited(tk, "note");
  assert.ok(res);
  assert.equal(res.status, 429);
  assert.equal(res.headers.get("retry-after"), "120");
  assert.equal((await res.json()).error, "rate_limited");
  assert.equal(await http.linkLimited("U".repeat(60), "note"), null, "other link unaffected");
});

test("handoff card: a timeout is 'dauert länger', not 'Keine Verbindung'; retries stay within 4 requests / 75 s", () => {
  const timeoutError = Object.assign(new Error("signal timed out"), { name: "TimeoutError" });
  const abortError = Object.assign(new Error("aborted"), { name: "AbortError" });
  assert.equal(messages.linkFailureReason(timeoutError), "timeout");
  assert.equal(messages.linkFailureReason(abortError), "timeout");
  assert.equal(messages.linkFailureReason(new TypeError("Failed to fetch")), "network");
  assert.match(messages.HANDOFF_REASONS.timeout, /länger als üblich/);
  assert.doesNotMatch(messages.HANDOFF_REASONS.timeout, /Verbindung/);
  assert.ok(messages.HANDOFF_RETRYABLE.has("timeout"), "timeout offers 'Erneut versuchen'");
  assert.ok(messages.HANDOFF_AUTO_RETRY.has("timeout"));
  assert.ok(!messages.HANDOFF_AUTO_RETRY.has("rate_limited"), "429 is not hammered automatically");
  assert.equal(messages.HANDOFF_ATTEMPTS.length, 4);
  assert.equal(messages.HANDOFF_ATTEMPTS[0].delay, 0);
  assert.ok(messages.HANDOFF_ATTEMPTS.slice(1).every((a) => a.timeout >= messages.HANDOFF_ATTEMPTS[0].timeout), "later attempts wait at least as long");
  assert.ok(messages.HANDOFF_MAX_WAIT_MS <= 90_000, "the visitor never waits more than 90 s for the card");
});
