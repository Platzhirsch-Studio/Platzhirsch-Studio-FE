// tests/unit/r3-recht.test.mjs — R3-recht-vorschau: legal draft previews
// (src/components/LegalDrafts). Env switch, inline markup, open points,
// company data from src/lib/site.js, new sections, no claims.
// Run: node --test tests/unit/r3-recht.test.mjs
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src");

// Next.js-style imports ("server-only", "@/…", extensionless) for plain Node.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    let spec = specifier;
    if (spec.startsWith("@/")) spec = pathToFileURL(path.join(SRC, spec.slice(2))).href;
    const fromSrc = spec.startsWith("file:") || ((spec.startsWith("./") || spec.startsWith("../")) && context.parentURL?.includes("/src/"));
    if (fromSrc && !/\.[cm]?js$/.test(spec)) {
      const url = new URL(spec, context.parentURL);
      for (const ext of [".js", "/index.js"]) {
        const candidate = fileURLToPath(url) + ext;
        if (fs.existsSync(candidate)) return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
    return next(spec, context);
  },
});

let L, inline, site, claims;
before(async () => {
  L = await import(pathToFileURL(path.join(SRC, "components/LegalDrafts/index.js")).href);
  inline = await import(pathToFileURL(path.join(SRC, "components/LegalDrafts/inline.js")).href);
  site = await import(pathToFileURL(path.join(SRC, "lib/site.js")).href);
  claims = await import(pathToFileURL(path.join(SRC, "lib/legal/claims.js")).href);
});

/** Every string of a document (header, intro, sections, sub-sections, known errors). */
function allTexts(doc) {
  const out = [doc.title, doc.lead, doc.version, ...L.blockTexts(doc.intro), ...(doc.knownErrors || []).flatMap((e) => [e.title, e.text])];
  for (const s of doc.sections) {
    out.push(s.title, ...s.blocks.flatMap(L.blockTexts));
    for (const sub of s.sub || []) out.push(sub.title, ...sub.blocks.flatMap(L.blockTexts));
  }
  return out.filter((t) => typeof t === "string");
}

test("switch: on in development, off in production unless LEGAL_PREVIEW=1", () => {
  assert.equal(L.legalPreviewEnabled({ NODE_ENV: "development" }), true);
  assert.equal(L.legalPreviewEnabled({ NODE_ENV: "production" }), false);
  assert.equal(L.legalPreviewEnabled({ NODE_ENV: "production", LEGAL_PREVIEW: "0" }), false);
  assert.equal(L.legalPreviewEnabled({ NODE_ENV: "production", ERROR_PREVIEW: "1" }), false);
  assert.equal(L.legalPreviewEnabled({ NODE_ENV: "production", LEGAL_PREVIEW: "1" }), true);
});

test("four documents, unknown slugs and prototype keys rejected", () => {
  assert.deepEqual(L.DOC_SLUGS, ["datenschutz", "impressum", "agb", "barrierefreiheit"]);
  assert.equal(L.getDoc("xyz"), null);
  assert.equal(L.getDoc("__proto__"), null);
  assert.equal(L.getDoc("toString"), null);
});

test("inline: marks, labels, links", () => {
  const t = inline.tokenize("A [anwaltlich prüfen] **B [●]** [Verbraucher] [MODUL] [x](https://ris.bka.gv.at) [Tel](tel:+43) `c`");
  const kinds = t.map((x) => x.t);
  assert.deepEqual(kinds.filter((k) => k !== "text"), ["mark", "b", "label", "label", "link", "link", "code"]);
  const pts = inline.openPoints("Frist [14] Tage [anwaltlich prüfen: Frist] [vom Unternehmen auszufüllen] [prüfen bei Cal.com] [Verbraucher]");
  assert.deepEqual(pts.map((p) => p.kind), ["inhaber", "anwalt", "inhaber", "pruefen"]);
  // nested brackets count once (outermost)
  assert.equal(inline.openPoints("[Variante A / [Variante B: x] – anwaltlich prüfen]").length, 1);
});

test("every document has open points and unique section ids", () => {
  for (const slug of L.DOC_SLUGS) {
    const doc = L.DOCS[slug];
    const ids = doc.sections.flatMap((s) => [s.id, ...(s.sub || []).map((x) => x.id)]);
    assert.equal(new Set(ids).size, ids.length, `${slug}: duplicate ids`);
    assert.ok(!ids.includes("kopf") && !ids.includes("offene-stellen"), `${slug}: reserved id`);
    const c = L.docCounts(doc);
    assert.ok(c.total > 0, `${slug}: no open points`);
    assert.ok(c.anwalt > 0, `${slug}: no [anwaltlich prüfen]`);
    assert.equal(c.total, c.anwalt + c.inhaber + c.pruefen);
  }
});

