# 15 – Review des Digital-Masterplans (kritischer Tech-Lead)

**Stand:** 26.10.2026, 04:45–05:00 Uhr · **Geprüft:** `00-digital-masterplan.md` gegen die Baupläne 01–14, den Arbeitsbaum im Repo (inkl. untracked Dateien), `package.json`/`node_modules`, die Next-16-Doku in `node_modules/next/dist/docs/` und die npm-Registry (Versionen, Lizenzen, Peer-Dependencies, Engines, Veröffentlichungsdaten).
**Ergebnis in einem Satz:** Der Plan ist fachlich stark und in den meisten Code-Annahmen korrekt. Er ist aber **nicht konfliktfrei**, **nicht nach Umsatz sortiert** und **nicht im Budget**. Außerdem hat der Arbeitsbaum ihn während der Erstellung überholt: Parallel sind Labs-Prototypen mit eigenen Bibliotheken entstanden, die der Plan nicht kennt.

Die Korrekturen stehen verbindlich im Masterplan, Abschnitt 11 „Änderungen des Reviews“. Dieses Dokument begründet sie.

---

## 1. Abgleich Ist-Zustand im Code

| # | Aussage im Masterplan | Befund im Code | Bewertung |
|---|---|---|---|
| 1 | „Keine `page.js` ruft `setRequestLocale` auf. Alle Seiten sind dynamisch“ | Stimmt. Nur `src/app/[locale]/layout.js` Z. 192 ruft es auf. In next-intl 4 muss es aber **jede** Seite aufrufen, sonst liest `requestLocale` den Header (→ dynamisch). 22 Seiten haben `revalidate = 3600`, das deshalb nicht greift | ✔ korrekt |
| 2 | „in allen **37** `page.js`“ (AP0 Nr. 4) | Heute **42** `page.js` unter `src/app/[locale]` ohne Preview und **53** mit `preview/`. Neu dazugekommen sind `adventsabend`, `bewerten`, 3 Preview-Varianten und `labs/` | ✘ Zahl veraltet. Die Aufgabe muss lauten „alle per `grep`“ |
| 3 | `/api/image` als offener Proxy, in `robots.js` freigegeben | `src/app/api/image/route.js` existiert. `src/app/robots.js` Z. 22/39/61 erlaubt `/api/image` | ✔ |
| 4 | Bibliotheken uncommittet: `embla`, `lenis`, `motion` | `git diff package.json` zeigt **zusätzlich** `@anthropic-ai/sdk` 0.137.0, `@google/model-viewer` 4.4.0, `@react-three/fiber` 9.8.2, `@react-three/drei` 10.7.9, `three` 0.183.2, `qrcode` 1.5.4 (unter dependencies), `zod` 4.6.7 und `@playwright/test` 1.64.1. In `src/` importiert wird davon nur `embla` (2×, Preview) | ✘ unvollständig |
| 5 | `zod` „neu, 4.6.6 (4.6.7 Grenzfall)“ | `zod` 4.6.7 ist **schon installiert** (12.10.2026, heute genau 14 Tage alt). Ein Downgrade bringt nichts | ✘ korrigiert: behalten, auf 4.6.7 pinnen |
| 6 | Event-Seite AP3 neu unter `events/[slug]`, `/bewerten` AP6 „neu“ | Beide **existieren schon** untracked: `src/app/[locale]/adventsabend/{page.js,AdventsabendForm.js}` (schickt an `/api/kontakt`, `trackLead("adventsabend")`, Event-Schema erst ab Uhrzeit) und `src/app/[locale]/bewerten/{page.js,ReviewLink.js}` (hartcodierte Review-URL, `review_click`) | ✘ Doppelarbeit und fehlendes Eigentum |
| 7 | Event-Katalog 4.5: `form` = `produkt`, `event` | Code: `trackLead('produkt_anfrage')` in `AnfrageFormProduct.js` Z. 174, `trackLead("adventsabend")` | ✘ Katalog und Code weichen ab |
| 8 | Design-Tokens, `.reveal`, `gold-text` baut AP8 | `src/app/globals.css` hat bereits `@theme` mit `--color-gold-text #7a5f17`, `ink`, `bone`, `font-display` und `.reveal` mit `animation-timeline: view()` (committet) | ✘ Teilweise schon da, und das ist gut: Regel 5/6 ist ab Tag 1 nutzbar |
| 9 | „`#d1b250` 256-mal, davon 151 als Textfarbe“ | heute 317 Treffer, 161× `text-[#d1b250]` (Preview/Labs eingerechnet) | ~ Größenordnung stimmt |
| 10 | i18n-Module über `src/i18n/config.js` zusammenführen | `src/app/[locale]/layout.js` Z. 197 lädt `@/messages/${locale}.json` **selbst** und gibt sie an `LoaderWrapper` → `NextIntlClientProvider`. Modul-Texte kämen also nur serverseitig an, **Client-Komponenten bekämen `MISSING_MESSAGE`** | ✘ Lücke in AP0 |
| 11 | AP8: „Header als Server Component plus Inseln“ | `Navbar` wird in `client-layout.js` (`'use client'`) importiert. Eine Server Component lässt sich dort nicht importieren. Sie muss aus `[locale]/layout.js` als Prop oder Slot hereingereicht werden, und diese Datei gehört **AP6** | ✘ verdeckter Dateikonflikt |
| 12 | AP1 stellt „alle Fetcher“ um (`src/lib/api/**`) | Direkte `fetch`-Aufrufe aufs Backoffice gibt es auch in `src/lib/seo/legacyProductRedirects.js` (AP5) und `src/components/Navbar/navbar.js` Z. 247 (AP8) | ~ AP5/AP8 stellen selbst um |
| 13 | Newsletter: Interessen und Kundentyp (AP3 Nr. 7) | `src/app/api/newsletter_subscribe/route.js` Z. 60 sendet nur `{ email }`. Der Doctype hat dafür kein Feld | ✘ ohne Backoffice bzw. Brevo **blockiert** |
| 14 | `images.qualities: [60, 75, 90]` | Heute `[50, 75, 90, 100]`, der Code nutzt `quality={60}` (2×). Der Fix ist richtig | ✔ |
| 15 | Rate-Limit im Arbeitsspeicher | `ecosystem.config.js`: `instances: 1`, `exec_mode: 'fork'`. Das funktioniert, aber nur solange es eine Instanz bleibt | ✔ mit Auflage |
| 16 | Next-16-APIs: `catchError` aus `next/error`, `instrumentation-client.js`, `<ViewTransition>` ohne Konfiguration, `priority` veraltet, MDX-Plugins als String für Turbopack | Alle in der lokalen Doku belegt: `04-functions/catchError.md`, `03-file-conventions/instrumentation-client.md`, `02-guides/view-transitions.md`, `image.md` („Starting with Next.js 16, the `priority` property has been deprecated“), `mdx.md` Z. 726 | ✔ |
| 17 | Next 16.3.4 installiert | ✔. Aber `package.json` sagt `^16.2.9`. `@next/mdx` muss genau zur Next-Version passen, `next` und `eslint-config-next` werden aber nicht gepinnt | ~ ergänzt |

