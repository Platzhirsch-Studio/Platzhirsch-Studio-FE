// Eingabe-Bausteine (Team P0-6) – ein Einstieg für Bereiche.
// G-21 BetragFeld · G-22 ScanTor, ScanFeld, KameraScan · G-23 Unterschrift · G-30 FotoAufnahme.
// Server Actions liegen getrennt in ./aktionen.js („use server“).
export { default as BetragFeld } from "./BetragFeld";
export { default as ScanTor, useScanTor, useScanFeld, SCAN_EREIGNIS } from "./ScanTor";
export { default as ScanFeld } from "./ScanFeld";
export { default as KameraScan } from "./KameraScan";
export { default as Unterschrift } from "./Unterschrift";
export { default as FotoAufnahme } from "./FotoAufnahme";
export { parseBetrag, formatBetrag, parseMenge } from "./betrag";
