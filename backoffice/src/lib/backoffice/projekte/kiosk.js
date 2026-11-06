import "server-only";
// Daten für den Montage-Kiosk (10-konzept-projekte.md § 8.1): eigene Aufträge (Team oder Montageleitung) bzw. alle
// für Leitung/Admin; Stopp-Daten ohne Beträge. Statusknopf nur mit Workflow-Recht (A18 / Fähigkeit montage_kiosk_status).

import { darf } from "@/lib/backoffice/auth/rechte";
import { personen } from "./lesen.js";

const sicher = async (fn, ersatz) => {
  try {
    return await fn();
  } catch {
    return ersatz;
  }
};

export async function kioskStopps(client, session, { von, bis }) {
  const namen = await sicher(() => client.getList("PH Montageauftrag", { fields: ["name"], filters: [["start", ">=", `${von} 00:00:00`], ["start", "<=", `${bis} 23:59:59`], ["status", "not in", ["Abgebrochen", "Abgenommen"]]], orderBy: "start asc", limit: 100 }), []);
  const docs = (await Promise.all(namen.map((n) => sicher(() => client.getDoc("PH Montageauftrag", n.name), null)))).filter(Boolean);
  const alle = darf(session, "projekte", "cancel") || darf(session, "zentrale", "admin");
  const eigene = docs.filter((m) => alle || m.montageleiter === session.user || (m.team || []).some((t) => t.user === session.user));
  const leute = await personen(client, eigene.flatMap((m) => (m.team || []).map((t) => t.user)));
  const projekte = Object.fromEntries((await sicher(() => client.getList("PH Projekt", { fields: ["name", "titel", "kunde_name"], filters: [["name", "in", [...new Set(eigene.map((m) => m.projekt))]]], limit: 100 }), [])).map((p) => [p.name, p]));
  return eigene.map((m) => stoppAus(m, projekte[m.projekt], leute));
}

export function stoppAus(m, p, leute = {}) {
  return {
    name: m.name,
    status: m.status,
    start: m.start,
    ende: m.ende,
    projekt: m.projekt,
    projektTitel: p?.titel || m.titel,
    kunde: m.kunde_anwesend || p?.kunde_name || "",
    strasse: m.strasse || "",
    plz: m.plz || "",
    ort: m.ort || "",
    hinweis: m.hinweis_ort || "",
    telefon: m.telefon_vor_ort || "",
    team: (m.team || []).map((t) => leute[t.user]?.name || t.user),
    leistungen: (m.leistungen || []).length,
    leistungenListe: (m.leistungen || []).map((l) => ({ name: l.name, beschreibung: l.beschreibung, erledigt: l.erledigt })),
    unterlagen: (m.unterlagen || []).length,
    unterlagenListe: (m.unterlagen || []).map((u) => u.titel),
    fotos: (m.fotos || []).length,
    maengel: (m.maengel || []).length,
  };
}
