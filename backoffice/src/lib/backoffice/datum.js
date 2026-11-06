// Datumslogik des deutschen Datumsfelds (TT.MM.JJJJ ↔ ISO JJJJ-MM-TT).
// Reines Modul ohne Zeitzonen-Tricks: gerechnet wird mit lokalen Kalendertagen.

const p2 = (n) => String(n).padStart(2, "0");

export const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
export const WOCHENTAGE_KURZ = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

/** Date → "JJJJ-MM-TT" (lokal). */
export function alsIso(d) {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

/** "JJJJ-MM-TT" (auch mit Zeitanteil) → Date (lokal, 12:00) oder null. */
export function ausIso(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  return d.getMonth() === Number(m[2]) - 1 ? d : null;
}

/** "JJJJ-MM-TT" → "TT.MM.JJJJ" ("" bei leer/ungültig). */
export function isoZuDeutsch(iso) {
  const d = ausIso(iso);
  return d ? `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}` : "";
}

/**
 * Freie Eingabe → ISO oder null. Versteht „04.11.2026“, „4.11.26“, „4.11.“ (laufendes Jahr),
 * „041126“/„04112026“ (Ziffern), „heute“/„h“, „morgen“, „gestern“, „+3“/„-2“ (Tage ab heute)
 * und ISO „2026-11-04“. Leer → "".
 */
export function parseDatum(eingabe, heute = new Date()) {
  const s = String(eingabe ?? "").trim().toLowerCase();
  if (!s) return "";
  const basis = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate(), 12);
  const plus = (n) => {
    const d = new Date(basis);
    d.setDate(d.getDate() + n);
    return alsIso(d);
  };
  if (s === "heute" || s === "h" || s === "t") return plus(0);
  if (s === "morgen") return plus(1);
  if (s === "gestern") return plus(-1);
  let m = /^([+-])\s*(\d{1,3})$/.exec(s);
  if (m) return plus((m[1] === "-" ? -1 : 1) * Number(m[2]));
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (m) return gueltig(Number(m[1]), Number(m[2]), Number(m[3]));
  m = /^(\d{1,2})[./ ](\d{1,2})(?:[./ ](\d{2}|\d{4})?)?\.?$/.exec(s);
  if (m) return gueltig(jahr(m[3], basis), Number(m[2]), Number(m[1]));
  m = /^(\d{2})(\d{2})(\d{2}|\d{4})$/.exec(s);
  if (m) return gueltig(jahr(m[3], basis), Number(m[2]), Number(m[1]));
  return null;
}

function jahr(text, basis) {
  if (!text) return basis.getFullYear();
  const n = Number(text);
  return text.length === 2 ? 2000 + n : n;
}

function gueltig(j, mo, t) {
  if (!j || mo < 1 || mo > 12 || t < 1 || t > 31 || j < 1900 || j > 2200) return null;
  const d = new Date(j, mo - 1, t, 12);
  if (d.getMonth() !== mo - 1 || d.getDate() !== t) return null;
  return alsIso(d);
}

/** "9", "930", "9:3", "09:30" → "09:30" oder null; leer → "". */
export function parseZeit(eingabe) {
  const s = String(eingabe ?? "").trim();
  if (!s) return "";
  let m = /^(\d{1,2})(?::|\.|h)?(\d{2})?$/.exec(s);
  if (!m && /^\d{3,4}$/.test(s)) m = [s, s.slice(0, s.length - 2), s.slice(-2)];
  if (!m) {
    const k = /^(\d{1,2})[:.](\d)$/.exec(s);
    if (k) m = [s, k[1], `${k[2]}0`];
  }
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2] || 0);
  if (h > 23 || min > 59) return null;
  return `${p2(h)}:${p2(min)}`;
}

/** 6×7-Raster eines Monats (Wochenstart Montag): [{iso, tag, imMonat}]. */
export function monatsRaster(jahrZahl, monat) {
  const erster = new Date(jahrZahl, monat, 1, 12);
  const versatz = (erster.getDay() + 6) % 7;
  const start = new Date(jahrZahl, monat, 1 - versatz, 12);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { iso: alsIso(d), tag: d.getDate(), imMonat: d.getMonth() === monat };
  });
}

/** ISO-Datum um n Tage/Monate verschieben. */
export function verschiebe(iso, { tage = 0, monate = 0 } = {}) {
  const d = ausIso(iso) || new Date();
  if (monate) {
    const tag = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + monate);
    const letzter = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(tag, letzter));
  }
  if (tage) d.setDate(d.getDate() + tage);
  return alsIso(d);
}

// ---- Erweiterung Team P0-6 (G-21 Kalender, Raster, Slotraster) ---------------------------------
// Kalendertage als ISO „JJJJ-MM-TT“, Zeitpunkte als „JJJJ-MM-TT HH:MM“ (lokal, ohne Zeitzone –
// genau wie Frappe Datetime ohne Sekunden). Wochenstart Montag, Kalenderwoche nach ISO 8601.

export const WOCHENTAGE_LANG = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

/** Heute als ISO (lokal). */
export function heuteIso(jetzt = new Date()) {
  return alsIso(jetzt);
}

/** Wochentag 0 = Montag … 6 = Sonntag (oder -1 bei ungültig). */
export function wochentag(iso) {
  const d = ausIso(iso);
  return d ? (d.getDay() + 6) % 7 : -1;
}

/** Montag der Woche des Datums. */
export function wochenStart(iso) {
  const w = wochentag(iso);
  return w < 0 ? "" : verschiebe(iso, { tage: -w });
}

