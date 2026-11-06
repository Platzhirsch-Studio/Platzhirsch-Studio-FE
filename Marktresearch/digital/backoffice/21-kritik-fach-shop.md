# 21 – Fachkritik Bereich „Shop“ (Recht, Buchhaltung, Frappe-Datenprüfung)

**Zweck:** Prüfung von `10-konzept-shop.md` (Fassung 2) gegen den Datenbestand `Backend-Import/ph_shop` (README, 22 DocType-JSONs, Dokumentmethoden, `zahlung.py`, `ust.py`, `teilerstattung.py`, `aufbewahrung.py`, `tasks.py`, `stripe_webhook.py`, Reports) und gegen österreichisches Recht (BAO/RKSV, UStG, FAGG, VGG, DSGVO, GlBG) und Buchhaltungslogik. Ergebnis: Note, Befunde mit Codebeleg und Pflichtänderungen mit DocType/Feld, die vor dem Bau ins Konzept (Fassung 3) und als Anfrage an die App-Eigentümer gehen.
**Stand:** 2026-11-04 · Rolle: Fachkritiker Möbelhandel + Frappe-Datenprüfer · Status: Prüfbericht, keine Entscheidung des Inhabers. Rechtliche Aussagen sind fachliche Einschätzung; Steuerberater/Kanzlei bestätigen (§ 11).
**Gelesen:** `10-konzept-shop.md` vollständig; `ph_shop/README.md`; alle DocType-JSONs (Felder, Pflicht, Rechte); `ph_bestellung.py`, `ph_zahlung.py`, `ph_widerruf.py`, `ph_retoure.py`, `ph_gutschein.py` (Auszug), `ph_gutschein_bestellung.py` (Auszug), `ph_anzahlung.py` (Methodenliste), `zahlung.py`, `ust.py`, `teilerstattung.py`, `aufbewahrung.py`, `tasks.py` (Auszug), `stripe_webhook.py` (Dispute/Refund), Report `ph_shop_umsatz_nach_ust_satz.py`; Nachbarn: `ph_faktura/api/__init__.py` (`create_cash_invoice`), `ph_faktura` PH Gutschrift/PH Export Lauf (Existenz), `ph_kassa` (Bestellungsbezug).

---

## 0. Ergebnis auf einen Blick

**Note: 5 / 10.**

| Teil | Urteil |
|---|---|
| Oberfläche, Zustände, Undo, Kürzel | sehr gründlich, codenah, viele echte Lücken bereits markiert (`zahlung_erfassen` überschreibt, `normalisiere_abhol` mit `L`) |
| Datenmapping | in der Breite richtig, aber **ein Fehler in der App mit Geldfolgen nicht erkannt** (`ist_bezahlt()` zählt `abholbereit` als bezahlt, §2 B1) – damit sind Phasenleiste Variante 3, S1 aus „abholbereit unbezahlt“ und die Packtisch-Übergabe falsch |
| Recht | **Registrierkassenpflicht fehlt komplett** (Bar/Karte im Backoffice ohne RKSV-Beleg, §3 R1); Widerrufsfrist läuft ab Versand statt ab Erhalt (R5); Teilwiderruf, Ausschlüsse § 18 FAGG, Kunde ohne E-Mail nicht lösbar |
| Buchhaltung | kein Rechnungs-/Gutschrift-Pfad bei Storno und Erstattung, UVA-Zuarbeit nach Zahlungsdatum statt Leistungsdatum, Doppelzählung Kassa/Shop möglich, Fremdwährung ohne Kurs, Anzahlungen ohne USt, Disputes ohne Buchung |
| Randfälle | Storno nach Versand/Rechnung, Teillieferung, Mehrfachzahlung (Gutschein + Bar), CHF, Kunde ohne E-Mail: nicht behandelt |

Warum nicht schlechter: Das Konzept erfindet kaum Methoden, kennzeichnet Lücken ehrlich und hat die richtige Grundhaltung (gebucht = gesperrt, Gegenbuchung, Vier-Augen, Hash-Codes). Warum nicht besser: Ein Shop-Backoffice, das Barzahlungen ohne Kassa annimmt und Widerrufsfristen verkürzt, darf so nicht live gehen.

---

## 1. UI-Funktionen ohne Datenfeld oder Methode (über die Liste in Konzept §10 hinaus)

Legende: **neu** = im Konzept nicht als Lücke markiert · **falsch** = Konzept sagt ✔, Code widerspricht.

