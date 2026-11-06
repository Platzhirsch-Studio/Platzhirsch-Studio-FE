# 8x – Übergabe Team P0-5b (Fundament v2: Liste, Zu tun, Bericht, Formular, Kanban)

**Stand:** 2026-11-04 · Auftrag: MASTER § 4 G-09 (Speicherleiste + useAutosave), G-10 (Unternav), G-11 (ZuTun), G-13 (BerichtSeite), G-29 (ZweiKlickKnopf), Seitenkopf mit großer Überschrift, Formular/DataTable/Kanban im Lounge-Stil. Gestaltung ausschließlich nach Lounge (Inhaber Nr. 51/53, `art-direction/lounge.md`).
Ein früherer Lauf hatte im Schreibbereich nichts angelegt (ZuTun/, Bericht/, Unternav, ZweiKlickKnopf, aufgaben/ fehlten; Formular/DataTable/Kanban/Seitenkopf/BereichStart waren noch v1 mit Rahmen-Kästen).

## Gebaut

| Datei | Inhalt |
|---|---|
| `components/Backoffice/Seitenkopf.js` | Lounge-Seitenkopf: leichter Pfad (13/500) über großem Titel 34/600, runder Zurück-Knopf ab vier Krumen, leichte Kennzahlen rechts mit Haarlinien, Aktionen, `titelZusatz`, `unternav`-Zeile, Variante `gruss` (56/300). Rückwärtskompatibel – alle 11 Aufrufer unverändert. |
| `components/Backoffice/Unternav.js` | G-10: Pillen-Kapsel mit gleitender Tinte-Pille, Zähler, max. 7 + „Mehr“, Randverlauf, `aria-current`. |
| `components/Backoffice/ZuTun/` (`ZuTun.js`, `Client.js`, `logik.js`, `texte.js`, `zutun.css`) | G-11: Server-Komponente, je Quelle eigenes `<Suspense>`, Fehler/Zeitlimit je Zeile mit „Erneut“, „Alles erledigt“ und „Alle anzeigen“ per CSS `:has`, Sicht-Chips, Knopf als Link oder Server Action. |
| `lib/backoffice/aufgaben/index.js` | Zu-tun-Register (`ZUTUN_BEREICHE`, Import-Zeilen trägt P0-5/L0 ein), Prüfung, Rechte/Sicht, Zählen mit 8-s-Zeitlimit, generische Quellen aus echten Daten. Reines Modul. |
| `components/Backoffice/BereichStart.js` | Bereichsstart (Q-B4): Seitenkopf, „Zu tun“, Listen als schwebende Kacheln. |
| `components/Backoffice/Bericht/` (`BerichtSeite.js`, `BerichtTeile.js`, `aktionen.js`, `logik.js`, `texte.js`) | G-13: Filterzeile (Zeitraum, Felder), Diagramme im Bento, Tabelle in Kachel mit Summenzeile, CSV nur mit Export-Recht (`berichtExportAction`, Server-Log), PDF-Link oder deaktiviert mit Ersatzweg, Leer/Zeitlimit/Fehler. |
| `components/Backoffice/ZweiKlickKnopf.js` | G-29: zweiter Klick binnen 3 s, Ziegel-Fläche mit auslaufendem Balken, Esc/Blur bricht ab, Ansage. |
| `components/Backoffice/Formular/` (`Speicherleiste.js`, `useAutosave.js`, `autosave.js`, `texte.js`, `formular.css` neu; `Formular.js`, `Feld.js`, `Kindtabelle.js`, `WorkflowLeiste.js`, `Zeitleiste.js`, `LinkFeld.js`, `Datumsfeld.js` umgestellt) | G-09 eigenständig; Formular mit Kapsel-Reitern, Kachel-Abschnitten, eingelassenen Feldern, Verwerfen, optional `autosave`/`onSpeichern`; Verlauf mit Symbolkreisen und Avataren; Datumsfeld mit Kalenderknopf im Feld. |
| `components/Backoffice/DataTable/` (`logik.js`, `texte.js`, `datatable.css` neu; `DataTable.js`, `Filterleiste.js` umgestellt) | Tabelle in schwebender Kachel, Bild/Avatar + Titel + Nummer je Zeile, Personen mit Avatar, Massen-Kapsel unten, Telefon-Karten, Status-Kapsel + Pillen-Suche + Zeitraum-Karte. |
| `components/Backoffice/Kanban/` (`texte.js`, `kanban.css` neu; `Kanban.js` umgestellt) | Spalten eingelassen, Karten schwebend, Person mit Avatar, `onVerschiebe`. |
| `components/Backoffice/Demo/seitenmuster.js` + `seitenmuster-teile.js`, Zeile `seitenmuster` in `lib/backoffice/demo-register.js` | Demo aller Teile (Seitenkopf drei Varianten, Unternav, Zu tun mit langsamer/leerer/fehlerhafter Quelle, Liste mit Bildern, Kanban, Formular, Speicherleiste, Autosave mit Fehlerschalter, Zwei-Klick, Bericht mit Ergebnis und Zeitlimit). |
| `components/Backoffice/README.md` | Abschnitt „Seitenmuster im Lounge-Stil (Team P0-5b)“, Verweise in der Komponenten-Tabelle. |
| Tests (eigene Dateien) | `tests/unit/backoffice-seitenmuster.test.mjs` (15), `tests/e2e/backoffice-seitenmuster.spec.js` (5). |

