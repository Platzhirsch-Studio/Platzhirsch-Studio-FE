# 21 – Fachkritik Faktura (Konzept `10-konzept-faktura.md` gegen `ph_faktura`)

**Zweck:** Fachliche und rechtliche Prüfung des Faktura-Konzepts aus zwei Blickwinkeln: Möbelhandel-Betrieb mit österreichischem Recht (RKSV/BAO, UStG, FAGG, ABGB/UGB, DSGVO, GlBG) und Buchhaltung, dazu ein Abgleich mit den Daten in `Backend-Import/ph_faktura` (README, 23 DocType-JSONs, Methoden in `ph_rechnung.py`, `ph_gutschrift.py`, `ph_auftragsbestaetigung.py`, `ph_bankumsatz.py`, `ph_eingangsrechnung.py`, `ph_mahnung.py`, `ph_export_lauf.py`, `ph_uva_auswertung.py`, `zahlung.py`, `kassa.py`, `versand.py`, `kennzahlen.py`, `rechenwerk/steuer.py`, Report `ph_offene_posten`, dazu `ph_crm` PH Kontakt und `ph_kassa` PH Kassenbeleg Position). Das Ergebnis ist eine Liste von Pflichtänderungen mit DocType, Feld und Methode, aus der der Fachbereichs-Agent und Backend-Import direkt arbeiten können.
**Stand:** 2026-11-04 · Rolle: Fachkritiker Möbelhandel/Recht/Buchhaltung + Frappe-Datenprüfer · Status: Prüfbericht, keine Inhaber-Entscheidung, keine Steuerberatung. Mit „StB“ markierte Punkte bestätigt die Kanzlei.
**Schweregrade:** **K** = kritisch, vor dem ersten echten Beleg beheben (Rechts- oder Geldfehler) · **H** = hoch, vor Go-Live Backoffice · **M** = mittel, in der ersten Ausbaustufe.

---

## 1. Gesamturteil

**Note: 6 / 10.**

| Gut | Ungenügend |
|---|---|
| Die Bedienung ist vollständig durchdacht (Listen, Akten, Dialoge, Tastatur, Leerzustände, Motion). Die Methodennamen sind exakt aus dem Backend übernommen. | Drei Barzahlungswege laufen an der Registrierkasse vorbei (Zahlung erfassen „Bar/Karte extern/Gutschein“, Erstattung „Bar“, Inkasso bei der Montage). |
| Die Lücken werden ehrlich benannt („fehlt in App“, Sammelliste §12). | Eine Anzahlung an der Kassa ohne Anzahlungsrechnung führt zu **doppelter USt und Doppelverrechnung** an den Kunden. Das Konzept nennt es nur als Anzeige. |
| Die Belegkette stimmt im Kern: Nummer erst beim Stellen, Storno nur per Gutschrift, Export sperrt Belege. | Die FAGG-Frist wird ab dem Vertragsdatum gerechnet (Backend). Das Konzept baut Banner und Erinnerung darauf, ohne das zu prüfen. |
| Pflichtangaben-Prüfer, Hinweis auf die Ist-Versteuerung der Anzahlung, Journal | Fremdwährung CHF fehlt fachlich ganz (`kurs` wird nirgends verwendet, Eingangsrechnungen haben keine Währung). |
| | Eine Periodensperre fehlt, das Rechnungsdatum lässt sich frei zurückdatieren, und Felder gestellter Rechnungen sind per API änderbar (`allow_on_submit` ohne Schutz). |
| | Mehrere Aussagen im Konzept widersprechen dem Backend: F-01, F-15, der OP-Stichtag, „neue UVA-Auswertung für Korrekturen“, „Umsatz Monat“. |

Die Note steigt auf **8**, wenn die K-Punkte aus §8 umgesetzt und die StB-Fragen aus §10 beantwortet sind.

---

## 2. Rechtsverstöße und rechtliche Risiken

