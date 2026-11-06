// Zählformeln (10-konzept-projekte.md § 3.6) – eine Zahl je Sache, gleich in Pill, Kennzahl, Inbox-Kopf und Glocke.
// Reines Modul: Eingabe sind bereits geladene Listen (daten.js lädt sie mit genau diesen Filtern).

/** Filter je Quelle (Frappe-Form), damit Server-Abfrage und reine Formel dieselbe Regel nutzen. */
export const RUECK_FILTER = Object.freeze({
  feedback: [["von", "=", "kunde"], ["art", "!=", "vote"], ["status", "=", "Offen"]],
  nachricht: [["richtung", "=", "eingehend"], ["status", "=", "Ungelesen"]],
  nachtrag: [["status", "in", ["Freigegeben", "Abgelehnt"]], ["uebernommen", "=", 0], ["entscheidung_am", "is", "set"]],
  planung: [["kunde_entscheidung", "in", ["freigegeben", "aenderung"]], ["status", "=", "Kunde vorgelegt"]],
});

/** Prüft einen Datensatz gegen die Regel (für Mock und Unit-Test, identisch zu RUECK_FILTER). */
export function istOffeneRueckmeldung(art, d) {
  switch (art) {
    case "feedback":
      return d.von === "kunde" && d.art !== "vote" && d.status === "Offen";
    case "nachricht":
      return d.richtung === "eingehend" && d.status === "Ungelesen";
    case "nachtrag":
      return (d.status === "Freigegeben" || d.status === "Abgelehnt") && !Number(d.uebernommen) && !!d.entscheidung_am;
    case "planung":
      return (d.kunde_entscheidung === "freigegeben" || d.kunde_entscheidung === "aenderung") && d.status === "Kunde vorgelegt";
    default:
      return false;
  }
}

/**
 * Rückmeldungen offen als einheitliche Einträge.
 * @param {{feedback?:object[], nachrichten?:object[], nachtraege?:object[], planungen?:object[]}} q
 * @param {{nurProjekte?:Set<string>|null, heute?:string, erinnerungTage?:number}} [opts]
 */
export function rueckmeldungen({ feedback = [], nachrichten = [], nachtraege = [], planungen = [] } = {}, { nurProjekte = null, heute, erinnerungTage = 3 } = {}) {
  const passt = (p) => !nurProjekte || nurProjekte.has(p);
  const out = [];
  const alter = (zeit) => (heute && zeit ? Math.max(0, Math.floor((new Date(`${String(heute).slice(0, 10)}T12:00:00`) - new Date(String(zeit).replace(" ", "T"))) / 86400000)) : 0);
  for (const f of feedback) {
    if (!istOffeneRueckmeldung("feedback", f) || !passt(f.projekt)) continue;
    const art = f.art === "sprachnachricht" ? "sprache" : f.art === "freigabe" ? "freigabe" : "pin";
    out.push({ id: `PH Rendering Feedback:${f.name}`, art, quelle: f.art, doctype: "PH Rendering Feedback", name: f.name, projekt: f.projekt, rendering: f.rendering, text: f.text || f.titel || "", zeit: f.erstellt_am || f.creation, autor: f.autor || "" });
  }
  for (const n of nachrichten) {
    if (!istOffeneRueckmeldung("nachricht", n) || !passt(n.projekt)) continue;
    out.push({ id: `PH Projekt Nachricht:${n.name}`, art: "nachricht", quelle: "nachricht", doctype: "PH Projekt Nachricht", name: n.name, projekt: n.projekt, text: n.text || "", zeit: n.gesendet_am || n.creation, autor: n.autor || "" });
  }
  for (const t of nachtraege) {
    if (!istOffeneRueckmeldung("nachtrag", t) || !passt(t.projekt)) continue;
    out.push({ id: `PH Nachtrag:${t.name}`, art: "nachtrag", quelle: "nachtrag", doctype: "PH Nachtrag", name: t.name, projekt: t.projekt, text: `${t.bezeichnung || t.titel || t.name}: ${t.status}`, zeit: t.entscheidung_am, autor: "" });
  }
  for (const p of planungen) {
    if (!istOffeneRueckmeldung("planung", p) || !passt(p.projekt)) continue;
    out.push({ id: `PH Planung:${p.name}`, art: "freigabe", quelle: "planung", doctype: "PH Planung", name: p.name, projekt: p.projekt, text: p.kunde_kommentar || (p.kunde_entscheidung === "freigegeben" ? "Planung freigegeben" : "Änderung gewünscht"), zeit: p.vorgelegt_am || p.modified, autor: "" });
  }
  for (const e of out) {
    e.alterTage = alter(e.zeit);
    e.ueberfaellig = e.alterTage > erinnerungTage;
  }
  return out.sort((a, b) => String(a.zeit || "").localeCompare(String(b.zeit || "")));
}

/** { offen, ueberfaellig } – die eine Zahl. */
export function rueckmeldungenZahl(q, opts) {
  const l = rueckmeldungen(q, opts);
  return { offen: l.length, ueberfaellig: l.filter((e) => e.ueberfaellig).length };
}
