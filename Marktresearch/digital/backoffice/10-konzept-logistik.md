# 10 – Konzept Bereich „Logistik“ (ph_logistik) für das Next.js-Backoffice – finale Fassung

**Zweck:** Verbindliches Funktions- und Oberflächenkonzept für den Bereich Logistik (Lieferscheine, Packtisch, Sendungen, Touren/Disposition, Speditionsaufträge, Warenrücknahmen, Bestand mit Kommission und Ausstellungsstücken, Bewegungen, Inventur) samt Bausteinen für den Arbeitsplatz „Montage mobil“ und Bauauftrag für den Fachbereichs-Agenten „Logistik“.
**Stand:** 2026-11-04 · Fassung 2 (Überarbeitung nach `20-kritik-ux-logistik.md` und `21-kritik-fach-logistik.md`; alle Pflichtänderungen eingearbeitet, Protokoll in § 16). Status: Konzept zum Bau; Inhaber-/Steuerberatungs-Fragen in § 12.4.
**Grundlage:** 01–05 (Benchmark, UX, Design-System, Motion, IA), `PLAN-NEXT-BACKOFFICE.md`, `Backend-Import/ph_logistik` **Stand 04.11. inkl. „Lückenschluss“** (README, DocType-JSONs inkl. PH Speditionsauftrag und PH Warenruecknahme, Controller, `packtisch.py`, `lager.py`, `tour_mobil.py`, `ph_tour.plantafel`, Fixtures `workflow.json`, `kanban_board.json`, `number_card.json`, 8 Script Reports), Gegenseiten `ph_faktura` PH Auftragsbestaetigung (`anzahlung_soll_cent`, `anzahlung_ist_cent`, `offen_cent`, `ust_fall`, `waehrung`, `lieferung_melden`), `ph_shop` PH Bestellung (`bezahlt_am`, `offen_cent`, `steuerland`, `abholung_bis`, `abholcode`), `10-konzept-projekte.md` § 7.1, UI-Kit `backoffice/src/components/Backoffice/README.md`, `VORBILD-SHD`.
**Verbindlich aus 02/03/04/05:** eine Primäraktion je Ansicht, Undo statt Rückfrage (8 s, `⌘Z`/`Strg+Z`), Filter in der URL, Skeleton statt Spinner, Token `--color-bo-*`, Dauer 120/160/200/240 ms mit `--bo-ease-out`, Spring 320 ms nur beim Ablegen auf Kanban/Plantafel, Seitentypen T1–T9, Fehlercodes `invalid|forbidden|not_found|conflict|rate_limited|unavailable|auth`, Toast unten rechts (Desktop), unten Mitte (Packtisch, über dem Spaltenfuß), über der Tableiste (Montage mobil).
**Nicht Teil dieses Konzepts:** Zahlungen und Rechnungen (Faktura, Kassa), Montageabwicklung (Projekte), Wareneingang-Erfassung (Sortiment; Logistik zeigt und verlinkt), Shop-Retoure/Widerruf (Shop), Servicefälle (Service), Routen-/Fahrzeitberechnung (bewusst nicht eingebaut).
**Rechtlicher Hinweis:** Punkte mit „StB“ sind von der Steuerberatung zu bestätigen; das Konzept ist keine Rechtsberatung.

---

## 0. Entscheidungen dieser Fassung (Widersprüche aufgelöst)

| # | Frage | Entscheidung | Begründung |
|---|---|---|---|
| E1 | Packen mit 0/1 Tipp (UX) vs. Buchung erst bei Zustellung (Fach) | **Nach dem letzten Scan automatisch:** Eigenlieferung/Spedition → „Gepackt“ als **verzögerter Commit 8 s** (Toast „Gepackt · Rückgängig“); Abholung → „Abholbereit melden“ ebenso (Toast nennt die Mail); Versand → Etikett-Bildschirm öffnet sich. Die Verkaufsbuchung bleibt, wo die App sie heute macht (bei Gepackt); die Verlegung auf Zustellung ist Anfrage A2. | Physisch ist beim Packen nichts passiert, ein Fehltipp ist ohne Server-Aufruf zurücknehmbar; das Backoffice erfindet keine eigene Buchungslogik. |
| E2 | Etikett: Assistent (4 Schritte) vs. „ein Tipp“ | **Ein Bildschirm** (Pakete eingeklappt, Tarif-Kacheln, Empfehlung vorausgewählt, „Buchen und drucken“). Nur bei Warnung aus `versandfaehig` öffnet der Paketteil ausgeklappt. Live: geldwirksame Bestätigung. | Normalfall 1 Tipp, Ausnahme sichtbar. |
| E3 | Montage doppelt (Tour-Tab und Montage-Tab) | **Ein Startbildschirm „Heute“** in Montage mobil (gebaut von Projekte), Tableiste `Heute · Woche · Suche · Ich`. Logistik liefert die Bausteine Tour-Kopfkarte, Stopp-Karte, Abliefern-, Nicht-angetroffen-Sheet. Ein Montage-Stopp **ist** die Montageauftrag-Karte; deren Zustandsknopf führt den Stopp mit. `/tour` leitet auf `/montage` um. | Ein Termin, eine Liste, ein Knopf. |
| E4 | Unterschrift: Querformat erzwungen | **Beide Ausrichtungen**; Alternative Segment „Unterschrift · Name bestätigt · Abgestellt laut Absprache“ (die letzten zwei mit Pflicht-Foto, Text in `notiz`). Bei `ust_fall` Ausfuhr/innergemeinschaftlich steuerfrei entfällt „Abgestellt“; „Name bestätigt“ erzeugt eine Aufgabe „Empfangsbestätigung unterschreiben lassen“. | WCAG 1.3.4/2.5.7; Steuernachweis bleibt möglich. |
| E5 | Ziehen ohne Ein-Zeiger-Alternative | Jede Zieh-Aktion hat einen **Tipp-Weg**: Plantafel-Karte antippen → Sheet „Zuordnen“; Stopp-Zeile mit Tasten `↑`/`↓` (44 px) + Menü „An Position …“. Kürzel bleiben zusätzlich. | WCAG 2.5.7. |
| E6 | Ausstellungsstück „An Kassa verkaufen“ bucht vor Zahlung | **Knopf entfällt** in Logistik. Verkauf nur in der Kassa (Lageretikett scannen); Kassa reserviert beim Erfassen und bucht nach Zahlung (Kassa-Konzept, Anfrage A12). | Kein Zustand „verkauft, aber nicht bezahlt“; VGG-Hinweis zum Zustand liegt bei der Kassa. |
| E7 | Tour-Lieferungen melden keine Liefermenge an die AB (Code: `starten` setzt Übergeben ohne `_auftrag_fortschreiben`, `als_zugestellt` meldet nur aus Gepackt) | **Keine Ersatzbuchung im Backoffice.** Bis A1: Akte zeigt rotes Band „Liefermenge nicht an AB-… gemeldet“, die Zustell-Action legt eine PH Aufgabe an Faktura an. **Livegang Touren mit AB-Lieferscheinen erst nach A1** (Gate G2). | Mengenwirksame Kopplung gehört in die App; doppelte Meldung wäre schlimmer als eine fehlende. |
| E8 | Doppellieferung bei Teillieferung (Rest ohne offene Lieferscheine) | **Server Action prüft vorab** `Rest = menge − lieferschein_menge − Σ offene Lieferscheine (beleg_position)` und lehnt Überschreitung je Zeile ab; Idempotenz-Schlüssel je Dialog. Serverseitige Begrenzung bleibt Anfrage A3. | Sofort wirksam, kein Rennen bei Doppelklick. |
| E9 | Mengen mit Nachkommastellen (lfm, m²) werden abgeschnitten | **Server Action lehnt nicht ganzzahlige Mengen ab** mit Text „2,5 lfm kann der Lieferschein noch nicht abbilden – Position über Faktura/Projekt klären“. Float + Einheit = Anfrage A4, Gate G3 (Objekt). | Keine stillen Datenfehler. |
| E10 | Anzahlung vor Lieferung | **Strengste Variante als Standard** (bis Inhaber entscheidet): AB mit `anzahlung_ist_cent < anzahlung_soll_cent` → gelbes Band; **Tour-Freigabe, Übergeben und Abholung ausgeben gesperrt**, Leitung/GF überschreibt mit Pflichtgrund (als Kommentar gespeichert, bis Felder A5 existieren). Shop-Abholung nur mit `bezahlt_am`. | Kernregel Möbelhandel; Überschreiben bleibt möglich und nachvollziehbar. |
| E11 | Restzahlung beim Kunden / Bargeld am Stopp | **Kein Bargeld-Feld.** Stopp-Karte und Abholkarte zeigen „Offen laut AB: … – Zahlung über Rechnung oder Kassa, Bargeld nur mit Kassenbeleg“. Taste „Kassieren“ erst mit Schalter `mobileKassa` (Kassa-Konzept). | BAO § 132a/RKSV: Barumsatz braucht Beleg aus der Registrierkasse. |
| E12 | „Teilrechnung erstellen“ als Primäraktion | **Nur im `⋯`** (Faktura-Recht), mit Hinweis „Bei Lieferung mit Montage rechnet Faktura nach Abnahme ab“. Primär nach Zustellung: „Lieferbestätigung senden“ bzw. Abgeschlossen. | Werklieferung (Küche/Bad) ≠ Teilrechnung je Lieferschein; AB kennt keine Abrechnungsart (Anfrage F1). |
| E13 | Lieferschein als Beleg (BAO §§ 131, 132) | **Belegsperre im Backoffice:** ab Übergeben nur `notiz_intern` und Fotos (anhängen) änderbar; Löschen nirgends im UI (Entwurf → Stornieren). Lagerbewegungen: keine Bearbeitung, nur Neuanlage und Storno. Server-Sperre = Anfrage A6/A11. | Unveränderbarkeit und Nachvollziehbarkeit, auch wenn Frappe heute mehr erlaubt. |
| E14 | Tour „Live ansehen“ (Mitarbeiterkontrolle) | **Entfällt.** Tour-Akte zeigt Stopp-Status (Arbeitsergebnis), Uhrzeiten je Stopp (`ankunft`/`abfahrt`) nur mit Schalter `zeitstempelAnzeigen` (Standard aus, nur nach Betriebsvereinbarung/Zustimmung). Keine Auswertung je Person, keine Ortung. | ArbVG § 96/96a, AVRAG § 10. |
| E15 | Dashboard überladen | Übersicht = **„Heute zu tun“** (Inbox, max. 5 Zeilen) + **4 Kennzahlen** + 2 Listen; Charts eingeklappt unter „Auswertung“. Kein Hochzählen beim Laden. | 03 § 8.14, 04 P10. |
| E16 | Kürzel-Kollisionen | Bereichskürzel nach § 3.4; **Einzelbuchstaben öffnen nur Dialoge/Sheets/Popover**, nie eine Buchung. `s a c f` behalten die 02/05-Bedeutung. Kiosk ohne Einzelbuchstaben; F-Tasten nach § 6.6. | Eine Regel je Taste. |
| E17 | Assistenten | Lieferschein aus AB/Bestellung = **ein Sheet**; Tour anlegen = **Popover (4 Felder) → Plantafel**; Inventur anlegen = **Dialog (3 Felder) → Akte**; Bewegung buchen = **ein Dialog**. Kein mehrstufiger Assistent im Bereich. | 05 T6, weniger Klicks. |
| E18 | Funktionen, die die App noch nicht kann (Teilzustellung, Rücklieferung nach Fehlversuch, Steuernachweis-Felder, Float, Währung) | **Ausblenden statt scheitern** (Schalter in `logistik/schalter.js`); bis dahin ein ehrlicher Weg (PH Aufgabe an Leitung/Faktura, Hinweisband). | Keine Knöpfe, die mit Fehler enden. |

---

## 1. Datenbestand und Stand der App

### 1.1 DocTypes (lesen/schreiben über `FrappeClient`)

| DocType | Für | Status-Werte (App → Anzeige) |
|---|---|---|
| PH Lieferschein (+ Position, Paket, Foto) | Lieferung/Abholung je Bestellung oder AB, Kommission | Entwurf · Gepackt · Uebergeben→„Übergeben“ · Zugestellt (bei Abholung Anzeige „Abgeholt“) · Storniert |
| PH Sendung (+ Tracking) | Paketversand LetMeShip/Manuell | Angelegt→„Ohne Etikett“ · Etikett→„Etikett bereit“ · Unterwegs · Zugestellt · Problem · Storniert |
| PH Tour (+ Stopp, Team, Foto) | Eigene Auslieferung/Montage-Tour | Geplant · Freigegeben · Unterwegs · Abgeschlossen · Abgebrochen; Stopp: offen · unterwegs · erledigt · nicht angetroffen · verschoben |
| PH Speditionsauftrag (+ Packstück) | Großmöbel per Spedition (Hersteller→Lager, Lager→Kunde, Hersteller→Kunde) | Entwurf · Gesendet · Bestaetigt→„Bestätigt“ · Abgeholt · Zugestellt · Storniert |
| PH Warenruecknahme (+ Position) | Rücknahme außerhalb Shop-Widerruf | Angemeldet · Angenommen · Geprueft→„Geprüft“ · Abgeschlossen · Storniert |
| PH Lagerbestand | Bestand je Produkt/Lagerort/Platz, Ausstellungsstück je SN, Kommission | Verfuegbar→„Verfügbar“ · Reserviert · Kommission · Gesperrt · Verkauft · Ausgeschieden; Zustand Neu · Ausstellung · B-Ware |
| PH Lagerbewegung | Journal (Wareneingang, Verkauf, Umlagerung, Inventur, Retoure, Ausbuchung, Reservierung, Freigabe) | Gebucht · Storniert |
| PH Inventur (+ Position) | Zählung je Lagerort | Geplant · Laufend · Abgeschlossen · Verworfen |
| PH Lagerort (+ Platz), PH Fahrzeug, PH Paketprofil, PH Logistik Einstellungen | Stammdaten | – |

Gespeichert wird immer der App-Wert; Anzeige über `logistik/status.js`. Beträge Cent → `cent()`, Gewicht g → kg mit 1 Nachkommastelle, Maße cm. Paketprofile mit `geprueft=0` tragen den Chip „Schätzung“. Schwellen und Fristen nur aus `PH Logistik Einstellungen` (z. B. Testmodus, Dienstwahl, `quote_gueltig_min`, `tracking_intervall_stunden`, `versicherung_ab_cent`, `abholcode_pflicht`, `reservierung_tage_standard`, `fahrt_min_standard`, `stopp_dauer_min_standard`) und `tasks.py` – keine eigenen Zahlen im Backoffice.

### 1.2 Rollen

| Rolle | Darf im Backoffice |
|---|---|
| PH Logistik Mitarbeiter | Packtisch, Lieferscheine anlegen/packen/übergeben/zustellen, Sendungen, Touren planen und starten, Bestand umlagern/reservieren/sperren, zählen, Speditionsaufträge, Warenrücknahmen annehmen/prüfen |
| PH Logistik Leitung | zusätzlich: Tour freigeben/abbrechen, Storno (Lieferschein ab Gepackt, Sendung ab Etikett, Bewegung, Spedition ab Gesendet), Inventur freigeben (nicht die eigene Zählung), Bestand entsperren, Ausbuchen, Anzahlungs-Sperre überschreiben, EK-Werte (permlevel 1), Export, Stammdaten |
| PH Montage | Montage mobil: eigene Touren (Fahrer oder Team), Stopp-Status, Fotos, Unterschrift; Lieferschein lesen |
| PH Geschäftsführung | alles lesen, Berichte, Anzahlungs-Sperre überschreiben |
| Faktura/Projekte/Shop/Verkauf | Lieferstatus lesend (Kundenakte Tab „Lieferungen“) |

Die Server Actions prüfen Rollen **zusätzlich** dort, wo die App nur `write` prüft (Tour freigeben/abbrechen, Inventur verwerfen aus Laufend) und wo die App Regeln offen lässt (Tour starten nur aus Freigegeben, Stopp hinzufügen nur passende Lieferscheine, Inventur-Vier-Augen).

### 1.3 Was die App seit der Fachkritik kann (genutzt) und was fehlt (Schalter/Gate)

| Thema | Stand App 04.11. | Im Backoffice |
|---|---|---|
| Offline-Packen, −1, Problem am Lieferschein, Abholcode serverseitig, Storno ab Gepackt nur Leitung mit Bestandsrückbuchung, Position `bereich` | ✔ `positionen_setzen`, `position_minus`, `problem_melden`, `als_zugestellt(…, abholcode)`, `stornieren` | genutzt |
| Stopp entfernen (leert `tour`), Plantafel-Aggregat, ETA je Stopp, Avis Mail/SMS, Idempotenz `stopp_status`/`foto` | ✔ `stopp_entfernen`, `ph_tour.plantafel(von, bis)`, `eta`/`zeitfenster_konflikt`, `avis_senden`, `idempotency_key` | genutzt |
| Platz-QR, Umlagern per Scan, Kommission, Sperrbestand, Reservierung mit Ablauf | ✔ `lager.platz_scan`, `umlagern_scan`, `kommissionsliste`, `lieferschein_aus_kommission`, `sperren/entsperren`, Scheduler | genutzt |
| Inventur atomar zählen, Fund | ✔ `zaehlen_plus`, `position_hinzufuegen` | genutzt |
| Speditionsauftrag, Warenrücknahme | ✔ neue DocTypes mit Workflow | eigene Seiten § 4.8/§ 4.9 |
| AB-Liefermenge bei Tour-Lieferung | ✘ (B1) | E7, Band + Aufgabe, Gate G2 |
| Entnahme-Bestand beim Packen | ◐ nur `lieferschein_aus_kommission` setzt `lagerbestand` | Packtisch setzt Entnahme (§ 6.3), Fehlerprüfung § 4.3 |
| Rest über offene Lieferscheine, Mengen-Obergrenze | ✘ (B3) | E8 |
| Float-Mengen, Einheit | ✘ (B4) | E9, Gate G3 |
| Explizite Liste in `stopps_hinzufuegen` ungeprüft | ✘ | Server Action prüft (§ 14.3) |
| `abbrechen` lässt Übergeben stehen; Fehlversuch ohne Rücklieferung | ✘ | Abschnitt „Zurück im Fahrzeug“ + Aufgabe, Gate G2 |
| `ausbuchen(menge=None)` nimmt reservierte Menge mit | ✘ | Action übergibt immer `menge ≤ verfuegbar` |
| Schreibsperre Lieferschein/Bewegung | ✘ | E13 |
| `abholbereit_melden` ohne E-Mail still `False` | ✘ | Action prüft vorher, legt Aufgabe „Kunde anrufen“ an |
| Teilzustellung am Stopp, Annahmevorbehalt | ✘ | Schalter `teilzustellung`; bis dahin § 7.4 |
| Steuernachweis Ausfuhr/EU, Währung am Lieferschein | ✘ | Band „Steuernachweis nötig“ + Aufgabe Faktura; Warenwert bei Fremdwährung ausgeblendet; Gate G3 |
| Anzahlungs-Prüfmethode, Override-Felder | ✘ | E10 (Action liest AB, Grund als Kommentar) |
| Inventur-Wert, Stichtag, Vier-Augen, Bewegungen während Zählung | ✘ | Vier-Augen und Bewegungs-Hinweis in der Action; Wert/Stichtag Gate G4 |

### 1.4 Livegang-Stufen (Gates)

| Gate | Was live geht | Voraussetzung |
|---|---|---|
| G0 | Alles im Mock-Modus und Testmodus (TEST-Band) | Fundament F1–F3, Seed |
| G1 Packtisch & Paketversand live | Etiketten kostenpflichtig, Abholung | Paketprofile gemessen (`geprueft=1`), LetMeShip-API-Abgleich (README), A10 (Versand-USt nach Steuerland), StB-Bestätigung Lieferdatum (§ 12.4) |
| G2 Eigene Touren mit AB-Lieferscheinen | Disposition, Montage mobil Abliefern | A1, A5 (Rücklieferung), A7 (Teilzustellung) oder Inhaber-Freigabe des Übergangswegs § 7.4 |
| G3 Objekt/Export | Küche/Bad mit lfm/m², Lieferungen CH/EU steuerfrei | A4, A9 |
| G4 Jahresinventur | Inventur zum Bilanzstichtag | A15 |

---

## 2. Nutzer, Top-Aufgaben und gezählte Wege

Zählweise: Klicks/Tipps ab Bereichsstart bzw. Kiosk-Startseite; Scans, Tippen in Felder und das Abwarten eines Undo-Fensters zählen nicht; Enter zählt als Klick. Jeder Weg wird im E2E genau so gemessen (QA 1).

| # | Wer | Aufgabe | Ziel | Weg |
|---|---|---|---|---|
| W1 | Packtisch | Lieferschein Eigenlieferung/Spedition packen | **0** + Scans | Scan Packliste-QR → Pack-Ansicht → Artikel scannen → automatisch „Gepackt“ (8 s Undo) |
| W2 | Packtisch | Shop-Bestellung versenden (Test) | **2** + Scans | Karte (1) → Scans → Etikett-Bildschirm öffnet → „Buchen und drucken“ (2) |
| W3 | Packtisch | dasselbe live | **3** | wie W2 + Bestätigung „kostenpflichtig buchen?“ (3) |
| W4 | Packtisch | Abholung ausgeben | **2** + Scan | Scan Abholcode → Abholkarte → Unterschrift → „An Kunde ausgeben“ (1) … Erfolgskarte; mit Alternative „Name bestätigt“: 2 |
| W5 | Packtisch | Fehlscan korrigieren | **1** | Toast „Rückgängig“ oder `–` an der Zeile |
| W6 | Packtisch | Problem melden | **3** | „Problem melden“ (1) → Grund-Kachel (2) → Foto → „Melden“ (3) |
| W7 | Packtisch | Umlagern per Scan | **1** | „Lager-Scan“ (1) → Scan Bestand → Scan Platz |
| W8 | Büro | „Wo ist meine Lieferung?“ | **1** | `⌘K` Name/Tracking-Nr. → Enter |
| W9 | Büro | Lieferschein aus AB (Teillieferung) | **2** ab AB | „Lieferschein erzeugen“ (1) → Mengen vorbelegt (Rest) → „Anlegen“ (2) |
| W10 | Büro | Sendung mit Problem klären | **3** | Heute-zu-tun-Zeile (1) → „Klären“ (2) → Weg-Kachel (3) |
| W11 | Leitung | Tour für morgen planen | **4** | Touren (1) → „+ Tour“ in Zelle morgen/Fahrzeug (2, Popover vorbelegt) → Lieferscheine antippen → Sheet „Zuordnen“ je Lieferschein (je 1) → „Freigeben“ (4 + n) |
| W12 | Leitung | vorbereitete Tour freigeben | **2** | Heute-zu-tun „Tour morgen nicht freigegeben“ (1) → „Freigeben“ (2, 8 s Undo) |
| W13 | Leitung | Inventur freigeben | **3** | Inventur-Zeile (1) → Tab Differenzen (2) → „Freigeben und buchen“ + Bestätigung (3) |
| W14 | Fahrer | Stopp abliefern | **3** | Stopp (1) → „Abliefern“ (2) → Unterschrift → „Fertig“ (3) |
| W15 | Fahrer | Nicht angetroffen | **2** | Stopp → „Nicht angetroffen“ (1) → Grund-Chip → „Speichern“ (2) |
| W16 | Fahrer | Tour starten | **1** | „Starten · 48 210 km“ (Vorschlag aus letzter Tour; Beispielwert) |
| W17 | Verkauf | Liefertermin nennen | **2** | Kundenakte → Tab „Lieferungen“ |

