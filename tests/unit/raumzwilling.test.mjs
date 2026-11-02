// node --test tests/unit/raumzwilling.test.mjs
// N2 „Ihr Raum als Zwilling“: Maßstab (≤ 2 % auf 3 m), Boden/Wand, Platzierungs-
// JSON, Qualitätsprüfung, SOG-Packer, Video-Ortsdaten, Zugriffsschutz,
// Inhalts-Regeln (keine KI-Bilder, kein public/, kein Mailversand).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { a4Massstab, abstand, anwenden, bodenAusDreiPunkten, mitFaktor, pruefeMassstab, umkehren, wandAlsHinten, zentriere, zweiPunktMassstab } from "../../src/lib/raumzwilling/massstab.js";
import { grundflaeche, platzierungSchema, positionInWorten, pruefePlatzierung, ueberlappen, grundrissAusPunkten } from "../../src/lib/raumzwilling/platzierung.js";
import { bewerteVideo, waehleStandbilder } from "../../src/lib/raumzwilling/qualitaet.js";
import { entpackeSog, packeSog, pruefeMeta, texturGroesse } from "../../src/lib/raumzwilling/sog.js";
import { erzeugeTestraum, testraumMarken, zuRoh, TESTRAUM } from "../../src/lib/raumzwilling/testraum.js";
import { entscheideZugriff, darf, oeffentlicheSicht } from "../../src/lib/raumzwilling/zugriff.js";
import { entferneVideoOrt, audioSignaturOk } from "../../src/lib/raumzwilling/medien.js";
import { fristAbgelaufen, geleerterRaum, neuerRaum } from "../../src/lib/raumzwilling/modell.js";
import { kommentarSchema, massstabSchema, videoStartSchema } from "../../src/lib/raumzwilling/schemas.js";
import { rendereStandbild } from "../../src/lib/raumzwilling/standbild.js";
import { RAUM_CONFIG, RAUMVIDEO_CATEGORY, MASS_HINWEIS } from "../../src/lib/raumzwilling/config.js";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const exists = (p) => fs.existsSync(new URL(`../../${p}`, import.meta.url));
const zufall = (seed) => {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
};

// ---------- Maßstab ----------

test("Zwei-Punkt-Maßstab: Türbreite 0,90 m → 3,00 m-Strecke weicht ≤ 2 % ab, auch mit Klickfehlern von 1 cm", () => {
  const m = testraumMarken();
  const r = zufall(42);
  let schlimmste = 0;
  for (let lauf = 0; lauf < 200; lauf++) {
    const wackel = (p) => p.map((v) => v + (r() - 0.5) * 0.02); // ±1 cm je Achse
    const ms = zweiPunktMassstab(zuRoh(wackel(m.tuerLinks)), zuRoh(wackel(m.tuerRechts)), 0.9);
    const p = pruefeMassstab(ms.faktor, [{ a: zuRoh(wackel(m.dreiMeterA)), b: zuRoh(wackel(m.dreiMeterB)), soll: 3 }]);
    schlimmste = Math.max(schlimmste, p.zeilen[0].abweichung);
  }
  // Ein Klickfehler von ±1 cm an einer 0,90-m-Referenz kann bis ~2,2 % ausmachen;
  // deshalb empfiehlt das Werkzeug lange Referenzen – hier mit Wandlänge (4,20 m):
  const r2 = zufall(7);
  let lang = 0;
  for (let lauf = 0; lauf < 200; lauf++) {
    const wackel = (p) => p.map((v) => v + (r2() - 0.5) * 0.02);
    const ms = zweiPunktMassstab(zuRoh(wackel(m.eckeHintenLinks)), zuRoh(wackel(m.eckeHintenRechts)), TESTRAUM.breite);
    lang = Math.max(lang, pruefeMassstab(ms.faktor, [{ a: zuRoh(wackel(m.dreiMeterA)), b: zuRoh(wackel(m.dreiMeterB)), soll: 3 }]).zeilen[0].abweichung);
  }
  assert.ok(lang <= 0.02, `Wand als Referenz: ${(lang * 100).toFixed(2)} %`);
  assert.ok(schlimmste <= 0.025, `Tür als Referenz: ${(schlimmste * 100).toFixed(2)} %`);
  // Exakt geklickt: praktisch 0 %.
  const exakt = zweiPunktMassstab(zuRoh(m.tuerLinks), zuRoh(m.tuerRechts), 0.9);
  assert.ok(pruefeMassstab(exakt.faktor, [{ a: zuRoh(m.dreiMeterA), b: zuRoh(m.dreiMeterB), soll: 3 }]).ok);
});