| # | Konzeptstelle | UI-Funktion | Befund im Code | Art |
|---|---|---|---|---|
| U1 | §2.2 Variante 3, §4.1 „abholbereit (unbezahlt)“, §5.1 Zeile 7, §8.2 | „Zahlung erfassen“ aus `abholbereit`; „Übergeben“ nur wenn bezahlt | `ph_bestellung.py` Z. 25 `BEZAHLT` enthält `abholbereit`; `ist_bezahlt()` = `bezahlt_am or status in BEZAHLT` → jede abholbereite Reservierung gilt als bezahlt: `zahlung_erfassen` wirft „bereits bezahlt“, `abgeholt_melden` lässt unbezahlte Ware raus | **falsch** |
| U2 | §4.1 Positionen „bearbeitbar nur in offen/reserviert … nach Zahlung gesperrt“ | Sperre der Positionen | PH Bestellung ist **nicht submittable**; `validate` sperrt nichts, `summen_berechnen` rechnet nach jeder Speicherung neu (auch nach Bestätigungsmail, Zahlung, Rechnung). Sperre existiert nur im Client | **falsch** |
| U3 | §4.7 Retoure „`erstattungsbetrag_cent` = bezahlt − erstattet − Wertminderung, Summe live“ | Erstattungsbetrag folgt Wertminderung | `ph_retoure.py validate`: Betrag wird nur gesetzt, **wenn leer**. Retoure entsteht in `retoure_anlegen` mit vollem Betrag → spätere Wertminderung ändert ihn nicht → volle Erstattung trotz Wertminderung | **falsch** |
| U4 | §5.3 S3/S8 „Betrag Standard voll = Zahlung − erstattet“ | Storno erstattet „die Zahlung“ | `stornieren` nutzt nur `zahlung_ref` (eine Zahlung). Gutschein + Bar: `zahlung_ref` zeigt auf die letzte; die andere bleibt unerstattet. `teilerstattung.verteile_auf_zahlungen` existiert, wird **nirgends aufgerufen** | neu |
| U5 | §4.6 Widerruf „Erstatten“, §3.6 Widerruf-Positionen | Teilwiderruf einzelner Positionen mit USt-Aufteilung | `teilerstattung.berechne` (positionsweise, Versandanteil, § 16 UStG) existiert nur als Logik + Unittest; `PH Widerruf Position` hat nur `slug/bezeichnung/menge/summe_cent`, keinen Zeilenbezug; `PH Widerruf.erstatten` erstattet ohne Betrag die **ganze** Zahlung | neu |
| U6 | §4.6 Status der Bestellung nach Widerruf | „teilweise widerrufen“ | `PH Widerruf.erstatten` setzt in **beiden** Zweigen `widerrufen` (Z. `"widerrufen" if … else "widerrufen"`), überschreibt zudem `teilerstattet` aus `_bezug_spiegeln` | neu |
| U7 | §3.4 Zahlung manuell „Ohne Bezug“, Kanal Bar/Karte extern | manuelle Barzahlung im Backoffice | technisch vorhanden (`insert`+`submit`), **rechtlich unzulässig** ohne Kassenbeleg (§3 R1) | neu |
| U8 | §5.3 S5 „Kassieren: hier erfassen (Bar/Karte extern)“ | Gutscheinverkauf bar im Backoffice | dto.; außerdem `ausstellen` nicht whitelisted (Konzept markiert) | neu (Recht) |
| U9 | §5.3 S4 „Bar … Nur Gegenbuchung – Auszahlung erfolgt außerhalb“ | Barerstattung | Bar-Auszahlung ohne Kassa-Auszahlungsbeleg; Kassenstand stimmt nicht mehr | neu (Recht) |
| U10 | §6.1 „Gutschein-Restwert“ = Verbindlichkeit | Summe Restwert | Filter `status in Aktiv, Teilweise eingeloest` → `Abgelaufen` (Rest bleibt in `rest_cent`, `tasks._gutschein_abgelaufen` nullt nicht) und `Erstellt` fehlen → Verbindlichkeit zu niedrig | neu |
| U11 | §3.10 `umsatz-ust` „UVA-Zuarbeit“ | Monatswerte je Satz | Report filtert `status in BEZAHLT` → später stornierte/erstattete/widerrufene Bestellungen verschwinden **rückwirkend** aus dem Zahlungsmonat, während `PH Rueckerstattungen` sie im Erstattungsmonat nochmals mindert (doppelte Minderung); Monat nach `bezahlt_am` statt Leistungsdatum (§3 R8) | neu |
| U12 | §4.1 „Rechnung erstellen“ | Barverkaufsrechnung | `create_cash_invoice`: `leistungsdatum = bezahlt_am` (bei Versand falsch, Leistung = Lieferung); akzeptiert Status `abholbereit` (mit U1 auch unbezahlt); kein Rückwärtslink `PH Bestellung.rechnung` | neu |
| U13 | §5.3 S3 Storno, §4.6/4.7 Erstattung | Gutschrift/Rechnungskorrektur | keine Verbindung zu `PH Gutschrift` (ph_faktura vorhanden); nach ausgestellter Rechnung bleibt sie unverändert gültig | neu |
| U14 | §8.3 „Reservierung an der Kassa kassieren → Bestellung bezahlt“ | Statusspiegel aus Kassa | `ph_kassa` liest PH Bestellung nur (`_bestellungen(kontakt)`), kein Hook/Aufruf `zahlung_erfassen`; Doppelzählung Umsatz Kassa + Shop-Report (§4 B5) | Konzept ◐ → **✘** |
| U15 | §3.2.5 „Ohne E-Mail keine Reservierung“, Widerruf per Brief/Telefon | Kunde ohne E-Mail | `kunde_email` **reqd** in PH Bestellung, PH Widerruf, PH Gutschein Bestellung; `validate` wirft bei ungültiger Adresse. Widerruf per Brief ohne E-Mail nicht erfassbar | neu |
| U16 | §4.6 Fristen-Ampel | Fristbeginn | `PH Widerruf.validate`: `erhalten_am` ← `abgeholt_am or versendet_am` → Frist ab **Versand** statt Erhalt (§3 R5); kein Feld `zugestellt_am` in PH Bestellung | neu |
| U17 | §4.4 Gutscheinkauf „Erstatten“, Gutschein Art | Einzweckgutschein | `art = Einzweck` wählbar (S5 „Weitere Angaben“), aber keine USt bei Ausgabe (kein Satz-/Steuerfeld an PH Gutschein/PH Gutschein Bestellung); Einlösung versteuert erneut über die Bestellung | neu |
| U18 | §3.7 Anzahlungen | USt auf Anzahlung, Anzahlungsrechnung | PH Anzahlung ohne USt-Felder, ohne Rechnungslink | neu |
| U19 | §10 „Dispute ✘“ | Zahlungsstreit | Konzept nennt fehlende Akte, aber nicht die **fehlende Buchung**: Stripe belastet Betrag + Gebühr sofort, `_dispute` schreibt nur Kommentar/ToDo → Auszahlung zeigt Differenz ohne Gegenbuchung | ergänzt |
| U20 | §3.9 Einstellungen, §2.3 Live schalten | Live trotz `rechtstexte_status ≠ freigegeben` | `shop_modus` frei schaltbar; Bestellbestätigung geht dann ohne Belehrung/AGB-Anhang (`mails.rechtstext_anhaenge`) → § 7 Abs 3 FAGG verletzt, Frist verlängert sich (§3 R6). Konzept zeigt nur ein Banner | neu (Recht) |
| U21 | Rechte §1 | Löschen | PH Bestellung, PH Gutschein, PH Widerruf, PH Retoure, PH Anzahlung, PH Stripe Ereignis: Rolle **PH Shop Leitung `delete: 1`**, keine `on_trash`-Sperre (nur PH Zahlung hat eine) | neu (BAO) |
| U22 | PH Zahlung Rechte | „kein Cancel“ | `on_cancel` wirft – gut; Rolle Leitung trägt trotzdem `cancel/amend: 1` → Frappe zeigt im Desk Knöpfe, die immer scheitern. Fürs Next-Backoffice egal, im Desk verwirrend | Hinweis |
| U23 | §3.4 Kanal „Verrechnung“ | Verrechnung buchen | keine Gegenseite (gegen was verrechnet?), kein Pflichtfeld; buchhalterisch nicht nachvollziehbar | neu |
| U24 | §5.1 „Abschließen … `versendet_am` + 14 Tage“ | Zeitpunkt Abschluss | Anker falsch: Widerruf bis Erhalt + 14 Tage, Rücksendung weitere 14 Tage, Rückzahlung bis zu 14 Tage nach Erklärung; bei fehlender Belehrung 12 Monate länger | neu |

---

## 2. Fehler in `ph_shop`, die vor dem Bau korrigiert werden müssen (Codebeleg)

