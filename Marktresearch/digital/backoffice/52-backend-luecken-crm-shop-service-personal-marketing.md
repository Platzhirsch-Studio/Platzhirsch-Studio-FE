# 52 – Backend-Lücken CRM, Shop, Service, Personal, Marketing, Kundenkarte

Stand 04.11.2026 · Inhaber-Mandat Nr. 50 · Schreibbereich: `Backend-Import/ph_{crm,shop,service,personal,marketing,kundenkarte}/` · kein Commit, keine echten Zahlungen oder Mails.

Prüfstand nach Lauf 1: `check.py --streng` meldet nur die 2 erwarteten Fehler (neue Serien PH-DSA, PH-KRANK); `contracts.py` meldet 0 Fehler. Unit-Tests ohne Site: CRM 8→27, Shop 20→38, Service 15→33, Personal 16→57, Marketing 17→36, Kundenkarte 22→40 (gesamt 98→231, alle grün). Site-Tests (FrappeTestCase) sind geschrieben, aber nicht ausgeführt (keine Bench-Site).

**Prüfstand nach Lauf 2 (Endstand):** `check.py --streng` OK, keine Fehler (PH-DSA und PH-KRANK sind inzwischen in ph_core eingetragen). `contracts.py` 0 Fehler, 37 Warnungen. Unit-Tests: CRM 32, Shop 40, Service 35, Personal 67, Marketing 37, Kundenkarte 40, gesamt 251 (anfangs 98), alle grün. Lauf 2 (Nachtrag aus `32-marktfunktionen-nachtrag.md` und Bedarf aus dem Kassa/Faktura-Lauf) ist abgeschlossen, s. Abschnitt 8.

## Hook-Vertrag Kundenakte (definiert in ph_crm, README)
- `ph_kontakt_zeitleiste`
- `ph_kontakt_zeitleiste_ersetzt`
- `ph_kontakt_datenauskunft`
- `ph_kontakt_anonymisieren`: Plan je Vorgang (anonymisieren/aufbewahren/loeschen), BAO § 132: 7 Jahre ab Jahresende
- `ph_kontakt_zusammengefuehrt`: nach `rename_doc(merge=True)`

Anbieter sind registriert in ph_shop, ph_service, ph_marketing und ph_kundenkarte. ph_personal bewusst nicht (kein Kontakt-Bezug). Fremde Apps (kassa/faktura/projekte/logistik) werden generisch über Link-Felder auf PH Kontakt erfasst (`frappe.db.exists("DocType")`).

