# 00 – MASTER: Querschnitt, Entscheidungen und Bauplan des Platzhirsch-Backoffice

**Zweck:** Ein verbindliches Dach über allen Backoffice-Dokumenten. Es verdichtet 01–05 zu prüfbaren Querschnittsregeln, gleicht die zwölf Bereichskonzepte (`10-konzept-*.md`, Fassungen nach den Kritiken `20-`/`21-`) gegeneinander ab, entscheidet Kollisionen, legt die gemeinsamen Bausteine fest, die **vor** den Bereichen gebaut werden, und beschreibt den Bauplan mit Teams, Schreibbereichen, Reihenfolge, Abnahme und offenen Inhaber-Entscheidungen.
**Stand:** 2026-11-04 · Rolle: Chef-Produktdesigner / Personalchef der Bauphase · Status: verbindlich für den Bau; Inhaber-Punkte in § 8 laufen mit dem genannten Standard, bis entschieden ist.
**Gelesen:** 01–05, alle 12 `10-konzept-*.md`, alle 24 Kritiken, `PLAN-NEXT-BACKOFFICE.md`, `backoffice/src/components/Backoffice/README.md`, `40-qa-befunde-basis.md`, `50–52-backend-luecken-*.md`, `90-inhaber-fragen.md`, `91-steuerberater-fragen.md`, Fundament-Stand `backoffice/` (Token in `src/app/globals.css`, `tools/qa/`, Tests).

**Rangfolge bei Widerspruch** (gilt ab sofort für jeden Agenten):

1. Recht (RKSV, BAO, UStG, FAGG, DSGVO, AZG/ArbVG) – Punkte „StB“/„RB“ laufen mit der strengsten Variante.
2. **Dieses Dokument** für alles, was mehr als einen Bereich betrifft (Muster, Begriffe, Tasten, Bewegung, Routen, Bausteine, Dateien).
3. Das Bereichskonzept `10-konzept-<bereich>.md` für alles Fachliche innerhalb des Bereichs.
4. 01–05 als Begründung und Detailquelle. Wo 01–05 von hier abweichen, gilt hier; das Doku-Team zieht 01–05 nach (Team Q5, § 5).

Begriffe in dieser Datei: **Muss** = Abnahmekriterium. **Fundament** = `backoffice/src/components/Backoffice/*` und `backoffice/src/lib/backoffice/*` außerhalb der Bereichsordner. **Bereich** = einer der 12 Fachbereiche (Zentrale, CRM, Projekte, Faktura, Shop, Sortiment, Logistik, Service, Kundenkarte, Marketing, Personal, Kassa).

---

## 1. Vision (10 Sätze)

1. Das Platzhirsch-Backoffice ist das eine Werkzeug, mit dem ein Team von 10–15 Menschen ohne IT-Hintergrund den ganzen Weg eines Einrichtungshauses führt: Anfrage → Planung → Angebot → Auftrag/AB → Anzahlung → Bestellung → Wareneingang → Lieferung → Montage → Rechnung → Service.
2. Wer morgens die Zentrale öffnet, sieht ohne Klick, was heute zu tun ist, und erreicht jede Tagesaufgabe in höchstens drei Klicks oder über `Strg+K`.
3. Mitarbeiter denken in Kunde und Auftrag, deshalb tragen **Kundenakte** und **Auftragsmappe** alles; jedes Dokument zeigt seinen Platz im Vorgang und den einen nächsten Schritt.
4. Zwölf Bereiche folgen einem Muster: Liste, Akte, Sheet, Dialog, Druck sehen überall gleich aus und reagieren auf dieselben Tasten – wer CRM bedienen kann, kann Service bedienen.
5. Einfach heißt: eine Primäraktion je Ansicht, Rückgängig statt Rückfrage, Tiefe erst auf Nachfrage; mächtig heißt: Palette, Tastatur, Massenaktionen, gespeicherte Filter in der URL und ehrliche Zahlen.
6. Frappe bleibt unsichtbar; kein Mitarbeiter sieht je einen DocType-Namen, einen Feldnamen oder eine technische Fehlermeldung.
7. Kassa, Packtisch, Montage und Technik sind eigene Oberflächen derselben Anwendung – Vollbild, große Ziele, Scanner und PIN-Wechsel –, keine verkleinerten Bürobildschirme.
8. Gestaltet ist das Backoffice in der Platzhirsch-Sprache: Tinte `#30373e` für Handlung, Sand `#8a7a66` für Orientierung, Haarlinien statt Schatten, Instrument Sans für alles, Bodoni Moda nur für die Wortmarke – ruhig wie ein gutes Möbel, präzise wie Linear, Stripe und Shopify Admin.
9. Was das Backend noch nicht richtig kann, zeigt die Oberfläche ehrlich als „noch nicht verfügbar“ mit Ersatzweg, statt eine falsche Zahl oder einen falschen Beleg zu riskieren.
10. Jede Seite läuft im Mock-Modus, ist mit Tastatur und Screenreader bedienbar, hell wie dunkel geprüft und wird erst abgenommen, wenn Screenshots auf Desktop, iPad und Telefon sauber sind.

---

## 2. Verbindliche Querschnittsregeln

Jede Regel ist eine Ja/Nein-Prüfung. Spalte „Prüfung“ sagt, wie abgenommen wird: **U** Unit-Test, **E** Playwright-E2E, **S** Screenshot-Sichtung (QA-Team), **A** axe/Screenreader (A11y-Team), **R** Code-Review (Integration), **M** Messung (Trace/Build).

### 2.A Architektur und Daten

| Nr. | Regel | Prüfung |
|---|---|---|
| Q-A1 | Der Browser spricht nie mit Frappe. Alle Aufrufe laufen serverseitig über `backoffice(session)`; Benutzeraktionen mit der Frappe-Sitzung des Mitarbeiters, `backofficeService()` nur für Systemaufgaben. | R |
| Q-A2 | Jede Seite ruft zuerst `requireSession()` und `requireDocRecht()`/`darf()`; jede Server Action prüft Sitzung und Recht erneut, validiert per zod/`validiere` und gibt `{ ok, code, message, fehler?, undo?, daten? }` zurück – sie wirft nie. | U, R |
| Q-A3 | Jede Route läuft im Mock-Modus mit Seed-Daten aus `mock/seed/<bereich>.js` (keine echten Personen, E-Mails `@beispiel.invalid`, runde Beispielbeträge). | E |
| Q-A4 | Beträge sind intern Cent (Integer), angezeigt über `cent()` als `1.234,50 €`; Minus `−`; Währung nur EUR, Fremdwährung wird mit Hinweis gesperrt (Faktura E9, Shop E19, Sortiment O5). | U |
| Q-A5 | Datum `04.11.2026`, Zeit `14:05`, relativ nur < 24 h („vor 12 min“, „heute 09:12“), danach absolut; `title` immer absolut mit Wochentag. | U |
| Q-A6 | Kein berechneter Wert erscheint, wenn die Quelle ihn nicht richtig liefert: dann „–“ mit Text „Noch keine Werte“ bzw. dem Grund. Keine Beispielwerte außerhalb des Mock (Testband sichtbar). | R, S |
| Q-A7 | Fehlt eine Backend-Voraussetzung, entscheidet die **Fähigkeit** (G-04): fachlich erwartet → Knopf sichtbar, deaktiviert, darunter 12 px Text „Noch nicht verfügbar – {Ersatzweg}“ mit Link; nicht erwartet oder fehlendes Recht → ausgeblendet. Nie ein Knopf, der mit Fehler endet. | E, R |
| Q-A8 | Geschäftsentscheidungen des Inhabers (z. B. Blindzählung, Vier-Augen, Zeitstempel) sind **Einstellungen** in `lib/backoffice/config.js` → Abschnitt `betrieb.*`, nicht Fähigkeiten. | R |
| Q-A9 | Belege mit Nummer, Buchung oder Signatur werden nie gelöscht und ab dem Buchen nicht mehr bearbeitet (nur Storno/Korrekturbeleg, Notiz, Anhang). „Löschen“ erscheint nur bei Entwürfen ohne Folgen. | E, R |
| Q-A10 | Mehrstufige oder geldwirksame Aktionen tragen einen Idempotenz-Schlüssel `<aktion>:<quelle>:<uuid>`; Doppelklick erzeugt nie zwei Belege. | U |
| Q-A11 | Fremddaten in Akten nur mit explizitem Bezugsfilter (Projekte E8); fehlt ein Filterfeld, steht „nicht verknüpft“ statt einer ungefilterten Liste. | U, R |
| Q-A12 | Kein Mitarbeiter-Monitoring ohne Rechtsgrundlage: keine Auswertung je Person, keine Live-Ankunftszeiten, kein Ortungs-Ersatz; Schalter `betrieb.mitarbeiterauswertung` Standard aus. | R |

### 2.B Navigation und Seitenmuster

| Nr. | Regel | Prüfung |
|---|---|---|
| Q-B1 | Drei Ebenen: Arbeitsplatz → Bereich → Objekt. Jede Route gehört zu genau einem Seitentyp T1–T9 (05 § 2). | R |
| Q-B2 | Seitenleiste 240 px, eingeklappt 64 px; Reihenfolge Zentrale, CRM, Projekte, Faktura, Shop, Sortiment, Logistik, Service, Kundenkarte, Marketing, Personal, Kassa-Verwaltung (Inhaber-Bestätigung M-03). | S |
| Q-B3 | Unternavigation eines Bereichs = **eine** Komponente `Unternav` (G-10): Tabs mit 2 px Unterstrich in Tinte, max. 7 sichtbar, Rest unter „Mehr“, horizontal scrollbar am iPad. Das Wort „Pills“ entfällt. | S, R |
| Q-B4 | Bereichsstart = „Zu tun“ (G-11) + höchstens 4 Kennzahlen je Rolle + höchstens 2 Listen. Charts stehen im Bericht „Übersicht“ des Bereichs. Die **Heute-Leiste** gibt es nur in der Zentrale. | S |
| Q-B5 | „Eine Zahl, ein Ort“: dieselbe Kennzahl erscheint auf einer Seite höchstens einmal; Zentrale höchstens 4 Kennzahlen (Mitarbeiter) bzw. 6 (GF). | S |
| Q-B6 | Akte (T5): Kopf ≤ 2 Zeilen, darunter `Vorgangsleiste` (G-12) wenn das Objekt in einer Kette steht, **höchstens 6 Tabs**, **höchstens 1 Band**, rechte Spalte „Aktivität · Details · Bezüge“ ab 1280 px, darunter als Tab. | S |
| Q-B7 | Filter, Sortierung, Seite, Ansicht und offene Panels leben in der URL (`?status=&q=&ansicht=&panel=`); Browser-Zurück funktioniert immer. | E |
| Q-B8 | Kanonische Route je DocType im `ROUTEN`-Register (G-01); `/d/<slug>/<name>` leitet mit 307 dorthin, sobald registriert. Generische `/d/*`-Seiten bleiben Rückfall für Admin. | E |
| Q-B9 | Brotkrumen max. 3 Ebenen + Zurück-Pfeil; Rückkehr zur Liste behält die Filter. | E |
| Q-B10 | Seitentitel `<Objekt> · <Bereich> · Platzhirsch Backoffice`; genau eine `h1`. | A |
| Q-B11 | Fehlendes Recht: Navigation, Reiter und Massenaktionen ausblenden; Aktionen im Objekt als deaktivierte `⋯`-Zeile „Nur {Rolle}“ mit „Leitung bitten“ (G-05). Direktaufruf ohne Recht → `/kein-zugriff` mit Rückweg. | E |

### 2.C Aktionen, Rückgängig, Bestätigung

| Nr. | Regel | Prüfung |
|---|---|---|
| Q-C1 | Genau eine Primäraktion (`variant="primary"`, Tinte) je Sichtbereich, rechts im Seitenkopf; ihr Kürzel ist `Strg/⌘+Enter`. Zeilen-Primäraktion `Shift+Enter`. | E, S |
| Q-C2 | **Rückgängig statt Rückfrage.** Backoffice: Undo-Fenster **8 s** für alles (auch Mails). Kiosk: **6 s**. Toast pausiert bei Hover, Fokus und Berührung. | E |
| Q-C3 | Undo-Technik (G-03): **verzögerter Commit** (Variante A) für jeden Workflow-Übergang, jede Mail/Benachrichtigung, jede Außenwirkung (Website, Hersteller, Kunde), jede Bank-/Geldzuordnung; **sofort + Gegenwert** (Variante B) nur für einfache Feldwerte ohne Folge (Zuständig, Notiz, Fällig, Priorität, Gelesen, Tag, Rolle am Benutzer). | U, E |
| Q-C4 | `pagehide`/`visibilitychange:hidden`/Navigation führt ausstehende Commits **aus** (sendBeacon), nie still verworfen. Jede Folgeaktion am selben Datensatz ruft vorher `flush()`. | E |
| Q-C5 | Ausstehende Commits sind sichtbar: Zeile/Karte/Akte trägt `Ausstehend` (G-03) „wird in 6 s gespeichert“; Zeilen, die aus dem Filter fallen, bleiben für die Undo-Dauer stehen. | S |
| Q-C6 | Bestätigungsdialog nur bei: Nummernvergabe/Buchen/Stornieren, Geldbewegung, unumkehrbarer Außenwirkung (Versand, Veröffentlichen ohne Undo, Löschen von Personendaten), Sicherheit (Gerät sperren, Token, Testmodus). Titel = Frage mit Fakten, nie „Sind Sie sicher?“. Rot → Fokus auf „Abbrechen“. | E, R |
| Q-C7 | Freigaben (Vier-Augen) laufen über ein Muster `FreigabeEintrag` (G-15): eigener Antrag → Knopf gesperrt mit Satz „Eigener Antrag – zweite Person nötig“; geldwirksam → Bestätigen-Dialog mit Betrag; Ablehnen mit Pflichtgrund und 8 s verzögertem Senden. | E |
| Q-C8 | Bar, Karte und Gutschein-Verkauf gibt es nur an der Kassa. Jede andere Stelle zeigt den Baustein `AnDieKassa` (G-19). Kein Bargeld-Feld in Shop, Faktura, Logistik, Projekte, Service. | E, R |
| Q-C9 | Kunden informieren läuft überall gleich (G-18): Änderung mit Toast, bleibender Chip „Kunde nicht informiert · Informieren …“, Sheet mit Vorschau, Senden als verzögerter Commit, Rückmeldung des Zustellkanals; ohne E-Mail Ausweg Telefon/Brief. | E |
| Q-C10 | Massenaktionen: Auswahl mit `X`/Checkbox, Leiste unten (160 ms), nur für alle gewählten zulässige Aktionen, sonst Vorschau „3 von 5 möglich – 2 übersprungen“; gefährliche nur unter „Mehr“. | E |
| Q-C11 | Mitarbeiter-Sperren durch Leitungsrecht bieten „Leitung bitten“ (legt genau eine `PH Aufgabe` je Objekt/Aktion/Tag an, idempotent). | U, E |

### 2.D Formulare und Eingabe

