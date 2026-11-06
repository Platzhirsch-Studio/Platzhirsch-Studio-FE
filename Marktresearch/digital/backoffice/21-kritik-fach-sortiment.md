# 21 – Fachkritik Konzept „Sortiment“ (10-konzept-sortiment.md) gegen ph_sortiment

**Zweck:** Prüfung des Konzepts `10-konzept-sortiment.md` als Fachkritiker (Möbelhandel, österreichisches Recht, Buchhaltung) und Frappe-Datenprüfer gegen `Backend-Import/ph_sortiment` (README, 34 DocType-JSONs, Controller, `logik/`, `api/__init__.py`, `fixtures/workflow.json`). Ergebnis: Note, Befunde je Kategorie, Pflichtänderungen mit DocType/Feld, Randfälle mit UI-Zustand.
**Stand:** 2026-11-04 · Prüfzeitpunkt App-Code 12:02 (die App wird parallel weiterentwickelt: `ph_herstellerbestellung.py` wurde während der Prüfung geändert, 11:58/12:01). Status: Kritik, keine Entscheidung des Inhabers.
**Methode:** Feldlisten per Skript aus den JSONs gezogen (Feldname, Typ, Pflicht, permlevel, Rechte), alle `@frappe.whitelist`-Methoden gelistet, Workflows aus Fixture ausgelesen, Querbezüge in `ph_faktura` (`PH Auftragsbestaetigung.herstellerbestellungen_erzeugen`, `PH Eingangsrechnung`), `ph_logistik`, `ph_service` geprüft. Rechtsangaben sind fachliche Hinweise, keine Rechtsberatung; vor Livegang Steuerberater/Anwalt.

---

## 0. Ergebnis in einem Satz

**Note 6 / 10.** Die Oberfläche (Arbeitsvorräte, Freigabe-Schreibtisch, A10, S3) ist durchdacht und bedienbar. Dagegen stehen drei Probleme. (1) Das Konzept beschreibt einen **älteren Stand der App**: rund 25 vorhandene Felder und 9 Methoden fehlen darin, 6 „Lücken“ sind schon geschlossen. (2) **Preis- und Steuerrecht** (Omnibus/PrAG § 9a, USt-Sätze 10/13/19 %, deutsche UVP mit 19 % MwSt., CHF) ist nicht abgebildet. (3) Für die **Buchhaltung** fehlt Folgendes: EK netto und VK brutto/netto werden in einer Bestellung vermischt, es gibt keine Fremdwährung, keine Bezugskosten, keinen Abgleich zwischen Wareneingang und Rechnung, keinen Löschschutz nach BAO, und Restmengen lassen sich nicht stornieren.

| Kriterium | Gewicht | Note | Begründung (kurz) |
|---|---|---|---|
| UI-Tiefe, Bedienbarkeit, Zustände | 20 % | 9 | Zustände, Tastatur, Leer-/Fehlerfälle und Motion vollständig |
| Datentreue zur App | 25 % | 5 | veralteter Stand, Rechte-Befunde L1/B10 falsch, neue Tabellen fehlen |
| Pflichtprozesse Möbelhandel | 20 % | 5 | Anzahlungsprüfung, Kundenstorno, Reststorno, Lieferantenvorkasse fehlen |
| Recht AT (PrAG, UStG, FAGG, VGG, BAO, DSGVO, RKSV) | 20 % | 4 | Omnibus, USt-Sätze, DE-UVP, Aufbewahrung nicht behandelt |
| Buchhaltungslogik | 15 % | 4 | Netto/Brutto-Semantik, Währung, Bezugskosten, Abgleich Wareneingang/Rechnung |
| **Gesamt (gewichtet)** | | **5,9 → 6** | |

---

## 1. Konzept ist veraltet: in der App vorhanden, im Konzept fehlend oder falsch

Diese Punkte **muss** das Konzept vor der Umsetzung übernehmen. Sonst bauen Entwickler Ersatzlösungen für Dinge, die es schon gibt, oder sie lassen Daten weg.

### 1.1 Falsch gemeldete Lücken (App hat es bereits)

| Konzept-Stelle | Konzept sagt | App-Stand (geprüft) | Korrektur im Konzept |
|---|---|---|---|
| §1 Rechte-Hinweis, L1, B10 | Leserecht Faktura/Kassa/Projekte/Marketing/Logistik auf PH Produkt fehlt; Logistik fehlt auf PH Wareneingang | `ph_produkt.json`: Lesen für PH Projekte *, PH Faktura *, PH Kassa *, PH Marketing Mitarbeiter, PH Logistik Mitarbeiter, PH Service Mitarbeiter. `ph_wareneingang.json`: PH Logistik Mitarbeiter `rwc`, Leitung `rwce` | L1 und B10 streichen. Neu (§1.3): Ausführung und Bestellung haben andere Rechte |
| §1.2, §8.2, L10, §9.2 „AB nachfragen“ | Methode fehlt | `PH Herstellerbestellung.ab_nachfragen(nachricht)` (nur Status Gesendet, Mail an `gesendet_an`/`bestell_email`, Kommentar) | als Methode eintragen; Automation bleibt Vorschlag |
| §2.12/A11 Schritt 2, L9 | Spaltenzuordnung serverseitig fehlt, Excel fehlt | `PH Preisliste Import`: `format` (Auto/CSV/DataNorm/IDM-XML/XML), `trennzeichen`, `kodierung`, `dezimal`, `mapping_json`, Methoden `vorschau()`, `mapping_speichern()`; `PH Lieferant.preisliste_format/_trennzeichen/_kodierung/_mapping_json` | A11 Schritt 2 auf `vorschau` + `mapping_speichern` umbauen; Mapping wird je Lieferant gespeichert und wiederverwendet. Excel bleibt eine Lücke |
| §2.8, §4.4 Wareneingang | nur Mengen und Zustand | `PH Wareneingang.unterlieferung`, `ueberlieferung`, `kontakt`, `projekt`, `servicefall_ref`, `regress_ref`; Position `differenz`, `mengen_abweichung` (keine/Unterlieferung/Ueberlieferung); Methode `schaden_melden(beschreibung, regress)` → PH Servicefall + optional PH Lieferantenregress | S3 Schritt 3 zeigt Differenz live; Akte §3.4: Primäraktion bei Reklamiert = `schaden_melden` (nicht ein eigener Servicefall-Dialog) |
| §3.3 Bewerten | nur `abweichung_bewerten` o/p/x | `abweichung_klaeren(zeile, aktion, text)` mit `akzeptieren` (Preis nur Leitung), `lieferant_reklamieren` (Mail), `kunde_rueckfragen` (ToDo); Felder `PH AB Abgleich.klaerung`, `geklaert_am` | Tastenbelegung ergänzen: `o` = akzeptieren, `r` = Lieferant reklamieren, `k` = Kunde rückfragen, `x` = ablehnen (Leitung). Spalte „Klärung“ im Abgleich |
| §3.3 Lieferung, §8.2 „Liefertermin überschritten / verschiebt Kundentermin“ | fehlt | `termin_aendern(termin, position, grund, quelle)` (Grund Pflicht), Kindtabelle `terminaenderungen` (`termin_alt`, `termin_neu`, `quelle` AB/Lieferant/Manuell, `grund`, `projekt_informiert`, `kunde_informiert`), `liefertermin_geaendert_am`, ToDo an Besteller in `on_update` | Tab Lieferung bekommt Zeitleiste „Terminänderungen“ mit Haken „Kunde informiert“ (siehe Randfall R9) |
| §2.7 Wunschtermin | manuell | `wunschtermin_schaetzen()` aus `PH Lieferant.lieferzeiten` (je Marke/Kategorie) und `betriebsurlaub` (`von`/`bis`); Methode `PH Lieferant.liefertermin(marke, kategorie, bestelldatum)` | Feld „Wunschtermin“ mit Vorschlag „frühestens KW 51 (Lieferzeit 6–8 Wo., Betriebsurlaub 22.12.–06.01.)“ |
| A10, §4.5 | AB-Werte: Menge, EK, Termin, Art.-Nr. | `ab_einlesen` übernimmt auch `ab_ausfuehrung_text`; `PH AB Abgleich.feld` kennt `Ausfuehrung`; Position `abweichung` kennt `Ausfuehrung` | Spalte „AB Ausführung“ in A10 (häufigster Fehler im Möbelhandel: falscher Bezug/Farbe) |
| §2.3 S1, §9.2 | `idempotency_key` fehlt | fehlt auf PH Produkt (richtig), **vorhanden** auf PH Herstellerbestellung (`idempotency_key`, ro) | Bestellanlage nutzt den Schlüssel; nur Produkt bleibt eine Lücke |

