// Server-Verteiler des Kundendisplay-Kanals (Team P0-6): letzte Nachricht je Kasse + Abonnenten (SSE).
// Im Prozess-Speicher (globalThis) – genügt für einen Backoffice-Dienst. Bei mehreren Instanzen hinter dem
// Proxy muss der Verteiler auf Redis Pub/Sub umziehen (Session-Store von P0-8 ist Redis-fertig) – offen.
// Rein serverseitig; nie im Browser importieren.

import { bereinige, kasseGueltig } from "./protokoll.js";

const G = globalThis;
function speicher() {
  if (!G.__phBoKassenKanal) G.__phBoKassenKanal = new Map();
  return G.__phBoKassenKanal;
}

function eintrag(kasse) {
  const s = speicher();
  if (!s.has(kasse)) s.set(kasse, { letzte: null, seq: 0, abos: new Set() });
  return s.get(kasse);
}

/**
 * Nachricht veröffentlichen (bereinigt, mit fortlaufender seq).
 * @returns {object|null} die verteilte Nachricht
 */
export function veroeffentliche(kasse, roh, { anrede = "aus" } = {}) {
  if (!kasseGueltig(kasse)) return null;
  const e = eintrag(kasse);
  const n = bereinige(roh, { anrede, seq: e.seq + 1 });
  if (!n) return null;
  e.seq = n.seq;
  e.letzte = n;
  for (const fn of e.abos) {
    try {
      fn(n);
    } catch {
      // ein defekter Abonnent stört die anderen nicht
    }
  }
  return n;
}

/** Abonnieren; liefert die Abmelde-Funktion. */
export function abonniere(kasse, fn) {
  if (!kasseGueltig(kasse)) return () => {};
  const e = eintrag(kasse);
  e.abos.add(fn);
  return () => e.abos.delete(fn);
}

/** Letzte Nachricht (für neue Verbindungen und Polling). */
export function letzte(kasse) {
  return kasseGueltig(kasse) ? eintrag(kasse).letzte : null;
}

/** Nur für Tests. */
export function _leeren() {
  speicher().clear();
}