| Nr. | Regel | Prüfung |
|---|---|---|
| Q-D1 | Entwürfe (`docstatus 0`, ohne Workflow-Sprung) speichern automatisch 1 s nach der letzten Eingabe; Kopf zeigt „Gespeichert 14:05“. Sonst `Speicherleiste` (G-09) mit „Verwerfen · Speichern“, `Strg/⌘+S`. | E |
| Q-D2 | Inline, wenn ein Feld ohne Folgewirkung; Formular/Sheet/Dialog, wenn Positionen, Beträge, Nummernkreis, Mail oder > 3 Pflichtfelder (02 § 4.1). | R |
| Q-D3 | Neu-Dialog: nur Pflichtfelder + 2–3 häufigste, „Weitere Angaben“ eingeklappt, Knöpfe „Anlegen“ und „Anlegen und öffnen“; vorbefüllt aus dem Vorgängerobjekt (nie zweimal tippen). | E |
| Q-D4 | Fehler stehen unter dem Feld (Text, nicht nur Farbe); erstes Fehlerfeld bekommt Fokus; Zusammenfassung oben erst ab 4 Fehlern. | A, E |
| Q-D5 | Datum nur über `Datumsfeld` (TT.MM.JJJJ, Wert ISO); Beträge nur über `BetragFeld` (G-21, Komma-Modell, `inputmode="decimal"`). Kein `type="date"`. | U, E |
| Q-D6 | Mengen ganzzahlig, bis das Backend Dezimal + Einheit trägt; Eingabe „3,6“ wird abgelehnt mit Ersatzweg-Text, nie still gerundet (Logistik E9, Projekte E10). | U |
| Q-D7 | Konflikt über `modified`: Feld/Zeile gelb umrandet, Text „Von Lena vor 2 Min. geändert: 12 → 14“, Knöpfe „Übernehmen“ / „Meinen Wert behalten“ (nur Leitung bei ganzen Belegen „Trotzdem speichern“). | E |
| Q-D8 | Scanner: im Kiosk global aktiv (Opt-out `data-scan="nein"`, gesperrt während Zahlung); im Backoffice nur über `ScanTor` (G-22) in Feldern mit `data-scan="ja"`; außerhalb von Feldern öffnet ein erkannter Code die Palette mit dem Code. Scan-Zeichen lösen nie Kürzel aus. | E |

### 2.E Fehler, Leer, Laden

| Nr. | Regel | Prüfung |
|---|---|---|
| Q-E1 | Keine Seite endet als 500; jeder Fehlercode (`invalid|forbidden|not_found|conflict|rate_limited|unavailable|auth`) hat das UI-Muster aus 02 § 7.2 und erscheint dort, wo gearbeitet wurde. | E |
| Q-E2 | Leer-Zustand unterscheidet drei Fälle: noch nie Daten (Erklärung + erster Schritt), Filter leer („Filter zurücksetzen“), alles erledigt (ruhiges Häkchen in Sand, keine Aktion). Komponente `Leer`, Mindesthöhe 240 px, max. 2 Zeilen, keine Ausrufezeichen. | S |
| Q-E3 | Laden: Skeleton in Zielform erst nach 300 ms, dann mindestens 600 ms sichtbar; Spinner nur im Knopf (16 px) bei Aktionen > 300 ms; CLS < 0,05. | M, S |
| Q-E4 | Kein Technikbegriff in Texten (DocType, Frappe, 500, Timeout, Feldname, `snake_case`); Labels über `anzeige()`, Hilfetexte über `hilfetext()`, Umlaute korrekt. | U, S |
| Q-E5 | Sitzung läuft ab: Toast 2 min vorher mit „Verlängern“; abgelaufen → Overlay mit Login, Formulardaten bleiben, danach an gleicher Stelle weiter. Kiosk-Idle: 30-s-Band, dann Sperrbild (240 ms Fade), offener Bon wird pausiert. | E |

### 2.F Tastatur (Register `lib/backoffice/kuerzel/`, G-02)

| Nr. | Regel | Prüfung |
|---|---|---|
| Q-F1 | Ein zentrales Register mit Kontexten (global, zentrale, liste, karten, akte, palette, glocke, arbeitsplatz, kiosk-kassa, kiosk-packtisch, kiosk-mobil); Unit-Test „keine Doppelbelegung je Kontext“. Bereiche tragen nur in `kuerzel/<bereich>.js` ein. | U |
| Q-F2 | Global: `Strg/⌘+K` Palette · `/` Kontext-Suche · `?` Hilfe · `Strg+/` Kürzel-Dialog · `G`+Buchstabe Gehe zu (Liste K-10) · `N` Neu-Menü · `Strg/⌘+Z` und `Z` Rückgängig · `F8` Fokus Toast · `Strg+B` und `[`/`]` Seitenleiste · `Esc` oberste Ebene. | U, E |
| Q-F3 | Liste: `↑↓`/`J K`, `Enter` öffnen, **Leertaste Vorschau (SidePeek)**, `X` auswählen, `A` zuweisen, `S` Status, `D` fällig, `C` Kommentar, `1–9` Statuschip bzw. Reiter, `Shift+Enter` Zeilen-Primär. | E |
| Q-F4 | Akte: `E` bearbeiten, `Alt+1…6` Tabs, `Alt+↑/↓` vorige/nächste der Liste, `Strg+P` Druckpanel (nie Browserdruck), `Strg/⌘+S` speichern, `Strg/⌘+Enter` Primär. | E |
| Q-F5 | Bereichsaktionen nur `Shift+Buchstabe`; Aktionen mit Mail, Geld oder Außenwirkung haben **kein** Einzeltasten-Kürzel und öffnen höchstens den Dialog. Keine bereichseigenen `G`-Akkorde, kein `.`-Menü, keine `Alt+Buchstabe`, keine `Strg+Alt`. | U, R |
| Q-F6 | Einzeltasten wirken nie in Eingabefeldern und sind über „Einzeltasten-Kürzel“ im Benutzermenü abschaltbar (WCAG 2.1.4); aus → nur `Strg`/`F`-Kürzel und `Esc`. | E, A |
| Q-F7 | Kiosk ohne Einzelbuchstaben. Gemeinsam für alle Kioske: `F1` Hilfe · `Shift+F2` Bedienerwechsel/Sperren · `F12`/`Strg+Enter` Primär der Ansicht · `Strg+P` Druckmenü · `Strg+Z` Rückgängig · `Esc` oberste Ebene · `F11` Vollbild. Arbeitsplatz-Tasten: Kassa 10-Kassa § 2.5, Packtisch 10-Logistik § 6.6. `<kbd>` nur bei `data-tastatur="ja"`. | U, E |
| Q-F8 | `Esc` berührt Undo-Toasts nie; Abbruch nur über „Rückgängig“/`Z`/`Strg+Z`, sofort ausführen nur über Knopf „Jetzt ausführen“. | E |

### 2.G Gestaltung

| Nr. | Regel | Prüfung |
|---|---|---|
| Q-G1 | Farben nur über Rollen-Token `--color-bo-*` (03 § 1); keine Hex-Werte in Komponenten. Tinte = Handlung/aktiv/Fokus, Sand = Akzent/Orientierung, nie Handlung. | R |
| Q-G2 | Status = Farbe + Text + Form über `StatusBadge` und das Ton-Mapping 03 § 1.5 (grau → blau → türkis → orange → grün; rot nur Abbruch/Problem). „Gemahnt“ Stufe 1–2 orange mit Stufentext, Stufe 3 rot; „Ausgelaufen“ grau. | S |
| Q-G3 | Radius 6 (Steuerelemente) / 10 (Karten, Dialog) / 16 (Arbeitsplatz-Kacheln, Login) / Pille (Badge, Avatar). Karten ohne Schatten; Schatten nur für Schwebendes. | S |
| Q-G4 | Typografie: UI 14 px, Tabellen 13 px, Seitentitel 20/500, Overline 11 px Versal 0,12em; Gewicht nie 700; `tabular-nums` überall, wo Zahlen untereinander stehen; Beträge rechtsbündig. | S |
| Q-G5 | Bodoni Moda nur für Wortmarke (Seitenleiste, Login, Arbeitsplatz, Druck). Kopfzahl in Bodoni erst nach Inhaber-Entscheidung M-07; Kassa-Gesamtsumme Instrument Sans 44/600. | S |
| Q-G6 | Dichte: kompakt (Zeile 36, Control 32) bei feinem Zeiger, komfortabel (44/40) bei Touch und im Benutzermenü wählbar; Kiosk fix (Zeile 56, Control 48, Zahlentaste 64). Standard laut M-06. | S |
| Q-G7 | Icons nur lucide nach Vokabular 03 § 5, 16/20/24 px, immer mit Text oder `aria-label`; keine Emoji. | S, A |
| Q-G8 | Dialoggrößen sm 400 / md 560 / lg 800; Sheet 480 (lg 640); Popover Radius 6 mit `shadow-bo`; Toast 360 px. | S |
| Q-G9 | Hell und dunkel gleichwertig; `html[data-theme]` schaltbar, Standard System. Jede Seite wird in beiden Schemata fotografiert. | S |

### 2.H Bewegung (Quelle 04, Token in `bo-motion.css`)

| Nr. | Regel | Prüfung |
|---|---|---|
| Q-H1 | Nur Token: `--bo-dur-ack 50 · fast 120 · base 160 · move 200 · slow 240 · spring 320 · draw 400 ms`; Kurven `--bo-ease-out = cubic-bezier(0.22,1,0.36,1)` (= bestehendes `--ease-quiet`), `--bo-ease-in = cubic-bezier(0.4,0,1,1)`, `--bo-ease-inout = cubic-bezier(0.65,0,0.35,1)`, `--bo-ease-spring` nur Kanban-Ablage. Die Werte `(.2,.8,.2,1)` (02, Zentrale § 2.5) und `(0.2,0,0,1)` (05 § 15) entfallen. | R |
| Q-H2 | Eintritt 160–240 ms ease-out, Austritt 80–120 ms ease-in; nur `transform`, `opacity`, `clip-path`, `stroke-dashoffset` (+ Farbe bei Hover/Fokus ≤ 160 ms). | R |
| Q-H3 | Festwerte: Toast 160 ein / 120 aus · Dialog und Palette 160 (`scale .98→1`) / 120 · Sheet 200 (`translateX 16px→0`) / 120 · Popover 120 (`translateY -4px`) / sofort · Tooltip-Verzögerung 400 ms · Kanban-Drop 320 Spring, Rückkehr bei Fehler 200 · Phasenlinie 400 · Inline-Häkchen 600 · Zeilen-Hervorhebung 1200 Farbe. | E |
| Q-H4 | Server-gerenderter Erstzustand animiert nie; Kennzahlen zählen nur bei Änderung nach dem Laden hoch (400 ms), nie beim Seitenaufbau; Kassa-Summe zählt nie, nur Farbimpuls 160 ms. | E |
| Q-H5 | Stagger höchstens 3 Stufen à 24 ms, ab 8 Einträgen keiner; keine Spring außer Kanban; kein Bounce, Parallax, Konfetti; ein Erfolgsmoment je abgeschlossenem Vorgang, nicht je Speichern. | R |
| Q-H6 | `prefers-reduced-motion: reduce` → nur Opazität ≤ 120 ms; kein Shake (Rand `danger` + Text), kein Kollaps (Zeile sofort weg, Fokus auf nächste, Live-Region). Die Regel `* { transition-duration: 0.01ms }` wird ersetzt. | E (Projekt `reducedMotion`) |
| Q-H7 | Kiosk: keine Seitenübergänge, kein Stagger, keine Hover-Transitions; erlaubt sind Scan-Bestätigung, Druck-Feedback, Toast, Dialog, Erfolgsmoment. | R |
| Q-H8 | Animation blockiert nie den nächsten Klick oder Scan (`pointer-events` frei, abbrechen statt stapeln). | E |

### 2.I Barrierefreiheit (WCAG 2.2 AA)

| Nr. | Regel | Prüfung |
|---|---|---|
| Q-I1 | axe serious/critical = 0 auf jeder Route, hell und dunkel. | A |
| Q-I2 | Kontrast Text ≥ 4,5:1, Steuerelement-Ränder/Icons ≥ 3:1; Fokusring 2 px, Offset 2 px, nie verdeckt (`scroll-margin` 96 px unter sticky Leisten). | A, S |
| Q-I3 | Zielgröße: ≥ 24 px überall, 44 px Touch, 48 px Kiosk, 64 px Zahlentaste. | S |
| Q-I4 | Jede Zieh-Aktion hat einen Tipp- und Tastaturweg (Menü „Verschieben nach …“, `↑/↓`-Knöpfe 44 px); jede Wischgeste hat ein sichtbares Ziel. | E |
| Q-I5 | Tooltips sind nie einzige Quelle: Grund eines deaktivierten Knopfs steht als sichtbarer Text (12 px `muted`); am dichten Desktop zusätzlich Tooltip. | S |
| Q-I6 | Statusmeldungen über `aria-live="polite"` (Fehler mit Verlustgefahr `assertive`); Zähler mit `aria-live="off"`, Endwert im Text. | A |
| Q-I7 | Tabellen mit `<th scope>`, Kanban-Spalten als Listen mit `aria-label`, Raster (Kalender, Positionsliste, Plantafel) als `role="grid"` mit Roving-Tabindex, Dialoge `aria-modal` mit Fokusfalle und Rückkehr. | A |
| Q-I8 | Zeitlimits: Undo-Toasts pausieren bei Fokus; Freigaben haben kein Zeitlimit; Kiosk-Idle mit 30-s-Ankündigung. | E |
| Q-I9 | Je Bereich ein Screenreader-Durchlauf (NVDA Windows, VoiceOver iPad): Liste filtern, Datensatz öffnen, Primäraktion, Toast hören, Rückgängig. | A |

### 2.J Kiosk

| Nr. | Regel | Prüfung |
|---|---|---|
| Q-J1 | Kiosk-Seiten liegen in `src/app/(kiosk)/`, nutzen `KioskShell` (G-24), keine Seitenleiste, eine Aufgabe je Bildschirm, Rückweg „‹ Fertig“ oder `Esc`. | E |
| Q-J2 | Kiosk-Sitzung Idle 15 min; Bedienerwechsel per PIN; Leitungs-Freigabe am Ende im selben Dialog („Freigabe am Ende“, Kassa § 0.1), technisch über kurzlebige Freigabe-Sitzung (G-25). | E |
| Q-J3 | Toast-Anker je Kiosk über `KioskShell` (`toastAnker`): Kassa unten in der linken Spalte, Packtisch unten Mitte über dem Spaltenfuß, Montage/Technik über der Tableiste; max. 2 sichtbar. Ein Toast verdeckt nie die Primärtaste. | S |
| Q-J4 | Bänder (Offline, Training, SEE, Gerät gesperrt) nach Rang, nie blinkend, max. 2 sichtbar + „+n“; Offline in `warning`, `danger` nur bei „Zahlung ohne Beleg“. | S |
| Q-J5 | Nach jedem Zustandswechsel ist der neue Primärknopf 300 ms gesperrt (`useEingabesperre`, Ghost-Tap-Schutz). | E |
| Q-J6 | Kassa ohne Notbetrieb steht bei Netzausfall (bis Inhaber/StB, M-12); Bon und bezahlte Kartenzahlungen gehen nie verloren. Packtisch/Montage/Technik puffern Fotos, Unterschriften und Statusknöpfe sichtbar („2 Fotos werden gesendet“). | E |

### 2.K Texte

| Nr. | Regel | Prüfung |
|---|---|---|
| Q-K1 | Deutsch, Du-Form intern, Sie in Mails und Drucken. Knöpfe = Verb, max. 3 Wörter. Toast = Vergangenheit + Objekt („Rechnung RE-2026-0114 gestellt“). | S |
| Q-K2 | Keine Superlative, keine Floskeln („Erfolgreich“, „Super“), keine Ausrufezeichen, keine Emojis, keine erfundenen Zahlen. | R (Textliste), S |
| Q-K3 | Ein Wort, eine Bedeutung – Glossar § 3.1 ist verbindlich. | R |
| Q-K4 | Leerzeichen vor Einheiten (`4.800,00 €`, `12 Stk.`, `62 × 29 mm`); Geschlechtsneutral bei Rollen („Team Sortiment“, „Leitung Sortiment“). | S |

