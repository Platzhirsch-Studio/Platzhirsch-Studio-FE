# 8x – Übergabe Team P0-7 (Fundament v2: Shell, Benachrichtigung, Kundenmodus, Erstbesuch, Hilfe)

**Stand:** 2026-11-04 · Auftrag: G-15, G-20, G-26, G-27 (MASTER § 4/§ 5), `/api/ereignisse`, Hilfe-Lader, QA-Befunde 10 und 14. Gestaltung ausschließlich nach Lounge (Inhaber Nr. 51/53, `art-direction/lounge.md`).
Ein früherer Lauf hatte im Schreibbereich nichts angelegt; die v1-Shell (dunkle Seitenleiste) ist vollständig ersetzt. Alle bestehenden Seiten bekommen die neue Hülle ohne Änderung (`<Shell session={…}>`, neu optional `kopfSlot`).

## ⚠ Zuerst: Dev-Server :3100 hängt (Neustart nötig)

Seit ca. 16:13 übernimmt der Dev-Server :3100 keine Dateiänderungen mehr und liefert für **alle Routen 500** mit einem veralteten Fehler „Can't resolve './ereignisse'“ (`Shell/Glocke.js`, Zwischenstand von 16:04, als die Datei eine Sekunde vor ihrem Import-Ziel geschrieben wurde). Die Datei existiert längst nicht mehr in dieser Form; Turbopack meldet seit 16:13 kein „Compiled“ mehr, auch nicht für Änderungen außerhalb von `Shell/` (Log `backoffice/.next/dev/logs/next-development.log`). Ich durfte nicht neu starten.
**Bitte :3100 neu starten** (`npm run dev` im Ordner backoffice). Danach ist der Code-Stand dieser Übergabe gültig; geprüft habe ich ihn auf einem Spiegel (siehe Tests).

## Gebaut

