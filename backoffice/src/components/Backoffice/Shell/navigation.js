// Aktiver Bereich und aktiver Unterbereich aus der Route (Shell v2: Leiste + Pillen-Reiter).
// Rein und browsertauglich (Unit-Test). Regel: der längste passende Navigations-Eintrag gewinnt
// (z. B. /d/ph-aufgabe → Zentrale „Meine Aufgaben“, /d/ph-anfrage/… → CRM „Anfrage“); bei Gleichstand
// der Bereich, der in der Leiste zuerst steht. Ohne Treffer: Zentrale (Hilfe, Gerät, Kein Zugriff).

function ohneQuery(href) {
  return String(href || "").split(/[?#]/)[0] || "/";
}

/** Passt eine Navigations-Adresse auf die Route? Liefert die Länge (Spezifität) oder -1. */
export function passung(href, pfad) {
  const h = ohneQuery(href);
  const p = ohneQuery(pfad);
  if (h === "/") return p === "/" ? 1 : -1;
  if (p === h || p.startsWith(`${h}/`)) return h.length;
  return -1;
}

/**
 * @param {Array<{slug:string, startseite:string, navigation:Array<{href:string}>}>} bereiche
 * @param {string} pfad
 * @returns {{bereich:string|null, eintrag:string|null}} slug des Bereichs und href des aktiven Unterbereichs
 */
export function aktiveNavigation(bereiche = [], pfad = "/") {
  let best = { bereich: null, eintrag: null, wert: -1 };
  for (const b of bereiche) {
    for (const n of [{ href: b.startseite }, ...(b.navigation || [])]) {
      const w = passung(n.href, pfad);
      if (w > best.wert) best = { bereich: b.slug, eintrag: n.href === b.startseite && !(b.navigation || []).some((x) => x.href === n.href) ? null : n.href, wert: w };
    }
  }
  if (best.bereich) return { bereich: best.bereich, eintrag: best.eintrag };
  const zentrale = bereiche.find((b) => b.slug === "zentrale");
  return { bereich: zentrale ? "zentrale" : null, eintrag: null };
}

/** Reiter aufteilen: höchstens `max` sichtbar, der aktive immer sichtbar, Rest unter „Mehr“ (Q-B3). */
export function teileReiter(navigation = [], aktivHref = null, max = 6) {
  if (navigation.length <= max) return { sichtbar: navigation, mehr: [] };
  const sichtbar = navigation.slice(0, max - 1);
  const rest = navigation.slice(max - 1);
  const aktivImRest = rest.find((n) => n.href === aktivHref);
  if (aktivImRest) {
    return { sichtbar: [...sichtbar, aktivImRest], mehr: rest.filter((n) => n !== aktivImRest) };
  }
  return { sichtbar, mehr: rest };
}
