// src/lib/booking/time.js – Datum/Uhrzeit in Europe/Vienna ohne Bibliothek.
// Tage als "YYYY-MM-DD" (Kalendertag in Lochau), Zeitpunkte als Date (UTC).
// Sommerzeit: zonedToUtc rechnet den Versatz zweimal, damit auch die Tage
// der Umstellung stimmen (Slots liegen nie in der Nacht der Umstellung).
// Keine "@/..."-Importe.
import { TIME_ZONE } from "./constants.js";

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const HM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isYmd = (v) => typeof v === "string" && YMD_RE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
export const isHm = (v) => typeof v === "string" && HM_RE.test(v);

const partsFmt = new Map();
function fmt(tz) {
  if (!partsFmt.has(tz)) {
    partsFmt.set(
      tz,
      new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
    );
  }
  return partsFmt.get(tz);
}

function zonedParts(date, tz = TIME_ZONE) {
  const m = Object.fromEntries(fmt(tz).formatToParts(date).map((p) => [p.type, p.value]));
  return { y: +m.year, mo: +m.month, d: +m.day, h: +m.hour % 24, mi: +m.minute, s: +m.second };
}

/** Versatz der Zone zum Zeitpunkt in Minuten (Wien: 60 oder 120). */
export function tzOffsetMin(date, tz = TIME_ZONE) {
  const p = zonedParts(date, tz);
  return Math.round((Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

/** Wandzeit in der Zone ("2026-11-03", "10:00") → Date (UTC). */
export function zonedToUtc(ymd, hm, tz = TIME_ZONE) {
  const [y, mo, d] = ymd.split("-").map(Number);
  const [h, mi] = hm.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const off1 = tzOffsetMin(new Date(guess), tz);
  let t = guess - off1 * 60000;
  const off2 = tzOffsetMin(new Date(t), tz);
  if (off2 !== off1) t = guess - off2 * 60000;
  return new Date(t);
}

const pad = (n) => String(n).padStart(2, "0");

/** Kalendertag in der Zone. */
export function localYmd(date, tz = TIME_ZONE) {
  const p = zonedParts(date, tz);
  return `${p.y}-${pad(p.mo)}-${pad(p.d)}`;
}

/** Uhrzeit "HH:MM" in der Zone. */
export function localHm(date, tz = TIME_ZONE) {
  const p = zonedParts(date, tz);
  return `${pad(p.h)}:${pad(p.mi)}`;
}

export function addDays(ymd, n) {
  const [y, mo, d] = ymd.split("-").map(Number);
  const t = new Date(Date.UTC(y, mo - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** 0 = Sonntag … 6 = Samstag (wie OPENING_HOURS in src/lib/site.js). */
export function weekday(ymd) {
  const [y, mo, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

export function diffDays(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

/** Montag der Woche des Tages. */
export function mondayOf(ymd) {
  return addDays(ymd, -((weekday(ymd) + 6) % 7));
}

export const toMin = (hm) => {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};
export const fromMin = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

/**
 * Erste Kalenderwoche des Online-Termins (QM content-legal r2): Mit 24 Stunden
 * Vorlauf und Sonntag/Montag geschlossen wäre am Wochenende die ganze laufende
 * Woche „vorbei“ – der Kalender beginnt dann mit der kommenden Woche.
 * Samstag und Sonntag → nächster Montag, sonst der Montag der laufenden Woche.
 */
export function firstBookableMonday(todayYmd) {
  return mondayOf(addDays(todayYmd, 2));
}
