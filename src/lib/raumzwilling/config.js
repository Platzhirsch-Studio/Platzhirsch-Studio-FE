// src/lib/raumzwilling/config.js
// N2 „Ihr Raum als Zwilling“: gemeinsame Werte für Browser UND Server (keine
// Node-Importe). Feature-Doku: Marktresearch/digital/features/neuland.md §3.
//
// Kette: Raumvideo (Handy, ≤ 300 MB / 120 s, Ortsangaben entfernt)
//   → interner Job tools/raumzwilling/run.mjs (lokal, RTX 4060, nie fremde Cloud)
//   → Qualitätsprüfung (dunkel/unscharf/zu schnell → Wiederholungsbitte)
//   → Splat (tools/splat aus N1) → SOG ≤ 30 MB
//   → Team: Maßstab (zwei Punkte oder A4), Boden, Volumen aus Katalogmaßen,
//     Haralds echte Handskizze
//   → Kunde: /de/portal/raum/<projekt> mit Ebenen Raum · Planung · Skizze.

const MB = 1024 * 1024;

export const RAUM_CONFIG = Object.freeze({
  basePath: "/de/portal/raum",
  apiPath: "/api/portal/raum",
  // Eingang: wie der vorhandene Handy-Upload (src/lib/upload/config.js, Kategorie video).
  video: {
    maxBytes: 300 * MB,
    maxSeconds: 120,
    minSeconds: 20,
    chunkBytes: 4 * MB,
    mimes: ["video/mp4", "video/quicktime", "video/webm", "video/3gpp"],
  },
  // Ergebnis des Jobs: Obergrenze des SOG-Bündels (Akzeptanz N2 §3.4.1).
  splatMaxBytes: 30 * MB,
  // Laufzeit-Erwartung je Raum auf der RTX 4060 (Schätzung, im Pilot messen).
  jobMinutes: { min: 20, max: 60 },
  // Löschfrist: wie die Upload-Retention (180 Tage, Platzhalter bis zur
  // Inhaber-Entscheidung). retentionConfirmed=false zeigt den Vermerk an.
  retentionDays: 180,
  retentionConfirmed: false,
  // Das Originalvideo wird nach erfolgreicher Verarbeitung gelöscht
  // (Datenminimierung). Es bleiben Splat, drei Standbilder und Grundriss.
  deleteVideoAfterJob: true,
  consentVersion: "2026-10-raum-v1",
  comment: { maxLength: 1000, voiceMaxBytes: 5 * MB, voiceMaxSeconds: 180 },
  placement: { maxVolumes: 40, maxRoomMeters: 40 },
  team: { sessionHours: 8 },
  shareLink: { ttlDays: 14 },
});

/** Neue Upload-Kategorie für den Handy-Upload (Integration: src/lib/upload/config.js). */
export const RAUMVIDEO_CATEGORY = Object.freeze({
  key: "raumvideo",
  label: "Raumvideo",
  labelPlural: "Raumvideos",
  maxBytes: RAUM_CONFIG.video.maxBytes,
  families: ["video"],
});

/** Aufnahmehilfe: drei Sätze plus Grafik (Komponente Aufnahmehilfe.js). */
export const AUFNAHMEHILFE = Object.freeze([
  { key: "langsam", title: "Langsam gehen", text: "Gehen Sie in etwa 90 Sekunden einmal langsam durch den Raum, das Handy quer und ruhig." },
  { key: "hoehen", title: "Drei Höhen", text: "Filmen Sie jede Wand auf Kniehöhe, auf Brusthöhe und über Kopf, mit etwas Überlappung." },
  { key: "licht", title: "Licht an, niemand im Bild", text: "Licht einschalten, Vorhänge öffnen. Bitte keine Personen, Ausweise oder Bildschirme filmen." },
]);

export const A4_HINWEIS =
  "Für genauere Maße: Legen Sie ein A4-Blatt flach auf den Boden und filmen Sie es kurz von oben. Wir nutzen es als Maßstab.";

export const MASS_HINWEIS = "Maße aus Video, Aufmaß vor Bestellung";

/** Status eines Raums (Job-Runner schreibt, Portal liest). */
export const RAUM_STATUS = Object.freeze({
  "aufnahme-offen": { label: "Wartet auf Ihr Raumvideo", tone: "neutral" },
  "in-arbeit": { label: "Wir bauen Ihren Raum", tone: "gold" },
  "bitte-wiederholen": { label: "Bitte noch einmal aufnehmen", tone: "neutral" },
  "nur-fotos": { label: "Fotos und Grundriss bereit", tone: "gold" },
  bereit: { label: "Ihr Raum ist bereit", tone: "gold" },
});
export const STATUS_KEYS = Object.keys(RAUM_STATUS);

// Qualitätsschwellen der Frame-Prüfung (tools/raumzwilling/run.mjs, lib/raumzwilling/qualitaet.js).
// Helligkeit: Mittel der Luma 0..255. Schärfe: Varianz des Laplace-Filters
// auf 480 px breiten Graustufen-Frames. Bewegung: mittlere absolute
// Differenz aufeinanderfolgender Frames (2 fps) in 0..255.
export const QUALITAET = Object.freeze({
  minHelligkeit: 45,
  minSchaerfe: 60,
  maxBewegung: 38,
  minAnteilGut: 0.6,
  minSekunden: 20,
  framesProSekunde: 2,
});

/** A4 nach ISO 216, in Metern. */
export const A4 = Object.freeze({ breite: 0.21, hoehe: 0.297 });

// Ebenen der Portal-Ansicht.
export const EBENEN = Object.freeze([
  { key: "raum", label: "Raum" },
  { key: "planung", label: "Planung" },
  { key: "skizze", label: "Skizze" },
]);

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < MB) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / MB).toFixed(bytes < 10 * MB ? 1 : 0).replace(".", ",")} MB`;
}

export const DATUM = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Vienna" });
export const DATUM_ZEIT = new Intl.DateTimeFormat("de-AT", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Vienna",
});
