# 20 – Gegenprüfung der Design-Bibel

**Rolle:** skeptischer Prüfer (Senior-Engineer, Markenberatung, Recht) · **Stand:** 26.10.2026 · **Prüfgegenstand:** `00-design-bibel.md` (Stand 26.10.2026)
**Methode:** vollständige Lektüre der Bibel. Abgleich mit `package.json`, `next.config.js`, `src/app/[locale]/layout.js`, `client-layout.js`, den Prototyp-CSS-Dateien und der Next-16-Dokumentation in `node_modules/next/dist/docs/`. Alle Kontrastwerte aus §4.1 nachgerechnet (WCAG-2.x-Formel, Node), die Fluid-Formeln aus §5 bei 360 und 1440 px nachgerechnet und die vorgeladenen Schriftdateien in `.next/static/media` gemessen. Rechtliche Aussagen sind eine Einordnung und **keine Rechtsberatung**: Punkte mit Risiko „hoch“ gehen vor dem Livegang an eine Anwältin oder einen Anwalt für Wettbewerbsrecht in AT/DE.

**Gesamturteil:** Die Bibel ist in sich weitgehend schlüssig, rechtlich vorsichtig und technisch machbar. Alle 17 Kontrastwerte stimmen, die Gewichte in §15 ergeben 59 / 295 Punkte. Ich habe **19 klare Fehler direkt korrigiert** (Bibel §17, Marke „GP“ im Text). Die drei schwersten: der Anzahlungs-Claim im Markenkern, die Schrift-Vorladung, die das Budget doppelt reißt, und `'use cache'` ohne die nötige Next-16-Konfiguration. Das größere Risiko liegt nicht in Fehlern, sondern im **Umfang**: Für rund 5 Personen ist die Bibel ohne harte Phasen nicht pflegbar.

---

## 1. Die wichtigsten Erkenntnisse

