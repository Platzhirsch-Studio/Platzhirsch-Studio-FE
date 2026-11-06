// Gesetzliche Fristen als Heute-Chips der Zentrale (10-konzept-zentrale § 6.3), solange kein Fachbereich sie
// übernimmt. Reine Rechenlogik mit festem Datum testbar (tests/unit/zentrale-fristen.test.mjs, Z-67);
// die Datenabfragen stehen in daten.js. Datumswerte immer als ISO „JJJJ-MM-TT“ (Wiener Kalendertag).
//
// Chip: { id, text, anzahl, ton: "rot"|"sand"|"neutral", href, rechtsgrundlage }

import { FRISTEN } from "./texte.js";

const MONATE = ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

/** Kalendertag in Wien als ISO. */
export function tagIso(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function teile(iso) {
  const [j, m, t] = String(iso).slice(0, 10).split("-").map(Number);
  return { j, m, t };
}

function iso(j, m, t) {
  const d = new Date(Date.UTC(j, m - 1, t));
  return d.toISOString().slice(0, 10);
}

/** Tage von a nach b (ISO), b − a. */
export function tageZwischen(a, b) {
  const x = Date.UTC(...Object.values(teile(a)).map((v, i) => (i === 1 ? v - 1 : v)));
  const y = Date.UTC(...Object.values(teile(b)).map((v, i) => (i === 1 ? v - 1 : v)));
  return Math.round((y - x) / 86_400_000);
}

/** Letzter Tag eines Monats (m 1–12). */
export function monatsende(j, m) {
  return iso(j, m + 1, 0);
}

/** „15.11.“ */
export function kurzDatum(isoTag) {
  const { m, t } = teile(isoTag);
  return `${String(t).padStart(2, "0")}.${String(m).padStart(2, "0")}.`;
}

/**
 * UVA-Frist: Voranmeldungszeitraum = Kalendermonat, fällig am 15. des zweitfolgenden Monats (§ 21 Abs 1 UStG).
 * Sichtbar ab 5 Tagen vorher bis zum Fälligkeitstag (danach überfällig, bis der Export-Lauf vorliegt), rot ≤ 2 Tage.
 * @param {string} heute ISO
 * @param {Array<{zeitraum_bis:string, status:string}>} exportLaeufe
 * @returns {object|null}
 */
export function uvaChip(heute, exportLaeufe = []) {
  const { j, m } = teile(heute);
  // Kandidat: Monat M−2 (fällig am 15. dieses Monats) und Monat M−1 (fällig am 15. des Folgemonats).
  for (const versatz of [2, 1]) {
    const pm = ((m - versatz - 1 + 12) % 12) + 1;
    const pj = m - versatz < 1 ? j - 1 : j;
    const faelligM = ((pm + 2 - 1) % 12) + 1;
    const faelligJ = pm + 2 > 12 ? pj + 1 : pj;
    const faellig = iso(faelligJ, faelligM, 15);
    const rest = tageZwischen(heute, faellig);
    if (rest > 5) continue;
    const ende = monatsende(pj, pm);
    const erledigt = exportLaeufe.some((l) => String(l.zeitraum_bis || "") >= ende && ["Uebergeben", "Bestaetigt"].includes(l.status));
    if (erledigt) continue;
    if (rest < -20) continue; // ältere Fristen gehören nicht mehr in die Heute-Leiste
    return {
      id: `frist.uva-${pj}-${String(pm).padStart(2, "0")}`,
      text: FRISTEN.uva(MONATE[pm - 1], kurzDatum(faellig)),
      anzahl: 1,
      ton: rest <= 2 ? "rot" : "sand",
      rechtsgrundlage: FRISTEN.uvaGrund,
      faellig,
    };
  }
  return null;
}

/**
 * OSS-Frist: Quartal, fällig am letzten Tag des Folgemonats; nur wenn im Quartal OSS-Rechnungen bestehen.
 * Sichtbar ab 10 Tagen vorher, rot ≤ 2 Tage.
 * @param {string} heute ISO
 * @param {(q:{j:number, q:number, von:string, bis:string}) => boolean} hatOss  ∃ PH Rechnung ust_fall = OSS im Quartal
 */
export function ossChip(heute, hatOss) {
  const { j, m } = teile(heute);
  const aktQ = Math.ceil(m / 3);
  const vorQ = aktQ === 1 ? 4 : aktQ - 1;
  const vorJ = aktQ === 1 ? j - 1 : j;
  const vonM = (vorQ - 1) * 3 + 1;
  const bisM = vonM + 2;
  const faelligM = bisM === 12 ? 1 : bisM + 1;
  const faelligJ = bisM === 12 ? vorJ + 1 : vorJ;
  const faellig = monatsende(faelligJ, faelligM);
  const rest = tageZwischen(heute, faellig);
  if (rest > 10 || rest < 0) return null;
  if (typeof hatOss === "function" && !hatOss({ j: vorJ, q: vorQ, von: iso(vorJ, vonM, 1), bis: monatsende(vorJ, bisM) })) return null;
  return { id: `frist.oss-${vorJ}-q${vorQ}`, text: FRISTEN.oss(vorQ, kurzDatum(faellig)), anzahl: 1, ton: rest <= 2 ? "rot" : "sand", rechtsgrundlage: FRISTEN.ossGrund, faellig };
}

/** RKSV-Jahresbeleg prüfen: 1. Jänner bis 15. Februar, solange nicht erledigt; rot ab 10. Februar. */
export function jahresbelegChip(heute, erledigt = false) {
  const { m, t } = teile(heute);
  const imFenster = m === 1 || (m === 2 && t <= 15);
  if (!imFenster || erledigt) return null;
  return { id: "frist.jahresbeleg", text: FRISTEN.jahresbeleg, anzahl: 1, ton: m === 2 && t >= 10 ? "rot" : "sand", rechtsgrundlage: FRISTEN.jahresbelegGrund };
}

/** SEE-Ausfälle mit Meldepflicht, noch nicht gemeldet: immer rot. */
export function seeChip(anzahl) {
  const n = Number(anzahl) || 0;
  return n > 0 ? { id: "frist.see", text: FRISTEN.see(n), anzahl: n, ton: "rot", rechtsgrundlage: FRISTEN.seeGrund } : null;
}

/** DEP-Sicherung: letzter Export vor Beginn des laufenden Quartals → Sand. */
export function depChip(heute, letzterExport) {
  const { j, m } = teile(heute);
  const qBeginn = iso(j, (Math.ceil(m / 3) - 1) * 3 + 1, 1);
  if (letzterExport && String(letzterExport).slice(0, 10) >= qBeginn) return null;
  return { id: "frist.dep", text: FRISTEN.dep, anzahl: 1, ton: "sand", rechtsgrundlage: FRISTEN.depGrund };
}

/** Erstattungen nach Widerruf, Frist ≤ heute + 3 Tage, noch nicht erstattet: rot. */
export function erstattungChip(heute, widerrufe = []) {
  const grenze = iso(...Object.values(teile(heute)).map((v, i) => (i === 2 ? v + 3 : v)));
  const n = widerrufe.filter((w) => w.erstattung_bis && String(w.erstattung_bis).slice(0, 10) <= grenze && !["Erstattet", "Abgelehnt"].includes(w.status)).length;
  return n > 0 ? { id: "frist.erstattung", text: FRISTEN.erstattung(n), anzahl: n, ton: "rot", rechtsgrundlage: FRISTEN.erstattungGrund } : null;
}

const RANG = { rot: 0, sand: 1, neutral: 2 };

/**
 * Heute-Leiste ordnen: nur Anzahl > 0, rot → sand → neutral, höchstens `max` sichtbar, Rest als „+n“ (Konzept § 3.2.4).
 * @returns {{sichtbar:object[], mehr:number}}
 */
export function ordneChips(chips = [], max = 6) {
  const gueltig = chips.filter((c) => c && Number(c.anzahl) > 0);
  const sortiert = gueltig.map((c, i) => ({ c, i })).sort((a, b) => (RANG[a.c.ton] ?? 3) - (RANG[b.c.ton] ?? 3) || a.i - b.i).map((x) => x.c);
  return { sichtbar: sortiert.slice(0, max), mehr: Math.max(0, sortiert.length - max) };
}
