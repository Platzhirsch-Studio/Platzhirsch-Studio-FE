// tests/unit/upload-qr.test.mjs — Labs-Ausbau "Handy-Upload Premium":
// the house QR (src/lib/upload/qrSvg.js) keeps the properties that make it
// scannable, and the handoff/upload UI keeps its contracts.
// Real decoding (jsQR, sizes, blur, JPEG) is in
// qa-screenshots/labs-ausbau/handy-upload/selbst/qr-scan.mjs (jsQR is not a
// project dependency). Run: node --test tests/unit/upload-qr.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import QRCode from "qrcode";
import { qrSvg, qrDataUrl, logoField, QR_MARGIN, QR_COLORS } from "../../src/lib/upload/qrSvg.js";

const URL_DEV = "http://localhost:3000/de/upload/MXxLfFBILUsyNjEwMjctQUJDMTIzfG1oYzJxN3F8c0ZQdmRKZm1yc3NfWjlmM2ZnU1N1UQ3Kd9zX0aQpLmN4R2b7yW";
const read = (p) => fs.readFileSync(p, "utf8");

test("house QR: level Q with monogram, field ≤ 5 % of the modules, quiet zone 4", () => {
  const q = qrSvg(URL_DEV);
  assert.equal(q.level, "Q");
  assert.equal(q.field % 2, 1, "odd field, centred on the module grid");
  assert.ok((q.field * q.field) / (q.size * q.size) <= 0.05, `field ${q.field}² of ${q.size}²`);
  assert.equal(QR_MARGIN, 4);
  assert.match(q.svg, new RegExp(`viewBox="0 0 ${q.size + 2 * QR_MARGIN} ${q.size + 2 * QR_MARGIN}"`));
  // high contrast, no gradients, no rounded corners
  assert.ok(q.svg.includes(QR_COLORS.dark) && q.svg.includes(QR_COLORS.light));
  assert.doesNotMatch(q.svg, /Gradient|rx=|ry=|filter/);
  // same module matrix as the qrcode package at that level (data unchanged)
  assert.equal(q.size, QRCode.create(URL_DEV, { errorCorrectionLevel: "Q" }).modules.size);
});

test("house QR: finder patterns drawn solid; data modules outside field and finders", () => {
  const q = qrSvg(URL_DEV);
  const finderPath = q.svg.match(/fill-rule="evenodd"[^>]*d="([^"]+)"/)[1];
  assert.equal((finderPath.match(/h7v7h-7z/g) || []).length, 3, "three 7×7 finder frames");
  assert.equal((finderPath.match(/h3v3h-3z/g) || []).length, 3, "three 3×3 eyes");
  // every data module lies outside the centre field
  const lo = (q.size - q.field) / 2 + QR_MARGIN;
  const hi = lo + q.field;
  const data = q.svg.match(/<path fill="[^"]+" shape-rendering="crispEdges" d="(M[^"]+)"\/>/g).at(-1);
  for (const [, x, y] of data.matchAll(/M([\d.]+) ([\d.]+)h/g)) {
    const c = Math.floor(Number(x));
    const r = Math.floor(Number(y));
    assert.ok(!(r >= lo && r < hi && c >= lo && c < hi), `module ${r},${c} in field`);
  }
});

test("house QR: plain variant (logo=false) uses level M; data URL format unchanged", () => {
  assert.equal(qrSvg(URL_DEV, { logo: false }).level, "M");
  assert.equal(qrSvg(URL_DEV, { logo: false }).field, 0);
  assert.match(qrDataUrl(URL_DEV), /^data:image\/svg\+xml;charset=utf-8,%3Csvg/);
  assert.equal(logoField(57), 11);
  assert.equal(logoField(21), 7, "never below 7 modules");
});

test("handoff.js uses the house QR and keeps its return shape", () => {
  const src = read("src/lib/upload/handoff.js");
  assert.match(src, /import "server-only";/);
  assert.match(src, /qr: qrDataUrl\(url\)/);
  assert.match(src, /return \{\s*url,\s*ref,\s*expiresAt: expiresAt\.toISOString\(\),/);
});

test("handoff card: prepared SMS/E-Mail only opens the visitor's own app (no fetch to a send API)", () => {
  const src = read("src/components/Upload/UploadHandoff.js");
  assert.match(src, /Vorbereitet/);
  assert.match(src, /`sms:\$\{phone\}\?&body=/);
  assert.match(src, /`mailto:/);
  // the only network call of the card is the ticket → link exchange
  assert.deepEqual([...src.matchAll(/fetch\("([^"]+)"/g)].map((m) => m[1]), ["/api/upload/session"]);
  assert.match(src, /data-upload-link="phone"/);
  assert.match(src, /data-upload-link="desktop"/);
});

test("upload page UI: guided tips, stepper, haptics behind reduced motion, safe areas", () => {
  const src = read("src/components/Upload/UploadClient.js");
  for (const t of ["Aus den Ecken fotografieren", "Video langsam schwenken", "Maße notieren"]) assert.ok(src.includes(t), t);
  assert.match(src, /aria-current=\{n === step \? "step" : undefined\}/);
  assert.match(src, /if \(!reducedMotion\(\)\) navigator\.vibrate\?\.\(ms\)/);
  assert.match(src, /env\(safe-area-inset-left\)/);
  assert.match(src, /env\(safe-area-inset-bottom\)/);
  assert.match(src, /prefers-reduced-motion:no-preference/);
  // security logic untouched: chunked PUT, consent version, accept check
  assert.match(src, /xhr\.open\("PUT", url\)/);
  assert.match(src, /consentVersion: CONSENT_VERSION/);
  assert.match(src, /if \(!accepts\(picker\.accept, file\.type\)\)/);
});
