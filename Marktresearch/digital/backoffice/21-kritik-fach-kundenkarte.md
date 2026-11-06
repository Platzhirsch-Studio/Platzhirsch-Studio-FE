# 21 – Fachkritik Kundenkarte (Möbelhandel, AT-Recht, Buchhaltung, Frappe-Datenprüfung)

**Zweck:** Prüfung von `10-konzept-kundenkarte.md` gegen die Datenschicht `Backend-Import/ph_kundenkarte` (README, alle DocType-JSONs, Controller, `api/__init__.py`, `umsatz.py`, `ereignisse.py`, `tasks.py`, `kennzahlen.py`, `utils/*`, `install.py`, Fixtures, Reports, Druckvorlagen) sowie gegen die angrenzenden Belege (`ph_faktura` PH Rechnung/PH Gutschrift/PH Auftragsbestaetigung, `ph_kassa` PH Kassenbeleg + Position, `ph_logistik`, `ph_projekte`, `ph_crm` PH Kontakt). Ergebnis: Faktenfehler im Konzept, UI-Funktionen ohne Feld/Methode, fehlende Pflichtprozesse, Rechts- und Buchhaltungsrisiken, fehlende Randfälle, Pflichtänderungen mit DocType/Feld.
**Stand:** 2026-11-04 · Rolle: Fachkritiker Möbelhandel-Betrieb (RKSV, UStG § 11, FAGG, DSGVO/DSG, TKG 2021, GlBG, Buchhaltung) + Frappe-Datenprüfer · nur lesend geprüft, kein Code geändert.
**Grenze:** Rechtliche Einordnungen sind Prüfaufträge eines Fachkritikers, keine Rechtsberatung. Wo „Kanzlei“ oder „Steuerberater“ steht, ist vor Livegang deren Freigabe nötig.

---

## 0. Urteil

**Note: 6 / 10.**

| Stärke | Schwäche |
|---|---|
| Sehr genaue UI-Abbildung der vorhandenen Methoden, Rollen, Fehlercodes; ehrliche Lückenliste (§9) | Die Umsatzlogik, auf der Stufen, „bis zur nächsten Stufe“ und der Bericht „Kundenwert“ stehen, zählt Anzahlungen doppelt, ignoriert Gutschriften, Währung und Kartennummer-Belege (§5). Das Konzept stellt diese Zahlen trotzdem prominent dar. |
| Leitplanke „kein Geldwert“ konsequent in Texten und Kennzahlen | Der Möbelhandel-Kernprozess (AB → Anzahlung → Lieferung per Tour → Montage → Schlussrechnung → Retoure) fehlt: Einlösungen hängen an Kassenbon/Shop-Bestellung, nicht an AB, Lieferschein oder Montageauftrag (§3). |
| Einwilligung als sichtbarer Schalter, Kiosk ohne Kontaktdaten | „Einwilligung erteilen“ per Speicherleiste durch Mitarbeiter ohne Nachweis, Telefon-„Gruß“ und „persönlich melden“ ohne Kanal-Einwilligung, kein Lösch-/Anonymisierungskonzept (§4). |
| Akzeptanzkriterien K1–K26 messbar | Kein Kriterium prüft Buchhaltungszahlen, Storno-Kaskaden, Ersatzkarte, Kunde ohne E-Mail, CHF (§9). |

Ohne die Pflichtänderungen P1–P12 (§7) darf die Kundenkarte nicht live gehen: Stufen wären falsch, und der Einwilligungsnachweis hielte einer Prüfung nach Art. 7 Abs. 1 DSGVO nicht stand.

---

## 1. Konzept-Aussagen, die der Code widerlegt

| # | Konzept (§) | Code-Befund | Folge für die UI |
|---|---|---|---|
| F1 | §5, §9.1, §12: Number Card „Einlösungen 30 Tage“ hat „`filters_json` leer – Filter prüfen/ergänzen“ | Card ist `type: Custom` mit `method: ph_kundenkarte.ph_kundenkarte.kennzahlen.einloesungen_30_tage`; filtert `status = Eingeloest` und `eingeloest_am ≥ jetzt−30 Tage` | Kein Nachbau in der UI. Methode aufrufen, Anfrage an ph_kundenkarte streichen. |
| F2 | §7.2, §9.2, §12: „`annehmen(aktiv=False)` Parameter fehlt“ | `annehmen(kontakt, stufe, aktiv=False)` existiert. Status = `Aktiv` wenn `aktiv` **oder** `quelle != website`, sonst `Beantragt` | (a) Showroom/Kassa werden **immer** `Aktiv` – der Haken „Sofort aktiv“ in A-KK1 Schritt 3 hat keine Wirkung. (b) Eine Website-Anfrage, die bei abgeschalteter Auto-Annahme **manuell** angenommen wird, wird `Beantragt`, nicht `Aktiv`. Die Zusammenfassung im Dialog „Karte ausstellen“ (§3.3: „1 Kundenkarte (Aktiv)“) ist dann falsch. |
| F3 | §3.5 Tab „Einkäufe“: Belege „über Karte“ und „über Kontakt“, Hinweis „zählt zur Einstufung“ | `umsatz.belege_zu_kontakt()` filtert **nur `kontakt`**. `ereignisse._neu_berechnen()` findet zwar die Karte über `ph_kundenkarte_kartennummer` und reiht die Neuberechnung ein, die Berechnung selbst sieht den Beleg aber nicht, wenn `PH Kassenbeleg.kontakt` leer ist | Kartenscan an der Kassa ohne Kontaktzuordnung hebt die Stufe nie. Die UI würde Belege „über Karte“ zeigen, die nicht zählen. Siehe P2. |
| F4 | §3.11, §7.4: Montage-Einlösung „beim Serviceauftrag“ | Montage ist `PH Montageauftrag` (ph_projekte). `BEZUG_ERLAUBT` = Kassenbeleg, Bestellung, Rechnung, Serviceauftrag, Pflege Abo, Event – **ohne** Montageauftrag, Auftragsbestätigung, Lieferschein, Tour-Stopp | Bezug wäre ein fachlich falscher Beleg. Siehe P5. |
| F5 | §1.4, §7.3: „Lieferung im Liefergebiet“ wird am Packtisch auf `PH Bestellung` bestätigt | Möbel werden über `PH Lieferschein` / `PH Tour` / `PH Tour Stopp` (ph_logistik) aus einer `PH Auftragsbestaetigung` geliefert. Packtisch = Paketversand Shop | Der häufigste Fall (Sofa, Küche) hat keinen Ort zum Einlösen. Siehe P5. |
| F6 | §8.1: „Einwilligung/Widerruf wird nicht protokolliert“ | Stimmt: `_einwilligung_pflegen` setzt `flags.einwilligung_geaendert`, `on_update` wertet das Flag nicht aus | Konzept korrekt; als Pflicht P7 übernommen. |
| F7 | K24: Doppelklick erzeugt keine zweite Karte, „Controller `annehmen` liefert Doppelt“ | `PH Kundenkarte Antrag.idempotency_key` ist `unique`; ein zweiter Insert mit gleichem Schlüssel wirft `DuplicateEntryError`, nicht „Doppelt“ | Server Action muss `DuplicateEntryError` abfangen, den vorhandenen Antrag laden und dessen `kundenkarte` zurückgeben. |
| F8 | §7.2: Kassa-Bon zeigt „Kundenkarte: Lieferung …“, Einlösung erfolgt **nach** `beleg_buchen` | Bon wird beim Buchen signiert (RKSV). Was danach eingelöst wird, kann nicht mehr auf dem signierten Beleg stehen; schlägt `redeem_benefit` fehl (`limit_reached`), steht eine Leistung auf dem Bon, die nicht eingelöst ist | Reihenfolge umdrehen, siehe §4.1 und P6. |
| F9 | §4.1: „`kuendigen` … neue Karte möglich“; §3.5 Sperren „Verlust“ | `before_insert` blockiert eine neue Karte, solange eine `Aktiv/Gesperrt/Beantragt`-Karte existiert. Bei Verlust muss die alte Karte also **gekündigt** werden; die neue startet mit Startstufe, neuem `stufe_seit` und **zurückgesetzten Jahreslimits** (`anzahl_im_jahr` zählt je `kundenkarte`) | Es gibt keine Ersatzkarte. Siehe P4. |
| F10 | §2.2: „Kassa Mitarbeiter: Karten lesend … API garantiert nur am Kiosk“ | `jahresumsatz_cent`, `gesamtumsatz_cent`, `letzter_einkauf` haben `permlevel 0` → jede Rolle mit `read` (Kassa, Mitarbeiter, Website Integration) liest sie über `getDoc`/REST | Ausblenden in der UI reicht nicht. Siehe P8. |
| F11 | §3.4 Inline „Berater“ als einziges Inline-Feld; §3.5 Tab Daten „`kontakt` nur bei `Beantragt` änderbar“ | `kontakt` ist `reqd`, aber weder `read_only` noch `set_only_once`; Mitarbeiter hat `write` → Karte samt Stufe und Historie lässt sich per API auf eine andere Person umhängen | Siehe P8. |
| F12 | §1.2: „Stufe manuell setzen“ = Leitungsaufgabe; §4.2: Rolle „Mitarbeiter“ | Server erlaubt jedem mit `write` auf PH Kundenkarte die Stufe zu ändern; kein Grund-Feld | Widerspruch im Konzept; Server-Regel fehlt. Siehe P9. |
| F13 | §3.5 Stufenblock: Schwellen „nur für Leitung/GF“, Mitarbeiter sehen „bis Privé: 35.240,00 €“ | Umsatz im Zeitraum + `fehlt_noch_cent` = Schwelle. Beide Werte stehen im selben Block | Die Schwelle ist für Mitarbeiter in einer Sekunde errechenbar. Entweder Schwellen offen zeigen oder beide Beträge für Mitarbeiter ausblenden (Vorschlag §8.2). |

