# 8x – Übergabe Team B-KKA (Bereich Kundenkarte, Lounge)

**Stand:** 2026-11-04 · Auftrag: Bereich Kundenkarte vollständig nach `10-konzept-kundenkarte.md` (finale Fassung, Bauauftrag §16) auf Fundament v2 (G0, `42-qa-g0.md`), Gestaltung ausschließlich nach Lounge (Inhaber Nr. 51/53, `art-direction/lounge.md`, Screenshots `entwurf-lounge/`). Frappe-App `ph_kundenkarte` nur gelesen; Signaturen und Felder exakt übernommen.

## 1. Gebaut

### Routen (`backoffice/src/app/kundenkarte/`)

| Route | Typ | Inhalt |
|---|---|---|
| `/kundenkarte` | T1 Übersicht | Seitenkopf mit Zahnrad + „Neue Karte“ (gesperrt mit Satz ohne Teilnahmebedingungen-Version), Heute-Leiste (Arbeitszähler als Pillen, 0 gedämpft), 3 Kennzahlen (Aktive · Neue 30 Tage · Einlösungen 30 Tage + Storno), „Karten je Stufe“ (Balken in Stufenfarbe), „Neue Karten je Monat“ (Bezugsmonat Tinte, laufender schraffiert), Zu tun (nur Kundenvorgänge, Leitung + „gesperrt > 30 Tage“), Zuletzt geändert, Einrichtungs-Checkliste (nur Leitung, verschwindet), Leer „Noch keine Karten …“, jede Kachel eigener Suspense-/Fehlerrand |
| `/kundenkarte/antraege` | T2 | Reiter Zu entscheiden · Wartet auf Mail · Erledigt (Zähler), Suche, Quelle-Filter, 5 Spalten, Hinweise „Karte besteht“ / „Gleiche E-Mail wie A. M*** – andere Person?“ (E-Mail verlässt den Server nicht), Zeitsignal > 2 Tage, Mailfrist, Massen Ablehnen/Als doppelt (kein Massen-Ausstellen), Telefon-Karten mit „Ausstellen“, **`?ansicht=kanban` → 307** |
| `/kundenkarte/antraege/[name]` | T5 ohne Tabs | Kopf mit Status, Primär „Karte ausstellen“ (Strg/⌘+Enter; wartet auf Mail → gesperrt mit Satz, Leitung „Ohne Bestätigung ausstellen …“ mit Pflichtbegründung, sonst „Leitung bitten“), Menü Ablehnen/Doppelt, Band (abgelehnt/angenommen/doppelt bzw. „andere Person?“), Antrag, Einwilligungen (nicht änderbar) + Nachweis-Details, Verlauf, rechts Kontakt (verknüpft / ähnliche mit Kennzeichen) + Karte; Dialog „Karte ausstellen“ mit Kontaktlogik (Vorauswahl nur bei gleicher E-Mail **und** Nachname), Stufe (Leitung), „Erst bei Übergabe aktivieren“, berechnetem Live-Satz, Ergebnis-Karte mit Karte in Stufenfarbe + Druck/Öffnen/Nächster Antrag; `not-found.js` |
| `/kundenkarte/karten` | T2 | Reiter Alle · Ohne Berater · Wartet auf Übergabe · Mögliche Dubletten · Stufe von Hand (Leitung), Scan-/Suchfeld (`data-scan="ja"`, „Karte KK-… öffnen ↵“, unbekannt → Shake + Satz bleibt, Kamera-Scan), Filter Status/Stufe/Berater, 6 Spalten, Berater inline (sofort + Rückgängig 8 s), Letzter Einkauf als Monat bzw. „–“ + sr-only, Umsatz-Spalte nur Leitung/GF, Leertaste = Peek (Kopf, Vorteile, 5 Verlaufszeilen), Zeilenmenü, Massen Berater/Aufgabe an Berater (Kanal-Vorschau)/Neu einstufen/Sperren (Mehr), CSV (Leitung/GF, Allowlist), Telefon-Karten |
| `/kundenkarte/karten/neu` | Vollseite | Ein Formular: Person (Kontaktsuche bzw. Neu anlegen) · Einwilligungen (3 Pflichthaken, Auswertung mit Nachweis Foto/Datei oder Kundenmodus, Newsletter) · Weitere Angaben (Geburtstag TT.MM., Interessen, Berater, Stufe nur Leitung, Erst bei Übergabe); rechts „Legt an“ mit Karte in Stufenfarbe; Idempotenz-Schlüssel je Formular; Ergebnis mit Nummer; `?kontakt=` vorbefüllt; Entwurf in sessionStorage (Kundenmodus) |
| `/kundenkarte/karten/[kartennummer]` | T5 Karten-Akte | Hero-Kachel mit großer Karte in Stufenfarbe (dreht auf Rückseite: QR + Datenschutztext), Name 34/600, StufenKennzeichen als Knopf (Popover „Stufe festlegen“: Leitung mit Grund-Chips + Folgesatz, Rückgängig 8 s; Mitarbeitende lesend + „Leitung bitten“), „Automatik wieder zulassen“, Nummer kopieren, Berater, Kundenakte; **eine Primäraktion je Zustand** (Strg/⌘+Enter: Vorteil einlösen · Übergabe aktivieren (8 s) · Entsperren · Ersatzkarte · Neue Karte · Zur neuen Karte); Aktionsmenü (Drucken → DruckPanel, Wallet erneuern, Ersatzkarte, Sperren, Übertragen/Zusammenführen/Kündigen Leitung, sonst gesperrt mit Grund + Leitung bitten, Aufgabe, Kundenakte, Datenschutz); Stufenblock (Leiter `<ol aria-current>`, Nächste Stufe, „Beträge zeigen“ nur Leitung/GF mit Band „Berechnung im Aufbau“, Neu berechnen mit „Dauert länger …“, Einwilligungszeile erfassen/beenden, Fußzeile „Zählt: …“ wahrheitsgemäß); Band (max. 1, Rangfolge); 4 Tabs Vorteile · Verlauf · Einkäufe · Details; rechts Nächster Schritt + Bezüge; normalisiert die Nummer (Redirect), 404 auch ohne Recht; `not-found.js` |
| `/kundenkarte/einloesungen` | T2 + Sheet | Reiter Eingelöst · (Zugesagt mit Fähigkeit) · Storniert, Suche, Vorteil/Ort/Zeitraum, „Durch“ mit Avatar, Storno durchgestrichen + Grund, Fuß „Anzahl, keine Euro“, Sheet (Datum/Vorteil/Beleg lesend, Kommentar editierbar, Storno nach Regel oder Satz + Leitung bitten), „Einlösen …“-Dialog mit Kartensuche (Scan) → Vorteil → Belegliste |
| `/kundenkarte/einloesungen/[name]` | Vollseite | Deep-Link wie Sheet |
| `/kundenkarte/stufen` | T9 | Spalte je Stufe (Kopf mit Roving-Fokus ←/→ → Stufen-Sheet: Reihenfolge, Schwelle (BetragFeld, nur Leitung/GF sichtbar), Farbe + 8 Vorschläge + Status-Warnung + Ring-Hinweis, Kundentext mit Live-Prüfung, Intern, Aktiv gesperrt mit „n Karten zuerst umstufen“), Zuordnungen mit Ziehen **und** Menü „Verschieben nach …“/Entfernen, „+ Vorteil zuordnen“, „enthält alles aus …“, Widerspruchszeile, Katalog mit Vorteil-Sheet (Live-Prüfung, gilt_ab nur lesend, Nutzung), Speicherleiste mit Vorschau „n Karten würden aufsteigen“ (Strg/⌘+S), Rücknahme bei Teilfehler, Leer „Standardstufen anlegen“; Druck Vorteilsübersicht |
| `/kundenkarte/vorteile[/<name>]` | – | 307 → `/kundenkarte/stufen[?panel=vorteil:<name>]` |
| `/kundenkarte/berichte`, `/berichte/[report]` | T8 | Liste nach Rolle (Kundenwert, Karten ohne Einkauf, Manuelle Stufen nur Leitung/GF; Mitarbeitende Direktaufruf → 404), Tabellen in Kachel, Euro nur mit Recht, CSV (Leitung/GF), Vorteile Nutzung mit Balken + Fußnote, Karten ohne Einkauf mit „Meine Karten“ und „Aufgabe an Berater“ (Kanal-Vorschau TKG § 174), Band „Berechnung im Aufbau“ |
| `/kundenkarte/einstellungen` | T9 Single | Stufen · Anträge · Texte (Vorschau Kartenrückseite, Live-Prüfung) · Wallet (Zustand aus `wallet_status`), Speicherleiste, Mitarbeitende lesend |
| `/kundenkarte/kundenmodus/[sitzung]` | Vollbild ohne Shell | Sie-Form, 18 px, Einwilligungstext mit Version, Schalter, Fingerunterschrift (Fundament `Unterschrift`), Zurück-Geste abgefangen, Idle 2 min → PIN, Rückkehr nur Langdruck 800 ms + PIN (`kundenmodusBeendenAction`); Sitzung 15 min im Store (`kk:`), Bestätigung → Nachweis „Unterschrift Tablet“ im Einwilligungs-Dialog bzw. in „Neue Karte“ |

