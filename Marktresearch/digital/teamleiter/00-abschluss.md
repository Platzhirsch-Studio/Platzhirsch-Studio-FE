# Abschlussbericht Teamleiter: Neuauftritt Platzhirsch Home Living

**Stand:** 26.10.2026, abends · Branch `feature/neuauftritt` · **nichts committet, gepusht oder deployt** · keine echten Zahlungen, Mails oder Veröffentlichungen
**Monitor:** alle 14 anderen Workflows fertig, nur dieser Teamleiter-Workflow lief zuletzt noch.
**Arbeitsstand im Repo:** 146 geänderte und 162 neue Dateien, alle uncommittet (siehe Release-Zug 0).

Grundlage dieses Berichts: Rundenpläne `runde-1-plan.md` … `runde-6-plan.md`, Paketberichte `r1-*.md` … `r6-*.md`, QA-Feedbacks `qa-screenshots/teamleiter/*/feedback.md`, `release-check.md` (Abschnitte R4–R6, Go-live-Liste R6.6, Ablaufblatt Next 16.4.2 R6.3), Übergabemappe `Marktresearch/digital/uebergabe/00-uebergabe.md`, `inhaber-entscheidungen.md`. Hier stehen keine neuen Fakten. Alles, was nicht belegt ist, ist als offen markiert.

---

## 1. Ergebnis in einem Absatz

Der Neuauftritt ist im Code fertig und geprüft. Das Release-Tor ist grün: Der Prod-Lauf `r6-ende-nachlauf` brachte **551 grüne Tests, 0 rote, 0 flaky**. Claims-Prüfung auf 910 URLs: 0 Funde. NAP 0, `check:facts` 0, 0 × static-to-dynamic. Die Schlussabnahme mit 134 URLs × 4 Geräten (536 Screenshots) zeigt keine Mängel bei Status, Überlauf, Konsole oder Requests. Es gibt 755 Unit-Tests, alle grün. ESLint meldet 0 Fehler und 0 Warnungen, die Schutzregeln stehen auf `error`. Lighthouse-A11y auf `/de` erreicht 100 (mobil und Desktop), axe meldet 0 Verstöße. Gesperrt bleiben drei Dinge, die außerhalb des Codes liegen: die **Freigabe durch die Kanzlei** (Datenschutzerklärung nennt noch Privacy Shield), **Next 16.4.2**, das erst ab 30.10. erlaubt ist, und die **Freigabe des Inhabers für Commit und Deploy**. Alles Weitere sind Freigaben von Inhaber, Kanzlei und Betrieb. Die Funktionen dafür sind gebaut und bis dahin auf noindex gesetzt oder hinter einem Schalter abgeschaltet.

---

## 2. Was in den sechs Runden gebaut wurde

### Runde 1: konfliktfreie Schichten neben den laufenden Bau-Workflows (8 Pakete)
- **Ratgeber** `/de/ratgeber` + 8 Artikel, noindex bis zur Freigabe. Der Filter für [prüfen]-Stellen wirkt auch auf das FAQPage-JSON-LD, Binni ist gesperrt.
- **Geprüfte Produkttexte** als lokale Datenquelle (`src/lib/productCopy/`). Freigaben bleiben erhalten, solange der Text gleich bleibt (`approvals.js`, `approve.mjs`).
- **SEO:** Doorway-Audit (`src/lib/seo/sitemap/doorwayAudit.js`, 4-Fakten-Regel), Sitemap/llms.txt nur für bestandene Seiten, Logik Marke × Kategorie, `/api/image` entfernt.
- **Testnetz:** Playwright-Smoke und axe (`@axe-core/playwright@4.13.0`, einzige Installation der Runde), Header-Überlauf bei 375 px behoben.
- **Claim-Guard:** Claim- und NAP-Prüfskripte (Händler-, Partner- und Superlativ-Muster in 4 Sprachen).
- **Plattform-Robustheit:** `error.js`, `global-error.js`, `backofficeFetch` mit Timeout/Retry, Instrumentation, Vorschau-Routen für Fehlerseiten.
- **Formular-APIs gehärtet** (abwärtskompatibel): Rate-Limit pro IP, Honeypot/`_t`, Fehlercodes.
- **Adventsabend 26.11.** fertig, aber noindex und ohne Event-Schema, bis Uhrzeit und Programm da sind. `/bewerten` auf die neuen Tokens umgestellt.