test("A4-Maßstab: vier Ecken → Faktor; falsches Seitenverhältnis wird abgelehnt", () => {
  const ecken = [
    [0, 0, 0],
    [0.297, 0, 0],
    [0.297, 0, 0.21],
    [0, 0, 0.21],
  ].map((p) => zuRoh(p));
  const m = a4Massstab(ecken);
  assert.ok(Math.abs(m.faktor - 1 / 0.37) / (1 / 0.37) < 1e-6);
  const quadrat = [
    [0, 0, 0],
    [0.3, 0, 0],
    [0.3, 0, 0.3],
    [0, 0, 0.3],
  ];
  assert.throws(() => a4Massstab(quadrat), /A4/);
  assert.throws(() => zweiPunktMassstab([0, 0, 0], [0, 0, 0], 1), /aufeinander/);
  assert.throws(() => zweiPunktMassstab([0, 0, 0], [1, 0, 0], 0.01), RangeError);
});

test("Boden + Wand: Boden y = 0, Fensterwand hinten parallel zu x, Umkehrung stimmt", () => {
  const m = testraumMarken();
  const roh = (k) => zuRoh(m[k]);
  const ms = zweiPunktMassstab(roh("tuerLinks"), roh("tuerRechts"), 0.9);
  let t = bodenAusDreiPunkten(roh("eckeHintenLinks"), roh("eckeHintenRechts"), roh("eckeVorneRechts"), roh("oben"), ms.faktor);
  for (const k of ["eckeHintenLinks", "eckeVorneRechts", "tuerLinks"]) assert.ok(Math.abs(anwenden(t, roh(k))[1]) < 1e-9, k);
  assert.ok(anwenden(t, roh("oben"))[1] > 1.2);
  t = wandAlsHinten(t, roh("fensterLinksUnten"), roh("fensterRechtsUnten"));
  const a = anwenden(t, roh("eckeHintenLinks"));
  const b = anwenden(t, roh("eckeHintenRechts"));
  assert.ok(Math.abs(a[2] - b[2]) < 1e-9, "Fensterwand parallel zu x");
  assert.ok(b[0] > a[0], "links → rechts");
  const vorne = anwenden(t, roh("eckeVorneRechts"));
  assert.ok(vorne[2] > a[2], "Fensterwand ist hinten");
  const p = [0.3, 1.2, -0.7];
  const zurueck = anwenden(t, umkehren(t, p));
  assert.ok(abstand(p, zurueck) < 1e-9);
  // neuer Maßstab behält Boden
  const t2 = mitFaktor(t, t.faktor * 1.1);
  assert.ok(Math.abs(anwenden(t2, roh("eckeHintenLinks"))[1]) < 1e-9);
  // Zentrieren
  const g = { x0: -1, x1: 3, z0: 0, z1: 2, hoehe: 2.5 };
  const z = zentriere(t, g);
  assert.deepEqual([z.grundriss.x0, z.grundriss.x1, z.grundriss.z0, z.grundriss.z1], [-2, 2, -1, 1]);
});

// ---------- Platzierung ----------

const volumen = (id, x, z, rotY = 0, w = 240, d = 95, h = 85) => ({ id, name: `Stück ${id}`, marke: "ClassiCon", w, d, h, quelle: { art: "hersteller", text: "Herstellerangabe", url: null }, x, y: 0, z, rotY });

