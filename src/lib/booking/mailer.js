// src/lib/booking/mailer.js – Versandweg der Termin-Mails je Betriebsart.
//   mock   → Dev-Postausgang (.data/booking/outbox, nichts geht hinaus)
//   frappe → Resend (BOOKING_MAIL_API_KEY/BOOKING_MAIL_FROM), derselbe Adapter
//            wie die Zahlungsstrecke (src/lib/payments/mailer.js). Die Website
//            versendet die Kundenmails, weil nur sie die signierten Links
//            (Bestätigen, Verwalten) bauen kann; das Backoffice schickt dann
//            keine eigene Kundenmail (Parameter `kundenmail: "website"`).
//   off    → null
// Logs ohne Adresse (nur Referenz + Mailtyp). Keine "@/..."-Importe.
import { bookingMailConfig, dataDir } from "./config.js";
import { createOutbox } from "./mail.js";
import { createResendMailer } from "../payments/mailer.js";

export function bookingMailer(mode, env = process.env, { fetchImpl } = {}) {
  if (mode === "mock") {
    const box = createOutbox(dataDir(env));
    return { kind: "outbox", send: (mail, meta) => box.send(mail, meta) };
  }
  if (mode !== "frappe") return null;
  const cfg = bookingMailConfig(env);
  if (!cfg) return null;
  const resend = createResendMailer({ ...cfg, ...(fetchImpl ? { fetchImpl } : {}) });
  return {
    kind: "resend",
    async send(mail, { ref } = {}) {
      // Resend erwartet Anhänge als Buffer (base64 im Adapter).
      const r = await resend.send({ ...mail, attachments: (mail.attachments || []).map((a) => ({ ...a, content: Buffer.from(a.content) })) });
      console.info(`[termin] mail ${mail.tag} ${ref || "-"} → ${r.ok ? "versendet" : "fehlgeschlagen"}`);
      return r;
    },
  };
}
