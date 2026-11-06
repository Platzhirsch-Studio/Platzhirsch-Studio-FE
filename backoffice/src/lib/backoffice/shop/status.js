// Statusmodell Shop (10-konzept-shop § 2.2): Anzeige, Ton, Icon je DocType und Rohwert. Rein, unit-getestet.
// Rot nur bei Problemen (N14); Rohwerte erscheinen nie (N13). Ton = StatusBadge-Ton, Icon = lucide-Name.

const B = (anzeige, ton, icon) => Object.freeze({ anzeige, ton, icon });

export const STATUS = Object.freeze({
  "PH Bestellung": {
    offen: B("Offen", "blau", "Circle"),
    zahlung_ausstehend: B("Zahlung unterwegs", "tuerkis", "Clock"),
    bezahlt: B("Bezahlt", "gruen", "Check"),
    versandbereit: B("Versandbereit", "tuerkis", "Package"),
    versendet: B("Versendet", "tuerkis", "Truck"),
    reserviert: B("Reserviert", "blau", "Bookmark"),
    abholbereit: B("Abholbereit", "tuerkis", "ShoppingBag"),
    abgeholt: B("Abgeholt", "gruen", "CheckCheck"),
    abgeschlossen: B("Abgeschlossen", "grau", "Check"),
    storniert: B("Storniert", "grau", "CircleSlash"),
    widerrufen: B("Widerrufen", "grau", "Undo2"),
    erstattet: B("Erstattet", "grau", "Undo2"),
    teilerstattet: B("Teilweise erstattet", "grau", "Undo2"),
    abgelaufen: B("Abgelaufen", "grau", "Clock"),
    fehlgeschlagen: B("Zahlung fehlgeschlagen", "rot", "CircleX"),
    checkout_fehler: B("Bezahlvorgang fehlerhaft", "rot", "CircleX"),
    pruefen: B("Prüfen", "rot", "TriangleAlert"),
  },
  "PH Zahlung": {
    Angekuendigt: B("Angekündigt", "blau", "Clock"),
    Bezahlt: B("Bezahlt", "gruen", "Check"),
    Teilerstattet: B("Teilweise erstattet", "grau", "Undo2"),
    Erstattet: B("Erstattet", "grau", "Undo2"),
    "Erstattung angefordert": B("Freigabe offen", "orange", "Clock"),
    Fehlgeschlagen: B("Fehlgeschlagen", "rot", "CircleX"),
    Storniert: B("Storniert", "grau", "CircleSlash"),
  },
  "PH Gutschein": {
    Erstellt: B("Erstellt", "blau", "Circle"),
    Aktiv: B("Aktiv", "gruen", "Check"),
    "Teilweise eingeloest": B("Teilweise eingelöst", "orange", "CircleDashed"),
    Eingeloest: B("Eingelöst", "grau", "Check"),
    Gesperrt: B("Gesperrt", "rot", "Lock"),
    Abgelaufen: B("Abgelaufen", "grau", "Clock"),
    Erstattet: B("Erstattet", "grau", "Undo2"),
  },
  "PH Gutschein Bestellung": {
    offen: B("Offen", "blau", "Circle"),
    zahlung_ausstehend: B("Zahlung unterwegs", "tuerkis", "Clock"),
    bezahlt: B("Bezahlt", "gruen", "Check"),
    fehlgeschlagen: B("Zahlung fehlgeschlagen", "rot", "CircleX"),
    abgelaufen: B("Abgelaufen", "grau", "Clock"),
    erstattet: B("Erstattet", "grau", "Undo2"),
    teilerstattet: B("Teilweise erstattet", "grau", "Undo2"),
    widerrufen: B("Widerrufen", "grau", "Undo2"),
    pruefen: B("Prüfen", "rot", "TriangleAlert"),
  },
  "PH Widerruf": {
    Eingegangen: B("Eingegangen", "blau", "Inbox"),
    Bestaetigt: B("Bestätigt", "tuerkis", "Check"),
    "Ware erwartet": B("Ware erwartet", "orange", "Clock"),
    "Ware erhalten": B("Ware erhalten", "tuerkis", "PackageCheck"),
    Erstattet: B("Erstattet", "gruen", "Check"),
    Abgelehnt: B("Abgelehnt", "rot", "CircleX"),
  },
  "PH Retoure": {
    Angekuendigt: B("Angekündigt", "blau", "Circle"),
    "Label gesendet": B("Label gesendet", "tuerkis", "Mail"),
    Unterwegs: B("Unterwegs", "tuerkis", "Truck"),
    Eingegangen: B("Eingegangen", "orange", "PackageCheck"),
    Geprueft: B("Geprüft", "tuerkis", "Check"),
    Erstattet: B("Erstattet", "gruen", "Check"),
    Abgelehnt: B("Abgelehnt", "rot", "CircleX"),
  },
  "PH Stripe Ereignis": {
    empfangen: B("Empfangen", "blau", "Inbox"),
    verarbeitet: B("Verarbeitet", "gruen", "Check"),
    ignoriert: B("Ignoriert", "grau", "CircleSlash"),
    fehler: B("Fehler", "rot", "CircleX"),
    wiederholt: B("Wiederholt", "grau", "RefreshCw"),
  },
  "PH Stripe Auszahlung": {
    angekuendigt: B("Angekündigt", "blau", "Clock"),
    unterwegs: B("Unterwegs", "tuerkis", "Truck"),
    bezahlt: B("Auf dem Konto", "gruen", "Check"),
    abgeglichen: B("Abgeglichen", "gruen", "CheckCheck"),
    fehlgeschlagen: B("Fehlgeschlagen", "rot", "CircleX"),
    storniert: B("Storniert", "grau", "CircleSlash"),
  },
  "PH Anzahlung": {
    offen: B("Offen", "blau", "Circle"),
    zahlung_ausstehend: B("Zahlung unterwegs", "tuerkis", "Clock"),
    bezahlt: B("Bezahlt", "gruen", "Check"),
    fehlgeschlagen: B("Fehlgeschlagen", "rot", "CircleX"),
    abgelaufen: B("Abgelaufen", "grau", "Clock"),
    doppelt: B("Doppelt bezahlt", "rot", "TriangleAlert"),
    erstattet: B("Erstattet", "grau", "Undo2"),
    teilerstattet: B("Teilweise erstattet", "grau", "Undo2"),
    pruefen: B("Prüfen", "rot", "TriangleAlert"),
  },
});

