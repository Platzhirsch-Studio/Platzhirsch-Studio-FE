# 51 – Backend-Lücken Projekte · Sortiment · Logistik

Stand 04.11.2026 · Inhaber-Mandat Nr. 50 · Schreibbereich `Backend-Import/ph_projekte`, `ph_sortiment`, `ph_logistik` · kein Commit, nicht installiert, nur statisch und mit Unit-Tests ohne Site geprüft.
Vorbild marahplus (Sauter + Held), Grundlage 05 §4, 10-konzept-*, 30-/32-marktfunktionen.

Legende Entscheidung: **gebaut** · **vorhanden** (Fundstelle) · **ergänzt** (vorhanden + Lücken geschlossen) · **bewusst nicht** (Begründung).
DocType-Tests (FrappeTestCase) sind geschrieben, aber ohne Bench-Site nicht ausgeführt.

## Projekte (`ph_projekte`)

| Lücke | Entscheidung | umgesetzt in | Test |
|---|---|---|---|
| Aufmaß (Räume, Maße, Fotos, Skizze, Anschlüsse Wasser/Strom/Abluft) | gebaut | neu PH Aufmass (`PH-AFM-.YYYY.-.####`) + Kind Raum/Mass/Anschluss/Foto; Entwurf → Erfasst → Geprueft; Skizze hochladen, Räume ins Projekt, Planung anlegen; Druck „PH Aufmass Protokoll“; `utils/aufmass.py` | test_aufmass, test_ph_aufmass |
| Planungsversionen mit Kundenfreigabe | ergänzt | PH Planung (+ Status „Aenderung gewuenscht“, Kundenentscheidung mit Zeit/IP-Hash, `verwerfen_zuruecknehmen`); `kunden_vorlegen` legt Plan-Dokument + Nachricht/Mail an; `portal_plannings`, `portal_planning_decide` | – (DocType-Test) |
| Import Küchenplanung CARAT/KPS/Winner (CSV/XML) | gebaut | `utils/kuechenplanung.py` Adapter + Registry, generischer CSV-/XML-Adapter, Presets CARAT/KPS/Winner **unverifiziert**; PH Planung Position +9 Felder; `import_vorschau`, `import_uebernehmen` | test_kuechenplanung |
| Positionen je Raum mit Lieferant/Ausführung/Lieferstatus | gebaut | PH Projekt Position +19 Felder; `herstellerbestellungen_erzeugen` → `ph_sortiment.api.bestellungen_sammeln` | test_lieferung |
| Teil-/Nachlieferung je Position | gebaut | `lieferung_buchen`, `nachlieferung_anlegen`; `ph_projekte/lieferung.py` doc_events auf PH Herstellerbestellung (Termine, Status) und PH Wareneingang (Mengen) | test_lieferung, TestPHProjektLieferung |
| Terminplanung Montage mit Ressourcen + Kollisionsprüfung | gebaut | Montageauftrag `fahrzeug`, `kollisionen` (Monteur, Fahrzeug, PH Abwesenheit/PH Tour wenn installiert); `montage_kollisionen`, `montage_plantafel`; Rolle PH Montage in Rechten/Workflow | test_montageplan, TestPHMontageKollision |
| Fremdgewerk-Koordination mit Terminen und Abnahmen | gebaut | Kind PH Fremdgewerk Termin; Abnahmefelder, `termin_hinzufuegen`, `abnehmen`; Abhängigkeitswarnung | test_montageplan |
| Mängelliste mit Fristen | ergänzt | `verantwortlich`/`_ref`/`erinnert_am` an Montage-Mangel und Abnahme-Position; Bug „behoben“ in `abnahme_anlegen`; Scheduler `maengel_fristen_pruefen` Mo–Fr 07:15 | TestMaengel |
| Abnahmeprotokoll mit Unterschrift (Canvas) | vorhanden | PH Abnahme `unterschrift_kunde`/`unterschrift_studio` (Signature), `unterschrift_erfassen` | bestehend |
| Nachträge/Änderungsaufträge mit Preis und Kundenfreigabe | gebaut | neu PH Nachtrag (`PH-NT-.YYYY.-.####`) + Position; Workflow; Freigabe per Unterschrift oder Portal → Positionen ins Projekt, `nachtraege_cent`; `portal_change_orders`, `portal_change_order_decide`; Druck „PH Nachtrag Standard“; `utils/nachtrag.py` | TestNachtrag, test_ph_nachtrag |
| Projekt-Kalkulation Soll/Ist | gebaut | `utils/kalkulation.py`, `PH Projekt.kalkulation()` (Leitung), API `projekt_kalkulation`, Report PH Projektkalkulation, Einstellung `montage_kostensatz_cent` | TestKalkulation |
| Auftragsmappe als PDF-Sammeldruck | gebaut | `api.auftragsmappe_pdf` (pypdf), Ablage als PH Projekt Dokument, Druck „PH Auftragsmappe Deckblatt“, `utils/mappe.py` | TestMappe (Merge lokal übersprungen, pypdf fehlt ohne Bench) |
| Nebenbefunde | behoben | Rendering `kunden_vorlegen` setzt `workflow_state`; `auftragsmappe()` filtert Herstellerbestellungen nach Projekt; permlevel-1-Rechtezeilen in 9 DocTypes | – |

