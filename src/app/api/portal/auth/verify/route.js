import { NextResponse } from "next/server";
import { PORTAL_BASE_PATH, PORTAL_LOGIN_PATH } from "@/lib/portal/config";
import { isSameOrigin, noStore, readBody, redirectTo } from "@/lib/portal/http";
import { redeemMagicLink } from "@/lib/portal/magicLink";
import { magicTokenSchema } from "@/lib/portal/schemas";
import { attachSession } from "@/lib/portal/session";

// POST /api/portal/auth/verify  { token }
// Redeems a magic link and sets the HttpOnly session cookie. Deliberately
// POST-only: the e-mail link opens /de/portal/login/bestaetigen, which posts
// here on a button press – so mail scanners that prefetch links (GET) can't
// burn the one-time token.

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Ungültige Herkunft" }, { status: 403, headers: noStore });
  }
  const { data, json } = await readBody(request);
  const token = magicTokenSchema.safeParse(data.token);
  const fail = (code) =>
    json
      ? NextResponse.json({ ok: false, error: code }, { status: 400, headers: noStore })
      : redirectTo(request, `${PORTAL_LOGIN_PATH}?fehler=${code}`);

  if (!token.success) return fail("ungueltig");

  let result;
  try {
    result = await redeemMagicLink(token.data);
  } catch (err) {
    console.error("[portal] Token-Prüfung fehlgeschlagen:", err);
    return fail("technik");
  }
  if (result.error) return fail(result.error);

  const target = result.next || PORTAL_BASE_PATH;
  const response = json ? NextResponse.json({ ok: true, next: target }, { headers: noStore }) : redirectTo(request, target);
  return attachSession(response, result.customerId);
}

export function GET(request) {
  // Old/forwarded links that point here directly: send them to the confirm page.
  const token = new URL(request.url).searchParams.get("token") || "";
  return redirectTo(request, `${PORTAL_LOGIN_PATH}/bestaetigen?token=${encodeURIComponent(token)}`);
}