---

## 3. Bereichsweite Regeln

### 3.1 Status-Töne (03 § 1.5: grau → blau → türkis → orange → grün; rot = Abbruch/Problem)

| DocType | Ton je Status |
|---|---|
| Lieferschein | Entwurf grau · Gepackt **blau** · Übergeben türkis · Zugestellt/Abgeholt grün · Storniert rot |
| Sendung | Ohne Etikett grau · Etikett bereit **blau** · Unterwegs türkis · Zugestellt grün · Problem rot · Storniert rot |
| Tour | Geplant grau · Freigegeben blau · Unterwegs türkis · Abgeschlossen grün · Abgebrochen rot; Stopp: Offen grau · Unterwegs türkis · Erledigt grün · Nicht angetroffen rot · Verschoben orange |
| Speditionsauftrag | Entwurf grau · Gesendet blau · Bestätigt blau · Abgeholt türkis · Zugestellt grün · Storniert rot |
| Warenrücknahme | Angemeldet grau · Angenommen blau · Geprüft türkis · Abgeschlossen grün · Storniert rot |
| Lagerbestand | Verfügbar grün · Reserviert orange · Kommission blau · Gesperrt rot · Verkauft grau · Ausgeschieden grau |
| Inventur | Geplant grau · Laufend orange · Abgeschlossen grün · Verworfen grau |
| Bewegung | Gebucht ohne Badge · Storniert grau + durchgestrichen + Link `storno_von` |

Immer Text + Punkt, nie Farbe allein. **TEST** (lila, `special`) nur als Band oben (Bereich, Packtisch) und als Badge in Sendungszeile/-akte – nicht im Lieferscheinkopf.

### 3.2 Belegsperre (`logistik/belegsperre.js`, rein, unit-getestet)

| Status Lieferschein | Änderbar im UI | Server Action |
|---|---|---|
| Entwurf | alles außer Status; Positionen nur bei Lieferschein ohne Quelle, sonst Mengen nur ≤ Rest | `save` mit `modified` |
| Gepackt | Wunschtermin, Lieferhinweis, Telefon, Notiz intern; Adresse bei Eigenlieferung/Spedition (Hinweis „Tour wird aktualisiert“), bei Versand nur über die Sendung | `save` nur dieser Felder |
| Übergeben, Zugestellt, Storniert | Notiz intern, Fotos anhängen | alles andere → `forbidden` „Beleg – Änderungen nur über Storno oder Warenrücknahme“ |

Lagerbewegung: kein Bearbeiten, kein Löschen; Korrektur = Storno (Leitung) + neue Bewegung. Lagerbestand: Mengenfelder nie direkt, nur über Methoden.

### 3.3 Undo und Rückfragen (verzögerter Commit = Fundament F2, 04 § 3.6 Variante A)

| Aktion | Muster | Text |
|---|---|---|
| Abhaken, `–`, Paket ändern | sofort + Undo (Gegenaktion `positionen_setzen` mit altem Stand) | „Abgehakt: Glas Riedel · Rückgängig“ |
| Gepackt (automatisch und Knopf), Abholbereit melden | verzögerter Commit 8 s | „Gepackt · Rückgängig“ / „Abholbereit · Mail an Fam. Moser geht in 8 s · Rückgängig“ |
| Übergeben (einzeln, Masse) | verzögerter Commit 8 s | „An Spedition übergeben · Rückgängig“ / „5 übergeben · Rückgängig“ |
| An Kunde ausgeben, Abliefern | Unterschrift bzw. Alternative = Bestätigung, kein Undo | – |
| Etikett buchen live, Retourenlabel live | Bestätigung (geldwirksam) | „DPD Classic für 11,00 € kostenpflichtig buchen?“ (Beispielwerte) |
| Zur Tour / Aus Tour | sofort + Undo (`stopp_entfernen` bzw. `stopps_hinzufuegen`) | „Zu TOUR-0031 · Rückgängig“ |
| Tour freigeben | verzögerter Commit 8 s | „Freigegeben · Rückgängig“ |
| Stopp verschieben, Nach PLZ sortieren | sofort + Undo (alte Reihenfolge speichern) | „Stopp 4 an Position 2 · Rückgängig“ |
| Platz inline | verzögerter Commit 8 s | „Platz A-04 · Rückgängig“ (eine Journalzeile statt zwei) |
| Umlagern, Reservieren, Freigeben (Dialog/Masse) | sofort + Undo (Gegenbuchung) | „8 umgelagert · Rückgängig“ |
| Zählen | sofort + Undo (alter Ist) | „Ist 1 · Rückgängig“ |
| Ausbuchen, Sperren | Bestätigung, Grund Pflicht | „1 Stück Esstisch Eiche ausbuchen? Rücknahme nur durch Leitung.“ |
| Storno (Lieferschein, Sendung, Tour, Spedition), Inventur freigeben, Zählliste neu erzeugen | Bestätigung rot, Fokus auf „Abbrechen“, Folgen aufgezählt | § 5.7 |

Regeln: Undo-Balken 8 s linear, Pause bei Fokus/Hover; `⌘Z`/`Strg+Z` nimmt den jüngsten Toast zurück; `pagehide`/`visibilitychange` sendet ausstehende Commits genau einmal (sendBeacon); offline → Puffer mit `idempotency_key`, Toast „wird gesendet, sobald online“; Kiosk-Sperre committet vor dem Sperrbild.

### 3.4 Kürzel Backoffice (Fundament-Registry F3; 02 § 9.2/05 T2/T5 behalten ihre Bedeutung)

| Kontext | Kürzel |
|---|---|
| alle Listen | 02 § 9.2 unverändert: `a` Zuweisen, `s` Status, `c` Kommentar, `x` Auswahl, `f` Filter, `/` Suche, `1–9` Statuschips, `⌘Enter` Primär |
| Bereich | `g l` Logistik-Start, `p` Zum Packtisch (Start) |
| Lieferscheine | `k` Liste/Kanban · `t` „Zur Tour …“ (Popover) · `w` Pack-Ansicht öffnen · `p` Packliste drucken · `.` Aktionsmenü |
| Lieferschein-Akte | `1–5` Tabs · Übergeben/Zugestellt **nur** über Primärtaste bzw. `⌘Enter` |
| Sendungen | `r` Tracking der Zeile aktualisieren · `l` Etikett öffnen · `Shift+C` Tracking-Nr. kopieren |
| Plantafel | `t` heute · `←/→` Zeitraum (außerhalb des Rasters) · Pfeile im Raster · `Enter` Karte öffnen · `m` Zuordnen-Sheet · `n` neue Tour in Zelle |
| Tour-Akte | `⌘Enter` Primär (Freigeben/Starten/Abschließen) · `Alt+↑/↓` Stopp verschieben · `d` Stopps hinzufügen (Dialog) · `p` Tourenblatt |
| Bestand | `u` Umlagern (Dialog) · `v` Reservieren (Dialog) · `p` Lageretikett · `Shift+Entf` Ausbuchen (Dialog) |
| Inventur-Zählliste | `Enter` speichern + nächste Zeile · `↑/↓` · `/` Suche · `z` Zählmodus |

Alle Einzeltasten über „Einzeltasten-Kürzel aus“ abschaltbar (WCAG 2.1.4); `?` listet je Seite die gültigen Kürzel (auch `1–4` Kennzahlen am Start).

### 3.5 Sprache und Texte (`logistik/texte.js`)

- Arbeitsschritt statt Datensatz: „Packen“, „Abholung“, „Wareneingang“ – nie „Bestellung ohne LS“, „Etikett offen“, „Workflow“, „Kindtabelle“.
- Nummern nie mittig kürzen; Spalte `whitespace-nowrap`, Nummer mono 13 px `text-soft`.
- Icons immer mit Text: Lieferart `package` Versand · `store` Abholung · `truck` Eigenlieferung · `container` Spedition; Richtung „Ausgang“/„Retoure“ als Wort.
- Lucide-Namen: `search`, `maximize`, `camera`, `printer`, `scan-line`, `triangle-alert`, `lock`, `undo-2`, `map-pin`, `phone`.

### 3.6 Bewegung (04)

| Element | Wert |
|---|---|
| Statuswechsel Badge | Farbe 160 ms `--bo-ease-out` |
| Primärtaste wird nach letztem Scan primär | Farbe 160 ms, kein Translate |
| Scan erkannt / unbekannt / bereits vollständig | 04 § 3.12 (grüner Balken 1500 ms bzw. Shake ±4 px 240 ms bzw. Hinweis); reduziert: nur Farbe + Text + Symbol |
| Positions- und Paketzeilen ein/aus | 120 ms Opazität + 4 px |
| Ablegen auf Plantafel/Kanban | Spring 320 ms `--bo-ease-spring`; ungültig zurück 200 ms `--bo-ease-out`; Tipp-Zuordnung ohne Spring (Abgang/Eintritt 160 ms) |
| Auslastungsbalken | `transform: scaleX()` 200 ms `--bo-ease-inout`, `transform-origin: left` (nie `width`) |
| Chart-Balken | 240 ms, Stagger 20 ms, max. 12 |
| Kennzahl-Wechsel | Hochzählen 400 ms `--bo-ease-out` **nur nach Mount** bei geänderter Zahl |
| Hervorhebung (springen zu Stopp, neue Stopps, geänderter Preis) | 1200 ms linear |
| Band „Tour geändert“, Hinweisbänder | `grid-template-rows` 160 ms |
| Montage mobil Bildschirmwechsel | 24 px + Opazität, 200 ms ein / 160 ms aus (Projekte § 7.1) |
| Packtisch | keine Seitenübergänge; Knopf `:active` `surface-3` 50 ms |
| `prefers-reduced-motion` | alle Transforms weg, Opazität 120 ms, kein Shake, kein Hochzählen |

### 3.7 Schalter (`logistik/schalter.js`, Standard in Klammern)

| Schalter | Wirkung | Freigabe durch |
|---|---|---|
| `teilzustellung` (aus) | Stepper „zugestellt/abgelehnt“ je Position im Abliefern-Sheet | ph_logistik A7 |
| `ruecklieferung` (aus) | „Neu einplanen“ für Lieferscheine „Zurück im Fahrzeug“ | A5 |
| `steuernachweisFelder` (aus) | Abschnitt Steuernachweis (MRN, Nachweisart, Datei) | A9 |
| `mengenDezimal` (aus) | Komma-Eingabe und Einheit | A4 |
| `mobileKassa` (aus) | „Kassieren“ am Stopp | Kassa-Konzept + StB |
| `zeitstempelAnzeigen` (aus) | Ankunft/Abfahrt je Stopp in Tour-Akte/Bericht | Inhaber (Betriebsvereinbarung/Zustimmung) |
| `anzahlungHart` (an) | Sperre statt Hinweis bei offener Anzahlung | Inhaber § 12.4 |
| `tonUnbekannt` (an, je Gerät) | tiefer Ton 2 × 60 ms bei unbekanntem Scan | Leitung Logistik |

---

## 4. Seiten (Backoffice)

### 4.0 Routen und Navigation

Pills unter dem Titel (max. 6 + „Mehr ▾“): **Übersicht · Lieferscheine · Sendungen · Touren · Bestand · Inventur · Mehr ▾** (Speditionen, Rücknahmen, Ausstellung, Kommission, Bewegungen, Berichte, Stammdaten). Brotkrumen nur in Akten. Rechts im Seitenkopf: „Zum Packtisch“ (ohne registriertes Packtisch-Gerät öffnet er `/logistik/packen/[name]` bzw. die Packliste im Backoffice mit Band „Kein Packtisch-Gerät – Druck über den Browser“).

| Route | Typ | Quelle | Primär |
|---|---|---|---|
| `/logistik` | T1 | Number Cards, `packtisch.statistik`, Heute-zu-tun | „Zum Packtisch“ |
| `/logistik/lieferscheine` (`?ansicht=liste|kanban`) | T2/T3 | PH Lieferschein, Kanban „PH Lieferscheine“ | „+ Lieferschein“ (selten) |
| `/logistik/lieferscheine/[name]` | T5 | PH Lieferschein | je Zustand § 4.3 |
| `/logistik/packen/[name]` | T7 im Backoffice | `packtisch.packansicht` | wie Packtisch |
| `/logistik/sendungen` | T2 (kein Kanban) | PH Sendung | „Tracking aktualisieren“ |
| `/logistik/sendungen/[name]` | T5 | PH Sendung | je Zustand § 4.5 |
| `/logistik/touren` (`?ansicht=plantafel|liste|kanban&zeitraum=woche|3tage|tag`) | T4/T2/T3 | `ph_tour.plantafel`, Kanban „PH Touren“ | „+ Tour“ |
| `/logistik/touren/[name]` | T5 | PH Tour | je Zustand § 4.7 |
| `/logistik/speditionen` (+ `/[name]`) | T2/T3, T5 | PH Speditionsauftrag, Kanban „PH Speditionsauftraege“ | „+ Speditionsauftrag“ |
| `/logistik/ruecknahmen` (+ `/[name]`) | T2, T5 | PH Warenruecknahme | „+ Rücknahme“ |
| `/logistik/bestand` (+ `/[name]`) | T2 gruppiert, T5 | PH Lagerbestand | „Umlagern …“ |
| `/logistik/ausstellung` | T2 (Ansicht) | PH Lagerbestand `ausstellungsstueck=1` | „Platz ändern …“ |
| `/logistik/kommission` (`?k=`) | T2 | `lager.kommissionsliste`, Report „PH Kommissionsware“ | „Lieferschein aus Kommission“ |
| `/logistik/bewegungen` | T2 Journal | PH Lagerbewegung | „Bewegung buchen“ |
| `/logistik/inventur` (+ `/[name]`, `/[name]/zaehlen`) | T2, T5, T7 | PH Inventur | „Inventur anlegen“ |
| `/logistik/stammdaten?tab=lagerorte|fahrzeuge|paketprofile|einstellungen` | T9 | Stammdaten | je Tab |
| `/logistik/berichte/[report]` | T8 | 8 Script Reports | „Exportieren“ (Recht) |
| `/packtisch`, `/packtisch/[name]` | T7 Kiosk | § 6 | Scan |
| `/montage` (Projekte), `/tour` → 307 `/montage` | T7 mobil | § 7 | – |

`bereiche.js` (Fundament): `doctypes` + PH Speditionsauftrag, PH Warenruecknahme, PH Paketprofil, PH Logistik Einstellungen; `kanban` = PH Lieferschein, PH Tour, PH Speditionsauftrag (**kein** Kanban PH Sendung); Navigation wie oben; `ROUTEN` je DocType auf die Bereichsakten (`/d/ph-lieferschein/<name>` → 307).

### 4.1 Übersicht `/logistik` (T1)

```
┌ Logistik                     Übersicht | Lieferscheine | Sendungen | Touren | Bestand | Inventur | Mehr ▾   [Zum Packtisch] ┐
├ HEUTE ZU TUN ───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ triangle-alert  2 Sendungen mit Problem                                                               Klären ›  │
│ truck           1 Tour morgen nicht freigegeben (Leitung)                                              Öffnen › │
│ phone           3 Kunden ohne E-Mail zu informieren (abholbereit)                                      Anrufen ›│
│ undo-2          2 Lieferungen nicht zugestellt – zurück im Fahrzeug                                    Zeigen › │
│ lock            1 Liefermenge nicht an AB gemeldet                                                    Zeigen ›  │
│                                                                                              Alle 7 ›           │
├────────────────────────┬────────────────────────┬────────────────────────┬────────────────────────┤
│ Zu packen   7          │ Ohne Etikett   1       │ Unterwegs   12         │ Touren heute   1       │
│ 3 seit gestern         │                        │                        │ 6 Stopps               │
├────────────────────────┴────────────┬───────────┴────────────────────────┴────────────────────────┤
│ ZU PACKEN (nach Wunschtermin)       │ TOUREN DIESE WOCHE                                          │
│ Fam. Huber · Versand · 0/2  [Heute] │ Mo  1 Tour · 5 Stopps · Sprinter BZ-123                     │
│ Fam. Moser · Abholung  [Glas]       │ Di  1 Tour · 3 Stopps                                       │
│ Alle 7 ›                            │ Mi  –  [+ Tour]                    Plantafel ›              │
├─────────────────────────────────────┴─────────────────────────────────────────────────────────────┤
│ ▸ Auswertung (Lieferscheine je Woche · Versandkosten vs. berechnet · Touren je Woche · Bestand)   │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
(Zahlen im Wireframe sind Beispielwerte)
```

- **Heute zu tun** (Linear-Inbox, max. 5 Zeilen, Rest „Alle n ›“), je Zeile Icon + Text + Ziel; Quellen: Sendung `Problem` · Sendung `Angelegt` und `creation < heute−2 Tage` (Regel `tasks.py`) · Tour morgen `Geplant` (nur Leitung) · Lieferschein `Gepackt`, Abholung, ohne E-Mail · Lieferschein „zurück im Fahrzeug“ (Stopp nicht angetroffen/verschoben in abgeschlossener Tour, Lieferschein `Uebergeben`) · Lieferschein Zugestellt mit `auftrag` ohne Kommentar „Liefermengen an … gemeldet“ · Lieferschein mit Bestandsfehler (§ 4.3) · AB mit offener Anzahlung für Lieferscheine der nächsten 7 Tage · Zählung `Laufend` älter als 7 Tage (UI-Filter auf `modified`) · Speditionsauftrag `Gesendet` ohne Bestätigung, Zustelldatum ≤ morgen · Bestand `Gesperrt` (Number Card „PH Gesperrter Bestand“).
- **4 Kennzahlen** (Number Cards): Zu packen (`PH Zu packen`, Nebenzeile `datum < heute`), Ohne Etikett (`PH Etikett offen`), Unterwegs (`PH Sendungen unterwegs`), Touren heute (`PH Touren heute`, Nebenzeile Σ `anzahl_stopps`). Klick = gefilterte Liste. Probleme nur in „Heute zu tun“.
- **Auswertung** (`<details>`, Zustand in `localStorage`): Charts der Fixtures (eigenes SVG, Tabelle „Daten anzeigen“), „Bestand je Lagerort“ beschriftet als „Positionen je Lagerort“.
- **Leer:** „Alles erledigt – nichts offen.“ (Häkchen Sand 32 px). **Fehler je Block:** „Nicht verfügbar · Erneut“; andere Blöcke laden weiter. **Testmodus:** Band `special-soft` „Versand im Testmodus – Etiketten sind Muster“.
- Laden: je Block `<Suspense>` mit Skeleton in Zielhöhe, Reihenfolge Heute zu tun → Kennzahlen → Listen.

### 4.2 Lieferscheine `/logistik/lieferscheine`

```
┌ Lieferscheine                                                        Liste | Kanban   [+ Lieferschein] ┐
│ Heute zu packen 7 · Ohne Tour 4 · Abholbereit 3 · Zurück im Fahrzeug 2 · Alle             (Ansichten) │
├ [Entwurf 7] [Gepackt 3] [Übergeben 12] [Zugestellt] · [Filter +] [Lieferart: Spedition ×]   ⌕ /       ┤
│ ☐ Nummer         Kunde / Ort               Lieferart          Wunsch   Tour        Packstand  Status   │
│ ☐ LS-2026-00141  Fam. Huber · Lochau       package Versand    06.11.   –           0/2        ● Entwurf│
│ ☐ LS-2026-00138  Hotel Alpenrose · Bregenz truck Eigenlief.   KW 46    Mo 09.11.   14/14      ● Gepackt│
├ 25 von 61 · Weitere 25                                                                                ┤
└ Auswahl (3): [Zur Tour …] [Packliste drucken] [Lieferschein drucken] [Mehr ▾]                         ┘
```

