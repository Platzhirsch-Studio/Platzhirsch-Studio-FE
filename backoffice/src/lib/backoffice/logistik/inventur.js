// Inventur: Fortschritt, Differenzen, Freigabe-Prüfung (Vier-Augen, Grund, Bewegungen seit Zählbeginn),
// Teilinventur (Platzvorschlag, Abdeckung je Geschäftsjahr) und Inventurbewertung (Niederstwert mit Staffel).
// Spiegelt ph_logistik inventur_logik.py (10-konzept-logistik § 4.13, § 5.12, README „Lager & Inventur“). Reines Modul.

import { OHNE_PLATZ } from "./packen.js";

export { OHNE_PLATZ };

/** Platzhalter-Staffel der App (Inhaber/StB bestätigen; Einstellungen „Abwertungsstaffel“). */
export const STANDARD_STAFFEL = Object.freeze([
  { art: "Ausstellungsstueck", ab_monate: 0, abwertung_promille: 200 },
  { art: "Ausstellungsstueck", ab_monate: 12, abwertung_promille: 400 },
  { art: "Ausstellungsstueck", ab_monate: 24, abwertung_promille: 600 },
  { art: "Ausstellungsstueck", ab_monate: 36, abwertung_promille: 800 },
  { art: "B-Ware", ab_monate: 0, abwertung_promille: 300 },
  { art: "Lagerware", ab_monate: 24, abwertung_promille: 500 },
]);

export const GRUENDE = ["Schwund", "Verkauf nicht gebucht", "Umlagerung nicht gebucht", "Beschaedigt", "Zaehlfehler", "Sonstiges"];

function zahl(x) {
  return Number(x || 0);
}

/** Differenz einer gezählten Zeile (ist − soll), ungezählt = null. */
export function differenz(p) {
  if (!Number(p.gezaehlt)) return null;
  return zahl(p.ist) - zahl(p.soll);
}

export function inventurFortschritt(positionen = []) {
  const n = positionen.length;
  const gez = positionen.filter((p) => Number(p.gezaehlt)).length;
  const diff = positionen.filter((p) => (differenz(p) ?? 0) !== 0);
  return {
    positionen: n,
    gezaehlt: gez,
    offen: n - gez,
    anteil: n ? gez / n : 0,
    differenzen: diff.length,
    ohneGrund: diff.filter((p) => !p.grund).length,
    summeDifferenz: diff.reduce((s, p) => s + (differenz(p) || 0), 0),
  };
}

/** Nur Zeilen mit Differenz, nach Betrag absteigend. */
export function differenzZeilen(positionen = []) {
  return positionen.filter((p) => (differenz(p) ?? 0) !== 0).sort((a, b) => Math.abs(differenz(b)) - Math.abs(differenz(a)));
}

/** Zählliste sortiert nach Platz, Name, idx; optional nur ein Bereich (Platz-Präfix). */
export function zaehlReihenfolge(positionen = [], bereich) {
  const b = String(bereich || "").replace(/\*$/, "");
  return positionen
    .filter((p) => !b || String(p.platz || "").startsWith(b))
    .slice()
    .sort((x, y) => String(x.platz || "~").localeCompare(String(y.platz || "~"), "de") || String(x.produkt_name || "").localeCompare(String(y.produkt_name || ""), "de") || zahl(x.idx) - zahl(y.idx));
}

/** Vier-Augen wie `vier_augen_verletzt` (Administrator ausgenommen). */
export function vierAugenVerletzt(gezaehltVon, freigebend, aktiv = true) {
  return !!aktiv && !!gezaehltVon && gezaehltVon === freigebend && freigebend !== "Administrator";
}

/**
 * Freigabe-Prüfung (§ 5.12, QA 25).
 * @param {{inventur:object, benutzer:string, leitung:boolean, bewegungenSeitStart?:object[], vierAugen?:boolean}} p
 * @returns {{darf:boolean, gruende:Array<{code:string, text:string}>, zusammenfassung:string}}
 */
