# Übergabemappe Platzhirsch Home Living: Neuauftritt

**Stand:** 26.10.2026 · Branch `feature/neuauftritt` · nichts committet, gepusht oder deployt · Paket R6-uebergabe (Runde 6)

Mit dieser Mappe muss der Inhaber nur noch zwei Dinge tun: **Freigaben erteilen** und **Schalter setzen lassen**. Die Mappe nennt keine neuen Fakten. Jede Aussage stammt aus den Teamleiter-Berichten `Marktresearch/digital/teamleiter/r1-…r5-*.md`, aus `release-check.md`, `inhaber-entscheidungen.md` und dem Rechtspaket `Marktresearch/recht/00-rechtspaket-uebersicht.md`. Werte von Umgebungsvariablen stehen hier **nie**, nur ihre Namen und ihr Zweck.

**Freigabe-Cockpit:** `/de/preview/freigaben`. Die Seite zeigt den aktuellen Stand aller Freigaben direkt aus dem Code: Ratgeber mit [prüfen]-Stellen, Produkttexte, Hero-Fotos, Rechtsentwürfe, Gutschein/Atelier und Schweiz-Hub, jeweils mit Datei und Zeile. Sie ist nur im Dev-Server oder mit `FREIGABE_PREVIEW=1` sichtbar (sonst 404), immer noindex/nofollow, nur Deutsch, ohne Formular und ohne Schreibfunktion. Bedienung siehe Abschnitt 7.

Inhalt:
1. Was fertig ist
2. Was bewusst abgeschaltet ist
3. Umgebungsvariablen
4. Freigabelisten nach Besitzer
5. Deploy-Reihenfolge
6. Noten der Runden 1–5
7. Freigabe-Cockpit
8. Was auf keinen Fall passieren darf

---

## 1. Was fertig ist

### 1.1 Seitenarten (geprüft in der Gesamtabnahme R5, `release-check.md` R5.5: 91 URLs, 4 Sprachen, 4 Geräte, alle Status wie erwartet)

| Seitenart | Beispiel | Index | Quelle |
|---|---|---|---|
| Startseite | `/de` | ja | r3-R3-startseite, r5-R5-shell-seo |
| Marke | `/de/ueber-uns/marken/minotti` | ja | r3-R3-marken-seo, r4-R4-seo |
| Marke × Kategorie | `/de/ueber-uns/marken/<marke>/<kategorie>` | ja, außer ausgeschlossene Kombinationen (noindex,follow) | r3-R3-marken-seo |
| Katalog und Kategorie | `/de/produkte`, `/de/produkte/lamps` | ja | r4-R4-produkt, r5-R5-produkt |
| Produkt mit Bild / ohne Bild | `/de/produkte/lamps/lamps-2097-18` | ja; ohne Foto neutrale Fläche statt Fremdfoto | r5-R5-produkt |
| Region / Landing | `/de/designermoebel-bregenz`, `/de/kuechen-vorarlberg` | ja; Regionsseiten, die das Doorway-Audit nicht bestehen: noindex,follow | r3-R3-landing |
| Inhaltsseiten | Haus, Team, News mit Artikel, Karriere, Partner, Presse | ja | r3-R3-inhalt |
| Kontakt, Beratung, Newsletter | `/de/kontakt`, `/de/beratung` | ja | r2-R2-leads, r4-R4-leads, r5-R5-leads-perf |
| Ratgeber | `/de/ratgeber`, 8 Artikel | **noindex**, bis freigegeben | r1-R1-ratgeber |
| Projekte | `/de/projekte` | Leerzustand ohne Referenzen | r5-R5-content |
| Bewerten | `/de/bewerten` (Ziel der QR-Karte) | – | r1-R1-event, release-check R5.4 |
| Adventsabend | `/de/adventsabend` | noindex, solange `startTime` fehlt | r1-R1-event |
| Labs | Stilfinder, AR-Viewer, Dreiländer-Rechner, Küchen- und Sofaplaner, Concierge | noindex | r2-R2-labs-*, r4/r5-portal-labs |
| Fehlerseiten | 404 in 4 Sprachen, globale 404 | – | r1-R1-plattform |
| Schweiz-Hub | `/de/einkaufen-aus-der-schweiz` | **noindex,follow**, Entwurf | r5-R5-schweiz |
| Kundenportal, Upload | `/de/portal`, `/de/upload/<token>` | noindex, Portal aus (Abschnitt 2) | r3-R3-portal-upload |

### 1.2 Funktionen (Auswahl, mit Bericht)

