# Platzhirsch Faktura (`ph_faktura`) – WP6

Angebot → Auftragsbestätigung (Kaufvertrag mit Zahlungsplan) → Anzahlungsrechnung → Teil-/Schlussrechnung mit Anzahlungsverrechnung → Zahlungseingang (PH Zahlung, Bank CAMT.053) → Mahnung → Export Steuerberater (BMD/DATEV) · Eingangsrechnungen mit Freigabe · UVA-Zuarbeit. Vorbild SHD marahrw7 (`../referenz/`). Firma: MW Immobilienverwaltungs GmbH, FN 443753 d (LG Feldkirch), UID ATU70035339, Landstraße 11, 6911 Lochau – Stammdaten in **PH Firma** (ph_core), nicht hier.

**Keine Finanzbuchhaltung**: kein Hauptbuch, Konten nur als Zuordnung für den Export. Beträge immer **Cent (Int)**, Steuersätze als Int ×100 (`ust_satz_promille` 2000 = 20 %), Rabatte in Promille (`rabatt_promille` 100 = 10 %).

## DocTypes (23)

| DocType | Serie | Zweck |
|---|---|---|
| **PH Beleg Position** (Kind, gemeinsam) | – | Positionen für Angebot/AB/Rechnung/Gutschrift/Eingangsrechnung: Produkt (ph_sortiment) oder Freitext, Art (Produkt/Leistung/Planungsleistung/Text/Zwischensumme/Rabatt), Alternativ-Flag, Menge, Einzelpreis, Rabatt ‰, USt-Satz, Liefer-/Rechnungsmenge, Einkaufspreis (permlevel 1). ph_kassa nutzt eine eigene. |
| PH Beleg Steuer, PH Zahlungsplan, PH Rechnung Anzahlung, PH Rechnung Zahlung, PH Bankumsatz Zuordnung, PH Export Protokoll, PH UVA Zeile (Kind) | – | USt-Aufteilung, Zahlungsplan, verrechnete Anzahlungen, OP-Verlauf, Bankzuordnung, Übergabeprotokoll, UVA-Zeilen |
| **PH Angebot** | `AN-.YYYY.-.#####` | Gültigkeit, Alternativpositionen, Rabatte, Planungsleistung, Zahlungsbedingung, Versionen, Vertragsort/FAGG |
| **PH Auftragsbestaetigung** | `AB-.YYYY.-.#####` | Kaufvertrag: Zahlungsplan (Anzahlung % / Teilzahlung bei Lieferung / Rest nach Montage), Liefertermin, Projekt, Stand (Anzahlung Soll/Ist, geliefert, abgerechnet, bezahlt, offen) |
| **PH Rechnung** (submittable) | Entwurf `ENTW-{YYYY}-{#####}` → beim Stellen `RE-.YYYY.-.#####` | Rechnung / Anzahlungsrechnung / Teilrechnung / Schlussrechnung / Barverkauf; § 11 UStG Pflichtangaben, USt-Fall AT/OSS/igL/RC/Ausfuhr, Kleinbetrag ≤ 400 €, EPC-QR, OP je Rechnung, USt-Fälligkeit (Anzahlung: Ist), Mahnstufe, Export-Sperre |
| **PH Gutschrift** (submittable) | `ENTW-GU-…` → `GU-.YYYY.-.#####` | Storno/Teilgutschrift/Wertminderung/Kulanz mit Bezug; Storno setzt Rechnung auf „Storniert“ (kein Cancel) |
| **PH Mahnung** | `MA-.YYYY.-.#####` | Stufe 1–3, Gebühren, Verzugszinsen (§ 1000 ABGB / § 456 UGB), Texte aus Einstellungen |
| PH Zahlungsbedingung | field:titel | 40/50/10, 50/50, 100 %, 14 Tage netto (install.py) |
| PH Bankkonto, **PH Bankimport** (`BI-`), **PH Bankumsatz** (`BU-`) | | CAMT.053-Import (ISO 20022, Doppelimport-Schutz über Bankreferenz), Zuordnungsvorschlag (Referenz 100 / Betrag+Name 80 / Betrag 60 / Teilbetrag 40), Auto-Zuordnung bei 100 |
| **PH Eingangsrechnung** | `ER-.YYYY.-.#####` | Erfasst → Sachlich geprüft → Freigegeben (Leitung) → Bezahlt; Vorsteuer AT / Reverse Charge EU / igE / Einfuhr; Skonto; Zahllauf-Vormerkung; Herstellerbestellung/Projekt/AB |
| **PH Export Lauf** | `EX-.YYYY.-.####` | BMD CSV / DATEV Buchungsstapel (EXTF 700) / CSV generisch; Übergabeprotokoll je Beleg mit Prüfsumme; sperrt Belege (`export_status`) |
| **PH UVA Auswertung** | `UVA-.YYYY.-.###` | KZ 000/011/017/021/022/029/006/070/072/057/060/065/066, Anzahlungen (Ist), OSS je Land/Satz, Belegliste |
| PH Buchungsjournal | hash, `in_create` | Unveränderliche Zeile je Vorgang (Gestellt, Storniert, Zahlung, Gutschrift, Mahnung, Export, Eingangsrechnung, Anzahlung) mit verketteter SHA-256-Prüfsumme |
| PH Faktura Einstellungen, PH Mahnwesen Einstellungen (Single) | | Zahlungsziel, OSS, USt-Hinweistexte, Konten/Berater-/Mandantennummer, Textvorlagen; Mahnstufen, Fristen, Gebühren, Zinssätze |

