# 20 – UX-/UI-Kritik Bereich „Marketing“ (zu `10-konzept-marketing.md`)

**Zweck:** Strenge Prüfung des Marketing-Konzepts gegen Nielsen-Heuristiken, WCAG 2.2 AA, Mobile-/Kiosk-Regeln und die Leitlinien 01–05. Ergebnis: Note, Pflichtänderungen (vor dem Bau), Empfehlungen, korrigierte Wireframes, Widersprüche in den Leitlinien, die Marketing erbt, Abnahme-Ergänzungen.
**Stand:** 2026-11-04 · Rolle: UX-/UI-Kritiker · Geprüft: `10-konzept-marketing.md` (918 Zeilen, vollständig), `01-benchmark-prinzipien.md` (C–I), `02-ux-leitlinien.md` (§0, §2, §5–§11, §13–§16), `03-design-system.md` (§1.5, §1.6, §8.9–§8.20), `04-motion.md` (§3.6, §3.12, §3.13), `05-informationsarchitektur.md` (§1, §2, §3.11, §3.14, §7, §12.5, §14.1, §15). Gegengeprüft im Code: `ph_marketing/newsletter.py` (`abmelden`), `ph_marketing/events.py` (`anmelden`), `doctype/ph_newsletter_abo/ph_newsletter_abo.py`.
**Status:** Prüfbericht, keine Entscheidung des Inhabers. Abschnittsangaben „§“ ohne Datei beziehen sich auf `10-konzept-marketing.md`.

---

## 0. Urteil

**Note: 6 / 10.**

**Stark:** fachlich tief und ehrlich. Jede Rechtsregel (DOI, Zwecke, V/B/E, Werbefenster, Sperrtage, Frequenzgrenze, Bildrechte) ist der Oberfläche zugeordnet, Lücken der App sind nummeriert (L1–L21), die Primäraktion je Status steht als Tabelle (§2.3), die Workflow-Übergänge sind 1:1 aus `workflow.json` abgeleitet (§4.1), Versandbestätigung zeigt Empfängerzahl und Testmail-Stand, Freigaben laufen über die Glocke statt per Mail, der Check-in hat Offline-Puffer. Datensparsamkeit (kein Pixel, keine Öffnungsrate) ist Haltung, nicht Fußnote.

**Schwach:** Die Oberfläche spiegelt die **Datenstruktur** statt der **Arbeit einer Gastgeberin, die Marketing nebenher macht**:
- 12 Unternavigations-Pills, Abo und Einwilligung als zwei getrennte Listen für dieselbe Person, Kanban-Ansichten für Objekte, von denen es zwölf im Jahr gibt.
- Fachjargon steht in Knöpfen und Spalten: DOI, V/B/E, Claim-Guard, Slot, Fußzeile A/B, ECG, Bounce, Preheader, UTM, sogar „Frappe Email Queue“ und `email-flows.md 3.2`.
- Zwei verschiedene Freigabe-Muster (Newsletter mit Status „Freigabe“, Social mit „Leitung bitten“ als Aufgabe).
- Tastenkürzel kollidieren mit 02 §9: `a`, `c`, `k`, Leertaste, Alt+↑/↓, ⌘Backspace im Texteditor.
- Rollenabhängiges Undo: derselbe Knopf hat für die Leitung Undo und für Mitarbeiter eine Rückfrage.
- Am Event-Eingang springen Zeilen unter dem Finger weg, und Gäste ohne E-Mail lassen sich nicht einchecken.
- Die Klickzahlen in §1 stimmen bei mindestens 12 von 17 Aufgaben nicht mit den beschriebenen Wegen überein.

---

## 1. Pflichtänderungen (vor dem Bau, nach Wirkung sortiert)

