# Performance-Audit Live: platzhirsch.studio

**Stand:** 26.10.2026. **Werkzeug:** Lighthouse 12 (npx), Playwright-Chromium 156, headless. Mobil heißt Standard-Mobilprofil (Moto G Power, simuliertes langsames 4G, 4-fache CPU-Drosselung). Desktop heißt `--preset=desktop`. Jede URL wurde einmal gemessen, die Läufe liefen nacheinander, nicht parallel. Rohdaten (JSON) liegen im Scratchpad der Session und gehören nicht zum Repo.

**Hinweis zu INP:** INP ist ein Feldwert und lässt sich im Labor nicht messen. Ersatzweise steht hier **TBT** (Total Blocking Time). Ziel für gutes INP ist TBT unter 200 ms. Diese Daten zeigen nur den Laborzustand. Für echte Felddaten braucht es CrUX bzw. die Search Console (Bericht „Core Web Vitals“).

**Hinweis zum Code-Stand:** Gemessen wurde die Live-Site. Die Datei-Hinweise beziehen sich auf den aktuellen Repo-Stand, und der kann vom Deploy abweichen.

## 1. Messergebnisse Platzhirsch

Scores: Perf = Performance, A11y = Barrierefreiheit, BP = Best Practices, SEO.

### Mobil

| Seite | Perf | A11y | BP | SEO | FCP | **LCP** | **TBT** | **CLS** | Speed Index | Gewicht | Requests |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Startseite `/de` | **72** | 100 | 100 | 100 | 1,7 s | **4,0 s** | 535 ms | 0,000 | 3,4 s | 658 KB | 47 |
| `/de/produkte` | 78 | 100 | 100 | 100 | 1,4 s | **3,9 s** | 384 ms | 0,000 | 2,5 s | 684 KB | 41 |
| Marke Minotti `/de/ueber-uns/marken/minotti` | **72** | 100 | 100 | 100 | 1,4 s | 3,3 s | **803 ms** | 0,000 | 2,3 s | 636 KB | 40 |
| Produkt Minotti Twiggy `/de/produkte/sofas-couches/sofas-twiggy-sofas` | 82 | 95 | 100 | 100 | 1,3 s | 3,5 s | 372 ms | 0,004 | 2,5 s | 696 KB | 52 |
| `/de/kontakt` | 87 | 96 | 96 | 100 | 1,2 s | 3,3 s | 263 ms | 0,000 | 1,9 s | 504 KB | 31 |
| `/de/designermoebel-lindau` | 89 | 96 | 100 | 100 | 1,3 s | 3,2 s | 243 ms | 0,000 | 1,8 s | 537 KB | 31 |

### Desktop

| Seite | Perf | A11y | BP | SEO | FCP | **LCP** | **TBT** | **CLS** | Speed Index | Gewicht | Requests |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Startseite | 99 | 100 | 100 | 100 | 0,4 s | 0,8 s | 29 ms | 0,000 | 0,9 s | 736 KB | 67 |
| `/de/produkte` | 99 | 100 | 100 | 100 | 0,4 s | 0,8 s | 50 ms | 0,000 | 0,8 s | 669 KB | 63 |
| Marke Minotti | 99 | 100 | 100 | 100 | 0,6 s | 0,7 s | 76 ms | 0,000 | 1,1 s | 690 KB | 60 |
| Produkt Minotti Twiggy | 97 | 95 | 100 | 100 | 0,5 s | 1,0 s | 95 ms | 0,000 | 1,0 s | 674 KB | 61 |
| `/de/kontakt` | 94 | 96 | 96 | 100 | 0,6 s | 0,9 s | 154 ms | 0,000 | 1,4 s | 841 KB | 38 |
| `/de/designermoebel-lindau` | 100 | 96 | 100 | 100 | 0,4 s | 0,7 s | 32 ms | 0,000 | 0,9 s | 730 KB | 41 |

### Was die Zahlen zeigen