### 2.L Leistung (Budgets aus 02 § 12 / 05 § 13; Verstöße blockieren die Abnahme)

| Nr. | Regel | Prüfung |
|---|---|---|
| Q-L1 | Liste 25 Zeilen < 400 ms (Mock) / < 1,2 s (Frappe); Akte Kopf + erster Tab < 1,0 s, rechte Spalte gestreamt < 2,0 s; Dashboard < 2,5 s mit Kachel-Streaming. | M |
| Q-L2 | JavaScript je Route (gzip) ≤ 180 kB, Kassa ≤ 250 kB; CSS ≤ 60 kB; keine Chart- oder Animationsbibliothek; Icons selektiv. | M |
| Q-L3 | Frappe-Aufrufe je Seite: Liste ≤ 3, Akte ≤ 6 (mit Aggregat) / ≤ 12 (Rückfall), Dashboard ≤ 12 in 2 Wellen. | M (Server-Log) |
| Q-L4 | Optimistische Rückmeldung ≤ 50 ms sichtbar; Palette erste Treffer ≤ 150 ms (Mock) / ≤ 400 ms (Frappe); INP ≤ 200 ms. | M |

### 2.M Tests und Werkzeuge

| Nr. | Regel | Prüfung |
|---|---|---|
| Q-M1 | Reine Logik (Regeln, abgeleitete Status, Formeln, Kürzel, Texte) als `node --test`-Unit in `tests/unit/<bereich>-*.test.mjs`. | U |
| Q-M2 | E2E je Bereich in `tests/e2e/<bereich>-*.spec.js`, Projekte desktop + ipad, Kiosk zusätzlich `ipad-quer`; Screenshot-Specs mit `reducedMotion: "reduce"`. | E |
| Q-M3 | Jede Route ist in `tools/qa/routen/<bereich>.mjs` eingetragen und wird über `tools/qa/shoot.mjs` in 3 Viewports × hell/dunkel fotografiert; der Bericht hat 0 technische Befunde. Das lokale Bildmodell ist Zusatz, nie Abnahme. | S |
| Q-M4 | ESLint 0 Fehler; keine Änderungen in `Backend-Import/` durch Backoffice-Agenten; vor jedem Code den passenden Leitfaden in `backoffice/node_modules/next/dist/docs/` lesen (Next 16.4.1). | R |

---

## 3. Konsistenzprüfung über die 12 Konzepte

### 3.1 Begriffe (verbindliches Glossar)

| Begriff in der Oberfläche | Bedeutung | Nicht verwenden | Fundstellen, die angepasst werden |
|---|---|---|---|
| **Zu tun** | Arbeitsliste eines Bereichs bzw. der Zentrale, je Zeile ein Knopf | „Zu erledigen“, „Heute zu tun“, „Inbox“, „Arbeitsliste“ | CRM E3, Personal E9 (`ZuErledigen`), Logistik E15, Marketing `ZuTunListe` |
| **Heute-Leiste** | nur Zentrale: Chips „3 Termine · 2 Montagen …“ | „Heute-Zeile“ im Bereich | CRM E3 → Chips werden Filter von „Zu tun“ |
| **Kundenakte** | `/kunden/[kontakt]` | „Kontakt 360“, „Kundenkarte“ (!) für die Akte | – |
| **Auftragsmappe** | `/projekte/[projekt]` | „Infocenter“, „Projektakte“ | – |
| **Vorgangsleiste** | Punktleiste einer Kette (Projekt-Phasen, Anfrage-Kette, Belegkette, Servicefall-Phasen) | „Phasenleiste“ als eigene Komponente | 02 § 3, 05 § 5.2, Projekte § 4.2, Service § 0 |
| **Freigabe** | Zustimmung einer berechtigten Person (Leitung/GF) zu einem vorbereiteten Schritt (Vier-Augen); umfasst Bild-, Preis-, Lieferzeit-, Kulanz-, Erstattungs-, Urlaubs-, Newsletter-Freigabe | für Produkt-Workflow („Veröffentlichen“ ist kein Freigeben) | Sortiment E2 bleibt gültig |
| **Leitung bitten** | Mitarbeiter fragt eine gesperrte Aktion an (PH Aufgabe) | „Freigabe anfragen“, „Leitung informieren“ | Sortiment Glossar |
| **Rückgängig** | Undo im Toast | „Undo“, „Zurücknehmen“ (das ist Retoure) | – |
| **Zurücknehmen** | Retoure/Warenrücknahme | für Undo | Kassa |
| **Noch nicht verfügbar – {Ersatzweg}** | Fähigkeit aus | „Kommt mit dem nächsten Backend-Stand“ | Kassa § 0.4, Marketing § 0.3 |
| **An der Kassa kassieren** | Ersatzweg für Bar/Karte | „hier kassieren“ | Shop E1, Faktura E2 |
| **Annehmen** | Anfrage qualifizieren | „Qualifizieren“ | CRM E7; 05 § 4.4 Tabelle |
| **Nachfassen am** | Datum der Nachfass-Aufgabe | „Wiedervorlage“ | CRM E2 |
| **Gutschrift** (Oberfläche) / Drucktitel nach StB | Korrekturbeleg | – | Faktura E13 |
| **Bargeld** (Kassa-Kopf) | Einlage/Entnahme | „Kassenbuch“ als Knopf | Kassa |
| **Kundenmodus** | Bildschirm wird dem Kunden gezeigt, Internes aus | „Kundenansicht“, „Präsentationsmodus“, „KundenAnsicht“ | CRM E18, Faktura § 4, Projekte E6, Kundenkarte |
| **Kunde nicht informiert** | Chip nach kundenrelevanter Änderung | – | Projekte E5 (Muster für alle) |
| **Veröffentlicht / Wartet auf Veröffentlichung** | Produkt-Workflow | „Aktiv“, „Geprüft“ | Sortiment § 2 |
| **Abwesend** | Abwesenheit fremder Personen ohne Art | „Krank“, „Urlaub“ für Nicht-Leitung | Personal E2, Zentrale |
| **Testmodus** | Mandant/Shop simuliert | „Demo“, „Sandbox“ | – |
| **Training** | Kassa-Trainingsmodus | „Testmodus“ an der Kassa | Kassa |

Statuswerte bleiben in Frappe unverändert; die Anzeige läuft über `anzeige()` plus bereichseigene Texttabelle `lib/backoffice/<bereich>/texte.js` (Muster Sortiment § 2).

### 3.2 Muster-Entscheidungen (Kollisionen zwischen 01–05 und den Konzepten)

| Nr. | Thema | Fundstellen (Widerspruch) | Entscheidung |
|---|---|---|---|
| K-01 | Undo-Dauer | 02: 8 s · 04: 5 s · CRM/Projekte: Mails 10 s · Kassa: 6 s · Service: Kiosk 5 s | Backoffice **8 s** für alles; Kiosk **6 s** (Kassa, Packtisch, Montage, Technik, Check-in). |
| K-02 | Undo-Technik | Zentrale § 2.5/§ 13.3: Gegenaktion Standard · Personal/Projekte/Faktura/Logistik/Sortiment/Shop: verzögerter Commit · Service: Server-Job | Q-C3: Variante A für Übergänge/Mails/Außenwirkung/Geld, Variante B nur Feldwerte. Eine Implementierung G-03 (Client-Timer + Server-Register mit Nachlauf). Zentrale § 13.3 „Gegenaktion als Standard“ entfällt. |
| K-03 | Undo-Taste | 02: `⌘Z` · 04: `Z` | beide im Backoffice; Kiosk nur `Strg+Z`. |
| K-04 | `Esc` und Toast | 03/04: Esc schließt jüngsten Toast · Shop E5: Esc berührt Toast nie | Shop E5 (Q-F8). |
| K-05 | Toast-Position | 02: unten Mitte · 03/05/Zentrale: unten rechts, Kiosk oben Mitte · Kassa: linke Spalte · Logistik: Packtisch unten Mitte | Backoffice unten rechts; Kiosk über `toastAnker` (Q-J3). „Kiosk oben Mitte“ entfällt. |
| K-06 | Toast-Stapel | 03: 3 · Kassa: 2 · 04: heute 5 | Backoffice 3, Kiosk 2; gleichartige werden zusammengefasst („3 Anfragen angenommen“), nie verdrängt. |
| K-07 | Easing | 02/Zentrale `(.2,.8,.2,1)` · 05 `(0.2,0,0,1)` · 03/04/Fundament `(0.22,1,0.36,1)` | 04 + Fundament (Q-H1). |
| K-08 | Dialog-/Sheet-Dauer | 03: 240/160 · 04: 160/200 · Zentrale: Palette 140 | 04 (Q-H3); Palette = Dialog 160 ms. |
| K-09 | Kennzahl hochzählen | 02 § 13: nie · 04 § 3.7: nur nach dem Laden · 05 § 15 Kassa: nie | Q-H4 (nach dem Laden 400 ms; Kassa nie). |
| K-10 | `G`-Akkorde | 02, 05, Zentrale, Kundenkarte (`G K`), Personal (`g t`), Logistik (`g l`), Sortiment (`G A`/`G O`) unterschiedlich | Endliste: `G Z` Zentrale · `G A` Aufgaben · `G B` Benachrichtigungen · `G C` CRM · `G P` Projekte · `G F` Faktura · `G S` Shop · `G O` Sortiment · `G L` Logistik · `G V` Service · `G H` Kundenkarte · `G M` Marketing · `G T` Personal · `G K` Kassa-Verwaltung · `G E` Einstellungen · `G D` Druck · `G W` Verwaltung. Kundenkarte `G K` → `G H`; Sortiment `G A` → `G O`. Nach `G` erscheint die Zielzeile unten links. |
| K-11 | Leertaste | 02: Auswahl · 01/CRM/Faktura: Vorschau | Leertaste = Vorschau (SidePeek), `X` = Auswahl (W1). Shift+Klick = Bereich wählen (W2). |
| K-12 | Zeilen-Primär | 05: `Enter`+`a` · 02: `A` = Zuweisen | `Shift+Enter` (W3). |
| K-13 | `p`, `e`, `f`, `k` | 05: `p` Drucken und Projekt, `e` CSV, `f` Filter · Shop: `k` Kundenakte | Drucken `Strg+P`; Projekt aus Beleg `Shift+P`, Kunde aus Akte `Shift+K`; `E` = Bearbeiten; CSV ohne Kürzel; Filter = `/`. |
| K-14 | Akte-Tabs | 02: `Alt+1…9` · 05: `1–9` | Akte `Alt+1…6`; Liste `1–9`. |
| K-15 | Kiosk-Bedienerwechsel | Zentrale: `F12` · Kassa/Logistik: `Shift+F2`, `F12` = Primär | Kassa/Logistik (Q-F7). Zentrale § 2.4 Kiosk-Zeile wird nachgezogen. |
| K-16 | Unternavigation | 05/Bereiche: Pills, aktiv Sand · 02/Sortiment: Tabs, aktiv Tinte | Tabs, aktiv Tinte (Q-B3, W13/W19). Bereichskomponenten `*Pills`/`SortimentTabs` entfallen. |
| K-17 | Bereichsstart | 02: Kennzahlen (6) + Heute + Listen · Bereiche: „Zu tun“ + 4 Kennzahlen | Q-B4 (W22). |
| K-18 | Akte-Tabs Anzahl | 05: Kundenakte 12, Mappe 12 · CRM 6, Projekte 6, Faktura 5, Service 5, Sortiment 5 | ≤ 6 (Q-B6). Kundenakte nach CRM E4, Mappe nach Projekte E1. |
| K-19 | Fähigkeit aus: zeigen oder ausblenden | Kassa/Marketing: immer deaktiviert zeigen · Faktura/Logistik/Personal/Projekte: ausblenden · Shop E20: erwartet zeigen, sonst aus | Shop E20 (Q-A7) für alle. Dateien heißen einheitlich `lib/backoffice/<bereich>/faehigkeiten.js` (bisher teils `schalter.js`). |
| K-20 | Grund deaktivierter Knöpfe | 02 § 8: Tooltip · Kassa K-00f/Zentrale: sichtbarer Text | Text (Q-I5). |
| K-21 | Scanner in Feldern | 02: Opt-in · Kassa: Opt-out | Q-D8 (Kiosk Opt-out, Backoffice Opt-in über `ScanTor`). |
| K-22 | Zeilenhöhe / Dichte | 02: 40/52 · 03: 36/44 · Zentrale: Standard komfortabel | 03-Werte; Standard M-06. |
| K-23 | Seitenleiste eingeklappt | 02/05: 56 px · 03/Fundament: 64 px | 64 px. |
| K-24 | Hilfe-Panel | 02: 360 px, `?` · Zentrale: Knopf in Kopfzeile, 480 px, `Strg+/` Kürzel | Zentrale: 480 px, Knopf zwischen Glocke und Avatar, Kiosk `F1` + Knopf 48 px. |
| K-25 | Relative Zeit | 02: bis 7 Tage · 03: < 24 h | 03 (Q-A5). |
| K-26 | Kassa-Raster | 03/05: drei Spalten 3/5/4 · Kassa: zwei Spalten 8/4 | Kassa § 0.1 (zwei Spalten). |
| K-27 | Montage-Kiosk | Projekte § 2: Tabs Heute · Woche · Tour · Logistik E3: Heute · Woche · Suche · Ich, `/tour` → `/montage` | Logistik E3: **ein** „Heute“ mit Montage- und Tour-Stopps; Tableiste `Heute · Woche · Suche · Ich`; Projekte baut `/montage`, Logistik liefert Tour-Bausteine. |
| K-28 | Freigabe-Darstellung | Service UX: aufgeklappter Eintrag = Bestätigung · Zentrale: geldwirksam mit Dialog | Zentrale (Q-C7), Service E1 bestätigt. |
| K-29 | Assistent vs. Dialog | 05: A1–A15 als Assistenten · Bereiche: meist Dialog/Sheet (CRM E5, Faktura E10, Logistik E17, Personal E8) | Bereichsentscheidungen gelten; Assistent (T6) nur, wenn Schritte voneinander abhängen (Teil-/Schlussrechnung, Retoure, Tagesabschluss, Inventur-Zählen, Einstellen/Austritt, Preisliste). 05 § 14.1 wird zum Katalog „Abläufe“ mit Form je Eintrag (Doku-Team). |
| K-30 | Undo-Commit-Route | CRM `api/crm/undo-commit`, Logistik `logistik/commit`, Personal/Faktura/Shop/Sortiment „falls Fundament nicht liefert“ | Keine Bereichs-Route. G-03 ist Vorbedingung jedes Bereichsbaus (§ 5.4 Gate G0). |
| K-31 | Kürzel-Registry | CRM `crm/kuerzel.js`, Projekte `lib/backoffice/kuerzel.js` „falls Fundament nicht liefert“ | Zentral `lib/backoffice/kuerzel/` (G-02), Bereichsdateien nur als Einträge. |
| K-32 | Fundament-Paketnummern | F1–F8 sind je Konzept verschieden belegt (CRM F2=Commit, Logistik F1=Kürzel, Personal F1=Stempelpille …) | Nummern aus den Konzepten sind ungültig; maßgeblich sind G-01…G-31 (§ 4) und die Pakete P0-1…P0-9 (§ 5). Bereichsagenten verweisen nur noch auf G-Nummern. |
| K-33 | Gutschein | Shop E2: Verkauf nur Kassa, Shop nur „ohne Verkauf“ · Marketing E5: Aktion-Gutschein gesperrt · Kassa E11: `sell_voucher` nach Buchung | alle drei gelten zusammen; Art Mehrzweck bis StB (91 Nr. 3/13). |
| K-34 | Vier-Augen-Grenze | Zentrale: 0 € (immer zwei Personen) · Shop: 1.000 € Erstattung | bis M-09 gilt 0 € überall. |
| K-35 | Bodoni-Kopfzahl | 03: Zentrale + Kiosk-Summe · Kassa: Instrument Sans · Zentrale: nur nach Entscheidung | Q-G5. |
| K-36 | Stempeln | Personal E6: Stempelpille in jeder Shell-Kopfzeile + Kiosk-Knopf | Shell bekommt einen **Kopfzeilen-Slot** (G-26), Personal füllt ihn; im Kiosk nur auf Kassa und Packtisch, nicht während Zahlung. |

