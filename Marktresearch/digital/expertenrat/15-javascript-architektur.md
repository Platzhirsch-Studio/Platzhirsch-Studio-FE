# 15 – JavaScript-/React-Architektur für den Neuauftritt

Rolle: JavaScript-/React-Architekt. Stand: 26.10.2026. Grundlage: Code in `src/` (nur gelesen), `next@16.3.4` (installiert, `node_modules/next/package.json`), React 19.2, Tailwind 4, motion 12, lenis 1.3, embla 8.6, die Next-16-Doku unter `node_modules/next/dist/docs/` sowie die Bauplaene `digital/01`, `02`, `12`, `13`, `14` und `23-masterkonzept.md` (Abschnitt 4).

Kernsatz: **Der Neuauftritt soll aussehen wie eine Galerie und sich anfühlen wie eine native App. Technisch ist er trotzdem eine statische Website mit wenigen kleinen Client-Inseln.** Jede Animation, jedes 3D-Modell und jeder Konfigurator ist eine Insel, die man abschalten kann, ohne dass Inhalt, SEO oder Anfrage-Formular darunter leiden.

---

## 1. Die wichtigsten Erkenntnisse für dieses Projekt

| # | Erkenntnis | Befund im Code / Beleg | Quelle |
|---|---|---|---|
| E1 | **Heute läuft fast alles im Client.** `LoaderWrapper` → `ClientLayout` (`'use client'`) umschließt jede Seite; 50 Client-Komponenten, Navbar mit 1.239 Zeilen, `NextIntlClientProvider` lädt alle 55 KB Übersetzungen auf jede Seite. Ergebnis: ca. 238 KB JS gzip, LCP mobil 3,8 s. | `src/app/[locale]/client-layout.js`, `digital/13` B5, Messung Tab. Z. 14–20 | React-Doku „Server Components“ (react.dev/reference/rsc/server-components); Next-Doku `01-getting-started/05-server-and-client-components.md` |
| E2 | **Server Components plus Inseln sind die richtige Architektur für diese Website.** Eine Content-Website mit wenig Interaktion profitiert am meisten davon, Markup statisch auszuliefern und nur einzelne Teile zu hydrieren. Das Muster heißt „Islands Architecture“. In Next 16 entsteht es automatisch aus Server Components mit `'use client'` an den Blättern. | Prototyp „Galerie“: `Shell.js` ist Server-Komponente, nur `MobileMenu.js` ist Client (richtig). „Bühne“: `SmoothScroll.js` lädt Lenis per `import()` erst im Idle und nur bei `pointer: fine` (richtig). | J. Miller, „Islands Architecture“, jasonformat.com/islands-architecture (2020); patterns.dev „Islands Architecture“ |
| E3 | **Ladezeit wirkt direkt auf Anfragen.** 0,1 s schnellere mobile Ladezeit brachte im Handel +8,4 % Conversions und +9,2 % höheren Bestellwert. Bei Luxus mit langer Entscheidungszeit zählt außerdem, dass die Seite hochwertig wirkt. Ruckeln wirkt billig. | – | Deloitte/Google, „Milliseconds Make Millions“ (2020); web.dev „Why speed matters“ |
| E4 | **Next 16 hat ein neues Caching-Modell.** `cacheComponents: true` aktiviert `'use cache'`, `cacheTag`, `cacheLife` und Partial Prerendering (statische Hülle plus gestreamte dynamische Teile). `revalidateTag(tag)` mit nur einem Argument ist veraltet. Empfohlen ist `revalidateTag(tag, "max")`: Bis die neue Version fertig ist, sehen Besucher die alte, statt zu warten. Heute nutzt der Code `{ expire: 0 }`, also eine blockierende Neuberechnung. | `src/lib/revalidateAuth.js`, `src/lib/api/fetchAllProdukte.js` (`next.revalidate: 3600`) | `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md`, `…/05-config/01-next-config-js/cacheComponents.md`, `…/cacheLife.md` |
| E5 | **Seitenwechsel wie in einer App brauchen keine Animationsbibliothek.** React 19 `<ViewTransition>` funktioniert im App Router ohne Konfiguration (Chromium 125+, aktuelles Safari und Firefox). In anderen Browsern läuft die Seite normal, nur ohne Animation. So entsteht die Morph-Animation vom Produktbild in der Kachel zum Hero der Detailseite mit 0 KB Zusatzcode. | – | `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` |
| E6 | **Bei den URLs steckt das größte SEO-Risiko.** Rund 3.200 alte URLs mit Rankings und Backlinks hängen schon heute an `legacyProductRedirects.js`. Dazu kommen 25 Redirects in `next.config.js`, übersetzte Pfade in `src/proxy.js` (`TRANSLATED_SECTIONS`) und 4 Sprachen. Google wertet einen Relaunch ohne URL-Änderung **nicht** als Umzug. Das ist der sicherste Weg. | `src/lib/seo/legacyProductRedirects.js`, `src/proxy.js`, `next.config.js` `redirects()` | Google Search Central, „Site moves with URL changes“ und „Redirects and Google Search“ (developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes) |
| E7 | **Fehlergrenzen fehlen dort, wo es teuer wird.** Die Merkliste (`CartContext`) sitzt ohne Error Boundary an der Wurzel. Der Code dokumentiert das selbst („no error boundary sits above this provider“). Next 16 bietet `catchError` aus `next/error` für Fehlergrenzen auf Komponentenebene mit `retry()`. | `src/context/CartContext.js` Z. 17–19 | `…/03-api-reference/04-functions/catchError.md` |
| E8 | **3D und Konfigurator dürfen nie im Initial-Bundle landen.** `three` (~155 KB gz), `@react-three/fiber` und `drei` sowie `@google/model-viewer` (selbst ~200+ KB gz) liegen schon in `package.json`. Ein einziger Import in einer geteilten Komponente bläht jede Seite auf. | `package.json` | Next-Doku `02-guides/lazy-loading.md`; bundlephobia.com (Werte im eigenen Build mit `next experimental-analyze` nachmessen) |
| E9 | **INP ist seit März 2024 ein Core Web Vital (gut ≤ 200 ms).** Smooth Scroll, Parallax und Mausverfolgung im Main Thread sind die typischen INP-Killer auf Luxus-Websites. | – | web.dev/articles/inp; Google Search Central Blog, 12.03.2024 |
| E10 | **Tests sichern Leads und Rankings ab.** Bei 5 Personen ohne Vollzeit-Entwickler hilft nur Automatik: Ein Release darf keine Redirects, Formulare oder Merkliste brechen. Bewährt ist die „Testing Trophy“: wenige Unit-Tests, viele Integrationstests, E2E nur für kritische Wege. | `digital/13` F5 | K. C. Dodds, „The Testing Trophy“ (kentcdodds.com/blog/write-tests); Playwright-Doku playwright.dev; Vitest-Doku vitest.dev; Next-Doku `02-guides/testing/` |

