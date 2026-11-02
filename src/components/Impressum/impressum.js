import React from "react";
import LegalProse from "./LegalProse";
import { ADDRESS, EMAIL, EMAIL_HREF, LEGAL_NAME, PHONE_DISPLAY, PHONE_HREF, SITE_NAME } from "@/lib/site";

// Impressum, live page /<locale>/impressum (German text in all languages).
//
// FREIGEGEBEN – Kanzlei-Freigabe der Rechtstexte laut Inhaber-Entscheidung
// Nr. 11 (29.10.2026, Marktresearch/digital/teamleiter/inhaber-entscheidungen.md).
// Grundlage der freigegebenen Fassung (Fix-Runde 1, F4, r1-recht-inhalt P0-2,
// Marktresearch/recht/04 §1/§5 A):
//   - „betrieben von“, Sitz = Gemeinde, „Landesgericht Feldkirch“,
//   - Hinweis Gewerbeordnung mit RIS-Link (§ 5 Abs 1 Z 6 ECG),
//   - Offenlegung nach § 25 MedienG mit den belegten Angaben: Firma und Sitz
//     laut Firmenbuch (FN 443753 d), Unternehmensgegenstand laut
//     Firmenbuchauszug (Marktresearch/01-bestandsanalyse §1).
//
// INHABER TRÄGT HIER WÖRTLICH EIN (nur in dieser Datei, nichts schätzen):
//   1. CHAMBER     – Kammer und Fachgruppen genau so, wie sie im WKO-Auszug
//                    („WKO Firmen A–Z“) stehen, dazu source und checkedAt.
//   2. BLATTLINIE  – der Satz zur grundlegenden Richtung der Website genau so,
//                    wie er im freigegebenen Dokument steht, dazu source und
//                    checkedAt.
// Solange ein Feld fehlt, rendert die Seite die jeweilige Zeile NICHT (kein
// Platzhalter, keine Lücke). Liste: Marktresearch/digital/teamleiter/freigaben-recht.md.
// Beteiligungsverhältnisse (§ 25 Abs 2 MedienG): vom Inhaber am 30.10.2026
// übermittelt (firmenabc.at, Daten Creditreform/Firmenbuch), siehe SHAREHOLDERS.
// Weiter bewusst nicht auf der Seite, weil nicht belegt: Streitbeilegung (§ 19 AStG, Entscheidung Inhaber), DSA-Kontaktstelle.
// Register data: same values as src/components/LegalDrafts/company.js (REGISTER).
const REGISTER = {
  legalForm: "Gesellschaft mit beschränkter Haftung",
  seat: "Lochau",
  fn: "FN 443753 d",
  court: "Landesgericht Feldkirch",
  uid: "ATU70035339",
  managers: ["Susanne Messmer", "Andreas Wegscheider"],
  authority: "Bezirkshauptmannschaft Bregenz",
  purpose: "Einrichtungsfachhandel, Gastgewerbe (Café), Immobilienverwaltung",
};

// Beteiligungsverhältnisse des Medieninhabers (§ 25 Abs 2 MedienG).
// Quelle: firmenabc.at/mw-immobilienverwaltungs-gmbh-platzhirsch_MlGc, vom
// Inhaber am 30.10.2026 für das Impressum übermittelt ("Anteil: 50,00%" je Person).
export const SHAREHOLDERS = Object.freeze({
  holders: Object.freeze([
    Object.freeze({ name: "Susanne Messmer", share: "50 %" }),
    Object.freeze({ name: "Andreas Wegscheider", share: "50 %" }),
  ]),
  source: "firmenabc.at (Creditreform/Firmenbuch), übermittelt am 30.10.2026",
  checkedAt: "2026-10-30",
});

/** Zeile „Beteiligungsverhältnisse: …“ – nur mit belegten Angaben, sonst null. */
export function shareholdersLine(s = SHAREHOLDERS) {
  const h = (s?.holders || []).filter((x) => x?.name && x?.share);
  if (!h.length || !s.source || !s.checkedAt) return null;
  return `Beteiligungsverhältnisse: ${h.map((x) => `${x.name} ${x.share}`).join(", ")}`;
}

// 1. Kammerzugehörigkeit (§ 5 Abs 1 Z 6 ECG). WÖRTLICH aus dem WKO-Auszug
// eintragen, z. B. chamber: "<Kammer laut Auszug>", groups: ["<Fachgruppe 1
// laut Auszug>", "<Fachgruppe 2 laut Auszug>"], source: "WKO Firmen A–Z,
// Auszug vom <Datum>", checkedAt: "<JJJJ-MM-TT>". Erst wenn alle vier Werte
// gesetzt sind, erscheint die Zeile unter „Gewerberecht und Aufsicht“.
// Eingetragen 30.10.2026 aus WKO Firmen A–Z, Eintrag „MW Immobilienverwaltungs
// GmbH“, Vorarlberg (firmen.wko.at/mw-immobilienverwaltungs-gmbh/vorarlberg/
// ?firmaid=dcc5faef-06be-4352-b651-48253c72f76f): zwei Gewerbeberechtigungen,
// „FG Gastronomie“ (Berufszweig Kaffeehäuser) und „LG Elektro- und
// Einrichtungsfachhandel“ (Berufszweig Einrichtungsfachhandel), Behörde BH Bregenz.
// Kammer = Landeskammer des Standorts (Eintrag unter /vorarlberg/).
export const CHAMBER = Object.freeze({
  chamber: "Wirtschaftskammer Vorarlberg",
  groups: Object.freeze(["Fachgruppe Gastronomie", "Landesgruppe Elektro- und Einrichtungsfachhandel"]),
  source: "WKO Firmen A–Z, Eintrag MW Immobilienverwaltungs GmbH, abgerufen am 30.10.2026",
  checkedAt: "2026-10-30",
});

