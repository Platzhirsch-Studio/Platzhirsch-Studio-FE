// „Zu tun“ des Bereichs Faktura (10-konzept-faktura § 3.1, § 10): Regeln nur auf vorhandenen Feldern.
// Jede Zeile hat eine Icon-Form, ein Typ-Wort, einen Satz, den Betrag und genau eine Aktion.
// Schwellen sind Konstanten (Anzeige lesend in Stammdaten › Erinnerungen; Einstellung folgt mit P-35).
// Rein: bekommt die geladenen Daten, liefert Zeilen. Auch von der Zentrale nutzbar (aufgaben/faktura.js).

import { tageZwischen } from "./betraege.js";
import { monatName, vormonat } from "./regeln.js";

export const SCHWELLEN = Object.freeze({
  anzahlungAnfordernTage: 1,
  schlussrechnungTage: 3,
  entwurfTage: 2,
  exportAbTag: 5,
  abschlussAbTag: 10,
  rueckzahlungTage: 3,
  rueckzahlungRotTag: 12,
  angebotLaeuftAbTage: 7,
  nachfassenTage: 10,
  skontoTage: 5,
  maxZeilen: 8,
});

export const SCHWELLEN_TEXT = [
  ["Anzahlung anfordern", `AB offen, Anzahlung ohne Rechnung, älter als ${SCHWELLEN.anzahlungAnfordernTage} Tag`],
  ["Schlussrechnung", `AB geliefert und nicht abgerechnet, älter als ${SCHWELLEN.schlussrechnungTage} Tage`],
  ["Rechnungsentwurf", `älter als ${SCHWELLEN.entwurfTage} Tage`],
  ["Export an Kanzlei", `Vormonat ab dem ${SCHWELLEN.exportAbTag}.`],
  ["Monatsabschluss", `Vormonat ab dem ${SCHWELLEN.abschlussAbTag}. (Leitung)`],
  ["Rückzahlung", `fällig in höchstens ${SCHWELLEN.rueckzahlungTage} Tagen, rot ab Tag ${SCHWELLEN.rueckzahlungRotTag}`],
  ["Angebot läuft ab", `in höchstens ${SCHWELLEN.angebotLaeuftAbTage} Tagen`],
  ["Angebot nachfassen", `gesendet, ohne Bewegung seit ${SCHWELLEN.nachfassenTage} Tagen`],
];

/**
 * @typedef {{id:string, typ:string, icon:string, ton:string, satz:string, unter?:string, betrag_cent?:number|null,
 *   href?:string, aktion:{id:string, titel:string, href?:string, daten?:object}, rang:number}} ZuTunZeile
 */

/**
 * Zeilen „Zu tun“ für das Cockpit Buchhaltung.
 * @param {{heute:string, rolle:object, bank?:object[], mahnbar?:object[], er?:object[], auftraege?:object[], rechnungen?:object[],
 *   exporte?:object[], uva?:object[], gutschriften?:object[], abschlussVormonat?:boolean, kassaFehler?:object[]}} d
 * @returns {ZuTunZeile[]}
 */