## Belegfluss

1. **Angebot** (Button „Senden“ → PDF+Mail, Status Gesendet) → „Als AB übernehmen“ (Angebot Angenommen, AB mit Zahlungsplan aus Zahlungsbedingung) oder „Neue Version“ (Vorgänger Ersetzt).
2. **AB** → „Anzahlungsrechnung erstellen“ (automatisch bei Anlage, wenn `anzahlung_automatisch`): je Anzahlungszeile eine Rechnung mit einer Position je USt-Satz (`anzahlung.anzahlung_aufteilen`), Zahlungsplan-Zeile verknüpft.
3. **Rechnung stellen** (Button, primär): Pflichtangaben prüfen → Nummer aus `tabSeries` in derselben Transaktion (lückenlos) → Rename ENTW→RE → submit → Journal → PDF fixiert. Anzahlungsrechnung: `ust_faelligkeit` „nicht faellig“, wird mit erster Zahlung „faellig“ (UVA-Monat = Vereinnahmung).
4. **Zahlung**: „Zahlung erfassen“ (Dialog) bucht `PH Zahlung` über `ph_shop.zahlung.buche(...)` (Plan-Signatur unten; Fallback legt PH Zahlung direkt an) und schreibt OP (`PH Rechnung Zahlung`), Status Teilbezahlt/Bezahlt, AB-Stand. Zahlungen aus ph_shop/ph_kassa kommen über `doc_events PH Zahlung.on_submit` (Bezug `PH Rechnung`, Custom Field `ph_faktura_rechnung` oder Zahlungsreferenz = Rechnungsnummer).
5. **Teil-/Schlussrechnung** aus AB: Teilrechnung über gelieferte, nicht abgerechnete Mengen (Dialog), Anzahlung anteilig nach Wert; Schlussrechnung alle offenen Mengen, Anzahlungen offen ausgewiesen (netto + USt je Satz) und abgezogen (`anzahlung.verrechnen`). AB → Abgerechnet.
6. **Gutschrift**: Storno (alle Positionen + Gegenposition verrechneter Anzahlungen → Rechnung Storniert, Zahlungsplan zurückgesetzt), Teilgutschrift (Verrechnung mit OP oder „Erstatten“ → PH Zahlung Erstattung).
7. **Mahnung**: Button „Mahnen“ oder Mahnlauf (Scheduler Mo–Fr 06:30 wenn `automatisch`, sonst Button in PH Mahnwesen Einstellungen / Listenansicht „Mahnlauf (Vorschlag)“). Senden → Rechnung Gemahnt, Mahnstufe.
8. **Bank**: PH Bankimport (Datei anhängen → „Importieren“) → PH Bankumsatz mit Vorschlag → „Zuordnen“ (Rechnung, Eingangsrechnung, Gutschrift-Erstattung) → PH Zahlung + OP.
9. **Export**: PH Export Lauf „Erzeugen“ → Datei + Übergabeprotokoll (CSV und Druckformat), Belege gesperrt → „Als übergeben“ → „Von Kanzlei bestätigt“. Korrekturen nach Export nur per Gutschrift (Report PH Export-Abgleich).

