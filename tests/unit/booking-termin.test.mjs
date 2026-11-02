// Online-Kalender (/[locale]/termin): Zeiten, Feiertage, Slots, Token, .ics,
// Schema, Mock-Adapter (Doppelbuchung, Storno, Umbuchung), Mails, Herkunft,
// Frappe-Adapter (gesperrtes fetch), Texte. node --test, ohne Netzwerk.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { bookingConfig, BOOKING_PROVIDERS, ownCalendarActive, terminCtaPath } from "../../src/components/Booking/config.js";
import { terminMode, linkSecret, frappeCredentials, terminActive } from "../../src/lib/booking/config.js";
import { freeAppointmentSlots } from "../../src/lib/agent/appointment.js";
import { createAdapter as createAgentAdapter } from "../../src/lib/agent/adapter.js";
import { mcpToolList } from "../../src/lib/agent/tools.js";
import { handleMessage } from "../../src/lib/agent/jsonrpc.js";
import { zonedToUtc, localYmd, localHm, addDays, weekday, tzOffsetMin } from "../../src/lib/booking/time.js";
import { easterSunday, holidayName } from "../../src/lib/booking/holidays.js";
import { buildDays, checkStart, mockBusyBlocks, openingWindow } from "../../src/lib/booking/slots.js";
import { signManageToken, verifyManageToken, newReference } from "../../src/lib/booking/token.js";
import { buildIcs, fold } from "../../src/lib/booking/ics.js";
import { bookSchema, fieldErrors } from "../../src/lib/booking/schema.js";
import { createMockAdapter } from "../../src/lib/booking/adapters/mock.js";
import { createFrappeAdapter, fromFrappe } from "../../src/lib/booking/adapters/frappe.js";
import * as svc from "../../src/lib/booking/service.js";
import { customerMail, studioMail } from "../../src/lib/booking/mail.js";
import { isSameOrigin, isTrapped } from "../../src/lib/booking/http.js";
import { TERMIN_COPY, messagesCopy } from "../../src/lib/booking/copy.js";

const ROOT = path.resolve(import.meta.dirname, "../..");
const read = (p) => readFileSync(path.join(ROOT, p), "utf8");
const quiet = { info() {}, warn() {}, error() {} };
// Dienstag, 27.10.2026 08:00 Wien (Tag nach dem Nationalfeiertag, Winterzeit seit 25.10.)
const NOW = Date.parse("2026-10-27T07:00:00Z");

// ------------------------------------------------------------------ Schalter
test("BOOKING_PROVIDER: frappe kommt dazu, bestehende Regeln bleiben", () => {
  assert.deepEqual(BOOKING_PROVIDERS, ["none", "link", "frappe"]);
  assert.deepEqual(bookingConfig({}), { provider: "none" });
  assert.deepEqual(bookingConfig({ BOOKING_PROVIDER: "frappe" }), { provider: "frappe", path: "/termin" });
  assert.deepEqual(bookingConfig({ BOOKING_PROVIDER: "calcom" }), { provider: "none" });
});

test("terminMode: Dev ohne Schlüssel = mock, Produktion ohne = off, BOOKING_MOCK nur außerhalb der Produktion", () => {
  assert.equal(terminMode({}), "mock");
  assert.equal(terminMode({ NODE_ENV: "development", BOOKING_PROVIDER: "frappe" }), "mock");
  assert.equal(terminMode({ NODE_ENV: "production" }), "off");
  assert.equal(terminMode({ NODE_ENV: "production", BOOKING_PROVIDER: "frappe", FRAPPE_BOOKING_URL: "https://b.example", FRAPPE_BOOKING_KEY: "k", FRAPPE_BOOKING_SECRET: "s" }), "off", "ohne BOOKING_LINK_SECRET");
  const noMail = { NODE_ENV: "production", BOOKING_PROVIDER: "frappe", FRAPPE_BOOKING_URL: "https://b.example", FRAPPE_BOOKING_KEY: "k", FRAPPE_BOOKING_SECRET: "s", BOOKING_LINK_SECRET: "x".repeat(32) };
  assert.equal(terminMode(noMail), "off", "ohne Mailversand der Website kein Frappe-Betrieb (Verwaltungslink, Double-Opt-in)");
  const full = { ...noMail, BOOKING_MAIL_API_KEY: "re_x", BOOKING_MAIL_FROM: "Platzhirsch <termin@platzhirsch.studio>" };
  // Erwartung bewusst ergänzt (Rat 9,5 B3, QA Recht −0,5): Produktion braucht
  // zusätzlich den freigegebenen DSE-Abschnitt #termin (src/lib/legal/dseSections.js).
  assert.equal(terminMode(full), "off", "ohne freigegebenen Datenschutz-Abschnitt kein Kalender in Produktion");
  const DSE_OK = { termin: { anchor: "termin", status: "freigegeben" } };
  assert.equal(terminMode(full, DSE_OK), "frappe");
  assert.equal(terminMode({ ...full, BOOKING_MOCK: "1" }, DSE_OK), "frappe", "BOOKING_MOCK wirkt in Produktion nicht");
  assert.equal(terminMode({ NODE_ENV: "development", BOOKING_MOCK: "1" }), "mock");
  // Schalter greift (Freigabe-Prüfung r4-leads:201): ausdrücklich "none"/"link" = kein eigener Kalender, auch im Dev
  assert.equal(terminMode({ NODE_ENV: "development", BOOKING_PROVIDER: "none" }), "off");
  assert.equal(terminMode({ NODE_ENV: "development", BOOKING_PROVIDER: " None " }), "off");
  assert.equal(terminMode({ NODE_ENV: "development", BOOKING_PROVIDER: "link" }), "off");
  assert.equal(terminMode({ NODE_ENV: "development", BOOKING_PROVIDER: "calcom" }), "off");
  assert.equal(terminMode({ NODE_ENV: "production", BOOKING_PROVIDER: "none", BOOKING_LINK_SECRET: "x".repeat(32) }), "off");
  assert.equal(terminMode({ NODE_ENV: "development", BOOKING_PROVIDER: "none", BOOKING_MOCK: "1" }), "mock", "Testbetrieb bewusst erzwungen");
  assert.equal(terminActive({ NODE_ENV: "production" }), false);
  assert.equal(terminActive({}), true);
  assert.equal(frappeCredentials({ FRAPPE_BOOKING_URL: "http://b.example", FRAPPE_BOOKING_KEY: "k", FRAPPE_BOOKING_SECRET: "s" }), null, "nur https");
  assert.equal(linkSecret({ NODE_ENV: "production" }), null);
});

