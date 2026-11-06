# 21 – Fachkritik Konzept Kassa · Fassung 2 (prüft `10-konzept-kassa.md` Fassung 2 gegen `ph_kassa`)

**Zweck:** Prüfung des Kassa-Konzepts aus Sicht Möbelhandel-Betrieb, österreichisches Recht (RKSV, BAO § 131/§ 132/§ 132a, UStG § 7/§ 11/§ 16/§ 19, FAGG, VGG/ABGB-Gewährleistung, GewO § 365m ff., DSGVO, ArbVG/GlBG) und Buchhaltungslogik; Abgleich jeder UI-Funktion mit DocType-Feldern und Server-Methoden in `Backend-Import/ph_kassa` (+ Querbezüge ph_shop, ph_faktura, ph_crm, ph_core, ph_kundenkarte). Ergebnis: Note, Pflichtänderungen mit DocType/Feld, Randfälle.
**Stand:** 2026-11-04 · Fassung 2 (ersetzt Fassung 1 von 05:52, die Fassung 1 des Konzepts prüfte) · Rolle: Fachkritiker + Frappe-Datenprüfer · Status: Prüfbericht, keine Inhaber-Entscheidung.
**Geprüft:** `10-konzept-kassa.md` Fassung 2 (1225 Zeilen, Stand 11:43) gegen: alle 14 DocType-JSONs von ph_kassa (Felder, Optionen, `read_only`, Rechte inkl. permlevel), `page/ph_kassa/ph_kassa.py` (25 Page-Methoden, Zeile für Zeile), `rksv/buchung.py` (`erzeuge_beleg`, `storniere_beleg`, `ROLLEN_STORNO`), `doctype/ph_kassenbeleg/ph_kassenbeleg.py` (`on_submit`-Nebenbuchungen), `doctype/ph_kassenabschluss/ph_kassenabschluss.py` (`before_insert`, `soll_berechnen`, `zaehlen`, `abschliessen`, `oeffnen`, `oeffnen_oder_holen`), `doctype/ph_kassenbuch/ph_kassenbuch.py` (`buchen`, `letzter_bestand`, `tagesbewegungen`), `ph_kassa_einstellungen.py` (`einstellungen()`-Vorgaben), `logik/{betraege,abschluss,regeln,retoure,codes}.py` (betraege/regeln/retoure/codes heute 11:48–11:50 geändert bzw. neu, noch nicht eingecheckt), `terminal.py`, `schnittstellen.py`, `druck/{bon,drucker}.py`, Print Format A4, Report „Kassenumsatz nach Steuersatz“, `auswertung.py`, `hooks.py`; `ph_faktura/ph_faktura/kassa.py::kassenbeleg_gebucht`, `PH Auftragsbestaetigung` (Felder `vertragsort`, `fagg_frist_ende`, `fagg_belehrung_beigelegt`), `ph_shop/gutschein.py` + `PH Gutschein.ausstellen`, `PH Kontakt`-JSON (ph_crm), `ph_core/api/bediener.py::verify_pin`, `ph_kundenkarte/api/__init__.py`.
**Nicht geprüft:** Gestaltung, Bewegung, Tastenbelegung (siehe `20-kritik-ux-kassa.md`).

---

## 0. Urteil in Kürze

| | |
|---|---|
| **Note** | **7 / 10** (Fassung 1: 6) |
| Stark | Alle 14 Pflichtänderungen der Fassung 1 sind aufgenommen und mit Fundstelle belegt (§0.2). Lückenliste §11 ist ehrlich; Mapping auf Felder und Methoden stimmt zu rund 85 %. Retoure-Assistent, Einzweck/Mehrzweck-Umschaltung, „Zahlung erhalten – Beleg offen“, Leitung übernimmt, Kassenkontrolle ohne Ranking sind fachlich richtig angelegt. |
| Schwach | (1) **Tagesabschluss rechnet falsch**, sobald Schritt 4 „Tresor-Entnahme“ genutzt wird, und der vorgeschlagene Anfangsbestand ist falsch (A1, A2). (2) **Drei Nebenbuchungen fehlen im Server**, die das Konzept als gegeben annimmt: Gutschein-Verkauf erzeugt keinen Gutschein, Shop-Bestellung wird nicht als bezahlt markiert, Storno erreicht Faktura nicht (D1–D3). (3) **Manipulationsweg Training**: jede Mitarbeiterin kann einen echten Verkauf als Trainingsbeleg buchen (R1). (4) Zwei Rechtsfehler im Konzept selbst: Retoure-Standard „als Gutschein“ auch bei Mangel/FAGG-Rücktritt (R3), harter 400-€-Stopp auch für Privatkunden (R2). (5) Mehrere Konzeptaussagen sind durch den heutigen Backend-Stand veraltet (§1). |
| Freigabe für den Bau | **Kiosk-Verkauf, Zahlmaske, Belege, Verwaltung lesen: ja.** Tagesabschluss, Retoure, Gutschein verkaufen, Bestellung kassieren, Storno von Anzahlungen: **erst mit P1–P12 (§6)**. |

Maßstab: 10 = jede UI-Funktion hat Feld und Methode, Recht und Buchhaltung stimmen, alle Randfälle definiert. Abzug je Stelle, die am ersten Tag falsche Zahlen an Steuerberater/Faktura liefert oder rechtlich angreifbar ist.

---

## 1. Konzeptaussagen, die der Code inzwischen widerlegt (Konzept nachziehen)