| # | Datei / Stelle | Fehler | Wirkung | Korrektur |
|---|---|---|---|---|
| B1 | `ph_bestellung.py` `BEZAHLT`, `ist_bezahlt()` | `abholbereit` gilt als bezahlt | unbezahlte Übergabe am Packtisch; `zahlung_erfassen` verweigert die Zahlung einer abholbereiten Reservierung | `ist_bezahlt()` = `cint(betrag_bezahlt_cent) >= cint(gesamt_cent) > 0` (Geld statt Status); `BEZAHLT` nur für Reports, ohne `abholbereit` |
| B2 | `zahlung_erfassen` (im Konzept erkannt) | überschreibt `betrag_bezahlt_cent`, Status sofort `bezahlt` | Teilzahlung/Mehrfachzahlung falsch | addieren; Status erst bei Vollzahlung; `zahlung_ref` nur bei erster Zahlung setzen, alle Zahlungen über `PH Zahlung.bezug` lesen |
| B3 | `ph_retoure.py validate` | Erstattungsbetrag nur bei leerem Feld | Wertminderung wirkt nicht | solange `status in (Angekuendigt…Eingegangen)` immer neu berechnen; manuelle Abweichung nur mit Feld `erstattung_manuell` (Check) + `hinweis` Pflicht |
| B4 | `ph_widerruf.py erstatten` | ganze Zahlung als Standard; Status immer `widerrufen` | Teilwiderruf erstattet zu viel; Status falsch | Betrag aus `teilerstattung.berechne` über verknüpfte Positionen; Status `widerrufen` nur bei Vollwiderruf, sonst `teilerstattet` |
| B5 | `ph_widerruf.py validate` | `erhalten_am` = Versanddatum | Frist zu kurz → rechtswidrige Ablehnung möglich | `erhalten_am` ← `PH Bestellung.zugestellt_am` (neu, aus ph_logistik-Tracking); ohne Zustellnachweis `versendet_am + laufzeit_tage` **nur als Vorschlag**, `fristgerecht` im Zweifel 1 |
| B6 | `stornieren` | nur `zahlung_ref` erstattet; Storno aus `versendet`/`abgeholt` erlaubt | Restzahlungen bleiben; Ware beim Kunden, Bestellung „storniert“ ohne Retoure | Erstattung über alle Eingänge (`verteile_auf_zahlungen`, Reihenfolge: Stripe zuerst, Gutschein-Anrechnung → `storniere_einloesung`); aus `versendet/abgeholt` nur über Widerruf/Retoure |
| B7 | Report `ph_shop_umsatz_nach_ust_satz` | Statusfilter + `bezahlt_am` | UVA-Zuarbeit ändert sich rückwirkend, doppelte Minderung | alle je gebuchten Bestellungen, Monat = Leistungsdatum (§3 R8); Minderungen nur im Monat der Erstattung |
| B8 | `create_cash_invoice` (ph_faktura) | `leistungsdatum = bezahlt_am`; Status `abholbereit` | falsches Leistungsdatum (§ 11 Abs 1 Z 4 UStG) | Leistungsdatum = `zugestellt_am`/`versendet_am`/`abgeholt_am`; erst ab Übergabe oder Versand |
| B9 | Rechte JSONs | Leitung darf löschen | Verstoß gegen Unveränderbarkeit (§ 131 Abs 1 Z 6 BAO), Aufbewahrung § 132 BAO | `delete: 0` für alle Rollen außer System Manager; `on_trash`: werfen, sobald ein Dokument eine Zahlung, Mail oder Nummer an den Kunden hatte |
| B10 | `tasks._gutschein_abgelaufen` + Kennzahl | Ablauf blendet Verbindlichkeit aus | Bilanz/Restwert zu niedrig | Kennzahl und Report `PH Gutschein Bestand` zählen `rest_cent` aller Status außer `Eingeloest/Erstattet/Gesperrt(ersetzt)` |

---

## 3. Rechtliche Befunde

