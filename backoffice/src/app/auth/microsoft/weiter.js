// Gemeinsame Helfer der Microsoft-Route-Handler (kein Route-Segment, nur Modul).

/** 303-Weiterleitung, nie gecacht. Relative Ziele bleiben relativ (hinter dem Reverse-Proxy korrekt). */
export function weiter(ziel) {
  return new Response(null, { status: 303, headers: { Location: ziel, "Cache-Control": "no-store" } });
}

export function loginFehler(msCode) {
  return weiter(`/login?ms_fehler=${encodeURIComponent(msCode || "technik")}`);
}
