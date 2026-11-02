// tests/unit/einblicke.test.mjs – Besucher-Einblicke (Website-Erfassung).
// Konzept: Marktresearch/digital/features/besucher-einblicke.md
// Offline: kein Server, kein Netz (Frappe-Aufrufe über ein fetch-Double).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { einblickeOn, routeExcluded, deviceOf, rawDays, SERVER } from "../../src/lib/einblicke/config.js";
import { einblickeConsentOf, statisticsConsentOf } from "../../src/lib/attribution.js";
import { darfMessen, privacySignal } from "../../src/lib/einblicke/gate.js";
import { parsePacket } from "../../src/lib/einblicke/schema.js";
import { templateOf, normalizePath, routeOf } from "../../src/lib/einblicke/routes.js";
import { aggregateDay, buildSessions, pathOf, poolHeatmaps, RARE } from "../../src/lib/einblicke/aggregate.js";
import { assertTargetAllowed, frappeConfig, pushDay, splitPayload } from "../../src/lib/einblicke/frappe.server.js";
import { appendRaw, purgeRaw, readRaw, openDays, readAggregate, readPool, viennaDay } from "../../src/lib/einblicke/store.server.js";
import { createLimiter, receive, rejectReason } from "../../src/lib/einblicke/receive.server.js";
import { runTagesabschluss } from "../../src/lib/einblicke/abschluss.server.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const cookieWith = (values) => `foo=1; cookieConsent=${encodeURIComponent(JSON.stringify({ essential: true, ...values }))}; bar=2`;
const SID = "0f8fad5b-d9cb-469f-a165-70867728950e";
const sid = (i) => `0f8fad5b-d9cb-469f-a165-${String(i).padStart(12, "0")}`;
const tmpDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "einblicke-"));

// ---------------------------------------------------------------- Schalter / Tor

test("Schalter: Dev an, Produktion aus bis NEXT_PUBLIC_EINBLICKE=1, \"0\" immer aus", () => {
  assert.equal(einblickeOn(undefined, "development"), true);
  assert.equal(einblickeOn(undefined, "production"), false);
  // Erwartung bewusst ergänzt (Rat 9,5 B3): "1" wirkt in Produktion erst mit
  // freigegebenem DSE-Abschnitt #besucher-einblicke (heute Entwurf).
  assert.equal(einblickeOn("1", "production"), false);
  assert.equal(einblickeOn("1", "production", { einblicke: { anchor: "besucher-einblicke", status: "freigegeben" } }), true);
  assert.equal(einblickeOn("0", "development"), false);
  assert.equal(einblickeOn("true", "production"), false);
});

test("Consent-Kopplung: nur mit eigener Einwilligung \"einblicke\", unabhängig von Google Analytics (QA Recht P1-1, P2-4)", () => {
  const base = { nav: {}, win: {}, path: "/de", on: true };
  assert.equal(darfMessen({ ...base, cookie: "" }), false, "kein Cookie");
  assert.equal(darfMessen({ ...base, cookie: cookieWith({ functional: true, marketing: true, googleAds: true }) }), false, "nur Marketing");
  assert.equal(darfMessen({ ...base, cookie: cookieWith({ statistics: false, googleAnalytics: false, einblicke: false }) }), false, "Statistik abgelehnt");
  assert.equal(darfMessen({ ...base, cookie: "cookieConsent=%7Bkaputt" }), false, "kaputtes Cookie");
  assert.equal(darfMessen({ ...base, cookie: cookieWith({ statistics: true, googleAnalytics: true }) }), false, "GA allein genügt NICHT");
  assert.equal(darfMessen({ ...base, cookie: cookieWith({ statistics: true }) }), false, "Kategorie allein genügt NICHT (alter Cookie)");
  assert.equal(darfMessen({ ...base, cookie: cookieWith({ statistics: true, googleAnalytics: false, einblicke: true }) }), true, "nur Einblicke");
  // Objekt aus ph-consent-change hat Vorrang vor dem Cookie (Widerruf ohne Reload).
  assert.equal(darfMessen({ ...base, cookie: cookieWith({ einblicke: true }), consent: { statistics: true, googleAnalytics: true, einblicke: false } }), false);
  assert.equal(darfMessen({ ...base, cookie: cookieWith({ einblicke: true }), on: false }), false, "Schalter aus");
  // GA umgekehrt: Einblicke allein ist keine GA-Einwilligung, auch wenn die Kategorie an ist.
  assert.equal(statisticsConsentOf({ statistics: true, googleAnalytics: false, einblicke: true }), false);
  assert.equal(statisticsConsentOf({ statistics: true, googleAnalytics: true, einblicke: false }), true);
  assert.equal(statisticsConsentOf({ statistics: true }), true, "alter Cookie ohne Dienst-Schlüssel");
  assert.equal(einblickeConsentOf({ statistics: true, googleAnalytics: true }), false);
  // Sammler und Lader prüfen denselben Schlüssel.
  assert.ok(read("src/lib/einblicke/client.js").includes("einblickeConsentOf(readConsent(D.cookie))"));
  assert.doesNotMatch(read("src/lib/einblicke/client.js") + read("src/lib/einblicke/gate.js"), /statisticsConsentOf/);
  assert.ok(read("src/components/Einblicke/EinblickeLoader.js").includes("einblickeAllowed("));
});

