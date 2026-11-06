// Akten-Logik des Bereichs Faktura (10-konzept-faktura § 4, rein): Primäraktion je Zustand, „⋯“-Menü mit Rechte- und
// Schalter-Regeln (§ 2.6, E6), höchstens ein Band in der Rangfolge Storniert > Monat abgeschlossen > Exportiert >
// Entwurf-Hinweis (§ 2.1), Belegkette für die Vorgangsleiste.

import { cent, datum } from "../format.js";
import { AKTE, AKTION, RECHT, ANGEBOT, ABSCHLUSS } from "./texte.js";
import { monatName, folgemonat } from "./regeln.js";

const nur = (rolle) => (rolle.leitung ? {} : { deaktiviert: true, grund: RECHT.nurLeitung });

/** Primäraktion einer Rechnung (§ 4.1). */
export function rechnungPrimaer(r, rolle) {
  if (!rolle.schreibt) return null;
  if (Number(r.docstatus) === 0) return { id: "stellen", titel: AKTION.stellen };
  if (["Bezahlt", "Storniert", "Uneinbringlich"].includes(r.status) || !(Number(r.offen_cent) > 0)) return null;
  if (["Ueberfaellig", "Gemahnt"].includes(r.status) && !r.mahnsperre && Number(r.mahnstufe) < 3) return { id: "mahnen", titel: AKTION.mahnenStufe(Math.min((Number(r.mahnstufe) || 0) + 1, 3)) };
  return { id: "zahlung", titel: AKTION.zahlungErfassen };
}

/** „⋯“-Menü einer Rechnung (§ 4.1): jede Aktion 1× sichtbar + 1× hier; Gesperrtes mit Grund. */
export function rechnungMenue(r, rolle, schalter = {}) {
  const gestellt = Number(r.docstatus) === 1;
  const m = [];
  const add = (x) => x && m.push(x);
  if (!rolle.schreibt) return [{ id: "pdf", titel: AKTION.pdf, icon: "FileText", href: `/druck/ph-rechnung/${encodeURIComponent(r.name)}` }];
  if (!gestellt) {
    if (r.auftrag) add({ id: "anzahlungen-abziehen", titel: AKTE.anzahlungAbziehen, icon: "Undo2" });
    add({ id: "stellen", titel: AKTION.stellen, icon: "BadgeCheck", taste: "⌘↵" });
  } else {
    if (Number(r.offen_cent) > 0 && !["Storniert", "Uneinbringlich"].includes(r.status)) add({ id: "zahlung", titel: AKTION.zahlungErfassen, icon: "Banknote", taste: "⇧Z", kuerzelId: "faktura.akte-zahlung" });
    add({ id: "senden", titel: AKTION.senden, icon: "Mail", taste: "⇧S", kuerzelId: "faktura.akte-senden" });
    if (["Ueberfaellig", "Gemahnt"].includes(r.status) && !r.mahnsperre && Number(r.mahnstufe) < 3) add({ id: "mahnen", titel: AKTION.mahnen, icon: "TriangleAlert", taste: "⇧M", kuerzelId: "faktura.akte-mahnen" });
    add({ trenner: true, id: "t1" });
    if (r.status !== "Storniert") {
      add({ id: "gutschrift", titel: AKTION.gutschrift, icon: "Undo2", taste: "⇧G", kuerzelId: "faktura.akte-gutschrift" });
      const mitZahlung = Number(r.bezahlt_cent) > 0;
      add({ id: "korrigieren", titel: AKTION.korrigieren, icon: "Pencil", ...(mitZahlung && !schalter.korrekturMitZahlung ? { deaktiviert: true, grund: "Rechnung hat Zahlungen – Korrektur folgt mit dem Backend" } : r.export_status === "exportiert" && !rolle.leitung ? { deaktiviert: true, grund: RECHT.nurLeitung } : {}) });
      if (schalter.differenz && Number(r.offen_cent) > 0) add({ id: "rest", titel: AKTION.restAusbuchen, icon: "Scale" });
      add({ id: "mahnsperre", titel: r.mahnsperre ? "Mahnsperre aufheben" : AKTION.mahnsperre, icon: "Lock" });
    }
    if (["Ueberfaellig", "Gemahnt"].includes(r.status)) add({ id: "uneinbringlich", titel: AKTION.uneinbringlich, icon: "CircleX", gefaehrlich: true, ...(schalter.uneinbringlich ? nur(rolle) : { deaktiviert: true, grund: "Folgt – Steuerberichtigung fehlt noch" }) });
  }
  add({ trenner: true, id: "t2" });
  add({ id: "pdf", titel: AKTION.pdf, icon: "FileText", href: `/druck/ph-rechnung/${encodeURIComponent(r.name)}` });
  if (r.auftrag) add({ id: "auftrag", titel: AKTION.auftragOeffnen, icon: "BadgeCheck", href: `/faktura/auftraege/${encodeURIComponent(r.auftrag)}`, taste: "⇧A" });
  if (r.kontakt) add({ id: "kunde", titel: AKTION.kundenakte, icon: "Contact", href: `/d/ph-kontakt/${encodeURIComponent(r.kontakt)}`, taste: "⇧K" });
  return m;
}

