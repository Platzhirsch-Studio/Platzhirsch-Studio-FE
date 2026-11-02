# Feature: Besucher-Einblicke (Heatmaps, Pfade, Frustsignale) – Konzept

**Stand:** 29.10.2026 · Konzept (Analytics-Architektur, UX-Forschung, Datenschutz AT/DE/CH) · Branch `feature/neuauftritt` · Status: **noch nicht gebaut**

Auftrag des Inhabers: „Eine Heatmap, die ich in Frappe in einem Doctype sehen kann – wer sich wohin bewegt usw., damit du in Zukunft besser verstehst, wie Nutzer sich auf der Seite verhalten.“

> **Nachbesserung 29.10.2026 (QA Recht Note 3, QA Technik 7,5/10) – gilt vor dem Rest dieses Konzepts:**
> - **Eigene Einwilligung:** Dienst „Besucher-Einblicke (eigene Heatmap, kein Drittanbieter)“ im Register `src/lib/legal/services.js` (Schlüssel `einblicke`, Kategorie Statistik, getrennt von Google Analytics wählbar). Das Tor fragt nur `einblickeConsentOf` (`consent.einblicke === true`); GA-Einwilligung allein genügt nicht, alte Cookies ohne den Schlüssel auch nicht. Banner-Texte in 4 Sprachen unter `Cookies.einblicke` (nicht in den Client-Messages; das Banner lädt `src/lib/einblicke/consentCopy.js` nur bei eingeschaltetem Schalter). Ohne `NEXT_PUBLIC_EINBLICKE=1` bleiben Banner und Dialog unverändert. Der Server prüft die Einwilligung im mitgesendeten Cookie zusätzlich.
> - **Routen:** `/ideenboard/[shareId]`, `/wunschliste/[id]` und `/termin/testraum` sind ausgeschlossen. Unbekannte/404-URLs werden `/<sprache>/(404)`, dynamische Seiten mit < 5 Sitzungen am Tag laufen unter ihrer Vorlage. Ein Unit-Test prüft jeden Seitenordner gegen `routes.js` / `EXCLUDED`.
> - **Dünne Heatmaps** (< 5 Besuche) gehen nicht nach Frappe und nicht ins dauerhafte Tagesaggregat, sondern höchstens 14 Tage in `.data/einblicke/pool.json`; ab 5 Besuchen werden sie zusammengefasst gesendet. Frappe verwirft Heatmaps < k zusätzlich. Aufbewahrung in Frappe: Voreinstellung **395 Tage** (13 Monate).
> - **14-Tage-Grenze ohne Cron:** `appendRaw` löscht beim ersten Satz eines Tages Rohdaten und Pool > 14 Tage; der Tagesabschluss löscht zuerst. Cron 03:30 über `tools/einblicke/cron.sh`, eingerichtet von `scripts/deploy.sh` (`ensure_einblicke`, inkl. `tagesabschluss.mjs --pruefen`); Warnung, wenn das Secret fehlt.
> - **Abschluss eines Tages ohne Rohdaten** wird übersprungen (kein Überschreiben, kein leeres Paket). Frappe lehnt ein komplett leeres Paket mit `ersetzen=1` ab (nur mit `erzwingen=1`).
> - **Empfang:** `requireOrigin` (ohne Origin nur mit `Sec-Fetch-Site: same-origin`), Limit 12 Pakete je sid und Minute, Rohdatei höchstens 50 MB je Tag.
> - DSE-Vorschlag: `Marktresearch/digital/features/einblicke-dse-vorschlag.md`.

Kurz gesagt: Ein eigener, sehr kleiner Messcode auf der Website. Er läuft nur mit eigener Einwilligung („Besucher-Einblicke“, Kategorie Statistik) und wird nicht geladen, wenn Do-Not-Track oder Global Privacy Control gesetzt ist. Er schickt gebündelte Ereignisse an den eigenen Server (`/api/einblicke`). Der Server fasst sie einmal am Tag zu **anonymen Tagesaggregaten** zusammen und schiebt diese per REST in eine eigene Frappe-App (`platzhirsch_einblicke`). Dort zeigen Doctypes, eine Seite „Heatmap“ mit Overlay auf einem Seiten-Screenshot und ein Workspace die Ergebnisse. Es gibt keine Drittanbieter, keine Sitzungsaufzeichnung und keine Eingabeinhalte.

---

## 1. Ausgangslage im Code (gelesen 29.10.2026)

