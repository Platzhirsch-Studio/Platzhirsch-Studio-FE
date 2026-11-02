// Optik shell-home (01.11.2026): header, services grid, footer columns,
// cookie bar, hours row – source checks for the visual fixes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

// Bewusst geändert (Inhaber 01.11.2026): FR/IT nicht mehr erst ab 1440 px – die
// Leiste steht ab 1280 px in allen Sprachen, die Dichte wird gemessen
// (navFit.js, tests/unit/nav-fit-1280.test.mjs). LONG_NAV ist nur noch die
// Server-Vorgabe vor der ersten Messung.
test("FR/IT: Leiste ab 1280 px, Server-Vorgabe der Dichte „long“", () => {
  const nav = read("src/components/Navbar/navbar.js");
  assert.match(nav, /export const LONG_NAV = new Set\(\["fr", "it"\]\)/);
  assert.match(nav, /return LONG_NAV\.has\(locale\) \? "long" : "short";/);
  // QM shell-home r5: tablet gaps by the header row container (rem) instead of md.
  assert.match(nav, /"ml-auto flex shrink-0 items-center @min-\[42rem\]:gap-2 xl:ml-0 xl:gap-0"/);
  assert.match(nav, /<div className="hidden xl:block">\s*<LanguageSwitcher/);
  const menu = read("src/components/Navbar/MobileMenu.js");
  assert.match(menu, /window\.matchMedia\("\(min-width: 1280px\)"\)/);
});

test("Mega-Menü: umbrochene Links halten den Zeilenrhythmus", () => {
  assert.match(read("src/components/Navbar/megaPanelHtml.js"), /min-h-11 items-center py-2\.5 text-text/);
});

test("Leistungen: zweite lg-Reihe auf den Spalten der ersten (2 + 4 von 6)", () => {
  const s = read("src/components/Home/Services.js");
  // QM shell-home r5: same 2 + 4 of 6, by the container in rem (56rem) instead of lg.
  assert.match(s, /sm:@min-\[56rem\]:col-span-2 sm:@min-\[56rem\]:last:col-span-4"/);
  assert.doesNotMatch(s, /nth-child\(n\+4\)\]:col-span-3/);
});

// Bewusst geändert (Abschlussprüfung 01.11.2026): statt gleich breiter Spalten
// (minmax(max-content, …) lief mit WCAG-1.4.12-Abständen bei 1280 px quer)
// gleich große Abstände – auto-Spalten mit space-between.
test("Footer: Linkspalten ab xl im festen Raster, schrumpfbar (kein Querscroll)", () => {
  const footer = read("src/components/Reusable/Footer.js");
  // QM shell-home 01.11.2026: minmax(0,auto) – schrumpft auch bei 200 % Text (WCAG 1.4.4).
  // QM r2: inhaltsbreite Spuren ergaben springende Abstände (100–240 px) → feste fr-Spuren.
  // QM r3: dieselben Spuren, jetzt per Container-Query in rem (@min-[68rem]) statt xl – bei 200 % Text 2 Spalten.
  assert.match(footer, /@min-\[68rem\]:grid-cols-\[minmax\(0,1\.4fr\)_repeat\(4,minmax\(0,1fr\)\)\]/);
  assert.match(footer, /<nav aria-label=\{c\("footer\.nav"\)\} className="@container">/);
  assert.doesNotMatch(footer, /grid-cols-\[repeat\(5,minmax\(0,auto\)\)\]/);
  assert.doesNotMatch(footer, /<dt className="whitespace-nowrap">/);
  assert.doesNotMatch(footer, /xl:grid-cols-\[minmax\(max-content/);
});

// QM shell-home r5: side by side from 64rem of the bar (container query in rem) instead of lg.
test("Cookie-Leiste: Text und Buttons erst ab 64rem Leistenbreite nebeneinander", () => {
  const c = read("src/components/Cookies/cookiecomponent.js");
  assert.match(c, /md:gap-4 md:py-4 @min-\[64rem\]:flex-row @min-\[64rem\]:items-center @min-\[64rem\]:gap-grid/);
  assert.match(c, /<div className="min-w-0 @min-\[64rem\]:flex-1">/);
});

// QM shell-home r5: two-track grid – the time stays right on the first line.
test("Öffnungszeiten: Zeit bleibt rechtsbündig in eigener Spur", () => {
  const house = read("src/components/Home/HouseCafe.js");
  assert.match(house, /@min-\[16rem\]:grid-cols-\[minmax\(0,1fr\)_auto\]/);
  assert.match(house, /<span className="@min-\[16rem\]:text-right">\{t\(`house\.times/);
});