## Tests

| Prüfung | Ergebnis |
|---|---|
| Unit gesamt `node --test "tests/unit/**/*.test.mjs"` | **258 / 258 grün** (davon 15 neu) |
| ESLint `--max-warnings 0` auf allen eigenen Dateien | **0** |
| E2E `backoffice-seitenmuster.spec.js` desktop + ipad | **10 / 10** (Demo-Test gegen die Spiegel-Vorschau `/p05b`; im echten Baum überspringt er, bis die Demo eingebunden ist) |
| E2E bestehend desktop: `backoffice.spec.js`, `backoffice-motion.spec.js`, `backoffice-grundbausteine.spec.js`, `backoffice-shell.spec.js` | **29 grün, 6 übersprungen** (Demos ohne Einbindung); ein Treffer zwischenzeitlich (Shell-Hilfe-Test klickte auf eine ganz klickbare Zu-tun-Zeile) – behoben, Zeile nicht mehr vollflächig verlinkt |
| E2E `backoffice.spec.js` ipad | **9 / 9** |
| `tools/qa/shoot.mjs` (`/crm`, `/projekte`, `/faktura`, `/d/ph-anfrage/…`, 3 Viewports × hell/dunkel) | **24 Aufnahmen, 0 Befunde** |
| Eigene Aufnahmen (Demo, Liste, Aufgaben-Liste, Kanban; Desktop/iPhone, hell/dunkel) | 0 Überlauf, 0 Konsolenfehler |