| # | Norm | Konzeptstelle | Verstoß / Risiko | Pflichtänderung |
|---|---|---|---|---|
| R1 | **§ 131b BAO, RKSV, § 132a BAO** (Registrierkassen- und Belegerteilungspflicht; Barumsatz umfasst Bargeld, Bankomat- und Kreditkarte) | §3.4 manuell Bar/Karte, §5.3 S1 Kanal „Bar · Karte extern“ (Standard Bar bei `vorort`!), S5 „hier erfassen“, S4 Barerstattung | Vor-Ort-Zahlung bar oder mit Karte außerhalb der Registrierkasse: kein signierter Beleg, kein DEP-Eintrag, Kassastand falsch. Webshop-Zahlungen online (Stripe Checkout) sind nach Erlasspraxis kein Barumsatz; Überweisung auch nicht | Im Backoffice-Dialog S1/S5/manuell **nur** `Ueberweisung` und `Stripe Link`; „Bar“, „Karte extern“ entfallen und werden ersetzt durch Knopf „An der Kassa kassieren“ (öffnet Kassa-Übergabe). Server: `PH Zahlung.validate` wirft bei `kanal in (Bar, Karte extern, Stripe Terminal)` und `quelle != kassa` ohne Feld `kassenbeleg`. Barerstattung nur als Kassa-Auszahlungsbeleg (ph_kassa), S4 zeigt bei Kanal Bar: „Erstattung an der Kassa auszahlen“ |
| R2 | § 11 UStG, § 11 Abs 6 (Kleinbetragsrechnung bis 400 €), § 11 Abs 1 (Pflicht ggü. Unternehmern) | §4.1 „Rechnung erstellen“ nur bei `rechnungswunsch` | Bestellbestätigung ist keine Rechnung. B2B (`rechnung_uid` gesetzt) braucht Rechnung mit UID beider Seiten; über 400 € volle Angaben | „Nächster Schritt“ Rechnung Pflicht, wenn `rechnung_uid` gesetzt oder `rechnungswunsch=1`; sonst optional. Rechnung erst ab Lieferung (B8). Banner in Akte „B2B-Bestellung – Rechnung fehlt“ (warning) |
| R3 | **Innergemeinschaftliche Lieferung** Art. 7 UStG-BMR, UID-Prüfung Stufe 2 (Art. 28 UStG-BMR) | `rechnung_uid` nur angezeigt | `ust.py` versteuert DE-Lieferungen an Unternehmer mit UID mit AT- oder DE-Satz; steuerfreie ig. Lieferung + ZM nicht abgebildet | Feld `PH Bestellung.uid_geprueft_am` (Datetime) + `uid_ergebnis` (Data); UI: Kunde & Lieferung zeigt „UID nicht geprüft“ (warning). Bis Steuerberater-Freigabe: B2B-Versand DE mit UID → Status `pruefen` + Hinweis „Steuerfall klären“; kein automatischer Steuersatz |
| R4 | **Fernverkaufsschwelle EU 10.000 €** (Art. 3 Abs 5 UStG-BMR), OSS | §3.9 Schalter `oss_aktiv`, `ust.py` Regel 6 | ohne OSS versteuert `ust.py` DE-Versand mit AT-Satz – nur zulässig, solange die Schwelle (Vorjahr und laufendes Jahr, EU gesamt) nicht überschritten ist. Keine Überwachung | Kennzahl „EU-Fernverkäufe Kalenderjahr“ (Summe netto `PH Bestellung` mit `lieferart=versand`, `adresse_land≠AT`, live) mit Schwelle aus neuem Feld `PH Shop Einstellungen.oss_schwelle_cent`; Banner Leitung ab 80 % der Schwelle; Schalter `oss_aktiv` nur mit Bestätigungsdialog |
| R5 | **§ 11 Abs 2 Z 2 FAGG** (Frist ab Erhalt, bei Teillieferung ab letzter Ware) | §3.6/§4.6 Ampel | Frist ab Versanddatum (B5) verkürzt die Verbraucherfrist; Teillieferung fehlt | `zugestellt_am` (neu); `frist_ende` aus letzter Teillieferung; Ampel zeigt Quelle „ab Zustellung lt. Sendungsverfolgung“ bzw. „geschätzt“ (muted) |
| R6 | **§ 12 FAGG** (Frist +12 Monate ohne Belehrung), § 7 Abs 3 FAGG (Bestätigung auf dauerhaftem Datenträger) | §3.9, §9.2 Banner Rechtstexte | Live-Bestellungen ohne freigegebene Belehrung: Widerruf bis zu 12 Monate + 14 Tage möglich; `fristgerecht` rechnet trotzdem 14 Tage → falsche „Nicht fristgerecht“-Kennzeichnung | (a) `shop_modus=live` nur speicherbar bei `rechtstexte_status=freigegeben` (Server-Validierung, UI-Fehlertext „Live erst nach Freigabe der Rechtstexte“); (b) `PH Widerruf.frist_verlaengert` (Check, berechnet: Bestellung ohne `widerrufsbelehrung_stand` oder Bestätigung ohne Anhang) → `frist_ende` + 12 Monate |
| R7 | **§ 18 Abs 1 FAGG** Ausnahmen (Z 3 Maßanfertigung/Kundenspezifikation, Z 5 versiegelte Hygieneware, u. a.) | fehlt | Einrichtungshaus verkauft Maßanfertigungen (Küche, Bad, Polster nach Stoffwahl); ohne Kennzeichen wird jeder Widerruf angenommen oder pauschal abgelehnt | `PH Bestellung Position.widerruf_ausgeschlossen` (Check, aus `PH Produkt`) + `ausschluss_grund` (Select: `Massanfertigung · Versiegelt geoeffnet · Sonstiges`); Widerrufsakte markiert betroffene Zeilen („Kein Widerrufsrecht – § 18 FAGG, Grund …“), Ablehnen-Dialog schlägt den Grund vor |
| R8 | **§ 19 Abs 2 Z 1 UStG** (Sollbesteuerung: Steuerschuld mit Ablauf des Monats der Leistung; Anzahlungen: Mindest-Istbesteuerung im Monat des Zuflusses), § 16 UStG (Entgeltsminderung im Monat der Minderung) | §3.10 `umsatz-ust`, §3.7 Anzahlungen | Monat nach `bezahlt_am` (B7); Anzahlungen ohne USt | Report: Leistungsmonat = `zugestellt_am`/`versendet_am`/`abgeholt_am`; Vorauszahlungen (bezahlt, nicht geliefert) als eigener Abschnitt „Anzahlungen/Vorauszahlungen (Mindest-Ist)“; Erstattungen nur im Erstattungsmonat mit Satzaufteilung aus `teilerstattung`. PH Anzahlung: Feld `ust_aufteilung` (Table PH Bestellung Steuer, aus Auftrag) |
| R9 | **§ 14 FAGG** (Rückzahlung inkl. Standard-Hinsendekosten, gleiches Zahlungsmittel, Zurückbehaltung bis Ware/Nachweis), **§ 15 Abs 2–4** (Rücksendekosten, Wertminderung nur bei Belehrung) | §4.6/§4.7, S4 | Teilwiderruf: Hinsendekosten nur bei Vollwiderruf; Express-Mehrkosten nicht; Wertminderung ohne Prüfung, ob belehrt; Zurückbehaltung nicht dokumentiert | PH Widerruf neue Felder: `hinsendekosten_cent` (berechnet: voll bei Vollwiderruf, 0 bei Teilwiderruf; Standardanteil bei Express), `ruecksendekosten_kunde` (Check, nur wenn belehrt), `absendenachweis` (Attach) + `absendenachweis_am` (Date) → Erstatten-Knopf aktiv ab Wareneingang **oder** Nachweis; Wertminderung-Feld in der Retoure gesperrt, wenn `frist_verlaengert=1` (keine Belehrung) |
| R10 | **§ 13 Abs 1 FAGG** (Erklärung formfrei), § 13a | §3.2.5, U15 | Widerruf per Brief/Telefon ohne E-Mail nicht erfassbar → Erklärung geht verloren | `PH Widerruf.kunde_email` nicht mehr Pflicht; Pflicht ist `kunde_email` **oder** `anschrift`; Eingangsbestätigung dann als PDF zum Ausdruck/Postversand (Druckformat „PH Widerruf Bestätigung“, `mail_status = nicht_gesendet` + Feld `bestaetigung_weg` Select `E-Mail · Post · Persönlich`) |
| R11 | FAGG-Anwendungsbereich (Geschäftsraum vs. Fernabsatz) | §3.2.5 Showroom-/Telefonreservierung | Bestätigung (`after_insert`) hängt Widerrufsbelehrung an jede Reservierung. Showroom-Vertrag = kein Fernabsatz (Belehrung falsch, räumt freiwillig ein Recht ein); Telefon-Reservierung mit Abholung + Zahlung vor Ort: Fernabsatz strittig | Feld `PH Bestellung.abschlussweg` (Select `online · telefon · showroom`, Pflicht bei `quelle=backoffice`); Mail-Vorlage wählt Text je Weg; Entscheidung Kanzlei (§11) |
| R12 | **VGG** (Gewährleistung Verbraucher, Vermutungsfrist), § 932 ABGB | fehlt | PH Retoure kennt nur Widerruf; Mangel/Falschlieferung/Transportschaden/Umtausch landen im selben Ablauf und werden mit Wertminderung belegt | `PH Retoure.grund` (Select Pflicht: `Widerruf · Gewaehrleistung · Transportschaden · Falschlieferung · Umtausch · Kulanz`); Wertminderung nur bei `Widerruf`; `Gewaehrleistung` → Folgeschritt „Service-Fall anlegen“ (ph_service) statt Erstattung |
| R13 | **Gutscheinbefristung** (OGH-Linie: Befristung kürzer als Verjährung nur mit sachlicher Rechtfertigung), § 1478 ABGB | S5 „Gültigkeit Standard `gutschein_gueltig_jahre`“, Reiter „Läuft ab (30 Tage)“ | Standard-Befristung verleitet zu unwirksamer Befristung; Ablauf → Rest faktisch verfallen | `gutschein_gueltig_jahre` Standard 0 (unbefristet); Feld in S5 nur Leitung mit Hinweis „Befristung nur nach Rechtsprüfung“; abgelaufene Gutscheine mit Rest bleiben einlösbar auf Leitungsfreigabe (Knopf „Trotzdem einlösen – Grund“) |
| R14 | **Einzweck-/Mehrzweckgutschein** (§ 4 Abs 9 ff. UStG i. d. F. Gutschein-RL) | S5 „Art“ | Einzweck wird bei Ausgabe steuerpflichtig – System versteuert erst bei Einlösung → doppelt (bei Einlösung) oder gar nicht (bei Verfall) | Bis Steuerberater-Freigabe: `art` fest `Mehrzweck`, Feld in der UI ausgeblendet; für Einzweck später `PH Gutschein.ust_satz_promille`/`steuerland` und Einlösung als Zahlungsmittel ohne erneute USt |
| R15 | **DSGVO** Art. 5 (Minimierung), 15 (Auskunft), 17 (Löschung) i. V. m. § 132 BAO | fehlt komplett im Konzept | `aufbewahrung.py` hat Regeln (31.12. Jahr + 7, Restwert-Gutscheine), aber **kein Aufruf, kein Scheduler, keine UI**; ⌘K durchsucht `kunde_email`, `kunde_telefon` ohne Protokoll; `ip_hash` (Leitung sichtbar) ohne Zweck | Neuer Bereich in `/shop/einstellungen?tab=datenschutz` (Leitung): Liste „Anonymisierbar ab“ aus `aufbewahrung.entscheidung`, Massenaktion „Anonymisieren“ (Rückfrage, irreversibel, Protokoll); Kundenakte-Export Art. 15 über ph_crm. `ip_hash` aus der Akte entfernen (nur Missbrauchsprüfung serverseitig) |
| R16 | **GlBG** | – | im Shop kaum berührt: keine Anrede-/Geschlechtsfelder, gut so. UI-Texte und Personas geschlechtsneutral halten („Shop-Mitarbeiterin“ in §1.1 ist Persona, kein Rollentext) | Rollenbezeichnungen in der Oberfläche neutral („Shop-Team“, „Shop-Leitung“) |

