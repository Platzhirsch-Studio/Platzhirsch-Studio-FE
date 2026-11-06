# 21 – Fachkritik Projekte (Konzept 10-konzept-projekte.md gegen App ph_projekte)

**Zweck:** Fach- und Datenprüfung des Projekte-Konzepts (Auftragsmappe, Planung, Renderings, Montage, Abnahme, Fremdgewerke, Produktpass, Zeiten). Geprüft wird: Welche UI-Funktion hat kein Feld und keine Methode? Welche Pflichtprozesse fehlen? Wo verstößt das Konzept gegen österreichisches Recht (UStG, BAO/RKSV, FAGG, KSchG/ABGB-Gewährleistung, DSGVO, TKG 2021, ArbVG/AVRAG/AZG) oder gegen Buchhaltungslogik? Welche Randfälle fehlen? Ergebnis: Note und konkrete Pflichtänderungen je DocType, Feld und Methode.
**Stand:** 2026-11-04 · Rolle: Fachkritiker Möbelhandel + Frappe-Datenprüfer · Status: Prüfbericht, keine Entscheidung des Inhabers.
**Geprüft:** `Marktresearch/digital/backoffice/10-konzept-projekte.md` (vollständig, 1104 Zeilen); `Backend-Import/ph_projekte/README.md`; **alle 40 DocType-JSONs** im Dateistand von 11:59 (30 laut README plus neu: PH Aufmass + Raum/Mass/Anschluss/Foto, PH Nachtrag + Position, PH Fremdgewerk Termin; Felder geändert in PH Projekt, PH Projekt Position, PH Planung, PH Planung Position, PH Abnahme Position, PH Montageauftrag, PH Montage Mangel, PH Fremdgewerk, PH Projekte Einstellungen); Controller `ph_projekt.py`, `ph_montageauftrag.py`, `ph_abnahme.py`, `ph_projektzeit.py`, `ph_produktpass.py`, `ph_rendering.py` (Auszug), `helfer.py`; `fixtures/workflow.json`; `hooks.py`; `api/__init__.py` (`auftragsmappe`, `_optional`, `projekt_aus_anfrage`, `create_product_passes`); `utils/kalkulation.py`, `nachtrag.py`, `lieferung.py`, `maengel.py`, `montageplan.py`, `mappe.py`, `aufmass.py`, `kuechenplanung.py` (Kopf + Funktionen). Gegenseiten: PH Auftragsbestaetigung, PH Rechnung, PH Angebot, PH Gutschrift, PH Beleg Position (ph_faktura), PH Herstellerbestellung (ph_sortiment), PH Zahlung (ph_shop), PH Servicefall (ph_service), PH Kontakt (ph_crm).
**Wichtig:** Die App wird **während dieser Prüfung erweitert** (Dateien von 11:59). Neue Logik in `utils/` (Lieferstatus, Nachtrag, Kalkulation, Mängelfristen, Plantafel, Mappe-PDF) ist zum Teil noch nicht an Controller angebunden (z. B. kein `herstellerbestellungen_erzeugen`, `lieferung_buchen`, `nachlieferung_anlegen` in `ph_projekt.py`; `PH Montageauftrag.abnahme_anlegen` vergleicht weiter auf `Behoben/Erledigt`). Befunde beziehen sich auf diesen Stand.
**Rechtsangaben:** Hinweise für die Umsetzung, keine Rechtsberatung. Vor Livegang mit Steuerberatung und Datenschutz prüfen (§7).

---

## 0. Ergebnis in Kürze

**Note: 6 / 10.**

| Teil | Bewertung |
|---|---|
| UX, Zustände, Kürzel, Leer-/Fehlerzustände, Kiosk Montage | stark (8–9): Mappe als Arbeitsplatz, ein nächster Schritt, Inbox, Kundensicht, Offline-Puffer sind konkret und prüfbar |
| Datenmapping | mittel: viele Lücken richtig erkannt (Workflow-State Rendering, Rolle PH Montage, `behoben`-Vergleich), aber **ein Datenleck und drei Rechenfehler in den Summen** übersehen (B1–B3) |
| Abgleich mit dem App-Stand | schwach: Konzept kennt **Nachtrag, Aufmaß, Lieferstatus/Nachlieferung, Kalkulation, Fremdgewerk-Termine/-Abnahme** nicht – genau die Pflichtprozesse für Küche/Bad/Objekt |
| Buchhaltung / Steuern | schwach: Geldfluss Auftrag → Anzahlung → Nachtrag → Schlussrechnung ist im Projekt nicht abgebildet; Leistungsdatum, Reverse Charge Bau (§ 19 Abs. 1a UStG), Währung fehlen |
| Recht | schwach: Abnahmeprotokoll nach Unterschrift änderbar, Gewährleistungsbeginn per Inline-Datum verschiebbar, FAGG bei Bestellung/Portal-Freigabe, Barinkasso bei Montage (RKSV), E-Mail-Werbung (TKG) in AU9/AU10 |
| Randfälle | lückenhaft: Storno nach Auftrag, Teilmontage/Teilabnahme, Retoure, CHF/Schweiz, Kunde ohne E-Mail |

Abzug vor allem für B1 (fremde Kunden-, Zahlungs- und Termindaten in jeder Mappe) und weil Abnahmekriterien 9, 23 und PA8 mit dem heutigen Code nicht korrekt erfüllbar sind.

---

## 1. Befunde gegen den Code, die das Konzept übersieht (Blocker)

### B1 Auftragsmappe zeigt Datensätze **anderer Projekte** (Datenleck)
- `api._optional(doctype, filters, fields)` entfernt jeden Filter, dessen Feld der DocType nicht hat (`filters = {k: v … if meta.has_field(k)}`) und liefert dann ungefiltert die letzten 50 Datensätze.
- Kein Feld `projekt` haben: **PH Herstellerbestellung** (Bezug über `bezug_doctype/bezug_name`, `kommission`), **PH Zahlung** (ph_shop, `bezug_doctype/bezug`), **PH Sendung**, **PH Termin** (Custom Field heißt `ph_projekte_projekt`).
- Folge: Tab 4 „Belege & Zahlung“, Tab 5 „Bestellung & Lieferung“, rechte Spalte „Nächste Termine“ und Karte „Herstellerbestellungen“ zeigen **Zahlungen, Termine und Bestellungen fremder Kunden** – auch PH Projekte Mitarbeitern (nur `*_cent` wird entfernt, Name/Status/Datum/Kontakt bleiben). DSGVO Art. 5 Abs. 1 lit. f, Art. 32.
- Zusätzlich falsche Feldnamen: `liefertermin_bestaetigt` (heißt `bestaetigter_termin`), `tracking_nummer` (fehlt in PH Sendung), `bezahlt_am` (PH Zahlung: `zeitpunkt`) – werden still weggelassen.
- **Pflicht:** P1.

