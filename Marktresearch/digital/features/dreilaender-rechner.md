# Feature: Dreiländer-Karte & Preisrechner (Labs)

**Stand:** 26.10.2026 · **Seite:** `/de/labs/dreilaender` (noindex, nur `de`, andere Locales → 404) · **API:** `GET /api/labs/wechselkurs`

## Was gebaut ist

1. **Interaktive Karte des Dreiländerecks** – eigene SVG-Grafik, kein Kartendienst (keine Drittanfragen, keine Einwilligung nötig). Lochau im Zentrum mit Puls, 14 Orte in AT/DE/CH/FL. Tippen/Klicken, Tab + Enter/Leertaste oder Pfeiltasten wählen einen Ort; die Route wird gezeichnet, das Land hervorgehoben. Eine Infokarte zeigt Fahrzeit (Richtwert) sowie Steuer, Lieferung und Montage für das Land. „Preis für … berechnen“ scrollt zum Rechner und setzt das Land. Mobil: direkt unter der Karte eine Kurzkarte (Ort, Land, Fahrzeit, Steuer-Kernaussage, „Details“ und „Preis … berechnen“), die nach dem Tippen nur dann in den Sichtbereich rückt, wenn sie gar nicht zu sehen ist (die Karte bleibt sonst stehen; reduzierte Bewegung ohne Animation). Darunter wischbare Orts-Chips mit Ausblendung am rechten Rand. Dicht liegende Ortsnamen erscheinen nur bei Auswahl.
2. **Preisrechner** „Was kostet mich ein Möbel mit X € österreichischem Bruttopreis bei mir?“ für Schweiz, Liechtenstein, Deutschland und Österreich. Mobil zeigt eine Live-Zeile direkt unter dem Eingabefeld sofort die Summen je Weg. Je Land die Wege aus Bericht 18 als Karten mit animierter Summe, Vergleichsbalken zum AT-Bruttopreis (CHF), aufklappbarem Rechenweg und Voraussetzungen. Nicht belegte Wege stehen als „Das klären wir persönlich“ dabei.
3. **EUR/CHF-Kurs live von der EZB**, serverseitig 12 h gecacht, mit Fallback-Kette.
4. Disclaimer „Richtwert, keine Steuerberatung“, Quellenliste, Hinweis, dass Eingaben den Browser nicht verlassen.

## Dateien

| Pfad | Zweck |
|---|---|
| `src/app/[locale]/labs/dreilaender/page.js` | Server Component: Locale-Prüfung, Metadata (noindex), lädt Kurs + Konfiguration, Hero, Quellen |
| `src/app/api/labs/wechselkurs/route.js` | `GET` → `{ base, quote, rate, date, source, fallback }`, Cache-Control 12 h |
| `src/components/Labs/Dreilaender/DreilaenderClient.js` | Client: gemeinsamer Zustand Karte ↔ Rechner, Infokarte, holt Kurs nach, falls Server nur Fallback hatte |
| `src/components/Labs/Dreilaender/DreilaenderMap.js` | Client: SVG-Karte, Tastatur, ARIA |
| `src/components/Labs/Dreilaender/PriceCalculator.js` | Client: Eingabe, Länderwahl, Ergebnis-Karten, Rechenweg |
| `src/components/Labs/Dreilaender/AnimatedNumber.js` | Zähl-Animation (motion), aus bei reduced motion |
| `src/components/Labs/Dreilaender/calc.js` | Reiner Rechenkern + zod-Eingabeschema + Euro-Parser |
| `src/components/Labs/Dreilaender/pricing.js` | Preis-Konfiguration (Richtwerte) + zod-Schema |
| `src/components/Labs/Dreilaender/rules.js` | Länder-Aussagen (nur aus Bericht 18) + öffentliche Quellen |
| `src/components/Labs/Dreilaender/geo.js` | Orte, Fahrzeiten (Bericht 02), Projektion, See/Rhein/Grenzen |
| `src/components/Labs/Dreilaender/ecb.server.js` | EZB-Abruf (fetch, 12 h Cache), steckt die Quellen in `resolveEurChf` |
| `src/components/Labs/Dreilaender/rate.js` | Reine Kurslogik: XML-Parsing mit zod, Fallback-Kette, Alter/„veraltet“, Anzeigetexte (`rateNotice`) |
| `src/components/Labs/Dreilaender/HeroMiniMap.js` | Dekorative Mini-Karte im Desktop-Hero (ohne JS, `aria-hidden`) |
| `src/components/Labs/Dreilaender/store.server.js` | Adapter-Schicht, lokaler Speicher `.data/dreilaender/` |
| `src/components/Labs/Dreilaender/format.js`, `dreilaender.module.css` | Formatierung de-AT, SVG-Styles/Animationen |

