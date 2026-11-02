# R3-release: Produktions-Prüfung

Stand: 26.10.2026, Branch `feature/neuauftritt`. Nichts committet, gepusht oder deployt. Keine npm-Installation. Kein Build im Repo, kein zweiter Dev-Server. Kein Formular, keine Mail und keine Zahlung wurde ausgelöst.

Das ausführliche Ergebnis, nach Besitzer gegliedert, mit Repro und Beleg, steht in **`release-check.md`**.

## Ergebnis in Kürze

- **`tools/qa/prod-check.mjs`** (`npm run check:prod`) prüft reproduzierbar in einem Durchgang:
  - robocopy in eine Kopie außerhalb des Repos
  - Junction für `node_modules`
  - `turbopack.root` nur in der Kopie, über eine Hülle um `next.config.js`
  - `next build`, dann `next start -p 3100`
  - Volllauf aller e2e-Specs
  - `check-claims --live` in 4 Sprachen und `check-nap`
  - LCP/CLS/TBT mobil gedrosselt und Desktop

  Danach beendet das Skript immer den eigenen Server (taskkill auf die eigene PID) und entfernt die Junction mit `rmdir`, nicht rekursiv. Nach jedem der 4 Läufe geprüft: Port 3100 frei, Junction weg, Repo-`node_modules` intakt.
- **Lauf 1** (Basis, 09:29 MEZ): Build grün, 7 753 Seiten. Tests: 358 grün, 20 rot.
- **Lauf 2** (Rundenende, 10:24 MEZ, nachdem laut Monitor alle anderen R3-Agenten fertig waren): Build grün, 7 757 Seiten. Tests: 397 grün, 15 rot. Mit Nachlauf bleibt **ein echter Befund**: Alle 8 Ratgeber-Artikel liefern im Prod-Build 404, Ursache `dynamicParams = false` (R3-inhalt, P1).
- **Claims live** (821 URLs): 0 Händler-Behauptungen, 0 Superlative. Gerechnet ist das nach der Allowlist für Produktnamen wie „Corker No. 1“ und für ein Gesetzeszitat. In Lauf 1 waren es noch 25 Superlative. `KNOWN` in `legal.spec.js` ist jetzt leer.
- **NAP:** 65 × „Landstraße 11“, 0 × „9“.
- **Performance:**
  - Desktop liegt überall im Budget.
  - LCP mobil: `/de` 2,03 s, `/de/kontakt` 2,82 s (über Budget).
  - TBT mobil liegt bei 202–297 ms und damit knapp über dem Budget. In Lauf 1 waren es 400–630 ms.
- **Next-Patch:** Empfehlung ist `next@16.4.2` exakt ab 30.10.2026. 16.3.8 reicht nicht, die kritische SVG-RCE im Bildoptimierer (`dangerouslyAllowSVG: true`, `sharp` 0.35.4) und der Server-Actions-DoS sind erst ab 16.4.1 behoben.

## Dateien

| Datei | Änderung |
|---|---|
| `tools/qa/prod-check.mjs` (neu) | Prod-Check-Skript. Optionen: `--label`, `--steps`, `--specs`, `--port`, `--workers`, `--runs`, `--error-preview`, `--legal-preview` |
| `tools/qa/perf.mjs` (neu) | LCP/CLS/TBT im Labor, 5 Seiten, mobil (Pixel 7, 4× CPU, 1,6 Mbit/s, 150 ms) und Desktop, Median aus 3 Läufen nach Aufwärmlauf |
| `playwright.config.js` | `PW_REPORT_DIR`, `PW_OUTPUT_DIR`, `PW_JSON_REPORT` und `PW_WORKERS` sind optional. Ohne sie verhält sich alles wie bisher |
| `tests/e2e/labs-kuechenplaner.spec.js` | Kennt jetzt den Prod-Zustand „Versand gesperrt“. Der Maßstab „kein Request“ bleibt, die Fehlerpfade überspringen sich in Produktion mit Begründung. Gegen Dev 4/4 grün |
| `tests/e2e/legal.spec.js` | `KNOWN = {}`: Die News-Superlative sind behoben (Lauf 2 grün, Dev 4/4 grün) |
| `tools/checks/claims-allowlist.json` | +4 Fehlalarme mit Begründung: 3 ClassiCon-Produktnamen „No. 1“, 1 Zitat „§ 312g Abs 2 Nr. 1 BGB“ |
| `package.json` | nur `scripts`: `check:prod`, `check:perf` |
| `tests/README.md` | neue Befehle, Abschnitt „Produktions-Prüfung“, Claims-Stand |
| `Marktresearch/digital/teamleiter/release-check.md` (neu) | Ergebnis nach Besitzer, Läufe, LCP-Tabelle, Next-Analyse |
| `qa-screenshots/teamleiter/r3-release/{lauf1-basis,lauf1-nachlauf,lauf2-rundenende,lauf2-nachlauf}/` | Logs (Build, Start, Playwright, Claims, NAP), HTML/JSON-Bericht, `perf.json`, `summary.{md,json}` |

`helpers.js`, `global-setup.js` und die übrigen Specs sind unverändert.

## Korrekturen an der Prüfumgebung (kein gesenkter Maßstab)

- **Upload:** Ohne `UPLOAD_PUBLIC_BASE_URL` zeigt der Link in Produktion auf `SITE_URL`. Der Test öffnete deshalb die Live-Site (nur GET). Das Skript setzt die Variable jetzt auf `:3100`.
- **Concierge:** Kein Mock in Produktion, die Mock-Tests überspringen sich selbst.
- **Portal und Rechtsvorschau:** Das Skript übergibt jetzt gemeinsame Secrets und `LEGAL_PREVIEW_EXPECT=off`.

