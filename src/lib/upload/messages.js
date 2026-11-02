// src/lib/upload/messages.js — German texts for every error code the upload
// API can return (the upload page is DE only). Client and server; no imports,
// so node --test checks that no code ends up as "Upload fehlgeschlagen."
// (tests/unit/upload-messages.test.mjs).

const TYPE_HINT = "Nur Fotos, Videos und PDF möglich.";

export const UPLOAD_ERRORS = {
  too_large: "Datei ist zu groß.",
  quota_exceeded: "Das Speicherlimit für diesen Link ist erreicht.",
  too_many_files: "Die maximale Anzahl Dateien ist erreicht.",
  unsupported_type: TYPE_HINT,
  bad_category: TYPE_HINT,
  consent_required: "Bitte zuerst die Einwilligung bestätigen.",
  expired: "Dieser Upload-Link ist abgelaufen.",
  invalid: "Dieser Upload-Link ist ungültig.",
  demo_disabled: "Demo-Uploads sind auf dieser Umgebung abgeschaltet.",
  storage_full: "Der Upload ist gerade nicht möglich – bitte später erneut versuchen.",
  rate_limited: "Zu viele Versuche in kurzer Zeit – bitte in ein paar Minuten erneut versuchen.",
  daily_limit: "Heute sind keine weiteren Uploads möglich – bitte morgen erneut versuchen.",
  file_not_found: "Die Datei ist nicht mehr auf dem Server – bitte erneut auswählen.",
  bad_index: "Übertragungsfehler – bitte erneut versuchen.",
  bad_chunk_size: "Übertragungsfehler – bitte erneut versuchen.",
  bad_request: "Die Anfrage war unvollständig – bitte Seite neu laden.",
  network: "Verbindung unterbrochen.",
  server_error: "Serverfehler – bitte später erneut versuchen.",
};

/** Codes after which this link cannot take any more files. */
export const LINK_ERRORS = new Set(["expired", "invalid", "demo_disabled"]);

export const FALLBACK_ERROR = "Upload fehlgeschlagen – bitte erneut versuchen.";

export function uploadErrorText(code) {
  return (typeof code === "string" && Object.hasOwn(UPLOAD_ERRORS, code) && UPLOAD_ERRORS[code]) || FALLBACK_ERROR;
}

// ---- Handoff card (components/Upload/UploadHandoff.js) -------------------
// Why no upload link could be made → what the card says.
export const HANDOFF_REASONS = {
  no_ticket: null, // normal case without ticket: only the e-mail way
  rate_limited: "Gerade werden sehr viele Upload-Links erstellt. Bitte versuchen Sie es in einigen Minuten erneut",
  daily_limit: "Heute können wir keine weiteren Upload-Links erstellen",
  storage_full: "Der Upload ist gerade nicht möglich",
  ticket_expired: "Der Upload-Link konnte nicht mehr erstellt werden, weil seit dem Absenden zu viel Zeit vergangen ist",
  network: "Keine Verbindung – der Upload-Link konnte nicht geladen werden",
  // QA R2 P1: a slow server (no answer within the time limit) is not "no connection".
  timeout: "Die Erstellung des Upload-Links dauert gerade länger als üblich. Bitte versuchen Sie es gleich noch einmal",
  server: "Der Upload-Link konnte gerade nicht erstellt werden",
};
/** Reasons that get an "Erneut versuchen" button. */
export const HANDOFF_RETRYABLE = new Set(["network", "server", "rate_limited", "timeout"]);
// Automatic attempts: up to 4 requests (1 + 3 retries), all with the same
// ticket. Waiting time per attempt grows (a dev compile or a cold start can
// take longer than 20 s); after ~75 s in total the card gives up and offers
// "Erneut versuchen".
export const HANDOFF_ATTEMPTS = [
  { delay: 0, timeout: 20000 },
  { delay: 800, timeout: 30000 },
  { delay: 2000, timeout: 30000 },
  { delay: 4000, timeout: 30000 },
];
export const HANDOFF_MAX_WAIT_MS = 75000;
/** Reasons the card retries on its own (same ticket = same link). */
export const HANDOFF_AUTO_RETRY = new Set(["network", "server", "timeout"]);

/** Fetch error → reason: the timeout signal ("TimeoutError"/"AbortError") means a slow server, anything else no connection. */
export function linkFailureReason(error) {
  return error && (error.name === "TimeoutError" || error.name === "AbortError") ? "timeout" : "network";
}