| ID | Schwere | Recht | Konzeptstelle | Befund (Backend) | Pflichtänderung |
|---|---|---|---|---|---|
| R-01 | **K** | § 131b BAO (Registrierkasse), § 132a BAO (Belegerteilung), RKSV | §4.4 Dialog „Zahlung erfassen“, Kanal-Segment *Bar · Karte extern · Gutschein* | `PH Rechnung.zahlung_erfassen(kanal)` nimmt jeden Wert aus `zahlung.KANAELE` an, auch „Bar“ und „Karte extern“. Barzahlungen und Kartenzahlungen sind Barumsätze. Werden sie im Backoffice ohne signierten Kassenbeleg gebucht, fehlt der RKSV-Beleg. | Im Backoffice sind nur **Überweisung** und **Stripe Link** zulässig (Stripe Link bestätigt der StB, siehe §10). „Bar/Karte“ öffnet keinen Buchungsdialog, sondern einen Hinweis: „Barzahlung und Kartenzahlung nur an der Kassa · Auftrag an Kassa übergeben“. Backend: `zahlung_erfassen` lehnt `kanal in ("Bar","Karte extern","Stripe Terminal")` ab, außer bei `frappe.flags.ph_kassa`. |
| R-02 | **K** | wie R-01 | §3.4 Gutschrift „Erstatten“, Kanal *Bar* | `PH Gutschrift.erstatten(kanal)` bucht eine Bar-Erstattung ohne Kassenbeleg. | Eine Bar-Rückzahlung läuft nur über die Kassa (Auszahlungs- oder Stornobeleg mit Bezug `PH Gutschrift`). Backend: Kanal „Bar“ in `erstatten` sperren. Neues Feld `PH Gutschrift.kassenbeleg` (Link PH Kassenbeleg). |
| R-03 | **K** | § 131b BAO, BMF-Erlass zur Registrierkasse (Kartenzahlung = Barumsatz) | §7 Montage mobil „Zahlungslink zeigen (QR)“ | Zahlt der Kunde vor Ort mit Karte über einen Stripe-Link, ist das sehr wahrscheinlich ein Barumsatz ohne Kassenbeleg. Für Bargeld an den Monteur gibt es gar keinen Weg. | Bei der Montage nur **EPC-QR (Überweisung)**. Karte nur über eine mobile Kassa (ph_kassa, Stripe Terminal). Bargeld an den Monteur erst nach einer Entscheidung der StB (mobile Kassa oder Handbeleg mit Nacherfassung). Im Konzept §7 den Stripe-Link aus dem Montage-Kontext streichen. |
| R-04 | **K** | § 11 Abs 1 Z 3 lit i UStG (UID des Empfängers über 10.000 € nur bei **Unternehmer**-Empfänger) | §3.1 Pflichtangaben-Prüfer, F-15 | `steuer.pflichtangaben_pruefen` verlangt die UID bei jedem Betrag über 10.000 €. Privatkunden mit Küchen über 10.000 € sind der Normalfall. Das Stellen schlägt dann fehl oder die Mitarbeiter tragen Fantasie-UIDs ein. | Die Regel greift nur, wenn `PH Kontakt.kontaktart in (Geschaeft, Architekt, Partner)` oder `firma` gesetzt ist. Neues Feld `PH Rechnung.empfaenger_unternehmer` (Check, aus `kontaktart` vorbelegt, im Entwurf änderbar). F-15 neu: „> 10.000 € brutto, **Unternehmer**, ohne UID → Meldung; Privat → keine Meldung“. |
| R-05 | **K** | § 11 FAGG (Frist bei Waren ab Übernahme, bei Teillieferung ab der letzten Ware), § 12 FAGG (+12 Monate ohne Belehrung), § 18 Abs 1 Z 3 FAGG (kein Rücktritt bei Maßanfertigung), § 10/§ 16 FAGG (vorzeitiger Beginn einer Dienstleistung) | §3.3 Banner „Rücktrittsrecht bis …“, §8.2 Erinnerung „FAGG-Frist endet“ | `PH Auftragsbestaetigung.validate`: `fagg_frist_ende = datum + 14`. Bei Möbellieferungen falsch. `fagg_belehrung_beigelegt` beeinflusst die Frist nicht. Es gibt kein Kennzeichen für Maßanfertigung und keinen Vermerk für den vorzeitigen Beginn. | Neue Felder in PH Auftragsbestaetigung: `fagg_vertragsart` (Select: Kaufvertrag Ware · Dienstleistung · Werkvertrag/Maßanfertigung · gemischt), `fagg_ausnahme` (Select: keine · Maßanfertigung § 18 Abs 1 Z 3 · sonstige), `fagg_fristbeginn` (Date: Ware = Datum der letzten Lieferung aus dem Lieferschein, Dienstleistung = Vertragsdatum), `fagg_vorzeitiger_beginn_verlangt` (Check) + `fagg_vorzeitiger_beginn_am` (Date). `fagg_frist_ende` = Fristbeginn + 14, ohne Belehrung + 12 Monate. Das Banner zeigt den Grund: „Frist beginnt mit Lieferung (noch nicht geliefert)“. |
| R-06 | **H** | § 15 FAGG (Rückzahlung binnen 14 Tagen nach Rücktritt) | fehlt | Ein Rücktritt ist kein eigener Vorgang. `stornieren(grund)` storniert den Auftrag, die bezahlte Anzahlungsrechnung bleibt aber „Bezahlt“ (nur ein Hinweistext). | Neuer Prozess „Rücktritt (FAGG)“, siehe §5.1. |
| R-07 | **H** | § 5 Abs 2, § 7 Abs 3 FAGG (Bestätigung auf dauerhaftem Datenträger) | §3.3 AB „Senden“, §4.1 Kanban-Drag „Angenommen“ ohne Unterschrift | `PH Auftragsbestaetigung.senden` ruft `versand.senden(…, feld_gesendet=None)` auf. Dass die AB versandt wurde, ist nicht nachweisbar. Die Annahme per Drag hinterlässt keinen Nachweis. | Neue Felder: `PH Auftragsbestaetigung.gesendet_am` (Date), `PH Angebot.annahme_art` (Select: Unterschrift Showroom · E-Mail · Portal · Telefon · Brief) Pflicht bei `annehmen()`, `PH Angebot.annahme_nachweis` (Attach). Ein Drag ins „Angenommen“ öffnet den Annehmen-Dialog mit Pflichtfeld „Annahme über“. Bei `vertragsort != Showroom` verweigert `senden` den Versand, solange `fagg_belehrung_beigelegt = 0`. Heute zeigt das Konzept dafür nur eine Checkbox. |
| R-08 | **K** | § 11 Abs 1 Z 3 lit d UStG (Tag der Lieferung) | F-01, §3.1 Prüfer | `PH Rechnung.validate`: Ist kein Leistungsdatum gesetzt, wird es auf das Rechnungsdatum gesetzt. Die Prüfung „Tag der Lieferung fehlt“ kann deshalb nie anschlagen. F-01 ist so nicht erreichbar, und der Beleg trägt ein falsches Leistungsdatum. | Diese Vorbelegung entfernen. Vorbelegung nur aus einer belastbaren Quelle: Datum der Lieferschein-Zustellung (ph_logistik), Montage-Abnahme oder Kassa-Datum bei Barverkauf. Sonst bleibt das Feld leer und der Prüfer meldet es. Teilrechnung: `rechnung_erstellen` setzt heute `liefertermin_bestaetigt or nowdate()`. Richtig wäre das Datum der abgerechneten Teillieferung. |
| R-09 | **K** | § 19 Abs 2 Z 1 lit a UStG (Steuerschuld mit Ablauf des Leistungsmonats, bei späterer Rechnung höchstens 1 Monat später) | §2.9 UVA „Soll nach Belegdatum“ | `uva_monat` = Monat des Rechnungsdatums. Wird erst mehr als einen Monat nach der Lieferung fakturiert, liegt die USt zu spät in der UVA. | `uva_monat` = min(Monat des Rechnungsdatums, Leistungsmonat + 1). Warnband im Stellen-Dialog: „Lieferung im August, Rechnung im November – USt gehört in die UVA September; Steuerberater informieren“. Bestätigt die StB. |
| R-10 | **K** | § 11 Abs 1 UStG (Endrechnung: abzuziehen sind **vereinnahmte** Teilentgelte), § 19 Abs 2 UStG | §4.5 A4b, F-05 | `offene_anzahlungen` zieht jede **gestellte** Anzahlungsrechnung ab, auch wenn sie unbezahlt ist. Nach der Leistung entsteht die Steuerschuld auf den unbezahlten Teil (Soll). In der UVA erscheint er aber erst bei Zahlung (Ist-Zweig). | Variante A: Eine unbezahlte oder teilbezahlte Anzahlungsrechnung wird vor der Schlussrechnung im Umfang des unbezahlten Rests per Storno-Gutschrift aufgelöst, und die Schlussrechnung verrechnet nur Vereinnahmtes. Variante B: Die UVA zieht die USt einer nicht vereinnahmten Anzahlung im Monat der Schlussrechnung nach. Das Konzept A4b, Schritt 2 zeigt je Anzahlungsrechnung „gestellt / bezahlt“ und blockiert bei Differenz mit der Aktion „Rest auflösen“. Welche Variante gilt, entscheidet die StB. |
| R-11 | **K** | § 16 Abs 3 Z 1 UStG (USt-Berichtigung bei Uneinbringlichkeit, Rückberichtigung bei späterem Eingang) | §4.1 „Als uneinbringlich buchen“ | `uneinbringlich()` setzt nur Status und Journal. Die UVA (`berechne`) und der Export kennen keine Uneinbringlichkeit. Ein späterer Bankeingang ist nicht zuordenbar, weil `offene_belege` „Uneinbringlich“ ausschließt. | Neue Felder in PH Rechnung: `uneinbringlich_am` (Date), `uneinbringlich_cent` (Int), `uneinbringlich_ust` (Tabelle PH Beleg Steuer). UVA: negative Zeile im Monat der Ausbuchung. Export: Buchungszeile „Forderungsabschreibung“ mit Steuerkorrektur. Bankumsatz: Uneinbringliche Rechnungen bleiben zuordenbar (Hinweis „Eingang auf ausgebuchte Forderung – USt wird nachberichtigt“). Teilweise Ausbuchung erlauben. |
| R-12 | **H** | § 16 Abs 1 UStG (Entgeltminderung durch Skonto) | §4.5 A8 „Rest als Skonto buchen – fehlt“, §2.7 ER Skonto | Kunden-Skonto: Es gibt keine Buchung, der Rest bleibt offen und gerät in den Mahnlauf. Lieferanten-Skonto: `zahlbetrag_cent` wird in `validate` mit `nowdate()` berechnet (zeitabhängig gespeichert), die Vorsteuer wird nicht korrigiert. | `PH Rechnung Zahlung.art` (Select: Zahlung · Skonto · Ausbuchung Kleindifferenz · Verrechnung Gutschrift) + `ust_aufteilung_json`. Skonto mindert die Bemessung in UVA und Export. ER: `skonto_genutzt_cent` beim Bezahlen festschreiben, Vorsteuer anteilig mindern. `zahlbetrag_cent` nicht mehr zeitabhängig speichern, sondern im Zahllauf berechnen. |
| R-13 | **H** | § 20 Abs 6 UStG (Umrechnung von Fremdwährung), § 131 BAO | Konzept §3.1 Tab Steuer „Währung/Kurs“ | `PH Rechnung.waehrung/kurs` existieren, `kurs` wird **nirgends** verwendet. UVA und Export zählen CHF-Cent als Euro. `zahlung_erfassen` und `zuordnen` buchen immer `waehrung="EUR"`. PH Eingangsrechnung hat **keine** Währung. | Phase 1 (Pflicht): Fremdwährung sperren. Die UI zeigt die Währung nur lesend „EUR“, ein Konto, das nicht in EUR geführt ist, kann keine CAMT-Datei importieren (Fehler „Konto in CHF – Fremdwährung noch nicht freigegeben“). Phase 2: siehe §6.5. |
| R-14 | **H** | § 7 UStG (Ausfuhrnachweis), § 6 Abs 1 Z 1 UStG; Ort der Montagelieferung § 3 UStG | §2.9, Steuer-Tab | `ust_fall_bestimmen` setzt bei CH und LI pauschal „Ausfuhr“ (KZ 011). Es gibt keinen Nachweis. Eine Montage in der Schweiz ist eine im Inland nicht steuerbare Werklieferung (Schweizer MWST) und keine Ausfuhr. Holt ein Schweizer Kunde im Showroom ab, ist die Lieferung ohne Ausfuhrnachweis mit 20 % steuerpflichtig. | Neue Felder in PH Rechnung: `ausfuhr_art` (Select: Versendung durch uns · Abholung Kunde (Touristenexport) · Montage im Drittland (nicht steuerbar)), `ausfuhr_nachweis` (Select: Ausgangsvermerk/MRN · U34 bestätigt · fehlt), `ausfuhr_mrn` (Data), `ausfuhr_nachweis_am` (Date), `ausfuhr_nachweis_datei` (Attach). Arbeitsliste „Ausfuhrnachweise offen“ mit Frist. Ohne Nachweis bei Fristablauf: Aufgabe „Nachversteuern – Gutschrift + Rechnung 20 %“. Der USt-Fall „Montage Drittland“ hat eine eigene Kennzahl (nicht steuerbar), nicht KZ 011. |
| R-15 | **H** | § 1333 Abs 2 ABGB (Betreibungskosten nur angemessen; bei Verbrauchern vereinbart), § 458 UGB (40 € Pauschale B2B), § 456 UGB (9,2 Prozentpunkte über dem Basiszinssatz), § 1000 Abs 1 ABGB (4 %) | §2.10 Mahnwesen | `mahnbetrag(…, unternehmer=bool(re.firma))` stellt die Unternehmereigenschaft nur anhand des Firmenfelds fest. Der B2B-Zinssatz ist eine feste Zahl, der Basiszinssatz ändert sich halbjährlich. Die Gebühr greift auch bei Verbrauchern ohne Prüfung der AGB. Mahngebühr und Zinsen sind keine offenen Posten. | Unternehmer-Prüfung über `PH Kontakt.kontaktart`. `PH Mahnwesen Einstellungen`: `basiszinssatz_promille` + `basiszinssatz_gueltig_ab`, B2B-Satz = Basiszinssatz + 920; `gebuehr_verbraucher_nur_mit_agb` (Check) und `pauschale_b2b_cent` (4000). Für Mahnspesen eine eigene OP-Zeile, siehe §3 B-07. |
| R-16 | **H** | BAO § 132 (7 Jahre unveränderte Aufbewahrung), UGB § 212, DSGVO Art 17 Abs 3 lit b | fehlt | Die fixierte PDF ist eine normale `File`, die ein System Manager löschen kann. Es gibt keine Löschsperre für Kontakte mit Belegen. | Ein Journal-Eintrag „PDF fixiert“ mit SHA-256 der Datei (`PH Buchungsjournal.details`). `on_trash` von `File` mit `attached_to_field = pdf` an PH Rechnung/Gutschrift/Mahnung sperren. PH Kontakt: Löschen mit Belegen jünger 7 Jahre → „Sperren statt Löschen“ (`status = Gesperrt` + Pseudonymisierung der Marketingfelder). Faktura-Felder bleiben erhalten. |
| R-17 | **H** | DSGVO Art 5 Abs 1 lit c, Art 25, Art 32 | §2 CSV in allen Listen, §2.6 Bank (IBAN, Verwendungszweck), §1 Steuerberater-Zugang | Ein CSV-Export ganzer Listen mit IBANs und Adressen steht jedem Mitarbeiter offen und wird nicht protokolliert. Der Präsentationsmodus blendet interne Preise aus, aber keine fremden Kundendaten (Zu-tun-Liste, Suche). | CSV aus Bank, OP und Eingangsrechnungen nur für die Leitung, jeder Export als Eintrag `PH Buchungsjournal.vorgang = Export` (neuer Wert „Listenexport“). Der Präsentationsmodus sperrt ⌘K, Zentrale und alle Listen (nur die geöffnete Akte). Die Rolle „Buchhaltung extern“ sieht kein `notiz_intern`, keine Unterschrift und keine `ip_hash`. |
| R-18 | **M** | GlBG §§ 30 ff (Zugang zu Gütern und Dienstleistungen) | Versand- und Mahntexte | `versand.senden` grüßt neutral („Guten Tag {kunde_name}“), das passt. Im Konzept stehen „Fam. Muster“ und Anrede-Vorlagen ohne Regel. | Anrede-Variable `{anrede_brief}` aus `PH Kontakt.anrede`: Frau → „Sehr geehrte Frau …“, Herr → „Sehr geehrter Herr …“, Divers/leer → „Guten Tag Vorname Nachname“. Keine Rabatt- oder Zahlungsbedingungsregel nach Geschlecht oder Herkunft. Die Ablehnungsgründe im Angebot enthalten nichts Personenbezogenes. |
| R-19 | **M** | § 14 UGB (Firmenbuchangaben auf Geschäftspapieren) | §6.3 Betreff „– Platzhirsch Home Living“ | Die Fußzeile in `ph_basis.html` druckt `firma.firmenname`, FN und Gericht. Die Signatur der Mail nennt nur „Platzhirsch Home Living“. | In PH Firma `firmenname` = „MW Immobilienverwaltungs GmbH“ (Marke „Platzhirsch Home Living“ zusätzlich). Die Mailsignatur nennt Firma, Sitz, FN und Gericht. Bitte prüfen, auch wenn das Druckbild schon stimmt. |