---

## 4. Buchhaltungslogik

| # | Thema | Befund | Pflichtänderung |
|---|---|---|---|
| B1 | **Storno/Erstattung nach Rechnung** | Konzept-S3/S4 bewegt Geld, berührt die Rechnung nicht. Eine ausgestellte Rechnung bleibt gültig, Umsatz bleibt gebucht | S3/S4/Widerruf/Retoure: Vorschau zeigt „Rechnung RE-… vorhanden → Gutschrift wird erzeugt“ und ruft `ph_faktura` PH Gutschrift (Teilbetrag positionsweise aus `teilerstattung.berechne`). Ohne ph_faktura-Methode: Erstattung gesperrt mit Text „Erst Gutschrift in Faktura anlegen“ + Link. Feld `PH Bestellung.rechnung` (Link PH Rechnung, read-only) und `gutschriften` (Zähler) |
| B2 | **Stripe-Gebühren** | `stripe_gebuehr_cent` je Zahlung; Gebührenrechnung kommt von Stripe (EU-Leistender → Reverse Charge beim Empfänger) | Report `stripe-abgleich` erhält Spalte „Gebühren netto (Reverse Charge)“ + CSV für den Export-Lauf; Hinweis im Bericht „Gebührenrechnung monatlich aus Stripe ablegen“; Ablagefeld `PH Stripe Auszahlung.gebuehrenbeleg` (Attach) |
| B3 | **Auszahlung = Geldtransit** | Abgleich zeigt Brutto/Gebühr/Netto, aber keine Buchungslogik „Stripe-Saldo → Bank“ | Export-Lauf (ph_faktura PH Export Lauf, BMD/DATEV vorhanden) muss PH Zahlung, Gegenbuchungen und PH Stripe Auszahlung übernehmen; Konzept §3.10 ergänzt Bericht „Buchhaltungsexport Shop“ (Leitung/Buchhaltung extern) mit Sperre übergebener Zeilen (`export_status`) |
| B4 | **Disputes** | Rückbelastung + Gebühr ohne PH Zahlung | `stripe_webhook._dispute` bucht `PH Zahlung art=Ausgang, kanal=Stripe Checkout, ursprung=…` (Betrag) + Gebühr; bei gewonnenem Streit (`charge.dispute.closed`, `won`) Gegenbuchung `Eingang`. Neues Feld `PH Zahlung.stripe_dispute` (Data), Status-Ergänzung `Zahlungsstreit`. UI: Banner in Zahlungs- und Bestellungsakte „Zahlungsstreit offen – Antwort bis TT.MM. im Stripe-Dashboard“ (danger) |
| B5 | **Doppelzählung Kassa/Shop** | Reservierung an der Kassa: Kassenbeleg-Umsatz + Bestellung im Shop-Umsatzbericht | Regel: Bezahlt eine Bestellung über die Kassa, bucht der Kassenbeleg den Umsatz; `PH Bestellung.kassenbeleg` (Link, neu) → Shop-Reports schließen solche Bestellungen aus (Spalte „über Kassa“) |
| B6 | **Gutschein-Verbindlichkeit** | Kachel ohne Abgelaufen/Erstellt (B10); Kulanzgutscheine (S5 „ohne Zahlung“, `kanal_ausgabe=Ersatz`) als Verbindlichkeit gezählt, obwohl kein Entgelt floss | `PH Gutschein.unentgeltlich` (Check) + `unentgeltlich_grund` (Pflicht bei 1); Bestand-Report trennt „verkauft“/„unentgeltlich“; Einlösung unentgeltlicher Gutscheine = Preisnachlass (Entgeltsminderung) – Steuerberater klärt Buchung |
| B7 | **Fremdwährung CHF** | `waehrung` an allen DocTypes, aber kein Kurs, keine EUR-Gegenwerte; `titel`, Reports, Konzept zeigen „€“ fest; `zahlung_eingegangen` setzt bei Fremdwährung nur `pruefen` | Grundsatz Fassung 3: **Shop nimmt nur EUR an** (Website-Checkout EUR, Backoffice-Dialoge ohne Währungswahl). Für Barzahlung in CHF ist die Kassa zuständig. Falls doch: `PH Zahlung.kurs` (Float 6), `betrag_eur_cent` (Int, Rechenbasis aller Summen), `kurs_quelle` (Select `EZB · BMF-Monatskurs · Stripe`), Anzeige „120,00 CHF (≈ 124,30 €, Kurs …)“. Reports summieren nur `betrag_eur_cent` |
| B8 | **Kanal „Verrechnung“** | ohne Gegenbeleg | Pflichtfelder bei `kanal=Verrechnung`: `verrechnet_mit_doctype`/`verrechnet_mit` (Dynamic Link, z. B. PH Gutschrift) – sonst Kanal aus dem Dialog entfernen |
| B9 | **Teilerstattung USt** | Kulanz-/Teilerstattung über S4 ohne Satzaufteilung; Gegenbuchung trägt nur Betrag | Jede Erstattung zu einer Bestellung speichert die Aufteilung je Satz: Kind-Tabelle `PH Zahlung.ust_aufteilung` (Table PH Bestellung Steuer) aus `teilerstattung.berechne` (Kulanz = Verhältnis offener Bruttowerte); S4 zeigt die Aufteilung in der Vorschau |
| B10 | **Anzahlung** | USt fehlt (R8); Anzahlung auf Auftrag gehört fachlich zur Faktura | `/shop/anzahlungen` bleibt Lese- und Link-Ansicht; Anlage aus Auftrag (ph_faktura); `PH Anzahlung.anzahlungsrechnung` (Link PH Rechnung) Pflicht vor `link_senden`, wenn Kunde Unternehmer |

---

## 5. Fehlende Pflichtprozesse