### 3.3 Routen-Kollisionen

| Nr. | Route | Betroffen | Entscheidung (Besitzer) |
|---|---|---|---|
| R-01 | `/kunden/[kontakt]` | CRM (Rahmen), Projekte, Faktura, Shop, Service, Marketing, Kundenkarte (Inhalte) | **CRM** besitzt Route und Rahmen (6 Tabs nach CRM E4). Andere Bereiche liefern Abschnitte über die Akte-Slots (G-14), nie eigene Dateien unter `app/kunden/`. `/crm/kontakte/[name]` → 307. |
| R-02 | `/projekte/[projekt]` | Projekte (Rahmen), Faktura, Logistik, Sortiment, Service (Abschnitte) | **Projekte**; Slots wie R-01. |
| R-03 | Datenschutzanfrage `/datenschutz/[name]` (Zentrale) ↔ `/crm/datenschutz/[name]` (CRM) | Zentrale, CRM, Shop E17, Service | **CRM** besitzt `/datenschutz` und `/datenschutz/[name]` (DocType liegt in ph_crm); `/crm/datenschutz/*` → 307. Zentrale zeigt Hub-Karte und Fristen-Chip. Auskunft-Druck: `/druck/vorlage/dsgvo-auskunft?kontakt=` (CRM). `/kunden/[kontakt]/dsgvo` (05) entfällt. |
| R-04 | `/montage`, `/tour` | Projekte, Logistik | **Projekte** besitzt `(kiosk)/montage/`; `/tour` → 307 `/montage`; Logistik-Bausteine in `components/Backoffice/Logistik/Tour/` (K-27). |
| R-05 | `/packtisch` | Logistik, Sortiment (Wareneingang am Packtisch), Kundenkarte | **Logistik**; Wareneingang-Ansicht kommt als Baustein von Sortiment (`components/Backoffice/Sortiment/Wareneingang/`), Logistik bindet ein. |
| R-06 | `/kassa` (Kiosk) und `/kassa/verwaltung/*` | Kassa, Kundenkarte (Lookup), Shop (Gutschein) | **Kassa** beide; Kundenkarte liefert Lookup-Baustein, Shop die Gutschein-API-Hülle in `lib/backoffice/shop/gutschein.js`. |
| R-07 | Druckrouten: `/druck/[doctype]/[name]` ↔ Kassa `/druck/kassenbeleg/[name]`, `/druck/zaehlliste`, Sortiment `/druck/report/[name]`, Kundenkarte `/druck/ph-kundenkarte-stufe/[stufe]` | alle | Drei Formen, Besitzer **Zentrale (Druck)**: `/druck/[doctype-slug]/[name]` (Slug wie `doctypeSlug()`: `ph-kassenbeleg`), `/druck/bericht/[report]?…` (Bericht-PDF), `/druck/vorlage/[vorlage]?…` (Zählliste, Kassenbuch, Namensschilder, DSGVO-Auskunft). Bereiche registrieren Vorlagen in `lib/backoffice/druck/<bereich>.js`. |
| R-08 | `(kiosk)/checkin/[event]` | Marketing | Marketing baut die Route; Kachel in `/arbeitsplatz` erst nach Inhaber-Entscheidung M-13; bis dahin Start aus der Event-Akte. |
| R-09 | `/aufgaben` | Zentrale, CRM (Filter/Zeilen), alle (Aufgaben anlegen) | **Zentrale**; CRM und andere liefern Zeilen-Renderer über `lib/backoffice/aufgaben/<bereich>.js`. |
| R-10 | `/geraet` (dieses Gerät) und `/geraete` (Verwaltung) | Zentrale, Kassa | beide **Zentrale**; Kassa liefert Kassen-/Terminal-Felder als Abschnitt. |
| R-11 | `/arbeitsplatz`, `/wechsel`, `/login` | Zentrale, Kassa, Marketing, Personal | **Zentrale**; Kacheln aus Register `lib/backoffice/arbeitsplaetze.js` (G-01). |
| R-12 | `/personal/zeiten`, `/personal/abwesenheiten` | Personal E10 | 307 auf `/personal/team?tab=…`. |
| R-13 | `/projekte/zeitplan` | Projekte E15 | 307 auf `/projekte/liste?ansicht=zeitplan`. |
| R-14 | `/shop/anzahlungen/neu` | Shop E14 | entfällt; Anlage nur in Faktura. |
| R-15 | `/suche`, `/benachrichtigungen`, `/hilfe/**`, `/verwaltung`, `/protokoll`, `/einstellungen`, `/benutzer/**` | Zentrale | **Zentrale**; Bereichs-Einstellungen als `?tab=` der Bereichsseite `/<bereich>/einstellungen`, nicht unter `/einstellungen`. |
| R-16 | API-Routen | mehrere | Nur Fundament schreibt `src/app/api/**`: `suche`, `link`, `datei`, `ping`, `ereignisse` (SSE), `undo-commit`, `revalidate`, `geraet/ping`, `kassa/puffer` (reserviert). Bereiche brauchen keine eigenen API-Routen; Ausnahme nur mit Eintrag in § 3.5. |

### 3.4 Komponenten-Kollisionen (gleiche Sache, mehrere Namen)

| Nr. | Gleiche Sache in den Konzepten | Wird zu (Fundament) |
|---|---|---|
| C-01 | `CrmPills`, `FakturaPills`, `LogistikPills`, `PersonalPills`, `ProjektePills`, `ShopPills`, `SortimentTabs`, Marketing `Unternav` | G-10 `Unternav` |
| C-02 | `ZuErledigen` (Personal), `ZuTunListe` (Marketing), „Zu tun“ (Faktura, Sortiment, Kundenkarte), „Heute zu tun“ (Logistik), `AbschlussListe` (Faktura, Monatsabschluss bleibt eigene Liste) | G-11 `ZuTun` |
| C-03 | `Vorgangsleiste` (CRM als eigene, Faktura Belegkette, Projekte 9 Phasen, Service 6 Phasen) | G-12 `Vorgangsleiste` (generisch, `schritte[]`) |
| C-04 | `LeitungBitten` (Faktura, Sortiment, Kundenkarte) | G-05 `LeitungBitten` |
| C-05 | `NichtVerfuegbar` (Shop), `SperrHinweis` (Marketing), Kassa-Fähigkeiten-Text | G-04 `Faehigkeit` |
| C-06 | `Seitenblick` (Sortiment), `SidePeek`, Vorschau-Sheet (CRM, Faktura, Marketing `AuskunftPeek`) | G-07 `Sheet` mit Variante `peek` |
| C-07 | `Unterschrift` (Logistik), `Unterschriftsfeld` (Faktura), Kassa, Projekte (Abnahme), Service (Einsatz) | G-23 `Unterschrift` |
| C-08 | `ErgebnisKarte` (Kundenkarte, Kassa, Faktura „Ergebniskarte“, Logistik) | G-16 `ErgebnisKarte` |
| C-09 | `Praesentationsmodus` (Faktura), Kundenansicht (CRM), `KundenAnsicht` (Projekte), `Kundenmodus` + `BedienerRueckkehr` (Kundenkarte) | G-20 `Kundenmodus` |
| C-10 | `CrmBericht`, `FakturaBericht`, `LogistikBericht`, `PersonalBericht` | G-13 `BerichtSeite` |
| C-11 | `Erstbesuch` (CRM), `ErsteSchritte` (Marketing) | G-27 `Erstbesuch` |
| C-12 | `AusstehendBadge` (Shop), gestrichelter Phasenring (Projekte), „wird in 6 s gespeichert“ | G-03 `Ausstehend` |
| C-13 | `AnDieKassa` (Shop), Hinweiszeilen Faktura E2, Logistik E11, Projekte E14, Service | G-19 `AnDieKassa` |
| C-14 | Kunde-informieren-Sheets (Projekte § 3.5, Logistik Avis, Service `kunde_informieren`, CRM Terminbestätigung) | G-18 `Informieren` |
| C-15 | `Druckvorschau` (Faktura), `DruckPanel` (05), Druckmenü Kiosk | G-17 `DruckPanel` |
| C-16 | `Kalender`, `Slotraster` (CRM, Personal, Projekte, Service, Marketing), Plantafel-Grid (Logistik) | G-21 `Kalender` + `Raster` (`role="grid"`) |
| C-17 | `Zahlentastatur`, `Stepper48`, `Wischaktion`, `Positionsgrid` (Kassa; Packtisch braucht sie auch) | G-24 Kiosk-Bausteine |
| C-18 | `KartenSuche` mit Scan-Tor (Kundenkarte), `KameraScan`, `CodeScan` (Marketing Check-in), `LagerScanSheet` (Logistik) | G-22 `ScanTor` + `KameraScan`; Bereichs-Sheets bleiben im Bereich |
| C-19 | `PersonZelle` (Marketing), Avatar-Zellen überall | G-28 `PersonZelle` |
| C-20 | `ZweiKlickKnopf` (Shop) | G-29 `ZweiKlickKnopf` |
| C-21 | `FreigabeEintrag` (Zentrale), Glocken-Inline-Aktionen (CRM F5, Personal F5, Projekte F5) | G-15 `FreigabeEintrag` + Glocke v2 |
| C-22 | `useAutosave`/Speicheranzeige (CRM), `Speicherleiste` (Zentrale, Kundenkarte, Service) | G-09 `Speicherleiste` + `useAutosave` |
| C-23 | `NachweisAufnahme` (Kundenkarte), Foto-Upload Montage/Technik/Wareneingang | G-30 `FotoAufnahme` (mit Warteschlange) |

### 3.5 Gemeinsam genutzte Dateien (Schreibkollisionen)

Heute schreiben laut Konzepten mehrere Bereiche in dieselben Fundament-Dateien. Das Fundament-Team (P0-1) teilt sie **vor** dem Bereichsbau auf; danach schreibt jeder Bereich nur in seine eigene Teildatei.

| Datei heute | Konflikt | Neu (nach P0-1) | Schreibt |
|---|---|---|---|
| `lib/backoffice/bereiche.js` | alle 12 tragen Navigation, Kanban, `ROUTEN` ein | `lib/backoffice/bereiche/index.js` + `bereiche/<bereich>.js` | Bereich in eigener Datei |
| `lib/backoffice/suche.js` (`SCHNELLAKTIONEN`) | alle | `suche/index.js` + `suche/<bereich>.js` | Bereich |
| `lib/backoffice/mock/seed.js` | alle | `mock/seed/index.js` + `mock/seed/<bereich>.js` | Bereich |
| `tools/qa/routen.mjs` | alle | `tools/qa/routen/index.mjs` + `routen/<bereich>.mjs` | Bereich |
| Kürzel | CRM/Projekte eigene Registries | `lib/backoffice/kuerzel/index.js` + `kuerzel/<bereich>.js` | Bereich |
| Fähigkeiten | `schalter.js`/`faehigkeiten.js` je Bereich | `lib/backoffice/faehigkeiten.js` (Kern) + `<bereich>/faehigkeiten.js` | Bereich |
| Freigaben | Zentrale + Service + Shop + Sortiment + Personal + Marketing | `lib/backoffice/freigaben/index.js` + `freigaben/<bereich>.js` | Bereich |
| Aufgaben-Renderer | Zentrale + CRM + alle | `lib/backoffice/aufgaben/<bereich>.js` | Bereich |
| Akte-Slots | Kundenakte/Mappe | `lib/backoffice/akte/slots/<bereich>.js` | Bereich |
| Druckvorlagen | alle | `lib/backoffice/druck/<bereich>.js` | Bereich |
| `app/arbeitsplatz/page.js` | Marketing (Check-in), Personal (Stempeln) | Register `lib/backoffice/arbeitsplaetze.js` | nur Zentrale |
| `src/app/globals.css` | Motion, Design, Bereiche | `globals.css` (Token, Team P0-2) importiert `bo-motion.css` (Team Q2) | keine Bereiche |
| `backoffice/hilfe/**` | alle | `hilfe/<bereich>/<seite>.md` | Doku-Team Q5 (Bereiche liefern Rohtext in `lib/backoffice/<bereich>/texte.js`) |
| `mock/zusatzMeta.js` (Kundenkarte) | Platzhalter-Metas | bleibt, nur Kundenkarte | Kundenkarte |

### 3.6 Bewusste Abweichungen, die bestehen bleiben

Diese Abweichungen der Konzepte von 01–05 sind geprüft und gelten weiter (Doku-Team zieht 01–05 nach): Kassa K-00a…K-13 (10-Kassa § 0.3), CRM E20 (Telefon-Bearbeitung für Berater), Logistik E4 (Unterschrift beide Ausrichtungen statt Querformat), Projekte E3 (eine Unterschrift unter Abnahme), Marketing E7 (Kanban nur Social), Faktura E5 (kein Rechnungen-Kanban), Kundenkarte (Anträge ohne Kanban).

---

## 4. Gemeinsame Komponenten (vor den Bereichen zu bauen)

Ort jeweils unter `backoffice/src/components/Backoffice/…` bzw. `src/lib/backoffice/…`. „Paket“ verweist auf § 5.2. Jede Komponente: hell/dunkel, kompakt/komfortabel/Kiosk, `prefers-reduced-motion`, Mock-Demo-Seite unter `/einstellungen?tab=system&baustein=<name>` (nur Admin, nur Mock) für QA-Screenshots.

### G-01 Register: Routen, Navigation, Palette, Arbeitsplätze, Seed – Paket P0-1

- `bereiche/<bereich>.js` exportiert `{ slug, titel, icon, navigation[{titel, href, recht?, zaehler?}], routen{doctype: (name)=>href}, kanban[] }`; `bereiche/index.js` setzt Reihenfolge Q-B2 und baut `ROUTEN` + 307-Umleitungen für `/d/*`.
- `suche/<bereich>.js`: `schnellaktionen[{id, titel, href|action, recht, kuerzel?}]`, `nummernmuster[{regex, doctype}]`, `hilfe[{titel, pfad}]`.
- `arbeitsplaetze.js`: Kacheln `{slug, titel, icon, rollen[], route, nurWenn?(session)}`; Ziffern `1–5` (später 6).
- `mock/seed/<bereich>.js`: `export default (db) => {…}`; Reihenfolge-Abhängigkeit über `export const nach = ["crm"]`.
- Fehlerfälle: Slug doppelt, Route doppelt → Unit-Test schlägt fehl. Leer: Bereich ohne Navigation erscheint nicht.

