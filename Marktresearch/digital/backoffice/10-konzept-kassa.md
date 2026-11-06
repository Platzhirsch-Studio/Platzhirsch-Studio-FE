# 10 – Konzept Bereich „Kassa“ (Kiosk-Registrierkasse RKSV + Verwaltung) · Fassung 3 (final, mit Bauauftrag)

**Zweck:** Verbindliches Funktions- und Oberflächenkonzept für den Bereich Kassa des Next-Backoffice (`backoffice/`, Port 3100): Arbeitsplatz **Kassa** (Kiosk, Vollbild, iPad/Touch-Monitor, Scanner, Bondrucker, Stripe Terminal) und **Kassa-Verwaltung** (Backoffice-Shell) – plus Bauauftrag (§16) für den Kassa-Agenten. Seiten, Komponenten, Felder, Zustände, Fokusmodell, Tastenkürzel, Fehler- und Leerzustände, Bewegung, Datenmapping auf `ph_kassa`, Akzeptanzkriterien.
**Stand:** 2026-11-04 · Fassung 3 (ersetzt Fassung 2 von 11:43) · Rolle: Produktdesigner (Überarbeitung) · Status: finale Fassung zur Umsetzung. Punkte mit „Inhaber“/„StB“ bleiben offen und sind im Bau als Schalter bzw. gesperrte Fähigkeit vorgesehen (§0.4).
**Eingearbeitet:** alle Pflichtänderungen aus `20-kritik-ux-kassa.md` (P1-01 bis P1-25, P2-01 bis P2-15, Wireframes §4, QA K31–K43, Konsistenz K-01 bis K-11) und `21-kritik-fach-kassa.md` (V1–V11, D1–D13, A1–A3 mit Soll-Ablauf, R1–R13, Randfälle §5, P1–P20, Kleinbefunde §7, K-Kriterien §9). Widersprüche zwischen beiden Kritiken sind in §0.2 zugunsten von **Einfachheit** und **Rechtskonformität** entschieden. Änderungsprotokoll: §17.
**Gegengeprüft am Datenbestand (04.11.2026, nur gelesen):** `ph_kassa` Page (`page/ph_kassa/ph_kassa.py`, 25 whitelisted Methoden), `rksv/api.py` (`beleg_buchen` mit `kunde_name`, `zahlungsplan_position`, `idempotency_key` – prüft aber kein Terminal), `rksv/buchung.py`, `logik/{betraege,abschluss,regeln,retoure,codes,notbetrieb}.py` (Stand 11:50–11:55, nicht verdrahtet), `doctype/ph_kassenbeleg/ph_kassenbeleg.py` (`on_submit`: Gutschein-Einlösung **und** Rückbuchung bei Storno über `ph_shop.gutschein.storniere_einloesung` vorhanden; Gutschein-**Ausstellung** fehlt), `ph_shop/api/backoffice.py` (`sell_voucher` whitelisted für Shop- und Kassa-Rollen, idempotent; `cancel_voucher_sale` für Leitung), `ph_core/api/bediener.py` (`set_pin`, `verify_pin`, `list_operators` – keine Sitzung), `ph_kundenkarte/api` (`lookup_card`, `redeem_benefit`), Fundament `backoffice/src` (Route-Gruppe `(kiosk)/kassa`, `app/kassa/verwaltung`, `components/Backoffice/Kiosk/{KioskShell,hooks}.js`, `lib/backoffice/frappe/client.js` mit `method()`), `PLAN-NEXT-BACKOFFICE.md` §1–§10.
**Verbindlich:** Gestaltung nach 03 (Token `--color-bo-*`, Zahlen-Tastatur §8.20), Bewegung nach 04 (Token `--bo-dur-*`, `--bo-ease-*`, Kiosk-Regeln §4), Bedienregeln nach 02. Wo 10 bewusst abweicht, steht es in §0.3 (mit Nachzugs-Anfrage). Frappe bleibt unsichtbar: keine Frappe-Begriffe, alle Texte deutsch, Du-Form an der Kassa, Beträge de-AT aus Cent. Zahlen in Wireframes sind Beispielwerte, keine Geschäftszahlen.

**Rechtlicher Rahmen:** RKSV-Konformität verantwortet der Unternehmer. Vor dem ersten echten Beleg: Signatureinheit (SEE) und Kasse in FinanzOnline registriert, Startbeleg mit BMF-Belegcheck-App geprüft, Steuerberater eingebunden. Bis dahin **und** bis die Echtbetriebs-Schranke (§0.4) erfüllt ist, läuft die Kassa nur im **Trainingsmodus**. Dieses Konzept ändert keine Logik in `ph_kassa`; Server-Ergänzungen stehen als „fehlt in App …“ und sind in §15 gesammelt. Keine Rechtsberatung – Punkte mit „StB“ bestätigt der Steuerberater.

---

## 0. Kurzfassung

### 0.1 Entscheidungen auf einen Blick

| Thema | Entscheidung |
|---|---|
| Zwei Oberflächen | **Kassa (Kiosk)** `/kassa`: Verkaufen, Anzahlung/Zahlung auf Rechnung, Gutschein verkaufen/einlösen, Retoure, Storno (mit Freigabe), Bon/E-Mail, Bargeld einlegen/entnehmen, Tagesstart, Tagesabschluss zählen, Bedienerwechsel. **Verwaltung** `/kassa/verwaltung/*`: Belege, Abschlüsse, Kassenbuch, Berichte, Kassen/Signatur, Terminals, Ereignisse, DEP, Einstellungen, Bediener. |
| Raster Verkauf | **Zwei Spalten** 8/12 + 4/12: links ein Suchfeld, Kundenzeile (nur mit Kunde), Schnelltasten, Positionen; rechts Summe, Zahlarten, Kassieren. Kein Dauer-Ziffernblock. |
| Ein Suchfeld | **„Artikel, Kunde, Karte, Auftrag …“** mit gruppierten Treffern (Artikel · Kunden · Aufträge/Rechnungen). Kein zweites Kundensuchfeld, kein Chip „Laufkunde“ (ohne Kunde = Laufkunde). |
| Touch zuerst, Tastatur gleichwertig, Scanner immer | Jede Funktion hat eine sichtbare Taste. F-Kürzel als `<kbd>` nur bei erkannter Tastatur. Scanner wirkt in jedem Zustand außer in Feldern mit `data-scan="nein"` und während eine Zahlung läuft (Hinweis). |
| Fokusmodell | Suchfeld ist **Fokus-Heimat, nie Fokus-Zwang**. Positionsliste ist ein **Grid mit Roving-Tabindex** (keine Listbox). §2.4. |
| Kassieren | Im Bon heißt der Primärknopf **„Kassieren 129,60 €“** und ist ab 1 Position aktiv (öffnet die Zahlmaske mit Bar). Jeder Zustandswechsel sperrt Eingaben auf dem neuen Primärknopf **300 ms** (Ghost-Tap-Schutz). |
| Zahlung | Rechte Spalte wird zur **Zahlmaske** (≤ 568 px ohne Split). Ein Betragsmodell (Taschenrechner mit Komma). **Jeder Schnellbetrag bucht sofort.** „Gegeben“ ist mit dem Rest vorbelegt und markiert. Split: jede Zeile hat einen Anteil, nur Bar zusätzlich „gegeben“ und Rückgeld. |
| Kartenzahlung | „Karte“ startet das Standard-Terminal des Geräts sofort; **Abbrechen in voller Breite**; ab Start ist der **Bon gesperrt**; nach „bezahlt“ führt kein Weg zurück außer Kassieren. Automatischer Abbruch nach 180 s nur im Reader-Zustand „wartet auf Karte“. |
| Schwerster Fehlerfall | **„Zahlung erhalten – Beleg offen“**: Bon gesperrt, Band `danger`, 3 automatische Versuche, dann „Erneut buchen“ (gleicher `idempotency_key`), lokales Ablegen auch ohne Server, Beleg wird per E-Mail nachgesendet. |
| Ergebnis | **Ergebnis-Karte**: Rückgeld zuerst (44 px), Belegnummer, Druckstatus, nächste Schritte. Linke Spalte zeigt den gebuchten Bon schreibgeschützt. Scan startet den nächsten Bon. |
| Rechnung ab Schwelle | Bon **über** `barverkauf_rechnung_ab_cent` (Vorschlag 40000) ohne Kunde: beim Betreten der Zahlmaske **eine Frage** „Rechnung auf eine Firma?“ – [Nein, Privatkauf] (Primär) · [Ja – Empfänger erfassen]. Kein Pflichtschritt für Privatkunden (UStG § 11, DSGVO Datenminimierung). |
| Leitung | Muster **„Freigabe am Ende“**: die Mitarbeiterin füllt den Dialog (Grund, Weg), die Leitung tippt Kachel + PIN im selben Dialog, die Aktion läuft in der Sitzung der Leitung. Gilt für Storno, Rabatt, Preis ändern, Retoure bar, Anzahlung über Soll, Bargeld-Korrektur, Training. |
| Storno | Dialog mit Grund (Fehlbuchung · Falscher Preis · Doppelt · Falsche Zahlart · Sonstiges), Rückzahlung je Zahlart, Freigabe Leitung. „Kunde will zurückgeben“ ist **Retoure**, nicht Storno. Gesperrt mit Text: Kartenbelege (bis Terminal-Erstattung), Belege mit Anzahlung/Zahlung auf Rechnung (bis Rückbuchung in Faktura) – die Leitung wird automatisch per Aufgabe informiert. |
| Retoure | Eigener Assistent; Auszahlungsweg **je Grund**: Umtausch/Kulanz → Gutschein; Mangel und Rücktritt (FAGG) → ursprünglicher Zahlungsweg (Gutschein nur auf ausdrücklichen Kundenwunsch). Braucht Server-Felder (P11/P12) – bis dahin Leitung über „Beleg korrigieren“. |
| Gutschein | Mehrzweck: Verkauf ohne Umsatz, Einlösung als Zahlart. Einzweck: Verkauf mit Warensteuersatz, Einlösung als Position. Ein verkaufter Gutschein liefert **immer einen Code** auf der Ergebnis-Karte (ph_shop `sell_voucher`). |
| Bargeld | Kopfknopf **„Bargeld“** (nicht „Kassenbuch“). Einlegen/Entnehmen mit **Zweck** (Geldtransit Bank · Geldtransit Tresor · Ausgabe · Privatentnahme · Wechselgeld), Knopf mit Betrag, **Undo 6 s mit verzögertem Commit**, Lade öffnet mit dem Commit. |
| Tagesstart / Abschluss | Wechselgeld bestätigt die **erste Person des Tages** auf einer Tagesstart-Karte (einzige Stelle für den Anfangsbestand). Abschluss: Mitarbeiterin zählt (optional blind) und übergibt; die Leitung schließt per **Bedienerwechsel am Kiosk** oder in der Verwaltung ab. Abschöpfung in den Tresor ist ein **Feld am Abschluss**, gebucht vom Server beim Abschließen (Fach-Soll-Ablauf §3.8). |
| Training | Nur die Leitung schaltet Training (Grund Pflicht, Ereignis). Der Client sendet **nie** ein Trainings-Kennzeichen; der Server liest es aus `PH Kasse.trainings_modus`. Training ist immer als Pille „TRAINING“ im Kopf sichtbar. |
| Bänder | Rang 1–9, nie blinkend, max. 2 sichtbar + Knopf „+n“. Während Zahlmaske/Ergebnis erscheinen neue Bänder erst danach (außer Rang 1). |
| Toast im Kiosk | Am **unteren Rand der linken Spalte**, nie über der rechten Spalte; max. 2, Undo 6 s, `Strg+Z`, pausiert bei Berührung des Toasts. |
| Offline | Klasse A (SEE-Ausfall) macht der Server. Klasse B (Notbetrieb) bleibt **aus**, bis Server, ph_core und Steuerberater bereit sind – die Kassa steht bei Netzausfall (Inhaber bestätigt, §15). Bon und bezahlte Kartenzahlungen gehen nie verloren. |
| Fähigkeiten | Jede Funktion, deren Server-Voraussetzung fehlt, steht als **Fähigkeit** in `lib/backoffice/kassa/faehigkeiten.js` und erscheint deaktiviert mit Grund (§0.4) – nie als Knopf, der mit Fehler endet. |

### 0.2 Auflösung der Widersprüche (verbindlich für den Bau)

| # | Widerspruch | Entscheidung | Begründung |
|---|---|---|---|
| E1 | UX P1-01/P1-23: Pflichtschritt „Rechnungsempfänger“ mit Ausweg „Ohne Anschrift · Leitung“ ↔ Fach R2: Rechnungspflicht nur gegenüber Unternehmern, Vergleich „> 400 €“ | **Fach R2** mit UX-Zeitpunkt: Frage „Rechnung auf eine Firma?“ beim Betreten der Zahlmaske (vor Terminalstart). Privatkauf = 1 Tipp, keine Personendaten. Ausweg „Ohne Anschrift · Leitung“ entfällt; Inhaber-Frage (7) „harter Stopp“ entfällt. | Recht + Einfachheit |
| E2 | UX P1-19: kein Text schickt Mitarbeiter in Faktura/Shop ↔ Fach §5: „Über Faktura stornieren“ | Text an der Kassa: „Diesen Beleg storniert die Buchhaltung. Die Leitung ist informiert (Aufgabe angelegt).“ + automatische `PH Aufgabe`. | Keine Sackgasse, Fach-Sperre bleibt |
| E3 | UX Wireframe 4.4 Storno-Chip „Kundenwunsch“ ↔ Fach R11 | **Fach R11**: Chip entfällt; Hinweiszeile „Kunde will zurückgeben? → Zurücknehmen“ mit Taste in den Retoure-Assistenten. | Recht (Storno ≠ Rücknahme) |
| E4 | UX P1-13 „Freigabe am Ende“ in der Leitungs-Sitzung ↔ Fach D5/P9: `verify_pin` liefert keine Sitzung | Muster bleibt. Technisch: `ph_core.api.bediener.sitzung_mit_pin` (P9, Anfrage). **Übergang ohne P9:** Leitung gibt im Freigabe-Schritt **Passwort** statt PIN ein (Frappe-Login → kurzlebige `sid`, sofort nach der Aktion abgemeldet). Bedienerwechsel ohne P9 = Anmelden mit E-Mail + Passwort. Mock: PIN wie geplant. | Kein technischer Benutzer bucht für Menschen (PLAN §2) |
| E5 | UX P1-14 Abschluss per Bedienerwechsel ↔ Fach A1 Tresor-Entnahme verfälscht Differenz | Abschöpfung ist **Feld am Abschluss** (P1). **Übergang ohne P1:** Schritt „Abschöpfen“ entfällt im Assistenten; die Abschöpfung wird **vor dem Zählen** als Entnahme „Geldtransit Tresor“ gebucht, danach wird der Rest der Lade gezählt (mit heutigem Server korrekt). | Richtige Zahlen mit beiden Server-Ständen |
| E6 | UX P1-16 Tagesstart-Karte ↔ Fach P2 `bargeld_ende_cent` | Tagesstart-Karte ist die einzige Stelle. Wert = `bargeld_ende_cent` des letzten Abschlusses (P2); **Übergang:** `bargeld_ist_cent` des letzten Abschlusses + Kassenbuch-Einlagen − Entnahmen seit `geschlossen_am` (mit E5 korrekt). Ändern nur Leitung (Freigabe am Ende, Grund). | Ein Wert, eine Stelle |
| E7 | UX P2-12 „Bestand ohne Barbelege“ beschriften ↔ Fach §3 Formel | **Eine Zahl „Bargeld in der Lade“** nach Fach-Formel §3.7; Spalte `bestand_danach_cent` in der Verwaltung ausgeblendet, bis P3 je Barbeleg bucht. | Keine falsche Zahl sichtbar |
| E8 | Fach R9: Entnahme > Bestand = Stopp ↔ angezeigter Bestand ist bis P2/P3 unsicher | Bis P2+P3: Warnzeile über dem Knopf, kein Stopp. Danach: Stopp mit „Freigabe · Leitung“. | Kein Stopp auf Basis falscher Zahl |
| E9 | Überweisung im Kassenbeleg (Konzept F2) ↔ Fach D8/R5: bucht „Bezahlt“, Laufkunde möglich | Zahlart Überweisung **deaktiviert** („Kommt mit dem nächsten Backend-Stand“), bis P14 (Forderung, Kontakt Pflicht). Wer auf Rechnung kauft, bekommt eine AB/Rechnung über Faktura. | Buchhaltung stimmt |
| E10 | Konzept F2: Bestellung an der Kassa kassieren ↔ Fach D2/R6 (Bestellung bleibt offen, Doppelumsatz) | Kassieren von Shop-Bestellungen **deaktiviert** bis P13; Chip zeigt nur Status („abholbereit · bezahlt“ / „Zahlung offen – Leitung informiert“). | Kein doppelter Umsatz |
| E11 | Fach D1: Gutschein-Verkauf erzeugt keinen Gutschein ↔ Top-Aufgabe A6 | **Übergang erlaubt:** nach erfolgreicher Buchung ruft das Backoffice je Position `Gutschein Verkauf` `ph_shop.api.backoffice.sell_voucher(..., idempotency_key = kassa:<beleg>:<idx>)`. Scheitert der Aufruf: Ergebnis-Zeile „Gutschein-Code wird nachgereicht“ + automatische Wiederholung + Aufgabe. Ziel bleibt P6 (Server in `on_submit`). | Funktion jetzt, idempotent, kein Geld ohne Code |
| E12 | UX P2-05 Blindzählung ↔ keine Feld-Grundlage | Schalter `kassa.blind_zaehlen` (Fundament-Config, Vorschlag **an**), später Feld `PH Kassa Einstellungen.blind_zaehlen`. Inhaber bestätigt. | Kontrolle, kein Server nötig |
| E13 | Fach R12 Ausfuhrbeleg U 34 ↔ Einfachheit, StB offen | Nicht bauen. Hilfe-Text „Steuerfreie Ausfuhr: Leitung fragen“. Route reserviert (§16). | StB zuerst |
| E14 | UX P1-04 „Kassieren 129,60 €“ öffnet Bar ↔ `F12` = Kassieren | `F12` im Bon = „Kassieren 129,60 €“ (Zahlmaske Bar, Gegeben = Rest). `F12` in der Zahlmaske = Kassieren. Die 300-ms-Sperre gilt auch für `F12`/`Enter`. Doppel-`F12` in < 300 ms bucht nicht. | Ein Knopf, ein Kürzel |
| E15 | Konzept: Abschluss-Öffnen in der Verwaltung ↔ Fach A3 (neue Differenz wird nicht gebucht) | „Öffnen“ **deaktiviert** bis P4. Korrektur bis dahin: Leitung bucht im Kassenbuch eine Einlage/Entnahme mit Zweck „Korrektur Abschluss KA-…“ und Grund. | Keine stillen Fehlbuchungen |

### 0.3 Bewusste Abweichungen von 01–05 (Nachzug als Anfrage, §15)

Jede hier **nicht** gelistete Abweichung ist ein Fehler im Bau.

| # | Thema | 10 legt fest | Bisher |
|---|---|---|---|
| K-00a | F-Tasten Kassa | Tabelle §2.5 | 01 F5, 02 §9.5, 05 §3.14 je anders |
| K-00b | Toast im Kiosk | linke Spalte unten, max. 2, 6 s, `Strg+Z` | 03 §8.12 „Kiosk oben Mitte 480 px 18 px“; 04 §3.6/§4: oben Mitte, 5 s, `Z`; 02 §6.1: 8 s |
| K-00c | Offline-Band | `warning`; `danger` nur „Zahlung ohne Beleg“ | 05 §12.4: rot, 200 ms |
| K-00d | Bon-Summe | kein Hochzählen; Direktwechsel + Farbimpuls 160 ms | 04 §4 erlaubt 240 ms |
| K-00e | Scanner in Feldern | Opt-out `data-scan="nein"` | 02 §9.5 Opt-in |
| K-00f | Deaktivierte Knöpfe | Grund als Text, kein Tooltip | 02 §8 Tooltip |
| K-00g | Betragseingabe | Komma-Modell | 03 §8.6 Cent-Shift |
| K-00h | Gesamtsumme | Instrument Sans 44/600 `tabular-nums` | 03 offene Entscheidung (c) Bodoni |
| K-00i | Idle-Sperre | 30-s-Band, dann 240 ms Fade | 04 §4 nur Fade; 01 F6 400 ms |
| K-01 | Raster | 2 Spalten 8/4 | 03 §6.3 „3/5/4“, 05 §3.14 drei Spalten |
| K-02 | Scanfeld-Fokus | Fokus-Heimat, nie Zwang | 03 §6.3 „Scan-Feld immer fokussiert“ |
| K-03 | Offline-Verkauf | ohne Klasse B steht der Verkauf | 01 F1 „Netz trennen → weiter verkaufen“, 02 §7.2 „Belege gepuffert“ – **Inhaber-Entscheidung** §15 |
| K-04 | Schnelltasten | Reihe 56 px; im leeren Bon Kacheln 120 × 88 | 01 F3 Kacheln ≥ 96 × 72, konfigurierbar |
| K-05 | Kundenkarten-Vorteil | Antippen = vormerken | 02 §1.6/§15.6 „automatisch angewendet“ |
| K-06 | Toast-Position | siehe K-00b | 03 §8.12 |
| K-07 | Kürzel in Texten | F9 Abschluss, F2 Kunde-Filter | 04 §3.11 „(F9)“, §3.12 „(F3)“, §3.13 „Nächster Kunde (F2)“ |
| K-08 | Zahlenblock / Summe | Taste 64, Summe 44 | 02 §11.3 „Tasten 56, Summe 48“ |
| K-09 | Sperrbild | 240 ms Fade | 01 F6 400 ms |
| K-10 | Klickziele | Tabelle §1.1 | 02 §1.6 Barverkauf 3, Abschluss 3 |
| K-11 | Zahlen-Tastatur | 4. Spalte je Kontext (§3.3.1), `×` im Anzeigefeld, kein `C` | 03 §8.20 „3×4 + (⌫, C, 00, ↵)“ |
| K-12 | `<kbd>` | 12 px mono (Ausnahme der 14-px-Regel, nur Zusatzinformation) | K28 „≥ 14 px“ |
| K-13 | Positionsliste | `role="grid"` | 03/05 Listbox |

### 0.4 Fähigkeiten, Freigabestufen und Echtbetriebs-Schranke

Der Bereich wird **vollständig** gebaut (Mock + Frappe-Modus). `lib/backoffice/kassa/faehigkeiten.js` liefert je Fähigkeit `{an: bool, grund: string}`; im Frappe-Modus aus Feld-/Methoden-Prüfung (`getMeta`, ein Probeaufruf je 5 min gecacht), im Mock einzeln schaltbar über `BACKOFFICE_MOCK_FAEHIGKEITEN` (kommagetrennt, `alle` / `-name`). Aus = Knopf sichtbar, deaktiviert, Grund als Text 14 px („Kommt mit dem nächsten Backend-Stand“ bzw. konkreter Satz). Nie ausgeblendet, außer die Rolle darf die Funktion grundsätzlich nicht.

| Fähigkeit | an, wenn | Ohne (Übergang) |
|---|---|---|
| `bediener_sitzung` | ph_core `sitzung_mit_pin` (P9) | Bedienerwechsel und Freigabe mit Passwort (E4) |
| `idempotenz` | `page.beleg_buchen(idempotency_key)` + Intent-Doppelprüfung (P8) | Tastensperre + 300 ms; Echtbetrieb gesperrt |
| `training_server` | `trainings`-Parameter entfernt, `trainingsmodus` nur Leitung (P5) | Client sendet nie `trainings`; Schalter nur Leitung im UI; Echtbetrieb gesperrt |
| `regeln_server` | `regeln.pruefe` in `beleg_vorschau`/`beleg_buchen` (V8, P11) | Client-Port `regeln.js` zeigt Freigaben; Server prüft, was er heute prüft |
| `rechnung_snapshot` | Felder `rechnung_gewuenscht`, `empfaenger_*` (P10) | Firmenrechnung nur mit Kontakt; A4-PDF wird bei Buchung erzeugt und am Beleg abgelegt (Momentaufnahme) |
| `kunde_anlegen` | Rolle darf `PH Kontakt` anlegen | nur Suche; Text „Neue Firmenkunden legt das Büro an – Beleg kommt per E-Mail“ |
| `gutschein_verkauf` | P6 **oder** `sell_voucher` erreichbar | – (E11) |
| `retoure` | Select `Retoure`, `bezug_zeile`, `retoure_laden/retoure_buchen` (P11, P12) | Leitung: „Beleg korrigieren“ (A16) |
| `rabattfelder` | Rabattfelder an `PH Kassenbeleg Position` (P11) | Rabatt nur Leitung, `einzel_brutto_cent` + Text in `zusatz` |
| `storno_ursprung` | `ursprung_art` + Rückbuchung Faktura (P7) | Storno mit Anzahlung/Zahlung auf Rechnung gesperrt (E2) |
| `terminal_erstatten` | `terminal_erstatten` + Feld `terminal_refund` (V3) | Storno/Retoure von Kartenbelegen gesperrt; Kunde: „Als Gutschein erstatten“ nur bei Umtausch/Kulanz, sonst Aufgabe an Leitung |
| `storno_mitarbeiter` | Inhaber ja + `storno_mitarbeiter_bis_cent` + `regeln.storno_freigabe` verdrahtet | Storno immer mit Freigabe |
| `abschoepfung` | `tresor_entnahme_cent`, `bargeld_ende_cent` (P1) | E5 |
| `anfang_server` | `before_insert` aus `bargeld_ende_cent` (P2), `bargeld_anfang_cent` RO (P16) | E6 (Client-Formel), Wert wird an `abschluss_zaehlen` übergeben – nur von der Leitung geändert |
| `kassenbuch_barbelege` | Bar-Belege im Kassenbuch (P3) | Formel §3.7 |
| `abschluss_oeffnen` | P4 | E15 |
| `kassenbuch_zweck` | `zweck`, `anhang`, `ust_satz` (P15) | Zweck als Präfix in `grund` („Ausgabe: Porto“), Foto als Frappe-Anhang an der Buchung |
| `ueberweisung` | P14 | E9 |
| `bestellung_kassieren` | P13 | E10 |
| `vorteil_zuruecknehmen` | `revoke_benefit` (P20) | Storno/Retoure-Hinweis „Vorteil bleibt verbraucht – Leitung informiert“ + Aufgabe |
| `bar_vorgang` | Bar-Summe je Auftrag/Rechnung (P19) | Client summiert Bar-Anteile bekannter Belege zum Auftrag (`get_list`) und warnt |
| `code_erkennen` | Wrapper für `logik/codes.erkennen` (V4) | Client-Port `codes.js` (§2.6) |
| `tageswechsel` | `tageswechsel_uhrzeit` verdrahtet (V9) | Kalendertag, Hinweis im Abschluss |
| `vortag_page` | Page-Methoden mit `datum` | Leitung: Abschluss-Akte nutzt Dokumentmethoden `zaehlen/abschliessen` |
| `standard_terminal` | `PH Geraet.standard_terminal` (ph_core) | zuletzt genutztes Terminal je Gerät lokal |
| `bedienerkarte` | ph_core `verify_badge` | nur PIN |
| `notbetrieb` | Server-Einspielung + `PH Geraet.offline_erlaubt` + StB | aus (K-03) |
| `chf` | Inhaber ja + Felder (P12-CHF) | aus |

**Freigabestufen (Fach §0):** Kiosk-Verkauf, Zahlmaske, Belege, Verwaltung lesen → **jetzt bauen**. Tagesabschluss, Retoure, Gutschein verkaufen, Storno von Anzahlungen → bauen mit Fähigkeiten-Schaltern; produktiv erst mit den genannten Server-Punkten.
**Echtbetriebs-Schranke:** Der Schalter „Training aus“ in der Kassen-Akte ist nur aktiv, wenn `bediener_sitzung`, `idempotenz`, `training_server`, `rechnung_snapshot` **an** sind **und** die Einrichtungs-Checkliste (§5.3) vollständig ist. Sonst Text: „Echtbetrieb braucht: … (Liste)“.

---

## 1. Nutzer und Top-Aufgaben (Klickzahl, nachgezählt)

Zählweise: Tipps ab „Kassa bereit“ (leerer Bon). Scan = 0. Texteingabe und PIN-Ziffern zählen nicht, `Enter`/„OK“ = 1. „Heute“ = Desk-Page `ph_kassa`. Jede Zeile ist ein E2E-Schritt mit `zaehleTipps()` (§12).

### 1.1 Verkäuferin an der Kassa (`PH Kassa Mitarbeiter`; mehrere Personen je Kasse über Bedienerwechsel)

| # | Top-Aufgabe | Tipps | Weg (Touch) | Heute |
|---|---|---|---|---|
| A1 | Barverkauf Accessoire | **2** | Scan → „Bar“ → „Passend“ (oder Scan → „Kassieren 129,60 €“ → „Kassieren“) · Bon druckt automatisch | 4–5 |
| A2 | Kartenzahlung | **2** | Scan → „Karte“ (Terminal startet) → Kunde zahlt → „Kassieren“ · 1 mit Einstellung `karte_automatisch_buchen` | 5 |
| A3 | Anzahlung auf Auftrag | **3** (Karte) / **4** (Suche) | Kundenkarte scannen → Chip „Anzahlung AB-… fällig“ → „Bar“/„Karte“ → „Passend“/Kassieren · mit Suche: Name tippen → Treffer +1 | 6 |
| A4 | Zahlung auf offene Rechnung | **3 / 4** | wie A3, Chip „RE-… offen“ | 6 |
| A5 | Kundenkarte berücksichtigen | **0–1** | Scan Karte → Kundenzeile; Vorteil antippen = vormerken | – |
| A6 | Gutschein verkaufen | **4** | Schnelltaste „Gutschein“ → „50 €“ (übernimmt sofort) → „Bar“ → „Passend“ | 4 |
| A7 | Gutschein einlösen | **2 + Scan** | „Gutschein“ → Scan (Betrag übernommen) → „Kassieren“ | 4 |
| A8 | Verkauf über 400 € ohne Kunde | **+1** privat / **+2 + Text** Firma | Zahlart → Frage „Rechnung auf eine Firma?“ → „Nein, Privatkauf“ · Firma: „Ja“ → Kunde wählen oder Felder → „Weiter“ | – |
| A9 | Bon nachdrucken | **2** (Ergebnis-Karte 1) | „Belege“ → Zeile „Nachdruck“ | 2 |
| A10 | Beleg per E-Mail | **1** (Adresse bekannt) / **3** | Ergebnis-Karte „Beleg an m.muster@… senden“ · sonst „Per E-Mail“ → Adresse → „Senden“ | 3 |
| A11 | Bon parken / weiterführen | **2 / 2** | „Bon ▾“ → „Parken“ · „Geparkt (n) ▸“ → Kachel | – |
| A12 | Bargeld entnehmen | **4** | „Bargeld“ → „Entnehmen“ (vorgewählt zuletzt genutzt) → Betrag „200“ → Zweck-Chip → „200,00 € entnehmen“ (5, wenn Art umgeschaltet) | 3 |
| A13 | Retoure (Ware zurück) | **6** | „Belege“ → Bon-QR scannen → „Zurücknehmen“ → „Alle“/Stepper → Grund-Chip → „Weiter“ → „Gutschein ausstellen“/„Auszahlen“ (+ Freigabe 2 bei bar außerhalb der Regel) | – |
| A14 | Bedienerwechsel | **3** | Name in der Kopfzeile → eigene Kachel → PIN → „OK“ (Bedienerkarte: 1 Scan) | Desk-Login |
| A15 | Tagesabschluss zählen | **3 + Zählen** | „Abschluss“ → „Weiter: Zählen“ → Zählen → „Zählung übergeben“ | 4 + Zählen |
| A16 | Storno mit Freigabe | **7** (Mitarbeiterin 5, Leitung 2) / **6** per Bon-Scan | „Belege“ → Zeile → „Stornieren“ → Grund → „Zur Freigabe · Leitung“ → (Leitung) Kachel → PIN + „Stornieren“ | – |
| A17 | Tagesstart Wechselgeld | **1** | Karte „Wechselgeld in der Lade: 150,00 €“ → „Stimmt“ | – |

