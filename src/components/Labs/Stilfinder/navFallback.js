// Stil-Finder: Sicherheitsnetz für den Sprung zum Ergebnis (QM planer-tools r4).
//
// Vorher lud ein fester 6-s-Timer die Ergebnisseite hart nach, auch wenn die
// Client-Navigation nur langsam war (Server rendert noch). Firefox/WebKit
// brachen dadurch den laufenden RSC-Abruf ab (NS_BINDING_ABORTED), Next fiel
// seinerseits auf eine Browser-Navigation zurück, und zwei Seitenwechsel
// liefen gegeneinander – die Seite blieb stehen oder landete wieder auf der
// Startseite des Stil-Finders.
//
// Jetzt: harte Navigation nur, wenn die Client-Navigation sichtbar NICHT mehr
// läuft (Transition nicht mehr pending) und die Adresse sich nicht geändert
// hat, oder als letztes Mittel nach HARD_LIMIT_MS. Nie, wenn der Browser die
// Seite bereits verlässt (Nexts eigener Rückfall läuft), und höchstens einmal.

export const FIRST_CHECK_MS = 6000;
export const RECHECK_MS = 2000;
export const HARD_LIMIT_MS = 30000;

/**
 * @param {{elapsed:number, pending:boolean, moved:boolean, leaving:boolean, done:boolean}} s
 * @returns {"stop"|"wait"|"assign"}
 */
export function navFallbackDecision({ elapsed, pending, moved, leaving, done }) {
  if (done || moved || leaving) return "stop";
  if (elapsed < FIRST_CHECK_MS) return "wait";
  if (!pending) return "assign";
  return elapsed >= HARD_LIMIT_MS ? "assign" : "wait";
}
