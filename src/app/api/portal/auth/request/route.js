import { NextResponse } from "next/server";
import { getAdapter } from "@/lib/portal/adapters";
import { IS_PRODUCTION, PORTAL_LOGIN_PATH, publicOrigin } from "@/lib/portal/config";
import { clientIp, isSameOrigin, noStore, readBody, redirectTo } from "@/lib/portal/http";
import { issueMagicLink } from "@/lib/portal/magicLink";
import { mailReady, sendLoginMail } from "@/lib/portal/mailer";
import { rateLimit } from "@/lib/portal/rateLimit";
import { loginRequestSchema } from "@/lib/portal/schemas";

// POST /api/portal/auth/request  { email, next? }  (form post or JSON)
// Always answers the same way whether the address is known or not (no
// account enumeration). Form posts are redirected (303) to the "check your
// inbox" page; JSON callers get { ok: true }.

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Ungültige Herkunft" }, { status: 403, headers: noStore });
  }
  const { data, json } = await readBody(request);
  const parsed = loginRequestSchema.safeParse(data);
  const fail = (code, status) =>
    json
      ? NextResponse.json({ ok: false, error: code }, { status, headers: noStore })
      : redirectTo(request, `${PORTAL_LOGIN_PATH}?fehler=${code}`);

  if (!parsed.success) return fail("email", 400);
  const { email, next } = parsed.data;

  const ipLimit = rateLimit(`ip:${clientIp(request)}`, { limit: 20, windowMs: 15 * 60 * 1000 });
  const mailLimit = rateLimit(`mail:${email}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!ipLimit.ok || !mailLimit.ok) return fail("zuviele", 429);

  // Production without mail setup: same error for every address (no enumeration).
  if (!mailReady()) {
    console.error("[portal] Login nicht möglich: Mailversand/Secrets in Produktion nicht konfiguriert.");
    return fail("technik", 503);
  }

  try {
    const customer = await getAdapter().findCustomerByEmail(email);
    if (customer) {
      const link = await issueMagicLink({ customerId: customer.id, origin: publicOrigin(request), next });
      await sendLoginMail({ to: customer.email, name: customer.displayName, ...link });
    } else if (!IS_PRODUCTION) {
      console.info(`[portal] Login angefragt für unbekannte Adresse ${email} – kein Link erzeugt.`);
    }
  } catch (err) {
    console.error("[portal] Login-Anfrage fehlgeschlagen:", err);
    return fail("technik", 500);
  }

  if (json) return NextResponse.json({ ok: true }, { headers: noStore });
  return redirectTo(request, `${PORTAL_LOGIN_PATH}/gesendet`);
}