| # | Konzeptstelle | Konzept sagt | Code heute | Korrektur im Konzept |
|---|---|---|---|---|
| V1 | §3.8 Schritt 2 „Anfangsbestand“ | `oeffnen_oder_holen` legt `bargeld_anfang_cent = 0` an | `PH Kassenabschluss.before_insert`: `bargeld_anfang_cent = letzter_bestand(kasse)` (Kassenbuch-Bestand) – nicht 0, aber falsch (siehe A2) | Text ersetzen; Fehlerbild „Anfang negativ“ beschreiben |
| V2 | §3.3.1 Markierung „FAGG-Kennzeichen der AB (Feld fehlt in App ph_faktura)“, §11.1, §15 | Feld fehlt | `PH Auftragsbestaetigung.vertragsort` (Showroom/Beim Kunden/Fernabsatz), `fagg_frist_ende`, `fagg_belehrung_beigelegt` **vorhanden**; `logik/regeln.pruefe` erzeugt bereits den Hinweis bei `vertragsort = Beim Kunden` | Lücke streichen; `_auftraege` muss die drei Felder liefern (Lücke ph_kassa, nicht ph_faktura) |
| V3 | §3.6, §11.1 „Terminal-Rückerstattung fehlt“ | fehlt ganz | `terminal.py`: `erstatten(payment_intent_id, betrag_cent, grund, idempotency_key)` in Mock- **und** Stripe-Dienst vorhanden | Lücke präzisieren: fehlt nur Page-Methode `terminal_erstatten`, Aufruf aus Storno/Retoure, Feld `PH Kassenbeleg Zahlung.terminal_refund` |
| V4 | §2.6, §11.1 `code_erkennen` | fehlt | `logik/codes.erkennen(code)` vorhanden (Kundenkarte `KK-`, Gutschein `PH-XXXX-XXXX-XXXX-XXXX`, Bestellung `PH-S-…`, AB, RE, EAN mit Prüfziffer, Kassenbeleg, RKSV-QR `_R1-AT…`) | Lücke = nur whitelisted Wrapper. Scan-Tabelle §2.6 korrigieren: Bestellungen heißen `PH-S-…`, nicht `BE-…`; Gutschein-Muster aus `codes._GS` übernehmen |
| V5 | §3.1 Zeilenblatt, §11.1 „Rabattfelder fehlen“ | fehlen | `logik/betraege.rabatt_berechnen` + `position_berechnen` rechnen mit `listenpreis_cent`, `rabatt_promille`, `rabatt_cent`, `rabatt_grund`; **DocType `PH Kassenbeleg Position` hat diese Felder nicht** → Frappe verwirft sie beim Insert stumm | Lücke präzisieren: Logik da, Felder fehlen (P11). Übergang `zusatz` bleibt richtig |
| V6 | §3.5, §11.1 „Positionsart Retoure fehlt“ | fehlt | `POSITIONSARTEN` und `NEGATIVE_ARTEN` enthalten `Retoure`, `logik/retoure.py` liefert `ruecknehmbar`, `retoure_positionen`, `erstattungsweg_vorschlag`; **Select `PH Kassenbeleg Position.art` kennt `Retoure` nicht**, Feld `bezug_zeile` fehlt | Lücke = DocType + Page-Methode; Insert würde heute mit „Wert nicht erlaubt“ scheitern |
| V7 | §3.15 CHF „fehlt“ | fehlt | `betraege.fremd_in_eur`, CHF-Prüfung (5-Rappen-Schritte, nur Bar, Rückgeld EUR), `abschluss.soll_aus_belegen` zählt `chf_einnahmen_cent`; **keine Felder** in Zahlung/Einstellungen/Abschluss, `belege_des_tages` liest `fremdwaehrung` nicht | Lücke präzisieren (P12) |
| V8 | §3.15, §11.1 „Bar ab 10.000 €“, „Rechnung ab 400 €“, „Anzahlung ohne AB“, „Gutschein verkaufen + einlösen“ | Kiosk-Regeln | `logik/regeln.pruefe` setzt alle vier als Server-Regel um, **wird aber von `page.beleg_buchen` nicht aufgerufen** | Lücke = Verdrahtung `regeln.pruefe` in `beleg_vorschau`/`beleg_buchen`; Antwort `freigaben` steuert „Leitung übernimmt“ |
| V9 | §11.1 `tageswechsel_uhrzeit` | fehlt | `abschluss.geschaeftstag`, `abschluss.zeitraum` vorhanden; nicht verdrahtet (`belege_des_tages`, `belege_heute`, `_heute_umsatz` nutzen Kalendertag) | präzisieren |
| V10 | §11.2 „Schreibschutz nach Signatur: `kunde_name`, `zahlungsplan_position`, `kundenbeleg_email` nicht read-only, Mitarbeiter hat write“ | Lücke | Frappe verbietet Änderungen an submitted Dokumenten für Felder ohne `allow_on_submit` (keins der drei hat es). Nur Server-Code mit `db_set`/`db.set_value` ändert sie (`beleg_mailen`, `kassenbeleg_gebucht`) | Lücke streichen; stattdessen Lücke `bargeld_anfang_cent` (A3) |
| V11 | §3.4 „Mitarbeiter-Storno … wird es freigeschaltet“ | Anfrage | `logik/regeln.storno_freigabe(beleg, bediener, heute, leitung, grenze_cent)` vorhanden; `ROLLEN_STORNO` unverändert, Einstellung `storno_mitarbeiter_bis_cent` fehlt | präzisieren |

---

## 2. UI-Funktionen ohne Datenfeld oder Methode (neu gefunden)

