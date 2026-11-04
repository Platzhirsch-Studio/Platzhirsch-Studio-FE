# Platzhirsch Service (`ph_service`)

Reklamation und Servicefall nach Vorbild SHD **resy** (Fehlercodes, Dokumentation mit Fotos, Ersatzteile, Techniker-Einsätze, Lieferantenregress, Statistik) plus Pflege-/Wartungsverträge (Whirlpool, Sauna, Polster, Holz, Stein) und kostenpflichtige Serviceaufträge (Winterlager). Arbeitspaket WP11 in `Backend-Import/PLAN.md`; Regeln `CONVENTIONS.md`. Installation als **letzte** App (Nr. 11), `required_apps`: ph_core, ph_crm, ph_sortiment, ph_projekte, ph_shop, ph_faktura, ph_logistik.

## Rechtsrahmen (Österreich) – in `ph_service/ph_service/fristen.py`

| Regel | Umsetzung |
|---|---|
| Gewährleistung 2 Jahre ab Übergabe (§ 10 Abs 1 VGG, § 933 Abs 1 ABGB) | `gewaehrleistung_bis` = Übergabe (sonst Kaufdatum) + 24 Monate |
| Vermutung der Mangelhaftigkeit (Beweislastumkehr) 1 Jahr Verbraucher (§ 11 VGG), 6 Monate Unternehmer (§ 924 ABGB) | `beweislast_bis`, Feld `kundentyp` (aus PH Kontakt.kontaktart) |
| Verjährung 3 Monate nach Fristende (§ 10 Abs 2 VGG, § 933 Abs 3 ABGB) | `verjaehrung_bis` |
| Vorrang Verbesserung/Austausch (§ 12 VGG) | Hinweis bei Entscheidung Preisminderung/Wandlung, Begründungspflicht |
| Herstellergarantie getrennt (§ 9b KSchG) | `garantie_monate` → `garantie_bis`, Status „Nur Garantie“ |
| Lieferantenregress § 933b ABGB: 2 Monate ab eigener Gewährleistungsleistung, absolut 5 Jahre ab Lieferung an den Händler | `regress_frist_bis` (ab `erledigt_am`), `lieferung_an_haendler`, Prüfung in PH Lieferantenregress |
| Fristen-Ampel | grün Vermutung · gelb Gewährleistung (Beweislast Kunde) · orange Verjährung/nur Garantie · rot abgelaufen (Kulanz) |

Die Monats- und Fristenwerte sind Voreinstellungen in **PH Service Einstellungen**; Änderungen nur nach Rücksprache mit der Kanzlei. Kundentexte (Email Templates, Druckformate) vor Produktivgang freigeben lassen.

## DocTypes (Modul PH Service)

| DocType | Zweck | Kindtabellen |
|---|---|---|
| **PH Servicefall** (`PH-SRV-.YYYY.-.#####`) | Reklamation/Servicefall: Kunde, Bezüge (Projekt, AB, Shop-Bestellung, Rechnung, Lieferschein, Wareneingang, Produktpass, Montageauftrag), Produkt/Ausführung/Marke/Lieferant, Fehlercode, Fotos, Fristen, Prüfung/Entscheidung, Ersatzteile, Kosten, Regress-Spiegel, Abschluss, Abnahme, Zufriedenheit, Verlauf. 6 Tabs. | PH Servicefall Foto, PH Servicefall Ersatzteil, PH Servicefall Kosten, PH Servicefall Verlauf |
| **PH Fehlerbereich** / **PH Fehlercode** | Fehlerkatalog zweistufig (12 Bereiche, 58 Codes aus `install.py`: Oberfläche, Mechanik, Elektro, Polster, Stein, Glas, Holz, Transport, Montage, Maß, Wellness-Technik, Pflegefrage) mit Gruppe, Ursache, Standardlösung, Lieferantenrelevanz, Kundentext | – |
| **PH Serviceeinsatz** (`PH-SRE-`) | Technikertermin: Techniker, Datum/Zeitfenster, Adresse, Anfahrt, Statusbuttons (bestätigt → unterwegs → in Arbeit → erledigt/nicht angetroffen), Bericht, Fotos vorher/nachher, Unterschrift, verbrauchte Ersatzteile (Bestandsabgang), Zeiten → Kosten in den Servicefall, Folgeeinsatz, Kalendertermin (PH Termin), Tour/Fahrzeug (ph_logistik) | PH Serviceeinsatz Foto, PH Serviceeinsatz Ersatzteil |
| **PH Ersatzteil** (`PH-ET-`) | Ersatzteil mit Hersteller-Nr., Marke/Lieferant/Produkt, eigenem Bestand (Summe der Bewegungen), Mindestbestand, Lagerort (PH Lagerort), EK (permlevel 1) | PH Ersatzteil Bewegung |
| **PH Ersatzteilbestellung** (`PH-ETB-`) | Bestellung beim Hersteller (aus Servicefall oder für Lager): Senden per Mail + PDF, AB, Wareneingang mit Bestandszugang, Kostenträger | PH Ersatzteilbestellung Position |
| **PH Lieferantenregress** (`PH-REG-`) | Regress § 933b: Forderung, Anerkennung, Gutschrift/Verrechnung, Frist, Erinnerung | – |
| **PH Pflege Abo** (`PFL-`) | Pflege-/Wartungsvertrag (einmalig, Jahres-Abo, Wartungsvertrag Whirlpool/Sauna/Pool): Intervall, nächster Termin, Erinnerung, Protokolle, Nachkauf-Einwilligung (Art. 7 DSGVO), Portal. Entwurf `../platzhirsch-frappe-service/pflege` übernommen (Felder 1:1, Kunde → PH Kontakt, Preis in Cent). | PH Pflege Abo Stueck, PH Pflege Abo Protokoll |
| **PH Serviceauftrag** (`PH-SA-`) | Winterlager/Pflege/Reparatur kostenpflichtig: Übernahmeliste mit Zustand/Fotos, Lagerort, Unterschriften | PH Serviceauftrag Position |
| **PH Service Einstellungen** (Single) | Fristen, Reaktions-/Eskalationszeiten, Kulanzschwelle (500 €), Ersatzteilbestand, Mailvorlagen, Portal-Limits | – |

