# 20 – UX-/UI-Kritik Bereich „Projekte“ (zu `10-konzept-projekte.md`)

**Zweck:** Strenge Prüfung des Projekte-Konzepts (Bereichsstart, Projektliste/Kanban, Auftragsmappe, Planung, Rendering mit Pins, Rückmeldungen-Inbox, Montagekalender, Montage-/Abnahme-Akte, Zeitplan, Aufgaben, Zeiten, Fremdgewerke, Produktpässe, Referenzen, Montage mobil, Präsentationsmodus) gegen Nielsen-Heuristiken, WCAG 2.2 AA, Mobile-/iPad-Regeln und die Leitlinien 01–05. Ergebnis: Note, Pflichtänderungen vor Umsetzung, Empfehlungen, Widersprüche im Dokument und in den Leitlinien, Abnahme-Ergänzungen.
**Stand:** 2026-11-04 · Rolle: UX-/UI-Kritiker · Geprüft: `10-konzept-projekte.md` (1103 Zeilen, vollständig), `02-ux-leitlinien.md` (§0, §1.5, §3–§16), `03-design-system.md` (§1.5, §1.6, §2.2, §8.8–§8.14), `04-motion.md` (§2.1, §3.4, §3.7), `05-informationsarchitektur.md` (§2, §3.4, §3.14, §5.2), zum Abgleich `20-kritik-ux-crm.md` (gleiche Lösungen für gleiche Probleme: Akte ≤ 6 Tabs, `Alt+1…9`, Undo 8 s / Mails 10 s, verzögerter Commit, keine Bereichs-Akkorde, Einzeltasten abschaltbar, keine Emojis).
**Status:** Prüfbericht, keine Entscheidung des Inhabers. Zahlen in Wireframes sind Beispielwerte aus dem Konzept, keine Messwerte. Klickzählung nach 02 §0.3: ab Bereichsstart bzw. Arbeitsplatz-Start, ohne Suche, Enter = Klick, Tippen zählt nicht.

---

## 0. Urteil

**Note: 6 / 10.**

**Stark:**
- Datenmapping bis auf Methode und Feld, Lücken ehrlich als „fehlt in App ph_projekte“ markiert (§9, §12), inkl. echter Fehler im Backend (`workflow_state` bei `kunden_vorlegen`, `behoben` klein, Rolle PH Montage fehlt).
- Genau eine Primäraktion je Zustand in jeder Akte (§2.4, §2.8, §2.9, §3.4), Blocker-Texte statt stummer Knöpfe.
- Rendering mit Pins, Votes, Sprachnotiz und Freigabe-Banner (§2.5) und die Rückmeldungen-Inbox (§2.6) sind fachlich der stärkste Teil und am Markt selten.
- Beträge fehlen ohne Leitungsrecht als ganzer Block, nicht als „—“ (§0 Regeln, QA 4).
- Montage mobil mit Offline-Puffer, Client-UUID und Konfliktkarte (§7.1).
- Leer-/Fehler-/Ladezustände für die Hauptseiten beschrieben, Akzeptanzkriterien prüfbar (§10).

**Schwach:**
1. **Zu groß für ein Team ohne IT-Hintergrund:** 11 Unternavigations-Pills + „…“, Auftragsmappe mit **12 Tabs** (03 §8.10: > 6 → `⋯`), ein „⋯“-Menü mit rund 20 Einträgen plus „Neu ▾“ mit 11 Unterpunkten, drei Orte für denselben Gantt (`/projekte/zeitplan`, `/projekte/liste?ansicht=zeitplan`, Mappe-Tab 7), fünf Wege zur Montageplanung mit zwei Namen.
2. **Undo verspricht, was die Rechte nicht halten:** „Phase vor“ hat laut §4.5 Undo 8 s – die Gegenaktion „Zurück“ darf laut Workflow nur Leitung (§4.1). Für Mitarbeiter, die die Phase weiterschalten (Kanban-Drag, Primärknopf), gibt es keinen Rückweg. Dasselbe beim Monteur: „Erledigt → In Arbeit“ nur Leitung, „Feedback erledigt“ ohne Gegenmethode.
3. **Zwei Unterschriften beim Kunden für denselben Termin:** Montageauftrag „Unterschrift erfassen“ → „Abnehmen“ und danach PH Abnahme mit eigener Kunden- und Studio-Unterschrift (§2.8, §2.9, §7.1 Zustandsknopf „Unterschrift“ → „Abnahme“). Begriffe „Abnehmen“, „Abgenommen“, „Abnahme“, „Abnahmeprotokoll“ sind für Mitarbeiter nicht unterscheidbar.
4. **Rund 45 Bereichskürzel, davon mindestens 14 Kollisionen** mit 02 §9, 05 §2 und untereinander (`[`/`]` = Seitenleiste, `t` = Zeit buchen **und** heute, `e` = Bearbeiten **und** Erledigt, `g r/m/t` als Bereichs-Akkorde, `1–9` statt `Alt+1…9`, `Shift+K` widerspricht der CRM-Kritik). Kein Mechanismus zum Abschalten von Einzeltasten (WCAG 2.1.4, Stufe A).
5. **Ziehen ohne Alternative:** Montagekalender (Verschieben, Teamtausch, Dauer), Zeitplan, Positionen zwischen Räumen, „Datei auf Kachel ziehen“ = neue Version, Studio-Pin per Mausklick – keine Tastatur-/Menü-Alternative beschrieben (WCAG 2.5.7, 2.1.1).
6. **Kunde informieren ist dreimal anders gelöst:** Toast „Kunde informieren?“ → „Ja“ sendet ohne Vorschau (§3.1, QA 12), Kalender bietet es nur im Toast an (§2.7), M3 sagt „Kunde erst nach Ablauf informiert“ (automatisch). Widerspricht 02 §4.1 („alles, was eine Mail auslöst: Vorschau“) und der eigenen Tabelle §4.5.
7. **Klickzahlen in §1 stimmen in 12 von 27 Zeilen nicht** mit den beschriebenen Wegen (Nachzählung §2.1); M1 (Montage planen, Ziel 3) braucht 7, P3 (Rendering vorlegen, Ziel 3) braucht 7, T7 (Abnahme, Ziel 4) braucht n + 3.
8. **Präsentationsmodus vor dem Kunden ohne Schutz der anderen Kunden:** Toasts, Glocke, Stoppuhr-Anzeige „● 0:42 Küche Lochau“ in der Shell bleiben laut Konzept unerwähnt; Beenden per 1-s-Langdruck auf die Wortmarke ist weder auffindbar noch per Tastatur möglich.
9. **Microcopy verletzt 02 §14 systematisch:** Sie-Form in internen Leerzuständen („Ziehen Sie …“, „Übernehmen Sie …“, „koordinieren Sie hier“), Emojis in Wireframes (👁 🎙 📷 👍 👎 🔍), drei Wörter für dasselbe („Feedback“, „Kundenfeedback“, „Rückmeldung“).

Gegenüber CRM (6) gleich: fachlich tiefer und mit dem besten Alleinstellungsmerkmal (Rendering-Abstimmung), aber die Mappe ist das Herzstück, das jeder Mitarbeiter täglich öffnet – jede überzählige Taste und jeder doppelte Begriff wirkt hier am stärksten. Nach P1–P18 realistisch 8.

---

## 1. Pflichtänderungen (vor Umsetzung, nach Wirkung sortiert)