---

## 2. UI-Funktionen ohne Datenfeld oder Methode

Über die vom Konzept selbst in §9 genannten Lücken hinaus.

| UI-Funktion (Konzept §) | Fehlt | Pflichtänderung (App · DocType · Feld/Methode) |
|---|---|---|
| A-KK1 Schritt 3 „Sofort aktiv“ aus → `Beantragt` (§3.10) | Steuerung des Status für `quelle ≠ website` | ph_kundenkarte · `PH Kundenkarte Antrag.annehmen(kontakt, stufe, aktiv=None)`: `aktiv=None` → bisherige Regel; `aktiv=False` → `Beantragt` für alle Quellen |
| A-KK1 Schritt 1 „E-Mail Pflicht“ / Kunde ohne E-Mail | Antrag ohne E-Mail ist unmöglich (`email reqd`, `validate` → `email_plausibel`) | `PH Kundenkarte Antrag.email`: `reqd` nur für `quelle = website` (Controller); neu `strasse` (Data), `land` (Link Country); Pflicht für Showroom/Kassa: E-Mail **oder** Postanschrift vollständig |
| A-KK1 Schritt 2 „Kundin hat unterschrieben – Antrag ist Nachweis“ | Kein Feld für Unterschrift/Formularscan; kein Feld „Datenschutzinformation übergeben“ (Art. 13 DSGVO) | `PH Kundenkarte Antrag`: `nachweis_datei` (Attach, Pflicht bei `quelle ∈ showroom, kassa, event` und `einwilligung_auswertung = 1`), `datenschutzinfo_version` (Data, Pflicht), `erfasst_durch` (Link User, read_only) |
| A-KK1 / Showroom-Antrag: „Teilnahmebedingungen akzeptiert (Pflicht)“ | Server prüft `vertragsdaten_akzeptiert` **nur** bei `quelle = website` | `PH Kundenkarte Antrag.validate`: Pflicht für alle Quellen; `bedingungen_version` Pflicht, sobald `vertragsdaten_akzeptiert = 1` |
| Karten-Akte Tab „Einwilligung“ → „Erteilen“ per Speicherleiste (§3.5, §4.2) | Kein Nachweis (Textversion, Kanal, Datei) beim nachträglichen Erteilen; Feld frei beschreibbar | `PH Kundenkarte.einwilligung_auswertung` → `read_only`; neue Methoden `einwilligung_erteilen(textversion, kanal, nachweis_datei)` und `einwilligung_widerrufen(kanal, hinweis)` (beide schreiben `PH Kundenkarte Ereignis` art `Einwilligung`/`Widerruf` und `PH Einwilligung`, sobald Zweck vorhanden) |
| Widerruf durch die Kundin selbst (Art. 7 Abs. 3 DSGVO: so einfach wie Erteilung) | Keine Portal-Methode | ph_kundenkarte · `api.portal_einwilligung_widerrufen(kontakt, kunde_token)` → ruft `einwilligung_widerrufen(kanal="portal")` |
| Kündigung durch Kundin im Portal | Keine Portal-Methode | `api.portal_karte_kuendigen(kontakt, kunde_token, grund?)` |
| Sperren „Verlust“ → neue Karte (§3.5) | Ersatzkarte | Methode `PH Kundenkarte.ersatzkarte_ausstellen(grund)` + Felder `vorgaenger_karte`, `nachfolger_karte` (Link PH Kundenkarte, read_only); siehe P4 |
| Vorteil einlösen: Bezugsvorschläge „offene Belege des Kontakts“ (§3.5) | AB, Lieferschein, Tour-Stopp, Montageauftrag nicht erlaubt | `BEZUG_ERLAUBT` += `PH Auftragsbestaetigung`, `PH Lieferschein`, `PH Montageauftrag`; Bezugstyp je Vorteil-Art festlegen (P5) |
| Vorteil-Kachel „Limit erreicht – wieder ab 01.01.“ | Zählung je **Karte**, nicht je Person → Ersatz-/Neukarte setzt Limit zurück | `anzahl_im_jahr()` und `karten_uebersicht()` zählen über `PH Kundenkarte Einloesung.kontakt` (Feld existiert, `fetch_from kundenkarte.kontakt`) |
| Einlösung nachträglich korrigieren (Sheet §3.6) | Konzept zeigt „alle Felder“; Mitarbeiter hat `write`, `eingeloest_am`, `vorteil`, `kundenkarte`, `bezug` sind editierbar → Rückdatierung ins Vorjahr umgeht das Limit | `PH Kundenkarte Einloesung`: `kundenkarte`, `vorteil`, `eingeloest_am`, `bezug_doctype`, `bezug`, `ort` → `set_only_once`; `write` für Mitarbeiter nur auf `kommentar` (oder `write` entziehen, Änderungen nur per Methode) |
| Einwilligungs-Zeitleiste „Einwilligung erteilt/widerrufen“ (§3.5) | Ereignis wird nicht geschrieben (F6) | `PH Kundenkarte.on_update`: bei `flags.einwilligung_geaendert` → `protokoll(art="Einwilligung"/"Widerruf", hinweis=textversion)` |
| Stufe manuell mit Begründung (Kulanz, Hotelkunde §1.2) | Kein Grund-Feld, kein Rollenschutz | `PH Kundenkarte`: `stufe_manuell_grund` (Small Text, Pflicht wenn `stufe_manuell = 1`), `stufe`/`stufe_manuell`/`stufe_manuell_grund` → `permlevel 2` (write nur Leitung) |
| Ablehnen mit „Begründung Pflicht (Small Text)“ (§3.3) | Freitext; keine prüfbaren Gründe (GlBG, §4.6) | `PH Kundenkarte Antrag.ablehnungsgrund` (Select: `Doppelte Anmeldung`, `Angaben unvollständig/nicht prüfbar`, `Missbrauch früherer Karte`, `Kundenwunsch`, `DOI nicht bestätigt`, `Sonstiges`) + `entscheidung_grund` bleibt Pflicht-Freitext bei `Sonstiges` |
| Kündigen-Dialog (§3.5) | Kein „wer hat gekündigt“ | `PH Kundenkarte.kuendigung_durch` (Select `Kundin/Kunde`, `Platzhirsch`), `kuendigung_grund` (Small Text) statt Grund nur im Ereignis |
| Stufe deaktivieren (Stufenplan §3.7) | Karten auf inaktiver Stufe verlieren still alle Vorteile (`reihenfolge_von` → None → `vorteile_fuer_stufe` = []) | `PH Kundenkarte Stufe.validate`: `aktiv 1→0` nur, wenn keine Karte `Aktiv/Gesperrt/Beantragt` auf der Stufe; sonst Fehler „n Karten zuerst umstufen“ + Methode `karten_umstufen(ziel)` (Leitung) |
| Kassa: Vorteil als Bon-Position (§7.2) | `PH Kassenbeleg Position` hat `bezug_doctype/bezug`, aber keine Art für Kartenleistung | ph_kassa · `PH Kassenbeleg Position.art` += `Kartenleistung` (0,00 €, `bezug_doctype = PH Kundenkarte Vorteil`, `bezug = <vorteil>`); Einlösung entsteht in `on_submit` des Belegs (P6) |
| Verlängerte Umtauschfrist (Vorteil `umtausch`) | Frist ist an keinem Verkaufsbeleg gespeichert; Retoure kann sie nicht prüfen | ph_kassa `PH Kassenbeleg` und ph_faktura `PH Rechnung`: `ph_kundenkarte_umtausch_bis` (Date, read_only, gesetzt beim Buchen aus Stufe zum Kaufzeitpunkt); Fixture in `ph_kundenkarte/fixtures/custom_field.json` |
| Löschung/Anonymisierung (Konzept: nicht vorhanden) | Keine Methode; Ereignisse nur durch System Manager löschbar; Einlösungen kopieren `kunde_name` | Methode `PH Kundenkarte.anonymisieren()` (Leitung) + Scheduler P10 |
| Kundenwert-Report „€ nur Leitung“ (§3.8) | Report `PH Kundenwert` gibt Beträge an alle Rollen der Report-Liste (inkl. Mitarbeiter) | `ph_kundenwert.py`: Euro-Spalten nur bei Rolle `PH Kundenkarte Leitung`/`PH Geschäftsführung`, sonst `None`; alternativ Mitarbeiter aus `roles` des Reports entfernen |
| Desk-Kanban „Drag aus“ (§3.2) | Fixture `PH Kundenkarten Antraege` arbeitet laut README „direkt auf `status`“ – im Desk umgeht ein Zug den DOI | Fixture entfernen oder `PH Kundenkarte Antrag.validate`: Statuswechsel nur, wenn `flags.status_per_methode` gesetzt |