### Runde 2: freigewordene Feature-Bereiche (7 Pakete)
- **Lead-Strecke:** Kontaktseite im neuen Design. Die Formulare senden die Spamschutz-Felder mit, zeigen Fehler übersetzt und tragen den `FormPrivacyNote`-Hinweis.
- **Upload:** Ticket-Fehler bei der QR-Übergabe behoben, eigene Meldung bei Zeitüberschreitung, Auflage A-1 und Kontrast erledigt.
- **Labs:** Küchen- und Sofaplaner (ohne freigegebene Preise kein Betrag), AR-Viewer (Maße im Hochformat), Stil-Finder, Dreiländer-Rechner, KI-Concierge mit Speicher-Abstraktion für das Rate-Limit.
- **SEO:** Marke × Kategorie als Komponente mit Vorschau, Ratgeber und bestandene Landingpages vorbereitet für Sitemap/llms.
- **Qualitätsnetz:** axe nach dem Cookie-Banner, Smoke-Tests für die neuen Seiten, Claim-Prüfung live in 4 Sprachen.

### Runde 3: erste Runde ohne gesperrte Dateien (10 Pakete)
- **i18n:** R2-Vorschläge übernommen, IT einheitlich in der tu-Form, Superlative in FR/IT entfernt.
- **Shell:** Cookie-Banner im Neuauftritt, Header ab 320 px, Fokus im Mobilmenü, Öffnungszeiten aus einer Quelle (`site.js`), schlanke `/upload`-Hülle.
- **Produktseite „Atelier“:** geprüfte Texte und FAQ, Herstellertexte laufen durch den Claim-Filter, Dubletten im Katalog entfernt (`dedupe.js`).
- **Marke × Kategorie** an die `[collection]`-Route angeschlossen, Händler-Filter nach `src/lib/legal`.
- **Startseite** mobil unter 13 000 px Seitenhöhe.
- **Landing:** Robots nach dem Doorway-Audit gesetzt, Küchenseite entschärft („anhand von Mustern“).
- **Inhalt:** News-Filter gegen Rabatt- und Superlativ-Texte, Karriere ohne react-share.
- **Portal-Auflagen** N1–N5, Header nur auf den Routen, die sie brauchen.
- **Rechts-Vorschau** (noindex) mit Anwalts-Mappe unter `/de/preview/recht/*`.
- **Prod-Check-Skript** (Build in einer Kopie, `next start` auf :3100).
- **Hausnummer 11** im Code umgesetzt.

### Runde 4: Plattform und Messung (9 Pakete)
- **Statische Auslieferung:** `not-found.js`/`layout.js` ohne `cookies()`/`headers()`, 0 × static-to-dynamic. `/wp-login.php` liefert 404 statt 500.
- **Next 16.3.8** installiert (Sicherheitspatch), `dangerouslyAllowSVG` aus, CSP als Report-Only, `X-XSS-Protection` entfernt.
- **Herkunft und Messung (AP3):** `attribution.js`, `lead_ref`, Web Vitals, `add_to_wishlist`, Termin hinter Schalter. Ohne Ads-Einwilligung geht nur der grobe Kanal ins Backoffice.
- **Consent (AP2-Datenteil):** Dienste-Register, Banner und DSE-Vorschau aus einer Quelle, gtag lädt nur mit aktiver config, Bildregister `bildrechte.csv`.
- **Produktseite (AP4):** Downloads, Maße als Tabelle und im JSON-LD, Kategorie-Alias als 301.
- **SEO:** Sitemap mit importierten Produkten, hreflang- und Rich-Results-Prüfung.
- **CI:** Pipeline-Datei, `deploy.sh`, Bundle-Budget mit Baseline, Rate-Limits für `/cmx` und shop-search.
- **Portal/Labs:** N6, Feinschliff am Bundle.

### Runde 5: P1/P2 schließen, eine Textquelle, Welle-1-Reste (9 Pakete)
- **Produkt:** neutrale Fläche statt fremdem Ersatzfoto (124 Produkte ohne Bild), ein Backoffice-Timeout führt nicht mehr zu 404, Galerie axe-konform.
- **Shell/SEO:** `siteSchema()` mit Händler-Filter, LocalBusiness aus `site.js`, Brotkrumen, SearchDialog-429.
- **i18n:** Portal und Upload in EN/FR/IT, doppelte Texte samt Testverträgen zurückgebaut.
- **Portal/Labs:** LazyMotion, `eval` im Sofaplaner entfernt.
- **Schweiz-Hub** `/de/einkaufen-aus-der-schweiz` mit CHF-Rechner (noindex, unverlinkt).
- **Gutscheine und Atelierverkauf** hinter `VOUCHER_MODE`/`ATELIER_MODE`, Standard off (404). Solange die Bedingungen Entwurf sind, ist `VOUCHER_MODE` zwangsweise aus. Es wird kein Kundengeld angenommen.
- **Content:** `check-facts.mjs`, Markenstimme (`docs/content/brand-voice.md`), InlineVideo, Projekte-Vorlage (leer, noindex).
- **Release:** `/cmx`-Cache, remotePatterns/CSP, react-icons/react-share/react-slick entfernt, `qrcode@1.5.4` (dev) samt QR-Skript für `/bewerten`, Go-live-Liste.