### 1.2 Vorhandene Daten, die das Konzept nicht kennt (UI fehlt)

| DocType.Feld / Methode | Fachbedeutung | Wo im Konzept einbauen |
|---|---|---|
| `PH Produkt.einkaufspreise` (Tabelle, permlevel 1: `lieferant`, `listen_cent`, `rabatt_promille`, `rabatt2_promille`, `netto_ek_cent` ro, `waehrung`, `ab`, `bis`, `quelle` Herstellerliste/DataNorm/IDM/Angebot Lieferant/Manuell, `preisliste`, `ausfuehrung`, `hinweis`) | EK-Historie mit Rabattkette | Produktakte Tab „Preise“, Bereich „Einkauf“ nur Leitung; Stufenlinie EK neben VK |
| `PH Produkt.vk_vorschlag(anlegen, lieferant)` + `PH Marke.kalkulationsfaktor_promille`, `vk_rundung`, `kalkulation_kategorien` (`PH Marke Kalkulation`: `kategorie`, `faktor_promille`, `rundung`) | VK aus EK × Faktor, als **nicht freigegebener** Preis, Quelle „Eigen“ | Tab Preise: Knopf „VK aus EK vorschlagen“ (Leitung). Markenakte: neuer Tab „Kalkulation“ (permlevel 1) |
| `PH Produkt.variantenpreise` (`kombination` „gruppe=option\|…“, `vk_cent`, `ek_cent` pl1, `ab`, `bis`, `hinweis`) + `variante_berechnen(auswahl)`, API `ph_sortiment.api.variante_berechnen` | Preismatrix (z. B. Bezug PG3 × Breite 200) | Tab Ausführungen: „Preismatrix“. **Rechtsbefund §3.4**: ohne Stand und Freigabe |
| `PH Produkt Ausfuehrung.preisgruppe`, `ek_aufpreis_cent` (pl1), `nicht_kombinierbar_mit` | Preisgruppen der Polsterer, Ausschlüsse | S2-Matrix: Spalten Preisgruppe, Ausschlüsse; Konfigurator-Vorschau warnt „nicht kombinierbar“ |
| `PH Produkt.abverkauf`, `abverkauf_preis_cent`, `abverkauf_seit` (nur `typ = Ausstellungsstueck`, Server `abverkauf_pruefen`) | Ausstellungsstück-Abverkauf | Produktliste-Ansicht „Abverkauf“; Akte Kopf-Chip „Abverkauf seit …“; **Rechtsbefund §3.1/§3.5** |
| `PH Produkt.preisart` (Auf Anfrage/Verkaufspreis/UVP, wird aus Preiszeilen abgeleitet), `waehrung` | Anzeigeart | Kopf zeigt „Preis auf Anfrage“ explizit |
| `PH Preisliste Import.lieferant`, `preisart = Einkaufspreis`, `vk_vorschlag`, Zeile `ean`, `ausfuehrung`, `zuordnung`, `preiskennzeichen`, `vk_vorschlag_cent`, Kopf `zeilen_ohne_produkt`, `hinweise` | Einkaufslisten (DataNorm/IDM) erzeugen EK-Zeilen und unfreigegebene VK-Vorschläge | A11 Schritt 1: Preisart „Einkaufspreis“ + Haken „VK vorschlagen“; Schritt 3: Spalten EAN/Ausführung/Zuordnung/Netto-Kennzeichen |
| `PH Herstellerbestellung.waehrung`, Position `einheit`, `raum`, `bezug_zeile`, `ab_ausfuehrung_text` | Währung, Raum (Küche/Bad), Rückverweis auf Auftragszeile | Positionstabelle §2.7: Spalten Raum, Einheit; Kopf Währung |
| `PH Herstellerbestellung.amended_from`, `PH Wareneingang.amended_from` | vorbereitete Korrekturkette (DocType ist aber nicht submittable) | Pflichtänderung P14 |

### 1.3 Rechte-Befunde, die das Konzept nicht hat

| DocType | Befund aus JSON | Folge | Pflicht |
|---|---|---|---|
| PH Herstellerbestellung | **keine** Faktura-Rolle; PH Projekte Mitarbeiter/Leitung `rwc` (dürfen anlegen/ändern); Logistik nur `r` | Faktura kann die Bestellung bei der Rechnungsprüfung nicht öffnen. Projekte können ohne Sortiment bestellen, Positionen ändern und senden (Workflow „Senden“ nur Sortiment Mitarbeiter, Speichern aber offen) | P11 |
| PH Produkt Ausfuehrung | Lesen: Projekte, Faktura, Kassa, **PH Shop Mitarbeiter**; fehlt: Logistik, Marketing, Service | Packtisch/Service sehen Ausführung (Farbe/Bezug) nicht; PH Produkt hat dafür keine Shop-Rolle | P11 |
| PH Produkt Preis (Kind) | `freigegeben` ohne permlevel; `preis_hinzufuegen(..., freigegeben=1)` ohne Rollenprüfung | Sortiment Mitarbeiter stellt Preise direkt online, der Freigabe-Tab „Preise (Leitung)“ ist wirkungslos | P3 |
| PH Produkt | `lieferzeit_freigabe_durch` ist `Data` (frei tippbar) | Freigabe-Nachweis (FAGG) fälschbar | P7 |
| PH Herstellerbestellung, PH Preisliste Import, PH Produkt, PH Lieferant | Sortiment Leitung hat `d` (löschen) ohne Statusprüfung | BAO-Aufbewahrung (§3.6) | P13 |

---

## 2. UI-Funktionen ohne Datenfeld oder Methode (Stand 12:02)

Spalte „Status“: **offen** = nicht in der App, **teilweise** = Ersatzweg vorhanden.