/** n aufeinanderfolgende Tage ab dem Montag der Woche (Standard 7). */
export function wochenTage(iso, n = 7) {
  const start = wochenStart(iso);
  if (!start) return [];
  return Array.from({ length: n }, (_, i) => verschiebe(start, { tage: i }));
}

/** Kalenderwoche nach ISO 8601 (Woche mit dem ersten Donnerstag ist KW 1). */
export function kalenderwoche(iso) {
  const d = ausIso(iso);
  if (!d) return 0;
  const donnerstag = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 3 - ((d.getDay() + 6) % 7), 12);
  const ersterDonnerstag = new Date(donnerstag.getFullYear(), 0, 4, 12);
  return 1 + Math.round(((donnerstag - ersterDonnerstag) / 86400000 - 3 + ((ersterDonnerstag.getDay() + 6) % 7)) / 7);
}

/** "09:30" → 570; ungültig → null. */
export function zeitZuMinuten(zeit) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(zeit ?? "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h > 24 || min > 59 ? null : h * 60 + min;
}

/** 570 → "09:30" (Werte über 24 h werden auf den Tag gekürzt). */
export function minutenZuZeit(minuten) {
  const n = ((Math.round(Number(minuten) || 0) % 1440) + 1440) % 1440;
  return `${p2(Math.floor(n / 60))}:${p2(n % 60)}`;
}

/** "2026-11-04 10:00" | "2026-11-04T10:00:00" | "2026-11-04" → { datum, zeit } (zeit "" ohne Uhrzeit). */
export function zerlegeDatumZeit(wert) {
  const m = /^(\d{4}-\d{2}-\d{2})(?:[ T](\d{1,2}:\d{2}))?/.exec(String(wert ?? "").trim());
  if (!m || !ausIso(m[1])) return { datum: "", zeit: "" };
  return { datum: m[1], zeit: m[2] ? minutenZuZeit(zeitZuMinuten(m[2])) : "" };
}

/** ("2026-11-04", "10:00") → "2026-11-04 10:00". */
export function verbindeDatumZeit(datum, zeit) {
  return datum ? (zeit ? `${datum} ${zeit}` : datum) : "";
}

/** Minuten seit 1970 (lokal) eines Zeitpunkts – nur zum Vergleichen und Rechnen. */
export function zeitpunktMinuten(wert) {
  const { datum, zeit } = zerlegeDatumZeit(wert);
  const d = ausIso(datum);
  if (!d) return null;
  const tage = Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  return tage * 1440 + (zeitZuMinuten(zeit) ?? 0);
}

/** Umkehrung von zeitpunktMinuten → "JJJJ-MM-TT HH:MM". */
export function ausZeitpunktMinuten(n) {
  const tage = Math.floor(n / 1440);
  const u = new Date(tage * 86400000);
  const datum = `${u.getUTCFullYear()}-${p2(u.getUTCMonth() + 1)}-${p2(u.getUTCDate())}`;
  return `${datum} ${minutenZuZeit(n - tage * 1440)}`;
}

/** Zeitpunkt um n Minuten verschieben (über Tagesgrenzen). */
export function plusMinuten(wert, n) {
  const a = zeitpunktMinuten(wert);
  return a === null ? "" : ausZeitpunktMinuten(a + Math.round(n));
}

/** Minuten von a bis b (negativ, wenn b vor a liegt). */
export function minutenZwischen(a, b) {
  const x = zeitpunktMinuten(a);
  const y = zeitpunktMinuten(b);
  return x === null || y === null ? null : y - x;
}

/** Tage von a bis b (Kalendertage). */
export function tageZwischen(a, b) {
  const x = zeitpunktMinuten(zerlegeDatumZeit(a).datum);
  const y = zeitpunktMinuten(zerlegeDatumZeit(b).datum);
  return x === null || y === null ? null : Math.round((y - x) / 1440);
}

/** "Mi 4.11." */
export function tagKurz(iso) {
  const d = ausIso(iso);
  return d ? `${WOCHENTAGE_KURZ[(d.getDay() + 6) % 7]} ${d.getDate()}.${d.getMonth() + 1}.` : "";
}

/** "Mittwoch, 4. November 2026" */
export function tagLang(iso) {
  const d = ausIso(iso);
  return d ? `${WOCHENTAGE_LANG[(d.getDay() + 6) % 7]}, ${d.getDate()}. ${MONATE[d.getMonth()]} ${d.getFullYear()}` : "";
}

/** "November 2026" */
export function monatTitel(iso) {
  const d = ausIso(iso);
  return d ? `${MONATE[d.getMonth()]} ${d.getFullYear()}` : "";
}

/** "2.–8. November 2026", über Monats-/Jahresgrenzen „30. November – 6. Dezember 2026“. */
export function spanneTitel(vonIso, bisIso) {
  const a = ausIso(vonIso);
  const b = ausIso(bisIso);
  if (!a || !b) return "";
  if (a.getFullYear() !== b.getFullYear()) return `${a.getDate()}. ${MONATE[a.getMonth()]} ${a.getFullYear()} – ${b.getDate()}. ${MONATE[b.getMonth()]} ${b.getFullYear()}`;
  if (a.getMonth() !== b.getMonth()) return `${a.getDate()}. ${MONATE[a.getMonth()]} – ${b.getDate()}. ${MONATE[b.getMonth()]} ${b.getFullYear()}`;
  return `${a.getDate()}.–${b.getDate()}. ${MONATE[b.getMonth()]} ${b.getFullYear()}`;
}
