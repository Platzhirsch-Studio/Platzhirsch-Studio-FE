// Fachregeln des Bereichs Personal (Konzept § 5, § 6, Workflows aus Backend-Import/ph_personal/fixtures).
// Reines Modul, unit-getestet. Keine Texte außer Gründen, die in texte.js gespiegelt sind.

import { istLeitung, darfBearbeiten } from "./rollen.js";
import { pruefeTitel } from "./titelpruefung.js";
import { tageZwischen, plusTage } from "./zeit.js";

// ---------------------------------------------------------- Bewerbungen --

export const BOARD_SPALTEN = Object.freeze(["Eingegangen", "Gesichtet", "Gespraech", "Angebot", "Eingestellt"]);
export const ABGESCHLOSSEN = Object.freeze(["Abgesagt", "Zurueckgezogen"]);
export const OFFENE_BEWERBUNG = Object.freeze(["Eingegangen", "Gesichtet", "Gespraech", "Angebot"]);
export const EINGESTELLT_TAGE = 90;
export const OHNE_ENTSCHEIDUNG_TAGE = 30; // Schwelle Konzept § 5.1, Inhaber bestätigt (Frage)
export const LOESCHUHR_TAGE = 14;

/**
 * Was passiert bei einem Zug von → nach (Konzept § 5.5 „Züge“)?
 * @returns {{art:"workflow"|"sheet"|"assistent"|"absage"|"zurueckziehen"|"zurueck", aktion?:string, kette?:string[],
 *   erlaubt:boolean, grund?:string}|null}  null = kein sinnvoller Zug
 */
export function bewerbungsZug(von, nach, rolle, { pseudonymisiert = false } = {}) {
  if (von === nach) return null;
  const L = istLeitung(rolle);
  const M = darfBearbeiten(rolle);
  const nurL = (x) => (L ? { ...x, erlaubt: true } : { ...x, erlaubt: false, grund: "leitung" });
  const nurM = (x) => (M ? { ...x, erlaubt: true } : { ...x, erlaubt: false, grund: "recht" });
  if (ABGESCHLOSSEN.includes(von)) {
    if (nach === "Gesichtet" && !pseudonymisiert) return nurL({ art: "zurueck", aktion: "Zurück auf Gesichtet" });
    return null;
  }
  if (nach === "Abgesagt") return nurL({ art: "absage", aktion: "Absagen" });
  if (nach === "Zurueckgezogen") return nurM({ art: "zurueckziehen", aktion: "Zurückziehen" });
  if (von === "Eingegangen" && nach === "Gesichtet") return nurM({ art: "workflow", aktion: "Sichten" });
  if ((von === "Eingegangen" || von === "Gesichtet") && nach === "Gespraech") return nurM({ art: "sheet", aktion: "Termin vereinbaren", kette: von === "Eingegangen" ? ["Sichten"] : [] });
  if (von === "Gespraech" && nach === "Angebot") return nurL({ art: "workflow", aktion: "Angebot erstellen" });
  if ((von === "Gespraech" || von === "Angebot") && nach === "Eingestellt") return nurL({ art: "assistent", aktion: "Einstellen", kette: von === "Gespraech" ? ["Angebot erstellen"] : [] });
  if (von === "Gesichtet" && nach === "Eingegangen") return nurM({ art: "workflow", aktion: "Zurück auf Eingegangen" });
  if (von === "Angebot" && nach === "Gespraech") return nurL({ art: "workflow", aktion: "Zurück auf Gespräch" });
  return null;
}

/** Alle Ziele aus einem Status mit Erlaubnis (für Menü „Verschieben nach …“). */
export function zieleVon(von, rolle, opt) {
  return [...BOARD_SPALTEN, ...ABGESCHLOSSEN].map((nach) => ({ nach, zug: bewerbungsZug(von, nach, rolle, opt) })).filter((z) => z.zug);
}

/**
 * Primäraktion der Bewerberakte je Status (Konzept § 5.6).
 * @returns {{id:string}|null}
 */
export function primaerBewerbung(b, rolle, { gespraechVorbeiOffen = false, hatEmail = true } = {}) {
  if (!b || Number(b.pseudonymisiert)) return null;
  const L = istLeitung(rolle);
  switch (b.status) {
    case "Eingegangen":
    case "Gesichtet":
      return darfBearbeiten(rolle) ? { id: "gespraech" } : null;
    case "Gespraech":
      if (gespraechVorbeiOffen) return darfBearbeiten(rolle) ? { id: "ergebnis" } : null;
      return L ? { id: "angebot" } : darfBearbeiten(rolle) ? { id: "neuerTermin" } : null;
    case "Angebot":
      return L ? { id: "einstellen" } : null;
    case "Abgesagt":
      return !hatEmail || b.absage_versand === "Post" ? { id: "absagebrief" } : null;
    case "Eingestellt":
      return b.mitarbeiter ? { id: "personalakte" } : null;
    default:
      return null;
  }
}