### G-02 Kürzel-Register – P0-1

- `kuerzel/index.js`: `registriere(kontext, taste, {id, titel, wirkung, einzeltaste:boolean})`, `aufloesen(event, kontexte[])`, Mac-Auflösung `Strg`→`⌘`, Schalter „Einzeltasten-Kürzel“ (Benutzer, Standard an, gespeichert wie Dichte).
- Hook `useKuerzel(kontext, map)` ersetzt direkte `useTastenkuerzel`-Nutzung in Bereichen (Kiosk-Hook bleibt als Unterbau).
- `G`-Sequenz: Fenster 1,5 s, Zielzeile unten links (12 px, `surface-inverse`), `Esc` bricht ab.
- Kürzel-Dialog `Strg+/`: durchsuchbar, gruppiert nach Kontext, zeigt nur Einträge mit Recht.
- Tests: keine Doppelbelegung je Kontext; Einzeltasten nie in `input, textarea, select, [contenteditable], [data-scan]`.

### G-03 Verzögerter Commit, Toast v2, `Ausstehend` – P0-3

- **Server:** `lib/backoffice/commit/` – `planeCommit(session, {action, args, schluessel, objekt})` speichert die Absicht im Sitzungs-Store (Schnittstelle wie `MemorySessionStore`, Produktion Redis) mit Token und Frist; `commitAction({token})` führt genau einmal aus (idempotent); `verwerfeCommit({token})`; Nachlauf: nicht bestätigte und nicht verworfene Tokens werden 30 s nach Ablauf serverseitig ausgeführt und im Protokoll vermerkt (nie still verworfen). Route `POST /api/undo-commit` (Origin-Prüfung, sendBeacon-tauglich, Token im Body).
- **Client:** `useVerzoegerterCommit()` → `{ starte(text, {token, ms, objekt}), flush(objekt?), ausstehend(objekt) }`; Queue je Datensatz; `pagehide`/`visibilitychange` → `navigator.sendBeacon('/api/undo-commit', {tokens})`.
- **Toast v2** (`Toast.js`): Arten ok/info 4 s, warnung 6 s, fehler bis geschlossen, undo 8 s (Kiosk 6 s); 360 px; Stapel 3 (Kiosk 2); Zusammenfassen gleichartiger („3 Anfragen angenommen · Rückgängig“ nimmt alle zurück); Undo-Balken 2 px Sand, `scale-x 1→0` linear, pausiert bei Hover/Fokus/Berührung; Timer ist die einzige Wahrheit (nicht `animationend`); bei `reduce` Text „Rückgängig (6 s)“ zählt sekündlich. Knöpfe „Rückgängig“ (`Z`, `Strg+Z`) und „Jetzt ausführen“. `F8` fokussiert. Anker-Prop für Kiosk (`toastAnker`).
- **`Ausstehend`**: Chip 12 px `muted` mit gestricheltem Ring „wird in 6 s gespeichert“; Zeile bleibt im Filter stehen bis Commit; nach Commit Zeilen-Hervorhebung 1200 ms.
- Fehlerfälle: Commit scheitert nach Ablauf → Toast fehler „Annehmen von AN-… hat nicht geklappt – {Grund}“ + Glocke-Eintrag; Datensatz zurück in alten Zustand. Netz weg beim Beacon → Nachlauf übernimmt.
- Tests: Unit (Queue, Idempotenz, Nachlauf), E2E (Undo innerhalb 8 s → kein Server-Aufruf; Tab schließen → ausgeführt).

### G-04 Fähigkeiten – P0-1

- `faehigkeiten.js`: `faehigkeit(session, "kassa.retoure") → { an, grund, ersatz?: {titel, href} , erwartet: boolean }`; Frappe-Modus: Feld-/Methoden-Probe (`getMeta`, Probeaufruf) mit Cache 5 min; Mock: `BACKOFFICE_MOCK_FAEHIGKEITEN` (`alle`, `-kassa.retoure`, kommagetrennt).
- Komponente `<Faehigkeit id kind>`: an → Kind; aus + erwartet → Kind deaktiviert + Text 12 px `muted` „Noch nicht verfügbar – {ersatz}“ (Link); aus + nicht erwartet → nichts.
- QA: Screenshot-Lauf je Bereich zweimal (alle an / alle aus).

### G-05 `LeitungBitten` – P0-5

- Sekundärknopf „Leitung bitten“ → Mini-Dialog (sm) mit vorbelegtem Text und optionalem Kommentar → `PH Aufgabe` an die Bereichsleitung mit Bezug; danach Zustand „Angefragt bei Leitung · 09:14“ mit Link zur Aufgabe. Idempotent je Objekt/Aktion/Tag. Fehlt `create` auf PH Aufgabe: Knopf ausgeblendet (Zentrale-Regel, keine Schein-Aktion).

### G-06 Popover, Tooltip, Dialog-Größen – P0-4

- `Popover`: Fokusfalle optional, `role="menu"|"dialog"`, Flip, 8 px Abstand, unter 640 px als Bottom-Sheet mit Griff 32×4; Öffnen 120 ms.
- `Tooltip`: Auslösung Hover und Fokus, 400 ms, Gruppe 0 ms, max. 240 px, nie interaktiv, im Kiosk aus.
- `Bestaetigen`/Dialog: Größen sm/md/lg, Titel als Frage mit Fakten, Fuß `[Abbrechen] [Primär]`, rote Aktion Fokus auf Abbrechen, `Esc` nicht während laufendem Vorgang, unter 640 px Bottom-Sheet.

### G-07 `Sheet` (inkl. Peek) – P0-4

- Rechts 480 (lg 640, Service 400 als `sm`), volle Höhe, Kopf 56 (Titel, `maximize-2` zur Vollseite, `x`), Scrim 0,2; Variante `peek` für Listen: Leertaste öffnet, `J/K`/`↑↓` blättert, Tabelle markiert Zeile; `?panel=<name>` in der URL; ungespeicherte Änderungen → Rückfrage beim Schließen; 200/120 ms.

### G-08 `Lightbox` – P0-4

- Bilder/PDF eines Objekts, Pfeile, `Esc`, Zoom 1×/2×, Bildquelle und Freigabestatus als Zeile; Download nur mit Recht (Sortiment Freigabe-Umfang).

### G-09 `Speicherleiste` + `useAutosave` – P0-5

- `useAutosave({speichern, verzoegerung:1000})` → Status `gespeichert(zeit) | speichert | nicht-gespeichert | fehler`; Kopfanzeige „Gespeichert 14:05“ / „Nicht gespeichert“ `warning-text`.
- `Speicherleiste` (vorhanden im Formular, wird eigenständig): „Ungespeichert · Verwerfen · Speichern“, haftet unten in der Inhaltsspalte, belegt Platz, `Strg/⌘+S`; behebt QA-Befunde 3/4.

### G-10 `Unternav` – P0-5

- Props `eintraege[{titel, href, zaehler?, recht?}]`, `aktiv`; Tabs mit 2 px Unterstrich Tinte (Wechsel 200 ms `--bo-ease-inout`), max. 7 + „Mehr ▾“, horizontal scrollbar mit Randverlauf, `aria-current="page"`.

### G-11 `ZuTun` – P0-5

- Server-Komponente mit Quellen-Registern je Bereich `{id, titel, zaehle(session), lade(session, limit), knopf:{titel, action|href}}`; Zeile = Icon · Satz („3 Preise laufen ab“) · Zähler · ein Knopf; Filter-Chips oben (ersetzen CRM-Heute-Zeile); max. 5 Zeilen sichtbar + „Alle n“; leer = „Alles erledigt“ (Fall 3 von Q-E2); jede Quelle eigener `<Suspense>`; Fehler einer Quelle → nur diese Zeile zeigt „Konnte nicht geladen werden · Erneut“.

### G-12 `Vorgangsleiste` – P0-5

- Props `schritte[{id, titel, zustand: erledigt|aktuell|teilweise|offen|uebersprungen, datum?, plan?, objekte[{titel, href}]}]`, `naechster?{titel, aktion, blocker?}`, `kompakt?`.
- Punkte: erledigt gefüllt Tinte, aktuell Ring Sand gefüllt, teilweise halb (`◐`), offen hohl `line-strong`; Punkte sind `<button>` mit Popover der Objekte, aktueller `aria-current="step"`; darunter Datum/KW/„–“; Zeile „Nächster Schritt“ mit genau einer Aktion oder Blocker-Satz mit Link.
- Kompakt (Liste/Karte): Punkte 6 px ohne Text, `title`. Mobil: nur aktuelle Phase + nächster Schritt.
- Bewegung: Linie füllt 400 ms `--bo-ease-out`, Punkt `scale .8→1` 200 ms; reduce: keine.
- Nutzer: Projekte (9 Phasen aus `PH Projekt.status`), CRM (Anfrage → Termin → Gespräch → Angebot → Auftrag), Faktura (Belegkette), Service (6 Phasen).

### G-13 `BerichtSeite` – P0-5

- T8: Seitenkopf, Filterformular (Zeitraum mit `Datumsfeld`, Bereichsfilter), `DataTable` ohne Paging mit Summenzeile, `Charts`, Export CSV (nur `export`-Recht, protokolliert) und PDF über `/druck/bericht/[report]`; Zeitlimit 8 s → Hinweis „Zeitraum eingrenzen“; leer „Keine Daten im Zeitraum“.

### G-14 Akte-Gerüst und Slots – P0-5

- `AkteKopf` (≤ 2 Zeilen: Titel/Nummer, Status, Betrag optional rechts `2xl`, Primärknopf, `⋯`), `AkteTabs` (≤ 6, `Alt+1…6`, Tabs lazy), `RechteSpalte` (Aktivität · Details · Bezüge; ab 1280 px sichtbar, sonst Tab), `Band` (max. 1, Rangfolge je Bereich), `Bezuege` aus `lib/backoffice/bezuege.js` (05 § 5.3: Vorher · Gleichzeitig · Nachher, Zähler, „+ anlegen“ nach Recht).
- **Slots** für Kundenakte und Auftragsmappe: `akte/slots/<bereich>.js` exportiert `{ akte:"kunde"|"projekt", tab, reihenfolge, titel, recht(session), lade(session, id), Komponente }`; CRM/Projekte rendern die Slots in ihren Tabs. Ein Slot, der fehlschlägt, zeigt nur seinen Abschnitt als Fehlerblock.

### G-15 `FreigabeEintrag` + Glocke v2 + SSE – P0-7

- Freigabe-Register `freigaben/<bereich>.js`: `{art, titel, laden(session), betrag?, geldwirksam, freigeben(token), ablehnen(grund)}`.
- Eintrag: Antragsteller, Objekt-Chip, Betrag, Grund, Knöpfe „Freigeben“ (geldwirksam → Dialog sm mit Betrag/Folge) und „Ablehnen“ (Pflichtgrund im Eintrag, verzögertes Senden 8 s); eigener Antrag → gesperrt mit Satz. Glocke: Tabs „Für mich · Team · System“, Gruppen Heute/Gestern/Älter, Tasten `↑↓ Enter ←→ R Shift+R F`, Zähler-Pop 240 ms nur bei Zunahme.
- `/api/ereignisse` (SSE, Server pollt Frappe gebündelt je Sitzung, Fallback Polling 60 s); Lesezustand in Frappe.

### G-16 `ErgebnisKarte` – P0-5

- Nach abgeschlossenem Vorgang: Häkchen zeichnet 400 ms, Hauptzeile (Nummer, Betrag oder Rückgeld zuerst), Links auf alle erzeugten Dokumente, „Weiter mit …“ (nächste Primäraktion), max. 3 Knöpfe; ein Erfolgsmoment je Vorgang (Q-H5).

### G-17 `DruckPanel` – P0-5

- Sheet mit Vorschau (HTML des Druckformats), Formatwahl, Sammeldruck mehrerer Formate, Drucker/Gerät, PDF; `Strg+P` öffnet es überall; Kiosk-Variante als Menü (Lieferschein, Packliste, Etikett, Bon). Warteschlange und Fehlerband (Drucker offline) mit Ersatz „Als PDF öffnen“.

### G-18 `Informieren` – P0-5

- Chip „Kunde nicht informiert · Informieren …“ am Objekt nach kundenrelevanter Änderung; Sheet mit Kanal (E-Mail; Telefon/Brief als Erfassung), Vorlage, Vorschau, „Senden“ als verzögerter Commit; Ergebnis „Zugestellt / Nicht zugestellt – {Ausweg}“. Bereiche liefern Vorlagen-IDs und Methode.

### G-19 `AnDieKassa` – P0-5

- Zeile 13 px mit Icon `receipt`: „Bar oder Karte? An der Kassa kassieren →“; Link öffnet `/kassa?kunde=&beleg=` (nur mit Kassa-Arbeitsplatz-Recht, sonst nur Text). Varianten `zahlung`, `erstattung`, `gutschein`.

### G-20 `Kundenmodus` – P0-7

- Schaltet Shell auf Kundensicht: Seitenleiste, Palette, Glocke, fremde Toasts, Margen, EK, interne Notizen aus; Schrift +1 Stufe; Kopf mit Wortmarke. Beenden über `BedienerRueckkehr` (Langdruck 800 ms auf die Wortmarke + optional PIN, Inhaber M-10). Nutzer: CRM (Protokoll), Faktura (Angebot/Rechnung), Projekte (Mappe), Kundenkarte (Übergabe).

### G-21 Kalender, Raster, `BetragFeld` – P0-6

- `Kalender`: Woche/Monat/Tag, Quellen parallel (Termine, Montagen, Einsätze, Touren, Abwesenheiten ohne Art, Social, Events), `role="grid"` mit Roving-Fokus (`←→↑↓`, `T` heute, `W/M/D` Ansicht, `Enter` in leerer Zelle = neu), Ziehen zum Umplanen mit Popover-Alternative, Kollisionen als Text + Icon. `Slotraster` 30 min für freie Zeiten. `Raster` als Basis für Plantafel (Logistik) und Mini-Gantt (Projekte).
- `BetragFeld`: Komma-Modell, `inputmode="decimal"`, Wert Cent, `−` erlaubt nur mit Prop, Fehler „Betrag im Format 1.234,50“.

### G-22 `ScanTor` + `KameraScan` – P0-6

- `ScanTor`: erkennt Scanner-Folgen (Zeichenabstand < 30 ms, Enter-terminiert), verhindert Kürzel-Auslösung; Backoffice: Felder `data-scan="ja"`, außerhalb → Palette mit Code; Kiosk: global, Opt-out `data-scan="nein"`. Code-Erkennung über `lib/backoffice/codes.js` (Kartennummer, EAN, Belegnummer, Abholcode, Lageretikett, Event-QR).
- `KameraScan`: iPad-Kamera, Rahmen, Taschenlampe, Fehler „Kamera nicht erlaubt – Nummer eintippen“.

### G-23 `Unterschrift` – P0-6

- Canvas 100 % × 200, beide Ausrichtungen, Grundlinie gestrichelt, „Löschen“ ghost, „Übernehmen“ 48 px; Erklärungstext darüber Pflicht-Prop; Alternativen-Segment konfigurierbar („Name bestätigt“, „Abgestellt laut Absprache“ mit Pflicht-Foto); Ergebnis PNG + Prüfwert + Zeit; einmal gesetzt nicht überschreibbar (Server Action prüft vorher).

### G-24 Kiosk-Kern v2 – P0-6

