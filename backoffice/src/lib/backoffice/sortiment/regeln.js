// Bereich Sortiment – reine Fachregeln (10-konzept-sortiment § 0.1, § 5, § 15, § 20.1 „regeln.js“).
// Ohne React, ohne Server: unit-getestet in tests/unit/sortiment-regeln.test.mjs. Die AB-Abgleichsregeln sind
// eine Übertragung von ph_sortiment/logik/abgleich.py (gleiche Toleranzen, gleiche Texte), damit die Oberfläche
// vorher anzeigt, was der Server danach feststellt.

import { CHECKLISTE } from "./texte.js";

const TAG_MS = 86_400_000;

/** ISO-Datum (JJJJ-MM-TT) in Ortszeit. */
export function isoTag(d = new Date()) {
  const x = d instanceof Date ? d : new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

function alsDatum(v) {
  if (!v) return null;
  if (v instanceof Date) return new Date(v.getFullYear(), v.getMonth(), v.getDate());
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v));
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

/** Ganze Tage von a nach b (b − a), null bei fehlendem Datum. */
export function tageZwischen(a, b) {
  const x = alsDatum(a);
  const y = alsDatum(b);
  if (!x || !y) return null;
  return Math.round((y - x) / TAG_MS);
}

/** Datum + n Tage als ISO. */
export function plusTage(datum, n) {
  const d = alsDatum(datum);
  if (!d) return null;
  d.setDate(d.getDate() + n);
  return isoTag(d);
}

/** Stand + Monate, Monatsende korrekt (31.01. + 1 Monat → 28./29.02.). */
export function plusMonate(datum, monate) {
  const d = alsDatum(datum);
  if (!d) return null;
  const tag = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + monate);
  const letzter = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(tag, letzter));
  return isoTag(d);
}

// ------------------------------------------------------------------ Preise --

/** Gültig bis eines Preises: Stand + Monate je Preisart aus den Einstellungen (Standard 12 bzw. 6). */
export function gueltigBis(stand, preisart, einst = {}) {
  if (!stand) return null;
  const monate = preisart === "UVP" ? Number(einst.preis_max_monate_uvp) || 6 : Number(einst.preis_max_monate_verkaufspreis) || 12;
  return plusMonate(stand, monate);
}

/** USt-Satz in Prozent aus der Klasse (heute normal/ermaessigt, nach AS8 20/13/10/0). */
export function ustSatz(klasse) {
  if (klasse === null || klasse === undefined || klasse === "") return null;
  const k = String(klasse);
  if (k === "normal") return 20;
  if (/^(20|13|10|0)$/.test(k)) return Number(k);
  return null; // „ermaessigt“: Satz offen (13 oder 10) – nicht raten
}

/** Brutto → netto in Cent (kaufmännisch gerundet). */
export function bruttoZuNetto(cent, satz) {
  if (!Number.isFinite(cent) || !Number.isFinite(satz)) return null;
  return Math.round((cent * 100) / (100 + satz));
}

/** Netto → brutto in Cent. */
export function nettoZuBrutto(cent, satz) {
  if (!Number.isFinite(cent) || !Number.isFinite(satz)) return null;
  return Math.round((cent * (100 + satz)) / 100);
}

/**
 * Zustand des aktuellen Preises für Liste/Akte (§ 3.2 Spalte „Preis ab“):
 * { art: "kein"|"anfrage"|"ok"|"laeuftAb"|"veraltet", cent, stand, bis }
 */
export function preisZustand(p, { jetzt = new Date(), einst = {} } = {}) {
  if (!p) return { art: "kein" };
  if (p.preisart === "Auf Anfrage") return { art: "anfrage" };
  const cent = Number.isFinite(p.aktueller_preis_cent) && p.aktueller_preis_cent > 0 ? p.aktueller_preis_cent : null;
  if (!cent) return { art: "kein" };
  const stand = p.aktueller_preis_stand || null;
  const bis = gueltigBis(stand, p.preisart, einst);
  const heute = isoTag(jetzt);
  if (p.preisstand_alt || (bis && bis < heute)) return { art: "veraltet", cent, stand, bis };
  const rest = bis ? tageZwischen(heute, bis) : null;
  if (rest !== null && rest <= 30) return { art: "laeuftAb", cent, stand, bis };
  return { art: "ok", cent, stand, bis };
}