### Komponenten (`src/components/Backoffice/Kundenkarte/`)
`StufenKennzeichen` (Pille + Bodoni-Monogramm in Stufenfarbe, Kontrast-Schrift berechnet, Ring bei < 3:1) · `MiniKarte` (85,6 : 54, drehbar) · `KarteKopf` · `Stufenblock` · `VorteileTab` · `Einloesen` (`useEinloesen`, `BelegWahl`, `EinloesePopover`) · `VerlaufTab` · `DetailsTab` (Sofortfelder mit Konflikt je Feld, Notiz Autosave 1 s, Wallet/QR) · `AkteTeile` (Einkäufe, Bezüge, Nächster Schritt) · `KartenListe` · `KartenSuche` · `KartenPeek` · `Antraege` (Liste, AusstellenDialog, AntragAktionen) · `Dialoge` (Sperren, Ersatz, Kündigen, Entsperren, Übertragen, Zusammenführen, Auswertung beenden, Ablehnen, Doppelt, Storno, ChipWahl, Textfeld) · `EinwilligungDialog` (+ `NachweisAufnahme`) · `Einloesungen` + `EinloesungSeite` · `Stufenplan` · `BerichtTabelle` · `Einstellungen` · `NeueKarte` · `Kundenmodus` · `Uebersicht` · `KundenakteSlot` · `VorteilIcon` · `Filter` · `Suchfeld` · `Skelett` · `kundenkarte.css` (Präfix `bo-kk-`, nur Token; Listen nutzen die Fundament-Klassen `bo-dt`).

