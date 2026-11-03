// Rat 9,5 · T5 Recht: gemeinsame DSE-Sperre (B3), vorbereitete Abschnitte (B4),
// Release-Test in prod-check (B3), Kurzfassung EN/FR/IT (A16), Cookie-Dialog
// nennt die unbedingt nötigen Speicher (A13).
//   node --test tests/unit/rat95-recht-dse.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DSE_FREIGEGEBEN, DSE_SECTIONS, DSE_SECTION_IDS, dseApproved, dseGateOpen, dseOpenSections, dsePublicSections, dseRenderMode } from "../../src/lib/legal/dseSections.js";
import { DSE_FEATURES, anchorsInHtml, missingDseSections } from "../../src/lib/legal/dseFeatures.js";
import { terminMode } from "../../src/lib/booking/config.js";
import { ideenboardShareAvailable } from "../../src/lib/ideenboard/mode.js";
import { einblickeOn } from "../../src/lib/einblicke/config.js";
import { whatsappConfig } from "../../src/lib/whatsapp/config.js";
import { ESSENTIAL_STORAGE, essentialText } from "../../src/components/Cookies/essentialStorage.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const PROD = { NODE_ENV: "production" };
const DEV = { NODE_ENV: "development" };
const allApproved = () => Object.fromEntries(DSE_SECTION_IDS.map((id) => [id, { ...DSE_SECTIONS[id], status: DSE_FREIGEGEBEN }]));

// ------------------------------------------------------------------ Register
test("Register: jeder Abschnitt mit Anker, Titel, Status und Vorschlag; Anker eindeutig", () => {
  const anchors = new Set();
  for (const id of DSE_SECTION_IDS) {
    const s = DSE_SECTIONS[id];
    assert.match(s.anchor, /^[a-z][a-z-]+$/, id);
    assert.ok(!anchors.has(s.anchor), `doppelter Anker ${s.anchor}`);
    anchors.add(s.anchor);
    assert.ok(s.title && s.vorschlag, id);
    assert.ok(["entwurf", DSE_FREIGEGEBEN].includes(s.status), id);
  }
  // Pflicht laut Plan B4: Termin/Video, Einblicke, WhatsApp, Ideenboard, Empfehlung, Service-Anfragen, AR
  for (const id of ["termin", "einblicke", "whatsapp", "ideenboard", "empfehlung", "serviceAnfragen", "ar"]) assert.ok(DSE_SECTIONS[id], id);
  assert.equal(DSE_SECTIONS.whatsapp.anchor, "whatsapp");
  assert.equal(DSE_SECTIONS.einblicke.anchor, "besucher-einblicke");
});

test("Sperre: Produktion nur freigegeben, Entwicklung immer; Darstellung live/entwurf/null", () => {
  const ok = allApproved();
  for (const id of DSE_SECTION_IDS) {
    assert.equal(dseGateOpen(id, DEV), true, id);
    assert.equal(dseGateOpen(id, PROD), dseApproved(id), id);
    assert.equal(dseGateOpen(id, PROD, ok), true, id);
    // 02.11.2026: Abschnitte mit `oeffentlich` (Funktion ohne Schalter) erscheinen
    // auch in Produktion ohne Freigabe – nur mit „Stand“, ohne Entwurfsvermerk.
    assert.equal(dseRenderMode(id, PROD), dseApproved(id) ? "live" : DSE_SECTIONS[id].oeffentlich ? "entwurf" : null, id);
    assert.equal(dseRenderMode(id, DEV), dseApproved(id) ? "live" : "entwurf", id);
  }
  assert.throws(() => dseGateOpen("gibtsnicht", PROD));
  // Stand 30.10.2026: noch kein Abschnitt freigegeben (Paket liegt bei der Kanzlei)
  assert.equal(dseOpenSections().length, DSE_SECTION_IDS.length);
});

