# Neuland-Rat: vier Funktionen, die es so noch bei keinem Einrichter gibt

**Stand:** 28.10.2026 · **Gremium:** Zukunftsforscher, Innovations-Scout, Lead-Engineer, Luxus-Verkaufschef · **Status:** Auswahl und baubare Spezifikation, noch kein Code
**Bindung:** `teamleiter/inhaber-entscheidungen.md` (Nr. 7 Ezarri, Nr. 8 Handzeichnung, Nr. 9 Labs integrieren), `expertenrat/00-design-bibel.md`, `features/wow-spezifikation.md`, `features/usp-handzeichnung-designprozess.md`, `features/usp-durchdringungsplan.md`, `wachstumsrat/zukunft.md`, `wachstumsrat/3d-vr-render.md`, `wachstumsrat/interaktion.md`, `wachstumsrat/00-wachstumsplan.md`, `expertenrat-gesamt/wettbewerb.md`.
**Kennzeichnung:** **[Fakt]** mit Quelle · **[Schätzung]** eigene Herleitung · **[prüfen]** vor Umsetzung verifizieren.

---

## 0. Ergebnis in einem Satz

Platzhirsch baut nicht „noch einen Planer“. Wir bauen vier Dinge, die die Recherche bei keinem Möbelhändler, Interior-Studio oder Hersteller als laufendes Produkt gefunden hat: **(1) das Haus in Lochau als begehbaren, fotoechten Raum mit klickbaren Ausstellungsstücken, (2) den Raum des Kunden als 3D-Zwilling aus einem Handyvideo im Portal, mit echten Maßen statt KI-Bild, (3) eine offene Schnittstelle, über die KI-Assistenten den Katalog lesen und einen Termin anfragen, (4) das echte Licht am Ort des Kunden zu jeder Stunde und Jahreszeit in allen Planern.** Alle vier stellen Haralds Arbeit (Vor Ort, Handzeichnung, Modell) in den Mittelpunkt, statt sie durch KI zu ersetzen.

| # | Auswahl | Wow/Neid | Umsatzhebel | Baubar (Personentage, ohne Inhaber-Zeit) | Harte Grenze, die es berührt |
|---|---|---|---|---|---|
| N1 | **Das Haus, jederzeit offen:** Showroom Lochau als Gaussian Splat mit Hotspots | sehr hoch | Termine aus CH/DE/FL, Café-Besuch, Produktseiten | 6–8 PT + 1 Aufnahmeabend | Herstellerrechte im Bild, LCP, Datenmenge |
| N2 | **Ihr Raum als Zwilling:** Handyvideo → 3D-Raum im Portal, mit echten Produktmaßen und Haralds Skizze | sehr hoch (Fernkunde sieht seine eigene Wohnung) | spart Aufmaßfahrten, Visualisierungs-Paket, Yacht/CH | 7–10 PT | Datenschutz Wohnraum, keine KI-Bilder nach außen |
| N3 | **Platzhirsch für KI-Assistenten:** MCP-Server + WebMCP + Termin-Werkzeug | hoch in Presse und Fachwelt | Anfragen aus ChatGPT/Claude/Gemini, frühe Position | 3–5 PT | Formulare nie echt absenden, Händler-Aussagen |
| N4 | **Bodensee-Licht:** Sonnenstand nach Ort, Uhrzeit und Jahreszeit in Küchenplaner, Ezarri-Pool, Portal und Arbeitsweise | hoch (sofort spürbar) | Küchen- und Poolentscheidungen, USP „Vor Ort“ sichtbar | 4–6 PT | reduced motion, Performance mobil |

**Verworfen** (Begründung in Abschnitt 6): öffentliche KI-Raumvorschau aus dem Handyfoto (Massenware, widerspricht Nr. 8), Material-Bibliothek mit Musterbox (gibt es bei Material Bank, für Ezarri schon gebaut), Projekt-Zeitreise (es gibt noch 0 freigegebene Projekte).

---

## 1. Recherche: Gibt es das schon?

Suche am 28.10.2026 (WebSearch, standard). Die Treffer sind überwiegend Anbieterblogs. Sie zeigen den Stand, beweisen aber kein Nichtvorhandensein. Deshalb ist „nicht gefunden“ als **[Schätzung]** zu lesen.