### 1.2 Kassa-Leitung (`PH Kassa Leitung`)

| # | Aufgabe | Tipps | Weg |
|---|---|---|---|
| L1 | Tag abschließen | **5–7 + Zählprüfung** | Band „Abschluss gezählt – Leitung schließt ab“ → „Übernehmen“ (Bedienerwechsel: Kachel, PIN, OK) → Differenz prüfen (Grund-Chip falls nötig) → „Weiter“ → Abschöpfen „Weiter“ → Unterschrift → „Abschließen“ |
| L2 | Beleg stornieren (direkt als Leitung) | **4** | Belege → Zeile → „Stornieren“ → Grund → „Stornieren“ |
| L3 | Differenzen prüfen | **1** | Verwaltung → Kennzahl „Abschlüsse mit Differenz“ → Liste gefiltert |
| L4 | DEP exportieren | **3** | Kassen → Kasse → „DEP exportieren“ → Zeitraum → „Erzeugen“ |
| L5 | SEE-Ausfall > 48 h melden | **2** | Band „Ereignis öffnen“ → „Als gemeldet markieren“ (Datum + Nachweis) |
| L6 | Monats-/Jahresbeleg, Jahresbeleg geprüft | **2** | Kassen-Akte → „Sonderbeleg ▾“ / „Jahresbeleg geprüft“ |
| L7 | Training schalten | **3** | `⋯` → „Trainingsmodus“ → Grund-Chip → „Einschalten/Ausschalten“ |
| L8 | Bediener-PIN setzen | **3** | Verwaltung → Bediener → Zeile → „PIN setzen“ |
| L9 | Abschluss vom Vortag nachholen | **2 + Assistent** | Band „Abschluss vom 03.11. offen“ → „Nachholen“ |

### 1.3 Geschäftsführung (`PH Geschäftsführung`, lesend)

| Aufgabe | Tipps | Weg |
|---|---|---|
| Heute kassiert, Belege, offene Abschlüsse | 0 | Zentrale (Kassa-Kennzahlen) |
| Umsatz je Zahlart im Monat | 2 | Verwaltung → Berichte → „Tagesumsatz je Zahlart“ |
| Kassenkontrolle je Bediener | 2 | Berichte → „Kassenkontrolle je Bediener“ |

### 1.4 Steuerberater extern (`PH Buchhaltung extern`, lesend + Export)

| Aufgabe | Tipps | Weg |
|---|---|---|
| Kassenbuch des Monats | 2 | Startseite der Rolle → Block „Export“ → Kassenbuch Monat (CSV/PDF) |
| DEP-Datei + Prüfsumme | 2 | Export → DEP → Zeile → Herunterladen |
| Kassenumsatz nach Steuersatz (UVA-Zuarbeit, Zeilen nach §4.10) | 2 | Berichte → „Kassenumsatz nach Steuersatz“ → Monat |
| Einzelbeleg mit QR | 1–2 | Palette `K1-000123` oder Belege → Zeile → A4-PDF |

### 1.5 Administrator (`PH Backoffice-Admin`)

Kassen anlegen, Signatureinheit, AES-Schlüssel, Terminals, Geräte (`register_device`), Einstellungen, PIN-Verwaltung. Nie im Tagesgeschäft, kein Buchen.

---

## 2. Routen, Rechte, Sitzung, Fokus, Tasten

### 2.1 Routenplan

Kiosk-Routen liegen in der Route-Gruppe `app/(kiosk)/kassa/…` (KioskShell), die Verwaltung in `app/kassa/verwaltung/…` (Backoffice-Shell). `app/kassa/page.js` darf **nicht** entstehen (Kollision mit `(kiosk)/kassa/page.js`).

```
/kassa                                 Kiosk  Verkauf (Zustände: Bon · Zahlmaske · Ergebnis · gesperrt)   Kassa *
/kassa/belege                          Kiosk  Belege heute + Beleg suchen (Sheet ≥1100 / Vollbild)
/kassa/retoure?beleg=                  Kiosk  Assistent Retoure (Fähigkeit retoure)
/kassa/abschluss[?datum=]              Kiosk  Assistent Tagesabschluss (Vortag nur Leitung)
/kassa/bargeld                         Kiosk  Bargeld einlegen/entnehmen (Dialog als eigene Route für Rücksprung)
/kassa/geparkt                         Kiosk  Geparkte Bons (Gerät)
/kassa/display?kasse=K1                Kiosk  Kundendisplay (zweiter Bildschirm, ohne Bedienung)
/wechsel                               Kiosk  Bedienerwechsel / Sperrbild (Fundament, erweitert)
/kassa/verwaltung                      T1     Bereichsstart                                         Kassa *, GF, Buchhaltung extern
/kassa/verwaltung/belege               T2     PH Kassenbeleg – Liste (lesen)
/kassa/verwaltung/belege/[name]        T5     Beleg-Akte
/kassa/verwaltung/abschluesse          T2     PH Kassenabschluss – Liste
/kassa/verwaltung/abschluesse/[name]   T5     Abschluss-Akte (auch: Abschließen-Assistent ab Schritt 3)
/kassa/verwaltung/kassenbuch           T2     PH Kassenbuch – Buchungen | Tage
/kassa/verwaltung/berichte[/slug]      T8     7 Reports
/kassa/verwaltung/kassen[/id]          T9/T5  PH Kasse – Liste und Akte                               Leitung, Admin
/kassa/verwaltung/terminals            T9     PH Terminal                                           Leitung, Admin
/kassa/verwaltung/ereignisse           T2     PH Kassa Ereignis                                     Leitung, GF, extern (lesen)
/kassa/verwaltung/dep                  T2     PH DEP Export                                         Leitung, GF, extern (lesen)
/kassa/verwaltung/einstellungen        T9     PH Kassa Einstellungen (Single)                       Leitung, Admin
/kassa/verwaltung/bediener             T9     Benutzer mit Kassa-Rolle, PIN, Geräte (ph_core)       Leitung, Admin
/druck/kassenbeleg/[name]?format=bon|a4    Druckrouten (03 §10)
/druck/kassenabschluss/[name]  /druck/kassenbuch?kasse=&monat=  /druck/zaehlliste  /druck/gutschein/[name]
(reserviert, nicht bauen: /druck/ausfuhr/[beleg] – E13)
```

`bereiche.js` (Eintrag `kassa`): Feld `navigation` in dieser Reihenfolge: Übersicht · Belege · Abschlüsse · Kassenbuch · Berichte · ─ · Kassen · Terminals · Ereignisse · DEP · Einstellungen · Bediener. `doctypes` um `PH Kassa Ereignis`, `PH Signatureinheit` ergänzen. Kiosk-Einstieg: Kachel „Kassa“ auf `/arbeitsplatz` und Knopf „Kassa öffnen“ auf der Übersicht.

### 2.2 Gerät und Sitzung

| Schritt | Verhalten | Methode |
|---|---|---|
| Gerät einrichten (einmalig, Admin/Leitung) | `/geraet`: Name „Kassa 1 Tresen“, Typ `Kassa`, Arbeitsplatz `kassa`, Standort, Kasse, Drucker, Druckertyp `Bon 80 mm`, Standard-Terminal (Fähigkeit `standard_terminal`, sonst lokal) | `ph_core.api.geraete.register_device` → Token im HttpOnly-Cookie |
| Kiosk-Chrome | Richtlinie `DeveloperToolsAvailability = 2` (F12 frei für Kassieren), Kiosk-Modus/Geführter Zugriff am iPad | Geräte-Einrichtung (Hilfe-Artikel `kassen.md`) |
| Start Kiosk | Gerät prüfen, Kasse aus Gerät; ohne Bindung Kassenwahl (Kacheln) | `verify_device(token)`, `touch_device(token)` alle 5 min (`useLebenszeichen`) |
| Bedienerliste | Kacheln (Initialen, Kurzname) | `ph_core.api.bediener.list_operators(geraet_token)` |
| PIN prüfen | 4–6 Ziffern, „OK“ (variable Länge, kein Auto-Absenden); Fehlversuche zählt der Server (`invalid_pin` + `verbleibend`, `rate_limited` + `sekunden`) | `verify_pin(email, pin, geraet_token)` |
| Sitzung je Bediener | Mit `bediener_sitzung`: `sitzung_mit_pin(email, pin, geraet_token)` → `sid` des Bedieners im Server-Store, Idle 15 min. Ohne: Anmeldung mit E-Mail + Passwort (`anmeldenAction`), Wechsel = Abmelden/Anmelden. Jeder Beleg trägt `bediener = frappe.session.user` | ph_core (P9) / Fundament |
| Bedienerkarte (optional) | Barcode/QR am Namensschild, Scan auf `/wechsel` = Anmeldung nur an gebundenem Gerät; Leitungsfreigaben weiter mit PIN | `verify_badge(code, geraet_token)` (Anfrage ph_core) |
| Wechsel gesperrt | solange ein Terminal läuft, eine Kartenzahlung bezahlt ist oder „Zahlung erhalten – Beleg offen“ gilt: Text „Zuerst die Zahlung abschließen“ | Kiosk |

### 2.3 Rechte im Kiosk und in der Verwaltung

| Rolle | Kiosk | Verwaltung |
|---|---|---|
| PH Kassa Mitarbeiter | Verkaufen, Anzahlung, Zahlung auf Rechnung, Gutschein verkaufen/einlösen, Parken, Belege heute, Nachdruck, E-Mail, Bargeld einlegen/entnehmen, Tagesstart bestätigen, Abschluss **zählen**, Retoure Umtausch/Kulanz als Gutschein. **Mit Freigabe:** Storno, Rabatt, Preis ändern (Artikel), Retoure bar außerhalb der Regel, Anzahlung über Soll, Wechselgeld ändern, Entnahme über Bestand (nach P2/P3). **Nicht:** Abschließen, Vortagsabschluss, Trainingsmodus, Nullbeleg | Übersicht, Belege (lesen), Abschlüsse (lesen), Kassenbuch (lesen), Berichte außer „Kassenkontrolle je Bediener“ |
| PH Kassa Leitung | alles | alles inkl. Kassen, Terminals, Ereignisse, DEP, Einstellungen, Bediener-PIN |
| PH Geschäftsführung | – | lesen, Berichte |
| PH Buchhaltung extern | – | Belege, Abschlüsse, Kassenbuch, DEP, Ereignisse lesen; Berichte außer „Kassenkontrolle je Bediener“; Terminals **nicht** (Seite fehlt in der Navigation; Direktaufruf: „Dafür fehlt dir die Berechtigung (Kassa-Leitung).“) |
| PH Backoffice-Admin | – | Stammdaten (Kasse, SEE, Terminal, Einstellungen, Geräte); Abschlüsse/Kassenbuch nur lesen |

**Freigabe-Knopf (Kiosk):** normaler Knopf (nicht ausgegraut) mit Icon `lock` 20 px und Suffix „· Leitung“. Er öffnet **keinen** eigenen Leitungs-Dialog, sondern führt den Fachdialog bis zum Ende; der Primärknopf heißt „Zur Freigabe · Leitung“ (§3.11). Kein Tooltip im Kiosk; deaktivierte Knöpfe nennen den Grund als Text (14 px).

**Datenminimierung:** `bediener` und `umsatzzaehler_klar_cent` sind für Mitarbeiter nicht sichtbar (Anfrage permlevel 1, Fach §7); die Oberfläche zeigt Mitarbeitern in Listen nur das Bediener-Kürzel.

### 2.4 Fokusmodell (verbindlich)

| Zustand | Fokus | `↑/↓` | `Enter` | `Esc` | Scanner-Enter | Ziffern/Buchstaben |
|---|---|---|---|---|---|---|
| Bon, Suchfeld leer | Suchfeld | `↑` bewegt den **echten Fokus** in die letzte Positionszeile | nichts | nichts | Code auswerten (§2.6) | ins Suchfeld; Suche ab 2 Zeichen, 120 ms Entprellung; **reine Ziffern < 4 Zeichen suchen nicht** |
| Bon, Suchfeld mit Text | Suchfeld (`combobox`) | Treffer wählen | ersten **Artikel** übernehmen bzw. gewählten Treffer; Feld leeren | Feld leeren | wie Enter | ins Suchfeld |
| Positionsliste (Grid) | Zeile (Roving-Tabindex) | Zeile wechseln; `←/→` Zellen (Stepper) | Zeilenblatt | Fokus zurück ins Suchfeld | wirkt fokusunabhängig, Fokus zurück ins Suchfeld | Zeichen → Fokus ins Suchfeld + Zeichen; `+`/`-`/`Entf` auf die Zeile |
| Bon, Fokus per `Tab` woanders | dort | Browser | Taste auslösen | nichts | auswerten, Fokus bleibt | normal |
| Zeilenblatt | Menge | – | nächstes Feld, zuletzt „Übernehmen“ | schließen, Fokus auf die Zeile | auswerten + Blatt schließen | Anzeigefeld |
| Zahlmaske Bar/Gutschein | „Gegeben“ (markiert) / Code-Feld | Split-Zeilen | Kassieren (gedeckt) bzw. Betrag übernehmen | zurück zum Bon (Split bleibt) | Gutschein-/Kundenkarten-Code; Artikel → „Scan ignoriert – erst Zahlung beenden“ | Anzeigefeld (erste Ziffer überschreibt) |
| Zahlmaske Karte läuft | „Kartenzahlung abbrechen“ | – | – | Abbrechen-Dialog | ignoriert + Hinweis „Scan ignoriert – Zahlung läuft“ | – |
| Zahlmaske Karte bezahlt | „Kassieren“ (nach 300 ms) | – | Kassieren | **ohne Wirkung**, Text „Erst kassieren“ | ignoriert + Hinweis | – |
| Ergebnis-Karte | „Nächster Kunde“ | Tasten | Nächster Kunde | nichts | neuer Bon + auswerten | neuer Bon, ins Suchfeld |
| Dialog (`<dialog>`) | 02 §6.2 (gefährlich: Abbrechen) | – | Primär (nicht bei gefährlich) | Abbrechen | ignoriert | Dialogfelder |

- **ARIA:** Suchfeld `role="combobox"`, `aria-controls` = Trefferliste (`listbox`, Gruppen mit `role="group"` + `aria-label`). Positionsliste `role="grid"` (`row`, `gridcell`), Stepper sind echte `button` mit `aria-label="Menge verringern"`. Kein `aria-activedescendant` über zwei Listen. Zeile liest sich „Vase Alva, 3 Stück, 89,70 Euro“.
- Tab-Reihenfolge Verkauf: Kopfzeile → Suchfeld → „Bon ▾“ → Kundenzeile → Schnelltasten → Positionsliste (eine Station) → Zahlart-Tasten → Kassieren.
- Fokus kehrt zum Suchfeld zurück nach: Position hinzugefügt, Zeilenblatt zu, Dialog zu (wenn Auslöser weg), Ergebnis-Karte verlassen, Bedienerwechsel. **Nie** per Intervall, nach `blur` oder bei Band-Wechsel.
- Suchfeld: `inputmode="none"` bei `pointer: coarse`; Taste „Tippen“ schaltet auf `inputmode="search"`. Felder mit eigener Zahlen-Tastatur ebenfalls `inputmode="none"`.
- Felder mit `data-scan="nein"` (Hinweis-Toast „Scan ignoriert – erst Eingabe beenden“): Grund-Felder (Storno, Differenz, Bargeld, Retoure), E-Mail, Zusatztext, Unterschrift-Name, PIN, Passwort, Rechnungsempfänger-Felder, „E-Mail für den Beleg“ (§3.3.6).

### 2.5 Tastenbelegung (ersetzt alle früheren Kassa-Belegungen)

Prinzip: F2–F6 Erfassen, F7–F9 Tagesgeschäft, F10 Zahlart, F12 Kassieren. Keine Browser-Kürzel außer der bewussten Ausnahme `Strg+P` (immer `preventDefault`, der Browser-Druckdialog erscheint nie). Kürzel erscheinen als `<kbd>` **12 px** mono rechts oben in der Taste nur bei `html[data-tastatur="ja"]` (gesetzt beim ersten `keydown` einer F-Taste oder `Tab` in der Sitzung).

| Taste | Wirkung | Sichtbare Taste |
|---|---|---|
| `F1` | Hilfe-Panel (Kürzel, „Was tun bei …“) | `[?]` Kopfzeile |
| `F2` | Suchfeld mit Filter-Chip „Kunde:“ (auf Ergebnis-Karte: neuer Bon + Kundenfilter) | „+ Kunde“ |
| `F3` | Suchfeld + Tippmodus | `[Tippen]` |
| `F4` | Freitextposition | Schnelltaste „Freitext“ |
| `F5` | Anzahlung/offene Zahlung des gewählten Kunden (ohne Kunde: Kundenfilter) | Kundenzeile-Chips |
| `F6` | Gutschein verkaufen | Schnelltaste „Gutschein“ |
| `F7` | Belege | `[Belege]` |
| `F8` | Bargeld | `[Bargeld]` (768–1099 px: `⋯`) |
| `F9` | Tagesabschluss | `[Abschluss]` |
| `F10` | Im Bon: Zahlmaske mit Bar. In der Zahlmaske: Popover „+ Zahlart“ (`↑/↓`, `Enter`); Karte startet erst mit `Enter` auf „Karte“. **Kein Zyklus.** | Zahlart-Tasten / „+ Zahlart“ |
| `F11` | Vollbild (Browser, nicht abgefangen) | `⋯` |
| `F12` / `Strg+Enter` | Bon: „Kassieren 129,60 €“ (Zahlmaske Bar). Zahlmaske: Kassieren (nur gedeckt; 300-ms-Sperre nach Zustandswechsel) | Kassieren |
| `Shift+F2` | Bedienerwechsel / Sperren | Bedienername |
| `Shift+F4` | Rabatt auf aktive Zeile (Freigabe) | Zeilenblatt |
| `Shift+F6` | Bon parken | „Bon ▾ › Parken“ |
| `Shift+F7` | Retoure | Belege → „Zurücknehmen“ |
| `Shift+F10` / Kontextmenü-Taste | Zeilenmenü der aktiven Zeile | Langdruck 400 ms |
| `Strg+P` | letzten Bon nachdrucken | Ergebnis-Karte / Belege |
| `Strg+Z` | Undo des jüngsten Toasts | Toast-Knopf |
| `Esc` | oberste Ebene schließen (Dialog › Zeilenblatt › Zahlmaske, außer Karte bezahlt) | `‹`-Tasten |
| `↑/↓`, `Enter`, `Entf`, `+`, `-` | Positionsliste (§2.4) | Stepper, Wischen |
| `Entf` im Anzeigefeld | Betrag löschen | `×` im Anzeigefeld |
| Ziffern + `*` | Mengenvorwahl, Chip „3 ×“ im Suchfeld, verfällt nach 20 s oder mit `Esc` | Chip |

Registrierung über `useTastenkuerzel` (vorhanden) mit Kontext je Zustand. Kürzel-Texte in 04 §3.11–§3.13 werden nachgezogen (K-07).

### 2.6 Scan-Erkennung

Reihenfolge nach `logik/codes.erkennen` (Server, Fähigkeit `code_erkennen`), bis dahin als Client-Port `lib/backoffice/kassa/codes.js` mit denselben Mustern (Unit-Test gegen die Python-Beispiele):

| Muster | Bedeutung | Aktion | Methode |
|---|---|---|---|
| `KK-…` | Kundenkarte | Kundenzeile füllen | `ph_kundenkarte.api.lookup_card(kartennummer)` |
| `PH-XXXX-XXXX-XXXX-XXXX` (Muster `codes._GS`) | Gutschein | in Zahlmaske: einlösen; im Bon: Hinweis „Gutschein beim Bezahlen einlösen“ + Taste „Jetzt einlösen“ | `page.gutschein_pruefen(code)` |
| `PH-S-…` | Shop-Bestellung | Kunde laden, Chip markiert (Kassieren nur mit `bestellung_kassieren`) | `page.suche_kunde(q)` |
| `AB-…`, `RE-…` | Auftrag/Rechnung | Kunde laden, Chip markiert | `page.suche_kunde(q)` |
| Kassenbeleg-Nummer `K1-000123` / RKSV-QR `_R1-AT…` | Kassenbeleg | öffnet Belege → Beleg (Retoure/Nachdruck) | `rksv.api.beleg_daten(name)` |
| 8/13 Ziffern mit gültiger Prüfziffer | EAN | Artikel | `page.suche_produkt(q)` |
| sonst | Herstellernummer/Slug | Artikel, sonst „unbekannt“ | `page.suche_produkt(q)` |

`useScanner` (vorhanden: `minLaenge 4`, `maxAbstandMs 40`). Während eine Kartenzahlung läuft oder bezahlt ist, wirkt **kein** Scan; jeder Scan → Hinweis „Scan ignoriert – Zahlung läuft“. In der Zahlmaske Bar/Gutschein wirken nur Gutschein- und Kundenkarten-Codes; Artikel → „Scan ignoriert – erst Zahlung beenden“.

---

## 3. Kiosk-Seiten

### 3.0 Kiosk-Grundlagen

| Thema | Festlegung |
|---|---|
| Raster | iPad 11" quer 1180 × 820 (Referenz), Rand 16, Gap 16, Kopf 56, Bänder je 40. Breakpoints §9. |
| Schrift | Instrument Sans. Meta ≥ 14 px, Bedienbares ≥ 16 px, Positionen 18/500, Beträge `tabular-nums`. Gesamt **44/600**, Rückgeld 44/600. `<kbd>` 12 px mono (K-12). Bodoni Moda nur als Wortmarke (Kundendisplay-Ruhebild, Bon-Kopf). |
| Farben | Flächen `surface`/`surface-2`; aktive Zeile `surface-2` + 2-px-Balken `ink`; Primär `action`; Bänder `*-soft` + `*-text`; Eingaberänder `line-control`. Hell/dunkel nach 03; Kiosk Standard hell. |
| Ziele | ≥ 48 × 48 (auch `×` Kunde, Vorteil-Chip, „+n“); Zahlentasten 64 hoch; Kassieren 64; Stepper 48 × 48. Druck-Zustand: `background-color` → `surface-3`, `--bo-dur-ack` 50 ms. Keine Hover-Effekte. |
| Eingabesperre | `useEingabesperre(300)`: nach jedem Zustandswechsel (Bon → Zahlmaske, Karte → bezahlt, Zahlmaske → Ergebnis) nimmt der neue Primärknopf Zeiger- und Tasteneingaben erst nach 300 ms an (`pointer-events: none` + Tastenfilter). Kein sichtbarer Effekt. |
| Fokus | Ring 3 px `--color-bo-focus`, Offset 2 (04 §3.10). |
| Ansage | Eine `aria-live="polite"`-Region in `KassaLive`. **Bündelung:** innerhalb 1 s wird nur die letzte Ansage gesprochen („Vase Alva, jetzt 4 Stück. 5 Positionen, Gesamt 249,30 Euro.“). Texte: „Karte: wartet auf Karte“ · „Karte: bezahlt“ · „Beleg K1-000124 erstellt, Rückgeld 20,40 Euro“. Bänder `role="status"`, nur Rang 1 `role="alert"`. Die Gesamtzahl selbst `aria-live="off"`. |
| Lokaler Entwurf | Der offene Bon wird 1 s nach jeder Änderung gespiegelt (IndexedDB `ph_kassa_entwurf`, je Bediener und Gerät, mit `entwurf_uuid`). Neuladen/Absturz verliert nichts. Lesen/Schreiben in `try/catch`; ohne IndexedDB Band „Entwurf wird nicht gesichert“ (`warning`, Rang 6). |
| Komponenten | Ordner `components/Backoffice/Kassa/` – Liste §16.2. |

### 3.1 K1 – Verkauf (Zustand „Bon“, ≥ 1100 px)

```
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│ Kassa 1 · Lochau   Anna K. ▾   14:05   ● Bereit  [TRAINING]   [▤ Belege] [⇅ Bargeld] [☑ Abschluss] [?] [⋯] │ 56
├───────────────────────────────────────────────────────────────────────────────────────────────┤
│ △ Signatureinheit ausgefallen seit 09:12 – Belege gültig, werden nachsigniert                  │ 40 (nur wenn)
├──────────────────────────────────────────────────────────────┬────────────────────────────────┤
│ ⌕ Artikel, Kunde, Karte, Auftrag …     [3 ×] [Tippen] [Bon ▾] │ GESAMT                         │ 56
│ Maria Muster · Silber · [Anzahlung AB-…42 · 3.200,00 €] [RE-…113] ▸  × │   129,60 €          │ 56 (nur mit Kunde)
│ Vorteil „Lieferung frei“ wird mit dem Beleg eingelöst          │ Netto 108,00 · USt 21,60       │ 14 (nur wenn vorgemerkt)
│ [Lieferpauschale] [Gutschein] [Anzahlung] [Freitext] [Muster…] ▸ │ 20 %  129,60                │ 56
│ ──────────────────────────────────────────────────────────── │ ┌─────────────┬─────────────┐  │
│ ▌[▣] Vase Alva                    [–]  3  [+]      89,70 €    │ │ ▤ Bar       │ ▭ Karte     │  │ 56
│      29,90 € je Stück                                         │ ├─────────────┼─────────────┤  │
│  [▣] Kissen Lino 40 × 40          [–]  1  [+]      39,90 €    │ │ ◫ Gutschein │ ⋯ Andere ▾  │  │ 56
│                                                               │ └─────────────┴─────────────┘  │
│                                                               │ Geparkt (2) ▸                  │ 48 (nur ≥ 1)
│   ┌ Position entfernt · Rückgängig ───────────┐               │ ┌──────────────────────────┐   │
│   └────────────────────────────────────────────┘ ← Toast links │ │ Kassieren      129,60 €  │   │ 64 primary
│                                                               │ └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────┴────────────────────────────────┘
```

Über den Positionen stehen höchstens 168 px (Suchfeld 56 · Kundenzeile 56 · Schnelltasten 56) + 14 px Vorteil-Zeile.

**Kopfzeile `KassaKopf` (56 px):**

| Element | Inhalt | Tipp |
|---|---|---|
| Kasse | `PH Kasse.bezeichnung` · `standort` | ohne Gerätebindung: Kassenwahl |
| Bediener | `kurzname` + `▾`; während einer Freigabe „Maria L. (Leitung)“ in `accent-text` | Bedienerwechsel (`Shift+F2`) |
| Uhr | `useUhr` | – |
| Statusfeld | **ein** Punkt + Wort: „Bereit“ (`ok`) · „Drucker prüfen“ (`warning`) · „Verbindung schwach“ (`warning`) · „Signatur ausgefallen“ (`warning`) | Popover (kein Tooltip): Verbindung, Drucker (letzter Auftrag), SEE, Terminal, letzter Beleg, „Bargeld in der Lade“ |
| Pille „TRAINING“ | `special`, immer sichtbar, solange `kassen_status.trainings_modus` – unabhängig vom Bandstapel | – |
| Belege | Icon `receipt` + „Belege“ (`F7`) | §3.9 |
| Bargeld | Icon `arrow-down-up` + „Bargeld“ (`F8`) | §3.7 |
| Abschluss | Icon `square-check` + „Abschluss“ (`F9`); Badge „gezählt“ bei Status Gezaehlt | §3.8 |
| `?` | Hilfe-Panel (`F1`) | Sheet rechts 480 px |
| `⋯` (einziges `⋯` im Verkauf) | Lade öffnen · Kundendisplay öffnen · Vollbild · Verwaltung (neuer Tab) · Abmelden · (Leitung) Trainingsmodus · (Leitung) Nullbeleg | Menü 280 px |

**Bänder `BandStapel` (je 40 px):** Eintritt `grid-template-rows` 0fr→1fr `--bo-dur-base` 160 ms `--bo-ease-out`, Austritt 120 ms `--bo-ease-in`; max. 2 sichtbar, weitere über Knopf „+n“ (48 × 48, öffnet Popover mit allen Bändern); nie blinkend; nicht schließbar, solange der Zustand gilt; Icon + Satz + optional ein Knopf. **Während Zahlmaske und Ergebnis-Karte erscheinen neue Bänder Rang 2–9 erst nach Verlassen** (Rang 1 sofort), damit „Kassieren“ nicht wandert. Das Band fängt Tipps ab (`pointerdown` stoppt), darunterliegende Tasten lösen nie aus.

| Rang | Zustand | Farbe | Text (Beispiel) | Knopf | Quelle |
|---|---|---|---|---|---|
| 1 | Zahlung ohne Beleg | `danger` | „Kartenzahlung 129,60 € erhalten, Beleg noch nicht erstellt“ | „Erneut buchen“ | §3.3.6 |
| 2 | Tag abgeschlossen | `neutral` | „Heute abgeschlossen (KA-2026-00143) – keine Belege mehr möglich“ | – (Mitarbeiter) / „Abschluss ansehen“ (Leitung) | `page.kontext.gesperrt` |
| 2a | Abschluss gezählt | `info` | „Abschluss Kassa 1 gezählt – Leitung schließt ab“ | „Übernehmen“ (Bedienerwechsel zur Leitung) | Status Gezaehlt, für alle am Gerät |
| 3 | Kasse nicht aktiv | `warning` | „Kasse nicht aktiv – nur Trainingsbelege“ | „Warum?“ (Checkliste) | `kassen_status` |
| 4 | SEE-Ausfall | `warning`; ab 48 h `danger` | „Signatureinheit ausgefallen seit 09:12 – Belege gültig, werden nachsigniert“ / „… seit 2 Tagen – Leitung meldet an FinanzOnline“ | ab 48 h „Ereignis öffnen“ (Leitung) | `kassen_status.see` |
| 5 | Keine Verbindung | `warning` | „Keine Verbindung – Verkauf erst nach Rückkehr möglich, Bon bleibt erhalten“ | – | §3.12 |
| 6 | Einspielen / Entwurf | `info` / `warning` | „Verbindung wieder da – Vorgänge werden gebucht“ · „Entwurf wird nicht gesichert“ | – | Puffer / IndexedDB |
| 7 | Training | `special` | Text aus `trainings_banner_text`, sonst „Training – Belege ohne Umsatz, kein gültiger Beleg“ | – | `kassen_status.trainings_modus` (zusätzlich Pille im Kopf) |
| 8 | Vortag offen | `warning` | „Abschluss vom 03.11. offen“ | „Nachholen“ (Leitung) | offener Abschluss mit `datum < heute` **und** Belegen/Kassenbuch |
| 9 | Sperre naht | `neutral` | „Sperre in 30 s – tippen, um weiterzuarbeiten“ | – | Idle §3.11 |