| Nr. | Befund | Verstoß gegen | Änderung (konkret) |
|---|---|---|---|
| P1 | **12 Pills** in der Unternavigation (§2.0); „ab 1024 px alle sichtbar“ geht rechnerisch nicht (12 Pills × ~90 px + Abstände > Inhaltsbreite bei eingeklappter Seitenleiste am iPad quer). | 02 §2.1 (max. 7, Rest „Mehr“), Nielsen 8 | Sichtbar: **Übersicht · Newsletter · Social · Events · Kampagnen · Empfänger** (6). Unter **„Mehr ▾“**: Kundenreisen, Empfehlungen, Einblicke, Berichte, Vorlagen (Leitung), Einstellungen (Leitung). „Empfänger“ ersetzt Abos + Einwilligungen (P2). Badge-Regeln aus §2.0 bleiben; ein Badge an einem Eintrag unter „Mehr“ erscheint als Punkt 6 px am „Mehr“-Knopf und als Zahl im Menü. Menü: Popover 03 §8.11, Öffnen 160 ms `opacity + translateY(-4px)`, `cubic-bezier(.2,.8,.2,1)`. |
| P2 | **Abo und Einwilligung sind zwei Listen und zwei Akten für dieselbe E-Mail-Adresse** (§2.4, §2.5). Die Mitarbeiterin muss wissen, ob ein Anrufer „abgemeldet“ oder „widerrufen“ werden soll. Laut Code widerruft `newsletter.abmelden()` die Newsletter-Einwilligung ohnehin mit (`ew.widerrufen(abo.email, "newsletter", …)`). Wer erst abmeldet und dann noch widerruft, erzeugt doppelte Nachweise. | Nielsen 2 (Sprache der Nutzer), Nielsen 8, 02 §0.1 | Eine Seite **`/marketing/empfaenger`** (T2) mit Segment-Schalter **Personen · Einwilligungen** (Segment 03 §8.10, Marker gleitet 200 ms). Standard „Personen“: eine Zeile je E-Mail-Adresse mit Name, Newsletter-Status, Zweck-Chips (max. 2 + „+n“, 03 §8.9), Quelle, letzte Zustellung. Eine **Personen-Akte `/marketing/empfaenger/[email]`** zeigt Abo, alle Einwilligungen, Zustellungen, Reise-Mails, Event-Anmeldungen und Empfehlungen. Aktionen dort: **„Keine Werbung mehr“** (= `abmelden` + Widerruf aller werblichen Zwecke, eine Rückfrage, siehe P9), „Nur Newsletter abbestellen“, „Einwilligung erfassen“, „Nachweis (PDF)“, „Auskunft“, „Daten löschen“ (Leitung). Das Segment „Einwilligungen“ bleibt als Nachweis-Liste für Prüfungen. Alte Routen leiten per 308 weiter. |
| P3 | **Fachjargon in Knöpfen, Spalten, Bändern** (§2.1–§2.13): „DOI“, „DOI-Quote“, „DOI erneut senden“, „Altbestand ohne DOI“, „Bounce“, „Claim-Guard“, „Slot offen“, „Preheader“, „Overline“, „Fußzeile A/B/V/S“, „V/B/E“, „ECG-Abgleich“, „UTM“, „Frequenzgrenze“, rohe Schlüssel wie `jaehrlich (MM-TT)` oder `b_kanzlei_offen`, „Quelle: email-flows.md 3.2“, „Stopp-Regeln (Doku)“, „Versandweg: **Frappe** Email Queue“ (§2.13 – verstößt gegen die eigene Regel §0 und das Abnahmekriterium „grep Frappe = 0“). | 02 §14, 01 H4, Nielsen 2, eigenes §10 | **Glossar für den Bereich** (Datei `backoffice/src/lib/backoffice/marketing/texte.js`, eine Quelle für Label-Map und Hilfe): DOI → „Bestätigung“ („Bestätigungsmail erneut senden“, „Bestätigungsquote 30 Tage“) · Altbestand ohne DOI → „Alte Adresse ohne Bestätigung – wird nicht angeschrieben“ · Bounce → „Unzustellbar“ · Claim-Guard → „Bildrechte“ · Slot offen → „optional, leer“ · Preheader → „Vorschauzeile“ · Overline → „Dachzeile“ · Fußzeile A/B → „Fußzeile mit Abmeldelink“ / V/S → „Fußzeile ohne Abmeldelink (Service)“ · V → „Vertrag/Service (keine Werbung)“, B → „Bestandskunde, ähnliche Produkte“, E → „Einwilligung“ (Kürzel nur als Nebentext `muted`) · ECG-Abgleich → „Abgleich mit der Robinson-Liste“ · UTM-Link → „Kampagnen-Link für Anzeigen“ · Frequenzgrenze → „höchstens 2 werbliche Mails in 30 Tagen“ (Wert aus Einstellungen). Übersprungen-Codes nur als Satz, nie als Schlüssel. „Quelle“, „Stopp-Regeln (Doku)“, `idempotency_key`, `ip_hash` nur im eingeklappten Abschnitt „Technische Angaben“ (Leitung). Versandweg-Ampel: „Versand über das System“ bzw. „Versand über Mail-Dienst“. Fachbegriffe, die bleiben müssen (Art. 7, Art. 15, Textversion), mit gestricheltem Unterstrich und Popover (02 §8, max. 200 Wörter). Abnahme-Grep um die Begriffe oben erweitern. |
| P4 | **Zwei Freigabe-Muster:** Newsletter hat den Status „Freigabe“ mit Knopf „Zur Freigabe“; beim Social-Beitrag gibt es keinen solchen Übergang, die Mitarbeiterin bekommt „Leitung bitten“ (erzeugt eine PH Aufgabe, §2.9), und **zusätzlich** berechnet der Server nach 24 h „freigabefähig“ eine Glockenzeile (§8.2). Zwei Mechanismen, zwei Wörter, doppelte Glockeneinträge. | Nielsen 4 (Konsistenz), 02 §0.1, 05 §7.3 (ein Objekt = eine ungelesene Benachrichtigung) | Ein Muster für alle freigabepflichtigen Objekte (Newsletter, Social, Event veröffentlichen, Reise aktivieren): Knopf **„Zur Freigabe“** (Mitarbeiter, Primär) → Badge „Wartet auf Freigabe“ (orange, 03 §1.5) → Leitung: Glockenzeile und Liste „Freigaben“ mit **„Freigeben“** und **„Zurückgeben…“** (Pflicht-Kommentar, landet in der Zeitleiste). Für Social braucht es den Status „Freigabe“ im Workflow von `PH Social Beitrag` (**Anfrage an ph_marketing**, neue Lücke L22). Bis dahin: Feld/Tag „freigabe_angefragt“ plus genau eine Glockenzeile; die 24-h-Regel aus §8.2 entfällt. |
| P5 | **Rollenabhängiges Verhalten desselben Knopfes:** „Verwerfen“ (Social), „Als ausgebucht markieren“ (Event) und „Pausieren“ (Reise) haben für die Leitung Undo und für Mitarbeiter eine Rückfrage (§4.1, §2.9). Undo bei „Pausieren“ wird je nach Regelprüfung angeboten oder nicht (L18). | Nielsen 4, 02 §6.1, 01 D3 | Für alle drei **verzögerter Commit** (04 §3.6 Variante A): Die Oberfläche zeigt den neuen Zustand optimistisch, der Toast „Beitrag verworfen · Rückgängig“ läuft mit Balken, der Server-Aufruf geht erst nach Ablauf (`--undo-ms`, siehe §4 W1). `pagehide`/`visibilitychange` → sofort committen. Damit braucht keine Rolle einen Rückweg auf dem Server, und alle Rollen sehen dasselbe Verhalten. Gleiches gilt für **„Zur Freigabe“** und **„Code senden“** (eine Mail an eine Person, 02 §6.1 „Mail geht mit 10 s Verzögerung“). Die Benachrichtigung an die Leitung entsteht erst nach dem Commit, damit kein verwaister Glockeneintrag bleibt. |
| P6 | **Tastenkürzel kollidieren mit 02 §9 und 03 §8.11:** Abos `a` = Abmelden (02 §9.2 `A` = Zuweisen; Abmelden widerruft eine Einwilligung und ist nicht umkehrbar) · Abos `d` = Bestätigungsmail senden (Mail nach außen per Einzeltaste) · Abos **Leertaste** = Drawer (02 §9.2 Leertaste = auswählen) · Newsletter-Liste `v` = Drawer (gleicher Bereich, anderer Drawer-Auslöser als bei Abos) · Events `a` = Anmeldung, `c` = Check-in (02 `C` = Kommentar) · Kampagnen `k` = Kennzahl (03 §8.11 `j/k` blättert im Side-Peek) · Social-Akte `f` = Freigeben (Freigabe nach außen per Einzeltaste), `c` = Text kopieren · Newsletter-Akte **Alt+↑/↓** = Block verschieben (02 §9.1 = nächster/vorheriger Datensatz) · **⌘/Strg+Backspace** = Block löschen (unter Windows löscht Strg+Backspace in jedem Textfeld das vorige Wort – der Block-Editor besteht aus Textfeldern) · ⌘/Strg+D = Block duplizieren (Browser: Lesezeichen). | 02 §9, Nielsen 4 und 5, WCAG 2.1.4 (Einzeltasten-Kürzel abschaltbar/umbelegbar) | Regel für den Bereich: **Einzelbuchstaben nur aus 02 §9 und 05 §2** (`n`, `e`, `p`, `x`, `a`, `s`, `c`, `t/w/m/d` im Kalender, `1–9`, `/`, `?`, `.`). Bereichsaktionen nur mit **Shift+Buchstabe**, und **nie** eine Aktion, die eine Mail sendet oder etwas freigibt – solche Kürzel öffnen höchstens den Dialog. Neu: Shift+A Anmeldung erfassen (Event), Shift+T Testmail-Dialog, Shift+K Kennzahl-Dialog, Shift+C Text kopieren (Social), Shift+Enter öffnet den Side-Peek in allen Marketing-Listen (Leertaste bleibt Auswahl). Freigeben = ⌘/Strg+Enter (Primäraktion), nur wenn sie die Primäraktion ist. Block-Editor: Verschieben mit **⌘/Strg+Shift+↑/↓**, Löschen und Duplizieren nur über das Blockmenü (`⋮` bzw. `.` bei Fokus auf dem Blockkopf), nie mit Kürzeln aus Textfeldern heraus. Alle Einzeltasten-Kürzel über „Einzeltasten-Kürzel aus“ im Benutzer-Menü abschaltbar (WCAG 2.1.4). |
| P7 | **Check-in: Zeilen springen unter dem Finger weg.** „Nicht erschienene zuerst, erschienene grau“ (§7.1) bedeutet: Nach dem Tipp auf „Da“ rutscht die Zeile nach unten, die nächste rückt unter den Finger. Ein zweiter schneller Tipp checkt die falsche Person ein. Dazu steht „– Nicht da“ als zweiter großer Knopf in jeder Zeile – am Eingang kommt niemand, der nicht da ist. | Nielsen 5 (Fehlervermeidung), WCAG 3.2.2/3.2.5 (keine unerwartete Kontextänderung), 02 §11.3 | Zeile bleibt **an ihrer Stelle**, wird nach dem Tipp in 240 ms `--bo-ease-out` zum Zustand „Da · 18:04“ (Haken-Symbol, Text, linker 3-px-Balken `ok` wie 04 §3.12 Fall 2a), Knopf wird zu „Rückgängig“ (Text-Knopf 48 px) für die Dauer von `--undo-ms`. Neu sortiert wird erst, wenn das Suchfeld geleert wird oder die Liste 10 s ruht (Sortierwechsel ohne Animation, damit nichts gleitet). Nach jedem Tipp: Suchfeld leeren und fokussieren (Tastatur bleibt oben). „Nicht da“ aus der Zeile entfernen; beim **„‹ Fertig“** fragt der Check-in einmal: „31 von 46 Personen da. Übrige 15 als ‚nicht erschienen‘ markieren?“ [Markieren] [Offen lassen]. Kein grüner Flächenblitz (§7.1 widerspricht 04 §3.12/§3.13 „keine Farbfläche“). |
| P8 | **Gäste ohne E-Mail sind nicht erfassbar:** `events.anmelden()` wirft „Name und gültige E-Mail sind nötig“ – das gilt für die Telefonanmeldung (ältere Stammkunden) und für „+ Spontan“ am Eingang. Der Check-in-Hinweis „E-Mail nötig für Bestätigung und Datenschutz-Nachweis“ lässt die Gastgeberin am Abend mit einem wartenden Gast allein. Außerdem legt `anmelden()` eine Einwilligung (Zweck „einladungen“) an – der Dialog sagt das nicht. | Nielsen 7 (Flexibilität), 02 §0.7 (nie stumm), WCAG 3.3.7 (redundante Eingabe), Transparenz der Einwilligung | (a) **Anfrage an ph_marketing (L23):** Anmeldung ohne E-Mail mit Quelle `telefon`/`showroom` und Telefon oder Name allein; keine Bestätigungsmail, keine Einwilligung. (b) Bis dahin am Check-in: Knopf **„+ Gast ohne Anmeldung“** zählt lokal hoch („Ohne Anmeldung: 3“, Stepper 56 px), beim „‹ Fertig“ als Kommentar ans Event geschrieben („3 Gäste ohne Anmeldung“). (c) Dialog „Anmeldung erfassen“: Satz unter dem E-Mail-Feld „Mit der Anmeldung speichern wir die Einwilligung für Einladungen (Textversion event-2026-10). Bitte am Telefon kurz erwähnen.“ plus Pflicht-Kontrollkästchen „Gast wurde darauf hingewiesen“. |
| P9 | **„Abmelden“ widerspricht sich:** §4.2 sagt „Toast ‚Abgemeldet · Rückgängig‘“ und in derselben Zeile „kein Gegenübergang → kein Undo, Bestätigung“. Laut Code ist Abmelden **unumkehrbar** (Status, Widerruf, E-Mail-Gruppe; Wiederanmeldung nur per neuer Bestätigung). Gleiches gilt für **„Widerruf erfassen“** (nur „Dialog“, ohne Hinweis auf Endgültigkeit) und **„Einwilligung erfassen“** (nach dem Speichern unveränderlich – ein Tippfehler in der E-Mail-Adresse bleibt für immer als Nachweis stehen). | 02 §6.2, 01 E2, Nielsen 3 und 5 | Alle drei als **Bestätigen-Dialog** (`Bestaetigen`, 440 px) mit Fakten statt Undo: „m.muster@example.com vom Newsletter abmelden?“ · Fakten: „Die Einwilligung ‚Newsletter‘ wird widerrufen. Erneute Anmeldung nur mit neuer Bestätigungsmail.“ · Kanal (Segment: Antwortmail · Telefon · Showroom · Backoffice), Grund (optional). Primär „Abmelden“ (neutral, nicht rot – es ist das Recht des Kunden). Einwilligung erfassen: **Zusammenfassung vor dem Speichern** im selben Dialog (letzte Zeile „Wird gespeichert: newsletter · Papier · Textversion nl-2026-10-29 · 04.11.2026 10:12 – danach nicht mehr änderbar“), E-Mail-Feld mit Tippfehler-Prüfung (Domain-Vorschlag „gmx.at statt gmx.ar?“), Primär „Einwilligung speichern“. Korrekturweg in der Hilfe und als Text in der Akte: „Falsch erfasst? Widerruf mit Grund ‚Erfassungsfehler‘ und neu erfassen.“ |
| P10 | **Newsletter „Freigeben und planen“ = Assistent M1 mit 3 Schritten + Ausführen** (§4.4), §1.2 verspricht 2 Klicks. Die Leitung gibt aus der Glocke frei, **ohne den Inhalt zu sehen** (M1 enthält keine Vorschau). | 02 §0.3, 01 E3 (Mehrschritt nur, wenn Vorschau mit Folgen nötig), Nielsen 1 | **Ein Dialog lg (800 px)**, links Mail-Vorschau (iframe `sandbox`, `title="Vorschau Ausgabe 2026-11"`, 360 px skaliert, Umschalter Desktop/Mobil), rechts Prüfliste (Bereit ✓ · Testmail gesendet 14:20 ✓ oder „Noch keine Testmail“ `warning` · 1.248 Empfänger) und **Versandzeit** (Vorschlag erster Donnerstag 18:00, Datum + Uhrzeit nativ, Ampel mit Satz). Fuß: [Zurückgeben…] [**Freigeben – Do 03.12. 18:00**] (Knopftext trägt den Termin). Enter = Primär. Kanban-Zug Freigabe→Geplant öffnet denselben Dialog. Ergebnis: Toast „Ausgabe 2026-11 freigegeben – sendet Do 03.12. 18:00 · Rückgängig“ (verzögerter Commit, P5). |
| P11 | **Sperrtag-Ampel ist rot, sperrt aber nicht** (§2.3 Tab Zielgruppe & Versand): Rot wird sonst nur für echte Probleme verwendet; hier bleibt offen, ob man trotzdem planen kann. Der Newsletter-Scheduler sendet laut §2.3 ab `versand_geplant`, ohne Sperrtage zu prüfen. | 02 §0.10, Nielsen 1 und 5, 03 §1.5 („Rot ist immer Abbruch/Problem“) | Entscheiden und eindeutig zeigen: **Sperrtag = gesperrt.** Datum im Picker nicht wählbar (`aria-disabled`, Tooltip „Sperrtag: 24.12.“), Freigeben-Knopf deaktiviert mit Grund. Server-Prüfung im Newsletter-Versand ist eine Lücke (**L24, Anfrage an ph_marketing**); bis dahin prüft die Server Action vor dem Übergang. Außerhalb Di–Do: `warning`-Satz „Newsletter sind Werbung – empfohlen Di bis Do“, keine Sperre. |
| P12 | **Speichermodell des Block-Editors ist für Nicht-IT-Nutzer gefährlich:** §1.1 verspricht „tippen (Autosave)“, §2.3 speichert alle 5 s nur in `sessionStorage`, auf den Server erst mit ⌘S oder beim Verlassen, dazu die Speicherleiste „Ungespeichert“. Folge: Die Leitung öffnet die Ausgabe am Telefon und sieht einen alten Stand. Schließt die Mitarbeiterin das Fenster, verliert sie die Arbeit am anderen Gerät. Ein Konflikt endet in einem „Diff-Dialog“ über Block-JSON. | 02 §0.7, 01 D2/D6/D9, Nielsen 1 und 9 | Entwurf: **Server-Autosave** 1 500 ms nach der letzten Eingabe und beim Verlassen eines Blocks (Server Action `setzeWert`/`save` mit `modified`-Prüfung). Kopf-Status nach 03 §8.20: „Speichert …“ (Spinner 16 px erst nach 300 ms) → „Gespeichert 14:05“ → Fehler „Nicht gespeichert – Erneut“ `warning-text`. **Keine Speicherleiste** im Block-Editor (Autosave und Speicherleiste zusammen sind doppelt). `sessionStorage` nur als Rettung bei Verbindungsfehler („Entwurf von 14:02 wiederherstellen?“). Mehrere Personen in einer Ausgabe: **Anwesenheit** statt Diff – Avatar 24 px im Kopf „Anna bearbeitet gerade“, der Block, in dem Anna tippt, ist für andere 30 s gesperrt (Rand `accent` gestrichelt, Text „Anna schreibt hier“). Für Ausgaben in „Freigabe“: Bearbeiten setzt automatisch auf Entwurf zurück, mit Toast „Zurück auf Entwurf – erneute Freigabe nötig · Rückgängig“. |
| P13 | **Bildquelle im Newsletter: Radiogroup mit drei Optionen, von denen zwei verboten sind** (§2.3: „Hersteller freigegeben/offen“ → Hinweis, Block unsichtbar, Feld rot, Speichern aktiv, Server wirft Fehler, „UI verhindert vorher“). Das ist eine Falle mit Ansage – und widerspricht der eigenen Leitidee 2 („nie als Fehlermeldung nach dem Klick“). Dazu zeigt der Skizze-Block „⚠ Noch kein eigenes Bild“, obwohl die Ausgabe versandbereit ist. | Nielsen 5 (Fehler vermeiden statt melden), 02 §0.10, eigene Leitidee 2 | Im Newsletter **keine Bildquellen-Auswahl**: Pflicht-Kontrollkästchen am Bildfeld „Eigenes Foto von Platzhirsch“ (Standard an; aus = Bild wird nicht übernommen, Satz „Im Newsletter nur eigene Fotos. Herstellerbilder gehen über Social-Beiträge mit Freigabe.“). Speichern schlägt nie fehl, weil kein verbotener Wert wählbar ist. Leerer optionaler Block: neutraler Text `muted` „Optional – ohne Bild bleibt der Block weg“, Icon `circle-dashed`, kein Warnsymbol. Social behält die drei Karten (dort sind alle drei zulässig). |
| P14 | **Ideen lassen sich im Social-Kalender nicht einplanen:** Die Leiste „Ohne Datum (Ideen)“ verspricht „Drag auf einen Tag = Planen“, gleichzeitig ist das Ziehen „nur wenn Freigegeben“ erlaubt (§2.9), und §10 fordert sogar die Ablehnung. Ideen haben aber per Definition den Status „Idee“ – die Funktion greift also nie. Das „+“ erscheint nur bei Hover (Touch hat kein Hover). | Nielsen 1 und 4, 02 §11.2, WCAG 2.5.7 | Ziehen (oder Menü „Datum setzen…“) setzt **nur `datum_geplant`**, für jeden Status. Die Karte zeigt dann den eigenen Zustand: „10.11. · wartet auf Freigabe“ (Rahmen gestrichelt `line-strong`). Der Workflow-Schritt „Planen“ läuft automatisch, sobald eine freigegebene Karte ein Datum hat (Server Action ruft den Übergang). Das „+“ ist am iPad und Telefon immer sichtbar, am Desktop bei Hover **und** Fokus der Zelle. Tastatur: Kalenderzellen als `role="grid"`, ←→↑↓ zwischen Tagen, Enter = neuer Beitrag am Tag, `m` auf einer Karte = „Verschieben nach…“-Menü (Datumsauswahl). Drop-Animation 200 ms `cubic-bezier(0.2,0,0,1)` (05 §15), fehlgeschlagener Drop gleitet 200 ms zurück, Toast mit Grund. |
| P15 | **Klickzahlen in §1 stimmen nicht** (gemessen ab Zentrale ohne Suche, Enter = Klick, 02 §1). Beispiele: Neue Ausgabe „2“ → real 4 (Marketing → Neue Ausgabe → Weiter → Anlegen); Freigeben „2“ → real 5 (Glocke → Freigeben → Weiter → Weiter → Freigeben); Social freigeben „1“ → real 4; Kennzahl erfassen „2“ → real 5; Gutschein ausgeben „2“ → real ≥ 6 mit Wechsel in den Shop; Kanzlei-Schalter „2“ → real 5–6. Abmeldung und Nachweis laufen **nur** über ⌘K (02 §0.3: Palette ist nie der einzige Weg). | 02 §0.3, 02 §1 (Messgröße für die Abnahme) | Tabelle nach Umsetzung von P1–P20 neu zählen; korrigierte Zielwerte in §5 dieser Kritik. Jeder Weg wird ein E2E-Schritt mit Klickzähler. |
| P16 | **„+ Neue Ausgabe“ startet einen 2-Schritt-Assistenten** (M0), für eine Ausgabe, die jeden Monat gleich beginnt. | 02 §4.3 (Neu-Dialog: Pflichtfelder + 2–3 häufigste), 01 E3 | **Ein Klick legt an:** „Neue Ausgabe Dezember“ (Kennung = nächster freier Monat, Zielgruppe „Alle aktiven Abos“, Blockstruktur der letzten Ausgabe ohne Inhalte) und öffnet den Editor mit Fokus im Betreff. Split-Knopf `[+ Neue Ausgabe ▾]`: „Leer beginnen“, „Kopie der letzten Ausgabe mit Inhalt“. Undo-Toast „Ausgabe 2026-12 angelegt · Rückgängig“ (löscht den Entwurf). M0 entfällt. |
| P17 | **Empfehlungsgutschein: Wechsel in den Shop, Code abschreiben, zurück, einfügen** (§2.10, M8 mit 4 Schritten). Abschreiben eines Codes ist fehleranfällig, und der Gutschein wird doppelt erfasst. | WCAG 3.3.7, Nielsen 5 und 7, 02 §0.3 | Ein Dialog **„Gutschein senden“**: Fakten (Empfehlerin, Auftrag AB-…, Frist vorbei am 02.11. ✓), Wert (aus Einstellungen, änderbar), Vorschau der Mail. Primär **„Gutschein über 100,00 € erstellen und senden“** → eine Server Action legt den Gutschein über ph_shop an und ruft `gutschein_senden(code)` auf. **Anfrage an ph_shop/ph_marketing (L25):** Methode „Gutschein für Empfehlung anlegen“. Bis dahin öffnet der Dialog die Shop-Gutscheinanlage als Sheet (480 px, 240 ms) **im selben Dialogfluss**; der erzeugte Code wird automatisch übernommen, kein Abtippen. Bestätigen (geldwirksam, 02 §6.2) bleibt. |
| P18 | **Statusfarben weichen von 03 §1.5 ab oder färben Normales rot:** Einwilligung „Widerrufen“ ist nach 03 rot – bei 188 Widerrufen ist die Liste rot gesprenkelt, obwohl ein Widerruf das Recht des Kunden ist. „Versendet“ (Newsletter) ist in §2.3 grün, in 03 türkis. „Wird versendet … mit Puls 0“ ist unklar. „Abgemeldet“, „Bounce“, „Beschwerde“, „Gutschein fällig“, „Verfallen“ fehlen in 03. | 02 §0.10, 03 §1.5, Nielsen 4 | Zuordnung für Marketing (in 03 §1.5 nachtragen, je DocType): Widerrufen, Abgemeldet, Abgelaufen, Verfallen, Abgelehnt (Empfehlung) → **grau**; Unzustellbar (Bounce), Unbestätigt, Freigabe, Gutschein fällig, Pausiert → **orange**; Beschwerde, Abgebrochen (Newsletter), Abgesagt mit Teilnehmern → **rot**; Wird versendet → **türkis** mit 2-px-Fortschrittsbalken statt Puls; Versendet, Veröffentlicht, Durchgeführt, Aktiv, Bestätigt, Gutschein ausgegeben → **grün** (Endzustand). „Puls 0“ streichen. |
| P19 | **Leerzustände unvollständig** (02 §7.1 verlangt drei Fälle je Liste). Fehlend: „Filter liefert nichts“ bei Einwilligungen, Kundenreisen, Kampagnen, Events, Social-Liste, Empfehlungen, Versandprotokoll · „Alles erledigt“ für die Freigabeliste der Übersicht und den Reiter „Gutschein fällig“ · „Kein Zugriff“ (03 §8.18) für Mitarbeiter auf Kundenreisen-Bearbeitung · Erste Schritte (01 H3) für einen leeren Bereich. Kundenreisen „Noch keine Kundenreisen. Sieben werden mit der App ausgeliefert“ ist kein Leer-, sondern ein **Fehlerzustand** (Installation unvollständig). Einblicke-Leertext enthält `ph_marketing.api.tag_speichern`. | 02 §7.1, 03 §8.18, 01 C11/H3 | Texte je Liste nach Muster ergänzen (Auswahl): Kampagnen gefiltert „Keine Kampagne mit Kanal ‚Pinterest‘ 2026.“ + „Filter zurücksetzen“ · Freigaben leer „Nichts wartet auf Freigabe.“ (Häkchen-Icon Sand 32 px, keine Aktion) · Gutschein fällig leer „Kein Gutschein fällig. Fällig wird er automatisch, wenn die Rücktrittsfrist eines empfohlenen Auftrags vorbei ist.“ · Kundenreisen 0 Datensätze → `Fehler` „Die mitgelieferten Kundenreisen fehlen. Bitte Administrator informieren.“ + „Melden“ · Einblicke „Noch keine Einblicke. Die Website sendet nach ihrer Umstellung jeden Tag eine Zusammenfassung ohne Personenbezug.“ · Übersicht bei 0 Ausgaben, 0 Events, 0 Beiträgen: Karte „Erste Schritte“ mit 3 abhakbaren Punkten (Erste Ausgabe anlegen · Event anlegen · Beitrag planen), verschwindet nach dem dritten. Leerzustand erscheint 240 ms `opacity` nach dem Skeleton (Skeleton min. 300 ms, 03 §8.18). |
| P20 | **Fehlerzustände fehlen für die riskanten Momente:** Testmail schlägt fehl (Mail-Dienst nicht erreichbar) · `vorschau()` liefert Fehler (iframe bleibt leer) · Bild-Upload zu groß, falsches Format · Versand endet mit Teilfehlern (nur Glocke, kein Zustand am Datensatz) · zwei iPads checken dieselbe Person ein · Kalender-Drag scheitert am Server. | 02 §7.2, 01 I1/I3, Nielsen 9 | Je Fall Text nach 02 §7.2 am Ort der Arbeit: Testmail → Knopf zurück in Normalzustand, Toast `fehler` „Testmail konnte nicht gesendet werden – Mail-Dienst antwortet nicht. Erneut versuchen“ (bleibt bis geschlossen) · Vorschau → im Vorschau-Rahmen `Fehlerblock` „Vorschau konnte nicht erzeugt werden (Fehler-Nr. …)“ + „Erneut“, Freigabe-Dialog sperrt „Freigeben“ mit Grund „Ohne Vorschau keine Freigabe“ · Upload → Fehler je Datei in der Dropzone „Bild ist 31 MB groß – höchstens 25 MB. Tipp: als JPG exportieren.“ · Teilfehler → Band `warning-soft` im Ausgabenkopf „1.246 zugestellt, 2 fehlgeschlagen – Protokoll ansehen“ · Check-in doppelt → Zeile zeigt „Schon da seit 18:04 (anderes Gerät)“, kein Fehler-Ton · Drag → Karte gleitet 200 ms zurück, Toast `fehler` mit Grund. |

