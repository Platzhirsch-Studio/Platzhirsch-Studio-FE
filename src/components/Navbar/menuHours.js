// QM shell-home r5 (iPad, Mobilmenü): the menu said "Di.–Fr. 10:00–18:00",
// footer and house chapter "10–18 Uhr". The menu line now uses the house
// format of HomePage.house.times in every locale (DE "10–18 Uhr", EN
// "10:00–18:00", FR "10 h – 18 h", IT "10–18"), days stay short.
import { OPENING_HOURS, openingDaysLabel } from "../../lib/site.js";

const hour = (hhmm) => {
  const [h, m] = String(hhmm).split(":");
  return m && m !== "00" ? `${Number(h)}:${m}` : String(Number(h));
};

/** Time range in the house format of the locale. */
export function houseTimeRange(locale, from, to) {
  if (locale === "en") return `${from}–${to}`;
  if (locale === "fr") return `${hour(from)}\u00a0h – ${hour(to)}\u00a0h`;
  if (locale === "it") return `${hour(from)}–${hour(to)}`;
  return `${hour(from)}–${hour(to)}\u00a0Uhr`;
}

/** One compact line of the open rows, e.g. "Di.–Fr. 10–18 Uhr · Sa. 10–14 Uhr". */
export function menuHoursLine(locale) {
  return OPENING_HOURS.filter((row) => !row.closed)
    .map((row) => `${openingDaysLabel(locale, row, "short").replace(" – ", "–")} ${houseTimeRange(locale, row.from, row.to)}`)
    .join(" · ");
}