### Runde 6: Schlussrunde (8 Pakete)
- **i18n:** `messages-r5-*` und `messages-r6-*` übernommen, `check-facts --strict` grün, `rendered-text-check.mjs` neu. Es gibt eine einzige Textquelle mit 1 317 Blättern je Sprache und 0 fehlenden Schlüsseln.
- **Hülle:** Sprachumschalter ohne 404 auf DE-only-Seiten, globale 404 in den Hausschriften, Footer-Linklisten als Server-HTML, ConsentEmbed-Texte für Videos.
- **Katalog/Produkt:** Suspense-Hüllen entfernt, damit der Inhalt wieder in `<main>` und ohne JS sichtbar ist (SEO-Fehler behoben). TBT bei /lamps 418 → 265 ms.
- **Leads:** zod `jitless` (CSP-fähig), Probe mit erzwungener CSP grün, OG-Locale, Upload-Karte nur auf DE.
- **Landing/Inhalt:** leeres Bildband entfernt, Hero typografisch, einzeiliger Hero-Lead auf der Küchenseite.
- **Portal/Labs:** Küchenplaner-Tests stabil, Demo-Banner N7 (auch im PDF), Portal-Leiste kompakt über der Cookie-Leiste, Rate-Limit für Server Actions.
- **Übergabe:** Übergabemappe und Freigabe-Cockpit `/de/preview/freigaben` (nur mit Schalter sichtbar, noindex, nur lesend).
- **Release:** `framer-motion@12.43.0` exakt deklariert, `check:facts` im Tor und in der CI, `/cmx`-404 mit `no-store`, TBT /de/kontakt 480 → 221 ms (`content-visibility` am Formular), Ablaufblatt Next 16.4.2, finale Go-live-Liste.

---

## 3. Qualitätsstand je Bereich

Die Noten sind Teamleiter-Einschätzungen auf Basis der QA-Feedbacks und der Berichte nach dem jeweils letzten Fix.

| Bereich | Note | Begründung / was fehlt zur 10 |
|---|---|---|
| Hülle (Header, Footer, Cookie-Banner, 404) | **8,5** | A11y 100, 320 px ok. Das TBT-Budget ist nur mit 250 ms eingehalten. Die Cookie-Leiste mit Portal-Leiste belegt auf dem iPhone 28,8 % statt 25 %. |
| Startseite | **9** | Seitenhöhe und LCP (1,7 s) ok. TBT 206–216 ms. Die H1 „Italienisches Wohnen am Bodensee.“ wartet auf die UWG-Entscheidung. |
| Marken + Marke × Kategorie | **9,5** | Abnahmefähig. Die Pflege der Backoffice-Daten ist offen (`dealers_description`, Schreibweisen). |
| Katalog + Produktseite | **8** | SEO repariert, Fremdfoto weg, Dubletten weg. TBT der Produktseite 289–315 ms (IntlMessageFormat im Client). Eigentexte nicht freigegeben. |
| Landing- und Regionsseiten | **9** | Doorway-Audit umgesetzt. Yacht und Outdoor bleiben ohne eigene Fotos bei 7–7,5. |
| Inhaltsseiten (Haus, Team, News, Karriere, Presse, Partner) | **9** | Abnahmefähig. CMS-News und Metas mit „exklusiv/Luxus“ müssen im Backoffice bereinigt werden. |
| Lead-Strecke (Kontakt, Beratung, Produktanfrage, Newsletter) | **9** | CSP-fest, mehrsprachig, Herkunft erfasst. **Risiko:** Die Backoffice-Kontakt-API antwortete mit 500 {}, das ist nicht geklärt. |
| Ratgeber | **9** (Code) | Fertig, aber noindex, bis die [prüfen]-Stellen geklärt und der Prüfer benannt ist. |
| Labs (Planer, AR, Stil-Finder, Dreiländer, Concierge) | **8,5** | Technisch fertig, noindex. Preise, Bildrechte, AVV Anthropic und Redis fehlen. |
| Upload und Kundenportal | **8,5** | Code 9. Live erst nach Next 16.4.2, Secrets, Mail-Dienst und Speicher. Portal-Abnahme vorher 7,5. |
| Recht-Vorschau, Consent | **9** | Entwürfe und Mappe fertig. **Die Live-Rechtstexte sind unverändert und nicht freigegeben**, die DSE nennt Privacy Shield. |
| Texte / i18n (4 Sprachen) | **9** | Eine Quelle, IT tu, 0 unbelegte Angaben in den Messages. Rest: feste Markenzahl in `homeSeo.js`/`llms.js` (Patch liegt bereit, siehe 4.1). |
| SEO (Sitemap, llms, hreflang, Schema) | **9** | Ohne Befund in Prod. Indexierung von Ratgeber/Regionen wartet auf Freigaben. |
| Performance | **7,5** | LCP mobil ≤ 1,7 s, CLS 0, Desktop-TBT ≤ 19 ms. Mobil-TBT: alle Messseiten über 200 ms, Grundlast etwa 170 ms aus Turbopack-Runtime und react-dom. |
| Barrierefreiheit (WCAG 2.2 AA) | **9** | Lighthouse 100, axe 0, reduced motion respektiert. Barrierefreiheitserklärung nur als Entwurf. |
| Plattform, CI, Release | **9** | Prod-Tor 551/0/0, CI-Datei, `deploy.sh`, Rollback-Pfad. Server, CI-Variable und Monitoring fehlen. |
| Commerce (Gutscheine, Atelier) | **9** (aus) | Sicher abgeschaltet (404). Geht nur nach Klärung durch den Insolvenzrechtler live. |
| Schweiz-Hub | **9** (aus) | noindex, unverlinkt, bis der Steuerberater freigibt. |
| Übergabe und Freigabe-Cockpit | **9** | Mappe, Umgebungsvariablen (nur Namen), Freigabelisten, Deploy-Reihenfolge. |
| **Gesamt Code** | **≈ 9** | Release-fähig, sobald die Blocker aus 4.2 erledigt sind. |
| **Gesamt Inhalte/Freigaben** | **≈ 6** | Die meisten Inhaber-, Kanzlei- und Betriebs-Freigaben sind noch offen (Abschnitt 5). |