## Selbstprüfung

- **`shoot.mjs`** (Dev, 5 URLs × 4 Geräte): alle 200, kein Querscroll, Bilder gesichtet (Startseite iPhone, Minotti Desktop, Sitemap). 4 × die Konsolenmeldung „state update on a component that hasn't mounted yet“ (iPad/Android `/de`, iPhone `/de/produkte`, iPad `/de/kontakt`). Sie ist nur im Dev-Server aufgetreten, im Prod-Smoke nicht. Bilder: `qa-screenshots/teamleiter/r3-R3-release/selbst/`.
- **`npx eslint`** auf alle eigenen Dateien: 0 Meldungen.
- **Unit-Tests** claims/nap: 77/77 grün.

## Offene Punkte

1. **R3-inhalt, P1:** Beim Ratgeber `dynamicParams = false` entfernen. Danach `npm run check:prod -- --specs="content.spec.js smoke.spec.js"`.
2. **Runde 4:** `next@16.4.2` und `eslint-config-next@16.4.2` exakt installieren (ab 30.10.), `sharp` ≥ 0.35.5 prüfen, danach voller `check:prod`.
3. **Performance:** LCP mobil von `/de/kontakt` (R3-inhalt), TBT mobil (R3-shell).
4. **`/de/kuechen-vorarlberg`:** noindex-Entscheidung (R3-landing).
5. **Herstellertexte im Quelltext:** 30 Funde (R3-produkt). Die Produktseiten fehlen im Claim-Live-Check, weil sie in keiner geprüften Sitemap stehen.

## Fix-Runde nach QM-Feedback (8/10), 26.10.2026

| Punkt | Stand |
|---|---|
| **P1 Ratgeber 404** | **Behoben.** Lauf 4 (`qa-screenshots/teamleiter/r3-release/lauf4-fix/`): Build grün, **413 grün / 0 rot**, alle 8 Artikel 200, 0 × „static to dynamic“ bzw. NoFallbackError im Server-Log. Claims live: 821 URLs, 0 Fehler, 0 Händler, 0 Superlative. |
| **P2-1 Ursache** | **Belegt und korrigiert** (release-check §3.1). Drei Diagnose-Builds nur in der Kopie: `generateStaticParams` liefert 8 Slugs (QM-Vermutung trifft nicht zu). Auslöser ist `src/app/not-found.js` → `detectLocale()` → `cookies()`/`headers()`: Die Root-Not-Found-Seite gehört zum Render-Baum jeder Seite, darum ist keine `[locale]`-Seite vorgerendert. Ohne `dynamicParams=false` wurde aus 404 ein 500 („Page changed from static to dynamic at runtime, reason: cookies“, Lauf 3). Gegenprobe ohne `cookies()` in not-found: 7 679 Routen vorgerendert, Ratgeber 13/13 grün. |
| Fix | `src/app/[locale]/ratgeber/[slug]/page.js`: `dynamicParams = false` raus, `export const dynamic = "force-dynamic"` mit Begründung. Unbekannte Slugs und EN/FR/IT weiter 404 (Dev geprüft). **Datei gehört R3-inhalt**, geändert vom R3-release-Fix, weil R3-inhalt fertig war und der Punkt das Release blockierte. |
| **Neu, P2 für R3-shell** | not-found.js ohne `cookies()`/`headers()` → ganze Site statisch/ISR (TTFB/LCP). Danach `force-dynamic` im Ratgeber entfernen. Entscheidung Teamleiter (release-check §3.1a). |
| **P2-2 Next-Patch** | Eingeplant als eigenes Paket mit „darf installieren“ ab 30.10.2026: genau `next@16.4.2` + `eslint-config-next@16.4.2`, `sharp` ≥ 0.35.5, danach `check:prod` (release-check §5, §6.2). Nicht installiert. |
| **P2-3 Mobil /de/kontakt** | **Offen, nicht meine Dateien.** Lauf 4: LCP 2,85 s, TBT 219 ms (TBT aller Seiten 219–290 ms). Ursache LCP: `Newsletter/room.jpg` (859 KB) über `PageHeader` mit `sizes=…100vw` als w=1200 q=75. Vorschlag `quality={50}` (wie Startseiten-Hero) bzw. Bild verkleinern; Besitzer R3-inhalt/R3-shell. |
| **P2-4 Allowlist** | **Behoben.** `file` ist Pflicht (String oder Liste, Pfad- oder URL-Präfix); Einträge ohne `file`/`contains` gelten nicht und machen `check-claims` rot. „No. 1“-Namen nur auf den ClassiCon-Kategorieseiten (4 Sprachen), „größte Hebel“ und Ratgeber-Quellen nur in der jeweiligen Datei/Artikel-URL; 2 tote globale Einträge entfernt. Statisch unverändert 13 frei / 30 Funde, Unit-Tests 77/77. |

Geänderte Dateien: `tools/checks/lib/parse.mjs`, `tools/checks/check-claims.mjs`, `tools/checks/claims-allowlist.json`, `Marktresearch/digital/teamleiter/release-check.md`, dazu `src/app/[locale]/ratgeber/[slug]/page.js` (siehe oben). ESLint 0 Meldungen.

Prüfwerkzeug `shoot.mjs` (`qa-screenshots/teamleiter/r3-R3-release/fix/`): /de, /de/kontakt, /de/ratgeber und ein Artikel auf 4 Geräten → 16/16 mit 200, 0 Konsolenfehler, kein Querscroll. Screenshots angesehen (Artikel iPhone, Hub Desktop, Kontakt Android): sauber.