## Sortiment (`ph_sortiment`)

| Lücke | Entscheidung | umgesetzt in | Test |
|---|---|---|---|
| IDM-/DataNorm-/Hersteller-CSV-Preislistenimport mit Mapping + Vorschau | gebaut | `logik/preislisten_format.py` (CSV, DataNorm 4, IDM-XML-Preset **unverifiziert**); PH Preisliste Import: Format/Trennzeichen/Kodierung/Mapping/Vorschau, `vorschau`, `mapping_speichern`; Zuordnung Artikelnr → EAN → SKU; Vorlage je Lieferant | test_preislisten_format, test_ph_preisliste_import |
| Ausführungs-/Variantenmatrix mit Aufpreisen | ergänzt | Aufpreise vorhanden; neu `preisgruppe`, `ek_aufpreis_cent`, `nicht_kombinierbar_mit`, Kind PH Produkt Variantenpreis, `variante_preis`, API `variante_berechnen` | test_kalkulation, test_ph_produkt |
| EK und VK mit Gültigkeit | ergänzt | VK vorhanden (PH Produkt Preis `ab`/`gueltig_bis`); neu Kind PH Produkt Einkaufspreis (permlevel 1), `einkaufspreis_cent` = gültiger Netto-EK | test_kalkulation |
| Kalkulationsfaktor je Marke | gebaut | PH Marke `kalkulationsfaktor_promille`, `vk_rundung`, Kind PH Marke Kalkulation (je Kategorie); `vk_aus_ek`, `PH Produkt.vk_vorschlag` | test_kalkulation |
| Lieferzeiten je Lieferant | gebaut | Kind PH Lieferant Lieferzeit / Betriebsurlaub; `liefertermin_schaetzen` (API), Wunschtermin-Vorbelegung | test_bestellung |
| Herstellerbestellung aus Projektpositionen gesammelt | gebaut | `ph_sortiment.api.bestellungen_sammeln(positionen, bezug_doctype, bezug_name, kommission, idempotency_key)`, `logik/bestellung.py`, Positionsfelder `raum`, `bezug_zeile` | test_bestellung, HB-Test |
| AB-Abgleich Preis/Termin/Ausführung mit Abweichungsworkflow | ergänzt | `ab_ausfuehrung_text`, Option „Ausfuehrung“; `abweichung_klaeren`, `ab_nachfragen` | test_bestellung |
| Liefertermin-Änderungen → Projekt/Kunde | gebaut | Kind PH Herstellerbestellung Terminaenderung (`terminaenderungen`), Protokoll in validate, ToDo, `termin_aendern`, Report PH Liefertermin Aenderungen; Auswertung in ph_projekte (`lieferung.py`) | test_bestellung |
| Ausstellungsstücke (Showroom, Abverkauf) | ergänzt | vorhanden: Produkt `typ`, `ausstellungsstueck_anlegen`; neu `abverkauf`, `abverkauf_preis_cent`, `abverkauf_seit` | test_ph_produkt |
| Reservierungen | → ph_logistik | siehe unten | |
| Rechte aus Konzept (Lesen Produkt/Marke für Projekte, Faktura, Kassa …; Logistik schreibt Wareneingang) | ergänzt | Permissions der JSONs | – |

## Logistik (`ph_logistik`) inkl. Wareneingang (DocType in ph_sortiment)

