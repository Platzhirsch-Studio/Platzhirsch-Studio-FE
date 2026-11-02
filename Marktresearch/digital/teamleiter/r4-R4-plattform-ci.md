# R4-plattform-ci: Rate-Limit/Timeout, CI-Pipeline, deploy.sh, Bundle-Budget, ESLint-Schutzregeln

Stand: 26.10.2026, Branch `feature/neuauftritt`. Nichts committet, gepusht oder deployt. Keine npm-Installation. Kein Build im Repo, kein zweiter Dev-Server. `deploy.sh` wurde **nicht** ausgeführt, nur mit `bash -n` geprüft. Live-Prüfungen gegen :3000 nur mit GET-Anfragen.

## Nachbesserung nach QM (Feedback 7/10, 4 × P2)

| P2 | Stand | Was geändert wurde |
|---|---|---|
| 1. CI immer rot | **behoben** | Das Bundle-Budget ist jetzt ein **Ratchet**. In `tools/ci/bundle-baseline.json` stehen die 85 Routen über 190 KiB mit ihrem Ist-Wert (Build `F291ymWCNEpSZvUaeZeK5`, Prod-Kopie). Rot wird eine Route nur, wenn sie über ihre Baseline + 2 KiB wächst oder neu über 190 KiB liegt. Wird eine Route kleiner, meldet das Tor das. `--write-baseline` senkt die Werte dann, nach oben gehen sie nie. CI Schritt 7 nutzt `--baseline` und legt `ci-out/bundle-baseline.next.json` als Vorschlag ins Artefakt. Gegen die Prod-Kopie: **Exit 0**, „kein Zuwachs“ (Bericht `qa-screenshots/teamleiter/r4-ci/bundle-budget-ratchet.{md,json}`). Der fremde Test „Portal/Upload: keine Radien“ ist ohne Eingriff wieder grün, das Team hatte die Datei gerade in Arbeit. **Ganze Suite: 554/554 grün.** |
| 2. Rate-Limit umgehbar | **behoben (Betrieb)** | `deploy.sh` erzeugt die pm2-Konfiguration mit `next start -H 127.0.0.1` (`BIND_HOST`). Damit ist :3000 nur noch über nginx erreichbar. Nach jedem Deploy und Rollback warnt `check_bind` (über `ss`), wenn der Port öffentlich lauscht. Die nginx-Vorlage liegt in `tools/ci/nginx-platzhirsch.conf.example`: `proxy_set_header X-Forwarded-For $remote_addr` überschreibt den Header des Clients, der Upstream ist nur `127.0.0.1:3000`, dazu ein Firewall-Hinweis. Die Voraussetzung ist im Code-Kommentar von `routeLimit.js` dokumentiert. Ein Code-Schutz allein reicht hier nicht: Ohne Proxy kennt ein Route Handler die Socket-Adresse nicht. |
| 3. 404 von /cmx ein Jahr im Cache | **offen bei R4-release**, Übergang vorbereitet | Live erneut bestätigt: `/cmx/files/does-not-exist-qa2.webp` liefert 404 mit `immutable`. Die Ursache liegt in `next.config.js` (nicht meine Datei, Next setzt den Config-Header vor dem Header der Route). Übergangslösung in der nginx-Vorlage: `map $upstream_status` → nur 200/206/304 `immutable`, sonst `no-store` (`proxy_hide_header` + `add_header … always`). |
| 4. deploy.sh ohne Rollback bei pm2-Fehler | **behoben** | Neu ist `reload_or_rollback`: Ein fehlgeschlagener `pm2_reload` zählt jetzt wie ein roter Healthcheck und führt zum Rollback auf den Vorgänger. `pm2_reload` und `switch_to` geben Fehler mit `|| return 1` zurück, weil im `if`-Kontext `set -e` nicht greift. Vorher lief `pm2 save` weiter und meldete Erfolg. Bricht das Skript nach dem Umschalten ab, nennt die ERR-Meldung das aktive Release und den Rollback-Befehl. Geprüft ist das per `source` mit pm2-Attrappe in einem echten bash-Ablauf: Reload rot → Wechsel auf das alte Release → ok. Beide rot → klare Meldung. Kein Vorgänger → Abbruch ohne Wechsel. |