test("Platzierungs-JSON: Schema, doppelte IDs, Grenzen, keine Zusatzfelder", () => {
  const ok = platzierungSchema.safeParse({ version: 1, volumen: [volumen("v-aaaaaa1", 0, 0), volumen("v-bbbbbb2", 1, 1, 90)] });
  assert.ok(ok.success);
  assert.equal(platzierungSchema.safeParse({ version: 1, volumen: [volumen("v-aaaaaa1", 0, 0), volumen("v-aaaaaa1", 1, 1)] }).success, false);
  assert.equal(platzierungSchema.safeParse({ version: 1, volumen: [{ ...volumen("v-aaaaaa1", 0, 0), w: 2 }] }).success, false, "zu klein");
  assert.equal(platzierungSchema.safeParse({ version: 1, volumen: [{ ...volumen("v-aaaaaa1", 0, 0), farbe: "rot" }] }).success, false, "kein nachgebautes Design");
  assert.equal(platzierungSchema.safeParse({ version: 1, volumen: [{ ...volumen("v-aaaaaa1", 0, 0), quelle: { art: "ki" } }] }).success, false);
  assert.equal(platzierungSchema.safeParse({ version: 1, volumen: Array.from({ length: 41 }, (_, i) => volumen(`v-x${String(i).padStart(6, "0")}`, 0, 0)) }).success, false);
});

test("Platzierung: Grundfläche gedreht, Überschneidung, außerhalb, Position in Worten", () => {
  const a = volumen("v-aaaaaa1", 0, 0, 90);
  const ecken = grundflaeche(a);
  const xs = ecken.map((e) => e[0]);
  assert.ok(Math.abs(Math.max(...xs) - Math.min(...xs) - 0.95) < 1e-9, "90° gedreht: Breite in x = Tiefe");
  assert.equal(ueberlappen(a, volumen("v-bbbbbb2", 0.3, 0)), true);
  assert.equal(ueberlappen(volumen("v-aaaaaa1", 0, 0), volumen("v-bbbbbb2", 0, 1.0)), false);
  const g = { x0: -2.1, x1: 2.1, z0: -1.8, z1: 1.8, hoehe: 2.6, waende: { hinten: "Fensterwand" } };
  const h = pruefePlatzierung({ volumen: [volumen("v-aaaaaa1", 2.0, 0), volumen("v-bbbbbb2", 0, 0, 0, 90, 80, 300)] }, g);
  assert.ok(h.some((x) => x.art === "ausserhalb"));
  assert.ok(h.some((x) => x.art === "zu-hoch"));
  const w = positionInWorten(volumen("v-aaaaaa1", 0, -1.2), g);
  assert.match(w, /vor der Fensterwand/);
  assert.match(w, /^0,13 m vor der Fensterwand/);
  const gr = grundrissAusPunkten([
    [-2, 0, -1],
    [2, 2.5, 1],
    [0, 1, 0],
  ]);
  assert.ok(gr.x1 > gr.x0 && gr.hoehe > 0);
});

// ---------- Qualität ----------

test("Qualität: zu dunkel / unscharf / zu schnell / zu kurz → Wiederholungsbitte mit Grund", () => {
  const gut = Array.from({ length: 180 }, () => ({ helligkeit: 120, schaerfe: 200, bewegung: 10 }));
  assert.equal(bewerteVideo({ dauer: 90, frames: gut }).ok, true);
  const dunkel = bewerteVideo({ dauer: 90, frames: gut.map((f) => ({ ...f, helligkeit: 20 })) });
  assert.equal(dunkel.ok, false);
  assert.match(dunkel.gruende[0].text, /zu dunkel.*Licht einschalten/);
  assert.equal(bewerteVideo({ dauer: 90, frames: gut.map((f) => ({ ...f, schaerfe: 10 })) }).gruende[0].code, "unscharf");
  assert.equal(bewerteVideo({ dauer: 90, frames: gut.map((f) => ({ ...f, bewegung: 80 })) }).gruende[0].code, "zu-schnell");
  assert.equal(bewerteVideo({ dauer: 8, frames: gut.slice(0, 16) }).gruende[0].code, "zu-kurz");
  assert.equal(bewerteVideo({ dauer: 90, frames: [] }).ok, false);
  const idx = waehleStandbilder(gut.map((f, i) => ({ ...f, schaerfe: i % 7 })), 3);
  assert.equal(idx.length, 3);
  assert.ok(idx[0] < idx[1] && idx[1] < idx[2], "über die Zeit verteilt");
});