1. **Der Markenkern enthielt eine unbelegte Zusage.** §1.1 übernahm „mit abgesicherter Anzahlung“ aus Masterkonzept 4.1 als Tatsache, obwohl §11 sie erst nach Vertragsabschluss erlaubt. Das Masterkonzept selbst nennt eine Eigenmittelquote von ca. −91 % und eine mögliche Antragspflicht. Wer in dieser Lage Sicherheit für Anzahlungen bewirbt, ohne dass ein Garantie- oder Versicherungsvertrag besteht, täuscht über einen wesentlichen Umstand (§ 2 öUWG, § 5 dUWG, UGP-RL Art. 6). Das ist ein Haftungsrisiko für die Geschäftsführung und kein Stilfehler. *Korrigiert (G1).* Risiko: **hoch**.
2. **Die Schrift-Vorgabe hat ihr eigenes Budget gerissen.** next/font lädt jede Datei der in `subsets` genannten Subsets vor. Mit `["latin","latin-ext"]` sind es 2 Dateien pro Familie. Heute lädt `layout.js` 4 Dateien vor: Bodoni 46 + 25 KB und Montserrat 68 + 36 KB, zusammen **rund 175 KB** (gemessen). Die Begründung „ç, ë“ trägt nicht, denn beide Zeichen liegen in U+00C0–00FF und damit im Subset latin. Mit nur `latin` bleiben Bodoni (46 KB mit `opsz`) und Instrument Sans ohne `wdth` (geschätzt 30–40 KB) unter 90 KB. *Korrigiert (G4).* Quelle: Next-Doku `03-api-reference/02-components/font.md` (preload, subsets), Messung in `.next/static/media`.
3. **`'use cache'` funktioniert in Next 16 nur mit `cacheComponents: true`.** Das ist in `next.config.js` nicht gesetzt. Das Einschalten macht PPR zum Standard, verlangt die Migration von 26 Dateien mit `export const revalidate/dynamic` und hält besuchte Routen per `<Activity>` versteckt gemountet. Offene `<dialog>`, Menüs und Videos müssen deshalb beim Routenwechsel aktiv schließen. Quelle: `docs/01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md`. *Korrigiert (G10).* Aufwand: 3–5 Entwicklertage, eigener Release vor dem Redesign.
4. **Der Seelicht-Hero widersprach dem eigenen LCP-Ziel.** Wird das Bild pro Anfrage nach der Uhrzeit gewählt (dynamisch, `connection()`), fällt es unter PPR aus dem statischen Shell in den Stream, und das LCP verschiebt sich. Die Lösung ist eine gecachte Hero-Komponente mit `cacheLife` (Revalidierung alle 900 s). Sie ist höchstens 15 min „falsch“ und bleibt bei 0 KB JS. Der Crossfade bei offener Seite braucht dagegen Client-JS und ist deshalb nur „Kann“. *Korrigiert (G8).*
5. **`<ViewTransition>` ist machbar, ohne Experiment-Flag.** Der App Router nutzt den React-Canary-Kanal, `import { ViewTransition } from 'react'` funktioniert ohne Konfiguration. Ohne Browser-Unterstützung läuft die Seite ohne Animation weiter (`docs/01-app/02-guides/view-transitions.md`). Die Morph-Zeiten von 400 und 420 ms liegen unter der Obergrenze von 450 ms. Zu beachten ist `default="none"` plus `share` an benannten Paaren, sonst läuft bei jeder Navigation jedes benannte Element mit. **Kein Änderungsbedarf.**
6. **Motion-Budget: `LazyMotion` allein reicht nicht.** Laut motion.dev („Reduce bundle size“) kostet `m` + `LazyMotion` ca. 4,6 KB, `domAnimation` +15 KB und `domMax` (für Ziehen und Layout) +25 KB. Ein Lightbox-Wisch per `drag` sprengt also das Insel-Budget von 10 KB, wenn die Features nicht asynchron laden. CSS Scroll-Snap und `<dialog>` decken Wischen und Sheet mit 0 KB ab. *Korrigiert (G13).* `lenis` steckt nur in `Preview/buehne/SmoothScroll.js` und lässt sich gefahrlos entfernen.
7. **Performance-Budget: realistisch, aber nur nach dem Umbau der Shell.** React 19 und die Next-Runtime liegen erfahrungsgemäß bei rund 100–115 KB gzip Grundlast (Schätzung, wird im ersten `size-limit`-Lauf gemessen). Damit bleiben auf der Startseite (150 KB) etwa 35–50 KB und im Ratgeber (130 KB) etwa 15–30 KB. Das reicht nur, wenn `ClientLayout` aufgelöst wird (Navbar, CartProvider und CookieComponent als Inseln). Die Wow-Features 1, 3 und 4 kosten zusammen ≤ 9 KB. LCP ≤ 2,0 s im Labor ist mit 120 KB AVIF, `fetchPriority="high"` und ≤ 90 KB Schrift erreichbar. Die harte Grenze von 2,5 s ist sicher. Eine Lücke war die Messung: Eine CI kann keine Feld-p75-Werte prüfen, und bei wenigen Hundert Messungen nach Consent sind Felddaten nur ein Trend. *Korrigiert (G12).*
8. **Lizenzen sind sauber.** Bodoni Moda und Instrument Sans stehen unter SIL OFL 1.1. Eine Wortmarke aus umgewandelten Konturen ist zulässig, denn sie ist ein Bild und keine „Font Software“ (OFL-FAQ, scripts.sil.org/OFL-FAQ_web). Natural Earth ist gemeinfrei. next, motion, embla, lenis, three und zod stehen unter MIT, `@google/model-viewer` unter Apache-2.0, lucide unter ISC. **Lücken:** Routen und Fahrzeiten aus OpenStreetMap verlangen die Namensnennung nach ODbL. Google-Maps-Fahrzeiten dürfen laut den Nutzungsbedingungen der Maps Platform nicht ohne Google-Karte gespeichert und gezeigt werden. `react-icons` bündelt Icon-Sätze mit gemischten Lizenzen, Font Awesome Free etwa steht unter CC BY 4.0. *Korrigiert (G9, G13).*
9. **Recht: drei neue Pflichten seit 2025/26 fehlten.** (a) Für den KI-Concierge unter `labs/concierge` (Anthropic SDK) gilt seit dem **02.08.2026** AI Act Art. 50 Abs. 1: Nutzer müssen wissen, dass sie mit einer KI sprechen. (b) BaFG/BFSG: Die Pflicht greift erst mit Online-Vertragsschluss (Kasse, Gutscheine). Kleinstunternehmen sind bei Dienstleistungen ausgenommen, das Unternehmen muss es prüfen. Eine Barrierefreiheitserklärung fehlte. (c) Herkunft: „Italienisches Wohnen“ als H1 plus eine Küchenlinie aus dem Kosovo ohne Herkunftsangabe ist eine Irreführung über die geografische Herkunft (§ 5 Abs. 1 Nr. 1 dUWG). *Ergänzt (G17).*
10. **Pflegbarkeit ist der eigentliche Engpass.** Die Bibel verlangt unter anderem 2–4 Seelicht-Shootings pro Jahr, ein Bildregister mit 7 Spalten, Alt-Texte in 4 Sprachen, 8 Regionsseiten ohne Textkopie, eine Steinbibliothek mit Charge pro Platte, Rückruf in ≤ 2 h, einen Styleguide mit 7 Zuständen pro Komponente und 5 Signature-Features. Für ein Team von rund 5 Personen, die zugleich beraten, liefern und das Café betreiben, ist das nur mit Automatik (Alt-Texte aus Backoffice-Daten, Lint, Playwright) und strengen Phasen machbar (Abschnitt 2.4).

