// Eckdaten des Adventsabends – die EINZIGE Stelle, an der sie gepflegt werden.
// page.js (Seite, Metadaten, Event-Schema) und kalender.ics/route.js lesen von hier.
//
// OFFEN beim Inhaber (Frist 30.10.2026): Uhrzeit, Programm, Kapazität.
// Solange startTime null ist:
//   - bleibt die Seite noindex und gibt kein schema.org-Event aus,
//   - ist "In den Kalender" ausgeblendet und /de/adventsabend/kalender.ics antwortet 404.
// Bitte nichts schätzen: Erst eintragen, wenn der Inhaber es bestätigt hat.
//
// CHECKLISTE, bevor startTime gesetzt wird (die Seite wird damit indexierbar):
//   [ ] Datenschutzerklärung hat den Abschnitt "Veranstaltungen" (Paket R1-legal,
//       Mustertext Marktresearch/recht/06 §2.2 Nr. 6 und 8). Der Kurzhinweis
//       "Gut zu wissen" auf der Seite verweist darauf.
//   [ ] LOESCHFRIST_MONATE und die Foto-Regeln vom Anwalt bestätigt.
//   [ ] Eigenes Bild im Bildregister? Dann EVENT.image setzen (absolute URL).
//       Herstellerbilder (z. B. /Images/Home/bannerImage.jpg) nur mit
//       schriftlicher Freigabe (Design-Bibel §7). Ohne image bleibt das
//       typografische OG-Bild (./opengraph-image.js), das Event-Schema hat dann kein Bild.
//   [ ] Interner Link auf /de/adventsabend (Teaser Startseite, News oder
//       Footer "Service"). Gehört nicht zu diesem Paket: INT-Anfrage.
//   [ ] Eintrag in src/lib/seo/sitemapEntries.js (nur DE, kein hreflang).
//       INT-Anfrage; erst zusammen mit startTime, sonst steht eine noindex-URL
//       in der Sitemap.
//   [ ] EVENT.free (isAccessibleForFree) vom Inhaber bestätigt.
import { ADDRESS, SITE_NAME, SITE_URL } from "@/lib/site";

export const PATH = "/adventsabend";
export const PAGE_URL = `${SITE_URL}/de${PATH}`;
export const CALENDAR_PATH = `/de${PATH}/kalender.ics`;
export const CALENDAR_FILE = "platzhirsch-adventsabend-2026.ics";

export const EVENT = {
  date: "2026-11-26",
  dateLabel: "Donnerstag, 26. November 2026",
  shortDateLabel: "26.11.",
  startTime: null, // "HH:MM", z. B. "18:00" – erst dann Event-Schema, Index und Kalender
  endTime: null, // optional "HH:MM"; ohne Endzeit schreibt die .ics-Datei kein Ende
  capacity: null, // optional Zahl der Plätze, z. B. 40 – nur echte Angabe des Inhabers
  timeZone: "Europe/Vienna",
  free: true, // Event-Schema isAccessibleForFree – vom Inhaber bestätigen lassen
  image: null, // absolute URL eines EIGENEN Fotos aus dem Bildregister, sonst null
};

// Löschfrist der Anmeldedaten in Monaten (Entwurf recht/06 §2.2 Nr. 8,
// anwaltlich bestätigen). Erscheint im Hinweis "Gut zu wissen".
export const LOESCHFRIST_MONATE = 3;
export const LOESCHFRIST_LABEL = "drei Monate";

// Programmpunkte, sobald festgelegt. Format: { titel: "…", text: "…" }.
// Leer = die Seite sagt ehrlich, dass das Programm noch folgt.
export const PROGRAMM = [];

export const TITLE = "Adventsabend im Showroom";
export const DESCRIPTION =
  "Einladung zum Adventsabend am Donnerstag, 26. November 2026, bei Platzhirsch Home Living in Lochau: Showroom und Café im Advent. Nehmen Sie Platz, mit Anmeldung.";

export const ADDRESS_LINE = `${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}`;

export function hasStartTime() {
  return Boolean(EVENT.startTime);
}

// Runde 2 (recht P2-6): ohne bestätigte Uhrzeit ist die Seite im
// Produktions-Build 404 (kein „Uhrzeit folgt“ mit aktiver Anmeldung).
// Entwicklung zeigt sie weiter (Pflege, Tests). Mit startTime automatisch live.
export function eventPublic({ nodeEnv = process.env.NODE_ENV } = {}) {
  return nodeEnv !== "production" || hasStartTime();
}

export function timeLabel() {
  if (!EVENT.startTime) return "Uhrzeit folgt";
  return EVENT.endTime ? `${EVENT.startTime} bis ${EVENT.endTime} Uhr` : `ab ${EVENT.startTime} Uhr`;
}

export function capacityLabel() {
  return EVENT.capacity ? `Platz für ${EVENT.capacity} Gäste` : null;
}

// Österreich ist am 26.11. in der Winterzeit (MEZ, +01:00).
export function isoDateTime(time) {
  return time ? `${EVENT.date}T${time}:00+01:00` : null;
}

// Daten für buildIcs() aus src/components/Event/ics.js.
export function calendarEvent() {
  return {
    uid: `adventsabend-${EVENT.date}@platzhirsch.studio`,
    title: `Adventsabend bei ${SITE_NAME}`,
    date: EVENT.date,
    startTime: EVENT.startTime,
    endTime: EVENT.endTime,
    timeZone: EVENT.timeZone,
    description: `Adventsabend im Showroom und Café von ${SITE_NAME} in Lochau.\n${PAGE_URL}`,
    location: `${SITE_NAME}, ${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}, ${ADDRESS.country}`,
    url: PAGE_URL,
  };
}