| # | Prozess | Heute | Soll (Komponenten, Zustände) |
|---|---|---|---|
| F1 | **Teillieferung** | ein Status je Bestellung; `teillieferung: False` fest in `bestaetigung_senden` | `PH Bestellung Position.geliefert_menge` (Int), neue Statuswerte `teilversendet`; Phasenleiste zeigt „Versendet 2 von 3“ mit Unterpunkten je Lieferschein; Massenaktion „Packen“ fragt „Alle Positionen oder Auswahl?“; Widerrufsfrist ab letzter Teillieferung (R5) |
| F2 | **Umtausch** | fehlt | Retoure `grund=Umtausch` → Ergebnis-Karte „Ersatzbestellung anlegen“ (neue PH Bestellung `quelle=backoffice`, Verrechnung mit Retoure statt Erstattung, B8) |
| F3 | **Lagerrückbuchung** | `wiedereinlagern` (Check) ohne Wirkung | Prüfung abschließen ruft ph_logistik/ph_sortiment Bestandszugang; ohne Methode: Aufgabe „Wareneingang buchen“ an Logistik |
| F4 | **Reservierung verfällt mit Teilzahlung/Gutschein** | `_reservierung_abgelaufen` setzt `abgelaufen`, ohne Geld zu prüfen | wenn `betrag_bezahlt_cent > 0`: kein Auto-Ablauf, Aufgabe Leitung „Reservierung mit Anzahlung abgelaufen – erstatten oder verlängern“ |
| F5 | **Zustellnachweis** | fehlt (`zugestellt_am`) | ph_logistik Tracking → `versendet_melden` + `zustellung_melden(zugestellt_am)`; Akte Versandkarte „Zugestellt 06.11. 10:42“ |
| F6 | **Kunde ohne E-Mail** | unmöglich (U15) | Kontaktweg-Feld (§6 P9); Reservierungsbeleg + Abholcode als Ausdruck A5 (`PH Bestellung Reservierung`, neues Druckformat) oder SMS (wenn ph_marketing-Kanal vorhanden); Packtisch sucht dann über Bestellnummer/Name |
| F7 | **Belegnachweis Vier-Augen bei Storno** | Bestellung sofort `storniert`, Geld wartet auf GF | Status `storniert` erst nach Erstattung **oder** Zusatzkennzeichen „Erstattung wartet auf Freigabe“ (Banner, Kanban-Karte mit `clock`); Kennzahl „Storniert, nicht erstattet“ |
| F8 | **Rechnungslauf** | Report „ohne Rechnung“, kein Ablauf | B2B Pflicht (R2); Massenaktion „Rechnungen erstellen“ in `/shop/berichte/ohne-rechnung` (sequenziell, Ergebnis-Drawer) |
| F9 | **Datenschutz-Lauf** | Logik ohne Ablauf (R15) | jährlicher Lauf (Leitung, Rückfrage), Protokoll |
| F10 | **Steuerliche Freigabe** | `ust.py`, `teilerstattung.py`, Reports als „Entwurf“ markiert | Live-Schaltung zusätzlich an `PH Shop Einstellungen.ust_freigabe_am` (Date, Steuerberater) binden; Banner bis dahin |

---

## 6. Randfälle – Abdeckung und Soll-Verhalten

| Fall | Konzept heute | Code heute | Soll (UI + Daten) |
|---|---|---|---|
| Storno vor Zahlung (`offen`, `reserviert`) | Workflow „Stornieren“ | ok | Reservierung: Mail „Reservierung storniert“ (Vorlage fehlt → Lücke ph_shop); Undo 8 s |
| Storno bezahlt, nicht versendet | S3 | nur `zahlung_ref` (B6) | alle Zahlungen; Gutschein-Anrechnung zurück (`storniere_einloesung` whitelisted); Lieferschein-Storno als Aufgabe |
| Storno nach Versand | erlaubt (`stornieren` aus `versendet`) | erlaubt | gesperrt; Knopftext „Widerruf erfassen“ statt „Stornieren“; Tooltip „Ware ist unterwegs – über Widerruf/Retoure“ |
| Storno nach Rechnung | nicht erwähnt | keine Gutschrift | B1 (Gutschrift Pflichtschritt in der Vorschau) |
| Storno über Vier-Augen-Grenze | Hinweis | Bestellung storniert, Geld offen | F7 |
| Teillieferung | fehlt | fehlt | F1 |
| Teilwiderruf | fehlt | Logik vorhanden, nicht verdrahtet | Widerrufsakte Tab „Positionen“ mit Mengen-Stepper je Bestellposition (`PH Widerruf Position.bestellung_position`, neu), Vorschau Betrag je Satz, Hinsendekosten-Regel (R9) |
| Anzahlung auf Reservierung | fehlt (Teilzahlung gesperrt) | B2 | nach Korrektur B2: S1 Teilbetrag frei, Live-Satz „offen danach …“; Reservierung mit Anzahlung verfällt nicht automatisch (F4) |
| Anzahlung auf Auftrag | Link-Ansicht | ohne USt | R8, B10 |
| Doppelte Anzahlung | vorhanden (`doppelt[]`) | ok | – |
| Retoure beschädigt | Wertminderung | B3 | B3 + R9 (nur bei Belehrung) |
| Retoure Gewährleistung | fehlt | fehlt | R12 |
| Retoure ohne Widerruf (Kulanz) | „direkt aus Bestellung“ erwähnt | keine Methode an PH Bestellung | Knopf „Retoure anlegen“ in Bestellungsakte `⋯` mit Pflicht-`grund`; serverseitig neue Methode `PH Bestellung.retoure_anlegen(grund)` |
| Fremdwährung CHF | nicht erwähnt | `pruefen` bei Stripe; manuell immer EUR | B7 (nur EUR, CHF an der Kassa); Schweizer Kunde mit Abholung: Hinweis „Ausfuhr im Reiseverkehr – Ausfuhrbeleg (U34) an der Kassa“ – Prozess und Mindestbetrag mit Steuerberater klären |
| Kunde ohne E-Mail | blockiert | `reqd` | F6, R10 |
| SEPA-Lastschrift scheitert nach Versand | nicht erwähnt | Rücklastschrift kommt als Dispute | B4; Bestellung erhält Banner „Zahlung zurückgebucht“, Kennzahl „Prüfen“ zählt mit |
| Gutschein-Zahlung erstatten | nicht erwähnt | `rueckerstatten` auf Kanal-Gutschein-Zahlung erzeugt Gegenbuchung, Restwert kommt nicht zurück | Erstattung einer Gutschein-Anrechnung = `storniere_einloesung` (Restwert zurück), nie Geld |
| Widerruf eines Gutscheinkaufs mit teilweise eingelöstem Gutschein | Hinweis | Aufgabe | Vorschau zeigt Erstattbetrag = Rest; eingelöster Teil nicht erstattbar |
| Testbestellung in Live-Bericht | gefiltert | ok | – |
| Bestellbestätigung fehlgeschlagen | Banner | ok | zusätzlich Druck „Bestätigung als PDF übergeben“ (dauerhafter Datenträger, § 7 Abs 3 FAGG) |

---

## 7. Pflichtänderungen (konkret, mit DocType/Feld)

Reihenfolge = Priorität. „Konzept“ = Änderung in `10-konzept-shop.md` Fassung 3; „App“ = Anfrage an den App-Eigentümer (Eintrag `ANFRAGEN-AN-CORE.md` bzw. App-Anfrage).