test("Banner: eigener Dienst \"einblicke\" in Register, Texten (4 Sprachen) und Dialog – nur solange der Schalter an ist", async () => {
  const S = await import("../../src/lib/legal/services.js");
  const { EINBLICKE_CONSENT_COPY } = await import("../../src/lib/einblicke/consentCopy.js");
  const { pickClientMessages } = await import("../../src/components/Reusable/clientMessages.js");
  const svc = S.getService("einblicke");
  assert.equal(svc.banner.category, "statistics");
  assert.match(svc.name, /kein Drittanbieter/);
  assert.match(svc.retention, /14 Tage/);
  assert.deepEqual(S.visibleConsentServices({ einblickeActive: true }).statistics, ["googleAnalytics", "einblicke"]);
  assert.deepEqual(S.visibleConsentServices({ einblickeActive: false }).statistics, ["googleAnalytics"]);
  for (const l of ["de", "en", "fr", "it"]) {
    const m = JSON.parse(read(`src/messages/${l}.json`));
    assert.deepEqual(EINBLICKE_CONSENT_COPY[l], m.Cookies.einblicke, `${l}: consentCopy.js = messages`);
    for (const k of ["banner", "bannerTextShort", "statistics", "description", "purpose"]) assert.ok(m.Cookies.einblicke[k], `${l}: ${k}`);
    assert.match(m.Cookies.einblicke.statistics, /Google Analytics/, `${l}: Kategorie nennt beide Dienste`);
    assert.ok(m.Cookies.einblicke.bannerTextShort.length <= 175, `${l}: Handy-Satz kurz`);
    assert.equal(pickClientMessages(m).Cookies.einblicke, undefined, `${l}: nicht in den Client-Messages`);
  }
  const banner = read("src/components/Cookies/cookiecomponent.js");
  assert.ok(banner.includes('import("@/lib/einblicke/consentCopy")'), "Texte als eigener Chunk");
  assert.ok(banner.includes("einblicke: Boolean(einblicke)"), "Alle akzeptieren nur mit sichtbarem Dienst");
  assert.ok(banner.includes("statistics: Boolean(consent.googleAnalytics || consent.einblicke)"));
});

test("DNT und GPC sperren, ausgeschlossene Routen sperren", () => {
  const ok = { cookie: cookieWith({ statistics: true, einblicke: true }), on: true };
  assert.equal(privacySignal({ doNotTrack: "1" }), true);
  assert.equal(privacySignal({ globalPrivacyControl: true }), true);
  assert.equal(privacySignal({}, { doNotTrack: "1" }), true);
  assert.equal(privacySignal({ doNotTrack: "0", globalPrivacyControl: false }, {}), false);
  assert.equal(darfMessen({ ...ok, nav: { globalPrivacyControl: true }, path: "/de" }), false);
  assert.equal(darfMessen({ ...ok, nav: { doNotTrack: "1" }, path: "/de" }), false);
  for (const p of ["/de/portal", "/de/portal/projekte/x", "/de/upload", "/en/upload/abc", "/de/zahlung/anzahlung/t", "/de/preview/einblicke", "/de/labs/x/postausgang", "/de/ideenboard/abc123XYZ", "/en/ideenboard/x", "/de/wunschliste/k3yT0ken", "/de/termin/testraum"]) {
    assert.equal(routeExcluded(p), true, p);
    assert.equal(darfMessen({ ...ok, nav: {}, path: p }), false, p);
  }
  for (const p of ["/de", "/de/kontakt", "/de/produkte/lamps/lamps-1", "/de/portalseite", "/de/ideenboard", "/de/wunschliste/verwalten", "/de/termin"]) assert.equal(routeExcluded(p), false, p);
});

test("Gerätegruppe aus der Breite, Rohdaten höchstens 14 Tage", () => {
  assert.deepEqual([deviceOf(390), deviceOf(767), deviceOf(768), deviceOf(1199), deviceOf(1200)], ["m", "m", "t", "t", "d"]);
  assert.equal(rawDays(undefined), 14);
  assert.equal(rawDays("30"), 14);
  assert.equal(rawDays("7"), 7);
});

test("event.js: ohne Warteschlange (Tor zu) wird nichts gesammelt", async () => {
  const { einblicke, einblickeAusGa } = await import("../../src/lib/einblicke/event.js");
  const prev = globalThis.window;
  globalThis.window = {};
  try {
    einblicke("ziel", { t: "anfrage" });
    assert.equal(globalThis.window.__phEb, undefined);
    globalThis.window.__phEb = [];
    einblickeAusGa("generate_lead", { form: "kontakt", email: "x@y.z", transaction_id: "L-1" });
    einblickeAusGa("page_view", {});
    einblickeAusGa("kuechenplaner_uebergabe", {});
    assert.deepEqual(globalThis.window.__phEb, [
      ["ziel", { t: "anfrage", f: "kontakt" }],
      ["ziel", { t: "planer", f: undefined }],
      ["planer", { n: "kuechenplaner", a: "uebergabe" }],
    ]);
  } finally {
    globalThis.window = prev;
  }
});

test("event.js: „Termin mit diesem Plan“ (kuechenplaner_termin) zählt als Planer-Übergabe", async () => {
  const { einblickeAusGa } = await import("../../src/lib/einblicke/event.js");
  const prev = globalThis.window;
  globalThis.window = { __phEb: [] };
  try {
    einblickeAusGa("kuechenplaner_termin", {});
    assert.deepEqual(globalThis.window.__phEb, [
      ["ziel", { t: "planer", f: undefined }],
      ["planer", { n: "kuechenplaner", a: "uebergabe" }],
    ]);
  } finally {
    globalThis.window = prev;
  }
});

