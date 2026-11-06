# 20 – UX-/UI-Kritik Bereich „Kassa“ · Prüfung von `10-konzept-kassa.md` Fassung 2

**Zweck:** Strenge Abnahme-Prüfung der Fassung 2 des Kassa-Konzepts gegen Nielsen-Heuristiken, WCAG 2.2 AA, Touch-/iPad-Realität (Finger, Scanner, Terminal, Bondrucker) und die Leitlinien 01–05. Ergebnis: Note, Befunde mit Fundstelle, Pflichtänderungen mit Abnahmekriterium, korrigierte Wireframes, Ergänzungen zur QA-Liste. Ersetzt den Prüfbericht zur Fassung 1 (gleicher Dateiname, 05:55); dessen Befunde sind in §1 auf Erledigung geprüft.
**Stand:** 2026-11-04 · Rolle: UX-/UI-Kritiker · Status: Prüfbericht, keine Inhaber-Entscheidung.
**Geprüft:** `10-konzept-kassa.md` Fassung 2 (§0–§15, 1226 Zeilen, vollständig), `01-benchmark-prinzipien.md` (§F), `02-ux-leitlinien.md` (§0, §1.6, §6–§11, §13–§16), `03-design-system.md` (§0, §1.3, §2, §6.3, §8.1, §8.6, §8.11, §8.12, §8.20), `04-motion.md` (§2.1, §3.6, §3.11–§3.13, §4), `05-informationsarchitektur.md` (§3.14, §12). Keine RKSV-/Steuerprüfung (Steuerberater, `21-kritik-fach-kassa.md`), keine Änderung an `backoffice/` oder `Backend-Import/`.

---

## 0. Urteil

**Note: 7 / 10** (Fassung 1: 6 / 10).

Fassung 2 hat die P1-Befunde der ersten Kritik fast vollständig umgesetzt: verbindliches Fokusmodell, eine Tastenbelegung, Touch zuerst mit sichtbaren Tasten, Abbrechen-Taste am Terminal, Timeout, „Zahlung erhalten – Beleg offen“, Rückgeld groß, Bodoni-Summe ersetzt, Leerzustände vollständig, Unterschrift mit Alternative, Idle-Countdown. Das Konzept ist als Bauvorlage jetzt dicht und ehrlich (Lücken mit zuständiger App, Übergangsverhalten).

Was noch fehlt, liegt an den **Übergängen zwischen Zuständen** – genau dort, wo an einer echten Kassa Geld verloren geht oder Kunden warten:

1. **Rechnungsempfänger erscheint beim Kassieren**, also nach der Kartenzahlung. Bricht die Verkäuferin dort ab, ist die Karte belastet und kein Beleg da (§3.4 Auslöser vs. Wireframe „Weiter: Zahlen“ – Widerspruch).
2. **Nach „Karte bezahlt“ ist der Bon nicht gesperrt**: `Esc` führt zurück zum Bon (§2.4, §3.3.7), Positionen sind änderbar, der Betrag weicht vom bezahlten Intent ab. Die Regel „Betrag ändert sich nach Start → neu starten“ (§3.3.3) beschreibt einen Zustand, der nicht entstehen darf.
3. **`F10` erneut = nächste Zahlart** (§2.5) läuft über „Karte“ – und „Karte“ startet laut §3.3.3 das Terminal sofort. Wer mit `F10 F10 F10` zu „Gutschein“ will, startet unterwegs eine Kartenzahlung.
4. **Ein dauerhaft deaktivierter „Kassieren“-Knopf** (64 px, beste Stelle des Bildschirms) im Zustand Bon, und ein zweiter „Kassieren“ an derselben Stelle in der Zahlmaske: Ein Doppeltipp landet nach dem Zustandswechsel auf dem echten Kassieren.
5. **„Leitung übernimmt“ ist für genau eine Aktion mit 60 s Zeitlimit definiert**, soll aber auch den mehrstufigen Abschluss (Schritte 3–6) tragen. Wo und wie die Leitung den Abschluss am Kiosk erfährt, ist offen (der Kiosk hat keine Glocke).
6. **Barrierefreiheit im Code-Bauplan**: `role="listbox"` mit Steppern in den Optionen ist verschachtelte Interaktion (axe „nested-interactive“, serious) und bricht das eigene Kriterium X6.

Nach den Pflichtänderungen in §2 ist eine **8–9** erreichbar. Nichts davon verlangt neue Server-Funktionen; es sind Festlegungen in 10.

| Dimension | Note | Kurzbegründung |
|---|---|---|
| Aufgabenfluss (Klicks, Wege) | 7 | Barverkauf, Karte, Anzahlung kurz; Klickzahlen A6, A13, A14, L1, Storno zu niedrig angegeben; zwei Suchfelder übereinander |
| Konsistenz mit 01–05 | 6 | §0.3 listet 9 Abweichungen; mindestens 10 weitere fehlen (§1.8), darunter Raster, Offline-Verkauf, Schnelltasten-Kacheln |
| Tastatur | 7 | Fokusmodell und Belegung jetzt verbindlich; `F10`-Zyklus gefährlich, `<kbd>` 11 px widerspricht K28 |
| Touch / iPad | 7 | Stepper, Wischen, Ziele gut; toter Kassieren-Knopf, Ghost-Tap, Zählen-Sheet verdeckt Zeilen, 768-px-Leiste zu eng |
| Leer-/Fehlerzustände | 8 | §3.14 vollständig; Übergangstexte schicken Mitarbeiter an Orte ohne Rechte; Offline-Fall „Zahlung ohne Beleg“ fehlt |
| Undo / Rückfragen | 6 | Kassenbuch-Buchung ohne Undo und ohne Rückfrage; Bon verwerfen mit Dialog **und** Undo; E-Mail per Häkchen ohne Undo |
| Barrierefreiheit WCAG 2.2 | 6 | Listbox mit Knöpfen, Toast verdeckt Kassieren (2.4.11), Leitungs-Zeitlimit ohne Warnung (2.2.1), PIN ohne Alternative (3.3.8) |
| Visuelle Modernität | 7 | Ruhig, zweispaltig, Instrument Sans; zu viele Zeilen über den Positionen, leerer Bon zeigt nur ein Icon, Steuerkürzel in jeder Zeile |
| Bewegung (04) | 8 | Token-genau; „je 160 ms“ (Ergebnis, Abschluss) ist Stagger, im Kiosk verboten (§13) |

---

## 1. Befunde

Schweregrad: **P1** = vor Bau ändern (Geldverlust, Sackgasse, WCAG-Fehler, Widerspruch für den Bau-Agenten) · **P2** = vor Abnahme · **P3** = Feinschliff. Heuristik nach Nielsen: H1 Status sichtbar · H2 Sprache der Nutzer · H3 Kontrolle/Ausweg · H4 Konsistenz · H5 Fehlervermeidung · H6 Erkennen statt Erinnern · H7 Effizienz · H8 Minimalismus · H9 Fehler erkennen/beheben · H10 Hilfe.

### 1.1 Erledigung der Befunde aus Fassung 1

| Befund (alt) | Status in Fassung 2 | Rest |
|---|---|---|
| T1/A3 Fokusmodell | erledigt §2.4 | ARIA-Bauplan falsch (B-11) |
| T2–T4 F-Belegungen | erledigt §2.5 | `F10`-Zyklus (B-03), Nachzug 04 §3.11–3.13 fehlt (§1.8) |
| L1 Zahlmaske ≤ 600 px | teilweise | Rechnung ohne Abstände, real ≈ 654–686 px (B-07) |
| L2/Z1 Dauer-Numpad, zwei Modelle | erledigt | `C`-Taste fehlt, 4. Spalte je Kontext offen (B-20) |
| L3/V2 Schrift, Bodoni | erledigt §3.0 | `<kbd>` 11 px (B-22) |
| L4 Inline-Stepper | erledigt | – |
| L5/L10 Tägliches im `⋯` | erledigt | zwei `⋯`-Menüs (B-18) |
| L6/L9 768-px-Wireframe, Zählen scrollt | erledigt | Summenleiste zu eng (B-19), Zähl-Sheet verdeckt (B-14) |
| Z2/Z3/E3/E4 Terminal, Zahlung ohne Beleg | erledigt | Sperre nach „bezahlt“ (B-02), Offline-Fall (B-16) |
| U1–U7 Tooltips, Undo, Rückfragen, Idle, PIN | weitgehend | Kassenbuch ohne Undo (B-15), Verwerfen doppelt gesichert (B-17) |
| E1–E11 Leerzustände | erledigt §3.14 | Verwaltung: Filter-leer-Texte fehlen (B-30) |
| A1–A7 WCAG | weitgehend | neue Befunde B-11, B-12, B-13, B-23 |