- **Formulare:** gehärtete APIs, Honeypot, Fehler-Codes, Fokus aufs Feld, Datenschutz-Hinweis unter jedem Formular, Herkunft und `lead_ref` (r1-R1-formulare, r2-R2-leads, r4-R4-leads).
- **Claim-Schutz:** Claim-Guard und Prüfskripte für Händler-Aussagen und Superlative; nur ClassiCon ist im Claim-Register (`src/lib/legal/claims.js:19`). Prod-Lauf R5: 910 URLs, 0 Händler, 0 Superlative (release-check R5.1).
- **NAP:** überall Landstraße 11 (Inhaber-Entscheidung 2), Telefonnummer einheitlich (release-check R5.5).
- **Geprüfte Produkttexte:** 62 Einträge mit Text-Hash-Freigabe, Startliste mit 10 Texten (r1-R1-produkttexte, r3-R3-produkt).
- **Sitemap, llms.txt, hreflang, JSON-LD:** r1-R1-seo, r2-R2-seo, r4-R4-seo.
- **Cookie-Banner und Consent:** r3-R3-shell, r4-R4-recht-consent. Banner-Texte `Cookies.intro`/`thirdCountryNotice` warten auf die Kanzlei.
- **Rechtstext-Vorschau für die Kanzlei:** `/de/preview/recht` (r3-R3-recht-vorschau).
- **Gutschein-Anfrage und Atelierverkauf** hinter Schaltern, ohne Geld (r5-R5-commerce, `features/commerce.md`).
- **Labs:** AR-Viewer, Stil-Finder, Dreiländer-Rechner, KI-Concierge, Küchen- und Sofaplaner (`features/*.md`).
- **Kundenportal und Handy-Upload** (`features/kundenportal.md`, `features/handy-upload.md`).
- **Betrieb:** `scripts/deploy.sh` (Release-Ordner, Symlink, Rollback), CI-Pipeline, Bundle-Budget, Rate-Limits (r4-R4-plattform-ci).
- **QR-Karte Bewerten:** Dateien in `Marktresearch/marketing/qr/`, nichts gedruckt (release-check R5.4).

Der Stand des Release-Tors (Tests, TBT-Budget, Bildband, `/cmx`-404) wird in Runde 6 von den Code-Paketen geschlossen und in `release-check.md` (Abschnitt Runde 6) belegt. Diese Mappe wiederholt die Zahlen dort nicht.

---

## 2. Was bewusst abgeschaltet ist

| Teil | Zustand heute | Was es zum Einschalten braucht | Technisch |
|---|---|---|---|
| Gutschein-Anfrage | aus: `/gutscheine`, `/gutscheinbedingungen`, `/api/gutschein_anfrage` liefern 404 | Insolvenzrechtler + Steuerberater, Kanzlei (Bedingungen, Widerruf), dann `TERMS_STATUS` auf `"freigegeben"` **und** `VOUCHER_MODE=anfrage` | `src/lib/commerce/voucherTerms.js:15`, `src/lib/commerce/mode.js:51` |
| Atelierverkauf | aus: `/atelierverkauf`, `/api/atelier_reservierung` liefern 404 | wie oben, dazu Inventur, Zustandsbeschreibungen, Sheet | `ATELIER_MODE` (`mode.js:56`), `ATELIER_CSV_URL` (`src/lib/commerce/atelierSource.js:235`) |
| Commerce-Vorschau | nur Dev oder `COMMERCE_PREVIEW=1`, nie auf Vercel-Produktion | in Produktion **nicht** setzen | `mode.js:68` |
| Rechtstext-Vorschau | nur Dev oder `LEGAL_PREVIEW=1` | in Produktion nicht setzen | `src/components/LegalDrafts/index.js:25` |
| Freigabe-Cockpit | nur Dev oder `FREIGABE_PREVIEW=1` | in Produktion nicht setzen | `src/components/Freigaben/model.js` (`freigabePreviewEnabled`) |
| Planer senden/speichern | aus im Produktions-Build | Datenschutz-Abschnitt „Online-Planer“ (Kanzlei), dann `NEXT_PUBLIC_LABS_PLANER_SENDEN=1` **beim Build** | `src/components/Labs/Kuechenplaner/release.js:24` |
| Planer-Preise | verborgen („Richtpreis im Gespräch“) | Inhaber gibt seine Preistabelle frei (`placeholder: false`) | `src/components/Labs/Kuechenplaner/catalog.js:121`, `src/components/Labs/Sofaplaner/model.js:167` |
| Termin online | aus (`BOOKING_PROVIDER` fehlt = `none`) | Tool entschieden (Rechtspaket W9), AVV, DSE-Absatz; dann `BOOKING_PROVIDER=link` und `BOOKING_URL` | `src/components/Booking/config.js:16` |
| Kundenportal | Login in Produktion aus, solange `PORTAL_SESSION_SECRET` fehlt; keine Mails ohne Mail-Anbieter | **erst nach Next 16.4.2** (Server-Actions-DoS, release-check R4.6), dann Secrets und Mail-Anbieter | `src/lib/portal/config.js:38`, `src/lib/portal/mailer.js` |
| KI-Concierge | ohne Schlüssel „nicht verfügbar“ | Anbieterentscheidung W12 (EU-Verarbeitung), DSFA | `src/lib/concierge/config.js` |
| Google Ads | aus, solange `NEXT_PUBLIC_GOOGLE_ADS_ID` fehlt | Inhaber-Entscheidung, Banner C7 (Kanzlei) | `src/lib/legal/services.js:36` |
| Projekte | Liste leer, Leerzustand | echte Referenz mit Freigabe des Kunden und Bildrechten | `src/lib/content/projekte.js:29` |
| Adventsabend | noindex, kein Event-Schema, kein .ics | Uhrzeit, Programm, Kapazität vom Inhaber | `src/app/[locale]/adventsabend/event.js:36` |
| Hero-Fotos ohne Freigabe | 4 Landingseiten mit typografischem Hero | schriftliche Bildfreigabe oder eigenes Foto | `src/components/Landing/imagery.js:42, 49, 83, 101` |

