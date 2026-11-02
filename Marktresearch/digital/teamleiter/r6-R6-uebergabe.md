# R6-uebergabe: Übergabemappe und Freigabe-Cockpit

Stand: 26.10.2026 · Branch `feature/neuauftritt` · nichts committet, keine Installation, kein Build im Repo, keine fremde Datei geändert.

## Fix-Runde nach QM-Feedback (8/10, `qa-screenshots/teamleiter/r6-R6-uebergabe/feedback.md`)

| Punkt | Stand | Umsetzung |
|---|---|---|
| P2.1 Mobil nicht in der Regression | behoben | Neue Spec `tests/e2e/r6-uebergabe-a11y.spec.js`: Der Name passt auf `MOBILE_SPECS = /(smoke\|a11y)\.spec\.js$/`, läuft also ohne Änderung an `playwright.config.js` auf iPhone (WebKit), Pixel und Desktop. Alle `<details>` geöffnet: axe ohne serious/critical, kein Überlauf, offene Ratgeber ohne „geprüft am“. Ein Unit-Test prüft, dass die Spec weiter auf `MOBILE_SPECS` passt. |
| P2.2 „geprüft am … · Prüfer nicht eingetragen“ | behoben | `ratgeberReviewLabel()` in `model.js`: „geprüft am …“ nur bei `freigegeben: true` und eingetragenem Prüfer; sonst „Datum 26.10.2026 eingetragen, kein Prüfer eingetragen, Prüfung offen“ (jetzt bei 5 von 8 Artikeln). |
| P3.1 `imagery.js:33` | war bereits korrigiert | Mappe nennt `imagery.js:42, 49, 83, 101`. |
| P3.2 Portal-Badges wirken wie Freigabe | behoben | Aktiver Portal-Login und Portal-Mail als Warn-Badge („Login möglich, noch nicht freigegeben“, „eingerichtet, erst mit dem Portal freigeben“). |
| P3.3 Vercel-Preview offen | behoben | Mappe Abschnitt 7: `FREIGABE_PREVIEW=1` nur mit aktiver Vercel Deployment Protection. |
| P3.4 Sprachumschalter → 404 | behoben | Hinweis „Nur auf Deutsch“ im Vorschau-Banner. |
| P3.5 / P3.6 Konsole iPhone, unruhige Läufe | offen, nicht im Paket | Im Fix-Lauf keine Konsolenfehler auf allen 4 Geräten; Beobachtung bleibt bei R6-release. |

Prüfung Fix-Runde: Unit `r6-uebergabe.test.mjs` 15/15; ESLint 0 Fehler; Playwright iPhone/Pixel/Desktop 7 bestanden, 1 übersprungen (Produktionsfall); `shoot.mjs` → `qa-screenshots/teamleiter/r6-uebergabe/fix/`: DE 200 auf iPhone, Android, iPad und Desktop, kein Überlauf, keine Konsolenfehler; Screenshots und Ausschnitte (`mobile-ratgeber-zeile.png`, `mobile-schalter-portal.png`) angesehen.

## Ergebnis

1. **Übergabemappe** `Marktresearch/digital/uebergabe/00-uebergabe.md`: fertige Seitenarten und Funktionen, abgeschaltete Teile mit Schalter und Datei:Zeile, alle Umgebungsvariablen (nur Name, Zweck, Fundstelle, Build/Laufzeit; keine Werte), Freigabelisten nach Inhaber (I1–I13), Kanzlei (K1–K9), Steuerberater (S1–S5), Insolvenzrechtler (R1–R2), Betrieb (B1–B9) mit Datei:Zeile, Deploy-Reihenfolge mit Verweis auf `release-check.md`, Noten R1–R5 und Abnahmen. Quellen: r1–r5-Berichte, release-check, inhaber-entscheidungen, Rechtspaket. Keine neuen Fakten.
2. **Freigabe-Cockpit** `/de/preview/freigaben`: nur Dev oder `FREIGABE_PREVIEW=1` (nie bei `VERCEL_ENV=production`), sonst 404; EN/FR/IT 404; `noindex, nofollow, nocache`; nicht in Sitemap/llms/Navigation. Reine Server-Komponenten, kein Formular, keine Schreibfunktion, kein fetch. Liest per Import: `listRatgeber` + Rohtext (Zeilen jeder [prüfen]-Stelle, Embargo-Namen maskiert), `getProductCopyDraft` + `approvals.js` (Status ganz/teilweise/veraltet/offen, Startliste), `imageOverrides` (released), `LegalDrafts` (`docCounts`, Links auf `/de/preview/recht/*`), Commerce (`mode.js`, `voucherTerms.js`), Schweiz-Hub (`pruefen`-Stellen aus `lib/ch/content.js`), Schalterzustände (nie Werte).

