// POST /api/wunschliste/<shareId>/beitrag — Beitrag zum Gemeinschafts-Gutschein.
// Kanal nach dem wirksamen VOUCHER_MODE (src/lib/commerce/mode.js):
//   anfrage (auch bei "off"): Beitrag wird als Anfrage gespeichert, es wird
//     nichts bezahlt; das Studio meldet sich (in der Entwicklung nur lokal).
//   stripe: Beitrag "offen", danach Kauf über /de/gutscheine (Metadaten:
//     src/lib/wunschliste/groupVoucher.js checkoutMetadata).
//   kontakt (Produktion ohne Frappe): 409, die Seite zeigt Telefon/E-Mail.
//   aus (Produktion, Gutscheine nicht freigegeben): 409, kein Abschnitt.
//   stripe nur mit freigegebenem und angebundenem Gemeinschafts-Gutschein
//     (src/lib/wunschliste/config.js GEMEINSCHAFTS_GUTSCHEIN).
// Es wird keine Mail verschickt und nichts ans Backoffice geschrieben.
import { connection } from "next/server";
import { contribute, RATE } from "@/lib/wunschliste/service";
import { contributionChannel } from "@/lib/wunschliste/mode";
import { isToken } from "@/lib/wunschliste/ids";
import { ContributionBody } from "@/lib/wunschliste/schemas";
import { fail, json, readBody } from "@/lib/wunschliste/http";
import { voucherMode } from "@/lib/commerce/mode";

export async function POST(request, { params }) {
  try {
    await connection();
    const { id } = await params;
    if (!isToken(id)) return json({ ok: false, error: "not_found" }, 404);
    const channel = contributionChannel(voucherMode());
    if (channel === "kontakt") return json({ ok: false, error: "contact_only" }, 409);
    if (channel === "aus") return json({ ok: false, error: "unavailable" }, 409);
    const { data, response } = await readBody(request, ContributionBody, { rate: RATE.write, scope: "contribute" });
    if (response) return response;
    const { result } = await contribute(id, data, channel);
    return json({ ok: true, channel, ref: result.ref, ...(channel === "stripe" ? { next: "/de/gutscheine" } : {}) }, 201);
  } catch (error) {
    return fail(error);
  }
}
