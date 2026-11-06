# 8x – Übergabe Team P0-6 (Fundament v2: Eingabe und Kiosk im Lounge-Stil)

**Stand:** 2026-11-04 · Auftrag: MASTER §4 G-21 (Kalender, Raster, BetragFeld), G-22 (ScanTor, KameraScan), G-23 (Unterschrift), G-24 (Kiosk-Kern v2 im Lounge-Kiosk-Stil), G-30 (FotoAufnahme) sowie der BroadcastChannel/SSE-Kanal für das Kundendisplay. Gestaltung nach `art-direction/lounge.md` (Inhaber-Entscheidungen Nr. 51/53). Vom früheren, abgebrochenen Lauf gab es nur den alten Kiosk-Bestand (`KioskShell`, `KioskPlatzhalter`, `hooks`). Er ist weiterverwendet und auf Lounge umgebaut, die API bleibt kompatibel.

## Gebaut

| Datei | Inhalt |
|---|---|
| `backoffice/src/components/Backoffice/Kalender/` | `Kalender.js` (Woche/Monat/Tag, sieben Quellen als Material-Pillen, `role="grid"` mit Roving-Fokus, T/W/M/D, Enter neu/öffnen, Ziehen mit Maus/Stift im 15-min-Raster, Kontextmenü und Dialog „Umplanen …“ als Alternative, Kollisionen als Symbol + Text, Jetzt-Linie, Ganztagszeile), `Slotraster.js` (freie 30-min-Zeiten, Radiogruppe, „n weitere Zeiten“), `Raster.js` (Plantafel/Mini-Gantt: Zeilen × Tage, Bahnen, Ziehen, Umschalt+Pfeil), `logik.js` (rein, getestet), `kalender.css`, `texte.js`, `index.js` |
| `…/Eingabe/` | `BetragFeld.js` + `betrag.js` (Komma-Modell, Cent, Fehlertext, `parseMenge` ganzzahlig, Zahlentastatur-Logik), `ScanTor.js` + `scan.js` (Erkenner < 30 ms, Kürzel-Schutz, Ziele Feld/Palette/global/aus), `ScanFeld.js` (großes Scanfeld wie Lounge-Packtisch), `KameraScan.js`, `Unterschrift.js` + `unterschrift-logik.js` (Vektor-Striche, PNG + SHA-256 + Zeit, Alternativen mit Pflichtfoto, einmal gesetzt nicht änderbar), `FotoAufnahme.js` + `exif.js`, `aktionen.js` (Server Actions `dateiHochladenAction`, `unterschriftSpeichernAction` mit Mock-Pfad), `eingabe.css`, `texte.js`, `index.js` |
| `…/Kiosk/` | `KioskShell.js` v2 (schwebende Material-Statuszeile, Kopfzeilen-Slot, Status-Pille, Bediener-Chip, Hilfe 44 px + F1, Hell/Dunkel, Mehr-Menü, Sperren; Band-Stapel Q-J4; Idle-Band 30 s + Sperrbild; `data-tastatur`; Live-Region `useKiosk().ansagen`; ScanTor global; Warteschlangen-Pille; Kurzform am Telefon), `KioskPlatzhalter.js` (Lounge: Scanfeld + Listen-Kacheln), `Zahlentastatur.js`, `Stepper48.js`, `Wischaktion.js`, `Positionsgrid.js`, `warteschlange.js` (IndexedDB), `hooks.js` (+ `useEingabesperre`, `useTastatur`, `useIdle`; `useScanner` auf 30 ms), `logik.js`, `kiosk.css`, `texte.js`, `index.js` |
| `backoffice/src/lib/backoffice/datum.js` | Erweiterung (Woche, KW, Minutenrechnung über Tagesgrenzen, deutsche Titel). Bestehende Exporte unverändert. |
| `backoffice/src/lib/backoffice/kanal/` | `protokoll.js` (Nachrichtenform, datensparsame Bereinigung, Zustände ruhe/einkauf/bezahlen/danke + Abbildung der ph_kassa-Zustände), `browser.js` (`useKundendisplaySender`, `useKundendisplay`: BroadcastChannel, SSE, Polling 2 s, „Anzeige pausiert“), `hub.js` (Verteiler im Prozess), `route.js` (GET/POST-Handler zum Einhängen), `texte.js`, `index.js` |
| `…/Demo/eingabe.js` + eine Zeile `lib/backoffice/demo-register.js` | Demo `eingabe` mit allen Bausteinen, Musterdaten aus dem Lounge-Entwurf, feste Demo-Zeit 04.11.2026 14:32 |
| `…/Backoffice/README.md` | Abschnitt „Eingabe, Kalender und Kiosk v2 (Team P0-6)“, Tabellenzeile `Kiosk/KioskShell` nachgezogen |
| `backoffice/tests/unit/backoffice-eingabe-kiosk.test.mjs`, `backoffice/tests/e2e/backoffice-eingabe-kiosk.spec.js` | eigene Tests (neue Dateien) |

