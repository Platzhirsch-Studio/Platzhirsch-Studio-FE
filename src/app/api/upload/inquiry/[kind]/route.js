// POST /api/upload/inquiry/<produkt|beratung|kontakt> — the three inquiry
// forms send here instead of straight to /api/anfrage_produkt,
// /api/beratung_anfrage and /api/kontakt. The request is handed with the same
// body (and the visitor's proxy headers) to that existing route handler
// (owned by the website team, not modified); only when it answers with a REAL
// success does this route add a short-lived signed "Anfrage-Ticket"
// (`upload.ticket`). Honeypot/time-trap fake successes get none.
// The success screen exchanges the ticket for the QR upload link
// (POST /api/upload/session). Logic + tests: src/lib/upload/inquiry.js.
import { POST as produktPOST } from "@/app/api/anfrage_produkt/route";
import { POST as beratungPOST } from "@/app/api/beratung_anfrage/route";
import { POST as kontaktPOST } from "@/app/api/kontakt/route";
import { signTicket } from "@/lib/upload/token";
import { handleInquiry } from "@/lib/upload/inquiry";

const handlers = { produkt: produktPOST, beratung: beratungPOST, kontakt: kontaktPOST };

export async function POST(request, ctx) {
  const { kind } = await ctx.params;
  return handleInquiry(request, kind, { handlers, sign: signTicket });
}