/** Höchstens ein Band (§ 2.1): Storniert > Monat abgeschlossen > Exportiert > Entwurf-Hinweis > Kassa-Datenfehler. */
export function rechnungBand(r, { gesperrtBis } = {}) {
  if (r.status === "Storniert") return { ton: "gefahr", titel: AKTE.storniertBanner(r.storno_durch || "Gutschrift", datum(r.storniert_am)) };
  if (gesperrtBis && r.datum && r.datum <= gesperrtBis) return { ton: "info", titel: ABSCHLUSS.banner(monatName(gesperrtBis, false), monatName(folgemonat(gesperrtBis), false)) };
  if (r.export_status === "exportiert") return { ton: "info", titel: AKTE.exportiertBanner(r.export_lauf || "") };
  if (Number(r.docstatus) === 0 && r.korrektur_von) return { ton: "info", titel: `Korrektur zu ${r.korrektur_von}: Beim Stellen wird ${r.korrektur_von} per Gutschrift aufgehoben` };
  if (Number(r.docstatus) === 0) return { ton: "info", titel: AKTE.entwurfBanner };
  return null;
}

/** Belegkette für die Vorgangsleiste (Anfrage … Bezahlt), Belege unter den Punkten. */
export function belegkette({ angebot, auftrag, rechnungen = [], aktuell }) {
  const st = (fertig, jetzt) => (jetzt ? "aktuell" : fertig ? "erledigt" : "offen");
  const re = rechnungen.filter((r) => Number(r.docstatus) === 1);
  const bezahlt = re.length > 0 && re.every((r) => r.status === "Bezahlt");
  return [
    { id: "angebot", titel: "Angebot", zustand: st(!!angebot, aktuell === "angebot"), objekte: angebot ? [{ titel: angebot.name, href: `/faktura/angebote/${encodeURIComponent(angebot.name)}`, info: angebot.status }] : [] },
    { id: "auftrag", titel: "Auftrag", zustand: st(!!auftrag, aktuell === "auftrag"), objekte: auftrag ? [{ titel: auftrag.name, href: `/faktura/auftraege/${encodeURIComponent(auftrag.name)}`, info: auftrag.status }] : [] },
    { id: "lieferung", titel: "Lieferung", zustand: st(auftrag && ["Teilgeliefert", "Geliefert", "Abgerechnet"].includes(auftrag.status), false), objekte: [] },
    { id: "rechnung", titel: "Rechnung", zustand: st(re.length > 0, aktuell === "rechnung"), objekte: rechnungen.slice(0, 4).map((r) => ({ titel: Number(r.docstatus) === 0 ? "Entwurf" : r.name, href: `/faktura/rechnungen/${encodeURIComponent(r.name)}`, info: `${r.art} · ${cent(r.brutto_cent)}` })) },
    { id: "bezahlt", titel: "Bezahlt", zustand: st(bezahlt, false), objekte: [] },
  ];
}

/** Angebot: Primär je Zustand (§ 4.2). */
export function angebotPrimaer(a, rolle) {
  if (!rolle.schreibt) return null;
  if (a.status === "Entwurf") return { id: "senden", titel: AKTION.senden };
  if (a.status === "Gesendet") return { id: "uebernehmen", titel: AKTION.alsAuftrag };
  if (a.status === "Angenommen" && a.auftragsbestaetigung) return { id: "auftrag", titel: AKTION.auftragOeffnen, href: `/faktura/auftraege/${encodeURIComponent(a.auftragsbestaetigung)}` };
  if (["Abgelehnt", "Abgelaufen"].includes(a.status)) return { id: "neue-version", titel: AKTION.neueVersion };
  return null;
}

export function angebotBand(a) {
  if (a.status === "Angenommen") return { ton: "info", titel: ANGEBOT.bannerAngenommen };
  if (a.status === "Abgelaufen") return { ton: "warnung", titel: ANGEBOT.bannerAbgelaufen(datum(a.gueltig_bis)) };
  if (a.status === "Ersetzt") return { ton: "neutral", titel: `Ersetzt durch ${a.nachfolger}` };
  return null;
}
