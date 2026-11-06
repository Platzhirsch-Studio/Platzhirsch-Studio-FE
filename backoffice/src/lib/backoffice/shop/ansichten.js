// Listen-Ansichten, Filter, Suche und Seiten der Shop-Listen (10-konzept-shop § 3.5, § 4.2–4.9; N10). Rein.
// Reiter = gespeicherte Arbeitsansicht, nie Duplikat eines Filters; max. 5. URL = Zustand (?ansicht=&status=&q=&seite=&test=).

import { offen } from "./geld.js";
import { risikoOffen, streitOffen } from "./status.js";
import { heute as heuteIso, plusTage, tageBis, tagVon } from "./fristen.js";
import { naechsterSchritt, faelligSchluessel } from "./naechsterSchritt.js";

export const SEITEN_GROESSEN = [25, 50, 100];

const offeneWiderrufe = new Set(["Eingegangen", "Bestaetigt", "Ware erwartet", "Ware erhalten"]);

export const LISTEN = Object.freeze({
  bestellungen: {
    doctype: "PH Bestellung",
    such: ["name", "kunde_name", "kunde_email", "kunde_telefon", "payment_intent", "awb", "abholcode", "adresse_ort"],
    ansichten: [
      { id: "alle", titel: "Alle" },
      { id: "zu-packen", titel: "Zu packen", arbeit: true, f: (b) => b.status === "bezahlt" && b.lieferart === "versand" },
      { id: "abholung", titel: "Abholung", arbeit: true, f: (b) => b.lieferart === "abholung" && ["reserviert", "bezahlt", "abholbereit"].includes(b.status) },
      { id: "pruefen", titel: "Prüfen", arbeit: true, f: (b) => b.status === "pruefen" || (risikoOffen(b) && !["storniert", "abgeschlossen", "erstattet"].includes(b.status)) },
      { id: "meine", titel: "Meine", f: (b, c) => !!c.user && b.zugewiesen_an === c.user },
    ],
    datum: "angelegt",
    betrag: "gesamt_cent",
  },
  zahlungen: {
    doctype: "PH Zahlung",
    such: ["name", "bezug", "stripe_payment_intent", "stripe_charge", "zahlungsreferenz", "bank_referenz", "kontakt", "titel"],
    ansichten: [
      { id: "alle", titel: "Alle" },
      { id: "erstattungen", titel: "Erstattungen", f: (z) => z.art === "Erstattung" },
      { id: "freigabe", titel: "Freigabe nötig", leitung: true, f: (z) => z.status === "Erstattung angefordert" },
      { id: "ohne-auszahlung", titel: "Ohne Auszahlung", leitung: true, f: (z) => String(z.kanal).startsWith("Stripe") && z.status === "Bezahlt" && !z.stripe_auszahlung && z.art === "Eingang" },
      { id: "streit", titel: "Zahlungsstreit", leitung: true, f: (z) => streitOffen(z) },
    ],
    datum: "zeitpunkt",
    betrag: "betrag_cent",
  },
  gutscheine: {
    doctype: "PH Gutschein",
    such: ["code_letzte4", "kaeufer_name", "kaeufer_email", "empfaenger", "name"],
    ansichten: [
      { id: "alle", titel: "Alle" },
      { id: "offen", titel: "Offen", f: (g) => ["Erstellt", "Aktiv", "Teilweise eingeloest"].includes(g.status) || (g.status === "Abgelaufen" && Number(g.rest_cent) > 0) },
      { id: "laeuft-ab", titel: "Läuft ab (30 Tage)", f: (g, c) => !!g.gueltig_bis && ["Aktiv", "Teilweise eingeloest", "Erstellt"].includes(g.status) && tageBis(c.heute, g.gueltig_bis) >= 0 && tageBis(c.heute, g.gueltig_bis) <= 30 },
    ],
    datum: "ausgegeben_am",
    betrag: "rest_cent",
  },
  kaeufe: {
    doctype: "PH Gutschein Bestellung",
    such: ["name", "kaeufer_name", "kaeufer_email", "empfaenger"],
    ansichten: [{ id: "alle", titel: "Alle" }],
    datum: "erstellt",
    betrag: "summe_cent",
  },
  widerrufe: {
    doctype: "PH Widerruf",
    such: ["name", "kunde_name", "kunde_email", "bestellung", "eingangsnummer"],
    ansichten: [
      { id: "offen", titel: "Offen", f: (w) => offeneWiderrufe.has(w.status) },
      { id: "alle", titel: "Alle" },
      { id: "rueckzahlung", titel: "Rückzahlung ≤ 7 Tage", f: (w, c) => offeneWiderrufe.has(w.status) && !!w.erstattung_bis && tageBis(c.heute, w.erstattung_bis) <= 7 },
      { id: "nicht-zugeordnet", titel: "Nicht zugeordnet", f: (w) => !w.bestellung && !w.gutschein_bestellung },
    ],
    datum: "eingegangen_am",
    betrag: "erstattungsbetrag_cent",
  },
  retouren: {
    doctype: "PH Retoure",
    such: ["name", "bestellung", "widerruf", "titel"],
    ansichten: [
      { id: "alle", titel: "Alle" },
      { id: "offen", titel: "Offen", f: (r) => !["Erstattet", "Abgelehnt"].includes(r.status) },
    ],
    datum: "angekuendigt_am",
    betrag: "erstattungsbetrag_cent",
  },
  anzahlungen: {
    doctype: "PH Anzahlung",
    such: ["name", "anzahlung_id", "auftrag_referenz", "kunde_email", "titel"],
    ansichten: [
      { id: "alle", titel: "Alle" },
      { id: "offen", titel: "Offen", f: (a) => ["offen", "zahlung_ausstehend", "fehlgeschlagen"].includes(a.status) },
      { id: "abgelaufen", titel: "Link abgelaufen", f: (a, c) => ["offen", "fehlgeschlagen"].includes(a.status) && !!a.link_gueltig_bis && tagVon(a.link_gueltig_bis) < c.heute },
      { id: "doppelt", titel: "Doppelt", f: (a) => a.status === "doppelt" || (a.doppelt || []).length > 0 },
    ],
    datum: "erstellt",
    betrag: "betrag_cent",
  },
  ereignisse: {
    doctype: "PH Stripe Ereignis",
    such: ["name", "typ", "bezug", "art", "titel"],
    ansichten: [
      { id: "alle", titel: "Alle" },
      { id: "fehler", titel: "Fehler", f: (e) => e.status === "fehler" },
      { id: "streit", titel: "Zahlungsstreit", f: (e) => String(e.typ).startsWith("charge.dispute") },
      { id: "risiko", titel: "Risiko", f: (e) => String(e.typ).startsWith("review.") || String(e.typ).startsWith("radar.") },
      { id: "ignoriert", titel: "Ignoriert", f: (e) => e.status === "ignoriert" },
    ],
    datum: "empfangen_am",
  },
  auszahlungen: {
    doctype: "PH Stripe Auszahlung",
    such: ["name", "payout_id", "titel"],
    ansichten: [
      { id: "alle", titel: "Alle" },
      { id: "offen", titel: "Offen", f: (a) => ["angekuendigt", "unterwegs", "bezahlt"].includes(a.status) },
      { id: "differenz", titel: "Mit Differenz", f: (a) => Number(a.differenz_cent || 0) !== 0 },
    ],
    datum: "datum_erwartet",
    betrag: "betrag_cent",
  },
});

