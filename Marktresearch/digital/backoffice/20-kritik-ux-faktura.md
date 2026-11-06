# 20 – UX-/UI-Kritik Bereich „Faktura“ (zu `10-konzept-faktura.md`)

**Zweck:** Strenge Prüfung des Faktura-Konzepts gegen Nielsen-Heuristiken, WCAG 2.2 AA, Mobile/iPad-Regeln und die Leitlinien 01–05. Ergebnis: Note, Pflichtänderungen vor dem Bau (je mit Abnahmekriterium), Empfehlungen, korrigierte Klickzahlen, verbindlicher Kürzel-Vorschlag, korrigierte Wireframes, Widersprüche in 01–05, die Faktura erbt.
**Stand:** 2026-11-04 · Rolle: UX-/UI-Kritiker · Geprüft: `10-konzept-faktura.md` (722 Zeilen, vollständig), `01-benchmark-prinzipien.md` (A6, C2, D10), `02-ux-leitlinien.md` (§0, §1.3, §2.1, §6, §7, §9, §10), `03-design-system.md` (§1.3–1.6, §8.7–8.15), `04-motion.md` (§2, §3.6, §3.13), `05-informationsarchitektur.md` (§2, T2/T3/T5, §3.5, Z. 526/606/831), `40-qa-befunde-basis.md`, zum Abgleich `20-kritik-ux-shop.md` (gleiche Kürzel-Regel).
**Status:** Prüfbericht, keine Inhaber-Entscheidung.

---

## 0. Urteil

**Note: 6 / 10.**

**Stark (beibehalten):** lückenloses Datenmapping mit markierten Lücken (§9, §12) – der Bau-Agent erfindet nichts; Primäraktion je Zustand für jede Akte; Pflichtangaben-Prüfer live im Entwurf mit Sprunglinks; Bank-Vorschlag mit Grund und Sicherheit in der Zeile; fixierte PDF statt Neu-Rendering (Beweiskraft); drei Leerzustandstypen als Muster; Steuerberater als eigene Rolle mit schmaler Startseite; Präsentationsmodus am iPad ohne EK/Marge; QA-Kriterien messbar (§10).

**Schwach (muss vor dem Bau geändert werden):**
1. **Die häufigste und geldwirksame Tagesroutine (Bank zuordnen) bucht mit `Enter` ohne Undo und ohne Rückfrage** – und `Enter` heißt überall sonst „öffnen“.
2. **Tastenkürzel kollidieren zwölffach** mit 02/04/05 und teils innerhalb derselben Seite (`p` = Druckvorschau **und** Projekt in der Rechnungsakte; `Alt+↑↓` = nächster Beleg **und** Position verschieben; `x` = Auswahl **und** Eingangsrechnung ablehnen).
3. **„Gegenaktion fehlt → Rückfrage statt Undo“** ist falsch abgeleitet: 04 §3.6 Variante A (verzögerter Commit) löst genau diesen Fall ohne Modal. Das Freigeben-Undo über `zurueck_an_erfassung` stellt nicht den alten Zustand her.
4. **Klickzahlen in §1 stimmen nicht mit den beschriebenen Wegen** (Schlussrechnung „3“ = real 6, Angebot „4“ = real 7, Mahnlauf „3“ = real 6) und weichen zusätzlich von 02 §1.3 ab.
5. **Zu viel gleichzeitig:** Rechnungs- und Auftragsakte je 7 Tabs und 5 Kopfzeilen vor dem Inhalt; dieselbe Aktion an drei Stellen derselben Seite; Rechnungen-Liste mit Reitern **und** Status-Chips für dieselben Zustände; Mahnen an sechs Einstiegen mit zwei verschiedenen Abläufen.
6. **Statusfarben weichen an 4 Stellen von 03 §1.5 ab**, Sand als Textfarbe unterschreitet 4,5:1, Ausgänge in Rot.
7. **Fehlende Leer- und Fehlerzustände** in Akte-Tabs, Assistenten, Side-Peek und bei Netzabbruch während „Stellen“.

Maßstab Linear/Stripe/Shopify: Das Konzept ist fachlich tiefer als marahplus, wirkt in den Wireframes aber wie eine gut sortierte ERP-Maske – viele gleichwertige Zeilen, Balken, Chips und Zähler. Modern wird es erst durch **Weglassen**: eine Arbeitsliste als Startpunkt, eine Filterzeile, ein Fortschrittsband, fünf Tabs, ein Kürzelsystem.

---

## 1. Pflichtänderungen (vor Umsetzung, nach Wirkung sortiert)

