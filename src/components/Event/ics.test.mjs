// Unit test for the iCalendar helper. Run: node --test src/components/Event
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIcs, escapeIcsText, foldIcsLine, formatIcsUtc, zonedTimeToUtc } from "./ics.js";

const NOW = new Date(Date.UTC(2026, 9, 26, 8, 30, 0));
const BASE = {
  uid: "adventsabend-2026@platzhirsch.studio",
  title: "Adventsabend bei Platzhirsch Home Living",
  date: "2026-11-26",
  startTime: "18:00",
  location: "Platzhirsch Home Living, Landstraße 11, 6911 Lochau, Österreich",
  url: "https://platzhirsch.studio/de/adventsabend",
  now: NOW,
};

test("winter time: 18:00 in Vienna on 26 Nov is 17:00 UTC", () => {
  assert.equal(formatIcsUtc(zonedTimeToUtc("2026-11-26", "18:00")), "20261126T170000Z");
});

test("summer time: 18:00 in Vienna on 26 Jun is 16:00 UTC", () => {
  assert.equal(formatIcsUtc(zonedTimeToUtc("2026-06-26", "18:00")), "20260626T160000Z");
});

test("invalid input throws instead of guessing", () => {
  assert.throws(() => zonedTimeToUtc("26.11.2026", "18:00"));
  assert.throws(() => buildIcs({ ...BASE, startTime: null }));
  assert.throws(() => buildIcs({ ...BASE, endTime: "17:00" }));
});

test("every line ends with CRLF and there is no bare LF", () => {
  const ics = buildIcs({ ...BASE, description: "Zeile 1\nZeile 2" });
  assert.ok(ics.endsWith("\r\n"));
  assert.equal(ics.replace(/\r\n/g, "").includes("\n"), false);
  assert.equal(ics.replace(/\r\n/g, "").includes("\r"), false);
  assert.match(ics, /^BEGIN:VCALENDAR\r\nVERSION:2\.0\r\n/);
  assert.match(ics, /END:VEVENT\r\nEND:VCALENDAR\r\n$/);
});

test("UTC times, DTSTAMP and no invented DTEND", () => {
  const ics = buildIcs(BASE);
  assert.match(ics, /\r\nDTSTART:20261126T170000Z\r\n/);
  assert.match(ics, /\r\nDTSTAMP:20261026T083000Z\r\n/);
  assert.equal(ics.includes("DTEND"), false);
  const withEnd = buildIcs({ ...BASE, endTime: "21:00" });
  assert.match(withEnd, /\r\nDTEND:20261126T200000Z\r\n/);
});

test("TEXT escaping: backslash, semicolon, comma, newline", () => {
  assert.equal(escapeIcsText("a\\b;c,d\ne"), "a\\\\b\\;c\\,d\\ne");
  const unfolded = buildIcs(BASE).replace(/\r\n /g, "");
  assert.match(unfolded, /LOCATION:Platzhirsch Home Living\\, Landstraße 11\\, 6911 Lochau\\, Österreich/);
});

test("folding at 75 octets without splitting UTF-8 characters", () => {
  const long = "DESCRIPTION:" + "Glühwein, Gespräche und Möbel ".repeat(6);
  const folded = foldIcsLine(long);
  assert.ok(folded.length > 1);
  const enc = new TextEncoder();
  for (const [i, part] of folded.entries()) {
    assert.ok(enc.encode(part).length <= 75, `line ${i} too long`);
    if (i > 0) assert.ok(part.startsWith(" "));
  }
  assert.equal(folded.map((p, i) => (i ? p.slice(1) : p)).join(""), long);
  const ics = buildIcs({ ...BASE, description: long });
  for (const line of ics.split("\r\n")) assert.ok(enc.encode(line).length <= 75);
});
