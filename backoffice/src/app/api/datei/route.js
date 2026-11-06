import { requireApiSession } from "@/lib/backoffice/auth/dal";
import { backoffice } from "@/lib/backoffice/frappe";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";

// Private Dateien aus Frappe (/private/files/…) als Stream – nur mit Sitzung,
// nur Pfade unter /files/ bzw. /private/files/ (kein offener Proxy).
export const dynamic = "force-dynamic";
export async function GET(request) {
  const auth = await requireApiSession(request);
  if (auth.response) return auth.response;
  const url = new URL(request.url).searchParams.get("url") || "";
  if (!/^\/(private\/)?files\/[^?#]+$/.test(url) || url.includes("..")) {
    return Response.json({ code: "invalid", message: "Ungültiger Dateipfad." }, { status: 400 });
  }
  try {
    const datei = await backoffice(auth.session).getFile(url);
    return new Response(datei.body, {
      headers: {
        "Content-Type": datei.type || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(datei.name)}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    const status = istBackofficeError(err) ? err.status : 500;
    return Response.json({ code: err?.code || "unavailable", message: err?.message || "Fehler" }, { status });
  }
}
