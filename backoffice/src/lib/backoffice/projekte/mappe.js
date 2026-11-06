// Reine Ableitungen für die Auftragsmappe (10-konzept-projekte.md § 4): Phasenleiste als Vorgangsleiste, nächster
// Termin, Fortschritt, Termine-Liste, Mini-Gantt, Aktivitätsstrom, Mock-Eingabe der Nachkalkulation. Ohne React,
// ohne Server – unit-getestet.

import { PHASEN, statusText } from "./texte.js";
import { kalkulationV2, parameter } from "./kalkulation.js";
import { stundenVon } from "./montage.js";

const ISO = (d) => String(d || "").slice(0, 10);
const tagText = (d) => {
  const s = ISO(d);
  if (!s) return "";
  const [, m, t] = s.split("-");
  return `${t}.${m}.`;
};

/**
 * Phasen → Schritte der Vorgangsleiste (9 Punkte, Abgebrochen ersetzt den letzten).
 * Objekte je Phase aus den Mappe-Listen nach Datum zugeordnet (Popover am Stufennamen).
 */
export function phasenSchritte(m) {
  const p = m.projekt || {};
  const verlauf = m.phasen || [];
  const abgebrochen = p.status === "Abgebrochen";
  const aktuell = abgebrochen ? -1 : PHASEN.indexOf(p.status);
  const letzteVon = (phase) => [...verlauf].reverse().find((v) => v.phase === phase);
  const enc = encodeURIComponent;
  const objekte = {
    Anfrage: (m.termine || []).map((t) => ({ titel: t.titel || t.terminart || "Termin", info: tagText(t.start) })),
    Planung: [...(m.aufmasse || []).map((a) => ({ titel: a.titel || "Aufmaß", href: `/projekte/${enc(p.name)}/aufmass/${enc(a.name)}`, info: statusText("PH Aufmass", a.status) })), ...(m.planungen || []).map((x) => ({ titel: x.titel || x.bezeichnung, href: `/projekte/${enc(p.name)}/planung/${enc(x.name)}`, info: statusText("PH Planung", x.status) }))],
    Angebot: (m.angebote || []).map((a) => ({ titel: a.name, info: a.status })),
    Auftrag: (m.auftraege || []).map((a) => ({ titel: a.name, info: a.status })),
    Bestellung: (m.herstellerbestellungen || []).map((h) => ({ titel: h.name, info: h.status })),
    Lieferung: (m.lieferscheine || []).map((l) => ({ titel: l.name, info: l.status })),
    Montage: [...(m.montagen || [])].sort((a, b) => String(a.start).localeCompare(String(b.start))).map((x) => ({ titel: `Montage ${tagText(x.start)}`, href: `/projekte/montagen/${enc(x.name)}`, info: statusText("PH Montageauftrag", x.status) })),
    Uebergabe: (m.abnahmen || []).map((a) => ({ titel: a.titel || a.name, href: `/projekte/abnahmen/${enc(a.name)}`, info: statusText("PH Abnahme", a.status) })),
    Abgeschlossen: [],
  };
  const pos = (m.positionen || []).filter((x) => x.lieferstatus !== "storniert");
  const geliefert = pos.filter((x) => ["geliefert", "montiert"].includes(x.lieferstatus)).length;
  return PHASEN.map((phase, i) => {
    let zustand = i < aktuell ? "erledigt" : i === aktuell ? "aktuell" : "offen";
    if (abgebrochen) zustand = letzteVon(phase) ? "erledigt" : "uebersprungen";
    if (i === aktuell && (phase === "Bestellung" || phase === "Lieferung") && pos.length && geliefert > 0 && geliefert < pos.length) zustand = "teilweise";
    if (phase === "Abgeschlossen" && p.status === "Abgeschlossen") zustand = "erledigt";
    const v = letzteVon(phase);
    const titel = abgebrochen && phase === "Abgeschlossen" ? "Abgebrochen" : statusText("PH Projekt", phase);
    return { id: phase, titel, zustand, datum: v ? tagText(v.datum) : "", objekte: objekte[phase] || [], quelle: v?.notiz?.startsWith("System") ? "system" : v ? "manuell" : "", von: v?.von || "", notiz: v?.notiz || "" };
  });
}

