// Service – fachliche Regeln, überall gleich (10-konzept-service §2.2, §3.1, §3.2, §3.4 D-1…D-3, §3.7).
// Reine Funktionen ohne Frappe; die Oberfläche (Liste, Akte, Heute-Leiste, Kennzahlen) nutzt nur diese Regeln.
// Reines Modul (keine "@/"-Importe), testbar mit node --test.

import { alsDatum, iso, tageBis } from "./fristen.js";
import { OFFEN } from "./labels.js";

const MITTEILUNG_ABSCHLUSS = /^Kunde informiert \(Abschluss\) per (Brief|Telefon|Persönlich)/;

function heuteIso(heute) {
  return iso(alsDatum(heute) || alsDatum(new Date()));
}

export function istOffen(fall) {
  return OFFEN.includes(fall?.status);
}

/** D-1 Reaktion überfällig: Gemeldet, keine Erstreaktion, Reaktionsfrist vor heute. */
export function reaktionUeberfaellig(fall, heute = new Date()) {
  if (fall?.status !== "Gemeldet" || fall?.erstreaktion_am || !fall?.frist_reaktion) return false;
  return String(fall.frist_reaktion).slice(0, 10) < heuteIso(heute);
}

/** Lieferant haftet (Feld oder Art Transportschaden). */
export function lieferantHaftet(fall) {
  return !!(Number(fall?.lieferantenrelevant) || fall?.art === "Transportschaden");
}

/**
 * D-2 Mängelanzeige offen: Lieferant haftet, Mangel bestätigt (Ja/Teilweise), Status Geprüft … Einsatz geplant,
 * kein Regress zum Fall und kein Verlaufseintrag „Kommunikation“ mit Vorlage regress.
 */
export function maengelanzeigeOffen(fall, { regresse = [], verlauf = fall?.verlauf || [] } = {}) {
  if (!lieferantHaftet(fall)) return false;
  if (!["Ja", "Teilweise"].includes(fall?.mangel_bestaetigt)) return false;
  if (!["Geprueft", "Entscheidung", "In Bearbeitung", "Einsatz geplant"].includes(fall?.status)) return false;
  if ((regresse || []).length || Number(fall?.regress_gefordert_cent) || ["Gemeldet", "Anerkannt", "Verrechnet"].includes(fall?.regress_status)) return false;
  return !(verlauf || []).some((v) => v.ereignis === "Kommunikation" && /regress|mängelanzeige/i.test(String(v.hinweis || "")));
}

/**
 * D-3 Abschluss mitgeteilt: Mail mit Vorlage „abschluss“ nach Erledigung, Abnahme bestätigt, oder erfasster Kanal
 * Brief/Telefon/Persönlich (Übergang bis A-S3: fester Kommentartext, §3.6).
 * @param {object} fall
 * @param {{verlauf?:object[], kommentare?:Array<{content:string, creation:string}>}} [ctx]
 */
export function abschlussMitgeteilt(fall, { verlauf = fall?.verlauf || [], kommentare = [] } = {}) {
  if (Number(fall?.abnahme_bestaetigt)) return true;
  const ab = String(fall?.erledigt_am || "").slice(0, 19);
  const nach = (zeit) => !ab || String(zeit || "") >= ab;
  if ((verlauf || []).some((v) => v.ereignis === "Kommunikation" && /abschluss/i.test(String(v.hinweis || "")) && nach(v.zeit))) return true;
  return (kommentare || []).some((k) => MITTEILUNG_ABSCHLUSS.test(String(k.content || "").replace(/<[^>]+>/g, "")) && nach(k.creation));
}

/** Text des Übergangs-Kommentars für Brief/Telefon/Persönlich (wird von abschlussMitgeteilt() erkannt). */
export function mitteilungsKommentar({ vorlage = "Abschluss", kanal, datum, person, notiz }) {
  return `Kunde informiert (${vorlage}) per ${kanal} am ${datum} (${person})${notiz ? `: ${notiz}` : ""}`;
}

/**
 * Lieferantenschritt offen (Zeile 8 oder 17 in §3.4): Mängelanzeige offen oder Erledigt + Lieferant haftet ohne Regress.
 */