## Architektur

- Seite = Server Component (ISR `revalidate = 43200`). Sie ruft `getConfig()` und `getEurChf()` parallel und übergibt beides an **eine** Client-Insel (`DreilaenderClient`). Kein 3D, kein WebGL; die Karte ist SVG und wird serverseitig vorgerendert (funktioniert als Grafik auch ohne JS).
- Rechnen passiert **nur im Browser** (`calc.js`), es gibt keinen Request mit Kundendaten.
- Kurs: `fetch(ECB_URL, { next: { revalidate: 43200 } })` → Parse + zod (0,5–2,0) → in `.data/dreilaender/ecb-last.json` gemerkt. Fallback-Kette (`rate.js`): EZB → jüngerer von gespeichertem Kurs und Festwert (0,9227, EZB 23.10.2026) → kein Kurs. Jede Stufe liefert `source`, `date`, `ageDays`, `stale` (älter als 4 Tage). Ohne gültigen Kurs rechnet der Rechner für CH/FL nicht (Hinweis statt Zahl), die API antwortet 503 mit `rate: null`.
- Bewusst **kein `loading.js`**: mit Streaming würde `notFound()` für `/en|fr|it/labs/dreilaender` mit Status 200 statt 404 antworten.
- Bewegung: Routen-Zeichnen per `stroke-dashoffset`, Lochau-Puls, Kartenwechsel und Zählanimation mit `motion`; alles aus bei `prefers-reduced-motion`.
- A11y: Orte als `role="button"` mit `aria-pressed` und Label (Ort, Land, Fahrzeit), zusätzlich echte Buttons (Chips). Karte und Chips haben je **einen** Tab-Stopp (Roving Tabindex; Pfeiltasten, Pos1, Ende wechseln den Ort), von der Karte bis zum CTA sind es 2 Tabs. Ortswechsel wird über eine stabile `sr-only`-Live-Region kurz angesagt („Vaduz, Liechtenstein, ca. 40 Minuten ab Lochau“). „Preis … berechnen“ setzt den Fokus auf das Länder-Radio und scrollt mobil zur Länderwahl; Länderwahl als Radio-Gruppe; Betrag mit Label, Hilfetext, `aria-invalid` + `role="alert"`; Ergebnis-Zusammenfassung in einer `sr-only`-Live-Region (nicht die animierten Zahlen). Touch-Ziele ≥ 44 px (Kartenpunkte mobil mit Trefferkreis r = 44 Einheiten; Ausnahme: dicht liegende Orte Bregenz/Rheintal, dafür Chips). Text unter 14 px mindestens `ink/75` (≈ 5,4 : 1). 375 px ohne horizontales Scrollen (Playwright geprüft).

## Rechenwege (aus Bericht 18)

| Land | Weg | Formel |
|---|---|---|
| CH/FL | Selbstabholung mit Ausfuhrbeleg | Netto (Brutto ÷ 1,20) × Kurs; + 8,1 % Einfuhr-MWST; + eigener Transport [Richtwert]. AT-USt nur als Kaution (Info-Zeile, nicht addiert). |
| CH/FL | Lieferung, Kunde = Importeur | (Netto + Fracht) × Kurs; + 8,1 % auf Ware + Transport; + Verzollungsgebühr × 1,081 [Richtwert] |
| CH/FL | Verzollter Komplettpreis / Küche mit Montage | keine Zahl → „klären wir persönlich“ (CH-MWST-Registrierung nötig) |
| DE | Abholung Lochau | Bruttopreis (20 % AT-USt) |
| DE | Lieferung loser Möbel | Standard (`ossActive: false`): Netto × 1,20 + Lieferung [Platzhalter]; sichtbarer Hinweis unter dem Preis, dass 19 % nur bei Abrechnung über die EU-OSS gelten (vom Inhaber zu bestätigen, inkl. Frage der Weitergabe im Preis). Mit `ossActive: true`: Netto × 1,19 + Lieferung, Badge „19 % DE-USt (Bedingung siehe unten)“ und sichtbare Bedingung. |
| DE | Küche/Einbau mit Montage | „klären wir persönlich“ |
| AT | Abholung / Lieferung | Brutto / Brutto + Lieferung [Platzhalter] |