**Suchfeld (56 px, ein Feld):** Platzhalter „Artikel, Kunde, Karte, Auftrag …“ (16). Rechts: Mengen-Chip „3 ×“ (nur wenn vorgewählt; Eintritt 120 ms Opazität) · „Tippen“ · **„Bon ▾“** (beschriftet: Parken `Shift+F6` · Verwerfen · Rabatt auf Bon `· Leitung` · „+ Kunde“). Ohne Positionen sind Parken/Verwerfen deaktiviert mit Text.
- Treffer als Popover unter dem Feld, gruppiert, je Gruppe max. 4, Gruppenüberschrift 14 muted: **Artikel** (64 px: Bild 40 · Bezeichnung · Marke · Preis · Steuersatz nur bei Abweichung) · **Kunden** (56 px: Name 16/500 · Firma/Ort 14 muted · Badges „AB offen 2“, „Rechnung offen“) · **Aufträge/Rechnungen** (56 px: Nummer mono · Kunde · offen). Quellen: `page.suche_produkt(q)` und `page.suche_kunde(q)` parallel.
- `Enter`/Scanner-Enter übernimmt den ersten **Artikel**; Kunden werden angetippt oder per `↓` gewählt. Filter-Chip „Kunde:“ (`F2`) beschränkt auf Kunden.
- Reine Ziffernfolgen unter 4 Zeichen lösen keine Suche aus (Mengenvorwahl `1 2 *`).

**Kundenzeile (56 px, nur mit Kunde; Eintritt 160 ms `--bo-ease-out`, `opacity` + `translateY(4px)`):** Name · Stufen-Pille (`lookup_card.stufe`, Farbe `stufe_farbe`) · Chips wischbar rechts · `×` (48 × 48) entfernt Kunde **sofort** mit Undo-Toast „Kunde und 1 Anzahlung entfernt · Rückgängig“ (6 s). Ohne Kunde entfällt die Zeile; der Kopf der Positionsliste zeigt „Laufkunde“ (14 muted).
- **Offen-Chips** (48 px):
  - „Anzahlung AB-… · X € fällig“ aus `_auftraege` (`anzahlung_offen_cent`) → Position `Anzahlung`, Betrag änderbar (kleiner = `Teilzahlung`; größer als offen → „übersteigt das Soll um …“ + „Zur Freigabe · Leitung“). Steuersatz aus `_auftrag_steuersatz`, sonst `steuersatz_anzahlung`. **Gemischte Sätze** in der AB: zwei Positionen `Anzahlung` im Verhältnis der Netto-Werte je Satz, sobald `_auftraege` die Aufteilung liefert (P18); bis dahin Chip deaktiviert „AB mit zwei Steuersätzen – Anzahlung nimmt das Büro an“ + Aufgabe. Mit `vertragsort = Beim Kunden` (Feld an `PH Auftragsbestaetigung` vorhanden; `_auftraege` muss es liefern) Zeile „Vertrag außerhalb des Geschäfts – Rücktrittsrecht bis `fagg_frist_ende`“.
  - „Teilrechnung 2 von 3 · RE-… · X € offen“ aus `_rechnungen` → Position `Teilzahlung`/`Schlusszahlung` mit `rechnung`. Steuersatz je Satz aus `_rechnungen.je_satz` (P18); bis dahin nur Rechnungen mit **einem** Satz kassierbar, sonst Chip deaktiviert „Rechnung mit mehreren Steuersätzen – Zahlung nimmt das Büro an“ + Aufgabe.
  - „Bestellung PH-S-… · abholbereit“ aus `_bestellungen`: nur Status. Mit `bestellung_kassieren`: ohne Shop-Rechnung → Positionen der Bestellung, danach Bestellung bezahlt; mit Rechnung → Position `Schlusszahlung` mit `rechnung` (R6). Ohne Fähigkeit bei `zahlung_ausstehend`: Text „Zahlung offen – Leitung informiert“ (Aufgabe).
- **Vorteil-Chips** (`vorteile[].titel`, Rest „1 von 2“ aus `verbleibend`; nur `verfuegbar = true` aktiv): Antippen = **vormerken** (Chip `accent-soft` + Haken-Icon, `aria-pressed="true"`; Satz „wird mit dem Beleg eingelöst“ als Zeile **unter** der Kundenzeile, Chipbreite bleibt). Einlösung erst nach Buchung.
- Kunde gewählt, Kundenkarte vorhanden, nicht gescannt: Chip „Karte KK-… am Beleg hinterlegen“.

**Schnelltasten:** Reihe 56 px, wischbar: Lieferpauschale (Freitext „Lieferung“, Normal 20, Betrag leer; nur Inlandslieferung – Hilfe-Text R13) · Gutschein (`F6`, Fähigkeit `gutschein_verkauf`) · Anzahlung (`F5`) · Freitext (`F4`) · Musterverkauf (Freitext „Ausstellungsstück“ + Pflicht-Zusatz). **Leerer Bon:** dieselben Tasten als Kacheln 120 × 88 (Icon 24, Titel 16/500) in 2 Reihen; mit der ersten Position werden sie zur Reihe (ohne Animation). Konfigurierbare Schnelltasten je Kasse: DocType `PH Kassa Schnelltaste` **fehlt in App ph_kassa**; bis dahin feste Reihe.

**Positionsliste (`role="grid"`):**
- Zeile 64 px: Bild 40 (Freitext `pencil`, Anzahlung `banknote`, Gutschein `ticket`, Retoure `undo-2`) · Bezeichnung 18/500 + Zusatz/Einzelpreis 14 muted · Stepper `[–] n [+]` 48 × 48 · Betrag 18/600 tabular · Steuersatz **nur** wenn ≠ `standard_steuersatz`, als Wort „10 %“ (14 muted). `Besonders 19` ist im Kiosk nicht wählbar (R13).
- Stepper `–` bei Menge 1 = Entfernen (Toast mit Undo). Anzahlung/Zahlung/Gutschein ohne Stepper.
- Wischen nach links (≥ 96 px) zeigt beschriftete Aktion „Entfernen“ (`danger`); Loslassen über Schwelle entfernt mit Undo. Langdruck 400 ms / `Shift+F10` = Zeilenmenü (Zeilenblatt · Entfernen · Rabatt `· Leitung`).
- Zeile antippen/`Enter` → **Zeilenblatt** (Sheet über der rechten Spalte, Eintritt `translateX(16px)` → 0 + Opazität, `--bo-dur-move` 200 ms `--bo-ease-out`; Austritt 120 ms): Menge (Zahlen-Tastatur, 4. Spalte `+1` `+5` `+10`), Einzelpreis (**schreibgeschützt bei Artikeln**; daneben „Preis ändern · Leitung“ mit Grund-Chip; frei nur bei Freitext/Musterverkauf), Rabatt % oder € (`· Leitung`; Grund-Chips Ausstellungsstück · Kulanz · Aktion; mit `rabattfelder` in `listenpreis_cent`, `rabatt_promille`/`rabatt_cent`, `rabatt_grund`, sonst `einzel_brutto_cent` + `zusatz` „Rabatt 15 % Ausstellungsstück, Listenpreis 34,90 €“), Zusatztext, Steuersatz (nur Freitext), „Entfernen“, „Übernehmen“. **Bon-Rabatt** wird als Zeilenrabatt auf alle Zeilen verteilt gespeichert (Retoure anteilig korrekt).
- Neue Zeile: Eintritt 120 ms + linker Balken `success` 1500 ms. Doppelt gescannt: Menge +1, Zeile `warning-soft` 1200 ms **und** sichtbarer Text unter dem Suchfeld „Vase Alva jetzt 4 Stück“ (14, `warning-text`, 1500 ms). Unbekannt: Suchfeld-Rahmen `danger` + Shake 240 ms (Reduced Motion: nur Farbe) + Text „Code 4006381333931 unbekannt“ + Taste „Als Freitext erfassen“.
- Entfernen: `abgang()` 120 ms `--bo-ease-in`, Toast „Position entfernt · Rückgängig“ 6 s.
- **Gesperrt** (Karte läuft/bezahlt, Zahlung ohne Beleg): `aria-disabled="true"`, Stepper aus, Kopf der Liste „Zahlung läuft – Bon gesperrt“.

**Summenpanel (rechte Spalte, Zustand „Bon“):**
- „GESAMT“ 14 muted · Betrag 44/600 tabular. Änderung: Direktwechsel, `color` → `accent-text` 160 ms und zurück.
- Netto/USt-Summe 14 muted, darunter eine Zeile je Steuersatz mit Betrag > 0.
- `ZahlartRaster` 2 × 2 (je ≈ 176 × 56, Icon 24 + Wort 16/500): **Bar** (`banknote`) · **Karte** (`credit-card`) · **Gutschein** (`ticket`; Einzweck: „Gutschein einlösen“, §3.3.5) · **Andere ▾** (Popover: „Karte extern“ · „Überweisung“ [Fähigkeit `ueberweisung`, nur mit Kunde]). Antippen → Zahlmaske mit vollem Rest auf dieser Zahlart (vorher ggf. Frage §3.4).
- „Geparkt (n) ▸“ nur ab n ≥ 1.
- **„Kassieren 129,60 €“** 64 px primary, ab 1 Position aktiv = Zahlmaske mit Bar (`F12`). Leerer Bon: deaktiviert, zweite Zeile „Zuerst eine Position“; Zahlart-Tasten ebenso.

**Zustände der Seite:**

| Zustand | Darstellung |
|---|---|
| Laden | Skelett (Suchfeld, 3 Zeilen, Summenpanel) erst nach 300 ms (`--bo-spinner-delay`) |
| Tagesstart offen | Karte „Wechselgeld“ über der Positionsliste (§3.7.1); Verkauf möglich, Karte bleibt bis bestätigt |
| Bereit (leer) | Schnelltasten-Kacheln + Zeile „Artikel scannen oder suchen.“ |
| Bon | Wireframe |
| Zahlmaske / Ergebnis | §3.3 / §3.10 |
| Gesperrt (Tag abgeschlossen) | Band 2, Suchfeld deaktiviert „Heute abgeschlossen“, Zahlart-Tasten aus, Belege/Bargeld lesbar |
| Training | Pille + Band 7, Ergebnis-Karte `special-soft` |
| Fehler beim Buchen | Servertext `danger-text` unter Kassieren (`aria-describedby`), Bon bleibt **immer** erhalten |

### 3.2 K1 – Verkauf 768–1099 px (iPad hochkant, iPad 10,2" quer)

```
┌──────────────────────────────────────────────┐
│ Kassa 1  Anna K.▾ 14:05 ● [TRAINING] [▤ Belege][☑ Abschluss][?][⋯] │ 56
├──────────────────────────────────────────────┤
│ ⌕ Artikel, Kunde, Karte, Auftrag … [Tippen][Bon ▾]│ 56
│ Maria Muster · Silber · [Anzahlung 3.200 €] ▸ × │ 56 (nur mit Kunde, Chips wischbar)
│ [Lieferpauschale][Gutschein][Anzahlung][Frei…▸ │ 56
│ [▣] Vase Alva          [–] 3 [+]   89,70 €   │ 64
│ [▣] Kissen Lino        [–] 1 [+]   39,90 €   │
│   ┌ Position entfernt · Rückgängig ┐         │ Toast über der Summenleiste, Breite − 32
├──────────────────────────────────────────────┤
│ Gesamt 129,60 €   [Bar] [Karte] [Andere ▾]   │ 72 sticky unten, Safe-Area
└──────────────────────────────────────────────┘
```

- Summenleiste 72 px sticky (Gesamt 32/600). „Andere ▾“ = Gutschein, Karte extern, Überweisung. Kein eigener Kassieren-Knopf: „Bar“ ist der Weg zu Kassieren.
- Kopf: Belege und Abschluss mit Wort (14 px); „Bargeld“ im `⋯`; Hilfe `?` mit `aria-label`.
- Zahlmaske, Zeilenblatt, Rechnungsfrage: Vollbild-Sheet von unten (`translateY(16px)` → 0, 200 ms `--bo-ease-out`), Kopf mit „‹ Bon“.
- Unter 768 px: Seite „Die Kassa braucht ein Tablet oder einen Monitor“ + Links „Belege heute (lesen)“, „Verwaltung“.

### 3.3 K3 – Zahlmaske (rechte Spalte, ≤ 568 px ohne Split)

```
┌──────────────────────────────────────┐
│ ‹ Bon     Offen  0,00 €  ✓ gedeckt   │ 56 (Esc; gesperrt während Karte läuft/bezahlt)
├──────────────────────────────────────┤
│ Karte   29,60 €   ✓ Bezahlt · Tresen │ 48 (nur bei Split)
│ Bar    100,00 €   gegeben 150,00 €   │ 48  Rückgeld 50,00 € (20/600, rechts)
│                          + Zahlart ▾ │ 32 Textknopf (F10)
├──────────────────────────────────────┤
│ ┌──────────────────────────────┬──┐  │
│ │ Gegeben           150,00 €   │× │  │ 56 (Label im Feld, × = löschen, Entf)
│ └──────────────────────────────┴──┘  │
│ ┌────┬────┬────┬──────────────┐      │  Kopf der 4. Spalte „Sofort kassieren“ 14 muted
│ │ 7  │ 8  │ 9  │  Passend     │      │ 64
│ │ 4  │ 5  │ 6  │  200 €       │      │ 64
│ │ 1  │ 2  │ 3  │              │      │ 64
│ │ 0  │ 00 │ ,  │  ⌫           │      │ 64
│ └────┴────┴────┴──────────────┘      │
│ ┌──────────────────────────────────┐ │
│ │ Kassieren · Rückgeld 50,00 €     │ │ 64 primary; 300 ms Eingabesperre nach Öffnen
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

Zustand Karte (Reader wartet):

```
│ Karte   129,60 €   ● Wartet auf Karte · Tresen │ 48  (Punkt statisch warning)
│ [           Kartenzahlung abbrechen          ] │ 56  Fokus
│ Noch keine Karte – weiter warten oder abbrechen│ 14  (ab 60 s, warning-text)
│ Bon gesperrt, solange die Zahlung läuft.       │ 14  muted
```

Höhe ohne Split (eine Zahlart-Zeile, ohne „+ Zahlart“-Abstand): **568 px**; mit Split 648 px. K5 prüft 1180 × 820 mit **zwei Bändern + 24 px Safe-Area**: ohne Split kein Scroll; mit Split rückt die Tastatur in den Scrollbereich, „Kassieren“ bleibt sticky (einzige erlaubte Scroll-Situation). Wechsel Bon ↔ Zahlmaske ohne Animation (nur Fokuswechsel); die linke Spalte bleibt sichtbar.

**Beim Betreten** (Zahlart-Taste, „Kassieren 129,60 €“, `F10`, `F12`): Prüfung Rechnungsfrage (§3.4) – bei jeder Rückkehr Bon → Zahlmaske erneut, **nie nach Terminalstart**.

#### 3.3.1 Betragseingabe (ein Modell) und Zahlen-Tastatur

Taschenrechner mit Komma: `1 2 9` = 129,00 € · `1 2 9 , 6` = 129,60 € · `00` hängt zwei Nullen an · `⌫` löscht eine Stelle · `×` im Anzeigefeld (48 px, `aria-label="Betrag löschen"`, Taste `Entf`) löscht alles · max. zwei Nachkommastellen (dritte Ziffer wird ignoriert + Ansage). Ein vorbelegter Wert ist markiert: die erste Ziffer überschreibt. Die Zahlen-Tastatur erscheint nur mit Anzeigefeld.

| Kontext | 4. Spalte (Zeilen 1–3) | Zeile 4 |
|---|---|---|
| Zahlmaske Bar | Schnellbeträge (bis 3), Kopf „Sofort kassieren“ | `⌫` |
| Zahlmaske Karte / Gutschein / Überweisung / Karte extern | ausgeblendet, Ziffern breiter | `0 · 00 · , · ⌫` |
| Zeilenblatt Menge | `+1` · `+5` · `+10` | `⌫` |
| Zählfeld (Abschluss) | `+1` · `+10` · `Rolle` | `↵` (nächste Zeile) |
| Bargeld | `50` · `100` · `200` (setzen den Betrag) | `⌫` |
| Freitext / Gutschein-Betrag | `25` · `50` · `100` (Gutschein: übernimmt sofort) | `⌫` |

#### 3.3.2 Bar

- **Eine Regel: jeder Schnellbetrag bucht sofort** (alle sind ≥ Rest). Kandidaten in dieser Reihenfolge, Duplikate entfallen, höchstens 3: Passend · Aufrundung auf den nächsten vollen 10er · nächster Schein ≥ Rest (5/10/20/50/100/200/500) · nächsthöherer Schein. Beispiele: 129,60 → Passend · 130 € · 200 € · 50,00 → Passend · 100 € · 7,90 → Passend · 10 € · 20 € · 100,00 → Passend · 200 €.
- Getippter Betrag + „Kassieren“/`Enter`. „Gegeben“ ist mit dem Rest vorbelegt: „Kassieren“ ohne Eingabe = passend.
- Rückgeld in der Bar-Zeile (20/600) und auf der Ergebnis-Karte (44/600) mit Stückelung „1 × 20 €, 2 × 20 ct“. Client rechnet mit `lib/backoffice/kassa/betraege.js` (Port von `logik/betraege.py`, gleiche Testfälle); der Server bestätigt über `page.beleg_vorschau`.
- Lade öffnet mit dem Bondruck (`schublade_oeffnen`).
- Gegeben < Rest → Kassieren deaktiviert, Text „Noch 29,60 € offen“.

#### 3.3.3 Split (Regel)

Jede Split-Zeile hat einen **Anteil**. Nur Bar hat zusätzlich **gegeben** (≥ Anteil) und **Rückgeld**. Unbare Zahlarten zuerst erfasst, Bar nimmt den Rest. Wird Bar zuerst erfasst, ist der getippte Betrag der Bar-Anteil (kein Rückgeld), und „+ Zahlart“ übernimmt den Rest. Beispiel: Gesamt 129,60 · Karte 29,60 · Bar-Anteil 100,00 · gegeben 150,00 · Rückgeld 50,00. Überzahlung ohne Bar → Fehler aus `zahlarten_pruefen` unter der letzten Split-Zeile (`danger-text`, 16, `role="alert"`). Split-Zeile entfernen: `×` 48 px, außer Karte bezahlt.

#### 3.3.4 Karte (Stripe Terminal)

| Schritt | Verhalten | Methode |
|---|---|---|
| Start | „Karte“ (Kachel oder `Enter` im Popover): **Standard-Terminal** des Geräts startet sofort mit dem Rest. Kacheln (Bezeichnung, Status) nur, wenn der Standard offline/beschäftigt ist | `page.terminal_start(kasse, terminal, betrag_cent)` |
| Ab Start | **Bon gesperrt** (Positionen, Kunde, Split); „‹ Bon“/`Esc` = Abbrechen-Dialog; Scans → „Scan ignoriert – Zahlung läuft“ | Kiosk |
| Wartet auf Karte | Zeile „● Wartet auf Karte · Tresen“ (Punkt statisch `warning`); darunter **„Kartenzahlung abbrechen“** 56 px volle Breite, Fokus | Polling `page.terminal_status` alle 2 s |
| 60 s ohne Karte | Zeile `warning-text` „Noch keine Karte – weiter warten oder abbrechen“ | Kiosk-Timer |
| 180 s ohne Karte | automatischer Abbruch **nur im Reader-Zustand „wartet auf Karte“**, Toast „Kartenzahlung nach 3 Minuten abgebrochen“ | `page.terminal_abbruch` |
| Verarbeitet / PIN-Eingabe | Text „Wird verarbeitet …“, **kein Timer**, Abbrechen deaktiviert mit Text „Kunde gibt PIN ein“ | – |
| Bezahlt | Haken 400 ms (`--bo-dur-draw`, einmal), „✓ Bezahlt“, Kassieren wird primary + Fokus nach 300 ms; Ansage „Karte bezahlt“. „‹ Bon“/`Esc` deaktiviert mit Text „Erst kassieren“. Mit `karte_automatisch_buchen` bucht der Kiosk sofort | – |
| `Esc` während Warten | Dialog „Kartenzahlung 29,60 € abbrechen?“ [Weiter warten] (Fokus) [Abbrechen] | – |
| Abgebrochen / fehlgeschlagen | Zeile `danger`, Text aus Server (`TerminalFehler.meldung`), Tasten „Nochmals“ · „Andere Zahlart“; Bon wieder frei | – |
| Reader offline | Zeile „Terminal ‚Tresen‘ offline“ + Vorschlag „Karte extern buchen“ (Zahlart `Karte extern`) | `PH Terminal.status` |
| Testmodus | Knopf „Zahlung simulieren“ mit `special`-Rahmen | `page.terminal_simulieren(terminal, erfolgreich)` |

Der Server prüft beim Buchen Intent-Status und Betrag (`page.beleg_buchen`). Deshalb bucht der Kiosk **nie** über `rksv.api.beleg_buchen` (prüft kein Terminal). Mit `idempotenz` lehnt der Server einen Intent ab, der schon an einem gebuchten Beleg hängt, und liefert den vorhandenen Beleg (Kiosk zeigt dann dessen Ergebnis-Karte).

#### 3.3.5 Gutschein (zwei Pfade nach `PH Kassa Einstellungen.gutschein_art`)

| | Mehrzweck (heutige Einstellung) | Einzweck |
|---|---|---|
| Verkauf | Position `Gutschein Verkauf`, Server setzt `Null 0`; **kein Umsatz** (Report-Zeile „Mehrzweck-Gutschein – kein Umsatz“, §4.10) | Position mit `standard_steuersatz` – Page setzt heute nichts → Lücke ph_kassa |
| Code | nach Buchung `sell_voucher` je Position (E11) → Ergebnis-Karte „Gutschein …1234 · 50,00 € [Drucken] [Per E-Mail]“ | gleich |
| Einlösung | Zahlart „Gutschein“ (Feld „Gutschein scannen oder Code eingeben“, Fokus) → `gutschein_pruefen` → Karte „Gutschein …1234 · Restwert 50,00 € · gültig bis …“ → Betrag = min(Rest, offen), nach unten änderbar; mehrere Gutscheine möglich | Taste „Gutschein einlösen“ fügt Position `Gutschein Einloesung` (negativ, Steuersatz des Gutscheins) ein |
| Fehler | ungültig/gesperrt/aufgebraucht: Rahmen `danger` + Shake 240 ms + Servertext | gleich |
| Offline | Feld deaktiviert „Offline – Gutschein nicht prüfbar“ | gleich |
| Regel | Verkaufen und im selben Bon einlösen gesperrt („Ein Gutschein gilt erst nach dem Beleg“) | gleich |

`gutschein_pruefen` muss `art` und `steuersatz` liefern – **fehlt in App ph_shop**.

#### 3.3.6 „Zahlung erhalten – Beleg offen“ (schwerster Fehlerfall)

Auslöser: Terminal meldet bezahlt, `beleg_buchen` scheitert (Netz, Server, Sperre, Validierung) **oder** beim Kiosk-Start meldet `kontext` einen bezahlten Intent ohne Beleg (`PH Terminal.letzte_zahlung_status = succeeded`, kein Beleg mit diesem Intent).

| Element | Verhalten |
|---|---|
| Bon | gesperrt; Entwurf aus IndexedDB wiederhergestellt |
| Band 1 `danger`, `role="alert"` | „Kartenzahlung 129,60 € erhalten, Beleg noch nicht erstellt“ |
| Automatik | 3 Versuche nach 2 / 4 / 8 s (02 §7.2), Text „Versuch 2 von 3 …“, gleicher `idempotency_key` (`kasse:geraet:entwurf-uuid`) |
| Primär | „Erneut buchen“ (Servertext darunter, `aria-describedby`) |
| Sekundär | „Als zu klären ablegen“: Entwurf + Intent in den lokalen Puffer (IndexedDB, `idempotency_key`); Aufgabe an Leitung sofort oder nachgereicht; Bon wird frei für den nächsten Kunden; Band bleibt als „1 Kartenzahlung wartet auf Beleg“ (Rang 1, `warning`), bis gebucht |
| Kunde | Feld „E-Mail für den Beleg“ (optional, `data-scan="nein"`); Text an der Theke: „Die Zahlung ist angekommen. Den Beleg schicken wir per E-Mail oder drucken ihn nach.“ |
| Bedienerwechsel, Idle-Sperre | gesperrt bzw. ausgesetzt |

Voraussetzung für Echtbetrieb: Fähigkeit `idempotenz` (P8). Bis dahin verhindert der Kiosk Doppelbuchungen durch Tastensperre ab dem ersten Tipp, 300-ms-Sperre und den lokalen Schlüssel.

#### 3.3.7 Überweisung, Karte extern, Bar ab 10.000 €, Regeln

- **Überweisung** (Fähigkeit `ueberweisung`): nur mit Kunde; Zeilentext „Kunde überweist bis 18.11. – offene Forderung“; Beleg erzeugt `PH Zahlung.status = Offen` und Forderung in Faktura (P14). Ohne Fähigkeit: deaktiviert „Kommt mit dem nächsten Backend-Stand – Kauf auf Rechnung macht das Büro“.
- **Karte extern**: Betrag + Pflicht-Haken „Beleg vom externen Gerät liegt vor“ – für Reader-Ausfall.
- Bon voll mit Gutschein bezahlt (0,00 € offen) erlaubt, heißt nicht „Nullbeleg“. Gesamt negativ nur bei Retoure. `Esc` zurück zum Bon ohne Verlust der Split-Zeilen, **außer** Karte läuft (Dialog) oder bezahlt (gesperrt).
- **Bar ab 10.000 €** (Summe der Bar-Anteile dieses Belegs **und** aller Belege zum selben `auftrag`/`rechnung`, Fähigkeit `bar_vorgang`): Pflichtschritt „Identität festgestellt“ (Ausweisart, Nummer, Name; bis ph_crm-Felder: Notiz in `zusatz`) mit Freigabe Leitung. Ab dem Datum `bar_obergrenze_ab` (Einstellung, Vorschlag 2027-07-10, StB bestätigt): harter Stopp mit Text „Barzahlung ab 10.000 € ist nicht erlaubt – bitte Karte oder Überweisung“.

### 3.4 K3b – Rechnungsfrage und Rechnungsempfänger

**Auslöser:** Betreten der Zahlmaske bei `gesamt_cent > barverkauf_rechnung_ab_cent` (Vergleich **größer**, § 11 Abs 6 UStG „nicht übersteigt“) **und** kein Kontakt am Bon **und** Frage für diesen Bon noch nicht beantwortet. Retouren und Zahlungen auf bestehende Rechnung lösen nicht aus. Mit Kontakt: keine Frage; Kontakt mit Firma/UID setzt „Rechnung auf Firma“ automatisch.

```
┌ Rechnung auf eine Firma? ───────────────────────────┐
│ Für Privatkäufe genügt der Kassenbeleg.              │
│ [Ja – Empfänger erfassen]      [Nein, Privatkauf]    │ Primär = Nein, Fokus
└──────────────────────────────────────────────────────┘
          ▼ „Ja“