---

## 2. Weitere Schwächen (Empfehlungen, keine Blocker)

### 2.1 Komplexität / zu viele Klicks

1. **Kanban für Newsletter, Kampagnen und Events streichen.** Eine Ausgabe im Monat und eine Handvoll Kampagnen und Events im Jahr bilden kein Board. Fünf Spalten mit je null bis einer Karte sind Rauschen, und jede Ansicht braucht eigene Drop-Regeln (§2.2: Entwurf→Freigabe nur bei bereit, Freigabe→Geplant nur Leitung …). Kanban bleibt nur für **Social** (Redaktionsfluss mit vielen Karten). Umschalter „Liste | Kanban“ entfällt dort, wo es kein Kanban gibt. Gilt auch für die Routen in 05 §3.11.
2. **Übersicht entschlacken** (§2.1: Heute-Leiste + 6 Kennzahlen + 2 Karten + 3 Charts + Redaktionsplan + Freigabeliste = 14 Elemente). Dieselbe Freigabe erscheint **fünfmal** (Heute-Chip, Knopf in „Nächste Ausgabe“, Freigabeliste, Glocke, Pill-Badge), und die Freigabeliste als wichtigste Arbeit der Leitung steht ganz unten und wird zuletzt gestreamt. Vorschlag in §3.1: oben „Zu tun“ (Freigaben, Gutschein fällig, Uhrzeit fehlt), dann 4 Kennzahlen, dann „Nächste Ausgabe“, „Nächstes Event“, „Diese Woche“. Charts wandern in „Berichte“ oder hinter „Mehr Zahlen ▾“ (eingeklappt, Zustand pro Benutzer).
3. **„Nächste Schritte“ in der rechten Spalte wiederholen die Kopf-Knöpfe** (Newsletter-Akte: „Testmail senden“, „Zur Freigabe geben“ stehen schon im Kopf). Regel: „Nächste Schritte“ zeigt nur, was **nicht** im Kopf steht (z. B. „Event-Termin fehlt im Block Termine“), sonst entfällt der Abschnitt.
4. **Vorschau dreifach:** Live-Vorschau rechts, Tab „Vorschau“, Drawer aus der Liste (`v`), dazu `v` = Vorschau-Tab in der Akte. Lösung: Live-Vorschau rechts bleibt, Tab „Vorschau“ entfällt (Vollbild-Knopf `maximize-2` an der Live-Vorschau öffnet sie als Dialog lg). Testmail und „HTML herunterladen“ wandern an die Live-Vorschau. Tabs der Ausgabe: **Inhalt · Empfänger & Versand · Protokoll · Verlauf** (4).
5. **Event-Akte: 6 Tabs → 4.** „Check-in“ ist nur ein Link (die Primäraktion am Eventtag macht das bereits), „Datenschutz“ und „Mails & Erinnerung“ sind je 3–4 Felder. Tabs: **Anmeldungen · Eckdaten · Mails · Verlauf**. Datenschutz als Abschnitt in Eckdaten.
6. **„Erinnerung jetzt senden“ in zwei Varianten** (`alle=0`/`alle=1`) im `⋯`-Menü. Eine Aktion „Erinnerung senden…“ öffnet die Bestätigung „Erinnerung an 29 Personen senden, die noch keine bekommen haben?“ mit Kontrollkästchen „Auch an 2 bereits Erinnerte“.
7. **Kampagne „Anfragen zählen“ als Knopf** – das ist Systemarbeit. Bei jedem Öffnen der Akte und täglich im Scheduler aufrufen. Knopf streichen, Stand als „Stand 14:05“ neben der Zahl zeigen.
8. **„Fortsetzen“ mit zwei Bedeutungen** (aus Pausiert und aus Beendet, §4.1). Aus Beendet heißt der Knopf „Wieder aktivieren“ (Leitung).
9. **Kundenreise anlegen = 6-Schritt-Assistent** (M2) für ein Objekt, von dem sieben mitgeliefert werden. Primärweg „Duplizieren“ einer bestehenden Reise (Zeilenmenü und `⋯`), danach direkt im Regel-Editor arbeiten. M2 bleibt als „Leer beginnen“.
10. **Einwilligung erfassen ist doppelt spezifiziert:** §2.5 als ein Dialog, §4.4 M5 als 3-Schritt-Assistent. Ein Dialog (md 560 px) mit Zusammenfassung (P9), M5 streichen.
11. **Kleines Team, gleiche Person in beiden Rollen.** Bei Platzhirsch ist die Leitung oft die Gastgeberin selbst (§1.2). Wenn Ersteller und Freigebende dieselbe Person sind, ist der Umweg Entwurf → Freigabe → Freigeben → Planen leer. Für Benutzer mit Leitungsrolle zeigt der Kopf im Entwurf direkt **„Freigeben und planen“** (P10-Dialog, zwei Übergänge in einer Server Action, beide in der Zeitleiste). Ob das Vier-Augen-Prinzip trotzdem gelten soll: **Entscheidung Inhaber**.
12. **E-Mail-Maskierung für Mitarbeiter** (`a***@domain`, §2.4) schützt nicht, weil Hover und Akte die volle Adresse zeigen. Sie macht aber Listen unbenutzbar, wenn die E-Mail die einzige Kennung der Zeile ist (zwei Zeilen „m***@example.com“). Entweder (a) keine Maskierung für die Rolle Marketing (sie braucht die Adressen für ihre Arbeit) oder (b) Name als erste Spalte, E-Mail teilweise sichtbar `mar…@gmx.at`, voll nur in der Akte. Empfehlung (a) mit Protokollierung von CSV-Exporten. **Entscheidung Inhaber/Datenschutz.**
13. **Zwei Kennungen pro Ausgabe** (`PH-NL-2026-011` und `2026-11`) in Liste und Kopf. In der Oberfläche nur „Ausgabe November 2026“ (aus `slug`), die Nummer als `muted`-Nebentext mono und in der Suche.
14. **Einstellungen: Kanzlei-Schalter mit Bestätigung und danach Speicherleiste + ⌘S** (§2.13) ist doppelt. Schalter in der Zustandsleiste speichern sofort nach der Bestätigung (Toast „Kanzlei-Freigabe Fußzeilen eingetragen“); die Speicherleiste gilt nur für die übrigen Felder.