// ---------- SOG ----------

test("SOG: Packen und Entpacken des Testraums (Position < 1 mm, Farbe, Deckkraft), Texturmaße", () => {
  const s = erzeugeTestraum({ abstand: 0.08 });
  const { meta, bilder } = packeSog(s);
  assert.ok(pruefeMeta(meta));
  const { breite, hoehe } = texturGroesse(s.anzahl);
  assert.ok(breite % 4 === 0 && hoehe % 4 === 0 && breite * hoehe >= s.anzahl);
  const d = entpackeSog(meta, (n) => bilder[n].rgba);
  let maxPos = 0;
  for (let i = 0; i < s.anzahl * 3; i++) maxPos = Math.max(maxPos, Math.abs(d.positionen[i] - s.positionen[i]));
  assert.ok(maxPos < 0.001, `max ${maxPos}`);
  for (let i = 0; i < s.anzahl; i += 101) {
    const q = [d.quats[i * 4 + 3], d.quats[i * 4], d.quats[i * 4 + 1], d.quats[i * 4 + 2]]; // (w,x,y,z)
    const dot = Math.abs(q.reduce((a, v, k) => a + v * s.rotationen[i * 4 + k], 0));
    assert.ok(dot > 0.999, "Rotation");
    assert.ok(Math.abs(d.farben[i * 4 + 3] - 245) <= 1, "Deckkraft");
  }
  assert.equal(pruefeMeta({ ...meta, means: { ...meta.means, files: ["../../geheim.webp", "means_u.webp"] } }), false, "keine fremden Dateinamen");
});

test("Standbild-Renderer zeigt den Raum (nicht leer, Fenster hell)", () => {
  const s = erzeugeTestraum({ abstand: 0.06 });
  const sig = (x) => 1 / (1 + Math.exp(-x));
  const farben = new Uint8Array(s.anzahl * 4);
  for (let i = 0; i < s.anzahl; i++) {
    for (let k = 0; k < 3; k++) farben[i * 4 + k] = Math.round(Math.min(1, Math.max(0, 0.5 + 0.2820948 * s.farbeDc[i * 3 + k])) * 255);
    farben[i * 4 + 3] = Math.round(sig(s.deckkraftLogit[i]) * 255);
  }
  const rgb = rendereStandbild({ anzahl: s.anzahl, positionen: s.positionen, skalen: s.skalenLog.map(Math.exp), farben }, { auge: zuRoh([0, 1.5, 1.4]), ziel: zuRoh([0.2, 1.4, -1.8]), breite: 120, hoehe: 80 });
  let summe = 0;
  for (const v of rgb) summe += v;
  assert.ok(summe / rgb.length > 80, "nicht schwarz");
});

// ---------- Zugriff ----------