Nummernkreise: Wunsch an ph_core in `Backend-Import/ANFRAGEN-AN-CORE.md` (bis dahin stehen sie in den DocType-JSONs).

## Workflows (Fixtures)

- **PH Servicefall**: Gemeldet → Geprüft (Bedingung Fehlercode + Mangel bewertet) → Entscheidung (Entscheidung + Begründung; Kulanz > Schwelle nur Leitung) → In Bearbeitung → Einsatz geplant ⇄ In Bearbeitung → Erledigt (Abschlussbericht) → Geschlossen; Abgelehnt (Leitung, Begründung + Bericht); Wieder öffnen (Leitung).
- **PH Lieferantenregress**: Offen → Gemeldet → Anerkannt (Betrag) / Abgelehnt → Verrechnet (Leitung, Gutschrift/Beleg).
- **PH Pflege Abo**: Angefragt → Angeboten → Aktiv ⇄ Pausiert → Gekündigt (Leitung, Datum) → Beendet.
- **PH Serviceauftrag**: Angefragt → Angeboten → Beauftragt → Abgeholt → Eingelagert → In Arbeit → Zurückgebracht → Abgerechnet; Storniert (Leitung).

Serviceeinsatz und Ersatzteilbestellung setzen ihren Status über Buttons (Server-Methoden), kein Workflow.

## Buttons

| Formular | Aktionen |
|---|---|
| PH Servicefall | Einsatz planen · Ersatzteile bestellen · Kunde informieren (Eingang/Termin/Abschluss) · Lieferant informieren (PDF + Fotos, legt Regress an) · Regress anlegen · Gutschrift/Kulanz erstellen (ph_faktura PH Gutschrift) · Erledigt + Bericht · Abnahme erfassen (Unterschrift, Zufriedenheit) · Ablehnen (Leitung) · Wieder öffnen (Leitung) · Drucken: Reklamationsmeldung, Abnahmebestätigung |
| PH Serviceeinsatz | Kunde hat bestätigt · Unterwegs · Einsatz starten · Nicht angetroffen · Einsatz abschließen (Ergebnis, Bericht, Unterschrift) · Kalendertermin anlegen · Folgeeinsatz anlegen · Route (Karte) · Servicebericht (PDF) |
| PH Ersatzteil | Bewegung buchen (Zugang/Verbrauch/Retoure/Korrektur/Inventur) · Beim Hersteller bestellen |
| PH Ersatzteilbestellung | Per E-Mail senden · Als gesendet markieren · AB erhalten · Wareneingang buchen · Stornieren |
| PH Lieferantenregress | Lieferant erinnern · Servicefall öffnen |
| PH Pflege Abo | Nächsten Termin planen · Erinnerung senden · Protokoll erfassen · Pflegeprotokoll (PDF) |
| Fremde Formulare (Client-Script-Fixtures) | PH Montageauftrag, PH Abnahme, PH Wareneingang, PH Lieferschein: **Servicefall anlegen** → `ph_servicefall.aus_dokument` |

Custom Fields (eigene App, Präfix `ph_service_`): PH Wareneingang.ph_service_servicefall, PH Tour Stopp.ph_service_servicefall/_einsatz, PH Produktpass.ph_service_pflege_abo, PH Montageauftrag.ph_service_servicefaelle.

## Grafik