/**
 * Niedrigster freigegebener Preis der letzten 30 Tage vor `heute` (PrAG § 9a), je Ausführung.
 * null, wenn die Geschichte keine 30 Tage abdeckt (dann ist eine Ermäßigung nicht bewerbbar).
 */
export function tiefstpreis30(preise = [], { ausfuehrung = "", heute = new Date(), preisart = null } = {}) {
  const tag = isoTag(heute);
  const von = plusTage(tag, -30);
  const zeilen = preise
    .filter((x) => x && x.freigegeben && (x.ausfuehrung || "") === (ausfuehrung || "") && x.preisart !== "Angebot" && (!preisart || x.preisart === preisart))
    .map((x) => ({ ab: x.ab || x.stand, cent: Number(x.brutto_cent) }))
    .filter((x) => x.ab && Number.isFinite(x.cent))
    .sort((a, b) => String(a.ab).localeCompare(String(b.ab)));
  if (!zeilen.length || zeilen[0].ab > von) return null;
  // gültiger Preis am Fenster-Anfang + alle Änderungen im Fenster
  let start = null;
  const imFenster = [];
  for (const z of zeilen) {
    if (z.ab <= von) start = z;
    else if (z.ab <= tag) imFenster.push(z);
  }
  const kandidaten = [start, ...imFenster].filter(Boolean);
  return kandidaten.length ? Math.min(...kandidaten.map((z) => z.cent)) : null;
}

// ------------------------------------------------------------------ Bilder --

/** Bildzustand eines Produkts: { art: "kein"|"alle"|"teil"|"keins-frei", frei, n } */
export function bilderZustand(p) {
  const bilder = Array.isArray(p?.bilder) ? p.bilder : null;
  const n = bilder ? bilder.length : Number(p?.bilder_anzahl) || 0;
  const offen = bilder ? bilder.filter((b) => (b.freigabe || "offen") !== "erteilt").length : Number(p?.bilder_offen) || 0;
  const frei = Math.max(0, n - offen);
  if (!n) return { art: "kein", frei: 0, n: 0 };
  if (frei === n) return { art: "alle", frei, n };
  if (frei === 0) return { art: "keins-frei", frei, n };
  return { art: "teil", frei, n };
}

// ------------------------------------------------------- Checkliste / Sperre --

/**
 * Checkliste „Bereit für Website“ (§ 4.1). Jeder Punkt: { id, titel, ok, sperrt } – `sperrt` = Blocker für
 * „Veröffentlichen“ (Workflow-Bedingung + UI-Blocker § 5.1); Preis/Lieferzeit sind Website-Bedingungen.
 */
export function checkliste(p, { marke = null, kategorie = null } = {}) {
  const ust = kategorie ? ustSatz(kategorie.ust_klasse) : ustSatz(p?.ust_klasse);
  const grundpreisPflicht = !!kategorie?.grundpreis_pflicht;
  const punkte = [
    { id: "marke", titel: CHECKLISTE.marke, ok: !!p?.marke, sperrt: true },
    { id: "markeAktiv", titel: CHECKLISTE.markeAktiv, ok: !!marke && marke.status === "Aktiv", sperrt: true },
    { id: "kategorie", titel: CHECKLISTE.kategorie, ok: !!p?.kategorie, sperrt: true },
    { id: "text", titel: CHECKLISTE.text, ok: !!(String(p?.kurz_de || "").trim() || String(p?.beschreibung_de || "").trim()), sperrt: true },
    { id: "bild", titel: CHECKLISTE.bild, ok: !!p?.bild_freigegeben, sperrt: true },
    { id: "ust", titel: CHECKLISTE.ust, ok: ust !== null, sperrt: true },
  ];
  if (grundpreisPflicht) punkte.push({ id: "grundpreis", titel: CHECKLISTE.grundpreis, ok: !!(p?.grundpreis_einheit && p?.grundpreis_menge), sperrt: true });
  punkte.push({ id: "preis", titel: CHECKLISTE.preis, ok: p?.preisart === "Auf Anfrage" || (Number(p?.aktueller_preis_cent) > 0 && !p?.preisstand_alt), sperrt: false });
  if (p?.verkauf_online) punkte.push({ id: "lieferzeit", titel: CHECKLISTE.lieferzeit, ok: !!p?.lieferzeit_freigegeben || !!p?.sofort_lieferbar, sperrt: false });
  return punkte;
}