### 2.2 Tastatur

1. Alle Kürzel nach P6 in `backoffice/src/lib/backoffice/marketing/kuerzel.js` registrieren, damit das Hilfe-Panel (`?`) und die Palette sie aus einer Quelle zeigen und ein Test Doppelbelegungen findet.
2. **Tabs in Akten:** §2.3/§2.8 nutzen `1–5`/`1–6` (wie 05 T5), 02 §9.4 sagt Alt+1…9. Bis zur Klärung (§4 W5) nur `1–9` **außerhalb** von Eingabefeldern; im Block-Editor ist fast immer ein Feld fokussiert, daher zusätzlich ⌘/Strg+Alt+Ziffer **nicht** verwenden (Screenreader-Kollision, 02 §9). Ergebnis: Tabs im Editor per Tab-Taste auf die Tableiste + ←→ (03 §8.10).
3. **`t` = Testmail in der Akte** (§2.3) und **`t` = heute im Kalender** (§2.9) – vertretbar, weil anderer Seitentyp, aber mit P6 ohnehin Shift+T.
4. **Check-in mit externer Tastatur:** Suchfeld hat immer den Fokus; ↓ wählt den ersten Treffer, Enter = „Da“, ⌘/Strg+Z = Rückgängig. In §7.1 ergänzen.
5. **Kanban Social:** `m` = Verschieben-Menü (05 T3) ausdrücklich nennen, inklusive der gesperrten Ziele mit Grund im Menü („Freigegeben – Bildrechte offen“, `aria-disabled`).
6. **Regel-Editor Kundenreise:** Satzbausteine als native `select`/`input` in einer Zeile, Tab-Reihenfolge = Lesereihenfolge des Satzes. „+ weiterer Auslöser“ per Enter im letzten Feld (wie Kindtabelle 02 §9.4).