| Baustein | Was er heute tut | Nutzung für Einblicke |
|---|---|---|
| `src/lib/attribution.js` | `readConsent(cookie)`, `statisticsConsentOf(consent)` (`googleAnalytics` oder `statistics` = true), Ereignis `ph-consent-change`, `channelOf(touch)` (Kanalregel 11 F1), Touch des Besuchs im Speicher (ohne Ads-Einwilligung ohne Klick-IDs) | **Einzige Einwilligungsquelle.** Herkunft = `channelOf(getAttribution().current)`, also nur das Kanal-Label (z. B. „Organisch“, „Google Ads“, „Direkt“) und nie Klick-IDs oder Referrer-Host |
| `src/lib/analytics.js` | `trackEvent` → gtag, `trackLead(form)`, `trackWishlist`, `listenForContactClicks` (tel/mailto/WhatsApp/`data-booking-provider`) | Ziele (Anfrage, Merkliste, Termin, Kontaktklick) werden **an derselben Stelle** zusätzlich an Einblicke gemeldet (eine Zeile in `trackEvent`) |
| `src/components/Cookies/cookiecomponent.js` | Banner, schreibt Cookie `cookieConsent`, feuert `ph-consent-change`; Kategorie `statistics` ↔ Dienst `googleAnalytics` | Wird nicht geändert. Einblicke hört nur zu |
| `src/lib/legal/services.js` | Dienste-Register (Banner, DSE-Vorschau, Anwaltsliste) | Neuer Eintrag `einblicke` mit `status: "labs"` und `banner: null`, bis die Kanzlei freigibt (siehe §8) |
| `src/instrumentation-client.js` | `captureAttribution(window)` vor der Hydration | Hier startet der Lader (≈ 300 B): Er prüft die Einwilligung und DNT/GPC und lädt den Sammler erst im Leerlauf nach |
| `src/context/WebVitals.js` | LCP/INP/CLS → GA4 (nur mit Statistik) | Referenz für die Messung vorher/nachher (§9) |
| `src/app/api/csp-report/route.js` | Muster für Beacon-Empfänger: 16 KB-Grenze, Rate-Limit, 204, keine IP und kein UA | Vorlage für `/api/einblicke` |
| `tools/qa/shoot.mjs` + `shoot-lib.mjs` | Screenshots je Gerät (iPhone 15 Pro, Pixel 7, iPad Pro 11, Desktop 1440 mit Vollseite) | Screenshots für das Overlay; ein Wrapper erzeugt zusätzlich Elementboxen (§6.3) |
| `.data/` (gitignored) | Lokale Ablage, z. B. `.data/ezarri/outbox` | `.data/einblicke/` für Rohdaten und Aggregate |

Heute gibt es keine `data-*`-Messattribute. 181 von 207 `<section>` tragen bereits `id` oder `aria-labelledby`, das ist eine gute Grundlage für stabile Selektoren.

---

## 2. Messplan

### 2.1 Grundregeln für alle Messungen

- **Start nur, wenn alles zutrifft:** `statisticsConsentOf(readConsent(document.cookie))`, *nicht* `navigator.doNotTrack === "1"` / `window.doNotTrack === "1"`, *nicht* `navigator.globalPrivacyControl === true`, Route nicht ausgeschlossen, Schalter `NEXT_PUBLIC_EINBLICKE=1`.
- **Einwilligung widerrufen** (`ph-consent-change` ohne Statistik): Der Sammler stoppt sofort und verwirft die Warteschlange. `sessionStorage["ph_eb"]` wird gelöscht. Danach wird nichts mehr gesendet.
- **Ausgeschlossene Routen** (nichts erfasst): `/[locale]/portal/**`, `/upload/**`, `/zahlung/**`, `/preview/**`, `/labs/**/postausgang/**`, alle Fehlerseiten mit Query. Elemente mit `data-eb-ignore` werden mitsamt ihrem Teilbaum nie erfasst, z. B. Concierge-Chatverlauf und Merklisten-Inhalte.
- **Sitzung:** `crypto.randomUUID()` in `sessionStorage["ph_eb"] = { id, t }`. Eine neue ID gibt es nach 30 min ohne Ereignis, bei neuem Tab (sessionStorage) und nach Widerruf. Es gibt kein Cookie und kein localStorage, also keine Wiedererkennung über Besuche hinweg.
- **Gerätegruppe** wird beim Seitenaufruf aus der Viewport-Breite bestimmt: `< 768` Handy, `768–1199` Tablet, `≥ 1200` Desktop. Es wird **kein User-Agent gespeichert**. Der Server nutzt den UA nur flüchtig, um Bots zu verwerfen.
- **Seite** = Pfadname **ohne Query und Fragment**, dazu die **Vorlage** (z. B. `/de/produkte/[category]/[product]`). So lassen sich 2 000 Produktseiten gemeinsam auswerten. Die Vorlage wird serverseitig über eine Routentabelle (`src/lib/einblicke/routes.js`) bestimmt.
- **Nie erfasst:** Tastaturereignisse, `input`/`change`-Werte, Formularinhalte, Text von Elementen, Auswahl/Zwischenablage, DOM-Schnappschüsse, Videos/Replays, IP, Fingerprinting-Merkmale (Canvas, Fonts, Bildschirm, Zeitzone).

### 2.2 Heatmaps (je Seite × Gerätegruppe × Tag)

| Messgröße | Erfassung im Browser | Auflösung / Abtastung |
|---|---|---|
| **Klicks/Taps** | `pointerdown` (passiv, capture) auf `document`; das Ziel wird über den **stabilen Selektor** (§2.6) bestimmt | (a) **relativ zum Element:** `ex, ey` ∈ 0…1000 (Promille der Box); (b) **relativ zur Seite:** Spalte = `clientX / innerWidth` in 40 Spalten, Zeile = `pageY` in 40-px-Bändern; dazu `vw`, Dokumenthöhe `dh`; max. 100 je Seitenaufruf |
| **Scrolltiefe** | max. `(scrollY + innerHeight) / scrollHeight` je Seitenaufruf (passiver `scroll`-Listener speichert nur eine Zahl) | 20 Stufen à 5 %; gesendet einmal bei `pagehide` |
| **Mausbewegung** (nur Desktop, `pointer: fine`) | `pointermove` speichert nur die letzte Position; ein 250-ms-Takt liest sie (nur bei sichtbarem Tab und nur nach Bewegung) | Raster 40 Spalten × 40-px-Bänder, Zählung im Browser je Zelle, max. 400 Proben je Aufruf, gesendet als `[[spalte, band, n]]` |
| **Aufmerksamkeit** | `IntersectionObserver` (threshold 0.5) auf alle Abschnitte (`[data-eb]`, `main section[id]`, `main section[aria-labelledby]`, `header`, `footer`). Die Zeit läuft nur bei `document.visibilityState === "visible"` | ms je Abschnitt (gedeckelt 10 min), 1× bei `pagehide` |

