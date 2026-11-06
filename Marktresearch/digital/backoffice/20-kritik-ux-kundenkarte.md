# 20 – UX-/UI-Kritik Bereich „Kundenkarte“ (zu `10-konzept-kundenkarte.md`)

**Zweck:** Strenge Prüfung des Kundenkarte-Konzepts gegen Nielsen-Heuristiken, WCAG 2.2 AA, Mobile-/iPad-/Kiosk-Regeln und die Leitlinien 01–05. Ergebnis: Note, Pflichtänderungen (vor Umsetzung), nachgezählte Klickwege, Empfehlungen, Widersprüche zu den Leitlinien.
**Stand:** 2026-11-04 · Rolle: UX-/UI-Kritiker · Geprüft: `10-konzept-kundenkarte.md` (760 Zeilen, vollständig), `01-benchmark-prinzipien.md` (B4, C1, C6, D3, D10, E2, E3, H3), `02-ux-leitlinien.md` (§0–§16), `03-design-system.md` (§1.3–§1.6, §8.1–§8.20), `04-motion.md` (§2, §3.5–§3.13), `05-informationsarchitektur.md` (§1, §3.10, §8), gegengeprüft `Backend-Import/ph_kundenkarte/.../ph_kundenkarte_vorteil.json` (`gilt_ab_stufe`).
**Status:** Prüfbericht, keine Entscheidung des Inhabers. Abgleich mit den Kritiken Shop/Service/Personal/Kassa (gleiche Vorschläge bei Leitlinien-Widersprüchen, damit sich die Bereiche nicht auseinanderentwickeln).

---

## 0. Urteil

**Note: 6 / 10.**

| Kriterium | Teilnote | Kurzbegründung |
|---|---|---|
| Fachliche Tiefe, Datenmapping | 9 | Jede Methode, jedes Feld, jede Lücke benannt (§9); Leitplanken (kein Geldwert, Einwilligung) konsequent in der UI |
| Einfachheit / Klickzahl | 4 | 7 Akte-Tabs, 4-Schritt-Assistent für eine Karte im Showroom, schwerer Einlöse-Dialog; Klickzahlen in §1 zählen ab Bereich statt ab Zentrale |
| Tastatur | 3 | Einzelbuchstaben kollidieren mit Kartennummern-Scans, mit 02 §9 und untereinander; `S` = Stornieren auf einer Taste; WCAG 2.1.4 nicht erfüllt |
| Konsistenz mit 01–05 | 5 | Undo 5 s/8 s gemischt, Statusfarben gegen 03 §1.5, Stufen-Pille = Statusform, Messing-Regel 02 §13 ignoriert, vier Speichermodelle in einer Akte |
| Leer-/Fehlerzustände | 6 | Listen gut, Tabs/Side-Peek/Dialoge/Popover lückenhaft; Commit-Fehler nach Seitenwechsel ohne Ort |
| Barrierefreiheit | 5 | Tooltip als einzige Erklärung an vielen Stellen, Fokusverlust nach Einlösen, Querformat als Auslöser (WCAG 1.3.4), Dunkelmodus-Text der Stufen-Pille |
| Mobile/iPad | 5 | iPad ist das Showroom-Gerät, Kamera-Scan baut auf eine API, die Safari nicht anbietet; Kundin bekommt das iPad ohne Kundenmodus |
| Visuell / Modernität | 6 | Kopf der Akte überladen (12 Elemente in 2 Zeilen), keine Kartendarstellung, Emoji/Sonderzeichen im Wireframe, Rohwerte („Persoenlich“) sichtbar |

Stark: Leitplanken als Bedienlogik (Einwilligungsschalter mit sichtbarer Folge, „–“ statt 0 €, Kiosk ohne Kontaktdaten), Primäraktion je Zustand, Undo-Variante A beim Einlösen mit `flush()`, Kanban ohne Drag mit Begründung, Live-Textprüfung im Stufenplan, Akzeptanzkriterien messbar (K1–K26).

Schwach: Die Oberfläche bildet die Datenstruktur ab (7 Tabs = 7 Feldgruppen der JSON) statt der Aufgabe „Kundin steht daneben, Vorteil nutzen, Karte ausstellen“. Der Scanner ist zentrale Idee des Bereichs, aber jede Kartennummer (`KK-…`, Alphabet A–Z ohne I/O) enthält genau die Buchstaben, die das Konzept als Kürzel belegt.

---

## 1. Pflichtänderungen (vor Umsetzung, nach Wirkung sortiert)

