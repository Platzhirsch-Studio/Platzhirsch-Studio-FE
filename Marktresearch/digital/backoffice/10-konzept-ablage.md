# 10 – Konzept Bereich „Ablage“ (Next-Backoffice, `backoffice/`, Port 3100) – finale Fassung

**Zweck:** Verbindliches Funktions- und Oberflächenkonzept für die Dateiablage („wie Drive, aber im eigenen Backoffice“) inklusive Bauauftrag. Für den Bereichs-Agenten B-ABL (Routen, Komponenten, Server Actions) und die Bereiche CRM, Projekte, Service, Sortiment, Personal (Ablage-Abschnitt in ihren Akten). Frappe-App `ph_ablage` (App Nr. 13) ist die Datenschicht und bleibt unsichtbar; den Speicher (lokal, S3, Google Drive, OneDrive) sieht niemand.
**Stand:** 2026-11-04 · Rolle: Senior-Produktentwickler B-ABL · Status: **final zur Umsetzung**. Es gab vorher kein Bereichskonzept; Grundlage sind der Inhaber-Wunsch („Word, Excel, CAD usw. wie eine App, die Drive als Speicher verwendet, aber unsichtbar per API“), Entscheidungen Nr. 48–53 (u. a. Lounge, Microsoft/OneDrive als möglicher Speicher), `Backend-Import/ph_ablage/README.md` „Schnittstelle für das Backoffice“ und `00-MASTER.md`.
**Gelesen/geprüft:** 00-MASTER §2–§6, 09-entscheidungslog, 42-qa-g0, art-direction/lounge.md, `Backend-Import/ph_ablage` (README, alle DocType-JSONs, `api/__init__.py`, `dienste.py`, `upload.py`, `utils/regeln.py`), Fundament-README (`components/Backoffice/README.md`).

**Fachliche Leitplanken (nicht verhandelbar):**
- Der Browser spricht nie mit Frappe (Q-A1). Uploads in Teilen laufen über eine eigene Route des Backoffice; nur die vorsignierte S3-PUT-URL (Direkt-Upload) und vorsignierte S3-Download-Links gehen vom Browser direkt zum Speicher – nie zu Frappe.
- Dateinamen, Ordner, Tags und Rechte stehen in Frappe; Umbenennen/Verschieben ändert nie etwas im Speicher.
- Belege (Klasse „Beleg“) haben eine Löschsperre bis `aufbewahren_bis` – „In den Papierkorb“ erscheint dann gesperrt mit Grund, nie als Knopf, der mit Fehler endet (Q-A7, Q-A9).
- Personalordner (Modus „leitung“, Klasse „Personal“) sehen nur Personal-Leitung, Geschäftsführung, Admin. Die Oberfläche filtert nicht selbst „zur Sicherheit“ – Frappe entscheidet (`rechte.py`); der Mock bildet dieselbe Regel nach.
- Freigabelinks zeigen ihr Token genau einmal (Antwort von `freigabelink_erstellen`); danach nur Status, Ablauf, Downloads. Passwörter verlassen nie den Server.
- Die öffentliche Seite `/f/<token>` ist ohne Anmeldung, `noindex`, ohne Namen von Kunden/Projekten außer dem Dateinamen, und ruft `freigabe_aufloesen` serverseitig mit dem Service-Token.
- Kein Ordnerpfad, keine Speicherschlüssel, keine Adapternamen in der Oberfläche für Mitarbeitende (nur Leitung sieht in „Einstellungen“ den Speicher-Zustand „gesetzt/fehlt“).

---

## 0. Kurzfassung