Kontrollrechnung: 25.000 €, Kurs 0,9227 → Selbstabholung CHF 20.929,97–21.029,97, Lieferung CHF 21.315,30–21.390,97 – identisch mit Bericht 18, Tabelle 8.1.

## Datenmodell

`pricing.js` → `configSchema` (zod):

```json
{
  "version": 1,
  "deliveryEur": { "CH": {"min":450,"max":450,"approved":false,"source":"…"}, "FL": {…}, "DE": {…}, "AT": {…} },
  "customsFeeChf": { "min": 80, "max": 150, "approved": false },
  "selfTransportChf": { "min": 150, "max": 250, "approved": false },
  "ossActive": false,
  "fallbackRate": { "rate": 0.9227, "date": "2026-10-23" }
}
```

- Schätzungen aus Bericht 18, Abschn. 8.1 (Fracht CH 450 €, Verzollung CHF 80–150, Transporter CHF 150–250) zeigen Kunden nur „Schätzung, noch nicht vom Inhaber bestätigt“; die interne Herkunft steht als Kommentar in `pricing.js`.
- `ossActive` (Standard `false`): erst auf `true` setzen, wenn der Inhaber bestätigt, dass DE-Fernverkäufe über die EU-OSS mit 19 % abgerechnet werden.
- **Platzhalter `[Preis vom Inhaber festzulegen]`**: Lieferung DE (250–450 €), AT (150–350 €), FL (wie CH angenommen).
- Solange `approved: false`, zeigt die Seite das Badge **„Richtwert – Beispielwert“** und die Quelle.
- Freigabe lokal: `.data/dreilaender/config.json` mit denselben Feldern (wird gemergt und validiert; ungültig → Defaults).

## Anbindung Frappe (später)

Wir haben heute keinen Schreibzugang und kein Preisfeld; die Adapter-Schicht `store.server.js` kapselt alles:

| Heute | Später in Frappe/ERPNext |
|---|---|
| `getConfig()` liest `.data/dreilaender/config.json` | Neuer **Single-Doctype** `Dreilaender Rechner Einstellungen` (Felder wie `configSchema`, je Land Child-Table `Dreilaender Lieferpauschale` mit `land`, `min_eur`, `max_eur`, `freigegeben`, `quelle`). Abruf: `GET /api/resource/Dreilaender Rechner Einstellungen/Dreilaender Rechner Einstellungen` mit API-Key (nur Lesen, serverseitig). |
| `saveLastRate()` / `readLastRate()` → `.data/dreilaender/ecb-last.json` | ERPNext-Standard-Doctype **`Currency Exchange`** (`from_currency=EUR`, `to_currency=CHF`, `exchange_rate`, `date`) – lesen per `GET /api/resource/Currency Exchange?filters=…&order_by=date desc&limit=1`; ERPNext kann den Kurs selbst pflegen („Currency Exchange Settings“). |
| Bruttopreis manuell eingegeben | Sobald Preise im Item freigegeben sind: `Item Price` (Price List „Standard Selling“) → Rechner auf Produktseiten mit vorbelegtem Betrag. |

## Rechtliches

- Nur Aussagen aus Bericht 18; alles Unbelegte als „Das klären wir persönlich“. Keine Händler-Behauptungen, keine Referenzen, keine erfundenen Endpreise (Pauschalen klar als Richtwert/Beispielwert).
- Disclaimer „Richtwert, keine Steuerberatung“ sichtbar am Ergebnis und in „So rechnen wir“.
- Datenschutz: keine Eingaben gespeichert oder übertragen, keine Cookies, kein Kartendienst; EZB-Abruf nur serverseitig (keine Besucherdaten an die EZB). Keine Einwilligung nötig, keine KI-Inhalte.
- Labs: `robots: noindex, nofollow`, nur `de`.

## Testen

- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/de/labs/dreilaender` → 200 (`/en/…`, `/fr/…` → 404)
- `curl -s http://localhost:3000/api/labs/wechselkurs` → `{"base":"EUR","quote":"CHF","rate":0.9227,"date":"2026-10-23","source":"ezb","fallback":false}`
- Manuell: Ort auf Karte/Chip wählen → Infokarte; „Preis für … berechnen“; Betrag 25.000 → Werte wie oben; „abc“ → Fehlermeldung; Pfeiltasten auf der Karte.
- Geprüft mit Playwright: 375 px und 1440 px ohne horizontales Scrollen, keine Konsolenfehler, reduced motion, Tastatur.