- `KioskShell`: Kopfzeilen-Slot, `aria-live`-Region, `data-tastatur`-Erkennung, Band-Stapel (Q-J4), `toastAnker`, Hilfe-Knopf 48 px + `F1`, Idle-Sperre mit 30-s-Band; behebt QA-Befunde 1, 11, 12.
- Hooks: `useEingabesperre(ms)`, `useVerbindung`, `useLebenszeichen`, `useDruck`, Upload-Warteschlange (IndexedDB) für Fotos/Unterschriften mit sichtbarem Zähler.
- Bausteine: `Zahlentastatur` (Komma-Modell, Anzeigefeld mit `×`, 4. Spalte je Kontext, Taste 64), `Stepper48`, `Wischaktion` (mit sichtbaren Zielen), `Positionsgrid` (`role="grid"`, Roving-Tabindex).

### G-25 Personen- und Freigabe-Sitzung – P0-8

- `auth/kurzsitzung.js`: `sitzungMitPin({benutzer, pin, geraetToken, zweck, ttl: 60})` → Store-Eintrag nur für eine Aktion, danach beendet; Rückfall ohne ph_core P9: Passwort statt PIN (Kassa E4). Nutzer: Kassa (Freigabe am Ende, Bedienerwechsel), Personal (Stempeln für andere Person), Logistik/Projekte (Leitungsfreigabe am Kiosk).

### G-26 Shell v2 – P0-7

- Kopfzeilen-Slot (Stempelpille Personal, Kundenmodus-Knopf), Hilfe-Knopf + Panel 480 px (Artikel der Seite aus `backoffice/hilfe/**`, Kürzel der Seite, „Was kann ich hier tun?“), Benutzermenü (Arbeitsplätze `1–5`, Dieses Gerät, PIN ändern, Hell/Dunkel/System, Dichte, Einzeltasten-Kürzel), Palette v2 (Präfixe `> # @ ? /` als Token-Chip, Beträge per Muster, Enter wartet bis 600 ms auf ersten Treffer, Gruppe „Dieser Datensatz“ aus Bereichsregister), Testband ohne Überdeckung (QA-Befund 10), Sitzungs-Overlay.

### G-27 `Erstbesuch` – P0-7

- Ein Band unter dem Seitenkopf (1–2 Sätze, „Mehr“, „Verstanden“), gemerkt je Benutzer (`ph-bo:<user-hash>:erstbesuch:<route>`), nie Touren mit Schritten.

### G-28 `PersonZelle` – P0-5

- Avatar 24/32 (Initialen, Farbe aus Hash in Sand/Tinte-Stufen), Name, optional Rolle; bei fremden Abwesenheiten nur „abwesend“.

### G-29 `ZweiKlickKnopf` – P0-5

- Für mittlere Risiken ohne Dialog: erster Klick verwandelt den Knopf in „Wirklich {Verb}?“ (danger-soft) für 3 s, zweiter Klick führt aus; Tastatur: zweimal `Enter`; Screenreader-Ansage. Nur wo ein Bereichskonzept es verlangt (Shop § 3.4).

### G-30 `FotoAufnahme` – P0-6

- `<input type="file" accept="image/*" capture="environment">` + Datei, Vorschau 96 px, EXIF-Zeit, privat hochladen über `/api/datei`, Offline-Warteschlange (G-24), Fehler je Datei „Upload fehlgeschlagen – erneut“.

### G-31 Motion-Grundlage – Team Q2 (parallel zu P0)

- `bo-motion.css` (Token Q-H1, Keyframes `bo-fade`, `bo-rise-4`, `bo-vt-fade-only`, `bo-markiert`, `bo-shake`, `bo-zeichnen`, `bo-balken`, Klassen `.bo-anim-eintrag`, `.bo-toast*`, `.bo-dialog`, `.bo-erfolg`, `.bo-tick`, `.bo-scan`), Reduced-Motion-Regel 04 § 2.4, `::view-transition { pointer-events:none }`; `components/Backoffice/motion.js` (`reduziert`, `dauer`, `animiere`, `lande`/FLIP, `SPRING`); Seitenwechsel über `<ViewTransition>` (React 19.2, Next 16.4.1 Leitfaden `view-transitions.md` lesen).

---

## 5. Bauplan

### 5.1 Phasen

```
Phase 0  Fundament v2 (P0-1 … P0-9) ──► Gate G0 (Fundament-Abnahme)
           │  parallel: Q2 Motion, Q1 Polish (40-qa-befunde), Q3 QA-Basis, Q4 A11y-Basis
           ▼
Phase 1  Welle 1: Zentrale · CRM · Projekte · Sortiment          (Rahmen + Stammdaten)
         Welle 2: Faktura · Logistik · Shop · Kassa              (startet, sobald Slot-API G-14 eingefroren ist)
         Welle 3: Service · Kundenkarte · Marketing · Personal   (startet mit Welle 2, wenn Agenten frei sind)
           │  je Bereich: Bau → QA-Lauf → Polish-Fenster → A11y-Durchlauf → Bereichsabnahme (Gate G1-<bereich>)
           ▼
Phase 2  Integration: Akte-Slots, Freigaben, Palette, ZuTun-Quellen, ROUTEN-307, Hauptfluss-E2E ──► Gate G2
           ▼
Phase 3  Gesamtdurchgang Polish · Motion · A11y · QA (alle Routen × 3 Viewports × hell/dunkel) · Doku/Onboarding ──► Gate G3
           ▼
Livegang je Bereich nach Fach-Gates (Backend-Punkte P/A/AS laut Konzept, StB-Fragen 91) ──► Gate G4-<bereich>
```

Welle 1 steht vorn, weil andere Bereiche hineinliefern: Zentrale (Aufgaben, Freigaben, Verwaltung, Druck-Hub, Zugang), CRM (Kundenakte-Rahmen), Projekte (Mappe-Rahmen, Montage-Kiosk), Sortiment (Produktdaten für Faktura/Kassa/Shop, Wareneingang für Packtisch). Innerhalb einer Welle arbeiten die Bereiche unabhängig, weil jeder nur in seinem Schreibbereich arbeitet und Fremdinhalte über Slots/Register liefert.

### 5.2 Teams und Agenten

Gemeinsame Pflicht aller Agenten: dieses Dokument + eigenes Konzept lesen; Next-Leitfaden aus `backoffice/node_modules/next/dist/docs/` vor dem ersten Code; nur im eigenen Schreibbereich schreiben; kein `npm install` (Abhängigkeiten nur über Team P0-9 nach Freigabe), kein Git-Commit ohne Auftrag des Inhabers, keine Verbindung zu produktiven Systemen, keine Geheimnisse; Übergabe mit Protokoll (§ 5.6).

**Leitung**

| ID | Rolle | Auftrag | Schreibbereich | Abhängig von | Reihenfolge | Parallel |
|---|---|---|---|---|---|---|
| L0 | Chef-Produktdesign / Integration | Hüter dieses Dokuments; entscheidet neue Kollisionen innerhalb eines Tages, pflegt § 3, nimmt Gates ab, verteilt Schreibsperren für Polish/A11y | `Marktresearch/digital/backoffice/00-MASTER.md`, `…/09-entscheidungslog.md` (neu, Nachträge) | – | durchgehend | ja |

**Phase 0 – Fundament v2** (schreiben im Fundament; Bereiche ruhen bis G0)

| ID | Rolle | Auftrag | Schreibbereich | Abhängig von | Reihenfolge | Parallel |
|---|---|---|---|---|---|---|
| P0-1 | Register & Struktur | G-01, G-02, G-04; Aufteilung der Sammeldateien § 3.5 (ohne Verhaltensänderung, alle bestehenden Tests grün) | `src/lib/backoffice/{bereiche/,suche/,kuerzel/,faehigkeiten.js,arbeitsplaetze.js,config.js,codes.js}`, `mock/seed/`, `tools/qa/routen/`, `tests/unit/backoffice-register*.test.mjs` | – | **zuerst** | nein (Basis für alle) |
| P0-2 | Token & Grundbausteine | Token-Ergänzungen 03 § 1.7 (Status-Tints, Chart, Overlay, Dichte-Variablen), `Knopf`, `StatusBadge`, `Kennzahl` (Client-Kind `Zahl`), `Leer`, `Fehler`, `Segment`, `Charts` (QA-Befunde 2, 5), Dichte-Umschaltung | `src/app/globals.css`, `components/Backoffice/{Knopf,StatusBadge,Kennzahl,Leer,Fehler,Segment,icons}.js`, `Charts/` | – | zuerst (mit P0-1) | ja (mit P0-1) |
| P0-3 | Commit & Rückmeldung | G-03 komplett | `components/Backoffice/{Toast,Ausstehend}.js`, `lib/backoffice/commit/`, `app/api/undo-commit/` | P0-1 | nach P0-1 | ja |
| P0-4 | Overlays | G-06, G-07, G-08 | `components/Backoffice/Overlay/`, `Bestaetigen.js` | P0-2 | nach P0-2 | ja |
| P0-5 | Seiten- und Aktenmuster | G-05, G-09…G-14, G-16…G-19, G-28, G-29; `Seitenkopf` (QA 15), `BereichStart` → `ZuTun`, Formular-Kindtabelle/Listen am Telefon (QA 6–9, 13) | `components/Backoffice/{Akte/,ZuTun/,Bericht/,Ergebnis/,Druck/,Informieren/,Seitenkopf.js,BereichStart.js,LeitungBitten.js,AnDieKassa.js,PersonZelle.js,ZweiKlickKnopf.js}`, `Formular/`, `DataTable/`, `Kanban/`, `lib/backoffice/{bezuege.js,akte/,druck/index.js,aufgaben/index.js}` | P0-1, P0-2, P0-4 | nach P0-4 | ja (intern teilbar: P0-5a Akte/Vorgang, P0-5b Liste/ZuTun/Bericht, P0-5c Druck/Informieren/Kasse-Hinweis) |
| P0-6 | Eingabe & Kiosk | G-21…G-24, G-30; QA-Befunde 1, 11, 12 | `components/Backoffice/{Kiosk/,Kalender/,Eingabe/}`, `lib/backoffice/datum.js` (Erweiterung) | P0-2, P0-4 | nach P0-4 | ja |
| P0-7 | Shell & Benachrichtigung | G-15, G-20, G-26, G-27; `/api/ereignisse`; Hilfe-Lader; QA-Befunde 10, 14 und Kleinpunkte | `components/Backoffice/Shell/`, `components/Backoffice/{Kundenmodus/,Erstbesuch.js}`, `lib/backoffice/{freigaben/index.js,hilfe.js,benachrichtigungen.js}`, `app/api/ereignisse/`, `app/hilfe/` | P0-1, P0-3, P0-4 | nach P0-3 | ja |
| P0-8 | Auth & Sitzung | G-25; Session-Store-Schnittstelle Redis-fertig (Commit-Register nutzt sie); Einzeltasten-/Dichte-/Theme-Vorlieben je Benutzer | `lib/backoffice/auth/` | P0-1 | nach P0-1 | ja |
| P0-9 | Plattform & Abhängigkeiten | `next.config.js`, Playwright-Projekte (`reducedMotion`, `ipad-quer`), ESLint-Regeln (keine Hex-Farben in Komponenten, keine `type="date"`), Budget-Prüfungen (Bundle-Größe je Route), Dockerfile-Skizze; einzige Stelle für neue Pakete (nur nach Inhaber-Freigabe) | `backoffice/{next.config.js,playwright.config.js,eslint.config.mjs,package.json}`, `tools/qa/budget.mjs` | – | zuerst | ja |

**Querschnittsteams** (laufen ab Phase 0 mit)

| ID | Rolle | Auftrag | Schreibbereich | Abhängig von | Reihenfolge | Parallel |
|---|---|---|---|---|---|---|
| Q1 | UI-Polish | Phase 0: 15 Pflicht-Befunde aus `40-qa-befunde-basis.md` mit den P0-Teams schließen; danach je Bereich ein Polish-Fenster nach dem QA-Lauf: Abstände, Ausrichtung, Umbrüche, Leer-/Fehlerzustände, Dunkelmodus, iPhone-/iPad-Brüche; Maßstab Linear/Stripe/Shopify in Platzhirsch-Sprache | während eines Polish-Fensters die Dateien des Bereichs (Schreibsperre von L0); sonst nur `Marktresearch/digital/backoffice/41-polish-<bereich>.md` | QA-Bericht des Bereichs | nach jedem Q3-Lauf | ja (ein Agent je Bereich) |
| Q2 | Motion | G-31; Abnahme jeder Animation mit Prüfliste 04 § 6; Spec `tests/e2e/backoffice-motion.spec.js` (Endzustände: Dialog ≤ 200 ms sichtbar, Toast weg ≤ 8,5 s, Kanban-Karte ≤ 400 ms in Zielspalte) | `src/app/bo-motion.css`, `components/Backoffice/motion.js`, `tests/e2e/backoffice-motion.spec.js`; in Bereichen nur über Polish-Fenster | P0-2 | Phase 0 parallel, dann je Bereich | ja |
| Q3 | QA mit Screenshots | Muster: `tools/qa/shoot.mjs` der Website (Backoffice-Kopie vorhanden: `backoffice/tools/qa/shoot.mjs`, `routen.mjs`, `bewerten.mjs`). Je Bereich: Lauf über alle Routen aus `routen/<bereich>.mjs` × Desktop 1440×900 · iPad quer 1024×768 · iPad hoch 820×1180 (neu) · iPhone 390×844 × hell/dunkel, Fähigkeiten alle an/alle aus; technische Befunde (Status, Überlauf, Konsole, Fokus) automatisch, Sichtprüfung manuell mit Befundtabelle; Klickzahlen der Top-Aufgaben nachzählen; Budgets messen | `backoffice/tools/qa/` (außer `routen/<bereich>.mjs`, die schreiben Bereiche), `backoffice/qa-screenshots/`, `Marktresearch/digital/backoffice/4x-qa-<bereich>.md` | P0-1 (Routen-Register) | Basislauf nach G0, dann je Bereich bei „Abnahme-Kandidat“ | ja |
| Q4 | Barrierefreiheit | axe-Spec je Route (hell/dunkel), Tastatur-Durchläufe nach Q-F, Screenreader-Durchlauf Q-I9, Zielgrößen, Zoom 200 %, `reduce`; Befunde mit WCAG-Nummer | `tests/e2e/a11y-*.spec.js`, `Marktresearch/digital/backoffice/45-a11y-<bereich>.md`; Fixes über Polish-Fenster | P0-2, P0-4 | nach Q3 je Bereich | ja |
| Q5 | Doku & Onboarding | Hilfe-Artikel je Route (`backoffice/hilfe/<bereich>/<seite>.md`, ≤ 200 Wörter, Bilder als Beschreibung), Erstbesuch-Sätze, Kürzel-Liste, Schulungsablauf je Rolle (Verkauf, Planung, Büro, Lager, Montage, Kassa, GF, Kanzlei) mit Übungen im Mock/Testmodus; 01–05 nach § 3 nachziehen; 05 § 14.1 → Katalog „Abläufe“ | `backoffice/hilfe/**`, `Marktresearch/digital/backoffice/{01..05}-*.md` (nur Nachzug), `…/60-onboarding-<rolle>.md` | Bereichsabnahme | je Bereich nach G1, Nachzug 01–05 sofort | ja |
| Q6 | Backend-Lücken (Mandat Nr. 50) | die in den Konzepten als Anfragen/Gates geführten Server-Punkte (P, A, AS, A-S …) in den Apps umsetzen; Ergebnisse in 50–52 nachtragen; meldet je Punkt an L0, damit Fähigkeiten umgeschaltet werden | nur `Backend-Import/ph_<app>/` je zugewiesener App (ein Agent je App) | – | parallel zu allem | ja |

