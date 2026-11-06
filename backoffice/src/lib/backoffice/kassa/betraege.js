// Kassa – Beträge (Team B-KAS). Reiner Port von Backend-Import/ph_kassa/ph_kassa/logik/betraege.py:
// Steuersätze, Positionssummen, Rabatt, Zahlarten-Prüfung, Rückgeld, Stückelung. Geld immer Cent (Int),
// Steuersatz als Int ×100 (2000 = 20,00 %). Die Oberfläche rechnet live mit derselben Formel wie der Server;
// die Wahrheit bleibt der Server (`beleg_vorschau` / `beleg_buchen`). Reines Modul, testbar mit node --test.

export const STEUERSAETZE = Object.freeze({
  "Normal 20": 2000,
  "Ermaessigt-1 10": 1000,
  "Ermaessigt-2 13": 1300,
  "Null 0": 0,
  "Besonders 19": 1900,
  Steuerfrei: 0,
});

export const RKSV_BETRAGSFELD = Object.freeze({
  "Normal 20": "betrag_normal_cent",
  "Ermaessigt-1 10": "betrag_ermaessigt1_cent",
  "Ermaessigt-2 13": "betrag_ermaessigt2_cent",
  "Null 0": "betrag_null_cent",
  Steuerfrei: "betrag_null_cent",
  "Besonders 19": "betrag_besonders_cent",
});

/** Anzeige der Steuersätze (Bon-Kürzel A–F, wie STEUERSATZ_KURZ im Backend). */
export const STEUERSATZ_KURZ = Object.freeze({
  "Normal 20": "A 20 %",
  "Ermaessigt-1 10": "B 10 %",
  "Ermaessigt-2 13": "C 13 %",
  "Null 0": "D 0 %",
  "Besonders 19": "E 19 %",
  Steuerfrei: "F 0 %",
});

export const ZAHLARTEN = Object.freeze(["Bar", "Karte Stripe Terminal", "Karte extern", "Gutschein", "Ueberweisung"]);
export const BARUMSATZ_ZAHLARTEN = Object.freeze(["Bar", "Karte Stripe Terminal", "Karte extern", "Gutschein"]);
export const POSITIONSARTEN = Object.freeze(["Artikel", "Freitext", "Anzahlung", "Teilzahlung", "Schlusszahlung", "Gutschein Verkauf", "Gutschein Einloesung", "Storno", "Retoure", "Rabatt"]);
export const NEGATIVE_ARTEN = Object.freeze(["Gutschein Einloesung", "Retoure", "Rabatt"]);
export const RUECKZAHLUNG_ZAHLARTEN = Object.freeze(["Bar", "Karte Stripe Terminal", "Karte extern", "Ueberweisung"]);
export const STUECKELUNG_CENT = Object.freeze([50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1]);

/** Fachlicher Fehler der Kassenlogik (Text ist Oberflächentext). */
export class KassenFehler extends Error {
  constructor(text) {
    super(text);
    this.name = "KassenFehler";
  }
}

/** Kaufmännisch runden (0,5 → auf), symmetrisch für negative Beträge – wie `_runde` in Python. */
export function runde(x) {
  if (x < 0) return -runde(-x);
  return Math.floor(x + 0.5);
}

export function satz(steuersatz) {
  if (!(steuersatz in STEUERSAETZE)) throw new KassenFehler(`Unbekannter Steuersatz: ${steuersatz}`);
  return STEUERSAETZE[steuersatz];
}

/** [netto, ust] aus brutto; Summe stimmt immer. */
export function nettoAusBrutto(bruttoCent, steuersatz) {
  const p = satz(steuersatz);
  const brutto = Math.trunc(Number(bruttoCent) || 0);
  if (p === 0) return [brutto, 0];
  const netto = runde((brutto * 10000) / (10000 + p));
  return [netto, brutto - netto];
}