**Nicht im Plan: Labs-Prototypen.** Parallel zum Masterplan sind uncommittet entstanden: `src/components/Labs/{ArViewer,Dreilaender,Kuechenplaner,Sofaplaner,Stilfinder,Concierge}`, `src/app/[locale]/labs/**`, `src/lib/concierge/**` (Anthropic-SDK, `claude-opus-5-5`), `src/lib/portal/**` (Kundenportal mit Magic Link, Frappe-Adapter „not connected“), `public/labs/ar-viewer/decoders/**` (Draco/Basis-WASM). Sie widersprechen den Entscheidungen 7/14–17 (Konfigurator, 3D, Concierge in Welle 3), teilen sich `package.json` mit AP0 und dürfen **nicht** mit dem AP0-Commit „Uncommittete Arbeit sichern“ nach `main`. `Labs/Dreilaender/{calc.js,ecb.server.js}` ist fachlich der CHF-Rechner aus AP6 (Kontrollrechnung = Bericht 18, Tabelle 8.1). Das ist ein Wiederverwendungs-Kandidat, aber mit Dateispeicher `.data/dreilaender/ecb-last.json`. Den verliert der Release-Ordner-Deploy aus AP1.

---

## 2. Sind die Welle-1-Pakete konfliktfrei?

**Nein, nicht vollständig.** Die Eigentumsmatrix ist gut gemacht (Message-Module, Registries, eingefrorene `flags.js`). Diese Lücken bleiben:

