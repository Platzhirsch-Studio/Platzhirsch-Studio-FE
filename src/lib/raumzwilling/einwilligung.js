// src/lib/raumzwilling/einwilligung.js — Einwilligungstexte (Browser + Server).
// Wohnräume sind sensible Daten (sie zeigen Lebensumstände). Deshalb eine
// eigene, ausdrückliche Einwilligung beim Raumvideo, getrennt vom normalen
// Upload. Der Abschnitt für die Datenschutzerklärung ist ein VORSCHLAG an
// Recht (Marktresearch/recht/vorschlag-raumzwilling-datenschutz.md) und geht
// erst nach anwaltlicher Freigabe live.
import { RAUM_CONFIG } from "./config.js";

export const CONSENT_TEXT_VERSION = RAUM_CONFIG.consentVersion;

// The period the code really applies (modell.js loeschdatum). Not yet
// confirmed by the owner (RAUM_CONFIG.retentionConfirmed); a customer text
// never carries a bracket placeholder (r1-recht-inhalt P0-4), so it states
// the value that is in force, and a changed decision changes it here.
const frist = `${RAUM_CONFIG.retentionDays} Tage nach dem letzten Upload`;

export const EINWILLIGUNG_KURZ =
  "Ich willige ein, dass Platzhirsch Home Living mein Raumvideo verarbeitet, um daraus einen 3D-Raum für die Planung meines Projekts zu erstellen.";

export const EINWILLIGUNG_DETAILS = [
  "Zweck: Vorbereitung Ihrer Einrichtungsplanung (Raum, Maße, Planung, Handskizze). Keine Werbung, keine Weitergabe, keine Verwendung als Referenz ohne neue Einwilligung.",
  "Verarbeitung: ausschließlich auf einem Rechner im Studio in Lochau, nicht in einer fremden Cloud. Ortsangaben (GPS) im Video werden entfernt.",
  "Sichtbar: nur für Sie im Kundenportal und für Ihr Beratungsteam.",
  `Speicherdauer: Das Originalvideo wird nach der Verarbeitung gelöscht. 3D-Raum, Standbilder und Kommentare löschen wir ${frist}, außer sie werden für Ihren Auftrag gebraucht.`,
  "Widerruf: jederzeit mit dem Knopf „Raum löschen“ im Portal oder per E-Mail an info@platzhirsch.studio. Die Rechtmäßigkeit der Verarbeitung bis zum Widerruf bleibt unberührt.",
  "Bitte filmen Sie keine anderen Personen, Ausweise, Dokumente oder Bildschirme.",
];

export const MASS_HAFTUNG =
  "Maße aus dem Video sind eine Planungshilfe. Vor jeder Bestellung messen wir vor Ort nach (Aufmaß).";

export const LOESCHEN_TEXT =
  "Löscht 3D-Raum, Standbilder, Haralds Skizzen in diesem Raum, alle Kommentare und Sprachnachrichten. Das Projekt selbst bleibt bestehen. Das lässt sich nicht rückgängig machen.";