| Kandidat | Was es gibt | Was es nicht gibt | Urteil |
|---|---|---|---|
| Showroom als Splat mit Produkt-Hotspots | Agenturleitfäden nennen Möbel als passende Kategorie, belegen aber keinen Händler im Einsatz ([utsubo](https://www.utsubo.com/blog/gaussian-splatting-guide), [bigeye](https://www.bigeyeagency.com/insights/3d-gaussian-splatting-for-marketing)). Ein Showroom-Prototyp mit XGRIDS und SuperSplat auf einem Touchscreen ([wegetaroundnetwork](https://www.wegetaroundnetwork.com/topic/21364/rd-interactive-3d-retail-experience--no-code-workflow-with-xgrids)). Splat-Erweiterung für Shopify, 142 $/Jahr ([radiancefields](https://radiancefields.com/how-to-load-gaussian-splatting-in-shopify)). Wayfair ließ Lieferanten Produkte als Splat erfassen ([monks](https://media.monks.com/reports/labs-report-34-gaussian-splatting), undatiert) | Kein Möbelhändler mit **begehbarem eigenen Ausstellungsraum, klickbaren Stücken, Merkliste und Termin**. Ebenso fand `3d-vr-render.md` §4 nur Prototypen | **Neuland** im Handel, Technik reif |
| Kundenraum aus Handyvideo als 3D | AR-Anbieter (GlamAR, Threekit, Zolak, Cylindo) setzen Produkte maßstäblich ins Live-Kamerabild ([glamar](https://www.glamar.io/blog/best-ar-try-on-solutions-for-furniture-brands-in-2026)). Imersian zeigt Produkte in einem „digital rekonstruierten Raum“ ([imersian](https://www.imersian.com/industry/furniture)). IKEA Kreativ setzt Katalogmöbel in Raumscans ([IKEA Newsroom](https://ikea.com/us/en/newsroom/corporate-news/ikea-launches-new-ai-powered-digital-experience-empowering-customers-to-create-lifelike-room-designs-pub58c94890)) | Kein Anbieter, der aus dem Video des Kunden einen **fotoechten, begehbaren Raum** macht, ihn im **Kundenportal** ablegt und ihn als Grundlage für die **Handzeichnung eines Designers** nutzt. Die Suche „Foto → KI → Designer zeichnet von Hand“ ergab keinen einzigen Treffer | **Neuland**, weil Designer-geführt statt KI-geführt |
| Agenten-Schnittstelle (MCP) | Allgemeine E-Commerce-MCP-Server (Kea Labs), ein Hobby-Projekt mit Rakuten-Möbelsuche (0 Sterne), ein brasilianischer Supermarkt mit Terminbuchung ([enterprisedna](https://enterprisedna.co/directories/mcp/one8943-ai-furniture-hub), [kealabs](https://kealabs.com/mcp-server), [glama](https://glama.ai/mcp/servers/xtvmhtdlg8)). WebMCP: Chrome-Origin-Trial, Wix-Doku, Cloudflare-Vorschau seit 06.08.2026 ([martech.zone](https://martech.zone/acronym/webmcp/), [Wix](https://dev.wix.com/docs/develop-websites/articles/get-started/ai-agents/about-the-wix-web-mcp), [noqta](https://noqta.tn/en/blog/webmcp-browser-ai-agents-web-standard-guide-2026)) | Kein Premium-Einrichter und kein Möbelhändler im DACH-Raum mit **Katalog + Showroom + Terminwunsch** als MCP-Werkzeug | **Neuland** für Einrichter, Standard noch jung |
| Lichtsimulation nach Ort und Jahreszeit | Profi-Werkzeuge: Planoplan (Ort, Sonnenhöhe, Richtung), Cyncly Spaces Flex (Regler), SOLIDWORKS Visualize ([planoplan](https://planoplan.com/en/help-center/documentation/visualization/sunlight/), [cyncly](https://is.support.cyncly.com/hc/en-us/articles/24075298175121-Spaces-Flex-How-to-adjust-natural-lighting), [solidworks](https://blogs.solidworks.com/tech/2020/07/visualize-quick-tips-sunlight-environments-part-2.html)) | Kein Händler, der dem **Endkunden im Browser** das Licht **seines** Wohnorts in **seiner** Küche oder an **seinem** Pool zeigt, mit eigenem HDRI vom See | **Neuland** im Endkundenkontakt |
| KI-Raumvorschau aus dem Foto | Massenware mit Gratiskontingent: Canva, Picsart, GenRoom, RoomGPT, Interior AI ([canva](https://www.canva.com/ai-interior-design/), [picsart](https://picsart.com/blog/how-to-use-ai-for-interior-design/), [genroom](https://genroom.io/en/blog/how-to-redesign-room-with-ai)) | – | **verworfen** |
| Material-Bibliothek mit Musterbox | Digitale Texturbibliotheken (Architextures, Texturama, Poly Haven). Musterversand für Architekten bietet Material Bank seit Jahren [Fachwissen, nicht neu recherchiert] | – | **verworfen**, Ezarri-Teil schon gebaut |

---

## 2. N1 „Das Haus, jederzeit offen“: der Showroom Lochau als begehbarer Raum

### 2.1 Was der Kunde erlebt

Um 23 Uhr in Zürich auf dem Sofa: „Studio ansehen“. Nach wenigen Sekunden steht man im Café in Lochau, fotoecht, und geht in 6–10 Stationen durch Wohnen, Küche und Outdoor/Ezarri. An jedem Ausstellungsstück ein ruhiger Punkt: Name, Maße, „Merken“, „In 3D/AR“, „Hier Probe sitzen: Termin anfragen“. Umschalter **Tag / Abend** (zwei Aufnahmen). An der Station „Haralds Tisch“ liegen die echten Skizzen und das Modell, sobald der Inhaber Material liefert. Vorher bleibt die Station weg und wird nicht durch einen Platzhalter ersetzt.

**Warum Neid:** Höttges, Fretz und Gamma haben Fotos oder Street View. Minotti hat Renderings. Niemand hat seinen echten Raum fotoecht zum Begehen und mit Produktlinks.

### 2.2 Umsatzlogik

- Der Weg nach Lochau kostet aus St. Gallen, Konstanz oder Zürich 45–90 Minuten. Der Rundgang verkauft **den Besuch**, nicht das Möbel. Zielgröße: Terminanfragen von Seiten mit Rundgang-Teaser gegenüber Seiten ohne (A/B, nur mit Einwilligung gemessen).
- Hotspots führen in Produktseite, Merkliste und Terminwunsch. Damit wird jede Station zu einem Einstieg in den vorhandenen Lead-Weg.
- [Schätzung] Ein zusätzlicher Premium-Termin mit Abschluss pro Quartal trägt die Kosten (Ø-Auftrag laut Zukunftsrat 15–30 T€).

### 2.3 Technik (lokale GPU, kein Python)

| Schritt | Werkzeug (Lizenz) | Ort |
|---|---|---|
| Video → Einzelbilder, Schärfeauswahl | ffmpeg (vorhanden, als Werkzeug genutzt, nicht ausgeliefert), Laplace-Varianz in Node (`sharp`, Apache-2.0) | `tools/splat/frames.mjs` |
| Kameraposen | COLMAP (BSD-3) als Binary, CUDA-Build auf der RTX 4060 | `tools/splat/poses.mjs` |
| Training | **Brush** (Apache-2.0, Rust/WebGPU, CLI, kein Python), Ziel 1–3 Mio. Gaussians je Zone in 8 GB VRAM [im Pilot messen] | `tools/splat/train.mjs` |
| Bereinigung, Maßstab | SuperSplat (MIT [prüfen]) von Hand, Messmarke im Bild | Handarbeit, Ablauf steht in dieser Datei und in `3d-vr-render.md` §3.1.3 |
| Komprimierung | `@playcanvas/splat-transform` (MIT [prüfen]) → SOG mit LOD | `tools/splat/pack.mjs` |
| Fallback-Video | ffmpeg `h264_nvenc` (NVENC) und AV1 CPU, aus einer aufgezeichneten Kamerafahrt | `tools/splat/video.mjs` |
| Anzeige | **Spark** (`@sparkjsdev/spark`, MIT, three.js ≥ r180; im Projekt three 0.183) über die vorhandene R3F-Basis | `src/components/Showroom/` |

Rohdaten bleiben außerhalb des Repos in `../platzhirsch-gpu-tools/showroom/<datum>/`. Ins Projekt kommen nur `public/showroom/<zone>/<stimmung>/` (SOG-Bündel, Poster AVIF/WebP, Video). Über 50 MB gesamt entscheidet das Code-Team über einen Datei-Host. Alle Pfade bleiben gleich, Grundlage ist ein Manifest.

**Route:** `/[locale]/showroom` (DE/EN/FR/IT, Texte im Namespace `Showroom`). Einstiege (Integrationsteam): Startseite „Studio ansehen“, `ueber-uns/platzhirsch`, Kontakt, Produktseite „Im Studio ansehen“ (nur wenn ein Hotspot `productPath` trägt). Vor dem Code die Guides in `node_modules/next/dist/docs/` zu dynamic import, metadata und sitemap lesen (AGENTS.md).

**Datenmodell** `src/lib/showroom/hotspots.json` wie in `3d-vr-render.md` §3.1.4, ergänzt um zwei Felder:
- `rechte`: `"ok"` | `"pruefen"`. Bei `"pruefen"` erscheint **kein** Hotspot. Ist das Stück im Bild prominent, wird die Station anders gesetzt oder die Zone zugeschnitten.
- `marke`: Klartext. Händler-Wort („Vertragshändler“) nur bei `ClassiCon` und `Ezarri`, per Unit-Test erzwungen.

### 2.4 Akzeptanzkriterien

1. Startseite und alle anderen Seiten: **LCP unverändert** (≤ 2,0 s Produktions-Messung in `platzhirsch-prodtest`), kein Spark-/three-Code im Bundle vor dem Klick auf „Rundgang starten“ (`next/dynamic`, `ssr: false`).
2. `/showroom` selbst: LCP ist das Posterbild (AVIF, ≤ 120 KB), ≤ 2,0 s. Erste ruhige Splat-Ansicht ≤ 4 s nach Klick auf „Fast 4G“, erster Download ≤ 20 MB, Viewer-JS ≤ 350 KB gzip.
3. ≥ 30 fps im geführten Modus auf Mittelklasse-Handy [an echten Geräten messen]. Schwache Geräte bekommen die niedrigste LOD-Stufe und `dpr` 1.
4. **WCAG 2.2 AA:** Canvas `aria-hidden`, alle Stationen und Hotspots zusätzlich als Liste (`<details>`), Tastatur (Weiter/Zurück, Tab auf Hotspots), Fokus sichtbar, Ziele ≥ 24 px. `prefers-reduced-motion`: Schnitte statt Kamerafahrten, kein Autoplay.
5. Ohne WebGL2 oder bei Klick „Als Video ansehen“: Video (AV1 + H.264) und Fotogalerie, gleiche Stationstexte.
6. Keine Anfrage an fremde Hosts, keine Cookies. Messereignisse (`showroom_start`, `_station`, `_hotspot`, `_action`) nur nach Einwilligung über das vorhandene `trackEvent`.
7. Sichtbarer Stand („Ausstellung, Stand: November 2026“). Hotspots mit `imShowroom: false` erscheinen nicht.
8. SEO: Seite indexierbar, `VideoObject` und `FurnitureStore` (Landstraße 11, 6911 Lochau), Eintrag in Sitemap und `llms.txt` erst, wenn Assets vorhanden sind.
9. Tests grün mit `PW_WORKERS=1`: `tests/e2e/showroom.spec.js` (Laden, Liste ohne WebGL, Tastatur, reduced motion, 375 px ohne Querscroll, keine Fremd-Requests), `tests/unit/showroom-hotspots.test.mjs` (Schema, Händler-Wort-Regel, `rechte`-Filter).

### 2.5 Budget, Zeit, Fallbacks

- **Fremdkosten:** 0 € (Handy-Pilot, Brush) bis ca. 350–500 € (Kameramiete für 2 Abende, optional Postshot-Lizenz). Hosting vernachlässigbar.
- **Zeit:** Pilot Zone Küche: 1 Aufnahmeabend (Inhaber oder Team) + 1–2 Tage Verarbeitung. Web-Einbindung 6–8 PT, parallel zum Pilot machbar, weil das Manifest zuerst mit einem freien CC0-Testsplat läuft (nur Entwicklung, nie öffentlich).
- **Fallback 1:** Splat-Qualität < 8/10 in der Abnahme (Glas, Spiegel) → betroffene Station als echtes Foto, Rest als Splat.
- **Fallback 2:** Es gibt keine Aufnahme → die Route ist nicht verlinkt und liefert 404 (Feature-Schalter `SHOWROOM_PUBLIC`, gekoppelt an ein vorhandenes Manifest per Unit-Test, wie bei Ezarri). Kein Platzhalter im Livegang.
- **Fallback 3:** Herstellerrichtlinie verbietet Darstellung [rechtlich prüfen, v. a. Minotti] → `rechte: "pruefen"`, Zone ohne diese Insel zuschneiden. Minotti-Herstellerbilder werden dabei nie verwendet oder verändert; gezeigt wird die eigene Ausstellung.

**Benötigt vom Inhaber:** ein Abend nach Ladenschluss (Aufnahme nach Protokoll `3d-vr-render.md` §3.1.2), schriftliche Einwilligung sichtbarer Mitarbeiter, Liste der ausgestellten Stücke.

---

## 3. N2 „Ihr Raum als Zwilling“: aus dem Handyvideo in den 3D-Raum, für Harald

### 3.1 Was der Kunde erlebt

Ein Paar in Vaduz oder ein Eigner mit Boot in Lindau öffnet den vorhandenen Handy-Upload (QR, `/upload`) und filmt 90 Sekunden lang langsam seinen Raum. Zwei Tage später liegt im **Kundenportal** unter „Ihr Raum“: **die eigene Wohnung fotoecht, zum Drehen und Begehen.** Darin stehen die besprochenen Stücke als maßgenaue, ruhige Volumen („ClassiCon · Bibendum · 98 × 89 × 74 cm“, Werte aus dem Backoffice), daneben **Haralds echte Handskizze** dieses Raums als zweite Ebene, sobald er sie gezeichnet hat. Der Kunde kommentiert einen Punkt im Raum („Hier steht das Klavier“), auch per Sprachnachricht (vorhanden im Portal).

**Das Neue:** Andere setzen KI-Möbel in ein Foto. Bei uns entsteht aus dem Video ein echter Raum, und **ein Designer arbeitet darin**. Die Technik ersetzt die Aufmaßfahrt nicht ganz, aber die Vorbereitung. Der USP wird stärker: „Wir kommen zu Ihnen, und wir kennen Ihren Raum schon, bevor wir klingeln.“

### 3.2 Umsatzlogik

- Fernkunden (CH, FL, Yacht, Zweitwohnsitz) bekommen einen ersten Schritt ohne Termin. Laut Zukunftsrat spart das 1–2 Aufmaßfahrten pro Fernprojekt.
- Verkaufbar als Teil des Pakets „Ihr Raum, fotorealistisch“ (`3d-vr-render.md` §3.2, Preise vom Inhaber, bei Auftrag angerechnet).
- Bindung vor dem Angebotsvergleich: Wer seinen Raum im Portal hat, vergleicht seltener [Schätzung, über Abschlussquote der Portal-Projekte messen].

### 3.3 Technik

- **Eingang:** vorhandener Upload (Video bis 300 MB, 120 s, EXIF/GPS entfernt, `src/lib/upload/config.js`). Neu: Upload-Kategorie „Raumvideo“ mit Aufnahmehilfe (3 Sätze und eine kleine Grafik: langsam, drei Höhen, Licht an, keine Personen).
- **Verarbeitung intern:** Job-Runner `tools/raumzwilling/run.mjs` nutzt dieselbe Kette wie N1 (`tools/splat/*`), läuft lokal auf der RTX 4060, nie in einer fremden Cloud. Laufzeit [Schätzung] 20–60 min je Raum.
- **Maßstab:** Das Team klickt im internen Werkzeug zwei Punkte an (z. B. Türlaibung) und gibt das Maß ein. Alternativ legt der Kunde ein A4-Blatt auf den Boden (in der Aufnahmehilfe). Abweichung im Test ≤ 2 % auf 3 m [im Pilot messen]. Im Portal steht sichtbar: „Maße aus Video, Aufmaß vor Bestellung“.
- **Platzierung:** kleines internes Werkzeug `/[locale]/portal/raum/[projekt]/bearbeiten` (nur Team-Rolle): Volumen aus Katalogmaßen (`src/lib/concierge/catalog.js` liefert Maße) setzen, drehen, speichern als JSON. Kein nachgebautes Design, nur weiche Volumen (Stil wie AR-Viewer B7 in `3d-vr-render.md`).
- **Anzeige im Portal:** `/[locale]/portal/raum/[projekt]`, Spark-Viewer aus N1 (gemeinsame Komponente `SplatCanvas` aus `src/components/Showroom/`), Ebenen „Raum · Planung · Skizze“. Datei wird über eine geschützte Route mit Portal-Session ausgeliefert, nie über `public/`.
- **Datenschutz:** Wohnräume sind sensible Daten. Einwilligungstext beim Upload ergänzen, Löschfrist wie Upload-Retention, Löschknopf im Portal, keine Weitergabe, keine Verwendung als Referenz ohne neue Einwilligung. Text für die Datenschutzerklärung als Vorschlag an Recht (`Marktresearch/recht/`), nicht eigenmächtig live.
- **KI:** keine generierten Bilder im Portal oder auf der Seite (Nr. 8). Eine spätere interne KI-Materialvariante bleibt Harald vorbehalten und wird, falls je gezeigt, nach AI Act Art. 50 gekennzeichnet. Nicht Teil dieses Auftrags.
- **Portal-Stand:** Der Mock-Adapter reicht für Bau und Test. Die Frappe-Anbindung folgt dem Portal-Team.

### 3.4 Akzeptanzkriterien

1. Ein Testvideo (eigener Raum des Teams, nie Kundendaten im Repo) wird lokal in ≤ 60 min zu einem SOG ≤ 30 MB verarbeitet und im Portal angezeigt.
2. Maßstabs-Abgleich: zwei bekannte Strecken im Testraum weichen ≤ 2 % ab.
3. Ohne Portal-Session: 401/Redirect, kein Zugriff auf die Datei (E2E-Test), keine Datei unter `public/`.
4. Kommentar an einem Raumpunkt wird im Mock-Store gespeichert. Es wird keine Mail echt versendet (Mailer im Test gemockt).
5. Ohne WebGL2: Fotos aus dem Video (3 Standbilder) plus Planungsliste, gleiche Kommentare.
6. WCAG 2.2 AA wie N1, Volumen zusätzlich als Tabelle (Stück, Maße, Position in Worten).
7. Tests grün mit `PW_WORKERS=1`: `tests/e2e/portal-raum.spec.js`, `tests/unit/raumzwilling.test.mjs` (Maßstab, Platzierungs-JSON, Zugriffsschutz).

### 3.5 Budget, Zeit, Fallbacks

- **Fremdkosten:** 0 € (lokale GPU, freie Werkzeuge). **Zeit:** 7–10 PT, davon 3 für Portal-Ansicht, 2 Platzierungswerkzeug, 2 Job-Runner/Maßstab, 1–2 Tests und Datenschutz.
- **Fallback 1:** Video zu dunkel oder zu schnell → automatische Meldung „Bitte noch einmal, langsamer“ mit Grund (Schärfewert), statt einem schlechten Raum.
- **Fallback 2:** Splat unbrauchbar (Glas, kleine Räume) → nur Standbilder plus Grundriss. Harald arbeitet wie heute mit Fotos.
- **Fallback 3:** Portal noch nicht live → Freigabe als einmaliger Magic-Link nur für diesen Raum (vorhandene `magicLink.js`).

### 3.6 Umsetzung (Stand 28.10.2026, Team N2)

**Ergebnis:** Das Feature ist gebaut und mit dem Mock-Adapter getestet. Portal-Ansicht, Team-Werkzeug, geschützte Auslieferung, Video-Upload, Kommentare und Sprachnachrichten, Löschknopf, Raum-Link und Job-Runner laufen. Die GPU-Kette aus N1 (ffmpeg → COLMAP 4.2.1 CUDA → Brush 0.3 → splat-transform 3.10) ist mit einem synthetischen Testvideo **vollständig durchgelaufen: 12,8 min bis zum SOG (1,0 MB)**. **Offen** ist die Maß-Akzeptanz an einem echten Raum (siehe Messungen).

**URLs** (nur Deutsch, noindex, noch nicht im Menü)

| Was | Adresse |
|---|---|
| Übersicht „Ihr Raum“ | `/de/portal/raum` |
| Raum des Kunden (Ebenen Raum · Planung · Skizze) | `/de/portal/raum/<projekt>` (Demo: `PRJ-2026-014` ist bereit, `PRJ-2026-021` wartet auf ein Video) |
| Team-Werkzeug | `/de/portal/raum/<projekt>/bearbeiten` (nur mit Team-Rolle) |
| Team-Anmeldung, Übersicht, Postausgang | `/de/portal/raum/team` (Schlüssel `RAUM_TEAM_TOKEN` mit mind. 24 Zeichen; Entwicklung: `dev-team-raum`; in Produktion ohne Variable 404) |
| Raum-Link (Fallback 3) | `/api/portal/raum/link?token=…`; ist der Link ungültig oder schon benutzt, folgt `/de/portal/raum/link` |

**Dateien**

- `src/lib/raumzwilling/`:
  - `config.js`: Grenzen, Status, Aufnahmehilfe, Kategorie `raumvideo`
  - `massstab.js`: Maßstab aus zwei Punkten oder A4-Blatt, Boden aus drei Punkten, Wand nach hinten, Zentrieren, Prüfprotokoll
  - `platzierung.js`: zod-Schema der Volumen, Überschneidungen, „Position in Worten“
  - `qualitaet.js`: Wiederholungsbitte mit Grund (zu dunkel, unscharf, zu schnell, zu kurz)
  - `sog.js`: SOG v2 packen und entpacken, gegen splat-transform 3.10.1 geprüft
  - `picken.js`: Punkt unter dem Sehstrahl, Deckkraft wird aufsummiert
  - `standbild.js`: CPU-Renderer
  - `testraum.js`: synthetischer Raum mit bekannten Maßen
  - `zugriff.js` (Rollen team, kunde, gast; reine Funktionen mit Tests), `access.js`, `team.js`, `teilen.js`
  - `store.js`: Ablage in `.data/raumzwilling`, nie in `public/`
  - `seed.js`: Demo-Räume, nur mit Mock-Adapter in der Entwicklung
  - `katalog.js`: Concierge-Katalog plus geprüfte Maße aus `arviewer/dims.json`
  - `notify.js`: Postausgang ohne Versand
  - `einwilligung.js`
  - `medien.js`: GPS-Daten in MP4/MOV überschreiben, Signatur von Audiodateien prüfen
  - `schemas.js`, `modell.js`, `api.js`, `assets.js`, `assets-node.mjs`
- `src/app/api/portal/raum/**`:
  - `[projekt]`: GET, Löschen per DELETE oder Formular-POST
  - `datei/[bereich]/[name]`: geschützte Dateien
  - `kommentar`, `platzierung`, `massstab`, `skizze`
  - `video`: Upload in 4-MB-Stücken
  - `aktion`: Status, Link, Wandnamen, Demo zurücksetzen
  - `katalog`, `team`, `link`
- `src/app/[locale]/portal/raum/**`: Übersicht, `[projekt]`, `[projekt]/bearbeiten`, `team`, `link`
- `src/components/Portal/Raum/`:
  - `SplatSzene.js`: eigener WebGL2-Splat-Renderer auf three mit Sortier-Worker, Volumen und Picking; **kein neues npm-Paket**
  - `RaumViewer.js`, `sogLaden.js`, `webgl.js`, `RaumAnsicht.js`, `RaumEditor.js`, `Kommentare.js`, `SprachAufnahme.js`, `VideoUpload.js`, `Aufnahmehilfe.js`, `Standbilder.js`, `Grundriss.js`, `VolumenTabelle.js`, `LoeschenBereich.js`, `TeamAbmelden.js`
- `tools/raumzwilling/`:
  - `run.mjs`: Job-Runner; `--frist` löscht Räume nach Ablauf der Löschfrist
  - `lib.mjs`
  - `testvideo.mjs`: synthetisches Testvideo (NVENC), `--dunkel` und `--schnell` für die Gegenprobe
  - `pruefe-massstab.mjs`: Maß-Akzeptanz am echten Durchlauf
  - `pruefbild.mjs`: QA-Screenshot mit GPU
- Tests: `tests/unit/raumzwilling.test.mjs` (17 Tests grün), `tests/e2e/portal-raum.spec.js` (9 Tests grün, `PW_WORKERS=1`, Projekt desktop)
- Recht: `Marktresearch/recht/vorschlag-raumzwilling-datenschutz.md` (Vorschlag, nicht live)

**Entscheidungen**

- **Eigener Viewer statt Spark.** `@sparkjsdev/spark` ist nicht installiert, und `package.json` gehört nicht zu N2. Der eigene Renderer (EWA-Projektion, 16-Bit-Zählsortierung im Worker, neu gezeichnet nur bei Änderung) liest SOG direkt. three lädt erst mit der 3D-Ansicht (`next/dynamic`, `ssr:false`). Stellt N1 auf Spark um, kann der Viewer dessen Komponente nutzen. Das Datenformat bleibt gleich.
- **URLs ohne Dateiendung** (`…/datei/splat/means_l`). `next.config.js` setzt für `*.webp` und `*.webm` „public, max-age=1 Jahr“ und überschreibt damit den Header der Route. Private Raumdaten wären so in geteilten Caches gelandet. Die Route antwortet jetzt mit `private, no-store`.
- **Maße nur aus geprüften Herstellerangaben** (`arviewer/dims.json`). Fehlen sie, zeigt das Werkzeug „Maße fehlen“, und das Team trägt sie von Hand ein (Quelle ist Pflicht). Volumen sind Quader mit markierter Vorderkante, kein nachgebautes Design.
- **Skizze nur echt.** Der Upload verlangt die Bestätigung „Scan oder Foto einer echten Handzeichnung von Harald Menghin“, und das Bild wird ohne Metadaten neu kodiert. Die Demo zeigt bewusst keine Skizze, sondern „Haralds Skizze folgt.“
- **Keine Mails.** Meldungen landen nur im Postausgang auf der Team-Seite (`versendet: false`). Weder der Mailer noch das Backoffice werden aufgerufen.
- **Demo-Raum** ist ein synthetischer Testraum aus einem Rechenmodell, sichtbar gekennzeichnet. Keine Aufnahme, keine KI, keine Kundendaten im Repo.

**Messungen**

| Prüfung | Ergebnis |
|---|---|
| Testvideo 80 s (synthetisch, 1280 × 720, NVENC) → SOG | **12,8 min**, **1,0 MB**, 83 358 Gaussians, 90 von 96 Bildern registriert. Laufzeit: Frames 0,1 min, COLMAP 2,2 min, Brush (15 000 Schritte) 7,3 min, Packen 3,2 min |
| Dunkles Testvideo | Wiederholungsbitte nach 0,1 min ohne GPU-Lauf: „zu dunkel (23 von 255, nötig ≥ 45)“ und „unscharf“ |
| Maßhaltigkeit der Rekonstruktion | Kamerazentren gegen die bekannten Positionen: Restfehler **1,2 cm** im 4,2-m-Raum (etwa 0,3 %) |
| Maßstab per Klick (Akzeptanz ≤ 2 % auf 3 m) | **Am synthetischen Splat nicht erreicht: 2,1 bis 16 %**, je nach Referenz; mit 30 000 Schritten nicht besser. Ursache ist das Testvideo, nicht die Kette: Die Wände sind fast ohne Struktur, deshalb füllt Brush den Raum mit Nebel (88 % der Gaussians unter 13 % Deckkraft), und Klicks landen 10 bis 80 cm vor der Wand. Die Rechnung selbst ist im Unit-Test geprüft: ≤ 2 % bei ±1 cm Klickfehler, wenn die Wandlänge die Referenz ist |
| SOG-Decoder gegen splat-transform | Position < 0,05 mm, Rotation, Skala und Farbe stimmen |
| Viewer | Auf der RTX 4060 (ANGLE/D3D11) flüssig. Ohne GPU (SwiftShader) taugen nur die Standbilder |
| QA-Screenshots | 4 Geräte × 4 Seiten, 0 Konsolenfehler, kein Querscroll; Ablage `qa-screenshots/fertig/neuland-n2-…/` |

**Integration (außerhalb der N2-Dateien, bitte durch das Integrations- bzw. Portal-Team)**

1. `next.config.js`: Mikrofon auch für `/de/portal/raum/:projekt` freigeben (`microphone=(self)`, wie bei `/de/portal/projekte/:id`). Bis dahin entstehen Sprachnachrichten über die Aufnahme-App des Handys (`<input accept="audio/*" capture>`).
2. `next.config.js`: Die Cache-Regeln für Bild- und Videoendungen sollten `/api/` ausnehmen, so wie `cmx/`.
3. Handy-Upload: Kategorie aus `RAUMVIDEO_CATEGORY` in `src/lib/upload/config.js` übernehmen und `Aufnahmehilfe` im `UploadClient` zeigen. Der Job-Runner verarbeitet die Datei dann mit `--video <datei>`. Im Portal gibt es den Upload schon direkt.
4. Portal-Navigation: Punkt „Ihr Raum“ (`/de/portal/raum`) in `navItems.js` ergänzen, dazu ein Link von der Projektseite.
5. Den Datenschutztext nach der Freigabe übernehmen (Vorschlag liegt in `Marktresearch/recht/`).

**Offen**

- **Pilot mit einem echten Raum** (Handyvideo des Teams, keine Kundendaten): ≤ 60 min und ≤ 2 % auf 3 m nachmessen. Dabei die Qualitätsschwellen kalibrieren (Schärfe ≥ 60, Bewegung ≤ 38) und das Packen mit und ohne Floater-Filter `-F` vergleichen.
- Löschfrist durch den Inhaber festlegen (derzeit `retentionConfirmed: false`). Datenschutztext durch den Anwalt freigeben lassen.
- Frappe-Anbindung: Raum-Datensatz und Dateien liegen heute im lokalen Store; die Anbindung folgt dem Portal-Team. Der Job-Runner wird von Hand gestartet (`node tools/raumzwilling/run.mjs <projekt>`), er ist kein Dienst.

---

## 4. N3 „Platzhirsch für KI-Assistenten“: Katalog, Haus und Terminwunsch als Werkzeuge

### 4.1 Was passiert

Jemand fragt Claude, ChatGPT oder einen Browser-Agenten: „Wo kann ich am Bodensee ein ClassiCon-Stück Probe sitzen und mich beraten lassen?“ Der Assistent ruft unsere Werkzeuge auf und bekommt verlässliche Daten: Produkte mit Maßen und Link, Adresse Landstraße 11, Öffnungszeiten, Café, Leistungen, die Arbeitsweise mit Handzeichnung. Er kann einen **Terminwunsch** stellen. Der Mensch bestätigt per E-Mail (Double-Opt-in), erst dann sieht das Team die Anfrage. Gebucht oder bestellt wird nichts.

### 4.2 Warum jetzt

- **[Fakt]** WebMCP läuft als Origin-Trial in Chrome, Cloudflare bietet eine Vorschau, Wix dokumentiert es ([martech.zone](https://martech.zone/acronym/webmcp/), [Wix](https://dev.wix.com/docs/develop-websites/articles/get-started/ai-agents/about-the-wix-web-mcp)). Die API-Namen sind zwischen den Quellen noch uneinheitlich → Feature-Erkennung, kein fester Vertrag.
- Die Werkzeuge existieren schon im Concierge (`src/lib/concierge/tools.js`: `search_products`, `list_categories`, `products_in_category`, `list_brands`, `brand_overview`, `showroom_info`, `request_appointment`). Nach außen öffnen kostet Tage, nicht Monate.
- Wer zuerst da ist, wird von den Assistenten als Quelle gelernt. Der Verkaufschef: „Der Agent empfiehlt den Ort und fragt den Termin an. Das reicht.“

### 4.3 Technik

- **MCP-Server:** `src/app/api/agent/mcp/route.js`, Streamable HTTP, zustandslos (JSON-RPC 2.0: `initialize`, `tools/list`, `tools/call`). Entweder `@modelcontextprotocol/sdk` (MIT, exakte Version ≥ 14 Tage alt) oder eine schlanke eigene Umsetzung; Entscheidung nach Bundle- und Edge-Prüfung. Gleiche Implementierung wie der Concierge über `src/lib/agent/adapter.js`, kein zweiter Katalogcode.
- **Werkzeuge** wie `zukunft.md` §3.3, ergänzt um `arbeitsweise` (die 7 Schritte aus `src/lib/arbeitsweise/copy.js`) und `ezarri_collections`. Jede Antwort enthält die kanonische URL und `price: "auf Anfrage"`.
- **`request_appointment`:** Modus `AGENT_APPOINTMENT_MODE` = `off` | `dryrun` (Standard, auch im Dev) | `live` (erst nach Deploy-OK und Datenschutztext). Pflicht `agent_consent: true`. Weg wie `/api/beratung_anfrage` mit `guardForm`, Quelle `agent`. In Tests und Dev wird **nie** an das Backoffice gesendet.
- **WebMCP:** Client-Komponente `src/components/Agent/WebMcpTools.js` registriert dieselben Lese-Werkzeuge, nur wenn `navigator.modelContext` (oder `document.modelContext`) vorhanden ist. Eingebunden einmal im Layout durch das Integrationsteam (eine Zeile in `client-layout.js`, nicht in dieser Datei-Liste).
- **Auffindbarkeit:** Verweis in `/llms.txt` (eine Zeile, über `src/lib/seo/llms.js` durch das SEO-Team), Server-Beschreibung unter `/.well-known/mcp.json` [Format prüfen, noch kein Standard].
- **Schutz:** Rate-Limit pro IP (vorhandenes `limiter.js`-Muster), nur Lesen außer Terminwunsch, Antworttexte ohne Superlative, Händlerstatus nur ClassiCon und Ezarri (Unit-Test über alle Werkzeug-Ausgaben mit Testkatalog).

### 4.4 Akzeptanzkriterien

1. `tools/list` liefert alle Werkzeuge mit JSON-Schema. Ein MCP-Inspector bzw. Testclient kann `search_products` aufrufen und bekommt Name, Marke, Maße, URL.
2. Kein Werkzeug-Text enthält „Vertragshändler/autorisiert/offiziell“ bei anderen Marken als ClassiCon und Ezarri (Unit-Test).
3. `request_appointment` ohne `agent_consent` → Fehler. Im Modus `dryrun` → Referenz plus Satz „Nichts ist gebucht, bitte bestätigen Sie die E-Mail“, **kein** Netzwerkaufruf (Test mit gesperrtem fetch).
4. Rate-Limit greift (Test). Backend-Ausfall → saubere Fehlermeldung, kein Stacktrace.
5. WebMCP-Komponente: ohne API kein Fehler in der Konsole, keine Auswirkung auf LCP/INP (lädt nach `requestIdleCallback`).
6. Tests: `tests/unit/agent-mcp.test.mjs`, `tests/e2e/agent-mcp.spec.js` (`PW_WORKERS=1`).

### 4.5 Budget, Zeit, Fallbacks

- **Fremdkosten:** 0 €. **Zeit:** 3–5 PT.
- **Fallback:** Ändert sich der WebMCP-Entwurf, bleibt der MCP-Server unberührt. Wird MCP von Assistenten kaum genutzt, kostet der Betrieb nichts. Gemessen wird `quelle=agent` in der Lead-Attribution.
- **Benötigt vom Inhaber/Recht:** Abschnitt „Anfragen über KI-Assistenten“ für die Datenschutzerklärung freigeben, bevor `live`.

### 4.6 Umsetzung (Stand 28.10.2026, Team N3)

**Ergebnis:** gebaut, getestet, Stufe „fertig“ für den Lesebetrieb. Terminwünsche laufen im Modus `dryrun` (Standard), bis der Datenschutztext freigegeben ist.

**URLs**

| Was | Adresse |
|---|---|
| Seite (sprechende URL, noch nicht im Menü) | `/de/ki-assistenten` (index, nur Deutsch; EN/FR/IT 404 wie `/de/arbeitsweise`) |
| MCP-Server | `https://platzhirsch.studio/api/agent/mcp` (POST, Streamable HTTP, zustandslos, ohne Anmeldung, CORS offen) |
| Server-Beschreibung | `/.well-known/mcp.json` |
| Double-Opt-in | `/de/ki-assistenten/bestaetigen#<token>` (noindex) → `POST /api/agent/confirm` |

**Dateien**

- `src/lib/agent/`: `config.js` (Pfade, Protokollversionen, Modus, Rate-Limits, `PRIVACY_TEXT_APPROVED`), `tools.js` (9 Werkzeug-Definitionen, eine Quelle für MCP, WebMCP und Seite), `validate.js` (zod, strikt), `adapter.js` (Werkzeuge → Concierge-Katalog, Claim-Schutz, Fehlerbehandlung), `facts.js` (Showroom aus `site.js`, Arbeitsweise aus `arbeitsweise/copy.js`, Ezarri aus `collections.json`), `appointment.js` (Terminwunsch, Bestätigungs-Mail, Weitergabe), `seal.js` (AES-256-GCM-Token), `clean.js` (Claim-Guard über alle Strings), `jsonrpc.js`, `http.js`, `rate.js`, `client.js` (Browser-Aufruf), `copy.js` (Seitentexte), `deps.js` (einzige Server-Verdrahtung, `server-only`)
- `src/app/api/agent/mcp/route.js`, `src/app/api/agent/confirm/route.js`, `src/app/.well-known/mcp.json/route.js`
- `src/app/[locale]/ki-assistenten/page.js`, `…/bestaetigen/page.js`
- `src/components/Agent/`: `AgentPage.js`, `ToolDemo.js`, `CopyEndpoint.js`, `ConfirmClient.js`, `WebMcpTools.js`
- Tests: `tests/unit/agent-mcp.test.mjs` (21), `tests/e2e/agent-mcp.spec.js` (11, Projekt desktop)
- Fremde Datei, eine Zeile: `src/components/Navbar/shellNav.js` (`"ki-assistenten"` in `GERMAN_ONLY_FIRST_SEGMENTS`, sonst wird `tests/unit/r6-shell-perf.test.mjs` rot; gleiche Praxis wie bei `arbeitsweise`)

**Entscheidungen**

- **Eigene schlanke Umsetzung statt `@modelcontextprotocol/sdk`:** gebraucht werden nur `initialize`, `ping`, `tools/list`, `tools/call`, ohne Sitzungen und ohne SSE. Rund 100 Zeilen, kein neues Paket (0 €, keine Lizenz- und Update-Pflege). Vertrag: MCP-Spezifikation 2025-11-25 (ausgehandelt werden auch 2025-06-18 und 2025-03-26). GET/DELETE → 405, Stapel → 400, Benachrichtigungen → 202, unbekanntes Werkzeug → −32602, ungültige Eingaben als `isError`-Ergebnis (der Assistent kann sich korrigieren).
- **Kein zweiter Katalogcode:** `deps.js` ruft `searchProducts`, `listCategories`, `productsInCategory`, `listBrands`, `brandOverview` aus `src/lib/concierge/catalog.js`. Maße kommen aus dem Produktdetail (`fetchProduktNewByPathField`, Next-Datencache 1 h) über `src/lib/shop/dimensions.js`: Tabelle in cm nur bei eindeutiger Beschriftung, sonst der Originaltext, sonst `null` (nichts geraten).
- **Jede Antwort** hat eine absolute, kanonische `url` (immer `https://platzhirsch.studio/…`) und `price: "auf Anfrage"`. **Keine Bild-URLs**: Herstellerbilder (Minotti u. a.) sind für die eigene Website freigegeben, nicht zur Weitergabe an Dritte.
- **Claim-Schutz:** Alle Strings laufen durch `findClaims` aus `src/lib/legal/claims.js`; Sätze mit Händler-Aussage (außer Claim-Register: heute ClassiCon, Ezarri sobald dort eingetragen) oder Superlativ werden entfernt. Die Ezarri-Zeile kommt aus `dealerLine()` (heute neutral; mit `EZARRI_PUBLIC` und Register-Eintrag automatisch die Händler-Aussage).
- **Server-Beschreibung:** Einen Standard gibt es noch nicht (SEP-1649 „Server Card“, weitergeführt in PR #2127; Pfad zwischen `/.well-known/mcp.json`, `/.well-known/mcp` und `/.well-known/mcp/server-card.json` offen). Die Datei enthält die gemeinsamen Felder aller Entwürfe; ändert sich der Entwurf, ändert sich nur diese Route.
- **WebMCP:** laut Chrome-Doku „Imperative API“ (Origin-Trial) `document.modelContext.registerTool(tool, { signal })`; ältere Entwürfe und Polyfills nutzen `navigator.modelContext`. Die Komponente prüft beides, meldet nur die 8 Lese-Werkzeuge an (Präfix `platzhirsch_`, `readOnlyHint`), nach `requestIdleCallback`, abmeldbar per `AbortSignal`. Ohne API: kein Code-Pfad, keine Konsole, kein Netz. `execute` ruft denselben MCP-Server.

**Terminwunsch (`request_appointment`)**

| `AGENT_APPOINTMENT_MODE` | Wirkung |
|---|---|
| `off` | nur Link `…/beratung?quelle=agent` und Telefon, keine Daten verarbeitet |
| `dryrun` (Standard, auch Dev/Test) | Angaben geprüft, Referenz `AG-XXXXXX`, „Nichts ist gebucht, bitte bestätigen Sie die E-Mail.“, **kein Netzwerkaufruf**; mit Geheimnis zusätzlich `confirm_preview_url` (Token `dry: true`, geht nie ans Backoffice) |
| `live` | Bestätigungs-Mail an die Person (signierter Webhook), erst nach ihrem Klick Weitergabe an das Backoffice im Format von `/api/beratung_anfrage` (`beratungSchema`, `forwardJson`), Herkunft „Kanal: KI-Suche (Assistent) · Quelle: agent / mcp“ |

`live` wirkt nur, wenn **alles** erfüllt ist, sonst `off`: `NODE_ENV=production`, `PRIVACY_TEXT_APPROVED = true` in `src/lib/agent/config.js` (Code-Zeile, wie `EZARRI_PUBLIC`), `AGENT_SECRET` (≥ 32 Zeichen), `AGENT_MAIL_WEBHOOK_URL` (https) und `AGENT_MAIL_WEBHOOK_SECRET` (≥ 32 Zeichen; Header `X-Platzhirsch-Signature` = HMAC-SHA256 des Body). In Dev/Test ist `live` unmöglich (→ `dryrun`). Pflicht `agent_consent: true`. Der Terminwunsch wird nirgends gespeichert: er steckt verschlüsselt im Link (48 h), der Link steht im Fragment (nie in Server-Logs), Bestätigung einmal je Referenz.

**Schutz:** Rate-Limit je IP (Logik `concierge/limiter.js`, eigene Instanz): 60 Nachrichten/min, 1500/Tag; Terminwunsch 5/h, 12/Tag, global 300/Tag; Bestätigungsseite 20/h. Proxy-Hops wie Concierge (`CONCIERGE_PROXY_HOPS`). Anfragen ≤ 32 KB. Backoffice-Ausfall → `isError` mit ruhiger Meldung („Katalog gerade nicht erreichbar … Telefon“), nie ein Stacktrace; Showroom, Arbeitsweise und Ezarri laufen ohne Backoffice weiter.

**Seite `/de/ki-assistenten`:** Auftakt mit Beispiel-Abfrage (echte Daten aus `site.js`), Adresse mit Kopierknopf, Verbinden (Remote-Server, `claude mcp add --transport http …`, `mcp.json`, Browser-Agenten), 9 Werkzeuge, das eine dunkle Kapitel „So sieht Ihr Assistent uns“ (echte Werkzeug-Aufrufe, Anfrage und Antwort lesbar oder als JSON, Startzustand vom Server ohne Netz), Kern-USP „Ihr Raum beginnt auf Papier“ mit Link zur Arbeitsweise, Terminwunsch in 4 Schritten mit ehrlichem Modus-Hinweis, Spielregeln, FAQ (= FAQPage-JSON-LD), Abschluss. Keine Bilder, kein KI-Material; die H1 ist LCP.

**Prüfung:** `node --test tests/unit/agent-mcp.test.mjs` 21/21 grün (fetch in jedem Test gesperrt), `PW_WORKERS=1 npx playwright test agent-mcp.spec.js --project=desktop` 11/11 grün (inkl. axe bei 375 px, Überlauf, WebMCP mit simuliertem `document.modelContext`, Bestätigungsseite). `tools/qa/shoot.mjs` auf iPhone/Pixel/iPad/Desktop für Seite und Bestätigung: 0 Konsolenfehler, 0 fehlgeschlagene Requests, kein Überlauf. Video der Vorführung (Desktop, iPhone) mit Einzelbildern: `qa-screenshots/fertig/neuland-n3-…/video/`. ESLint ohne Befund.

**Integration (andere Teams, je eine Zeile):**

1. `src/app/[locale]/client-layout.js`: `const WebMcpTools = dynamic(() => import('@/components/Agent/WebMcpTools'), { ssr: false });` und `{consentReady && <WebMcpTools />}` neben dem Concierge (lädt nach Idle, rendert nichts). Bis dahin ist WebMCP nur auf `/de/ki-assistenten` aktiv.
2. `src/lib/seo/llms.js`: „- [Platzhirsch für KI-Assistenten (MCP-Server)](https://platzhirsch.studio/de/ki-assistenten): Katalog, Showroom, Arbeitsweise und Terminwunsch als Werkzeuge; Endpunkt https://platzhirsch.studio/api/agent/mcp“.
3. Menü/Footer („Das Haus“) und Sitemap-Eintrag `/de/ki-assistenten` (SEO-Team).
4. Messung: Leads mit `quelle=agent` bzw. Herkunft „Quelle: agent / mcp“ in der Lead-Attribution.

**Datenschutz-Textvorschlag (für den Anwalt, vor `live`):** „Anfragen über KI-Assistenten: Bitten Sie einen KI-Assistenten (z. B. Claude oder ChatGPT), bei uns einen Terminwunsch anzufragen, übermittelt er Name, E-Mail, Telefon, Thema und Wunschzeiten an uns. Wir speichern diese Angaben zunächst nicht, sondern senden Ihnen eine E-Mail mit einem Bestätigungslink (48 Stunden gültig). Erst wenn Sie bestätigen, verarbeiten wir die Anfrage wie eine Beratungsanfrage über unser Formular (Art. 6 Abs. 1 lit. b DSGVO). Ohne Bestätigung werden die Angaben nicht gespeichert. Für den Versand der Bestätigungs-E-Mail nutzen wir [Dienstleister eintragen]. Lesende Anfragen von Assistenten (Katalog, Öffnungszeiten) enthalten keine Personendaten; zum Schutz vor Missbrauch zählen wir sie je IP-Adresse höchstens 24 Stunden im Arbeitsspeicher.“

**Offen:** Datenschutztext freigeben, dann `PRIVACY_TEXT_APPROVED`, Mail-Webhook und `AGENT_SECRET` setzen (erst dann `live`); Produktions-Messung LCP/INP der neuen Seite in `platzhirsch-prodtest` (im Dev ist die H1 LCP, keine Bilder, kein Aufruf beim Laden); Übersetzung der Seite EN/FR/IT (die Werkzeuge liefern schon Links in allen Sprachen); Integrationszeilen oben; bei mehreren Server-Instanzen geteilter Limit-Speicher (`setStore`, wie Concierge).

---

## 5. N4 „Bodensee-Licht“: das echte Licht am Ort des Kunden

### 5.1 Was der Kunde erlebt

Im Küchenplaner, im Ezarri-Pool und in der Portal-Planung gibt es ein ruhiges Rad: **Ort** (Lochau voreingestellt, Liste von rund 80 Orten der Region von Chur bis Ulm, oder Koordinaten von Hand), **Fensterrichtung** (Kompass), **Datum** und **Uhrzeit**. Der Kunde zieht von 7 bis 19 Uhr und sieht, wie die Dezembersonne flach über die Steinplatte streift oder wie das Ezarri-Mosaik im Juli um 16 Uhr im Wasser leuchtet. Der Satz dazu: „Das Licht vor Ort lernen wir bei Ihnen kennen. Hier sehen Sie, warum.“ Auf der Arbeitsweise-Seite zeigt Schritt 2 „Vor Ort“ denselben Effekt an einem einfachen Raummodell. So wird der USP (ein, zwei Tage vor Ort für Licht und Klima) zum ersten Mal erlebbar statt behauptet.

### 5.2 Umsatzlogik

- Küchen und Pools sind die höchsten Einzeltickets. Die Material- und Farbentscheidung (Stein, Front, Mosaikfarbe) hängt am Licht. Ein Kunde, der das am eigenen Ort sieht, kommt mit einer konkreten Frage zum Termin [Schätzung, über „Licht benutzt → Anfrage“ messen].
- Jede Lichteinstellung wandert in Merkliste, PDF und Anfrage („Ihre Küche, Lochau, Fenster Süd-West, 15. Dezember, 8:30“). Damit entsteht eine Gesprächsgrundlage für Harald.

### 5.3 Technik

- **Sonnenstand:** reine Funktion `src/lib/licht/sonne.js` (NOAA-Algorithmus, kein Paket), Zeitzone Europe/Vienna bzw. vom Ort, Sommerzeit. Ergebnis: Azimut, Höhe, Tageslichtfarbe.
- **Himmel und Stärke:** `src/lib/licht/himmel.js` bildet Höhe → Intensität der Directional Light, Farbtemperatur (ca. 2.000 K Sonnenaufgang bis 5.500 K Mittag), HDRI-Belichtung. Nutzt die geplanten Presets `src/lib/three/lightPresets.js` (Wachstumsrat 3D §3.3), sobald es sie gibt, sonst eigene Werte.
- **Komponenten:** `src/components/Licht/LichtRad.js` (Bedienelement, native `input type="range"` und `select`, keine eigene Gestensteuerung), `src/components/Licht/useSonnenlicht.js` (Hook für R3F-Szenen: setzt Richtung, Schattenkamera, Intensität, nur bei Änderung rendern, `frameloop="demand"`).
- **Eigenes HDRI vom See** (Inhaber nimmt eine Belichtungsreihe auf, Zusammenführung mit freier Software, Web-Version ca. 200 KB). Bis dahin das vorhandene CC0-HDR.
- **Einbau** in Küchenplaner, Ezarri-Konfigurator und Portal-Planung über je 5–10 Zeilen durch deren Teams (Integrationspunkte unten). Der Kern liegt in eigenen Dateien.
- **Ortsliste:** `src/lib/licht/orte.json` (Name, Land, Breite, Länge), statisch. Keine Geocoding-Anfrage an Dritte, keine Standortabfrage.

### 5.4 Akzeptanzkriterien

1. Sonnenstand-Funktion: Abweichung ≤ 0,5° gegenüber NOAA-Referenzwerten für Lochau an 4 Stichtagen (Sonnenwende, Tagundnachtgleiche) und 3 Uhrzeiten (Unit-Test mit festen Zahlen).
2. Bei Sonne unter dem Horizont nur Himmels-/Kunstlicht, kein Schatten von unten.
3. `prefers-reduced-motion`: kein automatisches Durchlaufen des Tages, nur Sprünge beim Ziehen.
4. Mobil: Schattenkarte ≤ 1024², Bildrate im Planer sinkt um höchstens 10 % [messen]. Keine Auswirkung auf LCP, weil nur in bereits geladenen 3D-Szenen aktiv.
5. Tastatur und Screenreader: Regler beschriftet, Wert als Text („8:30 Uhr, Sonne 9° über dem Horizont, aus Südosten“).
6. Lichtzustand im URL-Parameter und im Anfrage-Text.
7. Tests: `tests/unit/licht-sonne.test.mjs`, `tests/e2e/licht.spec.js` (Regler, Tastatur, reduced motion, 375 px).

### 5.5 Budget, Zeit, Fallbacks

- **Fremdkosten:** 0 €. **Zeit:** 4–6 PT (2 Kern und Tests, 1 Bedienelement, 1–3 für die drei Einbaupunkte zusammen mit den Teams).
- **Fallback:** Ohne WebGL zeigt das Rad nur den Text (Sonnenhöhe, Richtung, Aufgang/Untergang) und eine kleine SVG-Sonnenbahn. Das ist ehrlich und trotzdem nützlich.

### 5.6 Umsetzung (Stand 28.10.2026, Team N4)

**URL:** `/de/bodensee-licht` (nur Deutsch, EN/FR/IT 404; noch nicht im Menü, das verlinkt die Integration). Lichtzustand in der URL: `?ort=lochau&fenster=225&datum=2026-12-15&zeit=08:30[&szene=pool]`, eigene Koordinaten `?lat=47.5&lon=9.75` (Region 45,5–49,5° N, 7,5–11,5° O).

| Datei | Inhalt |
|---|---|
| `src/lib/licht/sonne.js` | NOAA-Sonnenstand als reine Funktion (Azimut, Höhe inkl. Refraktion, Zeitgleichung, Deklination), MEZ/MESZ nach EU-Regel ohne Intl, Auf-/Untergang, Sonnenmittag, bürgerliche Dämmerung, Tagesbahn, Fenster-Sonne (scheint/Einfall/Lichtfleck-Tiefe), Sonnenzeiten durchs Fenster |
| `src/lib/licht/himmel.js` | Höhe → Sonnenstärke (Kasten-Young-Luftmasse, Meinel), Farbtemperatur 2.000–5.500 K, Kelvin → sRGB, Himmelsfarben, Phasen (goldene/blaue Stunde, Dämmerung, Nacht), HDRI-Belichtung, Kunstlicht-Schalter. `basis` nimmt künftige `src/lib/three/lightPresets.js` auf |
| `src/lib/licht/szene.js` | Sonnenrichtung in Szenen-Koordinaten (Vereinbarung: −Z schaut nach `fenster`), Schattenkarte mobil 1024² / Desktop 2048², Slots `LOCHAU_HDRI` (null bis Inhaber liefert) und `CC0_HDRI` |
| `src/lib/licht/zustand.js` | Standardzustand, URL lesen/schreiben (`parseLicht`, `lichtParams`, `lichtQuery`), Werttext („8:30 Uhr, Sonne 9° über dem Horizont, aus Südosten“), Kurz- und Anfrage-Text, Merklisten-Schlüssel |
| `src/lib/licht/orte.json` | 87 Orte Chur–Ulm (AT 24, DE 33, CH 25, LI 5), statisch; Lochau = Studio-Koordinaten aus `src/lib/site.js` |
| `src/components/Licht/LichtRad.js` | Bedienelement: Ort (select mit Ländergruppen + eigene Koordinaten), Fensterrichtung (range 5°-Schritte + Schnellwahl O/SO/S/SW/W + Kompass), Datum (date + 4 Stichtage), Uhrzeit (range 5 min, `aria-valuetext` = Werttext, Aufgang/Mittag/Untergang/Jetzt), „Tag abspielen“ nur auf Knopfdruck, fehlt bei reduced motion |
| `src/components/Licht/useSonnenlicht.js` | `useSonnenlicht(zustand)` und `<SonnenLicht>` für R3F: Directional Light mit Farbe/Stärke/Schattenkamera, HemisphereLight, `scene.environmentIntensity`; `invalidate()` nur bei Änderung (`frameloop="demand"`); unter dem Horizont aus und ohne Schatten |
| `src/components/Licht/SonnenBahn.js` | SVG-Sonnenbahn (Horizont, Auf-/Untergang, Fenster-Sonnenzeiten als Messinglinie, aktueller Stand) und Kompass – zugleich Rückfall ohne WebGL |
| `src/components/Licht/LichtSzene.js` | Vorführszene Küche (Fenster 2,0 × 1,2 m, Insel, Hocker, Pendelleuchten 2.700 K) und Pool (6 × 3 m, Mosaik im Browser erzeugt, Pergola/Mauer für Schatten). Himmel: Preetham-Modell (three.js Sky.js) mit derselben Sonnenrichtung, daraus PMREM-Umgebung. Texturen CC0 ambientCG; Ausfall einer Textur → Grundfarben (Fehlergrenze), solange sie laden → Szene ohne Texturen |
| `src/components/Licht/LichtSeite.js`, `licht.module.css` | Seite: Bühne (mobil sticky unter dem Header, damit man beim Ziehen das Licht sieht), Lichtrad, Tag, Aktionen; URL per `history.replaceState`; Merken (Merkliste mit `href` und Lichtzustand), Link teilen, Lichtblatt (Druck/PDF mit Standbild, Sonnenbahn, Zeiten, Link), „Mit dieser Lichtstudie anfragen“ → `/de/beratung?produkt=…` (Formular vorbefüllt, nichts wird gesendet) |
| `src/app/[locale]/bodensee-licht/page.js` | Server-Seite, H1 = LCP, 3D erst nach dem ersten Bild per `next/dynamic` |
| `tests/unit/licht-sonne.test.mjs`, `tests/e2e/licht.spec.js` | 10 Unit-Tests, 8 E2E-Tests (375 px), grün |

Eine Zeile außerhalb der eigenen Dateien: `"bodensee-licht"` in `GERMAN_ONLY_FIRST_SEGMENTS` (`src/components/Navbar/shellNav.js`), sonst wird `tests/unit/r6-shell-perf.test.mjs` rot (Sprachumschalter führt EN/FR/IT sonst auf eine 404).

**Akzeptanz (§5.4):**
1. Genauigkeit: Referenzwerte mit dem offiziellen NOAA-Rechner (gml.noaa.gov/grad/solcalc/main.js, am 28.10.2026 geladen und in Node ausgeführt) für das Studio, 4 Stichtage 2026 (20.3., 21.6., 23.9., 21.12.) × 9:00/12:30/16:00. Abweichung ≤ 0,01° (Test verlangt ≤ 0,5° und zusätzlich ≤ 0,05°); Auf-/Untergang und Mittag ≤ 1 min. ✔
2. Unter dem Horizont: Sonne aus, kein Schatten, Himmel/Dämmerung, ab ca. −3° Kunstlicht (Pendel 2.700 K, Poolbeleuchtung). ✔ (Unit + E2E)
3. Reduced motion: kein „Tag abspielen“, Hinweis, nur Sprünge. ✔ (E2E)
4. Mobil: Schattenkarte 1024², DPR ≤ 1,5, kein MSAA; Szene rendert nur bei Änderung. LCP = H1 (Text), 3D lädt danach. **Bildrate im Planer [messen beim Einbau]**: Der Hook selbst rechnet nichts pro Frame. ◐
5. Tastatur/Screenreader: alle Regler nativ und beschriftet, `aria-valuetext`, ruhige Live-Ansage bei Sprüngen, axe ohne serious/critical. ✔
6. Lichtzustand in URL, Merkliste, Lichtblatt (PDF) und Anfrage-Text. ✔
7. Tests grün (`PW_WORKERS=1`). ✔

**Fallback ohne WebGL:** Hinweis in der Bühne, Werttext, SVG-Sonnenbahn mit Auf-/Untergang, Fakten und Fenster-Sonnenzeiten (E2E mit abgeschaltetem WebGL).

**Ehrlichkeit auf der Seite:** „Berge, Bäume, Gebäude, Wolken und Spiegelungen sind nicht enthalten“ + USP-Block „Das Licht vor Ort lernen wir bei Ihnen kennen. Hier sehen Sie, warum.“ (Nr. 8). Schematisches Raummodell, keine KI-Bilder, keine Herstellerbilder, keine Preise.

**Abweichung, begründet:** Die Vorführszene nutzt als Umgebung den physikalischen Himmel (Preetham) statt des CC0-Studio-HDR, weil dessen feste Studiolichter einer wandernden Sonne widersprechen. Für Szenen mit eigenem HDR (Küchenplaner) liefert `lichtWerte().hdriBelichtung` die Belichtung; `LOCHAU_HDRI` wird gesetzt, sobald die Belichtungsreihe vom See vorliegt.

**Einbau durch die anderen Teams (je 5–10 Zeilen):**
```js
import LichtRad from "@/components/Licht/LichtRad";
import { SonnenLicht } from "@/components/Licht/useSonnenlicht";
import { standardZustand, lichtParams } from "@/lib/licht/zustand";
const [licht, setLicht] = useState(() => standardZustand());
<LichtRad wert={licht} onChange={setLicht} kompakt />            // Seitenleiste
<SonnenLicht zustand={licht} ziel={[0, 1, 0]} bereich={4} />      // in <Canvas frameloop="demand" shadows>
// Anfrage/Merkliste: kurzText(licht), anfrageText(licht, url), lichtParams(licht)
```
Küchenplaner: −Z der Szene = Fensterwand, sonst `drehung` setzen; Ezarri-Pool: `fensterLabel="Blick vom Haus"`; Portal-Planung: Zustand im Planungsdatensatz speichern; Arbeitsweise Schritt 2 „Vor Ort“: Link oder eingebettete Bühne auf `/de/bodensee-licht?zeit=08:30&datum=<21.12.>`.

**Offen:** Menü-/Startseiten-Link und Einbau in die drei Planer + Arbeitsweise (Integration), Bildrate mobil im Planer messen, Produktions-LCP in `platzhirsch-prodtest` messen, Lochau-HDRI vom Inhaber, Übersetzungen EN/FR/IT. QA: `qa-screenshots/fertig/neuland-n4-…/` (Seite auf 4 Geräten, Bühnen-Raster r4–r6, Video `video/bodensee-licht-mobil.webm` mit Kontaktbogen). Hinweis: Headless-Chromium mit GPU zeigt eine teils außerhalb des Viewports liegende WebGL-Fläche verschoben an (`seite/desktop-nach-laden.png`); nach dem Scrollen korrekt (`desktop-gescrollt.png`), im Swiftshader-Lauf nie aufgetreten.

---

## 6. Verworfen, mit Begründung

| Kandidat | Grund |
|---|---|
| Öffentliche KI-Raumvorschau aus dem Handyfoto | Massenware (Canva, Picsart, GenRoom, IKEA Kreativ). Ein generiertes Bild des Kundenraums nach außen schwächt Nr. 8 („Designs, die leben“, nur echtes Material) und braucht Art.-50-Kennzeichnung. N2 löst dasselbe Bedürfnis ehrlich: echter Raum, echte Maße, echte Skizze |
| Material-Bibliothek mit Makro-Texturen und Musterbox | Texturbibliotheken und Musterversand (Material Bank) gibt es. Für Ezarri sind Mosaik-Texturen, Konfigurator und Musterlink schon gebaut (`features/ezarri-konfigurator.md`). Für Stoffe und Stein fehlen Bildrechte. Kein Neuland |
| Projekt-Zeitreise im Portal | Die Idee ist gut (Skizze → Modell → Rendering → Foto), aber `PROJEKTE = []`. Ohne echtes Material würde sie leer starten. Sie kommt automatisch, sobald N2 und das Portal echte Projekte tragen |
| WebXR/VR als eigene Welt | Safari auf iPhone ohne WebXR. VR kommt als Option in N1 (`immersive-vr` nur bei Unterstützung), nicht als eigenes Feature |

---

## 7. Reihenfolge, Abhängigkeiten, Datei-Zuschnitt

1. **N3** zuerst (3–5 PT, keine Inhaber-Lieferung, nur Datenschutztext für `live`).
2. **N4** parallel (4–6 PT, Einbau mit Küchen-, Ezarri- und Portal-Team).
3. **N1** startet mit dem Pilotabend (Inhaber), Web-Einbindung parallel mit Testsplat.
4. **N2** baut auf der Splat-Kette und dem Viewer aus N1 auf.

**Exklusive Dateien (überschneidungsfrei):**

| # | Neue Dateien/Ordner |
|---|---|
| N1 | `src/app/[locale]/showroom/**`, `src/components/Showroom/**`, `src/lib/showroom/**`, `public/showroom/**`, `tools/splat/**`, `src/messages`-Vorschlag `Marktresearch/digital/features/showroom-messages-vorschlag.json`, `tests/e2e/showroom.spec.js`, `tests/unit/showroom-hotspots.test.mjs` |
| N2 | `src/app/[locale]/portal/raum/**`, `src/app/api/portal/raum/**`, `src/components/Portal/Raum/**`, `src/lib/raumzwilling/**`, `tools/raumzwilling/**`, `tests/e2e/portal-raum.spec.js`, `tests/unit/raumzwilling.test.mjs` |
| N3 | `src/app/api/agent/**`, `src/app/.well-known/mcp.json/**`, `src/lib/agent/**`, `src/components/Agent/**`, `tests/unit/agent-mcp.test.mjs`, `tests/e2e/agent-mcp.spec.js` |
| N4 | `src/lib/licht/**`, `src/components/Licht/**`, `tests/unit/licht-sonne.test.mjs`, `tests/e2e/licht.spec.js` |

**Integrationspunkte (gehören anderen Teams, je wenige Zeilen):** Menü/Startseite/Produktseite-Links auf `/showroom` (N1), Upload-Kategorie „Raumvideo“ in `src/lib/upload/config.js` und Portal-Navigation (N2), eine Zeile in `client-layout.js` und `src/lib/seo/llms.js` (N3), Einbau des Hooks in Küchenplaner-, Ezarri- und Portal-Szene sowie Arbeitsweise Schritt 2 (N4). Ein `messages`-Vorschlag je Feature, Übersetzung DE/EN/FR/IT durch das i18n-Team.

**Harte Grenzen, für alle vier geprüft:** kein zweiter Dev-Server, kein `npm run build` im Repo (Messung in `platzhirsch-prodtest`), Formulare und Mails nie echt, Händler-Aussagen nur ClassiCon und Ezarri (Unit-Test), keine Preise, keine erfundenen Referenzen, Minotti-Herstellerbilder nie verändert und nicht verwendet, keine KI-Bilder nach außen, Lizenzen dokumentiert (Spark MIT, Brush Apache-2.0, COLMAP BSD-3, splat-transform/SuperSplat MIT [prüfen], MCP-SDK MIT), WCAG 2.2 AA, reduced motion, mobil zuerst, LCP ≤ 2,0 s, Tests nie rot.

## Quellen

- utsubo: Gaussian Splatting Guide 2026 – https://www.utsubo.com/blog/gaussian-splatting-guide
- bigeye: 3DGS for marketing – https://www.bigeyeagency.com/insights/3d-gaussian-splatting-for-marketing
- XGRIDS-Showroom-Prototyp – https://www.wegetaroundnetwork.com/topic/21364/rd-interactive-3d-retail-experience--no-code-workflow-with-xgrids
- radiancefields: Splats in Shopify – https://radiancefields.com/how-to-load-gaussian-splatting-in-shopify
- Monks Labs Report 34 – https://media.monks.com/reports/labs-report-34-gaussian-splatting
- Imersian Furniture – https://www.imersian.com/industry/furniture
- GlamAR AR-Lösungen 2026 – https://www.glamar.io/blog/best-ar-try-on-solutions-for-furniture-brands-in-2026
- IKEA Kreativ – https://ikea.com/us/en/newsroom/corporate-news/ikea-launches-new-ai-powered-digital-experience-empowering-customers-to-create-lifelike-room-designs-pub58c94890
- ai-furniture-hub (MCP) – https://enterprisedna.co/directories/mcp/one8943-ai-furniture-hub
- Kea Labs MCP – https://kealabs.com/mcp-server
- Mercadinho (MCP mit Terminen) – https://glama.ai/mcp/servers/xtvmhtdlg8
- WebMCP: martech.zone – https://martech.zone/acronym/webmcp/ · Wix – https://dev.wix.com/docs/develop-websites/articles/get-started/ai-agents/about-the-wix-web-mcp · noqta – https://noqta.tn/en/blog/webmcp-browser-ai-agents-web-standard-guide-2026
- Planoplan Sunlight – https://planoplan.com/en/help-center/documentation/visualization/sunlight/
- Cyncly Spaces Flex – https://is.support.cyncly.com/hc/en-us/articles/24075298175121-Spaces-Flex-How-to-adjust-natural-lighting
- SOLIDWORKS Visualize Sunlight – https://blogs.solidworks.com/tech/2020/07/visualize-quick-tips-sunlight-environments-part-2.html
- KI-Raumvorschau: Canva – https://www.canva.com/ai-interior-design/ · Picsart – https://picsart.com/blog/how-to-use-ai-for-interior-design/ · GenRoom – https://genroom.io/en/blog/how-to-redesign-room-with-ai

---

## 8. N1 umgesetzt: Rundgang `/[locale]/showroom` (Stand 28.10.2026)

**Status:** Web-Teil fertig und getestet, Pipeline gebaut. **Öffentlich erst nach dem Aufnahmeabend**: Ohne echte Aufnahme liefert die Produktion 404 (Fallback 2), kein Platzhalter live. Noch nicht im Menü (Integration).

### 8.1 Was gebaut ist

| Teil | Datei(en) | Stand |
|---|---|---|
| Route DE/EN/FR/IT, gleicher Pfad `/showroom` | `src/app/[locale]/showroom/page.js` | Modus `public` / `preview` (noindex, Testszene, gelbes Band) / `off` (404) |
| Schalter, an Manifest gekoppelt | `src/lib/showroom/config.js` | `SHOWROOM_SWITCH = true` (Nr. 9), `SHOWROOM_PUBLIC = manifestReady().ok`: Aufnahmedatum, Freigabe Inhaber, Einwilligung Personen, Abnahme ≥ 8/10, je Zone `lo.sog` ≤ 20 MB und Poster-AVIF ≤ 120 KB, 6–10 Stationen, Stand gesetzt. `SHOWROOM_PREVIEW=1` beim Build = Vorschau (nur für Messungen in platzhirsch-prodtest) |
| Daten | `src/lib/showroom/manifest.json` (Zonen, LOD, Poster, Video; schreiben die Skripte), `hotspots.json` (echte Stationen/Stücke, **leer bis zur Aufnahme**), `testszene.json` (nur Entwicklung) | Felder je Stück: `stand`, `imShowroom`, `rechte` (ok/pruefen → kein Hotspot), `marke`, `haendler`, `productPath`, `arPath`, `aktionen` (produkt/ar/merken/termin), `masse` |
| Regeln | `src/lib/showroom/data.js`, `copy.js` | Händler-Zeile nur ClassiCon/Ezarri **und** nur mit Eintrag im Claim-Register `src/lib/legal/claims.js`; der Text kommt von dort. Ezarri erscheint automatisch, sobald der Teamleiter den Register-Eintrag zusammen mit `EZARRI_PUBLIC` setzt; EN/FR/IT erst mit übersetztem Registertext (`texts.<locale>`). Händler- und Superlativ-Prüfung der Freitexte über `claims.js`. Station `typ: "haralds-tisch"` nur mit `material[]` (Datei + Quelle), sonst entfällt sie. Keine Preise, keine Minotti-Herstellerbilder |
| Seite | `src/components/Showroom/ShowroomPage.js`, `StationList.js`, `ShowroomPoster.js`, `showroom.module.css` | Mobil: H1 → Poster (LCP) → Lead. Liste aller Stationen und Stücke als `<details>` im Server-HTML. „Was Sie hier sehen“ (keine KI, eigene Aufnahme). Kern-USP Nr. 8 als Text mit Link zur Arbeitsweise (kein Bild ohne echtes Material). Besuch (Termin, Route, Öffnungszeiten aus `site.js`). Technik und Datenschutz |
| Bühne | `ShowroomStage.js` (Client) | Poster → Klick → 3D. Weiter/Zurück, Stationspunkte (`aria-current`), Tag/Abend, Vollbild (wo verfügbar), Beenden. Hotspots als DOM-Knöpfe ≥ 44 px; Karte mit Marke, Händler-Zeile, Maßen, „Steht in der Ausstellung · Stand“ und den Aktionen Termin (`/beratung?produkt=…`), Produktseite (sprachrichtig über `paths.js`), 3D/AR, Merken (Merkliste). Tastatur ← → / A D W S / Esc; Ziehen dreht den Blick um ±34°/±16°. `prefers-reduced-motion` = Schnitte. Ohne Hardware-WebGL2 (`failIfMajorPerformanceCaveat`), bei Ladefehler oder „Als Video ansehen“: `ShowroomFallback.js` (Video AV1+H.264, `preload="none"`, kein Autoplay, Stationsfotos) |
| Viewer | `SplatViewer.js` (nur über `next/dynamic` mit `ssr:false`, erst nach Klick; Hover/Fokus lädt vor) | Spark 0.1.10 + three r183, eigene Mini-Engine, die nur bei Bedarf zeichnet; nach fertiger Worker-Sortierung zeichnet sie genau einmal nach. LOD: `lo.sog` zuerst, `hi.sog` nur auf starken Geräten (≥ 6 GB, ≥ 6 Kerne, Maus, kein Datensparen), dort dpr ≤ 1,75, sonst 1 |
| Messung | `trackEvent` | `showroom_start`, `_station`, `_hotspot`, `_action`, `_complete`, nur mit Einwilligung (ohne gtag passiert nichts). Keine Cookies, keine Fremd-Hosts (per Test geprüft) |
| SEO | `src/lib/showroom/schema.js` | WebPage + FurnitureStore (gleiche `@id` wie seitenweit, Landstraße 11, 6911 Lochau) + VideoObject (nur mit Video). Für Sitemap und llms.txt liefert `showroomSitemapPaths()` den Pfad erst bei `SHOWROOM_PUBLIC` |
| Texte | `src/lib/showroom/copy.js`, Vorschlag `features/showroom-messages-vorschlag.json` (Namespace `Showroom`, DE/EN/FR/IT, gleiche Schlüssel per Unit-Test) | |

**Abweichungen von der Spezifikation, mit Begründung:**
1. **Spark 0.1.10 statt 2.x:** Spark 2.3/2.4 bettet ein 1,7 MB großes WASM-Modul als Base64 ein (allein 924 KB gzip). Damit ist das Viewer-Budget von 350 KB nicht erreichbar. Version 0.1.10 (MIT, Oktober 2025) liest SOG v2 (Codebook), läuft mit three 0.183 und braucht 133 KB gzip.
2. **Ohne @react-three/fiber:** Mit R3F (61 KB) wurden 377 KB gzip gemessen, also über dem Budget. Eine eigene Engine mit rund 60 Zeilen nach demselben „demand“-Prinzip ergibt **316 KB gzip**.
3. **LOD** als zwei SOG-Stufen je Zone (`lo` ≈ 35 %, `hi` 100 %) statt Streaming wie in Spark 2. Das reicht für 1–3 Mio. Gaussians je Zone.
4. **Budget-Hinweis:** „Erste Ansicht ≤ 4 s auf Fast 4G“ und „≤ 20 MB“ widersprechen sich (9 Mbit/s ergeben in 4 s etwa 4,5 MB). Praktisch heißt das `lo.sog` ≤ 3,5 MB (≈ 700 000 Gaussians ohne SH). `pack.mjs` warnt oberhalb davon; 20 MB bleibt die harte Grenze im Schalter.

### 8.2 Pipeline ohne Python (`tools/splat/`, Rohdaten nur in `../platzhirsch-gpu-tools/showroom/<datum>/<zone>/<stimmung>/`)

```
node tools/splat/frames.mjs --datum 2026-11-12 --zone wohnen --stimmung tag --video D:/wohnen.mov   # ffmpeg NVDEC + Laplace-Schärfe (sharp), beste 80 %
node tools/splat/poses.mjs  --datum 2026-11-12 --zone wohnen --stimmung tag                          # COLMAP 4.2.1 CUDA (BSD-3), entzerrt → dataset/
node tools/splat/train.mjs  --datum 2026-11-12 --zone wohnen --stimmung tag --max 2500000            # Brush v0.3.0 (Apache-2.0, WebGPU)
#   → SuperSplat (MIT): Floater löschen, Zone zuschneiden, Boden/Maßstab (Messmarken), Personen/Kundendaten entfernen
node tools/splat/pack.mjs   --ply bereinigt.ply --zone wohnen --stimmung tag [--box …] [--drehung 0,1,0,0]   # splat-transform 3.10.1 (MIT) → lo/hi.sog + Manifest
node tools/splat/media.mjs                                                                            # Poster AVIF/WebP (≤ 120 KB) + Kamerafahrt AV1/H.264 (av1_nvenc/h264_nvenc)
node tools/splat/testszene.mjs                                                                        # synthetische Testszene (nur Entwicklung)
```

- Die Programme liegen in `../platzhirsch-gpu-tools/bin/brush/` (SHA-256 gegen die Release-Prüfsumme bestätigt) und `bin/colmap/` (Release 4.2.1, `colmap-x64-windows-cuda.zip`). **Das Ausführen von Brush und COLMAP hat das Rechte-System in dieser Sitzung blockiert** (heruntergeladene Programme). Vor dem ersten Lauf einmal freigeben oder selbst `brush_app.exe --help` starten.
- `splat-transform` braucht `dawn.node` und die VC++-Runtime: Die DLLs aus `$GPU_TOOLS/.venv` nach `node_modules/webgpu/dist/win32-x64/` kopieren (wie gpu-pipeline.md Schritt 4). Danach läuft es auf der RTX 4060 (416 000 Gaussians → SOG in 1,5 s).
- Ende-zu-Ende mit der Testszene getestet: PLY → SOG (lo 0,95 MB, hi 1,8 MB) → Viewer → Poster (AVIF 53 KB breit, 27 KB mobil) → Video mit 25,6 s in 1280 × 720 (AV1 1,4 MB, H.264 2,2 MB, NVENC). Das Video wurde Bild für Bild gesichtet.

### 8.3 Messungen (platzhirsch-prodtest, `next build` mit `SHOWROOM_PREVIEW=1`, Chromium, 9 Mbit/s und 150 ms RTT, mobil mit 4× CPU-Drossel)

| Seite | LCP | Element |
|---|---|---|
| /de | 1,20 s | Startseitenbild (unverändert, kein Viewer-Code) |
| /de/showroom mobil | 1,08 s | `poster-mobil.avif` (27 KB) |
| /de/showroom Desktop | 0,60 s | `poster-breit.avif` (53 KB) |
| /de/kontakt · /de/produkte | 0,96 s · 1,00 s | Text |

Viewer-JS nach dem Klick: **316 KB gzip** (vorher 0). Erste ruhige Splat-Ansicht nach **2,35 s** mobil (gedrosselt) bzw. 1,9 s am Desktop, Download 0,95 MB (Testszene). Bildrate während der Fahrt auf der RTX 4060: 61 fps. **Ob ≥ 30 fps auf einem Mittelklasse-Handy erreicht werden, lässt sich erst mit echter Aufnahme an echten Geräten messen** (Headless zählt nicht).

### 8.4 Tests (immer mit `PW_WORKERS=1`)

- `node --test tests/unit/showroom-hotspots.test.mjs`: 12 Tests zu Schema, Händler-Regel über das Claim-Register, rechte/imShowroom-Filter, Haralds Tisch, Schalter ↔ Manifest (mit allen Freigabe-Bedingungen), Datei-Budgets, keine Preise und keine Minotti-Bilder, Texte in 4 Sprachen = Vorschlag, Links je Sprache und JSON-LD.
- `PW_WORKERS=1 npx playwright test tests/e2e/showroom.spec.js --project=desktop`: 11 Tests, 10 grün. „Modus off“ läuft nur mit `SHOWROOM_EXPECT=off` gegen einen Produktions-Build ohne Vorschau. Geprüft werden: Server-HTML in 4 Sprachen, Liste/Poster/JSON-LD, kein Viewer und kein Splat vor dem Klick, keine Fremd-Hosts und Cookies, Tastatur + Karte + Merken, reduced motion = Schnitt, Fahrt mit fps, ohne WebGL2 → Video/Liste, Video-Knopf, axe (Poster und laufender Rundgang), 375 px ohne Querscroll mit Zielen ≥ 44 px. Die 3D-Tests starten Chromium mit GPU-Schaltern; ohne Hardware-WebGL2 werden sie übersprungen.
- Hinweis: `tests/unit/messages-feinschliff.test.mjs` („Vorschlagsdateien übernommen“) war schon vorher rot (Arbeitsweise, Ezarri, Stripe). Bis das i18n-Team sie übernimmt, steht dort zusätzlich die neue Datei `showroom-messages-vorschlag.json`.

### 8.5 Offen (Inhaber bzw. Integration)

1. **Aufnahmeabend** (Protokoll `3d-vr-render.md` §3.1.2), schriftliche Einwilligung sichtbarer Mitarbeiter und **Liste der ausgestellten Stücke** (Marke, Name, Maße, Produktseite). Damit `hotspots.json` füllen und `manifest.aufnahme` mit Freigabe und Abnahme-Note setzen. Erst dann schaltet die Seite von selbst auf öffentlich.
2. Haralds Tisch: echte Skizzen und Modellfotos mit Quelle → `material[]`.
3. Richtlinien von Minotti und anderen Herstellern prüfen; bis dahin betroffene Stücke auf `rechte: "pruefen"`.
4. Integration: Menü, Startseite „Studio ansehen“, `ueber-uns/platzhirsch`, Kontakt, Produktseite „Im Studio ansehen“; Sitemap und `llms.txt` über `showroomSitemapPaths()`; Namespace `Showroom` in `src/messages`.
5. Testszene (`public/showroom/_testszene/`, 9 MB, synthetisch) vor dem Livegang löschen oder vom Deploy ausnehmen und `manifest.testszene` dann auf `null` setzen.
6. Ausführen von Brush und COLMAP auf diesem Rechner freigeben (siehe 8.2); fps an echten Mittelklasse-Handys messen.
