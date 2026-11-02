// src/components/Event/ics.js
// Pure iCalendar (RFC 5545) helper for event pages ("In den Kalender").
// No React, no "@/" imports, no server-only: usable from a route handler, a
// client component (Blob download) and the unit test (node --test).
//
// Rules implemented here (checked in ./ics.test.mjs):
// - every line ends with CRLF, also the last one
// - times are written in UTC ("…Z"), converted from the local wall-clock time
//   of the event (default Europe/Vienna, so summer/winter time is handled)
// - TEXT values escape backslash, semicolon, comma and line breaks
// - lines longer than 75 octets are folded (CRLF + space) without splitting a
//   UTF-8 character
// - no end time given → no DTEND (we do not invent one)

const pad = (n, len = 2) => String(n).padStart(len, "0");

// Offset (ms) of `timeZone` against UTC at the instant `utcMs`.
function zoneOffset(utcMs, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - utcMs;
}

/**
 * Local wall-clock time in a time zone → Date (UTC instant).
 * @param {string} date "YYYY-MM-DD"
 * @param {string} time "HH:MM"
 * @param {string} [timeZone="Europe/Vienna"]
 */
export function zonedTimeToUtc(date, time, timeZone = "Europe/Vienna") {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || "");
  const tm = /^(\d{2}):(\d{2})$/.exec(time || "");
  if (!dm || !tm) throw new Error(`zonedTimeToUtc: invalid date/time "${date}" "${time}"`);
  const guess = Date.UTC(+dm[1], +dm[2] - 1, +dm[3], +tm[1], +tm[2]);
  // Two passes so the offset is the one valid at the resulting instant.
  const first = guess - zoneOffset(guess, timeZone);
  return new Date(guess - zoneOffset(first, timeZone));
}

/** Date → "YYYYMMDDTHHMMSSZ" */
export function formatIcsUtc(d) {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** Escape a TEXT value (RFC 5545 §3.3.11). */
export function escapeIcsText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/** Fold one content line at 75 octets (RFC 5545 §3.1). Returns lines without CRLF. */
export function foldIcsLine(line) {
  const encoder = new TextEncoder();
  const out = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (bytes + size > 75) {
      out.push(current);
      current = " "; // continuation line: leading space + up to 74 octets
      bytes = 1;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out;
}

/**
 * Build a complete .ics file with one VEVENT.
 * @param {object} ev
 * @param {string} ev.uid         stable unique id, e.g. "adventsabend-2026@platzhirsch.studio"
 * @param {string} ev.title
 * @param {string} ev.date        "YYYY-MM-DD" (local date)
 * @param {string} ev.startTime   "HH:MM" (local time) – required
 * @param {string} [ev.endTime]   "HH:MM" – optional, no DTEND without it
 * @param {string} [ev.timeZone]  default "Europe/Vienna"
 * @param {string} [ev.description]
 * @param {string} [ev.location]
 * @param {string} [ev.url]
 * @param {Date}   [ev.now]       DTSTAMP, injectable for tests
 * @returns {string}
 */
export function buildIcs(ev) {
  if (!ev?.startTime) throw new Error("buildIcs: startTime is required");
  const tz = ev.timeZone || "Europe/Vienna";
  const start = zonedTimeToUtc(ev.date, ev.startTime, tz);
  const end = ev.endTime ? zonedTimeToUtc(ev.date, ev.endTime, tz) : null;
  if (end && end <= start) throw new Error("buildIcs: endTime must be after startTime");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Platzhirsch Home Living//Events//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ev.uid}`,
    `DTSTAMP:${formatIcsUtc(ev.now || new Date())}`,
    `DTSTART:${formatIcsUtc(start)}`,
    ...(end ? [`DTEND:${formatIcsUtc(end)}`] : []),
    `SUMMARY:${escapeIcsText(ev.title)}`,
    ...(ev.description ? [`DESCRIPTION:${escapeIcsText(ev.description)}`] : []),
    ...(ev.location ? [`LOCATION:${escapeIcsText(ev.location)}`] : []),
    ...(ev.url ? [`URL:${ev.url}`] : []),
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.flatMap(foldIcsLine).join("\r\n") + "\r\n";
}