/** Alle Termine des Projekts (PH Termin, Montagen, Fremdgewerk-Termine, Liefertermin), sortiert, ab heute. */
export function termineListe(m, heute) {
  const out = [];
  for (const t of m.termine || []) out.push({ art: "termin", titel: t.titel || t.terminart || "Termin", start: t.start, ende: t.ende, href: null });
  for (const x of m.montagen || []) if (x.status !== "Abgebrochen") out.push({ art: "montage", titel: `Montage · ${statusText("PH Montageauftrag", x.status)}`, start: x.start, ende: x.ende, href: `/projekte/montagen/${encodeURIComponent(x.name)}`, montage: x });
  for (const g of m.gewerke || []) {
    const termine = g.termine?.length ? g.termine : g.termin_von ? [{ art: "Termin", von: g.termin_von, bis: g.termin_bis }] : [];
    for (const t of termine) if (t.status !== "abgesagt") out.push({ art: "fremdgewerk", titel: `${g.gewerk} · ${t.art}`, start: t.von, ende: t.bis, href: `/projekte/fremdgewerke?gewerk=${encodeURIComponent(g.name)}` });
  }
  if (m.projekt?.liefertermin_geplant) out.push({ art: "lieferung", titel: "Liefertermin", start: `${ISO(m.projekt.liefertermin_geplant)} 00:00:00`, ganztag: true, href: null });
  for (const a of m.abnahmen || []) if (a.datum) out.push({ art: "abnahme", titel: `Abnahme · ${statusText("PH Abnahme", a.status)}`, start: `${ISO(a.datum)} 00:00:00`, ganztag: true, href: `/projekte/abnahmen/${encodeURIComponent(a.name)}` });
  return out.filter((t) => t.start && (!heute || ISO(t.ende || t.start) >= heute)).sort((a, b) => String(a.start).localeCompare(String(b.start)));
}

/** Nächster Termin (für Kopf-Glaskachel, Listen). */
export function naechsterTermin(m, heute) {
  const l = termineListe(m, heute);
  return l.find((t) => !heute || ISO(t.start) >= heute) || l[0] || null;
}

/** Mini-Gantt: Balken je Zeile für 8 Wochen ab Wochenbeginn. */
export function miniGantt(m, heute, wochen = 8) {
  const start = new Date(`${heute}T12:00:00`);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const von = ISO(start.toISOString());
  const bisD = new Date(start);
  bisD.setDate(bisD.getDate() + wochen * 7 - 1);
  const bis = ISO(bisD.toISOString());
  const tage = wochen * 7;
  const lage = (a, b) => {
    const s = Math.max(0, Math.round((new Date(`${ISO(a)}T12:00:00`) - start) / 86400000));
    const e = Math.min(tage - 1, Math.round((new Date(`${ISO(b || a)}T12:00:00`) - start) / 86400000));
    return e < 0 || s > tage - 1 ? null : { links: (s / tage) * 100, breite: (Math.max(1, e - s + 1) / tage) * 100 };
  };
  const zeilen = [];
  if (m.projekt?.liefertermin_geplant) {
    const l = lage(m.projekt.liefertermin_geplant);
    if (l) zeilen.push({ id: "lieferung", titel: "Lieferung", art: "raute", ...l, text: `Liefertermin ${tagText(m.projekt.liefertermin_geplant)}` });
  }
  for (const x of m.montagen || []) {
    if (x.status === "Abgebrochen") continue;
    const l = lage(x.start, x.ende);
    if (l) zeilen.push({ id: x.name, titel: "Montage", art: "balken", ...l, text: `Montage ${tagText(x.start)}${ISO(x.ende) !== ISO(x.start) ? `–${tagText(x.ende)}` : ""}, ${statusText("PH Montageauftrag", x.status)}` });
  }
  for (const g of m.gewerke || []) {
    if (!g.termin_von || g.status === "Abgesagt") continue;
    const l = lage(g.termin_von, g.termin_bis);
    if (l) zeilen.push({ id: g.name, titel: g.gewerk, art: "gestrichelt", ...l, text: `${g.gewerk} ${tagText(g.termin_von)}–${tagText(g.termin_bis || g.termin_von)}` });
  }
  for (const a of m.abnahmen || []) {
    const l = a.datum && lage(a.datum);
    if (l) zeilen.push({ id: a.name, titel: "Abnahme", art: "hohl", ...l, text: `Abnahme ${tagText(a.datum)}` });
  }
  const heuteLinks = ((Math.round((new Date(`${heute}T12:00:00`) - start) / 86400000) + 0.5) / tage) * 100;
  const kw = [];
  for (let w = 0; w < wochen; w++) {
    const d = new Date(start);
    d.setDate(d.getDate() + w * 7);
    kw.push({ links: ((w * 7) / tage) * 100, text: `KW ${isoKw(d)}` });
  }
  return { von, bis, zeilen, heuteLinks, kw };
}