## 1. CRM
| Lücke | Entscheidung | umgesetzt in | Test |
|---|---|---|---|
| Dublettenprüfung (E-Mail, Telefon normalisiert, Name+PLZ, Firma) | Bauen | `utils/dubletten.py`, `ph_crm/dubletten.py`, `telefon_norm`, Report PH Kontakt Dubletten | test_crm_logik; test_ph_kontakt |
| Kontakte zusammenführen | Bauen (Feldübernahme, rename_doc merge, Hook) | `PH Kontakt.zusammenfuehren`, `api.merge_kontakte` | test_feld_uebernahme, test_zusammenfuehren_biegt_vorgaenge_um |
| Firma + Personen, Rollen Architekt/Bauherr/Hotelier | Bauen | `firma_kontakt`, `funktion`, Kindtabelle PH Kontakt Rolle | test_firma_und_personen |
| Zeitleiste über alle Apps | Bauen | `kontakt360.zeitleiste`, `utils/zeitleiste.py`, `api.get_zeitleiste` | TestZeitleiste |
| Kundenakte-Aggregat | Bauen | `kontakt360.kundenakte`, `api.get_kundenakte` | test_firma_und_personen |
| Letzter Kontakt berechnet | Bauen | `letzter_kontakt`, `letzter_kontakt_art` | util |
| E-Mail Ein-/Ausgang am Kontakt | Bauen | `ereignisse.kommunikation_an_kontakt`, `PH Kontakt.mail_senden` | – |
| Wiedervorlagen/Erinnerungen | Bauen | `tasks.py` (wiedervorlagen_faellig, ruhende_anfragen, termine_ohne_abschluss, vortagesuebersicht), `wiedervorlage_setzen` | test_ruhend_und_summe u. a. |
| Pipeline-Wert, Wahrscheinlichkeit | Bauen | `utils/pipeline.py`, `wert_cent`, `gewichtet_cent`, Report PH Pipeline | TestPipeline |
| gewonnen_am / verloren_am, Verlustgründe | Bauen | PH Anfrage `als_verloren`/`als_gewonnen`, Report PH Verlustgruende | test_verloren_mit_grund_und_gewonnen |
| Quellen-/Kampagnenzuordnung (UTM) | Bauen | `utm_aus_herkunft`, Report PH Anfragen nach Kampagne | test_utm |
| Terminserien | Bauen | `PH Termin.serie_anlegen/serie_stornieren` | test_serien, test_serie_mit_konflikt |
| termin_vorschlagen mit Slot-Prüfung | Bauen | PH Anfrage | – |
| Workflow-Rückwege | Bauen | `fixtures/workflow.json` | test_no_show_… |
| Workflow States/Actions | vorhanden (ph_core-Fixtures) | – | check.py |
| Beratungsprotokoll-Vorlagen je Raumtyp | Bauen (6 Standardvorlagen) | PH Beratungsvorlage, `vorlage_anwenden` | test_ph_beratungsvorlage |
| protokoll_senden, planung_beauftragen(planer) | Bauen | PH Beratungsgespraech | – |
| DSGVO-Auskunft/Export | Bauen | `dsgvo.auskunft/export`, `api.export_kontakt_daten` | test_auskunft_nur_mit_identitaet |
| DSGVO Löschen/Anonymisieren, BAO 7 Jahre | Bauen | `utils/aufbewahrung.py`, PH Datenschutzanfrage, `tasks.dsgvo_fristen` | TestAufbewahrung, test_ph_datenschutzanfrage |
| Kontakt-Etikett 99×38 mm | Bauen | Print Format PH Kontakt Etikett | check.py |
| Meet-Verbindungstest, Website-Mail nach Umbuchung | Bauen | PH Termin Einstellungen, PH Termin.umbuchen | – |
| Zeilenrechte Report Termine je Berater | bewusst nicht (Query-Report); im Report PH Pipeline gebaut | – | – |
| Schnellanlage Kontakt für Kassa | Bauen | `api.create_kontakt` (Dublettenschutz) | test_create_kontakt_erkennt_dublette |

## 2. Shop
| Lücke | Entscheidung | umgesetzt in | Test |
|---|---|---|---|
| Teilstorno (unbezahlt) | Bauen | `PH Bestellung.positionen_stornieren` | Site + Unit |
| Teilerstattung je Position, USt je Satz, höchstens bezahlter Betrag | Bauen | `teilerstatten`, `erstattung_vorschau`, `teilerstattung.py`, Kindtabelle PH Bestellung Erstattung | 10 Unit |
| Erstattung über mehrere Zahlungen (Gutschein zuletzt) | Bauen | `_geld_zurueck`, `stornieren` | test_verteilung_gutschein_zuletzt |
| Teilzahlung addiert statt überschrieben | Bauen (Fehlerbehebung) | `zahlung_erfassen`, `offen_cent` | test_status_und_zahlungsstand |
| Ersatzlieferung 0 € | Bauen | `ersatzlieferung_anlegen` | test_ersatz_zeilen |
| Telefonbestellung mit Zahlungslink | Bauen (Stripe simuliert) | `api.backoffice.create_phone_order`, `zahlungslink_erstellen/_senden` | Site |
| Bestellnotizen intern/Kunde | Bauen (`notiz_kunde`); intern war vorhanden | JSON | Site |
| Gutschein Restwert, Teil-Einlösung | vorhanden (`PHGutschein.einloesen`, `rest_cent`) | – | bestehend |
| Gutschein-Sperre mit Katalog, Entsperren durch Leitung | Bauen | `sperren`, `entsperren`, `SPERRGRUENDE` | test_sperrgruende |
| Gutschein-Ausdruck mit QR | Bauen | Print Format PH Gutschein | – |
| Verkauf im Showroom (Kassa) | Bauen | `gutschein.ausstellen_verkauf`, `verkauf_stornieren`, API `sell_voucher`, `cancel_voucher_sale` | Site |
| gutschein_pruefen liefert art + steuersatz | Bauen | `gutschein.pruefen`, API `check_voucher` | test_steuer_mehrzweck_einzweck |
| storniere_einloesung whitelisted | Bauen | API `cancel_voucher_redemption` | – |
| Stripe Radar (nur Anzeige) | Bauen | `stripe_webhook._radar`, `radar.py`, `radar_geprueft` | test_radar |
| Zahlungsstreit | Bauen (Felder `dispute_*`) | `stripe_webhook._dispute` | Site |
| Abholung zurücknehmen, Fehler beim Abholcode mit „L“, Versandmail, automatischer Abschluss | Bauen | PH Bestellung, `gutschein_code`, `tasks.automatisch_abschliessen` | Unit |
| Kundenakte-Hooks | Bauen | `ph_shop/kontakt.py`, `aufbewahrung.py` | test_aufbewahrung |
| Retourenlabel | bewusst nicht (ph_logistik) | – | – |
| Mail-Zustellstatus, Audit-CSV | bewusst nicht (Communication bzw. ph_core) | – | – |