**Phase 1 – Fachbereiche** (je ein Agent; bei großen Bereichen zwei mit getrennten Unterordnern, z. B. Kassa-Kiosk / Kassa-Verwaltung)

Gemeinsamer Schreibbereich je Bereich `<b>`: `src/app/<b>/`, `src/components/Backoffice/<B>/`, `src/lib/backoffice/<b>/`, Teildateien `lib/backoffice/{bereiche,suche,kuerzel,freigaben,aufgaben,druck,akte/slots}/<b>.js`, `mock/seed/<b>.js`, `tests/unit/<b>-*.test.mjs`, `tests/e2e/<b>-*.spec.js`, `tools/qa/routen/<b>.mjs`.

| ID | Bereich | Zusätzlicher Schreibbereich | Liefert anderen | Braucht | Welle | Parallel |
|---|---|---|---|---|---|---|
| B-ZEN | Zentrale | `src/app/{page.js,aufgaben/,verwaltung/,benutzer/,geraete/,geraet/,einstellungen/,protokoll/,benachrichtigungen/,suche/,druck/page.js,arbeitsplatz/,wechsel/,login/,kein-zugriff/}` | Aufgaben-Seite, Freigaben-Kachel, Druck-Hub, Verwaltung, Zugang | G0 | 1 | ja |
| B-CRM | CRM | `src/app/{kunden/,datenschutz/}` | Kundenakte-Rahmen + Slot-Darstellung, Datenschutzanfragen, Termin-Kalender-Quelle | G0 | 1 | ja |
| B-PRJ | Projekte | `src/app/(kiosk)/montage/` | Mappe-Rahmen, Montage-Kiosk, Vorgangsleiste-Regeln Projekt | G0 | 1 | ja |
| B-SOR | Sortiment | – | Produktsuche-Bausteine (Faktura, Kassa, Shop), Wareneingang-Baustein (Packtisch) | G0 | 1 | ja |
| B-FAK | Faktura | – | Slots „Belege“ (Kundenakte, Mappe), Gutschrift-Weg für Service/Shop | G0, Slot-API (B-CRM/B-PRJ) | 2 | ja |
| B-LOG | Logistik | `src/app/(kiosk)/packtisch/` | Tour-Bausteine für `/montage`, Slots „Lieferungen“ | G0, B-SOR Wareneingang-Baustein | 2 | ja |
| B-SHO | Shop | – | Gutschein-API-Hülle für Kassa, Slot „Bestellungen“ | G0 | 2 | ja |
| B-KAS | Kassa | `src/app/(kiosk)/kassa/`, `src/app/kassa/verwaltung/` | Kassa-Abschnitt für `/geraete` | G0, B-SOR Produktsuche, B-SHO Gutschein, Kundenkarte-Lookup (B-KKA, sonst Stub) | 2 | ja |
| B-SER | Service | `src/app/(kiosk)/technik/` | Slot „Service“ (Kundenakte, Mappe) | G0 | 3 | ja |
| B-KKA | Kundenkarte | – | Lookup-/Einlöse-Baustein für Kassa, Slot „Kundenkarte“ | G0 | 3 (Lookup-Baustein vorziehen in Welle 2) | ja |
| B-MAR | Marketing | `src/app/(kiosk)/checkin/` | Slot „Marketing“ in Kundenakte (unter „Mehr“) | G0 | 3 | ja |
| B-PER | Personal | – | Stempelpille für Shell-Slot, Abwesenheiten (ohne Art) für Kalender/CRM-Verfügbarkeit | G0 | 3 | ja |

**Phase 2 – Integration**

| ID | Rolle | Auftrag | Schreibbereich | Abhängig von | Parallel |
|---|---|---|---|---|---|
| I1 | Integrations-Agent | Slots/Register aller Bereiche zusammenführen und prüfen; Hauptfluss-E2E `tests/e2e/fluss-hauptweg.spec.js`: Anfrage → Termin → Gespräch → Projekt → Angebot → AB → Anzahlung (Zahlungslink) → Herstellerbestellung → AB-Abgleich → Wareneingang → Lieferschein → Packtisch → Tour/Montage → Abnahme → Schlussrechnung → Zahlung → Servicefall → Gutschrift; Nebenflüsse Shop-Bestellung → Packtisch → Rechnung und Kassa-Anzahlung auf AB | `tests/e2e/fluss-*.spec.js`, Fehlerberichte an Bereiche (`Marktresearch/digital/backoffice/70-integration.md`) | alle G1 | nein (ein Agent, danach Fix-Runde parallel) |

### 5.3 Arbeitsregeln für parallele Agenten

1. **Schreibsperren:** Jede Datei hat genau einen Besitzer (Tabellen § 5.2). Polish/A11y/Motion arbeiten in Bereichsdateien nur im zugeteilten Fenster; der Bereichsagent pausiert so lange. L0 führt die Liste in `09-entscheidungslog.md`.
2. **Fundament-Wünsche nach G0** meldet ein Bereich an L0 mit Begründung; L0 weist sie dem zuständigen P0-Team zu (Nachlauf-Paket), der Bereich baut keinen Ersatz im eigenen Ordner. Ausnahme: reine Bereichskomponente ohne zweiten Nutzer.
3. **Stub statt Warten:** Braucht ein Bereich den Baustein eines anderen (z. B. Kassa → Kundenkarte-Lookup), baut der Lieferant zuerst eine Schnittstelle mit Mock-Antwort und Unit-Test; der Nutzer bindet die Schnittstelle, nie den Ordner des anderen.
4. **Keine Konzeptänderung im Bau:** Abweichungen vom Konzept nur mit Eintrag „Abweichung“ im Übergabeprotokoll und Freigabe L0.
5. **Mock und Frappe gleichzeitig:** Jede Server Action hat einen Mock-Pfad; Frappe-Pfad gegen Testmandant erst nach Freigabe des Inhabers (keine Verbindung zu `backoffice.platzhirsch.studio` aus Agenten).
6. **Texte** kommen aus `lib/backoffice/<b>/texte.js` (keine verstreuten Literale), damit Q5 und L0 prüfen können.

### 5.4 Gates

| Gate | Inhalt | Abnahme durch |
|---|---|---|
| G0 Fundament v2 | G-01…G-31 gebaut, Demo-Seiten vorhanden, 15 Pflichtbefunde 40-qa geschlossen, Unit/E2E/axe grün, Q3-Basislauf 0 technische Befunde, Budgets Shell eingehalten | L0 + Q3 + Q4 |
| G1-<b> Bereich | DoD § 6 erfüllt | L0 + Q3 + Q4 + Q5 |
| G2 Integration | Hauptfluss-E2E und Nebenflüsse grün im Mock; keine Route ohne kanonischen Eintrag; Slots aller Bereiche in Kundenakte/Mappe sichtbar | L0 + I1 |
| G3 Gesamt | Vollständiger Screenshot-Lauf ohne offene Befunde der Schwere „hoch“; Doku vollständig; Schulung im Testmodus mit 2 Mitarbeitern durchgeführt (Klickzahlen gemessen) | L0, Inhaber |
| G4-<b> Livegang | Fach-Gates des Konzepts (z. B. Faktura E1 P-01…P-12 + StB 1/2/3/5/9; Kassa Echtbetriebs-Schranke § 0.4; Logistik G2/G3; Projekte A5; Marketing P0-Punkte), Frappe-Modus gegen Testmandant grün | Inhaber (+ StB/RB je Punkt) |

### 5.5 QA-Ablauf mit Screenshots (Team Q3, je Bereich)

```
1. Bereichsagent meldet „Abnahme-Kandidat“ + Routenliste (tools/qa/routen/<b>.mjs, Kernseiten markiert)
2. Dev-Server Mock (:3100), Fähigkeiten=alle  → node backoffice/tools/qa/shoot.mjs backoffice/qa-screenshots/<b>-<datum>-an  --nur "^/<b>"
3. Fähigkeiten=keine                          → …-aus
4. bericht.md lesen: HTTP, Überlauf, Konsole, Fokus = 0 Befunde (Pflicht)
5. Sichtprüfung je Bild nach Prüfliste (unten), Befundtabelle 4x-qa-<b>.md: # · Route · Viewport · Schema · Schwere (hoch/mittel/klein) · Befund · Vorschlag
6. Optional bewerten.mjs (lokales Modell) nur als Zusatzhinweis
7. Polish-Fenster Q1 → erneuter Lauf nur betroffener Routen → Befunde „hoch“ = 0, „mittel“ ≤ 3 mit Begründung
```

Sicht-Prüfliste: eine Primäraktion sichtbar · Seitenkopf-Muster · keine Rohwerte/Umschreibungen ohne Umlaut · Leer-/Fehlerzustand gezeichnet · Zahlen tabellarisch und rechtsbündig · kein Abschneiden/Umbrechen von Nummern · Telefon: Karten statt Tabelle, keine Überbreite · iPad: Touch-Ziele, Kiosk-Raster · Dunkelmodus: Kontrast, keine weißen Flächen · Status Farbe + Text · Testband überdeckt nichts · Ruhe (keine konkurrierenden Akzente, Haarlinien statt Schatten).

### 5.6 Übergabeprotokoll (jeder Agent, am Ende jedes Auftrags)

`Marktresearch/digital/backoffice/8x-uebergabe-<team>.md`: gebaute Routen/Komponenten · Tests (Anzahl, Ergebnis) · offene Punkte · Abweichungen vom Konzept (mit Freigabe L0) · Fähigkeiten-Stand (an/aus und Grund) · neue Inhaber-/StB-Fragen (→ 90/91) · Screenshot-Ordner.

---

## 6. Definition of Done

### 6.1 Für jeden Bereich (Pflicht)

- [ ] Alle Routen des Konzepts vorhanden, im `ROUTEN`-Register, Seitentyp T1–T9 eingehalten; Umleitungen (307) für alte Pfade.
- [ ] Mock-Seed deckt jeden Status und jeden Leer-/Fehlerfall ab; Fähigkeiten an/aus beide abgenommen.
- [ ] Top-Aufgaben-Klickzahlen des Konzepts nachgezählt (E2E misst die Klickfolge).
- [ ] Querschnittsregeln § 2 erfüllt; Kürzel registriert, Kollisionstest grün; Einzeltasten abschaltbar.
- [ ] Jede umkehrbare Aktion mit Rückgängig nach Q-C3; Bestätigungen nur nach Q-C6.
- [ ] Unit-Tests der Bereichslogik grün; E2E desktop + ipad (+ Kiosk ipad-quer) grün; ESLint 0.
- [ ] axe 0 serious/critical hell/dunkel; Screenreader-Durchlauf protokolliert.
- [ ] Screenshot-Lauf: 0 technische Befunde, 0 „hoch“, Polish-Runde erledigt.
- [ ] Budgets Q-L1…Q-L4 im Mock gemessen.
- [ ] Hilfe-Artikel je Route und Erstbesuch-Satz vorhanden (Q5); Texte ohne Superlative, ohne erfundene Zahlen.
- [ ] Übergabeprotokoll geschrieben; offene Backend-/StB-Punkte als Fähigkeiten sichtbar, nicht als Fehlerknöpfe.

### 6.2 Zusätzlich je Bereich

| Bereich | Zusätzlich fertig, wenn … |
|---|---|
| Zentrale | Rollenvarianten (Mitarbeiter, Leitung/GF, Admin, Kanzlei, Kiosk-Rollen, Selbstservice) je eigener Screenshot; Aufgaben aus PH Aufgabe + ToDo in einer Liste; Freigaben mit Vier-Augen-Sperre; `/verwaltung`-Hub nur mit Recht; Arbeitsplatz-Wahl mit `1–5`; Testmodus-Rückfrage nennt echte Wirkung. |
| CRM | Abgeleiteter Anfrage-Status (`vorgang.js`) unit-getestet; Kundenakte 6 Tabs mit allen Slots der anderen Bereiche (ab G2); Termin in einem Bildschirm mit atomarer Slot-Prüfung; Marketing-Filter je Kanal nur mit Einwilligung; Datenschutzanfrage mit Frist und Auskunft-Druck vollständig nach E11. |
| Projekte | Mappe 6 Tabs, Vorgangsleiste mit Phasendaten und Quelle; operative Phasenschritte automatisch, kaufmännische nie; keine Projektsummen ohne Fähigkeit `projekte.summen`; Abnahme mit einer Unterschrift unter Text E3, danach schreibgeschützt; `/montage` mit Heute · Woche · Suche · Ich inkl. Logistik-Stopps. |
| Faktura | Stellen-Dialog ohne vorab genannte Nummer, Leistungsdatum nie still vorbelegt; Datumssperre (nicht vor letzte Rechnung, nicht in abgeschlossenen Monat); Bank-Zuordnung als verzögerter Commit; Offene Posten als Reiter; Präsentation über `Kundenmodus`; Go-Live-Sperre E1 als Fähigkeit sichtbar. |
| Shop | Kein Bar/Karte im Backoffice (`AnDieKassa`); Übergabe nur bei `offen_cent = 0` (Client + Server); Erstattung gesperrt bei Rechnung ohne Gutschrift-Hook; Widerrufsfrist ab Zustellung; Shop-Modus „Live“ nur mit vollständiger Prüfliste. |
| Sortiment | Kein Preis ohne Stand, kein Bild ohne Beleg im Freigabe-Schreibtisch; Außenwirkung als verzögerter Commit (Website sieht nichts vor Ablauf); AB-Abgleich mit OK 1 · Rückfrage 2 · Ablehnen 3; Löschen nur bei Entwürfen ohne Folgen; Glossar § 2 vollständig umgesetzt. |
| Logistik | Packtisch: Scan-Rhythmus bis Gepackt ohne Tippen (verzögerter Commit), Etikett in einem Bildschirm; Anzahlungssperre mit Leitungs-Überschreiben und Pflichtgrund; Belegsperre ab Übergeben; kein Bargeld-Feld; Tour-Bausteine in `/montage` eingebunden; Zeitstempel je Stopp aus. |
| Kassa | Zwei-Spalten-Raster, Suchfeld als Fokus-Heimat, Positionsliste `role="grid"`; 300-ms-Eingabesperre; „Zahlung erhalten – Beleg offen“ mit gleichem Idempotenz-Schlüssel getestet; Freigabe am Ende; Training nur durch Leitung, nie vom Client gesendet; Echtbetriebs-Schranke § 0.4 als sichtbare Liste; Toast in linker Spalte. |
| Service | Nächster Schritt kommt vom Server (`get_next_steps`), Client spiegelt nur; Fristband „bei Meldung“ vs. „ab heute“; Gutschrift nur über Faktura-Methode; Technik-Kiosk am Telefon 390 px mit Offline-Abschluss und Upload-Warteschlange; Kulanz über `FreigabeEintrag`. |
| Kundenkarte | Scan öffnet überall die Karten-Akte (`ScanTor`); Einlösen = ein Klick mit Undo 8 s; keine Beträge für Mitarbeitende; Einwilligung nur mit Nachweis; Kassa-Lookup zeigt nur Name, Stufe, Vorteile; `G H` statt `G K`. |
| Marketing | Nichts geht ohne Freigabe nach außen; Werbefenster und Sperrtage als Satz mit Folge, verbotene Werte nicht wählbar; Kanban nur Social; Check-in-Kiosk am Eventtag; Event-Anmeldung speichert keine Werbe-Einwilligung. |
| Personal | Stempeln in 2 Klicks über Shell-Slot; Abwesenheit fremder Personen nur „abwesend“; kein Saldo im laufenden Monat; Fähigkeit `personal.konten` aus bis Backend A5–A8; Krankmeldung ohne Ablehnen; Bewerbungen mit Löschfrist-Countdown. |

