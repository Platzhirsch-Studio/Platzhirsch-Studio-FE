// src/lib/booking/ics.js – Kalenderdatei (RFC 5545) für Download und Mail.
// METHOD:PUBLISH (Termin eintragen) bzw. CANCEL (Absage, gleiche UID, höhere
// SEQUENCE). Zeiten in UTC („Z“), damit jede Kalender-App sie richtig zeigt.
// Kein Verwaltungslink in der Datei (Kalender werden oft geteilt).
// STATUS:TENTATIVE, solange das Team eine Anfrage (Vor Ort, Status
// "angefragt") noch persönlich bestätigt (Abnahme Termin §3). Bestätigt das
// Team im Backoffice, liefert Frappe den Termin mit höherer SEQUENCE als
// "bestaetigt"; die neue Datei ersetzt den Vorbehalt dann durch CONFIRMED.
// Keine "@/..."-Importe.

const esc = (s) => String(s ?? "").replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1");

function stamp(d) {
  return new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Zeilen über 75 Oktette falten (Fortsetzung mit Leerzeichen). */
export function fold(line) {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const parts = [];
  let cur = "";
  let len = 0;
  for (const ch of line) {
    const n = Buffer.byteLength(ch, "utf8");
    if (len + n > (parts.length ? 74 : 75)) {
      parts.push(cur);
      cur = "";
      len = 0;
    }
    cur += ch;
    len += n;
  }
  parts.push(cur);
  return parts.join("\r\n ");
}

/**
 * @param {{ ref: string, start: string, end: string, title: string, description?: string,
 *   location?: string, url?: string, sequence?: number, cancel?: boolean, tentative?: boolean, now?: number }} e
 */
export function buildIcs(e) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Platzhirsch Home Living//Termin//DE",
    "CALSCALE:GREGORIAN",
    `METHOD:${e.cancel ? "CANCEL" : "PUBLISH"}`,
    "BEGIN:VEVENT",
    `UID:${e.ref.toLowerCase()}@platzhirsch.studio`,
    `DTSTAMP:${stamp(e.now ?? Date.now())}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(e.end)}`,
    `SEQUENCE:${Number(e.sequence || 0)}`,
    `STATUS:${e.cancel ? "CANCELLED" : e.tentative ? "TENTATIVE" : "CONFIRMED"}`,
    `SUMMARY:${esc(e.title)}`,
    e.description ? `DESCRIPTION:${esc(e.description)}` : null,
    e.location ? `LOCATION:${esc(e.location)}` : null,
    e.url ? `URL:${e.url}` : null,
    "ORGANIZER;CN=Platzhirsch Home Living:mailto:info@platzhirsch.studio",
    // Nur in der Absage-Mail: manche Kalender (Outlook, Apple) werten CANCEL sonst nicht aus.
    e.attendee && /^[^\s@:;,"]+@[^\s@:;,"]+$/.test(e.attendee.email || "") ? `ATTENDEE;CN=${String(e.attendee.name || "Gast").replace(/[\\;,":\r\n]/g, " ").trim()}:mailto:${e.attendee.email}` : null,
    ...(e.cancel ? [] : ["BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Termin Platzhirsch", "TRIGGER:-PT2H", "END:VALARM"]),
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.map(fold).join("\r\n") + "\r\n";
}