---

## 3. Fehlende Pflichtprozesse (Möbelhandel, Vorbild SHD-Kette)

| # | Prozess | Heute | Soll (Ablauf, Dokumente, Zustände) |
|---|---|---|---|
| PR1 | **Leistungszusage bei der Auftragsbestätigung** | Einlösung entsteht erst bei Erbringung; AB nicht erlaubt; Stufe/Kündigung zwischen AB und Lieferung (bei Küchen oft 8–16 Wochen, je nach Lieferant) kann die zugesagte Leistung kippen (`card_inactive`, `tier_too_low`) | Einlösung bekommt zwei Stufen: `Zugesagt` (bei AB, Bezug `PH Auftragsbestaetigung`, Prüfung der Limits **zum Zusagezeitpunkt**) → `Erbracht` (bei Lieferschein/Montageauftrag „erledigt“) → `Storniert`. Zugesagte Leistungen bleiben gültig bei Herabstufung, Sperre, Kündigung (Vertragsbestandteil der AB). Feld `PH Kundenkarte Einloesung.status` Select `Zugesagt\nEingeloest\nStorniert`, neu `zugesagt_am`, `erbracht_am`, `erbracht_bezug_doctype`, `erbracht_bezug`. |
| PR2 | **AB-Position „Lieferung/Montage – Leistung der Kundenkarte“** | Kein Zusammenhang zwischen Einlösung und Preisposition. Ohne Regel stellt Verkauf eine Lieferpauschale in die AB und zieht sie per Rabattzeile ab → das ist ein Rabatt in Euro, gegen die Inhaber-Entscheidung | AB/Rechnung erhält eine Position mit 0,00 € und Text „Lieferung im Liefergebiet – Leistung Ihrer Kundenkarte Platzhirsch Plus“; keine Streichpreise, keine „statt“-Angabe. `PH Beleg Position`: `ph_kundenkarte_einloesung` (Link). Einlösung legt die Position an oder prüft sie. |
| PR3 | **Lieferung per Tour** | Nur Packtisch/Shop-Bestellung | Tourplanung zeigt Kennzeichen „Kartenleistung Lieferung“ am Tour-Stopp (aus AB-Einlösung `Zugesagt`); Abschluss des Lieferscheins setzt `Erbracht`. Fahrer löst nichts ein (wie §7.4 für Monteure). |
| PR4 | **Montage** | Bezug Serviceauftrag | Bezug `PH Montageauftrag`; `Erbracht` bei Abnahme (`PH Abnahme`). Gewährleistung für die Montage gilt auch bei unentgeltlicher Leistung → Abnahmeprotokoll bleibt Pflicht wie bei bezahlter Montage. |
| PR5 | **Storno-Kaskade** | Kassenbelege werden per **Stornobeleg** storniert (`on_cancel` ist in ph_kassa verboten), `ereignisse.kassenbeleg_gebucht` hängt aber auch an `on_cancel`; Einlösungen mit Bezug auf den Ursprungsbeleg bleiben `Eingeloest`. Gleiches für Bestellung `storniert/widerrufen`, Rechnung `Storniert`, AB storniert | doc_events: PH Kassenbeleg `on_submit` mit `belegart = Stornobeleg` → Einlösungen mit `bezug = storno_von` auf `Storniert` (Grund „Beleg storniert: <Nr>“); PH Bestellung Status `storniert/widerrufen` → dto.; PH Auftragsbestaetigung storniert → `Zugesagt` → `Storniert`. Ereignis an der Karte. |
| PR6 | **Retoure / Umtausch** | Gutschriften senken den Umsatz nicht (§5); verlängerte Umtauschfrist wird nirgends geprüft | Retoure in Kassa/Faktura liest `ph_kundenkarte_umtausch_bis` des Ursprungsbelegs; Kassa zeigt „Umtausch bis TT.MM.JJJJ (Kundenkarte)“. Frist und **gesetzliches** FAGG-Rücktrittsrecht (Shop) getrennt anzeigen (§4.3). |
| PR7 | **Kaufen–Aufstufen–Zurückgeben** | Aufstufung sofort beim Buchen; Herabstufung Standard aus → Stufe bleibt nach Retoure dauerhaft | Aufstufung erst nach Ablauf der längsten Rückgabefrist des auslösenden Belegs **oder** sofort, aber Neuberechnung bei Gutschrift/Retoure mit Herabstufung **innerhalb** dieser Frist (Ausnahme von `herabstufung_erlaubt`). Einstellung `aufstufung_karenz_tage` (Int) in PH Kundenkarte Einstellungen; Wert = Inhaber-Entscheidung. |
| PR8 | **Ersatzkarte bei Verlust/Diebstahl** | nicht möglich ohne Historienverlust (F9) | `ersatzkarte_ausstellen(grund)`: alte Karte `Gesperrt` → `Gekuendigt` mit `nachfolger_karte`; neue Karte übernimmt `stufe`, `stufe_seit`, `stufe_manuell(+_grund)`, Einwilligungsfelder, `persoenlicher_berater`, `geburtstag`; Limits zählen je Kontakt; Ereignis „Ersatzkarte“ (neue Art). Wallet-Pass alt ungültig (P11). |
| PR9 | **Löschen/Anonymisieren nach Ende** | keins | Kündigung → Frist (Inhaber/Kanzlei) → `anonymisieren()`: `kunde_name`, `geburtstag`, `notizen_intern`, `qr_svg`, `ip_hash`, Umsatzfelder leeren; Ereignis-`hinweis`/`jahresumsatz_cent` leeren; Einlösungen behalten Bezug, `kunde_name` → „anonymisiert“. Anträge `Abgelehnt/Doppelt` nach Frist löschen. Buchhalterische Aufbewahrung (§ 132 BAO, 7 Jahre) betrifft Belege, **nicht** die Kartendaten – sie liegen in Kassa/Faktura. |
| PR10 | **Kontaktkanal bei Gruß und Reaktivierung** | Aufgabe „Geburtstagsgruß … (Anruf, Karte)“ und „Persönlich melden – keine Werbung“ ohne Kanalprüfung | Aufgabe trägt erlaubte Kanäle aus ph_marketing: Brief immer (außer `nicht_kontaktieren`), Telefon/E-Mail/SMS nur mit Werbeeinwilligung (§4.5). Aufgabe-Feld `kanal_erlaubt` (Data, aus Einwilligungen berechnet). |
| PR11 | **Antrag mit Haushalt/Partner** | `Antrag.validate` verknüpft automatisch `kontakt` per E-Mail; teilt ein Paar eine Adresse, landet der zweite Antrag als „Doppelt“ beim Partner | Auto-Verknüpfung nur, wenn E-Mail **und** Nachname übereinstimmen; sonst `kontakt` leer lassen und in der Antrag-Akte „Gleiche E-Mail wie <maskiert> – andere Person?“ zur Entscheidung zeigen. |

