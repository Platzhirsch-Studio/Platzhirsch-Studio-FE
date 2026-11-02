// tests/unit/r3-portal-upload.test.mjs — R3-portal-upload:
// next.config.js headers() route-exact (microphone only on the planning page,
// SAMEORIGIN/frame-ancestors only on the document file route, global policy
// unchanged), Lightbox cleanup without close() (N1), UploadHandoff without
// radii/shadows, upload page: invalid token -> notFound().
// Run: node --test tests/unit/r3-portal-upload.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(ROOT, "package.json"));
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

const config = require(path.join(ROOT, "next.config.js"));
const { pathToRegexp } = require("next/dist/compiled/path-to-regexp");
const rules = await config.headers();

/** Effective headers for a path: every matching rule in order, last key wins (Next semantics). */
function headersFor(p) {
  const out = {};
  for (const r of rules) {
    if (!pathToRegexp(r.source, [], { strict: true, sensitive: false, delimiter: "/" }).test(p)) continue;
    for (const h of r.headers) out[h.key.toLowerCase()] = h.value;
  }
  return out;
}

const GLOBAL_PP = "camera=(), microphone=(), geolocation=(self), interest-cohort=()";

test("global headers stay as before (site, portal overview, other APIs)", () => {
  for (const p of ["/de", "/en/produkte", "/de/portal", "/de/portal/projekte", "/de/portal/dokumente", "/de/upload/abc", "/api/kontakt"]) {
    const h = headersFor(p);
    assert.equal(h["x-frame-options"], "DENY", p);
    assert.equal(h["permissions-policy"], GLOBAL_PP, p);
    assert.equal(h["x-content-type-options"], "nosniff", p);
    assert.match(h["strict-transport-security"], /max-age=63072000/, p);
    assert.equal(h["content-security-policy"], undefined, p);
  }
});

test("microphone=(self) only on the planning page with the voice note", () => {
  const h = headersFor("/de/portal/projekte/PRJ-2026-021");
  assert.equal(h["permissions-policy"], "camera=(), microphone=(self), geolocation=(self), interest-cohort=()");
  assert.equal(h["x-frame-options"], "DENY");
  for (const p of ["/de/portal/projekte", "/de/portal/projekte/PRJ-1/extra", "/en/portal/projekte/PRJ-1", "/de/portal/nachrichten"]) {
    assert.equal(headersFor(p)["permissions-policy"], GLOBAL_PP, p);
  }
});

test("SAMEORIGIN + frame-ancestors 'self' only on the document file route (PDF preview)", () => {
  const h = headersFor("/api/portal/dokumente/ANG-2026-0142");
  assert.equal(h["x-frame-options"], "SAMEORIGIN");
  assert.equal(h["content-security-policy"], "frame-ancestors 'self'");
  assert.equal(h["permissions-policy"], GLOBAL_PP);
  for (const p of ["/api/portal/dokumente/kalender", "/api/portal/dokumente/pass", "/api/portal/dokumente/pass/PASS-014-1", "/api/portal/feedback", "/de/portal/dokumente"]) {
    const x = headersFor(p);
    assert.equal(x["x-frame-options"], "DENY", p);
    assert.equal(x["content-security-policy"], undefined, p);
  }
});

test("N1: Lightbox cleanup does not call close(); onClose only after a real close", () => {
  const src = read("src/components/Portal/Planung/Lightbox.js");
  const cleanup = src.slice(src.indexOf("return () => {"), src.indexOf("}, []);"));
  assert.ok(cleanup.length > 0);
  assert.doesNotMatch(cleanup, /\.close\(\)/);
  assert.match(src, /if \(!d\.open && d\.isConnected\) onCloseRef\.current\?\.\(\)/);
});

test("UploadHandoff: Neuauftritt without radii and shadows, interface unchanged", () => {
  const src = read("src/components/Upload/UploadHandoff.js").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""); // comments may say "no shadow"
  assert.doesNotMatch(src, /\brounded(-[\w[\]./]+)?\b/);
  assert.doesNotMatch(src, /\bshadow(-[\w[\]./]+)?\b/);
  assert.match(src, /export default function UploadHandoff\(\{ kind, ticket, email, initial, onClose, onContinue, continueLabel, className = "" \}\)/);
  assert.match(src, /export function handoffFrom\(kind, \{ email, result, ticket \} = \{\}\)/);
});

test("upload page: invalid token -> notFound() (404), expired stays a help page; not-found shows help", () => {
  const page = read("src/app/[locale]/upload/[token]/page.js");
  // F4 Fix-Runde 1: "unavailable" (no token secret) and the paused upload show
  // the help frame; every other invalid token still ends in notFound() = 404.
  assert.match(page, /else if \(e\.code === "expired"\) problem = UPLOAD_PROBLEM\.expired;\s*else notFound\(\);/);
  assert.match(page, /if \(!uploadsAccepting\(\)\)/);
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  const nf = read("src/app/[locale]/upload/[token]/not-found.js");
  assert.match(nf, /UPLOAD_PROBLEM\.invalid/);
  assert.match(nf, /UploadProblemBody/);
});