export function zuTunBuchhaltung(d) {
  const { heute, rolle = {} } = d;
  const z = [];
  const tagImMonat = Number(String(heute).slice(8, 10));
  // Bank: sichere Vorschläge (Leitung)
  if (rolle.leitung) {
    const sicher = (d.bank || []).filter((b) => b.status === "Offen" && Number(b.vorschlag_sicherheit) >= 100 && b.vorschlag_doctype === "PH Rechnung");
    if (sicher.length) z.push({ id: "bank", typ: "Bank", icon: "Landmark", ton: "see", satz: `${sicher.length} ${sicher.length === 1 ? "Eingang" : "Eingänge"} mit sicherem Vorschlag`, betrag_cent: sicher.reduce((s, b) => s + (Number(b.betrag_cent) || 0), 0), href: "/faktura/bank", aktion: { id: "bank-zuordnen", titel: "Zuordnen", href: "/faktura/bank?r=offen" }, rang: 10 });
  }
  // Mahnen (eine Zeile)
  const mahnbar = (d.mahnbar || []).filter((r) => r.waehlbar);
  if (mahnbar.length && rolle.schreibt) {
    const aelteste = Math.max(...mahnbar.map((r) => r.tage));
    z.push({ id: "mahnen", typ: "Mahnen", icon: "TriangleAlert", ton: "eiche", satz: `${mahnbar.length} ${mahnbar.length === 1 ? "Rechnung" : "Rechnungen"} mahnbar · älteste ${aelteste} Tage überfällig`, betrag_cent: mahnbar.reduce((s, r) => s + (Number(r.offen_cent) || 0), 0), href: "/faktura/rechnungen?r=ueberfaellig", aktion: { id: "mahnen", titel: "Mahnen" }, rang: 20 });
  }
  // Eingangsrechnungen: Leitung → Sachlich geprüft freigeben, Mitarbeiter → Erfasst prüfen
  const erStatus = rolle.leitung ? "Sachlich geprueft" : "Erfasst";
  const ers = (d.er || []).filter((e) => e.status === erStatus).sort((a, b) => String(a.skonto_bis || a.faellig || "9").localeCompare(String(b.skonto_bis || b.faellig || "9")));
  for (const e of ers.slice(0, 2)) {
    const skonto = e.skonto_bis ? tageZwischen(heute, e.skonto_bis) : null;
    const kostenOffen = e.zuordnung_status === "Offen";
    z.push({
      id: `er-${e.name}`,
      typ: rolle.leitung ? "Freigeben" : "Prüfen",
      icon: "Clock",
      ton: "cognac",
      satz: `${e.name} ${e.lieferant_name || ""}${skonto !== null && skonto >= 0 ? ` · Skonto noch ${skonto} ${skonto === 1 ? "Tag" : "Tage"}` : ""}${kostenOffen ? " · Kosten offen" : ""}`,
      betrag_cent: Number(e.zahlbetrag_cent || e.brutto_cent) || 0,
      href: `/faktura/eingangsrechnungen/${encodeURIComponent(e.name)}`,
      aktion: rolle.leitung && !kostenOffen ? { id: "er-freigeben", titel: "Freigeben", daten: { name: e.name } } : { id: "er-oeffnen", titel: kostenOffen ? "Kosten zuordnen" : "Sachlich prüfen", href: `/faktura/eingangsrechnungen/${encodeURIComponent(e.name)}${kostenOffen ? "?tab=kosten" : ""}` },
      rang: 30,
    });
  }
  // Anzahlung anfordern
  for (const ab of (d.auftraege || []).filter((a) => a.status === "Offen" && (Number(a.anzahlung_soll_cent) || 0) > (Number(a.anzahlung_ist_cent) || 0) && a.anzahlung_ohne_rechnung && tageZwischen(a.datum, heute) >= SCHWELLEN.anzahlungAnfordernTage).slice(0, 2)) {
    z.push({ id: `anz-${ab.name}`, typ: "Anzahlung", icon: "Circle", ton: "stein", satz: `${ab.name} ${ab.kunde_name || ""} · noch nicht angefordert`, betrag_cent: (Number(ab.anzahlung_soll_cent) || 0) - (Number(ab.anzahlung_ist_cent) || 0), href: `/faktura/auftraege/${encodeURIComponent(ab.name)}`, aktion: { id: "anzahlung", titel: "Anzahlung anfordern", daten: { auftrag: ab.name } }, rang: 40 });
  }
  // Schlussrechnung
  for (const ab of (d.auftraege || []).filter((a) => a.status === "Geliefert" && (Number(a.abgerechnet_cent) || 0) < (Number(a.auftragswert_cent) || 0) && tageZwischen(a.modified || a.datum, heute) >= SCHWELLEN.schlussrechnungTage).slice(0, 2)) {
    z.push({ id: `schluss-${ab.name}`, typ: "Rechnung", icon: "Circle", ton: "stein", satz: `${ab.name} ${ab.kunde_name || ""} · geliefert, nicht abgerechnet`, betrag_cent: (Number(ab.auftragswert_cent) || 0) - (Number(ab.abgerechnet_cent) || 0), href: `/faktura/auftraege/${encodeURIComponent(ab.name)}`, aktion: { id: "schlussrechnung", titel: "Schlussrechnung", href: `/faktura/auftraege/${encodeURIComponent(ab.name)}/abrechnen?art=schluss` }, rang: 50 });
  }
  // Rechnungsentwürfe älter als 2 Tage
  const entwuerfe = (d.rechnungen || []).filter((r) => Number(r.docstatus) === 0 && r.status === "Entwurf" && tageZwischen(String(r.creation || r.datum).slice(0, 10), heute) > SCHWELLEN.entwurfTage);
  if (entwuerfe.length) z.push({ id: "entwuerfe", typ: "Entwurf", icon: "FileText", ton: "stein", satz: `${entwuerfe.length} ${entwuerfe.length === 1 ? "Rechnungsentwurf wartet" : "Rechnungsentwürfe warten"} auf das Stellen`, betrag_cent: entwuerfe.reduce((s, r) => s + (Number(r.brutto_cent) || 0), 0), href: "/faktura/rechnungen?r=entwuerfe", aktion: { id: "entwuerfe", titel: "Ansehen", href: "/faktura/rechnungen?r=entwuerfe" }, rang: 60 });
  // Rückzahlungen (Gutschrift Rückzahlung, nicht erstattet)
  for (const g of (d.gutschriften || []).filter((x) => Number(x.docstatus) === 1 && /R(ü|ue)ckzahlung/.test(x.erstattung_art || "") && (Number(x.erstattet_cent) || 0) < (Number(x.brutto_cent) || 0))) {
    const tage = tageZwischen(g.datum, heute);
    if (rolle.leitung) z.push({ id: `rueck-${g.name}`, typ: "Rückzahlung", icon: "Undo2", ton: tage >= SCHWELLEN.rueckzahlungRotTag ? "ziegel" : "eiche", satz: `${g.kunde_name || g.name} · Rückzahlung ${tage >= 14 ? "überfällig" : `fällig in ${Math.max(14 - tage, 0)} Tagen`}`, betrag_cent: (Number(g.brutto_cent) || 0) - (Number(g.erstattet_cent) || 0), href: `/faktura/gutschriften/${encodeURIComponent(g.name)}`, aktion: { id: "erstatten", titel: "Erstatten", href: `/faktura/gutschriften/${encodeURIComponent(g.name)}?aktion=erstatten` }, rang: tage >= SCHWELLEN.rueckzahlungRotTag ? 5 : 45 });
  }
  // Kassa-Datenfehler (§ 2.8)
  for (const k of d.kassaFehler || []) z.push({ id: `kassa-${k.name}`, typ: "Kassa", icon: "TriangleAlert", ton: "ziegel", satz: `${k.name} · Kassa-Zahlung ohne Anzahlungsrechnung`, betrag_cent: Number(k.betrag_cent) || null, href: `/faktura/auftraege/${encodeURIComponent(k.name)}`, aktion: { id: "kassa-pruefen", titel: "Prüfen", href: `/faktura/auftraege/${encodeURIComponent(k.name)}` }, rang: 4 });
  // Export Vormonat ab dem 5.
  const vm = vormonat(heute);
  if (rolle.leitung && tagImMonat >= SCHWELLEN.exportAbTag) {
    const da = (d.exporte || []).some((e) => String(e.zeitraum_bis || "").slice(0, 7) >= vm && e.status !== "Entwurf");
    if (!da) z.push({ id: "export", typ: "Export", icon: "Clock", ton: "stein", satz: `${monatName(vm, false)} noch nicht an Kanzlei`, betrag_cent: null, href: "/faktura/export", aktion: { id: "export", titel: "Export erzeugen", href: "/faktura/export?panel=export" }, rang: 70 });
  }
  // UVA berechnet, nicht übergeben
  for (const u of (d.uva || []).filter((x) => x.status === "Berechnet")) {
    if (rolle.leitung) z.push({ id: `uva-${u.name}`, typ: "UVA", icon: "FileText", ton: "stein", satz: `UVA ${monatName(u.zeitraum_von, false)} prüfen und übergeben`, betrag_cent: null, href: `/faktura/uva?monat=${String(u.zeitraum_von).slice(0, 7)}`, aktion: { id: "uva", titel: "Prüfen", href: `/faktura/uva?monat=${String(u.zeitraum_von).slice(0, 7)}` }, rang: 75 });
  }
  // Monatsabschluss Vormonat ab dem 10.
  if (rolle.leitung && tagImMonat >= SCHWELLEN.abschlussAbTag && d.abschlussVormonat === false) {
    z.push({ id: "abschluss", typ: "Abschluss", icon: "Lock", ton: "stein", satz: `${monatName(vm, false)} noch nicht abgeschlossen`, betrag_cent: null, href: "/faktura/abschluss", aktion: { id: "abschluss", titel: "Ansehen", href: "/faktura/abschluss" }, rang: 80 });
  }
  return z.sort((a, b) => a.rang - b.rang).slice(0, SCHWELLEN.maxZeilen);
}

