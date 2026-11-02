// /de/adventsabend/kalender.ics — "In den Kalender" für den Adventsabend.
// Liefert die .ics-Datei nur, wenn EVENT.startTime gesetzt ist; vorher 404,
// damit niemand einen Termin ohne Uhrzeit in den Kalender legt.
// (Die Proxy-Matcher-Regel lässt Pfade mit Punkt durch, next-intl greift hier nicht.)
import { buildIcs } from "@/components/Event/ics";
import { CALENDAR_FILE, calendarEvent, hasStartTime } from "../event";

export async function GET(request, { params }) {
  const { locale } = await params;
  if (locale !== "de" || !hasStartTime()) {
    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
    });
  }

  const body = buildIcs(calendarEvent());
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${CALENDAR_FILE}"`,
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}