- **Standardspalten (7):** Nummer, Kunde/Ort (+ Chip „Teil“), Lieferart (Icon + Text), Wunsch (`wunschtermin`, KW bei > 14 Tagen), Tour (Datum, Link; nur Anzeige), Packstand (aus `packtisch.offene` für Entwurf/Gepackt, sonst „–“), Status. **Über Spaltenwahl:** Quelle (`bestellung`/`auftrag`/`kommission`), Sendung, Gewicht, zerbrechlich, versichert, Projekt, Bereich.
- **Gespeicherte Ansichten als Tabs**; darunter **eine** Zeile: Statuschips + „Filter +“ (Popover: Lieferart, Tour/ohne Tour, Wunschtermin, Quelle-Art, Teillieferung, zerbrechlich, PLZ-Präfix; gewählte als entfernbare Chips) + Suche (`name, kunde_name, bestellung, auftrag, liefer_ort, kommission`).
- **Sortierung:** Statusrang, dann `wunschtermin` aufsteigend, leere zuletzt.
- **Inline:** `wunschtermin` (bis Gepackt), `notiz_intern` (Popover). **Kein** Inline-`tour`, kein Inline-Status.
- **Kanban:** Entwurf · Gepackt · Übergeben · Zugestellt (Storniert eingeklappt). Ziehen ruft Dokumentmethoden: Entwurf→Gepackt `als_gepackt` (verzögert; nicht möglich → Rückkehr 200 ms + Toast mit Grund und „Pack-Ansicht öffnen“); Gepackt→Übergeben Dialog „Übergeben an“ (§ 5.5); →Zugestellt Desktop-Sheet „Zustellung bestätigen“ (§ 5.6); rückwärts nur Leitung „Zurück auf Entwurf“ (Workflow-Aktion). Tipp-Alternative: Karte → Menü „Verschieben nach …“.
- **Massenaktionen:** Zur Tour … (nur Eigenlieferung/Spedition, Entwurf/Gepackt, ohne Tour), Packliste drucken, Lieferschein drucken, Übergeben (nur Gepackt, gleiche Übergabeart, verzögert), Mehr ▾: Lieferbestätigung senden (Ergebnis „5 gesendet · 2 ohne E-Mail (Liste)“), Etiketten drucken, Stornieren (Leitung, nur Entwurf/Gepackt).
- **Leer:** nie Daten „Noch keine Lieferscheine. Lieferscheine entstehen beim Packen einer Shop-Bestellung, aus einer Auftragsbestätigung oder aus einer Kommission.“ [Zum Packtisch]; Filter „Keine Lieferscheine mit Status ‚Gepackt‘ und Lieferart ‚Spedition‘.“ [Filter zurücksetzen]; erledigt (Heute zu packen) „Alles gepackt.“
- **Fehler:** Block „Liste nicht ladbar · Erneut“ mit Cache-Stand „zuletzt geladen 14:02“. **Laden:** 8 Skeleton-Zeilen à 40 px.

### 4.3 Lieferschein-Akte `/logistik/lieferscheine/[name]`

```
┌ Logistik › Lieferscheine › LS-2026-00138                                                                   ┐
│ LS-2026-00138 · Hotel Alpenrose · Eigenlieferung   ● Gepackt  [Teil] [+1]               [Zur Tour …] [⋯] │
│ ○ Entwurf ── ● Gepackt ── ○ Übergeben ── ○ Zugestellt                    gepackt 04.11. 15:20 · L. Moser  │
│ ┌ gelb: Anzahlung offen: 1.200,00 € von 3.000,00 € (AB-2026-00017) · Freigabe nur Leitung  [Zur AB] ┐   │
├ Übersicht | Positionen 14 | Pakete & Versand | Übergabe & Fotos | Verlauf ──────╥ BEZÜGE ──────────────────┤
│ LIEFERUNG                        │ EMPFÄNGER                      ║ Kunde Hotel Alpenrose ›   │
│ Lieferart  Eigenlieferung        │ Hotel Alpenrose GmbH           ║ AB-2026-00017 ● Teilgel.  │
│ Wunsch     10.11.2026            │ Seestraße 4, 6900 Bregenz, AT  ║ Projekt PH-PRJ-26-0009 ›  │
│ Tour       – [Zur Tour …]        │ Lieferhinweis: Hintereingang,  ║ Phase Lieferung           │
│ Sprache    de                    │ Lift bis 2. OG                 ║ Tour –                    │
│ Gewicht    412,0 kg · zerbrechl. │                                ║ NÄCHSTE SCHRITTE          │
└──────────────────────────────────┴────────────────────────────────╨───────────────────────────┘
(Beispielwerte)
```

- **Kopf:** Nummer · Kunde · Lieferart, Status, **max. 2 Kennzeichen** (Priorität Teil > Zerbrechlich > Versichert; Rest „+n“ Popover). Phasenleiste; im Entwurf Unterzeile „8/14 gepackt“ statt eigenem Balken. Projektbezug nur als Zeile in Bezüge („Projekt … · Phase Lieferung ›“). Storniert: rotes Banner „Storniert am … – Grund: …“ statt Phasenleiste.
- **Bänder** (über den Tabs, je eines, Reihenfolge Wichtigkeit): rot „Liefermenge nicht an AB-… gemeldet – Faktura informiert“ (E7) · rot „Bestand nicht gebucht: Position 3 (keine Bewegung zu Lagerbestand …) · Leitung prüfen“ (Gepackt+ mit `lagerbestand`, aber keine Bewegung `bezug=PH Lieferschein:<name>` Art Verkauf) · gelb Anzahlung (E10) · gelb „Steuernachweis nötig (Ausfuhr) – Faktura informiert“ (`ust_fall` der AB Ausfuhr/innergemeinschaftlich steuerfrei) · grau „Problem: Beschädigt – 04.11. 14:10“ (`problem_grund`).
- **Primäraktion je Zustand:**

| Zustand / Bedingung | Primär | Sekundär (`⋯`) |
|---|---|---|
| Entwurf, nicht alles gepackt | **Pack-Ansicht öffnen** (Packtisch-Gerät: `/packtisch/[name]`, sonst `/logistik/packen/[name]`) | Pakete vorschlagen, Packliste drucken, Stornieren |
| Entwurf, alles gepackt, Versand/Spedition ohne Pakete | **Pakete vorschlagen** | Pakete bearbeiten |
| Entwurf, alles gepackt, sonst | **Als gepackt melden** (verzögert) | Etikett (Versand) |
| Gepackt, Versand, keine aktive Sendung | **Etikett** (§ 5.4) | Übergeben an Dienstleister (manuell), Zurück auf Entwurf (Leitung) |
| Gepackt, Versand, Etikett bereit | **Etikett drucken** | Sendung öffnen |
| Gepackt, Abholung | **An Kunde ausgeben** (Sheet: Abholcode, Unterschrift/Alternative) | Abholbereit-Mail erneut |
| Gepackt, Eigenlieferung, ohne Tour | **Zur Tour …** | Übergeben an Spedition, Speditionsauftrag |
| Gepackt, Spedition | **Speditionsauftrag** (`speditionsauftrag_anlegen`) bzw. **Speditionsauftrag öffnen** | Zur Tour (Eigenfahrt) |
| Gepackt, mit Tour | **Tour öffnen** | Aus Tour entfernen (`stopp_entfernen`, Undo) |
| Übergeben, Versand | **Tracking ansehen** | Problem melden |
| Übergeben, Eigenlieferung ohne Tour / Spedition ohne Auftrag | **Zustellung bestätigen** (§ 5.6) | – |
| Zugestellt, E-Mail vorhanden, Bestätigung nicht gesendet | **Lieferbestätigung senden** (Vorschau-Sheet) | Teilrechnung erstellen (Faktura-Recht), Produktpässe, Warenrücknahme, Servicefall |
| Zugestellt, ohne E-Mail | **Lieferschein drucken (für Kunde)** | wie oben |
| Zugestellt, erledigt | – (Häkchen „Abgeschlossen“) | Warenrücknahme anlegen, Servicefall melden |

  Stornieren erscheint nur in Entwurf (Mitarbeiter laut Workflow: Leitung) und Gepackt (Leitung); ab Übergeben nicht (Rückabwicklung AB fehlt, Anfrage A16) – stattdessen „Warenrücknahme anlegen“ nach Zustellung.
- **Tabs:**
  1. **Übersicht** – Lieferung (Lieferart, Datum, Wunschtermin, Tour, Sprache de/en/fr/it), Kunde, Empfänger (Adressblock; Sperre nach § 3.2), Lieferhinweis (Sand-soft hervorgehoben), Gewicht, Warenwert (nur Leitung/Faktura; bei AB-`waehrung ≠ EUR` statt Betrag „in CHF – siehe AB“), Versicherung, Notiz intern. **Liefertermine:** „Übergeben am …“, „Zugestellt am …“ beide angezeigt, ohne Wertung (welches Datum auf die Rechnung gehört: StB § 12.4).
  2. **Positionen** – Bild 40 px, Bezeichnung, Ausführung, Bereich (Raum/Zimmer), Menge, Gepackt, Paket-Nr., Paketprofil (Chip „Schätzung“), SN, Entnahme (Lagerbestand → Lagerort/Platz oder „Ort unbekannt“), Quellzeile. Bearbeitbar nur im Entwurf; bei Quelle Hinweis „Positionen kommen aus AB-… – Mengen dort ändern“.
  3. **Pakete & Versand** – `PaketEditor` (wie Packtisch), Versicherung, Sendungen des Lieferscheins (Status, Carrier, Tracking, Preis, TEST) mit Tracking-Zeitstrahl. Leer: „Noch keine Pakete. Pakete entstehen beim Packen oder über ‚Pakete vorschlagen‘.“ [Pakete vorschlagen]
  4. **Übergabe & Fotos** – Übergeben an/am, Zugestellt am, Empfangen von, Unterschrift (Bild), Lieferbestätigung gesendet am, Abholcode (nur Leitung sichtbar, Monospace), Fotos (Raster, Art-Chip, Zeit; Upload), Tour-Fotos dieses Stopps. Leer: „Noch keine Fotos. Fotos kommen vom Packtisch oder vom Fahrer.“ [Foto hinzufügen]
  5. **Verlauf** – Zeitleiste: Status, Kommentare (AB-Meldung, Mails, Problem), Tracking-Ereignisse, Bewegungen mit Bezug, Stopp-Status (ohne Uhrzeit, außer `zeitstempelAnzeigen`).
- **Bezüge:** Kontakt, Bestellung oder AB (Status), Projekt, Kommission, Tour + Stopp, Sendungen, Speditionsauftrag, Teilrechnung, Bewegungen (Anzahl), Warenrücknahmen, Servicefälle.

### 4.4 Sendungen `/logistik/sendungen` (T2, kein Kanban)

- **Ansichten:** Offen · Problem · Ohne Etikett · Alle. Statuschips, „Filter +“ (Richtung, Dienstleister, Carrier, Land, Zeitraum gebucht, nur TEST/nur live, Abgleich älter als `tracking_intervall_stunden` × 3), Suche (`tracking_nr, shipment_id, lieferschein, empf_name, empf_ort`).
- **Spalten:** Nummer, Richtung (Wort), Carrier · Dienst, Empfänger, Tracking (↗ neuer Tab), Seit (`unterwegs_seit`/`gebucht_am`), Preis vs. berechnet (Differenz rot, wenn Kosten > berechnet; nur Leitung), letzter Abgleich, Fehler-Icon mit Text, TEST, Status.
- **Kopf:** „Tracking aktualisieren“ → `tasks.tracking_aktualisieren(sofort=1)`; Knopf zeigt „läuft …“, Ergebnis „12 Sendungen abgeglichen“ (Rückgabe); Fehler „Abgleich fehlgeschlagen – Dienst nicht erreichbar. Letzter erfolgreicher Abgleich 12:15.“
- **Zeilenmenü:** Tracking aktualisieren, Etikett drucken, Problem melden, Manuell zugestellt (aus Problem nur Leitung), Retourenlabel, Stornieren (Angelegt Mitarbeiter; Etikett/Problem Leitung; Unterwegs gesperrt „Sendung ist beim Carrier – Storno telefonisch“).
- **Massenaktionen:** Tracking aktualisieren („12/40“), Etiketten drucken, Exportieren (Leitung), Mehr ▾ Stornieren (Vorschau „2 von 3 möglich – 1 bereits unterwegs“).
- **Leer:** nie „Noch keine Sendungen. Sendungen entstehen am Packtisch über ‚Etikett‘.“; Ansicht Problem „Keine Sendungen mit Problem.“ (Häkchen).

### 4.5 Sendungs-Akte `/logistik/sendungen/[name]`

- **Kopf:** Richtung · Carrier Dienst → Ort, Status, TEST, Fehlerband („Letzter Fehler: Tracking – 14:15. Nächster Versuch automatisch.“).
- **Primär:** Ohne Etikett (LetMeShip) → **Buchen und Etikett abrufen** (`buchen`; live Bestätigung) · Ohne Etikett (Manuell/Spedition) → **Tracking-Nr. eintragen** · Etikett bereit → **Etikett drucken** · Unterwegs → **Tracking aktualisieren** · Problem → **Klären** (Sheet: ① letzter Eintrag + Carrier-Link ② Wege: „Carrier informiert – abwarten“ (Kommentar + ToDo mit Datum + 2 Werktage), „Kunde hat Ware“ (`manuell_zugestellt`, Leitung), „Ware kommt zurück“ (`retourenlabel` bzw. abwarten), „Neu senden“ → PH Aufgabe an Leitung (Ersatzlieferung fehlt, Anfrage A24)) · Zugestellt → keine.
- **Tabs:** Tracking (`TrackingZeitstrahl`, absteigend; Code 13 px `text-soft`; „erwartet bis“ nur mit `laufzeit_tage`; leer „Noch keine Meldung vom Carrier. Nächster Abgleich 16:15.“ [Jetzt abgleichen]) · Daten (Empfänger read-only nach Buchung) · Kosten (Preis, berechnet, Differenz, Angebote zum Buchungszeitpunkt aus `tarife_json`) · Verlauf.
- **CH-Ziel:** Fehler `land_ch` → „Versand in die Schweiz ist nicht eingerichtet (Zoll). Eigenlieferung oder Spedition wählen.“

### 4.6 Touren `/logistik/touren` – Plantafel

Datenquelle: **ein** Aufruf `ph_tour.plantafel(von, bis)` (Touren + Stopps, Fahrzeuge, ungeplante Lieferscheine, Speditionen, Doppelbelegungen) + `getList PH Montageauftrag` (Projekte, wenn installiert) + Abwesenheiten (Personal, nur „abwesend“).

**Desktop (≥ 1280 px, Woche):**

```
┌ Touren   ‹ KW 46 ›  [Heute]   Woche | 3 Tage | Tag    Plantafel | Liste | Kanban                     [+ Tour] ┐
├ OHNE TOUR 6 ──────────────────┬ Mo 09.11. ───────────┬ Di 10.11. ───────────┬ Mi 11.11. ───────────┬ Do … ┤
│ ⌕ PLZ / Kunde   Wunsch KW 46 ▾│ Sprinter BZ-123      │                      │                      │      │
│ ┌──────────────────────────┐  │ ┌──────────────────┐ │ ┌──────────────────┐ │       [+ Tour]       │      │
│ │ Hotel Alpenrose          │  │ │ TOUR-0031 ● Frei │ │ │ TOUR-0032 ● Gepl │ │                      │      │
│ │ 6900 Bregenz · Gepackt   │  │ │ (MF)(JK)  ⚠ 1    │ │ │ kein Fahrer ⚠    │ │                      │      │
│ │ Wunsch 10.11. · 412 kg   │  │ │ 5 Stopps ▇▇▇░░   │ │ │ 3 Stopps ▇░░░░   │ │                      │      │
│ └──────────────────────────┘  │ │ 412 / 1 100 kg   │ │ │ 120 / 1 100 kg   │ │                      │      │
│ ZURÜCK IM FAHRZEUG 2          │ └──────────────────┘ │ └──────────────────┘ │                      │      │
│ MONTAGEN OHNE TOUR 1          │ LKW BZ-456  [+ Tour] │                      │                      │      │
│ SPEDITIONEN 1                 │ abwesend: J. Kurz                                                   │      │
└───────────────────────────────┴─────────────────────────────────────────────────────────────────────┴──────┘
(Beispielwerte)
```

- **Ablage** (links, 320 px): Abschnitte „Ohne Tour“ (Eigenlieferung/Spedition, Entwurf/Gepackt, `tour` leer; sortiert Wunschtermin, PLZ), „Zurück im Fahrzeug“ (nur Anzeige + „Aufgabe an Leitung“; „Neu einplanen“ erst mit Schalter `ruecklieferung`), „Montagen ohne Tour“ (Montageaufträge `Geplant` der Woche ohne Stopp mit `montage_referenz`), „Speditionen“ (Speditionsaufträge mit Zustelldatum im Zeitraum, nur Anzeige mit Lademeter). Karte: Kunde (16/500), Ort + PLZ, Status (Entwurf = „wird vor Abfahrt gepackt“), Wunsch, Gewicht, Chips „Kommission“, „2. Versuch“ (sobald A5).
- **Tour-Karte (kompakt, 3 Zeilen):** Nummer + Status-Punkt · Avatare Fahrer/Team 20 px + Warn-Icon mit Zähler (Popover: kein Fahrer, Fahrzeug/Fahrer doppelt belegt aus `doppelbelegung`, Teammitglied abwesend, `naechster_service` ≤ Tourdatum, Stopp mit Lieferschein Entwurf, `zeitfenster_konflikt`, Anzahlung offen) · „5 Stopps · 412 / 1 100 kg“ mit 4-px-Balken (> 100 % rot + Text „Zuladung überschritten um 85 kg“). Volumen nur, wenn alle Lieferscheine Pakete mit Maßen haben, sonst „Volumen unbekannt (n)“.
- **Zuordnen ohne Ziehen:** Tipp auf Ablage-Karte → Sheet „Zuordnen“ mit Tour-Kacheln der sichtbaren Tage (Auslastung **danach**, z. B. „+120 kg → 532 / 1 100 kg“, rot bei Überschreitung) + „Neue Tour hier …“. Ziehen zusätzlich (150 ms Halten auf Touch); beim Ziehen über einer Tour-Karte dieselbe Vorschau in der Karte.
- **Ablegen/Zuordnen** → Server Action `zurTourAction` (prüft Lieferart, Status, keine andere aktive Tour; Anzahlung → bei `anzahlungHart` Hinweis, Freigabe später gesperrt) → `stopps_hinzufuegen(lieferscheine=[name])`; Undo `stopp_entfernen`. Montage-Karte → Stopp `art=Montage`, `montage_referenz`, Adresse/Telefon/Zeitfenster aus Montageauftrag (Action baut Zeile, speichert Tour mit `modified`).
- **Tour verschieben** (Karte auf anderen Tag/Fahrzeug bzw. Menü „Verschieben …“): Geplant → sofort + Undo; Freigegeben → Dialog „Tour auf Di 10.11. verschieben? Die Freigabe muss neu erteilt werden.“; Leitung „Verschieben und freigeben“, Mitarbeiter gesperrt mit Grund „Freigegebene Touren verschiebt die Leitung“. Bis zur Rücknahme-Methode (A8) schreibt die Action `datum`/`fahrzeug` und gibt erneut frei (Leitung); der Fahrer sieht auf dem Telefon „Tour geändert“.
- **Neue Tour** (Zelle „+ Tour“ oder `n`): Popover Datum (Spalte), Fahrzeug (Zeile), Fahrer (vorbelegt `standard_fahrer`), Abfahrt (vorbelegt aus App-Standard) → `insert PH Tour`; Team in der Akte.
- **Freigeben** aus der Karte (Leitung): Popover mit Prüfliste (Fahrer, Stopps, Lieferscheine gepackt, Anzahlungen) → verzögerter Commit.
- **iPad quer (1024–1279 px):** Segment Standard „3 Tage“, Ablage eingeklappt 56 px („Ohne Tour 6 ▸“, Tipp öffnet 280 px als Überlagerung). **< 1024 px oder 200 % Zoom:** automatisch Liste + „Tag“, Hinweis „Plantafel ab 1024 px“.
- **Tastatur/Screenreader:** `role="grid"`, Zellen Tag × Fahrzeug, Pfeile zwischen Zellen, `Enter` in die Karten, `Tab` verlässt das Raster zur Ablage; Live-Region „LS-…138 zu TOUR-0031 zugeordnet · 412 von 1 100 kg“.
- **Liste:** Nummer, Datum, Region, Fahrzeug, Fahrer, Stopps erledigt/gesamt, km, Status. **Kanban** „PH Touren“: Geplant → Freigegeben nur Leitung (verzögert), sonst nur Ansicht. **Kalender-Balken** tragen das Kennzeichen als Text.
- **Leer:** Zeitraum ohne Touren „Keine Touren von Mo bis Mi. Tippen Sie einen Lieferschein an oder legen Sie eine Tour an.“ [+ Tour]; Ablage leer „Alle Lieferungen sind eingeplant.“ (Häkchen); keine Fahrzeuge „Noch keine Fahrzeuge angelegt. Touren brauchen ein Fahrzeug.“ [Fahrzeug anlegen] (Leitung) / „Bitte Leitung fragen“; Suche „Kein Lieferschein mit ‚6971‘.“ [Suche leeren]. **Fehler:** Montage-Quelle fehlt → Hinweis in der Ablage „Montagen nicht geladen (Projekte nicht erreichbar)“, Rest arbeitet.

### 4.7 Tour-Akte `/logistik/touren/[name]`

```
┌ Logistik › Touren › PH-TOUR-2026-0031                                                                       ┐
│ PH-TOUR-2026-0031 · Mo 09.11. · Sprinter BZ-123 · M. Fink + 1      ● Freigegeben     [Starten] [⋯]        │
│ ○ Geplant ── ● Freigegeben ── ○ Unterwegs ── ○ Abgeschlossen                     freigegeben von A. Berger │
├ Stopps 5 | Team & Fahrzeug | Fotos | Verlauf ─────────────────────────────────────╥ ROUTE ────────────────┤
│ ⠿ 1  07:30      Abfahrt Showroom Lochau                                ↑ ↓ ⋯      ║ Route ansehen ↗        │
│ ⠿ 2  08:00–09:00 Lieferung Fam. Berger · 6911 Lochau  ETA 08:05 ● Gepackt ↑ ↓ ⋯   ║ 5 Stopps · 0 erledigt  │
│ ⠿ 3  09:30–12:00 Montage  Küche Muster · 6900 Bregenz ETA 09:20 ● Geplant ↑ ↓ ⋯   ║ 412 / 1 100 kg         │
│ ⠿ 4  13:00–13:30 Lieferung Hotel Alpenrose ⚠ Zeitfenster      ● Gepackt ↑ ↓ ⋯     ║ Volumen unbekannt (2)  │
│ [+ Stopps hinzufügen]  [Nach PLZ sortieren]  [Avis senden …]                        ║ Fahrzeiten: Standard   │
└──────────────────────────────────────────────────────────────────────────────────╨────────────────────────┘
```