test("analytics.trackEvent reicht Ziele an die Einblicke weiter (eine Zeile)", () => {
  const src = read("src/lib/analytics.js");
  assert.match(src, /import \{ einblickeAusGa \} from "\.\/einblicke\/event\.js";/);
  assert.match(src, /export function trackEvent\(name, params = \{\}\) \{[\s\S]{0,300}einblickeAusGa\(name, params\);/);
});

// ---------------------------------------------------------------- Größe

test("Sammler < 4 KB gzip (minifiziert mit SWC wie im Build)", async () => {
  const require = createRequire(import.meta.url);
  const swc = require("next/dist/build/swc");
  if (swc.loadBindings) await swc.loadBindings();
  const strip = (f) => read(f).replace(/^import[^;]+;\s*$/gm, "");
  const deps = ["src/lib/attribution.js", "src/lib/einblicke/config.js", "src/lib/einblicke/selector.js"].map((f) => strip(f).replace(/^export /gm, "")).join("\n");
  const code = deps.replace(/process\.env\.\w+/g, "undefined").replace("const LIMITS", "const L") + "\n" + strip("src/lib/einblicke/client.js");
  const out = await swc.minify(code, { compress: { toplevel: true, passes: 2 }, mangle: { toplevel: true }, module: true });
  const size = zlib.gzipSync(out.code, { level: 9 }).length;
  console.log(`einblicke client gzip: ${size} B`);
  assert.ok(size < 4096, `${size} B`);
});

test("Sammler liest keine Werte, keine Tasten, keinen Text", () => {
  const src = read("src/lib/einblicke/client.js").replace(/^\s*\/\/.*$/gm, "");
  for (const bad of [/\.value\b/, /keydown|keyup|keypress|"input"|"change"/, /textContent|innerText|innerHTML|outerHTML/, /userAgent|localStorage|document\.referrer|getSelection|clipboard/]) {
    assert.doesNotMatch(src, bad, String(bad));
  }
  assert.match(src, /sendBeacon/);
  assert.match(src, /passive: true/);
});

// ---------------------------------------------------------------- Schema

const pv = (p = "/de/kontakt", extra = {}) => ["pv", { p, dc: "d", vw: 1440, vh: 900, dh: 3000, ...extra }];

test("Schema: gültiges Paket, unbekannte Ereignisse/Felder fallen einzeln weg", () => {
  const out = parsePacket({
    v: 1,
    sid: SID,
    seq: 1,
    pv: 1,
    e: [
      pv("/de/kontakt", { ch: "Organisch", prev: "/de" }),
      ["c", { s: "main>#formular>button:1", ex: 1, ey: 2, col: 3, y: 400 }],
      ["c", { s: "main>#x", ex: 1, ey: 2, col: 3, y: 400, text: "Hallo" }],
      ["fo", { f: "kontakt", b: ["email", "nachricht"], l: "nachricht" }],
      ["fo", { f: "kontakt", b: ["max@example.com"], l: "" }],
      ["key", { k: "a" }],
      ["g", { t: "anfrage", f: "kontakt" }],
      ["pl", { n: "kuechenplaner", a: "schritt", s: "fronten" }],
      ["pl", { n: "kuechenplaner", a: "schritt", s: "wohnzimmer" }],
      ["err", { t: "TypeError", src: "page.js", l: 12 }],
      ["err", { t: "TypeError", msg: "Cannot read x of user max" }],
    ],
  });
  assert.ok(out);
  assert.deepEqual(out.e.map((e) => e[0]), ["pv", "c", "fo", "g", "pl", "err"]);
});

test("Schema: Umschlag streng, Query im Pfad und ausgeschlossene Routen verworfen", () => {
  const env = (e, extra = {}) => ({ v: 1, sid: SID, seq: 1, pv: 1, e, ...extra });
  assert.equal(parsePacket(env([pv()], { ip: "1.2.3.4" })), null, "Zusatzfeld im Umschlag");
  assert.equal(parsePacket(env([pv()], { sid: "nicht-uuid" })), null);
  assert.equal(parsePacket(env([pv()], { v: 2 })), null);
  assert.equal(parsePacket(env([])), null);
  assert.equal(parsePacket(env([pv("/de/kontakt?email=a@b.c")])), null, "Query → Ereignis weg → leer");
  assert.equal(parsePacket(env([pv("/de/portal/projekte/1")])), null, "Portal");
  assert.equal(parsePacket(env([pv("/de", { ch: "evil.example" })])), null, "nur Kanal-Labels");
  const prev = parsePacket(env([pv("/de", { prev: "/de/upload/abc" })]));
  assert.equal(prev.e[0][1].prev, undefined, "prev auf ausgeschlossener Route wird entfernt");
});

// ---------------------------------------------------------------- Routen

test("Route → Vorlage", () => {
  assert.equal(templateOf("/de/produkte/lamps/lamps-2097-18"), "/de/produkte/[category]/[product]");
  assert.equal(templateOf("/en/produkte/lamps"), "/en/produkte/[category]");
  assert.equal(templateOf("/de/ueber-uns/marken/minotti/sofas"), "/de/ueber-uns/marken/[title]/[collection]");
  assert.equal(templateOf("/de/kontakt"), "/de/kontakt");
  assert.equal(templateOf("/de"), "/de");
  assert.equal(normalizePath("/de/kontakt/?x=1#y"), "/de/kontakt");
  // übersetzte Abschnitte, gleiche Vorlage
  assert.equal(templateOf("/en/products/lamps/lamps-1"), "/en/produkte/[category]/[product]");
  assert.equal(templateOf("/it/chi-siamo/marche/minotti"), "/it/ueber-uns/marken/[title]");
  assert.equal(templateOf("/en/about-us/team"), "/en/about-us/team");
  assert.equal(templateOf("/fr/contact"), "/fr/contact");
});

test("404 und unbekannte URLs nie wörtlich (QA Recht P2-3)", () => {
  for (const p of ["/de/max-mustermann", "/de/kontakt/anna-muster", "/en/ueber-uns/xyz/abc/def", "/de/gibt/es/nicht/x", "/max", "/xx/kontakt"]) {
    assert.ok(templateOf(p).endsWith("/(404)"), p);
    assert.ok(routeOf(p).endsWith("/(404)"), p);
    assert.ok(!routeOf(p).includes("muster"), p);
  }
  assert.equal(routeOf("/en/max-mustermann"), "/en/(404)");
  assert.equal(routeOf("/de/kontakt"), "/de/kontakt");
  assert.equal(routeOf("/de/produkte/lamps/lamps-1"), "/de/produkte/lamps/lamps-1");
  // im Aggregat: Seite, Heatmap, Pfad und Signal tragen nur "(404)"
  const recs = [1, 2].flatMap((i) => session(i, { pages: ["/de/max-mustermann"], extra: [["sg", { k: "rage", s: "main>#hero>a:1" }]] }));
  const text = JSON.stringify(aggregateDay(recs, { datum: "2026-10-28" }));
  assert.doesNotMatch(text, /mustermann/);
  assert.match(text, /\/de\/\(404\)/);
});

test("Jeder Seitenordner unter src/app/[locale] ist Vorlage, bekannte Seite oder ausgeschlossen (QA Recht P1-3)", () => {
  const base = path.join(ROOT, "src", "app", "[locale]");
  const pages = [];
  (function walk(dir, rel) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const r = `${rel}/${e.name}`;
      const p = path.join(dir, e.name);
      if (fs.readdirSync(p).some((f) => /^page\.(?:js|jsx|ts|tsx)$/.test(f))) pages.push(r);
      walk(p, r);
    }
  })(base, "");
  assert.ok(pages.length > 50);
  for (const folder of pages) {
    if (folder === "/[slug]" || folder === "/[...rest]") continue; // übersetzte Slugs (utils/routing.js) bzw. 404
    // Beispielwert für jeden [param]: wie ein Token aussehend
    const sample = `/de${folder.replace(/\[\.{0,3}[^\]]+\]/g, "aB3xY9kQ")}`;
    if (routeExcluded(sample)) continue;
    const tpl = templateOf(sample);
    assert.ok(!tpl.endsWith("/(404)"), `${folder}: weder in routes.js STATIC/TABLE noch in config.js EXCLUDED`);
    if (folder.includes("[")) assert.ok(!tpl.includes("aB3xY9kQ"), `${folder}: dynamisches Segment ohne Vorlage → Wert ginge wörtlich nach Frappe`);
  }
  // die beiden Teilungs-Routen mit Schlüssel im Pfad
  for (const p of ["/de/ideenboard/abc123XYZ", "/de/wunschliste/abc123XYZ"]) assert.equal(routeExcluded(p), true, p);
});