| Nr. | Befund | Verstoß gegen | Änderung (konkret) |
|---|---|---|---|
| P1 | **Auftragsmappe: 12 Tabs, Kopf 4 Zeilen + Phasenleiste 3 Zeilen + „Nächster Schritt“ (Skeleton 168 px), Tab-Leiste bricht im eigenen Wireframe auf 2 Zeilen um.** Inhalte doppelt: „Offene Rückmeldungen“ und „Termine“ stehen in Tab 1 **und** rechter Spalte; „Nächste Schritte“-Karte wiederholt den Primärknopf; Tagebuch existiert als Tab 8 **und** Route `/projekte/[projekt]/tagebuch`; Tab „Mappe“ heißt wie die Seite. Am iPad hoch scrollen 12 Tabs horizontal – die Hälfte ist unsichtbar. | 03 §8.10, 02 §0.2, Nielsen 8 (minimalistisch), Nielsen 6 (Wiedererkennen), WCAG 1.4.10 | **6 Tabs, keine „Mehr“-Ebene:** `Übersicht` · `Positionen` (Räume & Positionen) · `Planung` (Planungen + Renderings) · `Belege & Lieferung` (Belege, Zahlung, Herstellerbestellungen, Lieferscheine als Abschnitte mit Sprunganker) · `Montage` (Montagen, Fremdgewerke, Abnahmen, Produktpässe) · `Dateien` (Dokumente + Tagebuch, Segment „Dokumente \| Fotos“). **Entfallen als Tab:** Zeitplan → Mini-Gantt (8 Wochen, 120 px hoch) in `Übersicht`, „Im Zeitplan öffnen“ führt auf `/projekte/liste?ansicht=zeitplan&projekt=…`; Nachrichten + Zeitleiste → rechte Spalte „Aktivität“ (P2); Aufgaben & Zeiten → Karte in `Übersicht` + Popover; Daten → rechte Spalte „Details“ (Eigenschaften-Panel, inline editierbar, wie CRM-Kritik P4). Route `/tagebuch` → 307 auf `?tab=dateien&ansicht=fotos`. **Kopf max. 2 Zeilen + Phasenleiste** (Wireframe W1, §2.8). Tab-Kürzel `Alt+1…6`. |
| P2 | **Kundennachrichten und interne Kommentare stehen an zwei Orten mit zwei Eingabefeldern** (Tab „Nachrichten“ mit `⌘Enter`, Zeitleiste rechts mit Kommentarfeld `c`). Wer schnell tippt, kann nicht sicher erkennen, ob der Text beim Kunden landet. | Nielsen 5 (Fehlervermeidung), Nielsen 1, Datenschutz | **Ein Aktivitäts-Strom rechts** (360 px ≥ 1280, darunter Sheet 480 px über Kopf-Knopf „Aktivität“ mit Ungelesen-Zähler, `Shift+D`), Segment oben `Aktivität \| Details`. Composer unten sticky mit **Modus-Schalter** `Intern` (Standard, Rahmen `line`) / `An Kunde` (Rahmen 2 px `accent` Sand, Zeile über dem Feld „Fam. Muster sieht das im Portal“, Knopf „An Kunde senden“). Moduswechsel nur per Klick/`Shift+Tab` auf den Schalter, nie per Tastenkürzel im Feld; Modus wird **nicht** gemerkt (immer `Intern` nach dem Senden). Kundeneinträge links mit Avatar, Studio rechts, interne Kommentare grau hinterlegt mit Schloss-Icon `lock` 12 px + Text „Intern“. Filter-Chips bleiben (Alles · Kunde · Team · Belege · System). |
| P3 | **Undo für Mitarbeiter unmöglich bei Phase vor, Kanban-Drag und Monteur-Status.** §4.5 verspricht Undo 8 s; die Gegenaktion „Zurück“ ist im Workflow `PH Projekt` nur Leitung, `PH Montageauftrag` Erledigt → In Arbeit nur Leitung. „Feedback erledigt“ hat keine Gegenmethode (`PH Rendering Feedback` kennt nur `erledigt()`). Ergebnis: Undo-Knopf sichtbar, Klick scheitert mit „Keine Berechtigung“. | 02 §0.4, §6.1, Nielsen 3 (Kontrolle), Nielsen 9 | **Verzögerter Commit (Variante A, 04 §3.6, wie CRM-Kritik):** Workflow-Vorwärtsaktionen von Mitarbeitern (Primärknopf, Kanban-Drop, Kiosk-Zustandsknopf) werden optimistisch angezeigt und erst nach 8 s an Frappe gesendet; „Rückgängig“ (`Z` / ⌘Z) verwirft lokal ohne Serveraufruf. `pagehide` und Seitenwechsel führen die Aktion sofort aus (nie stillschweigend verwerfen). Warteschlange je Datensatz: zweite Aktion am selben Projekt innerhalb des Fensters schickt die erste sofort. Kiosk: 8 s Undo-Leiste über dem Zustandsknopf (Höhe 56 px, Text 16 px „Fertig gemeldet · Rückgängig“), offline wird erst nach Ablauf gepuffert. „Feedback erledigt“: Undo = `setzeWert status=Offen` (Anfrage an ph_projekte: Methode `wieder_oeffnen()` mit Verlauf). Anfrage an ph_projekte (mittel): Übergang „Zurück“ für den auslösenden Benutzer innerhalb 10 min (Bedingung im Workflow), dann kann Variante B folgen. |
| P4 | **Doppelte Kundenunterschrift und vier ähnliche Wörter.** Monteur erfasst `unterschrift_erfassen` am Montageauftrag (für „Abnehmen“), danach PA5 mit erneuter Kunden- und Studio-Unterschrift an PH Abnahme. Zustandsknopf mobil: „Unterschrift“ → „Abnahme“. Am Desktop: „Abnehmen“, „Abnahmeprotokoll anlegen“, „Abnahme anlegen“, „Abnahme durchführen“. | Nielsen 2 (Sprache der Nutzer), Nielsen 4, Nielsen 7, 02 §1.5 (2 Tipps Unterschrift) | **Ein Ablauf „Abschluss beim Kunden“** (mobil und iPad identisch, Wireframe W4): ① Leistungen-Prüfung (offene Leistungen als Hinweis) → ② Positionen: Knopf **„Alles in Ordnung“** (setzt alle `ok`) oder einzeln Mangel → ③ **eine** Unterschrift Kunde + Name → ④ Unterschrift Studio (Monteur, vorbelegt aus Sitzung, ein Tipp) → ⑤ Zusammenfassung. Technik: `abnahme_anlegen` (idempotent) → `save` Positionen → `PH Abnahme.unterschrift_erfassen` → **dieselbe Signatur** an `PH Montageauftrag.unterschrift_erfassen` → Workflow „Abnehmen“ + „Unterzeichnen“/„Mängel feststellen“ → `protokoll_als_dokument`. Anfrage an ph_projekte (hoch): eine Methode `abschluss_beim_kunden(montageauftrag, positionen, unterschrift_kunde, name_kunde, unterschrift_studio, erfasst_am)`, transaktional. **Wörter:** UI nennt den Vorgang nur „Abnahme“; der Montage-Status „Abgenommen“ bleibt Status, der Knopf „Abnehmen“ verschwindet aus der UI; „Abnahmeprotokoll“ nur noch als Dokument/PDF. |
| P5 | **Phasenleiste: Klick auf vergangenen Punkt = „Zurück zu …“ (Leitung).** 02 §3.1 definiert Klick = zugehöriges Objekt öffnen. Ein neugieriger Klick auf „Bestellung“, um die Herstellerbestellung zu sehen, bietet der Leitung das Zurücksetzen an. Mehrstufiges Zurück = mehrere Aufrufe ohne Teilfehler-Regel. 8 Punkte + Endzustand separat widerspricht 02 §3.1 / 05 §5.2 (9 Punkte inkl. Abschluss). | 02 §3.1, Nielsen 4, Nielsen 5 | Klick/Enter auf jeden Punkt öffnet **Popover „Phase Bestellung“**: Datum, Person, Notiz, auslösende Objekte als Links (Herstellerbestellungen, Lieferscheine …), bei mehreren Liste. **Zurücksetzen** nur unten im Popover als Textknopf `danger-text` „Projekt auf Bestellung zurücksetzen …“ (Leitung) → Dialog sm „Projekt von Montage auf Bestellung zurücksetzen? Montageaufträge bleiben bestehen.“ Primär „Zurücksetzen“, Fokus auf Abbrechen. Mehrstufig: Fortschritt im Dialog („2 von 3“), bei Fehler Stopp + Text „Bei Lieferung angehalten – Grund: …“, Phasenleiste zeigt den echten Stand. **9 Punkte** wie 02/05 (letzter „Abgeschlossen“; Abgebrochen ersetzt ihn als roter Punkt mit Dreieck-Icon + Wort). Semantik: `<ol>` mit `aria-current="step"`, je Punkt `<button aria-haspopup="dialog">`. |
| P6 | **Phase folgt der Wirklichkeit nicht.** Monteur drückt „Beginnen“, Projekt bleibt in „Lieferung“, bis jemand im Büro „Montieren“ klickt; ebenso „Liefern“ nach Lieferschein, „Übergeben“ nach Abnahme. Phasenleiste und Kennzahlen zeigen dann Falsches (Kanban, „Projekte je Phase“). | Nielsen 1 (Sichtbarkeit des Systemstatus), 02 §0.5 | Regel „**Folgeobjekt schiebt Phase**“ (Backoffice-seitig sofort, bis ph_projekte-Hook existiert): Montageauftrag „In Arbeit“ → Projekt-Workflow „Montieren“ (falls erlaubt) mit Zeitleisteneintrag Quelle „System“; Abnahme unterzeichnet → „Übergeben“; alle Lieferscheine zugestellt → „Liefern“. Wo der Benutzer die Transition nicht darf: Band in der Mappe „Montage läuft seit 08:12 – Phase noch ‚Lieferung‘ [Phase anpassen]“ (Mitarbeiter: Aufgabe an Leitung). Anfrage an ph_projekte (mittel): `on_update`-Hooks für PH Montageauftrag/PH Abnahme/PH Lieferschein. Regeltabelle §3.4: Zeilen „Montieren“, „Liefern“, „Übergeben“ als manuelle Primäraktion entfallen. |
| P7 | **Kunde informieren: drei Varianten, eine ohne Vorschau.** Toast „Kunde informieren?“ → „Ja“ sendet sofort Mail (§3.1, QA 12); Kalender: Toast „Kunde informieren“ (§2.7); M3: automatisch nach Undo-Ablauf; PA2 Schritt ⑤ optional; AU1 später automatisch. Toast-Aktion verschwindet nach 6–8 s – wer den Toast verpasst, hat keinen zweiten Weg. | 02 §4.1, §6.2, eigene §4.5, Nielsen 4, WCAG 2.2.1 | **Ein Muster überall (Mappe, Kalender, Zeitplan, Massenaktion):** Toast nur „Liefertermin auf KW 48 verschoben · Rückgängig“. Zusätzlich erscheint im Mappenkopf (und auf dem Kalenderblock) ein **bleibender Chip** `Kunde nicht informiert · Informieren …` (`warning-soft`, Icon `send`), bis gesendet oder „Nicht nötig“ gewählt. Klick öffnet **Sheet „Kunden informieren“** 480 px: Empfänger, Text (Vorschlag, editierbar), Vorschau Portal-Karte, Primär „Senden“ (`⌘Enter`). Senden = Undo-Toast **10 s** „Nachricht an Fam. Muster wird gesendet · Rückgängig“ (verzögerter Commit, Mails 10 s wie CRM-Kritik); Versandfehler nach Ablauf → Glocke + roter Zeitleisteneintrag „Nicht gesendet – Erneut senden“. Gilt identisch für „Status senden“ (umbenannt, §2.9). M3 korrigieren. |
| P8 | **Ziehen ohne Alternative.** Montagekalender: Verschieben, Teamtausch (vertikal), Dauer (Rand) nur per Drag; Zeitplan nur Drag (iPad Popover, Desktop nicht); Positionen zwischen Räumen; neue Dokumentversion „Datei auf Kachel ziehen“; Ablagefläche Tab 3 ohne Dateiauswahl-Knopf; Vergleichsregler ohne Tastaturbedienung; Studio-Pin nur per Klick ins Bild. Diagonales Ziehen im Kalender ändert Datum **und** Person gleichzeitig. | WCAG 2.5.7 (AA), 2.1.1 (A), 02 §11.2, Nielsen 5 | (a) **Jeder Kalender-/Gantt-Block ist ein Button**; `Enter` / Antippen öffnet Popover „Montage umplanen“ (360 px): Datum, Start, Ende, Team (Mehrfachauswahl), Knopf „Übernehmen“; Kürzel bei Fokus `Shift+←/→` ±1 Tag, `Shift+↑/↓` ±30 min, jeweils mit Undo-Toast. (b) Drag im Kalender **achsengebunden**: Richtung wird nach den ersten 8 px festgelegt (horizontal = Zeit, vertikal = Person); Geist zeigt Ziel als Text „Mi 12.11. · 07:30 · J. Huber statt T. Steiner“. (c) Positionen: Zeilenmenü „In Raum verschieben ▸“. (d) Dokument-Kachel: Menü „Neue Version hochladen …“. (e) Ablagefläche immer mit Knopf „Datei wählen“ (`Shift+U`). (f) Vergleichsregler `role="slider"`, `←/→` 5 %, `Pos1/Ende`. (g) Studio-Pin: Werkzeugleiste „Pin setzen“ (Segment `Ansehen \| Pin`), im Pin-Modus Fadenkreuz per Pfeiltasten (1 %, mit Shift 5 %), `Enter` setzt. |
| P9 | **Kanban-Drag nach „Abgebrochen“ und „Abgeschlossen“ umgeht die Assistenten.** Drag nach Abgebrochen öffnet nur einen Grund-Dialog, PA9 (Folgen: offene Montagen, Fremdgewerke, Aufgaben) wird übergangen; Drag nach Abgeschlossen ist gar nicht geregelt und umgeht die Prüfliste PA8. | Nielsen 5, eigene §4.5/§4.6 | Spalten „Abgebrochen“ und „Abgeschlossen“ sind **Drop-Ziele nur, die PA9 bzw. PA8 öffnen**; Abbruch des Assistenten → Karte 200 ms `--bo-ease-out` zurück, nichts gespeichert. Gilt auch für Mehrfach-Drag: Abschluss/Abbruch nur einzeln („Abschließen geht nur einzeln – 3 Karten zurückgelegt“). QA 6 erweitern. |
| P10 | **Tastenkürzel kollidieren (Liste §2.2), kein Abschalten.** Rund 45 Bereichskürzel, mindestens 14 Kollisionen; `[`/`]` überschreibt die Seitenleiste (02 §9.1); `t` heißt in derselben Mappe „Zeit buchen“ und im Tab Zeitplan „heute“; `g r/m/t` sind Bereichs-Akkorde (05: Akkorde global). WCAG 2.1.4 verlangt Abschalten/Umbelegen von Einzeltasten-Kürzeln. | WCAG 2.1.4 (A), 02 §9, 05 §2, Nielsen 4 | Kürzel-Tabelle §2.2 übernehmen; neue Regel für den Bereich: **Einzelbuchstaben nur für Navigation in Listen/Inbox (`j/k`, `x`, `n`, `c`)**, Aktionen mit `Shift+Buchstabe`, Tabs `Alt+1…6`, Primär `⌘/Strg+Enter`, Aktionsmenü `.`. Alle Kürzel in eine Registry (`lib/backoffice/kuerzel.js`), Unit-Test „keine Doppelbelegung je Seitentyp“. Benutzer-Menü → „Tastatur“: Schalter **„Einzeltasten-Kürzel“** (Standard an; aus = nur Kürzel mit ⌘/Strg/Shift/Alt). Kein Kürzel ohne sichtbaren Knopf (Stoppuhr, Kundensicht, Präsentation haben Knöpfe). |
| P11 | **Bereichsstart überladen und widersprüchlich gezählt.** Heute-Leiste + 6 Kennzahlen + Meine Projekte + 5 Charts + „Braucht Leitung“. Drei Kennzahlen zählen fast dasselbe (Offene Feedbacks 7, Renderings ohne Antwort 2, Ungelesene Nachrichten 3); Pill „Rückmeldungen 5“, Inbox „Offen 7“, Chips 5+1+1+3 = 10 im selben Konzept. Kennzahlen zählen beim ersten Laden hoch (§2.1) – 04 §3.7 verbietet genau das (P10: nie beim Erstaufbau), 02 §13 verbietet Hochzählen ganz. | 02 §2.1/§13, 03 §8.14, 04 §3.7, Nielsen 8, Nielsen 4 | **Eine Zahl je Sache:** „Rückmeldungen offen“ = Feedback `von=kunde, art≠vote, status=Offen` + Nachrichten `eingehend, Ungelesen`; dieselbe Formel in Pill, Kennzahl, Inbox-Kopf, Glocke (Unit-Test). **Kennzahlen 4 je Rolle:** Mitarbeiter: Meine Rückmeldungen offen (davon überfällig) · Meine fälligen Aufgaben · Meine Montagen diese Woche · Offene Mängel meiner Projekte. Montageleiter: Montagen diese Woche · Nicht eingeplant · Auslastung KW (Report) · Mängel überfällig. Leitung/GF: Aktive Projekte · Rückmeldungen überfällig · Braucht Leitung · Mängel überfällig. **Charts nach `/projekte/berichte`** (Bericht „Übersicht“), Bereichsstart ohne Charts. Kein Hochzählen beim Laden; nur nach Wertänderung (04 §3.7). „Meine Projekte“ bleibt (max. 8). Wireframe W2. |
| P12 | **Navigation: 11 Pills, drei Gantt-Orte, fehlende Listen.** `/projekte/dokumente` hat Route, fehlt aber in der Pill-Liste; Abnahmen und Mängel haben keine Liste (G2 springt in einen Report, nicht in eine bearbeitbare Liste); 05 §3.4 hat `/projekte/[projekt]/dokumente` und `/nachrichten` als Routen, das Konzept nicht; `/tour` (05 §3.14, Teil des Montage-Kiosks) fehlt ganz. | 02 §2.1, 05 §3.4, Nielsen 6 | **Pills: Übersicht · Projekte · Rückmeldungen · Montagen · Aufgaben · Mängel · Mehr ▾** (Zeiten, Fremdgewerke, Dokumente, Produktpässe, Referenzen, Berichte, Einstellungen). `Mängel` = neue T2-Liste `/projekte/maengel` über `anzahl_offene_maengel`-Quellen (Montage-Mängel + Abnahme-Positionen), Zeilenaktionen „Erledigt“, „→ Servicefall“, Frist inline. Zeitplan nur als Ansicht `?ansicht=zeitplan` der Projektliste; `/projekte/zeitplan` → 307. Alte 05-Routen `/projekte/[p]/dokumente|nachrichten|tagebuch` → 307 auf `?tab=`/`?panel=aktivitaet` (Deep-Links aus Glocke und Mails). Montage-Kiosk um Tab „Tour“ ergänzen oder in 05 streichen (Inhaber/IA-Lead). |
| P13 | **Assistenten mit zu vielen Schritten für Standardfälle.** PA2 Montage planen: 5 Schritte → 7 Klicks (Ziel 3). PA3 Rendering vorlegen: 3 Schritte + Vorschau. PA5 Abnahme: eine Karte je Position (Ziel 4 Tipps bei 9 Positionen unerreichbar). PA1: Zusammenfassung als eigener Schritt für ein einfaches Anlegen. | 02 §4.3, eigene §1, Nielsen 7 (Effizienz) | **Ein Bildschirm mit Vorschlägen, Schritte nur bei Bedarf:** PA2 als Sheet 640 px: oben Datum/Zeit (Kalenderstreifen 2 Wochen mit Kapazität je Tag), darunter Team (vorbelegt), Leistungen (eingeklappt „9 Leistungen aus Positionen · 14 h“ – Klick klappt auf), Unterlagen (vorbelegt: freigegebene Planung + freigegebenes Rendering), unten Satz „Legt Montage am Mo 17.11. 08:00–16:00 für T. Steiner + J. Huber an“ + Primär „Montage anlegen“ (`⌘Enter`) – **Datum wählen + Anlegen = 2 Klicks im Sheet**. Kunde informieren nicht im Assistenten, sondern Chip nach P7. PA3: Sheet mit Varianten-Häkchen (alle Entwürfe mit Bild vorgewählt), KI-Hinweis als Pflicht-Checkbox nur wenn nötig, Text, „Vorlegen“. PA5 → P4 („Alles in Ordnung“). PA1: Zusammenfassung als Satz über dem Knopf, kein eigener Schritt. |
| P14 | **Rendering-Pins: Kontrast, Tastatur, Fehlbedienung.** Pins 24 px Tinte mit Sand-Ring liegen auf beliebigen Bildern (dunkle Eiche, schwarze Fronten) – Kontrast nicht gesichert; „Klick ins Bild = Studio-Pin“ kollidiert mit Zoom/Pan per Ziehen (jedes Loslassen ohne Bewegung erzeugt einen Pin); Pins nicht als fokussierbare Elemente beschrieben; im Präsentationsmodus tippen Kunden mit dem Finger auf 24-px-Ziele. | WCAG 1.4.11, 2.1.1, 2.5.8, 02 §11.2, Nielsen 5 | Pin = `<button>` 28 px (iPad/Präsentation 44 px Trefferfläche, sichtbarer Kreis 28 px), Füllung `ink`, Ziffer weiß 12/600, **Außenring 2 px weiß + Schatten `0 0 0 1px rgb(0 0 0/.35)`** (auf hell und dunkel ≥ 3:1). Offen = zusätzlicher Ring 2 px `accent` außen; erledigt = Füllung `ink-soft` + Haken statt Ziffer (Form, nicht nur Farbe). Fokus-Reihenfolge = Fadenreihenfolge; `aria-label` „Pin 1 von Fam. Muster: Griffe lieber schwarz? – offen“. Pin setzen nur im Modus `Pin` (P8 g), Undo 8 s für neue Pins (Studio und Kunde am iPad). Bildfläche `surface-2`, Zoomstufe als Text „200 %“ in der Werkzeugleiste. |
| P15 | **Präsentationsmodus ohne Schutz und ohne Ausgang.** Beenden nur per 1-s-Langdruck auf die Wortmarke – Mitarbeiter finden es nicht, Tastatur geht nicht; Toasts, Glocke, laufende Stoppuhr („● 0:42 Küche Lochau“ in der Shell), Undo-Toasts anderer Projekte bleiben unerwähnt; Präsentationsmodus heißt am Desktop anders als die Kundensicht, obwohl beide „was sieht der Kunde“ zeigen. | Datenschutz, Nielsen 3 (Notausgang), WCAG 2.1.1, CRM-Kritik P (Kundenansicht) | Beim Start Band 4 s „Präsentation – Beenden: Wortmarke 1 s halten oder Esc 1 s halten“; Ausgang zusätzlich über **4-stellige Mitarbeiter-PIN** nach Antippen von „Beenden“ unten links (40 px, `text-faint`). Während des Modus: keine Toasts außer eigenen Aktionen dieses Projekts, Glocke/Seitenleiste/Stoppuhr ausgeblendet, Undo-Toasts anderer Datensätze gepuffert und nach Verlassen gezeigt, Bildschirmsperre-Idle 15 min. Kundensicht (§3.6) und Präsentation teilen eine Komponente `KundenAnsicht` (gleiche Ausblendregeln, gleicher Sand-Rahmen 2 px). |
| P16 | **Kundensicht verspricht eine Vorschau, die ohne `portal_project_vorschau` nicht existiert.** Rückfall laut §3.6: „nur Markierung (Auge-Symbole)“ – der Schalter „👁 Kundensicht“ würde dann etwas anderes zeigen, als er sagt. | Nielsen 1, Nielsen 2 | Bis die Methode existiert: **kein Schalter „Kundensicht“**; stattdessen Filter-Chip „Nur für Kunde sichtbar“ in Tab `Dateien`, `Planung`, `Montage` und das Auge-Icon `eye` / `eye-off` 16 px mit Text „Kunde sieht“ / „Intern“ (nicht nur Icon). Mit Methode: Schalter `Shift+V` (P10), Band „Vorschau: so sieht Fam. Muster das Portal (Stand 09:12)“, Portal aus → Leerzustand „Fam. Muster sieht dieses Projekt nicht – Portal ist aus. [Portal einschalten]“. |
| P17 | **Montage mobil: Bezeichnungen, Doppel-Uhr, erzwungenes Querformat, kein Undo.** Knopf heißt „Fertig melden“ (§7.1), „Erledigt melden“ (§1.5, §4.3), Desktop „Erledigt melden“; „Gleich beginnen“ vs. „Beginnen“. Zustand „Beginnen“ setzt `tatsaechlich_start`, daneben eigener Zeit-Knopf Start/Stopp → zwei Uhren für dieselbe Arbeit. „Unterschrift Vollbild quer“ erzwingt Ausrichtung. Kiosk-Undo fehlt (Haken, Status, Foto löschen). | WCAG 1.3.4 (AA), Nielsen 4, 02 §1.5, Nielsen 3 | **Wortliste Kiosk:** `Losfahren` · `Beginnen` · `Fertig` · `Abnahme mit Kunde` (P4); Workflow-Aktionsnamen bleiben im Server. **Eine Uhr:** Arbeitszeit = `Beginnen` → `Fertig`; beim Fertig-Tipp Sheet „7:28 h für T. Steiner und J. Huber buchen?“ mit Stepper je Person (0,25 h), „Buchen“; Pausen über Knopf „Pause“ im Stopp (zieht ab). Separater Zeit-Knopf entfällt. **Unterschrift in beiden Ausrichtungen**, Feld volle Breite × min. 240 px; Querformat nur als Empfehlung („Mehr Platz im Querformat“). **Undo-Leiste** 8 s für Status (P3), Leistungs-Haken, Foto (Foto löschen = Papierkorb bis Tagesende). |
| P18 | **Microcopy und Icons.** Interne Leerzustände in Sie-Form; Emojis 👁 🎙 📷 👍 👎 🔍 ▶ in Wireframes; „Feedback/Kundenfeedback/Rückmeldung“, „Status senden“, „Mappe“ als Tab, Planung „Kunde vorgelegt“ vs. Rendering „Vorgelegt“. | 02 §14, 03 §5, Nielsen 2, Nielsen 4 | Glossar §2.9 verbindlich; alle internen Texte Du-Form; Icons nur lucide mit Text oder `aria-label` + Tooltip (`eye`, `mic`, `camera`, `thumbs-up`, `thumbs-down`, `search`, `play`, `timer`). Lint-Regel gegen Emoji in JSX-Texten (wie CRM Q40). |