test("Datenschutz: new sections Kundenportal, Upload, Online-Planer, KI-Concierge", () => {
  const ds = L.DOCS.datenschutz;
  const subs = ds.sections.find((s) => s.id === "verarbeitungen").sub;
  const ids = subs.map((s) => s.id);
  for (const id of ["kundenportal", "upload", "online-planer", "ki-concierge"]) assert.ok(ids.includes(id), id);
  for (const id of ["kundenportal", "upload", "online-planer"]) assert.ok(subs.find((s) => s.id === id).added, `${id} marked as added`);
  const text = allTexts(ds).join("\n");
  assert.match(text, /ph_portal_session/);
  assert.match(text, /180 Tage/);
});

test("Datenschutz: the five known errors of today's page, incl. Privacy Shield", () => {
  const errs = L.DOCS.datenschutz.knownErrors;
  assert.equal(errs.length, 5);
  assert.deepEqual(errs.map((e) => e.id).sort(), ["D1", "D2", "D3", "D5", "D8"]);
  assert.ok(errs.some((e) => /Privacy Shield/.test(e.text)));
});

test("company data from src/lib/site.js, no house number 9", () => {
  for (const slug of ["datenschutz", "impressum", "agb"]) {
    const text = allTexts(L.DOCS[slug]).join("\n");
    assert.ok(text.includes(site.ADDRESS.street), `${slug}: street from site.js`);
    assert.ok(!/Landstra(ß|ss)e 9\b/.test(text), `${slug}: Landstraße 9`);
  }
  const imp = allTexts(L.DOCS.impressum).join("\n");
  assert.ok(imp.includes(site.PHONE_DISPLAY) && imp.includes(site.EMAIL));
});

test("no secured-deposit wording, no dealer claims or superlatives", () => {
  for (const slug of L.DOC_SLUGS) {
    for (const t of allTexts(L.DOCS[slug])) {
      assert.ok(!/abgesichert/i.test(t), `${slug}: "abgesichert" in: ${t.slice(0, 80)}`);
      // "§ 312g Abs 2 Nr. 1 BGB" is a statute citation, not a "Nr. 1" claim.
      const hits = claims.findClaims(t).filter((h) => !(h.id === "de-nr1" && /Abs\.? \d+[a-z]? Nr\. 1\b/.test(h.sentence)));
      assert.deepEqual(hits, [], `${slug}: ${JSON.stringify(hits).slice(0, 300)}`);
    }
  }
});

test("switch: never on a Vercel production deployment", () => {
  assert.equal(L.legalPreviewEnabled({ NODE_ENV: "production", LEGAL_PREVIEW: "1", VERCEL_ENV: "production" }), false);
  assert.equal(L.legalPreviewEnabled({ NODE_ENV: "production", LEGAL_PREVIEW: "1", VERCEL_ENV: "preview" }), true);
});

test("counting rule: outermost brackets count, nested ones are parts (QM P2)", () => {
  const pts = inline.openPoints("[nur nach Vereinbarung, höchstens [3–5] % – anwaltlich prüfen] und [●]");
  assert.equal(pts.length, 2);
  assert.equal(pts[0].parts, 1);
  assert.equal(pts[1].parts, 0);
  // fixed figures for the law firm; a change in a draft must update them on purpose
  // datenschutz 89 → 123: +34 open points of the appendix "Eingesetzte Dienste"
  // (139 before the R4 fix: the 16 section links "[5.2](#…)" were miscounted as open points)
  // (R4-recht-consent, generated from src/lib/legal/services.js)
  // datenschutz 123 → 128 (R8-recht, bewusst): neuer Register-Eintrag "mailDelivery"
  // (Resend/Postmark laut portal/mailer.js und stilfinder/mail.js) mit 5 offenen
  // Punkten für die Kanzlei (Anbieter, Rechtsgrundlage, AV-Vertrag, Drittland, Frist).
  // datenschutz 128 → 130 (Einblicke 29.10.2026, bewusst): neuer Register-Eintrag
  // "einblicke" (eigene Heatmap) mit 2 offenen Punkten (Hoster/AV-Vertrag, Serverstandort).
  // datenschutz 130 → 134 (Rat 9,5 B3, bewusst): Register-Eintrag "booking" beschreibt
  // jetzt den gebauten Kalender /termin (vorher "nicht eingesetzt" mit 1 offenen Punkt)
  // mit 5 offenen Punkten (Videodienst, Rechtsgrundlage Video, AV-Vertrag, Drittland, Frist).
  const expected = { datenschutz: [134, 0], impressum: [28, 0], agb: [112, 6], barrierefreiheit: [11, 0] };
  for (const [slug, [total, parts]] of Object.entries(expected)) {
    const c = L.docCounts(L.DOCS[slug]);
    assert.deepEqual([c.total, c.parts], [total, parts], slug);
    const listed = L.docOpenPoints(L.DOCS[slug]).reduce((n, g) => n + g.points.length, 0);
    assert.equal(listed, total, `${slug}: list = total`);
  }
});
