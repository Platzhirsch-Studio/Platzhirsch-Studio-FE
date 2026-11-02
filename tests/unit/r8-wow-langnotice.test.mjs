// tests/unit/r8-wow-langnotice.test.mjs – Runde 3 Fix-Team P6 (R8):
// Sprachhinweis auf rein deutschen Seiten (?lang=en|fr|it), ehrliche Bildzeile
// der Wow-Linie, Ezarri ohne Länderaufzählung und mit einem Beratungsweg,
// Showroom ohne Rundgang-Versprechen solange nur die Testszene da ist,
// Wow-Regler ohne negativen Versatz (WebKit).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NOTICE_LANGS, NOTICE_PAGES, langNotice, noticeLang, APPOINTMENT_HREF } from "../../src/lib/arbeitsweise/langNotice.js";
import MESSAGES from "../../src/lib/wow/messages.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

test("Sprachhinweis: drei Seiten × drei Sprachen, Kernversprechen, Termin-Link in der Besuchersprache", () => {
  assert.deepEqual([...NOTICE_PAGES].sort(), ["3d-ansicht", "arbeitsweise", "ezarri"]);
  const usp = { en: /Harald Menghin draws/, fr: /Harald Menghin dessine/, it: /Harald Menghin disegna/ };
  for (const page of NOTICE_PAGES)
    for (const l of NOTICE_LANGS) {
      const n = langNotice(page, l);
      assert.equal(n.lang, l);
      assert.match(n.core, usp[l], `${page}/${l}`);
      // Welle 2 (bewusst geändert): die Ezarri-Welt gibt es auf Englisch → EN-Hinweis führt dorthin.
      assert.equal(n.href, page === "ezarri" && l === "en" ? "/en/ezarri" : APPOINTMENT_HREF[l]);
      const all = `${n.note} ${n.core} ${n.cta}`;
      assert.ok(!all.includes("!"), `${page}/${l}: kein Ausrufezeichen`);
      assert.doesNotMatch(all, /\b(best|unique|meilleur|unique|migliore|unico)\b/i);
      assert.doesNotMatch(all, /€|CHF|\d+\s?(EUR|Euro)/, "keine Preise");
      assert.doesNotMatch(all, /dealer|revendeur|rivenditore/i, "keine Händler-Aussage im Fließtext");
    }
  assert.equal(langNotice("arbeitsweise", "de"), null);
  assert.equal(langNotice("arbeitsweise", "es"), null);
  assert.equal(noticeLang(["fr"]), "fr");
  assert.equal(noticeLang("xx"), null);
  assert.equal(noticeLang(undefined), null);
});

test("Sprachhinweis eingebunden: Arbeitsweise und Ezarri statisch (Inline-Skript), 3D-Ansicht aus searchParams", () => {
  // R5-fix P2 (bewusst geändert): die Arbeitsweise ist mehrsprachig – kein Sprachhinweis mehr.
  assert.doesNotMatch(read("src/app/[locale]/arbeitsweise/page.js"), /<LangNotice/);
  assert.match(read("src/app/[locale]/ezarri/layout.js"), /<LangNotice page="ezarri" \/>/);
  assert.match(read("src/app/[locale]/3d-ansicht/page.js"), /<LangNotice page="3d-ansicht" lang=\{noticeLang\(sp\?\.lang\)\} \/>/);
  const c = read("src/components/Arbeitsweise/LangNotice.js");
  assert.match(c, /lang=\{n\.lang\}/);
  assert.match(c, /suppressHydrationWarning/);
  // die Arbeitsweise liest keine searchParams (bleibt statisch, eigene Canonical je Sprache)
  assert.doesNotMatch(read("src/app/[locale]/arbeitsweise/page.js"), /searchParams/);
});

