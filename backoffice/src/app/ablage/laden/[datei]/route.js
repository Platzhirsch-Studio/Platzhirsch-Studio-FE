import { requireApiSession } from "@/lib/backoffice/auth/dal";
import { darf } from "@/lib/backoffice/auth/rechte";
import { alsFehler, kontext } from "@/lib/backoffice/ablage/daten";
import { ablage } from "@/lib/backoffice/ablage/methoden";
import { liefereAus } from "@/lib/backoffice/ablage/auslieferung";

// Datei laden (Konzept §2.1): GET /ablage/laden/<datei>[?v=<version>][&inline=1][&vorschau=1]
// Download/Inline über ph_ablage.api.download_link, Vorschaubild über vorschau_link – immer mit der Sitzung des
// Mitarbeiters (Frappe prüft Rechte und protokolliert den Download).
export const dynamic = "force-dynamic";

const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,139}$/;

export async function GET(request, { params }) {
  const auth = await requireApiSession(request);
  if (auth.response) return auth.response;
  if (!darf(auth.session, "ablage", "read")) return new Response("Keine Berechtigung", { status: 403 });
  const { datei } = await params;
  if (!NAME_RE.test(datei)) return new Response("Ungültig", { status: 400 });
  const sp = new URL(request.url).searchParams;
  const version = Number(sp.get("v")) || undefined;
  const vorschau = sp.get("vorschau") === "1";
  const inline = vorschau || sp.get("inline") === "1";
  try {
    const ctx = kontext(auth.session);
    if (vorschau) {
      const v = await ablage(ctx.client, "vorschau_link", { datei, version });
      if (!v?.url) return new Response("Keine Vorschau", { status: 404, headers: { "Cache-Control": "no-store" } });
      return await liefereAus({ client: ctx.client, link: { url: v.url, art: v.art || "proxy", mime: v.vorschau_mime || v.mime, dateiname: `vorschau-${datei}` }, inline: true, cache: "private, max-age=300" });
    }
    const link = await ablage(ctx.client, "download_link", { datei, version, inline: inline ? 1 : 0 });
    return await liefereAus({ client: ctx.client, link, inline });
  } catch (err) {
    const f = alsFehler(err);
    return new Response(f.message, { status: err?.status && err.status >= 400 ? err.status : 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  }
}
