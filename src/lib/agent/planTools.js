// src/lib/agent/planTools.js – Rat 9,5 C10 (T2, neuland Nr. 14): zwei weitere
// MCP-Werkzeuge ohne Personendaten und ohne Nebenwirkung.
//   ezarri_quantities           Mengenrechner wie /de/ezarri/rechner (gleiche
//                               Faktoren aus src/lib/ezarri/rechner/core.js,
//                               Quelle Ezarri-Rechner), Richtwert, keine Preise
//   idea_board_appointment_link Link, mit dem die Person ihr geteiltes
//                               Ideenboard an eine Termin- bzw. Beratungsanfrage
//                               anhängt (?ideenboard=<Teilen-ID>, Vertrag in
//                               src/lib/kuechenplaner/planTermin.js). Liest das
//                               Board nicht und speichert nichts.
// Rein (relative Importe): node --test lädt es direkt.
import { FAKTOREN_QUELLE, FAKTOREN_STAND, FORMATE, quantities } from "../ezarri/rechner/core.js";
import { planTerminHref } from "../kuechenplaner/planTermin.js";
import { abs } from "./facts.js";

export const EZARRI_RECHNER_PATH = "/de/ezarri/rechner";

/** Mengen für eine Fläche in m² (mit Verschnitt), gerundet auf volle Kartons. */
export function ezarriQuantities({ flaeche_m2, format = "25", verschnitt_prozent = 10 } = {}) {
  const q = quantities({ flaechen: Number(flaeche_m2) || 0, format, margeProzent: verschnitt_prozent });
  const f = FORMATE[q.format];
  return {
    format: { id: f.id, label: f.label, blatt_cm: f.blattCm, m2_pro_karton: f.m2ProKarton, blatt_pro_karton: f.blattProKarton },
    flaeche_netto_m2: q.netto,
    verschnitt_prozent: q.margeProzent,
    flaeche_mit_verschnitt_m2: q.mitMarge,
    kartons: q.kartons,
    blaetter: q.blaetter,
    bestellmenge_m2: q.m2,
    paletten: q.paletten,
    kg_mosaik: q.kgMosaik,
    kg_kleber: q.kgKleber,
    kg_fuge: q.kgFuge,
    hinweis:
      "Richtwert nach den Faktoren des Ezarri-Rechners, kein Angebot. Die Bestellmenge prüft das Studio in Lochau mit Plan und Muster. Preise auf Anfrage.",
    quelle: { url: FAKTOREN_QUELLE, stand: FAKTOREN_STAND },
    rechner: abs(EZARRI_RECHNER_PATH),
  };
}

/** Link für „Board an Termin anhängen“ (nur der Link, das Board liest der Empfänger). */
export function ideaBoardAppointmentLink({ share_id, locale = "de", calendar = false } = {}) {
  const href = planTerminHref({ locale, calendar, planer: "ideenboard", ideenboard: share_id });
  return {
    url: abs(`${href}${href.includes("?") ? "&" : "?"}quelle=agent`),
    hinweis:
      "Die Person öffnet den Link selbst und schickt die Anfrage ab. Das Board wird erst dann angehängt; es wird nichts gebucht und nichts gespeichert.",
  };
}