/** Löschfrist: Datum, Rest, Kennzeichen ab 14 Tagen vorher (Konzept § 5.5/§ 5.6). */
export function loeschfristInfo(b, heute) {
  if (Number(b?.pseudonymisiert)) return { zustand: "geloescht", datum: b.unterlagen_geloescht_am ? String(b.unterlagen_geloescht_am).slice(0, 10) : null };
  const bis = Number(b?.einwilligung_evidenz) && b?.einwilligung_evidenz_bis ? b.einwilligung_evidenz_bis : b?.loeschfrist;
  if (!bis) return { zustand: "offen", datum: null };
  const rest = tageZwischen(heute, bis);
  return { zustand: rest < 0 ? "faellig" : "laeuft", datum: bis, rest, warnung: rest <= LOESCHUHR_TAGE, aufbewahrung: Boolean(Number(b?.einwilligung_evidenz)) };
}

/** Ein Kennzeichen je Karte nach Vorrang: Gesprächstermin > Löschuhr > keine Unterlagen > Quelle. */
export function kartenKennzeichen(b, { naechstesGespraech = null, heute, jetzt = null } = {}) {
  if (naechstesGespraech) return { art: "gespraech", start: naechstesGespraech.start, modus: naechstesGespraech.modus };
  const l = loeschfristInfo(b, heute);
  if (l.zustand === "laeuft" && l.warnung) return { art: "loeschung", rest: l.rest, datum: l.datum };
  const ohneUnterlagen = b.quelle === "Website" && !(b.unterlagen || []).length;
  if (ohneUnterlagen && (!jetzt || !b.eingang || jetzt - new Date(String(b.eingang).replace(" ", "T")) > 10 * 60_000)) return { art: "ohneUnterlagen" };
  return { art: "quelle", quelle: b.quelle || "E-Mail" };
}

/** Eingestellt nur der letzten 90 Tage auf dem Board. */
export function aufBoard(b, heute) {
  if (b.status !== "Eingestellt") return true;
  const ent = String(b.entschieden_am || b.modified || "").slice(0, 10);
  return !ent || tageZwischen(ent, heute) <= EINGESTELLT_TAGE;
}

// --------------------------------------------------------------- Stellen --

/** § 9 Abs 2 GlBG – fehlende Entgelt-Bestandteile (gleich utils/glbg.py entgelt_fehlt). */
export function entgeltFehlt(s) {
  const fehlt = [];
  if (!(Number(s?.kv_mindest_brutto_cent) > 0)) fehlt.push("betrag");
  if (!["Monat", "Jahr", "Stunde"].includes(s?.entgelt_zeitraum)) fehlt.push("zeitraum");
  if (!String(s?.kollektivvertrag || "").trim()) fehlt.push("kollektivvertrag");
  if (!["ja", "nein"].includes(s?.ueberzahlung) && !String(s?.ueberzahlung_text || "").trim()) fehlt.push("ueberzahlung");
  return fehlt;
}
export const entgeltVollstaendig = (s) => entgeltFehlt(s).length === 0;

/** Entgelt-Satz (gleich logik.entgelt_text, deutsch). */
export function entgeltSatz(s) {
  if (!entgeltVollstaendig(s)) return "";
  // wie logik.euro(…, "de"): „€ 2.535,00“ mit normalem Leerzeichen
  const [ganz, bruch] = ((Number(s.kv_mindest_brutto_cent) || 0) / 100).toFixed(2).split(".");
  const euro = `€ ${ganz.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${bruch}`;
  const zusatz = String(s.ueberzahlung_text || "").trim() || (s.ueberzahlung === "ja" ? "Bereitschaft zur Überzahlung je nach Qualifikation und Erfahrung." : "");
  return `Das kollektivvertragliche Mindestentgelt beträgt ${euro} brutto pro ${s.entgelt_zeitraum} (${String(s.kollektivvertrag).trim()}). ${zusatz}`.trim();
}

