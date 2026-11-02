// PUT    /api/upload/<token>/files/<fileId>?index=<n> — one chunk (raw bytes)
// DELETE /api/upload/<token>/files/<fileId>          — customer removes a file
// Files are never served back from here: previews happen in the browser.
import { UPLOAD_CONFIG } from "@/lib/upload/config";
import { putChunk, removeFile } from "@/lib/upload/service";
import { fail, json, linkLimited } from "@/lib/upload/http";

const ID_RE = /^[A-Za-z0-9_-]{22}$/;

export async function PUT(request, ctx) {
  try {
    const { token, fileId } = await ctx.params;
    if (!ID_RE.test(fileId)) return json({ ok: false, error: "file_not_found" }, 404);
    const limited = await linkLimited(token, "chunk");
    if (limited) return limited;
    const index = Number(new URL(request.url).searchParams.get("index"));
    const declared = Number(request.headers.get("content-length") || 0);
    if (declared > UPLOAD_CONFIG.chunkSize) return json({ ok: false, error: "bad_chunk_size" }, 413);
    const bytes = Buffer.from(await request.arrayBuffer());
    if (bytes.length > UPLOAD_CONFIG.chunkSize) return json({ ok: false, error: "bad_chunk_size" }, 413);
    const file = await putChunk(token, fileId, index, bytes);
    return json({ ok: true, file });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request, ctx) {
  try {
    const { token, fileId } = await ctx.params;
    if (!ID_RE.test(fileId)) return json({ ok: false, error: "file_not_found" }, 404);
    const limited = await linkLimited(token, "remove");
    if (limited) return limited;
    await removeFile(token, fileId);
    return json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