Auswertung: Klick-Raster (Seitenkoordinaten) als Übersicht; **Element-Klicks** für das genaue Overlay (sie überleben Layoutänderungen, weil die Elementbox aus dem Screenshot-Manifest kommt, §6.3); Scroll-Histogramm („x % sehen den Abschnitt y“); Aufmerksamkeit als Median-ms und Sichtanteil je Abschnitt.

### 2.3 Pfade

- **Einstieg:** erster Seitenaufruf der Sitzung, mit `herkunft = channelOf(getAttribution().current)` (Label aus `CHANNELS`; Klick-IDs und Referrer-Host werden nie übertragen).
- **Seitenfolge:** Vorlagen in Reihenfolge, gekappt auf 8 Schritte (danach „…“). SPA-Navigation wird im 250-ms-Takt über `location.pathname` erkannt (die Navigation-API wird genutzt, wo vorhanden); es wird kein History-Patching gebraucht.
- **Ziele** (Typen fest): `termin` (`book_appointment`, Online-Termin bestätigt), `anfrage` (`generate_lead`, alle Formulare mit `form`), `planer` (Übergabe/Abschluss eines Planers), `merkliste` (`add_to_wishlist`), `kontakt` (tel/mailto/WhatsApp aus `listenForContactClicks`). Die Meldung kommt aus `trackEvent` in `analytics.js`. Das sind dieselben Ereignisse wie in GA4, dadurch ist der Abgleich möglich.
- **Ausstieg:** letzte Vorlage der Sitzung ohne Ziel, wird beim Tagesabschluss bestimmt (Sitzung 30 min still).

### 2.4 Frustsignale

| Signal | Regel (im Browser) | Gespeichert |
|---|---|---|
| **Rage-Klick** | ≥ 3 Klicks in 700 ms im Umkreis von 30 px | Selektor + Anzahl |
| **Toter Klick** | Klick auf ein Element, das nicht interaktiv ist (`a, button, input, select, textarea, label, summary, [role=button\|link\|tab\|checkbox], [onclick], [tabindex]`). Gezählt wird er nur, wenn 1 s lang **keine** DOM-Mutation im Umkreis (ein kurzer `MutationObserver` am Elternabschnitt), keine Navigation und kein Fokuswechsel folgt. Typische Treffer: Produktbilder, Karten, Überschriften | Selektor + Element-Position |
| **Formularabbruch je Feld** | `focusin` auf Feldern eines `<form data-eb-form="kontakt">` (Fallback `form[name]` oder `form[id]`) speichert **nur den Feldnamen** (`name`-Attribut) und die Reihenfolge. `invalid` speichert den Feldnamen als Validierungsfehler. Erfolgreiches Absenden ist **nicht** das `submit`-Event, sondern das Ziel `anfrage`. Bei `pagehide` oder Wegnavigation ohne Erfolg: `abbruch { form, felder_berührt[], letztes_feld }` | Nur Feldnamen, **nie Werte**; `type=password/hidden` und `data-eb-ignore` werden ausgelassen |
| **Fehler** | `window.error` und `unhandledrejection`: Fehlertyp (`TypeError` …), Dateiname des Chunks ohne Query, Zeile. **Keine Meldungstexte**, weil sie Nutzerdaten enthalten können. Dazu Formular-Serverfehler (HTTP-Status) über `einblicke.event("form_error", { form, status })` | Typ + Quelle + Zähler |

### 2.5 Planer-Nutzung

Kleine Melde-API `einblicke(name, data)` aus `src/lib/einblicke/event.js` (≈ 200 B, kein Import des Sammlers, Warteschlange auf `window.__phEb`). Ereignisse (feste Liste, damit nichts Beliebiges hineinrutscht):

| Planer | Ereignisse |
|---|---|
| Küchenplaner (`/kuechenplaner`) | `planer_start`, `planer_schritt {schritt: raum\|form\|fronten\|geraete\|vergleich}`, `planer_variante`, `planer_uebergabe` (Handoff an Anfrage), `planer_abbruch` (automatisch bei pagehide nach Start ohne Übergabe) |
| Sofaplaner (`/sofaplaner`) | dieselben, Schritte `modell\|module\|bezug\|ansicht` |
| Ezarri (Konfigurator/Rechner) | dieselben, Schritte `kollektion\|farbe\|flaeche\|rechner` |
| Stil-Finder | `planer_start`, `planer_schritt {schritt: 1…7}`, `planer_ergebnis {profil}` (eins der 5 festen Profile), `planer_uebergabe` (Termin/Moodboard) |

Erfasst werden nur Schrittnamen aus festen Listen, **keine Maße, Grundrisse, Freitexte oder Uploads**.

