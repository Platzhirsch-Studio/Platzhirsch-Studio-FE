# Expertenrat gesamt – Wettbewerbsanalyst Digital

**Kürzel:** wettbewerb · **Stand:** 28.10.2026 · **Branch:** feature/neuauftritt (Arbeitsstand, ungecommittet, Bauteams aktiv)
**Rolle:** Gutachter. Es wurde kein Code geändert und kein Formular abgesendet.

**Methode:**
1. Wettbewerberbasis aus `Marktresearch/03`, `04`, `20` und `23` (Abschnitt Gegner) sowie aus den Benchmarks in `digital/00`, `01`, `03`, `04` und `07`.
2. Am 28.10.2026 die Startseiten erneut abgerufen: hoettges.at, reiter.design, fretz.de, aufschnaiter.com, minotti.com, ambientedirect.com und connox.at. finnishdesignshop.com antwortete mit 403. Dort und bei den Bewertungszahlen der Shops stütze ich mich auf frühere Berichte und Fachwissen, markiert als **[nicht verifiziert]**.
3. Eigener Stand per `curl` gegen localhost:3000: Startseite, Produktseite Poliform Westside Soft, Statuscodes von 24 Routen. Dazu Code-Lektüre (`src/lib/features.js`, `Booking/config.js`, `lib/content/projekte.js`, `lib/arbeitsweise/media.js`, `lib/commerce/mode.js`, `content/ratgeber/*`, `labs/*/page.js`).
4. Screenshots: `qa-screenshots/expertenrat-gesamt/wettbewerb/`. Der Dev-Server war stark ausgelastet (Erstaufruf der Startseite 239 s, Labs-Seiten 35–75 s).

**Die 10 stärksten Wettbewerber laut Research.** Grundlage sind Markenüberschneidung, Nähe und digitale Stärke:

| # | Wettbewerber | Warum gefährlich |
|---|---|---|
| 1 | Höttges, Dornbirn | gleiche Marken, offiziell im Minotti- und Poliform-Locator gelistet |
| 2 | reiter design, Weiler/Innsbruck | 4.500 m², ca. 400 Marken, Outdoor |
| 3 | Fretz, Konstanz | Minotti und Poliform, Schweiz-Angebot, Online-Termin |
| 4 | Gamma, Wil SG | stärkstes Haus der Ostschweiz, Online-Termin |
| 5 | Zingg-Lamprecht, Zürich | Minotti Concept Store |
| 6 | Thöny, Schaan FL | Minotti in Liechtenstein |
| 7 | Aufschnaiter, Tirol | 24.000 Instagram-Follower, NOW-Shop, Projekte |
| 8 | G. Wurst, Stockach | aggressive Stadt-SEO für Lindau, Friedrichshafen und St. Gallen |
| 9 | Lifestyle Haus, Lochau | Online-Shop, gleicher Ort, in Rankings vor Platzhirsch |
| 10 | Bihler, Ravensburg | Konfiguratoren, Online-Termin, A&W-Liste |

**Digitale Benchmarks:** AmbienteDirect, Connox, Finnish Design Shop, minotti.com mit Flagships, Teo Jakob.

---

## Note: 7 / 10

**Bei der Funktionstiefe** ist die neue Seite der Region um Jahre voraus. Kein regionaler Händler hat Produktseiten mit Preislogik, 4 Sprachen, Stadtseiten, 3D/AR, einen Küchen- und einen Sofaplaner, Stil-Finder, Concierge, Handy-Upload oder ein Kundenportal. Minotti selbst hat weder Konfigurator noch AR.

**Bei Vertrauen und Beweis** liegt sie heute dagegen **hinter** Höttges, reiter, Aufschnaiter und Minotti. Die Seite zeigt null Referenzprojekte, null Bewertungen und null echte Bilder des Kern-USP (Handzeichnung und Modell). Es gibt keinen echten Online-Kalender, obwohl Gamma, Fretz, Teo Jakob und Bihler einen haben. Die stärksten Alleinstellungen stehen zudem hinter `noindex`, nur auf Deutsch und im Produktions-Build standardmäßig AUS (`features.js`).

