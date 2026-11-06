// GET /auth/microsoft/start?next=/crm – beginnt die Microsoft-Anmeldung (Authorization Code + PKCE).
// state/nonce/code_verifier liegen nur im signierten HttpOnly-Flow-Cookie (10 min, Pfad /auth/microsoft).
import { cookies } from "next/headers";
import { IS_PRODUCTION, hasSessionSecret } from "@/lib/backoffice/config";
import { starteAnmeldung } from "@/lib/backoffice/auth/microsoft";
import { FLOW_COOKIE, flowCookieOptionen } from "@/lib/backoffice/auth/oidc";
import { loginFehler, weiter } from "../weiter";

export async function GET(request) {
  if (!hasSessionSecret()) return loginFehler("nicht_eingerichtet");
  const sp = request.nextUrl.searchParams;
  try {
    const { url, cookie } = await starteAnmeldung({ next: sp.get("next") || "", loginHint: sp.get("login_hint") || "" });
    (await cookies()).set(FLOW_COOKIE, cookie, flowCookieOptionen(IS_PRODUCTION));
    return weiter(url);
  } catch (err) {
    console.warn("[backoffice] Microsoft-Anmeldung nicht startbar:", err?.code || err?.name || "fehler");
    return loginFehler(err?.msCode || "technik");
  }
}
