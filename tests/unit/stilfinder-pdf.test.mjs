// node --test tests/unit/stilfinder-pdf.test.mjs
// Stil-Finder: Moodboard-PDF (Team „Stil-Finder mit Premium-PDF“).
// Erzeugt für jedes der fünf Profile ein echtes PDF – offline, mit
// künstlichen Katalogzeilen und per sharp erzeugten Bildern – und prüft
// Seitenzahl ≥ 20, Renderzeit < 10 s und Größe < 15 MB. Dazu Schema, Mail-Modus,
// Postausgang mit Frist, Rate-Limit und Rechtstexte.
// profiles.js/questions.js importieren Bilder (next/image) – ein Loader-Hook
// ersetzt sie durch Platzhalter (wie labs-stilfinder-r2.test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerStilfinderHooks } from "./stilfinder-hooks.lib.mjs";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

registerStilfinderHooks();

const sharp = (await import("sharp")).default;
const { PROFILES, PROFILE_ORDER } = await import("../../src/components/Labs/Stilfinder/profiles.js");
const { ROOM_SLOTS, selectRooms, roomCandidates, brandsFor, PER_ROOM, HERO_CATEGORIES, isAccessory } = await import("../../src/lib/stilfinder/rooms.js");
const { buildMoodboardPdf, countPdfPages, toItem, typoQuotes, ImageGateError } = await import("../../src/lib/stilfinder/build.js");
const { toPdfJpeg, isCatalogImagePath, loadAll, createCatalogImageLoader } = await import("../../src/lib/stilfinder/images.js");
const { analyseImage, rejectReason, STATS_VERSION } = await import("../../src/lib/stilfinder/imageStats.js");
const { PRIVACY_PDF, coverFocus } = await import("../../src/lib/stilfinder/document.js");
const { moodboardRequestSchema } = await import("../../src/lib/stilfinder/schema.js");
const { mailMode, LIMITS } = await import("../../src/lib/stilfinder/config.js");
const { buildMoodboardMail } = await import("../../src/lib/stilfinder/mail.js");
const { writeOutbox, pruneOutbox } = await import("../../src/lib/stilfinder/outbox.js");
const { createEmailLimiter } = await import("../../src/lib/stilfinder/limits.js");
const { codes, textOn, contrastRatio } = await import("../../src/lib/stilfinder/palette.js");

const src = (p) => readFileSync(new URL(`../../src/${p}`, import.meta.url), "utf8");

// Fake catalogue: for every slot of every profile two active products.
function fakeCatalog() {
  const byBrand = {};
  let n = 0;
  for (const rooms of Object.values(ROOM_SLOTS))
    for (const slots of Object.values(rooms))
      for (const slot of slots) {
        const [brand, cats] = slot.split("|");
        for (const cat of cats.split(",")) {
          for (let k = 0; k < 2; k++) {
            n++;
            (byBrand[brand] ||= []).push({
              name: `P${n}`,
              produkt_name: `Testobjekt ${n}`,
              path_field: `produkt-test-${n}`,
              marken: brand,
              kategories: cat,
              status: "Aktiv",
              bild_anhangen: [{ bild_anhangen: `/files/test-${n}.webp`, alt_text: `Test ${n}` }],
            });
          }
        }
      }
  return byBrand;
}

// One realistic photo-sized image (noise → no tiny JPEGs that hide size issues).
const photo = await sharp({ create: { width: 1600, height: 1200, channels: 3, background: "#b4b0aa" }, })
  .composite([{ input: Buffer.from(`<svg width="1600" height="1200"><rect x="300" y="250" width="1000" height="700" fill="#4a4846"/><circle cx="800" cy="600" r="220" fill="#e9e6e1"/></svg>`) }])
  .webp({ quality: 90 })
  .toBuffer();
const cutoutPhoto = await sharp({ create: { width: 1400, height: 1400, channels: 3, background: "#ffffff" } })
  .composite([{ input: Buffer.from(`<svg width="1400" height="1400"><rect x="350" y="450" width="700" height="500" fill="#57524c"/></svg>`) }])
  .webp()
  .toBuffer();

let calls = 0;
const fakeLoader = async (cmxPath) => {
  calls++;
  assert.ok(isCatalogImagePath(cmxPath), `nur /cmx-Pfade: ${cmxPath}`);
  return toPdfJpeg(calls % 2 ? photo : cutoutPhoto);
};

