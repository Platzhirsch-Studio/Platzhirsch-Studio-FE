# Übergabe Team P0-5c (Fundament v2): Drucken, Kunden informieren, Leitung bitten, An der Kassa

**Stand:** 04.11.2026 · MASTER § 4 G-05, G-17, G-18, G-19 · Gestaltung Lounge (Nr. 51/53)

## Gebaut

| Datei | Inhalt |
|---|---|
| `backoffice/src/lib/backoffice/druck/index.js` | Druck-Register (53 DocTypes, 66 Formate **exakt** aus Backend-Import, Unit-Test gleicht ab), Titel/Papierart, Links auf `/druck/[doctype]/[name]` und `/pdf`, Vorschau-Maßstab, Warteschlangen-Logik (Zustände wartet · druckt · gedruckt · fehler · pdf, Sammeldruck, Aufräumen), Kiosk-Einträge |
| `backoffice/src/components/Backoffice/Druck/` | `DruckPanel` (Sheet 800 px, Leuchttisch + Papier, Format-Segment, „Mehrere Formate“ als Chips, Zoom, Ausgabe-Karte, Fehlerband Drucker, Warteschlange, Link kopieren · PDF · Per E-Mail · Drucken), `useDruckTaste`/`DruckKnopf` (Strg/⌘+P), `DruckMenue` (Kiosk), `warteschlange.js` (IndexedDB `ph_bo_druck`), `druck.css`, `texte.js`, `index.js` |
| `backoffice/src/components/Backoffice/Informieren/` | `Informieren` (Chip + Sheet), `InformierenChip`, `InformierenSheet`, `aktionen.js` (4 Server Actions mit Mock-Pfad), `server.js` (Versandweg, Recht Leitung, Leitung finden, Commit-Aktion `mailSendenCommit`), `logik.js` (rein), `texte.js` (auch für LeitungBitten/AnDieKassa), `index.js` |
| `backoffice/src/components/Backoffice/LeitungBitten.js` | Knopf- und Menü-Variante, Prüfung vor dem Öffnen, Dialog sm, Zustand „Angefragt bei Leitung · …“ |
| `backoffice/src/components/Backoffice/AnDieKassa.js` | drei Varianten, Recht wie `/arbeitsplatz`, `kassaHref` |
| `backoffice/src/components/Backoffice/Demo/druck-informieren.js` (+ `-teile.js`) | Demo mit echten Mock-Datensätzen; Zeile `druck-informieren` in `lib/backoffice/demo-register.js` |
| `backoffice/tests/unit/backoffice-p05c.test.mjs`, `backoffice/tests/e2e/backoffice-p05c.spec.js` | 16 Unit-Tests, 6 E2E-Fälle |
| README `components/Backoffice/README.md` | Abschnitt „Drucken, Informieren, Leitung, Kassa (Team P0-5c)“ |

Ein früherer Lauf hatte in diesem Schreibbereich nichts angelegt; alles ist neu. Bestehende Aufrufer gab es keine.

## Tests