| P | Ziel | Konzept | App (DocType/Feld/Methode) |
|---|---|---|---|
| **P1** | RKSV einhalten | S1, S5, §3.4: Kanäle `Bar`, `Karte extern` entfernen; Knopf „An der Kassa kassieren“ (secondary, Icon `receipt`) übergibt die Bestellung an die Kassa; S4 bei Bar-Ursprung: „Erstattung an der Kassa auszahlen“ | `PH Zahlung.validate`: Barumsatz-Kanäle nur mit `quelle=kassa` und `kassenbeleg`; Fehlertext „Barzahlungen werden an der Kassa gebucht (Registrierkassenpflicht).“ |
| **P2** | Unbezahlte Übergabe verhindern | §2.2 Variante 3, §4.1, §8.2 auf Geldprüfung umstellen; Packtisch-Karte zeigt „Offen 89,00 €“ aus `gesamt_cent − betrag_bezahlt_cent` | `PH Bestellung.ist_bezahlt()` auf Beträge (B1); Test „reserviert → abholbereit → abgeholt_melden wirft“ |
| **P3** | Mehrfachzahlung korrekt | S1 Teilbetrag nach Korrektur frei | B2; `zahlung_ref` nur Anzeige der ersten Zahlung, Akte-Tab „Zahlung“ listet alle |
| **P4** | Fristbeginn Zustellung | §4.6 Ampel mit Quelle | `PH Bestellung.zugestellt_am` (Datetime, read-only, aus ph_logistik); `PH Widerruf.validate` (B5) |
| **P5** | Belehrung als Live-Voraussetzung | §3.9: Segment `shop_modus=live` deaktiviert mit Grund, solange `rechtstexte_status≠freigegeben` oder `ust_freigabe_am` leer | `PH Shop Einstellungen.validate`; neues Feld `ust_freigabe_am` (Date); `PH Widerruf.frist_verlaengert` (Check) |
| **P6** | Teilwiderruf/-erstattung positionsgenau | §4.6 Tab „Positionen“ mit Stepper; S4 mit Satzaufteilung | `PH Widerruf Position.bestellung_position` (Data, Zeilen-`name`), `PH Bestellung Position.zurueck_menge`, `erstattet_cent`; `PH Widerruf.erstatten` nutzt `teilerstattung.berechne`; `PH Zahlung.ust_aufteilung` (Table PH Bestellung Steuer) |
| **P7** | § 18 FAGG Ausnahmen | §4.6 Zeilenkennzeichen + Ablehnen-Vorschlag | `PH Bestellung Position.widerruf_ausgeschlossen` (Check), `ausschluss_grund` (Select); Quelle `PH Produkt` (ph_sortiment) |
| **P8** | § 14/15 FAGG Kosten, Zurückbehaltung | §4.6 Abwicklung: Felder + Erstatten-Bedingung | `PH Widerruf.hinsendekosten_cent`, `ruecksendekosten_kunde`, `absendenachweis`, `absendenachweis_am` |
| **P9** | Kunde ohne E-Mail | §3.2.5 Kontaktweg statt E-Mail-Pflicht; Druck Reservierungsbeleg mit Abholcode | `kunde_email` nicht `reqd` in PH Bestellung/PH Widerruf, wenn `quelle in (backoffice, kassa)`; neues `PH Bestellung.kontaktweg` (Select `E-Mail · Telefon · Ausdruck`); `PH Widerruf.bestaetigung_weg`; Druckformat „PH Bestellung Reservierung“ |
| **P10** | Storno/Erstattung mit Gutschrift | S3/S4/S8 Vorschau „Gutschrift wird erzeugt“; Storno aus `versendet/abgeholt` gesperrt | `PH Bestellung.rechnung` (Link PH Rechnung); ph_faktura-Methode `gutschrift_aus_erstattung(zahlung, aufteilung)`; `stornieren` erstattet alle Eingänge (B6) |
| **P11** | UVA-Zuarbeit nach Leistung | §3.10 `umsatz-ust`: Spalten Leistungsmonat, Abschnitt Vorauszahlungen, Minderungen | Report neu nach R8/B7; `PH Bestellung.kassenbeleg` (Link) zum Ausschluss Kassa-Umsätze |
| **P12** | Löschschutz | §1 Rechte: Leitung ohne Löschen; kein Löschen-Knopf an Bestellung, Gutschein, Widerruf, Retoure | JSON `delete: 0` (außer System Manager) + `on_trash`-Sperren |
| **P13** | Retoure korrekt | §4.7 Pflichtfeld Grund (Segment), Wertminderung nur bei Widerruf | `PH Retoure.grund` (Select, reqd), `erstattung_manuell` (Check); `validate` rechnet neu (B3); `PH Retoure Position.bestellung_position` |
| **P14** | Gutscheine rechtssicher | S5: Art ausgeblendet (Mehrzweck), Gültigkeit Standard unbefristet, nur Leitung; Kachel Restwert inkl. Abgelaufen | `PH Shop Einstellungen.gutschein_gueltig_jahre` Standard 0; `PH Gutschein.unentgeltlich` + `unentgeltlich_grund`; Kennzahl-Filter (B10) |
| **P15** | Disputes buchen | §3.8 Ansicht „Zahlungsstreit“; Banner in Akten | `stripe_webhook._dispute` bucht `art=Ausgang`; `PH Zahlung.stripe_dispute`; Ereignis `charge.dispute.closed` behandeln |
| **P16** | Nur EUR | §2 Regeln: „Shop arbeitet ausschließlich in EUR“; CHF-Fall an die Kassa | `PH Bestellung.validate`/`PH Zahlung.validate`: `waehrung=EUR` außer `quelle=kassa`; sonst Felder nach B7 |
| **P17** | OSS-Schwelle überwachen | §6.1 neue Kennzahl (Leitung/GF), Banner ab 80 % | `PH Shop Einstellungen.oss_schwelle_cent` |
| **P18** | B2B/UID | Kunde & Lieferung: UID-Prüfstatus; B2B-Versand DE → `pruefen` | `PH Bestellung.uid_geprueft_am`, `uid_ergebnis` |
| **P19** | Abschlusszeitpunkt | §5.1 „Abschließen“ frühestens nach `frist_ende` + 14 Tage ohne offenen Widerruf | Scheduler (Konzept §9.3) mit diesem Anker |
| **P20** | Abschlussweg für Belehrung | §3.2.5 Pflichtsegment „Wie wurde reserviert? Showroom · Telefon“ | `PH Bestellung.abschlussweg`; Mail-Vorlage je Weg |
| **P21** | Datenschutz-Lauf | `/shop/einstellungen?tab=datenschutz`; `ip_hash` aus der Akte | Methode `ph_shop.aufbewahrung_lauf()` (whitelisted, Leitung) auf Basis `aufbewahrung.entscheidung` |
| **P22** | Kulanz-Retoure ohne Widerruf | Bestellungsakte `⋯` „Retoure anlegen“ | `PH Bestellung.retoure_anlegen(grund)` |

### 7.1 Oberflächen-Folgen der wichtigsten Pflichtänderungen

**S1 neu (P1/P3) – Zahlung erfassen aus Bestellung**

```
┌ Zahlung erfassen · PH-S-261103-0009 ──────────────────────── [x] ┐
│ Offen 89,00 €  (bezahlt 50,00 € per Gutschein ····-7K3Q)          │
│ Weg      ((Überweisung)) (Zahlungslink senden)                    │
│ Betrag   [ 89,00 € ]   Teilbetrag erlaubt                         │
│ Referenz [ Verwendungszweck                 ]                     │
│ ───────────────────────────────────────────────────────────────── │
│ Bar oder Karte?  [receipt] An der Kassa kassieren →               │
│                              [Abbrechen]  [89,00 € buchen ⌘↵]     │
└───────────────────────────────────────────────────────────────────┘
```

