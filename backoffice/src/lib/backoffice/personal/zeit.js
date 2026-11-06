// Zeiten und Konten (Konzept § 4, § 5.2, E3/E4). Reines Modul, unit-getestet.
// h:mm-Darstellung mit Tabellenziffern, Vorzeichen „−“ (U+2212), Netto je Buchung, „heute bisher“, Ist-Summen.
// Konten (Soll/Angerechnet/Saldo/Urlaub) rechnet der Mock nur hier nach – im Frappe-Modus liefert sie
// ph_personal (zeitkonto.monatsuebersicht, urlaubskonto.konto). Saldo des laufenden Monats gibt es nicht (E3).

const MINUS = "−";
const p2 = (n) => String(n).padStart(2, "0");

/** „07:55“ / „07:55:00“ → 475; leer/ungültig → null. */
export function zeitMin(t) {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(String(t ?? "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}

/** 475 → „07:55“. */
export function minZeit(min) {
  if (min == null || !Number.isFinite(min)) return "";
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${p2(Math.floor(m / 60))}:${p2(m % 60)}`;
}

/** Dauer in Minuten → „4:12“ (ohne Einheit), negativ mit „−“. */
export function hm(min) {
  if (min == null || !Number.isFinite(min)) return "–";
  const neg = min < 0;
  const a = Math.abs(Math.round(min));
  return `${neg ? MINUS : ""}${Math.floor(a / 60)}:${p2(a % 60)}`;
}

/** „4:12 h“ */
export const hmText = (min) => (min == null || !Number.isFinite(min) ? "–" : `${hm(min)} h`);

/** Saldo immer mit Vorzeichen: „+2:15 h“, „−0:36 h“, „0:00 h“ – immer neutral gefärbt (E3). */
export function saldoText(min) {
  if (min == null || !Number.isFinite(min)) return "–";
  if (Math.round(min) === 0) return "0:00 h";
  return `${min > 0 ? "+" : ""}${hm(min)} h`;
}

/** Netto einer Buchung; offene Buchung (ohne Gehen) zählt bis `jetztMin` (nur für „heute bisher“). */
export function nettoMin(b, jetztMin = null) {
  const k = zeitMin(b?.kommen);
  if (k == null) return 0;
  const g = zeitMin(b?.gehen) ?? jetztMin;
  if (g == null) return 0;
  const brutto = Math.max(0, g - k);
  const pause = zeitMin(b?.gehen) != null ? Number(b?.pause_min) || 0 : 0;
  return Math.max(0, brutto - pause);
}

export function bruttoMin(b, jetztMin = null) {
  const k = zeitMin(b?.kommen);
  const g = zeitMin(b?.gehen) ?? jetztMin;
  return k == null || g == null ? 0 : Math.max(0, g - k);
}

/** Summe Netto über Buchungen (abgeschlossene; offene nur mit jetztMin). */
export function istSumme(buchungen = [], jetztMin = null) {
  return buchungen.reduce((s, b) => s + nettoMin(b, b.gehen ? null : jetztMin), 0);
}

/** Uhrzeit (Minuten) eines Date-Objekts in Ortszeit. */
export const minutenVon = (d) => d.getHours() * 60 + d.getMinutes();

// ------------------------------------------------------------------ Datum --

export function iso(d) {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}
export function ausIso(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ""));
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0) : null;
}
export function plusTage(s, n) {
  const d = ausIso(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}
/** Mo = 0 … So = 6 */
export function wochentag(s) {
  return (ausIso(s).getDay() + 6) % 7;
}
export const istWochenende = (s) => wochentag(s) >= 5;

/** Alle Tage eines Monats (ISO). monat 1–12. */
export function monatsTage(jahr, monat) {
  const n = new Date(jahr, monat, 0).getDate();
  return Array.from({ length: n }, (_, i) => `${jahr}-${p2(monat)}-${p2(i + 1)}`);
}

/** Tage von–bis inklusive. */
export function tageVonBis(von, bis) {
  const out = [];
  if (!von || !bis || bis < von) return out;
  for (let d = von; d <= bis; d = plusTage(d, 1)) out.push(d);
  return out;
}

/** Arbeitstage Mo–Fr (ohne Feiertage – die kennt erst ph_core B1). */
export function arbeitstage(von, bis) {
  return tageVonBis(von, bis).filter((d) => !istWochenende(d)).length;
}

/** Montag der Woche. */
export function wochenStartIso(s) {
  return plusTage(s, -wochentag(s));
}

/** Kalenderwoche nach ISO 8601. */
export function kw(s) {
  const d = ausIso(s);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const tag = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - tag);
  const jahrStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - jahrStart) / 86400000 + 1) / 7);
}

const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const TAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const TAGE_LANG = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
export const monatName = (m) => MONATE[(Number(m) - 1 + 12) % 12];
export const tagKurz = (s) => TAGE[wochentag(s)];
export const tagLang = (s) => TAGE_LANG[wochentag(s)];

/** „04.11.“ */
export function kurzDatum(s) {
  const d = ausIso(s);
  return d ? `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.` : "–";
}
/** „04.11.2026“ */
export function langDatum(s) {
  const d = ausIso(s);
  return d ? `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}` : "–";
}
/** „Mittwoch, 4. November“ */
export function tagTitel(s) {
  const d = ausIso(s);
  return d ? `${tagLang(s)}, ${d.getDate()}. ${MONATE[d.getMonth()]}` : "";
}

/** Zeitraum kurz: „23.–27.11.“, „30.11.–02.12.“, ein Tag „04.11.“, über Jahre mit Jahr. */
export function zeitraumText(von, bis) {
  if (!von) return "–";
  if (!bis || bis === von) return kurzDatum(von);
  const a = ausIso(von);
  const b = ausIso(bis);
  if (a.getFullYear() !== b.getFullYear()) return `${langDatum(von)}–${langDatum(bis)}`;
  if (a.getMonth() === b.getMonth()) return `${p2(a.getDate())}.–${kurzDatum(bis)}`;
  return `${kurzDatum(von)}–${kurzDatum(bis)}`;
}

/** Ganze Tage zwischen zwei ISO-Daten (b − a). */
export function tageZwischen(a, b) {
  return Math.round((ausIso(b) - ausIso(a)) / 86400000);
}

/** Relativ ausgeschrieben (Glossar § 3.2): „heute“, „morgen“, „gestern“, „vor 2 Tagen“, „in 6 Tagen“ – nie „T.“ */
export function relativTage(s, heute) {
  if (!s) return "–";
  const n = tageZwischen(heute, String(s).slice(0, 10));
  if (n === 0) return "heute";
  if (n === 1) return "morgen";
  if (n === -1) return "gestern";
  return n > 0 ? `in ${n} Tagen` : `vor ${-n} Tagen`;
}

// ----------------------------------------------------------------- Konten --

/** Tagessoll in Minuten bei 5-Tage-Woche (Modell je Person kommt aus ph_personal). */
export const tagessollMin = (wochenstunden) => Math.round(((Number(wochenstunden) || 0) * 60) / 5);

/**
 * Konto eines Zeitraums (nur abgeschlossene Tage!): Soll, Ist, Angerechnet, Saldo.
 * Gutschrift-Matrix (README ph_personal): Urlaub/Krankenstand/Pflege/Sonderurlaub/Fortbildung/Berufsschule =
 * Tagessoll; Zeitausgleich keine Gutschrift; Unbezahlt/Karenz senken das Soll auf 0.
 */
export function konto({ buchungen = [], abwesenheiten = [], wochenstunden = 38.5, von, bis }) {
  const tag = tagessollMin(wochenstunden);
  const tage = tageVonBis(von, bis).filter((d) => !istWochenende(d));
  const artAm = (d) => abwesenheiten.find((a) => a.von <= d && a.bis >= d && (a.status === "Genehmigt" || a.quelle === "krank"))?.art || null;
  let soll = 0;
  let angerechnet = 0;
  for (const d of tage) {
    const art = artAm(d);
    if (art === "Unbezahlt" || art === "Karenz") continue;
    soll += tag;
    if (art && art !== "Zeitausgleich") angerechnet += tag;
  }
  const ist = istSumme(buchungen.filter((b) => b.datum >= von && b.datum <= bis && b.gehen));
  return { soll, ist, angerechnet, saldo: ist + angerechnet - soll };
}

/** Urlaubstage (Arbeitstage Mo–Fr, halbtags 0,5) einer Abwesenheit innerhalb eines Jahres. */
export function urlaubstage(a, jahr) {
  const von = a.von > `${jahr}-01-01` ? a.von : `${jahr}-01-01`;
  const bis = a.bis < `${jahr}-12-31` ? a.bis : `${jahr}-12-31`;
  if (bis < von) return 0;
  if (Number(a.halbtags) && a.von === a.bis) return 0.5;
  return arbeitstage(von, bis);
}

/** Urlaubskonto (Mock-Rechnung, Kalenderjahr): Anspruch, genommen, beantragt, Rest. */
export function urlaubskonto({ anspruch = 25, abwesenheiten = [], jahr }) {
  const urlaub = abwesenheiten.filter((a) => a.art === "Urlaub");
  const genommen = urlaub.filter((a) => a.status === "Genehmigt").reduce((s, a) => s + urlaubstage(a, jahr), 0);
  const beantragt = urlaub.filter((a) => a.status === "Beantragt").reduce((s, a) => s + urlaubstage(a, jahr), 0);
  return { anspruch, genommen, beantragt, rest: anspruch - genommen - beantragt };
}

/** Tage-Zahl deutsch: 9,5 */
export const tageZahl = (n) => String(Math.round((Number(n) || 0) * 10) / 10).replace(".", ",");

/** Pause, die der Controller beim Gehen vorschlägt (pause_ab_minuten, pause_minuten). */
export function pauseVorschlag(bruttoMinuten, { pauseAb = 360, pause = 30 } = {}) {
  return bruttoMinuten > pauseAb ? pause : 0;
}