## 3. Service
| Lücke | Entscheidung | umgesetzt in | Test |
|---|---|---|---|
| Gewährleistung/Garantie aus Lieferdatum (§ 933/924 ABGB, Feld `sachart`) | Bauen | `fristen.py`, PH Servicefall `_bezug_uebernehmen`/`_fristen_berechnen` | test_sla; Site |
| Fotos/Video vom Kunden (Portal) | Bauen (Prüfung am Dateikopf, privat gespeichert) | `utils/medien.py`, `api` | TestMedien |
| Herstellerreklamation, Regress, Gutschrift-Abgleich | Abgleich gebaut, Regress vorhanden | `utils/regress.py`, `gutschrift_erfassen`, `differenz_ausbuchen` | TestRegressKulanz |
| Kulanzentscheid mit Freigabe | Bauen | `utils/kulanz.py`, `kulanz_freigeben/ablehnen/anfordern` | test_kulanz |
| Ersatzteilbestellung/-eingang | ausgebaut (Teil-/Volleingang, Überfälligkeit) | PH Ersatzteilbestellung `wareneingang`, `tasks.ersatzteile_ueberfaellig`, Report Mindestbestand | Site |
| Einsatzbericht mit Unterschrift und Zeiten | ausgebaut | `utils/einsatz.py`, PH Serviceeinsatz, Druck PH Servicebericht | TestEinsatz |
| Wartungsvertrag, automatische Termine | PH Pflege Abo erweitert | `pflege_logik.py`, `tasks.wartungseinsaetze_erzeugen` | TestWartungsplanung |
| SLA-Fristen und Eskalation | Bauen | `utils/sla.py`, `tasks.sla_pruefen`, Report PH SLA Erfuellung | test_sla |
| Erstreaktion, Fehlerkatalog-Fallback, Akte/nächste Schritte, Techniker-Slots | Bauen | PH Servicefall, `api` | TestSchritte; Site |
| Kundenakte-Hooks | Bauen | `kontakt_daten.py`, `utils/aufbewahrung.py` | TestAufbewahrung |
| Mail-Zustellstatus; Angebot aus Pflegevertrag; Bericht en/fr/it | bewusst nicht (ph_core / ph_faktura / Inhaber-Entscheid Nr. 14) | – | – |

## 4. Personal
| Lücke | Entscheidung | umgesetzt in | Test |
|---|---|---|---|
| Urlaubsanspruch nach UrlG (Arbeits-/Werktage, Teilzeit, Vordienstzeiten) | Bauen | `utils/urlaub.py`, PH Urlaubsanspruch, `urlaubskonto.py` | test_urlaub |
| Aliquotierung, Ersatzleistung § 10, Verjährung § 4 Abs 5 | Bauen | `urlaub.*` | test_urlaub |
| Zeitausgleich/Überstunden, Mehrarbeit | Bauen | `utils/arbeitszeit.py`, `zeitkonto.py`, PH Zeitabschluss | TestUeberstunden |
| Krankmeldung (ohne Diagnose, AU-Bestätigung privat) | Bauen (eigene DocType, Art. 9 DSGVO) | PH Krankmeldung, Patch v0_2 | test_ph_krankmeldung |
| Dienstplan/Schichten, Mindestbesetzung, Ruhezeit 11 h | Bauen | PH Dienstplan, PH Schicht, `utils/dienstplan.py`, Druck PH Dienstplan Woche | TestDienstplan |
| Bewerber-Löschfrist 6 Monate ab Absage (GlBG) | Bauen | `utils/datenschutz.py`, `absage_dokumentieren`, Löschlauf erweitert | TestDatenschutz |
| Onboarding-/Offboarding-Checkliste | Bauen | PH Onboarding Vorlage, PH Mitarbeiter Checkliste | test_ph_onboarding_vorlage |
| Dokumente (Dienstvertrag) privat | Bauen | PH Mitarbeiter Dokument, permlevel 1 | – |
| Austritt, Workflow-Rückwege, Selbstservice, Lohnvorbereitung, Beschäftigtendaten löschen | Bauen | PH Mitarbeiter, tasks, Report PH Lohnvorbereitung | test_ph_abwesenheit |
| Kontakt-Hooks | bewusst nicht (kein PH-Kontakt-Bezug); eigene `api.datenauskunft` | – | – |
| Zusagevorlage, strukturierte Bewertung | offen (Konzeptarbeit) | – | – |