export function lieferantenschrittOffen(fall, ctx = {}) {
  if (maengelanzeigeOffen(fall, ctx)) return "maengelanzeige";
  if (fall?.status === "Erledigt" && Number(fall?.lieferantenrelevant) && !(ctx.regresse || []).length && !Number(fall?.regress_gefordert_cent)) return "forderung";
  return null;
}

/**
 * Darf der Fall geschlossen werden? Mitarbeiter: D-3 + kein offener Lieferantenschritt; Leitung: immer (mit Hinweis).
 * @returns {{ok:boolean, grund:string|null, hinweis:string|null}}
 */
export function schliessbar(fall, { leitung = false, regresse = [], verlauf, kommentare, texte = SCHLIESSEN_TEXTE } = {}) {
  if (fall?.status !== "Erledigt") return { ok: false, grund: texte.nichtErledigt, hinweis: null };
  const lief = lieferantenschrittOffen(fall, { regresse, verlauf });
  const mitgeteilt = abschlussMitgeteilt(fall, { verlauf, kommentare });
  if (leitung) return { ok: true, grund: null, hinweis: lief ? texte.lieferantOffen(fall.regress_frist_bis) : !mitgeteilt ? texte.nichtMitgeteilt : null };
  if (!mitgeteilt) return { ok: false, grund: texte.nichtMitgeteilt, hinweis: null };
  if (lief) return { ok: false, grund: texte.lieferantOffen(fall.regress_frist_bis), hinweis: null };
  return { ok: true, grund: null, hinweis: null };
}

export const SCHLIESSEN_TEXTE = {
  nichtErledigt: "Schließen erst nach „Erledigt melden“",
  nichtMitgeteilt: "Schließen – erst nach Abschlussmitteilung oder Abnahme",
  lieferantOffen: (bis) => `Schließen nach „Forderung stellen“${bis ? ` (Regressfrist bis ${deutsch(bis)})` : ""}`,
};

function deutsch(isoText) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoText || ""));
  return m ? `${m[3]}.${m[2]}.` : "";
}

/**
 * Anspruchsstand bei Meldung (R-01, §3.2 Zeile 1). Stichtag = früheres Datum aus erstauftreten und gemeldet_am.
 * @returns {{zustand:"vermutung"|"gewaehrleistung"|"abgelaufen"|"unbekannt", stichtag:string|null, paragraf:string|null}}
 */
export function meldezustand(fall) {
  const a = alsDatum(fall?.erstauftreten);
  const g = alsDatum(fall?.gemeldet_am);
  const stich = a && g ? (a < g ? a : g) : a || g;
  const unternehmer = fall?.kundentyp === "Unternehmer";
  if (!stich || !fall?.gewaehrleistung_bis) return { zustand: "unbekannt", stichtag: iso(stich), paragraf: null };
  const s = iso(stich);
  if (fall.beweislast_bis && s <= String(fall.beweislast_bis).slice(0, 10)) return { zustand: "vermutung", stichtag: s, paragraf: unternehmer ? "§ 924 ABGB" : "§ 11 VGG" };
  if (s <= String(fall.gewaehrleistung_bis).slice(0, 10)) return { zustand: "gewaehrleistung", stichtag: s, paragraf: unternehmer ? "§ 933 ABGB" : "§ 10 VGG" };
  return { zustand: "abgelaufen", stichtag: s, paragraf: unternehmer ? "§ 933 ABGB" : "§ 10 VGG" };
}

/** Eine Eskalationszahl (Max beider Stufen, N5). */
export function eskalationsstufe(fall) {
  return Math.max(Number(fall?.eskalationsstufe) || 0, Number(fall?.sla_eskalationsstufe) || 0);
}

/**
 * Höchstens ein rotes Signal je Zeile (§2.2): Reaktionsfrist > Lösungsfrist > bei Meldung abgelaufen > Eskalation.
 * @returns {{art:string, text:string}|null}
 */
