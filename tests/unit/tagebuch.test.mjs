// tests/unit/tagebuch.test.mjs — Projekt-Tagebuch (Inhaber-Entscheidung Nr. 13):
// Bildpipeline (EXIF/GPS weg, AVIF+WebP), Eingabe-Schemas, Abbildung
// Freigabe → Referenzprojekt (projektSchema), Einwilligungs-Gate, keine Fakes.
// Run: node --test tests/unit/tagebuch.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { verarbeiteBild, metadatenRest, hatGps } from "../../src/lib/portal/tagebuch/bildPipeline.js";
import { EINWILLIGUNG, PHASEN, referenzFreigabeAktiv, BILD_BREITEN } from "../../src/lib/portal/tagebuch/config.js";
import {
  fotoFormSchema,
  freigabeInputSchema,
  freigabeZuProjekt,
  pruefeVeroeffentlichung,
  pruefungSchema,
  slugVorschlag,
} from "../../src/lib/portal/tagebuch/schemas.js";
import { fotografVon, nennungVon, oeffentlicherOrt } from "../../src/lib/portal/tagebuch/anzeige.js";
import { PROJEKTE, listFreigegebeneProjekte, validateProjekt } from "../../src/lib/content/projekte.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

async function jpegMitGps() {
  return sharp({ create: { width: 1600, height: 1000, channels: 3, background: "#8a8174" } })
    .jpeg()
    .withExif({
      IFD0: { Make: "TestCam", Model: "X1", Artist: "Max Mustermann" },
      IFD3: { GPSLatitudeRef: "N", GPSLatitude: "47/1 32/1 0/1", GPSLongitudeRef: "E", GPSLongitude: "9/1 42/1 0/1" },
    })
    .toBuffer();
}

test("Bildpipeline: GPS erkannt, alle Metadaten entfernt, AVIF + WebP in festen Breiten", async () => {
  const buf = await jpegMitGps();
  const m = await sharp(buf).metadata();
  assert.ok(m.exif, "Testbild hat EXIF");
  assert.equal(hatGps(m.exif), true, "Testbild hat GPS");
  const r = await verarbeiteBild(buf);
  assert.equal(r.ok, true, r.fehler);
  assert.equal(r.gpsGefunden, true);
  assert.equal(r.breite, 1600);
  const ws = [...new Set(r.dateien.map((d) => d.w))];
  assert.deepEqual(ws, BILD_BREITEN.map((w) => Math.min(w, 1600)).filter((w, i, a) => a.indexOf(w) === i));
  for (const d of r.dateien) {
    const meta = await sharp(d.daten).metadata();
    assert.equal(meta.format, d.fmt === "avif" ? "heif" : "webp");
    assert.deepEqual(await metadatenRest(d.daten), { exif: false, xmp: false, iptc: false }, `${d.w}.${d.fmt} ohne Metadaten`);
    assert.ok(!d.daten.includes(Buffer.from("Mustermann")), "kein Künstlername im Byte-Strom");
    assert.equal(meta.width, d.w);
  }
});

test("Bildpipeline: Nicht-Bilder, HEIC und zu kleine Bilder werden abgelehnt", async () => {
  assert.equal((await verarbeiteBild(Buffer.from("%PDF-1.7 xxxxxxxxxxxxxxxx"))).ok, false);
  const heic = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from("ftypheic"), Buffer.alloc(16)]);
  const h = await verarbeiteBild(heic);
  assert.equal(h.ok, false);
  assert.match(h.fehler, /HEIC/);
  const klein = await sharp({ create: { width: 200, height: 150, channels: 3, background: "#fff" } }).png().toBuffer();
  assert.equal((await verarbeiteBild(klein)).status, 422);
});

test("Upload-Formular: Hinweis Pflicht, Skizze/Modell nur als echtes Original", () => {
  assert.equal(fotoFormSchema.safeParse({ phase: "lieferung", hinweis: "ja" }).success, true);
  assert.equal(fotoFormSchema.safeParse({ phase: "lieferung" }).success, false, "ohne Hinweis");
  assert.equal(fotoFormSchema.safeParse({ phase: "skizze", hinweis: "ja" }).success, false, "Skizze ohne echt");
  assert.equal(fotoFormSchema.safeParse({ phase: "skizze", hinweis: "ja", echt: "ja" }).success, true);
  assert.equal(fotoFormSchema.safeParse({ phase: "irgendwas", hinweis: "ja" }).success, false);
  assert.deepEqual(PHASEN.map((p) => p.key), ["skizze", "modell", "rendering", "lieferung", "montage", "vorher", "nachher"]);
  assert.ok(PHASEN.filter((p) => p.nurTeam).every((p) => ["skizze", "modell", "rendering"].includes(p.key)));
});

