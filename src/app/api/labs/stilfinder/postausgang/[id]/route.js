// src/app/api/labs/stilfinder/postausgang/[id]/route.js
// DEV ONLY: shows the PDF of one dev-outbox entry (.data/stilfinder/outbox),
// i.e. the attachment the customer would have received. 404 in production
// and for unknown or expired ids (7 days). The id is random (96 bit).
import { IS_PRODUCTION } from "@/lib/stilfinder/config";
import { readOutboxPdf } from "@/lib/stilfinder/outbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

export async function GET(_request, { params }) {
  if (IS_PRODUCTION) return notFound();
  const { id } = await params;
  const entry = await readOutboxPdf(id);
  if (!entry) return notFound();
  return new Response(entry.pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${entry.meta.filename || "moodboard.pdf"}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
