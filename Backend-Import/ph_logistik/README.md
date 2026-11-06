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

## Lückenschluss 04.11. (Inhaber-Entscheidung Nr. 50)

| Bereich | Neu |
|---|---|
| **PH Speditionsauftrag** (+ Packstück) | Großmöbel per Spedition: Hersteller → Lager, Lager → Kunde, Hersteller → Kunde direkt; Abhol-/Zieladresse (vorbelegt aus Lieferschein/Herstellerbestellung/Absender), Termin + Zeitfenster, Avis, Etage/Aufzug/Hebebühne/Trageservice/Montage/Verpackung, Packstücke (Palette/Kolli/Möbel lose/Gitterbox) → Gewicht, Volumen, **Lademeter** (`spedition_logik`), Preis angefragt/bestätigt (permlevel 1). Workflow Entwurf → Gesendet → Bestaetigt → Abgeholt → Zugestellt; Storniert (nach Abholung Leitung). `per_email_senden` (PDF „PH Speditionsauftrag Standard“), `bestaetigen`, `abgeholt` (Lieferschein → Übergeben an Spedition), `zugestellt` (Quittung → Lieferschein Zugestellt; Inbound → Aufgabe „Wareneingang erfassen“). Buttons: Lieferschein „Speditionsauftrag“, Herstellerbestellung „Spedition beauftragen“ (Client Script). Kanban PH Speditionsauftraege. |
| **PH Warenruecknahme** (+ Position) | Rücknahme außerhalb des Shop-Widerrufs (PH Retoure bleibt für Shop-Bestellungen): Anlass, Positionen mit Zustand Neuwertig/B-Ware/Defekt und Entscheidung Wiedereinlagern/B-Ware/Ausbuchen/An Lieferant, Fotos, Unterschrift. Workflow Angemeldet → Angenommen → Geprueft (Buchung, `alle_gebucht`) → Abgeschlossen (Leitung); Storniert. `pruefung_buchen` bucht idempotent (`ruecknahme_logik.buchungen`: Retoure/B-Ware/Sperrbestand/Ausbuchung), `servicefall_anlegen` (ph_service). Button am zugestellten Lieferschein. Druck „PH Warenruecknahme Protokoll“. |
| Lager | PH Lagerbestand `kommission`, `gesperrt`/`sperrgrund`, `reserviert_bis`/`reserviert_kontakt`; Status zusätzlich **Kommission** und **Gesperrt** (nicht verfügbar). Getrennte Bestandszeilen für B-Ware, Sperrbestand und Kommission. `sperren`/`entsperren` (Leitung), Reservierung mit Ablauf (Standard `reservierung_tage_standard` 14) – Scheduler 06:30 `lager.reservierungen_freigeben`. Platzetikett „PH Lagerort Platz-Etikett“ (62×29 mm, QR `<Lagerort>/<Platz>`, `ph_qr_svg`), `lager.platz_scan(code)`, `umlagern(platz_code=…)`, `lager.umlagern_scan`. Kommission: `lager.kommissionsliste(kommission)` (im Lager, gesperrt, noch erwartet aus Herstellerbestellungen), Report **PH Kommissionsware**, `lager.lieferschein_aus_kommission(kommission, lieferart, bestaende?, wunschtermin?)` (Adresse aus AB bzw. PH Projekt `objekt_*`). |
| Wareneingang | `ereignisse.wareneingang_aktualisiert`: bucht nur die Differenz zur bereits gebuchten Menge (Nacherfassung ohne Doppelbuchung), auch bei Status Reklamiert; Platz/Kommission aus Custom Fields `PH Wareneingang Position.ph_logistik_platz`/`ph_logistik_kommission` bzw. Kopf-`kommission`; Transportschaden/beschädigt → **B-Ware gesperrt**. Schadensmeldung → Servicefall baut ph_sortiment am Wareneingang. |
| Packtisch | `positionen_setzen(stand, idempotency_key)` (Offline-Puffer, absoluter Stand), `packtisch.position_minus`, Abholcode serverseitig (`als_zugestellt(…, abholcode)`, Schalter `abholcode_pflicht`, ohne Code nur Leitung), `problem_melden(grund, text, fotos)` (Kommentar + Aufgabe, bei Beschädigt Servicefall), Storno nach Gepackt nur Leitung mit **Bestandsrückbuchung**. Position `bereich` (Raum/Zimmer, Hotel/Yacht) – im Lieferschein-Druck. |
| Touren | Geplante Ankunft je Stopp (`eta`, `fahrt_min`, `zeitfenster_konflikt`; `tour_logik.eta` mit Wartezeit), Prüfung von/bis; **Avis** `PH Tour.avis_senden(kanal mail|sms|beide)` de/en/fr/it (Vorlage optional `avis_vorlage`; SMS nur mit Frappe „SMS Settings“ + `avis_sms_aktiv`, sonst Text im Kommentar), `stopp_entfernen`, `ph_tour.plantafel(von, bis)` (Touren, Stopps, ungeplante Lieferscheine, Speditionen, Doppelbelegung Fahrzeug/Fahrer), mobil `tour_mobil.avis`, Idempotenz `stopp_status(…, idempotency_key)`/`foto(…, idempotency_key)`. Keine Routen-/Fahrzeitberechnung (bewusst, kein Dienst eingebunden). |
| Inventur | `zaehlen_plus(code, anzahl)` (atomar per `frappe.qb`, Code = Bestand/Seriennummer/EAN), `position_hinzufuegen` (Fund, legt ggf. leere Bestandszeile an). |
| Liefertermin-Generator (Nachtrag 32 §2 Nr. 31, S10) | `tour_logik.termine_vorschlagen` (mehrere Fahrzeuge, Tageskapazität `tageskapazitaet_min` ab `arbeitsbeginn`, bestehende Stopps inkl. `montage_min`, Zuladung/Volumen, Teamgröße, Region per PLZ, Feiertage aus `ph_core.utils.feiertage.feiertage_site`, Wochenende/`tour_samstag`); whitelisted `ph_tour.liefertermine_vorschlagen(dauer_min, plz, ab, monteure, gewicht_g, volumen_m3, anzahl, montage_min)` und `ph_tour.stopp_einplanen(vorschlag, lieferschein|montage_referenz|Adresse, …)` (bestehende oder neue Tour); Listen-Button „Liefertermin vorschlagen“. Stopp-Feld `montage_min` getrennt von `dauer_min` (ETA rechnet beides). Terminverschiebung eines avisierten Stopps → Avis „Terminänderung“ (de/en/fr/it, Vorlage `avis_aenderung_vorlage`, Schalter `avis_bei_verschiebung`). |
| Erfüllung/Paletten (Nr. 33/34) | Lieferschein-Position `erfuellung` (Paket/Spedition/Abholung/Eigenlieferung/Montage, Standard aus Lieferart), Hinweis bei gemischten Entwürfen, `nach_erfuellung_aufteilen()`; Lieferschein-Paket `art` (Paket/Palette/Sperrgut), `stapelbar`, `hubwagen` → Speditionsauftrag übernimmt Art/Stapelbarkeit/Hebebühne. „Bestellung zurückhalten“ gehört ph_shop. |
| Website-API | `ph_logistik.api.get_ausstellungsstuecke(lagerort?, marke?)` (Abverkauf, ohne EK, `amount` = `vk_cent_ausstellung` oder `null` + „auf Anfrage“); intern `speditionsauftrag_aus_herstellerbestellung`, `warenruecknahme_aus_lieferschein`. |