- **Desktop ist sehr gut** (94 bis 100), **Mobil ist mittelmäßig** (72 bis 89). Keine Mobilseite erreicht LCP unter 2,5 s („gut“).
- **Das Layout ist stabil.** CLS liegt überall bei etwa 0. **SEO steht überall auf 100.** Die Server-Antwortzeit ist schnell (Lighthouse misst 40 bis 140 ms).
- **Bilder und Netz sind nicht der Engpass.** Das zeigen die LCP-Phasen auf Mobil:

  | Seite | TTFB | Ladeverzögerung | Ladezeit | **Render-Verzögerung** |
  |---|---|---|---|---|
  | Startseite | 724 ms | 0 | 739 ms | **2.557 ms** |
  | /de/produkte | 709 ms | **694 ms** (LCP-Bild lazy) | 345 ms | **2.111 ms** |
  | Minotti | 626 ms | 50 ms | 749 ms | **1.914 ms** |
  | Produkt | 617 ms | 0 | 128 ms | **2.792 ms** |
  | Kontakt | 609 ms | 3 ms | 139 ms | **2.575 ms** |
  | Lindau | 616 ms | 0 | 82 ms | **2.463 ms** |

  Das LCP-Bild ist früh geladen. Zwischen Download und Anzeige vergehen trotzdem auf jeder Seite 2 bis 2,8 s. Diese Zeit geht auf den **Hauptthread**: JavaScript parsen, ausführen und hydrieren auf einem gedrosselten Mittelklasse-Handy. Ungedrosselt sieht es anders aus, die beobachtete LCP lag bei 0,8 bis 1,8 s. Langsam wird es also erst auf schwächeren Handys.
- **JavaScript pro Seite:** etwa 195 bis 219 KB übertragen. Davon ist der Chunk `0hzde1snce0w3.js` 229 KB roh bzw. 70 KB gzip und benötigt allein 0,5 bis 1,3 s Skriptzeit auf Mobil. Die Hauptthread-Arbeit insgesamt beträgt 2,2 bis 4,3 s.
- **Schriften pro Seite: 173 KB** (3 woff2-Dateien mit 67, 46 und 35 KB). Das ist so viel wie alle Bilder der Startseite zusammen (188 KB).
- **HTML der Startseite:** 380 KB unkomprimiert bzw. 65 KB gzip. Darin steckt die komplette Übersetzungsdatei `de.json` (55 KB) als RSC-Payload für den Client.
- **bfcache (Zurück-Navigation) ist auf allen Seiten blockiert.** Das HTML wird mit `Cache-Control: private, no-cache, no-store` ausgeliefert, und ein JS-Request kommt ebenfalls mit `no-store`. Das gilt, obwohl `src/app/[locale]/page.js` `revalidate = 3600` setzt. Die Seiten werden also offenbar dynamisch gerendert.

## 2. Wettbewerber (Startseite, mobil)

| Seite | Perf | A11y | BP | SEO | FCP | **LCP** | **TBT** | **CLS** | Speed Index | Gewicht | Requests |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **platzhirsch.studio/de** | **72** | **100** | **100** | **100** | **1,7 s** | **4,0 s** | **535 ms** | **0,000** | **3,4 s** | **658 KB** | **47** |
| hoettges.at | 51 | 86 | 100 | 100 | 3,8 s | 15,7 s | 358 ms | 0,000 | 8,7 s | 2.886 KB | 72 |
| reiter.design (reiter-design.at löst nicht auf; reiter.at gehört einem Wursthersteller) | 45 | 88 | 100 | 100 | 2,3 s | 4,7 s | 540 ms | **0,501** | 3,4 s | 866 KB | 74 |
| fretz.de (→ www.fretz.de/de) | 37 | 100 | 96 | 92 | 1,5 s | 24,2 s | 2.396 ms | 0,024 | 12,1 s | **39.486 KB** | 92 |

**Einordnung:** Platzhirsch ist auf Mobil die schnellste und leichteste der vier Seiten.
- Höttges lädt große JPGs in einem Swiper-Slider (LCP 15,7 s).
- Reiter hat einen starken Layout-Sprung (CLS 0,5, Pop-up/Sale-Banner).
- Fretz überträgt rund 39 MB, darunter mehrere JPGs mit 0,4 bis 0,7 MB.

Der Vorsprung ist real, aber kein Grund, sich auszuruhen. Google bewertet die Core Web Vitals absolut („gut“ heißt LCP ≤ 2,5 s, INP ≤ 200 ms) und nicht im Vergleich zum Wettbewerb.

## 3. Top-10-Optimierungen (nach Wirkung sortiert)