| # | Konzeptstelle | UI verspricht | Befund im Code | Folge |
|---|---|---|---|---|
| D1 | §1.1 A6, §3.10 „Gutschein GS-… 50,00 € [Drucken] [Per E-Mail]“, §3.5 Retoure „Als Gutschein“ | Nach Verkauf existiert ein einlösbarer Gutschein mit Code | `PH Kassenbeleg.on_submit` bucht nur Zahlungen, Gutschein-**Einlösungen** und Faktura. Kein Aufruf von `ph_shop … PH Gutschein.ausstellen(wert_cent, kanal, art, idempotency_key, …)`. Position `Gutschein Verkauf` hat kein Rückfeld außer `gutschein` (Link, leer) | Kunde zahlt 50 €, erhält keinen Code. Retoure „als Gutschein“ erstattet ins Leere. **Blocker** für A6/A13 |
| D2 | §3.1 Offen-Chip „Bestellung PH-S-… abholbereit“, §5.4 „Packtisch sieht ‚bezahlt an Kassa 1‘“ | Bestellung wird an der Kassa bezahlt und übergeben | `on_submit` setzt nichts an `PH Bestellung`; `PH Zahlung` erhält Bezug `PH Kassenbeleg`, nicht die Bestellung. `_bestellungen` liefert keine Positionen und keinen Rechnungsstatus | Bestellung bleibt `zahlung_ausstehend`, Packtisch gibt nicht frei bzw. Shop mahnt. Hat ph_shop bereits eine Rechnung gestellt, wird der Umsatz an der Kassa ein zweites Mal erfasst (siehe R6) |
| D3 | §3.6 „Anzahlung – Zahlungsplan in Faktura prüfen“, §6.1 Storno | Storno einer Anzahlung/Zahlung auf Rechnung | `storniere_beleg` schreibt alle Positionen als Art `Storno`. `kassenbeleg_gebucht` prüft `arten & KASSA_ARTEN` → leer → kehrt sofort zurück; der Zweig „Stornobeleg“ wird nie erreicht | Zahlungsplan-Ist und Rechnungs-OP bleiben „bezahlt“, obwohl das Geld zurückging. AB kann zur Lieferung freigegeben werden ohne Anzahlung |
| D4 | §3.3.6 „Erneut buchen mit gleichem `idempotency_key`“, K10/K11 | keine Doppelbelege | `beleg_buchen` prüft den PaymentIntent nur auf `bezahlt` und Betrag, **nicht**, ob er schon an einem gebuchten Beleg hängt. `idempotency_key` wird nicht angenommen | Antwort geht verloren (Timeout), Kiosk bucht erneut → zweiter signierter Beleg mit derselben Kartenzahlung, doppelter Umsatzzähler |
| D5 | §2.2 „Sitzung je Bediener … jeder Beleg trägt `bediener = frappe.session.user`“, §3.11 „Leitung übernimmt … in der Sitzung der Leitung“ | PIN ⇒ Frappe-Sitzung dieses Menschen | `ph_core.api.bediener.verify_pin` liefert nur `{user, name, kurzname, roles, standort, geraet}`, **keine Sitzung/kein Token**. Ohne Passwort gibt es keinen Weg zur Frappe-Sitzung des Bedieners | Entweder laufen alle Belege unter einem technischen Benutzer (Bediener falsch, `ROLLEN_STORNO` prüft den falschen Menschen) oder das Fundament braucht eine Sitzungsmethode. **Blocker** für §2.2, §3.11, K16, K21 |
| D6 | §3.1 Offen-Chip „Teilrechnung … Steuersatz der Rechnung“ | Steuersatz aus Rechnung | `_rechnungen` liefert `rechnung, art, status, offen_cent, datum` – **keinen Steuersatz**; Mischrechnungen (20 % + 10 %) sind nicht abbildbar | Kiosk müsste raten → falsche Beträge je Satz im RKSV-Beleg |
| D7 | §3.4 Rechnungsempfänger-Schnellanlage, §8 A4 als Rechnung | Name/Anschrift/UID am Beleg | `PH Kassenbeleg` hat nur `kontakt` (Link) und `kunde_name`. Keine Momentaufnahme der Anschrift; A4-Format liest `PH Kontakt.titel` live. `PH Kontakt.quelle` kennt keinen Wert `kassa`/„Kassa“ (Optionen website/agent/telefon/showroom/…) | Nachdruck in 3 Jahren zeigt die neue Adresse → § 11-Rechnung nicht reproduzierbar. Schnellanlage „Herkunft Kassa“ hat kein Zielfeld (`showroom` nutzen) |
| D8 | §3.3.5 Überweisung „Kunde überweist später“ | offene Forderung | `on_submit` bucht für **jede** Zahlart `PH Zahlung` mit `status="Bezahlt"`, auch `Ueberweisung` | Buchhaltung und Abschluss zeigen Geld als eingegangen, das nicht da ist; keine OP, keine Mahnung, Laufkunde ohne Kontakt möglich |
| D9 | §3.10 Vorteil eingelöst, Storno/Retoure | Rücknahme des Vorteils | `ph_kundenkarte.api` hat `redeem_benefit`, aber kein Gegenstück | Storno/Retoure lässt den Vorteil verbraucht („limit_reached“ beim nächsten Kauf) |
| D10 | §3.7/§4.4 Kassenbuch-Grund-Chips „Porto“, „Kleinmaterial“ | Barausgabe | `PH Kassenbuch` hat keinen Anhang und keine Unterscheidung Geldtransit/Ausgabe/Privat | Ausgabe ohne Eingangsbeleg; Steuerberater kann nicht kontieren (siehe R8) |
| D11 | §3.13 Trainingsmodus „Leitung“, §2.3 „Mitarbeiter nicht: Trainingsmodus“ | nur Leitung | `page.trainingsmodus` prüft nur `_rollen()` (Mitarbeiter genügt); `page.beleg_buchen(trainings=1)` wird vom Client übernommen | siehe R1 |
| D12 | §3.8 „Ändern nur Leitung (mit Grund)“ | Anfangsbestand geschützt | `abschluss_zaehlen(bargeld_anfang_cent)` nimmt den Wert von jeder Kassa-Rolle; Feld `bargeld_anfang_cent` nicht `read_only`, Mitarbeiter hat `write` auf `PH Kassenabschluss` | Soll beliebig verschiebbar → Differenz verschwindet |
| D13 | §3.7 „Anfangsbestand nur ohne Eintrag heute“ | einmalig | `kassenbuch_buchen(art="Anfangsbestand")` ohne Prüfung; `GRUND_PFLICHT` enthält Anfangsbestand nicht | wiederholbare Bargeld-Einlage ohne Grund |

---

## 3. Fehler in der Kassenlogik des Konzepts (Abschluss, Bestand)

### A1 – Tresor-Entnahme in Schritt 4 verfälscht die Differenz

Ablauf laut Konzept: Zählen (Ist 1.100,12 €) → Differenz → **Entnahme 950,12 € per `kassenbuch_buchen`** → Abschließen.
Code: `abschliessen()` ruft `soll_berechnen()` erneut; `tagesbewegungen()` enthält die neue Entnahme → Soll sinkt um 950,12 €, Ist bleibt → **Differenz +950,12 €**, Grund wird Pflicht, Differenzbuchung +950,12 € im Kassenbuch. Nach dem Abschließen ist `kassenbuch_buchen` gesperrt („Kasse ist heute abgeschlossen“). Beide Reihenfolgen scheitern.

### A2 – Vorgeschlagener Anfangsbestand ist falsch

- Server: `letzter_bestand` kennt keine Bar-Einnahmen (P2 der Fassung 1 offen). Beispiel Tag 1: Anfangsbestand 150 €, Bar +1.240 €, Tresor −950 € → Kassenbuch-Bestand **−800 €** → Tag 2 startet mit Anfang −800 €.
- Konzept-Übergang §3.8 („Ist des letzten Abschlusses ± Kassenbuch seitdem“): die Tresor-Entnahme liegt **vor** `geschlossen_am` und wird nicht abgezogen → Anfang Tag 2 = 1.100,12 € statt 150 €.
- Konzept-Übergang §3.7/§7 „Bargeld in der Lade = `letzter_bestand` + Bar-Saldo seit Abschluss“: ab Tag 2 falsch, weil `letzter_bestand` den Fehler aller Vortage mitträgt.

### A3 – Wiederöffnen und erneutes Abschließen bucht die neue Differenz nicht

`abschliessen()` bucht nur `if self.differenz_cent and not self.differenz_buchung`. Nach `oeffnen()` bleibt `differenz_buchung` gesetzt → neue Zählung, alte Differenz im Kassenbuch. `oeffnen()` storniert die alte Buchung nicht.

### Soll-Ablauf (ersetzt §3.8 Schritt 2–6 und §3.7-Formel)