---

## 3. Fehler in der Buchhaltungslogik (Daten und Methoden)

| ID | Schwere | Befund | Folge | Pflichtänderung |
|---|---|---|---|---|
| B-01 | **K** | **Kassa-Anzahlung ohne Anzahlungsrechnung** (`kassa._auf_auftrag`): Die Kassa schreibt nur `PH Zahlungsplan.bezahlt_cent`. `stand_aktualisieren` zählt `anzahlung_ist_cent` nur aus Anzahlungsrechnungen. `offene_anzahlungen` kennt nur Anzahlungsrechnungen. `PH Rechnung Anzahlung.anzahlungsrechnung` ist Pflicht-Link auf PH Rechnung. | Die Schlussrechnung zieht die Kassa-Anzahlung **nicht** ab. Der Kunde zahlt doppelt, die USt steht im Kassenbon (Position `steuersatz`) **und** in der Schlussrechnung. Der Stand-Balken zeigt „Anzahlung 0“. | Kassa-Position „Anzahlung auf Auftrag“ ist nur mit vorhandener Anzahlungsrechnung erlaubt. Die Kassa erstellt und stellt sie bei Bedarf über `anzahlungsrechnung_erstellen(zeile)` + `stellen()` und bucht den Kassenbeleg als Zahlung darauf. Der Kassenbon ist dann ein **Zahlungsbeleg zur Rechnung RE-…**, ohne zweite USt-Ausweisung. Das wird mit StB und RKSV-Logik in ph_kassa abgestimmt. Im Konzept: Hinweis §1/§7 „nur Anzeige“ ersetzen durch „Kassa verlangt Anzahlungsrechnung“. |
| B-02 | **K** | **Doppelte Umsatzsteuer Kassa ↔ Faktura:** Zahlungen auf Anzahlungsrechnungen gehen in `PH UVA Auswertung` als „Anzahlung vereinnahmt“ ein. Derselbe Kassenbeleg steht in ph_kassa „Kassenumsatz nach Steuersatz (UVA-Zuarbeit)“. Dasselbe gilt für `Barverkauf`-Rechnungen aus Kassa-Vorgängen (`create_cash_invoice`) neben dem Kassenexport. | Die USt wird zweimal gemeldet bzw. die Erlöse zweimal exportiert. | Eine Quelle je Umsatz. Neues Feld `PH Rechnung.umsatz_quelle` (Select: Faktura · Kassa · Shop). UVA und Export überspringen Belege mit `umsatz_quelle = Kassa`, bzw. die Kassa-Zuarbeit überspringt Zahlungen auf Faktura-Rechnungen. Report „PH Abgleich Kassa ↔ Faktura“ je Monat. **StB.** |
| B-03 | **K** | **Gestellte Rechnungen per API änderbar:** `status`, `offen_cent`, `bezahlt_cent`, `zahlungen`, `zahlungsreferenz`, `export_status`, `storno_durch`, `uva_monat` sind `allow_on_submit`. `validate` kehrt bei `update_after_submit` ohne Prüfung zurück. Dasselbe gilt für Gutschrift `status/erstattet_cent/export_status`. | Jeder Benutzer mit Schreibrecht kann über REST `set_value` einen offenen Posten auf 0 setzen oder die Exportsperre lösen. Das Journal merkt es nicht. | In `validate` (update_after_submit) eine Whitelist: Benutzer dürfen nur `mahnsperre`, `mahnsperre_grund`, `notiz_intern` ändern. Alle anderen Felder nur bei `frappe.flags.ph_system`. Sonst `frappe.throw("Feld ist gesperrt")`. Next-DAL schreibt ausschließlich über Methoden. F-03 entsprechend testen. |
| B-04 | **K** | **Rechnungsdatum frei, keine Periodensperre:** `datum` ist im Entwurf beliebig und wird beim Stellen nicht gesetzt. Die UVA erlaubt nur eine Auswertung je Zeitraum (`validate` wirft bei Doppel). „Übergeben“ sperrt nichts. ER fließen erst ab „Freigegeben“ in die UVA ein. | Eine gestellte Rechnung landet rückwirkend in einer bereits gemeldeten UVA, und die Nummern stehen nicht mehr in Datumsfolge. Spät freigegebene ER fehlen in der UVA. Das Konzept §2.9 „für Korrekturen neue Auswertung“ ist laut Backend unmöglich. | `PH Faktura Einstellungen.gesperrt_bis` (Date), automatisch gesetzt bei `PH UVA Auswertung.als_uebergeben` (Zeitraum-Ende). `stellen()` setzt `datum = heute`. Ein abweichendes Datum ist nur für die Leitung erlaubt und nie ≤ `gesperrt_bis`, ebenso nie vor dem Datum der letzten gestellten RE. Gutschrift und ER: `datum ≤ gesperrt_bis` → Fehler bzw. für ER Buchungsmonat = nächster offener Monat (Feld `PH Eingangsrechnung.buchungsmonat`). UVA: Feld `korrektur_zu` (Link PH UVA Auswertung) und Validierung „ein Original + n Korrekturen“. UVA-Liste „nach Übergabe hinzugekommen“ je Monat. |
| B-05 | **K** | **Storno einer Anzahlungsrechnung:** Die UVA zieht bei einer Storno-Gutschrift die volle USt der AR ab, angesetzt war nur der vereinnahmte Teil. `PH Gutschrift.validate` prüft nicht, ob die AR schon in einer Teil- oder Schlussrechnung verrechnet ist. | Bei einer unbezahlten AR wird zu viel Vorsteuer bzw. zu wenig USt gemeldet. Bei einer verrechneten AR fehlt die Anzahlung doppelt. | Gutschrift zu einer AR: Sperre, wenn sie in `PH Rechnung Anzahlung` einer nicht stornierten Rechnung steht („Zuerst Schlussrechnung RE-… stornieren“). UVA: Gutschriften zu AR nur im Umfang der vereinnahmten Beträge (bzw. erstatteten). Neues Feld `PH Gutschrift.bezug_art` (aus `rechnung.art`). |
| B-06 | **H** | **Überzahlung und Guthaben:** `zahlung_auf_rechnung` setzt `offen_cent = max(offen, 0)`. Beim Bankumsatz wird `zuordnen` auf `offen_cent` gedeckelt, der Rest bleibt „Teilweise“. Nach einer Storno-Gutschrift einer bezahlten Rechnung bleibt `bezahlt_cent`, es gibt aber keinen Saldo. | Das Kundenguthaben ist unsichtbar, der Kontoauszug falsch, und die Rückzahlungspflicht wird vergessen. | Neues DocType **PH Kundenguthaben** (Kontakt, Herkunft Zahlung/Gutschrift, Betrag, verwendet_cent, Status Offen/Verrechnet/Erstattet) oder `PH Rechnung.ueberzahlt_cent` (allow_on_submit, nur System). Bankumsatz-Rest → „Als Guthaben buchen“. OP-Report und Kontoauszug zeigen Guthaben negativ. Kachel „Guthaben offen“. |
| B-07 | **H** | **Mahnspesen und Zinsen nicht als Forderung:** `PH Mahnung.gesamt_cent` enthält Gebühr und Zinsen, die Rechnung bleibt bei `offen_cent`. | Zahlt der Kunde den Mahnbetrag, entsteht eine Überzahlung. Zahlt er nur die Rechnung, gilt die Mahnung als erledigt, ohne Entscheidung zu den Spesen. | `PH Mahnung.spesen_offen_cent` (Int) + `spesen_status` (Offen · Bezahlt · Erlassen). Zuordnung im Bankdialog A8 „Rechnung + Mahnspesen“. Erlass mit Grund (Leitung). Spesen sind nicht steuerbar (Schadenersatz) und gehen mit eigenem Konto in den Export (`erloeskonto_mahnspesen`). |
| B-08 | **H** | **Teilgutschrift und Retoure:** Die Grenze ist `brutto ≤ re.zahlbar_cent`. Bei einer Schlussrechnung nach Anzahlungen ist `zahlbar` nur der Rest, eine Retoure eines Teils über diesem Rest scheitert. Die Summe mehrerer Teilgutschriften wird nicht geprüft. Positionen mit `ab_position` mindern weder `rechnung_menge` noch `lieferschein_menge`. `abgerechnet_cent` der AB zieht Gutschriften nicht ab. | Retouren lassen sich nicht buchen, oder es wird mehr gutgeschrieben, als fakturiert war. Der Auftrag zeigt „abgerechnet“ trotz Rückgabe. | Grenze = `brutto_cent` der Rechnung − Σ gestellte Gutschriften (brutto). Teilgutschrift mit Art „Retoure“: Positionsmengen ≤ fakturierte Menge − bereits gutgeschrieben. `ab_position`: `rechnung_menge −=`, optional `lieferschein_menge −=` (Rücknahme). Neues Feld `PH Gutschrift.ruecknahme` (Link PH Lieferschein/Retoure, ph_logistik). `stand_aktualisieren`: `abgerechnet_cent −= Σ Gutschriften des Auftrags`. |
| B-09 | **H** | **Storno + Neuausstellung (Rechnungskorrektur):** Die Storno-Gutschrift setzt `PH Zahlungsplan.bezahlt_cent = 0` und die Rechnung auf `offen_cent = 0`. Die gebuchten PH Zahlungen hängen an der stornierten Rechnung. Es gibt keine Methode, die Zahlungen auf die neue Rechnung umzubuchen. | Der häufigste Korrekturfall (falsche Adresse, falscher Satz) erzeugt ein Guthaben und eine neue offene Rechnung, die dann gemahnt wird. | Neue Methode `PH Rechnung.korrigieren(grund)`: Storno-Gutschrift + Kopie als Entwurf + nach dem Stellen der neuen Rechnung `zahlungen_umbuchen(von, nach)` (Journal „Korrektur“). Ablauf siehe §5.2. |
| B-10 | **H** | **Zuordnung nicht lösbar:** Das Konzept bucht „Zuordnen 100“ ohne Undo, weil „die Gegenaktion fehlt“. Für eine Rücklastschrift (R-Transaktion im CAMT) gibt es keinen Weg. | Fehlzuordnungen bleiben stehen, und Rücklastschriften erscheinen als Ausgang ohne Beleg. | `PH Bankumsatz.zuordnung_loesen(zeile)` → PH Zahlung stornieren (Handler `ereignisse.zahlung_storniert` existiert) → Rechnung offen. Ausgang mit Rückgabecode → Vorschlag „Rücklastschrift zu BU-…“. Danach Undo 8 s im Konzept §2.6 möglich. |
| B-11 | **H** | **Anzahlung per Überweisung ohne Anzahlungsrechnung:** `offene_belege` kennt nur Rechnung und ER. Eine Zahlung mit „AB-2026-00017“ im Verwendungszweck findet nichts. | Die Zahlung bleibt offen oder landet auf einer falschen Rechnung. | Vorschlag auch auf `PH Auftragsbestaetigung` (Referenz AB-Nummer). Aktion „Anzahlungsrechnung stellen und zuordnen“ (Folge: `anzahlungsrechnung_erstellen` → `stellen` → `zuordnen`). |
| B-12 | **M** | **Gutschein als Zahlkanal im Backoffice** (§4.4) bucht PH Zahlung „Gutschein“ ohne `ph_shop.gutschein.einloesen`. | Der Gutschein bleibt einlösbar, ein Doppelverbrauch ist möglich. Bei einem Einzweckgutschein ist die USt schon beim Verkauf entstanden, die Rechnung weist sie nochmals aus. | Den Kanal im Backoffice entfernen, die Einlösung läuft nur an der Kassa bzw. im Shop. Gutschein-Art (Einzweck/Mehrzweck) entscheidet die StB. |
| B-13 | **M** | **Kanal „Verrechnung“ frei wählbar** (§4.4). | Ein offener Posten kann ohne Gegenbeleg ausgeglichen werden. | „Verrechnung“ nur systemseitig aus Gutschrift oder Guthaben. Im Dialog nicht anbieten. |
| B-14 | **M** | **Anzahlungsrechnung in Export und UVA zeitlich verschieden:** Der Export bucht AR mit Rechnungsdatum auf „Erhaltene Anzahlungen“, die UVA erfasst sie bei Zahlung. | Liest die Kanzlei die Steuer aus BMD, entsteht die USt zu früh bzw. die Werte gehen auseinander. | Export-Option `anzahlung_export` (Bei Zahlung · Bei Rechnung) in PH Faktura Einstellungen, Standard „Bei Zahlung“. Protokollzeile je Zahlung. **StB.** |
| B-15 | **M** | **ER mit mehreren Steuersätzen** wird im Export mit einem Satz aus USt/Netto gerundet (`ph_export_lauf.zeilen_sammeln`). `ust_aufteilung` wird ignoriert. | Bei gemischten Eingangsrechnungen (z. B. Lebensmittel und Ware im Hotelprojekt) stimmt die Vorsteuer nicht. | Export je Zeile aus `PH Eingangsrechnung.ust_aufteilung`, Fallback nur ohne Aufteilung. |
| B-16 | **M** | **Umsatz Monat** (`kennzahlen.umsatz_monat`): Σ `zahlbar_cent` (Schlussrechnung ohne Anzahlungen!) ohne Stornierte **minus** Gutschriften. | Der Umsatz wird zu niedrig ausgewiesen: Anzahlungen fehlen, Stornos werden zweimal abgezogen. Brutto ist für die Geschäftsführung die falsche Basis. | Σ `netto_cent` der Leistungsrechnungen (Rechnung/Teil/Schluss/Barverkauf, auch stornierte) − Σ `netto_cent` der Gutschriften. Label „Umsatz Monat (netto, Leistung)“. Gleiches im Dashboard Chart „PH Umsatz je Monat“ (`value_based_on: netto_cent`). |
| B-17 | **M** | **ER nach Export änderbar:** `zurueck_an_erfassung` ist nur bei „Bezahlt“ gesperrt, Beträge sind nur bei Bezahlt/Abgelehnt gesperrt. | Ein exportierter Beleg kann sich danach ändern. | Bei `export_status = exportiert` sind Beträge, USt-Fall, Datum, `zurueck_an_erfassung` und `ablehnen` gesperrt. Korrektur nur über eine Lieferanten-Gutschrift (§5.6). |
| B-18 | **M** | **Mehrere Teilrechnungen:** `auftrag_fortschreiben` verknüpft nur die erste freie Zahlungsplan-Zeile „Teilzahlung“. | Ab der zweiten Teilrechnung stimmt der Zahlungsplan nicht. | Zahlungsplan-Zeile im Assistenten A4 wählen (Parameter `zahlungsplan_zeile` an `rechnung_erstellen`). Ohne passende Zeile: Hinweis „Teilrechnung außerhalb des Zahlungsplans“. |