| Nr. | Befund (Ort in 10) | Verstoß gegen | Änderung (konkret) | Abnahme |
|---|---|---|---|---|
| P1 | **Bank: `Enter` = Zuordnen bei Sicherheit 100, sofort gebucht, kein Undo, keine Rückfrage** (§2.6, §4.2, §11 Nr. 1). `Enter` öffnet in jeder anderen Liste (02 §9.2, 03 §8.7, 05 T2). Ein Mitarbeiter, der in der Bank „nur ansehen“ will, bucht eine PH Zahlung. Gleichzeitig verlangt U-06 Rückfrage für „Zuordnen < 100“ – für 100 ist nichts geregelt. Massenaktion „Sichere zuordnen (n)“ ohne Rückfrage. | 02 §6.2 (geldwirksam), 02 §9.2, Nielsen 4 + 5 | `Enter` = Side-Peek öffnen/fokussieren (wie überall). **Zuordnen = Zeilenknopf oder `Shift+Enter`.** Ausführung als **verzögerter Commit** (04 §3.6 Variante A): Zeile blendet sofort aus (160 ms `--bo-dur-base`, `--bo-ease-in`), Fokus springt auf die nächste offene Zeile, Toast „Zuordnung RE-2026-00042 · 6.240,00 € · Rückgängig (Z)“ mit Undo-Balken; `zuordnen()` läuft erst nach Ablauf bzw. bei `pagehide`. Mehrere Zuordnungen hintereinander = mehrere ausstehende Commits, Stapel max. 3, beim 4. wird der älteste sofort committet. Massenaktion „Sichere zuordnen (n)“ = Rückfrage sm 400 „4 Umsätze über 21.300,00 € zuordnen?“ mit Liste. Anfrage an Backend: `zuordnung_aufheben()` (Leitung) für Korrekturen nach dem Commit. U-06 ergänzen. | E2E: `Enter` auf Bankzeile bucht nie; Zuordnen → Undo innerhalb der Frist → kein PH Zahlung-Datensatz; Seitenwechsel während Frist → genau ein PH Zahlung. |
| P2 | **Kürzel kollidieren** (§2.2–2.7, §3.1, §6.2): `a` (02: Zuweisen ↔ 10: Primäraktion / Auftrag öffnen), `s` (02: Status ↔ Senden / Sachlich prüfen), `x` (02/01: Auswahl ↔ ER ablehnen), `z` (04 §3.6: Undo ↔ Zahlung erfassen), `g` (05: Gehe-zu-Sequenz ↔ Gutschrift), `m` (02/03/05: Kanban-Verschieben ↔ Mahnen – im Rechnungen-Kanban beides aktiv), `p` (Druckvorschau ↔ Projekt **in derselben Akte §3.1**), `f` (05 T2: Filter ↔ Freigeben ↔ Präsentationsmodus), `→` (02: Seite blättern ↔ Side-Peek Bank), `Alt+↑↓` (02: nächster Datensatz ↔ Position verschieben, **beide in §3.1**), Leertaste (02/03: Auswahl ↔ Side-Peek §2), `Backspace` in leerer Zeile (02: `⌘Backspace`). Folge: `x` beim Durchgehen von Eingangsrechnungen öffnet „Ablehnen“, `g z` öffnet Gutschrift statt Zentrale. | 02 §9, 04 §3.6, 05 §2, Nielsen 4 + 5, WCAG 2.1.4 | Tastenbelegung §4 dieser Datei verbindlich übernehmen: Einzelbuchstaben bleiben global (gleiche Regel wie Kritik Shop P2); Faktura-Aktionen nur über `Shift+Buchstabe`; Primäraktion der fokussierten Zeile `Shift+Enter`, der Seite `⌘/Strg+Enter`. Alle Kürzel im Tooltip, im Zeilen-Menü rechts (`muted` 12 mono) und im Hilfe-Panel `?`. WCAG 2.1.4: Einzelbuchstaben im Benutzer-Menü abschaltbar. | Kürzel-Registry-Test: keine Taste in zwei Bedeutungen je Kontext; `x` wählt in jeder Liste aus. |
| P3 | **Undo falsch ersetzt bzw. falsch umgesetzt** (§4.1, §4.2): Angebot „Ablehnen“, „Ablaufen lassen“, Mahnung „Erledigt“ → „Gegenaktion fehlt → Rückfrage statt Undo“. ER „Freigeben“ → Undo über `zurueck_an_erfassung` setzt auf **Erfasst**, nicht zurück auf **Sachlich geprüft**; Prüfer muss erneut prüfen, Prüfvermerk-Historie wird unklar. Undo-Dauer: 02 und 10 sagen 8 s, 04 §3.6 sagt 5000 ms. | 02 §0.4 + §6.1, 04 §3.6, Nielsen 3 | Für alle drei Fälle und für Freigeben: **Variante A** (verzögerter Commit). Optimistisch Status zeigen, Methode erst nach Ablauf. Damit kein einziges Modal mehr für umkehrbare Statuswechsel. Ablehnen-Grund bleibt im Popover **vor** dem Toast. Dauer einheitlich **8 s** (02 ist der Grundsatz; 04 §3.6 korrigieren). | Freigeben → Undo → Status „Sachlich geprüft“ mit unverändertem `geprueft_von/am`. |
| P4 | **Klickzahlen in §1 nicht nachvollziehbar** und abweichend von 02 §1.3 (Zuordnen 2 ↔ 1, Schlussrechnung 2 ↔ 3, ER freigeben 2 ↔ 1). Beispiel Anzahlungsrechnung „2“: Zentrale → Faktura → Aufträge → Zeile → „Anzahlung anfordern ▾“ → „Anzahlungsrechnung stellen“ → „Stellen“ = 7 ab Zentrale. Außerdem heißt die Aktion in §1 „Anzahlungsrechnung stellen“, in §2.3 „Anzahlung anfordern“, in §3.3 „Anzahlung anfordern ▾“. | 02 §0.3, U-01 | Zähl-Regel festschreiben: **ab Zentrale, Klick = Klick/Enter, Weiter in Assistenten zählt.** Wege über „Zu tun“ der Zentrale führen (Zeile = Aktion). Tabelle §3 dieser Datei übernehmen; 02 §1.3 nachziehen. Aktion einheitlich benennen (§2.1). | E2E misst die Wege aus §3; Abweichung > 0 = Fehler. |
| P5 | **Stellen-Dialog** (§4.3): (a) zeigt „RE-2026-00043 wird vergeben“, obwohl §4.3 selbst sagt, die Nummernvorschau fehlt in der App – Wireframe und Text widersprechen sich; „Vorschau, nicht garantiert“ verunsichert bei einem Rechtsbeleg. (b) Fehlen Pflichtangaben, bleibt „Stellen“ klickbar und der Dialog „listet Fehlendes“ – ob der Dialog-Knopf dann aktiv ist, bleibt offen. (c) Nach dem Stellen folgt für den Normalfall ein zweiter Dialog „Senden“ – zwei Modals für einen Vorgang. (d) `⌘Enter` im Formular öffnet den Dialog, Tastenwiederholung kann das `Enter` sofort bestätigen. (e) Kein Verhalten bei Zeitüberschreitung/Netzabbruch während `stellen()` (Nummer vergeben oder nicht?). | Nielsen 1, 5, 9; 02 §6.2; 03 §8.11 | (a) Text immer „Eine fortlaufende Rechnungsnummer wird vergeben.“ – Nummer erst in der Ergebnis-Karte. (b) Fehlen Angaben: Dialog-Titel „Noch nicht stellbar – 2 Angaben fehlen“, Liste mit „Zum Feld →“ (schließt Dialog, fokussiert Feld, Tab-Fehlerpunkt 03 §8.10), Knopf „Stellen“ `disabled` mit sichtbarem Grund darunter (nicht nur Tooltip). (c) Checkbox im Dialog „Danach per E-Mail an m.muster@… senden“ (Standard an, wenn E-Mail vorhanden; Vorlage aus 6.3, „Text ansehen“ klappt die Nachricht im Dialog auf). Knopf wechselt zu „Stellen und senden“. (d) Tasten-Entprellung: `Enter` wird in den ersten 300 ms nach Öffnen ignoriert; `keydown.repeat` nie bestätigen. (e) Zeitüberschreitung (> 10 s): Dialog zeigt „Status wird geprüft …“ und liest den Beleg neu (`idempotency_key`); Ergebnis entweder Ergebnis-Karte oder „Nicht gestellt – erneut versuchen“. Nie „Fehler“ ohne Klärung des Nummernzustands. | F-01 erweitert: Dialog-Knopf `disabled`; Doppel-Enter erzeugt nichts; Netztrennung nach Absenden → Endzustand eindeutig angezeigt. |
| P6 | **Statusfarben weichen von 03 §1.5 ab:** Angebot „Abgelaufen“ orange (03: grau) · Auftrag „Geliefert“ orange (03: grün) – „Teilgeliefert“ und „Geliefert“ sind dadurch in der Liste nicht unterscheidbar · ER „Freigegeben“ orange (03: türkis) · Export „Übergeben“ orange (03: türkis). Stand-Balken „Abgerechnet orange“ signalisiert Warnung für Normalfortschritt. Bank-Ausgänge in `danger-text`. | 03 §1.5 („grau → blau → türkis → orange → grün“, Rot nur Problem), 02 §0.10, Nielsen 4 | Töne exakt nach 03 §1.5. Ausgänge: Minus `−8.900,00 €` in `ink`, Icon `arrow-up-right` 14 px `muted` davor; Eingänge `ink` + `arrow-down-left`. Rot nur für Gemahnt/Uneinbringlich/Storniert/Fehler. Stand-Balken siehe P8. | axe + Sichtprüfung: Statuston je Zustand = Tabelle 03 §1.5. |
| P7 | **Sand als Textfarbe:** Zeit-Signal „Sand ≤ 7 Tage“ (§2.2, §2.4), Skonto „Sand ≤ 3 Tage“ (§2.7), Kennzahl-Label „`caption` Sand“ (§5). `#8a7a66` auf Weiß = 4,15:1 (03 §1.6, gemessen) < 4,5:1. Zeit-Signal unterscheidet sich zudem nur über Farbe (rot / Sand / grau). | WCAG 1.4.3, 1.4.1; 03 §0.6 | Text in `bo-accent-text` `#6b5d4b` (6,38:1) bzw. dunkel `#d8ccb8`. Zeit-Signal immer mit Form: überfällig `triangle-alert` 12 px + „12 T überfällig“, bald `clock` 12 px + „in 3 Tagen“, später nur Datum. Sand bleibt für Flächen, Linien, Icons (≥ 3:1 erfüllt). | axe 1.4.3 = 0 in hell und dunkel; Zeit-Signal ohne Farbe (Graustufen-Screenshot) unterscheidbar. |
| P8 | **Akten zu voll** (§3.1, §3.3): je 7 Tabs (03 §8.10: > 6 → `⋯`; ausgerechnet „Verlauf“ landet im Menü); 5 Kopfzeilen vor dem Inhalt (Titel, Vorgangsleiste, Belegkette, Banner, Tabs) – bei 1280 × 800 rückt die Summenkarte aus dem ersten Bildschirm (im Bau messen); „Zahlung erfassen“ steht dreimal auf derselben Seite (Primärknopf, Zahlungskarte, Nächste Schritte); Auftrag zeigt vier farbige Stand-Balken plus Vorgangsleiste. | 02 §0.2 (eine Primäraktion), 03 §8.10, Nielsen 8 | **Rechnung:** Übersicht · Positionen · Zahlung & Mahnung · Steuer & Texte · Verlauf (5). **Auftrag:** Übersicht · Positionen · Zahlungsplan & Rechnungen · Lieferung & Montage · Verlauf (5); Texte als einklappbarer Abschnitt in Übersicht. **Belegkette** wird Teil der Vorgangsleiste: unter dem Punkt „Auftrag“ steht `AB-…17`, unter „Rechnung“ `RE-…42`; Punkte sind `<button>` (05 T5), aktueller mit `aria-current="step"`. **Stand im Auftrag** = ein Band 8 px mit drei Markierungen statt vier Balken: Fläche `ink` = bezahlt, Schraffur `ink` 40 % = abgerechnet, Rahmen = geliefert; rechts daneben ein Satz „Bezahlt 40 % · abgerechnet 40 % · geliefert 75 % · Anzahlung ✓“; Werte als `<dl>` für Screenreader. „Nächste Schritte“ zeigt nie die Primäraktion. Banner max. 1 (Rang: Storniert > Exportiert > Entwurf-Hinweis), weitere als Zeile im Tab Übersicht. | Bei 1280 × 800 ist die Summenkarte ohne Scrollen sichtbar; jede Aktion genau 1× sichtbar + 1× im `⋯`. |
| P9 | **Listen-Filter doppelt** (§2.4): Rechnungen hat 7 Reiter **und** 8 Status-Chips (Überfällig in beiden), plus Art, Zeitraum, Suche. Gleich bei Aufträgen (5 Reiter + 6 Chips + KW), Eingangsrechnungen (6 + 5). **Offene Posten** (§2.5) ist eine zweite Rechnungen-Liste mit 14 Spalten. Unternavigation: 7 Pills + Mehr, Zahllauf und Journal haben gar keinen Navigationsplatz. | 01 C2 (eine Filterzeile), 02 §2.1, Nielsen 8 | Zeile 1 = gespeicherte Ansichten (Reiter); Zeile 2 = `[⌕] [Status ▾] [Art ▾] [Zeitraum ▾] [+ Filter]`, aktive Filter als Chips (03 §8.9). Status-Chip-Reihe entfällt; `1–9` schaltet die Reiter. **OP wird Reiter „Offene Posten“ in Rechnungen** (Stichtag-Feld, Altersbalken, Gruppierung je Kunde erscheinen nur dort); Report bleibt unter Berichte für Steuerberater. Pills: Übersicht · Angebote · Aufträge · Rechnungen · Bank · Eingangsrechnungen · Mehr ▾ (Gutschriften, Mahnungen, Zahllauf, Export, UVA, Berichte, Journal, Stammdaten). Standardspalten je Liste ≤ 8, Rest über Spaltenwahl. | Jede Liste hat genau eine Filterzeile; keine Route ohne Navigationseintrag. |
| P10 | **Mahnen: sechs Einstiege, zwei Abläufe** (Zu tun, Rechnungen-Masse, OP-Primär, Akte, Mahnungen-Liste, **Stammdaten „Mahnlauf starten“**), dazu der automatische Lauf 06:30. A7 hat 4 Schritte für eine Tätigkeit, die meist „alle Vorschläge senden“ ist. | Nielsen 4 + 8, 02 §0.3 | Ein Ablauf **„Mahnen“** als Sheet lg 640: Tabelle der Vorschläge (alle gewählt, Mahnsperre-Zeilen grau mit Grund), Fokuszeile zeigt Vorschau rechts (Text, Gebühr, Zinsen, Gesamt), Fuß: Stichtag · „Als Entwurf anlegen“-Schalter · Primär **„12 Mahnungen senden“** → Rückfrage sm (nach außen) mit „2 ohne E-Mail → Post-Entwurf“. Einzel-Mahnen aus der Akte öffnet dasselbe Sheet mit einer Zeile. Mahnlauf-Knöpfe in Stammdaten entfernen (dort nur Einstellungen + Link „Zum Mahnen“). | Mahnlauf ab Zentrale ≤ 4 Klicks (§3). |
| P11 | **Assistenten zu lang, `Enter` doppelt belegt** (§4.5): A2, A3, A7, A9 je 4 Schritte; `Enter` = „weiter“, aber in A2/A4 Schritt 2 ist eine Kindtabelle, in der `Enter` eine neue Zeile anlegt. Abbrechen ab Schritt 2 mit Rückfrage, Entwurf nur in `sessionStorage` (geht bei Tab-Schließen verloren). | 01 E3, 02 §4.3, Nielsen 7 | **A2 entfällt als Assistent:** „Angebot anlegen“ = Dialog md mit Kunde/Projekt + Titel → legt Entwurf an und öffnet die Akte, Positionen inline, Primär „Senden“ (Linear/Stripe-Muster: Objekt sofort, Ausfüllen am Ort). **A3** = ein Dialog lg mit drei Abschnitten (Alternativen · Zahlungsplan · Termine) und einem Folgesatz über dem Knopf „Erzeugt AB-…, Anzahlungsrechnung 40 % (Entwurf), Projekt → Auftrag“. **A9** = ein Sheet: Zeitraum/Format oben, Prüfergebnis darunter (läuft automatisch), Primär „Erzeugen“ + Rückfrage. A4/A4b bleiben Schritte (echte Abhängigkeit), „Weiter“ = `⌘/Strg+Enter`, `Enter` nur im Feld. Entwurf im Server-Entwurf (Frappe-Entwurf) statt `sessionStorage`, wo ein Beleg entsteht. | Kein Assistent mit Kindtabelle reagiert auf `Enter` mit „Weiter“. |
| P12 | **„Zahlung erfassen“** (§4.4): Kanal „Bar“ steht gleichrangig neben Überweisung, obwohl Barzahlungen an die Kassa gehören (§7: Kassa-Konzept) – lädt zum falschen Prozess ein. Hinweis „Bankeingänge bitte über Bank zuordnen“ verlinkt „Zum Bankumsatz“, aber Mitarbeiter haben keinen Zugriff auf die Bank (§2.6 Rechte) – Sackgasse. Primärknopf „Buchen“ nennt den Betrag nicht. | Nielsen 5 + 9, 02 §6.2 | Kanäle in Reihenfolge Überweisung · Karte extern · Stripe Link · Gutschein · Verrechnung · Bar; bei „Bar“ Hinweisband „Barzahlungen bitte an der Kassa kassieren (Beleg)“ – ob „Bar“ hier überhaupt erlaubt ist, entscheidet die Fach-Kritik (21). Bank-Hinweis für Mitarbeiter: „Passender Bankeingang über 6.240,00 € vom 03.11. liegt vor – Faktura-Leitung ordnet zu“ + „Leitung informieren“ (Aufgabe). Primär **„6.240,00 € buchen“**; der Dialog ist die Rückfrage (kein zweites Modal). | Mitarbeiter sieht keinen Link auf eine Seite ohne Recht. |
| P13 | **Leerzustände fehlen** (über §2 hinaus): Akte-Tabs (Positionen leer im Entwurf, Zahlung ohne Zahlungen, Mahnung ohne Mahnung, Rechnungen im Auftrag, Zahlungsplan leer, Verlauf neu), Side-Peek (Laden/Fehler/gelöscht), A8-Suche ohne Treffer, Mahnen ohne Vorschlag, Gutschriften/Mahnungen/Zahllauf/Journal/Berichte (Filter leer, alles erledigt), Export „alles exportiert“, UVA nach Übergabe, Kennzahlen bei frischem Mandanten („–“ widerspricht 03 §8.14 „0 in `ink`“). | 02 §0.7 + §7.1, 03 §8.18, U-05 | Texte siehe §2.4 dieser Datei; je Leerzustand genau ein Satz + eine Aktion. Frischer Mandant: Kacheln zeigen `0,00 €`, „Zu tun“ zeigt Erste-Schritte (bleibt). | U-05 auf Tabs, Side-Peek, Assistenten erweitert. |
| P14 | **Fehlerfälle fehlen:** Bankimport-Datei gehört zu anderem Konto (IBAN ≠ gewähltes Konto); Bank-Zuordnung, die ein anderer Benutzer gleichzeitig vornimmt (409); „Zahlung erfassen“, während derselbe Betrag in der Bank zugeordnet wird; Massen-Senden mit Teilfehlern (Mail-Ablehnung); Sammel-PDF > 50; Export „Erzeugen“ bricht ab (Belege gesperrt?); Zahlungslink abgelaufen; Unterschrift am iPad bei Verbindungsverlust; PDF noch nicht fertig, Senden gedrückt. | Nielsen 9, 02 §7.2 | Je Fall Text + Weg in §2.5 dieser Datei. | QA-Liste um F-19 … F-27 ergänzen. |
| P15 | **Fach- und Systemkürzel in Nutzertexten:** „T“ für Tage, Spalte „Mahn“, „KZ 022“, „igE/igL/RC“, „OSS“, „USt-Fall“, „CAMT.053“, „EPC-QR/GiroCode“, „MIAS“, „Prüfsumme/Kette prüfen“, „Karenz“, „ENTW-…“ als Nummer, Workflow-Namen aus den Fixtures ohne Umlaut („Sachlich pruefen“, „Zurueck an Erfassung“ §4.1 – QA-Basis #13 zeigt genau diesen Fehler). | 02 §14, Nielsen 2, Persona „keine IT-Profis“ | Glossar §2.6 dieser Datei: Langform in der Oberfläche, Kurzform nur in Steuer-Tab/UVA mit `abbr title`. Workflow-Aktionen über eine Label-Tabelle im Adapter (nie Fixture-Text roh). ENTW-Nummer nicht anzeigen: Spalte Nummer zeigt „Entwurf“ (`muted`) + Kurztitel. | U-02 erweitert um „kein Wort ohne Umlaut-Schreibung, keine unerklärte Abkürzung außerhalb Steuer/UVA“. |
| P16 | **Mobile:** ER „Freigeben per Wisch rechts“ (§7) ohne sichtbaren Knopf und ohne Sicht auf das PDF; Positionen < 1024 px nur lesen – das iPad hochkant im Showroom (Präsentationsmodus „Positionen anpassen“) fällt darunter; Bank < 1024 px mit fester Leiste „Zuordnen“ 48 px verdeckt die Fokuszeile. | WCAG 2.5.1, 2.5.7, 2.4.11; 02 §11 | Mobil-Karte ER: PDF-Vorschau (erste Seite, Tipp = Vollbild), darunter Knöpfe „Freigeben“ (primär, 48 px) und „Ablehnen“; Wisch nur als Zusatz. Positionen bearbeitbar ab 768 px als Karten-Editor (eine Position je Karte, Menge/Preis/Rabatt als Felder, Sheet von unten); < 768 px nur lesen. Bank mobil: `scroll-padding-bottom` = Leistenhöhe + 16 px. | Freigeben am iPhone ohne Wischgeste möglich; iPad hochkant Präsentationsmodus kann Menge ändern. |
| P17 | **Kanban Rechnungen ist ohne Nutzen** (§2.4): 5 von 6 Spalten nicht ablegbar, beim Greifen halbtransparent + Tooltip (am iPad unsichtbar). Einziger Zug Entwurf → Gestellt öffnet einen Dialog. | 03 §8.11 (Tooltip nie einzige Quelle), Nielsen 8 | Kanban für Rechnungen streichen; Liste mit Gruppierung nach Status (C8) leistet dasselbe. Angebote/ER behalten Kanban; bei unerlaubter Ablage Rückkehr 200 ms + Toast mit Grund (04 §3.4), im `Shift+M`-Menü nur erlaubte Ziele. | Kein Kanban, in dem eine Spalte niemals Ziel sein kann. |
| P18 | **Bereichsstart zeigt dieselbe Zahl bis zu viermal:** „Bankumsätze offen“ als Heute-Chip, Zu-tun-Zeile, Pill-Zähler und Kennzahl (§2.1, §5.1); dazu Segment Buchhaltung/Vertrieb, 4 Kacheln, 2 Charts. | 02 §0.2, Nielsen 8 | „Zu tun“ wird das Hauptelement oben (volle Breite, max. 8 Zeilen, jede Zeile = Aktion). Heute-Chips entfallen (Pill-Zähler reichen). 4 Kennzahlen darunter, Charts unter „Berichte ansehen“ bzw. eine Chart-Reihe. Wireframe §5.1 dieser Datei. | Jede Zahl auf `/faktura` genau einmal. |
| P19 | **Rechte inkonsistent sichtbar:** Bank für Mitarbeiter ausgeblendet, „Freigeben“ sichtbar-deaktiviert mit Tooltip, Reiter „Zur Freigabe“ ausgeblendet, „Stornieren (Leitung)“ in Massenleisten sichtbar. „Anfragen“ legt eine Aufgabe an – ohne Rückmeldung und ohne Schutz vor Mehrfachanlage. | Nielsen 4, 03 §8.11 | Regel: **Navigation, Reiter, Massenaktionen** ohne Recht ausblenden; **Aktionen im Objekt** deaktiviert mit sichtbarer Zeile im `⋯`-Menü „Nur Faktura-Leitung“ + Menüpunkt „Leitung bitten“. Danach Toast „Anfrage an Faktura-Leitung gesendet“; zweite Anfrage zum selben Beleg: „Bereits angefragt am 04.11. 10:14“. | Gleiche Rechte-Darstellung in allen Faktura-Seiten. |
| P20 | **Barrierefreiheit Einzelpunkte:** „Ersetzt grau durchgestrichen“ nur visuell; Sicherheitspunkte „●●●○ 80“ ohne Wortbedeutung; Mini-Balken 4 px Anzahlung ohne Text; Unterschriftsfeld ohne Alternative; Charts ohne Tabellen-Alternative erwähnt; Massenaktionsleiste + Toast unten können die Fokuszeile verdecken; Avatar 24 px als einziges Ziel für „Berater“-Inline-Edit. | WCAG 1.1.1, 1.3.1, 1.4.1, 2.4.11, 2.5.8 | Durchgestrichen + Text „(ersetzt durch v3)“, `<del>` mit `aria-label`. Sicherheit als Wort: **Sicher · Wahrscheinlich · Möglich · Unklar** (Zahl nur im Tooltip/Side-Peek). Anzahlung-Spalte als Text „9.984 / 9.984 ✓“, Balken `aria-hidden`. Unterschrift: Alternative „Kunde hat auf Papier unterschrieben“ (Checkbox + Upload). Charts: `<details>` Tabelle (03 §8.15). `scroll-margin-bottom` = Leiste + Toast. Inline-Edit Berater: ganze Zelle als Ziel (≥ 40 px Zeilenhöhe). | axe = 0; VoiceOver liest Bankzeile „Sicher: Zahlungsreferenz im Verwendungszweck“. |
| P21 | **Motion außerhalb der Token** (§3.3 Stand-Balken 280 ms, §6.2 Druckvorschau schließen 140 ms); Erfolgsmoment-Häkchen bei „Rechnung gestellt“ korrekt, aber auch bei „Gutschrift gestellt“ und „Export erzeugt“ ungeklärt. | U-09, 04 §2 | 280 → `--bo-dur-slow` 240 ms `--bo-ease-out`; 140 → `--bo-dur-fast` 120 ms `--bo-ease-in`. Erfolgsmoment (04 §3.13) nur für: Rechnung gestellt, Schlussrechnung gestellt, Anzahlung vollständig bezahlt. Gutschrift/Export/Import: Ergebnis-Karte ohne Häkchen-Zeichnen. Tabelle §6. | Token-Lint: keine ms-Zahl außerhalb `--bo-dur-*`. |

---

## 2. Weitere Schwächen und Ergänzungen

### 2.1 Komplexität, Klicks, Benennung
- **Eine Aktion – ein Name.** „Anzahlung anfordern“ (Oberbegriff) vs. „Anzahlungsrechnung stellen“ vs. „Zahlungslink senden“. Vorschlag: Primärknopf im Auftrag heißt **„Anzahlung anfordern“**, öffnet einen Dialog md mit Segment *Rechnung stellen · Zahlungslink senden* (Standard aus letzter Wahl der Rolle) und dem Betrag. Der Menüpunkt „An Kassa übergeben“ (nur ein Hinweistext) entfällt; stattdessen Satz im Dialog „Kunde zahlt an der Kassa? Dort Auftrag AB-…17 suchen.“
- **Split-Button „Rechnung anlegen ▾“ am Bereichsstart** mit 5 Belegarten: eine Rechnung ohne Auftrag ist im Möbelhandel die Ausnahme. Primär „Angebot anlegen“ (Vertrieb-Cockpit) bzw. kein Primärknopf im Buchhaltungs-Cockpit (Zu tun ist die Aktion); „Neu ▾“ als Sekundär.
- **Teil-/Schlussrechnung „Entwurf anlegen“ vs. „Anlegen und stellen“** (A4) – danach erscheint zusätzlich der Stellen-Dialog? Festlegen: „Anlegen und stellen“ führt direkt in den Stellen-Dialog (P5) mit vorbefüllten Fakten, kein weiteres Modal.
- **„Trockenlauf fehlt → Vorschau legt Entwurf an, Abbruch löscht ihn“** (§9.2): Abbruch löscht still einen Beleg. Besser: Entwurf bleibt, Toast „Entwurf ENTW… angelegt · Verwerfen“ (Undo-Muster), erscheint in „Zu tun → Entwürfe“.
- **Rechnungsentwurf-Erinnerung** nur nach 2 Tagen; zusätzlich Zähler-Pille am Reiter „Entwürfe“ (bereits vorhanden) reicht – Erinnerung nicht doppelt in Zu tun und Pille.
- **Angebot „Version-Chip v2“ + Banner + Gültig-bis-Signal + FAGG-Checkbox im Kopf**: Checkbox gehört in den Senden-Dialog („FAGG-Belehrung beilegen“, Standard an bei Vertragsort ≠ Showroom), nicht dauerhaft in den Kopf.
- **Stammdaten Zahlungsbedingungen „Anzahlung + Teilzahlung > 100 %“ live** – gut; zusätzlich Live-Satz „Kunde zahlt 40 % bei Auftrag, 50 % bei Lieferung, 10 % nach Montage“ unter den Feldern (Verständlichkeit für Nicht-Buchhalter).

### 2.2 Tastatur (Ergänzung zu P2)
- Akte-Tabs: 02 §9.4 `Alt+1…9`, 05 T5 `1–9`. Faktura nimmt **`Alt+1…5`** (5 Tabs nach P8); `1–9` bleibt Listen-Reitern.
- Positions-Tabelle: Position verschieben = `⌘/Strg+Shift+↑/↓` (statt `Alt+↑↓`, das bleibt „nächster Beleg“); Zeile löschen `⌘Backspace` (02), Duplizieren `⌘D` kollidiert mit Browser-Lesezeichen → `⌘Shift+D`, Abweichung in 02 §9.4 nachziehen.
- Side-Peek: **`Leertaste` = Side-Peek** (Linear, 01 D10), **`x` = Auswahl** (01 A6, 02 §9.2 `X`). 02 §9.2 und 03 §8.7 müssen dazu „Leertaste auswählen“ streichen (Widerspruch §7 dieser Datei). Im Peek: `↑↓`/`j k` nächster Datensatz, `Esc` schließt, `⌘Enter` öffnet Vollseite.
- Massenaktion mit Fortschritt („12/40“, Abbruch möglich): `Esc` während des Laufs = „nach aktuellem Beleg anhalten“, Fokus auf „Anhalten“; danach normale Bedeutung.
- Druckvorschau `p` (05 §831) bleibt; Projekt öffnen = `Shift+P`, Kundenakte = `Shift+K`, Auftrag = `Shift+A`.

### 2.3 Undo und Rückfragen (Ergänzung zu P1/P3)
| Aktion | heute in 10 | Soll |
|---|---|---|
| Bank zuordnen (jede Sicherheit) | 100: sofort ohne Undo; < 100: A8 | verzögerter Commit 8 s + Undo; A8 nur bei Wahl/Teilbetrag |
| Bank ignorieren | Undo 8 s über `wieder_oeffnen` | bleibt (echte Gegenaktion, Variante B) |
| Angebot ablehnen / ablaufen lassen | Rückfrage | Grund-Popover → verzögerter Commit + Undo |
| Mahnung erledigt | Rückfrage | verzögerter Commit + Undo |
| ER freigeben | Undo über `zurueck_an_erfassung` | verzögerter Commit + Undo |
| Mahnsperre setzen | Undo | bleibt; Grund-Popover vor dem Toast |
| Anzahlungen verrechnen (Entwurf) | sofort, Toast ohne Undo | Undo über erneutes Laden des Entwurfs-Zustands (Entwurf ist änderbar) |
| Neue Version (Angebot) | sofort | bleibt; Toast „Version 2 angelegt · Öffnen“ + „Verwerfen“ (Entwurf löschen) |
| Gutschrift-Entwurf anlegen | öffnet Gutschrift | bleibt; Entwurf verwerfbar |
| Uneinbringlich, AB stornieren, Export erzeugen, UVA übergeben, Stellen, Zahlung buchen | Rückfrage | bleibt Rückfrage (sm 400, Danger: Fokus „Abbrechen“) |

### 2.4 Leerzustände (Texte, je eine Aktion)
| Ort | Text | Aktion |
|---|---|---|
| Rechnung › Positionen (Entwurf leer) | „Noch keine Positionen. Produkt suchen oder Textzeile anlegen.“ | „Position hinzufügen“ (fokussiert Produktsuche) |
| Rechnung › Zahlung & Mahnung (keine Zahlung) | „Noch keine Zahlung eingegangen.“ | „Zahlung erfassen“ (nur wenn nicht Primär, sonst ohne Knopf) |
| Rechnung › Mahnung (keine) | „Nicht gemahnt. Nächste Stufe frühestens am 11.11.“ | – (Info) |
| Auftrag › Zahlungsplan & Rechnungen (leer) | „Noch keine Rechnung zu diesem Auftrag.“ | „Anzahlung anfordern“ |
| Auftrag › Lieferung (keine Lieferscheine) | „Noch nichts geliefert. Lieferscheine erscheinen hier, sobald die Logistik sie anlegt.“ | – |
| Side-Peek Laden / Fehler / gelöscht | Skeleton in Endmaß nach 300 ms · „Nicht geladen · Erneut“ · „Dieser Beleg existiert nicht mehr.“ | „Erneut“ / „Schließen“ |
| A8 Suche ohne Treffer | „Kein offener Beleg passt zu ‚4711‘. Betrag oder Kundennamen versuchen.“ | „Suche leeren“ |
| Mahnen ohne Vorschlag | „Heute ist nichts zu mahnen.“ (Häkchen) | „Mahnregeln ansehen“ |
| Gutschriften / Mahnungen „Filter leer“ | „Keine Gutschriften für diese Filter.“ | „Filter zurücksetzen“ |
| Zahllauf leer | „Keine Eingangsrechnung zur Zahlung fällig.“ | – |
| Journal leer | „Noch keine Buchung. Einträge entstehen beim ersten Stellen.“ | – |
| Export „alles exportiert“ | „Alle gestellten Belege sind übergeben.“ (Häkchen) | – |
| Bericht ohne Daten | „Keine Daten im Zeitraum 01.10.–31.10.2026.“ | „Zeitraum ändern“ |

### 2.5 Fehlerfälle (Text + Weg)
| Fall | Anzeige | Weg |
|---|---|---|
| CAMT-Datei für anderes Konto | Im Import-Sheet, Datei bleibt: „Die Datei gehört zum Konto AT12 … 3456, gewählt ist Raiba Lochau (… 7890).“ | „Konto wechseln“ / „Andere Datei“ |
| Bank: Umsatz inzwischen von anderer Person zugeordnet | Toast warnung „Bereits zugeordnet von Anna (10:42) – RE-…42.“ Zeile verschwindet, kein Doppel. | „Ansehen“ |
| Zahlung erfassen, während derselbe Betrag in der Bank offen ist | Hinweis im Dialog (bereits in 10) + bei Buchen eines Treffers: Rückfrage „Es gibt einen Bankeingang über denselben Betrag. Trotzdem manuell buchen?“ | „Bankeingang verwenden“ (Leitung) / „Trotzdem buchen“ |
| Massen-Senden teilweise fehlgeschlagen | Ergebnis-Toast fehler (bleibt): „9 gesendet, 3 nicht zustellbar.“ | „Details“ → Drawer mit Liste + „Erneut senden“ |
| Sammel-PDF > 50 | Knopf deaktiviert mit Text „Höchstens 50 auf einmal – Auswahl eingrenzen“ oder Hintergrundauftrag mit Benachrichtigung (10 §6.2) – eins wählen: Hintergrund | Benachrichtigung „Sammel-PDF bereit“ |
| Export „Erzeugen“ bricht ab | Banner danger im Lauf: „Export nicht erzeugt. Belege sind nicht gesperrt.“ (Server muss das garantieren – Anfrage) | „Erneut erzeugen“ |
| Zahlungslink abgelaufen | Zahlungskarte: „Link vom 20.10. abgelaufen.“ | „Neuen Link senden“ |
| Unterschrift ohne Verbindung | Unterschrift bleibt im Feld, Band „Keine Verbindung – Unterschrift wird übertragen, sobald online“; Annehmen erst nach Server-OK als erledigt anzeigen | automatisch, „Jetzt erneut“ |
| PDF noch nicht fertig beim Senden | Anhang-Kachel mit Spinner „PDF wird erzeugt …“, „Senden“ wartet und sendet danach (Knopftext „Sendet nach PDF …“) | „Abbrechen“ |

### 2.6 Glossar Oberfläche (Langform in UI, Kurzform nur Steuer/UVA)
| Heute | Oberfläche |
|---|---|
| `T` (12 T) | „12 Tage überfällig“, in schmalen Spalten „12 Tg.“ mit `abbr` |
| Spalte „Mahn“ | „Mahnstufe“ |
| USt-Fall | „Steuerfall“ (Werte: Inland 20 % · EU-Firma (Steuerschuld Kunde) · EU-Privat (Zielland-Steuer) · Ausfuhr · Einkauf EU) |
| igE / igL / RC / OSS | nur im Tab „Steuer & Texte“ als Kennzeichen mit Langtext im Tooltip **und** Hilfetext darunter |
| CAMT.053 | „Kontoauszug-Datei (CAMT.053 aus dem Online-Banking)“ – Kurzform nur in Klammern |
| EPC-QR / GiroCode | „Zahl-QR-Code“ |
| MIAS | „UID prüfen“ |
| Prüfsumme / Kette prüfen | „Fälschungsschutz“ / „Buchungen auf Veränderung prüfen“ |
| Karenz | „Wartezeit vor Mahnung“ |
| Verrechnen | „Anzahlung abziehen“ (Knopf), „verrechnet“ (Status) |
| Stellen | bleibt („Rechnung stellen“ ist Alltagssprache), Tooltip „Rechnung wird nummeriert und gesperrt“ |

### 2.7 Visuelle Modernität (Maßstab Linear, Stripe Dashboard, Shopify Admin)
- **Dichte ohne Lärm:** Listen-Wireframes tragen je Zeile bis zu fünf grafische Marken (Status-Punkt, Zeit-Signal, Mini-Balken, Punktreihe, Badge). Stripe/Linear: max. zwei (Status + eine Signalform). Regel: Status-Badge + **ein** Signal je Zeile (Rang: überfällig > Frist bald > Mahnstufe ≥ 2); Fortschritte als Zahl.
- **Beträge** sind die Hauptsache der Faktura: Spalte „Offen“ in 14/500 tabular `ink`, „Zahlbar“ in `ink-soft` – heute gleichgewichtig. Stripe zeigt den relevanten Betrag fett, den Rest leise.
- **Kopf der Akte** in Bodoni? Nein – Bodoni nur Wortmarke/Zentrale-Hauptzahl (03 §8.14). Belegnummer in Instrument Sans 20/500 tabular, Betrag rechts groß (`2xl` tabular) wie Stripe-Zahlungsdetail: „9.984,00 € · offen 6.240,00 €“.
- **Emoji 🔒 und ⚠ in Wireframes** → lucide `lock` 12 px / `triangle-alert` (03 §5); im Bau keine Emoji.
- **Altersbalken (OP)** als vier Segmente eines Bandes statt vier Balken; Klick auf Segment filtert (Shopify-Muster).
- **Leere Flächen statt Rahmen:** Summen-/Zahlungskarten ohne Rahmen, nur Abstand 24 und Linie `line` (03 Grundsatz ruhig).

### 2.8 Mobile / iPad (Ergänzung zu P16)
- Präsentationsmodus `f` → `Shift+F` (siehe §4) bzw. sichtbarer Knopf „Präsentieren“ im Kopf (Touch hat keine Tastatur). Ausstieg über Knopf „Präsentation beenden“ ohne PIN; solange aktiv, Kennzeichen „Präsentation“ oben rechts (03 §8.9), damit der Berater weiß, was der Kunde sieht. Ob ein PIN nötig ist, entscheidet der Inhaber (offene Frage).
- Montage mobil: Abfrage alle 10 s bis 10 min – bei Ablauf Text „Zahlung noch nicht eingegangen. Später in der Akte sichtbar.“ und Knopf „Erneut prüfen“ (sonst stummer Zustand).
- Listen als Karten < 768 px: Nummern umbrechen heute 3–4-zeilig (QA-Basis #8) → Karten-Kopf `whitespace-nowrap` + Kürzung der Mitte („RE-…00042“) mit vollem Wert für Screenreader.

---

## 3. Klickzahlen – Ist laut beschriebenem Weg und Soll nach den Änderungen

Zählregel: ab Zentrale, ohne Suche; Klick, Tipp, `Enter` und „Weiter“ zählen je 1.

| Aufgabe | 10 §1 | 02 §1.3 | Ist (Weg in 10) | Soll nach P1–P11 (Weg) |
|---|---|---|---|---|
| Anzahlungsrechnung stellen | 2 | 2 | 7 (Faktura → Aufträge → Zeile → Split ▾ → Eintrag → Dialog „Stellen“) | **2**: Zentrale-Zu-tun-Zeile „Anzahlung anfordern AB-…17“ → Dialog „Rechnung stellen“ |
| Schlussrechnung | 3 | 2 | 6 (Aufträge → Zeile → Schlussrechnung → Weiter → Weiter → Stellen) + Navigation | **3**: Zu-tun-Zeile → A4b (Schritte zusammen auf einer Seite, Anzahlungen sichtbar) → „Stellen“ |
| Teilrechnung | 3 | – | 5 + Navigation | **3**: Zu-tun-Zeile → Mengen „Alles Gelieferte“ → „Stellen“ |
| Zahlung manuell erfassen | 2 | – | 2 ab Rechnung, 5 ab Zentrale | **3** ab Zentrale (Faktura → Zeile `Shift+Z` → „6.240,00 € buchen“) bzw. 2 über ⌘K |
| Angebot schreiben + senden | 4 | – | 7 | **4**: Projekt → „Angebot anlegen“ (Dialog, „Anlegen“) → Positionen (Eingabe, nicht gezählt) → „Senden“ → Dialog „Senden“ |
| Angebot → Auftrag | 3 | – | 6 (A3 4 Schritte + Knopf) | **3**: Angebot → „Als Auftrag übernehmen“ → „Auftrag anlegen“ |
| Bankumsatz zuordnen (sicher) | 1 | 2 | 1 (aber ohne Schutz) | **2** ab Zentrale (Bank-Pill → Zeilenknopf), danach **1** je weiterem Umsatz |
| Mahnlauf | 3 | 3 | 6 (OP → Mahnen → 4 Schritte) + Navigation | **4**: Faktura → „Mahnen (3)“ in Zu tun → „3 Mahnungen senden“ → Rückfrage „Senden“ |
| ER freigeben | 1 | 2 | 1 ab Liste, 3 ab Zentrale | **2**: Zu-tun-Zeile → „Freigeben“ (Undo) |
| Monatsexport | 3 | 3 | 6 (Neuer Lauf → 4 Schritte → Rückfrage) | **3**: Zu-tun „Export Oktober fällig“ → Sheet „Erzeugen“ → Rückfrage „Erzeugen“ |
| Gutschrift / Storno | 3 | – | 4 (Rechnung → Gutschrift → Dialog → Stellen-Dialog) + Navigation | **4** ab Rechnung, bleibt (geldwirksam, zwei bewusste Schritte) |

Folge: Die „Zu tun“-Liste der Zentrale bzw. von `/faktura` ist der Hauptweg; jede Zeile muss die Aktion direkt auslösen (05 Z. 526). Ohne sie sind die Ziele nicht erreichbar.

---

## 4. Tastenbelegung Faktura (Vorschlag, ersetzt die Kürzel in 10 §2–§3, §6.2)

Grundregel (gleich wie Kritik Shop P2): **Einzelbuchstaben gehören der Shell und dem DataTable-Muster** und bedeuten überall dasselbe. Bereichsaktionen = `Shift+Buchstabe`. Wirken nie in Eingabefeldern; abschaltbar im Benutzer-Menü (WCAG 2.1.4).

| Kontext | Taste | Wirkung |
|---|---|---|
| Global (02/05) | `⌘/Strg+K` · `/` · `?` · `g`+Buchstabe · `n` · `e` · `⌘S` · `⌘Enter` · `Z` / `⌘Z` · `Esc` · `⌘P` · `[` `]` · `Alt+↑↓` | unverändert (Palette, Suche, Hilfe, Gehe zu, Neu, Bearbeiten, Speichern, Primäraktion Seite, Undo, Schließen, Drucken, Seitenleiste, nächster Datensatz) |
| Liste (02 §9.2, angepasst) | `↑↓` `j k` · `Enter` · `Leertaste` · `x` · `Shift+↑↓` · `a` · `s` · `c` · `1–9` · `←→` | Zeile · öffnen · **Side-Peek** · auswählen · Bereich · Zuweisen · Status · Kommentar · Reiter · Seite blättern |
| Liste/Akte Faktura | `Shift+Enter` | Primäraktion der fokussierten Zeile (Tooltip „Zuordnen · ⇧↵“) |
| | `Shift+Z` | Zahlung erfassen |
| | `Shift+M` | Mahnen (Sheet) |
| | `Shift+G` | Gutschrift |
| | `Shift+S` | Senden (Dialog) |
| | `Shift+L` | Zahlungslink |
| | `Shift+F` | Freigeben (ER, Leitung) · in Angebot: Präsentationsmodus |
| | `Shift+R` | Sachlich prüfen (ER) |
| | `Shift+I` | Ignorieren (Bank) · `Shift+O` Wieder öffnen |
| | `Shift+A` / `Shift+P` / `Shift+K` | Auftrag / Projekt / Kundenakte öffnen |
| Akte | `p` | Druckvorschau (05 §831) |
| | `Alt+1…5` | Tabs |
| | `.` | Aktionsmenü `⋯` (05 T5) |
| Kanban | `←→` `↑↓` · `Enter` · `m` | Spalte/Karte · öffnen · Verschieben-Menü (nur erlaubte Ziele) |
| Positions-Tabelle | `Enter` (letzte Zelle) · `⌘Backspace` · `⌘Shift+D` · `⌘Shift+↑↓` | neue Zeile · löschen (Undo) · duplizieren · verschieben |
| Dialog | `Enter` (nach 300 ms) · `Esc` | Primär · Abbrechen (Danger: Fokus „Abbrechen“) |
| Ablehnen (ER) | **kein Kürzel** | nur über `.`-Menü (rot, Grund Pflicht) |

---

## 5. Korrigierte Wireframes

### 5.1 `/faktura` Bereichsstart (Cockpit Buchhaltung)

```
┌ Zentrale › Faktura                                      Cockpit ( Buchhaltung | Vertrieb )   [Neu ▾] ┐
│ Faktura                                                                                              │
│ ZU TUN · 6                                                                       Alle in Zentrale → │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ ◔ Bank       3 Eingänge mit sicherem Vorschlag                             [Zuordnen ⇧↵]        │ │
│ │ ▲ Mahnen     RE-2026-00042 Fam. Muster · 12 Tage überfällig · 6.240,00 €   [Mahnen]             │ │
│ │ ◷ Freigeben  ER-2026-00018 Bulthaup · Skonto noch 2 Tage · 8.722,00 €      [Freigeben]          │ │
│ │ ○ Anzahlung  AB-2026-00019 Huber · noch nicht angefordert · 2.448,00 €     [Anzahlung anfordern]│ │
│ │ ○ Rechnung   AB-2026-000xx Geliefert, nicht abgerechnet                    [Schlussrechnung]    │ │
│ │ ◷ Export     Oktober noch nicht an Kanzlei                                 [Export erzeugen]    │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌ OFFENE POSTEN ──┐ ┌ ÜBERFÄLLIG ─────┐ ┌ ANZAHLUNGEN OFFEN ┐ ┌ UMSATZ OKTOBER (brutto) ┐            │
│ │ 48.230,00 €     │ │ 6.240,00 €      │ │ 12.400,00 €       │ │ 31.900,00 €  ▁▃▅▆      │            │
│ │ 14 Rechnungen → │ │ 3 Rechnungen →  │ │ 4 Aufträge →      │ │ Kein Vergleich          │            │
│ └─────────────────┘ └─────────────────┘ └───────────────────┘ └─────────────────────────┘            │
│ Offene Posten nach Alter  [ 0–7 ▇▇▇▇▇▇ | 8–30 ▇▇▇ | 31–60 ▇ | > 60 ▏ ]   (ein Band, Segment = Filter)  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
- Zu-tun-Zeile: Icon-Form (nicht nur Farbe), Typ-Wort, ein Satz, Betrag, **eine** Aktion. `Enter` öffnet Beleg, `Shift+Enter` Aktion. Zeilenhöhe 44, Hover `surface-2` 120 ms. Erledigte Zeile blendet 160 ms aus (Undo-Toast, wo umkehrbar).
- Werte: Beispielzahlen aus 10 übernommen, keine neuen.

### 5.2 Bank – Zeile und Side-Peek

```
┌ Bank · Raiba Lochau ▾                                         Saldo lt. Auszug 31.10.: 42.118,30 €  [Auszug importieren] ┐
│ Offen 12 · Teilweise 1 · Zugeordnet · Ignoriert · Alle                                                                │
│ [⌕ Name, Zweck, Betrag]  [Richtung ▾]  [Zeitraum ▾]  [Sicherheit ▾]  [+ Filter]                                       │
│ ☐ 03.11.  ↙ Muster Max     RE-2026-00042 Anzahlung Küche   6.240,00 €   → RE-2026-00042 · Fam. Muster   Sicher      [Zuordnen] │◀ Fokus
│ ☐ 03.11.  ↙ M. Muster      Kueche                          3.744,00 €   → RE-2026-00046 · Fam. Muster   Wahrscheinl. [Prüfen]  │
│ ☐ 02.11.  ↗ BULTHAUP GMBH  RG 4711 / Komm. Muster         −8.900,00 €   → ER-2026-00018 · Bulthaup      Möglich     [Prüfen]   │
│ ☐ 02.11.  ↗ Raiffeisen     Kontoführung                      −12,40 €   kein Vorschlag                  –           [Ignorieren]│
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
 Toast: ✓ Zuordnung RE-2026-00042 · 6.240,00 €            Rückgängig Z   ▬▬▬▬▬▬▬▬▬▬ (8 s, Sand 2 px)
```
- `Leertaste` öffnet Peek (Sheet 480): oben Umsatz (IBAN, Zweck voll, Valuta), unten Beleg (Offen, Fällig, Mahnstufe), Fuß `[Anderen Beleg wählen] [Zuordnen ⇧↵]`.
- Sicherheit als Wort; Grund im Peek („Rechnungsnummer im Verwendungszweck“).
- Beträge `ink`; Richtung über Pfeil-Icon + Minuszeichen.

### 5.3 Rechnungsakte – Kopf

```
┌ Zentrale › Faktura › Rechnungen › RE-2026-00042                                     [Mahnen (Stufe 2)] [⋯] ┐
│ RE-2026-00042 · Anzahlungsrechnung · Fam. Muster   ● Gemahnt · Stufe 1  [lock 12]       9.984,00 €        │
│                                                     ▲ 12 Tage überfällig (fällig 28.10.)  offen 6.240,00 € │
│ ●──────●──────●──────◉──────○──────○──────○──────○                                                         │
│ Anfrage Planung Angebot Auftrag Bestellung Lieferung Montage Übergabe                                       │
│              AN-…88  AB-…17 · RE-…42                                                                       │
│ ⓘ Exportiert in EX-2026-0010 – Änderungen nur per Gutschrift                       (max. 1 Banner)          │
├ Übersicht | Positionen | Zahlung & Mahnung | Steuer & Texte | Verlauf ───────────────────────────────────┤
```
- Primär hier „Mahnen“, Zahlung erfassen im `⋯` und als Knopf im Tab „Zahlung & Mahnung“ – nicht ein drittes Mal in „Nächste Schritte“.

### 5.4 Stellen-Dialog

```
┌ Rechnung über 9.984,00 € stellen? ──────────────────────── × ┐  Dialog md 560
│ An          Fam. Muster, Landstraße 5, 6911 Lochau            │
│ Art         Anzahlungsrechnung · 40 % zu AB-2026-00017         │
│ Fällig      28.10.2026 (14 Tage)                              │
│ Pflichtangaben  ✓ vollständig                                 │
│ Danach      fortlaufende Nummer · PDF wird fixiert ·          │
│             Änderungen nur per Gutschrift                     │
│ ☑ Danach per E-Mail an m.muster@… senden   Text ansehen ▾     │
│                                [Abbrechen] [Stellen und senden]│
└───────────────────────────────────────────────────────────────┘
 Variante unvollständig: Titel „Noch nicht stellbar – 1 Angabe fehlt“, Liste „Leistungsdatum fehlt  Zum Feld →“,
 Primär disabled, darunter Text „Erst alle Pflichtangaben ergänzen.“
```

---

## 6. Bewegung – Abgleich mit 04

| Stelle in 10 | heute | Soll (Token) |
|---|---|---|
| Side-Peek öffnen | 200 ms `translate 16px→0` | `--bo-dur-move` 200 ms `--bo-ease-out` (04) – 03 §8.11 nennt 240 ms → 03 korrigieren |
| Druckvorschau schließen | 140 ms | `--bo-dur-fast` 120 ms `--bo-ease-in` |
| Stand-Band Auftrag füllt | 280 ms `ease-out` | `--bo-dur-slow` 240 ms `--bo-ease-out`, nur bei Wertänderung nach Laden |
| Kennzahl-Balken | 240 ms | bleibt (04); 03 §8.15 nennt 400 ms → 03 korrigieren |
| Filterwechsel Chart | 160 ms | bleibt `--bo-dur-base` |
| PDF ersetzt Skeleton | 120 ms Fade | bleibt |
| Kanban-Rückkehr unerlaubt | 200 ms | bleibt, plus Toast mit Grund |
| Bankzeile nach Zuordnen | – | 160 ms `--bo-ease-in` Ausblenden, Nachbarn rücken 160 ms (04 §3.3) |
| Erfolgsmoment | bei Rechnung/Gutschrift/Export unklar | 04 §3.13 nur Rechnung gestellt, Schlussrechnung, Anzahlung vollständig bezahlt |
| Undo-Balken | 8 s | 8 s linear (04 §3.6 von 5000 ms auf 8000 ms ändern) |
| `prefers-reduced-motion` | „nur Opazität ≤ 120 ms“ (U-09) | 04 §2.4 sagt Dauer 0 für move/slow/draw – U-09 an 04 angleichen |

---

## 7. Widersprüche in 01–05, die Faktura erbt (Quelle vor dem Bau festlegen)

| # | Widerspruch | Stellen | Vorschlag |
|---|---|---|---|
| W1 | Leertaste = Auswahl **und** Side-Peek | 01 A6 / 02 §9.2 / 03 §8.7 ↔ 01 D10, 10 §2 | Leertaste = Peek, `x` = Auswahl; 02 + 03 ändern |
| W2 | Shift+Klick = Bereich wählen **und** Peek | 02 §5 ↔ 01 D10 | Shift+Klick = Bereich; Peek per Klick auf Zeile (Desktop), Vollseite per Klick auf Nummer |
| W3 | Primäraktion der Zeile `a` | 05 Z. 526 ↔ 02 §9.2 `A` Zuweisen | `Shift+Enter`; 05 ändern |
| W4 | Undo-Taste `Z` | 04 §3.6 `Z` ↔ 02 §9.1 `⌘Z` | beide gültig, in 02 ergänzen |
| W5 | Undo-Dauer | 02 §6.1 8 s ↔ 04 §3.6 5000 ms | 8 s |
| W6 | `p` = Drucken **und** Projekt | 05 T5/§831 ↔ 05 Z. 606 | `p` Drucken, `Shift+P` Projekt |
| W7 | `e` = Bearbeiten **und** CSV; `f` = Filter | 02 §9.1 ↔ 05 T2 | `e` Bearbeiten; CSV ohne Kürzel; Filter = `/` |
| W8 | Akte-Tabs `Alt+1…9` vs. `1–9` | 02 §9.4 ↔ 05 T5 | `Alt+1…9` in Akten, `1–9` in Listen |
| W9 | Toast-Position unten Mitte vs. unten rechts | 02 §6.1 ↔ 03 §8.12 | unten rechts (03), 02 ändern |
| W10 | Bestätigungsdialog 440 px | 02 §6.2 ↔ 03 §8.11 (sm 400 / md 560) | 03-Skala |
| W11 | Dialog-Öffnen 240 ms vs. 160 ms; Sheet 240 vs. 200 ms; Chart 400 vs. 240 ms | 03 §8.11/§8.15 ↔ 04 §2/§3.5/§3.8 | 04 ist Quelle, 03 nachziehen |
| W12 | Grundsatz „≤ 200 ms, `cubic-bezier(.2,.8,.2,1)`“ | 02 §0.10 ↔ 04 Token | auf 04-Token verweisen |
| W13 | Pill aktiv Tinte vs. Sand | 02 §2.1 ↔ 05 §2 | Tinte (Kontrast) |
| W14 | „Gemahnt“ rot, aber „Rot nie dringend aber normal“ | 03 §1.5 Tabelle ↔ 03 §1.5 Regel | Gemahnt Stufe 1–2 orange + Stufe-Text, Stufe 3 rot |
| W15 | Klickzahlen Faktura | 02 §1.3 ↔ 10 §1 | Tabelle §3 dieser Datei |

---

## 8. Was gut ist (beim Bau nicht verwässern)

- Pflichtangaben-Prüfer im Entwurf mit Sprunglinks; Kleinbetrags-Lockerung sichtbar.
- Fixierte PDF mit Zeitstempel, Druckvorschau aus Server-PDF (U-15).
- Kein Massen-„Stellen“ (bewusst, begründet).
- Massenaktionen mit „n von m möglich – k übersprungen (Grund)“.
- Doppelerfassungs-Prüfung bei Eingangsrechnungen live; Brutto ≠ Netto + USt als Feldfehler.
- Steuerberater-Rolle mit eigener Startseite und nur lesenden Aktionen.
- OP-Stichtag in der Vergangenheit sperrt Aktionen mit Banner.
- Ehrlichkeit: „Keine OCR – nicht versprechen“, UVA-Banner „Zuarbeit, keine Meldung“.
- Präsentationsmodus iPad, interne Felder nicht im Netzwerk (F-16).

---

## 9. Anfragen aus dieser Kritik

| An | Anfrage |
|---|---|
| Backend-Import (`ph_faktura`) | `PH Bankumsatz.zuordnung_aufheben()` (Leitung); Garantie „Export-Abbruch sperrt keine Belege“; Rückübergang „Freigegeben → Sachlich geprüft“ (statt nur → Erfasst); lesende Pflichtangaben-Prüfung (bereits §12 Nr. 1) |
| Fundament / 02–05 | Widersprüche W1–W15 auflösen; Kürzel-Registry mit Konfliktprüfung je Kontext; Label-Tabelle für Workflow-Aktionen (Umlaute) |
| Fach-Kritik Faktura (21) | Ob „Bar“ in „Zahlung erfassen“ zulässig ist oder nur über Kassa; Mahnstufen-Farben fachlich |
| Fachbereichs-Agent Faktura | P1–P21 einarbeiten, §3/§4/§5 übernehmen, QA §10 um P-Abnahmen ergänzen |
| Kassa-Agent | Satz „Kunde zahlt an der Kassa – Auftrag suchen“ und Suchweg in der Kassa abstimmen |
