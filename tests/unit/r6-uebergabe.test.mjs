// tests/unit/r6-uebergabe.test.mjs — R6-uebergabe: Freigabe-Cockpit
// (/de/preview/freigaben) und Übergabemappe.
// Run: node --test tests/unit/r6-uebergabe.test.mjs
// Kein Netz, keine Schreibzugriffe: alle Dateien werden nur gelesen.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  COCKPIT_ROBOTS,
  copyStatus,
  freigabePreviewEnabled,
  imageRows,
  lineOf,
  markerLines,
  maskEmbargo,
  productCopyRows,
  ratgeberReviewLabel,
  schweizOpen,
  switchRows,
} from "../../src/components/Freigaben/model.js";
import { signApproval } from "../../src/lib/productCopy/approvals.js";
import * as CH from "../../src/lib/ch/content.js";
import { findClaims } from "../../src/lib/legal/claims.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const FILES = [
  "src/app/[locale]/preview/freigaben/page.js",
  "src/components/Freigaben/Cockpit.js",
  "src/components/Freigaben/data.server.js",
  "src/components/Freigaben/model.js",
];

test("Schalter: Dev an, Produktion nur mit FREIGABE_PREVIEW=1, Vercel-Produktion nie", () => {
  assert.equal(freigabePreviewEnabled({ NODE_ENV: "development" }), true);
  assert.equal(freigabePreviewEnabled({ NODE_ENV: "production" }), false);
  assert.equal(freigabePreviewEnabled({ NODE_ENV: "production", FREIGABE_PREVIEW: "true" }), false);
  assert.equal(freigabePreviewEnabled({ NODE_ENV: "production", FREIGABE_PREVIEW: "1" }), true);
  assert.equal(freigabePreviewEnabled({ NODE_ENV: "production", FREIGABE_PREVIEW: "1", VERCEL_ENV: "production" }), false);
});

test("robots: noindex, nofollow", () => {
  assert.equal(COCKPIT_ROBOTS.index, false);
  assert.equal(COCKPIT_ROBOTS.follow, false);
  assert.equal(COCKPIT_ROBOTS.googleBot.index, false);
});

test("Seite: nur Deutsch, 404 ohne Schalter, kein Formular, keine Schreibfunktion", () => {
  const page = read(FILES[0]);
  assert.match(page, /locale !== "de" \|\| !freigabePreviewEnabled\(\)\) notFound\(\)/);
  for (const rel of FILES) {
    const src = read(rel);
    assert.doesNotMatch(src, /<form|"use server"|'use server'|"use client"/, rel);
    assert.doesNotMatch(src, /writeFile|appendFile|mkdirSync|unlinkSync|rmSync|renameSync|fetch\(/, rel);
  }
});

test("nicht in Sitemap, llms.txt, robots oder Navigation", () => {
  const sources = [
    "src/lib/seo/sitemapEntries.js",
    "src/app/llms.txt/route.js",
    "src/app/robots.js",
    "src/lib/content/landingPages.js",
  ];
  for (const rel of sources) assert.doesNotMatch(read(rel), /preview\/freigaben/, rel);
  const navDir = path.join(ROOT, "src", "components", "Navbar");
  for (const f of fs.readdirSync(navDir, { recursive: true })) {
    const p = path.join(navDir, String(f));
    if (fs.statSync(p).isFile()) assert.doesNotMatch(fs.readFileSync(p, "utf8"), /preview\/freigaben/, f);
  }
});

test("Ratgeber-Marker mit Zeile, gesperrte Namen maskiert", () => {
  const raw = "---\nfreigegeben: false\n---\nText [prüfen: Quelle]\nMit Binni [prüfen]\nNur Binni hier\n";
  const m = markerLines(raw);
  assert.deepEqual(
    m.map((x) => x.line),
    [4, 5, 6]
  );
  assert.ok(m.every((x) => !/binni/i.test(x.text)));
  assert.equal(lineOf(raw, /^freigegeben\s*:/), 2);
  assert.equal(maskEmbargo("Küchen von Binni"), "Küchen von [gesperrter Name]");
});

test("Produkttexte: Status folgt dem Text-Hash", () => {
  const entry = { key: "x/y", productSlug: "y", brand: "B", productName: "P", catalog: { path: "/produkte/x/y" }, meta: { title: "t" }, h1: "h", paragraphs: ["p"], facts: [], faq: [{ question: "q", answer: "a" }] };
  assert.equal(copyStatus(entry), "offen");
  const whole = signApproval(entry, { by: "Test", at: "2026-10-26" });
  assert.equal(copyStatus(whole), "freigegeben");
  assert.equal(copyStatus({ ...whole, h1: "geändert" }), "veraltet");
  const part = signApproval(entry, { fields: ["h1"], by: "Test", at: "2026-10-26" });
  assert.equal(copyStatus(part), "teilweise");
  const rows = productCopyRows([entry, { ...entry, key: "a/b" }], ["x/y"]);
  assert.equal(rows[0].key, "x/y");
  assert.equal(rows[0].start, 1);
  assert.equal(rows[0].href, "/de/produkte/x/y?produkttext=vorschau");
});

test("echte Daten: 62 Produkttexte, alle per Hash geprüft, keiner ohne Status", async () => {
  const de = JSON.parse(read("src/content/productCopy/de.json"));
  const rows = productCopyRows(de.entries, []);
  assert.equal(rows.length, de.entries.length);
  assert.ok(rows.every((r) => ["freigegeben", "teilweise", "veraltet", "offen"].includes(r.status)));
});

