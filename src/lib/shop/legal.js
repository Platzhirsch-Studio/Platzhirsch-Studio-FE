// src/lib/shop/legal.js
// Rechtliche Pflicht-Slots des Onlineshops (Accessoire-Welt, Nr. 29).
// Bis 31.10.2026 waren alle Slots "kanzlei-offen" (text null). Jetzt trägt
// jeder Slot einen ENTWURF (siehe unten). Im Testmodus verlinkt der
// Warenkorb den Entwurf mit Marker „Entwurf“; in Produktion ist der Shop
// wegen SHOP_MODE off ohnehin unsichtbar. SHOP_MODE=live verlangt
// zusätzlich, dass alle Slots "freigegeben" sind (mode.js).
//
// Kurzrecherche der Pflichten (Belege und Kanzlei-Bedarf: qa-screenshots/shop/README.md):
//   AT  FAGG §§ 4, 5, 7, 8, 11–13 (Informationspflichten, Bestätigung,
//       Button „zahlungspflichtig bestellen“ § 8 Abs 2, Widerruf 14 Tage,
//       Muster-Widerrufsformular Anhang I Teil B), PrAG §§ 9, 10a
//       (Bruttopreise, Grundpreis bei Fertigpackungen nach Volumen/Gewicht),
//       ECG §§ 5, 9, 10 (Diensteanbieter-Info, Bestellvorgang, Korrektur von
//       Eingabefehlern, Zugangsbestätigung), KSchG/VGG (Gewährleistung).
//   DE  BGB §§ 312d, 312i, 312j (Button-Lösung „zahlungspflichtig bestellen“,
//       Zusammenfassung unmittelbar vor der Bestellung, Lieferbeschränkungen
//       und Zahlungsmittel spätestens bei Beginn des Bestellvorgangs),
//       Art. 246a EGBGB, §§ 355, 356 BGB, PAngV §§ 3, 4, 5, 6 (Gesamtpreis,
//       Grundpreis je 1 l/1 kg – die 100-ml/100-g-Option ist seit der PAngV-Novelle
//       vom 28.05.2022 entfallen, § 5 Abs 1 PAngV, https://www.gesetze-im-internet.de/pangv_2022/__5.html –,
//       Liefer-/Versandkosten neben dem Preis § 6 PAngV).
//
// STAND 02.11.2026: Jeder Slot trägt einen inhaltlich fertigen ENTWURF
// (Wortlaut: ./legalTexte.js, Quellen dort je Regel). status "entwurf" ≠
// "freigegeben" → legalOpen() listet weiter alle Slots, liveBlockers (mode.js)
// bleibt "recht:*", der Shop kann NICHT live gehen. Freigabe erst durch
// Kanzlei/Inhaber: status "freigegeben" + freigabe { datum, durch, beleg }
// setzen und die verbliebenen [PLATZHALTER: …] ersetzen.
// Rein, ohne "@/"-Importe.
import { LEGAL_TEXT_STAND, LANG_HINWEIS, platzhalterIn, slotTexte } from "./legalTexte.js";

export const LEGAL_SLOT_STATUS = Object.freeze({ OFFEN: "kanzlei-offen", ENTWURF: "entwurf", FREI: "freigegeben" });

const TEXTE = slotTexte();

const slot = (id, titel, braucht, quellen) =>
  Object.freeze({
    id,
    titel,
    braucht,
    status: LEGAL_SLOT_STATUS.ENTWURF,
    path: `/shop/recht/${id}`,
    text: Object.freeze(TEXTE[id]),
    sprache: "de",
    // EN/FR/IT: Übersetzung folgt; Anzeige DE mit LANG_HINWEIS.
    uebersetzung: Object.freeze({ en: null, fr: null, it: null }),
    stand: LEGAL_TEXT_STAND,
    freigabe: null,
    platzhalter: Object.freeze(platzhalterIn(TEXTE[id])),
    quellen: Object.freeze(quellen),
  });

export const SHOP_LEGAL = Object.freeze([
  slot("agb", "AGB (Onlinekauf Accessoires)", "Vertragsschluss, Zahlung, Lieferung, Eigentumsvorbehalt, Gewährleistung, Streitbeilegung", ["FAGG §§ 4, 7, 8, 13a", "ECG §§ 9, 10", "KSchG §§ 6, 7a, 7b, 14", "VGG idF BGBl. I Nr. 60/2026", "Rom-I-VO Art. 6", "EuGVVO Art. 18", "VO (EU) 2024/3228"]),
  slot("widerruf", "Widerrufsbelehrung", "Wortlaut nach Anhang I Teil A FAGG, Ausnahmen (§ 18 Abs 1 Z 3 und Z 5), Online-Rücktrittsfunktion § 13a FAGG (/shop/recht/widerruf-formular)", ["FAGG Anhang I Teil A idF BGBl. I Nr. 59/2026", "FAGG §§ 11–18", "FAGG § 13a"]),
  slot("widerrufsformular", "Muster-Widerrufsformular", "Anhang I Teil B FAGG, mit Firmenwortlaut und Anschrift", ["FAGG Anhang I Teil B idF BGBl. I Nr. 59/2026"]),
  slot("versand", "Versand- und Lieferbedingungen", "Lieferländer, Lieferzeit (lieferzeit.js), Versandkosten-Hinweis, Bruch/Transportschaden, Abholung", ["FAGG §§ 4 Abs 1 Z 7, 8 Abs 3", "KSchG §§ 7a, 7b"]),
  slot("datenschutz", "Datenschutz-Ergänzung (Stripe, Versanddienst, Bestelldaten)", "Zwecke, Rechtsgrundlagen, Empfänger (Stripe, LetMeShip + Carrier), Speicherdauer (BAO/UGB 7 Jahre)", ["DSGVO Art. 6, 13, 45, 46", "BAO § 132", "UGB § 212"]),
]);

const hasText = (t) => (typeof t === "string" ? t.trim().length > 0 : Array.isArray(t) && t.length > 0);

export const legalSlot = (id, list = SHOP_LEGAL) => list.find((s) => s.id === id) || null;
/** Freigegeben nur mit Status "freigegeben", Text und Stand – ein Entwurf zählt nie. */
export const legalSlotReleased = (s) => s?.status === LEGAL_SLOT_STATUS.FREI && hasText(s.text) && Boolean(s.stand);
/** Entwurf vorhanden (anzeigbar mit Entwurfsmarker), aber nicht freigegeben. */
export const legalSlotDraft = (s) => s?.status === LEGAL_SLOT_STATUS.ENTWURF && hasText(s.text);
export const legalOpen = (list = SHOP_LEGAL) => list.filter((s) => !legalSlotReleased(s)).map((s) => s.id);
/** Alle Platzhalter über alle Slots (eindeutig). */
export const legalPlatzhalter = (list = SHOP_LEGAL) => [...new Set(list.flatMap((s) => s.platzhalter || []))];
export { LANG_HINWEIS };

/**
 * Checkbox: Nur wo rechtlich nötig. Für den Kauf selbst ist in AT/DE keine
 * AGB-Checkbox Pflicht (Einbeziehung durch deutlichen Hinweis genügt) – ob
 * eine verlangt wird, entscheidet die Kanzlei. Bis dahin: keine Checkbox,
 * deutlicher Hinweis mit Links über dem Button.
 */
export const AGB_CHECKBOX = Object.freeze({ verlangt: null, entscheidet: "Kanzlei" });