---

## 4. Was offen ist

### 4.1 Code (Teams, ohne Inhaber lösbar)

| # | Punkt | Besitzer / Weg | Blockiert Go-live? |
|---|---|---|---|
| C1 | Feste Markenzahl „über 35 …“ steht noch in `src/lib/content/homeSeo.js` (Fließtext/Meta) und `src/lib/seo/llms.js:36`. Die CMS-Meta der Startseite enthält „exklusive/esclusivi“. Ein fertiger Patch liegt unter `qa-screenshots/teamleiter/r6-i18n/uebergabe-markenzahl-meta.diff` (`git apply --check` am 26.10. erfolgreich) | Integrator: vor dem Commit einspielen, danach `check:claims`/`check:facts`. Alternativ legt der Inhaber einen Beleg vor (Frage F12) | **ja** (UWG) |
| C2 | Next 16.4.2 + eslint-config-next 16.4.2, frühestens **30.10.2026** nach dem Ablaufblatt `release-check.md` R6.3 (isoliert prüfen, dann Repo, dann `check:prod`, dann Dev-Server-Neustart, Rückbau vorbereitet) | Release | **ja** |
| C3 | TBT Produktseite 289–315 ms: Texte auf dem Server formatieren statt IntlMessageFormat im Client | Produkt, P2 | nein (Entscheidung 6.1) |
| C4 | TBT /lamps 253–265 ms: motion-Chunk erst nach dem Leerlauf laden oder als CSS | Produkt, P2 | nein |
| C5 | Grundlast von etwa 170 ms TBT (Turbopack-Runtime + react-dom): nach 16.4.2 einen Chunk-Split prüfen, weniger Client-Inseln in der Hülle | Release/Hülle, P3 | nein |
| C6 | Ersatztabelle in `shellLabels.js` kürzen, seit die Messages vollständig sind | Hülle, P3 | nein |
| C7 | CSP erzwingen erst nach dem `report-to`-Endpunkt und einer Woche Report-Only-Auswertung | Release + Betrieb | nein (Report-Only reicht für den Go-live) |
| C8 | Portal: Adapter von „mock“ auf das echte Backend umstellen, QA-Nachrichten im Demo-Postfach entfernen, `/de/portal/login/dev` muss in Prod 404 liefern | Portal, vor Zug 5 | nur das Portal |
| C9 | Nur Dev-Meldungen („Router action dispatched before initialization“, „state update … not mounted“) | Portal/Labs, P3 | nein |
| C10 | `setRequestLocale` zurückgestellt: Die Seiten sind ohne diese Funktion statisch (0 × static-to-dynamic), kein Handlungsbedarf vor dem Go-live | – | nein |
| C11 | Jury-Prototypen `/de/preview/{buehne,dreilaendereck,galerie}` je nach Antwort auf F30 löschen oder als noindex behalten | Hülle | nein |

### 4.2 Go-live-Blocker außerhalb des Codes
1. **Kanzlei:** Die DSE nennt Privacy Shield (`src/components/Datenschutz/datenschutz.js` Z. 62). Der Ersatztext C1/C2 (DPF/SCC) liegt als Entwurf vor.
2. **Next 16.4.2** (C2), frühestens ab 30.10.
3. **Betrieb:** Server, Secrets, nginx, CI-Variable `SERVER`, Monitoring.
4. **Inhaber:** Freigabe für Commit, Merge und Deploy.
5. **Backoffice:** Die Kontakt-API antwortet mit 500 {}. Ohne Klärung kommen Anfragen möglicherweise nicht an.