// ---------------------------------------------------------------- Aggregat

function session(i, { ch = "Organisch", pages = ["/de", "/de/kontakt"], goal = null, dc = "d", extra = [] } = {}) {
  const recs = [];
  pages.forEach((p, idx) => {
    const e = [pv(p, { dc, vw: dc === "m" ? 390 : 1440, ...(idx === 0 ? { ch } : { prev: pages[idx - 1] }) }), ["sc", { max: idx === 0 ? 100 : 50 }], ["c", { s: "main>#hero>a:1", ex: 500, ey: 500, col: 10, y: 410 }]];
    if (idx === pages.length - 1) {
      if (goal) e.push(["g", { t: goal, f: "kontakt" }]);
      e.push(...extra);
    }
    recs.push({ sid: sid(i), seq: idx + 1, pv: idx + 1, ts_min: `2026-10-28T10:${String(idx).padStart(2, "0")}:00.000Z`, e });
  });
  return recs;
}

test("Aggregat: Heatmap, Scroll-Histogramm, duenn, keine sid im Ergebnis", () => {
  const recs = [1, 2, 3].flatMap((i) => session(i));
  const agg = aggregateDay(recs, { datum: "2026-10-28", k: 5, now: new Date("2026-10-29T03:00:00.000Z") }); // feste Zeit: sonst trifft „erzeugt“ zwischen 10 und 11 Uhr UTC /T10:/
  assert.equal(agg.schema, 1);
  const h = agg.heatmaps.find((x) => x.seite === "/de/kontakt" && x.geraet === "Desktop");
  assert.equal(h.name, "/de/kontakt|Desktop|2026-10-28");
  assert.equal(h.besuche, 3);
  assert.equal(h.duenn, 1);
  assert.deepEqual(h.klick_raster.zellen, [[10, 10, 3]]);
  assert.equal(h.element_klicks[0].sel, "main>#hero>a:1");
  assert.deepEqual(h.element_klicks[0].pkt, [[10, 10, 3]]);
  assert.equal(h.scroll_histogramm.length, 20);
  assert.equal(h.scroll_histogramm[9], 1, "50 % erreicht");
  assert.equal(h.scroll_histogramm[10], 0, "55 % nicht");
  const text = JSON.stringify(agg);
  assert.doesNotMatch(text, /0f8fad5b/, "keine sid");
  assert.doesNotMatch(text, /T10:/, "keine Uhrzeit");
});

test("Aggregat: k-Anonymität für Pfade, Einstiege und Signale", () => {
  const recs = [
    ...[1, 2, 3, 4, 5, 6].flatMap((i) => session(i, { goal: "anfrage" })),
    ...session(7, { pages: ["/de/impressum"], ch: "KI-Suche" }),
    ...[8, 9, 10, 11, 12].flatMap((i) => session(i, { pages: ["/de/produkte"], extra: [["sg", { k: "rage", s: "main>#filter>button:2" }]] })),
    ...session(13, { pages: ["/de/produkte"], extra: [["sg", { k: "dead", s: "main>#galerie>img:1" }]] }),
  ];
  const agg = aggregateDay(recs, { datum: "2026-10-28", k: 5 });
  const all = agg.pfade.find((p) => p.geraet === "Alle" && p.herkunft === "Alle");
  assert.equal(all.sitzungen, 13);
  assert.deepEqual(all.top_pfade[0], { pfad: ["/de", "/de/kontakt", "ziel:anfrage"], n: 6 });
  assert.ok(!JSON.stringify(all).includes("/de/impressum"), "Einzelsitzung erscheint nicht");
  assert.ok(all.einstiege.some((e) => e.vorlage === RARE && e.n === 1));
  assert.equal(all.ziele.anfrage, 6);
  assert.equal(all.ziel_quote, 46.2);
  assert.ok(all.sankey.kanten.every((e) => e.n >= 5 || e.nach.endsWith(RARE)), "Kanten < k nur zu (selten)");
  assert.ok(all.sankey.knoten.every((n) => !n.vorlage.includes("impressum")));
  const ki = agg.pfade.find((p) => p.herkunft === "KI-Suche" && p.geraet === "Alle");
  assert.deepEqual(ki.top_pfade, [{ pfad: [RARE], n: 1 }]);
  const rage = agg.signale.find((s) => s.typ === "Rage-Klick");
  assert.equal(rage.ziel, "main>#filter>button:2");
  assert.equal(rage.sitzungen, 5);
  const dead = agg.signale.find((s) => s.typ === "Toter Klick");
  assert.equal(dead.ziel, RARE, "1 Sitzung → (selten)");
});