---

## 7. Risiken

| Nr. | Risiko | Wirkung | Gegenmaßnahme | Verantwortlich |
|---|---|---|---|---|
| RI-01 | Bereichsagenten bauen Ersatz-Bausteine, weil das Fundament nicht fertig ist | doppelte Komponenten, auseinanderlaufende Bedienung | Gate G0 vor Bereichsbau; Regel § 5.3 Nr. 2; Code-Review sucht Dubletten (C-01…C-23) | L0 |
| RI-02 | Gleichzeitiges Schreiben in Sammeldateien | Merge-Verluste, kaputte Navigation | Aufteilung § 3.5 durch P0-1 zuerst; Schreibsperren § 5.3 Nr. 1 | P0-1, L0 |
| RI-03 | Verzögerter Commit verliert Aktionen (Absturz, Netz) | stille Datenverluste | Server-Nachlauf G-03, Beacon, E2E „Tab schließen“, Protokolleintrag je Nachlauf | P0-3 |
| RI-04 | Backend-Lücken länger offen als der UI-Bau | Funktionen dauerhaft „noch nicht verfügbar“, Frust im Team | Fähigkeiten mit Ersatzweg; Q6 arbeitet die Gates nach Livegang-Priorität ab; L0 führt Fähigkeiten-Übersicht | Q6, L0 |
| RI-05 | Steuer-/Rechtsfragen (91) unbeantwortet | kein Livegang Kassa/Faktura/Shop | strengste Variante als Standard; Fragen gebündelt über den Inhaber an StB/Kanzlei | Inhaber |
| RI-06 | Mock und Frappe weichen ab (Feldnamen, Rechte, Workflows) | Abnahme im Mock, Fehler im Echtbetrieb | Mock liest echte DocType-JSONs; Frappe-Modus-Test gegen Testmandant vor G4; Fehlerbild `BackofficeError` einheitlich | Bereiche, I1 |
| RI-07 | Leistung von Kundenakte/Mappe (viele Aufrufe ohne Aggregat-Methode) | langsame Akten, Budget Q-L1 verletzt | Aggregate `kundenakte`/`auftragsmappe` nutzen, Rückfall max. 12 parallel, Slots streamen | B-CRM, B-PRJ, Q6 |
| RI-08 | Next 16.4.1 weicht von bekannten APIs ab | Fehlbau, Hydration-Fehler | Leitfaden in `node_modules/next/dist/docs/` vor Code (AGENTS.md); Hydration-Prüfung im QA-Lauf (Konsole) | alle |
| RI-09 | Lokales Bildmodell übersieht Fehler | falsche Abnahme | manuelle Sichtprüfung Pflicht (Q-M3), Modell nur Zusatz | Q3 |
| RI-10 | Kürzel-Kollisionen und Einzeltasten stören Screenreader/Sprachsteuerung | Fehlbedienung, WCAG-Verstoß | zentrales Register mit Test, Abschalter, keine Mail per Einzeltaste | P0-1, Q4 |
| RI-11 | Mitarbeiter-Überwachung durch Zeitstempel/Auswertungen | Arbeitsrecht (ArbVG § 96/96a, AVRAG § 10) | Q-A12, Schalter Standard aus, Inhaber-Entscheidung M-11 | L0, Inhaber |
| RI-12 | Kassa-Hardware (Bondrucker ESC/POS, Stripe Terminal, Scanner, iPad-Safari-Vollbild) verhält sich anders als im Mock | Kassa im Laden nicht nutzbar | Hardware-Probe mit Trainingsmodus vor G4; Druck-Ersatz „Als PDF“; Terminal-Abbruch in voller Breite | B-KAS |
| RI-13 | Kassa steht bei Netzausfall | Umsatzausfall im Laden | Inhaber bestätigt K-03 bewusst (M-12); Notbetrieb erst mit Server + StB | Inhaber |
| RI-14 | Umfang (12 sehr ausführliche Konzepte) überfordert Abnahme | lange Bauzeit, Qualitätsabfall am Ende | Wellen, Gates je Bereich, „Stufe 2“-Funktionen der Konzepte bewusst hinten | L0 |
| RI-15 | Annahme durch das Team (keine IT-Profis) | Rückfall auf Papier/Frappe-Desk | Klicktest mit 2 Mitarbeitern je Welle, Erstbesuch-Bänder, Schulung je Rolle (Q5), Frappe-Desk nur Admin | Q5, Inhaber |
| RI-16 | Sitzungs-Store im Speicher | Prozessneustart meldet alle ab, ausstehende Commits verloren | Redis-Schnittstelle P0-8 vor Livegang; Commit-Register im selben Store | P0-8 |
| RI-17 | Personendaten in Logs/Screenshots | Datenschutzverstoß | Mock-Daten ohne echte Personen, Logs ohne Werte, Screenshots nur Mock | alle |
| RI-18 | Unterschiedliche Fassungen von 01–05 und Konzepten bleiben bestehen | neue Agenten lesen Altes | Rangfolge oben; Q5 zieht 01–05 nach; L0 pflegt Entscheidungslog | Q5, L0 |

---

## 8. Offene Inhaber-Entscheidungen (gesammelt)

Bis zur Antwort wird mit dem Standard gebaut; jede Entscheidung schaltet höchstens eine Einstellung (`betrieb.*`) oder einen Text um, nichts muss neu gebaut werden.

### 8.1 Querschnitt (neu aus dieser Konsolidierung)

| Nr. | Frage | Standard bis zur Antwort |
|---|---|---|
| M-01 | Domain des neuen Backoffice (heute ist `backoffice.platzhirsch.studio` das produktive Frappe) | `office.platzhirsch.studio` (90 Nr. 5) |
| M-02 | Name in der Oberfläche: „Backoffice“ oder ein eigener Name in der Wortmarke | „Platzhirsch“ (Bodoni) + Bereichsname |
| M-03 | Reihenfolge der Bereiche in der Seitenleiste (Q-B2) | Vorschlag 05 § 1 |
| M-04 | Gehen Berichte, Kennzahlen und Bezüge mit Beträgen an Mitarbeiter oder nur an Leitung/GF | nur Leitung/GF/Faktura (permlevel 1) |
| M-05 | 404-gleich bei fehlendem Recht oder `/kein-zugriff` mit Kontakt der Leitung | `/kein-zugriff` |
| M-06 | Standard-Dichte am Desktop | kompakt am Desktop, komfortabel auf Touch (Zentrale schlug „komfortabel“ vor) |
| M-07 | Bodoni-Kopfzahl (eine große Zahl) auf der GF-Zentrale | nein |
| M-08 | Tagesübersicht 07:00 per E-Mail | aus |
| M-09 | Vier-Augen-Grenze (Erstattung, Kulanz, Eingangsrechnung): immer zwei Personen oder ab Betrag | 0 € = immer zwei Personen (Shop schlug 1.000 € vor) |
| M-10 | Kundenmodus beenden: nur Langdruck oder zusätzlich PIN | Langdruck + PIN |
| M-11 | Mitarbeiterauswertung / Zeitstempel je Stopp / Betriebsrat vorhanden, Rechtsgrundlage | aus |
| M-12 | Kassa steht bei Netzausfall, bis Notbetrieb freigegeben ist (Kassa K-03) | ja, steht |
| M-13 | Event-Check-in als 6. Arbeitsplatz-Kachel (nur am Eventtag) | nein, Start aus Event-Akte |
| M-14 | Dürfen Kiosk-Rollen Aufgaben anlegen | ja, sobald ph_core A1 |
| M-15 | Erhält jede Person einen eigenen Benutzer (auch ohne Firmen-E-Mail, z. B. Lager, Montage) | ja; PIN-Weg für Personen ohne E-Mail laut ph_core B2 |
| M-16 | Bargeld/Karte bei Montage oder Technikereinsatz beim Kunden | kein Inkasso (Projekte F1, Service I1, Faktura 15.5, Logistik E11) |
| M-17 | Zweite Firma (Yacht/Hotel) geplant | Firmen-Umschalter aus |
| M-18 | Zugriff auf Frappe-Desk für Admins im Livebetrieb | nur System Manager, nur aus Admin-Netz |

### 8.2 Aus den Bereichskonzepten (Standard in Klammern)

- **Zentrale:** Kursverfahren CHF (Kurs am Beleg) · Schließtage/Betriebsruhe-Liste pflegen (leer).
- **CRM (I1–I7):** Kontakt = Person, Partner als Beteiligte (ja) · Planung kostenpflichtig und Anrechnung (Auswahl im Sheet, keine Vorbelegung) · Löschfristen mit RB/StB (Vorschläge § 7.3) · Rücktritt lebt in ph_faktura (ja) · Bestandskunden-Werbung per E-Mail (nein, nur Einwilligung) · Schwellen ruhende Anfrage und Reaktionsziel (1/7/14/21 Tage, 24 h Werktage) · Berichte anderer Berater sichtbar (nein) · Löschfrist Interessenten 3 Jahre (90 Nr. 22).
- **Projekte (F1–F10):** Wiederöffnen abgeschlossener Projekte (niemand) · Stornoregel nach Auftrag (keine Gebühr vorgeschlagen) · Preise im Portal für Nachträge (nein) · Automationen AU1–AU12 einzeln (alle aus) · interner Montage-Kostensatz (0 €) · Nachtrag-Freigabe im Portal mit Name/Zeit/IP-Hash (ja + Mail) · Richtwerte Montagezeit (0 h) · „Montage erst bei kompletter Ware“ (Warnung) · Planungsänderung nach Bestellung immer Nachtrag (ja).
- **Faktura:** PIN zum Beenden der Präsentation → M-10 · Wer öffnet Monatsabschlüsse wieder (nur GF).
- **Shop:** nur EUR (ja) · Bar-/Kartenerstattung nur an der Kassa (ja) · Reservierung ohne E-Mail mit Ausdruck (ja, nach A9) · Vier-Augen-Grenze → M-09 · `auto_abschliessen_tage` 30 (ja) · Reservierungs-/Abholfrist 7 Tage (ja).
- **Sortiment (O1–O7):** Team darf „Preis bestätigen“ selbst (nein, nur Leitung) · EK-Recht für Team in Bestellung/AB (EK erfasst Leitung) · Anzahlungsregel vor Bestellung (Sollbetrag, Freitext) · Duplizieren behält Bildfreigaben (Serverstand) · Fremdwährung (gesperrt) · Abschließen nur nach Rechnungsprüfung (Hinweis) · Weitergabe Name/Adresse an Hersteller/Spedition (Kommission = Auftragsnummer) · Kalkulationsfaktor, Standardrabatt, EK nur Leitung (90 Nr. 10) · Wertstaffel nur beim Preisimport (90 Nr. 17) · abgelehnte AB-Abweichung zählt als geklärt (90 Nr. 18) · echte Exportdateien CARAT/KPS/Winner/pCon/DataNorm/IDM, GLN (generischer CSV-Import).
- **Logistik:** Anzahlung Sperre oder Hinweis (Sperre) · Abrechnungsart je Sparte (Teilrechnung nur im `⋯`) · Teilzustellung vor A7 (Touren mit AB erst nach A1/A7) · Löschfrist Lieferfotos (Fotos bleiben) · Avis am Vortag automatisch (nur manuell) · Lagergeld nach Fehlversuchen (Aufgabe an Verkauf) · Paketprofile/LetMeShip-Testzugang (Testmodus) · Kunde bei Liefertermin-Änderung automatisch informieren (aus) · SMS-Anbieter (nur E-Mail) · Standard-Spediteur, Ladebreite 240 cm, Reservierung 14 Tage, Abholung ohne Code nur Leitung · Kapazität 480 min, Beginn 07:30, Vorschau 30 Tage · Samstagstouren (aus) · Routendienst (30-min-Pauschale) (90 Nr. 7, 11–15).
- **Kassa:** Mitarbeiter-Storno eigener Belege von heute (nein, immer Freigabe) · Blind zählen (ja) · Bedienerkarte am Namensschild (nein, nur PIN) · Kundendisplay mit Namen (ohne Namen) · CHF annehmen (nein) · Retoure ohne Beleg nur als Gutschein (ja) · Retoure bar ohne Kontakt über Grenze: Name + Unterschrift (ja) · Zweck „Kassenkontrolle je Bediener“ und Information ans Team (offen, keine Auswertung) · Kassa darf Firmenkunden anlegen (nein).
- **Service (I1–I6):** Inkasso vor Ort → M-16 · Mahnsperre bei Reklamation standardmäßig (an) · Pflegemittel nur in Logistik (ja) · kostenpflichtige Anfahrt bei „kein Mangel“ (Satz offen, kein Betrag) · Standard-Techniker je Bereich, Portal-Sichtbarkeit neuer Fälle (keiner / sichtbar) · Klicktest Übersicht vs. „Mangel & Fristen“ (5 Tabs bleiben).
- **Kundenkarte:** Stufennamen Platzhirsch/Plus/Privé (Vorschlag) · Schwellen 10.000/50.000 € (Platzhalter, nicht öffentlich) · Vorteilsmatrix, Region „Lieferung frei“/„Montage inklusive“ (Vorschlag copy.js) · Farbe Privé (eigene Datenfarbe) · Umsatz netto, bezahlt, ab Schlussrechnung, Karenz (so) · Firmenkunden (nein) · Liefergebiet und Umtausch-Ausschlüsse (offen) · Apple/Google-Wallet-Konto (in Vorbereitung).
- **Marketing:** Vier-Augen bei Leitung = Ersteller (aus) · keine E-Mail-Maskierung (so) · Adventsabend: Uhrzeit, Programm, Plätze, Gutscheinwert Empfehlung, Mindestauftragswert, kostenpflichtige Events (Status Geplant, Kostenbeitrag gesperrt).
- **Personal (D):** Sichtbarkeit „Urlaub“ für Kolleginnen (nur „abwesend“) · Urlaubsjahr (offen, Konten aus) · Arbeitszeitmodell Gleitzeit/fix (offen) · 24./31.12. und Josefstag (offen) · wer genehmigt Anträge der Leitung (GF) · Betriebsrat/Zustimmung Zeiterfassung → M-11.

### 8.3 Steuerberater und Kanzlei

Gesammelt in `91-steuerberater-fragen.md` (Nr. 1–23). Livegang-relevant zuerst: RKSV Retoure/Storno (1, 2, 6), Gutscheinart (3, 13, 17), Anzahlungsrechnung an der Kassa (4), Mahnwesen Unternehmer (9), Exportformate BMD/RZL/DATEV (10), Geldwäsche-Identität (11), Gewährleistung Einbauküche (19), Personal/Zeiterfassung (20), Bestandskunden-Werbung (21). Dazu aus den Konzepten: Leistungsdatum Versand vs. Zustellung (Shop, Logistik), Teilrechnung je Teilabnahme (Projekte F5), § 19 Abs 1a UStG bei Generalunternehmern (Projekte F4), Ausfuhrnachweis CH (Logistik), Kulanzgutschein als Entgeltsminderung (Shop), Drucktitel „Gutschrift“/„Rechnungskorrektur“ (Faktura E13), Unterschrift am iPad als Abnahmenachweis (Projekte F8, RA).