┌ Rechnungsempfänger ─────────────────────────────────┐
│ ⌕ Firma oder Kunde suchen …                          │
│ ─ oder neu ─                                         │
│ Firma / Name*      [                          ]      │
│ Straße*            [                          ]      │
│ PLZ* [      ]  Ort* [                       ]        │
│ UID                [ ATU…                    ]       │ Pflicht ab uid_empfaenger_ab_cent (10.000 €)
│ E-Mail (für Beleg) [                          ]      │
│ [Zurück]                               [Weiter]      │
└──────────────────────────────────────────────────────┘
```

- „Nein, Privatkauf“ → Zahlmaske, keine Daten gespeichert. „Zurück“ führt zum **Bon**, nie in die Zahlmaske.
- „Ja“: gewählter Kontakt → `kontakt`; Neuanlage (Fähigkeit `kunde_anlegen`) → `PH Kontakt` mit `quelle = showroom`, Notiz „angelegt an Kassa 1, Zweck Rechnung“, keine Marketing-Einwilligung. Ohne Fähigkeit: nur Suche; Leer-Text „Keine Firma ‚Huber‘ gefunden. Neue Firmenkunden legt das Büro an – die Leitung ist informiert.“ + Aufgabe; der Verkauf geht als Privatkauf weiter oder wird geparkt.
- Mit `rechnung_snapshot`: `rechnung_gewuenscht = 1`, `empfaenger_name`, `empfaenger_anschrift`, `empfaenger_uid` am Beleg (RO); A4 liest diese Felder. Ohne: Rechnung auf Firma nur mit Kontakt; das A4-PDF wird bei der Buchung erzeugt und am Beleg abgelegt (`druck_pdf`), damit der Nachdruck reproduzierbar bleibt.
- Ergebnis: Bon trägt „Rechnung siehe A4-Beleg“; A4 mit Anschrift, UID Aussteller (`PH Firma.uid`), Netto/USt je Satz, Leistungsdatum, „Rechnung – bezahlt“ (Erweiterung `PH Kassenbeleg A4` fehlt in App ph_kassa). Ohne E-Mail druckt A4 automatisch.
- „+ Kunde“ (Bon ▾ / Trefferliste) öffnet denselben Empfänger-Dialog ohne Frage.

### 3.5 K14 – Retoure (Assistent, Fähigkeit `retoure`; `Shift+F7` / Belege → „Zurücknehmen“)

Zweck: Ware kommt später zurück, ganz oder teilweise, evtl. andere Kasse/anderer Bediener. Storno bleibt für Fehlbuchungen.

| Schritt | Inhalt | Fehler/Leer |
|---|---|---|
| 1 Beleg | Bon-QR/Nummer scannen oder suchen (Nummer, Betrag, Kunde, Datum; alle Kassen, Standard 90 Tage) → `retoure_laden(beleg)` | „Kein Beleg gefunden“ + „Ohne Beleg zurücknehmen · Leitung“ (Preis-Nachweis aus `PH Produkt`, Auszahlung **nur Gutschein**) |
| 2 Zeilen | Positionen mit Stepper „zurück 0 … n“, Taste „Alle“; bereits zurück: „1 von 3 bereits zurück“; Einzelpreis = bezahlter Preis nach Rabatt; Original älter als 12 Monate: Hinweis | nur Anzahlung/Gutschein: „Anzahlungen und Gutscheine nimmt das Büro zurück – Leitung ist informiert“ (Aufgabe) |
| 3 Grund | Chips Umtausch · Kulanz · Mangel · Rücktritt (FAGG) · Sonstiges (+ Text). „Rücktritt (FAGG)“ nur mit Frist (`fagg_frist_ende` der AB bzw. Bestellung, `vertragsort`); abgelaufen: Text „Rücktrittsfrist am 20.10. abgelaufen“ | Pflicht |
| 4 Auszahlung | **Standard je Grund:** Umtausch/Kulanz → „Gutschein ausstellen“ (Retoure −X + `Gutschein Verkauf` +X, Beleg 0,00 €) oder „Umtausch“ (zurück zum Bon mit Retoure-Zeile). Mangel/FAGG → **ursprünglicher Zahlungsweg** aus `retoure.erstattungsweg_vorschlag` (bar aus der Lade ohne Freigabe; Karte über `terminal_erstatten`); Gutschein nur mit Haken „Kunde wünscht ausdrücklich einen Gutschein“ (gespeichert in `zusatz`). Bar außerhalb dieser Regel (z. B. Kulanz bar) → „Zur Freigabe · Leitung“ | Karte ohne `terminal_erstatten`: „Die Erstattung auf die Karte macht die Leitung – Aufgabe angelegt“; Bar über Lade-Bestand: Warnzeile (E8) |
| 5 Ergebnis | Ergebnis-Karte: Beleg, Gutschein-Code (Drucken Pflicht, wenn keine E-Mail) oder Rückgeld | – |

Server (Fähigkeit): Select `art` + `Retoure`, `bezug_zeile`, `retoure_laden`, `retoure_buchen(beleg, auswahl, grund, auszahlung)`; `ruecknehmbar` schließt stornierte Retouren aus. Shop-Bestellung (Fernabsatz): Grund „Rücktritt (FAGG)“ vorbelegt, Erstattung über ph_shop (Stripe), nicht Kassa-Bar – Text „Die Erstattung läuft über den Shop – Leitung ist informiert“. Kundenkarten-Vorteil: `revoke_benefit` (Fähigkeit), sonst Hinweis + Aufgabe. Kunde ohne Kontakt, Retoure bar über einer Grenze: Name + Unterschrift auf dem Retourebeleg (Inhaber-Entscheidung, Grenze `bar_identitaet_ab_cent`). **Übergang ohne Fähigkeit:** Retoure-Knopf nur für Leitung, Weg „Beleg korrigieren“ (A16).

### 3.6 K6 – Storno (Freigabe am Ende)

```
┌ Beleg K1-000118 über 89,70 € stornieren? ─────────────────┐
│ Es entsteht ein Stornobeleg mit neuer Nummer.             │
│ Grund*  [Fehlbuchung] [Falscher Preis] [Doppelt] [Falsche Zahlart] [Sonstiges] │
│ Kunde will zurückgeben?  [Zurücknehmen]                   │ 14, Taste 48
│ Rückzahlung  Bar 89,70 € – Lade öffnet nach der Freigabe  │
│ [Abbrechen]                  [lock Zur Freigabe · Leitung] │
├───────────────────────────────────────────────────────────┤  ← gleicher Dialog, Schritt 2
│ Freigabe durch   [ML Maria L.] [TB Thomas B.]             │
│ PIN  ● ● ● ●  ○ ○                [Ziffernblock 64 px]     │ ohne bediener_sitzung: Passwort-Feld
│ Freigabe endet in 15 s  [Weiter]   (ab 45 s)              │
│ [Zurück]                                   [Stornieren]   │ danger-solid, Fokus „Zurück“
└───────────────────────────────────────────────────────────┘
```

- **Rechte:** Server `storniere_beleg` erlaubt nur `PH Kassa Leitung` (`ROLLEN_STORNO`). Mitarbeiterin füllt Schritt 1, Leitung bestätigt in Schritt 2; ist die Leitung selbst angemeldet, entfällt Schritt 2 (Knopf heißt „Stornieren“). Mit `storno_mitarbeiter` (Inhaber + Server): eigene Belege von heute bis zur Obergrenze ohne Schloss.
- **Nicht stornierbar** (Server): Stornobeleg, Nullbeleg, Start-/Monats-/Jahres-/Schlussbeleg, Sammelbeleg, bereits storniert, Kasse heute abgeschlossen. Knopf fehlt; Detail nennt den Grund als Text.
- **Gesperrt mit Text + automatischer Aufgabe:** Kartenbelege ohne `terminal_erstatten` („Kartenbeleg – die Erstattung auf die Karte macht die Leitung. Aufgabe angelegt.“) · Belege mit Anzahlung/Zahlung auf Rechnung ohne `storno_ursprung` (E2) · Gutschein-Verkauf, wenn Restwert < Wert („Gutschein bereits teilweise eingelöst – Zurücknehmen statt Storno“).
- **Rückzahlungszeilen je Zahlart:** Bar „aus der Lade auszahlen (Lade öffnet)“ · Gutschein-Einlösung „Restwert wird gutgeschrieben“ (Server bucht `storniere_einloesung` im Stornobeleg – vorhanden) · Gutschein-Verkauf „Gutschein wird gesperrt“ (`cancel_voucher_sale` in der Leitungs-Sitzung) · Karte „Erstattung auf die Karte wird angestoßen“ (mit Fähigkeit: Refund **vor** Belegerzeugung; Refund scheitert → kein Stornobeleg, Fehlertext; Refund gelingt, Beleg scheitert → Zustand „Erstattet – Beleg offen“ analog §3.3.6) · Kundenkarten-Vorteil „Vorteil wird zurückgegeben“ (`vorteil_zuruecknehmen`) bzw. „Vorteil bleibt verbraucht – Leitung informiert“.
- **Storno an anderer Kasse:** Gegenbeleg in der Kette der Ursprungskasse; Text „Storno läuft über die Kette von Kassa 1“.
- Nach Storno: Toast „Stornobeleg K1-000125 erstellt · Drucken“; automatischer Druck bei `automatisch_drucken`. Lade bei Bar-Rückzahlung: `page.storno` druckt heute ohne `schublade=True` (fehlt in App ph_kassa) → bis dahin öffnet der Kiosk nach Erfolg die Lade (protokolliert).
- Zeitleiste: „Storno durch Maria L. (Freigabe) am Gerät von Anna K., Grund Fehlbuchung“ (Server-Ergänzung `freigabe_durch`/`am_geraet_von` fehlt in App ph_kassa; Übergang: Kommentar aus der Leitungs-Sitzung).
- Storno eines Retoure-Belegs ist erlaubt (Fehlbuchung); die Mengen werden wieder rücknehmbar. Keine Massen-Stornos.

### 3.7 K7 – Bargeld (`/kassa/bargeld`, `F8`)

#### 3.7.1 Tagesstart (einzige Stelle für den Anfangsbestand)

Beim **ersten Bedienerlogin des Tages** an der Kasse (für heute ist kein Anfang bestätigt) erscheint über der Positionsliste:

```
┌ Wechselgeld in der Lade ───────────────────────────────┐
│ 150,00 €  (aus Abschluss 03.11., KA-2026-00143)         │ 32/600
│ [Anders gezählt · Leitung]                    [Stimmt]  │ Primär „Stimmt“
└────────────────────────────────────────────────────────┘
```

- Wert: mit `anfang_server` `bargeld_ende_cent` des letzten Abschlusses + Einlagen/Entnahmen seither; Übergang (E6): `bargeld_ist_cent` + Einlagen − Entnahmen seit `geschlossen_am`.
- „Stimmt“ → Abschluss für heute wird über `abschluss_laden` eröffnet; Anfang mit Quelle „Vortag“ gemerkt (lokal je Kasse + beim Zählen übergeben). „Anders gezählt“ → Freigabe am Ende mit Grund (Ersteinrichtung · Zählfehler gestern · Sonstiges) → Wert mit Quelle „Leitung“ (`anfang_quelle`, `anfang_grund` – fehlen in App ph_kassa; Übergang: Kommentar am Abschluss).
- Kein Vortagsabschluss (erste Inbetriebnahme): Eingabe mit Zahlen-Tastatur, nur Leitung, Quelle „Ersteinrichtung“.
- Verkaufen ist ohne Bestätigung möglich; die Karte bleibt bis „Stimmt“. Das Segment „Anfangsbestand“ im Bargeld-Dialog **entfällt**; `kassenbuch_buchen("Anfangsbestand")` ruft der Kiosk nie auf.

#### 3.7.2 Einlegen / Entnehmen

```
┌ Bargeld einlegen oder entnehmen ─────────────────────┐
│ [Einlegen] [Entnehmen]                               │ Segment 48, zuletzt genutzt vorgewählt
│ Betrag   ┌──────────────────┬──┐  ┌──┬──┬──┬────┐    │
│          │        200,00 €  │× │  │7 │8 │9 │ 50 │ …  │
│          └──────────────────┴──┘  └──┴──┴──┴────┘    │
│ Zweck*   [Geldtransit Bank] [Geldtransit Tresor] [Ausgabe] [Wechselgeld] [Privatentnahme] │
│ Ausgabe: [Beleg fotografieren]  Steuersatz [20 %]    │ nur bei Zweck Ausgabe
│ ⚠ Mehr als in der Lade (1.112,30 €)                  │ Warnzeile vor dem Tipp (E8)
│ Bargeld in der Lade  1.312,30 € → danach 1.112,30 €  │
│ [Abbrechen]                     [200,00 € entnehmen] │ Knopftext mit Betrag
└──────────────────────────────────────────────────────┘
```

- **Undo statt Rückfrage:** Tipp auf „200,00 € entnehmen“ schließt den Dialog, Toast „Entnahme 200,00 € · Rückgängig“ 6 s mit **verzögertem Commit** (04 §3.6 Variante A). Nach 6 s (oder `flush()` bei Bedienerwechsel, Sperre, Abschluss-Start, Seitenwechsel) → `page.kassenbuch_buchen(kasse, art, betrag_cent, grund)`, danach Lade öffnen. Rückgängig = keine Buchung, keine Lade. Commit scheitert → Toast `danger` „Entnahme nicht gebucht – <Servertext>“ + „Erneut“.
- **Zweck** (`kassenbuch_zweck`: Feld `zweck`, sonst Präfix in `grund`): Einlegen erlaubt Wechselgeld · Geldtransit Bank · Geldtransit Tresor; Entnehmen alle fünf. Privatentnahme nur mit Freigabe. **Ausgabe** verlangt Foto des Eingangsbelegs (`<input type="file" accept="image/*" capture>` → Frappe-Anhang an der Buchung; mit Fähigkeit Feld `anhang`) und Steuersatz (`ust_satz`); ohne Foto: Buchung möglich, Aufgabe an Leitung „Eingangsbeleg nachreichen“ (BAO § 132, UStG § 12).
- **Bargeld in der Lade** (eine Zahl, überall gleich): mit `kassenbuch_barbelege` = `letzter_bestand`; Übergang = Anfang heute (Tagesstart) + Bar-Saldo der Belege seit Eröffnung (`abschluss_laden().bar_einnahmen_cent − bar_ausgaben_cent`) + Einlagen − Entnahmen heute.
- Entnahme > Bestand: bis P2+P3 Warnzeile, danach Stopp mit „Zur Freigabe · Leitung“ (R9).
- Fehler (Server, unter dem Feld): Tag gesperrt, Betrag 0, Grund leer.
- „Lade öffnen“ (`⋯`, ohne Buchung): Ereignis „Lade geöffnet“ **fehlt in App ph_kassa**; Übergang: Druckbefehl nur Schublade über den Druckdienst + Kommentar an `PH Kasse`.
- Tresor-Abschöpfung tagsüber (Versicherungsgrenze): Entnahme Zweck „Geldtransit Tresor“ – zählt ins Soll (richtig).

### 3.8 K8 – Tagesabschluss (Assistent A15, `/kassa/abschluss`)

Vollbild. Schrittleiste rollenbezogen: Mitarbeiterin „1 Soll · 2 Zählen · danach Leitung“; Leitung „1 Soll · 2 Zählen · 3 Differenz · 4 Abschöpfen · 5 Unterschrift · 6 Abschließen“. „‹ Zur Kassa“ links (Zustand serverseitig in `PH Kassenabschluss`). Beim Start `flush()` aller verzögerten Bargeld-Buchungen.

**Schritt 1 – Soll** (`page.abschluss_laden(kasse)` → `zusammenfassung()`): Belege n, Stornos n, Training n, je Zahlart, Bar-Einnahmen/-Ausgaben, Einlagen/Entnahmen, Anzahlungen, Gutschein Verkauf/Einlösung, je Steuersatz. **Geparkte Bons:** „2 geparkte Bons (Anna, 11:20 · 3 Positionen · 89,70 €; Maria, 15:02 · …)“ je mit „Weiterführen“ · „Verwerfen“ (Undo). Terminal-Intent ohne Beleg: „1 Kartenzahlung ohne Beleg – zuerst buchen“ (blockiert „Weiter“). **Ohne `abschoepfung`:** Hinweiskarte „Geld in den Tresor? Jetzt über ‚Bargeld › Entnehmen › Geldtransit Tresor‘ buchen und danach den Rest der Lade zählen.“ [Bargeld öffnen]. Leer: „Heute keine Belege. Trotzdem abschließen (Bargeld zählen)?“ [Weiter: Zählen] [Abbrechen]. Ohne `tageswechsel`: Hinweis „Belege nach Mitternacht zählen zum nächsten Tag“.

**Schritt 2 – Zählen (Mitarbeiterin oder Leitung, 1180 × 820):**

```
┌ ‹ Zur Kassa   Abschluss Kassa 1 · Di 04.11.   1 Soll · ❷ Zählen · danach Leitung ─────────────────────┐ 56
├ Scheine ─────────────────────┬ Münzen ───────────────────────┬ Summe ─────────────────────────────────┤
│ 500 €  [ 0 ] [–][+]    0,00  │  2 €  [ 14 ] [–][+]  28,00    │ Gezählt          1.100,12 €            │
│ 200 €  [ 1 ] [–][+]  200,00  │  1 €  [ 22 ] [–][+]  22,00    │ (Soll sieht die Leitung –              │
│ 100 €  [ 2 ] [–][+]  200,00  │ 50 ct [  9 ] [–][+]   4,50    │  „Blind zählen“ ist an)                │
│  50 €  [ 3 ] [–][+]  150,00  │ 20 ct [ 11 ] [–][+]   2,20    │ ┌────┬────┬────┬──────┐                │
│  20 €  [ 9 ] [–][+]  180,00  │▌10 ct [ 7▏] [–][+]   0,70    │ │ 7  │ 8  │ 9  │ +1   │ 64             │
│  10 €  [ 0 ] [–][+]    0,00  │  5 ct [  0 ] [–][+]   0,00    │ │ 4  │ 5  │ 6  │ +10  │                │
│   5 €  [ 0 ] [–][+]    0,00  │  2 ct [  0 ] [–][+]   0,00    │ │ 1  │ 2  │ 3  │ Rolle│                │
│ [Zählliste drucken]          │  1 ct [  0 ] [–][+]   0,00    │ │ 0  │ ⌫  │ ×  │  ↵   │                │
├──────────────────────────────┴───────────────────────────────┴────────────────────────────────────────┤
│ [‹ Zurück]                                                              [Zählung übergeben]  64 sticky │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- 15 Stückelungen aus `STUECKELUNG_CENT`, Zeilen 48 px. **≥ 1100 px: Zahlen-Tastatur fest in Spalte 3** (Soll/Ist 9 × 28 px ≈ 252 px + Tastatur 4 × 64 + 3 × 8 = 280 px passt in 820 px). Aktive Zählzeile `selected` + 2-px-Balken; `↵`/`Enter` springt zur nächsten Zeile, Antippen wählt. < 1100 px: Scheine/Münzen untereinander, Tastatur als Sheet, aktive Zeile per `scroll-margin-bottom: calc(Sheethöhe + 16px)` immer sichtbar.
- „Rolle“ = Münzrolle der aktiven Stückelung (Stückzahlen fest im Client mit Hilfe-Hinweis; Einstellung fehlt in App ph_kassa).
- **Blind zählen** (Schalter `kassa.blind_zaehlen`, Vorschlag an, Inhaber bestätigt): Mitarbeiterin sieht nur „Gezählt“. Aus: über der Tastatur Soll/Ist-Block (Anfang mit Quelle · + Bar-Einnahmen · − Bar-Ausgaben · + Einlagen · − Entnahmen · = Soll · Gezählt · Differenz mit Wort „innerhalb Toleranz“ / „Grund nötig“ / „hoch“ – zweite Schwelle `differenz_warnung_cent` fehlt in App ph_kassa).
- Anfang: Wert aus dem Tagesstart, in diesem Schritt **nicht** änderbar. Übergeben an `abschluss_zaehlen(bargeld_anfang_cent)` nur, solange `anfang_server` aus ist.
- „Zählung übergeben“ → `page.abschluss_zaehlen(kasse, zaehlprotokoll, bargeld_anfang_cent)` → Status Gezaehlt. Mitarbeiterin sieht „Zählung übergeben – die Leitung schließt ab“; am Gerät erscheint Band 2a für alle; Aufgabe „Abschluss Kassa 1 gezählt“ an die Leitung (Zentrale-Glocke).
- **Die Leitung schließt ab** per Bedienerwechsel am Kiosk (Band 2a „Übernehmen“ → `/wechsel` → direkt zurück in Schritt 3) **oder** in der Verwaltung (Abschluss-Akte „Abschließen“ öffnet denselben Assistenten ab Schritt 3). „Freigabe am Ende“ gilt **nicht** für den Abschluss.

**Schritt 3 – Differenz (Leitung):** Betrag 44/600; innerhalb Toleranz „Grund optional“; darüber Pflicht-Chips Wechselgeldfehler · Rückgeld falsch · Storno nicht ausbezahlt · Zählfehler · unbekannt (+ Text) → `differenz_grund`. „Neu zählen“ führt zu Schritt 2. Hinweis: „Die Differenz wird beim Abschließen ins Kassenbuch gebucht.“

**Schritt 4 – Abschöpfen (nur mit `abschoepfung`):** „In der Lade bleiben (Wechselgeld)“ [Betrag, Vorschlag = Anfang heute] → „In den Tresor: 950,12 €“ (= Ist − Wechselgeld). **Bucht nichts selbst**; der Wert geht als `tresor_entnahme_cent` an das Abschließen. „Nichts abschöpfen“ möglich. Ohne Fähigkeit entfällt der Schritt (Schrittleiste mit 5 Schritten), siehe Schritt 1.

**Schritt 5 – Unterschrift:** bei `abschluss_unterschrift_pflicht`: Canvas (Feld `unterschrift`) **oder** „Name in Druckbuchstaben + PIN“ (WCAG 2.5.7); `unterschrift_name` immer. Art der Unterschrift: Feld fehlt in App ph_kassa (Übergang `notiz` „Unterschrift per PIN“).

**Schritt 6 – Abschließen (Leitung):** Konsequenz-Zeilen: „Differenz −0,18 € wird ins Kassenbuch gebucht“ · „950,12 € gehen als Geldtransit in den Tresor“ (nur mit Abschöpfung) · „Nullbeleg wird erzeugt“ (wenn `abschluss_nullbeleg_automatisch`) · „Kassa 1 ist für heute gesperrt“. „Abschließen“ → `page.abschluss_abschliessen(kasse, differenz_grund, unterschrift, unterschrift_name[, tresor_entnahme_cent])`. Server (P1) bucht in einer Transaktion: Differenz (idempotent `diff:<name>:<n>`) → Entnahme Geldtransit Tresor (`kassenabschluss`, `quelle = abschluss`, von `tagesbewegungen` ausgenommen) → `bargeld_ende_cent = Ist − tresor_entnahme_cent` → Sperre. Erfolgsmoment 04 §3.13: Haken 400 ms, **alle Inhalte gemeinsam** ab 200 ms, 160 ms `--bo-ease-out`, nur `opacity`; Protokoll-PDF (`pdf_url`), „Drucken“, „Abmelden“.

**Vortag nachholen (Leitung):** mit `vortag_page` Page-Methoden mit `datum`; sonst Abschluss-Akte mit den Dokumentmethoden `zaehlen`/`abschliessen`. Band 8 nur, wenn der Vortag Belege oder Kassenbuch-Einträge hat.

**Zwischenzählung** (Schichtwechsel ohne Abschluss): nicht im ersten Bau; Anfrage `PH Kassenabschluss.art = Zwischenzaehlung` (Fach §5). Bis dahin: Zählliste drucken.

Fehler je Schritt (aus Server, unter dem Schritt): Grund fehlt · Unterschrift fehlt · Rolle fehlt · bereits abgeschlossen · Kartenzahlung ohne Beleg offen.

### 3.9 K5 – Belege heute / Beleg suchen (`F7`)

Sheet 480 px rechts (≥ 1100 px) bzw. Vollbild. Oben Suche (Nummer, Betrag „89,70“, Kunde) + Umschalter „Heute | Suchen (90 Tage, alle Kassen)“. Liste `page.belege_heute(kasse, 30)`: Zeile 56 px „Nr · Uhrzeit · Betrag · Zahlart als Text (‚Bar‘, ‚Karte‘) · Bediener-Kürzel · Badge (Storniert/Training/Ausfall/Sonderbeleg)“. Detail: Bon-Vorschau (`rksv.api.beleg_daten`, Monospace 80-mm-Spalte), Tasten „Nachdruck“ (`page.beleg_drucken`), „Per E-Mail“ (Knopf mit Undo, §3.10), „Zurücknehmen“ (Retoure), „Stornieren · Leitung“. Leer: „Heute noch keine Belege.“ Suche leer: „Kein Beleg zu ‚89,70‘.“ + „Filter zurücksetzen“. Suche über alle Tage: `getList("PH Kassenbeleg")` (Mitarbeiter hat Leserecht).

### 3.10 K4 – Ergebnis-Karte (ersetzt die Zahlmaske)

```
┌───────────────────────────────┐
│  ✓ Bezahlt                    │ Haken 400 ms (--bo-dur-draw, --bo-ease-inout)
│  Rückgeld                     │ 16 muted (nur Bar)
│  20,40 €                      │ 44/600
│  1 × 20 €, 2 × 20 ct          │ 14 muted
│  Beleg K1-000124 · 129,60 € · 14:06 │ 16
│  ✓ Gedruckt     [QR ▢ 64 ↗]   │ Druckstatus 04 §3.11; QR-Vorschau, Tipp vergrößert
│ ┌───────────────────────────┐ │
│ │ Nächster Kunde        ↵   │ │ 64 primary, Fokus nach 300 ms
│ └───────────────────────────┘ │
│ [Beleg an m.muster@… senden]  │ 48 secondary (nur mit Kontakt-E-Mail)
│ [Nachdruck] [Per E-Mail] [A4] │ 48
│ Vorteil „Lieferung frei“ eingelöst ✓            │ wenn vorgemerkt
│ Gutschein …1234 · 50,00 € [Drucken] [Per E-Mail] │ wenn verkauft
│ Anzahlungsrechnung AR-… erstellt ✓              │ bei Anzahlung, wenn gemeldet
└───────────────────────────────┘
```

- **Linke Spalte** zeigt währenddessen den gebuchten Bon schreibgeschützt (`surface-2`, Kopf „Beleg K1-000124 · gebucht“). Erster Scan oder „Nächster Kunde“ leert sie.
- **Alle Inhalte gemeinsam** ab 200 ms, 160 ms `--bo-ease-out`, nur `opacity` (kein Stagger); Reduced Motion: Crossfade 120 ms.
- Training: Karte `special-soft`, Titel „Trainingsbeleg K1-000124 – kein Umsatz“. SEE-Ausfall: Zeile „Signatureinheit ausgefallen – Beleg gültig“ (`warning-text`).
- Druckfehler: Zeile `danger-text` „Drucker antwortet nicht“ + „Nochmals“ · „A4“ · „Am Kundendisplay zeigen“ (`display_senden(kasse, {zustand: "beleg", qr})`; Zustand „beleg“ trägt der Kanal noch nicht – fehlt in App ph_kassa).
- **E-Mail:** Knopf „Beleg an m.muster@… senden“ → Toast „Beleg wird an m.muster@… gesendet · Rückgängig“ 6 s, danach `page.beleg_mailen(beleg, email)`. Rückgängig = kein Aufruf. Text „nur für diesen Beleg“ (keine Newsletter-Einwilligung an der Kassa). Fehler: „E-Mail nicht gesendet – unter ‚Belege‘ erneut senden“.
- Vorteil: nach Buchung `ph_kundenkarte.api.redeem_benefit(kartennummer, vorteil, "PH Kassenbeleg", beleg, ort="Kassa")`; Fehlercodes als Text: `limit_reached` „Vorteil dieses Jahr bereits genutzt“, `tier_too_low` „Stufe reicht nicht“, `card_inactive` „Karte nicht aktiv“, `benefit_inactive`/`benefit_not_in_tier` „Vorteil nicht verfügbar“. Beleg bleibt gültig.
- Gutschein: Code aus `sell_voucher` (E11); fehlt die Antwort: Zeile „Gutschein-Code wird nachgereicht“ (`warning-text`), Kiosk wiederholt mit gleichem Schlüssel 3 × (2/4/8 s), danach Aufgabe an Leitung. Ohne E-Mail ist „Drucken“ Pflicht (Knopf primary, „Nächster Kunde“ erst danach aktiv).
- Anzahlungsrechnung: Antwort `faktura` aus `beleg_buchen` fehlt in App ph_kassa → bis dahin keine Zeile (kein Verweis auf Faktura); Nebenbuchungsfehler sieht die Leitung in der Verwaltung („Belege mit Buchungshinweis“).
- „Nächster Kunde“, `Enter`, `F2` (mit Kundenfilter) oder ein Scan beginnen den neuen Bon; die Karte geht mit 120 ms Fade. Nach 60 s bleibt die Karte stehen (Scanner nimmt weiter an).
- Kundendisplay parallel: „Vielen Dank · Rückgeld 20,40 €“ (ohne Namen).

### 3.11 K10 – Bedienerwechsel, Freigabe am Ende, Sperre

- **Wechsel** (`/wechsel`, `Shift+F2`): Kacheln 120 × 96 (Initialen 32, Kurzname 16) aus `list_operators`; PIN-Feld `type="password" inputmode="none" autocomplete="off"`, Punkte, Ziffernblock 64 px, „OK“. Fehler: `invalid_pin` → „PIN stimmt nicht – noch 3 Versuche“; `rate_limited` → „Gesperrt – in 47 s erneut“ (Countdown-Text). Alternative Bedienerkarte (Scan, Fähigkeit). Ohne `bediener_sitzung`: E-Mail + Passwort (Fundament-Login). Offener Bon wird automatisch geparkt (mit Bediener) und nach dem Wechsel angeboten: „Bon von Anna (3 Positionen) weiterführen?“ [Weiterführen] [Später]. Gesperrt bei laufender/bezahlter Kartenzahlung (§2.2).
- **Freigabe am Ende** (Komponente `FreigabeSchritt`, eingebettet in Storno, Rabatt, Preis ändern, Retoure bar, Anzahlung über Soll, Wechselgeld ändern, Privatentnahme, Entnahme über Bestand, Training): Die Mitarbeiterin füllt den Fachdialog. Primärknopf „Zur Freigabe · Leitung“ blendet im **selben Dialog** Schritt 2 ein: Zusammenfassung oben (Aktion, Betrag, Grund), Kacheln der Bediener mit Rolle Leitung, PIN (bzw. Passwort) mit Ziffernblock, Aktionsknopf („Stornieren“). Nach Erfolg läuft die Aktion mit der kurzlebigen Sitzung der Leitung; danach Abmeldung dieser Sitzung, Kiosk bleibt bei der Mitarbeiterin, Toast mit Ergebnis. Kopfzeile zeigt während Schritt 2 „Maria L. (Leitung)“.
- **Zeitlimit Freigabe:** 60 s ohne Eingabe in Schritt 2. Ab 45 s Zeile „Freigabe endet in 15 s“ + „Weiter“ (setzt zurück). Bei Ablauf wird **nur** Schritt 2 zurückgesetzt (PIN leer, Sitzung verworfen); die Eingaben der Mitarbeiterin bleiben, der Dialog bleibt offen (WCAG 2.2.1).
- **Idle:** 15 min (PLAN §3). Jede Eingabe inkl. Scanner setzt zurück. Ab 14:30 min Band 9; danach Sperrbild (240 ms Fade, `--bo-ease-out`), Bon bleibt im Speicher, verzögerte Commits werden vorher ausgeführt (`flush()`). Keine Sperre bei laufendem Terminal, bezahlter Karte oder Zustand §3.3.6.

### 3.12 K12 – Offline / Notbetrieb

| Klasse | Bedingung | Verkauf | Zahlung | Beleg | Gesperrt |
|---|---|---|---|---|---|
| A – SEE ausgefallen | Server erreichbar, `see.status = Ausgefallen` | normal | normal | Server signiert mit Ausfall-Kennzeichen, später Sammelbeleg | – |
| instabil | ein Ping-Fehler | normal | normal | normal | – (Statusfeld „Verbindung schwach“, Ping alle 10 s) |
| ohne Verbindung (heute) | `kassen_status` 2× nicht erreichbar | **gestoppt**: Band 5, Bon bleibt (IndexedDB), Text „Bitte an Kassa 2 kassieren“, wenn eine andere Kasse am Standort online ist | laufende Kartenzahlung: Status weiter abfragen sobald möglich; bezahlt → §3.3.6 | – | alles Buchende |
| B – Notbetrieb (Fähigkeit `notbetrieb`, aus) | nicht erreichbar **und** keine andere Kasse online (`logik/notbetrieb.notbetrieb_zulaessig`) **und** `PH Geraet.offline_erlaubt` **und** StB-Freigabe | Katalog-/Kunden-Cache, Freitext | Bar, Karte extern; Terminal/Gutschein/Vorteil aus | **Notbeleg** 80 mm ohne QR, Nummer `N-<Gerät>-<lfd>`, Text laut StB | Storno, Retoure, Abschluss, Rechnung auf Firma |
| Einspielen | Verbindung zurück | gesperrt bis fertig (Fortschritt n/m) | – | je Notbeleg ein **eigener** Standardbeleg, `quelle = Kassa-Notbetrieb`, Zusatz „Nacherfassung Notbeleg N-…“ (Prüfung `pruefe_notbelege` vorhanden, Einspielung fehlt in App ph_kassa) | Fehler → Liste „Zu klären“ (Leitung) |

Puffer nach 05 §12.2–12.3 (IndexedDB, `idempotency_key` je Vorgang). Heute nur für „Als zu klären ablegen“ (§3.3.6) und den Bon-Entwurf. **Inhaber bestätigt** (§15): Die Kassa steht bei Netzausfall, bis der Notbetrieb freigegeben ist (Papier-Notbelege laut StB sind der organisatorische Weg).

### 3.13 Kleinere Kiosk-Dialoge

| Dialog | Inhalt | Rückfrage/Undo | Methode |
|---|---|---|---|
| Bon verwerfen (Bon ▾) | wirkt sofort; Toast „Bon mit 3 Positionen verworfen · Rückgängig“ 6 s. Dialog nur, wenn der Bon eine Anzahlung oder einen vorgemerkten Vorteil enthält | Undo / Dialog | lokal |
| Nullbeleg (`⋯`, Leitung) | „Nullbeleg für Kassa 1 erstellen? Betrag 0, der Zählerstand wird signiert.“ | ja | `page.nullbeleg(kasse)` |
| Trainingsmodus (`⋯`, Leitung) | Schalter + Grund-Chips (Einschulung · Test · Einrichtung) + „Alle Belege dieser Kasse werden als Training gekennzeichnet, ohne Umsatz.“ Ausschalten nur bei erfüllter Echtbetriebs-Schranke (§0.4) | ja | `page.trainingsmodus(kasse, an)` (Server prüft Leitung mit `training_server`); Ereignis `Trainingsmodus ein/aus` (Anfrage) bzw. Kommentar |
| Rabatt (`Shift+F4`, Freigabe) | % oder €, auf Zeile; Grund-Chip | Freigabe am Ende | §3.1 Zeilenblatt |
| Preis ändern (Freigabe) | neuer Einzelpreis, Grund-Chip | Freigabe am Ende | wie Rabatt |
| Freitext (`F4`) | Bezeichnung*, Betrag*, Steuersatz (Standard `standard_steuersatz`, ohne `Besonders 19`), Menge | – | Position `Freitext` |
| Gutschein verkaufen (`F6`) | Betrag (Schnell 25 · 50 · 100, übernehmen sofort; Einstellung fehlt, fest im Client), optional Empfängername | – | Position `Gutschein Verkauf` |
| Kundendisplay öffnen | öffnet `/kassa/display?kasse=K1` in neuem Fenster | – | – |
| Hilfe (`F1`) | Kürzel §2.5, „Was tun bei …“ (Drucker, Terminal, Offline, Ausfuhr: „Steuerfreie Ausfuhr – Leitung fragen“), Fachhinweise (Gutscheinart, Bar ab 10.000 €) | – | `backoffice/hilfe/kassa/*.md` |

