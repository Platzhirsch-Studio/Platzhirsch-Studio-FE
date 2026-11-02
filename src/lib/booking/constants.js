// src/lib/booking/constants.js – Grenzen des Online-Kalenders, ohne Node-Importe
// (auch im Browser-Bundle: SlotPicker, time.js). config.js exportiert sie weiter.
export const TIME_ZONE = "Europe/Vienna";
export const LEAD_HOURS = 24; // frühester Termin ab jetzt
export const HORIZON_DAYS = 60; // buchbar bis
export const SLOT_STEP_MIN = 30; // Raster der Startzeiten
export const MAX_RANGE_DAYS = 21; // Slots je Abfrage
// v2: Widerrufshinweis im Einwilligungstext (Art. 7 Abs. 3 DSGVO, QA Recht P2-1).
export const CONSENT_VERSION = "video-v2-2026-10-29";
export const VERIFY_TTL_MIN = 30; // Double-Opt-in: so lange hält eine unbestätigte Buchung die Uhrzeit
export const MEET_OPEN_MIN = 15; // Videoraum-Link erst ab so vielen Minuten vor Beginn (Spezifikation B4/B5)