```
Schritt 1 Soll        Anfang = PH Kassenabschluss(Vortag).bargeld_ende_cent   (Quelle „Vortag“)
                      Soll   = Anfang + Bar-Ein − Bar-Aus + Einlagen − Entnahmen(tagsüber)
Schritt 2 Zählen      Ist    = Zählprotokoll (ganze Lade)
Schritt 3 Differenz   Differenz = Ist − Soll  (Grund ab Toleranz)
Schritt 4 Abschöpfen  tresor_entnahme_cent = Ist − Wechselgeld (Vorschlag: Anfang Vortag)
                      → wird NICHT vorher gebucht, sondern als Feld am Abschluss erfasst
Schritt 6 Abschließen Server, in einer Transaktion:
                      1. Kassenbuch „Differenz“ (idempotency diff:<name>:<version>)
                      2. Kassenbuch „Entnahme“ Zweck Geldtransit Tresor, kassenabschluss=<name>,
                         quelle=abschluss, zeitpunkt = geschlossen_am  (von tagesbewegungen ausgenommen)
                      3. bargeld_ende_cent = Ist − tresor_entnahme_cent
                      4. Sperre
Anzeige Lade tagsüber = bargeld_ende_cent(letzter Abschluss) + Bar-Saldo Belege seitdem
                        + Einlagen − Entnahmen seitdem          (bis P2 umgesetzt ist)
```

---

## 4. Verstöße gegen Recht oder Buchhaltungslogik

| # | Stelle | Norm | Problem | Behebung |
|---|---|---|---|---|
| R1 | `page.beleg_buchen(trainings)`, `page.trainingsmodus` | RKSV § 9 (Umsatzzähler), BAO § 131b, § 163 BAO (Ordnungsmäßigkeit) | Trainingsbelege erhöhen den Umsatzzähler nicht und fehlen im Umsatz. Jede Mitarbeiterin kann (a) einen einzelnen Bon mit `trainings=1` senden, (b) die Kasse in Training schalten. Das ist der klassische Prüfungsbefund „Umsatzverkürzung über Trainingsbuchungen“. | Server ignoriert `trainings` vom Client; Training nur über `PH Kasse.trainings_modus`, Umschalten nur Leitung, je Umschaltung `PH Kassa Ereignis` (neue Art `Trainingsmodus ein/aus`, Grund Pflicht). Konzept §3.13 + K-Kriterium „Mitarbeiter kann Training nicht schalten (Server)“ |
| R2 | §0.1, §3.4, K15, §15 Inhaber (7) „harter Stopp ab 400 €“; `regeln.pruefe` (Fehler bei > 400 € ohne Empfänger) | UStG § 11 Abs 1 Z 1, Z 2 lit a; BAO § 132a | Rechnungspflicht besteht gegenüber **Unternehmern/juristischen Personen** und bei Grundstücksleistungen an Private; ein Privatkunde, der bar ein Sofa kauft, braucht keine § 11-Rechnung – der RKSV-Beleg genügt. Pflichtschritt für alle sperrt Laufkundschaft und erzeugt unnötige Personendaten (DSGVO Art 5 lit c). | Ab Grenze (Vergleich **> 400,00 €**, nicht ≥ – § 11 Abs 6: „nicht übersteigt“) eine Frage statt Pflicht: „Rechnung auf eine Firma?“ [Nein, Privatkauf] (Primär) [Ja – Empfänger erfassen]. Bei „Ja“ Pflichtfelder Name, Anschrift, ab 10.000 € UID. `regeln.pruefe`: Fehler nur, wenn `empfaenger.ist_unternehmer` oder `rechnung_gewuenscht` |
| R3 | §3.5 Retoure Schritt 4 „Standard ‚Als Gutschein‘“ für alle Gründe | ABGB § 932 / VGG § 12–15 (Gewährleistung), FAGG § 14 Abs 3 | Bei Mangel (Preisminderung/Rückabwicklung) und bei Rücktritt nach FAGG hat der Kunde Anspruch auf **Geld**, bei FAGG mit **demselben Zahlungsmittel** (abweichend nur mit ausdrücklicher Zustimmung). Gutschein als Standard ist nur bei Kulanz/Umtausch zulässig. | Standard je Grund: Umtausch/Kulanz → Gutschein; Mangel → Original-Zahlungsweg (Vorschlag aus `retoure.erstattungsweg_vorschlag`); Rücktritt FAGG → Original-Zahlungsweg, Gutschein nur mit Haken „Kunde wünscht ausdrücklich Gutschein“ (gespeichert in `zusatz`). „Bar nur Leitung“ gilt nicht, wenn das Original bar bezahlt wurde und Grund Mangel/FAGG ist (Freigabe-Code `retoure_bar` dann nicht setzen) |
| R4 | §4.10 UVA-Abgrenzung, Report „Kassenumsatz nach Steuersatz“ | UStG § 19, § 16 | (a) Storno-Positionen tragen Art `Storno` → die geplante Zeile „Zahlung auf Rechnung (kein Umsatz)“ kann die Stornos dieser Zahlungen nicht zuordnen; dasselbe für Anzahlungen und Gutscheinverkäufe in `soll_aus_belegen` und den Reports. (b) Mehrzweck-Gutscheinverkauf steht als Umsatz „Null 0“ in der Zuarbeit – er ist **kein** Umsatz (gehört nicht in die UVA, auch nicht als 0 %). (c) Anzahlung an der Kassa **und** Anzahlungsrechnung in Faktura: Abgrenzung nur für Zahlung auf Rechnung erwähnt, nicht für Anzahlungen mit Anzahlungsrechnung | Feld `PH Kassenbeleg Position.ursprung_art` (Select wie `art`, read_only) im Stornobeleg; Report gruppiert nach `ursprung_art or art`. Report-Zeilen: „Umsatz“, „Anzahlungen (Istversteuerung)“, „Zahlung auf Rechnung – kein Umsatz“, „Mehrzweck-Gutschein – kein Umsatz“. Fußnote: Anzahlungen mit Anzahlungsrechnung nur einmal melden (Quelle mit Steuerberater festlegen) |
| R5 | §3.3.5 Überweisung im Kassenbeleg | BAO § 131, Forderungsbuchhaltung | Ware geht mit offener Forderung, PH Zahlung „Bezahlt“ (D8); bei Laufkunde kein Schuldner | Überweisung nur mit Kontakt; Beleg erzeugt OP in Faktura (Anfrage ph_faktura: `forderung_aus_kassenbeleg`), PH Zahlung `status = "Offen"`. Kiosk-Text: „Kunde überweist bis <Datum> – offene Forderung“. Steuerberater-Freigabe bleibt |
| R6 | §3.1 Chip Bestellung „Positionen der Bestellung“ | UStG § 11, § 19 | Wurde die Shop-Bestellung bereits fakturiert (ph_shop Rechnung), ist die Kassa-Zahlung **Zahlungseingang**, nicht neuer Umsatz. Neuverkauf der Positionen = doppelter Umsatz | Bestellung mit Rechnung → Position `Schlusszahlung` mit `rechnung`; ohne Rechnung → Positionen, danach Bestellung bezahlt (D2) |
| R7 | §3.15 Bar ab 10.000 € | GewO § 365m1 ff. (Handelsgewerbe, Barzahlung ≥ 10.000 €, auch bei mehreren zusammenhängenden Zahlungen); EU-Verordnung 2024/1624 (Bargeldobergrenze 10.000 € ab 10.07.2027) | `regeln.pruefe` prüft je Beleg. Anzahlung 6.000 € bar + Schlusszahlung 5.000 € bar auf dieselbe AB umgehen die Prüfung. Ab Juli 2027 ist Barzahlung ab 10.000 € unzulässig, nicht nur prüfpflichtig | Summe Bar je `auftrag`/`rechnung` über alle Belege; Konzept §3.15: ab 2027-07-10 harter Stopp (Datum als Einstellung, Steuerberater bestätigt) |
| R8 | §3.7 Entnahme „Porto/Kleinmaterial/Bankeinzahlung/Tresor“ | BAO § 132 (Belegaufbewahrung), UStG § 12 (Vorsteuer nur mit Rechnung) | Barausgaben brauchen einen Eingangsbeleg; Geldtransit (Bank/Tresor) und Privatentnahme sind keine Ausgaben. Kassenbuch kann das nicht unterscheiden | `PH Kassenbuch.zweck` (Select: Geldtransit Bank · Geldtransit Tresor · Ausgabe · Privatentnahme · Wechselgeld), `PH Kassenbuch.anhang` (Attach, Pflicht bei Ausgabe), `ust_satz` (Select, bei Ausgabe). Grund-Chips im Kiosk auf `zweck` abbilden; Ausgabe ohne Foto → Aufgabe an Leitung |
| R9 | §3.7 „Entnahme > Lade-Bestand: Warnung, kein Stopp“ | BAO § 131 Abs 1 (Kassensturzfähigkeit) | Negativer Kassenbestand ist ein formeller Mangel (deutet auf nicht erfasste Einnahmen) | Nach P2: Stopp mit „Leitung übernimmt“; bis P2 Warnung, weil der angezeigte Bestand falsch ist |
| R10 | §9 Kundendisplay „Guten Tag, Frau Muster“ | DSGVO Art 5 lit c, GlBG-Grundsatz der Gleichbehandlung beim Zugang zu Dienstleistungen | Name am Kundendisplay ist für Wartende lesbar; Anrede Frau/Herr setzt Geschlecht voraus | Standard ohne Namen; wenn Inhaber Namen will: nur Vorname oder „Guten Tag“ + Nachname ohne Anrede, Einstellung `kundendisplay_anrede` (Select: aus · Vorname · Name) |
| R11 | §3.6 Grund-Chip „Kundenwunsch“ beim Storno | RKSV (Storno = Korrektur), UStG § 16 | „Kundenwunsch“ nach dem Kauf ist eine Rücknahme (Entgeltsminderung), keine Fehlbuchung; vermischt Storno- und Retourestatistik | Storno-Chips: Fehlbuchung · Falscher Preis · Doppelt · Falsche Zahlart · Sonstiges. „Kunde will zurückgeben“ → Hinweis + Taste „Zurücknehmen (Retoure)“ |
| R12 | Ausfuhr / Tax Free (Lochau, Kundschaft aus CH) | UStG § 7 (Ausfuhrlieferung, Touristenexport mit Wertgrenze und Formular U 34) | Fehlt im Konzept. Schweizer Kunden fragen bei Accessoires nach Mehrwertsteuer-Rückvergütung | Kassa bucht normal mit 20 %; Taste „Ausfuhrbeleg (U 34)“ auf der Ergebnis-Karte erzeugt das Formular mit Belegnummer (Druckroute `/druck/ausfuhr/[beleg]`), Rückerstattung nach Bestätigung über Retoure-Weg „Steuerrückerstattung“ (Position `Retoure` nur USt-Anteil, Steuersatz der Ware). Wertgrenze und Ablauf vom Steuerberater bestätigen lassen; bis dahin Hilfe-Panel-Text |
| R13 | Lieferung ins EU-Ausland an Private (Lindau, Allgäu) | UStG Binnenmarktregelung Art 3 (Fernverkauf, OSS) | Lieferung durch Platzhirsch nach DE an Private kann deutsche USt auslösen; `Besonders 19` ist der österreichische Sondersatz (Jungholz/Mittelberg), **nicht** DE 19 % | Kassa verkauft nur mit Abholung/Inlandslieferung; Lieferung ins Ausland → Hinweis „über Auftrag in Faktura“. Kiosk sperrt Schnelltaste „Lieferpauschale“ nicht, aber Hilfe-Text; `Besonders 19` im Kiosk ausblenden |