// ------------------------------------------------------------------ Zeit
test("Europe/Vienna: Winter- und Sommerzeit, Umstellungstage", () => {
  assert.equal(zonedToUtc("2026-11-03", "10:00").toISOString(), "2026-11-03T09:00:00.000Z");
  assert.equal(zonedToUtc("2026-07-07", "10:00").toISOString(), "2026-07-07T08:00:00.000Z");
  assert.equal(zonedToUtc("2026-10-25", "10:00").toISOString(), "2026-10-25T09:00:00.000Z");
  assert.equal(zonedToUtc("2026-03-29", "10:00").toISOString(), "2026-03-29T08:00:00.000Z");
  assert.equal(tzOffsetMin(new Date("2026-01-01T12:00:00Z")), 60);
  assert.equal(localYmd(new Date("2026-11-02T23:30:00Z")), "2026-11-03");
  assert.equal(localHm(new Date("2026-11-03T09:00:00Z")), "10:00");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(weekday("2026-11-03"), 2);
});

test("Feiertage AT inkl. bewegliche", () => {
  assert.equal(easterSunday(2026), "2026-04-05");
  assert.equal(easterSunday(2027), "2027-03-28");
  assert.equal(holidayName("2026-04-06"), "Ostermontag");
  assert.equal(holidayName("2026-06-04"), "Fronleichnam");
  assert.equal(holidayName("2026-12-08"), "Mariä Empfängnis");
  assert.equal(holidayName("2026-10-26"), "Nationalfeiertag");
  assert.equal(holidayName("2026-11-03"), null);
});

// ------------------------------------------------------------------ Slots
test("Slots: Öffnungszeiten aus src/lib/site.js, Vorlauf 24 h, Feiertag, Ruhetag, Horizont", () => {
  assert.deepEqual(openingWindow("2026-11-03"), { from: "10:00", to: "18:00" });
  assert.deepEqual(openingWindow("2026-11-07"), { from: "10:00", to: "14:00" });
  assert.equal(openingWindow("2026-11-02"), null, "Montag geschlossen");
  const days = buildDays({ art: "studio", from: "2026-10-26", to: "2026-11-08", now: NOW });
  const by = Object.fromEntries(days.map((d) => [d.date, d]));
  assert.equal(by["2026-10-26"].status, "past");
  assert.equal(by["2026-10-27"].status, "soon", "heute: alles innerhalb 24 h");
  assert.equal(by["2026-10-28"].slots[0].time, "10:00", "morgen ab 24 h");
  assert.equal(by["2026-11-01"].status, "holiday");
  assert.equal(by["2026-11-02"].status, "closed");
  assert.equal(by["2026-11-03"].slots.at(-1).time, "17:00", "60 min, Ende ≤ 18:00");
  assert.equal(by["2026-11-07"].slots.at(-1).time, "13:00", "Samstag bis 14:00");
  const later = buildDays({ art: "studio", from: "2027-01-05", to: "2027-01-05", now: NOW });
  assert.equal(later[0].status, "later", "nach 60 Tagen");
  const vorOrt = buildDays({ art: "vor_ort", from: "2026-11-03", to: "2026-11-07", now: NOW });
  assert.deepEqual(vorOrt[0].slots.map((s) => s.time), ["10:00", "14:00"]);
  assert.equal(vorOrt.at(-1).status, "closed", "Vor Ort nicht am Samstag");
});

test("Slots: Buchung blockiert inkl. Puffer; Mock-Belegung deterministisch", () => {
  const start = zonedToUtc("2026-11-03", "11:00").toISOString();
  const bookings = [{ ref: "PT-AAAAAA", art: "studio", start, status: "bestaetigt" }];
  const d = buildDays({ art: "studio", from: "2026-11-03", to: "2026-11-03", now: NOW, bookings })[0];
  const times = d.slots.map((s) => s.time);
  assert.ok(!times.includes("10:30") && !times.includes("11:00") && !times.includes("11:30") && !times.includes("12:00"));
  assert.ok(times.includes("10:00") === false, "10:00 + 60 + 15 überlappt 11:00");
  assert.ok(times.includes("12:30"));
  assert.deepEqual(mockBusyBlocks("2026-11-03"), mockBusyBlocks("2026-11-03"));
  assert.equal(checkStart({ art: "studio", start, now: NOW, bookings }).code, "slot_taken");
  assert.equal(checkStart({ art: "studio", start: zonedToUtc("2026-11-03", "18:00").toISOString(), now: NOW }).code, "outside_window");
  assert.equal(checkStart({ art: "planung", start, now: NOW }).code, "outside_window", "Planung ohne Modus");
  assert.equal(checkStart({ art: "planung", modus: "video", start, now: NOW }).ok, true);
});

