// POST /auth/microsoft/abmelden – Backoffice + Frappe abmelden (endSession), danach – wenn die Sitzung
// über Microsoft kam und BACKOFFICE_MS_LOGOUT=1 – auch bei Microsoft (end_session_endpoint).
// Nur POST mit gleicher Herkunft (kein Abmelden per eingebettetem Link).
import { endSession, getSession } from "@/lib/backoffice/auth/dal";
import { microsoftAbmeldeUrl } from "@/lib/backoffice/auth/microsoft";
import { sessionStore } from "@/lib/backoffice/auth/store";
import { weiter } from "../weiter";

export async function POST(request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  let gleicheHerkunft = false;
  try {
    gleicheHerkunft = !!origin && !!host && new URL(origin).host === host;
  } catch {
    gleicheHerkunft = false;
  }
  if (!gleicheHerkunft) return Response.json({ code: "forbidden", message: "Ungültige Herkunft." }, { status: 403 });
  const session = await getSession();
  const art = session ? (await sessionStore().get(session.sid))?.loginArt : null;
  await endSession();
  const msUrl = art === "microsoft" ? await microsoftAbmeldeUrl() : null;
  return weiter(msUrl || "/login?abgemeldet=1");
}