---

## 5. Inhaber-Fragen (dedupliziert, priorisiert, mit Frist)

Frist = spätestes Datum, damit der zugehörige Release-Zug (Abschnitt 6) nicht rutscht. „Wer“ heißt: wer die Antwort liefern muss. Die Kennungen in Klammern beziehen sich auf den Masterplan bzw. die Übergabemappe.

### Priorität A: Blocker, Frist diese Woche

| # | Frage | Wer | Frist |
|---|---|---|---|
| F1 | **Commit, Merge nach `main` und Deploy:** Wer gibt frei und wann? Darf zuerst auf `feature/neuauftritt` committet werden, um den uncommitteten Stand (308 Dateien) zu sichern? | Inhaber | **27.10.** |
| F2 | **Händler-Hotfix (R0):** Darf er als kleiner, eigener Hotfix auf die Live-Seite? Live stehen weiterhin „Händler“-Texte (Rechtsrisiko). | Inhaber | **28.10.** (Masterplan R0) |
| F3 | **Kanzlei-Termin anfragen:** DSE-Ersatz C1/C2 (DPF/SCC, Go-live-Blocker) und Consent-Text im Banner (heute Art. 49 → DPF/SCC aus `messages-r3-shell.json`), dazu C3 (Länderliste Maps), C4 (GTM-Schalter), C7 (Ads-Cookies), Einwilligung oder lit b bei Concierge, Upload und Planer, der Satz zur freiwilligen Selbstauskunft, IP-Kurzspeicherung beim Formularschutz, DSE-Abschnitte Portal/Uploads/Planer/Concierge, Impressum/AGB/Widerruf mit Hausnummer 11, Barrierefreiheitserklärung, Gutscheinbedingungen, Partnerverträge. Außerdem: Welche Sprachfassungen bekommen Impressum und DSE in EN/FR/IT? Die Mappe liegt unter `/de/preview/recht/*`. | Inhaber → Kanzlei | Anfrage **30.10.**, Freigabe C1/C2 vor Zug 1 |
| F4 | **Backoffice-Kontakt-API 500 {}:** Darf das Backoffice-Team eine angekündigte Testanfrage (Betreff „TEST – bitte löschen“) gegen die Produktion schicken? Wer löscht den Eintrag „QA Test“ im Frappe Error Log? | Inhaber → Backoffice | **sofort / 28.10.** |
| F5 | **Adventsabend 26.11.:** Uhrzeit, Programm, Kapazität. Ist der Abend kostenlos? Ohne diese Angaben bleibt die Seite noindex, ohne Event-Schema und ohne Kalender-Download. | Inhaber | **30.10.** |
| F6 | **Next 16.4.2 ab 30.10.:** Wer gibt den eigenen Lauf nach dem Ablaufblatt R6.3 frei (inklusive Neustart des Dev-Servers)? | Inhaber | **29.10.** |

### Priorität B: vor dem Go-live des Neuauftritts (Zug 1, Ziel KW 45/46)