### 1.2 Zahlung und Geldfluss

| # | P | Heur. | Fundstelle | Befund | Änderung |
|---|---|---|---|---|---|
| B-01 | P1 | H5, H3 | §3.4 Auslöser, §1.1 A8, Wireframe „Weiter: Zahlen“ | Auslöser ist „Kassieren“, der Dialog endet aber mit „Weiter: Zahlen“. Bei Karte ist zum Zeitpunkt „Kassieren“ schon bezahlt; „Zurück“ im Dialog lässt eine belastete Karte ohne Beleg zurück. | Auslöser = **Antippen einer Zahlart** (bzw. `F10`/`F12`) bei `gesamt_cent ≥ barverkauf_rechnung_ab_cent` ohne Kontakt. Erneute Prüfung bei jeder Rückkehr Bon → Zahlmaske. Nie nach Terminalstart. „Zurück“ führt zum Bon, nie in die Zahlmaske. |
| B-02 | P1 | H5 | §2.4 Zahlmaske `Esc`, §3.3.3 „Betrag ändert sich nach Start“, §3.3.7 | Nach „Bezahlt“ kann die Verkäuferin per `Esc`/„‹ Bon“ zurück, Positionen ändern, scannen. Betrag ≠ Intent → Server lehnt ab → Zustand §3.3.6 wird künstlich erzeugt. Während „Wartet auf Karte“ ist ebenfalls nicht festgelegt, was ein Artikel-Scan tut. | Neuer Zustand **„Karte läuft / Karte bezahlt“**: Bon, Kunde, Split gesperrt (Positionsliste `aria-disabled`, Text „Zahlung läuft – Bon gesperrt“). Artikel-Scan → Hinweis „Scan ignoriert – Zahlung läuft“. „‹ Bon“ und `Esc` bei laufendem Terminal = Abbrechen-Dialog, bei „bezahlt“ deaktiviert mit Text „Erst kassieren“. Zeile „Betrag ändert sich nach Start“ streichen. |
| B-03 | P1 | H5, H4 | §2.5 `F10` | „Erneut `F10` = nächste Zahlart (Bar → Karte → Gutschein → Überweisung)“ + „Karte startet sofort“ = Kartenzahlung beim Durchschalten. Versteckter Modus (H6). | `F10` im Bon = Zahlmaske mit Bar. `F10` in der Zahlmaske = Popover „+ Zahlart“ öffnen (`↑/↓`, `Enter`); Karte startet erst mit `Enter` auf „Karte“. Kein Zyklus. |
| B-04 | P1 | H8, H5 | §3.1 Summenpanel „Kassieren … deaktiviert ‚Zahlart wählen‘“, §3.3 Kassieren | Im Zustand Bon ist „Kassieren“ nie aktiv – ein toter 64-px-Knopf an der wichtigsten Stelle. Er sitzt an derselben Stelle wie „Kassieren“ der Zahlmaske: Doppeltipp (Ghost-Tap) bucht nach dem Wechsel. | Im Zustand Bon heißt der Knopf **„Kassieren 129,60 €“** (primary, aktiv ab 1 Position) und öffnet die Zahlmaske mit Bar (= `F12`). Zahlart-Kacheln darüber bleiben Direktwege. In der Zahlmaske nimmt der Kassieren-Knopf Zeigereingaben erst **300 ms nach Zustandswechsel** an (`pointer-events` erst danach). |
| B-05 | P1 | H4, H7 | §3.3.2 „passend = Gegeben + Kassieren. Andere Schnellbeträge setzen nur Gegeben.“ | Vier gleich aussehende Tasten mit zwei verschiedenen Wirkungen. Mit „200“ braucht der Barverkauf 3 Tipps, mit „passend“ 2. | Eine Regel: **Jeder Schnellbetrag bucht sofort** (alle sind ≥ Rest). Getippter Betrag + „Kassieren“/`Enter`. Das Feld „Gegeben“ ist mit dem Rest vorbelegt und markiert (erste Ziffer überschreibt), damit „Kassieren“ ohne Eingabe = passend. Beschriftung der Spalte: Kopf „Sofort kassieren“ 14 muted, Tasten „Passend“ · „130 €“ · „200 €“. |
| B-06 | P1 | H4 | §3.3 Wireframe Split | Zahlen falsch: Gesamt 129,60, Karte 29,60, Bar „150,00 · Rückgeld 20,40“ – richtig wären 50,00 Rückgeld. Es fehlt die Regel, ob die Bar-Zeile „Anteil“ oder „gegeben“ ist. | Regel festschreiben: Jede Split-Zeile hat **Anteil**; nur Bar hat zusätzlich **Gegeben** (≥ Anteil) und **Rückgeld**. Unbar zuerst erfasst, Bar nimmt den Rest. Wird Bar zuerst erfasst, ist der getippte Betrag der Bar-Anteil (kein Rückgeld), „+ Zahlart“ übernimmt. Wireframe-Zahlen korrigieren (§3.2 unten). |
| B-07 | P1 | – | §3.3 Höhenrechnung | 48+32+48+14+56+256+24+48+64 = 590 px **ohne** Abstände; mit 8 Abständen à 8 px und 2 × 16 px Innenrand ≈ 686 px. Mit Kopf 56, einem Band 40, Rand 32 ≈ 814 px bei 820 px Höhe; mit zwei Bändern oder Safe-Area im Web-App-Modus Scroll. K5 prüft nur „ein Band“. | Aufbau nach §3.2: Kopf und „Offen“ in einer 56-px-Zeile, „Gegeben“-Label im Feld, „+ Zahlart“ als Textknopf am Ende der Split-Zone. Ziel **≤ 568 px**. K5 auf „zwei Bänder + Safe-Area 24 px“ verschärfen. |
| B-08 | P1 | H7 | §3.3.3 Start „mehrere → Kacheln“ | Bei zwei Readern kostet jede Kartenzahlung einen Tipp mehr. | Standard-Terminal je Gerät/Kasse (Einstellung am `PH Geraet` – fehlt in App ph_core, Übergang: zuletzt genutztes Terminal je Gerät lokal). Kacheln nur, wenn der Standard-Reader offline/beschäftigt ist. |
| B-09 | P2 | H5 | §3.3.3 „180 s automatischer Abbruch“ | Abbruch während der Kunde PIN tippt oder der Reader „verarbeitet“ meldet, erzeugt Streit an der Theke. | Automatischer Abbruch nur im Reader-Zustand „wartet auf Karte“. Bei „verarbeitet“ kein Timer, Text „Wird verarbeitet …“. |
| B-10 | P2 | H3 | §3.3.6 „Verlassen nur durch Buchung oder Leitung“ | Kunde hat bezahlt und wartet. Kein automatischer Wiederholversuch; „Als zu klären ablegen“ erzeugt eine `PH Aufgabe` – geht nicht, wenn der Server der Grund ist. | „Erneut buchen“ zusätzlich automatisch 3 × (2/4/8 s, 02 §7.2) mit Text „Versuch 2 von 3 …“. „Als zu klären ablegen“ legt lokal im Puffer ab (IndexedDB, `idempotency_key`) und reicht die Aufgabe nach. Für den Kunden: Feld „E-Mail für den Beleg“ (optional, `data-scan="nein"`), Beleg wird nach Buchung gesendet. Text an der Theke: „Zahlung ist angekommen. Den Beleg schicken wir per E-Mail oder drucken ihn nach.“ |

### 1.3 Bon, Suche, Fokus, Tastatur

