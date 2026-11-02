import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/portal/dal";
import { publicOrigin } from "@/lib/portal/config";
import { idSchema } from "@/lib/portal/schemas";
import { noStore } from "@/lib/portal/http";
import { loadAttachment } from "@/components/Portal/Docs/server/files";
import { getPassEntry, toDppJson } from "@/components/Portal/Docs/server/passes";

// GET /api/portal/dokumente/pass/<passId>             -> machine-readable product pass
//     (schema.org/Product + block structure of the EU Digital Product Passport)
// GET /api/portal/dokumente/pass/<passId>?download=1  -> same, as file
// GET /api/portal/dokumente/pass/<passId>?anhang=<n>  -> attachment n (photo, care sheet)
// Session required (401); only passes of the signed-in customer (else 404).

const nf = () => NextResponse.json({ error: "Nicht gefunden" }, { status: 404, headers: noStore });

export async function GET(request, ctx) {
  const auth = await requireApiSession(request);
  if (auth.response) return auth.response;

  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return nf();
  const entry = await getPassEntry(auth.portal, id);
  if (!entry) return nf();

  const params = new URL(request.url).searchParams;
  const anhang = params.get("anhang");
  if (anhang !== null) {
    const index = Number(anhang);
    const att = Number.isInteger(index) && index >= 0 ? entry.pass.attachments?.[index] : null;
    const file = att ? await loadAttachment(att.storageKey) : null;
    if (!file) return nf();
    return new Response(file.body, {
      headers: {
        ...noStore,
        "Content-Type": file.mime,
        "Content-Length": String(file.body.length),
        "Content-Disposition": `inline; filename="${file.name}"`,
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  const url = `${publicOrigin(request)}/de/portal/pass/${encodeURIComponent(id)}`;
  const body = JSON.stringify(toDppJson(entry, { url }), null, 2);
  return new Response(body, {
    status: 200,
    headers: {
      ...noStore,
      "Content-Type": "application/ld+json; charset=utf-8",
      ...(params.get("download") === "1" ? { "Content-Disposition": `attachment; filename="produktpass-${id}.json"` } : {}),
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