---

## 4. Recht

### 4.1 RKSV / BAO § 131b, § 132a

| Stelle | Problem | Pflichtänderung |
|---|---|---|
| §7.2 Einlösung nach `beleg_buchen`, Textzeile auf Bon | Signierter Beleg kann nachträglich nicht ergänzt werden; Text auf dem Bon und Datensatz können auseinanderlaufen (F8) | Vorab-Prüfung beim Antippen des Chips (`lookup_card.verfuegbar` + neue Methode `vorteil_pruefen(kartennummer, vorteil)`), Vorteil als Position `art = Kartenleistung`, 0,00 €, im Beleg **vor** dem Signieren; Einlösung in derselben Transaktion im `on_submit` des Belegs. Scheitert die Einlösung trotz Vorprüfung (Wettlauf zweier Kassen), bleibt die Position stehen (Leistung wurde zugesagt) und die Einlösung wird mit `quelle = kassa`, Hinweis „Limit überschritten – Kulanz“ trotzdem angelegt; Leitung sieht sie im Zu-tun. |
| Trainingsmodus | `redeem_benefit` prüft nicht, ob der Bezug ein Trainingsbeleg ist → echte Einlösung aus Schulung | `redeem_benefit`/`validate` der Einlösung: Bezug `PH Kassenbeleg` mit `trainings = 1` oder `belegart = Trainingsbeleg` → Fehler `invalid` „Trainingsbeleg – keine Einlösung“. Im Kiosk-Training Chips sichtbar, Einlösung simuliert. |
| Stornobeleg | Einlösung bleibt (PR5) | doc_event wie PR5 |
| Offline/Notbetrieb (§7.2) | Kartennummer am gepufferten Vorgang erlaubt, Vorteil nicht prüfbar | Im Notbetrieb **keine** Kartenleistung als Position; Kartennummer darf gespeichert werden; Hinweiszeile „Kartenleistung nach Wiederverbindung im Backoffice nachtragen“ erzeugt PH Aufgabe. |

### 4.2 UStG § 11 und Buchungslogik der Leistungen

| Stelle | Problem | Pflichtänderung |
|---|---|---|
| Kostenlose Lieferung/Montage zu einem Kauf | Rechnung muss Art und Umfang der Leistung ausweisen (§ 11 Abs. 1 Z 3). Wird sie gar nicht genannt, fehlt der Nachweis, dass sie Teil des Entgelts ist; wird sie mit Preis und Abzug gezeigt, entsteht ein Euro-Rabatt | Position 0,00 € (PR2). Steuersatz der Position = Satz der Hauptleistung (Nebenleistung) – Steuerberater bestätigen lassen. |
| Leistung ohne Kauf (Pflegetermin, Montage eines Altmöbels, Event-Vorabzugang) | Unentgeltliche Leistung an Kunden; umsatzsteuerliche Behandlung (u. a. § 3a Abs. 1a UStG) und Ertragsteuer (Werbeaufwand vs. Geschenk) sind nicht geklärt | Prüfauftrag Steuerberater. Bis dahin: Einlösung ohne Bezug nur für Art `Persoenlich` und `Event`; `Pflege`/`Montage`/`Lieferung` → Bezug Pflicht (P5). |
| Begriff „Gutschrift“ im Vorteilstext (`install.py`: „Frist für Umtausch oder Gutschrift“) | „Gutschrift“ ist umsatzsteuerlich die Abrechnung durch den Leistungsempfänger (§ 11 Abs. 7); im Handel meint man Wertgutschein → wäre ein Geldwert und widerspricht Stufe 1 | Kundentext „verlängerte Umtauschfrist für Lagerware“ ohne „Gutschrift“; `GELD_RE` um `Gutschrift|Gutschein` ergänzen. |
| Interner Aufwand der Leistungen | Report „Vorteile Nutzung“ nur Anzahl; Buchhaltung kann Programmkosten nicht beziffern | Kein Geldwert beim Kunden, aber interne Zuordnung: Einlösung mit Bezug Montageauftrag/Tour → Aufwand ist über Projektzeit/Tour auswertbar. Keine Pflicht, Empfehlung für Report-Spalte „Bezug mit Aufwandserfassung ja/nein“. |

### 4.3 FAGG / KSchG

| Stelle | Problem | Pflichtänderung |
|---|---|---|
| Website-Antrag | Teilnahmevertrag im Fernabsatz, bei dem die Kundin personenbezogene Daten (Kaufhistorie) bereitstellt. Ob FAGG (Informationspflichten § 4, Rücktritt § 11) für den Teilnahmevertrag gilt, ist offen | Prüfauftrag Kanzlei; Teilnahmebedingungen + Bestätigungsmail (Website) mit Pflichtinformationen; Antrag-Feld `bedingungen_version` Pflicht (P1). |
| Verlängerte Umtauschfrist vs. gesetzlicher Rücktritt | Gefahr, dass UI und Bon „Umtausch bis …“ als Ersatz des 14-tägigen Rücktritts (Shop) darstellen | Kassa/Portal zeigen zwei getrennte Zeilen: „Rücktritt (gesetzlich, Fernabsatz) bis …“ nur bei Shop-Bestellungen, „Umtausch (freiwillig, Kundenkarte) bis …“. Umtausch nur Lagerware laut Text; Sonderanfertigung (Küche, Maßmöbel) ausgeschlossen – Ausschluss in `beschreibung_kunde` und Prüfung bei Retoure. |
| Leistung „Lieferung im Liefergebiet“ | Liefergebiet nicht definiert (kein Feld) | Einstellung `liefergebiet_plz` (Small Text, PLZ-Bereiche) oder Verweis auf ph_logistik-Zonen; Kiosk-Chip nur, wenn Lieferadresse im Gebiet. |

### 4.4 DSGVO / DSG