- „An der Kassa kassieren“ schließt den Dialog, legt die Bestellung in die Kassa-Liste „Offen zum Kassieren“ (Lücke ph_kassa, Konzept §13) und zeigt Toast „Bestellung liegt an der Kassa bereit“. Bis ph_kassa liefert: Knopf öffnet Hinweis „An der Kassa Bestellnummer PH-S-… eingeben“.
- Fehler `Barzahlungen werden an der Kassa gebucht` erscheint, falls ein Altclient `Bar` sendet (Feldfehler am Weg).
- Live-Satz bei Teilbetrag: „Bucht 39,00 € · offen danach 50,00 € · Status bleibt ‚Reserviert‘“ (`aria-live="polite"`).

**S3 neu (P10) – Vorschau Geldfluss mit Beleg**

```
┌ Stornieren · PH-S-261104-0012 ───────────────────────────────── [x] ┐
│ Grund * [Kundenwunsch ▾]                                             │
│ Erstattung                                                           │
│   Stripe-Zahlung PH-ZAH-26-0101     319,00 €  → Rückzahlung Stripe   │
│   Gutschein ····-7K3Q                50,00 €  → Restwert zurück      │
│   Summe                             369,00 €                         │
│ Belege                                                               │
│   Rechnung RE-26-0042 vorhanden → Gutschrift über 369,00 € (20 %)    │
│   Lieferschein LS-… → Aufgabe „in Logistik stornieren“               │
│ [triangle-alert] Über 1.000 € → Freigabe Geschäftsführung (wenn ja)  │
│                                [Abbrechen]  [Stornieren] (danger)    │
└──────────────────────────────────────────────────────────────────────┘
```

- Status `versendet`/`abgeholt`: Assistent startet nicht; Akte zeigt statt „Stornieren“ den Knopf „Widerruf erfassen“ bzw. „Retoure anlegen“.
- Fehlerfall Gutschrift-Methode fehlt: Primärknopf deaktiviert, Text „Gutschrift kann noch nicht automatisch erzeugt werden – zuerst in Faktura anlegen“ + Link; kein Geld fließt.
- Ergebnis-Karte: Liste der Gegenbuchungen, Gutschrift-Nummer, „Kunde informieren“.

**Widerrufsakte neu (P4–P8) – Fristen und Positionen**

```
│ Fristen: Widerruf bis 20.11. (ab Zustellung 06.11., Sendungsverfolgung) ✓ fristgerecht     │
│          Rücksendung bis 21.11. · Rückzahlung bis 21.11. – zurückbehalten bis Ware/Nachweis │
│ Positionen                                                                  zurück          │
│ [img] Leuchte „Seelicht“   1 × 289,00 €                                      [ 1 ]          │
│ [img] Sofa „Lochau“ Stoff nach Wahl  1 × 2.890,00 €   Kein Widerrufsrecht – Maßanfertigung │
│ Hinsendekosten  0,00 € (Teilwiderruf)   Rücksendung trägt Kunde: ja (belehrt)               │
│ Erstattung  289,00 € (20 %: 48,17 € USt)                       [Erstatten] (erst ab Eingang)│
```

- `frist_verlaengert=1`: Ampel-Text „Belehrung fehlte – Frist bis 20.11.2027“, Badge warning, Wertminderung gesperrt mit Tooltip „Ohne Belehrung keine Wertminderung (§ 15 FAGG)“.
- Erstatten deaktiviert mit Grund „Ware noch nicht da – Nachweis der Rücksendung hochladen oder Eingang buchen“; Upload-Feld `absendenachweis` (PDF/JPG, max. 10 MB, Fehler „Datei zu groß“).

---

## 8. Was das Konzept richtig macht (beibehalten)

- Gebuchte Zahlungen gesperrt, Korrektur nur per Gegenbuchung; kein Löschen-Knopf an Zahlungen (passt zu `on_cancel`/`on_trash`).
- Vier-Augen-Erstattung mit Protokollfeldern (`erstattung_angefordert_*`) und Zwei-Klick-Freigabe.
- Gutschein-Codes nur als Hash, einmalige Anzeige, „Ersetzen“ statt Klartext-Nachdruck.
- Idempotenz über `idempotency_key` in allen Assistenten.
- Ehrliche Lückenliste §10/§13, zwei echte Codefehler gefunden (B2, `normalisiere_abhol`).
- Testmodus streng getrennt, Kennzahlen nur live.
- Widerruf als eigener Datensatz mit Eingangsbestätigung (§ 13a FAGG) und Missbrauchslimit für nicht zugeordnete Erklärungen.

---

## 9. Abnahmekriterien zusätzlich zu Konzept §11

1. Kein Backoffice-Dialog bietet `Bar`, `Karte extern`, `Stripe Terminal` an (grep über `backoffice/src/**/shop/**`); Server lehnt einen solchen Aufruf mit Fehlertext ab (Mock + Staging).
2. Testfall: Reservierung → abholbereit → Packtisch-Scan zeigt „Offen“, „Übergeben“ fehlt; `abgeholt_melden` wirft.
3. Testfall: Gutschein 50 € + Überweisung 39 € auf 89 € → `betrag_bezahlt_cent = 8900`, Status erst danach `bezahlt`; Storno erstattet 39 € und bucht 50 € auf den Gutschein zurück.
4. Testfall: Versand 03.11., Zustellung 06.11., Widerruf 19.11. → `fristgerecht=1`.
5. Testfall: Teilwiderruf 1 von 2 Positionen → Erstattung = Zeilenbetrag, Hinsendekosten 0, Bestellung `teilerstattet`, Gutschrift positionsgenau.
6. Testfall: Retoure mit Wertminderung 30 € nach Anlage → Erstattungsbetrag sinkt um 30 €.
7. UVA-Report: Bestellung bezahlt im Oktober, geliefert im November, erstattet im Dezember → Umsatz November, Minderung Dezember, Oktober unverändert nach Neuaufruf.
8. Live-Schalten ohne freigegebene Rechtstexte → Feldfehler, Wert bleibt.
9. Reservierung ohne E-Mail mit `kontaktweg=Ausdruck` → Beleg mit Abholcode druckbar; Packtisch findet die Bestellung über die Nummer.
10. Leitung sieht an keiner Shop-Akte „Löschen“; Server-`delete` → 403.

---

## 10. Offene Fragen (Steuerberater / Kanzlei / Inhaber)

| An | Frage |
|---|---|
| Steuerberater | Soll- oder Istbesteuerung des Unternehmens; Leistungsdatum Versand (Übergabe an Versanddienst oder Zustellung); Behandlung Kulanzgutscheine; Stripe-Gebühren-Buchung; Ausfuhr im Reiseverkehr für Schweizer Abholkunden (Ablauf, Mindestbetrag); Freigabe `ust.py`/`teilerstattung.py` (`ust_freigabe_am`) |
| Kanzlei | Telefon-Reservierung mit Abholung und Zahlung vor Ort: Fernabsatz ja/nein (Belehrung); Gutscheinbefristung zulässig ja/nein; Liste der § 18-FAGG-Ausnahmen im Sortiment |
| Inhaber | Shop nur in EUR (Vorschlag ja); Barerstattungen ausschließlich an der Kassa (Vorschlag ja); Reservierung ohne E-Mail zulassen (Vorschlag ja, mit Ausdruck) |

*Ende 21 – Fachkritik Shop.*
