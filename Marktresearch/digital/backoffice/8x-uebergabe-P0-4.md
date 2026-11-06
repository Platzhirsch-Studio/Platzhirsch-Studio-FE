# 8x – Übergabe Team P0-4 (Fundament v2: Overlays im Lounge-Stil)

**Stand:** 2026-11-04 · Auftrag: MASTER §4 G-06 (Popover, Tooltip, Dialog-Größen), G-07 (Sheet inkl. Peek), G-08 (Lightbox), gestaltet nach `art-direction/lounge.md` (Inhaber-Entscheidungen Nr. 51/53). Ein früherer, abgebrochener Lauf hatte nur `Overlay/texte.js` angelegt. Die Datei ist weiterverwendet und ergänzt.

## Gebaut

| Datei | Inhalt |
|---|---|
| `backoffice/src/components/Backoffice/Overlay/Popover.js` | `Popover` (Menü oder kleiner Dialog am Auslöser, gesteuert oder ungesteuert, Fokusfalle optional), `Menue`, `MenuePunkt` (Icon, Kürzel, gefährlich, gesperrt mit sichtbarem Grund, Häkchen), `MenueTrenner`, `MenueGruppe` (Bezeichnung in Satzschreibung), `Kontextmenue` (Rechtsklick, langes Drücken 500 ms, Umschalt+F10/Kontextmenü-Taste). Top-Layer über `popover="manual"`, im DOM beim Auslöser, funktioniert daher auch in Dialogen/Sheets. Material blur 40 + saturate 180 % + Lichtkante, Radius 20, Flip + 8 px, Nachführen bei Scroll/Größe, Tastatur ↑/↓/Pos1/Ende/Tipp-Suche, Esc/daneben/Tab schließt, Fokus zurück. Unter 640 px Bottom-Sheet mit Griff über Scrim. |
| `…/Overlay/Tooltip.js` | Tinte-Pille im Top-Layer, max. 240 px, 400 ms, in der Gruppe sofort (< 300 ms), nur Maus/Tastaturfokus, im Kiosk aus, Esc/Scroll schließt, `aria-describedby`. |
| `…/Overlay/Dialog.js` | `Dialog` (nativer `<dialog>`, sm/md/lg = 400/560/800, Radius 32, Material, Scrim mit Unschärfe, `sperren` = kein Esc/Scrim/Ziehen, unter 640 px Bottom-Sheet mit Griff und Ziehen), `Fakten` (eingelassene Karte). |
| `…/Bestaetigen.js` | Auf `Dialog` umgebaut, API unverändert (alle drei Aufrufer laufen ohne Änderung: `geraet/GeraeteTabelle.js`, `Formular/WorkflowLeiste.js`, `Demo/motion.js`). Neu: `fakten`, `groesse`, `symbol`, Kinder. Zentriert wie ein iOS-Hinweis, gleich breite Knöpfe `[Abbrechen] [Primär]`, gefährlich → Ziegel + Warnsymbol + Fokus auf Abbrechen, Esc während `laeuft` wirkungslos; Klassen `bo-dialog` bleiben (Motion-Spec). |
| `…/Overlay/Sheet.js` | `Sheet` (schwebende Material-Karte rechts 12 px vom Rand, Radius 28, sm/md/lg = 400/480/640, Kopf 56 mit maximize-2 und Schließen, leichter Scrim, `ungespeichert` → Rückfrage, `panel` → `?panel=<name>`), `usePanel(name)`, `Peek` + `useListenPeek` (nicht modal, Leertaste, J/K/↑/↓ auch auf der Zeile, Zeile markiert, Position „2 von 5“, Fokus zurück). Unter 640 px von unten mit Griff: folgt dem Finger, Gummiband nach oben, Wurf/30 % schließt, sonst Feder zurück. |
| `…/Overlay/Lightbox.js` | Bilder/PDF, dunkle Bühne mit Glas-Bedienung, ←/→/Pos1/Ende, Zoom 1×/2× (Klick zoomt an der Stelle, Ziehen verschiebt, begrenzt), PDF im Rahmen + „In neuem Tab öffnen“, Quelle · Freigabe als Zeile, Miniaturen, Nachbarbilder vorgeladen, Ladefehler als Hinweis. Download nur mit Recht **und** Freigabe-Umfang. |
| `…/Overlay/hilfen.js`, `logik.js`, `overlay.css`, `texte.js`, `index.js` | Client-Hilfen (schmal, Kiosk, Fokus, `useDialogOffen`, `useZiehen`), reine Logik (Platzieren mit Flip, Blättern, Zoom, Zieh-Entscheidung, Tooltip-Gruppe, `?panel`, Tipp-Suche, Download-Regel), Form/Material nur mit Token (Präfix `bo-ov-`), Texte, ein Einstieg. |
| `…/Demo/overlay.js` + eine Zeile `lib/backoffice/demo-register.js` | Demo `overlay`: Menü, Filter-Popover, Kontextmenü auf Karten, Tooltips, Bestätigen normal/gefährlich mit Fakten und laufendem Vorgang, Dialog md, Anfragen-Tabelle mit Peek, Notiz-Sheet mit Rückfrage, Lightbox mit 4 Bildern + PDF und Rechte-Schalter. Musterdaten aus dem Lounge-Entwurf. |
| `…/Backoffice/README.md` | Abschnitt „Overlays im Lounge-Stil (Team P0-4, G-06 · G-07 · G-08)“. |
| `backoffice/tests/unit/backoffice-overlay.test.mjs`, `backoffice/tests/e2e/backoffice-overlay.spec.js` | Eigene Tests (außerhalb des Schreibbereichs, wie bei P0-2: neue Dateien, nichts Fremdes geändert). |

