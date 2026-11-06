import { requireApiSession } from "@/lib/backoffice/auth/dal";
import { backoffice } from "@/lib/backoffice/frappe";
import { suche } from "@/lib/backoffice/suche/index";

// Befehlspalette: GET /api/suche?q=… (nur mit Sitzung, Ergebnisse nach Rechten).
export const dynamic = "force-dynamic";
export async function GET(request) {
  const auth = await requireApiSession(request);
  if (auth.response) return auth.response;
  const q = new URL(request.url).searchParams.get("q") || "";
  try {
    const ergebnis = await suche(backoffice(auth.session), auth.session, q);
    return Response.json(ergebnis, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ gruppen: [] }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
}