| # | UI-Funktion (Konzept) | Fehlt in ph_sortiment | Status | Konkrete Ergänzung |
|---|---|---|---|---|
| U1 | Freigabe-Schreibtisch „Freigeben nur mit Markenbeleg“ (§2.9) | Serverprüfung `PH Marke.bildfreigabe_status` in `bilder_auswerten`, Rollenbeschränkung `PH Produkt Bild.freigabe` | offen | `PH Produkt Bild.freigabe` permlevel 1; in `bilder_auswerten`: `erteilt` nur, wenn `freigabe_beleg` gesetzt **oder** Marke `schriftlich erteilt`; `quelle_url` allein genügt nicht (eine URL ist kein Nutzungsrecht, UrhG) |
| U2 | S3 „Buchen erst nach Prüfung“ | `wareneingang_vorschlag()` (nicht buchend) | offen | Methode gibt Positionen mit Rest zurück, bucht nicht; `wareneingang_anlegen` nur noch mit Parameter `bestaetigt=1` |
| U3 | „Lieferung beim Kunden bestätigen“ (Strecke) | `lieferung_bestaetigen(mengen, datum, nachweis)` ohne Lagerbewegung | offen | zusätzlich `PH Wareneingang.direktlieferung` (Check) damit ph_logistik keinen Bestand bucht |
| U4 | Mengenkorrektur Wareneingang | negative Mengen verboten, `on_trash` gesperrt | offen | P14 |
| U5 | „Preise laufen in 30 Tagen ab“ (§5.2), Automation | Report/Scheduler | offen | Report `PH Preise laufen ab` (Kindtabelle `PH Produkt Preis.gueltig_bis`), Task 30/7 Tage |
| U6 | Kommentarpflicht bei „abgelehnt“ | Serverprüfung | offen | `abweichung_bewerten`: `abgelehnt` ohne `kommentar` → Fehler |
| U7 | Positionssperre ab Gesendet | `allow_edit` bis Geliefert für Mitarbeiter | offen | `validate`: ab `Gesendet` Änderungen an `menge`, `produkt`, `ausfuehrung`, `ek_cent` nur Leitung, jede Änderung → Eintrag „Änderung nach Versand, Lieferant informieren“ + Feld `nachtrag_noetig` |
| U8 | Preis-Dialog mit Beleg/Zusatz | Parameter `beleg`, `zusatz_*` in `preis_hinzufuegen` | offen | Parameter ergänzen; zusätzlich `freigegeben` serverseitig nur Leitung (P3) |
| U9 | Sammelaktionen Bilder/Ausführungen/Verwendung | `bilder_freigeben`, `offene_bildfreigaben`, `produkt_verwendung`, `ausfuehrungen_anlegen` | offen | wie Konzept L11 |
| U10 | Bildumfang (Website/Social/Druck/Dauer) S4 | `PH Marke.bildfreigabe_umfang`, `bildfreigabe_bis` | offen | MultiSelect + Date; Freigabe-Schreibtisch filtert Marketing-Download nach Umfang „Social“ |
| U11 | „Preisstand zuletzt geprüft“ | Zeitstempel Scheduler | offen | `PH Sortiment Einstellungen.preisstand_letzter_lauf` (Datetime, ro) |
| U12 | Datenblatt mehrsprachig, Reklamations-PDF als Anhang, Marken-`website_url` | – | offen | wie Konzept L15 |
| U13 | Vorschau-Kachel „wie Website“ mit Grundpreis | Grundpreis wird nicht berechnet | offen | `grundpreis_cent` (ro) aus `aktueller_preis_cent`, `grundpreis_menge`, `grundpreis_einheit` |
| U14 | Heute-Leiste „AB ausständig“ serverseitig filterbar | `ab_faellig_am` | offen | beim Senden setzen = `gesendet_am + ab_erwartet_tage` |
| U15 | Kanban-Drop nach „AB geprüft“ zeigt Anzahlungsstand (neu, P1) | Feld | offen | P1 |
| U16 | Produktsuche Nummernmuster `PH-PLI-…` | Nummernkreis in ph_core | offen | README „Offen“ |

---

## 3. Recht und Buchhaltung: Verstöße und Risiken

### 3.1 Preisauszeichnung und Lauterkeit (PrAG, UWG)

| # | Befund | Fundstelle | Risiko | Pflichtänderung |
|---|---|---|---|---|
| R-P1 | **Preisermäßigung ohne „niedrigster Preis der letzten 30 Tage“** (PrAG § 9a, Omnibus-RL). Shop gibt Preisart `Angebot` aus (`_preises_fuer_shop` filtert `Verkaufspreis`, `Angebot`), Abverkauf hat `abverkauf_preis_cent`. Das Konzept zeigt Streich-/Abverkaufspreise, aber keine 30-Tage-Angabe | `api/__init__.py` `_preises_fuer_shop`; `PH Produkt.abverkauf_*`; Konzept §3.1 Preis-Dialog | Abmahnung/Verwaltungsstrafe | P4: berechnetes Feld `PH Produkt.tiefstpreis_30_tage_cent` (ro) aus der Preishistorie `preise` (freigegeben, gleiche Ausführung, Verkaufspreis/Angebot, `ab` in [heute−30, heute]). Speichern eines `Angebot`/Abverkauf ohne vorherige Preisgeschichte von 30 Tagen → Warnung „Ermäßigung nicht bewerbbar“. API liefert `tiefstpreis_30_tage_cent`. Preis-Dialog zeigt Live-Zeile „Bezugspreis für Rabattangabe: 2.890,00 € (niedrigster seit 05.10.)“ |
| R-P2 | **Deutsche UVP als österreichischer Bruttopreis.** Herstellerlisten aus DE enthalten 19 % DE-MwSt. oder sind netto. `uebernehmen` schreibt `neu_cent` als `brutto_cent` mit Preisart UVP | `ph_preisliste_import.py` `uebernehmen`; A11 | Irreführung (UWG § 2), falsche Preisangabe (PrAG: Bruttopreis inkl. USt AT) | P5: `PH Preisliste Import.preisbasis` (Select `brutto AT 20 %` / `brutto DE 19 %` / `netto` / `brutto CH`) Pflicht; `uebernehmen` rechnet um oder sperrt UVP-Übernahme bei Basis ≠ brutto AT („UVP gilt nur mit österreichischer Herstellerempfehlung“). Preiszeile bekommt `land_der_empfehlung` (AT/DE/CH) und UVP wird nur mit AT angezeigt |
| R-P3 | UVP-Anzeige ohne Kennzeichnung „unverbindliche Preisempfehlung des Herstellers, Stand …“ | Konzept §3.1 Kopf zeigt „UVP · Stand“ | UWG | Website/Datenblatt-Text fest: „Unverbindliche Preisempfehlung des Herstellers, Stand {stand}“; im Konzept Kopf und Datenblatt-Regel ergänzen |
| R-P4 | Grundpreis (Kerzen, Düfte, Pflegemittel) nur Felder, keine Prüfung | `PH Kategorie.grundpreis_pflicht`, `PH Produkt.grundpreis_*` | Preisauszeichnung | P6: Veröffentlichen/`verkauf_online` blockiert, wenn Kategorie `grundpreis_pflicht = 1` und `grundpreis_einheit`/`grundpreis_menge` leer; Checkliste „Bereit für Website“ + Punkt „Grundpreis“ |

### 3.2 Umsatzsteuer (UStG § 10, § 11; RKSV-Satzkennung)