## Offene Punkte

1. **Echte Preise** für Lieferung (CH/FL/DE/AT) und Verzollungsgebühr: Angebote Gerlach AG / Gebrüder Weiss einholen (Bericht 18, Abschn. 6), dann `approved: true`.
2. Ob Platzhirsch die **OSS-Schwelle** (10.000 € EU-weit) überschreitet und über die OSS abrechnet → dann `ossActive: true`. Außerdem Preispolitik: Wird der niedrigere Steuerbetrag weitergegeben?
3. **Verzollter CHF-Komplettpreis / Küchen mit Montage** erst nach CH-MWST-Registrierung als eigener Rechenweg (Formel in Bericht 18, 8.2 vorhanden).
4. Fahrzeiten sind Richtwerte aus Bericht 02 – ggf. mit Routing-Daten verfeinern (ohne Drittanbieter im Client).
5. Kartengeometrie ist schematisch; für die öffentliche Version ggf. vereinfachte Ländergrenzen (Natural Earth, gemeinfrei) einbauen.
6. Mehrsprachigkeit (en/fr/it) erst nach Freigabe der Texte.
7. Bestehender Prototyp `src/components/Preview/dreilaendereck/DreilaenderMap.js` (anderes Team) nutzt abweichende Fahrzeiten – angleichen.

## QA-Runde 1 → umgesetzt (26.10.2026)

Feedback: `qa-screenshots/dreilaender-rechner/feedback-runde1.md`; Nachweise: `qa-screenshots/dreilaender-rechner/fix/` (shoot.mjs + `check.mjs`).

| # | Punkt | Umsetzung |
|---|---|---|
| P1-1 | Tippen auf Ort mobil ohne sichtbare Wirkung | Kurzkarte direkt unter der Karte (`lg:hidden`) + `scrollIntoView({block:"nearest"})` nur nach Zeiger-Tippen |
| P1-2 | „in Schweiz“ / „für Schweiz“ | `inName`/`forName` je Land in `rules.js` |
| P1-3 | DE 19 % als Tatsache | Config-Flag `ossActive` (Standard false → 20 % AT-USt), Hinweis/Bedingung sichtbar unter dem Preis, Badge nur mit OSS |
| P2-4 | Überlappende Labels | `lp:"t"` korrigiert (Name −30, Zeit −14; mobil +14 verschoben), Friedrichshafen `t`, Lindau `tl`, Bregenz `l`, Lochau-Label rechts unterhalb der Grenze |
| P2-5 | „Bericht 18 …“ sichtbar | Kundentext „Schätzung, noch nicht vom Inhaber bestätigt“ |
| P2-6 | Touch-Ziele | Presets `min-h-11` im 4er-Raster, Trefferkreis mobil r = 44 |
| P2-7 | 26 Tab-Stopps | Roving Tabindex für Karte und Chips → 2 Tabs bis CTA |
| P2-8 | `aria-live` am neu gemounteten Artikel | stabile `sr-only`-Live-Region mit Kurzfassung |
| P2-9 | Kontrast | `ink/60`/`/55` → `/75`, See-Label `#3f5b66`, Länderlabels Deckkraft 0,72, Hero `white/75` |
| P2-10 | Ergebnis mobil weit weg | Live-Zeile unter dem Eingabefeld mit Summen + „Details und Rechenweg“ |
| P2-11 | CTA mobil scrollt nur zur Überschrift | mobil zur Länderwahl, Fokus auf das gewählte Länder-Radio |
| P3-12 | Hero leer | mobil weniger Abstand oben, Anker „Zur Karte“ / „Direkt zum Rechner“ (Mini-Karte rechts: offen) |
| P3-13 | Presets umbrechen | `grid-cols-4` |
| P3-14 | Balkenlegende „0“ | „Ihr Preis“ ↔ „AT-Brutto CHF …“ |
| P3-16 | Quellenlinks klein | `inline-block py-1.5` |
| P3-17 | Animation bei Pfeiltasten | bei Tastaturwahl nur kurze Überblendung |

Offen aus Runde 1: P3-15 (Bregenz/Rheintal mobil ohne Namen, solange nicht gewählt) und die Mini-Karte im Desktop-Hero.

