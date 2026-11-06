// tests/unit/r5-portal-labs.test.mjs — R5-portal-labs: t()-Leser mit Fallback,
// zod ohne eval (CSP), LazyMotion ohne unsichtbaren Startzustand, Lupe Lochau/Bregenz.
// Run: node --test tests/unit/r5-portal-labs.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createTranslator } from "next-intl";
import { tx } from "../../src/lib/portal/i18n.js";
import { netErrorText, netTexts, LabsTimeoutError, OFFLINE_TEXT, TIMEOUT_TEXT } from "../../src/components/Labs/net.js";
import { PORTAL_NAV, PORTAL_CTA, navLabel } from "../../src/components/Portal/Core/navItems.js";
import { HOME_XY, INSET, PLACES, project, LOCHAU } from "../../src/components/Labs/Dreilaender/geo.js";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const json = (p) => JSON.parse(read(p));

// Translator wie next-intl ihn liefert (mit .has), für eine Locale und Messages.
const translator = (locale, messages) => createTranslator({ locale, messages, onError: () => {} });

const proposal = json("Marktresearch/digital/teamleiter/messages-r5-portal.json");
const r4 = json("Marktresearch/digital/teamleiter/messages-r4-portal.json");
const LOCALES = ["de", "en", "fr", "it"];

test("tx: ohne Schlüssel bleibt der bisherige DE-Text (vor der Übernahme)", () => {
  const t = translator("en", { Other: { x: "y" } });
  assert.equal(tx(t, "Portal.nav.overview", "Übersicht"), "Übersicht");
  assert.equal(tx(t, "Upload.problem.mail", "E-Mail an {email}", { email: "a@b.c" }), "E-Mail an a@b.c");
  // Auch ohne Übersetzer (z. B. Aufruf außerhalb des Providers) nie ein Fehler.
  assert.equal(tx(undefined, "Portal.nav.more", "Mehr"), "Mehr");
});

// Nav-Einträge, die nach dem R5-Vorschlag dazukamen (Kundenkarte 04.11.2026: key
// "card"), stehen nur in src/messages/*.json – dort werden sie geprüft.
const inProposal = (item) => item.key in proposal.de.Portal.nav;
const live = Object.fromEntries(LOCALES.map((l) => [l, json(`src/messages/${l}.json`)]));

test("tx: mit Schlüssel kommt der Text aus den Messages (nach der Übernahme), alle 4 Sprachen", () => {
  for (const l of LOCALES) {
    const t = translator(l, proposal[l]);
    assert.equal(tx(t, "Portal.nav.overview", "Übersicht"), proposal[l].Portal.nav.overview);
    assert.equal(tx(t, "Upload.problem.mail", "E-Mail an {email}", { email: "info@x.at" }).includes("info@x.at"), true);
    for (const item of [...PORTAL_NAV, PORTAL_CTA].filter(inProposal)) {
      assert.equal(navLabel(t, item), proposal[l].Portal.nav[item.key], `${l} ${item.key}`);
    }
    const tl = translator(l, live[l]);
    for (const item of [...PORTAL_NAV, PORTAL_CTA].filter((i) => !inProposal(i))) {
      assert.equal(navLabel(tl, item), live[l].Portal.nav[item.key], `${l} ${item.key} (src/messages)`);
      assert.ok(live[l].Portal.nav[item.key], `${l} ${item.key} fehlt in src/messages`);
    }
  }
});

test("DE-Vorschlag = bisheriger DE-Text im Code (Übernahme ändert auf Deutsch nichts)", () => {
  const de = proposal.de;
  for (const item of [...PORTAL_NAV, PORTAL_CTA]) assert.equal((inProposal(item) ? de : live.de).Portal.nav[item.key], item.label, item.key);
  const frame = read("src/components/Upload/UploadFrame.js");
  for (const k of ["expired", "invalid"]) {
    assert.ok(frame.includes(de.Upload.problem[k].title), k);
    assert.ok(frame.includes(de.Upload.problem[k].text), k);
  }
  const page = read("src/app/[locale]/upload/[token]/page.js");
  for (const v of Object.values(de.Upload.page)) assert.ok(page.includes(v), v);
});

