// Rollenprüfung des Bereichs Logistik (10-konzept-logistik § 1.2). Die Server Actions prüfen Rollen zusätzlich dort,
// wo die App nur `write` prüft (Tour freigeben/abbrechen, Inventur verwerfen/freigeben, Storno ab Gepackt …). Reines Modul.

const ADMIN = ["PH Backoffice-Admin", "System Manager"];
export const LEITUNG_ROLLEN = ["PH Logistik Leitung", "PH Geschäftsführung", ...ADMIN];
export const LOGISTIK_ROLLEN = ["PH Logistik Mitarbeiter", ...LEITUNG_ROLLEN];
export const MONTAGE_ROLLEN = ["PH Montage"];

function rollen(session) {
  return Array.isArray(session?.roles) ? session.roles : [];
}

/** Leitung Logistik, Geschäftsführung oder Admin. */
export function istLeitung(session) {
  return rollen(session).some((r) => LEITUNG_ROLLEN.includes(r));
}

/** Mitarbeiter oder Leitung Logistik (Packtisch, Lager, Disposition). */
export function istLogistik(session) {
  return rollen(session).some((r) => LOGISTIK_ROLLEN.includes(r));
}

/** Montage: eigene Touren (Fahrer oder Team). */
export function istMontage(session) {
  return rollen(session).some((r) => MONTAGE_ROLLEN.includes(r));
}

/** Darf die Sitzung diese Tour mobil bedienen? (QA 27) */
export function darfTourMobil(session, tour) {
  if (istLogistik(session)) return true;
  if (!istMontage(session) || !tour) return false;
  const u = session.user;
  return tour.fahrer === u || (tour.team || []).some((m) => m.user === u);
}

/** EK-Werte (permlevel 1) nur Leitung/GF. */
export function darfEk(session) {
  return istLeitung(session);
}

/** Faktura-Recht für „Teilrechnung erstellen“. */
export function darfFaktura(session) {
  return rollen(session).some((r) => r.startsWith("PH Faktura") || ADMIN.includes(r) || r === "PH Geschäftsführung");
}
