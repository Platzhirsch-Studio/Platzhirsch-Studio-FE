import { backofficeService } from "@/lib/backoffice/frappe";
import { ablage, ablageCode } from "@/lib/backoffice/ablage/methoden";
import { sichereMockSeed } from "@/lib/backoffice/ablage/daten";
import { liefereAus } from "@/lib/backoffice/ablage/auslieferung";
import { tokenGueltig } from "@/lib/backoffice/ablage/regeln";

// Download der öffentlichen Freigabe (Konzept §3.5): GET ohne Passwort, POST mit Formularfeld „passwort“.
// Service-Token des Backoffice ruft freigabe_aufloesen (zählt einen Download, Frappe begrenzt 30/min) und
// liefert aus (S3-Direktlink → 302, sonst Durchreichen). Fehler → zurück zur Freigabeseite.
export const dynamic = "force-dynamic";

async function laden(request, token, passwort) {
  const zurueck = (fehler) => Response.redirect(new URL(`/f/${encodeURIComponent(token)}${fehler ? `?fehler=${fehler}` : ""}`, request.url), 303);
  if (!tokenGueltig(token)) return zurueck();
  const client = backofficeService();
  sichereMockSeed(client);
  try {
    const r = await ablage(client, "freigabe_aufloesen", { token, passwort: passwort || undefined });
    return await liefereAus({ client, link: { url: r.url, art: r.art, dateiname: r.dateiname, mime: r.mime }, inline: false });
  } catch (err) {
    const code = ablageCode(err);
    if (code === "forbidden" && passwort) return zurueck("passwort");
    return zurueck(code === "password_required" ? null : code);
  }
}

export async function GET(request, { params }) {
  const { token } = await params;
  return laden(request, token, null);
}

export async function POST(request, { params }) {
  const { token } = await params;
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return new Response("Ungültige Herkunft", { status: 403 });
  let passwort = "";
  try {
    const f = await request.formData();
    passwort = String(f.get("passwort") || "").slice(0, 128);
  } catch {
    passwort = "";
  }
  return laden(request, token, passwort);
}
