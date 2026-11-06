# 8x – Übergabe Team B-ABL (Bereich Ablage, Lounge)

**Stand:** 2026-11-04 · Auftrag: Bereich Ablage vollständig bauen (Drive-artige Dateiablage nach `Backend-Import/ph_ablage/README.md` „Schnittstelle für das Backoffice“), vorher Konzept schreiben (`10-konzept-ablage.md`, neu, gleiche Struktur wie die anderen Konzepte inkl. Bauauftrag §15). Gestaltung ausschließlich nach Lounge (Inhaber Nr. 51/53). Frappe-App `ph_ablage` nur gelesen, Signaturen und Felder exakt übernommen (Unit-Test gleicht die Methodennamen gegen `api/__init__.py` ab).

## 1. Gebaut

### Routen

| Route | Typ | Inhalt |
|---|---|---|
| `/ablage` | T2 Drive | Ordnerbaum (schwebende Kachel, Lazy-Aufklappen, Finder-Tastatur ←→↑↓ Pos1/Ende, Ziehen von Dateien auf Ordner = Verschieben), Pfad als Pillen, Suche (im Ordner + „In anderen Ordnern“ über `suche`), Art-Pillen PDF/Bilder/Office/CAD, Raster ↔ Liste (URL), Sortieren-Menü, Ordnerkacheln (Stammordner zeigen den Bezugstitel), Dateikarten 4:3 mit echtem Vorschaubild bzw. Endungs-Kachel in Materialfarbe, Marken Ausgecheckt/Geteilt/Portal, Auswahl (Kreis/X) mit Massenleiste (Papierkorb mit Rückgängig, ZIP als Fähigkeit gesperrt mit Grund), Kontextmenü (Rechtsklick, Langdruck, Umschalt+F10), Vorschau-Panel (Lounge §6: Bild mit Glas-Chips, Glas-Schließknopf, Kreise Laden · Teilen · Versionen · Mehr, Status-Hinweise, Fakten, Tags, Freigaben, Primär „Öffnen“ + Pfeil), Ablagezone beim Ziehen von außen, Upload-Schlange, Ordner anlegen/umbenennen/löschen (nur leer). Ohne Ordner: Bereichsordner + „Zuletzt geändert“. `?datei=` öffnet das Panel, `?hochladen=1` fokussiert „Hochladen“. |
| `/ablage/zuletzt` | T2 | Dateien der letzten 30 Tage, gruppiert Heute · Gestern · Diese Woche · Älter; `?filter=ausgecheckt` (Ziel der Zu-tun-Quelle) |
| `/ablage/freigaben` | T2 | Links für Externe (Restlaufzeit, Downloads „1 / 5“, Passwort-Symbol, Status-Pille, Widerrufen mit Bestätigung), Reiter Aktiv/Beendet, Dateien im Kundenportal mit „Aus dem Portal nehmen“ (verzögerter Commit) |
| `/ablage/papierkorb` | T2 | Restzeit je Datei („noch 4 Tage“), Wiederherstellen (+ Rückgängig), „Alle wiederherstellen“, endgültig löschen nur Ablage-Leitung/Admin (Bestätigung) |
| `/ablage/datei/[name]` | T5 Akte | Kopf (Zurück zum Ordner, Teilen, Primär Herunterladen, Menü), Band (Papierkorb / fremde Sperre / Vorschau ausstehend), Reiter Vorschau (Bild + Lightbox, PDF als blob-iframe wegen X-Frame-Options, Video, Office/CAD als Kachel mit ehrlichem Satz + CAD-Metadaten) · Versionen (Wiederherstellen, Version laden, Neue Version) · Freigaben · Details (Tags, Aufbewahrung, Prüfsumme) · Verlauf (PH Ablage Ereignis, nur mit Leserecht); rechts Details + Bezüge; `not-found.js` (auch ohne Recht) |
| `/ablage/bericht` | T8 (Leitung) | Kennzahlen Dateien/Belegt/Freigaben/Papierkorb, Uploads je Woche (Bezugswoche Tinte, laufende schraffiert), Belegung je Bezug (Donut), je Art |
| `/ablage/einstellungen` | T9 (Leitung) | `einstellungen_info` lesend (Speicher, Grenzen, Freigabe-Standards, Vorschau, gesperrte Endungen, Aufbewahrungsklassen), „Bearbeiten“ → generisches Formular |
| `/ablage/laden/[datei]` | Route | Download/Inline/Vorschaubild über `download_link`/`vorschau_link`; S3 direkt → 302, Proxy → durchgereicht mit Sitzung; nur Rasterbilder/PDF/Text/Video inline (SVG u. a. als Download) |
| `/ablage/hochladen` | Route | POST Teil-Upload → `upload_chunk` (Base64 serverseitig), Herkunftsprüfung, max. 16 MB je Teil |
| `/f/[token]` + `/f/[token]/laden` | öffentlich | ohne Anmeldung, noindex, Sie-Form: Datei-Karte, Passwortfeld, Zustände ungültig/abgelaufen/zu viele Versuche/Fehler; Download über Service-Token (`freigabe_aufloesen`) |
| `/d/ph-datei[/name]`, `/d/ph-ordner[/name]`, `/d/ph-datei-freigabelink` | 307 | über `routen` im Bereichsregister |

