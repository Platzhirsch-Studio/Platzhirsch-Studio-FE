# Platzhirsch Projekte (`ph_projekte`) – WP4

Projekte als **digitale Auftragsmappe**, Planung mit Versionen, Renderings mit Kundenfeedback (Pins, Votes, Freigabe, Sprachnotiz), Bautagebuch, Referenz-Freigabe, Produktpass, Dokumente mit Portal-Freigabe, Montageaufträge mit mehrsprachigem Montagebericht, Fremdgewerke-Koordination (ohne Bauleitung), Abnahmeprotokoll, Aufgaben und Zeiterfassung. Stand 04.11.2026, **nicht installiert**, nur Staging.

- Arbeitspaket: `../PLAN.md` WP4 · Regeln: `../CONVENTIONS.md` · Vorbild SHD marahobjekt/mex/moa: `../referenz/VORBILD-SHD-sauter-held-2026-11-03.md`
- Voraussetzungen (`required_apps`): `frappe`, `ph_core`, `ph_crm` (PH Kontakt, PH Anfrage, PH Termin), `ph_sortiment` (PH Produkt, PH Lieferant). Links auf ph_faktura/ph_shop/ph_logistik/ph_service gibt es **nicht** – die Auftragsmappe fragt diese DocTypes nur ab, wenn sie installiert sind.

## DocTypes (Modul „PH Projekte“, 38 JSONs)

| DocType | Felder | Zweck |
|---|---|---|
| **PH Projekt** | 63 | Auftragsmappe: Art (Wohnung/Haus/Kueche/Bad/Hotel/Objekt/Yacht/Outdoor), Phase = `status` (Website `PROJECT_STEPS`), Kunde, Team, Objekt/Baustelle, Termine, Räume, Positionen, Phasenverlauf, Budget/Summen (permlevel 1), Portal-Schalter, Galerie |
| PH Projekt Team / Raum / Position / Phase | 3/4/29/4 | Kindtabellen; **Position** je Raum mit Pos.-Nr., Lieferant, Artikel-/Typnr., Ausführung (Katalog), Montageart, EK (permlevel 1), Lieferstatus (offen → bestellt → bestaetigt → teilgeliefert → geliefert → montiert / storniert), Mengen bestellt/geliefert/montiert, Liefertermin, Herstellerbestellung, Nachlieferung (Menge, Grund, Termin), Nachtrag |
| **PH Aufmass** (+ Raum/Mass/Anschluss/Foto) | 23/7/7/9/3 | Aufmaß vor Ort `PH-AFM-.YYYY.-.####`: Räume (L/B/H mm, Fläche berechnet, Skizze), Maße (Wand/Bezug, Art, Toleranz), Anschlüsse (Wasser kalt/warm, Abfluss, 230 V, 400 V, Abluft Ø, Gas, Netzwerk; Bestand/neu/verlegen; X/Y/Höhe mm), Gesamtskizze, Fotos, Plausibilitätshinweise; Entwurf → Erfasst → Geprueft |
| **PH Nachtrag** (+ Position) | 33/10 | Änderungsauftrag `PH-NT-.YYYY.-.####`: neu/entfall/aenderung mit Preis, Differenz, EK-Differenz (permlevel 1), Kundenfreigabe per Unterschrift (Desk) oder Portal (Zeit, IP-Hash, Name), Übernahme ins Projekt, `PH Projekt.nachtraege_cent` |
| **PH Planung** (+ Position) | 35/15 | Planstand mit Version je Projekt, Quelle (CAD/Küchenplaner/Sofaplaner/Handskizze/Modell), Datei, JSON-Konfiguration, Aufmaß-Bezug, Kundenentscheidung (offen/freigegeben/aenderung, Kommentar, Quelle, IP-Hash), Portal-Dokument, Import-Protokoll; Positionen mit Pos.-Nr., Typnr., Marke, Lieferant, Kategorie, B/H/T mm, EK |
| **PH Rendering** | 30 | Variante A–F, Version, privates Bild, KI-Kennzeichnung, Feedback-Kennzahlen, Vorschau mit Pins |
| **PH Rendering Feedback** | 38 | kommentar/vorschlag/annotation (Pin 0–100 %)/vote/freigabe/sprachnachricht (privater Audio-Anhang, Einwilligung), Antworten des Studios |
| **PH Projekt Nachricht** | 20 | Nachrichtenfaden Kunde ↔ Studio |
| **PH Tagebuch Foto** | 26 | Bautagebuch je Phase (skizze…nachher), `field:foto_id` |
| **PH Referenz** (+ Bild) | 39/9 | Referenz-Freigabe mit Einwilligungsnachweis, Prüfung, Widerruf löscht Bildkopien, `field:freigabe_id` |
| **PH Produktpass** (+ Material/Pflege/Dokument) | 37/3/2/4 | verbaute Produkte, Materialien, Pflege, Garantie (berechnet), Dokumente, QR auf Portal |
| **PH Projekt Dokument** | 28 | Datei mit Kategorie, Version, Portal-Freigabe, Beleg-Bezug |
| **PH Montageauftrag** (+ Team/Leistung/Unterlage/Foto/Mangel) | 49/3/5/3/5/9 | Montagetermin, Team, Leistungen, Fotos vorher/nachher, Bericht de/en/fr/it, Unterschrift, Mängel (mit Verantwortlichem + Frist), **Fahrzeug** (Kennzeichen) und Kollisionsprüfung Monteure/Fahrzeug/Abwesenheiten/Touren |
| **PH Fremdgewerk** (+ Termin) | 37/6 | Partnerbetrieb, Gewerk, Leistung, mehrere Termine (Aufmaß/Vorinstallation/Montage/Nacharbeit/Abnahme), Abhängigkeitsprüfung, Abnahme der Leistung (abgenommen/mit Mängeln/verweigert) mit Mängeln, Haftungshinweis (nur Koordination) |
| **PH Abnahme** (+ Position) | 32/8 | Abnahmeprotokoll mit ok/Mangel/Nacharbeit, Fristen, Unterschriften |
| **PH Projekt Aufgabe** | 21 | Aufgabe je Projekt (Fälligkeit, Zuständigkeit, erfasste Minuten) |
| **PH Projektzeit** | 26 | Zeiten je Projekt/Aufgabe/Montage, Stundensatz/Betrag (permlevel 1), Abrechnungsstatus |
| PH Projekte Einstellungen (Single) | 15 | Portal-URL, Feedback-Erinnerung, Audio-/Fotolimits, Tagebuch/Referenz-Schalter, Token-Gültigkeit, Montagekapazität, Fußtexte |

