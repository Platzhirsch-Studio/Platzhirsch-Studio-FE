# 21 – Fachkritik Bereich „Marketing“ (Konzept 10 gegen App ph_marketing)

**Zweck:** Fachliche und rechtliche Prüfung von `10-konzept-marketing.md` gegen den Datenbestand `Backend-Import/ph_marketing` (README, alle 20 DocType-JSONs, Dokumentmethoden, `newsletter.py`, `events.py`, `engine.py`, `empfehlung.py`, `ereignisse.py`, `einwilligung.py`, `utils/regeln.py`, `api/__init__.py`, `fixtures/workflow.json`, Report `ph_kampagnen_roi`) sowie die berührten DocTypes anderer Apps (`ph_crm` PH Kontakt, `ph_faktura` PH Auftragsbestaetigung/PH Eingangsrechnung, `ph_shop` PH Gutschein, `ph_logistik` PH Lieferschein). Ergebnis: Note, Fehlannahmen, Rechts- und Buchhaltungsbefunde, fehlende Prozesse, Randfälle, Pflichtänderungen mit DocType/Feld.
**Stand:** 2026-11-04 · Rolle: Fachkritiker Möbelhandel (österreichisches Recht: TKG 2021, ECG, DSGVO, FAGG, UStG, RKSV/BAO, GlBG, UrhG) + Frappe-Datenprüfer · Status: Prüfbericht, keine Rechtsberatung. Jeder Rechtspunkt ist eine Frage an die Kanzlei, bevor Schalter umgelegt werden.
**Nicht geändert:** `backoffice/`, `Backend-Import/`, `src/`. Fristen und Beträge, die die Kanzlei oder der Steuerberater festlegen muss, sind als `‹Kanzlei›` / `‹StB›` markiert – keine erfundenen Zahlen.

---

## 0. Urteil

**Note: 6 / 10.**

| Stärke | Schwäche |
|---|---|
| Sehr vollständige Abbildung der DocTypes, Workflows, Methoden und Scheduler-Läufe auf Seiten; Lückenliste L1–L21 ist ehrlich. | Das Konzept übernimmt drei **rechtliche Fehlkonstruktionen der App** ungeprüft (Event-Anmeldung erzeugt „Einladungen“-Einwilligung, B-Grundlage liest ein falsch belegtes Feld, Empfehlungs-Rücktrittsfrist ab Auftragsdatum). |
| Rechtsregeln als Ampel mit Satz statt Fehlermeldung – richtiger Ansatz für Nicht-IT-Mitarbeiter. | Mitarbeiter können über „Einwilligung erfassen“ ohne DOI und ohne Beleg eine **wirksame E-Mail-Werbe-Einwilligung** anlegen – das Konzept beschreibt den Server falsch („setzt Bestätigung mit Beleg“). |
| Claim-Guard, Testmodus-Band, Kanzlei-Schalter sauber sichtbar. | Buchhaltungslogik fehlt fast ganz: Empfehlungsgutschein (Mehrzweck vs. unentgeltlich), Kampagnenkosten ohne Eingangsrechnung, ROI auf Brutto und ohne Storno/Gutschrift/CHF. |
| Kiosk-Check-in mit Offline-Puffer durchdacht. | Randfälle Storno, Teillieferung, Anzahlung, Retoure, CHF und „Kunde ohne E-Mail“ sind praktisch nicht behandelt. |
| | Zwei Lücken (L11, L12) sind im Datenbestand bereits geschlossen; eine Kernfunktion („Ideen ohne Datum“) widerspricht einem Pflichtfeld. |

Die Oberfläche ist umsetzbar; vor einem Live-Betrieb müssen die P0-Änderungen aus §7 in `ph_marketing`, `ph_crm`, `ph_shop` und `ph_faktura` umgesetzt sein.

---

## 1. Fehlannahmen des Konzepts gegenüber dem Datenbestand

| # | Konzept sagt (Stelle) | Datenbestand zeigt | Folge für die UI |
|---|---|---|---|
| F1 | L12: `PH Einwilligung.zweck` kennt `whatsapp`, `foto_referenz`, `kundenkarte_auswertung` nicht (§2.5, §9.3) | Select-Optionen enthalten alle neun Zwecke inkl. `kundenkarte_auswertung` (`ph_einwilligung.json`) | Lücke streichen; Zwecke einblenden. Aber: `PH Kundenreise.zweck` kennt `kundenkarte_auswertung` **nicht** – dort ergänzen oder bewusst ausschließen. |
| F2 | L11: `PH Empfehlung.status` ohne „Verfallen“/„Abgelehnt“ | Select enthält beide Optionen | Lücke streichen; Akte in diesen Status nicht schreibschützen wegen Select. Bleibt offen: **kein Prozess setzt „Verfallen“** (kein Scheduler, keine Frist) → §5 P-M9. |
| F3 | „+ Einwilligung erfassen“: „`before_insert` setzt bei Kanal ≠ website Bestätigung mit Beleg“ (§2.5) | `before_insert` setzt `status = Bestaetigt`, wenn `doi_noetig = 0` – ohne Beleg, ohne Rolle. `validate` blockt nur `kanal = website` für `newsletter`/`einladungen`. Mitarbeiter haben `create = 1`. | Jede Mitarbeiterin erzeugt mit Kanal „telefon“ sofort eine wirksame Werbe-Einwilligung ohne Nachweis → Rechtsbefund R2. |
| F4 | „innerhalb einer Stunde keine zweite DOI-Mail – Server wirft Fehler“ (§2.4 Abo-Akte) | Die 1-h-Sperre gibt es nur in `newsletter.anmelden`. `PH Newsletter Abo.doi_erneut_senden` → `newsletter.doi_erneut_senden` hat **keine** Sperre und setzt auch `Abgemeldet`/`Bounce` zurück auf `Angemeldet unbestaetigt`. | Massenaktion „DOI erneut senden“ kann Abgemeldete anschreiben → R4. |
| F5 | Social-Kalender: Leiste „Ohne Datum (Ideen)“, Drag auf Tag = Planen (§2.9) | `PH Social Beitrag.datum_geplant` ist `reqd = 1` | Ideen ohne Datum sind nicht speicherbar. Entweder Feld nicht Pflicht (App-Änderung, §7 P1-12) oder Ideenleiste streichen. |
| F6 | „Als durchgeführt schließen“ nur Leitung, „Server lehnt vor dem Datum ab“ (§2.8) | `als_durchgefuehrt` prüft nur `write` (Mitarbeiter haben write). Zusätzlich setzt `events.vergangene_schliessen` (08:00) jedes Offen/Ausgebucht-Event am Folgetag automatisch auf Durchgefuehrt. | Knopf ist praktisch nie nötig; Rollenangabe stimmt nicht. Check-in-Nachträge („nicht erschienen“) nach dem Abend bleiben möglich, weil `teilnehmer_status` den Event-Status nicht prüft. |
| F7 | `abbrechen` nur Leitung (§4.1/§4.2) | Workflow: ja; Methode `abbrechen` prüft nur `write` | Server-seitig absichern (§7 P1-9). |
| F8 | Vorlagen-Editor nur Leitung (§2.11) | `PH Mail Vorlage`: Mitarbeiter `write = 1` | UI-Sperre allein reicht nicht; Mitarbeiter können Texte aktiver Reisen über die API ändern. |
| F9 | Event-Löschfrist: „Anonymisierung nach 3 Monaten“ (§11.4) | `anmeldedaten_loeschen` anonymisiert nur die Kindzeilen. Die bei jeder Anmeldung angelegte `PH Einwilligung` (Zweck `einladungen`, E-Mail im Klartext, `referenz = PH Event`) bleibt unbegrenzt. | Versprechen „Löschfrist“ wird nicht eingehalten → R6. |
| F10 | Zwischenlösung L1: `insert PH Newsletter Abo` + `doi_erneut_senden()` | Dabei entsteht **keine** `PH Einwilligung` mit Textversion zum Zeitpunkt der Erklärung; erst `bestaetigen` legt nachträglich eine an (mit `abo.textversion`, die beim Insert leer sein kann). | Nachweis Art. 7 Abs. 1 DSGVO lückenhaft. Zwischenlösung verwerfen; nur `newsletter.anmelden` (whitelisted Wrapper) verwenden. |
| F11 | Abo-Akte Route `/marketing/abos/[email]` | `autoname = field:email` | Adressänderung eines Kunden ist ohne Umbenennen nicht möglich; Konzept hat keinen Ablauf dafür → §6 Randfall. |