**noindex-Seiten (Stand Code):** Ratgeber (Hub und Artikel), Schweiz-Hub, Adventsabend ohne `startTime`, Projekte-Vorlage, alle Labs, Portal, Upload, Merkliste, Marke × Kategorie ausgeschlossen, Regionsseiten ohne Doorway-Freigabe, alle `/preview/*`-Seiten, Fehlerseiten. Keine davon steht in Sitemap oder llms.txt.

---

## 3. Umgebungsvariablen

Gesetzt werden sie auf dem Server in `shared/.env.production` (`scripts/deploy.sh`, Kopf), in der CI als Repo-Variable. **Nie im Repo, nie in dieser Mappe.** „Build“ = wirkt nur, wenn beim Build gesetzt; „Laufzeit“ = Neustart genügt.

### 3.1 Schalter (Freigaben)

| Variable | Zweck | Wann | Gelesen in |
|---|---|---|---|
| `VOUCHER_MODE` | Gutschein-Anfrage `off`/`anfrage`; wirkt nur bei freigegebenen Bedingungen | Laufzeit | `src/lib/commerce/mode.js:51` |
| `ATELIER_MODE` | Atelierverkauf `off`/`anfrage` | Laufzeit | `src/lib/commerce/mode.js:56` |
| `ATELIER_CSV_URL` | Veröffentlichungs-Tab des Atelier-Sheets; ohne Wert Leerzustand | Laufzeit | `src/lib/commerce/atelierSource.js:235` |
| `COMMERCE_PREVIEW` | Vorschau `/de/preview/commerce` in einem Vorschau-Build | Laufzeit | `src/lib/commerce/mode.js:68` |
| `LEGAL_PREVIEW` | Anwalts-Vorschau `/de/preview/recht` | Laufzeit | `src/components/LegalDrafts/index.js:25` |
| `FREIGABE_PREVIEW` | Freigabe-Cockpit `/de/preview/freigaben` | Laufzeit | `src/components/Freigaben/model.js` |
| `ERROR_PREVIEW` | Fehlerseiten-Vorschau | Build | `src/app/[locale]/preview/fehler/page.js:15` |
| `BRAND_CATEGORY_PREVIEW` | Vorschau Marke × Kategorie | Laufzeit | `src/app/[locale]/preview/marke-kategorie/[brand]/[category]/page.js:18` |
| `NEXT_PUBLIC_LABS_PLANER_SENDEN` | Senden/Speichern in den Planern | **Build** | `src/components/Labs/Kuechenplaner/release.js:24` |
| `BOOKING_PROVIDER` | Termin-Band `none`/`link` | vor Livegang auf Staging prüfen | `src/components/Booking/config.js:16` |
| `BOOKING_URL` | https-Ziel des Termin-Links | wie oben | `src/components/Booking/config.js:19` |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | Google-Ads-Tag (nur mit Einwilligung) | **Build** | `src/lib/legal/services.js:36` |
| `UPLOAD_DEMO_ENABLED` | Upload-Demo | Laufzeit | `src/lib/upload/service.js:24` |
| `CONCIERGE_MOCK` | Concierge ohne echtes Modell (nur Test) | Laufzeit | `src/lib/concierge/config.js:68` |
| `PH_SHOW_PLACEHOLDERS` | Platzhalter auf Markenseiten zeigen (nur Entwicklung) | Laufzeit | `src/components/MarkenItems/markenitems.js:68` |

