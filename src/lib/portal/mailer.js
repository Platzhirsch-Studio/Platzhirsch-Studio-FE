import "server-only";
import { createHmac } from "node:crypto";
import { IS_PRODUCTION } from "./config";
import { readJson, updateJson } from "./store";

// Sends the login e-mail (magic link).
//
// Development: no mail. The link is printed to the server console and kept in
// /.data/portal/dev-outbox.json, shown on /de/portal/login/dev.
//
// Production: one of these providers, chosen by PORTAL_MAIL_PROVIDER. All of
// them use plain fetch (no extra npm package):
//   resend    PORTAL_MAIL_API_KEY                         -> https://api.resend.com/emails
//   postmark  PORTAL_MAIL_API_KEY (server token)          -> https://api.postmarkapp.com/email
//   frappe    FRAPPE_URL, FRAPPE_API_KEY, FRAPPE_API_SECRET, optional
//             PORTAL_MAIL_FRAPPE_METHOD (default platzhirsch_studio.api.portal_send_login_link)
//             -> whitelisted method that calls frappe.sendmail (uses the backoffice's mail account)
//   webhook   PORTAL_MAIL_WEBHOOK_URL + PORTAL_MAIL_WEBHOOK_SECRET (HMAC-SHA256 header
//             X-Portal-Signature over the raw body) – e.g. n8n/Make or an own SMTP relay
// Always required in production: PORTAL_MAIL_FROM ("Platzhirsch Home Living <portal@platzhirsch.studio>"),
// PORTAL_SESSION_SECRET (>= 32 chars) and PORTAL_BASE_URL.

const OUTBOX = "dev-outbox";
const TIMEOUT_MS = 10_000;

function maskEmail(email) {
  const [user, domain] = String(email).split("@");
  return `${user.slice(0, 2)}***@${domain}`;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Subject, plain text and HTML of the login mail (German, no tracking pixels, no external images). */
export function buildLoginMail({ name, url, expiresInMinutes }) {
  const subject = "Ihr Anmeldelink für Mein Platzhirsch";
  const hello = name ? `Guten Tag, ${name},` : "Guten Tag,";
  const text = [
    hello,
    "",
    "mit diesem Link melden Sie sich im Kundenportal „Mein Platzhirsch“ an:",
    url,
    "",
    `Der Link ist ${expiresInMinutes} Minuten gültig und funktioniert nur einmal.`,
    "Sie haben keinen Link angefordert? Dann ignorieren Sie diese E-Mail einfach – ohne Klick passiert nichts.",
    "",
    "Herzliche Grüße",
    "Ihr Team von Platzhirsch Home Living",
    "Landstraße 11, 6911 Lochau · +43 5574 46255 · platzhirsch.studio",
  ].join("\n");
  const html = `<!doctype html><html lang="de"><body style="margin:0;background:#faf8f4;font-family:Helvetica,Arial,sans-serif;color:#30373e">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px">
<tr><td style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#7a5e17;font-weight:bold">Mein Platzhirsch</td></tr>
<tr><td style="padding-top:16px;font-size:16px;line-height:1.6">${esc(hello)}<br>mit diesem Link melden Sie sich im Kundenportal an:</td></tr>
<tr><td style="padding:24px 0"><a href="${esc(url)}" style="display:inline-block;background:#30373e;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:999px">Jetzt anmelden</a></td></tr>
<tr><td style="font-size:14px;line-height:1.6;color:#4a5158">Der Link ist ${Number(expiresInMinutes)} Minuten gültig und funktioniert nur einmal.<br>
Sie haben keinen Link angefordert? Dann ignorieren Sie diese E-Mail einfach – ohne Klick passiert nichts.</td></tr>
<tr><td style="padding-top:16px;font-size:12px;line-height:1.6;color:#4a5158;word-break:break-all">Falls der Button nicht funktioniert: ${esc(url)}</td></tr>
<tr><td style="padding-top:24px;font-size:12px;color:#4a5158">Platzhirsch Home Living · Landstraße 11, 6911 Lochau · +43 5574 46255</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}

function provider() {
  return (process.env.PORTAL_MAIL_PROVIDER || "").toLowerCase();
}

/** Lists what is missing for production mail delivery ([] = ready). */
export function mailConfigProblems() {
  const env = process.env;
  const missing = [];
  if (!env.PORTAL_SESSION_SECRET || env.PORTAL_SESSION_SECRET.length < 32) missing.push("PORTAL_SESSION_SECRET (>= 32 Zeichen)");
  if (!env.PORTAL_BASE_URL) missing.push("PORTAL_BASE_URL");
  const p = provider();
  if (p !== "frappe" && !env.PORTAL_MAIL_FROM) missing.push("PORTAL_MAIL_FROM");
  if (p === "resend" || p === "postmark") {
    if (!env.PORTAL_MAIL_API_KEY) missing.push("PORTAL_MAIL_API_KEY");
  } else if (p === "frappe") {
    for (const k of ["FRAPPE_URL", "FRAPPE_API_KEY", "FRAPPE_API_SECRET"]) if (!env[k]) missing.push(k);
  } else if (p === "webhook") {
    for (const k of ["PORTAL_MAIL_WEBHOOK_URL", "PORTAL_MAIL_WEBHOOK_SECRET"]) if (!env[k]) missing.push(k);
  } else {
    missing.push("PORTAL_MAIL_PROVIDER (resend | postmark | frappe | webhook)");
  }
  return missing;
}

export function mailReady() {
  return !IS_PRODUCTION || mailConfigProblems().length === 0;
}

async function post(url, headers, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...headers },
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Mailversand fehlgeschlagen (${res.status})`);
}