/** Zeigt die Website das Produkt? (Leitsatz 8) */
export function aufWebsite(p) {
  return p?.status === "Aktiv" && p?.website_sichtbar !== 0 && !!p?.bild_freigegeben && (p?.preisart === "Auf Anfrage" || (Number(p?.aktueller_preis_cent) > 0 && !p?.preisstand_alt));
}

/** Workflow-Aktionen je Status (Wert wie workflow.json) mit Rolle. */
export const PRODUKT_UEBERGAENGE = Object.freeze([
  { von: "Entwurf", aktion: "Prüfen", nach: "Geprueft", leitung: false },
  { von: "Geprueft", aktion: "Veröffentlichen", nach: "Aktiv", leitung: true },
  { von: "Geprueft", aktion: "Zurück auf Entwurf", nach: "Entwurf", leitung: false },
  { von: "Aktiv", aktion: "Pausieren", nach: "Pausiert", leitung: false },
  { von: "Aktiv", aktion: "Auslaufen lassen", nach: "Ausgelaufen", leitung: true },
  { von: "Pausiert", aktion: "Reaktivieren", nach: "Aktiv", leitung: true },
  { von: "Pausiert", aktion: "Auslaufen lassen", nach: "Ausgelaufen", leitung: true },
  { von: "Pausiert", aktion: "Zurück auf Entwurf", nach: "Entwurf", leitung: true },
  { von: "Ausgelaufen", aktion: "Zurück auf Entwurf", nach: "Entwurf", leitung: true },
]);

/** Erlaubte Produkt-Übergänge für die Rolle (ohne Bedingungsprüfung). */
export function produktUebergaenge(status, { leitung = false } = {}) {
  return PRODUKT_UEBERGAENGE.filter((t) => t.von === status && (leitung || !t.leitung));
}

/**
 * Sperrgrund einer Produkt-Aktion als Klartext oder null (§ 5.1 „Sperrtext“).
 * @param {object} p Produkt  @param {string} aktion Workflow-Aktion  @param {{marke?, kategorie?, leitung?}} ctx
 */
export function sperrgrund(p, aktion, { marke = null, kategorie = null, leitung = false } = {}) {
  const t = PRODUKT_UEBERGAENGE.find((x) => x.von === p?.status && x.aktion === aktion);
  if (!t) return "In diesem Zustand nicht möglich";
  if (t.leitung && !leitung) return "Nur Leitung Sortiment";
  const fehlt = [];
  if (aktion === "Prüfen") {
    if (!p.kategorie) fehlt.push("Kategorie");
    if (!p.marke) fehlt.push("Marke");
    if (!String(p.kurz_de || "").trim() && !String(p.beschreibung_de || "").trim()) fehlt.push("deutscher Text");
  }
  if (aktion === "Veröffentlichen") {
    for (const c of checkliste(p, { marke, kategorie })) if (c.sperrt && !c.ok) fehlt.push(KURZ[c.id] || c.titel);
  }
  if (aktion === "Reaktivieren" && !p.bild_freigegeben) fehlt.push("freigegebenes Bild");
  return fehlt.length ? `Fehlt: ${fehlt.join(", ")}` : null;
}

const KURZ = { marke: "Marke", markeAktiv: "Marke aktiv", kategorie: "Kategorie", text: "deutscher Text", bild: "freigegebenes Bild", ust: "USt-Satz", grundpreis: "Grundpreis" };

/** Vorprüfung für „Veröffentlichen“ (Dialog „n möglich – m gesperrt“). */
export function vorpruefung(produkte, aktion, lookup = {}) {
  const moeglich = [];
  const gesperrt = [];
  for (const p of produkte) {
    const grund = sperrgrund(p, aktion, { marke: lookup.marke?.(p.marke), kategorie: lookup.kategorie?.(p.kategorie), leitung: lookup.leitung });
    if (grund) gesperrt.push({ name: p.name, titel: p.titel || p.name_herstellerbezeichnung || p.name, grund });
    else moeglich.push(p.name);
  }
  return { moeglich, gesperrt };
}