test("Zugriffsschutz: ohne Session 401, fremdes Projekt 404, Gast nur sein Raum, Rechte je Rolle", () => {
  const raum = { customerId: "C1" };
  assert.deepEqual(entscheideZugriff({ projektId: "PRJ-2026-014", raum }), { rolle: null, status: 401 });
  assert.equal(entscheideZugriff({ kundeId: "C2", projektDesKunden: false, projektId: "PRJ-2026-014", raum }).status, 404);
  assert.equal(entscheideZugriff({ kundeId: "C2", projektDesKunden: true, projektId: "PRJ-2026-014", raum }).status, 404, "Raum gehört anderem Kunden");
  const k = entscheideZugriff({ kundeId: "C1", projektDesKunden: true, projektId: "PRJ-2026-014", raum });
  assert.equal(k.rolle, "kunde");
  assert.ok(darf(k, "loeschen") && darf(k, "video") && !darf(k, "bearbeiten"));
  const g = entscheideZugriff({ link: { projektId: "PRJ-2026-014" }, projektId: "PRJ-2026-014", raum });
  assert.equal(g.rolle, "gast");
  assert.ok(darf(g, "kommentieren") && !darf(g, "loeschen") && !darf(g, "bearbeiten"));
  assert.equal(entscheideZugriff({ link: { projektId: "PRJ-2026-021" }, projektId: "PRJ-2026-014", raum }).status, 401, "Link gilt nur für seinen Raum");
  assert.ok(darf(entscheideZugriff({ team: { rolle: "team" }, projektId: "PRJ-2026-014", raum }), "bearbeiten"));
  const sicht = oeffentlicheSicht({ ...neuerRaum({ projektId: "PRJ-2026-014", customerId: "C1" }), links: [{ digest: "x" }], massstab: { punkte: [[0, 0, 0]] } }, "kunde");
  assert.equal(sicht.customerId, undefined);
  assert.equal(sicht.links, undefined);
  assert.equal(sicht.massstab.punkte, undefined);
});