| Nr. | Befund | Verstoß gegen | Änderung (konkret) |
|---|---|---|---|
| P1 | **Scan löst Kürzel aus.** Kartennummern bestehen aus `K K - [23456789A-HJ-NP-Z]{6}`. Ein Hand-Scanner (Tastatur-Emulation) tippt auf der Karten-Akte zuerst `K` → „Kundenakte öffnen“ (§2.3) feuert, bevor `useScanner` die Folge erkennt. Gleiches für `V`, `W`, `P`, `A`, `D`, `R`, `S`, `N`, `X`, `G` (Sequenz `G K`!). | Nielsen 5 (Fehlervermeidung), 02 §9.5, 01 B4 | **Scan-Tor im Fundament** (`useTastenkuerzel` + `useScanner` gemeinsam): Einzeltasten-Kürzel werden 40 ms gepuffert; kommt innerhalb 40 ms ein weiteres druckbares Zeichen, gilt die Folge als Scan-Kandidat und kein Kürzel feuert. Scan = ≥ 6 Zeichen mit Zeichenabstand < 35 ms, Abschluss Enter. Nach Enter: `istKartennummer()` → Karte öffnen, sonst Eingabe verwerfen + Toast „Code nicht erkannt“. E2E: Scan-Simulation (`keyboard.type` mit 10 ms Delay) auf Karten-Akte, Antrag-Akte, Liste – keine Navigation außer zur Karte. |
| P2 | **Scanner schreibt in Textfelder.** §2.3: Scan wirkt überall, „nur wenn kein Textfeld mit `data-scan="nein"` fokussiert ist“ – Logik ist umgekehrt zu 02 §9.5 („nie in Textfelder, außer `data-scan="ja"`“). Folge: Wer im Kommentarfeld einer Einlösung eine Karte scannt, verliert den Text und landet auf einer anderen Karte. | 02 §9.5, Nielsen 3 | Regel aus 02 übernehmen: Scan-Erkennung nur, wenn **kein** Eingabefeld fokussiert ist **oder** das Feld `data-scan="ja"` trägt (Suchfeld Karten-Liste, Palette, Kartensuche im Einlöse-Dialog). In allen anderen Feldern bleibt die Eingabe Text. |
| P3 | **Kürzel kollidieren mit 02 und untereinander; WCAG 2.1.4 fehlt.** Antrag-Akte `A` (02: Zuweisen), `S` (02: Status), `D`, `R`; Einlösungs-Sheet **`S` = Stornieren** (irreversibel auf einer Taste); Karten-Akte `P` (02: ⌘P), `1–6` Tabs (02 §9.4: `Alt+1…9`; außerdem 7 Tabs), `E` „erstes Feld“ (Tab 1 hat keine Felder), `V`/`W`/`K`. | 02 §9.1–9.4, WCAG 2.1.4 (A), Nielsen 4 | Neue Kürzeltabelle (Abschnitt 4). Grundsatz: **Primäraktion = ⌘/Strg+Enter** (Einlösen, Ausstellen, Aktivieren, Entsperren je Zustand), Drucken = ⌘/Strg+P, Tabs = Alt+1…4, Aktionsmenü = `.`; Ablehnen, Doppelt, Stornieren, Sperren, Kündigen **nur** über Menü/Knopf (im geöffneten Menü sind Buchstaben-Sprünge erlaubt). Benutzer-Menü → „Tastenkürzel mit Einzeltasten“ Schalter (Standard an), Zustand serverseitig im Profil – erfüllt 2.1.4. |
| P4 | **Klickzahlen in §1 stimmen nicht.** §1 zählt ab Bereich bzw. ab geöffneter Karte, 02 §1 verlangt „ab Zentrale ohne Suche“. Beispiele: Vorteil einlösen „3“ → real 6; Berater ändern „2“ → 4; Sperren „3“ → 7; Antrag entscheiden „2“ → 6; Neue Karte „4“ → 9 (über Kundenakte ≥ 10). | 02 §1, §16 (Abnahme misst die Wege) | Tabelle in Abschnitt 2 übernehmen (Ist, nach Pflichtänderungen, Zielwert). Zwei Zählarten getrennt ausweisen: „ab Zentrale“ und „ab Scan/Palette“. E2E misst beide. |
| P5 | **Karten-Akte: 7 Tabs, doppelte Inhalte.** Vorteile · Einlösungen · Einkäufe · Einwilligung · Wallet & QR · Daten · Intern; 03 §8.10 schiebt ab > 6 Tabs in `⋯` (hier: „Intern“). Einlösungen stehen zusätzlich in der Zeitleiste rechts, Stufe im Kopf **und** im Stufenblock. | 03 §8.10, Nielsen 8, 02 §0.2 | **4 Tabs:** `Vorteile` · `Verlauf` (Einlösungen + Ereignisse + Kommentare, Filter-Chips „Alle · Einlösungen · Stufe · Kommentare“, 03 §8.16) · `Einkäufe` · `Details` (Abschnitte mit Sprungleiste: Einwilligung, Wallet & QR, Stammdaten, Intern [nur Leitung/GF]). Rechte Spalte = Bezüge + Nächster Schritt, **ohne** Zeitleiste (die ist jetzt Tab „Verlauf“). Kassa-Rolle (falls P22 nicht umgesetzt): nur Vorteile + Verlauf. |
| P6 | **Vier Speichermodelle in einer Akte:** Berater sofort + Undo (B), Tab „Daten“ mit Speicherleiste, Tab „Einwilligung“ „Speichern = Bestätigung“ (§3.5) **und** laut §4.2 Dialog, „Intern“ Autosave 1 s. Benutzer weiß nicht, ob gespeichert ist. | Nielsen 1/4, 02 §4.1–4.3 | **Ein Modell:** Einzelfelder (Berater, Kanal, Geburtstag, Interessen) sofort + Undo-Toast 8 s; Notiz Autosave 1 s mit „Gespeichert 14:02“ im Abschnittskopf; **Stufe** und **Einwilligung** über eigene Bedienelemente mit Folge-Text (P7, P8). Keine Speicherleiste in der Karten-Akte. `conflict` je Feld (02 §4.2 gelb umrandet), nicht als Seiten-Diff. |
| P7 | **Stufe manuell setzen ist versteckt und rechtlich unklar.** Weg = Tab „Daten“ → Link-Feld → Speicherleiste; §1.2 nennt es Leitungsaufgabe, §4.2 gibt es Mitarbeitern, §3.10 sagt „andere Stufe nur Leitung“. Kein Grund wird erfasst, obwohl ein Ereignis entsteht. | Nielsen 4/6, 02 §4.1 (Folgewirkung → nicht inline-stumm) | Stufen-Kennzeichen im Kopf ist ein Knopf (`aria-haspopup="dialog"`) → Popover 360 px „Stufe festlegen“: Radio-Liste der Stufen (Kennzeichen + Name), Grund Pflicht (Chips „Kulanz“, „Objekt/Hotel“, „Korrektur“ + Freitext 140), Folge-Satz „Automatische Einstufung wird für diese Karte ausgeschaltet.“, Primär „Festlegen“. Danach Kennzeichen „manuell“ (Rechteck 03 §8.9) + Link „Automatik wieder zulassen“. Undo-Toast 8 s (Variante B: Gegenaktion setzt alte Stufe + `stufe_manuell` zurück). Recht: Vorschlag Leitung; Mitarbeiter sieht Popover mit sichtbarem Satz „Nur Leitung“ + Knopf „Leitung bitten“. Entscheidung in §12 aufnehmen. |
| P8 | **Undo uneinheitlich, Lücken bei umkehrbaren Aktionen.** Einlösung 5 s (A), Berater/Automatik 8 s (B), §4.3 nennt 8 s. **Aktivieren** ohne Undo (das Konzept diskutiert im Spec-Text selbst, ob ein Dialog nötig ist), **Sperren** ohne Undo, obwohl ein Fehlgriff (falsche Zeile) für Mitarbeiter nur über die Leitung reparierbar ist. Fehler nach Ablauf bei bereits verlassener Seite: kein Anzeigeort. | 02 §0.4/§6.1, 04 §3.6, 01 D3/E2, Nielsen 3/9 | Ein Wert **8 s** für den Bereich (gleich wie Shop/Service/Personal-Kritik; 04 §3.6 anpassen). Variante A (verzögerter Commit) für: Vorteil einlösen, Aktivieren, Sperren (Grund im kurzen Dialog, dann Toast „Karte KK-… gesperrt · Rückgängig“), Massen-Sperren. Variante B für Berater, Automatik zulassen, Stufe festlegen. Commit-Fehler nach Seitenwechsel: Fehler-Toast (bleibt bis geschlossen, `role="alert"`) „Einlösung für Anna Muster nicht gespeichert – Limit erreicht“ + „Zur Karte“. Einwilligung **erteilen** = sofort + Undo; **widerrufen** = Dialog (siehe P8a unten). |
| P8a | (zu P8) **Einwilligung widerrufen:** §3.5 (Text erscheint inline, Speichern bestätigt) und §4.2 (Dialog) widersprechen sich. | Nielsen 4 | Dialog sm 400, Titel „Auswertung der Kaufhistorie für Anna Muster beenden?“, Fakten: „Umsatzangaben werden gelöscht · Stufe wird Platzhirsch (Startstufe) · Zeitpunkt wird vermerkt“; bei `stufe_manuell` Zeile „Stufe bleibt (manuell festgelegt)“. Primär neutral „Beenden“, Fokus auf Abbrechen (nicht umkehrbar: Umsatz gelöscht). |
| P9 | **Einlöse-Dialog zu schwer für die häufigste Aktion.** md 560 mit Vorteil-Radios, Ort-Select (inkl. „Kassa“/„Packtisch“, die im Backoffice nie zutreffen), Bezug als zweiteiliges Feld (Typ-Select + Suche), Kommentar, Hinweistext; danach noch Undo-Toast. „Persönliche Beratung“ (unbegrenzt, ohne Beleg) braucht dieselben Schritte. | 02 §0.3, §4.3 (nur Pflicht + 2–3 häufigste), Nielsen 7/8 | **Popover an der Kachel** (360 px, öffnet 160 ms `--bo-ease-out`, `translateY -4px→0`): Titel „Lieferung im Liefergebiet einlösen“, Liste „Bezug wählen“: bis 5 offene Belege des Kontakts (Typ-Icon, Nummer mono, Datum, Betrag nur mit Recht), Zeile „Ohne Bezug“, Zeile „Anderen Beleg suchen …“ (eine Combobox über alle `BEZUG_ERLAUBT`-Typen, Typ aus Präfix erkannt). **Ein Klick auf eine Zeile = einlösen** (Popover schließt, Undo-Toast 8 s). Ort automatisch aus Arbeitsplatz („Showroom“ im Backoffice), Kommentar und Ort unter „Mehr ▾“ im Popover. Tastatur: `↑↓`, `Enter` löst ein, `Esc`. Der md-Dialog bleibt nur für den Einstieg aus `/kundenkarte/einloesungen` (dort mit vorangestellter Kartensuche). |
| P10 | **Neue Karte = 4-Schritt-Assistent** (Person → Einwilligungen → Karte → Ausstellen) für den Fall „Kundin steht daneben“. Schritt 3 besteht aus Vorbelegungen (Stufe = Start, Berater vorgeschlagen, Kanal, Sofort aktiv). Kanal ist aus dem Arbeitsplatz bekannt. | 02 §4.3, 01 E3 (Assistent nur bei echter Mehrschrittigkeit), 02 §1 | **Ein Formular** als Dialog lg 800 (iPad: Vollbild-Sheet): links Abschnitte **Person** (Link-Suche Kontakt mit „neu anlegen“ inline: Vorname, Nachname, E-Mail; Telefon/PLZ/Ort eingeklappt) und **Einwilligungen** (Teilnahmebedingungen-Haken Pflicht, Schalter „Kaufhistorie auswerten“, Schalter „Newsletter“), eingeklappt „Weitere Angaben“ (Geburtstag, Interessen, Berater, Stufe [Leitung], „Erst bei Übergabe aktivieren“). Rechts **Live-Satz** „Legt an: Kontakt Anna Muster (neu) · Karte (aktiv, Platzhirsch) · Nachweis Teilnahmebedingungen v…“. Primär „Karte ausstellen“ (⌘Enter). Prüfungen (Karte besteht, Antrag offen) erscheinen **sofort unter dem Personenfeld** als Hinweis mit Link, nicht erst am Ende. Kanal aus Arbeitsplatz. Entwurf in sessionStorage bleibt. |
| P11 | **Kundin liest am iPad mit – ohne Kundenmodus, ausgelöst durch Drehen.** §7.1: „Bildschirm drehen: Abschnitt ‚Kundin bestätigt‘“. Drehen als Auslöser verletzt WCAG 1.3.4 (Ausrichtung) und ist nicht erkennbar; die Kundin hält ein Gerät mit Seitenleiste, Palette und Browser-Zurück auf andere Kundendaten. | WCAG 1.3.4, Datenschutz-Leitplanke, Nielsen 3 | Knopf **„An Kundin übergeben“** im Einwilligungs-Abschnitt → **Kundenmodus**: Vollbild ohne Seitenleiste/Palette/Kürzel, Sie-Form, 18 px, Schalter 44 px mit vollem Einwilligungstext und Version, Knopf „Fertig – zurück an die Beratung“. Rückkehr erst nach Bediener-Bestätigung (Langdruck 600 ms mit Fortschrittsring oder Bediener-PIN, gleiche Komponente wie Kiosk-Bedienerwechsel). Zurück-Geste abgefangen (`history.pushState` + `popstate` bleibt im Modus). Übergang 200 ms Crossfade (`--bo-ease-inout`), bei `reduce` sofort. Idle 2 min → zurück zur Beraterin, Eingaben bleiben. Unterschrift/Formular-Anhang erst, wenn das Feld existiert (§9-Lücke). |
| P12 | **Stufe sieht aus wie ein Status.** Stufen-Pille hat dieselbe Form wie `StatusBadge` (Pille, Punkt, 12 % Tint). Platzhirsch = Tinte-Tint (wirkt wie „grau/inaktiv“), Plus = Sand (Akzentfarbe), **Privé = `#1d4ed8` = Statuston blau („Neu/Offen“)**. In der Kartenliste stehen Stufe und Status nebeneinander. „Text Tinte“ fest → im Dunkelmodus Tinte auf `#1f252b` unlesbar. 02 §13 sieht für Stufen Messing vor. | 03 §1.5 (Status-Töne reserviert), 03 §8.9, WCAG 1.4.3, Nielsen 4 | Neue Komponente **`StufenKennzeichen`**: Rechteck Radius 4 (wie „Kennzeichen“ 03 §8.9, nicht Pille), Höhe 20/24, Hintergrund `surface-2`, Rand `line`, links **Mini-Karte** 14 × 9 px (Seitenverhältnis 85,6 : 54) in Stufenfarbe mit 1 px Ring `line-strong`, Text 12/500 in Rolle `--color-bo-ink` (hell und dunkel korrekt). Kein Tint der Datenfarbe. Stufenplan-Farbfeld warnt, wenn die Farbe einem Status-Ton aus 03 §1.2 entspricht („Diese Farbe ist für Status reserviert“). Farbe Privé = Inhaber-Entscheidung (§12 ergänzen). 02 §13 („Messing … Kundenkarte-Stufen“) streichen oder auf diese Regel umschreiben. |
| P13 | **Statusfarben widersprechen 03 §1.5.** Antrag `Bestaetigt` = türkis (03: grün), Karte `Gekuendigt` = grau (03: rot), Einlösung `Eingeloest` ohne Ton (03: grau), `Storniert` rot. | 03 §1.5, Nielsen 4 | Inhaltlich richtig ist: Antrag Bestätigt = türkis (unterwegs, nicht fertig), Gekündigt = grau (Endzustand, kein Problem), Eingelöst = grün (Leistung erbracht), Storniert = grau mit durchgestrichenem Vorteilstitel (Nachweis, kein Fehler). Diese Abweichungen in 03 §1.5 **eintragen** (Zeile „Kundenkarte“) statt nur im Konzept; sonst färbt `statusTon()` anders als das Konzept. |
| P14 | **Zwei Wahrheiten für „wer bekommt den Vorteil“.** `PH Kundenkarte Vorteil.gilt_ab_stufe` (Mindeststufe; JSON: „zusätzlich muss der Vorteil der Stufe zugeordnet sein“) **und** die Zuordnung in `PH Kundenkarte Stufe.vorteile`. Das Konzept zeigt beide (Stufen-Spalten mit Drag **und** Feld im Vorteil-Sheet). Ziehen von „Lieferung“ nach „Platzhirsch“ wirkt nicht, solange `gilt_ab_stufe = Plus` – stumm. Außerdem: Ziehen ändert die Berechtigung vieler Karten ohne Folgeanzeige; „ein Speichern je Stufe“ zerlegt einen Zug in zwei Speichervorgänge. | Nielsen 1/5, 02 §6 | (a) UI zeigt **nur die Zuordnung**; `gilt_ab_stufe` wird beim Speichern serverseitig = niedrigste zugeordnete Stufe gesetzt (Server Action im Next-Backend, keine App-Änderung nötig) und im Vorteil-Sheet nur lesend angezeigt. Bestehende Widersprüche: Warnzeile in der Stufen-Spalte „Lieferung ist zugeordnet, gilt aber erst ab Plus – hier nicht einlösbar · Angleichen“. (b) Speicherleiste fasst alle geänderten Stufen zusammen: „2 Stufen geändert · Lieferung gilt dann zusätzlich für Platzhirsch (330 Karten) · Speichern (⌘S) · Verwerfen“; ein Speichern, nacheinander beide `save`, bei Teilfehler Rücknahme des ersten. (c) Drag-Alternative „Verschieben nach …“ bleibt (WCAG 2.5.7). |
| P15 | **Scan-Suche: Verhalten beim Tippen unklar, drei verschiedene Muster.** §3.4 „öffnet die Karte direkt“ – auch ohne Enter, sobald 8 getippte Zeichen passen? Regex §3.4 `KK-[23456789A-HJ-NP-Z]{6}`, §9.1 `^KK-?[0-9A-Z]{6}$`, §7.2 `^kk[\s-]?[23456789a-hj-np-z]{6}$`. | Nielsen 3 (Kontrolle), 4 | Navigation **nur bei Enter** (oder erkanntem Scan, P1). Beim Tippen einer vollständigen Nummer erscheint als erste Trefferzeile „Karte KK-7K3QX9 öffnen ↵“ (vorausgewählt). Eine Funktion `normalisiereKartennummer()`/`istKartennummer()` in `lib/backoffice/kundenkarte/` (Alphabet aus `utils/karte.py`), genutzt von Liste, Palette, Kiosk, Einlöse-Dialog; Unit-Test mit den Beispielen aus K1. |
| P16 | **Kamera-Scan am iPad baut auf `BarcodeDetector`.** Safari/iPadOS bietet diese API nach meinem Kenntnisstand nicht an (vor Umsetzung im Zielbrowser prüfen); Rückfall laut §7.1 = „Nummer eintippen“. Das iPad ist das Showroom-Gerät. | 02 §11 (iPad), Nielsen 7 | Client-Decoder als Rückfall (z. B. `zxing-wasm` oder `jsQR`, nur auf der Route geladen, ≤ 80 KB-Budget beachten – sonst dynamischer Import beim Öffnen des Kamera-Sheets). Zustände definieren: Kamera-Recht verweigert („Kamera nicht freigegeben – in den iPad-Einstellungen erlauben oder Nummer eintippen“), kein Treffer nach 10 s (Hinweis „Karte näher halten, Licht prüfen“), Treffer (Rahmen `success` 240 ms + Haken, 04 §3.12). Manuelle Eingabe: `autocapitalize="characters"`, `autocomplete="off"`, `spellcheck="false"`, Bindestrich wird automatisch gesetzt. |
| P17 | **Tooltip als einzige Erklärung.** Deaktivierte Knöpfe („Nur Leitung – anfragen“), Primär bei DOI offen, Kanban-Drag-Hinweis, „Letzter Einkauf –“ (Tooltip „keine Auswertung“), Storno-Regel in der Einlösungsliste. Am iPad und für Screenreader nicht erreichbar; „anfragen“ in einem Tooltip ist nicht klickbar. | 03 §8.11 („nie einzige Quelle“), WCAG 1.4.13/2.5.8, 02 §8 | Unter jedem deaktivierten Primärknopf sichtbarer Satz 12 px `muted` („Wartet auf E-Mail-Bestätigung der Kundin“, „Entsperren darf nur die Leitung“) + echter Sekundärknopf **„Leitung bitten“**. Nach dem Klick Zustand **„Angefragt bei Leitung · heute 10:12“** (kein zweites Mal, Aufgabe-Link). Tabellenzellen „–“ bekommen sr-only-Text („nicht ausgewertet“) und eine Legende im Spaltenkopf-Popover. |
| P18 | **Antrag „Karte ausstellen“: Standard der Kontaktwahl undefiniert, wenn Treffer existieren.** „Neuen Kontakt anlegen (Standard, wenn keine Treffer)“ – bei Treffern bleibt offen, was vorausgewählt ist; Enter erzeugt womöglich einen Doppelgänger im CRM. | Nielsen 5, WCAG 3.3.7 / 02 §10 (redundante Eingabe) | Genau ein Treffer mit gleicher E-Mail → „Verknüpfen mit Anna Muster, 6900 Bregenz“ vorausgewählt. Mehrere/unsichere Treffer → **nichts** vorausgewählt, Primär deaktiviert mit Satz „Bitte Kontakt wählen oder ‚Neu anlegen‘“. Treffer-Zeilen zeigen, **worin** sie übereinstimmen (Kennzeichen „E-Mail gleich“, „Name + PLZ gleich“). |
| P19 | **Antrag-Akte mit 4 Tabs für ein kurzes Formular**, Tab „Entscheidung“ bei offenen Anträgen leer („Noch nicht entschieden“). Primäraktion zusätzlich als „Nächste Schritte“ und „Ähnliche Kontakte“ dreifach. | 03 §8.10, 02 §7.1 (kein leerer Bereich ohne Zweck), Nielsen 8 | **Keine Tabs:** Abschnitte Antrag · Einwilligungen (Nachweis-Details wie IP-Hash und Textversion eingeklappt) · Verlauf. Entscheidung erscheint als Band im Kopf, sobald entschieden. Rechte Spalte: Kontakt/Ähnliche Kontakte und Karte; „Nächste Schritte“ entfällt hier (die Primäraktion ist der nächste Schritt). |
| P20 | **Kanban Anträge ohne Nutzen.** Zwei Spalten (Neu, Bestätigt), Drag aus, Website-Anträge werden automatisch angenommen – die Ansicht zeigt fast nie etwas und braucht eigenen Umschalter, Tastaturregel und Tooltip. | 02 §0.1 („ein Muster“), Nielsen 8 | Umschalter „Liste | Kanban“ entfernen; Fixture in Frappe kann bleiben. Liste mit Reitern „Zu entscheiden · Wartet auf Mail · Erledigt“ ersetzt beide Ansichten. K4 streichen. |
| P21 | **Leerzustände fehlen** in: Tab Einkäufe, Wallet & QR (nicht konfiguriert), Verlauf, Bezüge, Side-Peek (laden/fehler/leer), Bezugsvorschläge im Popover, „Ähnliche Kontakte (0)“, Stufen-Spalte ohne Vorteile, Katalog leer, „Zu tun“ leer, Heute-Chips mit 0, Palette mit unbekannter Kartennummer, Berichtsauswahl für Mitarbeiter. | 02 §7.1, 03 §8.18, Nielsen 1 | Texte in Abschnitt 5 übernehmen (je ein Satz + eine Aktion oder Erledigt-Zustand). |
| P22 | **Kassa-Rolle in der Backoffice-Karten-Akte, „UI blendet Umsatz aus“.** Ausblenden ist kein Schutz: `getDoc` liefert `jahresumsatz_cent`, Einwilligungsfelder und Kontakt an den Browser. Zudem hat die Kassa im Kiosk keine Palette (03 §8.13) – der Weg zur Akte existiert nicht. | 05 §8 (Rechte serverseitig), Leitplanke „Kassa nie Umsatz/Kontakt“ | Kassa-Rolle bekommt **keine** Backoffice-Karten-Akte; alles Nötige liegt im Kiosk-Panel (`lookup_card`). Allgemein: Next-DAL filtert Felder je Rolle per Allowlist **vor** der Serialisierung (Server Component), K17 um Netzwerk-Assertion ergänzen („Antwort enthält kein `jahresumsatz_cent`“). |
| P23 | **Schwellen-Geheimnis widersprüchlich.** Mitarbeiter sehen „Umsatz 14.760,00 € · bis Privé 35.240,00 €“, die Schwelle (Summe) soll aber nur Leitung/GF sehen. Euro-Beträge stehen auf einem Bildschirm, auf den die Kundin im Showroom schaut. | Nielsen 4, Datenschutz-Leitplanke | Beträge im Stufenblock für alle Rollen hinter **„Beträge zeigen“** (Icon `eye`, 1 Klick, verfällt beim Verlassen der Akte, `aria-pressed`). Schwelle dann ebenfalls sichtbar (sie ist ohnehin ableitbar) oder für Mitarbeiter gar keine Beträge – Inhaber-Entscheidung, in §12 als **eine** Frage formulieren. |
| P24 | **Hinweisbänder ohne Rangfolge; Dauerband.** Fünf Bandarten, „max. 2“, Reihenfolge offen. „Keine Auswertung der Kaufhistorie“ erscheint auf jeder Karte ohne Einwilligung – voraussichtlich ein großer Teil der Karten → Bannerblindheit, echte Warnungen (Gesperrt) verlieren Gewicht. | Nielsen 8, 02 §0.10 | Rangfolge: Gesperrt > Gekündigt > Beantragt. Einwilligung fehlt = **kein Band**, sondern eine Zeile im Stufenblock („Kaufhistorie wird nicht ausgewertet – Stufe bleibt Platzhirsch · Einwilligung erfassen“). „Stufe manuell“ = Kennzeichen am Stufen-Kennzeichen (P7), kein Band. |
| P25 | **Fokusverlust nach Einlösen.** Nach Einlösung eines limitierten Vorteils verschwindet der Knopf „Einlösen“ der Kachel (Limit erreicht) – der Fokus, der laut Dialog-Regel zum Auslöser zurückkehrt, landet im Nichts (`body`). | WCAG 2.4.3, 04 §3.10 (Fokus programmatisch) | Fokus auf Kachel-Überschrift (`tabindex="-1"`), Live-Region (polite) „Pflegetermin im Jahr eingelöst. 0 von 1 verbleibend, wieder ab 01.01.2027.“ Undo stellt Knopf wieder her und setzt den Fokus darauf. |
| P26 | **Bereichs-Navigation nicht definiert; doppelte Route.** Das Konzept nennt keine Unternavigation. `/kundenkarte/vorteile` ist eigene Route, das Wireframe §3.7 zeigt Stufen und Katalog auf einer Seite. | 02 §2.1, Nielsen 4 | Unternavigation: **Übersicht · Anträge (Zähler) · Karten · Einlösungen · Stufen & Vorteile · Berichte**; Einstellungen als Zahnrad rechts im Seitenkopf (nur Leitung, Mitarbeiter lesend). `/kundenkarte/vorteile` → 307 auf `/kundenkarte/stufen?panel=vorteil:<name>`. Berichte-Liste zeigt nur Berichte, die die Rolle öffnen darf (kein Weg zu `/kein-zugriff`). |
| P27 | **Technik- und Rohwerte in Nutzertexten.** Leerzustand „`after_install` legt … an“, „Zertifikat fehlt in site_config“, „IP-Hash“, „kundenkarte-auswertung-v1“, „Kanal website“, „DOI“/„Double-Opt-in“, Select-Rohwerte „Persoenlich“, „Bestaetigt“, „Gekuendigt“, „Eingeloest“ im Wireframe. | 02 §7.2/§14, Nielsen 2 | Glossar in Abschnitt 6. Select- und Statuswerte immer über Label-Tabelle (Umlaute), IDs/Hashes nur eingeklappt in „Nachweis-Details“, mono, `muted`. |
| P28 | **Planungsnotizen und Abwägungen stehen im Spec bzw. in der UI.** Wireframe §3.7 Fußzeile „Schwellen sind Platzhalter – Inhaber-Entscheidung offen“, Zu-tun „Kanzlei-Freigabe?“, Spec-Sätze „deshalb kurzer Dialog? Nein: …“ (§3.5), „setzt später `stufe_manuell`? Nein: …“ (§3.10), „Filter `berater`? – Filter fehlt“ (§3.8). | Nielsen 2/8; Umsetzbarkeit | Abwägungen aus dem Spec entfernen, Ergebnis als Regel stehen lassen, offene Fragen nur in §12. UI-Texte: „Teilnahmebedingungen ohne Version – vor dem Ausstellen eintragen“ (Leitung, Einrichtungs-Checkliste), kein Hinweis auf interne Entscheidungsprozesse. |
| P29 | **Listen zu breit.** Karten: 9 Standardspalten + 2 optionale; Anträge: 9 Spalten, davon DOI und Status bei Standardfilter redundant (DOI ✓ ⇔ Bestätigt), E-Mail maskiert ohne Unterscheidungswert. Bei 1280 px mit Seitenleiste läuft die Tabelle über. | 01 C2, 03 §8.7, 02 §11.1 (iPad 4 Spalten) | Karten (Standard 6): Karte (mono) · Name · Stufe · Berater (inline) · Letzter Einkauf · Status (nur wenn ≠ Aktiv als Badge in der Namenszelle). Rest über „Spalten“. Anträge (Standard 5): Name (Ort als Untertext) · Quelle · Eingang (mit Zeit-Signal) · Status (Text „wartet auf Mail-Bestätigung“ statt DOI-Spalte) · Hinweis („Karte besteht: KK-…“). Nummer als `muted`-Untertext. iPad: Name · Stufe · Status · Letzter Einkauf. |
| P30 | **Hilfe fehlt.** 02 §8 verlangt Erstbesuchs-Hinweis und Hilfeartikel je Seite; die Begriffe „Vorteil ohne Geldwert“, „Einwilligung Kaufhistorie“, „Stufe manuell“ sind erklärungsbedürftig. | 02 §8, §16 | Artikel `backoffice/hilfe/kundenkarte/{uebersicht,antraege,karten,karte,einloesungen,stufen,berichte,einstellungen}.md`. Erstbesuchs-Sätze in Abschnitt 6.2. Fachbegriffe mit gestricheltem Unterstrich → Popover. |