---

## 2. UI-Funktionen ohne Datenfeld oder Methode (zusätzlich zu L1–L21)

| # | UI-Funktion (Konzept §) | Fehlt | Pflicht-Lösung |
|---|---|---|---|
| U1 | Check-in-Uhrzeit (§7.1) | Feld | `PH Event Anmeldung.erschienen_am` (Datetime, ro), gesetzt in `teilnehmer_status` |
| U2 | Nachrücken von der Warteliste (§2.8) | Statuswechsel `warteliste → angemeldet` in `teilnehmer_status` verboten | Methode `PH Event.nachruecken(zeile)` mit Kapazitätsprüfung + Mail „Platz frei geworden“ (Vorlage `event_nachrueck`) |
| U3 | Absage-Info an Teilnehmer (§2.8) | Methode, Vorlage | `PH Event.absagen(grund, mail=1)` + Vorlage `event_absage` (Art System, Fußzeile S) |
| U4 | Einwilligung per Papier mit Beleg (§2.5) | Feld für Erteilungsbeleg | `PH Einwilligung.erteilung_beleg` (Attach), Pflicht bei `kanal = papier` |
| U5 | WhatsApp-Einwilligung (§2.5 Zwecke) | Telefonnummer | `PH Einwilligung.telefon` (Data/Phone); bei `zweck = whatsapp` Pflicht, `email` dann optional |
| U6 | Foto-Referenz-Einwilligung für Kunden ohne E-Mail | `email` ist `reqd` | `email` nur Pflicht, wenn `zweck` ∈ DOI_ZWECKE; sonst `kontakt` oder `telefon` Pflicht |
| U7 | Gutschein in der Empfehlungs-Akte (rechte Spalte, §2.10) | Verknüpfung | `PH Empfehlung.gutschein` (Link PH Gutschein); `gutschein_code_letzte4` nur noch Anzeige |
| U8 | „Auftrag nicht storniert?“ (M8, §4.4) | automatische Prüfung | `PH Empfehlung.auftrag` → Link `PH Auftragsbestaetigung`; `empfehlungen_pruefen` liest `status`, `storniert_am`, `offen_cent` |
| U9 | Empfehlung im Showroom ohne Website-Anfrage | Code-Feld am Auftrag | Custom Field `PH Auftragsbestaetigung.ph_empfehlungscode` (Data) + `PH Anfrage.ph_empfehlungscode`; `anfrage_eingang` liest das Feld statt Freitext „eingewilligt“ |
| U10 | Kampagnenkosten belegt (§2.7 Kennzahlen) | Bezug zur Eingangsrechnung | Custom Field `PH Eingangsrechnung.ph_marketing_kampagne` (Link PH Kampagne); `PH Kampagne Kennzahl.eingangsrechnung` (Link) |
| U11 | Kosten netto/brutto (§2.7) | Kennzeichnung | `PH Kampagne Kennzahl.kosten_art` (Select `netto`/`brutto`, Standard netto) oder fest „netto“ in Feldbeschreibung + Server-Regel |
| U12 | CHF-Kosten (§2.7, Feld „Währung“) | Umrechnung | `PH Kampagne Kennzahl.waehrung`, `kurs`, `kosten_eur_cent`; Aggregat nur über `kosten_eur_cent` |
| U13 | „Wer wäre heute fällig“ (L5) | Trockenlauf | `PH Kundenreise.trockenlauf(datum)` → Liste ohne Insert (gleiche Logik wie `planen_fuer`, ohne `insert`) |
| U14 | Kundenreise: übersprungene Kontakte ohne E-Mail sichtbar | Protokoll | `faellige_kontakte` verwirft `email`-lose Kontakte stumm → Zeile `PH Reise Versand` mit `status = uebersprungen`, `grund = keine_email`, `empfaenger` leer erlauben |
| U15 | Freigabe einer Kundenreise bleibt nach Änderung gültig? | Rückfall | `PH Kundenreise.validate`: Änderung an `werbung`, `grundlage_*`, `zweck`, `vorlage`, `trigger`, Segmenten bei Status Aktiv → Status `Entwurf`, `aktiv = 0`, Kommentar „Freigabe aufgehoben: Regel geändert“ |
| U16 | Abmeldelinks älterer Newsletter (§2.3 Fußzeile) | Token je Versand | heute rotiert `versand_stapel` und `engine._abmelde_link` den einzigen `abmelde_token_hash` des Abos bei jeder Mail → alle älteren Links ungültig. Neu: `PH Newsletter Versand.abmelde_token_hash` und `PH Reise Versand.abmelde_token_hash`; `abmelden_mit_token` sucht in Abo **und** Versandzeilen |
| U17 | Kundenakte Tab Marketing: „Nicht kontaktieren“ wirkt (§3) | Synchronisation | Hook `PH Kontakt.on_update`: `nicht_kontaktieren = 1` → Abo `abmelden(kanal="backoffice", grund="Widerspruch Art. 21")`, Einwilligungen `widerrufen`; `newsletter.empfaenger_fuer` prüft zusätzlich `PH Kontakt.nicht_kontaktieren` und `Email Unsubscribe` |
| U18 | Auskunftsfrist (Art. 12 Abs. 3) | Vorgang | Kein DSGVO-Vorgang in `ph_crm`/`ph_marketing`. DocType `PH Datenschutz Anfrage` (Art: Auskunft/Löschung/Berichtigung/Widerspruch, `eingang`, `frist`, `erledigt_am`, `antwort_beleg`) – App-Zuordnung ph_crm |
| U19 | Testmail nur intern | Empfänger-Beschränkung | `testmail(empfaenger)` in Ausgabe/Reise nimmt jede Adresse → Server erlaubt nur `test_empfaenger`, `team_email` oder Domain aus `PH Marketing Einstellungen.test_domains` (neu, Data) |
| U20 | Paid Event / Kostenbeitrag | Felder | `PH Event.kostenlos` existiert, aber kein Preis, keine Zahlung → §5 P-M7 |
| U21 | Bild-Einwilligung abgebildeter Personen/Kundenräume (Social, Newsletter-Slot „eigen“) | Bezug | `PH Social Beitrag.einwilligung` und `PH Newsletter Block.einwilligung` (Link PH Einwilligung, Zweck `foto_referenz`); Option `bildquelle` „eigen – Kundenprojekt“ |
| U22 | Bezahlte Kooperation kennzeichnen (Social) | Feld | `PH Social Beitrag.kommerziell` (Select `nein`/`Kooperation Hersteller`/`bezahlt`) + Pflicht-Hinweistext „Anzeige/Werbung“ im `text` bei ≠ nein |