---

## 5. Randfälle – Soll-Verhalten (Kiosk + Server, nur fehlende oder falsche)

| Randfall | Konzept Fassung 2 | Soll |
|---|---|---|
| **Storno Gutschein-Verkauf** | nicht genannt | Gutschein sperren (`PH Gutschein.sperren("storniert")`), nur wenn Restwert = Wert; teilweise eingelöst → Storno gesperrt mit Text „Gutschein bereits teilweise eingelöst – Retoure statt Storno“ |
| **Storno Beleg mit Kundenkarten-Vorteil** | nicht genannt | `revoke_benefit(einloesung)` (fehlt in ph_kundenkarte, D9); bis dahin Hinweis „Vorteil bleibt verbraucht – Leitung“ |
| **Storno Anzahlung** | „Zahlungsplan in Faktura prüfen“ | Pflicht: `ursprung_art` (R4) + `kassenbeleg_gebucht` bucht negative Beträge zurück (D3). Bis dahin: Storno von Belegen mit Anzahlung/Zahlung auf Rechnung **gesperrt** mit Text „Über Faktura stornieren“ |
| **Storno eines Retoure-Belegs** | nicht genannt | erlaubt (Fehlbuchung); Retoure-Mengen werden wieder rücknehmbar (`ruecknehmbar` muss stornierte Retouren ausschließen – heute liest es nur `bisherige_retouren`) |
| **Storno mit Terminal-Anteil, Teil-Refund schlägt fehl** | Storno gesperrt | nach P5: Refund vor Belegerzeugung anstoßen; schlägt er fehl → kein Stornobeleg, Fehlertext; gelingt Refund, scheitert Beleg → Zustand „Erstattet – Beleg offen“ analog §3.3.6 |
| **Teilretoure 1 von 3 mit Rabatt** | Assistent | Einzelpreis = bezahlter Preis nach Rabatt (`retoure_positionen` nutzt `einzel_brutto_cent` der Zeile – richtig); Bon-Rabatt (auf Summe) muss anteilig verteilt sein → Bon-Rabatt nur als Zeilenrabatt speichern |
| **Retoure eines Beleges von vor dem Jahreswechsel/Steuersatzwechsel** | nicht genannt | Steuersatz der Originalzeile (so `retoure_positionen`) – richtig; Hinweis im Assistenten, wenn Original > 12 Monate |
| **Retoure Ware aus Shop-Bestellung (Fernabsatz)** | nicht genannt | Grund „Rücktritt (FAGG)“ vorbelegen, Frist aus Bestellung; Original-Zahlungsweg (R3), Erstattung über ph_shop (Stripe), nicht Kassa-Bar |
| **Retoure ohne Beleg** | „nur Leitung, Freitext-Retoure“ | zusätzlich Preis-Nachweis (Listenpreis aus PH Produkt), nur Gutschein, nie Bar (Missbrauchsschutz) |
| **Teillieferung** (Küche: Korpus jetzt, Fronten später) | Chip „Teilrechnung 2 von 3“ | `_rechnungen` muss `art`, Steuersatzaufteilung (D6) und Bezug AB liefern; Kassa bucht `Teilzahlung` mit `rechnung`; Abholung einer Teilmenge an der Kassa ohne Rechnung → nicht an der Kassa, sondern Packtisch/Faktura |
| **Anzahlung auf AB mit gemischten Steuersätzen** | `_auftrag_steuersatz` → Rückfall `steuersatz_anzahlung` | Anzahlung anteilig je Satz aufteilen (zwei Positionen `Anzahlung`, Verhältnis der AB-Nettowerte); sonst falsche USt in der Anzahlung |
| **Anzahlung zurückzahlen** (AB storniert, FAGG-Rücktritt) | „Anzahlungen über Faktura klären“ | Kassa braucht Position `Anzahlung` negativ (Rückzahlung, Art `Anzahlung Rueckzahlung` in Select + `NEGATIVE_ARTEN`), Bezug `auftrag`, Freigabe Leitung; Faktura bucht Zahlungsplan zurück |
| **Anzahlung bar ≥ 10.000 € über mehrere Belege** | je Beleg | R7 |
| **CHF bar** | „keine CHF-Annahme bis Entscheidung“ | wenn Inhaber ja sagt: Felder P12; Bon zeigt „gegeben CHF 100,00 · Kurs 1 CHF = x,xxxx € · Euro-Gegenwert … · Rückgeld in Euro“; Kassenbuch zweiter Bestand (`waehrung = CHF`, `letzter_bestand(kasse, waehrung)`); Bankeinzahlung CHF bucht Kursdifferenz (Kassenbuch-Art `Kursdifferenz`, neu); Zählprotokoll zweiter Reiter CHF (Stückelung 1000/200/100/50/20/10 Fr., 5/2/1 Fr., 50/20/10/5 Rp.); Kurs nur von Leitung, mit Datum, älter als 1 Tag → Kiosk sperrt CHF |
| **CHF-Rückgeld verlangt** | – | verboten (`fremd_in_eur` lehnt negative ab) – Text „Rückgeld nur in Euro“ |
| **Kunde ohne E-Mail** | kein Haken | richtig. Zusätzlich: Retoure „Als Gutschein“ → Gutschein drucken Pflicht (kein Versand möglich); Rechnung auf Firma ohne E-Mail → A4 drucken automatisch |
| **Kunde ohne Kontakt, zahlt per Überweisung** | erlaubt | verboten (R5) |
| **Kunde ohne Kontakt, Retoure bar > Grenze** | – | Kontakt oder Name + Unterschrift auf Retourebeleg (Missbrauchsschutz, kein Gesetz) – Inhaber-Entscheidung |
| **Gleiche Kartenzahlung zweimal gebucht** | Tastensperre | D4: Server lehnt Intent ab, der an `PH Kassenbeleg Zahlung` (docstatus 1) hängt, und liefert den vorhandenen Beleg |
| **Abschluss wieder geöffnet, neu gezählt** | „Öffnen“ | A3 |
| **Tresor-Abschöpfung tagsüber** (Lade über Versicherungsgrenze) | Entnahme „Tresor“ | zulässig als Entnahme `zweck = Geldtransit Tresor`; zählt ins Soll (richtig) |
| **Bedienerwechsel mitten im Bon mit laufendem Terminal** | Wechsel parkt Bon | Wechsel gesperrt, solange Terminal wartet oder Zustand §3.3.6 („Zuerst Zahlung abschließen“) |
| **Zwei Abschlüsse am selben Tag** (Schichtwechsel) | nicht genannt | `validate` erlaubt nach `Abgeschlossen` einen neuen Abschluss? Nein: `ist_gesperrt` sperrt den Tag. Kassensturz bei Schichtwechsel = Zählung ohne Abschluss: Kiosk-Funktion „Zwischenzählung“ (nur Protokoll, `PH Kassenabschluss` mit `art = Zwischenzaehlung`, ohne Sperre) – Anfrage |