---

## 2. Klickzahlen nachgezählt (02 §1: ab Zentrale, ohne Suche, Enter = Klick)

| Aufgabe | Konzept §1 | Ist laut Konzept-Weg | Nach Pflichtänderungen | Mit Scan / ⌘K |
|---|---|---|---|---|
| Karte aufrufen | 1 | 3 (Seitenleiste → Karten → Zeile) | 3 | Scan 0 · ⌘K + Name + Enter = 1 |
| Vorteil einlösen | 3 | 6 (… → Zeile → Kachel „Einlösen“ → Bezug → „Einlösen“) | 5 (… → Zeile → Kachel „Einlösen“ → Bezug-Zeile) | Scan + 2 |
| Neue Karte im Showroom | 4 | 9 (Kundenkarte → Neue Karte → Kontakt → Weiter → Haken → Weiter → Weiter → Ausstellen; Druck +1) · über Kundenakte ≥ 10 | 5 (Kundenkarte → Neue Karte → Kontakt wählen → Haken → Ausstellen) | ⌘K „> neue karte“ = 4 |
| Berater ändern | 2 | 4 | 4 (Zielwert passt nicht – Wert in §1 auf 4 korrigieren) | Scan + 3 (Akte → Feld → Wahl) |
| Karte sperren | 3 | 7 (… → Zeile → ⋯ → Sperren → Grund-Chip → Sperren) | 7, aber mit Undo (P8) | Scan + 4 |
| Karte + Begrüßung drucken | 2 | 6 | 5 (Ergebnis-Karte nach Ausstellen: 1) | Scan + 2 (⌘P → Format) |
| Antrag entscheiden (Leitung) | 2 | 6 (Kundenkarte → Kachel → Zeile → Ausstellen → Kontakt → Ausstellen) | 5 bei eindeutigem Treffer (P18: Kontakt vorausgewählt) | – |
| Geburtstagsgruß erledigen | 2 | 2 (wenn „Erledigt“ in der Zentrale-Liste inline) | 2 | – |
| Stufe manuell setzen | 3 | 6 (… → Zeile → Tab Daten → Feld → Wahl → Speichern) | 6 (… → Zeile → Stufen-Kennzeichen → Stufe → Grund-Chip → Festlegen) | Scan + 4 |