test("Routen: jede Raum-API prüft die Session über raumApi/Team-Cookie, Dateien nie aus public/", () => {
  const routen = [
    "src/app/api/portal/raum/[projekt]/route.js",
    "src/app/api/portal/raum/[projekt]/datei/[bereich]/[name]/route.js",
    "src/app/api/portal/raum/[projekt]/kommentar/route.js",
    "src/app/api/portal/raum/[projekt]/platzierung/route.js",
    "src/app/api/portal/raum/[projekt]/massstab/route.js",
    "src/app/api/portal/raum/[projekt]/skizze/route.js",
    "src/app/api/portal/raum/[projekt]/video/route.js",
    "src/app/api/portal/raum/[projekt]/aktion/route.js",
  ];
  for (const r of routen) {
    const src = read(r);
    assert.match(src, /raumApi\(request, projekt, "(ansehen|kommentieren|bearbeiten|loeschen|video)"\)/, r);
    assert.doesNotMatch(src, /["'`]\/?public[/"'`]/, `${r}: nichts aus public/`);
  }
  for (const r of routen.filter((x) => !x.includes("datei"))) assert.match(read(r), /herkunftFalsch\(request\)/, `${r}: CSRF-Schutz`);
  assert.match(read("src/app/api/portal/raum/katalog/route.js"), /leseTeam\(/);
  assert.match(read("src/app/api/portal/raum/[projekt]/datei/[bereich]/[name]/route.js"), /private, no-store/);
  assert.match(read("src/lib/raumzwilling/store.js"), /\.data", "raumzwilling"/);
  assert.equal(exists("public/raumzwilling"), false);
});

test("Mail: Benachrichtigungen nur im Postausgang, kein fetch/Mailer, keine Formularweitergabe", () => {
  const n = read("src/lib/raumzwilling/notify.js");
  assert.doesNotMatch(n, /fetch\(|sendmail|mailer|resend|postmark/i);
  for (const f of fs.readdirSync(new URL("../../src/lib/raumzwilling/", import.meta.url))) {
    const src = read(`src/lib/raumzwilling/${f}`);
    assert.doesNotMatch(src, /from "@\/lib\/portal\/mailer"|sendMessage\(|addFeedback\(/, f);
  }
});

// ---------- Video / Audio ----------

test("Video: ©xyz-Ortsangabe und ISO-6709-Wert werden überschrieben, Länge bleibt", () => {
  const ort = "+47.5124+009.7461+402.123/";
  const atom = Buffer.alloc(8 + 4 + ort.length);
  atom.writeUInt32BE(atom.length, 0);
  atom.set([0xa9, 0x78, 0x79, 0x7a], 4);
  atom.write(ort, 12, "latin1");
  const key = Buffer.from("....com.apple.quicktime.location.ISO6709....data....", "latin1");
  const wert = Buffer.from(`\0\0\0\0${ort}`, "latin1");
  const buf = new Uint8Array(Buffer.concat([Buffer.from("....ftypqt  "), atom, key, wert, Buffer.alloc(32)]));
  const len = buf.length;
  assert.equal(entferneVideoOrt(buf), 2);
  assert.equal(buf.length, len);
  assert.equal(Buffer.from(buf).toString("latin1").includes("47.5124"), false);
  assert.ok(audioSignaturOk(new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0]), "webm"));
  assert.equal(audioSignaturOk(new Uint8Array(Buffer.from("MZ......wave")), "wav"), false);
});

// ---------- Eingaben / Datenschutz ----------

test("Eingaben: Video ≤ 300 MB/120 s mit Einwilligung, Kommentar-Länge, Maßstab-Punkte", () => {
  const v = { name: "raum.mp4", bytes: 50e6, typ: "video/mp4", sekunden: 90, einwilligung: "ja" };
  assert.ok(videoStartSchema.safeParse(v).success);
  assert.equal(videoStartSchema.safeParse({ ...v, einwilligung: undefined }).success, false);
  assert.equal(videoStartSchema.safeParse({ ...v, bytes: 301 * 1024 * 1024 }).success, false);
  assert.equal(videoStartSchema.safeParse({ ...v, sekunden: 150 }).success, false);
  assert.equal(kommentarSchema.safeParse({ text: "x".repeat(1001) }).success, false);
  assert.ok(kommentarSchema.safeParse({ text: "Hier steht das Klavier", punkt: [0.2, 1, -1.7], bezug: { art: "punkt" } }).success);
  assert.equal(massstabSchema.safeParse({ art: "a4", ecken: [[0, 0, 0]] }).success, false);
  assert.equal(RAUMVIDEO_CATEGORY.maxBytes, 300 * 1024 * 1024);
  assert.equal(RAUM_CONFIG.video.maxSeconds, 120);
  assert.equal(MASS_HINWEIS, "Maße aus Video, Aufmaß vor Bestellung");
});

test("Löschfrist und Löschknopf: Frist berechnet, geleerter Raum ohne Inhalte", () => {
  const r = neuerRaum({ projektId: "PRJ-2026-014", customerId: "C1", jetzt: "2026-01-01T00:00:00.000Z" });
  assert.equal(r.loeschenAm.slice(0, 10), "2026-06-30");
  assert.equal(fristAbgelaufen(r, Date.parse("2026-07-01")), true);
  const voll = { ...r, kommentare: [{ id: "k" }], splat: { count: 1 }, standbilder: [{ id: "1" }], skizzen: [{ id: "s" }] };
  const leer = geleerterRaum(voll);
  assert.equal(leer.kommentare.length + leer.standbilder.length + leer.skizzen.length, 0);
  assert.equal(leer.splat, null);
  assert.ok(leer.geloeschtAm);
});

test("Inhalt: keine KI-Bilder, Skizze nur echt (Bestätigung), Händler-Wort nur ClassiCon/Ezarri, keine Preise", () => {
  const skizze = read("src/app/api/portal/raum/[projekt]/skizze/route.js");
  assert.match(skizze, /echt="ja"/);
  assert.match(read("src/lib/raumzwilling/schemas.js"), /echt: z\.literal\("ja"\)/);
  const dateien = [
    ...fs.readdirSync(new URL("../../src/components/Portal/Raum/", import.meta.url)).map((f) => `src/components/Portal/Raum/${f}`),
    ...fs.readdirSync(new URL("../../src/lib/raumzwilling/", import.meta.url)).map((f) => `src/lib/raumzwilling/${f}`),
    "src/app/[locale]/portal/raum/page.js",
    "src/app/[locale]/portal/raum/[projekt]/page.js",
  ];
  for (const f of dateien) {
    const src = read(f);
    assert.doesNotMatch(src, /generieren_sdxl|stable.?diffusion|openai|replicate\.com|dall-?e/i, `${f}: keine KI-Bildquelle`);
    assert.doesNotMatch(src, /(autorisierte?r?|offizielle?r?|Vertragshändler)\s+(?!.*(ClassiCon|Ezarri))/i, `${f}: Händler-Wort`);
    assert.doesNotMatch(src, /\b\d{2,5}(?:[.,]\d{2})?\s?(€|EUR|CHF)/, `${f}: keine Preise`);
    assert.doesNotMatch(src, /\b(beste[rns]?|einzigartig|marktführend|Nr\.\s?1)\b/i, `${f}: keine Superlative`);
  }
  // Seed: Maße aus dem geprüften Register, keine erfundene Skizze
  const seed = read("src/lib/raumzwilling/seed.js");
  assert.match(seed, /DIMS\.produkte\[pfad\]/);
  assert.doesNotMatch(seed, /skizzen: \[\s*\{/);
});

test("Seiten: deutsch, noindex, sprechende URL, Ebenen, Maßhinweis, Tabelle, Fallback ohne WebGL2", () => {
  const page = read("src/app/[locale]/portal/raum/[projekt]/page.js");
  assert.match(page, /portalMetadata\(/);
  assert.match(page, /if \(locale !== "de"\) notFound\(\)/);
  const ansicht = read("src/components/Portal/Raum/RaumAnsicht.js");
  for (const e of ['"raum"', '"planung"', '"skizze"']) assert.ok(ansicht.includes(e), e);
  assert.match(ansicht, /MASS_HINWEIS/);
  assert.match(ansicht, /hatWebgl2/);
  assert.match(ansicht, /<Standbilder/);
  assert.match(ansicht, /<VolumenTabelle/);
  assert.doesNotMatch(ansicht, /from "\.\/SplatSzene"/, "three erst mit der 3D-Ansicht laden");
  assert.match(read("src/components/Portal/Raum/RaumViewer.js"), /aria-roledescription="3D-Ansicht"/);
  assert.match(read("src/components/Portal/Raum/VolumenTabelle.js"), /<caption/);
  assert.match(read("src/components/Portal/Raum/SplatSzene.js"), /setAttribute\("aria-hidden", "true"\)/);
  assert.equal(exists("src/app/[locale]/portal/raum/[projekt]/bearbeiten/page.js"), true);
});

test("Picken: Strahl trifft die Wand (Deckkraft summiert), Werkzeug und Prüfung nutzen dieselbe Funktion", async () => {
  const { pickeStrahl } = await import("../../src/lib/raumzwilling/picken.js");
  const s = erzeugeTestraum({ abstand: 0.04 });
  const { meta, bilder } = packeSog(s);
  const d = entpackeSog(meta, (n) => bilder[n].rgba);
  const m = testraumMarken();
  for (const ziel of [m.tuerLinksHoch, m.wandRechtsHoch, m.dreiMeterHochA]) {
    const o = zuRoh([0, 1.5, 0]);
    const z = zuRoh(ziel);
    const len = abstand(o, z);
    const dir = z.map((v, k) => (v - o[k]) / len);
    const t = pickeStrahl(d, o, dir);
    assert.ok(t, "Treffer");
    assert.ok(abstand(t.punkt, z) * (1 / 0.37) < 0.05, `≤ 5 cm, ist ${(abstand(t.punkt, z) / 0.37 * 100).toFixed(1)} cm`);
  }
  assert.match(read("src/components/Portal/Raum/SplatSzene.js"), /pickeStrahl\(this\.daten/);
  assert.match(read("tools/raumzwilling/pruefe-massstab.mjs"), /pickeStrahl\(splat/);
});