---

## 2. Konkrete Vorgaben (ergänzend zur Bibel, messbar)

### 2.1 Technik
| Vorgabe | Messbar als |
|---|---|
| Release 0 vor dem Redesign: `cacheComponents: true`, Segment-Configs migriert, browserslist auf Chrome 111 / Safari 16.4 / Firefox 128 | `next build` grün, 0 Warnungen zu `revalidate`/`dynamic`, Playwright-Basislinie unverändert |
| `subsets: ["latin"]` für beide Familien, Montserrat entfernt | ≤ 2 `<link rel="preload" as="font">` im HTML, Summe ≤ 90 KB |
| Seelicht: `'use cache'` + `cacheLife({ stale: 300, revalidate: 900 })`, Zeitfenster per `Intl.DateTimeFormat('de-AT', { timeZone: 'Europe/Vienna' })` | LCP-Element liegt im ersten HTML-Chunk, kein `<template>`-Streaming für das Bild |
| `size-limit` und `@lhci/cli` als devDependencies, Budgets aus §13 als Laborwerte | CI-Job bricht bei +10 % ab |
| `preview/` und `labs/` per Env-Schalter aus Produktion | `curl -I https://…/de/preview/galerie` → 404 in Produktion |
| 1 Karussell (embla), 1 Icon-Satz (lucide), 0 Smooth-Scroll | `npm ls react-slick react-icons lenis` leer |
| Benannte `<ViewTransition>` immer mit `default="none"` + `share` | Code-Review-Checkliste |
| Routenwechsel schließt alle `<dialog>` (wegen `<Activity>`) | Playwright: Menü öffnen → navigieren → zurück → Menü zu |

### 2.2 Marke und Recht
| Vorgabe | Messbar als |
|---|---|
| „Anzahlung abgesichert“ erst nach unterschriebenem Vertrag, der Vertrag ist im Footer verlinkt (Name des Sicherungsgebers) | Claim-Register: jede Zusage mit Beleg und Datum |
| Herkunftsland in `FactList` jedes Produkts | 100 % der Produktseiten, Lint im zod-Schema (`originCountry` Pflicht) |
| Leistungszusagen nur mit Zeitfenster und gemessener Quote (Rückruf, Muster, Angebot in 5 Werktagen) | monatlicher Bericht, Quote ≥ 90 %, sonst wird der Claim entfernt |
| KI-Concierge: Hinweis vor der ersten Eingabe, Knopf „Mit einem Menschen sprechen“, Protokoll-Löschfrist | Sichtprüfung, Datenschutzerklärung nennt Anbieter und Drittland |
| OSM-Nennung an der Dreiländer-Karte | sichtbarer Text „© OpenStreetMap-Mitwirkende“ |
| Barrierefreiheitserklärung ab Shop-Start | Footer-Link vorhanden |
| Markenanmeldung zusätzlich in FL | Anmeldebestätigung vor der Reinzeichnung |