---

## 4. UI-Funktionen ohne Datenfeld oder Methode (zusätzlich zur Sammelliste §12 des Konzepts)

| Konzeptstelle | UI-Funktion | Fehlt in ph_faktura | Vorgehen bis dahin |
|---|---|---|---|
| §2.5, §1 Steuerberater | OP zum Stichtag in der Vergangenheit, Banner „spätere Zahlungen nicht berücksichtigt“ | Der Report `PH Offene Posten` filtert `offen_cent > 0` mit dem **heutigen** Stand. Nach dem Stichtag bezahlte Rechnungen fehlen, stornierte ebenso. Die Bannerbehauptung ist falsch. | Report neu: offen zum Stichtag = `zahlbar_cent` − Σ `PH Rechnung Zahlung.betrag_cent` mit `datum ≤ stichtag` − Gutschriften `datum ≤ stichtag`. Bis dahin ist der Stichtagsfilter in der UI **deaktiviert** (Tooltip „Stichtagsauswertung folgt“). |
| §4.4 | Live-Vorschau „Überzahlung wird als Guthaben vermerkt“ | Es gibt kein Guthaben (B-06). | Den Text nicht verwenden, Überzahlung blockieren: „Höchstens 6.240,00 € – Rest als Guthaben folgt“. |
| §2.9 | „Für Korrekturen neue Auswertung“ | `validate` verhindert eine zweite Auswertung je Zeitraum. | Siehe B-04, Feld `korrektur_zu`. |
| §3.1 Tab Steuer | „Währung/Kurs“ | Wird in UVA, Export und Zahlung nicht verwendet. | Nur lesend „EUR“ zeigen (R-13). |
| §3.1 Tab Steuer | „Kleinunternehmer“ als USt-Fall | Option existiert in `ust_fall`, ist für die GmbH aber nie richtig. | In der UI nicht anbieten. |
| §3.3 FAGG-Banner, §8.2 | „Rücktrittsfrist endet morgen“ | Die Frist ist falsch berechnet (R-05). | Banner und Erinnerung erst nach R-05 aktivieren. |
| §3.4 Mahnung | Senden bei Kanal Post erzeugt Druck- und Versandnachweis | `senden` setzt bei Post nur `gesendet_am`. Es entsteht kein PDF, kein Sammeldruck und kein Nachweis. | `PH Mahnung.pdf_fixieren()` bei Post und Sammel-PDF „Post heute (n)“. |
| §3.3 Montage, §7 | „Offen bei Übergabe“ je Zahlungsplan-Zeile „fällig bei Montage“ | `faellig_bei = Montage` ist da, aber kein Datum aus `montage_termin` und kein Status „fällig“. | Next berechnet „fällig am“ = `montage_termin`. Fester Wert erst mit Backend-Feld `PH Zahlungsplan.faellig_ab` (Date). |
| §2.4 Spalte „Gesendet am“, Mahnlauf | Mahnung nur bei zugestellter Rechnung | Der Mahnlauf prüft `gesendet_am` nicht. Ein nie versandter Beleg kann gemahnt werden. | Mahnvorschlag: `gesendet_am` gesetzt oder `zustellung` (neu, §6.6) belegt. Sonst Zeile grau „Nicht versandt – zuerst senden“. |
| §4.2 Angebot „Ablaufen lassen“ | Massenaktion Leitung | Keine Methode, nur Scheduler `angebote_ablaufen_lassen`. | Methode `PH Angebot.ablaufen()` + `wiederherstellen()`. Bis dahin Aktion ausblenden. |
| §2.7, §3.4 ER | Lieferanten-Gutschrift, Bonus, Retoure an Hersteller | Kein DocType, `brutto_cent > 0` ist Workflow-Bedingung. | §5.6. |
| §2.7 ER „Einfuhr Drittland“ | EUSt aus dem Zollbescheid | Kein Feld für Zollbescheid oder EUSt getrennt von Lieferanten-USt. ER hat keine Währung. | §6.5. |
| §2.8 A9 Vorprüfung | „Belege ohne Leistungsdatum“ | Das Leistungsdatum ist nie leer (R-08). | Wird erst nach R-08 aussagekräftig. |
| §5.1 Kachel „Umsatz Monat“ | Umsatz | Berechnung falsch (B-16). | Bis zur Korrektur Wert aus Report „PH Vertriebscockpit Faktura“ (`umsatz`, netto) verwenden. |
| §6.1 Druck, F-12 | „Vermerk storno_durch im Druck“ | Die Rechnungs-PDF ist beim Stellen fixiert. Der Vermerk erscheint nur im neu gerenderten Bild. Das widerspricht U-15. | F-12 korrigieren: Vermerk in der **Akte** (Banner) und auf der **Gutschrift**, nicht in der fixierten Rechnungs-PDF. |