test("selectRooms: fünf Räume, je PER_ROOM Stücke, keine Dubletten, reproduzierbar", () => {
  const cat = fakeCatalog();
  for (const key of PROFILE_ORDER) {
    const a = selectRooms(key, cat, 42);
    const b = selectRooms(key, cat, 42);
    assert.deepEqual(Object.keys(a), ["wohnen", "essen", "kueche", "schlafen", "outdoor"]);
    const ids = Object.values(a).flat().map((p) => p.name);
    assert.equal(new Set(ids).size, ids.length, `${key}: keine Dubletten`);
    for (const r of Object.values(a)) assert.equal(r.length, PER_ROOM);
    assert.deepEqual(ids, Object.values(b).flat().map((p) => p.name), "gleicher Seed → gleiche Auswahl");
    assert.ok(brandsFor(key).length >= 3);
  }
});

test("PDF: jedes Profil ≥ 20 Seiten, < 10 s, < 15 MB", { timeout: 120_000 }, async () => {
  const cat = fakeCatalog();
  for (const key of PROFILE_ORDER) {
    const profile = PROFILES[key];
    const t = Date.now();
    const out = await buildMoodboardPdf({
      profile,
      customer: { name: "Ana Krasniqi-Müller", projektLabel: "Neubau", regionLabel: "Vorarlberg" },
      result: {
        shares: [
          { name: profile.name, pct: 64, color: profile.palette[2].hex },
          { name: "Klare Linie", pct: 36, color: "#6D7072" },
        ],
        answers: [{ q: "Raum", a: "Wohnzimmer mit Seeblick" }],
      },
      roomRows: roomCandidates(key, cat, 7),
      loadImage: fakeLoader,
      labs: true,
    });
    const ms = Date.now() - t;
    assert.equal(out.buffer.subarray(0, 5).toString(), "%PDF-");
    const pages = countPdfPages(out.buffer);
    assert.ok(pages >= 20, `${key}: ${pages} Seiten`);
    assert.equal(pages, out.pages, "Seitenplan = Seiten im PDF");
    // Feinschliff P3.6: the 10 s budget is the render time only (the image
    // wait is the loader's, here a fake). Wall clock under load (shoot.mjs or
    // other workflows in parallel: 12.8 s once) gets a generous guard; under
    // CI 30 s. A real regression still shows in timings.render.
    assert.ok(out.timings.render < 10_000, `${key}: render ${out.timings.render} ms`);
    assert.ok(ms < (process.env.CI ? 30_000 : 20_000), `${key}: ${ms} ms gesamt`);
    assert.ok(out.bytes < 15 * 1024 * 1024, `${key}: ${out.bytes} Bytes`);
    // Feinschliff P3.2: the kitchen holds only kitchen, bar stool and lamp (max. 3,
    // one per category) and the bedroom only bedroom pieces – two large frames
    // beat a piece from another room, so 18 instead of 20
    assert.ok(out.items.length >= 18, `${key}: ${out.items.length} Stücke`);
    assert.ok(out.items.every((i) => i.image), "alle Bilder eingebettet");
    const ids = out.items.map((i) => i.id);
    assert.equal(new Set(ids).size, ids.length, "keine Dublette im Dokument");
    if (key === "ruhe") writeFileSync(path.join(os.tmpdir(), "stilfinder-test.pdf"), out.buffer);
  }
});

test("Bild-Tor: ohne Katalog (Backoffice weg) geht KEIN PDF hinaus", { timeout: 60_000 }, async () => {
  await assert.rejects(buildMoodboardPdf({ profile: PROFILES.see, customer: {}, roomRows: {}, loadImage: null }), ImageGateError);
  // Layout bleibt ohne Bilder trotzdem setzbar (nur intern, minImages 0)
  const out = await buildMoodboardPdf({ profile: PROFILES.see, customer: {}, roomRows: {}, loadImage: null, minImages: 0 });
  assert.ok(countPdfPages(out.buffer) >= 20);
});

test("Bild-Tor: alle Bilder laufen ins Timeout → ImageGateError statt Platzhalter-PDF", { timeout: 60_000 }, async () => {
  const cat = fakeCatalog();
  const hanging = () => new Promise(() => {});
  const t = Date.now();
  await assert.rejects(
    buildMoodboardPdf({ profile: PROFILES.ruhe, roomRows: roomCandidates("ruhe", cat, 3), loadImage: hanging }),
    (e) => e instanceof ImageGateError && e.found === 0 && e.code === "busy"
  );
  assert.ok(Date.now() - t < 9_000, "innerhalb des Bildbudgets abgebrochen");
});

