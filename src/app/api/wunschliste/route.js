// POST /api/wunschliste — legt aus der Merkliste eine teilbare Wunschliste an.
// Antwort: Teilen-Link (+ QR) und Verwaltungslink (Schlüssel im #Fragment).
// Speicher: .data/wunschliste (Entwicklung); nichts geht ans Backoffice.
// Doku: qa-screenshots/service/wunschliste-bau.md
import { createList, RATE } from "@/lib/wunschliste/service";
import { CreateBody } from "@/lib/wunschliste/schemas";
import { fail, json, readBody } from "@/lib/wunschliste/http";
import { shareBundle } from "@/lib/wunschliste/share";

export async function POST(request) {
  try {
    const { data, response } = await readBody(request, CreateBody, { rate: RATE.create, scope: "create" });
    if (response) return response;
    const created = await createList(data);
    return json({ ok: true, ref: created.ref, expiresAt: created.expiresAt, adminToken: created.adminToken, ...shareBundle({ locale: data.locale, ...created }, request.headers) }, 201);
  } catch (error) {
    return fail(error);
  }
}
