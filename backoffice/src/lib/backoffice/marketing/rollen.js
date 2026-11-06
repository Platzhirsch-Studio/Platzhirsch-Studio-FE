// Bereich Marketing – Rollen (10-konzept-marketing Kopf): „Mitarbeiter“ (PH Marketing Mitarbeiter), „Leitung“
// (PH Marketing Leitung), GF lesend. Admin/System Manager zählen als Leitung. Reines Modul.

const rollen = (session) => (Array.isArray(session?.roles) ? session.roles : []);

export function istLeitung(session) {
  const r = rollen(session);
  return r.includes("PH Marketing Leitung") || r.includes("System Manager") || r.includes("Administrator") || r.includes("PH Backoffice-Admin");
}

export function istMarketing(session) {
  const r = rollen(session);
  return istLeitung(session) || r.includes("PH Marketing Mitarbeiter");
}

/** Darf Inhalte bearbeiten (Mitarbeiter oder Leitung); GF und andere lesen nur. */
export function darfBearbeiten(session) {
  return istMarketing(session);
}

/** Vier-Augen-Schalter (E9, Inhaber-Entscheidung offen): Standard aus. */
export const VIER_AUGEN = false;

/** Eigene Freigabe gesperrt, wenn Vier-Augen an ist und die Person selbst eingereicht hat. */
export function eigeneFreigabeGesperrt(session, einreicher, { vierAugen = VIER_AUGEN } = {}) {
  return !!vierAugen && !!einreicher && einreicher === session?.user;
}