**Testumgebung:** :3100 liefert weiterhin für alle Routen 500 (veralteter Turbopack-Fehler „Can't resolve './ereignisse'“, siehe Übergabe P0-7); nicht neu gestartet. Alle E2E/Screenshots liefen gegen einen eigenen Spiegel des aktuellen `backoffice/src` auf **:3117** (Next 16.4.1 `--webpack`, Mock, Scratchpad P0-5b; dort zusätzlich nur eine Vorschau-Route `/p05b` für die Demo). Nach dem Neustart von :3100 bitte einmal `PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/backoffice-seitenmuster.spec.js tests/e2e/backoffice.spec.js --project=desktop` wiederholen.

Sichtprüfung neben `entwurf-lounge/2-anfragen` und `1-zentrale`: Liste (Kachel ohne Rahmen, Avatar/Bild + fette Zeile + Nummer darunter, weiche Status-Pillen, Pillen-Kapsel der Status, Pillen-Suche), Bereichsstart (großer Titel, „Zu tun“-Zeilen wie die „Heute“-Karten, Listen-Kacheln mit leichter Zahl und Pfeil-Knopf), Kanban (eingelassene Stufen-Spalten wie die Kundenreise), Formular (Kachel-Abschnitte, eingelassene Felder, Material-Speicherleiste) – aus einem Guss mit Shell (P0-7) und Grundbausteinen (P0-2), hell und dunkel. Korrigiert nach Sichtung: Kartenliste erschien am Desktop zusätzlich (CSS-Reihenfolge), Bilder in der Demo-Tabelle luden außerhalb des Sichtbereichs nicht (erste 10 jetzt sofort), Status in „Zu tun“ ohne Umlaut („Unbestaetigt“ → `anzeige()`), Speicherleisten-Demo zu schmal.

## Offene Punkte

1. **:3100 neu starten** (blockiert seit 16:13 alle Teams).
2. **Demo-Einbindung** `/einstellungen?tab=system&baustein=seitenmuster` (Zentrale/L0).
3. **Seiten-Aufrufer (L0/Bereiche):** `src/app/[bereich]/page.js` kann `sicht={sp.zutun}` und `sichtChips` an `BereichStart` geben (Chips sind bis dahin aus, damit kein Schein-Filter erscheint); `/d/[doctype]/[name]` kann `autosave` am Formular setzen, sobald Q-D1 für den DocType freigegeben ist (Workflow-DocTypes ausgenommen); Listen können `bildFeld`, `unterFelder` setzen (Inhaber-Frage 59).
4. **Zu-tun-Register:** Bereiche liefern `lib/backoffice/aufgaben/<bereich>.js`; Import-Zeile in `ZUTUN_BEREICHE` trägt P0-5/L0 ein. Die Zentrale (`app/page.js`, „Meine Aufgaben“) kann `ZuTun` mit allen Quellen nutzen – Besitzer Zentrale.
5. **PDF-Bericht:** Route `/druck/bericht/[report]` fehlt (Druck P0-5c / Bereiche); bis dahin ist „PDF“ deaktiviert mit Ersatzweg CSV.
6. **Export-Protokoll:** `berichtExportAction` schreibt ins Server-Log; ein dauerhaftes Protokoll (z. B. ph_core „PH Export Protokoll“) gibt es im Backend nicht – Vorschlag für ph_core.
7. **Zentrale-Seitenkopf:** `app/page.js` nutzt den Seitenkopf als großen Titel („Guten Abend, …“); mit `variante="gruss"` würde er wie im Lounge-Entwurf zweizeilig leicht – Besitzer Zentrale.

## Abweichungen vom Konzept

- **Unternav als Pillen** statt 2-px-Unterstrich (Q-B3) – Lounge-Freigabe Nr. 51/53 hat Vorrang (Auftrag).
- **Autosave am generischen Formular** ist eine Option (`autosave`), nicht Standard: die generischen Seiten gehören nicht P0-5b, und Workflow-DocTypes dürfen nicht still speichern.
- **„Alle anzeigen“ in Zu tun** ohne Zahl „Alle n“: die Zeilen streamen einzeln; die Gesamtzahl steht erst nach allen Quellen fest. Die Zahl je Zeile steht im Satz.
- **Listen:** Nummer steht als Unterzeile unter dem Titel statt in eigener Spalte (Lounge-Tabelle); Spaltenwahl und Sortierung bleiben.

## Fähigkeiten-Stand

Keine Schein-Knöpfe: Sicht-Chips nur mit durchgereichter Sicht; PDF deaktiviert mit Ersatzweg; CSV nur mit Export-Recht; Zu-tun-Zeilen nur aus echten Zählungen (Mock und Frappe gleich, `client.count`). Neue Fähigkeiten im Register: keine.

## Neue Fragen

- Inhaber: **Nr. 59** (Bild je Listenzeile).
- Steuerberater: keine.

## Screenshot-Ordner

`backoffice/qa-screenshots/p0-5b-seitenmuster/`: `crm|projekte|faktura|d-ph-anfrage-…--{desktop,ipad,iphone}--{hell,dunkel}.png` + `bericht.md` (shoot.mjs, 0 Befunde), `demo-seitenmuster--…`, `liste-anfrage--…`, `liste-aufgabe--…`, `kanban-aufgabe--…`, `teil-liste-anfrage--desktop--…` (Ausschnitt zum Nebeneinanderlegen mit `entwurf-lounge/2-anfragen`).