const ids = ["f-aaaaaaaaaa", "f-bbbbbbbbbb"];
const basis = { fotoIds: ids, anzeige: "anonym", einwilligung: true, version: EINWILLIGUNG.version };

test("Freigabe-Eingabe: Einwilligung + aktuelle Version Pflicht, Vorname/Ort ohne Adresse", () => {
  assert.equal(freigabeInputSchema.safeParse(basis).success, true);
  assert.equal(freigabeInputSchema.safeParse({ ...basis, einwilligung: false }).success, false);
  assert.equal(freigabeInputSchema.safeParse({ ...basis, version: "alt" }).success, false);
  assert.equal(freigabeInputSchema.safeParse({ ...basis, fotoIds: [] }).success, false);
  assert.equal(freigabeInputSchema.safeParse({ ...basis, fotoIds: [ids[0], ids[0]] }).success, false);
  const named = { ...basis, anzeige: "vorname_ort", vorname: "Anna", ort: "Hörbranz" };
  assert.equal(freigabeInputSchema.safeParse(named).success, true);
  for (const ort of ["Landstraße 11", "6911 Lochau", "Seeweg 3", ""]) assert.equal(freigabeInputSchema.safeParse({ ...named, ort }).success, false, ort);
  assert.equal(freigabeInputSchema.safeParse({ ...named, vorname: "Anna Maria Muster" }).success, false, "nur Vorname");
});

const bild = (id, phase, von) => ({ id, phase, von, titel: phase, breite: 1600, hoehe: 1000, varianten: [{ w: 640, h: 400 }, { w: 1280, h: 800 }, { w: 1600, h: 1000 }] });
const FREIGABE = {
  id: "fg-abcdefghij",
  projektId: "PRJ-2026-014",
  kundeId: "CUST-1",
  status: "eingereicht",
  erstellt: "2026-10-29T10:00:00.000Z",
  anzeige: { art: "anonym" },
  bilder: [bild("f-aaaaaaaaaa", "nachher", "kunde"), bild("f-bbbbbbbbbb", "montage", "team")],
  einwilligung: { erteilt: true, version: EINWILLIGUNG.version, zeitpunkt: "2026-10-29T10:00:00.000Z" },
};
const PRUEFUNG = {
  slug: "wohnung-am-bodensee",
  titel: "Wohnung am Bodensee, ruhig eingerichtet",
  typologie: "Wohnung",
  leistungen: ["Wohnen"],
  zeitraumVon: "2026-08",
  zeitraumBis: "2026-10",
  ausgangslage: "Ein heller Wohnraum mit Blick auf den See.",
  loesung: [{ raum: "Wohnen", text: "Sofa, Teppich und Leuchte." }],
  alt: { "f-aaaaaaaaaa": "Wohnraum nach der Montage", "f-bbbbbbbbbb": "Montage des Sofas" },
};

test("Freigabe → Referenzprojekt: nur nach Studio-Prüfung gültig, ohne Adresse, EXIF entfernt", () => {
  const roh = freigabeZuProjekt(FREIGABE);
  assert.equal(roh.freigegeben, false);
  assert.equal(validateProjekt(roh).ok, false, "eingereicht ist nicht öffentlich");
  const v = pruefeVeroeffentlichung(FREIGABE, PRUEFUNG, "Team E2E", "2026-10-30T09:00:00.000Z");
  assert.equal(v.ok, true, v.errors?.join("; "));
  const p = v.projekt;
  assert.equal(p.ort, "am Bodensee");
  assert.equal(p.nennung, undefined, "anonym → keine Nennung");
  assert.deepEqual(p.einwilligung.umfang, ["fotos", "ort"]);
  assert.match(p.einwilligung.ablage, new RegExp(EINWILLIGUNG.version));
  assert.equal(p.bilder[0].src, "/api/portal/tagebuch/referenz/fg-abcdefghij/f-aaaaaaaaaa-1600.webp");
  assert.equal(p.bilder[0].fotograf, "Bauherren");
  assert.equal(p.bilder[1].fotograf, "Platzhirsch Home Living");
  assert.equal(p.reviewedBy, "Team E2E");
  assert.equal(p.herkunft, "tagebuch");
  // listFreigegebeneProjekte akzeptiert es (gleiche Regeln wie redaktionelle Projekte)
  assert.equal(listFreigegebeneProjekte([p]).length, 1);
});

