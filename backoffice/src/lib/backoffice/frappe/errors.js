// Fehlerbild des Backoffice. Jeder Fehler aus Mock oder Frappe wird auf einen
// kleinen Code abgebildet, den Seiten und Komponenten anzeigen können:
//   invalid | forbidden | not_found | conflict | rate_limited | unavailable | auth
// Reines Modul (testbar mit node --test).

export const FEHLER_CODES = ["invalid", "forbidden", "not_found", "conflict", "rate_limited", "unavailable", "auth"];

export class BackofficeError extends Error {
  /**
   * @param {string} code  einer aus FEHLER_CODES
   * @param {string} message  Text für den Benutzer (ohne HTML)
   * @param {{status?:number, detail?:any, cause?:Error, excType?:string}} [opts]
   */
  constructor(code, message, opts = {}) {
    super(message, opts.cause ? { cause: opts.cause } : undefined);
    this.name = "BackofficeError";
    this.code = FEHLER_CODES.includes(code) ? code : "unavailable";
    this.status = opts.status ?? statusFuerCode(this.code);
    this.detail = opts.detail;
    this.excType = opts.excType;
  }

  /** Serialisierbare Form für Server Actions / Route Handler. */
  toJSON() {
    return { code: this.code, message: this.message, status: this.status, excType: this.excType };
  }
}

export function statusFuerCode(code) {
  return { invalid: 400, auth: 401, forbidden: 403, not_found: 404, conflict: 409, rate_limited: 429, unavailable: 503 }[code] || 500;
}

export function istBackofficeError(err) {
  return err instanceof BackofficeError || (err && err.name === "BackofficeError" && typeof err.code === "string");
}

/** Frappe exc_type → Code. */
const EXC_TYPE_MAP = {
  ValidationError: "invalid",
  MandatoryError: "invalid",
  LinkValidationError: "invalid",
  InvalidStatusError: "invalid",
  DuplicateEntryError: "conflict",
  TimestampMismatchError: "conflict",
  DocstatusTransitionError: "conflict",
  UpdateAfterSubmitError: "conflict",
  PermissionError: "forbidden",
  DoesNotExistError: "not_found",
  AuthenticationError: "auth",
  CSRFTokenError: "auth",
  SessionExpired: "auth",
  TooManyRequestsError: "rate_limited",
  RateLimitExceededError: "rate_limited",
};

export function codeAusStatus(status) {
  if (status === 400 || status === 417 || status === 422) return "invalid";
  if (status === 401) return "auth";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 429) return "rate_limited";
  return "unavailable";
}

export function codeAusExcType(excType, status) {
  if (excType && EXC_TYPE_MAP[excType]) return EXC_TYPE_MAP[excType];
  return codeAusStatus(status);
}

/** Entfernt HTML-Tags und löst die häufigsten Entities auf. */
export function ohneHtml(text) {
  return String(text ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Frappe liefert Benutzertexte als `_server_messages`: ein JSON-String, der
 * ein Array von JSON-Strings enthält ({"message": "...", "title": ..., "indicator": ...}).
 * Gibt die Texte ohne HTML zurück; Fehler beim Parsen → leeres Array.
 */
export function serverMessages(raw) {
  if (!raw) return [];
  let outer = raw;
  try {
    if (typeof outer === "string") outer = JSON.parse(outer);
  } catch {
    return [ohneHtml(raw)].filter(Boolean);
  }
  if (!Array.isArray(outer)) outer = [outer];
  const out = [];
  for (const item of outer) {
    let m = item;
    try {
      if (typeof m === "string") m = JSON.parse(m);
    } catch {
      // Einzelne Nachricht ist bereits Klartext.
    }
    const text = typeof m === "object" && m !== null ? m.message ?? m.title ?? "" : m;
    const clean = ohneHtml(text);
    if (clean) out.push(clean);
  }
  return out;
}

const STANDARDTEXTE = {
  invalid: "Die Eingaben sind unvollständig oder ungültig.",
  auth: "Die Sitzung ist abgelaufen. Bitte neu anmelden.",
  forbidden: "Dafür fehlt die Berechtigung.",
  not_found: "Der Datensatz wurde nicht gefunden.",
  conflict: "Der Datensatz wurde zwischenzeitlich geändert. Bitte neu laden.",
  rate_limited: "Zu viele Anfragen. Bitte kurz warten.",
  unavailable: "Das Backoffice ist gerade nicht erreichbar.",
};

export function standardText(code) {
  return STANDARDTEXTE[code] || STANDARDTEXTE.unavailable;
}

/**
 * Baut aus einer Frappe-Antwort (HTTP-Status + geparster Body) einen BackofficeError.
 * @param {number} status
 * @param {any} body  geparstes JSON oder Text
 */
export function fehlerAusFrappe(status, body, fallbackText) {
  const excType = body && typeof body === "object" ? body.exc_type || body.exception?.split?.(":")?.[0]?.split(".").pop() : undefined;
  const code = codeAusExcType(excType, status);
  const texte = body && typeof body === "object" ? serverMessages(body._server_messages) : [];
  let message = texte.join(" ");
  if (!message && body && typeof body === "object" && typeof body.message === "string") message = ohneHtml(body.message);
  if (!message) message = fallbackText || standardText(code);
  return new BackofficeError(code, message, { status, excType, detail: body?._error_message });
}

/** Wandelt beliebige Fehler (Timeout, Netz, BackofficeError aus http.js) in einen BackofficeError. */
export function alsBackofficeError(err, fallbackText) {
  if (istBackofficeError(err) && err.code) return err;
  const name = err?.name || "";
  if (name === "TimeoutError" || name === "AbortError") {
    return new BackofficeError("unavailable", fallbackText || "Zeitüberschreitung beim Backoffice.", { cause: err });
  }
  if (name === "BackofficeError" && typeof err.status === "number") {
    // Fehler aus src/lib/api/http.js (critical: true)
    return new BackofficeError(codeAusStatus(err.status), fallbackText || standardText(codeAusStatus(err.status)), { status: err.status, cause: err });
  }
  return new BackofficeError("unavailable", fallbackText || standardText("unavailable"), { cause: err });
}
