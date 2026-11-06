# 4x – QA-Bericht Bereich Service (Q3 Screenshots + Q4 Barrierefreiheit)

**Stand:** 04.11.2026 · Team QA-service (Rolle Q3 + Q4, MASTER § 5.5) · Grundlage: `10-konzept-service.md` (Fassung 3, § 1 Klickzahlen, § 10 Q-1…Q-40), MASTER § 2.I/§ 5.5/§ 6, Lounge (`art-direction/lounge.md`), Übergabe `8x-uebergabe-B-SER.md`.
**Geprüft:** laufender Dev-Server :3100 (Mock), Stand des Bereichscodes nach B-SER. Kein Bereichscode geändert.

## 1. Ergebnis in Kürze

| Prüfung | Ergebnis |
|---|---|
| Screenshot-Lauf (`shoot.mjs --nur "^/(service\|technik)"`) | 28 Routen × 3 Viewports × hell/dunkel = **168 Aufnahmen**, technische Befunde: **1** (Konsolenfehler `/service/berichte/fristen` iPad hell), 0 Überlauf, 0 Text außerhalb, 0 Fokus ohne Ring, 0 × 4xx/5xx · Dauer 2907 s |
| Sichtprüfung neben Lounge | Desktop hell/dunkel **aus einem Guss** mit dem Entwurf; iPhone/iPad-Bereichsstart mit zwei **hohen** Befunden (QS-08, QS-09) |
| axe (WCAG 2.2 AA, serious/critical) | 28 Admin-Routen + Service-Mitarbeiter + Techniker (iPhone) + 4 offene Sheets/Dialoge, je hell/dunkel: **2 Routen mit critical** (QS-02 Einsätze-Woche, QS-03 A14), alle übrigen 0 |
| Tastatur-Durchläufe | 14 Top-Aufgaben/Bedienmuster; Lücken QS-01, QS-05, QS-06, QS-07, QS-10 |
| Reflow 320 px / Fokus nicht verdeckt / Zielgröße / reduzierte Bewegung | Reflow: 2 Routen zu breit (QS-04); 2.4.11 ok; 2.5.8 ok (Auswahlkästchen 18 px nur über Abstandsausnahme); `reduce` ok |
| Abnahme nach § 5.5 Schritt 7 | **nicht erreicht**: „hoch“ = 4 (Ziel 0), „mittel“ = 9 (Ziel ≤ 3) → Polish-Fenster Q1 für Service nötig |

Spec: `backoffice/tests/e2e/a11y-service.spec.js` (Teil A axe je Route, B Sheets/Dialoge, C Tastatur/Klickzahlen, D Reflow/Fokus/Zielgröße/Bewegung). Bekannte Lücken stehen dort als `test.fail` mit Befundnummer – wird eine Lücke geschlossen, meldet Playwright „expected to fail“, dann Markierung entfernen.

Screenshots: `backoffice/qa-screenshots/q3-service-2026-11-04/` (`bericht.md`, `bericht.json`, 168 PNG) · Vergleich neben Lounge: `…/q3-service-2026-11-04/vergleich-lounge/` (5 Paare: Zentrale↔Service-Start, Anfragen↔Servicefälle dunkel, Kundenakte↔Fall-Akte, Anfragen↔Einsätze, Kundenakte↔Regress-Akte dunkel).

## 2. Stimmigkeit mit dem freigegebenen Lounge-Entwurf (Pflichtkriterium)

Neben die Lounge-Screenshots gelegt (`vergleich-lounge/`):