---

## 2. Konkrete Vorgaben für den Neuauftritt

### 2.1 Komponentengrenzen: Server oder Client

**Regel S1 – Server ist der Standard.** `'use client'` steht nur in Dateien unter `components/islands/**` (Lint-Regel: `no-restricted-syntax` meldet `'use client'` außerhalb dieses Ordners als Fehler). Layout, Navigation (Markup), Footer, Seiten, Kacheln und Texte bleiben Server Components.

**Regel S2 – Inseln bekommen nur serialisierbare, kleine Props.** Erlaubt sind IDs, Slugs und bis zu 20 Datensätze. Ganze Produktlisten gehören nicht in die Props. Grenze: RSC-Payload pro Seite ≤ 50 KB gzip (wie `digital/13`).

**Regel S3 – Übersetzungen auf dem Server.** Seitentexte kommen über `getTranslations()`. `NextIntlClientProvider` erhält nur `pick(messages, ["Nav","Merkliste","Consent","Form"])`. Ziel: höchstens 6 KB Übersetzungen pro Seite im Client.

**Zielbild Verzeichnisstruktur** (neu, parallel zum Bestand, ohne Eingriff in bestehende Dateien bis zur jeweiligen Migrationsphase):

```
src/
  app/[locale]/...                 # URLs bleiben exakt gleich (siehe 2.9)
  design/                          # Tokens (CSS @theme), Typo, Grid – 0 KB JS
  components/
    ui/                            # Server: Button-Link, Bild, Kachel, Prose
    sections/                      # Server: Hero, Markenwand, Raumgeschichte
    islands/                       # einzig erlaubter Ort für 'use client'
      MerklisteButton.js  NavMenu.js  NavSearch.js  Gallery.js
      SmoothScroll.js  ModelViewer.js  Configurator/  forms/  Consent.js
  lib/
    backoffice/                    # server-only: Client, Schemas, Mapper, Cache
    merkliste/                     # Store (isomorph), Schema
    routing/                       # ROUTES, productsPath (heute src/utils/routing.js)
```

### 2.2 Insel-Katalog mit Ladeauslöser und Budget

| Insel | Inhalt | Lädt wann | Budget (gzip) | Ohne JS |
|---|---|---|---|---|
| `NavMenu` | Burger, Mega-Menü, Fokusfalle | sofort (klein) | ≤ 4 KB | `<details>`-Fallback, Links bleiben klickbar |
| `NavSearch` | Suche mit Vorschlägen | **erst bei Fokus/Klick** auf das Suchfeld, Chunk per `import()` | ≤ 8 KB | `<form action="/de/produkte">` mit GET |
| `MerklisteButton` | Herz, Zähler | sofort | ≤ 3 KB (inkl. Store) | Link zur Merkliste |
| `Gallery` | embla 8.6 + Lightbox | `IntersectionObserver`, `rootMargin: "200px"` | ≤ 9 KB | CSS `scroll-snap-type: x mandatory` |
| `SmoothScroll` | lenis, `lerp: 0.11` | `requestIdleCallback`, nur bei `(pointer: fine)` und ohne `prefers-reduced-motion` (genau wie im Prototyp „Bühne“) | ≤ 5 KB | nativ |
| `Reveal` / Motion | motion 12 nur für Gesten (Drag, Layout) | nur auf Seiten, die es brauchen, `LazyMotion` + `domAnimation` | ≤ 18 KB (statt ~34 KB voll) | CSS `animation-timeline: view()` als Standard |
| `ModelViewer` (3D/AR) | `@google/model-viewer` oder r3f | **nur nach Klick** auf eine Fassade (Server-`next/image` mit Button „In 3D ansehen“), `next/dynamic(..., { ssr: false })` | eigener Chunk ≤ 250 KB, nie im Initial-Bundle | Poster-Bild |
| `Configurator` | Küchen-/Stein-Konfigurator | eigene Route `/[locale]/kuechen-vorarlberg/konfigurator` | Initial ≤ 60 KB App-Code, 3D-Chunk separat | Anfrageformular mit Auswahlfeldern |
| `forms/*` | Anfrage, Beratung, Termin | sofort, aber `useActionState` + Server Action | ≤ 6 KB | funktioniert als normales `<form>` (Progressive Enhancement) |
| `Consent` | Einwilligungs-Banner | sofort, bewusst **kein** Drittanbieter-CMP-Skript | ≤ 4 KB | Tracking bleibt aus |

