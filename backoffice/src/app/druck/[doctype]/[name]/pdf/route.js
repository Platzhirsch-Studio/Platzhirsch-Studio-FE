import { getSession } from "@/lib/backoffice/auth/dal";
import { backoffice, doctypeAusSegment, ladeMeta } from "@/lib/backoffice/frappe";
import { darfDoc } from "@/lib/backoffice/auth/rechte";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";

// PDF eines Frappe-Druckformats (nur Frappe-Modus): frappe.utils.print_format.download_pdf.
export const dynamic = "force-dynamic";
export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return Response.json({ code: "auth" }, { status: 401 });
  const { doctype: segment, name } = await params;
  const format = new URL(request.url).searchParams.get("format") || "Standard";
  try {
    const client = backoffice(session);
    if (client.modus !== "frappe") return Response.json({ code: "unavailable", message: "PDF nur im Frappe-Modus." }, { status: 503 });
    const doctype = await doctypeAusSegment(client, segment);
    const meta = await ladeMeta(client, doctype);
    if (!darfDoc(session, meta, "print")) return Response.json({ code: "forbidden" }, { status: 403 });
    const pdf = await client.getPdf(doctype, decodeURIComponent(name), { format });
    return new Response(pdf.body, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${encodeURIComponent(pdf.name)}"`, "Cache-Control": "private, no-store" } });
  } catch (err) {
    return Response.json({ code: err?.code || "unavailable", message: err?.message }, { status: istBackofficeError(err) ? err.status : 500 });
  }
}