## 5. Marketing
| Lücke | Entscheidung | umgesetzt in | Test |
|---|---|---|---|
| Segment-Builder mit Einwilligungsprüfung | Bauen | PH Segment (+ Regel), `utils/segment.py`, `segmente.py` | TestSegment |
| Versandprotokoll, Bounces, Beschwerde | Bauen | PH Mail Ereignis, `mail_ereignisse.py`, Report PH Newsletter Zustellung | TestMailEreignis |
| Resend-Webhook mit Signatur | Bauen (aus, bis der Schalter gesetzt ist) | `api/webhook.py` | test_signatur |
| List-Unsubscribe One-Click (RFC 8058) | Bauen (Weg über Resend) | `versand.abmelde_kopfzeilen`, `api.unsubscribe_one_click` | test_list_unsubscribe |
| Status „geöffnet“ | bewusst nicht (kein Tracking-Pixel) | – | test_abbilden |
| Event-Einladung, Kontingent, Warteliste | Bauen | PH Event Einladung, `eventlogik.nachruecker` | test_nachruecken_fifo_ohne_blockade |
| Check-in per QR | Bauen | `utils/token.signieren`, `checkin.py`, Druck PH Event Ticket | test_checkin_code |
| Kampagnen-ROI aus UTM (First/Last/Linear) | Bauen | `utils/attribution.py`, PH Kampagne Kontaktpunkt, Report Kampagnen-ROI | TestAttribution |
| CSV-Import Kennzahlen, Testmail, Backoffice-Stapelaktionen | Bauen | `kennzahlen_csv.py`, `api/backoffice.py` | TestKennzahlenCsv |
| Kosten aus Eingangsrechnungen | bewusst nicht (ph_faktura) | – | – |
| Kundenakte-Hooks | Bauen (Widerruf hat Vorrang) | `kontakt_hooks.py`, `utils/datenschutz.py` | TestDatenschutz |

## 6. Kundenkarte
| Lücke | Entscheidung | umgesetzt in | Test |
|---|---|---|---|
| Kassa-Scan lookup/redeem | vorhanden, erweitert (Codes `card_*`, Weiterleitung) | `api/__init__.py`, `utils/kartenregeln.py` | TestKassa |
| Normalisierung `kk 7k3qx9` | vorhanden | `utils/karte.normalisiere_kartennummer` | bestehend |
| Storno der Einlösung bei Kassenstorno | Bauen | `ereignisse.py`, `lebenszyklus.py`, API `cancel_redemption` | Site |
| Karten zusammenführen | Bauen | `lebenszyklus.zusammenfuehren`, CRM-Hook | 6 Unit, 2 Site |
| Karte übertragen | Bauen (neue Nummer, nur Leitung) | `lebenszyklus.uebertragen` | Unit, Site |
| Sperrgrund-Katalog | Bauen (Select mit 9 Gründen, steuert die Logik) | `kartenregeln.SPERRGRUENDE` | 4 Unit |
| Ersatzkarte bei Verlust | Bauen | `lebenszyklus`, `kette.py` | Unit |
| Antrag: Nachweis-Datei, Telefon durchsuchbar, Anlegerecht Kassa, Aktivierung bei Übergabe | Bauen | Antrag, API `hand_over_card` | Site |
| Erinnerungen (> 7 Tage beantragt, ungenutzter Pflege-Vorteil im Dezember) | Bauen | `tasks.py` | – |
| DOI-Mail erneut senden, Pass-Download | bewusst nicht (Website/Portal) | – | – |