| Datei | Inhalt |
|---|---|
| `components/Backoffice/Shell/Shell.js` | Hülle v2 (Server): Leiste, Kopfzeile, Testband im Inhalt, Palette, Kürzel-Wurzel, Sitzungs-Hinweis, Kundenmodus-Provider, Shell-Kontext (Benutzer-Hash), `SeitenUebergang` (Q2) um den Inhalt; Glocke + Freigaben serverseitig vorgeladen; `kopfSlot` für Stempelpille/Kundenmodus-Knopf (K-36). `header` steht direkt vor `main#bo-inhalt` (View-Transition `bo-kopf` bleibt). |
| `Shell/shell.css` | Lounge-Maße: Leiste 72/16/Radius 36, Kreise 48 (viele Bereiche + niedrige Fenster 40/36), Tinte-Kreis aktiv, Tooltip-Pille mit Feder; Kopf 88 sticky, ab 8 px Material (blur 32, saturate 180 %, Haarlinie); Pillen-Reiter als Material-Kapsel; Inhalt ab 120/rechts 32; Tablet Leiste 64 + Reiter zweite Reihe; Telefon Tab-Kapsel unten; Palette/Glocke/Menü/Hilfe/Freigabe/Erstbesuch; Kundenmodus; Squircle, reduzierte Bewegung, Druck. Nur Token aus globals.css. |
| `Shell/Leiste.js`, `Reiter.js`, `navigation.js`, `Kopfzeile.js` | Leiste (Bereiche nach Rechten, Strg+B/`[`/`]` Namen ein/aus, Hell/Dunkel, Avatar = Benutzermenü), Reiter (Unterbereiche aus dem Register, längster Treffer aktiv, gleitende Tinte-Pille, max. 6 + „Mehr“), Kopfzeile (Wortmarke, Reiter, Slot, Suche/Glocke/Neu/Hilfe). |
| `Shell/Befehlspalette.js`, `Shell/logik.js` | Palette v2 als nativer Dialog im Material: Präfix-Chips `> / # @ ?`, Betragserkennung, Enter wartet ≤ 600 ms, Gruppe „Dieser Datensatz“, Hilfe-Treffer; `oeffnePalette()`. |
| `Shell/Glocke.js`, `Shell/FreigabeEintrag.js`, `Shell/ereignisstrom.js`, `Shell/aktionen.js` | Glocke v2 (Reiter, Tagesgruppen, Lesezustand, Tasten, Zähler-Pop nur bei Zunahme), FreigabeEintrag (geldwirksam → Bestätigen mit Betrag/Folge, Ablehnen mit Pflichtgrund + 8 s Rückgängig, eigener Antrag gesperrt), SSE-Abo mit Rückfall-Polling, Server Actions (Glocke laden, gelesen, freigeben, ablehnen, PIN setzen, Kundenmodus beenden). |
| `Shell/BenutzerMenu.js`, `Shell/Thema.js` | Menü mit Arbeitsplätzen (1–5), Gerät, PIN ändern (Dialog), Hell/Dunkel/System, Dichte, Einzeltasten, Tastenkürzel, **Abmelden = POST `/auth/microsoft/abmelden`**; Vorlieben sofort lokal, dann je Person über `vorliebeSpeichernAction` (P0-8, gleiche Schlüssel `ph_bo_theme`). Thema-/Dichte-Skript vor dem ersten Paint über `useServerInsertedHTML`. |
| `Shell/HilfePanel.js`, `Shell/HilfeArtikel.js`, `lib/backoffice/hilfe.js`, `app/hilfe/page.js`, `app/hilfe/[...artikel]/page.js`, `app/hilfe/inhalt/route.js` | Hilfe-Panel (Taste `?`, Sheet 480 von P0-4): Artikel der Seite aus `backoffice/hilfe/**`, „Was kann ich hier tun?“ nach Rechten, Kürzel der Seite; Lader mit Kandidaten je Route, sicherem Pfad und HTML-freiem Markdown; Übersicht `/hilfe` und Artikelseiten. |
| `Shell/Testband.js`, `Shell/SitzungsHinweis.js`, `Shell/NeuMenu.js`, `Shell/NurBediener.js`, `Shell/ShellKontext.js`, `Shell/texte.js` | Testband als Eiche-Pille im Inhalt (QA 10), Sitzungs-Hinweis/Overlay (Q-E5), Neu-Menü (`N`), Kundenmodus-Grenze, Kontext, Texte. |
| `lib/backoffice/benachrichtigungen.js` | Glocke laden (Freigaben, eigene Aufgaben, Team-Aufgaben, Frappe Notification Log), Tagesgruppen (Wiener Zeit), Fälligkeitstext, Stand-Schlüssel, Lesezustand. Ohne Server-Importe (auch im Browser nutzbar). |
| `lib/backoffice/freigaben/index.js` | Freigabe-Register + Prüfung, Recht (Leitung), eigener Antrag, Grundprüfung, Laden/Ausführen mit Token-Konflikt. Register ist leer, bis Bereiche Arten liefern. |
| `app/api/ereignisse/route.js` | SSE je Sitzung (gebündelt, 30 s, 5 min, retry 60 s, `sitzung`-Ereignis), `?einmal=1` als JSON. |
| `components/Backoffice/Kundenmodus/` (`Kontext`, `KundenmodusKnopf`, `BedienerRueckkehr`, `NurIntern`, `texte`, `index`) | G-20 vollständig: Start, Ausblenden über `html[data-bo-kundenmodus]` + `[data-bo-intern]`, Schrift +2 px, Rückkehr Langdruck 800 ms + PIN. |
| `components/Backoffice/Erstbesuch.js` | G-27-Band (1–2 Sätze, Mehr, Verstanden), je Benutzer-Hash und Route gemerkt. |
| `components/Backoffice/Demo/shell.js` + Zeile `shell` in `lib/backoffice/demo-register.js` | Demo aller Teile (Freigaben drei Zustände, Glocken-Zeilen, Palette-Präfixe, Hilfe, Erstbesuch, Kundenmodus mit NurIntern, Testband). |
| `components/Backoffice/README.md` | Zeile `Shell/Shell` neu, Abschnitt „Shell v2 im Lounge-Stil (Team P0-7)“. |
| Entfernt | `Shell/Seitenleiste.js`, `Shell/NavKontext.js` (nur intern genutzt). |
| Tests (eigene Dateien) | `tests/unit/backoffice-shell.test.mjs` (15), `tests/e2e/backoffice-shell.spec.js` (6). |