Stand laut Cockpit: Ratgeber 0/8 freigegeben (87 Prüfstellen), Produkttexte 0/62, Hero-Fotos 4/6 zurückgehalten, 274 offene Stellen in 4 Rechtsentwürfen, Gutscheinbedingungen Entwurf, Schweiz-Hub 6 Stellen ohne Beleg.

## Dateien

- `Marktresearch/digital/uebergabe/00-uebergabe.md`
- `src/app/[locale]/preview/freigaben/page.js`
- `src/components/Freigaben/{model.js,data.server.js,Cockpit.js}`
- `tests/unit/r6-uebergabe.test.mjs` (12/12 grün)
- `tests/e2e/r6-uebergabe.spec.js` (desktop: 4 grün, 1 übersprungen = Produktionsfall; liest `FREIGABE_PREVIEW_EXPECT`, das `prod-check.mjs` bereits setzt)
- `qa-screenshots/teamleiter/r6-R6-uebergabe/selbst/` (Screenshots + report.json)

## Prüfung

- `npx eslint` auf alle eigenen Dateien: 0 Fehler.
- curl: `/de/preview/freigaben` 200 mit `noindex, nofollow, nocache`; `/en|fr|it/preview/freigaben` 404.
- shoot.mjs, 4 Geräte: DE 200, EN 404, kein Überlauf; Bilder angesehen (iPhone, Android, iPad, Desktop ganz). Ein erster Lauf hatte auf Android 500 durch einen Kompilierfehler in fremden Dateien (ShopCatalog/MarkenItems, gerade in Arbeit bei R6-produkt-perf); Wiederholung grün.
- axe (wcag2a/aa, 21aa, 22aa) auf iPhone, Pixel, iPad, Desktop mit allen `<details>` geöffnet: **0 Verstöße**, Überlauf 0 px.
- Unit-Test prüft: Schalterregel, robots, kein Formular/Schreibzugriff, nicht in Sitemap/llms/robots/Navbar, Text-Hash-Status, Bildregister, Schweiz-`pruefen`-Zahl, Claims-Filter über die Cockpit-Texte (0), Mappe nennt alle Schalter und enthält keine Variablenwerte und kein „abgesichert“.

## Offene Punkte

1. ~~Mobile Playwright-Projekte~~ erledigt in der Fix-Runde: `r6-uebergabe-a11y.spec.js` läuft über `MOBILE_SPECS` auf iPhone und Pixel. Das iPad-Projekt nimmt nur `smoke`-Specs; das Cockpit auf dem iPad prüft weiter nur `shoot.mjs`.
2. Im Prod-Build mit `FREIGABE_PREVIEW=1` funktionieren die Links in die Rechtsentwürfe nur mit `LEGAL_PREVIEW=1`, die Produkttext-Entwurfsansicht nur im Dev-Server (das Cockpit sagt das auf der Seite).
3. Der Abschnitt Runde 6 in `release-check.md` (Ablaufblatt Next 16.4.2, Go-live-Liste final) gehört R6-release; die Mappe verweist darauf und wiederholt keine R6-Messwerte.
4. Zeilenangaben in der Mappe sind Stand 26.10.; das Cockpit berechnet die Zeilen für Ratgeber, Bildregister und Commerce zur Laufzeit.