export function freigabePruefen({ inventur, benutzer, leitung, bewegungenSeitStart = [], vierAugen = true }) {
  const gruende = [];
  const pos = inventur?.positionen || [];
  const f = inventurFortschritt(pos);
  if (inventur?.status !== "Laufend") gruende.push({ code: "status", text: "Freigeben geht nur bei laufender Zählung." });
  if (!leitung) gruende.push({ code: "leitung", text: "Freigeben darf nur die Leitung." });
  if (vierAugenVerletzt(inventur?.gezaehlt_von, benutzer, vierAugen)) gruende.push({ code: "vier-augen", text: "Vier-Augen: Freigabe durch eine andere Person." });
  if (f.ohneGrund) gruende.push({ code: "grund", text: `${f.ohneGrund} ${f.ohneGrund === 1 ? "Differenz" : "Differenzen"} ohne Grund.` });
  if (bewegungenSeitStart.length) gruende.push({ code: "bewegungen", text: `${bewegungenSeitStart.length} ${bewegungenSeitStart.length === 1 ? "Bewegung" : "Bewegungen"} seit Zählbeginn – betroffene Positionen nachzählen.` });
  if (!f.gezaehlt) gruende.push({ code: "leer", text: "Noch nichts gezählt." });
  const netto = f.summeDifferenz;
  const zusammenfassung = `${f.differenzen} ${f.differenzen === 1 ? "Bewegung" : "Bewegungen"} „Inventur“ werden gebucht: ${netto > 0 ? "+" : netto < 0 ? "−" : "±"}${Math.abs(netto)} Stück netto · ${f.gezaehlt} von ${f.positionen} gezählt${f.offen ? ` – ${f.offen} ungezählte bleiben unverändert` : ""}`;
  return { darf: gruende.length === 0, gruende, zusammenfassung };
}

// ------------------------------------------------------------ Teilinventur --