## Tests

- Unit: `node --test "tests/unit/**/*.test.mjs"` → **258/258 grün**, davon 23 neu von P0-6 (Datum, Kalender-Layout/Kollision/Slots/Fokus, Raster-Bahnen, Betrag/Zahlentastatur, Scan-Erkenner und Ziele, EXIF, Unterschrift/Prüfwert, Bänder/Idle/Warteschlange/Wischen/Grid, Kanal-Datensparsamkeit und Verteiler, Token/Versalien-Prüfung der eigenen Dateien, Demo-Register).
- ESLint: **0** auf allen eigenen Dateien.
- E2E `--project=desktop`: `backoffice.spec.js` + `backoffice-motion.spec.js` **16 bestanden, 2 übersprungen** (fremde Demo-Prüfungen). Der Arbeitsplatz-Test mit axe auf `/kassa` und dem Bedienerwechsel ist grün, zusätzlich im Projekt `ipad`. Die eigene Spec hat 1 Test bestanden (Statuszeile, F1, Sperren, globaler Scan) und 1 übersprungen, weil die Demo nicht in `/einstellungen` eingebunden ist.
- Screenshots: `tools/qa/shoot.mjs` auf `/kassa|packtisch|montage|technik`, 24 Aufnahmen, **0 Befunde** (vorher „Fokus ohne Ring“ am Scanfeld, behoben: Ring liegt an der Pille).
- Ersatzprüfung der Demo (ohne Next-Route, Bündel mit Nexts SWC + Tailwind, Scratchpad `P0-6/`): **35 Prüfungen, 0 Befunde**. Geprüft wurden u. a. Kalender ↓/M/W, Umschalt+Enter → Umplanen, Ziehen 12:00 → Do 13:00, Scan im Feld (EAN), Fehlscan-Ring, Scan außerhalb → Palette, BetragFeld, Zahlentastatur inkl. „Passend“, Stepper, Positionsgrid, Kanal ohne Kontaktdaten/Name, Unterschrift zeichnen → gesetzt, Foto mit Vorschau, kein Überlauf (Desktop, iPhone), keine Konsolenfehler hell/dunkel, Kiosk (WebKit, iPad quer) hell/dunkel, Bänder max. 2 + „+1 weitere“, Warteschlange „2 Fotos …“, Idle-Band, Sperrbild, F1-Hilfe, `data-tastatur`, Scan-Ansage, Kopfzeile am iPhone ohne Überlauf.
- Sichtprüfung neben `qa-screenshots/entwurf-lounge/` (4-kassa, 5-packtisch): Die Statuszeile hat dieselbe Kapsel, Höhe 64, Material, runde 44er-Knöpfe, Status-Pille in Salbei und Bediener mit Avatar. Scanfeld, Positionszeilen (aktiv = Salbei-Kontur, ohne Barcode = Messing, vollständig = Salbei) und Zahltasten sind wie im Lounge-Packtisch und in der Lounge-Kassa umgesetzt, das Sperrbild ist im Stil eines Sperrbildschirms. Nach der Sichtung korrigiert: Listen-Kacheln standen spaltenweise, die Telefon-Kopfzeile lief über, Kollisionstexte in schmalen Spalten (jetzt nur Symbol mit Text als Titel/aria), kurze Einträge sind einzeilig, Slotraster zu lang (jetzt 8 + „weitere“), Plantafel-Spalten 44 → 64, die Unterschrift-Alternativen sprengten das iPhone, das BetragFeld hat beim Fokus den Text umformatiert.

## Offene Punkte