| # | P | Heur. | Fundstelle | Befund | Änderung |
|---|---|---|---|---|---|
| B-11 | P1 | WCAG 4.1.2, 1.3.1 | §2.4 „Listbox `aria-activedescendant`“, §3.1 Positionsliste `role="listbox"` mit Steppern | Optionen einer Listbox dürfen keine Knöpfe enthalten (axe `nested-interactive`, serious → bricht X6). Ein Eingabefeld, das per `aria-activedescendant` zwei verschiedene Listen steuert (Treffer **oder** Positionen), ist für VoiceOver nicht vorhersagbar. | Positionsliste = `role="grid"` (Zeile = `row`, Zellen `gridcell`, Stepper als echte `button`), Roving-Tabindex. Scanfeld = `role="combobox"` **nur** für die Trefferliste. Bei leerem Scanfeld bewegt `↑` den echten Fokus in die letzte Positionszeile; `Esc` oder jede Zeicheneingabe/jeder Scan bringt ihn zurück. Der Scanner wirkt ohnehin fokusunabhängig (`useScanner`). |
| B-12 | P1 | H4, H8, H6 | §3.1 Kundenleiste (Suchfeld 48) + Scanfeld (48) | Zwei Suchfelder übereinander („Kunde, Karte, Auftrag …“ und „Scannen oder suchen“). Das Scanfeld erkennt laut §2.6 bereits KK-/AB-/RE-/BE-Codes. Verkäuferinnen tippen Namen ins falsche Feld; 48 px Höhe gehen verloren. | **Ein Feld** „Artikel, Kunde, Karte, Auftrag“ mit gruppierten Treffern (Artikel · Kunden · Aufträge/Rechnungen, je max. 4, Gruppenüberschrift 14 muted). `Enter`/Scanner-Enter übernimmt den ersten **Artikel**; Kunden werden angetippt oder per `↓` gewählt. `F2` setzt den Filter-Chip „Kunde:“ ins Feld. Die Kundenleiste zeigt nur noch den gewählten Kunden oder den Knopf „+ Kunde“. Chip „Laufkunde (aktiv)“ entfällt (ohne Kunde = Laufkunde, Text im Bon-Kopf). |
| B-13 | P1 | WCAG 2.4.11, H5 | §3.1 Toast „unten Mitte“, §0.3 | Toast 480 px mittig auf 1180 px reicht bis x ≈ 830; die rechte Spalte beginnt bei x ≈ 790. Der Toast verdeckt den linken Teil von „Kassieren“ genau in den 6 s nach einer Änderung. | Toast **am unteren Rand der linken Spalte** verankert, Breite ≤ Spaltenbreite − 32, nie über der rechten Spalte. 768–1099 px: über der 72-px-Summenleiste, volle Breite − 32. „Pausiert bei Berührung“ präzisieren: Berührung **des Toasts**. |
| B-14 | P2 | H5 | §2.5 Mengenvorwahl „Ziffern + `*`“ + §2.4 „Suche ab 2 Zeichen, 120 ms“ | `1 2 *` löst nach `1 2` eine Suche aus, Trefferliste flackert vor dem `*`. | Reine Ziffernfolgen < 4 Zeichen lösen keine Suche aus; erst `*` (Mengenchip) oder ≥ 4 Ziffern (EAN-Anfang). |
| B-15 | P2 | H6, H8 | §3.1 Steuerkürzel A–F je Zeile, Legende nur im Hilfe-Panel | Erinnern statt Erkennen; für Accessoires ist es fast immer „A“. Unruhe in jeder Zeile. | Steuerkürzel nur zeigen, wenn ≠ `standard_steuersatz`, dann als Wort „10 %“ (14 muted). Die Summenzone zeigt die Aufteilung je Satz wie bisher. |
| B-16 | P1 | H5, Rechte | §3.1 Zeilenblatt „Einzelpreis (Abweichung … Listenpreis)“, §2.3 „Nicht: Rabatt“ | Mitarbeiter dürfen keinen Rabatt geben, können aber den Einzelpreis überschreiben – derselbe Effekt ohne Grund und ohne Leitung. | Einzelpreis nur bei Freitext/Musterverkauf frei; bei Artikeln „Preis ändern · Leitung“ (Schloss, Leitung übernimmt) mit Grund-Chip wie Rabatt. |
| B-17 | P1 | H4 | §3.1 Kopf `⋯` und Scanfeld `⋯` | Zwei `⋯`-Menüs auf einem Bildschirm; „Lade öffnen“ steht in beiden. Nullbeleg (Sonderfall der Leitung) im Menü jeder Verkäuferin. | Ein `⋯` (Kopf): Lade öffnen · Kundendisplay · Vollbild · Verwaltung · Abmelden · (Leitung) Trainingsmodus · Nullbeleg. Bon-Aktionen als beschrifteter Knopf **„Bon ▾“** am Scanfeld: Parken · Verwerfen · Rabatt auf Bon (Leitung). |
| B-18 | P2 | H7 | §2.5 `Strg+P` | Prinzip „keine Browser-Kürzel“ steht im selben Absatz. | `Strg+P` behalten (02 §9.1 nutzt es auch), aber im Prinzipsatz als bewusste Ausnahme nennen; `preventDefault` immer, damit nie der Browser-Druckdialog erscheint. Für `F12` im Kiosk-Chrome die Richtlinie `DeveloperToolsAvailability` sperren (Gerät einrichten, §2.2). |

### 1.4 Rechte, Leitung, Abschluss

| # | P | Heur. | Fundstelle | Befund | Änderung |
|---|---|---|---|---|---|
| B-19 | P1 | H7, H3 | §2.3 / §3.6 / §3.11 „Leitung übernimmt“ | Ablauf: Mitarbeiterin tippt „Stornieren · Leitung“ → Leitung kommt, wählt Kachel, PIN → **dann erst** Storno-Dialog mit Grund und Rückzahlung. Die Leitung muss die ganze Aktion selbst bedienen; die Mitarbeiterin, die den Fall kennt, ist raus. | Muster **„Freigabe am Ende“**: Mitarbeiterin füllt den Dialog (Grund, Rückzahlungsweg). Der Primärknopf heißt „Zur Freigabe · Leitung“ und öffnet den PIN-Schritt **im selben Dialog** (Kacheln Leitung + PIN, Zusammenfassung oben). Nach PIN läuft die Aktion in der Leitungs-Sitzung und der Kiosk kehrt zurück. Gilt für Storno, Rabatt, Preis ändern, Retoure bar, Anzahlung über Soll. |
| B-20 | P1 | WCAG 2.2.1 | §3.11 „Zeitlimit 60 s ohne Aktion → zurück“ | Zeitlimit ohne Warnung; eingegebener Grund geht verloren. | Ab 45 s Zeile im Dialog „Freigabe endet in 15 s“ + „Weiter“. Bei Ablauf bleiben die Eingaben der Mitarbeiterin erhalten (Dialog bleibt offen, nur PIN-Schritt zurückgesetzt). |
| B-21 | P1 | H4, H1 | §3.8 „Mitarbeiterin endet nach Schritt 2, Leitung macht 3–6“, §1.2 L1 „Glocke … → PIN = 2“ | (a) Der Kiosk hat keine Glocke; die Leitung erfährt „gezählt“ nur in der Verwaltung. (b) „Leitung übernimmt“ ist für **eine** Aktion mit 60 s gebaut, Schritte 3–6 sind vier Schritte mit Tresor-Entnahme. (c) L1 = 2 Klicks ist falsch: Glocke, Eintrag, Weiter (Differenz), ggf. Grund, Weiter/Überspringen (Entnahme), Unterschrift, Abschließen ≥ 6. | Festlegen: Die Leitung schließt am Kiosk per **Bedienerwechsel** ab (volle Sitzung, Band „Abschluss Kassa 1 gezählt – Leitung schließt ab“ nach Übergabe sichtbar für alle am Gerät, Rang zwischen 2 und 3) **oder** in der Verwaltung (Abschluss-Akte „Abschließen“ öffnet denselben Assistenten ab Schritt 3). „Leitung übernimmt“ nicht für den Abschluss. L1 auf „5–7 + Zählprüfung“ korrigieren. Schrittleiste zeigt der Mitarbeiterin „1 Soll · 2 Zählen · danach Leitung“ statt 6 Schritte. |
| B-22 | P1 | H5 | §3.8 Schritt 2 Zählen „Zahlen-Tastatur als Sheet unten“ | Das Sheet (≈ 330 px) verdeckt die unteren Münzzeilen und die sticky Fußleiste; „Enter springt zur nächsten Zeile“ springt unter das Sheet. `scroll-margin-block: 96px` reicht nicht. | ≥ 1100 px: Zahlen-Tastatur **fest in der dritten Spalte** unter Soll/Ist (Soll/Ist 9 Zeilen × 28 px ≈ 252 px + Tastatur 4 × 64 + 3 × 8 = 280 px → passt in 820 px). Aktive Zählzeile `selected` + 2-px-Balken. < 1100 px: Sheet, aktive Zeile per `scroll-margin-bottom: calc(Sheethöhe + 16px)` immer darüber. |
| B-23 | P2 | Kontrolle | §3.8 Schritt 2 zeigt Soll und Differenz während des Zählens | Wer das Soll beim Zählen sieht, „findet“ die fehlenden Münzen. Für eine Kassenkontrolle ist Blindzählung üblich. | Einstellung „Blind zählen“ (Inhaber-Entscheidung; Feld fehlt in App ph_kassa). Bei „ja“ sieht die Mitarbeiterin nur „Gezählt“, Soll und Differenz erst die Leitung in Schritt 3. |
| B-24 | P2 | H1 | §3.8 Schritt 1, §3.1 Geparkt | Geparkte Bons am Abend sind im Abschluss unsichtbar; Positionen bleiben unbezahlt „in der Luft“. | Schritt 1 zeigt „2 geparkte Bons (Anna, 11:20; Maria, 15:02)“ mit „Weiterführen“ · „Verwerfen“. Geparkt-Kacheln zeigen Bediener, Uhrzeit, Anzahl Positionen, Summe, Kunde. |
| B-25 | P1 | H4 | §3.7 Segment „Anfangsbestand“ + §3.8 Schritt 2 „Anfang (Vortag) vorbelegt“ | Zwei Stellen für denselben Wert. Bucht jemand morgens „Anfangsbestand 150“ im Kassenbuch, schlägt der Abschluss abends einen anderen Vortageswert vor. | Segment „Anfangsbestand“ entfernen. Beim **ersten Bedienerlogin des Tages** an der Kasse eine Karte „Wechselgeld in der Lade: 150,00 € (aus Abschluss 03.11.)“ [Stimmt] [Anders gezählt] (Leitung, Grund). Abschluss übernimmt diesen Wert. Tage ohne Vortagsabschluss: Eingabe dort. |

