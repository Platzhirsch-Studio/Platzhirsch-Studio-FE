# 00 – Digital-Masterplan Platzhirsch Home Living

**Stand:** 26.10.2026 (KW 44) · **Rolle:** Lead-Architekt und Product Owner Digital
**Grundlage:** die Baupläne `digital/01–14` (vollständig gelesen), Masterkonzept 23 (Abschnitte 1, 4, 9, 10, 12, 15), Übersicht 00, SEO-Schlachtplan 25, Code-Stand im Repo (Next.js 16.3.4 installiert, React 19.2, next-intl 4.13, Tailwind 4), Next-16-Doku in `node_modules/next/dist/docs/` (u. a. `view-transitions.md`, `mdx.md`, `image.md`, `caching-without-cache-components.md`, `content-security-policy.md`), npm-Registry (Versionen und Veröffentlichungsdaten am 26.10.2026 abgefragt).

> **Rangfolge der Dokumente.** Wo sich die Einzelpläne widersprechen, gilt dieser Masterplan (Auflösung in Abschnitt 7). Wo dieser Plan und das Masterkonzept 23 sich widersprechen, gilt 23 bei Geschäftsentscheidungen (Gate 0, Budget, Kapazität) und dieser Plan bei technischen Entscheidungen. Keine Rechtsberatung: Alle mit **[Anwalt]** oder **[Steuerberater]** markierten Punkte brauchen vor dem Livegang eine Freigabe.

---

## 1. Zielbild „digitaler Gigant“ (ein Absatz)

Platzhirsch wird bis Ende 2027 das **digital stärkste Einrichtungshaus im Dreiländereck**. Das ist keine Werbeaussage, sondern ein messbares Ziel. Kein Vertragshändler der Region hat Produktseiten, Preise, Online-Termin, Ratgeber oder strukturierte Daten. Platzhirsch hat dagegen 1.765 Produktseiten in 4 Sprachen, die schnellste Website der Branche (Lighthouse 87 gegen 53–59 bei Höttges, reiter design und Dolce Vita) und einen Katalog aus dem eigenen Backoffice. Daraus entsteht eine **Long-Tail-Maschine**: Wer nach einem Modell („Minotti Lawrence Sofa“), einer Kauffrage („Möbel in die Schweiz liefern“) oder einer Region („Designermöbel Liechtenstein“) sucht, landet bei Platzhirsch. Die Seite beantwortet dort die Frage ehrlich (Maße, Datenblätter, Lieferung nach AT/DE/CH/FL, Preise, sobald erlaubt) und führt zu einem **Termin im Showroom mit Café**. Jede Anfrage trägt ihre Herkunft. So lässt sich jeder Euro Werbung gegen echte Aufträge rechnen. Der Auftritt ist ruhig und editorial wie bei Minotti, aber zehnmal schneller. Er ist barrierefrei, rechtssicher (keine Händler-Behauptungen ohne Vertrag, nur freigegebene Bilder, KI gekennzeichnet) und so automatisiert, dass ein Team von fünf Personen ihn ohne eigenen Entwickler pflegt. Regeln stecken in CI-Prüfungen, nicht in Wiki-Seiten. **Platz 1 bei Google ist das interne Ziel, kein Werbeclaim** (14 F2).

---

## 2. Ist-Zustand in Kürze (was der Bau voraussetzt)

| Bereich | Befund | Fundstelle | Quelle |
|---|---|---|---|
| Rendering | Keine `page.js` ruft `setRequestLocale` auf. Alle Seiten werden dynamisch gerendert (`no-store`), `revalidate=3600` wirkt nicht, bfcache ist aus | `src/app/[locale]/**/page.js` (37 Dateien), `src/app/[locale]/layout.js` Z. 193 | 13 B1 |
| Sicherheit | `/api/image` ist ein offener Proxy aufs Backoffice (live: `ping` → `pong`) | `src/app/api/image/route.js`, `src/app/robots.js` | 13 B2 |
| Formulare | kein Rate-Limit, kein Honeypot (außer Newsletter), Backoffice-Fehlertexte gehen an den Browser, Telefon ist Pflicht, übersetzte Labels statt Schlüssel, keine Herkunft | `src/app/api/{kontakt,beratung_anfrage,anfrage_produkt}/route.js`, `src/components/{BeratungClient,AnfrageFormProduct,Kontakt}/*` | 05, 11, 13 B3 |
| Recht | Datenschutzerklärung beruft sich auf Privacy Shield und TKG 2003. Impressum ohne Kammer, GewO und § 25 MedienG. Kein Formular-Hinweis. Backoffice-Felder `dealers_title`/`dealers_description` werden ungefiltert ausgegeben | `src/components/Datenschutz/datenschutz.js`, `Impressum/impressum.js`, `MarkenItems/markenitems.js` Z. 115 f. | 14 R1–R13 |
| Händler-Claim | „Minotti Händler Vorarlberg“ ist **live**. Die Korrektur liegt nur lokal und ist nicht committet | `src/app/[locale]/ueber-uns/marken/[title]/page.js`, `src/app/llms.txt/route.js` (git: modified) | 08 |
| Tracking | GA4 mit Consent Mode v2, neu `src/lib/analytics.js` (untracked) mit `trackLead`/`contact_click`. Kein Ads-Tag. Erteilt jemand nur die Ads-Einwilligung, wird `gtag` nicht geladen. Keine UTM- oder Klick-IDs | `src/components/Cookies/cookiecomponent.js`, `src/lib/analytics.js` | 10, 11 |
| Bibliotheken | **Uncommittet installiert:** `embla-carousel-react` 8.6.0 (gewollt), `lenis` 1.3.27 und `motion` 12.43.0, *[Review 15: außerdem `zod` 4.6.7, `@playwright/test` 1.64.1, `qrcode` 1.5.4 sowie für die Labs `@anthropic-ai/sdk` 0.137.0, `three` 0.183.2, `@react-three/fiber` 9.8.2, `@react-three/drei` 10.7.9 und `@google/model-viewer` 4.4.0, siehe Abschnitt 11]*. `lenis` und `motion` sind von 01/02 ausdrücklich **nicht empfohlen** und werden in `src/` nirgends benutzt. Altlasten: `react-slick`/`slick-carousel` (4 Dateien), `react-share` (1), `react-icons` (2), `browserslist`-Block (≈ 14 KB Polyfills) | `package.json`, `package-lock.json` | 01, 02, 13 B6 |
| Design/A11y | `#d1b250` steht 256-mal im Code, davon 151-mal als Textfarbe (2,05:1 Kontrast). Hartcodierte Adresse an 48 Stellen. `priority` (in Next 16 veraltet) in 16 Dateien. `FadeInView` in 21 Dateien. Kein Skip-Link, keine sichtbaren Labels | `src/components/**`, `globals.css` | 01, 13 F7 |
| Produktdaten | 841 PDFs (Datenblätter, Kataloge) im Backoffice werden nicht angezeigt. Maße fehlen bei Minotti (2/487), Poliform (0/103) und Paola Lenti (0/100). 152 Produkte ohne Bild. Kein Preis-, Ausstellungs- oder Lieferzeitfeld | `src/lib/shop/shopProducts.js` (`toShopProductDetail`) | 03, 07 |
| Parallel entstanden (untracked) | 8 neue Stadtseiten (Appenzell, Arlberg, Feldkirch, Kempten, Konstanz, Liechtenstein, Ravensburg, Rheintal), noch **nicht** in `landingPages.js`/Sitemap. Design-Prototyp `/de/preview/galerie` (noindex, eigene Fonts Cormorant Garamond und Instrument Sans) | `src/app/[locale]/designermoebel-*`, `src/app/[locale]/preview/`, `src/components/Preview/` | git status |
| Stärken | LCP 3,8 s und CLS 0. Lighthouse A11y und SEO 100. 4 Sprachen mit hreflang. Product-JSON-LD ohne Fake-Preise. Revalidierungs-Webhooks mit `timingSafeEqual`. `/cmx`-Proxy mit Allowlist. `src/lib/site.js` als NAP-Quelle (Landstraße 9) | – | 13, 14 |

**Benchmark in drei Sätzen (01–14):** Die Besten weltweit (RH, Conran, Connox, AmbienteDirect, Minotti, Vitra) verbinden Bildruhe mit harten Produktdaten: Preis, Lieferzeit, Downloads, Zoom, Termin, Projekte. Technisch sind sie fast alle schwer (LCP 10–19 s, TBT bis 4 s). In der Region hat **kein** Händler Produktseiten, Preise, hreflang, Product-Schema, Online-Kalender, Ratgeber oder eine Barrierefreiheitserklärung. Höttges hat 9 Seiten, sein Termin-Knopf öffnet nur eine E-Mail. Online-Termine bieten nur Gamma, Fretz, Teo Jakob und Bihler an. Die Lücke ist also nicht die Technik, sondern **Inhaltstiefe, Kauffragen-Antworten und Lead-Strecke**. Der Vorsprung bleibt nur, wenn neue Features ihn nicht auffressen (Budget-Tor aus 13).

---

## 3. Gesamt-Roadmap in drei Wellen

| Welle | Zeitraum | Bedingung | Inhalt (Kurzform) | Ziel |
|---|---|---|---|---|
| **Welle 1 – Fundament und schnelle Umsätze** | KW 44 bis KW 51 (27.10.–20.12.2026) | **keine**: weder Backoffice-Schreibzugang noch Zahlungsanbieter, Herstellerbilder oder Mediabudget | Hotfix Händler-Claims, Caching/ISR, Sicherheit, Rechtsbasis, Lead-Strecke mit Herkunft, Termin-Buchung, Produktseiten als Long-Tail, Marke × Kategorie und Kollektions-Hubs, Regionen und Schweiz-Hub, Ratgeber-Gerüst, Gutscheine (Anfrage + Rechnung), Atelierverkauf mit echten Preisen (Reservierungsanfrage), Galerie neu, WCAG-Sprint, Messung und CI | sauber, schnell, rechtssicher. Ab KW 46 messbare Leads mit Herkunft, Gutschein- und Atelier-Umsatz vor Weihnachten |
| **Welle 2 – Daten, Kasse, Reichweite** | Jan.–Apr. 2027 | **Gate 0/1** (23 Abschn. 12.2), **Backoffice-Felder** (Abschn. 5), **Zahlungsanbieter** (E3), **Bildfreigaben** (E6), Mediabudget Stufe 1 | Stripe Checkout (Gutschein automatisch, Atelier mit Anzahlung, Accessoire-Shop), Pflichtseiten mit Widerrufsbutton, Merchant-Center-Feed. Preise, „ab“-Preise (nur mit Herstellerfreigabe), Ausstellungs-Flag und Lieferzeit im Katalog. Strukturierte Lead-Felder, Frappe-CRM-Pipeline und Nachfassen. Ads Stufe 1 mit Pixeln, Enhanced Conversions und Offline-Import. „Ihr Raum in 48 Stunden“ (manuell). Neue Startseite und Header-Optik mit eigenen Fotos, Markenwelten, Projekte. Bewertungs-Widget ab ca. 15 Bewertungen | erste Online-Umsätze, Preis-Snippets, Ads mit ROAS-Steuerung, CRM |
| **Welle 3 – große Features** | ab Mai 2027, je mit Wirkungsnachweis | Kennzahlen aus Welle 1/2, Lizenzen der Marken, Budget | 2D-Planer/Konfigurator (Sofa, Schrank, Schirm), 3D/AR-Pilot (10–20 Modelle, nur mit Herstellerdaten und Lizenz), KI-Concierge (Beta), KI-Raumplaner als Selbstbedienung (frühestens 2028), volle Frappe-Integration (Aufträge, Rechnungen, Gutschein-Doctype), Circle/Produktpass, Roomle-Adapter | Alleinstellung bei Planung und Visualisierung |

**Kapazitätsregel (23, 12.1):** Website-Arbeit läuft in den 100 Tagen „nur mit externer Hilfe“. Welle 1 ist deshalb so geschnitten, dass Bau-Agenten oder ein Freelancer sie **parallel** umsetzen. Das Team liefert nur Entscheidungen (Abschnitt 4), Fotos, Texte zur Freigabe und die Inventur für den Atelierverkauf. Höchstens 3–4 neue Initiativen pro Quartal sind für das Team sichtbar. Welle 1 sind für das Team genau drei: **Termine, Gutscheine, Atelierverkauf**. Der Rest ist Technik und SEO im Hintergrund.

### 3.1 Feste Termine Welle 1

| Datum | Meilenstein | Paket |
|---|---|---|
| **Mi 28.10.** | Händler-Hotfix live (Claim-Guard, `/api/image` gelöscht) | AP0 |
| Fr 30.10. | AP0 fertig, parallele Pakete starten | AP0 |
| **Di 03.11.** | Event-Seite Adventsabend 26.11. mit Anmeldung (Einladungsversand) | AP3 |
| KW 46 (09.–15.11.) | Online-Termin live (falls E7 entschieden), Formulare neu, Herkunft in jeder Anfrage, Samstag-Test | AP3 |
| **Mo 16.11.** | Gutscheine live (Anfrage + Rechnung), Gutscheinbedingungen | AP9 |
| KW 47 | Atelierverkauf live (nach Inventur, E5), Schweiz-Hub (nach Steuerberater-Text) | AP9, AP6 |
| KW 48 | Ratgeber-Gerüst mit den ersten 3 Artikeln, Marke × Kategorie, Kollektions-Hubs | AP7, AP5 |
| **KW 49 (30.11.–06.12.)** | Integrationsschritt INT, Gesamt-CI, Deploy | INT |
| KW 50–51 | Stabilisieren, Messung prüfen, Search Console, kein neues Feature (Weihnachts-Freeze ab 14.12.) | alle |

---

## 4. Welle 1 – Arbeitspakete für parallele Bau-Agenten

### 4.1 Spielregeln (gelten für jedes Paket)

**Ablauf.** AP0 läuft **allein und zuerst** (2 Personentage). Es legt alle gemeinsamen Dateien, Stubs, Bibliotheken und Registries an. Danach gehen die Dateien an die in der Eigentumsmatrix (4.3) genannten Pakete über. AP1–AP9 laufen **parallel**, jedes auf einem eigenen Branch `welle1/apN-<name>` ab dem AP0-Commit. Am Ende verdrahtet der Integrationsschritt **INT** die wenigen Querschnittsstellen (4.4). Merge-Reihenfolge: AP1 → AP2 → AP3 → AP4 (die Galerie als Teil-Merge bis Tag 3) → AP5 → AP6 → AP7 → AP9 → AP8 → INT.

**Datei-Eigentum.** Jede Datei gehört genau einem Paket. Ein Paket ändert **nur eigene Dateien** und legt neue Dateien nur in seinen Ordnern an. Lesen und Importieren fremder Module ist erlaubt, Ändern nicht. Braucht ein Paket eine Änderung in fremden Dateien, schreibt es sie in den Abschnitt „INT-Anfragen“ seiner PR-Beschreibung.

**Gemeinsame Dateien, verbindlich geregelt:**