test("Aggregat: Formularabbruch je Feld (nur Namen), Abschluss über Ziel anfrage", () => {
  const fo = (b, l) => ["fo", { f: "kontakt", b, l }];
  const recs = [
    ...[1, 2, 3, 4, 5].flatMap((i) => session(i, { pages: ["/de/kontakt"], extra: [fo(["name", "email"], "email")] })),
    ...[6, 7].flatMap((i) => session(i, { pages: ["/de/kontakt"], goal: "anfrage", extra: [fo(["name", "email", "nachricht"], "nachricht")] })),
  ];
  const agg = aggregateDay(recs, { datum: "2026-10-28", k: 5 });
  const ab = agg.signale.find((s) => s.typ === "Formularabbruch");
  assert.equal(ab.ziel, "kontakt");
  assert.equal(ab.sitzungen, 5);
  assert.equal(ab.details.gestartet, 7);
  assert.equal(ab.details.abgeschlossen, 2);
  assert.deepEqual(ab.details.felder.find((f) => f.n === "email"), { n: "email", beruehrt: 7, letztes: 5 });
});

test("Aggregat: Planer-Trichter, Übergaben, Abbrüche; Pfad bis zum ersten Ziel, max. 8 Schritte", () => {
  const pl = (a, extra = {}) => ["pl", { n: "kuechenplaner", a, ...extra }];
  const recs = [
    ...session(1, { pages: ["/de/kuechenplaner"], extra: [pl("start"), pl("schritt", { s: "raum" }), pl("schritt", { s: "form" }), pl("uebergabe", { d: 300 })] }),
    ...session(2, { pages: ["/de/kuechenplaner"], extra: [pl("start"), pl("schritt", { s: "raum", d: 60 })] }),
  ];
  const agg = aggregateDay(recs, { datum: "2026-10-28" });
  const k = agg.planer.find((p) => p.planer === "Küche");
  assert.equal(k.starts, 2);
  assert.equal(k.uebergaben, 1);
  assert.equal(k.abbrueche, 1);
  assert.deepEqual(k.schritte.slice(0, 2), [{ schritt: "raum", n: 2 }, { schritt: "form", n: 1 }]);
  assert.equal(k.median_dauer_s, 180);
  const long = buildSessions(session(9, { pages: ["/de", "/de/kontakt", "/de/beratung", "/de/news", "/de/impressum", "/de/termin", "/de/ezarri", "/de/showroom", "/de/leistungen", "/de/projekte", "/de/ratgeber"] }));
  assert.equal(pathOf(long[0]).steps.length, 9);
  assert.equal(pathOf(long[0]).steps[8], "…");
});

test("Aggregat: 30-min-Lücke trennt Sitzungen auch am Server", () => {
  const recs = [
    { sid: SID, seq: 1, pv: 1, ts_min: "2026-10-28T10:00:00.000Z", e: [pv("/de", { ch: "Direkt" })] },
    { sid: SID, seq: 2, pv: 2, ts_min: "2026-10-28T11:00:00.000Z", e: [pv("/de/kontakt")] },
  ];
  assert.equal(buildSessions(recs).length, 2);
});

// ---------------------------------------------------------------- Speicher

test("Speicher: Rohsatz ohne Request-Daten, Löschung nach 14 Tagen (auch bei 30 konfiguriert)", async () => {
  const dir = tmpDir();
  const env = { EINBLICKE_DIR: dir, EINBLICKE_ROH_TAGE: "30" };
  const now = new Date("2026-10-29T12:00:00Z");
  await appendRaw({ sid: SID, seq: 1, pv: 1, e: [pv()], ip: "1.2.3.4", ua: "x" }, { now, env });
  const rows = await readRaw("2026-10-29", env);
  assert.deepEqual(Object.keys(rows[0]).sort(), ["e", "pv", "seq", "sid", "ts_min"]);
  assert.equal(rows[0].ts_min, "2026-10-29T12:00:00.000Z");
  fs.mkdirSync(path.join(dir, "roh"), { recursive: true });
  for (const d of ["2026-10-01", "2026-10-15", "2026-10-16", "2026-10-28"]) fs.writeFileSync(path.join(dir, "roh", `${d}.ndjson`), "");
  const removed = await purgeRaw({ now, env });
  assert.deepEqual(removed, ["2026-10-01", "2026-10-15"]);
  assert.deepEqual((await openDays({ now, env })).sort(), ["2026-10-16", "2026-10-28"]);
  assert.equal(viennaDay(new Date("2026-10-28T23:30:00Z")), "2026-10-29", "Wiener Kalendertag");
});

test("Tagesabschluss: Aggregat + Dry-Run in outbox ohne Schlüssel, idempotent", async () => {
  const dir = tmpDir();
  const env = { EINBLICKE_DIR: dir };
  fs.mkdirSync(path.join(dir, "roh"), { recursive: true });
  fs.writeFileSync(path.join(dir, "roh", "2026-10-28.ndjson"), session(1).map((r) => JSON.stringify(r)).join("\n") + "\n{kaputt\n");
  let calls = 0;
  const fetchImpl = async () => (calls++, { ok: true });
  const now = new Date("2026-10-29T03:30:00Z");
  const r1 = await runTagesabschluss({ now, env, fetchImpl });
  assert.equal(r1.tage[0].datum, "2026-10-28");
  assert.equal(r1.tage[0].push.mode, "aus");
  assert.equal(calls, 0, "ohne Schlüssel keine Verbindung");
  assert.ok(fs.existsSync(path.join(dir, "tag", "2026-10-28.json")));
  const outbox = JSON.parse(fs.readFileSync(path.join(dir, "outbox", "2026-10-28.json"), "utf8"));
  assert.equal(outbox.schema, 1);
  assert.deepEqual(Object.keys(outbox).sort(), ["datum", "heatmaps", "meta", "pfade", "planer", "schema", "seiten", "signale"]);
  const r2 = await runTagesabschluss({ now, env, fetchImpl });
  assert.equal(r2.tage.length, 0, "kein offener Tag mehr");
});