Tabs im Servicefall (Übersicht, Mangel, Fristen, Prüfung/Entscheidung, Ersatzteile/Kosten, Abschluss, Verlauf), **Fristen-Ampel** als HTML-Feld (Client rechnet wie `fristen.py`, Server ist maßgeblich), **Fotogalerie** (Kacheln, Quelle, Lieferant-Kennzeichen) in Servicefall und Einsatz, Status-Farben in Formular, Liste und Kanban, Kopfhinweise (Kulanz-Freigabe, Reaktionsfrist, Eskalationsstufe).

## Kanban, Druck, Dashboard, Berichte

- Kanban: **PH Servicefälle** (Status), **PH Serviceeinsätze** (Status, Karte zeigt Techniker; Filter „Meine Einsätze“ in der Liste), **PH Serviceaufträge**.
- Print Formats (Jinja, `ph_basis.html`): PH Servicebericht (Einsatz, Unterschrift), PH Servicefall Reklamationsmeldung (an Hersteller, Fotos, Regress), PH Servicefall Abnahmebestätigung (Kunde), PH Pflegeprotokoll, PH Ersatzteilbestellung, PH Serviceauftrag Übernahmeliste.
- Charts: Servicefälle je Monat, nach Art, nach Fehlerbereich, nach Marke, Regress nach Status (Summe).
- Number Cards: Offene Servicefälle, Reaktion überfällig, Gewährleistung läuft ab, Einsätze diese Woche, Regress offen (€), Ersatzteile unter Mindestbestand, Wartungen überfällig, Ø Durchlaufzeit (Custom-Methoden in `kennzahlen.py`).
- Script Reports: **PH Reklamationsquote je Marke** (auch je Lieferant; Nenner = Positionen gestellter Rechnungen aus ph_faktura, Ø Durchlaufzeit, Kosten, Regress), **PH Fehlercode-Statistik** (Baum Bereich → Code), **PH Regressstatus** (offen/erhalten, Fristen), **PH Servicekosten** (intern/extern/Kulanz/Regress je Monat/Marke/Art/Bereich), **PH Gewährleistungsfristen** (Fälle, deren Fristen ablaufen, Ampel).
- Workspace **PH Service** (sequence 11): 8 Cards, 4 Charts, Shortcuts, Karten je Bereich.

## Kundenkommunikation

Email Templates (Fixture `email_template.json`, Jinja mit `doc`, `firma`, `zusatz`): **PH Service Eingangsbestätigung**, **Terminvorschlag**, **Abschluss** (Abnahmebestätigung als PDF), **Wartungserinnerung**, **Regressmeldung** (Lieferant). Versand über `ph_core.utils.mail.sende` (Testmodus → Team-Postfach). Jede Mail schreibt Verlauf + Kommentar; `kunde_informiert_am`/`erstreaktion_am` werden gesetzt.

## Scheduler (`ph_service/ph_service/tasks.py`)

| Zeit | Funktion | Wirkung |
|---|---|---|
| 06:30 täglich | `fristen_pruefen` | Gewährleistung endet in ≤ 60 Tagen (Einstellung) → ToDo an Verantwortlichen + Verlauf; Regressfrist ≤ 14 Tage/abgelaufen → ToDo Leitung; Reaktionsfrist überschritten → ToDo |
| 06:30 täglich | `eskalation` | offene Fälle ohne Bewegung > 5 Tage → Eskalationsstufe +1, Priorität Hoch/Dringend, ToDo an Leitung (+ Verantwortlichen), Verlauf |
| 06:45 täglich | `wartungserinnerungen` | Pflege-/Wartungsverträge: Erinnerung 42 Tage vorher (ph_marketing PH Reise Versand, sonst Email Template, sonst ToDo), Überfällig-Kennzeichen, Nachkauf-Hinweis nur mit Einwilligung (nur über ph_marketing oder ToDo) |
| Mo 07:00 | `wochenuebersicht` | Einsätze der Woche je Techniker + offene Fälle an Team-Postfach |

Bewegung = Speichern, Kommentar, Einsatz-Status, Regress-Status (`letzte_bewegung`).

## API (`ph_service.api`, Token `website@platzhirsch.studio`, Decorator `ph_api`)

