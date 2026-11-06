// „Nächster Schritt“ je Servicefall – Spiegel von ph_service/utils/schritte.py (10-konzept-service §3.4, N2).
// Maßgeblich ist der Server (get_next_steps / get_service_case_file). Dieser Spiegel dient nur der optimistischen
// Anzeige nach einer eigenen Aktion und dem Mock-Modus. Gemeinsame Testfälle: tests/unit/service-naechsterSchritt.test.mjs.
// Reines Modul (keine "@/"-Importe).

import { alsDatum, iso } from "./fristen.js";

const TAG_MS = 86_400_000;

function d(wert) {
  return alsDatum(wert);
}

/**
 * @param {object} fall flaches Objekt (Felder des Falls + Zähler ersatzteile_benoetigt, ersatzteile_offen,
 *   einsaetze_offen, regress_vorhanden, naechster_einsatz, ersatzteile_erwartet_am)
 * @param {string|Date} [heute]
 * @returns {{schritt:string, aktion:string|null, faellig:string|null, rang:number}}
 */
export function naechsterSchritt(fall, heute = new Date()) {
  const h = d(heute) || d(new Date());
  const st = fall?.status;
  const n = (k) => Number(fall?.[k] || 0);
  let schritt;
  let aktion;
  let faellig = null;
  if (st === "Gemeldet" && !fall.erstreaktion_am) {
    [schritt, aktion, faellig] = ["Kunde kontaktieren (Erstreaktion)", "erstreaktion_erfassen", d(fall.frist_reaktion)];
  } else if (st === "Gemeldet") {
    [schritt, aktion] = !fall.fehlercode ? ["Fehlercode zuordnen und prüfen", "pruefen"] : ["Prüfung abschließen", "pruefen"];
  } else if (st === "Geprueft") {
    [schritt, aktion] = ["Entscheidung treffen", "entscheiden"];
  } else if (st === "Entscheidung" && fall.kulanz_freigabe_status === "Angefordert") {
    [schritt, aktion] = ["Kulanz-Freigabe der Leitung abwarten", "kulanz_freigeben"];
  } else if ((st === "Entscheidung" || st === "In Bearbeitung") && n("ersatzteile_benoetigt")) {
    [schritt, aktion] = ["Ersatzteile bestellen", "ersatzteile_bestellen"];
  } else if ((st === "Entscheidung" || st === "In Bearbeitung") && n("ersatzteile_offen")) {
    [schritt, aktion, faellig] = ["Ersatzteile erwartet", "ersatzteile_verfolgen", d(fall.ersatzteile_erwartet_am)];
  } else if ((st === "Entscheidung" || st === "In Bearbeitung") && !n("einsaetze_offen") && ["Verbesserung", "Austausch"].includes(fall.entscheidung)) {
    [schritt, aktion] = ["Einsatz planen", "einsatz_anlegen"];
  } else if (st === "Einsatz geplant") {
    [schritt, aktion, faellig] = ["Einsatz durchführen", "einsatz", d(fall.naechster_einsatz)];
  } else if (st === "In Bearbeitung") {
    [schritt, aktion] = ["Abschlussbericht und Erledigt melden", "erledigt_melden"];
  } else if (st === "Erledigt" && fall.lieferantenrelevant && !n("regress_vorhanden")) {
    [schritt, aktion, faellig] = ["Lieferant informieren (Regress)", "lieferant_informieren", d(fall.regress_frist_bis)];
  } else if (st === "Erledigt" && !(fall.kunde_informiert_am || fall.abnahme_bestaetigt)) {
    [schritt, aktion] = ["Kunde informieren, dann schließen", "kunde_informieren"];
  } else if (st === "Erledigt") {
    [schritt, aktion] = ["Schließen", "schliessen"];
  } else {
    [schritt, aktion] = ["–", null];
  }
  if (!faellig && !["Erledigt", "Geschlossen", "Abgelehnt"].includes(st)) faellig = d(fall?.frist_loesung);
  let rang;
  if (aktion === null) rang = 99999;
  else if (!faellig) rang = 5000;
  else rang = Math.round((faellig.getTime() - h.getTime()) / TAG_MS) + 1000;
  return { schritt, aktion, faellig: faellig ? iso(faellig) : null, rang };
}

