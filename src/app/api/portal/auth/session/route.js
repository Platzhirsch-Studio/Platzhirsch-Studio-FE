import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/portal/dal";
import { noStore } from "@/lib/portal/http";

// GET /api/portal/auth/session – for Client Components that need to know
// whether the visitor is logged in. Returns only the display name.

export async function GET(request) {
  const auth = await requireApiSession(request);
  if (auth.response) return NextResponse.json({ authenticated: false }, { headers: noStore });
  return NextResponse.json(
    { authenticated: true, displayName: auth.portal.customer.displayName, expiresAt: auth.session.expiresAt },
    { headers: noStore }
  );
}