### 1.5 Undo und Rückfragen

| # | P | Heur. | Fundstelle | Befund | Änderung |
|---|---|---|---|---|---|
| B-26 | P1 | H5, H3, 02 §6.2 | §3.7 Kassenbuch „Buchen“ – Rückfrage nein, Undo nein, Storno nur Leitung in der Verwaltung | Geldwirksam, sofort gebucht, Tippfehler 2.000 statt 200 nur mit Leitung reparierbar. Die Lade öffnet laut Konzept beim Einlegen/Entnehmen **nicht** (nicht festgelegt) – Geld muss aber physisch hinein/heraus. | Knopftext mit Betrag: „200,00 € entnehmen“. Danach Toast „Entnahme 200,00 € · Rückgängig“ 6 s mit **verzögertem Commit** (04 §3.6 Variante A, `flush()` bei Bedienerwechsel/Sperre). Lade öffnet mit dem Commit (`schublade_oeffnen`). Warnung „Entnahme größer als Bargeld in der Lade“ als Zeile über dem Knopf, nicht erst nach dem Tipp. |
| B-27 | P2 | 02 §6 | §3.13 Bon verwerfen: Dialog **und** Undo 6 s | Doppelte Sicherung bremst; 02 §0.4 „Undo statt Rückfrage“. | Kein Dialog. „Verwerfen“ wirkt sofort, Toast „Bon mit 3 Positionen verworfen · Rückgängig“ 6 s. Dialog nur, wenn der Bon eine Anzahlung oder einen vorgemerkten Vorteil enthält. |
| B-28 | P1 | H5, WCAG 3.2.2 | §3.10 „☐ Beleg an m.muster@… senden – Haken sendet sofort“ | Ein Kontrollkästchen, das eine Aktion auslöst, widerspricht seiner Bedeutung (Zustand). Kein Undo bei falscher Adresse. | Knopf „Beleg an m.muster@… senden“ (secondary 48). Versand mit 6 s Verzögerung, Toast „Beleg wird an m.muster@… gesendet · Rückgängig“ (Muster 02 §6.1 Termin-Mail). |
| B-29 | P2 | H1 | §3.10 | Was die linke Spalte während der Ergebnis-Karte zeigt, ist nicht festgelegt. | Linke Spalte zeigt den gebuchten Bon schreibgeschützt (`surface-2`, Kopf „Beleg K1-000124 · gebucht“). Erster Scan oder „Nächster Kunde“ leert sie. |

### 1.6 Leer-, Fehler- und Übergangszustände

| # | P | Heur. | Fundstelle | Befund | Änderung |
|---|---|---|---|---|---|
| B-30 | P1 | H9, H3 | §3.6 „Gutschein in Shop-Verwaltung prüfen“, „Leitung über Stripe“, §3.10 „in Faktura erstellen / prüfen“ | Übergangstexte schicken Verkäuferinnen in Bereiche, auf die sie kein Recht haben, während der Kunde wartet (Sackgasse). | Jeder Übergangsfall legt **automatisch** eine `PH Aufgabe` an die zuständige Rolle an; Text an der Kassa: „Die Leitung ist informiert (Aufgabe angelegt).“ Bei Terminal-Belegen zusätzlich ein Weg für den Kunden: „Als Gutschein erstatten“ (Mitarbeiterin) · „Bar erstatten · Leitung“. |
| B-31 | P1 | H3 | §3.4 Rechnungsempfänger | Kein Ausweg, wenn der Kunde keine Anschrift nennen will (Kunde wartet, Ware liegt auf der Theke). | Bis zur Inhaber-/Steuerberater-Entscheidung §15 (7): Knopf „Ohne Anschrift · Leitung“ (Freigabe am Ende, Grund-Chip, Vermerk am Beleg). Nach Entscheidung entweder harter Stopp mit Text oder Ausweg ohne Leitung. |
| B-32 | P2 | H7 | §4 Verwaltung „Leerzustände in drei Fällen“ | Texte nur für „nie Daten“ (V1, V3, V7); Fall „Filter leer“ fehlt überall, Fall „keine Rechte“ fehlt. | Je Liste ein Satz: „Keine Belege mit Status ‚Storniert‘ im Oktober.“ + „Filter zurücksetzen“; Terminals für Buchhaltung extern: Seite nicht in der Navigation (05 §8.3), Direktaufruf „Dafür fehlt dir die Berechtigung (Kassa-Leitung).“ |
| B-33 | P2 | H2 | §3.1 Statusfeld „Drucker?“, §3.12 „Verbindung?“, §2.4 „Scan ignoriert – Feld schließen“ | Fragezeichen als Statuswort und „Feld schließen“ sind unklar. | „Drucker prüfen“ · „Verbindung schwach“ · „Scan ignoriert – erst Eingabe beenden“. |
| B-34 | P2 | H1 | §3.1 Bänder „max. 2 sichtbar, weitere als ‚+1‘“, Training Rang 7 | Bei SEE-Ausfall + Vortag offen verschwindet „Training“ im „+1“. Wer im Training kassiert und es nicht sieht, glaubt an echte Umsätze (oder umgekehrt). | Training zusätzlich **immer** als Pille „TRAINING“ (`special`) im Statusfeld der Kopfzeile, unabhängig vom Bandstapel. „+1“ ist ein Knopf 48 px und öffnet ein Popover mit allen Bändern. |
| B-35 | P2 | H5 | §3.1 Bänder Eintritt per `grid-template-rows` | Ein Band, das während der Zahlmaske erscheint (SEE-Ausfall, Sperre naht), schiebt „Kassieren“ 40 px nach unten, während der Finger zielt. | Bänder Rang 2–9 erscheinen erst nach Verlassen der Zahlmaske/Ergebnis-Karte; Rang 1 sofort. Idle-Warnung (Rang 9) kommt in der Zahlmaske ohnehin nicht (§3.11). |

### 1.7 Barrierefreiheit (WCAG 2.2 AA) – neue Befunde