| # | Befund | Fundstelle | Pflichtänderung |
|---|---|---|---|
| R-U1 | `ust_klasse` nur `normal|ermaessigt`. AT kennt 20 %, **10 %** (z. B. Bücher – Assouline), **13 %** (z. B. lebende Pflanzen im Outdoor-Bereich), **19 % Sondersatz Jungholz/Mittelberg** (Kleinwalsertal, Liefergebiet ab Lochau), 0 % (Ausfuhr, ig. Lieferung). „ermaessigt“ ist für Kassa (RKSV-Satzkennung Normal/Ermaessigt-1/Ermaessigt-2/Besonders/Null) und Faktura nicht eindeutig | `PH Produkt.ust_klasse`, `PH Kategorie.ust_klasse` | P8: `ust_klasse` → Select `20|13|10|0` (Wert = Satz am Artikel); 19 % ist **lieferortabhängig** und gehört in Faktura/Kassa (Lieferadresse PLZ 6991–6993 Mittelberg, 6691 Jungholz), nicht an den Artikel. Konzept §2.11 Kategorie und §3.1 Tab Lieferzeit & Shop: Auswahl mit Klartext „10 % – Bücher“, „13 % – Pflanzen“ |
| R-U2 | `PH Herstellerbestellung Position.vk_cent` hat **zwei Bedeutungen**: aus Faktura kommt `einzel_netto_cent` (netto), im Konzept §2.7 wird VK aus dem Produkt vorbefüllt (`aktueller_preis_cent` = brutto). `summe_vk_cent` mischt dann netto und brutto | `ph_auftragsbestaetigung.py` Z. 231; `ph_herstellerbestellung.py` `summen` | P9: Felder umbenennen/ergänzen: `ek_netto_cent`, `vk_netto_cent`; Label in UI „EK netto“, „VK netto“; Vorbefüllung aus Produkt = brutto ÷ (1 + USt-Satz) |
| R-U3 | Lieferant `uid` ohne Prüfung, `land` freier Text. Für ig. Erwerb (DE/IT-Hersteller, Erwerbsteuer) und Vorsteuerabzug aus Eingangsrechnungen (§ 11 Abs 1: UID des Leistenden; ab 10.000 € brutto auch UID des Empfängers) braucht die Buchhaltung beides sauber | `PH Lieferant.uid`, `land` | P10: `land` → Link Country (ISO-2), `uid` Formatprüfung je Land + Feld `uid_geprueft_am` (VIES-Abfrage manuell oder über ph_core); Hinweis an der Lieferantenakte „Drittland (CH): Einfuhr, Zoll, Einfuhrumsatzsteuer“ |
| R-U4 | `PH Lieferant` hat `autoname = field:firmenname`. Bei Umfirmierung (§ 11 verlangt den korrekten Namen) muss der Datensatz umbenannt werden, Links brechen oder werden mitgezogen | `ph_lieferant.json` | P10: Naming Series `LF-.#####`, `firmenname` frei änderbar mit Versionsverlauf |

### 3.3 Fernabsatz, Gewährleistung (FAGG, VGG)

| # | Befund | Pflichtänderung |
|---|---|---|
| R-F1 | Kein Kennzeichen **„nach Kundenspezifikation angefertigt“** (FAGG § 18 Abs 1 Z 3: kein Rücktrittsrecht). Bei Küchen, Maßmöbeln, Stoffen nach Wahl entscheidet das über das Rücktrittsrecht im Shop/Fernabsatz und über das Stornorisiko gegenüber dem Hersteller | P12: `PH Produkt.kundenspezifisch` (Check) und `PH Produkt Ausfuehrung.kundenspezifisch` (z. B. Sonder-RAL), Weitergabe in `PH Herstellerbestellung Position.kundenspezifisch` (ro). Shop zeigt den Hinweis vor der Bestellung; die Produktakte §3.1 Tab Lieferzeit & Shop bekommt den Schalter mit Erklärtext |
| R-F2 | Lieferzeit-Freigabe: Person als freier Text (`lieferzeit_freigabe_durch` Data) | P7: Link User, serverseitig gesetzt; Freigabe nur Rolle Leitung |
| R-F3 | Lieferzeit „x–y Wochen“ ohne Bezugspunkt (ab Bestellung? ab Anzahlung? ab Aufmaß?) | P7: `PH Produkt.lieferzeit_ab` (Select `Bestellung|Zahlungseingang|Aufmaß/Planfreigabe`), Standardtext je Sprache ergänzt um den Bezugspunkt |
| R-F4 | **Ausstellungsstück-Abverkauf** ohne Zustandsbeschreibung. Für die Gewährleistung (VGG) ist die vereinbarte Beschaffenheit entscheidend: Gebrauchsspuren müssen auf Beleg/Rechnung stehen. Kassa (RKSV-Beleg: Menge + handelsübliche Bezeichnung) braucht den Hinweis im Artikeltext | P12: `PH Produkt.zustand_text` (Data, Pflicht bei `abverkauf = 1`), wird in Kassa/Faktura-Position als Zusatzzeile übernommen; Konzept §2.2 Zeilenmenü „Ausstellungsstück anlegen“ fragt Zustand und Fotos ab |

### 3.4 „Kein Preis ohne Stand“ wird umgangen (eigener Leitsatz)

| Weg | Feld | Wirkung heute | Pflicht |
|---|---|---|---|
| Aufpreis der Ausführung | `PH Produkt Ausfuehrung.aufpreis_cent`, `preis_cent` | API gibt sie aus (`api/__init__.py` Z. 153), ohne Stand/Freigabe | P2: API gibt nur Preise aus `preise` (mit Stand, freigegeben, je `ausfuehrung`) aus; `aufpreis_cent`/`preis_cent` nur intern als „Kalkulationshilfe“ |
| Preismatrix | `PH Produkt.variantenpreise.vk_cent` (`ab`/`bis`, **kein** `stand`, **keine** Freigabe, keine Quelle) | `variante_berechnen` liefert den VK öffentlich über `ph_sortiment.api.variante_berechnen` | P2: Felder `stand`, `quelle`, `quelle_url`, `freigegeben`, `freigegeben_von/am` ergänzen, Ablaufregel wie `gueltig_bis`; die API rechnet nur freigegebene Zeilen |
| Freigabe durch Mitarbeiter | `PH Produkt Preis.freigegeben`, `preis_hinzufuegen(freigegeben=1)` | Mitarbeiter-Preis sofort online | P3 |

### 3.5 Buchhaltung und Warenwirtschaft

