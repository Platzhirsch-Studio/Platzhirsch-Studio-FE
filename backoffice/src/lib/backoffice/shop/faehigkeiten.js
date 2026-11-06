// Fähigkeiten des Bereichs Shop (G-04, K-19; 10-konzept-shop § 2.7 „Schalter“, E20, § 14 Anfragen A1–A20).
// Fachlich erwartet → Knopf sichtbar, deaktiviert, „Noch nicht verfügbar – {Ersatzweg}“; sonst ausgeblendet.
// Freischaltung: Probe (Feld/Methode in Backend-Import bzw. getMeta) oder Schalter BACKOFFICE_(MOCK_)FAEHIGKEITEN.

import { definiereFaehigkeiten } from "../faehigkeiten.js";

export const SHOP = definiereFaehigkeiten("shop", {
  // A1: geldbasierte Bezahlt-Prüfung in ph_shop (ist_bezahlt zählt heute „abholbereit“ als bezahlt)
  "abholbereit-unbezahlt": { titel: "Abholbereit melden vor der Zahlung", grund: "Erst nach Zahlung", ersatz: { titel: "an der Kassa kassieren, danach melden" } },
  // A2: abholbereit_melden behält eine vereinbarte Abholfrist
  "abholfrist-behalten": { titel: "Abholfrist beim Melden behalten", erwartet: false },
  // ph_faktura: Hook ph_shop_rechnung_erstellen
  rechnung: { titel: "Rechnung aus der Bestellung erstellen", ersatz: { titel: "Rechnung in Faktura erstellen", href: "/faktura" } },
  // ph_faktura: Hook ph_shop_gutschrift_erstellen
  gutschrift: { titel: "Gutschrift bei Erstattung", ersatz: { titel: "Erst Gutschrift in Faktura anlegen", href: "/faktura" } },
  // A5: Widerruf positionsgenau mit sauberem Status
  "widerruf-positionen": { titel: "Widerruf positionsgenau abschließen", erwartet: false },
  // A9: Bestellung ohne E-Mail (Kontaktweg „Ausdruck“)
  "ohne-email": { titel: "Bestellung ohne E-Mail", ersatz: { titel: "an der Kassa direkt verkaufen", href: "/kassa" } },
  // ph_kassa K2: Liste „Offen zum Kassieren“
  "kassa-uebergabe": { titel: "Bestellung an die Kassa übergeben", erwartet: false },
  // A11: direkte Übergabe aus „bezahlt“ in einem Aufruf
  "direkt-uebergabe": { titel: "Direkt übergeben in einem Schritt", erwartet: false },
  // A12: abgelaufenen Gutschein mit Rest reaktivieren
  "gutschein-reaktivieren": { titel: "Gutschein reaktivieren", ersatz: { titel: "Gültigkeit verlängern und Leitung fragen" } },
  // A13 + Steuerberater: USt-Bericht für die UVA
  "uva-freigabe": { titel: "USt-Bericht für die UVA", ersatz: { titel: "Bericht nur als Entwurf verwenden" } },
  // A14: Zahlungsstreit buchen
  "zahlungsstreit-buchung": { titel: "Rückbuchung aus Zahlungsstreit buchen", ersatz: { titel: "im Stripe-Dashboard bearbeiten" } },
  // A16 + ph_sortiment: § 18 FAGG
  fagg18: { titel: "Ausschluss nach § 18 FAGG automatisch", erwartet: false },
  // A17: Retourengrund, Kulanz-Retoure
  "retoure-grund": { titel: "Retourengrund erfassen", erwartet: false },
  // L4: Retourenlabel
  retourenlabel: { titel: "Retourenlabel erstellen", ersatz: { titel: "Label in Logistik erstellen", href: "/logistik" } },
  // A20: Gebührenbeleg an der Auszahlung
  gebuehrenbeleg: { titel: "Gebührenrechnung an der Auszahlung", probe: { doctype: "PH Stripe Auszahlung", feld: "gebuehrenbeleg" }, ersatz: { titel: "als Anhang ablegen" } },
  // ph_logistik L3: Bestand lesbar für die Produktsuche
  bestand: { titel: "Bestand in der Produktsuche", erwartet: false },
  // Druckformate liefert ph_shop (Fixture print_format)
  druck: { titel: "Belege drucken", probe: { doctype: "PH Bestellung" } },
});

export const SHOP_FAEHIGKEITEN = Object.keys(SHOP);
