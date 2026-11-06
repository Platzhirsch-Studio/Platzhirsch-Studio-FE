import { requireApiSession } from "@/lib/backoffice/auth/dal";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import { darfDoc } from "@/lib/backoffice/auth/rechte";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";

// Link-Feld-Suche: GET /api/link?doctype=PH%20Kontakt&q=mu → { treffer:[{value, description}] }
export const dynamic = "force-dynamic";
export async function GET(request) {
  const auth = await requireApiSession(request);
  if (auth.response) return auth.response;
  const sp = new URL(request.url).searchParams;
  const doctype = sp.get("doctype") || "";
  const q = (sp.get("q") || "").slice(0, 80);
  if (!doctype || doctype.length > 80) return Response.json({ treffer: [] }, { status: 400 });
  try {
    const client = backoffice(auth.session);
    const meta = await ladeMeta(client, doctype);
    if (!darfDoc(auth.session, meta, "read")) return Response.json({ code: "forbidden", treffer: [] }, { status: 403 });
    const treffer = await client.searchLink(doctype, q, 10);
    return Response.json({ treffer }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const status = istBackofficeError(err) ? err.status : 500;
    return Response.json({ treffer: [], code: err?.code || "unavailable" }, { status });
  }
}