/** Löschen nur bei Entwürfen ohne Folgen (E7, BAO § 132). */
export function darfLoeschen(doc, doctype) {
  if (!doc) return false;
  if (doctype === "PH Produkt") return doc.status === "Entwurf" && !(doc.preise || []).length && !doc.veroeffentlicht_am;
  if (doctype === "PH Herstellerbestellung") return doc.status === "Entwurf" && !doc.gesendet_am && !(doc.uebermittlungen || []).length;
  if (doctype === "PH Preisliste Import") return doc.status === "Hochgeladen";
  if (doctype === "PH Wareneingang") return false;
  return false;
}

// --------------------------------------------------------- Stammdaten-Hilfen --

/** EAN-8/EAN-13/GTIN-14: Prüfziffer Modulo 10. Leer → true (optional). */
export function eanGueltig(ean) {
  const s = String(ean || "").trim();
  if (!s) return true;
  if (!/^\d{8}$|^\d{12,14}$/.test(s)) return false;
  const ziffern = s.split("").map(Number);
  const pruef = ziffern.pop();
  const summe = ziffern.reverse().reduce((a, z, i) => a + z * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (summe % 10)) % 10 === pruef;
}

/** Web-Slug: Kleinbuchstaben, Umlaute ausgeschrieben, Bindestriche. */
export function slugVon(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Web-Adresse eines neuen Produkts (§ 3.3): /produkte/<kategorie>/<marke>-<bezeichnung>. */
export function webAdresse({ kategorie, marke, bezeichnung }) {
  const k = slugVon(kategorie);
  const p = slugVon(`${marke || ""} ${bezeichnung || ""}`);
  if (!p) return null;
  return k ? `/produkte/${k}/${p}` : `/produkte/${p}`;
}

/** Produkt-Slug (Name des Datensatzes) aus Marke + Bezeichnung. */
export function produktSlug({ marke, bezeichnung }) {
  return slugVon(`${marke || ""} ${bezeichnung || ""}`);
}

/** Geschützte Händlerwörter (Claim-Guard): nur mit passendem Händlerstatus der Marke erlaubt. */
export const HAENDLERWOERTER = Object.freeze([
  { wort: "Vertragshändler", erlaubt: ["Vertragshaendler", "Exklusiv", "Partner"] },
  { wort: "autorisierter Händler", erlaubt: ["Haendler", "Vertragshaendler", "Exklusiv", "Partner"] },
  { wort: "offizieller Händler", erlaubt: ["Haendler", "Vertragshaendler", "Exklusiv", "Partner"] },
  { wort: "Exklusivhändler", erlaubt: ["Exklusiv"] },
  { wort: "Studio", erlaubt: ["Exklusiv", "Partner"] },
]);

/** Treffer geschützter Wörter im Text, die der Händlerstatus nicht deckt. */
export function haendlerwortTreffer(text, haendlerstatus = "Keiner") {
  const t = String(text || "").toLowerCase();
  if (!t) return [];
  return HAENDLERWOERTER.filter((h) => t.includes(h.wort.toLowerCase()) && !h.erlaubt.includes(haendlerstatus)).map((h) => h.wort);
}

// ------------------------------------------------------------ Bestellungen --

/** Restmengen je Position (stornierte ausgelassen): Rest = (ab_menge oder menge) − menge_erhalten. */
export function restmengen(bestellung) {
  return (bestellung?.positionen || [])
    .map((p, i) => {
      const idx = p.idx || i + 1;
      const soll = p.ab_menge !== null && p.ab_menge !== undefined && p.ab_menge !== "" && Number(p.ab_menge) > 0 ? Number(p.ab_menge) : Number(p.menge) || 0;
      const erhalten = Number(p.menge_erhalten) || 0;
      return { idx, produkt: p.produkt || "", bezeichnung: p.bezeichnung || "", ausfuehrung_text: p.ausfuehrung_text || "", soll, erhalten, rest: Math.max(0, soll - erhalten), storniert: p.status === "Storniert" };
    })
    .filter((r) => !r.storniert);
}

/** Wareneingang je Position: Differenz und Kennzeichen (logik/abgleich.mengen_abgleich). */
export function mengenAbgleich(erwartet, erhalten) {
  const d = (Number(erhalten) || 0) - (Number(erwartet) || 0);
  return { differenz: d, abweichung: d === 0 ? "keine" : d > 0 ? "Ueberlieferung" : "Unterlieferung" };
}

/** Status eines Wareneingangs aus den Positionen. */
export function weStatusAus(positionen = []) {
  if (positionen.some((p) => p.zustand && p.zustand !== "ok" && p.zustand !== "fehlt")) return "Reklamiert";
  if (positionen.some((p) => p.zustand === "falsch")) return "Reklamiert";
  const erwartet = positionen.reduce((a, p) => a + (Number(p.menge_erwartet) || 0), 0);
  const erhalten = positionen.reduce((a, p) => a + (Number(p.menge_erhalten) || 0), 0);
  if (!erhalten) return "Offen";
  return erhalten >= erwartet ? "Vollstaendig" : "Teilweise";
}

/** Bestellstatus nach Lieferung ('Geliefert' | 'Teilgeliefert' | null). */
export function bestellstatusAusMengen(positionen = []) {
  const aktiv = positionen.filter((p) => p.status !== "Storniert");
  if (!aktiv.length) return null;
  const soll = aktiv.reduce((a, p) => a + (Number(p.ab_menge) > 0 ? Number(p.ab_menge) : Number(p.menge) || 0), 0);
  const ist = aktiv.reduce((a, p) => a + (Number(p.menge_erhalten) || 0), 0);
  if (soll && ist >= soll) return "Geliefert";
  if (ist > 0) return "Teilgeliefert";
  return null;
}

function centText(v) {
  return `${(Number(v) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function datumText(v) {
  const d = alsDatum(v);
  return d ? `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}` : "–";
}

function normText(v) {
  return String(v || "").replace(/,/g, " ").split(/\s+/).filter(Boolean).join(" ").toLocaleLowerCase("de");
}

function vorzeichen(n, nachkomma = 0) {
  const s = Math.abs(n).toLocaleString("de-DE", { minimumFractionDigits: nachkomma, maximumFractionDigits: nachkomma });
  return `${n < 0 ? "−" : "+"}${s}`;
}

/**
 * Abweichungen einer Position (wie logik/abgleich.abweichungen_position). Leere AB-Felder werden nicht verglichen.
 * @returns {Array<{position:number, produkt:string, bezeichnung:string, feld:string, bestellt:string, bestaetigt:string, abweichung_text:string, bewertung:"offen"}>}
 */
export function abweichungenPosition(pos, idx, { toleranzPreis = 0, toleranzTermin = 0 } = {}) {
  const z = [];
  const basis = { position: idx, produkt: pos.produkt || "", bezeichnung: pos.bezeichnung || "", bewertung: "offen" };
  if (pos.ab_menge !== null && pos.ab_menge !== undefined && pos.ab_menge !== "") {
    const soll = Number(pos.menge) || 0;
    const ist = Number(pos.ab_menge) || 0;
    if (soll !== ist) z.push({ ...basis, feld: "Menge", bestellt: String(soll), bestaetigt: String(ist), abweichung_text: `${vorzeichen(ist - soll)} Stk` });
  }
  if (pos.ab_ek_cent !== null && pos.ab_ek_cent !== undefined && pos.ab_ek_cent !== "" && pos.ek_cent !== null && pos.ek_cent !== undefined && pos.ek_cent !== "") {
    const soll = Number(pos.ek_cent);
    const ist = Number(pos.ab_ek_cent);
    if (soll !== ist) {
      const prozent = soll ? ((ist - soll) * 100) / soll : 100;
      if (Math.abs(prozent) > toleranzPreis) z.push({ ...basis, feld: "Preis", bestellt: centText(soll), bestaetigt: centText(ist), abweichung_text: `${vorzeichen((ist - soll) / 100, 2)} € (${vorzeichen(prozent, 1)} %)` });
    }
  }
  if (pos.bestaetigter_termin && pos.wunschtermin) {
    const tage = tageZwischen(pos.wunschtermin, pos.bestaetigter_termin);
    if (tage !== null && tage > toleranzTermin) z.push({ ...basis, feld: "Termin", bestellt: datumText(pos.wunschtermin), bestaetigt: datumText(pos.bestaetigter_termin), abweichung_text: `${vorzeichen(tage)} Tage` });
  }
  if (pos.ab_artikelnr && pos.hersteller_artikelnr) {
    const a = String(pos.hersteller_artikelnr).trim().toUpperCase();
    const b = String(pos.ab_artikelnr).trim().toUpperCase();
    if (a !== b) z.push({ ...basis, feld: "Artikel", bestellt: a, bestaetigt: b, abweichung_text: "Artikelnummer weicht ab" });
  }
  if (pos.ab_ausfuehrung_text && pos.ausfuehrung_text && normText(pos.ab_ausfuehrung_text) !== normText(pos.ausfuehrung_text)) {
    z.push({ ...basis, feld: "Ausfuehrung", bestellt: String(pos.ausfuehrung_text).slice(0, 140), bestaetigt: String(pos.ab_ausfuehrung_text).slice(0, 140), abweichung_text: "Ausführung weicht ab" });
  }
  return z;
}

/** Kennzeichen einer Position aus ihren Protokollzeilen. */
export function abweichungKennzeichen(zeilen) {
  const felder = [...new Set(zeilen.map((z) => z.feld))];
  if (!felder.length) return "keine";
  return felder.length === 1 ? felder[0] : "Mehrfach";
}

/** Gesamter Abgleich: { protokoll, kennzeichen{idx}, spaetester } */
export function abgleich(positionen = [], toleranz = {}) {
  const protokoll = [];
  const kennzeichen = {};
  let spaetester = null;
  positionen.forEach((p, i) => {
    const idx = i + 1;
    const z = abweichungenPosition(p, idx, toleranz);
    protokoll.push(...z);
    kennzeichen[idx] = abweichungKennzeichen(z);
    if (p.bestaetigter_termin && (!spaetester || p.bestaetigter_termin > spaetester)) spaetester = p.bestaetigter_termin;
  });
  return { protokoll, kennzeichen, spaetester };
}

/** Offene Protokollzeilen (offen/pruefen). */
export function offeneAbweichungen(protokoll = []) {
  return protokoll.filter((z) => ["offen", "pruefen"].includes(z.bewertung || "offen")).length;
}

/** Klärung → [bewertung, vermerk] (logik/abgleich.KLAERUNG). */
export const KLAERUNG = Object.freeze({
  akzeptieren: ["ok", "akzeptiert"],
  lieferant_reklamieren: ["pruefen", "beim Lieferanten reklamiert"],
  kunde_rueckfragen: ["pruefen", "Kundenrückfrage"],
});

/** Darf die Rolle die Bewertung setzen? Ablehnen nur Leitung; Preis akzeptieren nur Leitung. */
export function bewertungErlaubt(bewertung, feld, { leitung = false } = {}) {
  if (bewertung === "abgelehnt" && !leitung) return false;
  if (bewertung === "ok" && feld === "Preis" && !leitung) return false;
  return ["offen", "ok", "pruefen", "abgelehnt"].includes(bewertung);
}

/** Mailtext an den Lieferanten zu Abweichungen (logik/abgleich.reklamation_text). */
export function reklamationText(zeilen, bestellung, abNummer = "", zusatz = "") {
  const punkte = zeilen.map((z) => `- Pos. ${z.position} ${z.bezeichnung || ""}: ${z.feld} bestellt ${z.bestellt}, bestätigt ${z.bestaetigt}`).join("\n");
  return `Sehr geehrte Damen und Herren,\n\nIhre Auftragsbestätigung ${abNummer || ""} zu unserer Bestellung ${bestellung} weicht von unserer Bestellung ab:\n${punkte}\n\n${zusatz ? `${zusatz}\n\n` : ""}Bitte korrigieren Sie die Auftragsbestätigung oder nehmen Sie kurz Stellung.\n\nMit freundlichen Grüßen\nPlatzhirsch Home Living`;
}

/**
 * Sperrgrund einer Bestell-Aktion (§ 5.2) oder null.
 * aktionen: senden · abEinlesen · abBestaetigen · eingang · abschliessen · stornieren · exportieren
 */
export function bestellSperrgrund(b, aktion, { leitung = false, lieferant = null } = {}) {
  if (!b) return "Nicht gefunden";
  const s = b.status;
  switch (aktion) {
    case "senden":
      if (s !== "Entwurf") return "Nur Entwürfe können gesendet werden";
      if (!b.lieferant) return "Erst einen Lieferanten zuordnen";
      if (!(b.positionen || []).length) return "Ohne Positionen kann nicht gesendet werden";
      if (lieferant && !lieferant.bestell_email) return "Bestell-E-Mail des Lieferanten fehlt";
      return null;
    case "abEinlesen":
      return s === "Gesendet" || s === "AB erhalten" ? null : "AB einlesen geht nur bei gesendeten Bestellungen";
    case "abBestaetigen":
      if (s !== "AB erhalten") return "Nur nach erhaltener AB";
      if (!leitung && Number(b.abweichungen_anzahl) > 0) return "Mit Abweichungen bestätigt die Leitung";
      if (Number(b.abweichungen_offen) > 0) return `${b.abweichungen_offen} Abweichungen offen`;
      if (!b.ab_vollstaendig) return "AB unvollständig – nicht jede Position ist bestätigt";
      return null;
    case "eingang":
      return ["AB geprueft", "Teilgeliefert"].includes(s) ? (b.lieferadresse === "Kunde direkt" ? "Streckenlieferung – kein Wareneingang im Haus" : null) : "Wareneingang erst nach bestätigter AB";
    case "abschliessen":
      if (s !== "Geliefert") return "Erst wenn alles geliefert ist";
      return Number(b.abweichungen_offen) > 0 ? `${b.abweichungen_offen} Abweichungen offen` : null;
    case "stornieren":
      if (s === "Entwurf") return null;
      if (["Abgeschlossen", "Storniert", "Geliefert", "Teilgeliefert"].includes(s)) return "In diesem Zustand nicht möglich";
      return leitung ? null : "Gesendete Bestellungen storniert die Leitung";
    case "exportieren":
      return (b.positionen || []).length ? null : "Bestellung ohne Positionen";
    default:
      return "Unbekannte Aktion";
  }
}

/** Primäraktion einer Bestellung je Zustand (Leitsatz 4: genau eine). */
export function bestellPrimaer(b) {
  switch (b?.status) {
    case "Entwurf":
      return b.lieferant ? "senden" : "lieferant";
    case "Gesendet":
      return "abEinlesen";
    case "AB erhalten":
      return Number(b.abweichungen_offen) > 0 ? "klaeren" : "abBestaetigen";
    case "AB geprueft":
    case "Teilgeliefert":
      return b.lieferadresse === "Kunde direkt" ? "strecke" : "eingang";
    case "Geliefert":
      return "abschliessen";
    default:
      return null;
  }
}

/** Schritte der Bestellkette mit Zustand für die Vorgangsleiste. */
export function bestellKette(b) {
  const reihen = ["Entwurf", "Gesendet", "AB erhalten", "AB geprueft", "Teilgeliefert", "Geliefert", "Abgeschlossen"];
  const i = reihen.indexOf(b?.status);
  const storniert = b?.status === "Storniert";
  const schritt = (id, ab, bis = ab) => {
    if (storniert) return { id, zustand: "uebersprungen" };
    if (i > bis) return { id, zustand: "erledigt" };
    if (i >= ab && i <= bis) return { id, zustand: id === "abschluss" && i === 6 ? "erledigt" : "aktuell" };
    return { id, zustand: "offen" };
  };
  return [schritt("bestellung", 0), schritt("gesendet", 1), schritt("ab", 2), schritt("abBestaetigt", 3), schritt("wareneingang", 4, 5), schritt("abschluss", 6)];
}

/** Tage seit dem Senden ohne AB (für „AB einlesen“, Frist aus dem Lieferanten). */
export function abUeberfaellig(b, { frist = 5, jetzt = new Date() } = {}) {
  if (b?.status !== "Gesendet" || !b.gesendet_am) return { tage: null, ueberfaellig: false };
  const tage = tageZwischen(String(b.gesendet_am).slice(0, 10), isoTag(jetzt));
  return { tage, ueberfaellig: tage !== null && tage > frist };
}

/** Vorschlagsmenge aus Meldebestand (ph_logistik: Ziel − verfügbar − offen bestellt, mind. Bestellmenge). */
export function vorschlagMenge({ verfuegbar = 0, offen_bestellt = 0, zielbestand = 0, meldebestand = 0, bestellmenge_min = 0, verpackungseinheit = 0 } = {}) {
  const ziel = Math.max(Number(zielbestand) || 0, Number(meldebestand) || 0);
  let menge = ziel - (Number(verfuegbar) || 0) - (Number(offen_bestellt) || 0);
  if (menge <= 0) return 0;
  menge = Math.max(menge, Number(bestellmenge_min) || 0);
  const ve = Number(verpackungseinheit) || 0;
  if (ve > 1) menge = Math.ceil(menge / ve) * ve;
  return menge;
}