Reine Logik (ohne Site getestet): `tour_logik.py`, `spedition_logik.py`, `ruecknahme_logik.py`, Erweiterungen in `bestand_logik.py`/`packtisch_logik.py`.

## Offen / Annahmen

- Nummernkreise (seit 04.11. in `ph_core NUMMERNKREISE` eingetragen): `PH Speditionsauftrag` → `PH-SPA-.YYYY.-.####`, `PH Warenruecknahme` → `PH-WR-.YYYY.-.####`. Neuer Workflow State `PH Angemeldet` (ph_logistik).

- Positionsfeldnamen sind fest (geprüft 04.11.): PH Bestellung Position `produkt, slug, variante, variante_name, bezeichnung, marke, menge, einzel_cent, zerbrechlich`; PH Beleg Position `art, alternativ, produkt, bezeichnung, ausfuehrung_text, marke, menge, lieferschein_menge, einzel_netto_cent` (`lieferschein_aus_bestellung/_auftrag`). Beim Verlassen von „Gepackt“ (Übergeben/Zugestellt) meldet der Lieferschein die Mengen einmalig an die AB (`PH Auftragsbestaetigung.lieferung_melden` → `lieferschein_menge`, Teilgeliefert/Geliefert, Stand). „Teilrechnung erstellen“ ruft danach `ph_faktura.api.create_partial_invoice(auftrag, lieferschein, positionen)`; „Produktpässe erzeugen“ ruft `ph_projekte.api.create_product_passes(lieferschein, auftrag, projekt, positionen)` (nur wenn installiert). PH Retoure Position hat kein `produkt` – Wiedereinlagerung löst das Produkt über `slug` auf. Hook `ph_shop_lieferschein_erstellen` (PH Bestellung „Packen“) ist in hooks.py eingetragen.
- `projekt` und `montage_referenz` sind Textfelder (ph_projekte/ph_service sind keine `required_apps`); diese Apps können Custom-Links ergänzen.
- Nummernkreise `PH-LB-`, `PH-LBW-`, `PH-INV-`, `PH-TOUR-` sind in `ANFRAGEN-AN-CORE.md` zur Aufnahme in `NUMMERNKREISE` gemeldet.
- Paketprofile sind Schätzungen (geprueft=0) – Inhaber misst Kartons (PAKETPROFILE.md); Live-Tarife erst mit geprüften Profilen.
- LetMeShip-Testzugang und Staging-Site: PLAN.md Frage 9/1.

