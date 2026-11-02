// node --test tests/unit/bilder-seo.test.mjs
// Bilder-SEO (Auftrag des Inhabers 31.10.2026): Bilder-Sitemap, Urheber-Register
// (src/lib/seo/imageRights.js), ImageObject nur für eigene Fotos, XMP-Werkzeug
// und Wasserzeichen nur für eigene Fotos, Alt-Texte ohne Namens-Stopfen.
// Live-Teil gegen QA_BASE/SITEMAP_BASE (Standard http://localhost:3000), wird
// übersprungen, wenn der Server fehlt.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { toUrlsetXml, BASE_URL, IMAGE_NS, MAX_IMAGES_PER_URL } from "../../src/lib/seo/sitemap/xml.js";
import { withImages, imagesForUrl, staticPageImages, katalogImages, cleanImages, NOIMAGEINDEX_PATHS } from "../../src/lib/seo/sitemap/images.js";
import {
  STATIC_IMAGE_RIGHTS,
  imageRights,
  registerErrors,
  isManufacturerImage,
  ownImage,
  imageObjectSchema,
  ownImageSchemas,
  arbeitsweiseRights,
  LICENSE_PAGE,
  RIGHTS_HOLDER,
  copyrightZeichenErlaubt,
} from "../../src/lib/seo/imageRights.js";
import { ALLE_PRODUKTE, katalogPfade } from "../../src/lib/katalog/index.js";
import { ALLE_MARKEN as BW_MARKEN, HERO_IMAGE as BW_HERO } from "../../src/lib/wellness/marken.js";
import { GERAETE_MARKEN } from "../../src/lib/kueche/geraete.js";
import { jpegWithXmp, pngWithXmp, jpegXmp, requireOwn, xmpPacket, existingNotices } from "../../tools/images/lib.mjs";
import { planWatermark, renderWatermark, POSITION } from "../../tools/images/watermark.mjs";
import { planEntry, buildPlan, embed } from "../../tools/images/embed-rights.mjs";
import { checkEntry, rightsXmp } from "../../tools/arbeitsweise/import.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const publicFile = (url) => path.join(ROOT, "public", decodeURI(url.replace(BASE_URL, "")));
const KATALOG_SRCS = ALLE_PRODUKTE.flatMap((p) => p.bilder.map((b) => b.src));
const MANUFACTURER_SAMPLES = [
  ...KATALOG_SRCS.slice(0, 20),
  BW_HERO.src,
  ...BW_MARKEN.flatMap((m) => [m.image?.src, ...(m.moreImages || []).map((i) => i.src)]).filter(Boolean),
  ...GERAETE_MARKEN.map((m) => m.image?.src).filter(Boolean),
  "/labs/yacht/minotti-navetta42/30393_z_01_Minotti_CustomLine_Navetta42__1.jpg",
  "/Images/Home/slider/minotti-sofa-wohnzimmer.webp",
  "/cmx/files/minotti-lido-01.webp",
];

// ------------------------------------------------------------ Sitemap (XML)
test("toUrlsetXml: image:image mit Namespace, absolut, eindeutig, ≤ 1 000 je URL", () => {
  const many = Array.from({ length: MAX_IMAGES_PER_URL + 50 }, (_, i) => `${BASE_URL}/Images/x-${i}.jpg`);
  const xml = toUrlsetXml([
    { url: `${BASE_URL}/de/a`, lastModified: "2026-10-31", images: [`${BASE_URL}/Images/a.jpg`, `${BASE_URL}/Images/a.jpg`, "/relativ.jpg"] },
    { url: `${BASE_URL}/de/b`, lastModified: "2026-10-31", images: many },
  ]);
  assert.ok(xml.includes(`xmlns:image="${IMAGE_NS}"`));
  const a = xml.split("</url>")[0];
  assert.equal((a.match(/<image:loc>/g) || []).length, 1, "Duplikat und relative URL fallen weg");
  const b = xml.split("</url>")[1];
  assert.equal((b.match(/<image:loc>/g) || []).length, MAX_IMAGES_PER_URL);
  // <image:loc> darf von <loc>-Parsern (Crawler, Tests) nicht als Seiten-URL gelesen werden
  assert.deepEqual([...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]), [`${BASE_URL}/de/a`, `${BASE_URL}/de/b`]);
});

test("toUrlsetXml: ohne Bilder unverändert (kein image-Namespace)", () => {
  const xml = toUrlsetXml([{ url: `${BASE_URL}/de/a`, lastModified: "2026-10-31" }]);
  assert.ok(!xml.includes("xmlns:image"));
  assert.ok(!xml.includes("image:image"));
});

