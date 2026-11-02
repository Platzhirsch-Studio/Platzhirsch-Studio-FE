// src/lib/agent/card.js – Texte der MCP Server Card (/.well-known/mcp.json).
// Rein (relative Imports), testbar mit node --test (tests/unit/r7-p5-*.test.mjs).
import { APPOINTMENT_OFFERED } from "./tools.js";

// Runde 2 (recht P1-3, seo P1-4): der Terminwunsch steht nur in der
// Beschreibung, wenn request_appointment angeboten wird – derselbe Schalter wie
// instructionsFor() in jsonrpc.js und tools/list. In Produktion ist er heute
// aus (PRIVACY_TEXT_APPROVED=false); die Datenschutzerklärung sagt dasselbe.
export function cardDescription(appointment = APPOINTMENT_OFFERED) {
  return appointment
    ? "Katalog, Showroom mit Café in Lochau am Bodensee, Arbeitsweise (Handzeichnung, Raummodell, 3D-Planung, Rendering), Ezarri-Glasmosaik und Terminwunsch mit Double-Opt-in. Preise auf Anfrage."
    : "Katalog, Showroom mit Café in Lochau am Bodensee, Arbeitsweise (Handzeichnung, Raummodell, 3D-Planung, Rendering) und Ezarri-Glasmosaik; Termin über die Terminanfrage auf der Website. Preise auf Anfrage.";
}