- **Primär:** Geplant → **Freigeben** (nur Leitung; deaktiviert mit sichtbarem Grund: kein Fahrer, keine Stopps, Lieferschein im Entwurf, Anzahlung offen bei `anzahlungHart` – Override Leitung/GF mit Grund) · Freigegeben → **Starten** (km-Dialog mit Vorschlag) und sekundär „Mobil öffnen“ (QR + Link `/montage`) · Unterwegs → **Aktualisieren** (Status der Stopps; Polling 60 s nur bei offener Akte, ohne Uhrzeiten) · alle Stopps beendet → **Abschließen** (km) · Abgeschlossen → Tourenblatt drucken.
- **`⋯`:** Tourenblatt drucken, Route ansehen (`route_url`), Avis senden …, Duplizieren für anderen Tag (Action legt Tour mit Fahrzeug/Fahrer/Team ohne Stopps an), Abbrechen (Leitung, Grund Pflicht; Dialog listet „3 Lieferscheine bleiben ‚Übergeben‘ (Ware im Fahrzeug) – Aufgabe an Leitung wird angelegt“, solange A5 fehlt).
- **Tab Stopps:** Reihenfolge per Ziehen (Griff), Tasten `↑`/`↓`, Menü „An Position …“, `Alt+↑/↓` – **sofort gespeichert** mit Undo. Spalten: Nr., Zeitfenster (inline), Art, Kunde/Ort, ETA (`eta`, App rechnet mit `fahrt_min`/Standard; Kopfzeile „Fahrzeiten: Standardwert aus Einstellungen“), Konflikt-Icon (`zeitfenster_konflikt`), Bezug (Lieferschein/Montageauftrag mit Status), Dauer (inline), Telefon, Avis (gesendet am/Kanal), Status, Notiz. Ankunft/Abfahrt nur mit `zeitstempelAnzeigen`. Leer: „Noch keine Stopps. Lieferscheine ohne Tour: 6.“ [Stopps hinzufügen]
- **„+ Stopps hinzufügen“** (Dialog, Segment): Auswahl (ungeplante Lieferscheine, Mehrfach) · Nach Filter (Wunschtermin von/bis, PLZ-Präfix) · Montage · Freier Stopp (Abholung bei Lieferant/Polsterei, Warenrücknahme beim Kunden mit Link `PH Warenruecknahme`, wenn A22 da ist; sonst Freitext). Ergebnis „3 Stopps hinzugefügt“.
- **„Nach PLZ sortieren“** → `reihenfolge_optimieren`, Undo. **„Avis senden …“** → Sheet: Kanal (Mail · SMS · beide; SMS nur, wenn `avis_sms_aktiv`), Vorschau je Sprache, Liste der Stopps mit/ohne Kontaktweg → `avis_senden(kanal, stopps)`; Ergebnis je Stopp („4 gesendet · 1 ohne E-Mail – Telefonliste“); Telefonliste druckbar.
- **Tab Team & Fahrzeug:** Fahrzeug (Zuladung, Volumen, Laderaum, nächster Service), Fahrer, Team (Fahrer/Monteur/Helfer), Start-Lagerort, Abfahrt, km Start/Ende, Notiz für Fahrer, Notiz intern; Konflikte aus `doppelbelegung` + Abwesenheit (nur „abwesend“).
- **Tab Fotos:** nach Stopp, Lightbox; leer „Fotos der Fahrer erscheinen hier nach Stopp-Nummer.“

### 4.8 Speditionsaufträge `/logistik/speditionen` (+ Akte)

- **Liste/Kanban** „PH Speditionsauftraege“ (Entwurf · Gesendet · Bestätigt · Abgeholt · Zugestellt). Spalten: Nummer, Richtung, Spediteur, Kunde/Kommission, Abholung (Datum, Zeitfenster), Zustellung (Datum, Zeitfenster, Zustellart), Packstücke, Gewicht, Lademeter, Preis bestätigt (Leitung), Status. Ansichten: Offen · Diese Woche · Hersteller an Lager · Alle.
- **Akte:** Kopf Richtung · Spediteur · Ziel, Status. Primär: Entwurf → **An Spedition senden** (Vorschau Mail + PDF „PH Speditionsauftrag Standard“, `per_email_senden(an, text)`; deaktiviert mit Grund ohne `spediteur_email` oder Packstücke) · Gesendet → **Bestätigung erfassen** (Dialog Preis, Abhol-/Zustelldatum, Referenz → `bestaetigen`) · Bestätigt/Gesendet → **Abgeholt melden** (`abgeholt`; setzt Lieferschein Übergeben an Spedition) · Abgeholt → **Zustellung erfassen** (Empfänger Pflicht, Unterschrift/Foto der Quittung → `zugestellt`; Inbound legt Aufgabe „Wareneingang erfassen“ an). `⋯`: Stornieren (Entwurf Mitarbeiter, danach Leitung, Grund), PDF drucken, Leistungen.
- **Tabs:** Adressen (Abholung/Ziel, vorbelegt), Leistungen (Etage, Aufzug, Hebebühne, Trageservice, Montage, Verpackung entsorgen, Avis), Packstücke (Kindtabelle Art/Anzahl/Maße/Gewicht → Summen und Lademeter aus der App), Kosten (Leitung), Verlauf.
- Leer: „Noch keine Speditionsaufträge. Sie entstehen am Lieferschein (Lieferart Spedition) oder an der Herstellerbestellung.“

### 4.9 Warenrücknahmen `/logistik/ruecknahmen` (+ Akte)

- Für Rücknahmen außerhalb des Shop-Widerrufs (Shop-Retoure bleibt im Shop). Liste: Nummer, Anlass, Kunde, Lieferschein, Abholdatum/Tour, Positionen, Status.
- **Akte Primär:** Angemeldet → **Annehmen** (Sheet Unterschrift/Name, Fotos → `annehmen`) · Angenommen → **Prüfung buchen** (Positionen: Zustand Neuwertig/B-Ware/Defekt Pflicht, Entscheidung Wiedereinlagern/B-Ware/Ausbuchen/An Lieferant Pflicht, Platz bei Einlagerung Pflicht, Foto bei Defekt Pflicht → `pruefung_buchen`, dann Workflow „Prüfen“) · Geprüft → **Abschließen** (Leitung) · `⋯`: Servicefall anlegen, Protokoll drucken („PH Warenruecknahme Protokoll“), Stornieren.
- Hinweis in der Akte: „Gutschrift erstellt Faktura“ mit Link `gutschrift_hinweis`.
- Leer: „Keine Rücknahmen. Eine Rücknahme entsteht am zugestellten Lieferschein.“

### 4.10 Bestand `/logistik/bestand` (T2, gruppiert)

```
┌ Bestand                                                                           [Umlagern …]  [⋯] ┐
│ Alle · Showroom · Lager · Fahrzeuge · Kommission · Gesperrt                                   (Tabs) │
├ [Verfügbar] [Reserviert] [Kommission] [Gesperrt] · [Filter +]                                   ⌕ /  ┤
│ ▾ Showroom Lochau · 84 Positionen · 96 Stück                                                        │
│ ☐ Platz  Artikel                       SN        Menge  Res.  Verf.  Zustand   Status               │
│ ☐ A-03   Sofa … Stoff Kat. B           SN-1182   1      0     1      Ausst.    ● Verfügbar          │
│ ☐ A-04   Esstisch Eiche 220            SN-0917   1      1     0      Ausst.    ● Reserviert (bis 18.11.)│
│   Weitere 25                                                                                        │
│ ▸ Lager · 212 Positionen · 640 Stück                                                                │
└ Auswahl (2): [Umlagern] [Etiketten drucken] [Reservieren] [Mehr ▾]                                  ┘
(Beispielwerte)
```

- **Gruppen laden einzeln** (Kopf mit Summen aus Report „PH Bestandsliste“, je Gruppe 25 Zeilen + „Weitere 25“); ungruppiert = normales Paging. Zuklappzustand in `localStorage`.
- **Spalten:** Platz, Artikel (Bild 40 px), Marke, Ausführung, SN, Menge, Reserviert (Tooltip `reserviert_fuer`, `reserviert_kunde_name`, `reserviert_bis`), Verfügbar, Zustand, Kommission, Sperrgrund, Eingang, letzte Inventur, Alter (nur Ausstellungsstück), EK (Leitung/GF), VK Ausstellung, Status.
- **Primär** „Umlagern …“ (Dialog mit Scanfeld: Bestand scannen oder wählen → Ziel per Platz-QR/Kachel). `⋯`: Wareneingang buchen (→ Sortiment), Bestand erfassen („Nur für Erstanlage ohne Bestellung“), Platzetiketten drucken.
- **Zeilenaktionen** (Menü; Kürzel § 3.4): Umlagern, Reservieren (Bezug AB · Bestellung, Kunde, bis – Standard `reservierung_tage_standard`), Reservierung freigeben, Sperren (Grund Pflicht), Entsperren (Leitung), Lageretikett, Ausbuchen (Leitung, rot, unten; Menge vorbelegt `verfuegbar`, Grund-Chip Beschädigt · Schwund · Eigenverbrauch · Entsorgt · Sonstiges + Text). Gesperrt/Kommission: „Reservieren“ deaktiviert mit Grund aus der App.
- **Inline Platz:** Combobox der Plätze des Lagerorts, Hinweis „Erzeugt Umlagerung“, verzögerter Commit 8 s → `umlagern(platz_nach=…)`.
- **Massenaktionen:** Umlagern (gleiches Ziel), Etiketten drucken (eine PDF 62×29), Reservieren (gleicher Bezug), Exportieren (Leitung), Mehr ▾: Sperren, Ausbuchen (Leitung). Ergebnis „8 umgelagert, 1 übersprungen (gesperrt)“.
- **Leer:** nie „Noch kein Bestand. Bestand entsteht beim Wareneingang.“ [Zum Wareneingang]; Filter Standard; Tab Gesperrt leer „Kein gesperrter Bestand.“ (Häkchen).

**Bestand-Akte `/logistik/bestand/[name]`:** Kopf Artikel · Lagerort/Platz · SN, Status, Chips Ausstellungsstück/Zustand/Kommission. Primär **Umlagern**. Tabs Übersicht (Menge/Reserviert/Verfügbar als drei Kennzahlfelder, Zustand, SN, EAN, Eingang, Inventur, EK Leitung, VK Ausstellung, Reservierung mit Ablauf, Sperre, Bezug) · Bewegungen (Journal mit laufendem Saldo) · Andere Lagerorte (`getList PH Lagerbestand produkt=`) · Verlauf. Hinweis bei Ausstellungsstück: „Verkauf an der Kassa: Lageretikett scannen.“

### 4.11 Ausstellung `/logistik/ausstellung` und Kommission `/logistik/kommission`

- **Ausstellung:** Bestand `ausstellungsstueck=1`, Verfügbar/Reserviert. Spalten Platz, Artikel + Bild 64 px, SN, Alter mit Klasse aus Report „PH Ausstellungsstuecke“ (Text immer), VK Ausstellung (inline `BetragFeld`, Leitung), Reserviert für. Kopf-Kennzahlen aus Report-Summary (Anzahl, VK gesamt, „> 1 Jahr“). Primär „Platz ändern …“ (Scan-Modus „Platz zuerst“ § 8.2). Leer: „Keine Ausstellungsstücke erfasst. Ausstellungsstücke sind Bestand mit Seriennummer im Showroom.“
- **Kommission:** Suche Kommission (Projekt/AB) → `lager.kommissionsliste` mit drei Blöcken „Im Lager“ (Platz, gesperrt?), „Noch erwartet“ (aus Herstellerbestellungen, Liefertermin), Summen. Primär **Lieferschein aus Kommission** (Sheet: Lieferart, Bestände vorausgewählt (nicht gesperrt, nicht auf offenem Lieferschein), Wunschtermin → `lieferschein_aus_kommission`). Hinweis bei Lücken: „2 Positionen noch nicht eingegangen – Teillieferung oder warten?“ (Segment). Report „PH Kommissionsware“ als Tab.

### 4.12 Bewegungen `/logistik/bewegungen` (Journal)

- Spalten: Datum, Art mit Richtungszeichen und Wort, Menge (vorzeichenbehaftet), Artikel, Von, Nach (Lagerort/Platz), Bezug (Link), Gebucht von, Quelle, Grund, Status (storniert durchgestrichen + Link). Filter Zeitraum (Standard 30 Tage), Art, Lagerort, Artikel, Bezug-Typ, Benutzer, Status.
- **Keine** Bearbeitung, kein Löschen. Zeilenmenü „Stornieren“ (Leitung): „Gegenbuchung zu PH-LBW-… anlegen? Bestand Showroom +1“.
- Kopf „Bewegung buchen“ (§ 5.10, selten).
- Leer: „Noch keine Bewegungen. Jede Bestandsänderung erscheint hier.“; Filter „Keine Bewegungen ‚Ausbuchung‘ in den letzten 30 Tagen.“ [Filter zurücksetzen]. Ohne Recht: `lock` „Kein Zugriff auf Bewegungen · Bitte Leitung fragen“.

### 4.13 Inventur `/logistik/inventur` (+ Akte)

- **Liste:** Nummer, Titel, Lagerort, Stichtag, nur Ausstellungsstücke, Gezählt von, Fortschritt (Balken `scaleX` + Text „61/84“), Positionen mit Differenz, Summe Differenz, Freigegeben von/am, Status. Primär „Inventur anlegen“ (§ 5.11). Leer: „Noch keine Inventur. Eine Inventur zählt einen Lagerort und bucht Differenzen nach Freigabe.“
- **Akte:** Primär je Zustand: Geplant ohne Positionen → **Zählliste erzeugen** · Geplant mit Positionen → **Zählung starten** (`starten`) · Laufend → **Zählmodus** (Vollbild § 8.1) und für Leitung **Freigeben und buchen** · Abgeschlossen → Zählliste drucken, Bericht Differenzen.
- **Tab Zählliste:** Ist inline (Enter → nächste Zeile, `zaehlen(lagerbestand, ist)`), Differenz live, Grund **optional** beim Zählen, Bemerkung; „Soll ausblenden“ als Geräteeinstellung („Auf diesem Gerät Soll ausblenden“). Zählbereiche: Kopf zeigt „Bereich A-* · zählt Lena M.“ (Kommentar `bereich:A-*` mit Benutzer; andere Geräte sehen den Bereich als belegt).
- **Tab Differenzen:** nur Zeilen mit Differenz, sortiert nach Betrag, **Grund Pflicht vor Freigabe** („3 Differenzen ohne Grund · Zeigen“), „Nachzählen lassen“ je Zeile. Leer: „Keine Differenzen – alle gezählten Positionen stimmen.“ (Häkchen)
- **Fund:** Scan außerhalb der Liste → „Nicht in dieser Zählliste“ + „Als Fund erfassen“ (`position_hinzufuegen`; Fehlertexte der App wörtlich, z. B. „gehört zu … – bitte zuerst umlagern“).
- **„Zählliste neu erzeugen“** nur in Geplant; mit gezählten Werten rote Bestätigung „Zählliste neu erzeugen? 61 gezählte Werte gehen verloren.“

### 4.14 Stammdaten `/logistik/stammdaten`

| Tab | Inhalt | Regeln |
|---|---|---|
| Lagerorte | Bezeichnung, Art, Standard, Adresse, Plätze, Fahrzeug, Aktiv; Sheet mit Plätzen | Standard eindeutig; Löschen mit Bestand → nur „Deaktivieren“; Fahrzeug-Lagerorte read-only; „Platzetiketten drucken“ („PH Lagerort Platz-Etikett“) |
| Fahrzeuge | Kennzeichen, Bezeichnung, Art, Ladevolumen, Zuladung, Laderaum, Standard-Fahrer, nächster Service (≤ 14 Tage orange), Aktiv | Anlegen legt Lagerort „Fahrzeug <Kennzeichen>“ an (Hinweis im Dialog) |
| Paketprofile | Kennung, Familie, Maße, Gewicht, Tara, Limits, Zerbrechlich/Glas/Kerze, **Geprüft** (Chip „Schätzung“), Versand gesperrt (Grund), Gefahrgut | „Als gemessen markieren“; Banner „n Profile sind Schätzungen – Live-Etiketten erst mit gemessenen Profilen“ |
| Einstellungen (Leitung) | Versanddienst (Testmodus, Umgebung lesend, Zugangsdaten ja/nein lesend, Dienstwahl, Carrier, Aufschlag, „USt Versand (Rückfall AT)“, Tarif-Gültigkeit, Tracking-Intervall) · Versicherung · Abholung (Tage, Abholcode-Pflicht) · Pauschalen/Länder · Absender · Lagerorte · Touren (Fahrzeit/Stoppdauer Standard, Avis-Vorlage, SMS aktiv) · Reservierung (Tage) · Mail-Vorlagen · Hinweis am Packtisch | `⌘S`; Testmodus aus = Bestätigung „Ab jetzt werden Etiketten kostenpflichtig gebucht.“; **keine Schlüssel** in der UI |

### 4.15 Berichte `/logistik/berichte/[report]`

PH Versandkosten vs berechnet · PH Laufzeiten · PH Zustellprobleme · PH Bestandsliste (Wert nur Leitung) · PH Ausstellungsstuecke · PH Inventurdifferenzen (Leitung, GF) · PH Touren Auslastung (je Woche/Fahrzeug, **keine** Gruppierung je Person) · PH Kommissionsware. Ausführung `getReport`, Zeitlimit 8 s → „Zeitraum eingrenzen“; Report-Farben ersetzt durch Serien 03 § 1.6; Export nur mit Recht (Protokolleintrag).

---

## 5. Dialoge und Sheets

### 5.1 Lieferschein erzeugen (aus AB, Bestellung, Projekt-Mappe) – ein Sheet

```
┌ Lieferschein zu AB-2026-00017 · Hotel Alpenrose                                          [×] ┐
│ ┌ gelb: Anzahlung offen 1.200,00 € – Anlegen möglich, Übergabe/Freigabe gesperrt ┐            │
│ Position                     bestellt  geliefert  in Lieferung  Rest   Menge   Eingang         │
│ Sofa Modell … Stoff B        2         0          0             2      [2]     im Lager 02.11. │
│ Stuhl …                      8         4          4             0      –       –               │
│ Arbeitsplatte 2,5 lfm        2,5       0          0             2,5    gesperrt (Dezimal)      │
│ ☐ Nur eingegangene Positionen                                                                │
│ Lieferart  [Abholung] [Versand] [Eigenlieferung] [Spedition]     Wunsch [10.11.2026]          │
│ ▸ Adresse & Hinweis (aus AB)                                                                  │
│                                              [Abbrechen]  [ Anlegen (⌘Enter) ]                │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
(Beispielwerte)
```

- „in Lieferung“ = Σ Mengen offener Lieferscheine (nicht storniert, nicht zugestellt) je `beleg_position`; Rest = bestellt − geliefert − in Lieferung; Menge 0…Rest (Stepper/Zahlenblock).
- Nur `art in (Produkt, Leistung)`, nicht `alternativ`. Dezimalmengen gesperrt (E9). Fehler: alles 0 → „Mindestens eine Position mit Menge > 0.“; Server-Rest kleiner (paralleler Lauf) → Fehler je Zeile „Position 3: nur noch 2 offen (4 in LS-…141)“.
- Lieferart Standard: AB Eigenlieferung, Shop Versand. CH-Adresse + Versand → Hinweis Zoll (§ 4.5). Ausstellungsstück aus AB: Zeile mit SN-Auswahl (Bestand) → setzt `lagerbestand`.
- „Anlegen“ → `lieferscheinErzeugenAction` → `lieferschein_aus_auftrag(auftrag, positionen, lieferart)` bzw. `lieferschein_aus_bestellung` → danach `save` Adresse/Wunschtermin (Belegsperre Entwurf) → Ergebnis-Karte „LS-2026-00138 erzeugt“ [Packliste drucken] [Pack-Ansicht] [Weitere Teillieferung]. Doppelklick: Idempotenz-Schlüssel je Sheet-Öffnung.

### 5.2 Zur Tour … (Popover)

Touren ab Wunschtermin (7 Tage) als Zeilen mit Datum, Fahrzeug, Auslastung danach, Status; „Neue Tour …“ am Ende. Auswahl → `zurTourAction`; Fehler je Lieferschein wörtlich („Versand-Lieferscheine fahren nicht auf Touren“, „Bereits in TOUR-0032“).

### 5.3 Neue Tour (Popover)

Datum, Fahrzeug (Kacheln mit Zuladung/Service-Hinweis), Fahrer (vorbelegt), Abfahrt → „Anlegen“ (`insert PH Tour`) bzw. „Anlegen und Lieferschein zuordnen“ (aus Sheet „Zuordnen“).

### 5.4 Etikett (ein Bildschirm; Kiosk im Vollbild-Dialog, Backoffice als Sheet)

```
┌ Etikett für Fam. Huber · AT                                                         [×] ┐
│ 2 Pakete · 6,0 kg · versichert 289,00 € (Glas)                              [Ändern ▾]  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌ EMPFEHLUNG ─────────┐ ┌─────────────────────┐ ┌─────────────────────┐                  │
│ │ ◉ DPD Classic       │ │ ○ GLS Business      │ │ ○ DHL Paket         │   radiogroup     │
│ │ 1–2 Tage · 11,00 €  │ │ 1–2 Tage · 12,40 €  │ │ 2 Tage · 13,10 €    │   Kacheln 96 px  │
│ └─────────────────────┘ └─────────────────────┘ └─────────────────────┘                  │
│ Dem Kunden berechnet 9,90 € · Differenz −1,10 €          Preise gültig bis 14:35        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                          [Abbrechen]  [  Buchen und drucken (F12)  ]   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
(Beispielwerte; Testmodus: Mock-Tarife)
```

