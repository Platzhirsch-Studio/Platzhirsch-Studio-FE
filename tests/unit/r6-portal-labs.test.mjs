// tests/unit/r6-portal-labs.test.mjs — R6-portal-labs: Rate-Limit der Portal-
// Server-Actions über die Speicher-Abstraktion, Demo-Hinweis N7 über tx(),
// kompakte Portal-Leiste bei offener Cookie-Leiste, Küchenplaner-Spec ohne Klick
// auf die Cookie-Leiste.
// Run: node --test tests/unit/r6-portal-labs.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createTranslator } from "next-intl";
import { ACTION_LIMITS, actionClientIp, createActionLimiter } from "../../src/lib/portal/actionLimit.js";
import { createMemoryStore } from "../../src/lib/concierge/limitStore.js";
import { DEMO_NOTICE, DEMO_PDF_NOTICE, demoNoticeKind, demoNoticeText, demoPdfNoticeText } from "../../src/lib/portal/demoNotice.js";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const json = (p) => JSON.parse(read(p));
const hdr = (o) => new Headers(o);
const translator = (locale, messages) => createTranslator({ locale, messages, onError: () => {} });

// ------------------------------------------------------------ Rate-Limit
test("actionLimit: je IP greift die Minutengrenze, danach Retry-After, andere IP unberührt", async () => {
  const lim = createActionLimiter({ limits: { ...ACTION_LIMITS, ip: [{ max: 3, windowMs: 60_000 }] } });
  const a = hdr({ "x-forwarded-for": "198.51.100.7" });
  const t0 = 1_000_000;
  for (let i = 0; i < 3; i++) assert.equal((await lim.checkIp(a, t0 + i)).ok, true);
  const blocked = await lim.checkIp(a, t0 + 10);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfter >= 1 && blocked.retryAfter <= 60);
  assert.equal((await lim.checkIp(hdr({ "x-forwarded-for": "198.51.100.8" }), t0 + 10)).ok, true);
  // Nach Ablauf des Fensters wieder frei.
  assert.equal((await lim.checkIp(a, t0 + 60_001)).ok, true);
});

test("actionLimit: Kundengrenzen wie vor R6 (docs 10/h, messages 20/h), getrennte Eimer", async () => {
  assert.deepEqual(ACTION_LIMITS.docs, [{ max: 10, windowMs: 3_600_000 }]);
  assert.deepEqual(ACTION_LIMITS.messages, [{ max: 20, windowMs: 3_600_000 }]);
  const lim = createActionLimiter();
  for (let i = 0; i < 10; i++) assert.equal((await lim.checkCustomer("docs", "CUST-1", 5_000 + i)).ok, true);
  assert.equal((await lim.checkCustomer("docs", "CUST-1", 5_100)).ok, false);
  assert.equal((await lim.checkCustomer("messages", "CUST-1", 5_100)).ok, true, "Nachrichten zählen getrennt");
  assert.equal((await lim.checkCustomer("docs", "CUST-2", 5_100)).ok, true, "anderer Kunde");
  await assert.rejects(() => lim.checkCustomer("unbekannt", "CUST-1"));
});

test("actionLimit: IP = letzter X-Forwarded-For-Eintrag (nginx), ohne Adresse ein gemeinsamer Eimer", () => {
  assert.equal(actionClientIp(hdr({ "x-forwarded-for": "1.1.1.1, 203.0.113.9" })), "203.0.113.9");
  assert.equal(actionClientIp(hdr({ "x-real-ip": " 203.0.113.10 " })), "203.0.113.10");
  assert.equal(actionClientIp(hdr({})), "unknown");
  assert.equal(actionClientIp(undefined), "unknown");
});

test("actionLimit: läuft über die Speicher-Abstraktion (setStore), fällt der Speicher aus, rechnet der Ersatz weiter", async () => {
  const logs = [];
  const shared = createMemoryStore();
  const lim = createActionLimiter({ limits: { ...ACTION_LIMITS, ip: [{ max: 1, windowMs: 60_000 }] }, log: (...a) => logs.push(a.join(" ")) });
  assert.equal(lim.storeName, "memory");
  lim.setStore({ ...shared, name: "shared" });
  assert.equal(lim.storeName, "shared");
  const h = hdr({ "x-forwarded-for": "192.0.2.1" });
  assert.equal((await lim.checkIp(h, 1)).ok, true);
  assert.equal((await lim.checkIp(h, 2)).ok, false, "Treffer liegt im gesetzten Speicher");
  const broken = { name: "shared", hits: async () => { throw new Error("down"); }, addHit: async () => { throw new Error("down"); }, dayCount: async () => 0, incrDay: async () => 1 };
  lim.setStore(broken);
  assert.equal((await lim.checkIp(h, 3)).ok, true, "Ersatzspeicher (leer) übernimmt");
  assert.equal((await lim.checkIp(h, 4)).ok, false, "und zählt weiter");
  assert.ok(logs.some((l) => l.includes("limit store failed")));
});