function isoKw(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const tag = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - tag + 3);
  const erster = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((t - erster) / 86400000 - 3 + ((erster.getUTCDay() + 6) % 7)) / 7);
}

/** Kalenderwoche als Text „KW 47“. */
export function kwText(iso) {
  const s = ISO(iso);
  if (!s) return "";
  return `KW ${isoKw(new Date(`${s}T12:00:00`))}`;
}

/**
 * Aktivitätsstrom (§ 4.5): Nachrichten, Phasenwechsel, Rückmeldungen, Montagestatus, Abnahme, Kommentare, Belege.
 * @returns {Array<{id, zeit, art:"kunde"|"team"|"belege"|"system", titel, text?, autor?, quelle?, intern?, href?, icon}>}
 */
export function aktivitaetsStrom(m, { kommentare = [] } = {}) {
  const out = [];
  for (const n of m.nachrichten || []) out.push({ id: `n:${n.name}`, zeit: n.gesendet_am, art: n.richtung === "eingehend" ? "kunde" : "team", titel: n.richtung === "eingehend" ? `Nachricht von ${n.autor || "Kunde"}` : "Nachricht an Kunde", text: n.text, autor: n.autor, quelle: n.richtung === "eingehend" ? "portal" : "backoffice", icon: "MessageSquare", ungelesen: n.status === "Ungelesen" });
  for (const v of m.phasen || []) out.push({ id: `p:${v.phase}:${v.datum}`, zeit: v.datum, art: "system", titel: `Phase ${statusText("PH Projekt", v.phase)}`, text: v.notiz || "", quelle: v.notiz?.startsWith("System") ? "system" : "backoffice", icon: "Layers" });
  for (const f of m.feedback_offen || []) out.push({ id: `f:${f.name}`, zeit: f.erstellt_am, art: "kunde", titel: f.art === "sprachnachricht" ? "Sprachnotiz zum Rendering" : "Rückmeldung zum Rendering", text: f.text, autor: f.autor, quelle: "portal", icon: f.art === "sprachnachricht" ? "Play" : "MapPin", href: f.rendering ? `/projekte/${encodeURIComponent(m.projekt.name)}/renderings/${encodeURIComponent(f.rendering)}` : null });
  for (const x of m.montagen || []) if (x.tatsaechlich_start) out.push({ id: `m:${x.name}`, zeit: x.tatsaechlich_start, art: "team", titel: `Montage begonnen`, text: x.titel, quelle: "mobil", icon: "Hammer", href: `/projekte/montagen/${encodeURIComponent(x.name)}` });
  for (const a of m.abnahmen || []) if (a.unterzeichnet_am) out.push({ id: `a:${a.name}`, zeit: a.unterzeichnet_am, art: "kunde", titel: `Abnahme unterzeichnet · ${statusText("PH Abnahme", a.status)}`, quelle: "mobil", icon: "PenTool", href: `/projekte/abnahmen/${encodeURIComponent(a.name)}` });
  for (const r of [...(m.angebote || []), ...(m.auftraege || []), ...(m.rechnungen || [])]) out.push({ id: `b:${r.name}`, zeit: r.datum ? `${ISO(r.datum)} 12:00:00` : r.modified, art: "belege", titel: `Beleg ${r.name}`, text: r.art || r.status || "", quelle: "backoffice", icon: "Receipt" });
  for (const k of kommentare) {
    if (k.comment_type === "Workflow" || k.comment_type === "Info") out.push({ id: `k:${k.name}`, zeit: k.creation, art: "system", titel: k.comment_type === "Workflow" ? String(k.content || "").replace(/^Workflow:\s*/, "Phase: ") : "System", text: k.comment_type === "Info" ? k.content : "", quelle: "system", icon: "Info" });
    else if (k.comment_type === "Comment") out.push({ id: `k:${k.name}`, zeit: k.creation, art: "team", titel: "Interne Notiz", text: k.content, autor: k.owner, intern: true, quelle: "backoffice", icon: "Lock" });
  }
  return out.filter((e) => e.zeit).sort((a, b) => String(b.zeit).localeCompare(String(a.zeit)));
}