| Konflikt | Betroffene Pakete | Lösung (im Masterplan übernommen) |
|---|---|---|
| Server-Header braucht eine Änderung in `[locale]/layout.js` und `LoaderWrapper.js` | AP8 ↔ AP6 | **AP0** legt einen Slot an: `layout.js` rendert `<SiteHeader …/>` aus `src/components/Navbar/SiteHeader.js` (AP8) und reicht ihn als Prop `header` über `LoaderWrapper` an `ClientLayout`. Danach ändert AP8 nur noch eigene Dateien |
| Client-Messages kommen nicht aus `i18n/config.js` | AP0 → alle | AP0 legt `src/i18n/loadMessages.js` an (Basis + Module, Deep-Merge). `config.js` **und** `layout.js` nutzen ihn |
| `adventsabend/`, `bewerten/` ohne Besitzer | AP3, AP6 | `adventsabend/**` → AP3 (statt `events/[slug]` in Welle 1). `bewerten/**` → AP6 (übernehmen, nicht neu bauen, Review-URL aus `site.js`) |
| `labs/`, `Labs/`, `concierge/`, `portal/`, `public/labs/`, Preview `buehne`/`dreilaendereck` ohne Besitzer, Bibliotheken in AP0s `package.json` | alle | neues Paket **LAB** außerhalb von Welle 1: eigener Branch `labs/*`, nie nach `main` vor Welle 3. AP0 committet **nur namentlich genannte Dateien** (kein `git add -A`) und nimmt die Labs-Bibliotheken aus der `main`-`package.json` |
| Sitemap- und llms-Registry fehlen für AP2 (`barrierefreiheit`) und AP3 (Event-Seite) | AP2, AP3 ↔ AP5 | AP0 legt zusätzlich `src/lib/seo/sitemap/{legal,leads}.js` an |
| „Merkliste“ → „Ihre Auswahl“ steht im `Navbar`-Namespace | AP3 ↔ AP8 | Der Text-Schlüssel gehört AP8. AP3 meldet ihn als INT-Anfrage |
| `navigation.js` entsteht erst mit AP8 (Merge kurz vor INT, KW 48/49), Links zu Gutscheinen und Termin aber schon ab 16.11. nötig | AP9, AP3 ↔ AP8/INT | **AP0** legt `src/lib/navigation.js` mit den heutigen Links an, die Navbar liest daraus. Neue Einträge per INT-Mini-Merge zu jedem Release (siehe 4) |
| Galerie aus AP4 bis Tag 3 als Voraussetzung für AP5/AP8, AP4 steht in der Merge-Reihenfolge aber an 4. Stelle | AP4 → AP5/AP8 | Teil-Merge `Gallery/*` ausdrücklich **direkt nach AP0**, vor AP1 |
| `sanitizeClaims` entfernt „offiziell“ global | AP0 → AP5 | „Offizielle Website“ (`de.json` Z. 692/758, Link zur Hersteller-Website) und „Offizielle Regeln“ (St. Gallen, Zoll) würden kaputtgehen. Die Regel greift nur in **Marken-Kontext** (Wort + Markenname im selben Satz), `check-claims` ignoriert Kommentare |

---

## 3. Ohne Backoffice-Zugang baubar?