/**
 * Checkliste vor dem Veröffentlichen (Workflow-Bedingung + pruefen() + Titelprüfung). `blockiert` = Workflow sperrt.
 * @returns {Array<{id:string, tab:string, feld:string, blockiert:boolean}>}
 */
export function stelleCheckliste(s) {
  const out = [];
  if (!entgeltVollstaendig(s)) out.push({ id: "entgelt", tab: "entgelt", feld: "kv_mindest_brutto_cent", blockiert: true, fehlt: entgeltFehlt(s) });
  if (!String(s?.stellenbeschreibung || "").trim()) out.push({ id: "beschreibung", tab: "stelle", feld: "stellenbeschreibung", blockiert: true });
  if (!(s?.aufgaben_de || []).length) out.push({ id: "aufgaben", tab: "stelle", feld: "aufgaben_de", blockiert: true });
  if (!(s?.anforderungen_de || []).length) out.push({ id: "anforderungen", tab: "stelle", feld: "anforderungen_de", blockiert: true });
  if (!pruefeTitel(s?.titel).neutral) out.push({ id: "titel", tab: "stelle", feld: "titel", blockiert: false });
  return out;
}
export const darfVeroeffentlichen = (s) => stelleCheckliste(s).every((c) => !c.blockiert);

/** Gültig bis: Rest, Ton (≤ 7 Tage Eiche, überschritten Ziegel). */
export function gueltigInfo(s, heute) {
  if (!s?.gueltig_bis) return null;
  const rest = tageZwischen(heute, s.gueltig_bis);
  return { rest, datum: s.gueltig_bis, ton: rest < 0 ? "danger" : rest <= 7 ? "warn" : null };
}

/** +60 Tage ab dem späteren von heute und gueltig_bis. */
export function verlaengert(s, heute, tage = 60) {
  const basis = s?.gueltig_bis && s.gueltig_bis > heute ? s.gueltig_bis : heute;
  return plusTage(basis, tage);
}

/** „Aktiv ohne Entgelt“ – einziges Rot bei Stellen. */
export const aktivOhneEntgelt = (s) => s?.status === "Aktiv" && !entgeltVollstaendig(s);

// ---------------------------------------------------------- Abwesenheit --

/**
 * Darf die Sitzung einen Antrag entscheiden? (Workflow-Bedingung gegen PH Mitarbeiter.user, Konzept § 5.8)
 * @returns {{darf:boolean, grund?:"eigen"|"angelegt"|"recht"|"status"}}
 */
export function antragEntscheidbar(a, { rolle, user, mitarbeiterUser, gleichGenehmigen = false }) {
  if (a?.status !== "Beantragt") return { darf: false, grund: "status" };
  if (!(rolle === "leitung" || rolle === "gf")) return { darf: false, grund: "recht" };
  if (mitarbeiterUser && mitarbeiterUser === user) return { darf: false, grund: "eigen" };
  if (!gleichGenehmigen && a.owner && a.owner === user) return { darf: false, grund: "angelegt" };
  return { darf: true };
}

/** Teamstärke an einem Tag: wie viele aus dem Team sind da (ohne Uhrzeiten). */
export function teamStaerke(team, mitarbeiter = [], abwesenheiten = [], tag) {
  const feld = `team_${team}`;
  const imTeam = mitarbeiter.filter((m) => Number(m[feld]) && m.status === "Aktiv");
  const weg = new Set(abwesenheiten.filter((a) => a.von <= tag && a.bis >= tag && a.status !== "Abgelehnt" && a.status !== "Storniert").map((a) => a.mitarbeiter));
  return { gesamt: imTeam.length, da: imTeam.filter((m) => !weg.has(m.name)).length };
}

/** Teams einer Person (Select-Flags). */
export function teamsVon(m) {
  return ["verkauf", "planung", "montage"].filter((t) => Number(m?.[`team_${t}`]));
}

/** Stornieren: Beantragt durch Antragsteller; Genehmigt vor Beginn mit Fähigkeit oder Leitung. */
export function darfStornieren(a, { eigen, rolle, heute, stornoGenehmigtSelbst = false }) {
  if (a?.status === "Beantragt") return eigen || istLeitung(rolle);
  if (a?.status === "Genehmigt") return istLeitung(rolle) || (eigen && stornoGenehmigtSelbst && a.von > heute);
  return false;
}

// ----------------------------------------------------------- Zeiterfassung --

/** Selbstservice korrigiert nur Buchungen von heute (E7, AZG § 26). */
export const selbstKorrigierbar = (b, heute) => String(b?.datum || "") === heute;