**P3 gleich mit erledigt:**
- `DRY_RUN=1` legt keine Ordner und keine Sperrdatei mehr an. Der Test prüft das mit leerem `APP_ROOT`. Vorher brach DRY_RUN außerdem bei `switch_to` ab, weil der Release-Ordner fehlte.
- Healthcheck: Das Tor prüft nur `/de`. `/de/produkte` hängt am Backoffice und löst nur noch eine Warnung aus (`HEALTH_WARN_URLS`), damit ein langsames Backoffice kein gutes Release zurückrollt.
- Downtime ist im Kopf von `deploy.sh` dokumentiert: fork mit einer Instanz, ein Reload ist also ein Neustart mit kurzer Downtime, **kein** Zero-Downtime.
- Nebenbefund „minotti liefert keine Produkte“: **kein Fehler, so gewollt.** Bei einem Marken- oder Kategorietreffer antwortet `shop-search` absichtlich mit den Kategorien der Marke (`showProducts = false`). Live: „minotti“ ergibt 1 Marke, 8 Kategorien, 0 Produkte; „toulouse“ ergibt 2 Produkte.
- Weiter offen (nicht in meinen Dateien): der `aria-live`-Hinweis bei 429 im SearchDialog (an Shell/Navbar) und `search-test.mjs` im QA-Ordner.

**Neue Tests:** `tests/unit/r4-ci-fix.test.mjs` mit 12 Fällen: Ratchet, Baseline, CLI, ci.yml, nginx-Vorlage, Rollback-Abläufe, Bindung, DRY_RUN, Healthcheck. Alle `r4-ci-*`: **36/36 grün**. Ganze Suite: **554/554**. `bash -n` ok, ESLint auf den Paketdateien ohne Befund, ci.yml mit js-yaml gültig.

**Prüfwerkzeug** (`qa-screenshots/teamleiter/r4-R4-plattform-ci/fix/`): `/de/produkte` und `/api/shop-search?q=rimadesio` liefern auf iPhone, Android, iPad und Desktop 8/8 mit Status 200, ohne Konsolenfehler, ohne fehlgeschlagene Requests und ohne Überlauf. Die Screenshots sind gesichtet, der Katalog ist unverändert.

**Neue/geänderte Dateien dieser Runde:** `tools/ci/bundle-budget.mjs`, `tools/ci/bundle-baseline.json` (neu), `tools/ci/nginx-platzhirsch.conf.example` (neu), `.github/workflows/ci.yml`, `scripts/deploy.sh`, `src/app/cmx/_lib/routeLimit.js` (nur Kommentar), `tests/unit/r4-ci-fix.test.mjs` (neu).

## Ergebnis in Kürze

| Teil | Ergebnis |
|---|---|
| `/cmx` Timeout | 8 s bis zu den Antwort-Headern (vorher 15 s für die ganze Übertragung). Danach läuft der Body ohne Timer weiter, damit große Videos bei langsamer Leitung nicht abreißen. Timeout → **504** mit `Retry-After: 10`, Backend nicht erreichbar → 502. |
| `/cmx` Rate-Limit | 300 Anfragen/min je IP (`CMX_RATE_PER_MIN`), erst nach der Pfadprüfung. **429** mit `Retry-After`. Interne Abrufe des Bild-Optimierers (`/_next/image?url=/cmx/…`, Loopback bzw. keine Adresse) zählen nicht. |
| `shop-search` Rate-Limit | 120/min und 1 200/h je IP (`SEARCH_RATE_PER_MIN`, `SEARCH_RATE_PER_HOUR`), erst ab 2 Zeichen. 429 als JSON `{error, code: "rate_limited", retryAfter}` mit `Retry-After`. Die Navbar zeigt bei `!res.ok` schon heute „keine Treffer“, die Änderung ist also abwärtskompatibel. `q` wird auf 100 Zeichen gekürzt. |
| Speicher | Es gibt keinen neuen Speicher. Genutzt wird die bestehende Abstraktion aus R2-labs-service (`src/lib/concierge/limiter.js` + `limitStore.js`). Standard ist der Arbeitsspeicher (max. 2 000 IPs je Route). Ein geteilter Speicher lässt sich per `getRouteLimiter("cmx").setStore(createSharedStore(exec, { prefix: "cmx:rl:" }))` anschließen. Fällt er aus, rechnet der Limiter mit dem Arbeitsspeicher weiter. Bei einem internen Fehler gilt fail-open. |
| CI | `.github/workflows/ci.yml`: lint → unit → build → `next start :3100` → Playwright + axe → Perf (`tools/qa/perf.mjs` + neues Tor `tools/ci/perf-gate.mjs`) → `check-claims --live` (4 Sprachen) → Bundle-Budget. Rechte nur `contents: read`, keine Secrets (SERVER als Repo-**Variable**, Test-Schlüssel erzeugt der Lauf zufällig), kein Deploy. Berichte als Artefakt und in der Step-Summary. YAML mit js-yaml geparst. |
| deploy.sh | `scripts/deploy.sh deploy [ref] / rollback [release] / list / healthcheck`, `DRY_RUN=1`. Ablauf: Git-Mirror → `git archive` in `releases/<stamp>-<sha>` → `shared/.env.production` und `shared/.data` verlinken → `npm ci` + Build (mit dem `.next/cache` des Vorgängers) → atomarer Symlink-Wechsel (`ln -sfn` + `mv -Tf`) → `pm2 startOrReload` → Healthcheck (`/de`, `/de/produkte`, 120 s). Ist der Healthcheck rot, folgt ein **automatischer Rollback**. Dazu `flock` gegen parallele Deploys und Aufräumen (behält 5 Releases, nie `current` oder den Vorgänger). Selbstprüfung: `bash -n` grün, Unit-Test prüft Muster. shellcheck ist nicht installiert. |
| Bundle-Budget | `tools/ci/bundle-budget.mjs` liest Manifeste (Next 16 druckt keine „First Load JS“-Spalte mehr). Je Route: `rootMainFiles` + alle `entryJSFiles`, gzip -9, Bericht je Route (Konsole, `--json`, `--md`). Exit-Codes: 1 = über Budget, 2 = Build fehlt. Gegen das echte HTML von `next start :3100` abgeglichen (`--compare`): Bei 10 von 12 Seiten deckt sich die Skriptliste exakt. Bei 2 Portal-Seiten ist 1 Datei zu viel gezählt, weil sie zum Login umleiten. Polyfills (`nomodule`) sind ausgenommen. |
| ESLint | `no-restricted-syntax` als **warn** gegen `text-[#d1b250]` (auch `hover:` usw.) und Händler-Strings (Literal, Template, JSXText) in `src/**`. Die Händler-Regel gilt nicht in `src/lib/legal/**` (Claim-Guard). Zusätzlich ignoriert: `qa-screenshots/**`, `playwright-report/**`, `test-results/**`. Vorher brach `eslint .` an 840 Fehlern in Playwright-Trace-Bundles ab. |

