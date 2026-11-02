// POST /api/wunschliste/verwalten — alles, was nur der Ersteller darf:
// ansehen (Reservierungen mit Namen, Beiträge ohne E-Mail), mit der Merkliste
// abgleichen, Link erneuern, widerrufen, wieder teilen, löschen.
// Der Schlüssel kommt aus dem #Fragment der Verwaltungsseite im Body, nie in der URL.
import { manage, RATE } from "@/lib/wunschliste/service";
import { ManageBody } from "@/lib/wunschliste/schemas";
import { fail, json, readBody } from "@/lib/wunschliste/http";
import { shareBundle } from "@/lib/wunschliste/share";

export async function POST(request) {
  try {
    const { data, response } = await readBody(request, ManageBody, { rate: RATE.manage, scope: "manage" });
    if (response) return response;
    const { token, action, ...payload } = data;
    const result = await manage(token, action, payload);
    if (result.deleted) return json({ ok: true, deleted: true });
    const { shareId, ...rest } = result;
    return json({ ok: true, ...rest, ...shareBundle({ locale: rest.list.locale, shareId }, request.headers) });
  } catch (error) {
    return fail(error);
  }
}