### 3.2 Backoffice und Build

| Variable | Zweck | Gelesen in |
|---|---|---|
| `SERVER` | Basis-URL des Backoffice (auch CI-Variable) | `src/lib/apiBaseUrl.js:4` |
| `API_KEY`, `API_SECRET` | Zugang zum Backoffice | `src/lib/apiBaseUrl.js:5–6` |
| `REVALIDATE_SECRET` | Schutz des Revalidate-Endpunkts | `src/lib/revalidateAuth.js:13` |
| `BACKOFFICE_LOG` | Protokoll der Backoffice-Aufrufe | `src/lib/api/http.js:166` |
| `CMX_RATE_PER_MIN`, `SEARCH_RATE_PER_MIN`, `SEARCH_RATE_PER_HOUR` | Rate-Limits `/cmx` und Shop-Suche | `src/app/cmx/_lib/routeLimit.js:28–31` |
| `PORT` | Port des Next-Servers | `src/proxy.js:92`, `scripts/deploy.sh` |

### 3.3 Portal, Upload, Mails

| Variable | Zweck | Gelesen in |
|---|---|---|
| `PORTAL_SESSION_SECRET` | HMAC für Sitzung und Magic Link, mind. 32 Zeichen; ohne Wert ist der Login in Produktion aus | `src/lib/portal/config.js:38–44` |
| `PORTAL_BASE_URL` | öffentliche Adresse in Magic Links | `src/lib/portal/config.js:64` |
| `PORTAL_ADAPTER` | Datenquelle `mock`/`frappe` | `src/lib/portal/config.js:22` |
| `PORTAL_MAIL_PROVIDER` | `resend`/`postmark`/`frappe`/`webhook` | `src/lib/portal/mailer.js:65` |
| `PORTAL_MAIL_FROM`, `PORTAL_MAIL_API_KEY`, `PORTAL_MAIL_FRAPPE_METHOD`, `PORTAL_MAIL_WEBHOOK_URL`, `PORTAL_MAIL_WEBHOOK_SECRET` | Mail-Versand je Anbieter | `src/lib/portal/mailer.js:70–130` |
| `FRAPPE_URL`, `FRAPPE_API_KEY`, `FRAPPE_API_SECRET` | Frappe (Mail, Upload-Übergabe) | `src/lib/portal/mailer.js:122`, `src/lib/upload/frappeAdapter.js:28` |
| `UPLOAD_TOKEN_SECRET` | Signatur der Upload-Links, mind. 32 Byte | `src/lib/upload/token.js:19` |
| `UPLOAD_PUBLIC_BASE_URL` | Adresse im Upload-Link | `src/lib/upload/handoff.js:14` |
| `UPLOAD_STORAGE` | Speicherort der Uploads | `src/lib/upload/store.js:11` |
| `UPLOAD_TRUSTED_IP_HEADER` | IP-Header hinter nginx | `src/lib/upload/http.js:60` |

### 3.4 Labs

| Variable | Zweck | Gelesen in |
|---|---|---|
| `ANTHROPIC_API_KEY` | KI-Concierge (nur nach W12) | `src/lib/concierge/config.js:69` |
| `CONCIERGE_SECRET` | Token des Concierge | `src/lib/concierge/token.js:14` |
| `CONCIERGE_EFFORT`, `CONCIERGE_MAX_PER_SESSION`, `CONCIERGE_GLOBAL_DAILY`, `CONCIERGE_PROXY_HOPS` | Aufwand, Limits, Proxy-Tiefe | `src/lib/concierge/config.js:10–53` |
| `KUECHENPLANER_SECRET`, `LABS_SECRET`, `SOFAPLANER_SECRET` | Signatur gespeicherter Planungen | `src/components/Labs/Kuechenplaner/server/store.js:28`, `src/components/Labs/Sofaplaner/server/store.js:23` |
| `KUECHENPLANER_MAX_MB`, `KUECHENPLANER_MAX_PER_DAY` | Grenzen für Planungen | `src/components/Labs/Kuechenplaner/server/store.js:22–23` |
| `SOFAPLANER_TTL_DAYS` | Löschfrist Sofaplanungen | `src/components/Labs/Sofaplaner/server/retention.js:16` |
| `LABS_REDIS_REST_URL`/`_TOKEN` bzw. `UPSTASH_REDIS_REST_URL`/`_TOKEN` | gemeinsames Rate-Limit | `src/components/Labs/Kuechenplaner/server/rateLimit.js:26–27` |
| `KUECHENPLANER_IP_HEADER`, `LABS_IP_HEADER` | IP-Header für das Rate-Limit | `rateLimit.js:39` |

