import { requireApiSession } from "@/lib/backoffice/auth/dal";
import { darf } from "@/lib/backoffice/auth/rechte";
import { kontext, alsFehler } from "@/lib/backoffice/ablage/daten";
import { ablage } from "@/lib/backoffice/ablage/methoden";

// Teil-Upload der Ablage (Konzept §3.2): POST /ablage/hochladen?token=…&offset=… mit den rohen Bytes eines Teils.
// Der Browser spricht nie mit Frappe (Q-A1): diese Route reicht den Teil als Base64 an ph_ablage.api.upload_chunk
// weiter (Frappe-Sitzung des Mitarbeiters) bzw. an den Mock. Antwort { ok, daten: {erhalten, groesse, fertig} }.
export const dynamic = "force-dynamic";

const MAX_TEIL = 16 * 1024 * 1024;
const TOKEN_RE = /^[A-Za-z0-9_-]{8,200}$/;

export async function POST(request) {
  const auth = await requireApiSession(request);
  if (auth.response) return auth.response;
  if (!darf(auth.session, "ablage", "create")) return Response.json({ ok: false, code: "forbidden", message: "Keine Berechtigung." }, { status: 403 });
  const sp = new URL(request.url).searchParams;
  const token = sp.get("token") || "";
  const offset = Number(sp.get("offset") || 0);
  if (!TOKEN_RE.test(token) || !Number.isInteger(offset) || offset < 0) return Response.json({ ok: false, code: "invalid", message: "Unvollständige Angaben." }, { status: 400 });
  const laenge = Number(request.headers.get("content-length") || 0);
  if (laenge > MAX_TEIL) return Response.json({ ok: false, code: "invalid", message: "Teil zu groß." }, { status: 413 });
  try {
    const bytes = Buffer.from(await request.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_TEIL) return Response.json({ ok: false, code: "invalid", message: "Teil fehlt." }, { status: 400 });
    const ctx = kontext(auth.session);
    const r = await ablage(ctx.client, "upload_chunk", { token, offset, daten: bytes.toString("base64") });
    return Response.json({ ok: true, daten: r }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const f = alsFehler(err);
    return Response.json({ ok: false, ...f }, { status: err?.status && err.status >= 400 ? err.status : 503 });
  }
}