| # | P | SC | Fundstelle | Befund | Änderung |
|---|---|---|---|---|---|
| A-01 | P1 | 4.1.2 | §3.1 Positionsliste | siehe B-11 | grid statt listbox |
| A-02 | P1 | 2.4.11 | §3.1 Toast | siehe B-13 | Toast in linker Spalte |
| A-03 | P1 | 2.2.1 | §3.11 Leitung 60 s | siehe B-20 | Warnung + Verlängern |
| A-04 | P2 | 3.3.8 | §3.11 PIN mit `inputmode="none"`, `autocomplete="off"` | Gedächtnistest ohne Alternative; Passwort-Manager sind ausgeschlossen (02 §10 verlangt sie). Am geteilten Gerät praktisch nur über ein Objekt lösbar. | Alternative **Bedienerkarte**: Barcode/QR am Namensschild, Scan auf `/wechsel` = Anmeldung ohne PIN, nur in Verbindung mit gebundenem Gerät; Leitungs-Freigaben weiter mit PIN. Anfrage an ph_core (`verify_badge(code, geraet_token)`). |
| A-05 | P2 | 4.1.3 | §3.0 Ansage je Hinzufügen | 5 Scans in 2 s = 5 Ansagen in der Warteschlange; VoiceOver liest noch Scan 2, wenn Scan 5 da ist. | Ansagen bündeln: innerhalb 1 s nur die letzte („Vase Alva, jetzt 4 Stück. 5 Positionen, Gesamt 249,30 Euro.“). |
| A-06 | P2 | 1.4.1 | §3.1 „Doppelt gescannt: Zeile `warning`-Hintergrund 1200 ms, Ansage“ | Sichtbar nur Farbe; Text nur für Screenreader. | Sichtbarer Text unter dem Scanfeld „Vase Alva jetzt 4 Stück“ (14, `warning-text`, 1500 ms) wie 04 §3.12. |
| A-07 | P2 | 2.1.1 | §9 „Langdruck 400 ms = Zeilenmenü“, §3.3.1 „⌫ lang drücken löscht alles“ | Keine Tastatur-/sichtbare Alternative genannt. | Zeilenmenü: Kontextmenü-Taste und `Shift+F10` auf der aktiven Zeile. Alles löschen: sichtbare Taste `×` 48 px rechts im Anzeigefeld (`aria-label="Betrag löschen"`), Taste `Entf`. |
| A-08 | P2 | 2.5.8 | §3.1 Kundenleiste `×`, Vorteil-Chip, „+1“ | Größe nicht angegeben. | Alle drei 48 × 48; Vorteil-Chip `aria-pressed`. |
| A-09 | P3 | 1.3.1 | §3.3.6, §3.14 | `role="alert"` für Servertext und Band gleichzeitig = doppelte Ansage. | Band `role="alert"` nur Rang 1; Servertext darunter `aria-describedby` am Knopf „Erneut buchen“. |

### 1.8 Konsistenz mit 01–05 (Abweichungen, die §0.3 nicht nennt)

§0.3 ist ein guter Schritt. Für den Bau-Agenten gilt aber jede **nicht** gelistete Abweichung als Widerspruch, weil er 01–05 als verbindlich liest.

| # | Thema | 10 (Fassung 2) | Leitlinie | Vorschlag |
|---|---|---|---|---|
| K-01 | Raster | 2 Spalten 8/4 | 03 §6.3: 3/5/4 · 05 §3.14: drei Spalten | in §0.3 aufnehmen; 03 §6.3 und 05 §3.14 nachziehen (2 Spalten ist richtig) |
| K-02 | Scanfeld-Fokus | Fokus-Heimat, nie Zwang | 03 §6.3 „Scan-Feld immer fokussiert“ | aufnehmen; 03 nachziehen |
| K-03 | Offline-Verkauf | ohne Klasse B: Verkauf **gestoppt** | 01 F1 „Netz trennen → Verkaufen weiter möglich“, 02 §7.2 „Belege werden gepuffert“ | aufnehmen **und als Inhaber-Entscheidung** in §15: Kassa steht bei Netzausfall, bis Notbetrieb freigegeben ist. Das ist die geschäftlich folgenreichste Abweichung |
| K-04 | Schnelltasten | eine 56-px-Reihe, wischbar | 01 F3 Kacheln ≥ 96 × 72, konfigurierbar | aufnehmen; leerer Bon zeigt Kacheln (P2-03) |
| K-05 | Kundenkarten-Vorteil | Antippen = vormerken | 02 §1.6 „Vorteil wird automatisch angewendet“, 02 §15.6 | aufnehmen; 02 nachziehen (Vormerken ist richtig, weil Limits gelten) |
| K-06 | Toast Kiosk | unten | 03 §8.12 „Kiosk: oben Mitte, 480 px, 18 px“ | 03 §8.12 in Nachzugliste ergänzen |
| K-07 | Kürzel in Texten | F9 = Abschluss, F2 = Kunde | 04 §3.11 „nochmals (F9)“, 04 §3.13 „Nächster Kunde (F2)“, 04 §3.12 „(F3)“ | 04 §3.11–§3.13 in Nachzugliste |
| K-08 | Zahlenblock / Summe | Taste 64, Summe 44 | 02 §11.3 „Tasten 56 px, Summe 48 px“ | 02 §11.3 in Nachzugliste |
| K-09 | Sperrbild | 240 ms Fade | 01 F6 „sanfte Abdunklung 400 ms“ | 01 F6 nachziehen (04 gilt) |
| K-10 | Klickziele 02 §1.6 | Barverkauf 2, Abschluss 3 + Zählen | 02 §1.6 Barverkauf 3, Abschluss 3 | 02 §1.6 übernimmt 10 §1.1 |
| K-11 | Zahlen-Tastatur | 4. Spalte Schnellbeträge, kein `C`, kein `↵` | 03 §8.20 „3×4 + Spalte (⌫, C, 00, ↵)“ | steht pauschal in Nachzug; Inhalt der 4. Spalte je Kontext fehlt (P1-20) |

### 1.9 Visuelle Modernität (Maßstab Square, Lightspeed, Shopify POS, Linear, Stripe)

| # | P | Befund | Änderung |
|---|---|---|---|
| M-01 | P2 | Über den Positionen stehen bis zu 5 Zeilen (Kundensuche 48, Kunde 48, Chips 48, Scanfeld 48, Schnelltasten 56 = 248 px + Band). Bei vollem Kunden sieht die Verkäuferin 6–7 Positionen. | Nach B-12: Scanfeld 56 · Kunde+Chips in **einer** Zeile 56 (Chips wischbar rechts) · Schnelltasten 56 = 168 px. |
| M-02 | P2 | Leerer Bon = Icon + ein Satz auf ≈ 460 px Fläche. Moderne POS zeigen hier Favoriten. | Leerzustand zeigt die Schnelltasten als Kacheln 120 × 88 (Icon 24, Titel 16/500) in 2 Reihen; mit der ersten Position schrumpfen sie zur Reihe (ohne Animation, Kiosk). |
| M-03 | P3 | Fünf Kennzahlen + vier Charts auf V0 für 1–2 Kassen; Donut „Belege nach Belegart“ zeigt fast nur Standardbelege. | Donut streichen; Charts „Kassenumsatz je Tag“ und „Kassendifferenzen je Monat“ behalten, die anderen zwei in Berichte. |
| M-04 | P2 | Kennzahl „Kassendifferenz Monat −0,18 €“ als Summe: −50 € und +49,82 € ergeben −0,18 €. | „3 Abschlüsse mit Differenz · größte −50,00 € (02.11.)“; Summe als Nebenwert. |
| M-05 | P3 | 768–1099 px Kopf: fünf Icon-Tasten ohne Wort, „Wort im Popover“ ist undefiniert; 02 §13 „Icons nur mit Textlabel“, Kiosk ohne Tooltips. | Belege · Abschluss mit Kurzwort (14 px) behalten; Kassenbuch/Hilfe/`⋯` als Icon mit Wort darunter 12 px **nicht** erlaubt (Kiosk ≥ 14) → Kassenbuch ins `⋯`, Hilfe bleibt `?` mit `aria-label`. |
| M-06 | P2 | Summenleiste 768 px: „Gesamt 129,60 € [Bar] [Karte] [Gutsch.▾] [Kassieren]“ ≈ 750 px bei 736 px Nutzbreite; „Gutsch.▾“ enthält Überweisung (falsches Modell). | `Gesamt 129,60 €` · `[Bar]` `[Karte]` `[Andere ▾]` · `[Kassieren 129,60 €]` entfällt (= Bar-Taste, B-04); „Andere ▾“ = Gutschein, Überweisung. |
| M-07 | P3 | Kassenbuch heißt am Kiosk „Kassenbuch“ (Buchhaltungswort). | Kopfknopf „Bargeld“ (Icon `arrow-down-up`), Dialogtitel „Bargeld einlegen oder entnehmen“. |

### 1.10 Bewegung (Abgleich 04, 10 §13)