### 2.3 Rechenregeln für die Typo (geprüft)
Formel für jedes Fluid-Token: `Steigung = (max − min) / 1080 px`, `Basis = min − Steigung × 360 px`. Damit ergibt sich: `display-xl` 2rem + 4.44vw (✓), `display-l` 2rem + 2.22vw, `display-m` 1.75rem + 1.11vw, `title` 1.29rem + 0.37vw, `lead` 1.21rem + 0.19vw (in der Bibel korrigiert).

### 2.4 Phasen für ein Team von 5 Personen (Empfehlung)
| Phase | Inhalt | Pflegeaufwand pro Monat |
|---|---|---|
| 1 (Launch) | Gerüst, Tokens, Startseite, Produkt, Termin, Auswahl (F3), Seelicht (F1), Dreiländer-Karte (F4), DE + EN redaktionell, FR/IT aus dem Backoffice | ca. 1 Personentag: 1 Beitrag, Bildregister, Claim-Register |
| 2 (+3–6 Monate) | Material-Spiel (F2) ohne Steinreservierung, Stil-Finder (F5 aus `labs/stilfinder`), Regionsseiten 4 → 8 | +1 Tag |
| 3 (nur mit Beleg) | Steinbibliothek mit Charge und Reservierung (erst wenn Binni die Plattendaten ins Backoffice liefert), 360°, AR | +2 Tage |

Jede Phase hat eine benannte Person als Owner. Ohne Owner wird nichts gebaut.

---

## 3. Ideen, die die Konkurrenz alt aussehen lassen (risikoarm)

1. **Öffentliches Claim-Register („Was wir versprechen und wie oft wir es halten“):** Rückrufquote, Angebotsdauer und Musterversand, monatlich aktualisiert. Das ist genau die Ehrlichkeit, die nach drei regionalen Insolvenzen fehlt, und kein Wettbewerber kann es ohne echte Abläufe kopieren.
2. **„Die Seite ist so schnell wie der Espresso“:** Eine Live-Kennzahl im Footer („Diese Seite lud in 1,4 s“, aus `web-vitals`, nur nach Consent, sonst ausgeblendet). Das ist ein leiser Beweis gegenüber Minotti (18,9 s LCP laut Bericht).
3. **Herkunft als Stärke:** Ein Kapitel „Wo Ihre Küche entsteht“ zeigt die Binni-Manufaktur mit Ort, Menschen und Steinbruch. Aus dem rechtlichen Pflichtpunkt Herkunftsangabe wird eine Geschichte, die italienische Studios nicht erzählen können.
4. **Kontrastsichere Marke als Signal:** Ein „Ruhige Ansicht“-Schalter mit 7:1 und +12,5 % Schrift hat kein Wettbewerber, und für die Zielgruppe 45+ ist er ein echtes Gastgeber-Detail.

---

## 4. Was man auf keinen Fall tun darf

- Zusagen veröffentlichen, die das Unternehmen nicht nachweisen kann: Anzahlungsschutz, „Rückruf in 2 h“ ohne Zeitfenster, Zustellzeiten mit Zoll, „Festpreis inkl. Verzollung“ ohne fertigen Ablauf mit Spediteur.
- Die Binni-Küche oder andere Nicht-Italiener unter „italienisch“ ohne Herkunftsangabe zeigen.
- KI-Antworten ohne Kennzeichnung oder KI-Antworten mit verbindlichen Preisen und Lieferterminen.
- `cacheComponents` im selben Release wie das Redesign einschalten, denn dann lassen sich Fehler nicht mehr zuordnen.
- `domMax`, three oder model-viewer ins Initial-Bundle laden. Schriften mit latin-ext vorladen.
- Fahrzeiten aus Google Maps kopieren. OSM-Daten ohne Nennung nutzen.
- Prototypen oder `labs/` in Produktion ausliefern (Herstellerbilder ohne Freigabe, Fremdbilder).
- Features ohne Owner und Pflegeplan bauen.