## Workflows, Kanban, Druck, Auswertung

- **Workflows** (`fixtures/workflow*.json`): PH Nachtrag (Entwurf → Vorgelegt → Freigegeben (nur mit Unterschrift/Portal) / Abgelehnt; Zurück/Stornieren Leitung), PH Projekt (Anfrage → Planung → Angebot → Auftrag → Bestellung → Lieferung → Montage → Übergabe → Abgeschlossen; Beauftragen/Abschließen/Abbrechen/Zurück nur Leitung), PH Rendering (Entwurf → Vorgelegt → Feedback offen → Freigegeben/Verworfen; Freigeben durch Mitarbeiter nur mit Kunden-Freigabe), PH Montageauftrag (Geplant → Unterwegs → In Arbeit → Erledigt → Abgenommen; Abnehmen nur mit Unterschrift; Transitionen auch für Rolle **PH Montage** – Kiosk), PH Abnahme (Entwurf → Unterzeichnet/Mit Mängeln → Abgeschlossen), PH Referenz (Eingereicht → Veröffentlicht/Abgelehnt/Widerrufen).
- **Kanban**: PH Projekte (Phase), PH Renderings, PH Montageaufträge, PH Fremdgewerke, PH Projektaufgaben.
- **Druckformate** (`ph_basis.html`): PH Projekt Statusbericht (ohne Preise), PH Montagebericht (Sprache aus `sprache_bericht`, Texte `utils/texte.py`), PH Abnahmeprotokoll (mehrsprachig), PH Produktpass (A5, QR per pyqrcode), PH Referenz Einwilligung (Nachweis), **PH Aufmass Protokoll**, **PH Nachtrag Standard** (mit Preisen, Unterschrift/Portal-Freigabe), **PH Auftragsmappe Deckblatt** (Positionen je Raum mit Lieferstatus, ohne Preise).
- **Workspace „PH Projekte“**: 6 Number Cards (Aktive Projekte, Offene Feedbacks, Montagen diese Woche, Offene Mängel, Renderings ohne Antwort, Ungelesene Kundennachrichten), 4 Charts (Projekte je Phase, je Projektart, Montagen je Woche, Kundenfeedback je Woche), Shortcuts (Kanban, Auftragsmappe, Reports).
- **Reports** (Script): PH Projektstatus, PH Offene Maengel, PH Montagekapazitaet je Woche, PH Zeiten je Projekt, PH Liefertermine naechste 30 Tage, **PH Projektkalkulation** (Soll/Ist EK, VK, Montagestunden, DB, Marge – nur Leitung/GF).
- **Desk-Page `ph-auftragsmappe`** (`/app/ph-auftragsmappe?projekt=PH-PRJ-…`): Kopf mit Phasenleiste, Belege (PH Angebot/AB/Rechnung/Lieferschein/Zahlung, sobald ph_faktura/ph_shop installiert), Zahlungsstand (Leitung), Termine, offene Rückmeldungen, Dokumente, Pläne/Renderings, Galerie, Herstellerbestellungen, Abnahmen, Produktpässe, Servicefälle, Aufgaben, Zeiten, Nachrichten, Schnellanlage. Daten: `ph_projekte.api.auftragsmappe(projekt)`.
- **Buttons**: Projekt (Auftragsmappe, Montageauftrag/Abnahme anlegen, Produktpässe erzeugen, Portal-Status senden, Summen aktualisieren, Neu: Planung/Rendering/Dokument/Gewerk/Aufgabe/Zeit), Rendering (Kunden vorlegen, Antworten, Feedback-Übersicht), Feedback (Antworten, Erledigt), Planung (Kunden vorlegen mit Nachricht + Portal-Dokument, Küchenplanung importieren mit Vorschau, Freigeben, Verwerfen/Zurücknehmen, Neue Version, Positionen ins Projekt), Aufmaß (Erfasst/Prüfen/Zurück, Räume ins Projekt, Planung anlegen, Protokoll), Nachtrag (Vorlegen, Unterschrift Kunde, Ablehnen, PDF), Projekt-Lieferung (Herstellerbestellungen erzeugen, Lieferung/Montage buchen, Nachlieferung), Kalkulation Soll/Ist, Auftragsmappe als PDF, Dokument (Portal-Freigabe, Neue Version), Montageauftrag (Unterschrift erfassen, Bericht PDF, Bericht in Auftragsmappe, Zeit buchen, Mängel → Servicefall, Abnahme anlegen), Abnahme (Unterschriften, Mangel erledigt, Mangel → Servicefall, Protokoll PDF/in Auftragsmappe), Fremdgewerk (Status setzen, Termin anlegen, Termin hinzufügen, Leistung abnehmen), Referenz (Veröffentlichen, Ablehnen, Zurückziehen, Widerruf erfassen), Produktpass (Drucken, Status), Aufgabe (Erledigt, Zeit buchen), Zeiterfassung (Als abgerechnet), PH Anfrage: **Projekt anlegen** (Client-Script-Fixture).
- **Scheduler** (`ph_projekte/tasks.py`): 07:00 Montage-Erinnerung (Aufgabe an Montageleiter), 07:15 Mo–Fr **Mängel-Fristen** (überfällige Montage-/Fremdgewerk-/Abnahme-Mängel → Aufgabe, alle X Tage), 08:00 Feedback-Erinnerung (> X Tage), 02:30 Garantien prüfen + Projektsummen.
- **doc_events** (`ph_projekte/lieferung.py`): PH Herstellerbestellung on_update (Lieferstatus/Liefertermin je Projektposition über `bezug_zeile`, Terminänderungen → Aufgabe an Berater mit Kundentext bzw. automatische Kundennachricht bei `liefertermin_kunde_automatisch`), PH Wareneingang on_update (gelieferte Mengen, Schäden/Fehlmengen → Nachlieferung vorgemerkt).
- **Custom Fields** (eigene App): `PH Termin.ph_projekte_projekt`, `PH Beratungsgespraech.ph_projekte_projekt`.