| # | P | Fundstelle | Befund | Änderung |
|---|---|---|---|---|
| BW-01 | P1 | §3.8 Schritt 6 und §3.10 „Inhalte ab 200 ms, je 160 ms“ | „je“ liest sich als Stagger; §13 verbietet Stagger im Kiosk. | „Alle Inhalte gemeinsam ab 200 ms, 160 ms `--bo-ease-out`, nur `opacity`“. |
| BW-02 | P2 | §13 Toast Reduced Motion „Balken bleibt (Information)“ | Unklar, ob er läuft. 04 §3.6: Balken steht, Text zählt herunter. | „Balken steht voll, Text ‚Rückgängig (6 s)‘ zählt sekündlich; Timer ist die einzige Wahrheit.“ |
| BW-03 | P3 | §3.1 Vorteil-Chip Textwechsel „wird mit dem Beleg eingelöst“ | Chip wird breiter, Nachbarn springen. | Text unter der Kundenzeile (14 muted), Chip selbst nur Füllung + Haken-Icon. |
| BW-04 | – | übrige Tabelle §13 | token-genau, Verbote vollständig | beibehalten |

### 1.11 Klickzahlen (§1.1/§1.2 nachgezählt, Zählweise von 10)

| # | Angabe | Nachgezählt | Grund |
|---|---|---|---|
| A3 | 3 | Karte 3 · Suche 4 | „Kunde suchen“: Treffer antippen = +1 |
| A6 | 3 | 4 (mit B-05: 3) | Schnelltaste · Betrag 50 · Übernehmen · Zahlart · passend |
| A13 | 5 | Leitung heute nicht möglich für Mitarbeiter; Assistent ≥ 7 + Leitung | Grund-Chip (Pflicht) und „Weiter“ je Schritt fehlen in der Zählung |
| A14 | 2 | 3 | PIN 4–6 Stellen variabler Länge → kein Auto-Absenden, „OK“ nötig |
| A16 Storno | „+1“ | Belege · Zeile · Stornieren · Kachel · PIN-OK · Grund · Stornieren = 7 | mit B-19 (Freigabe am Ende): 6, und die Leitung tippt nur 2 |
| L1 | 2 | 5–7 | B-21 |

Pflicht: Tabelle in 10 korrigieren; E2E-Kriterien zählen echte Tipps (Testhilfe `zaehleTipps()` im Mock).

---

## 2. Pflichtänderungen (P1, vor Bau) mit Abnahmekriterium

| # | Änderung (Fundstelle 10) | Abnahme |
|---|---|---|
| P1-01 | Rechnungsempfänger beim Betreten der Zahlmaske statt beim Kassieren (§3.4, §1.1 A8) | E2E: Bon 450 € ohne Kunde → „Karte“ antippen öffnet Rechnungsempfänger, Terminal startet erst nach „Weiter“; „Zurück“ landet im Bon |
| P1-02 | Zustand „Karte läuft/bezahlt“: Bon gesperrt, Artikel-Scan ignoriert mit Text, `Esc`/„‹ Bon“ nach „bezahlt“ deaktiviert; Zeile „Betrag ändert sich nach Start“ streichen (§2.4, §3.3.3, §3.3.7) | E2E Mock: nach „bezahlt“ kein Weg zurück zum Bon außer Kassieren; Scan während „wartet“ ändert Bon nicht |
| P1-03 | `F10` ohne Zyklus; in der Zahlmaske öffnet `F10` „+ Zahlart“ (§2.5) | E2E: `F10` × 4 startet nie das Terminal |
| P1-04 | Kassieren im Bon = „Kassieren 129,60 €“ (aktiv, öffnet Zahlmaske Bar); 300-ms-Eingabesperre nach Zustandswechsel (§3.1, §3.3) | E2E: Doppeltipp in 150 ms auf Kassieren erzeugt keinen Beleg; im Bon gibt es keinen dauerhaft deaktivierten Primärknopf |
| P1-05 | Eine Schnellbetrag-Regel: alle buchen sofort; „Gegeben“ mit Rest vorbelegt und markiert (§3.3.2) | Unit + E2E: in der Zahlmaske „200 €“ = 1 Tipp bis Ergebnis, Rückgeld 70,40 bei 129,60 |
| P1-06 | Split-Regel Anteil/Gegeben/Rückgeld festschreiben, Wireframe-Zahlen korrigieren (§3.3) | Unit: Karte 29,60 + Bar gegeben 150 → Bar-Anteil 100,00, Rückgeld 50,00 |
| P1-07 | Zahlmaske ≤ 568 px nach §3.2 dieses Berichts; K5 mit zwei Bändern + 24 px Safe-Area (§3.3, §12 K5) | Screenshot-Maß 1180 × 820 |
| P1-08 | Positionsliste `role="grid"` mit Roving-Tabindex; Scanfeld `combobox` nur für Treffer (§2.4, §3.1) | axe nested-interactive = 0; VoiceOver liest Zeile „Vase Alva, 3 Stück, 89,70 Euro, Menge verringern, Knopf“ |
| P1-09 | Ein Suchfeld mit gruppierten Treffern; Kundenleiste nur gewählter Kunde oder „+ Kunde“; Chip „Laufkunde“ entfällt (§3.1, §2.4, §2.5 `F2`) | E2E: „Muster“ tippen → Gruppe Kunden; „Alva“ → Gruppe Artikel; `Enter` nimmt Artikel |
| P1-10 | Toast in der linken Spalte verankert (§3.1, §0.3, §13) | Screenshot: Toast schneidet die rechte Spalte nie |
| P1-11 | Einzelpreis bei Artikeln nur über „Preis ändern · Leitung“ (§3.1 Zeilenblatt, §2.3) | E2E Rolle Mitarbeiter: Einzelpreisfeld Artikel schreibgeschützt |
| P1-12 | Ein `⋯`; „Bon ▾“ beschriftet; Nullbeleg nur Leitung (§3.1, §3.13) | Grep: genau ein `⋯` im Verkauf |
| P1-13 | „Freigabe am Ende“ für alle Leitungsaktionen; Zeitlimit mit 15-s-Warnung, Eingaben bleiben (§2.3, §3.6, §3.11) | E2E zwei Rollen: Mitarbeiterin füllt Grund, Leitung tippt Kachel + PIN, Storno erfolgt; Ablauf nach 60 s behält Grund |
| P1-14 | Abschluss Schritte 3–6 per Bedienerwechsel am Kiosk oder in der Verwaltung, nicht „Leitung übernimmt“; Band „gezählt – Leitung schließt ab“; Schrittleiste rollenbezogen; L1 korrigieren (§3.8, §1.2) | E2E: Mitarbeiterin übergibt, Band erscheint, Leitung wechselt und schließt ab |
| P1-15 | Zählen: Tastatur fest in Spalte 3 ab 1100 px; darunter Sheet mit `scroll-margin-bottom` (§3.8) | Screenshot 1180 × 820: aktive Zeile 1 ct sichtbar, Tastatur sichtbar, kein Überdecken |
| P1-16 | Anfangsbestand nur an einer Stelle (Tagesstart-Karte), Segment entfällt (§3.7, §3.8) | E2E: erster Login des Tages zeigt Karte; Abschluss übernimmt den Wert |
| P1-17 | Kassenbuch: Knopftext mit Betrag, Undo 6 s mit verzögertem Commit, Lade öffnet mit Commit, Warnung vor dem Tipp (§3.7) | E2E: Entnahme → Rückgängig in 6 s → keine Buchung, keine Ladenöffnung; nach 6 s Buchung + Lade |
| P1-18 | E-Mail auf der Ergebnis-Karte als Knopf mit 6 s Undo (§3.10) | E2E: Senden → Rückgängig → `beleg_mailen` nicht aufgerufen |
| P1-19 | Übergangsfälle legen `PH Aufgabe` automatisch an; kein Text verweist Mitarbeiter auf Bereiche ohne Recht; Terminal-Beleg-Rückgabe mit Gutschein-Weg (§3.6, §3.10, §3.5) | Grep der Kiosk-Texte: kein „in Faktura“, „in Shop-Verwaltung“, „über Stripe“ für Rolle Mitarbeiter |
| P1-20 | 4. Spalte der Zahlen-Tastatur je Kontext festlegen; sichtbares `×` im Anzeigefeld statt nur Langdruck (§3.3.1) | Tabelle in 10: Zahlmaske Bar = Schnellbeträge · Karte/Gutschein/Überweisung = leer (Spalte ausgeblendet, Ziffern breiter) · Zeilenblatt Menge = `+1` `+5` `+10` · Zählfeld = `+1` `+10` `+Rolle` · Kassenbuch = `50` `100` `200` |
| P1-21 | `<kbd>` 12 px **oder** K28 mit Ausnahme für `<kbd>` formulieren (§2.5, §12 K28) | CSS-Grep konsistent mit K28 |
| P1-22 | §0.3 um K-01 bis K-11 erweitern; K-03 (Kassa steht offline) als Inhaber-Entscheidung in §15 | Review |
| P1-23 | Rechnungsempfänger mit Ausweg „Ohne Anschrift · Leitung“ bis zur Entscheidung (§3.4, §15) | E2E: Kunde ohne Anschrift → Leitung gibt frei → Beleg mit Vermerk |
| P1-24 | Stagger-Formulierungen in §3.8/§3.10 auf „gemeinsam“ ändern (§13) | Review |
| P1-25 | Klickzahlen §1.1/§1.2 nach §1.11 korrigieren | Review + E2E-Tippzähler |