### 2.3 Barrierefreiheit (WCAG 2.2)

1. **2.5.7 Ziehbewegungen:** Block-Reihenfolge (Newsletter) hat Tastatur (Alt+↑/↓, nach P6 geändert), aber keine Zeiger-Alternative ohne Ziehen. Blockmenü `⋮` mit „Nach oben“, „Nach unten“, „An den Anfang“. Kalender und Kanban siehe P14.
2. **4.1.2 / 1.3.1 Vorschau-iframes** brauchen `title` („Mail-Vorschau Ausgabe November 2026, Desktop-Breite“). Die Live-Vorschau darf beim Tippen keine Live-Region auslösen.
3. **Maskierte E-Mails** werden vom Screenreader als „m Stern Stern Stern at …“ gelesen. Wenn die Maskierung bleibt (2.1 Punkt 12): `aria-label="E-Mail-Adresse beginnt mit m, Domain example.com"`.
4. **Countdown „sendet in 2 Tagen 4 Std.“** (§8.3) nicht als Live-Region und nicht sekündlich aktualisieren. Minutentakt, `title` absolut mit Wochentag.
5. **Zeichenzähler** (Rich-Text ab 1 200 Zeichen, Social 500/2 200): sichtbarer Zähler ohne Live-Region; nur beim Überschreiten der Grenze **einmal** `aria-live="polite"` „Text ist länger als 500 Zeichen für Pinterest“.
6. **Durchgestrichene Zeilen** (Anmeldung „abgesagt“, §2.8) zusätzlich mit Status-Badge „Abgesagt“ (Text), Kontrast der grauen Zeilen ≥ 4,5:1 (`text-soft`, nicht `text-faint`). Gleiches gilt für die grauen „Da“-Zeilen im Check-in.
7. **Zielgrößen:** Interessen-Chips mit `×` (§2.4 Akte) brauchen ≥ 24 × 24 px Klickfläche (2.5.8), am iPad 44 px. Kalender-Karten im Wochenraster (Zelle ≈ 130 px breit) mit 48-px-Thumbnail: Mindesthöhe der Karte 44 px am iPad.
8. **Ampeln „▮“** in Bändern (§2.6, §2.13) sind Textzeichen; als Icon mit Form (Kreis gefüllt / Ring / Dreieck nach 03 §1.5) plus Text darstellen, `aria-hidden` für das Zeichen.
9. **Check-in-Idle:** Kiosk-Idle 15 min (02 §11.3) sperrt mitten im Abend. Für die Check-in-Route: Idle-Sperre aus, solange das Event „heute“ ist; Bildschirm dunkelt nach 5 min auf 40 % (400 ms), Tipp weckt ohne PIN. Erfüllt 2.2.1, weil keine Daten verloren gehen.
10. **Status nur über Farbe** in der Bereitschaftsleiste (✓/○) ist durch die Form gelöst. Der Text „○ (Slot offen)“ wird nach P3/P13 zu „optional, leer“.

### 2.4 Mobile / iPad / Kiosk

1. **Check-in als Kiosk-Arbeitsplatz einordnen:** §7.1 hängt den Check-in unter `/marketing/events/[id]/checkin`, §12 fordert eine `(kiosk)`-Route. Rückweg nach 02 §11.3 oben links **„‹ Fertig“**, nicht „[Beenden]“ rechts neben dem Online-Status. Start aus der Event-Akte (Primäraktion am Eventtag) und als Kachel „Event-Check-in“ in `/arbeitsplatz`, **nur** am Eventtag und nur für Marketing/CRM. Arbeitsplatzliste in 05 §1 ergänzen.
2. **Freigabe am Telefon** (§7.2: „Leitung kann unterwegs freigeben“): Der P10-Dialog wird unter 640 px zum Bottom-Sheet. Die Vorschau steht oben, volle Breite, 360 px, scrollbar. Darunter Prüfliste und Termin, der Knopf klebt unten (Sticky-Footer, Safe-Area). Ohne Vorschau keine Freigabe am Telefon.
3. **Block-Editor am Laptop:** Editor 640 + Vorschau 360 + rechte Spalte 320 + Seitenleiste 240 sind 1 560 px. Ab 1 440 px: Editor + Vorschau, rechte Spalte als Tab „Bezüge“. 1 280–1 439 px: Seitenleiste automatisch eingeklappt (56 px). Unter 1 280 px: Editor und Vorschau als Segment „Schreiben | Vorschau“ (wie §7.2 für Tablet).
4. **Social-Kalender iPad hoch (640–1023 px):** 7 Spalten à < 120 px sind zu schmal für Karten mit Thumbnail. Dort Standard „3-Tage-Ansicht“ mit Wischen (Swipe), Woche per Umschalter.
5. **Listen < 768 px als Karten** (§7.2) – für „Empfänger“: Name, Newsletter-Status, Zweck-Chips, letzte Zustellung. Für Events: Datum groß links, Titel, Plätze-Balken.

