// Sofaplaner-E2E: Konsolen- und Seitenfehler wie collectConsoleErrors, mit genau
// EINER dokumentierten Ausnahme (QM Restliste P2-3, 28.10.2026):
//
//   pageerror „Internal Next.js error: Router action dispatched before initialization.“
//   – nur wenn der Stack aus dem Dev-HMR-Client stammt (processMessage → hmrRefresh).
//
// Ursache (reproduziert mit qa-screenshots/feinschliff/sofaplaner/fix2/probe-rsc-hmr.mjs):
// Ändert ein paralleler Workflow eine Server-Komponente, schickt der geteilte
// Dev-Server „serverComponentChanges“. Trifft die Nachricht ein, solange die Seite
// noch hydriert, ruft Nexts HMR-Client publicAppRouterInstance.hmrRefresh() vor der
// Router-Initialisierung auf. Das ist Next-intern und nur im Dev-Betrieb, nicht der
// Sofaplaner (er nutzt keinen Router). Jeder andere Fehler, auch dieselbe Meldung
// mit anderem Stack, bleibt rot.
// Entfernen, sobald Integrator/Next das behebt oder die Tests gegen den Preview-Build laufen.
import { collectConsoleErrors } from "./helpers.js";

const ROUTER_RACE = /Router action dispatched before initialization/;
const FROM_HMR = (stack) => /\bhmrRefresh\b/.test(stack) && /\bprocessMessage\b/.test(stack);

export function collectSofaplanerErrors(page) {
  const errors = collectConsoleErrors(page);
  // registered after collectConsoleErrors → runs after its pageerror listener
  page.on("pageerror", (err) => {
    if (!ROUTER_RACE.test(String(err)) || !FROM_HMR(String(err.stack || ""))) return;
    const entry = `pageerror: ${String(err).slice(0, 400)}`;
    const i = errors.lastIndexOf(entry);
    if (i >= 0) errors.splice(i, 1);
  });
  return errors;
}

// R7-P4 (Release-Rat R2, neuland P0-1): Ohne MINOTTI_DATA_CONSENT plant die Seite mit den
// eigenen Sofa-Typen (src/lib/sofaplaner/neutral-data.js). Die Specs öffnen dann den
// neutralen Standardtyp statt Connery; Prüfungen, die nur mit Minotti-Daten Sinn ergeben
// (Herstellercodes, Bezugskollektionen, 90 Familien), werden mit Begründung übersprungen.
export { MINOTTI_DATA_CONSENT } from "../../src/lib/sofaplaner/consent.js";
import { MINOTTI_DATA_CONSENT as CONSENT } from "../../src/lib/sofaplaner/consent.js";
export const SOFA_FAMILY = CONSENT ? "connery" : "typ-lounge";
export const NO_MINOTTI_REASON = "Ohne MINOTTI_DATA_CONSENT keine Minotti-Daten (R2 neuland P0-1) – Prüfung gilt nur für den Minotti-Katalog";