---

## 2. Weitere Schwächen (Empfehlungen, keine Blocker)

### 2.1 Komplexität und Klickzahlen (Nachzählung §1, Regel 02 §0.3)

| # | Konzept-Ziel | Beschriebener Weg (gezählt) | Ist | Nach Pflichtänderungen | Bemerkung |
|---|---|---|---|---|---|
| B1 | 2 | Anfrage-Akte → Projekt anlegen → Anlegen und öffnen | 2 | 2 | Start ist CRM, nicht `/projekte` – Startpunkt in der Tabelle nennen |
| B2 | 1 | Meine Projekte → Zeile | 1 | 1 | ok |
| B3 | 2 | Mappe → `⋯` → Status senden → Senden | 4 | 3 | P7: Sekundärknopf „Kunden informieren“ im Kopf |
| B4 | 2 | Glocke → Eintrag → `⌘Enter` | 3 | 3 | ehrlich 3 |
| B5 | 2 (3) | Mappe → Chip → Datum → „Ja“ (+ Senden) | 4–5 | 3 + 2 für Informieren | P7 trennt Ändern und Informieren |
| B6 | 2 | Mappe → `⋯` → Neu ▾ → Aufgabe → Enter | 5 | 3 | Karte „Aufgaben“ in Übersicht mit Zeile „+ Aufgabe“ |
| B7 | 2 | Mappe → Primär | 2 (+A2) | 2 | ok |
| P1 | 2 | Mappe → Tab 3 → Ablegen → Bestätigen | 4 | 3 | Ablage auf der ganzen Mappe (Overlay „Hier ablegen“) + Auswahl „Planung / Rendering“ |
| P3 | 3 | Mappe → Tab → Ablegen → Bestätigen → Kunden vorlegen → Weiter → Weiter → Senden | 8 | 5 | P13 |
| P4 | 1 je Pin | Inbox → Antwort → `⌘Enter` | 1 (+ Tippen) | 1 | §1.2 sagt `Enter`, §2.6 `⌘Enter` – vereinheitlichen auf `⌘Enter` |
| P7 | 2 | `t` → Enter | 2 | 2 | Kürzel `Shift+H` (§2.2) |
| L2 | 2 | Phasenpunkt → Zurück | 2 | 3 | P5 fügt Bestätigung hinzu – bewusst |
| L4 | 2 | Mappe → Primär → Abschließen | 3 | 3 | ehrlich 3 |
| L6 | 2 | Referenzen (in Mehr ▾) → Zeile → Veröffentlichen | 3–4 | 3 | über Kennzahl „Braucht Leitung“ |
| L7 | 3 | Zeiten → Filter → Alle → Als abgerechnet → Beleg → Bestätigen | 6–7 | 5 | gespeicherte Ansicht „Abrechenbar offen“ + Beleg als LinkFeld (PH Rechnung) statt Freitext |
| M1 | 3 | Mappe → Primär → 4× Weiter → Anlegen | 7 | 4 | P13 |
| M3 | 1 | Block ziehen | 1 | 1 (+2 Informieren) | P7 |
| M4 | 2 | Montagen → Block → Tab Mängel → → Servicefall → Bestätigen | 5 | 3 | Liste „Mängel“ (P12) mit Zeilenaktion |
| T6+T7 | 2 + 4 | Unterschrift → Fertig; Abnahme → n Positionen → Unterschriften → Unterzeichnen | 2 + (n + 3) | 4 gesamt | P4 „Alles in Ordnung“ |
| A1 | 1 | ⌘K | – | 2 | verstößt gegen „ohne Suche“; Weg ohne Suche: Projekte → Zeile (Suchfeld `/` in der Liste) |