| # | Frage | Wer | Frist |
|---|---|---|---|
| F7 | **Betrieb:** Wer richtet bis wann ein: Server-Zugang für `deploy.sh` (`BIND_HOST=127.0.0.1`, Rollback-Test), nginx nach `tools/ci/nginx-platzhirsch.conf.example` (inkl. IP-Header), Git-Repo und CI-Variable `SERVER`, AV-Verträge mit Hoster und Diensten? | Inhaber → Betrieb | **06.11.** |
| F8 | **Monitoring (E11):** GlitchTip selbst gehostet oder Sentry EU? Wer legt das Konto an? Dazu Uptime-Überwachung und ein `report-to`-Endpunkt für die CSP. | Inhaber → Betrieb | **06.11.** |
| F9 | **Rate-Limit-Speicher:** geteiltes Redis/KV (`LABS_REDIS_REST_URL/TOKEN`) oder dauerhaft eine Instanz (`pm2 instances: 1`)? | Betrieb | **06.11.** |
| F10 | **UWG-H1:** Darf „Italienisches Wohnen am Bodensee.“ bleiben, oder wird sie auf „… viele davon aus Italien“ abgeschwächt (Audit M1)? Gilt auch für designermoebel-kempten. | Inhaber (ggf. Kanzlei) | **06.11.** |
| F11 | **Superlative (E12):** Gibt es Belege, etwa für „größte Minotti-Ausstellung“, oder bleiben sie dauerhaft gestrichen? (Empfehlung: gestrichen lassen) | Inhaber | **06.11.** |
| F12 | **Fakten-Belege:** „Über 35 internationale Marken“ und „wir planen mit“ für alle 36 Marken im Backoffice: Gibt es einen Beleg? Ohne Beleg wird die Zahl gestrichen (Patch C1). Dasselbe gilt für „Minotti 2022 Collection“ (Presse) und die Vernissage-Uhrzeit 17:00. | Inhaber | **06.11.** |
| F13 | **Küchen:** Welche Küchen stehen tatsächlich in der Ausstellung, und welche Marken sollen genannt werden (Poliform/next125 oder „next125 und Schüller“)? Erst danach darf die Küchenseite wieder „im Showroom ansehen“ sagen. | Inhaber | **06.11.** |
| F14 | **Regionsseiten (E15):** Indexierung nach dem Audit bestätigen (Rheintal, Liechtenstein, Arlberg, Konstanz, Feldkirch, Appenzell; Kempten/Ravensburg klären). | Inhaber | **06.11.** |
| F15 | **Backoffice-Pflege:** Wer bereinigt `dealers_description` aller Marken außer ClassiCon, News mit Luxus/exklusiv/größte, die 4 Metas `metadata_description_*` mit „exklusiv/nachhaltig“, die Schreibweise „Antoniolupi“, die Kategorie von „Fynn“, Minotti-Sofas mit `tables-*`-Slugs, Bézier unter „Sessel & Hocker“, doppelte Produkt-Datensätze und uneinheitliche Maßangaben? Wer liefert freigegebene Bilder für die 124 Produkte ohne Foto (u. a. BvE, next125)? | Inhaber → Backoffice | **13.11.** |
| F16 | **Formulare:** Darf die Zahl der Pflichtfelder (Beratung 7, Produktanfrage 8) im Backoffice auf die 4 aus der Design-Bibel gesenkt werden? | Inhaber → Backoffice | **13.11.** |
| F17 | **Externe Einträge:** Werden Google-Profil, Herold und ClassiCon-Locator auf Landstraße 11 umgestellt (vom Inhaber entschieden, noch nicht bestätigt umgesetzt)? | Inhaber | **13.11.** |
| F18 | **Markenstimme** (`docs/content/brand-voice.md`) freigeben. | Inhaber | **13.11.** |

### Priorität C: Freigaben für Inhalte, laufend nach dem Go-live (Zug 3)

| # | Frage | Wer | Frist |
|---|---|---|---|
| F19 | **Ratgeber:** Wer prüft die [prüfen]-Stellen der 8 Artikel fachlich und steht namentlich als Prüfer (`reviewedBy`)? Danach Indexierung je Artikel. Der Stand ist im Cockpit `/de/preview/freigaben` sichtbar. | Inhaber | **20.11.** |
| F20 | **Produkttexte:** Freigabe der Startliste (10 Stücke) über `node src/lib/productCopy/approve.mjs --startliste` bzw. das Cockpit. Gibt es eine Liste der ausgestellten Stücke für belegte Ausstellungssätze? | Inhaber | **20.11.** |
| F21 | **Bildrechte und Fotos (E6):** Freigaben für die Herstellerbilder laut `bildrechte.csv` (Minotti, Flos, Treca, next125, Brand van Egmond u. a., Küchen-Hero `bannerImageKuche2/3`, `Poliform-Kitchen.jpg`, Yacht, Outdoor, Kempten, Stil-Finder-Moodboard). Wann wird ein Fotoshooting beauftragt (Showroom/Café, Team, Minotti-Story, Küchen, Yacht, Outdoor, Adventsabend, Kontakt, Schweiz-Hub, Kopfbilder News/Beratung)? | Inhaber | Freigaben **20.11.**, Shooting offen |
| F22 | **Google:** Place-ID für `/bewerten` und die QR-Karte. Darf die QR-Karte nach dem Probedruck im Showroom ausgelegt werden? Wer verantwortet den Bewertungsprozess (E19)? `NEXT_PUBLIC_GOOGLE_ADS_ID` anlegen oder bewusst auf Ads verzichten? GA4-Aufbewahrung auf 14 Monate stellen. | Inhaber | **20.11.** (vor dem Adventsabend) |
| F23 | **Projekte/Referenzen:** Gibt es Kundenprojekte mit schriftlicher Einwilligung (ohne Adresse)? | Inhaber | offen |

### Priorität D: Funktionen hinter Schaltern (Züge 4–6)