## Website-/Portal-API (`ph_projekte.api`, Token `website@platzhirsch.studio` + `kunde_token`)

Antwortformen = Mock-Adapter der Website (`src/lib/portal/adapters/mock.js`, `interface.js`, `components/Portal/Planung/server/planungStore.js`): Zeiten ISO 8601 mit Offset, Beträge nie an den Browser, `amount: null` / `amountNote: "auf Anfrage"`.

| Website (`adapters/frappe.js`) | Methode | Hinweis |
|---|---|---|
| Magic-Link anfordern | `portal_login_token(email)` | → `{found, kontakt, kunde_token, customer}`; Hash in `PH Kontakt.portal_token_hash`, Website mailt. Unbekannte E-Mail: `{found:false}` |
| `findCustomerByEmail` / `getCustomer` | `portal_find_customer(email)` / `portal_customer(kontakt, kunde_token)` | |
| `listProjects` / `getProject` | `portal_projects` / `portal_project(…, projekt)` | 8 Steps, items (Preise nur mit `portal_positionen_preise`), trades aus PH Fremdgewerk |
| `listDocuments` | `portal_documents(…, type?, projekt?)` | PH Projekt Dokument (freigegeben); Belege mit Beträgen: `ph_faktura.api.portal_documents` |
| `listAppointments` | `portal_appointments(…, projekt?, von?)` | PH Termin (ph_crm), Montagen, Fremdgewerk-Termine |
| `getProductPass` | `portal_product_pass(…, produktpass)` / `portal_product_passes` | |
| – (Desk, ph_logistik Lieferschein) | `create_product_passes(lieferschein=, auftrag=, projekt=, positionen=[{produkt, bezeichnung, menge, seriennummer?, ausfuehrung_text?, ab_position?}], idempotency_key=)` | Produktpässe aus Lieferung, idempotent → `{produktpaesse, uebersprungen}`; gemeinsame Logik `ph_produktpass.pass_anlegen` |
| `listRenderings` | `portal_renderings(…, projekt)` | `image` = private file_url → `portal_file` |
| Feedback (`/api/portal/feedback`, `/voice`) | `portal_feedback_list`, `portal_add_feedback(…, eintrag, audio_base64?, audio_mime?, website_id?)` | `feedbackEntrySchema` 1:1; Sprachnotiz mit Signaturprüfung, max. 5 MB |
| `listMessages` / `sendMessage` / `markMessagesRead` | `portal_messages`, `portal_send_message(…, body, projekt?)`, `portal_mark_read(…, message_ids)` | |
| `requestPlanning` | `portal_request_planning(…, eintrag)` | → PH Anfrage art Beratung, Kanal Kundenportal |
| Dateien (Rendering, Dokument, Audio, Pass-Anhang) | `portal_file(…, file_url)` | Base64, nur eigene private Dateien; Website streamt |
| Tagebuch (`tagebuch/adapter.js`) | `tagebuch_list/add/delete/file` (`rolle=team` oder Kunde) | Dateien `<foto_id>-<w>.<avif|webp>` als private Files |
| Referenz | `referenz_create`, `referenz_list`, `referenz_update(freigabe_id, aktion, …)`, `referenz_file` | Statusregeln der Spec; `referenz_file` nur bei Veröffentlicht |