Das widerspricht der Inhaber-Entscheidung Nr. 9. Laut Team-Doku ist das in Arbeit. Mit Kalender, 3 Projekten, Handzeichnungs-Material und freigeschalteten Features sind **9/10** realistisch.

---

## Top-5-Stärken (klar vorn)

1. **Planer, die es sonst niemand hat.** Küchenplaner Pro (3D), Minotti-Sofaplaner (ca. 90 Modelle), AR-Viewer und Stil-Finder mit Moodboard-PDF. Regional gibt es nur die USM-Konfiguratoren von reiter und Bihler, also Fremd-Tools. Minotti.com hat keinen Konfigurator und kein 3D/AR (abgerufen am 28.10.2026). Auch AmbienteDirect und Connox zeigen auf der Startseite weder Konfigurator noch AR.
2. **Katalogtiefe und SEO-Gerüst.** Rund 1.765 Produktseiten in 4 Sprachen mit hreflang und Product-JSON-LD. Die Startseite hat 6 JSON-LD-Blöcke. Dazu kommen 13 Stadt- und Regionsseiten (Bregenz bis Appenzell) und der Schweiz-Hub mit CHF-Rechner. G. Wurst hat 3 Stadtseiten, Höttges laut Masterplan 9 Seiten insgesamt.
3. **Ehrliche Kaufinformation auf der Produktseite.** „Auf einen Blick“ zeigt Preis „auf Anfrage“ mit Begründung, den Ausstellungsstatus, Lieferung pro Land, eine Ansprechperson und Downloads. Kein regionaler Premiumhändler hat Produktseiten. Die Shops haben sie, aber ohne Beratungsebene.
4. **Service nach dem Kauf.** Handy-Upload und Kundenportal mit Projekten, Terminen, Dokumenten und Gewerken. Kein einziger der 14 Vergleichspartner bietet ein Kundenportal. Das bindet Projektkunden (Küche, Yacht, Haus) über Monate.
5. **Geschäftsfelder, die die Konkurrenz nicht kommuniziert.** Yacht-Interior (nur Minotti selbst hat „Yachting“ als Projekttypologie), Outdoor-Gartenplanung als Planung statt nur als Lagerware wie bei reiter, Ezarri-Vertragshändler (in der Region einzigartig) und das Café als Erlebnisort.

---

## Funktionsvergleich (✓ vorhanden · ~ teilweise · ✗ fehlt · ? nicht verifiziert)

