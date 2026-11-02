// Küchenplaner – Fehlertexte der Planungsanfrage (R2).
// Die Formular-Routen (/api/beratung_anfrage, src/lib/forms/guard.js + forward.js)
// antworten mit { success:false, code, error, field? }. `error` ist teils Englisch
// („Failed to submit form“) – angezeigt wird deshalb immer ein deutscher Text aus
// dem `code` (bzw. dem HTTP-Status, falls kein code kommt). Rein, ohne React,
// damit `node --test` die Zuordnung prüfen kann.

export const PHONE = "+43 5574 46255";

export const ERROR_TEXT = {
  rate_limited: "Zu viele Anfragen in kurzer Zeit. Bitte warten Sie einige Minuten und senden Sie dann erneut.",
  too_large: "Die Anfrage ist zu lang. Bitte kürzen Sie Ihre Nachricht etwas.",
  invalid: "Einige Angaben konnten nicht verarbeitet werden. Bitte prüfen Sie die markierten Felder.",
  timeout: "Unser System hat nicht rechtzeitig geantwortet. Ihre Anfrage ist möglicherweise nicht angekommen.",
  upstream: "Ihre Anfrage konnte gerade nicht übermittelt werden.",
  internal: "Ihre Anfrage konnte gerade nicht übermittelt werden.",
  network: "Keine Verbindung zum Server. Bitte prüfen Sie Ihre Internetverbindung.",
  unknown: "Ihre Anfrage konnte nicht gesendet werden.",
};

// Felder der Beratungs-Route → Felder des Küchenplaner-Formulars (nur die mit eigener Fehlerzeile)
const FIELD_MAP = { vorname: "vorname", nachname: "nachname", email: "email", telefon: "telefon" };

/** HTTP-Status → code, falls die Antwort keinen code mitbringt. */
export function codeFromStatus(status) {
  if (status === 429) return "rate_limited";
  if (status === 413) return "too_large";
  if (status === 400 || status === 422) return "invalid";
  if (status === 504 || status === 408) return "timeout";
  if (status >= 500) return "upstream";
  return "unknown";
}

/**
 * Antwort (oder Netzwerkfehler) → { code, message, field }.
 * @param {{ status?: number, body?: any, network?: boolean }} r
 */
export function describeRequestError({ status = 0, body = null, network = false } = {}) {
  const code = network ? "network" : ERROR_TEXT[body?.code] ? body.code : codeFromStatus(status);
  const field = code === "invalid" && typeof body?.field === "string" ? FIELD_MAP[body.field] || null : null;
  const retry = code === "rate_limited" || code === "too_large" || code === "invalid" ? "" : " Bitte versuchen Sie es erneut";
  const tail = retry ? `${retry} oder rufen Sie uns an: ${PHONE}.` : ` Sie erreichen uns auch telefonisch: ${PHONE}.`;
  return { code, field, message: `${ERROR_TEXT[code]}${tail}` };
}