---

## 3. Rechtsbefunde (Konzept übernimmt oder verschärft)

| # | Norm | Befund (Datei/Feld) | Schwere | Pflichtänderung |
|---|---|---|---|---|
| R1 | TKG 2021 § 174 Abs. 3, DSGVO Art. 6/7 | `events.anmelden` legt bei **jeder** Event-Anmeldung `PH Einwilligung` mit `zweck = einladungen`, `bestaetigt = True` an (Kommentar: „Art. 6 Abs. 1 lit. b, kein DOI“). `engine.faellige_kontakte` (Auslöser `event`) und `darf_senden` (Grundlage E) nutzen genau diese Einträge für künftige werbliche Einladungen. Teilnahme an einem Abend ist keine Einwilligung in künftige E-Mail-Werbung. Bei Telefon-/Backoffice-Anmeldung gibt es nicht einmal einen Hinweistext. | **P0** | Neuer Zweck `event_teilnahme` (nur Nachweis Hinweistext, nie Werbegrundlage) in `PH Einwilligung.zweck` und `regeln.ZWECKE`; `einladungen` nur, wenn die Anmeldung eine eigene, nicht vorangekreuzte Checkbox `einladungen_ok` trägt (neues Feld `PH Event Anmeldung.einladungen_ok`, API-Parameter `einladungen_ok`) – dann mit DOI (`doi_noetig = 1`). Bestehende Einträge mit `quelle like "event:%"` und `daten_json.art = event_anmeldung` per Patch auf `event_teilnahme` umschlüsseln. |
| R2 | TKG 2021 § 174 Abs. 3, DSGVO Art. 7 Abs. 1 | `PH Einwilligung.before_insert`: Kanal `telefon/showroom/backoffice/email` → sofort `Bestaetigt`, ohne Beleg und ohne Rollenprüfung (F3). Für E-Mail-Werbung trägt Platzhirsch die Beweislast. | **P0** | `validate`: Zweck ∈ `DOI_ZWECKE` und `kanal ≠ papier` → `doi_noetig = 1` erzwingen (DOI-Mail geht automatisch). `kanal = papier` → `erteilung_beleg` Pflicht. `bestaetigen_mit_beleg` bleibt Leitung. UI-Dialog M5: Kanal-Auswahl zeigt sofort „Bestätigungsmail wird gesendet“ bzw. „Unterschriebenes Formular hochladen“. |
| R3 | TKG 2021 § 174 Abs. 4 (Bestandskunden-Ausnahme) | `engine.darf_senden` verlangt für B `PH Kontakt.widerspruchshinweis_am` + `_quelle`. In `ph_kontakt.json` heißen diese Felder „Widerspruch am“/„Widerspruch über“ und hängen an `nicht_kontaktieren` (`depends_on`, `mandatory_depends_on`). Sie dokumentieren also den **Widerspruch**, nicht den gesetzlich geforderten **Hinweis auf das Ablehnungsrecht bei Erhebung**. Ergebnis: B greift nie (gesetzt nur bei `nicht_kontaktieren = 1`, das vorher abbricht) – oder, falls jemand die Felder ohne Häkchen befüllt, mit falscher Bedeutung. | **P0** | `PH Kontakt` (ph_crm): neue Felder `werbehinweis_am` (Date), `werbehinweis_quelle` (Select `AB-Formular`/`Kassabeleg`/`Showroom-Formular`/`Shop-Checkout`), `werbehinweis_textversion` (Data); bestehende Felder umbenennen in `widerspruch_am`/`widerspruch_kanal`. `engine.darf_senden` liest `werbehinweis_*`. Setzen automatisch beim AB-Druck (ph_faktura) und Shop-Checkout, wenn der Hinweistext Teil der Vorlage ist. |
| R4 | TKG 2021 § 174, DSGVO Art. 21 Abs. 3 | `doi_erneut_senden` erlaubt Status `Abgemeldet` und `Bounce` (F4). Eine DOI-Mail an eine abgemeldete Adresse ist eine unerbetene Nachricht. | **P0** | Methode nur bei `status = Angemeldet unbestaetigt`; 1-h-Sperre über `doi_gesendet_am`; Höchstzahl DOI-Mails je Abo `‹Kanzlei›` (neues Feld `doi_versuche`, Int, ro). Wiederanmeldung Abgemeldeter nur über `newsletter.anmelden` mit neuer Erklärung. |
| R5 | DSGVO Art. 21 Abs. 2/3, Art. 17 | `newsletter.empfaenger_fuer` prüft weder `PH Kontakt.nicht_kontaktieren` noch `Email Unsubscribe`; Kundenreisen mit `werbung = 0` (V) prüfen `nicht_kontaktieren` gar nicht (`darf_senden` kehrt sofort mit V zurück). | **P0** | U17. Für V-Mails mindestens `nicht_kontaktieren` respektieren, wenn der Widerspruch „jede Kontaktaufnahme“ umfasst (neues Feld `PH Kontakt.widerspruch_umfang`: `Werbung`/`jede Kontaktaufnahme außer Vertrag`). |
| R6 | DSGVO Art. 5 Abs. 1 lit. e, Art. 17 | Keine Löschfristen für `PH Newsletter Versand`, `PH Reise Versand` (`kontext_json` enthält Name, Produkt, Berater!), widerrufene/abgelaufene `PH Einwilligung`, Event-Einwilligungen (F9). `loeschen_dsgvo` löscht nur Newsletter-Versand, nicht Reise-Versand. | **P1** | `PH Marketing Einstellungen`: `nachweis_aufbewahrung_monate` (Int, `‹Kanzlei›`), `protokoll_aufbewahrung_monate` (Int, `‹Kanzlei›`). Neuer Scheduler `aufbewahrung_bereinigen` (04:00): Versandzeilen älter als Frist löschen, `kontext_json` nach Versand sofort auf Schlüsselfelder kürzen; widerrufene Einwilligungen nach Frist auf Hash der E-Mail reduzieren (`email_hash`, neues Feld) – damit bleibt eine Sperrliste ohne Klartext. `loeschen_dsgvo` löscht auch `PH Reise Versand` (empfaenger) und anonymisiert Event-Zeilen der Adresse. |
| R7 | DSGVO Art. 28, Art. 44 ff. | `versandweg = Resend` (Anbieter außerhalb EU) ohne Feld für AVV/Transfergrundlage; Konzept §2.13 zeigt Versandweg nur als Fakt. | **P1** | `PH Marketing Einstellungen.avv_versanddienst_am` (Date), `transfer_grundlage` (Select `EU-Anbieter`/`Angemessenheitsbeschluss`/`SCC`), Server: Umschalten auf Resend nur, wenn beide gesetzt. Ampel in der Zustandsleiste §2.13. |
| R8 | FAGG § 11 (Fristbeginn), § 18 Abs. 1 Z 3 (Maßanfertigung) | `empfehlung.frist_setzen`: `ruecktritt_ende = auftrag_datum + empfehlung_ruecktritt_tage`. Bei Fernabsatz-/Auswärtsverträgen beginnt die Frist bei Waren erst mit Erhalt, bei Teillieferung mit Erhalt der letzten Ware. Bei Showroom-Verträgen gibt es kein gesetzliches Rücktrittsrecht, aber ein Storno nach AGB. Maßküchen sind ausgenommen. Gutschein wird so ggf. vor Ende der echten Frist oder vor Lieferung ausgegeben. | **P0** | Frist nicht aus Auftragsdatum, sondern aus Auftrag: `PH Empfehlung.auftrag` als Link PH Auftragsbestaetigung; „Gutschein faellig“ erst wenn AB-`status` ∈ (`Geliefert`, `Abgerechnet`), `storniert_am` leer, `offen_cent = 0` **und** (falls Vertrag FAGG-pflichtig) letzte Zustellung (`PH Lieferschein.zugestellt_am`) + Frist vorbei. Feld `PH Empfehlung.vertragsart` (Select `Showroom`/`Fernabsatz`/`außerhalb Geschäftsraum`, aus AB übernommen). Text in UI: „Gutschein fällig, wenn geliefert, bezahlt und keine Rücktrittsfrist mehr läuft.“ |
| R9 | UWG / Gutscheinbedingungen | Kein Ablauf „Verfallen“ (F2), keine Bedingungen-Version am Datensatz. | **P1** | `PH Empfehlung.bedingungen_stand` (Date, ro, aus Einstellungen beim Anlegen), `verfallen_am`; Scheduler setzt „Verfallen“ nach `empfehlung_code_gueltig_monate` (neu, `‹Inhaber/Kanzlei›`) ohne Anfrage. |
| R10 | ECG § 6, MedienG § 26 | Social-Beiträge mit Herstellerkooperation ohne Kennzeichnungsfeld (U22). | P2 | U22 + Freigabe-Bedingung: `kommerziell ≠ nein` → Text enthält Kennzeichnung (Server-Regel in `freigeben`). |
| R11 | UrhG § 78 (Bildnisschutz), DSGVO Art. 6 | „eigen“ = Platzhirsch hat das Foto gemacht – sagt nichts über abgebildete Personen oder private Wohnräume von Kunden. | **P1** | U21; Claim-Guard-Ampel um dritte Prüfung „Kundenprojekt: Einwilligung foto_referenz ✓/fehlt“. |
| R12 | GlBG Teil III (Zugang zu Gütern und Dienstleistungen) | `versand.anrede_fuer(name, anrede_feld)` und Konzept-Testkontext `anrede_feld = "Frau"`: keine neutrale Anrede vorgesehen; Segmentierung nach Anrede für unterschiedliche Konditionen wäre unzulässig. | P2 | `PH Kontakt.anrede` um „keine/neutral“ ergänzen → Anrede „Guten Tag Vorname Nachname“; Zielgruppen-Select in `PH Newsletter Ausgabe.zielgruppe` erhält bewusst **keine** Option nach Geschlecht (Akzeptanzkriterium). |
| R13 | TKG 2021 § 174 / Bewertungsbitte | `regeln.pruefe_reise` erzwingt E für `bewertung` – richtig. Aber `darf_senden` lässt die Bewertungsreise trotz `anfrage_offen` zu und prüft `reklamation_offen` erst nach Kanzlei-Schalter; offene Retoure (ph_service/ph_shop) wird nicht geprüft. | P1 | Stoppregel `retoure_offen` (ph_shop Retoure/ph_service Servicefall Art Retoure) in `_auftrag_kontakt`; Reihenfolge: Stopp-Regeln vor Grundlagenprüfung. |
| R14 | BAO § 131 f., RKSV | Konzept §7.3 „keine Marketing-Funktion in der Kassa“ – richtig für Erfassung, aber Empfehlungs-/Aktionsgutscheine werden **an der Kassa eingelöst**, und am Adventsabend wird verkauft. | P1 | siehe Buchhaltung B1, Prozess P-M7. |