| # | Befund | Folge | Pflicht |
|---|---|---|---|
| R-B1 | **Keine Fremdwährung.** `waehrung` existiert auf Produkt, Preis, Einkaufspreis, Lieferant, Bestellung, Preisliste; **nirgends Kurs/Umrechnung**. `gueltiger_preis`/`ab_preis_cent` ignorieren `waehrung` (eine CHF-Zeile würde als EUR-ab-Preis angezeigt), `summen` addiert über Währungen hinweg, `vk_vorschlag` multipliziert CHF-EK mit dem Faktor zu einem EUR-VK, `logik/abgleich._cent` formatiert fest „€“ | falsche Preise, falsche Kalkulation, Eingangsrechnungsabgleich in falscher Währung | P1-W: (a) `PH Produkt Preis.waehrung` auf EUR beschränken (Website/Kassa AT), CHF-Kundenpreise nur über Faktura. (b) `PH Herstellerbestellung.kurs` (Float, 6 Nachkommastellen), `kurs_datum`, `summe_ek_eur_cent` (ro); `PH Produkt Einkaufspreis.netto_ek_eur_cent` mit Kursquelle. (c) `abgleich._cent` mit Währung. (d) UI: Betragsfelder zeigen das Währungskürzel aus dem Dokument, nie fest „€“ |
| R-B2 | **Bezugskosten** (Fracht, Verpackung, Zoll, Mindermengenzuschlag) fehlen an Bestellung und AB | Anschaffungskosten der Lagerware (UGB § 203) zu niedrig, AB-Abgleich übersieht Zuschläge | P15: Kindtabelle `PH Herstellerbestellung Kosten` (`art` Fracht/Verpackung/Zoll/Zuschlag/Montage, `betrag_cent`, `ab_betrag_cent`, `waehrung`); Abgleich-Feld `Kosten` |
| R-B3 | Wareneingang ohne Wert. Bestandsbewertung und offene Verbindlichkeiten aus „Ware da, Rechnung fehlt“ zum Bilanzstichtag nicht ermittelbar | Jahresabschluss | P15: `PH Wareneingang Position.ek_netto_cent` (pl1, Kopie aus `ab_ek_cent` oder `ek_cent`) und `wert_cent`; Report `PH Wareneingaenge ohne Eingangsrechnung` (Stichtag-Filter) |
| R-B4 | **Abgleich Rechnung ↔ Wareneingang ↔ Bestellung** nur grob: `PH Eingangsrechnung.pruefen` vergleicht gegen `summe_ek_cent` der **ganzen** Bestellung. Bei Teillieferung/Teilrechnung ist jede Rechnung „abweichend“ | sachliche Prüfung unbrauchbar | P16: Eingangsrechnung je Position/Wareneingang (`PH Eingangsrechnung.wareneingaenge` Tabelle oder Positionen mit `herstellerbestellung_position`), Soll = `menge_erhalten × ab_ek_cent` + Kosten − Skonto. Konzept §3.3 „Weiter: Eingangsrechnung prüfen“ zeigt „berechnet n von m Stück“ |
| R-B5 | **Lieferanten-Vorkasse/Anzahlung** (häufig bei italienischen Herstellern, Sonderanfertigungen) nicht abbildbar | Proforma/Anzahlungsrechnung des Lieferanten, Vorsteuer erst mit Rechnung + Zahlung | P17: `PH Herstellerbestellung.zahlungsbedingung` (Select `Ziel|Vorkasse|Anzahlung`), `anzahlung_lieferant_cent`, `anzahlung_bezahlt_am`; Status-Hinweis „Hersteller produziert erst nach Zahlung“; Arbeitsvorrat „Vorkasse offen“ |
| R-B6 | `skonto_promille` am Lieferanten, aber keine Skontofrist an der Bestellung/Rechnung sichtbar | verlorenes Skonto | Faktura-Thema; Konzept §3.5 Konditionen-Tab verlinkt „offene Rechnungen mit Skontofrist“ |
| R-B7 | **Löschen statt Stornieren.** Leitung darf Bestellungen, Preislisten und Produkte in jedem Status löschen; `PH Wareneingang.on_trash` sperrt nur bei verbuchten Mengen | BAO § 132: 7 Jahre Aufbewahrung von Geschäftspapieren (Bestellung, AB, Lieferschein); Preishistorie ist Beweismittel (UWG/PrAG) | P13 |

### 3.6 Datenschutz (DSGVO)

| # | Befund | Pflicht |
|---|---|---|
| R-D1 | `kommission` = `kunde_name / projekt` (aus Faktura) steht auf Bestell-PDF, AB-Nachfrage-Mail und Reklamationsmail an Hersteller. Bei „Kunde direkt“ geht zusätzlich die Adresse (`lieferadresse_text`) hinaus | Übermittlung zur Vertragserfüllung zulässig, aber: (a) Datenschutzhinweis „Weitergabe an Hersteller/Spedition“ in AGB/Datenschutzerklärung prüfen; (b) Einstellung `PH Sortiment Einstellungen.kommission_format` (`Kundenname|Auftragsnummer|Kürzel`), Standard Auftragsnummer, Kundenname nur bei „Kunde direkt“; (c) UI-Hinweis im Senden-Dialog „enthält Kundendaten: Name, Adresse“ |
| R-D2 | Wareneingangs- und Montagefotos (Strecke) können Personen/Wohnräume zeigen; keine Löschfrist | `PH Wareneingang Foto.personenbezug` (Check) + Löschfrist (z. B. nach Ende Gewährleistung/Regress), Hinweis an der Kamera „Keine Personen fotografieren“ |
| R-D3 | `PH Sortiment Ansprechpartner` (Lieferanten-Personen) ohne Löschregel | bei `PH Lieferant.status = Inaktiv` Aufgabe „Ansprechpartner prüfen/löschen“; nicht dringend |

### 3.7 RKSV, GlBG

- **RKSV:** Sortiment liefert Bezeichnung, USt-Satz und Preis an die Kassa. Pflicht: P8 (eindeutiger Satz); `titel` (Marke + Bezeichnung, max. 140) ist als handelsübliche Bezeichnung geeignet. Die Ausführung (`ausfuehrung_text`) muss in die Kassenposition mitgehen. Preisänderung während des Tages (`ab = heute`): Kassa muss den Preis zum Zeitpunkt der Buchung nehmen, nicht aus einem Cache. Das betrifft das Konzept nur, wenn Kassa den Sortiment-Cache (`api_cache_sekunden` 3600) nutzt. Pflicht: Kassa liest Preise ungecacht oder mit Versionsstempel `get_katalog_version`.
- **GlBG:** kein Befund im Sortiment (keine Personalentscheidungen, keine Stellentexte). Rollenbezeichnungen „Mitarbeiter“ sind Systemnamen; in UI-Texten geschlechtsneutral formulieren („Team Sortiment“) – Stilfrage, keine Pflicht.

---

## 4. Fehlende Pflichtprozesse (Möbelhandel, Kette Auftrag → Service)

