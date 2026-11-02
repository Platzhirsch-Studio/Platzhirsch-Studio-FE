import "server-only";
import { kindLabel } from "../labels";

// iCalendar (RFC 5545) export of portal appointments. Times in UTC ("Z"),
// so no VTIMEZONE block is needed; calendars show them in local time.

const esc = (v) =>
  String(v ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/([,;])/g, "\\$1");

const utc = (iso) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Folds lines to 75 octets (UTF-8 safe), joined with CRLF. */
function fold(line) {
  const out = [];
  let chunk = "";
  let bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch, "utf8");
    if (bytes + b > (out.length ? 74 : 75)) {
      out.push(chunk);
      chunk = "";
      bytes = 0;
    }
    chunk += ch;
    bytes += b;
  }
  out.push(chunk);
  return out.join("\r\n ");
}

const STATUS = { bestaetigt: "CONFIRMED", angefragt: "TENTATIVE", abgesagt: "CANCELLED" };

/**
 * @param {import("@/lib/portal/adapters/interface").Appointment[]} appointments
 * @param {{advisor?:{name:string,email:string,phone:string}, portalUrl:string}} ctx
 */
export function buildIcs(appointments, { advisor, portalUrl }) {
  const now = utc(new Date().toISOString());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Platzhirsch Home Living//Mein Platzhirsch//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Platzhirsch Termine",
  ];
  for (const a of appointments) {
    const notes = [
      kindLabel(a.kind),
      a.status === "angefragt" ? "Noch nicht bestätigt – wir melden uns zur Bestätigung." : null,
      a.note || null,
      advisor ? `Kontakt: ${advisor.name}, ${advisor.phone}, ${advisor.email}` : null,
      `Details im Kundenportal: ${portalUrl}`,
    ].filter(Boolean);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${a.id}@portal.platzhirsch.studio`,
      `DTSTAMP:${now}`,
      `DTSTART:${utc(a.start)}`,
      `DTEND:${utc(a.end)}`,
      `SUMMARY:${esc(`Platzhirsch: ${a.title}`)}`,
      `LOCATION:${esc(a.location)}`,
      `DESCRIPTION:${esc(notes.join("\n"))}`,
      `STATUS:${STATUS[a.status] || "TENTATIVE"}`,
      `URL:${portalUrl}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "TRIGGER:-P1D",
      `DESCRIPTION:${esc(`Morgen: ${a.title}`)}`,
      "END:VALARM",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