- **Erfüllt (Desktop/iPad quer, hell und dunkel):** warme Kalk-Fläche bzw. fast schwarze Fläche mit Schimmer; Kacheln ohne Rahmen, Radius 28, weiche Schatten; schwebende Material-Leiste links mit Tinte-Kreis aktiv; Pillen-Reiter oben mit dunkler (hell: Tinte, dunkel: helle) Aktiv-Pille; runde Symbolknöpfe rechts oben; Large Title + Kennzahlen inline mit Trennlinie + **eine** Tinte-Hauptaktion („Servicefall melden“, „Einsatz planen“, „Gutschrift erfassen“, „Nächsten Termin planen“); zwei Akzentkacheln Cognac + Salbei mit großer leichter Zahl und rundem Pfeil-Knopf; Tabelle in Kachel mit Produktbild, Status als Punkt + Wort in Material-Pille, Avatare; Segment „Liste/Kanban“ und „Woche/Kanban/Liste“; Phasenleiste mit Tinte-Knoten (Akte) im Stil der Kundenreise; Zeitleiste/Verlauf mit Symbolkreisen; Tabellenziffern. Keine VERSALIEN-Etiketten, kein dunkler Seitenblock, keine umrandeten Kästen-Raster.
- **Abweichungen:** (a) Fall-Liste ohne schwebendes Vorschau-Panel rechts (Lounge „Anfragen“ hat es; B-SER offen Nr. 7 Side-Peek); (b) native `<select>` mit Browser-Chevron in S1 (Kanal, Bezug) und Einstellungen (Standard-Priorität) statt Pillen/Segment (QS-18); (c) Telefon: Bereichsstart, Fall-Reiter und Wochenraster brechen die Lounge-Übertragung § 12 (QS-08, QS-09, QS-12, QS-13); (d) Kanban-Spalte „Erledigt“ am Rand angeschnitten (QS-20).

## 3. Befundtabelle

Schwere nach MASTER § 5.5: hoch = falsche/unlesbare Information oder WCAG-critical · mittel = Bedienweg/Darstellung deutlich beeinträchtigt · klein = Feinschliff. Viewports: D = Desktop 1440×900, iPad = 1024×768, iPh = 390×844; h/d = hell/dunkel.