**Regel I1:** Kein Modul aus `three`, `@react-three/*`, `@google/model-viewer`, `lenis`, `embla-carousel*` darf in einer Datei außerhalb der jeweiligen Insel importiert werden. Durchsetzung: ESLint `no-restricted-imports` mit `allowImportNamesFrom` je Insel-Ordner plus `size-limit` je Seitentyp (2.6).

**Regel I2 – Fassaden-Muster für alles Schwere:** Der Server rendert ein Bild in fester Größe (`width`/`height`, kein CLS). Der Klick löst `import()` aus, solange läuft ein Ladezustand mit maximal 150 ms Verzögerung vor dem Spinner. Bei Fehler bleibt das Bild stehen (Fehlergrenze, 2.7).

### 2.3 Animationsarchitektur (Schnittstelle zu `digital/02`)

- **Stufe 0 (Standard, 0 KB):** CSS-Übergänge mit `transform`/`opacity`, Dauer 180–450 ms, Easing `cubic-bezier(0.22, 1, 0.36, 1)`. Scroll-Reveals über `animation-timeline: view()`; Browser ohne Unterstützung zeigen den Inhalt sofort an (`@supports`), nie `opacity: 0` vor der Hydration.
- **Stufe 1 (0 KB):** React `<ViewTransition>` für Seitenwechsel. Shared Element `name={"p-" + slug}` auf Kachelbild und PDP-Hero; Header mit `viewTransitionName: 'site-header'` ausnehmen. Dauer 350 ms, bei `prefers-reduced-motion: reduce` 0 ms (Doku-Muster `view-transitions.md` Z. 383).
- **Stufe 2 (Insel):** motion 12 nur für Drag/Layout-Gesten (Galerie, Konfigurator-Schieber), nur über `LazyMotion`.
- **Stufe 3 (Insel):** WebGL/3D nur hinter Fassade.
- **Verbote:** kein `scroll`-Event-Listener ohne `{ passive: true }`; kein Layout-Lesen (`getBoundingClientRect`) pro Frame; Lenis nie auf Touch-Geräten; kein Scroll-Hijacking (feste Sektionssprünge).

### 2.4 State-Architektur

**Merkliste (ersetzt `CartContext`):**
- Ein **externer Store** (`lib/merkliste/store.js`) mit `useSyncExternalStore`, **kein** Context-Provider an der Wurzel. Heute rendert `CartProvider` bei jeder Änderung den ganzen Baum neu, künftig nur die Inseln, die den Store abonnieren.
- Persistenz in `localStorage` unter dem Schlüssel `ph:merkliste:v2`, Schema mit Version (`{ v: 2, items: [{ id, slug, category, addedAt }] }`). Gespeichert werden nur IDs, keine Namen und Bilder: Die Daten kommen frisch vom Server, so veralten Preise oder Namen nie. Migration von `cart` (v1) einmalig beim ersten Laden; bei kaputtem JSON wird verworfen, ohne Absturz (heutiges Verhalten beibehalten).
- Synchronisation zwischen Tabs über das `storage`-Event.
- Die Merkliste-Seite rendert der Server: Die Insel übergibt die IDs an eine Server-Funktion oder Route (`?ids=a,b,c`, max. 50). Der Server liefert die Kacheln. **Teilen-Link** `/de/merkliste?ids=…` (vom Partner oder Architekten weiterleitbar, `noindex`).
- „Merkliste als Anfrage senden“ übergibt die IDs in ein verstecktes Feld des Beratungsformulars. Ohne Konto, ohne Login (Datensparsamkeit, `digital/14`).

**Konfigurator:**
- **Die URL ist der State:** `?front=eiche-natur&platte=calacatta-oro&staerke=20&laenge=360`. Damit sind Teilen, Zurück-Taste, SEO-freie Varianten und Wiederherstellen nach Reload gratis. Schreiben per `history.replaceState`, 300 ms Debounce. Neuer History-Eintrag nur bei Schrittwechsel.
- Lokaler State mit `useReducer` (reine Funktion, mit Vitest testbar). Keine globale State-Bibliothek nötig. Erst wenn mehr als 3 Inseln denselben State teilen, kommt `zustand` (~1 KB) in Frage.
- Erlaubte Optionen kommen vom Server (Frappe), der Server validiert sie erneut (zod). Ungültige URL-Parameter fallen still auf den Standard zurück, ohne Fehlerseite.
- Preise nur als vom Backoffice gelieferte „ab“-Werte inklusive MwSt. und mit Land (AT/DE/CH), nie im Client berechnet und nie mit erfundenen Rabatten (UGP-Richtlinie, PAngV, `digital/14`).

**Formulare:** Server Actions + `useActionState`, Validierung mit zod 4 auf dem Server (0 KB Client), Honeypot, Zeitfalle ≥ 3 s, Rate-Limit (`digital/13` F3). Optimistische Bestätigung erst nach dem Server-OK. Eine „gesendet“-Meldung ohne echte Antwort ist verboten.

### 2.5 Datenlayer zum Frappe-Backoffice

Heute gibt es 11 lose Fetcher (`src/lib/api/fetch*.js`) mit zwei Basis-URLs (`API_BASE_URL`, `NEW_API_BASE_URL`), Rohformaten aus Frappe und `fallback`-Rückgaben. Zielbild in drei Schichten:

