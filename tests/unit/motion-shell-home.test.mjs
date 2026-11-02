// Motion shell-home (01.11.2026): micro-interactions of home, header/menus,
// footer, cookie bar – logic of calmMotion.js plus source checks that every
// new motion uses the shared tokens, transform/opacity only, and stands still
// under reduced motion and the "Ruhige Ansicht" (reduced / calm).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isCalmMotion, scrollBehavior } from "../../src/components/Home/calmMotion.js";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const doc = (motion) => ({ documentElement: { dataset: motion ? { motion } : {} } });
const win = (reduce) => ({ matchMedia: (q) => ({ matches: reduce && q === "(prefers-reduced-motion: reduce)" }) });

test("isCalmMotion: data-motion reduced/calm oder System-Einstellung → keine Bewegung", () => {
  assert.equal(isCalmMotion(doc("reduced"), win(false)), true);
  assert.equal(isCalmMotion(doc("calm"), win(false)), true);
  assert.equal(isCalmMotion(doc(), win(true)), true);
  assert.equal(isCalmMotion(doc(), win(false)), false);
  assert.equal(isCalmMotion(doc("full"), win(false)), false);
  // SSR / ohne window: nichts wirft, Standard = Bewegung erlaubt
  assert.equal(isCalmMotion(undefined, undefined), false);
  assert.equal(isCalmMotion(doc(), {}), false);
  assert.equal(scrollBehavior(doc("calm"), win(false)), "auto");
  assert.equal(scrollBehavior(doc(), win(false)), "smooth");
});

test("ScrollRow: Vor/Zurück folgt auch der Ruhigen Ansicht (nicht nur prefers-reduced-motion)", () => {
  const src = read("src/components/Home/ScrollRow.js");
  assert.match(src, /import \{ scrollBehavior \} from "\.\/calmMotion"/);
  assert.match(src, /behavior: scrollBehavior\(\)/);
  assert.doesNotMatch(src, /prefers-reduced-motion: reduce\)"\)\.matches/);
});

test("Navbar.module.css: jede Ruhe-Regel kennt reduced UND calm, Raum-Aufklappen nur mit Bewegung erlaubt", () => {
  const css = read("src/components/Navbar/Navbar.module.css");
  assert.doesNotMatch(css, /:global\(html\[data-motion="reduced"\]\)/);
  assert.ok((css.match(/html:is\(\[data-motion="reduced"\], \[data-motion="calm"\]\)/g) || []).length >= 7);
  assert.match(css, /prefers-reduced-motion: no-preference\)[\s\S]*html:not\(\[data-motion="reduced"\], \[data-motion="calm"\]\)\)[^{]*\.fold/);
  assert.match(css, /animation: fold-in var\(--duration-ui\) var\(--ease-quiet\)/);
  const menu = read("src/components/Navbar/MobileMenu.js");
  assert.match(menu, /cx\(s\.fold, "pb-6"\)/);
});

test("Footer-Akkordeon: Liste blendet nur unter 768 px und nur mit Bewegung ein", () => {
  const css = read("src/components/Reusable/Footer.module.css");
  assert.match(css, /@media \(max-width: 767px\) and \(prefers-reduced-motion: no-preference\)/);
  assert.match(css, /html:not\(\[data-motion="reduced"\], \[data-motion="calm"\]\)/);
  assert.doesNotMatch(css, /\d+ms/); // nur Tokens
  assert.match(read("src/components/Reusable/Footer.js"), /cx\(fm\.group, "group\/fg/);
});

test("Startseite: Karten-Raster kommen gestaffelt (reveal-group, 16 px), Überschriften bleiben unberührt", () => {
  assert.match(read("src/components/Home/row.js"), /export const ROW_REVEAL = "reveal-group \[--reveal-y:16px\]"/);
  for (const f of [
    "src/components/Home/Rooms.js",
    "src/components/Home/Journal.js",
    "src/components/Home/Services.js",
    "src/components/ProuductSectionHome/ProuductSectionHome.js",
  ]) {
    assert.match(read(f), /\$\{ROW_MOBILE\} \$\{ROW_REVEAL\}/, f);
  }
  assert.match(read("src/components/WhyChooseUsSectionHome/WhyChooseUsSectionHome.js"), /<ol className=\{`\$\{ROW_REVEAL\} /);
  // H1 und Hero-Bild (LCP) bekommen nie eine Reveal-/Einblendklasse
  const hero = read("src/components/Home/Hero.js");
  assert.doesNotMatch(hero, /reveal|ph-arrive|starting:opacity/);
});

test("Cookie-Leiste: Auftritt nie aus Deckkraft 0 (LCP), nur opacity/translate, Ruhe über motion-reduce", () => {
  const src = read("src/components/Cookies/cookiecomponent.js");
  const bar = src.match(/const arriveBar =\s*"([^"]+)"/)?.[1] || "";
  assert.match(bar, /starting:opacity-60/);
  assert.doesNotMatch(bar, /starting:opacity-0\b/);
  for (const name of ["arriveBar", "arriveDialog", "arriveDetails"]) {
    const cls = src.match(new RegExp(`const ${name} =\\s*"([^"]+)"`))?.[1] || "";
    assert.match(cls, /transition-\[opacity,translate\] duration-\(--duration-ui\) ease-quiet/, name);
    assert.match(cls, /motion-reduce:transition-none/, name);
  }
  assert.match(src, /md:px-5 md:text-ui ph-press";/);
});

test("Neue Übergänge im Bereich nutzen nur die Dauer-Tokens", () => {
  for (const f of [
    "src/components/Navbar/SearchSheet.js",
    "src/components/Navbar/LanguageSwitcher.js",
    "src/components/Navbar/MobileMenu.js",
    "src/components/Reusable/MobileCtaBar.js",
    "src/components/Cookies/cookiecomponent.js",
    "src/components/Home/SeoIntro.js",
  ]) {
    assert.doesNotMatch(read(f), /\bduration-\d{2,4}\b/, f);
  }
  const search = read("src/components/Navbar/SearchSheet.js");
  assert.match(search, /className="ph-skeleton size-10 shrink-0"/);
  assert.match(search, /<p className="sr-only">…<\/p>/);
});