/** Zeilen „Zu tun“ für das Cockpit Vertrieb (Angebote nachfassen, ablaufend, Anzahlung anfordern). */
export function zuTunVertrieb({ heute, angebote = [], auftraege = [] }) {
  const z = [];
  const bald = angebote.filter((a) => a.status === "Gesendet" && a.gueltig_bis && tageZwischen(heute, a.gueltig_bis) >= 0 && tageZwischen(heute, a.gueltig_bis) <= SCHWELLEN.angebotLaeuftAbTage);
  for (const a of bald.slice(0, 3)) {
    const t = tageZwischen(heute, a.gueltig_bis);
    z.push({ id: `bald-${a.name}`, typ: "Läuft ab", icon: "Clock", ton: "eiche", satz: `${a.name} ${a.kunde_name || ""} · gültig ${t === 0 ? "bis heute" : t === 1 ? "bis morgen" : `noch ${t} Tage`}`, betrag_cent: Number(a.brutto_cent) || 0, href: `/faktura/angebote/${encodeURIComponent(a.name)}`, aktion: { id: "nachfassen", titel: "Nachfassen", href: `/faktura/angebote/${encodeURIComponent(a.name)}?aktion=senden` }, rang: 10 });
  }
  const ruhig = angebote.filter((a) => a.status === "Gesendet" && a.gesendet_am && tageZwischen(a.gesendet_am, heute) > SCHWELLEN.nachfassenTage && !bald.includes(a));
  if (ruhig.length) z.push({ id: "nachfassen", typ: "Nachfassen", icon: "MessageSquare", ton: "stein", satz: `${ruhig.length} ${ruhig.length === 1 ? "Angebot ruht" : "Angebote ruhen"} seit über ${SCHWELLEN.nachfassenTage} Tagen`, betrag_cent: ruhig.reduce((s, a) => s + (Number(a.brutto_cent) || 0), 0), href: "/faktura/angebote?r=offen", aktion: { id: "nachfassen-liste", titel: "Ansehen", href: "/faktura/angebote?r=offen" }, rang: 20 });
  for (const ab of auftraege.filter((a) => a.status === "Offen" && (Number(a.anzahlung_soll_cent) || 0) > (Number(a.anzahlung_ist_cent) || 0) && a.anzahlung_ohne_rechnung).slice(0, 3)) {
    z.push({ id: `anz-${ab.name}`, typ: "Anzahlung", icon: "Circle", ton: "stein", satz: `${ab.name} ${ab.kunde_name || ""} · Anzahlung anfordern`, betrag_cent: (Number(ab.anzahlung_soll_cent) || 0) - (Number(ab.anzahlung_ist_cent) || 0), href: `/faktura/auftraege/${encodeURIComponent(ab.name)}`, aktion: { id: "anzahlung", titel: "Anzahlung anfordern", daten: { auftrag: ab.name } }, rang: 30 });
  }
  return z.sort((a, b) => a.rang - b.rang).slice(0, SCHWELLEN.maxZeilen);
}