### Komponenten (`src/components/Backoffice/Ablage/`)
`Drive` (+ `DriveKnoepfe`), `Ordnerbaum`, `Dateien` (Raster/Liste, Kontextmenü, Tastatur), `Vorschaubild`, `DateiPanel`, `DateiWerkzeug` (Hook `useDateiWerkzeug`: Rechte/Gründe, Aktionen, Dialoge Umbenennen/Verschieben/Tags/Aufbewahrung, Bestätigungen), `TeilenDialog`, `UploadSchlange`, `useUpload` (SHA-256 streamend, Teile, Direkt-PUT, Wiederholung 1/2/4 s, Fortsetzen am Offset, 2 parallel), `DateiAkte` (+ `DateiAkteKopf`), `Sammlung` (Zuletzt/Papierkorb), `Freigaben`, `AblageSlot`, `zeit.js`, `ablage.css` (Präfix `bo-abl-`, nur Token).

### Logik (`src/lib/backoffice/ablage/`)
`labels.js` (Konstanten exakt aus `utils/regeln.py`/DocTypes), `regeln.js` (Endung, Dateiname bereinigen, MIME, Vorschau-Art, Größe, Tags, Aufbewahrung/Löschen, Papierkorb, Freigabe-Zustand, Sperre, Leitung je Bezug, Ordner-Modus, `dateiAktionen` mit Gründen, Upload-Teile, Zeitgruppen), `sha256.js` (streamend, gegen node:crypto getestet), `methoden.js` (alle 34 API-Methoden, Frappe `client.call` + vollständiger Mock-Pfad, App-Fehlercodes locked/expired/password_required/… über `ablageCode`), `speicher.js` (Mock-Bytes, 256 MB Grenze, Beispiel-PDF), `auslieferung.js`, `daten.js` (server-only, Nachsaat am laufenden Server, `?sim=leer|fehler`), `actions.js` (alle Server Actions, werfen nie), `faehigkeiten.js`, `seite.js`, `texte.js`.

### Register-Teildateien
`bereiche/ablage.js` (Navigation Dateien · Zuletzt · Freigaben · Papierkorb · Bericht/Einstellungen/Verlauf nur „export“, kanonische Routen) · `suche/ablage.js` (Nummernmuster; Schnellaktionen als `SCHNELL_VORBEREITET`) · `kuerzel/ablage.js` (liste: Umschalt+U/O/V/L/H; akte: Umschalt+L/H/R/A) · `aufgaben/ablage.js` (3 Quellen: von dir ausgecheckt, Links laufen ab, Papierkorb-Frist für Leitung) · `freigaben/ablage.js` (bewusst leer) · `druck/ablage.js` · `akte/slots/ablage.js` (Auftragsmappe › Dateien, Kundenakte › Mehr) · `commit/aktionen/ablage.js` (`ablage.portal`, Datei war für den Bereich angelegt „Nur dieser Bereich schreibt hier“) · `mock/seed/ablage.js` · `tools/qa/routen/ablage.mjs` (13 Zusatzrouten).

### Mock-Seed (Festbestand, Kennung `b-abl-1`)
Bereichsordner wie `dienste.bereichsordner` (Projekte, Kontakte, Lieferanten, Mitarbeiter = nur Personal-Leitung, Allgemein), 4 Projekte mit Vorlage 01–08 (+ Unterordner „Baustelle“), 2 Kontakte (00 Mail-Anhänge, 01–03), 1 Lieferant, 1 Personalakte, Allgemein (Vorlagen, Showroom mit Produktbildern, Marketing, leeres Archiv). Echte Raum-/Produktbilder aus `public/entwurf/lounge` als Vorschau. Abgedeckt: Beleg mit Löschsperre, Office ohne Vorschau, CAD mit Metadaten, Video, Vorschau ausstehend/Fehler, Versionen 1–3 mit Kommentaren, fremde und eigene Sperre, Portal, Papierkorb (28/21/4 Tage), Freigabelinks Aktiv/mit Passwort/Abgelaufen/Widerrufen/Aufgebraucht/läuft in 2 Tagen ab (feste Demo-Tokens `demoKuecheAbend01`, `demoAngebotPw0002` Passwort „seeblick“, `demoAbgelaufen003` …), Ereignisse, Einstellungen, leerer Ordner. Deterministisch je Tag (Seed-Fingerabdruck).

