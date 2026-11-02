// src/lib/booking/mail.js – Mails des Online-Kalenders (Kundin + Studio).
//
// Hier entstehen die Mails; verschickt werden sie über ./mailer.js: im Mock
// in den Dev-Postausgang .data/booking/outbox/<zeit>-<id>/ (mail.json,
// mail.txt, mail.html, termin.ics; Ansicht /de/termin/postausgang, nur Dev),
// im Frappe-Betrieb über Resend. Die Kundenmails schickt immer die Website
// (nur sie baut die signierten Links), die Studio-Mail nur im Mock (im
// Betrieb legt das Backoffice Termin und Aufgabe selbst an).
// Der Videoraum-Link steht nie in Mail oder .ics (Kalender werden oft
// geteilt): Er erscheint erst 15 Minuten vor Beginn auf der Terminseite.
// Logs nennen nie Adresse oder Namen, nur Referenz und Mailtyp.
// Keine "@/..."-Importe.
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ADDRESS, EMAIL, PHONE_DISPLAY, SITE_NAME } from "../site.js";
import { fill, formatDate, formatTime, terminCopy } from "./copy.js";
import { buildIcs } from "./ics.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Titel der Terminart in der Sprache (mit Thema/Ort beim Planungstermin). */
export function artLabel(b, locale = b.locale) {
  const c = terminCopy(locale);
  const base = c.arten[b.art]?.title || b.art;
  if (b.art !== "planung") return base;
  const thema = b.thema ? c.thema.options[b.thema] : null;
  const modus = b.modus ? c.modus[b.modus] : null;
  return [base, thema, modus].filter(Boolean).join(" · ");
}

export function placeLabel(b, locale = b.locale) {
  const c = terminCopy(locale);
  if (b.modus === "video") return c.arten.video.place;
  if (b.modus === "vor_ort") return [c.arten.vor_ort.place, b.plzOrt].filter(Boolean).join(", ");
  return `${SITE_NAME}, ${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}`;
}

/** .ics ohne Videoraum- und Verwaltungslink; ATTENDEE nur in der Absage-Mail (Outlook/Apple). */
export function icsFor(b, { cancel = false, now, attendee = null } = {}) {
  const c = terminCopy(b.locale);
  return buildIcs({
    ref: b.ref,
    start: b.start,
    end: b.end,
    title: `${SITE_NAME}: ${artLabel(b)}`,
    description: [`${c.done.reference}: ${b.ref}`, b.modus === "video" ? c.mail.icsVideo : null, PHONE_DISPLAY].filter(Boolean).join("\n"),
    location: placeLabel(b),
    sequence: b.sequence || 0,
    cancel,
    // Vor-Ort-Anfrage ("angefragt"): im Kalender nur vorgemerkt (TENTATIVE), bis das Team bestätigt.
    tentative: !cancel && b.status === "angefragt",
    attendee,
    now,
  });
}

function html(paragraphs, { buttons = [], test } = {}) {
  const ps = paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6">${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  const bs = buttons
    .map((b) => `<p style="margin:16px 0"><a href="${esc(b.href)}" style="display:inline-block;background:#30373e;color:#ffffff;text-decoration:none;padding:14px 26px">${esc(b.label)}</a></p>`)
    .join("");
  const t = test ? `<p style="margin:0 0 18px;padding:10px 14px;border-left:3px solid #8a5a00;font-size:13px">${esc(test)}</p>` : "";
  return `<!doctype html><html><body style="margin:0;background:#faf8f4;font-family:Helvetica,Arial,sans-serif;color:#30373e"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;padding:32px"><tr><td><p style="margin:0 0 18px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#7a5e17">${esc(SITE_NAME)}</p>${t}${ps}${bs}<p style="margin:24px 0 0;font-size:12px;color:#4a5158">${esc(SITE_NAME)} · ${esc(ADDRESS.street)}, ${esc(ADDRESS.postalCode)} ${esc(ADDRESS.city)} · ${esc(PHONE_DISPLAY)} · ${esc(EMAIL)}</p></td></tr></table></td></tr></table></body></html>`;
}

/** Mail an die Kundin mit dem Bestätigungslink (Double-Opt-in, gilt 30 Minuten). */
export function verifyMail(b, { verifyUrl, test = false } = {}) {
  const c = terminCopy(b.locale);
  const m = c.mail;
  const vars = { date: formatDate(b.start, b.locale), time: formatTime(b.start, b.locale) };
  const facts = [`${c.done.what}: ${artLabel(b)}`, `${c.done.when}: ${vars.date}, ${vars.time}`, `${c.done.where}: ${placeLabel(b)}`].join("\n");
  const head = [fill(m.hello, { name: b.vorname }), b.art === "vor_ort" ? m.verifyRequest : m.verify, facts];
  const tail = [m.verifyNote, m.bye];
  const testLine = test ? m.test : null;
  const subject = fill(m.subjectVerify, vars);
  return {
    tag: "termin-verify",
    to: b.email,
    subject: test ? `[TEST] ${subject}` : subject,
    text: [testLine, ...head, `${m.verifyButton}:\n${verifyUrl}`, ...tail, `${SITE_NAME} · ${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city} · ${PHONE_DISPLAY}`].filter(Boolean).join("\n\n"),
    html: html([...head, ...tail], { buttons: [{ href: verifyUrl, label: m.verifyButton }], test: testLine }),
    attachments: [],
  };
}

/**
 * Mail an die Kundin (nach der Bestätigung der Adresse).
 * @param {"booked"|"cancelled"|"rescheduled"} kind
 */
