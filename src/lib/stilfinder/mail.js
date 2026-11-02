// src/lib/stilfinder/mail.js
// Mail of the Moodboard PDF: content builder + delivery adapters.
// Delivery is OFF unless STILFINDER_MAIL_ENABLED=1 and a complete provider
// configuration exist (config.js mailMode). Otherwise the service writes the
// dev outbox (.data/stilfinder/outbox). Providers use plain fetch, no extra
// npm package: resend, postmark (both with the PDF as attachment) or a
// signed webhook (n8n/Make/own SMTP relay).
// No tracking pixels, no external images, no link tracking.
// No "@/..." imports: tested with node --test.
import { createHmac } from "node:crypto";
import { SITE_ORIGIN, resultUrl, terminUrl } from "./config.js";
import { KI_NOTE } from "./content.js";

// Same wording as the form and the PDF (QA Runde 1, P2.4; marked for the
// lawyer in Marktresearch/digital/features/stilfinder.md).
export const PRIVACY_MAIL = "Sie haben dieses Moodboard über den Stil-Finder auf platzhirsch.studio angefordert. Ihre Angaben verwenden wir nur für diesen Versand und speichern sie danach nicht.";
const LEGAL_LINE = "Platzhirsch Home Living · MW Immobilienverwaltungs GmbH · Landstraße 11, 6911 Lochau · +43 5574 46255";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function pdfFilename(profile) {
  return `Platzhirsch-Moodboard-${profile.slug}.pdf`;
}

export const NEWSLETTER_URL = `${SITE_ORIGIN}/de/newsletter`;
export function newsletterLine() {
  return `Sie haben zusätzlich nach unserem Newsletter gefragt. Mit dieser Anfrage tragen wir Sie nicht ein. Wenn Sie ihn erhalten möchten, melden Sie sich bitte hier an: ${NEWSLETTER_URL}. Einen Newsletter senden wir erst, wenn Sie den Bestätigungslink in der Anmelde-E-Mail angeklickt haben (Double-Opt-in).`;
}

/** Subject, plain text and HTML (German). */
export function buildMoodboardMail({ profile, name, newsletter = false, labs = true, pages, code = null, calendar = false }) {
  const subject = `Ihr Moodboard „${profile.name}“ – Platzhirsch Home Living`;
  const hello = name ? `Guten Tag, ${name},` : "Guten Tag,";
  // pdf-lead fix-01: same hand-off as PDF and result page (planer, produkt, plan)
  const termin = terminUrl(profile, { code, calendar });
  // the web result: to forward, and the accessible version of the PDF
  const online = resultUrl(profile, code);
  // pdf-lead fix-02: the moodboard request starts NO newsletter sign-up (in
  // no mode – service.js), so the mail promises no confirmation mail; it hands
  // over the sign-up link instead. Text marked for the lawyer (feature doc).
  const nl = newsletter ? newsletterLine() : null;
  const lines = [
    hello,
    "",
    `im Anhang finden Sie Ihr persönliches Moodboard „${profile.name}“ als PDF-Präsentation (${pages || "über 20"} Seiten): ein Moodboard aus Räumen, Stücken und Materialien, Ihre Farbpalette mit Farbcodes, Materialwelt, Stücke aus unserem Katalog für fünf Räume, Licht, Pflege- und Planungstipps.`,
    "",
    "Am schönsten ist der nächste Schritt bei uns im Studio: Bringen Sie das Moodboard mit, dann beginnen wir direkt bei Ihrem Stil.",
    `Termin anfragen: ${termin}`,
    "",
    `Ihr Ergebnis online, zum Weiterleiten und als barrierearme Fassung: ${online}`,
    "",
    ...(nl ? [nl, ""] : []),
    `Hinweis: ${KI_NOTE}`,
    ...(labs ? ["Labs-Prototyp: Die Produktabbildungen stammen von den Herstellern; die Bildrechte für eine öffentliche Nutzung sind noch zu klären."] : []),
    "",
    `${PRIVACY_MAIL} Datenschutz: ${SITE_ORIGIN}/de/datenschutz`,
    "",
    "Herzliche Grüße aus Lochau",
    "Ihr Team von Platzhirsch Home Living",
    LEGAL_LINE,
    `Impressum: ${SITE_ORIGIN}/de/impressum`,
  ];
  const text = lines.join("\n");
  const sw = profile.palette.map((c) => `<td style="height:6px;background:${esc(c.hex)}"></td>`).join("");
  const p = (s, extra = "") => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;${extra}">${s}</p>`;
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(subject)}</title></head>
<body style="margin:0;background:#faf8f4;font-family:Helvetica,Arial,sans-serif;color:#30373e">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e6e1d8">
<tr>${sw}</tr>
<tr><td style="padding:36px 32px 8px">
<p style="margin:0;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#7a5f17">Ihr Stilprofil</p>
<h1 style="margin:10px 0 6px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:34px;line-height:1.1;color:#30373e">${esc(profile.name)}</h1>
<p style="margin:0 0 24px;font-family:Georgia,serif;font-style:italic;font-size:18px;color:#5c636a">${esc(profile.tagline)}</p>
${p(esc(hello))}
${p(`im Anhang finden Sie Ihr persönliches Moodboard als PDF-Präsentation (${esc(pages || "über 20")} Seiten): ein Moodboard aus Räumen, Stücken und Materialien, Farbpalette mit Farbcodes, Materialwelt, Stücke aus unserem Katalog für fünf Räume, Licht, Pflege- und Planungstipps.`)}
${p("Am schönsten ist der nächste Schritt bei uns im Studio: Bringen Sie das Moodboard mit, dann beginnen wir direkt bei Ihrem Stil.")}
<p style="margin:8px 0 28px"><a href="${esc(termin)}" style="display:inline-block;background:#30373e;color:#ffffff;text-decoration:none;font-size:15px;letter-spacing:.06em;padding:14px 26px">Termin anfragen</a></p>
${p(`Ihr Ergebnis online, zum Weiterleiten und als barrierearme Fassung: <a href="${esc(online)}" style="color:#30373e">Stilprofil „${esc(profile.name)}“ ansehen</a>`, "font-size:14px;color:#5c636a")}
${nl ? p(esc(nl), "font-size:14px;color:#5c636a") : ""}
</td></tr>
<tr><td style="padding:0 32px 28px;font-size:12px;line-height:1.6;color:#5c636a;border-top:1px solid #e6e1d8">
<p style="margin:18px 0 8px">${esc(KI_NOTE)}</p>
${labs ? '<p style="margin:0 0 8px">Labs-Prototyp: Die Produktabbildungen stammen von den Herstellern; die Bildrechte für eine öffentliche Nutzung sind noch zu klären.</p>' : ""}
<p style="margin:0 0 8px">${esc(PRIVACY_MAIL)} <a href="${SITE_ORIGIN}/de/datenschutz" style="color:#30373e">Datenschutz</a></p>
<p style="margin:0">${esc(LEGAL_LINE)} · <a href="${SITE_ORIGIN}/de/impressum" style="color:#30373e">Impressum</a></p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, text, html };
}