| Lücke | Entscheidung | umgesetzt in | Test |
|---|---|---|---|
| Wareneingang mit Positionsabgleich | ergänzt | ph_sortiment PH Wareneingang: `differenz`, `mengen_abweichung`, Zähler Unter-/Überlieferung, `kontakt`/`projekt` aus Bezug | test_bestellung |
| Schadensmeldung (Fotos → Servicefall/Regress) | gebaut | `PH Wareneingang.schaden_melden(beschreibung, regress)` → `ph_service … aus_dokument` (nur wenn installiert), Fotos, optional Lieferantenregress; Einlagerung als B-Ware gesperrt (`ereignisse.py`, `bestand_logik.einlagerung_aus_wareneingang`, nur Differenzbuchung) | test_lager_logik |
| Lagerplatz/Kommissionierung je Projekt | gebaut | Lagerbestand `kommission`/`gesperrt`, Status Kommission/Gesperrt; `lager.kommissionsliste`, `lieferschein_aus_kommission`, Report PH Kommissionsware, Platzetikett 62×29 mm, Platz-Scan | test_lager_logik, test_ph_lagerbestand |
| Packtisch-Ablauf (Scan, Prüfen, Packen, Gewicht, Etikett, Lieferschein, Übergabe) | ergänzt | vorhanden `packtisch.py`, `ph_lieferschein.py`; neu `positionen_setzen` (Offline, idempotent), `position_minus`, Abholcode-Prüfung serverseitig, `problem_melden`, Storno nach Gepackt nur Leitung mit Bestandsrückbuchung | test_ph_lieferschein |
| Touren mit Reihenfolge, Zeitfenster, Kundeninfo SMS/Mail | ergänzt | vorhanden Reihenfolge/Zeitfenster; neu `tour_logik.py` (ETA, Konflikte), `avis_senden` de/en/fr/it (SMS nur mit Frappe SMS Settings), `stopp_entfernen`, `plantafel`, Idempotenz `tour_mobil` | test_tour_logik, test_ph_tour |
| Fahrzeit-/Routenberechnung | bewusst nicht | kein Routendienst angebunden, keine erfundenen Fahrzeiten | – |
| Lieferschein mit Unterschrift | vorhanden + ergänzt | `als_zugestellt`, Signature; neu `bereich` je Position (Hotel/Yacht) | – |
| Retourenannahme | gebaut | PH Retoure (ph_shop) nur Shop-Widerruf → neu PH Warenruecknahme (`PH-WR-.YYYY.-.####`), Angemeldet → Angenommen → Geprueft → Abgeschlossen, `ruecknahme_logik.py` | test_spedition_ruecknahme_logik, test_ph_warenruecknahme |
| Inventur mit Zähllisten und Differenzbuchung | ergänzt | vorhanden PH Inventur; neu `zaehlen_plus` (atomar), `position_hinzufuegen` (Fund) | test_ph_inventur |
| Speditionsaufträge Großmöbel | gebaut | neu PH Speditionsauftrag (`PH-SPA-.YYYY.-.####`) + Packstück; Lademeter/Volumen, Mail mit PDF, Druck, Kanban, Buttons Lieferschein/Herstellerbestellung | test_spedition_ruecknahme_logik, test_ph_speditionsauftrag |
| Reservierungen + Ausstellungsstücke/Abverkauf | ergänzt | `reservieren(bis, kontakt)`, Scheduler 06:30 gibt Abgelaufene frei; API `get_ausstellungsstuecke` (ohne EK) | test_lager_logik |

## Nachtrag aus 32-marktfunktionen-nachtrag.md