- Daten: `tarife(neu=0)` (Packtisch `packtisch.tarife`); Empfehlung nach Dienstwahl vorausgewählt. Versicherung: Glas → an, Hinweis „Glas wird immer versichert“; Abschalten mit Warnung.
- Warnung `versandfaehig` → Paketteil ausgeklappt, Feld markiert, „Buchen“ deaktiviert mit sichtbarem Grund darunter; gesperrtes Profil (Gefahrgut) → Text der App + „Abholung statt Versand“.
- Tarif abgelaufen beim Tippen → Neuabfrage `neu=1`, geänderter Preis 1200 ms markiert („Preis neu: 11,40 €“), erneut „Buchen“ nötig.
- Live → Bestätigung „DPD Classic für 11,00 € kostenpflichtig buchen?“; Test → ohne, Band „TESTMODUS“.
- „Buchen und drucken“ → `etikett_erzeugen(tarif_id)`; Knopf `aria-busy`, Text „Sendung anlegen … Buchen … Etikett abrufen …“; 600 ms Doppelklick-Sperre. Zeitüberschreitung → Zustand „Buchung wird geprüft …“ (aktive Sendung abfragen), erst danach „Erneut buchen“ – nie direkt neu buchen.
- Ergebnis-Karte (kein Timer): „Etikett DPD 0123 4567 8901 gedruckt“ [Erneut drucken] [Lieferschein drucken] [Nächster ›]; Druck an Gerätedrucker „Etikett“, ohne Gerät Browser-Druck. Druck fehlgeschlagen → „Etikett gebucht, Druck fehlgeschlagen“ [Erneut drucken] [Als PDF öffnen] (kein Neubuchen).
- Fehler „bereits aktive Sendung PH-SND-…“ → [Sendung öffnen]; Buchung fehlgeschlagen → Sendung bleibt „Ohne Etikett“ mit Fehlertext, [Erneut buchen]; keine Tarife → „Keine Tarife (Code). Abholung anbieten oder Pauschale laut Einstellungen.“ [Abholung statt Versand] [Manuelle Sendung].

### 5.5 Übergeben an

Segment Dienstleister · Spedition (Fahrer nur über Tour-Start) → verzögerter Commit `uebergeben(an)`. Gesperrt bei offener Anzahlung (`anzahlungHart`), Override-Feld „Grund (Leitung)“ Pflicht.

### 5.6 Zustellung bestätigen (Desktop)

Datum (vorbelegt heute), Empfangen von (optional), Notiz; Unterschrift nur auf Touch-Geräten angeboten → `als_zugestellt(empfaenger_name)`. Bei Ausfuhr/EU-steuerfrei: Hinweis „Empfangsbestätigung mit Ort, Datum, Menge für Faktura beilegen“ + Aufgabe an Faktura.

### 5.7 Storno (rot, Fokus auf „Abbrechen“)

Folgen werden einzeln aufgezählt, z. B.: „Sendung PH-SND-… (Etikett bereit) wird beim Dienstleister storniert · 2 Lagerbewegungen werden zurückgebucht · Stopp 4 in TOUR-0031 wird entfernt“. Grund Pflicht. Sperren: Teilrechnung vorhanden → „Teilrechnung RE-… existiert – zuerst Gutschrift in Faktura“ [Zur Rechnung]; Übergeben/Zugestellt → Knopf nicht vorhanden (§ 4.3). Action entfernt vorher den Tour-Stopp (`stopp_entfernen`).

### 5.8 Umlagern · Reservieren · Freigeben · Sperren · Ausbuchen

- **Umlagern:** Scanfeld (Bestand), Ziel Lagerort (LinkFeld) + Platz (Combobox oder Platz-QR → `platz_code`), Menge (vorbelegt `verfuegbar`) → `umlagern`; Undo Gegenumlagerung.
- **Reservieren:** Bezug Segment AB · Bestellung, Bezug (LinkFeld), Kunde (vorbelegt aus Bezug), bis (vorbelegt heute + `reservierung_tage_standard`), Menge → `reservieren(bezug_doctype, bezug, menge, bis, kontakt, kunde_name)`.
- **Sperren:** Grund Pflicht (Chips Transportschaden · Beschädigt · An Lieferant · Prüfung · Sonstiges + Text) → `sperren(grund)`; Entsperren nur Leitung.
- **Ausbuchen** (Leitung): Menge ≤ verfügbar (reservierte Menge zuerst freigeben – Hinweis), Grund-Chip Pflicht → `ausbuchen(grund, menge)`.

### 5.9 Problem melden (Packtisch, Akte, Tour)

Kacheln Beschädigt · Fehlt · Falscher Artikel · Adresse unklar · Sonstiges (App-Werte `PROBLEM_GRUENDE`) + Foto (Kamera, Overlay „Bitte keine Personen fotografieren“) + Text → `problem_melden(grund, text, fotos)`; Ergebnis „Gemeldet · Aufgabe an Leitung“ (+ „Servicefall SF-… angelegt“ bei Beschädigt). Lieferschein bleibt im Status.

### 5.10 Bewegung buchen (Leitung/Mitarbeiter, selten)

Ein Dialog: Art (Kacheln Wareneingang · Umlagerung · Ausbuchung · Retoure; Reservierung/Freigabe/Inventur/Verkauf entstehen aus ihren Vorgängen), Artikel/Bestand (Scan oder Suche), Menge (ganzzahlig), Von/Nach (je Art Pflicht laut `pruefe_bewegung`) + Platz, Grund Pflicht, Wirkungszeile live („Lager −2, Showroom +2“) → `insert PH Lagerbewegung`; `BestandsFehler` wörtlich am Feld.

### 5.11 Inventur anlegen

Lagerort, Stichtag (Standard heute), „Nur Ausstellungsstücke“ → `insert PH Inventur` + `zaehlliste_erzeugen` → Akte. Hinweis: „Während der Zählung keine Umlagerungen in diesem Lagerort buchen.“

### 5.12 Inventur freigeben (Leitung)

Zusammenfassung: „4 Bewegungen ‚Inventur‘ werden gebucht: −2 Stück netto · 61 von 84 gezählt – 23 ungezählte bleiben unverändert“. Sperren mit Grund: Freigebende Person = `gezaehlt_von` („Vier-Augen: Freigabe durch eine andere Person“); Differenzen ohne Grund; **Bewegungen im Lagerort seit Zählbeginn** (Bewegungen mit `lagerort_von|nach = lagerort` und `datum ≥` Zeitpunkt des Statuswechsels auf Laufend aus dem Verlauf) → „3 Bewegungen seit Zählbeginn – betroffene Positionen nachzählen“ [Zeigen] [Nachzählen lassen]. Erfolg: „Inventur abgeschlossen · 4 Bewegungen gebucht“ + Links.

---

## 6. Kiosk Packtisch `/packtisch`

Gerät `PH Geraet` Typ Packtisch, `KioskShell`. Grundschrift 16 px, Zeilen 56 px, Knöpfe ≥ 48 px (Primär 64 px), Raster 7/5. Idle 15 min mit 30-s-Band „Sperrt in 30 s · Weiter“; Pack-Ansicht bleibt nach PIN erhalten; ausstehende Commits gehen vor dem Sperrbild raus.

### 6.1 Startseite

```
┌ Packtisch · Lochau   Lena M. ▾ (⇧F2)   14:05   ● Bereit   printer Etikett ✓ A4 ✓    [Lager-Scan] [?] [⋯] ┐ Kopf 56
├─────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────────────────────────┐   │
│ │ scan-line  Lieferschein, Bestellung oder Abholcode scannen …                                │   │ 64
│ └─────────────────────────────────────────────────────────────────────────────────────────────┘   │
│ [ Packen 9 ] [ Abholung 3 ] [ Wareneingang 2 ]                                                    │ Segment 48
├─────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌ HEUTE ───────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐           │
│ │ Fam. Huber               │ │ Fam. Weiss               │ │ Hotel Alpenrose          │           │ 18/500
│ │ package Versand · Lochau │ │ package Versand · Lindau │ │ truck Eigenlief. · Breg. │           │
│ │ [Glas] 0/2               │ │ 3 Artikel  [neu]         │ │ [Tour Mo 09.11.] 0/14    │           │ Chips
│ │ LS-2026-00141            │ │ PH-S-261104-0012         │ │ LS-2026-00138            │           │ mono 13
│ └──────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘           │
│ ┌ ETIKETT FEHLT ───────────┐                                                                      │ oranger Rand
│ │ Fam. Kurz · Lindau DE    │                                                                      │
│ └──────────────────────────┘                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
(Beispielwerte)
```

- **Packen:** Lieferscheine Entwurf + Gepackt-Versand ohne Etikett + bezahlte Bestellungen ohne Lieferschein (`packtisch.offene`) gemischt; Bestellkarte zeigt „[neu]“ und erzeugt beim Antippen **still** den Lieferschein (`packtisch.lieferschein_aus_bestellung`) und öffnet die Pack-Ansicht. Sortierung: „Heute“ (Wunsch ≤ heute + 1, oranger Rand + Text) → „Etikett fehlt“ → übrige nach Alter.
- **Abholung:** Lieferscheine Gepackt, Lieferart Abholung (Kunde, „bereit seit“, Chip „bezahlt“/„offen 2.340,00 €“, „ohne E-Mail“). Abgelaufene Abholfrist (`abholung_bis`) → Chip „Frist abgelaufen – Verkauf entscheidet“.
- **Wareneingang:** `PH Wareneingang` Offen/Teilweise (Sortiment) → öffnet Wareneingang in derselben Shell.
- **Scan auf der Startseite:** `LS-` → Pack-Ansicht bzw. Abholkarte; `PH-S-` → Lieferschein öffnen/erzeugen; Abholcode → Abholkarte (`getList abholcode=`, Prüfung beim Ausgeben serverseitig); `WE-` → Wareneingang; Bestand-QR → Bestandskarte; Platz-QR → Platzkarte (`lager.platz_scan`); unbekannt → „Unbekannter Code“ (`role="alert"`, Ton bei `tonUnbekannt`).
- **Leer je Segment:** Packen „Nichts zu packen. Neue Bestellungen erscheinen hier automatisch.“ · Abholung „Keine Abholung bereit.“ · Wareneingang „Kein offener Wareneingang.“ (Häkchen).
- Polling 30 s + nach jeder Aktion; neue Karte 160 ms ohne Stagger. Hinweis aus `packtisch_hinweis` als Zeile unter dem Kopf; Testmodus → lila Band dauerhaft.
- **Status im Kopf:** „Scanner?“ (kein HID-Eingang seit Start) mit Taste „Mit Kamera scannen“; Drucker-Status aus Gerät; „Offline seit 14:02 – Packen wird gepuffert“.

### 6.2 Pack-Ansicht `/packtisch/[name]`

```
┌ ‹ Übersicht   Fam. Huber · Versand → 6911 Lochau            ● Entwurf     [Nächster ›] [⋯] ┐
├ POSITIONEN · 1/2 gepackt ──────────────────────────────────┬ PAKETE · 2 ────────────────────┤
│ ┌──────────────────────────────────────────────────────┐   │ Paket 1  Glas 2er (Schätzung)  │
│ │ scan-line Artikel scannen (EAN, SN, Website-QR)      │   │ 32×22×18 · 1,9 kg   [Ändern]   │
│ └──────────────────────────────────────────────────────┘   │ Paket 2  Leuchte M             │
│ ✓ Glas „…“ Riedel        [–] 2/2 [+]   Paket 1  Lager R-12 │ 45×45×60 · 4,1 kg   [Ändern]   │
│ ○ Leuchte „Seelicht“     [–] 0/1 [+]   Paket 2  Showroom   │ [+ Paket]  [Paket schließen]   │
│   Ausstellungsstück SN-0441 · aus Showroom A-07 entnehmen  │ Gesamt 6,0 kg · versichert     │
│                                                            ├────────────────────────────────┤ sticky
│ Letzter Scan: ✓ Glas „…“ hinzugefügt                        │ [      Etikett  (F4)       ]   │ 64 px
│                                                            │ Problem melden (F9)            │
└────────────────────────────────────────────────────────────┴────────────────────────────────┘
(Beispielwerte)
```

- Daten: `packtisch.packansicht(lieferschein)`. Rückweg „‹ Übersicht“ (nie „Fertig“, solange etwas offen ist). Zweite Person packt denselben Lieferschein (anderer Bediener hat in den letzten 2 min gescannt, aus `modified_by`) → Band „Lena packt diesen Lieferschein gerade (seit 14:02)“ [Trotzdem öffnen].
- **Positionszeile 56 px:** Haken-Fläche (Tipp = +1), Bezeichnung/Ausführung/Marke, **Stepper `[–] n/m [+]`** (48 × 48) und bei m > 1 Taste „Alle“; `–` → `packtisch.position_minus` mit Undo; Paket-Nr.; **Entnahme** (Lagerort/Platz; „Ort unbekannt“ nur, wenn kein Bestand passt). Kein Langdruck.
- **Entnahme setzen (§ 1.3 B2):** Beim Öffnen schlägt die Action je Position einen Bestand vor (Reihenfolge: SN-Treffer · für diese AB/Bestellung reserviert · Kommission des Lieferscheins · `packtisch_lagerort` · `standard_lagerort`; nur verfügbar, nicht gesperrt) und schreibt `lagerbestand` beim ersten Abhaken der Position (Entwurf, `save` mit `modified`). Scan einer SN wählt genau diesen Bestand. Mehrdeutig → Zeile zeigt „Entnahme wählen ▾“.
- **Scan:** `packtisch.scan` → erkannt (grün, Text „Hinzugefügt: …“, Zeile scrollt in Sicht) · unbekannt („Code 9003… gehört nicht zu diesem Lieferschein – Artikel suchen“) · bereits vollständig (lokal geprüft: „Position bereits vollständig (2/2)“) · anderer Lieferschein → „Zu LS-…139 wechseln? Dieser bleibt offen.“ Live-Region `role="status"` (ersetzt), `role="alert"` für unbekannt; Zeile `aria-describedby` „2/6 gepackt“.
- **Scanner-Regel:** Scanner wirkt global; `data-scan="feld"` am Gewichtsfeld (Waage: Zahl landet im Feld), `data-scan="nein"` in Problem-Text und Namensfeld. Artikel-Code im Maß-Feld wird als Scan ausgewertet, Feldinhalt bleibt.
- **Nach dem letzten Scan (E1):** Erfolgsmoment 04 § 3.12; Versand/Spedition ohne Pakete → `pakete_vorschlagen` automatisch; die **eine** Primärtaste wird primär (vorher Rand): Versand → **Etikett** (öffnet § 5.4 automatisch) · Abholung → **Abholbereit melden** (läuft automatisch als verzögerter Commit; ohne E-Mail: Toast „Kein E-Mail – Aufgabe ‚Kunde anrufen‘ angelegt“) · Eigenlieferung/Spedition → **Gepackt** (automatisch verzögert). Andere Wege nur im `⋯` der Spalte.
- **Pakete (`PaketEditor`):** Karte je Paket, Profil-Kacheln (Familie der Positionen, Chip „Schätzung“), Maße/Gewicht per Zahlenblock 56 px, Zerbrechlich, Inhalt; speichern `packtisch.pakete_speichern` (debounced 600 ms, „gespeichert“). Fuß der rechten Spalte `position: sticky` (Primärtaste + `⋯`), Liste scrollt darüber.
- **Offline:** Lese-Cache der heute geöffneten Lieferscheine; Abhaken/Pakete gepuffert als **absoluter Stand** (`positionen_setzen(stand, idempotency_key)`); Etikett, Gepackt, Ausgeben offline gesperrt mit Text „Braucht Verbindung“.

### 6.3 Abholung (Abholkarte)

Kunde groß, Positionen, Zahlung: Shop `bezahlt_am` gesetzt → „bezahlt“; sonst bzw. AB mit `offen_cent > 0` → „Offen 2.340,00 € – zuerst an der Kassa“ [Zur Kassa] und „An Kunde ausgeben“ gesperrt (Leitung-Override mit Grund). Abholcode-Feld (Pflicht laut `abholcode_pflicht`; ohne Code nur Leitung), Unterschrift (beide Ausrichtungen) oder Alternative „Name bestätigt“ (Foto Pflicht) → **An Kunde ausgeben** → `packtisch.abholung_buchen(lieferschein, empfaenger_name, unterschrift, abholcode)` → Erfolg „Ausgegeben an Fam. Moser“. Falscher Code → Feldfehler „Abholcode stimmt nicht.“

### 6.4 Lager-Scan (Kopf-Taste, Sheet)

Scan Bestand-QR → Bestandskarte (Artikel, Ort/Platz, Menge, Status) → „Umlagern“ (Scan Platz-QR → `lager.umlagern_scan`) · „Etikett drucken“ · „Sperren“. Serienmodus „Platz zuerst“: Scan Platz → alle folgenden Bestand-Scans werden dorthin umgelagert, bis ein neuer Platz gescannt wird; je Scan Toast mit Undo.

### 6.5 Problem (F9) → § 5.9.

### 6.6 Tastenbelegung Kiosk (Shell-Teil gilt für alle Kioske)

| Taste | Wirkung | Sichtbare Taste |
|---|---|---|
| `F1` | Hilfe | `[?]` |
| `Shift+F2` | Bedienerwechsel/Sperren | Name im Kopf |
| `F2` | Scanfeld fokussieren | Scanfeld |
| `F3` | Nächster Lieferschein | „Nächster ›“ |
| `F4` | Etikett-Bildschirm | „Etikett“ |
| `F6` | Paket schließen | „Paket schließen“ |
| `F7` | Paket hinzufügen | „+ Paket“ |
| `F9` | Problem melden | „Problem melden“ |
| `F12` / `Strg+Enter` | Abschluss-Primär der Ansicht (Gepackt · Abholbereit melden · Buchen und drucken · An Kunde ausgeben) | Primärtaste |
| `Strg+P` | Druckmenü (Lieferschein, Packliste, Etikett) | `⋯` → Drucken |
| `Strg+Z` | jüngsten Toast rückgängig | Toast-Taste |
| `Esc` | oberste Ebene schließen; in der Pack-Ansicht ohne Ebene: nichts | `×` |
| `F5`, `F8`, `F10`, `F11` | nicht belegt | – |

Keine Einzelbuchstaben im Kiosk; `<kbd>`-Hinweise nur bei `data-tastatur="ja"`.

---

## 7. Montage mobil – Tour-Bausteine (Einbau durch Projekte in `/montage` „Heute“)

### 7.1 Heute (Telefon 390 × 844)

```
┌ Montage · Heute Mo 09.11.         ● online ┐
│ ┌ MEINE TOUR ─────────────────────────────┐ │
│ │ Sprinter BZ-123 · 2/5 erledigt ▇▇░░░    │ │
│ │ [Route ↗]            [Tour abschließen] │ │
│ └─────────────────────────────────────────┘ │
│ ✓ 07:30 Abfahrt Lochau                      │
│ ◉ 08:00 Lieferung · Fam. Berger      NÄCHST │  [Navigation] [Anrufen]
│ ○ 09:30 Montage · Küche Muster          ›   │  = Montageauftrag-Karte (Projekte)
│ ○ 13:00 Lieferung · Hotel Alpenrose     ›   │
├─────────────────────────────────────────────┤
│ [ Heute ]  [ Woche ]  [ Suche ]  [ Ich ]    │  64 px + safe-area
└─────────────────────────────────────────────┘
(Beispielwerte)
```

- Daten: `tour_mobil.meine_touren(datum)`, `tour_mobil.tour(name)`; die Server Action gibt nur Touren zurück, in denen die Sitzung Fahrer oder Team ist (Leitung alle).
- **Tour-Kopfkarte:** Freigegeben → Taste „Starten · 48 210 km“ (Vorschlag = `km_ende` der letzten abgeschlossenen Tour des Fahrzeugs; ohne Vorschlag Zahlenblock) + Textlink „km ändern“ → `tour_mobil.starten`. Geplant → „Tour noch nicht freigegeben“ [Disposition anrufen] (`tel:` `absender_telefon`) [Erneut prüfen]. Unterwegs → Fortschritt, „Tour abschließen“ immer bedienbar: offen → springt zum ersten offenen Stopp (Hervorhebung 1200 ms); alle beendet → km → `tour_mobil.abschliessen` → „Tour abgeschlossen · 5 Stopps · 86 km“.
- **Tour geändert** (Polling 30 s, nur während Unterwegs/Freigegeben): Band „Tour geändert · 1 Stopp neu · Ansehen“, neue Stopps 1200 ms markiert, entfernter Stopp „Von Disposition entfernt“.
- Ohne Tour: Kopfkarte entfällt. Leer: „Heute keine Termine.“ + „Morgen (2) ›“.

### 7.2 Stopp-Karte (Lieferung, Abholung, freier Stopp)

Art, Zeitfenster, ETA, Kunde, Adresse → Navigation (`navigation_url`), Telefon → `tel:`, Lieferhinweis hervorgehoben, Lieferschein-PDF, Positionen, Bereich je Position (Hotel/Yacht), Fotos (Art-Chip vorbelegt vorher/nachher). Hinweis Zahlung (E11): „Offen laut AB: 2.340,00 € – Zahlung über Rechnung oder Kassa. Bargeld nur mit Kassenbeleg.“ **Ein Statusknopf:** offen → **Angekommen** (`stopp_status(…, "unterwegs")` setzt `ankunft`) → **Abliefern** (Lieferung) / **Abgeholt** (Abholung). Sekundär: Nicht angetroffen · Verschoben. Montage-Stopp: Karte des Montageauftrags (Projekte); deren Knopf führt den Stopp mit (Action setzt Stopp `unterwegs` bei „Losfahren“ und `erledigt` bei „Fertig/Abnahme“), bis die Kopplung in den Apps existiert (A13).

### 7.3 Abliefern-Sheet

① Positionen (Anzeige; nicht übergebene Positionen markieren) ② Unterschrift (Hochformat: Feld volle Breite 200 px; Hinweis „Quer drehen für mehr Platz“) oder Alternative-Segment (E4) + Name ③ **Fertig** → `tour_mobil.stopp_status(tour, stopp, "erledigt", notiz, unterschrift, unterschrift_name, idempotency_key)` → Lieferschein Zugestellt → Ergebnis-Karte „Zugestellt · Fam. Berger“ [Lieferbestätigung senden] (nur mit E-Mail; sonst „Papierkopie übergeben“) [Nächster Stopp]. Fehler: leere Unterschrift → „Bitte unterschreiben lassen oder Alternative wählen“.

### 7.4 Teilzustellung / Annahmevorbehalt