test("Nennung „Vorname, Ort“ nur mit Einwilligung name; Titel ohne Adresse", () => {
  const f = { ...FREIGABE, anzeige: { art: "vorname_ort", vorname: "Anna", ort: "Hörbranz" } };
  const v = pruefeVeroeffentlichung(f, PRUEFUNG, "Team");
  assert.equal(v.ok, true, v.errors?.join("; "));
  assert.equal(v.projekt.nennung, "Anna, Hörbranz");
  assert.ok(v.projekt.einwilligung.umfang.includes("name"));
  assert.equal(v.projekt.bilder[0].fotograf, "Anna");
  assert.equal(nennungVon({ art: "anonym", vorname: "X", ort: "Y" }), null);
  assert.equal(oeffentlicherOrt({ art: "anonym", ort: "Lochau" }), "am Bodensee");
  assert.equal(fotografVon({ phase: "skizze", von: "team" }, {}), "Harald Menghin (Handzeichnung)");
  assert.equal(pruefungSchema.safeParse({ aktion: "veroeffentlichen", ...PRUEFUNG, titel: "Haus in der Seestraße 4" }).success, false);
  assert.equal(pruefungSchema.safeParse({ aktion: "veroeffentlichen", ...PRUEFUNG }).success, true);
  assert.equal(pruefungSchema.safeParse({ aktion: "ablehnen" }).success, true);
  // projekte.js: Nennung ohne Einwilligung „name“ fällt durch
  const bad = { ...v.projekt, einwilligung: { ...v.projekt.einwilligung, umfang: ["fotos", "ort"] } };
  assert.equal(validateProjekt(bad).ok, false);
  // Fremde Bild-URL fällt durch
  assert.equal(validateProjekt({ ...v.projekt, bilder: [{ ...v.projekt.bilder[0], src: "/api/portal/tagebuch/PRJ-2026-014/bild/f-aaaaaaaaaa-640.webp" }] }).ok, false, "private Route nie öffentlich");
  assert.match(slugVorschlag("Hörbranz", "Haus", "fg-abcdefghij"), /^haus-hoerbranz-ghij$/);
});

test("Einwilligungstext: Entwurf → Freigabe in Produktion aus, in Entwicklung an", () => {
  assert.equal(EINWILLIGUNG.status, "entwurf");
  assert.match(EINWILLIGUNG.version, /^tagebuch-referenz-\d{4}-\d{2}-\d{2}-v\d+$/);
  assert.equal(referenzFreigabeAktiv({ NODE_ENV: "production" }), false);
  assert.equal(referenzFreigabeAktiv({ NODE_ENV: "development" }), true);
  assert.ok(EINWILLIGUNG.absaetze.some((a) => /widerrufen/.test(a)), "Widerruf erwähnt");
  assert.ok(EINWILLIGUNG.absaetze.some((a) => /Adresse/.test(a)), "keine Adresse erwähnt");
});

test("Keine erfundenen Inhalte: Demo nur synthetisch und markiert, keine Skizzen/Modelle, Redaktionsliste leer", () => {
  assert.equal(PROJEKTE.length, 0);
  const seed = read("src/lib/portal/tagebuch/seed.js");
  assert.match(seed, /BEISPIEL/);
  assert.doesNotMatch(seed, /phase: "(skizze|modell|rendering)"/, "keine nachgemachte Skizze/Modell/Rendering");
  assert.match(seed, /NODE_ENV !== "production"/);
  // Öffentliche Bilder ohne next/image-Optimizer (Widerruf wirkt sofort)
  const bildKomp = read("src/app/[locale]/projekte/_tagebuch/ReferenzBild.js");
  assert.doesNotMatch(bildKomp, /from "next\/image"/);
  // Private Bild-Route: no-store; öffentliche: nur bei veroeffentlicht
  assert.match(read("src/app/api/portal/tagebuch/[projekt]/bild/[datei]/route.js"), /private, no-store/);
  assert.match(read("src/app/api/portal/tagebuch/referenz/[freigabe]/[datei]/route.js"), /status !== "veroeffentlicht"/);
});