// ------------------------------------------------------------------ Token / ics
test("Verwaltungslink: HMAC, Ablauf, Manipulation", () => {
  const secret = "s".repeat(32);
  const t = signManageToken({ ref: "PT-7K3QX9", version: 2, expiresAt: NOW + 3600000 }, secret);
  assert.match(t, /^PT-7K3QX9\.2\.[0-9a-z]+\.[A-Za-z0-9_-]{32}$/);
  assert.deepEqual(verifyManageToken(t, secret, NOW).ref, "PT-7K3QX9");
  assert.equal(verifyManageToken(t, "x".repeat(32), NOW).code, "invalid_token");
  assert.equal(verifyManageToken(t.replace(".2.", ".3."), secret, NOW).code, "invalid_token");
  assert.equal(verifyManageToken(t, secret, NOW + 7200000).code, "expired");
  assert.match(newReference(), /^PT-[2-9A-HJ-NP-Z]{6}$/);
});

test(".ics: RFC 5545 (CRLF, Faltung, UTC, CANCEL)", () => {
  const ics = buildIcs({ ref: "PT-7K3QX9", start: "2026-11-03T09:00:00.000Z", end: "2026-11-03T10:00:00.000Z", title: "Termin; Studio, Lochau", description: "a\nb", now: NOW });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART:20261103T090000Z\r\n/);
  assert.match(ics, /SUMMARY:Termin\\; Studio\\, Lochau/);
  assert.match(ics, /UID:pt-7k3qx9@platzhirsch.studio/);
  assert.ok(ics.split("\r\n").every((l) => Buffer.byteLength(l) <= 75));
  assert.match(buildIcs({ ref: "PT-7K3QX9", start: NOW, end: NOW, title: "x", cancel: true, sequence: 2 }), /METHOD:CANCEL[\s\S]*SEQUENCE:2[\s\S]*STATUS:CANCELLED/);
  assert.match(ics, /STATUS:CONFIRMED/);
  assert.match(buildIcs({ ref: "PT-7K3QX9", start: NOW, end: NOW, title: "x", tentative: true }), /METHOD:PUBLISH[\s\S]*STATUS:TENTATIVE/);
  assert.match(buildIcs({ ref: "PT-7K3QX9", start: NOW, end: NOW, title: "x", tentative: true, cancel: true }), /STATUS:CANCELLED/);
  assert.equal(fold("ä".repeat(60)).split("\r\n ").length, 2);
});

// ------------------------------------------------------------------ Schema
test("Schema: Pflichtfelder je Terminart, Einwilligung Video, Allowlist", () => {
  const base = { start: "2026-11-03T09:00:00.000Z", vorname: "Anna", nachname: "Muster", email: "anna@example.at" };
  assert.equal(bookSchema.safeParse({ ...base, art: "studio", extra: "x" }).data.extra, undefined);
  const video = bookSchema.safeParse({ ...base, art: "video" });
  assert.deepEqual(fieldErrors(video.error), { consent: "consent" });
  assert.equal(bookSchema.safeParse({ ...base, art: "video", einwilligungVideo: true }).success, true);
  assert.deepEqual(Object.keys(fieldErrors(bookSchema.safeParse({ ...base, art: "vor_ort" }).error)).sort(), ["plzOrt", "telefon"]);
  assert.deepEqual(Object.keys(fieldErrors(bookSchema.safeParse({ ...base, art: "planung" }).error)).sort(), ["modus", "thema"]);
  assert.deepEqual(Object.keys(fieldErrors(bookSchema.safeParse({ ...base, art: "studio", email: "x" }).error)), ["email"]);
  assert.equal(bookSchema.safeParse({ ...base, art: "studio", anliegen: "x".repeat(1001) }).success, false);
});

// ------------------------------------------------------------------ Mock-Ablauf
function setup() {
  const dir = mkdtempSync(path.join(os.tmpdir(), "termin-"));
  const env = { BOOKING_DATA_DIR: dir };
  let clock = NOW;
  const adapter = createMockAdapter({ dir, now: () => clock, simulateBusy: false });
  return { dir, env, adapter, tick: (ms) => (clock += ms) };
}
const input = (over = {}) =>
  bookSchema.parse({ art: "video", start: zonedToUtc("2026-11-04", "10:00").toISOString(), vorname: "Anna", nachname: "Muster", email: "anna@example.at", einwilligungVideo: true, ...over });

/** Buchen + Bestätigungslink aus der Antwort (Testbetrieb) einlösen. */
async function bookConfirmed(ctx, over = {}, { origin = "o", now = NOW } = {}) {
  const r = await svc.book({ adapter: ctx.adapter, input: input(over), origin, env: ctx.env, now, log: quiet });
  if (!r.ok) return r;
  const link = r.devConfirmUrl.split("#")[1];
  return svc.confirm({ adapter: ctx.adapter, link, origin, env: ctx.env, now, log: quiet });
}
const outboxMetas = (dir) =>
  existsSync(path.join(dir, "outbox")) ? readdirSync(path.join(dir, "outbox")).sort().map((m) => ({ m, ...JSON.parse(readFileSync(path.join(dir, "outbox", m, "mail.json"), "utf8")) })) : [];

