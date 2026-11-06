// Fachregeln des Bereichs Kundenkarte (Konzept §2.2, §3.5, §4, §8). Reines Modul ohne Frappe/React –
// genutzt von Seiten, Server Actions, Mock-Methoden und Unit-Tests. Regeln aus dem Backend
// (utils/vorteile.py, utils/kartenregeln.py) sind 1:1 nachgebaut, damit der Mock dieselben Antworten gibt.

import { END_STATUS, ERSATZ_GRUENDE, OFFENE_STATUS, sperrgrund, sperrgrundLabel } from "./labels.js";

// ------------------------------------------------------------------ Rollen --

const LEITUNG_ROLLEN = ["PH Kundenkarte Leitung", "System Manager", "Administrator", "PH Backoffice-Admin"];
const GF_ROLLEN = ["PH Geschäftsführung", "PH Geschaeftsfuehrung"];

/** „leitung“ | „gf“ (lesend inkl. Beträge) | „mitarbeiter“ | null (kein Bereich, z. B. Kassa). */
export function rolleVon(session) {
  const r = Array.isArray(session?.roles) ? session.roles : [];
  if (r.some((x) => LEITUNG_ROLLEN.includes(x))) return "leitung";
  if (r.includes("PH Kundenkarte Mitarbeiter")) return "mitarbeiter";
  if (r.some((x) => GF_ROLLEN.includes(x))) return "gf";
  return null;
}
export const istLeitung = (rolle) => rolle === "leitung";
export const darfSchreiben = (rolle) => rolle === "leitung" || rolle === "mitarbeiter";
/** Beträge (Umsatz, Schwellen) nur Leitung/GF (Zweckbindung §2.2). */
export const darfBetraege = (rolle) => rolle === "leitung" || rolle === "gf";

// -------------------------------------------------------------- Zeitangaben --

