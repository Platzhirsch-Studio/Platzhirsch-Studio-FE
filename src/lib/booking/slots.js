// src/lib/booking/slots.js – freie Zeiten aus Öffnungszeiten, Feiertagen,
// Vorlauf, Horizont und bestehenden Buchungen (rein, ohne Ein-/Ausgabe).
//
// Ein Beratungsplatz: Jede Buchung blockiert [Start − vorher, Ende + puffer]
// für alle Terminarten (das Team ist bei Vor Ort unterwegs). Im Mock kommen
// simulierte Fremdtermine dazu (mockBusyBlocks), damit der Kalender wie im
// Betrieb aussieht; sie sind deterministisch je Tag und Stunde.
// Keine "@/..."-Importe (node --test).
import { OPENING_HOURS, openingDays } from "../site.js";
import { HORIZON_DAYS, LEAD_HOURS, SLOT_STEP_MIN } from "./constants.js";
import { holidayName } from "./holidays.js";
import { addDays, diffDays, fromMin, localYmd, toMin, weekday, zonedToUtc } from "./time.js";
import { TERMINARTEN, modusOf } from "./types.js";

export const ACTIVE = new Set(["bestaetigt", "angefragt"]);

/**
 * Blockiert eine Buchung den Kalender? Bestätigt/angefragt immer; noch nicht
 * per E-Mail bestätigt ("unbestaetigt", Double-Opt-in) nur bis `reservedUntil`
 * (30 Minuten), danach ist die Uhrzeit wieder frei.
 */
export function isBlocking(b, now = Date.now()) {
  if (ACTIVE.has(b.status)) return true;
  return b.status === "unbestaetigt" && Date.parse(b.reservedUntil) > now;
}

/** Öffnungsfenster des Tages { from, to } oder null (geschlossen). */
export function openingWindow(ymd) {
  const wd = weekday(ymd);
  const row = OPENING_HOURS.find((r) => !r.closed && openingDays(r).includes(wd));
  return row ? { from: row.from, to: row.to } : null;
}

/** Zeitraum, den ein Termin blockiert (ms). */
export function blockOf(artKey, startMs) {
  const t = TERMINARTEN[artKey];
  return [startMs - t.vorher * 60000, startMs + (t.dauer + t.puffer) * 60000];
}

function fnv(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Simulierte Belegung (nur Mock): etwa jede vierte Stunde ist vergeben. */
export function mockBusyBlocks(ymd) {
  const win = openingWindow(ymd);
  if (!win) return [];
  const out = [];
  for (let m = toMin(win.from); m + 60 <= toMin(win.to); m += 60) {
    if (fnv(`${ymd}|${m}`) % 100 < 26) {
      const s = zonedToUtc(ymd, fromMin(m)).getTime();
      out.push([s, s + 60 * 60000]);
    }
  }
  return out;
}

const overlaps = (a, b) => a[0] < b[1] && b[0] < a[1];

/** Blöcke aller aktiven Buchungen (ohne `excludeRef`, für Umbuchungen). */
export function bookingBlocks(bookings = [], excludeRef = null, now = Date.now()) {
  return bookings
    .filter((b) => isBlocking(b, now) && b.ref !== excludeRef)
    .map((b) => blockOf(b.art, Date.parse(b.start)));
}

/** Startzeiten (Minuten) eines Tages für die Art, ohne Belegung. */
function candidateStarts(artKey, ymd) {
  const t = TERMINARTEN[artKey];
  const win = openingWindow(ymd);
  if (!win) return [];
  if (t.days && !t.days.includes(weekday(ymd))) return [];
  const open = toMin(win.from);
  const close = toMin(win.to);
  if (t.starts) return t.starts.map(toMin).filter((m) => m >= open && m + t.dauer <= close);
  const out = [];
  for (let m = open; m + t.dauer <= close; m += SLOT_STEP_MIN) out.push(m);
  return out;
}

/**
 * Tage mit Status und freien Zeiten.
 * status: "open" (≥ 1 frei) | "full" | "soon" (nur Vorlauf) | "closed" | "holiday" | "past" | "later" (nach Horizont)
 */
export function buildDays({ art, from, to, now = Date.now(), bookings = [], busy = null, excludeRef = null }) {
  if (!TERMINARTEN[art]) throw new Error("unknown art");
  const today = localYmd(new Date(now));
  const earliest = now + LEAD_HOURS * 3600000;
  const last = addDays(today, HORIZON_DAYS);
  const taken = bookingBlocks(bookings, excludeRef, now);
  const days = [];
  for (let d = from, i = 0; diffDays(d, to) >= 0 && i < 62; d = addDays(d, 1), i++) {
    const holiday = holidayName(d);
    if (diffDays(today, d) < 0) {
      days.push({ date: d, status: "past", slots: [] });
      continue;
    }
    if (diffDays(d, last) < 0) {
      days.push({ date: d, status: "later", slots: [] });
      continue;
    }
    if (holiday) {
      days.push({ date: d, status: "holiday", holiday, slots: [] });
      continue;
    }
    const starts = candidateStarts(art, d);
    if (!starts.length) {
      days.push({ date: d, status: "closed", slots: [] });
      continue;
    }
    const blocked = busy ? [...taken, ...busy(d)] : taken;
    const slots = [];
    let soon = 0;
    for (const m of starts) {
      const start = zonedToUtc(d, fromMin(m)).getTime();
      if (start < earliest) {
        soon++;
        continue;
      }
      const block = blockOf(art, start);
      if (blocked.some((b) => overlaps(b, block))) continue;
      slots.push({ start: new Date(start).toISOString(), time: fromMin(m) });
    }
    days.push({ date: d, status: slots.length ? "open" : soon === starts.length ? "soon" : "full", slots });
  }
  return days;
}

/**
 * Prüft eine gewünschte Startzeit gegen dieselben Regeln.
 * → { ok: true, start, end } | { ok: false, code: "outside_window" | "slot_taken" }
 */
export function checkStart({ art, modus, start, now = Date.now(), bookings = [], busy = null, excludeRef = null }) {
  const t = TERMINARTEN[art];
  if (!t || !modusOf(art, modus)) return { ok: false, code: "outside_window" };
  const ms = Date.parse(start);
  if (!Number.isFinite(ms)) return { ok: false, code: "outside_window" };
  const ymd = localYmd(new Date(ms));
  const days = buildDays({ art, from: ymd, to: ymd, now, bookings: [], busy: null });
  const allowed = days[0]?.slots.some((s) => Date.parse(s.start) === ms);
  if (!allowed) return { ok: false, code: "outside_window" };
  const block = blockOf(art, ms);
  const blocked = [...bookingBlocks(bookings, excludeRef, now), ...(busy ? busy(ymd) : [])];
  if (blocked.some((b) => overlaps(b, block))) return { ok: false, code: "slot_taken" };
  return { ok: true, start: new Date(ms).toISOString(), end: new Date(ms + t.dauer * 60000).toISOString() };
}