| # | Frage | Wer | Frist |
|---|---|---|---|
| F24 | **Kundengeld (Insolvenzrecht):** Dürfen bei −2,67 Mio. € Eigenkapital Gutscheine verkauft und Anzahlungen angenommen werden (persönliche Haftung der Geschäftsführung)? Wird die Handels-GmbH vorher gegründet? Bis zur Klärung bleiben `VOUCHER_MODE`/`ATELIER_MODE` auf off (404). Ist das so bestätigt? | Inhaber → Insolvenzrechtler | **13.11.**, falls Gutscheine fürs Weihnachtsgeschäft gewünscht |
| F25 | **Gutscheine (E4):** Mehrzweck- oder Einzweckgutschein und USt-Behandlung (Steuerberater). Obergrenze 5 000 € je Gutschein bestätigen. Wer erstellt die PDF-Vorlage? | Inhaber → Steuerberater | nach F24 |
| F26 | **Atelierverkauf (E5):** Termin der Inventur, wer pflegt das Google Sheet, welche Preisregel (z. B. 20–55 % nach Alter)? | Inhaber | nach F24 |
| F27 | **Schweiz-Hub:** Wer liest Text und CHF-Rechner gegen (Steuerberater oder Zollspediteur)? Dazu Richtwerte für Liefer- und Verzollungskosten im Dreiländer-Rechner, OSS ja/nein, Weitergabe der DE-USt. | Inhaber → Steuerberater | offen |
| F28 | **Planer und Stil-Finder:** Wird eine Richtpreistabelle freigegeben (A2)? Werden die Breiten 27,5 und 41,25 cm im 55er-Raster angeboten? Ist das Senden (`NEXT_PUBLIC_LABS_PLANER_SENDEN`) nach Freigabe des DSE-Abschnitts erlaubt? | Inhaber | offen |
| F29 | **KI-Concierge:** AVV mit Anthropic, Freigabe des DSE-Abschnitts `#ki-concierge`, API-Key und Budget für den Test mit 50 Fragen. | Inhaber → Kanzlei | offen |
| F30 | **Kundenportal:** Live erst nach Next 16.4.2 (Empfehlung: ja). Nur Deutsch oder auch EN/FR/IT (Texte vorhanden)? Mail-Dienst für Login-Mails (Absender, SPF/DKIM, AVV, `PORTAL_MAIL_*`), `PORTAL_SESSION_SECRET`, `UPLOAD_TOKEN_SECRET`, echter Upload-Speicher (S3 o. Ä.) und Speicherfristen (`OWNER_CONFIRMED`, Uploads). Wer richtet das ein? | Inhaber → Betrieb | vor Zug 5 |
| F31 | **Termin, WhatsApp, Newsletter, KI-Bots:** Termin-Tool (E7: Cal.com, Google-Terminplanung oder Microsoft Bookings, mit AVV und EU-Region), WhatsApp-Nummer und Firmengerät (E8), Newsletter Brevo mit Double-Opt-in ja/nein (E9), KI-Trainingsbots in `robots.txt` sperren oder zulassen (E10). | Inhaber | offen |
| F32 | **Jury-Prototypen** `/de/preview/{buehne,dreilaendereck,galerie}`: löschen oder als interne noindex-Referenz behalten? (Empfehlung: vor dem Merge löschen) | Inhaber | vor Zug 1 |

**Erledigt und nicht mehr zu fragen:** Hausnummer (11, im Code umgesetzt), Designrichtung, Markenliste/Liefergebiet/Montage-Wording, Team-Rollen (siehe `inhaber-entscheidungen.md`).

---

## 6. Teamleiter-Entscheidungen zum Abschluss

1. **TBT-Budget (release-check R6.4):**
   - Für `/de` (206–216 ms), `/de/produkte` (215–218), Minotti (232–237), `/de/kontakt` (221) und `/de/produkte/lamps` (253–265, Toleranz) gilt ein **Budget von 250 ms**. Ziel bleiben 200 ms.
   - Die Produktseite (289–315 ms) läuft als P2 weiter (C3). Sie blockiert den Go-live nicht, denn LCP liegt bei höchstens 1,7 s, CLS bei 0 und Desktop-TBT bei höchstens 19 ms.
   - Damit gilt R6-release als **9/10**, R6-shell-perf als **8,5/10** und R6-produkt-perf als **7,5/10** mit Folgepunkten C3/C4.
2. **Portal-Leiste auf dem iPhone (28,8 % statt 25 %):** Das gilt als bekannte Abweichung. Lösen lässt sie sich mit kürzeren Cookie-Texten nach der Kanzlei-Freigabe (F3), dann wird das neu gemessen. Das Portal geht ohnehin erst in Zug 5 live.
3. **Feste Markenzahl:** Bis ein Beleg vorliegt (F12), nennen Fließtext, Meta, JSON-LD und llms.txt keine feste Zahl. Der Patch C1 ist **Pflicht vor dem Commit**.

---

## 7. Empfohlene Reihenfolge für Commit und Deploy (Release-Züge)

Die Züge aus dem Masterplan (R0 28.10., R1 03.11., R2 KW 46, …) sind an den heutigen Stand angepasst. Inzwischen liegt alles auf einem Branch, und Gutscheine sind bis zur Klärung F24 gesperrt. **Jeder Zug braucht die Freigabe F1.** Jeder Zug: `check:prod` grün, dann Staging, dann Produktion. Danach `check-claims --live`.

