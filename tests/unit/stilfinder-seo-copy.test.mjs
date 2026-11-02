// Stil-Finder – indexierbarer Server-Text + FAQPage (mobil-code-seo, fix-03).
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync } from "node:fs";

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

const { profileOverview, stilfinderFaq } = await import("../../src/lib/stilfinder/seoCopy.js");
const { PROFILE_ORDER, PROFILES } = await import("../../src/components/Labs/Stilfinder/profiles.js");
const { QUESTIONS } = await import("../../src/components/Labs/Stilfinder/questions.js");
const { faqPageSchema } = await import("../../src/lib/seo/faqSchema.js");
const { fitTitle, clampDescription } = await import("../../src/lib/seo/pageMetadata.js");
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

test("fünf Profile mit Link aufs Profil ohne Antwort-Code", () => {
  const list = profileOverview();
  assert.deepEqual(list.map((p) => p.key), PROFILE_ORDER);
  for (const p of list) {
    assert.equal(p.href, `/de/stil-finder/ergebnis/${PROFILES[p.key].slug}`);
    assert.equal(p.tones.length, 5);
  }
});

test("FAQ folgt dem Code: Fragenzahl, Themen, Profilnamen, keine Platzhalter", () => {
  const faq = stilfinderFaq();
  assert.equal(faq[0].q, "Welcher Einrichtungsstil passt zu mir?");
  assert.match(faq[0].a, new RegExp(`^Das zeigt der Stil-Finder in rund zwei Minuten: ${QUESTIONS.filter((q) => !q.optional).length} Bildfragen`));
  for (const k of PROFILE_ORDER) assert.ok(faq[0].a.includes(PROFILES[k].name), k);
  assert.match(faq[0].a, /Raum, Material, Farbe, Form, Leben und Licht, optional auch zum Umfang Ihres Vorhabens./);
  for (const it of faq) {
    assert.ok(it.q.endsWith("?"), it.q);
    assert.doesNotMatch(it.a, /\{|\}|undefined|null/, it.q);
  }
  // Datenschutz-Antwort deckt sich mit der Einleitung des Quiz
  // Mehrsprachigkeit (01.11.2026): Einleitungstext in intl/de.js (Master)
  assert.match(read("src/lib/stilfinder/intl/de.js"), /wir speichern nichts auf unseren Servern/);
  assert.match(faq[2].a, /nicht auf unseren Servern/);
});

test("FAQPage-JSON-LD aus denselben Einträgen", () => {
  const faq = stilfinderFaq();
  const s = faqPageSchema("https://platzhirsch.studio/de/stil-finder", "de", faq);
  assert.equal(s["@type"], "FAQPage");
  assert.deepEqual(s.mainEntity.map((q) => q.name), faq.map((f) => f.q));
});

test("Seite bindet den Server-Teil ein; Title/Description passen ungekürzt", () => {
  const page = read("src/app/[locale]/stil-finder/page.js");
  // Mehrsprachigkeit (01.11.2026): Title/Description je Sprache in intl/<locale>.js (PAGE.meta).
  assert.match(page, /<StilfinderSeoInfo locale=\{locale\} \/>/);
  const de = read("src/lib/stilfinder/intl/de.js");
  const title = `${de.match(/title: "([^"]+\?)",/)[1]} | Platzhirsch`;
  const description = de.match(/description: "([^"]+)",/)[1];
  assert.match(title, /Einrichtungsstil/);
  assert.equal(fitTitle(title), title, "Title wird nicht gekürzt");
  assert.equal(clampDescription(description), description, "Description wird nicht gekürzt");
  const info = read("src/components/Labs/Stilfinder/SeoInfo.js");
  assert.doesNotMatch(info, /"use client"/);
  assert.match(info, /faqPageSchema\(/);
});