export function alsDatum(wert) {
  if (!wert) return null;
  if (wert instanceof Date) return wert;
  const s = String(wert);
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00` : s.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function tageSeit(wert, jetzt = new Date()) {
  const d = alsDatum(wert);
  if (!d) return null;
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const b = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate());
  return Math.round((b - a) / 86400000);
}

/** „10/2026“ – Mitarbeitende sehen den letzten Einkauf nur als Monat (§2.2). */
export function monatJahr(wert) {
  const d = alsDatum(wert);
  if (!d) return null;
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function tageText(n) {
  return n === 1 ? "1 Tag" : `${n} Tagen`;
}

// ------------------------------------------------------------ Karten-Akte --

/**
 * Primäraktion je Zustand (§3.5.1, ⌘↵).
 * @returns {{id:string, titel:string, icon:string, gesperrt?:boolean, grund?:string} | null}
 */
export function primaeraktion(karte, rolle) {
  if (!karte || !darfSchreiben(rolle)) {
    if (karte && END_STATUS.includes(karte.status) && karte.status !== "Gekuendigt") return zurNeuen(karte);
    return null;
  }
  switch (karte.status) {
    case "Aktiv":
      return { id: "einloesen", titel: "Vorteil einlösen", icon: "Sparkles" };
    case "Beantragt":
      return { id: "uebergabe", titel: "Übergabe aktivieren", icon: "CheckCheck" };
    case "Gesperrt": {
      const sg = sperrgrund(karte.sperrgrund_art);
      if (istLeitung(rolle) && (sg?.entsperrbar ?? true)) return { id: "entsperren", titel: "Entsperren", icon: "Lock" };
      if (ERSATZ_GRUENDE.includes(karte.sperrgrund_art)) return { id: "ersatz", titel: "Ersatzkarte ausstellen", icon: "CreditCard" };
      if (!istLeitung(rolle)) return { id: "entsperren", titel: "Entsperren", icon: "Lock", gesperrt: true, grund: "Entsperren darf die Leitung." };
      return null;
    }
    case "Gekuendigt":
      return { id: "neu", titel: "Neue Karte", icon: "Plus" };
    default:
      return zurNeuen(karte);
  }
}

function zurNeuen(karte) {
  const ziel = karte.nachfolger_karte || karte.zusammengefuehrt_in;
  return ziel ? { id: "zurNeuen", titel: "Zur neuen Karte", icon: "ArrowRight", ziel } : null;
}

/**
 * Höchstens ein Band (Rang Gesperrt > Endzustand > Beantragt, §3.5.1).
 * @returns {{ton:"gefahr"|"warnung"|"neutral", titel:string, text?:string, art:string, ziel?:string} | null}
 */
export function bandFuer(karte, { datum = (x) => x } = {}) {
  if (!karte) return null;
  if (karte.status === "Gesperrt") {
    const grund = sperrgrundLabel(karte.sperrgrund_art) || "ohne Grund";
    return { art: "gesperrt", ton: "gefahr", titel: `Gesperrt${karte.gesperrt_am ? ` am ${datum(karte.gesperrt_am)}` : ""} – ${grund}`, text: karte.sperrgrund || "Die Karte wird an der Kassa abgelehnt." };
  }
  if (karte.status === "Gekuendigt") return { art: "gekuendigt", ton: "neutral", titel: `Gekündigt${karte.gekuendigt_am ? ` am ${datum(karte.gekuendigt_am)}` : ""}`, text: "Eine neue Karte ist möglich." };
  if (karte.status === "Ersetzt") return { art: "ersetzt", ton: "neutral", titel: `Ersetzt durch ${karte.nachfolger_karte || "eine neue Karte"}`, ziel: karte.nachfolger_karte };
  if (karte.status === "Uebertragen") return { art: "uebertragen", ton: "neutral", titel: `Übertragen an ${karte.nachfolger_karte || "eine andere Person"}`, ziel: karte.nachfolger_karte };
  if (karte.status === "Zusammengefuehrt") return { art: "zusammengefuehrt", ton: "neutral", titel: `Zusammengeführt in ${karte.zusammengefuehrt_in || "die Hauptkarte"}`, ziel: karte.zusammengefuehrt_in };
  if (karte.status === "Beantragt") return { art: "beantragt", ton: "warnung", titel: "Noch nicht übergeben", text: "Die Karte wird aktiv, sobald sie übergeben ist." };
  return null;
}

/** Nächster Schritt (eine Zeile, §8.3). Keine Regel „kurz vor <Stufe>“. */
export function naechsterSchritt(karte, { ungenutzt = [], jetzt = new Date() } = {}) {
  if (!karte) return null;
  if (karte.status === "Beantragt") return { id: "uebergabe", titel: "Übergabe aktivieren" };
  if (karte.status === "Gesperrt") {
    if (ERSATZ_GRUENDE.includes(karte.sperrgrund_art)) return { id: "ersatz", titel: "Ersatzkarte ausstellen" };
    return { id: "leitung", titel: "Leitung: entsperren oder kündigen" };
  }
  if (karte.status === "Gekuendigt") return { id: "neu", titel: "Neue Karte ausstellen" };
  if (karte.status !== "Aktiv") return null;
  if (!karte.persoenlicher_berater) return { id: "berater", titel: "Berater zuweisen" };
  if (Number(karte.einwilligung_auswertung) && !karte.umsatz_berechnet_am) return { id: "neuberechnen", titel: "Einstufung prüfen" };
  if (jetzt.getMonth() >= 9 && ungenutzt.length) return { id: "anbieten", titel: `${ungenutzt[0]} anbieten` };
  return null;
}

// --------------------------------------------------------------- Vorteile --

/** Wie utils/vorteile.vorteile_fuer_stufe: Zuordnungen der Stufe und aller Stufen darunter, ohne Doppelte. */
export function vorteileFuerStufe(stufenVorteile, stufen, aktuelleStufe) {
  const rang = Object.fromEntries((stufen || []).map((s) => [s.name || s.stufenname, Number(s.reihenfolge) || 0]));
  const rAkt = rang[aktuelleStufe];
  if (rAkt === undefined) return [];
  const gesehen = new Set();
  const out = [];
  for (const z of [...(stufenVorteile || [])].sort((a, b) => (rang[a.stufe] ?? 0) - (rang[b.stufe] ?? 0))) {
    const r = rang[z.stufe];
    if (r === undefined || r > rAkt || gesehen.has(z.vorteil)) continue;
    gesehen.add(z.vorteil);
    out.push({ ...z });
  }
  return out;
}

/** Wie utils/vorteile.einloesung_erlaubt → [ok, code]. */
export function einloesungErlaubt({ kartenStatus, vorteilAktiv, proJahr, imJahr, stufeRang = null, giltAbRang = null, inStufe = true }) {
  if (kartenStatus !== "Aktiv") return [false, "card_inactive"];
  if (!vorteilAktiv) return [false, "benefit_inactive"];
  if (giltAbRang !== null && stufeRang !== null && Number(stufeRang) < Number(giltAbRang)) return [false, "tier_too_low"];
  if (!inStufe) return [false, "benefit_not_in_tier"];
  const limit = Number(proJahr) || 0;
  if (limit > 0 && (Number(imJahr) || 0) >= limit) return [false, "limit_reached"];
  return [true, "ok"];
}

export function verbleibend(proJahr, imJahr) {
  const limit = Number(proJahr) || 0;
  if (limit <= 0) return null;
  return Math.max(0, limit - (Number(imJahr) || 0));
}

/** „1 je Kalenderjahr · 0 verbleibend“ bzw. „unbegrenzt“. */
export function limitText(proJahr, imJahr) {
  const limit = Number(proJahr) || 0;
  if (limit <= 0) return "unbegrenzt";
  return `${limit} je Kalenderjahr · ${verbleibend(limit, imJahr)} verbleibend`;
}

export function wiederAb(jahr) {
  return `wieder ab 01.01.${Number(jahr) + 1}`;
}

/** Bezugsregeln je Vorteil-Art (§4.6). `ziel` = nach Backend P5 (Zusage bei AB, Erbringung bei Lieferschein/Montage). */
export const BEZUGSREGELN = Object.freeze({
  Lieferung: { heute: ["PH Bestellung", "PH Kassenbeleg", "PH Rechnung"], ziel: ["PH Auftragsbestaetigung", "PH Lieferschein"], ohneBeleg: false },
  Montage: { heute: ["PH Serviceauftrag", "PH Rechnung"], ziel: ["PH Auftragsbestaetigung", "PH Montageauftrag"], ohneBeleg: false },
  Pflege: { heute: ["PH Pflege Abo", "PH Serviceauftrag"], ziel: [], ohneBeleg: false },
  Service: { heute: ["PH Serviceauftrag"], ziel: [], ohneBeleg: false },
  Event: { heute: ["PH Event"], ziel: [], ohneBeleg: true },
  Persoenlich: { heute: ["PH Kassenbeleg", "PH Bestellung", "PH Rechnung", "PH Serviceauftrag", "PH Pflege Abo", "PH Event"], ziel: [], ohneBeleg: true },
  Sonstiges: { heute: ["PH Kassenbeleg", "PH Bestellung", "PH Rechnung", "PH Serviceauftrag", "PH Pflege Abo", "PH Event"], ziel: [], ohneBeleg: false },
});
/** Wie BEZUG_ERLAUBT im Backend (Einlösung.validate). */
export const BEZUG_ERLAUBT = Object.freeze(["PH Kassenbeleg", "PH Bestellung", "PH Rechnung", "PH Serviceauftrag", "PH Pflege Abo", "PH Event"]);

export function bezugsTypen(art, { zielmodell = false } = {}) {
  const r = BEZUGSREGELN[art] || BEZUGSREGELN.Sonstiges;
  return zielmodell ? [...r.heute, ...r.ziel] : [...r.heute];
}
export function ohneBelegErlaubt(art) {
  return Boolean((BEZUGSREGELN[art] || BEZUGSREGELN.Sonstiges).ohneBeleg);
}

/** Präfix einer Belegnummer → DocType (für „Anderen Beleg suchen …“). */
export const BELEG_PRAEFIXE = Object.freeze([
  { re: /^AB-/i, doctype: "PH Auftragsbestaetigung" },
  { re: /^(RE|ENTW)-/i, doctype: "PH Rechnung" },
  { re: /^PH-S-/i, doctype: "PH Bestellung" },
  { re: /^LS-/i, doctype: "PH Lieferschein" },
  { re: /^PH-SA-/i, doctype: "PH Serviceauftrag" },
  { re: /^PFL-/i, doctype: "PH Pflege Abo" },
  { re: /^EV-/i, doctype: "PH Event" },
  { re: /^KASSE-|^K\d-|^[A-Z0-9-]+-\d{4,}$/i, doctype: "PH Kassenbeleg" },
]);
export function belegTypAus(nummer) {
  const s = String(nummer || "").trim();
  return BELEG_PRAEFIXE.find((p) => p.re.test(s))?.doctype || null;
}

/** Klartext je Fehlercode der Einlösung (Backend-Codes, §3.5.7). */
export const EINLOESE_FEHLER = Object.freeze({
  card_inactive: "Die Karte ist nicht aktiv.",
  card_pending: "Die Karte ist noch nicht übergeben.",
  card_blocked: "Die Karte ist gesperrt.",
  card_replaced: "Die Karte wurde ersetzt.",
  card_transferred: "Die Karte wurde übertragen.",
  card_cancelled: "Die Karte ist gekündigt.",
  benefit_inactive: "Der Vorteil ist nicht aktiv.",
  tier_too_low: "Die Stufe der Karte reicht für diesen Vorteil nicht.",
  benefit_not_in_tier: "Der Vorteil ist der Stufe nicht zugeordnet.",
  limit_reached: "Limit erreicht.",
  beleg_pflicht: "Bitte Auftrag, Lieferschein, Montageauftrag oder Beleg wählen.",
  beleg_typ: "Dieser Beleg passt nicht zum Vorteil.",
});

/**
 * Darf die Person die Einlösung stornieren? Leitung immer; sonst nur die eigene bis 23:59 desselben Tages (§3.6).
 * @returns {{ok:boolean, grund?:string}}
 */
export function stornoErlaubt(einloesung, { user, leitung = false, jetzt = new Date() } = {}) {
  if (!einloesung || einloesung.status !== "Eingeloest") return { ok: false, grund: "Nur eingelöste Leistungen lassen sich stornieren." };
  if (leitung) return { ok: true };
  const am = alsDatum(einloesung.eingeloest_am);
  const gleicherTag = am && am.toDateString() === jetzt.toDateString();
  if (einloesung.eingeloest_durch === user && gleicherTag) return { ok: true };
  return { ok: false, grund: "Stornieren darf die Leitung oder die einlösende Person bis heute 23:59." };
}

// ---------------------------------------------------------------- Anträge --

/** Reiter eines Antrags (§3.2): entscheiden | mail | erledigt. */
export function antragReiter(a) {
  if (!a) return "erledigt";
  if (a.status === "Bestaetigt") return "entscheiden";
  if (a.status === "Neu") return Number(a.doi_noetig) ? "mail" : "entscheiden";
  return "erledigt";
}

export const ANTRAG_REITER = Object.freeze({
  entscheiden: { titel: "Zu entscheiden", filter: [["status", "in", ["Bestaetigt", "Neu"]]], oder: null },
  mail: { titel: "Wartet auf Mail", filter: [["status", "=", "Neu"], ["doi_noetig", "=", 1]] },
  erledigt: { titel: "Erledigt", filter: [["status", "in", ["Angenommen", "Abgelehnt", "Doppelt"]]] },
});

/** Website-Anträge ohne Bestätigung werden nach 30 Tagen abgelehnt (Scheduler 03:30). */
export function mailFristText(a, jetzt = new Date(), tage = 30) {
  const seit = tageSeit(a?.eingang, jetzt);
  if (seit === null) return "wartet auf Mail-Bestätigung";
  const rest = Math.max(0, tage - seit);
  return rest === 0 ? "wartet auf Mail-Bestätigung · läuft heute ab" : `wartet auf Mail-Bestätigung · läuft ab in ${tageText(rest)}`;
}

/** Ablehnungsgrund bis Feld `ablehnungsgrund` existiert: „[Grund] Freitext“ (§3.3). */
export function ablehnGrundText(grund, text) {
  const g = String(grund || "").trim();
  const t = String(text || "").trim();
  if (!g) return { ok: false, message: "Bitte einen Grund wählen." };
  if (g === "Sonstiges" && t.length < 3) return { ok: false, message: "Bei „Sonstiges“ bitte kurz beschreiben." };
  return { ok: true, wert: `[${g}]${t ? ` ${t}` : ""}`.slice(0, 500) };
}

export function zerlegeAblehnGrund(wert) {
  const m = /^\[([^\]]+)\]\s*(.*)$/s.exec(String(wert || ""));
  return m ? { grund: m[1], text: m[2] } : { grund: "", text: String(wert || "") };
}

/** E-Mail maskiert wie kontakt_suchen: „a***“. */
export function maskiereEmail(email) {
  const s = String(email || "");
  return s ? `${s[0]}***` : "";
}

/** Name maskiert für Hinweise: „Anna Muster“ → „A. M***“. */
export function maskiereName(name) {
  const w = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!w.length) return "";
  return `${w[0][0]}. ${w.length > 1 ? `${w[w.length - 1][0]}***` : "***"}`;
}

/**
 * Kontakt-Treffer für „Karte ausstellen“ (§3.3): Kennzeichen je Treffer und Vorauswahl.
 * Vorauswahl nur bei genau einem Treffer mit gleicher E-Mail **und** gleichem Nachnamen.
 */
export function kontaktTreffer(antrag, kontakte = []) {
  const email = String(antrag?.email || "").trim().toLowerCase();
  const nach = String(antrag?.nachname || "").trim().toLowerCase();
  const plz = String(antrag?.plz || "").trim();
  const treffer = [];
  for (const k of kontakte) {
    const kn = String(k.nachname || String(k.titel || "").split(" ").slice(-1)[0] || "").trim().toLowerCase();
    const zeichen = [];
    const mailGleich = email && String(k.email || "").trim().toLowerCase() === email;
    if (mailGleich) zeichen.push("E-Mail gleich");
    if (nach && kn === nach && plz && String(k.plz || "").trim() === plz) zeichen.push("Name + PLZ gleich");
    else if (nach && kn === nach) zeichen.push("Name gleich");
    if (!zeichen.length) continue;
    treffer.push({ ...k, zeichen, sicher: Boolean(mailGleich && kn === nach) });
  }
  const sichere = treffer.filter((t) => t.sicher);
  const vorauswahl = sichere.length === 1 && treffer.length === 1 ? sichere[0].name : treffer.length === 0 ? "neu" : null;
  const andererName = treffer.find((t) => t.zeichen.includes("E-Mail gleich") && !t.sicher) || null;
  return { treffer, vorauswahl, andererName };
}

/** Berechneter Kartenstatus für den Live-Satz (§3.3/§3.10, F2). */
export function kartenstatusBeimAusstellen({ quelle, sofortAktiv = true, perMailBestaetigt = false }) {
  if (quelle === "website") return perMailBestaetigt || sofortAktiv ? "Aktiv" : "Beantragt";
  return sofortAktiv ? "Aktiv" : "Beantragt";
}

// ---------------------------------------------------------------- Stufen --

/** Schwelle muss mit der Reihenfolge steigen (§3.7). → { <stufenname>: Fehlertext } */
export function stufenplanFehler(stufen = []) {
  const fehler = {};
  const aktiv = stufen.filter((s) => Number(s.aktiv ?? 1)).sort((a, b) => Number(a.reihenfolge) - Number(b.reihenfolge));
  for (let i = 1; i < aktiv.length; i++) {
    if (Number(aktiv[i].schwelle_jahresumsatz_cent) <= Number(aktiv[i - 1].schwelle_jahresumsatz_cent)) {
      fehler[aktiv[i].stufenname] = "Schwelle muss mit der Reihenfolge steigen.";
    }
  }
  const reihen = new Map();
  for (const s of aktiv) {
    if (reihen.has(Number(s.reihenfolge))) fehler[s.stufenname] = "Reihenfolge ist doppelt vergeben.";
    reihen.set(Number(s.reihenfolge), s.stufenname);
  }
  return fehler;
}

/** „Eine Wahrheit“: gilt_ab_stufe je Vorteil = niedrigste zugeordnete Stufe (§3.7). → { vorteil: stufenname|null } */
export function giltAbAusZuordnung(stufen = []) {
  const sortiert = [...stufen].filter((s) => Number(s.aktiv ?? 1)).sort((a, b) => Number(a.reihenfolge) - Number(b.reihenfolge));
  const out = {};
  for (const s of sortiert) for (const z of s.vorteile || []) if (!(z.vorteil in out)) out[z.vorteil] = s.stufenname;
  return out;
}

/** Altdaten-Widerspruch: zugeordnet, aber gilt_ab_stufe höher → Warnzeile (§3.7). */
export function widersprueche(stufen = [], vorteile = []) {
  const rang = Object.fromEntries(stufen.map((s) => [s.stufenname, Number(s.reihenfolge)]));
  const vt = Object.fromEntries(vorteile.map((v) => [v.name, v]));
  const out = [];
  for (const s of stufen) {
    for (const z of s.vorteile || []) {
      const v = vt[z.vorteil];
      if (v?.gilt_ab_stufe && rang[v.gilt_ab_stufe] > rang[s.stufenname]) out.push({ stufe: s.stufenname, vorteil: z.vorteil, titel: v.titel, giltAb: v.gilt_ab_stufe });
    }
  }
  return out;
}

/** Wie kartenregeln.stufenplan_vorschau. */
export function stufenplanVorschau(karten = [], stufenNeu = []) {
  const aktiv = stufenNeu.filter((s) => Number(s.aktiv ?? 1)).sort((a, b) => Number(a.reihenfolge) - Number(b.reihenfolge));
  const rang = Object.fromEntries(aktiv.map((s) => [s.stufenname, Number(s.reihenfolge)]));
  const e = { auf: 0, ab: 0, gleich: 0, nicht_beurteilt: 0, beispiele: [] };
  for (const k of karten) {
    if (!Number(k.einwilligung_auswertung) || Number(k.stufe_manuell)) {
      e.nicht_beurteilt++;
      continue;
    }
    const umsatz = Number(k.jahresumsatz_cent) || 0;
    let neu = null;
    for (const s of aktiv) if (umsatz >= (Number(s.schwelle_jahresumsatz_cent) || 0)) neu = s.stufenname;
    if (!neu || neu === k.stufe) {
      e.gleich++;
      continue;
    }
    const richtung = (rang[neu] ?? 0) > (rang[k.stufe] ?? 0) ? "auf" : "ab";
    e[richtung]++;
    if (e.beispiele.length < 20) e.beispiele.push({ karte: k.name, alt: k.stufe, neu });
  }
  return e;
}

export function vorschauSatz(v) {
  if (!v) return "";
  const teile = [`${v.auf} ${v.auf === 1 ? "Karte würde" : "Karten würden"} aufsteigen`, `${v.ab} absteigen`];
  if (v.nicht_beurteilt) teile.push(`${v.nicht_beurteilt} ohne Auswertung oder von Hand`);
  return teile.join(", ");
}

/** Stufe nach Umsatz (für die Mock-Neuberechnung): höchste Stufe mit Schwelle ≤ Umsatz. */
export function stufeNachUmsatz(stufen = [], umsatzCent = 0) {
  let neu = null;
  for (const s of [...stufen].filter((x) => Number(x.aktiv ?? 1)).sort((a, b) => Number(a.reihenfolge) - Number(b.reihenfolge))) {
    if ((Number(umsatzCent) || 0) >= (Number(s.schwelle_jahresumsatz_cent) || 0)) neu = s.stufenname;
  }
  return neu;
}

export function naechsteStufe(stufen = [], aktuell) {
  const s = [...stufen].filter((x) => Number(x.aktiv ?? 1)).sort((a, b) => Number(a.reihenfolge) - Number(b.reihenfolge));
  const i = s.findIndex((x) => x.stufenname === aktuell || x.name === aktuell);
  return i >= 0 && i < s.length - 1 ? s[i + 1] : null;
}

// ----------------------------------------------------------- Kanalregel --

/**
 * Erlaubte Kanäle für eine persönliche Aufgabe (TKG § 174, §8.2).
 * kontakt: { nicht_kontaktieren, werbung_email?, werbung_telefon? } – Werbeeinwilligungen aus ph_marketing.
 * @returns {{erlaubt:boolean, kanaele:string[], titelZusatz:string, grund?:string}}
 */
export function kanaeleFuer(kontakt = {}) {
  if (Number(kontakt.nicht_kontaktieren)) return { erlaubt: false, kanaele: [], titelZusatz: "", grund: "Widerspruch – keine Aufgabe" };
  const k = ["Brief"];
  if (kontakt.werbung_telefon) k.push("Telefon");
  if (kontakt.werbung_email) k.push("E-Mail");
  return { erlaubt: true, kanaele: k, titelZusatz: k.length === 1 ? "per Brief" : `per ${k.join(" oder ")}` };
}

/** Vorschau „8 von 12 – 4 ohne Werbeeinwilligung (nur Brief möglich) · 1 mit Widerspruch (keine Aufgabe)“. */
export function kanalVorschau(eintraege = []) {
  let moeglich = 0;
  let nurBrief = 0;
  let widerspruch = 0;
  let nichtBeurteilbar = 0;
  for (const e of eintraege) {
    if (e.nichtBeurteilbar) nichtBeurteilbar++;
    const k = kanaeleFuer(e.kontakt || {});
    if (!k.erlaubt) {
      widerspruch++;
      continue;
    }
    moeglich++;
    if (k.kanaele.length === 1) nurBrief++;
  }
  const rest = [];
  if (nurBrief) rest.push(`${nurBrief} ohne Werbeeinwilligung (nur Brief möglich)`);
  if (widerspruch) rest.push(`${widerspruch} mit Widerspruch (keine Aufgabe)`);
  const satz = `${moeglich} von ${eintraege.length}${rest.length ? ` – ${rest.join(" · ")}` : ""}`;
  return { moeglich, nurBrief, widerspruch, nichtBeurteilbar, satz };
}

// ---------------------------------------------------------- Zusammenführen --

const STATUS_RANG = { Aktiv: 3, Gesperrt: 2, Beantragt: 1 };

/** Wie kartenregeln.ziel_waehlen. */
export function zielWaehlen(karten = [], stufenRang = {}) {
  const offen = karten.filter((k) => OFFENE_STATUS.includes(k.status));
  if (!offen.length) return null;
  return [...offen].sort((a, b) => {
    const s = (STATUS_RANG[b.status] || 0) - (STATUS_RANG[a.status] || 0);
    if (s) return s;
    const r = (stufenRang[b.stufe] || 0) - (stufenRang[a.stufe] || 0);
    if (r) return r;
    const d = String(a.ausgestellt_am || "9999-12-31").localeCompare(String(b.ausgestellt_am || "9999-12-31"));
    return d || String(a.name).localeCompare(String(b.name));
  })[0].name;
}

// ------------------------------------------------------------ Einstufung --

/** „Zählt:“-Text (§3.5.2) – heute wahr für umsatz.py, Zielstand mit Fähigkeit `umsatzregeln`. */
export function zaehltText(umsatzregeln = false) {
  return umsatzregeln
    ? "Zählt: bezahlte Rechnungen, Kassenkäufe, Shop-Bestellungen; Anzahlungen mit der Schlussrechnung; Gutschriften werden abgezogen. Aufträge zählen mit der Schlussrechnung."
    : "Zählt: Kassenkäufe ohne Rechnung, bezahlte Shop-Bestellungen, gestellte Rechnungen. Aufträge zählen mit der Rechnung.";
}

/** Geburtstag „TT.MM.“ ↔ „MM-DD“ (Feld geburtstag_tag_monat). */
export function geburtstagParsen(wert) {
  const s = String(wert || "").trim();
  if (!s) return { ok: true, wert: "" };
  let m = /^(\d{1,2})\.(\d{1,2})\.?$/.exec(s);
  let t;
  let mo;
  if (m) [t, mo] = [Number(m[1]), Number(m[2])];
  else if ((m = /^-{0,2}(\d{2})-(\d{2})$/.exec(s))) [mo, t] = [Number(m[1]), Number(m[2])];
  else return { ok: false, message: "Geburtstag als TT.MM. eingeben." };
  const d = new Date(2000, mo - 1, t);
  if (d.getMonth() !== mo - 1 || d.getDate() !== t) return { ok: false, message: "Diesen Tag gibt es nicht." };
  return { ok: true, wert: `${String(mo).padStart(2, "0")}-${String(t).padStart(2, "0")}` };
}
export function geburtstagAnzeige(tagMonat) {
  const m = /^(\d{2})-(\d{2})$/.exec(String(tagMonat || ""));
  return m ? `${m[2]}.${m[1]}.` : "";
}

/** Idempotenz-Schlüssel „<aktion>:<quelle>:<uuid>“ (Q-A10). */
export function idempotenzSchluessel(aktion, quelle, uuid) {
  return `${aktion}:${String(quelle || "x").replace(/[^\w@.-]/g, "").slice(0, 60)}:${String(uuid || "").replace(/[^\w-]/g, "").slice(0, 40)}`;
}
