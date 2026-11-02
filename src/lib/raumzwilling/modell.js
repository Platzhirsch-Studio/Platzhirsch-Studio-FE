// src/lib/raumzwilling/modell.js — Datensatz eines Raum-Zwillings (rein).
import { RAUM_CONFIG } from "./config.js";

export function loeschdatum(abIso = new Date().toISOString(), tage = RAUM_CONFIG.retentionDays) {
  const d = new Date(abIso);
  d.setUTCDate(d.getUTCDate() + tage);
  return d.toISOString();
}

export function neuerRaum({ projektId, customerId, titel, jetzt = new Date().toISOString() }) {
  return {
    version: 1,
    projektId,
    customerId,
    titel: titel || "Ihr Raum",
    status: "aufnahme-offen",
    quelle: null,
    kennzeichnung: null,
    erstellt: jetzt,
    aktualisiert: jetzt,
    einwilligung: null,
    loeschenAm: loeschdatum(jetzt),
    video: null,
    qualitaet: null,
    job: null,
    splat: null,
    transform: null,
    massstab: null,
    grundriss: null,
    standbilder: [],
    standpunkte: [],
    platzierung: { version: 1, volumen: [] },
    skizzen: [],
    kommentare: [],
    links: [],
  };
}

/** Nach dem Löschknopf bleibt nur der leere Rahmen (Projekt-Zuordnung, Zeitpunkt). */
export function geleerterRaum(raum, jetzt = new Date().toISOString()) {
  return { ...neuerRaum({ projektId: raum.projektId, customerId: raum.customerId, titel: raum.titel, jetzt }), geloeschtAm: jetzt };
}

/** Ist die Löschfrist abgelaufen? (Job-Runner räumt dann auf.) */
export const fristAbgelaufen = (raum, jetzt = Date.now()) => Boolean(raum?.loeschenAm) && Date.parse(raum.loeschenAm) < jetzt;

export function kommentarId(zufall = Math.random) {
  let s = "";
  while (s.length < 12) s += Math.floor(zufall() * 36).toString(36);
  return `k-${s}`;
}