1. **`lib/backoffice/client.js` (server-only):** ein einziger `frappeGet(method, params)` mit `AbortSignal.timeout(8000)` (heute 15 s), Allowlist der erlaubten Methoden (schließt die offene Proxy-Lücke von `/api/image`, `digital/13` B2), strukturiertem Logging und ohne Secrets im Client.
2. **`lib/backoffice/schemas.js`:** zod-Schemas je Doctype (`ProduktNew`, `Marke`, `Kategorie`, `News`, `Team`). Parsen mit `safeParse`; ungültige Datensätze werden **einzeln** verworfen und geloggt, statt die Seite zu brechen.
3. **`lib/backoffice/queries.js`:** fachliche Funktionen (`getProduct(slug, locale)`, `getCategory(key)`, `getBrand(slug)`), die **Domänenobjekte** zurückgeben (`{ id, slug, name, brand, images: [{ src, w, h, alt }], dims, materials }`). Komponenten sehen nie Frappe-Feldnamen wie `name1`, `kategories` oder `path_field`.

**Caching und Revalidierung (Phase 2, mit `cacheComponents: true`):**

```js
// lib/backoffice/queries.js
import "server-only";
import { cacheLife, cacheTag } from "next/cache";

export async function getProduct(slug) {
  "use cache";
  cacheLife("max");                       // gültig, bis der Webhook kommt
  cacheTag("products", `product:${slug}`);
  return toProduct(await frappeGet("produkte_new.api.get_produkt", { slug }));
}
```

| Datentyp | Tags | `cacheLife` | Webhook (Frappe → `/revalidate/*`) |
|---|---|---|---|
| Produkt | `products`, `product:<slug>`, `brand:<slug>` | `max` + Sicherheitsnetz `revalidate: 86400` | Einzelprodukt: `revalidateTag("product:<slug>", "max")`; Massenimport: `products` |
| Kategorie/Listing | `kategorien`, `category:<key>` | `max` | bei Produkt-Änderung auch `category:<key>` |
| Marke | `marken`, `brand:<slug>` | `max` | Marken-Webhook |
| News/Ratgeber | `news`, `news:<slug>` | `days` | News-Webhook |
| Team/Karriere | `team`, `karriere` | `weeks` | bestehende Routen |
| Suche | – | nicht gecacht (`connection()`) | – |

- Den Webhook auf `revalidateTag(tag, "max")` umstellen (Doku-Empfehlung, keine blockierende Neuberechnung). Nur „Produkt deaktiviert/rechtlich entfernt“ bekommt `{ expire: 0 }`.
- Der Webhook-Payload enthält künftig `doctype` und `name`. So invalidiert der Webhook einzelne Datensätze statt aller 1.765 Produkte × 4 Sprachen. Das schont Crawl-Budget und Server.
- **Fällt das Backoffice aus,** liefert der Cache weiter die letzte gute Version (stale). Kein `fallback: []` mehr, das eine leere Kategorieseite mit Status 200 erzeugt (Soft-404-Risiko). Bei echtem Fehlen: `notFound()`.
- `generateStaticParams` für alle Produkt-, Kategorie- und Markenseiten (gibt es schon). Mit `cacheComponents` wird die Hülle vorgerendert, nur Merkliste-Zähler und Consent-Status sind dynamisch (in `<Suspense>`).
- **Prüfpunkt vor dem Umschalten:** `cacheComponents` mit next-intl (Locale über `setRequestLocale`/`rootParams`) in einem Branch testen. Kein Aufruf von `headers()`/`cookies()` im Layout, sonst verliert jede Seite das statische Rendering.

### 2.6 Bild-Pipeline

- Quelle bleibt das Frappe-Backoffice. Ausgeliefert wird über `next/image` (AVIF → WebP, `minimumCacheTTL: 2592000` ist gesetzt).
- **Maße sind Pflicht im Datenmodell:** Der Mapper liefert `w`/`h` und einen Fokuspunkt (`focus: "50% 40%"` als neues Frappe-Feld) für `object-position`. Ohne Maße gibt es kein Rendering (Build-Warnung).
- **LCP-Bild:** `preload` bzw. `fetchPriority="high"` + `loading="eager"`, sonst `lazy`. Mobil gilt Art Direction per `getImageProps()` + `<picture>` (Hochformat 828×1200, ≤ 120 KB AVIF bei `quality={75}`), Desktop 1920×1080 ≤ 220 KB.
- **`sizes` exakt pro Layout:** Kachel im 3er-Grid `sizes="(min-width:1200px) 33vw, (min-width:640px) 50vw, 100vw"`; Hero `100vw`. Ein falsches `sizes` lädt auf dem Handy die 1920er-Variante.
- **Platzhalter:** einfarbig aus der Bild-Durchschnittsfarbe (Frappe-Feld `dominant_color`, z. B. `#e9e4dc`) statt Blur-Base64. Das spart pro Kachel ~0,5–1 KB HTML und wirkt ruhiger.
- `dangerouslyAllowSVG: true` entfernen oder mit `contentDispositionType: "attachment"` und `contentSecurityPolicy` absichern (Next-Doku `image.md`). Logos als Inline-SVG-Komponente.
- `/api/image` löschen oder auf eine Allowlist `/files/*` mit Timeout und Größenlimit (10 MB) beschränken.
- Video (Atelier, Café): `<video muted playsinline preload="none" poster=…>`, AV1/H.264, ≤ 2,5 MB pro 10 s Loop, Start erst bei Sichtbarkeit, Pause bei `prefers-reduced-motion`.

### 2.7 Fehlergrenzen und Ausfallsicherheit