| # | Prozess | Was fehlt (Konzept und App) | Ablauf in der UI (Vorschlag) | Daten |
|---|---|---|---|---|
| PP1 | **Bestellung erst nach Kundenanzahlung** | Senden prüft keine Anzahlung. `PH Auftragsbestaetigung` hat `anzahlung_soll_cent`, `anzahlung_ist_cent` | Senden-Dialog zeigt Band „Anzahlung Kunde: 0 von 3.000,00 € eingegangen“; Senden für Mitarbeiter gesperrt, Leitung „Trotzdem senden“ mit Pflichtgrund (Stammkunde, Objekt). Kanban-Drop nach „Gesendet“ → gleicher Dialog | P1 |
| PP2 | **Kunde storniert Auftrag** nach Versand der Bestellung | kein Rückweg Faktura → Sortiment; keine Stornokosten des Herstellers | Faktura-Storno erzeugt Aufgabe je verknüpfter Bestellung „Storno beim Hersteller anfragen“; Bestellakte: Aktion „Storno anfragen“ (Mail, Status bleibt) → „Storno bestätigt“ mit `stornokosten_cent` und Beleg → Workflow Stornieren; Stornokosten an Faktura („weiterverrechnen ja/nein“) | P18 |
| PP3 | **Reststorno bei Teillieferung** | Workflow kennt kein Stornieren aus `PH Teilgeliefert`; Position `status = Storniert` nur per Bearbeiten | Positions-Menü „Rest stornieren“ (Leitung, Grund, Bestätigung Lieferant) → Position `Storniert`, `bestellstatus_aus_mengen` ignoriert sie → Bestellung `Geliefert`. Workflow-Übergang `PH Teilgeliefert -- Rest stornieren -> PH Geliefert` (Leitung) | P19 |
| PP4 | **Positionsstorno/-änderung nach AB** | Änderungen ohne Nachtrag | Position ändern ab Gesendet = „Nachtrag“: neue Version des PDFs „Nachtrag 1 zu HB-…“, Mail an Lieferant, AB erneut erwartet (Status zurück auf Gesendet für diese Position) | U7, `nachtrag_nr` |
| PP5 | **Überlieferung** | `ueberlieferung` wird gezählt, aber verbucht (Mehrmenge zählt als erhalten, Status Geliefert) | S3: bei Mehrmenge Pflichtentscheidung „annehmen (Nachbestellung/Rechnung) · zurücksenden“; „zurücksenden“ bucht nur die Sollmenge und legt Retoure an (PP6) | `PH Wareneingang Position.ueberlieferung_entscheidung` |
| PP6 | **Lieferantenretoure** (falsch, beschädigt, Mehrmenge) | kein DocType; Zustand `falsch` zählt nicht als erhalten, die Ware steht aber im Lager | Aus Wareneingang „Rücksendung an Lieferant“ → Rücklieferschein (Druckformat), Abholauftrag (ph_logistik `PH Speditionsauftrag`), Status „zurückgesendet“, Gutschrift erwartet (Faktura) | P20 |
| PP7 | **Kundenretoure / Rücktritt (FAGG 14 Tage) / Umtausch** | `PH Wareneingang.herstellerbestellung` ist Pflicht → Kundenretoure kann hier nicht gebucht werden. Gehört zu Logistik/Shop, Sortiment muss den Artikelzustand kennen | Sortiment zeigt in der Produktakte „Retouren n (30 Tage)“; Rückläufer als B-Ware: Aktion „Als Ausstellungsstück/B-Ware anlegen“ (bestehendes `ausstellungsstueck_anlegen`) mit `zustand_text` | Abgrenzung im Konzept §3.7 dokumentieren |
| PP8 | **Bestellentwurf ohne Lieferant** | `herstellerbestellungen_erzeugen` setzt `ignore_mandatory`, `lieferant` kann leer sein (Position ohne `lieferant`) | Liste „Bestellungen“: Systemansicht „Lieferant fehlt“, Zeile rot, Primäraktion „Lieferant zuordnen“ (Vorschlag aus `PH Marke.lieferant`) | – |
| PP9 | **Herstellerreklamation → Servicefall → Regress** | im Konzept zwei getrennte Knöpfe | eine Primäraktion `schaden_melden(regress)` mit Haken „Regress gegen Lieferant“ (Methode existiert) | – |
| PP10 | **Abschluss erst nach Rechnungsprüfung** | „Abschließen“ ohne Eingangsrechnung erlaubt (Konzept: nur Hinweis) | Für Buchhaltung: Abschließen nur, wenn alle `menge_erhalten` durch sachlich geprüfte Eingangsrechnungen gedeckt sind **oder** Leitung mit Grund „Rechnung folgt nicht (Kulanz/Muster)“ | P16 |

---

## 5. Randfälle (Pflicht in Konzept und QA)

Format: Fall → erwartetes Verhalten (UI-Zustand, Text) → Daten.

| # | Randfall | Erwartetes Verhalten | Daten / Methode |
|---|---|---|---|
| R1 | **Storno vor Versand** (Entwurf) | Mitarbeiter darf; Undo 8 s; kein Hinweis an Lieferant | Workflow `Stornieren` (vorhanden) |
| R2 | **Storno nach AB mit Stornokosten** | Dialog: Grund*, „Lieferant hat Storno bestätigt“ (Beleg-Upload*), Stornokosten (Betrag, Währung), „an Kunden weiterverrechnen“; ohne Bestätigung bleibt Status, Chip „Storno angefragt“ | P18: `storno_angefragt_am`, `storno_bestaetigt_am`, `storno_beleg`, `stornokosten_cent` |
| R3 | **Teillieferung + Reststorno** | Position: „1 von 2 geliefert · Rest storniert“; Bestellung → Geliefert; Eingangsrechnung Soll = 1 Stück | P19 |
| R4 | **Teillieferung, Rest mit neuem Termin** | `termin_aendern(position, termin, grund)`; Zeitleiste „Pos. 2: 01.12. → 15.01. (Lieferant)“; Haken „Kunde informiert“ Pflicht, bevor Montage geplant wird | vorhanden: `terminaenderungen.kunde_informiert` |
| R5 | **Anzahlung Kunde fehlt** | siehe PP1, Band orange, Leitung-Override mit Grund (Kommentar) | P1 |
| R6 | **Vorkasse an Lieferant** | Status Gesendet + Chip „Vorkasse offen 1.200,00 €“; AB-Termin gilt erst ab Zahlung („Termin ab Zahlung: KW 3“) | P17 |
| R7 | **Retoure an Lieferant** (falsche Farbe) | Wareneingang Zustand `falsch`, Foto; Primäraktion „Rücksendung“ → Rücklieferschein; Bestellung Position bleibt offen (Ersatz erwartet) | P20 |
| R8 | **Fremdwährung CHF** (Schweizer Hersteller/Lieferant, CH-Preisliste) | Bestellung Kopf `waehrung CHF`, Kurs + Kursdatum Pflicht beim Senden; Beträge „CHF 1.250,00“, daneben grau „≈ 1.312,50 € (Kurs 04.11.)“; Preisliste CHF: Übernahme nur als Einkaufspreis, nie als VK/UVP auf die Website | P1-W |
| R9 | **Kunde ohne E-Mail** (bei Terminänderung, Lieferavis, Strecke) | Aufgabe „Kunde anrufen: neuer Termin 15.01.“ statt Mail; `kunde_informiert` erst nach Anruf setzbar mit Kanal | `PH Herstellerbestellung Terminaenderung.kunde_informiert_kanal` (Select Telefon/Brief/E-Mail/persönlich), `kunde_informiert_am`; Telefon aus `PH Kontakt` (`kontakt` über Bezug) |
| R10 | **Lieferant ohne Bestell-E-Mail** (Fax/Portal) | Senden → „Als gesendet markieren“ mit Pflichtfeld „Gesendet über“; `ab_nachfragen` und `lieferant_reklamieren` gesperrt mit Text „Keine E-Mail – Portal öffnen ↗ / Telefon“ | vorhanden (Fehlertext Server), UI-Sperre ergänzen |
| R11 | **Strecke ins Ausland** (DE-Hersteller → Kunde in CH oder IT) | Warnband „Reihengeschäft/Ausfuhr – Steuerbehandlung klären“, Lieferland Pflicht; ohne Ausfuhrnachweis keine steuerfreie Rechnung | P10: `PH Herstellerbestellung.lieferland` (Link Country), `reihengeschaeft` (ro, berechnet aus Lieferant-Land ≠ Lieferland ≠ AT) |
| R12 | **Kleinwalsertal** (Lieferadresse Mittelberg) | Faktura/Kassa wenden 19 % an; Sortiment zeigt beim Artikel nur 20/13/10 | P8 (Abgrenzung) |
| R13 | **Preis ändert sich zwischen Angebot und Bestellung** | AB-Abgleich Preis: Akzeptieren nur Leitung (vorhanden); zusätzlich Hinweis „Kundenpreis im Auftrag fest – Marge sinkt um x %“ | `rohertrag_promille` aus `logik/kalkulation` |
| R14 | **Doppelte Preiszeile bei Preisliste** | `uebernehmen` bricht heute komplett ab → Vorprüfung, Zeile überspringen mit Hinweis | Konzept B6 (bestätigt) |
| R15 | **Wareneingang doppelt gebucht** (zwei Geräte am Packtisch) | heute möglich; Server-Sperre: zweite Buchung mit gleicher `lieferschein_nr_lieferant` + Bestellung → Fehler „schon gebucht als WE-…“ | `idempotency_key` auch auf PH Wareneingang |
| R16 | **Aufgelöste Marke / Händlervertrag beendet** mit offenen Bestellungen und aktiven Produkten | Vertrag abgelaufen → Claims-Ampel rot, Produkte bleiben aktiv, Händlersatz verschwindet (Claim-Guard), Aufgabe „Sortiment prüfen“ | vorhanden teilweise (`vertrag_gueltig_bis`) |
| R17 | **Produkt „Ausgelaufen“ mit offener Bestellung/Anfrage** | Dialog zeigt Zähler (Konzept vorhanden); zusätzlich Sperre, wenn ein offener Kundenauftrag das Produkt enthält (Faktura) | `produkt_verwendung` (U9) |