## Runde 2 (R2-labs-service, 26.10.2026)

Grundlage: `qa-screenshots/dreilaender-rechner/abnahme.md` (8/10, N1–N5, P3-12, P3-15). Nachweise: `qa-screenshots/dreilaender-rechner/r2/` (`check-r2.mjs`, `interact/`, `shoot/`).

| Punkt | Umsetzung | Nachweis |
|---|---|---|
| N1 Kartenschrift dünn/kontrastarm (WebKit) | SVG-Text nutzt jetzt Instrument Sans (`--font-sans`, vorgeladen) statt des nicht vorgeladenen Montserrat, mit Langform-Eigenschaften und Gewicht 600 (Orte, Zeiten, Länder, Lochau) bzw. 500 (Bodensee) zusätzlich als `font-weight`-Attribut. Fahrzeiten in `#6b5314` (≈ 6,7 : 1 auf Bone, vorher Gold-Text ≈ 5,5 : 1 im dünnen Schnitt). | WebKit iPhone/iPad: berechnet `600`, `rgb(107,83,20)`; `shoot/de-labs-dreilaender--ipad.png` |
| N2 Routen kreuzen Labels | Eigene Beschriftungs-Ebene über allen Routen und Punkten; Halo in Bone per `paint-order: stroke` (Namen 6–7, Zeiten 5, Länder 4 Einheiten, runde Ecken). Klick auf eine Beschriftung wählt den Ort (Zeiger), die Tastatur bedient weiter die Orts-Buttons. | `interact/desktop-02-lindau.png`, `desktop-03-ravensburg.png` |
| N3 Touch-Ziele iPhone SE | Trefferradius wird per ResizeObserver aus der echten Darstellungsbreite berechnet (Ziel 48 px Durchmesser) und auf die Voronoi-Zelle des Orts beschnitten (`geo.js → hitCell`), damit Nachbarn sich den Platz teilen. Oben/unten 24 Einheiten Rand im viewBox, damit Ravensburg/Chur nicht abgeschnitten werden. | 375 px (WebKit): alle Orte Box ≥ 48 px. Nach QM-Fix (Label-Ebene mobil `pointer-events: none`, Rheintal-Callout y 336, viewBox rechts +32): effektiv per `elementFromPoint` ≥ 44 px in beiden Achsen, Ausnahme Lindau/Dornbirn (≈ 34 px Abstand, je ≥ 40 px; Chips als Alternative). |
| N4 Live-Region beim Tippen | Zusammenfassung wird erst nach 800 ms Tipp-Ruhe angesagt (`useDebounced`); Fehler bleiben sofort (`role="alert"`). | Während des Tippens unverändert, nach 1 s neuer Wert (alle Geräte) |
| N5 CTA bricht dreizeilig | Kurzkarte: CTA in eigener, voller Zeile, „Details“ darunter. | 375 px: 311 × 44 px, einzeilig (`interact/se375-03-kurzkarte.png`) |
| P3-15 Bregenz/Rheintal mobil ohne Namen | Unter 640 px stehen beide als Beschriftung mit gestrichelter Führungslinie in freier Fläche (Bregenz rechts oben, Rheintal links unten Richtung Schweiz); das Rechteck um den Namen ist die Trefferfläche (≥ 48 px hoch). | Antippen wählt den Ort (`aria-pressed=true`) auf iPhone, SE 375, Android |
| P3-12 Mini-Karte im Desktop-Hero | `HeroMiniMap.js`: gleiche Geodaten, Seen/Rhein/Grenzen hell auf Night, Routen in Gold, Lochau mit Puls (aus bei reduced motion), ab `lg`. | `interact/desktop-00-hero.png` |
| EZB nicht erreichbar | Siehe Architektur: Kurs immer mit Datum; Fallback sagt „Letzter verfügbarer EZB-Kurs vom … – der aktuelle Kurs war gerade nicht abrufbar“; älter als 4 Tage → deutliche Warnung im Formular und über den CHF-Ergebnissen („Achtung … vor N Tagen …“); gar kein Kurs → keine CHF-Beträge. Der Client holt nur dann nach, wenn der Server einen Ersatzkurs hatte, und übernimmt nur Besseres. | `tests/unit/labs-dreilaender-rate.test.mjs` (10 Tests) |

Werte und Kennzeichnung („Richtwert – Beispielwert“, „[Preis vom Inhaber festzulegen]“) sind unverändert; keine neuen Preise.

