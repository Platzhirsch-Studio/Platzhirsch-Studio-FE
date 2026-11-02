// node --test tests/unit/stilfinder-pdflead-handoff.test.mjs
// pdf-lead fix-01: PDF (Link + QR), Mail und Formular übergeben das Stilprofil
// an /beratung bzw. /termin nach demselben Vertrag wie die Ergebnisseite
// (planTerminHref: planer, produkt, plan). Vorher: ?stil= allein, von keiner Seite gelesen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync } from "node:fs";

// profiles.js imports pictures (next/image): replaced by placeholders, like
// tests/unit/stilfinder-pdf.test.mjs.
register(
  "data:text/javascript," +
    encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  try { return await next(spec, ctx); }
  catch (e) { if (spec.startsWith(".") && !spec.split("/").pop().includes(".")) return next(spec + ".js", ctx); throw e; }
}
export async function load(url, ctx, next) {
  if ([".jpg", ".jpeg", ".png", ".webp", ".avif"].some((x) => url.toLowerCase().endsWith(x)))
    return { format: "module", shortCircuit: true, source: "export default { src: '/x.jpg', width: 10, height: 10, blurDataURL: '' };" };
  return next(url, ctx);
}`)
);

const src = (p) => readFileSync(new URL(`../../src/${p}`, import.meta.url), "utf8");
const { PROFILES } = await import("../../src/components/Labs/Stilfinder/profiles.js");
const { buildMoodboardPdf } = await import("../../src/lib/stilfinder/build.js");
const { buildMoodboardMail } = await import("../../src/lib/stilfinder/mail.js");
const { terminUrl, resultUrl } = await import("../../src/lib/stilfinder/config.js");
const { attachmentsOf, beratungContext } = await import("../../src/lib/forms/beratungContext.js");

test("terminUrl: planer, produkt und Ergebnis-Link – lesbar für /beratung und /termin", () => {
  const p = PROFILES.salon;
  const u = new URL(terminUrl(p, { code: "0123x" }));
  assert.equal(u.origin + u.pathname, "https://platzhirsch.studio/de/beratung");
  assert.equal(u.searchParams.get("planer"), "stil-finder");
  assert.equal(u.searchParams.get("produkt"), `Stil-Finder: ${p.name}`);
  assert.equal(u.searchParams.get("plan"), resultUrl(p, "0123x"));
  assert.equal(attachmentsOf(u.searchParams).plan, `https://platzhirsch.studio/de/stil-finder/ergebnis/${p.slug}?a=0123x`);
  assert.ok(beratungContext(u.searchParams).lines.length > 0, "Beratung schreibt eine Stil-Finder-Zeile");
  assert.equal(new URL(terminUrl(p, { calendar: true })).pathname, "/de/termin");
  assert.equal(resultUrl(p, "<x>"), `https://platzhirsch.studio/de/stil-finder/ergebnis/${p.slug}`, "ungültiger Code fällt weg");
});

test("Mail: derselbe Termin-Link und das Ergebnis online (barrierearme Fassung)", () => {
  const p = PROFILES.see;
  const m = buildMoodboardMail({ profile: p, name: null, labs: true, pages: 33, code: "0123x" });
  assert.ok(m.text.includes(terminUrl(p, { code: "0123x" })));
  assert.ok(m.text.includes(resultUrl(p, "0123x")));
  assert.ok(m.html.includes(resultUrl(p, "0123x")));
  assert.doesNotMatch(m.text, /\?stil=[a-z-]+\s/, "kein nackter ?stil=-Link mehr");
});

test("PDF und Formular: Termin-Link mit Stil-Kontext", { timeout: 60_000 }, async () => {
  const out = await buildMoodboardPdf({ profile: PROFILES.klar, roomRows: {}, loadImage: null, minImages: 0, code: "0123x" });
  assert.ok(out.buffer.toString("latin1").includes("planer=stil-finder"), "Link-Annotation im PDF");
  const form = src("components/Labs/Stilfinder/MoodboardPdfForm.js");
  assert.match(form, /planTerminHref\(/);
  assert.doesNotMatch(form, /\/de\/beratung\?stil=/);
});