| Stelle | Problem | Norm | Pflichtänderung |
|---|---|---|---|
| Tab Einwilligung „Erteilen: Speicherleiste“ (§3.5, §4.2) | Mitarbeiter setzt Einwilligung ohne Nachweis, Textversion frei editierbar | Art. 7 Abs. 1 (Nachweispflicht) | P3: Feld read_only, Methode mit Nachweis; UI-Dialog „Einwilligung erfassen“ (§8.1) |
| Widerruf nur im Backoffice | Widerruf muss so einfach sein wie Erteilung (Website-Häkchen) | Art. 7 Abs. 3 | Portal-Methode (§2) |
| Umsatz und „Letzter Einkauf“ für alle Mitarbeiter, „Nächster Schritt: kurz vor <Stufe>“ (§8.3) | Einwilligungstext deckt „Auswertung für die Einstufung“. Ein Verkaufshinweis „kurz vor Plus“ nutzt die Auswertung für Verkaufsansprache | Art. 5 Abs. 1 lit. b (Zweckbindung), lit. c | Regel „kurz vor <Stufe>“ streichen **oder** Einwilligungstext um „Hinweis durch Ihre Beraterin“ erweitern (Kanzlei). Umsatzfelder permlevel 1 (P8). |
| Ereignis-Protokoll nach Widerruf | `PH Kundenkarte Ereignis.jahresumsatz_cent` und `hinweis` („Umsatz im Bewertungszeitraum: … Cent“) bleiben nach Widerruf stehen | Art. 17 Abs. 1 lit. b | Widerruf leert diese Felder in allen Ereignissen der Karte (Ausnahme vom „nur anlegen“, Methode mit `flags.ignore_validate`), Ereignis „Widerruf“ ohne Betrag |
| Kein Löschkonzept | Gekündigte Karten, abgelehnte Anträge, IP-Hashes unbegrenzt | Art. 5 Abs. 1 lit. e | PR9 + Scheduler P10; Fristen = Inhaber/Kanzlei |
| Showroom/Kassa ohne Informationsnachweis | Art. 13-Information im Laden | Art. 13 | `datenschutzinfo_version` am Antrag (§2) |
| Wallet-Pass | Pass liegt bei Apple/Google; Google-Save-URL überträgt Name und Stufe an Google | Art. 13 Abs. 1 lit. f, Art. 44 ff. | Datenschutzerklärung nennt Wallet-Anbieter; Pass-Inhalt auf Kartennummer, Vorname, Stufe beschränken (prüfen in `wallet_payload.py`); UI-Hinweis im Tab Wallet |
| Leitung darf Karten, Anträge, Einlösungen **löschen** | Löscht den Einwilligungs- und Einlösungsnachweis | Art. 5 Abs. 2 (Rechenschaft) | `delete` für `PH Kundenkarte Leitung` auf Karte, Antrag, Einlösung entziehen; Löschung nur über `anonymisieren()` |
| DSGVO-Auskunft | Konzept: Anfrage an ph_crm | Art. 15 | bleibt; zusätzlich Ereignisse **und** Anträge (auch abgelehnte) aufnehmen |
| Geburtstag | Am Kontakt nur mit `geburtstag_einwilligung` übernommen, am Antrag/Karte ohne Kennzeichen | Art. 6 Abs. 1 lit. a | `PH Kundenkarte.geburtstag_einwilligung` (Check); ohne Haken keine Aufgabe |

### 4.5 TKG 2021 § 174 (unerbetene Nachrichten) und UWG

| Stelle | Problem | Pflichtänderung |
|---|---|---|
| Geburtstagsaufgabe „Persönlicher Gruß … (Anruf, Karte)“ (`tasks.py`), Konzept §3.11 „Geburtstagsaufgabe auch bei Widerspruch?“ | Ein Anruf der Verkäuferin zum Geburtstag mit Stufenbezug ist Werbung; Anruf zu Werbezwecken ohne vorherige Einwilligung ist unzulässig, E-Mail/SMS ebenso (außer Ausnahme § 174 Abs. 4) | Aufgabe nennt Kanal „Brief/Karte“; Telefon/E-Mail nur mit Marketing-Einwilligung (ph_marketing Zweck `telefon`/`email`). Bei `nicht_kontaktieren = 1` **keine** Aufgabe. Damit ist die Inhaber-Frage aus §12 rechtlich vorentschieden. |
| Report „ohne Einkauf“ → Aufgabe „Persönlich melden – keine Werbung“ | Die Absicht, wieder einen Kauf anzustoßen, macht die Ansprache zur Werbung; der Text „keine Werbung“ ändert das nicht | Massenaktion nur für Karten mit Werbeeinwilligung im gewählten Kanal; Vorschau „8 von 12 – 4 ohne Einwilligung für Telefon/E-Mail (nur Brief möglich)“. |

### 4.6 GlBG (Teil III, Zugang zu Gütern und Dienstleistungen) und Gleichbehandlung

| Stelle | Problem | Pflichtänderung |
|---|---|---|
| Antrag ablehnen mit Freitext | Ablehnung ohne nachvollziehbare Kriterien lässt sich im Streitfall nicht gegen Vorwurf der Diskriminierung (Geschlecht, ethnische Zugehörigkeit) belegen | Ablehnungsgrund als Select (§2), Kriterien in Teilnahmebedingungen |
| Stufe manuell „Kulanz, Hotelkunde“ | Willkürliche Besserstellung einzelner Personen ohne Regel | `stufe_manuell_grund` Pflicht, Bericht „manuelle Stufen“ für Leitung |
| Anrede | Antrag kennt `Divers`; Kundendisplay „Guten Tag, Frau Muster“ (§7.2) | Ohne Anrede oder bei `Divers`: „Guten Tag, Anna Muster“; nie aus dem Vornamen ableiten |

---

## 5. Buchhaltungslogik der Umsatzberechnung (`umsatz.py`)

Die Stufe ist eine Kundenzusage auf Basis dieser Zahl. Jeder Fehler hier ist ein Kundenstreit („Meine Nachbarin hat weniger gekauft und ist Plus“).

| # | Befund im Code | Wirkung | Pflichtänderung |
|---|---|---|---|
| B1 | PH Rechnung: alle `art` gezählt (`Anzahlungsrechnung`, `Teilrechnung`, `Schlussrechnung`). `Schlussrechnung.brutto_cent` ist der **Gesamtbetrag**, verrechnete Anzahlungen stehen separat in `anzahlung_brutto_cent` (`ph_rechnung.py`: `zahlbar_cent = brutto_cent − anzahlung_brutto_cent`) | Küche mit Anzahlung zählt Anzahlung + Gesamtbetrag → doppelt | Rechnungen: `art in (Rechnung, Barverkauf, Schlussrechnung)`; Schlussrechnung mit vollem `brutto_cent`; `Anzahlungsrechnung` und `Teilrechnung` nicht zählen, solange eine Schlussrechnung zur AB existiert; ohne Schlussrechnung Teilrechnungen zählen (offener Auftrag) – Regel in `utils/stufen.py` mit Test |
| B2 | PH Kassenbeleg: gezählt, wenn `rechnung` leer. Anzahlung an der Kassa zu einer AB (`auftrag` gesetzt, Position `art = Anzahlung/Teilzahlung/Schlusszahlung`) zählt, und die spätere Rechnung zur AB zählt nochmals | Doppelzählung | Kassenbeleg: Positionen `Anzahlung`, `Teilzahlung`, `Schlusszahlung`, `Gutschein Verkauf` nicht zählen; Summe aus Positionen statt `gesamt_cent` |
| B3 | `Gutschein Verkauf` an der Kassa zählt als Umsatz; späterer Kauf mit `Gutschein Einloesung` zählt erneut | Doppelzählung (Gutschein = Zahlungsmittel) | wie B2 |
| B4 | PH Gutschrift (`Teilgutschrift`, `Wertminderung`, `Kulanz`) wird nicht abgezogen; nur `Storniert` an der Rechnung wirkt | Retoure senkt die Stufe nie | `belege_zu_kontakt` += PH Gutschrift `docstatus 1`, `status != Entwurf`, Betrag negativ; doc_event `PH Gutschrift on_submit` → Neuberechnung; PR7 |
| B5 | Rechnungen mit Status `Gestellt`, `Ueberfaellig`, `Gemahnt` zählen | Stufe steigt vor Zahlung; bei `Uneinbringlich` später wieder Abstufung (wenn erlaubt) | Nur `Bezahlt`/`Teilbezahlt` (anteilig `brutto_cent − offen_cent`) – Inhaber-Entscheidung, Vorschlag: bezahlt |
| B6 | Beträge **brutto** (`gesamt_cent`, `brutto_cent`) | Steuerfreie Ausfuhr (Kundin aus CH/LI mit Ausfuhrnachweis), Reverse-Charge-B2B und Tax-Free-Rückvergütung zählen anders als Inlandskauf mit 20 % | Netto zählen (`netto_cent`) – Schwellen dann netto definieren; UI-Text „Umsatz (netto) im Bewertungszeitraum“ |
| B7 | `waehrung`/`kurs` an PH Rechnung, PH Kassenbeleg, PH Gutschrift werden ignoriert | CHF-Beträge werden 1 : 1 als Euro-Cent addiert | Betrag in EUR = `betrag_cent × kurs` wenn `waehrung != EUR` (Kurs des Belegs, nicht Tageskurs); fehlender Kurs → Beleg auslassen + Ereignis „Hinweis: Beleg <Nr> ohne Kurs nicht gezählt“ |
| B8 | Nur `kontakt`, nicht `ph_kundenkarte_kartennummer` (F3) | Kartenscan ohne Kontakt wirkungslos | Kassenbeleg/Bestellung zusätzlich per `ph_kundenkarte_kartennummer` (aller Karten des Kontakts, auch Vorgänger) einsammeln, Duplikate über `name` entfernen |
| B9 | Stornobeleg: zählt negativ nur, wenn er `kontakt` trägt | Unbestätigt, ob `PH Kassenbeleg.stornieren` `kontakt` und `ph_kundenkarte_kartennummer` übernimmt | In ph_kassa prüfen; sonst Storno über `storno_von` dem Original zuordnen |
| B10 | Bestellungen nur `zahlung = online`; Bestellungen mit Zahlung vor Ort zählen „über den Kassenbeleg“ | Korrekt, solange der Kassenbeleg `kontakt` trägt (B8) | Test „Click & Collect, Zahlung an der Kassa, nur Kartenscan“ |
| B11 | AB selbst zählt nicht | Küche im März bestellt, Schlussrechnung im Juli → Stufe erst im Juli. Fachlich vertretbar, aber Kundin erwartet sie bei Unterschrift | Inhaber-Entscheidung; UI-Text in Karten-Akte: „Aufträge zählen mit der Schlussrechnung“ |

