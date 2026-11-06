# 20 – UX-/UI-Kritik Bereich „Zentrale & Querschnitt“ (zu `10-konzept-zentrale.md`)

**Zweck:** Strenge Prüfung des Zentrale-Konzepts gegen Nielsen-Heuristiken, WCAG 2.2 AA, Mobile-/iPad-/Kiosk-Regeln und die Leitlinien 01–05. Weil die Zentrale die Querschnittsbausteine besitzt (Palette, Kürzel-Registry, Toast/Undo, Glocke, Hilfe, Benutzer-Menü, Druckvorschau), wiegt jede Unklarheit hier zwölffach: Jeder Fachbereich erbt sie. Ergebnis: Note, Pflichtänderungen vor Umsetzung, korrigierte Wireframes, ein bereinigtes Kürzel-Register, Widersprüche in den Leitlinien mit Entscheidungsvorschlag, Abnahme-Ergänzungen.
**Stand:** 2026-11-04 · Rolle: UX-/UI-Kritiker · Geprüft: `10-konzept-zentrale.md` (918 Zeilen, vollständig), `02-ux-leitlinien.md` (§0, §2, §5–§11, §13–§16), `03-design-system.md` (§0, §1.3, §8.11–§8.14, §9), `04-motion.md` (§1, §2, §3.5–§3.7, §3.14), `05-informationsarchitektur.md` (T1, §7.4), zum Abgleich `20-kritik-ux-service.md`, `20-kritik-ux-personal.md`.
**Status:** Prüfbericht, keine Entscheidung des Inhabers.

---

## 0. Urteil

**Note: 6,5 / 10.**

Stark: vollständige Aktionsmatrix mit Undo-/Rückfrage-Klasse je Aktion (§5.1); Datenmapping mit ehrlich markierten Lücken (§9); Palette mit Nummern-Normalisierung (`re 40` → `RE-2026-00040`) und Fehlerverhalten, bei dem lokale Gruppen nutzbar bleiben (§3.3); jede Dashboard-Kachel als eigener Suspense mit Teilfehler (§3.2); Rollenvarianten ohne Konfigurationsseite; Steuerberater-Sicht mit drei Kacheln; Token nur einmal sichtbar, QR fürs iPad; drei unterscheidbare Leerzustände der Aufgabenliste; Kürzel-Registry als eine Quelle für Tooltip, Palette und Overlay (§3.13).

Schwach: **die Zentrale ist zu voll und redundant** (Heute-Leiste, Kennzahlen, Aufgabenliste und Glocke zeigen dieselben Zahlen bis zu dreimal; „Was ist heute dran? – 0 Klicks“ liegt am iPad unter dem Falz), **die Primäraktion wandert** (häufigste Schnellaktion, gelernt), **Tastenkürzel kollidieren mit 02/03/04 und untereinander** (`Z`/`⌘Z`, `/`, `#`, `N`, `E`, `R` in der Palette, `F8`/`F9`/`Strg+L` im Kiosk), **Einzeltasten sind nicht abschaltbar** (WCAG 2.1.4), **Enter in der Palette hat eine Wettlaufsituation** (öffnet „Neue Aufgabe ‚huber‘“, bevor die Datensätze da sind), **Schnellanlage entfernt Datumsangaben aus dem Titel**, **zwei Speichermodelle auf derselben Seite** (Einstellungen, Benutzerakte), **die Kern-Zusage „Aufgabe aus jedem Datensatz“ ist für die halbe Belegschaft nicht erfüllbar** (Rechte `PH Aufgabe`), **Klickzahlen in §1 stimmen in 9 von 25 Zeilen nicht**, **Mobil-Erledigen nur per Wischen** (WCAG 2.5.1), **Leerzustände fehlen an 12 Stellen** (u. a. Geräteliste beim Ersteinrichten, Firma), **„Alle gelesen“ und Massen-„Gelesen“ ohne Undo**, und im Spezifikationstext stehen **Selbstgespräche** („? nein –“).

---

## 1. Pflichtänderungen (vor Umsetzung, nach Wirkung sortiert)