## Buttons (Dokument-Methoden)

| DocType | Buttons |
|---|---|
| PH Angebot | Als PDF senden (`senden`), Als AB übernehmen (`auftrag_erstellen`), Annehmen, Ablehnen, Neue Version (`neue_version`), Anzahlungslink (`anzahlungslink` → PH Anzahlung ph_shop) |
| PH Auftragsbestaetigung | Anzahlungsrechnung erstellen, Teilrechnung erstellen (Mengen-Dialog), Schlussrechnung erstellen (`rechnung_erstellen`), Herstellerbestellungen erzeugen (ph_sortiment), Lieferschein erzeugen (ph_logistik, wenn installiert), Lieferung melden (`lieferung_melden`), Stornieren (Leitung), Als PDF senden |
| PH Rechnung | Rechnung stellen (`stellen`, primär), Anzahlungen verrechnen, Zahlung erfassen (`zahlung_erfassen`), Zahlungslink senden (`zahlungslink`), Mahnen (`mahnen`), Gutschrift (`gutschrift_erstellen`), Als uneinbringlich buchen, Kontoauszug Kunde (Druckformat auf PH Kontakt), Als PDF senden |
| PH Gutschrift | Gutschrift stellen, Erstatten (`erstatten`), Als PDF senden |
| PH Mahnung | Senden, Erledigt, Stornieren |
| PH Bankumsatz / PH Bankimport | Zuordnen (Dialog mit Vorschlägen), Ignorieren, Wieder öffnen / Importieren |
| PH Eingangsrechnung | Sachlich prüfen, Freigeben (Leitung), Ablehnen, Als bezahlt buchen, Zurück an Erfassung, Zahllauf-Vorschlag |
| PH Export Lauf | Erzeugen, Herunterladen, Übergabeprotokoll (PDF), Als übergeben markieren, Verwerfen, Von Kanzlei bestätigt |
| PH UVA Auswertung | Berechnen, An Steuerberater übergeben |
| Fremde Formulare (Client Script) | PH Bestellung „Rechnung erstellen“ (`ph_faktura.api.create_cash_invoice`), PH Projekt „Angebot erstellen“, PH Zahlung „Mit Rechnung verknüpfen“ |

## Workflows, Kanban, Druck, Auswertungen

