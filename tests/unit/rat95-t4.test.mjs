// tests/unit/rat95-t4.test.mjs – Rat 9,5, Team T4 (Startseite, Kern-USP, Team/Harald-Slots).
// Run: node --test tests/unit/rat95-t4.test.mjs
// Prüft:
//  A14 tools/arbeitsweise/import.mjs: Selbsttest (Testordner) schreibt gültige
//      Slot-Objekte, Probelauf-Objekte erreichen die Seite nie, Pflichtfelder,
//      KI-Sperre, Typ je Slot, kein Probelauf ins Repo, Seitenverhältnisse.
//  A5  Team: ein Kartenformat, Harald-Kapitel über dem Raster, Porträt-Slot aus media.js.
//  A12 homeLinks: Interior ohne „Neubau“.
//  A13 ph-wow-pause erst bei Nutzeraktion (Start-Skript + WowControls).
//  B8  Schritt 05: Werkzeug-Beispiel, als Beispiel beschriftet, in 4 Sprachen.
//  B14 Profilseite Harald: Person ohne Titel, DE.
//  B18 Karte: echte Uferlinie (OSM), Fahrzeiten „ca.“ mit Stand und Quelle.
//  B19 Projekt-Kette: mind. zwei Stufen, Skizze/Modell ohne KI.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";
import { checkEntry, checkManifest, makeTestFolder, outputSize, runImport, SLOT_RATIO, TARGET } from "../../tools/arbeitsweise/import.mjs";
import { MEDIA, RATIO, WERKZEUG_BEISPIEL, validateMedia } from "../../src/lib/arbeitsweise/media.js";
import { arbeitsweiseCopy } from "../../src/lib/arbeitsweise/copy.js";
import { cardFormat } from "../../src/components/Team/teamCopy.js";
import { PROFILE_LOCALES, PROFILE_META, PROFILE_PATH, profileUrl } from "../../src/components/Team/haraldProfil.js";
import { SERVICES } from "../../src/components/Home/homeLinks.js";
import { START_SCRIPT } from "../../src/lib/wow/start-script.js";
import { WOW_SEEN_KEY } from "../../src/lib/wow/config.js";
import { DRIVE_MIN, DRIVE_STAND, SHORE_INNER, SHORE_OUTER } from "../../src/components/Home/bodenseeShore.js";
import { MAP_SPRITE, mapSprite } from "../../src/components/Home/dreilaenderGeo.js";
import { validateProjekt } from "../../src/lib/content/projekte.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const LOCALES = ["de", "en", "fr", "it"];
// Übernahme 30.10.2026: inhalt.team.harald.* und HomePage.region.* stehen in
// src/messages (vorher Tabellen HARALD_CHAPTER in teamCopy.js, B18 in Home/copy.js).
const MSG = Object.fromEntries(LOCALES.map((l) => [l, JSON.parse(read(`src/messages/${l}.json`))]));
const haraldChapter = (l) => MSG[l].inhalt.team.harald;
const B18_COPY = Object.fromEntries(LOCALES.map((l) => { const r = MSG[l].HomePage.region; return [l, { driveTitle: r.driveTitle, minutes: r.driveMinutes, caption: r.mapCaption, mapDesc: r.mapDesc }]; }));
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "rat95-t4-"));

// ---------- A14 Import-Skript ----------

test("A14: Slot-Verhältnisse des Imports = RATIO in media.js, Zielmaße im Verhältnis", () => {
  assert.deepEqual(SLOT_RATIO, RATIO);
  for (const [r, [w, h]] of Object.entries(TARGET)) {
    const [a, b] = r.split("/").map(Number);
    assert.ok(Math.abs(w / h - a / b) < 0.01, r);
  }
  // nie vergrößern, Verhältnis bleibt
  assert.deepEqual(outputSize("3/2", 900, 900), [900, 600]);
  assert.deepEqual(outputSize("21/9", 6000, 4000), [2520, 1080]);
});