| Nr. | Befund | Verstoß gegen | Änderung (konkret) |
|---|---|---|---|
| P1 | **Zentrale überladen und redundant.** Erster Bildschirm: Kopfzeile 56 + Testband 32 + Seitenkopf ~72 + Heute-Leiste 40 + 6 Kennzahl-Karten 112 (iPad quer: 2 Reihen à 3 = 240) → „Meine Aufgaben“ beginnt am iPad quer (820 px Höhe) erst unter ~500 px, am iPad hoch unter dem Falz. Dieselbe Information erscheint mehrfach: „1 Aufgabe überfällig“ (Heute-Chip) + „Offene Aufgaben · n überfällig“ (Kennzahl) + Aufgabenliste; „Termine heute“ als Chip **und** Kennzahl; „Freigabe 1“ als Chip **und** Freigaben-Kachel **und** Glocke. Mitarbeiter bekommen laut Rollentabelle bis 6 Kennzahlen **und** ein Chart. | 02 §0.2, Nielsen 8 (ästhetisch-minimalistisch), 05 T1, Zielklickzahl §1.1 Zeile 1 | **Regel „eine Zahl, ein Ort“:** Was in der Heute-Leiste steht, erscheint nicht als Kennzahl. Heute-Leiste = Handlungen (überfällig, heute, Freigaben); Kennzahlen = Bestände/Trends (offene Posten, Umsatz, Anfragen-Bestand). Kennzahl „Offene Aufgaben (mir)“ und „Termine heute“ streichen (stehen in Heute + Liste). **Reihenfolge für Mitarbeiter:** Seitenkopf → Heute-Leiste → Aufgaben (links 2/3) + Zuletzt (rechts 1/3) → Kennzahlen-Streifen (max. 4) → Aktivität (eingeklappt). **Leitung/GF:** Seitenkopf → Heute → Kennzahlen-Streifen → Freigaben + Aufgaben → Charts. Kennzahlen als **ein Streifen mit Haarlinien-Trennern** (Höhe 88, keine 6 Einzelkarten mit Rahmen, 03 §0 „Haarlinien statt Schatten“). Charts nur Leitung/GF/Admin. Wireframe §5.1. |
| P2 | **Primäraktion im Seitenkopf wandert** („häufigste eigene Schnellaktion nach Nutzung“, §3.2). Derselbe Knopf an derselben Stelle tut nach drei Tagen etwas anderes; daneben „+ Neu ▾“, in der Aufgabenkachel ein zweites „+ Neu“ und eine Inline-Titelzeile – vier Anlege-Wege in einem Sichtbereich. | 02 §0.2 (genau eine Primäraktion), Nielsen 4 (Konsistenz), WCAG 3.2.4 (konsistente Identifikation) | Primär **fest je Rolle** aus `SCHNELLAKTIONEN` (Verkauf: „Neue Anfrage“, Faktura: „Neue Rechnung“, GF/Admin/übrige: „Neue Aufgabe“), Tinte-Knopf rechts im Seitenkopf, Tooltip mit Kürzel. „+ Neu ▾“ wird ein **Sekundärknopf** mit Menü (alle erlaubten Schnellaktionen, Kürzel rechts). In der Aufgabenkachel nur die Inline-Titelzeile („Aufgabe hinzufügen … ↵“, Platzhalter `muted`), kein zweites „+ Neu“. Lernen bleibt **nur** in der Palette-Gruppe „Vorschläge“ (02 §15.1). |
| P3 | **Tastenkürzel kollidieren** (vollständige Liste, Lösung als Register in §3): (a) Undo: 02 §6.1/§9.1 `⌘Z/Strg+Z`, 04 §3.6 und 10 §2.3 `Z`; (b) `/`: 02 §9.1 Fokus Listenfilter, 10 Palette; (c) `#`: 02 §2.2 Status-Filter, 03 §8.13 Nummer direkt, 10 Objektart – drei Bedeutungen; (d) `N`: 02 §9.1 „Neu (Hauptobjekt)“ sofort, 10 Sequenz `N A` → `N` müsste 1,5 s warten (P7-Verstoß 04: Rückmeldung ≤ 100 ms); (e) `E`: 02 §9.1 Bearbeiten, 10 Aufgabenliste Erledigt; (f) `R`: Zentrale neu laden, Glocke gelesen, **Palette „Erneut (R)“ im Eingabefeld** – tippt dort „r“; (g) `F8` global Toast-Fokus vs. Kassa `F8` Storno Position (02 §9.5); (h) Kiosk „Erneut (F9)“ (§8.3) vs. Kassa `F9` Belege; (i) Kiosk-Wechsel `Strg+L` = Adressleiste im Browser; (j) `.`-Menü in Akten ist nirgends registriert; (k) `?` öffnet laut §1.1 den Artikel, laut §2.3/§3.13 den Reiter „Kürzel“. | 02 §9, 03 §8.13, 04 §3.6, Nielsen 4, WCAG 2.1.4 | Register §3 übernehmen; `kuerzel.js` erhält einen **Unit-Test „keine Doppelbelegung je Kontext“** (Kontext = global, liste, kanban, akte, palette, glocke, kiosk-kassa, kiosk-packtisch). Kurz: (a) `⌘Z/Strg+Z` **und** `Z` (beide, außerhalb Feldern); (b) `/` = Suche des Kontexts (Liste: Filterfeld; sonst Palette); (c) `#` = Objektart-Filter in der Palette (10 gewinnt), 02 §2.2 und 03 §8.13 anpassen; (d) `N` öffnet **sofort** das Neu-Menü mit Buchstaben-Hinweisen (A Aufgabe, …), zweiter Buchstabe wählt → kein Warten; (e) Erledigen = `⌘Enter` auf fokussierter Aufgabe (Primär der Zeile), `E` bleibt Bearbeiten; (f) Palette-Fehlerzeile „Erneut“ = `⌘R`-frei: **`Enter` auf der Fehlerzeile**; (g) `F8` nur Backoffice-Shell, im Kiosk nicht; (h) Kiosk-Druck erneut = Knopf im Band, kein F-Kürzel; (i) `Strg+L` streichen, Wechsel = `F12` + Kopfzeilen-Knopf; (j) `.` streichen, Aktionen der Akte über `⋯`-Knopf und Palette `>`; (k) `?` öffnet Hilfe-Panel auf Reiter **Artikel**; `Shift+?` = Reiter Kürzel ist unmöglich (gleiche Taste) → **Kürzel-Overlay eigenes Kürzel `⌘/` bzw. `Strg+/`** (wie Linear/Notion/Slack). |
| P4 | **Einzeltasten-Kürzel nicht abschaltbar.** Die Zentrale definiert über 25 Einzelbuchstaben/Ziffern (`Z`, `R`, `X`, `A`, `D`, `S`, `C`, `M`, `F`, `1–6`, `G …`, `N …`). Spracheingabe (Dragon, Windows-Sprachsteuerung) löst sie aus. | WCAG 2.2 **2.1.4 Character Key Shortcuts** (A) | Benutzer-Menü und Profil-Reiter „Einstellungen“: Schalter **„Einzeltasten-Kürzel“** (Standard an), aus → nur Kürzel mit `⌘/Strg`, `F`-Tasten und `Esc` wirken; Tooltips zeigen dann keine Einzeltasten. Gilt für das ganze Backoffice; Speicherung wie Dichte (Profil, bis dahin localStorage je Benutzer). Abnahme Z-36 (§6). |
| P5 | **Enter-Wettlauf in der Palette.** „Erste Gruppe (lokal) erscheint sofort, Datensätze ergänzen sich darunter“ + „erste Zeile vorausgewählt“. Bei schneller Eingabe `huber` + Enter (< 150 ms Debounce + Serverzeit) ist die erste Zeile eine lokale Aktion („+ Neue Aufgabe ‚huber‘“) → Enter legt statt zu öffnen eine Aufgabe an. Tabelle §3.3 sagt für Freitext außerdem „Datensätze · Aktionen“ (Datensätze zuerst) – widerspricht „lokale Gruppe sofort oben“. | Nielsen 5 (Fehlervermeidung), 02 §2.2, Zielklickzahl „1 K“ | Bei Freitext ≥ 2 Zeichen: Gruppe **Datensätze steht immer oben** (Platzhalter-Skeleton 3 Zeilen ab 300 ms, vorher leerer Platz in Zielhöhe 3 × 40 px, kein Sprung). Vorauswahl liegt auf **Datensatz 1, sobald er da ist**; Enter **vor** Eintreffen der Antwort wird gepuffert (max. 600 ms) und dann auf Datensatz 1 angewandt; kommt nichts, öffnet Enter `/suche?q=`. Aktionen mit Freitext („Neue Aufgabe ‚huber‘“) **nie** vorausgewählt. Nummern-Treffer „Direkt öffnen“ bleibt Zeile 1. Abnahme Z-37. |
| P6 | **Schnellanlage zerstört Titel.** „`+3` / `mo` / `12.11.` setzen Fällig – Text wird bereinigt“ (§3.7): „Lieferung 12.11. bestätigen“ → Titel „Lieferung bestätigen“, Fällig 12.11.; „Termin mit Monika mo“ → unklar; `@` in E-Mail-Adresse im Titel öffnet Combobox. | Nielsen 5, Nielsen 3 (Kontrolle), 02 §0.4 | Erkennung nur für **Token am Titelende** (`… +3`, `… @lena`, `… mo`) oder mit Präfix-Leerzeichen davor **und** nach Leerzeichen dahinter; `@` nur am Wortanfang. Erkannter Token wird **Chip unter dem Feld** („Fällig: Mo 9.11. ×“), Titeltext bleibt sichtbar grau durchgestrichen bis Enter; `Backspace` direkt nach dem Erkennen oder `×` am Chip stellt den Text wieder her. Platzhalter im Titelfeld: „Was ist zu tun? · @Name · +3 Tage“. Datumsangaben mitten im Satz bleiben Text. |
| P7 | **Kern-Zusage für die halbe Belegschaft unerfüllbar.** `PH Aufgabe` hat Rechte nur für System Manager, Admin, GF, CRM Leitung, CRM Mitarbeiter (§9). Logistik, Service, Montage, Faktura, Shop, Kassa sehen den Knopf „Aufgabe“ laut §3.7 und bekommen erst nach dem Tippen `forbidden`. „Leitung bitten“ (02 §7.2, §10.2) legt eine `PH Aufgabe` an – genau das, was fehlt (Kreisschluss, im Konzept selbst bemerkt). §1.1 nennt Zielwerte für „alle Mitarbeiter“. | Nielsen 1, Nielsen 5, 02 §8 (Blocker erklären), 02 §7.2 | Bis ph_crm die Rechte liefert: Knopf „Aufgabe“, `N A`, Kachel-Inline-Zeile und Palette-Aktion **erscheinen nicht** ohne `create` (`darfDoc`). Zentrale zeigt solchen Rollen statt „Meine Aufgaben“ die Glocke-Inhalte „Für mich“ als Liste. „Leitung bitten“ ohne Aufgabenrecht = Popover mit Name + Telefon/E-Mail der ersten Leitung des Bereichs (aus `Has Role` + `User.phone`) und „Link zu dieser Seite kopieren“ – keine Schein-Aktion. §1.1 Tabelle: Spalte „gilt ab“ ergänzen („nach Anfrage ph_crm Rechte“). Anfrage §13 an ph_crm auf **Priorität 1**. |
| P8 | **Zwei Speichermodelle auf einer Seite.** Einstellungen: Autosave aus + Speicherleiste – aber Testmodus/`api_aktiv` „Band erscheint sofort“ nach Rückfrage (sofort gespeichert?). Benutzerakte: Kopf „Speichern ⌘S“ – aber Rollen-Chips speichern sofort mit Undo, Profil-Select mit Vorschau-Dialog, PIN per Dialog. Benutzer weiß nicht, was schon gespeichert ist. | Nielsen 1 (Systemstatus), Nielsen 4, 02 §4.1 | **Einstellungen:** Schalter mit Außenwirkung (`testmodus`, `api_aktiv`) sind **eigene Aktionen** (Rückfrage → sofort gespeichert → Toast „Testmodus eingeschaltet“), stehen in einer abgesetzten Karte „Schalter mit Wirkung“ oben im Reiter und sind **nicht** Teil der Speicherleiste; alle übrigen Felder über Speicherleiste. **Benutzerakte:** kein Speichern-Knopf im Kopf. Rollen/Profil/Standort/Kurzname = sofort mit Undo (Kurzname/Standort beim Verlassen des Felds, Häkchen 600 ms, Undo-Toast); PIN = Dialog. Damit gibt es in der Akte nur ein Modell: „Änderung wirkt sofort, Rückgängig 8 s“. |
| P9 | **Klickzahlen §1 stimmen nicht** (Zählregel aus §1 selbst; Enter = Klick; Navigation zur Unterseite zählt): Eigene PIN **3** → Avatar · Mein Profil · Reiter Bediener · PIN neu setzen · Speichern = **5**; Freigabe erteilen **1** → Glocke · Freigeben · (geldwirksam) Bestätigen = **3**; Rolle ergänzen **2** → Seitenleiste Benutzer · Person · Reiter Rollen · + Rolle · Rolle wählen = **5**; Testmodus **2** → Einstellungen · Allgemein · Schalter · Bestätigen = **4**; Betriebsruhe **3** → Einstellungen · Kalender · + Tag · Datum (Picker ≥ 2) · Speichern = **≥ 6**; Neue Mitarbeiterin **3** → Assistent Z2 hat 4 Schritte = **≥ 6**; Gerät sperren **2** → Geräte · `…` · Sperren · Sperren = **4**; Bediener-PIN fremd **3** → Benutzer · Person · Reiter · PIN setzen · Speichern = **5**; Arbeitsplatz wechseln **2** → Avatar · „Arbeitsplatz wechseln“ · Kachel = **3** (Menü zeigt laut §3.15 nur eine „Kachel-Vorschau 5 Icons“ – ob anklickbar, offen). | 02 §0.3, 02 §16 (E2E misst Wege), Nielsen 7 | Tabelle neu zählen und Wege kürzen, wo es billig ist: Freigabe aus Glocke ohne Dialog für **nicht** geldwirksame (Urlaub) → 2; geldwirksam bleibt 3 (ehrlich eintragen). Benutzerakte ohne Reiter für Rollen/PIN (P10) → Rolle ergänzen 4, PIN 4. Benutzer-Menü zeigt die 5 Arbeitsplätze als **echte Menüpunkte mit Ziffern** (`1–5` im offenen Menü) → 2. Gerät sperren aus der Zeile: `…` → „Sperren“ öffnet Dialog mit Fokus im Grund → 3 + Text. Zielspalte und Wegspalte müssen übereinstimmen; Abnahme misst den Weg. |
| P10 | **Benutzerakte: Reiter und Wireframe widersprechen sich.** Kopfzeile nennt 5 Reiter (Übersicht · Rollen & Arbeitsplätze · Bediener (PIN) · Einstellungen · Verlauf), das Wireframe zeigt Rollen, Bediener, Bezüge und Verlauf gleichzeitig auf einer Fläche. | Nielsen 4, 02 §2.1 | **3 Reiter:** `Zugriff` (Profil, Rollen-Chips, „Was darf Anna damit?“, Arbeitsplätze, Bediener: Kurzname/Standort/PIN) · `Einstellungen` (nur eigenes Profil/Admin) · `Verlauf`. Rechte Spalte „Bezüge“ bleibt fest (Hängemappe-Muster 02 §3.3). Profilnamen ohne „PH “-Präfix anzeigen („Verkauf“), Rollen-Chips ebenso („CRM Mitarbeiter“). Chip-Entfernen: `×` als eigenes Ziel ≥ 24 × 24 px mit `aria-label="Rolle CRM Mitarbeiter entfernen"`; Tastatur: Chip fokussieren → `Backspace`/`Entf`. |
| P11 | **Leerzustände fehlen** für: Geräteliste ohne Geräte (Ersteinrichtung!), Firma-Liste ohne `PH Firma` (Belege ohne Briefkopf), Betriebsruhe leer, Zuletzt · Angeheftet (neuer Benutzer), Letzte Änderungen leer, Charts ohne Daten, Freigaben (Kachel „verschwindet bei 0“ → Layoutsprung), Druck-Warteschlange leer, Druckformate leer, Drucker leer (kein Gerät mit Drucker), Benutzerakte Verlauf leer, Benutzerliste Filter („Leer-Filter: Standard“ ist kein Text). | 02 §0.7, 02 §7.1, 03 §8.18, Nielsen 9/10 | Texte (Muster 02 §7.1): Geräte: Icon `tablet`, „Noch keine Geräte registriert. Registriere das Kassa-iPad oder den Packtisch-PC, dann startet es direkt am Arbeitsplatz.“ [Gerät registrieren] [Wie funktioniert das?] · Firma: Band `warning-soft` „Noch keine Firma angelegt – Rechnungen und Druckvorlagen haben ohne sie keinen Briefkopf.“ [Firma anlegen] · Betriebsruhe: „Keine Schließtage eingetragen. Feiertage werden automatisch berücksichtigt.“ [+ Tag] · Zuletzt: „Hier erscheinen Datensätze, die du öffnest. Mit ★ heftest du sie dauerhaft an.“ · Aktivität: „Noch keine Änderungen in deinen Bereichen.“ · Chart: Fläche in Zielhöhe mit „Noch keine Werte für diesen Zeitraum“ (keine Null-Linie) · Freigaben: Kachel bleibt in kompakter Höhe 48 px „Keine offenen Freigaben“ mit Häkchen Sand (kein Sprung, CLS-Budget Z-34) · Warteschlange: „Keine Druckaufträge auf diesem Gerät.“ [Testseite drucken] · Formate: „Keine Druckformate gefunden – Belege werden mit dem Standardformat gedruckt.“ · Drucker: „Kein Gerät mit Drucker. Drucker werden in der Geräteakte eingetragen.“ [Zu den Geräten] · Verlauf: „Noch keine Änderungen an diesem Benutzer.“ · Benutzer-Filter: „Keine Benutzer mit Rolle ‚Montage‘ am Standort ‚Lager‘.“ [Filter zurücksetzen]. |
| P12 | **Undo fehlt oder ist inkonsistent:** (a) „Alle gelesen (⇧R)“ und Massen-„Als gelesen“ ohne Undo („Undo nur Einzel“) – ein Fehldruck löscht den Ungelesen-Zustand von beliebig vielen Einträgen; (b) Kanban-Verschieben ohne Undo (02 §6.1 nennt es umkehrbar); (c) Profil anwenden: Vorschau-Dialog, danach kein Undo, obwohl Rollen umkehrbar sind; (d) Aufgabe löschen (Leitung): Papierkorb nur für Admin wiederherstellbar → Leitung kann eigenen Fehlgriff nicht zurücknehmen; (e) `Z` macht „den jüngsten Toast“ rückgängig – erscheint nach „Erledigt“ ein „Gelesen“-Toast aus der Glocke, trifft `Z` das Falsche. | 02 §0.4, 02 §5 (Massen-Undo 8 s), 02 §6.1, Nielsen 3 | (a) Undo-Toast „12 als gelesen markiert · Rückgängig“ (Gegenaufruf je Name, Liste aus dem Client); (b) Kanban: Toast „Nach ‚In Arbeit‘ verschoben · Rückgängig“; (c) nach Anwenden Toast „Profil Verkauf angewendet (5 Rollen) · Rückgängig“ → stellt vorherige Rollenliste her; (d) Löschen-Toast mit Rückgängig 8 s (ruft `restore` des `Deleted Document` serverseitig mit Leitungsrecht – Anfrage ph_core) bzw. bis dahin: Leitung darf nur Verwerfen, Löschen nur Admin; (e) `Z` wirkt nur auf den **jüngsten Toast mit Undo**; nur dieser Toast zeigt die Tastenkappe `Z`; Screenreader-Text des Toasts nennt Objekt („Aufgabe ‚Rückruf Huber‘ erledigt. Rückgängig mit Z“). |
| P13 | **Erledigt-Häkchen lässt die Liste springen.** Zentrale „Meine Aufgaben“ (5 Zeilen) und Aufgabenliste: nach Häkchen fällt die Zeile aus dem Filter „Offen + In Arbeit“; die nächste Zeile rückt unter den Zeiger → Doppelklick erledigt die zweite Aufgabe. | Nielsen 5, 04 §3.3, WCAG 3.2.2 (keine unerwartete Kontextänderung) | Erledigte Zeile **bleibt** für die Undo-Dauer: Häkchen gefüllt, Titel durchgestrichen `muted`, Text „Erledigt · Rückgängig“ in der Zeile; nach Ablauf Zeilen-Kollaps `grid-template-rows 1fr→0fr` 160 ms `--bo-ease-in` (04 P4-Ausnahme). In der Zentrale-Kachel rückt die 6. Aufgabe erst nach dem Kollaps nach. Reduzierte Bewegung: sofort weg, Fokus auf nächste Zeile, Live-Region „Erledigt. Nächste: …“. |
| P14 | **Erledigen am Telefon nur per Wischen.** Mobile Kartenliste: „Wischen rechts = Erledigt, links = Zuweisen“, die Karte hat keine Checkbox. Glocke: „Wischen links = gelesen“ – **Gegenrichtung** zur Aufgabenliste. | WCAG 2.2 **2.5.1 Pointer Gestures** (A), 02 §11.2, Nielsen 4 | Karte bekommt links ein Häkchen-Ziel 44 × 44 px (sichtbar, `aria-label="Aufgabe erledigen"`); Langdruck 400 ms = Menü (Zuweisen, Fällig, Status). Wischen bleibt Zusatz. **Eine Wischregel im ganzen Backoffice:** rechts = Primär (Erledigen / Gelesen), links = Menü öffnen. 02 §11.2 entsprechend präzisieren. |
| P15 | **Arbeitsplatz-Wahl: Raster bricht, Tastenverhalten widersprüchlich, Weg zurück fehlt.** (a) 5 × 200 px + 4 × 16 px = 1064 px – am iPad hoch (820 px) und 640–1023 nicht definiert; (b) §3.1 „Taste 1–5 setzt Fokus und bestätigt nach 120 ms“ vs. Z-01 „Taste wählt, Enter bestätigt“; (c) Kicker „ZULETZT“ in Sand `#8a7a66` (4,15:1) bei 11–12 px; (d) „registriertes Gerät überspringt die Seite“ – dann erreicht die Leitung am Kassa-iPad das Backoffice nicht mehr; §8.3 Kiosk-Kopfzeile hat keinen Arbeitsplatz-Wechsel (02 §2.3 fordert ihn). | WCAG 1.4.10 (Reflow), 1.4.3, Nielsen 3/4, 02 §2.3 | (a) Raster `repeat(auto-fit, minmax(168px, 1fr))`, max. 5 Spalten, 640–1023: 3 + 2 zentriert, < 640: Liste (wie §3.1). (b) **Ziffer startet sofort** (Ring 120 ms sichtbar, dann Navigation) – hält das 1-Tasten-Versprechen §0; Enter startet die vorausgewählte; Z-01 umschreiben. (c) Kicker in `accent-text` `#6b5d4b` (6,38:1). (d) Kiosk-Kopfzeile: Tipp auf Arbeitsplatznamen öffnet Menü „Arbeitsplatz wechseln …“ (nur für Benutzer mit > 1 Arbeitsplatz, nach PIN des aktuellen Bedieners); Zeile „Dieses Gerät … startet künftig direkt in Kassa“ erscheint auf `/arbeitsplatz`, wenn man von dort kommt. |
| P16 | **Hilfe an drei Orten, Panel-Breite dreifach definiert.** Hilfe liegt laut §2.1 unten in der Seitenleiste, im Zentrale-Wireframe als `[?]` im Seitenkopf, laut 02 §10 im Benutzer-Menü. Panel: 360 px (02 §8, 10 §3.12), 480 px (04 §3.5 „Hilfe/Tastenkürzel“). Kürzel-Übersicht soll „zweispaltig, Tastenkappen links, Wirkung rechts“ sein – passt nicht in 360 px. | WCAG 3.2.6 (konsistente Hilfe), Nielsen 4 | Ein Ort: **Kopfzeile rechts, Knopf `?` zwischen Glocke und Avatar** (Icon `circle-help` + Tooltip „Hilfe · ?“); Benutzer-Menü enthält zusätzlich „Hilfe“ (gleiches Ziel); Seitenleiste und Seitenkopf ohne Hilfe-Knopf. Hilfe-Panel = Sheet **480 px** (04 gewinnt, 02/10 anpassen). Kürzel-Übersicht = eigener Dialog lg 800 (`⌘/`), zweispaltig, durchsuchbar; im Hilfe-Panel Reiter „Kürzel“ zeigt nur „Diese Seite“ einspaltig + Link „Alle Kürzel (⌘/)“. |
| P17 | **Druckvorschau 480 px ist unlesbar.** A4 (210 mm) in 480 px Sheet-Innenbreite ≈ Faktor 0,55 → 9-pt-Belegtext erscheint mit rund 5 px. Kontrolle vor dem Druck (Adresse, Beträge) ist so nicht möglich. | Nielsen 1, WCAG 1.4.4 (Zoom), 02 §0.6 | Vorschau = Sheet **lg 800** ab 1280 px, darunter Vollbild; Zoom-Segment „Breite · 100 % · Seite“ (Standard Breite), `⌘+`/`⌘−` innerhalb der Vorschau; Seitenzahl „Seite 1 von 3“ + Blättern `PgUp/PgDn`. Format-Select merkt sich je DocType (bleibt). |
| P18 | **Zentrale-Unternavigation: 8 Einträge, falscher Ort.** 02 §2.1: Unternavigation = Tabs unter dem Seitenkopf, max. 7. 10 §2.1: 8 Einträge in der Seitenleiste. „Benachrichtigungen“ doppelt zur Glocke; „Druck“ für alle, obwohl Mitarbeiter die Warteschlange nur bei Fehlern brauchen. | 02 §2.1, Nielsen 8 | Seitenleiste „Zentrale“: `Dashboard` · `Aufgaben` · `Verwaltung` (nur Admin/Leitung/GF; Hub-Seite `/verwaltung` mit 4 Karten Benutzer · Geräte · Einstellungen · Protokoll, je mit Zähler „2 Geräte lange nicht gesehen“). `Benachrichtigungen` nur über Glocke „Alle anzeigen“ und `G B`. `Druck` nur über Drucker-Status (Kiosk-Kopfzeile, Fehler-Band, Toast „1 Druckauftrag wartet · Öffnen“) und `G D`; für Admin/Leitung zusätzlich Karte in `/verwaltung`. Routen bleiben. |
| P19 | **Konfliktdialog vernichtet Eingaben.** „Neu laden“ ist Primär; „Meine Werte übernehmen“ nur Leitung/Admin. Ein Mitarbeiter verliert seine Eingaben ohne Kopie. | Nielsen 5/9, 02 §7.2 | Nach „Neu laden“ bleibt rechts ein Panel „Deine nicht gespeicherten Eingaben“ (Feld · Wert · Knopf „Übernehmen“ je Feld, setzt den Wert ins frische Formular) bis Seitenwechsel; Knopf „Alles kopieren“ (Text in Zwischenablage). |
| P20 | **„Zuletzt“, Palette-Zähler, Entwürfe nicht je Benutzer getrennt.** localStorage `ph-bo-zuletzt`, `ph-bo-palette-nutzung`, sessionStorage-Entwurf ohne Benutzerschlüssel. Am geteilten Showroom-PC sieht die nächste Kollegin die zuletzt geöffneten Kundenakten der vorigen. | Datenschutz (01/05), Nielsen 2 | Schlüssel `ph-bo:<user-hash>:zuletzt` usw.; beim Abmelden werden die Schlüssel des Benutzers nicht gelöscht, aber nur für ihn gelesen; Entwurf in sessionStorage beim Abmelden löschen. |
| P21 | **Kennzahl-Raster und -Anzahl widersprechen 03.** 10: max. 6, Raster 6/3/2; 03 §8.14: max. 8, Raster 4/2/1; 02 §2.1: max. 6. | 03 §8.14, Nielsen 4 | Nach P1 Streifen-Layout: ≥ 1280 bis 4 Felder in einer Zeile, 768–1279: 2 × 2, < 768: horizontal scrollbarer Streifen mit Einrastpunkten (`scroll-snap`, sichtbarer Anschnitt der nächsten Karte) – oder 2 Spalten. Max. 4 für Mitarbeiter, 6 für GF/Admin (zwei Zeilen). 03 §8.14 auf „max. 6“ angleichen. |
| P22 | **„–“ und Sperrgründe nur im Tooltip.** Kennzahl ohne Daten „–“ mit Tooltip „Noch keine Werte“; Arbeitsplatz-Kachel deaktiviert „mit Tooltip“; Freigabe-Knopf deaktiviert (02 §8). Tooltips sind am iPad und für Tastatur ohne Hover unerreichbar. | 03 §8.11 („nie einzige Quelle“), WCAG 1.4.13, 4.1.2 | „–“ mit sichtbarer Fußzeile „Noch keine Werte“ (12 px `muted`); gesperrte Kachel zeigt Grund als Satz in der Kachel („Gerät gesperrt“); deaktivierte Knöpfe: `aria-disabled="true"` (fokussierbar) + Grund per `aria-describedby` + Tipp öffnet Popover mit Grund. |
| P23 | **Redaktionelle Selbstgespräche in der Spezifikation:** §3.7 „(Knopf legt Anfrage als Kommentar? nein – zeigt Kontakt zur Leitung; keine rekursive Aufgabe)“; §4.1 „Dialog nur, wenn `ergebnis` leer und Beschreibung lang? nein – nie Dialog“. Der Bau-Agent übernimmt solche Sätze erfahrungsgemäß wörtlich. | Klarheit (wie Kassa-Kritik Pkt. 19) | Ersetzen durch Aussagesätze: „`forbidden`: Popover mit Kontakt der Leitung (P7).“ · „Erledigen öffnet nie einen Dialog; `ergebnis` ist optional.“ Grep über 10 nach „? nein“ = 0. |