| Ebene | Mechanismus | Verhalten |
|---|---|---|
| App | `app/global-error.js` | Schlichte Markenseite mit Telefonnummer und Adresse, keine weiße Seite |
| Segment | `error.js` in `produkte/`, `ueber-uns/marken/`, `news/` | `retry()` plus Link zur Übersicht, Status bleibt korrekt |
| Inseln | `catchError` (`next/error`) um jede Insel | 3D-Fehler → Poster bleibt; Galerie-Fehler → statische Bilder; Merkliste-Fehler → Herz ausgeblendet, Seite bleibt |
| Daten | `safeParse` je Datensatz, stale Cache | Ein kaputtes Produkt lässt die Kategorie nicht ausfallen |
| Not found | `notFound()` statt leerer Listen | echte 404 statt Soft-404 |
| Beobachtung | `instrumentation.js` mit `onRequestError` → GlitchTip (selbst gehostet, EU) oder Sentry EU, Client nur Fehler, ≤ 25 KB gz | Alarm bei > 5 Fehlern in 10 min oder bei jedem Fehler in einer Formular-Route |

### 2.8 Bundle-Budget pro Seitentyp

Gemessen wird First-Load-JS gzip, mobil. CI bricht ab bei Überschreitung um mehr als 10 %. Werkzeuge: `size-limit` 14 + `@size-limit/preset-app`, `next experimental-analyze`, `@lhci/cli` mit 4G-Throttling, Moto G Power.

| Seitentyp | Beispiel-URL | JS gesamt | davon App-Code | HTML+RSC | LCP (Labor) | Besonderheit |
|---|---|---|---|---|---|---|
| Startseite | `/de` | ≤ 150 KB | ≤ 45 KB | ≤ 45 KB | ≤ 2,3 s | Hero-Bild/Video-Poster, keine Bibliothek außer Merkliste/Nav |
| Ratgeber, News, Regionsseiten | `/de/designermoebel-arlberg` | ≤ 130 KB | ≤ 25 KB | ≤ 40 KB | ≤ 2,0 s | reiner Text + Bilder, 0 Inseln außer Nav |
| Markenseite | `/de/ueber-uns/marken/minotti` | ≤ 155 KB | ≤ 50 KB | ≤ 50 KB | ≤ 2,3 s | Galerie lazy |
| Kategorie | `/de/produkte/sofas` | ≤ 160 KB | ≤ 55 KB | ≤ 60 KB (bei 48 Kacheln, dann Paginierung) | ≤ 2,3 s | erste 2 Kacheln eager |
| Produktdetail | `/de/produkte/sofas/<slug>` | ≤ 170 KB | ≤ 65 KB | ≤ 50 KB | ≤ 2,5 s | embla + Anfrage-Insel; 3D nur nach Klick (+≤ 250 KB) |
| Formularseiten | `/de/beratung`, `/de/kontakt` | ≤ 160 KB | ≤ 50 KB | ≤ 40 KB | ≤ 2,0 s | Server Action |
| Konfigurator | `/de/kuechen-vorarlberg/konfigurator` | ≤ 230 KB initial | ≤ 110 KB | ≤ 40 KB | ≤ 2,5 s | 3D-Chunk ≤ 300 KB separat, GLB ≤ 1,5 MB |

Basis (Framework + React + Router) beträgt heute ca. 100–110 KB gz. Den genauen Wert misst der erste CI-Lauf, die Budgets oben werden dann einmalig kalibriert. Der `browserslist`-Block in `package.json` (Safari 15) kostet ca. 14 KB Polyfills und sollte nach Prüfung in GA4 entfallen (`digital/13` F6).

### 2.9 Migrationsplan vom heutigen Code ohne SEO-Verlust

**Grundsatz: Nur das Design ändert sich, die URLs bleiben gleich.** Kein neues URL-Schema, keine neue Domain, keine neue Sprachstruktur. Damit entfällt der „Site move“ nach Google-Definition (E6).

**Phase 0 – Basislinie einfrieren (1 Tag):**
1. URL-Inventar erstellen: alle URLs aus `sitemap.xml` (static, produkte, marken, news) plus GSC-Export „Seiten mit Impressionen“ (16 Monate) plus Backlink-Ziele. Ablage als `tools/seo-baseline/urls.csv`.
2. Pro URL speichern: Status, finale URL, `<title>`, H1, Canonical, alle `hreflang`, JSON-LD-Typen, Wortzahl, interne Links. Das Skript liegt unter `tools/` (Playwright headless, ~1.765 × 4 URLs, 4 parallel).
3. Redirect-Fixtures: alle 25 `redirects()`-Regeln plus eine Stichprobe von 300 Legacy-Produkt-URLs aus `legacyProductRedirects.js` mit erwartetem Ziel.

**Phase 1 – Fundament ohne sichtbare Änderung (1–2 Wochen):** Server-Shell statt `ClientLayout`, Merkliste-Store, Datenlayer mit Schemas, Fehlergrenzen, CI mit Budgets. Jede Änderung muss den Basislinien-Vergleich bestehen (0 Abweichungen bei Status, Canonical und hreflang).

**Phase 2 – Design pro Seitentyp (Strangler-Muster):** Reihenfolge nach Risiko, nicht nach Sichtbarkeit: Ratgeber/Regionsseiten → Markenseiten → Startseite → Kategorie → Produktdetail → Konfigurator (neu). Jede Seite wird vorher unter `/de/preview/<prototyp>/…` abgenommen (`noindex`, nicht in der Sitemap, `robots.js`: `Disallow: /*/preview`). Danach ersetzt sie die bestehende Komponente **in derselben Route-Datei**. Es gibt keine Parallel-URL.