Im Wesentlichen **ja**. Die Pakete nutzen nur lesende Gast-Endpunkte und die bestehenden Anfrage-Endpunkte (Freitextfeld für Herkunft). Diese Punkte sind aber blockiert oder riskant:

- **AP3 Nr. 7 Newsletter-Interessen/Kundentyp:** blockiert (der Endpunkt nimmt nur `email` an). Möglich nur mit Brevo (E9), sonst streichen.
- **AP3 Nr. 3 „Testanfrage, ob leere Felder angenommen werden“:** Das erzeugt Datensätze im Produktiv-Backoffice. Vorher dem Team ankündigen, Betreff „TEST – bitte löschen“.
- **AP4 Downloads:** `pdf_produkte` kommt laut `fetchAllProdukte.js` Z. 88–91 aus der Detail-API. ✔ baubar.
- **AP9 Atelier:** baubar über das Sheet. „Als CSV im Web veröffentlicht“ heißt **öffentlich lesbar**. Deshalb ein eigener Tab nur mit Veröffentlichungsspalten, ohne Einkaufspreise und Kundennamen.

---

## 4. Bibliotheken: Kompatibilität mit Next 16.3.4, React 19.2.7, Tailwind 4.3.3

Abgefragt am 26.10.2026 (`npm view … peerDependencies engines license time`). Lokal läuft Node 24.22.1.

| Paket@Version | Lizenz | Peer/Engine | Alter ≥ 14 Tage | Urteil |
|---|---|---|---|---|
| embla-carousel-react@8.6.0 | MIT | react ^19 ✔ | ✔ (04/2025) | ok |
| yet-another-react-lightbox@3.32.2 | MIT | react ^19 ✔ | ✔ (30.07.) | ok, nur dynamisch |
| @next/mdx@16.3.4 | MIT | peer `@mdx-js/loader`/`react` ✔ | ✔ (31.08.) | ok, **`next` ebenfalls exakt 16.3.4 pinnen** |
| @mdx-js/loader@3.1.1 | MIT | peer `webpack >=5` | ✔ | npm 11 installiert `webpack` als Peer mit (nur dev/Build, kein Client-Bundle). Akzeptabel, im Lockfile beobachten |
| @mdx-js/react@3.1.1, remark-gfm@4.0.1, rehype-slug@6.0.0 | MIT | react ≥16 ✔ | ✔ | ok |
| zod@4.6.7 | MIT | – | ✔ (12.10., Grenze) | **behalten** statt Downgrade auf 4.6.6 |
| rate-limiter-flexible@11.2.1 | ISC | – | ✔ | ok, nur mit pm2 `instances: 1` |
| web-vitals@6.2.3 | Apache-2.0 | – | ✔ (05.10.) | ok. In `instrumentation-client.js` aber per `import()` nach `load` laden. Sonst landen die ≈ 3 KB im Initial-Bundle jeder Route (`instrumentation-client` läuft vor der Hydration) |
| clsx@2.1.1 | MIT | – | ✔ | ok |
| @calcom/embed-react@1.5.3 | „SEE LICENSE“ | react ^19 ✔ | ✔ | Lizenz vor Installation prüfen (wie im Plan) |
| @playwright/test 1.64.0 | Apache-2.0 | Node ≥ 20 | ✔ | Installiert ist **1.64.1 (14.10., erst 12 Tage alt)**. AP0 stuft auf 1.64.0 herunter |
| @axe-core/playwright@4.13.0 | MPL-2.0 | ✔ | ✔ | ok (dev) |
| vitest@5.0.3 | MIT | **Node ^22.12 / ≥ 24**, peer vite 6–8 | ✔ | CI und Server brauchen **Node 24 LTS** |
| size-limit@14.2.0 + preset-app | MIT | **Node ^22.19 / ^24.5** | ✔ | wie oben |
| knip@6.41.0 | ISC | Node ≥ 20.19 | ✔ | ok |
| @lhci/cli@0.15.1 | Apache-2.0 | braucht Chrome | ✔ | ok (dev) |
| stripe@23.0.0 (W2) | MIT | Node ≥ 20 | ✔ | ok |
| **@anthropic-ai/sdk@0.137.0** | MIT | – | **✘ 20.10. (6 Tage)** | nicht in `main`, nur LAB-Branch |
| **@react-three/fiber@9.8.2** | MIT | react 19 ✔ | **✘ 14.10. (12 Tage)** | nicht in `main` |
| three@0.183.2, @react-three/drei@10.7.9, @google/model-viewer@4.4.0 | MIT / MIT / Apache-2.0 | ✔ | ✔ | Welle 3, nicht in `main` |
| lenis@1.3.27, motion@12.43.0 | MIT | ✔ | ✔ | entfernen (wie im Plan) |