| # | Route | Viewport | Schema | Schwere | Befund | Vorschlag |
|---|---|---|---|---|---|---|
| QS-08 | `/service` | iPh, iPad | h/d | **hoch** | „Jetzt dran“: rechte Spalte (Gewährleistung + Zeilenknopf) nimmt die Breite, die Textspalte kollabiert auf 1–10 Zeichen („F“, „E“, „M“, „Fe zu ur pr“); Titel, Fallnummer und nächster Schritt unlesbar. iPad: Titel auf „Famili…“ gekürzt, Text dreizeilig gequetscht | unter 640 px Zeile zweizeilig: Text volle Breite, darunter Signal + Knopf (wie Fall-Liste als Karte); iPad: Knopf unter den Text ab < 1180 px |
| QS-09 | `/service` | iPh, iPad | h/d | **hoch** | Akzentkachel „Offene Servicefälle“: Zahl 13 erscheint als „1…“ (iPh) bzw. „1“ (iPad, abgeschnitten) – **falsche Zahl lesbar**; iPad zusätzlich Bezeichnung in 5 Zeilen | Zahl nie kürzen (`text-overflow` weg, Schriftgröße per `clamp()`), Akzentkacheln auf iPad nebeneinander mit Mindestbreite oder einspaltig |
| QS-02 | `/service/einsaetze` (Woche) | D | h/d | **hoch** | axe critical `aria-required-children`/`aria-required-parent`: `role=grid`, Spaltenköpfe `columnheader` ohne umgebende `role=row`; Raster zudem ohne Roving-Fokus/Pfeiltasten (Konzept § 2.0.3) | Kopfzeile in `<div role="row">` fassen; Tastatur nach APG Grid oder `role=table` ohne Grid-Anspruch |
| QS-03 | `/service/einsaetze/neu` (A14) | D | h/d | **hoch** | axe critical `aria-allowed-attr`: Dauer-Chips „1 h/2 h/4 h“ sind `<Link>` mit `aria-pressed` | als `role=radio` in `radiogroup` (wie „Art“) oder `aria-current="true"` am Link |
| QS-12 | `/service/faelle` | iPh | h/d | mittel | Reiter-Pillen auf 1–3 Buchstaben gekürzt („M“, „Ne…“, „R… 1“, „E…“) – Filter nicht erkennbar | Lounge § 12: horizontal scrollbares Segment mit vollem Text, nicht kürzen |
| QS-13 | `/service/einsaetze` | iPh | h/d | mittel | Wochenraster am Telefon seitlich abgeschnitten (nur Mo + halber Di sichtbar, Einsatzkarten angeschnitten) | unter 640 px Tagesliste je Techniker (wie `/technik`) statt Raster |
| QS-04 | `/service`, `/service/fehlerkatalog` | 320 px | h | mittel | Reflow WCAG 1.4.10: Seite 332 bzw. 334 px breit bei 320 px Fenster | Verursacher in `a11y-service.spec.js` (Messung im Bericht); Mindestbreiten der Heute-Leiste/Kennzahlen bzw. Baumzeilen lösen |
| QS-01 | `/service/faelle`, Akte | D | – | mittel | Alle vier Service-Kürzel des Registers (`service.melden` Umschalt+M, `service.telefonat` Umschalt+T, `service.pruefen` Umschalt+E, `service.informieren` Umschalt+I) sind **an keine Seite gebunden** (Grep: IDs nur in `kuerzel/service.js`); E2E: Umschalt+M öffnet nichts. Hilfe-Overlay zeigt sie trotzdem | `useKuerzel("liste"/"akte", …)` in Fall-Liste und Akte, oder Einträge aus dem Register nehmen (keine Schein-Kürzel) |
| QS-05 | `/service/faelle/[name]` | D | – | mittel | Phasenleiste ist eine Liste ohne Knöpfe; Popover „Geprüft am … von …“ (Konzept § 3.1, Q-11 „Phasen-Popover per Tastatur“) fehlt | Punkte als `<button>` 24×24 mit Popover (Fundament) |
| QS-10 | Palette `Strg+K` | D | – | mittel | Suche „PH-SRV-2026-00013“ + Enter öffnet den **Serviceeinsatz** `/d/ph-serviceeinsatz/PH-SRE-2026-00010` statt des Falls; exakte Nummer rangiert nicht zuerst. Unter Last zeigte die Palette > 20 s „Suche läuft …“ | exakter Nummern-Treffer immer Rang 1; Treffer auf kanonische Route (`/service/einsaetze/…`) verlinken |
| QS-15 | `/service/vertraege/pflege/PFL-2026-00007` | D | h | mittel | „Geplante Termine – Vorschau aus dem Intervall“ zeigt den **überfälligen** Termin 29.10.2026 als geplant und Jahrestermine bis 2031, darunter **So 29.10.2028** | Vorschau ab heute, höchstens 2–3 Termine, Sonn-/Feiertage/Schließtage verschieben oder kennzeichnen (Frage Inhaber 120) |
| QS-16 | `/service/berichte/quote` | D | h/d | mittel | Spalte „Regress erhalten“ überall 0,00 €, obwohl `PH-REG-2026-00009` (Poliform) 900,00 € Gutschrift ausweist – Bericht und Akte widersprechen sich. Route heißt „quote“, Tabelle hat keine Quote | Bericht aus `gutschrift_betrag` speisen (Mock-Spiegel prüfen); Quote-Spalte oder Titel „Reklamationen je Marke“ auch in Navigation |
| QS-07 | S1-Schnell, S1-Vollständig | D | – | mittel | Kontakt- und Fehler-Combobox ohne `aria-activedescendant`/Options-`id`: Pfeilauswahl wird von Screenreadern nicht angesagt (WCAG 4.1.2) | `id` je Option, `aria-activedescendant` am Eingabefeld |
| QS-06 | `/service/fehlerkatalog` | D | – | klein | Baum: alle 12 Bereichsknoten `tabindex=0` – Tab läuft durch jeden Knoten (APG Tree: ein Tabstopp) | Roving tabindex |
| QS-11 | Wareneingang | D | – | klein | Klickzahl ab Zentrale **5** (Service → Ersatzteile → Reiter „Erwartet“ → Bestellung → „Wareneingang buchen“ → Buchen); Konzept-Ziel 4 setzt einen Zeilenknopf in der Liste voraus, den es nicht gibt (Konzept nennt in Klammern selbst 5) | Zeilenknopf „Wareneingang buchen“ in Reiter „Erwartet“ oder Ziel auf 5 setzen |
| QS-14 | `/service/faelle/PH-SRV-2026-00018` | D, iPh | h/d | klein | Zwei gleichlautende Knöpfe „Kulanz freigeben …“ (Kopf + Hinweisband) – eine Hauptaktion je Bildschirm verwässert; iPhone: Bandtext neben dem Knopf auf 5 Zeilen gequetscht | im Band nur Text (Knopf steht im Kopf) bzw. am Telefon Knopf unter den Text |
| QS-17 | Akte `…00018` Bezüge; Bestellung `PH-ETB-2026-00008` | D | h/d | klein | Nummer „ENTW-2026-00006“ bricht um; E-Mail „service@ezarri.beis piel.invalid“ bricht mitten im Wort (Prüfliste „kein Umbrechen von Nummern“) | `white-space: nowrap` für Nummern, `overflow-wrap:anywhere` nur für E-Mail mit Kürzung + Titel |
| QS-18 | `/service/einstellungen`, `/service/faelle/neu` | D, iPad | h/d | klein | Betragsfelder „500,00“/„1,00“: Zeichen am rechten Feldrand überlagert die letzte Ziffer; native Selects mit Browser-Chevron (Kanal, Bezug, Standard-Priorität) wirken fremd neben Lounge-Pillen | Einheit als Suffix außerhalb des Textes; Segment/Pillen bzw. gestaltetes Auswahlmenü |
| QS-19 | Einstellungen, Akte, Bereichsstart | D | h/d | klein | Rohwerte/Systembegriffe in der Oberfläche: „Pflege im Frappe-Desk durch die Verwaltung“, Vorlagennamen „PH Service …“, „Quelle backoffice“; Untertitel „12 offene Fälle · offene fälle nach dringlichkeit“ klein geschrieben (Konzept Q-35) | Texte in `service/texte.js` nachziehen, Vorlagen mit Anzeigenamen |
| QS-20 | `/service/faelle?ansicht=kanban` | D | h | klein | Spalte „Erledigt“ am rechten Rand eingeklappt und halb abgeschnitten („2 Erledigt“ hochkant) | eingeklappte Spalte vollständig im Bild oder Hinweis „→ 1 weitere Spalte“ |
| QS-21 | `/service/einsaetze` (Woche) | D | h | klein | Karten kürzen Status („Besichtigung · Nicht …“, „Unter…“) – genau die Information, die zählt; Untertitel „6 Einsätze · Techniker-Tag laut Einstellungen“ unklar | Status als eigene Pille wie „unbestätigt“; Untertitel „Arbeitszeit 08:00–17:00“ |
| QS-23 | `/service/berichte/fristen` | iPad | h | klein | Konsolenfehler „Can't perform a React state update on a component that hasn't mounted yet“ (einmalig, nicht reproduzierbar in den anderen 5 Aufnahmen) | Zustandsänderung im Render (Diagramm/Zeitraum) in `useEffect` verlegen |
| QS-24 | Fall-Liste, Bericht | D | h/d | klein | Testdaten im laufenden Mock: 3 × „Laura Muster – Naht offen“ (jede E2E-Ausführung „S1-Schnell legt Fall an“ erzeugt einen weiteren), Bericht „Ohne Marke 3“ | E2E mit eindeutigem Text und Aufräumen bzw. Mock-Reset je Lauf |
| QS-25 | `/technik`, `/technik/einsatz/…` | iPh | h/d | klein | Titel der Kopf-Pille „Technik …“ abgeschnitten; „Bedarf ans Büro melden“ wirkt gedimmt wie deaktiviert | Titel ohne Kürzung (kürzerer Text „Technik“), Nebenaktion in Text 2 statt Text 3 |
| QS-27 | `/service/berichte/*` | D | h | klein | Knopf „PDF“ deaktiviert mit „Noch nicht verfügbar – als CSV exportieren“ – Regel „nie Schein-Knöpfe“ | Knopf über Fähigkeiten-Register ausblenden |
| QS-28 | A14 | D | d | klein | Am Bezugstag werden Fenster vor der aktuellen Uhrzeit angeboten (Mock-Uhr 04.11., Aufnahme 20:46) | mit echter Uhr prüfen; vergangene Fenster ausblenden |
| QS-26 | Konzept Q-1 | – | – | Doku | Konzept Q-1: „naht“ → POL-01; laut `install.py`/`katalog.js` ist „Naht offen“ **POL-03** (POL-01 = Faltenbildung). Oberfläche richtig, Konzept falsch | Konzept korrigieren |