| Lücke | App | Entscheidung | umgesetzt in | Test |
|---|---|---|---|---|
| Liefertermin-Generator über mehrere Fahrzeuge mit Montagezeit je Tour (Nr. 31, S10) | ph_logistik | gebaut | `tour_logik.termine_vorschlagen`; `ph_tour.liefertermine_vorschlagen`, `ph_tour.stopp_einplanen`; Stopp `montage_min`; Einstellungen Arbeitsbeginn/Tageskapazität/Horizont/Samstag; Button in der Tour-Liste | test_liefertermin_logik (9), TestPHTourLiefertermin |
| Kunde bei Terminverschiebung informieren (S10) | ph_logistik | gebaut | `PH Tour._verschiebung_melden`, `avis_senden(aenderung=1)`, Schalter `avis_bei_verschiebung`, Vorlage `avis_aenderung_vorlage` | test_liefertermin_logik |
| Paletten/Sperrgut/Stapelbarkeit (Nr. 33) | ph_logistik | ergänzt | Lieferschein-Paket `art`, `stapelbar`, `hubwagen` → Speditionsauftrag | test_spedition_ruecknahme_logik |
| Erfüllungsmethode je Position (Nr. 34) | ph_logistik | gebaut | Lieferschein-Position `erfuellung`, `nach_erfuellung_aufteilen()`; „Bestellung zurückhalten“ bewusst nicht (gehört zu ph_shop) | TestPHLieferscheinErfuellung |
| Bestellung je Hersteller per IWOfurn/EDI mit Übermittlungsstatus (Nr. 26, S3) | ph_sortiment | gebaut | `logik/uebermittlung.py` (Adapter-Registry E-Mail/CSV/IWOfurn/EDI ORDERS, unverifiziert, ohne GLN gesperrt, keine Übertragung); HB `exportieren(weg)`, `uebermittlung_setzen(status, hinweis)`, Felder `uebermittlung_*`, Kind PH Herstellerbestellung Uebermittlung; Mail → Uebermittelt, AB → Bestaetigt; GLN an Lieferant/Einstellungen; pCon-Rückweg bewusst nicht (keine echte Datei) | test_uebermittlung, TestPHHerstellerbestellungUebermittlung |
| AB-Merker je Position (Nr. 27, S4) | ph_sortiment | gebaut | Position `ab_merker`/`ab_merker_am` automatisch im validate; Kopf `ab_vollstaendig`; „AB geprueft“ nur bei vollständiger AB (Workflow + validate); Report PH AB Merker offen | test_uebermittlung.TestAbMerker |
| Reklamationsstatistik je Lieferant (S12) | ph_sortiment | gebaut | `logik/statistik.py`, `ph_sortiment/statistik.py`, Report PH Reklamationen je Lieferant, API `reklamationsstatistik(lieferant, von, bis)`; Servicefälle/Regresse nur mit ph_service | test_uebermittlung.TestStatistik, API-Test |
| Konditionen: Rabattstaffeln, Zu-/Abschläge, Skonto (Nr. 10) | ph_sortiment | gebaut | Lieferant `standard_rabatt_promille`, Kind PH Lieferant Rabattstaffel, Zuschlagsfelder (permlevel 1); EK-Import rechnet Netto-EK über `rabatt_fuer`; HB `zuschlaege_cent`, `skonto_cent` | TestKonditionen |
| Planungsimport inkl. pCon mit Änderungsabgleich und Storno einzelner Positionen (Nr. 14/15, S1) | ph_projekte | gebaut | `utils/kuechenplanung.py` pcon_csv/pcon_obx (unverifiziert), `abgleich()`; PH Planung `import_abgleich_vorschau`, `import_abgleichen` (Storno statt Löschen; im Projekt → Nachtrag-Entwurf, bestellt → Aufgabe „Hersteller informieren“); Rückmeldung `lieferstatus`/`herstellerbestellung`/`liefertermin` an PH Planung Position | test_nachauftrag.TestAbgleich |
| „Küche komplett“ erst wenn alle Positionen da (S6) | ph_projekte | gebaut | `utils/lieferung.ware_komplett`; PH Projekt `ware_komplett`, `ware_komplett_am`, `ware_fehlend`; Montageauftrag `ware_hinweis`, Sperre per `montage_nur_bei_ware_komplett` | TestKomplett, test_montage_nachauftrag |
| Montagezeit aus Planung + Verschiebung an Kunden (S10) | ph_projekte | gebaut | Kind PH Montage Richtwert, `montagezeit_vorschlagen(uebernehmen)` → `stunden_vorschlag`; Verschiebung > 30 min → Aufgabe/Kundennachricht (`montage_verschiebung_kunde_automatisch`) | TestMontagezeitQualifikation |
| Montage nach Qualifikation (Nr. 21) | ph_projekte | gebaut | Kind PH Montage Qualifikation (je Monteur in Einstellungen, benötigt je Montageauftrag), `qualifikationen_vorschlagen`; Kollisionsprüfung/`montage_kollisionen(qualifikationen)`, `montage_plantafel` mit `fehlende_qualifikationen`/`geeignet` | test_qualifikationen, test_montage_nachauftrag |
| Montageprotokoll S11 (Vorschäden, E-Geräte mit E-Nummer) | ph_projekte | ergänzt | Vorschaden-Felder + Foto-Art; Kind PH Montage Geraet, `geraete_aus_stueckliste`; Montagebericht de/en/fr/it; Retouren vor Ort → ph_logistik, Rechnungsversand → ph_faktura | test_geraet |

## Prüfung (04.11.2026, nach Nachtrag)

- `check.py --streng`: 0 Befunde in den drei Apps (PH-AFM, PH-NT, PH-SPA, PH-WR sind in ph_core eingetragen); übrig 2 fremde Serien: PH-DSA (ph_crm), PH-KRANK (ph_personal).
- `contracts.py`: 0 Fehler gesamt, 36 Warnungen.
- Unit-Tests ohne Site: ph_projekte 63 (1 skip), ph_sortiment 56, ph_logistik 71 (1 skip) – grün. DocType-Tests geschrieben, ohne Bench-Site nicht ausgeführt.


## Packtisch nach JTL (04.11.2026)

Abgleich `33-referenz-jtl-packtisch.md` § 4 mit ph_logistik (Packtisch, PH Lieferschein, PH Paketprofil).