- Workflows: PH Angebot (Entwurf → Gesendet → Angenommen/Abgelehnt/Abgelaufen, Ersetzt), PH Auftragsbestaetigung (Offen → In Bestellung → Teilgeliefert → Geliefert → Abgerechnet; Storniert Leitung), PH Rechnung (Entwurf → Gestellt [submit]; Teilbezahlt/Bezahlt/Ueberfaellig/Gemahnt setzt der Server; Uneinbringlich Leitung; Storniert nur via Gutschrift), PH Eingangsrechnung (Erfasst → Sachlich geprueft → Freigegeben [Leitung] → Bezahlt; Abgelehnt).
- Kanban: PH Angebote, PH Rechnungen, PH Eingangsrechnungen.
- Druckformate (alle `ph_basis.html`, Vorlagen in `templates/print/ph_faktura_*.html`): PH Angebot Standard, PH Auftragsbestaetigung Standard (Zahlungsplan, FAGG-Hinweis), PH Rechnung Standard / PH Rechnung Anzahlung (Pflichtangaben § 11 UStG, Anzahlungsausweis, EPC-QR GiroCode über `pyqrcode`/`qrcode`, Kleinbetragsvariante), PH Gutschrift Standard (§ 16 UStG), PH Mahnung Standard (Stufe 1–3), PH Kontoauszug Kunde (auf PH Kontakt), PH Export Uebergabeprotokoll.
- Reports (Script): PH Offene Posten (Altersstruktur, Chart), PH Anzahlungsstand, PH UVA Zuarbeit, PH OSS Umsaetze je Land, PH Nummernluecken, PH Umsatz nach Marke (Marge nur Leitung), PH Vertriebscockpit Faktura (Umsatz, Auftragseingang, Angebotsquote, Anzahlungen, Liefertermine, Reklamationsquote aus ph_service), PH Export-Abgleich (inkl. Journalkette), PH Zahllauf Vorschlag, PH Mahnvorschlag.
- Charts: Umsatz je Monat, Auftragseingang je Monat, Angebote/Rechnungen/Eingangsrechnungen nach Status, Offene Posten nach Alter (Report-Chart), Anzahlungsstand (Report-Chart), Mahnstufen. Number Cards (Euro über `kennzahlen.py`): Offene Angebote, Auftragsbestand, OP gesamt, Überfällig, Anzahlungen offen, Umsatz Monat, Fällig 7 Tage, Eingangsrechnungen offen, Nicht exportierte Belege, Eingangsrechnungen zur Freigabe, Bankumsätze offen, Mahnstufe ≥ 2.
- Workspaces: **PH Faktura** (Buchhaltung) und **PH Vertriebscockpit** (Verkauf, parent PH Faktura).

## Rollen

`PH Faktura Mitarbeiter` (Angebot/AB/Rechnung erfassen) und `PH Faktura Leitung` (Rechnungswesen, Bank, Eingangsrechnungen freigeben, Export; 2FA) – alle Rollen kommen aus ph_core; „Verkauf“ und „Buchhaltung“ sind dort Rollenprofile (`role_profile.json`), keine Rollen. `PH Buchhaltung extern` liest alle Faktura-Belege, Exporte und Reports. `PH Website Integration` liest Angebote/AB/Rechnungen für das Portal. Einkaufspreise/interne Notizen: permlevel 1 (Leitung, Geschäftsführung).

## API (`ph_faktura.api`)

- `portal_documents(kontakt, kunde_token, art=None)` / `portal_document_pdf(kontakt, kunde_token, doctype, name)` – Kundenportal; Token gegen `PH Kontakt.portal_token_hash` (Feld von ph_crm, SHA-256). Beträge nur bei `portal_betraege_anzeigen`.
- `create_cash_invoice(bestellung)` – Barverkauf-Rechnung aus bezahlter PH Bestellung (idempotent über `bestellung:<name>`).
- `create_partial_invoice(auftrag, lieferschein=None, positionen=None, idempotency_key=None)` – Teilrechnung aus AB über gelieferte, nicht abgerechnete Mengen (`positionen` = {PH Beleg Position.name: Menge}, gedeckelt auf `lieferschein_menge − rechnung_menge`); Aufrufer ph_logistik PH Lieferschein „Teilrechnung erstellen“ (nach Übergabe/Zustellung); idempotent über `lieferschein:<name>`. → `{rechnung, status: neu|vorhanden}`.
- `register_payment(rechnung, betrag_cent, kanal, zahlung=None, datum=None)` – intern (ph_kassa, Zuordnung).

## Schnittstelle PH Zahlung (ph_shop) – Plan-Signatur

`ph_faktura.zahlung.buche()` ruft, sobald vorhanden, `ph_shop.zahlung.buche(art, kanal, betrag_cent, bezug_doctype, bezug, zeitpunkt=None, kontakt=None, waehrung="EUR", zahlungsreferenz=None, bank_referenz=None, stripe_payment_intent=None, notiz=None) -> name`. Bis dahin legt der Fallback PH Zahlung direkt an (Felder laut PLAN.md WP5). Rückweg: `doc_events PH Zahlung on_submit/on_cancel` → `ereignisse.zahlung_gebucht/zahlung_storniert`.