Zählung: **hoch 4** (QS-02, 03, 08, 09) · **mittel 9** (QS-01, 04, 05, 07, 10, 12, 13, 15, 16) · klein 13 · Doku 1.

Kein Befund (geprüft und in Ordnung): Status überall Punkt/Symbol + Wort; Dunkelmodus ohne weiße Flächen, Kontraste laut axe ok; Testband überdeckt nichts; Leerzustände gezeichnet („Keine Gewährleistung endet in den nächsten 14 Tagen.“); Beträge `1.234,50 €`, Kosten „netto“ beschriftet; Technik: genau ein Primärknopf, „Zahlung vor Ort: nur per Rechnung oder über die Kassa“, Tab-Kapsel unten wie Lounge § 12; A14 „Weiter“ erst nach Fensterwahl mit erklärendem Satz; Sprunglink erster Tabstopp; Fokus nie unter der Kopfzeile; `prefers-reduced-motion` ohne laufende Animationen > 120 ms.

## 4. Tastatur-Durchläufe und Klickzahlen (Zählweise Konzept § 1)

| Top-Aufgabe | Ziel | gemessen | Weg / Bemerkung |
|---|---|---|---|
| Heute fällige Dinge sehen | 1 | **1** ✓ | Seitenleiste „Service“; Heute-Leiste und erste „Jetzt dran“-Zeile im ersten Bildschirm (1440×900) |
| „Was ist mit meiner Reklamation?“ – Liste | 4 | **4** ✓ | Service → Servicefälle → Suche + Enter → Zeile (Tab erreicht den Fall-Link mit Fokusring) |
| „Was ist mit meiner Reklamation?“ – `Strg+K` | 2 | ✗ | Enter öffnet den Einsatz statt des Falls (QS-10) |
| Reklamation aufnehmen (S1-Schnell) | 5 ab Zentrale | **5** ✓ (Liste: 4) | „Servicefall melden“ → Kontakt (Tippen + Pfeil + Enter) → Fehler „naht“ → „Naht offen“ POL-03 erster Treffer → `Strg+Enter`; Fokus liegt beim Öffnen im Sheet, `Esc` schließt. Umschalt+M wirkungslos (QS-01) |
| Prüfen und entscheiden (S2) | 6 | Weg bis Sheet 2 ✓ | Zeilenknopf „Prüfen“ per Tab mit Fokusring, Enter öffnet `sheet-pruefen`, Entscheidung als Radiogruppe |
| Einsatz planen (A14) | 6 | Fensterwahl per Tastatur ✓ | Fenster-Knopf mit Fokusring, Enter wählt (`aria-pressed`), „Weiter“ erst danach aktiv |
| Ersatzteil-Wareneingang | 4 | **5** | QS-11 |
| Eskalierte Fälle | 3 | **3** ✓ | Service → Servicefälle → Reiter „Eskaliert“ (`?reiter=eskaliert`) |
| Akte: Reiter | – | ✓ | Navigation „Bereiche der Akte“ mit 5 Links, aktiver mit `aria-current`, Tab + Enter wechselt (URL `?tab=`) |
| Akte: Phasen-Popover | Q-11 | ✗ | QS-05 |
| Fehlerkatalog-Baum | – | Pfeiltasten ✓ / ein Tabstopp ✗ | QS-06 |
| Technik (iPhone): Primärknopf | 1 je Status | ✓ | genau ein Primärknopf, ≥ 44 px hoch, per Tab erreichbar |
| Telefonat erfassen (Dialog) | 3 | nicht geprüft | Seed zeigt am Bezugstag keine Zeile mit „Telefonat erfassen“ (Test übersprungen) |