---

## 5. Prüf-Checkliste für die drei Prototypen (Ergänzung zu Bibel §15)

Skala je Kriterium: **0** = verstößt · **1** = teilweise · **2** = erfüllt. Diese Liste prüft die Umsetzbarkeit und die Rechtssicherheit, die §15 nur indirekt abdeckt. Maximum 24 Punkte, K.-o. = 0 bei R1 bis R3.

| # | Kriterium | Prüfung | galerie | buehne | dreilaendereck |
|---|---|---|---|---|---|
| T1 | ≤ 2 vorgeladene Schriftdateien, ≤ 90 KB | HTML `preload` zählen | | | |
| T2 | 0 KB Smooth-Scroll, kein `domMax`/three initial | Bundle-Analyzer | | (Lenis: 0) | |
| T3 | LCP-Bild im ersten HTML-Chunk, nicht eingeblendet | View Source, Performance-Panel | | | |
| T4 | Bewegungsgrenzen (Scale ≤ 1,08, Maske ≤ 14 %, H1 im ersten Frame sichtbar) | CSS-Review | (18 %, H1 0 %: 0) | (1,15/1,14: 0) | |
| T5 | Funktioniert ohne JS lesbar | JS aus | | | |
| T6 | Übertragbar in Tokens §4 ohne neue Farben | Hex-Zählung | | | |
| T7 | Pflegbar: Inhalte aus Daten statt hartkodiert | Code-Review | | | |
| T8 | Nur `<dialog>`/`<details>`, kein `popover`-Menü ohne Fokusführung | Tastatur | (popover: 1) | | (details: 2) |
| R1 | **K.-o.:** Keine unbelegte Zusage (Anzahlung, Fristen, „offizieller Händler“) | Textaudit | | | |
| R2 | **K.-o.:** Bildrechte: jedes Bild im Register mit Freigabe | Register | (Fremdbilder: 0) | (Herstellerbilder: prüfen) | |
| R3 | **K.-o.:** 0 Dark Patterns, KI gekennzeichnet | Audit | | | |
| R4 | Herkunft und Lizenzhinweise (OSM, Credits) sichtbar | Sichtprüfung | | | |

Vorbelegte Werte stammen aus dem Code-Befund vom 26.10.2026. Leere Felder sind am laufenden Prototyp zu messen. Ein Prototyp mit 0 bei R2 darf in den Nutzertest nur mit ersetzten oder freigegebenen Bildern.

---

## Quellen
- Next.js 16 lokale Doku: `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` (Browser), `02-guides/view-transitions.md`, `03-api-reference/05-config/01-next-config-js/cacheComponents.md`.
- Tailwind CSS v4 Kompatibilität: tailwindcss.com/docs/compatibility (Safari 16.4, Chrome 111, Firefox 128).
- Motion, Bundle-Größen: motion.dev/docs/react-reduce-bundle-size.
- SIL OFL 1.1 und FAQ: openfontlicense.org.
- ODbL / OSM-Namensnennung: osmfoundation.org/wiki/Licence/Attribution_Guidelines.
- Verordnung (EU) 2024/1689 (AI Act) Art. 50, Art. 113 (Geltung ab 02.08.2026).
- Richtlinie (EU) 2019/882 (EAA), BaFG (AT), BFSG (DE), Kleinstunternehmen nach Empfehlung 2003/361/EG.
- UWG AT § 2, UWG DE § 5 Abs. 1 Nr. 1, UGP-RL 2005/29/EG Art. 6 und Anh. I; PAngV § 17, VKrG § 5.
- LG München I, 20.01.2022, 3 O 17493/20 (Google Fonts), wie in der Bibel zitiert.
- Masterkonzept `23-masterkonzept.md` (Eigenmittelquote, Adresse R8, Positionierung 4.1).