- **Mit `teilzustellung` (nach A7):** Stepper „zugestellt“ je Position, Rest „abgelehnt“ + Grund (Beschädigt · Falsch · Passt nicht · Kunde verweigert; Foto Pflicht bei Beschädigt), Schalter „Unter Vorbehalt angenommen“ + Text.
- **Bis dahin (Übergangsweg, Inhaber-Freigabe für G2):** Ist mindestens eine Position markiert, ersetzt „Teilweise abgeliefert“ den Knopf „Fertig“ → Stopp `verschoben` mit Notiz „Teilzustellung: übergeben … · zurück …“ + Foto, Lieferschein bleibt Übergeben, Aufgabe „Teilzustellung nachbuchen“ an Leitung (Akte zeigt rotes Band). „Unter Vorbehalt angenommen“ schreibt Text in `notiz` und erzeugt bei Beschädigung `problem_melden("Beschaedigt")`.

### 7.5 Nicht angetroffen / Verschoben

Grund-Chips (Niemand da · Zufahrt nicht möglich · Kunde verschiebt · Ware passt nicht · Sonstiges) + Notiz (Diktat) + optional Foto → `stopp_status(…, "nicht angetroffen"|"verschoben", notiz)`; Action legt Aufgabe an Disposition an. Lieferschein erscheint nach Tourabschluss unter „Zurück im Fahrzeug“.

### 7.6 Fotos, Offline, Ziele

`<input capture="environment">`, Overlay „Bitte keine Personen fotografieren“; Upload `/api/datei` → `tour_mobil.foto(…, idempotency_key)`; Warteschlange „2 Fotos werden gesendet“. Offline: Lese-Cache der Tour beim Start, Stopp-Status/Fotos/Unterschrift gepuffert mit Idempotenz-Schlüssel, Band „Offline – 2 Aktionen warten“. Kamera verweigert → „Kamera ist gesperrt. In den Einstellungen erlauben.“ + „Foto aus Mediathek“. Ziele ≥ 52 px, Sonnenmodus hohes Kontrastschema.

---

## 8. Zählmodus und Lager-Scan mobil

### 8.1 Zählmodus `/logistik/inventur/[name]/zaehlen` (iPad/Telefon, Vollbild)

Bereich wählen beim Start (Platz-Präfix, belegt-Anzeige). Großes Scanfeld; Scan → Karte (Artikel, Platz, SN, Bild; Soll nur ohne Geräteeinstellung „Soll ausblenden“) → Zahlenblock (Vorbelegung 1 bei SN-Zeilen) → `zaehlen(lagerbestand, ist)`; Stückscan-Modus (jeder Scan +1) → `zaehlen_plus(code, 1)` atomar. Rückmeldung 04 § 3.12; Differenz ≠ 0 → orange Hinweis „Differenz −1“ (Grund optional). Fortschritt „61/84“, Tab „Noch nicht gezählt“. Fund → „Als Fund erfassen“. Offline: Ist-Werte puffern (letzter Wert gewinnt); `zaehlen_plus` offline gesperrt (Text).

### 8.2 Platz zuerst (Ausstellung, Showroom-Umbau)

wie § 6.4, auch am iPad im Backoffice (`/logistik/ausstellung` „Platz ändern …“).

---

## 9. Druck

| Dokument | Print Format | Wo |
|---|---|---|
| Lieferschein (ohne Preise, Unterschriftsfeld, Bereich je Position) | PH Lieferschein Standard | Akte, Masse, Packtisch, Montage mobil, Anhang Lieferbestätigung; Sprache des Lieferscheins |
| Packliste (Entnahmeort, Paket-Nr., Kästchen) | PH Lieferschein Packliste | Akte, Packtisch `Strg+P`, Masse |
| Versandetikett | LetMeShip-PDF (privat) | Packtisch automatisch, Sendung |
| Retourenschein | PH Sendung Retourenschein | Sendung, Shop-Retoure |
| Tourenblatt | PH Tour Tourenblatt | Tour-Akte, Plantafel (Masse) |
| Speditionsauftrag | PH Speditionsauftrag Standard | Spedition-Akte, Mail-Anhang |
| Rücknahmeprotokoll | PH Warenruecknahme Protokoll | Rücknahme-Akte |
| Zählliste | PH Inventur Zaehlliste | Inventur |
| Lageretikett 62×29 | PH Lagerbestand Etikett | Bestand, Ausstellung |
| Platzetikett 62×29 | PH Lagerort Platz-Etikett | Stammdaten Lagerorte |

Pfad 05 § 10: Vorschau `/druck/[doctype]/[name]?format=`, PDF `/druck/…/pdf`, Dateien über `/api/datei` (Rechteprüfung). Kiosk: Druckprofil je Gerät; der Packtisch braucht A4 **und** Etikett – bis ph_core zwei Drucker je Gerät kann (Anfrage C1), wählt der Packtisch „Etikett“ als Gerätedrucker und A4 über das Browser-Druckpanel. Druckfehler: „Drucker ‚Etikett Packtisch‘ antwortet nicht“ [Erneut] [Als PDF öffnen].

---

## 10. Automationen und Benachrichtigungen

| Automation | Quelle | Sichtbar als |
|---|---|---|
| Tracking-Abgleich (Intervall aus Einstellungen) | `tasks.tracking_aktualisieren` | „Letzter Abgleich“, Fehlerfeld |
| Hängende Sendungen (> 7 Tage Unterwegs → Problem; > 2 Tage ohne Etikett → Aufgabe) | `tasks.haengende_sendungen_melden` | Heute zu tun, Glocke |
| Touren morgen nicht freigegeben (Mo–Fr 16:00) | `tasks.touren_morgen_pruefen` | Heute zu tun (Leitung) |
| Reservierungen ablaufen (06:30) | `lager.reservierungen_freigeben` | Bewegung „Freigabe“ |
| Wareneingang → Bestand (nur Differenz, Schaden → B-Ware gesperrt) | `ereignisse.wareneingang_aktualisiert` | Bewegungen, Tab Gesperrt |
| Retoure/Rücknahme → Bestand | `ereignisse`, `pruefung_buchen` | Bewegungen |
| Abholbereit-Mail | `abholbereit_melden` (über verzögerten Commit) | Zeitleiste; ohne E-Mail Aufgabe (Action) |
| Avis | manuell „Avis senden …“ (Automatik am Vortag nur auf Inhaber-Entscheidung, § 12.4) | Stopp „Avis gesendet“ |
| Liefermengen an AB | App nur beim Verlassen von Gepackt (nicht bei Tour, E7) | Kommentar; fehlt → Band + Aufgabe |

Kundenmails immer mit Vorschau bzw. 8 s Verzögerung; Massenergebnis nennt Empfänger ohne E-Mail.

---

## 11. Datenmapping UI → Frappe (✔ vorhanden · ◐ mit Backoffice-Prüfung · ✘ fehlt → Schalter/Aufgabe)

| UI-Funktion | Frappe | Stand |
|---|---|---|
| Start-Kennzahlen, Heute zu tun | Number Cards, `count`/`getList`, `packtisch.statistik` | ✔ |
| Lieferscheinliste/Kanban | `getList`/`getKanban PH Lieferschein` | ✔ |
| Lieferschein erzeugen | `ph_logistik.api.lieferschein_aus_auftrag`, `…_aus_bestellung`, `lager.lieferschein_aus_kommission` | ◐ Rest/Obergrenze/Dezimal in der Action (E8, E9) |
| Pack-Ansicht, Scan, Abhaken, −1, Offline-Stand | `packtisch.packansicht`, `.scan`, `.position_packen`, `.position_minus`, `.positionen_setzen` | ✔ |
| Entnahme-Bestand | `save PH Lieferschein` (Position `lagerbestand`) + `getList PH Lagerbestand` | ◐ Vorschlag in der Action; Verkaufszeitpunkt A2 |
| Pakete, Etikett, Tarife | `packtisch.pakete_speichern/pakete_vorschlagen/tarife/etikett_erzeugen` | ✔ (Mock; live nach API-Abgleich) |
| Gepackt, Übergeben, Zugestellt, Abholung | `als_gepackt`, `uebergeben`, `als_zugestellt`, `packtisch.abholung_buchen` | ✔ · ◐ Anzahlung/Bezahlt-Prüfung in der Action |
| Problem am Lieferschein | `problem_melden(grund, text, fotos)` | ✔ |
| Storno | `PH Lieferschein.stornieren` (Leitung ab Gepackt, Bestandsrückbuchung) | ✔ · ✘ AB-Rückabwicklung (A16) |
| Lieferbestätigung, Abholbereit | `lieferbestaetigung_senden`, `abholbereit_melden` | ◐ ohne E-Mail → Aufgabe (Action) |
| Teilrechnung, Produktpässe | `teilrechnung_erstellen`, `produktpaesse_erzeugen` | ◐ abhängig von Faktura/Projekte |
| Speditionsauftrag | `speditionsauftrag_anlegen`, `per_email_senden`, `bestaetigen`, `abgeholt`, `zugestellt`, `stornieren` | ✔ |
| Warenrücknahme | `warenruecknahme_anlegen`, `annehmen`, `pruefung_buchen`, `servicefall_anlegen`, `abschliessen`, `stornieren` | ✔ |
| Sendung buchen/Tracking/Storno/Retourenlabel/Problem | `PH Sendung.*`, `tasks.tracking_aktualisieren(sofort)` | ✔ |
| Plantafel | `ph_tour.plantafel(von, bis)` | ✔ |
| Stopps hinzufügen/entfernen/sortieren | `stopps_hinzufuegen`, `stopp_entfernen`, `reihenfolge_optimieren`, `save` (Reihenfolge) | ◐ explizite Liste prüft die Action |
| Freigeben, Starten, Abschließen, Abbrechen | `freigeben`, `starten`, `abschliessen`, `abbrechen` | ◐ Rolle/Status prüft die Action; ✘ Freigabe zurücknehmen (A8); ✘ Rücklieferung (A5) |
| Avis | `avis_senden(kanal, stopps)`, `tour_mobil.avis` | ✔ |
| Montage-Stopp | Stopp `art=Montage`, `montage_referenz` (Data) | ◐ Kopplung Stopp ↔ Montageauftrag in der Action (A13) |
| Tour mobil | `tour_mobil.meine_touren/tour/stopp_status/foto/lieferbestaetigung/starten/abschliessen` | ✔ · ✘ Teilzustellung (A7) |
| AB-Liefermenge bei Tour | – | ✘ A1 |
| Bestand, Umlagern (+Scan), Reservieren, Freigeben, Sperren, Ausbuchen | `PH Lagerbestand.*`, `lager.platz_scan/umlagern_scan` | ✔ · ◐ Ausbuchen-Menge in der Action |
| Kommission | `lager.kommissionsliste`, Report „PH Kommissionsware“ | ✔ |
| Bewegungen, Storno, manuell | `getList`, `stornieren`, `insert PH Lagerbewegung` | ✔ · ◐ Schreibsperre im UI (A11) |
| Inventur | `zaehlliste_erzeugen`, `starten`, `zaehlen`, `zaehlen_plus`, `position_hinzufuegen`, `freigeben`, `verwerfen` | ✔ · ◐ Vier-Augen/Bewegungs-Prüfung in der Action; ✘ Wert/Stichtag (A15) |
| Stammdaten, Berichte, Druck | `getDoc/save` Single, `getReport`, `getPdf` | ✔ |
| Anzahlung, offene Beträge | `getValue PH Auftragsbestaetigung anzahlung_soll_cent, anzahlung_ist_cent, offen_cent, ust_fall, waehrung`; `PH Bestellung bezahlt_am, offen_cent` | ◐ Prüfung in der Action; Override-Felder A5 |
| Steuernachweis, Währung am Lieferschein | – | ✘ A9 |
| Dezimalmengen | – | ✘ A4 |

---

## 12. Anfragen

### 12.1 An ph_logistik

| # | Anfrage (Fach-Nr.) | Prio | Bis dahin |
|---|---|---|---|
| A1 | Liefermenge bei **Zustellung** an AB melden, idempotent (`ab_gemeldet_am`); `starten` über `ls.uebergeben("Fahrer")`, `uebergeben` meldet nur bei Dienstleister/Spedition (P1) | 1 | Band + Aufgabe, Gate G2 |
| A2 | Verkaufsbuchung bei Zustellung/Übergabe an Dienstleister statt Gepackt; Buchungsfehler in `bestand_fehler` statt verschlucken; Entnahme-Vorschlag serverseitig (P2) | 1 | Entnahme in der Action, Fehlerband |
| A3 | Rest serverseitig inkl. offener Lieferscheine, Obergrenze je Zeile, `idempotency_key`, `wunschtermin`, `adresse{}` als Parameter (P3) | 1 | E8 |
| A4 | Float-Mengen + `einheit` in Position/Bestand/Bewegung/Inventur (P4) | 1 | E9, Gate G3 |
| A5 | Rücklieferung: nach Abbruch/Fehlversuch Lieferschein zurück auf Gepackt, `tour=None`, `zustellversuche`, Bewegung Fahrzeug → Lager; Anzahlungs-Override-Felder `zahlung_freigabe_von/grund` (P18, P5) | 1 | Abschnitt „Zurück im Fahrzeug“ + Aufgabe |
| A6 | Schreibsperre Lieferschein ab Übergeben, kein `delete` für Leitung ab ≠ Entwurf (P6) | 1 | E13 |
| A7 | Teilzustellung (`menge_zugestellt`, `menge_abgelehnt`, `ablehnungsgrund`, `annahme_vorbehalt`, `vorbehalt_text`, `stopp_status(positionen{})`, Rest-Lieferschein `rest_aus`) (P17) | 1 | § 7.4 Übergangsweg |
| A8 | Freigabe zurücknehmen; Verschieben setzt Freigabe zurück | 2 | Action gibt neu frei (Leitung) |
| A9 | `ust_fall`, `waehrung`, `nachweis_art`, `mrn`, `ausgangsvermerk_am`, `nachweis_datei`; Druck Gelangensbestätigung, CMR (P9) | 2 | Band + Aufgabe Faktura, Gate G3 |
| A10 | Versand-USt nach Steuerland der Bestellung / `ust_fall` (P10) | 2 | Gate G1 für DE-Versand |
| A11 | Lagerbewegung: gebuchte unveränderbar, Mitarbeiter nur Neuanlage, Datum-Rückdatierung nur Leitung (P11) | 1 | keine Bearbeitung im UI |
| A12 | Ausstellungsstück: Reservierung auf Kassenbeleg, Verkauf nach Zahlung, `zustand_text` (P8) | 2 | Knopf entfällt (E6) |
| A13 | Link `montageauftrag` am Stopp, Statuskopplung Stopp ↔ Montageauftrag (mit ph_projekte) | 2 | Action schreibt beide |
| A14 | Rollenprüfung in `PH Tour.freigeben/abbrechen`, `PH Inventur.verwerfen` (Laufend); `starten` nur aus Freigegeben; `stopps_hinzufuegen` prüft explizite Liste (B5b) | 1 | Action prüft |
| A15 | `PH Lagerbewegung.wert_cent`, Inventur-Stichtagsbuchung, Soll-Anpassung um Bewegungen seit Zählbeginn, Vier-Augen serverseitig (P15) | 2 | Gate G4, Prüfung in der Action |
| A16 | Storno nach Übergabe mit AB-Rückabwicklung (`lieferung_zuruecknehmen`), Sperre bei Teilrechnung (P16) | 1 | Storno ab Übergeben nicht angeboten |
| A17 | `abholbereit_melden` gibt Grund zurück und legt Aufgabe an; `benachrichtigung` (Kanal) am Lieferschein (P21) | 2 | Action prüft E-Mail vorher |
| A18 | Kommission beim Wareneingang automatisch reservieren (P20) – teilweise über `kommission` gelöst; Rest prüfen | 2 | Kommissionsansicht |
| A19 | Löschfrist Fotos (`foto_loeschen_nach_monaten`), Kontaktdaten an Carrier nur bei Bedarf (P13) | 2 | Overlay, Rechte je Tour |
| A20 | `zeitstempel_je_stopp`/`live_ansicht` als Einstellung (P14) | 2 | Schalter `zeitstempelAnzeigen` im Backoffice |
| A21 | `ausbuchen(menge=None)` nur verfügbare Menge (B5e) | 2 | Action übergibt Menge |
| A22 | Stopp-Link `retoure`/`warenruecknahme`/`servicefall`, Buchung „Abgeholt“ ins Fahrzeug (P22) | 2 | freier Stopp mit Text |
| A23 | `zolltarifnr`, `ursprungsland` je Position (P23) | 3 | – |
| A24 | Sendung: `eingangsrechnung`, `abgerechnet_cent`, `carrier_schaden_nr`, Ersatzlieferung `ersatz_fuer` (P24) | 3 | Aufgabe an Leitung |
| A25 | Bestellstatus über `versendet_melden(awb, carrier)`/`abgeholt_melden` statt direktem Setzen (Abweichung 4.1 Nr. 6) | 1 | – (Shop-Konzept) |

### 12.2 An andere Apps

| An | Anfrage |
|---|---|
| ph_faktura (F1) | `PH Auftragsbestaetigung.abrechnung` (`je Lieferung` · `nach Abnahme`); `lieferung_zuruecknehmen(lieferschein)`; Prüfung offener Lieferscheine bei AB-Storno |
| ph_shop | `PH Bestellung.ware_erhalten_am` beim letzten Lieferschein (FAGG § 11 Abs. 2), Retour-Nachweis (FAGG § 15) |
| ph_kassa | Ausstellungsstück reservieren beim Erfassen, Verkauf nach Zahlung; mobile Kassa für Montage mobil (StB) |
| ph_core (C1) | zwei Drucker je `PH Geraet` (A4 + Etikett) |
| ph_projekte | gemeinsames „Heute“, Statuskopplung Montage-Stopp, Unterschrift ohne Querformat-Zwang |

### 12.3 An Fundament

F1 Kürzel-Registry mit Abschalter und Bereichskürzel `g l`; F2 verzögerter Commit (`useVerzoegerterCommit`, `/api/undo-commit`, sendBeacon); F3 `role="grid"`-Baustein für Plantafel/Kalender; F4 `Sheet`, `Ergebniskarte`, `Unterschrift` als gemeinsame Bausteine (Logistik baut `Unterschrift` vorläufig im Bereich); F5 `bereiche.js`-Einträge § 4.0, **kein** Kanban PH Sendung; F6 KioskShell-Kopf: Bedienerwechsel `Shift+F2`, kein F5/F8-Kürzel im Kiosk, Toast-Ort je Kiosk; F7 Leitlinien 02/04/05 angleichen (Undo 8 s `⌘Z`, F-Tasten § 6.6, „‹ Übersicht“, Spring-Regel 05 § 15, Gepackt/Etikett blau in 03).

### 12.4 Offene Fragen an Inhaber und Steuerberatung (keine Annahmen im Bau)

| An | Frage | Prio | Standard bis zur Antwort |
|---|---|---|---|
| Inhaber | Anzahlung: Sperre (Leitung überschreibt) oder nur Hinweis? | 1 | Sperre (`anzahlungHart` an) |
| Inhaber | Abrechnungsart je Sparte (Küche/Bad/Einbau nach Abnahme, lose Möbel je Lieferung)? | 1 | Teilrechnung nur im `⋯` |
| Inhaber | Übergangsweg Teilzustellung (§ 7.4) für Touren vor A7 freigeben? | 1 | Touren mit AB erst nach A1/A7 |
| StB | Lieferdatum auf der Rechnung: Versand `uebergeben_am`, Eigenlieferung/Abholung `zugestellt_am`, Werklieferung Abnahme? | 1 | beide Daten angezeigt, keine Übergabe an Faktura |
| StB | Restzahlung bar beim Kunden: mobile Registrierkasse oder Beleg mit Nacherfassung? | 1 | kein Bargeld ohne Kassenbeleg |
| StB | Nachweisform Ausfuhr CH (Eigenlieferung über die Grenze), Gelangensnachweis bei Eigenlieferung DE | 2 | Aufgabe an Faktura |
| Inhaber/Datenschutz | Löschfrist Lieferfotos; Betriebsrat vorhanden (Zeitstempel je Stopp)? | 2 | Fotos bleiben, Zeitstempel aus |
| Inhaber | Avis automatisch am Vortag (Uhrzeit, Kanal Mail/SMS)? | 2 | nur manuell |
| Inhaber | Mehrfach nicht angetroffen: Lagergeld laut AGB, ab wie vielen Versuchen? | 3 | Aufgabe an Verkauf |
| Inhaber | Kartons messen (Paketprofile), LetMeShip-Testzugang | 1 | Testmodus |

---

## 13. Was hier anders ist als in klassischer Branchensoftware

Grundlage `VORBILD-SHD` (mex: Tourenplanung, Navigation, Unterlagen, Fotos, Lieferbestätigung, Unterschrift; Lagerplätze dort nicht beschrieben – „nicht beschrieben“ heißt nicht „nicht vorhanden“).

1. Paketversand mit Tarifvergleich im Packvorgang, Etikett in einem Tipp, Kosten vs. dem Kunden berechnet in derselben Ansicht.
2. Packen per Scan ohne Abschluss-Tipp; Fehlgriffe 8 s rückgängig, ohne dass etwas gebucht wurde.
3. Disposition auf einer Plantafel mit Lieferungen, Montagen, Speditionen, Fahrzeugen, Abwesenheiten – per Tipp ebenso wie per Ziehen; Auslastung vor dem Ablegen sichtbar; „Volumen unbekannt“ statt Schätzung.
4. Ausstellungsstücke und Kommissionsware als Einzelbestände mit Platz, Alter, Sperre und Reservierungsablauf; Platzwechsel per Scan.
5. Ein Login und eine Anwendung für Packtisch, Fahrer, Disposition und Büro; Bedienerwechsel per PIN; gerätegebundener Etikettendruck.
6. Belege, die sich nach Übergabe nicht mehr verändern lassen, und ein Journal ohne Löschen – auch wenn die Datenbank es technisch zuließe.
7. Avis und Lieferbestätigung in de/en/fr/it für Hotel- und Yachtkunden.

---

## 14. Bauauftrag

### 14.1 Dateien und Routen (`backoffice/`)