## 7. Neue Nummernkreise (in ph_core eingetragen)
| DocType | Serie |
|---|---|
| PH Datenschutzanfrage (ph_crm) | `PH-DSA-.YYYY.-.#####` |
| PH Krankmeldung (ph_personal) | `PH-KRANK-.YYYY.-.#####` |

Alle übrigen neuen DocTypes sind Kindtabellen oder nutzen `field:`/`format:` (PH Urlaubsanspruch `UA-{mitarbeiter}-{urlaubsjahr_von}`, PH Zeitabschluss `ZAB-{mitarbeiter}-{periode}`, PH Dienstplan `DP-{kennung}`) bzw. `hash`.

## 8. Lauf 2 (abgeschlossen): Nachtrag 32 und Bedarf aus Kassa/Faktura
- **ph_crm (fertig, Unit-Tests 27→32, contracts 0 Fehler):**
  - Kundenakte liefert `kanaele` (Showroom/Shop/Objekt) mit Käufen, Rechnungen, Planungen und Reklamationen; `kontakt360.kaufhistorie`, `utils/kanaele.py`.
  - Fehler korrigiert: Die Umsatzsumme lief auf `gesamt_cent`, richtig ist `brutto_cent`.
  - Adressarten Baustelle und Montage ergänzt.
  - Neues Feld `PH Anfrage.phase` (Erstberatung → Aufmass → Planung → Angebot → Kaufvertrag) mit Pflichtfeldern je Phase und Standard-Wahrscheinlichkeit 20/35/50/60/100 %.
  - Beim Anonymisieren wird `ph_kassa.dienste.kontakt_anonymisieren` aufgerufen, nur wenn ph_kassa installiert ist; das Ergebnis steht als eigene Zeile im Plan.
  - Löschfrist für Interessenten: Die Logik ist gebaut, aber nicht eingebunden; sie wartet auf die Inhaber-Entscheidung zur Frist.
  - Google-Kalender-Sync bewusst nicht gebaut: Frappe-Standardintegration, nur Konfiguration.
- **ph_shop (fertig, Unit-Tests 38→40, contracts 0 Fehler):**
  - Einzweck-Gutschein: Pflichtsatz `ust_satz_promille`, kein stiller Standard mehr.
  - Neue Art „Rabatt“: mindert das Entgelt, ist kein Zahlungsmittel.
  - `ausstellen(idempotency_key)` ist auf allen Wegen idempotent.
  - Terminal-Erstattung (nur Buchung, kein Netzaufruf): `ph_shop.zahlung.erstattung_erfassen(*, payment_intent, betrag_cent, grund, stripe_refund, idempotency_key=None, von=None, quelle="kassa", stripe_ereignis=None)`, idempotent über `stripe_refund`.
  - Hinweise für ph_kassa:
    - Bei `mindert_entgelt` eine Rabattposition anlegen, keine Gutschein-Zahlung.
    - Alte Einzweck-Gutscheine ohne Satz brechen ab, bis der Satz nachgetragen ist.
- **ph_service (fertig, Unit-Tests 33→35):**

  | Lücke | Entscheidung | umgesetzt in | Test |
  |---|---|---|---|
  | Reklamationskosten an Hersteller weiterbelasten | Bauen | Kindtabelle PH Lieferantenregress Kosten, `kosten_uebernehmen`, `belastung_senden`, Druck „PH Lieferantenregress Belastungsanzeige“ (erbt ph_basis.html) | test_logik_service (Regress) |
  | Abgleich mit Hersteller-Gutschrift, Anmahnung | Bauen (Mahnstufe bis `regress_max_mahnstufe`) | `mahnen`, `erinnern`, `gutschrift_erfassen`, `_abgleichen`, tasks | TestRegressKulanz |
  | Rücksendung mit Abholaufforderung (S12) | Bauen | `abholung_anfordern`, `abholung_bestaetigen`, Felder `abholung_*`/`ruecksendung_*` | – |
  | SLA-Pause „wartet auf Hersteller/Ersatzteil/Kunde“ | Bauen (Lösungsfrist um pausierte Werktage verschoben) | `utils/sla.pause_werktage`/`frist_verschieben`, `PH Servicefall.sla_pausieren`/`sla_fortsetzen` | test_sla |
  | E-Nummer und Seriennummer | Bauen | Felder `e_nummer` und `fd_nummer` am Servicefall (Seriennummer aus dem Produktpass) | – |
  | Reklamationsstatistik je Lieferant | vorhanden (Report „PH Reklamationsquote je Marke“ mit Gruppierung nach Lieferant, Report „PH Regressstatus“) | – | – |

  Offen beim Service:
  - **Steuer:** Ist die Weiterbelastung an den Hersteller Schadenersatz (nicht steuerbar) oder Entgelt? Die Belastungsanzeige weist die Beträge vorerst ohne USt aus, mit Hinweis.
  - **Bedarf ph_projekte:** `e_nummer` und `fd_nummer` auch am PH Produktpass, damit sie beim Anlegen eines Servicefalls übernommen werden.