Regel für §1: Zielwert und Weg müssen übereinstimmen; wo der Weg ab Zentrale lang bleibt (Kartenaufgaben), ist der Scan der Hauptweg und wird als eigene Spalte gemessen.

---

## 3. Weitere Schwächen (Empfehlungen, keine Blocker)

### 3.1 Komplexität / Klicks
- **Übersicht zeigt „Offene Anträge“ dreimal** (Heute-Chip, Kennzahl, Zu-tun). Heute-Leiste = Arbeitszähler (Anträge zu entscheiden, Geburtstage heute, Einlösungen heute); Kennzahlen = Bestand/Trend (Aktive Karten, Neue Karten 30 Tage, Einlösungen 30 Tage). Chart „Einlösungen je Vorteil“ nach Berichte „Vorteile Nutzung“ verschieben – für den Tagesbetrieb ohne Handlung.
- **„Zu tun“ mischt Tagesarbeit und Einrichtung** (Wallet nicht konfiguriert, Teilnahmebedingungen-Version). Einrichtung als eigene Checkliste „Kundenkarte einrichten“ für die Leitung (01 H3), die verschwindet, wenn alles erledigt ist; „Zu tun“ nur Kundenvorgänge.
- **Drei Filterzeilen in der Kartenliste** (Status-Chips, Stufe/Berater/Kanal-Filter, Suche, dazu gespeicherte Reiter „Ohne Berater“ …). Wie Shop P10: Zeile 1 Reiter (Alle · Ohne Berater · Wartet auf Übergabe · +), Zeile 2 `[Scan/Suche] [Status ▾] [Stufe ▾] [Berater ▾] [+ Filter]`, aktive Filter als Chips.
- **Einlösungsliste: „Gruppieren nach“ als Zeile zwischen Tabelle und Fuß** – gehört in die Werkzeugleiste (`Gruppieren ▾`).
- **„Durch: T. S.“** – Initialen sind mehrdeutig; Avatar 24 + Vorname Nachname gekürzt („T. Steiner“).
- **Packtisch löst „Lieferung im Liefergebiet“ beim „Gepackt“ mit aus** (§7.3) – eine Nebenwirkung, die der Packer nicht sieht. Ergebnis-Karte des Packtischs zeigt Zeile „Kundenkarte: Lieferung im Liefergebiet eingelöst“ mit „Rückgängig“ (8 s, Variante A); ohne diese Zeile keine automatische Einlösung.
- **Kassa-Kurzform ohne Recht** legt nur eine Aufgabe an (§7.2). Die Kassiererin muss der Kundin etwas sagen können: Ergebnis-Karte „Antrag an die Beratung übergeben – Karte folgt per Post“ (Text vom Inhaber freizugeben), nicht stilles Weiterleiten.
- **„Kündigen“ dürfen Mitarbeiter, „Entsperren“ nicht** – irreversibel ist freier als reversibel. Fachkritik klären lassen; UX-Vorschlag: Kündigen nur Leitung oder Vier-Augen über „Leitung bitten“.