### 3.14 Leer- und Fehlerzustände (Kiosk, vollständig)

| Fall | Text | Aktion |
|---|---|---|
| Positionen leer | Kacheln + „Artikel scannen oder suchen.“ | – |
| Suche 0 Treffer | „Nichts zu ‚Vase‘ gefunden.“ | „Als Freitext ‚Vase‘ erfassen“ · „+ Kunde ‚Vase‘“ (wenn Fähigkeit) |
| Code unbekannt | „Code 400638… unbekannt.“ | „Als Freitext erfassen“ |
| Kundenkarte unbekannt/inaktiv | Text aus `lookup_card` | „Ohne Karte weiter“ |
| Geparkt leer | „Keine geparkten Bons. Parken: ‚Bon ▾‘ › Parken.“ | – |
| Gutschein-Feld leer | Platzhalter „Gutschein scannen oder Code eingeben“ | – |
| Terminal-Timeout / -Fehler | §3.3.4 | Nochmals · Andere Zahlart |
| Zahlung ohne Beleg | §3.3.6 | – |
| Druck fehlgeschlagen | §3.10 | Nochmals · A4 · Display |
| Server lehnt Buchung ab | Servertext unter Kassieren (`aria-describedby`), Bon bleibt | „Erneut“ |
| Freigabe abgelehnt (PIN falsch) | „PIN stimmt nicht – noch 2 Versuche“ im Freigabe-Schritt | – |
| Fähigkeit fehlt | Grund als Text an der Taste („Kommt mit dem nächsten Backend-Stand“) | – |
| Übergangsfall mit Aufgabe | „Die Leitung ist informiert (Aufgabe angelegt).“ | – |
| Kasse gesperrt | Band 2 | Leitung |
| Kundendisplay ohne Verbindung | Ruhebild + klein „Anzeige pausiert“ | – |
| Abschluss ohne Belege | §3.8 Schritt 1 | – |
| Telefonbreite | §3.2 | Links |

**Regel für alle Übergangstexte:** Kein Kiosk-Text schickt die Rolle Mitarbeiter in Faktura, Shop-Verwaltung oder Stripe. Jeder Übergangsfall legt automatisch eine `PH Aufgabe` (ph_crm) an die zuständige Rolle an (`aufgabeAnlegen`, idempotent je Beleg und Fall, Zuordnung `referenz_doctype`/`referenz_name`).

### 3.15 Randfälle (Soll-Verhalten)

| Fall | Verhalten |
|---|---|
| Anzahlung ohne AB („etwas hinterlegen“) | nicht erlaubt (Position `Anzahlung` nur mit `auftrag`); Hinweis „Stattdessen Gutschein verkaufen“ |
| Anzahlung höher als offen | Hinweis + Freigabe am Ende |
| Anzahlung in Raten (Zahlungsplan-Zeilen) | Auswahl der Zeile, sobald `_auftraege` Zeilen liefert (P18) und `page.beleg_buchen` `zahlungsplan_position` annimmt; bis dahin Gesamt „Anzahlung offen“ |
| Anzahlung zurückzahlen (AB storniert, FAGG) | nicht an der Kassa, bis Positionsart `Anzahlung Rueckzahlung` existiert (P11); Aufgabe an Leitung |
| Zahlung auf Rechnung über 400 € bar | keine Rechnungsfrage (Rechnung existiert); Bon „Zahlung auf Rechnung RE-…“ |
| Teillieferung (Küche) | Kassa bucht `Teilzahlung` mit `rechnung`; Abholung einer Teilmenge ohne Rechnung → nicht an der Kassa (Packtisch/Faktura) |
| Bar ab 10.000 € | §3.3.7 |
| Fremdwährung CHF | nur nach Inhaber-Entscheidung (Fähigkeit `chf`); dann: nur Bar, 5-Rappen-Schritte, Rückgeld nur in Euro („Rückgeld nur in Euro“), Kurs nur Leitung mit Datum, älter als 1 Tag → CHF gesperrt, Abschluss mit zweitem Reiter CHF. Felder fehlen in App ph_kassa (P12-CHF). Bis dahin keine CHF-Annahme |
| Lieferung ins Ausland an Private | nicht an der Kassa; Hilfe-Text „Lieferung ins Ausland läuft über einen Auftrag“ (R13) |
| Steuerfreie Ausfuhr (U 34) | nicht im ersten Bau (E13) |
| Kunde ohne E-Mail | kein E-Mail-Knopf; Gutschein: Drucken Pflicht; Rechnung auf Firma: A4 druckt automatisch |
| Kunde verweigert Beleg | Beleg wird trotzdem erstellt; kein UI-Fall |
| Zwei Kassen, Anzahlung an Kasse 2 | unkritisch; Storno nur in Kette der Ursprungskasse (Text) |
| Monatsbeleg 23:50 während Verkauf | Cron schiebt ihn in die Kette; „Belege heute“ zeigt ihn als Sonderbeleg |
| Verkauf nach Mitternacht | zählt zum Folgetag (Hinweis im Abschluss, bis `tageswechsel`) |
| Tag ohne Umsatz | kein Vortags-Band, kein Abschlusszwang |
| Gleiche Kartenzahlung zweimal gebucht | mit `idempotenz`: Server liefert vorhandenen Beleg; Kiosk zeigt ihn |
| Bedienerwechsel bei laufendem Terminal | gesperrt („Zuerst die Zahlung abschließen“) |
| Zwei Abschlüsse am selben Tag | nicht möglich (Sperre); Zwischenzählung = Anfrage |
| Trinkgeld | Einstellung `trinkgeld_erfassen` ohne Wirkung → Vorschlag entfernen (StB); kein UI |

---

## 4. Verwaltung (Backoffice-Shell)

Gemeinsam: `DataTable` (03 §8.7), Filter in der URL, Status-Chips, gespeicherte Ansichten, Summenzeile, Tastatur 02 §9.2 (`j/k` nur in der Verwaltung), Skelett ab 300 ms, Zeilen-Schnellmenü (Rechtsklick, Langdruck 400 ms). Seitentitel `<Nummer> · <Zusatz>`. Toast nach 02/04 (Shell-Regel, nicht Kiosk). **Leerzustände je Liste in drei Fällen:** nie Daten (Satz unten je Seite) · Filter leer („Keine Belege mit Status ‚Storniert‘ im Oktober.“ + „Filter zurücksetzen“) · keine Rechte (Seite nicht in der Navigation; Direktaufruf „Dafür fehlt dir die Berechtigung (Kassa-Leitung).“).

### 4.1 V0 – Übersicht `/kassa/verwaltung` (T1)

```
Kassa                                                            [Kassa öffnen ↗]
┌ Heute kassiert ┐┌ Belege heute ┐┌ Offene Abschlüsse ┐┌ Abschlüsse mit Differenz ┐┌ Terminals offline ┐
│   3.482,30 €   ││      27      ││         1          ││  3 im Monat               ││        0          │
│ + 1 Überweis.  ││ davon 2 Storno││ KA-2026-00143 ▸   ││  größte −50,00 € (02.11.) ││ ✓ alle erreichbar │
│ ▁▂▃▅▆▇ 7 Tage  ││              ││                    ││  Summe −0,18 €            ││                   │
└────────────────┘└──────────────┘└────────────────────┘└───────────────────────────┘└───────────────────┘
HEUTE (je Kasse eine Karte)                     │ ZU ERLEDIGEN (Leitung)
Kassa 1 · Anna K. · seit 08:58 · 27 Belege      │ ● Abschluss 03.11. offen              [Öffnen]
Bargeld in der Lade 1.100,30 €                  │ ● Signatureinheit 2 h ausgefallen     [Ereignis]
Letzter Beleg K1-000124 · 14:06                 │ ● Gutschein-Code nachreichen K1-…     [Ansehen]
[Bargeld] [Tagesabschluss]                      │ ● Eingangsbeleg fehlt (Porto 12,40 €) [Ansehen]
                                                │ ● 2 Belege mit Buchungshinweis        [Ansehen]
┌ Kassenumsatz je Tag (30 Tage) ─────────────────┐┌ Kassendifferenzen je Monat (12 M) ┐
└────────────────────────────────────────────────┘└───────────────────────────────────┘
```

- „Heute kassiert“ ohne Überweisungen; Überweisungen als Nebenwert „+ 1 Überweisung offen“ (Fach §7).
- Kennzahl Differenz: Anzahl Abschlüsse mit Differenz + größte, Summe nur als Nebenwert.
- Zwei Charts (Donut „Belege nach Belegart“ und „Kassenbuch-Bewegungen je Woche“ wandern in Berichte).
- Zu-erledigen aus `PH Aufgabe` (Rolle Leitung, Bereich Kassa) + Live-Prüfungen (offene Abschlüsse Vortage, `PH Kassa Ereignis` Offen, `dep_export_letzter`, `zertifikat_gueltig_bis`).
- Buchhaltung extern: statt Zu-erledigen Block „Export“ (Kassenbuch Monat CSV/PDF, letzter DEP, Kassenumsatz nach Steuersatz).
- Leer (keine Kasse): Karte „Noch keine Kasse eingerichtet“ → Assistent A17 (Leitung/Admin).

### 4.2 V1 – Belege (T2, nur lesen)

- Spalten: Nummer (`name`, mono) · Zeit · Art (`belegart`) · Status (Signiert `success`, Ausfall `warning`, Nachsigniert `info`, Storniert `danger`) · Kunde (`kunde_name`/`kontakt`) · Bediener (Kürzel; Name nur Leitung/GF) · Zahlart (Text) · Betrag (rechts) · Bezug (AB/RE/Bestellung) · Training (Badge).
- Ansichten: Alle · Heute · Stornos · Training · Ausfall/Nachsigniert · Anzahlungen (über Report) · Ohne DEP-Export · Belege mit Buchungshinweis (Kommentare „Klärfall“, bis `nebenbuchung_status`).
- Filter-Chips: Kasse, Belegart, Status, Zeitraum, Bediener, Zahlart, Betrag.
- Summenzeile „Summe aller sichtbaren Belege“ + „inkl. 2 Stornos (−179,40 €) · 3 Training (nicht enthalten)“.
- Zeilenmenü: Öffnen · Bon-PDF · A4-PDF · E-Mail · Stornieren (Leitung).
- Massenaktionen: A4-PDF-Stapel · CSV · ZIP an E-Mail (Hintergrundjob fehlt im Fundament).
- Kein „Neu“. Leer: „Noch keine Belege. Belege entstehen an der Kassa.“

### 4.3 V2 – Abschlüsse (T2)

Spalten: Tag · Kasse · Status (Offen `info`, Gezaehlt `warning`, Abgeschlossen `success`, Korrigiert `special`) · Belege · Anfang (mit Quelle) · Soll · Ist · Differenz (0 neutral; innerhalb Toleranz Text „Toleranz“; darüber `warning`) · Abgeschöpft · Gezählt von · Freigabe · PDF. Ansichten: Offen/Gezählt · Dieser Monat · Mit Differenz · Korrigiert. Summenzeile Differenz, Umsatz. Primär „Abschluss nachholen“ (Leitung). Leer: „Noch keine Abschlüsse. Der erste entsteht am Ende des ersten Kassentags.“

### 4.4 V3 – Kassenbuch (T2)

Umschalter **Buchungen** (`zeitpunkt`, `art`, Zweck, `bewegung_cent`, `grund`, Bezug, Anhang-Symbol, `bediener`, Storno-Kette; Spalte `bestand_danach_cent` **ausgeblendet** bis `kassenbuch_barbelege`) | **Tage** (Report „PH Kassenbuch“: Anfang, Bareinnahmen, Barausgaben, Einlagen, Entnahmen, Differenz, Ende). Kopf-Kennzahl „Bargeld in der Lade“ (eine Zahl, §3.7.2). Primär „Bargeld einlegen/entnehmen“ (gleicher Dialog wie Kiosk, Leitung). Zeilenmenü „Stornieren“ (Leitung, Grund → `PH Kassenbuch.stornieren(grund)`). Ansicht „Ausgaben ohne Beleg“. Export CSV, PDF A4 Monat. Leer: „Noch keine Buchungen. Einlagen und Entnahmen entstehen an der Kassa.“

### 4.5 V4 – Terminals (T9, Leitung/Admin)

Liste: Bezeichnung · Reader-ID (mono) · Kasse · Status (Online `success`, Offline `danger`, Beschaeftigt `warning`, Unbekannt neutral, Deaktiviert) · Letzter Kontakt · Letzte Zahlung (`letzte_zahlung_intent`, `letzte_zahlung_status`) · Testmodus · Aktiv. Zeile „Status abfragen“ (`PH Terminal.status_abfragen`), Massenaktion „Alle abfragen“. Formular: `reader_id`, `bezeichnung`, `kasse`, `standort_id`, `testmodus`, `aktiv`, `notiz`. Keine Schlüssel in der Oberfläche.

### 4.6 V5 – Kassen-Akte (§5.3)

### 4.7 V6 – Ereignisse (T2)

Spalten: Zeitpunkt · Art (Badge) · Kasse · SEE · Dauer (`dauer_h`) · Status · Meldepflicht (`meldung_finanzonline_noetig` → `danger`-Badge „über 48 h – melden“) · Beleg · Automatisch. Ansichten: Offen · Meldepflichtig · Dieses Jahr. Zeilenmenü „Als gemeldet markieren“ (Dialog Datum `gemeldet_am` + Nachweis `nachweis` – Felder zuerst speichern, dann `als_gemeldet_markieren`). Neu nur Art „Hinweis“ (Leitung). Leer: „Keine Ereignisse. Ausfälle und Sonderfälle erscheinen hier automatisch.“

### 4.8 V7 – DEP-Exporte (T2)

Spalten: Nummer · Kasse · Art · Zeitraum · Belege · erste/letzte Belegnummer · Prüfsumme (`pruefsumme_sha256`, gekürzt, Kopieren) · erstellt von/am · Archiviert. Zeile: „Herunterladen“ (`/api/datei` mit Rechteprüfung), „Prüfsumme prüfen“ (`PH DEP Export.pruefsumme_pruefen` → Banner). Primär „DEP exportieren“ (A18). Leer: „Noch kein DEP-Export. Empfehlung: regelmäßig und vor jeder Prüfung.“

### 4.9 V8 – Einstellungen (T9, Single)

Karten nach Abschnitten: **Allgemein** (`standard_kasse`, `standard_steuersatz`, `steuersatz_anzahlung`, `gutschein_art` mit Notiz „mit Steuerberater abgestimmt am …“, `trainings_banner_text`, `barverkauf_rechnung_ab_cent`, `trinkgeld_erfassen` „ohne Wirkung“) · **Bondruck** (`bondrucker_modus`, `druckserver_url`, `qz_drucker_name`, `bon_breite_zeichen`, `automatisch_drucken`, `schublade_oeffnen`, `bon_kopfzeile`, `bon_fusstext`; rechts Live-Bonvorschau) · **Kundendisplay & Belegversand** (`kundendisplay_aktiv`, `kundendisplay_text`, `beleg_email_betreff`, `beleg_email_kopie_an`) · **Tagesabschluss** (`differenz_toleranz_cent`, `abschluss_unterschrift_pflicht`, `abschluss_nullbeleg_automatisch`) · **Terminal** (`terminal_testmodus`, Hinweis `terminal_schluesselnamen`) · **RKSV-Hinweise** (`rksv_hinweis`).
- **Autosave** für Texte und Druckfelder. **Ohne Autosave** (Dialog „Ändern“ mit Pflicht-Kommentar und Folge-Satz „Ab sofort wird … an allen Kassen …“): `gutschein_art`, `barverkauf_rechnung_ab_cent`, `differenz_toleranz_cent`, `terminal_testmodus`, `standard_steuersatz`, `steuersatz_anzahlung`. Konflikt-Leiste bei fremder Änderung.
- Vorgeschlagene neue Felder (fehlen in App ph_kassa): `karte_automatisch_buchen`, `storno_mitarbeiter_bis_cent`, `rabatt_freigabe_ab_promille`, `retoure_bar_nur_leitung`, `uid_empfaenger_ab_cent`, `bar_identitaet_ab_cent`, `bar_obergrenze_ab`, `tageswechsel_uhrzeit`, `differenz_warnung_cent`, `kundendisplay_anrede` (aus · Vorname · Name, Standard aus), `blind_zaehlen`, Schnelltasten (DocType).

### 4.10 V9 – Berichte (T8)

Kacheln → Report-Seite: Zeitraum-Chips (Heute/Woche/Monat/Quartal/Jahr/frei), Kasse, Tabelle mit Summenzeile, Chart darüber, CSV/PDF. Cent als Beträge, Titel ohne „(Cent)“.

| Report | Titel | Chart | Rollen |
|---|---|---|---|
| `ph_tagesumsatz_je_zahlart` | Tagesumsatz je Zahlart | gestapelte Balken (Serien 1–4) | Kassa, GF, extern |
| `ph_kassenumsatz_nach_steuersatz` | Kassenumsatz nach Steuersatz | Balken je Satz | Kassa, GF, extern |
| `ph_kassenbuch` | Kassenbuch (Tage) | Linie Endbestand | Kassa, GF, extern |
| `ph_anzahlungen_kassa` | Anzahlungen an der Kassa | Tabelle | Kassa, GF, extern |
| `ph_gutscheinbewegungen_kassa` | Gutscheinbewegungen | Balken Verkauf/Einlösung | Kassa, GF, extern |
| `ph_kassendifferenzen` | Kassendifferenzen | Balken je Tag, negativ `danger` | Leitung, GF, extern |
| `ph_belege_je_mitarbeiter` | **Kassenkontrolle je Bediener** | **kein Chart, kein Ranking**; Tabelle Belege, Stornos, Differenzen; Zweckzeile „Nachweis für die Kassenprüfung“ | Leitung, GF |
| (Charts aus V0) | Belege nach Belegart · Kassenbuch-Bewegungen je Woche | Balken | Kassa, GF, extern |

**UVA-Abgrenzung (P17, R4):** Zielzeilen des Steuersatz-Reports: „Umsatz“ · „Anzahlungen (Istversteuerung)“ · „Zahlung auf Rechnung – kein Umsatz“ · „Mehrzweck-Gutschein – kein Umsatz“; Stornos gruppiert nach `ursprung_art or art`; Fußnote „Anzahlungen mit Anzahlungsrechnung nur einmal melden (Quelle mit Steuerberater festlegen)“. **Bis P17:** Hinweis-Banner „Zahlungen auf Rechnung, Anzahlungen und Mehrzweck-Gutscheine sind enthalten – mit dem Steuerberater abgrenzen“ + Zusatzspalten, die die Oberfläche je Beleg aus Positionsarten und `PH Kassenbeleg.rechnung` summiert (Stornos über `storno_von` dem Original zugeordnet).

### 4.11 V10 – Bediener (T9)

Liste: Benutzer mit Rolle PH Kassa Mitarbeiter/Leitung: Name, Kurzname (`ph_core_kurzname`), Rolle, Standort (`ph_core_standort`), PIN gesetzt (`ph_core_pin_gesetzt_am`), letzter Kassenbeleg. Aktion „PIN setzen“ (Dialog 4–6 Ziffern, zweimal, `type="password"`) → `ph_core.api.bediener.set_pin(pin, user, standort, kurzname)`; Rückgabe nie die PIN. Reiter „Geräte“: `list_devices(arbeitsplatz="kassa")` (Name, Kasse, Drucker, Standard-Terminal, zuletzt gesehen, aktiv/gesperrt).

---

## 5. Detailansichten (Akten)

### 5.1 Beleg-Akte `/kassa/verwaltung/belege/[name]`

```
‹ Belege   K1-000118 · 89,70 €   [Storniert]          [Bon-PDF] [A4-PDF] [E-Mail] [⋯ Stornieren · Retoure]
┌ Banner danger: Storniert am 04.11. 14:22 durch K1-000125 – Grund: Fehlbuchung ─────────────────────┐
┌ Tabs: Positionen · Bon · RKSV · Versand ──────────────┐┌ Verknüpfungen ─────────────────────────┐
│ 3 × Vase Alva   29,90 €              89,70 €           ││ Kunde      Maria Muster ▸  (CRM)        │
│ Summe 89,70 · Netto 74,75 · USt 14,95                  ││ Auftrag    AB-2026-0042 ▸  (Faktura)    │
│ Zahlarten: Bar 100,00 · Rückgeld 10,30                 ││ Rechnung   RE-… ▸ (Faktura)             │
└────────────────────────────────────────────────────────┘│ Bestellung PH-S-… ▸ (Shop)              │
Zeitleiste                                                 │ Zahlung    ZA-… ▸ (Shop, PH Zahlung)    │
 14:06 erstellt von Anna K. an Kassa 1 (Quelle Kassa)      │ Gutschein  …1234 ▸ (Shop)               │
 14:06 gedruckt                                            │ Kundenkarte KK-… · Vorteil ▸            │
 14:07 E-Mail an m.muster@…                                │ Abschluss  KA-2026-00143 ▸              │
 14:22 storniert durch K1-000125 (Maria L., Freigabe)      │ DEP-Export PH-DEP-2026-0003 ▸           │
 14:22 Hinweis: Gutschein-Gutschrift gebucht               │ Vorbeleg ‹ K1-000117 · Folgebeleg K1-000119 › │
```

| Tab | Inhalt (Felder) |
|---|---|
| Positionen | Kindtabelle `positionen` (Art, Bezeichnung, Zusatz, Menge, Einzelpreis, Rabatt, Steuersatz, Brutto/Netto/USt), Summen je Satz, `ust_cent`, `gesamt_cent`; Zahlarten (`zahlart`, `betrag_cent`, `gegeben_cent`, `retour_cent`, `zahlung`, `gutschein`, `terminal_payment_intent` gekürzt, `terminal_refund`); Rechnungsempfänger (wenn `rechnung_gewuenscht`) |
| Bon | Bon-Vorschau (aus `beleg_daten`), QR 160 px (`qr_svg`) |
| RKSV | `belegnummer`, `status`, `see_ausgefallen`, `nachsigniert`/`nachsigniert_am`, `sammelbeleg`, `umsatzzaehler_verschluesselt`, `signatur_vorbeleg`, `vorbeleg`, `zertifikat_seriennummer`, `zda_id`, `jws_compact` (eingeklappt, mono), `maschinenlesbarer_code`, `ocr_code`; „Beleg prüfen“ (`PH Kassenbeleg.pruefen` → Banner) |
| Versand | `gedruckt_am`, `druck_pdf`, `kundenbeleg_email`, `dep_exportiert`, `dep_export`, `idempotency_key`, `quelle` |

Zeitleiste aus `ph_core.api.aktivitaet` bzw. Kommentaren/Versionen (Klärfälle von `on_submit` erscheinen als „Hinweis“). `Alt+↑/↓` voriger/nächster Beleg. Bearbeiten nie.

### 5.2 Abschluss-Akte `/kassa/verwaltung/abschluesse/[name]`

Kopf `KA-2026-00143 · Kassa 1 · 03.11.2026 · Abgeschlossen`. Tabs: **Soll/Ist** (alle Cent-Felder, Differenz, `differenz_grund`, Anfang mit Quelle und Grund, Abschöpfung, Endbestand) · **Zählprotokoll** · **Steuersätze** (`umsatz_je_satz`) · **Belege des Tages** (Filter `kassenabschluss = name`; Hinweis „1 Beleg am Folgetag storniert“) · **Unterschrift**. Verknüpfungen: Differenzbuchung, Abschöpfungs-Entnahme, Nullbeleg, Protokoll-PDF, Kasse. Knöpfe nach Status: Offen/Korrigiert „Zählen fortsetzen“ · Gezaehlt „Abschließen“ (Leitung, Assistent ab Schritt 3) · Abgeschlossen „Öffnen“ (Leitung, Grund Pflicht → `oeffnen(grund)`; **deaktiviert bis `abschluss_oeffnen`**, Text „Korrektur bis dahin über Kassenbuch: Einlage/Entnahme ‚Korrektur Abschluss KA-…‘“) · „Neu berechnen“ (`neu_berechnen`, nicht bei Abgeschlossen) · „Protokoll-PDF“ · „Löschen“ nur Offen ohne Zählung. Zeitleiste: eröffnet, gezählt (`von_user`), abgeschlossen (`freigegeben_von`, `geschlossen_am`), geöffnet (Grund).

### 5.3 Kassen-Akte `/kassa/verwaltung/kassen/[id]`

Zustand „Angelegt“/„Registriert“: oben **Einrichtungs-Checkliste** (Signatureinheit → AES-Schlüssel → FinanzOnline → Startbeleg → Belegcheck → UID der Firma), verlinkt auf die Knöpfe; darunter **Echtbetriebs-Schranke** (§0.4) als zweite Liste mit Haken je Fähigkeit.

| Tab | Inhalt | Knöpfe → Methode |
|---|---|---|
| Stammdaten | `kassen_id`, `bezeichnung`, `standort`, `firma`, `status`, `trainings_modus` (nur über Kiosk-Dialog/hier mit Grund, Leitung), `bon_drucker`, `drucker_adresse`, `kundendisplay`, `notiz`; Karte „Geräte“ (`list_devices` mit `kasse`) | Autosave (außer `trainings_modus`) · „Kassa öffnen“ |
| Signatur | `see` → `PH Signatureinheit` (Art, `env`, Status, Zertifikat-Seriennummer hex/dezimal, `zertifikat_gueltig_bis` mit Frist-Ampel 60/30/7 Tage, Fingerprint, letzte Prüfung); AES: `aes_schluessel_name`, `aes_schluessel_vorhanden`, `aes_pruefwert` | „AES-Schlüssel erzeugen“ (`PH Kasse.aes_schluessel_erzeugen`; Schlüssel **einmalig** im Dialog mit Kopieren; Schließen erst nach Haken „Schlüssel gesichert“) · „Zertifikat abrufen“ · „Verbindung prüfen“ · „Testschlüssel erzeugen“ (nur Art Test) · „Ausfall melden/beenden“ |
| Belegkette | `belegnummer_zaehler`, `letzter_beleg`, `letzter_beleg_am`, `letzte_signatur` (gekürzt), `startbeleg` (+ erstellt/geprüft), `letzter_monatsbeleg`, `letzter_jahresbeleg` + `jahresbeleg_geprueft_am`, `schlussbeleg`; letzte 10 Belege. `umsatzzaehler_cent` nur Leitung | „Startbeleg erstellen“ · „Sonderbeleg ▾“ · „Jahresbeleg geprüft“ (Methode fehlt in App ph_kassa; Übergang Checklisten-Zeile) · „Kette prüfen“ (Hintergrund-Toast) · „Schlussbeleg erstellen“ (Tippfeld „SCHLUSS“) |
| FinanzOnline | Checkliste `registrierung`, `finanzonline_registriert_am`, Karte „Registrierungsdaten“ mit Kopieren, `kassentyp_hinweis` | „Startbeleg geprüft (BMF-App)“ |
| Ereignisse | V6 gefiltert | wie V6 |
| DEP | `PH DEP Export` der Kasse | „DEP exportieren“ (A18) |

Zeitleiste: Statuswechsel, Training ein/aus (mit Grund), Ausfälle, Sonderbelege, Exporte.

### 5.4 Verknüpfungen zu anderen Bereichen

| Von Kassa | Nach | Weg |
|---|---|---|
| Kunde (`kontakt`) | CRM Kontakt-Akte | Link; CRM zeigt Reiter „Kassenbelege“ |
| Anzahlung/Zahlung (`auftrag`, `rechnung`, `zahlungsplan_position`) | Faktura AB/Rechnung | Link; Faktura zeigt Zahlung mit Kassenbeleg |
| `PH Zahlung` (`kassenbeleg`) | Shop/Zahlungen | Link in beide Richtungen |
| Gutschein | Shop Gutschein-Akte | Link |
| Bestellung | Shop Bestellung → Packtisch | Link; Packtisch sieht „bezahlt an Kassa 1“ (mit `bestellung_kassieren`) |
| Kundenkarte | Kundenkarte Karte/Einlösungen | Link |
| Bediener | Personal (nur Name, keine Auswertung) | – |
| Aufgaben (`PH Aufgabe`) | Zentrale Glocke/Zu erledigen | Link |

---

## 6. Workflows, Buttons, Massenaktionen, Assistenten

`ph_kassa` hat **kein Workflow-Fixture**; Zustände setzen Server-Methoden; einziger `doc_event`: `PH Kassenbeleg.before_submit` → `sperre_pruefen`.

### 6.1 Zustandsautomaten

```
PH Kassenbeleg      Signiert ──storniere_beleg (Leitung)──► Storniert   [Gegenbeleg Stornobeleg, storno_von]
                    Ausfall ──Sammelbeleg nach SEE-Rückkehr──► Nachsigniert
                    nie stornierbar: Start-, Null-, Monats-, Jahres-, Schluss-, Sammel-, Stornobeleg
PH Kassenabschluss  Offen ──zaehlen──► Gezaehlt ──abschliessen (Leitung)──► Abgeschlossen ──oeffnen (Leitung, ab P4)──► Korrigiert ──zaehlen──► Gezaehlt
PH Kassenbuch       Gebucht ──stornieren(grund) (Leitung)──► Storniert (+ Gegenbuchung)
PH Kasse            Angelegt → Registriert → Aktiv ⇄ Ausgefallen → Ausser Betrieb
PH Signatureinheit  Angelegt → Registriert → Aktiv ⇄ Ausgefallen
PH Kassa Ereignis   Offen → Beendet → Gemeldet / Erledigt
PH DEP Export       Erstellt → Archiviert
PH Terminal         Unbekannt / Online / Offline / Beschaeftigt / Deaktiviert
Kiosk-Bon (lokal)   leer → Bon → Zahlmaske ─┬─ Bar/Gutschein ─► bucht → Ergebnis
                                            └─ Karte: läuft (Bon gesperrt) ─► bezahlt (gesperrt) ─► bucht → Ergebnis
                                                              └► abgebrochen → Zahlmaske
                    bucht ─Fehler─► Bon bleibt | nach Karte: Zahlung ohne Beleg (gesperrt) ─► gebucht / abgelegt
                    Bon ⇄ geparkt
Freigabe (lokal)    Fachdialog ─Zur Freigabe─► PIN-Schritt ─OK─► Aktion (Leitungs-Sitzung) ─► Abmeldung Leitung
                                                    └─60 s─► PIN-Schritt zurückgesetzt, Eingaben bleiben
Bargeld (lokal)     Dialog ─Knopf─► verzögert (6 s, Undo) ─► gebucht + Lade | ─Rückgängig─► verworfen
```

### 6.2 Button-Katalog (Oberflächentext → Server Action → Frappe → Rückfrage/Undo)

Frappe-Pfade: Page `ph_kassa.ph_kassa.page.ph_kassa.ph_kassa.<name>` (`P.`), RKSV `ph_kassa.rksv.api.<name>`; Dokumentmethoden über `run_doc_method`; alle Aufrufe serverseitig über `backoffice(session)` mit der Sitzung des Bedieners (bzw. der Leitung in der Freigabe).

