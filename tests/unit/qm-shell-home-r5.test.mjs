// QM shell-home r5: brand-name soft hyphens, the menu opening-hours line in
// the house format, and source checks for the layout fixes (200 % text,
// WCAG 1.4.12 spacing, phone landscape).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { softBrandName } from "../../src/components/Home/brandBreak.js";
import { houseTimeRange, menuHoursLine } from "../../src/components/Navbar/menuHours.js";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const SHY = "\u00ad";

test("softBrandName: soft hyphens at word parts, visible text unchanged", () => {
  assert.equal(softBrandName("Rimadesio"), `Rima${SHY}desio`);
  assert.equal(softBrandName("ClassiCon"), `Classi${SHY}Con`);
  assert.equal(softBrandName("Eichholtz"), `Eich${SHY}holtz`);
  // CMS spelling is kept, only the positions come from the table
  assert.equal(softBrandName("POLIFORM"), `POLI${SHY}FORM`);
  // unknown long CamelCase name: break before the inner capital
  assert.equal(softBrandName("MaxiForm"), `Maxi${SHY}Form`);
  // short names and names with spaces stay as they are
  assert.equal(softBrandName("Flos"), "Flos");
  assert.equal(softBrandName("Paola Lenti"), "Paola Lenti");
  assert.equal(softBrandName("next125"), "next125");
  for (const n of ["Rimadesio", "ClassiCon", "Minotti", "Tom Dixon"]) assert.equal(softBrandName(n).replaceAll(SHY, ""), n);
  assert.equal(softBrandName(undefined), "");
});

test("menuHoursLine: same time format as footer and house chapter", () => {
  assert.equal(houseTimeRange("de", "10:00", "18:00"), "10–18\u00a0Uhr");
  assert.equal(houseTimeRange("en", "10:00", "18:00"), "10:00–18:00");
  assert.equal(houseTimeRange("fr", "10:00", "14:00"), "10\u00a0h – 14\u00a0h");
  assert.equal(houseTimeRange("it", "10:00", "14:00"), "10–14");
  assert.equal(houseTimeRange("de", "09:30", "18:00"), "9:30–18\u00a0Uhr");
  const de = menuHoursLine("de");
  assert.match(de, /10–18\u00a0Uhr · .*10–14\u00a0Uhr$/);
  assert.doesNotMatch(de, /10:00/);
  // the house messages carry the same strings
  const house = JSON.parse(read("src/messages/de.json")).HomePage.house.times;
  assert.equal(house.tueFri.replace(" ", "\u00a0"), houseTimeRange("de", "10:00", "18:00"));
});

test("200 % text: display sizes capped by the viewport, never at 100 %", () => {
  const css = read("src/app/globals.css");
  assert.match(css, /--text-display-xl: min\(clamp\(3rem, 2rem \+ 4\.44vw, 6rem\), 15vw\)/);
  assert.match(css, /--text-display-m: min\(clamp\(2rem, 1\.75rem \+ 1\.11vw, 2\.75rem\), 10vw\)/);
  // at 320 px the caps equal the clamp minimums (48 / 40 / 32 / 25.6 ≥ 22 px)
  assert.ok(0.15 * 320 >= 48 && 0.125 * 320 >= 40 && 0.1 * 320 >= 32 && 0.08 * 320 >= 22);
});

test("Grids follow container queries in rem (country cards, promises, header, cookie bar)", () => {
  assert.match(read("src/components/Home/DreilaenderService.js"), /max-lg:@min-\[18rem\]:grid-cols-2/);
  assert.match(read("src/components/WhyChooseUsSectionHome/WhyChooseUsSectionHome.js"), /@min-\[18rem\]:grid-cols-2 @min-\[52rem\]:grid-cols-4/);
  const nav = read("src/components/Navbar/navbar.js");
  assert.match(nav, /<div data-header-cta="" className="ml-2 hidden @min-\[30rem\]:block/);
  assert.doesNotMatch(nav, /hidden md:block/);
  // the map labels belong to the picture (user units), not rem
  const map = read("src/components/Home/DreilaenderMap.js");
  assert.doesNotMatch(map, /text-\[\d+(\.\d+)?rem\]/);
});

test("No mid-word breaks: no hyphens:auto / overflow-wrap:anywhere on home titles and the CTA bar", () => {
  assert.doesNotMatch(read("src/components/Reusable/MobileCtaBar.js"), /const ENTRY =[^;]*overflow-wrap:anywhere/);
  assert.match(read("src/components/Reusable/MobileCtaBar.js"), /min\(var\(--text-ui\),6\.5vw\)/);
  for (const f of ["src/components/Home/HouseCafe.js", "src/components/Home/ClosingCta.js", "src/components/Home/DreilaenderService.js"]) {
    assert.doesNotMatch(read(f), /className="[^"]*hyphens-auto/, f);
  }
});

test("Landscape phones: two-column hero, phone section rhythm", () => {
  const css = read("src/components/Home/home.module.css");
  assert.match(css, /\.heroGrid > \.heroStage \{\s*grid-column: 2;/);
  assert.doesNotMatch(css, /max-height: 40svh/);
  assert.match(read("src/components/Home/row.js"), /max-lg:\[@media\(orientation:landscape\)_and_\(max-height:500px\)\]:py-10/);
});