| Funktion | Platzhirsch neu | Höttges | reiter | Fretz | Gamma | Aufschnaiter | Wurst / Lifestyle / Bihler | AmbienteDirect / Connox / FDS | minotti.com | Urteil |
|---|---|---|---|---|---|---|---|---|---|---|
| Produktseiten mit Daten | ✓ 1.765 | ✗ | ~ Produktsuche | ✗ | ✗ | ~ NOW | ~ / ✓ Shop / ~ | ✓ | ✓ inkl. DWG | **vorn regional**, auf Augenhöhe mit Benchmarks |
| Preise / Checkout | ✗ „auf Anfrage“; Atelier und Gutschein im Modus `off` | ✗ | ✗ | ~ Sale | ✗ | ~ NOW-Shop | ✗ / ✓ / ~ | ✓ | ✗ | **hinten** gegenüber Aufschnaiter, Lifestyle und Shops |
| Online-Termin mit Kalender | ✗ (`BOOKING_PROVIDER=none`, die Labels sagen trotzdem „Termin wählen“) | ✗ (Mail) | ✗ | ✓ | ✓ | ✗ | ? / ✗ / ✓ | Hotline | ✗ | **hinten** gegenüber Fretz, Gamma, Bihler und Teo Jakob |
| Referenzprojekte | ✗ (`PROJEKTE = []`, Seite noindex) | ✓ | ✓ Wohnen/Arbeiten | ~ | ? | ✓ | ? | ✓ Projects-Bereich | ✓ nach Typologie | **klar hinten** |
| Bewertungen auf der Seite | ✗ (Google 4,2 aus 6) | ✗ | ✗ | ~ Widget | ✗ | ✗ | ✗ | ✓ Trusted Shops/Trustpilot [nicht verifiziert] | – | regional Gleichstand, gegenüber Shops hinten |
| Konfigurator / Planer | ✓ Küche + Sofa | ✗ | ~ USM | ✗ | ✗ | ✗ | ✗ / ✗ / ~ USM, Montana | ✗ | ✗ | **klar vorn** |
| 3D / AR | ✓ (Labs) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ / ✗ / ? | ✗ | **klar vorn** |
| KI-Concierge, Stil-Finder | ✓ (Labs, noindex) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **vorn** |
| Kundenportal, Handy-Upload | ✓ Beta | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | Kundenkonto (Bestellungen) | Händler-Download | **vorn** |
| Ratgeber / Magazin | ~ 8 Artikel, alle mit [prüfen], daher noindex | ✗ | ✓ Magazin | ~ News | ✗ | ✓ Blog | ✗ | ✓ Magazin | ✓ | **hinten**, bis die Artikel freigegeben sind |
| Sprachen | DE/EN/FR/IT, **neue Features nur DE** | DE | DE | DE/EN | DE | DE | DE | 4–15 Länder | 8 | Basis vorn, Features hinten |
| Stadt- und Regions-SEO | ✓ 13 Seiten + Schweiz-Hub | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ 3 / ✗ / ✗ | – | – | **vorn** |
| Schweiz-Angebot | ✓ CHF-Rechner + Hub | ✗ | ✗ | ✓ Seite | (Inland) | ✗ | ~ | Versand CH | – | vorn, weil konkreter als Fretz |
| Hersteller-Locator-Listung | ✗ Minotti/Poliform | ✓ | ✗ | ✓ | ✓ | – | – | – | – | **hinten**, nicht per Website lösbar |
| Sale / Outlet | ✗ (`ATELIER_MODE=off`, keine CSV) | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ Lifestyle | ✓ | – | **hinten** |
| B2B / Architekten / Objekt | ~ nur Textstellen | ✓ Architektenteam | ✓ Arbeiten | ✓ Objekt | ? | ✓ | ✓ Bihler | ✓ Projects | ✓ Download-Area | **hinten** |
| Social-Reichweite (IG) | 772 | 967 | 6.005 | 8.818 | 1.491 | 24.000 | – / – / 2.532 | – | – | hinten, kein Website-Thema |

---

## Was die Konkurrenz nicht kopieren kann (Burggraben)

| Burggraben | Warum nicht kopierbar | Stand auf der Website |
|---|---|---|
| **Harald zeichnet von Hand und baut Modelle**, mit 1–2 Tagen vor Ort | Das ist eine Person mit eigener Handschrift. Höttges hat Moodboards, Minotti hat Renderings | **Nicht sichtbar.** In `lib/arbeitsweise/media.js` sind alle 10 Bildslots `null`. `/de/arbeitsweise` ist nirgends verlinkt (DE only). Auf der Startseite fallen „Handzeichnung“ und „Menghin“ 0-mal |
| **Planer + Portal + Upload als geschlossene Kette** | Das braucht Monate Entwicklung und eigene Backoffice-Daten. Regionale Händler haben keine IT | gebaut, aber `noindex`, DE only und in Produktion AUS |
| **Ezarri-Vertragshändler** (Mosaik für Pool, Bad, Yacht) | Vertrag. Bei den regionalen Wettbewerbern gibt es keinen sichtbaren Ezarri-Händler [Research] | `/de/ezarri` liefert 404 (in Arbeit). Die Startseite verlinkt es trotzdem |
| **Yacht-Interior am Bodensee** | Das braucht Referenzen und Netzwerk. Minotti zeigt Yachting nur als Hersteller | Seite live (DE). Ohne Projektbeweis bleibt sie eine Behauptung |
| **Café + Showroom, 1 km von der DE-Grenze, 30 km von SG** | Lage | auf der Startseite gut erzählt („Erst ein Kaffee. Dann das Sofa.“) |