### 2.6 Stabile Selektoren

Die Reihenfolge, der erste Treffer gilt:
1. Nächstes `[data-eb="<schlüssel>"]` (gezielt gesetzt, z. B. `hero`, `cta-termin`, `marken-raster`, `produkt-galerie`, `filter`). Schlüssel sind sprachneutral.
2. Sonst: Landmarke (`header`, `nav`, `main`, `aside`, `footer`) › Abschnitt `section#id` bzw. `section[aria-labelledby=id]` › Element-Rolle (`a`, `button`, `img`, `h2` …) mit Index innerhalb des Abschnitts, z. B. `main>#marken>a:3`.
3. Nie: Textinhalt, Klassen (Tailwind ändert sich), `href` mit Query.
Die Selektorlänge ist auf 80 Zeichen begrenzt. Das Website-Team setzt in Runde 1 `data-eb` auf etwa 15 Schlüsselbereiche: Startseite, Kontakt, Beratung, Produktliste, Produkt, Marke, Planer-Einstiege.

---

## 3. Transport und Leistung

- **Lader** in `instrumentation-client.js` (≈ 300 B): prüft Einwilligung, DNT, GPC und Route, dann `requestIdleCallback(() => import("./lib/einblicke/client.js"), { timeout: 5000 })` (Fallback `setTimeout` 3 s nach `load`). Ohne Einwilligung wird der Sammler **nicht einmal geladen**. Erteilt jemand die Einwilligung später, lädt `ph-consent-change` ihn nach.
- **Sammler** `client.js`: **< 4 KB gzip** (der Unit-Test misst die Größe mit `zlib.gzipSync` und bricht über 4096 B ab). Er hat keine Abhängigkeiten außer `attribution.js` (< 1 KB).
- **INP-Schutz:** Handler sind `passive`. Im Klick-Handler werden nur `clientX/Y`, `pageY`, `target` und `performance.now()` gelesen. Selektor, `getBoundingClientRect` und die Rage-/Dead-Auswertung laufen in `requestIdleCallback` bzw. `scheduler.yield()`. Mausbewegungen werden nicht pro Event verarbeitet, sondern im 250-ms-Takt.
- **Bündeln:** In der Warteschlange im Speicher wird gesendet, wenn eine der Bedingungen eintritt: `visibilitychange → hidden`, `pagehide`, 30 Ereignisse oder 20 s. Der Versand läuft über `navigator.sendBeacon("/api/einblicke", new Blob([json], { type: "text/plain" }))` (kein CORS-Preflight). Ein Paket ist ≤ 16 KB; ist es größer, wird es geteilt. Fehlt `sendBeacon`, kommt `fetch(…, { keepalive: true })` zum Einsatz.
- **Format** (kompakt, Version `v:1`):
  ```json
  { "v":1, "sid":"…uuid…", "seq":7, "pv":"p3",
    "e":[ ["pv",{ "p":"/de/kontakt","dc":"m","vw":390,"vh":844,"dh":3120,"ch":"Organisch","prev":"/de" }],
          ["c",{ "s":"main>#formular>button:1","ex":512,"ey":430,"col":21,"y":2440,"r":0,"d":0 }],
          ["f",{ "f":"kontakt","k":"focus","n":"email" }],
          ["g",{ "t":"anfrage","f":"kontakt" }],
          ["sc",{ "max":85 }], ["a",[["#formular",14200],["header",900]]],
          ["m",[[20,61,4],[21,61,2]]], ["pl",{ "n":"kuechenplaner","a":"schritt","s":"fronten" }],
          ["err",{ "t":"TypeError","src":"app-page.js","l":1 }] ] }
  ```
  Zeitstempel bildet der Server auf die Minute gerundet. Der Client sendet nur `seq`, also keine Uhrzeit des Geräts.

---

## 4. Server: `/api/einblicke` → Tagesaggregat

