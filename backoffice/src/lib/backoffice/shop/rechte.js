// Rollen im Shop (10-konzept-shop § 1): Shop-Team, Shop-Leitung, Geschäftsführung, Buchhaltung extern,
// Logistik (Bestellungen lesend). Rein; Grundlage ist das Bereichsrecht aus auth/rechte.js.

import { darf } from "../auth/rechte.js";

const rollen = (s) => (Array.isArray(s?.roles) ? s.roles : []);

/** Shop-Leitung (Storno, Erstattung, Sperren, Einstellungen): Bereichsrecht „cancel“. */
export function istLeitung(session) {
  return darf(session, "shop", "cancel") || rollen(session).includes("PH Shop Leitung");
}

/** Geschäftsführung (Freigabe über der Vier-Augen-Grenze). */
export function istGF(session) {
  return rollen(session).some((r) => r === "PH Geschäftsführung" || r === "PH Geschaeftsfuehrung" || r === "System Manager" || r === "Administrator");
}

/** Darf im Shop schreiben (Team und Leitung). */
export function darfSchreiben(session) {
  return darf(session, "shop", "write");
}

/** Darf den Shop sehen: Bereichsrecht oder Rollen mit DocType-Recht (Logistik lesend, Buchhaltung extern Zahlungen). */
export function darfSehen(session) {
  return darf(session, "shop", "read") || rollen(session).some((r) => ["PH Logistik Mitarbeiter", "PH Logistik Leitung", "PH Buchhaltung extern"].includes(r));
}

/** Leitungsseiten (Stripe, Einstellungen): Leitung, GF lesend, Buchhaltung extern nur Auszahlungen. */
export function darfStripe(session) {
  return istLeitung(session) || istGF(session) || rollen(session).includes("PH Buchhaltung extern");
}

export function darfEinstellungen(session) {
  return istLeitung(session) || istGF(session);
}

/** Geld-Kennzahlen und Charts (§ 4.1): nur Leitung und GF. */
export function siehtGeld(session) {
  return istLeitung(session) || istGF(session);
}
