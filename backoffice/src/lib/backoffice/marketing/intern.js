// Bereich Marketing – Prüfung „interne Adresse“ für Testmails (U19, P0-11; 10-konzept-marketing § 13.3 intern.js).
// Die Server Action prüft vor jedem Testmail-Versand, bis die Server-Regel P0-11 steht. Reines Modul.

import { istIntern } from "./regeln.js";
import { DEMO_BENUTZER } from "../auth/mockUsers.js";

/** Kontext aus Einstellungen + bekannten Benutzern (Mock: Demo-Benutzer). */
export function internKontext(einst = {}, { benutzer = [] } = {}) {
  const domains = String(einst.test_domains || "").split(",").map((d) => d.trim()).filter(Boolean);
  const absender = [einst.antwort_an, einst.absender_gastgeberin].filter(Boolean);
  const hausDomain = String(einst.antwort_an || "").split("@")[1];
  return {
    testadresse: einst.test_empfaenger || "",
    benutzer: [...benutzer, ...absender, ...DEMO_BENUTZER.map((u) => u.email)],
    domains: [...domains, ...(hausDomain ? [hausDomain] : [])],
  };
}

export function adresseIntern(email, einst = {}, opts = {}) {
  return istIntern(email, internKontext(einst, opts));
}