test("Bilder je Seite: Katalog, Bad & Wellness, Küchengeräte, eigene Fotos – absolut, vorhanden, eindeutig", () => {
  const pfade = katalogPfade();
  assert.ok(pfade.length > 0, "Katalog hat Seiten");
  let mitBild = 0;
  for (const p of pfade) {
    for (const locale of ["de", "fr"]) {
      const imgs = imagesForUrl(`${BASE_URL}/${locale}${p.path}`);
      assert.equal(new Set(imgs).size, imgs.length, `${p.path}: doppelt`);
      assert.ok(imgs.length <= MAX_IMAGES_PER_URL);
      for (const u of imgs) {
        assert.ok(u.startsWith(`${BASE_URL}/`), `${u}: nicht absolut`);
        assert.ok(fs.existsSync(publicFile(u)), `${u}: Datei fehlt in public/`);
      }
      if (imgs.length) mitBild++;
    }
    if (p.typ === "produkt") {
      const expected = cleanImages(katalogImages(p));
      assert.deepEqual(imagesForUrl(`${BASE_URL}/de${p.path}`), expected);
    }
  }
  assert.ok(mitBild > 0, "mindestens eine Katalogseite mit Bildern");
  const bw = imagesForUrl(`${BASE_URL}/it/bad-wellness`);
  assert.ok(bw.includes(`${BASE_URL}${BW_HERO.src}`), "Auftaktbild Bad & Wellness");
  assert.ok(imagesForUrl(`${BASE_URL}/en/kuechengeraete`).length >= 1);
  assert.deepEqual(imagesForUrl(`${BASE_URL}/de`), [`${BASE_URL}/Images/Home/aboutHome.jpg`]);
  assert.deepEqual(imagesForUrl(`${BASE_URL}/it/contatto`), [`${BASE_URL}/Images/Home/aboutHome.jpg`]);
  for (const list of Object.values(staticPageImages())) for (const u of cleanImages(list)) assert.ok(fs.existsSync(publicFile(u)), u);
  // noimageindex-Seiten und Backoffice-Seiten bekommen keine Bilder
  for (const p of NOIMAGEINDEX_PATHS) assert.deepEqual(imagesForUrl(`${BASE_URL}/de${p}`), []);
  assert.deepEqual(imagesForUrl(`${BASE_URL}/de/produkte`), []);
  assert.deepEqual(imagesForUrl(`${BASE_URL}/de/ueber-uns/marken/minotti`), []);
  const out = withImages([{ url: `${BASE_URL}/de/kontakt` }, { url: `${BASE_URL}/de/impressum` }]);
  assert.ok(out[0].images?.length === 1 && !("images" in out[1]));
});

