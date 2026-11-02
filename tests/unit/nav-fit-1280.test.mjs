// Inhaber 01.11.2026 (bewusst geändert gegenüber der Abschlussprüfung vom selben Tag):
// Die Hauptnavigation steht ab 1280 px in allen vier Sprachen in EINER Zeile. Statt
// eines festen Umschaltpunkts (usesLongNav: FR/IT und 9 Punkte erst ab 1440 px)
// misst die Kopfzeile die Liste (navFit.js) und wählt die großzügigste Dichte, die
// passt; nur wenn keine passt (WCAG-1.4.12-Textabstände, großer Text) übernimmt der
// Menü-Knopf. Gemessen 01.11.2026 bei 1280 px: DE Stufe 1, EN 1, FR 3, IT 3.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { NAV_LEVELS, availableWidth, chooseNavLevel, fitNav } from "../../src/components/Navbar/navFit.js";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

test("chooseNavLevel: großzügigste passende Stufe, sonst Menü", () => {
  assert.deepEqual(NAV_LEVELS, ["0", "1", "2", "3", "4"]);
  // QM r2: FR/IT 1280 px Stufe 3 = 14 px mit 6 px Polster (vorher 4 px = jetzt Stufe 4).
  assert.equal(chooseNavLevel([701, 629, 596, 564, 528], 576), "3");
  assert.equal(chooseNavLevel([701, 629, 596, 564, 528], 540), "4");
  // DE 1280 px (gemessen): Stufe 0 = 668 px, Stufe 1 = 596 px in 604 px Platz.
  assert.equal(chooseNavLevel([668, 596], 604), "1");
  assert.equal(chooseNavLevel([668], 764), "0");
  // FR 1280 px: erst Stufe 3 (528 px) passt in 560 px.
  assert.equal(chooseNavLevel([701, 629, 590, 528], 560), "3");
  // FR 1280 px mit Textabständen: nichts passt → Menü-Knopf.
  assert.equal(chooseNavLevel([900, 800, 780, 745], 449), "menu");
  assert.equal(chooseNavLevel([600], 600), "0"); // genau passend zählt
});

test("availableWidth: Menü-Knopf zählt nur, solange er sichtbar ist (kein Pendeln)", () => {
  assert.equal(availableWidth(560, 0, 8), 560);
  assert.equal(availableWidth(449, 92, 0), 541);
  assert.equal(availableWidth(449, 92, 8), 549);
});

function fakeHeader({ slotWidth, needs, burgerWidth = 0, display = "flex" }) {
  const header = {
    dataset: {},
    events: [],
    dispatchEvent(e) {
      this.events.push(e.detail);
    },
  };
  const list = {
    get scrollWidth() {
      return needs[header.dataset.nav] ?? 99999;
    },
  };
  const slot = { clientWidth: slotWidth, querySelector: () => list, display };
  const burger = burgerWidth ? { getBoundingClientRect: () => ({ width: burgerWidth }), parentElement: { columnGap: "0px" } } : null;
  header.querySelector = (sel) => (sel === "[data-nav-slot]" ? slot : sel === "[data-nav-burger]" ? burger : null);
  return header;
}

test("fitNav setzt data-nav nach Messung und meldet Wechsel", () => {
  globalThis.getComputedStyle = (el) => ({ display: el.display || "block", columnGap: el.columnGap || "0px" });
  globalThis.CustomEvent ??= class extends Event {
    constructor(type, init) {
      super(type);
      this.detail = init?.detail;
    }
  };
  const de = fakeHeader({ slotWidth: 604, needs: { 0: 668, 1: 596, 2: 560, 3: 528 } });
  assert.equal(fitNav(de), "1");
  assert.equal(de.dataset.nav, "1");
  assert.deepEqual(de.events, ["1"]);
  assert.equal(fitNav(de), "1");
  assert.deepEqual(de.events, ["1"], "kein Ereignis ohne Wechsel");

  // Menü-Modus: Knopfbreite zählt zum Platz – Rückkehr zur Leiste, sobald sie passt.
  const fr = fakeHeader({ slotWidth: 449, burgerWidth: 92, needs: { 0: 700, 1: 640, 2: 600, 3: 530 } });
  fr.dataset.nav = "menu";
  assert.equal(fitNav(fr), "3");
  const frSpacing = fakeHeader({ slotWidth: 449, burgerWidth: 92, needs: { 0: 900, 1: 820, 2: 790, 3: 745 } });
  frSpacing.dataset.nav = "menu";
  assert.equal(fitNav(frSpacing), "menu");

  // Unter 1280 px ist der Platz display:none → nichts messen.
  const phone = fakeHeader({ slotWidth: 0, needs: {}, display: "none" });
  assert.equal(fitNav(phone), null);
  assert.equal(phone.dataset.nav, undefined);
});

test("Kopfzeile: Leiste ab 1280 px für alle Sprachen, Umschalten nur über die Messung", () => {
  const nav = read("src/components/Navbar/navbar.js");
  assert.doesNotMatch(nav, /usesLongNav|NAV_FIT_1280|min-\[1440px\]:flex/);
  assert.match(nav, /data-nav-slot="" className=\{cx\(s\.navSlot, "hidden h-full min-w-0 flex-1 justify-center xl:ml-2 xl:flex"\)\}/); // QM r3: 8 px mehr Luft zum Logo
  assert.match(nav, /<HeaderFrame navStart=\{navStart\(locale\)\}/);
  assert.match(nav, /burgerClassName=\{s\.burger\} dialogClassName=\{s\.menuDialog\}/);
  const frame = read("src/components/Navbar/HeaderFrame.js");
  assert.match(frame, /new ResizeObserver\(schedule\)/);
  assert.match(frame, /if \(header\.querySelector\("dialog\[open\]"\)\) return;/);
  const css = read("src/components/Navbar/Navbar.module.css");
  assert.match(css, /\.header\[data-nav="menu"\] \.navSlot \{\s*visibility: hidden;/);
  assert.match(css, /\.header:not\(\[data-nav="menu"\]\) \.burger,\s*\.header:not\(\[data-nav="menu"\]\) \.menuDialog \{\s*display: none;/);
  const menu = read("src/components/Navbar/MobileMenu.js");
  assert.match(menu, /data-nav-burger=""/);
  assert.doesNotMatch(menu, /min-\[1440px\]:hidden/);
});
