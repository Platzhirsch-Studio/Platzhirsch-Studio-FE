// src/lib/concierge/showroom.js
// Showroom facts for the concierge, taken from the single source of truth
// (src/lib/site.js). Opening hours are not in site.js yet; they mirror the
// openingHoursSpecification in src/app/[locale]/layout.js – change both
// together (or move them into site.js, which this team must not edit).
import "server-only";
import {
  ADDRESS,
  DIRECTIONS_URL,
  EMAIL,
  PHONE_DISPLAY,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

export const OPENING_HOURS = [
  { days: "Dienstag bis Freitag", time: "10:00–18:00" },
  { days: "Samstag", time: "10:00–14:00" },
  { days: "Sonntag und Montag", time: "geschlossen (Termine nach Vereinbarung über das Team)" },
];

export const APPOINTMENT_PATH = "/de/beratung";
export const PRIVACY_PATH = "/de/datenschutz";

export function getShowroomInfo() {
  return {
    name: SITE_NAME,
    description:
      "Einrichtungsstudio mit Café in Lochau am Bodensee, im Dreiländereck Österreich, Deutschland, Schweiz und Liechtenstein.",
    address: `${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}, ${ADDRESS.region}, ${ADDRESS.country}`,
    phone: PHONE_DISPLAY,
    email: EMAIL,
    website: SITE_URL,
    directions: DIRECTIONS_URL,
    openingHours: OPENING_HOURS,
    appointment: APPOINTMENT_PATH,
    note: "Öffnungszeiten können an Feiertagen abweichen – im Zweifel vorher anrufen.",
  };
}