/** Zeile „Mitglied der …, Fachgruppe(n) …“ – nur mit vollständigen, belegten Angaben, sonst null. */
export function chamberLine(c = CHAMBER) {
  const groups = (c?.groups || []).map((g) => String(g || "").trim()).filter(Boolean);
  if (!c?.chamber || !groups.length || !c.source || !c.checkedAt) return null;
  return `Mitglied der ${c.chamber}: ${groups.join(", ")}`;
}

// 2. Blattlinie (§ 25 Abs 4 MedienG, grundlegende Richtung der Website).
// text: WÖRTLICH aus dem freigegebenen Dokument, ohne Anführungszeichen und
// ohne „Blattlinie:“ davor (das setzt die Seite). source: z. B. „Freigabe der
// Kanzlei vom <Datum>“, checkedAt: "<JJJJ-MM-TT>". Erst mit allen drei Werten
// erscheint die Zeile unter „Offenlegung nach § 25 MedienG“.
// Hinweis: Der Vorschlag im Kanzlei-Entwurf (LegalDrafts/docs/impressum.js
// § 13) ist NICHT automatisch der freigegebene Wortlaut.
export const BLATTLINIE = Object.freeze({
  text: null, // wörtlich laut freigegebenem Dokument
  source: null, // „Freigabe der Kanzlei vom …“
  checkedAt: null, // ISO-Datum der Prüfung
});

/** Zeile „Grundlegende Richtung (Blattlinie): …“ – nur mit vollständigen, belegten Angaben, sonst null. */
export function blattlinieLine(b = BLATTLINIE) {
  const text = String(b?.text || "").trim();
  if (!text || !b.source || !b.checkedAt) return null;
  return `Grundlegende Richtung (Blattlinie): ${text}`;
}

export const IMPRESSUM_LIVE_STATUS = Object.freeze({
  stand: "2026-10-29",
  lawyerApproved: true,
  approvedAt: "2026-10-29",
  approvedBy: "Kanzlei (Inhaber-Entscheidung Nr. 11)",
  // Zeilen, die erst erscheinen, wenn der Inhaber sie oben wörtlich einträgt.
  ownerFills: ["BLATTLINIE (grundlegende Richtung der Website)"],
  omittedUntilConfirmed: ["Streitbeilegung", "DSA-Kontaktstelle"],
});

/** Felder, die der Inhaber noch eintragen muss (leer = alles drin). */
export function impressumOwnerOpen(c = CHAMBER, b = BLATTLINIE) {
  const open = [];
  if (!chamberLine(c)) open.push("CHAMBER");
  if (!blattlinieLine(b)) open.push("BLATTLINIE");
  return open;
}

const Impressum = () => {
  const chamber = chamberLine();
  const blattlinie = blattlinieLine();
  const shareholders = shareholdersLine();
  return (
    <LegalProse>
      <p>Informationen nach § 5 E-Commerce-Gesetz (ECG) und § 14 Unternehmensgesetzbuch (UGB), Offenlegung nach § 25 Mediengesetz (MedienG).</p>

      <h2>Anbieter</h2>
      <p>
        <strong>{SITE_NAME}</strong> wird betrieben von der
        <br />
        <strong>{LEGAL_NAME}</strong>
        <br />
        {ADDRESS.street}, {ADDRESS.postalCode} {ADDRESS.city}, {ADDRESS.country}
      </p>

      <h2>Kontakt</h2>
      <p>
        Telefon: <a href={PHONE_HREF}>{PHONE_DISPLAY}</a>
        <br />
        E-Mail: <a href={EMAIL_HREF}>{EMAIL}</a>
      </p>

      <h2>Unternehmens­daten</h2>
      <p>
        Rechtsform: {REGISTER.legalForm}
        <br />
        Sitz: {REGISTER.seat}
        <br />
        Firmenbuch­nummer: {REGISTER.fn}
        <br />
        Firmenbuch­gericht: {REGISTER.court}
        <br />
        Umsatzsteuer­identifikations­nummer: {REGISTER.uid}
        <br />
        Geschäftsführung: {REGISTER.managers.join(", ")}
      </p>

      <h2>Gewerberecht und Aufsicht</h2>
      <p>
        Gewerbebehörde und Aufsichtsbehörde: {REGISTER.authority}
        <br />
        {chamber && (
          <>
            {chamber}
            <br />
          </>
        )}
        Anwendbare Rechtsvorschriften: Gewerbeordnung 1994, abrufbar im Rechtsinformationssystem des Bundes unter{" "}
        <a href="https://www.ris.bka.gv.at" rel="noopener noreferrer">
          www.ris.bka.gv.at
        </a>
      </p>

      <h2>Offenlegung nach § 25 MedienG</h2>
      <p>
        Medieninhaber: {LEGAL_NAME}, Sitz {REGISTER.seat}
        <br />
        Unternehmens­gegenstand: {REGISTER.purpose}
        {shareholders && (
          <>
            <br />
            {shareholders}
          </>
        )}
        {blattlinie && (
          <>
            <br />
            {blattlinie}
          </>
        )}
      </p>
    </LegalProse>
  );
};

export default Impressum;