## Integration Runde 3 (04.11.2026)

| Bedarf | Umsetzung | Test |
|---|---|---|
| Retourenlabel (52-…: „Retourenlabel → ph_logistik“) | `letmeship/retoure.py` (Plan Kunde → Absender, Pakete anteilig, Standardpaket), `dienst.tarife_fuer_retoure`, `dienst.retourenlabel_erzeugen` (idempotent, Mock ohne Netz); PH Lieferschein `retourenetikett()` + Button „Retourenetikett“ (Übergeben/Zugestellt, Versand/Spedition); PH Warenruecknahme `retourenetikett()` + Button, Feld `retourenlabel`; PH Sendung `warenruecknahme` | test_retoure_logik (10), test_retourenlabel (Site) |
| Gutschrift aus Warenrücknahme | PH Warenruecknahme `gutschrift_erstellen()` (Leitung) → `ph_faktura.api.create_credit_note_from_return`, Feld `gutschrift`, Button | ph_faktura Site |
| Ausstellungsstück an der Kassa | Button am PH Lagerbestand öffnet die Kassa (`route_options.lagerbestand`, `vk_cent`), der Kassenbeleg bucht den Verkauf (Bezug Kassenbeleg); ohne ph_kassa wie bisher `als_ausstellungsstueck_verkaufen` | ph_kassa Site |


## Packtisch nach JTL (04.11.)

Quelle `Marktresearch/digital/backoffice/33-referenz-jtl-packtisch.md` § 4. Reine Regeln `ph_logistik/packtisch_regeln.py` (Test `tests/test_packtisch_jtl.py`, 17), Frappe-Ablauf `ph_logistik/packtisch_ablauf.py` (whitelisted, Rollen wie Packtisch), Site-Tests `doctype/ph_packplatz/test_ph_packplatz.py`.