test("Bildregister: zurückgehaltene Hero-Fotos zuerst", () => {
  const over = { "/a": { hero: { src: "/a.jpg", alt: "A" } }, "/b": { hero: { released: false, src: "/b.jpg", alt: "B" } }, "/c": {} };
  const rows = imageRows(["/a", "/b", "/c"], (p) => over[p] || {});
  assert.deepEqual(
    rows.map((r) => [r.path, r.released]),
    [
      ["/b", false],
      ["/a", true],
    ]
  );
});

test("Schweiz-Hub: alle pruefen-Stellen gefunden", () => {
  const open = schweizOpen(CH);
  const expected = (read("src/lib/ch/content.js").match(/,\s*pruefen:\s*"/g) || []).length;
  assert.equal(open.length, expected);
  assert.ok(open.length > 0);
});

test("Schalter-Zeilen zeigen Zustände, nie Werte", () => {
  const rows = switchRows({
    voucher: "off",
    voucherRequested: "anfrage",
    atelier: "off",
    commercePreview: false,
    legalPreview: false,
    planerSenden: false,
    booking: "none",
    portalLogin: false,
    portalMail: false,
  });
  assert.equal(rows.find((r) => r.name === "VOUCHER_MODE").state, "anfrage, wirksam off");
  assert.ok(rows.every((r) => !/https?:|secret=|key=/i.test(`${r.state} ${r.note}`)));
});

test("Cockpit-Texte ohne Händler-Claims und Superlative", () => {
  const text = read("src/components/Freigaben/Cockpit.js")
    .match(/>([^<>{}]{8,})</g)
    .map((s) => s.slice(1, -1))
    .join("\n");
  assert.deepEqual(findClaims(text), []);
});

test("Übergabemappe: vorhanden, nennt jeden Schalter, keine Werte von Geheimnissen", () => {
  const md = read("Marktresearch/digital/uebergabe/00-uebergabe.md");
  for (const name of ["VOUCHER_MODE", "ATELIER_MODE", "COMMERCE_PREVIEW", "NEXT_PUBLIC_LABS_PLANER_SENDEN", "BOOKING_PROVIDER", "FREIGABE_PREVIEW", "PORTAL_SESSION_SECRET", "release-check.md"]) {
    assert.ok(md.includes(name), name);
  }
  assert.doesNotMatch(md, /\b[A-Z][A-Z0-9_]{3,}=(?!1\b|0\b|off\b|anfrage\b|link\b|none\b|mock\b|on\b)[^\s`|]+/, "keine Variablenwerte");
  assert.doesNotMatch(md, /abgesichert/i);
});

test("Ratgeber-Anzeige: „geprüft“ nur bei Freigabe mit Prüfer (Feedback P2.2)", () => {
  const open = ratgeberReviewLabel({ freigegeben: false, reviewedBy: null, geprueftAm: "2026-10-26" });
  assert.equal(open, "Datum 26.10.2026 eingetragen, kein Prüfer eingetragen, Prüfung offen");
  assert.doesNotMatch(open, /geprüft/);
  assert.doesNotMatch(ratgeberReviewLabel({ freigegeben: true, reviewedBy: null, geprueftAm: "2026-10-26" }), /geprüft/);
  assert.doesNotMatch(ratgeberReviewLabel({ freigegeben: false, reviewedBy: "eingetragen", geprueftAm: "2026-10-26" }), /geprüft/);
  assert.equal(ratgeberReviewLabel({}), "kein Datum eingetragen, kein Prüfer eingetragen, Prüfung offen");
  assert.equal(ratgeberReviewLabel({ freigegeben: true, reviewedBy: "eingetragen", geprueftAm: "2026-10-26" }), "geprüft am 26.10.2026, Prüfer eingetragen");
  const cockpit = read("src/components/Freigaben/Cockpit.js");
  assert.doesNotMatch(cockpit, /geprüft am \{/);
});

test("Portal-Schalter: aktiv heißt Warnung, nicht Freigabe (Feedback P3.2)", () => {
  const base = { voucher: "off", voucherRequested: "off", atelier: "off", commercePreview: false, legalPreview: false, planerSenden: false, booking: "none" };
  const on = switchRows({ ...base, portalLogin: true, portalMail: true }).filter((r) => r.name.startsWith("Portal"));
  assert.equal(on.length, 2);
  assert.ok(on.every((r) => r.warn === true && /freigeben|freigegeben/.test(r.state)), JSON.stringify(on));
  const off = switchRows({ ...base, portalLogin: false, portalMail: false }).filter((r) => r.name.startsWith("Portal"));
  assert.ok(off.every((r) => !r.warn));
});

test("Mobile Regression: eine r6-uebergabe-Spec passt auf MOBILE_SPECS (Feedback P2.1)", () => {
  const cfg = read("playwright.config.js");
  const m = cfg.match(/const MOBILE_SPECS = \/(.+)\/;/);
  assert.ok(m, "MOBILE_SPECS gefunden");
  const re = new RegExp(m[1]);
  const specs = fs.readdirSync(path.join(ROOT, "tests", "e2e")).filter((f) => f.startsWith("r6-uebergabe") && f.endsWith(".spec.js"));
  assert.ok(specs.some((f) => re.test(f)), specs.join(", "));
  assert.match(read("Marktresearch/digital/uebergabe/00-uebergabe.md"), /Deployment Protection/);
});
