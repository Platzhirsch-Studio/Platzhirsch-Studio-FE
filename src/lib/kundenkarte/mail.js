// src/lib/kundenkarte/mail.js – Bestätigungsmail (Double-Opt-in) und Versandweg.
//   mock   → Dev-Postausgang .data/kundenkarte/outbox/<id>/mail.{json,txt}
//   frappe → Resend (KUNDENKARTE_MAIL_API_KEY / KUNDENKARTE_MAIL_FROM), derselbe
//            Adapter wie Termin und Zahlung (src/lib/payments/mailer.js).
// Nur Text, keine Bilder, keine Tracking-Pixel. Logs ohne Adresse (nur Antragsnummer).
// Keine "@/..."-Importe.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { CONFIRM_TTL_HOURS, dataDir, mailConfig } from "./config.js";
import { fill, kundenkarteCopy } from "./copy.js";
import { createResendMailer } from "../payments/mailer.js";
import { SITE_NAME } from "../site.js";

/** Mail-Objekt { to, subject, text, tag } für einen Antrag. */
export function confirmMail(application, { confirmUrl }) {
  const c = kundenkarteCopy(application.sprache).mail;
  const values = { vorname: application.vorname, nachname: application.nachname, hours: CONFIRM_TTL_HOURS };
  const text = [fill(c.greeting, values), "", fill(c.body, values), "", confirmUrl, "", c.ignore, "", c.signature, SITE_NAME].join("\n");
  return { to: application.email, subject: c.subject, text, tag: "kundenkarte-confirm" };
}

/** Dev-Postausgang: schreibt jede Mail als Ordner, nichts geht hinaus. */
export function createOutbox(dir = dataDir()) {
  const root = path.join(/*turbopackIgnore: true*/ dir, "outbox");
  return {
    kind: "outbox",
    async send(mail, { ref } = {}) {
      const id = `${new Date().toISOString().replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 8)}`;
      const folder = path.join(/*turbopackIgnore: true*/ root, id);
      await mkdir(folder, { recursive: true });
      await writeFile(path.join(/*turbopackIgnore: true*/ folder, "mail.json"), JSON.stringify({ to: mail.to, subject: mail.subject, tag: mail.tag, ref, sentAt: new Date().toISOString() }, null, 2));
      await writeFile(path.join(/*turbopackIgnore: true*/ folder, "mail.txt"), mail.text || "");
      console.info(`[kundenkarte] mail ${mail.tag} ${ref || "-"} → dev-postausgang`);
      return { ok: true, id };
    },
  };
}

/** Versandweg je Betriebsart; null, wenn keiner konfiguriert ist. */
export function kundenkarteMailer(mode, env = process.env, { fetchImpl } = {}) {
  if (mode === "mock") return createOutbox(dataDir(env));
  if (mode !== "frappe") return null;
  const cfg = mailConfig(env);
  if (!cfg) return null;
  const resend = createResendMailer({ ...cfg, ...(fetchImpl ? { fetchImpl } : {}) });
  return {
    kind: "resend",
    async send(mail, { ref } = {}) {
      const r = await resend.send(mail);
      console.info(`[kundenkarte] mail ${mail.tag} ${ref || "-"} → ${r.ok ? "versendet" : "fehlgeschlagen"}`);
      return r;
    },
  };
}