| # | Maßnahme | Befund | Datei-Hinweise im Repo | Erwartete Wirkung |
|---|---|---|---|---|
| 1 | **Seitenrahmen aus dem Client holen.** Navbar und Footer als Server Components rendern, nur die interaktiven Teile (Menü-Toggle, Merklisten-Zähler, Sprachwahl) als kleine Client-Inseln | Der ganze Rahmen ist `'use client'`. Dazu gehört `navbar.js` mit 1.239 Zeilen samt `react-icons`. Der Haupt-Chunk braucht bis 1,3 s Skriptzeit, die Render-Verzögerung liegt bei 2 bis 2,8 s | `src/app/[locale]/LoaderWrapper.js`, `src/app/[locale]/client-layout.js`, `src/components/Navbar/navbar.js`, `src/components/Reusable/Footer.js`, `src/context/CartContext` | Größter Hebel für LCP und TBT auf Mobil, grob −1 s LCP und −200 bis 400 ms TBT (Schätzung) |
| 2 | **Nur benötigte Übersetzungen an den Client geben.** Dem `NextIntlClientProvider` nur die Namespaces der Client-Komponenten übergeben (z. B. `pick(messages, [...])`) und Server-Komponenten mit `getTranslations` arbeiten lassen | Alle 55 KB von `de.json` stecken in jeder Seite im HTML/RSC-Payload (Startseite 380 KB roh) | `src/app/[locale]/layout.js` (Z. ~195–231), `src/app/[locale]/LoaderWrapper.js`, `src/messages/*.json` | Kleineres HTML, weniger Parse-Zeit, schnelleres Hydrieren |
| 3 | **Schriftgewicht senken (173 KB pro Seite)** | Montserrat (latin + latin-ext) und Bodoni Moda mit `opsz`-Achse werden als 3 woff2 geladen | `src/app/[locale]/layout.js` (Z. ~15–35, `next/font`): für Bodoni nur die benötigten Gewichte statt Variable+opsz, `latin-ext` prüfen (DE/FR/IT kommen meist mit `latin` aus), Bodoni mit `preload: false` laden, wenn sie nur in Überschriften steht | −50 bis 100 KB, weniger Bandbreiten-Konkurrenz zum LCP-Bild |
| 4 | **LCP-Bild auf `/de/produkte` nicht lazy laden** | Lighthouse meldet `lcp-lazy-loaded`. Die erste Kategoriekachel („Sofas & Couches“) hat `loading="lazy"`, das kostet 694 ms Ladeverzögerung | `src/components/ShopCatalog/shopCategoryGrid.js` Z. 48: `priority` bzw. `fetchPriority="high"` für die ersten 1 bis 2 Kacheln der ersten Sektion | Etwa −0,5 s LCP auf /de/produkte |
| 5 | **Seiten statisch/ISR ausliefern statt `no-store`.** Prüfen, was das dynamische Rendering auslöst, z. B. `cookies()`/`headers()` aus `detectLocale` oder `fetch(... {cache:"no-store"})` | HTML ist `private, no-store`, damit ist der bfcache aus. Es gibt kein CDN-/Browser-Caching, obwohl `revalidate = 3600` gesetzt ist | `src/i18n/detectLocale.js`, `src/app/[locale]/layout.js` (generateMetadata Z. ~144), `src/lib/api/fetchAllProdukte.js` Z. 74, `src/app/not-found.js` | Sofortige Zurück-Navigation (bfcache), stabilere TTFB, weniger Last auf dem Backoffice |
| 6 | **Rohe CSS-Hintergrundbilder ersetzen** | `/Images/Home/bannerImage.jpg` wird als unoptimiertes 191-KB-JPG per `background-image` geladen. Auf Desktop kommt `/Images/Newsletter/room.jpg` dazu (176 KB, w=1920). Kontakt-Desktop wiegt dadurch 841 KB | `src/components/Kontakt/kontakt.js` Z. 313, `src/app/[locale]/adventsabend/page.js` Z. 139, `src/components/Impressum/impressumbanner.js`: auf `next/image` mit `fill` + `sizes` umstellen (dann AVIF/WebP) | −150 bis 300 KB auf Kontakt und Adventsabend |
| 7 | **Produktgalerie von react-slick auf Embla umstellen** (Embla ist schon eine Abhängigkeit) und Bildgrößen korrigieren | Auf der Produktseite sind 45 bis 78 KB Bild-Einsparung möglich (Twiggy-Bild w=750, 81 KB). Slick erzeugt geklonte, fokussierbare Slides (`aria-hidden-focus`). Dazu kommen die Slick-CSS und jQuery-artiger Code | `src/components/ShopCatalog/productGallery.js`, ebenso `src/components/MarkenItems/markenitems.js`, `src/components/UberUns/austellung.js`, `package.json` (`react-slick`, `slick-carousel`) | Weniger JS und CSS, A11y-Fehler weg, kleinere Bilder |
| 8 | **Legacy-Polyfills einsparen** | 14 KB Polyfills (`Array.prototype.at/flat/flatMap`, `Object.hasOwn`, `Object.fromEntries`, `trimStart/End`) im Haupt-Chunk, obwohl die Ziel-Browser sie nativ können | `package.json` → `browserslist.production` (z. B. auf `chrome >= 93`, `safari >= 15.4`, `ios >= 15.4` anheben). Danach prüfen, ob Next 16 die Polyfills weglässt | −14 KB JS, ca. 150 bis 240 ms laut Lighthouse |
| 9 | **Startseite entschlacken:** DOM-Größe (1.052 Elemente) und Forced Reflow im Haupt-Chunk | `dom-size` und `forced-reflow-insight` schlagen an. Die Startseite hat die höchste Hauptthread-Zeit (4,3 s). `FadeInView` setzt bis zur Hydrierung `opacity:0` (siehe Kommentar in `layout.js` Z. ~223) | `src/app/[locale]/page.js`, `src/components/Home/about.js` und `blog.js` (beide `'use client'`), `src/components/Reusable/FadeInView.js`: durch die vorhandene CSS-Klasse `.reveal` ersetzen (scroll-driven, ohne JS), Sektionen unterhalb des Folds als Server Components | Weniger TBT und eine bessere Annäherung an INP |
| 10 | **Barrierefreiheit (A11y 95–96) auf 100 bringen** | Gold `#d1b250` auf Weiß hat nur 2,05:1 Kontrast (Kontakt), `#d1b250/70` sogar 1,63:1 (Lindau-Zahlen). Auf der Produktseite fallen `heading-order` (h4 ohne h3) und `label-content-name-mismatch` auf (Merkliste-Button: aria-label weicht vom sichtbaren Text ab). Dazu kommt ein verzerrtes `custom-marker.png` | `src/components/Kontakt/kontakt.js` (Z. 263 Marker), `src/components/Landing/landingPage.js` (`text-[#d1b250]/70`), `src/components/ShopCatalog/wishlistHeart.js` bzw. `productActions.js`, `src/messages/de.json` `addToWishlistAria` | A11y 100 überall. Indirekt gut für die Nutzersignale |