| Was | Wie im Backoffice |
|---|---|
| Einstieg | Leiste „Ablage“ (lucide `file-text`), `G` dann `D`. Reiter: Dateien · Zuletzt · Freigaben · Papierkorb · Bericht (Leitung) · Einstellungen (Leitung). |
| Herzstück | **Dateien** `/ablage`: links Ordnerbaum als schwebende Kachel, Mitte Pfad als Pillen + Ordnerkacheln + Dateien als **Raster mit Vorschaubildern** oder **Liste**, rechts **Vorschau-Panel** (Lounge §6) mit Bild, Glas-Chips, Aktionskreisen (Herunterladen · Teilen · Versionen · Mehr) und Fakten. |
| Hochladen | Ziehen auf die Seite (Overlay „Hier ablegen – in „03 Renderings““) oder Knopf „Hochladen“ (Strg/⌘+Enter bzw. Umschalt+U). Prüfsumme im Browser, Upload in Teilen (Fortschritt je Datei, Abbrechen, Wiederholen), S3 direkt per PUT-URL. Duplikat → Hinweis mit Link auf die vorhandene Datei. |
| Datei-Akte | `/ablage/datei/<name>`: große Vorschau (Lightbox), Versionen mit Wiederherstellen, Freigaben (Links + Portal), Details (Tags, Beschreibung, Aufbewahrung), Verlauf. |
| Sperren | „Auschecken“ = Sperre für andere (Standard 8 h); fremde Sperre zeigt Avatar + „bis 18:00“; Leitung kann aufheben. |
| Teilen | Dialog: Link mit Ablauf (Standard aus den Einstellungen), optional Passwort und Download-Grenze, Hinweis an wen; Ergebnis mit Kopieren-Knopf; Portal-Freigabe bei Projektdateien (verzögerter Commit 8 s, Außenwirkung). |
| Papierkorb | 30 Tage, Restzeit je Datei, Wiederherstellen (Rückgängig-fähig), endgültig löschen nur Leitung mit Bestätigung. |
| Akten anderer Bereiche | Slot „Dateien“ in Auftragsmappe (Reiter `dateien`) und Kundenakte (Reiter `mehr`): Ordner des Bezugs mit Anzahl, letzte Dateien mit Vorschaubild, „Hochladen“ und „In der Ablage öffnen“. |

---

## 1. Nutzer und Top-Aufgaben

| Rolle | Top-Aufgaben (Klicks Ziel) |
|---|---|
| Beraterin/Planer (`PH CRM/Projekte Mitarbeiter`) | T1 Rendering in Projektordner hochladen (2: Ordner öffnen, ziehen) · T2 Plan an Kunden per Link schicken (3: Datei, Teilen, Link kopieren) · T3 neue Planversion hochladen (3) · T4 Datei suchen und öffnen (2: `/` tippen, Enter) |
| Montage-/Service-Mitarbeiter | T5 Fotos zu Servicefall/Projekt hochladen (über Akten-Slot, 2) |
| Ablage-Leitung / GF | T6 Papierkorb leeren/prüfen · T7 aktive Freigaben prüfen und widerrufen · T8 Speicherbelegung ansehen · T9 Sperre aufheben |
| Personal-Leitung | T10 Personalunterlage ablegen (nur sie sieht den Ordner) |
| Externe (ohne Login) | T11 Freigabelink öffnen, ggf. Passwort, Datei laden |

## 2. Routen, Navigation, Rechte, Tastatur

### 2.1 Routen (Seitentyp nach 05 §2)

| Route | Typ | Inhalt |
|---|---|---|
| `/ablage` | T2 Liste/Drive | Ordnerbaum · Pfad · Ordnerkacheln · Dateien (Raster/Liste) · Vorschau-Panel. URL: `?ordner=&ansicht=raster|liste&sort=&q=&datei=&endung=` (Q-B7). Ohne `ordner`: Wurzeln (Bereichsordner) + „Zuletzt geändert“. |
| `/ablage/zuletzt` | T2 | zuletzt geänderte Dateien (30 Tage), nach Tag gruppiert |
| `/ablage/freigaben` | T2 | aktive Freigabelinks und Portal-Freigaben (Report „PH Freigaben aktiv“ bzw. Liste), Widerrufen |
| `/ablage/papierkorb` | T2 | Dateien im Papierkorb, Restzeit, Wiederherstellen, endgültig löschen (Leitung) |
| `/ablage/datei/[name]` | T5 Akte | Kopf (Name, Endung, Größe, Status-Chips), Vorschau, Reiter Vorschau · Versionen · Freigaben · Details · Verlauf (max. 6) |
| `/ablage/bericht` | T8 | Speicherbelegung je Bezug/Endung/Klasse, Uploads je Woche (nur Leitung/GF/Admin) |
| `/ablage/einstellungen` | T9 | `einstellungen_info` lesend (Grenzen, erlaubte Endungen, Papierkorb, Freigabe-Standards, Speicher „gesetzt/fehlt“), Bearbeiten über das Formular (Leitung) |
| `/ablage/laden/[datei]` | Route | Download/Inline-Ansicht: `download_link` → Redirect (S3 direkt) bzw. Durchreichen (Proxy) |
| `/ablage/hochladen` | Route | `POST` Teil-Upload (`upload_chunk`, Base64 serverseitig) |
| `/f/[token]` | öffentlich | Freigabeseite ohne Login, `noindex`, Passwortfeld, Download über `/f/[token]/laden` |
| `/d/ph-datei/<name>` | 307 | → `/ablage/datei/<name>` (ROUTEN-Register) · `/d/ph-ordner/<name>` → `/ablage?ordner=<name>` · `/d/ph-datei-freigabelink` → `/ablage/freigaben` |