### B2 Projektsummen sind falsch (Auftragswert, Anzahlung, Offen, Bezahlt)
- `ph_projekt.summen()` filtert PH Auftragsbestaetigung mit `docstatus < 2`. PH Auftragsbestaetigung ist **nicht submittable** → `docstatus` immer 0 → **stornierte ABs** (`status = Storniert`) zählen in Auftragswert, Anzahlung und Offen.
- Beträge mehrerer ABs/Rechnungen werden in Cent addiert **ohne Währungsprüfung** (`PH Auftragsbestaetigung.waehrung`, `PH Rechnung.waehrung`/`kurs`); `PH Projekt.waehrung` wird nie gesetzt.
- `bezahlt_cent` = Summe `PH Rechnung.bezahlt_cent` mit `docstatus = 1`: per Gutschrift stornierte Rechnungen bleiben `docstatus = 1` (Status „Storniert“) – Rückzahlungen (PH Gutschrift `erstattet_cent`) werden nicht abgezogen. PH Gutschrift fehlt in `auftragsmappe` ganz.
- `offen_cent` kommt aus der AB, nicht aus Rechnungen – PA8-Prüfung „Schlussrechnung bezahlt (`offen_cent = 0`)“ prüft also nicht die Schlussrechnung.
- `nachtraege_cent` (neu in PH Projekt) wird von `summen()` nicht befüllt.
- **Pflicht:** P2.

### B3 Kalkulation (neu, `utils/kalkulation.py`) rechnet Brutto gegen Netto und zählt Anzahlungen doppelt
- `soll()`: VK = `PH Projekt Position.preis_cent` × Menge. Laut `utils/nachtrag.py` sind Projektpreise **Bruttopreise (Endkunde)**, EK (`ek_cent`) ist netto → Deckungsbeitrag und Marge um die USt zu hoch.
- `ist()`: schließt Rechnungen mit `art in ("Anzahlung", "Storno")` aus. PH Rechnung kennt `Rechnung/Anzahlungsrechnung/Teilrechnung/Schlussrechnung/Barverkauf`; Storno läuft über PH Gutschrift → Filter greift **nie**, Anzahlungsrechnung + Schlussrechnung werden doppelt gezählt, Gutschriften fehlen.
- `nachtrag.projekt_aenderungen()` schreibt bei `aenderung` nur `ausfuehrung_text`, nicht Menge/Preis, obwohl der Docstring „Menge fort“ sagt; Kalkulation addiert `summe_aenderung_cent` separat → Projektposition und Kalkulation laufen auseinander.
- Das Konzept hat keine Kalkulationsansicht; sobald sie gebaut wird, zeigt sie mit diesem Code falsche Margen.
- **Pflicht:** P3.

### B4 Mengen sind Ganzzahlen
- `menge:Int` in PH Projekt Position, PH Planung Position, PH Nachtrag Position; ebenso `menge_bestellt/geliefert/montiert`, `nachlieferung_menge`. PH Beleg Position (Faktura) hat `menge:Float` + `einheit` (m, m², lfm, Std, Pausch).
- 3,6 lfm Arbeitsplatte, 18,5 m² Boden, 2,5 Std. Planung werden 3/18/2; Lieferstatus „geliefert“ wird bei Teilmengen falsch, Kalkulation falsch, Nachtrag falsch. Küchen-Import (`kuechenplanung.py`) normalisiert „menge (Int ≥ 1)“.
- **Pflicht:** P4.

### B5 Abnahme- und Montage-Unterschrift sind nachträglich änderbar
- `PH Abnahme.unterschrift_erfassen` und `PH Montageauftrag.unterschrift_erfassen` schreiben per `db_set` **in jedem Status** und überschreiben eine vorhandene Unterschrift; keine Prüfung, ob schon unterzeichnet.
- `PH Abnahme.validate` sperrt Positionen, Vorbehalte, `datum` nach „Unterzeichnet“ nicht; Rollen PH Projekte Mitarbeiter **und PH Montage** haben `write`; Leitung hat `delete` auf PH Abnahme, PH Montageauftrag, PH Projekt Dokument.
- Folge: Das unterschriebene Protokoll (Beweismittel für Abnahme, Mängelvorbehalt, Gewährleistungsbeginn) kann ohne Spur geändert werden; `track_changes` hilft nur bei Desk-Speichern, nicht bei `db_set`.
- Konzept §4.5 „nach Speichern nicht änderbar **in UI**“ reicht nicht.
- **Pflicht:** P5.

### B6 Gewährleistungsbeginn hängt an einem frei änderbaren Datum
- ph_service berechnet Fristen aus `PH Projekt.uebergabe_am` (`ph_servicefall.py` Z. 138). Dieses Feld setzt der Workflow „Übergeben“ auf **heute** (nicht auf das Abnahmedatum) und das Konzept macht es **inline änderbar und im Gantt ziehbar** (§3.1 Termin-Chips, §2.10 „Übergabe – ziehen (Leitung)“).
- Folge: Wer „Übergeben“ drei Wochen nach der Abnahme klickt oder den Chip verschiebt, verschiebt Gewährleistungs- und Beweislastfrist (§§ 924, 933 ABGB; VGG für Verbraucherverträge über Waren).
- **Pflicht:** P6.

### B7 Weitere Code-Abweichungen

| Nr. | Code-Befund | Konzept | Wirkung |
|---|---|---|---|
| a | `PH Projekt.montageauftrag_anlegen` nimmt Leistungen aus `status in (bestellt, geliefert)`, nicht aus `lieferstatus`; `montage_art` (Eigenmontage/Fremdgewerk/ohne) und `storniert` werden ignoriert | §4.1, Kriterium 23 übernimmt das | Monteur bekommt stornierte, fremd montierte und nicht gelieferte Positionen als Leistung |
| b | `PH Projekt.produktpaesse_erzeugen` erzeugt Pässe auch für Positionen mit Status **bestellt**; `create_product_passes` setzt `lieferdatum = heute`; `garantie_monate` wird nie befüllt → `garantie_bis` leer | §2.14, PA6 („bestellt“ übernommen) | Pass für nicht gelieferte Ware, falsches Lieferdatum, Garantieanzeige leer |
| c | `PH Projekt.abnahme_anlegen` liefert immer **die eine** Abnahme (`PH Projekt.abnahme`); Positionen werden nur über `bezeichnung` (Text) zugeordnet | §2.9, PA5 | keine Teil- oder Nachabnahme; Doppelte Bezeichnungen („Hochschrank“) verschmelzen |
| d | `PH Montageauftrag.on_update` erweitert `montage_von/bis` nur, verkleinert nie; `ende` wird nicht berücksichtigt | §2.7 „Controller führt nach“ | Nach Verschieben im Kalender zeigt der Projektkopf falschen Montagezeitraum |
| e | `PH Montageauftrag.zeit_buchen` setzt `datum = start`-Tag; prüft nicht, ob `user` im Team ist | §7.1 „7:28 h für das Team buchen?“ | mehrtägige Montagen auf Tag 1; jeder Mitarbeiter bucht Zeit auf jeden Kollegen |
| f | `PH Projektzeit`: Sperre nach „Abgerechnet“ prüft nur `dauer_min, datum, user, abrechenbar` – `stundensatz_cent`, `projekt`, `taetigkeit` bleiben änderbar, `betrag_cent` rechnet neu; `als_abgerechnet` akzeptiert auch „Nicht abrechenbar“; `beleg_ref` ist Freitext | §2.13, Kriterium 31 | abgerechneter Betrag ändert sich nachträglich; Abrechnung ohne Rechnung |
| g | Rolle **PH Montage** steht inzwischen in den Rechten von PH Projekt (r), PH Montageauftrag (rw), PH Abnahme (rwc), PH Fremdgewerk (r), PH Projekt Dokument (r), PH Aufmass (rwc) – **nicht** in PH Projektzeit, PH Tagebuch Foto und in **keiner Workflow-Transition** | §2.8/§4.3: „fehlt“ | Konzepttext veraltet; Kiosk kann weiter nicht „Losfahren“, keine Zeit buchen, kein Tagebuchfoto |
| h | PH Website Integration hat `read` auf PH Montageauftrag inkl. `unterschrift_kunde`, `telefon_vor_ort`, `fotos` | nicht erkannt | Datenminimierung verletzt (Art. 5 Abs. 1 lit. c DSGVO) |
| i | `portal_status_senden` und `PH Rendering.kunden_vorlegen` senden ohne E-Mail **still nichts**, Text immer deutsch (ignoriert `PH Kontakt.sprache`, `kommunikation_bevorzugt`) | Toast „Kunde informiert“ (§1.1 B3/B5, Kriterium 12) | Mitarbeiter glaubt, Kunde sei informiert |
| j | L3 „wenn AB aus Faktura vorhanden, automatisch [Auftrag]“: es gibt keinen `doc_event` (hooks.py `doc_events = {}`), ph_faktura setzt den Projektstatus nicht | §1.3 L3 | Phase bleibt „Angebot“ trotz AB |