| Punkt | Umsetzung |
|---|---|
| Erster Scan (M1) | `packtisch_ablauf.vorgang_scannen(code, packplatz)`: Lieferscheinnummer → Bestellnummer (bezahlte Shop-Bestellung ohne Lieferschein → wird angelegt) → Auftrag → Kommissions-Etikett (`KOM:<Kommission>` oder Kommission) → Artikel-EAN/SN/Slug: Lieferschein mit den **wenigsten offenen Positionen**, dann ältester; zurückgestellte nur per Nummer. Scanfeld auf der Packtisch-Übersicht. |
| Mengen (M3) | Mengenfeld vor dem Scan, `scan_menge(lieferschein, code, anzahl, bestaetigt)`; Menge > 1 → Rückfrage (Packplatz `mengen_bestaetigen`), Überschreitung → Fehlerton. |
| Ohne Barcode (M4) | Position `ohne_barcode` (automatisch, keine EAN/SN), orange Kennzeichnung, `hand_bestaetigen(lieferschein, position, anzahl)` → `hand_bestaetigt`/`_von`; Positionen mit Barcode per Hand nur Leitung. |
| Pakete, Inhalt, Gewicht (M6/M7/S4) | `pakete_mit_inhalt(lieferschein, pakete[{…, inhalt_map{position: menge}}])`: mehrere Packstücke mit Inhalt je Paket (`inhalt_json`, Text), Gewichtsvorschlag = Artikelgewichte (PH Produkt `gewicht_g`) + Profil-Tara (`gewicht_vorschlag_g`), manuelles Gewicht (`gewicht_manuell`) mit Plausibilität (Packplatz-Toleranz Promille/Mindest-g, Profilgrenze `gewicht_max_g`); keine Waage → manuelles Gewicht Pflicht vor dem Label (`gewicht_pflicht`). |
| Packmittel (S3) | PH Paketprofil `packmittel_produkt` (Lagerartikel): je Paket 1 Stück „Ausbuchung“ (Grund Packmittel) beim Gepackt-Melden aus Packplatz-/Packtisch-/Standardlager, idempotent `pm:<LS>:<Paket>`, `packmittel_gebucht`; fehlender Bestand → Kommentar. Meldebestand/Nachbestellung über die Lager-Funktionen. |
| Packhinweise (S1/S2) | **PH Packhinweis Regel** (Warengruppe, Marke, Länder inkl. `EU`/`Drittland`, Warenwert von/bis, Lieferart, nur zerbrechlich, Priorität, Bestätigungspflicht) + Geschenk/Kommission; vor dem Verpacken angezeigt, `packhinweise_bestaetigen`. |
| Dokumentregeln (S5/M11) | **PH Dokument Regel** (Dokument, Druckformat, Beilegen/Nicht beilegen, Anzahl, Länder/außer, Wert, Lieferart, Komplett/Teil/Erste/Letzte Teillieferung, abweichende Lieferadresse, Geschenk); ohne Regel Lieferschein. Ergebnis in `dokumente_beigelegt`, Druckansicht je Dokument. Startregeln (Platzhalter) in `after_install`. |
| Abschluss „Verpacken“ (M8/M9) | `verpacken(lieferschein, packplatz, tarif_id, teillieferung)`: Prüfung (alles gepackt, Pakete, Gewicht, Packhinweise, nicht zurückgestellt) → LetMeShip-Label (Tarif oder Empfehlung) → Gepackt + Bestands-/Packmittel-Abbuchung → Dokumente. **`uebergeben` (versendet) erst, wenn jedes Paket eine Sendung mit Tracking-Nr. hat** (Leitung: `ohne_tracking=1`); Spedition unverändert über Speditionsauftrag. |
| Zurückstellen/Teillieferung (M10/M11) | `zurueckstellen(grund Fehlt/Beschaedigt/Falscher Artikel/Kunde Rueckfrage/Sonstiges, text, fotos)` (gepackte Mengen bleiben, Problemgründe über `problem_melden`), `fortsetzen`; `teillieferung_aus_gescannten` – bleibt nur Gescanntes, Rest als neuer Entwurf (`teillieferung_von`). |
| Schnellversand (S6) | `schnellversand(code, packplatz)`: 1 Position, Menge 1, Versand, festes Paketprofil, keine Bestätigungs-Hinweise → packen, Paket, Label, Gepackt in einem Scan (Packplatz-Schalter). |
| Packplatz-Profil | **PH Packplatz** (Name = Gerätename als Text, keine Abhängigkeit zu PH Geraet): Drucker je Dokumentart (Lieferschein, Packliste, Rechnung, Etikett, Packstück, sonstige), Töne an/aus, Mengenbestätigung, Handbestätigung, Gewichtspflicht/Toleranz, Schnellversand, Tarif-Empfehlung, Packmittel-Lagerort. Gerät merkt sich den Packplatz (`localStorage ph_packplatz`, Button „Packtisch öffnen“). |

