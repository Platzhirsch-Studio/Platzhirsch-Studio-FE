# Platzhirsch Logistik (`ph_logistik`) – Arbeitspaket WP7

Lieferschein, Packtisch, LetMeShip-Versand (Tarif, Buchung, Etikett, Tracking, Storno, Retourenlabel), Sendungsverfolgung,
Lager/Bestand mit Bewegungen, Inventur, Liefer-/Montagetouren mit mobiler Seite „Tour heute“ (Vorbild SHD mex).

- Plan: `../PLAN.md` Abschnitt WP7 · Regeln: `../CONVENTIONS.md` · Vorbild-DocType: `ph_crm` → PH Anfrage.
- Voraussetzungen: `frappe`, `ph_core`, `ph_crm`, `ph_sortiment`, `ph_shop`, `ph_faktura` (Reihenfolge `../README.md`). **Nichts hiervon ist installiert; nur Staging.**

## Installation (Staging)

```bash
bench get-app /pfad/zu/Backend-Import/ph_logistik
bench --site <staging> install-app ph_logistik        # after_install: Lagerorte, 29 Paketprofile (Schätzungen), Einstellungen
bench --site <staging> migrate
bench --site <staging> run-tests --app ph_logistik
```

Ohne Site (reine Logik): `cd Backend-Import/ph_logistik && PYTHONPATH=. python -m unittest discover -s ph_logistik/tests -t .`

## DocTypes

| DocType | Zweck |
|---|---|
| PH Lagerort (+ Platz) | Showroom Lochau, Lager, Fahrzeug (automatisch je PH Fahrzeug), Extern, Kunde |
| PH Lagerbestand | Bestand je Produkt/Ausführung/Lagerort; Ausstellungsstücke je Seriennummer mit Standort; Mengen nur über Bewegungen |
| PH Lagerbewegung | Journal: Wareneingang, Verkauf, Umlagerung, Inventur, Retoure, Ausbuchung, Reservierung, Freigabe; kein Löschen, Storno = Gegenbuchung |
| PH Inventur (+ Position) | Zählliste aus Bestand, Zählung (auch per Scan), Freigabe durch Leitung bucht Differenzen |
| PH Paketprofil | Karton-Außenmaße/Gewicht je Pakettyp, Port von `src/lib/shop/paketprofile.js` (Glas → Versicherung, Gefahrgut gesperrt, Schätzung nur im Testmodus) |
| PH Lieferschein (+ Position, Paket, Foto) | aus PH Bestellung (ph_shop) oder PH Auftragsbestaetigung (ph_faktura), Teillieferung, Pakete, Versicherung, Unterschrift, Fotos |
| PH Sendung (+ Tracking) | Versandauftrag Ausgang/Retoure: Dienst, Preis, LetMeShip-IDs, Etikett-PDF (privater Anhang), Status-Verlauf, Kosten vs. berechnet |
| PH Tour (+ Stopp, Team, Foto) | Datum, Fahrzeug, Fahrer/Team, Stopps mit Reihenfolge/Zeitfenster/Navigation-Link, Fotos, Unterschrift, Lieferbestätigung |
| PH Fahrzeug | Montagefahrzeuge (legt Lagerort „Fahrzeug <Kennzeichen>“ an) |
| PH Logistik Einstellungen (Single) | Testmodus, Dienstwahl, Aufschlag, USt, Versicherung, Pauschalen, Absender, Lagerorte, Mail-Vorlagen – **keine Schlüssel** |

Workflows: PH Lieferschein (Entwurf → Gepackt → Uebergeben → Zugestellt; Storniert Leitung), PH Sendung (Angelegt → Etikett → Unterwegs → Zugestellt/Problem; Storniert),
PH Tour (Geplant → Freigegeben (Leitung) → Unterwegs → Abgeschlossen; Abgebrochen), PH Inventur (Geplant → Laufend → Abgeschlossen (Leitung); Verworfen).
Server-Aktionen setzen `status` **und** `workflow_state` gemeinsam (`helfer.setze_status`).

## Pages

- **Packtisch** (`/app/ph-packtisch`): Dashboard-Kacheln (zu packen, Etikett offen, unterwegs, Probleme, heute gepackt, Touren heute), offene Lieferscheine und bezahlte Bestellungen ohne Lieferschein, Pack-Ansicht je Lieferschein: Scan-Feld (EAN/Seriennummer/Slug/QR-URL) mit Ton, große Abhak-Schaltflächen, Paketprofil je Position (Vorschlag aus Produkt/Kategorie), Paketliste (Maße, Gewicht, zerbrechlich), Versicherung (Glas automatisch, K17), „Etikett erzeugen“ (Tarifdialog → Buchung → PDF öffnet), „Als gepackt melden“, Abholung mit Unterschrift und Abholcode, Druck Lieferschein/Packliste/Etikett.
- **Tour heute** (`/app/ph-tour`, mobil): Touren des Tages für Fahrer/Team (Rolle PH Montage), Stopps in Reihenfolge mit Navigation (Google-Maps-Link), Anrufen, Unterlagen (Lieferschein-PDF), Fotos vorher/nachher (Kamera-Upload), Erledigt mit Kundenunterschrift (→ Lieferschein Zugestellt), nicht angetroffen/verschoben, Lieferbestätigung per Mail (de/en/fr/it), Tour starten/abschließen mit km-Stand. Offline nicht vorgesehen.