**Phase 3 – Umschalten und Beobachten:** Deploy außerhalb der Saison-Spitze (nicht in der Advents-Woche ab 26.11.). Danach 14 Tage täglich prüfen: GSC Abdeckung (404, Soft-404, „Duplikat ohne Canonical“), Crawl-Statistik, Top-50-Keywords. Ein Rückgang der Klicks um mehr als 15 % gegenüber dem Vorjahreszeitraum nach Bereinigung führt zur Analyse pro Seitentyp, bei Fehlern Rollback per PM2 auf das vorige Build-Artefakt (< 5 min).

**Phase 4 – Aufräumen:** Preview-Routen löschen (dann 404, nicht 301, da nie indexiert). Tote Abhängigkeiten entfernen (`react-slick`, `slick-carousel`, `react-share`, `react-icons`, bei Bedarf `cookies-next`), Prüfung mit `knip`.

**Wenn eine URL doch geändert werden muss:** 1:1-Redirect mit 308 auf das inhaltlich gleichwertige Ziel (nie pauschal auf die Startseite), keine Ketten mit mehr als 1 Hop, Redirect mindestens 12 Monate halten (Google-Empfehlung: „mindestens ein Jahr“), Sitemap und interne Links sofort auf die neue URL umstellen, `hreflang`-Gruppen in allen 4 Sprachen gleichzeitig ändern. Neue Redirects gehören in `next.config.js` (statisch) oder in `proxy.js` (übersetzte Pfade), jeweils mit Test-Fixture.

### 2.10 Tests

| Ebene | Werkzeug | Was | Wann |
|---|---|---|---|
| Statisch | ESLint 9 (`eslint-config-next`), Insel-Importregeln, TypeScript-`checkJs` für `lib/**` | Grenzen, tote Imports | jeder Commit |
| Unit | Vitest 3 + `@vitejs/plugin-react` | Mapper (Frappe → Domäne), zod-Schemas, `slugify`, `ROUTES`/`productsPath`, Konfigurator-Reducer, Merkliste-Store inkl. v1→v2-Migration und kaputtem JSON | jeder Commit, < 20 s |
| Komponenten | Vitest + Testing Library (nur Client-Inseln) | Merkliste-Button, Formular-Zustände, Tastaturbedienung Galerie | jeder Commit |
| E2E | Playwright 1.5x, Chromium + WebKit (Safari-Anteil der Zielgruppe hoch) + Pixel-7-Emulation | 6 kritische Wege: Produkt finden → merken → Merkliste → Anfrage senden (Backend gemockt); Beratung buchen; Sprachwechsel DE→EN→FR→IT auf PDP; Suche; Konfigurator teilen und neu laden; Seite ohne JS (`javaScriptEnabled: false`) zeigt alle Inhalte | jeder PR |
| SEO-Regression | Playwright-Request-Tests gegen `urls.csv` | Status, Location, Canonical, hreflang, `noindex` auf Preview | jeder PR (Stichprobe 300), nachts komplett |
| A11y | `@axe-core/playwright` + `emulateMedia({ reducedMotion: "reduce" })` | 0 Verstöße „serious/critical“ auf 8 Vorlagen; bei reduzierter Bewegung kein Lenis und keine View Transition | jeder PR |
| Visuell | Playwright `toHaveScreenshot` (Schwelle 0,2 %) | 8 Vorlagen × 2 Breiten (390, 1440) | jeder PR |
| Performance | `@lhci/cli` + `size-limit` | Budgets aus 2.8 | jeder PR, Abbruch bei Überschreitung |
| Feld | `useReportWebVitals` → GA4 (nach Consent) | LCP/INP/CLS p75 je Seitentyp | laufend, Monatsbericht |

---

## 3. Ideen, die die Konkurrenz alt aussehen lassen

Bei allen genannten Wettbewerbern (Höttges, reiter design, Dolce Vita, Fretz, Gamma) ist der übliche Stand eine Händlerseite mit Karussell, Kachel und vollem Seiten-Reload. Technisch lässt sich Folgendes dagegensetzen:

1. **„Vom Bild in den Raum“ ohne Ladebruch.** Klick auf eine Sofa-Kachel: Das Bild gleitet per `<ViewTransition>` in 350 ms an seine Hero-Position auf der Detailseite, Text blendet nach. Auf dem Handy wirkt das wie eine App, kostet 0 KB und schadet keiner URL.
2. **Sofortige Navigation.** `<Link prefetch>` lädt sichtbare Kacheln und Hauptnavigation vor. Mit PPR liegt die statische Hülle im CDN-/Server-Cache. Zielwert: Seitenwechsel ≤ 150 ms auf WLAN, bfcache funktioniert beim Zurück-Tippen.
3. **Teilbare Merkliste für Paare und Architekten.** „Link an Partner senden“ (Web Share API) → `/de/merkliste?ids=…` zeigt dieselbe Auswahl auf jedem Gerät, ohne Konto. Mit einem Klick wird daraus eine Beratungsanfrage mit vorausgefüllter Liste. Das bietet keiner der Wettbewerber.
4. **Stein-Konfigurator mit URL-Zustand.** Platte, Kante und Stärke wählen; der Link speichert die Wahl. Die Beratung im Studio öffnet denselben Link am großen Bildschirm. 3D lädt erst auf Wunsch, Standard ist ein hochaufgelöstes Foto-Rendering der echten Platte.
5. **„In Ihrem Raum ansehen“ (AR) nur dort, wo echte Modelle vorliegen.** `model-viewer` mit `ar-modes="webxr scene-viewer quick-look"`, USDZ für iPhone, hinter Fassade. Nur mit Herstellermodellen (`digital/03`) und ohne erfundene Maße.
6. **Funktioniert auch ohne JavaScript und bei schwachem Netz am Arlberg.** Alle Inhalte, Formulare und Links sind Server-HTML. Der experimentelle `useOffline`-Modus von Next 16 (`02-guides/offline-support`) kann Formular-Absendungen bei Funkloch zurückhalten. Das wird erst nach Test aktiviert.
7. **Ruhige, flüssige Bewegung mit 60 fps auf Mittelklasse-Handys.** Animiert werden nur `transform` und `opacity`, INP ≤ 150 ms. Messbar besser als jede WordPress-/Shopify-Seite der Wettbewerber (Vergleichsmessung `digital/13`, Faktor 1,5–5 beim LCP).
8. **Studio-Modus für Beratung vor Ort.** `?studio=1` (nicht indexiert) blendet Navigation aus und vergrößert Bilder, Merkliste und Konfigurator für das Tablet im Showroom. Gleiche Codebasis, keine zweite App.