## Tests

| Prüfung | Ergebnis |
|---|---|
| Unit gesamt `node --test "tests/unit/**/*.test.mjs"` | **179 / 179 grün** (davon 15 neu: Hilfe-Kandidaten/Pfadschutz/Markdown, Glocke Mock+Frappe, Freigaben Recht/eigen/Token/Grund, Navigation, Reiter, Palette, Erstbesuch, keine Hex-/Versalien in Shell-Dateien) |
| ESLint `--max-warnings 0` auf allen eigenen Dateien | **0** |
| E2E desktop: `backoffice.spec.js` + `backoffice-motion.spec.js` + `backoffice-shell.spec.js` | **22 passed, 2 skipped** (Demo-Tests ohne Einbindung) |
| E2E `backoffice-grundbausteine.spec.js` desktop | grün (im Lauf 17 passed / 4 skipped zusammen mit Fundament + Shell) |
| E2E `backoffice-shell.spec.js` desktop + ipad | **12 / 12** |
| `tools/qa/shoot.mjs` (`/`, `/crm`, `/einstellungen`, 3 Viewports × hell/dunkel) | **18 Aufnahmen, 0 Befunde** (kein Überlauf, keine Konsolenfehler, Fokus sichtbar) |
| Zustände (Palette, Glocke, Menü, Hilfe, Liste gescrollt, Leiste beschriftet, Kundenmodus) Desktop/iPad/iPhone hell/dunkel | gesichtet neben `entwurf-lounge/1-zentrale` und `2-anfragen`: Leiste, Reiter, Rundknöpfe, Material-Kopf, Badge, Kacheln aus einem Guss |

**Wichtig zur Testumgebung:** Weil :3100 hängt, liefen alle E2E/Screenshots gegen einen **Spiegel** des aktuellen `backoffice/src` auf **:3101** (Next 16.4.1 mit `--webpack`, Mock-Modus, im Scratchpad; Turbopack lehnt die verlinkten `node_modules` außerhalb seines Wurzelordners ab). Der Spiegel wird mit meinem Ende beendet. Nach dem Neustart von :3100 bitte einmal `PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/backoffice-shell.spec.js tests/e2e/backoffice.spec.js --project=desktop` gegen :3100 wiederholen (Turbopack statt webpack).