### 3.5 Betrieb (`scripts/deploy.sh`)

`APP_ROOT`, `REPO_DIR`, `PM2_APP`, `PORT`, `BIND_HOST` (nur `127.0.0.1`), `KEEP_RELEASES`, `HEALTH_URLS`, `HEALTH_WARN_URLS`, `HEALTH_TIMEOUT`, `DRY_RUN`. Gesetzt von der Plattform: `NODE_ENV`, `VERCEL_ENV`, `NEXT_RUNTIME`.

---

## 4. Freigabelisten nach Besitzer

Spalte „Technisch“ = Datei und Zeile, an der die Freigabe im Code wirkt. Das Cockpit zeigt den aktuellen Stand jeder Zeile.

### 4.1 Inhaber

| # | Freigabe | Technisch | Quelle |
|---|---|---|---|
| I1 | **Ratgeber**, je Artikel nach Prüfung aller [prüfen]-Stellen (8 Artikel, alle `freigegeben: false`) | `src/content/ratgeber/<datei>.md`, Front Matter `freigegeben:` und `reviewedBy:` (Zeile im Cockpit) | inhaber-entscheidungen „nicht entschieden“, release-check R5.6 |
| I2 | **Produkttexte**, je Text nach dem Lesen; Reihenfolge laut Startliste | `node src/lib/productCopy/approve.mjs --key <kategorie/slug> --by "Name"` → `src/content/productCopy/de.json`; geprüft in `src/lib/productCopy/approvals.js:83` | r1-R1-produkttexte, `src/lib/productCopy/startList.js` |
| I3 | **Bildfreigaben** der Herstellerbilder; ohne Freigabe kein neuer Bild-Host | Hero: `src/components/Landing/imagery.js:42, 49, 83, 101` (`released: false` entfernen); Hosts: `next.config.js:59` (`remotePatterns`); Register `Marktresearch/recht/bildrechte.csv` | release-check R5.6 |
| I4 | **Google Place-ID** für den Bewertungslink, vor dem Druck der QR-Karte | `src/lib/site.js:40` (`GBP.reviewUrl`) | release-check R5.6, r1-R1-event |
| I5 | **Adventsabend:** Uhrzeit, Programm, Kapazität, kostenlos ja/nein | `src/app/[locale]/adventsabend/event.js:36` (`startTime`), `:40` (`free`) | r1-R1-event |
| I6 | **Google Ads** ja/nein; GA4-Aufbewahrung 14 Monate (im GA4-Konto) | `NEXT_PUBLIC_GOOGLE_ADS_ID` → `src/lib/legal/services.js:36` | release-check R5.6 |
| I7 | **Preistabelle der Planer** | `src/components/Labs/Kuechenplaner/catalog.js:121`, `src/components/Labs/Sofaplaner/model.js:167` (`placeholder`) | r2-R2-labs-planer |
| I8 | **Termin-Werkzeug** (W9) | `BOOKING_PROVIDER`/`BOOKING_URL` → `src/components/Booking/config.js:16` | r4-R4-leads, Rechtspaket W9 |
| I9 | **Projekte** (Referenzen mit Kundenfreigabe) | `src/lib/content/projekte.js:29` | r5-R5-content |
| I10 | Entscheidungen aus Rechtspaket Abschnitt 8 (u. a. Aussteller der Gutscheine W14, Café getrennt W15, Hosterliste, Liefergebiet) | – (Voraussetzung für Kanzlei und Steuerberater) | Rechtspaket §8 |
| I11 | Externe Einträge auf Landstraße 11 (Google-Profil, Herold, ClassiCon) | außerhalb des Codes | inhaber-entscheidungen Nr. 2 |
| I12 | Commit nach `main` und Deploy | Abschnitt 5 | inhaber-entscheidungen „nicht entschieden“ |
| I13 | Next 16.4.2 ab 30.10.2026 einspielen lassen | Ablaufblatt in `release-check.md` | runde-6-plan |

### 4.2 Kanzlei