### Logik (`src/lib/backoffice/kundenkarte/`)
`kartennummer.js` · `textpruefung.js` (GELD_RE/SUPERLATIV_RE wie Server + Gutschein/gratis) · `labels.js` · `regeln.js` (Rollen, Primäraktion, Band, Nächster Schritt, Vorteile/Limits wie `utils/vorteile.py`, Bezugsregeln §4.6, Storno bis 23:59, Antrag-Reiter, Kontakt-Treffer, Stufenplan/Vorschau wie `kartenregeln.py`, Kanalregel, Geburtstag, Idempotenz) · `felder.js` (Allowlist je Rolle **vor** der Serialisierung) · `faehigkeiten.js` · `methoden.js` (Frappe: `runDocMethod`/`call`; **Mock-Pfad** mit denselben Regeln gegen die Mock-DB) · `daten.js` (server-only; `?sim=leer|fehler` nur Mock) · `actions.js` (alle Server Actions §16.3 + `kartePeekAction`, `kioskKarteAction`) · `seite.js` · `texte.js` · `verlauf.js`.

### Register-Teildateien
`bereiche/kundenkarte.js` (Navigation 7 Einträge, Kanban leer, kanonische Routen → `/d/ph-kundenkarte*/…` leitet 307 hierher) · `suche/kundenkarte.js` (Nummernmuster; Schnellaktionen vorbereitet in `SCHNELL_VORBEREITET`, siehe offene Punkte) · `kuerzel/kundenkarte.js` (Umschalt+N/E/R/C) · `aufgaben/kundenkarte.js` (3 Zu-tun-Quellen) · `freigaben/kundenkarte.js` (bewusst leer) · `druck/kundenkarte.js` · `akte/slots/kundenkarte.js` (Kundenakte › Übersicht „Kundenkarte“) · `mock/seed/kundenkarte.js` (Festbestand, s. u.) · `commit/aktionen/kundenkarte.js` (Variante A: einlösen, übergabe, sperren – Datei war für B-KKA angelegt, „Nur dieser Bereich schreibt hier“) · `tools/qa/routen/kundenkarte.mjs` (18 Routen).