---

## 2. UI-Funktionen ohne Datenfeld / Methode (zusätzlich zu Konzept §9)

| UI-Funktion (Konzept) | Fehlt | Vorschlag |
|---|---|---|
| Tab 4 „Belege & Zahlung“ Zahlungsplan Soll/Ist | Zahlungen je Projekt (PH Zahlung hat kein `projekt`), Gutschriften | `auftragsmappe` liest Zahlungen über `PH Rechnung.zahlungen` und `PH Gutschrift` mit `projekt` bzw. `auftrag` (P1) |
| Tab 5 Herstellerbestellungen / Positionsmatrix | Projektbezug in PH Herstellerbestellung | Filter `bezug_doctype = "PH Projekt"` + `bezug_name` **oder** neues Feld `projekt` (ph_sortiment); Positionsmatrix aus `PH Projekt Position.lieferstatus/menge_*` (gibt es jetzt) |
| Nächste Termine (PH Termin) | Filter `projekt` | Filter `ph_projekte_projekt` |
| §3.4 „Auftrag: Anzahlung offen“ | Anzahlung je Projekt aus Rechnungen statt AB | `summen()` ergänzt `anzahlung_soll_cent` (AB) und `anzahlung_ist_cent` (bezahlte Anzahlungsrechnungen) getrennt |
| §3.4 „Angebot (Faktura) gesendet → Beauftragen“ | Statusübernahme AB → Projekt | `doc_event` in ph_projekte auf PH Auftragsbestaetigung `after_insert`: Projekt „Angebot“ → Vorschlag „Beauftragen“ (kein Automatik-Sprung ohne Leitung; Hinweiszeile) |
| Kundensicht (§3.6), Status senden | Zustellkanal | Rückgabe `{nachricht, kanal: "mail"|"nur_portal"|"keiner", grund}` aus `portal_status_senden` |
| Präsentationsmodus „Kunde pinnt am iPad“ | Wer am Gerät war (Kunde vs. Mitarbeiter im Namen des Kunden) | `PH Rendering Feedback.erfasst_von_user` (Link User) bei `quelle=backoffice` |
| Abnahme „Unterschriften erfassen“ offline | Erfassungszeitpunkt, Gerät | `unterschrift_erfassen(…, erfasst_am, geraet_id)`; Server speichert beides zusätzlich zu `unterzeichnet_am` |
| PA8 „Zeiten abgerechnet“ | Link Zeit → Rechnung | `PH Projektzeit.rechnung` (Link PH Rechnung) statt `beleg_ref` (P8) |
| PA9 Abbrechen „Folgen anzeigen“ | AB/Anzahlung/Herstellerbestellungen | siehe §5.1 |
| Zeitplan „Übergabe ziehen“ | – (soll **nicht** gehen, B6) | entfernen |
| Montage mobil „Abnahme“ | Teilabnahme | `PH Abnahme.art` (Teil/Schluss/Nachabnahme) (P7) |
| Produktpass „Garantie bis“ | Gewährleistung vs. Garantie | getrennte Felder (P10) |

Funktionen, die die App inzwischen hat, das Konzept aber nicht nutzt: `PH Planung.kunde_entscheidung/vorlage_dokument/freigabe_quelle` (Portal-Freigabe der Planung – Konzept §2.4 sagt „fehlt“), `PH Projekte Einstellungen.liefertermin_kunde_automatisch/maengel_erinnerung_tage/montage_kostensatz_cent`, `PH Montageauftrag.fahrzeug/kollisionen`, `PH Abnahme Position.verantwortlich/verantwortlich_ref/erinnert_am`, `utils/mappe.py` (Sammel-PDF – Konzept §6 sagt „fehlt“).

---

## 3. Fehlende Pflichtprozesse (Vorbild SHD: Auftrag → AB → Anzahlung → Lieferung → Montage → Rechnung → Service)