---

## 4. Buchhaltungslogik

| # | Befund | Folge | Pflichtänderung |
|---|---|---|---|
| B1 | Empfehlungsgutschein wird als `PH Gutschein` (ph_shop) angelegt. `PH Gutschein.art` kennt nur `Mehrzweck`/`Einzweck`, `kanal_ausgabe` nur `Online`/`Showroom`/`Ersatz`; `zahlung` (Link PH Zahlung) setzt einen Kauf voraus. Ein **unentgeltlich** ausgegebener Gutschein ist bei Einlösung eine Entgeltsminderung (Preisnachlass), kein Zahlungsmittel aus einem Gutscheinverkauf. Als Mehrzweck-Zahlungsmittel gebucht würden Erlös und USt-Bemessungsgrundlage zu hoch ausgewiesen und eine Gutschein-Verbindlichkeit ohne Gegenbuchung entstehen. | falsche UVA, falsches Erlöskonto | `PH Gutschein.art` + Option `Aktion (unentgeltlich)`; `kanal_ausgabe` + `Empfehlung`/`Marketing`; Einlösung an Kassa/Shop bucht bei `Aktion` als Rabattzeile (Entgeltsminderung, USt nur auf Restbetrag), nicht als Zahlungsart. Konto/Steuerbehandlung `‹StB›`. UI M8 Schritt 2: „Gutschein im Shop anlegen“ öffnet `/shop/gutscheine/neu?art=Aktion&kanal=Empfehlung&betrag=…` – nicht den Verkaufsgutschein. |
| B2 | Empfehler ist Unternehmer (Architekt, Innenarchitektin, Planer – im Möbelhandel häufig) | Prämie ist dann Entgelt für eine Vermittlungsleistung; Abrechnung per Gutschrift nach UStG § 11 Abs. 7 statt Gutschein | `PH Empfehlung.empfehler_ist_unternehmer` (Check), `empfehler_uid` (Data); bei 1: Status „Gutschein faellig“ erzeugt ToDo „Provisionsgutschrift über Faktura“ statt Gutschein; Programm-Bedingungen `‹Kanzlei›`. |
| B3 | `PH Kampagne.ausgaben_cent` = Summe manuell erfasster `kosten_cent` | Doppel- oder Fehlerfassung gegenüber Buchhaltung; Plattformrechnungen aus dem EU-Ausland (Reverse Charge) sind netto | U10/U11; Auswertung zeigt „belegt“ (Summe Eingangsrechnungen netto) neben „gemeldet“ (Kennzahlen). Ampel: Abweichung > 0 → Hinweis „Kosten aus Kennzahlen weichen von Eingangsrechnungen ab“. |
| B4 | Report `ph_kampagnen_roi`: Umsatz = `PH Auftragsbestaetigung.brutto_cent`, Filter nur `status != Storniert` | ROI zu hoch (USt eingerechnet), Teilstorno/Gutschrift/Retoure nicht abgezogen, Anzahlungs-Aufträge ohne Lieferung voll gezählt, CHF-Aufträge als EUR addiert (`waehrung` an AB vorhanden, wird ignoriert) | Umsatz = `netto_cent` je AB abzüglich `PH Gutschrift` (netto) mit Bezug auf die AB; Spalten „Auftragswert netto“, „abgerechnet netto“ (`abgerechnet_cent`), „bezahlt“ (`bezahlt_cent`); Fremdwährung in EUR mit Kurs der Rechnung (ph_faktura) oder getrennte Summenzeile je Währung. Konzept §5 Berichte entsprechend anpassen. |
| B5 | `PH Kampagne.waehrung` (Link Currency) existiert, Rechnung immer in Cent ohne Währung; Report hart `EUR` | CHF-Budget (Schweizer Zielgruppe) falsch summiert | Server-Regel: `waehrung` leer oder EUR; sonst Kennzahl mit Kurs (U12). UI: Euro-Eingabe zeigt Währungs-Chip aus `waehrung`; Summenzeile Liste nur über EUR-Werte, Fremdwährung als eigene Zeile. |
| B6 | `anfragen_gesamt = auto if auto else manuell` | Mischt CRM-Zählung und Handzählung; sobald eine UTM-Anfrage kommt, verschwinden alle manuellen Werte | zwei Felder: `anfragen_crm` (ro), `anfragen_manuell` (Summe Kennzahlen); Kosten/Anfrage auf Summe; UI zeigt beide. |
| B7 | Event-Kosten (Catering, Druck, Musik) | nur als Kennzahl-Zeile ohne Beleg | über U10 (Eingangsrechnung → Kampagne des Events); Event-Akte Tab „Kosten“ liest Kampagne. |

