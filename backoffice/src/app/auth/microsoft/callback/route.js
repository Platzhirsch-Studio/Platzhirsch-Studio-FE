// GET /auth/microsoft/callback?code=…&state=… – Rückkehr von Microsoft (bzw. Demo-Issuer).
// Code serverseitig tauschen, id_token prüfen, im Frappe-Modus ph_microsoft.api.sso_sitzung, dann
// Backoffice-Sitzung wie beim Passwort-Login (startSession, Arbeitsplatz-Regel). Rate-Limit nur Fehlversuche.
import { cookies } from "next/headers";
import { IS_PRODUCTION, LOGIN_RATE_LIMIT, hasSessionSecret } from "@/lib/backoffice/config";
import { clientIp, getGeraet, startSession } from "@/lib/backoffice/auth/dal";
import { beendeAnmeldung, startziel } from "@/lib/backoffice/auth/microsoft";
import { FLOW_COOKIE, flowCookieOptionen } from "@/lib/backoffice/auth/oidc";
import { ipHash, rateLimit, rateLimitStatus } from "@/lib/backoffice/auth/rateLimit";
import { sessionStore } from "@/lib/backoffice/auth/store";
import { loginFehler, weiter } from "../weiter";

export async function GET(request) {
  const store = await cookies();
  const flowCookie = store.get(FLOW_COOKIE)?.value;
  // Flow-Cookie ist einmalig: sofort löschen, egal wie es ausgeht.
  store.set(FLOW_COOKIE, "", { ...flowCookieOptionen(IS_PRODUCTION), maxAge: 0 });
  if (!hasSessionSecret()) return loginFehler("nicht_eingerichtet");

  const schluessel = `login:ms:${ipHash(await clientIp())}`;
  if (!rateLimitStatus(schluessel, LOGIN_RATE_LIMIT).ok) return loginFehler("rate_limited");

  const sp = request.nextUrl.searchParams;
  let r;
  try {
    r = await beendeAnmeldung({ query: { code: sp.get("code") || "", state: sp.get("state") || "", error: sp.get("error") || "" }, flowCookie });
  } catch (err) {
    rateLimit(schluessel, LOGIN_RATE_LIMIT); // Fehlversuch zählen
    console.warn("[backoffice] Microsoft-Anmeldung abgelehnt:", err?.msCode || err?.code || "fehler", err?.detail?.grund || err?.detail?.phCode || "");
    return loginFehler(err?.msCode || "technik");
  }

  const { startplatz, kiosk, ziel } = startziel({ roles: r.roles, geraet: await getGeraet(), next: r.next });
  const sid = await startSession({ user: r.user, name: r.name, roles: r.roles, frappeSid: r.frappeSid, standort: r.standort, arbeitsplatz: startplatz, kiosk });
  await sessionStore().update(sid, { loginArt: r.art });
  return weiter(ziel);
}