Messwerte (Tab-Schritte, Klickzahlen) stehen als Anmerkungen `messung`/`klickzahl` im Playwright-Bericht der Spec.

## 5. Nicht abgedeckt / Grenzen

- Screenreader-Durchlauf (NVDA/VoiceOver, Q-I9) und Zoom 200 % nicht durchgeführt (keine Hilfstechnik in der Agentenumgebung) – vor G1-Service mit einer Person nachholen.
- Fähigkeiten „alle an“ nicht abnehmbar: alle elf Service-Fähigkeiten sind laut B-SER `erwartet:false` (Backend-Lücken A-S…); Lauf entspricht „alle aus“.
- Nur Chromium (Desktop-Projekt, iPhone/iPad als Viewport); WebKit-iPad nicht gelaufen. Kiosk Technik auf echtem iPhone nicht geprüft.
- Vollseiten-Screenshots zeigen fest positionierte Elemente (Tab-Kapsel, Technik-Aktionsleiste) mitten im Bild und Bilder mit `loading=lazy` teils leer – Aufnahme-Artefakt, kein Befund.
- Der Dev-Server war während des Laufs stark ausgelastet (parallele Teams; Seiten 20–90 s). Zeitüberschreitungen in einzelnen E2E-Schritten wurden durch Wiederholung bestätigt bzw. als Last eingeordnet.
- Leistungsmessung Q-37 nicht aussagekräftig unter dieser Last.
