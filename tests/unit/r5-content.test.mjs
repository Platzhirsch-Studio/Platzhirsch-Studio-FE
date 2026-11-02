// tests/unit/r5-content.test.mjs — R5-content: video helpers (InlineVideo,
// YouTubeFacade), Referenzprojekte schema and the empty project list.
// Run from the repo root: node --test tests/unit/r5-content.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  absoluteUrl,
  inlineVideoProblems,
  isYouTubeId,
  sourceType,
  videoObjectSchema,
  youTubeEmbedUrl,
} from "../../src/components/Video/schema.js";
import {
  PROJEKTE,
  getProjekt,
  listFreigegebeneProjekte,
  validateProjekt,
} from "../../src/lib/content/projekte.js";
import { parseRange } from "../../src/app/[locale]/projekte/vorlage/_demo/range.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

test("VideoObject only with name, own poster and upload date; URLs absolute", () => {
  const base = { name: "Im Café", poster: "/video/cafe.jpg", sources: [{ src: "/video/cafe.mp4" }] };
  assert.equal(videoObjectSchema(base, { siteUrl: "https://platzhirsch.studio" }), null, "no uploadDate → no schema");
  const s = videoObjectSchema({ ...base, uploadDate: "2026-11-02", duration: "PT45S" }, { siteUrl: "https://platzhirsch.studio" });
  assert.equal(s["@type"], "VideoObject");
  assert.equal(s.thumbnailUrl, "https://platzhirsch.studio/video/cafe.jpg");
  assert.equal(s.contentUrl, "https://platzhirsch.studio/video/cafe.mp4");
  assert.equal(videoObjectSchema({ ...base, uploadDate: "2026-11-02", duration: "45 Sekunden" }, { siteUrl: "https://x" }), null);
  assert.equal(absoluteUrl("https://cdn/x.jpg", "https://a"), "https://cdn/x.jpg");
  assert.equal(sourceType("/a/b.webm?x=1"), "video/webm");
});

test("InlineVideo props: poster, caption track, name and dimensions are required", () => {
  const ok = { sources: [{ src: "/v.mp4" }], poster: "/p.jpg", title: "T", width: 16, height: 9, tracks: [{ src: "/v.vtt", srcLang: "de", label: "Deutsch" }] };
  assert.deepEqual(inlineVideoProblems(ok), []);
  assert.ok(inlineVideoProblems({ ...ok, poster: "" }).includes("poster fehlt"));
  assert.ok(inlineVideoProblems({ ...ok, tracks: [] }).includes("Untertitelspur fehlt"));
  assert.ok(inlineVideoProblems({ ...ok, tracks: [{ src: "/v.vtt" }] }).includes("Untertitelspur ohne srcLang/label"));
  assert.ok(inlineVideoProblems({ ...ok, width: 0 }).includes("width/height fehlen"));
});

test("InlineVideo source: preload none, no autoplay attribute, ambient only via motion check", () => {
  const src = read("src/components/Video/InlineVideo.js");
  assert.match(src, /preload="none"/);
  assert.match(src, /controls/);
  assert.doesNotMatch(src, /autoPlay/);
  const amb = read("src/components/Video/AmbientPlay.js");
  assert.match(amb, /prefers-reduced-motion: reduce/);
  assert.match(amb, /data-motion|dataset\.motion/);
});

test("YouTube: id check, nocookie embed after click, consent through ConsentEmbed, own poster", () => {
  assert.ok(isYouTubeId("dQw4w9WgXcQ"));
  assert.ok(!isYouTubeId("x\"><script>"));
  assert.throws(() => youTubeEmbedUrl("bad"));
  assert.match(youTubeEmbedUrl("dQw4w9WgXcQ", { start: 30 }), /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?autoplay=1&.*start=30/);
  const facade = read("src/components/Video/YouTubeFacade.js");
  assert.match(facade, /import ConsentEmbed from "@\/components\/Cookies\/ConsentEmbed"/);
  assert.match(facade, /service="youtube"/);
  assert.match(facade, /ytimg/, "rejects YouTube thumbnails as poster");
});