---

## Befunde

Prio: **P0** Blocker vor Livegang · **P1** vor oder kurz nach Livegang · **P2** Welle 1/2 · **P3** Feinschliff. Aufwand: S ≤ ½ Tag, M ≤ 2 Tage, L > 2 Tage.

| # | Prio | Seite/Datei | Befund | Beleg | Konkrete Maßnahme | Aufwand | Wirkung Umsatz/Ranking |
|---|---|---|---|---|---|---|---|
| 1 | **P0** | `src/lib/features.js`, `labs/*/page.js` (robots), `labs/page.js:21` | Die größten Wettbewerbsvorteile sind für Google und für Besucher in Produktion **unsichtbar**. Ist ein Schalter nicht gesetzt, gilt in Produktion AUS. Alle Labs-Seiten haben `robots: {index:false}`, nur DE, und liegen unter `/labs`. Das widerspricht Inhaber-Entscheidung Nr. 9 (eigene URLs, Standard AN, Umleitung von /labs). *In Arbeit (Team Labs-Übersicht).* | features.js Z. 9–11; `grep robots app/[locale]/labs` liefert 7 Treffer `index:false` | Sprechende URLs (`/de/kuechenplaner`, `/de/sofaplaner`, `/de/3d-ar`, `/de/stil-finder`), 301-Umleitung von `/labs/*`, `flagOn`-Default in Produktion auf AN, `index:true` und Sitemap-Eintrag pro Feature, sobald seine Auflagen erfüllt sind | M | **sehr hoch.** Long-Tail „Küche online planen Vorarlberg“, „Minotti Sofa konfigurieren“: Dafür gibt es in der Region null Konkurrenz |
| 2 | **P0** | `/de/beratung`, `Booking/config.js` | Gamma, Fretz, Teo Jakob und Bihler haben einen Online-Kalender, Platzhirsch nicht (`BOOKING_PROVIDER` Default „none“). Die CTA „Termin wählen“ verspricht aber einen. Gegenüber Höttges (Mail-Knopf) wäre das ein schneller Sieg, der verschenkt wird | config.js Z. 3–7; Produktseite „In Lochau ansehen – Termin wählen“ | `BOOKING_PROVIDER=link` mit Google-Terminplanung oder MS Bookings (AVV), Slots Di–Sa inkl. Samstag 14–16 Uhr. Bis dahin Label „Termin anfragen“ (siehe conversion #1) | S–M | hoch: Lead-Abschluss +15–30 %, Überholen von Höttges im Kernpunkt |
| 3 | **P0** | Startseite → `/de/ezarri` | Der Menü- und Startseiten-Link führt aktuell auf **404**. Das ist ein Händler-Alleinstellungsmerkmal mit totem Link. *In Arbeit (Ezarri-Workflow).* | `curl /de/ezarri` liefert 404; der Link steht im HTML der Startseite | Release-Gate: `NEXT_PUBLIC_FEATURE_EZARRI=1` nur zusammen mit `EZARRI_PUBLIC=true` und Route vorhanden (Unit-Test, der beide koppelt) | S | mittel: Vertrauen, Crawl-Fehler |
| 4 | **P1** | `lib/arbeitsweise/media.js`, Startseite, Navigation | Der **einzige nicht kopierbare USP** (Handzeichnung + Modell) hat 0 echte Bilder (10 von 10 Slots `null`). `/de/arbeitsweise` ist nicht verlinkt und nur DE. Die Startseite erwähnt Harald und die Handzeichnung nicht ausdrücklich, nur die animierte Linie „Linie · Modell · Licht · Raum“ | media.js Z. 40–64; Textsuche auf der Startseite: „Handzeichnung“ 0, „Menghin“ 0 | Inhaber liefert 6 Fotos (Skizze, Modell, Vor-Ort-Termin, Rendering-Vergleich, Porträt). Startseiten-Kapitel „Von Haralds Hand zum Raum“ mit Link auf `/arbeitsweise`, Menüpunkt unter „Das Haus“, EN/FR/IT-Fassung | M (Inhalt) | **sehr hoch**: der Differenzierer gegen Höttges' Moodboards und Gammas Etagen. Rechtfertigt Premium-Marge |
| 5 | **P1** | `lib/content/projekte.js`, `/de/projekte` | `PROJEKTE = []`, Seite noindex. Höttges, reiter, Aufschnaiter, Minotti, AmbienteDirect und Connox zeigen alle Projekte. Wer 50–300 T€ ausgibt, will Beweise sehen. Das Schema mit Einwilligung, ohne Adresse und mit EXIF-Prüfung ist vorbildlich, nur leer | projekte.js Z. 29 | 3 Projekte bis Livegang (1 Küche, 1 Wohnen, 1 Outdoor oder Yacht), Format Bericht 12 C3. Danach 1 Projekt pro Monat. Filter nach Typologie wie bei Minotti (Haus, Ferienwohnung, Yacht, Objekt) | L (Inhalt) | sehr hoch: Conversion bei großen Projekten, Ranking „Interior Design Vorarlberg“ |
| 6 | **P1** | alle Feature-Seiten (`if (locale !== "de") notFound()`) | Planer, Yacht, Outdoor, Arbeitsweise und Labs gibt es **nur auf Deutsch**. Die Zielkunden sprechen aber auch andere Sprachen: Yacht international (EN), CH-Romandie und Tessin (FR/IT), FL und Südtirol. Minotti hat 8 Sprachen, Fretz DE/EN | `labs/page.js:21`, `yacht-interior/page.js:31`, `arbeitsweise/page.js:43` | Yacht und Arbeitsweise zuerst auf EN, danach Planer-UI EN. FR/IT nur Landingpages. *Team Übersetzungen läuft.* | M–L | mittel-hoch: Yacht-Leads sind fast immer EN |
| 7 | **P1** | Google-Profil, Startseite | Bewertungen: 4,2 aus 6, die letzte von 2022. Die Shops werben mit Bewertungszahlen im fünfstelligen Bereich [nicht verifiziert]. `/de/bewerten` existiert | Research 20 A.2; Startseite: „Bewertung“ 0-mal | Bewertungsprozess über `/bewerten` nach jedem Auftrag und Café-Besuch (QR). Ab 30 Bewertungen echte Google-Sterne auf Startseite und Beratungsseite zeigen (nur echte, mit Quelle). Kein Premium-Wettbewerber tut das | S (Code) / M (Prozess) | hoch: Local Pack Lochau/Bregenz/Lindau |
| 8 | **P1** | Produktseiten | Die Produktseite verlinkt nicht in die Planer bzw. den AR-Viewer (Westside Soft: „AR“ 1-mal, „Sofaplaner“ 1-mal, beides nur im Menü). Der Vorteil „sehen Sie es in Ihrem Raum“ kommt am Kaufmoment nicht an | `curl` der Produktseite, Textanalyse | Kontext-Knopf auf der Produktseite: „In 3D/AR ansehen“ (wenn ein Modell existiert), „Als Ecksofa planen“ (Minotti-Sofas), „In Ihrer Küche planen“ (Küchen) | S–M | hoch: das stärkste Wettbewerbsfeature genau dort, wo Connox und AmbienteDirect nur ein Foto haben |
| 9 | **P1** | `content/ratgeber/*` | Alle 8 Ratgeber haben [prüfen]-Stellen, der Hub ist daher noindex. Themen wie „Was kostet ein Minotti-Sofa“ und „Möbel in die Schweiz“ sind genau die Kauffragen, die kein Wettbewerber beantwortet | `grep -l "[prüfen]"` liefert 8 von 8 | Zuerst die 3 Kauffragen-Artikel prüfen und freigeben (Kosten Sofa, Kosten Küche, Schweiz). Danach 2 Artikel pro Monat | M | hoch: SEO-Long-Tail mit Kaufabsicht |
| 10 | **P1** | extern: Minotti- und Poliform-Locator | Höttges und Fretz werden über den Locator gefunden, Platzhirsch nicht. Die Website kann noch so gut sein, der markengetriebene Traffic geht an den Wettbewerber 12 km weiter | Research 04 Abschnitt 1 | Inhaber: Locator-Aufnahme bei Agent Kilga und Poliform klären. Die Seite bleibt bei „zeigen und planen mit Produkten von“ (Händler-Aussage nur ClassiCon/Ezarri) | – (Inhaber) | sehr hoch, aber außerhalb des Codes |
| 11 | **P2** | `/atelierverkauf`, `lib/commerce/mode.js` | Ausstellungsstücke und Abverkauf gibt es bei reiter, Fretz, Gamma, Aufschnaiter (NOW) und Bertolo. Bei Platzhirsch ist `ATELIER_MODE=off` gesetzt und keine CSV vorhanden. Das ist der einzige Ort, an dem echte Preise erlaubt und wirksam wären | mode.js Z. 4–10 | CSV mit 10–20 Ausstellungsstücken samt echtem Preis, `ATELIER_MODE=anfrage` (Reservierung ohne Zahlung, rechtlich schon gelöst) | S (Code) / M (Pflege) | mittel: schneller Umsatz, Preis-Signal für Google |
| 12 | **P2** | Navigation, `/beratung` | Es gibt keinen Bereich für Architekten und Objekt. AmbienteDirect Projects, Connox Projects, Minotti Download-Area und Bihler Objekt holen sich damit die Großaufträge (Hotels, Bauträger, Yacht-Werften) | Startseite-Links: kein `/architekten` oder `/objekt` | Seite „Für Architekten & Bauträger“: Planungsdaten anfragen (DWG/3D über Hersteller), Musterbestellung, Projektpreise, Ansprechpartner. Mit dem Portal (Gewerke) koppeln | M | hoch: ein Objektauftrag entspricht 20–50 Privat-Sofas |
| 13 | **P2** | Produktseite „In Lochau“ | „Ob das Stück ausgestellt ist, klären wir vor Ihrem Besuch“ ist ehrlich, aber schwächer als ein sichtbarer Status. Kein Wettbewerber zeigt Ausstellungsstücke pro Produkt. Das wäre ein einfacher Vorsprung | Produktseite Westside Soft | Backoffice-Feld „ausgestellt“ (ja/nein/Teil) und das Badge „In Lochau zum Probesitzen“. Filter im Katalog | M | mittel-hoch: Besuchsgrund, bestes Argument gegen Shops |
| 14 | **P2** | Startseite | Ein „Warum Platzhirsch statt Shop“-Vergleich fehlt. Die Shops gewinnen über den Preis, Platzhirsch kann über Probesitzen, Planung, Montage, Portal und Café gewinnen (Research 07: nicht über den Preis antreten) | Startseite H2-Liste | Kurzer Abschnitt „Online gefunden – in Lochau entschieden“ mit 4 Punkten, ohne Wettbewerber zu nennen (UWG) | S | mittel |
| 15 | **P3** | Labs-Hub `/de/labs` | Status-Labels wie „Labs-Prototyp“ und „Beta“ wirken gegenüber Minotti-Niveau unfertig, sobald sie öffentlich sind | features.js `STATUS` | Bei der Integration Status-Badges öffentlich ausblenden, nur intern anzeigen | S | gering-mittel |
| 16 | **P3** | Performance Dev | Der Erstaufruf im Dev-Server dauerte bis 239 s. Das liegt an der Last durch die parallelen Teams und ist kein Befund für Produktion. Den Vorsprung „schnellste Seite der Branche“ (Lighthouse 87 gegenüber 53–59) nach Einbau von three.js und model-viewer erneut messen | curl-Zeiten | Lighthouse-Budget in CI für Startseite und Produktseite, Planer-Bundles nur auf Planer-Routen | S | mittel: Ranking, mobil |

---

## Quick-Wins (≤ ½ Tag, große Wirkung)

1. **Booking-Link einschalten** (`BOOKING_PROVIDER=link`) oder „Termin wählen“ in „Termin anfragen“ umbenennen. Damit wird Höttges sofort überholt.
2. **Ezarri-Link koppeln:** Kein Menü- oder Startseiten-Link, solange `/de/ezarri` 404 liefert.
3. **Kontext-Knöpfe auf der Produktseite:** „In 3D/AR ansehen“ und „Als Sofa planen“. Damit erscheint das Alleinstellungsmerkmal am Kaufmoment.
4. **`/de/arbeitsweise` ins Menü** (Das Haus) und einen Satz mit Harald auf die Startseite, sobald das erste echte Skizzenfoto da ist.
5. **QR „Bewerten“ im Café** über die bestehende Seite `/de/bewerten`. Ziel: 30 Google-Bewertungen bis Januar.

---

## Belege (Statuscodes localhost:3000, 28.10.2026)

| Route | Status | Bedeutung |
|---|---|---|
| `/de/labs`, `/de/labs/kuechenplaner`, `/sofaplaner`, `/ar-viewer`, `/stilfinder`, `/concierge`, `/dreilaender` | 200 (noindex) | Features existieren, aber nur unter /labs |
| `/de/kuechenplaner`, `/de/sofaplaner` | **404** | sprechende URLs nach Inhaber-Entscheidung 9 noch nicht vorhanden |
| `/de/ezarri` | **404** | Startseite und Menü verlinken bereits darauf |
| `/de/gutscheine`, `/de/atelierverkauf` | 404 | Modus `off`, so gewollt bis zur Freigabe |
| `/de/arbeitsweise`, `/de/projekte`, `/de/ratgeber`, `/de/portal`, `/de/bewerten`, `/de/einkaufen-aus-der-schweiz`, `/de/yacht-interior`, `/de/outdoor-gartenplanung` | 200 | vorhanden (Projekte und Ratgeber noindex bzw. leer) |

Screenshot `qa-screenshots/expertenrat-gesamt/wettbewerb/de--iphone.png`: Der Hero-CTA heißt „Termin wählen“, ein Kalender existiert aber nicht (Befund 2). Weitere Aufnahmen liefen bei Abgabe noch, der Dev-Server war ausgelastet.

## Gesamturteil in einem Satz

Funktional ist Platzhirsch der Region um Jahre voraus. Der Konkurrenz voraus sind aber nur Features, die Google und Kunden auch sehen. Beim Beweis (Projekte, Bewertungen, Handzeichnungen) und beim Termin liegt Höttges heute noch gleichauf, Aufschnaiter und reiter sogar vorn. Dort entscheidet sich Platz 1.

**Quellen (abgerufen am 28.10.2026):** https://www.hoettges.at/ · https://reiter.design/ · https://www.fretz.de/de · https://www.aufschnaiter.com/ · https://www.minotti.com/en · https://www.ambientedirect.com/ · https://www.connox.at/ · finnishdesignshop.com (403, nicht abrufbar). Ältere Quellen siehe Marktresearch 03, 04 und 20.