```
src/app/logistik/
  layout.js                         Pills nach Rechten, Testmodus-Band (keine Sitzungsprüfung im Layout)
  page.js  loading.js               Übersicht
  lieferscheine/page.js  lieferscheine/[name]/page.js
  packen/[name]/page.js             Pack-Ansicht im Backoffice (ohne Packtisch-Gerät)
  sendungen/page.js  sendungen/[name]/page.js
  touren/page.js  touren/[name]/page.js
  speditionen/page.js  speditionen/[name]/page.js
  ruecknahmen/page.js  ruecknahmen/[name]/page.js
  bestand/page.js  bestand/[name]/page.js
  ausstellung/page.js  kommission/page.js  bewegungen/page.js
  inventur/page.js  inventur/[name]/page.js  inventur/[name]/zaehlen/page.js
  stammdaten/page.js  berichte/[report]/page.js
src/app/(kiosk)/packtisch/page.js          ersetzt Platzhalter (Startseite)
src/app/(kiosk)/packtisch/[name]/page.js   Pack-Ansicht / Abholkarte
src/app/tour/page.js                       307 → /montage
src/components/Backoffice/Logistik/        (Liste 14.2)
src/lib/backoffice/logistik/
  actions.js       "use server" – alle Mutationen (14.3)
  daten.js         server-only Lesefunktionen (Heute zu tun, Kennzahlen, Plantafel, Akte-Aggregat, Packtisch)
  status.js        Anzeige-Labels und Töne je DocType (rein)
  texte.js         Leer-/Fehlertexte, Mail-Vorschau, Hinweise (rein)
  schalter.js      § 3.7
  belegsperre.js   editierbare Felder je Status (rein)
  rest.js          Restmengen über offene Lieferscheine, Dezimal-Erkennung (rein)
  entnahme.js      Bestandsvorschlag je Position (rein)
  auslastung.js    kg/Volumen je Tour, Vorschau „danach“ (rein)
  zahlung.js       Anzahlungs-/Bezahlt-Prüfung aus AB/Bestellung (rein)
  scan.js          Code-Erkennung Startseite (LS-, PH-S-, Abholcode, WE-, Bestand, Platz) (rein)
  kuerzel.js       Registrierung § 3.4/§ 6.6
src/lib/backoffice/mock/   Seed-Ergänzungen Logistik (über bestehende seed.js-Erweiterungsstelle)
tests/unit/backoffice-logistik-*.test.mjs   tests/e2e/logistik.spec.js   tests/e2e/packtisch.spec.js
```

Einträge (Fundament F5): `bereiche.js` (Navigation, DocTypes, Kanban, ROUTEN), `suche.js` (Palette: „> packen“, „> tour“, „> umlagern“, „> lieferschein“, Tracking-Nr. und Abholcode als Suchtreffer).

### 14.2 Komponenten (`components/Backoffice/Logistik/`)

| Komponente | Art | Zweck |
|---|---|---|
| `LogistikPills` | Server | Unternavigation mit Badges |
| `HeuteZuTun`, `HeuteZeile` | Server + Client | § 4.1 (auch für Zentrale) |
| `LieferscheinListe`, `LieferscheinKanban` | Client (DataTable/Kanban) | § 4.2 |
| `LieferscheinKopf`, `LieferscheinBaender`, `NaechsterSchritt` | Server/Client | § 4.3 Kopf, Bänder, Primär-Tabelle |
| `PositionenTab`, `UebergabeTab`, `FotoRaster` | Client | Akte-Tabs |
| `LieferscheinErzeugenSheet` | Client | § 5.1 |
| `ZurTourPopover`, `NeueTourPopover` | Client | § 5.2/§ 5.3 |
| `UebergebenDialog`, `ZustellungSheet`, `StornoDialog`, `AnzahlungOverride` | Client | § 5.5–5.7, E10 |
| `PacktischStart`, `PackKarte`, `AbholKarte` | Client | § 6.1/§ 6.3 |
| `PackAnsicht`, `PositionZeile`, `MengenStepper`, `ScanRueckmeldung` | Client | § 6.2 |
| `PaketEditor` | Client | Packtisch + Akte |
| `EtikettBildschirm`, `TarifKachel` | Client | § 5.4 |
| `ProblemSheet` | Client | § 5.9 |
| `LagerScanSheet` | Client | § 6.4/§ 8.2 |
| `SendungListe`, `TrackingZeitstrahl`, `ProblemKlaerenSheet` | Client | § 4.4/§ 4.5 |
| `Plantafel` (grid), `Ablage`, `TourKarte`, `AuslastungBalken`, `ZuordnenSheet`, `TourVerschiebenDialog` | Client | § 4.6 |
| `StoppListe`, `StoppZeile`, `StoppsHinzufuegenDialog`, `AvisSheet` | Client | § 4.7 |
| `TourKopfKarte`, `StoppKarte`, `AbliefernSheet`, `NichtAngetroffenSheet`, `TourGeaendertBand` | Client | § 7 (Einbau in `/montage` durch Projekte) |
| `Unterschrift` | Client | beide Ausrichtungen, Alternative-Segment (vorläufig hier, Fundament F4) |
| `SpeditionAkte`, `PackstueckTabelle`, `SpeditionBestaetigenDialog` | Client | § 4.8 |
| `RuecknahmeAkte`, `PruefungTabelle` | Client | § 4.9 |
| `BestandGruppen`, `BestandZeile`, `PlatzInline` | Client | § 4.10 |
| `UmlagernDialog`, `ReservierenDialog`, `SperrenDialog`, `AusbuchenDialog`, `BewegungDialog` | Client | § 5.8/§ 5.10 |
| `KommissionAnsicht` | Client | § 4.11 |
| `InventurAnlegenDialog`, `Zaehlliste`, `Differenzen`, `InventurFreigabeDialog`, `ZaehlModus` | Client | § 4.13/§ 5.11/§ 5.12/§ 8.1 |
| `LogistikEinstellungen`, `PaketprofilListe` | Client | § 4.14 |
| `LogistikBericht` | Server | Report-Tabelle + Chart |

Wiederverwendet: `Shell`, `KioskShell` (+ `useScanner`, `useTastenkuerzel`, `useVollbild`, `useDruck`), `Seitenkopf`, `DataTable`, `Filterleiste`, `Kanban`, `Formular`, `Kindtabelle`, `LinkFeld`, `Datumsfeld`, `WorkflowLeiste`, `Zeitleiste`, `Kennzahl`, `Charts`, `StatusBadge`, `Leer`, `Fehler`, `Bestaetigen`, `Toast`, `Segment`, `Knopf`.

### 14.3 Server Actions (`lib/backoffice/logistik/actions.js`)

Alle: `requireSession()`, Recht (`darfDoc`) und Rolle erneut prüfen, Eingaben per zod, Rückgabe `{ ok, code, message, fehler? }`, `modified` bei `save`, Idempotenz-Schlüssel bei Buchungen, keine Personendaten im Log, Belegsperre (`belegsperre.js`) vor jedem `save`.

| Action | Prüfung | Frappe |
|---|---|---|
| `lieferscheinErzeugenAction({ quelle, name, positionen, lieferart, wunschtermin, adresse, idempotency })` | Recht create; `rest.js` (Rest, ganzzahlig) | `call ph_logistik.api.lieferschein_aus_auftrag` bzw. `…_aus_bestellung` bzw. `call ph_logistik.ph_logistik.lager.lieferschein_aus_kommission`; danach `save` Adresse/Termin |
| `lieferscheinSpeichernAction({ name, werte, modified })` | Belegsperre | `save PH Lieferschein` |
| `packAnsichtLadenAction({ name })` / Lesen in `daten.js` | Rolle Logistik | `call …packtisch.packansicht` |
| `scanAction({ lieferschein, code })` | Entwurf | `call …packtisch.scan` |
| `positionStandAction({ lieferschein, stand, idempotency })` | Entwurf | `call …packtisch.positionen_setzen` |
| `positionMinusAction({ lieferschein, position })` | Entwurf | `call …packtisch.position_minus` |
| `entnahmeSetzenAction({ lieferschein, position, lagerbestand })` | Entwurf, Bestand verfügbar, nicht gesperrt | `getList PH Lagerbestand`, `save PH Lieferschein` |
| `paketeSpeichernAction({ lieferschein, pakete, versichern, wert })` | Entwurf/Gepackt | `call …packtisch.pakete_speichern` |
| `paketeVorschlagenAction({ lieferschein })` | Entwurf | `call …packtisch.pakete_vorschlagen` |
| `tarifeAction({ lieferschein, neu })` | – | `call …packtisch.tarife` |
| `etikettBuchenAction({ lieferschein, tarifId, bestaetigt })` | live → `bestaetigt` Pflicht; aktive Sendung vorher prüfen | `call …packtisch.etikett_erzeugen` |
| `gepacktAction({ lieferschein })` (nach Commit) | Entwurf, alles gepackt; Abholung ohne E-Mail → Aufgabe | `call …packtisch.als_gepackt`; `insert PH Aufgabe` |
| `uebergebenAction({ namen[], an, override? })` (nach Commit) | Gepackt; `zahlung.js`; Override nur Leitung/GF mit Grund | `getValue PH Auftragsbestaetigung …`, `runDocMethod uebergeben`, `kommentar` (Override) |
| `ausgebenAction({ lieferschein, empfaengerName, unterschrift?, alternative?, foto?, abholcode, override? })` | Abholung, bezahlt bzw. Override | `call …packtisch.abholung_buchen`, `uploadFile` |
| `zustellungAction({ lieferschein, empfaengerName, notiz })` | Übergeben; Ausfuhr/EU → Aufgabe Faktura; AB → Kommentar-Prüfung + Aufgabe (E7) | `runDocMethod als_zugestellt`, `insert PH Aufgabe` |
| `lieferscheinStornierenAction({ name, grund })` | Entwurf/Gepackt, Leitung ab Gepackt, keine Teilrechnung | `runDocMethod stopp_entfernen` (Tour), `runDocMethod stornieren` |
| `zurueckAufEntwurfAction({ name })` | Leitung, Gepackt | `workflowAction "Zurück auf Entwurf"` |
| `problemMeldenAction({ lieferschein, grund, text, fotos[] })` | – | `uploadFile`, `call …packtisch.problem_melden` |
| `lieferbestaetigungAction({ namen[] })` | Zugestellt, E-Mail vorhanden | `runDocMethod lieferbestaetigung_senden` |
| `abholbereitErneutAction({ name })` | E-Mail vorhanden, sonst Aufgabe | `runDocMethod abholbereit_melden` / `insert PH Aufgabe` |
| `teilrechnungAction({ name })` | Faktura-Recht | `runDocMethod teilrechnung_erstellen` |
| `sendungAction({ name, methode, args })` | Whitelist `buchen|tracking_aktualisieren|problem_melden|manuell_zugestellt|retourenlabel|stornieren`, Rolle je Status, live → Bestätigung | `runDocMethod` |
| `trackingAlleAction()` | Rolle Logistik | `call ph_logistik.ph_logistik.tasks.tracking_aktualisieren` (`sofort=1`) |
| `zurTourAction({ tour, lieferscheine[] })` | je Lieferschein: Eigenlieferung/Spedition, Entwurf/Gepackt, `tour` leer | `runDocMethod PH Tour stopps_hinzufuegen` |
| `ausTourAction({ tour, stopp })` | nicht beendet | `runDocMethod stopp_entfernen` |
| `tourAnlegenAction({ datum, fahrzeug, fahrer, start_zeit, lieferschein? })` | create | `insert PH Tour` (+ `stopps_hinzufuegen`) |
| `tourSpeichernAction({ name, werte, modified })` | Status Geplant/Freigegeben; Reihenfolge, Zeitfenster, Dauer, Team, Notizen | `save PH Tour` |
| `montageStoppAction({ tour, montageauftrag })` | Projekte installiert | `getDoc PH Montageauftrag`, `save PH Tour` |
| `tourVerschiebenAction({ name, datum, fahrzeug, freigeben })` | Freigegeben → nur Leitung | `setValue`, ggf. `runDocMethod freigeben` |
| `tourFreigebenAction({ name, override? })` (nach Commit) | **Leitung**, Fahrer, Stopps, Lieferscheine nicht Entwurf, Anzahlung | `runDocMethod freigeben` |
| `tourStartenAction({ name, kmStart })` | **nur Freigegeben**, Fahrer/Team oder Logistik | `call ph_logistik.ph_logistik.tour_mobil.starten` |
| `stoppStatusAction({ tour, stopp, status, notiz, unterschrift, name, alternative, foto, idempotency })` | Sitzung ist Fahrer/Team; Teilzustellung → Übergangsweg § 7.4 (Aufgabe); erledigt mit AB → E7 | `uploadFile`, `call …tour_mobil.stopp_status`, `insert PH Aufgabe` |
| `tourFotoAction({ tour, stoppNr, datei, art, idempotency })` | Fahrer/Team | `uploadFile`, `call …tour_mobil.foto` |
| `tourAbschliessenAction({ name, kmEnde })` | alle Stopps beendet | `call …tour_mobil.abschliessen` |
| `tourAbbrechenAction({ name, grund })` | **Leitung**; Aufgabe für übergebene Lieferscheine | `runDocMethod abbrechen`, `insert PH Aufgabe` |
| `reihenfolgeAction({ name, reihenfolge[] | plz })` | Geplant/Freigegeben | `save` bzw. `runDocMethod reihenfolge_optimieren` |
| `avisAction({ tour, kanal, stopps[] })` | Logistik | `runDocMethod avis_senden` |
| `tourDuplizierenAction({ name, datum })` | create | `getDoc`, `insert PH Tour` |
| `speditionAction({ name, methode, args })` | Whitelist `per_email_senden|bestaetigen|abgeholt|zugestellt|stornieren`, Rolle je Status | `runDocMethod`; `speditionsauftrag_anlegen` am Lieferschein |
| `ruecknahmeAction({ name, methode, args })` | Whitelist `annehmen|pruefung_buchen|servicefall_anlegen|abschliessen|stornieren`; Pflichtfelder je Position | `save PH Warenruecknahme`, `runDocMethod`, `workflowAction "Prüfen"` |
| `ruecknahmeAnlegenAction({ lieferschein })` | Zugestellt | `runDocMethod warenruecknahme_anlegen` |
| `bestandAction({ name, methode, args })` | Whitelist `umlagern|reservieren|freigeben|sperren|entsperren(Leitung)|ausbuchen(Leitung, menge ≤ verfuegbar)` | `runDocMethod PH Lagerbestand …` |
| `umlagernScanAction({ lagerbestand, platzCode, menge })` | – | `call ph_logistik.ph_logistik.lager.umlagern_scan` |
| `platzScanAction({ code })` | – | `call …lager.platz_scan` |
| `bestandErfassenAction({ werte })` | create; SN bei Ausstellungsstück | `insert PH Lagerbestand` |
| `bewegungBuchenAction({ art, … })` | Art-Whitelist, Grund Pflicht, ganzzahlig | `insert PH Lagerbewegung` |
| `bewegungStornierenAction({ name })` | Leitung | `runDocMethod stornieren` |
| `inventurAnlegenAction({ lagerort, datum, nurAusstellung })` | create | `insert PH Inventur`, `runDocMethod zaehlliste_erzeugen` |
| `inventurAction({ name, methode, args })` | Whitelist `zaehlliste_erzeugen|starten|zaehlen|zaehlen_plus|position_hinzufuegen|verwerfen(Laufend: Leitung)` | `runDocMethod` |
| `inventurGrundAction({ name, position, grund, bemerkung })` | Laufend | `save PH Inventur` |
| `inventurFreigebenAction({ name })` | **Leitung**, ≠ `gezaehlt_von`, alle Differenzen mit Grund, keine Bewegungen seit Zählbeginn | `getDocMitInfo`, `getList PH Lagerbewegung`, `runDocMethod freigeben` |
| `stammdatenSpeichernAction({ doctype, werte, modified })` | Leitung; Whitelist PH Lagerort/Fahrzeug/Paketprofil/Einstellungen; Testmodus aus → Bestätigung | `insert`/`save` |
| `commitAction({ token })` | Fundament F2 | führt die hinterlegte Action genau einmal aus |

### 14.4 Frappe-Aufrufe (Lesen, `daten.js`)

`getList`/`count`: PH Lieferschein (+ Position über `parent`), PH Sendung, PH Tour, PH Speditionsauftrag, PH Warenruecknahme, PH Lagerbestand, PH Lagerbewegung, PH Inventur, PH Lagerort, PH Fahrzeug, PH Paketprofil, PH Wareneingang (Sortiment), PH Montageauftrag (Projekte), PH Abwesenheit (nur maskiert über Personal), PH Aufgabe. `getKanban` PH Lieferschein, PH Tour, PH Speditionsauftrag. `getDocMitInfo` für Akten (Kommentar „Liefermengen an … gemeldet“, Statuswechsel-Zeitpunkte). `getValue` PH Auftragsbestaetigung (`anzahlung_soll_cent`, `anzahlung_ist_cent`, `offen_cent`, `ust_fall`, `waehrung`, `status`), PH Bestellung (`bezahlt_am`, `offen_cent`, `abholung_bis`). `call`: `ph_logistik.ph_logistik.packtisch.offene`, `.statistik`, `.packansicht`; `ph_logistik.ph_logistik.doctype.ph_tour.ph_tour.plantafel`; `ph_logistik.ph_logistik.tour_mobil.meine_touren`, `.tour`; `ph_logistik.ph_logistik.lager.kommissionsliste`, `.platz_scan`. `getReport`: die 8 Reports. `getPdf` für Druck. `searchLink` für Link-Felder. `getTransitions` für Workflow-Knöpfe (Kanban rückwärts, Spedition, Rücknahme). Number Cards über `count` mit identischen Filtern. Einstellungen `getDoc PH Logistik Einstellungen` (Cache 60 s).

### 14.5 Reihenfolge

| Schritt | Inhalt | Ergebnis |
|---|---|---|
| 1 | Grundlagen `status.js`, `texte.js`, `schalter.js`, `belegsperre.js`, `rest.js`, `entnahme.js`, `auslastung.js`, `zahlung.js`, `scan.js` + Unit-Tests; Mock-Seed (12 Lieferscheine in allen Status inkl. Teillieferung, Abholung ohne E-Mail, CHF-AB; 8 Sendungen inkl. Problem/TEST; 3 Touren inkl. Montage-Stopp und Fehlversuch; 2 Speditionen; 1 Rücknahme; 60 Bestände inkl. Ausstellung, Kommission, gesperrt; 1 laufende Inventur; 2 Fahrzeuge; AB mit offener Anzahlung) | reine Module grün |
| 2 | Layout/Pills, Routen, Umleitungen (`/d/…`, `/tour`), Rechte-Weichen | Navigation vollständig |
| 3 | Packtisch Start + Pack-Ansicht: Scan, Stepper, Entnahme, Automatik mit verzögertem Commit, Offline-Stand | W1, W5 |
| 4 | Paket-Editor, Etikett-Bildschirm, Gerätedruck, Fehlerfälle | W2, W3 |
| 5 | Abholung (Zahlung, Abholcode, Unterschrift/Alternative), Problem, Lager-Scan | W4, W6, W7 |
| 6 | Lieferscheine Liste/Kanban, Akte mit Bändern und Primär-Tabelle, Sheet „Lieferschein erzeugen“, Übergeben, Zustellung, Storno | W9, Belegsperre |
| 7 | Sendungen Liste/Akte, Problem klären, Tracking alle | W8, W10 |
| 8 | Plantafel (Desktop, iPad, Liste), Zuordnen-Sheet, Neue Tour, Verschieben, Freigabe; Tour-Akte mit Stopps, Avis | W11, W12 |
| 9 | Montage-Bausteine (Kopfkarte, Stopp, Abliefern, Nicht angetroffen, Fotos, Offline), Abstimmung Einbau mit Projekte | W14–W16 |
| 10 | Bestand (Gruppen, Dialoge, Inline-Platz), Ausstellung, Kommission, Bewegungen | – |
| 11 | Inventur Akte, Zählmodus, Freigabe mit Vier-Augen/Bewegungsprüfung | W13 |
| 12 | Speditionsaufträge, Warenrücknahmen | – |
| 13 | Übersicht (Heute zu tun, Kennzahlen, Auswertung), Berichte, Stammdaten, Druck | Bereichsstart |
| 14 | E2E, axe hell/dunkel, Screenshots aller Leer-/Fehlerzustände, Touch-Emulation | Abnahme G0 |
| 15 (Phase B) | Schalter einzeln aktivieren, sobald A1/A4/A5/A7/A9 geliefert sind; Livegang-Gates G1–G4 | Livegang |

### 14.6 Aufwand (Agent-Stunden, Schätzung)

| Schritt | h |
|---|---|
| 1 Grundlagen + Seed + Unit-Tests | 6 |
| 2 Navigation/Routen/Rechte | 2 |
| 3 Packtisch Start + Pack-Ansicht | 10 |
| 4 Pakete + Etikett + Druck | 7 |
| 5 Abholung, Problem, Lager-Scan | 5 |
| 6 Lieferscheine Liste/Akte/Dialoge | 9 |
| 7 Sendungen | 5 |
| 8 Plantafel + Tour-Akte + Avis | 12 |
| 9 Montage-Bausteine | 8 |
| 10 Bestand, Ausstellung, Kommission, Bewegungen | 8 |
| 11 Inventur + Zählmodus | 6 |
| 12 Spedition + Rücknahme | 6 |
| 13 Übersicht, Berichte, Stammdaten, Druck | 5 |
| 14 E2E, axe, Screenshots | 8 |
| **Phase A gesamt** | **97** |
| 15 Phase B (Schalter, Teilzustellung, Rücklieferung, Steuernachweis, Dezimal) | 10 (nach Backend) |

### 14.7 Abhängigkeiten