- **ph_personal (fertig, Unit-Tests 57→67, contracts 0 Fehler):**

  | Lücke | Entscheidung | umgesetzt in | Test |
  |---|---|---|---|
  | GlBG § 9 Abs 2: Gehaltsangabe als Pflicht | Bauen: Status „Aktiv“ und Website-API nur mit vollständiger Angabe (KV-Mindestentgelt, Zeitraum, KV, Überzahlung) | `utils/glbg.py`, `PH Stelle._veroeffentlichung_pruefen`, `api` (Filter `entgelt_vollstaendig`) | test_azg_glbg |
  | AZG/ARG-Prüfung | Bauen: Tageshöchstarbeitszeit, Wochenhöchstarbeitszeit, Schnitt über 17 Wochen, Pause, Ruhezeit 11 h, Wochenruhe; Warnung ohne Sperre, protokolliert an Zeiterfassung und Monatsabschluss | `utils/azg.py`, `zeitkonto.azg_befunde`, PH Zeiterfassung `azg_*`, PH Zeitabschluss | test_azg_glbg |
  | Buchung auf Projekt/Auftrag | Bauen: Dynamic Link `projekt_doctype`/`projekt` (PH Projekt, PH Auftragsbestaetigung, PH Serviceauftrag) plus `taetigkeit`, ohne `required_apps`-Verletzung; `api.stempeln` nimmt beides an | PH Zeiterfassung, Report PH Projektstunden | – |
  | § 26 Abs 8 AZG monatliche Übermittlung | vorhanden (`api.zeitnachweis_pdf`); neu ist der Nachweis der Übermittlung | `PH Zeitabschluss.zeitnachweis_uebermittelt` | – |

  Bedarf an die Website: `src/lib/karriere/stellen.js` und `texte.js` kennen nur Monat und Jahr. Eine Stelle mit Zeitraum „Stunde“ blendet die Website deshalb aus, bis „Stunde“ und `salary_unit` HOUR ergänzt sind.
- **ph_kundenkarte (fertig, Unit-Tests 40, contracts 0 Fehler):**
  - `lookup_card`, `redeem_benefit`, `cancel_redemption` und `hand_over_card` laufen über `ph_api(intern=True)`: Eine Desk-Sitzung genügt, Gäste bekommen 403, der Schalter `api_aktiv` sperrt die Kassa nicht mehr. Erlaubte Rollen: Kassa, Logistik und Kundenkarte (jeweils Mitarbeiter/Leitung).
  - Direkt aus Python über `ph_kundenkarte.ph_kundenkarte.kassa` (kein commit, Fehler als `ApiFehler`):
    - `karte_pruefen(kartennummer)`
    - `einloesen(kartennummer, vorteil, bezug_doctype, bezug, kommentar, ort)`
    - `einloesung_zuruecknehmen(...)`
    - `karte_uebergeben(...)`
  - **Bedarf ph_kassa:** `_kundenkarte_buchen` und die Code-Erkennung in `page/ph_kassa/ph_kassa.py` auf diese Funktionen umstellen. Heute rufen sie die dekorierten Methoden auf, mit diesen Folgen:
    - commit bzw. rollback mitten im Kassen-Request
    - Fehler als Rückgabe-dict statt als Ausnahme
    - der gesetzte HTTP-Status bleibt in der Antwort stehen
