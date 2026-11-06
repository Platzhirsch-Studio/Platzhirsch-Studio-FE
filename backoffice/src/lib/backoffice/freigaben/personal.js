// Freigabe-Arten – Bereich Personal (Team B-PER, G-15, Konzept § 5.8/§ 9 „Glocke mit Kontext“).
// Urlaubs- und Abwesenheitsanträge erscheinen in der Glocke („Für mich“) der Personal-Leitung mit Zeitraum,
// Vertretung und Teamstärke als Grund-Zeile. Eigener Antrag (PH Mitarbeiter.user = Sitzung) → gesperrt
// („Eigener Antrag – zweite Person nötig“). Nicht geldwirksam. Krankmeldungen sind keine Anträge (E5) und
// erscheinen hier nicht. Importzeile in freigaben/index.js trägt P0-7/L0 ein. Reines Modul.

import { workflow } from "../personal/methoden.js";
import { teamStaerke, teamsVon } from "../personal/regeln.js";
import { artText } from "../personal/status.js";
import { zeitraumText } from "../personal/zeit.js";

const ABW = "PH Abwesenheit";
const MA = "PH Mitarbeiter";
const TEAM = { verkauf: "Verkauf", planung: "Planung", montage: "Montage" };

const arten = [
  {
    art: "personal.abwesenheit",
    bereich: "personal",
    titel: "Abwesenheitsantrag",
    geldwirksam: false,
    folge: "Die Person wird über die Entscheidung informiert.",
    recht: { bereich: "personal", aktion: "cancel" },
    laden: async (session, client) => {
      const offen = await client.getList(ABW, { fields: ["name", "mitarbeiter", "mitarbeiter_name", "art", "von", "bis", "vertretung", "modified", "creation", "owner"], filters: [["status", "=", "Beantragt"]], orderBy: "von asc", limit: 50 });
      if (!offen.length) return [];
      const ma = await client.getList(MA, { fields: ["name", "titel", "user", "status", "team_verkauf", "team_planung", "team_montage"], filters: [["status", "in", ["Aktiv", "Karenz"]]], limit: 500 });
      const weg = await client.getList(ABW, { fields: ["mitarbeiter", "von", "bis", "status"], filters: [["status", "=", "Genehmigt"]], limit: 2000 });
      return offen.map((a) => {
        const m = ma.find((x) => x.name === a.mitarbeiter);
        const team = m ? teamsVon(m)[0] : null;
        const st = team ? teamStaerke(team, ma, [...weg, { ...a, status: "Genehmigt" }], a.von) : null;
        const vertretung = a.vertretung ? ma.find((x) => x.name === a.vertretung)?.titel : null;
        return {
          name: a.name,
          titel: `${a.mitarbeiter_name} · ${artText(a.art)} ${zeitraumText(a.von, a.bis)}`,
          objekt: { titel: a.mitarbeiter_name, href: "/personal/team?ansicht=antraege" },
          antragsteller: { user: m?.user || "", name: a.mitarbeiter_name },
          grund: [vertretung ? `Vertretung ${vertretung}` : null, st ? `${TEAM[team]} dann ${st.da} von ${st.gesamt} da` : null].filter(Boolean).join(" · "),
          zeit: a.creation,
          token: a.modified,
        };
      });
    },
    freigeben: async (session, client, { name }) => {
      await workflow(client, ABW, name, "Genehmigen");
    },
    ablehnen: async (session, client, { name, grund }) => {
      await client.setValue(ABW, name, "ablehnungsgrund", String(grund || "").trim().slice(0, 500));
      await workflow(client, ABW, name, "Ablehnen");
    },
  },
];

export default arten;