**Tests:** `node --test tests/unit/labs-dreilaender-rate.test.mjs tests/unit/labs-dreilaender-geo.test.mjs` (Kurs-Fallback, Voronoi-Trefferflächen); `npx playwright test tests/e2e/labs-dreilaender.spec.js --project=desktop` (Status/noindex, API-Felder, Kurshinweis, entprellte Live-Region, 375 px: Trefferflächen, Callouts, CTA).

**Offen:** Inhaberentscheidungen (ossActive, Weitergabe DE-USt, echte Liefer-/Verzollungspreise) wie bisher; Ravensburg/St. Gallen effektiv 41–43 px hoch bei 375 px (Box 48 px, Chips als gleichwertige Alternative).

### QM-Nachbesserung R2 (26.10.2026)
- Kartentipp mobil scrollt nur, wenn die Kurzkarte nicht im Bild ist, bei reduzierter Bewegung ohne Animation.
- Die Beschriftungs-Ebene ist mobil für Zeiger durchlässig, Tipp und Hit-Test treffen den Orts-Button. Auf dem Desktop bleibt der Klick auf den Namen erhalten.
- e2e: Vor jedem Tipp `scrollIntoViewIfNeeded` und warten, bis nichts mehr scrollt. Tipp ohne `force`. Geprüft wird, dass die Seite nach dem Tipp nicht scrollt und dass alle Ortsmitten den eigenen Button treffen. Der Statustest hat einen Warm-up-Abruf und einen längeren Timeout.
- Paketläufe mit `npx playwright test … --reporter=list --output=<eigener Ordner>`, damit der gemeinsame Report in `qa-screenshots/teamleiter/tests-report` nicht überschrieben wird.

## Runde 4 (Paket R4-portal-labs, 26.10.2026)

- **Geometrie Lindau/Dornbirn:** Mobil (< 640 px) steht Dornbirn jetzt wie Bregenz und Rheintal als Beschriftung mit Führungslinie in freier Fläche rechts (Callout bei x 556, y 252, unter Bregenz, ohne Überlappung). Lindau behält dadurch den vollen Trefferkreis. Beide erreichen ≥ 44 px in beiden Achsen (Hit-Test per `elementFromPoint`, e2e `r4-portal-labs.spec.js`), vorher je ≈ 40 px. Desktop unverändert.
- **Bundle:** zod wurde über `import { z } from "zod"` mit allen ~50 Sprachpaketen in den Client gezogen (90 KB gzip pro Route). Die Labs-Clientdateien importieren jetzt `../zod.js` (benannte Re-Exporte), gleiche API.
- **Fehlerfälle:** Wechselkurs offline → Seite lädt, Hinweis statt Absturz (e2e). Ungültige Eingaben (−5, abc, 99 999 999 999) → deutsche Fehlermeldung (`qa-screenshots/teamleiter/r4-portal-labs/errors/`).

## Runde 5 (Paket R5-portal-labs, 26.10.2026)

- **LazyMotion:** `DreilaenderClient` rendert in `<LabsMotion features="animation">` (`Labs/motion.js`), alle Elemente als `m.*`. Die Animations-Features (domAnimation) kommen als eigener Chunk nach der Hydration. Vor dem Nachladen setzen die Elemente `initial={false}` (`useMotionReady()`), damit nichts unsichtbar bleibt. Das gilt auch, wenn der Chunk ausfällt. `AnimatedNumber` zählt mit einem eigenen rAF-Tween (gleiche Kurve 0.22/1/0.36/1), weil `animate` aus `motion/react` die ganze Engine statisch mitzog. Bundle Prod: Initial 285,5 → **262,6 KB** gz, routeneigen 155,3 → 132,4 KB.
- **P3-4 Lochau/Bregenz:** Rechts unten auf der Karte sitzt eine Lupe, die denselben Ausschnitt 5-fach vergrößert zeigt (`geo.js → INSET`). Die Lagen werden aus `project()` der echten Koordinaten berechnet, es gibt keine neuen Geodaten. Die Lupe ist `aria-hidden` und für Zeiger durchlässig. Bregenz wählt man weiter über den Punkt bzw. mobil über das Callout. Der Lochau-Punkt hat zusätzlich einen Halo in Bone. Belege: `qa-screenshots/teamleiter/r5-portal-labs/karte/`.
- `calc.js`, `rate.js` und `ecb.server.js` bleiben unverändert (API stabil für R5-schweiz).
