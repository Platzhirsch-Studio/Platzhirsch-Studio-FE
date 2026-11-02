# 16 – Technik, Betrieb und DevOps: Vorgaben für den Neuauftritt

Rolle: Techniker für Betrieb und DevOps. Stand: 26.10.2026.
Grundlage: `ecosystem.config.js`, `next.config.js`, `src/proxy.js`, `src/app/api/*`, `src/app/cmx/[...path]/route.js`, `src/lib/revalidateAuth.js`, die lokale Next-16-Doku (`node_modules/next/dist/docs/01-app/02-guides/self-hosting.md`, `cdn-caching.md`, `content-security-policy.md`), außerdem `digital/13` (Performance und Engineering), `digital/14` (Recht) und `23-masterkonzept.md` Abschnitt 4. Die Features F1–F5 aus `digital/13` setze ich voraus und schreibe sie hier nicht ab. Dieses Dokument legt fest, **wie der Neuauftritt betrieben, ausgerollt, überwacht und abgesichert wird**.

Die Positionierung verlangt das ausdrücklich. Der Satz „liefern zum Festpreis … und sichern Ihre Anzahlung ab“ (Masterkonzept 4.1) ist ein Vertrauensversprechen. Wenn eine Website nicht erreichbar ist, ein Formular stumm Anfragen verliert oder der Browser beim Kunden ein Zertifikat als ungültig meldet, bricht dieses Versprechen schon vor dem ersten Gespräch. Im Luxussegment ist Zuverlässigkeit Teil der Marke.

---

## Ist-Zustand Betrieb (kurz, gemessen und im Code gelesen)

| Bereich | Befund | Fundstelle |
|---|---|---|
| Hosting | 1 Server, nginx 1.18 → PM2 `fork`, **1 Instanz**, `next start` auf Port 3000, `max_memory_restart: 1G`, `restart_delay: 1000` | `ecosystem.config.js` |
| Logs | `/var/log/Platzhirsch-Studio-Website-{out,error}.log`, **ohne Rotation** | `ecosystem.config.js` |
| Git-Host | Selbst gehostet unter `http://10.30.70.200:3000/Platzhirsch-Studio/...` (Gitea-Muster). Die Verbindung läuft über **HTTP ohne TLS**. Es gibt kein `.github/` und keine `.gitea/workflows` | `git remote -v` |
| CI/Tests | Es gibt nur `npm run lint`. Tests, Build-Prüfung und Budget fehlen | `package.json` |
| Deploy und Rollback | Nicht dokumentiert. Läuft der Build im selben Ordner wie die Live-Seite, ist die Seite während `next build` gestört | – |
| CDN | Keins. Bilder liefert `/_next/image` vom selben Server aus (AVIF und WebP, `minimumCacheTTL` 30 Tage) | `next.config.js` |
| Caching | Die Regel `/(.*)\.(jpg|…|svg|woff2…)` setzt `immutable` für 1 Jahr. Sie greift auch für **ungehashte** Dateien in `public/`, die Regel `/(.*)\.(js|css)` ebenso. Ein ausgetauschtes Logo oder Hero-Bild bleibt deshalb bis zu 1 Jahr veraltet im Browser und im CDN | `next.config.js` Z. 46–70 |
| Security-Header | HSTS preload, nosniff, XFO DENY, Referrer-Policy und Permissions-Policy sind gesetzt. **Es fehlt eine CSP.** `X-XSS-Protection` ist veraltet. `dangerouslyAllowSVG: true` ist ohne `images.contentSecurityPolicy` gesetzt | `next.config.js` |
| Proxy-Endpunkte | `/api/image?path=` ist ein offener Tunnel ins Backoffice (digital/13, B2) und steht in `robots.txt` noch auf `Allow` (live geprüft). `/cmx` ist gut gebaut: Allowlist, Timeout, SVG-Sandbox | `src/app/api/image/route.js`, `src/app/robots.js` |
| Formulare | Kein Rate-Limit, Honeypot nur beim Newsletter, kein Timeout zum Backoffice | `src/app/api/{kontakt,beratung_anfrage,anfrage_produkt}` |
| Webhooks | Gut: `X-Revalidate-Secret` wird mit `timingSafeEqual` verglichen, die API `revalidateTag(tag, { expire: 0 })` ist korrekt | `src/lib/revalidateAuth.js` |
| Monitoring | Kein Fehler-Tracking, keine RUM-Messung, kein Uptime-Check | – |
| Prototypen | `/de/preview/galerie` und `/de/preview/buehne` antworten mit 200 und haben `<meta name="robots" content="noindex, nofollow">`. `/de/preview/dreilaendereck` antwortet noch mit **404**. Die Prototypen liegen **im Produktions-Code-Baum**: Mit dem nächsten Deploy wären sie öffentlich, nur durch das Meta-Tag geschützt, und ihr JS und CSS liefe im selben Build wie die Live-Seite | `src/app/[locale]/preview/*` |

---

## 1. Die wichtigsten Erkenntnisse für dieses Projekt