---

## 6. Pflichtänderungen (konkret, priorisiert)

**A = vor Livegang des Bereichs, B = vor Shop/Kassa-Anbindung, C = danach.**

| Nr | Prio | DocType / Feld / Methode | Änderung | Konzept-Stelle |
|---|---|---|---|---|
| P1 | A | `PH Herstellerbestellung.anzahlung_pruefen()` (neu), Felder `anzahlung_kunde_soll_cent`, `anzahlung_kunde_ist_cent` (ro, aus `bezug_name` PH Auftragsbestaetigung), `senden_trotz_anzahlung_grund` | Senden ohne vollständige Anzahlung nur Leitung mit Grund | §2.7, §4.2 Senden, Kanban-Drop |
| P1-W | A | `PH Herstellerbestellung.kurs`, `kurs_datum`, `summe_ek_eur_cent`; `PH Produkt Einkaufspreis.netto_ek_eur_cent`; `PH Produkt Preis.waehrung` nur EUR; `logik/abgleich._cent(v, waehrung)`; `logik/preise.gueltiger_preis` filtert Währung | Fremdwährung durchgängig | §2.6, §2.7, §3.3, A10, A11 |
| P2 | A | `PH Produkt Variantenpreis` + `stand`, `quelle`, `quelle_url`, `freigegeben`, `freigegeben_von`, `freigegeben_am`, `gueltig_bis` (ro); API `_optionen`/`variante_berechnen` nur freigegebene, nicht abgelaufene Werte; `aufpreis_cent`/`preis_cent` nicht mehr in der API | „Kein Preis ohne Stand“ auch für Varianten | §3.1 Tab Ausführungen, B3 |
| P3 | A | `PH Produkt Preis.freigegeben` permlevel 1 (Leitung/GF); `preis_hinzufuegen`: Default `freigegeben=0`, `1` nur mit Leitungsrolle; Parameter `beleg`, `zusatz_de…it` | Preisfreigabe durch Leitung wirksam | §2.9 Tab Preise, §3.1 Dialog |
| P4 | B | `PH Produkt.tiefstpreis_30_tage_cent` (ro) + API-Feld; Validierung bei `preisart = Angebot` und `abverkauf = 1` | PrAG § 9a | §3.1 Dialog, §2.2 Spalte |
| P5 | A | `PH Preisliste Import.preisbasis` (Pflicht); `PH Produkt Preis.land_der_empfehlung` (AT/DE/CH); `uebernehmen` sperrt UVP ≠ AT-brutto | DE-UVP nicht als AT-Preis | A11 Schritt 1 und 4 |
| P6 | B | `pruefe_veroeffentlichung` + Grundpreis-Prüfung (`PH Kategorie.grundpreis_pflicht`); `PH Produkt.grundpreis_cent` (ro) | Grundpreis | §3.1 Checkliste |
| P7 | A | `PH Produkt.lieferzeit_freigabe_durch` → Link User, ro, serverseitig; Freigabe nur Leitung; `lieferzeit_ab` (Select) | FAGG-Nachweis | §2.9 Tab Lieferzeiten, §3.1 |
| P8 | B | `PH Produkt.ust_klasse`, `PH Kategorie.ust_klasse` → Select `20|13|10|0` (Migration `normal→20`, `ermaessigt→` manuell je Kategorie, Patch mit Liste) | eindeutiger USt-Satz für Kassa/Faktura | §2.11, §3.1 |
| P9 | A | `PH Herstellerbestellung Position.ek_cent` → Label „EK netto“, `vk_cent` → `vk_netto_cent` (Migration), `summe_vk_cent` → netto; Vorbefüllung aus Produkt rechnet brutto → netto | eindeutige Netto-Semantik | §2.7, §2.6 Spalten |
| P10 | B | `PH Lieferant.land` → Link Country; `uid` Prüfung + `uid_geprueft_am`; Naming Series `LF-.#####`; `PH Herstellerbestellung.lieferland`, `reihengeschaeft` (ro) | UStG, Reihengeschäft | §3.5, §2.7 |
| P11 | A | Rechte: PH Herstellerbestellung + PH Faktura Mitarbeiter/Leitung `r` (Faktura Leitung permlevel 1 `r` für EK); PH Projekte nur `r` + Aktion „Bestellung anfragen“ (PH Aufgabe an Sortiment); PH Produkt Ausfuehrung + Logistik, Marketing, Service `r`; PH Produkt + PH Shop Mitarbeiter `r` | Rollen konsistent | §1 Rechte-Hinweis neu schreiben |
| P12 | B | `PH Produkt.kundenspezifisch`, `PH Produkt Ausfuehrung.kundenspezifisch`, `PH Herstellerbestellung Position.kundenspezifisch` (ro); `PH Produkt.zustand_text` (Pflicht bei Abverkauf) | FAGG § 18, VGG | §3.1 Tab Lieferzeit & Shop |
| P13 | A | `on_trash` in PH Herstellerbestellung (nur `Entwurf` ohne `gesendet_am`), PH Preisliste Import (nur `Hochgeladen`/`Verworfen` ohne Übernahme), PH Produkt (nur ohne Preis-Historie, ohne Verwendung, Status Entwurf); sonst „Stornieren“/„Auslaufen lassen“ | BAO § 132, Beweisführung | §4, `loescheDokumentAction` nur für Entwürfe einblenden |
| P14 | B | `PH Wareneingang.korrektur_von` (Link PH Wareneingang), `art` (Select `Eingang|Korrektur`); bei `Korrektur` negative `menge_erhalten` erlaubt (nur Leitung), `verbuchen` zieht ab; Pflicht-Grund | Fehlbuchung umkehrbar | §2.8, L5 |
| P15 | B | Kindtabelle `PH Herstellerbestellung Kosten`; `PH Wareneingang Position.ek_netto_cent` (pl1), `wert_cent`; Report `PH Wareneingaenge ohne Eingangsrechnung` | Anschaffungskosten, Stichtag | §3.3 Tab Positionen, §2.13 Berichte |
| P16 | B | Eingangsrechnung je Wareneingang/Position (ph_faktura), Abschließen-Bedingung `rechnung_gedeckt == 1 or leitung_grund` | sachliche Prüfung bei Teilrechnung | §4.2 Abschließen |
| P17 | C | `PH Herstellerbestellung.zahlungsbedingung`, `anzahlung_lieferant_cent`, `anzahlung_bezahlt_am` | Lieferanten-Vorkasse | §3.3 Kopf |
| P18 | A | `PH Herstellerbestellung.storno_angefragt_am`, `storno_bestaetigt_am`, `storno_beleg`, `stornokosten_cent`, `storno_weiterverrechnen`; Methode `storno_anfragen(nachricht)`; doc_event aus Faktura-Storno | Kundenstorno | §4.2 Stornieren |
| P19 | A | Workflow `PH Teilgeliefert -- Rest stornieren -> PH Geliefert` (Leitung); Methode `rest_stornieren(positionen, grund)` | Teillieferung abschließbar | §4.2 |
| P20 | C | DocType `PH Lieferantenretoure` (oder in ph_logistik): `wareneingang`, `herstellerbestellung`, Positionen, `grund`, `abholung`, `gutschrift_erwartet_cent`, Status Offen/Abgeholt/Gutgeschrieben; Druckformat Rücklieferschein | Retoure | §3.4 |
| P21 | B | `PH Sortiment Einstellungen.kommission_format`; Senden-Dialog-Hinweis Kundendaten | DSGVO Datenminimierung | §4.2 Senden-Dialog |
| P22 | A | `PH Produkt Bild.freigabe` permlevel 1; `bilder_auswerten`: `erteilt` braucht `freigabe_beleg` oder Markenfreigabe (URL allein reicht nicht) | Urheberrecht, eigener Leitsatz | §2.9 (Konzept L3 bestätigt, verschärft) |
| P23 | A | `abweichung_bewerten`: Kommentar Pflicht bei `abgelehnt`; Positionssperre ab Gesendet (U7) | Nachvollziehbarkeit | §3.3 |
| P24 | B | `wareneingang_vorschlag()`; `idempotency_key` auf PH Wareneingang; `direktlieferung` + `lieferung_bestaetigen` | S3/Strecke ohne Fehlbuchung | §4.7 S3, §4.2 Strecke |