async function post(url, headers, body, fetchImpl) {
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...headers },
    body,
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`mail provider ${res.status}`);
}

/** Real delivery (only called when mailMode().mode === "live"). */
export async function deliverMail({ provider, to, mail, pdf, filename, env = process.env, fetchImpl = fetch }) {
  const b64 = pdf.toString("base64");
  // pdf-lead fix-03: no hidden copy to the studio. Form, mail and PDF promise
  // "nur für diesen Versand … speichern sie danach nicht"; a BCC would put the
  // address and the PDF into the studio inbox without the customer knowing.
  // A studio copy needs its own opt-in (see the lead hand-off proposal).
  if (env.STILFINDER_MAIL_BCC) console.warn("[stilfinder] STILFINDER_MAIL_BCC wird ignoriert (keine verdeckte Kopie ohne Einwilligung)");
  switch (provider) {
    case "resend":
      return post(
        "https://api.resend.com/emails",
        { Authorization: `Bearer ${env.STILFINDER_MAIL_API_KEY}` },
        JSON.stringify({ from: env.STILFINDER_MAIL_FROM, to: [to], subject: mail.subject, text: mail.text, html: mail.html, attachments: [{ filename, content: b64 }] }),
        fetchImpl
      );
    case "postmark":
      return post(
        "https://api.postmarkapp.com/email",
        { "X-Postmark-Server-Token": env.STILFINDER_MAIL_API_KEY },
        JSON.stringify({
          From: env.STILFINDER_MAIL_FROM,
          To: to,
          Subject: mail.subject,
          TextBody: mail.text,
          HtmlBody: mail.html,
          MessageStream: "outbound",
          TrackOpens: false,
          TrackLinks: "None",
          Attachments: [{ Name: filename, Content: b64, ContentType: "application/pdf" }],
        }),
        fetchImpl
      );
    case "webhook": {
      const body = JSON.stringify({ type: "stilfinder-moodboard", to, from: env.STILFINDER_MAIL_FROM, ...mail, attachment: { filename, contentType: "application/pdf", base64: b64 } });
      const sig = createHmac("sha256", env.STILFINDER_MAIL_WEBHOOK_SECRET).update(body).digest("hex");
      return post(env.STILFINDER_MAIL_WEBHOOK_URL, { "X-Stilfinder-Signature": `sha256=${sig}` }, body, fetchImpl);
    }
    default:
      throw new Error("STILFINDER_MAIL_PROVIDER nicht gesetzt");
  }
}
