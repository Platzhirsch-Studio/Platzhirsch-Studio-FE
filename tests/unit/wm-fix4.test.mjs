// QM wm-fix4 (Bereich wohnen-marken, Runde 4): Studio-Satz einmal, 200-%-Textgröße,
// Lightbox auf flachen Telefonen, Router-Aktionen erst nach dem Commit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { withoutSentence } from "../../src/components/MarkenItems/copy.js";
import { ZOOM_SAFE_TEXT } from "../../src/components/UberUns/zoomSafe.js";
import { dealerStudio } from "../../src/lib/legal/claims.js";

const code = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

test("withoutSentence: entfernt genau den Satz, räumt Leerraum auf, leere Absätze fallen weg", () => {
  const s = "Minotti hat das Studio 2019 eröffnet.";
  assert.deepEqual(withoutSentence([`${s} Das Studio liegt in Lochau.`, "Zweiter Absatz."], s), ["Das Studio liegt in Lochau.", "Zweiter Absatz."]);
  assert.deepEqual(withoutSentence([s], s), []);
  assert.deepEqual(withoutSentence(["Anderer Text."], s), ["Anderer Text."]);
  assert.deepEqual(withoutSentence(["A."], ""), ["A."]);
  assert.deepEqual(withoutSentence(undefined, s), []);
});

test("Minotti: Studio-Satz steht nur noch in „Im Showroom“ (mit Beleglink), nicht zusätzlich im Leitfaden", () => {
  const studio = dealerStudio("minotti", "de");
  assert.ok(studio?.statement, "Claim-Register liefert den Studio-Satz");
  const src = code("src/components/MarkenItems/markenitems.js");
  assert.match(src, /dealerStudio\(brandSlug, locale\)\?\.statement/);
  assert.match(src, /String\(showroom\.text \|\| ""\)\.includes\(studioSentence\)/);
  assert.match(src, /withoutSentence\(sec\.paragraphs, shownInShowroom\)/);
});

test("200 % Textgröße: Display-Rollen am Telefon an die Viewportbreite gebunden, Wrapper in Über uns und Produkte", () => {
  assert.match(ZOOM_SAFE_TEXT, /wrap-break-word/);
  for (const [role, vw] of [["display-xl", 14], ["display-l", 12.5], ["display-m", 11]]) {
    assert.ok(ZOOM_SAFE_TEXT.includes(`max-sm:[&_.text-${role}]:text-[length:min(var(--text-${role}),${vw}vw)]`), role);
  }
  // Bei normaler Größe greift die Kappe ab 320 px nicht (Rollen-Minimum ≤ Kappe).
  assert.ok(48 <= 0.14 * 360 && 40 <= 0.125 * 320 && 34 <= 0.11 * 320);
  for (const p of ["src/app/[locale]/ueber-uns/layout.js", "src/app/[locale]/produkte/layout.js"]) {
    assert.match(code(p), /className=\{ZOOM_SAFE_TEXT\}/, p);
  }
  const m = code("src/components/MarkenItems/markenitems.js");
  assert.match(m, /grid-cols-\[repeat\(auto-fill,minmax\(min\(100%,9rem\),1fr\)\)\]/, "Fakten einspaltig bei 200 %");
  const idx = code("src/components/MarkenClient/Marken.js");
  assert.match(idx, /min\(var\(--text-display-m\),11vw\)/);
  assert.match(idx, /join\("\u00a0· "\)/, "Trennpunkt bleibt am vorigen Wort");
  assert.match(code("src/components/UberUns/uberuns.js"), /softHyphens\(paragraph\)/);
});

test("Lightbox: auf flachen Telefonen schwebt die Leiste über dem Bild", () => {
  const src = code("src/components/ShopCatalog/productLightbox.js");
  assert.match(src, /\[@media\(max-height:500px\)\]:absolute/);
  assert.match(src, /\[@media\(max-height:500px\)\]:inset-y-1/);
  assert.match(src, /disabled:invisible/);
});

test("LinkDelegate: keine Router-Aktion vor dem Commit (React-Warnung „hasn't mounted yet“)", () => {
  const src = code("src/components/Reusable/LinkDelegate.js");
  assert.match(src, /const ready = useRef\(false\)/);
  assert.match(src, /setTimeout\(\(\) => \{\s*ready\.current = true;/);
  assert.equal((src.match(/if \(!ready\.current\) return;/g) || []).length, 2, "Klick und Prefetch warten");
});

test("Karriere: kleine Abschnittstitel 24 px über dem Text, ohne Kapitel-Hub; Ansprechperson mit Luft", () => {
  const job = code("src/components/Karriere/JobDetail.js");
  assert.equal((job.match(/size="title" as="h2">/g) || []).length, 4);
  assert.doesNotMatch(job, /<\/Heading>\n\s+<div className="mt-4">/);
  const share = code("src/components/Karriere/ShareJob.js");
  assert.match(share, /size="title" as="h2">/);
  assert.match(share, /className="mt-6 flex flex-wrap gap-3"/);
  assert.match(code("src/components/Karriere/karriereposition.js"), /className="mt-6 text-small text-text" data-testid="career-contact-person"/);
});

test("Presse/Über uns bei 200 %: weiche Trennstellen, Label über dem Wert, Faktenraster auf Bildschirmbreite", async () => {
  const { softHyphens, SOFT_HYPHEN } = await import("../../src/components/UberUns/softHyphens.js");
  assert.equal(softHyphens("Hintergrundinformationen"), `Hintergrund${SOFT_HYPHEN}informationen`);
  assert.equal(softHyphens("Veröffentlichungen"), `Veröffent${SOFT_HYPHEN}lichungen`);
  assert.equal(softHyphens("Hintergrund"), "Hintergrund");
  assert.equal(softHyphens("Veröffentlichung").replaceAll(SOFT_HYPHEN, ""), "Veröffentlichung");
  const presse = code("src/components/Presse/presse.js");
  assert.match(presse, /inline-flex min-h-11 flex-wrap items-center gap-x-2/);
  assert.match(presse, /softHyphens\(t\("contactText"\)\)/);
  assert.match(code("src/components/Presse/pressearticle.js"), /softHyphens\(t\("archiveEyebrow"\)\)/);
  const facts = code("src/components/UberUns/FactsBlock.js");
  assert.equal((facts.match(/className="grid grid-cols-1 /g) || []).length, 2);
});