### 2.2 Rechte

- Bereich sichtbar mit `darf(session, "ablage", "read")` (Rollen Ablage + Fachrollen laut DocType-`permissions`, `bereiche/ablage.js`).
- **Leitung** für eine Datei/einen Ordner = allgemeine Leitung (`PH Ablage Leitung`, `PH Geschäftsführung`, Admin) oder Leitung des Bezugs (Projekt → Projekte-Leitung, Kontakt → CRM-Leitung, …); Personal: nur Personal-Leitung/GF/Admin (`regeln.js` = `utils/regeln.py`).
- Geschäftsführung liest nur; Schreib-Aktionen erscheinen für sie nicht (Q-B11).
- Endgültig löschen, Sperre erzwingen, Ordner lockern, Bericht, Einstellungen: nur Leitung. Sonst: Menüeintrag gesperrt mit „Nur Leitung“ + „Leitung bitten“.

### 2.3 Tastenkürzel (Register `kuerzel/ablage.js`, Q-F5)

| Kontext | Taste | Wirkung |
|---|---|---|
| liste | `Umschalt+U` | Dateien wählen (Hochladen) |
| liste | `Umschalt+O` | Neuer Ordner |
| liste | `Umschalt+V` | Ansicht Raster/Liste |
| liste, akte | `Umschalt+L` | Teilen-Dialog (nur Dialog, Außenwirkung) |
| liste, akte | `Umschalt+H` | Herunterladen |
| akte | `Umschalt+R` | Umbenennen |
| akte | `Umschalt+A` | Auschecken/Einchecken (Umschalt+K ist „Zur Kundenakte“) |
| Fundament | Leertaste | Vorschau-Panel · `Enter` öffnen · `↑↓`/`J K` · `Entf` → Papierkorb (mit Rückgängig) |

## 3. Seiten im Detail