UI-Folge bis zur Behebung: Stufenblock, Kundenwert-Report und „bis zur nächsten Stufe“ mit Band `warning-soft` „Berechnung im Aufbau – Anzahlungen und Gutschriften noch nicht berücksichtigt“ für Leitung; für Mitarbeiter Beträge ausblenden.

---

## 6. Randfälle (fehlen im Konzept)

| Fall | Daten heute | Soll-Verhalten (Server + UI) |
|---|---|---|
| **Storno Kassenbeleg** mit eingelöstem Vorteil | Einlösung bleibt | PR5; Zeitleiste „Einlösung storniert – Beleg KB-… storniert“; Kachel-Rest +1 |
| **Storno AB** mit zugesagter Montage | nicht abbildbar | PR1/PR5 |
| **Teillieferung** (Küche in zwei Touren, Möbel in drei Lieferscheinen) | jede Einlösung zählt gegen Limit; Lieferung unbegrenzt, Montage ggf. limitiert | Eine Zusage je AB; Teilerbringungen ändern `Erbracht` erst beim letzten Lieferschein/Montageauftrag; Limit zählt die Zusage einmal. UI: Einlösung zeigt „2 von 3 Lieferscheinen erledigt“ |
| **Anzahlung** | B1/B2 | Anzahlungen zählen nicht; UI-Einkäufe-Tab markiert Anzahlungsbelege grau „Anzahlung – zählt mit Schlussrechnung“ |
| **Retoure Teilmenge** | B4 | Gutschrift zieht ab; Kartenleistung Lieferung bleibt erbracht (keine Rückabwicklung) |
| **Umtausch** mit Kartenfrist | PR6 | Kassa-Retoure zeigt Frist aus Ursprungsbeleg; abgelaufen → Hinweis, Leitung kann Kulanz |
| **Fremdwährung CHF** | B7 | Umsatz in EUR mit Belegkurs; Einkäufe-Tab zeigt „CHF 1.200,00 (≈ EUR … zum Belegkurs)“ nur für Leitung |
| **Kunde ohne E-Mail** (häufig bei älterer Kundschaft) | Antrag unmöglich; Portal, Wallet, DOI nicht nutzbar | Antrag mit Postanschrift (§2); Karte `Aktiv`; Begrüßungsschreiben Pflichtausgabe nach Ausstellen (Druck), Widerruf per Brief/Showroom; Tab Wallet zeigt „Kein Portalzugang – Pass nicht verfügbar“; `get_card_status` nicht anwendbar |
| **Gemeinsame E-Mail eines Paares** | PR11 | Entscheidung in Antrag-Akte |
| **Firmenkunde (Hotel, Yacht, `kontaktart = Geschaeft`)** | Karte möglich, Umsatz des Hotels hebt sofort auf höchste Stufe; `kunde_name` = Firma | Inhaber-Entscheidung: Kundenkarte nur `kontaktart = Privat` (Vorschlag) – `PH Kundenkarte.validate` prüft; B2B-Konditionen gehören in Angebot/AB |
| **Minderjährige** | kein Alterskennzeichen; Geburtsjahr optional | Teilnahmebedingungen „ab 18“ (Kanzlei); Antrag-Häkchen `volljaehrig_bestaetigt` (Check) |
| **Geburtstag 29.02.** | `tasks.geburtstage_heute` vergleicht (Monat, Tag) → in Nicht-Schaltjahren nie | In Nicht-Schaltjahren am 28.02. |
| **Geburtstag ohne Jahr** (Website `--MM-DD`) | Konzept nennt es; Feld `Date` | Felder `geburtstag_tag` (Int), `geburtstag_monat` (Int) statt Date; Jahr optional getrennt |
| **Kartenverlust** | F9 | PR8 |
| **Karte gekündigt, später neue Karte** | Limits starten neu | Limit je Kontakt (§2) |
| **Stufe deaktiviert** | Vorteile verschwinden still | §2 |
| **Vorteil deaktiviert** nach Zusage | `benefit_inactive` bei Erbringung | Zusage bleibt gültig (PR1); Prüfung nur beim Zusagen |
| **Kartenwechsel der Person (`kontakt` geändert)** | per API möglich | F11/P8 |
| **Trainingsbeleg** | echte Einlösung | §4.1 |
| **Zwei Kassen lösen gleichzeitig den letzten Pflegetermin ein** | `pruefung` ohne Sperre; beide Inserts gelingen | `frappe.db.get_value(..., for_update=True)` auf die Karte in `pruefung` bzw. Einlösung; UI-Fehlerfall „Gerade an anderer Stelle eingelöst“ |
| **Jahreswechsel**: Einlösung 31.12. 23:50 an der Kassa, Beleg 01.01. | Limit nach `eingeloest_am` (Serverzeit) | Kalenderjahr nach Belegdatum des Bezugs, falls vorhanden |
| **Gesperrte Karte im Wallet** | Pass bleibt sichtbar, kein Push-Web-Service | P11; Kassa zeigt Sperre (vorhanden) |
| **Website-Antrag, Auto-Annahme aus, manuell angenommen** | Karte `Beantragt` (F2) | Dialog zeigt „Karte wird ‚Beantragt‘ – Aktivieren nach Übergabe“ oder P-Änderung `aktiv=True` im Dialog |

---

## 7. Pflichtänderungen (konsolidiert, vor Livegang)