| Planungsfreigabe | `portal_plannings(…, projekt)`, `portal_planning_decide(…, planung, entscheidung freigeben\|aendern, kommentar?, idempotency_key)` | Änderungswunsch braucht Kommentar; protokolliert Zeit, Quelle, IP-Hash; Kommentar als Kundennachricht |
| Nachträge | `portal_change_orders(…, projekt?)`, `portal_change_order_decide(…, nachtrag, entscheidung freigeben\|ablehnen, kommentar?, name, idempotency_key)` | **mit Beträgen** (s. unten) |

**Preise bei Nachträgen:** Sonst gibt das Portal keine Beträge aus (`portal_positionen_preise` = 0, Inhaber-Frage Nr. 10). Ein Nachtrag ist aber eine Preisänderung, die der Kunde nur wirksam freigeben kann, wenn er Mehr-/Minderpreis sieht – `portal_change_orders` liefert deshalb immer `unitCent`/`amountCent`/`totalDeltaCent` (nur eigene Nachträge im Status Vorgelegt/Freigegeben/Abgelehnt).

Desk/Backoffice (`ph_projekte.api`, Benutzerrechte): `montage_kollisionen(start, ende?, monteure?, fahrzeug?, ausser?)`, `montage_plantafel(von, bis)` (≤ 62 Tage: Montagen, Abwesenheiten, Touren, Gewerke, Auslastung, Überbuchung), `projekt_kalkulation(projekt)` (Leitung), `auftragsmappe_pdf(projekt, teile?)` (Deckblatt, Statusbericht, Aufmaße, freigegebene Plan-PDFs, Nachträge, Montageberichte, Abnahmen, Produktpässe → ein PDF via `frappe.get_print` + `pypdf`, abgelegt als PH Projekt Dokument). Dokumentmethoden: PH Projekt `herstellerbestellungen_erzeugen` (ruft `ph_sortiment.api.bestellungen_sammeln`), `lieferung_buchen`, `nachlieferung_anlegen`, `kalkulation`; PH Planung `import_formate/import_vorschau/import_uebernehmen`, `verwerfen_zuruecknehmen`; PH Aufmass `erfasst_melden/pruefen/zuruecksetzen/skizze_hochladen/raeume_ins_projekt/planung_anlegen`; PH Nachtrag `kunden_vorlegen/freigabe_erfassen/ablehnen`; PH Fremdgewerk `termin_hinzufuegen/abnehmen`.