function datum(x) {
  if (!x) return null;
  const d = new Date(String(x).slice(0, 10) + "T00:00:00Z");
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Geschäftsjahr (Beginn/Ende, ISO) zum Stichtag. */
export function geschaeftsjahr(stichtag, beginnMonat = 1) {
  const s = datum(stichtag);
  const bm = Math.min(Math.max(Number(beginnMonat) || 1, 1), 12);
  const jahr = s.getUTCMonth() + 1 >= bm ? s.getUTCFullYear() : s.getUTCFullYear() - 1;
  const beginn = new Date(Date.UTC(jahr, bm - 1, 1));
  const ende = new Date(Date.UTC(jahr + 1, bm - 1, 1) - 86_400_000);
  return { beginn: beginn.toISOString().slice(0, 10), ende: ende.toISOString().slice(0, 10) };
}

export function imGjGezaehlt(zuletzt, heute, beginnMonat = 1) {
  const z = datum(zuletzt);
  if (!z) return false;
  const { beginn, ende } = geschaeftsjahr(heute, beginnMonat);
  const iso = z.toISOString().slice(0, 10);
  return iso >= beginn && iso <= ende;
}

/** Plätze eines oder mehrerer Lagerorte als [{lagerort, platz, zuletzt}]. */
export function platzListe(lagerorte = []) {
  const out = [];
  for (const l of lagerorte) for (const p of l.plaetze || []) if (Number(p.aktiv ?? 1)) out.push({ lagerort: l.name, platz: p.platz, zuletzt: p.zuletzt_gezaehlt || null });
  return out;
}

/** Abdeckung „jeder Platz 1× je Geschäftsjahr“ wie `abdeckung`. */
export function abdeckung(plaetze = [], heute, beginnMonat = 1) {
  const { beginn, ende } = geschaeftsjahr(heute, beginnMonat);
  const gesamt = plaetze.length;
  const gez = plaetze.filter((p) => imGjGezaehlt(p.zuletzt, heute, beginnMonat)).length;
  const tage = (datum(ende) - datum(beginn)) / 86_400_000 + 1;
  const vergangen = (datum(heute) - datum(beginn)) / 86_400_000 + 1;
  const soll = Math.round((vergangen * 1000) / tage);
  const sollPlaetze = Math.round((gesamt * soll) / 1000);
  return { gesamt, gezaehlt: gez, offen: gesamt - gez, quotePromille: gesamt ? Math.round((gez * 1000) / gesamt) : 1000, sollPromille: soll, rueckstand: Math.max(sollPlaetze - gez, 0), gjBeginn: beginn, gjEnde: ende };
}

/** Nächste Plätze: im GJ ungezählte zuerst, dann am längsten nicht gezählte (nie vor alt), dann Lagerort/Platz. */
export function plaetzeVorschlagen(plaetze = [], heute, beginnMonat = 1, anzahl = 10) {
  const rang = (p) => [imGjGezaehlt(p.zuletzt, heute, beginnMonat) ? 1 : 0, datum(p.zuletzt)?.getTime() || 0, String(p.lagerort || ""), String(p.platz || "")];
  return plaetze
    .slice()
    .sort((a, b) => {
      const x = rang(a), y = rang(b);
      for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
      return 0;
    })
    .slice(0, Math.max(Number(anzahl) || 0, 0));
}

export function plaetzeJeWoche(offen, heute, beginnMonat = 1) {
  const { ende } = geschaeftsjahr(heute, beginnMonat);
  const wochen = Math.max(((datum(ende) - datum(heute)) / 86_400_000 + 1) / 7, 1);
  return !offen ? 0 : Math.max(Math.ceil(offen / wochen), 1);
}

/** „Ein Platz je Zeile“ → Liste ohne Doppelte. */
export function platzliste(text) {
  const seen = new Set();
  return String(text || "")
    .replace(/,/g, "\n")
    .split(/\r?\n/)
    .map((z) => z.trim())
    .filter((z) => z && !seen.has(z) && seen.add(z));
}

// --------------------------------------------------------- Bewertung --

export function bewertungsart(zeile) {
  if (Number(zeile?.ausstellungsstueck) || zeile?.zustand === "Ausstellung") return "Ausstellungsstueck";
  if (zeile?.zustand === "B-Ware") return "B-Ware";
  return "Lagerware";
}

export function alterMonate(eingang, stichtag) {
  const e = datum(eingang), s = datum(stichtag);
  if (!e || !s || e > s) return 0;
  let m = (s.getUTCFullYear() - e.getUTCFullYear()) * 12 + (s.getUTCMonth() - e.getUTCMonth());
  if (s.getUTCDate() < e.getUTCDate()) m -= 1;
  return Math.max(m, 0);
}

export function abwertungPromille(art, monate, staffel = STANDARD_STAFFEL) {
  let beste = null;
  for (const r of staffel) {
    if (r.art !== art) continue;
    const ab = Number(r.ab_monate || 0);
    if (ab <= Number(monate || 0) && (!beste || ab >= Number(beste.ab_monate || 0))) beste = r;
  }
  return beste ? Math.min(Math.max(Number(beste.abwertung_promille || 0), 0), 1000) : 0;
}

export function nettoerloes(vkBruttoCent, ustBasispunkte = 2000, kostenPromille = 0) {
  if (!vkBruttoCent || Number(vkBruttoCent) <= 0) return null;
  const netto = (Number(vkBruttoCent) * 10000) / (10000 + Number(ustBasispunkte || 0));
  return Math.max(Math.round((netto * (1000 - Number(kostenPromille || 0))) / 1000), 0);
}

/** Niederstwert: min(EK × (1 − Abwertung), Nettoerlös). */
export function bewerte(menge, einstandspreisCent, abwertung = 0, nettoerloesCent = null) {
  const m = Math.max(Math.trunc(Number(menge || 0)), 0);
  const ek = Math.max(Math.trunc(Number(einstandspreisCent || 0)), 0);
  let einzel = Math.round((ek * (1000 - Number(abwertung || 0))) / 1000);
  let nw = false;
  if (nettoerloesCent !== null && nettoerloesCent !== undefined && Number(nettoerloesCent) < einzel) {
    einzel = Math.max(Math.trunc(Number(nettoerloesCent)), 0);
    nw = true;
  }
  const ak = m * ek;
  const wert = m * einzel;
  return { einzelwert_cent: einzel, wert_ak_cent: ak, abwertung_cent: ak - wert, wert_cent: wert, niederstwert: nw };
}

/** Bewertungszeilen aus Beständen zum Stichtag (Mock-Rechenweg; Frappe rechnet `berechnen` selbst). */
export function bewertungsZeilen(bestaende = [], stichtag, { staffel = STANDARD_STAFFEL, ustBasispunkte = 2000, kostenPromille = 0 } = {}) {
  return bestaende
    .filter((b) => Number(b.menge) > 0 && !["Verkauft", "Ausgeschieden"].includes(b.status))
    .map((b) => {
      const art = bewertungsart(b);
      const monate = alterMonate(b.eingang_am, stichtag);
      const ab = abwertungPromille(art, monate, staffel);
      const ne = nettoerloes(b.vk_cent_ausstellung, ustBasispunkte, kostenPromille);
      const w = bewerte(b.menge, b.ek_cent, ab, ne);
      return {
        lagerbestand: b.name, produkt: b.produkt, produkt_name: b.produkt_name, marke: b.marke, lagerort: b.lagerort, platz: b.platz, seriennummer: b.seriennummer,
        bewertungsart: art, menge: Number(b.menge), einstandspreis_cent: Number(b.ek_cent || 0), ek_quelle: b.ek_cent ? "Rückfall EK" : "ohne EK", alter_monate: monate,
        abwertung_promille: ab, nettoerloes_cent: ne || 0, ...w,
      };
    });
}

/** Gruppensummen je Schlüssel (lagerort | marke | bewertungsart). */
export function summen(zeilen = [], schluessel = "lagerort") {
  const m = new Map();
  for (const z of zeilen) {
    const k = z[schluessel] || "–";
    const s = m.get(k) || { gruppe: k, menge: 0, wert_ak_cent: 0, abwertung_cent: 0, wert_cent: 0, positionen: 0 };
    s.menge += Number(z.menge || 0);
    s.wert_ak_cent += Number(z.wert_ak_cent || 0);
    s.abwertung_cent += Number(z.abwertung_cent || 0);
    s.wert_cent += Number(z.wert_cent || 0);
    s.positionen += 1;
    m.set(k, s);
  }
  return [...m.values()].sort((a, b) => b.wert_cent - a.wert_cent);
}
