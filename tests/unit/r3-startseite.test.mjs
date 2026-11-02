// node --test tests/unit/r3-startseite.test.mjs
// R3-startseite: the homepage reads every text from src/messages (namespace
// "HomePage"); the former HOME_COPY fallback is gone. This test keeps that
// safe: every key the homepage components read exists in all four locales.
// R5-i18n: PENDING_COPY (Home/pendingCopy.js) is gone; the round-3 proposal
// Marktresearch/digital/teamleiter/messages-r3-startseite.json is merged and
// checked against the messages.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { expectedFor, itExpected, itExpectedTree } from "./r5-i18n-voi.lib.mjs"; // Runde 4: IT voi (tools/i18n/patches/r4-p2-it-voi.json)

const ROOT = path.resolve(import.meta.dirname, "../..");
const LOCALES = ["de", "en", "fr", "it"];
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const messages = Object.fromEntries(LOCALES.map((l) => [l, JSON.parse(read(`src/messages/${l}.json`)).HomePage || {}]));
const proposal = JSON.parse(read("Marktresearch/digital/teamleiter/messages-r3-startseite.json"));
const pick = (obj, key) => key.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

// Files that call getHomeT(); literal keys are read from their source.
const FILES = [
  "src/components/Home/Hero.js",
  "src/components/Home/Rooms.js",
  "src/components/Home/HouseCafe.js",
  "src/components/Home/BrandList.js",
  "src/components/Home/DreilaenderService.js",
  "src/components/Home/Services.js",
  "src/components/Home/SeoIntro.js",
  "src/components/Home/Journal.js",
  "src/components/Home/ClosingCta.js",
  "src/components/Home/row.js",
  "src/components/ProuductSectionHome/ProuductSectionHome.js",
  "src/components/WhyChooseUsSectionHome/WhyChooseUsSectionHome.js",
];
// Keys built at runtime (template literals in the components).
const DYNAMIC = [
  ...["time", "touch", "plan", "finish"].flatMap((k) => [`host.items.${k}.title`, `host.items.${k}.text`]),
  ...["living", "kitchen", "sleeping", "outdoor"].flatMap((k) => [`rooms.${k}.title`, `rooms.${k}.text`, `rooms.${k}.alt`]),
  ...["tueFri", "sat", "sunMon"].map((k) => `house.days.${k}`),
  ...["tueFri", "sat", "closed"].map((k) => `house.times.${k}`),
  ...["at", "de", "ch", "li"].flatMap((k) => [`region.countries.${k}.name`, `region.countries.${k}.text`]),
  ...["kitchen", "interior", "outdoor", "yacht"].flatMap((k) => [`services.${k}.title`, `services.${k}.text`, `services.${k}.link`]),
];

function homeKeys() {
  const keys = new Set(DYNAMIC);
  for (const f of FILES) {
    const src = read(f);
    // t("a.b") / tHome("a.b") – the HomePage translator in these files;
    // other namespaces in them use tSlider/tNav/t in SeoIntro ("faqTitle").
    for (const m of src.matchAll(/\b(?:t|tHome)\("([a-zA-Z]+\.[a-zA-Z.]+)"/g)) keys.add(m[1]);
  }
  return [...keys].sort();
}

test("homepage reads at least the known sections", () => {
  const keys = homeKeys();
  for (const prefix of ["hero.", "host.", "rooms.", "selection.", "house.", "brands.", "region.", "services.", "journal.", "cta.", "scroll.", "seo."]) {
    assert.ok(keys.some((k) => k.startsWith(prefix)), `no key with ${prefix}`);
  }
});

test("every homepage key exists in all 4 locales (messages only)", () => {
  const missing = [];
  for (const l of LOCALES) {
    for (const k of homeKeys()) {
      const v = pick(messages[l], k);
      if (typeof v !== "string" || !v.trim()) missing.push(`${l}:${k}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("messages-r3-startseite.json is merged: every proposal key equals the messages, pendingCopy.js is gone", () => {
  assert.deepEqual(Object.keys(proposal).filter((k) => !k.startsWith("_")).sort(), [...LOCALES].sort());
  const leafKeys = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? leafKeys(v, `${p}${k}.`) : [`${p}${k}`]));
  // Keys rewritten later on purpose (r7-p1: one CTA word, USP lead and H1,
  // "auf Wunsch" wording of decision Nr. 3) are no longer the R3 proposal.
  const CHANGED = new Set(["hero.title", "hero.lead", "hero.cta", "cta.primary", "cta.eyebrow", "region.countries.at.text"]);
  for (const l of LOCALES) {
    for (const k of leafKeys(proposal[l].HomePage).filter((k) => !CHANGED.has(k))) assert.equal(pick(messages[l], k), expectedFor(l, `HomePage.${k}`, pick(proposal[l].HomePage, k)), `${l}:HomePage.${k}`);
  }
  assert.equal(fs.existsSync(path.join(ROOT, "src/components/Home/pendingCopy.js")), false);
});

test("scroll position keeps its placeholders in every locale", () => {
  for (const l of LOCALES) {
    assert.match(messages[l].scroll.position, /\{current\}.*\{total\}/, l);
  }
});

test("Home/copy.js no longer carries the full HOME_COPY fallback", () => {
  const src = read("src/components/Home/copy.js");
  assert.ok(!/HOME_COPY\s*=/.test(src), "HOME_COPY is back – the messages are complete, see r3-R3-startseite.md");
});

// r7-p1 (seo P2-2, ux P1-7, Inhaber-Entscheidung Nr. 8): the H1 carries the
// core USP instead of "Italienisches Wohnen" (Ezarri is Spanish, ClassiCon
// German). Expectation changed on purpose.
test("H1 line carries the USP (von Hand gezeichnet), no longer 'Italienisches Wohnen'", () => {
  assert.equal(messages.de.hero.title, "Von Hand gezeichnet, am Bodensee.");
  for (const l of LOCALES) assert.doesNotMatch(messages[l].hero.title, /Italien|Italian|italienne|italiano/i, l);
});
