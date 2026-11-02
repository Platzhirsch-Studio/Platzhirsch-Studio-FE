# R5-schweiz: Schweiz-Hub `/de/einkaufen-aus-der-schweiz` (AP6 Nr. 2)

**Ergebnis:** Die Seite ist gebaut. Sie ist `noindex,follow`, ohne Canonical und ohne hreflang, steht nicht in Sitemap, llms oder Navigation und liefert nur auf Deutsch (en/fr/it: 404). Sie ist in de-CH geschrieben (kein „ß“ in eigenen Texten) und zeigt das Entwurfs-Banner. Inhalt: die Wege A und B aus Bericht 18, der Ablauf von Kauf bis Einfuhr, Küche/Einbau als „andere Regeln“ ohne Zusage, eine FAQ nur mit belegten Antworten, die Quellenliste und der CHF-Rechner als Client-Insel. Fachdoku: `Marktresearch/digital/redesign/schweiz-hub.md`.

## Prüfungen

| Prüfung | Ergebnis |
|---|---|
| `node --test tests/unit/r5-schweiz.test.mjs` | 10/10 grün. Enthält die Beispielrechnung Bericht 18, 8.1 (A CHF 20’929.97–21’029.97, B 21’315.30–21’390.97), Quellenpflicht, [prüfen] nicht gerendert, kein ß, Verbotsliste plus `findClaims`, noindex/404, nicht in Sitemap/llms/Navigation, Insel ohne Rechenkern |
| `npx eslint` (eigene Dateien inkl. e2e-Spec) | 0 Fehler |
| `npm run check:claims` | 0 Verstöße (13 per Allowlist, unverändert) |
| `shoot.mjs` (iPhone, Android, iPad, Desktop) | 4 × 200, Bilder angesehen: `qa-screenshots/teamleiter/r5-R5-schweiz/selbst/` (zusätzlich Ausschnitte `crop-*.png`). Rechner auf Desktop zweispaltig, Werte wie Bericht 18, Kurs/Datum/Quelle sichtbar |
| `tests/e2e/r5-schweiz.spec.js` (desktop) | 3/3 grün: noindex/Banner/404, Rechner (Beispiel, Neuberechnung mit Fracht über die Server Function, Fehler am Feld mit Fokus auf der Zusammenfassung), **axe WCAG 2.2 AA ohne serious/critical** |
| Insel-Grösse | minifiziert 4,1 KB, gzip 1,5 KB, kein zod und kein calc.js im Client (Rechnung per Server Function) |

## Offene Punkte

1. **Dev-Server :3000:** Zwischen etwa 00:10 und 00:18 Uhr lieferte er für alle Seiten 500. Ursache war `.next/dev/prerender-manifest.json` mit angehängtem Datenmüll (gleichzeitiges Schreiben). Die Datei ist nicht angefasst, danach lief der Server wieder. Unter Last braucht die Server Function im Dev-Server bis etwa 30 s, die Spec wartet deshalb 60 s. Im Prod-Lauf (R5-release) erneut messen.
2. **INT/R5-release:** Den Pfad in `tools/checks/check-claims.mjs` → `EXTRA_PATHS` aufnehmen (Live-Claim-Prüfung).
3. **Steuerberater/Zollspediteur:** 6 [prüfen]-Stellen, Liste in `schweiz-hub.md`: Reisegepäck mit Anhänger, Rückerstattung durch Platzhirsch, Zeiten Tisis/Schaanwald, Quelle § 7 UStG, eigene Lieferung in die Schweiz, Vergleich mit Schweizer Preisen.
4. Die Schätzwerte für Verzollungsgebühr und Transport ersetzen, sobald Spediteur-Angebote vorliegen. Bis dahin sind sie als „(Schätzung)“ markiert.
5. Freigabe = Banner weg, `index: true`, Canonical, Sitemap/llms/Navigation (INT).

## Nachbesserung nach QA-Feedback (26.10.2026, Note vorher 8/10)

Grundlage: `qa-screenshots/teamleiter/r5-R5-schweiz/feedback.md`. Nachprüfung: `qa-screenshots/teamleiter/r5-schweiz/fix/` (4 × 200, 0 Konsolenfehler, kein Overflow; Ausschnitte `rechner-desktop.png`, `rechner-iphone.png` angesehen). `node --test tests/unit/r5-schweiz.test.mjs`: 12/12 grün (2 neue Regressionstests). eslint auf eigenen Dateien: 0 Fehler.

| Punkt | Stand |
|---|---|
| P2-1 Weg A stille Annahme | **Behoben.** Zeile heisst jetzt „Preis ohne österreichische USt (volle Erstattung angenommen)“, dazu eine offene Zeile „Gebühr für die Erstattung der USt: offen, nicht eingerechnet“. Summe unverändert (= Bericht 18) |
| P2-2 `check-claims.mjs` → `EXTRA_PATHS` | **Offen, nicht unsere Datei.** Muss R5-release vor jeder Freigabe/Indexierung eintragen |
| P2-3 „EZB, heute abgerufen“ | **Behoben.** Neutral „EZB-Referenzkurs“ (bzw. „…, zuletzt gespeichert“ / „…, hinterlegt“); Datum steht daneben |
| P3-1 ESTV ohne Quelle | Behoben: Banner nennt nur BAZG und WKO |
| P3-2 Apostroph | Behoben: alle Beträge mit typografischem ’ (z. B. „EUR 25’000.00“) |
| P3-3 Lead unter CTA (mobil) | Offen: gemeinsame Komponente `LandingHero` (Team 5), nicht in unserem Dateibereich |
| P3-4 „x % unter dem Bruttopreis“ | Behoben: Zeile nicht mehr gerendert (Wert bleibt intern für die Steuerberater-Prüfung) |
| P3-5 EZB-Link | Behoben: neues Fenster, `rel="noopener noreferrer"`, sr-only-Hinweis |
| P3-6 Hero „USt entfällt“ | Behoben: „entfällt bei Lieferung in die Schweiz oder wird nach bestätigter Ausfuhr erstattet“ (Lead und Faktenzeile) |
| P3-7 Server-Action-Dauer | Offen: im Prod-Lauf R5-release messen |