---

## 6. Pflichtänderungen (konkret, DocType/Feld/Methode)

Reihenfolge = Dringlichkeit. **P1–P12 vor Bau** der genannten Kiosk-Teile, P13–P20 vor Produktivbetrieb. „K“ = Konzept ändern, „S“ = Server (App in Klammern).

| # | Änderung | Wo | Genau |
|---|---|---|---|
| **P1** | Abschluss-Ablauf mit Abschöpfung | K §3.8 + S ph_kassa | Felder `PH Kassenabschluss.tresor_entnahme_cent` (Int), `bargeld_ende_cent` (Int, RO), `anfang_quelle` (Select Vortag/Ersteinrichtung/Leitung, RO), `anfang_grund` (Small Text). `abschliessen(…, tresor_entnahme_cent)` bucht nach der Differenz eine `Entnahme` mit `kassenabschluss`, `quelle="abschluss"`; `tagesbewegungen()` filtert `quelle != "abschluss"`. Konzept-Schritt 4 bucht nichts mehr selbst. Ablauf §3 dieses Berichts |
| **P2** | Anfangsbestand aus `bargeld_ende_cent` | S ph_kassa `before_insert` | `bargeld_anfang_cent = bargeld_ende_cent` des letzten Abschlusses (Abgeschlossen/Korrigiert) derselben Kasse + Kassenbuch `Anfangsbestand`/`Einlage`/`Entnahme` zwischen `geschlossen_am` und Eröffnung; `logik.abschluss.anfangsbestand` liefert bereits Hinweis bei Abweichung. Konzept §3.7/§7-Formel ersetzen (§3) |
| **P3** | Bar-Belege ins Kassenbuch (offen aus Fassung 1) | S ph_kassa `on_submit` | je Beleg mit Bar-Anteil `buchen(kasse, "Bareinnahme"/"Barausgabe", abs(bar), quelle="beleg", beleg=name, idempotency_key=f"beleg:{name}")`; Trainings aus; `tagesbewegungen` ignoriert `quelle="beleg"` |
| **P4** | Wiederöffnen storniert Differenz | S ph_kassa `oeffnen()` | `PH Kassenbuch.stornieren` der `differenz_buchung` und der Abschöpfungs-Entnahme, Felder leeren; Idempotenz-Schlüssel mit Zähler `diff:<name>:<n>` |
| **P5** | Training nicht vom Client | S ph_kassa `page.beleg_buchen`, `page.trainingsmodus` | Parameter `trainings` entfernen; `trainingsmodus` → `_rollen(leitung=True)`, Grund Pflicht, `PH Kassa Ereignis.art` + `Trainingsmodus ein`/`Trainingsmodus aus` |
| **P6** | Gutschein-Verkauf erzeugt Gutschein | S ph_kassa `on_submit` + ph_shop | je Position `Gutschein Verkauf`: `PH Gutschein.ausstellen(wert_cent, kanal="Showroom", art=gutschein_art, kaeufer=kontakt, idempotency_key=f"kassa:{beleg}:{idx}")`, Rückschreiben in `Position.gutschein`; Antwort `beleg_buchen.gutscheine = [{name, code, wert_cent}]` für die Ergebnis-Karte. Stornobeleg: `sperren("storniert")` (§5) |
| **P7** | Storno behält Ursprung | S ph_kassa + ph_faktura | Feld `PH Kassenbeleg Position.ursprung_art` (Select = `art`-Optionen, RO), gesetzt in `storniere_beleg`; `kassenbeleg_gebucht` wertet `ursprung_art` und negative Beträge aus (Zahlungsplan `bezahlt_cent −`, Rechnungs-OP Gegenzeile). Bis dahin K: Storno mit Anzahlung/Zahlung auf Rechnung gesperrt |
| **P8** | Kartenzahlung nur einmal | S ph_kassa `page.beleg_buchen` | Parameter `idempotency_key` (offen aus Fassung 1) **und** Prüfung `frappe.db.exists("PH Kassenbeleg Zahlung", {"terminal_payment_intent": pi, "docstatus": 1})` → vorhandenen Beleg zurückgeben |
| **P9** | Bediener-Sitzung nach PIN | S ph_core + Fundament | `ph_core.api.bediener.sitzung_mit_pin(email, pin, geraet_token)` → kurzlebige Frappe-Sitzung (sid) des Bedieners, nur für Gerät mit `arbeitsplatz = kassa`; „Leitung übernimmt“ nutzt dieselbe Methode mit Ablauf 60 s. Konzept §2.2/§3.11 auf diese Methode umstellen. Ohne P9 sind K16/K21 nicht prüfbar |
| **P10** | 400-€-Regel als Frage, Momentaufnahme der Anschrift | K §3.4, K15 + S ph_kassa | Vergleich `> barverkauf_rechnung_ab_cent`; Dialog „Rechnung auf eine Firma?“ (R2). Felder `PH Kassenbeleg.rechnung_gewuenscht` (Check), `empfaenger_name` (Data), `empfaenger_anschrift` (Small Text), `empfaenger_uid` (Data), alle RO, gesetzt in `erzeuge_beleg` aus Kontakt oder Schnellanlage; A4-Format liest diese Felder statt `PH Kontakt.titel`. `regeln.pruefe` nur bei `rechnung_gewuenscht` |
| **P11** | Felder für vorhandene Logik | S ph_kassa DocType-JSON | `PH Kassenbeleg Position`: Select `art` + `Retoure`, `Anzahlung Rueckzahlung`; Felder `bezug_zeile` (Data), `listenpreis_cent`, `rabatt_promille`, `rabatt_cent`, `rabatt_gesamt_cent` (Int), `rabatt_grund` (Data). `PH Kassa Einstellungen`: `storno_mitarbeiter_bis_cent`, `rabatt_freigabe_ab_promille`, `retoure_bar_nur_leitung` (Check), `uid_empfaenger_ab_cent`, `bar_identitaet_ab_cent`, `tageswechsel_uhrzeit` (Time). `regeln.pruefe` in `beleg_vorschau`/`beleg_buchen` aufrufen, `freigaben` in die Antwort |
| **P12** | Retoure rechtskonform | K §3.5 | Auszahlungs-Standard je Grund (R3); Grund-Chips bestimmen Weg; „Rücktritt (FAGG)“ nur mit Frist-Prüfung (`fagg_frist_ende` aus AB, `vertragsort`); Page-Methoden `retoure_laden(beleg)` (→ `retoure.ruecknehmbar`), `retoure_buchen(beleg, auswahl, grund, auszahlung)`; Terminal-Refund über `terminal.erstatten` + Feld `PH Kassenbeleg Zahlung.terminal_refund` |
| P13 | Bestellung kassieren | S ph_kassa + ph_shop | `on_submit`: bei `bestellung` → `ph_shop.bestellung.zahlung_erhalten(bestellung, kassenbeleg, betrag_cent)`; `_bestellungen` liefert `rechnung` und Positionen; mit Rechnung → `Schlusszahlung` (R6) |
| P14 | Überweisung als Forderung | S ph_kassa + ph_faktura | `PH Zahlung.status = "Offen"` für `Ueberweisung`; Kontakt Pflicht; OP in Faktura (R5) |
| P15 | Kassenbuch-Zweck und Anhang | S ph_kassa | `PH Kassenbuch.zweck`, `anhang`, `ust_satz` (R8); Grund-Chips im Kiosk K §3.7 auf `zweck` |
| P16 | Rechte nachziehen | S ph_kassa | `PH Kassenabschluss.bargeld_anfang_cent` RO; `abschluss_zaehlen(bargeld_anfang_cent)` nur Leitung; `kassenbuch_buchen("Anfangsbestand")` nur ohne bisherige Buchung der Kasse oder Leitung, Grund Pflicht |
| P17 | UVA-Report umbauen | S ph_kassa Report | Zeilen nach R4; Gruppierung `ursprung_art or art` |
| P18 | Steuersatz der Rechnung/Anzahlung | S ph_kassa + ph_faktura | `_rechnungen` → `je_satz: [{steuersatz, offen_cent}]`; `_auftraege` → Aufteilung je Satz + `vertragsort`, `fagg_frist_ende`, Zahlungsplan-Zeilen |
| P19 | Bar ≥ 10.000 € je Vorgang | S ph_kassa `regeln.pruefe` | Summe Bar aller Belege mit gleichem `auftrag`/`rechnung` + aktueller Beleg; Einstellung `bar_obergrenze_ab` (Date) für 2027 (R7) |
| P20 | Kundenkarten-Vorteil zurücknehmen | S ph_kundenkarte | `revoke_benefit(einloesung, grund)`; Aufruf bei Storno/Retoure des Bezugsbelegs |