QA 27 (≤ 8 Tipps Montage-Durchlauf) zählt nicht mit: iOS-Kamera verlangt „Foto verwenden“ (+1 je Foto) und Rückweg zur Stopp-Seite (+1). Mit `<input capture>` ehrlich 10; Ziel auf 10 setzen oder eigene Kamera-Ansicht (getUserMedia, Auslöser 72 px, Serienaufnahme ohne Rückfrage) – dann 8.

**Menüs:** `⋯` der Mappe gruppieren und kürzen: **Kunde** (Kunden informieren, Im Portal öffnen, Link kopieren) · **Anlegen** (Planung, Rendering, Dokument, Fremdgewerk, Aufgabe, Zeit, Termin, Angebot, Servicefall – Montage nur über „Montage planen“, Abnahme nur über „Abnahme mit Kunde“) · **Drucken** (Statusbericht) · **Leitung** (Zahlungsstand aktualisieren, Produktpässe erzeugen, Zurücksetzen, Abbrechen – rot, unten). Menü mit Eingabefilter oben (Tippen filtert, wie Linear). Ein Name je Aktion: „Montageauftrag anlegen“ entfällt neben „Montage planen“.

### 2.2 Tastatur (Kollisionen und Vorschlag)

| Kürzel im Konzept | Ort | Kollidiert mit | Vorschlag |
|---|---|---|---|
| `1`–`9` Tabs | Mappe | 02 §9.4 `Alt+1…9`, Liste `1–9` Statuschips | `Alt+1…6` |
| `[` / `]` Version/Variante | Planung, Rendering | 02 §9.1 Seitenleiste | `Shift+←/→` |
| `t` Zeit buchen | Mappe, Aufgaben | `t` = heute (Kalender, Zeitplan-Tab in derselben Mappe) | `Shift+H` („Stunden“); `t` bleibt heute |
| `Shift+T` Stoppuhr | Mappe | CRM-Kritik `Shift+T` = Termin anlegen | ohne Kürzel, Knopf `timer` im Kopf + Palette `> Stoppuhr` |
| `e` Erledigt | Inbox, Rendering, Aufgaben | 02 §9.1 `E` = Bearbeiten; 05 T2 `e` = CSV | `Shift+E` |
| `a` Aufgabe | Mappe | 02 §9.2 `A` = Zuweisen; Aufgaben-Liste `a` = Zuweisen | `Shift+A` (wie CRM-Kritik) |
| `.` „Aufgabe“ (B6) | Mappe | eigene §3.8 `a` | `.` bleibt Aktionsmenü |
| `m` Nachricht | Mappe | 03 §8.8 `m` = Verschieben (Kanban), T4 `m` = Monat | `Shift+M` (CRM: E-Mail `Shift+M`) |
| `u` Hochladen | Mappe | Inbox `u` = ungelesen | `Shift+U` |
| `k` Kundenakte | Mappe | `j/k` in Inbox/Rendering; CRM-Kritik `Shift+K` = Kontakt | `Shift+K` = Kundenakte |
| `Shift+K` Kundensicht | Mappe | CRM-Kritik `Shift+K` = Kontakt | `Shift+V` (Vorschau) |
| `p` / `⌘P` Drucken | Mappe | 05 `p` = Projekt öffnen (Belege), Inbox `p` = Mappe | nur `⌘P`; `p` = „zum Projekt“ überall |
| `c` Vergleichen | Rendering | 02 §9.2 `C` = Kommentar | `Shift+C` |
| `v` neue Version | Planung | Liste `v` = Ansicht wechseln | `Shift+N` |
| `g r` / `g m` / `g t` | Bereichsstart | 05: Akkorde global | streichen, Palette `> Rückmeldungen` |
| `1–6` Kennzahl öffnen | Bereichsstart | nicht in 02/05 registriert | streichen (Kennzahlen sind Links, Tab-Reihenfolge reicht) |
| `f` Fremdgewerke ein/aus | Kalender | 05 T2 `f` = Filter-Fokus | Checkbox in der Kalender-Werkzeugleiste, ohne Kürzel |
| `k` Kapazität ein/aus | Kalender | `j/k`-Muskelgedächtnis | Checkbox, ohne Kürzel |
| `Leertaste` auf-/zuklappen | Zeitplan | 02 §9.2 Leertaste = auswählen | Treegrid: `→` aufklappen, `←` zuklappen, Woche scrollen `Shift+←/→` |
| `r` Rendering öffnen | Inbox | 05 T1 `r` = neu laden | `Shift+R` |
| `Enter` senden (P4) | Inbox | eigene §2.6 `⌘Enter` | `⌘Enter` |