**Import Küchenplanung** (`utils/kuechenplanung.py`): Adapter-Registry (`Adapter`, `registrieren`), `csv` (Trennzeichen-/Dezimalerkennung, Header-Synonyme oder `mapping_json` `{"spalten": {...}, "einheit_masse": "cm", "raum_standard": "Küche"}`), `xml` (`{"position": "Tag", "felder": {"bezeichnung": "Text", "menge": "@Menge"}}`, DOCTYPE/ENTITY abgelehnt). `carat_csv`, `kps_csv`, `winner_xml` sind **unverifizierte Vorlagen** (Spalten-/Tag-Synonyme) – vor dem ersten Echtimport mit einer Exportdatei des Studios abgleichen; die Vorschau zeigt den Hinweis immer an.

Fehlercodes: `invalid` 400, `forbidden` 403, `not_found`/`invalid_token` 404, `conflict` 409, `expired` 410, `rate_limited` 429, `unavailable` 503 (auch solange `PH Kontakt.portal_token_hash` fehlt).

Schreibende Methoden sind idempotent (`idempotency_key`). Alle Aufrufe werden in PH API Protokoll (ph_core) protokolliert.

## Nachtrag 04.11. (32-marktfunktionen-nachtrag §2 Nr. 14–23, §3 S1/S6/S7/S10/S11)

- **Planungsimport + Änderungsabgleich (S1, Nr. 14/15):** zusätzliche Vorlagen `pcon_csv`, `pcon_obx` (unverifiziert). PH Planung `import_abgleich_vorschau` / `import_abgleichen(datei, format, mapping_json, nachtrag_vorschlag=1)`: Schlüssel Pos.-Nr. + Artikel-/Typnr. (sonst Bezeichnung) → neu / geändert / entfallen. Entfallene Planungspositionen werden **storniert** (`storniert`, `storno_grund`), nie gelöscht. Ist die Planung schon im Projekt (`projekt_zeile`), ändert der Abgleich Projektpositionen nicht still: Nachtrag-Entwurf (neu/entfall/aenderung mit Preisdifferenz) und bei bestellten Positionen eine Aufgabe „Hersteller informieren/stornieren“; mit `nachtrag_vorschlag=0` werden nicht bestellte Positionen direkt storniert/angepasst. **Bestellstatus zurück an die Planung:** PH Planung Position `lieferstatus`, `herstellerbestellung`, `liefertermin` (aus PH Projekt.on_update und den Herstellerbestellungs-/Wareneingangs-Events).
- **Küche komplett (S6):** PH Projekt `ware_komplett`, `ware_komplett_am`, `ware_fehlend` – erst gesetzt, wenn alle nicht stornierten bestellpflichtigen Positionen (Lieferant/Produkt/Artikelnr./Herstellerbestellung) vollständig geliefert sind und keine Nachlieferung offen ist. Montageauftrag zeigt `ware_hinweis`; mit `montage_nur_bei_ware_komplett` sperrt der Start (Unterwegs/In Arbeit).
- **Montagezeit (S10):** Richtwerte je Kategorie/Stichwort (`PH Projekte Einstellungen.montage_richtwerte`, Grundzeit, Standard je Stück) → `PH Montageauftrag.montagezeit_vorschlagen(uebernehmen)` (`stunden_vorschlag`, optional Leistung „Montage laut Richtwert“). **Verschiebung:** Beginn eines geplanten Montageauftrags ändert sich um > 30 min → Aufgabe an Berater mit Kundentext bzw. Kundennachricht (`montage_verschiebung_kunde_automatisch`).
- **Qualifikationen (Nr. 21):** Kindtabelle PH Montage Qualifikation – je Monteur in den Einstellungen, benötigt je Montageauftrag; `qualifikationen_vorschlagen` (Projektart, Aufmaß-Anschlüsse, Kategorien). Fehlende Qualifikation steht in `kollisionen`; `montage_kollisionen(…, qualifikationen=)` liefert Einträge `typ: "qualifikation"`; `montage_plantafel` liefert `qualifikationen` je Monteur sowie je Montage `fehlende_qualifikationen` und `geeignet`.
- **Montageprotokoll (S11, Nr. 22/23):** Vorschäden (`vorschaeden_keine/_text/_bestaetigt`, Foto-Art `vorschaden`), E-Geräte (PH Montage Geraet: E-Nummer aus der Stückliste, FD-/Seriennummer, eingebaut, Funktion geprüft; `geraete_aus_stueckliste`), Druck PH Montagebericht ergänzt (de/en/fr/it). Liefer- und Montageprotokoll sind getrennt: Lieferung = PH Lieferschein mit Unterschrift (ph_logistik), Montage = PH Montagebericht, Abnahme = PH Abnahmeprotokoll. Retouren vor Ort vorerfassen und automatischer Rechnungsversand nach Abnahme: bewusst nicht hier (ph_logistik PH Warenruecknahme bzw. ph_faktura). Offline-Montage-App: Sache des Backoffice-Kiosks (05 §12.5), keine Backend-Lücke.