// ------------------------------------------------------------ Urheber-Register
test("Urheber-Register: gültig, nur eigene Fotos, keine Herstellerbilder", () => {
  assert.deepEqual(registerErrors(), []);
  const reg = imageRights();
  assert.ok(reg.length >= 1);
  const katalog = new Set(KATALOG_SRCS);
  for (const e of reg) {
    assert.ok(!isManufacturerImage(e.datei), `${e.datei}: Herstellerbild im Register`);
    assert.ok(!katalog.has(e.datei), `${e.datei}: Katalogbild im Register`);
    assert.ok(!/^\/Images\/(Wellness|Kueche)\//.test(e.datei), e.datei);
    assert.ok(fs.existsSync(path.join(ROOT, "public", e.datei)), `${e.datei}: Datei fehlt`);
    assert.equal(typeof e.urheber, "string");
  }
  for (const src of MANUFACTURER_SAMPLES) assert.equal(ownImage(src), null, `${src}: darf nie eigen sein`);
  // Teamfotos/Beratungsbilder mit offener Freigabe stehen nicht im Register
  for (const offen of ["/Images/Home/secondAboutHome.jpg", "/Images/Team/harald.jpg", "/Images/Beratung/beratung.jpg"]) assert.equal(ownImage(offen), null, offen);
  // eingeschmuggelte Herstellerbilder würden gemeldet
  const bad = [...STATIC_IMAGE_RIGHTS, { ...STATIC_IMAGE_RIGHTS[0], datei: "/Images/Wellness/agape-vieques.webp" }];
  assert.ok(registerErrors(bad).some((m) => /Herstellerbild/.test(m)));
  assert.ok(registerErrors([{ ...STATIC_IMAGE_RIGHTS[0], datei: "/cmx/files/x.jpg" }]).length > 0);
});

test("Urheber-Register: kein erfundener Fotograf, keine erfundene Lizenzseite", () => {
  const about = ownImage("/Images/Home/aboutHome.jpg");
  assert.equal(about.urheber, "", "Fotograf laut bildrechte.csv offen");
  assert.equal(about.rechteinhaber, RIGHTS_HOLDER);
  assert.equal(about.bearbeitung, false, "Bearbeitung laut Register nicht geklärt");
  // Nr. 31: Fotograf aus EXIF/IPTC, exklusive Rechte noch nicht bestätigt, Nennung offen
  assert.equal(about.fotograf, "Heidegger Fotografie");
  assert.equal(about.exklusiveRechteBestaetigt, false);
  assert.equal(about.fotografSichtbarNennen, null);
  assert.equal(copyrightZeichenErlaubt(about), false);
  for (const e of imageRights()) {
    assert.equal(typeof e.exklusiveRechteBestaetigt, "boolean", e.datei);
    assert.ok(e.fotograf === null || typeof e.fotograf === "string", e.datei);
    assert.ok(e.fotografSichtbarNennen === null || typeof e.fotografSichtbarNennen === "boolean", e.datei);
  }
  assert.ok(registerErrors([{ ...about, exklusiveRechteBestaetigt: "ja" }]).some((m) => /exklusiveRechteBestaetigt/.test(m)));
  assert.ok(registerErrors([{ ...about, exklusiveRechteBestaetigt: true, bearbeitung: false }]).some((m) => /widersprüchlich/.test(m)));
  assert.ok(registerErrors([{ ...about, fotograf: "" }]).some((m) => /fotograf/.test(m)));
  // Herstellerbild bekäme auch mit Häkchen nie ein ©
  assert.equal(copyrightZeichenErlaubt({ ...about, datei: "/Images/Wellness/agape-vieques.webp", exklusiveRechteBestaetigt: true }), false);
  assert.equal(LICENSE_PAGE, null, "es gibt keine Bildrechte-Seite");
  assert.equal(about.lizenzSeite, null);
});

test("Arbeitsweise-Import: nur Slots mit rechteinhaber kommen ins Register, Probelauf nie", () => {
  const slot = { src: "/arbeitsweise/handzeichnung-abc.avif", alt: "Handzeichnung eines Wohnraums", typ: "skizze", einwilligung: "BR-1", credit: "Handzeichnung: Harald Menghin" };
  assert.deepEqual(arbeitsweiseRights({ handzeichnung: slot }, {}), []);
  const withRights = arbeitsweiseRights({ handzeichnung: { ...slot, rechteinhaber: RIGHTS_HOLDER, urheber: "Harald Menghin" } }, {});
  assert.equal(withRights.length, 1);
  assert.equal(withRights[0].urheber, "Harald Menghin");
  assert.deepEqual(registerErrors(withRights), []);
  assert.deepEqual(arbeitsweiseRights({ handzeichnung: { ...slot, rechteinhaber: RIGHTS_HOLDER, probelauf: true } }, {}), []);
  // import.mjs: Rechte-Felder optional, aber typgeprüft
  const ok = { datei: "a.jpg", ziel: "handzeichnung", alt: "Handzeichnung eines Wohnraums mit Sofa", credit: "Handzeichnung: Harald Menghin", einwilligung: "BR-1", kiStufe: "keine", typ: "skizze" };
  assert.deepEqual(checkEntry(ok), []);
  assert.deepEqual(checkEntry({ ...ok, rechteinhaber: RIGHTS_HOLDER, urheber: "Harald Menghin", bearbeitung: false, rechteStand: "2026-11-02" }), []);
  assert.ok(checkEntry({ ...ok, urheber: "Harald Menghin" }).some((m) => /rechteinhaber/.test(m)));
  assert.ok(checkEntry({ ...ok, rechteinhaber: RIGHTS_HOLDER, bearbeitung: "ja" }).length > 0);
  assert.equal(rightsXmp(ok), null);
  assert.match(rightsXmp({ ...ok, rechteinhaber: RIGHTS_HOLDER }), /<photoshop:Credit>Platzhirsch Home Living<\/photoshop:Credit>/);
});

// ------------------------------------------------------------ ImageObject
test("ImageObject nur für eigene Fotos – mit creditText, ohne erfundene Angaben", () => {
  const node = imageObjectSchema("/Images/Home/aboutHome.jpg", { width: 2048, height: 1228 });
  assert.equal(node["@type"], "ImageObject");
  assert.equal(node.contentUrl, `${BASE_URL}/Images/Home/aboutHome.jpg`);
  assert.equal(node.creditText, RIGHTS_HOLDER);
  assert.ok(node.copyrightNotice.includes("Heidegger Fotografie"), "vorhandener Datei-Vermerk bleibt");
  assert.deepEqual(node.creator, { "@type": "Organization", name: "Heidegger Fotografie" }, "Fotograf laut Datei bleibt genannt");
  assert.ok(!("license" in node) && !("acquireLicensePage" in node), "keine Lizenzseite → keine license");
  assert.ok(!("copyrightHolder" in node), "kein Rechteinhaber Platzhirsch ohne bestätigte exklusive Rechte (Nr. 31)");
  assert.ok(!node.copyrightNotice.includes(`© ${RIGHTS_HOLDER}`), "kein © Platzhirsch ohne Bestätigung");
  assert.equal(imageObjectSchema(`${BASE_URL}/Images/Home/aboutHome.jpg`)?.contentUrl, node.contentUrl);
  for (const src of MANUFACTURER_SAMPLES) assert.equal(imageObjectSchema(src), null, src);
  assert.equal(imageObjectSchema("/Images/Home/secondAboutHome.jpg"), null);
  const list = ownImageSchemas(["/Images/Home/aboutHome.jpg", BW_HERO.src, "/Images/Home/aboutHome.jpg", KATALOG_SRCS[0]]);
  assert.equal(list.length, 1);
  // Eintrag mit belegtem Urheber, ohne Datei-Vermerk, Rechte bestätigt
  const reg = [{ ...STATIC_IMAGE_RIGHTS[0], datei: "/arbeitsweise/x.avif", urheber: "Harald Menghin", fotograf: null, dateiVermerk: undefined, exklusiveRechteBestaetigt: true, bearbeitung: true }];
  assert.deepEqual(registerErrors(reg), []);
  const own = imageObjectSchema("/arbeitsweise/x.avif", { register: reg });
  assert.deepEqual(own.creator, { "@type": "Person", name: "Harald Menghin" });
  assert.equal(own.copyrightNotice, `© ${RIGHTS_HOLDER}`);
  assert.deepEqual(own.copyrightHolder, { "@id": `${BASE_URL}/#organization` });
  // gleicher Eintrag ohne Bestätigung: kein ©, kein copyrightHolder
  const unbest = imageObjectSchema("/arbeitsweise/x.avif", { register: [{ ...reg[0], exklusiveRechteBestaetigt: false }] });
  assert.ok(!("copyrightHolder" in unbest) && !("copyrightNotice" in unbest), JSON.stringify(unbest));
});

// ------------------------------------------------------------ Alt-Texte
test("Alt-Texte (Stichprobe): beschreibend, kein „Platzhirsch“ in Herstellerbildern, kein Namens-Stopfen", () => {
  const alts = ALLE_PRODUKTE.flatMap((p) => p.bilder.flatMap((b) => Object.values(b.alt || {})));
  assert.ok(alts.length > 0);
  const mitName = alts.filter((a) => /platzhirsch/i.test(a));
  assert.deepEqual(mitName, [], "Herstellerbilder tragen keinen Platzhirsch-Namen im Alt-Text");
  for (const a of alts) {
    assert.ok(a.trim().length >= 8, `zu kurz: „${a}“`);
    assert.ok((a.match(/platzhirsch/gi) || []).length <= 1);
  }
  // Seiten-Code: höchstens ein Drittel der Alt-Texte mit „Platzhirsch Home Living“
  const files = ["src/components/Landing/imagery.js", "src/app/[locale]/designermoebel-bregenz/page.js"].map((f) => fs.readFileSync(path.join(ROOT, f), "utf8"));
  const pageAlts = files.flatMap((s) => [...s.matchAll(/\balt:\s*"([^"]+)"/g)].map((m) => m[1]));
  const share = pageAlts.filter((a) => /Platzhirsch Home Living/.test(a)).length / pageAlts.length;
  assert.ok(share <= 1 / 3, `Anteil Alt-Texte mit Firmenname ${Math.round(share * 100)} %`);
});

// ------------------------------------------------------------ XMP / Wasserzeichen
const pixels = async (buf) => crypto.createHash("sha256").update(await sharp(buf).raw().toBuffer()).digest("hex");
const ENTRY = { creditText: RIGHTS_HOLDER, rechteinhaber: RIGHTS_HOLDER, urheber: "", lizenzSeite: null };

test("XMP verlustfrei: JPEG und PNG behalten Pixel und vorhandene Angaben", async () => {
  const jpg = await sharp({ create: { width: 40, height: 30, channels: 3, background: "#8a7f70" } })
    .jpeg()
    .withExif({ IFD0: { Copyright: "Fotostudio Test" } })
    .toBuffer();
  const xmp = xmpPacket(ENTRY);
  const out = jpegWithXmp(jpg, xmp);
  assert.equal(await pixels(out), await pixels(jpg));
  assert.match(jpegXmp(out), /<photoshop:Credit>Platzhirsch Home Living/);
  const meta = await sharp(out).metadata();
  assert.ok(meta.exif.toString("latin1").includes("Fotostudio Test"), "EXIF-Copyright bleibt");
  const twice = jpegWithXmp(out, xmp);
  assert.equal(twice.length, out.length, "zweiter Lauf ersetzt statt zu verdoppeln");
  const png = await sharp({ create: { width: 20, height: 20, channels: 4, background: "#10203040" } }).png().toBuffer();
  const pout = pngWithXmp(png, xmp);
  assert.equal(await pixels(pout), await pixels(png));
  assert.match((await sharp(pout).metadata()).xmp.toString(), /photoshop:Credit/);
});

test("embed-rights und Wasserzeichen verweigern Herstellerbilder und nicht eingetragene Dateien", async () => {
  for (const src of [BW_HERO.src, KATALOG_SRCS[0], "/Images/Kueche/quooker-fusion-round-edelstahl.webp", "/Images/Home/secondAboutHome.jpg", "/Images/../../package.json"]) {
    assert.throws(() => requireOwn(src), /verweigert|Pfad/, src);
    assert.throws(() => planWatermark(src), /verweigert|Pfad/, src);
    await assert.rejects(planEntry(src), /verweigert|Pfad/, src);
  }
  // eigenes Foto: Vorschau erlaubt, Umstellung nur mit bearbeitung: true
  assert.equal(planWatermark("/Images/Home/aboutHome.jpg").rel, "/Images/Home/aboutHome.jpg");
  assert.throws(() => planWatermark("/Images/Home/aboutHome.jpg", { umstellen: true }), /nicht gedeckt/);
  const reg = [{ ...STATIC_IMAGE_RIGHTS[0], bearbeitung: true }];
  assert.equal(planWatermark("/Images/Home/aboutHome.jpg", { umstellen: true, register: reg }).entry.bearbeitung, true);
  const plan = await planEntry("/Images/Home/aboutHome.jpg");
  assert.equal(plan.format, "jpeg");
  assert.ok(plan.verlustfrei);
});

test("Wasserzeichen: unten rechts, ~7 % Breite, hell/dunkel nach Ecke, Metadaten bleiben", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ph-wz-"));
  const dark = await sharp({ create: { width: 1000, height: 600, channels: 3, background: "#202020" } }).jpeg().withExif({ IFD0: { Copyright: "Fotostudio Test" } }).toBuffer();
  const light = await sharp({ create: { width: 1000, height: 600, channels: 3, background: "#f0f0f0" } }).jpeg().toBuffer();
  const a = await renderWatermark(dark);
  const b = await renderWatermark(light);
  assert.equal(a.variante, "hell");
  assert.equal(b.variante, "dunkel");
  assert.ok(Math.abs(a.box.width - 70) <= 2, `Breite ${a.box.width}`);
  assert.ok(a.box.left + a.box.width <= 1000 - 17 && a.box.top + a.box.height <= 600 - 17, "Abstand zum Rand");
  assert.ok((await sharp(a.buf).metadata()).exif.toString("latin1").includes("Fotostudio Test"), "Copyright bleibt in der Web-Fassung");
  fs.rmSync(dir, { recursive: true, force: true });
});

// ------------------------------------------------------------ Nr. 31: © PLATZHIRSCH
test("©-Wasserzeichen: verweigert Herstellerbilder, Umstellung nur mit bestätigten exklusiven Rechten", () => {
  for (const src of [BW_HERO.src, KATALOG_SRCS[0], ...MANUFACTURER_SAMPLES.slice(-3), "/Images/Kueche/quooker-fusion-round-edelstahl.webp"]) {
    assert.throws(() => planWatermark(src, { motiv: "copyright" }), /verweigert|Pfad/, src);
    assert.throws(() => planWatermark(src, { motiv: "copyright", umstellen: true }), /verweigert|Pfad/, src);
  }
  // Herstellerbild, das (fälschlich) im Register mit Häkchen stünde: trotzdem verweigert
  const schmuggel = [{ ...STATIC_IMAGE_RIGHTS[0], datei: "/Images/Wellness/agape-vieques.webp", exklusiveRechteBestaetigt: true, bearbeitung: true }];
  assert.throws(() => planWatermark("/Images/Wellness/agape-vieques.webp", { motiv: "copyright", umstellen: true, register: schmuggel }), /verweigert/);
  // aboutHome: Vorschau ja, ausgeliefertes © nein (exklusiveRechteBestaetigt: false)
  assert.equal(planWatermark("/Images/Home/aboutHome.jpg", { motiv: "copyright" }).rel, "/Images/Home/aboutHome.jpg");
  assert.throws(() => planWatermark("/Images/Home/aboutHome.jpg", { motiv: "copyright", umstellen: true }), /exklusiven Rechten/);
  // auch bearbeitung: true allein reicht für das © nicht
  const nurBearb = [{ ...STATIC_IMAGE_RIGHTS[0], bearbeitung: true }];
  assert.throws(() => planWatermark("/Images/Home/aboutHome.jpg", { motiv: "copyright", umstellen: true, register: nurBearb }), /exklusiven Rechten/);
  const best = [{ ...STATIC_IMAGE_RIGHTS[0], bearbeitung: true, exklusiveRechteBestaetigt: true }];
  assert.equal(planWatermark("/Images/Home/aboutHome.jpg", { motiv: "copyright", umstellen: true, register: best }).entry.exklusiveRechteBestaetigt, true);
});

test("©-Wasserzeichen: unten (7 % Abstand), mittig bzw. rechts-mittig, ~20 % Breite, ~25 % Deckkraft, hell/dunkel, Metadaten bleiben", async () => {
  const W = 2000;
  const H = 1000;
  const dark = await sharp({ create: { width: W, height: H, channels: 3, background: "#202020" } }).png().withExif({ IFD0: { Copyright: "Fotostudio Test", Artist: "Fotostudio Test" } }).toBuffer();
  const light = await sharp({ create: { width: W, height: H, channels: 3, background: "#f0f0f0" } }).png().toBuffer();
  for (const position of ["mitte", "rechtsmitte"]) {
    const r = await renderWatermark(dark, { motiv: "copyright", position });
    assert.equal(r.variante, "hell");
    assert.ok(Math.abs(r.box.width - W * 0.2) <= 2, `Breite ${r.box.width}`);
    assert.ok(Math.abs(r.box.top + r.box.height - H * 0.93) <= 1, `Unterkante ${r.box.top + r.box.height}`);
    assert.ok(Math.abs(r.box.left + r.box.width / 2 - W * POSITION[position]) <= 1, `Mitte ${position}`);
    // Deckkraft: hellster Pixel ≈ 32 + 0,25 × (255 − 32) ≈ 88
    // (sharp stats() ignoriert extract() in derselben Pipeline → erst ausschneiden)
    const region = async (box) => sharp(await sharp(r.buf).extract(box).png().toBuffer()).stats();
    const st = await region(r.box);
    assert.ok(st.channels[0].max >= 75 && st.channels[0].max <= 100, `max ${st.channels[0].max}`);
    // außerhalb des Zeichens unverändert
    const rest = await region({ left: 0, top: 0, width: W, height: r.box.top - 2 });
    assert.equal(rest.channels[0].max, 32);
    const exif = (await sharp(r.buf).metadata()).exif.toString("latin1");
    assert.ok(exif.includes("Fotostudio Test"), "Copyright/Artist des Fotografen bleibt in der Web-Fassung");
  }
  const b = await renderWatermark(light, { motiv: "copyright", position: "mitte" });
  assert.equal(b.variante, "dunkel");
  // bestehende Varianten (Nr. 30) unverändert
  const logo = await renderWatermark(dark);
  assert.ok(Math.abs(logo.box.width - 140) <= 2 && logo.box.left + logo.box.width <= W - 29);
});

const FOTOGRAF_XMP = [
  '<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>',
  '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">',
  '<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmp:CreatorTool="Lightroom">',
  "<dc:creator><rdf:Seq><rdf:li>Fotostudio Test</rdf:li></rdf:Seq></dc:creator>",
  '<dc:rights><rdf:Alt><rdf:li xml:lang="x-default">© Fotostudio Test, Bregenz</rdf:li></rdf:Alt></dc:rights>',
  "</rdf:Description></rdf:RDF></x:xmpmeta>",
  '<?xpacket end="w"?>',
].join("\n");
const fotoEntry = (exklusiveRechteBestaetigt) => ({
  datei: "/Images/Test/foto.jpg",
  creditText: RIGHTS_HOLDER,
  rechteinhaber: RIGHTS_HOLDER,
  urheber: "",
  fotograf: "Fotostudio Test",
  exklusiveRechteBestaetigt,
  bearbeitung: exklusiveRechteBestaetigt,
  dateiVermerk: "Fotostudio Test, Bregenz",
  lizenzSeite: null,
});

test("embed-rights: kein „© Platzhirsch“/Rechteinhaber ohne Bestätigung; Fotografenvermerk (EXIF, XMP) bleibt immer", async () => {
  const jpg = await sharp({ create: { width: 60, height: 40, channels: 3, background: "#706050" } })
    .jpeg()
    .withExif({ IFD0: { Copyright: "Fotostudio Test, Bregenz", Artist: "Fotostudio Test" } })
    .withXmp(FOTOGRAF_XMP)
    .toBuffer();
  const vorher = existingNotices(await sharp(jpg).metadata());
  assert.equal(vorher["XMP Creator (dc:creator)"], "Fotostudio Test");
  assert.equal(vorher["XMP Copyright Notice (dc:rights)"], "© Fotostudio Test, Bregenz");
  assert.equal(vorher["EXIF Copyright"], "Fotostudio Test, Bregenz");

  // ohne Bestätigung
  const a = await embed(await buildPlan(jpg, fotoEntry(false)));
  const xa = jpegXmp(a.buf);
  assert.ok(!xa.includes(`© ${RIGHTS_HOLDER}`), "kein © Platzhirsch ohne Bestätigung");
  assert.ok(!xa.includes("CopyrightOwner"), "kein Rechteinhaber ohne Bestätigung");
  assert.deepEqual(existingNotices(await sharp(a.buf).metadata()), vorher, "Angaben des Fotografen unverändert");
  assert.match(xa, /<photoshop:Credit>Platzhirsch Home Living<\/photoshop:Credit>/);
  assert.ok(xa.includes('xmp:CreatorTool="Lightroom"'), "fremdes XMP bleibt vollständig");

  // mit Bestätigung: Rechteinhaber kommt dazu, Vermerk und Creator des Fotografen bleiben
  const b = await embed(await buildPlan(jpg, fotoEntry(true)));
  const xb = jpegXmp(b.buf);
  assert.match(xb, /<plus:CopyrightOwnerName>Platzhirsch Home Living<\/plus:CopyrightOwnerName>/);
  const nachher = existingNotices(await sharp(b.buf).metadata());
  for (const k of Object.keys(vorher)) assert.equal(nachher[k], vorher[k], `${k} unverändert`);
  assert.equal((xb.match(/<dc:creator>/g) || []).length, 1, "Creator nicht doppelt/überschrieben");
  assert.equal((xb.match(/<dc:rights>/g) || []).length, 1, "Copyright-Vermerk des Fotografen nicht überschrieben");
  // zweiter Lauf ersetzt die eigene Beschreibung, statt sie zu verdoppeln
  const c = await embed(await buildPlan(b.buf, fotoEntry(false)));
  const xc = jpegXmp(c.buf);
  assert.equal((xc.match(/platzhirsch\.studio\/ns\/rechte/g) || []).length, 1);
  assert.ok(!xc.includes("CopyrightOwner"), "Häkchen entfernt → Rechteinhaber wieder weg");
  assert.ok(xc.includes("© Fotostudio Test, Bregenz"));

  // ohne vorhandenes XMP, mit Bestätigung: © Platzhirsch + Fotografenvermerk
  const plain = await sharp({ create: { width: 30, height: 20, channels: 3, background: "#706050" } }).jpeg().toBuffer();
  assert.match(xmpPacket(fotoEntry(true)), /© Platzhirsch Home Living \(Foto: Fotostudio Test, Bregenz\)/);
  assert.match(xmpPacket(fotoEntry(true)), /<dc:creator><rdf:Seq><rdf:li>Fotostudio Test/);
  assert.ok(!xmpPacket(fotoEntry(false)).includes(`© ${RIGHTS_HOLDER}`));
  assert.ok((await embed(await buildPlan(plain, fotoEntry(false)))).pixelGleich);
});

test("embed-rights auf aboutHome.jpg (nur im Speicher): Heidegger-Vermerk bleibt, kein © Platzhirsch", async () => {
  const plan = await planEntry("/Images/Home/aboutHome.jpg");
  assert.match(plan.vorhanden["IPTC Copyright Notice (2:116)"], /Heidegger Fotografie/);
  assert.match(plan.vorhanden["EXIF Copyright"], /Heidegger Fotografie/);
  const res = await embed(plan);
  const xmp = jpegXmp(res.buf);
  assert.ok(!xmp.includes(`© ${RIGHTS_HOLDER}`) && !xmp.includes("CopyrightOwner"));
  assert.match(xmp, /<dc:creator><rdf:Seq><rdf:li>Heidegger Fotografie/);
  const after = existingNotices(await sharp(res.buf).metadata());
  assert.equal(after["IPTC Copyright Notice (2:116)"], plan.vorhanden["IPTC Copyright Notice (2:116)"]);
  assert.equal(after["EXIF Copyright"], plan.vorhanden["EXIF Copyright"]);
});

// ------------------------------------------------------------ Live
const LIVE = process.env.SITEMAP_BASE || process.env.QA_BASE || "http://localhost:3000";
let liveSkip = false;
try {
  const r = await fetch(`${LIVE}/robots.txt`, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) liveSkip = `${LIVE}/robots.txt ${r.status}`;
} catch {
  liveSkip = `${LIVE} nicht erreichbar`;
}

test("live: sitemap-static.xml enthält Bilder, absolut, keine doppelten <loc>, Bilder erreichbar und auf der Seite", { skip: liveSkip, timeout: 600_000 }, async () => {
  const xml = await (await fetch(`${LIVE}/sitemap-static.xml`, { signal: AbortSignal.timeout(300_000) })).text();
  assert.ok(xml.includes(`xmlns:image="${IMAGE_NS}"`));
  const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  assert.equal(new Set(locs).size, locs.length, "doppelte <loc>");
  const imgs = [...xml.matchAll(/<image:loc>([^<]*)<\/image:loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  assert.ok(imgs.length > 0, "keine Bilder in der Sitemap");
  for (const u of imgs) assert.ok(u.startsWith(`${BASE_URL}/`), u);
  for (const u of imgs) assert.equal(ownImage(u) === null || u.endsWith("/aboutHome.jpg"), true);
  const sample = [...new Set(imgs)].filter((_, i, all) => i % Math.max(1, Math.floor(all.length / 6)) === 0).slice(0, 8);
  for (const u of sample) {
    const res = await fetch(u.replace(BASE_URL, LIVE), { method: "HEAD" });
    assert.equal(res.status, 200, u);
  }
  // Stichprobe: die Bilder von /de/bad-wellness stehen wirklich auf der Seite
  // Nur echte %XX-Folgen dekodieren: seit dem Motion-Feinschliff (01.11.2026) steht
  // style="--reveal-start:4%" im HTML, ein nacktes „%“ ließ decodeURIComponent werfen.
  const decodeEscapes = (s) => s.replace(/(?:%[0-9A-Fa-f]{2})+/g, (m) => { try { return decodeURIComponent(m); } catch { return m; } });
  const html = decodeEscapes(await (await fetch(`${LIVE}/de/bad-wellness`, { signal: AbortSignal.timeout(240_000) })).text());
  for (const u of imagesForUrl(`${BASE_URL}/de/bad-wellness`)) assert.ok(html.includes(decodeURI(u.replace(BASE_URL, ""))), `${u} nicht auf /de/bad-wellness`);
  assert.ok(!/"@type":"ImageObject"[^<]*"creditText":"Platzhirsch/.test(html), "kein Platzhirsch-Credit auf Herstellerbildern");
});

test("live: ImageObject mit creditText auf Startseite und Kontakt", { skip: liveSkip, timeout: 600_000 }, async () => {
  for (const p of ["/de", "/en/contact"]) {
    const html = await (await fetch(`${LIVE}${p}`, { signal: AbortSignal.timeout(240_000) })).text();
    const nodes = [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map((m) => JSON.parse(m[1])).filter((n) => n["@type"] === "ImageObject");
    assert.equal(nodes.length, 1, p);
    assert.equal(nodes[0].contentUrl, `${BASE_URL}/Images/Home/aboutHome.jpg`);
    assert.equal(nodes[0].creditText, RIGHTS_HOLDER);
  }
});