1. **Geschwindigkeit wirkt im Luxussegment direkt aufs Engagement.** In der Studie „Milliseconds Make Millions“ (Deloitte/55 im Auftrag von Google, 37 Marken, über 30 Mio. Sessions) brachten 0,1 s schnellere mobile Ladezeit bei **Luxusmarken +8,6 % Seitenaufrufe pro Session**. Im Retail stieg die Conversion um 8,4 %, bei Lead-Generierung sank die Absprungrate auf Infoseiten um 8,3 %. Platzhirsch ist beides, Luxus und Lead-Generierung. Quellen: [web.dev Case Study](https://web.dev/case-studies/milliseconds-make-millions), [Deloitte](https://www.deloitte.com/ie/en/services/consulting/research/milliseconds-make-millions.html). Für den Betrieb heißt das: Jede Ladezeit, die Server, CDN oder Bildauslieferung verursachen, kostet Anfragen. Der Betrieb gehört deshalb zur Conversion-Arbeit.

2. **Google bewertet Felddaten (p75), keine Laborwerte.** Die Schwellen für „gut“ sind LCP ≤ 2,5 s, INP ≤ 200 ms und CLS ≤ 0,1, jeweils am 75. Perzentil echter Nutzer ([web.dev/articles/vitals](https://web.dev/articles/vitals)). Ohne eigene RUM-Messung sieht das Team erst nach 28 Tagen in CrUX oder der Search Console, dass ein Release geschadet hat. Für einen Shop mit 1.765 × 4 URLs und kleinem Traffic kommt CrUX auf vielen URLs gar nicht zustande. Eigene RUM-Daten sind deshalb Pflicht.

3. **Self-Hosting mit `next start` hinter nginx ist der offizielle Weg, aber nur mit Reverse Proxy.** Die Next-Doku verlangt den Reverse Proxy ausdrücklich für „malformed requests, slow connection attacks, payload size limits, rate limiting“ (`self-hosting.md`, Abschnitt „Reverse Proxy“). Rate-Limits und Body-Größen gehören also zuerst in nginx und erst danach in die Route.

4. **Ein CDN vor Next.js funktioniert nur, wenn es `Vary: rsc` bzw. `_rsc` respektiert.** Die Doku (`cdn-caching.md`) sagt: Der `rsc`-Header muss durchgereicht und `_rsc` im Cache-Key behalten werden. Sonst bekommt ein Browser HTML statt RSC-Payload, und die Client-Navigation bricht. Ein `revalidateTag()` invalidiert außerdem **nur den Next-Cache, nicht das CDN**, deshalb gehört zum Webhook ein CDN-Purge. Vorgabe daraus: Das CDN cacht anfangs **nur gehashte Assets und Bilder**, HTML erst später und kontrolliert.

5. **Nonce-basierte CSP und statisches Rendering schließen sich in Next 16 aus.** Nonces erzwingen dynamisches Rendern (`content-security-policy.md`). Weil statisches Rendering und ISR (digital/13 F1) die Basis für TTFB und bfcache sind, bekommt der Neuauftritt eine **Hash- bzw. Allowlist-CSP ohne Nonce**. Sie startet 14 Tage als `Report-Only`.

6. **Ein kleines Team braucht wenige, häufige und automatisch geprüfte Releases.** Die DORA-Forschung misst Lieferleistung mit Deployment-Frequenz, Lead Time, Change-Failure-Rate und Wiederherstellungszeit (seit 2024 zusätzlich „Rework Rate“). Kleine, häufige Releases mit automatischen Tests haben weniger Ausfälle, und schnelles Zurückrollen wiegt mehr als der Versuch, nie einen Fehler zu machen ([dora.dev](https://dora.dev/guides/dora-metrics-four-keys/), Zusammenfassung des Reports 2024: [RDEL #68](https://rdel.substack.com/p/rdel-68-what-are-the-latest-benchmarks)). Bei 5 Personen ohne Vollzeit-Entwickler heißt das: **Rollback in unter 60 s per Befehl** statt Fehlersuche unter Druck.

7. **Bildauslieferung kostet hier am meisten.** Der Neuauftritt setzt auf großformatige Fotografie (digital/01, 02, 12). Heute rechnet der eine Server alle AVIF-Varianten selbst (sharp). Bei Kaltstart oder Cache-Verlust kostet das CPU und RAM und erzeugt LCP-Spitzen. Laut `self-hosting.md` kann sharp auf glibc-Linux viel Speicher brauchen. Ein Pull-CDN vor `/_next/image` und `/_next/static` kostet in Europa bei bunny.net etwa **0,01 USD/GB** (Standard-Netz), bei mindestens 1 USD im Monat ([docs.bunny.net/cdn/pricing](https://docs.bunny.net/cdn/pricing)). Bei geschätzten 50–150 GB im Monat sind das **unter 2 USD im Monat**.

8. **Formular-Spam ist im Premium-Segment ein Geschäftsrisiko.** Jede Spam-Anfrage im Backoffice kostet Beratungszeit, und echte Anfragen gehen zwischen den Spam-Einträgen unter. Die OWASP Automated Threats ([OAT-019 Account Creation / OAT-017 Spamming](https://owasp.org/www-project-automated-threats-to-web-applications/)) und das OWASP API Security Top 10 ([API4:2023 Unrestricted Resource Consumption](https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/)) empfehlen mehrere Schutzschichten: Rate-Limit, Größenlimits, Timeouts, Bot-Signale. **Ein sichtbares Captcha ist das letzte Mittel.** Es kostet Conversion und braucht oft eine Drittlandübertragung (digital/14 F13).

9. **Ein Backup zählt erst, wenn die Wiederherstellung getestet ist.** Die 3-2-1-Regel (3 Kopien, 2 Medien, 1 extern) empfehlen BSI und CISA ([BSI Datensicherung](https://www.bsi.bund.de/DE/Themen/Verbraucherinnen-und-Verbraucher/Informationen-und-Empfehlungen/Cyber-Sicherheitsempfehlungen/Daten-sichern-verschluesseln-und-loeschen/Datensicherung/datensicherung_node.html), [CISA](https://www.cisa.gov/sites/default/files/publications/data_backup_options.pdf)). Für die Website selbst ist der Code in Git das Backup. Kritisch sind **Backoffice-Datenbank, `/files` (Produktbilder), `.env` mit den Secrets und die nginx-Konfiguration.**

10. **Prototypen gehören nicht in den Produktions-Build.** Liegen sie im selben Build, zählt ihr JS gegen die Budgets der Live-Seite, ihre Abhängigkeiten (z. B. `three`, `lenis`) können in geteilte Chunks rutschen, und ein `noindex`-Meta schützt nicht vor Verlinkung, Leaks oder Wettbewerbern, die mitlesen. Ein Prototyp verrät die künftige Positionierung, bevor sie live ist.

---

## 2. Konkrete Vorgaben für den Neuauftritt (messbar, umsetzbar)

### 2.1 Hosting und Prozessmodell

| # | Vorgabe | Wert / Umsetzung | Messung |
|---|---|---|---|
| H1 | Release-Ordner statt In-Place-Build | `/srv/platzhirsch/releases/<git-sha>/`, Symlink `/srv/platzhirsch/current` → aktives Release, `.next/cache` als gemeinsamer Ordner `shared/next-cache` (ISR- und Bild-Cache überleben ein Deploy) | `ls -l current` zeigt den SHA, Deploy-Log |
| H2 | Gebaut wird in CI, nicht auf dem Live-Server | CI erzeugt `output: "standalone"` + `.next/static` + `public` als Tarball und lädt ihn per `rsync` über SSH-Deploy-Key hoch. Der Live-Server führt **nie** `npm install` oder `next build` aus | Server-CPU während Deploy < 30 % |
| H3 | PM2 ohne Ausfall beim Reload | `exec_mode: 'cluster'`, `instances: 2`, `pm2 reload` statt `restart`, `kill_timeout: 15000` (Doku: Drain 10–30 s), `listen_timeout: 10000`, `wait_ready` nur mit eigenem Ready-Signal | Uptime-Check alle 30 s während Deploy: 0 Fehler |
| H4 | Bei 2 Instanzen | `deploymentId: process.env.DEPLOYMENT_VERSION` (= Git-SHA) gegen Version-Skew, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` fest in `.env.production` (`self-hosting.md` „Multi-Server“). Der ISR-Cache liegt auf derselben Platte (gemeinsamer `next-cache`). Reicht das nicht, bleibt es bei **1 Instanz + `pm2 reload`** (kurze Lücke) | Nach Deploy kein „ChunkLoadError“ in Sentry/GlitchTip |
| H5 | Speicher | `max_memory_restart: '900M'` pro Instanz, Server ≥ 4 GB RAM, `NODE_OPTIONS=--max-old-space-size=768`. sharp mit `MALLOC_ARENA_MAX=2` (Empfehlung sharp, glibc) | PM2-Restarts wegen RAM: 0 pro Woche |
| H6 | Logs | `pm2 install pm2-logrotate`, `max_size 20M`, `retain 14`, `compress true`. **Keine Formular-Inhalte, keine E-Mail-Adressen ins Log** (DSGVO, digital/14) | `grep -c "@" error.log` = 0 |
| H7 | nginx | Upgrade von 1.18 (Ubuntu 20.04, Standard-Support beendet) auf eine aktuelle Mainline/Stable. Brotli oder zstd aktivieren, HTTP/2 einschalten, HTTP/3 optional. `client_max_body_size 64k` für `/api/*`, `proxy_read_timeout 30s`, `X-Forwarded-For` und `X-Real-IP` setzen | `curl -sI -H 'Accept-Encoding: br'` zeigt `content-encoding: br` |
| H8 | TLS | Nur TLS 1.2 und 1.3, OCSP-Stapling, HSTS bleibt. **SSL-Labs-Note A+**. Das Zertifikat erneuert sich automatisch (certbot-Timer), Alarm 14 Tage vor Ablauf | ssllabs.com, Uptime-Monitor „Zertifikat“ |
| H9 | Git-Host | Der Git-Server `10.30.70.200:3000` wird nur im LAN/VPN und über HTTPS oder SSH genutzt, mit 2FA für alle Konten. Branch-Schutz auf `main`: Merge nur bei grüner CI | Gitea-Einstellungen |

### 2.2 CDN und Bildauslieferung

| # | Vorgabe | Wert |
|---|---|---|
| C1 | Pull-CDN (bunny.net mit Edge-Standort Frankfurt/Wien/Zürich, alternativ Cloudflare Free mit DSGVO-Prüfung) **zuerst nur** für `/_next/static/*`, `/_next/image*`, `/cmx/files/*`, `/fonts/*` | Cache-Key **mit** Query-String (`/_next/image?url=…&w=…&q=…`!), `Accept` als Variante (AVIF/WebP) |
| C2 | HTML erst nach F1 (statisch/ISR) über das CDN, und nur wenn das CDN `Vary: rsc` bzw. `_rsc` im Key unterstützt **und** der Revalidate-Webhook zusätzlich die CDN-Purge-API aufruft (HTML- und RSC-Varianten) | Test: Client-Navigation auf 10 Seiten ohne vollen Reload |
| C3 | Ungehashte Dateien in `public/` | `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` statt 1 Jahr `immutable`. Neue Markenbilder bekommen einen Hash oder eine Version im Dateinamen (`hero-lochau.v3.avif`) |
| C4 | Bild-Varianten begrenzen | `deviceSizes: [640, 828, 1080, 1440, 1920, 2560]`, `imageSizes: [96, 256, 384]`, `qualities: [60, 75, 85]` (kein 100). Das senkt die Zahl der möglichen Varianten und damit CPU-Last und Missbrauch („image bombing“) |
| C5 | `images.minimumCacheTTL` | 30 Tage bleiben. `images.contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"` und `contentDispositionType: "attachment"` (wegen `dangerouslyAllowSVG`) |
| C6 | Hero/LCP-Bild | Mobil ≤ 120 KB AVIF, Desktop ≤ 250 KB, `fetchPriority="high"`, im CDN vorgewärmt: Nach jedem Deploy ruft ein Skript die 20 wichtigsten Hero-URLs in allen `w`-Stufen einmal auf |
| C7 | Video (Motion-Konzept digital/02) | Kein Video über `/_next/image`. Eigene Dateien in AV1 + H.264 als Fallback, ≤ 2,5 MB für einen 8-s-Loop, `preload="none"` + Poster, Auslieferung über CDN mit `Accept-Ranges` |
| C8 | Remote-Bildquellen | `remotePatterns` nur `backoffice.platzhirsch.studio`. `images.unsplash.com`, `www.next125.com`, `www.treca-paris.com` streichen (Bildrechte, digital/14 F3; außerdem lassen diese Hosts den Server fremde Bilder rechnen) |

### 2.3 Caching (Ziel-Header)

| Ressource | Ziel-Header | Ort |
|---|---|---|
| `/_next/static/*` | `public, max-age=31536000, immutable` (setzt Next selbst) | Next/CDN |
| `/_next/image` | `public, max-age=2592000, must-revalidate` | Next/CDN |
| HTML statisch/ISR | `s-maxage=3600, stale-while-revalidate=…` (Next), im Browser `no-cache` | Next |
| HTML Prototypen/Staging | `private, no-store` + `X-Robots-Tag: noindex, nofollow` | nginx Staging |
| `/api/*` | `no-store` | Route |
| `sitemap*.xml`, `robots.txt`, `llms.txt` | `public, max-age=3600` | Route |
| 404/500 | **nie** länger als 60 s im CDN | CDN-Regel |

### 2.4 Monitoring (RUM, Fehler, Uptime, Leads)

| # | Was | Werkzeug | Schwelle / Alarm |
|---|---|---|---|
| M1 | Uptime | Uptime Kuma (selbst gehostet, **nicht** auf dem Web-Server selbst) oder Better Stack Free. Checks alle 60 s: `/de`, `/de/produkte`, 1 Produktseite, `/de/kontakt`, Backoffice `/api/method/ping`, TLS-Ablauf | 2 Fehler in Folge → E-Mail + Telegram/Signal an 2 Personen |
| M2 | Synthetischer Formular-Test | Täglich 07:00 ein Playwright-Lauf gegen Produktion mit Testmarker `X-Test-Lead: 1`. Das Backoffice verwirft ihn oder markiert ihn als Test | Fehlt der Lead → Alarm. **Ein verlorenes Formular wiegt schwerer als ein langsames.** |
| M3 | Fehler | GlitchTip (selbst gehostet, Sentry-kompatibel) oder Sentry EU (Frankfurt), über `instrumentation.js` (`onRequestError`) + `instrumentation-client.js`. Nur Fehler, **kein Session Replay**, IP gekürzt | > 20 neue Fehler/h oder 1 neuer Fehlertyp in `/api/*` → Alarm |
| M4 | RUM Core Web Vitals | `useReportWebVitals` (`next/web-vitals`, 0 Zusatzpaket) → GA4-Event `web_vitals` über `src/lib/analytics.js` (nur nach Consent). Zusätzlich `navigator.sendBeacon` an einen eigenen Endpunkt `/api/rum`, der **nur** Name, Wert, Seitentyp und Gerätetyp ohne IP speichert. Damit gibt es Daten auch ohne Consent, auf Basis berechtigten Interesses, in der Datenschutzerklärung beschrieben (mit Recht klären, digital/14) | Wochenbericht p75: LCP ≤ 2,0 s, INP ≤ 150 ms, CLS ≤ 0,05 je Seitentyp. Ein Release verschlechtert p75-LCP um > 300 ms → Ticket |
| M5 | Server | `node_exporter` + Netdata Cloud Free **oder** einfaches PM2 `pm2 monit` + Uptime Kuma „Push“ | CPU > 85 % für 5 min, RAM > 90 %, Platte > 80 % |
| M6 | SEO-Technik | Search Console: Abdeckungsfehler, Soft-404, CWV-Bericht monatlich. `unlighthouse` über die Sitemap monatlich | neue 5xx/404 > 10 → Ticket |
| M7 | Lead-Kennzahl im Monitoring | Anzahl `generate_lead`-Events pro Tag (GA4) + Anzahl neuer Anfragen im Backoffice | Abweichung > 50 % zwischen beiden = technisches Problem |

### 2.5 Backups und Wiederherstellung

| # | Was | Wie oft | Wohin | Aufbewahrung |
|---|---|---|---|---|
| B1 | Backoffice-DB (Frappe/MariaDB, `bench backup --with-files`) | täglich 02:00 | verschlüsselt (restic oder borg) auf Hetzner Storage Box o. ä. **in der EU** + wöchentlich auf das NAS im Studio | 14 täglich, 8 wöchentlich, 12 monatlich |
| B2 | `/files` (Produktbilder, Herstellermaterial) | täglich inkrementell | wie B1 | wie B1 |
| B3 | `.env.production`, nginx-Konfiguration, `ecosystem.config.js`, certbot-Konfiguration | bei jeder Änderung | Passwort-Manager (Secrets) + verschlüsseltes Repo `infra` | Versionen |
| B4 | Website-Code | – | Git (+ Spiegel auf einen zweiten Host, z. B. privates Repo extern) | – |
| B5 | Server-Snapshot | wöchentlich + vor jedem Major-Upgrade | Snapshot beim Hoster | 4 |

Wiederherstellung: **RPO ≤ 24 h, RTO ≤ 4 h** für Website + Backoffice. **Einmal pro Quartal** wird auf einem frischen Server oder in Staging wiederhergestellt und das protokolliert (Dauer, Probleme). Ein Backup ohne getestete Wiederherstellung zählt nicht.

### 2.6 Staging für die Prototypen

| # | Vorgabe |
|---|---|
| S1 | Eigene Subdomain `staging.platzhirsch.studio` (später `vorschau.`). Eigene PM2-App `Platzhirsch-Staging` auf Port 3001, eigener Release-Ordner, **eigene** `.env.staging` (eigener `REVALIDATE_SECRET`, Formulare zeigen auf eine Test-Doctype oder auf eine Mock-Route, damit **keine Test-Leads im echten Postfach** landen) |
| S2 | Zugang mit HTTP Basic Auth in nginx **oder** IP-Allowlist (Studio + VPN). Zusätzlich `X-Robots-Tag: noindex, nofollow, noarchive` als Header für alles. `robots.txt` auf Staging: `Disallow: /`, weil Basic Auth ohnehin vorgeschaltet ist |
| S3 | Für jeden Branch `preview/*` eine eigene Vorschau unter `staging.platzhirsch.studio/<branch>/` oder `<branch>.staging…` (Wildcard-Zertifikat). Die CI baut und deployt automatisch und schreibt den Link als Kommentar in den Pull Request |
| S4 | Die Prototypen `src/app/[locale]/preview/{galerie,buehne,dreilaendereck}` werden **vor dem nächsten Produktions-Deploy** über einen Build-Schalter ausgeschlossen. Entweder liegen sie auf einem eigenen Branch, oder der Proxy liefert in Produktion 404 (`if (process.env.SITE_ENV === "production" && /\/preview(\/|$)/.test(pathname)) return 404`). Der Code in `src/` wird hier nicht geändert, das ist eine Vorgabe für die Umsetzung |
| S5 | Vergleichbarkeit: Alle drei Prototypen laufen auf **derselben** Staging-Maschine, im Produktionsmodus (`next build && next start`, nicht `next dev`) und mit denselben Bildern über dasselbe CDN-Setup. Gemessen wird mit Lighthouse CI (3 Läufe, Median) und WebPageTest (Moto G Power, 4G, Standort Frankfurt). Der Dev-Server-Wert (Galerie heute 3,5 s TTFB beim ersten Compile) sagt **nichts** aus |

### 2.7 CI mit Lint, Build und Tests (Gitea Actions, GitHub-Actions-kompatibel)

Pipeline `.gitea/workflows/ci.yml`. Sie läuft auf jedem Push und PR, auf `act_runner` auf dem Windows-PC oder einer kleinen Linux-VM.

| Stufe | Inhalt | Abbruch bei | Ziel-Dauer |
|---|---|---|---|
| 1 install | `npm ci` mit Cache | – | ≤ 60 s |
| 2 lint | `eslint .` (+ `jsx-a11y`), `knip` (tote Dateien) | Fehler | ≤ 45 s |
| 3 claims | Wortliste gegen Händler-Behauptungen in `src/messages/*.json`, `llms.txt`, Regionsseiten („offizieller Händler“, „autorisierter Händler“, „Premium Dealer“, „Vertragshändler“), siehe digital/14 F2 | Treffer | ≤ 5 s |
| 4 unit | `vitest` für Formular-Schemas, Slugs, Routing-Tabellen, Redirect-Tabelle | Fehler | ≤ 60 s |
| 5 build | `next build` mit `output: "standalone"`, Build-Cache (`ci-build-caching.md`). **Die Route-Tabelle muss Kernseiten als ○ oder ● zeigen**, ein Skript prüft `.next/prerender-manifest.json` auf `/de`, `/de/produkte`, Marken- und Regionsseiten | ƒ bei Kernseiten | ≤ 6 min |
| 6 e2e | Playwright (15–20 Smoke-Tests, Backoffice gemockt) + `@axe-core/playwright` auf 10 Seiten | Fehler, axe „serious/critical“ | ≤ 5 min |
| 7 budget | `@lhci/cli` mobil (LCP ≤ 2,5 s, TBT ≤ 200 ms, CLS ≤ 0,1, A11y ≥ 95) auf 5 URLs, `size-limit` (JS initial ≤ 170 KB gz pro Route) | Grenzwert gerissen | ≤ 4 min |
| 8 headers | `curl`-Test gegen `next start`: CSP vorhanden, kein `X-Powered-By`, `/api/image` = 404, Prototypen in Prod-Build = 404, `robots.txt` ohne `/api/image` | Abweichung | ≤ 10 s |
| 9 deploy | nur `main`: Staging automatisch; Produktion **manuell** per Freigabe-Button | – | ≤ 2 min |

Gesamtdauer der Pipeline: **≤ 15 min**. Sicherheits-Updates kommen über Renovate (selbst gehostet oder als Gitea-App), wöchentlich und gebündelt. `npm audit --omit=dev --audit-level=high` bricht ab.

### 2.8 Sicherer Deploy und Rollback

```
deploy.sh <sha>
  1. Tarball nach releases/<sha>/ entpacken, Symlinks shared/.env.production und shared/next-cache setzen
  2. Smoke-Test gegen das neue Release auf Port 3100 (curl /de, /de/produkte, 1 Produkt, /api/health): alle 200 in < 1.500 ms
  3. ln -sfn releases/<sha> current  &&  pm2 reload ecosystem.config.js --update-env
  4. 60 s Nachkontrolle: Uptime + Fehlerquote; > 2 % 5xx → automatisch rollback.sh
  5. CDN-Purge nur für HTML/RSC (Assets sind gehasht)
rollback.sh
  ln -sfn releases/<vorheriger-sha> current && pm2 reload …   (Ziel: < 60 s)
```

- Es bleiben **5 Releases** auf dem Server.
- Deploy-Fenster: **Mo–Do 08–16 Uhr**. Kein Deploy am Freitagnachmittag, am Samstag (Hauptbesuchstag im Studio) oder während einer laufenden Ads-Kampagne ohne Bereitschaft.
- Datenbank-Änderungen im Backoffice sind getrennt von Website-Deploys und rückwärtskompatibel (zuerst erweitern, später entfernen).
- Neue große Features (3D, Konfigurator, KI) gehen hinter ein Feature-Flag (Umgebungsvariable), damit man sie ohne Rollback abschalten kann.
- Ein Endpunkt `/api/health` liefert `{ ok, sha, backoffice: "ok|slow|down" }` ohne Secrets. Er dient Uptime-Check und Deploy-Skript.

### 2.9 Sicherheit

| # | Vorgabe | Wert |
|---|---|---|
| X1 | `/api/image` löschen, `Allow: /api/image` aus `robots.js` entfernen | Tag 1 (digital/13 F3.1) |
| X2 | CSP (14 Tage `Report-Only`, dann scharf) | `default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://backoffice.platzhirsch.studio https://*.google-analytics.com https://www.googletagmanager.com; font-src 'self'; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://<glitchtip-host>; media-src 'self' https://<cdn-host>; frame-src https://www.google.com https://www.youtube-nocookie.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; report-to csp` (+ `Reporting-Endpoints`). Jedes neue Drittskript braucht einen CSP-Eintrag per PR |
| X3 | Header aufräumen | `X-XSS-Protection` entfernen. Neu: `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-site` (für `/_next/static`, nicht für Bilder, die Pinterest/Meta abrufen sollen). Ziel ist **Mozilla HTTP Observatory ≥ A** ([developer.mozilla.org/observatory](https://developer.mozilla.org/en-US/observatory)) und securityheaders.com A |
| X4 | Rate-Limits nginx (`limit_req_zone $binary_remote_addr`) | `/api/kontakt`, `/api/beratung_anfrage`, `/api/anfrage_produkt`, `/api/newsletter_subscribe`: **5 Anfragen/10 min pro IP, burst 3**, Antwort 429 mit freundlichem Text. `/api/shop-search`: 30/min. `/_next/image`: 120/min. `/revalidate/*`: 10/min und nur von der Backoffice-IP (`allow`/`deny`) |
| X5 | Formular-Spam (mehrschichtig, ohne Drittanbieter) | (1) Honeypot-Feld, das für Screenreader per `aria-hidden` und `tabindex=-1` versteckt ist. (2) Zeitfalle: abgeschickt < 3 s nach Render = verwerfen. (3) zod-Schema mit Längen (Name ≤ 100, Nachricht ≤ 5.000, Body ≤ 20 KB). (4) Links in der Nachricht > 3 → markieren statt verwerfen. (5) Erst wenn > 5 Spam/Woche durchkommen: **ALTCHA** (Proof-of-Work, selbst gehostet, unsichtbar). Bot-Antworten bekommen **dieselbe Erfolgsmeldung** wie echte (kein Hinweis für Bots), werden aber nicht ins Backoffice übernommen |
| X6 | Kein stiller Lead-Verlust | Ist das Backoffice nicht erreichbar (Timeout 8 s), schreibt die Route die Anfrage in eine lokale Warteschlange (`/srv/platzhirsch/shared/outbox/*.json`, verschlüsselt, ≤ 30 Tage) und schickt sie bis zu 6 Mal pro Stunde erneut. Der Nutzer bekommt eine Erfolgsmeldung, das Team einen Alarm |
| X7 | Secrets | `REVALIDATE_SECRET`, API-Keys und Backoffice-Tokens ≥ 32 Byte zufällig, alle 12 Monate rotiert, nur in `.env.*` auf dem Server und im Passwort-Manager, nie im Repo. `NEXT_PUBLIC_*` enthält nie ein Secret |
| X8 | Server-Härtung | SSH nur mit Schlüssel, `PermitRootLogin no`, fail2ban (sshd + nginx-429), `unattended-upgrades` für Sicherheits-Patches, Firewall: nur 80/443 öffentlich, 22 nur VPN/Studio-IP, Port 3000/3001 nur `127.0.0.1` |
| X9 | Abhängigkeiten | `npm audit` in CI. `next` innerhalb von 7 Tagen auf Sicherheits-Patches aktualisieren (Vorfall CVE-2025-29927 zur Middleware-Umgehung, März 2025, [GitHub Advisory](https://github.com/advisories/GHSA-f82v-jwr5-mffw)) |
| X10 | Uploads (z. B. künftig Raumfoto für den KI-Planer) | Nur serverseitig prüfen (MIME + Magic Bytes, ≤ 10 MB, EXIF entfernen), außerhalb von `public/` speichern, nach 30 Tagen löschen (digital/14 F14) |

### 2.10 Kosten (Richtwerte pro Monat, vor Bestellung prüfen)

| Posten | Variante „schlank“ | Variante „komfort“ |
|---|---|---|
| Web-Server (4 vCPU, 8 GB RAM, EU) | ca. 15–25 € | ca. 30–50 € (separater Staging-Server) |
| Staging | auf demselben Server, Port 3001: 0 € | eigener kleiner Server: ca. 5–10 € |
| CDN (bunny.net, ~100 GB EU) | ca. 1–2 USD | ca. 5 USD (inkl. Bild-Optimierer, falls `/_next/image` entlastet werden soll) |
| Backup-Speicher (1 TB EU) | ca. 4–5 € | ca. 10 € (zweiter Standort) |
| Uptime | Uptime Kuma auf dem Studio-PC/NAS: 0 € | Better Stack Free/Team |
| Fehler-Tracking | GlitchTip selbst gehostet (auf Staging): 0 € | Sentry Team EU, Preis laut Anbieter |
| CI-Runner | `act_runner` auf vorhandener Hardware: 0 € | – |
| **Summe** | **ca. 25–35 €/Monat** | **ca. 60–100 €/Monat** |

Zum Vergleich: Eine einzige verlorene Küchen- oder Wohnzimmer-Anfrage im fünfstelligen Bereich wiegt die Jahreskosten der Komfort-Variante auf. Vercel oder ähnliche Plattformen wären bequemer, erhöhen aber die Abhängigkeit, die Drittlandfragen (digital/14) und die Kosten für Bildoptimierung bei 1.765 Produkten × Varianten. **Empfehlung: Self-Hosting in der EU bleibt, mit CDN davor.**

---

## 3. Ideen, die die Konkurrenz alt aussehen lassen

1. **„Die schnellste Premium-Einrichtungs-Website im Dreiländereck“, öffentlich belegt.** Eine kleine Seite `/de/technik` (oder ein Absatz im Footer „Über diese Website“) zeigt die echten p75-Werte aus der eigenen RUM-Messung, monatlich automatisch aktualisiert. Beispiel: „LCP 1,6 s · 100 % erreichbar im Oktober · gehostet in der EU · keine Tracker ohne Ihre Zustimmung“. Diese Werte sind gemessen und nachprüfbar, also kein Marketing-Spruch. Höttges, reiter design, Dolce Vita, Fretz und Gamma veröffentlichen nichts Vergleichbares. Der Vergleich mit Wettbewerbern wird **nicht** auf der Seite gezeigt (UWG, vergleichende Werbung), nur die eigenen Zahlen.
2. **Sofortige Navigation.** Statische Seiten + CDN + Prefetch + View Transitions (digital/02). Der Wechsel zwischen Kategorie und Produkt fühlt sich mit TTFB vom CDN in < 50 ms wie in einer App an. Die Konkurrenz lädt bei jedem Klick neu.
3. **Kein verlorenes Formular, nie.** Mit Outbox und Wiederholversuch (X6) bekommt jede Anfrage auch bei Ausfall des Backoffice eine Bestätigung. Dazu kommt eine Bestätigungsmail mit Zeitangabe („Wir melden uns bis morgen 12:00 Uhr“), die die Antwortzusage aus dem CRM (digital/11) einlöst.
4. **Bilder in Studio-Qualität ohne Wartezeit.** Ein blur- oder LQIP-Platzhalter von maximal 300 Byte, AVIF über das CDN und vorgewärmte Hero-Bilder sorgen dafür, dass das Foto beim ersten Sichtkontakt scharf erscheint. Die Wettbewerber laden JPEGs mit mehreren Megabyte vom eigenen Server.
5. **Datenschutz als Qualitätsmerkmal.** EU-Hosting, selbst gehostetes Monitoring, kein Captcha von Drittanbietern, keine Drittskripte vor dem Consent. Das kann man ehrlich in einem Satz bei den Formularen sagen: „Ihre Anfrage bleibt auf Servern in der EU.“ Für Kunden aus CH, FL und vermögende Privatkunden ist das ein Vertrauensargument.
6. **Vorschau-Links für Architekten und Bauherren.** Die Staging-Technik lässt sich wiederverwenden: Angebotsseiten oder Moodboards unter einem privaten, ablaufenden Link (`/p/<token>`, `noindex`, Ablauf nach 30 Tagen) statt PDF-Anhang. Technisch ist das eine geschützte, nicht indexierte Route. Für Architekten im Masterkonzept-Programm wirkt das professionell. (Umsetzung erst, wenn das Angebots-Backoffice die Daten liefert.)
7. **Auch bei Ausfall bleibt die Seite schön.** Mit `stale-while-revalidate` und der „last good version“ (digital/13 F2) zeigt die Seite bei einem Backoffice-Ausfall weiter den letzten guten Stand. Nur falls der Server selbst ausfällt, liefert das CDN eine statische, gestaltete Notfallseite mit Telefonnummer, Adresse und Öffnungszeiten statt einer 502-Fehlerseite von nginx.

---

## 4. Was man auf keinen Fall tun darf

1. **Kein `next build` im laufenden Live-Ordner.** Das führt zu Ausfällen und halben Releases.
2. **Kein Deploy ohne Rollback-Weg.** Ein Release, das man nicht in 60 s zurücknehmen kann, wird nicht ausgerollt.
3. **Keine Prototypen im Produktions-Build ausliefern.** `noindex` reicht nicht.
4. **Kein HTML im CDN cachen, solange `Vary: rsc`/`_rsc` und der Purge nicht getestet sind.** Sonst bricht die Navigation.
5. **Kein `immutable` auf ungehashte Dateinamen.**
6. **Keine Nonce-CSP**, weil sie das statische Rendering zerstört. Ebenso keine CSP, die ohne Report-Only-Phase scharf geschaltet wird.
7. **Kein sichtbares Drittanbieter-Captcha (z. B. reCAPTCHA) als erste Maßnahme.** Es kostet Conversion, bringt Drittlandübertragung und Cookies und wirkt in einer Luxusumgebung billig.
8. **Keine Dark Patterns aus der Technik heraus.** Gemeint sind etwa gefälschte Live-Zähler („3 Personen sehen sich das gerade an“), künstliche Lade-Verzögerungen, Countdown-Timer oder ein Exit-Intent-Overlay, das den Zurück-Button blockiert. Das ist unzulässig (DSA Art. 25, UGP-Richtlinie/UWG, digital/14) und schadet der Marke.
9. **Kein Session Replay und keine Mausbewegungs-Aufzeichnung.** Das ist datenschutzrechtlich heikel und für vermögende Kunden ein Vertrauensbruch.
10. **Keine Formular-Inhalte, E-Mails oder Telefonnummern in Logs, Fehlerberichten oder URLs** (keine `?email=` in GET-Parametern).
11. **Kein Test gegen das echte Postfach** ohne Testmarker. Sonst arbeitet das Beratungsteam Fake-Leads ab.
12. **Keine Monitoring-Instanz nur auf dem überwachten Server.** Fällt er aus, schweigt auch der Alarm.
13. **Keine Secrets im Repo und keine `NEXT_PUBLIC_`-Variablen mit Schlüsseln.**
14. **Keine Hotlinks auf Hersteller-Bildserver** (Bildrechte und Abhängigkeit von fremden Servern).

---

## 5. Prüf-Checkliste für die drei Prototypen (Galerie, Bühne, Dreiländereck)

**Messbedingungen:** Alle Prototypen laufen auf Staging im Produktionsmodus (`next build && next start`), mit identischem Bildmaterial, Lighthouse mobil (Median aus 3 Läufen) und WebPageTest (Moto G Power, 4G, Frankfurt). Bewertet werden die Startseite und eine Unterseite (Marke bzw. Produkt) des jeweiligen Prototyps.

Skala je Kriterium: **0** = nicht erfüllt / Blocker, **1** = deutlich unter Ziel, **2** = knapp unter Ziel, **3** = Ziel erreicht, **4** = übertrifft Ziel. Gewicht in Klammern, Höchstpunktzahl **100**.

| # | Kriterium (Gewicht) | 3 Punkte = Ziel | Wie prüfen |
|---|---|---|---|
| T1 | LCP mobil, Labor (×3) | ≤ 2,5 s (4 Punkte: ≤ 1,8 s; 0: > 4 s) | LHCI, WebPageTest |
| T2 | INP/TBT (×2) | TBT ≤ 200 ms; INP bei Interaktion mit Galerie/Slider ≤ 200 ms (Chrome DevTools, 4× CPU-Drossel) | LHCI, DevTools Performance |
| T3 | CLS (×1) | ≤ 0,05 | LHCI |
| T4 | JS initial pro Route, gzip (×2) | ≤ 170 KB (4: ≤ 120 KB; 0: > 300 KB). `three`, `@react-three/*`, `model-viewer` **nicht** im Initial-Bundle | `size-limit`, `next experimental-analyze` |
| T5 | Statisch renderbar (×2) | Route im Build als ○/● (nicht ƒ). Keine `cookies()`/`headers()` im Seitenpfad | Build-Ausgabe, `prerender-manifest.json` |
| T6 | Bildauslieferung (×2) | Nur `next/image`, LCP-Bild mit `fetchPriority="high"` und eager, AVIF, mobil ≤ 120 KB. Korrekte `sizes`, keine Remote-Hosts außer Backoffice | Netzwerk-Tab, Lighthouse „Properly size images“ |
| T7 | Video/Motion-Last (×1) | Video `preload="none"` + Poster, ≤ 2,5 MB. Lenis und Animationen setzen bei `prefers-reduced-motion` aus. Animiert werden nur `transform`/`opacity` | Code-Review, DevTools Rendering |
| T8 | CDN-Tauglichkeit (×1) | Alle Assets gehasht, keine ungehashten `public/`-Dateien im LCP-Pfad, keine Query-Strings mit Zufallswerten | Code-Review |
| T9 | CSP-Verträglichkeit (×1) | Läuft fehlerfrei unter der Ziel-CSP X2: kein `eval`, keine fremden Inline-Event-Handler, keine nicht gelisteten Drittdomains | Report-Only-Header auf Staging, Konsole |
| T10 | Drittanbieter (×1) | 0 Drittanbieter-Requests vor Consent (Fonts selbst gehostet, keine Embeds ohne Fassade) | DevTools Netzwerk, gefiltert nach Fremd-Domains |
| T11 | Fehlertoleranz (×1) | Backoffice-Mock „down“ bzw. 8 s langsam: Seite zeigt die letzte gute Version oder einen gestalteten Fallback, kein leerer Zustand und kein 500 | Playwright mit `page.route` |
| T12 | Formular-Robustheit (×1, falls Formular im Prototyp) | Honeypot, Zeitfalle, Größenlimits vorbereitet. Fehlermeldungen generisch, Erfolgsmeldung auch bei Outbox | Code-Review, Test |
| T13 | Barrierefreiheit, technisch (×1) | axe 0 serious/critical. Fokus sichtbar (≥ 3:1), Tastatur-Navigation durch Galerie/Bühne möglich | `@axe-core/playwright`, manuell |
| T14 | Isolation (×1) | Prototyp-Code beeinflusst die Live-Seite nicht: keine Änderungen an geteilten Komponenten oder `globals.css`, eigene Layout-Datei, `noindex` + Ausschluss im Prod-Build | `git diff main -- src/components src/app/globals.css` |
| T15 | Wartbarkeit/Betrieb (×1) | Keine neuen schweren Abhängigkeiten ohne Begründung, keine ungepflegten Pakete (letzter Release > 18 Monate), Lizenzen MIT/Apache/ISC | `npm ls`, `knip`, npm-Seiten |

**Rechnung:** Summe aus (Punkte × Gewicht), geteilt durch die Maximalsumme (4 × 21 = 84), mal 100.
- **≥ 80**: technisch bereit für den Ausbau.
- **60–79**: umsetzbar mit klarer Nacharbeit.
- **< 60**: Die Gestaltungsidee kann bleiben, die Technik muss neu gebaut werden.

**K.-o.-Kriterien** (unabhängig von der Punktzahl):
- T1 > 4,0 s,
- T4 > 300 KB,
- T14 verletzt, also Live-Seite verändert,
- T10: Drittanbieter-Tracking vor Consent.

**Hinweis zum Ist-Stand am 26.10.2026:** `galerie` und `buehne` antworten auf dem lokalen Dev-Server mit 200 und `noindex, nofollow`, `dreilaendereck` liefert noch 404. Die Bewertung nach dieser Liste erfolgt erst auf Staging im Produktionsmodus. Dev-Werte (z. B. 3,5 s Antwortzeit der Galerie beim ersten Kompilieren) werden nicht gewertet.
