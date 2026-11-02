// POST /api/wunschliste/<shareId>/freigeben — eigene Reservierung aufheben
// (mit dem Storno-Schlüssel aus dem Browser der Schenkenden).
import { RATE, release } from "@/lib/wunschliste/service";
import { isToken } from "@/lib/wunschliste/ids";
import { ReleaseBody } from "@/lib/wunschliste/schemas";
import { fail, json, readBody } from "@/lib/wunschliste/http";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    if (!isToken(id)) return json({ ok: false, error: "not_found" }, 404);
    const { data, response } = await readBody(request, ReleaseBody, { rate: RATE.write, scope: "release" });
    if (response) return response;
    const { view } = await release(id, data);
    return json({ ok: true, item: data.item, items: view.items.map(({ key, reserved }) => ({ key, reserved })) });
  } catch (error) {
    return fail(error);
  }
}