---

## 4. Was man auf keinen Fall tun darf

1. **Kein `'use client'` an Layout, Seiten oder großen Sektionen.** Kein globaler Provider, der den ganzen Baum zum Client macht. Das ist der heutige Hauptfehler.
2. **Kein `three`, `model-viewer`, `lenis` oder `motion` (voll) im geteilten Bundle.** Kein 3D-Canvas über dem Hero als LCP-Element.
3. **Kein Inhalt, der vor der Hydration unsichtbar ist** (`opacity: 0` bis JS läuft). Google und Nutzer mit langsamer Verbindung sehen sonst eine leere Seite.
4. **Keine Lade-Intros oder Preloader-Animationen** vor dem Inhalt (`LoaderWrapper`-Muster). Sie verzögern LCP und sind bei Luxus-Websites ein Klischee.
5. **Keine Scroll-Übernahme** (Abschnitts-Snapping, verlangsamtes Scrollen auf Touch, blockiertes Zurück). Lenis nur auf Maus/Trackpad, nie bei `prefers-reduced-motion`.
6. **Keine URL-Änderung ohne 1:1-Redirect plus Test-Fixture.** Keine pauschalen Redirects auf `/de`, keine Redirect-Ketten, kein Löschen von `legacyProductRedirects.js` und der 25 Regeln in `next.config.js`.
7. **Keine leeren Seiten mit Status 200** (`fallback: []`) bei Backend-Ausfall. Entweder der Cache liefert die letzte gute Version oder es kommt `notFound()`.
8. **Keine Dark Patterns im Code.** Keine „Nur noch 2 verfügbar“- oder „5 Personen sehen gerade“-Komponenten, keine Countdown-Timer, kein vorausgewähltes Newsletter-Häkchen, kein „Nein danke, ich mag kein schönes Wohnen“ (Confirmshaming), keine Preise ohne MwSt. Unzulässig nach DSA Art. 25, UWG/UGP-Richtlinie und PAngV (`digital/14`), und für eine Luxusmarke schädlich.
9. **Kein Drittanbieter-Skript vor der Einwilligung** (TTDSG § 25 / TKG 2021 § 165, DSGVO). Kein Google-Fonts-CDN (LG München I, 3 O 17493/20); Schriften nur über `next/font` selbst gehostet, wie in allen drei Prototypen.
10. **Keine Secrets, Frappe-Tokens oder Rohdaten im Client.** Keine offenen Proxy-Routen wie heute `/api/image?path=`.
11. **Kein Zustand, der nur im Speicher lebt** (Konfigurator-Auswahl, Formularentwurf), wenn ein Reload ihn löscht. Konfigurator in die URL, Formularentwurf in `sessionStorage`.
12. **Keine neue Abhängigkeit ohne Budget-Nachweis.** Jede PR mit neuer Abhängigkeit zeigt den `size-limit`-Diff.

---

## 5. Prüf-Checkliste für die drei Prototypen (Galerie, Bühne, Dreiländereck)

Skala je Kriterium: **0** = fehlt oder widerspricht der Vorgabe · **1** = teilweise, mit deutlichen Mängeln · **2** = erfüllt · **3** = vorbildlich, direkt übernehmbar. Gewichtung in Klammern. Höchstwert: 3 × Summe der Gewichte = 3 × 30 = **90 Punkte**. Ab 70 Punkten ist ein Prototyp architektonisch übernahmefähig. Bei 0 Punkten in einem K.-o.-Kriterium (★) scheidet er unabhängig von der Summe aus, bis der Mangel behoben ist.