test("Bild-Tor: fehlende Bilder werden durch andere Katalogstücke ersetzt", { timeout: 60_000 }, async () => {
  const cat = fakeCatalog();
  let n = 0;
  // jedes dritte Bild fehlt → Ersatz aus den Alternativen
  const flaky = async () => (++n % 3 === 0 ? null : toPdfJpeg(photo));
  const out = await buildMoodboardPdf({ profile: PROFILES.klar, roomRows: roomCandidates("klar", cat, 5), loadImage: flaky });
  assert.ok(out.items.filter((i) => i.image).length >= 16);
  assert.ok(out.timings.imageWaves >= 2, "zweite Welle mit Ersatzstücken");
});

test("Kuratierung: Raum-Hero ist ein Hauptstück, Accessoires höchstens 1 je Raum, nie vorne", () => {
  const cat = fakeCatalog();
  for (const key of PROFILE_ORDER) {
    const rooms = selectRooms(key, cat, 11);
    for (const [room, list] of Object.entries(rooms)) {
      if (!list.length) continue;
      assert.ok(HERO_CATEGORIES[room].includes(list[0].kategories), `${key}/${room}: Hero ${list[0].kategories}`);
      assert.ok(list.filter((p) => isAccessory(p.kategories)).length <= 1, `${key}/${room}: Accessoires`);
    }
  }
  // Füllstücke nie
  const filler = { ...cat, "101 Copenhagen": [{ name: "X1", produkt_name: "Native Chopstick Holders - Birch", path_field: "x", marken: "101 Copenhagen", kategories: "kitchen-accessories", status: "Aktiv", bild_anhangen: [{ bild_anhangen: "/files/x.webp" }] }] };
  const all = Object.values(roomCandidates("warm", filler, 1)).flat();
  assert.ok(!all.some((p) => /Chopstick/.test(p.produkt_name)));
});

test("Bildprüfung: leere Strichleuchte und Farbausreißer werden verworfen", async () => {
  const thinLamp = await sharp({ create: { width: 800, height: 1000, channels: 3, background: "#ffffff" } })
    .composite([{ input: Buffer.from('<svg width="800" height="1000"><rect x="398" y="0" width="3" height="900" fill="#dddddd"/></svg>') }])
    .jpeg()
    .toBuffer();
  const turquoise = await sharp({ create: { width: 800, height: 800, channels: 3, background: "#ffffff" } })
    .composite([{ input: Buffer.from('<svg width="800" height="800"><rect x="150" y="250" width="500" height="320" fill="#71b2ab"/></svg>') }])
    .jpeg()
    .toBuffer();
  const ruhe = PROFILES.ruhe.palette;
  assert.equal(rejectReason(await analyseImage(thinLamp), ruhe), "empty");
  assert.equal(rejectReason(await analyseImage(turquoise), ruhe), "colour");
  assert.equal(rejectReason(await analyseImage(turquoise), PROFILES.see.palette), null, "Bodensee-Töne passen zur Seeterrasse");
  assert.equal(rejectReason(await analyseImage(photo), ruhe), null);
});