### 2.5 Visuell / Modernität (Maßstab Linear, Stripe Dashboard, Shopify Admin)

1. **Tabellen mit 8–10 Standardspalten** (Newsletter 7, Abos 8, Einwilligungen 8, Kundenreisen 8, Kampagnen 9, Events 8, Empfehlungen 9). Stripe und Linear zeigen 5–7 Spalten, der Rest liegt im Side-Peek. Ziel: ≤ 7 Standardspalten, Nebenwerte als zweite Zeile `muted` 12 px (z. B. „Kanal · Zeitraum“ unter dem Titel).
2. **Kopf der Newsletter-Akte hat vier Zeilen vor dem ersten Feld** (Krümel, Titel + Knöpfe, Phasenleiste, Bereitschaftsleiste) plus Tabs. Am 800-px-Laptop beginnt der Editor dann erst unterhalb von ~220 px. Phase als kompakter Stepper **in der Titelzeile** (Punkte 8 px, Label nur für die aktuelle Phase), Bereitschaft als **eine** Zeile mit Fortschritt „4 von 4 nötigen Teilen ✓“, Details per Klick (Popover). Wireframe §3.2.
3. **Bodoni-Kopfzahl für die Empfängerzahl** (§2.3) widerspricht 02 §13 (Bodoni nur Wortmarke, Login, Arbeitsplatz, Druck). Instrument Sans 2xl 500 tabular (03 §8.14).
4. **Donut „Abos nach Quelle (max. 8)“** (§5) verletzt 03 §8.15 (Donut ≤ 5 Anteile). Horizontaler Balken sortiert nach Wert oder Top 4 + „Sonstige“. „Beiträge je Kanal“ (5 Kanäle) ist an der Grenze – ebenfalls Balken, damit alle Anteilsdarstellungen des Bereichs gleich aussehen.
5. **6 Kennzahlen in einer Reihe** (Wireframe §2.1) widersprechen 03 §8.14 (4 je Zeile ab 1 280 px). Mit 2.1 Punkt 2 auf 4 reduzieren.
6. **Chart-Bewegung abweichend:** §2.1 „Balken 240 ms Stagger 20 ms, Donut 400 ms“ gegen 03 §8.15 „Balken 400 ms `ease-quiet`, ohne Stagger“. 03 gilt.
7. **Kanban „federt zurück 320 ms Spring“** (§2.2) gegen 05 §15 „Rücknahme 200 ms `cubic-bezier(0.2,0,0,1)`“. 05 gilt (und entfällt für Newsletter nach 2.1 Punkt 1).
8. **Bänder stapeln sich:** Testmodus-Band + Automatik-Band + Werbefenster-Band + Regelprüfungs-Band auf der Reisen-Akte = bis zu vier farbige Streifen. Regel: höchstens **ein** Seitenband (Priorität: Testmodus > Fehler > Hinweis); weitere Hinweise als Zeile in der Zustandsleiste des Kopfes.

### 2.6 Unklar / widersprüchlich im Dokument selbst

1. §1.1 „Zur Freigabe → Bestätigen“ gegen §4.1 „sofort + Undo 8 s“ – nach P5 verzögerter Commit, keine Bestätigung.
2. §2.3 „Speichern-Knopf aktiv, aber Feld rot“ gegen „UI verhindert vorher“ gegen §10 „Speichern ohne Serverfehler nicht möglich → UI blockt vorher“ – nach P13 gegenstandslos.
3. §2.3 Kopf: „Zeitpunkt ändern (inline `versand_geplant`)“ im Status Geplant, ohne Rolle. Nach der Freigabe darf nur die Leitung den Termin ändern, mit Sperrtag-Prüfung und Undo-Toast „Versand auf Fr 04.12. 18:00 verschoben · Rückgängig“.
4. §4.2 „Prompt URL“, „Prompt Beleg“ – gemeint ist vermutlich ein Dialog. Festlegen: Dialog sm 400 px mit beschriftetem Feld, nie `window.prompt` (nicht gestaltbar, nicht barrierefrei steuerbar).
5. §2.6 Aktivieren-Bestätigung „Mails gehen erst, wenn ‚Kundenreisen aktiv‘ in den Einstellungen gesetzt ist“ – zwei Schalter für eine Sache. Status-Badge kombiniert zeigen: „Aktiv · wartet auf Automatik“ (orange) solange `automatik_aktiv = 0`, mit Link „Automatik einschalten (Einstellungen)“.
6. §2.10 Rücktrittsfrist „abgelaufen grün ‚Gutschein möglich‘“ – Grün für „abgelaufen“ ist missverständlich. Text „Frist vorbei – Gutschein möglich“ trägt die Bedeutung; Ton grün nur mit diesem Text, nie mit „abgelaufen“.
7. §2.4 „Nächste Schritte: ‚DOI erneut senden‘ bei unbestätigt < 48 h nicht anbieten“ und §10 „innerhalb 60 Min. … Tooltip“ – zwei Sperrfristen (48 h fachlich, 60 min technisch). Eine Regel: Knopf ist ab 60 min nach der letzten Mail aktiv, unter 48 h mit Hinweis „Link ist noch gültig (bis Do 10:40)“.
8. §2.0 Badge-Text „Gutschein faellig“ – Umlaut-loser Schlüssel in der Oberfläche; Label-Map §9.2 um alle Empfehlungs-Status erweitern.
9. §6 „Listen/Reports … Auslöser `e`“ für Druck/CSV; 05 T2 `e` = CSV, 05 T5 `e` = bearbeiten. In Listen bleibt `e` = Export, in Akten `e` = bearbeiten – im Hilfe-Panel je Seitentyp getrennt zeigen.

---

## 3. Korrigierte Wireframes

### 3.1 Übersicht `/marketing` (nach P1, 2.1 Punkt 2)

```
┌ Zentrale › Marketing                                                              [+ Neu ▾] ┐
│ [Übersicht] [Newsletter •] [Social] [Events 2] [Kampagnen] [Empfänger] [Mehr ▾ •]           │  ← 6 Pills + Mehr
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ ZU TUN (3)                                                                                  │  ← Leitung zuerst; Mitarbeiter: „Meine Aufgaben“
│ ● Ausgabe November wartet auf Freigabe · Anna, vor 2 Std.        [Ansehen] [Freigeben]      │
│ ● Gutschein fällig · Empfehlung Maria Muster (Frist vorbei 02.11.)          [Gutschein…]   │
│ ● Adventsabend: Uhrzeit fehlt – Einladung kann nicht starten               [Eintragen]     │
│   leer: „Nichts wartet auf dich.“ (Häkchen Sand 32 px)                                      │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌ Aktive Abos ────┐ ┌ Unbestätigt > 48 h ┐ ┌ Anmeldungen Advent ┐ ┌ Beiträge diese Woche ┐  │  ← 4 Kennzahlen
│ │ 1.248  ▲ Monat  │ │ 4  ⚠              │ │ 46 / 60 Personen    │ │ 3                    │  │
│ └─────────────────┘ └────────────────────┘ └────────────────────┘ └──────────────────────┘  │
│ ┌ Nächste Ausgabe ───────────────────────────┐ ┌ Diese Woche (Social + Events) ───────────┐ │
│ │ November 2026 · „Was den Winter …“         │ │ Di 10. Pinterest „Bodensee-Küche“ ● Gepl.│ │
│ │ ● Wartet auf Freigabe · bereit ✓ · 1.248   │ │ Do 12. Instagram „Advent“ ○ wartet auf F.│ │
│ │ [Öffnen]                                   │ │ [Kalender öffnen]                        │ │
│ └────────────────────────────────────────────┘ └──────────────────────────────────────────┘ │
│ ▸ Mehr Zahlen (Abos je Woche, Abos nach Quelle, Einwilligungen nach Zweck)   eingeklappt    │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```
- Streaming-Reihenfolge: Zu tun → Kennzahlen → Karten → (eingeklappt, lazy) Charts. Jede Kachel eigenes `<Suspense>`, Skeleton nach 300 ms, Inhalt 120 ms `opacity` `cubic-bezier(0.2,0,0,1)`.
- „Freigeben“ öffnet den P10-Dialog; „Ansehen“ die Akte. Zeile verschwindet nach Freigabe mit Höhe → 0, 160 ms `--bo-ease-out` (04 §3.3).
- Kürzel: `r` neu laden, `n` öffnet „+ Neu ▾“, ↑/↓ in „Zu tun“, Enter = Primärknopf der Zeile.

### 3.2 Newsletter-Ausgabe, Kopf und Editor (nach P10, P12, P13, 2.1 Punkt 4, 2.5 Punkt 2)