## 2. Tests

| Prüfung | Ergebnis |
|---|---|
| Unit `tests/unit/ablage-*.test.mjs` | **25 / 25 grün** (regeln 14, mock 11) |
| Unit gesamt `node --test "tests/unit/**/*.test.mjs"` | **571 / 575** – rot: 2 × `backoffice-register` (Navigations-Schnappschuss Ablage `["Übersicht","Dateien","Ordner","Freigabelinks"]` – durch die neue Ablage-Navigation erwartbar, bitte L0 nachziehen; „CRM Übersicht + sechs DocTypes“ gehört CRM), 2 × `backoffice-shell` (bestand schon vorher laut B-KKA: Hilfe-Kürzelliste > 12, `/d/ph-aufgabe`) |
| ESLint auf allen B-ABL-Dateien | **0** Fehler, 0 Warnungen |
| E2E `tests/e2e/ablage-bereich.spec.js` (desktop) | siehe Nachtrag unten |
| Sichtprüfung | Probe-Aufnahmen aller Routen (Konsole 0 Fehler, kein Überlauf) neben `entwurf-lounge/2-anfragen` und `3-kundenakte` gelegt; Screenshot-Lauf `qa-screenshots/b-abl/` siehe Nachtrag |

## 3. Abweichungen

1. **Navigation** ohne „Übersicht“: der Bereich ist ein Drive, Startseite = Dateien (Konzept §2.1). Fundament-Test-Schnappschuss muss L0 anpassen.
2. **Portal-Freigabe** als verzögerter Commit über `commit/aktionen/ablage.js` – Datei stand nicht wörtlich im Schreibbereich, ist aber als Bereichsdatei angelegt („Nur dieser Bereich schreibt hier“).
3. **Kürzel** Auschecken = Umschalt+A (Umschalt+K ist in der Akte für „Zur Kundenakte“ belegt).
4. **Endgültig löschen** nur Ablage-Leitung/Admin (DocType-Recht `delete`), nicht Projekte-/CRM-Leitung – wie Backend.
5. Kein Intercepting-Dialog für Teilen; der Dialog liegt im Bereich (Shell ohne Modal-Slot).
6. Mock: Ordner-Modus „team“ gilt für alle mit Bereichsrecht (Teamfelder liegen im Bezug; Frappe prüft echt).

## 4. Fähigkeiten

| ID | Stand | Übergang |
|---|---|---|
| `ablage.zip_download` | aus (erwartet) | Massenaktion „Als ZIP laden“ gesperrt: „Noch nicht verfügbar – Dateien einzeln herunterladen“ |
| `ablage.link_mailen` | aus (erwartet) | „Per E-Mail senden“ gesperrt mit Satz, Link kopieren |
| `ablage.ordner_freigabe` | aus (nicht erwartet) | ausgeblendet |
| `ablage.speicherbelegung` | an (Methode vorhanden), Recht export | Bericht |
| Laufzeit (`einstellungen_info`) | `office_vorschau` aus, `portal` an, `direkt_upload` nur S3 | Office: „zum Ansehen herunterladen“; Portal fehlt → Schalter gesperrt mit Grund |

## 5. Offene Punkte

1. **Registerzeilen** (L0/P0): `akte/slots/index.js` → `ablage`, `aufgaben/index.js` → `ablage`, `freigaben/index.js` → `ablage` (leer); Palette `SCHNELL_VORBEREITET` freigeben; Navigations-Schnappschuss im Register-Test.
2. **Hilfeartikel** `backoffice/hilfe/ablage/*.md` (Team Q5).
3. Frappe-Modus nie gegen einen echten Server gelaufen: Proxy-Download (`herunterladen?dl=`) und S3-PUT mit Prüfsummen-Header sind nach README gebaut, aber ungeprüft. `freigabe_basis_url` muss im Betrieb auf `https://<backoffice>/f` stehen.
4. Prüfsumme im Browser liest große Dateien zweimal (Prüfen, dann Senden) – bei 2 GB spürbar; Alternative wäre Prüfsumme nur beim Direkt-Upload.
5. Thumbnails im Frappe-Modus über `vorschau_link` je Bild (lazy) – bei sehr großen Ordnern Paging (60) beachten; „Weitere laden“ als Knopf fehlt noch (Aktion `dateienAction` ist da).
6. iPhone: Ordnerbaum ist unter 1024 px ausgeblendet (Navigation über Pfad und Kacheln); ein Baum-Sheet wäre schöner.
7. Servicefall/Lieferant/Mitarbeiter-Akten: Slot-Komponente bereit, sobald deren Akten Reiter haben.

## 6. Neue Fragen
Inhaber 114–118 (`90-inhaber-fragen.md`), Steuerberatung 58–59 (`91-steuerberater-fragen.md`).