| Von | Was | Blockiert | Ersatz bis dahin |
|---|---|---|---|
| Fundament F2 | verzögerter Commit + Route | Gepackt, Übergeben, Freigabe, Platz inline | eigene Route `logistik/commit` im Bereich, später übergeben |
| Fundament F1/F6 | Kürzel-Registry, KioskShell-Kopf (`Shift+F2`) | Tastatur-QA | lokale Registrierung über `useTastenkuerzel` |
| Fundament F3/F4 | grid-Baustein, Sheet, Ergebniskarte, Unterschrift | Plantafel, Sheets | Bausteine im Bereich, Fundament übernimmt |
| Fundament F5 | `bereiche.js`, `suche.js` | Navigation | – |
| Projekte | Einbau „Heute“ in `/montage`, Montageauftrag-Karte | Schritt 9 Einbau | Bausteine mit Storybook-artiger Testseite im Bereich |
| Sortiment | Wareneingang-Seite | Segment Wareneingang | Link auf `/d/ph-wareneingang` |
| Faktura | Aufgaben-Empfang (E7, Steuernachweis), Teilrechnung | – | PH Aufgabe vorhanden |
| Kassa | Ausstellungsstück-Verkauf, „Zur Kassa“ bei offener Abholung | Abholung mit Restzahlung | Hinweis „an der Kassa kassieren“ |
| Personal | maskierte Abwesenheiten | Plantafel-Hinweis | ohne Abwesenheiten |
| ph_logistik A1, A5, A7 | Tour-Kopplung | Gate G2 | § 7.4, Bänder, Aufgaben |
| ph_logistik A4, A9 | Dezimal, Steuernachweis | Gate G3 | Sperre, Aufgabe |
| ph_core C1 | zwei Drucker | A4 am Packtisch | Browser-Druck |
| Inhaber/StB § 12.4 | Anzahlung, Abrechnungsart, Lieferdatum, Bargeld | Livegang | strengste Variante |

### 14.8 QA-Checkliste (Abnahme)

**Allgemein:** Primäraktion eindeutig, `⌘Enter` · Filter/Ansicht in URL, Zurück stellt wieder her · Skeleton in Zielhöhe, CLS 0 · drei Leerzustände je Liste und alle Leer-/Fehlerzustände aus § 4–§ 8 als Mock-Fall mit Screenshot hell/dunkel · Fehlertexte ohne Technikbegriffe · axe serious/critical = 0 hell und dunkel auf allen Routen § 4.0 · Desktop 1280, iPad 1024 × 768 quer, Telefon 390 × 844 · Mock-Modus vollständig.

**Klickwege und Packtisch**
1. E2E misst W1–W17 über genau den beschriebenen Weg (Mock und Testmodus); W3 zusätzlich mit Live-Simulation ≤ 3 Tipps inkl. Bestätigung.
2. Bezahlte Bestellung erscheint unter „Packen“, Antippen öffnet die Pack-Ansicht ohne Zwischenfrage; im DOM kein Text „ohne LS“, „Bezahlt ohne LS“, „Etikett offen“.
3. Eigenlieferung: letzter Scan → nach 8 s genau ein `als_gepackt`; „Rückgängig“ innerhalb 8 s → Status Entwurf, keine Bewegung, keine Mail (Mock-Protokoll); Seite schließen innerhalb 8 s → genau ein Aufruf.
4. Abholung: Abholbereit ohne E-Mail legt eine PH Aufgabe „Kunde anrufen“ an; mit E-Mail genau eine Mail.
5. Je Lieferart genau ein Element `data-primaer` in der Pack-Ansicht; kein Text „Fertig“ im Status Entwurf.
6. Scan bei vollständiger Position zeigt „bereits vollständig“; unbekannter Code `role="alert"`; Website-QR-URL erkannt; Scan im Maß-Feld wird als Scan ausgewertet.
7. Stepper `–` reduziert um eins (`position_minus`); kein Langdruck-Handler im Code.
8. Entnahme: SN-Scan setzt genau diesen Bestand; gesperrter Bestand wird nie vorgeschlagen; nach Gepackt ohne Verkaufsbewegung erscheint das rote Band.
9. Etikett: gesperrtes Profil öffnet Paketteil mit Grund, Buchen deaktiviert mit sichtbarem Text; abgelaufener Tarif → Neuabfrage + Markierung; Zeitüberschreitung → „Buchung wird geprüft“, kein zweites `etikett_erzeugen`; Druckfehler bucht nicht neu; Ergebnis-Karte ohne Timer.
10. Kiosk-Tastatur: keine Funktion auf F5/F8/F10/F11; jede Kürzel-Funktion hat eine sichtbare Taste (Liste Kürzel = Liste Tasten); `Shift+F2` Bedienerwechsel; keine Einzelbuchstaben.
11. Idle: 30-s-Band vor der Sperre; nach PIN dieselbe Pack-Ansicht; ausstehender Commit vor dem Sperrbild gesendet.
12. Offline: Abhaken gepuffert, nach Rückkehr genau ein `positionen_setzen` je Schlüssel; Etikett/Gepackt/Ausgeben gesperrt mit Text.

**Fachregeln und Recht**
13. Lieferschein erzeugen: zweiter Lauf mit offener Lieferung derselben Position wird je Zeile abgelehnt; Dezimalmenge gesperrt mit Text; Doppelklick erzeugt einen Lieferschein.
14. Belegsperre: ab Übergeben liefert jede Feldänderung außer Notiz intern/Fotos `forbidden`, auch bei manipuliertem Aufruf; kein Löschknopf für Lieferscheine und Bewegungen im DOM.
15. Storno: ab Übergeben nicht angeboten; mit Teilrechnung gesperrt mit Link; Bestätigung zählt Sendung, Bewegungen, Tour-Stopp auf; danach Lieferschein nicht mehr in der Tour.
16. Anzahlung offen (`anzahlungHart`): Freigabe, Übergeben, Ausgeben gesperrt mit Grund; Override nur Leitung/GF mit Pflichtgrund, Grund als Kommentar sichtbar.
17. Shop-Abholung ohne `bezahlt_am`: kein „An Kunde ausgeben“, stattdessen „Zur Kassa“; falscher Abholcode → Feldfehler; ohne Code nur Leitung (bei `abholcode_pflicht`).
18. Tour-Lieferung mit AB: nach „Erledigt“ ohne App-Meldung erscheint das Band „Liefermenge nicht an AB gemeldet“ und eine Aufgabe an Faktura; keine Schreibaktion auf PH Auftragsbestaetigung aus Logistik.
19. Ausfuhr/EU-steuerfrei: Band „Steuernachweis nötig“, Aufgabe an Faktura; Alternative „Abgestellt“ im Abliefern-Sheet nicht vorhanden.
20. Fremdwährung: Warenwert eines Lieferscheins zu CHF-AB wird nicht als Euro angezeigt.
21. Kein Knopf „An Kassa verkaufen“ im DOM; Ausstellungsstück-Akte zeigt den Kassa-Hinweis.
22. Tour „Starten“ nur bei Freigegeben (auch über manipulierten Aufruf); Freigeben/Abbrechen als Mitarbeiter → `forbidden`; `zurTourAction` mit Versand-Lieferschein oder Lieferschein einer anderen Tour → Fehler je Zeile.
23. Abbrechen nach Start legt Aufgabe für übergebene Lieferscheine an; Lieferscheine erscheinen unter „Zurück im Fahrzeug“.
24. Ausbuchen übergibt immer `menge ≤ verfuegbar`; reservierte Menge bleibt.
25. Inventur: Freigabe durch `gezaehlt_von` gesperrt; Differenz ohne Grund sperrt; Bewegung im Lagerort nach Zählbeginn sperrt mit Liste; ungezählte Zeilen in der Bestätigung genannt.
26. Zeitstempel je Stopp im DOM nur mit `zeitstempelAnzeigen`; Bericht „Touren Auslastung“ ohne Personenspalte; kein Polling auf der Tour-Akte, wenn sie nicht sichtbar ist.
27. Montage-Rolle sieht nur Touren, in denen sie Fahrer/Team ist (Server Action, manipulierter Aufruf → `forbidden`); Kamera-Overlay „Bitte keine Personen fotografieren“ sichtbar.
28. Mails ohne E-Mail-Adresse: Massenergebnis nennt „n ohne E-Mail (Liste)“; Lieferbestätigung ersetzt durch „Lieferschein drucken (für Kunde)“.
29. Druck: Lieferschein ohne Preise mit Bereich je Position; Lager- und Platzetikett exakt 62 × 29 mm; Tourenblatt mit allen Stopps in Reihenfolge.

**Disposition und Barrierefreiheit**
30. Touch-Emulation ohne `dragTo` und ohne Tastatur: Lieferschein einer Tour zuordnen, Stopp verschieben, Kanban-Karte verschieben – alles möglich (WCAG 2.5.7).
31. Plantafel-Screenshots 1280 × 800 (Woche) und 1024 × 768 (3 Tage), hell/dunkel: keine abgeschnittene Tour-Karte, kein horizontaler Seiten-Scroll; < 1024 px und 200 % Zoom → Liste mit Hinweis.
32. Zuordnen-Sheet zeigt Auslastung danach; Überschreitung rot mit Text, Zuordnen bleibt erlaubt.
33. Undo „Zur Tour“ → Lieferschein wieder in der Ablage „Ohne Tour“ (`stopp_entfernen`).
34. Tour-Freigabe: Undo innerhalb 8 s → kein `freigeben`-Aufruf; Verschieben einer freigegebenen Tour als Mitarbeiter gesperrt mit Grund.
35. Plantafel `role="grid"`, Pfeiltasten zwischen Zellen, Live-Region sagt Zuordnung an; Kalender-Balken tragen Kennzeichen-Text.
36. Montage mobil: Termin mit Montage-Stopp erscheint genau einmal; „Losfahren“ einmal getippt setzt Stopp und Montageauftrag; Hochformat 390 × 844: Abliefern mit Unterschrift und mit Alternative abschließbar; „Tour abschließen“ mit offenen Stopps springt zum ersten offenen Stopp.
37. Tour im Büro geändert → Band „Tour geändert“ am Telefon ≤ 30 s, neue Stopps markiert.
38. Screenreader (VoiceOver iPad): Scan erkannt/unbekannt je einmal angesagt; Tracking-Code 13 px mit Kontrast ≥ 4,5:1; Icons überall mit Text.

**Texte, Kürzel, Übersicht, Bewegung**
39. Kürzel-Inventar: kein Einzelbuchstabe löst eine Server Action ohne Dialog aus; `s a c f` haben die 02/05-Bedeutung; keine Taste je Route doppelt; Einzeltasten abschaltbar.
40. `/logistik` zeigt 4 Kennzahlen; „Probleme“ nur in Heute zu tun; Charts erst nach Aufklappen; Screenshot direkt nach Laden zeigt Endwerte (kein Hochzählen).
41. Statuston-Snapshot je DocType gegen § 3.1 (Gepackt blau, Etikett bereit blau, Zugestellt bei Abholung „Abgeholt“).
42. Animationen: Auslastungsbalken nur `transform`; Chart-Stagger 20 ms; Spring nur beim Ablegen; `prefers-reduced-motion` → keine Transforms, kein Shake.
43. DOM-Textsuche aller Routen als Leitung: kein „Uebergeben“, „Verfuegbar“, „Bestaetigt“, „Geprueft“, „Workflow“, „Kindtabelle“, „LS“ als Abkürzung allein, kein Superlativ.
44. Budgets 05 § 12: Liste 25 Zeilen < 1,2 s, Akte Kopf + erster Tab < 1,0 s, Plantafel ein Datenaufruf, Packtisch Scan → lokale Rückmeldung < 100 ms, Server < 500 ms (Mock).
45. Phase B je Schalter: Teilzustellung bucht nur zugestellte Mengen und erzeugt Rest-Lieferschein; Rücklieferung bringt Lieferschein in die Ablage mit Chip „2. Versuch“; Dezimalmenge „2,5 lfm“ wird gespeichert und angezeigt.

---

## 15. Nicht mehr enthalten (bewusst gestrichen)

Segment-Chips „Bezahlt ohne LS“, „Etikett offen“, „Touren“ am Packtisch; „‹ Fertig“ in der Pack-Ansicht; zwei Primärtasten (Etikett + Gepackt); Langdruck für Mengen; „↺“ auf 0; Assistent A12 (4 Schritte); Ergebnis-Karte mit 1,5-s-Rücksprung; F5/F8/F12-Belegung alter Art; Inline-Feld `tour` in der Lieferscheinliste; Sendungs-Kanban; Unterschrift im Desktop-Kanban; Querformat-Zwang; Tab „Tour“ in Montage mobil; „Losfahren“ mit Ankunfts-Zeitstempel; km-Pflicht-Zahlenblock bei jedem Start; „Live ansehen (30 s)“; „Speichern“ nach Stopp-Ziehen; „An Kassa verkaufen“; Primär „Bestand erfassen“; Grund-Pflicht während des Zählens; Blindzählung als Inventur-Schalter; Assistenten A6 (4 Schritte), A13 (5 Schritte), L4 (5 Schritte), L5 (4 Schritte); 7 Kennzahlen + 4 Charts am Start; Hochzählen beim Laden; Breiten-Animation; Teilrechnung als Primäraktion; Storno nach Übergabe; „Abholung übergeben“ (jetzt „An Kunde ausgeben“).

---

## 16. Änderungsprotokoll (Fassung 1 → Fassung 2, 2026-11-04)

### 16.1 UX-Pflichtänderungen (`20-kritik-ux-logistik.md` § 2)

| # | Pflicht | Umsetzung |
|---|---|---|
| 1 | Packtisch drei Bereiche, Bestellung = normale Packkarte | § 6.1; QA 2 |
| 2 | Automatik nach letztem Scan, verzögerter Commit | E1, § 6.2, § 3.3; QA 3 |
| 3 | Ein-Bildschirm-Etikett | E2, § 5.4; QA 9 |
| 4 | Eine Primärtaste je Lieferart | § 6.2; QA 5 |
| 5 | „‹ Übersicht“ | § 6.2; QA 5 |
| 6 | Kiosk-Tastenbelegung, sichtbare Tasten | § 6.6; QA 10 |
| 7 | Inline-Tour gestrichen | § 4.2, § 15 |
| 8 | „Ohne Etikett“ / „Etikett bereit“ | § 1.1, § 3.1; QA 2, 41 |
| 9 | Bereichskürzel, Einzelbuchstaben nur Dialoge | E16, § 3.4; QA 39 |
| 10 | Ein-Zeiger-Alternative | E5, § 4.6, § 4.7; QA 30 |
| 11 | Plantafel iPad/Telefon | § 4.6; QA 31 |
| 12 | Montage mobil ein „Heute“ | E3, § 7; QA 36 |
| 13 | Unterschrift ohne Ausrichtungszwang + Alternative | E4, § 7.3; QA 36 |
| 14 | Ausstellungsstück nicht vor Zahlung verkaufen | E6 (Knopf entfällt); QA 21 |
| 15 | Undo Zur Tour leert `tour` | `stopp_entfernen` (App neu); QA 33 |
| 16 | Tour-Freigabe verzögert | § 3.3; QA 34 |
| 17 | Kein Count-up beim Erstaufbau | E15, § 3.6; QA 40 |

UX-Soll (P2/P3) ebenfalls eingearbeitet: PT8 Stepper (§ 6.2), PT9 Spaltenköpfe, PT10 sticky Fuß, PT11 Scanner-Regel, PT12 kein Timer, PT13 Idle-Band, PT14 „An Kunde ausgeben“/„Abgeholt“, PT15 Ton (`tonUnbekannt`), LS4 Kopf max. 2 Kennzeichen, LS5 Ansichten-Tabs + eine Filterzeile, LS6 kein Sendungs-Kanban, LS7 Zustellung bestätigen am Desktop, LS8 Adresssperre nach Lieferart, LS9 Leerzustände der Akte-Tabs, LS10 7 Standardspalten, TO5 „Angekommen“, TO6 markierte Positionen, TO7 km-Vorschlag, TO8 „Disposition anrufen“, TO9 Springen zu offenem Stopp, TO10 Auslastungsvorschau, TO11 sofort speichern, TO12 Verschieben freigegebener Touren, TO13 Band „Tour geändert“, TO14 „Zurück im Fahrzeug“, TO15 Kennzeichen-Text, BE2 Ausbuchen nur Menü/`Shift+Entf`, BE3 Primär Umlagern, BE4 verzögerter Platzwechsel, BE5 Gruppen einzeln laden, BE6 Grund erst vor Freigabe, BE7 Geräteeinstellung Soll, BE8 Zählbereiche, BE9 Bezug AB · Bestellung, BE10 Lager-Scan im Kopf, DA2 4 Kennzahlen, DA3 Brotkrumen nur in Akten, DA4 Packen ohne Gerät, DA5 `?`-Panel, UN4 8 s/`⌘Z`, UN5 Zählliste-Rückfrage, A1–A5 Live-Regionen, grid, Reflow, Icon + Text, Tracking-Kontrast, K1–K13 Leitlinien-Abgleich (§ 3.6, § 12.3), V1–V5 Modernität (Inbox, Kartenhierarchie, kompakte Tour-Karte, Lucide-Namen, TEST nur Band + Sendung).

### 16.2 Fach-Pflichtänderungen (`21-kritik-fach-logistik.md` § 1, § 6)

| Befund/Pflicht | Umsetzung in dieser Fassung |
|---|---|
| B1 / P1 AB-Meldung bei Tour | E7: Band + Aufgabe, keine Ersatzbuchung, Gate G2, Anfrage A1; Abnahmekriterium „Fahrer meldet Liefermenge“ ersetzt durch QA 18 |
| B2 / P2 Bestand nie ausgebucht | Entnahme beim Packen (§ 6.2), Fehlerband (§ 4.3), Anfrage A2 |
| B3 / P3 Doppellieferung | E8, § 5.1; QA 13; Anfrage A3 |
| B4 / P4 Mengen abgeschnitten | E9, Gate G3, Schalter `mengenDezimal`; Anfrage A4 |
| B5a Start aus Geplant | Action prüft (QA 22); A14 |
| B5b explizite Stopp-Liste | `zurTourAction` prüft (QA 22); A14 |
| B5c Abbruch lässt Übergeben | Aufgabe + „Zurück im Fahrzeug“ (QA 23); A5 |
| B5d Fehlversuch | § 7.5, Abschnitt „Zurück im Fahrzeug“; Schalter `ruecklieferung`; A5 |
| B5e Ausbuchen mit Reservierung | Action übergibt Menge (QA 24); A21 |
| B5f / P6 Lieferschein änderbar/löschbar | E13, § 3.2 (QA 14); A6 |
| B5g / P11 Bewegung änderbar | E13, keine Bearbeitung (QA 14); A11 |
| B5h Abholbereit ohne E-Mail | Action legt Aufgabe an (QA 4); A17 |
| B5i Inventur gegen Schnappschuss | Freigabe-Sperre bei Bewegungen seit Zählbeginn (QA 25); A15 |
| P5 Anzahlung | E10, Schalter `anzahlungHart` (QA 16); A5-Felder |
| P7 Restzahlung/RKSV | E11, kein Bargeldfeld, `mobileKassa` |
| P8 Ausstellungsstück/VGG | E6; A12 |
| P9 Ausfuhr/EU, Währung | Band + Aufgabe, Warenwert-Ausblendung, Alternative „Abgestellt“ entfällt (QA 19, 20); A9 |
| P10 Versand-USt | Einstellung „Rückfall AT“, Gate G1; A10 |
| P12 FAGG | Anfrage an ph_shop (§ 12.2) |
| P13 DSGVO Fotos/Carrier | Overlay, Rechte je Tour (QA 27); A19 |
| P14 Mitarbeiterkontrolle | E14, Schalter `zeitstempelAnzeigen` (QA 26); A20 |
| P15 Inventur UGB | Vier-Augen in der Action, Gate G4 (QA 25); A15 |
| P16 Storno-Rückabwicklung | Storno nur bis Gepackt, Folgenliste, Teilrechnung-Sperre (QA 15); A16 |
| P17 Teilzustellung/Vorbehalt | § 7.4 Übergangsweg + Schalter `teilzustellung`; A7 |
| P18 Rücklieferung | wie B5c/B5d; A5 |
| P19 stopps_hinzufuegen-Filter | wie B5b |
| P20 Kommission reservieren | Kommission-Ansicht (§ 4.11) mit App-Stand `kommission`; A18 |
| P21 Kunde ohne E-Mail | Aufgabe, Druckalternative, Massenergebnis (QA 4, 28); A17 |
| P22 Stopp-Bezüge Retoure/Service | freier Stopp, Warenrücknahme-Seite (§ 4.9); A22 |
| P23 Zoll je Position | A23 |
| P24 Eingangsrechnung/Verlust | „Neu senden“ → Aufgabe; A24 |
| § 2 Teilrechnung als Primär | E12 |
| § 2 Warenwert netto/brutto | Warenwert nur Leitung/Faktura, Fremdwährung ausgeblendet; Vereinheitlichung mit A9 |
| § 3 S4 Lieferdatum | beide Daten angezeigt, StB-Frage § 12.4 |
| § 3 S11 Avis | `avis_senden` (App neu), manuell; Automatik Inhaber-Frage |
| § 3 S12 Gefahrübergang | Vorbehalt/Fotos (§ 7.4), Problem → Servicefall |
| § 5.5 CH | Text `land_ch`, Zoll-Hinweis |
| § 5.7 Hotel/Yacht | Position `bereich` (App neu) in Akte, Stopp, Druck |
| § 6.1 Konzepttext-Korrekturen 1–8 | E7, E12, § 5.1, § 7.3/7.4, § 10, § 14.8, § 4.14 |

### 16.3 Weitere Änderungen

- App-Stand 04.11. „Lückenschluss“ eingearbeitet: PH Speditionsauftrag (§ 4.8), PH Warenruecknahme (§ 4.9), Kommission/Sperrbestand/Reservierungsablauf (§ 4.10/§ 4.11), Platzetikett und Platz-Scan (§ 6.4, § 9), `positionen_setzen`, `position_minus`, `problem_melden`, serverseitiger Abholcode, Storno mit Bestandsrückbuchung, `plantafel`, ETA/Zeitfenster-Konflikt, Avis, `stopp_entfernen`, Idempotenz mobil, `zaehlen_plus`, `position_hinzufuegen`. Zugehörige Lücken aus Fassung 1 entfallen.
- Assistenten durch Sheets/Popover/Dialoge ersetzt (E17).
- Neuer Bauauftrag § 14; Abnahme § 14.8 ersetzt § 10 der Fassung 1.