| # | Prozess | Stand App | Stand Konzept | Was das Konzept braucht |
|---|---|---|---|---|
| F1 | **Aufmaß** vor Planung (Küche/Bad) | PH Aufmass (Räume, Maße mm, Anschlüsse, Fotos, Plausibilität, Geprüft) | fehlt | Phase Planung: Regel „kein geprüftes Aufmaß → Aufmaß erfassen“ vor „Planung hochladen“; Kiosk-Ansicht für Planer/Monteur (PH Montage hat rwc); `PH Planung.aufmass` in Planungskopf |
| F2 | **Nachtrag / Änderungsauftrag** nach Auftrag | PH Nachtrag (neu/entfall/aenderung, Vorlage, Freigabe Kunde mit Unterschrift/Portal, `uebernommen`) | fehlt | eigener Tab „Nachträge“ in der Mappe, Inbox-Eintrag bei Kundenentscheidung, Regel §3.4 „Nachtrag vorgelegt > `freigabe_frist`“, **Übergabe an Faktura** (P9) |
| F3 | **Lieferstatus je Position / Nachlieferung / Transportschaden** | `lieferstatus`, `menge_bestellt/geliefert/montiert`, `nachlieferung_*`, `utils/lieferung.py` (Logik ohne Controller) | nur Positionsstatus geplant→montiert | Tab 2/5 mit Lieferstatus-Chips, „Nachlieferung anlegen“, Regel „Montage trotz offener Nachlieferung“ = Teilmontage (P7) |
| F4 | **Fremdgewerk-Abnahme und -Mängel** | `PH Fremdgewerk.abnahme_status/maengel/termine[]` | fehlt | Fremdgewerk-Drawer: Termine-Liste, Abnahme, Mängel mit `verantwortlich = Fremdgewerk`; PA8 prüft `abnahme_status` |
| F5 | **Geldfluss im Projekt** (Anzahlung angefordert/bezahlt, Nachträge, Teil-/Schlussrechnung, Gutschriften) | nur Summen aus AB (fehlerhaft, B2) | Karte „Zahlungsstand“ ohne Herkunft | Zahlungsplan aus `PH Auftragsbestaetigung.zahlungsplan`, je Zeile Rechnung + Zahlstatus; Regel „Montage abgenommen → Schlussrechnung stellen“ mit `leistungsdatum = Abnahme.unterzeichnet_am` (P11) |
| F6 | **Leistungsnachweis für Regie/Stunden** | Montagebericht mit Unterschrift, Projektzeiten | Unterschrift im Montagebericht = „Abnehmen“ | Montagebericht-Unterschrift als **Stundenbestätigung/Leistungsnachweis** benennen, Abnahme (Werk) nur im Abnahmeprotokoll; zwei Unterschriften klar trennen (Kundentext!) |
| F7 | **Kalkulation Soll/Ist** (Leitung) | `utils/kalkulation.py` (fehlerhaft, B3) | fehlt | Tab „Kalkulation“ (nur Leitung, permlevel 1) nach Korrektur P3 |
| F8 | **Übergabe-Unterlagen an den Kunden** | Druckformate vorhanden | nur Ablage in Mappe | Kopie des Abnahmeprotokolls verpflichtend an Kunden (Portal + Mail **oder** Papier, Kanal protokollieren); Pflegeanleitungen/Garantiebelege aus Produktpass |
| F9 | **Archiv / Aufbewahrung** abgeschlossener Projekte | `delete` für Leitung | „Abgeschlossen = readonly“ | Löschen ab „Auftrag“ verbieten, Aufbewahrungsdatum je Projekt (P12) |

---

## 4. Verstöße / Risiken Recht und Buchhaltung

| # | Thema | Befund | Norm (Hinweis) | Pflicht |
|---|---|---|---|---|
| R1 | Datenleck Auftragsmappe | B1 | DSGVO Art. 5 Abs. 1 lit. f, Art. 32 | P1 |
| R2 | Abnahmeprotokoll änderbar | B5 | Beweisfunktion, ABGB § 1167 iVm §§ 922 ff.; BAO § 131 Abs. 1 Z 6 (Unveränderbarkeit von Aufzeichnungen, soweit Grundlage der Rechnung) | P5 |
| R3 | Gewährleistungsbeginn | B6; zudem Produktpass zeigt „Garantie abgelaufen“ im Portal, ohne Hinweis auf gesetzliche Gewährleistung | ABGB §§ 924, 933; VGG; KSchG § 9b (Garantieerklärung muss auf Gewährleistungsrechte hinweisen) | P6, P10 |
| R4 | FAGG bei Bestellung | Regel §3.4 „Auftrag → Bestellen“ prüft weder `PH Auftragsbestaetigung.vertragsort` noch `fagg_frist_ende`. Aufmaß/Beratung beim Kunden → Vertrag außerhalb von Geschäftsräumen möglich | FAGG § 11 (Fristbeginn: bei Waren mit Erhalt der Ware), § 10 (ausdrückliches Verlangen bei Dienstleistung/Montage vor Fristende), § 16 (anteiliges Entgelt), § 18 Abs. 1 Z 3 (Maßanfertigung) | P13 |
| R5 | FAGG bei Portal-Freigaben | Nachtrag (`entscheidung_quelle = portal`) und Planungsfreigabe über Portal sind Vertragsänderungen im Fernabsatz | FAGG §§ 4, 5, 11; Informationspflichten vor Abgabe der Erklärung | P9 (Belehrungstext + `fagg_hinweis_bestaetigt`) |
| R6 | Leistungsdatum Rechnung | Projekt liefert kein Fertigstellungs-/Abnahmedatum an Faktura; Werklieferung mit Montage = Leistung mit Fertigstellung/Abnahme | UStG § 11 Abs. 1 Z 3 lit. d (Tag/Zeitraum der Leistung); § 19 Abs. 2 (Steuerschuld) | P11 |
| R7 | Anzahlungen | Anzahlungs-Ist aus AB, nicht aus vereinnahmten Zahlungen; Schlussrechnung muss Anzahlungen mit Entgelt und USt absetzen | UStG § 19 Abs. 2 Z 1 lit. a (Mindest-Istbesteuerung), § 11 Abs. 1 (Anzahlungsrechnungen) | P2, P11 |
| R8 | Reverse Charge Bau | Hotel/Objekt mit Generalunternehmer als Auftraggeber: Montage fest eingebauter Einrichtung kann Bauleistung sein → Steuerschuld geht über; Projekt kennt Auftraggeber-Art nicht | UStG § 19 Abs. 1a | P14 |
| R9 | Brutto/Netto in Nachtrag und Kalkulation | B3; B2B-Projekte (Hotel, Objekt, Yacht-Gesellschaft) werden netto angeboten | UStG § 11 (Entgelt + Steuerbetrag je Satz) | P3, P9 |
| R10 | Barinkasso bei Übergabe/Montage | Konzept sieht kein Inkasso vor, Praxis „Restzahlung bar an Monteur“ ist üblich | BAO §§ 131b, 132a (Registrierkassen-/Belegerteilungspflicht); Barumsatzverordnung § 7 (Umsätze außer Haus, Nacherfassung) | P15 |
| R11 | Zeit- und Statusdaten der Monteure | Stoppuhr, „Unterwegs“-Zeitstempel, `tatsaechlich_start/ende`, Report „Zeiten je Projekt“ nach Mitarbeiter = Kontrollsystem | ArbVG § 96 Abs. 1 Z 3 bzw. § 96a; ohne Betriebsrat AVRAG § 10 (Zustimmung); AZG § 26: PH Projektzeit ist **keine** Arbeitszeitaufzeichnung | P16 |
| R12 | E-Mail-Werbung | AU9 („Wie zufrieden?“ + Referenz-Anfrage) und AU10 (Pflege-Abo) sind Werbung, nicht Vertragsabwicklung | TKG 2021 § 174 (Einwilligung oder Bestandskunden-Ausnahme mit Widerspruchsmöglichkeit); `PH Kontakt.nicht_kontaktieren` | P17 |
| R13 | Fotos in Privatwohnungen, Unterschrift-Bilder, Sprachnotizen | keine Lösch-/Aufbewahrungsfristen; Integration liest Unterschrift (B7 h) | DSGVO Art. 5 Abs. 1 lit. c, e; Art. 13 (Information beim Foto vor Ort) | P12, P18 |
| R14 | Löschen von Belegen der Mappe | Leitung `delete` auf PH Montageauftrag, PH Abnahme, PH Projekt Dokument (Kategorie Rechnung/Lieferschein/Abnahmeprotokoll) | BAO § 132 (Aufbewahrung 7 Jahre, länger bei laufenden Verfahren) | P12 |
| R15 | KI-Kennzeichnung | Chip im Backoffice, Hinweis bei Freigabe; im Mappe-PDF/Statusbericht nicht vorgesehen | KI-VO (EU) 2024/1689 Art. 50 Abs. 4 (Offenlegung bei Bildinhalten, die real wirken) – Anwendbarkeit prüfen | Kennzeichnung auch in Druck/PDF |
| R16 | Gleichbehandlung | kein Befund mit GlBG-Bezug im Projektbereich (Rollenwerte nur intern; Anrede kommt aus PH Kontakt inkl. „Divers“) | GlBG | keine |