| # | App · DocType | Änderung | Grund |
|---|---|---|---|
| **P1** | ph_kundenkarte · PH Kundenkarte Antrag | `vertragsdaten_akzeptiert` + `bedingungen_version` Pflicht für alle Quellen; `email` Pflicht nur Website, sonst E-Mail **oder** neue Felder `strasse`, `land`; neu `nachweis_datei` (Attach), `datenschutzinfo_version` (Data), `volljaehrig_bestaetigt` (Check), `ablehnungsgrund` (Select), `erfasst_durch` (Link User); Auto-Verknüpfung per E-Mail nur bei gleichem Nachnamen | §2, §4.4, §4.6, PR11 |
| **P2** | ph_kundenkarte · `umsatz.py`, `ereignisse.py` | B1–B8: Rechnungsarten, Kassenbeleg-Positionen statt `gesamt_cent`, PH Gutschrift abziehen (+ doc_event), nur bezahlt, netto, Währung mit Belegkurs, Belege per Kartennummer; Unittests je Fall in `tests/test_stufen.py` | §5 |
| **P3** | ph_kundenkarte · PH Kundenkarte | `einwilligung_auswertung`, `einwilligung_textversion` → `read_only`; Methoden `einwilligung_erteilen(textversion, kanal, nachweis_datei)`, `einwilligung_widerrufen(kanal, hinweis)`; neu `einwilligung_kanal` (Select `website, showroom, kassa, portal, brief`), `einwilligung_nachweis` (Attach); `geburtstag_einwilligung` (Check) | Art. 7 DSGVO |
| **P4** | ph_kundenkarte · PH Kundenkarte, PH Kundenkarte Einloesung, PH Kundenkarte Ereignis | `ersatzkarte_ausstellen(grund)`; Felder `vorgaenger_karte`, `nachfolger_karte`; Ereignis-Art `Ersatzkarte`; Limits über `PH Kundenkarte Einloesung.kontakt` | F9, PR8 |
| **P5** | ph_kundenkarte · PH Kundenkarte Einloesung, PH Kundenkarte Vorteil | `BEZUG_ERLAUBT` += `PH Auftragsbestaetigung`, `PH Lieferschein`, `PH Montageauftrag`; `status` += `Zugesagt`; Felder `zugesagt_am`, `erbracht_am`, `erbracht_bezug_doctype`, `erbracht_bezug`; `PH Kundenkarte Vorteil.bezug_pflicht` (Check) und `bezug_typen` (Small Text, erlaubte DocTypes je Vorteil) | PR1–PR4 |
| **P6** | ph_kassa · PH Kassenbeleg Position; ph_kundenkarte · api | Position `art = Kartenleistung` (0,00 €, Bezug PH Kundenkarte Vorteil); Einlösung im `on_submit`; neue Methode `api.vorteil_pruefen(kartennummer, vorteil)`; Trainingsbeleg-Sperre; Stornobeleg-Kaskade | §4.1, PR5 |
| **P7** | ph_kundenkarte · PH Kundenkarte | `on_update`: Ereignis `Einwilligung`/`Widerruf`; Widerruf leert `jahresumsatz_cent`/`hinweis` aller Ereignisse der Karte | F6, Art. 17 |
| **P8** | ph_kundenkarte · PH Kundenkarte (Permissions) | `jahresumsatz_cent`, `gesamtumsatz_cent`, `letzter_einkauf`, `umsatz_berechnet_am` → permlevel 1 (Leitung, GF); `kontakt` → `set_only_once` (Änderung nur `Beantragt` über Methode); `PH Website Integration`: `write` auf PH Kundenkarte entziehen (API läuft mit `ignore_permissions`) | F10, F11 |
| **P9** | ph_kundenkarte · PH Kundenkarte | `stufe`, `stufe_manuell` → permlevel 2 (write Leitung); neu `stufe_manuell_grund` (Pflicht bei manuell) | F12, GlBG |
| **P10** | ph_kundenkarte · tasks.py, PH Kundenkarte Einstellungen | `anonymisieren()`; Scheduler: gekündigte Karten nach `loeschfrist_monate_karte`, Anträge `Abgelehnt/Doppelt` nach `loeschfrist_monate_antrag` (Werte: Inhaber/Kanzlei); `delete`-Recht der Leitung auf Karte/Antrag/Einlösung entziehen | Art. 5, PR9 |
| **P11** | ph_kundenkarte · wallet.py | Bei Sperre/Kündigung/Ersatzkarte Pass-Status „ungültig“ (Apple `voided`, Google `state: INACTIVE`) beim nächsten Abruf; Pass-Inhalt auf Kartennummer, Vorname, Stufe beschränken | Randfall Wallet, DSGVO |
| **P12** | ph_kundenkarte · tasks.py; ph_crm · PH Aufgabe | Geburtstags- und „ohne Einkauf“-Aufgaben nur mit erlaubtem Kanal (`kanal_erlaubt`), keine Aufgabe bei `nicht_kontaktieren`; Text ohne „Anruf“; 29.02.-Regel | TKG § 174, PR10 |
| P13 | ph_kundenkarte · Kundentexte | `install.py` Umtausch-Text ohne „Gutschrift“; `GELD_RE` += `Gutschrift|Gutschein|gratis|kostenlos` (letztere: Preisangaben, Kanzlei) | §4.2 |
| P14 | ph_kundenkarte · PH Kundenkarte Stufe | Deaktivieren nur ohne Karten; `karten_umstufen(ziel)` | Randfall |
| P15 | ph_kundenkarte · Report PH Kundenwert | Euro nur Leitung/GF serverseitig | §2 |
| P16 | ph_kundenkarte · Kanban-Fixture | entfernen oder Status-Schutz | §2 |

P1–P12 blockieren den Livegang, P13–P16 vor der ersten Schulung.

---

## 8. Änderungen am UI-Konzept (`10-konzept-kundenkarte.md`)

### 8.1 Neuer Dialog „Einwilligung erfassen“ (ersetzt Speicherleiste im Tab Einwilligung)

```
┌ Einwilligung zur Auswertung der Einkäufe erfassen ─────────────── × ┐
│ Text, den die Kundin bestätigt hat                                   │
│  [kundenkarte-auswertung-v1 ▾]  (Liste aus Einstellungen, readonly)  │
│  ▸ Text anzeigen (aufklappbar, 14 px, Sie-Form)                      │
│ Wie erteilt?  (•) Unterschrift im Showroom  ( ) Brief  ( ) Portal    │
│ Nachweis      [Datei wählen / Foto aufnehmen]  (Pflicht außer Portal)│
│ ☐ Die Kundin hat die Datenschutzinformation erhalten (Version …)    │
│                                          [Abbrechen] [Erfassen]      │
└──────────────────────────────────────────────────────────────────────┘
```
- md 560, Primär deaktiviert bis Nachweis + Häkchen; iPad: Kamera-Sheet für Foto der Unterschrift.
- Aufruf `einwilligung_erteilen`. Erfolg: Toast „Einwilligung erfasst · Umsatz wird berechnet“, danach automatisch `umsatz_neu_berechnen`, Stufenblock füllt (400 ms, `--bo-ease-out`), reduce-motion: sofort.
- Fehler `invalid` (Textversion fehlt in Einstellungen) → Feldfehler „Textversion zuerst in Einstellungen anlegen (Leitung)“.
- Widerruf: eigener Dialog sm 400, Pflicht „Wie widerrufen?“ (Showroom, Telefon, Brief, E-Mail), Folgen-Satz wie bisher + „Gespeicherte Umsatzwerte im Verlauf werden gelöscht.“

### 8.2 Stufenblock und Rechte
- Mitarbeiter: nur Stufenname + „nächste Stufe: <Name>“; **keine** Beträge (F13, P8). Leitung/GF: Umsatz (netto), „bis <Stufe>“, Schwellen.
- Fußzeile immer: „Zählt: bezahlte Rechnungen, Kassenkäufe, Shop-Bestellungen; Anzahlungen mit der Schlussrechnung; Gutschriften werden abgezogen.“
- Regel „kurz vor <Stufe>“ (§8.3) entfernen.