/**
 * Server-Schritt → Knopf der Oberfläche (§3.4, Spalte „Schritt (Knopftext)“). Der Primärknopf folgt immer dem
 * Server-Schritt; Zeilen, die erst mit A-S2 kommen (Mängelanzeige, Gutschrift, Terminvorschlag …), sind Hinweise.
 * @param {object} fall
 * @param {{schritt:string, aktion:string|null, faellig:string|null}} server
 * @param {{leitung?:boolean, einsatzText?:string}} [ctx]
 * @returns {{id:string|null, titel:string, art:"primaer"|"blocker"|"keiner", neben?:{id:string, titel:string}, faellig:string|null}}
 */
export function knopfFuer(fall, server, { leitung = false, einsatzText = "" } = {}) {
  const f = server?.faellig || null;
  switch (server?.aktion) {
    case "erstreaktion_erfassen":
      return fall?.kunde_email
        ? { id: "eingang-senden", titel: "Eingangsbestätigung senden", art: "primaer", neben: { id: "telefonat", titel: "Telefonat erfassen" }, faellig: f }
        : { id: "telefonat", titel: "Telefonat erfassen", art: "primaer", faellig: f };
    case "pruefen":
      return fall?.fehlercode ? { id: "pruefen", titel: "Prüfen & entscheiden", art: "primaer", faellig: f } : { id: "pruefen", titel: "Fehler zuordnen und prüfen", art: "primaer", faellig: f };
    case "entscheiden":
      return { id: "entscheiden", titel: "Entscheiden", art: "primaer", faellig: f };
    case "kulanz_freigeben":
      return leitung ? { id: "kulanz-freigeben", titel: "Kulanz freigeben …", art: "primaer", faellig: f } : { id: null, titel: "Kulanz-Freigabe der Leitung abwarten", art: "blocker", faellig: f };
    case "ersatzteile_bestellen":
      return { id: "ersatzteile-bestellen", titel: "Ersatzteile bestellen", art: "primaer", faellig: f };
    case "ersatzteile_verfolgen":
      return { id: null, titel: f ? `Ersatzteile erwartet am ${kurzDatum(f)}` : "Ersatzteile erwartet", art: "blocker", faellig: f };
    case "einsatz_anlegen":
      return { id: "einsatz-planen", titel: "Einsatz planen", art: "primaer", faellig: f };
    case "einsatz":
      return { id: null, titel: einsatzText || (f ? `Einsatz am ${kurzDatum(f)}` : "Einsatz geplant"), art: "blocker", faellig: f };
    case "erledigt_melden":
      return { id: "erledigt-melden", titel: "Erledigt melden", art: "primaer", faellig: f };
    case "lieferant_informieren":
      return { id: "forderung-stellen", titel: "Forderung stellen", art: "primaer", faellig: f };
    case "kunde_informieren":
      return { id: "abschluss-mitteilen", titel: "Abschluss mitteilen", art: "primaer", faellig: f };
    case "schliessen":
      return { id: "schliessen", titel: "Schließen", art: "primaer", faellig: f };
    default:
      // §3.4 Zeile 2 (Kulanz abgelehnt) kennt der Server erst mit A-S2 – bis dahin Hinweis mit Aktion.
      if (fall?.status === "Entscheidung" && fall?.kulanz_freigabe_status === "Abgelehnt") return { id: "pruefen", titel: "Entscheidung ändern", art: "primaer", faellig: null };
      return { id: null, titel: "–", art: "keiner", faellig: null };
  }
}

function kurzDatum(isoText) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoText || ""));
  return m ? `${m[3]}.${m[2]}.` : "";
}

/** Mehrere Fälle → { name: schritt } (Spiegel von get_next_steps). */
export function naechsteSchritte(faelle, heute = new Date()) {
  return Object.fromEntries((faelle || []).map((f) => [f.name, naechsterSchritt(f, heute)]));
}
