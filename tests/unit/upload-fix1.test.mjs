// tests/unit/upload-fix1.test.mjs — Handy-Upload Premium, QA round fix1
// (qa-screenshots/labs-ausbau/handy-upload/feedback-1.md).
// Run: node --test tests/unit/upload-fix1.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { detectType } from "../../src/lib/upload/magic.js";

const read = (p) => fs.readFileSync(p, "utf8");
const FIX = "qa-screenshots/handy-upload/fixtures";

test("P2-3: detectType gives the same answer for a Buffer (server) and a Uint8Array (browser)", () => {
  const samples = [
    ...["foto-mit-gps.jpg", "grundriss.pdf", "programm.jpg"].map((f) => fs.readFileSync(`${FIX}/${f}`).subarray(0, 16)),
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52]),
    Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0]),
    Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypheic"), Buffer.alloc(4)]),
    Buffer.concat([Buffer.from([0, 0, 0, 0x14]), Buffer.from("ftypqt  "), Buffer.alloc(4)]),
    Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypmp42"), Buffer.alloc(4)]),
    Buffer.from("MZ\x90\x00 not a picture at all"),
  ];
  for (const b of samples) assert.deepEqual(detectType(new Uint8Array(b)), detectType(b), b.toString("hex"));
  assert.equal(detectType(new Uint8Array(fs.readFileSync(`${FIX}/programm.jpg`).subarray(0, 16))), null, "renamed .exe");
  assert.equal(detectType(new Uint8Array(fs.readFileSync(`${FIX}/foto-mit-gps.jpg`).subarray(0, 16))).family, "image");
  // no Node-only Buffer API left in magic.js (it now runs in the browser too)
  assert.doesNotMatch(read("src/lib/upload/magic.js"), /readUInt32BE|toString\("latin1"\)/);
});

test("P2-3: the upload page checks the bytes before it uploads; the server check stays", () => {
  const src = read("src/components/Upload/UploadClient.js");
  assert.match(src, /import \{ detectType \} from "@\/lib\/upload\/magic";/);
  assert.match(src, /file\.slice\(0, 16\)\.arrayBuffer\(\)/);
  const add = src.slice(src.indexOf("const addFiles"), src.indexOf("const onPick"));
  assert.ok(add.indexOf("await sniff(file)") < add.indexOf('update(key, { status: "queued" })'), "sniff before queueing");
  assert.match(read("src/app/api/upload/[token]/files/route.js") + read("src/lib/upload/service.js"), /detectType/);
});

test("P1-1: retries are shown (n/5) and chunks go up as bytes", () => {
  const src = read("src/components/Upload/UploadClient.js");
  assert.match(src, /const TRIES = BACKOFF\.length \+ 1;/);
  assert.match(src, /Verbindung holpert – neuer Versuch \(\{it\.retry\}\/\{it\.retryOf \|\| TRIES\}\)…/);
  // fix2: the back-off pause is nap() now — the manual "Erneut versuchen" in the bar can cut it short.
  assert.match(src, /onRetry\(attempt \+ 2, TRIES\);\s*await nap\(BACKOFF\[attempt\], ctl\);/);
  assert.match(src, /setAnnounce\(`Verbindung holpert – neuer Versuch \$\{n\} von \$\{of\}\.`\)/);
  assert.match(src, /const body = await blob\.arrayBuffer\(\)\.catch\(\(\) => blob\);/);
  // security logic untouched
  assert.match(src, /xhr\.open\("PUT", url\)/);
  assert.match(src, /consentVersion: CONSENT_VERSION/);
  assert.match(src, /if \(!accepts\(picker\.accept, file\.type\)\)/);
});

test("P2-1/P2-2/P2-4/P2-5: handoff card width, desktop-only send-to-me (E-Mail first), mounted flag, one 'Gültig'", () => {
  const src = read("src/components/Upload/UploadHandoff.js");
  assert.match(src, /lg:max-w-\[57rem\]/);
  assert.match(src, /lg:grid-cols-\[20rem_minmax\(0,1fr\)\]/);
  assert.match(src, /lg:size-64/);
  assert.match(src, /hidden border-t border-line sm:block" data-upload-sendtome/);
  assert.match(src, /useState\("mail"\)/);
  assert.match(src, /Link an mich senden/);
  assert.doesNotMatch(src, /Link per SMS oder E-Mail an mich/);
  assert.match(src, /const useMounted = \(\) => useSyncExternalStore\(noop, \(\) => true, \(\) => false\);/);
  assert.match(src, /disabled=\{!data \|\| !mounted\}/);
  assert.match(src, /disabled=\{!mounted\}/);
  assert.match(src, /> Gültig<\/span>/);
  assert.doesNotMatch(src, /Gültigkeit</);
  assert.doesNotMatch(src, /Min\. gültig|Std\. gültig|Tage gültig/);
});

test("P2-5: remainingLabel / untilLabel texts (logic mirrored from UploadHandoff.js)", () => {
  // UploadHandoff.js is a JSX client module; evaluate its two pure helpers in isolation.
  const src = read("src/components/Upload/UploadHandoff.js");
  const pick = (name) => src.match(new RegExp(`export function ${name}\\([\\s\\S]*?\\n\\}`))[0].replace(/^export /, "");
  const fmt = src.match(/const TIME_FMT[^\n]+\nconst DAY_FMT[^\n]+/)[0];
  const lib = new Function(`${fmt}\n${pick("remainingLabel")}\n${pick("untilLabel")}\nreturn { remainingLabel, untilLabel };`)();
  assert.equal(lib.remainingLabel(60 * 60_000), "noch 60 Min.");
  assert.equal(lib.remainingLabel(30 * 3_600_000), "noch 30 Std.");
  assert.equal(lib.remainingLabel(14 * 86_400_000), "noch 14 Tage");
  assert.equal(lib.remainingLabel(0), "abgelaufen");
  assert.equal(lib.untilLabel("2026-10-27T19:43:00Z", true), "bis 20:43 Uhr");
  assert.equal(lib.untilLabel("2026-11-10T18:59:00Z"), "bis 10. November, 19:59 Uhr");
});

test("P3: tip position, soft lock before consent, sticky bar without a second 'Senden'", () => {
  const src = read("src/components/Upload/UploadClient.js");
  assert.match(src, /\{current \+ 1\} \/ \{TIPS\.length\}/);
  assert.match(src, /aria-label="Tipp wählen"/);
  assert.match(src, /aria-disabled=\{needsConsent \|\| undefined\}/);
  assert.match(src, /needsConsent \? askConsent\(\) : inputs\[p\.id\]\.current\?\.click\(\)/);
  assert.match(src, /!formButtonOnScreen && \(/);
  assert.match(src, /% der Daten/);
});

test("demo page: card on its own row (wide), still noindex", () => {
  const src = read("src/app/[locale]/upload/page.js");
  assert.match(src, /robots: \{ index: false, follow: false \}/);
  assert.doesNotMatch(src, /<section className="mx-auto grid max-w-6xl gap-10 px-4 pb-20 lg:grid-cols-\[1fr_400px\]/);
});
