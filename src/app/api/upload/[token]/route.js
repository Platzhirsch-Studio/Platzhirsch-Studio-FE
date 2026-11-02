// GET  /api/upload/<token> — status of the upload link (files, note, limits).
// POST /api/upload/<token> — save the note and/or confirm ("submit").
import { z } from "zod";
import { UPLOAD_CONFIG } from "@/lib/upload/config";
import { openSession, publicSession, saveNote } from "@/lib/upload/service";
import { fail, json, linkLimited } from "@/lib/upload/http";

const Body = z.object({
  note: z.string().max(UPLOAD_CONFIG.noteMaxLength).optional().default(""),
  submit: z.boolean().optional().default(false),
  consentVersion: z.string().max(40).optional(),
});

export async function GET(_request, ctx) {
  try {
    const { token } = await ctx.params;
    const { session } = await openSession(token);
    return json({ ok: true, session: publicSession(session) });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request, ctx) {
  try {
    const { token } = await ctx.params;
    const limited = await linkLimited(token, "note");
    if (limited) return limited;
    const parsed = Body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return json({ ok: false, error: "bad_request" }, 400);
    const session = await saveNote(token, parsed.data);
    return json({ ok: true, session });
  } catch (error) {
    return fail(error);
  }
}
