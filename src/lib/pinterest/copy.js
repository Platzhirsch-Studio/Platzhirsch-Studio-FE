// src/lib/pinterest/copy.js — Platzhalter-Ersetzung für die Texte von
// „Merken auf Pinterest“ und Ideenboard.
// Die Texte selbst stehen seit 29.10.2026 (Nachbessern) NUR in
// src/messages/<locale>.json unter `pinterest.*` und `ideenboard.*` (eine
// Quelle). Lesen: Insel/Server-Komponente usePinCopy() (./useCopy.js),
// async Server getPinCopy(locale) (./copyServer.js).
// Platzhalter in {geschweiften Klammern}, ersetzt mit fmt() – bewusst ohne
// ICU, damit „l’…“ und Anführungszeichen unverändert bleiben. Keine Importe.

export function fmt(text, vars = {}) {
  return String(text ?? "").replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}