**Tailwind 4:** Die im Plan vorgesehenen `*.module.css` brauchen für `@apply` mit Theme-Tokens die Zeile `@reference "../../app/globals.css";`. Das kommt in die Bau-Regeln.

---

## 5. Stimmt die Reihenfolge nach Umsatzwirkung?

**Nein.** Die Merge-Reihenfolge AP1 → AP2 → AP3 → AP4 → AP5 → AP6 → AP7 → AP9 → AP8 → INT mit einem Gesamt-Deploy in KW 49 widerspricht den eigenen Muss-Terminen. Event 03.11., Termin KW 46, Gutscheine 16.11. und Atelier KW 47 liegen alle **vor** INT. Die Navigation bekommt die Gutscheine aber erst in INT (KW 49). Damit wäre der Gutschein-Umsatz vor Weihnachten unverlinkt. Dazu kommt: Die Umstellung auf ISR (AP0, 28.10.) geht ohne den Fetch-Wrapper (AP1, Tag 3) live. Bis dahin können leere Backoffice-Antworten eine Stunde lang gecacht ausgeliefert werden, auch an Google.

**Korrigiert auf Release-Züge (je eigener Deploy):**

| Zug | Datum | Inhalt | Umsatzlogik |
|---|---|---|---|
| R0 | Mi 28.10. | AP0a: nur Händler-Hotfix + `/api/image` weg (ohne ISR-Umstellung) | Rechtsrisiko |
| R1 | Di 03.11. | AP0b (ISR) **zusammen mit** AP1 Nr. 1 (`backofficeFetch`, kritische Fetcher werfen) + Adventsabend (AP3-Teil, Seite existiert schon) + Gallery-Teil-Merge (AP4) | Event-Leads, Seiten statisch |
| R2 | KW 46 | AP3 Lead-Strecke/Termin + AP2-Minimum (FormPrivacyNote, Impressum/DSE-Fix, Consent-Fix Ads) | direkte Anfragen mit Herkunft |
| R3 | Mo 16.11. | AP9 Gutscheine + Navigationseintrag | Weihnachtsumsatz |
| R4 | KW 47 | AP9 Atelier + AP4 Produktseite (Kern) | Liquidität, Long-Tail |
| R5 | KW 48 | AP5, AP6, AP7 | SEO (wirkt erst in Monaten) |
| R6 | KW 49 | INT, AP8 **nur A11y-Teil** (Skip-Link, Gold-Kontrast, FadeInView → CSS, Slider-Ersatz, Marquee-Pause) | Recht/Qualität |
| – | Jan. 2027 | AP8 Header-Umbau (Server-Header, Mega-Menü) | größtes Regressionsrisiko, deshalb nicht vor dem Weihnachts-Freeze |

---

## 6. Budget und Kapazität (Geschäftsregel aus 23)

Masterkonzept 23, Abschn. 12.1, Z. 523: Website extern **5–10 T€**. Der Masterplan plant **71–92 PT**. Selbst bei 400 €/PT sind das 28–37 T€, ohne Anwalt und Steuerberater. Bei Bau-Agenten sinken die Kosten, die **Review- und Abnahmezeit** einer Person bleibt aber (≈ 20–25 % der PT). Nach Abschn. 0 von 00 gilt 23 bei Budget. Deshalb gibt es einen **Welle-1-Kern** innerhalb des Budgets und einen **Welle-1-Plus** nur mit Freigabe (E9):

