import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/portal/dal";
import { publicOrigin } from "@/lib/portal/config";
import { idSchema } from "@/lib/portal/schemas";
import { noStore } from "@/lib/portal/http";
import { buildIcs } from "@/components/Portal/Docs/server/ics";

// GET /api/portal/dokumente/kalender               -> all upcoming appointments (.ics)
// GET /api/portal/dokumente/kalender?termin=<id>   -> a single appointment
// Session required (401). Customer-scoped through the adapter.

export async function GET(request) {
  const auth = await requireApiSession(request);
  if (auth.response) return auth.response;

  const termin = new URL(request.url).searchParams.get("termin");
  if (termin && !idSchema.safeParse(termin).success) {
    return NextResponse.json({ error: "Ungültiger Termin" }, { status: 400, headers: noStore });
  }

  // Single export: any own appointment; full export: from 30 days ago on.
  const from = termin ? undefined : new Date(Date.now() - 30 * 86400000).toISOString();
  let items = await auth.portal.listAppointments(from ? { from } : {});
  if (termin) {
    items = items.filter((a) => a.id === termin);
    if (!items.length) return NextResponse.json({ error: "Termin nicht gefunden" }, { status: 404, headers: noStore });
  }

  const ics = buildIcs(items, {
    advisor: auth.portal.customer.advisor,
    portalUrl: `${publicOrigin(request)}/de/portal/termine`,
  });
  const name = termin ? `platzhirsch-${termin}.ics` : "platzhirsch-termine.ics";
  return new Response(ics, {
    status: 200,
    headers: {
      ...noStore,
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