---

## 2. Weitere Schwächen (Empfehlungen, keine Blocker)

### 2.1 Komplexität / zu viele Klicks
1. **Palette-Präfixe** (`>` `#` `@` `?` `/` `€`): sechs Zeichen für Nicht-IT-Personal. `€` als Präfix streichen – Betragsmuster (`3.744,00`, `3744 €`) wird ohnehin erkannt. Präfixe als **Token-Chip** im Feld darstellen (`#rech` → Chip „Rechnungen ×“, Backspace entfernt). Fußzeile zeigt nur 3 Hinweise je Zustand (leer: „> Aktionen · @ Personen · ? Hilfe“).
2. **Einstellungen 7 Reiter** für ein Single-Dokument: `Firma` · `Allgemein` (inkl. Postfächer aus „Benachrichtigungen“) · `Website & API` · `Kalender` · `System` (Nummernkreise + Schlüsselstatus, nur Admin). „Schlüsselnamen“ heißt in der Oberfläche „Zugangsschlüssel (Status)“.
3. **Gerät registrieren, Schritt 1 mit 8 Feldern:** Pflicht nur Name, Typ, Standort; Kasse, Drucker, Druckertyp, Notizen unter „Weitere Angaben“ (vorbelegt nach Typ). Token-Dialog statt „Token kopiert?“-Rückfrage: **Live-Rückmeldung** „Warte auf das Gerät …“ → „iPad Kassa 1 hat sich verbunden ✓ 09:14“ (Polling `zuletzt_gesehen` alle 5 s, max. 10 min); Schließen ohne Rückfrage, sobald verbunden.
4. **Glocke mit drei Reitern** für Mitarbeiter ohne Team-/System-Recht: Reiterleiste ausblenden, wenn nur „Für mich“ erlaubt.
5. **G-Sequenz mit 13 Zielen** ohne Übersicht: Nach `G` erscheint unten links (statt nur „G …“) eine Zeile mit den Zielbuchstaben („Z Zentrale · C CRM · P Projekte …“), 12 px, `surface-inverse`; 1,5 s bleibt.
6. **Erste-Schritte-Checkliste** greift nur bei 0 Kontakten **und** 0 Projekten – nach dem Datenimport nie. Bedingung je Benutzer: „noch nie eine Aufgabe/ein Angebot angelegt“ → Hinweis-Band mit einem Satz statt Checkliste.