### 3.2 Tastatur
- Side-Peek per Leertaste: Leitlinien-Widerspruch (Abschnitt 7). Bereich nicht allein abweichen.
- `Alt+↑/↓` vorige/nächste Karte: gut; zusätzlich im Side-Peek `↑↓` (03 §8.11) – festhalten, dass im Peek kein `Alt` nötig ist.
- Stufenplan `←→` Stufe wechseln: nur bei Fokus im Spaltenkopf (Roving-Tabindex), sonst kollidiert es mit Textcursor im Hinweisfeld der Kindtabelle.
- Palette-Aktionen fehlen: `> vorteil einlösen` (fragt Karte per Scan/Suche), `> neue karte`, `> karte sperren` (nur auf Akte), `? kundenkarte`.
- Popover „Stufe festlegen“ und „Einlösen“: `role="dialog"` mit Fokusfalle, `Esc` schließt, Fokus zurück zum Auslöser.

### 3.3 Barrierefreiheit (WCAG 2.2)
- **Vorteile höherer Stufen „grau“**: Text mindestens `ink-soft` (6,09:1), nicht `disabled-text` (3,22:1) – es ist Information, kein deaktiviertes Element. Kennzeichnung „ab Platzhirsch Privé“ als Text, Icon `lock` 12 px `aria-hidden`.
- **Symbolspalten** (Einwilligung ✓/–, DOI ✓/offen/–): `<span class="sr-only">` mit Klartext; Kopf mit Legende.
- **Stufenleiste**: `<ol>` mit `aria-current="step"` am aktuellen Punkt, Beträge als Text, Punkte Form + Farbe (gefüllt/Ring/hohl) – wie 02 §3.1.
- **Einlöse-Optionen mit Limit**: deaktivierte Radios sind per Tastatur nicht erreichbar; Grund als sichtbarer Text neben der Option, Option bleibt fokussierbar mit `aria-disabled="true"`.
- **QR-Code**: `role="img"`, `aria-label="QR-Code der Kundenkarte KK-7K3QX9"`; Download-Knöpfe beschriftet („SVG laden“, „PNG laden“).
- **Kopier-Knopf Kartennummer**: Live-Region „Kartennummer kopiert“, Icon wechselt 120 ms `copy` → `check`, nach 1500 ms zurück.
- **Kiosk-Vorteil-Chips** (vormerken/lösen): `aria-pressed`, Zustand auch als Text („vorgemerkt“), nicht nur Haken.
- **Farbfeld Stufenfarbe**: Hex-Eingabe + 8 Vorschläge aus Rohfarben 03 §1.2, Live-Kontrastwert gegen `surface` hell/dunkel; < 3:1 → Hinweis „Ring wird ergänzt“ (Ring kommt automatisch).
- **Shake bei unbekannter Karte** im Backoffice: Text bleibt stehen, bis neu getippt wird (nicht 1500 ms Reset wie Kiosk), sonst verschwindet die Fehlermeldung für Screenreader-Nutzer zu früh (WCAG 2.2.1 sinngemäß).

