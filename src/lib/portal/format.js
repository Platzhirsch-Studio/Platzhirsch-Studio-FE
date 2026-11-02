// Date helpers for the portal UI (server and client). Fixed time zone so the
// server render and the browser agree.

const TZ = "Europe/Vienna";

const fmt = {
  date: new Intl.DateTimeFormat("de-AT", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" }),
  short: new Intl.DateTimeFormat("de-AT", { timeZone: TZ, day: "numeric", month: "short" }),
  weekday: new Intl.DateTimeFormat("de-AT", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" }),
  time: new Intl.DateTimeFormat("de-AT", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }),
  hour: new Intl.DateTimeFormat("de-AT", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }),
};

const parse = (v) => (v instanceof Date ? v : new Date(v));

export const formatDate = (v) => (v ? fmt.date.format(parse(v)) : "–");
export const formatShortDate = (v) => (v ? fmt.short.format(parse(v)) : "–");
export const formatWeekday = (v) => (v ? fmt.weekday.format(parse(v)) : "–");
export const formatTime = (v) => (v ? fmt.time.format(parse(v)) : "");
export const formatTimeRange = (start, end) => `${formatTime(start)}–${formatTime(end)} Uhr`;

/** Hour 0–23 in Vienna. formatToParts, because format() yields e.g. "06 Uhr" (-> NaN). */
export function viennaHour(now = new Date()) {
  const part = fmt.hour.formatToParts(parse(now)).find((p) => p.type === "hour");
  const h = Number.parseInt(part?.value ?? "", 10);
  return Number.isFinite(h) ? h % 24 : 12;
}

export function greeting(now = new Date()) {
  const h = viennaHour(now);
  if (h < 11) return "Guten Morgen";
  if (h < 18) return "Guten Tag";
  return "Guten Abend";
}

/** "in 3 Tagen", "heute", "morgen", "vor 2 Tagen" (calendar days, Vienna). */
export function relativeDays(v, now = new Date()) {
  const dayKey = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
  const diff = Math.round((Date.parse(dayKey(parse(v))) - Date.parse(dayKey(now))) / 86400000);
  if (diff === 0) return "heute";
  if (diff === 1) return "morgen";
  if (diff === -1) return "gestern";
  return diff > 0 ? `in ${diff} Tagen` : `vor ${-diff} Tagen`;
}
