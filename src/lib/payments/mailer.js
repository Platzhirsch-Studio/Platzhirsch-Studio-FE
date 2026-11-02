// src/lib/payments/mailer.js
// E-Mails der Zahlungsstrecke (Gutschein-PDF, Anzahlungs-Link, Bestätigungen)
// über einen Adapter.
//
//   outbox (Standard)  KEIN Versand. Jede Mail landet als Ordner in
//                      <PAYMENTS_DATA_DIR>/outbox/<Zeit>-<Id>/ (mail.json,
//                      mail.txt, mail.html, Anhänge). Zum Ansehen in der
//                      Entwicklung und für Tests.
//   resend             VORBEREITET, nicht aktiv: nur mit
//                      PAYMENTS_MAIL_PROVIDER=resend, PAYMENTS_MAIL_API_KEY und
//                      PAYMENTS_MAIL_FROM. Reines fetch an api.resend.com,
//                      Anhänge base64. Erst nach Freigabe des Inhabers setzen.
//
// In PRODUKTION ist der Postausgang gesperrt (QA P1): ohne vollständige
// Resend-Angaben liefert mailerFromEnv dort den Adapter "gesperrt", der
// nichts auf die Platte schreibt und ok: false meldet (Bestellung zeigt dann
// Mail "fehlgeschlagen"). Zusätzlich wirkt "stripe" in Produktion ohne
// Mail-Anbieter gar nicht (config.js paymentsReady → Rückfall "anfrage").
//
// Logs nennen nie die Adresse, nur einen Hash-Bezug (logRef).
// Keine "@/..."-Importe.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { logRef } from "./codes.js";
import { isProduction, mailProviderReady } from "./config.js";

export const MAIL_TIMEOUT_MS = 10_000;
export const DEFAULT_FROM = "Platzhirsch Home Living <info@platzhirsch.studio>";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Schlichtes HTML aus Absätzen (kein Tracking, keine externen Bilder). */
export function mailHtml(paragraphs, { button } = {}) {
  const ps = paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6">${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  const btn = button
    ? `<p style="margin:20px 0"><a href="${esc(button.href)}" style="display:inline-block;background:#30373e;color:#ffffff;text-decoration:none;padding:14px 26px">${esc(button.label)}</a></p>`
    : "";
  return `<!doctype html><html lang="de"><body style="margin:0;background:#faf8f4;font-family:Helvetica,Arial,sans-serif;color:#30373e"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;padding:32px"><tr><td><p style="margin:0 0 18px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#7a5e17">Platzhirsch Home Living</p>${ps}${btn}<p style="margin:24px 0 0;font-size:12px;color:#4a5158">Platzhirsch Home Living · Landstraße 11, 6911 Lochau · +43 5574 46255 · info@platzhirsch.studio</p></td></tr></table></td></tr></table></body></html>`;
}

export function createOutboxMailer(dir) {
  return {
    kind: "outbox",
    async send(mail) {
      const id = `${new Date().toISOString().replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 8)}`;
      const folder = path.join(/*turbopackIgnore: true*/ dir, id);
      await mkdir(folder, { recursive: true });
      const attachments = (mail.attachments || []).map((a) => ({ filename: a.filename, contentType: a.contentType, bytes: a.content.length }));
      await writeFile(path.join(/*turbopackIgnore: true*/ folder, "mail.json"), JSON.stringify({ to: mail.to, from: mail.from || DEFAULT_FROM, subject: mail.subject, tag: mail.tag, attachments }, null, 2));
      await writeFile(path.join(/*turbopackIgnore: true*/ folder, "mail.txt"), mail.text || "");
      if (mail.html) await writeFile(path.join(/*turbopackIgnore: true*/ folder, "mail.html"), mail.html);
      for (const a of mail.attachments || []) await writeFile(path.join(/*turbopackIgnore: true*/ folder, a.filename.replace(/[^\w.-]/g, "_")), a.content);
      console.info(`[payments] mail ${mail.tag || "-"} → outbox (an ${logRef(mail.to)})`);
      return { ok: true, id };
    },
  };
}

/** Resend-Adapter (vorbereitet). */
export function createResendMailer({ apiKey, from, fetchImpl = fetch }) {
  return {
    kind: "resend",
    async send(mail) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), MAIL_TIMEOUT_MS);
      try {
        const res = await fetchImpl("https://api.resend.com/emails", {
          method: "POST",
          signal: ctrl.signal,
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: mail.from || from,
            to: [mail.to],
            subject: mail.subject,
            text: mail.text,
            html: mail.html,
            attachments: (mail.attachments || []).map((a) => ({ filename: a.filename, content: a.content.toString("base64") })),
          }),
        });
        if (!res.ok) {
          console.error(`[payments] mail ${mail.tag || "-"}: resend ${res.status}`);
          return { ok: false };
        }
        return { ok: true };
      } catch (err) {
        console.error(`[payments] mail ${mail.tag || "-"}: resend ${err?.name || "error"}`);
        return { ok: false };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

/** Produktion ohne Mail-Anbieter: kein Versand, nichts auf der Platte, ok: false. */
export function createDisabledMailer() {
  return {
    kind: "gesperrt",
    async send(mail) {
      console.error(`[payments] mail ${mail?.tag || "-"}: kein Mail-Anbieter konfiguriert (PAYMENTS_MAIL_*), nicht gesendet`);
      return { ok: false };
    },
  };
}

/**
 * Adapter aus der Umgebung: vollständige Resend-Angaben → resend; sonst in
 * Produktion "gesperrt", außerhalb der Produktion outbox.
 */
export function mailerFromEnv(env, dir, { fetchImpl } = {}) {
  if (mailProviderReady(env)) {
    return createResendMailer({ apiKey: String(env.PAYMENTS_MAIL_API_KEY).trim(), from: String(env.PAYMENTS_MAIL_FROM).trim(), fetchImpl });
  }
  if (isProduction(env)) return createDisabledMailer();
  return createOutboxMailer(path.join(/*turbopackIgnore: true*/ dir, "outbox"));
}