## LetMeShip (`ph_logistik/letmeship/`)

Ablauf „Etikett erzeugen“: `dienst.tarife_fuer_lieferschein` (**POST available**, 30 min Cache, Dienstwahl günstigster/schnellster/bevorzugt, Aufschlag, Netto→Brutto) → `dienst.sendung_anlegen` (PH Sendung mit Empfänger-Snapshot, Preis, Versicherung) → `dienst.buchen` (**POST shipments** → shipmentId, **GET shipments/{id}** → AWB, **GET shipments/{id}/documents?types=LABEL** → PDF als privater Anhang, Status Etikett) → Scheduler alle 2 h `tasks.tracking_aktualisieren` (**GET tracking?shipmentid=** → Verlauf, Unterwegs/Zugestellt/Problem, Lieferschein folgt) → `dienst.stornieren` (**DELETE shipments/{id}**, nur vor Abholung). Retourenlabel = Sendung `richtung=Retoure` mit getauschten Adressen (Button an PH Sendung, PH Retoure).

- Zugangsdaten nur in `site_config.json`: `ph_letmeship_api_id`, `ph_letmeship_api_password`, `ph_letmeship_env` (test|live). Die Einstellungen zeigen nur ja/nein.
- `PH Logistik Einstellungen.letmeship_testmodus = 1` (Standard) oder fehlende Zugangsdaten → `MockClient` (feste MOCK-Tarife AT 5,00/11,00 €, DE 9,00 €, +2,00 € Versicherung, Mini-PDF-Etikett, Tracking-Folge REGISTERED → IN_TRANSIT → DELIVERED). In Tests immer Mock. **Es gibt keinen echten Aufruf in diesem Repo.**
- Vor Livegang mit der offiziellen API-Doku abgleichen (wie Website-README): Feldnamen `priceInfo.totalPrice/netPrice`, `transferTime`, Versicherungsbetrag, Storno-Endpunkt (DELETE), `lmsTrackingStatus`-Codes (`letmeship/status.py`).

## Buttons

Lieferschein: Packtisch öffnen, Pakete vorschlagen, Als gepackt melden, **Etikett erzeugen** (Tarif-Dialog), Übergeben, Als abgeholt/zugestellt buchen (Unterschrift), Lieferbestätigung senden, Teilrechnung erstellen (→ `ph_faktura.api.create_partial_invoice`, sobald vorhanden), Produktpässe erzeugen (→ `ph_projekte.api.create_product_passes`), Stornieren, Packliste/Lieferschein drucken.
Sendung: Buchen und Etikett abrufen, Tracking aktualisieren, Etikett drucken, Sendung verfolgen, Retourenlabel erzeugen, Problem melden, Manuell als zugestellt, Stornieren. Liste: Tracking aller offenen Sendungen.
Tour: Stopps hinzufügen (Dialog Datum/Region/PLZ oder Auswahl), Reihenfolge optimieren (PLZ), Freigeben, Tour starten, Abschließen, Abbrechen, Mobil öffnen, Tourenblatt drucken, Route in Google Maps.
Lagerbestand: Umlagern, Reservieren, Reservierung freigeben, Ausbuchen, Als Ausstellungsstück verkaufen (bucht Verkauf; Kassenbeleg in ph_kassa), Lageretikett 62×29 mm (QR). Lagerbewegung: Stornieren (Gegenbuchung, Leitung).
Inventur: Zählliste erzeugen, Zählung starten, Scan zählen, Freigeben und Differenzen buchen (Leitung), Verwerfen, Zählliste drucken.
Fremde Formulare (Client-Script-Fixtures): PH Bestellung „Packen (Lieferschein)“, PH Auftragsbestaetigung „Lieferschein erzeugen“ (Teilmengen-Dialog), PH Retoure „Retourenlabel erzeugen“.

## Druck, Kanban, Auswertungen