---

## 5. Randfälle – was fehlt und wie es aussehen muss

### 5.1 Storno (Projekt abbrechen nach Auftrag)
- Heute: PA9 bricht Montagen, Fremdgewerke, Aufgaben ab. AB, Anzahlung, Herstellerbestellungen, Produktpässe, Termine, Portal bleiben unberührt.
- Soll PA9 Schritt ② „Folgen“ (je Zeile Status ✓/⚠, Link, Haken):
  - AB (`PH Auftragsbestaetigung.status ≠ Storniert`) → „In Faktura stornieren“ (Faktura-Assistent, `storno_grund` vorbelegt).
  - Bezahlte Anzahlung → „Gutschrift/Rückzahlung oder Stornogebühr laut AGB“ (Auswahl; Stornogebühr nur, wenn vereinbart – Mäßigungsrecht ABGB § 1336 beachten; Text nicht generieren, AGB-Klausel anzeigen).
  - Herstellerbestellungen ≠ Entwurf → Liste mit „Lieferant informieren“ (Stornokosten des Lieferanten erfassen: `PH Herstellerbestellung.status = Abgesagt`, Kosten in Kalkulation).
  - Produktpässe → Status „Storniert“ (neu), aus Portal entfernen.
  - PH Termin ab heute → absagen.
  - Portal: `portal_sichtbar` bleibt an, Kopf „Projekt abgebrochen am …“ (Kunde braucht Belege).
- Fehlerfall: Faktura nicht installiert → Zeile „Belege in Faktura prüfen“ als Aufgabe an Leitung.
- „Zurück auf Neu“ nach Abbruch: nur, wenn AB nicht storniert **oder** neue AB folgt; Hinweis im Dialog.

### 5.2 Teillieferung / Teilmontage
- Regel §3.4 „Lieferung → Montage planen“ ändern: Bedingung = alle Positionen mit `montage_art = Eigenmontage` haben `lieferstatus in (geliefert, montiert, storniert)`; sonst Hinweis „3 Positionen fehlen (Nachlieferung KW 49) – Teilmontage planen?“ [Teilmontage planen] [Warten].
- PA2 Schritt ③: Leistungen nur aus gelieferten Positionen vorbelegt; fehlende grau mit Liefertermin.
- Nach Teilmontage: **Teilabnahme** (`PH Abnahme.art = Teil`), offene Positionen bleiben `geliefert`/`teilgeliefert`; zweiter Montageauftrag → Nachabnahme. `PH Projekt.abnahme` wird zur Liste (Abnahmen über `projekt`), `abnahme_anlegen` legt je Montageauftrag eine an.
- Teilrechnung erst mit Teilabnahme; `leistungszeitraum_von/bis` aus Montageaufträgen.
- Produktpässe nur für `lieferstatus in (geliefert, montiert)`, `lieferdatum` = Lieferscheindatum.

### 5.3 Anzahlung
- Karte „Zahlungsstand“ zeigt Zeilen aus `zahlungsplan` der AB: „Anzahlung 30 % · angefordert 14.10. (RE-…) · bezahlt 18.10.“ – Prozentsatz nur aus Daten, nie vorgeschlagen.
- „Bestellen“ trotz offener Anzahlung (Leitung): Pflicht-Kommentar „Grund“, erscheint in der Zeitleiste.
- Anzahlung in CHF: Betrag in Belegwährung, kein Umrechnen in der Karte (§5.5).
- Kunde zahlt Anzahlung bar im Showroom → Kassa (RKSV), Zahlung muss der Anzahlungsrechnung zugeordnet sein; Mappe zeigt Beleg-Nr. der Kassa.

### 5.4 Retoure / Rückgabe einzelner Positionen
- Fälle: FAGG-Rücktritt einer Fernabsatz-Position, Wandlung/Austausch über Servicefall, Kulanz-Rücknahme.
- Fehlt: `PH Projekt Position.lieferstatus` Wert `retourniert` (+ `retoure_grund`, `retoure_am`, `gutschrift` Link PH Gutschrift); `PH Produktpass.status` Wert `Retourniert`/`Storniert`; Montage-Leistung „Demontage“.
- UI: Positionszeile „Zurücknehmen…“ (Leitung) → Dialog Grund (FAGG/Gewährleistung/Kulanz), Abholtermin (Logistik), Gutschrift (Faktura). Kalkulation zieht VK und EK ab, Lieferanten-Rückgabe separat.

### 5.5 Fremdwährung CHF / Schweiz (und Deutschland, Yacht)
- `PH Projekt.waehrung` beim ersten Beleg aus `PH Auftragsbestaetigung.waehrung` setzen und sperren; Summen nur je Währung (B2).
- `objekt_land ≠ AT` → Kopf-Chip „Montage in CH“ und Prüfliste im Assistenten PA2:
  - Entsendung: Schweizer Meldeverfahren für entsandte Arbeitnehmer (Voranmeldung vor Arbeitsbeginn), A1-Bescheinigung (VO (EG) 883/2004) für DE und CH – Felder `PH Montageauftrag.entsendung_gemeldet_am`, `a1_vorhanden` (Check je Teammitglied).
  - Ware: Ausfuhr (Zollanmeldung, Ausfuhrnachweis für Steuerfreiheit), Einfuhr CH (MWST bei Einfuhr) – Bezug zu ph_logistik.
  - Umsatzsteuer: Werklieferung mit Montage in CH → Leistungsort CH; Schweizer MWST-Registrierung je nach Umsatz (Art. 10 MWSTG) – **Steuerberatung**; DE: Werklieferung in DE → ggf. Reverse Charge § 13b UStG (DE) bei Unternehmern, Registrierung bei Verbrauchern.
- Yacht: `objekt_land` = Liegeplatz-Land, Feld `objekt_hinweis` für Hafen; gleiche Prüfliste.
- Kalkulation: EK in Fremdwährung (`PH Herstellerbestellung.waehrung`) mit Kurs am Bestelldatum umrechnen, Kurs speichern.