| Ort | Text | Server Action | Frappe | Rückfrage | Undo |
|---|---|---|---|---|---|
| Kiosk Start | – | `kassaKontext` | `P.kontext`, `rksv.api.kassen_status` | – | – |
| Tagesstart | Stimmt / Anders gezählt | `tagesstartBestaetigen` | `P.abschluss_laden` (+ Kommentar) | Freigabe bei „Anders“ | – |
| Suchfeld | Suche | `kassaSuche` | `P.suche_produkt`, `P.suche_kunde` | – | – |
| Suchfeld | Scan | `codeAuswerten` | `codes.erkennen`-Wrapper bzw. Client + `lookup_card`/`gutschein_pruefen`/`beleg_daten` | – | – |
| Bon | Position/Kunde entfernen, Bon verwerfen | lokal | – | nur Bon mit Anzahlung/Vorteil | 6 s |
| Bon | Summen, Freigaben | `belegVorschau` | `P.beleg_vorschau` | – | – |
| Zahlmaske | Karte · Abbrechen · Simulieren · Status | `terminalStarten` · `terminalAbbrechen` · `terminalSimulieren` · `terminalStatus` | `P.terminal_*` | Abbrechen per `Esc`: ja | – |
| Zahlmaske | Gutschein prüfen | `gutscheinPruefen` | `P.gutschein_pruefen` | – | – |
| Zahlmaske | **Kassieren** / Schnellbetrag | `kassieren` | `P.beleg_buchen(kasse, positionen, zahlarten, kontakt, auftrag, rechnung, bestellung, kundenbeleg_email, drucken[, idempotency_key])` – **nie** `trainings` | nein | – |
| Ergebnis | Gutschein-Code | `gutscheinAusstellen` | `ph_shop.api.backoffice.sell_voucher(wert_cent, "PH Kassenbeleg", beleg, idempotency_key, position, kontakt)` | – | – |
| Ergebnis | Vorteil (automatisch) | `vorteilEinloesen` | `ph_kundenkarte.api.redeem_benefit` | – | – |
| Ergebnis | E-Mail senden | `belegMailen` (Client verzögert 6 s) | `P.beleg_mailen` | nein | 6 s |
| Ergebnis/Belege | Nachdruck · A4 | `belegDrucken` | `P.beleg_drucken` · Druckroute A4 | – | – |
| Rechnungsfrage | Weiter | `rechnungsempfaengerSetzen` / `kontaktAnlegen` | `insert("PH Kontakt")` (Fähigkeit) | – | – |
| Belege | Stornieren | `stornieren` (mit `freigabe`) | `P.storno(beleg, grund)`; danach ggf. `cancel_voucher_sale` | Freigabe | – |
| Retoure | Laden · Buchen | `retoureLaden` · `retoureBuchen` | `retoure_laden` · `retoure_buchen` (Anfrage) | – | – |
| `⋯` | Nullbeleg | `nullbeleg` | `P.nullbeleg` | ja | – |
| `⋯` | Trainingsmodus | `trainingSchalten` | `P.trainingsmodus(kasse, an)` | ja + Grund | – |
| `⋯` | Lade öffnen | `ladeOeffnen` | Druckdienst Schublade + Kommentar `PH Kasse` | – | – |
| Bargeld | „200,00 € entnehmen“ | `bargeldBuchen` (Client verzögert 6 s) | `P.kassenbuch_buchen(kasse, art, betrag_cent, grund)` + `uploadFile` (Ausgabe) | nein | 6 s |
| Abschluss | Neu berechnen · Zählung übergeben · Abschließen | `abschlussNeuBerechnen` · `zaehlungUebergeben` · `abschliessen` | `PH Kassenabschluss.neu_berechnen` · `P.abschluss_zaehlen` · `P.abschluss_abschliessen` | Abschließen: Konsequenz-Zeilen | – |
| Abschluss-Akte | Öffnen | `abschlussOeffnen` | `PH Kassenabschluss.oeffnen(grund)` (ab P4) | ja | – |
| Freigabe | PIN/Passwort OK | `freigabeAnmelden` | `sitzung_mit_pin` (P9) bzw. Frappe-Login | – | – |
| Wechsel | OK | `bedienerWechseln` (Fundament) | `verify_pin`/`sitzung_mit_pin`, `list_operators` | – | – |
| Übergangsfall | (automatisch) | `aufgabeAnlegen` | `insert("PH Aufgabe")` | – | – |
| Display | – | `displaySenden` | `P.display_senden` | – | – |
| Kassen-Akte | AES · Registrierungsdaten · Startbeleg · Sonderbeleg · Schlussbeleg · DEP · Ausfall · Kette prüfen | `kasseMethode(name, methode, args)` (Whitelist) | `PH Kasse.*` | AES ja · Startbeleg ja · Sonderbeleg ja · Schlussbeleg Tippfeld · DEP Vorschau · Ausfall Notiz | – |
| Signatur | Zertifikat · Verbindung · Testschlüssel · Ausfall | `seeMethode` (Whitelist) | `PH Signatureinheit.*` | Testschlüssel ja | – |
| Beleg-Akte | Beleg prüfen | `belegPruefen` | `PH Kassenbeleg.pruefen` | – | – |
| Kassenbuch | Stornieren | `kassenbuchStornieren` | `PH Kassenbuch.stornieren(grund)` | ja | – |
| DEP | Prüfsumme prüfen | `depPruefen` | `PH DEP Export.pruefsumme_pruefen` | – | – |
| Ereignis | Als gemeldet markieren | `ereignisGemeldet` | `save` + `als_gemeldet_markieren` | ja | – |
| Terminal | Status abfragen | `terminalAbfragen` | `PH Terminal.status_abfragen` | – | – |
| Bediener | PIN setzen | `pinSetzen` | `ph_core.api.bediener.set_pin` | – | – |

### 6.3 Massenaktionen (Verwaltung)

| Liste | Aktionen | Vorschau |
|---|---|---|
| Belege | A4-PDF-Stapel · CSV · ZIP an E-Mail | „24 Belege, davon 3 Training (gekennzeichnet)“ |
| Abschlüsse | Protokoll-PDF-Stapel · CSV | – |
| Kassenbuch | CSV · PDF Monat | – |
| Ereignisse | Als gemeldet markieren (nur meldepflichtig + Offen) | „2 von 5 möglich – 3 nicht meldepflichtig“ |
| Terminals | Status abfragen | – |

Keine Massen-Stornos, keine Massen-Abschlüsse.

### 6.4 Assistenten

| # | Assistent | Schritte | Server |
|---|---|---|---|
| A15 | Tagesabschluss | §3.8 (Rollentrennung, Leitung per Wechsel/Verwaltung) | `abschluss_laden → abschluss_zaehlen → abschluss_abschliessen` (Abschöpfung als Parameter ab P1) |
| A16 | Beleg korrigieren (Leitung; Übergang bis `retoure`) | Beleg → Storno (Grund) → neuer Bon mit Originalpositionen vorbefüllt → Ergebnis mit beiden Nummern | `storno` + `beleg_buchen`; Positionen aus `rksv.api.beleg_daten` |
| A17 | Kasse einrichten | Signatureinheit → Zertifikat → AES → Registrierungsdaten → FinanzOnline-Datum → Startbeleg → Belegcheck → UID → Gerät binden (inkl. Standard-Terminal) | `PH Signatureinheit.*`, `PH Kasse.*`, `register_device` |
| A18 | DEP exportieren | Kasse → Art + Zeitraum → Vorschau → Erzeugen → Datei + Prüfsumme + Notiz | `PH Kasse.dep_exportieren` |
| A20 | Anzahlung kassieren | Kunde/AB → (Zahlungsplan-Zeile) → Betrag → Zahlart → Buchen | `suche_kunde._auftraege`, `beleg_buchen(auftrag, …)` |
| A21 | Retoure | §3.5 | Fähigkeit `retoure` |
| A22 | Rechnungsempfänger | §3.4 | Fähigkeit `kunde_anlegen`, `rechnung_snapshot` |

---

## 7. Dashboard, Kennzahlen, Charts (Datenquellen)

| Kennzahl / Chart | Quelle | Abfrage | Darstellung |
|---|---|---|---|
| Heute kassiert | Number Card „Heute kassiert (Cent)“ | Sum `gesamt_cent`, docstatus 1, `trainings = 0`, heute, **ohne Zahlart Überweisung** (bis Fixture angepasst: Oberfläche zieht Überweisungs-Anteile ab) | 32/600 + Sparkline 7 Tage; Nebenwert „+ n Überweisung offen“ |
| Belege heute | Number Card | Count docstatus 1, heute | „davon n Storno“ |
| Offene Abschlüsse | Number Card | Count Status Offen/Gezaehlt/Korrigiert | Vortage `warning` |
| Abschlüsse mit Differenz | `getList PH Kassenabschluss` Monat | Count `differenz_cent ≠ 0`, Min | „3 · größte −50,00 € (02.11.)“, Summe Nebenwert |
| Terminals offline | Number Card | Count aktiv + Offline | 0 → „alle erreichbar“ |
| Kassenumsatz je Tag | Chart „PH Kassenumsatz je Tag“ | Sum je Tag, 30 Tage | Balken, Eintritt 240 ms `--bo-ease-out`, ohne Stagger |
| Kassendifferenzen je Monat | Chart | Sum je Monat, 12 M | Balken, negativ `danger` |
| Belege nach Belegart, Kassenbuch-Bewegungen je Woche | Charts | – | nur in Berichte |
| Bargeld in der Lade | §3.7.2 | – | Kiosk-Popover, V0, V3 |
| Kassenkontrolle je Bediener | Report | – | nur Tabelle, Leitung/GF |

Zentrale (Rolle Kassa/GF): Heute kassiert, Belege heute, Offene Abschlüsse + Band „Abschluss gestern offen“. Charts nach dataviz-/03-Regeln (eine Farbe je Serie, Tooltip de-AT, Tabelle als Alternative). Kalendertag-Filter bis `tageswechsel`.

---

## 8. Druck und PDF

| Dokument | Format | Weg | Auslöser |
|---|---|---|---|
| Bon 80 mm | Print Format `PH Kassenbeleg Bon 80mm` bzw. ESC/POS (`druck/bon.py`, `escpos.py`, `qr.py`) | `P.beleg_drucken` → `{modus, escpos_base64 | pdf_url | gesendet, vorschau}`; ESC/POS-Druckserver: Server sendet; QZ Tray: Client druckt roh; PDF: `useDruck()` | Buchen (automatisch), Nachdruck, Storno, Nullbeleg |
| Beleg A4 / Rechnung | `PH Kassenbeleg A4` | `/druck/kassenbeleg/[name]?format=a4` → PDF über `/api/datei`; bei Rechnung auf Firma bei der Buchung erzeugt und abgelegt | E-Mail-Anhang, Knopf A4, Rechnung auf Firma |
| Abschlussprotokoll | `PH Kassenabschluss Protokoll` | `pdf_url`, Akte | Abschluss |
| Kassenbuch Monat | Listendruck A4 (03 §10) | `/druck/kassenbuch?kasse=&monat=` | Steuerberater |
| Zählliste leer | A4, 15 Zeilen | `/druck/zaehlliste` | Abschluss Schritt 2 |
| Gutschein | A4/A6 mit Code + QR (PDF aus ph_shop `sell_voucher`, sonst eigene Route) | `/druck/gutschein/[name]` | Ergebnis-Karte |
| DEP-Datei | JSON | Download mit Rechteprüfung | DEP-Liste |
| Notbeleg | lokal, ohne QR | nur mit Fähigkeit `notbetrieb` | – |

- Druck-Feedback nach 04 §3.11; Druckfehler blockiert nie das Buchen.
- Trainingsbelege tragen „TRAINING“ (vorhanden in `bon.py`).
- Bon druckt heute `User.full_name`; Kurzname (`ph_core_kurzname`, Rückfall Vorname) **fehlt in App ph_kassa** (`druck/drucker.py`).

---

## 9. Mobile, iPad, Kiosk-Varianten

| Breite | Kiosk `/kassa` | Verwaltung |
|---|---|---|
| ≥ 1100 px | 8/12 + 4/12 (§3.1) | Shell mit eingeklappter Seitenleiste, Prioritätsspalten |
| 768–1099 px | eine Spalte + Summenleiste 72 px (§3.2); Sheets von unten | Listen als Karten, Filter als Bottom-Sheet, Abschluss einspaltig |
| < 768 px | nicht unterstützt (Hinweisseite + Links) | nur lesen; Storno/Abschluss mit Hinweis „am Tablet oder Desktop“ |

- **Kundendisplay** `/kassa/display?kasse=K1`: zweites Fenster/Tablet, Gerätebindung, keine Bedienung. Zustände: Ruhe (Wortmarke Bodoni + `kundendisplay_text`) · Positionen (letzte 6 Zeilen, Gesamt 64 px Instrument Sans) · Karte („Bitte Karte am Terminal“) · Fertig („Vielen Dank · Rückgeld 20,40 €“, 8 s) · Beleg (QR 240 px, wenn Druck fehlte) · Training (Band). **Standard ohne Namen** („Guten Tag“); Einstellung `kundendisplay_anrede` (aus · Vorname · Name ohne Anrede) – nie Frau/Herr (R10). Datenweg: Realtime von `P._display` → SSE-Proxy des Fundaments; Rückfall Polling 2 s; ohne Verbindung Ruhebild + „Anzeige pausiert“.
- Touch (02 §11.2): Langdruck 400 ms mit Tastatur-Alternative (`Shift+F10`), Wischaktionen beschriftet, Safe-Areas, eigene Zahlen-Tastatur.
- Vollbild: `useVollbild`; iPad-Web-App-Modus ohne Browserleiste (Safe-Area 24 px in K5 eingerechnet).

---

## 10. Automationen und Erinnerungen

| Auslöser | Quelle | Oberfläche |
|---|---|---|
| Monats-/Jahresbeleg 23:50 am Monatsletzten | Cron `rksv.tasks.monats_und_jahresbelege` | Ereignis; bei Nachholen Aufgabe an Leitung |
| 08:00 Erinnerungen | Cron `rksv.tasks.erinnerungen` → `PH Aufgabe` | Zu erledigen V0, Glocke |
| SEE-Ausfall stündlich | Cron `rksv.tasks.ausfall_ueberwachen` | Band wechselt; Ende-Toast „Signatureinheit wieder verfügbar – Belege werden nachsigniert“ |
| Sperre nach Abschluss | `before_submit` → `sperre_pruefen` | Band 2 |
| Nebenbuchungen | `PH Kassenbeleg.on_submit` (Zahlung, Gutschein-Einlösung/-Rückbuchung, Faktura) | Klärfall-Kommentar → Ansicht „Belege mit Buchungshinweis“ |
| Gutschein-Code nachreichen | Kiosk (E11), 3 Versuche | Aufgabe an Leitung |
| Übergangsfälle (Storno gesperrt, Erstattung, Firma anlegen, Eingangsbeleg) | Kiosk `aufgabeAnlegen` | Zu erledigen V0 |
| Abschluss gezählt | Kiosk nach `abschluss_zaehlen` | Band 2a am Gerät + Aufgabe an Leitung |
| Abschluss gezählt, nicht abgeschlossen bis 20:00 | UI (Zentrale-Glocke); Server-Aufgabe fehlt in App ph_kassa | Glocke |
| Terminal-Webhook | `terminal.stripe_ereignis` | Terminal-Status |
| Kiosk: Vortag offen / Zahlung ohne Beleg nach Neustart / Idle | Kiosk-Start, `PH Terminal.letzte_zahlung_*`, Client | Band 8 / 1 / 9 |
| Zertifikat läuft ab (60/30/7 Tage) | UI; Aufgabe in `erinnerungen()` fehlt in App ph_kassa | Kassen-Akte, V0 |
| Kasse 3 Werktage ohne Beleg | UI | V0 (neutral) |

---

## 11. Datenmapping UI → Frappe (mit Lücken)

Legende: **vorhanden** · **Lücke** (zuständige App; ohne Angabe ph_kassa) · **Übergang** (Verhalten bis dahin) · Fähigkeit in `code`.

### 11.1 Kiosk

| UI-Funktion | Methode / DocType.Feld | Status |
|---|---|---|
| Kontext (Kassen, Einstellungen, Terminals, Sperre, Bargeld, letzter Beleg, Umsatz heute) | `P.kontext(kasse)` | vorhanden; `_heute_umsatz` zählt Überweisung mit (Fach §7) |
| Kassen-/SEE-Status, Training, `buchen_moeglich` | `rksv.api.kassen_status(kasse)` | vorhanden |
| Gerät, Bedienerliste, PIN | `ph_core.api.geraete.verify_device/touch_device`, `ph_core.api.bediener.list_operators/verify_pin` | vorhanden (ph_core) |
| Sitzung nach PIN | `sitzung_mit_pin` | Lücke ph_core (P9) · `bediener_sitzung` · Übergang Passwort |
| Standard-Terminal je Gerät | `PH Geraet.standard_terminal` | Lücke ph_core · `standard_terminal` · Übergang lokal |
| Bedienerkarte | `verify_badge(code, geraet_token)` | Lücke ph_core · `bedienerkarte` |
| Notbetrieb erlaubt | `PH Geraet.offline_erlaubt`, `ph_kassa_offline_limit_cent` | Lücke ph_core · `notbetrieb` (aus) |
| Suche Kunde inkl. AB/Rechnungen/Bestellungen | `P.suche_kunde(q)` (`_auftraege`, `_rechnungen`, `_bestellungen`, `_auftrag_steuersatz`) | vorhanden; Lücke: `vertragsort`, `fagg_frist_ende`, Zahlungsplan-Zeilen, Satz-Aufteilung (`_auftraege`), `je_satz` (`_rechnungen`), Positionen + `rechnung` (`_bestellungen`) – P18, P13 |
| Produktsuche | `P.suche_produkt(q)` | vorhanden |
| Scan-Erkennung | `logik/codes.erkennen` | Logik vorhanden, Wrapper fehlt (V4) · `code_erkennen` · Übergang `codes.js` |
| Kundenkarte lesen / Vorteil einlösen | `ph_kundenkarte.api.lookup_card` / `redeem_benefit` | vorhanden |
| Vorteil zurücknehmen | `revoke_benefit(einloesung, grund)` | Lücke ph_kundenkarte (P20) · `vorteil_zuruecknehmen` |
| Kundenkarte am Beleg | Custom Field `PH Kassenbeleg.ph_kundenkarte_kartennummer` | Lücke: `P.beleg_buchen` reicht nicht durch; Stornobeleg übernimmt sie nicht (Fach §7) |
| Summen, Rückgeld, Vorschau | `P.beleg_vorschau`; Client-Port `betraege.js` | vorhanden |
| Server-Regeln (Rechnung, Bar 10.000, Anzahlung ohne AB, Gutschein im selben Bon, Rabattfreigabe) | `logik/regeln.pruefe` | Logik vorhanden, nicht verdrahtet (V8) · `regeln_server` · Übergang `regeln.js` (Client-Anzeige) |
| Positionen | `PH Kassenbeleg Position` (`art`, `produkt`, `bezeichnung`, `zusatz`, `menge`, `einzel_brutto_cent`, `steuersatz`, `gutschein`, `bezug_doctype`, `bezug`) | vorhanden |
| Rabattfelder | `listenpreis_cent`, `rabatt_promille`, `rabatt_cent`, `rabatt_gesamt_cent`, `rabatt_grund` | Logik da (`rabatt_berechnen`), Felder fehlen – Frappe verwirft sie stumm (V5, P11) · `rabattfelder` · Übergang `zusatz` |
| Positionsart Retoure / Anzahlung Rückzahlung, `bezug_zeile` | Select `art` | Lücke (V6, P11) · `retoure` |
| Storno-Ursprung | `PH Kassenbeleg Position.ursprung_art` | Lücke (P7) · `storno_ursprung` |
| Zahlarten | `PH Kassenbeleg Zahlung` (`zahlart`, `betrag_cent`, `gegeben_cent`, `retour_cent`, `gutschein`, `terminal_payment_intent`) | vorhanden |
| Terminal | `P.terminal_start/terminal_status/terminal_abbruch/terminal_simulieren` | vorhanden |
| Terminal-Erstattung | `terminal.erstatten` (vorhanden) | Lücke: Page-Methode `terminal_erstatten`, Feld `terminal_refund` (V3) · `terminal_erstatten` |
| Nach Karte automatisch buchen | Einstellung `karte_automatisch_buchen` | Lücke |
| Gutschein prüfen | `P.gutschein_pruefen(code)` | vorhanden; Lücke ph_shop: `art`, `steuersatz` in der Antwort |
| Gutschein ausstellen nach Verkauf | `ph_shop.api.backoffice.sell_voucher` (vorhanden, idempotent) | Lücke: Aufruf in `on_submit` (D1, P6) · Übergang E11 |
| Gutschein-Einlösung zurückbuchen bei Storno | `on_submit` Stornobeleg → `storniere_einloesung` | **vorhanden** |
| Gutschein-Verkauf stornieren | `ph_shop.api.backoffice.cancel_voucher_sale` (Leitung) | vorhanden; Aufruf aus Kiosk nach Storno |
| Einzweck-Gutschein Verkaufssteuersatz | `gutschein_art` | Lücke: Page setzt nur Mehrzweck |
| Buchen | `P.beleg_buchen(...)` | vorhanden; Lücke: `idempotency_key` + Intent-Doppelprüfung (D4, P8), `trainings` entfernen (R1, P5), `kunde_name`, `zahlungsplan_position`, Kartennummer, Empfänger-Felder (P10), Antwort `gutscheine`, `faktura`, `freigaben` |
| Rechnung auf Firma | `rechnung_gewuenscht`, `empfaenger_name`, `empfaenger_anschrift`, `empfaenger_uid` | Lücke (D7, P10) · `rechnung_snapshot` · Übergang A4-PDF bei Buchung |
| Kontakt anlegen | `insert("PH Kontakt")`, `quelle = showroom` | abhängig von Rolle · `kunde_anlegen`; Option `kassa` in `quelle` = Anfrage ph_crm |
| Belege heute, letzter Beleg, suchen | `P.belege_heute`, `P.letzter_beleg`, `getList PH Kassenbeleg` | vorhanden (Kalendertag) |
| Beleg-Daten (Retoure, Bon) | `rksv.api.beleg_daten(name)` | vorhanden |
| Nachdruck, E-Mail | `P.beleg_drucken`, `P.beleg_mailen` | vorhanden |
| Storno | `P.storno` → `storniere_beleg` | vorhanden für Leitung; Lücke: Schublade bei Bar, `freigabe_durch`, Mitarbeiter-Storno (`regeln.storno_freigabe` vorhanden, Einstellung fehlt) |
| Nullbeleg | `P.nullbeleg` | vorhanden (Page erlaubt Mitarbeitern – UI zeigt nur Leitung) |
| Training | `P.trainingsmodus` | vorhanden; Lücke: nur Leitung, Grund, Ereignis (D11, P5) |
| Einlage/Entnahme | `P.kassenbuch_buchen` | vorhanden; Lücke: `zweck`, `anhang`, `ust_satz` (P15); `Anfangsbestand` ohne Prüfung (D13, P16) – Kiosk ruft es nie auf |
| Kassenbuch je Barbeleg | Arten Bareinnahme/Barausgabe, `quelle = beleg` | Lücke (P3) · `kassenbuch_barbelege` |
| Lade öffnen protokolliert | Ereignis „Lade geöffnet“ | Lücke |
| Abschluss heute | `P.abschluss_laden/abschluss_zaehlen/abschluss_abschliessen` | vorhanden; Lücke: Abschöpfung (A1, P1), Anfang aus `bargeld_ende_cent` (A2, P2), Wiederöffnen (A3, P4), `bargeld_anfang_cent` RO + nur Leitung (D12, P16) |
| Abschluss Vortag | Dokumentmethoden `zaehlen/abschliessen` | Lücke: Page-Methoden mit `datum` · `vortag_page` |
| Tageswechsel | `logik/abschluss.geschaeftstag/zeitraum` | Logik da, nicht verdrahtet (V9) · `tageswechsel` |
| Blindzählung | Config `kassa.blind_zaehlen` | Übergang Fundament-Config; Feld Anfrage |
| Zweite Differenzschwelle, Unterschrift-Art | – | Lücke |
| Kundendisplay | `P.display_senden`, `_display` | vorhanden; SSE-Proxy (Fundament); Zustand „beleg“ fehlt |
| Parken | lokal IndexedDB | bewusst lokal |
| Schnelltasten je Kasse | DocType `PH Kassa Schnelltaste` | Lücke |
| Aufgaben für Übergangsfälle | `insert("PH Aufgabe")` (ph_crm) | vorhanden (Rolle braucht create; sonst über Service-Konto als **Systemaufgabe**, Kommentar nennt den Bediener) |
| Notbetrieb | `logik/notbetrieb.py` (Prüfung) | Logik da; Einspielung, Katalog-/Kunden-Abzug fehlen · `notbetrieb` (aus) |
| Bar je Vorgang ≥ 10.000 € | `regeln.pruefe` je Beleg | Lücke: Summe je `auftrag`/`rechnung`, `bar_obergrenze_ab` (R7, P19) · `bar_vorgang` |
| Überweisung als Forderung | `PH Zahlung.status = Offen`, OP in Faktura | Lücke ph_kassa + ph_faktura (D8, P14) · `ueberweisung` |
| Bestellung kassieren | `ph_shop.bestellung.zahlung_erhalten` | Lücke ph_kassa + ph_shop (D2, P13) · `bestellung_kassieren` |
| CHF | `betraege.fremd_in_eur`, `abschluss.chf_einnahmen_cent` | Logik da, Felder fehlen (V7) · `chf` (aus) |

### 11.2 Verwaltung

| UI-Funktion | Methode / DocType | Status |
|---|---|---|
| Kennzahlen, Charts | Fixtures `number_card.json`, `dashboard_chart.json` | vorhanden; „Heute kassiert“ ohne Überweisung = Anfrage |
| Belegliste, Akte, RKSV, QR, prüfen | `PH Kassenbeleg`, `rksv.api.beleg_daten`, `.qr_svg`, `.pruefen` | vorhanden; permlevel-1-Bereinigung `bediener`, `umsatzzaehler_klar_cent` = Anfrage |
| Storno aus Akte | `PH Kassenbeleg.stornieren(grund)` | vorhanden (Leitung) |
| Abschlüsse | `PH Kassenabschluss` + `zaehlen/abschliessen/oeffnen/neu_berechnen` | vorhanden; `oeffnen` erst mit P4 im UI |
| Kassenbuch | `PH Kassenbuch`, `stornieren(grund)`, Report `ph_kassenbuch` | vorhanden; `letzter_bestand` ignoriert `waehrung` |
| Kassen, Signatur, Checkliste, DEP | `PH Kasse` (+ 9 Methoden), `PH Signatureinheit` (+ 5), `PH Kassa Checkliste`, `PH DEP Export.pruefsumme_pruefen` | vorhanden |
| Jahresbeleg geprüft | `PH Kasse.jahresbeleg_geprueft()` | Lücke; Übergang Checkliste |
| Terminals, Ereignisse | `PH Terminal.status_abfragen`, `PH Kassa Ereignis.als_gemeldet_markieren` | vorhanden |
| Berichte | 7 Script Reports | vorhanden; Lücke: Zeilen nach R4 (P17) |
| Einstellungen | `PH Kassa Einstellungen` | vorhanden; neue Felder §4.9 = Lücke |
| Bediener-PIN, Geräte | `set_pin`, `list_devices` | vorhanden (ph_core) |
| Belege mit Buchungshinweis | Kommentare (`_klaerfall`) | Übergang; Lücke `nebenbuchung_status` |
| Terminalzahlungen ohne Beleg | `PH Terminal.letzte_zahlung_*` (nur letzte) | Lücke: Report |
| PDF-Stapel/ZIP | – | Lücke Fundament: Hintergrundjob |
| Kontakt-Anonymisierung | – | Lücke ph_crm: Hook für `kontakt`, `kunde_name`, `kundenbeleg_email` am Beleg |
| Schreibschutz nach Signatur | Frappe verbietet Änderungen an submitted Feldern ohne `allow_on_submit` | **vorhanden** (V10); stattdessen Lücke `bargeld_anfang_cent` (P16) |

---

## 12. Akzeptanzkriterien (QA)

K = Kiosk, V = Verwaltung, X = Querschnitt, F = Fachlogik (Server-abhängig; prüfbar, sobald die Fähigkeit an ist, im Mock immer). Alles im Mock-Modus prüfbar (Fähigkeiten einzeln an/aus), Frappe-Modus zusätzlich auf Staging. Geräte: iPad 11" quer (1180 × 820) und hochkant (820 × 1180), iPad 10,2" quer (1080 × 810), Touch-Monitor 1920 × 1080. Tippzahlen über `zaehleTipps()` im Mock.