- **ph_marketing (fertig, Unit-Tests 36→37, contracts 0 Fehler):**
  - A14: Katalog mit 10 Löschfristen-Kategorien (`utils/datenschutz.LOESCHFRISTEN`), täglicher Lauf 03:45, Report „PH Marketing Löschfristen“.
  - Die doppelten Felder `ph_marketing_utm_*` sind entfernt; Patch `v0_2/utm_felder_entfernen` übernimmt die Werte in die ph_crm-Felder. Die Attribution liest jetzt die ph_crm-Felder samt `klick_id`.
  - `kundenkarte_auswertung`: Zwecktext ergänzt. Stufe und Umsatz der Kundenkarte gehen nur mit `einwilligung_auswertung` in Segmente ein.
  - Offene Frage: Fristdauern von der Kanzlei bestätigen lassen (Abo beendet 3 Jahre, Kontaktpunkt 25 Monate).

## 9. Offene Fragen Recht/Steuer (Auswahl)
- **Aufbewahrung und Datenschutz:**
  - Umfang „Geschäftspapiere“ nach BAO § 132
  - Nachweisfrist für Datenschutzanfragen und Einwilligungen (angesetzt 3 Jahre)
  - Löschfrist für Interessenten ohne Kauf
- **Gutscheine und Umsatzsteuer:**
  - Mehrzweck-Gutschein an der Kassa (Satz Null, § 4 Abs 3a UStG); Steuersatz beim Einzweck-Gutschein
  - Aufteilung von Kulanz je Steuersatz (§ 16 UStG)
  - USt bei Kundenkarten-Vorteilen
- **Fernabsatz (FAGG):**
  - Versandkosten bei Teilwiderruf (§ 15 FAGG)
  - Rückerstattung auf den Gutschein (§ 14 Abs 3 FAGG)
  - Informationspflichten bei Telefonbestellung
- **Service:**
  - Einbauküche beweglich oder unbeweglich (§ 933 ABGB)
  - Abnahme ohne gezeichnete Unterschrift
- **Personal:**
  - Urlaubsjahr als Arbeits- oder Kalenderjahr
  - KV Handel: Stunden zwischen 38,5 und 40 h
  - Gleitzeit (§ 4b AZG)
  - Zustimmung zur Zeiterfassung (ArbVG § 96a)
- **Marketing:**
  - Bestandskunden-Ausnahme nach TKG § 174
  - Ob eine Beschwerde alle Werbezwecke widerruft
- **Kundenkarte:** Sperrgrund „Verstorben“

## 10. Integration Runde 3 (04.11.2026, ph_kassa · ph_faktura · ph_projekte · ph_logistik)

Signaturen der Gegenseite im Code nachgesehen (ph_shop `gutschein.py`/`zahlung.py`/`PHBestellung._gutschrift_anstossen`, ph_kundenkarte `ph_kundenkarte/kassa.py`, ph_crm `api/kontakt.create_kontakt` + `dubletten.kandidaten`, ph_service PH Lieferantenregress/PH Pflege Abo/PH Servicefall). In den Gegen-Apps wurde nichts geändert.