Print Formats: PH Lieferschein Standard (ohne Preise, Unterschriftsfeld), PH Lieferschein Packliste, PH Sendung Retourenschein, PH Tour Tourenblatt, PH Inventur Zaehlliste, PH Lagerbestand Etikett (62×29 mm, QR).
Kanban: PH Lieferscheine, PH Sendungen, PH Touren. Charts: Lieferscheine je Woche, Sendungen je Carrier, Versandkosten je Monat, Touren je Woche, Bestand je Lagerort.
Number Cards: Zu packen, Etikett offen, Unterwegs, Probleme, Touren heute, Inventuren laufend, Ausstellungsstücke.
Reports (Script): PH Versandkosten vs berechnet (je Sendung/Carrier/Monat), PH Laufzeiten, PH Zustellprobleme, PH Bestandsliste (je Lagerort, Wert nur Leitung), PH Ausstellungsstuecke (Alter), PH Inventurdifferenzen, PH Touren Auslastung.

## API für die Website (`ph_logistik.api`, Token `website@platzhirsch.studio`)

| Methode | Ersetzt | Antwort |
|---|---|---|
| `get_shipping_quote(zeilen[], ziel, warenwert_cent)` | `versandTarif()` in `src/lib/commerce/shipping/index.js` (Direktaufruf LetMeShip) | `{ok, cent, quelle: letmeship|mock|pauschale, dienst{id,carrier,name,tage}, versichert, zerbrechlich, kerze, tarifId (q-…), ablauf, pakete}` oder `{ok:false, fehler: leer|land|land_ch|profil_fehlt|keine_tarife|api, kategorien, gesperrt}` |
| `create_shipment(bestellung|lieferschein, tarif_id, idempotency_key)` | – | `{sendung, status, tracking_nr, tracking_url, etikett}` |
| `get_tracking(referenz)` | Bestätigungsseite (`awb`, `etikett` in der Bestellung) | Status, Carrier, Tracking-Link, Verlauf – ohne personenbezogene Daten |
| `portal_deliveries(kontakt, kunde_token)` | Portal-Adapter (Delivery Note) | Lieferungen des Kontakts mit Sendung |

Website-Umstellung (nach Abnahme, M9): in `src/lib/commerce/shipping/index.js` den Adapter durch einen Frappe-Aufruf `POST /api/method/ph_logistik.api.get_shipping_quote` (Header `token API_KEY:API_SECRET`) ersetzen; `zeilen[]` liefert `paketprofil` (Key aus `pakettypOf`) oder Maße (`gewichtG`, `laengeCm`, `breiteCm`, `hoeheCm`); `tarifId` beim Checkout speichern und nach Zahlung `create_shipment(bestellung, tarif_id)` aufrufen (oder Packtisch im Backoffice). Bis dahin ruft die Website LetMeShip weiter direkt auf.

## Rollen

`PH Logistik Mitarbeiter` (Packtisch, Lieferscheine, Sendungen, Bestand, zählen, Touren planen), `PH Logistik Leitung` (zusätzlich Freigaben, Storno, Löschen, Export, EK-Werte permlevel 1), `PH Montage` (Tour heute: Touren und Lieferscheine lesen/schreiben, keine Anlage).

## Offen / Annahmen

- Positionsfeldnamen sind fest (geprüft 04.11.): PH Bestellung Position `produkt, slug, variante, variante_name, bezeichnung, marke, menge, einzel_cent, zerbrechlich`; PH Beleg Position `art, alternativ, produkt, bezeichnung, ausfuehrung_text, marke, menge, lieferschein_menge, einzel_netto_cent` (`lieferschein_aus_bestellung/_auftrag`). Beim Verlassen von „Gepackt“ (Übergeben/Zugestellt) meldet der Lieferschein die Mengen einmalig an die AB (`PH Auftragsbestaetigung.lieferung_melden` → `lieferschein_menge`, Teilgeliefert/Geliefert, Stand). „Teilrechnung erstellen“ ruft danach `ph_faktura.api.create_partial_invoice(auftrag, lieferschein, positionen)`; „Produktpässe erzeugen“ ruft `ph_projekte.api.create_product_passes(lieferschein, auftrag, projekt, positionen)` (nur wenn installiert). PH Retoure Position hat kein `produkt` – Wiedereinlagerung löst das Produkt über `slug` auf. Hook `ph_shop_lieferschein_erstellen` (PH Bestellung „Packen“) ist in hooks.py eingetragen.
- `projekt` und `montage_referenz` sind Textfelder (ph_projekte/ph_service sind keine `required_apps`); diese Apps können Custom-Links ergänzen.
- Nummernkreise `PH-LB-`, `PH-LBW-`, `PH-INV-`, `PH-TOUR-` sind in `ANFRAGEN-AN-CORE.md` zur Aufnahme in `NUMMERNKREISE` gemeldet.
- Paketprofile sind Schätzungen (geprueft=0) – Inhaber misst Kartons (PAKETPROFILE.md); Live-Tarife erst mit geprüften Profilen.
- LetMeShip-Testzugang und Staging-Site: PLAN.md Frage 9/1.