// R5-USP (bewusst geändert, gesamtwerk P0-1 / neuland P1-1): keine Verneinung
// („keine Skizze“) mehr direkt an der Hand-H1 – die Linie heißt „Zeichen des
// Studios“; was sie ist, steht einmal im Fuß des USP-Kapitels (tests/e2e/r5-usp-startseite.spec.js).
test("Wow-Bildzeile Phase A ehrlich in allen Sprachen, ohne Harald", () => {
  for (const [l, m] of Object.entries(MESSAGES)) {
    assert.match(m.caption.phaseA, /Zeichen des Studios|studio’s mark|signe du studio|segno dello studio/, l);
    assert.doesNotMatch(m.caption.phaseA, /Skizze|sketch|esquisse|schizzo|Handzeichnung/i, l);
    assert.doesNotMatch(m.caption.phaseA, /Harald|abstrahiert|abstract|astratt/i, l);
    assert.ok(m.caption.phaseA.length <= 66, `${l}: Chip auf dem Handy-Foto bleibt kurz`);
  }
  // R5-fix P2 (gesamtwerk P1-1, bewusst geändert): /arbeitsweise hat keine
  // Liniengrafik mit Bildzeile mehr (Papierblatt, copy.js HERO.sheet).
  assert.doesNotMatch(read("src/lib/arbeitsweise/copy.js"), /lineCaption/);
});

// R5-USP (bewusst geändert, gesamtwerk P0-1): statt der Tafel „Leitsatz des
// Studios“ eine gestaltete Textsektion ohne Platzhalter-Optik.
test("Arbeitsweise: kein Monogramm „HM“, Textsektion statt Tafel und Porträt", () => {
  const page = read("src/components/Arbeitsweise/ArbeitsweisePage.js");
  assert.doesNotMatch(page, /HARALD\.initials/);
  assert.doesNotMatch(page, /data-harald-plaque/);
  assert.match(page, /data-harald-text/);
  const copy = read("src/lib/arbeitsweise/copy.js");
  assert.doesNotMatch(copy, /Leitsatz des Studios/);
  assert.doesNotMatch(copy, /initials: "HM"/);
});

test("Wow-Regler: kein negativer Versatz, Griff in den Rahmen geklemmt (logische Properties, safe area)", () => {
  const css = read("src/components/Wow/Pause.module.css").replace(/\/\*[\s\S]*?\*\//g, "");
  const handle = css.slice(css.indexOf(".handle {"), css.indexOf("}", css.indexOf(".handle {")));
  assert.doesNotMatch(handle, /margin-inline-start:\s*-/);
  assert.match(handle, /inset-inline-start:\s*clamp\(/);
  assert.match(handle, /safe-area-inset-left/);
  // the invitation shows the handle only while the edge is ≥ 28 px inside the frame
  assert.match(css, /@keyframes wow-invite-rail\s*\{\s*0%,\s*16%\s*\{\s*opacity: 0;/);
});

test("Ezarri: keine Länderaufzählung, ein Beratungsweg, H1 vor dem Bild", () => {
  const copy = read("src/lib/ezarri/copy.js");
  assert.doesNotMatch(copy, /Österreich, Deutschland, in die Schweiz und nach Liechtenstein/);
  assert.match(copy, /beratung: "\/beratung\?thema=ezarri"/);
  const hub = read("src/app/[locale]/ezarri/page.js");
  assert.ok(hub.indexOf("<Heading level={1}") < hub.indexOf("<HeroImage"), "H1 steht im DOM vor dem Bild");
  assert.doesNotMatch(hub, /order-1|order-2/);
  assert.doesNotMatch(read("src/app/[locale]/ezarri/kollektionen/[kollektion]/page.js"), /art=beratung/);
});

test("Showroom: ohne Aufnahme keine Rundgang-Versprechen (Kopf, Knopf, Poster, Title)", async () => {
  const { pageCopy } = await import("../../src/components/Showroom/honestCopy.js").catch(() => ({}));
  // honestCopy imports via "@/…" (Next alias) – check the source as data instead when the alias is unavailable
  const src = read("src/components/Showroom/honestCopy.js");
  for (const k of ["h1", "eyebrow", "start", "videoTitel", "posterAlt"]) assert.match(src, new RegExp(`${k}:`));
  const de = src.slice(src.indexOf("de: {"), src.indexOf("en: {"));
  assert.doesNotMatch(de, /Rundgang/);
  assert.match(de, /synthetische Testszene/);
  if (pageCopy) assert.equal(pageCopy("de", true).start, "Testszene starten");
  for (const f of ["src/components/Showroom/ShowroomPage.js", "src/components/Showroom/ShowroomStage.js"]) assert.match(read(f), /pageCopy\(locale, tour\.test\)/, f);
});