- **Kern (≈ 30–36 PT):** AP0 (3–4 PT statt 2, ehrlich gerechnet: 42+ Seiten, Claims, i18n, MDX, Stubs, Tests), AP1 Nr. 1/2/5, AP2 Nr. 1–3, AP3 ohne Newsletter-Ausbau, AP4 Nr. 1–4/6, AP9, INT.
- **Plus (≈ 40–55 PT):** AP1 Rest (CI-Vollausbau), AP2 Nr. 4–6, AP4 Nr. 5/7–9, AP5, AP6, AP7, AP8.

---

## 7. Recht und Performance

**Recht**
- **Gutscheine „Anfrage + Rechnung“ sind trotzdem ein Fernabsatzvertrag.** Bestellung per Webformular und Vertragsschluss per E-Mail/Rechnung, ohne Ladenbesuch, fallen unter das FAGG. Der Bestell-Button nach § 8 Abs 2 und, nach überwiegender Lesart, der Widerrufsbutton nach § 13a entfallen, weil kein Vertragsschluss „über die Online-Benutzeroberfläche“ stattfindet. **Informationspflichten und das 14-tägige Widerrufsrecht gelten aber.** Die Gutschein-Bestätigung braucht Widerrufsbelehrung und -formular **[Anwalt]**. Dasselbe gilt für Atelier-Reservierungen mit Anzahlung ohne Besichtigung. Der Masterplan formuliert das zu breit („entfallen FAGG-Kassenpflichten“).
- `/bewerten` (existiert): zeigt allen denselben Google-Link und daneben einen Feedback-Weg. Das ist kein Review-Gating, solange beide Wege für alle gleich sichtbar bleiben und keine Vorfrage („Waren Sie zufrieden?“) davor steht. ✔
- Labs-Concierge und -Portal verarbeiten personenbezogene Daten (Chat, Magic Link) und brauchen AVV, KI-Hinweis (Art. 50 AI Act) und DSE-Abschnitt. Ein weiterer Grund, sie aus `main` herauszuhalten.
- Händler-Claims: Der lokale Fix in `ueber-uns/marken/[title]/page.js` ist inhaltlich richtig („Ausstellung Lochau“), aber **noch nicht live**. R0 bleibt Priorität 1.

**Performance**
- `web-vitals` nur per `import()` laden (siehe 4).
- `.marquee` (globals.css) läuft endlos und pausiert nur bei Hover/Fokus. Für Touch fehlt ein Pausieren-Knopf (WCAG 2.2.2). → AP8 A11y-Teil.
- Labs-Bibliotheken (`three` + r3f + drei ≈ 250 KB+ gz, model-viewer ≈ 71 KB gz) sind heute nicht importiert und kosten deshalb 0 KB. Ein einziger Import in einer geteilten Datei würde das Budget-Tor sprengen. Deshalb gehören sie nicht in `main`.
- Rate-Limit im Arbeitsspeicher: Die pm2-Einstellung `instances: 1` wird festgeschrieben (Kommentar in `ecosystem.config.js`, AP1).

---

## 8. Was richtig ist und so bleiben soll

Message-Module statt geteilter JSON-Dateien. Registries für Sitemap und llms. Monitoring nur serverseitig. CSP nur als Report-Only ohne Nonces (Nonces würden die statische Auslieferung brechen). Kein `offers` ohne Preise. Claim-Allowlist nur für ClassiCon. 3D, Konfigurator und Concierge in Welle 3. Herkunft ohne Einwilligung nur im Arbeitsspeicher. Budget-Tor in CI. Die Next-16-spezifischen Annahmen (`priority` → `fetchPriority`/`preload`, `catchError`, `instrumentation-client`, MDX-Plugins als String, View Transitions ohne Konfiguration) sind alle durch die lokale Doku gedeckt.