| # | Freigabe | Technisch | Quelle |
|---|---|---|---|
| K1 | **Datenschutzerklärung live** (nennt noch Privacy Shield), Ersatztexte C1/C2: **Go-live-Blocker** | `src/components/Datenschutz/datenschutz.js:62`; Entwurf `src/components/LegalDrafts/docs/datenschutz.js`, Vorschau `/de/preview/recht/datenschutz` | release-check R5.6, r4-R4-recht-consent |
| K2 | Banner C3, C4, C7, Einwilligung vs. lit b (Concierge, Upload, Planer); Banner-Texte `Cookies.intro`/`thirdCountryNotice` | `src/messages/*.json` (Schlüssel `Cookies.*`) | release-check R5.6, runde-6-plan R6-i18n |
| K3 | **Gutscheinbedingungen** (`[anwaltlich prüfen]`), Widerrufsbelehrung, Muster-Formular, Seite „Vertrag widerrufen“ (W5) | `src/lib/commerce/voucherTerms.js:15` (`TERMS_STATUS`) | Rechtspaket 4.1, r5-R5-commerce |
| K4 | **Impressum** Variante A, **AGB**-Übergangsfassung MW GmbH, Widerruf (Hausnummer 11) | Entwürfe `src/components/LegalDrafts/docs/{impressum,agb}.js`; live `src/components/Impressum/` | Rechtspaket W14, release-check R5.6 |
| K5 | Datenschutz-Abschnitt „Online-Planer“ | danach `NEXT_PUBLIC_LABS_PLANER_SENDEN=1` (Build) → `release.js:24` | r2-R2-labs-planer |
| K6 | Datenschutz-Abschnitt Terminbuchung (W9) | danach I8 | Rechtspaket 4.5 |
| K7 | Adventsabend: Abschnitt „Veranstaltungen“, Löschfrist und Foto-Text | `src/app/[locale]/adventsabend/event.js` | r1-R1-event |
| K8 | Barrierefreiheitserklärung (BaFG) | Entwurf `src/components/LegalDrafts/docs/barrierefreiheit.js` | Rechtspaket §1 |
| K9 | Fragen Rechtspaket §5.1–5.3 | – | Rechtspaket §5 |

### 4.3 Steuerberater (und Zollspediteur)

| # | Freigabe | Technisch | Quelle |
|---|---|---|---|
| S1 | Gutschein: Einzweck/Mehrzweck, Café getrennt (W15), Rückstellung | `voucherTerms.js:15` erst nach S1 und K3 | Rechtspaket §6 Nr. 1 |
| S2 | Atelierverkauf: Erlös, Rechnungsaussteller, Belegpflicht | `ATELIER_MODE` → `mode.js:56` | Rechtspaket §6 Nr. 3 |
| S3 | **Schweiz-Hub**: Text und CHF-Rechner, offene `pruefen`-Stellen | Freigabe = `robots` in `src/app/[locale]/einkaufen-aus-der-schweiz/page.js:35` auf index, Canonical/hreflang, Sitemap/llms-Eintrag; Texte `src/lib/ch/content.js` | r5-R5-schweiz, release-check R5.6 |
| S4 | Ratgeber „Möbel aus Österreich in die Schweiz“ fachlich | `src/content/ratgeber/moebel-aus-oesterreich-in-die-schweiz.md` (`freigegeben`) | r1-R1-ratgeber |
| S5 | Fragen Rechtspaket §6 | – | Rechtspaket §6 |

### 4.4 Insolvenz-/Gesellschaftsrechtler

| # | Freigabe | Technisch | Quelle |
|---|---|---|---|
| R1 | **Kundengeld in der Krise:** dürfen Gutscheine verkauft und Anzahlungen angenommen werden (Rechtspaket 0.1, §5.1 Nr. 1)? **Vor jeder anderen Commerce-Freigabe.** | bis dahin bleiben `VOUCHER_MODE` und `ATELIER_MODE` auf `off` (`mode.js:51/56`) | Rechtspaket 0.1, inhaber-entscheidungen |
| R2 | Wer gibt aus / verkauft bis zur Eintragung der Handels-GmbH (W14), Erwerberhaftung | – | Rechtspaket W14, Prüfvermerk |

Es gibt bewusst **keinen** Online-Zahlungsweg im Code („stripe_link“ ist nicht gebaut, `mode.js` Kopf).

### 4.5 Betrieb

