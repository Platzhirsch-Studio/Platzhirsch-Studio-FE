// QM planer-tools r2: Das Nachscrollen bei Fokus unter einer festen Leiste darf
// nur bei echtem Tastaturfokus auf ein Bedienelement greifen. Safari (iOS)
// fokussiert beim Antippen keinen Knopf; der Fokus fällt dann auf
// <main tabIndex=-1> oder ein Panel – ein Nachscrollen ließe die Seite springen.
export function isKeyboardFocusTarget(t) {
  if (!t || typeof t.matches !== "function") return false;
  const tag = String(t.tagName || "").toUpperCase();
  if (tag === "BODY" || tag === "HTML" || tag === "MAIN") return false;
  // programmatisch fokussierte Container (Panels, Überschriften, Live-Regionen)
  if (t.getAttribute?.("tabindex") === "-1") return false;
  try {
    return t.matches(":focus-visible");
  } catch {
    // sehr altes WebKit ohne :focus-visible: nur Formularfelder sicher behandeln
    return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
  }
}