## 3. Pflichtänderungen P2 (vor Abnahme)

| # | Änderung |
|---|---|
| P2-01 | Standard-Terminal je Gerät; Auto-Abbruch nur im Reader-Zustand „wartet“ (B-08, B-09) |
| P2-02 | „Zahlung erhalten – Beleg offen“: 3 automatische Versuche, lokales Ablegen ohne Server, Kunden-E-Mail für Nachsendung (B-10) |
| P2-03 | Leerer Bon zeigt Schnelltasten als Kacheln 120 × 88 (M-02, 01 F3) |
| P2-04 | Training als Pille im Kopf, „+1“ als Knopf mit Popover, Bänder in Zahlmaske verzögert (B-34, B-35) |
| P2-05 | Blindzählung als Einstellung (Inhaber) (B-23) |
| P2-06 | Geparkte Bons im Abschluss Schritt 1; Kachelinhalt festlegen (B-24) |
| P2-07 | Bedienerkarte als PIN-Alternative (A-04; Anfrage ph_core) |
| P2-08 | Ansagen bündeln (A-05); sichtbarer Text bei Doppel-Scan (A-06); Tastatur-Alternativen Langdruck (A-07); Zielgrößen (A-08) |
| P2-09 | Steuerkürzel nur bei Abweichung (B-15); Ziffernfolgen < 4 ohne Suche (B-14) |
| P2-10 | Verwaltung: Filter-leer- und Rechte-Texte je Liste (B-32); V0 ohne Donut, Differenz-Kennzahl nach M-04 |
| P2-11 | Einstellungen: `gutschein_art`, `barverkauf_rechnung_ab_cent`, `differenz_toleranz_cent`, `terminal_testmodus` **ohne** Autosave – Dialog „Ändern“ mit Pflicht-Kommentar und Folge-Satz („Ab sofort wird … an allen Kassen …“). Autosave und Pflicht-Kommentar schließen sich aus (§4.9) |
| P2-12 | Kassenbuch-Verwaltung: bis ph_kassa je Barbeleg bucht, Spalte `bestand_danach_cent` ausblenden oder „Bestand ohne Barbelege“ beschriften; nur **eine** Zahl „Bargeld in der Lade“ (§4.4, §3.7) |
| P2-13 | AES-Schlüssel-Dialog: Schließen erst nach Haken „Schlüssel gesichert“ (§5.3) |
| P2-14 | Texte nach B-33, M-07; Bon verwerfen ohne Dialog (B-27); linke Spalte während Ergebnis (B-29) |
| P2-15 | Idle: jede Eingabe inkl. Scanner setzt den Timer zurück; Antippen des Sperre-Bands löst keine darunterliegende Taste aus (Band fängt den Tipp, `pointerdown` stoppt) |

---

## 4. Korrigierte Wireframes

### 4.1 Verkauf, Zustand Bon (1180 × 820, ohne Tastatur erkannt)

```
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│ Kassa 1 · Lochau   Anna K. ▾   14:05   ● Bereit  [TRAINING]   [▤ Belege] [⇅ Bargeld] [☑ Abschluss] [?] [⋯] │ 56
├───────────────────────────────────────────────────────────────────────────────────────────────┤
│ △ Signatureinheit ausgefallen seit 09:12 – Belege gültig, werden nachsigniert                  │ 40 (nur wenn)
├──────────────────────────────────────────────────────────────┬────────────────────────────────┤
│ ⌕ Artikel, Kunde, Karte, Auftrag …        [3 ×] [Tippen] [Bon ▾] │ GESAMT                     │ 56
│ Maria Muster · Silber · [Anzahlung AB-…42 · 3.200,00 €] [RE-…113] ▸  × │   129,60 €              │ 56 (nur mit Kunde)
│ [Lieferpauschale] [Gutschein verkaufen] [Anzahlung] [Freitext] [Muster…] ▸ │ Netto 108,00 · USt 21,60 │ 56
│ ──────────────────────────────────────────────────────────── │ 20 % 129,60                  │
│ ▌[▣] Vase Alva                    [–]  3  [+]      89,70 €    │ ┌─────────────┬─────────────┐│
│      29,90 € je Stück                                         │ │ ▤ Bar       │ ▭ Karte     ││ 56
│  [▣] Kissen Lino 40 × 40          [–]  1  [+]      39,90 €    │ ├─────────────┼─────────────┤│
│                                                               │ │ ◫ Gutschein │ ⌂ Überweisg.││ 56
│                                                               │ └─────────────┴─────────────┘│
│                                                               │ Geparkt (2) ▸                │ 48 (nur ≥ 1)
│   ┌ Position entfernt · Rückgängig ───────────┐               │ ┌──────────────────────────┐ │
│   └────────────────────────────────────────────┘ ← Toast links │ │ Kassieren      129,60 €  │ │ 64 primary
│                                                               │ └──────────────────────────┘ │
└──────────────────────────────────────────────────────────────┴────────────────────────────────┘
```

- Steuerkürzel nur bei Abweichung (hier keins). „Laufkunde“ steht nicht als Chip; ohne Kunde entfällt die Kundenzeile, „+ Kunde“ steht in der Trefferliste und als Eintrag in „Bon ▾“.
- „Kassieren 129,60 €“ = Zahlmaske mit Bar (`F12`). Leerer Bon: Knopf deaktiviert, zweite Zeile „Zuerst eine Position“.

### 4.2 Zahlmaske (rechte Spalte, Bar, Split mit Karte, ≤ 568 px)

```
┌──────────────────────────────────────┐
│ ‹ Bon     Offen  0,00 €  ✓ gedeckt   │ 56 (Esc; gesperrt während Karte läuft/bezahlt)
├──────────────────────────────────────┤
│ Karte   29,60 €   ✓ Bezahlt · Tresen │ 48
│ Bar    100,00 €   gegeben 150,00 €   │ 48  Rückgeld 50,00 € (20/600, rechts)
│                          + Zahlart ▾ │ 32 Textknopf (F10)
├──────────────────────────────────────┤
│ ┌──────────────────────────────┬──┐  │
│ │ Gegeben           150,00 €   │× │  │ 56 (Label im Feld, × = löschen)
│ └──────────────────────────────┴──┘  │
│ ┌────┬────┬────┬──────────────┐      │  Kopf der 4. Spalte: „Sofort kassieren“ 14 muted
│ │ 7  │ 8  │ 9  │  Passend     │      │ 64
│ │ 4  │ 5  │ 6  │  200 €       │      │ 64  (Rest 100,00: 10er-Aufrundung und
│ │ 1  │ 2  │ 3  │              │      │ 64   100-€-Schein = Duplikat, entfallen)
│ │ 0  │ 00 │ ,  │  ⌫           │      │ 64
│ └────┴────┴────┴──────────────┘      │
│ ┌──────────────────────────────────┐ │
│ │ Kassieren · Rückgeld 50,00 €     │ │ 64 primary; 300 ms Eingabesperre nach Öffnen
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

Höhe: 56 + 48 + 48 + 32 + 56 + 4 × 64 + 3 × 8 + 64 + 4 Abstände × 8 + Innenrand 2 × 16 = **648 px mit Split**, **568 px ohne Split** (eine Zahlart-Zeile, kein „+ Zahlart“-Abstand). Mit Split und zwei Bändern rückt die Tastatur in den Scrollbereich, „Kassieren“ bleibt sticky – das ist die einzige erlaubte Scroll-Situation.

Zustand Karte (Reader wartet):

```
│ Karte   129,60 €   ● Wartet auf Karte · Tresen │ 48  (Punkt statisch warning)
│ [           Kartenzahlung abbrechen          ] │ 56  Fokus
│ Noch keine Karte – weiter warten oder abbrechen│ 14  (ab 60 s, warning-text)
│ Bon gesperrt, solange die Zahlung läuft.       │ 14  muted
```

### 4.3 Tagesabschluss Schritt 2 (Mitarbeiterin, 1180 × 820)

```
┌ ‹ Zur Kassa   Abschluss Kassa 1 · Di 04.11.   1 Soll · ❷ Zählen · danach Leitung ─────────────────────┐ 56
├ Scheine ─────────────────────┬ Münzen ───────────────────────┬ Summe ─────────────────────────────────┤
│ 500 €  [ 0 ] [–][+]    0,00  │  2 €  [ 14 ] [–][+]  28,00    │ Gezählt          1.100,12 €            │
│ 200 €  [ 1 ] [–][+]  200,00  │  1 €  [ 22 ] [–][+]  22,00    │ (Soll erst für die Leitung, wenn       │
│ 100 €  [ 2 ] [–][+]  200,00  │ 50 ct [  9 ] [–][+]   4,50    │  „Blind zählen“ an)                    │
│  50 €  [ 3 ] [–][+]  150,00  │ 20 ct [ 11 ] [–][+]   2,20    │ ┌────┬────┬────┬──────┐                │
│  20 €  [ 9 ] [–][+]  180,00  │▌10 ct [ 7▏] [–][+]   0,70    │ │ 7  │ 8  │ 9  │ +1   │ 64             │
│  10 €  [ 0 ] [–][+]    0,00  │  5 ct [  0 ] [–][+]   0,00    │ │ 4  │ 5  │ 6  │ +10  │                │
│   5 €  [ 0 ] [–][+]    0,00  │  2 ct [  0 ] [–][+]   0,00    │ │ 1  │ 2  │ 3  │ Rolle│                │
│ [Zählliste drucken]          │  1 ct [  0 ] [–][+]   0,00    │ │ 0  │ ⌫  │ ×  │  ↵   │                │
│                              │                               │ └────┴────┴────┴──────┘                │
├──────────────────────────────┴───────────────────────────────┴────────────────────────────────────────┤
│ [‹ Zurück]                                                              [Zählung übergeben]  64 sticky │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- Aktive Zeile (`▌`, `selected`) ist die Eingabe der festen Tastatur; `↵`/`Enter` springt zur nächsten Zeile, Antippen einer Zeile wählt sie.
- „Rolle“ = Münzrolle der aktiven Stückelung (Stückzahl laut Hilfe-Panel).
- Ohne „Blind zählen“ steht in Spalte 3 zusätzlich der Soll/Ist-Block aus 10 §3.8 über der Tastatur (9 × 28 px).

