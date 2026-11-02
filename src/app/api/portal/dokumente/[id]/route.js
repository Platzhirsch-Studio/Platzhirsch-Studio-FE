import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/portal/dal";
import { idSchema } from "@/lib/portal/schemas";
import { noStore } from "@/lib/portal/http";
import { loadDocumentFile } from "@/components/Portal/Docs/server/files";

// GET /api/portal/dokumente/<documentId>            -> inline (preview)
// GET /api/portal/dokumente/<documentId>?download=1 -> attachment
// Session required (401). The document is looked up through the
// customer-scoped adapter, so foreign ids answer 404 like unknown ones.

const SAFE_INLINE = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export async function GET(request, ctx) {
  const auth = await requireApiSession(request);
  if (auth.response) return auth.response;

  const { id } = await ctx.params;
  const notFound = () => NextResponse.json({ error: "Dokument nicht gefunden" }, { status: 404, headers: noStore });
  if (!idSchema.safeParse(id).success) return notFound();

  const docs = await auth.portal.listDocuments();
  const doc = docs.find((d) => d.id === id);
  if (!doc) return notFound();

  const project = await auth.portal.getProject(doc.projectId);
  let file;
  try {
    file = await loadDocumentFile(doc, { project, customer: auth.portal.customer });
  } catch (err) {
    console.error("[portal] Dokument konnte nicht geladen werden:", err);
    return NextResponse.json({ error: "Dokument derzeit nicht verfügbar" }, { status: 502, headers: noStore });
  }
  if (!file) return NextResponse.json({ error: "Für dieses Dokument liegt noch keine Datei vor" }, { status: 404, headers: noStore });

  const download = new URL(request.url).searchParams.get("download") === "1";
  const inline = !download && SAFE_INLINE.has(file.mime);
  return new Response(file.body, {
    status: 200,
    headers: {
      ...noStore,
      "Content-Type": SAFE_INLINE.has(file.mime) ? file.mime : "application/octet-stream",
      "Content-Length": String(file.body.length),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${file.name}"`,
      "X-Content-Type-Options": "nosniff",
      // Allow the same-origin preview <iframe>; everything else stays framed-out.
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "frame-ancestors 'self'", // no "sandbox": it breaks Chrome's PDF viewer
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
    },
  });
}