---

## 5. Fehlende Pflichtprozesse

| # | Prozess | Warum Pflicht | Ablauf (Soll) | Daten |
|---|---|---|---|---|
| P-M1 | **Werbehinweis bei Erhebung** (Bestandskunden-Ausnahme) | Ohne nachweisbaren Hinweis keine B-Werbung | AB-/Kassa-/Shop-Vorlage enthält Hinweistext (Version) → beim Druck/Checkout `PH Kontakt.werbehinweis_*` setzen; Kundenakte zeigt Chip „Werbehinweis erteilt 12.10. (AB)“ | R3 |
| P-M2 | **Widerspruch kanalübergreifend** | Art. 21 Abs. 3 DSGVO | Widerspruch in Kundenakte, Antwortmail, Telefon → ein Dialog „Widerspruch erfassen“ (Umfang, Kanal, Beleg) → Abo abmelden, Einwilligungen widerrufen, `Email Unsubscribe` global, Postsperre | U17, R5 |
| P-M3 | **DSGVO-Anfrage mit Frist** | Art. 12 Abs. 3 | Eingang → Vorgang mit Frist → Auskunft aus `auskunft()` + CRM + Faktura → Versand → erledigt | U18 |
| P-M4 | **Adressänderung E-Mail** | Abo heißt wie die Adresse | Methode `PH Newsletter Abo.adresse_aendern(neu)`: neues Abo `Angemeldet unbestaetigt` + DOI an neue Adresse, altes Abo `Abgemeldet` (Grund „Adresswechsel“), Einwilligung neu protokolliert (Kanal backoffice) | F11 |
| P-M5 | **Post-Werbung für Kunden ohne E-Mail** | Ein Einrichtungshaus mit älterer Kundschaft lädt auch per Brief ein; heute fällt dieser Kunde aus allen Prozessen | Kundenreise/Event-Einladung mit Kanal `post`: Export Serienbrief (CSV/PDF-Etiketten) aus PH Kontakt mit Adresse, ohne `nicht_kontaktieren`; Rechtsgrundlage `‹Kanzlei›` (berechtigtes Interesse + Widerspruchsmöglichkeit im Brief) | `PH Kundenreise.kanal` (Select `email`/`post`), `PH Reise Versand.kanal` |
| P-M6 | **Event-Absage und Verschiebung** | Teilnehmer müssen informiert werden | `absagen(grund)` / `verschieben(neues_datum)` → Mail an alle aktiven Zeilen, Warteliste inklusive; Verschiebung: Zeilen bleiben, Bestätigung „Neuer Termin – Platz bleibt reserviert, Absagen per Link“ | U3 |
| P-M7 | **Event mit Kostenbeitrag oder Verkauf** | `kostenlos = 0` ist vorgesehen, aber ohne Preis/Zahlung/Rechnung; Verkauf am Abend ist Barumsatz (RKSV) | `PH Event.preis_cent`, `ust_satz`; Anmeldung erzeugt PH Zahlung (Shop/Stripe) oder Bezahlung am Abend über Kassa (Artikel „Eventbeitrag“ aus ph_sortiment); Rechnung/Beleg aus ph_faktura bzw. ph_kassa; Storno/Erstattung über Gutschrift. Bis dahin: Server-Regel `kostenlos = 1` Pflicht für Status Offen. | U20 |
| P-M8 | **Freigabe-Rückfall bei Änderung** | Freigabe ist sonst wertlos | Kundenreise U15; Newsletter: Änderung von Blöcken in Status Freigabe/Geplant → zurück auf Entwurf (heute nur bei Versendet gesperrt, `validate` prüft nur Betreff + Blockanzahl, nicht Blockinhalt) | `PH Newsletter Ausgabe.validate` |
| P-M9 | **Empfehlung: Storno/Retoure nach Gutschein** | Gutschein für stornierten Auftrag | Hook AB `on_update` status → Storniert oder Gutschrift voll: verbundene Empfehlung `Gutschein faellig` → `Abgelehnt` (Grund „Auftrag storniert“); bereits ausgegeben → ToDo Leitung „Gutschein PH-GS-… sperren?“ + Link | U7, U8 |
| P-M10 | **Aufbewahrung und Bereinigung** | Speicherbegrenzung | R6 | Einstellungen + Scheduler |
| P-M11 | **Bounce-Anschluss** | Ohne Bounce-Verarbeitung Versand an tote Adressen; Zustellreputation | L16 vor Livebetrieb schließen, nicht „später“ | `bounce_verarbeiten` |