/** Rabatt je Stück auf den Brutto-Listenpreis (Promille = echte Promille, 100 = 10 %) oder fester Betrag. */
export function rabattBerechnen(listenpreisCent, rabattPromille = 0, rabattCent = 0) {
  const listen = Math.trunc(Number(listenpreisCent) || 0);
  if (listen <= 0) throw new KassenFehler("Listenpreis muss größer 0 sein, wenn ein Rabatt gegeben wird.");
  if (rabattPromille && rabattCent) throw new KassenFehler("Rabatt entweder in Prozent oder als Betrag angeben, nicht beides.");
  let r;
  if (rabattPromille) {
    if (!(rabattPromille > 0 && rabattPromille <= 1000)) throw new KassenFehler("Rabatt in Prozent muss zwischen 0,1 % und 100 % liegen.");
    r = runde((listen * rabattPromille) / 1000);
  } else r = Math.trunc(Number(rabattCent) || 0);
  if (r < 0 || r > listen) throw new KassenFehler("Rabatt darf weder negativ noch höher als der Listenpreis sein.");
  return { einzel_brutto_cent: listen - r, rabatt_cent: r, rabatt_promille: runde((r * 1000) / listen) };
}

/** Indizes der Positionen, deren Rabatt die Freigabegrenze (Promille) übersteigt; Grenze 0 = nie. */
export function rabattFreigabeNoetig(positionen, grenzePromille) {
  if (!Number(grenzePromille)) return [];
  const out = [];
  positionen.forEach((p, i) => {
    const listen = Number(p.listenpreis_cent) || 0;
    if (!listen) return;
    let pm;
    if (p.rabatt_promille) pm = Number(p.rabatt_promille);
    else if (p.rabatt_cent) pm = runde((Number(p.rabatt_cent) * 1000) / listen);
    else return;
    if (pm > Number(grenzePromille)) out.push(i);
  });
  return out;
}

/** Position um brutto/netto/ust ergänzen (wie position_berechnen). */
export function positionBerechnen(pos) {
  const menge = pos.menge === undefined || pos.menge === null || pos.menge === "" ? 1 : Number(pos.menge);
  if (!(menge > 0)) throw new KassenFehler("Menge muss größer 0 sein (Rücknahme über Positionsart „Retoure“).");
  const steuersatz = pos.steuersatz || "Normal 20";
  const out = { ...pos };
  let einzel;
  if (pos.listenpreis_cent && (pos.rabatt_promille || pos.rabatt_cent)) {
    const r = rabattBerechnen(pos.listenpreis_cent, Number(pos.rabatt_promille) || 0, Number(pos.rabatt_cent) || 0);
    einzel = r.einzel_brutto_cent;
    Object.assign(out, { rabatt_promille: r.rabatt_promille, rabatt_cent: r.rabatt_cent, rabatt_gesamt_cent: runde(menge * r.rabatt_cent) });
    if (!String(pos.rabatt_grund || "").trim()) throw new KassenFehler("Rabatt braucht einen Grund (z. B. Ausstellungsstück, Kundenkarte).");
  } else einzel = Math.trunc(Number(pos.einzel_brutto_cent) || 0);
  let brutto = runde(menge * einzel);
  if (NEGATIVE_ARTEN.includes(pos.art) && brutto > 0) {
    brutto = -brutto;
    einzel = -Math.abs(einzel);
  }
  const [netto, ust] = nettoAusBrutto(brutto, steuersatz);
  return Object.assign(out, { menge, einzel_brutto_cent: einzel, steuersatz, brutto_cent: brutto, netto_cent: netto, ust_cent: ust });
}