/**
 * Mock-Eingabe der Nachkalkulation aus Seed-Daten – dieselbe Struktur wie nachkalkulation.daten_sammeln():
 * Ist = gelieferte/montierte Positionen (EK, als zugeordnete Eingangsrechnung), Projektzeiten × Satz, erledigte
 * Fremdgewerke; Obligo = bestellte Positionen, geplante Fremdgewerke. Erlös = Positionen (VK) + freigegebene Nachträge.
 */
export function kalkulationAusMappe(m, { einstellungen = {}, kostenarten = [], stichtag } = {}) {
  const p = m.projekt || {};
  const pos = (m.positionen || []).filter((x) => x.lieferstatus !== "storniert");
  const saetze = einstellungen.kostensaetze || [];
  const satz = (t) => {
    const alias = { Koordination: "Projektleitung", Buero: "Projektleitung" };
    const z = saetze.find((s) => s.taetigkeit === t) || saetze.find((s) => s.taetigkeit === alias[t]);
    return Number(z?.satz_cent || 0);
  };
  const ist = [];
  const obligo = [];
  const hinweise = [];
  for (const x of pos) {
    const wert = Number(x.ek_cent || 0) * Math.max(Number(x.menge || 1), 1);
    if (!wert) continue;
    const datum = ISO(x.liefertermin) || ISO(p.eingang);
    if (["geliefert", "montiert"].includes(x.lieferstatus)) ist.push({ kostenart: "Ware", betrag_cent: wert, datum, quelle_doctype: "PH Eingangsrechnung", quelle_name: `ER zu ${x.marke || "Hersteller"}`, text: x.bezeichnung });
    else if (x.lieferstatus === "teilgeliefert") {
      ist.push({ kostenart: "Ware", betrag_cent: Math.round(wert / 2), datum, quelle_doctype: "PH Eingangsrechnung", quelle_name: `ER zu ${x.marke || "Hersteller"}`, text: `${x.bezeichnung} (Teillieferung)` });
      obligo.push({ kostenart: "Ware", betrag_cent: wert - Math.round(wert / 2), datum, quelle_doctype: "PH Herstellerbestellung", quelle_name: x.herstellerbestellung || "Bestellung", text: x.bezeichnung });
    } else if (["bestellt", "bestaetigt"].includes(x.lieferstatus)) obligo.push({ kostenart: "Ware", betrag_cent: wert, datum: ISO(p.eingang), quelle_doctype: "PH Herstellerbestellung", quelle_name: x.herstellerbestellung || "Bestellung", text: x.bezeichnung });
  }
  let stunden = 0;
  for (const z of m.zeiten || []) {
    const h = Number(z.dauer_min || 0) / 60;
    stunden += h;
    const betrag = Math.round(h * satz(z.taetigkeit));
    if (betrag) ist.push({ kostenart: ["Montage", "Fahrt", "Service"].includes(z.taetigkeit) ? "Montage eigen" : "Planung intern", betrag_cent: betrag, datum: ISO(z.datum), quelle_doctype: "PH Projektzeit", quelle_name: z.name, text: `${z.taetigkeit} ${(Math.round(h * 10) / 10).toLocaleString("de-DE")} h` });
  }
  for (const g of m.gewerke || []) {
    if (Number(g.vertrag_direkt_kunde) || !Number(g.kosten_cent)) continue;
    const z = { kostenart: "Fremdgewerk", betrag_cent: Number(g.kosten_cent), datum: ISO(g.termin_von) || ISO(p.eingang), quelle_doctype: "PH Fremdgewerk", quelle_name: g.name, text: `${g.gewerk} ${g.partner_text || ""}`.trim() };
    if (g.status === "Erledigt") ist.push(z);
    else if (["Geplant", "In Arbeit"].includes(g.status)) obligo.push(z);
  }
  if (!saetze.length || saetze.some((s) => Number(s.platzhalter))) hinweise.push("Kostensätze sind Beispielwerte (Platzhalter) – Sätze vom Inhaber offen.");
  const vk = pos.reduce((s, x) => s + Number(x.preis_cent || 0) * Math.max(Number(x.menge || 1), 1), 0);
  const nachtraege = (m.nachtraege || []).filter((n) => n.status === "Freigegeben").reduce((s, n) => s + Number(n.differenz_cent || 0), 0);
  const planH = (m.montagen || []).filter((x) => x.status !== "Abgebrochen").reduce((s, x) => s + stundenVon(x), 0);
  const montageH = (m.zeiten || []).filter((z) => z.taetigkeit === "Montage").reduce((s, z) => s + Number(z.dauer_min || 0) / 60, 0);
  const e = {
    erloes: { auftrag_netto_cent: vk, nachtraege_cent: nachtraege, rechnungen: [] },
    kostenarten,
    ist,
    obligo,
    budget: (m.budget || []).map((b) => ({ kostenart: b.kostenart, budget_auftrag_cent: b.budget_auftrag_cent, budget_aktuell_cent: b.budget_aktuell_cent, prognose_rest_manuell_cent: Number(b.prognose_manuell) ? b.prognose_rest_cent : null, prognose_begruendung: b.prognose_begruendung })),
    fortschritt: { phase: p.status, positionen: pos, montage_h_ist: montageH, montage_h_plan: planH },
    parameter: parameter({ ziel_db: einstellungen.ziel_db, gemeinkosten: einstellungen.gemeinkosten_regeln, budget_gelb: einstellungen.budget_gelb_prozent, budget_rot: einstellungen.budget_rot_prozent, ampel_gelb_unter: einstellungen.ampel_gelb_unter, ampel_rot_unter: einstellungen.ampel_rot_unter }, p.projektart, stichtag),
    stunden_ist: stunden,
    stunden_prognose: Math.max(stunden, planH),
    hinweise,
  };
  const r = kalkulationV2(e);
  r.projekt = { name: p.name, titel: p.titel, status: p.status, projektart: p.projektart, kunde_name: p.kunde_name };
  r.stichtag = stichtag;
  r.eingerichtet = !!Number(einstellungen.kalkulation_eingerichtet);
  return r;
}