### 2.2 Tastatur
1. Palette `→` = Vorschau kollidiert mit Cursorbewegung im Feld: nur wenn Cursor am Textende steht; sonst bewegt `→` den Cursor.
2. Palette-Breite wächst bei Vorschau von 640 auf 880 px – Breitenänderung ist laut 04 P4 nicht animierbar und springt. Vorschau als **zweite Spalte innerhalb fester 880 px ab 1024 px**, die erst bei `→` gefüllt wird (links Liste 520, rechts Vorschau 360, vorher Hinweis „→ Vorschau“).
3. Glocke-Panel: Fokus beim Öffnen auf ersten ungelesenen Eintrag, nicht auf Reiter; `←/→` wechselt Reiter.
4. Kanban `←/→` = Spalte (10) vs. 02 §9.3 `←/→` = Karte verschieben: 10 meint Fokus bewegen. Festlegen: `←/→` Fokus, `M` bzw. `Shift+←/→` verschieben.
5. Mac-Symbole in allen Wireframes (`⌘K`, `⌘S`, `⌘↵`): Team arbeitet an Windows-PCs. Jede Tastenkappe kommt aus `kuerzel.js` mit Plattform-Auflösung (`Strg+K` unter Windows), auch im Kopfzeilen-Suchfeld.

### 2.3 Barrierefreiheit (WCAG 2.2)
1. **2.4.11 Fokus nicht verdeckt:** Massenaktionsleiste (unten, sticky) und Toast-Stapel (unten rechts) überdecken die letzte Tabellenzeile. `scroll-padding-bottom` = Leistenhöhe + 16 px; Toasts weichen über die Leiste aus (Abstand 8 px).
2. **Glocke:** `aria-label="Benachrichtigungen, 3 ungelesen"`; ungelesen = Punkt **und** fette Zeile **und** versteckter Text „ungelesen“ (1.4.1).
3. **Checkbox der Aufgabenzeile** (Wireframe 16 px): Trefferfläche 24 × 24 (Desktop), 44 × 44 (iPad), `aria-label="Erledigen: <Titel>"`.
4. **Sitzungswarnung als Toast** „Sitzung endet in 2 Min.“: Warn-Toasts verschwinden laut 03 §8.12 nach 6 s – für 2.2.1 muss sie **bis zur Handlung** stehen bleiben (`role="alert"`, Fokus nicht stehlen, `F8` springt hin).
5. **Bediener-PIN (3.3.8):** PIN-Erinnern ist ein kognitiver Test; Ausnahme „persönlicher Inhalt“ greift nicht. Kiosk-Alternative vorsehen: Anmeldung per Scan einer Mitarbeiterkarte/Code-Etikett (Scanner vorhanden) als zweiter Weg – Anfrage ph_core `verify_badge`. Backoffice-PIN-Feld: `inputmode="numeric"`, `autocomplete="one-time-code"` nicht verwenden, Einfügen erlaubt.
6. **Fehl-PIN „Shake 240 ms“:** bei reduzierter Bewegung Rahmen `danger` + Text, kein Versatz (04 P9 gilt, im Konzept ausdrücklich nennen).
7. **Status „Fällig“** nur über Punktfarbe rot/Sand/grau + relatives Datum: für „heute“ steht Text „heute“, für überfällig „vor 2 Tagen“ – gut; zusätzlich `sr-only` „überfällig“.