/** Reihenfolge des Arbeitsflusses je DocType (Filter-Menü: Arbeitsfluss oben, Endzustände unten). */
export const ARBEITSFLUSS = Object.freeze({
  "PH Bestellung": ["pruefen", "offen", "zahlung_ausstehend", "reserviert", "bezahlt", "versandbereit", "abholbereit", "versendet", "abgeholt"],
  "PH Bestellung:ende": ["abgeschlossen", "storniert", "widerrufen", "erstattet", "teilerstattet", "abgelaufen", "fehlgeschlagen", "checkout_fehler"],
  "PH Widerruf": ["Eingegangen", "Bestaetigt", "Ware erwartet", "Ware erhalten"],
  "PH Widerruf:ende": ["Erstattet", "Abgelehnt"],
  "PH Retoure": ["Angekuendigt", "Label gesendet", "Unterwegs", "Eingegangen", "Geprueft"],
  "PH Retoure:ende": ["Erstattet", "Abgelehnt"],
});

/**
 * Anzeige eines Status. Unbekannter Wert → unverändert, grau (nie leer).
 * @param {string} doctype
 * @param {string} wert
 * @param {object} [doc]  für Sonderfälle (Teilweise widerrufen, abgelaufener Gutschein mit Rest)
 * @returns {{anzeige:string, ton:string, icon:string, wert:string}}
 */