| # | Aufgabe | Technisch | Quelle |
|---|---|---|---|
| B1 | Secrets `PORTAL_SESSION_SECRET`, `UPLOAD_TOKEN_SECRET` (zufällig, mind. 32 Byte) | `shared/.env.production` | release-check R5.6 |
| B2 | nginx nach Vorlage: `X-Forwarded-For`, `no-store` für 404 von `/cmx`, Upstream nur `127.0.0.1:3000`, www → apex, http → https | `tools/ci/nginx-platzhirsch.conf.example` | release-check R5.6 |
| B3 | `deploy.sh` mit `BIND_HOST` auf Loopback (Standard im Skript), Rollback trocken (`DRY_RUN=1`), dann Staging | `scripts/deploy.sh` | r4-R4-plattform-ci |
| B4 | CI-Variable `SERVER`, Netz für Backoffice und Google Fonts | `.github/` | release-check R5.6 |
| B5 | Monitoring/Uptime (E11), `report-to`-Endpunkt vor dem Erzwingen der CSP, AV-Verträge | `next.config.js` (CSP Report-Only) | release-check R5.6 |
| B6 | Händlertexte im Backoffice (`dealers_description_*`, 4 Sprachen) auf Standardformel, außer ClassiCon | Backoffice | Rechtspaket S2 |
| B7 | Nach dem Deploy: `check-claims --live`, Sitemap in der Search Console, nach 7 Tagen 404-Report | `tools/checks/check-claims.mjs` | release-check R5.6 |
| B8 | Postfach `datenschutz@platzhirsch.studio` mit zuständiger Person | – | Rechtspaket S7 |
| B9 | In Produktion **nie** setzen: `COMMERCE_PREVIEW`, `LEGAL_PREVIEW`, `FREIGABE_PREVIEW`, `ERROR_PREVIEW`, `CONCIERGE_MOCK`, `PH_SHOW_PLACEHOLDERS`, `UPLOAD_DEMO_ENABLED` | Abschnitt 3 | release-check R5.6 |

---

## 5. Deploy-Reihenfolge

Verbindlich ist die Go-live-Liste in `Marktresearch/digital/teamleiter/release-check.md` (R5.6, ergänzt durch den Abschnitt Runde 6 mit dem Ablaufblatt Next 16.4.2). Deployt wird erst, wenn jeder Punkt dort erledigt ist. Kein Go-live-Datum ist festgelegt.

1. **Code-Tor grün:** `npm run check:prod -- --label=<name>` mit 0 rot, Claims/NAP/facts 0, logscan 0 (release-check §1, Lauf `r6-ende`).
2. **Ab 30.10.2026 Next 16.4.2:** isoliert, dann im Repo, dann `check:prod`, Dev-Server neu starten (release-check R4.6, R5.3, Ablaufblatt Runde 6).
3. **Kanzlei K1** (Datenschutzerklärung live): ohne diese Freigabe kein Go-live.
4. **Server vorbereiten:** B1–B5.
5. **Inhaber I12:** Commit/Merge nach `main`; CI grün.
6. **Deploy:** `DRY_RUN=1 scripts/deploy.sh deploy`, dann Staging, dann Produktion. Rollback: `scripts/deploy.sh rollback`.
7. **Nach dem Deploy:** B7, B6.
8. **Danach einzeln, je nach Freigabe** (jeweils Staging zuerst):
   - Inhalt ohne Schalter (Code-Änderung + Deploy): Ratgeber (I1), Produkttexte (I2), Hero-Fotos (I3), Place-ID (I4), Adventsabend (I5), Projekte (I9), Schweiz-Hub (S3).
   - Laufzeit-Schalter (Neustart): `ATELIER_MODE` nach R1, R2, S2; `VOUCHER_MODE` nach R1, K3, S1 **und** Code-Änderung `TERMS_STATUS`.
   - Build-Schalter (neuer Build): `NEXT_PUBLIC_LABS_PLANER_SENDEN` nach K5; `NEXT_PUBLIC_GOOGLE_ADS_ID` nach I6 und K2.
   - Termin: `BOOKING_PROVIDER`/`BOOKING_URL` nach I8 und K6.
   - Portal zuletzt: nur mit Next 16.4.2, Secrets und Mail-Anbieter.

---

## 6. Noten der Runden 1–5

Noten aus den QA-Feedbacks (`qa-screenshots/teamleiter/<runde>-<paket>/feedback.md`), jeweils vor der Nachbesserung; die Nachbesserungen stehen im Bericht des Pakets.

