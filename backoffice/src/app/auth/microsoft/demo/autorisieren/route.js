// GET /auth/microsoft/demo/autorisieren – „Code ausstellen“ des lokalen Demo-Issuers (nur Mock-Modus).
// Entspricht der Rückleitung von Microsoft nach der Kontowahl: redirect_uri?code=…&state=…
import { CALLBACK_PFAD, demoAktiv, demoCodeAusstellen } from "@/lib/backoffice/auth/microsoft";
import { weiter } from "../../weiter";

export async function GET(request) {
  if (!demoAktiv()) return new Response("Nicht gefunden", { status: 404 });
  const sp = request.nextUrl.searchParams;
  const state = sp.get("state") || "";
  if (sp.get("abbrechen")) return weiter(`${CALLBACK_PFAD}?error=access_denied&state=${encodeURIComponent(state)}`);
  let code;
  try {
    code = demoCodeAusstellen({
      email: (sp.get("email") || "").slice(0, 254),
      nonce: sp.get("nonce") || "",
      challenge: sp.get("code_challenge") || "",
      method: sp.get("code_challenge_method") || "",
      redirectUri: sp.get("redirect_uri") || "",
      clientId: sp.get("client_id") || "",
    });
  } catch {
    return weiter(`${CALLBACK_PFAD}?error=invalid_request&state=${encodeURIComponent(state)}`);
  }
  return weiter(`${CALLBACK_PFAD}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`);
}