| Gemeinsame Datei | Regel |
|---|---|
| `package.json`, `package-lock.json` | gehören **AP0**. Alle Bibliotheken für Welle 1 installiert AP0 auf einmal (4.2, AP0). Kein anderes Paket installiert etwas. Das Entfernen der Altlasten macht INT |
| `src/messages/{de,en,fr,it}.json` (Basis) | gehören **AP7** (Textreparatur). Jedes andere Paket schreibt Texte **nur** in sein Modul `src/messages/modules/<modul>/{de,en,fr,it}.json`. Die legt AP0 als `{}` an, `src/i18n/config.js` führt sie zusammen (Basis zuerst, dann Module). Ein Modul definiert eigene Namespaces und darf Schlüssel nur in „seinen“ Bestands-Namespaces überschreiben (Tabelle 4.3, Spalte „Namespaces“) |
| `src/app/globals.css` | gehört **AP8**. Andere Pakete nutzen Tailwind-Klassen und die vorhandenen Tokens. Eigene Styles legen sie in CSS-Modulen neben der Komponente an (`*.module.css`) |
| `src/app/[locale]/layout.js` | gehört **AP6** (JSON-LD Organization/LocalBusiness, `areaServed`, `sameAs`, OG-Locale). Schriftwechsel ist Welle 2 |
| `src/app/[locale]/client-layout.js`, `LoaderWrapper.js` | gehören **AP8**. Die Herkunfts-Erfassung und die Web-Vitals laufen deshalb über `src/instrumentation-client.js` (AP3), nicht über das Layout |
| `next.config.js` → `next.config.mjs` | AP0 stellt auf `.mjs` um (MDX). Danach gehört die Datei **AP1** |
| Sitemap | `src/lib/seo/sitemapEntries.js` und `src/app/sitemap*.xml/*` gehören **AP5**. AP0 legt Registry-Dateien `src/lib/seo/sitemap/{content,commerce,local}.js` an (je `export async function entries() { return [] }`) und bindet sie einmal ein. Danach füllen AP7, AP9 und AP6 nur ihre eigene Datei |
| `llms.txt` | Route gehört **AP5**. AP0 legt `src/lib/seo/llms/{content,commerce,local}.js` an (je `export function section(locale) { return "" }`) und bindet sie ein |
| `src/lib/analytics.js` | gehört **AP3**. Alle anderen rufen nur `trackEvent(name, params)` bzw. `trackLead(form, params)` auf und legen keine neuen Helfer an. Die Event-Namen stehen in 4.5 |
| `src/lib/site.js` | gehört **AP2** (NAP, Rechtsdaten, WhatsApp, Bewertungslink). Jedes Paket ersetzt hartcodierte Adressen, Telefonnummern und Öffnungszeiten **in seinen eigenen Dateien** durch Importe aus `site.js` |
| `src/utils/routing.js`, `src/proxy.js` | gehören **INT**. Neue Bereiche haben in Welle 1 in allen Sprachen den deutschen Slug (wie die Stadtseiten). Übersetzte Pfade trägt INT nach |
| Navbar- und Footer-Links | `src/lib/navigation.js` (neu, AP8). Neue Ziele trägt INT ein |
| `tests/` | AP0 legt die Konfiguration an. Jedes Paket schreibt **nur** `tests/e2e/apN.spec.js` und `tests/unit/apN/*.test.js` |
| `src/lib/flags.js` | legt AP0 mit **allen** Welle-1-Flags an. Danach ist die Datei eingefroren, Änderungen nur über INT |