| Runde | Pakete und Note |
|---|---|
| 1 | event 8 · formulare 6 · legal 7 · plattform 8 · produkttexte 8 · ratgeber 7 · seo 8 · tests 7 |
| 2 | labs-erlebnis 7 · labs-planer 8 · labs-service 8 · leads 8 · qualitaetsnetz 8 · seo 8 · upload 8 |
| 3 | i18n 8 · inhalt 8,5 · landing 8 · marken-seo 9 · portal-upload 8 · produkt 8 · recht-vorschau 8,5 · release 8 · shell 8 · startseite 8 |
| 4 | i18n 8 · leads 8 · plattform-ci 7 · portal-labs 9 · produkt 8 · recht-consent 8 · release 7 · seo 8 · shell-perf 8 |
| 5 | commerce 8 · content 8 · i18n 7 · leads-perf 7 · portal-labs 8 · produkt 8 · release 8 · schweiz 8 · shell-seo 8 |

Abnahmen der Seitenbereiche (`qa-screenshots/neuauftritt/*/abnahme.md`): Header/Footer 8,5 · Inhaltsseiten 8 · Landingpages 8 · Marken 8 · Produkte 8 · Recht-Texte 8 · Startseite 8. Features (`qa-screenshots/<feature>/abnahme.md`): AR-Viewer 7 · Concierge 8 · Dreiländer-Rechner 8 · Handy-Upload 8 · Küchenplaner 8 · Kundenportal 7,5 · Outdoor 7,5 · Sofaplaner 8 · Stilfinder 8 · Yacht 7.

---

## 7. Freigabe-Cockpit `/de/preview/freigaben`

- **Öffnen:** im Dev-Server (`npm run dev`) unter `http://localhost:3000/de/preview/freigaben`, oder auf einem Vorschau-Server mit `FREIGABE_PREVIEW=1`. Für die Links in die Rechtsentwürfe zusätzlich `LEGAL_PREVIEW=1`, für die Commerce-Vorschau `COMMERCE_PREVIEW=1`. Die Entwurfsansicht der Produkttexte (`?produkttext=vorschau`) gibt es nur im Dev-Server.
- **Inhalt:** Schalter (nur wirksamer Zustand, nie Werte), Ratgeber mit Zeilen jeder [prüfen]-Stelle, 62 Produkttexte mit Status (ganz/teilweise/veraltet/nicht freigegeben) und Startliste, Hero-Fotos aus dem Bildregister, Rechtsentwürfe mit Zahl der offenen Stellen, Gutschein/Atelier, Schweiz-Hub mit offenen Stellen.
- **Freigeben:** nicht im Cockpit, sondern an der genannten Stelle (Abschnitt 4). Danach zeigt das Cockpit den neuen Stand.
- **Schutz:** EN/FR/IT immer 404, noindex/nofollow, nicht in Sitemap, llms.txt oder Navigation, kein Formular. Gesperrte Namen (Ratgeber-Embargo) werden maskiert.
- **Vorschau-Deploy:** `FREIGABE_PREVIEW=1` auf einem Vercel-Preview öffnet das Cockpit für jeden, der die URL kennt. Es zeigt keine Werte, aber interne Pfade und den Stand der Schalter. Deshalb nur setzen, wenn für dieses Deployment die Vercel Deployment Protection aktiv ist.
- **Anzeige Ratgeber:** „geprüft am …“ erscheint nur bei `freigegeben: true` mit eingetragenem Prüfer. Steht nur ein Datum im Artikel, zeigt das Cockpit „Datum … eingetragen, Prüfung offen“.
- **Portal-Schalter:** Ist Login oder Mailversand auf einem Server eingerichtet, zeigt das Cockpit den Zustand als Warnung („noch nicht freigegeben“), bis R4.6 (Next 16.4.2) erledigt ist.
- **Prüfung:** `tests/unit/r6-uebergabe.test.mjs`, `tests/e2e/r6-uebergabe.spec.js` (Desktop) und `tests/e2e/r6-uebergabe-a11y.spec.js` (iPhone, Pixel und Desktop; der Dateiname passt auf `MOBILE_SPECS` in `playwright.config.js`); `check:prod --freigabe-preview` prüft das Cockpit im Prod-Build.

---

## 8. Was auf keinen Fall passieren darf

Aus Rechtspaket §9 und inhaber-entscheidungen: keine Anzahlungen und keine Gutscheine ohne Freigabe zu 0.1, keine Händler-Aussage außer ClassiCon, keine Streichpreise ohne 30-Tage-Tiefstpreis, kein Rechtstext live ohne Kanzlei, keine Herstellerbilder ohne Freigabe, keine Preise ohne Freigabe, keine Veröffentlichung der Ratgeber mit [prüfen]-Stellen, kein Tracking ohne Einwilligung.