Lücken: Kanban-Tastatur (03 §8.8: Leertaste greifen, `←→`, `Enter` ablegen, `m` Menü) für alle vier Boards (Projekte, Montagen, Fremdgewerke, Aufgaben) ausdrücklich nennen; Lightbox Tagebuch: `Esc`, `←/→`, Fokus zurück auf Miniatur; Fokus nach „Erledigt“ in der Inbox → nächste Zeile (nicht Seitenanfang); Popover Zeit buchen: `Esc` verwirft, `⌘Enter` speichert.

### 2.3 Undo, Rückfragen, Fehlervermeidung (Matrix)

| Aktion | Konzept | Soll |
|---|---|---|
| Phase vor (Mitarbeiter) | Undo 8 s über „Zurück“ (nur Leitung) | P3 verzögerter Commit |
| Phase zurück (Leitung) | Popover-Klick, Undo ruft Vorwärts | P5 Dialog, danach Undo 8 s |
| Kanban → Abgebrochen/Abgeschlossen | Grund-Dialog / ungeregelt | P9 |
| Montage verschieben | Undo 8 s, Kunde je nach Stelle | Undo 8 s + Chip (P7) |
| Kunde informieren / Status senden | Vorschau oder sofort | Sheet + 10 s (P7) |
| Feedback erledigt | Undo 8 s ohne Gegenmethode | P3 (`setzeWert`, später Methode) |
| Nachricht als gelesen nach 1 s | automatisch | ok; `Shift+U` als ungelesen, sichtbarer Knopf in der Vorschau |
| Tagebuchfoto löschen (`tagebuch_delete`) | nicht beschrieben | Undo 8 s über verzögerten Commit; Kundenfoto löschen nur Leitung mit Dialog („Fam. Muster hat dieses Foto hochgeladen“) |
| Planung verwerfen | Dialog (Methode fehlt) | ok bis Methode; Dialogtitel „Planung ‚Insel‘ v3 verwerfen? Der Kunde sieht sie dann nicht mehr.“ |
| Position zwischen Räumen ziehen | nicht beschrieben | Undo 8 s |
| Raum umbenennen | nicht beschrieben, `raum` ist Text | **Warnung**: Positionen hängen am Text – Umbenennen im Client schreibt alle Positionen mit (Massen-`save`), Undo 8 s; bis stabile Raum-ID existiert |
| Unterschrift | nach Speichern unveränderbar | ok; falscher Name → Leitung „Unterschrift ungültig markieren“ mit Grund (Verlauf), neue Erfassung; Anfrage an ph_projekte |
| Zeiten abrechnen | Bestätigung | ok; Beleg als LinkFeld |
| Referenz Widerruf | Dialog rot | ok; Fokus auf Abbrechen |
| Projekt abbrechen (PA9) | Assistent | ok |
| Einstellungen (Haftungshinweis, Fußtexte) | ⌘S | Hinweis „Gilt für neue Fremdgewerke“ steht; zusätzlich „Vorherige Fassung wiederherstellen“ (Version aus `docinfo`) |

`pagehide`-Flush ausdrücklich übernehmen (P3); bei verzögertem Commit erscheint der Phasenpunkt bis zum Senden mit gestricheltem Ring (Tooltip „Wird in 6 s gespeichert“).

### 2.4 Fehlende Leerzustände (Muster 02 §7.1, Darstellung 03 §8.18; Du-Form)

| # | Ort | Fall | Text | Aktion |
|---|---|---|---|---|
| L1 | Rückmeldungen | noch nie | „Noch keine Rückmeldungen. Hier landen Pins, Sprachnotizen, Freigaben und Nachrichten aus dem Kundenportal.“ | „Rendering vorlegen“ (wenn Entwurf existiert) |
| L2 | Rückmeldungen | Filter | „Keine Sprachnotizen in deinen Projekten.“ | Filter zurücksetzen |
| L3 | Rückmeldungen | Vorschau ohne Auswahl | „Wähle links eine Rückmeldung.“ + Kürzel `j`/`k` | – |
| L4 | Montagen Kanban/Liste | noch nie / Filter | „Noch keine Montagen. Montagen entstehen aus einem Projekt in Lieferung.“ / „Keine Montagen mit Status ‚Unterwegs‘.“ | „Nicht eingeplante Projekte“ / Filter zurücksetzen |
| L5 | Kalender „Nicht eingeplant“ | alles erledigt | „Alle Projekte in Lieferung sind eingeplant.“ | – |
| L6 | Kalender ohne Teams | noch nie | „Noch keine Monteure eingeteilt. Teams entstehen beim Planen einer Montage.“ | „Montage planen“ |
| L7 | Montage-Akte Leistungen / Fotos / Mängel / Zeiten | leer | „Keine Leistungen – sie kommen aus bestellten Positionen.“ · „Noch keine Fotos.“ · „Keine Mängel.“ (Häkchen) · „Noch keine Zeiten.“ | „Leistung hinzufügen“ · „Fotos hochladen“ · – · „Zeit buchen“ |
| L8 | Abnahme Mängel | alles erledigt | „Keine offenen Mängel – du kannst abschließen.“ | Primär „Abschließen“ |
| L9 | Aufgaben | noch nie / Filter / alles erledigt | „Noch keine Aufgaben …“ / „Keine überfälligen Aufgaben.“ / „Alles erledigt – keine offenen Aufgaben.“ | Schnellanlage fokussieren / Filter zurücksetzen / – |
| L10 | Zeiten | noch nie / Filter / alles abgerechnet | „Noch keine Zeiten gebucht. Buche Zeit in jedem Projekt mit Shift+H.“ / „Keine Zeiten im Oktober.“ / „Alle abrechenbaren Zeiten sind abgerechnet.“ | – |
| L11 | Fremdgewerke | Filter / alles erledigt | „Keine Fremdgewerke mit Status ‚Angefragt‘.“ / „Alle Fremdgewerke erledigt.“ | Filter zurücksetzen |
| L12 | Produktpässe | noch nie / Filter | „Noch keine Produktpässe. Sie entstehen bei der Übergabe aus gelieferten Positionen.“ | „Zu Projekten in Übergabe“ |
| L13 | Produktpass Materialien / Pflege | leer | „Keine Materialangaben.“ / „Keine Pflegehinweise.“ | „Zeile hinzufügen“ |
| L14 | Referenzen | noch nie / alles geprüft | „Noch keine Referenzen eingereicht.“ / „Nichts zu prüfen.“ | – |
| L15 | Dokumente (übergreifend) | noch nie / Filter | „Noch keine Dokumente.“ / „Keine Dokumente der Kategorie ‚Plan‘.“ | Filter zurücksetzen |
| L16 | Planung Tab Versionen | nur v1 | „Erste Version – Vergleich ist ab Version 2 möglich.“ | „Neue Version“ |
| L17 | Rendering Varianten | eine Variante | Vergleichen-Knopf deaktiviert mit Tooltip „Vergleich braucht eine zweite Variante“ | „Variante hinzufügen“ |
| L18 | Kundensicht / Präsentation | Portal aus / keine Renderings | P16 / „Noch nichts zum Zeigen – lege ein Rendering oder eine Planung an.“ | – |
| L19 | Bereichsstart „Meine Projekte“ | neuer Mitarbeiter | „Dir ist noch kein Projekt zugeordnet.“ | „Alle Projekte“ |
| L20 | „Braucht Leitung“ | alles erledigt | „Nichts wartet auf dich.“ (Häkchen) | – |
| L21 | Montage mobil Woche / Unterlagen | leer | „Diese Woche keine Montagen.“ / „Keine Unterlagen zu diesem Stopp – Büro anrufen“ | Anruf-Knopf Büro (Nummer aus ph_core Firma) |
| L22 | Mängel-Liste (P12) | alles erledigt | „Keine offenen Mängel.“ | – |