| # | Muss/Soll | Stand vorher | umgesetzt in | Test |
|---|---|---|---|---|
| M1 | Erster Scan erkennt Vorgang (LS, Bestellung, Auftrag, Kommission, EAN → wenigste offene Positionen) | nur Auswahl in der Liste | `packtisch_regeln.vorgang_aus_scan`, `packtisch_ablauf.vorgang_scannen`, Scanfeld Übersicht | TestVorgang (3), test_vorgang_scan_lieferschein_und_ean |
| M2 | Ist/Soll je Zeile, erledigte nach unten | Ist/Soll vorhanden | Sortierung in der Page | – |
| M3 | Menge vor Scan, Mengen > 1 bestätigen | nur +1 | `menge_pruefen`, `scan_menge`, Mengenfeld | TestMenge, test_menge_bestaetigen_und_hand |
| M4 | Positionen ohne Barcode per Hand | – | Position `ohne_barcode`/`hand_bestaetigt`, `hand_bestaetigen` | test_ohne_barcode, test_menge_bestaetigen_und_hand |
| M5 | Töne je Gerät abschaltbar | Ton fest | PH Packplatz `ton_erfolg`/`ton_fehler` | – |
| M6/S4 | Mehrere Pakete mit Inhalt je Paket | Pakete ohne Positionsbezug | Paket `inhalt_json`, `pakete_mit_inhalt`, Inhalt-Dialog | TestPakete.test_inhalt |
| M7 | Gewichtsvorschlag + Pflicht manuell + Plausibilität | Profilgewicht | `gewicht_vorschlag`, `gewicht_plausibel`, Paket `gewicht_vorschlag_g`/`gewicht_manuell`/`gewicht_plausibel`, Profil `gewicht_max_g` | TestPakete, test_verpacken_gewicht_pflicht_label_tracking |
| M8 | Ein Abschluss „Verpacken“ (Label, Ausbuchen, Dokumente, Status) | getrennte Schritte | `packtisch_ablauf.verpacken` | TestAbschluss.test_verpacken, Site |
| M9 | „Versendet“ erst mit Tracking aller Pakete | Übergabe ohne Prüfung | `PH Lieferschein.uebergeben` + `alle_pakete_mit_tracking` (Leitung `ohne_tracking`) | test_tracking, test_uebergeben_ohne_tracking_gesperrt |
| M10 | Zurückstellen mit Grund, nichts verworfen | nur `problem_melden` | `zurueckstellen`/`fortsetzen`, Felder `zurueckgestellt_*`, Kachel | test_zurueckstellen_und_teillieferung |
| M11 | Teillieferung nur aus gescannten Positionen + Dokumentregel erste/letzte | nur Aufteilen nach Erfüllung | `teillieferung_aufteilen`, `teillieferung_aus_gescannten`, `teillieferung_art` | test_teillieferung, Site |
| M12 | Spedition getrennt | vorhanden (PH Speditionsauftrag) | unverändert, `verpacken` bucht kein Paketlabel | – |
| S1/S2 | Packhinweise nach Regeln (Warengruppe/Marke/Land/Wert) | – | **PH Packhinweis Regel**, `packhinweise`, Bestätigung | test_packhinweise |
| S3 | Kartonagen als Bestand | – | Paketprofil `packmittel_produkt`, `packmittel_ausbuchen` (Ausbuchung, idempotent) | test_packmittel |
| S5 | Dokumentregeln je Land/Wert/Teillieferung/Geschenk | – | **PH Dokument Regel**, `dokumente`, `dokumente_beigelegt` | test_dokumente, test_dokumentregel_geschenk |
| S6 | Einartikel-Schnellversand | – | `schnellversand_moeglich`, `schnellversand`, Packplatz-Schalter | test_schnellversand, test_schnellversand_einzelartikel |
| – | Packplatz-Profil (Drucker je Dokumentart, Töne) | – | **PH Packplatz** (Gerätename als Data) | – |

Prüfung: `check.py --streng` OK, `contracts.py` 0 Fehler (42 Warnungen, unverändert), ph_logistik Unit-Tests 96 (1 skip) grün; Site-Tests geschrieben, ohne Bench nicht ausgeführt. Bewusst offen: echter Druckdienst je Drucker, Waage (L1), NVE/SSCC (L6), Statistik je Packer (L5).

## Lager & Inventur Ergänzung (04.11.2026)

Inhaber-Frage „Lager und Inventur – haben wir das?“ – Grundfunktionen waren vorhanden (PH Lagerort/Platz, PH Lagerbestand, PH Lagerbewegung, PH Inventur mit Scan-Zählung). Neu bzw. ergänzt in `ph_logistik` (Details `Backend-Import/ph_logistik/README.md`, Abschnitt „Lager & Inventur Ergänzung“):