test("Server Actions: IP-Limit VOR getPortal, Kundenlimit danach, kein altes rateLimit() mehr", () => {
  const docs = read("src/components/Portal/Docs/actions.js");
  const msgs = read("src/components/Portal/Messages/actions.js");
  for (const [name, src] of [["Docs", docs], ["Messages", msgs]]) {
    assert.match(src, /^"use server";/, name);
    assert.match(src, /from "@\/lib\/portal\/actionLimit"/, name);
    assert.doesNotMatch(src, /from "@\/lib\/portal\/rateLimit"/, name);
  }
  for (const fn of ["requestAppointmentChange", "requestPassService", "startPlanning"]) {
    const body = docs.slice(docs.indexOf(`export async function ${fn}(`));
    const end = body.indexOf("\nexport async function ", 10);
    const part = end > 0 ? body.slice(0, end) : body;
    const ip = part.indexOf("await ipLimited()");
    const portal = part.indexOf("await getPortal(");
    const cust = part.indexOf("await limited(portal.customerId)");
    assert.ok(ip > 0 && portal > ip && cust > portal, `${fn}: IP → getPortal → Kunde`);
  }
  const ip = msgs.indexOf("limiter.checkIp(");
  assert.ok(ip > 0 && msgs.indexOf("await getPortal(") > ip && msgs.indexOf('checkCustomer("messages"') > msgs.indexOf("await getPortal("));
});

// ------------------------------------------------------------ N7 Demo-Hinweis
const r6 = json("Marktresearch/digital/teamleiter/messages-r6-portal.json");
const LOCALES = ["de", "en", "fr", "it"];

test("N7: „lokale Entwicklungsumgebung“ nur im Dev, im Prod-Build „Demo-Zugang“", () => {
  assert.equal(demoNoticeKind("development"), "dev");
  assert.equal(demoNoticeKind(undefined), "dev");
  assert.equal(demoNoticeKind("production"), "access");
  const t = translator("de", { Other: {} });
  assert.match(demoNoticeText(t, "development"), /lokalen Entwicklungsumgebung/);
  const prod = demoNoticeText(t, "production");
  assert.match(prod, /^Demo-Zugang/);
  assert.doesNotMatch(prod, /Entwicklung|lokal/i);
});

test("N7: Texte über tx(), 4 Sprachen im Vorschlag, DE identisch mit dem Code", () => {
  for (const l of LOCALES) {
    const d = r6[l]?.Portal?.demo;
    assert.ok(d?.dev && d?.access, l);
    const t = translator(l, r6[l]);
    assert.equal(demoNoticeText(t, "development"), d.dev);
    assert.equal(demoNoticeText(t, "production"), d.access);
    assert.doesNotMatch(d.access, /develop|dévelop|svilupp|Entwicklung/i, `${l}: Prod-Text neutral`);
  }
  assert.equal(r6.de.Portal.demo.dev, DEMO_NOTICE.dev.de);
  assert.equal(r6.de.Portal.demo.access, DEMO_NOTICE.access.de);
  // IT in tu-Form: keine Lei-Anrede.
  assert.doesNotMatch(JSON.stringify(r6.it), /\b(Lei|Suo|Sua|La preghiamo)\b/);
  // Die Komponente nutzt den Leser, kein fester Satz mehr im JSX.
  const nav = read("src/components/Portal/Docs/SectionNav.js");
  assert.match(nav, /demoNoticeText\(t\)/);
  assert.doesNotMatch(nav, /Demo-Daten aus der lokalen Entwicklungsumgebung/);
});

// ------------------------------------------------------------ Portal-Leiste
test("Portal mobil: Leiste bleibt über der Cookie-Leiste und wird bei offener Leiste kompakt (44 px)", () => {
  const src = read("src/components/Portal/Core/PortalNav.js");
  assert.match(src, /bottom-\[var\(--ph-consent-h,0px\)\]/, "Haken für globals.css und r4/r5-Tests bleibt");
  assert.match(src, /getPropertyValue\("--ph-consent-h"\)/);
  assert.match(src, /useSyncExternalStore\(subscribeConsentBar, consentBarOpen, consentBarOnServer\)/);
  assert.match(src, /compact \? "min-h-11 gap-0\.5" : "min-h-\[60px\] gap-1"/);
  // Cookie-Texte bleiben unangetastet: PortalNav liest/ändert keine Cookie-Messages.
  assert.doesNotMatch(src, /Cookies\./);
});

// ------------------------------------------------------------ Küchenplaner-Spec
test("labs-kuechenplaner.spec: kein Klick auf die Cookie-Leiste, Entscheidung per Cookie vorab", () => {
  const spec = read("tests/e2e/labs-kuechenplaner.spec.js");
  assert.doesNotMatch(spec, /dismissCookieBanner\(/);
  assert.match(spec, /name: "cookieConsent"/);
  assert.match(spec, /addCookies\(\[consentDecided\(origin\)\]\)/);
  // Der Kontextverlust-Test braucht die echte 3D-Szene.
  assert.match(spec, /Kontextverlust[^\n]*\n\s*await open\(page, "", \{ with3D: true \}\)/);
});

// ------------------------------------------------------------ N7 Demo-PDF
test("N7: Demo-PDF folgt demoNoticeKind() – Prod nennt keine Entwicklungsdaten", () => {
  assert.match(demoPdfNoticeText("development"), /lokalen Entwicklungsdaten/);
  assert.equal(demoPdfNoticeText("development"), DEMO_PDF_NOTICE.dev);
  const prod = demoPdfNoticeText("production");
  assert.equal(prod, DEMO_PDF_NOTICE.access);
  assert.doesNotMatch(prod, /Entwicklung/);
  assert.match(prod, /Demo-Zugang mit Beispieldaten/);
  assert.match(prod, /kein rechtsgültiger Beleg/);
  const files = read("src/components/Portal/Docs/server/files.js");
  assert.match(files, /text: demoPdfNoticeText\(\)/);
  assert.doesNotMatch(files, /Entwicklungsdaten/);
});