```
┌ Zentrale › Marketing › Newsletter › November 2026                                                         ┐
│ „Was den Winter wohnlich macht“  ● Entwurf  ○─●─○─○  Entwurf          Gespeichert 14:05  (A) Anna   │
│ Bereit ✓ 4 von 4 nötigen Teilen · 1.248 Empfänger ▾        [Testmail…] [⋯]   [ Zur Freigabe ]  ⌘↵    │
├ Inhalt | Empfänger & Versand | Protokoll | Verlauf ──────────────────────────────────────────────────┤
│ ┌ ⋮ Brief ──────────────────────── ✓ dabei ┐   │ VORSCHAU  [Desktop|Mobil] [Hell|Dunkel] [⤢]     │
│ │ Absender [Harald Mayer ▾]                │   │ ┌──────────────────────────┐                    │
│ │ Text  Liebe Leserinnen und Leser, …      │   │ │ PLATZHIRSCH              │  Stand 14:05       │
│ └──────────────────────────────────────────┘   │ │ …                        │                    │
│ ┌ ⋮ Haralds Skizze ─── optional, leer ─────┐   │ └──────────────────────────┘                    │
│ │ ◌ Ohne Bild bleibt der Block weg.        │   │ Betreff · Vorschauzeile                         │
│ │ Bild [Dropzone]  ☑ Eigenes Foto von PH   │   │                                                 │
│ └──────────────────────────────────────────┘   │                                                 │
│ [+ Block ▾]                                     │                                                 │
└─────────────────────────────────────────────────┴─────────────────────────────────────────────────┘
```
- „Bereit ✓ … ▾“ öffnet ein Popover mit der Regel und den Teilen (Brief ✓, Neue Stücke ✓, Skizze optional, Termine ✓, Tipp ✓). Nicht bereit: „Noch nicht bereit: Brief fehlt“ (`warning-text`), „Zur Freigabe“ deaktiviert mit genau diesem Grund im Tooltip und Klick-Ziel „Zum Brief springen“ (02 §8).
- Vorschau-Stand: „Stand 14:05“; tippt jemand nach dem Autosave weiter, steht dort bis zur nächsten Server-Vorschau „Aktualisiert gleich …“. Keine Client-Näherung per DOM-Patch (§2.3): Sie erzeugt eine zweite Wahrheit, und der Gewinn liegt unter 1,5 s.
- Leitung im Entwurf: Primär „Freigeben und planen“ (2.1 Punkt 11), sofern der Inhaber das so entscheidet.

### 3.3 Event-Check-in (nach P7, P8, 2.4 Punkt 1)

```
┌ ‹ Fertig    Adventsabend · Do 26.11. · 18:00          Da: 31 von 46 Personen · ● Online          ┐
│ [ 🔍 Name oder E-Mail …                                    ]   [ + Gast ohne Anmeldung (3) ]     │  56 px
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│  Familie Muster        2 Personen   „vegetarisch“                                [   ✓ Da   ]    │  64 px Zeile
│  Herr Huber            1 Person                                                  [   ✓ Da   ]    │
│▌ Frau Berger           1 Person     Da · 18:04                                   [Rückgängig]    │  ← bleibt an der Stelle
│  …                                                                                                │
├ Warteliste 0 · Abgesagt 2 ───────────────────────────────────────────────────────────────────────┤
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```
- Nach „Da“: Suchfeld leer + fokussiert, Zeile bleibt stehen. Neu sortiert wird erst nach 10 s Ruhe oder beim Leeren der Suche, ohne Animation.
- Toast oben Mitte 480 px (Kiosk, 03 §8.12) nur bei Fehlern; Erfolg steht in der Zeile (keine zwei Rückmeldungen für dieselbe Handlung).
- „‹ Fertig“ → Rückfrage „15 Personen als ‚nicht erschienen‘ markieren?“ → Rücksprung in die Event-Akte, Tab Anmeldungen.

---

## 4. Widersprüche in den Leitlinien, die Marketing erbt (an Fundament/UX-Lead)

| Nr. | Widerspruch | Stellen | Vorschlag |
|---|---|---|---|
| W1 | **Undo-Dauer:** 8 s | 02 §6.1 · 5 000 ms Balken (04 §3.6) · 6 s (01 D3) · 8 s nur bei Löschen/Verschieben (03 §8.12) | Ein Token `--undo-ms` in `globals.css`, Wert vom UX-Lead (Vorschlag 8 000 ms, weil Marketing-Aktionen Mails nach außen auslösen). Alle Texte verweisen auf das Token, nicht auf Sekunden. |
| W2 | **Undo-Taste:** ⌘/Strg+Z (02 §9.1) gegen `Z` ohne Modifier (04 §3.6, 01 D3 „Rückgängig (Z)“) | 02, 04, 01 | ⌘/Strg+Z überall; `Z` allein streichen (kollidiert mit Tippen außerhalb von Feldern auf Touch-Tastaturen und ist nicht erwartbar). |
| W3 | **Undo-Technik:** sofort ausführen + Gegenaktion (02 §6.1) gegen verzögerten Commit (04 §3.6 Variante A) | 02, 04 | Regel: Aktionen mit Wirkung nach außen (Mail, Freigabe, Veröffentlichung) und Aktionen ohne Server-Gegenübergang → **verzögerter Commit**. Reine Feldwerte → sofort + Gegenaktion. In 02 §6.1 übernehmen. |
| W4 | **Toast-Position:** unten links (01 I5) · unten Mitte (02 §6.1) · unten rechts (03 §8.12, 04 §3.6) | 01, 02, 03, 04 | Unten rechts (03), Kiosk oben Mitte; 01 und 02 angleichen. |
| W5 | **Tabs-Kürzel:** Alt+1…9 (02 §9.4) gegen `1–9` (05 T5) | 02, 05 | `1–9` außerhalb von Feldern (05). 02 §9 verbietet Alt+Buchstabe, Alt+Ziffer ist auf deutschen Mac-Tastaturen ebenfalls belegt. |
| W6 | **Alt+↑/↓:** nächster Datensatz (02 §9.1) gegen Zeile verschieben (01 D8) gegen Alt+←/→ nächster Datensatz (01 D4) | 01, 02 | Nächster Datensatz = Alt+↑/↓ (02), Zeile/Block verschieben = ⌘/Strg+Shift+↑/↓. 01 D4/D8 anpassen. |
| W7 | **Leertaste in Listen:** auswählen (02 §9.2) gegen Side-Peek öffnen (01 D10) | 01, 02 | Leertaste = auswählen, Shift+Enter = Side-Peek. 01 D10 anpassen. |
| W8 | **Unterstrich aktiver Pill/Tab:** Tinte (02 §2.1, 03 §8.10) gegen Sand (05 §1, Marketing §2.0) | 02, 03, 05 | Ein Wert. Vorschlag Tinte für Tabs (Kontrast 1.4.11) und Sand nur für die Pills der Unternavigation – oder überall Tinte. |
| W9 | **Zahlen hochzählen:** nein (02 §13) gegen „nur bei Aktualisierung“ (04 §3.7) | 02, 04 | 04 gilt (Count-up nur bei Wertwechsel, nie beim ersten Laden); 02 §13 präzisieren. |
| W10 | **Bodoni für Kennzahlen:** verboten außer Wortmarke (02 §13) gegen „Zentrale-Hauptzahl Bodoni“ (03 §8.14) | 02, 03 | Nur die eine Hauptzahl der Zentrale; Bereiche nie. In 02 §13 als Ausnahme nennen. |
| W11 | **G-Akkorde:** `G S` = Service (02 §9.1) gegen `g s` = Shop, `g v` = Service (05 §1); `G M` fehlt in beiden | 02, 05 | Liste aus 05 übernehmen, `g m` = Marketing ergänzen, 02 §9.1 angleichen. |
| W12 | **Sheet-Dauer:** 240 ms (03 §8.11) gegen 200 ms (02 §13, 05 §15) | 02, 03, 05 | 200 ms ein, 160 ms aus (05). |
| W13 | **Unternavigation max. 7** (02 §2.1) ohne Regel, wie Rollen-Ausblendung zählt | 02 | Zählen je Rolle nach Ausblendung; „Mehr“ zählt nicht mit. |

---

## 5. Zielklickzahlen neu (nach P1–P20; ab Zentrale, ohne Suche, Enter = Klick)

| Aufgabe | §1 behauptet | heute laut Konzept | nach Änderung | Weg nach Änderung |
|---|---|---|---|---|
| Neue Ausgabe anlegen | 2 | 4 | 2 | Marketing → „+ Neue Ausgabe“ (legt an, öffnet Editor) |
| Testmail an mich | 2 | 4 | 3 ab Übersicht-Karte | Ausgabe öffnen → „Testmail…“ → Enter |
| Zur Freigabe geben | 2 | 1–2 (widersprüchlich) | 1 ab Ausgabe | „Zur Freigabe“ (Undo) |
| Showroom-Anmeldung Newsletter | 3 | 4 | 3 | Kopfzeile „+“ → „Newsletter-Anmeldung“ → Enter |
| Event-Anmeldung am Telefon | 3 | 3 (über Karte) | 3 | Marketing → Karte Event „Anmeldung erfassen“ → Enter |
| Social-Beitrag planen | 2 | ≥ 3 | 3 | Marketing → Social → Tag-Zelle (Titel tippen, Enter legt Idee mit Datum an) |
| Kampagnen-Kennzahl eintragen | 2 | 5 | 4 | Marketing → Kampagnen → Zeilenknopf „Kennzahl“ → Enter |
| Abmeldung protokollieren | 2 (nur ⌘K) | 5+ | 5 (⌘K bleibt zweiter Weg) | Marketing → Empfänger → Zeile (nach Suche) → „Abmelden“ → Bestätigen |
| Newsletter freigeben (Leitung) | 2 | 5 | 3 | Glocke → „Freigeben“ → „Freigeben – Do 18:00“ (Dialog) |
| Social-Beitrag freigeben | 1 | 4 | 2 | Glocke → „Freigeben“ |
| Event veröffentlichen | 2 | 6 | 3 | „Zu tun: Uhrzeit fehlt“ → Uhrzeit + Enter → „Veröffentlichen“ (Bestätigung) |
| Empfehlungsgutschein | 2 | ≥ 6 + Bereichswechsel | 3 | Glocke → „Gutschein…“ → „erstellen und senden“ |
| Kundenreise aktivieren | 2 | 5 | 5 | Marketing → Mehr → Kundenreisen → Reise → „Aktivieren“ → Bestätigen (selten; Zielwert ehrlich angeben) |
| Kanzlei-Freigabe eintragen | 2 | 5–6 | 5 (über Zu-tun-Zeile 3) | Marketing → Mehr → Einstellungen → Schalter → Bestätigen |