### 5.6 Kunde ohne E-Mail
- Portal-Login unmöglich (`portal_login_token(email)`), Status-/Rendering-Mails gehen still nicht raus (B7 i).
- Soll:
  - Mappenkopf Chip „Kein Portal – Kunde ohne E-Mail“ (orange); Auge-Symbole zeigen „nur intern“.
  - `portal_status_senden` → Rückgabe `kanal = keiner`; Toast „Nicht zugestellt – Kunde hat keine E-Mail. Bevorzugt: Telefon.“ [Aufgabe „Kunde anrufen“ anlegen] [Brief drucken].
  - Freigaben (Planung, Rendering, Nachtrag) im Präsentationsmodus mit Unterschrift am iPad (`entscheidung_quelle = backoffice`, Unterschrift Pflicht bei Nachtrag).
  - Abnahmeprotokoll: Kopie ausgedruckt übergeben, Checkbox `kopie_uebergeben_kanal = Papier` Pflicht vor „Abschließen“.
  - Sprache aus `PH Kontakt.sprache` für Statustexte und Druck (`PH Abnahme.sprache`, `PH Montageauftrag.sprache_bericht` vorbelegen).

### 5.7 Weitere fehlende Randfälle
| Fall | Soll |
|---|---|
| Kunde verweigert Abnahme | `PH Abnahme.status` „Verweigert“ (+ `verweigerung_grund`, Zeuge `anwesend_studio`), Protokoll trotzdem ablegen; Folge: Leitungsaufgabe, kein „Übergeben“ |
| Kunde nicht anwesend bei Montageende | Montagebericht ohne Unterschrift mit `unterschrift_verweigert/abwesend` (Grund), Fotos nachher Pflicht; Abnahme separat terminieren |
| Kunde ist Unternehmen, unterschreibt ein Dritter (Hausverwaltung, Bauleiter) | `unterschrift_kunde_name` + `unterschrift_funktion` + `vollmacht_vermerk` |
| Rechnungsempfänger ≠ Projektkunde (Architekt, Hotelbetreiber, Leasing) | `PH Projekt.rechnungsempfaenger` (Link PH Kontakt) – Faktura übernimmt |
| Mängel-Frist überschritten durch Lieferant | `verantwortlich = Lieferant` → Regress im Servicefall (`regress_status`), Kunde-Info über Verzögerung |
| Rendering nach Freigabe geändert | Freigabe gilt nur für Version; neue Version setzt `freigabe_feedback` nicht mit (prüfen, Testfall) |
| Zwei Planer bearbeiten Mappe gleichzeitig | ist im Konzept (§3.7) – ok |
| Projekt mit mehreren ABs (Küche + später Garderobe) | Summen je AB, Projektphase über alle; Abschluss erst, wenn alle ABs abgerechnet |

---

## 6. Pflichtänderungen (konkret, nach Priorität)

### Hoch (vor jedem Staging-Test mit echten Daten)

**P1 – `ph_projekte.api.auftragsmappe` / `_optional`**
- `_optional`: Fehlt ein Filterfeld → **`None` zurückgeben** (Bereich „nicht verknüpft“), nie ungefiltert lesen.
- Bezug je DocType: PH Termin `ph_projekte_projekt`; PH Herstellerbestellung `bezug_doctype = "PH Projekt" AND bezug_name = projekt` (oder neues Feld `projekt` in ph_sortiment); PH Sendung über Lieferscheine des Projekts; Zahlungen über `PH Rechnung` (`projekt`) → Kindtabelle `zahlungen`; PH Gutschrift über `auftrag`/`rechnung` des Projekts ergänzen.
- Feldnamen korrigieren: `bestaetigter_termin`, `zeitpunkt`; `tracking_nummer` streichen oder in ph_logistik anlegen.
- Test: Mappe Projekt A darf keinen Datensatz mit `kontakt ≠ A.kontakt` enthalten (Abnahmekriterium neu).

**P2 – `ph_projekt.summen()` und PH Projekt Summenfelder**
- AB-Filter `status != "Storniert"` (nicht `docstatus`); Rechnungen `docstatus = 1 AND status not in ("Storniert","Entwurf")`; Gutschriften (`erstattet_cent`) abziehen.
- Neue Felder (permlevel 1, ro): `anzahlung_soll_cent`, `anzahlung_ist_cent` (statt `anzahlung_cent`), `abgerechnet_cent`, `gutschrift_cent`, `summen_stand_am` (Datetime).
- `waehrung` aus erster AB setzen; mehrere Währungen → `summen_warnung = "Belege in EUR und CHF – keine Summe"`, Karte zeigt je Währung.
- `nachtraege_cent` = Summe `differenz_cent` freigegebener, nicht stornierter PH Nachtrag.
- Konzept §2.13/PA8: „Schlussrechnung bezahlt“ = es existiert PH Rechnung `art = Schlussrechnung`, `status = Bezahlt` (nicht `offen_cent` der AB).

**P3 – Preisbasis Netto/Brutto**
- `PH Projekt Position`, `PH Planung Position`, `PH Nachtrag Position`: `preis_cent` umbenennen/ergänzen zu `vk_netto_cent` + `ust_satz_promille` (wie PH Beleg Position); Brutto nur berechnet.
- `utils/kalkulation.py`: VK netto; Rechnungen mit `netto_cent`; Filter auf `art == "Anzahlungsrechnung"`; Gutschriften negativ; Test mit Anzahlung + Schlussrechnung.
- `utils/nachtrag.py.projekt_aenderungen`: `aenderung` schreibt Menge und Preis fort (oder Kalkulation zählt `summe_aenderung_cent` nicht separat – eins von beidem).

**P4 – Mengen als Dezimalzahl mit Einheit**
- `menge`, `menge_bestellt`, `menge_geliefert`, `menge_montiert`, `nachlieferung_menge` → `Float` (Präzision 3) in PH Projekt Position, PH Planung Position, PH Nachtrag Position; neues Feld `einheit` (Select wie PH Beleg Position: Stk/Std/Pausch/m/m²/lfm/Set/Tag).
- `utils/lieferung.py`, `nachtrag.py`, `kalkulation.py`, `kuechenplanung.py`: `_int` → Dezimal (Cent-Rundung erst am Betrag).

**P5 – Unveränderbarkeit nach Unterschrift (PH Abnahme, PH Montageauftrag)**
- `unterschrift_erfassen`: werfen, wenn `unterschrift_kunde` schon gesetzt („Protokoll ist bereits unterschrieben.“); Montage nur in Status `Erledigt`; Abnahme nur in `Entwurf`.
- `PH Abnahme.validate`: ab Status ≠ Entwurf Änderungen an `positionen` (außer `erledigt/erledigt_am/servicefall_ref`), `vorbehalte`, `datum`, `ort`, Unterschriften → Fehler. Korrektur nur über „Zurück“ (Leitung) **mit Pflichtgrund** und neuer Unterschrift; altes PDF bleibt.
- Neue Felder PH Abnahme: `protokoll_dokument` (Link PH Projekt Dokument, ro), `protokoll_sha256` (ro), `kopie_an_kunde_am` (Datetime, ro), `kopie_kanal` (Select Portal/E-Mail/Papier). `protokoll_als_dokument` läuft **automatisch** bei Unterzeichnen.
- `delete` für Leitung auf PH Abnahme/PH Montageauftrag nur im Status Entwurf/Geplant (`on_trash`-Prüfung).
- Gleiches für `PH Nachtrag.unterschrift_kunde`.

