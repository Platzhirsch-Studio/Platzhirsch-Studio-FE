// Kassa – Zugang zum Kiosk-Arbeitsplatz (Team B-KAS). Reines Modul.
import { erlaubteArbeitsplaetze } from "../auth/rechte.js";

/** Darf die Sitzung den Arbeitsplatz Kassa öffnen? (Knopf „Kassa öffnen“, AnDieKassa) */
export function darfAnDieKassa(session) {
  return erlaubteArbeitsplaetze(session?.roles || []).some((a) => a.slug === "kassa");
}
