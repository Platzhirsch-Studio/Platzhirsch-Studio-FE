import "server-only";
// Zugang zu Shop-Seiten: Sitzung (sonst Login mit Rückweg), Bereichsrecht (sonst /kein-zugriff mit Rückweg).
import { redirect } from "next/navigation";
import { requireSession } from "../auth/dal.js";
import { darfSehen } from "./rechte.js";
import { shopKontext } from "./daten.js";

/**
 * @param {string} pfad   Rückweg nach dem Login
 * @param {(session:object)=>boolean} [pruefe]  zusätzliche Bedingung (z. B. Leitung)
 */
export async function zugang(pfad, pruefe) {
  const session = await requireSession(pfad);
  if (!darfSehen(session) || (pruefe && !pruefe(session))) redirect(`/kein-zugriff?bereich=shop&aktion=read`);
  return shopKontext(session);
}