| Methode | Zweck | Website |
|---|---|---|
| `portal_service_cases(kontakt, kunde_token)` | eigene Servicefälle (Status, nächster Einsatz) | Portal „Service“ (`src/lib/portal/adapters/frappe.js`) |
| `portal_service_case(kontakt, kunde_token, referenz)` | Detail mit Verlauf, Einsätzen, Fotos | Portal |
| `portal_create_service_case(kontakt, kunde_token, beschreibung, art, kundenwunsch, produkt/produktpass/bestellung/projekt/rechnung, fehlerbereich, fehlercode, fotos=[{name, content(base64|data-URL), hinweis}], idempotency_key)` | „Servicefall melden“ mit Fotos (max. 8 × 10 MB, privat) | Portal |
| `portal_add_photo`, `portal_rate_service_case`, `portal_service_file` | Foto nachreichen, Zufriedenheit, Datei streamen | Portal |
| `portal_care_subscriptions(kontakt, kunde_token)` | Pflege-/Wartungsverträge (`itemIds`, `passIds`, `naechsterTermin`, Protokolle) | `src/lib/service/pflege/portal.js` |
| `create_service_case(nachname, email, beschreibung, …, fotos[])` | Reklamationsformular ohne Portal; findet/erzeugt PH Kontakt per E-Mail; idempotent | `/[locale]/service/reklamation` (neu) |
| `get_service_status(referenz, email)` | Status abfragen (Referenz + E-Mail) | Website |
| `get_fehlerkatalog()` | Bereiche/Codes/Arten für Formulare | Website, Portal |

Portal-Token: `sha256(kunde_token)` wird mit `PH Kontakt.portal_token_hash` verglichen (gleiche Konvention wie ph_projekte/ph_faktura erwartet; mit dem ph_crm-Agenten abgestimmt halten). Zugriff immer über `kontakt` gefiltert; Bestellung/Projekt/Produktpass/Rechnung werden nur übernommen, wenn sie dem Kontakt gehören. Antworten ohne Klartext-E-Mail (maskiert).

Status-Werte im Portal: `gemeldet, geprueft, entscheidung, in_bearbeitung, einsatz_geplant, erledigt, geschlossen, abgelehnt`.

## Rollen

`PH Service Mitarbeiter` (Sachbearbeitung), `PH Service Leitung` (Kulanz über Schwelle, Ablehnen, Wieder öffnen, Regress verrechnen, Einstellungen, permlevel 1: interne Notizen, EK, Stundensätze), **`PH Techniker`** (liest Servicefälle, bearbeitet Einsätze, kein Zugriff auf Kosten/EK), `PH Website Integration` (API: Servicefall create/read/write, Pflege Abo read/create).

## Installation (Staging) und Tests

```bash
bench get-app /pfad/zu/Backend-Import/ph_service
bench --site <site> install-app ph_service      # after_install: Fehlerkatalog, Einstellungen
bench --site <site> migrate
bench --site <site> run-tests --app ph_service   # Site-Tests: Servicefall, Regress, Ersatzteil, Einsatz, Pflege Abo
cd Backend-Import/ph_service && PYTHONPATH=. python -m unittest discover -s ph_service/tests -t .   # ohne Site: Fristen, Pflege-Logik
```

Site-Tests setzen voraus, dass `PH Kontakt` (ph_crm) installiert ist; Regress-Tests überspringen sich ohne `PH Lieferant`.

## Website-Umstellung (nach Abnahme)

1. Portal-Adapter (`src/lib/portal/adapters/frappe.js`): Service-Methoden auf `ph_service.api.portal_*` zeigen lassen; Pflege-Abos (`listCareSubscriptions`) auf `portal_care_subscriptions` (Antwort `vertraege[]`, Felder wie bisher plus `bereich`, `ueberfaellig`).
2. Reklamationsformular (neu, `/[locale]/service/reklamation`) → `ph_service.api.create_service_case`; Statusseite → `get_service_status`; Fehlerkatalog für Auswahlfelder → `get_fehlerkatalog`.
3. Header `Authorization: token <key>:<secret>` wie bei ph_crm; Fehlercodes `body.code`.

## Offene Punkte

- Feldnamen der Nachbar-Apps (PH Kontakt, PH Lieferant.bestell_email, PH Rechnung.datum, PH Lieferschein.zugestellt_am, PH Produktpass.lieferdatum, PH Beleg Position) sind aus PLAN.md übernommen; Zugriffe sind defensiv (try/exists), aber nach Fertigstellung der Apps gegenlesen.
- Custom Fields/Client Scripts auf PH Wareneingang, PH Tour Stopp, PH Produktpass, PH Montageauftrag, PH Abnahme, PH Lieferschein greifen erst, wenn diese DocTypes existieren (Installationsreihenfolge).
- Kundentexte (Email Templates, Abnahmebestätigung, Reklamationsmeldung) und Fristenlogik von der Kanzlei bestätigen lassen; mehrsprachige Servicebericht-Varianten (en/fr/it) folgen nach Inhaber-Entscheid Nr. 14.
- Nummernkreise in `ph_core/utils/naming.py` ergänzen (ANFRAGEN-AN-CORE.md).
- Kanban „Einsätze je Techniker“: Frappe-Kanban gruppiert nur nach Select-Feldern; je Techniker über Listenfilter/Gruppierung oder Kalenderansicht.
