// Zeitangaben der Ablage (Q-A5): relativ nur < 24 h („heute 09:12“, „vor 12 min“), danach absolut.
// Reines Modul (Server und Client). Achtung Hydration: relative Angaben mit suppressHydrationWarning ausgeben.

import { MONATE_KURZ } from "@/lib/backoffice/ablage/texte";

function datum(w) {
  if (!w) return null;
  if (w instanceof Date) return w;
  const s = String(w).replace(" ", "T");
  const d = new Date(s.length === 10 ? `${s}T00:00:00` : s);
  return Number.isNaN(d.getTime()) ? null : d;
}
const p2 = (n) => String(n).padStart(2, "0");

/** 04.11.2026 */
export function datumKurz(w) {
  const d = datum(w);
  return d ? `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}` : "–";
}

/** 04.11.2026 14:05 */
export function datumZeit(w) {
  const d = datum(w);
  return d ? `${datumKurz(d)} ${p2(d.getHours())}:${p2(d.getMinutes())}` : "–";
}

/** „vor 12 min“, „heute 09:12“, „gestern 16:40“, „3. Nov.“, „3. Nov. 2025“ */
export function wann(w, jetzt = new Date()) {
  const d = datum(w);
  if (!d) return "–";
  const diff = (jetzt - d) / 60000;
  if (diff >= 0 && diff < 1) return "gerade eben";
  if (diff >= 0 && diff < 60) return `vor ${Math.round(diff)} min`;
  const tag = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const t = Math.round((tag(jetzt) - tag(d)) / 86_400_000);
  const uhr = `${p2(d.getHours())}:${p2(d.getMinutes())}`;
  if (t === 0) return `heute ${uhr}`;
  if (t === 1) return `gestern ${uhr}`;
  const kurz = `${d.getDate()}. ${MONATE_KURZ[d.getMonth()]}`;
  return d.getFullYear() === jetzt.getFullYear() ? kurz : `${kurz} ${d.getFullYear()}`;
}

/** Wochentag + Datum für title-Attribute (Q-A5). */
export function titelZeit(w) {
  const d = datum(w);
  if (!d) return undefined;
  return d.toLocaleString("de-AT", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Benutzer-Mail → Anzeigename (Mock: Demo-Benutzer; sonst Teil vor @). */
export function person(mail, namen = {}) {
  if (!mail) return "–";
  if (namen[mail]) return namen[mail];
  const vor = String(mail).split("@")[0];
  return vor.charAt(0).toUpperCase() + vor.slice(1);
}
