// Kundenmodus (G-20, Team P0-7) – öffentliche Bausteine.
//   <KundenmodusKnopf />          startet die Kundensicht (Kopfzeilen-Slot oder Akte)
//   <NurIntern>…</NurIntern>      Inhalt, den Kunden nie sehen (server- und client-tauglich)
//   useKundenmodus()              { an, starten, beenden, pinNoetig } (nur unter der Shell)
//   istKundenmodus()              ohne Hook (z. B. Toast: fremde Meldungen unterdrücken)
//   <BedienerRueckkehr>           Langdruck 800 ms + PIN beendet (in der Shell an der Wortmarke)
export { KundenmodusProvider, useKundenmodus, istKundenmodus, KUNDENMODUS_ATTRIBUT, KUNDENMODUS_EREIGNIS } from "./Kontext";
export { default as KundenmodusKnopf } from "./KundenmodusKnopf";
export { default as BedienerRueckkehr, LANGDRUCK_MS } from "./BedienerRueckkehr";
export { default as NurIntern } from "./NurIntern";
