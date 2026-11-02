# 13 – Web-Performance, Barrierefreiheit und Engineering: Bauplan

**Stand:** 26.10.2026 · **Rolle:** Senior Frontend-Engineering (Next.js, Core Web Vitals, WCAG 2.2 AA)
**Grundlage:** Code-Audit des Repos (Next.js 16.3.4, React 19.2, next-intl 4.13, Tailwind 4), Produktions-Build in `.next/` vom 26.10.2026, Live-Messungen auf https://platzhirsch.studio (curl und Lighthouse 12.8.2, mobil, simuliertes 4G), Next-16-Doku in `node_modules/next/dist/docs/` (Caching, Images, Error-Handling, Self-Hosting, CSP, Instrumentation, Package-Bundling), Masterkonzept 23 (Abschnitte 1, 4, 9, 10), SEO-Schlachtplan 25 und die Schwesterpläne `digital/01` (Luxus-UX) und `digital/02` (Animation).

> **Kernaussage:** Die Website ist gemessen schon jetzt technisch besser als jeder Vertragshändler der Region und schneller als die Markenseiten von Minotti und Poliform. Drei versteckte Schwachstellen kosten aber Ranking, Ausfallsicherheit und Sicherheit: (1) **keine einzige Seite unter `/[locale]` wird statisch oder per ISR ausgeliefert**, alles wird bei jedem Aufruf neu gerendert (`Cache-Control: private, no-store`). (2) **`/api/image` ist ein offener Proxy auf das Backoffice**, live bestätigt. (3) **Es gibt keine Tests, keine CI, kein Monitoring und keine Error-Boundaries.** Fällt das Backoffice aus, merkt es niemand, und Google sieht leere Seiten. Alle drei Punkte sind **ohne Backoffice-Zugang** in 1–2 Wochen behebbar. Danach brauchen 3D, Konfigurator und KI verbindliche Leitplanken (Abschnitt 3.3), damit der Geschwindigkeitsvorsprung nicht wieder verloren geht.

---

## 1. Ist-Zustand im Code

### 1.1 Messwerte (live, 26.10.2026, Lighthouse mobil)

| Seite | Perf | A11y | Best Pr. | SEO | LCP | TBT | CLS | Gewicht | Auffällig |
|---|---|---|---|---|---|---|---|---|---|
| `/de` | 87 | 100 | 100 | 100 | **3,8 s** | 130 ms | 0 | 658 KiB | LCP-Bild ohne `fetchpriority="high"`, Render-Delay 83 % des LCP, bfcache blockiert |
| `/de/produkte` | 88 | 100 | 100 | 100 | **3,8 s** | 120 ms | 0 | 680 KiB | **LCP-Bild ist `loading="lazy"`** (erste Kategoriekachel), Legacy-JS |
| `/de/kontakt` | 91 | **96** | 96 | 100 | 3,4 s | 90 ms | 0 | 505 KiB | **Kontrast 2,05:1** (Gold `#d1b250` auf Weiß), verzerrtes Marker-Bild |

Weitere Messungen (curl): TTFB 140–210 ms, Startseite 380 KB HTML roh / 65 KB gzip, davon **ca. 180 KB Inline-Skripte** (RSC-Payload mit allen Übersetzungen), 14 Skript-Dateien mit **ca. 238 KB JS gzip**. Auslieferung nur gzip, kein Brotli. Bilder werden korrekt als AVIF ausgeliefert (`/_next/image`, `X-Nextjs-Cache: HIT`).

### 1.2 Befunde nach Bereich

| # | Bereich | Befund | Fundstelle | Schwere |
|---|---|---|---|---|
| B1 | **Rendering/Caching** | Keine der 32 `page.js` ruft `setRequestLocale(locale)` auf; nur das Layout tut es. next-intl liest dann `headers()`, und **jede Seite wird dynamisch**. `.next/prerender-manifest.json` enthält 0 Routen unter `/[locale]`. Live-Header: `Cache-Control: private, no-cache, no-store`. Die 20× `export const revalidate = 3600` haben **keine Wirkung**. Folgen: Server rendert jeden Bot- und Nutzer-Aufruf, kein Full-Route-Cache, **bfcache aus** (Zurück-Taste lädt neu), höhere TTFB unter Last | `src/app/[locale]/**/page.js`, `src/app/[locale]/layout.js`, `src/i18n/config.js` | **hoch** |
| B2 | **Sicherheit** | `/api/image?path=…` holt **jeden beliebigen Pfad** vom Backoffice, auch API-Methoden. Live geprüft: `/api/image?path=/api/method/ping` → `{"message":"pong"}`, `…get_produkte_paths` → 196 KB JSON. Ohne Timeout, puffert alles im Speicher (`arrayBuffer`), `Access-Control-Allow-Origin: *`, 1 Jahr `immutable`. Origin-Check ist wirkungslos (fehlender Origin wird durchgelassen). Im Code **nirgends benutzt** (nur in `robots.js` freigegeben) | `src/app/api/image/route.js`, `src/app/robots.js` | **hoch** |
| B3 | **Formulare** | `/api/kontakt`, `/api/beratung_anfrage`, `/api/anfrage_produkt`: kein Rate-Limit, kein Honeypot (nur Newsletter hat einen), keine Längenbegrenzung, kein Timeout zum Backoffice, Backoffice-Fehlertexte und `error.message` gehen an den Browser (`details: errorData`). URLs hart verdrahtet statt `NEW_API_BASE_URL` | `src/app/api/*/route.js` | **hoch** (Spam, Lead-Verlust) |
| B4 | **Fehlerbehandlung** | Keine `error.js`, keine `global-error.js`, keine `loading.js`. Nur 4 der ~20 Fetcher in `src/lib/api` haben `AbortSignal.timeout` (die 9 `Keywords/*`-Fetcher nicht). Fetcher liefern bei Fehlern `[]`/`null` → Seite rendert leer oder **404**. Bei ISR (nach B1-Fix) würde dieser leere Zustand für 1 h gecacht | `src/lib/api/**`, `src/app/[locale]/**` | hoch |
| B5 | **Client-Anteil** | Die ganze App hängt unter `'use client'` (`LoaderWrapper` → `ClientLayout`), 50 Client-Komponenten. `NextIntlClientProvider` bekommt **alle** Messages der Sprache (de: 55 KB roh) auf jeder Seite. Navbar 1.239 Zeilen Client-Code. Nur 1 Datei nutzt `next/dynamic` | `src/app/[locale]/LoaderWrapper.js`, `client-layout.js`, `src/components/Navbar/navbar.js` | mittel |
| B6 | **JS-Ballast** | `browserslist` in `package.json` (chrome ≥ 90, safari ≥ 15) erzwingt Polyfills (`Array.prototype.at`, `Object.hasOwn` …, ca. 14 KB, Lighthouse „Legacy JavaScript“). `react-slick` + `slick-carousel` (~15 KB gz + CSS + GIF), `react-share` (~20 KB gz, nur Jobseite), `react-icons` (2 Dateien) | `package.json`, 4 Slider-Komponenten | mittel |
| B7 | **Bilder** | Sehr gut: 0 rohe `<img>`, 44 Dateien mit `next/image`, AVIF/WebP. Schwächen: `priority` ist in Next 16 **veraltet** (17 Stellen, Ersatz `preload` bzw. `fetchPriority="high"`, siehe `docs/01-app/03-api-reference/02-components/image.md` Z. 291); Hero ohne mobilen Zuschnitt (189 KB WebP-Quelle); `dangerouslyAllowSVG: true` **ohne** `images.contentSecurityPolicy`/`contentDispositionType`; `qualities` erlaubt 100; `remotePatterns` enthält `images.unsplash.com`, `www.next125.com`, `www.treca-paris.com` (Bildrechte!); `headers()` setzt für **alle** `.jpg/.webp/…` unter `public/` `immutable` 1 Jahr, obwohl diese Dateinamen keinen Hash tragen → ein ersetztes Bild bleibt bis zu 1 Jahr alt im Browser | `next.config.js`, `src/components/**` | mittel |
| B8 | **/cmx-Proxy** | Gut gebaut: Allowlist `files/…` + Dateiendung, Timeout 15 s, Streaming, SVG-Sandbox. Offen: kein Rate-Limit, Timeout 15 s ist zu lang für Bilder auf dem LCP-Pfad | `src/app/cmx/[...path]/route.js` | niedrig |
| B9 | **Fonts** | Gut: `next/font` (Montserrat + Bodoni Moda, selbst gehostet, `display: swap`). 4 Font-Preloads im `Link`-Header; Bodoni mit `opsz`-Achse ist groß. Schrift-Wechsel siehe `digital/01` | `src/app/[locale]/layout.js` | niedrig |
| B10 | **Revalidierung** | Gut: Tag-basierte Webhooks mit `timingSafeEqual` (`src/lib/revalidateAuth.js`), `revalidateTag(tag, { expire: 0 })` nach Next-16-API. Altlast `src/lib/revalidate.js` (`revalidatePath`, ohne Auth) wirkt ungenutzt → löschen | `src/app/revalidate/*`, `src/lib/revalidate*.js` | niedrig |
| B11 | **Security-Header** | Vorhanden: HSTS preload, nosniff, X-Frame-Options, Referrer-Policy. Fehlt: **CSP** (auch `frame-ancestors`, `object-src`, `base-uri`, `form-action`). `X-XSS-Protection` ist veraltet → entfernen | `next.config.js` | mittel |
| B12 | **Tests/CI** | **Keine Tests**, kein Test-Runner, kein `.github/`, nur `npm run lint`. Kein Bundle-Budget | `package.json` | hoch |
| B13 | **Betrieb** | PM2 `fork`, 1 Instanz, `max_memory_restart: 1G`, Logs nach `/var/log/*.log` ohne Rotation; nginx 1.18 davor. Unklar, wo gebaut wird; ein Build auf dem Live-Server ohne getrennten Ordner führt zu Ausfällen während `next build` | `ecosystem.config.js` | mittel |
| B14 | **Monitoring** | Kein Sentry o. ä., keine `instrumentation.js` (`onRequestError`), keine Web-Vitals-Feldmessung, kein Uptime-Check. Fehler landen nur als `console.error` im PM2-Log | – | hoch |
| B15 | **Barrierefreiheit** | Siehe 1.3 | – | mittel |