| Lücke | Entscheidung | umgesetzt in | Test |
|---|---|---|---|
| Meldebestand je Produkt/Ausführung/Lagerort (Lagerware; Ersatzteile in ph_service) | gebaut | **PH Meldebestand** (`PH-MB-.#####`): Melde-/Zielbestand, Mindestmenge, VPE, Lieferant (Marke), WBZ aus PH Lieferant Lieferzeit/Produkt; verfügbar = Bestand − Reservierungen − Kommission − Sperrbestand + offene Herstellerbestellungen; Empfehlung aus Abgang × (WBZ + Sicherheit) | test_lager_inventur_logik.TestMeldebestand, test_ph_meldebestand |
| Nachbestellvorschlag + Herstellerbestellung | gebaut | **PH Bestellvorschlag** (`PH-BV-…`), Scheduler 05:45 mit Aufgabe, Button „Herstellerbestellung aus Vorschlägen“ → `ph_sortiment.api.bestellungen_sammeln` (Entwurf je Lieferant, idempotent); Number Cards PH Unter Meldebestand / PH Bestellvorschlaege offen; Report PH Nachbestellvorschlag; Recht HB-Entwurf für PH Logistik Leitung (ph_sortiment) | test_ph_meldebestand |
| Inventurbewertung zum Stichtag (UGB Niederstwert) | gebaut | Report + Beleg **PH Inventurbewertung** (`PH-IB-…`, festschreibbar): Rückrechnung zum Stichtag aus dem Journal (`lagerbestand_von` neu), Methode gleitender Durchschnitt / letzter EK (Einstellungen, dokumentiert im Beleg), Abwertungsstaffel Lagerware/Ausstellungsstück/B-Ware nach Alter (**Platzhalter**), Nettoerlös-Vergleich, Summen je Lagerort/Warengruppe/Marke, CSV, Druck „PH Inventurbewertung“ mit Unterschriften; nur Leitung/GF/Buchhaltung extern | test_lager_inventur_logik.TestStichtag/TestBewertung, test_ph_inventurbewertung |
| Übergabe an Buchhaltung | gebaut (Vorschlag) | Buchungsvorschlag Bestandsveränderung (Konten 1600/5010 Platzhalter) → ph_faktura PH Export Lauf „Alle“ (`bestandsveraenderung_zeile`, `inventurbewertung_zeilen`, ohne USt, Sperre über `export_status`) | ph_faktura test_integration.TestBestandsveraenderung |
| Permanente/rollierende Teilinventur | gebaut | PH Inventur `inventur_art` (Stichtag/Teilinventur/Anlass), `plaetze`; Plan „jeder Platz 1× je GJ“, `zuletzt_gezaehlt` je Platz, Vorschlag nächste Plätze, `teilinventur_anlegen`, Report **PH Inventur Abdeckung**, Wochenprüfung mit Aufgabe | test_lager_inventur_logik.TestAbdeckung, TestPHInventurTeilMobil |
| Vier-Augen bei Freigabe | ergänzt (war nur Konzept) | `freigeben` sperrt die zählende Person (`inventur_vier_augen`) | TestPHInventurTeilMobil.test_vier_augen |
| Mobile Zählung ohne Desk | gebaut | `inventur_mobil`: `inventur_offen`, `inventur`, `naechste_position`, `starten`, `scan` (Bestand/SN/EAN/Platz-QR), `zaehlen`/`zaehlen_plus`/`fund` mit Idempotenz, `fortschritt`, Blindzählung | TestPHInventurTeilMobil.test_mobil_api |

Bewusst offen: Anschaffungsnebenkosten (Fracht/Zoll) gehen nicht in den Einstandspreis; FIFO/LIFO nicht angeboten; Umlagerungen vor dem 04.11.2026 haben keine Quellzeile (Hinweis im Bericht). Steuerberater-Fragen 91 Nr. 25–29.

Prüfung: `check.py --streng` – keine Befunde aus ph_logistik/ph_sortiment/ph_faktura (übrig 4 Fehler der neuen App ph_ablage: Serien PH-DAT/PH-ORD, Rollen PH Ablage *); `contracts.py` – 0 Fehler in diesen Apps (29 Fehler nur ph_ablage-Rollen); Unit-Tests ohne Site: ph_logistik 114 (1 skip), ph_sortiment, ph_faktura 69 grün. Site-Tests geschrieben, ohne Bench nicht ausgeführt.

## Projektnachkalkulation (04.11.2026)

Inhaber-Wunsch: während der Bauphase sehen, ob ein Projekt im Budget ist; Eingangsrechnungen ganz oder aliquot dem Projekt zuordnen; laufender DB-Prozentsatz, DB1-Ausweisung. Alle Parameter sind Einstellungen (Leitung/GF), keine Konstanten im Code.