## Messwerte

**Bundle-Budget, Prod-Kopie R4-release** (Build `m-krlKD-NaaUjEHF4SC0j`, nur gelesen), Bericht in `qa-screenshots/teamleiter/r4-ci/bundle-budget.{md,json,log}`:
- Gemeinsam (Runtime, React, Router) sind 128,2 KiB gz. Das `[locale]`-Layout hebt jede Seite auf **≥ 210 KiB gz**.
- **85 von 89 Seiten liegen über 190 KiB.** Spitzen: `labs/dreilaender` 360,6, `labs/kuechenplaner` 324, `labs/sofaplaner` 321,6, `labs/stilfinder` 266,6, Produktseite 229,2, Kategorieseite 225,3 KiB.
- Nur `/`, `/_not-found` und `/_global-error` sind im Budget.
- Ohne Baseline wäre das Tor rot. Seit der Nachbesserung läuft es als Ratchet (siehe oben) und ist grün, solange nichts wächst. Die Zahlen zeigen weiter die Arbeit für R4-shell-perf (Shell-JS rund 20 KiB senken) und für die Labs (3D/Three per `next/dynamic` nachladen).

**ESLint, ganzes Repo vorher/nachher:**

| | Vorher | Nachher |
|---|---|---|
| Fehler | 840 in 10 Dateien, alle in `qa-screenshots/**/playwright-report` | 0 in Quelldateien |
| Warnungen | 0 | 11 neue: 8 × Gold-Text (6 davon in `Home/vernissagePopup.js`), 3 × Händler (`LegalDrafts/docs/agb.js`, `impressum.js`, `concierge/systemPrompt.js`) |

Die Warnungen landen bei den jeweiligen Besitzern bzw. bei INT. Die Händler-Treffer in AGB, Impressum und Systemprompt sind wahrscheinlich legitime Verneinungen bzw. Rechtstexte. Vor der Umstellung auf „error“ braucht es dafür eine Ausnahme.

Ein bisher fehlerfreies Paket meldet durch die neuen Regeln keinen Fehler, weil sie nur „warn“ sind. Im Lauf trat genau 1 Fehler auf, in `src/components/Portal/Docs/FilterSelects.js`. Das ist eine neue, untracked Datei eines anderen Teams, die gerade bearbeitet wurde. Beim Nachlauf auf diese Datei: 0 Fehler. Die Ursache liegt also nicht in diesem Paket.

**Unit-Tests:** `tests/unit/r4-ci-ratelimit.test.mjs` (13), `r4-ci-bundle-budget.test.mjs` (6), `r4-ci-pipeline.test.mjs` (5): **24/24 grün.**

Die ganze Suite (`npm run test:unit`, 507 Tests) lief vor der letzten Testkorrektur. Ergebnis: 504 grün, 3 rot.
- Davon 1 dieses Pakets, die ci.yml-Reihenfolge. Der Fehler lag im Test selbst, der Kommentare mitgeprüft hat. Behoben, jetzt grün.
- 2 fremde Tests, keine Dateien dieses Pakets:
  - „10 Datendateien (brandVanEgmond, treca, next125)…“
  - „Portal/Upload: keine Radien…“

