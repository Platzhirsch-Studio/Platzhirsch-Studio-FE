// src/lib/payments/register.js
// Gutscheinregister für das Team (Showroom-Kasse): prüfen, einlösen
// (auch in Teilbeträgen), sperren, ersetzen. Im Register steht nur der Hash
// des Codes; der Code selbst kommt vom Kunden (PDF/Mail).
// Testmodus-Gutscheine (TEST-…) lassen sich nicht einlösen.
// Keine "@/..."-Importe.
import { z } from "zod";
import { formatEuro } from "../commerce/priceRules.js";
import { codeHash, normalizeCode } from "./codes.js";
import { parseEuroCents } from "./deposit.js";
import { uniqueCode, voucherMail } from "./voucherOrder.js";
import { paymentEvent } from "./backoffice.js";

export const registerSchema = z.object({
  aktion: z.enum(["pruefen", "einloesen", "sperren", "ersetzen"]),
  code: z.string().trim().min(16).max(40),
  betrag: z.preprocess((v) => (v === undefined || v === null || v === "" ? undefined : parseEuroCents(v)), z.number().int().min(1).optional()),
  beleg: z.string().trim().max(60).optional().default(""),
  grund: z.string().trim().max(200).optional().default(""),
});

/** Sicht auf einen Registereintrag (ohne Hash). */
export const viewEntry = (e) => ({
  ende: e.ende,
  bestellung: e.bestellung,
  wert: formatEuro(e.wert_cent / 100),
  rest: formatEuro(e.rest_cent / 100),
  rest_cent: e.rest_cent,
  status: e.status,
  test: e.test,
  einloesungen: e.einloesungen,
});

/** → { status, body } */
export async function registerAction(ctx, input) {
  const norm = normalizeCode(input.code);
  if (!norm) return { status: 400, body: { success: false, code: "invalid", error: "Code-Format ungültig." } };
  const hash = codeHash(norm);
  const entry = await ctx.store.get("register", hash);
  if (!entry) return { status: 404, body: { success: false, code: "unknown", error: "Code nicht im Register." } };
  const nowIso = new Date(ctx.now()).toISOString();

  if (input.aktion === "pruefen") return { status: 200, body: { success: true, gutschein: viewEntry(entry) } };

  if (input.aktion === "einloesen") {
    if (entry.test) return { status: 409, body: { success: false, code: "test", error: "Testgutschein, nicht einlösbar." } };
    if (entry.status !== "aktiv") return { status: 409, body: { success: false, code: entry.status, error: `Gutschein ist ${entry.status}.` } };
    if (!input.betrag) return { status: 400, body: { success: false, code: "invalid", error: "Betrag fehlt." } };
    let result;
    await ctx.store.update("register", hash, (e) => {
      if (input.betrag > e.rest_cent) {
        result = { status: 409, body: { success: false, code: "rest", error: `Restguthaben nur ${formatEuro(e.rest_cent / 100)}.` } };
        return undefined;
      }
      const next = { ...e, rest_cent: e.rest_cent - input.betrag, einloesungen: [...e.einloesungen, { zeit: nowIso, cent: input.betrag, beleg: input.beleg }] };
      if (next.rest_cent === 0) next.status = "eingeloest";
      result = { status: 200, body: { success: true, gutschein: viewEntry(next) } };
      return next;
    });
    if (result.status === 200) {
      await ctx.backoffice.emit(paymentEvent({ typ: "gutschein.eingeloest", art: "gutschein", referenz: entry.bestellung, betragCent: input.betrag, zahlungsstatus: `rest_${result.body.gutschein.rest_cent}`, livemode: !entry.test, now: new Date(ctx.now()) }));
    }
    return result;
  }

  if (input.aktion === "sperren") {
    const next = await ctx.store.update("register", hash, (e) => ({ ...e, status: "gesperrt", grund: input.grund || "gesperrt", gesperrt: nowIso }));
    return { status: 200, body: { success: true, gutschein: viewEntry(next) } };
  }

  // ersetzen: Restguthaben auf einen neuen Code, alter wird gesperrt, Mail an den Käufer.
  if (entry.status !== "aktiv" && entry.status !== "gesperrt") return { status: 409, body: { success: false, code: entry.status, error: `Gutschein ist ${entry.status}.` } };
  if (entry.rest_cent <= 0) return { status: 409, body: { success: false, code: "rest", error: "Kein Restguthaben." } };
  const order = await ctx.store.get("orders", entry.bestellung);
  if (!order) return { status: 404, body: { success: false, code: "unknown", error: "Bestellung nicht gefunden." } };
  const { code, hash: newHash } = await uniqueCode(ctx.store, { test: entry.test });
  await ctx.store.insert("register", newHash, { ...entry, hash: newHash, ende: code.slice(-4), wert_cent: entry.rest_cent, status: entry.test ? "test" : "aktiv", ausgestellt: nowIso, einloesungen: [], ersetzt: entry.ende });
  await ctx.store.update("register", hash, (e) => ({ ...e, status: "ersetzt", rest_cent: 0, grund: input.grund || "ersetzt", ersetzt_durch: code.slice(-4) }));
  await ctx.store.update("orders", order.id, (o) => ({ ...o, codes: [...o.codes, { hash: newHash, ende: code.slice(-4), ersetzt: entry.ende }] }));
  const mail = voucherMail({ ...order, betrag_cent: entry.rest_cent }, [{ code, test: entry.test }], { env: ctx.env, now: ctx.now() });
  const sent = await ctx.mailer.send({ ...mail, subject: `Ersatzgutschein (${order.id})`, tag: "gutschein-ersatz" });
  return { status: 200, body: { success: true, neu_ende: code.slice(-4), mail: sent.ok ? "gesendet" : "fehlgeschlagen" } };
}