test("Double-Opt-in: Buchung erst nach Klick fest, nur Bestätigungslink per Mail, Uhrzeit 30 min gehalten", async () => {
  const ctx = setup();
  const { dir, env, adapter } = ctx;
  const r = await svc.book({ adapter, input: input({ idem: "abcdefgh12" }), origin: "http://localhost:3000", env, now: NOW, log: quiet });
  assert.equal(r.ok, true);
  assert.equal(r.pending, true);
  assert.equal(r.booking.status, "unbestaetigt");
  assert.equal(r.booking.ics, null, "keine .ics vor der Bestätigung");
  assert.equal(r.manageUrl, undefined, "kein Verwaltungslink vor der Bestätigung");
  assert.match(r.devConfirmUrl, /^\/de\/termin\/bestaetigen#PT-[0-9A-Z]{6}\.[A-Za-z0-9_-]{43}$/);
  let mails = outboxMetas(dir);
  assert.deepEqual(mails.map((m) => m.tag), ["termin-verify"], "nur der Bestätigungslink, keine Studio-Mail");
  const verifyText = readFileSync(path.join(dir, "outbox", mails[0].m, "mail.txt"), "utf8");
  assert.match(verifyText, /http:\/\/localhost:3000\/de\/termin\/bestaetigen#PT-/);
  assert.match(verifyText, /30 Minuten/);
  const stored = JSON.parse(readFileSync(path.join(dir, "bookings.json"), "utf8"));
  assert.equal(stored[0].verifyHash.length, 64, "nur der Hash ist gespeichert");
  assert.ok(!JSON.stringify(stored).includes(r.devConfirmUrl.split(".")[1]), "Token nicht im Klartext");
  assert.equal(stored[0].consent.version, "video-v2-2026-10-29");
  // Uhrzeit gehalten: zweite Buchung desselben Slots → 409
  const clash = await svc.book({ adapter, input: input({ art: "studio", email: "b@example.at", start: zonedToUtc("2026-11-04", "10:30").toISOString() }), origin: "o", env, now: NOW, log: quiet });
  assert.deepEqual(clash, { ok: false, code: "slot_taken" });
  // Verwaltungslink gibt es noch nicht (auch nicht mit gültiger Signatur)
  // Bestätigen
  const link = r.devConfirmUrl.split("#")[1];
  const c = await svc.confirm({ adapter, link, origin: "http://localhost:3000", env, now: NOW, log: quiet });
  assert.equal(c.ok, true);
  assert.equal(c.booking.status, "bestaetigt");
  assert.match(c.manageUrl, /^\/de\/termin\/verwalten#PT-/);
  assert.match(c.booking.ics, /BEGIN:VEVENT/);
  assert.equal(c.booking.email, "a***@example.at");
  mails = outboxMetas(dir);
  assert.deepEqual(mails.map((m) => m.tag).sort(), ["studio-booked", "termin-booked", "termin-verify"]);
  assert.ok(mails.every((m) => m.subject.startsWith("[TEST]")));
  const again = await svc.confirm({ adapter, link, origin: "o", env, now: NOW, log: quiet });
  assert.equal(again.already, true, "zweiter Klick: schon bestätigt, keine neue Mail");
  assert.equal(outboxMetas(dir).length, 3);
  const bad = await svc.confirm({ adapter, link: link.slice(0, -2) + (link.endsWith("AA") ? "BB" : "AA"), origin: "o", env, now: NOW, log: quiet });
  assert.equal(bad.code, "invalid_token");
  const replay = await svc.book({ adapter, input: input({ idem: "abcdefgh12" }), origin: "o", env, now: NOW, log: quiet });
  assert.equal(replay.booking.ref, r.booking.ref, "gleicher idem nach Bestätigung → gleiche Buchung");
  assert.equal(replay.pending, false);
});

test("Double-Opt-in: ohne Klick ist die Uhrzeit nach 30 min frei; Adresse korrigieren erneuert den Link", async () => {
  const ctx = setup();
  const { dir, env, adapter, tick } = ctx;
  const start = zonedToUtc("2026-11-04", "10:00").toISOString();
  const r = await svc.book({ adapter, input: input({ idem: "korrektur01", email: "anna@exmaple.at" }), origin: "o", env, now: NOW, log: quiet });
  const fixed = await svc.book({ adapter, input: input({ idem: "korrektur01", email: "anna@example.at" }), origin: "o", env, now: NOW, log: quiet });
  assert.equal(fixed.booking.ref, r.booking.ref, "gleiche Referenz, gleiche Uhrzeit");
  const tos = outboxMetas(dir).map((m) => m.to);
  assert.deepEqual(tos, ["anna@exmaple.at", "anna@example.at"]);
  assert.equal((await svc.confirm({ adapter, link: r.devConfirmUrl.split("#")[1], origin: "o", env, now: NOW, log: quiet })).code, "invalid_token", "alter Link nach Korrektur ungültig");
  tick(31 * 60000);
  const other = await svc.book({ adapter, input: input({ art: "studio", start, email: "z@example.at" }), origin: "o", env, now: NOW + 31 * 60000, log: quiet });
  assert.equal(other.ok, true, "nach 30 min frei");
  const late = await svc.confirm({ adapter, link: fixed.devConfirmUrl.split("#")[1], origin: "o", env, now: NOW + 31 * 60000, log: quiet });
  assert.equal(late.code, "slot_taken", "abgelaufen und inzwischen vergeben");
  const days = await adapter.slots({ art: "studio", von: "2026-11-04", bis: "2026-11-04" });
  assert.ok(!days[0].slots.some((s) => s.start === start), "die neue (unbestätigte) Buchung hält die Uhrzeit");
});

test("Mock: parallele Buchungen desselben Slots → genau eine gewinnt", async () => {
  const { env, adapter } = setup();
  const runs = await Promise.all(
    [1, 2, 3, 4].map((i) => svc.book({ adapter, input: input({ art: "studio", email: `p${i}@example.at` }), origin: "o", env, now: NOW, log: quiet }))
  );
  assert.equal(runs.filter((r) => r.ok).length, 1);
  assert.equal(runs.filter((r) => r.code === "slot_taken").length, 3);
});

test("Mock: ansehen, umbuchen (alter Link ungültig), absagen, nach Beginn gesperrt", async () => {
  const ctx = setup();
  const { env, adapter, tick } = ctx;
  const r = await bookConfirmed(ctx);
  const token = r.manageUrl.split("#")[1];
  assert.equal((await svc.view({ adapter, token, origin: "o", env, now: NOW })).booking.canChange, true);
  const moved = await svc.reschedule({ adapter, token, start: zonedToUtc("2026-11-05", "14:00").toISOString(), origin: "o", env, now: NOW, log: quiet });
  assert.equal(moved.ok, true);
  assert.equal(moved.booking.start, "2026-11-05T13:00:00.000Z");
  assert.equal((await svc.view({ adapter, token, origin: "o", env, now: NOW })).code, "invalid_token");
  const next = moved.manageUrl.split("#")[1];
  const blocked = await svc.reschedule({ adapter, token: next, start: zonedToUtc("2026-11-02", "10:00").toISOString(), origin: "o", env, now: NOW, log: quiet });
  assert.equal(blocked.code, "outside_window", "Montag");
  const during = Date.parse(moved.booking.start) + 10 * 60000 - NOW;
  tick(during);
  assert.equal((await svc.cancel({ adapter, token: next, origin: "o", env, now: NOW + during, log: quiet })).code, "too_late_to_change");
  assert.equal((await svc.view({ adapter, token: next, origin: "o", env, now: NOW + 10 * 86400000 })).code, "expired", "Link läuft mit Terminende ab");
});

test("Mock: Vor Ort = Anfrage; Absage gibt den Slot frei, Absage-.ics mit ATTENDEE", async () => {
  const ctx = setup();
  const { dir, env, adapter } = ctx;
  const start = zonedToUtc("2026-11-04", "14:00").toISOString();
  const r = await bookConfirmed(ctx, { art: "vor_ort", start, telefon: "+43 660 1234567", plzOrt: "6900 Bregenz", einwilligungVideo: false });
  assert.equal(r.booking.status, "angefragt");
  assert.equal(r.booking.meetUrl, null);
  // Anfrage: .ics auf der Seite und in der Mail nur vorgemerkt (TENTATIVE), nie fest (Abnahme Termin §3)
  assert.match(r.booking.ics, /STATUS:TENTATIVE/);
  assert.doesNotMatch(r.booking.ics, /STATUS:CONFIRMED/);
  const bookedMail = outboxMetas(dir).find((m) => m.tag === "termin-booked");
  assert.match(readFileSync(path.join(dir, "outbox", bookedMail.m, "termin.ics"), "utf8"), /STATUS:TENTATIVE/);
  const c = await svc.cancel({ adapter, token: r.manageUrl.split("#")[1], origin: "o", env, now: NOW, log: quiet });
  assert.equal(c.booking.status, "storniert");
  assert.equal(c.booking.canChange, false);
  const cancelMail = outboxMetas(dir).find((m) => m.tag === "termin-cancelled");
  const ics = readFileSync(path.join(dir, "outbox", cancelMail.m, "termin.ics"), "utf8");
  assert.match(ics, /METHOD:CANCEL/);
  assert.match(ics, /ATTENDEE;CN=Anna Muster:mailto:anna@example\.at/);
  const again = await svc.book({ adapter, input: input({ art: "studio", start, email: "z@example.at" }), origin: "o", env, now: NOW, log: quiet });
  assert.equal(again.ok, true);
});

test("Videoraum-Link erst 15 min vor Beginn, nie in Mail oder .ics", async () => {
  const ctx = setup();
  const { dir, env, adapter } = ctx;
  const r = await bookConfirmed(ctx, {}, { origin: "http://localhost:3000" });
  assert.equal(r.booking.meetUrl, null, "Tage vorher: kein Link");
  assert.equal(r.booking.meetFrom, "2026-11-04T08:45:00.000Z");
  assert.equal(r.booking.testRoom, "http://localhost:3000/de/termin/testraum", "nur Testbetrieb");
  assert.doesNotMatch(r.booking.ics, /testraum|URL:/);
  assert.match(r.booking.ics, /15 Minuten vor Beginn/);
  const token = r.manageUrl.split("#")[1];
  const soon = await svc.view({ adapter, token, origin: "http://localhost:3000", env, now: Date.parse("2026-11-04T08:46:00Z") });
  assert.equal(soon.booking.meetUrl, "http://localhost:3000/de/termin/testraum");
  const early = await svc.view({ adapter, token, origin: "o", env, now: Date.parse("2026-11-04T08:40:00Z") });
  assert.equal(early.booking.meetUrl, null);
  for (const m of outboxMetas(dir)) assert.doesNotMatch(readFileSync(path.join(dir, "outbox", m.m, "mail.txt"), "utf8"), /testraum/, m.tag);
});

test("Frappe-Betrieb: Website verschickt Kundenmails mit Verwaltungslink (Resend), nie ans Produktiv-Backoffice", async () => {
  const calls = [];
  const sent = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    const body = init.body ? JSON.parse(init.body) : {};
    if (url.includes("create_termin")) {
      assert.equal(body.verify_hash.length, 64);
      assert.equal(body.kundenmail, "website");
      return Response.json({ message: { referenz: "PT-7K3QX9", terminart: "studio", modus: "studio", start: "2026-11-04T09:00:00.000Z", ende: "2026-11-04T10:00:00.000Z", status: "Unbestaetigt", email_verifiziert: 0, sprache: "de", vorname: "Anna", link_version: 1 } });
    }
    if (url.includes("verify_termin")) return Response.json({ message: { referenz: "PT-7K3QX9", terminart: "studio", modus: "studio", start: "2026-11-04T09:00:00.000Z", ende: "2026-11-04T10:00:00.000Z", status: "Bestaetigt", email_verifiziert: 1, sprache: "de", vorname: "Anna", email: "anna@example.at", link_version: 1 } });
    if (url.includes("get_termin") || url.includes("cancel_termin")) return new Response(JSON.stringify({ exc: "PermissionError" }), { status: 403 });
    return Response.json({ message: [] });
  };
  const adapter = createFrappeAdapter({ url: "https://frappe.test", key: "k", secret: "s", methodBase: "platzhirsch_studio.termin.api" }, { fetchImpl });
  const mailer = { kind: "test", send: async (mail) => (sent.push(mail), { ok: true }) };
  const env = { BOOKING_LINK_SECRET: "x".repeat(40) };
  const r = await svc.book({ adapter, input: input({ art: "studio", email: "anna@example.at" }), origin: "https://platzhirsch.studio", env, now: NOW, log: quiet, mailer });
  assert.equal(r.pending, true);
  assert.equal(r.devConfirmUrl, undefined, "kein Direktlink außerhalb des Tests");
  assert.equal(sent[0].tag, "termin-verify");
  assert.doesNotMatch(sent[0].subject, /TEST/);
  const link = sent[0].text.match(/bestaetigen#(\S+)/)[1];
  const c = await svc.confirm({ adapter, link, origin: "https://platzhirsch.studio", env, now: NOW, log: quiet, mailer });
  assert.equal(c.ok, true);
  assert.equal(sent[1].tag, "termin-booked");
  assert.equal(sent[1].to, "anna@example.at");
  assert.match(sent[1].text, /https:\/\/platzhirsch\.studio\/de\/termin\/verwalten#PT-7K3QX9\./, "Verwaltungslink in der Kundenmail");
  assert.equal(sent.length, 2, "keine Studio-Mail (macht das Backoffice)");
  const verifyCall = calls.find((x) => x.url.includes("verify_termin"));
  assert.equal(JSON.parse(verifyCall.init.body).verify_hash.length, 64);
  const v = await svc.view({ adapter, token: c.manageUrl.split("#")[1], origin: "o", env, now: NOW });
  assert.equal(v.ok, false);
  assert.equal(v.code, "unavailable", "get_termin 403 (API-Zugang) → nicht erreichbar, nicht „Link ungültig“");
  assert.deepEqual(await adapter.cancel("PT-7K3QX9", 1), { ok: false, code: "unavailable" }, "403 vom Backoffice = Zugang, nicht Link ungültig");
  assert.ok(calls.every((x) => !x.url.includes("backoffice.platzhirsch.studio")));
});

// ------------------------------------------------------------------ Mails
test("Mails: Kunde ohne Telefon/Anliegen, Studio mit Kontakt, kein Ausrufezeichen", () => {
  const b = { ref: "PT-7K3QX9", art: "planung", modus: "video", thema: "kueche", start: "2026-11-03T09:00:00.000Z", end: "2026-11-03T10:30:00.000Z", status: "bestaetigt", locale: "de", vorname: "Anna", nachname: "Muster", email: "anna@example.at", telefon: "+43 1", anliegen: "Kochinsel", sequence: 0 };
  const m = customerMail("booked", b, { manageUrl: "http://x/de/termin/verwalten#t", test: true });
  assert.match(m.subject, /^\[TEST\] Ihr Termin am Dienstag, 3\. November 2026 um 10:00 Uhr$/);
  assert.match(m.text, /Planungstermin zu einem Thema · Küche · Per Video/);
  assert.doesNotMatch(m.text, /\+43 1\b|Kochinsel|!|testraum/);
  assert.match(m.text, /ab 15 Minuten vor Beginn/);
  assert.equal(m.attachments[0].filename, "termin.ics");
  const s = studioMail("booked", b, { test: true });
  assert.equal(s.to, "info@platzhirsch.studio");
  assert.match(s.text, /Telefon: \+43 1/);
  assert.match(customerMail("booked", { ...b, locale: "en" }, {}).subject, /Your appointment on Tuesday, 3 November 2026 at 10:00/);
});

// ------------------------------------------------------------------ HTTP
const req = (headers) => new Request("http://localhost:3000/api/termin/book", { method: "POST", headers });
test("Herkunft: Origin null + Sec-Fetch-Site same-origin ok, fremd/cross-site nein", () => {
  assert.equal(isSameOrigin(req({ host: "localhost:3000", origin: "http://localhost:3000" })), true);
  assert.equal(isSameOrigin(req({ host: "localhost:3000", origin: "null", "sec-fetch-site": "same-origin" })), true);
  assert.equal(isSameOrigin(req({ host: "localhost:3000", origin: "null", "sec-fetch-site": "cross-site" })), false);
  assert.equal(isSameOrigin(req({ host: "localhost:3000", origin: "null" })), false);
  assert.equal(isSameOrigin(req({ host: "localhost:3000", origin: "https://evil.example" })), false);
  assert.equal(isSameOrigin(req({ host: "localhost:3000", "sec-fetch-site": "same-site" })), false);
  assert.equal(isSameOrigin(req({ host: "localhost:3000" })), true, "Server/Tests ohne Header");
  assert.equal(isTrapped({ website: "x" }), true);
  assert.equal(isTrapped({ t: 1200 }), true);
  assert.equal(isTrapped({ t: 40000 }), false);
});

// ------------------------------------------------------------------ Frappe
test("Frappe-Adapter: Token-Auth, Methodennamen, Fehlercodes; nie ans Produktiv-Backoffice im Test", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    if (url.includes("create_termin")) return new Response(JSON.stringify({ exc_type: "SlotTaken" }), { status: 409 });
    return new Response(JSON.stringify({ message: [{ start: "2026-11-03T09:00:00Z", ende: "2026-11-03T10:00:00Z" }] }), { status: 200 });
  };
  const a = createFrappeAdapter({ url: "https://frappe.test", key: "k", secret: "s", methodBase: "platzhirsch_studio.termin.api" }, { fetchImpl });
  const days = await a.slots({ art: "studio", modus: "studio", von: "2026-11-03", bis: "2026-11-04" });
  assert.deepEqual(days[0], { date: "2026-11-03", status: "open", slots: [{ start: "2026-11-03T09:00:00.000Z", time: "10:00" }] });
  assert.match(calls[0].url, /^https:\/\/frappe\.test\/api\/method\/platzhirsch_studio\.termin\.api\.get_freie_slots\?/);
  assert.equal(calls[0].init.headers.Authorization, "token k:s");
  assert.deepEqual(await a.create(input()), { ok: false, code: "slot_taken" });
  assert.equal(fromFrappe({ status: "Bestaetigt" }).status, "bestaetigt");
  assert.ok(calls.every((c) => !c.url.includes("backoffice.platzhirsch.studio")));
});

// ------------------------------------------------------------------ Texte
const keysOf = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keysOf(v, `${p}${k}.`) : [`${p}${k}`]));
const strings = (o) => Object.values(o).flatMap((v) => (typeof v === "string" ? [v] : Array.isArray(v) ? v : v && typeof v === "object" ? strings(v) : []));
test("Texte: vier Sprachen mit gleichen Schlüsseln, keine Superlative/Ausrufezeichen, Vorschlag-JSON aktuell", () => {
  const de = keysOf(TERMIN_COPY.de).sort();
  for (const l of ["en", "fr", "it"]) assert.deepEqual(keysOf(TERMIN_COPY[l]).sort(), de, l);
  for (const l of Object.keys(TERMIN_COPY)) {
    for (const s of strings(TERMIN_COPY[l])) {
      assert.doesNotMatch(s, /!|\b(Luxus|exklusiv|beste[nr]?|größte[nr]?|einzigartig|garantiert)\b/i, `${l}: ${s}`);
    }
  }
  assert.match(TERMIN_COPY.de.arten.vor_ort.text, /wenn Ihr Projekt es braucht, auch ein, zwei Tage/i);
  assert.match(TERMIN_COPY.de.usp, /Harald Menghin skizziert/);
  const proposal = JSON.parse(read("Marktresearch/digital/features/termin-messages-vorschlag.json"));
  for (const l of Object.keys(TERMIN_COPY)) assert.deepEqual(proposal[l].termin, messagesCopy(l), `Vorschlag ${l}`);
  // Übernommen in src/messages/*.json (Namespace termin), gleich wie copy.js
  for (const l of Object.keys(TERMIN_COPY)) assert.deepEqual(JSON.parse(read(`src/messages/${l}.json`)).termin, messagesCopy(l), `messages/${l}.json termin (ohne Testtexte)`);
  assert.equal(messagesCopy("de").testBanner, undefined);
  assert.equal(messagesCopy("de").done.devConfirm, undefined);
  // Kein Herstellername im Kundentext, Widerruf in der Einwilligung
  for (const l of Object.keys(TERMIN_COPY)) {
    assert.doesNotMatch(JSON.stringify(TERMIN_COPY[l]), /Frappe|meet\.platzhirsch/i, l);
    assert.match(TERMIN_COPY[l].daten.consent, /widerrufen|withdraw|retirer|revocare/i, l);
  }
});