/** Summen eines Belegs je Steuersatz + gesamt (wie summen). */
export function summen(positionen = []) {
  const berechnet = positionen.map(positionBerechnen);
  const jeSatz = {};
  const rksv = Object.fromEntries([...new Set(Object.values(RKSV_BETRAGSFELD))].sort().map((f) => [f, 0]));
  for (const p of berechnet) {
    const s = (jeSatz[p.steuersatz] ||= { netto_cent: 0, ust_cent: 0, brutto_cent: 0, anzahl: 0 });
    s.netto_cent += p.netto_cent;
    s.ust_cent += p.ust_cent;
    s.brutto_cent += p.brutto_cent;
    s.anzahl += 1;
    rksv[RKSV_BETRAGSFELD[p.steuersatz]] += p.brutto_cent;
  }
  return {
    gesamt_cent: berechnet.reduce((a, p) => a + p.brutto_cent, 0),
    netto_cent: berechnet.reduce((a, p) => a + p.netto_cent, 0),
    ust_cent: berechnet.reduce((a, p) => a + p.ust_cent, 0),
    je_satz: jeSatz,
    rksv,
    positionen: berechnet,
  };
}

export function rueckgeld(gesamtCent, gegebenCent) {
  return Math.trunc(gegebenCent) - Math.trunc(gesamtCent);
}

/** Zerlegt einen Betrag in Scheine/Münzen: [[stueck, anzahl], …]. */
export function stueckelung(betragCent) {
  let rest = Math.trunc(Number(betragCent) || 0);
  if (rest < 0) throw new KassenFehler("Stückelung nur für positive Beträge.");
  const out = [];
  for (const s of STUECKELUNG_CENT) {
    const n = Math.floor(rest / s);
    rest -= n * s;
    if (n) out.push([s, n]);
  }
  return out;
}

/**
 * Schnellbeträge für „Gegeben“ (Bar): passend + nächste runde Scheine über dem Betrag, ohne Dubletten, max. 4.
 * 129,60 € → [129,60 · 130 · 140 · 150]
 */
export function schnellbetraege(offenCent, max = 4) {
  const offen = Math.max(0, Math.trunc(offenCent));
  if (!offen) return [];
  const out = [offen];
  for (const schritt of [500, 1000, 2000, 5000, 10000, 20000, 50000]) {
    const v = Math.ceil(offen / schritt) * schritt;
    if (v > offen && !out.includes(v)) out.push(v);
    if (out.length >= max) break;
  }
  return out.sort((a, b) => a - b).slice(0, max);
}

/** Zahlarten prüfen und Rückgeld berechnen (wie zahlarten_pruefen). */
export function zahlartenPruefen(gesamtCent, zahlarten = []) {
  const gesamt = Math.trunc(gesamtCent);
  if (!zahlarten.length) {
    if (gesamt === 0) return { zahlarten: [], rueckgeld_cent: 0, barumsatz_cent: 0 };
    throw new KassenFehler("Keine Zahlart gewählt.");
  }
  if (gesamt < 0) return rueckzahlungPruefen(gesamt, zahlarten);
  const bereinigt = [];
  let summeOhneBar = 0;
  let bar = null;
  for (const z of zahlarten) {
    const art = z.zahlart;
    if (!ZAHLARTEN.includes(art)) throw new KassenFehler(`Unbekannte Zahlart: ${art}`);
    const betrag = Math.trunc(Number(z.betrag_cent) || 0);
    if (betrag < 0) throw new KassenFehler("Zahlbetrag darf nicht negativ sein.");
    const e = { zahlart: art, betrag_cent: betrag, gegeben_cent: betrag, retour_cent: 0, barumsatz: BARUMSATZ_ZAHLARTEN.includes(art) ? 1 : 0 };
    for (const k of ["gutschein", "zahlung", "terminal_payment_intent", "terminal", "rest_cent", "code"]) if (z[k] !== undefined && z[k] !== null) e[k] = z[k];
    if (art === "Gutschein" && z.rest_cent !== undefined && z.rest_cent !== null && betrag > Number(z.rest_cent)) throw new KassenFehler("Gutschein-Betrag übersteigt den Restwert.");
    if (art === "Bar") {
      if (bar) throw new KassenFehler("Nur eine Bar-Zahlart je Beleg.");
      bar = e;
      bar.gegeben_cent = Math.trunc(Number(z.gegeben_cent) || betrag);
    } else summeOhneBar += betrag;
    bereinigt.push(e);
  }
  if (summeOhneBar > gesamt) throw new KassenFehler("Karte, Gutschein oder Überweisung übersteigen den Belegbetrag.");
  const offen = gesamt - summeOhneBar;
  let retour = 0;
  if (bar) {
    bar.betrag_cent = offen;
    if (bar.gegeben_cent < offen) throw new KassenFehler("Gegebener Barbetrag reicht nicht aus.");
    retour = bar.gegeben_cent - offen;
    bar.retour_cent = retour;
  } else if (offen !== 0) throw new KassenFehler("Zahlarten decken den Belegbetrag nicht ab.");
  return { zahlarten: bereinigt, rueckgeld_cent: retour, barumsatz_cent: bereinigt.filter((e) => e.barumsatz).reduce((a, e) => a + e.betrag_cent, 0) };
}