### 3.4 Mobile / iPad / Kiosk
- Telefon (< 640): Konzept erlaubt „Vorteil einlösen / Berater / Aufgabe“ – Abweichung von 02 §11.1 (nur lesen) begründen und in 02 als erlaubte Ausnahme eintragen.
- Karten-Liste und Einlösungsliste < 768 fehlen: Karte „Name · Stufen-Kennzeichen · Letzter Einkauf“, Wischen links = Berater zuweisen, rechts = Einlösen (öffnet Popover als Bottom-Sheet).
- Anträge mobil: Wischen rechts „Ausstellen“ öffnet einen Dialog – 02 §11.2 belegt Wischen rechts mit „Erledigt“ (sofort). Konsistent: Wischen rechts nur für sofortige Aktionen; „Ausstellen“ als Knopf in der Karte.
- iPad-Kacheln: 2 Spalten, Knopf „Einlösen“ volle Breite 44 px (02 §11.2), nicht 52 px Kachelhöhe als „Ziel“ – Ziel ist der Knopf.

### 3.5 Visuell / Modernität
- **Kopf der Karten-Akte überladen**: Name, Link, Nummer, Kopieren, Status, Stufe, seit, Primär, ⋯, Kanal, ausgestellt, Berater, Wallet Apple, Wallet Google. Vorschlag:
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ┌──────────┐  Anna Muster                                      [Vorteil einlösen ⌘↵] [⋯] │
│ │▓▓▓▓▓▓▓▓▓▓│  [▭ Platzhirsch Plus] seit 14.03.2026 · KK-7K3QX9 ⧉ · Berater A. Berger      │
│ │ KK-7K3QX9│  (Status-Badge nur wenn ≠ Aktiv)                                            │
│ └──────────┘  Mini-Karte 120 × 76 px in Stufenfarbe (Druck-/Wallet-Vorschau)             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
  Mini-Karte: Klick dreht auf Rückseite (QR + Datenschutztext), 240 ms `--bo-ease-inout` `rotateY 0→180°`, bei `reduce` Crossfade 120 ms; `button` mit `aria-label="Kartenrückseite zeigen"`. Wallet-Zustand und Kanal in Tab „Details“.