---

## 7. Daten- und Rechteprüfung (Kleinbefunde)

| Befund | Stelle | Empfehlung |
|---|---|---|
| `PH Kassenbeleg` hat permlevel-1-Leserechte für Leitung/GF/Buchhaltung, aber kein Feld mit `permlevel: 1` | `ph_kassenbeleg.json` | Entweder `bediener` und `umsatzzaehler_klar_cent` auf permlevel 1 (Datenminimierung gegenüber Mitarbeitern) oder Zeilen entfernen |
| `umsatzzaehler_klar_cent` ist für `PH Kassa Mitarbeiter` lesbar | dito | permlevel 1 (der Klartext-Zähler ist Prüfwissen, nicht Kassierwissen) |
| `Number Card „Heute kassiert“` und `_heute_umsatz` zählen `Ueberweisung` mit | `fixtures/number_card.json`, Page | Titel bleibt „kassiert“, Wert ohne Überweisung; Überweisung als Nebenwert „+ 1 Überweisung offen“ |
| `belege_heute`, `belege_des_tages`, `_heute_umsatz` filtern Kalendertag | Page, Abschluss | `logik.abschluss.zeitraum(datum, tageswechsel_uhrzeit)` nutzen |
| `belege_des_tages` liest aus `PH Kassenbeleg Zahlung` nur `zahlart, betrag_cent` | Abschluss | `fremdwaehrung`, `fremd_gegeben_cent`, `retour_cent` mitlesen, sobald P12-Felder da sind; sonst bleibt `chf_einnahmen_cent` immer 0 |
| `drucker.beleg_dict` setzt `bediener_name = User.full_name` (offen aus Fassung 1) | `druck/drucker.py` Z. 47 | `ph_core_kurzname`, Rückfall Vorname |
| `PH Kontakt.quelle` ohne Wert „Kassa“ | ph_crm | Schnellanlage mit `quelle = showroom` + `notizen` „angelegt an Kassa 1“; oder Option ergänzen (Anfrage ph_crm) |
| `Kassenbuch.waehrung` existiert, `letzter_bestand` ignoriert sie | `ph_kassenbuch.py` | `letzter_bestand(kasse, waehrung="EUR")` |
| `storniere_beleg` übernimmt `kunde_name`, `kontakt`, aber nicht `ph_kundenkarte_kartennummer` | `rksv/buchung.py` | mitgeben, damit Stufen-Umsatz der Kundenkarte korrigiert wird |
| `PH Kassenbeleg Position.zusatz` ist `Data` (140 Zeichen) | JSON | reicht für Rabatt-Übergang mit Listenpreis knapp; nach P11 nur noch Freitext |
| `PH Kassenabschluss_Zaehlung` ohne Währung | JSON | Feld `waehrung` (Link Currency, Standard EUR) für CHF-Zählung |