test("Funktionen hängen an der Sperre: Termin, Ideenboard-Teilen, Einblicke, WhatsApp", () => {
  const ok = allApproved();
  const termin = {
    NODE_ENV: "production",
    BOOKING_PROVIDER: "frappe",
    FRAPPE_BOOKING_URL: "https://b.example",
    FRAPPE_BOOKING_KEY: "k",
    FRAPPE_BOOKING_SECRET: "s",
    BOOKING_LINK_SECRET: "x".repeat(32),
    BOOKING_MAIL_API_KEY: "re_x",
    BOOKING_MAIL_FROM: "t@platzhirsch.studio",
  };
  assert.equal(terminMode(termin), "off", "Termin zuerst: ohne Abschnitt #termin kein Kalender");
  assert.equal(terminMode(termin, ok), "frappe");
  assert.equal(terminMode(DEV), "mock", "Dev bleibt im Testbetrieb");
  assert.equal(ideenboardShareAvailable({ ...PROD, IDEENBOARD_LOCAL_DIR: "/x" }), false);
  assert.equal(ideenboardShareAvailable({ ...PROD, IDEENBOARD_LOCAL_DIR: "/x" }, ok), true);
  assert.equal(einblickeOn("1", "production"), false);
  assert.equal(einblickeOn("1", "production", ok), true);
  assert.equal(einblickeOn(undefined, "development"), true);
  const wa = { WHATSAPP_NUMBER: "+43557446255", WHATSAPP_PRIVACY_SECTION: "1" };
  assert.equal(whatsappConfig(wa), null);
  assert.ok(whatsappConfig(wa, ok));
});

// ------------------------------------------------------- Abschnitte (B4)
test("Abschnitte: je Register-Eintrag ein Block in ergaenzungen.js, eingebunden in datenschutz.js", () => {
  const src = read("src/components/LegalDrafts/dseErgaenzungen.js");
  const dse = read("src/components/Datenschutz/datenschutz.js");
  for (const id of DSE_SECTION_IDS) {
    const block = src.match(new RegExp(`// <dse:${id}>([\\s\\S]*?)// </dse:${id}>`));
    assert.ok(block, `Block <dse:${id}>`);
    assert.match(block[1], new RegExp(`<Ergaenzung id="${id}">`), id);
    const name = block[1].match(/export function (\w+)\(/)[1];
    assert.match(dse, new RegExp(`<${name} />`), `${name} in datenschutz.js`);
    // Ein freigegebener Abschnitt darf keine offenen [Klammern] mehr haben.
    if (dseApproved(id)) assert.doesNotMatch(block[1].replace(/className=\{[^}]*\}/g, ""), /\[[^\]]+\]/, `${id}: Platzhalter im freigegebenen Text`);
  }
  // Entwurfsvermerk nur außerhalb der Produktion (dseRenderMode), nie ohne Rahmen
  assert.match(src, /mode === "entwurf" &&/);
  assert.match(src, /data-dse-draft=""/);
  // Termin-Mails: Satz im Abschnitt E-Mail-Versand hängt am Abschnitt Termin
  assert.match(dse, /<TerminMailsSatz \/>/);
  assert.match(src, /export function TerminMailsSatz[\s\S]*?dseRenderMode\("termin"/);
  // Einblicke nur, solange der Banner-Schalter sichtbar ist (wie Google Ads)
  assert.match(dse, /consentSections\.has\("besucher-einblicke"\) && <EinblickeAbschnitt \/>/);
});

// ------------------------------------------------------- Release-Test (B3)
const LIVE_ANCHORS = () => anchorsInHtml(read("src/components/Datenschutz/datenschutz.js"));

test("Release-Test: Anker der freigegebenen Fassung decken die Grundfunktionen", () => {
  const ids = LIVE_ANCHORS();
  for (const f of DSE_FEATURES.filter((x) => !x.section)) assert.ok(ids.has(f.anchor), `#${f.anchor} (${f.feature})`);
});

test("Release-Test: Produktion heute – gesperrte Funktionen aus, Funktionen ohne Schalter mit Abschnitt", () => {
  const ids = LIVE_ANCHORS();
  // Ohne eigenen Schalter immer aktiv: ohne ihre Abschnitte meldet der prod-check sie …
  const missing = missingDseSections(PROD, ids).map((m) => m.anchor);
  assert.deepEqual(missing.sort(), ["ar-ansicht", "service-anfragen"]);
  // … deshalb rendert /datenschutz sie seit 02.11.2026 auch in Produktion (oeffentlich).
  const pub = dsePublicSections();
  assert.deepEqual(pub.sort(), ["ar", "serviceAnfragen"]);
  for (const id of pub) assert.equal(dseRenderMode(id, PROD), "entwurf", id);
  const rendered = new Set([...ids, ...pub.map((id) => DSE_SECTIONS[id].anchor)]);
  assert.deepEqual(missingDseSections(PROD, rendered), []);
  // Mit Freigabe und gerendertem Anker: nichts offen
  const all = new Set([...ids, ...DSE_SECTION_IDS.map((id) => DSE_SECTIONS[id].anchor)]);
  assert.deepEqual(missingDseSections(PROD, all), []);
  // Aktive Funktion ohne Anker wird gemeldet
  const fake = [{ feature: "X", anchor: "x", active: () => true }];
  assert.deepEqual(missingDseSections(PROD, new Set(), fake), [{ feature: "X", anchor: "x" }]);
  assert.deepEqual(missingDseSections(PROD, '<h2 id="x">X</h2>', fake), []);
});

