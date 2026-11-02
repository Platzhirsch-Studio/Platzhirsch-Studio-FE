# Lokaler PageSpeed-Test

Misst die Seite wie Google PageSpeed Insights (Lighthouse 13.5.0, mobil und Desktop), aber gegen einen lokalen Produktions-Build. Das Gate für den Livegang bleibt `tools/qa/perf.mjs` mit echter Drosselung (LCP p75 ≤ 2,0 s, Inhaber-Entscheidung Nr. 16). Dieser Test zeigt die PageSpeed-Sicht dazu.

**Nie gegen den Dev-Server messen** (`npm run dev`, Port 3000). Dort ist der Code nicht minifiziert und HMR läuft mit, die Zahlen sagen also nichts. Das Skript erkennt einen Dev-Server und bricht dann ab.

## Einstellungen (wie PageSpeed Insights)

| | mobil | Desktop |
|---|---|---|
| Gerät | Moto G Power, 412 × 823, DPR 1,75 | 1350 × 940, DPR 1 |
| Netz (simuliert) | 150 ms RTT, 1,6 Mbit/s („langsames 4G“) | 40 ms RTT, 10 Mbit/s |
| CPU | 4× gebremst | 1× |
| Läufe | 3 je Route, gewertet wird der Median-Lauf | 3 je Route |

Jeder Lauf wird gegen diese Werte geprüft. Weicht einer ab, bricht das Skript ab.

## Ablauf

1. **Prod-Build in der Prüfkopie** (nicht im Repo, dort läuft der Dev-Server):
   ```powershell
   robocopy C:\Users\admin.local\Documents\Platzhirsch-Studio-Website C:\Users\admin.local\Documents\platzhirsch-prodtest /MIR /XD node_modules .next .git qa-screenshots Herstellermaterial .data /XF *.log
   cd C:\Users\admin.local\Documents\platzhirsch-prodtest
   $env:SERVER="https://backoffice.platzhirsch.studio"; npx next build
   ```
   Wenn sich `package-lock.json` geändert hat, vorher `npm ci` in der Prüfkopie ausführen.
2. **Server starten:** `npx next start -p 3100` (in der Prüfkopie, eigenes Fenster).
3. **Messen** (im Repo):
   ```powershell
   npm run pagespeed                          # 6 Standard-Routen, mobil + Desktop, je 3 Läufe
   npm run pagespeed -- /de/produkte /de/kontakt
   npm run pagespeed -- --mobile-only --runs=5
   npm run pagespeed -- --base=http://localhost:3101
   npm run pagespeed:ci                       # Budgets aus lighthouserc.json, Exit-Code 1 bei Verstoß
   ```
   In Git Bash vorher `export MSYS_NO_PATHCONV=1` setzen. Das Skript repariert umgeschriebene Pfade wie `C:/Program Files/Git/de` aber auch selbst.
4. **Berichte öffnen:** `qa-screenshots/pagespeed/<JJJJ-MM-TT_HHMM>/`
   - `<route>.<mobile|desktop>.<lauf>.report.html` ist der normale Lighthouse-Bericht. Im Browser öffnen.
   - `summary.json` enthält Median und Einzelläufe je Route und Gerät, dazu die verwendeten Einstellungen.
   - In der Konsole steht eine Tabelle mit Perf, A11y, BP, SEO, FCP, LCP, TBT, CLS und SI.
5. **Server beenden** (Port 3100 freigeben).

## Budgets (`lighthouserc.json`, nur mobil)

- **Performance:** je Route mindestens der Wert vom 30.10.2026 (T7-Messung) minus 3 Punkte. Das ist die Regressionsbremse. Steigt der Wert dauerhaft, wird die Grenze nachgezogen.
- **Accessibility, Best Practices, SEO:** 100.
- **CLS ≤ 0,1** (harte Grenze laut Design-Bibel §13): Fehler.
- **LCP ≤ 2,0 s und TBT ≤ 200 ms** (Zielwerte aus Nr. 16 bzw. Bibel §13): nur Warnung. Die Lantern-Schätzung von Lighthouse liegt heute bei 4–5 s. Maßgeblich bleibt `perf.mjs`.

Gesammelt wird mit demselben Lighthouse 13.5.0 wie bei `npm run pagespeed`. Danach prüft `lhci assert` (Lighthouse CI 0.15.1) die gespeicherten Berichte aus `qa-screenshots/pagespeed/<datum>/lhci/`.

## Weitere Werkzeuge

- `node tools/qa/perf.mjs --base=http://localhost:3100 --runs=5`: das Gate mit echter Drosselung (Pixel 7).
- `node tools/qa/jsbytes.mjs [--strict]`: JS im Server-HTML je Route (gzip). Skripte mit `noModule` zählen nicht mit, moderne Browser laden sie nicht. Mit `--strict` endet das Skript mit Fehler, sobald three.js in einem Chunk des ersten Ladens steckt.
- Werte schwanken je nach Last der Maschine: LCP um etwa ±0,4 s, TBT um etwa ±150 ms. Nicht parallel zu Playwright oder Builds messen. Der benchmarkIndex steht in `summary.json`.