- **Vorteil-Kacheln**: Art als Icon statt Rohwert („Persoenlich“): lucide `truck` (Lieferung), `wrench` (Montage), `droplets` (Pflege), `calendar-heart` (Event), `life-buoy` (Service), `user-round` (Persönlich), `circle-dot` (Sonstiges). Limit als Text „1 je Kalenderjahr · 0 verbleibend“, Fortschritt 4 px `accent` `aria-hidden`.
- **„genutzt +1“ optimistisch**: Direktwechsel der Zahl (kein Hochzählen, 04 §3.7 „nicht bei Zählern im Kleinformat“ sinngemäß) + Kachel-Hintergrund `accent-soft` → transparent 1200 ms (04 §2.3 Zeilen-Hervorhebung).
- **Wireframe-Zeichen** (🔍, ⊘, ✓, ●) im Spec durch lucide-Namen ersetzen (`search`, `ban`, `check`, Status-Punkt-Form nach 03 §1.5).
- **Stufenblock** mit Linie + Punkten + Beträgen + „Stand … · Neu berechnen“ + Hinweis ohne Einwilligung: in einer Zeile kompakt (Höhe 64), „Neu berechnen“ als Icon-Knopf `refresh-cw` mit Label im Tooltip **und** `aria-label` (Icon-Leiste-Ausnahme 02 §13), Stand-Zeit `muted`.

### 3.6 Unklar / widersprüchlich im Dokument
- §2.2 „Kassa Mitarbeiter: Karten lesend … Zugriff über Palette-Treffer“ vs. 03 §8.13 „Kiosk: Palette nicht verfügbar“ → durch P22 erledigt.
- §3.6 Einlösungen „Storno heute durch dich“ (Dialogtext) – bei Einlösung im Backoffice nach 23:59 Ablauf; Zeitbezug „bis heute 23:59“ ausschreiben.
- §3.7 Speichern-Toast „jetzt neu berechnen?“ führt auf eine Sammelmethode, die fehlt (§9). Bis dahin Knopf nicht anbieten; Text „Karten werden heute Nacht neu eingestuft.“
- §3.8 Zeitraum „localStorage“ vs. 03 §4 (Benutzereinstellung serverseitig, localStorage nur Rückfall) – angleichen.
- §4.4 Massenaktion „Umsatz neu berechnen“ n × Methode mit Fortschritt „12/40“ – Laufzeit je Karte unbekannt, 8-s-Timeout (02 §12) je Aufruf; Fortschritt `aria-live` alle 5 Einheiten, Abbruch nach aktuellem Dokument (wie Shop-Kritik 2.2).
- K5 prüft 5 s, K20 „Toast-Balken steht mit Sekundenzähler“ – nach P8 auf 8 s ändern.

---

## 4. Kürzeltabelle Kundenkarte (ersetzt §2.3)

| Kontext | Kürzel | Wirkung | Bemerkung |
|---|---|---|---|
| global | `G` dann `K` | Bereich Kundenkarte | 05 §1; Scan-Tor P1 |
| global | Scan `KK…` + Enter | Karte öffnen | nur ohne fokussiertes Feld oder `data-scan="ja"` (P2) |
| Liste | `/` Suche/Scanfeld · `↑↓` · `Enter` öffnen · `N` Neue Karte · `A` Berater zuweisen · `X` auswählen · `1–4` Statuschips | | `A` = Zuweisen wie 02 §9.2 |
| Liste | Leertaste | Side-Peek **oder** Auswahl | Leitlinien-Entscheidung (Abschnitt 7) |
| Karten-Akte | `⌘/Strg+Enter` | Primäraktion je Zustand (Einlösen · Aktivieren · Entsperren · Neue Karte) | Tooltip „Vorteil einlösen · ⌘↵“ |
| Karten-Akte | `⌘/Strg+P` | Drucken-Menü (Karte · Begrüßung · beides) | 02 §9.1 |
| Karten-Akte | `.` | Aktionsmenü (Sperren …, Kündigen …, Pass erneuern, Aufgabe, Kundenakte) | `.` in 02 §9.1 aufnehmen |
| Karten-Akte | `Alt+1…4` | Tabs Vorteile · Verlauf · Einkäufe · Details | 02 §9.4 |
| Karten-Akte | `Alt+↑/↓` | vorige/nächste Karte der Liste | 02 §9.1 |
| Antrag-Akte | `⌘/Strg+Enter` | Karte ausstellen | Ablehnen/Doppelt nur über Knopf/Menü |
| Einlöse-Popover | `↑↓` · `Enter` einlösen · `Esc` | | ein Enter = Einlösung (mit Undo) |
| Toast | `⌘/Strg+Z` (und `Z` laut 04, siehe Abschnitt 7) | Rückgängig | |
| Einstellung | Benutzer-Menü „Tastenkürzel mit Einzeltasten“ an/aus | WCAG 2.1.4 | gilt für alle Bereiche |

Entfallen: `V`, `W`, `K`, `P`, `E`, `1–6` (Akte), `A`/`D`/`R`/`S` (Antrag-Akte), `S` (Einlösungs-Sheet), `Enter` dann `A` (Liste).

---

## 5. Leerzustände und Fehlerfälle (Ergänzung zu §3, Texte übernehmen)

| Ort | Fall | Text | Aktion |
|---|---|---|---|
| Tab Einkäufe | noch nie | „Noch keine Einkäufe mit dieser Karte oder diesem Kontakt.“ | – |
| Tab Einkäufe | ohne Einwilligung | Belege sichtbar, Zeile oben: „Kaufhistorie wird nicht ausgewertet – keine Summen.“ | „Einwilligung erfassen“ (springt zu Details › Einwilligung) |
| Details › Wallet | nicht konfiguriert | „Wallet-Pässe sind noch nicht eingerichtet. Die Karte funktioniert ohne Pass.“ | Leitung: „Einstellungen öffnen“ |
| Tab Verlauf | leer (gefiltert) | „Keine Einlösungen bisher.“ | „Filter zurücksetzen“ |
| Bezüge | nichts verknüpft | „Noch keine Belege, Aufgaben oder Serviceleistungen.“ | – |
| Side-Peek | laden / Fehler | Skeleton Kopf 56 + 3 Kacheln 88 · „Karte nicht geladen.“ | „Erneut“, „Vollansicht öffnen“ |
| Einlöse-Popover | keine offenen Belege | „Keine offenen Belege der Kundin.“ | Zeilen „Ohne Bezug“, „Anderen Beleg suchen …“ bleiben |
| Einlöse-Popover | Belegsuche nicht erreichbar | „Belegsuche gerade nicht möglich.“ | „Ohne Bezug einlösen“, „Erneut“ |
| Antrag › Ähnliche Kontakte | 0 Treffer | „Kein ähnlicher Kontakt gefunden – beim Ausstellen wird ein neuer angelegt.“ | – |
| Stufen-Spalte | ohne Vorteile | „Dieser Stufe ist noch kein Vorteil zugeordnet.“ | „+ Vorteil zuordnen“ |
| Katalog | leer | „Noch keine Vorteile. Vorteile sind Leistungen wie Lieferung oder Pflegetermin – ohne Geldwert.“ | „Vorteil anlegen“ |
| Stufenplan | keine Stufen | „Noch keine Stufen angelegt.“ | Leitung: „Standardstufen anlegen“ (erst wenn Methode existiert, sonst „Administrator bitten“) |
| Übersicht › Zu tun | leer | „Alles erledigt – nichts offen.“ (Häkchen Sand 32 px) | – |
| Heute-Chips | 0 | Chip zeigt „0“ in `muted`, nicht klickbar (`aria-disabled`) | – |
| Palette | Kartennummer unbekannt | „Keine Karte KK-7K3QX9. Nummer prüfen oder nach Namen suchen.“ | – |
| Kamera-Sheet | Recht verweigert | „Kamera nicht freigegeben. In den iPad-Einstellungen erlauben oder Nummer eintippen.“ | Feld „Kartennummer“ |
| Fehler nach verzögertem Commit | Seite gewechselt | Fehler-Toast bleibt: „Einlösung für Anna Muster nicht gespeichert – Limit erreicht.“ | „Zur Karte“ |
| Umsatz neu berechnen | > 2 s | Knopftext „Berechnet …“ nach 300 ms, ab 2 s Zeile „Dauert länger als gewohnt …“ (02 §12) | – |
| Wallet-Pass erneuern | Fehler | „Pass konnte nicht aktualisiert werden.“ | „Erneut“ |
| „Leitung bitten“ | schon angefragt | „Angefragt bei Leitung · heute 10:12“ | „Aufgabe öffnen“ |