---

## 6. Randfälle (Matrix)

`✗` = nicht behandelt, `◐` = teilweise, `✓` = behandelt (Konzept + App).

| Fall | Kundenreisen | Empfehlung | Kampagne/ROI | Event | Newsletter/Abo | Pflichtänderung |
|---|---|---|---|---|---|---|
| **Storno (AB)** | ◐ `storniert` wird nur beim Planen geprüft (06:00); `darf_senden` prüft es beim Senden nicht, obwohl `_auftrag_kontakt` es neu lädt | ✗ nur ToDo-Text „nicht storniert?“ | ◐ nur Vollstorno | – | – | `darf_senden`: `if kontakt.get("storniert"): return False, None, "storniert"` vor allen anderen Regeln; P-M9; B4 |
| **Teilstorno** | ✗ | ✗ | ✗ Umsatz brutto voll | – | – | B4 (Gutschriften abziehen); Empfehlung: Mindestauftragswert nach Teilstorno `‹Inhaber›` |
| **Teillieferung** | ✗ `feld_lieferdatum = liefertermin_bestaetigt` (README Punkt 3) ist ein **geplantes** Datum: „Danke“ und „Pflege“ gehen bei Verschiebung oder Teillieferung zu früh | ✗ Frist ab Auftragsdatum | – | – | – | Auslöser `datum` auf `PH Lieferschein.zugestellt_am` der **letzten** Lieferung je AB (oder AB-Status `Geliefert`) umstellen; Feldzuordnung in Einstellungen um `auftrag_lieferung_quelle` (Select `AB-Feld`/`Lieferschein zugestellt`/`Montage abgeschlossen`) erweitern; R8 |
| **Montage nach Lieferung** | ✗ Danke-Mail vor Montage | – | – | – | – | Auslöser „Montage abgeschlossen“ (ph_projekte/ph_logistik Tour-Stopp erledigt) |
| **Anzahlung offen** | ◐ (Reise V ok) | ✗ Gutschein trotz `offen_cent > 0` | ✗ Aufträge ohne Anzahlung als Erfolg | – | – | R8-Bedingung `offen_cent = 0`; ROI-Spalte „bezahlt“ |
| **Retoure / Reklamation** | ◐ `reklamation_offen` nur bei Werbung, Retoure gar nicht | ✗ | ✗ | – | – | R13; P-M9 |
| **Fremdwährung CHF** | – | ✗ Gutscheinwert nur `empfehlung_gutschein_cent` (EUR) – Schweizer Empfehler | ✗ B4/B5 | ✗ Preis (P-M7) | – | Gutschein immer EUR, Hinweis in Bedingungen; Kampagne B5 |
| **Kunde ohne E-Mail** | ✗ stumm verworfen | ✗ `empfehler_email` Pflicht | – | ✗ `email` Pflicht in Anmeldung; Telefonanmeldung älterer Gäste unmöglich, Konzept §7.1 akzeptiert das | ✓ (Abo braucht E-Mail – richtig) | U14; P-M5; `PH Event Anmeldung.email` optional, wenn `telefon` gesetzt und `quelle ≠ website`, dann keine Bestätigungsmail, Teilnehmerliste mit Telefon, Anonymisierung gleich; `PH Empfehlung.empfehler_email` optional bei `empfehler_kontakt` mit Postadresse (Code wird ausgedruckt) |
| **Zwei Personen, eine E-Mail** (Ehepaar) | ◐ Schlüssel je E-Mail | – | – | ◐ zweite Anmeldung mit gleicher E-Mail wird „bereits angemeldet“ – richtig, aber Personenzahl nicht änderbar | ✓ | Methode `PH Event.personen_aendern(zeile, personen)` mit Kapazitätsprüfung; Check-in-Zeile „+1 nachmelden“ |
| **Adresswechsel** | – | – | – | – | ✗ F11 | P-M4 |
| **Event voll, Absage → Platz frei** | – | – | – | ✗ kein Nachrücken (L6) | – | U2 |
| **Mehrsprachigkeit** (Kunden aus CH/IT/FR) | ◐ Vorlage hat `sprache`, Reise wählt nur eine Vorlage | – | – | ◐ | ◐ Zielgruppe Sprache = eine Sprache je Ausgabe | `PH Kundenreise.vorlagen` als Kindtabelle je Sprache oder Vorlage-Gruppe; Rückfall `de` |

---

## 7. Pflichtänderungen (priorisiert, mit DocType/Feld)

### P0 – vor jedem Livebetrieb (auch vor Staging mit echten Adressen)