### 2.5 Fehlende Fehlerfälle

- **Upload** (Tab Planung, Dateien, Tagebuch, Montage-Fotos Desktop): Dateityp nicht erlaubt („DWG geht nur als Planung, nicht als Rendering“), Datei zu groß (Grenze nennen, Quelle Frappe-Limit), Abbruch mitten im Upload (Zeile bleibt mit „Erneut“), mehrere Dateien gleichzeitig (Fortschritt je Datei, Ring 16 px), gleicher Dateiname vorhanden („Als neue Version von ‚Küchenplan v3‘ ablegen?“ Ja/Nein), `max_fotos_je_projekt` erreicht („120 Fotos sind die Grenze dieses Projekts – ältere archivieren oder Leitung fragen“).
- **Teilfehler in Ketten:** PA2 (`montageauftrag_anlegen` ok, `save` Team scheitert → Akte öffnet mit Band „Team nicht gespeichert – [Erneut speichern]“, nichts doppelt anlegen), PA3 (Rendering 2 von 3 vorgelegt), PA5/P4-Kette, PA9 (Montagen abgebrochen, Fremdgewerke nicht), mehrstufiges Zurücksetzen (P5). Muster: Ergebnis-Drawer „2 erledigt, 1 offen“ mit Einzelknopf je offenem Schritt.
- **Versand scheitert nach Undo-Fenster** (P7): Glocke + Zeitleiste rot.
- **Unterschrift online speichern scheitert:** Bild bleibt lokal (IndexedDB) und wird wie offline nachgereicht; Kunde muss nie zweimal unterschreiben.
- **Offline-Konflikte über „Abgebrochen“ hinaus:** Auftrag auf anderen Tag verschoben (Karte „Termin wurde auf Di verlegt – deine Fotos sind gespeichert“), Monteur aus Team entfernt (Daten werden übertragen, Auftrag verschwindet danach aus „Heute“ mit Hinweis), Leistung im Büro gelöscht (Haken verworfen, Hinweis).
- **Sprachnotiz nicht abspielbar** (Format vom Endgerät): „Format hier nicht abspielbar – [Herunterladen]“.
- **Kalender-Drop auf belegtes Teammitglied** (Doppelbuchung): Drop erlaubt, Block mit Warn-Rand + Text „J. Huber doppelt eingeplant (Bad Bregenz 07:30)“; Abwesenheit unbekannt als graue Zeile „Abwesenheiten nicht geprüft“.
- **Sitzung läuft während Abnahme mit Kunde ab:** Overlay `auth` (02 §7.2) behält Positionen und Signaturen; Kiosk-Idle (15 min) darf während einer offenen Abnahme nicht sperren, ohne Entwurf zu sichern.
- **Präsentationsmodus: Server weg** während Kunde pinnt: Pins lokal gepuffert, Band „Wird gespeichert, sobald die Verbindung zurück ist“, kein Fehlertext vor dem Kunden mit Technikbegriffen.

### 2.6 Barrierefreiheit (WCAG 2.2 AA)

