// Rollen im Bereich Faktura (10-konzept-faktura § 1.1, § 2.6, E12): Mitarbeiter, Leitung, Geschäftsführung,
// Steuerberatung (PH Buchhaltung extern, nur lesen + Export-Läufe), Berater (CRM ohne Faktura-Recht).
// Rein; nutzt die Rechte-Matrix des Fundaments.

import { darf } from "../auth/rechte.js";

/**
 * @param {{roles?:string[]}} session
 * @returns {{liest:boolean, schreibt:boolean, leitung:boolean, gf:boolean, stb:boolean, admin:boolean, export:boolean, darfBank:boolean, darfCsv:boolean, permlevel1:boolean}}
 */
export function fakturaRolle(session) {
  const rollen = session?.roles || [];
  const admin = rollen.includes("System Manager") || rollen.includes("Administrator");
  const gf = rollen.includes("PH Geschäftsführung") || rollen.includes("PH Geschaeftsfuehrung");
  const stb = rollen.includes("PH Buchhaltung extern") && !admin && !rollen.some((r) => /^PH Faktura /.test(r));
  const leitung = admin || darf(session, "faktura", "cancel");
  const schreibt = darf(session, "faktura", "write");
  const liest = darf(session, "faktura", "read");
  const exp = darf(session, "faktura", "export");
  return {
    liest,
    schreibt,
    leitung,
    gf,
    stb,
    admin,
    export: exp,
    darfBank: leitung || gf || stb,
    darfCsv: leitung,
    // Einkauf/Marge/notiz_intern (permlevel 1): Leitung und Geschäftsführung, nie StB (F-16)
    permlevel1: (leitung || gf) && !stb,
  };
}

/** Felder, die für die Rolle vor der Serialisierung entfernt werden (F-16, R-17). */
export const NIE_FUER_STB = ["notiz_intern", "unterschrift_kunde", "ip_hash"];
export const PERMLEVEL1 = ["notiz_intern", "einkauf_cent"];

/** Entfernt interne Felder (auch in Positionen) je nach Rolle. Gibt eine Kopie zurück. */
export function bereinige(doc, rolle) {
  if (!doc || typeof doc !== "object") return doc;
  const out = { ...doc };
  const weg = new Set([...(rolle?.stb ? NIE_FUER_STB : []), ...(rolle?.permlevel1 ? [] : PERMLEVEL1), "ip_hash"]);
  for (const f of weg) delete out[f];
  if (Array.isArray(out.positionen)) out.positionen = out.positionen.map((p) => (rolle?.permlevel1 ? p : (({ einkauf_cent: _e, ...r }) => r)(p)));
  return out;
}