### Mock-Seed
`anzahl`/`kern` unverändert (gemeinsame Zufallsfolge), Nachlauf ersetzt die generischen Datensätze: 3 Stufen (Stein/Eiche/Cognac) mit Zuordnung, 8 Vorteile (1 inaktiv), **21 Karten in jedem Status** (Aktiv, Beantragt > 7 Tage, Gesperrt Verlust/Diebstahl/Kundenwunsch > 30 Tage, Gekündigt, Ersetzt→Nachfolger, Übertragen, Zusammengeführt, Dublette, ohne Berater, ohne Einwilligung, nie berechnet, Stufe von Hand, Limit erreicht – auch über die Kette), 10 Anträge in allen Reitern (inkl. gleiche E-Mail/anderer Name, Karte besteht, läuft ab), 14 Einlösungen (2 storniert), Ereignisse je Karte, Einstellungen (Version 2026-11), 2 Aufgaben (Geburtstag heute, Übergabe). **Der laufende Dev-Server wird beim ersten Seitenaufruf einmalig nachgesät** (`daten.js` → `sichereMockSeed`, Kennung `_kk_seed`), weil :3100 nicht neu gestartet werden darf.

## 2. Tests

| Prüfung | Ergebnis |
|---|---|
| Unit `tests/unit/kundenkarte-*.test.mjs` | **26 / 26 grün** (regeln 16, mock 10) |
| Unit gesamt `node --test "tests/unit/**/*.test.mjs"` | **398 / 404** – die 6 roten gehören nicht zu B-KKA: Register (Faktura-Routen fremder DocTypes, CRM-Navigation 8 statt 7, Kürzel f12 Kassa), Shell (Hilfe-Kürzelliste durch Faktura-Listenkürzel, Navigation `/d/ph-aufgabe`) |
| ESLint auf allen B-KKA-Dateien | **0** Fehler, 0 Warnungen |
| E2E `tests/e2e/kundenkarte-bereich.spec.js` (desktop, 15 Tests: K1, K2/K24, K4, K5, K9/K17, K11, K16, K17 Kassa, K37, K38, K40, Sperren mit Rückgängig, Beträge/Intern Leitung, Dubletten, Übersicht) | **15 / 15 grün** (Lauf 1 unter Fremdlast: 13 grün; die 2 roten deckten ein echtes Leck auf – Schlüssel `jahresumsatz_cent`/`schwelle_jahresumsatz_cent` im RSC-Payload für Mitarbeitende, behoben – und ein Hydrierungs-Timing, stabilisiert; Nachlauf 2/2 grün). 404 per Inhalt geprüft (Next streamt 200). Eigenes `--output`, weil parallele Läufe anderer Teams `test-results/` überschreiben |
| Screenshots `node tools/qa/shoot.mjs qa-screenshots/b-kka --nur "^/kundenkarte"` | **150 Aufnahmen** (25 Routen × 3 Viewports × hell/dunkel), alle 200, keine Konsolen-/Seitenfehler; 4 Befunde (Einkäufe-Tabelle am iPhone, Kartenliste der Leitung am iPad mit Umsatzspalte zu breit) → behoben, Nachlauf 24 Aufnahmen ohne Befund. Neben die Lounge-Bilder gelegt: Material-Leiste, Pillen-Reiter, schwebende Kacheln ohne Rahmen, eine Tinte-Primäraktion, weiche Status-Pillen, Stufen als Cognac/Eiche/Stein-Material, dunkel eigens |

## 3. Abweichungen vom Konzept (Lounge hat Vorrang bzw. Fundament-Regeln)

1. **StufenKennzeichen** als Pille mit Bodoni-Monogramm in der Stufenfarbe (Lounge §6 „Kundenkarte“) statt Rechteck Radius 4 mit Mini-Karte 14 × 9 (Konzept §10). Weiterhin keine Statusform.
2. **Mini-Karte im Kopf 240 × 152** (Lounge-Hero) statt 120 × 76.
3. **Neue Karte** als Vollseite; „Neue Karte“ in der Liste öffnet sie direkt. Die Intercepting Route (Dialog über der Liste) ist nicht gebaut – die Shell wird je Seite gerendert und ein Dialog-Slot außerhalb hätte keinen Toast-/Commit-Kontext. Nachholbar, sobald die Shell einen Modal-Slot anbietet.
4. **Kürzel** nach MASTER Q-F5: statt Einzeltasten `N`, `A`, `.` nur Umschalt+Buchstabe (Neue Karte Umschalt+N, Einlösen Umschalt+E, Neu berechnen Umschalt+R, Kommentar Umschalt+C); Primär/Druck/Tabs/Speichern aus dem Fundament.
5. **Heute-Leiste** auf der Bereichsübersicht (Konzept §3.1) trotz MASTER Q-B4 („nur Zentrale“) – das Konzept ist hier ausdrücklich; als Arbeitszähler in Pillen, nicht als zweite Kennzahlenreihe.
6. **Band** steht unter Kopf und Stufenblock (AkteGeruest-Slot), nicht im Kopf selbst.