| Bedarf (Quelle) | umgesetzt in | Test |
|---|---|---|
| Kundenkarte direkt statt dekorierter API (Abschnitt 8, ph_kundenkarte) | ph_kassa `page/ph_kassa.py`: `_kundenkarte_buchen` → `kassa.einloesen`, `code_erkennen` → `karte_pruefen`, `kundenkarte_uebergeben` → `karte_uebergeben`; `ApiFehler` → Kassa-Fehlerform mit `card_*`-Codes (`logik/integration.karten_fehler`) | ph_kassa test_integration.TestKartenFehler; Site test_integration_runde3 |
| Storno mit Einlösungen | ph_kassa `storno` → `einloesung_zuruecknehmen(bezug=Original)` (idempotent neben doc_event) | Site |
| Gutschein-Verkauf/-Storno über ph_shop (Abschnitt 2) | ph_kassa PH Kassenbeleg: `ausstellen_verkauf`, `verkauf_stornieren`, `storniere_einloesung` | Site test_gutschein_verkauf_und_storno_sperrt |
| Rabattgutschein `mindert_entgelt` (Abschnitt 8, ph_shop) | ph_kassa Positionsart „Rabatt“, negativ, je Steuersatz der Ware (`logik/integration.rabatt_aufteilen`, `gutscheine_umstellen`) | ph_kassa test_integration (7); Site test_rabattgutschein_mindert_entgelt |
| Einzweck ohne Satz → klare Meldung | ph_kassa `schnittstellen.gutschein_pruefen`, `page._gutscheine_nach_art` | test_integration; Site |
| Terminal-Erstattung `erstattung_erfassen` (Abschnitt 8) | ph_kassa `PH Kassenbeleg._erstattung_buchen` | Site (Mock) |
| Schnellanlage Kontakt mit Dublettenschutz (Abschnitt 1) | ph_kassa `dienste.kunde_anlegen` → `ph_crm.api.create_kontakt` bzw. `dubletten.kandidaten` | Site test_rechnungsempfaenger_dublettenschutz |
| Ausstellungsstück an der Kassa (51-…, Logistik) | ph_kassa `page.ausstellungsstueck`, `PH Kassenbeleg._ausstellungsstuecke_buchen`; ph_logistik Lagerbestand-Button → Kassa | ph_kassa test_integration.TestAusstellungsstueck; Site |
| Hook `ph_shop_gutschrift_erstellen` (Abschnitt 2) | ph_faktura `hooks.py`, `api.gutschrift_aus_bestellung` → `ph_faktura/integration.gutschrift_aus_bestellung` | ph_faktura test_integration.TestShopErstattung; Site |
| Gutschrift aus `PH Warenruecknahme.gutschrift_hinweis` | ph_faktura `api.create_credit_note_from_return`; ph_logistik Button „Gutschrift erstellen“ | test_integration.TestWarenruecknahme |
| Feldnamen Kundenakte `gesamt_cent`/`offen_cent` | ph_faktura README: Mapping `brutto_cent`/`zahlbar_cent`/`offen_cent` (kein `gesamt_cent`) | – |
| Planer an PH Projekt | ph_projekte JSON/Controller/Liste/Kanban | test_portal_sitzung.TestSeiteUndPlaner; Site |
| Retourenlabel (Abschnitt 2: „bewusst nicht (ph_logistik)“) | ph_logistik `letmeship/retoure.py`, `dienst.retourenlabel_erzeugen`, Lieferschein/Warenrücknahme „Retourenetikett“ | ph_logistik test_retoure_logik (10); Site test_retourenlabel |
| E-Nummer/FD am Produktpass (ph_service, Geräte Nr. 56) | ph_projekte PH Produktpass `e_nummer`/`fd_nummer`, `pass_anlegen`, Portal | Site |
| Angebot aus Pflegevertrag (Abschnitt 3: „bewusst nicht (ph_faktura)“) | ph_faktura `api.create_quote_from_care_contract`, Button per `doctype_js` | test_integration.TestPflegeAngebot; Site |
| Lieferanten-Gutschrift ↔ Lieferantenregress (ph_service Regress) | ph_faktura PH Eingangsrechnung `belegart`, `lieferantenregress`, Freigabe → `gutschrift_erfassen` (netto); Export/UVA mit Vorzeichen | test_integration.TestLieferantenGutschrift; Site |
| Ausbuchung Regress-Differenz als Buchung/Export | ph_faktura doc_event → Journal „Ausbuchung“ → Export-Zeile | test_integration; Site |
| Portal: mehrere Tokens, Logout eigene Sitzung, Teamliste Tagebuch (60-…, ph_projekte 1/2) | ph_projekte PH Portal Sitzung, `portal_logout`, `tagebuch_list_alle` | test_portal_sitzung; Site test_ph_portal_sitzung |
| Portal-PDF ApiFehler statt 500 (60-…, ph_faktura 1/2) | ph_faktura `portal_document_pdf`, `_kunde_pruefen` vereinheitlicht | Site |

Prüfung: `check.py --streng` → OK (keine Fehler); `contracts.py` → 0 Fehler, 40 Warnungen. Unit-Tests ohne Site: ph_kassa 75→92, ph_faktura 45→59, ph_projekte 63→70, ph_logistik 71→79 – grün. Site-Tests geschrieben, ohne Bench nicht ausgeführt.

Offen: ph_core `portal_kontakt_pruefen` kennt nur `PH Kontakt.portal_token_hash` – ph_service/ph_kundenkarte akzeptieren dadurch nur die jüngste aktive Portal-Sitzung (Anfrage an ph_core: Hook auf PH Portal Sitzung). Konto Regress-Ausbuchung (7800) und Steuerbehandlung (Schadenersatz ohne USt) mit der Kanzlei abstimmen.