Befunde, die ich auf dem Weg behoben habe: Avatar-Initialen „M(“ bei Namen mit Rollen-Klammer (Name wird vor dem Avatar gekürzt); Segmente im Menü abgeschnitten (ohne Symbole, 340 breit); Rail-Link mit `aria-label` „E-Mails“ kollidierte mit `getByLabel(/^E-Mail/)` im Formular-Test (Name jetzt als Inhalt); Next-Entwicklungssymbol lag über dem Avatar (nur in `next dev` Abstand unten).

## Offene Punkte

1. **Dev-Server :3100 neu starten** (siehe oben) – blockiert alle Teams.
2. **Wurzel-Layout (L0):** `vorliebenSkript`/`vorliebenHtmlAttribute` (P0-8) in `<head>`/`<html>` eintragen. Bis dahin setzt die Shell Thema und Dichte über `useServerInsertedHTML` aus dem Browser-Speicher; Seiten ohne Shell (Login, Kiosk) folgen dem System.
3. **Demo-Einbindung** `/einstellungen?tab=system&baustein=shell` (Besitzer Zentrale/L0) – Register-Zeile steht.
4. **Freigaben-Register leer:** Bereiche liefern `lib/backoffice/freigaben/<bereich>.js` (Kandidaten mit Backend-Methode: Faktura Eingangsrechnung `freigeben/ablehnen`, Personal Abwesenheit, Logistik Inventur/Abwertung/Tour, Marketing Social-Beitrag, Projekte Nachtrag, Service Kulanz, Kundenkarte Antrag). P0-7/L0 trägt danach die Import-Zeile in `FREIGABE_BEREICHE` ein.
5. **Backend-Lücken (Fähigkeiten):** (a) Lesezustand für Aufgaben/Freigaben gibt es in Frappe nicht – „gelesen“ hält der Backoffice-Prozess (geht bei Neustart verloren); Vorschlag ph_core: `PH Aufgabe.gelesen_am` oder Notification Log je Zuweisung. (b) Betragssuche für die Palette (`global_search` mit Betrag in Cent) fehlt – die Palette erkennt Beträge und sagt das ehrlich. (c) Kundenmodus-PIN im Frappe-Modus nur an registriertem Gerät (`verify_pin` braucht Geräte-Token); sonst genügt der Langdruck (Inhaber-Frage 48).
6. **Toast (P0-3):** fremde Toasts im Kundenmodus ausblenden – `istKundenmodus()` bzw. CSS `:root[data-bo-kundenmodus="an"]` steht bereit.
7. **Overlay (P0-4), gesehen:** Tooltip „Schließen“ am Sheet-Schließknopf ragt rechts aus dem Fenster, wenn er beim Öffnen den Fokus bekommt; Popover als Bottom-Sheet am iPhone wirkt im WebKit-Screenshot sehr durchsichtig (Unschärfe fehlt dort).
8. **Avatar (P0-2):** `initialen("Max Muster (Geschäftsführung)")` liefert „M(“ – Klammerzusätze sollten entfallen (in der Shell umgangen).
9. **Hilfe-Artikel (Q5):** Ordner `backoffice/hilfe/` gibt es noch nicht; das Panel zeigt bis dahin „Noch kein Artikel“ + Möglichkeiten + Kürzel.
10. **Fremde Altmuster im Inhalt** (z. B. BereichStart-Kacheln mit Linien, Zentrale „Meine Aufgaben“) gehören den Besitzerteams.

## Abweichungen vom Konzept

- **Sitzungs-Overlay:** Statt „Verlängern“ (Q-E5) „Neu anmelden“ im neuen Fenster + „Ich bin wieder angemeldet“ – eine Verlängerung ohne erneute Anmeldung gibt das Sitzungs-Cookie nicht her.
- **Strg+B:** schaltet bei der schwebenden Leiste die Bereichsnamen (Leiste 232 breit) statt ein-/auszuklappen.
- **Testband:** erste Zeile im Inhalt unter der Kopfzeile (statt über ihr), damit der Kopf bündig mit dem Leisten-Logo bleibt wie im Lounge-Entwurf; überdeckt nichts.
- **Glocke-Zeit:** Aufgaben werden nach letzter Änderung gruppiert (Frappe kennt keinen Zuweisungszeitpunkt in der Liste).
- **Freigabe-Recht:** Standard „Leitung des Bereichs“ (Aktion `cancel`); die Geschäftsführung hat laut Rollenmodell nur Leserecht und gibt daher nichts frei, außer ein Bereich setzt `recht` anders.

## Fähigkeiten-Stand

Keine Schein-Knöpfe: Freigeben/Ablehnen erscheinen nur für registrierte Arten; „gelesen“ nur, wo es wirkt; PIN ändern nutzt ph_core `set_pin` (Mock: `mock/core.js`); Abmelden nutzt die vorhandene Route. Neue Fähigkeiten im Register: keine (Bereiche definieren ihre Freigabe-Fähigkeiten selbst).

## Neue Fragen

- Inhaber: **Nr. 48** (Kundenmodus ohne registriertes Gerät), **Nr. 49** (Reiter „Team“ der Glocke), **Nr. 50** (14 Bereiche in der Leiste).
- Steuerberater: keine.

## Screenshot-Ordner

`backoffice/qa-screenshots/p0-7-shell/` – Zustände `1-zentrale` bis `8-kundenmodus` je Desktop/iPad/iPhone hell/dunkel; `lauf/` = shoot.mjs-Bericht (18 Aufnahmen, 0 Befunde).