/** Testdaten erkennen (§ 2.4): Bestellung modus=test, Zahlung livemode=0, Gutschein test=1. */
export function istTest(doctype, d) {
  if (doctype === "PH Bestellung") return d.modus === "test";
  if (doctype === "PH Gutschein") return Number(d.test) === 1;
  if (["PH Zahlung", "PH Gutschein Bestellung", "PH Anzahlung", "PH Stripe Ereignis", "PH Stripe Auszahlung"].includes(doctype)) return Number(d.livemode) === 0 && d.livemode !== undefined && d.livemode !== null && d.livemode !== "";
  return false;
}

/** Freitextsuche (kleingeschrieben, Teiltreffer); Betrag „€ 89“ / „89,00“ trifft Beträge; Gutscheine nur letzte 4 Zeichen. */
export function passtSuche(liste, d, q) {
  const t = String(q || "").trim().toLowerCase();
  if (!t) return true;
  const def = LISTEN[liste];
  if (liste === "gutscheine") {
    const kurz = t.replace(/[^a-z0-9]/g, "").slice(-4);
    if (kurz.length >= 3 && String(d.code_letzte4 || "").toLowerCase().includes(kurz)) return true;
  }
  const betrag = /^€?\s*(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d{1,2}))?\s*€?$/.exec(t);
  if (betrag && def.betrag) {
    const c = Number(betrag[1].replace(/\./g, "")) * 100 + Number((betrag[2] || "0").padEnd(2, "0"));
    if (Math.abs(Number(d[def.betrag] || 0)) === c || Math.abs(Number(d.gesamt_cent || 0)) === c) return true;
  }
  return def.such.some((f) => String(d[f] ?? "").toLowerCase().includes(t));
}

/**
 * Ansicht + Filter + Suche + Sortierung + Seite anwenden.
 * @param {string} liste  Schlüssel aus LISTEN
 * @param {object[]} alle
 * @param {Record<string,string>} params  ansicht, status (Komma), lieferart, q, seite, groesse, test, von, bis
 * @param {{heute?:string, user?:string, leitung?:boolean}} ctx
 */
