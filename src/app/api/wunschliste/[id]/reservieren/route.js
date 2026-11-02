// POST /api/wunschliste/<shareId>/reservieren — Schenkende reservieren ein Stück.
// Öffentlich wird nur „reserviert“ gezeigt; Name/Notiz sieht nur der Ersteller.
// Antwort enthält den Storno-Schlüssel (nur einmal, bleibt im Browser).
import { RATE, reserve } from "@/lib/wunschliste/service";
import { isToken } from "@/lib/wunschliste/ids";
import { ReserveBody } from "@/lib/wunschliste/schemas";
import { fail, json, readBody } from "@/lib/wunschliste/http";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    if (!isToken(id)) return json({ ok: false, error: "not_found" }, 404);
    const { data, response } = await readBody(request, ReserveBody, { rate: RATE.write, scope: "reserve" });
    if (response) return response;
    const { view, result } = await reserve(id, data);
    return json({ ok: true, item: data.item, cancel: result, items: view.items.map(({ key, reserved }) => ({ key, reserved })) });
  } catch (error) {
    return fail(error);
  }
}