### 8.3 Vorteil einlösen – neue Zustände
| Zustand | Anzeige |
|---|---|
| `Zugesagt` | Kachel-Kennzeichen „zugesagt zu AB-2026-…“ (Sand-Outline), zählt gegen Limit |
| `Eingeloest` | Häkchen „erbracht am …“ |
| Bezug Pflicht (Lieferung, Montage, Pflege) | Feld „Bezug“ rot umrandet, Primär deaktiviert, Text „Bitte Auftrag, Lieferschein oder Montageauftrag wählen“ |
| Bezugsvorschläge leer | „Keine offenen Aufträge dieser Kundin. Leistung ohne Auftrag ist nur für Beratung und Events möglich.“ |
| Wettlauf (Limit gerade erreicht) | Fehler-Toast „Gerade an anderer Stelle eingelöst – Stand aktualisiert“, Kachel lädt neu (Shake 240 ms nur am Knopf) |
- Undo Variante A (5 s) bleibt für Backoffice. Für `Zugesagt` aus der AB heraus kein Undo-Toast, sondern Teil des AB-Speicherns.

### 8.4 Assistent A-KK1
- Schritt 1: E-Mail optional; ohne E-Mail Anschrift Pflicht, Hinweis „Ohne E-Mail: kein Kundenportal und kein Wallet-Pass. Begrüßung kommt per Post.“
- Schritt 2: Nachweis-Upload/Foto Pflicht bei Auswertung = ja; Häkchen Datenschutzinfo; Häkchen volljährig.
- Schritt 3: „Sofort aktiv“ erst nach P-Änderung `annehmen(aktiv=False)`; bis dahin Haken nicht anzeigen.
- Zusammenfassung: Kartenstatus aus `quelle` und `aktiv` berechnet, nicht fest „Aktiv“.
- Ohne E-Mail: Ergebnis-Karte Primär „Begrüßung + Karte drucken“ (nicht optional).

### 8.5 Antrag-Akte
- Dialog „Ablehnen“: Select Grund (P1) + Freitext bei „Sonstiges“.
- Hinweisband bei gleicher E-Mail, anderem Namen (PR11): `warning-soft` „Diese E-Mail gehört zu <A. M***> – andere Person?“ Knöpfe „Neuen Kontakt anlegen“ / „Ist dieselbe Person“.
- Website-Antrag manuell annehmen: Zusammenfassung „Karte ‚Beantragt‘ – nach Übergabe aktivieren“ (F2).

### 8.6 Kassa-Kiosk (Abgleich mit `10-konzept-kassa.md`)
- Chip antippen → `vorteil_pruefen` (≤ 400 ms, sonst Skeleton am Chip) → Position „Kartenleistung“ 0,00 € im Warenkorb (Einblendung 160 ms `--bo-ease-out`).
- Buchen signiert Beleg inkl. Position; Einlösung im `on_submit`. Ergebnis-Karte zeigt „Kundenkarte: Lieferung im Liefergebiet – eingelöst“.
- Trainingsmodus: Chip-Bereich mit Band „Training – keine Einlösung“.
- Retoure: Zeile „Umtausch bis TT.MM.JJJJ (Kundenkarte)“ aus `ph_kundenkarte_umtausch_bis`.

### 8.7 Karten-Akte – neue Elemente
- Overflow „Ersatzkarte ausstellen…“ (Dialog sm 400, Grund Pflicht: Verlust, Diebstahl, Beschädigung, Namensänderung) → Ergebnis-Karte mit neuer Nummer, Druck Karte; alte Karte zeigt Band „Ersetzt durch KK-…“.
- Bezüge-Spalte: Vorgänger-/Nachfolgerkarte.
- Kopf bei `kontaktart = Geschaeft` (falls Inhaber B2B zulässt): Kennzeichen „Firmenkarte“.
- Overflow Leitung: „Anonymisieren…“ (gefährlich, nur `Gekuendigt`, Bestätigung durch Eintippen der Kartennummer).

---

## 9. Zusätzliche Akzeptanzkriterien

| # | Kriterium | Prüfung |
|---|---|---|
| K27 | Küche: Anzahlungsrechnung 3.000 €, Schlussrechnung 10.000 € (Anzahlung verrechnet) → Umsatz 10.000 € (bzw. netto), nicht 13.000 € | Unittest `utils/stufen.py` + Frappe-Test |
| K28 | Kassa-Anzahlung zu AB + Schlussrechnung → einmal gezählt | Frappe-Test |
| K29 | Teilgutschrift 2.000 € auf Rechnung 12.000 € → Umsatz 10.000 €; innerhalb der Rückgabefrist ggf. Herabstufung | Frappe-Test |
| K30 | Rechnung CHF 1.000, Kurs am Beleg → Umsatz in EUR mit Belegkurs; Beleg ohne Kurs → nicht gezählt + Ereignis | Frappe-Test |
| K31 | Kassenbeleg nur mit Kartennummer (ohne Kontakt) zählt zur Stufe | Frappe-Test |
| K32 | Stornobeleg zu einem Bon mit Kartenleistung → Einlösung `Storniert`, Rest +1 | E2E Kiosk |
| K33 | Trainingsbeleg → keine Einlösung | E2E Kiosk |
| K34 | Mitarbeiter-Token: `GET PH Kundenkarte/<KK>` liefert keine Umsatzfelder; `PUT kontakt` → 403 | API-Test |
| K35 | Einwilligung erteilen ohne Nachweis → Primär deaktiviert; `save` mit `einwilligung_auswertung=1` per API → Fehler | E2E + API |
| K36 | Widerruf → alle Ereignisse der Karte ohne `jahresumsatz_cent`; Ereignis „Widerruf“ vorhanden | Frappe-Test |
| K37 | Ersatzkarte: Stufe, `stufe_seit`, Einwilligung übernommen; Pflegetermin im Jahr bereits genutzt → auch auf neuer Karte „0 von 1“ | E2E |
| K38 | Antrag ohne E-Mail mit Anschrift (Showroom) → Karte `Aktiv`, Druck Begrüßung Pflichtschritt | E2E |
| K39 | Zweiter Antrag gleiche E-Mail, anderer Nachname → kein Auto-Kontakt, Hinweisband | E2E |
| K40 | Geburtstag 29.02. → Aufgabe am 28.02. in Nicht-Schaltjahr; `nicht_kontaktieren = 1` → keine Aufgabe; Aufgabentext ohne „Anruf“ ohne Telefon-Einwilligung | Scheduler-Test |
| K41 | Zwei parallele Einlösungen des letzten Kontingents → genau eine gelingt | Last-Test (2 Requests) |
| K42 | Lieferung mit Bezug AB → Status `Zugesagt`; Lieferschein erledigt → `Eingeloest`; Herabstufung dazwischen ändert nichts | E2E |
| K43 | Mitarbeiter ändert `eingeloest_am` einer Einlösung per API → 403/Fehler | API-Test |

---

## 10. Offene Entscheidungen (an Inhaber, Kanzlei, Steuerberater)

| An | Frage |
|---|---|
| Inhaber | Umsatz netto oder brutto; nur bezahlt oder schon gestellt; Aufträge zählen bei AB oder Schlussrechnung (B5, B6, B11) |
| Inhaber | Karenz zwischen Kauf und Aufstufung / Herabstufung bei Retoure (PR7) |
| Inhaber | Kundenkarte auch für Firmenkunden (Hotel, Yacht, Gastro)? Vorschlag: nein |
| Inhaber | Liefergebiet (PLZ-Liste) und Umtausch-Ausschlüsse (Sonderanfertigung, Küche) |
| Kanzlei | FAGG auf Teilnahmevertrag; Teilnahmebedingungen inkl. Mindestalter, Kündigung durch Platzhirsch, Fortbestand zugesagter Leistungen; Einwilligungstexte (Auswertung, ggf. „Hinweis durch Beraterin“); Löschfristen; Wallet-Anbieter in Datenschutzerklärung; „kostenlos/gratis“ in Kundentexten |
| Steuerberater | Steuersatz der 0-€-Kartenleistung als Nebenleistung; unentgeltliche Leistungen ohne Kauf (Pflege, Montage, Event); Behandlung der Programmkosten |
| ph_kassa | Übernimmt `stornieren` (Stornobeleg) `kontakt` und `ph_kundenkarte_kartennummer`? (B9) |

*Ende 21 – Fachkritik Kundenkarte.*
