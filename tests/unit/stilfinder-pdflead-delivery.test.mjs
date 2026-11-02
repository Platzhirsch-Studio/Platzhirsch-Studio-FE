// node --test tests/unit/stilfinder-pdflead-delivery.test.mjs
// pdf-lead fix-02: PDF, Mail und Formular versprechen nur, was passiert.
//  - Testpostfach-Satz im PDF nur bei Postausgang (war an den Bildrechte-Schalter gekoppelt)
//  - kein Versprechen einer Bestätigungsmail: der Stil-Finder startet keine Newsletter-Anmeldung
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
const { buildMoodboardMail, NEWSLETTER_URL } = await import("../../src/lib/stilfinder/mail.js");

// react-pdf compresses the content streams, so the texts are read from the
// element tree of buildDocument (the Notes page is the second last page).
const { buildDocument } = await import("../../src/lib/stilfinder/document.js");

function notesTexts(delivery) {
  const { doc } = buildDocument({
    profile: PROFILES.ruhe,
    content: { introTitle: "", intro: [], traits: [], colorRoles: { base: [[0], ""], companion: [[1], ""], accent: [[2], ""] }, materials: {}, rooms: {}, combos: [], light: "" },
    customer: {},
    result: null,
    rooms: { wohnen: [], essen: [], kueche: [], schlafen: [], outdoor: [] },
    labs: true,
    delivery,
    dateLabel: "1. November 2026",
    facts: { hours: [], street: "", postalCode: "", city: "", region: "", country: "", phone: "", phoneHref: "", email: "", emailHref: "", legalName: "", impressum: "", datenschutz: "" },
    qr: {},
    links: { termin: "https://platzhirsch.studio/de/beratung", terminLabel: "" },
    images: { materials: {}, roomScenes: {} },
  });
  // walk the element tree of the Notes page and collect all string children
  const pages = doc.props.children;
  const notes = pages[pages.length - 2];
  const out = [];
  const walk = (el) => {
    if (el == null || typeof el === "boolean") return;
    if (typeof el === "string") return out.push(el);
    if (Array.isArray(el)) return el.forEach(walk);
    if (typeof el.type === "function") return walk(el.type(el.props));
    walk(el.props?.children);
  };
  walk(notes);
  return out.join(" ");
}

test("PDF: Testpostfach-Satz nur, wenn die Mail wirklich im Postausgang liegt", () => {
  assert.match(notesTexts("outbox"), /Testpostfach/);
  assert.doesNotMatch(notesTexts("live"), /Testpostfach/, "versendetes PDF behauptet nicht, es sei nicht versendet");
  assert.match(notesTexts("live"), /speichern sie danach nicht/, "Datenschutzsatz bleibt");
});

test("Mail: Newsletter-Wunsch ohne Versprechen einer Bestätigungsmail, mit Anmeldelink", () => {
  for (const labs of [true, false]) {
    const m = buildMoodboardMail({ profile: PROFILES.see, name: null, newsletter: true, labs, pages: 33 });
    assert.ok(m.text.includes(NEWSLETTER_URL), "Anmeldelink");
    assert.match(m.text, /tragen wir Sie nicht ein/);
    assert.doesNotMatch(m.text, /erhalten Sie (dafür )?eine eigene E-Mail mit Bestätigungslink/);
    assert.match(m.text, /Double-Opt-in/);
  }
  assert.doesNotMatch(buildMoodboardMail({ profile: PROFILES.see, newsletter: false, pages: 33 }).text, /newsletter/i);
});

test("Formular und Service: kein Versprechen, das der Server nicht hält", { timeout: 60_000 }, async () => {
  const form = src("components/Labs/Stilfinder/MoodboardPdfForm.js").replace(/\s+/g, " ");
  assert.doesNotMatch(form, /Sie erhalten zuerst eine eigene E-Mail mit Bestätigungslink/);
  assert.match(form, /Double-Opt-in/);
  const service = src("lib/stilfinder/service.js");
  assert.match(service, /delivery: mm\.mode === "live"/);
  assert.doesNotMatch(service, /newsletter_subscribe/);
  // build passes the delivery through (smoke)
  const out = await buildMoodboardPdf({ profile: PROFILES.klar, roomRows: {}, loadImage: null, minImages: 0, delivery: "live" });
  assert.equal(out.buffer.subarray(0, 5).toString(), "%PDF-");
});
