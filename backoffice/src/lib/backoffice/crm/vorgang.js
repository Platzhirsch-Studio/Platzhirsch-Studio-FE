// Abgeleiteter Status, Vorgangsleiste und Kundenreise des CRM (10-konzept-crm E1, § 2.3, § 4).
// Reines Modul (unit-getestet): bekommt geladene Datensätze, liefert Anzeige-Strukturen für die
// Fundament-Bausteine `Vorgangsleiste` (schritte[{id,titel,zustand,datum,objekte,aufgaben}]).

import { CRM_TEXTE as T } from "./texte.js";
import { ANFRAGE_ENDE, statusAnzeige, terminStatus } from "./status.js";

const MONATE = ["Jan", "Feb", "März", "Apr", "Mai", "Juni", "Juli", "Aug", "Sep", "Okt", "Nov", "Dez"];
const TAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

/** "2026-11-04 14:00:00" → Date (lokal) oder null. */
export function alsDatum(wert) {
  if (!wert) return null;
  if (wert instanceof Date) return Number.isNaN(wert.getTime()) ? null : wert;
  const s = String(wert);
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00` : s.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** „4. Nov“ */
export function kurzDatum(wert) {
  const d = alsDatum(wert);
  return d ? `${d.getDate()}. ${MONATE[d.getMonth()]}` : "";
}

/** „Di 04.11. 14:00“ */
export function terminZeit(wert, { mitTag = true, mitZeit = true } = {}) {
  const d = alsDatum(wert);
  if (!d) return "";
  const p = (n) => String(n).padStart(2, "0");
  const teile = [];
  if (mitTag) teile.push(TAGE[d.getDay()]);
  teile.push(`${p(d.getDate())}.${p(d.getMonth() + 1)}.`);
  if (mitZeit) teile.push(`${p(d.getHours())}:${p(d.getMinutes())}`);
  return teile.join(" ");
}

/** „14:00“ */
export function uhrzeit(wert) {
  const d = alsDatum(wert);
  if (!d) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Alter einer Anfrage mit Wort (§ 3.2): „31 h · überfällig“ (> Schwelle), „6 h · wartet“ (> 4 h), sonst Datum/Stunden.
 * @returns {{text:string, wort:""|"überfällig"|"wartet", stunden:number}}
 */
export function alterText(eingang, { jetzt = new Date(), status = "Neu", schwelleH = 24 } = {}) {
  const d = alsDatum(eingang);
  if (!d) return { text: "–", wort: "", stunden: 0 };
  const stunden = Math.max(0, Math.floor((jetzt.getTime() - d.getTime()) / 3600000));
  const basis = stunden < 1 ? "gerade" : stunden < 72 ? T.alter.stunden(stunden) : stunden < 24 * 7 ? T.alter.tage(Math.floor(stunden / 24)) : kurzDatum(d);
  if (status !== "Neu") return { text: basis, wort: "", stunden };
  if (stunden > schwelleH) return { text: `${basis} · ${T.alter.ueberfaellig}`, wort: T.alter.ueberfaellig, stunden };
  if (stunden > 4) return { text: `${basis} · ${T.alter.wartet}`, wort: T.alter.wartet, stunden };
  return { text: basis, wort: "", stunden };
}

/** Fälligkeit mit Wort: „heute · fällig“, „03.11. · überfällig“. */
export function faelligText(datum, jetzt = new Date()) {
  const d = alsDatum(datum);
  if (!d) return { text: "–", wort: "" };
  const heute = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate());
  const tag = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((tag.getTime() - heute.getTime()) / 86400000);
  if (diff < 0) return { text: `${terminZeit(d, { mitTag: false, mitZeit: false })} · ${T.alter.ueberfaellig}`, wort: T.alter.ueberfaellig };
  if (diff === 0) return { text: `${T.alter.heute} · ${T.alter.faellig}`, wort: T.alter.faellig };
  return { text: terminZeit(d, { mitZeit: false }), wort: "" };
}

const aktiv = (t) => t && (t.status === "Unbestaetigt" || t.status === "Bestaetigt");
const nachStart = (a, b) => String(a.start || "").localeCompare(String(b.start || ""));

/**
 * Abgeleiteter Status einer Anfrage (E1): aktiver Termin → „Termin vereinbart“; alle Termine entfallen →
 * Kennzeichen „Termin entfallen“; Angebot (≠ Ersetzt) → „Angebot“. `passtNicht`, wenn der gespeicherte Status abweicht.
 * @returns {{status:string, text:string, ton:string, entfallen:boolean, passtNicht:boolean, termin:object|null, angebot:object|null}}
 */
export function abgeleiteterStatus(anfrage, { termine = [], angebote = [] } = {}) {
  const gespeichert = String(anfrage?.status || "Neu");
  const eigene = termine.filter((t) => !anfrage?.name || t.anfrage === anfrage.name);
  const aktiver = eigene.filter(aktiv).sort(nachStart)[0] || null;
  const angebot = angebote.filter((a) => a.status !== "Ersetzt" && (!anfrage?.name || a.anfrage === anfrage.name)).sort((a, b) => String(b.modified || b.creation || "").localeCompare(String(a.modified || a.creation || "")))[0] || null;
  let status = gespeichert;
  if (!ANFRAGE_ENDE.includes(gespeichert)) {
    if (angebot) status = "Angebot";
    else if (aktiver) status = "Termin vereinbart";
  }
  const entfallen = !ANFRAGE_ENDE.includes(status) && status !== "Angebot" && !aktiver && eigene.length > 0 && eigene.every((t) => ["Storniert", "Abgelehnt", "Nicht erschienen"].includes(t.status));
  const anzeige = entfallen ? statusAnzeige("anfrage", "entfallen") : statusAnzeige("anfrage", status);
  const passtNicht = status !== gespeichert || (entfallen && gespeichert === "Termin vereinbart");
  return { status, text: anzeige.text, ton: anzeige.ton, entfallen, passtNicht, termin: aktiver, angebot };
}

/**
 * Empfohlene Primäraktion (§ 3.4 „Empfohlen“).
 * @returns {{id:"annehmen"|"termin"|"neuerTermin"|"terminOeffnen"|"angebotOeffnen", titel:string}|null}
 */
export function empfehlung(abgeleitet) {
  if (!abgeleitet) return null;
  if (abgeleitet.entfallen) return { id: "neuerTermin", titel: T.knopf.neuerTermin };
  switch (abgeleitet.status) {
    case "Neu":
      return { id: "annehmen", titel: T.knopf.annehmen };
    case "Qualifiziert":
      return { id: "termin", titel: T.knopf.termin };
    case "Termin vereinbart":
      return { id: "terminOeffnen", titel: T.knopf.oeffnen };
    case "Angebot":
      return { id: "angebotOeffnen", titel: T.knopf.angebotOeffnen };
    default:
      return null;
  }
}

/**
 * Vorgangsleiste Anfrage → Termin → Gespräch → Angebot → Auftrag (§ 2.3).
 * @param {{anfrage?:object, termine?:object[], gespraeche?:object[], angebote?:object[], auftraege?:object[]}} d
 * @param {{href?:(doctype:string, name:string)=>string, jetztStufe?:string}} [opt]
 */
export function vorgangsSchritte(d = {}, { href = () => undefined } = {}) {
  const { anfrage = null, termine = [], gespraeche = [], angebote = [], auftraege = [] } = d;
  const tAktiv = termine.filter(aktiv).sort(nachStart);
  const tLetzt = tAktiv[0] || [...termine].sort(nachStart).reverse()[0] || null;
  const angebotLetzt = angebote.filter((a) => a.status !== "Ersetzt").sort((a, b) => String(b.creation || "").localeCompare(String(a.creation || "")))[0] || null;
  const g = [...gespraeche].sort((a, b) => String(b.datum || "").localeCompare(String(a.datum || "")))[0] || null;
  const ab = auftraege.find((x) => x.status !== "Storniert") || null;

  const schritte = [
    {
      id: "anfrage",
      titel: "Anfrage",
      zustand: !anfrage ? "offen" : anfrage.status === "Neu" ? "aktuell" : "erledigt",
      datum: anfrage ? terminZeit(anfrage.eingang || anfrage.creation, { mitTag: false, mitZeit: false }) : undefined,
      objekte: anfrage ? [{ titel: anfrage.titel || anfrage.name, info: statusAnzeige("anfrage", anfrage.status).text, href: href("PH Anfrage", anfrage.name) }] : [],
    },
    {
      id: "termin",
      titel: "Termin",
      zustand: !tLetzt ? "offen" : tLetzt.status === "Erledigt" ? "erledigt" : aktiv(tLetzt) ? "aktuell" : "teilweise",
      datum: tLetzt ? terminZeit(tLetzt.start) : undefined,
      objekte: termine.map((t) => ({ titel: terminZeit(t.start), info: terminStatus(t).text, href: href("PH Termin", t.name) })),
    },
    {
      id: "gespraech",
      titel: "Gespräch",
      zustand: !g ? "offen" : g.status === "Offen" ? "aktuell" : "erledigt",
      datum: g ? terminZeit(g.datum, { mitTag: false, mitZeit: false }) : undefined,
      objekte: gespraeche.map((x) => ({ titel: x.titel || x.name, info: statusAnzeige("gespraech", x.status).text, href: href("PH Beratungsgespraech", x.name) })),
    },
    {
      id: "angebot",
      titel: "Angebot",
      zustand: !angebotLetzt ? "offen" : ab ? "erledigt" : "aktuell",
      datum: angebotLetzt ? terminZeit(angebotLetzt.datum || angebotLetzt.creation, { mitTag: false, mitZeit: false }) : undefined,
      objekte: angebotLetzt ? [{ titel: angebotLetzt.name, info: angebotLetzt.status, href: href("PH Angebot", angebotLetzt.name) }] : [],
    },
    {
      id: "auftrag",
      titel: "Auftrag",
      zustand: ab ? "erledigt" : "offen",
      datum: ab ? terminZeit(ab.datum || ab.creation, { mitTag: false, mitZeit: false }) : undefined,
      objekte: ab ? [{ titel: ab.name, info: ab.status, href: href("PH Auftragsbestaetigung", ab.name) }] : [],
    },
  ];
  // Genau eine aktuelle Stufe: die letzte nicht erledigte nach der letzten erledigten.
  let letzteErledigt = -1;
  schritte.forEach((s, i) => {
    if (s.zustand === "erledigt") letzteErledigt = i;
  });
  const hatAktuell = schritte.some((s) => s.zustand === "aktuell");
  if (!hatAktuell && letzteErledigt < schritte.length - 1 && letzteErledigt >= 0) schritte[letzteErledigt + 1].zustand = "aktuell";
  if (schritte.filter((s) => s.zustand === "aktuell").length > 1) {
    const erst = schritte.findLastIndex((s) => s.zustand === "aktuell");
    schritte.forEach((s, i) => {
      if (s.zustand === "aktuell" && i !== erst) s.zustand = "erledigt";
    });
  }
  return schritte;
}

/**
 * Kundenreise der Kundenakte (Lounge §6: 7 Stufen, Karten je Schritt mit Person und Datum).
 * @param {object} d  {anfragen, termine, gespraeche, angebote, auftraege, rechnungen, lieferungen, montagen, servicefaelle}
 * @param {{person?:(user:string)=>object|undefined, href?:(doctype:string,name:string)=>string}} [opt]
 */
export function kundenreise(d = {}, { person = () => undefined, href = () => undefined } = {}) {
  const l = (x) => (Array.isArray(x) ? x : []);
  const [anfragen, termine, gespraeche, angebote, auftraege, rechnungen, lieferungen, montagen, servicefaelle] = [d.anfragen, d.termine, d.gespraeche, d.angebote, d.auftraege, d.rechnungen, d.lieferungen, d.montagen, d.servicefaelle].map(l);
  const st = T.akte.reiseStufen;
  const karte = (titel, datum, zustand, wer, doctype, name) => ({ titel, datum: datum || undefined, zustand, person: wer ? person(wer) : undefined, href: name ? href(doctype, name) : undefined });

  const sAnfrage = anfragen.slice(0, 3).map((a) => karte(`Anfrage ${T.quelle[a.quelle] ? `über ${T.quelle[a.quelle]}` : ""}`.trim(), kurzDatum(a.eingang), a.status === "Neu" ? "aktuell" : "erledigt", a.zugewiesen_an, "PH Anfrage", a.name));
  const sBeratung = [
    ...termine.slice(0, 3).map((t) => karte(`${T.modus[t.modus] || "Termin"}${t.thema ? ` · ${t.thema}` : ""}`, kurzDatum(t.start), t.status === "Erledigt" ? "erledigt" : aktiv(t) ? "aktuell" : "uebersprungen", t.berater, "PH Termin", t.name)),
  ];
  const sPlanung = gespraeche.slice(0, 3).map((g) => karte(g.status === "Planung beauftragt" ? "Planung beauftragt" : "Gesprächsprotokoll", kurzDatum(g.datum), g.status === "Offen" ? "aktuell" : "erledigt", g.berater, "PH Beratungsgespraech", g.name));
  const sAngebot = [
    ...angebote.filter((a) => a.status !== "Ersetzt").slice(0, 2).map((a) => karte(`Angebot ${a.name}`, kurzDatum(a.datum || a.creation), auftraege.length ? "erledigt" : "aktuell", a.owner, "PH Angebot", a.name)),
    ...auftraege.slice(0, 2).map((a) => karte(`Auftrag ${a.name}`, kurzDatum(a.datum || a.creation), "erledigt", a.owner, "PH Auftragsbestaetigung", a.name)),
  ];
  const sLieferung = [
    ...rechnungen.filter((r) => /Anzahlung/i.test(String(r.rechnungsart || r.art || ""))).slice(0, 1).map((r) => karte("Anzahlung", kurzDatum(r.datum), r.status === "Bezahlt" ? "erledigt" : "aktuell", undefined, "PH Rechnung", r.name)),
    ...lieferungen.slice(0, 2).map((l) => karte(`Lieferung ${l.name}`, kurzDatum(l.datum || l.lieferdatum), l.status === "Geliefert" || l.status === "Zugestellt" ? "erledigt" : "aktuell", undefined, "PH Lieferschein", l.name)),
  ];
  const sMontage = montagen.slice(0, 2).map((m) => karte(m.titel || "Montage", kurzDatum(m.datum || m.start || m.termin), m.status === "Abgeschlossen" || m.status === "Erledigt" ? "erledigt" : "offen", undefined, "PH Montageauftrag", m.name));
  const sService = servicefaelle.slice(0, 2).map((s) => karte(s.titel || "Servicefall", kurzDatum(s.eingang || s.creation), s.status === "Erledigt" || s.status === "Abgeschlossen" ? "erledigt" : "aktuell", s.zugewiesen_an, "PH Servicefall", s.name));

  const gruppen = [sAnfrage, sBeratung, sPlanung, sAngebot, sLieferung, sMontage, sService];
  const ids = ["anfrage", "beratung", "planung", "angebot", "lieferung", "montage", "service"];
  const schritte = gruppen.map((aufgaben, i) => ({ id: ids[i], titel: st[i], aufgaben }));
  // Zustände: bis zur letzten Stufe mit Inhalt; danach offen. Genau eine aktuelle Karte bleibt „aktuell“.
  let letzte = -1;
  schritte.forEach((s, i) => {
    if (s.aufgaben.length) letzte = i;
  });
  schritte.forEach((s, i) => {
    if (i > letzte) s.zustand = "offen";
    else if (i < letzte) s.zustand = s.aufgaben.length ? "erledigt" : "uebersprungen";
    else s.zustand = s.aufgaben.some((a) => a.zustand === "aktuell" || a.zustand === "offen") ? "aktuell" : "erledigt";
    if (i < letzte) s.aufgaben.forEach((a) => {
      if (a.zustand === "aktuell") a.zustand = "erledigt";
    });
  });
  if (letzte >= 0 && schritte[letzte].zustand === "erledigt" && letzte < schritte.length - 1) schritte[letzte + 1].zustand = "aktuell";
  let gesehen = false;
  for (let i = schritte.length - 1; i >= 0; i--) {
    for (const a of schritte[i].aufgaben) {
      if (a.zustand !== "aktuell") continue;
      if (gesehen) a.zustand = "erledigt";
      gesehen = true;
    }
  }
  return schritte;
}

/** Index der aktuellen Stufe (für die Stufen-Pille). */
export function aktuelleStufe(schritte = []) {
  const i = schritte.findIndex((s) => s.zustand === "aktuell");
  return i >= 0 ? i : Math.max(0, schritte.findLastIndex((s) => s.zustand === "erledigt"));
}

/** Ganze Tage bis zu einer Frist (heute = 0, gestern abgelaufen = -1). */
export function restTage(frist, jetzt = new Date()) {
  const f = alsDatum(String(frist || "").slice(0, 10));
  if (!f) return 0;
  const heute = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate());
  return Math.round((f.getTime() - heute.getTime()) / 86400000);
}