### 2.4 Mobile / iPad / Kiosk
1. Glocke als Popover 380 px auch am Telefon: < 640 Bottom-Sheet volle Breite (Griff 32 × 4), 640–1023 Sheet rechts 480 px.
2. Freigabe-Knöpfe im Glocken-Eintrag 28 px hoch: am iPad 44 px, am Telefon unter dem Text in eigener Zeile.
3. Kiosk-Kopfzeile mit 9 Elementen in 56 px: bei < 1024 px Breite Uhr und Gerätename ins Menü des Arbeitsplatznamens; Verbindungspunkt immer mit Text.
4. Telefon-Hinweis „Für Verwaltung bitte Tablet/Desktop“ blockiert auch Sperren eines verlorenen Geräts – genau das passiert unterwegs. „Gerät sperren“ bleibt am Telefon in der Geräteliste verfügbar (Zeilenmenü), alles andere lesend.

### 2.5 Visuell / Modernität
1. Wireframe §3.2 wirkt wie ein klassisches Portal: neun gerahmte Kästen mit Versal-Überschriften. Maßstab Linear/Stripe: wenige Flächen, Hierarchie über Weißraum und Schriftgrad, Rahmen nur für Interaktives. Abschnitte als Überschrift 14/500 + Haarlinie, kein Kasten je Liste (Wireframe §5.1).
2. Versal-`overline` nur für Kennzahl-Etiketten; Listen-Überschriften in Satzschreibung („Meine Aufgaben“).
3. **Bodoni-Kopfzahl 44 px** (GF „Umsatz Monat“): 02 §13 erlaubt Bodoni nur als Wortmarke, 03 §8.14 erlaubt Kopfzahl – Entscheidung Inhaber offen. Empfehlung: ja, **nur** auf der GF-Zentrale, nur diese eine Zahl, Ziffern auf `tabular-nums`-Fähigkeit der Bodoni Moda prüfen (Zahl ändert sich per Zeitraum-Chip); sonst Instrument Sans 32/500.
4. Arbeitsplatz-Icons: „✚ Technik“ liest sich als Sanität. lucide `wrench` (Technik), `hammer` (Montage), `package` (Packtisch), `receipt` (Kassa), `layout-dashboard` (Backoffice).
5. Begrüßung „Guten Morgen, Anna.“ + Datum + Profilname + zwei Knöpfe in einer Zeile: Datum und Profil als zweite Zeile 13 px `muted`.