export function customerMail(kind, b, { manageUrl, test = false, now } = {}) {
  const c = terminCopy(b.locale);
  const m = c.mail;
  const vars = { date: formatDate(b.start, b.locale), time: formatTime(b.start, b.locale) };
  const requested = b.status === "angefragt";
  const subject =
    kind === "cancelled" ? fill(m.subjectCancelled, vars) : kind === "rescheduled" ? fill(m.subjectRescheduled, vars) : fill(requested ? m.subjectRequested : m.subjectBooked, vars);
  const intro = kind === "cancelled" ? m.cancelled : kind === "rescheduled" ? m.rescheduled : requested ? m.requested : m.booked;
  const facts = [
    `${c.done.what}: ${artLabel(b)}`,
    `${c.done.when}: ${vars.date}, ${vars.time}`,
    `${c.done.where}: ${placeLabel(b)}`,
    `${c.done.reference}: ${b.ref}`,
  ].join("\n");
  const cancelled = kind === "cancelled";
  const lines = [
    fill(m.hello, { name: b.vorname }),
    intro,
    facts,
    !cancelled && b.modus !== "video" ? c.done.usp : null,
    !cancelled && b.modus === "video" ? m.meetLater : null,
    !cancelled && manageUrl ? `${m.manage}\n${manageUrl}` : null,
    !cancelled ? m.ics : null,
    m.bye,
  ].filter(Boolean);
  const testLine = test ? m.test : null;
  const text = [testLine, ...lines, `${SITE_NAME} · ${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city} · ${PHONE_DISPLAY}`].filter(Boolean).join("\n\n");
  const buttons = cancelled || !manageUrl ? [] : [{ href: manageUrl, label: c.done.manage }];
  return {
    tag: `termin-${kind}`,
    to: b.email,
    subject: test ? `[TEST] ${subject}` : subject,
    text,
    html: html(lines, { buttons, test: testLine }),
    attachments: [{ filename: "termin.ics", contentType: "text/calendar; charset=utf-8", content: icsFor(b, { cancel: cancelled, now, attendee: cancelled ? { name: `${b.vorname} ${b.nachname || ""}`.trim(), email: b.email } : null }) }],
  };
}

/** Mail ans Studio (Deutsch, mit Kontaktdaten – das Team braucht sie). */
export function studioMail(kind, b, { test = false } = {}) {
  const label = { booked: b.status === "angefragt" ? "Neue Terminanfrage" : "Neuer Termin", cancelled: "Termin abgesagt", rescheduled: "Termin verschoben" }[kind];
  const when = `${formatDate(b.start, "de")}, ${formatTime(b.start, "de")} Uhr`;
  const lines = [
    `${label}: ${b.ref}`,
    `Terminart: ${artLabel(b, "de")}`,
    `Wann: ${when}`,
    `Wo: ${placeLabel(b, "de")}`,
    `Name: ${b.vorname} ${b.nachname}`,
    `E-Mail: ${b.email}`,
    b.telefon ? `Telefon: ${b.telefon}` : null,
    b.plzOrt ? `PLZ/Ort: ${b.plzOrt}` : null,
    b.anliegen ? `Anliegen: ${b.anliegen}` : null,
    b.consent?.video ? `Einwilligung Video: ja (${b.consent.version}, ${b.consent.at})` : null,
    `Sprache: ${b.locale}`,
    b.status === "angefragt" ? "Bitte Termin und Anfahrt persönlich bestätigen." : null,
  ].filter(Boolean);
  const subject = `${label} ${b.ref}: ${when}`;
  return {
    tag: `studio-${kind}`,
    to: EMAIL,
    subject: test ? `[TEST] ${subject}` : subject,
    text: (test ? "TESTBETRIEB – nicht echt.\n\n" : "") + lines.join("\n"),
    html: html(lines, { test: test ? "TESTBETRIEB – nicht echt." : null }),
    attachments: [],
  };
}

/** Postausgang (Ordner je Mail). */
export function createOutbox(dir) {
  const root = path.join(/*turbopackIgnore: true*/ dir, "outbox");
  return {
    async send(mail, { ref } = {}) {
      const id = `${new Date().toISOString().replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 8)}`;
      const folder = path.join(/*turbopackIgnore: true*/ root, id);
      await mkdir(folder, { recursive: true });
      const attachments = (mail.attachments || []).map((a) => ({ filename: a.filename, contentType: a.contentType, bytes: Buffer.byteLength(a.content) }));
      await writeFile(path.join(/*turbopackIgnore: true*/ folder, "mail.json"), JSON.stringify({ to: mail.to, subject: mail.subject, tag: mail.tag, ref, sentAt: new Date().toISOString(), attachments }, null, 2));
      await writeFile(path.join(/*turbopackIgnore: true*/ folder, "mail.txt"), mail.text || "");
      if (mail.html) await writeFile(path.join(/*turbopackIgnore: true*/ folder, "mail.html"), mail.html);
      for (const a of mail.attachments || []) await writeFile(path.join(/*turbopackIgnore: true*/ folder, a.filename.replace(/[^\w.-]/g, "_")), a.content);
      console.info(`[termin] mail ${mail.tag} ${ref || "-"} → dev-postausgang`);
      return { ok: true, id };
    },
    async list(limit = 30) {
      let names = [];
      try {
        names = (await readdir(root)).sort().reverse().slice(0, limit);
      } catch {
        return [];
      }
      const out = [];
      for (const name of names) {
        try {
          const meta = JSON.parse(await readFile(path.join(/*turbopackIgnore: true*/ root, name, "mail.json"), "utf8"));
          const text = await readFile(path.join(/*turbopackIgnore: true*/ root, name, "mail.txt"), "utf8");
          out.push({ id: name, ...meta, text });
        } catch {
          /* unvollständiger Ordner */
        }
      }
      return out;
    },
  };
}