| Zug | Ziel | Inhalt | Voraussetzungen |
|---|---|---|---|
| **0a: Sicherung** | 27.10. | Uncommittete Arbeit auf `feature/neuauftritt` in **thematischen Commits** sichern, nicht pushen, nicht mergen. Vorschlag: (1) Tooling/Tests/CI, (2) Plattform/Config/Proxy, (3) Messages/i18n, (4) Hülle, (5) Startseite/Marken/Katalog/Produkt, (6) Landing/Inhalt/Ratgeber, (7) Leads/Formulare/APIs, (8) Labs/Upload/Portal, (9) Recht-Vorschau/Commerce/Schweiz/Übergabe. Vorher Patch C1 einspielen. Den von `next dev` erzeugten AGENTS.md-Block mitcommitten. | F1 |
| **0b: Händler-Hotfix (R0)** | 28.10. | Auf einem Hotfix-Branch **von `main`** nur den Händler-Filter (`claims`/`src/lib/legal`), `/api/image` weg und robots. Nicht den ganzen Neuauftritt. Danach `check-claims --live`. | F1, F2 |
| **1: Neuauftritt Kern** | KW 45/46 (frühestens nach dem 30.10.) | Merge `feature/neuauftritt` → `main`: Hülle, Startseite, Marken, Marke × Kategorie, Katalog/Produkt, Landing/Regionen, Inhaltsseiten, Lead-Strecke mit `FormPrivacyNote` und Herkunft (alter Zug R2), Adventsabend (index nur mit F5), A11y-Teil. Bleibt aus bzw. noindex: Ratgeber, Labs, Schweiz-Hub, Projekte, Commerce (off), Portal, Termin. `COMMERCE_PREVIEW`/`FREIGABE_PREVIEW` in Prod **nicht** setzen. Danach Sitemap in der Search Console einreichen und nach 7 Tagen den 404-Report prüfen. | C1, C2 (Next 16.4.2), F3 (C1/C2-Text live), F4, F7, F8, F32 |
| **2: Messung und Google** | KW 46/47 | Place-ID + QR-Karte drucken (vor dem 26.11.), Ads-ID oder Verzicht, GA4 14 Monate. Termin-Embed nur nach F31 und Kanzlei. Bei grünem Report-Only-Lauf (eine Woche) die CSP erzwingen. | F22, F8 (`report-to`), F31 |
| **3: Inhalte nach Freigabe** | laufend ab KW 47 | Je eigener kleiner Deploy: Ratgeber-Artikel (index + Sitemap/llms), Produkttexte, Hero-Fotos laut Bildregister, Regionsseiten-Indexierung, Küchen-Aussagen, Projekte, Schweiz-Hub (nach Steuerberater) | F14, F19–F21, F23, F27 |
| **4: Labs live** | nach Freigaben | Planer mit Senden (`NEXT_PUBLIC_LABS_PLANER_SENDEN`), Richtpreise, Concierge mit echtem Modell, Redis für das Rate-Limit | F9, F28, F29, DSE-Abschnitte (F3) |
| **5: Kundenportal und Upload** | nach Zug 1 + Betrieb | Secrets, Mail, Speicher, Adapter auf das echte Backend (C8), `/de/portal/login/dev` → 404, **nur mit Next 16.4.2** | C2, C8, F30 |
| **6: Commerce** | erst nach Insolvenzrecht | `ATELIER_MODE` → anfrage (nach Inventur), `VOUCHER_MODE` erst nach Kanzlei-Freigabe der Gutscheinbedingungen, Steuerberater und Code-Änderung `TERMS_STATUS`. Bis dahin wird kein Kundengeld angenommen. | F24–F26, F3 |

**Was auf keinen Fall passieren darf** (auch Übergabemappe Abschnitt 8): Deploy ohne freigegebenen DSE-Text, Commerce-Schalter an ohne Klärung F24, Portal live auf Next 16.3.8, Ratgeber oder Produkttexte indexiert ohne Freigabe, Herstellerbilder ohne Freigabe, feste Markenzahl oder Superlative ohne Beleg.

---

## 8. Wichtige Dateien

- Go-live-Liste und Ablaufblatt: `Marktresearch/digital/teamleiter/release-check.md` (R6.3, R6.4, R6.6)
- Übergabemappe: `Marktresearch/digital/uebergabe/00-uebergabe.md`, Cockpit `/de/preview/freigaben` (Dev oder `FREIGABE_PREVIEW=1`)
- Anwalts-Mappe: `/de/preview/recht/*`
- Patch Markenzahl/Meta: `qa-screenshots/teamleiter/r6-i18n/uebergabe-markenzahl-meta.diff`
- Prod-Belege: `qa-screenshots/teamleiter/r6-release/r6-ende*/`, Kontaktbögen `r6-ende/kontaktbogen/`
- Inhaber-Entscheidungen: `Marktresearch/digital/teamleiter/inhaber-entscheidungen.md`