## Tests

- Unit: `node --test "tests/unit/**/*.test.mjs"` → **164/164 grün** (davon 14 neu für die Overlays).
- ESLint: **0** auf allen eigenen Dateien (Overlay/, Bestaetigen.js, Demo/overlay.js, Register, beide Tests).
- E2E `--project=desktop`: **nicht lauffähig**, der Dev-Server :3100 liefert seit dem Nachmittag auf jeder Route 500 (fremder Shell-Umbau: `Shell/Glocke.js` importiert `./ereignisse`, die Datei fehlt; P0-8 meldet dasselbe). Ich habe den Server nicht neu gestartet und fünf Minuten gewartet, ohne Erfolg. Die neue Spec überspringt sich, solange die Demo nicht in `/einstellungen` eingebunden ist.
- Ersatzprüfung (Scratchpad, ohne Next-Route): Die Demo wurde mit Nexts SWC gebündelt, `globals.css` + `bo-motion.css` mit Tailwind kompiliert und in Chromium geprüft, Desktop 1440×900 und iPhone 390×844, jeweils hell und dunkel. **88 Prüfungen (Interaktion + Überlauf je Aufnahme), 0 Befunde**, darunter Menü-Tastatur, Tipp-Suche, gesperrter Eintrag erreichbar, Esc gibt den Fokus zurück, Kontextmenü am Zeiger, Tooltip erst nach 400 ms, Fokus auf Abbrechen bei Gefahr, Esc während der Ausführung gesperrt, Peek (Leertaste, J, markierte Zeile, `?panel` gesetzt und wieder entfernt, Fokus zurück zur Zeile), Rückfrage bei ungespeicherten Änderungen, Lightbox (Blättern, Download-Regel, Zoom), Bottom-Sheet am Telefon. Dazu kein Überlauf, keine Konsolenfehler.
- Sichtprüfung neben `qa-screenshots/entwurf-lounge/`: Das Bestätigen-Sheet hat dieselbe Anmutung wie `4-kassa--ipad--bezahlt-*` (Radius 32, Material, eingelassene Karte, Pillenknöpfe). Der Peek entspricht dem Vorschau-Panel in `2-anfragen--desktop-*` (Bild mit Glas-Chips, Wunsch-Karte, Fakten zweispaltig, Primärknopf unten), die Menüs sind schwebendes Material ohne Linien. Nach der Sichtung korrigiert: Bottom-Sheet-Hülle am Telefon war nicht vollflächig, das erste Werkzeug im Peek bekam Fokusring und Tooltip (jetzt Fokus auf dem Panel), die Positionsanzeige „1 von 5“ ist am Telefon ausgeblendet.

## Offene Punkte

1. **E2E nachholen**, sobald :3100 wieder läuft: `PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/backoffice-overlay.spec.js tests/e2e/backoffice-motion.spec.js tests/e2e/backoffice.spec.js --project=desktop`. Die Motion-Spec prüft `dialog.bo-dialog` aus `Bestaetigen`, Klassen und Übergänge sind erhalten.
2. **Kompilierung durch Next ungeprüft:** `Overlay/overlay.css` wird als globales CSS aus den Komponenten importiert, so wie `Shell/shell.css` (P0-7). In der Ersatzprüfung lief es, durch Turbopack noch nicht.
3. **Demo-Einbindung** in `/einstellungen?tab=system&baustein=…` (Besitzer Zentrale/L0) fehlt weiter. Bis dahin sind alle Demo-Specs übersprungen.
4. **Popover-Menüs in der Shell** (Benutzermenü, Neu-Menü, Glocke von P0-7) und das Datumsfeld-Popover können auf `Menue`/`Popover` umgestellt werden, das ist Sache der Besitzer.
5. Die alte CSS-Regel `dialog.bo-dialog[open] { animation: bo-pop-in … }` in `globals.css` wird von `bo-motion.css` überschrieben und kann weg (P0-2/Q2).

## Abweichungen vom Konzept (MASTER/03 → Lounge)

Popover-Radius 6 → 20 (Lounge-Karte). Griff 32×4 → 40×5 (Lounge §6 Sheet). Das Sheet ist eine schwebende Karte mit 12 px Rand statt einer randbündigen Seitenleiste in voller Höhe; der Scrim ist 0,12 mit leichter Unschärfe statt 0,2. Der Peek ist ohne Scrim und nicht modal, damit die Liste bedienbar bleibt. Öffnen 160 ms Blende plus Feder statt 200/120 linear (Q2-Werte). Dialog-Bottom-Sheet am Telefon mit Primärknopf oben (iOS). Die Lightbox ist in beiden Schemata dunkel (Inhaber-Frage Nr. 47).

## Fähigkeiten-Stand

Keine Fachaktionen und keine Server Actions, alles rein darstellend. Die Download-Regel der Lightbox (`herunterladen` = Recht, `freigabe.download` = Umfang) bekommt ihre Werte vom Bereich Sortiment.

## Neue Fragen

- Inhaber: Nr. 47 (Lightbox immer dunkel?).
- Steuerberater: keine.

## Screenshot-Ordner

`backoffice/qa-screenshots/p0-4-overlay/` mit 34 Aufnahmen (Übersicht, Menü, Popover, Kontextmenü, Tooltip, Bestätigen gefährlich und laufend, Dialog md, Peek, Sheet, Rückfrage, Lightbox, Zoom; iPhone: Menü, Bestätigen, Peek, Lightbox; jeweils hell und dunkel). Prüfwerkzeuge im Scratchpad `P0-4/` (`bau.mjs`, `server.mjs`, `foto.mjs`).
