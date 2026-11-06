// Bereich Marketing – Mail-Vorschau für den Mock-Pfad (Frappe liefert `vorschau()` der Dokumente selbst).
// Baut eine schlichte, lesbare Mail im Platzhirsch-Stil aus den Newsletter-Blöcken bzw. füllt die Platzhalter einer
// Vorlage mit Beispielwerten. Inhalte werden HTML-maskiert; der iframe in der Oberfläche läuft mit `sandbox`.
// Reines Modul.

import { blockSichtbar, stripHtml } from "./regeln.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
/** Erlaubt nur einfache Absatz-Formatierung aus dem Editor (p, br, strong, em, ul, ol, li, a[href]). */
export function sicheresHtml(html) {
  const roh = String(html ?? "");
  if (!/[<>]/.test(roh)) return roh.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  return roh
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<(?!\/?(p|br|strong|b|em|i|ul|ol|li|a)(\s|>|\/))[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/href\s*=\s*("|')\s*javascript:[^"']*\1/gi, 'href="#"');
}

const STIL = `
  body{margin:0;background:#f4f1ec;font-family:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif;color:#30373e;}
  .mail{max-width:600px;margin:0 auto;background:#fbfaf8;}
  .kopf{padding:32px 32px 8px;text-align:center;font-family:"Bodoni Moda",Georgia,serif;letter-spacing:.3em;font-size:18px;}
  .unter{text-align:center;font-size:12px;color:#5b626a;padding-bottom:24px;}
  .block{padding:8px 32px 24px;}
  h2{font-size:20px;line-height:28px;font-weight:600;margin:0 0 8px;letter-spacing:-.01em;}
  p{font-size:15px;line-height:24px;margin:0 0 12px;}
  img{display:block;width:100%;height:auto;border-radius:16px;margin:0 0 12px;}
  a.knopf{display:inline-block;background:#30373e;color:#f8f5f0;text-decoration:none;padding:10px 18px;border-radius:999px;font-size:14px;font-weight:600;}
  .fuss{padding:24px 32px 40px;font-size:12px;line-height:18px;color:#5b626a;border-top:1px solid rgba(48,55,62,.12);}
  @media (prefers-color-scheme: dark){body.dunkel{background:#121416;color:#efebe5}}
  body.dunkel{background:#121416;color:#efebe5} body.dunkel .mail{background:#1b1e21} body.dunkel .unter, body.dunkel .fuss{color:#b1b4b8}
  body.dunkel a.knopf{background:#efebe5;color:#1a1d20}
`;

/** Newsletter-Ausgabe → { betreff, html } (nur sichtbare Blöcke, wie der Server). */
export function newsletterHtml(ausgabe = {}, { dunkel = false, events = {} } = {}) {
  const teile = (ausgabe.bloecke || [])
    .filter(blockSichtbar)
    .map((b) => {
      const titel = b.titel ? `<h2>${esc(b.titel)}</h2>` : "";
      const bild = b.bild ? `<img src="${esc(b.bild)}" alt="${esc(b.bild_alt)}">` : "";
      const link = b.url ? `<p><a class="knopf" href="${esc(b.url)}">${esc(b.link_label || "Mehr erfahren")}</a></p>` : "";
      if (b.typ === "brief") return `<div class="block">${sicheresHtml(b.text)}<p>${esc(b.absender || "")}</p></div>`;
      if (b.typ === "termine") {
        const ev = b.event ? events[b.event] : null;
        const zeile = ev ? `<p>${esc(ev.titel)} · ${esc(ev.datumText || "")}</p>` : sicheresHtml(b.text);
        return `<div class="block">${titel}${zeile}${link}</div>`;
      }
      return `<div class="block">${titel}${bild}${sicheresHtml(b.text)}${link}</div>`;
    })
    .join("");
  const betreff = ausgabe.betreff || "(ohne Betreff)";
  const html = `<!doctype html><html lang="${esc(ausgabe.sprache || "de")}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(betreff)}</title><style>${STIL}</style></head><body class="${dunkel ? "dunkel" : ""}"><div class="mail"><div class="kopf">PLATZHIRSCH</div><div class="unter">Post aus Lochau${ausgabe.nummer ? ` · Nr. ${esc(ausgabe.nummer)}` : ""}</div>${teile || '<div class="block"><p>Noch keine sichtbaren Blöcke.</p></div>'}<div class="fuss">Sie erhalten diesen Brief, weil Sie ihn bestellt haben. <a href="#abmelden">Abmelden</a> · Platzhirsch Home Living, Landstraße 11, 6911 Lochau</div></div></body></html>`;
  return { betreff, html };
}

export const BEISPIELWERTE = Object.freeze({
  anrede: "Guten Tag",
  produkt: "Ihr Sofa",
  berater_name: "Ihre Beraterin",
  berater_telefon: "+43 5574 000000",
  pflege_module: "<p>Stoffbezüge: regelmäßig absaugen, Flecken tupfen statt reiben.</p>",
  portal_url: "#portal",
  bewerten_url: "#bewerten",
  event_titel: "Adventsabend im Showroom",
  event_datum: "26.11.2026",
  event_uhrzeit: "18:00",
  event_programm: "<p>Programm folgt.</p>",
  event_url: "#event",
  gemerkte_stuecke: "<p>Sessel Lounge · Esstisch Eiche 220</p>",
  abmelde_url: "#abmelden",
  bestaetigen_url: "#bestaetigen",
  einwilligung_datum: "01.11.2026",
  fusszeile_html: '<p style="font-size:12px;color:#5b626a">Sie erhalten diese Mail mit Ihrer Einwilligung. <a href="#abmelden">Abmelden</a></p>',
  betreff: "Betreff der Ausgabe",
  preheader: "Vorschauzeile",
});

/** Platzhalter einer Vorlage („{{ name }}“) – für die Chip-Liste im Editor. */
export function platzhalterIn(text = "") {
  return [...new Set([...String(text).matchAll(/\{\{\s*([a-z_]+)\s*\}\}/g)].map((m) => m[1]))];
}

/** Vorlage (betreff, html) mit Beispielwerten füllen → { betreff, html, fehlend[] }. */
export function vorlageFuellen(vorlage = {}, werte = BEISPIELWERTE, { dunkel = false } = {}) {
  const fehlend = new Set();
  const fuell = (t, html) =>
    String(t || "").replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, k) => {
      if (werte[k] == null) {
        fehlend.add(k);
        return `{{ ${k} }}`;
      }
      return html ? String(werte[k]) : stripHtml(werte[k]);
    });
  const betreff = fuell(vorlage.betreff, false);
  const inhalt = sicheresHtml(fuell(vorlage.html, true).replace(/<!--[\s\S]*?-->/g, ""));
  const html = `<!doctype html><html lang="${esc(vorlage.sprache || "de")}"><head><meta charset="utf-8"><title>${esc(betreff)}</title><style>${STIL}</style></head><body class="${dunkel ? "dunkel" : ""}"><div class="mail"><div class="kopf">PLATZHIRSCH</div><div class="block">${inhalt}</div></div></body></html>`;
  return { betreff, html, fehlend: [...fehlend] };
}
