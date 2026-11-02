// node --test tests/unit/kuechenplaner-a11y-fix01.test.mjs
// Mobil-A11y fix-01: Handy quer und offene Bildschirmtastatur – die angeheftete Ansicht
// darf das fokussierte Feld nicht verdecken (WCAG 2.4.11, 1.3.4).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const K = "src/components/Labs/Kuechenplaner/";

test("fix-01: Ansicht löst sich bei kurzer Höhe (quer) und bei fokussiertem Feld (Touch)", () => {
  const css = read(`${K}Kuechenplaner.module.css`);
  assert.match(css, /@media \(max-width: 1023px\) and \(max-height: 500px\)\s*\{\s*\.stick\s*\{\s*position: relative !important;/);
  assert.match(css, /@media \(max-width: 1023px\) and \(pointer: coarse\)[\s\S]*?:focus\) \.stick \{\s*position: relative;/);
  assert.match(css, /:global\(html\):has\(\.root \.panel[\s\S]*?scroll-padding-top: calc\(var\(--kp-top-px, 64px\) \+ 8px\) !important;/);
});

test("fix-01: Scroll-Abstand rechnet nur mit der Höhe, wenn die Ansicht wirklich angeheftet ist", () => {
  const app = read(`${K}KuechenplanerApp.js`);
  assert.match(app, /className=\{`\$\{styles\.stick\} sticky top-/);
  assert.match(app, /getComputedStyle\(el\)\.position === "sticky"/);
  assert.match(app, /matchMedia\("\(max-height: 500px\)"\)/);
});