/** Negativer Beleg (Retoure): alle Zahlarten ≤ 0, Bar übernimmt den Rest (wie rueckzahlung_pruefen). */
export function rueckzahlungPruefen(gesamtCent, zahlarten = []) {
  const gesamt = Math.trunc(gesamtCent);
  const bereinigt = [];
  let bar = null;
  let summe = 0;
  for (const z of zahlarten) {
    const art = z.zahlart;
    if (!ZAHLARTEN.includes(art)) throw new KassenFehler(`Unbekannte Zahlart: ${art}`);
    if (!RUECKZAHLUNG_ZAHLARTEN.includes(art)) throw new KassenFehler("Rückzahlung als Gutschein: bitte Position „Gutschein Verkauf“ statt Zahlart verwenden.");
    const betrag = -Math.abs(Math.trunc(Number(z.betrag_cent) || 0));
    const e = { zahlart: art, betrag_cent: betrag, gegeben_cent: betrag, retour_cent: 0, barumsatz: BARUMSATZ_ZAHLARTEN.includes(art) ? 1 : 0 };
    if (art === "Bar") {
      if (bar) throw new KassenFehler("Nur eine Bar-Zahlart je Beleg.");
      bar = e;
    } else summe += betrag;
    bereinigt.push(e);
  }
  if (summe < gesamt) throw new KassenFehler("Rückzahlung übersteigt den Belegbetrag.");
  if (bar) bar.betrag_cent = bar.gegeben_cent = gesamt - summe;
  else if (summe !== gesamt) throw new KassenFehler("Rückzahlungswege decken den Belegbetrag nicht ab.");
  return { zahlarten: bereinigt, rueckgeld_cent: 0, barumsatz_cent: bereinigt.filter((e) => e.barumsatz).reduce((a, e) => a + e.betrag_cent, 0) };
}

/** Komplettprüfung eines Entwurfs: Summen + Zahlarten + Rückgeld. */
export function belegPruefen(positionen, zahlarten) {
  if (!positionen?.length) throw new KassenFehler("Beleg ohne Positionen.");
  const s = summen(positionen);
  return { ...s, ...zahlartenPruefen(s.gesamt_cent, zahlarten) };
}

/** 1234567 → „12.345,67 €“ (gleich wie format_betrag im Backend; geschütztes Leerzeichen vor €). */
export function euro(cent, { vorzeichen = false } = {}) {
  if (cent === null || cent === undefined || Number.isNaN(Number(cent))) return "";
  const c = Math.trunc(Number(cent));
  const abs = Math.abs(c);
  const ganz = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const rest = String(abs % 100).padStart(2, "0");
  const vz = c < 0 ? "− " : vorzeichen && c > 0 ? "+ " : "";
  return `${vz}${ganz},${rest} €`;
}

/** Vorlesbarer Betrag: „129,60 Euro“. */
export function euroSprache(cent) {
  const c = Math.trunc(Number(cent) || 0);
  const abs = Math.abs(c);
  return `${c < 0 ? "minus " : ""}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, "0")} Euro`;
}

/** Menge kompakt: 1 → „1“, 1.5 → „1,5“. */
export function menge(m) {
  const n = Number(m) || 0;
  return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
}