---

## 5. Fehlende Pflichtprozesse (mit Oberfläche)

Alle Dialoge: Dialog md 560 px, Öffnen 200 ms `--bo-ease-out` (Fade + `translateY 8px→0`), Schließen 140 ms `--bo-ease-in`. `⌘Enter` = Primär, `Esc` = Abbrechen (Rückfrage, wenn Felder geändert). Geldwirksam → Primärknopf sperrt, ab 300 ms „Bucht …“, Ergebnis-Karte (3.13 Motion, Häkchen 400 ms). `prefers-reduced-motion`: nur Opazität 120 ms.

### 5.1 Rücktritt nach FAGG (Auftrag)

```
┌ Rücktritt nach FAGG – AB-2026-00017 · Fam. Muster ───────────────── × ┐
│ Vertragsort   Beim Kunden · Belehrung beigelegt ✓                       │
│ Frist         beginnt mit Lieferung · Lieferung noch offen → läuft      │
│ Rücktritt am  [04.11.2026]   Eingang über (E-Mail ▾)  Nachweis [Datei]  │
│ Ausnahme      ○ keine  ● Maßanfertigung (§ 18 Abs 1 Z 3) → Hinweis rot  │
│ Folgen        AR RE-2026-00042 (9.984,00 €, bezahlt) → Storno-Gutschrift │
│               Rückzahlung 9.984,00 € bis 18.11.2026 (14 Tage)           │
│               Herstellerbestellungen HB-…031 (bestellt) → Storno anfragen│
│ Montage begonnen auf Verlangen? ☐  → anteiliges Entgelt [ 0,00 € ]      │
│                                        [Abbrechen]  [Rücktritt buchen]  │
└─────────────────────────────────────────────────────────────────────────┘
```

- Backend neu: `PH Auftragsbestaetigung.ruecktritt_fagg(datum, kanal, nachweis, anteil_cent)` erzeugt eine Storno-Gutschrift je gestellter Rechnung mit `erstattung_art = Rückzahlung` und legt eine Aufgabe mit Frist = Datum + 14 an. Status AB `Storniert`. Neue Felder: `ruecktritt_am` (Date), `ruecktritt_kanal` (Select), `ruecktritt_nachweis` (Attach), `rueckzahlung_bis` (Date). `storno_grund` = „Rücktritt FAGG“.
- Fehler: Frist abgelaufen → Warnband orange „Frist endete am … – Rücktritt nur als Kulanz (Storno)“, Primär heißt dann „Als Kulanz-Storno buchen“. Ausnahme Maßanfertigung → Banner danger „Kein Rücktrittsrecht nach § 18 Abs 1 Z 3 FAGG – trotzdem stornieren?“. Rückfrage mit Betrag.
- Zentrale-Erinnerung: „Rückzahlung Fam. Muster fällig in 3 Tagen“ (Leitung). Ab Tag 12 ist die Zeile rot.
- Kürzel in der Auftragsakte: `⋯` → „Rücktritt (FAGG)“. Kein Einzeltasten-Kürzel (irreversibel).

### 5.2 Rechnung korrigieren (Storno + Neuausstellung)

- Einstieg: Rechnungsakte `⋯` → „Rechnung korrigieren“ (Mitarbeiter, Stellen durch Leitung bei Exportiert).
- Schritt 1: Grund (Select: Adresse · Steuersatz/USt-Fall · Positionen · Leistungsdatum · Sonstiges + Text). Schritt 2: Entwurf der neuen Rechnung (Kopie, geändertes Feld hervorgehoben in Sand 2 px links). Schritt 3: Zusammenfassung „Storno-Gutschrift GU-… über 9.984,00 € · neue Rechnung RE-… · Zahlungen 3.744,00 € werden umgebucht“.
- Backend neu: `PH Rechnung.korrigieren(grund)` → {gutschrift_entwurf, rechnung_entwurf}. `PH Rechnung.zahlungen_umbuchen(nach)` (nur System, im selben Commit wie das Stellen der neuen Rechnung). Feld `PH Rechnung.korrektur_von` (Link PH Rechnung).
- Fehler: Die neue Rechnung lässt sich nicht stellen (Pflichtangaben) → die Gutschrift wird **nicht** gestellt (eine Transaktion). Dialog bleibt mit Sprunglinks offen.
- Akte zeigt die Belegkette „RE-…42 → GU-…7 → RE-…51“.

### 5.3 Differenz, Skonto, Kleinbetrag ausbuchen (OP)

- Einstieg: Bankdialog A8 Schritt 2 („Differenz 187,20 € – Skonto 3 % laut Zahlungsbedingung?“) oder Rechnungsakte „Rest ausbuchen“.
- Felder: Art (Segment Skonto · Kleindifferenz ≤ `kleindifferenz_cent` (neu, Einstellungen, Vorschlag 500) · Kulanz (→ Gutschrift)), Betrag (vorbelegt Rest, nicht über Rest), Vorschau „USt-Korrektur 20 %: −31,20 €“.
- Skonto nur bis `skonto_tage` nach Rechnungsdatum aus PH Zahlungsbedingung, sonst Warnband „Skontofrist am 12.10. abgelaufen – Leitung entscheidet“.
- Backend: `PH Rechnung.differenz_buchen(art, betrag_cent, datum)` → `PH Rechnung Zahlung` mit `art`. UVA und Export mindern die Bemessung je Satz anteilig.

### 5.4 Periodenabschluss Monat