### 2.6 Unklar / widersprüchlich im Dokument selbst
1. §3.6 Massenaktionsknopf „Erledigt (E)“ – Knöpfe sind Verben (02 §14): „Erledigen“.
2. §3.5 Wireframe zeigt „[Ablehnen]“, Aktionsmatrix §5.1 kennt kein Ablehnen: Ablehnen öffnet im Eintrag ein Textfeld „Grund“ (Pflicht, wenn der Fachbereich es verlangt), Primär „Ablehnen“, danach Undo 8 s mit verzögertem Senden (04 §3.6 Variante A), weil der Antragsteller benachrichtigt wird.
3. §3.2 Kachel „MEINE AUFGABEN“ mit Umschalter „Meine|Team“: Titel folgt dem Umschalter („Team-Aufgaben“).
4. §3.8 Protokoll filtert Person/Zeitraum **clientseitig auf 100 geladenen Einträgen**; Leerzustand „Keine Einträge im Zeitraum“ ist dann falsch. Text: „Keine Treffer in den letzten 100 Einträgen“ + Hinweis-Zeile über der Tabelle „Filter wirkt auf die letzten 100 Einträge“ bis der Server `seit/benutzer` kann.
5. §3.11 QR enthält `…/geraet?token=…`: Token landet in Browser-Verlauf und Server-Logs des iPads. `#token=` (Fragment, nicht an Server) + `history.replaceState` nach Übernahme.
6. §3.2 „Freigaben … Kachel verschwindet bei 0“ vs. P11 (kompakte Zeile).
7. §1.5 „Hilfe/Kürzel am Kiosk `F1`“ – iPad-Kiosk ohne Hardware-Tastatur: Hilfe-Knopf in der Kiosk-Kopfzeile (sichtbar, 48 px) ist der Hauptweg, `F1` der zweite.

---

## 3. Kürzel-Register Querschnitt (Vorschlag für `kuerzel.js`, löst P3)

Windows-Schreibweise zuerst; Mac ersetzt `Strg` durch `⌘`. „E“ = Einzeltaste, abschaltbar (P4).

| Kontext | Taste | Wirkung | Quelle/Änderung |
|---|---|---|---|
| global | `Strg+K` | Palette | 02/03/10 gleich |
| global | `/` (E) | Suche des Kontexts: Liste → Filterfeld, sonst Palette | löst 02 vs. 10 |
| global | `?` (E) | Hilfe-Panel, Reiter Artikel | 10 §1.1 gewinnt |
| global | `Strg+/` | Alle Tastenkürzel (Dialog) | neu |
| global | `G` + Buchstabe (E) | Gehe zu (Hinweiszeile mit Zielen sofort) | 05-Buchstaben (`V` Service, `S` Shop) |
| global | `N` (E) | Neu-Menü sofort; zweiter Buchstabe wählt (`A` Aufgabe …) | löst `N` vs. `N A` |
| global | `Strg+Z` / `Z` (E) | Undo des jüngsten Toasts **mit Undo** | löst 02 vs. 04/10 |
| global | `F8` | Fokus jüngster Toast (nur Backoffice-Shell) | 03 |
| global | `Strg+B`, `[` `]` (E) | Seitenleiste | 02/10 |
| global | `Esc` | schließt oberste Ebene; zweites Esc hebt Auswahl auf | 02 |
| Zentrale | `R` (E) | Kacheln neu laden | 05 T1 |
| Zentrale | `1–6` (E) | Kennzahl fokussieren | 10 |
| Liste | `↑↓`, `Enter`, `X`/Leertaste laut Fundament, `A` Zuweisen, `S` Status, `D` Fällig, `C` Kommentar | | 02 §9.2 |
| Liste/Akte Aufgabe | `Strg+Enter` | Erledigen (Primär der Zeile/Akte) | ersetzt `E` |
| Akte | `E` (E) | Bearbeiten/erstes Feld | 02 §9.1 |
| Akte | `Alt+↑/↓` | vorige/nächste der Liste | 02 |
| Akte | `Strg+P` | Druckvorschau | 02; `p` und `.` gestrichen |
| Kanban | `←→↑↓` Fokus, `M` / `Shift+←→` verschieben | | präzisiert 02 §9.3 |
| Palette | `↑↓`, `Enter`, `Strg+Enter` neuer Tab, `Tab` Gruppe, `→` Vorschau (Cursor am Ende), `Backspace` leer = Token weg | Fehlerzeile: `Enter` = Erneut | `R` gestrichen |
| Glocke | `↑↓`, `Enter`, `R` gelesen, `Shift+R` alle gelesen (mit Undo), `F` Freigeben, `←→` Reiter | | 10 + P12 |
| Arbeitsplatz | `1–5` startet, `Enter` startet vorausgewählte | | P15 |
| Kiosk | `F1` Hilfe, `F11` Vollbild, `F12` Bedienerwechsel; Kassa/Packtisch F2–F10 laut 02 §9.5 | `Strg+L`, `F8`, `F9` (Druck) gestrichen | P3 g–i |