### Kleinere Punkte

- **Logo-Preload:** Das Logo-Preload hat ein `imageSrcSet` mit 17 Kandidaten bis 1920w, obwohl das Logo nur 130 bis 150 px breit ist. Abhilfe: feste `width` und `height` statt `fill`/`sizes` (`src/components/Navbar/navbar.js`).
- **Ungenutztes JavaScript:** Pro Seite sind etwa 25 KB des Haupt-Chunks ungenutzt. Das löst sich zum Großteil mit Maßnahme 1.
- **Hero-Animation (`.hero-zoom`, 1.600 ms, `will-change: transform`) auf dem LCP-Bild:** Das ist kein gemessener Engpass. Wenn die Mobil-LCP nach Maßnahme 1 noch hoch ist, testweise ohne Zoom messen (`src/app/globals.css` Z. 72–83, `src/components/Home/Hero.js`).

## 4. Nächste Schritte

1. Maßnahmen 4, 6 und 8 sind kleine, risikoarme Änderungen und gehören in den nächsten Deploy.
2. Maßnahmen 1, 2 und 5 sind strukturell. Sie bringen den größten Effekt auf Mobil und brauchen Tests mit `next build`.
3. Nach dem Deploy die Messung wiederholen, je URL 3 Läufe, Median nehmen. Außerdem Felddaten in der Search Console prüfen.
