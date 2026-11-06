// Serialisierbare Zeilen für Listen, Kanban und „Jetzt dran“ (Server baut, Client zeigt). Reines Modul.
import { knopfFuer } from "./naechsterSchritt.js";
import { faelligkeitTon, gewaehrleistungKompakt, rotesSignal, eskalationsstufe, regressFristKritisch } from "./regeln.js";
import { datumLang, personName, relativTage, tagMonat, tagKurz, uhr } from "./anzeige.js";
import { tageBis } from "./fristen.js";

/** Titel einer Fall-Zeile: „Kunde – Produkt“ (ohne Art-Präfix). */
export function fallTitel(f) {
  const produkt = f.produkt_name || f.fehlercode_bezeichnung || f.art || "";
  return [f.kunde_name, produkt].filter(Boolean).join(" – ") || f.titel || f.name;
}

export function fallZeile(f, { heute = new Date(), warnTage = 60, personen = {}, leitung = false, einsatzText = "" } = {}) {
  const server = f.schritt || { schritt: "–", aktion: null, faellig: null };
  const knopf = knopfFuer(f, server, { leitung, einsatzText });
  const ruht = f.letzte_bewegung ? -tageBis(f.letzte_bewegung, heute) : null;
  return {
    name: f.name,
    titel: fallTitel(f),
    kunde: f.kunde_name || "",
    email: f.kunde_email || "",
    unter: [f.name, f.fehlercode ? `${f.fehlercode} ${f.fehlercode_bezeichnung || ""}`.trim() : f.art, f.einsatz_ort].filter(Boolean).join(" · "),
    bild: f.bild || null,
    status: f.status,
    kulanz: f.kulanz_freigabe_status || "",
    prioritaet: f.prioritaet || "",
    schrittText: server.schritt,
    knopf,
    ton: faelligkeitTon(knopf.faellig, heute),
    gwl: gewaehrleistungKompakt(f, heute, warnTage),
    signal: rotesSignal(f, heute),
    eskalation: eskalationsstufe(f),
    verantwortlich: f.verantwortlich || "",
    verantwortlichName: personName(f.verantwortlich, personen),
    gemeldet: f.gemeldet_am ? relativTage(f.gemeldet_am, heute) : "",
    gemeldetAm: f.gemeldet_am ? tagMonat(f.gemeldet_am) : "",
    ruhtTage: ruht !== null && ruht >= 0 ? ruht : null,
    quelle: f.quelle || "",
    lieferantHaftet: !!Number(f.lieferantenrelevant),
  };
}

export function einsatzZeile(e, { personen = {} } = {}) {
  return {
    name: e.name,
    titel: e.kunde_name || e.titel || e.name,
    unter: [e.art, e.ort, e.servicefall || e.pflege_abo].filter(Boolean).join(" · "),
    status: e.status,
    art: e.art,
    datum: e.datum,
    tag: tagKurz(e.datum),
    zeit: uhr(e.zeit_von) ? `${uhr(e.zeit_von)}${uhr(e.zeit_bis) ? `–${uhr(e.zeit_bis)}` : ""}` : "",
    techniker: e.techniker,
    technikerName: personName(e.techniker, personen),
    unbestaetigt: e.status === "Geplant" && !e.bestaetigt_kunde_am,
    neuInformieren: !!e.umgeplant_am && !e.bestaetigt_kunde_am,
    servicefall: e.servicefall || "",
    pflege: e.pflege_abo || "",
    ergebnis: e.ergebnis || "",
  };
}

/** Regressfrist je Status (R-03): „Gemeldet“ ist nicht gewahrt; ab Anerkannt gewahrt. */
export function regressFristText(r, heute = new Date()) {
  if (["Anerkannt", "Verrechnet"].includes(r.status)) return { text: "gewahrt (anerkannt)", ton: "ok" };
  if (!r.frist_bis) return { text: "beginnt mit Erledigung", ton: "leer" };
  return { text: `bis ${datumLang(r.frist_bis)}${r.status === "Gemeldet" ? " · erst mit Anerkenntnis gewahrt" : ""}`, ton: regressFristKritisch(r, heute) ? "abgelaufen" : "warn" };
}