Test: Je Kontext keine Taste doppelt; Tooltip, Palette und Overlay lesen dieselbe `id` (Z-28 bleibt).

---

## 4. Widersprüche in den Leitlinien, die die Zentrale besitzt (Entscheidung hier, dann 02/03/04 nachziehen)

Die Zentrale baut Toast, Palette, Sheet, Glocke und Hilfe-Panel für alle. Wo 02/03/04 verschiedene Werte nennen, muss **dieses** Konzept den Wert festlegen und `motion.js`/`kuerzel.js` zur einzigen Quelle machen.

| Thema | 02 | 03 | 04 | 10 | Vorschlag |
|---|---|---|---|---|---|
| Undo-Dauer | 8 s | 8 s (Aktion), ok-Toast 4 s | 5000 ms | 8 s | **8 s**; 04 §3.6 anpassen |
| Undo-Technik | sofort + Gegenaktion | – | Variante A (verzögerter Commit) Standard | Gegenaufruf | Gegenaktion, wo es eine gibt (Status, Zuweisung, Rolle, Gelesen); Variante A nur für Benachrichtigung Dritter (Ablehnen, Mails) |
| Undo-Taste | `⌘Z` | – | `Z` | `Z` | beide (§3) |
| Toast-Position | unten Mitte | unten rechts | unten rechts | – | unten rechts (Desktop), oben Mitte (Kiosk) |
| Toast rein/raus | – | 240/160 ms | 160/120 ms | 160/120 ms (Z-33) | 160 ms `--bo-ease-out` / 120 ms `--bo-ease-in` |
| Palette öffnen | – | 200 ms, `scale .98` | 140 ms, `scale .985` | 140 ms | 140 ms `.985` (04) |
| Dialog öffnen | 160 ms | 240 ms | 160 ms | – | 160 ms (04) |
| Sheet öffnen | 200 ms | 240 ms, `translateX 16` | 200 ms, `translate 16` | 200 ms | 200 ms (04) |
| Popover/Menü | – | 160 ms | 120 ms, Schließen ohne Animation | 120 ms | 120 ms (04) |
| Tooltip-Verzögerung | – | 400 ms | 600 ms | – | 400 ms, danach in Gruppe 0 ms |
| Kennzahl zählt hoch | nein (§13) | – | ja, 400 ms bei Änderung nach Mount | – | ja nach 04 (nur Änderung nach Mount); 02 §13 streichen |
| Kennzahlen max./Raster | 6 | 8; 4/2/1 | – | 6; 6/3/2 | 4 Mitarbeiter, 6 GF; Streifen (P21) |
| Hilfe-Panel | 360 px, Benutzer-Menü | – | Sheet 480 | 360 px, Seitenleiste + Seitenkopf | 480 px, Kopfzeile (P16) |
| `#` in Palette | Status-Filter | Nummer direkt | – | Objektart | Objektart (§3) |
| `/` | Listenfilter | – | – | Palette | Kontext (§3) |
| Bodoni | nur Wortmarke | auch Kopfzahl | – | Kopfzahl GF (offen) | Inhaber; Empfehlung §2.5.3 |
| Wischen | links Zuweisen, rechts Erledigt | – | – | Glocke links = gelesen | rechts Primär, links Menü (P14) |

---

## 5. Korrigierte Wireframes

### 5.1 Zentrale, Mitarbeiter Verkauf, 1280 × 800

```
┌ [☰] Zentrale                         [ Suchen oder Befehl …  Strg K ] [🔔 3] [?] [AB ▾] ┐ 56
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Guten Morgen, Anna.                                        [+ Neu ▾]  [Neue Anfrage]   │ 20/500
│ Mittwoch, 4. November 2026 · Verkauf                                                   │ 13 muted
│                                                                                        │
│ HEUTE  (●1 überfällig) (3 Termine · nächster 10:00) (2 Anfragen neu)                   │ Chips 32, Link
│ ────────────────────────────────────────────────────────────────────────────────────── │ Haarlinie
│ Meine Aufgaben  Meine | Team                         │ Zuletzt · Angeheftet            │ 14/500
│ ☐ Angebot AN-2026-00031 nachfassen  Angebot  vor 2 T │ ★ P-26-0042 Küche Fam. Muster   │ Zeilen 40
│ ☐ Rückruf Fam. Huber Liefertermin   Projekt  heute   │   AB-2026-00017 ● In Bestellung │
│ ☑ ~~Muster an Küchenstudio senden~~  Erledigt · Rückgängig │   Fam. Huber · Kontakt  gestern │ P13
│ ☐ …                                                  │   …                    Alle →   │
│ [ Aufgabe hinzufügen … @Name +3                    ↵ ]│                                 │
│                                          Alle (12) → │                                 │
│ ────────────────────────────────────────────────────────────────────────────────────── │
│ OFFENE ANFRAGEN │ ANGEBOTE GESENDET │ AUFTRÄGE OFFEN │ SERVICEFÄLLE                     │ Streifen 88
│ 12  ▲2 seit gest│ 7                 │ 4              │ –  Noch keine Werte              │ Werte = Beispiel
│ ────────────────────────────────────────────────────────────────────────────────────── │
│ ▸ Letzte Änderungen im Bereich (12)                                                    │ eingeklappt
└────────────────────────────────────────────────────────────────────────────────────────┘
```
(Zahlen sind Darstellungsbeispiele, keine Betriebswerte. Kennzahl-Auswahl für Verkauf kommt aus `dashboard.js` nach Recht; ohne passende Kennzahl bleibt der Streifen kürzer.)

### 5.2 Zentrale, GF, 1280 × 800

```
│ Guten Morgen, Name.                                   [+ Neu ▾]  [Neue Aufgabe]        │
│ HEUTE  (●2 Freigaben) (●1 Abschluss offen gestern) (4 Montagen)                         │
│ UMSATZ MONAT        │ OFFENE POSTEN   │ ANFRAGEN OFFEN │ SERVICEFÄLLE │ KASSA HEUTE      │
│ 48.230 € (Bodoni?)  │ 9 Rechnungen    │ 12             │ 5 · 1 Frist  │ 14 Belege        │
│ Freigaben (2)                              │ Meine Aufgaben | Team                      │
│ Kulanz 180,00 € · PH-SRV-… · A. Berger  [Ablehnen] [Freigeben] │ …                     │
│ Urlaub L. Berger 12.–16.12.              [Ablehnen] [Genehmigen] │                     │
│ Umsatz je Monat (6 M | 12 M)               │ Anfragen je Woche (8 W | 12 W)             │
```
Name und Zahlen sind Platzhalter der Darstellung, keine Betriebswerte. Freigeben/Genehmigen = Sekundärknopf (Umrandung); die Primäraktion der Seite bleibt oben rechts (02 §0.2).

### 5.3 Zentrale, iPad hoch (820 × 1180)