async function deliver({ to, name, url, expiresInMinutes }) {
  const env = process.env;
  const mail = buildLoginMail({ name, url, expiresInMinutes });
  switch (provider()) {
    case "resend":
      return post(
        "https://api.resend.com/emails",
        { Authorization: `Bearer ${env.PORTAL_MAIL_API_KEY}` },
        JSON.stringify({ from: env.PORTAL_MAIL_FROM, to: [to], subject: mail.subject, text: mail.text, html: mail.html })
      );
    case "postmark":
      return post(
        "https://api.postmarkapp.com/email",
        { "X-Postmark-Server-Token": env.PORTAL_MAIL_API_KEY },
        JSON.stringify({ From: env.PORTAL_MAIL_FROM, To: to, Subject: mail.subject, TextBody: mail.text, HtmlBody: mail.html, MessageStream: "outbound", TrackOpens: false, TrackLinks: "None" })
      );
    case "frappe": {
      const method = env.PORTAL_MAIL_FRAPPE_METHOD || "platzhirsch_studio.api.portal_send_login_link";
      return post(
        `${env.FRAPPE_URL.replace(/\/+$/, "")}/api/method/${method}`,
        { Authorization: `token ${env.FRAPPE_API_KEY}:${env.FRAPPE_API_SECRET}` },
        JSON.stringify({ recipient: to, subject: mail.subject, message: mail.html, text: mail.text })
      );
    }
    case "webhook": {
      const body = JSON.stringify({ type: "portal-login-link", to, from: env.PORTAL_MAIL_FROM, ...mail });
      const sig = createHmac("sha256", env.PORTAL_MAIL_WEBHOOK_SECRET).update(body).digest("hex");
      return post(env.PORTAL_MAIL_WEBHOOK_URL, { "X-Portal-Signature": `sha256=${sig}` }, body);
    }
    default:
      throw new Error("PORTAL_MAIL_PROVIDER nicht gesetzt");
  }
}

/**
 * Sends the login mail. Throws in production when delivery is impossible, so
 * the login form shows a technical error instead of a false "check your inbox".
 */
export async function sendLoginMail({ to, name, url, expiresInMinutes }) {
  if (!IS_PRODUCTION) {
    console.info(`\n[portal] Magic Link für ${to} (gültig ${expiresInMinutes} Min.):\n${url}\n`);
    await updateJson(OUTBOX, [], (list) => ({
      value: [{ to, name, url, sentAt: new Date().toISOString(), expiresInMinutes }, ...list].slice(0, 20),
      result: null,
    }));
    return { delivered: false, dev: true };
  }
  const problems = mailConfigProblems();
  if (problems.length) {
    console.error(`[portal] Mailversand nicht konfiguriert (${problems.join(", ")}) – Login-Link an ${maskEmail(to)} nicht zugestellt.`);
    throw new Error("Mailversand nicht konfiguriert");
  }
  await deliver({ to, name, url, expiresInMinutes });
  return { delivered: true, dev: false };
}

export async function readDevOutbox() {
  if (IS_PRODUCTION) return [];
  return readJson(OUTBOX, []);
}