- Unit gesamt `node --test "tests/unit/**/*.test.mjs"`: **258/258 grün** beim Abschluss (davon 16 neu; parallel arbeitende Teams ergänzen laufend).
- ESLint auf allen eigenen Dateien: **0 Fehler, 0 Warnungen**.
- E2E `backoffice-p05c.spec.js --project=desktop`: **6/6 grün** gegen einen Prüfspiegel auf :3105 (Next 16.4.1 `--webpack`, Mock, im Scratchpad `P0-5c/spiegel`, mit Ersatzroute `/qa-baustein` statt der fehlenden Einbindung in `/einstellungen`). Gegen :3100: **6 übersprungen** – :3100 liefert auf jeder Route 500 (veralteter Fehler „Can't resolve './ereignisse'“ in `Shell/Glocke.js`, die Datei ist auf der Platte längst korrigiert; Server nicht neu gestartet, wie vorgegeben) und die Demo ist noch nicht eingebunden.
- Interaktions- und Bildlauf (eigenes Skript, Desktop 1440×900 + iPhone 13, hell/dunkel): 57 Aufnahmen, **0 Konsolenfehler, kein Überlauf**; Strg+P öffnet das Panel, Rückgängig sendet nichts, Senden setzt den Chip auf „informiert“, zweite Bitte am selben Tag → „Bereits angefragt“ (Idempotenz wirkt, im Bericht als erwartet vermerkt).
- `tools/qa/shoot.mjs` nicht gelaufen: braucht :3100 und die eingebundene Demo-Route.

## Sichtung neben Lounge

Druckpanel und Informieren-Sheet entsprechen dem Bezahlt-Sheet der Kassa und dem Vorschau-Panel der Anfragen (Material, Radius 28/20, eingelassene Karten, Pillen-Segmente, eine Tinte-Primäraktion unten rechts). Leitung-Dialog wie iOS-Hinweis mit Zitatstrich (Cognac, wie „Braucht deine Antwort“). Chips weiche Materialflächen (Eiche/Salbei/Ziegel) mit Symbol + Wort. Papier bleibt in beiden Schemata weiß. Korrigiert nach Sichtung: Vorschau war leer (gestreamte Seite ohne Skripte) → Segmente werden jetzt aufgelöst; doppelte Formatwahl (Segment + Chips) → Chips nur im Sammeldruck; Leitung-Dialog flackerte bei schon gestellter Bitte → Prüfung vor dem Öffnen; Kiosk-Menü öffnete nach links über die Leiste → `oben-start`; Telefon: Leuchttisch-Rand 12 px, Titel umbrechen statt abschneiden.

## Abweichungen (Freigabe L0 erbeten)

1. **Vorschau ohne `iframe src`:** `next.config.js` sendet `X-Frame-Options: DENY` für alle Pfade. Das Panel lädt die Druckansicht deshalb per fetch in `srcdoc` (ohne Skripte) bzw. das PDF als blob-URL. Alternative wäre `SAMEORIGIN` für `/druck/*` (Besitzer P0-9).
2. **„Gesendet“ statt „Zugestellt“:** Der Server meldet nur die Übergabe an den Mailversand; „Zugestellt“ wäre eine falsche Aussage (Q-A6). Inhaber-Frage Nr. 57.
3. **Druckvorschau im Mock** zeigt die vorhandene generische Druckansicht (Feldliste), nicht die Jinja-Formate – die rendert erst Frappe (PDF). Im Panel als „Vorschau aus Beispieldaten“ gekennzeichnet.
4. Eine Demo-Datei mit zwei Teilen (Server + Client) statt je Komponente eine – die Register-Regel erlaubt **eine** Zeile je Team.

## Offene Punkte

1. **P0-3:** in `lib/backoffice/commit/aktionen/fundament.js` eintragen: `import { mailSendenCommit } from "@/components/Backoffice/Informieren/server";` und `"fundament.mail": mailSendenCommit`. Erst dann gilt der Exchange-Weg (Entscheidung „E-Mail über Exchange, sonst Resend“); bis dahin läuft Senden über die Sende-Methode des Bereichs (`fundament.methode`, Mailversand des Servers). Ohne beides bleibt E-Mail gesperrt mit Satz.
2. **Zentrale/L0:** Demo-Einbindung `/einstellungen?tab=system&baustein=…`; danach `backoffice-p05c.spec.js` gegen :3100 laufen lassen. Zentrale-Seite `/druck?tab=warteschlange` kann `useDruckWarteschlange()` lesen.
3. **:3100 neu starten** (veralteter Glocke-Fehler, siehe oben).
4. **Leitung finden im Frappe-Modus:** liest „Has Role“ mit der Sitzung der Person – Mitarbeiter haben dafür meist kein Leserecht, die Aufgabe bleibt dann ohne Zuständigkeit (Glocke „Team“). Wunsch an ph_core: Methode `leitung_von(bereich)` oder Feld je Bereich in PH Einstellungen (Inhaber-Frage Nr. 55).
5. **PH Aufgabe** darf nur CRM, GF und Admin anlegen. Für Faktura-, Sortiment-, Kundenkarte-Mitarbeitende ist „Leitung bitten“ deshalb ausgeblendet, bis ph_crm die Rolle(n) im DocType ergänzt (Backend-Lücke an Q6/ph_crm).
6. **Kassa:** `/kassa` liest `kunde`, `beleg`, `art` noch nicht aus (Bereich Kassa).
7. Bereiche liefern ihre Vorlagen (Texte in `<bereich>/texte.js`, Methode z. B. `PH Projekt.portal_status_senden(text)`, `PH Servicefall.kunde_informieren(vorlage, zusatz, betreff)`, `PH Kontakt.mail_senden(betreff, nachricht, an)`) und den Zustand `offen`/`informiert` aus ihren Feldern.

## Fähigkeiten

`informieren.exchange` (Probe `ph_microsoft.api.mail_senden`, nicht erwartet → ohne Hinweis aus): Probe im Mock an, wirksam erst mit Punkt 1. PDF = Frappe-Modus (im Mock Knopf ausgeblendet, Satz im Fuß).

## Neue Fragen

Inhaber: Nr. 55–58 in `90-inhaber-fragen.md`. Steuerberater: keine.

## Screenshot-Ordner

`backoffice/qa-screenshots/p0-5c-druck-informieren/` – Übersicht, Informieren-Sheet, Bearbeiten, Rückgängig-Toast, gesendet, ohne E-Mail, Leitung-Dialog/angefragt/Menü, Druckpanel, Sammeldruck, Drucker offline, Kiosk-Menü, Kassa; Desktop und iPhone, hell und dunkel; `bericht.json`.