test("Tagesabschluss: Tag ohne Rohdaten wird übersprungen, Aggregat bleibt, nichts geht nach Frappe (QA Technik P2-1)", async () => {
  const dir = tmpDir();
  const env = { EINBLICKE_DIR: dir, EINBLICKE_FRAPPE_URL: "https://einblicke-test.example", EINBLICKE_FRAPPE_KEY: "k", EINBLICKE_FRAPPE_SECRET: "s" };
  fs.mkdirSync(path.join(dir, "roh"), { recursive: true });
  const lines = [1, 2, 3, 4, 5, 6].flatMap((i) => session(i)).map((r) => JSON.stringify(r));
  fs.writeFileSync(path.join(dir, "roh", "2026-10-28.ndjson"), lines.join("\n") + "\n");
  const sent = [];
  const fetchImpl = async (url, init) => (sent.push(JSON.parse(init.body)), { ok: true });
  await runTagesabschluss({ now: new Date("2026-10-29T03:30:00Z"), env, fetchImpl });
  assert.equal(sent.length, 1);
  const before = await readAggregate("2026-10-28", env);
  assert.ok(before.heatmaps.length > 0);
  // 20 Tage später: Rohdaten weg, erneuter Abschluss genau dieses Tages (und eines Tippfehler-Tages)
  const r = await runTagesabschluss({ days: ["2026-10-28", "2026-10-01"], now: new Date("2026-11-18T03:30:00Z"), env, fetchImpl });
  assert.deepEqual(r.geloescht, ["2026-10-28"]);
  assert.deepEqual(r.uebersprungen, ["2026-10-28", "2026-10-01"]);
  assert.equal(r.tage.length, 0);
  assert.equal(sent.length, 1, "kein leeres Paket an Frappe (ersetzen=1 hätte den Tag gelöscht)");
  assert.deepEqual(await readAggregate("2026-10-28", env), before, "Aggregat unverändert");
});

test("Dünne Heatmaps (< k Besuche) gehen nie einzeln nach Frappe, sondern gesammelt ab k (QA Recht P2-2)", async () => {
  const dir = tmpDir();
  const env = { EINBLICKE_DIR: dir, EINBLICKE_FRAPPE_URL: "https://einblicke-test.example", EINBLICKE_FRAPPE_KEY: "k", EINBLICKE_FRAPPE_SECRET: "s", EINBLICKE_FRAPPE_DRYRUN: "1" };
  fs.mkdirSync(path.join(dir, "roh"), { recursive: true });
  const day = (d, ids) => {
    const recs = ids.flatMap((i) => session(i, { pages: ["/de/impressum"] })).map((r) => JSON.stringify({ ...r, ts_min: `${d}T10:00:00.000Z` }));
    fs.writeFileSync(path.join(dir, "roh", `${d}.ndjson`), recs.join("\n") + "\n");
  };
  day("2026-10-26", [1, 2]);
  day("2026-10-27", [3]);
  day("2026-10-28", [4, 5]);
  const out = (d) => JSON.parse(fs.readFileSync(path.join(dir, "outbox", `${d}.json`), "utf8"));
  await runTagesabschluss({ days: ["2026-10-26"], now: new Date("2026-10-27T03:30:00Z"), env });
  assert.equal(out("2026-10-26").heatmaps.length, 0, "2 Besuche: zurückgehalten");
  assert.equal((await readAggregate("2026-10-26", env)).heatmaps.length, 0, "auch nicht im dauerhaften Tagesaggregat");
  await runTagesabschluss({ days: ["2026-10-27"], now: new Date("2026-10-28T03:30:00Z"), env });
  assert.equal(out("2026-10-27").heatmaps.length, 0);
  assert.ok(Object.keys((await readPool(env)).eintraege).length > 0);
  await runTagesabschluss({ days: ["2026-10-28"], now: new Date("2026-10-29T03:30:00Z"), env });
  const h = out("2026-10-28").heatmaps.find((x) => x.seite === "/de/impressum");
  assert.equal(h.besuche, 5, "2 + 1 + 2 Besuche");
  assert.equal(h.duenn, 0);
  assert.deepEqual(h.zusammengefasst, ["2026-10-26", "2026-10-27", "2026-10-28"]);
  assert.ok(out("2026-10-28").heatmaps.every((x) => x.besuche >= SERVER.k));
  assert.deepEqual((await readPool(env)).eintraege, {}, "Pool leer");
  // erneuter Abschluss desselben Tages behält die zusammengefasste Heatmap
  fs.utimesSync(path.join(dir, "roh", "2026-10-28.ndjson"), new Date(), new Date(Date.now() + 5000));
  await runTagesabschluss({ days: ["2026-10-28"], now: new Date("2026-10-29T04:30:00Z"), env });
  assert.equal(out("2026-10-28").heatmaps.find((x) => x.seite === "/de/impressum").besuche, 5);
  // Pool verfällt mit den Rohdaten (14 Tage)
  const p = poolHeatmaps([{ seite: "/de/x", geraet: "Desktop", datum: "2026-10-01", besuche: 1 }], {}, { datum: "2026-10-01" }).pool;
  assert.deepEqual(poolHeatmaps([], p, { datum: "2026-10-15" }).pool.eintraege, {});
});