**P6 – Übergabe- und Gewährleistungsdatum**
- `PH Projekt.uebergabe_am` read-only; gesetzt aus `PH Abnahme.unterzeichnet_am` (Schlussabnahme) bzw. bei Ware ohne Montage aus Lieferschein-Zustelldatum. Änderung nur Leitung über Methode `uebergabe_korrigieren(datum, grund)` mit Zeitleisteneintrag.
- Konzept: Termin-Chip „Übergabe“ und Gantt-Ziehen entfernen; Chip zeigt Datum + Quelle („aus Abnahme PH-ABN-…“).

**P7 – Teilabnahme und Positionsbezug**
- `PH Abnahme.art` (Select Teil/Schluss/Nachabnahme, Pflicht), `PH Abnahme Position.projekt_position` (Data = Name der Kindzeile, statt Zuordnung über Text).
- `PH Projekt.abnahme_anlegen(montageauftrag)`: idempotent **je Montageauftrag**, nicht je Projekt; `PH Projekt.abnahme` → nur „Schlussabnahme“.
- `montageauftrag_anlegen`: Leistungen aus `lieferstatus in (geliefert, teilgeliefert)` und `montage_art in ("", "Eigenmontage")`, nie `storniert`.

**P8 – PH Projektzeit Abrechnung**
- Neues Feld `rechnung` (Link PH Rechnung, permlevel 1); `als_abgerechnet` nur aus Faktura (beim Stellen der Rechnung) oder mit `rechnung`; nur Status `Offen` + `abrechenbar = 1`.
- Sperre nach Abgerechnet für **alle** Felder außer `beschreibung`; bei Storno der Rechnung (Gutschrift) zurück auf `Offen`.
- `user ≠ session.user` nur für Leitung oder Montageleiter des verknüpften Montageauftrags.
- `PH Montageauftrag.zeit_buchen(…, datum)`: Datum als Parameter.

**P9 – Nachtrag ins Konzept und an Faktura**
- Konzept: Tab „Nachträge“ (Liste, Status-Badges Entwurf/Vorgelegt/Freigegeben/Abgelehnt/Storniert, Summe ±), Assistent „Nachtrag anlegen“ (Positionen aus Projekt wählen: entfall/aenderung; neu), Vorlage an Kunden wie Rendering, Inbox-Eintrag bei Entscheidung.
- App: bei Freigabe `PH Nachtrag.uebernommen` erst setzen, wenn **AB-Änderung oder Nachtrags-AB** in ph_faktura erzeugt ist (`PH Nachtrag.auftragsbestaetigung` Link neu); bis dahin Hinweis „Nachtrag freigegeben – AB noch nicht angepasst“.
- Portal-Freigabe: Feld `fagg_hinweis_bestaetigt` (Check, ro) + Belehrungstext-Version, wenn Kunde Verbraucher und `entscheidung_quelle = portal`.
- Beträge netto + USt-Satz (P3); `waehrung` = Projektwährung, nicht frei.

### Mittel

**P10 – Produktpass Garantie/Gewährleistung**
- `PH Produktpass`: `gewaehrleistung_bis` (ro, aus Übergabedatum + Frist nach Sachart, Logik aus ph_service wiederverwenden), `garantie_geber` (Hersteller/Studio), `garantie_monate` aus PH Produkt/Lieferant vorbelegen.
- Portal-Text bei abgelaufener Garantie: „Herstellergarantie abgelaufen. Ihre gesetzlichen Gewährleistungsrechte bleiben davon unberührt.“
- Status `Retourniert`, `Storniert` ergänzen; `produktpaesse_erzeugen` nur für geliefert/montiert; `lieferdatum` aus Lieferschein.

**P11 – Leistungsdatum an Faktura**
- Methode `PH Projekt.leistungsdaten()` → `{leistungsdatum, leistungszeitraum_von, leistungszeitraum_bis, abnahme}` aus Abnahmen/Montageaufträgen; Faktura-Assistent „Schlussrechnung“ übernimmt sie in `PH Rechnung.leistungsdatum/leistungszeitraum_*`.
- Regel §3.4 Übergabe: „Abnahme unterzeichnet, keine Schlussrechnung → Schlussrechnung stellen (Faktura)“.

**P12 – Aufbewahrung und Löschung**
- `PH Projekt.aufbewahren_bis` (Date, ro): Ende Gewährleistung bzw. BAO-Frist, das spätere Datum; Löschen/Anonymisieren erst danach (Abgleich mit `PH Kontakt.aufbewahren_bis`).
- `on_trash` PH Projekt/PH Projekt Dokument: verboten, wenn Status ≥ Auftrag bzw. `kategorie in (Rechnung, Lieferschein, Abnahmeprotokoll, Montagebericht, Vertrag)`.
- Fotos/Sprachnotizen: Löschfrist als Einstellung `PH Projekte Einstellungen.medien_loeschen_nach_monaten` (Wert durch Inhaber/Datenschutz, kein Standardwert vorgeben).

**P13 – FAGG in Regel „Bestellen“**
- `auftragsmappe` liefert je AB `vertragsort`, `fagg_frist_ende`; Regel Auftrag → Bestellen: innerhalb der Frist Hinweis „Rücktrittsfrist bis 18.11. – Bestellung nur bei Maßanfertigung oder ausdrücklichem Verlangen des Kunden“ + Checkbox-Nachweis `PH Auftragsbestaetigung.fagg_vorzeitig_verlangt` (ph_faktura). Montage innerhalb der Frist gleiche Prüfung.
- Aufmaß/Beratung beim Kunden (PH Aufmass mit Termin vor Ort) → Hinweis „Vertragsort ‚Beim Kunden‘ prüfen“ beim Angebot.

**P14 – Auftraggeber-Art (Reverse Charge, B2B)**
- `PH Projekt.auftraggeber_art` (Select Verbraucher/Unternehmer/Generalunternehmer/Öffentliche Hand), `rechnungsempfaenger` (Link PH Kontakt), `bauleistung_hinweis` (Check: „Montage fest verbunden – § 19 Abs. 1a prüfen“); Faktura übernimmt in `ust_fall`.
- Objekt/Hotel B2B: Haftrücklass/Sicherheitseinbehalt als Zahlungsplanzeile sichtbar (nur wenn vereinbart, Betrag aus AB).

**P15 – Inkasso bei Montage/Übergabe**
- Kiosk Montage: **kein Barinkasso** ohne RKSV-Beleg. Optionen: (a) Knopf „Restzahlung kassieren“ → Arbeitsplatz Kassa im Kiosk mit Kartenterminal und RKSV-Beleg, (b) Hinweis „Zahlung per Überweisung – QR auf Rechnung“. Falls Bar zugelassen wird: Handbeleg mit Durchschrift, Nacherfassung in der Kassa (Barumsatzverordnung) – Felder `PH Montageauftrag.inkasso_cent` (permlevel 1), `inkasso_beleg_nr`, `inkasso_nacherfasst_am`. Entscheidung Inhaber + Steuerberatung.