| # | Kriterium | Messung | Gew. |
|---|---|---|---|
| A1 ★ | Server-first: Layout, Shell und Seiten sind Server Components, `'use client'` nur an Blättern | `grep -rl "use client" src/components/Preview/<name> src/app/[locale]/preview/<name>`; Anzahl und Größe der Dateien | 3 |
| A2 | Initial-JS je Seite innerhalb des Budgets aus 2.8 | `next build` + `next experimental-analyze` bzw. Lighthouse „JavaScript transfer size“ | 3 |
| A3 ★ | Inhalt ohne JavaScript vollständig sichtbar und navigierbar | Playwright `javaScriptEnabled: false` / `curl http://localhost:3000/de/preview/<name>` enthält H1, Text, Links, Bilder mit `alt` | 3 |
| A4 | LCP-Bild korrekt (`preload`/`fetchPriority="high"`, eager, passende `sizes`, ≤ 120 KB mobil) | Lighthouse mobil, Netzwerk-Panel | 2 |
| A5 | CLS ≤ 0,05: alle Bilder und Medien mit festen Maßen, Schriften per `next/font` mit `adjustFontFallback` | Lighthouse, WebPageTest Filmstrip | 2 |
| A6 ★ | Bewegung nur über `transform`/`opacity`, `prefers-reduced-motion` vollständig respektiert, kein Inhalt mit `opacity: 0` vor der Hydration | Code-Review CSS/JS; Playwright `reducedMotion: "reduce"` | 3 |
| A7 | Schwere Bibliotheken (lenis, motion, embla, 3D) dynamisch geladen und an Bedingung geknüpft (Idle, Sichtbarkeit, Klick, Pointer) | Code-Review `import()`; Coverage-Tab in DevTools | 2 |
| A8 | INP/TBT: keine Main-Thread-Arbeit pro Scroll-Frame, TBT ≤ 150 ms (Labor, mobil) | Lighthouse, Performance-Panel 6× CPU-Drossel | 2 |
| A9 | Datenzugriff über eine Schicht (kein Frappe-Feldname in Komponenten, Mock-Daten in `content.js`/`data.js` auf echtes Domänenmodell übertragbar) | Code-Review | 2 |
| A10 | Übertragbarkeit auf die bestehenden URLs und Sprachen (keine neuen URL-Muster nötig, i18n mit next-intl möglich, Texte nicht hart in Komponenten) | Code-Review gegen `src/proxy.js`/`ROUTES` | 2 |
| A11 | Barrierefreiheit technisch: Landmarks, Fokus sichtbar, Tastatur im Menü (Esc, Fokusfalle), axe 0 serious/critical | `@axe-core/playwright`, manuelle Tab-Runde | 2 |
| A12 | SEO-Grundlagen: eine H1, semantische Überschriften, `noindex` auf Preview, Metadaten über `metadata`-API | `curl` + Quelltext | 1 |
| A13 | Fehlertoleranz: Insel-Ausfall (z. B. Lenis-Import schlägt fehl) bricht die Seite nicht | DevTools Request-Blocking für den Chunk | 1 |
| A14 | Wartbarkeit: Tokens in CSS (`@theme`) statt Hex-Literalen, CSS Modules/Tailwind konsistent, Komponenten < 200 Zeilen | `grep -c "#[0-9a-f]\{6\}"`, `wc -l` | 1 |
| A15 | Wiederverwendbarkeit für Merkliste, Konfigurator und Anfrage (klar definierte Insel-Schnittstellen) | Code-Review | 1 |

**Erste Einschätzung nach Code-Lektüre (vorläufig, ohne Build-Messung):**
- **Galerie:** Server-Layout mit `notFound()` für andere Sprachen, `noindex`, nur `MobileMenu.js` als Client-Datei (A1 voraussichtlich 3). Eigene Schriften Cormorant Garamond + Instrument Sans über `next/font` (A5 positiv). Startseite und Markenseite Minotti vorhanden.
- **Bühne:** `SmoothScroll.js` ist ein Musterbeispiel für A6/A7 (Idle-Import, nur `pointer: fine`, Abschalten bei Änderung der Bewegungseinstellung, `anchors: true`). Die Routen `logo/` und `produkt/[slug]/` waren beim Lesen noch leer, also noch nicht prüfbar.
- **Dreiländereck:** Bisher nur Komponenten (`Logo.js`, `content.js`, `data.js`, `fonts.js` mit Fraunces + Instrument Sans), noch keine Route unter `src/app/[locale]/preview/dreilaendereck`. Bewertung erst nach Fertigstellung.

Die Punkte A2, A4, A5, A8 und A11 sind erst nach `next build` + Lighthouse auf allen drei Prototypen unter gleichen Bedingungen belastbar (gleiche Maschine, mobil, 4G-Drossel, Median aus 5 Läufen).

---

### Quellen

- Next.js 16.3.4, lokale Doku: `node_modules/next/dist/docs/01-app/` – `03-api-reference/05-config/01-next-config-js/cacheComponents.md`, `…/cacheLife.md`, `03-api-reference/04-functions/revalidateTag.md`, `…/updateTag.md`, `…/cacheTag.md`, `…/catchError.md`, `02-guides/view-transitions.md`, `02-guides/lazy-loading.md`, `02-guides/testing/`, `02-guides/instrumentation.md`, `01-getting-started/08-caching.md`
- React: react.dev/reference/rsc/server-components; react.dev/reference/react/useSyncExternalStore; react.dev/reference/react/useActionState
- J. Miller: „Islands Architecture“, jasonformat.com/islands-architecture (2020)
- Deloitte Digital / Google: „Milliseconds Make Millions“ (2020)
- web.dev: „Interaction to Next Paint (INP)“, „Optimize LCP“, „Back/forward cache“
- Google Search Central: „Site moves with URL changes“, „Redirects and Google Search“, „Localized versions (hreflang)“
- K. C. Dodds: „Write tests. Not too many. Mostly integration.“ / Testing Trophy
- Playwright (playwright.dev), Vitest (vitest.dev), axe-core (github.com/dequelabs/axe-core), Lighthouse CI (github.com/GoogleChrome/lighthouse-ci), size-limit (github.com/ai/size-limit)
- Recht: DSA Art. 25 (VO (EU) 2022/2065), UGP-Richtlinie 2005/29/EG, PAngV, TTDSG § 25, LG München I 20.01.2022 – 3 O 17493/20; Details in `digital/14`
- Projekt-Befunde: `Marktresearch/digital/13-performance-a11y-engineering.md` (Messungen, B2, B5, F3–F6), `digital/01`, `digital/02`
