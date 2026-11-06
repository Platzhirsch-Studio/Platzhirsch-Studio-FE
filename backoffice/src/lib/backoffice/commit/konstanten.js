// Gemeinsame Werte des verzögerten Commits (G-03) – browsertauglich (keine node:-Importe),
// genutzt von Server-Kern (kern.js) und Client-Queue (warteschlange.js).

export const COMMIT_MS = 8000;
export const COMMIT_MS_KIOSK = 6000;
export const COMMIT_MS_MIN = 1000;
export const COMMIT_MS_MAX = 60_000;
/** Nachlauf: so lange nach der Frist wartet der Server auf Bestätigung oder Verwerfen. */
export const NACHLAUF_MS = 30_000;
/** Höchstens so lange darf der Client den Timer anhalten (Hover/Fokus) – bleibt unter dem Nachlauf. */
export const PAUSE_MAX_MS = 20_000;
export const TOKENS_MAX = 20;
export const TOKEN_MUSTER = /^c_[A-Za-z0-9_-]{32}$/;
export const istToken = (t) => typeof t === "string" && TOKEN_MUSTER.test(t);

/** Objekt normalisieren: {doctype, name, titel?} | "PH Anfrage:AN-…" | null. */
export function normObjekt(o) {
  if (!o) return null;
  if (typeof o === "string") {
    const i = o.indexOf(":");
    return i > 0 ? { doctype: o.slice(0, i), name: o.slice(i + 1) } : { doctype: "", name: o };
  }
  if (typeof o === "object" && o.name) return { doctype: String(o.doctype || ""), name: String(o.name), ...(o.titel ? { titel: String(o.titel).slice(0, 120) } : {}) };
  return null;
}

/** Schlüssel eines Objekts für Queue/Ausstehend: „PH Anfrage:AN-2026-0012“. */
export function objektSchluessel(o) {
  const n = normObjekt(o);
  return n ? (n.doctype ? `${n.doctype}:${n.name}` : n.name) : null;
}
