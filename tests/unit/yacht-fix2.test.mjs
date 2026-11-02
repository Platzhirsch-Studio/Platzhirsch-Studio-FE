// node --test tests/unit/yacht-fix2.test.mjs
// /de/yacht-interior – QA round 2 (qa-screenshots/erlebnis/yacht/feedback-2.md):
// noindex + no sitemap/llms entry (P1), Navetta 42 reference rules (P2.1),
// full grid rows (P2.2), section cut without clipping planes (P2.5),
// phone overview framing (P2.7). Docs: Marktresearch/digital/features/yacht.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { EXTRA_PAGES } from "../../src/lib/seo/sitemap/extraPages.js";
import { CREDIT, DISCLAIMER, NAVETTA_DIR, NAVETTA_IMAGES, NAVETTA_RELEASED, NAVETTA_SOURCE_DIR, navettaSrc } from "../../src/lib/yacht/navetta.js";
import { shelfLayout, zoneCols } from "../../src/lib/yacht/layout.js";
import { MODEL_KEYS, buildModel, cameraFor, deckVisible, sectionPart, sectionParts } from "../../src/lib/yacht/hull.js";
import { findClaims } from "../../src/lib/legal/claims.js";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (rel) => readFileSync(`${ROOT}${rel}`, "utf8");

// Integration 28.10.2026 (Inhaber-Entscheidung Nr. 9: Bild weglassen statt Seite verstecken): the page is indexable and listed; the Navetta chapter stays out
// until Minotti and Custom Line release the photos in writing.
// Inhaber-Entscheidung Nr. 11 (29.10.2026): written release by mail (28.10.) →
// expectation deliberately flipped: chapter shown, photos served unchanged from public/.
test("P1: page is indexable and in EXTRA_PAGES; Navetta chapter shown after the release", () => {
  assert.doesNotMatch(read("src/app/[locale]/yacht-interior/page.js"), /index: false/);
  assert.equal(EXTRA_PAGES.some((p) => p.path === "/yacht-interior"), true);
  assert.equal(NAVETTA_RELEASED, true);
  // R7-P4: das Seitenlayout liegt jetzt in src/components/Yacht/YachtPage.js
  assert.match(read("src/components/Yacht/YachtPage.js"), /\{NAVETTA_RELEASED \? \(/);
  // Released: every shown photo lies in public/ and is byte-identical to the original (unchanged).
  for (const img of NAVETTA_IMAGES) {
    const pub = `${ROOT}public${navettaSrc(img)}`;
    assert.ok(existsSync(pub), img.file);
    assert.ok(readFileSync(pub).equals(readFileSync(`${ROOT}${NAVETTA_SOURCE_DIR}/${img.file}`)), `${img.file} unverändert`);
  }
  assert.ok(NAVETTA_DIR.startsWith("/"));
});

test("P2.1: Navetta images exist, credit and disclaimer wording, no AI label, never cropped", () => {
  assert.ok(NAVETTA_IMAGES.length >= 5);
  for (const img of NAVETTA_IMAGES) {
    // Originals outside public/ until the release (then copied to public + NAVETTA_RELEASED = true).
    assert.ok(existsSync(`${ROOT}${NAVETTA_SOURCE_DIR}/${img.file}`) || existsSync(`${ROOT}public${navettaSrc(img)}`), img.file);
    assert.ok(img.alt.length > 40 && img.width > 0 && img.height > 0, img.file);
  }
  assert.equal(CREDIT, "Foto: Courtesy of Custom Line · Projekt: Custom Line Navetta 42 · Möbel: Minotti");
  assert.match(DISCLAIMER, /Referenzprojekt von Minotti – nicht von Platzhirsch eingerichtet/);
  const files = ["src/components/Yacht/NavettaReference.js", "src/components/Yacht/NavettaFigure.js", "src/components/Yacht/NavettaCarousel.js"].map(read)
    .join("\n")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(files, /KiLabel|data-ki-label|object-cover|filter|blur|grayscale|sepia/);
  assert.match(read("src/components/Yacht/NavettaFigure.js"), /object-contain/);
  assert.match(read("src/components/Yacht/NavettaFigure.js"), /aspectRatio: `\$\{img\.width\} \/ \$\{img\.height\}`/);
  // no wording that suggests Platzhirsch furnished the yacht, no claims
  const copy = read("src/components/Yacht/NavettaReference.js");
  assert.doesNotMatch(copy, /von uns eingerichtet|unser Projekt|wir haben .* eingerichtet|Partner|Händler/i);
  assert.deepEqual(findClaims(copy), []);
});

test("P2.2: no grid row more than a third empty", () => {
  for (let n = 1; n <= 12; n++) {
    const c = zoneCols(n);
    const rest = n % c;
    assert.ok(rest === 0 || (c - rest) / c <= 1 / 3, `zone row n=${n}: ${c} cols`);
    const { xl, lastSpanXl, lastSpanMd } = shelfLayout(n);
    const used = (n % xl || xl) - 1 + lastSpanXl;
    assert.equal(used, xl, `brand shelf n=${n}: last xl row filled`);
    assert.equal(((n - 1) % 2) + lastSpanMd, 2, `brand shelf n=${n}: last md row filled`);
  }
});

test("P2.5: section cut as geometry – parts above the cut hidden, crossing parts end at the cut", () => {
  const part = { p: [0, 1, 0], s: [1, 2, 1], mat: "wall", cut: true };
  assert.equal(sectionPart(part, null), part);
  assert.equal(sectionPart({ ...part, cut: false }, 0.5).s[1], 2);
  assert.equal(sectionPart(part, -0.1), null);
  const short = sectionPart(part, 1.2);
  assert.ok(Math.abs(short.p[1] + short.s[1] / 2 - 1.2) < 1e-9 && Math.abs(short.p[1] - short.s[1] / 2) < 1e-9);
  for (const key of MODEL_KEYS) {
    const m = buildModel(key);
    for (const [zone, cut] of Object.entries(m.cutY)) {
      const kept = m.parts.flatMap((p) => sectionParts(p, cut));
      for (const p of kept) if (p.cut && !p.rot) assert.ok(p.p[1] + p.s[1] / 2 <= cut + 1e-6, `${key}/${zone}: ${p.mat} above the cut`);
      if (cut < m.hull.F) assert.equal(deckVisible(m, cut), false, `${key}/${zone}: deck must open`);
    }
  }
  // a superstructure volume opens to four walls, no lid
  const house = sectionParts({ p: [0, 2, 0], s: [8, 2, 4], mat: "gelcoat", cut: true }, 2.5);
  assert.equal(house.length, 4);
  for (const w of house) assert.ok(Math.min(w.s[0], w.s[2]) <= 0.07 && w.p[1] + w.s[1] / 2 <= 2.5 + 1e-9);
  const stage = read("src/components/Yacht/Stage3D.js");
  assert.doesNotMatch(stage, /clippingPlanes|localClippingEnabled/);
});

test("P2.7: phone overview camera aims closer than the landscape one", () => {
  for (const key of MODEL_KEYS) {
    const m = buildModel(key);
    const dist = (c) => Math.hypot(...c.position.map((v, i) => v - c.target[i]));
    const phone = cameraFor(m, null, 1.0);
    const old = (m.hull.L * 1.12 * 1.3 + 2) * Math.hypot(0.82, 0.42, 0.82);
    assert.ok(dist(phone) < old, `${key}: phone overview not closer`);
    assert.ok(phone.position.every(Number.isFinite));
  }
});