---

## 7. Änderungen am Konzepttext (Redaktion, damit Entwickler nicht falsch bauen)

1. Kopfzeile „Grundlage (gelesen)“: „30 DocType-JSONs“ → 34; Controller-Liste um `logik/kalkulation.py`, `logik/bestellung.py`, `logik/preislisten_format.py` ergänzen.
2. §1 Rechte-Hinweis und L1/B10 durch §1.3 dieser Kritik ersetzen.
3. §2.7 Positionstabelle: Spalten „EK netto¹“, „VK netto“, „Raum“, „Einheit“; Kopf „Währung · Kurs“; Band „Anzahlung Kunde“.
4. §3.1 Tab Preise: Bereiche „Verkauf (mit Stand)“, „Einkauf (Leitung)“, „Preismatrix“; Live-Zeile 30-Tage-Tiefstpreis; Knopf „VK aus EK vorschlagen“.
5. §3.3: neue Aktionen `termin_aendern`, `ab_nachfragen`, `abweichung_klaeren` mit Tasten; Tab „Lieferung“ mit Terminänderungs-Zeitleiste; Aktionen „Storno anfragen“, „Rest stornieren“.
6. §3.4: Primäraktion `schaden_melden` (Servicefall + Regress), Spalten Differenz/Unter-/Überlieferung; Entscheidung bei Überlieferung.
7. §4.2: Workflow-Tabelle um „Rest stornieren“ ergänzen und kennzeichnen, dass die Übergänge „Teillieferung buchen“ und „Lieferung buchen“ ohne Mengen in der UI **nie** angeboten werden (auch nicht der Leitung). Die einzige Ausnahme ist die Strecke über `lieferung_bestaetigen`.
8. §4.7 A11 Schritt 1: Felder `lieferant`, `format`, `preisbasis`*, `preisart` inkl. Einkaufspreis, `vk_vorschlag`; Schritt 2 = `vorschau` + `mapping_speichern`.
9. §5.2 neue Kennzahlen: „Wareneingänge ohne Rechnung (Wert)“, „Bestellungen ohne Lieferant“, „Storno angefragt“, „Vorkasse offen“.
10. §9.3 Lückenliste neu nummerieren auf Basis von §2 und §6 dieser Kritik. Als erledigt markieren: L1, L9 (teilweise), L10 (AB-Nachfrage), B10.

---

## 8. Ergänzende QA-Fälle (an §10 des Konzepts anhängen)

33. Preiszeile mit Preisart `Angebot` ohne Vorpreis in den letzten 30 Tagen: Warnung „Ermäßigung nicht bewerbbar“, API liefert `tiefstpreis_30_tage_cent = null`.
34. Mitarbeiter erfasst Preis mit „freigegeben“: Haken deaktiviert, Tooltip „Freigabe: Leitung“; über die API gesendet → Serverfehler, Preis bleibt unfreigegeben.
35. Variante mit Matrixpreis ohne Stand: Website zeigt „Preis auf Anfrage“ für diese Kombination.
36. Preisliste mit `preisbasis = brutto DE 19 %`, Preisart UVP: „Übernehmen“ gesperrt mit Text.
37. Bestellung CHF ohne Kurs: Senden gesperrt („Kurs fehlt“); Summen zeigen „CHF“, nie „€“.
38. Bestellung aus Auftrag mit offener Anzahlung: Mitarbeiter kann nicht senden; Leitung mit Grund → Kommentar in Zeitleiste.
39. Teilgeliefert 1/2, Leitung „Rest stornieren“: Bestellung Geliefert, Position 2 Storniert, Eingangsrechnungs-Soll = 1 Stück.
40. Löschen einer gesendeten Bestellung (Leitung): Menüpunkt fehlt; API-Aufruf → Serverfehler „Stornieren statt Löschen (Aufbewahrungspflicht)“.
41. Terminänderung bei Kunde ohne E-Mail: Aufgabe „Kunde anrufen“, Haken „Kunde informiert“ verlangt Kanal.
42. Wareneingang mit Mehrmenge 3 statt 2: Buchen verlangt Entscheidung annehmen/zurücksenden.
43. Zweite Buchung desselben Lieferscheins an einem zweiten Gerät: Fehler „schon gebucht als WE-…“, keine Doppelmenge.
44. Kategorie „Bücher“ mit `ust_klasse 10`: Kassa-Position zeigt 10 %, RKSV-Satzkennung Ermaessigt-1.
45. Ausstellungsstück mit `abverkauf = 1` ohne `zustand_text`: Speichern gesperrt.