export function statusInfo(doctype, wert, doc = null) {
  const s = STATUS[doctype]?.[wert];
  if (!s) return { anzeige: String(wert || "–"), ton: "grau", icon: "Circle", wert: String(wert || "") };
  if (doctype === "PH Bestellung" && wert === "widerrufen" && doc && Number(doc.erstattet_cent || 0) < Number(doc.betrag_bezahlt_cent || 0)) {
    return { ...s, anzeige: "Teilweise widerrufen", wert };
  }
  if (doctype === "PH Gutschein" && wert === "Abgelaufen" && doc && Number(doc.rest_cent || 0) > 0) {
    return { anzeige: "Abgelaufen mit Rest", ton: "orange", icon: "Clock", wert };
  }
  return { ...s, wert };
}

/** Alle Werte eines DocType mit Anzeige (Filter, Ton-Mapping für StatusBadge). */
export function statusListe(doctype) {
  return Object.entries(STATUS[doctype] || {}).map(([wert, s]) => ({ wert, ...s }));
}

/** Ton-Map {wert: ton} für Komponenten, die nur Töne brauchen. */
export function tonMap(doctype) {
  return Object.fromEntries(Object.entries(STATUS[doctype] || {}).map(([w, s]) => [w, s.ton]));
}

/**
 * Zusatzkennzeichen einer Bestellung (§ 2.2): eigene Chips neben dem Badge.
 * @param {object} b  Bestellung
 * @param {{zahlungen?:object[]}} [ctx]
 * @returns {Array<{id:string, text:string, material:string, titel?:string}>}
 */
export function zusatzChips(b, ctx = {}) {
  const out = [];
  if (b.modus === "test") out.push({ id: "test", text: "Test", material: "messing", titel: "Testmodus – zählt nicht in Kennzahlen" });
  if (Number(b.radar_markiert) === 1 && !b.radar_geprueft_am) out.push({ id: "risiko", text: "Risiko prüfen", material: "eiche" });
  const zs = ctx.zahlungen || [];
  if (zs.some((z) => streitOffen(z))) out.push({ id: "streit", text: "Zahlungsstreit", material: "eiche" });
  if (zs.some((z) => z.status === "Erstattung angefordert")) out.push({ id: "freigabe", text: "Erstattung wartet auf Freigabe", material: "eiche" });
  if (b.waehrung && b.waehrung !== "EUR") out.push({ id: "fremd", text: "Fremdwährung", material: "eiche" });
  return out;
}

/** Zahlungsstreit offen = dispute_status gesetzt und nicht gewonnen/geschlossen. */
export function streitOffen(z) {
  const s = String(z?.dispute_status || "");
  return !!s && !["won", "warning_closed", "lost"].includes(s);
}

/** Risiko (Stripe-Prüfung) offen. */
export function risikoOffen(doc) {
  return Number(doc?.radar_markiert) === 1 && !doc?.radar_geprueft_am;
}

/** Klartext der Risikostufe. */
export function risikoStufe(level) {
  return { normal: "normal", elevated: "erhöht", highest: "hoch", not_assessed: "nicht bewertet", unknown: "unbekannt" }[level] || "unbekannt";
}

/** Klartext des Zahlungskanals (Rohwert „Ueberweisung“ → „Überweisung“). */
export function kanalText(kanal) {
  return { Ueberweisung: "Überweisung", "Karte extern": "Karte (extern)" }[kanal] || kanal || "–";
}

/** Klartext der Mail-Zustellung. */
export function mailStatusText(s) {
  return { gesendet: "gesendet", nicht_gesendet: "nicht gesendet", limit: "Limit erreicht", fehlgeschlagen: "fehlgeschlagen", testmodus: "Testmodus", ausstehend: "ausstehend" }[s] || "–";
}