**P16 – Mitarbeiterdaten (Montage-Zeitstempel, Stoppuhr, Reports)**
- Report „Zeiten je Projekt“ gruppiert nach Mitarbeiter nur Leitung; Statuszeitstempel nicht als Leistungsbewertung auswerten; Info an Mitarbeiter; Betriebsvereinbarung bzw. Zustimmung nach AVRAG § 10 vor Livegang.
- Konzepttext: „PH Projektzeit ersetzt nicht die Arbeitszeitaufzeichnung (ph_personal)“; Fahrzeit (`taetigkeit = Fahrt`) an ph_personal melden, keine Doppelerfassung.

**P17 – Automationen AU9/AU10 nur mit Einwilligung**
- Vor Versand prüfen: `PH Kontakt.nicht_kontaktieren = 0` und Einwilligung bzw. Bestandskunden-Voraussetzungen (TKG § 174) – Feld/Methode aus ph_crm/ph_marketing nutzen; Abmeldelink in jeder Nachricht. AU1–AU8 (Vertragsabwicklung) sind nicht betroffen.

**P18 – Rechte und Datenminimierung**
- PH Website Integration: `read` auf PH Montageauftrag entfernen oder Unterschrift/Telefon/Fotos auf permlevel 2 legen; Portal liest Montagetermine über `portal_appointments`.
- PH Montage: Workflow-Transitionen PH Montageauftrag (Losfahren, Beginnen, Erledigt melden, Zurück Unterwegs→Geplant) und PH Abnahme (Unterzeichnen, Mängel feststellen); `create` auf PH Projektzeit (nur eigene/Team-Zeiten), PH Tagebuch Foto (nur `von = team`). Kiosk-Liste per `User Permission` auf Aufträge mit eigenem `team.user`.

### Niedrig
- **P19** `PH Montageauftrag.on_update`: `montage_von/bis` aus Min/Max aller nicht abgebrochenen Aufträge neu berechnen (inkl. `ende`).
- **P20** `portal_status_senden`/`kunden_vorlegen`: Text in `PH Kontakt.sprache`; Rückgabe Kanal (siehe §5.6).
- **P21** L3: `doc_event` PH Auftragsbestaetigung → Hinweis „AB vorhanden – Beauftragen?“ in der Mappe (kein stiller Phasensprung).
- **P22** `PH Rendering Feedback.erfasst_von_user` für Präsentationsmodus.
- **P23** `PH Abnahme.status` + Workflow: „Verweigert“; `PH Montageauftrag.unterschrift_status` (unterschrieben/verweigert/abwesend).

### 6.1 Korrekturen am Konzepttext (10-konzept-projekte.md)

| Stelle | Korrektur |
|---|---|
| §0 / §2.0 | Seiten/Tabs ergänzen: „Aufmaß“, „Nachträge“, „Kalkulation“ (Leitung); Pills um „Nachträge“ |
| §1.3 L3 | „automatisch“ streichen → Hinweis + Leitungsklick (P21) |
| §2.4 Lücken | Portal-Freigabe der Planung existiert jetzt (`kunde_entscheidung`, `vorlage_dokument`, Status „Aenderung gewuenscht“) – Lücke streichen, Status ergänzen |
| §2.8 / §4.3 / §12 | Rolle PH Montage: Rechte teilweise vorhanden, Workflow/Projektzeit/Tagebuch fehlen (B7 g) |
| §2.9 / PA5 | Teilabnahme, Verweigerung, Sperre nach Unterschrift, automatische Protokollablage + Kopie an Kunden |
| §2.10, §3.1 | Übergabe nicht ziehbar/inline (P6) |
| §2.13 / L7 | „Als abgerechnet (Belegnr.)“ → Abrechnung über Faktura mit Rechnungs-Link (P8) |
| §2.14 / PA6 | nur geliefert/montiert; Gewährleistung vs. Garantie (P10) |
| §3.2 Tab 2 | Spalten `lieferstatus`, Menge mit Einheit, `montage_art`, Nachlieferung |
| §3.2 Tab 4 | Gutschriften, Zahlungsplanzeilen, Währung; Hinweis „Summen Stand 02:30“ |
| §3.4 | Regeln ergänzen: Aufmaß, Nachtrag offen, FAGG-Frist, Teilmontage, Schlussrechnung; Regel „Lieferung → Montage planen“ nach §5.2 |
| §4.6 PA8 | Prüfliste: alle ABs abgerechnet, Schlussrechnung gestellt **und** bezahlt (aus Rechnung), Nachträge entschieden + in AB, Fremdgewerk-Abnahmen, Protokollkopie übergeben |
| §4.6 PA9 | Folgen-Schritt nach §5.1 |
| §6 | „Sammeldruck fehlt“ → `utils/mappe.py` vorhanden (Endpunkt `auftragsmappe_pdf` prüfen) |
| §7.1 | Inkasso (P15); „7:28 h für das Team buchen“ nur für Teammitglieder (P8) |
| §8.2 AU9/AU10 | Einwilligungsprüfung (P17) |
| §10 | neue Kriterien: (41) Mappe enthält nur Datensätze des Projektkunden (P1); (42) stornierte AB zählt nicht im Auftragswert (P2); (43) unterschriebene Abnahme ist per API nicht änderbar (P5); (44) 2,5 lfm bleibt 2,5 (P4); (45) Kunde ohne E-Mail: „Status senden“ meldet „Nicht zugestellt“ (§5.6) |

---

## 7. Offene Fragen an Inhaber / Steuerberatung / Datenschutz (keine Annahmen im Bau)

| An | Frage |
|---|---|
| Inhaber | Dürfen Monteure Bargeld annehmen? (bestimmt P15) |
| Inhaber | Wer darf Projekte nach Abschluss wieder öffnen – und mit welchem Grund? (Workflow hat kein „Zurück“) |
| Inhaber | Stornoregel bei Abbruch nach Auftrag (AGB-Klausel vorhanden?) |
| Steuerberatung | Montage von Einbauküchen/Bädern für Generalunternehmer: § 19 Abs. 1a UStG anwendbar? Leistungsort bei Montage in CH/DE, Registrierungspflichten |
| Steuerberatung | Leistungsdatum bei Teilabnahmen: Teilrechnung je Teilabnahme oder Schlussrechnung gesamt? |
| Datenschutz | Aufbewahrungs-/Löschfristen für Montagefotos, Unterschriftsbilder, Sprachnotizen, Bautagebuch |
| Datenschutz / Arbeitsrecht | Betriebsrat vorhanden? Sonst Zustimmungen nach AVRAG § 10 für Status-Zeitstempel und Stoppuhr |
| Rechtsberatung | Unterschrift auf iPad (einfache elektronische Signatur) als Abnahmenachweis ausreichend? Zusätzliche Sicherung (Hash, Kopie per Mail) empfohlen? |
| Inhaber | Preise bleiben im Portal aus (`portal_positionen_preise = 0`) – gilt das auch für Nachträge? (Nachtrag ohne Preis kann der Kunde nicht wirksam freigeben) |

---

*Ende 21 – Fachkritik Projekte. Grundlage: Dateistand ph_projekte 2026-11-04 11:59; neu hinzukommende Controller-Methoden (Lieferung, Nachtrag, Kalkulation) vor dem Bau erneut gegen §6 prüfen.*
