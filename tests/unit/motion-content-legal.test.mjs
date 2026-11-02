// Motion refinements, area content-legal (Qualität 01.11.2026): only the
// shared motion tokens/classes from globals.css, transform/opacity only,
// nothing on H1/LCP, calm mode respected.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (f) => readFileSync(new URL(`../../${f}`, import.meta.url), "utf8");

test("Ratgeber: article lists reveal as a group, CTA lifts in, H1 stays still", () => {
  const hub = read("src/components/Ratgeber/RatgeberHub.js");
  assert.match(hub, /<ul className="reveal-group [^"]*\[--reveal-y:12px\]/);
  assert.match(hub, /className="reveal mx-auto max-w-page/);
  assert.doesNotMatch(hub, /<h1[^>]*\breveal/);
  const parts = read("src/components/Ratgeber/RatgeberParts.js");
  assert.match(parts, /primaryButtonClass =\s*"ph-press /);
  const art = read("src/components/Ratgeber/RatgeberArticle.js");
  assert.match(art, /ratgeber-quellen" className="reveal /);
  assert.doesNotMatch(art, /ratgeber-antwort"[^>]*reveal/, "the short answer (above the fold) never moves");
});

test("News: lists reveal as a group, 'show more' cards arrive softly", () => {
  const more = read("src/components/News/NewsMore.js");
  assert.match(more, /"reveal-group", className/);
  assert.match(more, /i >= step \? "ph-arrive"/);
  const item = read("src/components/NewsItem/newsitem.js");
  // QM content-legal r3: "Weitere Beiträge" builds its class list (two or three columns).
  assert.equal((item.match(/className={?[`"]reveal-group /g) || []).length, 2);
  assert.doesNotMatch(item, /className="reveal flex/, "no double motion (group + item)");
});

test("Beratung wizard: progress fills by scaleX, steps after the first settle in", () => {
  const src = read("src/components/BeratungClient/BeratungClient.js");
  assert.match(src, /origin-left bg-ink transition-transform duration-\(--duration-ui\) ease-quiet motion-reduce:transition-none/);
  assert.match(src, /i < step \? "scale-x-100" : "scale-x-0"/);
  assert.match(src, /key=\{step\} className=\{step > 1 \? "ph-arrive" : undefined\}/, "step 1 at load does not fade");
  assert.equal((src.match(/className="ph-arrive space-y-6"/g) || []).length, 2);
});

test("Termin: steps 2/3 and picked times arrive, loading cells shimmer, calm alias honoured", () => {
  const w = read("src/components/Termin/BookingWizard.js");
  assert.match(w, /className="ph-arrive mt-6"/);
  assert.match(w, /className="ph-arrive relative mt-6"/);
  const p = read("src/components/Termin/SlotPicker.js");
  assert.match(p, /"ph-skeleton border border-transparent/);
  assert.match(p, /key=\{selectedDay\.date\}[^>]*className="ph-arrive /);
  assert.match(p, /\["reduced", "calm"\]\.includes\(document\.documentElement\.dataset\.motion\)/);
});

test("Success states: tick draws and box arrives (newsletter, Adventsabend, Wunschliste)", () => {
  const nl = read("src/components/Newsletter/newsletter.js");
  assert.match(nl, /<span className="ph-arrive flex items-start gap-2">\s*<SuccessIcon/);
  assert.match(nl, /role="status"/, "live region stays mounted");
  const aa = read("src/app/[locale]/adventsabend/AdventsabendForm.js");
  assert.match(aa, /className="ph-tick mt-0\.5 flex-none"/);
  assert.match(aa, /className="ph-arrive border-t-2 border-success/);
  assert.match(read("src/components/Wunschliste/SharePanel.js"), /<span key=\{status\} className="ph-arrive">/);
});

test("Portal: sheet rises on open (transform), quick links lift, calm stops both", () => {
  const nav = read("src/components/Portal/Core/PortalNav.js");
  assert.match(nav, /transition-transform duration-\(--duration-ui\) ease-quiet [^"]*motion-reduce:transition-none starting:open:translate-y-full/);
  const dash = read("src/components/Portal/Core/Dashboard.js");
  assert.match(dash, /ph-lift group flex/);
});

test("globals.css: the classes used here stand still in calm mode", () => {
  const css = read("src/app/globals.css");
  for (const sel of [/:root:is\(\[data-motion="reduced"\], \[data-motion="calm"\]\) :is\(\.reveal, \.ph-reveal\)/, /:root:is\(\[data-motion="reduced"\], \[data-motion="calm"\]\) :is\(\.ph-arrive, \.ph-arrive-card, \.ph-tick > path\)/, /:root:not\(\[data-motion="reduced"\], \[data-motion="calm"\]\) \.ph-skeleton/, /:root:not\(\[data-motion="reduced"\], \[data-motion="calm"\]\) \.ph-lift/]) {
    assert.match(css, sel);
  }
});