export function wendeAn(liste, alle, params = {}, ctx = {}) {
  const def = LISTEN[liste];
  const h = ctx.heute || heuteIso();
  const c = { ...ctx, heute: h };
  const ansichten = def.ansichten.filter((a) => !a.leitung || ctx.leitung);
  const ansichtId = ansichten.some((a) => a.id === params.ansicht) ? params.ansicht : ansichten[0].id;
  const ansicht = ansichten.find((a) => a.id === ansichtId);
  const mitTest = params.test === "1";
  const basis = alle.filter((d) => mitTest || !istTest(def.doctype, d));
  const zaehler = Object.fromEntries(ansichten.map((a) => [a.id, a.f ? basis.filter((d) => a.f(d, c)).length : basis.length]));
  const status = String(params.status || "").split(",").filter(Boolean);
  const von = params.von || null;
  const bis = params.bis || null;
  let zeilen = basis.filter((d) => (ansicht.f ? ansicht.f(d, c) : true));
  if (status.length) zeilen = zeilen.filter((d) => status.includes(d.status));
  if (params.lieferart) zeilen = zeilen.filter((d) => d.lieferart === params.lieferart);
  if (params.kanal) zeilen = zeilen.filter((d) => d.kanal === params.kanal);
  if (von) zeilen = zeilen.filter((d) => (tagVon(d[def.datum]) || "") >= von);
  if (bis) zeilen = zeilen.filter((d) => (tagVon(d[def.datum]) || "") <= bis);
  zeilen = zeilen.filter((d) => passtSuche(liste, d, params.q));
  if (liste === "bestellungen" && ansicht.arbeit) {
    zeilen = zeilen.map((d) => ({ d, k: faelligSchluessel(naechsterSchritt(d, { heute: h })) })).sort((x, y) => x.k.localeCompare(y.k)).map((x) => x.d);
  } else {
    zeilen = [...zeilen].sort((x, y) => String(y[def.datum] || "").localeCompare(String(x[def.datum] || "")));
  }
  const gesamt = zeilen.length;
  const summe = def.betrag ? zeilen.reduce((s, d) => s + Number(d[def.betrag] || 0), 0) : null;
  const groesse = SEITEN_GROESSEN.includes(Number(params.groesse)) ? Number(params.groesse) : 25;
  const seiten = Math.max(Math.ceil(gesamt / groesse), 1);
  const seite = Math.min(Math.max(Number(params.seite) || 1, 1), seiten);
  const gefiltert = !!(status.length || params.lieferart || params.kanal || params.q || von || bis);
  return {
    ansicht: ansichtId,
    ansichten: ansichten.map((a) => ({ id: a.id, titel: a.titel, anzahl: zaehler[a.id], arbeit: !!a.arbeit })),
    zeilen: zeilen.slice((seite - 1) * groesse, seite * groesse),
    alleGefiltert: zeilen,
    gesamt,
    summe,
    seite,
    seiten,
    groesse,
    gefiltert,
    nieDaten: alle.length === 0,
    arbeit: !!ansicht.arbeit,
  };
}

/** URL einer Liste mit geänderten Parametern (leere Werte fallen weg, Seite springt bei Filterwechsel auf 1). */
export function listenHref(basis, params, aenderung = {}) {
  const p = { ...params, ...aenderung };
  if (!("seite" in aenderung)) delete p.seite;
  const qs = Object.entries(p).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
  return qs ? `${basis}?${qs}` : basis;
}

/** Abholung mit Frist ≤ morgen (Kanban-Badge, Heute-Chip-Zusatz). */
export function fristMorgen(b, h = heuteIso()) {
  return !!b.abholung_bis && tageBis(h, b.abholung_bis) <= 1;
}

/** Massenaktion: welche Zeilen sind zulässig, welche werden übersprungen (Q-C10). */
export function massenPruefung(aktion, zeilen, ctx = {}) {
  const ok = [];
  const skip = [];
  for (const b of zeilen) {
    const g = grundFuer(aktion, b, ctx);
    if (g) skip.push({ name: b.name, grund: g });
    else ok.push(b.name);
  }
  return { ok, skip };
}

function grundFuer(aktion, b, ctx) {
  switch (aktion) {
    case "packen":
      if (b.status !== "bezahlt" || b.lieferart !== "versand") return "nicht bezahlt oder keine Versandbestellung";
      if (b.rechnung_uid && b.adresse_land === "DE" && !ctx.leitung) return "Steuerfall klären (Leitung)";
      return null;
    case "abholbereit":
      if (b.status === "pruefen") return "zuerst prüfen – Leitung";
      if (b.lieferart !== "abholung" || !["bezahlt", "reserviert"].includes(b.status)) return "nicht abholbereit meldbar";
      if (offen(b) > 0) return "erst nach Zahlung";
      return null;
    case "abschliessen":
      if (!["versendet", "abgeholt"].includes(b.status)) return "noch nicht versendet oder abgeholt";
      if (ctx.abschliessenAb?.[b.name] && tageBis(ctx.abschliessenAb[b.name], ctx.heute || heuteIso()) < 0) return `Widerrufsfrist läuft noch`;
      return null;
    case "bestaetigung":
      return b.kunde_email ? null : "keine E-Mail";
    case "stornieren":
      return ["versendet", "abgeholt", "abgeschlossen", "storniert", "erstattet", "widerrufen"].includes(b.status) ? "Status erlaubt kein Storno" : null;
    default:
      return null;
  }
}

/** Kurzer Zeitraum-Text für Berichte. */
export function zeitraumStandard(h = heuteIso()) {
  const von = `${h.slice(0, 7)}-01`;
  return { von: plusTage(von, -0), bis: h };
}