**Bau-Regeln für jeden Agenten (aus 13 Abschn. 3.3 und 14):**
1. Vor dem Code die passende Next-16-Doku in `node_modules/next/dist/docs/` lesen. Regeln: kein `priority` an `next/image`. Das LCP-Bild bekommt `fetchPriority="high"`, sonst bei Bedarf `preload` oder `loading="eager"` (`image.md` Z. 287–293).
2. Jede neue `page.js` ruft `setRequestLocale(locale)` vor dem ersten `getTranslations` auf. Kein `headers()`/`cookies()` in Seiten, kein `cache: "no-store"` außer bei der Suche. Danach `npm run build` prüfen: neue Seiten erscheinen als ○ (statisch) oder ● (SSG/ISR), nie als ƒ.
3. Backoffice nur über `backofficeFetch` (AP1, ab Tag 3) bzw. die bestehenden Fetcher. Kritische Daten werfen bei Fehlern einen Fehler statt `[]` zurückzugeben.
4. **JS-Budget:** höchstens 10 KB gzip zusätzlich im Initial-Bundle pro Feature. Schweres (Lightbox, Kalender, Rechner > 3 KB) lädt per `next/dynamic` erst nach Klick oder Sichtbarkeit. Server Components sind Standard, `'use client'` steht nur an den Blättern.
5. Keine Inhalte mit `opacity: 0` vor der Hydration. Neue Komponenten verwenden `FadeInView` nicht mehr, sondern die CSS-Klasse `.reveal` (AP8 baut `FadeInView` auf CSS um). Animationen nur mit `transform`/`opacity`, höchstens 450 ms, mit `prefers-reduced-motion`.
6. Textfarbe Gold nur als `text-gold-text` (#7a5f17). `#d1b250` nur als Fläche mit dunkler Schrift oder als Linie. Fokus sichtbar mit ≥ 3:1, Zielgrößen ≥ 24 px, sichtbare Labels, Fehler per `aria-invalid` und `aria-describedby`.
7. **Claims:** keine Wörter wie „Händler“, „offiziell“, „autorisiert“, „Partner“, „Store“, „größte“ oder „Nr. 1“ zu Marken, außer bei ClassiCon über `src/lib/legal/claims.js`. Formel: „Minotti in unserer Ausstellung in Lochau“. `node scripts/check-claims.mjs` muss grün sein.
8. **Bilder:** nur eigene Fotos (`public/<paket-ordner>/`) oder Backoffice-Bilder, keine neuen Fremd-Hosts. Herstellerbilder nicht verändern (kein Zuschnitt, keine KI). Alt-Text nach dem Schema „Marke Modell – Ansicht“.
9. **Drittanbieter** (Kalender, Video, Karten) nur nach Klick bzw. Einwilligung, nach dem Muster von `ConsentEmbed`, und nur mit Eintrag im Dienste-Register (AP2).
10. **Sprachen:** Neue Seiten existieren unter `[locale]`. Wenn es den Inhalt nur auf Deutsch gibt, liefern andere Sprachen `notFound()` (wie bei den Stadtseiten) und kein hreflang.
11. **Tests je Paket:** `npm run lint`, `npm run build`, `npm run test:e2e -- tests/e2e/apN.spec.js` (Backoffice per `page.route` gemockt), axe ohne „serious“- oder „critical“-Befunde auf allen eigenen Seiten, `npm run lhci` auf den eigenen Vorlagen (Grenzen: LCP ≤ 2,5 s, TBT ≤ 200 ms, CLS ≤ 0,1, A11y und SEO ≥ 95), `npm run size` (Budget je Einstiegspunkt).

### 4.2 Die Arbeitspakete

Aufwand in Personentagen (PT) für einen Agenten bzw. Entwickler, ohne Wartezeit auf Entscheidungen.

---

#### AP0 – Fundament und Händler-Hotfix (seriell, zuerst) · 2 PT

**Ziel:** Rechtliches Sofortrisiko beseitigen. Caching und Sicherheit herstellen. Alle gemeinsamen Dateien so vorbereiten, dass AP1–AP9 ohne Konflikte parallel bauen können.

**Aufgaben:**
1. **Uncommittete Arbeit sichern.** Den lokalen Händler-Fix in `ueber-uns/marken/[title]/page.js` und `llms.txt/route.js`, `src/lib/analytics.js` sowie die `trackLead`-Aufrufe in den 4 Formularen und `client-layout.js` prüfen, `lint` und `build` laufen lassen, dann committen. Die untracked Stadtseiten und `preview/` **nicht** löschen. Sie gehen an AP6 bzw. AP8 über.
2. **Claim-Guard:** neue Datei `src/lib/legal/claims.js` mit `VERIFIED_DEALER_BRANDS = ["classicon"]`, `sanitizeClaims(text, brandSlug)` (entfernt Händler, autorisiert, offiziell, Vertragspartner, Partner, Store und Superlative) und einem Register-Array für belegte Claims. Angewendet auf Meta-Texte, `dealers_title`/`dealers_description` (bis zur Prüfung ausblenden, außer bei ClassiCon) in `marken/[title]/page.js`, `marken/[title]/[collection]/page.js`, `src/lib/marken/collectionPage.js`, `src/components/MarkenItems/markenitems.js`, Produkt-Meta in `produkte/[category]/[product]/page.js` und `llms.txt`. Dazu `scripts/check-claims.mjs`: prüft `src/messages/**`, `src/lib/content/**`, `llms.txt` und eine Sitemap-Stichprobe gegen `next start`.
3. `src/app/api/image/route.js` **löschen**, `/api/image` aus `src/app/robots.js` entfernen.
4. **`setRequestLocale(locale)`** in **allen** `page.js` unter `src/app/[locale]/**` (Stand 26.10.: 42 ohne `preview/`, per `grep -L setRequestLocale` ermitteln, nicht nach Zahl), auch in den untracked Stadtseiten, `adventsabend` und `bewerten`. `detectLocale()` bleibt nur im 404-Zweig. Akzeptanz: Die Build-Tabelle zeigt ○ oder ●, `.next/prerender-manifest.json` enthält `/de` und `/en/...`.
5. **Bibliotheken** (Versionen exakt pinnen, ohne `^`; alle sind am 26.10.2026 mindestens 14 Tage alt, geprüft mit `npm view <pkg> time`):

   | Aktion | Paket | Version | Lizenz | Client-Bundle | Für |
   |---|---|---|---|---|---|
   | entfernen | `lenis` | 1.3.27 | MIT | – | von 01/02 abgelehnt (Scroll-Hijacking), ungenutzt |
   | entfernen | `motion` | 12.43.0 | MIT | – | von 01 abgelehnt, ungenutzt (CSS/View Transitions reichen) |
   | behalten, pinnen | `embla-carousel-react` | 8.6.0 | MIT | ≈ 7 KB | AP4 Galerie, AP5/AP8 Slider-Ersatz |
   | neu | `yet-another-react-lightbox` | 3.32.2 | MIT | ≈ 12 KB + Zoom ≈ 3 KB, **nur dynamisch** | AP4 |
   | behalten, pinnen | `zod` | 4.6.7 (schon installiert, 12.10. = 14 Tage; Review 15) | MIT | 0 (nur Server) | AP0/AP3/AP9/AP7 |
   | neu | `rate-limiter-flexible` | 11.2.1 (11.2.3 ist < 14 Tage alt) | ISC | 0 (Server) | AP0/AP3 |
   | neu | `web-vitals` | 6.2.3 | Apache-2.0 | ≈ 3 KB, nach dem ersten Rendern | AP3 |
   | neu | `clsx` | 2.1.1 | MIT | ≈ 0,3 KB | AP8 `ui/*` |
   | neu | `@next/mdx` | **16.3.4** (= installierte Next-Version) | MIT | 0 (Build) | AP7 |
   | neu | `@mdx-js/loader`, `@mdx-js/react` | 3.1.1 | MIT | ≤ 1 KB | AP7 |
   | neu | `remark-gfm` | 4.0.1 | MIT | 0 (Build) | AP7 |
   | neu | `rehype-slug` | 6.0.0 | MIT | 0 (Build) | AP7 |
   | neu, optional | `@calcom/embed-react` | 1.5.3 | „SEE LICENSE IN LICENSE“ → **vor Installation Lizenz lesen**. Wenn unklar: Link-Variante mit 0 KB | ≈ 3 KB Wrapper + Cal-Skript nach Klick | AP3 (nur bei E7 = Cal.com) |
   | dev | `@playwright/test` | 1.64.0 | Apache-2.0 | 0 | Tests |
   | dev | `@axe-core/playwright` | 4.13.0 | MPL-2.0 | 0 | A11y-Tests |
   | dev | `@lhci/cli` | 0.15.1 | Apache-2.0 | 0 | Lighthouse-Budgets |
   | dev | `size-limit`, `@size-limit/preset-app` | 14.2.0 | MIT | 0 | JS-Budget |
   | dev | `vitest` | 5.0.3 | MIT | 0 | Unit-Tests (Rechner, Claims, Kanal-Regel) |
   | dev | `knip` | 6.41.0 | ISC | 0 | tote Dateien und Pakete |
   | dev | `qrcode` | 1.5.4 | MIT | 0 (Skript) | AP6 QR-Karten `/bewerten` |

   Den `browserslist`-Block aus `package.json` entfernen (Next-16-Standard: Safari 16.4+, spart ≈ 14 KB). Skripte ergänzen: `test:e2e`, `test:unit`, `lhci`, `size`, `check:claims`, `knip`. `react-slick`, `slick-carousel`, `react-share` und `react-icons` **bleiben** bis INT (sie sind noch importiert).
6. **i18n-Module:** `src/i18n/config.js` führt `src/messages/{locale}.json` mit `src/messages/modules/{platform,legal,leads,product,brand,local,content,shell,commerce}/{locale}.json` per Deep-Merge zusammen. Statische Liste, `await import()` je Modul. Alle 36 Dateien als `{}` anlegen.
7. **MDX aktivieren:** `next.config.js` → `next.config.mjs` (`next-intl/plugin` per `import`), `createMDX` mit Plugin-Namen als String (`'remark-gfm'`, `'rehype-slug'`, Turbopack-Pflicht laut `mdx.md` „Using Plugins with Turbopack“), `pageExtensions` um `md` und `mdx` ergänzen. Minimale Datei `src/mdx-components.js` anlegen, gehört danach AP7.
8. **Stubs und Verträge**, gehören danach den genannten Paketen:
   - `src/lib/forms/guard.js` → AP3. `guardForm(request, schema, { route, limit })` mit zod-Parse, Body ≤ 20 KB, Honeypot-Feld `website`, Zeitfalle (`_t` < 3 s = Bot), Rate-Limit 5 Anfragen pro 10 min pro IP aus `X-Forwarded-For`, generische Fehlercodes.
   - `src/components/Legal/FormPrivacyNote.js` → AP2. Hinweis unter dem Absenden-Knopf mit Link zur Datenschutzerklärung.
   - `src/lib/flags.js`, endgültig: `VOUCHER_MODE` (`anfrage` | `stripe_link`), `BOOKING_PROVIDER` (`none` | `calcom` | `link`), `BOOKING_URL`, `WHATSAPP_ENABLED`, `SHOW_PRICES=false`, `ATELIER_SHEET_URL`, `BREVO_ENABLED`, `ADS_ID`, `GLITCHTIP_DSN`.
   - Registries Sitemap/llms (siehe 4.1), Test-Konfiguration (`playwright.config.js`, `vitest.config.js`, `lighthouserc.json`, `.size-limit.json`, `tests/e2e/smoke.spec.js`) → AP1.
9. Branch, Commit, Deploy (Hotfix). Mit dem Inhaber den Termin für den manuellen Deploy klären (Release-Ordner kommt mit AP1).

**Akzeptanz:** Live hat die Minotti-Markenseite kein „Händler“ mehr in Title und Description. `/api/image` liefert 404. `npm run build` ist grün, ohne ƒ-Routen unter `/[locale]` (außer Suche/API). Live-Header der HTML-Seiten: `s-maxage`/`stale-while-revalidate` statt `no-store`. `check:claims` grün. Alle Stubs vorhanden.
**Recht (14):** F2 Allowlist nur ClassiCon, Backoffice-Händlerfelder ausblenden. Kein OS-Plattform-Link.
**Performance (13):** F1 statisch/ISR, Polyfills weg. Nach F1 dürfen keine leeren Backoffice-Antworten gecacht werden. Deshalb folgt AP1/F2 in den ersten 3 Tagen, bis dahin keine Änderung an den Fetchern.

---

#### AP1 – Plattform: Ausfallsicherheit, Sicherheit, Monitoring, CI · 8–10 PT

**Ziel:** Kein leerer Katalog bei einem Backoffice-Ausfall, kein Spam- oder Proxy-Missbrauch, jeder Fehler wird gemeldet, jedes Release ist automatisch geprüft (13 F2–F5).
**Dateien (Eigentum):** `src/lib/api/**` (alle Fetcher inkl. `Keywords/*`, neu `src/lib/api/http.js`), neu `src/app/[locale]/error.js`, `src/app/global-error.js`, neu `src/instrumentation.js`, `next.config.mjs` (nach AP0), `src/app/cmx/[...path]/route.js`, `src/app/api/shop-search/route.js`, `src/app/revalidate/**`, `src/lib/revalidate.js` (Altlast löschen), `src/lib/revalidateAuth.js`, `src/lib/apiBaseUrl.js`, `ecosystem.config.js`, neu `scripts/deploy.sh`, `.github/workflows/ci.yml`, `playwright.config.js`, `vitest.config.js`, `lighthouserc.json`, `.size-limit.json`, `eslint.config.mjs`, `tests/e2e/smoke.spec.js`, `tests/e2e/ap1.spec.js`, Modul `messages/modules/platform`.
**Umfang:**
1. `backofficeFetch(url, { tags, revalidate, timeoutMs = 6000, critical })` mit Timeout, 1 Retry und strukturierter Log-Zeile. Bei kritischen Daten wirft die Funktion einen Fehler, sodass die letzte gute ISR-Version ausgeliefert wird. `notFound()` nur bei echtem „nicht gefunden“. Alle Fetcher umstellen.
2. `error.js` (mit `retry`) und `global-error.js` in 4 Sprachen. „Ähnliche Produkte“ und andere Inseln dürfen ausfallen (`catchError` aus `next/error`).
3. `next.config.mjs`: `X-XSS-Protection` entfernen. **CSP nur als `Content-Security-Policy-Report-Only`**, Werte wie in 13 F3.4, ohne Nonces (Nonces würden das statische Rendering brechen). `images.contentSecurityPolicy` und `contentDispositionType: "attachment"` setzen, `qualities: [60, 75, 90]`, `formats` AVIF zuerst, `htmlLimitedBots` mit KI-Crawlern (08 F9b). Cache-Header für ungehashte `public/`-Bilder auf 7 Tage + `stale-while-revalidate`. `remotePatterns` erst in INT anhand des Bildaudits ändern.
4. `/cmx`: Timeout 8 s, Rate-Limit. `shop-search`: Rate-Limit.
5. **Monitoring ohne Client-Ballast:** `instrumentation.js` mit `onRequestError` schickt Fehler per `fetch` an GlitchTip oder Sentry EU (E11), **kein** Client-SDK in Welle 1. Uptime-Checks (Uptime Kuma oder Better Stack Free) auf `/de`, `/de/produkte`, eine Produktseite, `shop-search` und Backoffice-`ping`. `pm2-logrotate`.
6. **CI:** lint → unit → build → Playwright + axe → LHCI → size-limit → `check:claims`. Deploy in einen Release-Ordner, Symlink umstellen, `pm2 reload` (`scripts/deploy.sh`). ESLint: `jsx-a11y` auf „error“. Neue Regel `no-restricted-syntax` gegen `text-[#d1b250]` und gegen „Händler“-Strings, in Welle 1 als **warn**, INT stellt auf „error“.
**Bibliotheken:** keine neuen (`zod`, `rate-limiter-flexible` und Test-Tools aus AP0).
**Abhängigkeiten:** Server-Zugang (nginx: `X-Forwarded-For`, optional Brotli), Git-Host für CI, Konto bzw. Server für GlitchTip. **Kein Backoffice.**
**Akzeptanz:** Simulierter Backoffice-Ausfall (Mock 500/Timeout) liefert die zuletzt gute Seite statt einer leeren Seite oder 404. CSP-Reports kommen an. Ein Test-Fehler erscheint im Monitoring. CI blockiert bei LCP > 2,5 s (Labor), TBT > 200 ms, CLS > 0,1, JS > 190 KB gz pro Route und axe „serious“.
**Recht:** Monitoring in der EU-Region oder selbst gehostet, IP-Anonymisierung, kein Session Replay. Der Eintrag in der Datenschutzerklärung kommt von AP2 (Dienste-Register).
**Performance:** 0 KB Client. Zielwerte nach Welle 1: alle Seiten statisch/ISR, TTFB < 100 ms unter Last.

---

#### AP2 – Recht, Consent und Rechtsdaten · 5–7 PT (+ Anwalt)

**Ziel:** Abmahnfeste Rechtsbasis als Voraussetzung für Ads, Merchant Center und Kasse (14 F1, F2, F3-Register, F10-Erklärung, F11-Hinweis, F13). Eine Quelle für Firmendaten.
**Dateien:** `src/lib/site.js`, `src/lib/legal/**` (`claims.js` nach AP0, neu `services.js` = Dienste-Register, neu `imageRegister.js`), `src/components/Impressum/**`, `src/components/Datenschutz/**`, `src/app/[locale]/{impressum,datenschutz}/page.js`, `src/components/Cookies/**`, `src/components/Legal/**` (`FormPrivacyNote` nach AP0, neu `ReviewNotice.js`), neu `src/app/[locale]/barrierefreiheit/page.js`, neu `scripts/image-audit.mjs`, `scripts/check-nap.mjs`, `docs/legal/bildrechte.csv`, Modul `messages/modules/legal` (Namespaces `Cookies`, `Impressum`, `Datenschutz`), `tests/e2e/ap2.spec.js`.
**Umfang:**
1. `site.js` erweitern: `LEGAL` (Firma, FN, UID, GF, Kammer WKO Vorarlberg, Gewerbe, GewO-Link, Medieninhaber), `OPENING_HOURS` (strukturiert, auch für das Schema), `WHATSAPP` (Nummer aus E8, `whatsappHref(text)`), `GBP.reviewUrl`, `ADDRESS.street` gemäß E1 (Empfehlung „Landstraße 9“).
2. **Impressum** neu aus `site.js`: Kammer, Gewerbe, GewO, § 25 MedienG, eine Adresse, ohne Werbetext. **Datenschutzerklärung** neu: DPF statt Privacy Shield, § 165 Abs 3 TKG 2021, GA nur per Einwilligung. Der Abschnitt „Eingesetzte Dienste“ wird automatisch aus `services.js` erzeugt (Zweck, Rechtsgrundlage, Empfänger, Drittland, Speicherdauer). Dazu Hosting, Frappe-Backoffice, Mail, GlitchTip, Kalender, Brevo (falls aktiv), CH-Zusatz (Art. 19 revDSG, EDÖB) und DSB-Anschrift. Newsletter-Text an die echten Felder anpassen. **[Anwalt]** liest gegen.
3. **Consent:** `cookieServices` aus `services.js` speisen. `loadGoogleTag(consent)` lädt `gtag.js`, sobald Statistik **oder** Ads erlaubt ist (Fix aus 10 F1). `config` für GA4 nur mit Statistik, für `ADS_ID` nur mit Ads. Neue Dienste: `calCom` (Funktional, nach Klick), `youtube` (nach Klick). Meta, Pinterest und LinkedIn erst in Welle 2, wenn Konten existieren. Banner-Knöpfe gleich prominent (DSB, EDSA), Text nennt Google Ads, Personalisierung und Drittland. Consent Mode **Basic**, solange E21 offen ist.
4. **Barrierefreiheitserklärung** (4 Sprachen) mit Konformitätsstand, Kontakt für Barrieren und Marktüberwachung (Sozialministeriumservice).
5. **Bildregister:** `scripts/image-audit.mjs` listet alle Bild-URLs aus `public/`, `src/lib/data/**`, `remotePatterns` und einer Backoffice-Stichprobe mit Host. `imageRegister.js` und `bildrechte.csv` (Herkunft, Rechteinhaber, Freigabe, Umfang: Web/Ads/Feed/Bearbeitung/KI). Das Ergebnis geht als INT-Anfrage an AP1 (`remotePatterns`).
6. `ReviewNotice` („Wir zeigen Google-Bewertungen; Google prüft nicht, ob ein Kauf stattfand“) für AP6.
**Bibliotheken:** keine.
**Abhängigkeiten:** E1 (Hausnummer), E2 (Rechtsträger), AV-Verträge (Server, Frappe, Mail), Anwalt.
**Akzeptanz:** Kein „Privacy Shield“ und kein „TKG 2003“ mehr im Build-Output. Jeder Dienst im Banner hat einen Abschnitt in der Datenschutzerklärung (Unit-Test: gleiche Schlüsselmenge). Ads-Einwilligung allein lädt `gtag` ohne GA4-Config (Playwright prüft das am Netzwerk). `check-nap.mjs` meldet die verbleibenden hartcodierten Adressen. Die Liste geht an die Paketbesitzer bzw. INT.
**Recht (Muss vor Launch, 14 F1/F2/F10/F13):** alle Häkchen der Checklisten F1 und F13. Ein Formular-Hinweis ohne Pflicht-Checkbox. Superlative inventarisieren: „größte Minotti-Ausstellung Westösterreichs“ streichen, bis ein Beleg da ist (E12).
**Performance:** 0 KB. Das Banner lädt keine weiteren Skripte vor der Einwilligung.

---

#### AP3 – Lead-Strecke, Termin, Herkunft und Messung · 8–10 PT

**Ziel:** Mehr und bessere Anfragen, jede mit Herkunft. Online-Termin vor Höttges & Co. Messung als Grundlage für Ads ab Q1 2027 (05 F1–F3/F7/F8, 11 F1/F4/F10, 10 F2-Client/F5, 13 F3.2/F4.2, 02 F8).
**Dateien:** `src/app/api/{kontakt,beratung_anfrage,anfrage_produkt,newsletter_subscribe}/route.js`, `src/lib/forms/**` (`guard.js` nach AP0, neu `schemas.js`, `leadPayload.js`), neu `src/lib/attribution.js`, `src/lib/analytics.js`, neu `src/instrumentation-client.js`, `src/components/{BeratungClient,Beratung,AnfrageFormProduct,Kontakt,Newsletter,CartPage}/**`, `src/context/CartContext.js`, `src/app/[locale]/{beratung,kontakt,merkliste,newsletter}/page.js`, `src/components/Reusable/MobileCtaBar.js`, neu `src/components/Booking/BookingEmbed.js`, neu `src/components/Forms/SubmitButton.js`, neu `src/app/api/booking-webhook/route.js`, neu `src/app/[locale]/events/[slug]/page.js`, `src/lib/content/events.js`, neu `src/app/api/ics/[slug]/route.js`, Modul `messages/modules/leads` (Namespaces der Formulare, `Cart`, `MobileCta`), `tests/e2e/ap3.spec.js`, `tests/unit/ap3/*`.
**Umfang:**
1. **Routen härten:** `guardForm` + zod-Schema je Route mit Feld-**Allowlist** statt Durchreichen des Bodys. Keine Backoffice-Fehlerdetails an den Browser. `AbortSignal.timeout(10000)`. URL aus `NEW_API_BASE_URL`.
2. **Herkunft (`attribution.js`):** `captureAttribution()` läuft in `instrumentation-client.js` (nicht `useSearchParams`). Erfasst `utm_*`, Referrer-Host und Landingpage. Ohne Einwilligung bleiben die Werte im Arbeitsspeicher. **Mit Ads-Einwilligung** speichert `localStorage` `ph_attr` (90 Tage, First- und Last-Touch) zusätzlich `gclid`, `gbraid`, `wbraid`, `fbclid` und `msclkid`. `leadPayload.js` bestimmt den Kanal (Regel aus 11 F1, inkl. „KI-Suche“) und hängt den **Textblock „Herkunft (automatisch)“** an das vorhandene Freitextfeld. Dazu `lead_ref = crypto.randomUUID()`, das auch als `transaction_id` an `trackLead` geht.
3. **Beratungsstrecke (05 F2):** Schritt 0 fragt die Beratungsart (Showroom, Video, Hausbesuch, Rückruf, schriftlich). Dazu Wohnbereich, Land (AT/DE/CH/FL), Zeitrahmen und Budget-Spanne (optional). Die Auswahl wird mit **stabilen Schlüsseln** gesendet (deutsche Werte fürs Backoffice). „E-Mail **oder** Telefon“, Zurück-Knopf, kein Auto-Weiter. Danke-Zustand mit nächstem Schritt (Termin, WhatsApp, Route). „Wie sind Sie auf uns aufmerksam geworden?“ ist **Pflicht nur in der Beratungsstrecke**, sonst optional. **Produktanfrage entschlacken:** Pflicht nur Name, E-Mail oder Telefon und Land. Ob das Backoffice leere Felder annimmt, vorher mit einer Testanfrage prüfen, sonst Platzhalter „wird nachgereicht“.
4. **Termin (05 F1, 11 F4):** `BookingEmbed` lädt je nach `BOOKING_PROVIDER` per `next/dynamic` erst nach Klick: Cal.com, einen Link (Google-Terminplanung oder Bookings) oder nichts. Vorbefüllung mit `?produkt=` und der Herkunft. `booking-webhook` prüft die Signatur und leitet die Buchung per `after()` als Anfrage an den bestehenden Endpunkt weiter. Event `trackLead("termin")`. Tab „Termin buchen“ auf `/beratung`. `MobileCtaBar` mit Anrufen, WhatsApp und Termin. In der Merkliste: „Diese Auswahl im Showroom ansehen“.
5. **WhatsApp:** Click-to-Chat-Link mit vorbefülltem Text aus `site.js`, 0 KB, wenn `WHATSAPP_ENABLED` gesetzt ist.
6. **Event-Seite Adventsabend 26.11.** mit Anmeldung über die Kontakt-Route (Betreff „Event: …“) und `.ics`-Download. **Live bis 03.11.**
7. **Newsletter:** Honeypot, Interessen und Kundentyp (optional). Brevo-Double-Opt-in per `after()` nur bei `BREVO_ENABLED` (E9). Ohne Brevo bleibt der heutige Ablauf.
8. **Messung:** In `analytics.js` die Events aus 4.5. Web Vitals über `web-vitals` in `instrumentation-client.js` → `trackEvent("web_vitals")`, wirkt nur mit Einwilligung (gtag ist sonst ein No-op). `add_to_wishlist` in `CartContext`. „Merkliste“ heißt in der Oberfläche „Ihre Auswahl“ (01 F9), die Route bleibt.
9. **Datenschutzhinweis** (`FormPrivacyNote`) unter jedem Formular, `SubmitButton` mit Lade- und Erfolgszustand.
**Bibliotheken:** `zod`, `rate-limiter-flexible`, `web-vitals`, optional `@calcom/embed-react` (alle aus AP0).
**Abhängigkeiten:** E7 (Kalender-Tool, AVV), E8 (WhatsApp-Nummer), E9 (Brevo ja/nein), E22 (Eventdaten). Kein Backoffice: Die Struktur kommt als Text, die strukturierten Felder folgen in Welle 2.
**Akzeptanz:** Jede Testanfrage aller vier Formulare kommt mit Herkunftsblock und `lead_ref` im Backoffice an (gegen den Dev-Endpunkt oder einen Mock). Bot-Absenden unter 3 s wird abgewiesen, die 6. Anfrage in 10 min bekommt 429. Kein Drittanbieter-Request vor dem Klick auf „Kalender laden“. GA4 DebugView zeigt `generate_lead` mit `form` und `transaction_id`. Der Event-Termin lässt sich als `.ics` speichern.
**Recht (14 F1/F8/F13, 11 5.2):** Herkunft ohne Einwilligung nicht auf dem Gerät speichern. Klick-IDs nur mit Ads-Einwilligung senden. Kalender erst nach Klick laden, mit AVV und EU-Region. WhatsApp mit Hinweis auf Meta als eigenen Verantwortlichen und ein getrenntes Gerät. Keine Aufzeichnung von Video-Terminen. Kein Newsletter ohne Double-Opt-in.
**Performance:** Attribution < 1 KB, `web-vitals` ≈ 3 KB. Der Kalender kommt nie ins Initial-Bundle. Formularseiten: INP ≤ 150 ms.

---

#### AP4 – Produktseite, Katalog und Galerie · 10–12 PT

**Ziel:** 1.765 Produktseiten werden zur Long-Tail-Maschine und zur besten Produktseite der Region (08 F2 Teile 1–4/6/7, 03 F1–F3/F9, 02 F2–F4, 01 F5/F6 Layout, 13 F6.1).
**Dateien:** `src/app/[locale]/produkte/**` (Übersicht, Kategorie, Produkt), `src/components/ShopCatalog/**`, `src/lib/shop/**`, `src/lib/data/**`, `src/lib/seo/{structuredData.js,shopSeoCopy.js,productCategories.js}`, neu `src/components/Gallery/{Carousel,Lightbox}.js`, neu `src/components/ShopCatalog/{productFacts,productFaq,productDownloads,fitCheck,ProductCardMedia}.js`, neu `src/lib/data/dimensionsOverlay.js`, neu `src/lib/shop/productCopy.js` (Loader, liest `src/content/productCopy/*` von AP7), Modul `messages/modules/product`, `tests/e2e/ap4.spec.js`.
**Umfang:**
1. **Galerie zuerst (Teil-Merge bis Tag 3):** `Gallery/Carousel.js` (Embla, Pfeile, Punkte, `aria-roledescription="carousel"`, Zielgrößen ≥ 24 px) und `Gallery/Lightbox.js` (YARL + Zoom per `next/dynamic`, Pinch-Zoom). `productGallery.js` damit neu aufbauen, ohne react-slick. Alt-Texte „Marke Modell – Ansicht n“.
2. **Title und H1:** „Minotti Lawrence Sofa – Ausstellung am Bodensee | Platzhirsch“ (DE, EN, FR, IT nach 08 F2). `CATEGORY_SINGULAR` je Sprache, alle CMS-Titel laufen durch `sanitizeClaims`.
3. **Block „Bei Platzhirsch“:** Maße als Tabelle, Material, Designer, Serie, Lieferung AT/DE/CH/FL (Fakten aus `site.js`), Termin-CTA mit `?produkt=`. **Produkt-FAQ** (3 Vorlagen, ehrlich ohne Ausstellungs-Flag) als Text plus `FAQPage`. Herstellertext: nur der erste Absatz sichtbar, der Rest eingeklappt. Eigentexte aus `src/content/productCopy` nur mit `approved: true`.
4. **Downloads-Tab:** `pdf_produkte` aus der API auslesen (Datenblätter, Kataloge) mit `trackEvent("file_download")`. Knopf „Planungsdaten anfragen“ öffnet die Produktanfrage mit dem Betreff vorbelegt.
5. **Maßzeichnung 2.0** maßstäblich, „Passt es?“-Rechner (Client-Insel ≤ 3 KB). Maße im JSON-LD (`width`, `height`, `depth`, `QuantitativeValue` CMT). Overlay-Datei für Minotti, Poliform und Paola Lenti aus den öffentlichen Datenblättern (Fakten, keine Bilder), mit Quelle und Datum je Eintrag.
6. **Schema:** lokalisierte `category`, höchstens 5 Bilder, `sku`, `isRelatedTo`. **Kein `offers`** (`SHOW_PRICES=false`).
7. **Katalog:** Produkte ohne Bild ans Ende sortieren, bessere Ersatzkarte. Auf `/produkte` die ersten 2 Kacheln `loading="eager"`. Zweitbild beim Hover nur, wo `images[]` schon mehrere Bilder liefert (`ProductCardMedia`). `fetchPriority="high"` am LCP-Bild statt `priority`.
8. **Bildübergang Katalog → Produkt** mit React `<ViewTransition>` (`view-transitions.md`, ohne Konfiguration). Vorher prüfen, ob der next-intl-`Link` `transitionTypes` durchreicht. Wenn nicht: nur Crossfade, kein Umbau.
9. `trackEvent("view_item", { item_brand, item_category })` über eine kleine Client-Insel. CTA „Video-Beratung zu diesem Stück“ → `/beratung?art=video&produkt=…`.
**Bibliotheken:** `embla-carousel-react` 8.6.0, `yet-another-react-lightbox` 3.32.2 (dynamisch).
**Abhängigkeiten:** keine Backoffice-Felder. Liste der Ausstellungsstücke für ehrliche FAQ-Antworten: Team (optional über das Atelier-Sheet von AP9). Breadcrumb „Minotti Sofas“ und Link „Alle Teile der Serie“ verdrahtet INT nach dem Merge von AP5.
**Akzeptanz:** Produktseite ohne react-slick. Pinch-Zoom auf dem Handy, Lightbox-Chunk erst nach Klick. Rich-Results-Test grün (Product, FAQPage, BreadcrumbList) ohne `offers`. Downloads bei Lawrence sichtbar. 961 Produkte mit Maßtabelle, plus Overlay-Produkte. LHCI Produktseite: LCP ≤ 2,5 s, CLS ≤ 0,1.
**Recht:** keine Händler-Formulierung, keine Preise. Herstellerbilder nicht bearbeiten. DWG/CAD der Hersteller nur verlinken, nicht hosten. Maßangaben mit Quelle.
**Performance:** Galerie ≤ 10 KB initial (Embla), Lightbox nur dynamisch, View Transitions 0 KB. Das LCP-Bild ist nie lazy.

---

#### AP5 – Marken, Marke × Kategorie, Kollektions-Hubs, Sitemap, robots und llms · 8–10 PT

**Ziel:** Linkfluss von der Marke in die Produkte, eigene Seiten für „Minotti Sofas“ und „Minotti Lawrence“, KI-Sichtbarkeit (08 F3, F4, F8, F9 g/h, F10, 01 F4 nur Template-Logik).
**Dateien:** `src/app/[locale]/ueber-uns/marken/**`, `src/components/{MarkenItems,MarkenClient}/**`, `src/lib/marken/**` (neu `families.js`, `brandCategoryPage.js`), neu `src/lib/seo/brandCategorySlugs.js`, neu `src/lib/seo/schemas/collection.js`, `src/lib/seo/{sitemapEntries.js,pageMetadata.js,brandSchema.js,legacyProductRedirects.js}`, `src/app/sitemap*.xml/**`, `src/app/robots.js`, `src/app/llms.txt/route.js`, neu `src/app/llms-full.txt/route.js`, `src/lib/content/{brands.js,brandCopy.json,familyOverrides.json}`, `src/app/[locale]/[slug]/page.js`, `src/app/[locale]/[...rest]/page.js`, Modul `messages/modules/brand` (Namespace `Marken`), `tests/e2e/ap5.spec.js`.
**Umfang:**
1. **Marke × Kategorie** in der bestehenden Route `[title]/[collection]` mit fester Auflösung: Collection → Kategorie-Slug → Familie → 404. Build-Check gegen Slug-Kollisionen. Indexierbar erst ab 3 Produkten, sonst `noindex,follow`. Gitter wird serverseitig gerendert, ohne Load-more für Bots. Schema `CollectionPage`, `ItemList`, `Brand`. Markenseite und Kategorieseite verlinken die neuen URLs **statt `?marke=`**.
2. **Kollektions-Hubs** aus den Produktnamen (`deriveFamilies`, Overrides als JSON, ab 2 Produkten), Schema `ProductGroup`. Helfer `familyHref(product)` und `brandCategoryHref(brand, category)` exportieren, INT verdrahtet sie in AP4.
3. **Markenseiten:** serverseitig gerenderte Liste der Top-24-Produkte, Familien und Marke × Kategorie-Links. Eigentext aus `brandCopy.json` für 8 Top-Marken, das Team liefert die Texte, Formel „Ausstellung in Lochau“. ClassiCon mit „Offizieller ClassiCon-Händler“ und Link auf den Locator als Beleg. Auf `buildPageMetadata` umstellen. Slick durch `Gallery/Carousel` (AP4) ersetzen. Markenlogos durch typografische Namen ersetzen, wenn E12 so entschieden ist.
4. **Sitemap:** Marke × Kategorie, Familien, die Registries (content, commerce, local). Image-Sitemap **nur für eigene Fotos**.
5. **robots:** nach E10 (Empfehlung: GPTBot, ClaudeBot, Google-Extended und Applebot-Extended für HTML erlauben, `/cmx/` und `/_next/image` für diese Bots sperren). **llms.txt** ausbauen (Fakten ohne Händler-Behauptung, Regionen, Ratgeber über die Registries), neu `llms-full.txt`.
**Bibliotheken:** keine.
**Abhängigkeiten:** Markentexte (Team), E10, E12. Kein Backoffice: Die Collections im Backoffice haben Vorrang, sobald es sie gibt.
**Akzeptanz:** `/de/ueber-uns/marken/minotti/sofas` liefert ein Produktgitter mit mehr als 3 Produkten. `/…/minotti/lawrence` ist ein Hub mit allen Teilen. Die Minotti-Seite verlinkt mindestens 24 Produkte direkt. Keine `?marke=`-Links mehr auf der Markenseite. Sitemap valide (Test), `llms-full.txt` ist erreichbar, `check:claims` grün.
**Recht:** Allowlist nur ClassiCon. Keine Fremdmarken-Domains. Logos nicht als Siegel verwenden.
**Performance:** Die Produktliste ist eine Server Component, kein zusätzliches Client-JS. Markenseite: LCP ≤ 2,5 s.

---

#### AP6 – Regionen, Schweiz-Hub, Local SEO und Bewertungen · 6–8 PT

**Ziel:** Stadt- und Länderseiten ohne Doorway-Risiko, Schweiz-Hub mit CHF-Rechner, einheitliche Adresse, Bewertungen sammeln (08 F7, 09 F1-Code/F3a/F5/F6/F7, 14 F7/F11).
**Dateien:** alle `src/app/[locale]/designermoebel-*/**` (13, inkl. der 8 untracked), `src/app/[locale]/{moebel-bodensee,interior-design-vorarlberg,kuechen-vorarlberg,wohnzimmer-einrichten-vorarlberg}/**`, `src/components/Landing/**`, `src/lib/content/landingPages.js`, neu `src/app/[locale]/einkaufen-aus-der-schweiz/page.js`, neu `src/components/Landing/ChfRechner.js`, neu `src/lib/ch/{calc.js,ecbRate.js}`, `src/app/[locale]/layout.js`, neu `src/lib/seo/schemas/localBusiness.js`, neu `src/app/[locale]/bewerten/page.js` (Redirect auf `GBP.reviewUrl` mit `review_click`), neu `src/components/Reviews/{ReviewSummary.js,fallback.json}`, neu `scripts/make-review-qr.mjs`, `src/lib/seo/sitemap/local.js`, `src/lib/seo/llms/local.js`, Modul `messages/modules/local` (Namespace `Landing`), `tests/e2e/ap6.spec.js`, `tests/unit/ap6/calc.test.js`.
**Umfang:**
1. **Doorway-Audit aller 13 Stadtseiten.** Indexierbar bleibt eine Seite nur mit mindestens 4 regionsspezifischen Fakten, die auf keiner anderen Seite stehen: Fahrzeit, Steuer- und Lieferablauf, Referenz (falls vorhanden), regionale Begriffe, passende Marken. Sonst `noindex,follow`, bis Fakten da sind. **Höchstens 8 indexierte Regionsseiten** plus Schweiz-Hub. Die geprüften Seiten kommen in `landingPages.js` und damit in die Sitemap. Den Alt-Text „Meerblick“ auf der Lindau-Seite korrigieren (12).
2. **Schweiz-Hub** `/de/einkaufen-aus-der-schweiz` (de-CH-Schreibung): Wege A und B (Bericht 18), CHF-Rechner als dynamische Insel. Die Formel steht in `calc.js` (Unit-Tests), der EZB-Kurs kommt per Server-Fetch mit täglicher Revalidierung. Die Seite zeigt Kurs, Datum, Quelle, Rundung und Zuschlag offen und ist als „**unverbindliche Kostenschätzung**“ gekennzeichnet. **[Steuerberater/Zollspediteur]** liest den Text vor dem Livegang gegen. Ohne Freigabe bleibt die Seite `noindex` und unverlinkt.
3. **Schema aus `site.js`:** `layout.js` nutzt `localBusiness.js` (FurnitureStore, legalName, Adresse, Öffnungszeiten, `sameAs` mit Instagram/Facebook/LinkedIn/GBP, `areaServed` mit Städten und Wikidata-Links). **Kein `aggregateRating`.** OG-Locale einheitlich.
4. **Bewertungen:** `/bewerten` mit `trackEvent("review_click")`, QR-Karten-Skript (PDF/PNG für den Druck), `ReviewSummary` statisch (Sternwert, Anzahl, Datum, Link zu Google) **erst ab ca. 15 Bewertungen** und immer mit `ReviewNotice` (AP2). `directions_click` an den Routenlinks der eigenen Seiten.
**Bibliotheken:** `qrcode` (dev, Skript). Für den EZB-Kurs reicht eine Regex, keine XML-Bibliothek.
**Abhängigkeiten:** E1 (Hausnummer), E15 (welche Stadtseiten), Steuerberater-Text, Google-Bewertungslink (Team). Team-Aufgaben ohne Code laut 09 Abschn. 6.1: Google-Profil, Herold, OSM, Apple, Bing.
**Akzeptanz:** Jede indexierte Stadtseite besteht die Fakten-Prüfung (Unit-Test über `landingPages.js` mit `facts.length >= 4`). Der Rechner liefert die gleichen Werte wie die Beispielrechnung aus 18 (Test). Rich-Results-Test für LocalBusiness grün. `/bewerten` leitet weiter und erzeugt das Event. `check-nap` meldet in AP6-Dateien keine hartcodierte Adresse mehr.
**Recht (14 F7/F11/F16):** keine „steuerfrei“- oder „Festpreis“-Werbung, keine Steuerberatung, Montage in CH ohne Versprechen. Bewertungen ohne Anreize und ohne Review-Gating, QR-Karte statt Massenmail. Keine Vergleichswerbung gegen Wettbewerber.
**Performance:** Rechner ≤ 3 KB, dynamisch. Stadtseiten statisch.

---

#### AP7 – Content, Ratgeber und Markenstimme · 6–8 PT (+ Redaktion laufend)

**Ziel:** Kauffragen beantworten, die in der Region niemand beantwortet. Texte in der Markenstimme „Der Gastgeber“. KI-gestützte Produktion mit Qualitätsnetz (12 C1/C2/C5/C6/C10, 08 F5/F12).
**Dateien:** `src/messages/{de,en,fr,it}.json` (Basis), `src/mdx-components.js` (nach AP0), `src/content/**` (`ratgeber/{de,en}/*.mdx`, `projekte/`, `facts.json`, `productCopy/{de,en,fr,it}.json`), neu `src/app/[locale]/ratgeber/{page.js,[slug]/page.js}`, neu `src/app/[locale]/projekte/{page.js,[slug]/page.js}` (Template, `noindex`, solange keine freigegebenen Projekte vorliegen), `src/components/{Ratgeber,Video,Projects}/**`, neu `src/lib/content/ratgeber.js`, neu `src/lib/seo/schemas/article.js`, `src/lib/seo/sitemap/content.js`, `src/lib/seo/llms/content.js`, `docs/content/**` (Brand Voice, Glossar, Prompts, Fotostil-Leitfaden), `.vale.ini`, `styles/Platzhirsch/**`, `scripts/content/**`, `scripts/check-facts.mjs`, Modul `messages/modules/content`, `tests/e2e/ap7.spec.js`.
**Umfang:**
1. **Textreparatur** in der Basis-Messages: `About.ourMissionDesc` (klingt nach Werbeagentur), den Platzhalter in `work.steps`, „Präzession“ → „Präzision“, Newsletter ohne „Rabatte“. Markenstimme und Verbotsliste in `docs/content/brand-voice.md`. Gegenlesen durch Muttersprachler (EN, FR, IT).
2. **Ratgeber-Gerüst:** Hub, Artikel-Vorlage mit Antwort-Box (40–60 Wörter), Tabellen, `<ProduktKarte>`, `<TerminCTA>`, `<Preisrahmen>` (datiert, ohne Betrag, solange E13 offen ist), `<FAQ>`. Metadaten als `export const meta` (ohne Frontmatter-Plugin), mit zod geprüft: `reviewedBy` und `updatedAt` sind Pflicht, sonst bricht der Build ab. JSON-LD `Article` mit echter Autorin bzw. echtem Autor, `BreadcrumbList`, `FAQPage` nur bei echten Fragen. `generateStaticParams`, `dynamicParams = false`.
3. **Erste 3 Artikel bis KW 48:** (1) Möbel aus Österreich in die Schweiz liefern (mit AP6 abgestimmt, Steuerberater-Freigabe), (2) Lieferzeiten italienischer Designmöbel, (3) Outdoor-Möbel am See: Materialien. Danach 1–2 Artikel pro Woche (Themenliste 12 C2).
4. **Qualitätskette:** Vale-Regeln (Verbotsliste „Händler/autorisiert/größte“), `facts.json` als einzige Faktenquelle für Entwürfe, `check-facts.mjs` (jede Zahl im Text muss in einer Quelle stehen). Skript für Produkt-Eigentexte über Ollama auf der lokalen GPU: Entwürfe nach `src/content/productCopy/drafts/`, live nur mit `approved: true`, höchstens 30 % Überschneidung mit dem Herstellertext. Freigabe per Pull Request.
5. **Video-Komponente** `InlineVideo` (natives `<video>`, Poster, Untertitel, `VideoObject`), YouTube nur als Fassade nach Klick.
**Bibliotheken:** `@next/mdx` 16.3.4, `@mdx-js/loader` und `@mdx-js/react` 3.1.1, `remark-gfm` 4.0.1, `rehype-slug` 6.0.0, `zod`. Lokal (nicht im Repo-Bundle): Vale 3.x (MIT), LanguageTool 6.x (LGPL-2.1, Docker), Ollama, `faster-whisper` 1.x (MIT).
**Abhängigkeiten:** Freigabe der Markenstimme durch die Inhaberin, Steuerberater (Schweiz-Artikel), echte Autorinnen und Autoren aus dem Team.
**Akzeptanz:** `/de/ratgeber` und 3 Artikel sind statisch (●). Der Build bricht ohne `reviewedBy` ab. Vale und `check-facts` laufen in CI (INT-Anfrage an AP1). Keine verbotenen Wörter in `messages/*.json`. Ratgeber stehen in Sitemap und `llms.txt` (über die Registries).
**Recht (14 F16, 12):** Preise nur als datierte Rahmen ohne UVP-Listen. Vergleiche („Minotti oder B&B Italia?“) sachlich und ohne Herabsetzung. Herstellerbilder nur mit Freigabe. Projekte nur mit Einwilligung der Kunden, ohne Adresse und mit entfernten EXIF-Daten.
**Performance:** MDX zur Build-Zeit, ≤ 1 KB Client. Video nur mit Poster und `preload="none"`.

---

#### AP8 – Shell, Designsystem-Fundament und Barrierefreiheit · 10–14 PT

**Ziel:** Leichtere Shell, ruhigeres Designsystem, WCAG 2.2 AA in Navigation und Layout, Ablösung der JS-Animationen (01 F1/F2-Struktur/F10, 02 F1/F7, 13 F6.5–7/F7).
**Dateien:** `src/app/globals.css`, `src/app/[locale]/{client-layout.js,LoaderWrapper.js,page.js,not-found.js}`, `src/app/{layout.js,page.js,not-found.js}`, `src/components/Navbar/**` (aufgeteilt in `Header.js` als Server Component sowie `MegaMenu.js`, `MobileMenu.js`, `SearchDialog.js`, `LocaleSwitch.js` als Client-Inseln), neu `src/lib/navigation.js`, `src/components/Reusable/{Footer,FadeInView,breadcrumbBar,singlePageSlider,JsonLd}.js`, `src/components/{Home,UberUns,Team,Presse,Partner,News,NewsItem,NotFound,Karriere,WhyChooseUsSectionHome,ProuductSectionHome,Preview}/**`, `src/app/[locale]/ueber-uns/{platzhirsch,team,presse,partner,karriere}/**`, `src/app/[locale]/news/**`, `src/app/[locale]/preview/**`, neu `src/components/ui/{Button,Section,Overline,Hairline}.js`, neu `src/app/[locale]/styleguide/page.js` (`noindex`), Modul `messages/modules/shell` (Namespaces `Navbar`, `Footer`), `tests/e2e/ap8.spec.js`.
**Umfang:**
1. **`FadeInView` → CSS-Reveal** (`animation-timeline: view()`, Inhalt immer sichtbar, kein `will-change` auf Dauer). Gleiche API, damit fremde Dateien ohne Änderung weiterlaufen. Motion-Tokens in `globals.css` (02 3.2).
2. **Header:** Server-Gerüst plus Inseln, ca. 72 px hoch. „Marken“ wird Hauptpunkt, ein Termin-Knopf, Mega-Menü „Raum zuerst“ (Wohnen, Küche, Outdoor, Marken, Projekte, Das Haus) mit Popover API bzw. `<dialog>`, mobiles Vollbild-Menü. Die Suche lädt erst bei Fokus. `react-icons` → `lucide-react`. Die Links kommen aus `navigation.js`. **Die Optik bleibt in Welle 1 nah am heutigen Stand.** Papier-Hintergrund und Schriftwechsel folgen erst nach E14 in Welle 2.
3. **Designsystem-Fundament:** Tokens (`paper`, Typo-Skala, `gold-text`), `ui/*`-Primitives mit `clsx`, Styleguide-Seite. Gold-Kontrast und `priority` in **allen AP8-Dateien** beheben. Skip-Link „Zum Inhalt springen“, Fokusring zweifarbig, `scroll-padding-bottom` für die CTA-Leiste.
4. **Slider-Ablösung** in `Home/about.js` und `UberUns/austellung.js` mit `Gallery/Carousel` (AP4) und sichtbarem Pause-Knopf (WCAG 2.2.2). `react-share` in `Karriere` → Web Share API und Links.
5. **Hero:** `fetchPriority="high"`, kein `hero-zoom` auf dem Handy. **Kein** Zuschnitt des Minotti-Fotos (Bearbeitung verboten). Das eigene Foto ersetzt es nach dem Fotoshooting (E6).
6. Preview `/de/preview/galerie` bleibt `noindex` als Design-Vorschlag für E14. Keine Übernahme in die Produktion in Welle 1.
**Bibliotheken:** `clsx` 2.1.1, `embla-carousel-react` (über AP4), `lucide-react` (vorhanden).
**Abhängigkeiten:** E14 (Designrichtung), Fotoshooting (E6). Galerie von AP4 bis Tag 3.
**Akzeptanz:** Navbar-Client-Code ≤ 40 % des heutigen Stands. JS initial auf `/de` ≤ 170 KB gz (Budget). Tastaturbedienung des Mega-Menüs, Escape schließt, Fokus kehrt zurück. axe ohne Befunde auf Start, Haus, Team, News. Kein `react-slick`, `react-icons` oder `react-share` mehr in AP8-Dateien. Lighthouse A11y 100 auf `/de`.
**Recht (14 F10):** WCAG 2.2 AA für Navigation, Modal und Karussell (Pflicht vor jeder Kasse in Welle 2).
**Performance:** Ziel `/de`: LCP ≤ 2,3 s Labor, TBT ≤ 150 ms, CLS 0.

---

#### AP9 – Commerce Welle 1: Gutscheine und Atelierverkauf · 6–8 PT

**Ziel:** Umsatz und Liquidität vor Weihnachten **ohne** Online-Kasse. Damit entfallen in Welle 1 FAGG-Kassenpflichten, Widerrufsbutton und (nach herrschender Lesart) BaFG (07 F1a/F2, 08 F6 A, 14 F4/F6, 23 Abschn. 5 Nr. 2 und 4).
**Dateien:** neu `src/app/[locale]/{gutscheine,gutscheinbedingungen,atelierverkauf}/**` (Atelier: Liste und `[slug]`), `src/components/{Gutschein,Atelier}/**`, `src/lib/commerce/{atelierSource.js,priceRules.js,offerSchema.js}`, neu `src/app/api/{gutschein_anfrage,atelier_reservierung}/route.js`, `public/atelier/**` (eigene Fotos), `src/lib/seo/sitemap/commerce.js`, `src/lib/seo/llms/commerce.js`, Modul `messages/modules/commerce`, `tests/e2e/ap9.spec.js`, `tests/unit/ap9/*`.
**Umfang:**
1. **Gutscheine** (`VOUCHER_MODE=anfrage`): Seite mit Betrag (ab 25 €, Vorschläge 50, 100, 250, 500, 1.000 €), Motiv, Empfänger und Grußtext. Die Anfrage geht über `guardForm` als Text an das Backoffice, Bestätigung: „Rechnung und PDF-Gutschein innerhalb von 24 h“. **Unbefristet**, Teileinlösung, Restguthaben, keine Barablöse (Gutscheinbedingungen-Seite). Firmengeschenke über dasselbe Formular (Firmenfeld, Stückzahl). Erst wenn E3/E4 mit Anwalt und Steuerberater entschieden sind, schaltet `VOUCHER_MODE=stripe_link` auf einen Stripe Payment Link mit Gutscheinbedingungen, Widerrufsbelehrung und Impressum. Dafür ist kein Code-Deploy nötig, nur die Umgebungsvariable.
2. **Atelierverkauf:** Datenquelle ist ein Google Sheet (als CSV veröffentlicht, `revalidate: 3600`, Tag `atelier`) mit zod-Prüfung. Fallback: zuletzt gute Version bzw. Repo-JSON. Liste und Detail mit eigenem Foto, Maßen, **Zustandsbeschreibung**, echtem Preis inkl. USt, „zzgl. Lieferung, nach Aufwand“, Standort Lochau. `priceRules.js` erzeugt alle Pflichtzusätze. **Keine Streichpreise.** Stattdessen „UVP des Herstellers für Neuware: … (Stand, Quelle)“, nur mit Beleg. Knopf „Reservieren“ führt zur Reservierungsanfrage (`atelier_reservierung`) und zeigt den nächsten Schritt: „Wir melden uns innerhalb von 24 h; Reservierung gegen Anzahlung per Rechnung“. JSON-LD `Product` + `Offer` (`price`, `priceCurrency`, `availability: InStock`, `itemCondition`, `priceValidUntil`). Ein Stück mit Status „reserviert“ oder „verkauft“ verschwindet nach der Revalidierung (Webhook-Tag oder 1 h).
3. Events: `trackLead("gutschein")`, `trackLead("atelier_reservierung", { value })`, `select_item`.
**Bibliotheken:** `zod`. **Kein** `stripe` in Welle 1 (kommt in Welle 2 als `stripe@23.0.0`, siehe 7).
**Abhängigkeiten:** E4 (Gutschein-Modus, Mehrzweck oder Einzweck **[Steuerberater]**), E5 (Inventur, Preisregel 20–55 % nach Alter, wer das Sheet pflegt), eigene Fotos (Team), PDF-Vorlage (Team, Canva/InDesign). Kein Backoffice.
**Akzeptanz:** Gutscheinanfrage kommt mit allen Feldern und Herkunft an. Atelier-Liste zeigt die Sheet-Daten. Eine fehlerhafte Zeile (zod) wird übersprungen und protokolliert, die Seite bricht nicht. Rich-Results-Test „Produkt-Snippet“ grün. Ein Stück mit Status „verkauft“ ist nach Revalidierung weg. **Live bis 16.11.** (Gutscheine), Atelier nach der Inventur (KW 47).
**Recht (14 F4/F6):** Gesamtpreis inkl. USt, keine „statt“-Preise ohne 30-Tage-Historie. Hinweis auf den Zustand je Stück; die gesonderte Zustimmung zum Zustand holt das Team beim Vertragsschluss schriftlich ein, die Seite kündigt das an. Gutscheine unbefristet (AT 30 Jahre). Keine Händler-Formulierung („Minotti-Ausstellungsstück aus unserem Showroom in Lochau“). **Kein Online-Vertragsschluss in Welle 1.** Sonst greifen FAGG-Pflichten, Widerrufsbutton (§ 13a FAGG seit 01.10.2026) und gegebenenfalls BaFG. Kundengeld bei negativem Eigenkapital **[Anwalt]** (07 5.2): Gutscheine und Anzahlungen nicht zur Deckung alter Verbindlichkeiten.
**Performance:** 0 KB zusätzliche Bibliotheken, Seiten statisch mit ISR.

---

### 4.3 Eigentumsmatrix (Kurzfassung)

| Bereich / Datei | Besitzer | Message-Modul (Bestands-Namespaces, die überschrieben werden dürfen) |
|---|---|---|
| `package.json`, `package-lock.json`, `src/i18n/config.js`, `src/lib/flags.js` | AP0 (danach eingefroren, Änderungen über INT) | – |
| `src/lib/api/**`, `next.config.mjs`, `instrumentation.js`, `cmx`, `shop-search`, `revalidate/**`, CI, Tests-Config, `eslint.config.mjs`, `ecosystem.config.js` | AP1 | `platform` |
| `src/lib/site.js`, `src/lib/legal/**`, `Impressum`, `Datenschutz`, `Cookies`, `Legal`, `barrierefreiheit` | AP2 | `legal` (`Cookies`, `Impressum`, `Datenschutz`) |
| Formular-Routen, `src/lib/forms/**`, `attribution.js`, `analytics.js`, `instrumentation-client.js`, Formulare, `CartPage`, `CartContext`, `MobileCtaBar`, `Booking`, `events` | AP3 | `leads` (Formular-Namespaces, `Cart`, `MobileCta`) |
| `produkte/**`, `ShopCatalog/**`, `Gallery/**`, `src/lib/shop/**`, `src/lib/data/**`, `structuredData.js`, `shopSeoCopy.js`, `productCategories.js` | AP4 | `product` (Shop- und Produkt-Namespaces) |
| `ueber-uns/marken/**`, `MarkenItems`, `MarkenClient`, `src/lib/marken/**`, Sitemaps, `robots.js`, `llms*.txt`, `pageMetadata.js`, `brandSchema.js`, `[slug]`, `[...rest]` | AP5 | `brand` (`Marken`) |
| Stadt- und Regionsseiten, `Landing/**`, `landingPages.js`, Schweiz-Hub, `src/lib/ch/**`, `[locale]/layout.js`, `localBusiness.js`, `bewerten`, `Reviews` | AP6 | `local` (`Landing`) |
| Basis-`messages/*.json`, `mdx-components.js`, `src/content/**`, `ratgeber/**`, `projekte/**`, `Ratgeber`, `Video`, `Projects`, `article.js`, `docs/content`, `scripts/content` | AP7 | `content` |
| `globals.css`, `client-layout.js`, `LoaderWrapper.js`, Startseite, Navbar, Footer, `navigation.js`, `ui/**`, Home/Über-uns/News/Team/Presse/Partner/Karriere, Preview | AP8 | `shell` (`Navbar`, `Footer`) |
| `gutscheine`, `gutscheinbedingungen`, `atelierverkauf`, `Gutschein`, `Atelier`, `src/lib/commerce/**`, `public/atelier/**` | AP9 | `commerce` |
| `src/utils/routing.js`, `src/proxy.js`, Eintragungen in `navigation.js`, Entfernen von Paketen | INT | – |

### 4.4 Integrationsschritt INT (KW 49, ein Agent, 2–3 PT)

1. **Übersetzte Pfade:** `ROUTES` und `TRANSLATED_SECTIONS` für `ratgeber` (`/guides`, `/guides`, `/guide`), `gutscheine`, `atelierverkauf`, `einkaufen-aus-der-schweiz`, `barrierefreiheit`, `events` (12 Sprachvarianten aus den PR-Beschreibungen). 308 von den deutschen Slugs in den Fremdsprachen.
2. **Navigation und Footer:** Einträge in `navigation.js`: Gutscheine, Atelierverkauf, Ratgeber, Schweiz/Liechtenstein, Termin, Barrierefreiheit, Gutscheinbedingungen.
3. **Querverweise:** In AP4 Breadcrumb „Marke × Kategorie“ und „Alle Teile der Serie“ über die Helfer aus AP5. „Passende Ratgeber“ auf Produkt- und Markenseiten, sofern AP7 einen Helfer liefert.
4. **Messages aufteilen:** `LoaderWrapper` reicht nur die Namespaces der Client-Komponenten weiter (Liste aus den PRs, Test: kein `MISSING_MESSAGE` in allen E2E-Läufen). Ziel: RSC-Payload −30 KB.
5. **Pakete entfernen:** `react-slick`, `slick-carousel`, `react-share`, `react-icons`. Vorher muss `grep` 0 Treffer liefern und `knip` sauber sein.
6. **Regeln scharf schalten:** ESLint-Regeln (Gold als Textfarbe, Händler-Wörter, `priority`) von warn auf error. Restbefunde aus `check-nap.mjs` und der Gold-Suche in Dateien ohne aktives Paket beheben.
7. **`remotePatterns`** anhand des Bildaudits aus AP2 straffen (z. B. `images.unsplash.com` raus, wenn ungenutzt). Herstellerhosts bleiben bis zur Klärung, Hotlinking wird nicht ausgebaut.
8. **Gesamtprüfung:** voller CI-Lauf, LHCI auf 6 Vorlagen (Start, Kategorie, Produkt, Marke, Stadtseite, Ratgeber), axe auf 10 Kernseiten, `check:claims`, Rich-Results-Stichprobe. Danach Deploy über den Release-Ordner, Sitemap in Search Console und Bing neu einreichen, 2 Wochen „stummes Tracking“ vor jedem Mediastart.

### 4.5 Event-Katalog (verbindlich für alle Pakete)

`generate_lead` (mit `form`: `kontakt`, `beratung`, `produkt_anfrage` (so heute im Code, Review 15), `newsletter`, `termin`, `gutschein`, `atelier_reservierung`, `event`; dazu `transaction_id` = `lead_ref`) · `contact_click` (`phone`, `email`, `whatsapp`) · `view_item` · `add_to_wishlist` · `select_item` · `file_download` · `gallery_zoom` · `review_click` · `directions_click` · `booking_open` · `web_vitals` · `chf_calc_used` · `ratgeber_read` (Scrolltiefe 75 %). In GA4 als Key Events: `generate_lead`, `contact_click`, `review_click`.

### 4.6 Welle-1-Paketübersicht (Aufwand)

| Paket | PT | Startbedingung | Muss-Termin |
|---|---|---|---|
| AP0 Fundament + Hotfix | 2 | sofort | 28.10. Hotfix live, 30.10. fertig |
| AP1 Plattform | 8–10 | AP0 | Fetch-Wrapper Tag 3 |
| AP2 Recht und Consent | 5–7 | AP0, E1/E2 | KW 47 (vor Ads und Kasse) |
| AP3 Leads und Termin | 8–10 | AP0, E7/E8 | Event-Seite 03.11., Termin KW 46 |
| AP4 Produktseite | 10–12 | AP0 | Galerie Tag 3, Rest KW 48 |
| AP5 Marken und SEO | 8–10 | AP0 | KW 48 |
| AP6 Regionen und Local | 6–8 | AP0, E1/E15 | Schweiz-Hub KW 47 (nach Freigabe) |
| AP7 Content und Ratgeber | 6–8 | AP0 | 3 Artikel KW 48 |
| AP8 Shell und Design | 10–14 | AP0, Galerie aus AP4 | KW 48 |
| AP9 Gutscheine und Atelier | 6–8 | AP0, E4/E5 | Gutscheine 16.11. |
| INT | 2–3 | alle Merges | KW 49 |
| **Summe** | **71–92 PT** | | |

**Team-Aufgaben parallel (kein Code):** Fotoshooting-Tag Showroom, Café und Team (E6). Inventur Atelier. Google-Profil, Herold, OSM, Apple Business Connect und Bing auf die Adresse aus E1 vereinheitlichen. Persönliche Bewertungsbitte an die letzten 50–100 Kunden mit QR-Karte. Markentexte für 8 Top-Marken (je 300–500 Wörter). Ausstellungsstückliste. Anfragen an die Marken zu Listung und Bildfreigabe bündeln (25 H7). Roomle unverbindlich anfragen, welche der 36 Marken dort Daten haben (04).

---

## 5. Welle 2 und Welle 3 im Detail (Bauplan-Vorschau)

### Welle 2 (Jan.–Apr. 2027), Reihenfolge nach Freischaltung

| Block | Inhalt | Freigeschaltet durch | Quelle |
|---|---|---|---|
| W2-1 Kasse | `stripe@23.0.0` (MIT, nur Server, 0 KB Client, Stripe Checkout gehostet) + `pdf-lib` 1.17.1 + `qrcode` + `nodemailer` 10.x (MIT-0). Gutschein automatisch (PDF, Register in Stripe-Metadaten, interne Einlösung `/intern/gutschein`). Atelier mit Anzahlung (Reservierung). Hybrid-Warenkorb für Accessoires und Kerzen. Zahlarten Karte, Apple/Google Pay, EPS, Klarna, PayPal über Stripe, TWINT (CHF, bis 5.000). Pflichtseiten AGB, Widerruf, **„Vertrag widerrufen“-Button** (§ 13a FAGG, § 356a BGB), Versand und Zahlung, Entsorgung. GPSR-Angaben je Marke als statische Tabelle | E2, E3, Anwalt (AGB), Steuerberater (OSS, Gutschein-USt, Registrierkasse), BaFG-Prüfung (E20), AP8-WCAG fertig | 07 F1b–F4/F7/F8, 14 F5/F6 |
| W2-2 Merchant Center | Feed `src/app/feeds/merchant.xml` für Atelier und Accessoires, lokales Inventar „im Showroom Lochau“ | W2-1 (kaufbare Preise), eigene Fotos | 07 F6, 10 F7a |
| W2-3 Katalog-Preise und Daten | Preisfeld, „ab“-Preise **nur mit schriftlicher Herstellerfreigabe** und für eine konkret bestellbare Ausführung. `Offer`/`AggregateOffer`, Ausstellungs-Flag, Lieferzeit, Filter dafür, `priceValidUntil`, automatisches Ausblenden nach 12 Monaten | Backoffice-Felder (Abschn. 6), E13 | 07 F5, 08 F6 B/C, 14 F4 |
| W2-4 CRM | Frappe CRM (AGPL, nur intern), strukturierte Lead-Felder, Pipeline, Nachfassen nach 3, 14 und 45 Tagen, Brevo-Segmente aus Frappe, automatische Bewertungsbitte bei „geliefert“ mit Einwilligung | Backoffice-Admin, Backup | 11 F2/F3/F5/F6, 09 F3d |
| W2-5 Ads Stufe 1 | 3 T€/Monat. Consent für Meta, Pinterest und LinkedIn. Enhanced Conversions, CAPI aus den Routen per `after()`. Lead-Ledger in Google Sheets (`@googleapis/sheets`, `google-auth-library`), Offline-Import (Data-Manager-API, gepinnte Version ≥ 14 Tage alt). Kampagnen-Landingpages `/lp/[slug]` | **Gate 0**, Konten, Joint-Controller-Vereinbarung mit Meta, E9 | 10 F1–F6 |
| W2-6 „Ihr Raum in 48 Stunden“ (manuell) | Upload direkt in einen EU-S3-Speicher (Presigned URL, `@aws-sdk/client-s3` 3.x, nur Server), Fotos werden im Browser verkleinert (`browser-image-compression` 2.0.2, dynamisch), Bot-Schutz zuerst über Honeypot und Rate-Limit, Pauschale 149 € auf Rechnung. Die KI-Werkstatt auf der RTX 4060 ist ein Werkzeug fürs Team, keine Web-Schnittstelle | E16, Speicher-AVV, Datenschutztext, KI-Etikett | 06 F1/F2/F5 |
| W2-7 Design und Inhalte | Startseite neue Dramaturgie und Header-Optik (E14) mit eigenen Fotos. Schrift-A/B-Test (Instrument Sans oder Hanken Grotesk). Markenwelten-Template. Projekte mit Einwilligung. Video-Hero aus eigenem Dreh (ffmpeg NVENC). Shop the Look aus eigenen Szenen. 360° für Ausstellungsstücke. Bewertungs-Widget ab ca. 15 Bewertungen. de-CH-Varianten | Fotoshooting, Drehtag, Kundeneinwilligungen | 01 F3/F4/F7, 02 F5/F6, 03 F6/F7, 09 F4, 12 C3/C8 |
| W2-8 Herstellerbilder | Ads, Feeds und Image-Sitemap nur mit Registereintrag, Hotlinks abbauen | Bildfreigaben (E6), Backoffice-Feld `bildrechte` | 14 F3 |

### Welle 3 (ab Mai 2027), nur mit Wirkungsnachweis

| Feature | Startbedingung | Messkriterium für den Ausbau |
|---|---|---|
| **2D-Planer** Sofa (Lawrence + 2 Familien), dann Schrank (Poliform, Rimadesio), Schirm-Finder (Umbrosa, Tuuci nach Katalogpflege). Konfiguration im Link, `CartContext`-ID mit Konfigurations-Hash, Anfrage mit Konfiguration. SVG ohne Bibliothek | W1-Messung zeigt: Anfragen auf Sofa-Familien ≥ 10 pro Monat | Anteil Anfragen mit Konfiguration, Musteranfragen, Termine aus dem Planer (nach 8 Wochen) |
| **3D/AR-Pilot** 10–20 Produkte mit `@google/model-viewer` 4.4.0 (Apache-2.0, ≈ 71 KB gz, nur nach Klick auf die Fassade). GLB ≤ 3 MB, gltf-transform, Decoder selbst gehostet, Proxy `/cmx` für `.glb`/`.usdz` | **schriftliche 3D-Lizenz der Marke** (zuerst ClassiCon und Flos). **Keine eigenen 3D-Modelle oder Fotogrammetrie geschützter Designs** (EuGH Mio/konektra) | Lead-Quote mit AR spürbar höher als ohne, sonst Stopp bei 20 Modellen |
| **KI-Concierge** (Beta): Server-Route, eigener Katalog-Index (`minisearch` 7.2.0, MIT, nur Server), Modell `claude-opus-5-5` oder günstiger nach Test, Leitplanken gegen Preis-, Rabatt- und Händleraussagen, Übergabe an Termin oder WhatsApp | AVV mit Zero-Retention, KI-Hinweis (Art. 50 AI Act), Test mit 50 kritischen Fragen, freigegebene Wissensbasis | Anteil Gespräche mit Lead, Fehlerquote in Stichproben |
| **KI-Raumplaner Selbstbedienung** | ≥ 60 Aufträge aus „Ihr Raum in 48 h“, Bildfreigaben für KI-Input, DSFA, C2PA (`@contentauth/c2pa-node`), Budget. Masterkonzept: ab 2028 | Abschluss und Ø-Auftrag dieser Leads gegenüber normalen Anfragen |
| Frappe-Vollintegration (Sales Order, Invoice, Gutschein-Doctype, Bestand), Circle/Produktpass, Roomle-Adapter, Showroom-Rundgang | Backoffice-Entwickler, Gate 3 | – |

---

## 6. Entscheidungen, die der Inhaber treffen muss

| # | Entscheidung | Bis | Empfehlung | Blockiert |
|---|---|---|---|---|
| E1 | **Hausnummer** für Impressum, Schema, Google, Herold, OSM | **KW 44** | **Landstraße 9** (BEV-Adressregister: Studio 9, Café 11, Google-Pin steht auf 9). Firmenbuch durch den Steuerberater prüfen lassen | AP2, AP6 |
| E2 | **Rechtsträger** der Website, des Impressums und des Stripe-Kontos (MW Immobilienverwaltungs GmbH oder neue Handels-GmbH) | Gate 0 (04.12.) | Stripe direkt auf die Handels-GmbH. Bis dahin keine Online-Kasse | W2-1, AP2 |
| E3 | **Zahlungsanbieter** | vor W2-1 | **Stripe** (gehosteter Checkout, TWINT, EPS, Klarna, PayPal über einen Anbieter). Alternative Mollie (`@mollie/api-client` 4.6.0, BSD-3). **Vorher [Anwalt]:** Umgang mit Kundengeld bei negativem Eigenkapital | W2-1 |
| E4 | **Gutschein-Modus** und USt-Behandlung | KW 45 | Welle 1 „Anfrage + Rechnung“, unbefristet. Payment Link nur nach Freigabe durch Anwalt und Steuerberater. Mehrzweckgutschein, wenn auch im Café einlösbar **[Steuerberater]** | AP9 |
| E5 | **Atelierverkauf:** welche Stücke, Preisregel (20–55 % nach Alter), Sheet-Verantwortung, Reservierungs-Anzahlung | KW 46 | Ja, mit einer verantwortlichen Person. Keine Streichpreise, nur belegte UVP für Neuware | AP9 |
| E6 | **Bildrechte:** Fotoshooting-Tag (ca. 500–1.000 €, Nutzungsrechte unbefristet, alle Medien, inkl. Bearbeitung und KI). Hero ersetzen. Freigabe-Anfragen an alle Marken gebündelt mit den Listungsanfragen | **KW 45 beauftragen** | Ja, sofort. Ohne eigene Fotos gibt es keine Ads, keinen Feed und keine neue Startseite | AP8 Hero, W2-2, W2-7 |
| E7 | **Online-Termin-Werkzeug** | KW 45 | Cal.com Teams Cloud (12 $/Nutzer/Monat, Round-Robin, Webhooks) mit EU-Region und AVV. Lizenz von `@calcom/embed-react` vorher prüfen. Alternative ohne Kosten: Google-Terminplanung als Link (0 KB, ohne Erfolgs-Event) | AP3 |
| E8 | **WhatsApp:** Nummer, eigenes Firmengerät (kein Adressbuch-Sync), Antwortregel und Vertretung | KW 45 | Ja, Click-to-Chat. Die Business-API erst bei mehr Volumen | AP3 |
| E9 | **Budgets:** Welle-1-Umsetzung extern (Masterkonzept: 5–10 T€), Tools (Kalender ca. 40–50 $/Monat, Brevo ab ca. 9–18 $, Monitoring 0–30 €), Mediabudget Stufe 1 3 T€/Monat **erst nach Gate 0** | KW 44 / Gate 0 | Welle 1 freigeben, Media erst ab Q1 2027 | alle, W2-5 |
| E10 | **KI-Trainingsbots** in `robots.txt` | KW 46 | Für HTML zulassen, für `/cmx/` und `/_next/image` sperren (Schutz der Bildrechte) | AP5 |
| E11 | **Fehler-Monitoring:** GlitchTip selbst gehostet oder Sentry EU (Free) | KW 45 | GlitchTip (DSGVO-Ruhe), sonst Sentry EU ohne Replay | AP1 |
| E12 | **Superlative und Logos:** „größte Minotti-Ausstellung Westösterreichs“ streichen oder belegen. Markenlogos auf der Website als Schrift | KW 44 | Streichen bis zum Beleg. Typografische Markennamen | AP0, AP2, AP5 |
| E13 | **Preisangaben:** Darf Platzhirsch online „ab“-Preise für Minotti, Poliform und Rimadesio zeigen? Teil der Gate-0-Gespräche | 04.12. | Schriftlich klären. Bis dahin nur Preisrahmen im Ratgeber, ohne Betrag | W2-3 |
| E14 | **Designrichtung:** warmer Papier-Hintergrund, Gold nur als Akzent, Schriftwechsel. Preview „Galerie“ als Richtung? | Jan. 2027 | Nach dem Fotoshooting entscheiden, A/B-Test der Schrift | W2-7 |
| E15 | **Stadtseiten:** welche der 13 indexiert werden | KW 46 | Höchstens 8 plus Schweiz-Hub. Liechtenstein, Rheintal, St. Gallen, Lindau, Bregenz, Dornbirn, Friedrichshafen, Feldkirch bevorzugen. Den Rest `noindex`, bis es echte Fakten oder Referenzen gibt | AP6 |
| E16 | **„Ihr Raum in 48 Stunden“:** Pauschale (Vorschlag 149 €, beim Kauf ab 3.000 € angerechnet) | Jan. 2027 | Ja, als manuelles Angebot | W2-6 |
| E17 | **Backoffice-Zugang** und Frappe-Entwickler beauftragen (Admin für Felder, Webhooks, Gast-Tracebacks abschalten) | **Gate 0** | Ja. Der größte Hebel für Welle 2 | W2-3, W2-4 |
| E18 | **Öffnungszeiten** (Samstag 10–17 Uhr ab KW 46, Donnerstag nur zu Events) | KW 45 | Wie 23 Abschn. 12.1 | AP2 (`OPENING_HOURS`), AP6 (Schema) |
| E19 | **Bewertungsprozess:** wer die QR-Karte bei der Lieferung übergibt und wer antwortet | KW 45 | Verkauf und Montage, Antworten durch die GF | AP6, Team |
| E20 | **BaFG:** gilt die Kleinstunternehmen-Ausnahme? (VZÄ und Umsatz des Rechtsträgers) | vor W2-1 | Anwalt prüft. WCAG 2.2 AA wird ohnehin gebaut | W2-1 |
| E21 | **Consent Mode Basic oder Advanced** | vor W2-5 | Basic, bis der Datenschutzberater Advanced freigibt | AP2, W2-5 |
| E22 | **Adventsabend 26.11.:** Programm, Einladungsliste, Kapazität | **30.10.** | – | AP3 |

---

## 7. Auflösung der Widersprüche zwischen den Experten

| # | Thema | Widerspruch | Entscheidung |
|---|---|---|---|
| 1 | `lenis` und `motion` | bereits installiert (uncommittet), aber 01 und 02 lehnen sie ab, und in `src/` sind sie ungenutzt | **Entfernen** (AP0). Bewegung nur mit CSS, Scroll-Driven Animations und React `<ViewTransition>` |
| 2 | Ort des Claim-Guards | 08: `src/lib/seo/claimGuard.js`; 14: `src/lib/legal/claims.js` | **Eine Datei `src/lib/legal/claims.js`** mit Register und `sanitizeClaims` |
| 3 | Firmendaten | 14: neue `company.js`; 09: `site.js` als einzige Quelle | **`src/lib/site.js` erweitern** (es ist schon die Quelle). Keine zweite Datei |
| 4 | Speicherung der Herkunft | 11: `localStorage` mit Statistik-Einwilligung; 10: Cookie nur mit Marketing-Einwilligung | Herkunft immer nur im Arbeitsspeicher und als Textblock in der Anfrage. **Dauerhaft auf dem Gerät und Klick-IDs nur mit Ads-Einwilligung** (strengere Lesart, 14 F13) |
| 5 | Atelier/Outlet: Name und Datenquelle | 07: „Outlet“ mit Stripe als Katalog; 08: „Atelierverkauf“ mit Google Sheet | Name **„Atelierverkauf“** (kein Rabatt-Image, Begriff aus dem Masterkonzept). **Welle 1: Sheet + Reservierungsanfrage**, Welle 2: Stripe als Kasse, später Frappe als Quelle |
| 6 | Gutscheine | 07: Payment Link sofort; 14: „Anfrage + Rechnung“ | **Welle 1 Anfrage + Rechnung** (kein Fernabsatz-Checkout, keine BaFG- oder Widerrufsbutton-Kette). Payment Link per Flag nach E3/E4. Automatik in Welle 2 |
| 7 | Stripe-Version | 07: 23.0.1; 14: 22.6.x | `stripe@23.0.0` (vom 01.10.2026, ≥ 14 Tage alt), erst Welle 2. 23.0.1 erst nach 14 Tagen Abstand |
| 8 | Versionen der Prüfwerkzeuge | 13: Playwright 1.64.1, axe 4.14.0; 14: 1.63.0, 4.13.0 | Regel „mindestens 14 Tage alt“ ⇒ **Playwright 1.64.0, axe 4.13.0, size-limit 14.2.0, vitest 5.0.3, knip 6.41.0, rate-limiter-flexible 11.2.1, zod 4.6.7** (Review 15: 4.6.7 ist installiert und am 26.10. genau 14 Tage alt) |
| 9 | Captcha | 06: Turnstile; 13: Honeypot und ALTCHA | **Honeypot + Zeitfalle + Rate-Limit** in Welle 1 (ohne Drittanbieter). ALTCHA (selbst gehostet) als Stufe 2 nur bei echtem Spam. Turnstile nur mit Freigabe in der Datenschutzerklärung |
| 10 | Monitoring | 13: `@sentry/nextjs` im Client mit Budget | Welle 1 **nur serverseitig** (`onRequestError`) an GlitchTip oder Sentry EU, 0 KB Client |
| 11 | Web Vitals | 02: Komponente in `client-layout.js`; 13: `web-vitals` an GA4 | `web-vitals` in `src/instrumentation-client.js` (AP3). Das hält `client-layout.js` frei von Konflikten |
| 12 | Termin-Werkzeug | 05/11: Cal.com; 11/14: Google-Terminplanung oder MS Bookings | Inhaber entscheidet (E7). Der Code ist über `BOOKING_PROVIDER` anbieterneutral |
| 13 | Header | 01 F2: neues Design; 13: Navbar als Server Component | **Welle 1:** Struktur, Performance und A11y (Server-Header, Mega-Menü, Marken als Hauptpunkt). **Welle 2:** Optik und Schrift nach E14 |
| 14 | 3D/AR | 03: Pilot jetzt vorbereiten, auch mit eigener Fotogrammetrie; 23: „nicht jetzt“; 14: Mio/konektra | **Welle 3, nur mit Herstellerdaten und Lizenz.** Keine eigenen 3D-Nachbauten oder Scans geschützter Designs. 360°-**Fotos** eigener Stücke sind erlaubt (W2) |
| 15 | Konfigurator | 04: sofort baubar; Auftrag: Welle 3 | **Welle 3** (2D-SVG, ohne Bildrechte-Problem), erst wenn W1-Daten zeigen, dass Nachfrage auf Sofa- oder Schranksystemen besteht. Die `CartContext`-ID wird erst dann erweitert |
| 16 | „Ihr Raum in 48 h“ | 06: vor dem 26.11.; 23: zuerst manuell, KI ab 2028 | **Welle 2 (Jan. 2027)** manuell. Grund: Speicher-AVV, Pauschale und Kapazität des Teams vor Weihnachten. Die KI-Werkstatt läuft intern ohne Website-Code |
| 17 | KI-Concierge | 05: Beta Q1 2027 | **Welle 3** (Mai 2027). Vorher Lead-Strecke und CRM stabil, Test mit 50 Fragen, AVV |
| 18 | „ab“-Preise für Leitmodelle | 07/04: übergangsweise ab Januar; 14: nur mit Herstellerzustimmung | Nur mit **schriftlicher Herstellerfreigabe (E13)**, sonst gar nicht. In Welle 1 nur echte Atelier-Preise |
| 19 | Selbstauskunft „Wie aufmerksam geworden?“ | 11: Pflicht überall; 05: weniger Pflichtfelder | **Pflicht nur in der Beratungsstrecke**, sonst optional. Die Ausfüllquote wird gemessen |
| 20 | Anzahl Regionsseiten | 08: höchstens 8; parallel sind bereits 13 Stadtseiten entstanden | Fakten-Regel ≥ 4 je Seite, **höchstens 8 indexiert** plus Schweiz-Hub. Der Rest bleibt `noindex,follow` (AP6, E15) |
| 21 | MDX-Konfiguration | 12: `next.config.mjs` nötig; 08: `withMDX` in der bestehenden Datei | **`next.config.mjs`** und Plugins als String (Turbopack ist in Next 16 Standard, laut `mdx.md`). Metadaten per `export const meta`, ohne Frontmatter-Plugins |
| 22 | Bewertungsbitte | 09: interne Mail mit Einwilligung (`resend`); 14: QR-Karte | **Welle 1 QR-Karte und persönliche Bitten**, keine Massenmails. Mails nur mit Einwilligung aus der Auftragsbestätigung (W2-4) |
| 23 | Hero-Bild | 13: mobilen Zuschnitt bauen; 01/14: Minotti-Foto darf nicht verändert werden | **Kein Zuschnitt** des Herstellerfotos. Ersatz durch eigenes Foto (E6), dann Art Direction mit `getImageProps` |
| 24 | Meta-, Pinterest- und LinkedIn-Pixel | 10: sofort; 23: Media erst nach Gate 0 | Consent-**Struktur** in Welle 1, Pixel erst in Welle 2 mit Konten und Budget |
| 25 | Brevo | 11: DOI sofort; 12: Newsletter am 05.11. über das bestehende Tool | Erster Newsletter über das bestehende Tool. Brevo-DOI per Flag, sobald Konto, DNS (SPF/DKIM/DMARC) und AVV stehen |

---

## 8. Benötigte Backoffice-Felder und -Endpunkte (Liste für das Frappe-Team)

Konsolidiert aus 03, 04, 05, 07 (4.9), 09, 10, 11 (F11), 12, 13, 14. Ein Termin mit dem Backoffice-Admin klärt Punkte 0–3 (Welle-2-Start). Für Lieferung ist ein vollständiges ERPNext zu prüfen, sonst gelten Custom Fields.

**0. Sofort (Sicherheit, ohne neue Felder):** Gast-Tracebacks abschalten (11). Webhook-Records mit `X-Revalidate-Secret` prüfen (13). Technischer API-Benutzer mit minimalen Rechten. Gast-Endpunkte nur lesend. Testen, ob die Anfrage-Endpunkte unbekannte Felder still verwerfen und leere Adressfelder annehmen (05, 11).

**1. Doctype „Produkte New“ (oder verknüpftes Item / Item Price):**

| Feld | Typ | Wofür |
|---|---|---|
| `verkaufsart` | Select: Anfrage / Online-Kauf / Reservierung | Knopf und Checkout |
| `preis_freigabe` | Check | Preis darf öffentlich angezeigt werden (Herstellerfreigabe) |
| `preis_typ` | Select: fix / ab | `Offer` oder `AggregateOffer` |
| `preis_eur_brutto`, `preis_chf` | Currency | Preis AT inkl. 20 %, fester CHF-Preis |
| `preis_basis` | Select: UVP Hersteller / Ausstellungspreis / Hauspreis | Pflichtzusatz |
| `preis_gueltig_ab`, `preis_gueltig_bis` | Date | `priceValidUntil`, Ausblenden nach 12 Monaten |
| `uvp_eur` | Currency | nur mit Beleg |
| `preis_historie` (Child Table) oder `preis_niedrigster_30_tage` | Table / Currency | Streichpreis-Regel § 9a PrAG, § 11 PAngV |
| `ausstellungsstueck`, `in_ausstellung` | Check | „in Lochau zu sehen“, Atelier |
| `verfuegbarkeit` | Select: sofort / in Ausstellung / auf Bestellung / ausverkauft | `availability` |
| `lieferzeit_wochen_von`, `lieferzeit_wochen_bis` | Int | Anzeige, Ratgeber, Concierge |
| `zustand`, `zustand_beschreibung` | Select / Text | `itemCondition`, Gewährleistung |
| `abverkaufspreis_eur`, `abverkaufspreis_chf` | Currency | Atelier |
| `lagerbestand`, `standort` | Int / Select | Überverkauf, lokales Inventar |
| `versandklasse`, `gewicht_kg`, `paketmasse_cm`, `versand_laender` | Select / Float / MultiSelect | Versand |
| `gtin`, `mpn`, `google_produktkategorie`, `google_feed` | Data / Check | Merchant Center |
| `hs_code`, `ursprungsland` | Data | Ausfuhr CH |
| `bildrechte` je Bild (eigen / Marke freigegeben / nicht geklärt) + `bild_alt_{de,en,fr,it}` | Select / Data | Feed, Ads, A11y |
| `galerie_bilder` in der **Listen**-API, `hover_image`, `dominant_color` | Table / Attach / Data | Galerie, Zweitbild, Platzhalter (02) |
| `masse_breite`, `masse_tiefe`, `masse_hoehe`, `sitzhoehe` (cm) | Float | Ersetzt das Overlay aus AP4 |
| `pdf_produkte.3d` befüllen + Freigabe `.glb`/`.usdz` | Attach | 3D-Pilot (Welle 3) |
| `hersteller_name`, `hersteller_anschrift`, `sicherheitshinweise` (oder an der Marke) | Data / Text | GPSR Art. 19 |
| `eigentext_{de,en,fr,it}`, `eigentext_freigegeben` | Text / Check | Produkt-Eigentexte statt Repo-JSON |

**2. Anfrage-Doctypes** (`kontakt_form`, `anfrage_produkt`, `anfrage`/Beratung, künftig CRM Lead): `lead_ref`, `quelle_kanal`, `quelle_selbstauskunft`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `landingpage`, `referrer_host`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid`, `ga_client_id`, `consent_ads` (Check), `sprache`, `land`, `plz`, `kundentyp` (Privat/Architekt/Hotel/Bauträger/Makler), `sparte`, `wohnbereich`, `zeitrahmen`, `budget_spanne`, `beratungsart` (Showroom/Video/Hausbesuch/Rückruf/schriftlich), `produkt` (Link auf Produkte New), `merkliste` (JSON), `konfiguration` (JSON) und `konfiguration_link` (Welle 3), `termin_start`/`termin_typ`/`termin_quelle` (Cal-Webhook).

**3. CRM Deal und Auftrag:** `lead_status` (neu, qualifiziert, Angebot, Auftrag, verloren), `angebot_datum`, `angebot_wert`, `auftrag_wert_netto`, `lieferdatum`, `lieferstatus`, `verlustgrund`, `wiedervorlage`. Auftragsposition: `produkt`, `pflege_kategorie`. Kontakt: `newsletter_einwilligung` (Datum, Textversion, Quelle), `bewertung_einwilligung` (`review_consent`), `bestandskunde`.

**4. Neue Doctypes:** `Gutschein` (Code, Wert, Restwert, Währung, Status, Käufer, Empfänger, Datum, Stripe-ID) und `Gutschein Einlösung` (Datum, Betrag, Kanal Showroom/Online/Café, Mitarbeiter) · `Webshop Bestellung` (+ Positionen; alternativ Sales Order mit Quelle „Webshop“) · `Anzahlung` (Projekt, Betrag, Währung, Stripe-Rechnungs-ID, Status) · `Versandregel` (Klasse, Land, Zone, Preis, frei ab) · `Referenzprojekt` (Typologie, Ort ohne Adresse, Fotos mit Rechten, Einwilligung, Marken) · `Konfigurator Familie/Element/Option` (Welle 3) · `Termin` (oder Frappe Appointment).

**5. Marken-Doctype:** `dealers_title`/`dealers_description` bereinigen, plus `haendlerstatus_belegt` (Check mit Beleg-URL). `bildfreigabe_umfang` (Web/Ads/Feed/Bearbeitung/KI), `bildfreigabe_datum`, GPSR-Herstellerangaben, Eigentext je Sprache.

**6. News:** echtes `veroeffentlicht_am` statt Importdatum (29 von 31 Beiträgen tragen den 14.01.2025), Archiv-Flag, Sprachfeld.

**7. Newsletter-Doctype `newsletter_website`:** `sprache`, `interessen`, `kundentyp`, `land`, DOI-Protokoll (Zeitstempel, IP, Textversion).

**8. Endpunkte (mit API-Schlüssel, nicht Gast):** `create_anfrage` (strukturierte Felder aus Punkt 2) · `get_lead_status_changes?since=` (Offline-Conversion-Import) · `create_webshop_order` · `get_voucher` / `redeem_voucher` · `get_shop_products` (verkaufsart ≠ Anfrage) · `get_konfigurator` (Welle 3) · Ausgehende Webhooks: Preis-/Bestandsänderung an `src/app/revalidate/produkte` (vorhanden), Lieferstatus „geliefert“ (für die Bewertungsbitte mit Einwilligung), Lead-Status (an Brevo bzw. Ads-Import). Listen-API um `galerie_bilder`, `hover_image`, `in_ausstellung`, `lieferzeit` und `preis_*` (nur bei `preis_freigabe`) erweitern.

---

## 9. KPIs

**Messung:** GA4 (Key Events aus 4.5), Search Console und Bing (wöchentlicher Export nach Looker Studio), LHCI in CI, CrUX/Search Console Core Web Vitals, Lead-Herkunft im Backoffice (Textblock in W1, Felder in W2), monatliche KI-Prompt-Tabelle (30 Prompts, 08 F10). Basiswerte werden in KW 46 eingefroren (2 Wochen nach AP3).

| KPI | Heute | Ende Welle 1 (Dez. 2026) | Ende Welle 2 (Apr. 2027) | M12 (Okt. 2027) |
|---|---|---|---|---|
| **Technik:** LCP p75 mobil (Feld) | ≈ 3,4–3,8 s (Labor) | ≤ 2,5 s | ≤ 2,0 s | ≤ 2,0 s |
| INP p75 / CLS | – / 0 | ≤ 200 ms / ≤ 0,1 | ≤ 150 ms / ≤ 0,05 | gleich |
| JS initial pro Route (gz) | ≈ 238 KB | ≤ 190 KB | ≤ 170 KB | ≤ 170 KB |
| Seiten statisch/ISR | 0 % | 100 % (außer Suche/API) | 100 % | 100 % |
| Lighthouse A11y Kernseiten | 96–100 | 100 | 100 | 100 |
| Verfügbarkeit / unbemerkte Ausfälle | unbekannt | ≥ 99,9 % / 0 | gleich | gleich |
| **Leads:** Anfragen mit Herkunft | 0 % | ≥ 95 % | 100 % (Felder) | 100 % |
| Qualifizierte Anfragen pro Monat (23) | nicht gemessen | Basis messen | 25 | 40 |
| Online gebuchte Termine pro Monat | 0 | ≥ 8 | ≥ 20 | ≥ 30 |
| Konversionsrate Formulare (Start → Absenden) | nicht gemessen | Basis | +20 % zur Basis | +30 % |
| Spam-Anteil in Anfragen | unbekannt | < 2 % | < 2 % | < 2 % |
| **SEO:** Top-3-Rankings der 50 Kernbegriffe (AT/DE/CH) | Basis in KW 45 | +10 Begriffe | +20 | 35 von 50 |
| Organische Klicks pro Monat (GSC) | Basis | +15 % | +50 % | +100 % |
| Indexierte Produkt-, Hub- und Ratgeberseiten | ≈ Katalog | + Marke × Kategorie, Hubs, 3 Ratgeber | + 15 Ratgeber | + 40 Ratgeber |
| Nennung in KI-Antworten (30 Prompts) | Basis | ≥ 5 | ≥ 10 | ≥ 15 |
| **Local:** Google-Bewertungen (23) | 6 | ≥ 30 (Januar) | ≥ 50 | ≥ 80 |
| GBP-Aktionen (Route, Anruf, Website) pro Monat | Basis | +20 % | +50 % | +100 % |
| **Umsatz digital:** Gutscheine | 0 | 5–20 T€ (bis Weihnachten) | laufend + online | – |
| Atelierverkauf (Liquidität) | 0 | erste Stücke | 100–300 T€ in 3–6 Monaten (23) | Circle |
| Online-Umsatz (Kasse) | 0 | 0 (bewusst) | erste Bestellungen | 0,1–0,2 Mio. € p. a. (23, Shop) |
| **Ads (ab W2-5):** Kosten pro qualifiziertem Lead / ROAS 6 Monate | – | – | ≤ 250 € / ≥ 10 | ≤ 280 € / ≥ 9 |
| **Recht:** offene Claims-, Datenschutz- und Bildregister-Befunde | viele (R1–R14) | 0 kritische | 0 | 0 |

**Stopp-Regeln:** Ein neues Feature, das ein Budget aus 13 Abschn. 3.3 reißt, wird nicht gemergt. Ads-Stufen steigen nur, wenn die Kosten pro qualifiziertem Lead zwei Monate in Folge eingehalten sind (10). Welle-3-Features wachsen nur bei positivem Messkriterium (Abschnitt 5).

---

## 10. Risiken auf einen Blick (konsolidiert)

| Risiko | Gegenmaßnahme im Plan |
|---|---|
| Händler- oder Superlativ-Claims gefährden UWG und das Gespräch mit Minotti und Poliform | AP0-Hotfix, `claims.js`, `check:claims` in CI, ESLint-Regel |
| Herstellerbilder in Ads, Feeds oder Bearbeitung (Urheberrecht) | Bildregister (AP2), eigene Fotos (E6), keine neuen Fremd-Hosts, keine Bearbeitung |
| Nach dem ISR-Fix werden leere Backoffice-Antworten gecacht | AP1 Fetch-Wrapper in den ersten 3 Tagen, kritische Fetcher werfen |
| Neue Features fressen den Geschwindigkeitsvorsprung | Budget-Tor in CI, Fassaden-Pflicht, keine Animations-Bibliotheken |
| Online-Kasse ohne Pflichtkette (FAGG, Widerrufsbutton, BaFG, Gewährleistung bei Ausstellungsstücken) | Kasse erst in Welle 2 nach E2, E3 und E20. Welle 1 nur Anfrage, Reservierung und Rechnung |
| Kundengeld bei negativem Eigenkapital | Anwalt vor Stripe (E3), getrennte Verwendung |
| Doorway-Abwertung durch zu viele Stadtseiten | Fakten-Regel ≥ 4, höchstens 8 indexiert (AP6, E15) |
| Pflege durch 5 Personen ohne Entwickler | Sheet statt Code fürs Atelier, Registries, CI statt Wiki, Uptime-Alarm, Freigabe von Texten per PR |
| Parallele Agenten überschreiben sich | Eigentumsmatrix, Message-Module, Registries, AP0 seriell, INT am Ende, eingefrorene `package.json` und `flags.js` |
| Unversionierte parallele Arbeit (untracked Stadtseiten, Preview) geht verloren oder geht ungeprüft live | AP0 sichert, AP6 prüft die Stadtseiten, AP8 hält die Preview auf `noindex` |

---

## 11. Änderungen des Reviews (26.10.2026, Bericht 15)

Begründung und Belege mit Dateipfaden stehen in `15-review.md`. Diese Punkte **gelten vor** den Abschnitten 3–7, wo sie ihnen widersprechen.

**A. Release-Züge statt eines Gesamt-Deploys (ersetzt die Merge-Reihenfolge in 4.1 und 3.1, wo sie abweicht).** Jeder Zug ist ein eigener Merge plus Deploy. INT-Mini-Schritte (Navigation, Pfade) laufen je Zug mit.
| Zug | Termin | Inhalt |
|---|---|---|
| R0 | Mi 28.10. | **AP0a** (0,5 PT): Händler-Hotfix, `claims.js`, `/api/image` löschen, robots. **Ohne** ISR-Umstellung |
| R1 | Di 03.11. | **AP0b** (ISR/`setRequestLocale`, Stubs, Bibliotheken) **gemeinsam mit AP1 Nr. 1** (`backofficeFetch`, kritische Fetcher werfen). Gallery-Teil-Merge aus AP4. Adventsabend (Seite existiert schon) |
| R2 | KW 46 | AP3 Lead-Strecke und Termin. AP2-Minimum (FormPrivacyNote, Impressum/DSE-Fix, `gtag` auch bei reiner Ads-Einwilligung) |
| R3 | Mo 16.11. | AP9 Gutscheine **mit Navigationseintrag** |
| R4 | KW 47 | AP9 Atelier, AP4 Produktseite (Kern) |
| R5 | KW 48 | AP5, AP6, AP7 |
| R6 | KW 49 | INT. AP8 **nur A11y-Teil**: Skip-Link, Gold-Kontrast, FadeInView → CSS, Slider-Ersatz, Pausieren-Knopf für `.marquee` (WCAG 2.2.2) |
| – | Jan. 2027 | AP8 Header-Umbau (Server-Header, Mega-Menü) nach dem Weihnachts-Freeze, weil er das größte Regressionsrisiko hat |

**B. AP0 wird 3–4 PT statt 2 PT und bekommt diese Zusatzaufgaben:**
1. **Nur namentlich genannte Dateien committen** (kein `git add -A`). Labs und Preview-Varianten `buehne`/`dreilaendereck` gehen nicht nach `main`.
2. **Labs-Bibliotheken aus der `main`-`package.json` entfernen:** `@anthropic-ai/sdk` (6 Tage alt), `@react-three/fiber` (12 Tage alt), `@react-three/drei`, `three`, `@google/model-viewer`. Sie gehören auf den LAB-Branch (siehe C). `qrcode` nach devDependencies. `next` und `eslint-config-next` **exakt auf 16.3.4** pinnen, passend zu `@next/mdx` 16.3.4. `@playwright/test` von installiert 1.64.1 auf 1.64.0 zurückstufen.
3. **`src/i18n/loadMessages.js`** (Basis + Module, Deep-Merge) anlegen. Sowohl `src/i18n/config.js` als auch `src/app/[locale]/layout.js` (heute Z. 197, direkter JSON-Import für den `NextIntlClientProvider`) nutzen ihn. Sonst fehlen Modul-Texte in allen Client-Komponenten.
4. **Header-Slot:** `layout.js` rendert `<SiteHeader activeCategoryKeys …/>` aus `src/components/Navbar/SiteHeader.js` (AP8, anfangs ein Wrapper um die heutige `navbar.js`) und reicht ihn über `LoaderWrapper` als Prop `header` an `ClientLayout` (heute `'use client'`, importiert `Navbar` direkt). Nur so baut AP8 den Server-Header, ohne `[locale]/layout.js` (AP6) anzufassen.
5. **`src/lib/navigation.js`** mit den heutigen Links anlegen, `navbar.js` und `Footer.js` lesen daraus. Gehört danach AP8, Einträge über INT je Release-Zug.
6. Zusätzliche Registries `src/lib/seo/sitemap/{legal,leads}.js` und `src/lib/seo/llms/{legal,leads}.js` für AP2 (`barrierefreiheit`) und AP3 (Event-Seite).
7. `sanitizeClaims` greift **nur im Markenkontext** (Claim-Wort und Markenname im selben Satz bzw. Feld). „Offizielle Website“ (`de.json` Z. 692/758) und „Offizielle Regeln“ (Zoll, St. Gallen) bleiben. `check-claims.mjs` ignoriert Code-Kommentare.

**C. Neues Paket LAB (außerhalb von Welle 1).** Eigentum: `src/app/[locale]/labs/**`, `src/components/Labs/**`, `src/lib/concierge/**`, `src/lib/portal/**`, `public/labs/**`, `src/app/[locale]/preview/{buehne,dreilaendereck}/**`, `src/components/Preview/{buehne,dreilaendereck}/**`. Eigener Branch `labs/*`, nie vor Welle 3 nach `main` (Entscheidungen 7/14–17 bleiben). Ausnahme: AP6 darf `Labs/Dreilaender/{calc.js,ecb.server.js}` nach Review als `src/lib/ch/{calc.js,ecbRate.js}` übernehmen. Der Dateispeicher `.data/dreilaender/ecb-last.json` fällt dabei weg, weil ihn der Release-Ordner-Deploy (AP1) verlieren würde. Fallback dann über den Next-Data-Cache plus festen Wert.

**D. Eigentum korrigiert:**
- `src/app/[locale]/adventsabend/**` existiert schon → **AP3**. `events/[slug]` und `src/lib/content/events.js` entfallen in Welle 1. AP3 stellt `trackLead("adventsabend")` auf `trackLead("event", { event: "adventsabend" })` um und schützt die Anmeldung über `guardForm`.
- `src/app/[locale]/bewerten/**` existiert schon → **AP6** übernimmt (nicht neu bauen). Die hartcodierte `GOOGLE_REVIEW_URL` wandert nach `site.js` (`GBP.reviewUrl`, AP2).
- `src/lib/seo/legacyProductRedirects.js` (AP5) und der Such-`fetch` in `src/components/Navbar/navbar.js` (AP8) stellen ihre Pakete selbst auf `backofficeFetch` um. AP1 darf sie nicht ändern.
- Der Text „Merkliste“ → „Ihre Auswahl“ steht im Namespace `Navbar` und gehört deshalb AP8 (INT-Anfrage von AP3).
- Design-Tokens `gold-text`, `ink`, `bone`, `font-display` und die Klasse `.reveal` **existieren bereits** in `globals.css`. Bau-Regeln 5/6 gelten damit ab AP0. AP8 ergänzt nur `paper` und die Typo-Skala.

**E. Blockiert bzw. gestrichen ohne Backoffice:** AP3 Nr. 7 Interessen/Kundentyp im Newsletter. `newsletter_subscribe` sendet nur `email`, deshalb nur mit Brevo (E9), sonst entfällt der Punkt. Die Testanfrage aus AP3 Nr. 3 geht nur mit Betreff „TEST – bitte löschen“ und vorheriger Info ans Team.

**F. Recht:** Gutschein-Anfrage + Rechnung und Atelier-Reservierung mit Anzahlung ohne Besichtigung sind **Fernabsatzverträge**. Der Bestell-Button nach § 8 Abs 2 FAGG und der Widerrufsbutton nach § 13a FAGG entfallen (kein Vertragsschluss über die Online-Oberfläche). **Informationspflichten, 14 Tage Widerrufsrecht, Widerrufsbelehrung und -formular** müssen aber in die Bestätigung bzw. Rechnung **[Anwalt]**. Die Formulierung „Damit entfallen in Welle 1 FAGG-Kassenpflichten“ in AP9 ist entsprechend eng zu lesen. Das Atelier-Sheet bekommt einen eigenen Veröffentlichungs-Tab, weil ein als CSV veröffentlichtes Sheet öffentlich lesbar ist.

**G. Technik-Auflagen:** CI und Server laufen auf **Node 24 LTS** (vitest 5 braucht ≥ 22.12, size-limit 14 ≥ 22.19/24.5). pm2 bleibt bei `instances: 1`, solange das Rate-Limit im Arbeitsspeicher liegt (Kommentar in `ecosystem.config.js`). `web-vitals` lädt in `instrumentation-client.js` per `import()` nach `load`, nicht statisch. CSS-Module mit `@apply` brauchen `@reference` auf `globals.css` (Tailwind 4). `@mdx-js/loader` zieht `webpack` als Peer nach (nur Build). Das ist akzeptiert.

**H. Budget (23 Abschn. 12.1: Website extern 5–10 T€):** 71–92 PT passen nicht ins Budget. **Welle-1-Kern ≈ 30–36 PT:** AP0, AP1 Nr. 1/2/5, AP2 Nr. 1–3, AP3 ohne Newsletter-Ausbau, AP4 Nr. 1–4/6, AP9, INT. Alles andere ist **Welle-1-Plus** und läuft nur mit Budgetfreigabe über E9.