## Installation (Staging)

```bash
bench get-app /pfad/zu/Backend-Import/ph_projekte
bench --site <site> install-app ph_projekte
bench --site <site> migrate
bench --site <site> run-tests --app ph_projekte
```

Website-Umstellung (nach Abnahme): `PORTAL_ADAPTER=frappe`, `TAGEBUCH_ADAPTER=frappe`, `FRAPPE_URL`, `FRAPPE_API_KEY`, `FRAPPE_API_SECRET`; der Frappe-Adapter ruft die Methoden oben auf und hält den `kunde_token` in der Portal-Session.

## Tests

```bash
cd Backend-Import/ph_projekte && PYTHONPATH=. python -m unittest discover -s ph_projekte/tests -t .   # ohne Site: 63 Tests – Portal-Logik, Aufmaß, Küchenimport, Lieferstatus, Montageplan, Nachtrag, Kalkulation, Mängel, PDF-Mappe
bench --site <site> run-tests --app ph_projekte                                                          # DocType- und API-Tests
```

DocType-Tests: PH Projekt (Phasen, Buttons, Portal-API, fremder Kontakt), PH Rendering Feedback (Pin, Antwort, API inkl. Idempotenz und Sprachnotiz), PH Referenz (eine aktive je Projekt, Skizze verboten, Pflichtfelder, Widerruf löscht Dateien, API), PH Montageauftrag (+ Kollision, Mängel klein/groß), PH Projektzeit, PH Abnahme, PH Aufmass, PH Nachtrag (Summen, Freigabe nur mit Unterschrift, Übernahme, Portal-Ablehnung), PH Projekt Lieferung (Herstellerbestellung, Terminänderung, Teil-/Nachlieferung, Kalkulation).

## Offene Punkte

- `PH Kontakt` (ph_crm) braucht `portal_aktiv`, `portal_token_hash`, `portal_letzter_login` (PLAN WP2) – bis dahin antwortet die Portal-API 503 `unavailable`.
- Nummernkreise der neuen DocTypes in `ph_core/utils/naming.py` eintragen (`../ANFRAGEN-AN-CORE.md`), neu seit 04.11.: **PH Aufmass → `PH-AFM-.YYYY.-.####`**, **PH Nachtrag → `PH-NT-.YYYY.-.####`** (check.py meldet bis dahin die Abweichung).
- `montage_kostensatz_cent` (PH Projekte Einstellungen) ist leer → Montagekosten in der Kalkulation 0, bis der Inhaber den internen Stundensatz einträgt.
- Küchenplaner-Vorlagen (CARAT/KPS/Winner) brauchen je eine echte Exportdatei zur Verifikation; Binär-/Projektformate werden nicht gelesen.
- Fahrzeug im Montageauftrag ist Kennzeichen-Text (ph_logistik ist keine required_app); Kollisionsprüfung liest PH Tour/PH Abwesenheit nur, wenn installiert. Kollisionen sind Warnungen, keine Sperre.
- Abnahme mit Unterschrift war bereits vorhanden (PH Abnahme `unterschrift_kunde`/`unterschrift_studio` Signature + `unterschrift_erfassen`) – unverändert.
- ph_faktura: Summen (`auftragswert_cent`, `anzahlung_ist_cent`, `offen_cent`, `bezahlt_cent`) und Button „Angebot erstellen“ im Projekt kommen aus WP6; `dokument_aus_beleg()` in `ph_projekt_dokument.py` legt Beleg-PDFs in die Mappe.
- ph_service: „Mängel → Servicefall“ erzeugt `PH Servicefall` erst, wenn installiert (Feldnamen `kontakt`, `projekt`, `beschreibung`, `quelle` angenommen).
- Portal-Freigabe von Preisen (Inhaber-Frage Nr. 10) bleibt aus (`portal_positionen_preise` = 0); Einwilligungstext Referenz nur Entwurf (`referenz_freigabe_aktiv` = 0).