// ---------------------------------------------------------------- Persönliche Team-Logins (Abnahme Service T10)
test("Team-Konten: persönliche Logins mit Rollen statt gemeinsamem Schlüssel, Produktion ohne Konten aus", async () => {
  const K = await import("../../src/lib/portal/tagebuch/konten.js");
  const still = { error() {} };
  // Hash: scrypt mit Salz, Vergleich in konstanter Zeit, falsches Passwort abgelehnt
  const h = K.hashPasswort("ein-langes-passwort");
  assert.match(h, /^scrypt\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/);
  assert.notEqual(h, K.hashPasswort("ein-langes-passwort"), "Salz je Hash");
  assert.equal(K.pruefePasswort("ein-langes-passwort", h), true);
  assert.equal(K.pruefePasswort("falsch", h), false);
  assert.equal(K.pruefePasswort("", h), false);
  assert.equal(K.pruefePasswort("x", "klartext"), false);
  // Produktion: nur TAGEBUCH_TEAM_KONTEN, keine Demo-Konten, kein gemeinsamer Schlüssel
  assert.deepEqual(K.teamKonten({ NODE_ENV: "production" }), []);
  assert.equal(K.teamLoginAktiv({ NODE_ENV: "production", RAUM_TEAM_TOKEN: "x".repeat(30) }), false);
  const env = {
    NODE_ENV: "production",
    TAGEBUCH_TEAM_KONTEN: JSON.stringify([
      { id: "hmenghin", name: "Harald Menghin", rolle: "studio", hash: K.hashPasswort("passwort-harald-1") },
      { id: "mitarbeit1", name: "Mitarbeit Eins", rolle: "mitarbeit", hash: K.hashPasswort("passwort-mit-1") },
      { id: "HMENGHIN", name: "Doppelt", rolle: "studio", hash: K.hashPasswort("x") },
      { id: "ohne-hash", name: "X", rolle: "studio", hash: "klartext" },
      { id: "chef", name: "X", rolle: "admin", hash: K.hashPasswort("x") },
    ]),
  };
  assert.deepEqual(K.parseKonten(env.TAGEBUCH_TEAM_KONTEN, still).map((k) => k.id), ["hmenghin", "mitarbeit1"]);
  assert.deepEqual(K.parseKonten("{kaputt", still), []);
  assert.equal(K.teamLoginAktiv(env), true);
  assert.equal(K.teamDemoKonten(env), false);
  assert.deepEqual(K.anmelden("HMenghin ", "passwort-harald-1", env), { id: "hmenghin", name: "Harald Menghin", rolle: "studio" });
  assert.equal(K.anmelden("hmenghin", "passwort-mit-1", env), null, "Passwort gehört zu einem anderen Konto");
  assert.equal(K.anmelden("unbekannt", "passwort-harald-1", env), null);
  assert.equal(K.anmelden("studio.demo", "dev-studio-tagebuch", env), null, "Demo-Konto gilt nicht neben echten Konten");
  // Rollen: nur "studio" entscheidet über Referenzen
  assert.equal(K.darf({ teamRolle: "studio" }, "referenz_pruefen"), true);
  assert.equal(K.darf({ teamRolle: "mitarbeit" }, "referenz_pruefen"), false);
  assert.equal(K.darf({ teamRolle: "mitarbeit" }, "tagebuch_sehen"), true);
  assert.equal(K.darf(null, "tagebuch_sehen"), false);
  // entferntes Konto: Sitzung sofort ungültig (kontoVon liest die aktuelle Liste)
  assert.equal(K.kontoVon("mitarbeit1", env)?.rolle, "mitarbeit");
  assert.equal(K.kontoVon("mitarbeit1", { ...env, TAGEBUCH_TEAM_KONTEN: "[]" }), null);
  // Entwicklung ohne Variable: zwei Demo-Konten (Mock)
  assert.equal(K.teamDemoKonten({}), true);
  assert.deepEqual(K.anmelden("studio.demo", "dev-studio-tagebuch", {}), { id: "studio.demo", name: "Studio Demo", rolle: "studio" });
  assert.equal(K.anmelden("team.demo", "dev-team-tagebuch", {}).rolle, "mitarbeit");
});

test("Team-Zugang: Tagebuch nutzt das persönliche Cookie, nicht den Raum-Schlüssel; Prüfung nur mit Rolle Studio", () => {
  const zugriff = read("src/lib/portal/tagebuch/zugriff.js");
  assert.doesNotMatch(zugriff, /raumzwilling\/team/);
  assert.match(zugriff, /from "\.\/teamSitzung\.js"/);
  const login = read("src/app/api/portal/tagebuch/team/route.js");
  assert.doesNotMatch(login, /RAUM_TEAM_TOKEN|pruefeTeamToken|schluessel/);
  assert.match(login, /anmelden\(benutzer, passwort\)/);
  const pruef = read("src/app/api/portal/tagebuch/pruefung/[freigabe]/route.js");
  assert.match(pruef, /darf\(team, "referenz_pruefen"\)[\s\S]*403/);
  assert.match(read("src/lib/portal/tagebuch/teamSitzung.js"), /TEAM_COOKIE = "ph_tagebuch_team"/);
});