test("A14: Selbsttest mit Testordner schreibt gültige Slot-Objekte (AVIF, Maße, Pflichtfelder)", async () => {
  const base = tmp();
  const inDir = await makeTestFolder(path.join(base, "lieferung"));
  const modulePath = path.join(base, "media-import.js");
  const outPublic = path.join(base, "public");
  const report = await runImport({ inDir, outPublic, modulePath, probe: true, fresh: true, log: () => {} });
  assert.deepEqual(report.slots, ["handzeichnung", "modell", "rendering", "portrait"]);
  assert.deepEqual(report.kette, ["skizze"]);
  const mod = await import(pathToFileURL(modulePath).href);
  // gültig für die Prüfung der Seite (bis auf das Probelauf-Kennzeichen) …
  assert.deepEqual(validateMedia(mod.IMPORT_MEDIA, mod.IMPORT_KETTE, { allowProbe: true }), []);
  // … aber nie live
  const live = validateMedia(mod.IMPORT_MEDIA, mod.IMPORT_KETTE);
  assert.ok(live.length >= 5 && live.every((e) => e.includes("Probelauf")), live.join("\n"));
  for (const [key, slot] of Object.entries(mod.IMPORT_MEDIA)) {
    const file = path.join(outPublic, slot.src);
    assert.ok(fs.existsSync(file), slot.src);
    const meta = await sharp(file).metadata();
    assert.equal(meta.format, "heif", `${key}: AVIF`);
    assert.equal(meta.width, slot.width);
    assert.equal(meta.height, slot.height);
    assert.equal(meta.exif, undefined, `${key}: ohne EXIF`);
    const [a, b] = RATIO[key].split("/").map(Number);
    assert.ok(Math.abs(slot.width / slot.height - a / b) < 0.01, `${key}: ${slot.width}×${slot.height}`);
  }
  assert.ok(mod.IMPORT_MEDIA.rendering.srcMobile, "Rendering mit 4:5-Fassung");
});

test("A14: Probelauf schreibt nie ins Repo, unvollständige Lieferung schreibt nichts", async () => {
  const base = tmp();
  const inDir = await makeTestFolder(path.join(base, "lieferung"));
  await assert.rejects(runImport({ inDir, probe: true, log: () => {} }), /nie ins Repo/);
  const m = JSON.parse(fs.readFileSync(path.join(inDir, "material.json"), "utf8"));
  delete m.eintraege[0].einwilligung;
  fs.writeFileSync(path.join(inDir, "material.json"), JSON.stringify(m));
  const modulePath = path.join(base, "x.js");
  await assert.rejects(runImport({ inDir, outPublic: path.join(base, "p"), modulePath, log: () => {} }), /einwilligung/);
  assert.equal(fs.existsSync(modulePath), false);
  assert.equal(fs.existsSync(path.join(base, "p")), false);
});

test("A14: Prüfregeln – Pflichtfelder, KI-Sperre, Typ je Ziel, doppelte Ziele, unbekannte Ziele", () => {
  const ok = { datei: "a.jpg", ziel: "handzeichnung", alt: "Handzeichnung eines Wohnraums mit Fenster", credit: "Handzeichnung: Harald Menghin", einwilligung: "BR-1", kiStufe: "keine", typ: "skizze" };
  assert.deepEqual(checkEntry(ok), []);
  assert.ok(checkEntry({ ...ok, kiStufe: "KI-Upscaling" }).some((e) => e.includes("kiStufe")));
  assert.ok(checkEntry({ ...ok, credit: "Midjourney" }).some((e) => e.includes("KI")));
  assert.ok(checkEntry({ ...ok, typ: "rendering" }).some((e) => e.includes("passt nicht")));
  assert.ok(checkEntry({ ...ok, ziel: "kette.modell", typ: "modell", kiStufe: "retusche" }).some((e) => e.includes("kiStufe")));
  assert.ok(checkEntry({ ...ok, ziel: "wohnzimmer" }).some((e) => e.includes("unbekanntes Ziel")));
  assert.ok(checkEntry({ ...ok, alt: "Bild" }).some((e) => e.includes("alt")));
  assert.ok(checkEntry({ ...ok, datum: "2026-10" }).some((e) => e.includes("MM/JJJJ")));
  assert.ok(checkEntry(ok, () => false).some((e) => e.includes("fehlt im Lieferordner")));
  assert.ok(checkManifest({ eintraege: [ok, ok] }).some((e) => e.includes("doppelt")));
  assert.ok(checkManifest({ eintraege: [] }).length === 1);
});

test("A14: Seite heute ohne importiertes Material (media-import.js leer)", () => {
  for (const [k, v] of Object.entries(MEDIA)) assert.equal(v, null, k);
  assert.match(read("src/lib/arbeitsweise/media-import.js"), /export const IMPORT_MEDIA = \{\};/);
});

// ---------- A5 Team ----------

test("A5: ein Kartenformat – Fotokarten nur, wenn alle ein eigenes Porträt haben", () => {
  assert.equal(cardFormat([{ portrait: "/cms/a.jpg" }, { portrait: null }]), "text");
  assert.equal(cardFormat([{ portrait: "/cms/a.jpg" }, { portrait: "/cms/b.jpg" }]), "photo");
  assert.equal(cardFormat([]), "text");
  const tm = read("src/components/Team/teammember.js");
  assert.match(tm, /cardFormat\(active\) === "photo"/);
  const team = read("src/components/Team/team.js");
  assert.match(team, /<HaraldKapitel locale=\{locale\} \/>/);
  assert.ok(team.indexOf("<HaraldKapitel") < read("src/components/Team/team.js").length);
  assert.match(team, /cardFormat\(withPortraits\(team\)\) === "text" \? portraitsOf/, "kein Doppelporträt Hero/Raster");
});

