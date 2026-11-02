# R6-release: Bericht

Stand 26.10.2026, Branch `feature/neuauftritt`. Nichts committet, gepusht oder deployt. Es ging kein Formular, keine Mail und keine Zahlung raus. Den Dev-Server :3000 habe ich nicht neu gestartet, er liefert 200. Alle Details, das Ablaufblatt für Next 16.4.2 und die finale Go-live-Liste stehen in `release-check.md`, Abschnitt **Runde 6**.

## Ergebnis je Auftrag

| # | Auftrag | Stand | Beleg |
|---|---|---|---|
| 1 | framer-motion exakt | **erledigt.** `"framer-motion": "12.43.0"` steht in `dependencies`. Die Version war schon im Lockfile und ist seit dem 28.07.2026 veröffentlicht. Erst in einer isolierten Kopie installiert (126 grün / 0 rot, Build grün), dann im Repo („up to date“). Im Lockfile hat sich nur der Root-Eintrag geändert. `npm ls` endet mit Exit 0. :3000 liefert 200, kein Next-Update | `qa-screenshots/teamleiter/r6-release/{r6-isoliert-framer-motion,npm-ls-repo.txt,dev-curl-nach-install.txt,rueckbau/}` |
| 2 | check:facts und ESLint-Tor | **erledigt.** `check:facts` ist als Skript angelegt, in `check:prod` als Schritt `facts` und in der CI als Schritt 2b. Gold- und Händler-Regel stehen auf `error`. Vorher gab es 11 Warnungen, alle legitim: dunkle Fläche (Kontrast gerechnet), Rechtsentwürfe, Concierge-Prompt. Sie sind als begründete Ausnahmen je Datei eingetragen. `eslint .` meldet 0 Fehler und 0 Warnungen | `eslint-alles.json`, `eslint.config.mjs` |
| 3 | EXTRA_PATHS | **erledigt.** Schweiz-Hub und Projekte sind fest drin. Commerce-Vorschau und Freigabe-Cockpit kommen nur mit `--commerce-preview`/`--freigabe-preview` bzw. der gleichnamigen Umgebungsvariable dazu. `check:prod` reicht die Flags durch | `tools/checks/check-claims.mjs`, Unit `r6-release` |
| 4 | /cmx-404 `no-store` | **erledigt.** Die Route setzt den Header selbst. `src/proxy.js` nimmt `cmx/` vom Matcher aus, vorher gab es einen 307 auf `/de/cmx/…`. Per curl in Prod: 404 mit `no-store`, 200 mit `immutable`. Die Probe prüft beides | `r6-start/cmx-curl.txt`, `r6-ende/probe.json` |
| 5 | Schweiz-Spec | **erledigt.** `{ exact: true }`, in Prod grün | `r6-ende` |
| 6 | Prod-Läufe | `r6-start` (Beginn): 524 grün / 0 rot / 1 flaky. **`r6-ende`** lief nach Abschluss aller anderen R6-Pakete (Bau, QA, Fix, letzter Fix 18:39 MEZ) auf ruhiger Maschine. Claims 910 URLs / 0, NAP 0, facts 0, logscan 0 × static-to-dynamic. Es gab 1 roten und 2 flaky Tests, Ursache waren meine Specs: die Cookie-Leiste wird jetzt bewusst nach dem Leerlauf gezeigt, und ein Klick kam vor der Hydration. Beide Specs sind korrigiert. **Nachlauf: 551 grün, 0 rot, 0 flaky** | `r6-release/r6-ende*/summary.md` |
| 6b | TBT-Schlussmessung | Median aus 3 Läufen, mobil: /de 216, /de/produkte 215, Minotti 232, Produktseite **289**, /kontakt **480**, /lamps **253** ms. Alle 6 Seiten liegen über 200 ms. CPU-Profile und Hebel stehen in release-check R6.4. Überall gibt es einen Sockel von etwa 170 ms aus der Auswertung von Turbopack-Runtime und react-dom. **Teamleiter-Entscheidung nötig** (250-ms-Budget) | `r6-ende/perf.json`, `r6-ende-profil/profile/*.cpuprofile` |
| 7 | Schlussabnahme | Die URL-Liste ist um R6-Seiten und fehlende Seitenarten erweitert: 134 URLs × 4 Geräte = 536 Shots. 0 Mängel bei Status, Überlauf, Konsole und Requests. Alle 32 Kontaktbögen habe ich angesehen | `r6-ende/abnahme/`, `r6-ende/kontaktbogen/` |
| 8 | release-check.md | Neu sind das Ablaufblatt Next 16.4.2 und eslint-config-next 16.4.2 (Befehle, Prüfschritte, Rückbau, Neustart des Dev-Servers, danach das Portal) und die finale Go-live-Liste mit abgehakten Code-Punkten | `release-check.md` R6.3, R6.6 |

## Selbstprüfung

- `node tools/qa/shoot.mjs …/r6-R6-release/selbst` lief auf 6 URLs × 4 Geräte gegen :3000.
  - Alle URLs lieferten 200, ohne Überlauf.
  - Einzelne 500er auf /de (iPhone) und /de/bewerten (Desktop) traten auf, während andere Pakete gerade `fonts.js` umbauten (Dev-Recompile).
  - Auf dem Prod-Build sind dieselben Seiten in der Schlussabnahme fehlerfrei.
- ESLint auf alle eigenen Dateien: 0. Unit-Tests: **755/755 grün**.

## Geänderte Dateien

