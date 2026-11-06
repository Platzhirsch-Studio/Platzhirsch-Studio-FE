// Reine Logik für useAutosave (MASTER G-09, Q-D1; Team P0-5b) – ohne React, testbar mit node --test.
// Zustände: "gespeichert" (mit Zeit) | "nicht-gespeichert" | "speichert" | "fehler".

export const AUTOSAVE_VERZOEGERUNG = 1000;
export const AUTOSAVE_ZUSTAENDE = ["gespeichert", "nicht-gespeichert", "speichert", "fehler"];

/** Uhrzeit „14:05“ (Wiener Zeit, 24 h). */
export function uhrzeit(d = new Date()) {
  const datum = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(datum.getTime())) return "";
  return datum.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Vienna" });
}

/**
 * Zustandsübergang.
 * @param {{status:string, zeit:string|null, fehler:string|null, offen:boolean}} z
 * @param {{typ:"aendern"|"start"|"ok"|"fehler"|"verwerfen", zeit?:string, fehler?:string}} e
 */
export function autosaveSchritt(z, e) {
  const s = z || { status: "gespeichert", zeit: null, fehler: null, offen: false };
  switch (e?.typ) {
    case "aendern":
      // Während des Speicherns bleibt „speichert“ sichtbar, die Änderung wird danach nachgeholt.
      return { ...s, status: s.status === "speichert" ? "speichert" : "nicht-gespeichert", offen: true };
    case "start":
      return { ...s, status: "speichert", offen: false, fehler: null };
    case "ok":
      return s.offen ? { ...s, status: "nicht-gespeichert", zeit: e.zeit ?? s.zeit, fehler: null } : { ...s, status: "gespeichert", zeit: e.zeit ?? s.zeit, fehler: null };
    case "fehler":
      return { ...s, status: "fehler", fehler: e.fehler || null, offen: true };
    case "verwerfen":
      return { ...s, status: "gespeichert", fehler: null, offen: false };
    default:
      return s;
  }
}

/** Anzeige im Kopf/der Leiste: { text, ton } – ton "ruhig" | "warnung" | "fehler". */
export function speicherAnzeige(z, texte) {
  const t = texte || {
    gespeichert: (zeit) => (zeit ? `Gespeichert ${zeit}` : "Gespeichert"),
    nichtGespeichert: "Nicht gespeichert",
    speichert: "Speichert …",
    fehler: "Nicht gespeichert – erneut versuchen",
  };
  switch (z?.status) {
    case "speichert":
      return { text: t.speichert, ton: "ruhig" };
    case "nicht-gespeichert":
      return { text: t.nichtGespeichert, ton: "warnung" };
    case "fehler":
      return { text: z.fehler ? `${t.nichtGespeichert} – ${z.fehler}` : t.fehler, ton: "fehler" };
    default:
      return { text: t.gespeichert(z?.zeit || null), ton: "ruhig" };
  }
}

/** Ergebnis einer Speicher-Funktion deuten: undefined/true/{ok:true} = gut, sonst Fehlertext. */
export function deuteErgebnis(r) {
  if (r === undefined || r === null || r === true) return { ok: true };
  if (r === false) return { ok: false, fehler: null };
  if (typeof r === "object" && "ok" in r) return r.ok ? { ok: true } : { ok: false, fehler: r.message || null };
  return { ok: true };
}