### 3.1 Dateien `/ablage`
- **Kopf:** Large Title = aktueller Ordner (sonst „Ablage“), darüber Pfad (Bezug), Kennzahlen „Dateien“ und „Belegt“ (nur aus der Antwort, sonst entfallen sie), Aktionen „Neuer Ordner“ (sekundär) + **„Hochladen“** (Primär, Tinte).
- **Werkzeuge:** Segment Raster/Liste, Pillen-Suche (`/`), Sortieren-Menü (Name, Geändert, Größe, Art), Endungsfilter als Pillen (PDF, Bilder, Office, CAD).
- **Ordnerbaum (links, 280 px, sticky):** Kachel mit Wurzeln, Auf-/Zuklappen (Pfeiltasten wie Finder: →/← öffnen/schließen, ↑/↓), Anzahl je Ordner gedämpft, Symbol Schloss bei Modus „leitung“, Personen bei „team“. Darunter feste Einträge Zuletzt · Freigaben · Papierkorb (mit Zähler).
- **Ordnerkacheln:** Kachel 20er-Radius mit Ordnersymbol in Materialfläche (Farbe des Ordners, sonst Travertin), Titel, „12 Dateien“, Klasse „Beleg“ als Pille.
- **Raster:** Karten 4:3-Vorschau (Bild = echtes Vorschaubild, PDF/Office/CAD = Endungs-Kachel auf Leinen mit großem Typ-Kürzel), Name zweizeilig, Unterzeile „PDF · 1,2 MB · heute 09:12“, Status-Chips Gesperrt (Schloss + Avatar) · Geteilt (Link) · Portal. Hover hebt 2 px, Auswahl Tinte-Ring.
- **Liste:** Tabelle in Kachel (Zeilen 64), Vorschaubild 40, Name, Geändert, Größe, Von (Avatar), Status.
- **Vorschau-Panel (rechts, 360 px, sticky, gleitet mit Feder):** Bild mit Glas-Chips (Endung, Größe) und Glas-Schließknopf, Name 22/600, Pfad, vier Aktionskreise, Fakten 2-spaltig (Version, Geändert, Hochgeladen von, Aufbewahrung), Tags, Freigaben-Zeile, Primär „Öffnen“ + Pfeil.
- **Leer:** Ordner ohne Dateien → „Noch keine Dateien in „08 Service“. Zieh Dateien hierher oder wähle „Hochladen“.“ Suche ohne Treffer → `Leer art="gefiltert"`. Keine Wurzeln → „Die Ablage wird beim ersten Projekt oder Kontakt angelegt.“
- **Fehler:** `unavailable` mit `fehlend` (Speicher nicht eingerichtet) → Band „Speicher nicht eingerichtet – Leitung informieren“, Hochladen gesperrt mit Grund.

### 3.2 Hochladen (Upload-Schlange)
1. Dateien wählen/ziehen → Prüfung im Browser gegen `einstellungen_info` (gesperrte Endung → Zeile „.exe ist nicht erlaubt“, zu groß → „größer als 2 GB“).
2. SHA-256 im Browser (streamend, 8-MB-Teile, Fortschritt „Prüfe …“).
3. `upload_start` → `ziel.art = direkt`: PUT mit Headern exakt; `teile`: `POST /ablage/hochladen` je Teil (≤ `chunk_bytes`, Wiederholung bei Netzfehler 3× mit 1/2/4 s, `conflict offset` → bei `erhalten` fortsetzen).
4. `upload_abschliessen(token, sha256)` → Datei erscheint mit Feder in der Liste (`bo-neu`), Toast „3 Dateien hochgeladen“. Duplikat → Zeile „Gleiche Datei liegt schon in „07 Fotos““ + „Öffnen“.
5. Schlange als Material-Karte unten rechts, je Datei Fortschrittsbalken, Abbrechen, Erneut; einklappbar; verschwindet 4 s nach Erfolg.
- **Neue Version:** Panel/Akte „Neue Version“ → gleicher Ablauf über `neue_version` (gleiche Endung Pflicht, sonst Satz).

### 3.3 Datei-Akte `/ablage/datei/[name]`
- Kopf mit Zurück-Rundknopf zum Ordner, Titel = Dateiname, Status-Chips, Primär **„Herunterladen“**, Menü: Umbenennen · Verschieben · Neue Version · Auschecken/Einchecken · Tags · Aufbewahrung · Papierkorb.
- Band (max. 1): Papierkorb („Wird am 04.12. endgültig gelöscht“ + Wiederherstellen) > fremde Sperre > Vorschau Fehler/ausstehend.
- Reiter: **Vorschau** (Bild/PDF inline, Office/CAD: Endungs-Kachel + „Vorschau nicht möglich – herunterladen“, CAD-Metadaten), **Versionen** (Liste mit Nr., Datum, Person, Größe, Kommentar, „Wiederherstellen“ – erzeugt neue Version), **Freigaben** (Links mit Status-Pille, Ablauf, Downloads, Widerrufen; Portal), **Details** (Tags, Beschreibung, Aufbewahrungsklasse + Belegdatum, Bezug-Link), **Verlauf** (PH Ablage Ereignis, nur Leitung; sonst Kommentare).
- Rechte Spalte: Fakten + Bezüge (Ordner, Bezug).

