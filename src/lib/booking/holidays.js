// src/lib/booking/holidays.js – gesetzliche Feiertage Österreich (bundesweit)
// plus 24. und 31. Dezember (Studio geschlossen, Annahme bis zur Bestätigung
// durch den Inhaber). Mariä Empfängnis (8.12.) zählt als geschlossen, auch
// wenn der Handel öffnen dürfte. Keine "@/..."-Importe.
import { addDays } from "./time.js";

/** Ostersonntag (gregorianisch, Gauß/Anonymus). */
export function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const cache = new Map();

/** Map "YYYY-MM-DD" → Name (deutsch) für ein Jahr. */
export function holidaysAT(year) {
  if (cache.has(year)) return cache.get(year);
  const e = easterSunday(year);
  const fixed = [
    ["01-01", "Neujahr"],
    ["01-06", "Heilige Drei Könige"],
    ["05-01", "Staatsfeiertag"],
    ["08-15", "Mariä Himmelfahrt"],
    ["10-26", "Nationalfeiertag"],
    ["11-01", "Allerheiligen"],
    ["12-08", "Mariä Empfängnis"],
    ["12-24", "Heiliger Abend"],
    ["12-25", "Christtag"],
    ["12-26", "Stefanitag"],
    ["12-31", "Silvester"],
  ];
  const map = new Map(fixed.map(([md, name]) => [`${year}-${md}`, name]));
  map.set(addDays(e, 1), "Ostermontag");
  map.set(addDays(e, 39), "Christi Himmelfahrt");
  map.set(addDays(e, 50), "Pfingstmontag");
  map.set(addDays(e, 60), "Fronleichnam");
  cache.set(year, map);
  return map;
}

/** Name des Feiertags oder null. */
export function holidayName(ymd) {
  return holidaysAT(Number(ymd.slice(0, 4))).get(ymd) || null;
}