export function rotesSignal(fall, heute = new Date()) {
  if (!istOffen(fall)) return null;
  if (reaktionUeberfaellig(fall, heute) || Number(fall?.sla_reaktion_verletzt)) return { art: "reaktion", text: "Reaktionsfrist überschritten" };
  if (fall?.sla_status === "Verletzt" || Number(fall?.sla_loesung_verletzt)) return { art: "loesung", text: "Lösungsfrist überschritten" };
  if (meldezustand(fall).zustand === "abgelaufen") return { art: "meldung", text: "Bei Meldung abgelaufen" };
  const e = eskalationsstufe(fall);
  if (e > 0) return { art: "eskalation", text: `Eskalation ${e}` };
  return null;
}

/**
 * Gewährleistung kompakt (Liste, Kanban, Peek, D1): aus gewaehrleistung_bis, nie aus fristen_status.
 * @returns {{text:string, ton:"ok"|"warn"|"abgelaufen"|"leer"}}
 */
export function gewaehrleistungKompakt(fall, heute = new Date(), warnTage = 60) {
  if (["Erledigt", "Geschlossen", "Abgelehnt"].includes(fall?.status)) return { text: "", ton: "leer" };
  if (!fall?.gewaehrleistung_bis) return { text: "Übergabe fehlt", ton: "leer" };
  const t = tageBis(fall.gewaehrleistung_bis, heute);
  if (t === null) return { text: "", ton: "leer" };
  if (t < 0) return { text: t === -1 ? "seit 1 Tag abgelaufen" : `seit ${-t} Tagen abgelaufen`, ton: "abgelaufen" };
  if (t === 0) return { text: "endet heute", ton: "warn" };
  return { text: t === 1 ? "noch 1 Tag" : `noch ${t} Tage`, ton: t <= warnTage ? "warn" : "ok" };
}

/** Fälligkeit „Nächster Schritt“: überfällig → gefahr, ≤ 3 Tage → bald, sonst ruhig. */
export function faelligkeitTon(faellig, heute = new Date()) {
  if (!faellig) return "ruhig";
  const t = tageBis(faellig, heute);
  if (t === null) return "ruhig";
  if (t < 0) return "gefahr";
  if (t <= 3) return "bald";
  return "ruhig";
}

/** Gewährleistung endet in ≤ n Tagen (offen, noch nicht vorbei). */
export function gewaehrleistungEndetBald(fall, tage, heute = new Date()) {
  if (!istOffen(fall) || !fall?.gewaehrleistung_bis) return false;
  const t = tageBis(fall.gewaehrleistung_bis, heute);
  return t !== null && t >= 0 && t <= tage;
}

/** Regressfrist ≤ 14 Tage und noch nicht gewahrt (Offen/Gemeldet). */
export function regressFristKritisch(regress, heute = new Date(), tage = 14) {
  if (!["Offen", "Gemeldet"].includes(regress?.status) || !regress?.frist_bis) return false;
  const t = tageBis(regress.frist_bis, heute);
  return t !== null && t <= tage;
}

/** Kostenhinweis nötig (A14, R-11). */
export function kostenhinweisNoetig(fall) {
  if (!fall) return false;
  return meldezustand(fall).zustand === "abgelaufen" || ["Serviceauftrag", "Pflegefrage"].includes(fall.art) || fall.kundenwunsch === "Beratung";
}

/**
 * Banner-Kandidaten der Akte nach Rang (§3.1, höchstens einer sichtbar, weitere als „+ n weitere Hinweise“).
 * @returns {Array<{rang:number, id:string, ton:"gefahr"|"warnung"|"info"|"neutral", titel:string, text?:string, aktion?:string}>}
 */