| # | App | DocType / Datei | Änderung |
|---|---|---|---|
| P0-1 | ph_marketing | `events.py anmelden`, `PH Einwilligung.zweck`, `utils/regeln.py ZWECKE/ZWECK_TEXT` | Zweck `event_teilnahme`; `einladungen` nur mit `einladungen_ok = 1` + DOI; Patch für Altbestand (R1) |
| P0-2 | ph_marketing | `PH Event Anmeldung` | `einladungen_ok` (Check, Standard 0), `erschienen_am` (Datetime, ro) |
| P0-3 | ph_marketing | `PH Einwilligung.validate` / `before_insert` | DOI erzwingen für `DOI_ZWECKE` außer `kanal = papier`; `erteilung_beleg` (Attach) Pflicht bei papier (R2) |
| P0-4 | ph_crm | `PH Kontakt` | `werbehinweis_am`, `werbehinweis_quelle`, `werbehinweis_textversion`; Umbenennung `widerspruchshinweis_*` → `widerspruch_am`/`widerspruch_kanal`; `widerspruch_umfang` (R3, R5) |
| P0-5 | ph_marketing | `engine.darf_senden`, `_auftrag_kontakt` | liest `werbehinweis_*`; Stoppregeln `storniert`, `retoure_offen` vor Grundlagen; `nicht_kontaktieren` auch bei V gemäß `widerspruch_umfang` |
| P0-6 | ph_marketing | `newsletter.doi_erneut_senden` | nur Status unbestätigt, 1-h-Sperre, `PH Newsletter Abo.doi_versuche` (Int, ro) (R4) |
| P0-7 | ph_marketing | `newsletter.empfaenger_fuer`, Hook auf `PH Kontakt` | `nicht_kontaktieren` + `Email Unsubscribe` ausfiltern; Sync-Hook (U17) |
| P0-8 | ph_marketing | `PH Empfehlung` | `auftrag` → Link `PH Auftragsbestaetigung`; `vertragsart`; `gutschein` (Link PH Gutschein); `empfehler_ist_unternehmer`, `empfehler_uid`; `empfehlungen_pruefen` mit Bedingungen aus R8 |
| P0-9 | ph_shop | `PH Gutschein` | `art` + `Aktion (unentgeltlich)`, `kanal_ausgabe` + `Empfehlung`/`Marketing`; Einlösung als Entgeltsminderung (B1, `‹StB›`) |
| P0-10 | ph_marketing | `PH Newsletter Versand`, `PH Reise Versand`, `newsletter.abmelden_mit_token` | `abmelde_token_hash` je Versandzeile; keine Rotation des Abo-Tokens (U16) |
| P0-11 | ph_marketing | `testmail` (Ausgabe, Reise) | Empfänger nur intern (U19); `PH Marketing Einstellungen.test_domains` |

### P1 – vor Einschalten von `automatik_aktiv` bzw. Kanzlei-Schaltern

| # | App | DocType / Datei | Änderung |
|---|---|---|---|
| P1-1 | ph_marketing | `PH Marketing Einstellungen` | `nachweis_aufbewahrung_monate`, `protokoll_aufbewahrung_monate` (`‹Kanzlei›`), `avv_versanddienst_am`, `transfer_grundlage`, `auftrag_lieferung_quelle`, `empfehlung_code_gueltig_monate` |
| P1-2 | ph_marketing | `tasks.py` | `aufbewahrung_bereinigen` 04:00; Empfehlung „Verfallen“; `kontext_json` nach Versand kürzen (R6, R9) |
| P1-3 | ph_marketing | `PH Kundenreise.validate` | Freigabe-Rückfall bei Regeländerung (U15) |
| P1-4 | ph_marketing | `PH Newsletter Ausgabe.validate` | Blockinhalt-Änderung in Freigabe/Geplant → Entwurf (P-M8) |
| P1-5 | ph_marketing | `PH Event` | Methoden `nachruecken`, `absagen`, `verschieben`, `personen_aendern`; Vorlagen `event_nachrueck`, `event_absage`, `event_verschoben`; `kostenlos = 1` Pflicht für Offen, bis P-M7 steht |
| P1-6 | ph_marketing | `PH Event Anmeldung.email` | optional bei Telefonanmeldung (Randfall „ohne E-Mail“) |
| P1-7 | ph_marketing | `PH Einwilligung` | `telefon`; `email` nur Pflicht für DOI-Zwecke; `email_hash` (U5, U6, R6) |
| P1-8 | ph_faktura | `PH Eingangsrechnung` | Custom Field `ph_marketing_kampagne`; `PH Kampagne Kennzahl.eingangsrechnung`, `kosten_art`, `waehrung`, `kurs`, `kosten_eur_cent` (U10–U12) |
| P1-9 | ph_marketing | `abbrechen`, `als_durchgefuehrt`, `PH Mail Vorlage`-Rechte | Rollenprüfung Leitung im Server; Mitarbeiter `write = 0` auf PH Mail Vorlage (F6–F8) |
| P1-10 | ph_marketing | Report `ph_kampagnen_roi` | netto, Gutschriften, Währung, bezahlt (B4) |
| P1-11 | ph_marketing | `PH Kampagne` | `anfragen_crm`, `anfragen_manuell` (B6) |
| P1-12 | ph_marketing | `PH Social Beitrag` | `datum_geplant` nicht Pflicht im Status Idee (Pflicht ab Planen – Workflow-Bedingung existiert schon); `einwilligung`, `kommerziell` (F5, U21, U22) |
| P1-13 | ph_marketing | `engine.faellige_kontakte` | Lieferauslöser über Lieferschein/AB-Status; Kontakte ohne E-Mail protokollieren (U14) |
| P1-14 | ph_crm | neu `PH Datenschutz Anfrage` | Vorgang mit Frist (U18, P-M3) |

### P2 – Ausbau

| # | Änderung |
|---|---|
| P2-1 | Kanal `post` für Kundenreisen/Einladungen mit Serienbrief-Export (P-M5) |
| P2-2 | Vorlagen je Sprache an der Kundenreise |
| P2-3 | Neutrale Anrede in PH Kontakt (R12) |
| P2-4 | Unternehmer-Empfehler mit Provisionsgutschrift über ph_faktura (B2) |

---

## 8. Pflichtänderungen am Konzept 10 (Oberfläche)