test("Bild-Cache auf Platte: zweiter Loader liest ohne Download", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "sf-imgcache-"));
  try {
    let downloads = 0;
    const fetchImpl = async () => {
      downloads++;
      return new Response(photo, { status: 200 });
    };
    const a = createCatalogImageLoader({ server: "http://backoffice.test", fetchImpl, cacheDir: dir });
    const img1 = await a("/cmx/files/test-cache.webp");
    assert.ok(img1?.data?.length > 0 && img1.stats);
    // neuer Loader = neuer Prozess/Worker: liest von Platte
    const b = createCatalogImageLoader({ server: "http://backoffice.test", fetchImpl, cacheDir: dir });
    const img2 = await b("/cmx/files/test-cache.webp");
    assert.equal(downloads, 1, "aus dem Platten-Cache");
    assert.equal(img2.width, img1.width);
    assert.ok(readdirSync(dir).some((n) => n.endsWith(".jpg")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// Druck 03.11. (Inhaber): Querformat-/quadratische Studiofotos (Arc Dining Table auf
// Grauverlauf) dürfen nie so beschnitten werden, dass das Hauptobjekt fehlt.
test("Studiofoto auf Verlauf: Motivbox erkannt, Hochformat-Rahmen → contain, Querformat → Fokus", async () => {
  // quadratisches Studiofoto: Grauverlauf (hell oben, dunkler unten), breiter dunkler Tisch unten
  const grad = Buffer.from(
    '<svg width="1200" height="1200"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9d9d9"/><stop offset="1" stop-color="#a9a9a9"/></linearGradient></defs>' +
      '<rect width="1200" height="1200" fill="url(#g)"/><rect x="70" y="720" width="1060" height="40" fill="#1e1e1e"/><rect x="300" y="760" width="140" height="300" fill="#262626"/><rect x="780" y="760" width="140" height="300" fill="#262626"/></svg>'
  );
  const studio = await sharp(grad).jpeg().toBuffer();
  const s = await analyseImage(studio);
  assert.equal(s.cutout, false, "kein weißer Freisteller");
  assert.equal(s.studio, true, "ruhiger Rand = Studio-Grund");
  assert.ok(s.subject && s.subject.x0 < 0.1 && s.subject.x1 > 0.9 && s.subject.y0 > 0.5 && s.subject.y1 > 0.85, JSON.stringify(s.subject));
  const img = { width: 1200, height: 1200, stats: s };
  // halbe A4-Querseite (421 × 595 pt): das Fenster zeigt nur 71 % der Breite → Tisch würde abgeschnitten
  assert.deepEqual(coverFocus(img, 421, 595), { fit: "contain" });
  // Querformat-Kachel: Fenster hält die Box, Ausschnitt rutscht zum Tisch (unten)
  const wide = coverFocus(img, 300, 150);
  assert.equal(wide.fit, "cover");
  assert.match(wide.position, /^50% (9\d|100)%$/);
  // Raumszene (unruhiger Rand: Regale, Fenster, Boden bis zum Bildrand): keine Box, Zuschnitt wie bisher
  const bars = Array.from({ length: 24 }, (_, i) => `<rect x="${i * 70}" y="0" width="35" height="1200" fill="${i % 2 ? "#3a2f28" : "#d8cfc2"}"/>`).join("");
  const sceneImg = await sharp(Buffer.from(`<svg width="1600" height="1200"><rect width="1600" height="1200" fill="#b4b0aa"/>${bars}<rect x="0" y="800" width="1600" height="400" fill="#6b5a4a"/></svg>`)).jpeg().toBuffer();
  const scene = await analyseImage(sceneImg);
  assert.equal(scene.studio, false);
  assert.equal(scene.subject, null);
  assert.equal(coverFocus({ width: 1600, height: 1200, stats: scene }, 421, 595), null);
  // ohne Box (Altbestand im Cache) keine Änderung
  assert.equal(coverFocus({ width: 1200, height: 1200, stats: { coverage: 1 } }, 421, 595), null);
});

test("Bild-Cache: alte Analyse ohne Motivbox wird aus dem JPEG nachgerechnet, kein Download", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "sf-imgcache-v-"));
  try {
    let downloads = 0;
    const fetchImpl = async () => {
      downloads++;
      return new Response(photo, { status: 200 });
    };
    const a = createCatalogImageLoader({ server: "http://backoffice.test", fetchImpl, cacheDir: dir });
    const img1 = await a("/cmx/files/test-cache-v.webp");
    assert.equal(img1.stats.v, STATS_VERSION);
    // Altbestand simulieren: Stats ohne Version
    const meta = readdirSync(dir).find((n) => n.endsWith(".json"));
    const json = JSON.parse(readFileSync(path.join(dir, meta), "utf8"));
    delete json.stats.v;
    delete json.stats.subject;
    writeFileSync(path.join(dir, meta), JSON.stringify(json));
    const b = createCatalogImageLoader({ server: "http://backoffice.test", fetchImpl, cacheDir: dir });
    const img2 = await b("/cmx/files/test-cache-v.webp");
    assert.equal(downloads, 1, "kein zweiter Download");
    assert.equal(img2.stats.v, STATS_VERSION);
    assert.equal("subject" in img2.stats, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Typografie: gerade Anführungszeichen in Produktnamen → „…“", () => {
  assert.equal(typoQuotes('Reeves "Semi-round Lounge Sofa"'), "Reeves „Semi-round Lounge Sofa“");
  assert.equal(typoQuotes("Aston “Lounge”"), "Aston „Lounge“");
  assert.equal(toItem({ name: "B", produkt_name: 'Belt "Dining"', marken: "Minotti", kategories: "dining-chairs", path_field: "p" }).name, "Belt „Dining“");
});

test("Datenschutz: PDF, Formular und Mail sagen dasselbe", () => {
  // Mehrsprachigkeit (01.11.2026): Formulartexte in intl/de.js (Master)
  const form = src("lib/stilfinder/intl/de.js");
  const mail = buildMoodboardMail({ profile: PROFILES.see, name: null, newsletter: false, labs: true, pages: 30 });
  const core = "Ihre Angaben verwenden wir nur für diesen Versand und speichern sie danach nicht.";
  assert.ok(PRIVACY_PDF.includes(core));
  assert.ok(form.replace(/\s+/g, " ").includes(core), "Formular");
  assert.ok(mail.text.includes(core), "Mail");
  assert.doesNotMatch(PRIVACY_PDF, /Beratungstermin/);
});

test("Palettenkacheln: Textfarbe erreicht 4,5:1 auf allen Profiltönen", () => {
  for (const key of PROFILE_ORDER) for (const c of PROFILES[key].palette) assert.ok(contrastRatio(c.hex, textOn(c.hex)) >= 4.5, `${key} ${c.name} ${c.hex}`);
});

test("Schriften eingebettet: Bodoni Moda und Instrument Sans", { timeout: 60_000 }, async () => {
  const out = await buildMoodboardPdf({ profile: PROFILES.klar, roomRows: {}, loadImage: null, minImages: 0 });
  const s = out.buffer.toString("latin1");
  assert.match(s, /\/FontFile2/);
  assert.match(s, /BodoniModa/);
  assert.match(s, /InstrumentSans/);
});

test("loadAll: Frist überschritten → Platzhalter statt Warten", async () => {
  const slow = () => new Promise((r) => setTimeout(() => r("spät"), 400));
  const fast = async () => "ok";
  const t = Date.now();
  const res = await loadAll([fast, slow, fast], { concurrency: 3, deadlineMs: 120 });
  assert.ok(Date.now() - t < 350);
  assert.deepEqual(res, ["ok", null, "ok"]);
});

test("Bilder: nur /cmx/files mit Bildendung", () => {
  assert.ok(isCatalogImagePath("/cmx/files/minotti-aeron-01.webp"));
  for (const bad of ["/cmx/api/x.jpg", "/cmx/files/../x.jpg", "https://evil/x.jpg", "/cmx/files/a.pdf", "/files/a.jpg"]) assert.ok(!isCatalogImagePath(bad), bad);
  const item = toItem({ name: "A", produkt_name: "Aeron", marken: "Minotti", kategories: "side-tables", path_field: "produkt-aeron", bild_anhangen: [{ bild_anhangen: "/files/minotti-aeron-01.webp" }] });
  assert.equal(item.cmx, "/cmx/files/minotti-aeron-01.webp");
  assert.equal(item.url, "https://platzhirsch.studio/de/produkte/side-tables/produkt-aeron");
});

test("Schema: nur E-Mail Pflicht, Newsletter nie vorausgewählt", () => {
  const ok = moodboardRequestSchema.safeParse({ email: " ana@example.at ", profil: "seeterrasse" });
  assert.ok(ok.success);
  assert.equal(ok.data.email, "ana@example.at");
  assert.equal(ok.data.newsletter, false);
  assert.equal(ok.data.name, null);
  assert.ok(!moodboardRequestSchema.safeParse({ profil: "seeterrasse" }).success, "E-Mail fehlt");
  assert.ok(!moodboardRequestSchema.safeParse({ email: "kein-at", profil: "seeterrasse" }).success);
  assert.ok(!moodboardRequestSchema.safeParse({ email: "a@b.at", profil: "seeterrasse", region: "mars" }).success);
  assert.ok(moodboardRequestSchema.safeParse({ email: "a@b.at", profil: "seeterrasse", name: "Ëlira Çela", region: "li", projekt: "" }).success);
  assert.ok(!moodboardRequestSchema.safeParse({ email: "a@b.at", profil: "seeterrasse", name: "<script>" }).success);
  const client = src("components/Labs/Stilfinder/MoodboardPdfForm.js");
  assert.doesNotMatch(client, /defaultChecked|checked=\{true\}/, "keine vorangekreuzte Checkbox");
  assert.match(client, /Double-Opt-in/);
});

test("Mail-Modus: ohne STILFINDER_MAIL_ENABLED=1 immer Postausgang", () => {
  assert.equal(mailMode({}).mode, "outbox");
  assert.equal(mailMode({ STILFINDER_MAIL_PROVIDER: "resend", STILFINDER_MAIL_API_KEY: "x", STILFINDER_MAIL_FROM: "a@b" }).mode, "outbox");
  assert.equal(mailMode({ STILFINDER_MAIL_ENABLED: "1", STILFINDER_MAIL_PROVIDER: "resend" }).mode, "misconfigured");
  assert.equal(mailMode({ STILFINDER_MAIL_ENABLED: "1", STILFINDER_MAIL_PROVIDER: "resend", STILFINDER_MAIL_API_KEY: "x", STILFINDER_MAIL_FROM: "a@b" }).mode, "live");
});

test("Mail: HTML ohne externe Bilder/Tracking, Text-Hinweis ohne KI-Vermerk (Inhaber 02.11.), Labs-Hinweis, escaped", () => {
  const m = buildMoodboardMail({ profile: PROFILES.salon, name: "<b>Eva</b>", newsletter: true, labs: true, pages: 28 });
  assert.match(m.subject, /Pariser Salon/);
  assert.doesNotMatch(m.html, /<img/i);
  assert.doesNotMatch(m.html, /<b>Eva<\/b>/);
  assert.match(m.html, /&lt;b&gt;Eva/);
  assert.doesNotMatch(m.text, /KI/);
  assert.match(m.text, /keine Zusagen zu Ausführung, Lieferung oder Preis/);
  assert.match(m.text, /Bestätigungslink|bestätigen/);
});

test("Postausgang: schreibt PDF + Mail, löscht nach Frist", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "sf-outbox-"));
  try {
    const now = Date.now();
    const a = await writeOutbox({ dir, pdf: Buffer.from("%PDF-1.7 test"), mail: { subject: "S", html: "<p>h</p>", text: "t" }, meta: { to: "a@b.at" }, now: now - 8 * 864e5 });
    const b = await writeOutbox({ dir, pdf: Buffer.from("%PDF-1.7 test"), mail: { subject: "S", html: "<p>h</p>", text: "t" }, meta: { to: "c@d.at" }, now });
    assert.match(a.id, /^[A-Za-z0-9_-]{20,}$/);
    assert.ok(!existsSync(path.join(dir, a.id)), "abgelaufener Eintrag beim nächsten Schreiben gelöscht");
    assert.equal(await pruneOutbox({ dir, now }), 0);
    assert.ok(readFileSync(path.join(dir, b.id, "moodboard.pdf")).length > 0);
    assert.ok(readFileSync(path.join(dir, b.id, "mail.html"), "utf8").includes("<p>h</p>"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Rate-Limit je E-Mail-Adresse (gehasht, Groß/Klein egal)", () => {
  const lim = createEmailLimiter();
  const now = Date.now();
  for (let i = 0; i < LIMITS.perEmail.max; i++) assert.ok(lim.take("Ana@Example.at", now).ok);
  assert.ok(!lim.take("ana@example.at", now).ok);
  assert.ok(lim.take("ana@example.at", now + LIMITS.perEmail.windowMs + 1).ok);
  assert.ok(!JSON.stringify([...lim.keys()]).includes("example"), "keine Klartext-Adresse im Speicher");
});

test("Palette: Codes korrekt", () => {
  assert.deepEqual(codes("#ffffff"), { hex: "#FFFFFF", rgb: "255 · 255 · 255", cmyk: "0 · 0 · 0 · 0" });
  assert.equal(codes("#000000").cmyk, "0 · 0 · 0 · 100");
});

test("Route: Validierung, Same-Origin, Rate-Limit, kein echter Versand im Dev", () => {
  const route = src("app/api/labs/stilfinder/moodboard/route.js");
  assert.match(route, /guardForm/);
  assert.match(route, /sameOrigin/);
  assert.match(route, /emailLimiter/);
  const service = src("lib/stilfinder/service.js");
  assert.match(service, /mailMode/);
  assert.doesNotMatch(service, /newsletter_subscribe/, "Newsletter wird im Labs-Modus nicht an das Backoffice weitergegeben");
});