```
┌ Zentrale › Faktura › Monatsabschluss Oktober 2026 ─────────────── [Monat abschließen] ┐
│ 1 Entwürfe mit Datum Oktober          0  ✓                                            │
│ 2 Bankumsätze Oktober offen           3  ● → Bank                                     │
│ 3 Eingangsrechnungen Oktober nicht freigegeben  2  ● → ER                             │
│ 4 Ausfuhrnachweise fällig             1  ● → Liste                                    │
│ 5 Kassa-Abgleich Oktober              ✓  (Report PH Abgleich Kassa ↔ Faktura)          │
│ 6 UVA berechnet                       ✓ UVA-2026-010                                  │
│ 7 Export erzeugt                      ✓ EX-2026-0010                                  │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

- Primär „Monat abschließen“ (Leitung, 2FA-Bestätigung). Setzt `gesperrt_bis`, UVA → Übergeben. Rückfrage: „Belege bis 31.10. sind danach nicht mehr änderbar. Spätere Korrekturen landen im November.“
- Offene Punkte (●) blockieren nicht. Sie erscheinen als Liste in der Rückfrage („3 Hinweise ignorieren“).
- Wiederöffnen nur GF, mit Grund, Journal „Korrektur“.
- Leer (erste Nutzung): „Noch kein Monat abgeschlossen. Der erste Abschluss sperrt alle Belege bis zum Monatsende.“

### 5.5 Ausfuhrnachweis überwachen

- Liste `/faktura/ausfuhr`: Rechnung, Kunde, Land, Art, Betrag, Rechnungsdatum, Nachweis (fehlt rot · MRN · U34 grün), Frist. Zeilenaktion „Nachweis erfassen“ (Sheet: MRN, Datum Ausgangsvermerk, Datei). `n` = Nachweis erfassen.
- Ohne Nachweis bei Fristablauf (Frist nach StB in `PH Faktura Einstellungen.ausfuhrnachweis_tage`): Aufgabe an die Leitung, Aktion „Nachversteuern“ = Rechnung korrigieren (§5.2) mit USt-Fall Steuerpflichtig AT.
- Leer: „Keine offenen Ausfuhrnachweise.“

### 5.6 Lieferanten-Gutschrift und Retoure an Hersteller

- Backend: `PH Eingangsrechnung.belegart` (Select: Rechnung · Gutschrift), `bezug_eingangsrechnung` (Link). Bei Gutschrift sind Beträge negativ erlaubt, und die Workflow-Bedingung wird `brutto_cent != 0`. Vorsteuerkorrektur negativ in der UVA, Export Soll/Haben getauscht. Bankumsatz Eingang darf eine Lieferanten-Gutschrift zuordnen.
- UI: in „Neue Eingangsrechnung“ Segment „Rechnung | Gutschrift“, Bezug-Feld mit Suche nach ER des Lieferanten. Liste: Betrag mit Minus in `success-text`.

### 5.7 Versand ohne E-Mail (Post) und Zugang

- `PH Kontakt.kommunikation_bevorzugt = Brief` oder leere E-Mail → Senden-Dialog öffnet direkt im Reiter „Post“: PDF-Vorschau, „Drucken und als per Post gesendet markieren“.
- Backend neu (bereits Sammelliste §12 Nr. 5): `als_gesendet_markieren(kanal)` für Angebot, AB, Rechnung, Gutschrift **plus** Felder `versandkanal` (E-Mail · Post · Persönlich übergeben · Portal) und `zustellung_nachweis` (Attach, optional). Bei „Persönlich übergeben“ (Showroom) Unterschrift optional.
- Massenaktion „Post heute (n)“ in Rechnungen und Mahnungen → Sammel-PDF in Adressreihenfolge, danach Markierung für alle (Undo 8 s, weil nur Status).
- Zahlungslink ohne E-Mail: `PH Rechnung.zahlungslink` setzt heute `kunde_email` voraus. Ersatz: EPC-QR auf der gedruckten Rechnung (vorhanden) und Hinweis „Kein Zahlungslink ohne E-Mail – QR auf der Rechnung“.
- Mahnlauf: Rechnungen ohne E-Mail werden als Kanal Post angelegt, nie übersprungen. Ergebnis-Karte „2 per Post – Sammeldruck öffnen“.

---

## 6. Randfälle – Soll gegen Ist

| # | Fall | Soll (fachlich) | Ist (Backend) | Konzept | Pflicht |
|---|---|---|---|---|---|
| 6.1 | **Storno vollständig** | Storno-Gutschrift, Rechnung storniert, Zahlungen → Rückzahlung/Guthaben/Umbuchung, UVA im Monat der Gutschrift, AB-Stand zurück | Storno ok, AB-Stand ok. Zahlungsplan `bezahlt_cent=0`, obwohl Geld da ist. Kein Guthaben. | ok, aber kein Umbuchen | B-06, B-09 |
| 6.2 | Storno Anzahlungsrechnung | nur ohne Verrechnung, UVA nur vereinnahmter Teil | keine Sperre, UVA zieht den vollen Betrag ab | fehlt | B-05 |
| 6.3 | Storno Auftrag mit bezahlter Anzahlung | Auftrag storniert + Gutschrift AR + Erstattung (FAGG: 14 Tage) | nur Hinweistext, AR bleibt bezahlt, Zahlungsplan „Verrechnet“ | „Server verweigert“ (stimmt nur für Leistungsrechnungen) | §5.1, `stornieren` erzeugt Gutschrift-Entwurf je AR |
| 6.4 | Storno nach Export / nach UVA | Gutschrift im aktuellen Monat, Rechnung bleibt im alten Lauf | ok (Gutschrift-Datum) | ok | nur Datum ≥ `gesperrt_bis` (B-04) |
| 6.5 | **Teillieferung** | Teilrechnung mit Leistungsdatum der Teillieferung, Anzahlung anteilig, Zahlungsplan-Zeile | Leistungsdatum = bestätigter Termin oder heute, nur erste Teilzahlungs-Zeile | A4 ok | R-08, B-18 |
| 6.6 | Teillieferung einer **einheitlichen Werklieferung** (Küche in zwei Etappen) | Keine Teilleistung, sondern Abschlag (Anzahlung, Ist) | wird als Teilrechnung (Soll) gebucht | nicht unterschieden | Art „Abschlagsrechnung“ (= Anzahlungslogik) neben „Teilrechnung“. Der Assistent fragt „Ist der gelieferte Teil abgeschlossen und abgenommen?“. **StB.** |
| 6.7 | **Anzahlung** bezahlt per Überweisung ohne AR | AR stellen, zuordnen | nicht zuordenbar | fehlt | B-11 |
| 6.8 | Anzahlung an der Kassa | ein Beleg, eine USt, Verrechnung in der Schlussrechnung | doppelt (B-01, B-02) | „nur Anzeige“ | B-01, B-02 |
| 6.9 | Anzahlung teilbezahlt, dann Schlussrechnung | nur Vereinnahmtes abziehen, Rest regeln | volle AR abgezogen | fehlt | R-10 |
| 6.10 | Anzahlung über dem Endbetrag (Auftrag reduziert) | Schlussrechnung 0 + Gutschrift auf AR für den Überhang + Rückzahlung | `throw` „Überhang per Gutschrift“, ohne Weg | Hinweis | A4b Schritt 2: Aktion „Überhang erstatten“ = Teilgutschrift auf die AR (nach B-05-Regel erlaubt, weil der Überhang nicht verrechnet ist) |
| 6.11 | **Retoure** (Teil) nach Schlussrechnung | Teilgutschrift bis fakturierter Betrag − Gutschriften, Mengen zurück, Erstattung Überweisung/Kassa | Grenze `zahlbar`, keine Mengen | „Teilgutschrift wählbar“ | B-08, R-02 |
| 6.12 | Retoure im FAGG-Rücktritt | Rückzahlung ≤ 14 Tage, Zurückbehaltung bis Ware zurück (§ 15 Abs 4 FAGG) | fehlt | fehlt | §5.1 mit Feld `ware_zurueck_am` |
| 6.13 | Reklamation/Preisminderung | Gutschrift Art Wertminderung, Bezug ph_service-Fall | Art vorhanden, kein Bezug | ok | `PH Gutschrift.servicefall` (Link ph_service) |
| 6.14 | **Fremdwährung CHF** – Ausgangsrechnung | EUR-Werte für UVA/Export (§ 20 Abs 6), Kurs je Beleg, Zahlung in CHF mit Kursdifferenz | `kurs` ungenutzt, CHF-Cent = EUR | „Währung/Kurs“ im Steuer-Tab | Phase 1 sperren (R-13). Phase 2: `PH Rechnung.kurs_datum`, `kurs_quelle` (BMF-Monatskurs · EZB-Tageskurs), `brutto_eur_cent`, `ust_eur_cent`. In der Aufteilung `netto_eur_cent`. `PH Rechnung Zahlung.waehrung`, `betrag_fremd_cent`, `kursdifferenz_cent`. Export Konto Kursdifferenz. |
| 6.15 | CHF – Eingangsrechnung (Schweizer Hersteller) | Währung, Kurs, EUSt aus Zollbescheid, Zoll/Spedition getrennt | ER ohne Währung, EUSt = Lieferanten-USt | „Einfuhr Drittland“ als Option | `PH Eingangsrechnung.waehrung`, `kurs`, `brutto_fremd_cent`, `zollbescheid` (Attach), `eust_cent`, `zollbescheid_datum`. Vorsteuer EUSt aus dem Zollbescheid, nicht aus der Lieferantenrechnung. |
| 6.16 | CHF – Kunde CH, Montage in CH | nicht steuerbar in AT, ggf. Schweizer MWST | „Ausfuhr“ KZ 011 | fehlt | R-14 |
| 6.17 | CHF – Kunde CH holt im Showroom ab | 20 % oder Touristenexport mit U34 | „Ausfuhr“ ohne Nachweis | fehlt | R-14, §5.5 |
| 6.18 | **Kunde ohne E-Mail** | Post/persönlich, Zugang belegbar, Mahnung per Post, Zahlung per QR | `senden` verlangt Empfänger, nur die Mahnung kennt Post | Hinweis vorhanden | §5.7 |
| 6.19 | Kunde ohne Anschrift (Barverkauf ≤ 400 €) | Kleinbetragsrechnung | ok | ok | – |
| 6.20 | Kunde Unternehmer EU ohne gültige UID | 20 % AT statt igL | formale UID-Prüfung, MIAS-Platzhalter | Platzhalter | Ohne `uid_geprueft_am` bei igL: Stellen blockiert (Leitung kann mit Vermerk übersteuern, Journal) |
| 6.21 | Überzahlung | Guthaben, Rückzahlung oder Verrechnung | unsichtbar | Text „Guthaben vermerkt“ | B-06 |
| 6.22 | Rücklastschrift / Fehlzuordnung | Zuordnung lösen, Rechnung wieder offen, Mahnsperre prüfen | nicht möglich | „kein Undo“ | B-10 |
| 6.23 | Uneinbringlich, später Eingang | § 16 Abs 3 hin und zurück | nur Status | Aktion vorhanden | R-11 |
| 6.24 | Rechnung im Entwurf über den Monatswechsel | Datum = Stelltag | altes Datum bleibt | nicht erwähnt | B-04 |
| 6.25 | Doppelzahlung Bank + Kassa für dieselbe AR | eine Zahlung → Guthaben | zweite Zahlung wird gebucht, `offen` = 0, keine Warnung | Hinweis nur bei Überweisung | Beim Buchen einer Zahlung auf eine Rechnung mit `offen_cent = 0` blockieren, Vorschlag „als Guthaben“ |

---

## 7. Korrekturen an Aussagen im Konzept (Textstellen)

| Stelle | Steht im Konzept | Richtig |
|---|---|---|
| §1 Kassa-Zeile, §7 Kassa | Kassa bucht Zahlungsplan-Ist, „hier nur Anzeige“ | Kassa-Anzahlung nur auf eine gestellte Anzahlungsrechnung (B-01). Vorher ist das ein Datenfehler und keine Anzeige. |
| §2.5 | „Stand zum 31.10. – spätere Zahlungen nicht berücksichtigt“ | Der Report rechnet heute mit dem aktuellen Stand. Stichtag deaktivieren bis zum neuen Report (§4). |
| §2.9 | „Für Korrekturen neue Auswertung“ | Laut Backend unmöglich, siehe B-04 `korrektur_zu`. |
| §3.1 Pflichtangaben | „UID Empfänger > 10.000 €“ | nur bei Unternehmer-Empfänger (R-04) |
| §3.3, §8.2 | FAGG-Frist ab Vertrag | ab Lieferung (Ware), Ausnahme Maßanfertigung (R-05) |
| §4.4 | Kanäle Bar · Karte extern · Gutschein · Verrechnung | nur Überweisung, Stripe Link nach StB (R-01, B-12, B-13) |
| §5.1 Umsatz Monat | „brutto, nach Gutschriften“ | netto Leistungsumsatz (B-16) |
| §7 Montage mobil | Zahlungslink zeigen (Karte) | EPC-QR (Überweisung). Karte nur über die mobile Kassa (R-03). |
| F-01 | Stellen ohne Leistungsdatum scheitert | heute nicht erreichbar, erst mit R-08 |
| F-05 | „zahlbar = Brutto − Anzahlung brutto“ | „− **vereinnahmte** Anzahlung“ (R-10) |
| F-12 | Storno-Vermerk im Druck | Vermerk in Akte und Gutschrift, nicht in der fixierten PDF |
| F-15 | > 10.000 € ohne UID → Meldung | nur bei Unternehmer |
| U-06 | „Zuordnen < 100“ mit Rückfrage, „Zuordnen 100“ ohne | Erst mit `zuordnung_loesen` (B-10) ist auch bei 100 ein Undo möglich, und erst dann ist der Ein-Tasten-Weg vertretbar. Bis dahin: bei 100 eine Ergebnis-Karte 4 s mit „Rückgängig“ deaktiviert und „Melden“-Link. |
| §11 Nr. 4 | „Anzahlung per Link/QR … bei der Montage“ | nur QR-Überweisung bei der Montage |

---

## 8. Pflichtänderungen konsolidiert

### 8.1 Backend `ph_faktura` (und Nachbarn)

| Nr | Schwere | DocType / Modul | Feld / Methode | Zweck |
|---|---|---|---|---|
| P-01 | K | PH Rechnung `zahlung_erfassen`, PH Gutschrift `erstatten` | Kanalsperre Bar/Karte extern/Stripe Terminal/Gutschein/Verrechnung außerhalb `flags.ph_kassa`/System | R-01, R-02, B-12, B-13 |
| P-02 | K | ph_kassa + `ph_faktura.kassa` | Kassa-Anzahlung nur mit AR, Kassenbon als Zahlungsbeleg zur Rechnung. `PH Rechnung.umsatz_quelle` | B-01, B-02 |
| P-03 | K | PH Rechnung, PH Gutschrift `validate` | Whitelist für update_after_submit (`mahnsperre`, `mahnsperre_grund`, `notiz_intern`) | B-03 |
| P-04 | K | PH Faktura Einstellungen | `gesperrt_bis` (Date). `stellen()` setzt `datum = heute`, Prüfung gegen `gesperrt_bis` und das Datum der letzten RE | B-04 |
| P-05 | K | PH UVA Auswertung | `korrektur_zu` (Link), `als_uebergeben` setzt `gesperrt_bis` | B-04 |
| P-06 | K | PH Rechnung `validate` | Vorbelegung Leistungsdatum entfernen, Teilrechnung-Datum aus der Teillieferung | R-08 |
| P-07 | K | PH Rechnung | `empfaenger_unternehmer` (Check). `steuer.pflichtangaben_pruefen(unternehmer=…)` | R-04 |
| P-08 | K | PH Auftragsbestaetigung | `fagg_vertragsart`, `fagg_ausnahme`, `fagg_fristbeginn`, `fagg_vorzeitiger_beginn_verlangt`, `fagg_vorzeitiger_beginn_am`. Fristberechnung inkl. § 12 | R-05 |
| P-09 | K | PH Rechnung / UVA | `uva_monat` = min(Rechnungsmonat, Leistungsmonat + 1) | R-09 |
| P-10 | K | PH Auftragsbestaetigung `offene_anzahlungen`, UVA | nur vereinnahmte Anzahlungen verrechnen oder UVA-Nachzug (StB-Variante) | R-10 |
| P-11 | K | PH Rechnung, UVA, Export, Bankumsatz | `uneinbringlich_am`, `uneinbringlich_cent`, `uneinbringlich_ust`. § 16-Zeilen. Zuordenbarkeit | R-11 |
| P-12 | K | PH Gutschrift `validate`, UVA | Sperre bei verrechneter AR, UVA nur der vereinnahmte Teil | B-05 |
| P-13 | H | PH Auftragsbestaetigung | `ruecktritt_fagg(...)`, `ruecktritt_am`, `ruecktritt_kanal`, `ruecktritt_nachweis`, `rueckzahlung_bis`, `ware_zurueck_am` | R-06, §5.1 |
| P-14 | H | PH Auftragsbestaetigung, PH Angebot | `gesendet_am` (AB), `annahme_art`, `annahme_nachweis`. `senden` verlangt `fagg_belehrung_beigelegt` außerhalb des Showrooms | R-07 |
| P-15 | H | PH Rechnung Zahlung | `art` (Zahlung/Skonto/Ausbuchung/Verrechnung), Steueranteil. `PH Rechnung.differenz_buchen()` | R-12, §5.3 |
| P-16 | H | PH Eingangsrechnung | `skonto_genutzt_cent`, Vorsteuerkorrektur, `zahlbetrag_cent` nicht zeitabhängig | R-12 |
| P-17 | H | PH Rechnung / PH Bankkonto / Import | Fremdwährung sperren (Phase 1) | R-13 |
| P-18 | H | PH Rechnung | `ausfuhr_art`, `ausfuhr_nachweis`, `ausfuhr_mrn`, `ausfuhr_nachweis_am`, `ausfuhr_nachweis_datei`. USt-Fall „Montage Drittland (nicht steuerbar)“ | R-14 |
| P-19 | H | PH Mahnwesen Einstellungen, `rechenwerk.mahnen` | `basiszinssatz_promille`, `basiszinssatz_gueltig_ab`, `pauschale_b2b_cent`, `gebuehr_verbraucher_nur_mit_agb`. Unternehmer aus `kontaktart` | R-15 |
| P-20 | H | PH Mahnung | `spesen_offen_cent`, `spesen_status`. Konto `erloeskonto_mahnspesen` in den Einstellungen | B-07 |
| P-21 | H | neu PH Kundenguthaben (oder `PH Rechnung.ueberzahlt_cent`) | Guthaben aus Überzahlung/Storno, Verwendung, Erstattung | B-06 |
| P-22 | H | PH Gutschrift | Grenze gegen Rechnungsbrutto − Σ Gutschriften, Art „Retoure“, `ruecknahme`, `servicefall`. AB-Mengen und `abgerechnet_cent` | B-08 |
| P-23 | H | PH Rechnung | `korrigieren(grund)`, `zahlungen_umbuchen(nach)`, `korrektur_von` | B-09 |
| P-24 | H | PH Bankumsatz | `zuordnung_loesen(zeile)`, Rücklastschrift-Vorschlag, Vorschlag auf AB-Nummer, Rest als Guthaben | B-10, B-11 |
| P-25 | H | Report PH Offene Posten | echte Stichtagsberechnung aus Zahlungs- und Gutschriftsdaten | §4 |
| P-26 | H | File / PH Buchungsjournal, PH Kontakt | PDF-Hash im Journal, Löschsperre fixierter PDFs, „Sperren statt Löschen“ für Kontakte mit Belegen | R-16 |
| P-27 | H | Rollen/Rechte | CSV-Export Bank/OP/ER nur Leitung + Journal „Listenexport“ | R-17 |
| P-28 | M | Export | `anzahlung_export` (Bei Zahlung/Bei Rechnung), ER je `ust_aufteilung` | B-14, B-15 |
| P-29 | M | `kennzahlen.umsatz_monat`, Chart „PH Umsatz je Monat“ | netto Leistungsumsatz | B-16 |
| P-30 | M | PH Eingangsrechnung | Sperre nach Export. `belegart` Rechnung/Gutschrift, `bezug_eingangsrechnung`. CHF-Felder + Zollbescheid (Phase 2) | B-17, §5.6, 6.15 |
| P-31 | M | PH Auftragsbestaetigung `rechnung_erstellen` | Parameter `zahlungsplan_zeile`, Art „Abschlagsrechnung“ | B-18, 6.6 |
| P-32 | M | Angebot, AB, Rechnung, Gutschrift | `als_gesendet_markieren(kanal)`, `versandkanal`, `zustellung_nachweis`. Mahnvorschlag nur zugestellte Rechnungen | §5.7 |
| P-33 | M | PH Mahnung | `pdf_fixieren()` bei Post, Sammeldruck | §4 |
| P-34 | M | PH Angebot | `ablaufen()`, `wiederherstellen()` | §4 |

### 8.2 Konzept `10-konzept-faktura.md`

1. §4.4 Kanal-Segment auf „Überweisung · Stripe Link“ kürzen und den Kassa-Hinweis als Leerzustand für Bar/Karte aufnehmen (P-01).
2. §1/§7 Kassa-Zeile und §3.3 „An Kassa übergeben“: Die Kassa verlangt eine Anzahlungsrechnung (P-02).
3. §3.1 Pflichtangaben-Prüfer: Regel UID nur Unternehmer, Leistungsdatum ohne Vorbelegung, neuer Prüfpunkt „Leistung > 1 Monat vor Rechnung“ (P-06, P-07, P-09).
4. §3.3 FAGG-Banner neu mit Fristbeginn und Ausnahme. Neuer Prozess §5.1 Rücktritt (P-08, P-13).
5. §2.5 OP-Stichtag deaktivieren, bis P-25 da ist.
6. §2.9 UVA: Korrektur-Auswertung, Monatsabschluss §5.4, Sperrhinweis in allen Akten („Monat Oktober abgeschlossen – Korrektur im November“, Banner info).
7. §4.5 A4b Schritt 2: Spalte „vereinnahmt“, Aktionen „Rest auflösen“ und „Überhang erstatten“ (P-10).
8. §4.5 A8: Differenzbuchung, Guthaben, Zuordnung lösen, Vorschlag auf Auftrag (P-15, P-21, P-24).
9. §3.4 Gutschrift: Art „Retoure“, Mengenrahmen, Erstattung Bar nur über die Kassa (P-02, P-22).
10. §6.3 Senden-Dialog: Reiter „Post“ und „Persönlich übergeben“ (P-32).
11. Neue Route `/faktura/ausfuhr` (§5.5) und `/faktura/abschluss` (§5.4) in die Unternavigation unter „Mehr ▾“.
12. §5.1: Kachel „Guthaben offen“ (Buchhaltung), „Umsatz Monat (netto)“.
13. §7: Montage nur EPC-QR.
14. §10 Akzeptanzkriterien F-01, F-05, F-12, F-15 korrigieren, F-19 … F-32 aufnehmen (§9).
15. §12 Sammelliste um P-01 … P-34 ergänzen bzw. ersetzen.

---

## 9. Zusätzliche Akzeptanzkriterien

| ID | Kriterium |
|---|---|
| F-19 | Mitarbeiter wählt in „Zahlung erfassen“ einen anderen Kanal als Überweisung/Stripe Link → kein Buchen möglich, Hinweis Kassa. API-Aufruf mit `kanal=Bar` → Fehler. |
| F-20 | Kassa nimmt eine Anzahlung zu einer AB ohne AR → AR wird gestellt und bezahlt. Die Schlussrechnung zieht sie ab. In der UVA-Zuarbeit von Kassa und Faktura zusammen steht die USt genau einmal. |
| F-21 | REST `set_value` auf `PH Rechnung.offen_cent` einer gestellten Rechnung → Fehler „Feld ist gesperrt“, kein Journal-Eintrag. |
| F-22 | Entwurf mit Datum 28.10., gestellt am 04.11. → Rechnungsdatum 04.11. Monat Oktober abgeschlossen → eine Gutschrift mit Datum 30.10. ist unmöglich. |
| F-23 | Privatkunde, Rechnung 24.960,00 € ohne UID → Stellen erfolgreich. Geschäftskunde → Meldung „UID des Leistungsempfängers“. |
| F-24 | AB Vertragsort „Beim Kunden“, Kaufvertrag Ware, Lieferung 20.11. → `fagg_frist_ende` = 04.12. Ohne Belehrung + 12 Monate. Maßanfertigung → kein Fristbanner, Hinweis § 18. |
| F-25 | Lieferung 15.08., Rechnung 04.11. → Warnband im Stellen-Dialog, `uva_monat` 2026-09. |
| F-26 | AR 9.984,00 €, bezahlt 3.744,00 €, Schlussrechnung → A4b blockiert bis „Rest auflösen“. Danach wird nur der vereinnahmte Betrag abgezogen. |
| F-27 | Storno-Gutschrift auf eine verrechnete AR → Fehler mit Link auf die Schlussrechnung. |
| F-28 | Rechnung uneinbringlich → UVA des Monats enthält eine negative USt-Zeile. Späterer Bankeingang ist zuordenbar und erzeugt eine positive Zeile. |
| F-29 | Bankeingang 187,20 € unter offen, innerhalb der Skontofrist → „Als Skonto buchen“, Rechnung bezahlt, UVA-Bemessung gemindert. |
| F-30 | CHF-Bankkonto → Import mit Fehler „Fremdwährung noch nicht freigegeben“. Rechnungsakte zeigt Währung nur „EUR“. |
| F-31 | Kunde ohne E-Mail → Senden-Dialog öffnet „Post“, Markieren setzt `versandkanal = Post`. Der Mahnlauf legt Post-Mahnungen an und überspringt keine. |
| F-32 | Mitarbeiter exportiert die Bank-Liste als CSV → nicht angeboten. Die Leitung exportiert → Journal „Listenexport“. |

---

## 10. Offene Fragen an die Steuerberatung (vor dem ersten echten Beleg)

1. Ist eine Kartenzahlung über Stripe Link ein Barumsatz im Sinn des § 131b BAO, wenn der Kunde **zu Hause** zahlt (Mail) bzw. **vor Ort** (Montage, Showroom)? Davon hängt ab, ob der Kanal im Backoffice bleibt.
2. Anzahlung an der Kassa: Kassenbon als Zahlungsbeleg zu einer Anzahlungsrechnung (ohne zweite USt) oder Kassenbon mit USt und die Anzahlungsrechnung nur als Dokument? Welche Quelle meldet die USt?
3. Schlussrechnung bei unbezahlter Anzahlungsrechnung: Variante A (Rest auflösen) oder B (UVA-Nachzug)?
4. Küche in Etappen: Teilrechnung (Teilleistung, Soll) oder Abschlagsrechnung (Anzahlung, Ist)? Kriterium „abgeschlossen und abgenommen“?
5. Rechnung mehr als einen Monat nach der Lieferung: Umsetzung „Leistungsmonat + 1“ bestätigen.
6. CHF: Umrechnung BMF-Monatsdurchschnittskurs oder Tageskurs? Kursdifferenzen-Konto. Vorgehen bei Montage in CH (Schweizer MWST-Registrierung, Fiskalvertreter).
7. Ausfuhrnachweis: Frist bis zur Nachversteuerung, Touristenexport (U34) im Showroom-Abholfall anbieten oder grundsätzlich 20 %?
8. Export der Anzahlungsrechnungen: bei Zahlung oder bei Rechnung? Mahnspesen-Konto, Forderungsabschreibung, Skonto-Konto (Kunde/Lieferant).
9. Bezeichnung „Gutschrift“ auf Rechnungskorrekturen (im UStG ist „Gutschrift“ die Abrechnung durch den Leistungsempfänger): Drucktitel „Rechnungskorrektur / Storno“?
10. Gutscheine: Einzweck oder Mehrzweck (davon hängt die USt bei der Einlösung ab).
