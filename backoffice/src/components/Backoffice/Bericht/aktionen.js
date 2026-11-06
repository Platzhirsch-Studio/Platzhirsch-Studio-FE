"use server";
// Server Action der BerichtSeite (G-13, Team P0-5b): CSV-Export nur mit Export-Recht, protokolliert.
// Gleicher Pfad im Mock und mit Frappe (es wird nichts an Frappe geschrieben): Prüfung der Sitzung und des
// Rechts im Bereich, Protokollzeile im Server-Log (Benutzer, Bericht, Zeilenzahl, Zeitpunkt). Wirft nie (Q-A2).

import { requireSession } from "@/lib/backoffice/auth/dal";
import { darf } from "@/lib/backoffice/auth/rechte";
import { BERICHT } from "./texte";

const ID = /^[a-z0-9-]{1,60}$/;

/**
 * @param {{bericht:string, bereich:string, zeilen:number}} p
 * @returns {Promise<{ok:boolean, code?:string, message?:string}>}
 */
export async function berichtExportAction({ bericht, bereich, zeilen } = {}) {
  const session = await requireSession();
  if (!ID.test(String(bericht || "")) || !ID.test(String(bereich || ""))) return { ok: false, code: "invalid", message: BERICHT.exportVerboten };
  if (!darf(session, bereich, "export")) return { ok: false, code: "forbidden", message: BERICHT.exportVerboten };
  const n = Number.isFinite(Number(zeilen)) ? Math.max(0, Math.floor(Number(zeilen))) : 0;
  console.info(`[bericht-export] ${new Date().toISOString()} ${session.user} ${bereich}/${bericht} ${n} Zeilen`);
  return { ok: true };
}