## Integration Runde 3 (04.11.2026)

| Bedarf | Umsetzung | Test |
|---|---|---|
| Feld „Planer“ | PH Projekt.planer (Link User): Standard = Ersteller (nur Team-Benutzer, `utils/portal_sitzung.planer_standard`), Liste + Standardfilter, Kanban-Karte PH Projekte, Listen-Knopf „Meine Planungen“ | test_portal_sitzung.TestSeiteUndPlaner, Site |
| E-Nummer/FD am Produktpass | PH Produktpass `e_nummer`, `fd_nummer` (gleiche Namen/Typen wie PH Servicefall → ph_service übernimmt), `pass_anlegen(e_nummer, fd_nummer)` bzw. aus PH Montage Geraet; Portal `eNumber`, `fdNumber` | Site |
| Mehrere Portal-Tokens (60-…, Lücke 1) | neue DocType **PH Portal Sitzung** (hash): Login legt „Angefordert“ an, erste Nutzung aktiviert; max. 5 aktive (älteste fällt), max. 3 offene Anforderungen (Login-Spam verdrängt keine Sitzung), Magic Link 24 h, Ablauf `portal_token_tage`; `portal_logout(kontakt, kunde_token)` widerruft nur die eigene; PH Kontakt.portal_token_hash = jüngste aktive Sitzung (für die ph_core-Prüfung der übrigen Apps) | test_portal_sitzung (7), test_ph_portal_sitzung (Site) |
| Bautagebuch-Teamliste (60-…, Lücke 2) | `ph_projekte.api.tagebuch_list_alle(rolle="team", seite, groesse, suche, nur_mit_fotos)` – PH Projekte Mitarbeiter/Leitung bzw. Website-Team, paginiert → `{items, seite, groesse, gesamt}` | Site |

Hinweis: ph_service/ph_kundenkarte prüfen Kunden-Tokens über `ph_core.api.portal_kontakt_pruefen` (nur `portal_token_hash`) – dort gilt die jüngste aktive Sitzung. Anfrage an ph_core: Prüfung um PH Portal Sitzung erweitern (Hook), dann gelten alle Sitzungen überall.

## Projektnachkalkulation (04.11.2026)

- Logik: `utils/kalkulation.py` (v2: Gültigkeit, Kostensätze, Obligo, DB-Stufen, Prognose, Ampel, Fertigstellungsgrad, Lernwerte; alte Soll/Ist-Funktionen unverändert) · Daten: `ph_projekte/nachkalkulation.py`.
- DocTypes: PH Kostenart, PH Kalkulation Protokoll, PH Projekt Nachkalkulation (+ Zeile, Lernwert); Kind PH Projekt Budget am Projekt; Einstellungen-Kinder PH Kostensatz, PH Kalkulation Ziel, PH Gemeinkosten Regel.
- Kostenzuordnung der Eingangsrechnungen: ph_faktura (PH Eingangsrechnung Zuordnung, `rechenwerk/kostenzuordnung.py`).
- API: `ph_projekte.api.projekt_kalkulation_v2(projekt)`, `kalkulation_einstellungen()`, `kalkulation_einstellungen_speichern(...)`; Reports PH Projektnachkalkulation, PH Kostenarten je Projekt, PH DB Auswertung; Druckformat PH Projekt Nachkalkulation; Scheduler 05:45 `tasks.kalkulation_pruefen`.
- Doku: Marktresearch/digital/backoffice/51-backend-luecken-projekte-sortiment-logistik.md, Abschnitt „Projektnachkalkulation“.
