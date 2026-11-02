import { NextResponse } from "next/server";
import { PORTAL_LOGIN_PATH } from "@/lib/portal/config";
import { isSameOrigin, noStore, redirectTo } from "@/lib/portal/http";
import { clearSession } from "@/lib/portal/session";

// POST /api/portal/auth/logout – clears the session cookie.

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Ungültige Herkunft" }, { status: 403, headers: noStore });
  }
  const wantsJson = (request.headers.get("accept") || "").includes("application/json");
  const response = wantsJson
    ? NextResponse.json({ ok: true }, { headers: noStore })
    : redirectTo(request, `${PORTAL_LOGIN_PATH}?abgemeldet=1`);
  return clearSession(response);
}
