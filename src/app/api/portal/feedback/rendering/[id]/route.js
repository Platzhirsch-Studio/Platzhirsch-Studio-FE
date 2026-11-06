import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { DATA_DIR } from "@/lib/portal/config";
import { requireApiSession } from "@/lib/portal/dal";

// GET /api/portal/feedback/rendering/:id – full-resolution rendering image of
// the logged-in customer. Renderings are private project data, so they are
// never placed in /public.
// Mock/dev: Rendering.image is a storage key resolved in /.data/portal/renderings/.
// Frappe later: Rendering.image = File.file_url (is_private=1) -> proxy via
// /api/method/frappe.utils.file_manager.download_file with the API token.

const TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif" };
const notFound = () => NextResponse.json({ error: "Nicht gefunden" }, { status: 404, headers: { "Cache-Control": "no-store" } });

export async function GET(request, ctx) {
  const auth = await requireApiSession(request);
  if (auth.response) return auth.response;
  const { id } = await ctx.params;
  if (!/^[A-Za-z0-9_.-]{1,80}$/.test(id)) return notFound();

  const { portal } = auth;
  const projects = await portal.listProjects();
  let rendering = null;
  for (const p of projects) {
    rendering = (await portal.listRenderings(p.id)).find((r) => r.id === id);
    if (rendering) break;
  }
  if (!rendering?.image) return notFound();

  const name = path.basename(String(rendering.image));
  const type = TYPES[path.extname(name).toLowerCase()];
  if (!type) return notFound();
  // ph-Backend (BACKEND_GENERATION, Gruppe portal): image = private file_url → portal_file.
  if (portal.readFile) {
    try {
      const file = await portal.readFile(String(rendering.image));
      if (!file?.content_base64) return notFound();
      return new NextResponse(Buffer.from(file.content_base64, "base64"), {
        headers: { "Content-Type": type, "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" },
      });
    } catch {
      return notFound();
    }
  }
  try {
    const buffer = await readFile(path.join(DATA_DIR, "renderings", name));
    return new NextResponse(buffer, {
      headers: { "Content-Type": type, "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return notFound();
  }
}