- `package.json`, `package-lock.json`
- `eslint.config.mjs`, `.github/workflows/ci.yml`
- `src/app/cmx/[...path]/route.js`, `src/proxy.js`
- `tools/qa/{prod-check.mjs,profile.mjs (neu),abnahme-urls.txt}`, `tools/checks/check-claims.mjs`
- `tests/e2e/{r5-schweiz,r4-shell,r4-shell-prod}.spec.js`
- `tests/unit/{r6-release (neu),r4-ci-pipeline,r5-schweiz,r3-i18n,r5-content-facts,brandCategoryPage,productCopy}.test.mjs`
- `tests/README.md`
- `Marktresearch/digital/teamleiter/release-check.md`

## Offene Punkte

1. **TBT:** Die Entscheidung liegt beim Teamleiter (R6.4).
   - /kontakt: nach dem Fix 221 ms (vorher 480).
   - Produktseite: IntlMessageFormat im Client. Besitzer: Produkt.
   - /lamps: motion. Besitzer: Produkt.
2. **Next 16.4.2:** frühestens am 30.10. nach dem Ablaufblatt einspielen. Danach das Portal.
3. **Impressum und Datenschutz in EN/FR/IT:** zeigen den deutschen Text. Die Kanzlei entscheidet.

## Fix-Runde (QM-Feedback 8/10)

**P2.1 TBT, /de/kontakt: behoben durch eine echte Maßnahme.**
- Ursache gefunden (A/B mit umgeschriebenem HTML auf dem Prod-Build, je 5 Läufe, verschränkt): Der 380-ms-Task ist ein **erzwungenes Style+Layout am Parse-Ende**, ausgelöst durch das `<select>` „Wie sind Sie auf uns aufmerksam geworden?“ im Formular. Ohne Select fällt der Task auf 92 ms, mit Systemschrift bleibt er bei 334 ms (die Schriften sind es also nicht). Optionenzahl, Klassen und `appearance` ändern nichts.
- Maßnahme: Der Formularblock `#nachricht` bekommt `content-visibility:auto` mit gemessener Ersatzhöhe (mobil 1430 px, ab lg 1160 px, „auto“ merkt sich die echte Höhe). Er liegt auf allen Geräten unter dem ersten Bildschirm (Oberkante 1870–2430 px). Inhalt, Accessibility-Baum, Find-in-Page, Fokus und der Sprung auf `#nachricht` bleiben unverändert. Datei: `src/components/Kontakt/kontakt.js` (eine Klasse plus Kommentar). **Hinweis:** Die Datei gehört nicht zu meiner Liste. Ich habe sie geändert, weil das QM ausdrücklich eine Maßnahme für /kontakt verlangt und laut Monitor alle anderen R6-Pakete fertig sind. Es gibt keinen Konflikt.
- Ergebnis Prod-Build (`r6-release/fix-nachher`, perf.mjs, Median aus 3): **/de/kontakt 488 → 221 ms**, LCP 1624 → 1416 ms, CLS 0. Im CPU-Profil: 512 → 211 ms, der Task bei 1,1 s schrumpft von 380 auf 93 ms. /en/contact 211 ms. Übrig ist nur noch der Sockel von etwa 170 ms, den alle Seiten haben.
- `tools/qa/perf.mjs` weist zusätzlich **TBT ab FCP** aus (Lighthouse-Definition), nur zur Information. Das Tor bleibt „alle Long Tasks“. Kontakt ab FCP: 178 ms.
- Stand der anderen Seiten (gleicher Lauf, unverändert, Code anderer Pakete): /de 206, /de/produkte 218, Minotti 237, Produktseite **315**, /lamps **261** ms. **Die Entscheidung des Teamleiters bleibt nötig:** 250-ms-Budget für /de, /de/produkte, Minotti und /kontakt. Die Produktseite und /lamps bleiben als P2 bei R6-produkt-perf (IntlMessageFormat, motion).

**P2.2 Go-live-Blocker: weiter offen, außerhalb des Pakets, nicht durch Code lösbar.**
- Next 16.4.2: Heute ist der 26.10. Laut Ablaufblatt (release-check R6.3) erst ab 30.10. einspielen, danach das Portal.
- „Privacy Shield“ steht noch in `src/components/Datenschutz/datenschutz.js` Z. 62. Der korrigierte Text liegt als Entwurf vor (LegalDrafts D2). Er geht erst nach Freigabe durch die Kanzlei live (Rechtspaket), deshalb ändere ich ihn nicht.
- Impressum und Datenschutz in EN/FR/IT zeigen den deutschen Text. Die Kanzlei entscheidet.
- Alle drei Punkte stehen unverändert als offen in der Go-live-Liste (release-check R6.6). **Kein Go-live, bevor sie abgehakt sind.**

**Prüfung Fix:**
- Prod-Lauf `fix-nachher`: probe 38/0, Formular-, Lead-, a11y-, Consent- und Hüllen-Specs **95 grün / 0 rot / 0 flaky**, facts-Gate bestanden, logscan 0.
- Unit forms-leads, r5-leads, r6-release: **34/34** (r6-release jetzt 10 Tests, neu: content-visibility am Formular, TBT ab FCP). ESLint 0.
- shoot.mjs `r6-R6-release/fix/`: 4 URLs × 4 Geräte, alle 200, kein Überlauf, keine Konsolenfehler. Angesehen: Desktop ganz (Formular vollständig gerendert), iPhone mit `#nachricht` (Sprung landet auf der Überschrift).

Weitere geänderte Dateien: `src/components/Kontakt/kontakt.js`, `tools/qa/perf.mjs`, `tests/unit/r6-release.test.mjs`.