test("Seiten/Komponenten: kein Drittanbieter-Code, Token nur im Fragment, no-referrer", () => {
  const page = read("src/app/[locale]/termin/verwalten/page.js");
  assert.match(page, /referrer: "no-referrer"/);
  assert.match(page, /index: false/);
  for (const f of ["src/components/Termin/BookingWizard.js", "src/components/Termin/ManageClient.js", "src/components/Termin/SlotPicker.js"]) {
    const s = read(f);
    assert.doesNotMatch(s, /<iframe|<script|googleapis|calendly|cal\.com|zoom\.us/i, f);
  }
  assert.match(read("src/components/Termin/ManageClient.js"), /location\.hash/);
  assert.match(read(".gitignore"), /^\/\.data\/$/m);
});

// ------------------------------------------------------------------ Integration
test("CTA-Ziel: /termin bei aktivem Kalender (frappe/mock), sonst Beratungsseite", () => {
  const routes = { de: "/beratung", en: "/consultation" };
  assert.equal(ownCalendarActive({}), true, "Dev ohne Schlüssel = Mock");
  assert.equal(terminCtaPath("en", routes, {}), "/termin");
  assert.equal(ownCalendarActive({ NODE_ENV: "production" }), false);
  assert.equal(terminCtaPath("en", routes, { NODE_ENV: "production" }), "/consultation");
  assert.equal(terminCtaPath("it", routes, { NODE_ENV: "production" }), "/beratung");
  // BOOKING_PROVIDER=none: kein Einstieg „Termin online wählen“ auf /beratung (BookingEmbed variant="top"), CTAs aufs Formular
  assert.equal(ownCalendarActive({ BOOKING_PROVIDER: "none" }), false);
  assert.equal(terminCtaPath("de", routes, { BOOKING_PROVIDER: "none" }), "/beratung");
  assert.deepEqual(bookingConfig({ BOOKING_PROVIDER: "none" }), { provider: "none" }, "kein Band unten");
  const embed = read("src/components/Booking/BookingEmbed.js");
  // Rat 9,5 B1 (bewusst erweitert): der Einstieg trägt den Kontext der Anfrage (?thema=, ?produkt=, ?plan= …).
  assert.ok(embed.includes('if (variant === "top") return calendarActive ? <TopEntry locale={locale} context={context} /> : null;'), "Einstieg nur bei aktivem Kalender");
  assert.ok(embed.includes('config.provider !== "link" && config.provider !== "frappe")) return null;'), "Band nur bei link/frappe");
});