test("14-Tage-Grenze auch ohne Cron: erste Speicherung eines Tages löscht alte Rohdaten (QA Technik P1-1)", async () => {
  const dir = tmpDir();
  const env = { EINBLICKE_DIR: dir };
  fs.mkdirSync(path.join(dir, "roh"), { recursive: true });
  for (const d of ["2026-10-01", "2026-10-20"]) fs.writeFileSync(path.join(dir, "roh", `${d}.ndjson`), "");
  fs.writeFileSync(path.join(dir, "pool.json"), JSON.stringify({ v: 1, eintraege: { "/de|Desktop": { "2026-10-01": { besuche: 1 } } } }));
  await appendRaw({ sid: SID, seq: 1, pv: 1, e: [pv()] }, { now: new Date("2026-10-29T12:00:00Z"), env });
  assert.deepEqual(fs.readdirSync(path.join(dir, "roh")).sort(), ["2026-10-20.ndjson", "2026-10-29.ndjson"]);
  assert.ok(!fs.existsSync(path.join(dir, "pool.json")), "Pool-Tag > 14 Tage gelöscht");
  // Inbetriebnahme: Cron-Wrapper und Deploy richten den Abschluss ein
  const cron = read("tools/einblicke/cron.sh");
  assert.ok(cron.includes("/api/einblicke/tagesabschluss") && cron.includes("--nur-loeschen"));
  const deploy = read("scripts/deploy.sh");
  assert.ok(deploy.includes("ensure_einblicke || true") && deploy.includes("tagesabschluss.mjs --pruefen"));
});

// ---------------------------------------------------------------- Frappe

test("Frappe: produktives Backoffice gesperrt, bevor eine Verbindung entsteht", async () => {
  const live = { EINBLICKE_FRAPPE_URL: "https://backoffice.platzhirsch.studio", EINBLICKE_FRAPPE_KEY: "k", EINBLICKE_FRAPPE_SECRET: "s", NODE_ENV: "development", EINBLICKE_DIR: tmpDir() };
  assert.throws(() => assertTargetAllowed(live.EINBLICKE_FRAPPE_URL, live), /gesperrt/);
  assert.throws(() => assertTargetAllowed("https://x.backoffice.platzhirsch.studio", { NODE_ENV: "production" }), /gesperrt/);
  assert.equal(assertTargetAllowed(live.EINBLICKE_FRAPPE_URL, { NODE_ENV: "production", EINBLICKE_FRAPPE_LIVE: "1" }), true);
  assert.throws(() => assertTargetAllowed("http://test.example", {}), /https/);
  let calls = 0;
  await assert.rejects(pushDay({ datum: "2026-10-28", schema: 1, seiten: [] }, { env: live, fetchImpl: async () => (calls++, { ok: true }) }), /gesperrt/);
  assert.equal(calls, 0);
});

test("Frappe: Testsite live mit token-Header; Dry-Run-Schalter; Teilung über 1 MB", async () => {
  const env = { EINBLICKE_FRAPPE_URL: "https://einblicke-test.example/", EINBLICKE_FRAPPE_KEY: "key", EINBLICKE_FRAPPE_SECRET: "sec", EINBLICKE_DIR: tmpDir() };
  assert.equal(frappeConfig({}).mode, "aus");
  assert.equal(frappeConfig({ ...env, EINBLICKE_FRAPPE_DRYRUN: "1" }).mode, "dry-run");
  const seen = [];
  const res = await pushDay({ datum: "2026-10-28", schema: 1, seiten: [{ route: "/de" }] }, { env, fetchImpl: async (url, init) => (seen.push([url, init.headers.Authorization]), { ok: true }) });
  assert.equal(res.mode, "live");
  assert.deepEqual(seen, [["https://einblicke-test.example/api/method/platzhirsch_einblicke.api.tag_speichern", "token key:sec"]]);
  const big = { datum: "d", schema: 1, meta: {}, heatmaps: Array.from({ length: 30 }, (_, i) => ({ name: String(i), pad: "x".repeat(100_000) })), seiten: [{ route: "/de" }] };
  const parts = splitPayload(big);
  assert.ok(parts.length > 2);
  assert.ok(parts.every((p) => Buffer.byteLength(JSON.stringify(p)) <= 1024 * 1024));
  assert.equal(parts.reduce((n, p) => n + (p.heatmaps?.length || 0), 0), 30);
});

// ---------------------------------------------------------------- Empfang

const req = (body, headers = {}) =>
  new Request("http://localhost:3000/api/einblicke", { method: "POST", body, headers: { host: "localhost:3000", origin: "http://localhost:3000", "sec-fetch-site": "same-origin", "user-agent": "Mozilla/5.0 Chrome/130", cookie: cookieWith({ statistics: true, einblicke: true }), ...headers } });
const good = () => JSON.stringify({ v: 1, sid: SID, seq: 1, pv: 1, e: [pv()] });
const ENV = { NODE_ENV: "development" };

test("Empfang: 204 + Paket nur bei sauberem Same-Origin-Beacon; 413 über 16 KB", async () => {
  const ok = await receive(req(good()), { env: ENV });
  assert.equal(ok.status, 204);
  assert.ok(ok.packet);
  assert.equal((await receive(req("x".repeat(17 * 1024)), { env: ENV })).status, 413);
  for (const [h, reason] of [
    [{ dnt: "1" }, "dnt"],
    [{ "sec-gpc": "1" }, "gpc"],
    [{ "user-agent": "Googlebot/2.1" }, "bot"],
    [{ origin: "https://evil.example", "sec-fetch-site": "cross-site" }, "origin"],
    // QA Technik P2-2: ohne Origin und ohne Sec-Fetch-Site same-origin (curl) → verworfen
    [{ origin: "", "sec-fetch-site": "" }, "origin"],
    // QA Recht P3-1: der Server prüft die Einwilligung im mitgesendeten Cookie
    [{ cookie: cookieWith({ statistics: true, googleAnalytics: true }) }, "consent"],
    [{ cookie: "" }, "consent"],
  ]) {
    const r = await receive(req(good(), h), { env: ENV });
    assert.equal(r.status, 204);
    assert.equal(r.packet, undefined, reason);
    assert.equal(r.reason, reason);
  }
  assert.equal(rejectReason(new Headers(), { NODE_ENV: "production" }), "aus", "Produktion ohne Schalter: nichts speichern");
  assert.equal((await receive(req("{kaputt"), { env: ENV })).reason, "json");
});