| # | Kriterium | Prüfung |
|---|---|---|
| K1 | Barverkauf: Scan → „Bar“ → „Passend“ = 2 Tipps; Ergebnis-Karte zeigt Rückgeld (44 px), Nummer, Betrag, Druckstatus | E2E |
| K2 | Fokus: nach Hinzufügen, Zeilenblatt zu, Dialog zu, Ergebnis verlassen liegt der Fokus im Suchfeld; nie per Timer; `Tab` durchläuft die Stationen §2.4 | E2E + Tastatur |
| K3 | Scanner-Eingabe landet nie in Feldern mit `data-scan="nein"` | E2E |
| K4 | Menge 1 → 3 mit 2 Tipps; Wischen links zeigt „Entfernen“; Entfernen mit Undo 6 s und `Strg+Z` | E2E Touch + Tastatur |
| K5 | Zahlmaske ohne Split auf 1180 × 820 mit **zwei Bändern + 24 px Safe-Area**: kein Scroll; Höhe ≤ 568 px | Screenshot-Maß |
| K6 | Betragseingabe: `1 2 9 , 6` = 129,60; `1 2 9` = 129,00; `00`; dritte Nachkommastelle ignoriert; `×` und `Entf` löschen alles | Unit + E2E |
| K7 | Schnellbeträge: 129,60 → Passend · 130 · 200; 50,00 → Passend · 100; 7,90 → Passend · 10 · 20; 100,00 → Passend · 200 | Unit |
| K8 | Split: Karte 29,60 + Bar gegeben 150 → Bar-Anteil 100,00, Rückgeld 50,00; Überzahlung ohne Bar → Servertext, `role="alert"` | Unit + E2E |
| K9 | Terminal (Mock): Start → bezahlt → Kassieren; Abbrechen in 1 Tipp; 60 s Hinweis; 180 s Abbruch nur im Zustand „wartet“, nie bei „verarbeitet“; `Esc` fragt | E2E Zeitsimulation |
| K10 | „Zahlung erhalten – Beleg offen“: Bon gesperrt, Band `danger`, 3 automatische Versuche, „Erneut buchen“ erzeugt genau einen Beleg; „Als zu klären ablegen“ funktioniert ohne Server | E2E Mock |
| K11 | Doppel-Tipp/Doppel-`F12` erzeugt keinen zweiten Beleg | E2E |
| K12 | Gutschein: Mehrzweck → Zahlart; Einzweck → Position; Verkauf + Einlösung im selben Bon gesperrt | E2E beide Einstellungen |
| K13 | Kundenkarte: Scan zeigt Name/Stufe/Vorteile, keine Kontaktdaten/Umsatz; Vorteil vormerken ohne Dialog, Chipbreite bleibt; Einlösung nach Buchung; Fehlercodes als Text | E2E |
| K14 | Anzahlung: Chip → Position mit Steuersatz der AB → Beleg trägt `auftrag`; Betrag > offen verlangt Freigabe; AB mit zwei Sätzen ohne Aufteilung → Chip deaktiviert mit Text | E2E |
| K15 | Bon > 400,00 € ohne Kunde: Zahlart öffnet „Rechnung auf eine Firma?“; „Nein, Privatkauf“ = 1 Tipp, keine Daten; genau 400,00 € → keine Frage; mit Kunde keine Frage; Retoure/Zahlung auf Rechnung keine Frage | E2E |
| K16 | Storno mit Freigabe: Mitarbeiterin füllt Grund, Leitung tippt Kachel + PIN, Storno erfolgt, Kiosk bleibt bei der Mitarbeiterin; Grund-Chips ohne „Kundenwunsch“; Kartenbeleg ohne Fähigkeit gesperrt mit Text + Aufgabe | E2E zwei Rollen |
| K17 | Retoure: Standard je Grund (Kulanz → Gutschein; Mangel bar bezahlt → Bar ohne Freigabe; FAGG → Original-Zahlungsweg, Gutschein nur mit Haken); ohne Fähigkeit Weg A16 (Leitung) | E2E Mock beide Stände |
| K18 | Bargeld: Entnahme → Rückgängig in 6 s → keine Buchung, keine Lade; nach 6 s Buchung + Lade; Bedienerwechsel führt `flush()` aus; Ausgabe ohne Foto legt Aufgabe an | E2E Mock |
| K19 | Abschluss: Tagesstart-Wert = Anfang (Quelle), Mitarbeiterin kann ihn nicht ändern; 15 Stückelungen, aktive Zeile und Tastatur gleichzeitig sichtbar (1180 × 820, 1080 × 810); Blind zählen verbirgt Soll; Grund ab Toleranz Pflicht; Abschließen nur Leitung; PDF vorhanden | E2E + Screenshot |
| K20 | Tag abgeschlossen: Band, Suchfeld/Zahlarten deaktiviert mit Text | E2E |
| K21 | Bedienerwechsel < 3 s; offener Bon geparkt und angeboten; 5 falsche PINs → Sperre mit Countdown-Text; Wechsel bei laufender Karte gesperrt | E2E |
| K22 | Idle: Band bei 14:30 min, Sperre bei 15:00 ohne Datenverlust; Scanner setzt zurück; Tipp aufs Band löst keine darunterliegende Taste aus; keine Sperre bei laufendem Terminal | E2E Zeitsimulation |
| K23 | Ohne Tastatur keine `<kbd>`; nach erster F-Taste sichtbar (12 px); alle Kürzel §2.5 wirken; `F1` zeigt dieselbe Tabelle | E2E |
| K24 | Druckfehler blockiert nie das Buchen; Ergebnis-Karte bietet Nochmals/A4/Display | E2E Mock |
| K25 | Netz weg: Band „Verkauf erst nach Rückkehr“, Bon bleibt; nach Rückkehr weiter | E2E Netz trennen |
| K26 | Kundendisplay: Positionen, Karte-Aufforderung, Dank mit Rückgeld, Ruhetext, **ohne Namen** (Standard); ohne Verbindung „Anzeige pausiert“ | E2E zweites Fenster |
| K27 | Ansagen: VoiceOver liest Hinzufügen (gebündelt), Gesamt, Terminal-Status, Bänder, Ergebnis; Positionszeile „Vase Alva, 3 Stück, 89,70 Euro“ | manuell VoiceOver iPad |
| K28 | Schriften im Kiosk ≥ 14 px außer `<kbd>` 12 px; keine Bodoni-Ziffern außer Display-Ruhebild/Bon-Kopf; Ziele ≥ 48 px; Zahlentasten 64 px | CSS-Grep + Maß |
| K29 | Toast im Kiosk in der linken Spalte, max. 2, 6 s, pausiert bei Berührung des Toasts; schneidet nie die rechte Spalte/Summenleiste (1180 × 820, 1080 × 810, 820 × 1180) | Screenshot |
| K30 | Bon-Summe ohne Hochzählen; 5 Scans in 2 s: Direktwechsel + Farbimpuls 160 ms | E2E |
| K31 | Bon über Schwelle ohne Kunde: „Karte“ öffnet erst die Rechnungsfrage, Terminal startet danach; „Zurück“ landet im Bon | E2E |
| K32 | Nach „Karte bezahlt“: `Esc`, „‹ Bon“, Artikel-Scan ändern den Bon nicht; einziger Weg ist Kassieren; Scan während „wartet“ ändert den Bon nicht | E2E Mock |
| K33 | `F10` × 4 startet nie das Terminal | E2E Tastatur |
| K34 | Doppeltipp in 150 ms auf „Kassieren 129,60 €“ erzeugt keinen Beleg (300-ms-Sperre); im Bon gibt es keinen dauerhaft deaktivierten Primärknopf (außer leerer Bon) | E2E Touch |
| K35 | Jeder Schnellbetrag bucht mit einem Tipp; „200 €“ bei 129,60 → Rückgeld 70,40 | Unit + E2E |
| K36 | Positionsliste: axe `nested-interactive` = 0; Roving-Fokus mit `↑/↓`; Scanner wirkt bei Fokus in der Liste | axe + E2E |
| K37 | Genau ein `⋯` im Verkauf; „Bon ▾“ beschriftet; Nullbeleg/Training nur Leitung | Grep + E2E Rollen |
| K38 | Einzelpreis bei Artikeln für Rolle Mitarbeiter schreibgeschützt; „Preis ändern · Leitung“ mit Freigabe | E2E |
| K39 | Freigabe: Eingaben der Mitarbeiterin überleben den 60-s-Ablauf; Warnung ab 45 s; „Weiter“ verlängert | E2E Zeitsimulation |
| K40 | E-Mail auf der Ergebnis-Karte: Senden → Rückgängig → `beleg_mailen` nicht aufgerufen | E2E Mock |
| K41 | Kein Kiosk-Text verweist die Rolle Mitarbeiter auf Faktura, Shop-Verwaltung oder Stripe; jeder Übergangsfall legt genau eine Aufgabe an | Grep + E2E |
| K42 | Training bleibt bei zwei höherrangigen Bändern sichtbar (Pille im Kopf); „+n“ öffnet alle Bänder | E2E |
| K43 | Tippzähler: A1 2, A2 2, A3 3 (Karte), A6 4, A14 3, A16 per Bon-Scan 6, A17 1 | E2E `zaehleTipps()` |
| K44 | Bänder Rang 2–9 erscheinen während Zahlmaske/Ergebnis erst nach Verlassen; „Kassieren“ bewegt sich nicht | E2E |
| K45 | Fähigkeit aus → Knopf sichtbar, deaktiviert, Grund als Text; nie Fehler nach dem Tipp | E2E Mock je Fähigkeit |
| F1 | Abschöpfung ändert die Differenz nicht (mit `abschoepfung`: Ist 1.100,12, Abschöpfung 950,12 → Differenz unverändert, Endbestand 150,00; ohne: Entnahme vor dem Zählen → Differenz korrekt) | Unit + E2E Mock |
| F2 | Wiederöffnen + Neuzählung bucht die neue Differenz (mit `abschluss_oeffnen`); ohne Fähigkeit ist „Öffnen“ deaktiviert | E2E Mock |
| F3 | Mitarbeiter kann Training weder schalten noch per Beleg senden (Server lehnt ab; Client sendet `trainings` nie) | Unit (Action) + Frappe-Staging |
| F4 | Gleicher PaymentIntent erzeugt keinen zweiten Beleg; zweiter Versuch liefert den vorhandenen Beleg | E2E Mock + Staging |
| F5 | Gutschein-Verkauf liefert einen Code auf der Ergebnis-Karte; Ausfall von `sell_voucher` → „wird nachgereicht“ + Wiederholung mit gleichem Schlüssel + Aufgabe | E2E Mock |
| F6 | Storno einer Anzahlung ändert den Zahlungsplan (mit `storno_ursprung`); ohne Fähigkeit gesperrt mit Text + Aufgabe | E2E Mock |
| F7 | Überweisung ohne Fähigkeit nicht wählbar; mit Fähigkeit nur mit Kunde, `PH Zahlung.status = Offen` | E2E Mock |
| F8 | Bar-Summe je Auftrag ≥ 10.000 € über zwei Belege verlangt Identität + Freigabe; ab `bar_obergrenze_ab` harter Stopp | Unit + E2E |
| F9 | Tagesstart-Wert nach Abschöpfung = Wechselgeld (nicht Ist des Vortags) | Unit `bargeld.js` |
| F10 | Retoure FAGG: ohne Haken kein Gutschein als Auszahlung; abgelaufene Frist sperrt den Grund | E2E |
| V1 | Übersicht: 5 Kennzahlen + 2 Charts; „Heute kassiert“ ohne Überweisung; Buchhaltung extern sieht Export-Block | E2E Rollen |
| V2 | Belegliste: Filter in URL, Ansichten, Summenzeile mit Storno/Training-Zusatz, kein Neu, nicht bearbeitbar; Filter-leer-Text mit „Filter zurücksetzen“ | E2E |
| V3 | Beleg-Akte: 4 Tabs, QR, Verknüpfungen, Vor-/Folgebeleg, Zeitleiste ohne JSON | E2E |
| V4 | Abschluss-Akte: „Abschließen“ öffnet Assistent ab Schritt 3; „Öffnen“ nach Fähigkeit | E2E |
| V5 | Kassenbuch: Buchungen/Tage, Zweck, Anhang-Symbol, `bestand_danach_cent` ausgeblendet ohne `kassenbuch_barbelege`, Storno nur Leitung | E2E |
| V6 | Kassen-Akte: Checkliste + Echtbetriebs-Schranke; AES-Dialog schließt erst nach Haken „Schlüssel gesichert“; DEP mit Prüfsumme; Schlussbeleg nur mit Tippfeld | E2E Mock |
| V7 | Ereignisse: über 48 h `danger` mit Text; „Als gemeldet markieren“ mit Datum/Nachweis | E2E |
| V8 | Berichte: 7 Reports mit Zeitraum, Summenzeile, CSV; „Kassenkontrolle je Bediener“ nur Leitung/GF, ohne Chart; Steuersatz-Report mit Banner und Zusatzspalten bis P17 | E2E Rollen |
| V9 | Bediener: PIN setzen über ph_core, PIN nie angezeigt; Geräte-Reiter | E2E |
| V10 | Einstellungen: Schwellen/Gutscheinart/Toleranz/Testmodus nur über „Ändern“-Dialog mit Kommentar; übrige Felder Autosave | E2E |
| X1 | Keine Frappe-Begriffe in UI-Texten (Grep „Submit“, „Cancel“, „DocType“, „Draft“ = 0) | Grep |
| X2 | Keine Superlative, keine erfundenen Zahlen; Beträge de-AT aus Cent | Review |
| X3 | Jede Server Action prüft Sitzung + Rolle; Leitungsaktionen ohne gültige Freigabe-Sitzung scheitern serverseitig; Service-Token nie für Belege | Unit |
| X4 | Budgets: Position → Summe < 100 ms Client; Buchen → Druckauftrag < 1,5 s (Mock < 300 ms); Kiosk-JS ≤ 250 kB gzip | Trace, Build |
| X5 | `prefers-reduced-motion`: Shake/Translate weg, Crossfade 120 ms bleibt, Information bleibt (Farbe + Text + Symbol); Undo-Balken steht voll, Text zählt sekündlich | E2E reduce |
| X6 | axe serious/critical = 0 auf Verkauf, Zahlmaske, Ergebnis, Abschluss, Belegliste, Beleg-Akte | axe |
| X7 | Hilfe-Artikel `backoffice/hilfe/kassa/{verkauf,zahlung,storno-retoure,abschluss,bargeld,offline,kassen}.md` vorhanden | Dateicheck |
| X8 | IndexedDB nicht verfügbar → Kiosk läuft, Band „Entwurf wird nicht gesichert“ | E2E (Storage blockiert) |

---

## 13. Bewegung (Kassa, nach 04, Token-Namen)

| Element | Animation | Dauer / Kurve | Reduced Motion |
|---|---|---|---|
| Druck-Zustand Taste | `background-color` → `surface-3` | `--bo-dur-ack` 50 ms | gleich |
| Neue Position | `opacity` 0→1 + `translateY(4px)`→0; Balken links `success` | 120 ms `--bo-ease-out`; Balken 1500 ms | nur Opazität |
| Position doppelt | Hintergrund `warning-soft` + Text unter dem Suchfeld | 1200 ms / Text 1500 ms | gleich |
| Position entfernen | `opacity` + Höhe über `grid-template-rows` | 120 ms `--bo-ease-in` | nur Opazität |
| Bon-Summe | Direktwechsel + `color` `accent-text` | 160 ms | ohne Farbimpuls |
| Kundenzeile erscheint | `opacity` + `translateY(4px)` | `--bo-dur-base` 160 ms `--bo-ease-out` | Opazität |
| Vorteil-Chip vormerken | Füllung `accent-soft` + Haken-Icon (keine Breitenänderung) | 120 ms `--bo-ease-out` | sofort |
| Mengen-Chip | `opacity` | 120 ms | gleich |
| Schnelltasten Kacheln → Reihe | keine | – | – |
| Zeilenblatt / Sheets | `translateX(16px)` bzw. `translateY(16px)` → 0 + Opazität | Eintritt 200 ms `--bo-ease-out`, Austritt 120 ms `--bo-ease-in` | Opazität 120 ms |
| Zahlmaske ↔ Bon | keine | – | – |
| Freigabe-Schritt einblenden | `grid-template-rows` 0fr→1fr im Dialog | 160 ms `--bo-ease-out` | Opazität |
| Terminal „Wartet“ | statisch, Text wechselt | – | – |
| Terminal „Bezahlt“ / Ergebnis-Haken | `stroke-dashoffset` | `--bo-dur-draw` 400 ms `--bo-ease-inout`, einmal | sofort sichtbar |
| Ergebnis-Inhalte | **alle gemeinsam** `opacity` ab 200 ms | 160 ms `--bo-ease-out` | Crossfade 120 ms |
| Abschluss-Erfolg | Haken 400 ms, Inhalte gemeinsam ab 200 ms | wie Ergebnis | wie Ergebnis |
| Scan unbekannt / Gutschein ungültig | Shake `translateX` ±4 px | 240 ms | nur Rahmenfarbe + Text |
| Bänder | `grid-template-rows` 0fr→1fr | Eintritt 160 ms `--bo-ease-out`, Austritt 120 ms `--bo-ease-in` | Opazität |
| Toast | `opacity` + `translateY(8px)`; Undo-Balken `scaleX` | 160 ms; Balken 6 s `--bo-ease-linear` | Balken steht voll, Text „Rückgängig (6 s)“ zählt sekündlich; der Timer ist die einzige Wahrheit |
| Dialog | 04 §3.5 | 160 ms / 120 ms | Opazität |
| Sperrbild | `opacity` | 240 ms `--bo-ease-out`; Aufheben sofort | gleich |
| Druckstatus | 04 §3.11 | – | – |

Verboten im Kiosk: View Transitions, Stagger, Hover-Transitions, Hochzählen, Pulsieren, Spring.

---

## 14. Was hier geht und in SHD/Branchenkassen nicht

Die SHD-Referenz nennt zur Kasse nur Stichworte („Kasse“, „Zahlungseingang Bank/Kasse“); der Vergleich bezieht sich auf übliche Branchenkassen im Möbelhandel und die Benchmarks aus 01.

1. **Anzahlung und Rechnungszahlung aus der Kundenzeile in drei Tipps** – Karte scannen, Chip „Anzahlung AB-… fällig“, Zahlart; Betrag und Steuersatz kommen aus der AB, der Beleg bucht Zahlung und AB-Stand ohne Doppelerfassung.
2. **„Zahlung erhalten – Beleg offen“ als gesicherter Zustand** – „Karte bezahlt, Kasse hängt“ endet nicht in einer Doppelbuchung oder einem verlorenen Beleg: Bon gesperrt, automatische Versuche, lokales Ablegen, Beleg per E-Mail nachgesendet.
3. **Kundenkarte mit Leistungsvorteilen statt Rabattcode** – Stufe und Vorteile beim Scan, vormerken, Einlösung erst mit dem Beleg, ohne Kontaktdaten am Bildschirm.
4. **Freigabe am Ende** – die Verkäuferin, die den Fall kennt, füllt den Dialog; die Leitung tippt nur Kachel und PIN; Protokoll mit beiden Personen.
5. **Ergebnis-Karte statt Druckdialog** – Rückgeld groß, Belegnummer sofort, Gutschein-Code, E-Mail mit Undo; der nächste Scan beginnt den nächsten Bon.
6. **Rechnung auf Firma ohne Hürde für Privatkunden** – eine Frage über der Schwelle, Privatkauf in einem Tipp, Firmenrechnung mit Anschrift als reproduzierbares A4.
7. **Bargeld ohne Rechenfehler** – Wechselgeld an einer Stelle bestätigt, Zweck je Bewegung, Eingangsbeleg per Foto, Undo statt Rückfrage, Abschöpfung, die die Differenz nicht verfälscht.
8. **Rechtsregeln als Bedienung** – Retoure-Weg je Grund (Gewährleistung, FAGG), Training nur Leitung, Bargrenze je Vorgang, keine Namen am Kundendisplay.
9. **Belegkette prüfbar in der Oberfläche** – Vor-/Folgebeleg, „Beleg prüfen“, „Kette prüfen“, DEP mit Prüfsumme, Ereignisse mit Meldepflicht; Steuerberater-Rolle mit Export.
10. **Eine Oberfläche für iPad, Touch-Monitor und Browser** – ein Login, Arbeitsplatz-Wahl, Gerätebindung, Bedienerwechsel per PIN, Tastatur optional mit voller Belegung.

---

## 15. Offene Punkte und Anfragen

| An | Punkt |
|---|---|
| **Inhaber** | (1) Kassa steht bei Netzausfall, bis der Notbetrieb freigegeben ist (K-03) – bestätigen · (2) Mitarbeiter-Storno eigener Belege von heute: ja/nein, Obergrenze · (3) Blind zählen ja/nein (Vorschlag ja) · (4) Bedienerkarte am Namensschild ja/nein · (5) Kundendisplay ohne Namen (Vorschlag) oder Vorname/Name · (6) CHF annehmen ja/nein · (7) Retoure ohne Beleg nur als Gutschein (Vorschlag ja) · (8) Retoure bar ohne Kontakt über einer Grenze: Name + Unterschrift · (9) Zweck „Kassenkontrolle je Bediener“ und Information an das Team · (10) Kassa darf Firmenkunden anlegen ja/nein |
| **Steuerberater** (über Inhaber) | Gutscheinart (Mehrzweck/Einzweck) · Mehrzweck-Gutschein nicht in der UVA · Abgrenzung Anzahlungen Kassa ↔ Anzahlungsrechnungen · Zahlung auf Rechnung im Kassenumsatz-Bericht · Überweisung im Kassenbeleg als Forderung · Notbeleg-Text und Nacherfassung · Identitätsfeststellung ab 10.000 € bar, Bargeldobergrenze ab 10.07.2027 · Ausfuhr/U 34 · Trinkgeld-Einstellung entfernen · CHF-Kursquelle, Kursdifferenzen · Ausgaben aus der Kassa mit Eingangsbeleg |
| **ph_kassa** | P1 Abschöpfung (`tresor_entnahme_cent`, `bargeld_ende_cent`, `anfang_quelle`, `anfang_grund`, `quelle = abschluss`) · P2 Anfang aus `bargeld_ende_cent` · P3 Bar-Belege ins Kassenbuch · P4 Wiederöffnen storniert Differenz · P5 Training nicht vom Client, nur Leitung, Ereignis · P6 Gutschein ausstellen in `on_submit` (`sell_voucher`), Antwort `gutscheine` · P7 `ursprung_art` · P8 `idempotency_key` + Intent-Doppelprüfung · P10 Rechnungsfrage-Felder + A4 als Rechnung · P11 Positionsfelder (Retoure, Anzahlung Rückzahlung, `bezug_zeile`, Rabatt) + Einstellungen §4.9 + `regeln.pruefe` verdrahten · P12 `retoure_laden`/`retoure_buchen`, `terminal_erstatten`, `terminal_refund` · P13 Bestellung kassieren · P14 Überweisung als Forderung · P15 Kassenbuch `zweck`, `anhang`, `ust_satz` · P16 Rechte `bargeld_anfang_cent`, `Anfangsbestand` · P17 UVA-Report · P19 Bar je Vorgang + `bar_obergrenze_ab` · `code_erkennen`-Wrapper · Page-Methoden Abschluss mit `datum` · `tageswechsel_uhrzeit` verdrahten · Schublade bei Bar-Storno · `freigabe_durch`/`am_geraet_von` am Storno · Kartennummer im Stornobeleg · `bediener`/`umsatzzaehler_klar_cent` permlevel 1 · Number Card „Heute kassiert“ ohne Überweisung · Bon mit Kurzname · Einzweck-Gutschein in der Page · `PH Kasse.jahresbeleg_geprueft()` · DocType `PH Kassa Schnelltaste` · Ereignis „Lade geöffnet“ · Report „Terminalzahlungen ohne Beleg“, `nebenbuchung_status` · Zertifikatsablauf in `erinnerungen()` · `blind_zaehlen`, `differenz_warnung_cent`, `karte_automatisch_buchen`, `kundendisplay_anrede` · Zwischenzählung · `letzter_bestand(kasse, waehrung)` · Notbetrieb-Einspielung · CHF-Felder (nach Entscheidung) |
| **ph_core** | P9 `sitzung_mit_pin(email, pin, geraet_token)` → kurzlebige Sitzung (auch für Freigaben, Ablauf 60 s) · `PH Geraet.standard_terminal` · `verify_badge(code, geraet_token)` · `PH Geraet.offline_erlaubt`, `offline_limit_cent` · `ph_core_pin_hash` auf permlevel 1 / Password |
| **ph_faktura** | P7 Rückbuchung Stornobeleg in `kassenbeleg_gebucht` · P14 `forderung_aus_kassenbeleg` · P18 `_rechnungen.je_satz`, AB-Aufteilung je Satz, Zahlungsplan-Zeilen, `vertragsort`/`fagg_frist_ende` an `_auftraege` · Rückmeldung Anzahlungsrechnung an die Kassa |
| **ph_shop** | `gutschein_pruefen` mit `art`, `steuersatz` · Bestätigung `sell_voucher` für Kanal „Kassa“ und Rolle PH Kassa Mitarbeiter · P13 `bestellung.zahlung_erhalten` · `_bestellungen` mit `rechnung` und Positionen |
| **ph_crm** | Option `quelle = kassa` (sonst `showroom`) · Create-Recht `PH Kontakt` für PH Kassa Mitarbeiter (oder Methode `kontakt_schnellanlage`) · Create-Recht `PH Aufgabe` für Kassa-Rollen · Ausweisfelder (Bar ab 10.000 €) · Anonymisierungs-Hook für Belege |
| **ph_kundenkarte** | P20 `revoke_benefit(einloesung, grund)` · Bestätigung: Vorteil „Lieferung frei“ als Textzeile am Bon ohne Betrag |
| **Fundament** | `KioskShell`: `aria-live`-Region, `data-tastatur`-Erkennung, Kopfzeilen-Slot, Band-Stapel · Toast-Variante Kiosk (Anker „linke Spalte“, `undoMs` je Kontext, verzögerter Commit mit `flush()` bei Sperre/Wechsel) · `useEingabesperre(ms)` · Sitzung je Bediener + Freigabe-Sitzung (Store-Eintrag mit 60 s Ablauf) · Bausteine `Zahlentastatur` (Komma-Modell, Anzeigefeld mit `×`, konfigurierbare 4. Spalte), `Stepper48`, `Wischaktion`, `Unterschrift` (Canvas + Name/PIN), `Positionsgrid` · SSE-Proxy für Realtime · Hintergrundjob PDF-Stapel · Config `kassa.blind_zaehlen` |
| **UX-Lead / 01–05** | Nachzug §0.3: 01 F1, F3, F5, F6 · 02 §1.6, §6.1, §7.2, §8, §9.5, §11.3 · 03 §6.3, §8.6, §8.12, §8.20, Entscheidung (c) · 04 §3.6, §3.7, §3.11–§3.13, §4 · 05 §3.14, §12.4 |

---

## 16. Bauauftrag

Für den Kassa-Agenten. Regeln aus PLAN §10 gelten: jede Seite `requireSession()`/Rechte zuerst, `export const dynamic = "force-dynamic"`; jede Server Action prüft Sitzung + Recht erneut, validiert Eingaben (zod oder `validiere`) und liefert `{ ok, code, message, daten }`; Fehler als `Fehler`-Komponente; Mock-Modus ist Pflicht (Seed ergänzen); keine Änderungen in `Backend-Import/`; keine Laufzeit-Importe aus `../src/`. Bestehende Fundament-Dateien (`KioskShell.js`, `hooks.js`, `Toast.js`, `wechsel/*`, `frappe/client.js`) werden **erweitert, nicht ersetzt**; Änderungen daran stimmt der Agent mit dem Fundament ab (Abhängigkeit §16.7).

### 16.1 Dateien und Routen (`backoffice/`)

```
src/app/(kiosk)/kassa/
  page.js                     Verkauf (ersetzt KioskPlatzhalter; Server Component lädt kassaKontext, rendert <KassaVerkauf>)
  loading.js                  Skelett nach 300 ms
  belege/page.js              Belege heute / suchen (auch als Sheet aus dem Verkauf, ?sheet=1)
  retoure/page.js             Retoure-Assistent (?beleg=)
  abschluss/page.js           Tagesabschluss-Assistent (?datum=, ?ab=3 für Leitung)
  bargeld/page.js             Bargeld-Dialog als Route (Rücksprung ?zurueck=)
  geparkt/page.js             Geparkte Bons
  display/page.js             Kundendisplay (eigenes Layout ohne Kopf, Gerätebindung)
src/app/wechsel/              erweitert: Bedienerkarte-Scan, Rücksprung ?ziel=/kassa/abschluss?ab=3
src/app/kassa/verwaltung/
  layout.js                   Unternavigation aus bereiche.js
  page.js                     V0 Übersicht (ersetzt Platzhalter)
  belege/page.js  belege/[name]/page.js
  abschluesse/page.js  abschluesse/[name]/page.js
  kassenbuch/page.js
  berichte/page.js  berichte/[slug]/page.js
  kassen/page.js  kassen/[id]/page.js
  terminals/page.js  ereignisse/page.js  dep/page.js  einstellungen/page.js  bediener/page.js
src/app/druck/kassenbeleg/[name]/page.js   (?format=bon|a4)
src/app/druck/kassenabschluss/[name]/page.js
src/app/druck/kassenbuch/page.js           (?kasse=&monat=)
src/app/druck/zaehlliste/page.js
src/app/druck/gutschein/[name]/page.js
src/app/api/kassa/display/route.js         SSE-Proxy Kundendisplay (GET, Sitzung + Gerät; Rückfall Polling)
src/app/api/kassa/terminal/route.js        GET Status-Polling (2 s) – nur lesend; Mutationen bleiben Server Actions
src/lib/backoffice/kassa/
  actions.js        "use server" – alle Mutationen (16.3)
  daten.js          server-only Lesefunktionen (Kontext, Listen, Kennzahlen, Akten)
  faehigkeiten.js   Fähigkeiten §0.4 (Frappe: Meta/Probeaufruf, Cache 5 min; Mock: BACKOFFICE_MOCK_FAEHIGKEITEN)
  frappe.js         dünne Wrapper je Page-/Dokumentmethode (Pfad-Konstanten, Argument-Mapping)
  betraege.js       rein: Port logik/betraege.py (Summen, Netto/USt, Rückgeld, Stückelung, Schnellbeträge, Split, Rabatt)
  regeln.js         rein: Port logik/regeln.pruefe (Anzeige der Freigaben), Rechnungsfrage-Schwelle (>), Bar je Vorgang
  codes.js          rein: Port logik/codes.erkennen
  bargeld.js        rein: Bargeld in der Lade (Formel §3.7.2), Tagesstart-Wert (E6), Abschluss-Soll
  abschluss.js      rein: Zählprotokoll-Summe, Differenz, Toleranz-Wort, Münzrollen
  texte.js          alle Kiosk-Texte (Grep-Ziel für K41/X1), Fehlercode → Text
  aufgaben.js       server-only: aufgabeAnlegen(fall, bezug) idempotent
  mock.js           Mock-Ergänzungen: Page-Methoden, Terminal-Simulation, sell_voucher, Zeitraffer für E2E
src/components/Backoffice/Kassa/ (16.2)
src/lib/backoffice/bereiche.js            Eintrag kassa: navigation, doctypes (§2.1)
src/lib/backoffice/mock/seed.js           Kassen K1/K2, SEE, Terminal, 40 Belege, 3 Abschlüsse, Kassenbuch, Bediener mit PIN
backoffice/hilfe/kassa/{verkauf,zahlung,storno-retoure,abschluss,bargeld,offline,kassen}.md
tests/unit/backoffice-kassa-{betraege,regeln,codes,bargeld,abschluss,faehigkeiten}.test.mjs
tests/e2e/kassa-{verkauf,zahlung,karte,freigabe,bargeld,abschluss,retoure,verwaltung,a11y}.spec.js
```

### 16.2 Komponenten (`components/Backoffice/Kassa/`, Client Components wo nötig)

