// src/lib/kundenkarte/portalMock.js – Demo-Karte für das Kundenportal
// („Mein Platzhirsch“ › Kundenkarte) im Mock-Betrieb. Form = Antwort von
// ph_kundenkarte.api.portal_card (adapters/interface.js, PortalCard).
// Keine echten Kundendaten, keine Preise; fehlt_cent nur als Zahl des Mocks
// (die Website rechnet damit nicht und nennt keine Beträge in Euro).
// Rein, keine "@/..."-Importe (node --test).
import { STUFEN, VORTEILE, kundenkarteCopy } from "./copy.js";

/** Demo-Karte eines Kunden (customerId nur für Mock-Seed/Zuordnung). */
export function buildDemoCard({ seit = "2026-03-14", stufeKey = "plus" } = {}) {
  const c = kundenkarteCopy("de");
  const stufe = STUFEN.find((s) => s.key === stufeKey) || STUFEN[0];
  const next = STUFEN[STUFEN.indexOf(stufe) + 1] || null;
  const vorteile = VORTEILE.map((v) => {
    const verfuegbar = v.stufen.includes(stufe.key);
    const perYear = v.key === "pflege" ? 1 : null;
    return {
      titel: c.vorteile[v.key].titel,
      art: v.art,
      beschreibung: c.vorteile[v.key].text,
      verfuegbar,
      einloesbar_pro_jahr: verfuegbar ? perYear : null,
      genutzt: verfuegbar && v.key === "pflege" ? 1 : 0,
    };
  });
  return {
    kartennummer: "PH-2026-000042",
    stufe: { name: stufe.name, farbe: stufe.farbe, seit },
    naechste_stufe: next ? { name: next.name, fehlt_cent: 0 } : null,
    vorteile,
    einloesungen: [{ datum: "2026-09-02", vorteil: c.vorteile.pflege.titel, notiz: "Sofa, Stoff – Termin im Haus" }],
    wallet: { apple: false, google: false },
  };
}