| # | Stelle | Ändern zu |
|---|---|---|
| K1 | §2.5 Dialog „+ Einwilligung erfassen“ (M5) | Kanal-Segment mit Folgesatz direkt darunter (Einblendung 160 ms `ease-out`): telefon/showroom/backoffice/email → „Die Kundin bekommt eine Bestätigungsmail. Erst nach dem Klick gilt die Einwilligung.“ · papier → Dropzone „Unterschriebenes Formular“ (Pflicht, Fehlertext „Ohne Formular kein Nachweis“). Zwecke `foto_referenz`/`whatsapp`: E-Mail optional, Telefon (whatsapp) bzw. Kundenakte Pflicht. Primärknopf „Erfassen – Bestätigung senden“ / „Erfassen mit Formular“. |
| K2 | §2.4 Massenaktion „DOI erneut senden“ | Vorschau-Regel „nur Unbestätigt, letzte DOI-Mail > 60 Min., weniger als ‹n› Versuche“; Abgemeldet/Bounce/Beschwerde/Aktiv übersprungen mit Grund. Text: „19 ausgewählt – 12 möglich, 7 übersprungen (4 abgemeldet, 2 vor Kurzem gesendet, 1 Beschwerde)“. |
| K3 | §2.4 Zwischenlösung L1 | streichen; nur `newsletter.anmelden` über whitelisted Wrapper (`ph_marketing.api.backoffice_anmelden`, Rolle Marketing/CRM). Bis dahin Knopf deaktiviert mit Tooltip „Kommt mit dem nächsten Backend-Stand“. |
| K4 | §2.8 Anmeldung erfassen / §7.1 „+ Spontan“ | E-Mail optional, wenn Telefon gesetzt; Toggle „Einladungen zu künftigen Abenden: Kundin hat ausdrücklich ja gesagt“ (Standard aus, Hinweis „sendet Bestätigungsmail“). Toast ohne E-Mail: „Angemeldet – keine Bestätigungsmail (keine E-Mail-Adresse)“. |
| K5 | §2.8 Event-Akte | Knöpfe „Nachrücken“ (Warteliste-Zeile), „Absagen und informieren“, „Verschieben“; „Als durchgeführt schließen“ entfernen (Scheduler); Tab Datenschutz zeigt zusätzlich „Event-Einwilligungen: Zweck Teilnahme, gelöscht mit den Anmeldedaten am …“. |
| K6 | §2.10 Empfehlung | Schrittleiste um „Geliefert und bezahlt“ zwischen „Auftrag erteilt“ und „Gutschein fällig“; Auftragsfeld als Link-Suche AB mit Status-Chip (Offen/Teilgeliefert/Geliefert/Storniert) und Fakten „offen 0,00 €“, „letzte Zustellung 28.10.“; Unternehmer-Häkchen mit Hinweis „Bei Unternehmern Provisionsgutschrift statt Gutschein“. Zustand Storno: rotes Band „Auftrag storniert – Empfehlung abgelehnt“. |
| K7 | §4.4 M8 | Schritt 1 automatisch (keine Frage an den Menschen): Ampeln Storno/Lieferung/Zahlung/Frist; Schritt 2 legt Aktionsgutschein an (`art = Aktion`), nicht Verkaufsgutschein. |
| K8 | §2.7 Kampagne | Tab Kennzahlen: Spalte „Beleg“ (Eingangsrechnung-Chip), Währungs-Chip; Tab Auswertung: Karten „Kosten belegt (netto)“ vs. „Kosten gemeldet“; Umsatz „netto nach Gutschriften“. Abweichungs-Band warning. |
| K9 | §2.6 Kundenreise | Band nach Speichern einer aktiven Reise: „Regel geändert – Reise ist wieder Entwurf und braucht eine neue Freigabe.“ (info, nicht schließbar bis Aktivierung). Tab Rechtsgrundlage Laufzeittabelle um `storniert`, `retoure_offen`, `keine_email` ergänzen; `kein_widerspruchshinweis` umbenennen in „Kein Werbehinweis beim Kauf dokumentiert“. |
| K10 | §2.9 Social | Ideenleiste nur nach P1-12; Claim-Guard-Band dreiteilig: Bildquelle · Kundenprojekt-Einwilligung · Kennzeichnung. |
| K11 | §2.13 Einstellungen | Zustandsleiste + „Versanddienst-AVV“, „Aufbewahrung festgelegt“; Schalter `automatik_aktiv` erst einschaltbar, wenn P0 erledigt (Server-Prüfmethode `bereitschaft()` → Liste offener Punkte). |
| K12 | §3 Kundenakte Tab Marketing | Chip „Werbehinweis erteilt / fehlt“; Dialog „Widerspruch erfassen“ (P-M2) statt einzelner Abmelde-/Widerrufsknöpfe. |
| K13 | §5 Berichte | ROI-Spalten neu (B4); Satz „Umsatz netto, ohne stornierte und gutgeschriebene Beträge“ als Tabellenfuß. |

Tastenkürzel: K2 behält `d`; K5 neu `w` (Nachrücken auf fokussierter Warteliste-Zeile); K12 `⇧W` Widerspruch erfassen (nur in Kundenakte). Bestätigungsdialoge für K5 „Absagen und informieren“ rot, Fokus auf Abbrechen, Fakten „n Personen werden per Mail informiert, m ohne E-Mail – Telefonliste drucken“.

---

## 9. Zusätzliche Akzeptanzkriterien

- [ ] Event-Anmeldung über Telefon ohne Einladungs-Toggle erzeugt **keine** Einwilligung mit Zweck `einladungen`; Reise „Einladung zum Adventsabend“ findet diesen Kontakt nicht.
- [ ] Einwilligung erfassen mit Kanal „telefon“, Zweck newsletter → Status Offen, DOI-Mail im Testpostfach; mit Kanal „papier“ ohne Datei → Feldfehler.
- [ ] Abo im Status Abgemeldet: „DOI erneut senden“ fehlt in Akte und Massenaktion.
- [ ] PH Kontakt `nicht_kontaktieren = 1` → nächster Newsletter-Versand protokolliert die Adresse nicht als `geplant`.
- [ ] Abmeldelink aus einer drei Ausgaben alten Mail meldet ab (Token je Versandzeile).
- [ ] Empfehlung mit AB Status `Offen` und abgelaufener Frist bleibt „Auftrag erteilt“; AB storniert → „Abgelehnt“ mit Grund.
- [ ] Kampagnen-ROI: AB netto 1.000 €, Gutschrift 200 € → Umsatz 800 € (Testwerte, keine Produktzahlen).
- [ ] CHF-Kennzahl ohne Kurs → Feldfehler „Kurs fehlt“.
- [ ] Aktive Kundenreise: Änderung `vorlage` durch Leitung → Status Entwurf, Band K9.
- [ ] Testmail an externe Adresse → Fehlertext „Testmails nur an interne Adressen“.
- [ ] Kein Filter, keine Zielgruppe nach Anrede/Geschlecht vorhanden (grep `zielgruppe` Optionen).

---

## 10. Fragen an Kanzlei / Steuerberater / Inhaber (vor Umsetzung der markierten Werte)

| An | Frage |
|---|---|
| Kanzlei | Wortlaut Werbehinweis bei Erhebung (AB, Kassabeleg, Shop) für § 174 Abs. 4 TKG; welche Belege genügen als Nachweis. |
| Kanzlei | Aufbewahrungsfrist für Einwilligungsnachweise nach Widerruf und für Versandprotokolle; ob Hash-Sperrliste ausreicht. |
| Kanzlei | Post-Werbung an Bestandskunden ohne E-Mail: Grundlage und Pflichttexte. |
| Kanzlei | Empfehlungsprogramm: Bedingungen, Ausschluss Unternehmer, Verfallsdauer des Codes. |
| Steuerberater | Buchung unentgeltlicher Aktionsgutscheine bei Einlösung (Shop, Kassa); Provisionsgutschrift an Unternehmer-Empfehler. |
| Steuerberater | Umrechnungskurs für CHF-Kosten/-Umsätze in Auswertungen (Rechnungskurs oder Monatskurs). |
| Inhaber | Kostenpflichtige Events/Workshops geplant? Wenn ja, P-M7 vor erster Ausschreibung. |
| Inhaber | Mindestauftragswert für Empfehlungsgutschein, Verhalten bei Teilstorno. |
