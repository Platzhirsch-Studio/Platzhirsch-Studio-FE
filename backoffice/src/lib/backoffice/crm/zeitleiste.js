// Zeitleiste der Kundenakte (§ 4.6) aus den geladenen Bezügen – solange `ph_crm.api.kontakt.get_zeitleiste` nicht
// im Frappe-Modus freigegeben ist, setzt das Backoffice sie aus Anfragen, Terminen, Gesprächen, Belegen und
// Kommentaren zusammen. Reines Modul (unit-getestet): Einträge {id, zeit, art, icon, ton, titel, text, zitat, href, wer}.
// Filter (§ 4.6): alles · mails (Gespräche & Mails) · status · geld · service · kommentare.

import { CRM_TEXTE as T } from "./texte.js";
import { statusAnzeige, terminStatus } from "./status.js";
import { alsDatum, uhrzeit } from "./vorgang.js";
import { hrefFuer } from "./zuErledigen.js";

export const FILTER = Object.freeze(["alles", "mails", "status", "geld", "service", "kommentare"]);

const ohneHtml = (s) => String(s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

/**
 * @param {object} a  Ergebnis von ladeKundenakte
 * @param {{name?:(user:string)=>string}} [opt]
 */
export function zeitleisteEintraege(a = {}, { name = (u) => u } = {}) {
  const e = [];
  for (const x of a.anfragen || []) {
    e.push({ id: `anf:${x.name}`, zeit: x.eingang || x.creation, art: "status", icon: "Inbox", ton: "cognac", titel: `Anfrage über ${T.quelle[x.quelle] || "Website"}`, zitat: ohneHtml(x.anliegen).slice(0, 220), text: `${x.name} · ${statusAnzeige("anfrage", x.status).text}`, href: hrefFuer("PH Anfrage", x.name), wer: x.zugewiesen_an ? name(x.zugewiesen_an) : "" });
  }
  for (const t of a.termine || []) {
    e.push({ id: `ter:${t.name}`, zeit: t.start, art: "mails", icon: "CalendarDays", ton: "see", titel: `${T.modus[t.modus] || "Termin"}${t.thema ? ` · ${t.thema}` : ""}`, text: `${terminStatus(t).text}${t.storno_grund ? ` · ${t.storno_grund}` : ""}`, href: hrefFuer("PH Termin", t.name), wer: t.berater ? name(t.berater) : "" });
  }
  for (const g of a.gespraeche || []) {
    const raeume = (g.raeume || []).map((r) => T.raum[r.raum] || r.raum).join(", ");
    e.push({ id: `bg:${g.name}`, zeit: g.datum ? `${g.datum} 18:00:00` : g.creation, art: "mails", icon: "MessageSquare", ton: "salbei", titel: "Gesprächsprotokoll", text: [raeume, statusAnzeige("gespraech", g.status).text].filter(Boolean).join(" · "), zitat: ohneHtml(g.zusammenfassung).slice(0, 220), href: hrefFuer("PH Beratungsgespraech", g.name), wer: g.berater ? name(g.berater) : "" });
  }
  for (const x of a.angebote || []) {
    if (x.status === "Ersetzt") continue;
    e.push({ id: `an:${x.name}`, zeit: x.datum ? `${x.datum} 12:00:00` : x.creation, art: "geld", icon: "FileText", ton: "eiche", titel: `Angebot ${x.name}`, text: x.status, beleg: x.name, href: `/d/ph-angebot/${encodeURIComponent(x.name)}` });
  }
  for (const x of a.auftraege || []) {
    e.push({ id: `ab:${x.name}`, zeit: x.datum ? `${x.datum} 12:00:00` : x.creation, art: "geld", icon: "BadgeCheck", ton: "salbei", titel: `Auftrag ${x.name}`, text: x.status, beleg: x.name, href: `/d/ph-auftragsbestaetigung/${encodeURIComponent(x.name)}` });
  }
  for (const x of a.rechnungen || []) {
    e.push({ id: `re:${x.name}`, zeit: x.datum ? `${x.datum} 12:00:00` : "", art: "geld", icon: "Receipt", ton: "eiche", titel: `${x.art || "Rechnung"} ${x.name}`, text: x.status, beleg: x.name, href: `/d/ph-rechnung/${encodeURIComponent(x.name)}` });
  }
  for (const x of a.servicefaelle || []) {
    e.push({ id: `sf:${x.name}`, zeit: x.gemeldet_am || x.creation, art: "service", icon: "Wrench", ton: "see", titel: x.titel || "Servicefall", text: x.status, href: `/d/ph-servicefall/${encodeURIComponent(x.name)}` });
  }
  for (const k of a.docinfo?.comments || []) {
    const istMail = /E-Mail/.test(k.content || "");
    e.push({ id: `k:${k.name}:${k.creation}`, zeit: k.creation, art: istMail ? "mails" : "kommentare", icon: istMail ? "Mail" : "MessageSquare", ton: istMail ? "cognac" : undefined, titel: istMail ? "E-Mail" : k.comment_type === "Comment" ? "Kommentar" : "Hinweis", text: ohneHtml(k.content).slice(0, 300), wer: k.owner ? name(k.owner) : "" });
  }
  return e.filter((x) => alsDatum(x.zeit)).sort((p, q) => String(q.zeit).localeCompare(String(p.zeit)));
}

/** Nach Filter und in Tagesgruppen (Heute, Gestern, Datum). */
export function gruppiereZeitleiste(eintraege = [], { filter = "alles", jetzt = new Date() } = {}) {
  const f = FILTER.includes(filter) ? filter : "alles";
  const liste = eintraege.filter((x) => f === "alles" || x.art === f);
  const heute = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate()).getTime();
  const gruppen = [];
  for (const x of liste) {
    const d = alsDatum(x.zeit);
    const tag = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diff = Math.round((heute - tag) / 86400000);
    const titel = diff === 0 ? "Heute" : diff === 1 ? "Gestern" : diff < 0 ? "Geplant" : d.toLocaleDateString("de-AT", { weekday: "long", day: "numeric", month: "long" });
    let g = gruppen.find((y) => y.titel === titel);
    if (!g) gruppen.push((g = { titel, eintraege: [] }));
    g.eintraege.push({ ...x, uhr: uhrzeit(x.zeit) });
  }
  return { gruppen, anzahl: liste.length, filter: f };
}
