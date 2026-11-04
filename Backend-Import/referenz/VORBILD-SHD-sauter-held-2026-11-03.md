# Vorbild: SHD Sauter + Held (sauter-held.de), Stand 03.11.2026

Inhaber-Vorgabe 03.11.2026: Das Platzhirsch-Backoffice soll sich am Funktionsumfang von SHD
(marahplus & Co.) orientieren – Branchenstandard für Möbelhäuser und Küchenstudios.
Quelle: 15 Seiten auf sauter-held.de (Marketingtexte, keine Feldlisten). Zusammenfassung:

## Module bei SHD → Entsprechung bei uns
| SHD-Modul | Funktion laut Seite | Unsere App |
|---|---|---|
| marahplus Warenwirtschaft | Belege (Angebot/Auftrag), Bestellwesen, Servicefälle, Kasse, Inventur, Berichtswesen, Infocenter = digitale Auftragsmappe, elektronische Hängemappe (Archiv aller Planungsdokumente) | ph_faktura, ph_sortiment, ph_logistik, ph_kassa, ph_projekte (Auftragsmappe) |
| Integrationen Planung | CARAT, eOPUS, furnplan, Winner, pCon-Basket, USM, Verbandskataloge, EDI/IWOfurn (Bestellung, AB, Rechnung), vitra-Warenkorb | ph_sortiment (Lieferantenbestellung, IWOfurn/pCon-Import als Schnittstellenpaket), ph_projekte (Planungsimport) |
| marahobjekt | Objekt-/Projektabwicklung, Aufgaben/Termine, Projektkosten/Budget, Archiv, Vertriebscockpit, Intercompany | ph_projekte, ph_crm (Cockpit) |
| marahprojekt | Aufgaben/Zeiten (Jira) zurück in Belege → Abrechnung | ph_projekte (Aufgaben, Zeiten) |
| marahrw7 | FiBu: Anzahlungsrechnung automatisch gebucht, Zahlungseingang Bank/Kasse, OP in Auftrag ausgebucht, USt-Umbuchung nicht fällig → fällig, Aufteilung bei Teillieferung, Mahnlauf, Bankauszug-Import, Eingangsrechnung mit OCR, BWA, OP-Listen | ph_faktura |
| DATEV-Anbindung | Belege/Stammdaten an Kanzlei, OP/Zahlungen zurück, Übergabeprotokoll je Beleg | ph_faktura (Export BMD/DATEV + Protokoll) |
| mex | Mobile Auslieferung/Montage: Tourenplanung mit Navigation, Unterlagen, Fotos vorher/nachher, Lieferbestätigung, Kundenunterschrift, mehrsprachige Berichte | ph_logistik (Touren, mobile Seite), ph_projekte (Montagebericht) |
| marahmobile | Mobile WaWi: Volltextsuche, Dashboards, Belege/Dokumente, Aufgaben | Frappe Desk mobil + Workspaces |
| inhouse | Online-in-Store: Produktinfo per Smartphone, Warenkorb/Bezahlen, Verkäufer rufen | Website (Showroom-QR, Reservieren & abholen) |
| Webshop-Anbindung | Artikel/Preis/Bestand-Sync | ph_sortiment ↔ Website-Katalog |
| moa | Kundenportal: Angebote, Aufträge, Termine, Lieferscheine/Rechnungen PDF, Servicefälle, Chat | Website-Portal (/portal) ← ph_projekte/ph_faktura API |
| kiwi | KI: AB-Abgleich gegen Bestellung mit Prüfprotokoll, Chat-Abfragen, Textentwürfe | später, nicht Teil des Erstbaus |
| resy | Reklamation/Servicefall: Fehlercodes, Dokumentation, Ersatzteile, Techniker-Touren, Statistik | ph_projekte (Mängel/Servicefall) oder eigene App ph_service |

## Ablauf (bei SHD aus Modulen zusammengesetzt) → unser Soll-Fluss
Kontakt/Beratung → Planung (Import) → Angebot → Auftrag (Kaufvertrag) → Anzahlungsrechnung + Zahlung
(Kassa/Stripe/Bank, OP gegen Auftrag) → Lieferantenbestellung (IWOfurn/pCon/Mail) → AB-Abgleich →
Wareneingang → Tourenplanung → Auslieferung/Montage mit Unterschrift & Fotos → Reklamation/Servicefall →
Schlussrechnung mit Anzahlungsverrechnung → Mahnwesen → Export Steuerberater.

## Nicht belegt bei SHD (nur Stichwort): Kassensystem-Details, Lagerplätze, EDI-Nachrichtentypen, Zahlungsdienstleister.