export function bannerKandidaten(fall, { regresse = [], leitung = false, heute = new Date() } = {}) {
  const out = [];
  const betrag = (c) => euro(c);
  if (fall?.kulanz_freigabe_status === "Angefordert") {
    out.push({ rang: 1, id: "kulanz-wartet", ton: "info", titel: `Kulanz ${betrag(fall.kulanz_cent)} wartet auf Freigabe der Leitung`, text: fall.kulanz_angefordert_am ? `angefragt ${zeitText(fall.kulanz_angefordert_am)}` : undefined, aktion: leitung ? "kulanz-freigeben" : "kulanz-erneut" });
  } else if (fall?.kulanz_freigabe_status === "Abgelehnt") {
    out.push({ rang: 1, id: "kulanz-abgelehnt", ton: "warnung", titel: `Kulanz ${betrag(fall.kulanz_abgelehnt_cent || fall.kulanz_cent)} abgelehnt`, text: fall.kulanz_freigabe_kommentar || undefined, aktion: "entscheidung-aendern" });
  }
  if (reaktionUeberfaellig(fall, heute)) out.push({ rang: 2, id: "reaktion", ton: "gefahr", titel: "Reaktionsfrist überschritten", text: `Kunde noch nicht kontaktiert – Frist war ${deutschLang(fall.frist_reaktion)}.`, aktion: "erstreaktion" });
  if (maengelanzeigeOffen(fall, { regresse })) out.push({ rang: 3, id: "maengelanzeige", ton: "warnung", titel: "Mängelanzeige an den Lieferanten offen", text: "Nach der Prüfung ohne Verzögerung senden.", aktion: "maengelanzeige" });
  for (const r of regresse || []) {
    if (regressFristKritisch(r, heute)) out.push({ rang: 4, id: `regress-${r.name}`, ton: "gefahr", titel: `Regressfrist bis ${deutschLang(r.frist_bis)}`, text: "Gemeldet gilt nicht als gewahrt – erst mit Anerkenntnis oder Klage.", aktion: "regress" });
  }
  if (istOffen(fall) && meldezustand(fall).zustand === "abgelaufen") out.push({ rang: 5, id: "meldung-abgelaufen", ton: "warnung", titel: "Bei Meldung war die Gewährleistung abgelaufen", text: "Kulanz oder kostenpflichtig prüfen." });
  if (fall?.quelle === "website" && !Number(fall?.portal_sichtbar)) out.push({ rang: 7, id: "zuordnung", ton: "info", titel: "Meldung über die Website – Zuordnung prüfen", text: fall.kunde_email ? `Mit E-Mail ${fall.kunde_email} – gehört sie zu ${fall.kunde_name || "diesem Kontakt"}?` : undefined, aktion: "zuordnung" });
  return out.sort((a, b) => a.rang - b.rang);
}

function euro(c) {
  const n = Number(c) || 0;
  return `${(n / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function zeitText(wert) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(wert || ""));
  return m ? `am ${m[3]}.${m[2]}. um ${m[4]}:${m[5]}` : "";
}

function deutschLang(wert) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(wert || ""));
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "–";
}

/** Zähler für utils/schritte (wie _fall_zaehler in api/__init__.py) aus geladenen Teil-Listen. */
export function fallZaehler(name, { ersatzteile = [], einsaetze = [], regresse = [], bestellungen = [] } = {}) {
  const z = { ersatzteile_benoetigt: 0, ersatzteile_offen: 0, einsaetze_offen: 0, regress_vorhanden: 0, naechster_einsatz: null, ersatzteile_erwartet_am: null };
  for (const r of ersatzteile) {
    if (r.status === "Benoetigt" && !r.bestellung) z.ersatzteile_benoetigt += 1;
    else if (r.status === "Bestellt") z.ersatzteile_offen += 1;
  }
  const offen = einsaetze.filter((e) => e.servicefall === name && ["Geplant", "Bestaetigt", "Unterwegs", "In Arbeit"].includes(e.status)).sort((a, b) => String(a.datum).localeCompare(String(b.datum)));
  z.einsaetze_offen = offen.length;
  z.naechster_einsatz = offen[0]?.datum || null;
  z.regress_vorhanden = regresse.some((r) => r.servicefall === name) ? 1 : 0;
  const erw = bestellungen.filter((b) => b.servicefall === name && ["Gesendet", "Bestaetigt", "Teilgeliefert"].includes(b.status) && b.erwartet_am).sort((a, b) => String(a.erwartet_am).localeCompare(String(b.erwartet_am)));
  z.ersatzteile_erwartet_am = erw[0]?.erwartet_am || null;
  return z;
}
