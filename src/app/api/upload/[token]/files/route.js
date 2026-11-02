// POST /api/upload/<token>/files — register a file before its chunks are
// sent. Returns fileId, chunk size and the chunks the server already has
// (same name+size+lastModified → resume an interrupted upload).
import { z } from "zod";
import { CATEGORY_KEYS } from "@/lib/upload/config";
import { initFile } from "@/lib/upload/service";
import { fail, json, linkLimited } from "@/lib/upload/http";

const Body = z.object({
  name: z.string().min(1).max(255),
  size: z.number().int().positive(),
  type: z.string().max(100).optional().default(""),
  lastModified: z.number().int().nonnegative().optional(),
  category: z.enum(CATEGORY_KEYS),
  consentVersion: z.string().max(40),
});

export async function POST(request, ctx) {
  try {
    const { token } = await ctx.params;
    const limited = await linkLimited(token, "init");
    if (limited) return limited;
    const parsed = Body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return json({ ok: false, error: "bad_request" }, 400);
    const file = await initFile(token, parsed.data);
    return json({ ok: true, file });
  } catch (error) {
    return fail(error);
  }
}