| Kriterium | Befund | Änderung |
|---|---|---|
| 2.1.4 Zeichentasten-Kürzel | kein Abschalten | P10 |
| 2.5.7 Ziehbewegungen / 2.1.1 Tastatur | Kalender, Zeitplan, Räume, Dokumente, Pins, Regler | P8 |
| 1.3.4 Ausrichtung | Unterschrift „Vollbild quer“ | P17 |
| 1.4.11 Nicht-Text-Kontrast | Pins auf Bildern, Sand-Ring | P14 |
| 1.4.1 Farbe | Kalenderblöcke nur Farbe nach Status; Gantt-Konfliktpfeil nur rot; Zeilen „Frist orange“ | Block: 3 px Statusleiste links + Statuswort 12 px im Block (ab 44 px Breite, sonst Icon nach 03 §1.5); Konflikt: Icon `triangle-alert` + Text im Tooltip und in der Zeile |
| 1.4.3 Kontrast | Frist-Text „orange“ ohne Token | `warning-text` (nicht `warning`) verwenden; Sand nie als Textfarbe für Fließtext (#8a7a66 auf Weiß 4,15:1 < 4,5) – nur `accent-text` |
| 2.4.11 Fokus nicht verdeckt | Mappenkopf sticky 64 px + Tab-Leiste 40 px = 104 px > `scroll-margin` 96 px aus 02 §10 | `scroll-margin-top: 120px` in der Mappe; Massenaktionsleiste unten `scroll-margin-bottom: 72px` |
| 1.3.1 Struktur | Gantt, Kalender, Phasenleiste ohne Semantik | Gantt = `role="treegrid"` mit Zeile je Projekt, Zelle je Woche, Balken als Buttons mit `aria-label` „Montage 17.–18.11., Geplant“; Alternative „Als Liste“ (Termine chronologisch); Kalender = Raster mit `aria-label` je Block; Phasenleiste P5 |
| 4.1.3 Statusmeldungen | Upload-Fortschritt, Offline-Band, Zähler Inbox | Offline-Band `role="status"`; Upload nur Endmeldung live („3 Fotos hochgeladen“), nicht jeden Prozentschritt; Inbox-Zähler `aria-live="off"`, Ergebnis der Aktion live |
| 2.2.1 Zeitlimits | Aktionen nur im Toast (Kunde informieren, Status auf Vorgelegt?) | P7; Toast „Alle Rückmeldungen beantwortet – Status auf Vorgelegt?“ (§4.2) ersetzen durch automatische Rückkehr (Workflow „Beantwortet“ im Client nach letzter Antwort, mit Undo) |
| 1.2.1 Nur-Audio | Sprachnotizen ohne Text | optional Abschrift-Feld (Studio tippt Kurzfassung, erscheint im Faden); automatische Abschrift nur, wenn eine Quelle festgelegt ist – nicht im Konzept, keine Annahme |
| 2.5.8 Zielgröße | Pins 24 px, Phasen-Mini 6 px klickbar? | Pins P14; Phasen-Mini in Listen nicht klickbar (nur `title`), Zeile ist das Ziel |
| Signatur | Canvas ohne Alternative | Canvas `aria-label` „Unterschriftsfeld“, Name-Feld Pflicht; Kunde kann nicht zeichnen → Option „Bestätigung ohne Zeichnung“ mit Vermerk und Studio-Zeuge (rechtlich: Inhaber-Frage, §4) |

### 2.7 Mobile / iPad

- **Inbox am iPad:** ≥ 1024 Liste + Vorschau 480 px; 640–1023 Vorschau als Vollseite mit „‹ Rückmeldungen“; Wischen rechts = Erledigt (Beschriftung sichtbar, 02 §11.2), links = „Mehr“.
- **Kalender am iPad:** Drag erst nach 150 ms Halten (04 §3.4), sonst Scroll; Tippen auf Block = Popover „Umplanen“ (P8); Woche hat 5 Spalten à min. 160 px, Teamspalte 140 px → bei 1024 quer 940 px, passt; hoch: Tagesansicht als Standard.
- **Zeitplan:** Regel „kein Ziehen unter 1024 px“ auch für den Kalender übernehmen; beide nutzen dasselbe Popover.
- **Mappe am iPad hoch:** 6 Tabs passen (P1); rechte Spalte als Sheet (P2), Knopf „Aktivität“ mit Zähler im Kopf.
- **Rendering am iPad:** Pinch = Zoom im Bild (Seitenzoom gesperrt nur auf der Bildfläche via `touch-action: none` dort, sonst Browserzoom erlaubt – WCAG 1.4.4); Pin nur im Modus `Pin`.
- **Telefon im Backoffice (§7.3):** „nur lesen“ widerspricht B5/B3 unterwegs; erlauben: Kunden informieren (Sheet als Bottom-Sheet), Nachricht, Aufgabe, Termin-Chip. Ausnahme in 02 §11.1 eintragen (wie CRM-Kritik).
- **Montage mobil Startkarte:** ganze Karte = Öffnen; „Navi“ und „Anruf“ eigene 48-px-Knöpfe mit Abstand ≥ 8 px; Karte „NÄCHSTER“ als Kennzeichen (03 §8.9), nicht als Versalien-Text rechts.
- **Sonne/Handschuhe:** Leistungen-Checkzeile 56 px, Haken-Fläche ganze Zeile; Kamera-Knopf 64 px (02 §11.3) im Konzept „Kamera-Knopf“ ohne Maß – nachtragen.

### 2.8 Visuell / Modernität (Maßstab Linear, Stripe, Shopify Admin)

**W1 – Mappenkopf nach P1/P5 (1280 px):**
```
┌ Projekte › Küche Lochau ───────────────────────────────────────────────────────────────────────────────┐
│ Küche Lochau  [Küche] [● Lieferung]  ↑ Hoch            Kunde nicht informiert · Informieren…  [Montage planen ⌘↵] [⋯] │
│ (A) Fam. Muster ↗ · ⌖ Hauptstr. 1, Lochau · (AB)(MK)(TS) · Lieferung KW 47 ✎ · Montage – · Portal: Kunde sieht │
│ ●────●────●────●────●────◉────○────○────○   Anfrage … Abgeschlossen (Daten unter den Punkten, 12 px muted)      │
│ Empfohlen, weil: 9 Positionen geliefert, noch keine Montage                       [timer 0:00] [Aktivität 2]   │
├ Übersicht · Positionen · Planung · Belege & Lieferung · Montage · Dateien ─────────────────────────────────────┤
```
- Zeile 1: Titel `--text-bo-xl` 20/500, Art als Chip (03 §8.9), Phase als StatusBadge, Priorität nur Hoch/Niedrig als Icon `arrow-up` + Wort. Rechts: P7-Chip, Primärknopf (Tinte, 36 px), `⋯`.
- Zeile 2: Eigenschafts-Chips 28 px (Icon 16 + Text 13), Hover `surface-3`, Klick = Inline-Popover (Linear-Muster). Avatare 20 px mit Initialen, Tooltip Name + Rolle.
- Phasenleiste 40 px hoch (Punkte 10 px, Linie 2 px), Daten 12 px `muted`; kompakt beim Scrollen: Kopf 56 px = Titel + Phase-Badge + Primär.
- Gesamthöhe ≈ 152 px statt 168 + 2 Tab-Zeilen; Abstände 4-px-Raster (03 §3.1): Zeilenabstand 8, Kopf-Polster 16/24.

**W2 – Bereichsstart Mitarbeiter:**
```
┌ Projekte                                                         Nur meine ⟷ Alle     [+ Neues Projekt] ┐
│ HEUTE  08:00 Montage Küche Lochau (Team B) → · 3 Rückmeldungen seit > 3 Tagen → · Abnahme-Frist morgen →│
│ [Meine Rückm. 4 · 2 überf.] [Fällige Aufgaben 3] [Meine Montagen KW 46: 2] [Offene Mängel 1]            │
│ MEINE PROJEKTE                                         Phase           Empfohlen          Nächster Termin │
│ Küche Lochau · Fam. Muster       ●●●●●◉○○○ Lieferung   Montage planen →  KW 47                           │
│ Bad Bregenz · Hr. Beispiel       ●●●●●●◉○○ Montage     Abnahme mit Kunde → morgen                        │
└─────────────────────────────────────────────────────────────────────────────────────────── Alle meine (14) ┘
```
„Nur meine / Alle“ als Schalter (`role="switch"`), nicht als Radio „◉ ○“. Kennzahl-Karten nach 03 §8.14 (min-h 112, Wert 24/500 tabular).

**W4 – „Abnahme mit Kunde“ (Montage mobil 390 px, P4):**
```
┌ ‹ Küche Lochau          Abnahme 2/5 ┐   ┌ ‹ Küche Lochau          Abnahme 3/5 ┐
│ 9 Positionen                         │   │ Unterschrift Fam. Muster              │
│ ┌──────────────────────────────────┐ │   │ ┌──────────────────────────────────┐ │
│ │   ALLES IN ORDNUNG  (56 px)      │ │   │ │                                  │ │
│ └──────────────────────────────────┘ │   │ │   (Feld volle Breite, ≥ 240 px)  │ │
│ oder einzeln:                        │   │ └──────────────────────────────────┘ │
│ Hochschrank links   [ok][Mangel][Nach]│   │ Name [ Anna Muster            ]      │
│ Arbeitsplatte Eiche [ok][●Mangel][..] │   │ [Neu]                                │
│   „Kratzer 3 cm“ [Foto]  Frist +7      │   │                                      │
├──────────────────────────────────────┤   ├──────────────────────────────────────┤
│ [            WEITER            ]     │   │ [            WEITER            ]     │
└──────────────────────────────────────┘   └──────────────────────────────────────┘
```
Schrittleiste oben als Text „2/5“ + 4-px-Balken; Schrittwechsel `translateX 24 px` + Opacity 200 ms `--bo-ease-out`, zurück 160 ms `--bo-ease-in`; reduzierte Bewegung: sofort. Schritt ④ Studio-Unterschrift vorbelegt mit gespeicherter Monteur-Signatur (ein Tipp „Als T. Steiner unterschreiben“), ⑤ Zusammenfassung „1 Mangel, Frist 01.12. – Protokoll ‚Mit Mängeln‘“ + Primär „Abschließen“, danach Häkchen 400 ms (`--bo-dur-draw`).

**Komponenten-Vorgaben:**
- **Kalenderblock:** Höhe 32 (kompakt) / 44 (iPad), Radius 6, Fläche `*-soft`, links 3 px Statusleiste, Text 12/500 Titel + 12 `muted` Zeit; Mehrpersonen-Auftrag als **ein** Block über alle Teamzeilen mit Avataren statt Kopie je Zeile (vermeidet „gleicher Auftrag, Team“-Zeilen und Fehlgriffe beim Teamtausch). Kapazitätsband: Balken 6 px je Tag, Tooltip „16 h = 2 Monteure × 8 h (Einstellung)“.
- **Gantt:** Balken 12 px, Radius 3; Phasen vergangen `neutral-soft`, Montage `ink`, Fremdgewerk gestrichelt `line-strong` 1,5 px, Liefertermin Raute 10 px `accent`, Abnahme Raute hohl; Heute-Linie 1 px `accent`; Abhängigkeit 1 px `line-strong` mit Pfeilspitze 6 px; Konflikt `danger` + Icon.
- **Rendering-Ansicht:** Bildfläche `surface-2` (dunkel: `surface-inverse`), Werkzeugleiste schwebend unten Mitte 40 px (Ansehen/Pin · Zoom − 100 % + · Vergleichen · Vollbild), Faden rechts 400 px; Varianten als Segment mit Miniatur 40×28.
- **Inbox:** Zeile 48 px, ungelesen = Punkt 6 px `accent` + Titel 500, gelesen 400; Quellen-Icon (`map-pin` Pin, `mic` Sprachnotiz, `check-check` Freigabe, `message-square` Nachricht) mit Text in Chip; Alter rechts tabular.
- **Dunkelmodus:** im Konzept nicht erwähnt – Kalender, Gantt, Pins und Signaturfeld (Strich immer dunkel auf hellem Feld, auch im Dunkelmodus) ausdrücklich nach 03 §1.4 prüfen.
- **Bewegung:** Phasenleiste 400 ms ist 04-Ausnahme `--bo-dur-draw` (ok); Inbox-Zeile raus 160 ms `--bo-ease-in` widerspricht 04 (Austritt 120 ms `--bo-dur-fast`) – angleichen; Toast-Kette bei Massen-Erledigt: ein Sammel-Toast „5 erledigt · Rückgängig“, nicht fünf.

### 2.9 Microcopy (Glossar, verbindlich für den Bereich)

| Statt | Immer | Grund |
|---|---|---|
| Feedback, Kundenfeedback, Feedbacks | **Rückmeldung** | ein Wort (Kennzahl „PH Offene Feedbacks“ nur intern) |
| Status senden | **Kunden informieren** | Ergebnis statt Technik |
| Tab „Mappe“ | **Übersicht** | Seite heißt schon Mappe |
| Nächster Schritt / Nächste Schritte | **Empfohlen** | wie CRM-Kritik P2 |
| Erledigt melden / Fertig melden | **Fertig** (Kiosk), „Als fertig melden“ (Desktop-Menü) | P17 |
| Abnehmen, Abnahme anlegen/durchführen, Abnahmeprotokoll anlegen | **Abnahme mit Kunde** | P4 |
| Kunde vorgelegt / Vorgelegt | **Vorgelegt** (Planung und Rendering) | gleiche Sache, gleiches Wort |
| Summen aktualisieren | **Zahlungsstand aktualisieren** | sagt, was sich ändert |
| Portal ● sichtbar | **Kunde sieht** / **Intern** | Text statt Punkt |
| „Ziehen Sie …“, „Übernehmen Sie …“ | „Zieh …“, „Übernimm …“ | 02 §14 Du-Form intern |
| „Elektriker endet 19.11., Montage beginnt 17.11.“ | „Elektro endet 19.11., Montage beginnt 17.11. – Montage verschieben oder Elektro vorziehen“ | Fehler = Zustand + nächster Schritt |
| „Kennzahl gerade nicht abrufbar – erneut versuchen“ | „Nicht geladen · Erneut“ | 03 §8.14 |

Kundentexte (Portal-Nachrichten, Drucke) bleiben Sie-Form.

### 2.10 Unklar oder widersprüchlich im Dokument selbst

1. M3 „Kunde erst nach Ablauf informiert“ vs. §2.7 „nicht automatisch, Toast bietet an“ vs. §3.1 „Toast → Ja“ (P7).
2. B6 „`.` Aufgabe“ vs. §3.8 `a`.
3. P4 `Enter` senden vs. §2.6/§2.5 `⌘Enter`; Rendering-Kopf „[Antworten ⏎]“ und Fuß „[Senden ⏎]“ – zwei Knöpfe, ein Ziel.
4. Rückmeldungen-Zähler 5 / 7 / 10 (P11); Liste „25 von 23“ (§2.2 Wireframe).
5. Hochzählen 400 ms beim ersten Laden (§2.1) vs. 04 §3.7 und QA 37.
6. 8 Phasen + Endzustand vs. 02 §3.1/05 §5.2 mit 9 Punkten (P5).
7. `/projekte` = T1 (Konzept) vs. T2/T3 (05 §3.4) – Abweichung begründen und 05 nachziehen; `/projekte/dokumente` fehlt in der Pill-Liste.
8. Mappe-Tabs weichen von 05 §5.2 ab (dort Service, Team & Termine; hier Zeitplan, Tagebuch) – Service-Fälle haben im Konzept keinen Platz außer Bezügen; P1 legt sie unter `Montage` → Abschnitt „Service“.
9. Regeln §3.4 vs. 02 §3.2: Übergabe (02: Schlussrechnung stellen, automatischer Abschluss nach 7 Tagen; hier Produktpässe, PA8 manuell); Planung (02: „Kunde nachfassen (Mail)“; hier „Rückmeldungen beantworten“). Eine Tabelle, in 02 als Quelle.
10. Stoppuhr „Zustand `localStorage` je Projekt“: mehrere Uhren gleichzeitig möglich, Zustand geht bei Gerätewechsel verloren. Eine Uhr je Benutzer, Start einer zweiten stoppt die erste mit Toast „Uhr Küche Lochau gestoppt (0:42) · Buchen“; Zustand serverseitig (Entwurf PH Projektzeit mit `start`, ohne `ende`) statt Browser-Speicher.
11. Zeit-Eingabe „1,5“ / „90“ / „1:30“: „2“ ist mehrdeutig (Stunden oder Minuten). Regel: Zahl ≤ 12 ohne Einheit = Stunden, > 12 = Minuten, `h`/`min` erlaubt; Interpretation live unter dem Feld („= 1 h 30 min“).
12. Schnellanlage „Titel @Person #Projekt !hoch morgen“: für Nicht-IT-Mitarbeiter unsichtbar; Token beim Tippen als Chips einfärben, `@`/`#` öffnen Vorschlags-Popover, darunter normale Felder als Rückfall; „Mo“ = nächster Montag (Tooltip mit Datum).
13. Fremdgewerk-Akte als Drawer ohne eigene URL – Deep-Link `?gewerk=PH-GEW-…` ergänzen (Glocke, Zeitplan-Klick).
14. Montage-Akte Desktop: Primär „Losfahren“ im Büro sinnlos; Desktop-Primär je Status: Geplant → „Unterlagen prüfen“ (Checkliste aus `montage_erinnerung`), Unterwegs/In Arbeit → keine Primäraktion (Status-Knöpfe ins `⋯` „Status korrigieren“), Erledigt → „Abnahme mit Kunde“. Tab „Unterschrift“ entfällt (Teil der Abnahme), Tabs: Übersicht · Leistungen · Fotos · Mängel · Bericht · Verlauf.
15. Kapazität „Monteurzahl = eingeteilte Benutzer der Woche“: wer mehr Leute einteilt, erhöht die Kapazität – Überlast wird nie sichtbar. Kapazität aus fester Einstellung „Monteure verfügbar“ (fehlt in PH Projekte Einstellungen) oder Report-Filter; im Tooltip offenlegen.

---

## 3. Was gut ist und so bleiben soll

- Leitidee „Die Mappe ist der Arbeitsplatz“ mit vorbefülltem Projekt/Kontakt in jedem Anlegen-Weg (WCAG 3.3.7).
- Workflow-Knöpfe ausschließlich aus `getTransitions`, nie eigene Liste (§4) – verhindert Knöpfe, die der Server ablehnt.
- Nicht erlaubte Kanban-Spalten grau mit Grund im Tooltip (§2.2).
- Freigabe-Banner „Fam. Muster hat diese Variante am 03.11. freigegeben“ mit einem Knopf (§2.5).
- Inbox-Sortierung „älteste offene zuerst“ mit Frist-Text – fachlich richtig, weil der Kunde am längsten wartet.
- Referenz-Prüfseite: Prüfliste = Server-Regeln, Verstöße wörtlich (§2.15).
- Abnahme: „Abschließen“ deaktiviert mit Grund „1 Mangel offen“ (§2.9).
- Fremd-App fehlt → ehrlicher Leerzustand ohne Knopf (§3.2 Tab 4).
- Offline-Band mit Zähler, Client-UUID, Konfliktkarte mit Anruf-Knopf (§7.1).
- Automationen standardmäßig aus, einzeln freizugeben (§8.2).

---

## 4. Widersprüche in den Leitlinien, die Projekte erbt (an Fundament/UX-Lead)

| Thema | 02 | 03 | 04 | 05 | Projekte nutzt | Vorschlag |
|---|---|---|---|---|---|---|
| Hochzählen Kennzahlen | verboten (§13) | – | erlaubt nach Änderung, nie beim Erstaufbau | – | beim Erstaufbau | 04 gilt; 02 §13 anpassen |
| Kanban-Ablage | 180 ms | 240 ms Rückkehr | 320 ms Spring, Rückkehr 200 ms | – | 320 / 200 ms | 04 gilt; 02/03 verweisen |
| Unterschrift Ausrichtung | „Querformat erzwingen“ (§11.3) | – | – | – | Vollbild quer | WCAG 1.3.4: Empfehlung statt Zwang, 02 §11.3 ändern |
| Einzeltasten abschaltbar | fehlt in §10 | fehlt in §11 | – | – | – | WCAG 2.1.4 in 02 §10 aufnehmen (P10) |
| Tab-Kürzel | `Alt+1…9` | – | – | `1–9` (T5) | `1–9` | `Alt+1…9`, 05 T5 ändern |
| Phasenpunkte | 9 inkl. Abgeschlossen | – | – | 9 („Fertig“) | 8 + Endzustand | 9, Wort „Abgeschlossen“ (nicht „Fertig“, kollidiert mit Kiosk „Fertig“) |
| Klick auf Phasenpunkt | öffnet Objekt | – | – | Hover Datum + Auslöser | Zurücksetzen | 02 gilt (P5) |
| Telefon im Backoffice | nur lesen | – | – | – | nur lesen + Nachrichten | Ausnahme Berater: Kunden informieren, Nachricht, Aufgabe |
| Abnahme-Unterschrift Rechtsform | – | – | – | – | Canvas | Inhaber: Bestätigung ohne Zeichnung zulässig? (2.6 Signatur) |
| Undo-Technik | sofort + Gegenaktion | – | Variante A verzögert | – | B (scheitert an Rechten) | A als Standard für Workflow-Vorwärts (P3), 02 §6.1 ergänzen |

---

## 5. Abnahme-Ergänzungen für §10 (nach Umsetzung der Pflichtänderungen)

| # | Kriterium | Prüfung |
|---|---|---|
| Q41 | Mappe hat genau 6 Tabs, Kopf ≤ 2 Zeilen + Phasenleiste + Empfohlen-Zeile, Gesamthöhe ≤ 160 px bei 1280 px; keine Information steht in Tab und rechter Spalte zugleich | Visueller Test 1024/1280/1440, DOM-Prüfung |
| Q42 | Composer steht nach jedem Senden auf „Intern“; „An Kunde“ zeigt Sand-Rahmen und Empfängerzeile; kein Tastenkürzel schaltet den Modus | E2E |
| Q43 | Mitarbeiter schaltet Phase vor und macht innerhalb 8 s rückgängig: kein Serveraufruf an `apply_workflow` (Netz-Mitschnitt); Tab schließen im Fenster führt genau einen Aufruf aus | E2E Mock + Staging |
| Q44 | Abnahme mit Kunde: Kunde unterschreibt genau einmal; Montageauftrag „Abgenommen“ und Abnahme „Unterzeichnet“/„Mit Mängeln“ danach gesetzt; „Alles in Ordnung“ setzt alle Positionen `ok`; ≤ 4 Tipps ohne Mängel | E2E Kiosk 390 px + iPad |
| Q45 | Klick auf vergangenen Phasenpunkt öffnet Info-Popover mit Objekten; Zurücksetzen nur über Dialog (Leitung), Mitarbeiter sehen den Textknopf nicht | E2E je Rolle |
| Q46 | Montageauftrag „In Arbeit“ (Seed) schiebt das Projekt auf „Montage“ bzw. zeigt das Band „Phase anpassen“ | E2E |
| Q47 | Termin-/Montageänderung erzeugt nie eine Kundennachricht ohne Sheet-Vorschau; Chip „Kunde nicht informiert“ bleibt bis Senden oder „Nicht nötig“ | E2E Mappe, Kalender, Zeitplan |
| Q48 | Jeder Kalender- und Gantt-Block ist per Tastatur fokussierbar; `Enter` öffnet „Umplanen“, `Shift+←/→` verschiebt um 1 Tag mit Undo; Studio-Pin per Tastatur setzbar | E2E nur Tastatur |
| Q49 | Kanban-Drop auf „Abgebrochen“ öffnet PA9, auf „Abgeschlossen“ PA8; Abbrechen lässt die Karte unverändert | E2E |
| Q50 | Kürzel-Registry: keine Doppelbelegung je Seitentyp, kein Bereichskürzel überschreibt 02 §9.1; Schalter „Einzeltasten-Kürzel aus“ deaktiviert alle Einzelbuchstaben | Unit + E2E |
| Q51 | Rückmeldungen-Zahl identisch in Pill, Kennzahl, Inbox-Kopf und Glocke (Seed mit gemischten Quellen) | Unit Formel + Snapshot |
| Q52 | `/projekte` zeigt je Rolle 4 Kennzahlen, keine Charts; keine Kennzahl zählt beim Erstaufbau hoch | Snapshot je Rolle |
| Q53 | PA2 bei Standardwerten: Datum wählen + „Montage anlegen“ = 2 Interaktionen im Sheet; Teilfehler zeigt Band ohne Doppelanlage | E2E mit Fehlerinjektion |
| Q54 | Pins: Kontrast ≥ 3:1 gegen helles und dunkles Seed-Bild; Trefferfläche ≥ 44 px im Präsentationsmodus; Fokus-Reihenfolge = Faden | axe + visueller Test |
| Q55 | Präsentationsmodus: keine Toasts/Glocke/Stoppuhr anderer Projekte sichtbar; Beenden per PIN, per Esc-Halten und per Wortmarke-Halten möglich | E2E iPad |
| Q56 | Ohne `portal_project_vorschau` gibt es keinen Kundensicht-Schalter; „Kunde sieht“/„Intern“ steht als Text an jedem Element | E2E Mock `apps` |
| Q57 | Kiosk-Wortliste: nur „Losfahren“, „Beginnen“, „Fertig“, „Abnahme mit Kunde“; eine Arbeitszeit-Uhr; Unterschrift im Hochformat möglich | Snapshot + manuell iPhone |
| Q58 | Alle 22 Leerzustände aus §2.4 vorhanden, Du-Form, kein Emoji in der Oberfläche | Snapshot + Lint |
| Q59 | Upload-Fehlerfälle (Typ, Größe, Abbruch, Duplikat, Fotogrenze) zeigen Text am Ort des Uploads, kein Toast als einzige Meldung | E2E Mock |
| Q60 | Sticky-Kopf verdeckt nie das fokussierte Element (Tab-Durchlauf durch Tab „Positionen“ mit 40 Zeilen) | E2E Tastatur + Screenshot |
| Q61 | Klickzahlen §2.1 Spalte „Nach Pflichtänderungen“ erreicht; Suche-Wege getrennt | E2E zählt |

---

*Ende 20 – UX-Kritik Projekte. Bezüge: 02 (§3, §4, §6, §9–§11, §14), 03 (§1.5, §8.8–§8.14), 04 (§3.4, §3.6, §3.7), 05 (§2, §3.4, §3.14, §5.2), 20-kritik-ux-crm (Kürzel-, Undo- und Tab-Regeln gleich gelöst).*
