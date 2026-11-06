// Reine Hilfen für die Service-Bausteine (ohne React).
import { tagMonat, relativTage } from "@/lib/backoffice/service/anzeige";

/** Fälligkeit kurz: „überfällig seit 03.11.“ · „heute“ · „bis 06.11.“ */
export function faelligKurz(faellig, heute = new Date()) {
  const r = relativTage(faellig, heute);
  if (r === "heute") return "fällig heute";
  if (r === "gestern" || r.startsWith("vor")) return `überfällig seit ${tagMonat(faellig)}`;
  return `bis ${tagMonat(faellig)}`;
}
