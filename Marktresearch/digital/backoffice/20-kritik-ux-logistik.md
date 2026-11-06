# 20 – UX-/UI-Kritik Bereich „Logistik“ (Prüfung von `10-konzept-logistik.md`)

**Zweck:** Strenge Abnahme-Prüfung des Logistik-Konzepts (Packtisch, Lieferscheine, Sendungen, Touren/Plantafel, Tour mobil, Bestand, Inventur) gegen Nielsen-Heuristiken, WCAG 2.2 AA, Touch-/iPad-/Telefon-Realität und die Leitlinien 01–05. Ergebnis: Note, Befunde mit Fundstelle und konkreter Änderung, Pflichtänderungen mit Abnahmekriterium, korrigierte Wireframes, Tastenbelegung, Undo-Matrix, fehlende Leer-/Fehlerzustände, Bewegungsabgleich. Keine fachliche Prüfung der Versand-/Lagerlogik (bleibt bei 21-kritik-fach), keine Änderung an `backoffice/` oder `Backend-Import/`.
**Stand:** 2026-11-04 · Rolle: UX-/UI-Kritiker · Status: Prüfbericht, keine Inhaber-Entscheidung.
**Geprüft:** `10-konzept-logistik.md` (§0–§12 vollständig), `01-benchmark-prinzipien.md` (F, G), `02-ux-leitlinien.md` (§0, §1.4–1.5, §5–§11), `03-design-system.md` (§1.5, §6.3, §7, §8.8–8.12, §8.14, §8.18–8.19), `04-motion.md` (§1–§4), `05-informationsarchitektur.md` (§2, §3.8, §3.14, §12.5, §15); zum Abgleich `10-konzept-projekte.md` §7.1 (Montage mobil), `10-konzept-zentrale.md` (KioskShell-Kopfzeile, Bedienerwechsel), `20-kritik-ux-kassa.md` §4–§5 (Fokusmodell, Kiosk-Tasten).

---

## 0. Urteil

**Note: 6 / 10.**

Fachlich und im Datenmapping ist 10 auf Bau-Niveau: Primäraktion je Zustand (§3.1), ehrliche Lücken-Kennzeichnung, „Volumen unbekannt“ statt Schätzung, TEST-Kennzeichnung, Offline-Sperren für geldwirksame Schritte, drei Leerzustände auf den Hauptlisten. Die Oberfläche dagegen spiegelt an zu vielen Stellen die Frappe-Struktur statt der Arbeit am Tisch: Der Packtisch unterscheidet „Lieferschein“ und „Bestellung ohne Lieferschein“, die Sendung heißt im Status „Etikett“ und in der Kennzahl „Etikett offen“ (meint das Gegenteil), der Fahrer arbeitet Montage-Stopps doppelt ab (Tab „Tour“ und Tab „Montage“). Die „Etikett in einem Tipp“-Leitidee wird durch einen vierstufigen Assistenten A12 wieder eingeholt. WCAG 2.5.7 ist falsch ausgelegt (Tastatur-Kürzel statt Ein-Zeiger-Alternative), die Unterschrift erzwingt Querformat (1.3.4). Dazu kommen Kürzel-Kollisionen innerhalb des Bereichs (`u`, `o`, `s`, `a`, `f` je Seite verschieden) und mit 02/05 (`s` = Speichern, `A` = Zuweisen), F12 doppelt belegt (Gepackt hier, Bedienerwechsel in der Zentrale-Shell) und zwei Undo-Versprechen, die auf fehlenden Server-Methoden beruhen.

Nach Umsetzung der Pflichtänderungen (§2) erreichbar: 8–9. Die Substanz ist da; es fehlt die Konsequenz „Arbeitsschritt statt Datensatz“ und „eine Regel je Kürzel“.

| Dimension | Note | Kurzbegründung |
|---|---|---|
| Aufgabenfluss (Klicks, Wege) | 6 | Packen/Abholung/Tracking-Suche gut; 02-Ziele (Packen 0, Etikett 1) verfehlt; A12 als Assistent; Montage doppelt |
| Konsistenz mit 01–05 | 4 | F-Tasten, Kürzel-Buchstaben, Undo-Dauer, Count-up beim Laden, Breiten-Animation, Kennzahl-Raster, Status-Farbfolge |
| Tastatur | 5 | Viel vorhanden, aber Buchstaben mehrfach belegt, irreversible Aktionen auf Einzelbuchstaben, F5 = Browser-Neuladen |
| Touch / iPad / Telefon | 5 | Plantafel ohne iPad-Layout, Drag ohne Tipp-Alternative, Langdruck für Mengen, Querformat-Zwang |
| Leer-/Fehlerzustände | 6 | Listen gut; Akte-Tabs, Tour mobil „keine Tour“, Scanner/Drucker/Kamera fehlen, Tour-Änderung während der Fahrt fehlt |
| Undo / Rückfragen | 6 | Abhaken, Umlagern, PLZ-Sortierung gut; „Gepackt“, „Übergeben“, „Freigeben“ ohne jede Rücknahme für Mitarbeiter; zwei Undos technisch nicht gedeckt |
| Barrierefreiheit WCAG 2.2 | 5 | 2.5.7 falsch gelöst, 1.3.4, 2.2.1 Idle/Auto-Rücksprung, 1.4.1 Fahrzeugfarbe, Live-Regionen am Scan offen |
| Visuelle Modernität | 6 | Dashboard überladen (7 Kacheln + Leiste + 2 Listen + 4 Charts), dreifache Navigation, Akte-Kopf mit drei Fortschrittsleisten, 5 Chips im Kopf |
| Bewegung (04) | 7 | Scan/Erfolg/Spring nach 04; Count-up beim Erstaufbau, `width`-Animation, Auto-Rücksprung 1,5 s, Stagger-Wert abweichend |

---

## 1. Befunde

Schwere: **P1** = Pflicht vor Bau · **P2** = Soll vor Abnahme · **P3** = Kann. Fundstelle = Abschnitt in 10. Heuristik: N1 Systemstatus · N2 reale Welt/Sprache · N3 Kontrolle/Freiheit · N4 Konsistenz · N5 Fehlervermeidung · N6 Wiedererkennen · N7 Effizienz · N8 Minimalismus · N9 Fehlerbehebung · N10 Hilfe.

### 1.1 Packtisch (Kiosk)