test("messages-r5-portal: 4 Sprachen mit identischer Schlüsselmenge, IT in tu-Form", () => {
  const keys = (o, p = "") =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${p}${k}.`) : [`${p}${k}`])).sort();
  const de = keys(proposal.de);
  for (const l of LOCALES) assert.deepEqual(keys(proposal[l]), de, l);
  const it = JSON.stringify(proposal.it);
  assert.doesNotMatch(it, /\b(Lei|Suo|Sua|voi|vostr)\b/);
});

test("Labs.net: netTexts liest die übernommenen R4-Schlüssel, ohne Schlüssel DE", () => {
  const none = netTexts(translator("de", {}));
  assert.deepEqual(none, { timeout: TIMEOUT_TEXT, offline: OFFLINE_TEXT });
  const en = netTexts(translator("en", r4.en));
  assert.equal(en.offline, r4.en.Labs.net.offline);
  assert.equal(netErrorText(new LabsTimeoutError(), "x", en), r4.en.Labs.net.timeout);
  assert.equal(netErrorText(new TypeError("Failed to fetch"), "x", en), r4.en.Labs.net.offline);
  // Alte Aufrufe ohne texts: unverändert deutsch.
  assert.equal(netErrorText(new LabsTimeoutError(), "x"), TIMEOUT_TEXT);
  assert.equal(netErrorText(new SyntaxError("bad"), "Fallback"), "Fallback");
});

test("CSP: Labs-zod läuft jitless (kein new Function), Schemas prüfen weiter", async () => {
  const z = await import("../../src/components/Labs/zod.js");
  const core = await import("zod/v4/core");
  assert.equal(core.globalConfig.jitless, true);
  const schema = z.object({ a: z.number(), b: z.string() });
  assert.deepEqual(schema.parse({ a: 1, b: "x" }), { a: 1, b: "x" });
  assert.equal(schema.safeParse({ a: "1" }).success, false);
  // Kein eval/new Function in eigenem Labs-Code.
  const files = fs.readdirSync(new URL("../../src/components/Labs/", import.meta.url), { recursive: true }).filter((f) => f.endsWith(".js"));
  for (const f of files) {
    const src = read(`src/components/Labs/${f.replaceAll("\\", "/")}`).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ""); // ohne Kommentare
    assert.doesNotMatch(src, /\bnew Function\s*\(|[^.\w]eval\s*\(/, f);
  }
});

test("LazyMotion: kein motion.* und kein motion/react-animate mehr in Labs, Startzustand nur nach Features", () => {
  for (const f of [
    "src/components/Labs/Dreilaender/DreilaenderClient.js",
    "src/components/Labs/Dreilaender/PriceCalculator.js",
    "src/components/Labs/Dreilaender/AnimatedNumber.js",
    "src/components/Labs/Stilfinder/StilfinderQuiz.js",
  ]) {
    const src = read(f);
    assert.doesNotMatch(src, /<motion\.|from "motion\/react"/, f);
    // Jede Eingangsanimation mit unsichtbarem Startwert hängt an motionReady/calm.
    for (const m of src.matchAll(/initial=\{([^}]*opacity: 0[^}]*)\}/g)) {
      assert.match(m[1], /motionReady|calm|reduce/, `${f}: ${m[0]}`);
    }
  }
  const lazy = read("src/components/Labs/motion.js");
  assert.match(lazy, /<LazyMotion features=\{load\} strict>/);
  assert.match(lazy, /import\("\.\/motionFeatures\/max\.js"\)/);
  assert.match(lazy, /\.catch\(/);
  // Kein Barrel-Import von motion/react (hält den ganzen framer-motion-Namensraum fest).
  assert.doesNotMatch(lazy.replace(/^\s*\/\/.*$/gm, ""), /from "motion\/react"/);
  assert.match(lazy, /from "motion\/react-m"/);
  assert.match(read("src/components/Labs/Stilfinder/StilfinderQuiz.js"), /<LabsMotion features="max">/);
  assert.match(read("src/components/Labs/Dreilaender/DreilaenderClient.js"), /<LabsMotion features="animation">/);
});

test("Lupe Lochau/Bregenz: nur echte Koordinaten, vergrößert um den gemeinsamen Mittelpunkt", () => {
  const b = PLACES.find((p) => p.id === "bregenz");
  // Geodaten unverändert.
  assert.deepEqual(HOME_XY, project(LOCHAU.lat, LOCHAU.lon));
  assert.deepEqual(b.xy, project(47.503, 9.747));
  // Abstand in der Lupe = Abstand auf der Karte × Zoom (Rundung 0,1).
  const d0 = Math.hypot(b.xy[0] - HOME_XY[0], b.xy[1] - HOME_XY[1]);
  const d1 = Math.hypot(INSET.bregenz[0] - INSET.home[0], INSET.bregenz[1] - INSET.home[1]);
  assert.ok(Math.abs(d1 - d0 * INSET.zoom) < 0.5, `${d1} vs ${d0 * INSET.zoom}`);
  // Beide Punkte liegen in der Lupe und mit ≥ 60 Einheiten deutlich getrennt.
  for (const [x, y] of [INSET.home, INSET.bregenz]) assert.ok(Math.hypot(x - INSET.cx, y - INSET.cy) < INSET.r - 8);
  assert.ok(d1 >= 60);
  // Lupe im freien Feld: kein Ort und kein Callout darunter.
  for (const p of PLACES) assert.ok(Math.hypot(p.xy[0] - INSET.cx, p.xy[1] - INSET.cy) > INSET.r + 20, p.id);
  // Für Zeiger durchlässig, für Screenreader verborgen.
  const map = read("src/components/Labs/Dreilaender/DreilaenderMap.js");
  assert.match(map, /<g aria-hidden="true" className=\{s\.inset\}/);
  assert.match(read("src/components/Labs/Dreilaender/dreilaender.module.css"), /\.inset \{\s*pointer-events: none;/);
});

// QM P2-1: Labs/motion.js importiert `framer-motion` direkt (schmaler Einstieg
// für LazyMotion), deklariert ist aber nur `motion`. Dieser Wächter schlägt an,
// sobald `framer-motion` nicht mehr flach installiert ist oder von der Version
// abweicht, die `motion` selbst mitbringt (zwei Instanzen = getrennter
// LazyContext, `m.*` würde nie animieren). Dauerhafte Lösung: `framer-motion`
// exakt pinnen (package.json, Installationsrunde R5-release).
test("framer-motion: flach installiert und identisch mit der Version von motion", () => {
  const lock = json("package-lock.json").packages;
  const motionPkg = lock["node_modules/motion"];
  const fm = lock["node_modules/framer-motion"];
  assert.ok(motionPkg, "motion fehlt im Lockfile");
  assert.ok(fm, "framer-motion ist nicht flach installiert (Labs/motion.js bricht)");
  assert.equal(lock["node_modules/motion/node_modules/framer-motion"], undefined, "zweite framer-motion-Instanz unter motion");
  assert.equal(fm.version, motionPkg.version, "framer-motion und motion laufen auseinander");
  const installed = JSON.parse(fs.readFileSync(new URL("../../node_modules/framer-motion/package.json", import.meta.url), "utf8"));
  assert.equal(installed.version, fm.version, "node_modules weicht vom Lockfile ab");
  const decl = json("package.json");
  const declared = { ...decl.dependencies, ...decl.devDependencies };
  if (declared["framer-motion"]) assert.equal(declared["framer-motion"], fm.version, "framer-motion bitte exakt pinnen");
});

test("Portal/Upload: keine statische DE-Metadata, EN/FR/IT bekommen den 404-Titel (WCAG 2.4.2)", () => {
  const dirs = ["src/app/[locale]/portal", "src/app/[locale]/upload"];
  const files = dirs.flatMap((d) =>
    fs
      .readdirSync(new URL(`../../${d}`, import.meta.url), { recursive: true })
      .filter((p) => /(page|layout)\.js$/.test(p))
      .map((p) => `${d}/${p.split("\\").join("/")}`),
  );
  assert.ok(files.length >= 17, `zu wenige Dateien: ${files.length}`);
  for (const f of files) {
    const src = read(f);
    assert.doesNotMatch(src, /export const metadata/, f);
    if (/generateMetadata/.test(src)) assert.match(src, /generateMetadata = portalMetadata\(/, f);
  }
  const lib = read("src/lib/portal/metadata.js");
  assert.match(lib, /locale === "de" \? meta : notFoundMetadata\(locale\)/);
  assert.match(lib, /namespace: "error404"/);
});