test("prod-check: Schritt „dse“ läuft standardmäßig nach probe und prüft Entwürfe", () => {
  const src = read("tools/qa/prod-check.mjs");
  assert.match(src, /"copy,build,manifest,start,probe,dse,tests,/);
  assert.match(src, /\["dse", stepDse, false\]/);
  assert.match(src, /missingDseSections\(env, anchorsInHtml\(html\)\)/);
  assert.match(src, /data-dse-draft/);
  assert.match(src, /NODE_ENV: "production"/);
});

// ------------------------------------------------------- Kurzfassung (A16)
test("Kurzfassung EN/FR/IT: H1 und Lead in der Seitensprache, Volltext deutsch und maßgeblich", async () => {
  const src = read("src/components/Datenschutz/kurzfassung.js");
  for (const l of ["en", "fr", "it"]) assert.match(src, new RegExp(`\\n  ${l}: \\{`), l);
  assert.match(src, /title: "Privacy policy"/);
  assert.match(src, /title: "Protection des données"/);
  assert.match(src, /title: "Informativa sulla privacy"/);
  assert.match(src, /German version is authoritative/);
  assert.match(src, /version allemande fait foi/);
  assert.match(src, /fa fede la versione tedesca/);
  assert.match(src, /<div lang=\{locale\}/);
  // nur Tatsachen aus der freigegebenen Fassung (Stichproben)
  const dse = read("src/components/Datenschutz/datenschutz.js");
  assert.match(dse, /Barichgasse 40–42, 1030 Wien/);
  assert.match(src, /Barichgasse 40–42/);
  assert.match(dse, /APPLICATION_RETENTION = Object\.freeze\(\{ months: 7/);
  assert.match(src, /7 months after the process ends/);
  const banner = read("src/components/Datenschutz/datenbanner.js");
  assert.match(banner, /dseHeader\(locale\)/);
  const page = read("src/app/[locale]/datenschutz/page.js");
  assert.match(page, /<Kurzfassung locale=\{locale\} \/>/);
  assert.doesNotMatch(page, /\(in German\)|\(en allemand\)|\(in tedesco\)/);
  assert.doesNotMatch(page, /fallback-og\.jpg/, "OG-Bild ohne Rechte entfernt");
  // Der deutsche Volltext bleibt lang="de"
  assert.match(read("src/components/Impressum/LegalProse.js"), /lang="de" data-legal-body=""/);
});

// ------------------------------------------------------- Cookie-Dialog (A13)
test("Cookie-Dialog nennt cookieConsent, NEXT_LOCALE und preferredLocale unter Essenziell", () => {
  const names = ESSENTIAL_STORAGE.flatMap((e) => e.names);
  for (const n of ["cookieConsent", "NEXT_LOCALE", "preferredLocale"]) assert.ok(names.includes(n), n);
  // Übernahme 30.10.2026: Texte in src/messages (Cookies.essentialStorage), keine Rückfall-Tabelle mehr.
  const ess = (l) => JSON.parse(read(`src/messages/${l}.json`)).Cookies.essentialStorage;
  for (const l of ["de", "en", "fr", "it"]) for (const k of ["title", "cookieConsent", "locale"]) assert.ok(ess(l)[k], `${l}.${k}`);
  assert.match(ess("de").locale, /nur gesetzt, wenn Sie aktiv die Sprache wechseln/);
  const t = (k) => `msg:${k}`;
  assert.equal(essentialText(t, "title"), "msg:essentialStorage.title");
  assert.doesNotMatch(read("src/components/Cookies/essentialStorage.js"), /FALLBACK/);
  const c = read("src/components/Cookies/cookiecomponent.js");
  assert.match(c, /data-essential-storage=""/);
  // ph_eb steht beim Dienst Besucher-Einblicke (Einwilligung), nicht unter Essenziell
  assert.match(read("src/lib/legal/services.js"), /name: "ph_eb", type: "sessionStorage"/);
  // gleiche Angaben wie die freigegebene DSE
  assert.match(read("src/components/Datenschutz/datenschutz.js"), /<code>NEXT_LOCALE<\/code> \(Cookie, 12 Monate\) und <code>preferredLocale<\/code>/);
});