| # | Schwere | Fundstelle | Befund | Heuristik / WCAG | Änderung |
|---|---|---|---|---|---|
| PT1 | P1 | §7.1 Startseite | Sechs Chips (Zu packen · Bezahlt ohne LS · Abholbereit · Etikett offen · Wareneingänge · Touren) und gemischte Karten. „Bezahlt ohne LS“ ist ein Frappe-Zustand, keine Arbeit: Für die Packerin ist eine bezahlte Bestellung schlicht „zu packen“. Was „Touren 1“ am Packtisch tut, ist nirgends definiert. | N2, N8 | Drei Bereiche als Segment (48 px): **Packen n** (Lieferscheine Entwurf + bezahlte Bestellungen gemischt, Karte erzeugt beim Antippen still den Lieferschein) · **Abholung n** · **Wareneingang n**. „Etikett offen“ wird Kartenzustand („Etikett fehlt“, orange Rand) innerhalb „Packen“. „Touren“ entfällt; stattdessen Kartenchip „Tour Mo 09.11.“ auf Lieferscheinen mit Tour. Wireframe §3.1. |
| PT2 | P1 | §1.1, §7.1, 02 §1.4 | 02 §1.4 verlangt „Lieferschein packen 0 Tipps + Scans“ und „Etikett 1 Tipp“; 10 plant 1 Tipp (F12) bzw. 2–3 (F4 → A12 → Enter). Abweichung ohne Begründung. | N7; Konsistenz 02 | Nach dem letzten Scan **automatisch**: Abholung/Eigenlieferung/Spedition → `als_gepackt()` als verzögerter Commit mit Undo-Toast 8 s („Gepackt · Rückgängig“), Versand → Etikett-Bildschirm öffnet sich mit vorausgewähltem Tarif, ein Tipp „Buchen“. Ziele: Packen **0**, Shop-Versand **2** (Karte, Buchen), live **3** (plus Bestätigung). |
| PT3 | P1 | §4.5 A12, §7.1 | „Etikett in einem Tipp“ (Leitidee 2) vs. Assistent A12 mit 4 Schritten (Pakete prüfen → Tarif → Buchen → Ergebnis). Im Normalfall (Pakete gültig, Empfehlung vorhanden) sind Schritt 1 und 2 reine Klickarbeit. | N7, N8 | **Ein-Bildschirm-Etikett** (Wireframe §3.3): oben Zusammenfassung Pakete (eingeklappt, „2 Pakete · 6,0 kg · versichert 289,00 €“ mit „Ändern“), Mitte Tarif-Kacheln (Empfehlung vorausgewählt), unten „Buchen“. Schrittfolge nur, wenn `versandfaehig` eine Warnung liefert (dann öffnet der Paketteil ausgeklappt mit markiertem Feld). |
| PT4 | P1 | §7.1 Pack-Ansicht | Wireframe zeigt gleichzeitig „Etikett erzeugen (F4)“ (groß) und „Gepackt (F12)“ – zwei Primäraktionen. Bei Versand setzt das Etikett „Gepackt“ ohnehin (A12 Schritt 4). | N4, N5; 02 §0.2 | Genau **eine** Primärtaste je Lieferart: Versand → „Etikett“; Abholung → „Abholbereit melden“; Eigenlieferung/Spedition → „Gepackt“. Die anderen Wege nur im `⋯` der Spalte. Taste ist bis zum letzten Scan sekundär (Rand) und wird dann primär (Farbwechsel 160 ms, 04 §3.12). |
| PT5 | P1 | §7.1 Pack-Ansicht Kopf, 02 §11.3 | Rückweg heißt „‹ Fertig“, während der Lieferschein noch Entwurf ist. Am Packtisch bedeutet „Fertig“ „fertig gepackt“ – wer antippt, glaubt abgeschlossen zu haben; der Lieferschein bleibt liegen. | N2, N5 | Packtisch: „‹ Übersicht“. 02 §11.3 ergänzen: „‹ Fertig“ nur, wo der Rückweg tatsächlich nichts offen lässt (Ergebnis-Karte), sonst „‹ Übersicht“. |
| PT6 | P1 | §7.1 Tastatur, §12 | F-Tasten-Entscheidung an den Inhaber delegiert („Inhaber festlegen“). Der Inhaber tippt keine F-Tasten; das ist eine Frage der Shell-Konsistenz. Zusätzlich: **F5** ist Browser-Neuladen (fängt nur bei Seitenfokus; nach geöffnetem PDF-Tab/Druckdialog lädt F5 die Seite und verwirft den debounced Paketstand); **F12** ist in der Zentrale-Shell Bedienerwechsel (`10-konzept-zentrale` Kopfzeile) und hier „Gepackt“; **F8** fokussiert laut 03 §8.12 den jüngsten Toast und ist hier „Problem“. | N4, N5 | Belegung §5 dieser Datei; Bedienerwechsel shell-weit `Shift+F2` (wie Kassa-Kritik §5), F12 = Abschluss-Primär in jedem Kiosk, kein F5, Toast-Fokus-Kürzel entfällt im Kiosk. In 02 §9.5, 05 §3.14 und Zentrale-Kopfzeile nachziehen (Anfrage an UX-Lead, nicht Inhaber). |
| PT7 | P1 | §7.1 Tastatur | Funktionen ohne sichtbare Taste: „F3 Nächster Lieferschein“ und „F6 Paket abschließen“ erscheinen nur in der Legende, nicht als Taste. iPad-Tastaturen haben F-Tasten nur über Fn/Globus. | N6; 01 F5 („am Bildschirm angezeigt“) | Jede Kürzel-Funktion hat eine Taste: „Nächster ›“ rechts im Kopf der Pack-Ansicht, „Paket schließen“ im Paket-Kopf. Legende nur bei erkannter Tastatur (`data-tastatur="ja"`, wie Kassa-Kritik L7). |
| PT8 | P2 | §7.1 Positionszeile | Menge > 1 per **Langdruck 400 ms** → Zahlenblock: unsichtbare Geste, mit Handschuhen unzuverlässig. „↺“ setzt auf 0 statt −1: bei 6 Stühlen und einem Fehlscan sind 5 Scans neu nötig. | N6, N7, N3 | Zeile bei Menge > 1: Stepper `[–] 2/6 [+]` (je 48 × 48) und Taste „Alle“; `–` ersetzt „↺“ (Client: `position_zuruecksetzen` + `position_packen(n−1)` bis `position_minus` existiert). Langdruck entfällt. |
| PT9 | P2 | §7.1 Spaltenköpfe | Wireframe „POSITIONEN (7/12)“ und „PAKETE & VERSAND (5/12)“: Rasterbreiten sehen aus wie Zählerstände („7 von 12 gepackt“). Ein Bau-Agent übernimmt sie als Text. | N2 (redaktionell) | Köpfe „Positionen 1/2 gepackt“, „Pakete 2“; Rasterangabe nur in der Beschreibung. |
| PT10 | P2 | §7.1 rechte Spalte | Ab drei Paketen schiebt der Paket-Editor die Primärtaste unter den sichtbaren Bereich (Spalte 5/12, 820 px Höhe). | N1; WCAG 2.4.11 | Fußbereich der rechten Spalte `position: sticky` (Primärtaste + `⋯`), Paketliste scrollt darüber, `scroll-margin-block-end` = Fußhöhe. |
| PT11 | P2 | §7.1, 02 §9.5 | Scanner-Regel unklar: 02 sagt „nie in Textfelder außer `data-scan="ja"`“, 10 setzt `data-scan="ja"` am Gewichtsfeld (Waage). Was passiert, wenn der Fokus im Maß-Feld steht und ein Artikel gescannt wird? | N5 | Packtisch: Scanner global (Opt-out wie Kassa); Ausnahme `data-scan="feld"` (Gewicht: Zahl landet im Feld), `data-scan="nein"` (Problem-Text, Name bei Abholung). Artikel-Code im Maß-Feld → wird als Scan ausgewertet, Feldinhalt bleibt. |
| PT12 | P2 | §7.1 Etikett | Ergebnis-Karte „1,5 s, dann zurück zur Startseite“: zu kurz, um Tracking-Nr. zu lesen oder „Erneut drucken“ zu treffen; Zeitlimit ohne Einstellmöglichkeit. | N3; WCAG 2.2.1; 04 §3.13 (Karte bleibt) | Karte bleibt, bis nächster Scan, Tipp „Nächster ›“ oder F3. Fokus auf „Nächster“. Kein Timer. |
| PT13 | P2 | §7.1 | Idle 15 min → Sperrbild ohne angekündigten Countdown; mitten im Packen (Kartons falten) realistisch. | WCAG 2.2.1; 02 §10 | 30-s-Band „Sperrt in 30 s · Weiter“ (wie Zentrale), Pack-Ansicht bleibt nach PIN erhalten. |
| PT14 | P2 | §7.1 Abholung | Knopf „Übergeben“ führt zum Status **Zugestellt**, während „Übergeben“ sonst der Status vor Zugestellt ist (Carrier/Fahrer). | N2, N4 | Knopftext „An Kunde ausgeben“; Erfolgsmoment „Ausgegeben an Fam. Moser“. Status-Anzeige „Abgeholt“ für Zugestellt bei Lieferart Abholung (Anzeige-Label, App-Wert bleibt). |
| PT15 | P3 | §7.1, §12 | Ton Standard „aus“. Der Blick ist am Artikel (04 §3.12); der Scanner piept beim Lesen, nicht beim Treffer. | N1 | Am Packtisch Standard „an“ nur für „unbekannt“ (tiefer Ton, 2 × 60 ms), „erkannt“ ohne Ton. Einstellung je Gerät. Entscheidung Leitung Logistik, nicht Inhaber. |

### 1.2 Lieferscheine, Sendungen (Listen, Akten)