test("MCP free_appointment_slots: nur lesend, nur bei aktivem Kalender, keine Personendaten", async () => {
  const ctx = setup();
  const days = await ctx.adapter.slots({ art: "studio", von: "2026-11-03", bis: "2026-11-16" });
  const fetchQ = [];
  const r = await freeAppointmentSlots({ art: "studio", limit: 3 }, { today: "2026-11-03", test: true, fetch: async (q) => (fetchQ.push(q), days) });
  assert.equal(r.result.status, "ok");
  assert.equal(r.result.slots.length, 3);
  assert.match(r.result.slots[0].local, /^2026-11-0\d \d\d:\d\d$/);
  assert.equal(r.result.booking_url, "https://platzhirsch.studio/de/termin?art=studio");
  assert.match(r.result.message, /Nichts ist reserviert oder gebucht/);
  assert.deepEqual(fetchQ[0], { art: "studio", modus: undefined, von: "2026-11-03", bis: "2026-11-16" });
  assert.equal((await freeAppointmentSlots({}, null)).result.status, "unavailable");
  assert.ok(!mcpToolList({ appointment: false }).some((t) => t.name === "free_appointment_slots"), "Standard: nicht angeboten");
  const tool = mcpToolList({ appointment: false, slots: true }).find((t) => t.name === "free_appointment_slots");
  assert.equal(tool.annotations.readOnlyHint, true);
  const on = createAgentAdapter({ catalog: {}, appointment: () => ({ mode: "off" }), slots: () => ({ today: "2026-11-03", fetch: async () => days }) });
  const off = createAgentAdapter({ catalog: {}, appointment: () => ({ mode: "off" }) });
  const listOn = await handleMessage({ jsonrpc: "2.0", id: 1, method: "tools/list" }, { adapter: on });
  const listOff = await handleMessage({ jsonrpc: "2.0", id: 1, method: "tools/list" }, { adapter: off });
  assert.ok(listOn.body.result.tools.some((t) => t.name === "free_appointment_slots"));
  assert.ok(!listOff.body.result.tools.some((t) => t.name === "free_appointment_slots"));
  const call = await on.callTool("free_appointment_slots", { art: "planung", modus: "video" });
  assert.equal(call.isError, false);
  assert.equal(call.structuredContent.modus, "video");
  const bad = await on.callTool("free_appointment_slots", { email: "x@example.at" });
  assert.equal(bad.isError, true, "keine fremden Felder (strict)");
  await assert.rejects(() => off.callTool("free_appointment_slots", {}), /free_appointment_slots/);
});

test("Seiten: Bestätigungsseite noindex/no-referrer, Klick nötig; /beratung-Einstieg; Kurzform im Handy-Kalender", () => {
  const page = read("src/app/[locale]/termin/bestaetigen/page.js");
  assert.match(page, /referrer: "no-referrer"/);
  assert.match(page, /index: false/);
  const client = read("src/components/Termin/ConfirmClient.js");
  assert.match(client, /location\.hash/);
  assert.match(client, /onClick=\{confirm\}/, "Bestätigung erst nach Klick (Mail-Scanner)");
  // Rat 9,5 B1 (bewusst erweitert): mit dem Kontext der Anfrage.
  assert.match(read("src/app/[locale]/beratung/page.js"), /<BookingEmbed locale=\{locale\} variant="top" context=\{terminContext\} \/>/);
  assert.match(read("src/components/Termin/SlotPicker.js"), /@min-\[36rem\]\/days:hidden/, "Kurzform der Tageszellen, wo das Raster schmal ist (auch 200 % Text)");
  assert.match(read("src/components/Termin/BookingWizard.js"), /uploads \? c\.daten\.upload : c\.daten\.uploadOff/);
});
