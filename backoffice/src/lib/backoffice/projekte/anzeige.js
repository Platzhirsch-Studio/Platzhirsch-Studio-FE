// Anzeige-Helfer (Datum relativ, Fortschritt) für den Bereich Projekte. Reines Modul (Server und Client).

import { PHASEN } from "./texte.js";
import { PHASE_GRAD } from "./kalkulation.js";

const WT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const ISO = (d) => String(d || "").slice(0, 10);

/** „heute 08:00“ · „morgen 09:00“ · „Mo 17.11.“ · „17.11.2027“. */
export function terminText(start, heute, { mitZeit = true } = {}) {
  const tag = ISO(start);
  if (!tag) return "";
  const zeit = mitZeit && /\d{2}:\d{2}/.test(String(start).slice(11)) && String(start).slice(11, 16) !== "00:00" ? ` ${String(start).slice(11, 16)}` : "";
  const d = new Date(`${tag}T12:00:00`);
  const h = new Date(`${ISO(heute)}T12:00:00`);
  const diff = Math.round((d - h) / 86400000);
  if (diff === 0) return `heute${zeit}`;
  if (diff === 1) return `morgen${zeit}`;
  if (diff === -1) return `gestern${zeit}`;
  const [j, m, t] = tag.split("-");
  if (Math.abs(diff) < 180) return `${WT[d.getDay()]} ${t}.${m}.${zeit}`;
  return `${t}.${m}.${j}`;
}

/** Datum kurz „17.11.“ oder mit Jahr. */
export function datumKurz(d, { jahr = false } = {}) {
  const s = ISO(d);
  if (!s) return "";
  const [j, m, t] = s.split("-");
  return jahr ? `${t}.${m}.${j}` : `${t}.${m}.`;
}

/** Grundwert des Fertigstellungsgrads je Phase (ph_projekte utils/kalkulation.PHASE_GRAD) – für Listen ohne Positionsdaten. */
export function phasenFortschritt(status) {
  return PHASE_GRAD[status] ?? 0;
}

/** Punkte der Phasen-Mini: [{z: erledigt|aktuell|offen|abbruch}] × 9. */
export function phasenPunkte(status) {
  const i = PHASEN.indexOf(status);
  if (status === "Abgebrochen") return PHASEN.map((_, k) => ({ z: k === PHASEN.length - 1 ? "abbruch" : "offen" }));
  return PHASEN.map((_, k) => ({ z: k < i ? "erledigt" : k === i ? (status === "Abgeschlossen" ? "erledigt" : "aktuell") : "offen" }));
}

/** Deutscher Tagestitel „Mittwoch, 4. November“. */
export function tagTitel(iso) {
  const d = new Date(`${ISO(iso)}T12:00:00`);
  return new Intl.DateTimeFormat("de-AT", { weekday: "long", day: "numeric", month: "long" }).format(d);
}

/** Cent → „148.600 €“ (ohne Nachkommastellen bei ganzen Euro). */
export function euroRund(cent) {
  const n = Number(cent || 0) / 100;
  const t = new Intl.NumberFormat("de-DE", { maximumFractionDigits: Number.isInteger(n) ? 0 : 2, minimumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(Math.abs(n));
  return `${n < 0 ? "−" : ""}${t} €`;
}

/** Prozent „35,2 %“ oder „–“. */
export function prozentText(p) {
  if (p === null || p === undefined || Number.isNaN(Number(p))) return "–";
  return `${Number(p).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`;
}