| # | Schwere | Fundstelle | Befund | Heuristik / WCAG | Änderung |
|---|---|---|---|---|---|
| LS1 | P1 | §2.2 Inline | Inline-Feld `tour` setzt den Link **ohne** Stopp und fragt danach „Als Stopp hinzufügen?“. Die UI erzeugt absichtlich einen halben Zustand (Lieferschein „in Tour“, Fahrer sieht ihn nicht). | N5 | Inline-`tour` streichen. Einziger Weg: „Zur Tour …“ (Popover, ruft `stopps_hinzufuegen`). Spalte Tour bleibt Anzeige mit Link. |
| LS2 | P1 | §2.3, §2.0, §5 | Sendungsstatus „Etikett“ (= Etikett liegt vor) und Kennzahl/Chip „Etikett offen“ (= Status Angelegt, Etikett fehlt) widersprechen sich sprachlich; dazu Heute-Leiste „ohne Etikett“. Drei Wörter für zwei Zustände. | N2, N4 | Anzeige-Labels (App-Werte bleiben): Angelegt → „Ohne Etikett“, Etikett → „Etikett bereit“. Kennzahl „Ohne Etikett n“. Gilt in Liste, Kanban, Packtisch-Karte, Heute-Leiste. |
| LS3 | P1 | §3.1, §3.3, §2.2 Kürzel | Kürzel kollidieren: `s` = Tour starten (Tour-Akte) vs. 05 T5 `s` = Speichern; `a` = Ausbuchen (Bestand) vs. 02 §9.2 `A` = Zuweisen; `c` = Tracking-Nr. kopieren vs. 02 `C` = Kommentar; `f` = Freigeben (Plantafel, Tour-Akte) / Reservierung freigeben (Bestand) vs. 05 T2 `f` = Filter; `u` = Übergeben / Umlagern / Tracking aktualisieren; `o` = am Packtisch öffnen / Nach PLZ sortieren; `t` = Zur Tour / Heute (Plantafel). | N4, N6; 02 §9 | Bereichs-Kürzel aus §5.2 dieser Datei übernehmen; Regel: **Einzelbuchstaben öffnen nur Dialoge/Popover/Sheets, sie lösen nie eine Buchung, Freigabe oder Statusänderung direkt aus.** Buchstaben aus 02/05 behalten ihre Bedeutung bereichsübergreifend. |
| LS4 | P2 | §3.1 Kopf | Akte-Kopf: Titel + Status + bis zu 4 Chips (Teil, Zerbrechlich, Versichert, TEST) + Phasenleiste + Vorgangsleiste Projekt + im Tab Packstand-Balken = drei Fortschrittsanzeigen untereinander, ≥ 3 Zeilen vor dem Inhalt. 03 §8.9: max. 2 Badges nebeneinander. | N8 | Kopf: Titel, Status, max. 2 Kennzeichen (Priorität TEST > Zerbrechlich; Rest als „+2“ mit Popover). Phasenleiste und Packstand verschmelzen: Phase „Entwurf“ zeigt Unterzeile „8/14 gepackt“. Vorgangsleiste Projekt nur als eine Zeile „Projekt PH-PRJ-26-0009 · Phase Lieferung ›“ in Bezüge, nicht als zweite Leiste. |
| LS5 | P2 | §2.2, §2.3 Filterleiste | Zwei Zeilen mit bis zu 9 Filtersteuerelementen + Statuschips; gespeicherte Ansichten nur erwähnt. Wirkt wie Desk-Formular, nicht wie Linear/Shopify. | N8 | Gespeicherte Ansichten als Tabs über der Tabelle („Heute zu packen · Ohne Tour · Abholbereit · Alle“), darunter **eine** Zeile: Statuschips + „Filter +“ (Popover, gewählte Filter als Chips) + Suche. Wireframe §3.6. |
| LS6 | P2 | §2.3 Kanban | Sendungs-Kanban, in dem Ziehen fast überall gesperrt ist: Karten sehen greifbar aus, verhalten sich aber wie Liste. | N4, N5 | Kein Sendungs-Kanban (Anfrage an Fundament streichen). Liste mit Statuschips genügt; „Problem melden“/„Manuell zugestellt“ in Zeilenmenü. |
| LS7 | P2 | §2.2 Kanban | Ziehen nach „Zugestellt“ am Desktop öffnet ein Unterschrift-Sheet – im Büro unterschreibt niemand. | N2 | Desktop-Sheet „Zustellung bestätigen“: Datum, Empfangen von (optional), Notiz; Unterschrift nur auf Touch-Geräten angeboten. |
| LS8 | P2 | §3.1 Tab Übersicht | Empfängeradresse nach dem Packen gesperrt mit „nur in der Sendung ändern“ – bei Eigenlieferung/Spedition gibt es keine Sendung → Adresse ist gar nicht mehr änderbar. | N3, N9 | Sperrhinweis nach Lieferart: Versand → „in der Sendung ändern“ (Link), Eigenlieferung/Spedition → bleibt inline änderbar bis „Übergeben“, mit Hinweis „Tour PH-TOUR-… wird aktualisiert“. |
| LS9 | P2 | §3.1, §3.2 Leer | Leerzustände der Akte-Tabs fehlen: Pakete (keine), Sendungen (keine), Fotos (keine), Verlauf, Tracking-Zeitstrahl ohne Ereignis. | N1; 02 §7.1 | Texte §6 dieser Datei. |
| LS10 | P3 | §2.2 Spalten | 12 Spalten am Desktop; „Quelle“ zeigt `PH-S-…-0012` gekürzt mitten im Text – nicht kopierbar, nicht lesbar. | N8 | Standardspalten 7 (Nummer, Kunde/Ort, Lieferart, Wunsch, Tour, Packstand, Status); Rest über Spaltenwahl. Nummern nie mittig kürzen, sondern Spalte `whitespace-nowrap` (QA-Basis #8). |

### 1.3 Touren, Plantafel, Tour mobil

| # | Schwere | Fundstelle | Befund | Heuristik / WCAG | Änderung |
|---|---|---|---|---|---|
| TO1 | P1 | §2.4, §3.3, §10.4 | WCAG 2.5.7 (Ziehbewegungen) verlangt eine **Ein-Zeiger-Alternative ohne Ziehen**; 10 bietet `m` bzw. `Alt+↑/↓` – das ist Tastatur, nicht Zeiger. Am iPad (Leitung, §1.3) ohne Tastatur gibt es keinen Weg außer Ziehen. | WCAG 2.5.7; 02 §11.2 | Plantafel: Tipp auf Karte → Sheet „Zuordnen“ (Touren der Woche als Kacheln mit Auslastung + „Neue Tour hier …“). Stopp-Liste: je Zeile Tasten `↑` `↓` (44 px) und Zeilenmenü „Verschieben an Position …“. Kürzel `m`/`Alt+↑↓` bleiben zusätzlich. |
| TO2 | P1 | §2.4 | Plantafel nur für Desktop gezeichnet: Ablage + 7 Tage bei 1024 px ≈ 100 px je Tag; die Tour-Karte (6 Zeilen) passt nicht. Leitung arbeitet laut §1.3 auch am iPad. | N7; 02 §11.1 | iPad quer: Zeitraum „3 Tage“ (Segment `Woche · 3 Tage · Tag`), Ablage als einklappbare Spalte 280 px (Knopf „Ohne Tour n“), Tour-Karte kompakt 3 Zeilen (Nummer+Status, Fahrer, Stopps+Auslastung). iPad hoch/Telefon: nur Liste + „Tag“. Wireframe §3.4. |
| TO3 | P1 | §7.2, `10-konzept-projekte` §7.1 | Montage doppelt: Tour-Stopp `art=Montage` hat eigenen Statusknopf („Losfahren“ → „Montage öffnen“ → „Stopp erledigt“ erst nach Abnahme), und der Montageauftrag hat im Tab „Montage“ eigenes „Losfahren → Beginnen → Fertig“. Monteur tippt „Losfahren“ zweimal, sieht denselben Termin in zwei Listen; 10 zeigt Tableiste „Montage | Tour | Suche | Ich“, Projekte zeigt keine Tableiste, sondern „Heute / Morgen / Woche“. | N4, N6, N7 | **Ein** Startbildschirm „Heute“ im Arbeitsplatz Montage mobil: chronologische Liste aus Tour-Stopps und Montageaufträgen; ein Montage-Stopp **ist** die Montageauftrag-Karte (Projekte §7.1), deren Zustandsknopf den Stopp mitführt (Client schreibt beide, bis die Kopplung im Server existiert). Tableiste einheitlich `Heute · Woche · Suche · Ich`; Tour-Kopf (Fahrzeug, km, „Tour abschließen“) als feste Karte oben in „Heute“, wenn der Benutzer Fahrer einer Tour ist. Wireframe §3.5. Abstimmung mit Projekte-Agent. |
| TO4 | P1 | §7.2 Abliefern, 02 §11.3 | „Unterschrift (Querformat erzwingen)“ verletzt WCAG 1.3.4 (Ausrichtung nicht erzwingen, wenn nicht wesentlich); die Unterschrift selbst ist eine Ziehbewegung ohne Alternative (2.5.7) – Kunden mit Tremor, Kunde nicht anwesend (Hotel: Rezeption). | WCAG 1.3.4, 2.5.7 | Unterschriftfeld in beiden Ausrichtungen (Hochformat: Feld volle Breite, 200 px hoch; Hinweis „Quer drehen für mehr Platz“ statt Sperre). Alternative Segment „Unterschrift · Name bestätigt · Abgestellt laut Absprache“ (die letzten beiden mit Pflicht-Foto, Text in `notiz`). 02 §11.3 und Projekte §7.1 ebenso ändern. |
| TO5 | P2 | §7.2 Stopp-Karte | Knopf „Losfahren“ setzt laut App `ankunft` – die Beschriftung speichert das Gegenteil dessen, was sie sagt. Live-Ansicht der Disposition zeigt dann „angekommen“ bei Abfahrt. | N1, N2 | Bis getrennte Zeitpunkte existieren: Knopf „Angekommen“ (setzt `unterwegs` + `ankunft`); Navigation-Taste ist separat. Danach Folge „Angekommen → Abliefern“. |
| TO6 | P2 | §7.2 Abliefern ① | Positionen abhaken „rein lokal“ – Haken, die nach dem Absenden verschwinden, täuschen eine Prüfung vor. | N1, N5 | Entweder weglassen, oder: nicht abgehakte Positionen werden beim „Fertig“ automatisch als Notiz „Nicht übergeben: Stuhl … (1)“ an den Stopp geschrieben und erscheinen als Hinweis-Chip in der Tour-Akte. Empfehlung: zweite Variante. |
| TO7 | P2 | §7.2 „Tour starten“ | km-Pflicht vor Abfahrt: Zahlenblock jedes Mal, Vorschlag nur aus letzter Tour. | N7 | Eine Taste „Starten · 48 210 km“ (Vorschlag sichtbar) + „km ändern“ als Textlink; ohne Vorschlag Zahlenblock. |
| TO8 | P2 | §7.2 | Tour nicht freigegeben → „bitte Disposition anrufen“ als Text: Sackgasse. | N9 | Taste „Disposition anrufen“ (`tel:` aus Einstellungen) direkt im Hinweis; zweite Taste „Erneut prüfen“. |
| TO9 | P2 | §7.2 | „Tour abschließen (2 offen)“ deaktiviert; Tipp darauf tut nichts. | N9; 02 §8 | Taste bleibt bedienbar, Tipp springt zum ersten offenen Stopp und markiert ihn (1200 ms Hervorhebung, 04 §3.3). |
| TO10 | P2 | §2.4 Ziehen | Auslastung erst nach dem Ablegen sichtbar (rot); bei Überladung muss zurückgezogen werden. | N5 | Während des Ziehens über einer Tour-Karte: Vorschau „+120 kg → 532 / 1 100 kg“ in der Karte; bei > 100 % Rand `warning` und Text „Zuladung überschritten“ – Ablegen erlaubt, aber vorher sichtbar. |
| TO11 | P2 | §3.3 Stopps | „Speichern setzt `reihenfolge`“: Ziehen in der Stopp-Liste braucht einen Speichern-Schritt, Rest der App speichert sofort mit Undo. | N4 | Sofort speichern nach jedem Verschieben, Toast „Stopp 4 an Position 2 · Rückgängig“ 8 s. |
| TO12 | P2 | §2.4, §4.1 | Tour verschoben, Freigabe bleibt stehen (Lücke); UI zeigt nur einen Hinweistext. Fahrer sieht eine „freigegebene“ Tour am falschen Tag. | N1, N5 | Beim Verschieben einer freigegebenen Tour Dialog „Tour auf Di 10.11. verschieben? Freigabe muss erneut erteilt werden.“ – Leitung: „Verschieben und freigeben“, Mitarbeiter: Verschieben gesperrt mit Grund „Freigegebene Touren verschiebt die Leitung“. |
| TO13 | P2 | §7.2 | Tour wird während der Fahrt im Büro geändert (Stopp hinzugefügt/entfernt) – kein Zustand am Telefon definiert. | N1 | Band oben „Tour geändert · 1 Stopp neu · Ansehen“ (Polling 30 s), neue Stopps 1200 ms markiert; entfernter Stopp mit Text „Von Disposition entfernt“. |
| TO14 | P2 | §7.2 Nicht angetroffen | Lieferschein bleibt „Übergeben“, kein Rückfluss in die Plantafel (in §8 nur als Vorschlag). | N1 | Plantafel-Ablage bekommt Abschnitt „Zurück im Fahrzeug n“ (Stopps `nicht angetroffen`/`verschoben` aus abgeschlossenen Touren, clientseitig), Heute-Leiste Chip „2 Lieferungen nicht zugestellt“. |
| TO15 | P3 | §2.4 Kalender | „Farbe Fahrzeug“ als einzige Kennung der Tourbalken. | WCAG 1.4.1 | Balken mit Kennzeichen-Text („BZ-123“), Farbe zusätzlich. |

### 1.4 Bestand, Ausstellung, Inventur

| # | Schwere | Fundstelle | Befund | Heuristik / WCAG | Änderung |
|---|---|---|---|---|---|
| BE1 | P1 | §3.4, §2.5 `k` | „An Kassa verkaufen“ bucht den Verkauf **vor** der Zahlung (10 benennt es als Risiko, baut es aber so). Bricht der Kunde ab, ist das Ausstellungsstück „Verkauft“, ohne Undo für Mitarbeiter. | N3, N5 | Bis der Server umgestellt ist: UI ruft `reservieren(bezug_doctype="PH Kassenbeleg"…)` bzw. Reservierung mit Bezug „Kassa“ und übergibt an Kassa; den Verkauf bucht die Kassa nach Zahlung. Geht das nicht, Knopf **nicht bauen** und Verkauf nur aus der Kassa (Artikel scannen). Kein Zwischenweg mit „gebucht vor bezahlt“. |
| BE2 | P1 | §2.5 Zeilenaktionen | `a` Ausbuchen auf Einzelbuchstabe in einer Liste, in der 02 `A` = Zuweisen ist; nicht umkehrbar außer Storno durch Leitung. | N4, N5 | Ausbuchen nur über Zeilenmenü `⋯` (rot, unten), Kürzel `Shift+Entf` öffnet den Dialog; Grund-Chip Pflicht bleibt. |
| BE3 | P2 | §2.5 Kopf | Primäraktion „Bestand erfassen“, während der Dialog selbst sagt „bitte über den Wareneingang buchen“. Die Hauptsache der Seite ist ein Ausnahmeweg. | N5; 02 §0.2 | Primär „Umlagern (Scan)“ bzw. „Wareneingang buchen“ (Link ph_sortiment); „Bestand erfassen“ ins `⋯` mit Hinweis „Nur für Erstanlage ohne Bestellung“. |
| BE4 | P2 | §2.5 Inline `platz` | Inline-Platzwechsel bucht eine Umlagerung; Undo bucht eine zweite. Ein vertippter Platz erzeugt zwei Journal-Zeilen ohne Sachgrund. | N8; 04 §3.6 Variante A | Verzögerter Commit (04 §3.6 Variante A): Platz wechselt optisch sofort, Umlagerung wird erst nach Ablauf des Undo-Balkens gebucht; Undo verwirft lokal. Zelle zeigt beim Bearbeiten Hinweis „Erzeugt Umlagerung“. |
| BE5 | P2 | §2.5 Gruppierung | Gruppierung nach Lagerort plus Server-Paging (25) ist unklar: Stehen Gruppensummen über alle Seiten? Zeigt Seite 2 die Gruppe „Lager“ ab Zeile 26? | N1 (unklar) | Gruppierte Ansicht lädt je Gruppe eigenständig (Kopf mit Summe aus Report „PH Bestandsliste“, Inhalt 25 Zeilen + „Weitere 25“), kein globales Paging. Ungruppiert = normales T2-Paging. |
| BE6 | P2 | §3.5, §7.3 | Grund-Pflicht **während** des Zählens unterbricht den Zählfluss bei jeder Differenz. | N7 | Beim Zählen nur Ist; Grund im Tab „Differenzen“ vor der Freigabe Pflicht (Freigeben gesperrt mit „3 Differenzen ohne Grund · Zeigen“). Chips im Zählmodus optional. |
| BE7 | P2 | §3.5 Blindzählung | Schalter „nur UI, nicht gespeichert“: Zweiter Zähler am anderen Gerät sieht Soll. Inkonsistente Wirkung je Gerät. | N4, N1 | Bis Feld existiert: Schalter weglassen oder als Geräteeinstellung beschriften („Auf diesem Gerät Soll ausblenden“). |
| BE8 | P2 | §7.3 | Mehrere Zähler, Überschreiben bei gleichem Bestand – nur als Lücke notiert, UI zeigt nichts. | N1, N5 | Platzbereich bei Start wählen; Zählmodus zeigt „Bereich A-* · zählt Lena M.“; andere Geräte sehen den Bereich als belegt (Kommentar/ToDo-basiert bis Methode existiert). |
| BE9 | P3 | §2.5 Reservieren | „Bezug-Typ Segment AB/Bestellung/Projekt?“ – Fragezeichen im Konzept. | redaktionell | Klären und festschreiben (Vorschlag: AB · Bestellung). |
| BE10 | P2 | §7.4 | Lager-Scan als „Tab Lager“ der Packtisch-Shell – die Startseite §7.1 hat keine Tabs. | N4 (unklar) | Als dritter Bereich im Segment der Startseite (PT1) „Lager“ oder als Taste „Lager-Scan“ in der Kopfzeile; einmal festlegen. |

### 1.5 Bereichsstart, Dashboard, Navigation

| # | Schwere | Fundstelle | Befund | Heuristik / WCAG | Änderung |
|---|---|---|---|---|---|
| DA1 | P1 | §2.1 | Zahlen „zählen beim ersten Laden hoch (04 §3.7, 400 ms)“ – 04 P10 und §3.7 verbieten genau das beim Erstaufbau. | Konsistenz 04 | Kein Hochzählen beim Laden; nur bei Änderung nach Mount (Polling/`router.refresh`). |
| DA2 | P2 | §2.1, §5 | Sieben Kennzahlen in einer Reihe (Wireframe), zehn in §5; 03 §8.14: max. 8 je Startseite, 4 je Reihe ab 1280 px. Heute-Leiste und Kennzahlen doppeln sich („2 Probleme“ in beiden, „ohne Etikett“ / „Etikett offen“). Vier Charts auf einer Arbeitsseite für Packer. | N8; 03 §8.14 | Startseite: Heute-Leiste (Ausnahmen) → 4 Kennzahlen (Zu packen · Ohne Etikett · Unterwegs · Touren heute) → zwei Listen (Zu packen, Touren der Woche) → Charts eingeklappt unter „Auswertung“ (Abschnitt `<details>`, Zustand gemerkt) bzw. in Berichte. Probleme nur in der Heute-Leiste (rot), nicht doppelt. |
| DA3 | P2 | §2.0, §2.1 | Dreifache Navigation auf jeder Seite: Brotkrumen „Zentrale › Logistik“, Seitentitel, Unternavigations-Pills. Linear/Stripe zeigen Brotkrumen nur in der Tiefe. | N8 | Auf Bereichsebene (Liste, Start) keine Brotkrumen; Pills + Titel. Brotkrumen nur in Akten. Abstimmung mit 05 §1 (gilt für alle Bereiche). |
| DA4 | P2 | §2.0 „Zum Packtisch“ | Auf dem Desktop „als neues Fenster“: Ein Kiosk ohne Packtisch-Gerät hat kein Druckerprofil (`PH Geraet.drucker`); unklar, wohin das Etikett geht. | N1 (unklar) | Ohne registriertes Packtisch-Gerät öffnet „Zum Packtisch“ die Pack-Ansicht im Backoffice (gleiche Komponente, Druck über Browser-Druckpanel, Band „Kein Packtisch-Gerät – Druck über Browser“). |
| DA5 | P3 | §2.1 Kürzel | `1–7` öffnen Kennzahlen; in Listen öffnen `1–9` Statuschips (02 §9.2). Gleiche Tasten, verwandte Wirkung – vertretbar, aber in der Hilfe nennen. | N6 | In `?`-Panel je Seite aufführen. |

### 1.6 Undo und Rückfragen

| # | Schwere | Fundstelle | Befund | Heuristik | Änderung |
|---|---|---|---|---|---|
| UN1 | P1 | §4.2 „Zur Tour …“ | Undo 8 s „Stopp entfernen + `tour` leeren – Client“, aber §9 sagt: Stopp löschen lässt `tour` am Lieferschein stehen, `stopp_entfernen` fehlt. Gleichzeitig behauptet §3.1 „Aus Tour entfernen“ die Lücke. Entweder kann der Client `tour` leeren (dann gilt es für beide) oder nicht (dann gibt es kein Undo). | N3 (Versprechen ohne Deckung) | Festlegen: Client führt `set_value tour=""` nach dem Löschen der Stoppzeile aus (beide Wege). Abnahme: Undo hinterlässt Lieferschein in Ablage „Ohne Tour“. |
| UN2 | P1 | §4.2 „Als gepackt melden“, „Übergeben“ | Kein Undo, keine Rückfrage; „Zurück auf Entwurf“ nur Leitung. Ein Fehltipp (F12 neben F11 Vollbild) bucht Bestand, sendet bei Abholung die Mail und meldet Mengen an die AB – Mitarbeiter kann nichts tun. Physisch ist nichts passiert. | N3, N5; 02 §6.1 (Mail mit Verzögerung) | Verzögerter Commit 8 s (04 §3.6 Variante A) für „Gepackt“ und „Übergeben“: Toast „Gepackt · Abholbereit-Mail geht in 8 s · Rückgängig“. Erst nach Ablauf Server-Aufruf; `pagehide` → sofortiger Commit (04). Danach wie heute (Leitung). |
| UN3 | P1 | §4.2 Tour „Freigeben“ | Keine Rücknahme (fehlt in App); Fehlklick der Leitung gibt eine Tour an Fahrer frei. | N3 | Verzögerter Commit 8 s; danach Hinweis in `⋯` „Freigabe zurücknehmen“ als Anfrage an ph_logistik (bis dahin nicht anbieten). |
| UN4 | P2 | §4.4 | Undo-Dauer 8 s (02 §6.1, 10) vs. 5 s (04 §3.6, §4 Kiosk); Undo-Taste `Strg+Z` (02) vs. `Z` (04 §3.6). 10 erbt den Widerspruch, nennt durchgehend 8 s. | N4 | Leitlinien vereinheitlichen: 8 s, `Strg+Z`/`⌘Z`. 04 §3.6 und §4 anpassen (Anfrage UX-Lead). |
| UN5 | P2 | §4.2 Inventur „Zählliste erzeugen“ | „ersetzt Liste – Rückfrage, wenn Positionen existieren“: Rückfrage statt Undo, obwohl gezählte Werte verloren gehen – hier ist die Rückfrage richtig, aber der Text fehlt. | N5 | Dialog „Zählliste neu erzeugen? 61 gezählte Werte gehen verloren.“ Primär rot „Neu erzeugen“, Fokus auf Abbrechen (02 §6.2). Nur Status Geplant; bei Laufend Knopf nicht anbieten. |

### 1.7 Barrierefreiheit (zusätzlich zu TO1, TO4, PT12, PT13, TO15)

| # | Schwere | Fundstelle | Befund | WCAG | Änderung |
|---|---|---|---|---|---|
| A1 | P2 | §7.1 Scan, §7.3 | Live-Regionen der Scan-Rückmeldung nicht festgelegt; bei Scanner-Takt 2/s liest ein Screenreader entweder nichts oder alles. | 4.1.3 | Eine Region `role="status"` für 2a/2c (ersetzt, nicht anhängt), `role="alert"` für 2b „unbekannt“. Positionszeile `aria-describedby` auf „2/6 gepackt“. |
| A2 | P2 | §2.4 Plantafel | Raster ohne Fokusmodell: Wie kommt die Tastatur von Ablage → Tag → Tour-Karte? | 2.1.1, 2.4.3 | `role="grid"`, Zellen = Tag × Fahrzeug, `←→↑↓` zwischen Zellen, `Enter` in Zelle → Karten, `Tab` verlässt das Raster zur Ablage. Live-Region „LS-…138 zu TOUR-0031 zugeordnet · 412 von 1 100 kg“. |
| A3 | P2 | §2.4 | Plantafel bei 200 % Zoom nicht bedienbar (1.4.10 Reflow). | 1.4.10 | Liste-Ansicht ist die gleichwertige Alternative; bei Viewport < 1024 CSS-px schaltet die Seite automatisch auf Liste mit Hinweis „Plantafel ab 1024 px“. |
| A4 | P2 | §2.2, §2.3 | Icons ▢ ▣ ⌂ für Lieferart in der Tabelle; Richtung → / ← bei Sendungen ohne Text. | 1.1.1, 1.4.1 | Icon + Text immer („Versand“, „Retoure“); `aria-label` nur zusätzlich. |
| A5 | P3 | §3.2 | Tracking-Code 12 px Monospace in `muted`. | 1.4.3 | 13 px, Farbe `text-soft` (≥ 4,5:1). |

### 1.8 Konsistenz mit 01–05 (Widersprüche, die vor dem Bau eine Quelle brauchen)

| # | Thema | 10 | Leitlinie | Entscheidung (Vorschlag) |
|---|---|---|---|---|
| K1 | Packtisch-F-Tasten | F2/F3/F4/F5/F6/F8/F12 | 02 §9.5 F4 Etikett, F8 Problem · 05 §3.14 F8 Etikett, F12 Gepackt · 04 §3.12 F9 Etikett | §5 dieser Datei; 02, 04, 05 nachziehen |
| K2 | Bedienerwechsel | „F12-Konvention der Shell“ | Zentrale-Kopfzeile F12/Strg+L · Kassa-Kritik Shift+F2 | Shift+F2 in allen Kiosken |
| K3 | Undo-Dauer / Taste | 8 s, Strg+Z | 02: 8 s, ⌘Z · 04: 5 s, `Z` | 8 s, ⌘Z/Strg+Z |
| K4 | Toast-Position Kiosk | nicht genannt | 03/04: oben Mitte · 02 §6.1: unten über Tab-Leiste (iPad) | Packtisch: unten Mitte über dem Fuß (oben liegt das Scanfeld); Montage mobil: über der Tableiste. 03 §8.12 je Kiosk präzisieren |
| K5 | Count-up | beim Erstladen | 04 P10: nie beim Erstaufbau | 04 gilt (DA1) |
| K6 | Chart-Stagger | 24 ms | 04 §3.8: 20 ms | 20 ms |
| K7 | Auslastungsbalken | Breitenwechsel 200 ms | 04 P4: nie `width` | `transform: scaleX()` mit `transform-origin: left` |
| K8 | Drop-Animation Plantafel | Spring 320 ms | 04 §3.4: Spring nur Kanban-Drop · 05 §15: Drop 200 ms ohne Spring | 04 gilt; Plantafel zählt als Kanban-Ablage; 05 §15 an 04 angleichen |
| K9 | Status-Farbfolge Lieferschein | Entwurf grau → Gepackt **orange** → Übergeben **türkis** → Zugestellt grün | 03 §1.5 Regel: grau → blau → türkis → orange → grün | Gepackt wird **blau** (vorbereitet, noch im Haus), Übergeben bleibt türkis. Folge grau → blau → türkis → grün. 03-Tabelle (Gepackt unter Warning) korrigieren. Sendung: Etikett **blau**, Unterwegs türkis (heute beide türkis, im Board ununterscheidbar) |
| K10 | 02 §1.4 Klickziele | Packen 1, Etikett 2–3, Umlagern 0–1 | 0 / 1 / 2 | PT2 umsetzen → 0 / 1–2 / 0–1; 02 auf Umlagern 0–1 korrigieren |
| K11 | Rückweg-Label Kiosk | „‹ Fertig“ | 02 §11.3 „‹ Fertig“ | PT5: „‹ Übersicht“; 02 präzisieren |
| K12 | Seitenübergänge Tour mobil | nicht genannt | Projekte §7.1: 200 ms horizontal · 04 P8: Kiosk ohne Seitenübergänge | Montage mobil ist Telefon-App mit Stapelnavigation: Projekte-Wert übernehmen (24 px + Opazität, 200/160 ms), 04 §4 als Ausnahme „Montage mobil“ ergänzen |
| K13 | Route Tour mobil | `/montage?tab=tour`, Alias `/tour` | 05 §3.14: `/tour` eigener T7 | `/montage` mit Ansicht „Heute“ (TO3); `/tour` leitet um |

### 1.9 Visuelle Modernität (Maßstab Linear, Shopify Admin, Stripe, Square/Lightspeed)

| # | Schwere | Befund | Änderung |
|---|---|---|---|
| V1 | P2 | Bereichsstart wirkt wie Desk-Dashboard: viele gleich gewichtete Kacheln, Donut „Sendungen je Carrier“ ohne Handlungsbezug. | DA2; Heute-Leiste als ruhige „Inbox“-Liste (Linear Inbox): je Ausnahme eine Zeile mit Icon, Text, Ziel-Pfeil, max. 5, „Alle n“. |
| V2 | P2 | Packtisch-Karten tragen 4–5 Textzeilen gleicher Größe; die Entscheidung „was zuerst?“ steht nicht vorn. | Karte: Zeile 1 Kunde 18/500, Zeile 2 Lieferart-Icon + Ort, Zeile 3 Chips (Wunsch heute = orange Rand + „Heute“, Glas, Tour). Nummer klein mono unten. Square-artig: große Fläche, wenig Text. |
| V3 | P2 | Tour-Karte auf der Plantafel mit 6 Zeilen, ASCII-Balken und zwei Warnformen. | Kompakt (TO2): Nummer + Status-Punkt, Fahrer-Avatare 20 px, „5 Stopps · 412/1 100 kg“ mit 4-px-Balken; Warnungen als ein Icon `triangle-alert` mit Zähler, Details im Popover. |
| V4 | P3 | Emoji-Platzhalter (🔍 ⛶ 📷 🖨) in Wireframes. | Lucide-Namen festschreiben: `search`, `maximize`, `camera`, `printer`, `scan-line`, `package`, `store`, `truck`, `container`. |
| V5 | P3 | TEST-Kennzeichnung an fünf Orten (Band, Badge Liste, Badge Akte, Chip Kopf, Tarif-Kachel). | Band oben (Bereich/Kiosk) + Badge nur in Sendungszeilen/-akte; nicht zusätzlich in Lieferschein-Kopf. |

---

## 2. Pflichtänderungen (P1, vor Bau; je mit Abnahmekriterium)

| # | Änderung | Befund | Abnahme |
|---|---|---|---|
| 1 | Packtisch-Startseite mit drei Bereichen „Packen · Abholung · Wareneingang“; Bestellung ohne Lieferschein ist eine normale Packkarte | PT1 | E2E: bezahlte Bestellung erscheint unter „Packen“, Antippen öffnet Pack-Ansicht ohne Zwischenfrage; kein Text „ohne LS“ im DOM |
| 2 | Automatik nach letztem Scan: Gepackt als verzögerter Commit (8 s Undo) bzw. Etikett-Bildschirm öffnet | PT2, UN2 | E2E: Eigenlieferung packen = 0 Tipps; Undo innerhalb 8 s → Status Entwurf, keine Mail, keine Bewegung |
| 3 | Ein-Bildschirm-Etikett statt Assistent; Schritte nur bei Warnung | PT3 | Shop-Versand Mock: Karte → Buchen = 2 Tipps; gesperrtes Profil öffnet Paketteil ausgeklappt mit Grund |
| 4 | Eine Primärtaste je Lieferart in der Pack-Ansicht | PT4 | Je Lieferart genau ein Element mit `data-primaer` |
| 5 | Rückweg „‹ Übersicht“ am Packtisch | PT5 | Kein „Fertig“-Text auf der Pack-Ansicht im Zustand Entwurf |
| 6 | Kiosk-Tastenbelegung nach §5 (kein F5, F12 = Abschluss, Shift+F2 Bediener), jede Funktion mit sichtbarer Taste | PT6, PT7, K1, K2 | Tastatur-E2E: keine Packtisch-Funktion liegt auf F5/F8/F10/F11; „Paket hinzufügen“ = sichtbare Taste + F7; Liste aller Kürzel deckungsgleich mit Liste sichtbarer Tasten |
| 7 | Inline-Tour in der Lieferscheinliste streichen | LS1 | Kein editierbares Feld `tour` in `/logistik/lieferscheine` |
| 8 | Sendungs-Labels „Ohne Etikett“ / „Etikett bereit“ | LS2 | Suche im UI-Text nach „Etikett offen“ = 0 Treffer |
| 9 | Bereichs-Kürzel nach §5.2; Einzelbuchstaben öffnen nur Dialoge | LS3, BE2 | Kein Einzelbuchstabe ruft eine Server-Action ohne Dialog; `s`, `a`, `c`, `f` haben die 02/05-Bedeutung |
| 10 | Ein-Zeiger-Alternative zu jedem Ziehen (Plantafel-Sheet „Zuordnen“, Stopp `↑`/`↓`-Tasten) | TO1 | Playwright mit Touch-Emulation, ohne `dragTo` und ohne Tastatur: Lieferschein einer Tour zuordnen und Stopp verschieben möglich |
| 11 | Plantafel-Layout iPad (3 Tage, einklappbare Ablage) und Telefon (Liste) | TO2 | Screenshots 1024 × 768 und 390 × 844: keine abgeschnittene Tour-Karte, kein horizontaler Seiten-Scroll |
| 12 | Montage mobil: ein „Heute“ aus Stopps und Montageaufträgen, ein Statusknopf je Termin; Tableiste einheitlich mit Projekte | TO3 | Monteur mit Tour + Montage: Termin erscheint einmal; „Losfahren“ einmal getippt setzt Stopp und Montageauftrag |
| 13 | Unterschrift ohne Ausrichtungszwang, mit Alternative „Name bestätigt / Abgestellt laut Absprache“ (Foto-Pflicht) | TO4 | Hochformat-Test 390 × 844: Abliefern abschließbar; Alternative speichert Notiz + Foto |
| 14 | „An Kassa verkaufen“ nur als Reservierung → Verkauf nach Zahlung, sonst Knopf entfällt | BE1 | Abbruch in der Kassa lässt Bestand „Verfügbar“ bzw. Reservierung wird freigegeben |
| 15 | Undo „Zur Tour“ und „Aus Tour entfernen“ leeren `tour` am Lieferschein | UN1 | Nach Undo erscheint der Lieferschein in der Ablage „Ohne Tour“ |
| 16 | Tour-Freigabe als verzögerter Commit | UN3 | Undo innerhalb 8 s → Status Geplant, kein Server-Aufruf `freigeben` |
| 17 | Kein Count-up beim Erstaufbau | DA1 | Screenshot unmittelbar nach Laden zeigt Endwerte; `animation`/rAF-Zähler nur nach Prop-Wechsel |

---

## 3. Korrigierte Wireframes

### 3.1 Packtisch Startseite (iPad 11″ quer, 1180 × 820)

```
┌ Packtisch · Lochau   Lena M. ▾ (⇧F2)   14:05   ● Bereit          [Lager-Scan] [?] [⋯] ┐  Kopf 56
├──────────────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────────────────────┐   │
│ │ ⌁ Lieferschein, Bestellung oder Abholcode scannen …                            │   │  Scanfeld 64
│ └────────────────────────────────────────────────────────────────────────────────┘   │
│ [ Packen 9 ] [ Abholung 3 ] [ Wareneingang 2 ]                                       │  Segment 48
├──────────────────────────────────────────────────────────────────────────────────────┤
│ ┌ HEUTE ───────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐│  Karten 3 Sp.
│ │ Fam. Huber               │ │ Fam. Weiss               │ │ Hotel Alpenrose          ││  Kunde 18/500
│ │ ▢ Versand · Lochau       │ │ ▢ Versand · Lindau DE    │ │ ▣ Eigenlieferung · Breg. ││
│ │ [Glas] 0/2               │ │ 3 Artikel  [neu]         │ │ [Tour Mo 09.11.] 0/14    ││  Chips
│ │ LS-2026-00141            │ │ PH-S-261104-0012         │ │ LS-2026-00138            ││  mono 13 muted
│ └──────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘│
│ ┌ ETIKETT FEHLT ───────────┐                                                          │  orange Rand
│ │ Fam. Kurz · Lindau DE    │                                                          │
│ └──────────────────────────┘                                                          │
└──────────────────────────────────────────────────────────────────────────────────────┘
```
- Sortierung: „Heute“ (Wunsch ≤ heute+1) → „Etikett fehlt“ → übrige nach Alter. Rand-Kennzeichen + Text, nie Farbe allein.
- Leer je Segment: Packen „Nichts zu packen. Neue Bestellungen erscheinen hier automatisch.“ · Abholung „Keine Abholung bereit.“ · Wareneingang „Kein offener Wareneingang.“ (Häkchen Sand 32 px, 03 §8.18).
- Polling 30 s; neue Karte 04 §3.3 (160 ms, ohne Stagger), Kiosk-Ausnahme nach 04 §4 zulässig.

### 3.2 Pack-Ansicht (Versand)

```
┌ ‹ Übersicht   Fam. Huber · Versand → 6911 Lochau            ● Entwurf     [Nächster ›] [⋯] ┐
├ POSITIONEN · 1/2 gepackt ──────────────────────────────────┬ PAKETE · 2 ────────────────────┤
│ ┌──────────────────────────────────────────────────────┐   │ Paket 1  Glas 2er (Schätzung)  │
│ │ ⌁ Artikel scannen (EAN, SN, Website-QR)              │   │ 32×22×18 · 1,9 kg   [Ändern]   │
│ └──────────────────────────────────────────────────────┘   │ Paket 2  Leuchte M             │
│ ✓ Glas „…“ Riedel        [–] 2/2 [+]   Paket 1  Lager R-12 │ 45×45×60 · 4,1 kg   [Ändern]   │
│ ○ Leuchte „Seelicht“     [–] 0/1 [+]   Paket 2  Showroom   │ [+ Paket]  [Paket schließen]   │
│   Ausstellungsstück SN-0441 · aus Showroom A-07 entnehmen  │ Gesamt 6,0 kg · versichert     │
│                                                            ├────────────────────────────────┤ sticky
│ Letzter Scan: ✓ Glas „…“ hinzugefügt                        │ [      Etikett  (F4)       ]   │ 64 px
│                                                            │ Problem melden (F9)            │ Textknopf
└────────────────────────────────────────────────────────────┴────────────────────────────────┘
```
- „Etikett“ ist bis zum letzten Scan sekundär (Rand), danach primär (160 ms Farbe) und öffnet automatisch 3.3.
- Stepper statt Langdruck; `–` mit Undo-Toast „Leuchte zurückgesetzt · Rückgängig“.
- Toast-Ort: unten Mitte über dem Spaltenfuß (verdeckt weder Scanfeld noch Primärtaste).

### 3.3 Etikett (ein Bildschirm, Vollbild-Dialog im Kiosk)

```
┌ Etikett für Fam. Huber · DE/AT                                                      [×] ┐
│ 2 Pakete · 6,0 kg · versichert 289,00 € (Glas)                                [Ändern ▾] │  eingeklappt
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌ EMPFEHLUNG ────────┐ ┌────────────────────┐ ┌────────────────────┐                     │  Kacheln 96 px
│ │ ◉ DPD Classic      │ │ ○ GLS Business     │ │ ○ DHL Paket        │                     │  radiogroup
│ │ 1–2 Tage · 11,00 € │ │ 1–2 Tage · 12,40 € │ │ 2 Tage · 13,10 €   │                     │
│ └────────────────────┘ └────────────────────┘ └────────────────────┘                     │
│ Dem Kunden berechnet 9,90 € · Differenz −1,10 €        Preise gültig bis 14:35             │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                        [ Abbrechen ]  [   Buchen und drucken  (F12)   ] │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```
- Live-Modus: „Buchen und drucken“ öffnet die geldwirksame Bestätigung (02 §6.2) „DPD Classic für 11,00 € kostenpflichtig buchen?“; TEST: ohne, Band „TESTMODUS“ oben.
- Warnung aus `versandfaehig` → Abschnitt „Pakete“ ausgeklappt, Feld markiert, „Buchen“ deaktiviert mit sichtbarem Grund darunter (kein Tooltip im Kiosk, 03 §8.11).
- Tarif abgelaufen beim Tippen auf Buchen: Neuabfrage, Preisänderung in der Kachel 1200 ms markiert, Text „Preis neu: 11,40 €“, Buchen erneut nötig.
- Ergebnis: Karte 04 §3.13 „Etikett DPD 0123 4567 8901 gedruckt“, Tasten „Erneut drucken“, „Lieferschein drucken“, „Nächster (F3)“; kein Timer.

### 3.4 Plantafel iPad quer (1024 × 768, Ansicht „3 Tage“)

```
┌ Touren   ‹ Mo 09.–Mi 11.11. ›  [Heute]   Woche|3 Tage|Tag   Plantafel|Liste   [+ Tour] ┐
├ [Ohne Tour 6 ▸] ─┬ Mo 09.11. ──────────┬ Di 10.11. ──────────┬ Mi 11.11. ──────────┤
│ (eingeklappt     │ Sprinter BZ-123     │                     │                     │
│  56 px; Tipp     │ ┌─────────────────┐ │ ┌─────────────────┐ │      [+ Tour]       │
│  öffnet 280 px)  │ │ TOUR-0031 ● Frei│ │ │ TOUR-0032 ● Gepl│ │                     │
│                  │ │ (MF)(JK) ⚠1     │ │ │ kein Fahrer ⚠   │ │                     │
│                  │ │ 5 Stopps ▇▇▇░ 37%│ │ │ 3 Stopps ▇░░ 11%│ │                     │
│                  │ └─────────────────┘ │ └─────────────────┘ │                     │
│                  │ LKW BZ-456 [+ Tour] │                     │                     │
└──────────────────┴─────────────────────┴─────────────────────┴─────────────────────┘
```
- Tipp auf Lieferschein-Karte (Ablage) → Sheet „Zuordnen“ mit Tour-Kacheln (Auslastung danach) + „Neue Tour …“; Ziehen bleibt zusätzlich (150 ms Halten).
- Prozent nur als Begleittext zur kg-Angabe im Popover („412 von 1 100 kg“); Balken `scaleX`.
- Leer: „Keine Touren von Mo bis Mi. Tippen Sie einen Lieferschein an oder legen Sie eine Tour an.“

### 3.5 Montage mobil „Heute“ (Telefon 390 × 844)

```
┌ Montage · Heute Mo 09.11.         ● online ┐
│ ┌ MEINE TOUR ─────────────────────────────┐ │
│ │ Sprinter BZ-123 · 2/5 erledigt ▇▇░░░    │ │
│ │ [Route ↗]            [Tour abschließen] │ │  aktiv-Taste springt zu offenem Stopp
│ └─────────────────────────────────────────┘ │
│ ✓ 07:30 Abfahrt Lochau                      │
│ ◉ 08:00 Lieferung · Fam. Berger       NÄCHST│  Karte groß: [Navigation] [Anrufen]
│ ○ 09:30 Montage · Küche Muster (Auftrag) ›  │  = Montageauftrag-Karte aus Projekte
│ ○ 13:00 Lieferung · Hotel Alpenrose      ›  │
│ ○ 14:00 Abholung · Polsterei Kurz        ›  │
├─────────────────────────────────────────────┤
│ [ Heute ]  [ Woche ]  [ Suche ]  [ Ich ]    │  64 px + safe-area
└─────────────────────────────────────────────┘
```
- Ohne Tour: Karte „Meine Tour“ entfällt; Liste zeigt nur Montageaufträge.
- Leer: „Heute keine Termine.“ + „Morgen (2) ›“. Tour nicht freigegeben: Karte „Tour noch nicht freigegeben“ + [Disposition anrufen] [Erneut prüfen].

### 3.6 Lieferscheinliste (Desktop, Kopfbereich)

```
┌ Lieferscheine                                                    Liste|Kanban  [+ Lieferschein] ┐
│ Heute zu packen 7 · Ohne Tour 4 · Abholbereit 3 · Alle                       (Ansichten, Tabs) │
├ [Entwurf 7] [Gepackt 3] [Übergeben 12] [Zugestellt] · [Filter +] [Lieferart: Spedition ×]  ⌕ / ┤
│ ☐ Nummer         Kunde / Ort            Lieferart        Wunsch   Tour      Packstand  Status   │
```

---

## 4. Undo-/Rückfrage-Matrix (ersetzt Spalte „Rückfrage / Undo“ in 10 §4.2 für diese Aktionen)

| Aktion | Muster | Dauer / Text | Begründung |
|---|---|---|---|
| Abhaken, `–`, Paket ändern | sofort + Undo (Gegenaktion) | 8 s „Abgehakt: … · Rückgängig“ | umkehrbar |
| Gepackt (Packtisch automatisch und Knopf) | verzögerter Commit | 8 s „Gepackt · Rückgängig“; bei Abholung „Abholbereit-Mail geht in 8 s“ | Bestand + Mail, physisch nichts passiert |
| Übergeben (Knopf, Masse) | verzögerter Commit | 8 s; Masse: „5 übergeben · Rückgängig“ | meldet AB-Menge |
| An Kunde ausgeben (Abholung) | Unterschrift = Bestätigung, danach kein Undo | – | physische Übergabe |
| Etikett buchen live | Bestätigung | „… kostenpflichtig buchen?“ | geldwirksam |
| Zur Tour / Aus Tour | sofort + Undo | 8 s; Undo leert `tour` (UN1) | umkehrbar |
| Tour freigeben | verzögerter Commit | 8 s | keine Rücknahme im Server |
| Stopp verschieben, Nach PLZ sortieren | sofort + Undo | 8 s | umkehrbar |
| Platz inline | verzögerter Commit | 8 s „Platz A-04 · Rückgängig“ | vermeidet Doppelbuchung im Journal |
| Umlagern (Dialog, Masse) | sofort + Undo (Gegenumlagerung) | 8 s | bewusster Vorgang, Journal korrekt |
| Ausbuchen | Bestätigung, Grund Pflicht | „1 Stück Esstisch Eiche ausbuchen? Rücknahme nur durch Leitung.“ | unumkehrbar für Mitarbeiter |
| Zählen | sofort + Undo | 8 s | umkehrbar |
| Inventur freigeben, Lieferschein/Sendung/Tour stornieren | Bestätigung (rot, Grund) | Zusammenfassung wie 10 | unumkehrbar |

Verzögerter Commit: `pagehide`/`visibilitychange` sendet sofort (04 §3.6 Variante A); offline → Puffer mit `idempotency_key`, Toast-Text „wird gesendet, sobald online“. Kiosk-Sperre (Idle) committet ausstehende Aktionen vor dem Sperrbild.

---

## 5. Tastenbelegung

### 5.1 Kiosk Packtisch (ersetzt 10 §7.1 „Tastatur“; Shell-Teile gelten für alle Kioske)

| Taste | Wirkung | Sichtbare Taste |
|---|---|---|
| `F1` | Hilfe-Panel | `[?]` Kopf (Shell) |
| `Shift+F2` | Bedienerwechsel / Sperren | Name im Kopf (Shell) |
| `F2` | Scanfeld fokussieren / Suche | Scanfeld |
| `F3` | Nächster Lieferschein | „Nächster ›“ |
| `F4` | Etikett-Bildschirm | „Etikett“ |
| `F6` | Paket schließen (folgende Positionen → nächstes Paket) | „Paket schließen“ |
| `F7` | Paket hinzufügen | „+ Paket“ |
| `F9` | Problem melden | „Problem melden“ |
| `F12` / `Strg+Enter` | Abschluss-Primär der Ansicht (Gepackt · Abholbereit melden · Buchen und drucken · An Kunde ausgeben) | Primärtaste |
| `Strg+P` | Druckmenü (Lieferschein, Packliste, Etikett) | `⋯` → Drucken |
| `Strg+Z` | Undo jüngster Toast | Toast-Taste |
| `Esc` | oberste Ebene schließen (Dialog › Sheet › Etikett-Bildschirm); in der Pack-Ansicht ohne offene Ebene: nichts (Rückweg nur über „‹ Übersicht“) | `×` / `‹` |
| `F5`, `F8`, `F10`, `F11` | nicht belegt (Neuladen, Toast-Fokus 03, Browser-Menü, Vollbild) | – |

Regeln: keine Einzelbuchstaben im Kiosk (Scanfeld ist Fokus-Heimat, Kassa-Kritik §4 übernehmen), Kürzel-Hinweise `<kbd>` nur bei `data-tastatur="ja"`, Scanner wirkt global außer `data-scan="nein"`.

### 5.2 Backoffice Logistik (ergänzt 02 §9.2/05 T2/T5; Buchstaben behalten dort ihre Bedeutung)

| Kontext | Kürzel | Wirkung |
|---|---|---|
| alle Listen | 02 §9.2 unverändert (`a` Zuweisen, `s` Status, `c` Kommentar, `x` Auswahl, `f` Filter, `1–9` Chips) | – |
| Lieferscheine Liste/Akte | `k` Liste/Kanban · `t` „Zur Tour …“ (Popover) · `w` am Packtisch öffnen · `p` Packliste drucken · `.` Aktionsmenü | nur Öffnen, keine Buchung |
| Lieferschein-Akte | `1–5` Tabs (05 T5, nicht `Alt+`) · Übergeben/Zugestellt **nur** über Primärtaste bzw. `Strg+Enter` | Primär |
| Sendungen | `r` Tracking der Zeile aktualisieren (05 T1 `r` = neu laden, gleiche Bedeutung) · `l` Etikett öffnen · `Shift+C` Tracking-Nr. kopieren | – |
| Plantafel | `t` heute (T4) · `←→` Zeitraum außerhalb des Rasters · `Enter` Karte öffnen · `m` Zuordnen-Sheet · `n` neue Tour in Zelle | Freigeben nur Akte/Primär |
| Tour-Akte | `Strg+Enter` Primär (Freigeben / Starten / Abschließen je Zustand) · `Alt+↑/↓` Stopp verschieben · `d` Stopps hinzufügen (Dialog) · `p` Tourenblatt | `s` bleibt Speichern |
| Bestand | `u` Umlagern (Dialog) · `v` Reservieren (Dialog) · `p` Lageretikett · `Shift+Entf` Ausbuchen (Dialog) | – |
| Inventur-Zählliste | `Enter` speichern + nächste Zeile · `↑/↓` · `/` Suche · `z` Zählmodus | – |

---

## 6. Fehlende Leer- und Fehlerzustände (in 10 ergänzen)

| Ort | Zustand | Text / Verhalten |
|---|---|---|
| Lieferschein-Akte Tab Pakete | leer | „Noch keine Pakete. Pakete entstehen beim Packen oder über ‚Pakete vorschlagen‘.“ [Pakete vorschlagen] |
| Lieferschein-Akte Tab Übergabe & Fotos | leer | „Noch keine Fotos. Fotos kommen vom Packtisch oder vom Fahrer.“ [Foto hinzufügen] |
| Sendung Tab Tracking | noch kein Ereignis | „Noch keine Meldung vom Carrier. Nächster Abgleich 16:15.“ [Jetzt abgleichen] |
| Tour-Akte Tab Stopps | leer | „Noch keine Stopps. Lieferscheine ohne Tour: 6.“ [Stopps hinzufügen] |
| Tour-Akte Tab Fotos | leer | „Fotos der Fahrer erscheinen hier nach Stopp-Nummer.“ |
| Plantafel | keine Fahrzeuge | „Noch keine Fahrzeuge angelegt. Touren brauchen ein Fahrzeug.“ [Fahrzeug anlegen] (Leitung) / „Bitte Leitung fragen“ |
| Plantafel Ablage | Suche ohne Treffer | „Kein Lieferschein mit ‚6971‘.“ [Suche leeren] |
| Inventur Tab Differenzen | keine | „Keine Differenzen – alle gezählten Positionen stimmen.“ (Häkchen) |
| Bewegungen | Filter leer | „Keine Bewegungen ‚Ausbuchung‘ in den letzten 30 Tagen.“ [Filter zurücksetzen] |
| Ausstellung | nie Daten | „Keine Ausstellungsstücke erfasst. Ausstellungsstücke sind Bestand mit Seriennummer im Showroom.“ |
| Stammdaten Paketprofile | leer | „Noch keine Paketprofile. Ohne Profile schlägt der Packtisch keine Pakete vor.“ |
| Seiten mit fehlendem Recht | kein Zugriff (03 §8.18) | Icon `lock`, „Kein Zugriff auf Bewegungen“, „Bitte Leitung fragen“ |
| Packtisch | Scanner nicht erkannt (kein HID-Eingang seit Start) | Kopf-Status „Scanner?“; Taste „Mit Kamera scannen“ (01 G3) |
| Packtisch | Etikettendrucker antwortet nicht | Karte „Etikett gebucht, Druck fehlgeschlagen“ [Erneut drucken] [Als PDF öffnen]; Status Etikett bleibt (kein Neubuchen) |
| Packtisch | Konflikt: zweite Person packt denselben Lieferschein | Band „Lena packt diesen Lieferschein gerade (seit 14:02)“ [Trotzdem öffnen] |
| Etikett | Zeitüberschreitung bei Buchung | Zustand „Buchung wird geprüft …“ (Abfrage aktive Sendung), erst danach „Erneut buchen“ – nie direkt neu buchen |
| Tour mobil | Kamera-Berechtigung verweigert | „Kamera ist für Platzhirsch gesperrt. In den Einstellungen erlauben.“ + „Foto aus Mediathek“ |
| Tour mobil | Unterschrift leer, „Fertig“ getippt | Feldfehler am Unterschriftfeld „Bitte unterschreiben lassen oder Alternative wählen“ |
| Tour mobil | Tour im Büro geändert | Band TO13 |
| Tour mobil | keine Tour, keine Montage | 3.5 Leer |

---

## 7. Bewegung – Abgleich mit 04

| Element in 10 | 04-konform? | Korrektur |
|---|---|---|
| Kennzahlen hochzählen beim ersten Laden | nein (P10) | nur bei Änderung nach Mount, 400 ms `--bo-ease-out` |
| Chart-Balken 240 ms, Stagger 24 ms | fast | Stagger 20 ms (§3.8) |
| Auslastungsbalken Breite 200 ms `--bo-ease-inout` | nein (P4) | `scaleX` 200 ms `--bo-ease-inout`, `transform-origin: left` |
| Plantafel-Ablage Spring 320 ms | ja (§3.4) | Rückkehr ungültig 200 ms `--bo-ease-out`; Tipp-Zuordnung ohne Spring (Abgang/Eintritt §3.3) |
| Scan 2a/2b/2c | ja (§3.12) | „Etikett (F9)“-Text in 04 §3.12 auf „Etikett (F4)“ ändern |
| Ergebnis-Karte Etikett, Rücksprung nach 1,5 s | nein (§3.13 Karte bleibt) | kein Timer (PT12) |
| Primärtaste wird nach letztem Scan primär | ja | Farbe 160 ms, kein Translate |
| Paketzeilen 120 ms | ja | – |
| Toast Undo-Balken | Dauer strittig | 8 s, linear, Pause bei Fokus; Kiosk ohne Hover → Balken läuft, `Strg+Z` und Zeilen-`–` als Ersatz |
| Montage mobil Bildschirmwechsel | nicht genannt | Projekte §7.1 übernehmen (24 px + Opazität, 200 ms ein / 160 ms aus) |
| Hervorhebung „zum offenen Stopp springen“ | neu | 04 §3.3 Markierung 1200 ms linear |
| Tour geändert (Band) | neu | `grid-template-rows` 160 ms (04 §3.14), kein Blinken |
| reduzierte Bewegung | ja | alle oben: Transform weg, Opazität 120 ms, Text + Symbol bleiben |

---

## 8. Was gut ist (beibehalten)

1. Primäraktion je Zustand als Tabelle (§3.1) – Vorlage für alle Akten.
2. „Volumen unbekannt n“ statt Schätzung; „Nach PLZ sortieren“ statt „optimieren“ – ehrliche Sprache.
3. Kanban ruft Dokumentmethoden, nicht generische Workflow-Aktionen; Rückkehr bei Fehler mit Grund und Lösungsweg („Am Packtisch öffnen“).
4. Drei Leerzustände auf den Hauptlisten mit konkreten Texten.
5. Geldwirksame Schritte nur live bestätigt, TEST überall erkennbar, offline gesperrt mit Begründung.
6. Scan-Fall „Position bereits vollständig“ vom Fall „unbekannt“ getrennt, obwohl der Server es nicht kann.
7. Bewegungen ohne Löschen, Storno als Gegenbuchung mit Link – im Journal nachvollziehbar.
8. Doppelklick-Schutz und `aria-busy` an Buchen/Gepackt/Übergeben (§10.3 Nr. 22).
9. Fehler je Kachel statt Seitenfehler; Cache-Stand „zuletzt geladen 14:02“.

---

## 9. Ergänzungen für §10 (Abnahme) nach Umsetzung

1. Klickziele auch im **Live-Modus** messen (heute nur Mock): Shop-Versand live ≤ 3 Tipps inkl. Bestätigung.
2. Touch-Emulation ohne Tastatur und ohne `dragTo`: alle Drag-Wege (Plantafel, Stopps, Kanban) erreichbar (WCAG 2.5.7).
3. Hochformat-Test Tour mobil 390 × 844: Abliefern mit Unterschrift und mit Alternative abschließbar (WCAG 1.3.4).
4. Kürzel-Inventar: automatisierter Test, dass kein Einzelbuchstabe eine Server-Action ohne Dialog auslöst und dass `s`, `a`, `c`, `f` in Logistik-Seiten die 02/05-Bedeutung haben.
5. Verzögerter Commit: Undo innerhalb 8 s bei Gepackt/Übergeben/Freigeben erzeugt **keinen** Server-Aufruf; Seitenwechsel innerhalb 8 s committet genau einmal.
6. Plantafel-Screenshots 1024 × 768 und 1280 × 800, hell/dunkel: keine abgeschnittene Tour-Karte.
7. Screenreader (VoiceOver iPad): Scan erkannt/unbekannt wird je einmal angesagt; Zuordnung auf der Plantafel wird angesagt.
8. Montage mobil: Termin mit Tour-Stopp und Montageauftrag erscheint genau einmal.

---

## 10. Anfragen aus dieser Kritik

| An | Punkt | Priorität |
|---|---|---|
| UX-Lead (02/04/05) | Kiosk-Tastenbelegung §5.1 (Shell-Teil für alle Kioske), Undo 8 s/⌘Z, Toast-Position je Kiosk, „‹ Übersicht“, Klickziele 02 §1.4, Spring-Regel 05 §15 | 1 |
| Design-System (03) | Statusfolge Lieferschein (Gepackt blau) und Sendung (Etikett blau); §8.12 Toast-Fokus `F8` nicht im Kiosk | 1 |
| Projekte-Agent | Gemeinsames „Heute“ in Montage mobil, Tableiste, ein Statusknopf für Montage-Stopp + Montageauftrag; Unterschrift ohne Querformat-Zwang | 1 |
| Zentrale-Agent | Kopfzeile KioskShell: Wechsel `Shift+F2` statt `F12`/`Strg+L` | 1 |
| Kassa-Agent | Reservierung Ausstellungsstück → Verkauf nach Zahlung (BE1) | 1 |
| Logistik-Konzept (10) | Befunde PT1–PT15, LS1–LS10, TO1–TO15, BE1–BE10, DA1–DA5, UN1–UN5, A1–A5 einarbeiten; Wireframes §3 übernehmen | 1 |
| Fundament | Kanban PH Sendung **nicht** ergänzen (LS6); Plantafel als `role="grid"`; verzögerter Commit im `Toast` (04 §3.6 Variante A) | 2 |