### 3.4 Freigaben, Papierkorb, Zuletzt, Bericht, Einstellungen
- **Freigaben:** Tabelle in Kachel: Datei (Bild), Hinweis an, erstellt von, Ablauf (Rest in Tagen, < 3 Tage Eiche), Downloads „2 von 5“, Passwort-Symbol, Status, „Widerrufen“ (sofort + Rückgängig nicht möglich → Bestätigung, Q-C6 Sicherheit). Reiter Aktiv · Abgelaufen/Widerrufen.
- **Papierkorb:** Raster wie Dateien, Restzeit-Pille („noch 3 Tage“, < 7 Eiche), Wiederherstellen (sofort, Toast mit Rückgängig = wieder löschen), endgültig löschen nur Leitung (Bestätigen gefährlich), Belege nie im Papierkorb (Server sperrt).
- **Zuletzt:** Dateien der letzten 30 Tage, gruppiert Heute · Gestern · Diese Woche · Älter.
- **Bericht:** Kennzahlen (Dateien, Belegt, Freigaben aktiv, Papierkorb), Balken Uploads je Woche (laufende schraffiert), Belegung je Bezugsart und je Endung; Quelle `PH Speicherbelegung`; ohne Werte „–“.
- **Einstellungen:** lesend aus `einstellungen_info`; Leitung „Bearbeiten“ → Formular PH Ablage Einstellungen (generisch).

### 3.5 Öffentliche Freigabeseite `/f/[token]`
Lounge-Material auf Kalk, Wortmarke Bodoni, Karte mit Endungs-Kachel bzw. Vorschau, Dateiname, Größe, „Gültig bis 12.11.2026“; Passwortfeld bei `password_required`; Knopf „Herunterladen“. Zustände: ungültig („Dieser Link ist nicht gültig.“), abgelaufen („Dieser Link ist abgelaufen. Bitte fragen Sie bei Platzhirsch nach.“), Passwort falsch, Rate-Limit. Sie-Form. Kein Tracking, keine Kundendaten.

## 4. Zustände, Aktionen, Regeln

| Aktion | Methode (`ph_ablage.api.`) | Undo-Technik (Q-C3) |
|---|---|---|
| Hochladen | `upload_start` → `upload_chunk`/PUT → `upload_abschliessen` | – (Datei kann in den Papierkorb) |
| Neue Version | `neue_version` + Teile | – (Version wiederherstellen) |
| Umbenennen | `umbenennen` | sofort + Rückgängig (alter Name) |
| Verschieben | `verschieben` | sofort + Rückgängig (alter Ordner) |
| Tags/Beschreibung | `tags_setzen` | sofort (Feldwert) |
| Aufbewahrung | `aufbewahrung_setzen` | sofort; Beleg setzen → Bestätigen (Löschsperre 7 Jahre) |
| Auschecken/Einchecken | `sperren`/`entsperren` | sofort |
| Sperre aufheben (Leitung) | `entsperren(erzwingen=1)` | Bestätigen (fremde Arbeit) |
| Papierkorb | `loeschen` | sofort + Rückgängig (`wiederherstellen`) |
| Wiederherstellen | `wiederherstellen` | sofort + Rückgängig (`loeschen`) |
| Endgültig löschen | `endgueltig_loeschen` | Bestätigen (unumkehrbar) |
| Freigabelink erstellen | `freigabelink_erstellen` | sofort (Link noch nicht weitergegeben); Widerrufen jederzeit |
| Link widerrufen | `freigabelink_widerrufen` | Bestätigen (Externe verlieren Zugriff) |
| Portal freigeben/zurückziehen | `portal_freigeben` | **verzögerter Commit 8 s** (Außenwirkung beim Kunden) |
| Version wiederherstellen | `version_wiederherstellen` | sofort (erzeugt neue Version, alte bleibt) |
| Ordner anlegen/umbenennen/verschieben/einstellen/löschen | `ordner_*` | sofort; Löschen nur leer |