### 4.4 „Freigabe am Ende“ (Storno, Dialog 440 px)

```
┌ Beleg K1-000118 über 89,70 € stornieren? ─────────────────┐
│ Es entsteht ein Stornobeleg mit neuer Nummer.             │
│ Grund*  [Fehlbuchung] [Kundenwunsch] [Falscher Preis] [Doppelt] │
│ Rückzahlung  Bar 89,70 € – Lade öffnet nach der Freigabe  │
│ [Abbrechen]                     [Icon lock · Zur Freigabe · Leitung] │
├───────────────────────────────────────────────────────────┤  ← gleicher Dialog, Schritt 2
│ Freigabe durch   [ML Maria L.] [TB Thomas B.]             │
│ PIN  ● ● ● ●  ○ ○                [Ziffernblock 64 px]     │
│ Freigabe endet in 15 s  [Weiter]   (ab 45 s)              │
│ [Zurück]                                   [Stornieren]   │ danger-solid, Fokus „Zurück“
└───────────────────────────────────────────────────────────┘
```

Zeitleiste: „Storno durch Maria L. (Freigabe) am Gerät von Anna K., Grund Kundenwunsch“.

---

## 5. Ergänzungen zur QA-Liste (10 §12)

| # | Kriterium | Prüfung |
|---|---|---|
| K31 | Bon ≥ Schwelle ohne Kunde: Zahlart antippen öffnet Rechnungsempfänger, Terminal startet erst danach | E2E |
| K32 | Nach „Karte bezahlt“: `Esc`, „‹ Bon“, Artikel-Scan ändern den Bon nicht; einziger Weg ist Kassieren | E2E Mock |
| K33 | `F10` mehrfach startet kein Terminal | E2E Tastatur |
| K34 | Doppeltipp (150 ms) auf „Kassieren 129,60 €“ erzeugt keinen Beleg (300-ms-Sperre) | E2E Touch |
| K35 | Jeder Schnellbetrag bucht mit einem Tipp; Rückgeld korrekt | Unit + E2E |
| K36 | Positionsliste: axe `nested-interactive` = 0; Roving-Fokus mit `↑/↓`; Scanner wirkt bei Fokus in der Liste | axe + E2E |
| K37 | Toast überdeckt nie die rechte Spalte oder die Summenleiste | Screenshot 1180 × 820, 1080 × 810, 820 × 1180 |
| K38 | Kassenbuch: Undo 6 s ohne Buchung und ohne Ladenöffnung; nach Ablauf Buchung + Lade | E2E Mock |
| K39 | Leitungsfreigabe: Eingaben der Mitarbeiterin überleben den 60-s-Ablauf; Warnung ab 45 s | E2E Zeitsimulation |
| K40 | Zählen: aktive Zeile und Tastatur gleichzeitig sichtbar bei 1180 × 820 und 1080 × 810 | Screenshot |
| K41 | Kein Kiosk-Text verweist Rolle Mitarbeiter auf Faktura, Shop-Verwaltung oder Stripe | Grep |
| K42 | Training bleibt bei zwei höherrangigen Bändern sichtbar (Pille im Kopf) | E2E |
| K43 | Tippzähler: A1 2, A2 2, A3 3 (Karte), A6 3, A14 3, Storno mit Freigabe 6 | E2E `zaehleTipps()` |

---

## 6. Was gut ist (beibehalten)

1. §2.4 Fokusmodell als Tabelle je Zustand – genau die Form, die ein Bau-Agent braucht.
2. „Fokus-Heimat, nie Fokus-Zwang“; Scanner fokusunabhängig; Opt-out `data-scan="nein"` mit Feldliste.
3. `<kbd>` nur nach erkannter Tastatur; jede Funktion hat eine sichtbare Taste.
4. Terminal: Abbrechen in voller Breite, 60-s-Hinweis, statischer Punkt statt Pulsieren, Testmodus mit `special`-Rahmen.
5. „Zahlung erhalten – Beleg offen“ als eigener Zustand mit gleichem `idempotency_key` und Erkennung nach Neustart.
6. Ergebnis-Karte mit Rückgeld zuerst und Stückelung; Scan startet den nächsten Bon.
7. Bänder mit Rang, Farbe, Quelle und Ausweg; nie blinkend.
8. Unterschrift mit Name + PIN als Alternative (2.5.7); Idle mit 30-s-Band (2.2.1).
9. „Kassenkontrolle je Bediener“ ohne Chart und Ranking, mit Zweckzeile.
10. Ehrliches Datenmapping §11 mit Übergängen – keine erfundenen Server-Funktionen.
11. Bewegungstabelle §13 token-genau, Verbotsliste vollständig.
12. Lokaler Entwurf in IndexedDB je Bediener: Neuladen verliert nichts.

---

## 7. Anfragen aus dieser Kritik

| An | Punkt |
|---|---|
| Konzept 10 (Fassung 3) | P1-01 bis P1-25 einarbeiten; §0.2 um Spalte „Kritik 20 F2“ ergänzen |
| Inhaber | Kassa steht bei Netzausfall, bis Notbetrieb freigegeben ist (K-03) · Blindzählung ja/nein (B-23) · Ausweg „Ohne Anschrift“ ab Schwelle (B-31) · Bedienerkarte am Namensschild (A-04) |
| ph_core | `PH Geraet.standard_terminal` (B-08) · `verify_badge(code, geraet_token)` für Bedienerkarte (A-04) |
| ph_kassa | Einstellung `blind_zaehlen` (B-23) |
| Fundament | Toast-Variante Kiosk: Anker „linke Spalte“, `undoMs` je Kontext, verzögerter Commit mit `flush()` bei Sperre/Wechsel · `useEingabesperre(ms)` nach Zustandswechsel · `Positionsgrid` (grid, Roving-Tabindex) statt Listbox · Zahlen-Tastatur mit konfigurierbarer 4. Spalte und `×` im Anzeigefeld · Ansage-Bündelung in `KassaLive` |
| UX-Lead / 01–05 | Nachzug K-01 bis K-11 (03 §6.3, §8.12; 04 §3.11–§3.13; 02 §1.6, §11.3; 01 F1, F3, F6; 05 §3.14) |

*Ende 20 – UX-Kritik Kassa zu Fassung 2.*