test("Empfang: Rate-Limit je sid und Tag, ohne IP", () => {
  const lim = createLimiter();
  let ok = 0;
  // 6 s Abstand = 10 je Minute (unter dem Limit je sid und Minute)
  for (let i = 0; i < SERVER.packetsPerSidDay + 5; i++) if (lim.take(SID, 1_000_000 + i * 6000, "2026-10-29")) ok++;
  assert.equal(ok, SERVER.packetsPerSidDay);
  // QA Technik P2-2: eine sid kann das Minutenlimit nicht allein belegen
  const flood = createLimiter();
  let f = 0;
  for (let i = 0; i < 200; i++) if (flood.take(SID, 7_000, "2026-10-29")) f++;
  assert.equal(f, SERVER.packetsPerSidMinute);
  assert.ok(flood.take(sid(1), 7_000, "2026-10-29"), "andere Besucher kommen weiter durch");
  const burst = createLimiter();
  let n = 0;
  for (let i = 0; i < 200; i++) if (burst.take(sid(i), 5_000, "2026-10-29")) n++;
  assert.equal(n, SERVER.packetsPerMinute);
  const src = read("src/lib/einblicke/receive.server.js") + read("src/app/api/einblicke/route.js");
  assert.doesNotMatch(src, /x-forwarded-for|x-real-ip|clientIp|ipFrom/i);
});

// ---------------------------------------------------------------- Einbindung

test("Einbindung: Lader im Layout nur mit Schalter, Vorschau noindex und gesperrt", () => {
  const layout = read("src/app/[locale]/client-layout.js");
  assert.match(layout, /process\.env\.NEXT_PUBLIC_EINBLICKE === '1'/);
  assert.match(layout, /import\('@\/components\/Einblicke\/EinblickeLoader'\)/);
  const loader = read("src/components/Einblicke/EinblickeLoader.js");
  assert.match(loader, /darfMessenHier\(window, consent\)/);
  assert.match(loader, /CONSENT_EVENT/);
  assert.match(loader, /requestIdleCallback/);
  const page = read("src/app/[locale]/preview/einblicke/page.js");
  assert.match(page, /index: false, follow: false/);
  assert.match(page, /einblickePreviewEnabled\(\)/);
  assert.match(read(".gitignore"), /^\/\.data\/$/m);
});

// ---------------------------------------------------------------- Vertrag (schema 1)

test("Vertrag: Tagesaggregat hält einblicke-vertrag.json ein (Schlüssel, Werte, Pflichtzeilen)", () => {
  const vertrag = JSON.parse(read("tools/einblicke/einblicke-vertrag.json"));
  const frappeCopy = path.join(ROOT, "..", "platzhirsch-frappe-einblicke", "einblicke-vertrag.json");
  if (fs.existsSync(frappeCopy)) assert.equal(fs.readFileSync(frappeCopy, "utf8"), read("tools/einblicke/einblicke-vertrag.json"), "beide Kopien identisch");
  assert.equal(vertrag.schema, 1);
  const forbidden = new Set(vertrag.regeln.find((r) => r.startsWith("Nur anonyme")).match(/: (.+)\. Feldnamen/)[1].split(", "));
  const pl = (n, a, extra = {}) => ["pl", { n, a, ...extra }];
  const recs = [
    ...[1, 2, 3, 4, 5, 6].flatMap((i) => session(i, { goal: i < 3 ? "termin" : null, extra: [["fo", { f: "kontakt", b: ["email"], l: "email" }], ["sg", { k: "dead", s: "main>#hero>img:1" }], pl("stilfinder", "start"), pl("stilfinder", "ergebnis", { p: "modern" })] })),
    ...[7, 8].flatMap((i) => session(i, { dc: "m", ch: "Direkt" })),
  ];
  const agg = aggregateDay(recs, { datum: "2026-10-28" });
  const keys = new Set();
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) (keys.add(k), walk(x));
  };
  walk(agg);
  for (const k of keys) assert.ok(!forbidden.has(k), `verbotener Schlüssel ${k}`);
  assert.ok(Buffer.byteLength(JSON.stringify(agg)) <= vertrag.uebertragung.max_bytes);
  const geraete = vertrag.werte.geraet.map((g) => g.split(" ")[0]);
  const herkunft = vertrag.werte.herkunft;
  assert.ok(agg.pfade.some((p) => p.geraet === "Alle" && p.herkunft === "Alle"), "Pflichtzeile Alle/Alle");
  for (const p of agg.pfade) {
    assert.ok(geraete.includes(p.geraet) && herkunft.includes(p.herkunft), `${p.geraet}/${p.herkunft}`);
    assert.equal(typeof p.sitzungen_mit_ziel, "number");
    for (const e of p.sankey.kanten) assert.match(e.von + e.nach, /^\d+:/);
  }
  for (const h of agg.heatmaps) {
    assert.ok(["Handy", "Tablet", "Desktop"].includes(h.geraet));
    assert.match(h.seite, /^\/[^?#]*$/);
    assert.ok(!h.seite.includes("//"));
    if (h.geraet !== "Desktop") assert.equal(h.bewegung_raster, null);
    for (const e of h.element_klicks) assert.ok(e.sel.length <= 120 && !/[<"'`]/.test(e.sel));
  }
  for (const s of agg.signale) assert.ok(vertrag.werte.signal_typ.includes(s.typ), s.typ);
  for (const p of agg.planer) assert.ok(vertrag.werte.planer.includes(p.planer), p.planer);
  // Gleiche Feldnamen wie das Beispiel des Vertrags (Frappe baut dagegen).
  const ex = vertrag.beispiel;
  const missing = (mine, theirs) => Object.keys(theirs).filter((k) => !(k in mine) && !(k === "route" && "seite" in mine));
  assert.deepEqual(missing(agg.heatmaps[0], ex.heatmaps[0]), []);
  assert.deepEqual(missing(agg.pfade[0], ex.pfade[0]), []);
  assert.deepEqual(missing(agg.signale[0], ex.signale[0]), []);
  assert.deepEqual(missing(agg.planer[0], ex.planer[0]).filter((k) => k !== "ergebnisse" || agg.planer[0].planer === "Stil-Finder"), []);
  assert.deepEqual(missing(agg.seiten[0], { route: 1, vorlage: 1, sprache: 1 }), []);
});