### 4.1 Empfang (`POST /api/einblicke`)
- Antwort ist **immer 204**, auch bei Müll, wie bei `csp-report`. Die Größe ist auf 16 KB begrenzt (Header-Prüfung und Stream-Abbruch). Das Rate-Limit liegt bei 120 Paketen pro Minute je Prozess **und** 300 Paketen je `sid` und Tag. Ein IP-basiertes Rate-Limit gibt es nicht.
- Verworfen werden: Header `DNT: 1` oder `Sec-GPC: 1`, Bot-UA (Regex, UA wird danach verworfen), fremder `Origin`, ausgeschlossene Route, unbekannte Ereignistypen oder Felder (strenge Prüfung in `schema.js`: Zahlen begrenzt, Strings auf erlaubte Zeichen/Längen, Pfad ohne Query).
- **Nicht gespeichert:** IP, User-Agent, Referrer, Cookies, Header. Die Route liest `request.headers` nur für DNT, GPC, Origin und den Bot-Test. Das ist in `next.config.js`/Logging zu beachten: keine Request-Logs mit IP für diese Route.
- Speichern: Anhängen an `.data/einblicke/roh/YYYY-MM-DD.ndjson` (Server-Datum Europe/Vienna) mit `{ sid, seq, ts_min, e }`. Das läuft über `after()` aus `next/server`, damit die Antwort nicht wartet (Docs: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md`).

### 4.2 Tagesabschluss (`aggregate.js`, rein und testbar)
Auslöser: `POST /api/einblicke/tagesabschluss` mit `Authorization: Bearer $EINBLICKE_CRON_SECRET` (Cron des Hosters, 03:30), zusätzlich lokal `node tools/einblicke/tagesabschluss.mjs [datum]`. Er bearbeitet immer **den Vortag und alle noch offenen Tage** und ist idempotent.

1. Rohereignisse des Tages je `sid` gruppieren → Sitzungen (30-min-Regel, Seitenaufrufe, Ziele).
2. Aggregieren je **Seite × Gerät**: Klick-Raster, Element-Klicks (Top 200 Selektoren × 20×20-Punktraster), Bewegungsraster, Scroll-Histogramm, Aufmerksamkeit (Median, p75, Sichtanteil), Besuche (Sitzungen), Seitenaufrufe.
3. Pfade je **Gerät × Herkunft** (plus „Alle“): Sankey-Knoten (Schritt-Index × Vorlage), Kanten, Top-50-Pfade, Einstiege, Ausstiege, Ziele, Ziel-Quote.
4. Signale je Seite × Gerät × Typ × Ziel (Selektor bzw. `form:feld`): Anzahl, betroffene Sitzungen; Formular-Trichter je Feld (berührt → letztes Feld beim Abbruch).
5. Planer je Planer × Gerät: Starts, Trichter je Schritt, Übergaben, Abbrüche, Median-Dauer.
6. **k-Anonymität:** Pfade, Einstiege/Ausstiege und Signale mit **< 5 Sitzungen** werden zu „(selten)“ zusammengefasst. Heatmap-Tage mit < 5 Besuchen werden zwar gespeichert, aber mit `duenn = 1` markiert (die Frappe-Seite summiert Zeiträume). Eine `sid` verlässt den Server nie.
7. Schreiben nach `.data/einblicke/tag/YYYY-MM-DD.json` (Aggregate werden dauerhaft aufbewahrt).
8. **Rohdaten löschen**, wenn sie älter als 14 Tage sind (`EINBLICKE_ROH_TAGE`, Höchstwert 14 im Code erzwungen).
9. Push nach Frappe (§4.3); der Erfolg wird in `.data/einblicke/tag/YYYY-MM-DD.gesendet` vermerkt.

### 4.3 Übertragung nach Frappe
- Schalter: `EINBLICKE_FRAPPE_URL`, `EINBLICKE_FRAPPE_KEY`, `EINBLICKE_FRAPPE_SECRET` (nur serverseitig, nie `NEXT_PUBLIC_`). Fehlt einer davon, bleibt alles **nur lokal** in `.data/einblicke/`.
- **Schutz vor der Produktion:** Zeigt die URL auf `backoffice.platzhirsch.studio`, sendet der Code nur mit `NODE_ENV=production` **und** `EINBLICKE_FRAPPE_LIVE=1`. Im Dev und in Tests wirft er einen Fehler, bevor eine Verbindung entsteht (Unit-Test).
- Aufruf: `POST {URL}/api/method/platzhirsch_einblicke.api.tag_speichern` mit `Authorization: token KEY:SECRET` und Body `{ datum, schema: 1, seiten:[…], heatmaps:[…], pfade:[…], signale:[…], planer:[…] }`. Bei mehr als 1 MB wird in Teile je Doctype aufgeteilt. Die Frappe-Methode macht einen **Upsert über einen deterministischen Namen**, ein erneutes Senden überschreibt also.
- Der API-Benutzer in Frappe hat nur die Rolle „Einblicke Schreiber“ und darf ausschließlich diese Methode aufrufen.

---

## 5. Datenmodell

### 5.1 Rohereignis (nur Website, ≤ 14 Tage)
`{ sid (uuid, pseudonym), seq, ts_min (ISO, Minute), typ (pv|c|m|sc|a|f|g|pl|err), daten (siehe §3) }`. Seite und Gerät hängen am vorangehenden `pv`.

### 5.2 Tagesaggregat → Frappe-Doctypes (Modul „Einblicke“)

**Web Seite** (Name = Route, z. B. `/de/kontakt`)
| Feld | Typ | Inhalt |
|---|---|---|
| route | Data, unique | Pfad ohne Query |
| vorlage | Data | `/de/produkte/[category]/[product]` |
| sprache | Select de/en/fr/it | |
| titel | Data | Seitentitel (aus Screenshot-Manifest) |
| screenshot_handy / _tablet / _desktop | Attach Image | Vollseiten-Screenshot je Referenzbreite 390 / 834 / 1440 |
| manifest_handy / _tablet / _desktop | Code (JSON) | `{ breite, hoehe, erstellt, elemente: { selektor: [x,y,w,h] } }` |
| screenshot_datum | Date | |
| aktiv | Check | |

**Web Heatmap Tag** (Name = `{route}|{gerät}|{datum}`)
| Feld | Typ | Inhalt |
|---|---|---|
| seite | Link Web Seite | |
| vorlage | Data | für Auswertung über Vorlagen |
| geraet | Select Handy/Tablet/Desktop | |
| datum | Date | |
| besuche / seitenaufrufe | Int | |
| duenn | Check | < 5 Besuche |
| klick_raster | JSON | `{ spalten:40, bandPx:40, zellen:[[s,b,n]] }` |
| element_klicks | JSON | `[{ sel, n, pkt:[[x20,y20,n]] }]` (20×20 im Element) |
| bewegung_raster | JSON | wie klick_raster, nur Desktop |
| scroll_histogramm | JSON | 20 Werte: Anteil der Aufrufe, die ≥ k·5 % erreichen |
| aufmerksamkeit | JSON | `[{ sel, median_ms, p75_ms, sichtanteil }]` |
| viewport_breite_median / dokumenthoehe_median | Int | Skalierung des Overlays |
| schema_version | Int | 1 |

**Web Pfad Tag** (Name = `{datum}|{gerät}|{herkunft}`)
| Feld | Typ | Inhalt |
|---|---|---|
| datum | Date | |
| geraet | Select Alle/Handy/Tablet/Desktop | |
| herkunft | Select Alle + `CHANNELS`-Labels | |
| sitzungen | Int | |
| sankey | JSON | `{ knoten:[{id:"0:/de", schritt:0, vorlage}], kanten:[{von, nach, n}] }`, Kanten < 5 → „(selten)“ |
| top_pfade | JSON | `[{ pfad:["/de","/de/kuechen-vorarlberg","ziel:termin"], n }]` |
| einstiege / ausstiege | JSON | `[{ vorlage, n }]` |
| ziele | JSON | `{ termin, anfrage, planer, merkliste, kontakt }` |
| ziel_quote | Percent | Sitzungen mit Ziel / Sitzungen |

**Web Signal** (aggregiert, keine Einzelereignisse; Name = `{datum}|{route}|{gerät}|{typ}|{ziel}`)
| Feld | Typ | Inhalt |
|---|---|---|
| datum, seite, geraet | Date / Link / Select | |
| typ | Select Rage-Klick/Toter Klick/Formularabbruch/Validierungsfehler/Fehler/Formular-Serverfehler | |
| ziel | Data | Selektor, `form:feld` oder `TypeError@chunk:zeile` |
| anzahl / sitzungen | Int | |
| details | JSON | z. B. Abbruch-Trichter `{ felder:[{n:"email", beruehrt:40, letztes:12}] }`, Element-Punkte |
| status | Select Neu/In Arbeit/Erledigt/Ignoriert | Arbeitsliste fürs Team (bleibt beim Upsert erhalten) |

**Web Planer Tag** (Name = `{datum}|{planer}|{gerät}`): planer (Select Küche/Sofa/Ezarri/Stil-Finder), geraet, datum, starts, schritte (JSON-Trichter), ergebnisse (JSON, Stil-Finder-Profile), uebergaben, abbrueche, median_dauer_s.

**Einblicke Einstellungen** (Single): k_schwelle (5), sichtbar_ab_besuchen, Hinweistext. Hier stehen keine Schlüssel, denn die liegen beim API-Benutzer.

### 5.3 Frappe-Page „Heatmap“ (`/app/heatmap`)
- Filter: Seite (Link, mit Suche), Vorlage (alternativ), Gerät, Zeitraum (7/30/90 Tage, frei), Ebene: **Klicks · Bewegung · Scrolltiefe · Aufmerksamkeit · Signale**.
- Daten: `platzhirsch_einblicke.api.heatmap(seite|vorlage, geraet, von, bis)` summiert die Tagesdokumente serverseitig und liefert das Manifest und die Screenshot-URL.
- Darstellung: Screenshot als `<img>`, darüber ein `<canvas>` mit eigener Radial-Gradient-Heatmap (kein CDN, ≈ 80 Zeilen JS). Element-Klicks werden über die Manifest-Box positioniert, das ist exakt. Ohne Manifest-Treffer wird auf das Seitenraster zurückgegriffen. Scrolltiefe erscheint als Farbbänder mit Linien bei 75/50/25 %. Aufmerksamkeit ist eine Abschnittsfärbung mit Median-Sekunden. Signale sind Pins mit Anzahl; ein Klick öffnet das Web-Signal-Dokument.
- Seitenleiste: Top-Elemente nach Klicks, „Abschnitte, die kaum jemand erreicht“, Hinweis „Screenshot älter als die Daten / Layout geändert“, wenn mehr als 20 % der Klick-Selektoren nicht im Manifest stehen.
- Rollen: „Einblicke Leser“ (Inhaber, Team), System Manager.

### 5.4 Workspace „Einblicke“
Number Cards (Besuche gestern, Ziel-Quote 7 T., Rage-Klicks 7 T., Formularabbrüche 7 T., Planer-Übergaben 7 T.), Dashboard Charts (Besuche je Gerät, Ziele je Herkunft, Planer-Trichter), Shortcuts (Heatmap, Web Seite, Web Signal „Neu“, Web Pfad Tag), Script Reports „Frust-Hitliste“ (Signale nach Sitzungen, 30 T.) und „Pfade zu Zielen“ (Top-Pfade mit Ziel). Ein „Pfad-Sankey“ wird als zweite Ansicht der Page gezeichnet (SVG, eigener Code).

---

## 6. Screenshots für das Overlay

1. `node tools/einblicke/screenshots.mjs <out-dir> <url…>` (neuer Wrapper; er nutzt `shoot-lib.mjs` und dieselben Playwright-Geräte wie `tools/qa/shoot.mjs`, `shoot.mjs` selbst bleibt unverändert). Er macht **Vollseiten**-Screenshots in den Referenzbreiten 390 (iPhone 15 Pro), 834 (iPad Pro 11) und 1440 (Desktop). Davor setzt er das Consent-Cookie „nur notwendig“ (kein Banner im Bild) und scrollt einmal durch, damit Lazy-Bilder laden. `PW_WORKERS=1`.
2. Pro Bild schreibt er ein **Manifest** (`…--handy.json`) mit Titel, Höhe und den Boxen aller `[data-eb]`, Landmarken und Abschnitte sowie aller interaktiven Elemente mit dem **gleichen Selektor-Algorithmus** wie der Sammler (`selector.js` wird in die Seite injiziert).
3. Hochladen: manuell als Attach in „Web Seite“ (Bild + Manifest-JSON ins Code-Feld) oder, nur mit gesetzten `EINBLICKE_FRAPPE_*`, per `--hochladen` über `upload_file` und `tag_speichern`. Der Produktionsschutz aus §4.3 gilt auch hier.
4. Empfohlen: neue Screenshots nach jedem Release, mindestens für die 30 meistbesuchten Vorlagen. Die Liste kommt aus dem letzten Aggregat (`--top 30`).

---

## 7. Damit Claude künftig versteht, wie Nutzer sich verhalten
`node tools/einblicke/bericht.mjs [--tage 28]` liest `.data/einblicke/tag/*.json` (oder, mit Lese-Schlüssel, die Frappe-Doctypes per GET) und schreibt `Marktresearch/digital/einblicke/bericht-YYYY-KW.md`. Der Bericht enthält Top-Pfade zu Zielen, Abschnitte mit Scroll-Abbruch, Rage-/Dead-Klick-Hitliste, Formularfelder mit Abbruch, Planer-Trichter sowie Ziel-Quote je Herkunft und Gerät. Er enthält nur Aggregate und kann als Kontext für künftige Aufträge dienen.

---

## 8. Datenschutz (AT/DE/CH)

- **Endgerätezugriff:** Der Eintrag in `sessionStorage` und das Auslesen von Bildschirm- und Interaktionsdaten sind Zugriffe auf das Endgerät nach **§ 165 Abs 3 TKG 2021** (AT) bzw. **§ 25 Abs 1 TDDDG** (DE). Sie sind nicht „unbedingt erforderlich“, deshalb braucht es eine **Einwilligung**. Rechtsgrundlage der Verarbeitung: **Art 6 Abs 1 lit a DSGVO**. CH: **Art. 45c FMG** (Information + Widerspruch) und **revDSG** (Transparenz); mit der Einwilligung ist das abgedeckt.
- **Einwilligungsumfang:** Die Kategorie „Statistik“ ist im Banner heute nur mit Google Analytics belegt. Dass Einblicke an dieselbe Einwilligung gekoppelt wird, ist **anwaltlich zu prüfen**. Empfehlung: Den Kategorietext „Statistik“ um den Dienst „Besucher-Einblicke (eigener Server)“ ergänzen, gemeinsam mit dem Banner-Eintrag in `services.js`. Bis zur Freigabe gilt `status: "labs"`, `banner: null` und `NEXT_PUBLIC_EINBLICKE` ist in Produktion **aus**. Die Rechtstexte werden nicht geändert. Der Vorschlag steht in `Marktresearch/digital/features/einblicke-dse-vorschlag.md`.
- **Personenbezug:** Die Rohdaten sind **pseudonym** (zufällige Sitzungs-ID ohne Verknüpfung zu IP, Konto oder Anfrage, 30 min gültig) und werden höchstens 14 Tage gespeichert. Die Aggregate (k ≥ 5, ohne `sid`) sind **anonym** und dürfen dauerhaft bleiben. Es gibt **keine Verknüpfung** mit `lead_ref`/Anfragen; das Ziel „anfrage“ zählt nur.
- **Keine Profilbildung, kein Replay:** Es gibt keine Wiedererkennung über Sitzungen hinweg, keine Tastatur- oder Formularinhalte und keine DOM-Aufzeichnung. Das Risiko ist niedrig. Eine **DSFA ist voraussichtlich nicht erforderlich** (keine Whitelist-/Blacklist-Fallgruppe der DSB). Empfohlen sind eine kurze Schwellwertanalyse und ein Eintrag im Verarbeitungsverzeichnis (Art 30).
- **DNT/GPC** werden im Browser und am Server beachtet. Das geht über die Pflicht hinaus und ist als Zusage in der DSE vorgeschlagen.
- **Empfänger:** Der eigene Hoster (Website) und die eigene Frappe-Instanz (Auftragsverarbeiter wie beim bestehenden Backoffice). Es gibt **keine Drittlandübermittlung** und keine Drittanbieter.
- **Betroffenenrechte:** Auskunft und Löschung sind mangels Identifizierbarkeit praktisch nicht zuordenbar (Art 11 DSGVO). Hinweis dazu in der DSE. Der Widerruf wirkt sofort über das Banner.

---

## 9. Leistung messen (Abnahme)
- Prod-Messung in `C:/Users/admin.local/Documents/platzhirsch-prodtest` (Port 3101, danach beenden), `tools/qa/perf.mjs` **vorher/nachher** mit Statistik-Einwilligung auf Startseite, Produkt, Kontakt und Küchenplaner (je 5 Läufe, Handy-Drossel).
- Kriterien: LCP-Median Δ ≤ 50 ms, INP-p75 Δ ≤ 8 ms (Klick- und Tippszenario), kein zusätzlicher Request vor `load`, Sammler < 4 KB gzip, keine Long Tasks > 50 ms durch den Sammler (Performance-Trace).
- E2E (`PW_WORKERS=1`): ohne Einwilligung → **0** Requests an `/api/einblicke` und kein `ph_eb`; mit DNT bzw. GPC → 0; mit Einwilligung → Beacon kommt an; ein Formular mit getipptem Text → der Payload enthält **keinen** der getippten Werte; Widerruf → kein weiterer Beacon, `ph_eb` gelöscht; Portal/Upload/Zahlung → 0.

---

## 10. Dateiaufteilung für zwei parallele Bauteams

Die gemeinsame Schnittstelle ist der **JSON-Vertrag** aus §4.3 und §5.2 (`schema: 1`). Er wird als `einblicke-vertrag.json` mit Beispielpayload in **beiden** Repos abgelegt. Beide Teams bauen gegen diese Beispieldatei.

### Team Website (Repo `Platzhirsch-Studio-Website`)
| Datei | Neu/Punktuell | Rolle |
|---|---|---|
| `src/lib/einblicke/config.js` | neu | Schalter, Ausschlussrouten, Gerätegrenzen, Limits (rein, Client + Server) |
| `src/lib/einblicke/gate.js` | neu | Einwilligung + DNT + GPC + Route → `darfMessen()` |
| `src/lib/einblicke/event.js` | neu | Mini-API `einblicke(name, data)` + Warteschlange |
| `src/lib/einblicke/selector.js` | neu | Stabiler Selektor (wird auch vom Screenshot-Tool injiziert) |
| `src/lib/einblicke/client.js` | neu | Sammler (< 4 KB gzip) |
| `src/lib/einblicke/schema.js` | neu | Strenge Prüfung der Pakete |
| `src/lib/einblicke/routes.js` | neu | Route → Vorlage |
| `src/lib/einblicke/aggregate.js` | neu | Roh → Tagesaggregat, k-Schwelle (rein) |
| `src/lib/einblicke/store.server.js` | neu | `.data/einblicke/roh|tag`, Löschung nach 14 T. |
| `src/lib/einblicke/frappe.server.js` | neu | Upsert-Push, Produktionsschutz |
| `src/app/api/einblicke/route.js` | neu | Empfang (204) |
| `src/app/api/einblicke/tagesabschluss/route.js` | neu | Tagesabschluss mit Secret |
| `tools/einblicke/tagesabschluss.mjs`, `screenshots.mjs`, `bericht.mjs` | neu | CLI |
| `tests/unit/einblicke.test.mjs`, `tests/e2e/einblicke.spec.js` | neu | §9 |
| `src/instrumentation-client.js` | punktuell (+4 Zeilen) | Lader |
| `src/lib/analytics.js` | punktuell (+2 Zeilen in `trackEvent`) | Ziele weiterreichen |
| Planer-Komponenten (Küche, Sofa, Ezarri, Stil-Finder) | punktuell, nach frischem Lesen | `einblicke("planer_…")` |
| ~15 Seiten/Komponenten | punktuell | `data-eb`, `data-eb-form`, `data-eb-ignore` |
| `src/lib/legal/services.js` | punktuell | Eintrag `einblicke` (labs, `banner: null`) |
| `Marktresearch/digital/features/einblicke-dse-vorschlag.md` | neu | DSE-Vorschlag für die Kanzlei |

### Team Frappe-App (`../platzhirsch-frappe-einblicke`, App `platzhirsch_einblicke`)
| Pfad | Rolle |
|---|---|
| `pyproject.toml`, `platzhirsch_einblicke/__init__.py`, `hooks.py`, `modules.txt` („Einblicke“), `patches.txt`, `README.md` (Installation, Rollen, API-Benutzer) | App-Gerüst |
| `einblicke/doctype/web_seite/` | `.json` + `.py` |
| `einblicke/doctype/web_heatmap_tag/` | `.json` + `.py` (JSON-Felder validieren) |
| `einblicke/doctype/web_pfad_tag/`, `web_signal/`, `web_planer_tag/`, `einblicke_einstellungen/` | Doctypes |
| `api.py` | `tag_speichern` (Upsert, idempotent, Rolle „Einblicke Schreiber“), `heatmap(...)`, `pfade(...)` (Lesen, „Einblicke Leser“) |
| `einblicke/page/heatmap/heatmap.json`, `heatmap.js`, `heatmap.css` | Overlay-Seite + Sankey |
| `einblicke/report/frust_hitliste/`, `pfade_zu_zielen/` | Script Reports |
| `einblicke/workspace/einblicke/einblicke.json`, `number_card/*`, `dashboard_chart/*` | Workspace |
| `fixtures/role.json` | Rollen Leser/Schreiber |
| `tests/test_api.py` | Upsert/Idempotenz (wird vom Frappe-Entwickler ausgeführt) |

Reihenfolge: (1) Vertrag festlegen → (2) beide Teams bauen parallel gegen die Beispieldatei → (3) lokal: Website schreibt nur in `.data/einblicke/`, die Frappe-App wird vom Entwickler des Inhabers auf einer **Test-Site** installiert → (4) nach Kanzlei-Freigabe Schalter in Produktion setzen.