1. **Kundendisplay-Route einhängen** (Besitzer `src/app/api/**`): `src/app/api/kassa/display/route.js` = `export { GET, POST } from "@/lib/backoffice/kanal/route"; export const dynamic = "force-dynamic";`. Bis dahin läuft nur die Kopplung im selben Gerät über BroadcastChannel, ein Fern-Display zeigt „Anzeige pausiert“. Bei mehreren Backoffice-Instanzen muss der Verteiler auf Redis Pub/Sub umziehen.
2. **ScanTor in der Shell** (P0-7): einmal `<ScanTor />` (Modus backoffice) in `Shell` einhängen, damit Scans außerhalb von Feldern die Palette öffnen. Die Kiosk-Shell hat ihn schon.
3. **Demo-Einbindung** in `/einstellungen?tab=system&baustein=…` (Zentrale/L0) fehlt weiter; die Demo-Spec überspringt sich bis dahin.
4. **Kamera-Leser auf iPad/iPhone**: Safari hat keinen `BarcodeDetector`. Dort fällt KameraScan ehrlich auf das Eintippen zurück. Eine Lese-Bibliothek bräuchte ein neues Paket (Freigabe P0-9, Inhaber-Frage 60).
5. **Unterschrift-Unveränderbarkeit im Backend**: Die Server Action prüft vorher, ob das Feld schon gesetzt ist. Endgültig sicher wird das erst mit `set_only_once`/Validierung am DocType-Feld in der jeweiligen ph_*-App (Logistik: Lieferschein, Projekte: Abnahme, Service: Einsatz). Wer die Felder anlegt, sollte das mit erledigen.
6. **Datei-Upload-Route**: `/api/datei` kann nur lesen, Uploads laufen über die Server Action `dateiHochladenAction` (15 MB, nur Bilder). Für große Serien wäre ein Stream-Upload über die API-Route besser (Fundament).
7. Die Alt-Hooks `useTastenkuerzel` bleiben als Unterbau. Neue Kiosk-Tasten bitte über das Kürzel-Register (`kuerzel/<bereich>.js`) eintragen.

## Abweichungen vom Konzept (MASTER/03 → Lounge)

Die Kiosk-Kopfzeile ist eine schwebende Material-Kapsel statt einer randbündigen 56-px-Leiste mit Linie. Der Status heißt „Verbunden“/„Offline“ statt nur ein Symbol. Bänder sind weiche Flächen mit Symbolkreis statt Vollfarbe. Die Zahltasten haben Radius 18 statt 6. Kalendereinträge sind Materialflächen mit Kante statt Rahmen, der Fokus ist Cognac. Bewegung läuft mit Feder (Lounge §8), im Kiosk ohne Staffel. Der Idle-Timeout ist auf 15 min voreingestellt (Q-J2) und je Arbeitsplatz über `idleMs` einstellbar.

## Fähigkeiten-Stand

Keine Schein-Knöpfe. Die Kamera zeigt ohne Leser einen Ersatzweg. Upload und Unterschrift laufen im Mock-Pfad über den MockClient, im Frappe-Modus über `upload_file` + `set_value`, mit Schreibrecht des Benutzers. Der Kundendisplay-Kanal braucht serverseitig nichts aus ph_kassa (`display_senden` bleibt für die Desk-Kassa).

## Neue Fragen

- Inhaber: Nr. 60 (Kamera-Leser iPhone/iPad), 61 (Idle-Sperre je Arbeitsplatz), 62 (Unterschrift-Alternativen, Ungültig-Erklärung).
- Steuerberater/Recht: Nr. 33 (Unterschrift am Gerät als Nachweis, Aufbewahrung).

## Screenshot-Ordner

`backoffice/qa-screenshots/p0-6-eingabe-kiosk/` mit 24 Aufnahmen der Kiosk-Routen (Desktop, iPad, iPhone, hell/dunkel) und `bericht.md`. Unterordner `vorschau/`: Demo Desktop hell/dunkel + iPhone, Kalender Woche/Monat/Ziehen/Umplanen, Scan-Fehlscan, Unterschrift gezeichnet/gesetzt, Foto, Kiosk-Packtisch iPad quer hell/dunkel (WebKit), Bänder, Warteschlange, Idle, Sperrbild, Hilfe, iPhone-Kopf, `pruefung.json`. Prüfwerkzeuge im Scratchpad `P0-6/` (`bau.mjs`, `server.mjs` Port 3196, `foto.mjs`, `KioskVorschau.js`).