---

## 6. Texte

### 6.1 Glossar (Oberfläche statt Rohwert/Technik)

| Statt | Oberfläche |
|---|---|
| DOI, Double-Opt-in | „E-Mail-Bestätigung“ (Hilfe-Popover erklärt den Begriff) |
| `Bestaetigt` / `Gekuendigt` / `Eingeloest` / `Persoenlich` | „Bestätigt“ / „Gekündigt“ / „Eingelöst“ / „Persönlich“ |
| Kanal `website` / `showroom` / `kassa` | „Website“ / „Showroom“ / „Kassa“ |
| Bezug, Bezugsbeleg | „Beleg“ („zu Beleg BE-2026-0210“) |
| Startstufe | Name der Stufe („Platzhirsch“) |
| Bewertungszeitraum | „letzte 12 Monate“ (Zahl aus Einstellung) |
| IP-Hash, Textversion-ID, Seriennummer | nur in „Nachweis-Details“ (eingeklappt, mono, `muted`) |
| `after_install`, `site_config`, Zertifikat | „Wallet ist noch nicht eingerichtet – Administrator“ |
| `stufe_manuell` | „Stufe von Hand festgelegt“ |
| Umsatz berechnet (automatisch) · 5 Belege | „Einstufung geprüft · 5 Einkäufe berücksichtigt“ |

### 6.2 Erstbesuchs-Hinweise (je ≤ 2 Sätze, 02 §8)
- Übersicht: „Hier siehst du, was bei der Kundenkarte heute ansteht. Vorteile sind Leistungen wie Lieferung oder Pflegetermin – nie Rabatt oder Guthaben.“
- Karten: „Karte scannen oder Namen tippen öffnet die Karte direkt.“
- Karten-Akte: „Einlösen erfasst eine Leistung als Nachweis. Rückgängig geht 8 Sekunden lang, danach über ‚Stornieren‘.“
- Anträge: „Website-Anträge werden nach der E-Mail-Bestätigung automatisch zur Karte. Hier landen nur Anträge, die eine Entscheidung brauchen.“
- Stufen & Vorteile: „Kundentexte werden beim Tippen geprüft: keine Beträge, Prozente oder Superlative.“

---

## 7. Widersprüche in den Leitlinien, die die Kundenkarte erbt (an Fundament/UX-Lead)

| Thema | 01 | 02 | 03 | 04 | 05 | Kundenkarte | Vorschlag (gleich wie Shop/Service/Personal) |
|---|---|---|---|---|---|---|---|
| Undo-Dauer | 6 s (D3) | 8 s | 8 s | 5 s | – | 5 s und 8 s | **8 s**; 04 §3.6 anpassen |
| Undo-Taste | – | ⌘Z | – | `Z` | – | `Z` | ⌘/Strg+Z; `Z` nur zusätzlich, abschaltbar (WCAG 2.1.4) |
| Toast-Position | unten links | unten Mitte | unten rechts | unten rechts | unten rechts | – | unten rechts |
| Leertaste in Listen | Peek | auswählen | auswählen | – | – | Peek | Peek, `X` auswählen |
| Akte-Tabs | – | Alt+1…9 | – | – | 1–9 | 1–6 | Alt+1…9 |
| Messing | – | Stufen-Farbe (§13) | Fokus dunkel, Chart 4 | – | – | Datenfarbe je Stufe | 02 §13 auf `StufenKennzeichen` (P12) umschreiben |
| Statusfarbe „Bestätigt“ | – | – | grün | – | – | türkis | 03 §1.5 je Bereich präzisieren (P13) |
| Statusfarbe „Gekündigt“ | – | – | rot | – | – | grau | grau (Endzustand ohne Problem) |
| Scan in Textfeldern | B4 | nie, außer `data-scan="ja"` | – | – | – | überall, außer `data-scan="nein"` | 02-Regel (P2) |
| Einzeltasten-Kürzel abschaltbar | – | fehlt | – | – | – | fehlt | Schalter im Benutzer-Menü in 02 §9 aufnehmen |
| Telefon < 640 | – | nur lesen | – | – | – | Einlösen erlaubt | Ausnahme in 02 §11.1 eintragen |

---

## 8. Was gut ist und so bleiben soll

- Fachliche Leitplanken als Bedienlogik: „–“ statt 0 €, Euro nur mit Einwilligung, Kiosk ohne Kontakt/Umsatz (K9, K13).
- Primäraktion je Kartenzustand (Aktiv/Beantragt/Gesperrt/Gekündigt) – mit ⌘Enter (P3) vollständig.
- Einlösung als verzögerter Commit mit `flush()` bei Navigation; Fehlercodes aus `MELDUNG` im Klartext.
- Kanban-Drag aus mit Begründung (DOI-Nachweis nicht umgehbar) – konsequent zu Ende gedacht führt das zu P20.
- Live-Textprüfung im Stufenplan mit derselben Regel wie der Server (K11).
- „Ohne Einkauf“ wird Aufgabe beim Berater, Karten ohne Einwilligung „nicht beurteilbar“ statt „inaktiv“.
- Ergebnis-Karte nach dem Ausstellen mit „Karte + Begrüßung drucken“ und „Nächster Antrag“ (04 §3.13).
- Datenmapping §9 mit markierten Lücken; Akzeptanzkriterien messbar.

---

## 9. Ergänzungen zu den Akzeptanzkriterien (§10)

| # | Kriterium | Prüfung |
|---|---|---|
| K27 | Scan-Simulation (10 ms Zeichenabstand) auf Karten-Akte, Antrag-Akte, Liste, Stufenplan löst **kein** Kürzel aus und öffnet nur die gescannte Karte; Scan in Kommentarfeld bleibt Text | E2E |
| K28 | Einzeltasten-Kürzel aus (Benutzer-Menü) → `A`, `X`, `N`, `.` wirkungslos, ⌘-Kürzel bleiben | E2E |
| K29 | Kundenmodus: Seitenleiste, Palette, Browser-Zurück nicht erreichbar; Rückkehr nur nach Langdruck/PIN; Idle 2 min → Beraterin, Eingaben erhalten | E2E iPad-Viewport |
| K30 | Einlösen aus Kachel-Popover: Klick auf Belegzeile = 1 Einlösung nach 8 s; Fokus danach auf Kachel-Überschrift; Live-Region liest Restkontingent | E2E + Screenreader |
| K31 | `StufenKennzeichen` hell und dunkel ≥ 4,5:1 Text, Mini-Karte ≥ 3:1 oder Ring; Form unterscheidet sich vom StatusBadge (Radius 4 vs. Pille) | axe + Snapshot |
| K32 | Kassa-Rolle: keine Antwort des Backoffice enthält `jahresumsatz_cent`, E-Mail, Telefon | Netzwerk-Assertion |
| K33 | Zuordnung „Lieferung → Platzhirsch“ speichern setzt `gilt_ab_stufe` passend; Warnzeile erscheint bei abweichenden Altdaten | E2E Mock + Frappe |
| K34 | Klickwege aus Abschnitt 2 („nach Pflichtänderungen“) werden gemessen und eingehalten | E2E |

*Ende 20 – Kritik UX Kundenkarte.*