## Custom Fields auf fremden DocTypes (fixtures/custom_field.json)

`PH Zahlung.ph_faktura_rechnung`, `PH Bestellung.ph_faktura_rechnung`, `PH Anzahlung.ph_faktura_auftrag`, `PH Stripe Auszahlung.ph_faktura_bankumsatz`, `PH Kontakt.ph_faktura_debitor_nr` (das Feld `portal_token_hash` liefert ph_crm laut PLAN; die API antwortet 503, solange es fehlt), `PH Lieferant.ph_faktura_kreditor_nr`, `PH Projekt.ph_faktura_angebot`.

## Scheduler

06:00 Überfällig setzen, Angebote ablaufen · Mo–Fr 06:30 Mahnlauf (nur wenn `automatisch`) · Mo 07:00 OSS-Lieferschwelle (Warnung ab 80 %) · 1. des Monats UVA-Entwurf Vormonat · 5. des Monats Export-Erinnerung (ToDo).

## Installation (Staging)

```bash
bench get-app /pfad/zu/Backend-Import/ph_faktura
bench --site <site> install-app ph_faktura      # nach ph_core, ph_crm, ph_sortiment, ph_projekte, ph_shop
bench --site <site> migrate
bench --site <site> run-tests --app ph_faktura
```

`after_install`: Zahlungsbedingungen, Einstellungen, Standard-Bankkonto aus PH Firma (wenn IBAN gepflegt). Danach im Desk: **PH Faktura Einstellungen** (Konten, Berater-/Mandantennummer, OSS, Portal-Beträge), **PH Mahnwesen Einstellungen**, **PH Bankkonto**.

## Tests

- Ohne Site (34 Tests): `cd Backend-Import/ph_faktura && PYTHONPATH=. python -m unittest discover -s ph_faktura/tests -t .` – Steuerberechnung/Rundung/USt-Fälle/Pflichtangaben, Anzahlungsaufteilung und -verrechnung (Schluss + Teil), CAMT.053-Parser und Zuordnung, BMD/DATEV/Protokoll mit Prüfsummen, EPC-QR, Nummernlücken, Mahnstufen/Zinsen.
- Mit Site (FrappeTestCase): `test_ph_rechnung.py` (Nummer lückenlos, Storno ohne Lücke, kein Cancel, Zahlung/Status, kompletter Anzahlungsfluss, OSS DE 19 %, RC/igL/Ausfuhr, Kleinbetrag), `test_ph_angebot.py`, `test_ph_auftragsbestaetigung.py` (Teilrechnung anteilig), `test_ph_eingangsrechnung.py`, `test_ph_export_lauf.py` (BMD/DATEV-Datei, Sperre, UVA-Kennzahlen).

## Offene Punkte (vor echten Belegen)

1. **Steuerberater bestätigt**: Soll/Ist-Methode, Anzahlungs-USt, OSS (Schalter `oss_aktiv` nur mit Registrierung), Reverse Charge CH/EU, Kontenrahmen und Steuercodes BMD/DATEV (`rechenwerk/export.py STEUERCODES_*`), Berater-/Mandantennummer.
2. `ph_shop.zahlung.buche` und `PH Zahlung`/`PH Anzahlung`/`PH Bestellung` kommen aus ph_shop (Fallback aktiv, bis bereit); `PH Kontakt` (ph_crm) mit Feldern vorname/nachname/firma/strasse/plz/ort/land/uid/email/sprache angenommen – fehlende Felder werden abgefangen.
3. `PH Lieferschein` (ph_logistik) schreibt `lieferschein_menge`; bis dahin Button „Lieferung melden“ in der AB.
4. UID-Prüfung (MIAS/FinanzOnline) ist Platzhalter (`uid_geprueft_am`). Mehrsprachige Druckformate (en/fr/it) folgen nach Freigabe der Texte.
5. wkhtmltopdf/QR-Bibliothek auf Staging prüfen (PDF-Fixierung und EPC-QR degradieren sauber, Fehler ins Error Log).
