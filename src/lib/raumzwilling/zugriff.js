// src/lib/raumzwilling/zugriff.js — Wer darf was am Raum? (rein, getestet)
//
//   team   Team-Cookie (team.js): alles, auch Maßstab, Volumen, Skizze, Link
//   kunde  Portal-Session UND das Projekt gehört diesem Kunden UND der Raum
//          ist diesem Kunden zugeordnet: ansehen, kommentieren, Video senden, löschen
//   gast   einmaliger Raum-Link (Fallback, wenn das Portal nicht live ist):
//          nur dieser eine Raum, ansehen und kommentieren, nicht löschen
//   –      sonst nichts: 401 (API) bzw. Weiterleitung zum Login (Seite)

export const RECHTE = Object.freeze({
  team: ["ansehen", "kommentieren", "bearbeiten", "loeschen", "teilen", "video"],
  kunde: ["ansehen", "kommentieren", "video", "loeschen"],
  gast: ["ansehen", "kommentieren"],
});

/**
 * @param {{ team?:object|null, kundeId?:string|null, projektDesKunden?:boolean,
 *           link?:{projektId:string}|null, projektId:string, raum?:{customerId?:string}|null }} e
 * @returns {{ rolle:"team"|"kunde"|"gast", rechte:string[] } | { rolle:null, status:401|404 }}
 */
export function entscheideZugriff(e) {
  if (e.team) return { rolle: "team", rechte: RECHTE.team };
  if (e.kundeId && e.projektDesKunden) {
    // Ein Raum gehört genau einem Kunden. Fehlt der Datensatz noch, darf der
    // Kunde des Projekts ihn anlegen (Video senden).
    if (!e.raum || e.raum.customerId === e.kundeId) return { rolle: "kunde", rechte: RECHTE.kunde };
    return { rolle: null, status: 404 };
  }
  if (e.kundeId && !e.projektDesKunden) return { rolle: null, status: 404 };
  if (e.link && e.link.projektId === e.projektId && e.raum) return { rolle: "gast", rechte: RECHTE.gast };
  return { rolle: null, status: 401 };
}

export const darf = (zugriff, recht) => Boolean(zugriff?.rechte?.includes(recht));

/** Was der Browser vom Raum sehen darf (keine Besitzer-ID, keine Link-Hashes). */
export function oeffentlicheSicht(raum, rolle) {
  if (!raum) return null;
  const { customerId: _c, links: _l, video, job, ...rest } = raum;
  const sicht = {
    ...rest,
    video: video ? { name: rolle === "team" ? video.name : undefined, bytes: video.bytes, dauer: video.dauer, empfangen: video.empfangen, geloescht: video.geloescht || false } : null,
    job: job ? { status: job.status, gestartet: job.gestartet, beendet: job.beendet, minuten: job.minuten } : null,
  };
  if (rolle !== "team") delete sicht.massstab?.punkte;
  return sicht;
}
