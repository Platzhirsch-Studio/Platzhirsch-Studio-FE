// Rollen im Bereich Personal (Konzept § 1.1). Reines Modul (keine "@/"-Importe), läuft unter node --test.
// Eine Sitzung bekommt genau eine Bereichsrolle – die stärkste gewinnt:
//   leitung (PH Personal Leitung, System Manager) · gf (PH Geschäftsführung) · sachbearbeitung (PH Personal Mitarbeiter)
//   · admin (PH Backoffice-Admin) · selbst (nur PH Personal Selbstservice) · null (kein Zugang).
// Die Regeln hier steuern nur, was die Oberfläche anbietet; Server Actions prüfen dieselben Funktionen erneut,
// im Frappe-Modus prüft Frappe zusätzlich mit der Sitzung der Person.

export const ROLLE = Object.freeze({
  leitung: "PH Personal Leitung",
  mitarbeiter: "PH Personal Mitarbeiter",
  selbst: "PH Personal Selbstservice",
  admin: "PH Backoffice-Admin",
});
const GF = ["PH Geschäftsführung", "PH Geschaeftsfuehrung"];
const SYSTEM = ["System Manager", "Administrator"];

function rollenVon(session) {
  return Array.isArray(session?.roles) ? session.roles : [];
}

/** @returns {"leitung"|"gf"|"sachbearbeitung"|"admin"|"selbst"|null} */
export function personalRolle(session) {
  const r = rollenVon(session);
  if (r.includes(ROLLE.leitung) || r.some((x) => SYSTEM.includes(x))) return "leitung";
  if (r.some((x) => GF.includes(x))) return "gf";
  if (r.includes(ROLLE.mitarbeiter)) return "sachbearbeitung";
  if (r.includes(ROLLE.admin)) return "admin";
  if (r.includes(ROLLE.selbst)) return "selbst";
  return null;
}

export const istLeitung = (rolle) => rolle === "leitung";
/** Art der Abwesenheit, Krankmeldungen, permlevel 1 (Bewertung, Vertrauliches): Leitung und GF (§ 1.2). */
export const darfArtSehen = (rolle) => rolle === "leitung" || rolle === "gf";
export const darfVertraulich = darfArtSehen;
/** Bewerbungen und Gespräche: nicht Backoffice-Admin, nicht Selbstservice (README ph_personal). */
export const darfBewerbungen = (rolle) => rolle === "leitung" || rolle === "gf" || rolle === "sachbearbeitung";
/** Team (Kalender, Personen, Buchungen, Anträge): alle außer reinem Selbstservice. */
export const darfTeam = (rolle) => rolle === "leitung" || rolle === "gf" || rolle === "sachbearbeitung" || rolle === "admin";
/** Stellen lesen: alle außer reinem Selbstservice. */
export const darfStellen = darfTeam;
/** Schreiben in Bewerbungen/Stellen (Sichten, Gespräch planen, Pausieren …). */
export const darfBearbeiten = (rolle) => rolle === "leitung" || rolle === "sachbearbeitung";
/** Genehmigen/Ablehnen (Workflow: Leitung und GF, Bedingung gegen den Antragsteller). */
export const darfEntscheiden = (rolle) => rolle === "leitung" || rolle === "gf";
/** Datenschutz-Cockpit, Einstellen, Absage senden, Austritt, Löschen. */
export const darfLeitung = istLeitung;
/** Einstellungen des Bereichs (Leitung schreibt, Admin pflegt Stammdaten). */
export const darfEinstellungen = (rolle) => rolle === "leitung" || rolle === "admin" || rolle === "gf" || rolle === "sachbearbeitung";
export const darfEinstellungenSchreiben = (rolle) => rolle === "leitung" || rolle === "admin";
/** Berichte (lesen): Leitung, GF, Sachbearbeitung. */
export const darfBerichte = darfBewerbungen;
/** CSV-Export: nur Leitung (protokolliert, Konzept § 5.5/§ 5.11). */
export const darfExport = istLeitung;
/** Uhrzeiten anderer Personen (Personalakte): Leitung und GF – nie in „Heute im Haus“ (E9). */
export const darfUhrzeitenSehen = darfArtSehen;
/** Buchungen anderer Personen korrigieren/nachtragen. */
export const darfBuchungenKorrigieren = istLeitung;

/** Lesbarer Name der Rolle (Hilfe, Hinweise „Nur …“). */
export const ROLLEN_TITEL = Object.freeze({ leitung: "Personal-Leitung", gf: "Geschäftsführung", sachbearbeitung: "Sachbearbeitung Personal", admin: "Backoffice-Admin", selbst: "Selbstservice" });