```
│ Guten Morgen, Anna.                [Neue Anfrage] │
│ HEUTE (●1 überfällig) (3 Termine) (2 Anfragen) → │ Chips horizontal scrollbar
│ Meine Aufgaben                                    │
│ (☐) Angebot AN-…31 nachfassen        vor 2 Tagen │ Ziel 44 × 44
│ (☐) Rückruf Fam. Huber                    heute  │
│ OFFENE ANFRAGEN 12   │ ANGEBOTE GESENDET 7       │ 2 × 2
│ AUFTRÄGE OFFEN 4     │ SERVICEFÄLLE –            │
│ Zuletzt · Angeheftet                              │
│ ▸ Letzte Änderungen                               │
```

### 5.4 Palette mit Objektart-Token und Vorschau (≥ 1024 px, fest 880 px)

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ ⌕ [Rechnungen ×] huber                                                         esc   │
├─────────────────────────────────────────────────────┬─────────────────────────────────┤
│ DATENSÄTZE                                          │ RE-2026-00040                   │
│ ▸ RE-2026-00040 · Huber Maria  3.744,00 € ● Bezahlt │ ● Bezahlt · 12.10.2026          │
│   RE-2026-00031 · Huber Maria  1.200,00 € ● Gestellt│ Huber Maria, Lochau             │
│ AKTIONEN                                            │ 3.744,00 € · fällig 26.10.      │
│   + Neue Aufgabe „huber“                     N A    │ [Öffnen ↵]  [PDF]               │
├─────────────────────────────────────────────────────┴─────────────────────────────────┤
│ ↑↓ wählen · ↵ öffnen · Strg ↵ neuer Tab · → Vorschau · Tab Gruppe                     │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.5 Arbeitsplatz-Wahl 640–1023 px

```
            Platzhirsch
            Backoffice
     Guten Morgen, Anna. Wo arbeitest du heute?
  ┌ ZULETZT ─────┐ ┌──────────────┐ ┌──────────────┐
  │ Backoffice 1 │ │ Kassa      2 │ │ Packtisch  3 │
  └──────────────┘ └──────────────┘ └──────────────┘
         ┌──────────────┐ ┌──────────────┐
         │ Montage    4 │ │ Technik    5 │
         └──────────────┘ └──────────────┘
                      Abmelden
```

---

## 6. Was gut ist und so bleiben soll

1. Aktionsmatrix §5.1 mit exakten Servermethoden und Klasse je Aktion – Vorlage für alle Fachbereiche.
2. Rollenvarianten ohne Konfiguration; Steuerberater mit drei Kacheln; Selbstservice mit Stempel-Kachel.
3. Nummern-Normalisierung und Scanner-Erkennung in der Palette; lokale Gruppen bei Serverausfall nutzbar.
4. Suspense je Kachel mit Teilfehler „Nicht geladen · Erneut“; Kennzahl „–“ statt erfundener 0.
5. Token-Ausgabe nur einmal, Hash am Server, Sperrgrund am Gerät sichtbar (Lücke `gesperrt_grund` richtig benannt).
6. Drei unterscheidbare Leerzustände der Aufgabenliste (Z-17).
7. „Was darf Anna damit?“ als Sätze statt Rechtematrix.
8. Aktivitätsstrom nur mit Feld-Labels, nie Werten.
9. Charts mit `<details>`-Datentabelle; Zeichnen nur beim Erscheinen.
10. Kürzel-Registry als eine Quelle (Z-28) – mit §3 wird sie widerspruchsfrei.

---

## 7. Abnahme-Ergänzungen für §11 (nach Umsetzung der Pflichtänderungen)

| # | Kriterium | Prüfung |
|---|---|---|
| Z-36 | Schalter „Einzeltasten-Kürzel“ aus → `Z`, `R`, `G …`, `N …`, `1–6`, `?`, `/` wirken nicht; `Strg+K`, `Strg+Z`, `F8`, `Esc` wirken (P4) | E2E beide Zustände |
| Z-37 | Palette: `huber` + Enter innerhalb 50 ms nach letzter Taste (Mock-Latenz 300 ms) öffnet den ersten Datensatz, nie „Neue Aufgabe ‚huber‘“; ohne Treffer → `/suche?q=huber` (P5) | E2E mit verzögertem Mock |
| Z-38 | Schnellanlage „Lieferung 12.11. bestätigen“ → Titel unverändert, kein Fällig-Chip; „Rückruf Huber +3“ → Chip „Fällig: …“, `Backspace` stellt „+3“ wieder her (P6) | Unit Parser, E2E |
| Z-39 | Rolle ohne `create` auf `PH Aufgabe`: kein Knopf „Aufgabe“, keine Palette-Aktion, keine Inline-Zeile; „Leitung bitten“ zeigt Kontakt statt Aktion (P7) | Rollen-Snapshot Logistik |
| Z-40 | Einstellungen: Testmodus-Schalter speichert nach Rückfrage ohne Speicherleiste; andere Feldänderung zeigt Speicherleiste; Benutzerakte hat keinen Speichern-Knopf (P8) | E2E |
| Z-41 | Jede Zeile in §1 wird als Klickfolge gemessen; Abweichung vom Zielwert = Fehler (P9) | E2E Klickzähler |
| Z-42 | Leerzustände P11 mit leerem Seed: je Fläche Text + Aktion, Freigaben-Kachel ohne Höhenwechsel (CLS < 0,05) | Snapshot, Lighthouse |
| Z-43 | „Alle gelesen“ → Toast mit Rückgängig stellt alle Einträge ungelesen her; Kanban-Verschieben und Profil anwenden mit Undo; `Z` trifft nur den jüngsten Toast mit Undo (P12) | E2E |
| Z-44 | Aufgabe erledigen in Zentrale: Zeile bleibt 8 s durchgestrichen, Zeile darunter bewegt sich nicht; Doppelklick an derselben Stelle erledigt keine zweite Aufgabe (P13) | E2E Zeigerposition |
| Z-45 | Telefon 390 px: Aufgabe per Tipp auf Häkchen-Ziel erledigbar ohne Wischen; Glocke als Bottom-Sheet; Wischrichtung rechts = Primär in Aufgaben und Glocke (P14, §2.4) | E2E Touch-Emulation |
| Z-46 | Arbeitsplatz-Wahl bei 820 px Breite ohne horizontalen Scroll (3 + 2); Taste `2` startet Kassa; Kicker-Kontrast ≥ 4,5:1; Kiosk-Kopfzeile bietet „Arbeitsplatz wechseln“ (P15) | E2E, axe |
| Z-47 | Hilfe-Knopf an genau einer Stelle der Kopfzeile auf jeder Backoffice-Seite; Panel 480 px; `Strg+/` öffnet Kürzel-Dialog (P16) | Snapshot je Bereich |
| Z-48 | Druckvorschau ≥ 1280 px: 800 px breit, Zoom „Breite“ Standard, 9-pt-Text bei 100 % lesbar (P17) | Visueller Test |
| Z-49 | `kuerzel.js`: keine Doppelbelegung je Kontext; Windows zeigt `Strg`, Mac `⌘` in Tooltip, Palette, Kopfzeile, Overlay (P3, §2.2.5) | Unit, E2E beide Plattformen |
| Z-50 | Zweiter Benutzer am selben Browser sieht weder Zuletzt noch Palette-Vorschläge des ersten (P20) | E2E zwei Logins |
| Z-51 | Motion-Werte der Querschnittsbausteine stammen aus `motion.js`-Token und entsprechen §4 (Toast 160/120, Palette 140, Dialog 160, Sheet 200, Menü 120) | Unit Token-Snapshot, Z-33 angepasst |
| Z-52 | Grep über `10-konzept-zentrale.md` und `backoffice/src/**/zentrale/**` nach „? nein“ = 0 (P23) | Grep |

*Ende 20 – Kritik UX Zentrale.*