**Live gegen :3000 (nur GET):**
- `/cmx/files/minotti-orion-01.webp` liefert 200, `/_next/image?url=/cmx/…` ebenfalls 200. Der interne Abruf ist also nicht betroffen.
- `/cmx/files/<nicht vorhanden>.webp` liefert 404.
- Mit `X-Forwarded-For: 203.0.113.x` erkennt der Limiter die IP und zählt mit. Geprüft wurde das über einen temporären Diagnose-Header, der danach wieder entfernt wurde.
- Bei 305 Anfragen mit 12 parallel kamen 299 × 404 und **6 × 504**. Das Backend brauchte unter dieser Last also länger als 8 s, und der neue Timeout hat gegriffen.
- Eine 429 wurde live bewusst **nicht** erzwungen. Dafür wären über 300 Backoffice-Abrufe pro Minute nötig, und das Backoffice ist produktiv. Die 429 ist per Unit-Test belegt.
- Screenshots (`qa-screenshots/teamleiter/r4-R4-plattform-ci/selbst/`): `/de/produkte` und `/api/shop-search?q=minotti` zeigen auf iPhone, Android, iPad und Desktop jeweils 200, 0 Konsolenfehler, 0 fehlgeschlagene Requests und keinen horizontalen Überlauf. Die leeren Kacheln weiter unten im Ganzseiten-Shot sind Lazy-Load-Platzhalter mit lokalen Bildern, nicht `/cmx`.

## Dateien

- geändert: `src/app/cmx/[...path]/route.js`, `src/app/api/shop-search/route.js`, `eslint.config.mjs`
- neu: `src/app/cmx/_lib/routeLimit.js`, `src/app/cmx/_lib/upstream.js` (privater Ordner, keine Route)
- neu: `.github/workflows/ci.yml`, `scripts/deploy.sh`, `tools/ci/bundle-budget.mjs`, `tools/ci/perf-gate.mjs`
- neu: `tests/unit/r4-ci-ratelimit.test.mjs`, `tests/unit/r4-ci-bundle-budget.test.mjs`, `tests/unit/r4-ci-pipeline.test.mjs`
- Berichte: `qa-screenshots/teamleiter/r4-ci/bundle-budget.*`, `qa-screenshots/teamleiter/r4-R4-plattform-ci/selbst/`

## Anfragen an andere Pakete

**An R4-release (`package.json`, `next.config.js`):**
1. npm-Skripte ergänzen:
   - `"ci:bundle": "node tools/ci/bundle-budget.mjs"`
   - `"ci:perf-gate": "node tools/ci/perf-gate.mjs"`
   - `"deploy": "bash scripts/deploy.sh deploy"`
   - `"deploy:rollback": "bash scripts/deploy.sh rollback"`
2. **Wichtig:** In `next.config.js` setzt die Regel „Cache static images for 1 year“ `Cache-Control: public, max-age=31536000, immutable` auch auf `/cmx/files/*.webp|jpg…`. Next übernimmt Header aus der Route nur, wenn die Config sie nicht schon gesetzt hat (`send-response.js`: „only append the header if it is … not present“). Deshalb werden auch **404, 429, 502 und 504** von `/cmx` ein Jahr gecacht. Das war schon vorher so.
   - Vorschlag: `/cmx/` aus der Regel nehmen, z. B. mit `source: "/((?!cmx/).*)\\.(jpg|…)"`. Die Route setzt bei 200 selbst `immutable` und bei Fehlern `no-store`.

**An INT bzw. den Betrieb:**
1. `ecosystem.config.js`: `cwd` setzen oder ab dem ersten Deploy `shared/ecosystem.deploy.cjs` verwenden.
2. nginx muss `X-Forwarded-For $proxy_add_x_forwarded_for` setzen. Fehlt der Header, sieht jede Anfrage wie Loopback aus, und das Limit greift nicht (fail-open).
3. Laufen mehrere Instanzen, den geteilten Speicher anschließen.
4. CI: die Repo-Variable `SERVER` setzen und prüfen, ob GitHub-Runner das Backoffice erreichen.
5. Die ESLint-Regeln nach dem Abbau der 11 Warnungen auf „error“ stellen.

## Offene Punkte

1. 85 Seiten liegen über 190 KiB (≥ 210 KiB gz), durch die Baseline eingefroren, nicht mehr rot. Zuständig: R4-shell-perf und die Labs.
2. Der 8-s-Timeout hat unter Parallel-Last 6 × 504 ausgelöst. Das Backoffice ist bei 404-Abrufen langsam. Bei echten Bildern beobachten (Uptime-Check auf `/cmx`).
3. Die Cache-Control-Kollision bei `/cmx`-Fehlern (siehe oben) kann nur R4-release in `next.config.js` beheben.
4. `deploy.sh` ist ungetestet auf einem echten Server. Erster Lauf mit `DRY_RUN=1`, danach auf Staging.