test("A5: Harald-Kapitel – Porträt nur aus media.js (unsichtbar solange leer), keine Rolle, Texte in 4 Sprachen", () => {
  const k = read("src/components/Team/HaraldKapitel.js");
  assert.match(k, /MEDIA\.portrait/);
  assert.match(k, /hasPortrait && \(/);
  assert.doesNotMatch(k, /jobTitle|roleOf\(|raw\("roles"\)|\.role\b/);
  for (const l of LOCALES) {
    const c = haraldChapter(l);
    assert.equal(c.steps.length, 4);
    assert.ok(c.eyebrow && c.profile && c.stepsLabel, l);
  }
  const all = JSON.stringify(LOCALES.map(haraldChapter));
  assert.doesNotMatch(all, /\b(größt\w*|beste[nrs]?|führend\w*|einzig\w*|Luxus|exklusiv\w*|perfekt\w*)\b|!/i);
});

// ---------- A12, A13 ----------

test("A12: Interior-Karte der Startseite ohne „Neubau“-Vorwahl", () => {
  assert.equal(SERVICES.find((s) => s.key === "interior").thema, "interior");
});

test("A13: ph-wow-pause wird erst bei Nutzeraktion gesetzt (Start-Skript und WowControls)", () => {
  const set = `sessionStorage.setItem("${WOW_SEEN_KEY}",1)`;
  assert.equal(START_SCRIPT.split(set).length - 1, 1, "genau ein Schreibzugriff");
  // der Schreibzugriff steckt in y(), y hängt nur an Eingabe-Ereignissen
  assert.match(START_SCRIPT, new RegExp(`y=function\\(\\)\\{try\\{${set.replace(/[()]/g, "\\$&")}\\}catch\\(e\\)\\{\\}x\\(\\)\\}`));
  assert.match(START_SCRIPT, /"pointerdown keydown wheel touchstart"\.split\(" "\)\.forEach\(function\(e\)\{w\.addEventListener\(e,y,/);
  assert.ok(Buffer.byteLength(START_SCRIPT) <= 900);
  const wc = read("src/components/Wow/WowControls.js");
  const writes = wc.match(/sessionStorage\.setItem\(/g) || [];
  assert.equal(writes.length, 1);
  assert.match(wc, /const markSeen = \(\) => \{\s*try \{\s*sessionStorage\.setItem\(seenKey, "1"\);/);
  assert.match(wc, /SEEN_EVENTS = \["pointerdown", "keydown", "wheel", "touchstart"\]/);
});

// ---------- B8 ----------

test("B8: Schritt 05 zeigt die echte Werkzeug-Ausgabe, beschriftet als Beispiel (kein Kundenprojekt)", () => {
  const b = WERKZEUG_BEISPIEL.planung3d;
  assert.ok(fs.existsSync(path.join(ROOT, "public", b.src)), b.src);
  assert.equal(b.width / b.height, 1.5);
  for (const l of LOCALES) {
    const t = arbeitsweiseCopy(l).STRICH_ZUM_RAUM.beispiel;
    assert.ok(t.caption && t.alt && t.link, l);
    assert.match(t.caption, /Küchenplaner|kitchen planner|planificateur de cuisine|planner per cucine/);
    assert.match(t.caption, /kein Kundenprojekt|not a client project|pas un projet client|non un progetto di un cliente/);
  }
  const page = read("src/components/Arbeitsweise/ArbeitsweisePage.js");
  assert.match(page, /MEDIA\.planung3d\?\.src \|\| SHOW_PLACEHOLDERS \?/, "echter Screenshot hat Vorrang");
  // Design-Jury 30.10.2026 P1-4 (bewusst geänderte Erwartung): am Handy steht die H1 zuerst,
  // das Typo-Blatt folgt Lead und Knopf (DOM-Reihenfolge, kein order-first mehr).
  assert.doesNotMatch(page, /max-md:order-first/, "Typo-Blatt mobil nicht mehr über dem Titel");
});

// ---------- B14 ----------

// 31.10.2026 (bewusst geänderte Erwartung): Profil in allen vier Sprachen,
// übersetzte Pfade aus src/proxy.js (ABOUT_SECTIONS.team "/harald-menghin").
test("B14: Profilseite Harald – vier Sprachen, Person ohne Titel, Porträt nur aus media.js", () => {
  assert.equal(PROFILE_PATH, "/ueber-uns/team/harald-menghin");
  assert.deepEqual([...PROFILE_LOCALES], ["de", "en", "fr", "it"]);
  assert.equal(profileUrl("en"), "https://platzhirsch.studio/en/about-us/team/harald-menghin");
  assert.equal(profileUrl("fr"), "https://platzhirsch.studio/fr/a-propos/equipe/harald-menghin");
  assert.equal(profileUrl("it"), "https://platzhirsch.studio/it/chi-siamo/team/harald-menghin");
  for (const l of PROFILE_LOCALES) {
    assert.ok(PROFILE_META[l].title.length <= 60, l);
    assert.ok(PROFILE_META[l].description.length <= 150, l);
  }
  assert.ok(read("src/proxy.js").includes('team: ["", "/harald-menghin"]'), "proxy.js: Profil-Suffix");
  const page = read("src/app/[locale]/ueber-uns/team/harald-menghin/page.js");
  assert.match(page, /teamPersonSchema\(\{ name: HARALD, locale, pageUrl: PROFILE_URL, description: intro \}\)/);
  assert.doesNotMatch(page, /jobTitle:/);
  assert.match(page, /"ProfilePage"/);
  assert.match(page, /if \(!PROFILE_LOCALES\.includes\(locale\)\) notFound\(\)/);
});

// ---------- B18 ----------

test("B18: Uferlinie aus OSM, Sprite aktuell und ≤ 25 KB, Fahrzeiten mit Stand und Quelle", () => {
  assert.equal(SHORE_OUTER.length, 1);
  assert.ok(SHORE_OUTER[0].length > 200, "echte Uferlinie, keine Handskizze");
  assert.ok(SHORE_INNER.length >= 1, "Inseln");
  const sprite = read(`public${MAP_SPRITE}`);
  assert.equal(sprite, mapSprite());
  assert.ok(Buffer.byteLength(sprite) <= 25_000);
  assert.match(sprite, /id="obersee"/, "alte Kennung für Landing/schema/StadtMap.js");
  assert.match(DRIVE_STAND, /^\d{2}\/\d{4}$/);
  for (const v of Object.values(DRIVE_MIN)) assert.ok(v % 5 === 0 && v > 0 && v < 120);
  for (const l of LOCALES) {
    const c = B18_COPY[l];
    assert.match(c.caption, /OpenStreetMap/);
    assert.match(c.caption, /OSRM/);
    assert.match(c.caption, /\{stand\}/);
    assert.match(c.driveTitle, /ca\.|approx\.|env\./);
    assert.doesNotMatch(JSON.stringify(c), /liefer|deliver|livr|consegn/i, "keine Lieferversprechen");
  }
  assert.match(read("src/components/Home/bodenseeShore.js"), /© OpenStreetMap-Mitwirkende, ODbL/);
});

// ---------- B19 ----------

test("B19: Projekt-Kette – mindestens zwei Stufen, Skizze/Modell ohne KI", () => {
  const bild = (n) => ({ src: `/projekte/test/${n}.avif`, alt: `Bild ${n}`, width: 3000, height: 2000, fotograf: "Studio", nutzungsrecht: true, exifEntfernt: true, ki: "keine" });
  const base = {
    slug: "test",
    freigegeben: true,
    reviewedBy: "Inhaber",
    updatedAt: "2026-10-30",
    titel: "Wohnung am See",
    ort: "am Bodensee",
    typologie: "Wohnung",
    leistungen: ["Wohnen"],
    zeitraum: { von: "2026-01", bis: "2026-06" },
    ausgangslage: "Text",
    loesung: [{ raum: "Wohnen", text: "Text" }],
    bilder: [bild("a")],
    einwilligung: { bauherr: true, datum: "2026-07-01", umfang: ["fotos"], ablage: "A-1" },
    ohneAdresse: true,
    exifEntfernt: true,
  };
  assert.equal(validateProjekt(base).ok, true);
  assert.equal(validateProjekt({ ...base, kette: { raum: "Wohnen", skizze: bild("s"), foto: bild("f") } }).ok, true);
  assert.equal(validateProjekt({ ...base, kette: { raum: "Wohnen", skizze: bild("s") } }).ok, false);
  assert.equal(validateProjekt({ ...base, kette: { raum: "Wohnen", skizze: { ...bild("s"), ki: "retusche" }, foto: bild("f") } }).ok, false);
  const art = read("src/components/Projects/ProjektArtikel.js");
  assert.match(art, /Visualisierung aus der Planung, kein Foto/);
});