| Komponente | Aufgabe | Props / Zustand (Auszug) |
|---|---|---|
| `KassaVerkauf` | Zustandsautomat Bon/Zahlmaske/Ergebnis/gesperrt (`useReducer`), Entwurf-Spiegel | `kontext`, `faehigkeiten`, `bediener` |
| `KassaKopf` | Kopfzeile, Statusfeld-Popover, Pille TRAINING, `⋯` | `kasse`, `status`, `rolle` |
| `BandStapel` | Bänder Rang 1–9, „+n“-Popover, Verzögerung in Zahlmaske | `baender[]`, `zurueckhalten` |
| `Suchfeld` | combobox, gruppierte Treffer, Mengen-Chip, „Bon ▾“ | `onArtikel`, `onKunde`, `onCode` |
| `Kundenzeile` | Kunde, Stufe, Offen-Chips, Vorteil-Chips, `×` | `kunde`, `offen[]`, `vorteile[]` |
| `OffenChip`, `VorteilChip` | einzelne Chips mit Deaktiviert-Grund | – |
| `Schnelltasten` | Reihe/Kacheln | `leer`, `faehigkeiten` |
| `Positionsgrid` | `role="grid"`, Roving-Tabindex, gesperrt-Zustand | `positionen[]`, `gesperrt` |
| `Positionszeile` | Stepper, Wischaktion, Langdruck | – |
| `Zeilenblatt` | Menge, Preis (RO), Rabatt/Preis mit Freigabe | – |
| `Summenpanel` | Gesamt, Steuersätze, `ZahlartRaster`, Kassieren-Knopf | – |
| `Zahlmaske` | Split-Zeilen, Betragsfeld, Tastatur, Kassieren | `zahlarten[]`, `rest` |
| `SplitZeile`, `TerminalStatus`, `GutscheinFeld` | je Zahlart | – |
| `Betragsfeld` + `Zahlentastatur` | Komma-Modell, `×`, 4. Spalte je Kontext (§3.3.1) | `kontext`, `wert`, `markiert` |
| `Rechnungsfrage`, `Rechnungsempfaenger` | §3.4 | – |
| `Ergebniskarte` | §3.10, linke Spalte gebuchter Bon | – |
| `ZahlungOhneBeleg` | §3.3.6 | – |
| `FreigabeSchritt` | Kacheln Leitung, PIN/Passwort, 60-s-Zeitlimit, Warnung | `aktion`, `zusammenfassung`, `onFreigabe` |
| `StornoDialog`, `RetoureAssistent`, `BargeldDialog`, `TagesstartKarte` | §3.5–§3.7 | – |
| `AbschlussAssistent` (`Schrittleiste`, `Zaehlraster`, `SollIstPanel`, `Unterschrift`) | §3.8 | `rolle`, `faehigkeiten`, `blind` |
| `BelegeSheet`, `BonVorschau`, `GeparktKacheln` | §3.9, §3.13 | – |
| `Kundendisplay` | §9 | – |
| `KassaLive` | gebündelte Ansagen | – |
| `FaehigkeitsGrund` | einheitlicher Deaktiviert-Text | `faehigkeit` |
| Verwaltung: `KassaUebersicht`, `BelegAkte`, `AbschlussAkte`, `KassenAkte`, `EinstellungenKassa`, `BerichtKassa` | §4–§5 auf Basis `DataTable`, `Formular`, `Kennzahl`, `Charts` | – |
| Hooks (`kassa/hooks.js`) | `useEingabesperre(ms)`, `useEntwurf(bediener)` (IndexedDB, try/catch), `useVerzoegerterCommit(ms)` mit `flush()`, `useTerminalPolling`, `useIdle(15 min, 30 s Band)`, `useDisplayKanal` | – |

### 16.3 Server Actions (`lib/backoffice/kassa/actions.js`)

Alle mit `requireSession()` + Rolle; Freigabe-Aktionen zusätzlich mit gültigem `freigabeToken` (Store-Eintrag der Leitungs-Sitzung, 60 s, einmal verwendbar). Rückgabe `{ ok, code, message, daten }`; Fehlercodes `invalid | forbidden | not_found | conflict | rate_limited | unavailable | auth | faehigkeit`.

| Action | Eingabe | Frappe-Aufruf(e) | Rolle |
|---|---|---|---|
| `kassaKontext(kasse?)` | – | `P.kontext`, `rksv.api.kassen_status`, `faehigkeiten()` | Kassa * |
| `kassaSuche(q)` | ≥ 2 Zeichen, nicht reine Ziffern < 4 | `P.suche_produkt` ‖ `P.suche_kunde` | Kassa * |
| `codeAuswerten(code)` | – | Wrapper `code_erkennen` bzw. `codes.js` + `lookup_card` / `P.gutschein_pruefen` / `rksv.api.beleg_daten` | Kassa * |
| `belegVorschau(entwurf)` | Positionen, Zahlarten, Kontakt | `P.beleg_vorschau` (+ `regeln.js`) | Kassa * |
| `kassieren(entwurf, idempotencyKey, freigaben?)` | Entwurf, Schlüssel | `P.beleg_buchen` (ohne `trainings`; `idempotency_key` mit Fähigkeit); danach `sell_voucher` je Gutschein-Position, `redeem_benefit` je vorgemerktem Vorteil; bei Rechnung auf Firma A4-PDF erzeugen und ablegen | Kassa * |
| `gutscheinAusstellen(beleg, idx)` | Wiederholung | `ph_shop.api.backoffice.sell_voucher` (gleicher Schlüssel) | Kassa * |
| `terminalStarten / terminalAbbrechen / terminalSimulieren` | Kasse, Terminal, Betrag | `P.terminal_start` / `P.terminal_abbruch` / `P.terminal_simulieren` | Kassa * |
| `terminalStatus(intent)` (Route-Handler GET) | – | `P.terminal_status` | Kassa * |
| `gutscheinPruefen(code)` | – | `P.gutschein_pruefen` | Kassa * |
| `belegDrucken(beleg, modus)` · `belegMailen(beleg, email)` | – | `P.beleg_drucken` · `P.beleg_mailen` | Kassa * |
| `kontaktAnlegen(daten)` | Name, Anschrift, UID, E-Mail | `insert("PH Kontakt", {quelle: "showroom", …})` | Fähigkeit |
| `freigabeAnmelden(leitung, pin | passwort, aktion)` | – | `sitzung_mit_pin` bzw. `POST /api/method/login`; Rolle `PH Kassa Leitung` prüfen; liefert `freigabeToken` | Kassa * |
| `stornieren(beleg, grund, freigabeToken?)` | Grund-Chip | `P.storno` in Leitungs-Sitzung; danach `cancel_voucher_sale` (Gutschein-Verkauf), Lade öffnen (Bar), Kommentar; Freigabe-Sitzung abmelden | Leitung / Freigabe |
| `retoureLaden(beleg)` · `retoureBuchen(…)` | – | `retoure_laden` · `retoure_buchen` (Fähigkeit); Übergang A16: `P.storno` + `P.beleg_buchen` | Kassa * / Leitung |
| `nullbeleg(kasse)` | – | `P.nullbeleg` | Leitung |
| `trainingSchalten(kasse, an, grund)` | – | `P.trainingsmodus` + Kommentar/Ereignis; Ausschalten nur bei Echtbetriebs-Schranke | Leitung |
| `bargeldBuchen(kasse, art, betrag, zweck, grund, foto?, freigabeToken?)` | nach Client-Verzögerung | `P.kassenbuch_buchen` (+ `uploadFile` an `PH Kassenbuch`); danach Lade öffnen | Kassa * |
| `ladeOeffnen(kasse)` | – | Druckdienst Schublade + Kommentar `PH Kasse` | Kassa * |
| `tagesstartBestaetigen(kasse, wert, quelle, grund?, freigabeToken?)` | – | `P.abschluss_laden` + Kommentar | Kassa * / Freigabe |
| `zaehlungUebergeben(kasse, protokoll, anfang)` | – | `P.abschluss_zaehlen` (Anfang nur ohne `anfang_server`); `aufgabeAnlegen("abschluss_gezaehlt")` | Kassa * |
| `abschliessen(kasse, grund, unterschrift, name, tresor?)` | – | `P.abschluss_abschliessen` (`tresor_entnahme_cent` mit Fähigkeit) | Leitung |
| `abschlussNeuBerechnen(name)` · `abschlussOeffnen(name, grund)` | – | `run_doc_method neu_berechnen` · `oeffnen` (Fähigkeit) | Leitung |
| `aufgabeAnlegen(fall, bezug)` | Fallschlüssel | `insert("PH Aufgabe")` (idempotent über Suche `referenz_*` + Fall); ohne Create-Recht über `backofficeService()` als Systemaufgabe mit Bediener im Text | Kassa * |
| `displaySenden(kasse, zustand)` | – | `P.display_senden` | Kassa * |
| Verwaltung: `kasseMethode`, `seeMethode`, `belegPruefen`, `kassenbuchStornieren`, `depPruefen`, `ereignisGemeldet`, `terminalAbfragen`, `pinSetzen`, `einstellungAendern(feld, wert, kommentar)` | Whitelist je Methode | `run_doc_method` / `save` / `ph_core.api.bediener.set_pin` | Leitung / Admin |

`frappe.js` hält die Pfade an einer Stelle: `P = "ph_kassa.ph_kassa.page.ph_kassa.ph_kassa"`, `RKSV = "ph_kassa.rksv.api"`, `SHOP = "ph_shop.api.backoffice"`, `KK = "ph_kundenkarte.api"`, `CORE = "ph_core.api"`; Aufruf über `client.method(pfad, args)`. JSON-Argumente (`positionen`, `zahlarten`, `zaehlprotokoll`) werden als String übergeben (Page erwartet `_json`).

### 16.4 Reihenfolge (Pakete, jedes einzeln abnehmbar im Mock)

| # | Paket | Inhalt | Ergebnis / Abnahme |
|---|---|---|---|
| 0 | Grundlagen | `betraege.js`, `regeln.js`, `codes.js`, `bargeld.js`, `abschluss.js` (rein, Unit-Tests gegen Python-Beispiele), `faehigkeiten.js`, `frappe.js`, `texte.js`, Mock-Page-Methoden + Seed, `bereiche.js` | Unit grün; K6, K7, K8, K35, F1, F9 als Unit |
| 1 | Kiosk-Gerüst | Route-Struktur, `KassaKopf`, `BandStapel`, `KassaLive`, `useEingabesperre`, `useEntwurf`, `useIdle`, Kiosk-Toast-Variante, Tagesstart-Karte | Leeres Verkaufsbild, Bänder, Pille, Idle (K22, K42, K44, X8) |
| 2 | Bon | `Suchfeld` (gruppiert), `Kundenzeile` + Chips, `Schnelltasten`, `Positionsgrid`, `Zeilenblatt`, Parken/Verwerfen, `Summenpanel` | K2–K4, K13, K14, K30, K36–K38 |
| 3 | Zahlung bar/Gutschein + Ergebnis | `Zahlmaske`, `Zahlentastatur`, Split, Rechnungsfrage/-empfänger, `kassieren`, `Ergebniskarte`, E-Mail mit Undo, `sell_voucher`-Nachlauf | K1, K5, K11, K12, K15, K31, K34, K35, K40, F5 |
| 4 | Karte | `TerminalStatus`, Polling, Sperre, Abbruch-Regeln, `ZahlungOhneBeleg`, Puffer „zu klären“ | K9, K10, K32, K33, F4 |
| 5 | Sitzung + Freigabe | `/wechsel`-Erweiterung, `freigabeAnmelden`, `FreigabeSchritt`, Rabatt/Preis mit Freigabe | K21, K39, X3 |
| 6 | Belege + Storno | `BelegeSheet`, `BonVorschau`, Nachdruck, `StornoDialog`, Sperren mit Aufgabe | K16, K41, F6 |
| 7 | Bargeld + Abschluss | `BargeldDialog` (verzögerter Commit, Zweck, Foto), `AbschlussAssistent` (Rollen, Blind, Wechsel, Abschöpfung nach Fähigkeit) | K18, K19, K20, F1–F3, F9 |
| 8 | Retoure | `RetoureAssistent` (Fähigkeit) + Übergang A16 | K17, F10 |
| 9 | Verwaltung | V0–V10, Akten, Berichte, Einstellungen-Dialog, Kassen-Akte mit Schranke | V1–V10 |
| 10 | Druck + Display | Druckrouten, `useDruck`-Anbindung ESC/POS/QZ/PDF, Kundendisplay + SSE | K24, K26 |
| 11 | Härtung | Hilfe-Artikel, axe, Reduced Motion, Budgets, Tippzähler, Textprüfung | K23, K27–K29, K43, K45, X1–X7 |

Pakete 0–4 und 6 sind „jetzt bauen“ (Freigabestufe Fach); 5, 7, 8 bauen mit Fähigkeiten-Schaltern; 9–11 parallel ab Paket 2 möglich.

### 16.5 Aufwand (Schätzung in Agent-Stunden, ohne Wartezeit auf Server-Änderungen)

| Paket | h |
|---|---|
| 0 Grundlagen | 7 |
| 1 Kiosk-Gerüst | 6 |
| 2 Bon | 12 |
| 3 Zahlung bar/Gutschein + Ergebnis | 11 |
| 4 Karte | 7 |
| 5 Sitzung + Freigabe | 6 |
| 6 Belege + Storno | 6 |
| 7 Bargeld + Abschluss | 11 |
| 8 Retoure | 5 |
| 9 Verwaltung | 15 |
| 10 Druck + Display | 7 |
| 11 Härtung + Tests (E2E, axe, Hilfe) | 10 |
| **Summe** | **103** |

Zuschlag bei Frappe-Staging-Abnahme je umgeschalteter Fähigkeit: 0,5–1 h (Wrapper anpassen, E2E auf Staging).

### 16.6 Frappe-Aufrufe je Paket (Prüfliste für Staging)

| Paket | Aufrufe |
|---|---|
| 1 | `P.kontext`, `rksv.api.kassen_status`, `ph_core.api.geraete.verify_device/touch_device`, `P.abschluss_laden` |
| 2 | `P.suche_produkt`, `P.suche_kunde`, `ph_kundenkarte.api.lookup_card`, `P.beleg_vorschau` |
| 3 | `P.beleg_buchen`, `P.gutschein_pruefen`, `ph_shop.api.backoffice.sell_voucher`, `ph_kundenkarte.api.redeem_benefit`, `P.beleg_drucken`, `P.beleg_mailen`, `insert PH Kontakt` |
| 4 | `P.terminal_start/status/abbruch/simulieren` |
| 5 | `ph_core.api.bediener.list_operators/verify_pin` (+ `sitzung_mit_pin`), `/api/method/login`, `/api/method/logout` |
| 6 | `P.belege_heute`, `P.letzter_beleg`, `getList PH Kassenbeleg`, `rksv.api.beleg_daten`, `P.storno`, `ph_shop.api.backoffice.cancel_voucher_sale`, `insert PH Aufgabe` |
| 7 | `P.kassenbuch_buchen`, `uploadFile`, `P.abschluss_laden/abschluss_zaehlen/abschluss_abschliessen`, `PH Kassenabschluss.neu_berechnen` |
| 8 | `retoure_laden`, `retoure_buchen` (Fähigkeit) bzw. `P.storno` + `P.beleg_buchen` |
| 9 | `getList`/`getDoc`/`getReport` für alle Kassa-DocTypes und 7 Reports, `run_doc_method` (`PH Kasse.*`, `PH Signatureinheit.*`, `PH Kassenbeleg.pruefen/qr_svg`, `PH Kassenbuch.stornieren`, `PH DEP Export.pruefsumme_pruefen`, `PH Kassa Ereignis.als_gemeldet_markieren`, `PH Terminal.status_abfragen`, `PH Kassenabschluss.oeffnen`), `ph_core.api.bediener.set_pin`, `ph_core.api.geraete.list_devices`, `save PH Kassa Einstellungen` |
| 10 | `getPdf` (Print Formats `PH Kassenbeleg Bon 80mm`, `PH Kassenbeleg A4`, `PH Kassenabschluss Protokoll`), `P.display_senden`, Realtime `_display` |

### 16.7 Abhängigkeiten zu anderen Bereichen

| Bereich | Was die Kassa braucht | Was die Kassa liefert |
|---|---|---|
| **Fundament** | Kiosk-Toast-Variante, `useEingabesperre`, Freigabe-Sitzung im Store, `Zahlentastatur`, `Positionsgrid`, SSE-Proxy, Hintergrundjob PDF, Config `kassa.blind_zaehlen` | Bausteine zurück ins UI-Kit, wenn Packtisch sie braucht (`Zahlentastatur`, `Stepper48`, `Wischaktion`) |
| **Zentrale** | Glocke/Zu erledigen zeigt `PH Aufgabe` mit Bereich Kassa | Kennzahlen Heute kassiert, Belege heute, Offene Abschlüsse |
| **CRM** | `PH Kontakt` anlegen (Recht/Methode), `PH Aufgabe` anlegen, Kontakt-Akte Reiter „Kassenbelege“ | Kontakte aus Rechnung auf Firma (`quelle = showroom`) |
| **Faktura** | `_auftraege`/`_rechnungen` mit Satz-Aufteilung, Zahlungsplan-Zeilen, FAGG-Feldern; Rückbuchung Storno; Forderung aus Überweisung | Anzahlungen/Teilzahlungen über `kassenbeleg_gebucht` |
| **Shop** | `sell_voucher`, `cancel_voucher_sale`, `gutschein_pruefen` mit Art/Satz, `zahlung_erhalten` für Bestellungen | Gutschein-Verkäufe, -Einlösungen, Bestellungszahlungen (Fähigkeit) |
| **Logistik / Packtisch** | – | „bezahlt an Kassa 1“ an der Bestellung (mit `bestellung_kassieren`); gemeinsame Kiosk-Bausteine |
| **Kundenkarte** | `lookup_card`, `redeem_benefit`, `revoke_benefit` | Einlösungen mit Bezug Kassenbeleg |
| **Personal** | – (Bediener nur Name, keine Auswertung) | – |
| **Sortiment** | Produktsuche/Preise (`P.suche_produkt` liest `PH Produkt`) | – |

### 16.8 QA-Checkliste (vor Abnahme abhaken)

- [ ] Unit: `betraege`, `regeln`, `codes`, `bargeld`, `abschluss`, `faehigkeiten` grün; Testfälle aus `ph_kassa/tests` übernommen.
- [ ] Mock: jede Fähigkeit einzeln an/aus geschaltet, beide Zustände per E2E geprüft (K45).
- [ ] E2E Kiosk K1–K45 auf 1180 × 820, 820 × 1180, 1080 × 810; Touch und Tastatur.
- [ ] E2E Fachlogik F1–F10 im Mock; F3, F4 zusätzlich auf Staging, sobald P5/P8 da sind.
- [ ] Tippzähler K43 stimmt mit §1.1 überein.
- [ ] axe serious/critical = 0 (X6), `nested-interactive` = 0 (K36).
- [ ] VoiceOver iPad: Hinzufügen, Gesamt, Terminal, Bänder, Ergebnis, Freigabe (K27).
- [ ] Reduced Motion (X5); keine verbotenen Animationen (§13).
- [ ] Grep: kein „Submit/Cancel/DocType/Draft“ (X1); kein „Faktura/Shop-Verwaltung/Stripe“ in Kiosk-Texten für Mitarbeiter (K41); genau ein `⋯` im Verkauf (K37); kein `trainings` in Aufrufen von `P.beleg_buchen` (F3).
- [ ] Screenshots: Zahlmaske ≤ 568 px (K5), Toast nie über der rechten Spalte (K29), Zählen mit Tastatur und aktiver Zeile (K19).
- [ ] Rollen-E2E: Mitarbeiter, Leitung, GF, Buchhaltung extern, Admin – Navigation, Direktaufrufe, Server-Ablehnung (X3, V1, V8).
- [ ] Budgets X4 (Trace, Build-Größe Kiosk-JS).
- [ ] Hilfe-Artikel vorhanden (X7).
- [ ] Echtbetriebs-Schranke: „Training aus“ bleibt gesperrt, solange eine Pflicht-Fähigkeit fehlt (V6).
- [ ] Keine Geheimnisse, keine echten Personendaten im Seed, keine Superlative (X2).

---

## 17. Änderungsprotokoll (Fassung 2 → Fassung 3)

| Quelle | Befund | Umsetzung in Fassung 3 |
|---|---|---|
| 20 P1-01 / B-01 | Rechnungsempfänger erst beim Kassieren | Frage beim Betreten der Zahlmaske, vor Terminalstart; „Zurück“ → Bon (§3.3, §3.4, K31) |
| 20 P1-02 / B-02 | Bon nach „Karte bezahlt“ änderbar | Bon gesperrt ab Terminalstart, `Esc` ohne Wirkung nach bezahlt, Scan ignoriert; Zeile „Betrag ändert sich nach Start“ gestrichen (§2.4, §3.3.4, K32) |
| 20 P1-03 / B-03 | `F10`-Zyklus startet Karte | Kein Zyklus; `F10` in Zahlmaske = Popover (§2.5, K33) |
| 20 P1-04 / B-04 | toter Kassieren-Knopf, Ghost-Tap | „Kassieren 129,60 €“ aktiv; 300-ms-Sperre auch für Tasten (§3.0, §3.1, E14, K34) |
| 20 P1-05 / B-05 | zwei Schnellbetrag-Regeln | jeder Schnellbetrag bucht sofort; „Gegeben“ vorbelegt (§3.3.2, K35) |
| 20 P1-06 / B-06 | Split-Zahlen falsch | Regel Anteil/gegeben/Rückgeld, Wireframe korrigiert (§3.3.3, K8) |
| 20 P1-07 / B-07 | Zahlmaske zu hoch | ≤ 568 px ohne Split; K5 mit zwei Bändern + Safe-Area (§3.3, K5) |
| 20 P1-08 / B-11 / A-01 | Listbox mit Knöpfen | `role="grid"`, Roving-Tabindex, combobox nur für Treffer (§2.4, §3.1, K36) |
| 20 P1-09 / B-12 / M-01 | zwei Suchfelder | ein Suchfeld mit Gruppen; Chip „Laufkunde“ entfällt; Kopfbereich 168 px (§3.1, §2.5) |
| 20 P1-10 / B-13 / A-02 | Toast verdeckt Kassieren | Toast in der linken Spalte (§0.1, §3.1, §3.2, K29) |
| 20 P1-11 / B-16 | Einzelpreis frei = Rabatt ohne Leitung | Einzelpreis bei Artikeln RO, „Preis ändern · Leitung“ (§3.1, K38) |
| 20 P1-12 / B-17 | zwei `⋯` | ein `⋯` im Kopf, „Bon ▾“ beschriftet; Nullbeleg nur Leitung (§3.1, K37) |
| 20 P1-13 / B-19 / B-20 / A-03 | Leitung übernimmt ganze Aktion, Zeitlimit ohne Warnung | „Freigabe am Ende“ mit 15-s-Warnung, Eingaben bleiben (§3.11, §3.6, K39) |
| 20 P1-14 / B-21 | Abschluss per „Leitung übernimmt“, L1 falsch | Leitung per Bedienerwechsel oder Verwaltung, Band 2a, Schrittleiste rollenbezogen, L1 = 5–7 (§3.8, §1.2) |
| 20 P1-15 / B-22 | Zähl-Sheet verdeckt Zeilen | Tastatur fest in Spalte 3 ab 1100 px, darunter `scroll-margin-bottom` (§3.8, K19) |
| 20 P1-16 / B-25 | Anfangsbestand an zwei Stellen | Tagesstart-Karte als einzige Stelle, Segment entfällt (§3.7.1, E6) |
| 20 P1-17 / B-26 | Kassenbuch ohne Undo | Knopftext mit Betrag, verzögerter Commit 6 s, Lade mit Commit, Warnung vorher (§3.7.2, K18) |
| 20 P1-18 / B-28 | E-Mail per Häkchen | Knopf mit 6-s-Undo (§3.10, K40) |
| 20 P1-19 / B-30 | Texte schicken in fremde Bereiche | automatische `PH Aufgabe`, Regel §3.14, Gutschein-/Bar-Weg (K41) |
| 20 P1-20 | 4. Spalte offen, `×` fehlt | Tabelle je Kontext, `×` im Anzeigefeld (§3.3.1) |
| 20 P1-21 | `<kbd>` 11 px | 12 px als Ausnahme K-12, K28 angepasst |
| 20 P1-22 / §1.8 | Abweichungen unvollständig | §0.3 um K-01 bis K-13 erweitert; K-03 als Inhaber-Punkt (§15) |
| 20 P1-23 / B-31 | Ausweg „Ohne Anschrift“ | ersetzt durch Fach R2 (Frage, Privatkauf ohne Daten) – E1 |
| 20 P1-24 / BW-01 | Stagger-Formulierung | „alle Inhalte gemeinsam“ (§3.8, §3.10, §13) |
| 20 P1-25 / §1.11 | Klickzahlen zu niedrig | §1.1/§1.2 nachgezählt, K43 |
| 20 P2-01 / B-08 / B-09 | Terminal-Wahl, Abbruch bei PIN | Standard-Terminal je Gerät, Abbruch nur im Zustand „wartet“ (§3.3.4) |
| 20 P2-02 / B-10 | Zahlung ohne Beleg ohne Automatik | 3 Versuche, lokales Ablegen, E-Mail-Nachsendung (§3.3.6, K10) |
| 20 P2-03 / M-02 | leerer Bon kahl | Schnelltasten als Kacheln 120 × 88 (§3.1) |
| 20 P2-04 / B-34 / B-35 | Training im „+1“, Bänder verschieben Kassieren | Pille TRAINING, „+n“-Knopf, Bänder verzögert (§3.1, K42, K44) |
| 20 P2-05 / B-23 | keine Blindzählung | Schalter, Vorschlag an (§3.8, E12) |
| 20 P2-06 / B-24 | geparkte Bons im Abschluss unsichtbar | Schritt 1 listet sie (§3.8) |
| 20 P2-07 / A-04 | PIN ohne Alternative | Bedienerkarte als Fähigkeit (§2.2) |
| 20 P2-08 / A-05–A-08 | Ansagen, Doppel-Scan, Langdruck, Zielgrößen | Bündelung, sichtbarer Text, `Shift+F10`/`×`, 48 × 48 (§3.0, §3.1, §2.5) |
| 20 P2-09 / B-14 / B-15 | Steuerkürzel, Ziffernsuche | Satz nur bei Abweichung; Ziffern < 4 ohne Suche (§2.4, §3.1) |
| 20 P2-10 / B-32 / M-03 / M-04 | Leer-Texte, V0 | drei Leerfälle je Liste; zwei Charts; Differenz-Kennzahl neu (§4, §7) |
| 20 P2-11 | Autosave vs. Pflicht-Kommentar | „Ändern“-Dialog für Schwellen (§4.9, V10) |
| 20 P2-12 | zwei Bestandszahlen | eine Zahl, Spalte ausgeblendet (§4.4, E7) |
| 20 P2-13 | AES-Dialog | Schließen erst nach Haken (§5.3, V6) |
| 20 P2-14 / B-27 / B-29 / B-33 / M-05–M-07 | Texte, Verwerfen, linke Spalte, Kopf 768 px | „Drucker prüfen“, „Verbindung schwach“; Verwerfen mit Undo; gebuchter Bon links; „Bargeld“; Kopf schmal mit Wort (§3.1, §3.2, §3.10, §3.13) |
| 20 P2-15 | Idle / Band-Tipp | Scanner setzt zurück, Band fängt Tipps (§3.1, §3.11, K22) |
| 20 BW-02, BW-03 | Toast-Balken RM, Chip-Breite | Balken steht, Text zählt; Satz unter der Zeile (§13) |
| 21 V1 | Anfang = Kassenbuch-Bestand | Text ersetzt; Tagesstart-Formel (§3.7.1) |
| 21 V2 | FAGG-Felder vorhanden | Lücke gestrichen; `_auftraege` muss liefern (§3.1, §11) |
| 21 V3 | Terminal-Erstattung in `terminal.py` | Lücke präzisiert, Fähigkeit `terminal_erstatten` (§3.6, §11) |
| 21 V4 | `codes.erkennen` vorhanden | Scan-Tabelle korrigiert (`PH-S-…`, Gutschein-Muster), Client-Port (§2.6) |
| 21 V5, V6, V7 | Logik da, Felder fehlen | Lücken präzisiert (§11) |
| 21 V8 | `regeln.pruefe` nicht verdrahtet | Fähigkeit `regeln_server`, Client-Port (§0.4, §11) |
| 21 V9, V11 | Tageswechsel, Storno-Freigabe | Fähigkeiten `tageswechsel`, `storno_mitarbeiter` (§0.4) |
| 21 V10 | Schreibschutz nach Signatur | Lücke gestrichen, P16 stattdessen (§11.2) |
| 21 D1 / P6 | Gutschein ohne Code | Übergang `sell_voucher` (E11), Ziel P6 (§3.3.5, §3.10, F5) |
| 21 D2 / R6 / P13 | Bestellung | Kassieren gesperrt bis P13 (E10) |
| 21 D3 / P7 / R4 | Storno erreicht Faktura nicht | Storno mit Anzahlung/Rechnung gesperrt + Aufgabe (E2, F6) |
| 21 D4 / P8 | Doppelbeleg je Intent | Fähigkeit `idempotenz`, Echtbetriebs-Schranke (§3.3.4, F4) |
| 21 D5 / P9 | keine Sitzung nach PIN | `sitzung_mit_pin` + Übergang Passwort (E4, §2.2) |
| 21 D6 / P18 | Steuersatz der Rechnung | nur Ein-Satz-Rechnungen bis P18 (§3.1) |
| 21 D7 / P10 | keine Anschrift am Beleg | Felder, Übergang A4-PDF bei Buchung (§3.4) |
| 21 D8 / R5 / P14 | Überweisung „bezahlt“ | deaktiviert bis P14 (E9, F7) |
| 21 D9 / P20 | Vorteil nicht zurücknehmbar | Fähigkeit + Hinweis/Aufgabe (§3.5, §3.6) |
| 21 D10 / R8 / P15 | Kassenbuch ohne Zweck/Beleg | Zweck-Chips, Foto, Steuersatz (§3.7.2) |
| 21 D11 / R1 / P5 | Training durch Mitarbeiter | nur Leitung, Client sendet nie `trainings` (§3.13, F3) |
| 21 D12, D13 / P16 | Anfang änderbar, Anfangsbestand wiederholbar | Anfang nur Leitung über Tagesstart; Kiosk ruft „Anfangsbestand“ nie (§3.7.1, §3.8) |
| 21 A1 / P1 | Tresor-Entnahme verfälscht Differenz | Abschöpfung als Feld; Übergang Entnahme vor dem Zählen (E5, F1) |
| 21 A2 / P2 | Anfang falsch | Formel nach Fach §3 (E6, F9) |
| 21 A3 / P4 | Wiederöffnen bucht nicht neu | „Öffnen“ erst mit P4, Korrektur über Kassenbuch (E15, F2) |
| 21 R2 / P10 | harter 400-€-Stopp | Frage, Vergleich „>“ (E1, K15) |
| 21 R3 / P12 | Retoure-Standard Gutschein | Weg je Grund, FAGG mit Frist und Haken (§3.5, F10) |
| 21 R7 / P19 | Bar 10.000 € je Beleg | Summe je Vorgang, Obergrenze ab Datum (§3.3.7, F8) |
| 21 R9 | negativer Bestand | Warnung bis P2/P3, danach Stopp (E8) |
| 21 R10 | Name am Kundendisplay | Standard ohne Namen, keine Anrede (§9, K26) |
| 21 R11 | Storno-Chip „Kundenwunsch“ | entfernt, Weg zur Retoure (E3, §3.6) |
| 21 R12 | Ausfuhr U 34 | nicht bauen, Hilfe-Text (E13) |
| 21 R13 | Lieferung ins Ausland, `Besonders 19` | Hilfe-Text, Satz im Kiosk ausgeblendet (§3.1, §3.15) |
| 21 §5 Randfälle | 24 Fälle | §3.5, §3.6, §3.15 übernommen; Zwischenzählung als Anfrage |
| 21 §7 Kleinbefunde | permlevel, Überweisung in „Heute kassiert“, Kalendertag, Kurzname, Kartennummer im Storno | §2.3, §7, §8, §11, §15 |
| 21 §9 K-Kriterien | sechs neue Kriterien | F1–F6 (§12) |
| neu | Fähigkeiten-Schalter und Echtbetriebs-Schranke | §0.4, §5.3, K45 |
| neu | Backend-Stand 04.11.: `storniere_einloesung` im Stornobeleg vorhanden, `sell_voucher`/`cancel_voucher_sale` in ph_shop, `rksv.api.beleg_buchen` mit Idempotenz (ohne Terminalprüfung), `logik/notbetrieb.py` | §3.6, §3.3.5, §3.3.4, §3.12, §11 |
| neu | Bauauftrag | §16 |

*Ende 10 – Konzept Kassa, Fassung 3.*