| Thema | App | Stand | Umsetzung | Tests |
|---|---|---|---|---|
| Kostenarten-Katalog | ph_projekte | gebaut | DocType **PH Kostenart** (Name, Bezeichnung, DB-Stufe DB1/DB2/DB3, Reihenfolge, aktiv, zeitbasiert); Standard (install + Patch v0_2): Ware, Fracht (DB1) · Montage eigen, Montage extern, Fremdgewerk, Material, Entsorgung, Sonstiges (DB2) · Planung extern, Planung intern, Nachlauf (DB3). In ph_projekte statt ph_faktura, weil ph_faktura von ph_projekte abhängt (Budget braucht die Kostenart). | Site-Test |
| Kostenzuordnung Eingangsrechnung | ph_faktura | gebaut | Kind **PH Eingangsrechnung Zuordnung** (Projekt, Kostenart, Prozent oder Betrag, Belegposition, Bezug-Typ/Bezug, Bemerkung); ER-Felder `zuordnung_modus` (Ganz einem Projekt · Nach Positionen · Aliquot · Gemeinkosten), `kostenart`, `zuordnung_status`, Summe/Differenz, `bestellung_vollstaendig_berechnet`, `budget_hinweis`. Rundungsrest auf die größte Zeile (`rechenwerk/kostenzuordnung.py`). Freigabe nur bei vollständiger Zuordnung (Lieferanten-Gutschrift ohne Bezug → Gemeinkosten mit Hinweis; Gutschrift mit Ursprungsrechnung → anteilig wie diese, negativ im Projekt). Button „Zuordnung vorschlagen“ (Herstellerbestellung → Ware, Speditionsauftrag des Spediteurs → Fracht, Fremdgewerk des Partnerbetriebs → Fremdgewerk). Nach Freigabe nur „Umbuchen“ (Leitung, Grund Pflicht, Kommentar + PH Kalkulation Protokoll alt → neu). Patch `v0_2.kostenzuordnung_altbestand`. Report **PH Nicht zugeordnete Eingangsrechnungen**. | test_kostenzuordnung (8), TestPHEingangsrechnungKostenzuordnung (5) |
| Kalkulationseinstellungen | ph_projekte | gebaut | PH Projekte Einstellungen, Abschnitt Kalkulation (permlevel 1, GF jetzt schreibberechtigt): **PH Kostensatz** (Tätigkeit erweiterbar, Rolle oder Mitarbeiter, Cent/h, gültig ab, Platzhalter), **PH Kalkulation Ziel** (Projektart aus PH Projekt, Ziel DB1–3 %, DB-Ampel gelb/rot ab x/y Punkten unter Ziel, Budget gelb/rot je Projektart, gültig ab), **PH Gemeinkosten Regel** (Aus / % auf Wareneinsatz / % auf Gesamtkosten / % auf Erlös / Cent je Projektstunde, je Projektart, gültig ab) + Standardschwellen (gelb 90 %, rot über 100 %, DB rot 5 Punkte, Kommentarpflicht 10 %), Schalter Warnung und Budget bei Auftrag. Validierung `einstellungen_pruefen` (keine doppelte Gültigkeit je Schlüssel, Prozente 0–100, gelb ≤ rot). Jede Änderung → **PH Kalkulation Protokoll** (wer, wann, alt → neu). Platzhalter: Kostensätze 0 € markiert, Ziel-DB leer = keine DB-Ampel; Hinweis im Formular und Workspace-Shortcut „Kalkulation einrichten“. API `kalkulation_einstellungen()` / `kalkulation_einstellungen_speichern(kostensaetze, ziel_db, gemeinkosten, schwellen, begruendung)`. | TestGueltigkeit (7), Site-Test API |
| Gültigkeitslogik | ph_projekte | gebaut | `gueltige_zeile`: gültig ab ≤ Datum, spezifisch vor allgemein (Mitarbeiter > Rolle > alle; Projektart > „Alle“), bei Gleichstand jüngstes gültig ab. Jede Projektzeit wird mit dem am Leistungsdatum gültigen Satz bewertet; „Koordination“/„Buero“ fallen auf „Projektleitung“ zurück, dann auf „Alle“. Abgeschlossene Nachkalkulationen sind eingefroren und werden bei Satzänderungen nicht neu gerechnet. Ohne gepflegte Sätze gilt der alte Einzelsatz `montage_kostensatz_cent` für Montage/Fahrt weiter. | test_kalkulation_v2 |
| Kalkulation v2 | ph_projekte | gebaut | `utils/kalkulation.py` (alte Funktionen unverändert, Anzahlungsrechnung-Filter korrigiert) + `ph_projekte/nachkalkulation.py` (Datensammlung). **Ist**: zugeordnete ER (maßgeblich; Altbestand mit Kopf-Projekt ohne Zeilen vorläufig voll + Hinweis), Lagerentnahmen Verkauf/Ausbuchung mit Bezug Projekt × Einstandswert (Kommissionsware des Projekts ausgenommen), Projektzeiten × Satz, Kassenbuch „Barausgabe“ mit Projektnummer im Grund (Material, brutto), Servicefall-Kosten ohne ER (nach Übergabe = Nachlauf) − erhaltener Regress ohne ER-Gutschrift. **Obligo**: Herstellerbestellung (Bezug Projekt oder Kommission, AB-Menge × AB-EK), Speditionsauftrag (bestätigter, sonst angefragter Preis), Fremdgewerk ab „Geplant“ (nicht Vertrag direkt mit Kunde) – jeweils minus ER-Zeilen mit diesem Bezug, 0 bei Storno/„vollständig berechnet“ → keine Doppelzählung. **Erlös**: AB netto + freigegebene Nachträge, ab Schlussrechnung gestellte Rechnungen netto ohne Anzahlungsrechnungen, − Gutschriften − gewährte Skonti (netto-anteilig), + Kassa-Verkäufe zur AB ohne Rechnung. **Stufen** DB1/DB2/DB3 (+ DB4 nach Gemeinkosten nur wenn eingeschaltet), absolut und % vom Erlös, für Ist, Prognose und Budget. | TestStufenObligoPrognose (7), TestGesamt (3) |
| Budget | ph_projekte | gebaut | Kind **PH Projekt Budget** am Projekt (permlevel 1): Budget bei Auftrag (Vorbelegung: EK der Positionen → Ware, geplante Montagestunden × Satz → Montage eigen, Fremdgewerke, Speditionsanfragen), automatisch eingefroren beim Wechsel auf „Auftrag“ (Schalter) oder per Button; danach nur „Anpassung Leitung“; aktuelles Budget = bei Auftrag + EK-Differenz freigegebener Nachträge (Ware) + Anpassung. Restkosten je Kostenart manuell überschreibbar mit Pflicht-Begründung. Änderungen protokolliert. | Site-Test |
| Laufende Steuerung | ph_projekte | gebaut | Je Kostenart Budget · Ist · Obligo · Rest (max(Budget − Ist − Obligo, 0) oder manuell) · Prognose · Abweichung · Ampel (gelb ab 90 % gebunden, rot bei Überschreitung von 100 %; ohne Budget gelb). **Fertigstellungsgrad** = gewichteter Mittelwert aus Phase (Grundwert, 20 %), Lieferquote der Positionen (40 %) und Montagestunden Ist/Plan (40 %, ohne Plan montierte Menge); fehlende Komponenten fallen aus der Gewichtung, nie unter dem Phasen-Grundwert, Übergabe ≥ 95, Abgeschlossen 100. **DB laufend** = Erlös × Fertigstellungsgrad − Ist (Leistungsfortschritt statt voller Erlös gegen halbe Kosten); **End-DB** = Erlös − Prognose (letzte Stufe). DB-Ampel gegen Ziel je Projektart; Gesamtampel = schlechteste. Projekt-Abweichung (Ziel-DB, Gemeinkosten) nur mit Begründung, protokolliert. Cache-Felder `kalk_*` am Projekt. | test_kalkulation_v2 |
| Warnungen | ph_projekte | gebaut | Scheduler 05:45 `tasks.kalkulation_pruefen`: laufende Projekte rechnen, Cache schreiben, bei Rot einmalig PH Projekt Aufgabe „Kalkulation rot: …“ an Projektleitung (Team-Planer → Planer → Berater) + Glocke (Notification Log). Bei Freigabe einer ER: Budgetprüfung je Projekt/Kostenart, Meldung an den Freigebenden + `budget_hinweis`. | – |
| Auswertungen | ph_projekte | gebaut | Reports **PH Projektnachkalkulation** (je Projekt Erlös, DB1–3/4, Budget/Ist/Obligo/Prognose, Ampel, Basis Prognose/Ist), **PH Kostenarten je Projekt**, **PH DB Auswertung** (Gruppierung Projektart/Berater/Marke/Monat; abgeschlossene aus dem Snapshot; Marke = Näherung über VK-/EK-Anteile, nur DB1), Number Cards **PH Projekte ueber Budget**, **PH DB1 laufende Projekte** (Ø), **PH Projekte Kalkulation rot**; nur Leitung/GF. API `ph_projekte.api.projekt_kalkulation_v2(projekt)` → kopf, stufen_ist/prognose/budget, kostenarten, zeitreihe je Woche (Ist, Obligo, kumuliert), quellen (Belege mit `link`), erloes_quellen, hinweise. Projekt-Formular: Gruppe „Kalkulation“ (laufende Kalkulation, Budget vorbelegen/einfrieren, Nachkalkulation, Protokoll). | – |
| Nachkalkulation bei Abschluss | ph_projekte | gebaut | Status „Abgeschlossen“ → **PH Projekt Nachkalkulation** (Serie PH-NK, eingefroren: alle Zahlen + `daten_json` mit Quellen), Abweichungsanalyse je Kostenart (Kind … Zeile) mit Kommentarpflicht über Schwelle (Standard 10 %, ohne Budget sobald Kosten), „Abschließen“ nur mit Kommentaren, danach nur Fazit änderbar; Lernwerte Montageminuten je Kategorie (Ist-Minuten nach Richtwert-Planminuten verteilt) → Button „in Montage-Richtwerte übernehmen“ (protokolliert). Druckformat **PH Projekt Nachkalkulation** (A4, Abschlussbesprechung). | test_kalkulation_v2.TestAbschluss, test_ph_projekt_nachkalkulation (5) |

Offen/Annahmen: Kostensätze, Ziel-DB, Gemeinkosten → 90-inhaber-fragen.md Nr. 29–36; Netto/Brutto-Fragen (nicht abziehbare Vorsteuer, Kassa brutto) → 91-steuerberater-fragen.md Nr. 30–32. ph_personal-Zeiterfassung (`PH Zeiterfassung.projekt`) wird nicht zusätzlich bewertet (PH Projektzeit ist die Projektquelle, sonst doppelt). Kassa-Barausgaben haben kein Projektfeld; Bezug über die Projektnummer im Grund.

Prüfung: `check.py --streng` und `contracts.py` ohne Befund in ph_projekte/ph_faktura (verbleibende Fehler nur ph_ablage, andere Baustelle); Unit-Tests ph_projekte 88 (1 skip), ph_faktura 67 grün; Site-Tests geschrieben, ohne Bench nicht ausgeführt.