**Abgeleitete Zustände (`regeln.js`, unit-getestet):** Sperre aktiv (`gesperrt_bis > jetzt`), eigene/fremde Sperre, Löschen erlaubt (Klasse/Frist/Leitung wie `loeschen_erlaubt`), Papierkorb-Resttage, Freigabe-Zustand (`freigabe_zustand`), Vorschau-Darstellung (bild/pdf inline, office nur mit `office_vorschau`, cad Metadaten), Endung erlaubt (`endung_erlaubt` mit Standard-Sperrliste), Dateiname bereinigt, Größe als Text (1024er-Stufen, Komma), Upload-Teile (Plan aus Größe und `chunk_bytes`).

**Statusfarben:** Aktiv = keine Pille · Gesperrt (fremd) Eiche + Schloss · Ausgecheckt (ich) See + Schloss · Geteilt Salbei + Link · Portal Messing + Globus · Papierkorb Stein · Beleg Cognac-Pille „Beleg bis 2033“ · Freigabe Aktiv Salbei · Abgelaufen Stein · Aufgebraucht Eiche · Widerrufen Ziegel.

## 5. Kennzahlen und Charts
Nur im Bericht und als Kopf-Kennzahlen; Werte ausschließlich aus Frappe (Number Cards/Report), sonst „–“ (Q-A6). Keine Auswertung je Person (Q-A12).

## 6. Druck
Kein eigenes Druckformat in `ph_ablage`. Strg+P in der Datei-Akte öffnet die Datei inline (PDF/Bild) in neuem Tab; Freigabe-Übersicht ist CSV-Export (Leitung).

## 7. iPad, Telefon, andere Bereiche
- **iPad:** Ordnerbaum als Sheet über Knopf „Ordner“, Raster 3 Spalten, Panel als Sheet von rechts; Ziele ≥ 44.
- **Telefon:** Pfad als waagrecht scrollbare Pillen, Raster 2 Spalten, Liste als Karten, Panel als Bottom-Sheet, Hochladen über „Fotos/Dateien“ (Kamera erlaubt).
- **Slots:** `akte/slots/ablage.js` – Auftragsmappe Reiter `dateien` (Reihenfolge 10, voll) und Kundenakte Reiter `mehr` (Reihenfolge 30). Servicefall/Lieferant/Mitarbeiter folgen, sobald deren Akten Slot-Reiter haben (Stub: gleiche Komponente, `akte`-Werte vorbereitet).

## 8. Automationen (Backend, vorhanden)
Automatische Ordner bei neuem Projekt/Kontakt/Lieferant/Mitarbeiter/Servicefall, Vorschau/Volltext im Hintergrund, Papierkorb-Leerung 03:10, Mail-Anhänge aus `ph_microsoft` nach „00 Mail-Anhänge“, Bestand-Übernahme (Leitung). Zu-tun-Quellen im Backoffice: „Von dir ausgecheckt“, „Freigabelinks laufen in 3 Tagen ab“, „Papierkorb: n Dateien werden diese Woche endgültig gelöscht“ (Leitung).

## 9. Datenmapping und Fähigkeiten
Alle Aufrufe über `lib/backoffice/ablage/methoden.js` (Frappe: `client.call("ph_ablage.api.<m>", args)` mit exakt den Parametern der App; Mock: dieselben Regeln gegen die Mock-Datenbank inkl. Bytes im Prozessspeicher).

| Fähigkeit | Probe | Übergang |
|---|---|---|
| `ablage.zip_download` | Methode `ph_ablage.api.zip_herunterladen` | fehlt → Massenaktion „Als ZIP“ gesperrt: „Noch nicht verfügbar – Dateien einzeln herunterladen“ |
| `ablage.link_mailen` | Methode `ph_ablage.api.freigabelink_senden` | fehlt → „Per E-Mail senden“ gesperrt: „Link kopieren und im eigenen Postfach senden“ |
| `ablage.ordner_freigabe` | Methode `ph_ablage.api.ordner_freigabelink_erstellen` | nicht erwartet → ausgeblendet |
| `ablage.speicherbelegung` | Report „PH Speicherbelegung“ | vorhanden |
| Laufzeit (aus `einstellungen_info`) | `office_vorschau`, `portal`, `direkt_upload`, `freigabe_passwort_pflicht` | Office-Vorschau aus → Satz + Herunterladen; Portal fehlt → Eintrag gesperrt mit Grund |