Offen: Drucker werden nur benannt (kein Druckdienst; Browser-Druckansicht); Packstück-Etikett/NVE für Speditionen (L6) und Waage (L1) später; Gewichtsvorschlag braucht gepflegte `gewicht_g` je Produkt.

## Lager & Inventur Ergänzung (04.11.)

Inhaber-Frage „Lager und Inventur – haben wir das?“: Grundfunktionen waren da (Lagerort/Platz, Bestand, Bewegungen, Inventur mit Scan). Ergänzt:

| Bereich | Neu |
|---|---|
| **Meldebestand** | DocType **PH Meldebestand** (`PH-MB-.#####`) je Produkt/Ausführung/Lagerort: `meldebestand`, `zielbestand`, `bestellmenge_min`, `verpackungseinheit`, `lieferant` (leer = Marke.lieferant), `wiederbeschaffung_tage` (leer = PH Lieferant Lieferzeit → Produkt → Lieferant-Standard), `sicherheit_tage`; täglich gerechnet: Bestand, Reserviert, Kommission, Gesperrt, Offen bestellt, **Verfügbar = Bestand − Reservierungen − Kommission − Sperrbestand + offene Herstellerbestellungen**, `empfehlung_meldebestand` (Abgang 90 Tage × (WBZ + Sicherheit), nur Vorschlag). Ausstellungsstücke ausgeschlossen, Ersatzteile bleiben in ph_service. Buttons Jetzt prüfen, Empfehlung übernehmen. |
| **Nachbestellvorschlag** | DocType **PH Bestellvorschlag** (`PH-BV-.YYYY.-.#####`, Offen → Bestellt/Erledigt/Verworfen), Scheduler 05:45 `nachbestellung.vorschlaege_erzeugen` (verfügbar ≤ Meldebestand → Vorschlag, wieder darüber → Erledigt, Aufgabe an Leitung). Listen-Button **„Herstellerbestellung aus Vorschlägen“** → `nachbestellung.bestellungen_aus_vorschlaegen` → `ph_sortiment.api.bestellungen_sammeln` (Entwurf je Lieferant, `bezug_zeile` = Vorschlag, idempotent). PH Logistik Leitung darf dafür HB-Entwürfe anlegen (ph_sortiment-Recht ergänzt). Number Cards **PH Unter Meldebestand**, **PH Bestellvorschlaege offen**; Report **PH Nachbestellvorschlag** (live). |
| **Inventurbewertung** | Report **PH Inventurbewertung** (Stichtag, Lagerort, Methode, Anzeige je Position/Lagerort/Warengruppe/Marke/Bewertungsart) und Beleg **PH Inventurbewertung** (`PH-IB-.YYYY.-.####`, Entwurf → Festgeschrieben, unveränderlich) mit Positionen, Methodenbeschreibung, angewendeter Staffel, CSV-Export (privater Anhang), Druck **„PH Inventurbewertung“** mit Summen je Lagerort/Warengruppe/Marke und drei Unterschriftszeilen. Menge zum Stichtag per Rückrechnung aus dem Bewegungsjournal (neu `PH Lagerbewegung.lagerbestand_von` für Umlagerungen). Einstandspreis wählbar in PH Logistik Einstellungen (`bewertung_methode`): **Gleitender Durchschnitt** aus Wareneingängen (EK aus Herstellerbestellung, AB-Preis vor Bestellpreis) oder **Letzter EK**; Rückfall EK der Bestandszeile/Produkt. Niederstwert: min(EK × (1 − Abwertung), Nettoerlös aus VK Ausstellung/Abverkauf). Abwertungsstaffel (Kind **PH Logistik Abwertung**, Lagerware/Ausstellungsstueck/B-Ware × Alter in Monaten) – Standard **Platzhalter** (Ausstellung 20/40/60/80 % ab 0/12/24/36 Monaten, B-Ware 30 %, Lagerware ab 24 Monaten 50 %), Schalter `abwertung_platzhalter` steht auf Druck und Bericht. Zugriff nur Logistik-Leitung, Geschäftsführung, Buchhaltung extern (Einstellungsfelder permlevel 1). |
| **Übergabe Faktura** | Buchungsvorschlag Bestandsveränderung (Differenz zur letzten festgeschriebenen Bewertung gleichen Umfangs; Konten `konto_handelswaren` 1600 / `konto_bestandsveraenderung` 5010 – Platzhalter). ph_faktura PH Export Lauf (Belegarten „Alle“) übernimmt festgeschriebene Bewertungen als Zeile ohne USt (`rechenwerk.integration.bestandsveraenderung_zeile`, `ph_faktura.integration.inventurbewertung_zeilen`), sperrt sie über `export_status`. |
| **Teilinventur** | PH Inventur `inventur_art` Stichtag/Teilinventur/Anlass, `anlass`, `plaetze` (einer je Zeile, „(ohne Platz)“), `geschaeftsjahr`, `gezaehlte_plaetze`; Zählliste nur für die Plätze; Freigabe setzt `zuletzt_gezaehlt`/`zuletzt_inventur` an PH Lagerort Platz bzw. PH Lagerort. Button „Nächste Plätze vorschlagen“, `inventur_plan.teilinventur_anlegen(lagerort, anzahl)`, Report **PH Inventur Abdeckung** (Reihenfolge = Vorschlag, Abdeckung %, Soll lt. Plan, Rückstand, Plätze je Woche). Plan „jeder Platz 1× je Geschäftsjahr“ (`geschaeftsjahr_beginn_monat`, `teilinventur_aktiv`, `teilinventur_plaetze_je_lauf`); Scheduler Mo 07:15 `inventur_plan.abdeckung_pruefen` → Aufgabe bei Rückstand. |
| **Vier-Augen** | `freigeben` sperrt, wenn die freigebende Person `gezaehlt_von` ist (Schalter `inventur_vier_augen`, Standard an; technischer Benutzer Administrator ausgenommen). |
| **Mobile Zählung** | `ph_logistik.ph_logistik.inventur_mobil`: `inventur_offen()`, `inventur(name, nur_offen, bereich)`, `naechste_position(inventur, nach, bereich)`, `starten`, `scan(inventur, code)` (Bestand-QR/SN/EAN oder Platz-QR), `zaehlen(…, idempotency_key)`, `zaehlen_plus(…, idempotency_key)`, `fund(…)`, `fortschritt`; Blindzählung (`inventur_soll_ausblenden`, Leitung sieht Soll). Damit braucht die Zähl-App keinen Desk. |

Reine Logik (ohne Site): `nachbestellung_logik.py`, `inventur_logik.py` – `tests/test_lager_inventur_logik.py` (18). Site-Tests: `test_ph_meldebestand.py`, `test_ph_inventurbewertung.py`, `test_ph_inventur.py` (TestPHInventurTeilMobil). Patch `v0_2.lager_inventur_standard` setzt Platzhalter-Staffel/Konten. Offene Steuerberater-Fragen: `Marktresearch/digital/backoffice/91-steuerberater-fragen.md` Nr. 25–29.
