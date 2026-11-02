// src/lib/kundenbetreuung/mail.js
// HTML-Gerüst aller Mails der Kundenbetreuung (Kundenreisen und Newsletter).
// Tabellen-Layout mit Inline-Styles (Outlook, Gmail, Apple Mail), max. 600 px,
// Farben der Design-Bibel (paper #faf8f4, ink #30373e, brass-700 #7a5e17,
// Haarlinie 12 % ink), Systemschriften (Webfonts laden in Mails unzuverlässig;
// Überschriften in Georgia als ruhiger Ersatz für Bodoni). Keine Bilder von
// Herstellern, keine Tracking-Pixel; Messung nur über UTM an den Links.
//
// Die Ausgabe enthält Jinja-Platzhalter ({{ anrede }}, {{ abmelde_url }} …),
// die die Frappe-App beim Versand füllt (frappe.render_template). Für die
// Web-Fassung im Newsletter-Archiv rendert die Seite die Blöcke selbst (React),
// nicht dieses HTML.
// Keine "@/..."-Importe.

export const FARBEN = Object.freeze({
  paper: "#faf8f4",
  bone: "#f3efe7",
  ink: "#30373e",
  inkSoft: "#4a5158",
  brass: "#7a5e17",
  line: "#e0ddd7",
});

// Impressumszeile (Stand Impressum, anwaltlich freigegeben 29.10.2026:
// src/components/Impressum/impressum.js, src/lib/site.js). Ändert sich mit
// der Eintragung der Handels-GmbH – dann hier und im Impressum.
export const IMPRESSUM_ZEILE =
  "Platzhirsch Home Living · MW Immobilienverwaltungs GmbH · Landstraße 11 · 6911 Lochau · Österreich · FN 443753 d · UID ATU70035339 · +43 5574 46255 · info@platzhirsch.studio";

// Fußzeilen V = Service zum Auftrag, S = angeforderte System-Mail, B, A (email-flows.md 0.2, Adresse Landstraße 11). Wortlaut A und B ist
// ein VORSCHLAG für die Kanzlei (features/kundenbetreuung.md), nicht Teil der
// am 29.10. freigegebenen Rechtstexte.
export const FUSSZEILEN = Object.freeze({
  // QA Welle 2 P2-8: Hinweis, wie man weitere Service-Mails abbestellt (Art. 21 DSGVO, empfohlen).
  V: "Sie erhalten diese Nachricht zu Ihrem Auftrag bei Platzhirsch Home Living. Wenn Sie keine weiteren Service-Mails wie Pflegehinweise wünschen, genügt eine kurze Antwort auf diese Mail.",
  S: "Diese Nachricht ist eine Antwort auf Ihre Anfrage oder Anmeldung bei Platzhirsch Home Living.",
  B:
    "Sie erhalten diese Nachricht als Kundin bzw. Kunde von Platzhirsch Home Living. Wenn Sie keine weiteren Informationen von uns per E-Mail wünschen, genügt ein Klick: " +
    '<a href="{{ abmelde_url }}" style="color:#30373e">Keine weiteren E-Mails</a> – oder eine kurze Antwort auf diese Mail. Das ist kostenlos.',
  A:
    "Sie erhalten diese Nachricht, weil Sie sich am {{ einwilligung_datum }} dafür angemeldet und die Anmeldung bestätigt haben. " +
    '<a href="{{ abmelde_url }}" style="color:#30373e">Abmelden</a> · <a href="https://platzhirsch.studio/de/datenschutz" style="color:#30373e">Datenschutz</a>',
});

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const P = `margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:${FARBEN.ink}`;
const SMALL = `margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${FARBEN.inkSoft}`;

/** Absatz; ein Absatz, der nur aus {% if x %}…{% endif %} besteht, wird samt <p> bedingt. */
export function absatz(text) {
  const m = /^\{% if ([^%]+?) %\}([\s\S]*)\{% endif %\}$/.exec(String(text).trim());
  if (m && !m[2].includes("{% endif %}")) return `{% if ${m[1].trim()} %}<p style="${P}">${m[2]}</p>{% endif %}`;
  return `<p style="${P}">${text}</p>`;
}

/** Knopf (nur einer je Mail, Ink-Fläche mit Paper-Text wie auf der Website). */
export function knopf({ label, url }) {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="background:${FARBEN.ink}">` +
    `<a href="${url}" style="display:inline-block;padding:14px 28px;font-family:Helvetica,Arial,sans-serif;font-size:16px;color:${FARBEN.paper};text-decoration:none">${esc(label)}</a>` +
    `</td></tr></table>`
  );
}

export function ueberschrift(text, level = 2) {
  const size = level === 1 ? 28 : 22;
  return `<h${level} style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:${size}px;line-height:1.25;color:${FARBEN.ink}">${esc(text)}</h${level}>`;
}

export function overline(text) {
  return `<p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:${FARBEN.brass}">${esc(text)}</p>`;
}

export const haarlinie = `<hr style="border:0;border-top:1px solid ${FARBEN.line};margin:28px 0">`;

/**
 * Ganze Mail. `inhalt` ist fertiges HTML (Absätze, Blöcke).
 * @param {{ betreff: string, preheader?: string, inhalt: string, fusszeile: "V"|"B"|"A", lang?: string, kopf?: string }} o
 */
export function mailHtml({ betreff, preheader = "", inhalt, fusszeile, lang = "de", kopf = "Platzhirsch Home Living · Lochau" }) {
  const fuss = FUSSZEILEN[fusszeile];
  if (!fuss) throw new Error(`unbekannte Fußzeile ${fusszeile}`);
  return [
    "<!doctype html>",
    `<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`,
    `<meta name="color-scheme" content="light"><title>${esc(betreff)}</title></head>`,
    `<body style="margin:0;padding:0;background:${FARBEN.paper}">`,
    // Preheader: in der Vorschau des Postfachs sichtbar, im Text versteckt.
    `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FARBEN.paper}"><tr><td align="center" style="padding:32px 16px">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff"><tr><td style="padding:32px 28px">`,
    overline(kopf),
    inhalt,
    haarlinie,
    `<p style="${SMALL}">${fuss}</p>`,
    `<p style="${SMALL}">${esc(IMPRESSUM_ZEILE)}</p>`,
    "</td></tr></table>",
    "</td></tr></table>",
    "</body></html>",
  ].join("\n");
}

/** Mail einer Kundenreise (reisen.js) als Jinja-Vorlage. */
export function reiseMailHtml(reise) {
  const v = reise.vorlage;
  const fusszeile = !reise.werbung ? "V" : reise.rechtsgrundlage.includes("E") && !reise.rechtsgrundlage.includes("B") ? "A" : "{{ fusszeile }}";
  const body = [
    ...v.absaetze.map(absatz),
    v.cta ? knopf(v.cta) : "",
    `<p style="${P}">${(v.gruss || []).join("<br>")}</p>`,
  ].join("\n");
  if (fusszeile === "{{ fusszeile }}") {
    // B oder E je Empfänger: engine.py setzt `fusszeile_html` passend zur
    // Grundlage, mit der dieser Kontakt angeschrieben werden darf.
    const html = mailHtml({ betreff: v.betreff, preheader: v.preheader, inhalt: body, fusszeile: "B" });
    return html.replace(`<p style="${SMALL}">${FUSSZEILEN.B}</p>`, `<p style="${SMALL}">{{ fusszeile_html }}</p>`);
  }
  return mailHtml({ betreff: v.betreff, preheader: v.preheader, inhalt: body, fusszeile });
}