---

## 8. Was das Konzept richtig macht (nicht verwässern)

- Storno nur als Gegenbeleg, Leitung per PIN, Grund Pflicht, Rückzahlungsweg je Zahlart sichtbar, Terminal-Storno gesperrt bis Refund.
- Einzweck/Mehrzweck als zwei Pfade mit Server-Regel (deckt sich mit `regeln.pruefe`).
- „Zahlung erhalten – Beleg offen“ als gesperrter Zustand; Erkennung beim Neustart über `PH Terminal.letzte_zahlung_*`.
- Notbetrieb erst nach Steuerberater-Freigabe, Nacherfassung einzeln, Ereignis `Kasse Ausfall Beginn/Ende`.
- Kassenkontrolle je Bediener ohne Chart und Ranking, Zweckzeile, nur Leitung/GF.
- E-Mail „nur für diesen Beleg“, keine Newsletter-Einwilligung an der Kassa.
- Tag ohne Umsatz ohne Abschlusszwang; SEE-Ausfall-Eskalation 48 h.

---

## 9. Anfragen aus dieser Kritik

| An | Punkte |
|---|---|
| **ph_kassa** | P1–P8, P10–P12, P14–P17, P19 · Felder §6 · Wrapper `code_erkennen` (V4), `terminal_erstatten` (V3) · `regeln.pruefe` verdrahten (V8) · `ursprung_art` · Kartennummer im Stornobeleg · permlevel-Bereinigung · Report Zahlung auf Rechnung |
| **ph_core** | P9 Sitzung nach PIN (Bediener und „Leitung übernimmt“) |
| **ph_faktura** | P7 Rückbuchung Stornobeleg · P14 Forderung aus Kassenbeleg · P18 Steuersatz je Rechnung, Anzahlung je Satz, Zahlungsplan-Zeilen · Rückgabe Anzahlungsrechnung (offen aus Fassung 1) |
| **ph_shop** | P6 Gutschein ausstellen aus Kassa (Signatur `ausstellen` bestätigen, Kanal-Wert „Showroom“ oder neu „Kassa“) · P13 `zahlung_erhalten` für Bestellungen · Gutschein sperren bei Storno |
| **ph_crm** | Option `quelle = kassa` oder Festlegung `showroom` · Anonymisierungs-Hook (offen aus Fassung 1) |
| **ph_kundenkarte** | P20 `revoke_benefit` |
| **Steuerberater (über Inhaber)** | Abgrenzung Anzahlungen Kassa ↔ Anzahlungsrechnungen in der UVA · Mehrzweck-Gutschein nicht in der UVA · Überweisung im Kassenbeleg als Forderung · Ausfuhr/U 34 an der Kassa · Bargeldgrenze 2027 · CHF-Kursquelle und Kursdifferenzen |
| **Inhaber** | 400-€-Frage statt Stopp (R2) · Retoure-Standard je Grund (R3) · Training nur Leitung (R1) · Kundendisplay ohne Namen (R10) · CHF ja/nein · Retoure ohne Beleg nur als Gutschein |
| **Konzept 10** | §1 V1–V11 nachziehen · §3 Abschluss-Ablauf · §4 R2, R3, R5, R10, R11 · §5 Randfälle übernehmen · K-Kriterien ergänzen: „Abschöpfung ändert Differenz nicht“, „Wiederöffnen + Neuzählung bucht neue Differenz“, „Mitarbeiter kann Training weder schalten noch senden“, „gleicher PaymentIntent erzeugt keinen zweiten Beleg“, „Gutschein-Verkauf liefert Code“, „Storno Anzahlung ändert Zahlungsplan“ |

*Ende 21 – Fachkritik Kassa, Fassung 2.*