const VALID = {
  slug: "haus-am-see",
  freigegeben: true,
  reviewedBy: "Prüferin",
  updatedAt: "2026-12-01",
  titel: "Haus am See – Test",
  ort: "Westallgäu",
  typologie: "Haus",
  leistungen: ["Wohnen", "Licht"],
  zeitraum: { von: "2026-01", bis: "2026-04" },
  ausgangslage: "Text.",
  loesung: [{ raum: "Wohnen", text: "Text." }],
  bilder: [{ src: "/projekte/haus-am-see/1.avif", alt: "Wohnraum", width: 1200, height: 800, fotograf: "F", nutzungsrecht: true, exifEntfernt: true, ki: "keine" }],
  einwilligung: { bauherr: true, datum: "2026-11-20", umfang: ["fotos", "ort"], ablage: "Ordner X" },
  ohneAdresse: true,
  exifEntfernt: true,
};

test("Projekt schema: consent, no address, EXIF removed, released", () => {
  assert.equal(validateProjekt(VALID).ok, true, validateProjekt(VALID).errors?.join("; "));
  const bad = (patch, field) => {
    const r = validateProjekt({ ...VALID, ...patch });
    assert.equal(r.ok, false, field);
    assert.ok(r.errors.some((e) => e.startsWith(field)), `${field}: ${r.errors.join("; ")}`);
  };
  bad({ freigegeben: false }, "freigegeben");
  bad({ ort: "Landstraße 11, Lochau" }, "ort");
  bad({ ort: "6911 Lochau" }, "ort");
  bad({ ohneAdresse: false }, "ohneAdresse");
  bad({ exifEntfernt: false }, "exifEntfernt");
  bad({ einwilligung: { ...VALID.einwilligung, bauherr: false } }, "einwilligung.bauherr");
  bad({ bilder: [{ ...VALID.bilder[0], exifEntfernt: false }] }, "bilder.0.exifEntfernt");
  bad({ bilder: [{ ...VALID.bilder[0], ki: "generiert" }] }, "bilder.0.ki");
  bad({ bilder: [{ ...VALID.bilder[0], src: "https://images.unsplash.com/x.jpg" }] }, "bilder.0.src");
  bad({ zitat: { text: "Schön", von: "B", freigabe: true } }, "zitat");
  bad({ loesung: [{ raum: "W", text: "wort ".repeat(601) }] }, "loesung");
  // listing drops invalid entries and finds valid ones
  assert.deepEqual(listFreigegebeneProjekte([VALID, { ...VALID, slug: "x", freigegeben: false }]).map((p) => p.slug), ["haus-am-see"]);
  assert.equal(getProjekt("haus-am-see", [VALID]).titel, VALID.titel);
});

test("no invented projects: the live list is empty, the template has only placeholders", () => {
  assert.equal(PROJEKTE.length, 0);
  assert.deepEqual(listFreigegebeneProjekte(), []);
  const vorlage = read("src/app/[locale]/projekte/vorlage/page.js");
  const block = vorlage.slice(vorlage.indexOf("const VORLAGE"), vorlage.indexOf("const PFLICHT"));
  for (const [, value] of block.matchAll(/(?:titel|ort|typologie|ausgangslage|raum|text|von|name|ctaTitel|ctaText|zeitraumText): "([^"]*)"/g)) {
    assert.match(value, /^\[.*\]$/, `placeholder in brackets: ${value}`);
  }
  for (const f of ["src/app/[locale]/projekte/page.js", "src/app/[locale]/projekte/[slug]/page.js", "src/app/[locale]/projekte/vorlage/page.js"]) {
    const s = read(f);
    assert.match(s, /index: false/, `${f} noindex`);
    assert.match(s, /locale !== "de"\) notFound\(\)/, `${f} DE only`);
  }
  // Not registered anywhere else: sitemap, llms, navigation.
  for (const f of ["src/lib/seo/sitemapEntries.js", "src/lib/seo/llms.js", "src/lib/navigation.js"]) {
    if (fs.existsSync(path.join(ROOT, f))) assert.doesNotMatch(read(f), /projekte(?!\/)|\/projekte\b(?!n)/i, f);
  }
});

test("demo clip byte ranges", () => {
  assert.equal(parseRange(null, 100), null);
  assert.deepEqual(parseRange("bytes=0-9", 100), { start: 0, end: 9 });
  assert.deepEqual(parseRange("bytes=90-", 100), { start: 90, end: 99 });
  assert.deepEqual(parseRange("bytes=-10", 100), { start: 90, end: 99 });
  assert.deepEqual(parseRange("bytes=0-500", 100), { start: 0, end: 99 });
  assert.equal(parseRange("bytes=200-300", 100), false);
});