## 4. Fähigkeiten (Stand Mock, `lib/backoffice/kundenkarte/faehigkeiten.js`)

| ID | Stand | Übergang in der UI |
|---|---|---|
| `einwilligung_erteilen` (P3) | aus | Upload + `save` + Kommentar mit Kanal/Nachweis/Datenschutzinfo; Ereignis wie Controller |
| `ablehnungsgrund` (P1) | aus | „[Grund] Text“ in `entscheidung_grund` |
| `antrag_ohne_email` (P1) | aus (erwartet) | E-Mail Pflicht, Satz „Karten ohne E-Mail sind noch nicht möglich.“ |
| `datenschutzinfo_version` (P1) | aus | Vermerk am Antrag |
| `stufe_manuell_grund` (P9) | aus | Grund als Kommentar + Ereignis-Hinweis |
| `einloesung_zugesagt` (P5) | aus (erwartet) | Reiter „Zugesagt“ fehlt; Kacheln Lieferung/Montage mit Satz „Bei Möbeln aus einem Auftrag …“; AB/Lieferschein nicht als Beleg |
| `umsatzregeln` (P2) | aus (erwartet) | Band „Berechnung im Aufbau“ bei Beträgen/Kundenwert; „Zählt“-Text = heutiger Stand |
| `widerruf_leert_verlauf` (P7) | aus | Folge-Satz „Umsatzangaben an der Karte werden gelöscht“ |
| `karten_umstufen` (P14) | aus (erwartet) | Aktiv-Schalter einer Stufe mit Karten gesperrt + Satz |
| `kartenleistung_kassa` (P6) | aus (erwartet) | für B-KAS: Einlösung nach Buchung, keine Bonzeile |
| `wallet` | an (Methode vorhanden) | Zustand nur für Leitung (Methode prüft Leitung) |

## 5. Offene Punkte

1. **Registerzeilen** (Fundament, nicht B-KKA): `aufgaben/index.js` → `kundenkarte`, `freigaben/index.js` → `kundenkarte` (leer), `akte/slots/index.js` → `kundenkarte` eintragen (P0-5/P0-7/L0).
2. **Palette:** Schnellaktionen „Neue Kundenkarte“ / „Vorteil einlösen“ liegen als `SCHNELL_VORBEREITET` in `suche/kundenkarte.js`; die Liste ist im Fundament-Test eingefroren – L0 bitte freigeben und den Test-Schnappschuss nachziehen.
3. **Demo-Benutzer „Kundenkarte-Leitung“** fehlt (Inhaber-Frage 80); Leitungsabläufe laufen heute über `admin@demo.local`.
4. **CRM-Seed:** alle Kontakte heißen „Laura Muster“ mit gleicher E-Mail (B-CRM / P0-1). Karten tragen eigene Beispielnamen; die Kundenakte zeigt daher einen anderen Namen.
5. **Hilfeartikel** `backoffice/hilfe/kundenkarte/*.md` (Konzept §12.3) liegen außerhalb des B-KKA-Schreibbereichs – Team Q5.
6. **Kassa/Packtisch** (B-KAS, B-LOG): `kioskKarteAction` (nur Name, Stufe, Vorteile) und `StufenKennzeichen` stehen bereit; Kassa-Kurzform-Antrag und Packtisch-Zeile bauen die Arbeitsplätze.
7. **QR-Code:** kommt aus `qr_svg` des Backends; im Mock leer (ehrlicher Satz statt Scheinmuster).
8. **Sammeldruck** mehrerer Karten (Massenaktion „Drucken“) wartet auf den Sammeldruck im DruckPanel (Fundament); Einzeldruck über das DruckPanel ist da.
9. Backend-Anfragen P1–P16 unverändert offen (Konzept §9.3); blockieren den Livegang, nicht die Oberfläche.

## 6. Neue Fragen
Inhaber 76–80 (`90-inhaber-fragen.md`), Steuerberater/Kanzlei 40–41 (`91-steuerberater-fragen.md`).