---

## 6. Was gut ist und so bleiben soll

1. **Rechtsregeln als Satz statt als Fehler** (Leitidee 2), z. B. „Werbung heute nicht möglich: Montag. Nächstes Fenster Dienstag“. Das ist der Kern von „einfach, aber mächtig“.
2. **Primäraktion je Status als Tabelle** (§2.3, §2.8, §2.9) – eindeutig für den Bau.
3. **Versandbestätigung mit Empfängerzahl, Zielgruppe und Testmail-Stand** (§4.2) – genau der Fall aus 02 §6.2.
4. **Lückenliste L1–L21** mit Zwischenlösung je Lücke – keine stillen Annahmen.
5. **Event-Check-in mit Offline-Puffer und Undo**, Teilnehmerliste mit Datenschutzhinweis, Löschfrist sichtbar.
6. **Kein Direkt-Posten an Plattformen**, stattdessen „Text kopieren“/„Bild herunterladen“ – ehrlich, wartungsarm.
7. **Bildrechte als Karten mit Folgen-Text** im Social-Beitrag, Prüfung gegen `PH Marke`.
8. **Massenaktionen mit Vorschau „n von m möglich“** und Ergebnis-Drawer – konsequent nach 02 §5.
9. **Kundenreise als Satz** („Wenn Lieferdatum + 14 Tage, dann Mail …“) – verständlich für Nicht-IT-Nutzer, sobald P3 die Schlüssel ersetzt.
10. **Kennzahl ohne Daten = „–“** mit Tooltip, keine falschen Nullen.

---

## 7. Abnahme-Ergänzungen für §10 (nach Umsetzung der Pflichtänderungen)

1. Unternavigation: je Rolle ≤ 7 sichtbare Einträge inkl. „Mehr“; bei 1 024 px kein horizontaler Scroll der Pills (P1).
2. `/marketing/abos` und `/marketing/einwilligungen` leiten per 308 auf `/marketing/empfaenger?ansicht=…`; Personen-Akte zeigt Abo und alle Einwilligungen einer Adresse; „Keine Werbung mehr“ erzeugt im Mock genau einen `abmelden`-Aufruf und je werblichem Zweck einen `widerrufen`-Aufruf, keinen doppelten Newsletter-Widerruf (P2).
3. Text-Grep über `backoffice/src/app/**/marketing/**` und `lib/backoffice/marketing/**` nach „DOI“, „Bounce“, „Claim-Guard“, „Slot“, „Preheader“, „UTM“, „Frappe“, „Doku“, „.md“ in sichtbaren Strings = 0 (Ausnahme: Glossar-Datei, Hilfe-Popover-Quelle) (P3).
4. Social: „Zur Freigabe“ erzeugt genau eine Glockenzeile für die Leitung; nach 24 h keine zweite (P4).
5. „Verwerfen“, „Als ausgebucht“, „Pausieren“, „Zur Freigabe“, „Code senden“: in allen Rollen Toast mit Undo; ⌘/Strg+Z innerhalb `--undo-ms` → **kein** Server-Aufruf im Mock-Protokoll; nach Ablauf genau einer; `pagehide` committet sofort (P5).
6. Kürzel-Test: keine Einzelbuchstaben außerhalb der 02/05-Liste im Bereich; Strg+Backspace in einem Block-Textfeld löscht ein Wort und **keinen** Block; Alt+↓ in der Akte öffnet die nächste Ausgabe; Einzeltasten über Benutzer-Menü abschaltbar (P6).
7. Check-in (iPad, Mock 46 Anmeldungen): 10 schnelle Tipps auf „Da“ nacheinander an derselben Bildschirmposition checken 10 verschiedene, vorher gesuchte Personen ein, keine Zeile verschiebt sich während der Suche; „‹ Fertig“ fragt nach Nicht-Erschienenen (P7).
8. „+ Gast ohne Anmeldung“ zählt offline; nach „Fertig“ steht ein Kommentar mit der Zahl am Event. Anmeldungsdialog zeigt den Einwilligungssatz, Absenden ohne Kontrollkästchen nicht möglich (P8).
9. Abmelden, Widerruf erfassen, Einwilligung erfassen: Bestätigen-Dialog mit Fakten, kein Undo-Toast; Einwilligung zeigt die Zusammenfassung vor dem Speichern (P9).
10. Freigabe-Dialog: Vorschau-iframe mit `title` vorhanden; Primärknopf trägt den Termin; Fehler der Vorschau sperrt Freigeben mit Grund; als Bottom-Sheet bei 390 px bedienbar (P10, P20).
11. Sperrtag im Datumspicker nicht wählbar; Server Action lehnt einen Sperrtag ab (P11).
12. Block-Editor: Text tippen, 2 s warten, Fenster schließen, in zweitem Browser öffnen → Text vorhanden; zweiter Benutzer sieht „Anna bearbeitet gerade“ (P12).
13. Newsletter-Bildfeld: keine Auswahl einer verbotenen Bildquelle möglich; 0 Serverfehler „nur eigene Fotos“ im E2E-Lauf (P13).
14. Social-Kalender: Idee per Drag und per Menü „Datum setzen…“ auf einen Tag → Datum gesetzt, Karte „wartet auf Freigabe“; „+“ am iPad ohne Hover sichtbar; Pfeiltasten wandern durch Tage (P14).
15. Klickzähler je Zeile aus §5 dieser Kritik als E2E-Schritt (P15).
16. „+ Neue Ausgabe“: 1 Klick → Editor mit Fokus im Betreff; Undo löscht den Entwurf (P16).
17. Gutschein senden: kein Freitextfeld für einen Code; ein Dialog bis zum Toast (P17).
18. Status-Ton-Test: Einwilligung „Widerrufen“ und Abo „Abgemeldet“ sind grau, „Unzustellbar“ orange; keine Liste im Bereich mit rotem Badge für einen Normalzustand (P18).
19. Jede Liste mit leerem Seed und mit Filter ohne Treffer zeigt Text + Aktion (Snapshot je Liste); Kundenreisen mit 0 Datensätzen zeigen Fehlerblock statt Leerzustand (P19).
20. Fehler-Injektion im Mock: Testmail, Vorschau, Upload > 25 MB, Versand mit 2 Fehlern, doppelter Check-in, Kalender-Drag – je Fall Text am Ort der Arbeit, kein Vollbildfehler (P20).

---

## 8. Anfragen aus dieser Kritik

| An | Punkt |
|---|---|
| ph_marketing | **L22** Status „Freigabe“ im Workflow `PH Social Beitrag` (P4) · **L23** Event-Anmeldung ohne E-Mail (Quelle telefon/showroom, ohne Einwilligung und Bestätigungsmail) (P8) · **L24** Sperrtag-Prüfung im Newsletter-Versand (P11) · Zeitstempel „erschienen_am“ (L8) wird für P7 „Da · 18:04“ geräteübergreifend nötig. |
| ph_shop + ph_marketing | **L25** Methode „Gutschein für Empfehlung anlegen und Code zurückgeben“ (P17). |
| Fundament (backoffice/) | Token `--undo-ms`, verzögerter Commit als Standard in `Toast.js` (W1–W3); Kürzel-Registry mit Doppelbelegungs-Test und Abschalter für Einzeltasten (P6); Anwesenheitsanzeige je Datensatz (P12); Kiosk-Route für Check-in mit Idle-Ausnahme (2.3 Punkt 9, 2.4 Punkt 1). |
| UX-Lead | Widersprüche W1–W13 auflösen und in 01/02/03/05 nachziehen; Status-Töne für Marketing in 03 §1.5 eintragen (P18). |
| Inhaber | Vier-Augen-Prinzip bei Personalunion von Ersteller und Leitung (2.1 Punkt 11); E-Mail-Maskierung für die Rolle Marketing (2.1 Punkt 12). |
| Konzept-Autor Marketing | §1 Klickzahlen, §2.0 Pills, §2.3 Speichermodell, §2.4/§2.5 Zusammenlegung, §4.4 M0/M1/M5 streichen bzw. ersetzen, §7.1 Check-in – nach dieser Kritik überarbeiten. |

*Ende 20 – Kritik UX Marketing.*