### 1.3 WCAG-2.2-AA-Befunde

| Kriterium | Befund | Fundstelle |
|---|---|---|
| 1.4.3 Kontrast | **151×** `text-[#d1b250]` und 56× `bg-[#d1b250]` (mit weißer Schrift) = 2,05:1. Das Token `--color-gold-text` (#7a5f17, ≈4,9:1) existiert bereits, wird aber kaum genutzt | `src/components/**`, `src/app/globals.css` Z. 13–14 |
| 1.4.11 / 2.4.13 Fokus | Fokusrahmen `#d1b250` auf Weiß = 2,05:1 (< 3:1) | `globals.css` Z. 130 |
| 2.4.1 Blöcke überspringen | **Kein Skip-Link** zu `<main id="main">` | `client-layout.js`, `navbar.js` |
| 2.4.11 Fokus nicht verdeckt (neu in 2.2) | Fixierter Header + `MobileCtaBar`; `scroll-padding-top` gibt es, unten fehlt `scroll-padding-bottom` für die CTA-Leiste | `globals.css` Z. 27–31, `MobileCtaBar.js` |
| 2.2.2 Pausieren | Marken-Karussell mit `autoplay` 3–3,5 s, nur `pauseOnHover`, **kein Pause-Knopf** (Tastatur, Touch) | `src/components/MarkenItems/markenitems.js` Z. 88–102 |
| 2.5.8 Zielgröße (neu in 2.2) | Breadcrumbs (~16 px), Slick-Dots (20 px), Galerie-Pfeile (28 px) – laut `docs/seo-ux/02-implementation-report.md` Z. 150 offen | `breadcrumbBar.js`, `productGallery.js` |
| 3.3.2 Beschriftungen | Kontaktformular nur mit `aria-label` + Platzhalter, keine sichtbaren Labels (20 Labels für 32 Inputs im ganzen Projekt) | `src/components/Kontakt/kontakt.js` Z. 348–410 |
| 3.3.1 / 3.3.3 Fehler | Nur 1× `aria-invalid`, 1× `aria-describedby` im Projekt: Feldfehler werden nicht am Feld angesagt | alle Formulare |
| 3.2.2 Bei Eingabe | Beratungsformular springt 500 ms nach Klick automatisch zum nächsten Schritt | `BeratungClient.js` Z. 75–80 |
| 1.1.1 / 4.1.2 | Positiv: alle Bilder mit `alt`, Navbar mit `aria-expanded`, `dialog`, Escape (Relaunch). Lighthouse A11y 100 auf Start/Produkte | – |

**Recht:** Das österreichische Barrierefreiheitsgesetz (BaFG, seit 28.06.2025, Umsetzung des European Accessibility Act) gilt für Dienstleistungen im elektronischen Geschäftsverkehr, also sobald es Kasse, Gutscheinkauf oder Online-Terminbuchung mit Vertragsschluss gibt. Kleinstunternehmen (< 10 Beschäftigte **und** ≤ 2 Mio. € Umsatz oder Bilanzsumme) sind bei Dienstleistungen ausgenommen. Ob Platzhirsch darunter fällt, hängt an der Umsatzzahl der künftigen Handels-GmbH (Masterkonzept 11) → mit dem Anwalt klären. Unabhängig davon: WCAG 2.2 AA als technisches Ziel, weil es auch Conversion und SEO hilft.

---

## 2. Benchmark

### 2.1 Gemessen (Lighthouse 12.8.2, mobil, gleiche Bedingungen, 26.10.2026, Startseite)

| Website | Technik | Perf | A11y | SEO | LCP | TBT | CLS | Gewicht |
|---|---|---|---|---|---|---|---|---|
| **platzhirsch.studio** | Next.js 16 | **87** | **100** | **100** | **3,8 s** | 130 ms | **0** | **658 KiB** |
| hoettges.at | WordPress, jQuery, Swiper | 59 | 90 | 100 | 13,0 s | 50 ms | 0,001 | 2.968 KiB |
| reiter.design | WordPress, jQuery, Swiper + Slick | 53 | 88 | 92 | 5,6 s | 30 ms | **0,501** | 866 KiB |
| minotti.com | eigenes Frontend, Vimeo | 46 | 72 | 75 | 18,9 s | 200 ms | **0,403** | 6.526 KiB |
| poliform.it | WordPress, jQuery, Swiper | 36 | 87 | 85 | 18,8 s | 950 ms | 0 | 3.111 KiB |
| connox.at | Shopify | 27 | 91 | 100 | 15,4 s | 3.330 ms | 0,001 | 3.690 KiB |
| ambientedirect.com | Magento | 47 | 80 | 100 | 3,8 s | 3.980 ms | 0,091 | 5.962 KiB |
| conranshop.co.uk | Shopify | 51 | 96 | 83 | 10,6 s | 400 ms | 0 | 1.061 KiB |
| fretz.de | GSAP, jQuery, Video | 53 | 100 | 92 | 19,8 s | 550 ms | 0,024 | **44.425 KiB** |
| dolcevita.at | WordPress, jQuery, Swiper | 55 | 100 | 100 | 7,1 s | 330 ms | 0 | 1.157 KiB |
| rh.com | – | Lighthouse vom Bot-Schutz abgewiesen (`ERRORED_DOCUMENT_REQUEST`) | | | | | | |

Hinweis: Einzelläufe, Netzwerk-Schwankungen von ±10 Punkten sind normal; die Abstände sind aber eindeutig.

Technik-Fingerprint aus dem HTML (Scratchpad-Abzug): Dolce Vita, Teo Jakob, Gamma, Höttges, reiter = WordPress mit jQuery und Swiper/Slick; Fretz und Gamma mit GSAP; Conran und Connox = Shopify; keiner der regionalen Händler hat `hreflang` auf mehr als einer Sprache außer Teo Jakob, keiner hat einen Produktkatalog mit Produkt-JSON-LD.

### 2.2 Was die Besten weltweit technisch machen

| Vorbild | Was sie gut machen | Übernehmen? |
|---|---|---|
| **RH (rh.com)** | Riesige Bildwelten, aber Bilder über eigenes CDN mit Art-Direction (mobil eigener Zuschnitt), Galerien erst bei Interaktion geladen | Ja: mobiler Hero-Zuschnitt, Galerie-Lightbox per `next/dynamic` |
| **Conran Shop, Connox** (Shopify) | Starke Produktdaten (Preis, Lieferzeit, Merchant-Feed), aber 3,3 s TBT durch Dutzende Apps/Tracker | Daten ja, Skript-Last nein: Drittanbieter nur nach Consent und mit Budget |
| **AmbienteDirect** | LCP 3,8 s trotz 6 MB, weil das LCP-Bild früh und priorisiert kommt; 4 s TBT durch Tracking | LCP-Disziplin ja, Tracking-Wildwuchs nein |
| **Minotti, Poliform** | Bildsprache und Ruhe; technisch schwach (LCP 19 s, CLS 0,4, Vimeo-Player) | Nur die Ästhetik, nicht die Technik |
| **Next.js-Referenzen (Vercel Commerce)** | Statisch vorgerenderte Produktseiten + Tag-Revalidierung, Server Components als Standard, Client-Inseln | Ja, genau das ist B1/B5 |

### 2.3 Was die regionalen Wettbewerber nicht haben (unser technischer Vorsprung)

- **Performance 87 gegen 53–59** bei allen regionalen Händlern, LCP 3,8 s gegen 5,6–19,8 s, Seitengewicht 0,66 MB gegen 0,9–44 MB (Fretz).
- **Lighthouse-SEO 100 und A11y 100** (Höttges 90/100, reiter 88/92; Dolce Vita ebenfalls 100/100).
- **CLS 0** (reiter 0,5 = springende Seite, Minotti 0,4).
- **4 Sprachen mit hreflang**, Produkt-JSON-LD, Sitemaps mit echtem `lastmod`, `llms.txt`.
- **Einen Katalog** mit 1.765 Produktseiten und On-Demand-Revalidierung aus dem Backoffice.
- Nicht vorhanden bei uns und bei allen anderen: Feld-Messung der Web Vitals, Monitoring, CSP. Wer das zuerst hat, hält den Vorsprung messbar.

**Fazit:** Der Abstand zu den Händlern ist groß (LCP Faktor 1,5–5, Seitengewicht Faktor 1,3–67). Gefährlich ist nicht die Konkurrenz, sondern **dass neue Features (3D, Konfigurator, KI, Tracking) den Vorsprung auffressen**. Deshalb kommen die Leitplanken (3.3) vor den Features.

---

## 3. Konzept und Zielbild

### 3.1 Zielbild in einem Satz
**Die schnellste, stabilste und zugänglichste Einrichtungs-Website im Dreiländereck: jede Seite statisch vorgerendert und per Webhook aktualisiert, jede Funktion als kleine Client-Insel, jeder Fehler sofort gemeldet, und jedes neue Feature muss durch ein automatisches Budget-Tor.**

### 3.2 Architektur-Prinzipien
1. **Server Components als Standard.** `'use client'` nur an Blättern (Formular, Merkliste-Herz, Galerie, Suche). Das Shell-Layout (Navbar-Gerüst, Footer) wird Server-Komponente mit kleinen Client-Inseln.
2. **Statisch + Tag-Revalidierung** (bisheriges Modell, `docs/01-app/02-guides/caching-without-cache-components.md`). `cacheComponents`/`'use cache'` erst prüfen, wenn alles stabil läuft (große Migration, `migrating-to-cache-components.md`).
3. **Last good version gewinnt.** Wenn das Backoffice ausfällt, wird die zuletzt gute Seite weiter ausgeliefert, nie eine leere oder 404.
4. **Drittanbieter nur nach Consent, nur verzögert, nur mit Budget.**
5. **Messen vor Meinen:** Feld-Daten (web-vitals → GA4), Labor-Daten (Lighthouse CI), Fehler (Sentry/GlitchTip), Uptime.
6. **Wenig Pflege:** jede Regel als Automatik (CI-Check, Budget, Lint-Regel), nicht als Wiki-Seite. Das Team hat 5 Personen und keinen Vollzeit-Entwickler.

### 3.3 Technische Leitplanken für alle neuen Features (verbindlich)

**Performance-Budget (p75 Feld-Daten mobil, Labor-Werte in Klammern als CI-Grenze):**

| Metrik | Ziel | CI-Grenze (Lighthouse mobil) | Heute |
|---|---|---|---|
| LCP | ≤ 2,0 s | ≤ 2,5 s | 3,4–3,8 s |
| INP | ≤ 150 ms | TBT ≤ 200 ms | TBT 90–130 ms |
| CLS | ≤ 0,05 | ≤ 0,1 | 0 |
| JS initial pro Route (gzip) | ≤ 170 KB gesamt, davon App-Code ≤ 70 KB | Fehler bei > 190 KB | ~238 KB |
| HTML inkl. RSC-Payload (gzip) | ≤ 50 KB | Warnung bei > 60 KB | 65 KB |
| Hero-/LCP-Bild | ≤ 120 KB mobil (AVIF) | – | 15–190 KB je nach Breite |
| Ein Feature zusätzlich im Initial-Bundle | ≤ 10 KB gzip | `size-limit` je Einstiegspunkt | – |
| Lighthouse A11y/SEO | 100 | ≥ 95 | 96–100 |

**Regeln für schwere Features (3D, AR, Konfigurator, KI-Raumplaner, Video, Chat, Terminbuchung):**
1. **Nie im LCP-Pfad und nie im Initial-Bundle.** Laden per `next/dynamic(() => import(...), { ssr: false })` erst **nach Klick** auf eine Fassade (Vorschaubild + Button „3D ansehen“), siehe `docs/01-app/02-guides/lazy-loading.md`. Die Fassade ist ein Server-gerendertes `next/image`.
2. **Code-Splitting pro Feature:** eigene Route oder eigener dynamischer Chunk; keine Imports von `three`, `@google/model-viewer` usw. in geteilten Komponenten. CI prüft das mit `size-limit` und `next experimental-analyze`.
3. **3D-Assets:** GLB ≤ 3 MB (Ziel 1,5 MB), Meshopt- oder Draco-Kompression + KTX2-Texturen mit `@gltf-transform/cli` 4.5.1 (MIT), Poster-Bild Pflicht, `loading="lazy"`/`reveal="interaction"` bei model-viewer, kein Auto-Rotate bei `prefers-reduced-motion`. Assets vom eigenen Server mit Hash im Namen (immutable).
4. **KI-Funktionen** (lokale NVIDIA-GPU): die GPU ist **kein** Web-Backend. Jobs gehen asynchron über eine Warteschlange (Anfrage → Backoffice/Queue → GPU-PC holt ab → Ergebnis per E-Mail oder Link). Kein Seiten-Render wartet auf die GPU. Timeout pro Aufruf ≤ 8 s, sonst Fallback „Wir melden uns“.
5. **Animation:** nur CSS/View Transitions (siehe `digital/02`), `transform`/`opacity`, Dauer ≤ 450 ms, `prefers-reduced-motion` respektieren, kein Scroll-Hijacking, kein Inhalt mit `opacity: 0` vor Hydration (das tut `FadeInView` heute; Ablösung durch CSS Scroll-Driven Animations).
6. **Barrierefreiheit:** jedes Feature tastaturbedienbar, sichtbarer Fokus ≥ 3:1, Zielgrößen ≥ 24 px, Text-Alternative für 3D/Konfigurator (Maße, Varianten als Liste), axe-Prüfung ohne Fehler in CI.
7. **Daten vom Backoffice:** nur über den gemeinsamen Fetch-Wrapper (F2) mit Timeout, Cache-Tag und Fallback. Kein `cache: "no-store"` auf Seiten außer der Suche.
8. **Drittanbieter-Skripte:** nur über `next/script` mit `strategy="lazyOnload"` und nur nach Consent; jedes neue Skript braucht einen Eintrag in der CSP und im Budget.
9. **Datenschutz:** keine Kamera, kein Mikrofon ohne Nutzeraktion (`Permissions-Policy` erlaubt heute `camera=()`; für AR/Raumfoto gezielt auf `self` öffnen), Uploads nur serverseitig geprüft.

---

## 4. Konkrete Features

Legende Aufwand: **S** ≤ 2 Personentage, **M** 3–8 PT, **L** > 8 PT.

### F1 – Statisches Rendering und ISR wiederherstellen
- **Was:** In allen 32 `page.js` (und den Layouts darunter) `setRequestLocale(locale)` vor dem ersten `getTranslations` aufrufen, wie in `src/app/[locale]/layout.js`. `generateStaticParams` für die wichtigsten Seiten (Marken, Kategorien, Stadtseiten) behalten bzw. ergänzen; Produktseiten bei erstem Aufruf rendern und cachen (`dynamicParams` bleibt `true`). Danach im Build-Log prüfen: Routen als „○/●“ statt „ƒ“, `prerender-manifest.json` enthält `/de`, `/en/…`. Live-Header muss `s-maxage=3600, stale-while-revalidate` zeigen.
- **Nutzen:** TTFB unter Last stabil < 100 ms, Googlebot crawlt schneller (Crawl-Budget bei 1.765 × 4 URLs), **bfcache funktioniert** (sofortiges Zurück, Lighthouse-Fail weg), Server-Last sinkt; Ausfallsicherheit (zusammen mit F2).
- **Aufwand:** S–M (mechanisch, aber jede Seite testen).
- **Abhängigkeiten:** keine. Die Revalidierungs-Webhooks existieren schon (`src/app/revalidate/*`).
- **Dateien:** `src/app/[locale]/**/page.js`, ggf. `src/app/[locale]/[slug]/page.js`, `src/i18n/config.js`.
- **Bibliotheken:** keine (next-intl 4.13 vorhanden).
- **Achtung:** `detectLocale()` (liest `cookies()`/`headers()`) nur im 404-Zweig lassen. Nach dem Fix wirken die Cache-Header aus `next.config.js` und nginx; prüfen, dass nginx keine HTML-Seiten selbst cacht ohne `Vary: rsc`.

### F2 – Ausfallsicherer Backoffice-Zugriff und Fehlerseiten
- **Was:** Ein gemeinsamer Wrapper `src/lib/api/http.js` (`backofficeFetch(url, { tags, revalidate, timeoutMs = 6000, critical })`): Timeout, 1 Retry bei Netzwerkfehler, strukturierte Log-Zeile, und **bei kritischen Daten (Produktdetail, Kategorie, Marke) wirft er statt `[]`/`null` zurückzugeben**. Dadurch verwirft Next die Neuberechnung und liefert die zuletzt gute ISR-Seite weiter aus, statt eine leere Seite oder 404 zu cachen. Nur wenn das Backoffice „nicht gefunden“ meldet, folgt `notFound()`. Alle Fetcher in `src/lib/api/**` (inkl. `Keywords/*`) umstellen. Dazu `src/app/[locale]/error.js` (mit `retry()`, siehe `docs/01-app/01-getting-started/10-error-handling.md`), `src/app/global-error.js`, und `catchError` aus `next/error` für Inseln (z. B. „Ähnliche Produkte“ darf ausfallen, die Seite nicht).
- **Nutzen:** Kein Ranking-Verlust durch Backoffice-Ausfälle (leere Kategorieseiten werden sonst als Soft-404 gewertet), keine verlorenen Besucher.
- **Aufwand:** M.
- **Abhängigkeiten:** keine; ideal zusammen mit F1.
- **Dateien:** neu `src/lib/api/http.js`, `src/app/[locale]/error.js`, `src/app/global-error.js`; geändert alle `src/lib/api/*.js`.
- **Bibliotheken:** keine.

### F3 – Sicherheits-Härtung: Proxy, Formulare, Header
- **Was:**
  1. **`src/app/api/image/route.js` löschen** und `/api/image` aus `src/app/robots.js` entfernen (Tag 1). Wird es doch irgendwo extern verlinkt: nur `files/…` + Bildendung zulassen, wie `/cmx`.
  2. Gemeinsames Modul `src/lib/forms/guard.js` für alle Formular-Routen: Schema-Validierung mit **zod 4.6.7** (MIT, nur Server, 0 KB Client), Längenlimits (Nachricht ≤ 5.000 Zeichen, Body ≤ 20 KB), **Honeypot** + **Zeitfalle** (Formular < 3 s nach Laden abgeschickt = Bot) wie im Newsletter, **Rate-Limit** pro IP (aus `X-Forwarded-For` von nginx) mit **rate-limiter-flexible 11.2.3** (ISC, Memory-Store reicht bei 1 PM2-Instanz; z. B. 5 Anfragen / 10 min), `AbortSignal.timeout(10000)`, nur generische Fehlercodes an den Browser (Muster aus `newsletter_subscribe/route.js`), Backend-URL aus `NEW_API_BASE_URL`.
  3. Stufe 2, nur wenn Spam trotzdem ankommt: **ALTCHA 3.5.0** (MIT, Proof-of-Work, selbst gehostet, keine Cookies, DSGVO-freundlich; Widget ~37 KB gz, nur dynamisch beim Fokus aufs Formular laden). Cloudflare Turnstile (`@marsidev/react-turnstile` 1.6.3, MIT, ~3 KB + Cloudflare-Skript) nur, wenn Drittanbieter-Übertragung in der Datenschutzerklärung akzeptiert wird.
  4. Header in `next.config.js`: `X-XSS-Protection` entfernen; **CSP zuerst als `Content-Security-Policy-Report-Only`**: `default-src 'self'; img-src 'self' data: https://backoffice.platzhirsch.studio https://www.googletagmanager.com https://*.google-analytics.com; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'`. **Keine Nonces**: laut `docs/01-app/02-guides/content-security-policy.md` Z. 38 erzwingen sie dynamisches Rendern und würden F1 zunichtemachen. Später `experimental.sri` (Hash-basiert, statisch kompatibel) prüfen.
  5. `images.contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"` und `contentDispositionType: "attachment"` ergänzen (wegen `dangerouslyAllowSVG`), `qualities` auf `[60, 75, 90]`.
- **Nutzen:** Kein Missbrauch des Servers als Backoffice-Tunnel, kein Spam im Backoffice, keine Datenlecks; Vertrauen (wichtig für „abgesicherte Anzahlung“-Positionierung, Masterkonzept 4.2).
- **Aufwand:** S (1, 4, 5) + M (2) ; ALTCHA S.
- **Abhängigkeiten:** keine für 1, 2, 4, 5. Für Stufe-2-Captcha: Datenschutzerklärung. nginx muss `X-Forwarded-For` setzen (Server-Zugang, nicht Backoffice).
- **Dateien:** `src/app/api/image/route.js` (löschen), `src/app/robots.js`, `src/app/api/{kontakt,beratung_anfrage,anfrage_produkt}/route.js`, neu `src/lib/forms/guard.js`, `src/lib/forms/schemas.js`, `next.config.js`, die 4 Formular-Komponenten (Honeypot-Feld).
- **Bibliotheken:** zod 4.6.7 (MIT), rate-limiter-flexible 11.2.3 (ISC), optional altcha 3.5.0 (MIT).

### F4 – Monitoring: Fehler, Web Vitals, Verfügbarkeit
- **Was:**
  1. **Fehler-Tracking** über `instrumentation.js` (`onRequestError`, `docs/01-app/03-api-reference/03-file-conventions/instrumentation.md`) und `instrumentation-client.js`. Empfehlung: **@sentry/nextjs 11.9.0** (MIT SDK) mit EU-Region (sentry.io Frankfurt, Free-Plan 5k Fehler/Monat) **oder GlitchTip** (selbst gehostet, Sentry-kompatibel, MIT) für maximale DSGVO-Ruhe. Client nur Fehler, **kein Session Replay, kein Tracing im Browser**, damit der Client-Anteil klein bleibt (Vollpaket 153 KB gz laut bundlephobia; mit Tree-Shaking nur Errors deutlich weniger, in CI messen und Budget ≤ 25 KB gz). Alternative mit 0 KB Client: nur serverseitig `onRequestError` + `catchError` mit eigenem `fetch` an GlitchTip.
  2. **Feld-Messung der Web Vitals:** `web-vitals` 6.2.3 (Apache-2.0, ~3 KB gz) → `trackEvent("web_vitals", { name, value, rating, page_type })` in `src/lib/analytics.js`, nur nach Consent (Consent Mode v2 vorhanden). Alternative ohne Paket: `useReportWebVitals` aus `next/web-vitals`. GA4-Explorations-Bericht „LCP p75 je Seitentyp“. Zusätzlich Google CrUX/Search Console „Core Web Vitals“ monatlich.
  3. **Uptime:** Uptime Kuma (MIT, selbst gehostet, z. B. auf dem Windows-PC oder dem Server) oder Better Stack Free: Checks auf `/de`, `/de/produkte`, eine Produktseite, `/api/shop-search?q=mi`, Backoffice-`ping`; Alarm per E-Mail/Telegram.
  4. **Logs:** `pm2 install pm2-logrotate` (MIT), JSON-Logs mit `pino` 10.4.0 (MIT) nur, falls Logs ausgewertet werden sollen.
- **Nutzen:** Ausfälle und Formularfehler (= verlorene Leads) werden in Minuten statt Wochen bemerkt; Ranking-Faktor Core Web Vitals wird aus echten Nutzerdaten gesteuert.
- **Aufwand:** S–M.
- **Abhängigkeiten:** Konto (Sentry) oder Server für GlitchTip/Uptime Kuma; Eintrag in Datenschutzerklärung (berechtigtes Interesse, IP-Anonymisierung).
- **Dateien:** neu `instrumentation.js`, `instrumentation-client.js`, `src/components/Reusable/WebVitals.js`; geändert `src/lib/analytics.js`, `ecosystem.config.js`.
- **Bibliotheken:** @sentry/nextjs 11.9.0 (MIT) oder GlitchTip; web-vitals 6.2.3 (Apache-2.0); Uptime Kuma (MIT).

### F5 – Tests und CI/CD mit Budget-Tor
- **Was:**
  1. **Playwright** `@playwright/test` 1.64.1 (Apache-2.0): 15–20 Smoke-Tests gegen `next build && next start` (Startseite, Kategorie, Produkt, Merkliste hinzufügen/entfernen, Kontakt-/Beratungsformular mit gemocktem Backoffice, Sprachwechsel, 404, Redirects aus `next.config.js`, Sitemaps valide).
  2. **Barrierefreiheit automatisch:** `@axe-core/playwright` 4.14.0 (MPL-2.0, nur Dev) auf 10 Kernseiten, Fehler bricht den Build; `eslint-plugin-jsx-a11y` 6.10.2 (MIT) in `eslint.config.mjs` (in `eslint-config-next` teils enthalten, Regeln verschärfen).
  3. **Unit-Tests** für reine Logik (`src/lib/shop/*`, `src/lib/seo/*`, Slugs, Sanitizer, Formular-Schemas): `vitest` 5.0.5 (MIT), `@vitejs/plugin-react` 6.1.2.
  4. **Budgets:** `@lhci/cli` 0.15.1 (Apache-2.0) mit `lighthouserc.json` (Werte aus 3.3) auf 5 URLs; `size-limit` 14.3.0 + `@size-limit/preset-app` (MIT) für die Client-Chunks; `knip` 6.43.0 (ISC) findet tote Dateien/Abhängigkeiten.
  5. **Pipeline:** GitHub Actions (oder Gitea/GitLab, je nach Git-Host; im Repo ist keiner konfiguriert): lint → unit → build → Playwright + axe → LHCI. **Deploy:** Build in neuem Release-Ordner (oder CI-Artefakt), dann Symlink umstellen und `pm2 reload`, damit `next build` nie die laufende Seite stört; Rollback = Symlink zurück. Optional `output: "standalone"`.
  6. Zusätzlich lokal auf dem Windows-PC: `npx unlighthouse` 0.19.1 (MIT) scannt einmal pro Monat **alle** URLs der Sitemap auf Performance/A11y/SEO.
- **Nutzen:** Kein Release bricht Formulare, Merkliste oder Redirects (= Leads und Rankings); das Budget-Tor schützt den Vorsprung bei jedem neuen Feature, ohne dass jemand daran denken muss.
- **Aufwand:** M (Grundgerüst), danach pro Feature S.
- **Abhängigkeiten:** Zugang zum Git-Host und zum Server (SSH-Deploy-Key), nicht zum Backoffice. Backoffice wird in Tests gemockt (Playwright `page.route`).
- **Dateien:** neu `playwright.config.js`, `tests/e2e/*.spec.js`, `tests/unit/*.test.js`, `vitest.config.js`, `lighthouserc.json`, `.size-limit.json`, `.github/workflows/ci.yml`, `scripts/deploy.sh`; geändert `package.json` (Skripte), `eslint.config.mjs`, `ecosystem.config.js`.
- **Bibliotheken:** siehe oben (alle Dev-Dependencies, 0 KB im Browser).

### F6 – LCP- und JS-Diät
- **Was:**
  1. `priority` (17×) durch `preload` bzw. auf dem LCP-Bild `fetchPriority="high"` + `loading="eager"` ersetzen (Next-16-Doku `image.md` Z. 265–293). Auf `/produkte` die ersten 2 Kategoriekacheln `loading="eager"`, Rest lazy.
  2. **Mobiler Hero-Zuschnitt** (Hochformat 828×1200, ≤ 120 KB AVIF) per `getImageProps()` + `<picture>` (Art Direction, `image.md` Z. 1288 ff.), `hero-zoom`-Animation auf Mobil weglassen (Render-Delay).
  3. `browserslist`-Block aus `package.json` entfernen (Next-16-Standard: Chrome/Edge/Firefox 111, Safari 16.4) → ca. 14 KB Polyfills weniger. Safari 15/16.0–16.3 sind 2026 unter 1 % der Nutzer; vor dem Schritt im GA4-Bericht „Browser-Version“ prüfen.
  4. **Übersetzungen aufteilen:** `NextIntlClientProvider` nur mit den Namespaces, die Client-Komponenten brauchen (`pick(messages, ["Navbar","Footer","Cookies","Cart",…])`), Seiten-Texte bleiben in Server-Komponenten (`getTranslations`). Ziel: RSC-Payload −30 bis −45 KB roh pro Seite.
  5. **Shell entkoppeln:** `ClientLayout` → Server-Layout; Navbar in Server-Teil (Links, Mega-Menü-Markup) + Client-Inseln (Burger, Suche, Sprachwahl, Merklisten-Zähler). Suche erst bei Fokus laden.
  6. `react-slick`/`slick-carousel` → CSS-Scroll-Snap bzw. `embla-carousel-react` 8.6.0 (MIT, ~7 KB) in der Galerie; `react-share` → Web Share API + Links; `react-icons` → `lucide-react` (bereits 37× genutzt). Gleiche Empfehlung wie `digital/01` und `digital/02`.
  7. `FadeInView` (JS, Inhalt startet unsichtbar) → CSS `animation-timeline: view()` (0 KB).
  8. nginx: Brotli (`ngx_brotli`) oder zstd für HTML/JS/CSS; `public/`-Bilder nur noch mit Hash im Namen oder `Cache-Control` auf 7 Tage + `stale-while-revalidate` für ungehashte Dateien (B7).
- **Nutzen:** LCP mobil 3,8 s → Ziel ≤ 2,3 s Labor / ≤ 2,0 s Feld, JS ~238 → ≤ 170 KB gz. „Gut“ in Core Web Vitals für alle Seitentypen = Ranking-Vorteil gegenüber allen Händlern und mehr Anfragen (schnellere Seiten konvertieren messbar besser).
- **Aufwand:** M (1–4, 6–7), L (5, Navbar-Umbau). 8 = S, braucht Server-Zugang.
- **Abhängigkeiten:** keine Backoffice-Felder. Mobile Hero-Bilder: Bildrechte/Freigabe der Marke für Zuschnitt.
- **Dateien:** `src/components/Home/Hero.js`, `src/components/ShopCatalog/shopCategoryGrid.js`, alle 17 `priority`-Stellen, `package.json`, `src/app/[locale]/LoaderWrapper.js`, `client-layout.js`, `src/components/Navbar/navbar.js` (aufteilen in `navbar/*.js`), `src/components/Reusable/FadeInView.js`, `globals.css`, `next.config.js`.
- **Bibliotheken:** embla-carousel-react 8.6.0 (MIT, ~7 KB gz); Rest 0 KB.

### F7 – WCAG-2.2-AA-Sprint
- **Was:** Alle 151 `text-[#d1b250]` auf hellem Grund → `text-gold-text`; Gold-Buttons mit dunkler Schrift (`text-ink` auf Gold = ca. 6:1, wie im Hero) statt Weiß; Fokusring zweifarbig (`outline: 2px solid #30373e; box-shadow: 0 0 0 4px #d1b250`), Skip-Link „Zum Inhalt springen“; `scroll-padding-bottom` für `MobileCtaBar`; Karussell-Autoplay mit sichtbarem Pause-Knopf oder Autoplay aus; Zielgrößen ≥ 24 px (Breadcrumbs, Dots, Pfeile); sichtbare Labels + `aria-invalid` + `aria-describedby` + Fehlerzusammenfassung mit Fokus in allen Formularen; Beratung ohne Auto-Weiter (Schritt per „Weiter“-Knopf); Barrierefreiheitserklärung als Seite (4 Sprachen) mit Kontaktweg. Lint-Regel gegen `#d1b250` als Textfarbe (ESLint `no-restricted-syntax` auf Klassen-Strings).
- **Nutzen:** Rechtssicherheit (BaFG, falls anwendbar), höhere Formular-Abschlussrate (sichtbare Labels und klare Fehler sind die wirksamsten Formular-Hebel), ältere kaufkräftige Zielgruppe liest besser. Achtung: Dolce Vita und Fretz erreichen Lighthouse-A11y 100 (Höttges 90, reiter 88, Minotti 72) – A11y ist also kein Alleinstellungsmerkmal, aber Pflicht, um nicht zurückzufallen. Automatische Tests decken nur ca. ein Drittel von WCAG ab; die Punkte aus 1.3 sind manuell gefunden.
- **Aufwand:** M.
- **Abhängigkeiten:** Designentscheidung zum Gold (mit `digital/01` abstimmen); Übersetzung der Barrierefreiheitserklärung.
- **Dateien:** ~40 Komponenten mit Gold-Klassen, `src/app/globals.css`, `client-layout.js`, `src/components/Kontakt/kontakt.js`, `BeratungClient.js`, `AnfrageFormProduct.js`, `newsletter.js`, `MarkenItems/markenitems.js`, `Reusable/breadcrumbBar.js`, `ShopCatalog/productGallery.js`, neu `src/app/[locale]/barrierefreiheit/page.js`, `src/messages/*.json`.
- **Bibliotheken:** keine (axe über F5).

### F8 – Leitplanken-Bausteine für 3D, Konfigurator, KI
- **Was:** Wiederverwendbare Bausteine, damit Feature-Teams (oder Agenten) die Regeln aus 3.3 automatisch einhalten:
  - `src/components/Lazy/InteractionFacade.js` (Server-Bild + Button; lädt Client-Modul per `next/dynamic` erst bei Klick/`IntersectionObserver` mit `requestIdleCallback`).
  - `src/components/Lazy/ModelViewer3D.js` auf Basis **@google/model-viewer 4.4.0** (Apache-2.0, ~71 KB gz, nur nach Klick; bringt AR Quick Look/Scene Viewer ohne eigene AR-Engine). **three 0.186.1** (MIT, ~181 KB gz) + **@react-three/fiber 9.8.2** (MIT, ~56 KB gz) nur, falls ein echter Konfigurator kommt, und nur auf dessen eigener Route.
  - `scripts/optimize-glb.mjs` mit `@gltf-transform/cli` 4.5.1 + `meshoptimizer` 1.3.0 (beide MIT), läuft lokal auf dem Windows-PC.
  - `src/lib/jobs/` als Muster für asynchrone GPU-Jobs (Anfrage speichern, Status-Seite, E-Mail).
  - Budget-Einträge in `.size-limit.json` je Feature-Chunk.
- **Nutzen:** 3D/AR und Konfigurator werden möglich, ohne LCP/INP der Katalogseiten zu verschlechtern (Minotti verliert genau hier: LCP 18,9 s, CLS 0,4).
- **Aufwand:** S (Fassade, Budget), M (3D-Baustein mit Pipeline).
- **Abhängigkeiten:** **3D-Modelle und Bildrechte der Marken** (ohne freigegebene GLB-Dateien kein 3D); Masterkonzept 9 stellt „eigener 3D/AR-Konfigurator“ auf „nicht jetzt“ → nur Bausteine vorbereiten, Feature erst nach Freigabe.
- **Dateien:** siehe oben, alle neu.
- **Bibliotheken:** @google/model-viewer 4.4.0, @gltf-transform/cli 4.5.1, meshoptimizer 1.3.0; optional three/R3F.

### F9 – Bild-Hygiene und Rechte-Absicherung
- **Was:** Inventar aller Bildquellen (`public/Images`, 149 Dateien / 47 MB, davon ~30 über 500 KB; `remotePatterns` unsplash/next125/treca; Backoffice-Uploads) mit Spalte „Rechte geklärt ja/nein/Quelle“. Fremd-Hosts aus `remotePatterns` entfernen, sobald Bilder lokal/Backoffice liegen (Hotlinking der Marken = Rechts- und Ausfallrisiko). Quelldateien > 500 KB einmalig mit `sharp` (in Next enthalten) auf max. 2.560 px / Qualität 80 verkleinern (Skript `scripts/resize-public-images.mjs`), Dateinamen mit Hash. `alt`-Texte bleiben Pflicht (Lint).
- **Nutzen:** Weniger Speicher/Build-Zeit, keine Abmahnungen, keine kaputten Bilder wenn eine Marken-Website umzieht.
- **Aufwand:** S (Technik), Rechteklärung ist Teamarbeit.
- **Abhängigkeiten:** **Bildrechte der Marken** (Masterkonzept/SEO-Plan Regel „Herstellerbilder ohne Freigabe“).
- **Dateien:** `next.config.js`, `public/Images/**` (durch das Team, nicht in diesem Auftrag), neu `scripts/resize-public-images.mjs`, `docs/bildrechte.csv`.
- **Bibliotheken:** sharp (bereits als Next-Abhängigkeit installiert, Apache-2.0).

### F10 – Technische Vorbereitung für Preise, Angebote und Merchant-Feed (blockiert)
- **Was:** Datenmodell im Frontend vorbereiten: `Offer`/`AggregateOffer` in Produkt-JSON-LD nur wenn Preis vorhanden, `availability` aus Ausstellungs-Flag, `/merchant-feed.xml` (Route Handler, statisch + Tag `products`), Preis-Komponente mit `Intl.NumberFormat` für EUR/CHF, Tests mit Fixture-Daten. Hinter Feature-Flag `NEXT_PUBLIC_SHOW_PRICES`.
- **Nutzen:** Preis-Snippets und kostenlose Shopping-Einträge (SEO-Plan H1/H2), sobald das Backoffice liefert.
- **Aufwand:** M.
- **Abhängigkeiten:** **Preisfeld, Ausstellungs-Flag, Lieferzeit im Backoffice** (heute nicht vorhanden, kein Schreibzugang); Preisfreigabe der Hersteller.
- **Dateien:** `src/app/[locale]/produkte/[category]/[product]/page.js`, `src/lib/seo/structuredData.js`, neu `src/app/merchant-feed.xml/route.js`, `src/components/ShopCatalog/price.js`.
- **Bibliotheken:** keine.

---

## 5. Risiken

| Risiko | Art | Wahrscheinlichkeit / Wirkung | Gegenmaßnahme |
|---|---|---|---|
| Neue Features (3D, Chat, Termin-Widget, Tracking) blähen das Bundle auf | Performance | hoch / hoch | Budget-Tor in CI (F5), Fassaden-Pflicht (F8), jedes Drittanbieter-Skript braucht Freigabe |
| Nach F1 werden fehlerhafte Backoffice-Antworten 1 h gecacht | Performance/SEO | mittel / hoch | F2 vor oder zusammen mit F1 ausrollen; kritische Fetcher werfen statt leer zu liefern |
| CSP bricht GA4/Consent oder Inline-Skripte | Technik | mittel / mittel | 2–4 Wochen `Report-Only`, Reports an Sentry/GlitchTip, dann scharf schalten |
| Monitoring-Daten (IP, URL) | Recht (DSGVO) | mittel / mittel | EU-Region oder selbst gehostet, IP-Anonymisierung, kein Replay, Datenschutzerklärung ergänzen; Web Vitals nur nach Consent |
| Captcha-Drittanbieter | Recht | mittel / niedrig | zuerst Honeypot + Zeitfalle + Rate-Limit (0 Drittanbieter), ALTCHA selbst gehostet als Stufe 2 |
| BaFG/EAA-Pflichten bei Online-Kasse/Termin | Recht | unklar / mittel | Kleinstunternehmen-Status klären; WCAG 2.2 AA trotzdem umsetzen; Erklärung veröffentlichen |
| Herstellerbilder/3D-Modelle ohne Freigabe | Recht | hoch / hoch | F9-Inventar, keine Hotlinks, 3D nur mit Lizenz |
| Händler-Behauptungen in Texten (Minotti/Poliform) | Recht (UWG) | mittel / hoch | nicht Teil dieses Plans, aber CI kann eine Wortliste prüfen („offizieller Händler“, „autorisiert“) in `src/messages/*.json` und `llms.txt` |
| Pflege: 5 Personen, kein Vollzeit-Entwickler | Pflege | hoch / hoch | Automatik statt Doku: CI, Budgets, Uptime-Alarm, Renovate/Dependabot nur für Sicherheits-Updates, monatlicher Unlighthouse-Lauf |
| Single-Server (1 PM2-Instanz, kein CDN) | Verfügbarkeit | mittel / mittel | Release-Ordner + `pm2 reload`, Uptime-Alarm; bei Wachstum Cloudflare/Bunny-CDN vor nginx (Cache-Header aus F1 respektieren, `Vary: rsc` beachten, siehe `docs/01-app/02-guides/cdn-caching.md`) |
| Abhängigkeiten veralten (react-slick ungepflegt, next-intl-Major) | Pflege | mittel / mittel | `knip` und F6 räumen auf; Next-Upgrades nur mit grüner CI |
| Browserslist-Anhebung schließt alte iPads aus | Nutzer | niedrig / niedrig | vorher GA4-Browserbericht prüfen |

---

## 6. Priorisierte Reihenfolge

### 6.1 Sofort baubar, ohne Backoffice-Zugang

| Woche | Schritt | Feature | Aufwand |
|---|---|---|---|
| **Tag 1** | `/api/image` löschen, `robots.js` anpassen | F3.1 | S (1 Stunde) |
| Woche 1 | Fetch-Wrapper mit Timeout + „last good version“, `error.js`/`global-error.js` | F2 | M |
| Woche 1 | `setRequestLocale` in allen Seiten, Build prüfen (statisch/ISR), bfcache prüfen | F1 | S–M |
| Woche 1 | Formular-Guard (zod, Rate-Limit, Honeypot, Zeitfalle, Timeouts, generische Fehler) | F3.2 | M |
| Woche 2 | Sentry/GlitchTip + `onRequestError`, web-vitals → GA4, Uptime Kuma, pm2-logrotate | F4 | S–M |
| Woche 2 | Playwright-Smoke + axe + LHCI + size-limit, CI-Pipeline, Release-Deploy | F5 | M |
| Woche 3 | LCP-Diät: `fetchPriority`, eager-Kacheln, mobiler Hero, browserslist, Messages aufteilen | F6.1–4 | M |
| Woche 3–4 | WCAG-Sprint (Gold-Kontrast, Fokus, Skip-Link, Labels, Fehler, Pause, Zielgrößen) | F7 | M |
| Woche 4 | CSP Report-Only, Image-CSP, Header aufräumen | F3.4–5 | S |
| Woche 4–6 | Navbar/Shell in Server + Inseln, Slider/Share/Icons ablösen, FadeInView → CSS | F6.5–7 | L |
| laufend | Fassaden- und Budget-Bausteine für 3D/KI bereitstellen | F8 (ohne Modelle) | S |
| laufend | Bild-Inventar und Verkleinerung (Technik) | F9 | S |

**Erwartetes Ergebnis nach 4–6 Wochen:** alle Seiten statisch/ISR, LCP mobil ≤ 2,5 s (Labor), JS ≤ 170 KB gz, A11y 100 auf allen Kernseiten, kein offener Proxy, Spam-Schutz, Alarm bei Ausfall, jedes Release automatisch geprüft.

### 6.2 Braucht Server-Zugang (nginx/SSH), aber kein Backoffice
- Brotli/zstd, `X-Forwarded-For` für das Rate-Limit, Release-Ordner + `pm2 reload`, Uptime-Kuma-Installation, Cache-Header für ungehashte `public/`-Bilder (F6.8, F3, F5).

### 6.3 Blockiert

| Was | Blockiert durch |
|---|---|
| Preise, `Offer`-JSON-LD, Merchant-Feed, Lieferzeit, „in der Ausstellung“ (F10) | **Preisfeld, Ausstellungs-Flag, Lieferzeit im Backoffice** + Preisfreigabe der Hersteller |
| Backoffice-seitiger Spam-Schutz, Lead-Herkunft (UTM) als Feld in der Anfrage | Backoffice-Felder/Doctype-Änderung (Frontend kann die Werte schon mitsenden, sobald Feld da ist) |
| Bildspezifische `alt`-Texte und Bildrechte-Kennzeichnung aus dem CMS | Backoffice-Felder |
| Prüfung/Neu-Einrichtung der Revalidierungs-Webhooks im Frappe | Backoffice-Admin (Webhook-Records mit `X-Revalidate-Secret`) |
| 3D-/AR-Ansichten, Konfigurator (F8 mit Inhalten) | **3D-Modelle und Lizenzen der Marken**, Entscheidung Masterkonzept 9 („nicht jetzt“) |
| Herstellerbilder großflächig, mobile Zuschnitte von Markenfotos | **Bildrechte der Marken** |
| KI-Raumplaner auf der GPU | Bildfreigabe, DSGVO/DSG-Konzept, Wirkungsnachweis (Masterkonzept 10, ab 2028) |
| Online-Kasse (Gutscheine, Atelierverkauf) und damit BaFG-Pflichten | Zahlungsanbieter, Entscheidung Handels-GmbH |

---

## Anhang A – Bibliotheken auf einen Blick

| Paket | Version | Lizenz | Größe im Browser (gzip) | Zweck | Status |
|---|---|---|---|---|---|
| zod | 4.6.7 | MIT | 0 (nur Server) | Formular-Validierung | empfohlen |
| rate-limiter-flexible | 11.2.3 | ISC | 0 (nur Server) | Rate-Limit Formulare/Suche | empfohlen |
| altcha | 3.5.0 | MIT | ~37 KB, nur dynamisch auf Formularen | Captcha ohne Drittanbieter | Stufe 2 |
| @marsidev/react-turnstile | 1.6.3 | MIT | ~3 KB + Cloudflare-Skript | Captcha (Drittanbieter) | nur Alternative |
| @sentry/nextjs | 11.9.0 | MIT | Vollpaket 153 KB laut bundlephobia; nur Errors, ohne Replay/Tracing, Budget ≤ 25 KB | Fehler-Tracking | empfohlen (oder GlitchTip) |
| web-vitals | 6.2.3 | Apache-2.0 | ~3 KB | Feld-Messung CWV | empfohlen |
| @playwright/test | 1.64.1 | Apache-2.0 | 0 (Dev) | E2E-Tests | empfohlen |
| @axe-core/playwright | 4.14.0 | MPL-2.0 | 0 (Dev) | A11y-Tests | empfohlen |
| vitest (+ @vitejs/plugin-react 6.1.2) | 5.0.5 | MIT | 0 (Dev) | Unit-Tests | empfohlen |
| @lhci/cli | 0.15.1 | Apache-2.0 | 0 (Dev) | Lighthouse-Budgets in CI | empfohlen |
| size-limit + @size-limit/preset-app | 14.3.0 | MIT | 0 (Dev) | JS-Budget je Chunk | empfohlen |
| knip | 6.43.0 | ISC | 0 (Dev) | tote Dateien/Pakete | empfohlen |
| eslint-plugin-jsx-a11y | 6.10.2 | MIT | 0 (Dev) | A11y-Lint | empfohlen |
| unlighthouse | 0.19.1 | MIT | 0 (lokal) | Ganz-Site-Scan monatlich | empfohlen |
| embla-carousel-react | 8.6.0 | MIT | ~7 KB | Galerie statt react-slick | empfohlen |
| @google/model-viewer | 4.4.0 | Apache-2.0 | ~71 KB, nur nach Klick | 3D/AR | vorbereiten |
| @gltf-transform/cli / meshoptimizer | 4.5.1 / 1.3.0 | MIT | 0 (Build/lokal) | GLB-Kompression | vorbereiten |
| three / @react-three/fiber | 0.186.1 / 9.8.2 | MIT | ~181 / ~56 KB, nur eigene Route | Konfigurator | nur bei Freigabe |
| pino | 10.4.0 | MIT | 0 (Server) | strukturierte Logs | optional |
| Uptime Kuma / GlitchTip | aktuell | MIT | 0 | Uptime / Fehler selbst gehostet | empfohlen |
| **Entfernen:** react-slick 0.31.0, slick-carousel 1.8.1, react-share 5.2.2, react-icons 5.5.0 | – | – | spart ~35–40 KB + CSS | – | F6 |

Versionen: npm-Registry, abgefragt am 26.10.2026. Größen: bundlephobia (min+gzip, ganzes Paket ohne Tree-Shaking) bzw. Herstellerangabe; reale Werte nach Einbau mit `size-limit` messen.

## Anhang B – Relevante Next-16-Doku (lokal)
- Bilder: `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` (`preload` statt `priority`, `qualities` Pflicht, `contentSecurityPolicy`, `minimumCacheTTL` ohne Invalidierung, Art Direction mit `getImageProps`)
- Caching ohne Cache Components: `01-app/02-guides/caching-without-cache-components.md`, ISR: `incremental-static-regeneration.md`, Revalidierung: `how-revalidation-works.md`
- Self-Hosting (Cache auf Disk, `pm2`/eine Instanz, CDN): `01-app/02-guides/self-hosting.md`, `cdn-caching.md`
- Fehler: `01-app/01-getting-started/10-error-handling.md`, `03-api-reference/04-functions/catchError.md`
- Monitoring: `03-api-reference/03-file-conventions/instrumentation.md` (`onRequestError`), `instrumentation-client.md`
- CSP: `01-app/02-guides/content-security-policy.md` (Nonce = dynamisch; SRI experimentell = statisch)
- Bundles: `01-app/02-guides/package-bundling.md` (`next experimental-analyze`), `lazy-loading.md`
- Tests: `01-app/02-guides/testing/playwright.md`, `vitest.md`