## 10. Komponenten (`components/Backoffice/Ablage/`)
`Drive` (Client, Seite Dateien), `Ordnerbaum`, `Pfad`, `OrdnerKachel`, `DateiKarte`, `DateiZeile`, `Vorschaubild` (Bild/Endungs-Kachel), `DateiPanel`, `DateiMenue`, `UploadSchlange` + `useUpload`, `Ablagezone`, `TeilenDialog`, `OrdnerDialog`, `UmbenennenDialog`, `VerschiebenDialog`, `TagsDialog`, `DateiAkte` (Reiter), `VersionenListe`, `FreigabenListe`, `Papierkorb`, `Freigabeseite` (öffentlich), `AblageSlot` (Akten anderer Bereiche), `ablage.css` (Präfix `bo-abl-`, nur Token).

## 11. Leer- und Fehlerzustände
Seed deckt ab: leerer Ordner, Suche ohne Treffer, Papierkorb leer/mit Frist < 7 Tage, fremde Sperre, eigene Sperre, Beleg mit Löschsperre, Office ohne Vorschau, Vorschau ausstehend/Fehler, CAD mit Metadaten, Freigabe aktiv/mit Passwort/aufgebraucht/abgelaufen/widerrufen, Portal-Freigabe, Personalordner (nur Leitung). `?sim=leer|fehler` (nur Mock) für Abnahmebilder.

## 12. Texte
Alle Texte in `lib/backoffice/ablage/texte.js`; Du-Form intern, Sie-Form auf `/f/`. Toasts in Vergangenheit + Objekt („„Grundriss.pdf“ in den Papierkorb gelegt“).

## 13. Akzeptanzkriterien (Auswahl, E2E)
A1 Ordner öffnen per Baum und per Kachel, Pfad zurück · A2 Raster ↔ Liste in der URL · A3 Datei ins Panel (Klick/Leertaste), Panel schließt mit Esc · A4 Hochladen per Dateiwahl: Datei erscheint, Toast · A5 Papierkorb + Rückgängig · A6 Beleg: Papierkorb gesperrt mit Grund · A7 Teilen: Link erstellt, Kopieren, erscheint in Freigaben, Widerrufen mit Bestätigung · A8 `/f/<token>` ohne Login: Info, Passwort falsch/richtig, abgelaufen · A9 Personalordner für CRM-Mitarbeiterin unsichtbar · A10 Datei-Akte Versionen + Wiederherstellen.

## 14. Offene Entscheidungen
Siehe `90-inhaber-fragen.md` (Speicheranbieter, LibreOffice, Standard-Gültigkeit Links, Passwortpflicht) und `91-steuerberater-fragen.md` (Fristen Personal/Projekt/Marketing).

## 15. Bauauftrag

```
src/app/ablage/
  page.js                     Dateien (Drive)            loading.js
  zuletzt/page.js             Zuletzt
  freigaben/page.js           Freigaben
  papierkorb/page.js          Papierkorb
  datei/[name]/page.js        Datei-Akte (+ not-found.js)
  bericht/page.js             Bericht (Leitung)
  einstellungen/page.js       Einstellungen
  laden/[datei]/route.js      Download/Inline
  hochladen/route.js          Teil-Upload (POST)
src/app/f/[token]/page.js     Öffentliche Freigabe  ·  src/app/f/[token]/laden/route.js
src/lib/backoffice/ablage/    texte · labels · regeln · sha256 · methoden (Mock-Pfad) · speicher (Mock-Bytes)
                              faehigkeiten · daten (server-only) · actions ("use server") · seite
Register-Teildateien: bereiche · suche · kuerzel · aufgaben · freigaben (leer) · druck · akte/slots · commit/aktionen
Mock: mock/seed/ablage.js (Festbestand, Nachsaat am laufenden Server über Kennung)
Tests: tests/unit/ablage-*.test.mjs · tests/e2e/ablage-*.spec.js · tools/qa/routen/ablage.mjs
```
