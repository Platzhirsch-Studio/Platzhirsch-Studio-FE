# Wachstumsrat: Zukunftsforschung und Innovations-Scouting (Kürzel: zukunft)

Stand: 28.10.2026 · Gremium: Zukunftsforscher und Innovations-Scouts · Gegenstand: alle Tools der neuen Website (Code nur gelesen, nichts abgesendet)
Kennzeichnung: **[Fakt]** mit Quelle · **[Schätzung]** eigene Herleitung · **[These]** begründete Zukunftsannahme · **[prüfen]** vor Umsetzung verifizieren
Querbezüge: `12-zukunftsforschung.md`, `23-masterkonzept.md` (Circle, KI-Raumplaner ab 2028), `digital/06-ki-raumplaner-gpu.md`, `digital/08-seo-technisch-content.md`, `digital/features/*`, `teamleiter/inhaber-entscheidungen.md`.

> **Methodenhinweis:** Der Dev-Server auf localhost:3000 hat während dieser Prüfung wegen paralleler Workflows nicht geantwortet. Nur `/llms.txt` wurde live abgerufen. Die Tools wurden über Code und Feature-Dokus begutachtet, Screenshots gibt es keine. Die Webquellen sind überwiegend Fach- und Anbieterblogs. Sie zeigen die Richtung, sind aber keine Primärquellen.

---

## 1. Urteil zum Ist-Stand

**Zukunftsfähigkeit der Tool-Basis: 7 von 10.**
**Heute tatsächlich nutzbarer Vorsprung: 4 von 10.**

Gebaut ist für ein regionales Einrichtungsstudio ungewöhnlich viel. Fast alles ist aber noch nicht nach außen wirksam:

| Tool (Stand Code) | Was zukunftsfähig ist | Was den Vorsprung heute blockiert |
|---|---|---|
| **KI-Concierge** (Claude, Katalog-Tools, Produktkarten, Übergabe an Menschen, Art.-50-Hinweis, Einwilligung) | Die Architektur ist schon „agentisch“: Werkzeuge lesen den echten Frappe-Katalog. Dieselben Werkzeuge kann man später **nach außen** für fremde Agenten anbieten | Nur `de`, `noindex`, liegt unter `/labs`. Kein Gedächtnis über das Portal. Keine Mehrsprachigkeit für CH/IT/FR |
| **llms.txt** (aus dem CMS erzeugt) + **robots.js** (KI-Suchbots erlaubt, Trainingsbots gesperrt) | Sauber und automatisch | Die Wirkung von llms.txt ist laut Studien nahe null (siehe 2.1). Die Sperre von `Google-Extended` kann die Sichtbarkeit in der Gemini-App kosten [prüfen]. In der Kurzbeschreibung von llms.txt stehen Poliform, Rimadesio und Paola Lenti als „Ausstellung und Beratung zu … Marken wie …“. Rimadesio ist laut Masterkonzept erst beantragt → **Recht prüfen** |
| **Produkt-JSON-LD** (`structuredData.js`) | `Product` mit `sku`, Marke und Bild | **Bewusst ohne `offers`/Preis.** Damit gibt es keine Google-Free-Listings, keinen Merchant-Feed und keine Teilnahme an Agenten-Shopping (ChatGPT, Gemini). Das gilt für alle Shopping-Flächen, weil der Preis dort Pflichtfeld ist [Fakt, Google Merchant Help] |
| **Atelierverkauf + Gutscheine** (hinter Schalter, `Offer`-Schema nur bei Preis) | Das ist der **einzige Teil des Sortiments mit Preis**, also der natürliche Einstieg in Shopping-Feeds | Schalter aus, bis Rechtsfreigabe vorliegt |
| **Handy-Upload per QR** (Foto, Video, Grundriss, Chunk-Upload, EXIF/GPS wird entfernt) | Ideale Datenquelle für Raumscan und generative Raumvorschau | Nimmt noch keine 3D-Scans an (USDZ/OBJ aus iPhone-LiDAR) |
| **Kundenportal** (Magic Link, Projekt-Zeitleiste, Dokumente, Nachrichten) | Das künftige **Zuhause des Produktpasses**, von Pflege, Wiederverkauf und Second-Home-Service | Mock-Adapter, Frappe noch nicht angebunden |
| **3D/AR-Viewer** (model-viewer, WebXR/Quick Look, Maße, Varianten, keine Fremd-Hosts) | Technisch auf aktuellem Stand und datenschutzfreundlich | Nur **3 CC0-Beispielmodelle**, kein einziges Produkt aus dem Sortiment |
| **Sofaplaner** (90 Minotti-Familien, 6.285 Elemente) | Ein seltener strukturierter Datensatz, den in der Region niemand hat [These] | Bild- und Markenrechte bei Minotti offen. Keine Händler-Aussage erlaubt |
| **3D-Küchenplaner** (Varianten A/B), **Stil-Finder** (5 Profile), **Dreiländer-Rechner** | Liefern Signale zum Kundenprofil (Stil, Budget, Land), die Agenten und CRM nutzen können | Die Profile fließen noch nicht in Concierge, Portal und Newsletter |
| **Yacht, Outdoor, Ezarri, Hotel/Contract** | Nischen, in denen „digital + persönlich“ besonders wertvoll ist (Fernkunden, Projektgeschäft) | Contract/FF&E hat noch kein digitales Werkzeug (Raumbuch, Mustersuite) |

**Kernaussage:** Der Vorsprung in 1–3 Jahren entsteht nicht aus *noch einem* Tool. Er entsteht, wenn die vorhandenen Tools **von Maschinen lesbar** werden (Agenten, KI-Suche), **gekennzeichnet echt** sind (Handzeichnung als Gegenpol zur KI-Bilderflut) und **über das Portal mit dem Kunden verbunden bleiben** (Pass, Pflege, Wiederverkauf).

---

## 2. Befunde und Chancen je Zukunftsfeld

### 2.1 KI-Agenten als Einkaufsberater (Agentic Commerce, ChatGPT/Gemini-Shopping, llms.txt)

- **[Fakt]** OpenAI hat Instant Checkout mit dem offenen Agentic Commerce Protocol (mit Stripe, Apache 2.0) im September 2025 in den USA gestartet. Ein Bericht vom 30.09.2026 meldet Checkout weiterhin nur für Händler mit US-Käufern ([emarketer](https://www.emarketer.com/content/openai-instant-checkout-chatgpt-ecommerce-expansion), [ringly.io](https://www.ringly.io/blog/what-is-agentic-commerce), Anbieterblog).
- **[Fakt]** Google hat im Januar 2026 das Universal Commerce Protocol (UCP) vorgestellt: Checkout in AI Mode und Gemini, zuerst für US-Händler, danach Kanada, Australien und UK. Die EU ist nicht genannt ([pymnts](https://www.pymnts.com/news/2026/google-debuts-universal-protocol-for-agentic-commerce/), [emarketer](https://www.emarketer.com/content/google-brings-checkout-ai-mode-races-rivals-agentic-commerce)).
- **[Fakt]** WebMCP ist ein Entwurf von Google und Microsoft für den Browser (`navigator.modelContext.registerTool()`). Webseiten bieten damit Werkzeuge für Agenten an. Er wird in der W3C-Community-Group entwickelt und hat in Chrome noch Vorschau-Status ([Chrome Docs, Stand 07.08.2026](https://developer.chrome.com/docs/ai/webmcp), [heise](https://heise.de/-11178002)).
- **[Fakt]** llms.txt: Google nutzt die Datei laut eigener Aussage nicht. In einer Ahrefs-Auswertung (Mai 2026, 137.000 Domains) erhielten 97 % der Dateien keine einzige Anfrage ([ppc.land](https://ppc.land/llms-txt-adoption-rises-8-8x-but-97-of-files-get-zero-ai-requests/), [optimizely](https://www.optimizely.com/field-notes/articles/does-llms-txt-work/)).
- **[Fakt, widersprüchlich]** KI-Verweise machen je nach Studie 0,1–2,8 % des Traffics aus, ChatGPT stellt davon den Großteil. Die Conversion wird in einigen Studien höher, in einer deutschen Hochschulstudie niedriger als organisch gemessen ([superlines](https://www.superlines.io/articles/the-state-of-geo-in-q1-2026), [emarketer](https://www.emarketer.com/content/ai-assistants-strong-referral-traffic-drivers-paths-purchase-industry-kpis-show)).

**Einordnung für Platzhirsch:** Online-Checkout eines Minotti-Sofas durch einen Agenten ist bis 2028 unrealistisch: Preis auf Anfrage, Planung, Montage und Händlerverträge stehen dagegen [These]. Realistisch ist etwas anderes: **Der Agent empfiehlt den Ort und bucht den Termin.** Wer KI-Assistenten fragt „Wo sehe ich Designermöbel am Bodensee und werde gut beraten?“, soll Platzhirsch genannt bekommen und direkt einen Termin anfragen können. Dafür braucht es (a) zitierfähige Inhalte und eine starke Entität (Bewertungen, Presse, eine einheitliche Adresse), (b) strukturierte Daten und (c) später eine Agenten-Schnittstelle mit den Concierge-Werkzeugen. llms.txt behalten, weil es nichts kostet, aber nicht weiter ausbauen.

### 2.2 Generative Raumplanung aus dem Handyfoto

- **[Fakt]** IKEA Kreativ (seit 2022) setzt Möbel aus dem eigenen Katalog in gescannte Raumfotos und kann vorhandene Möbel entfernen. Generische Werkzeuge (RoomGPT, Interior AI, Planner 5D) sind 2026 Massenware mit Gratis-Kontingenten ([IKEA Newsroom](https://ikea.com/us/en/newsroom/corporate-news/ikea-launches-new-ai-powered-digital-experience-empowering-customers-to-create-lifelike-room-designs-pub58c94890), [lilachbullock](https://www.lilachbullock.com/where-to-design-rooms-with-ai-for-free/)).
- **[Fakt]** AI Act Art. 50 gilt seit dem 02.08.2026 und wurde durch den Digital Omnibus nicht verschoben. Fotorealistische KI-Bilder echter Räume müssen gekennzeichnet sein ([fedil.lu](https://fedil.lu/en/publications/ai-act-update-enforcement-begins-as-the-digital-omnibus-reshapes-the-timeline/?pdf=1), [srd-rechtsanwaelte](https://www.srd-rechtsanwaelte.de/en/blog/digital-omnibus-ai-what-is-changing-in-the-ai-act)).
- **Inhaber-Entscheidung 8:** Harald Menghins Handzeichnung ist der Kern-USP. Nach außen werden keine KI-Skizzen gezeigt.

**Einordnung:** Eine generative Raumvorschau ist bald überall gratis, als Massenfunktion also **kein** Vorsprung [These]. Vorsprung entsteht, wenn sie (1) den **eigenen Katalog** mit echten Maßen nutzt, (2) **als Werkzeug des Designers** dient (Handzeichnung zuerst, die KI-Vorschau zeigt Varianten von Material und Licht) und (3) mit **Aufmaß aus dem Raumscan** gekoppelt ist. Der Handy-Upload ist dafür die richtige Basis. Reihenfolge: zuerst LiDAR-Scan annehmen (spart Fahrten nach CH und FL), dann interne KI-Varianten, frühestens 2028 eine Selbstbedienung (wie im Masterkonzept).

### 2.3 AR-Brillen und Mixed Reality

- **[Fakt, Sekundärquellen]** Apple Vision Pro verkauft sich schwach (Schätzung Q4/2025 ca. 45.000 Stück), ein günstigeres Modell ist für H2/2026 gemeldet. Ray-Ban-Meta-Brillen sind stark gefragt, der internationale Start der Display-Version wurde verschoben. Samsung bringt 2026 Android-XR-Brillen ([reality-atlas](https://www.reality-atlas.com/weekly/week-4-2026), [voxbooster](https://voxbooster.com/de/blog/vr-ar-statistics-2026/)).

**Einordnung:** Für den Möbelkauf bleibt bis 2028 **das Handy die AR-Plattform** (WebXR, Quick Look). Das kann der AR-Viewer schon, ihm fehlen nur echte Modelle. Brillen lohnen sich für Platzhirsch zuerst als **Showroom-Erlebnis** (Yacht-Interior oder Hotel-Lobby in 1:1 begehen), nicht als Verkaufskanal. Beobachten und ab 2028 mit einem Leihgerät testen, keine eigene App.

### 2.4 Digitale Produktpässe (EU-ESPR)

- **[Fakt]** Möbel sind Prioritätsgruppe im ESPR-Arbeitsplan (April 2025). Der delegierte Rechtsakt für Möbel ist für ca. 2028 angesetzt, die Pflicht folgt meist rund 18 Monate später, also ca. 2029/30. Der Inhalt ist voraussichtlich Identifikation, Zusammensetzung, Fußabdruck, Haltbarkeit, Reparierbarkeit und Lebensende. Die Daten sind vorläufig und stammen aus Sekundärquellen ([asuene](https://asuene.com/us/blog/how-the-espr-working-plan-is-reshaping-the-furniture-industry), [projetcelsius](https://projetcelsius.com/en/blog/espr-dpp-furniture/), [renoon](https://www.renoon.com/blog/the-timeline-of-digital-product-passport-regulation-in-eu-espr-from-product-groups-to-rollout-schedule)). Primär ist COM(2025)187 zu prüfen.

**Einordnung:** Die Pflicht trifft vor allem die **Hersteller**. Der Händler muss den Pass zugänglich machen [prüfen]. Den Vorsprung holt, wer **vorher** einen freiwilligen, kundenbezogenen Pass anbietet: Herkunft, Stoff, Pflege, Montageprotokoll, Rechnung, Garantie, Wiederverkaufswert. Er liegt im Portal, am Möbel klebt ein QR-Code. Das bindet den Kunden (Pflege, Nachkauf, Zusatzteile) und ist die Grundlage für Circle (2.5). Kosten: fast nur Datenpflege, die Portal-Technik steht.

### 2.5 Kreislauf und Wiederverkauf von Designmöbeln

- **[Fakt]** Vitra Circle Stores (Brüssel, Amsterdam, Campus Weil am Rhein) verkaufen geprüfte, aufbereitete Stücke mit erneuerter Garantie. Laut Branchenbericht liegen die Preise ca. 15–25 % unter Neu. Ein Contract-Modell mit Rücknahme gibt es auch ([vitra.com](https://vitra.com/en-us/about-vitra/sustainability/vitra-circle-stores), [interiordaily](https://www.interiordaily.com/article/9790971/vitra-gives-furniture-a-second-life-through-circular-model/)).
- Das Masterkonzept sieht schon den **Platzhirsch Circle** vor (Kommission, Inzahlungnahme, Aufbereitung über Sigg, Pilot mit 20 Stücken, keine Rückkaufgarantie in der Bilanz).

**Einordnung:** Im Dreiländereck ist kein Händler-Circle für Fremdmarken bekannt [These, nicht vollständig recherchiert]. Mit dem Pass (2.4) und dem Atelierverkauf (schon gebaut) ist Circle **ohne Kapitalbindung** startbar, über Kommission statt Ankauf. Das passt zur angespannten Finanzlage. Für Hotels ist das Gegenstück die **Rücknahme bei der Renovierung** (Contract-Circle). Hoteliers fragen danach wegen ihrer ESG-Berichte [These].

### 2.6 Social Commerce

- **[Fakt]** Pinterest-Anzeigen sind in DE und AT offen, „Shop the Look“ gibt es in DE ([mobilemarketingmagazine](https://mobilemarketingmagazine.com/?p=112110), [lengow](https://blog.lengow.com/product-ads-sell-products-instagram-pinterest/)). Aktuelle Daten für 2026 und DACH zu Luxusmöbeln wurden nicht gefunden.

**Einordnung:** Für Luxuswohnen ist Social Commerce **Inspiration mit Terminziel**, kein Warenkorb [These]. Der stärkste Inhalt, den kein Konkurrent kopieren kann: **Harald zeichnet, das Modell entsteht, der Raum steht.** Als Reel oder Pin mit Echtheitsnachweis (C2PA, siehe Radar 15) wird daraus ein Gegenentwurf zur KI-Bilderflut. Pinterest passt zu Stil-Finder-Profilen und Ezarri-Pools (stark bildgetrieben, lange Lebensdauer der Pins). Pixel erst nach Gate 0 und Einwilligungsstruktur, wie im Masterplan festgelegt.

---

## 3. FERTIG: Innovations-Radar (15 Punkte)

Skalen: **Reife** der Technik/des Markts (1 = Labor, 5 = Standard) · **Aufwand** S (< 5 Tage) / M (1–4 Wochen) / L (> 1 Monat) · **Vorsprung** = wie lange und wie stark Platzhirsch regional vorne liegt (1 = schnell kopiert, 5 = schwer kopierbar) · **Ring**: JETZT (Q4/2026–Q1/2027), BALD (2027), SPÄTER (2028+), BEOBACHTEN.

| # | Innovation | Ring | Reife | Aufwand | Vorsprung | Wann starten | Warum / Bedingung |
|---|---|---|---|---|---|---|---|
| 1 | **Agenten-lesbarer Katalog**: vollständiges `Product`-, `Brand`- und `LocalBusiness`-Schema, stabile IDs, Maße und Materialien als Eigenschaften, alles serverseitig gerendert, CH/IT/FR-Seiten indexierbar | JETZT | 5 | S | 2 | mit dem Livegang | Voraussetzung für alles Weitere. Kostet fast nichts, die Daten liegen in Frappe |
| 2 | **KI-Sichtbarkeit messen und aufbauen (GEO)**: 25 Testfragen monatlich in ChatGPT, Gemini, Perplexity und Copilot (Abschnitt 3.2), Entitätsaufbau über Bewertungen, Presse und eine einheitliche Adresse | JETZT | 4 | S | 3 | Nov. 2026 | Wer 2027 in KI-Antworten „Designermöbel Bodensee“ genannt wird, hält das lange. Konkurrenten in der Region sind online schwach (Masterkonzept) |
| 3 | **Crawler-Politik bewusst entscheiden**: `Google-Extended`, `GPTBot`, `ClaudeBot` und `Applebot-Extended` für HTML-Seiten erlauben, Bilder (`/cmx/`, `/_next/image`) weiter sperren. llms.txt beibehalten, Markenformulierung prüfen | JETZT | 5 | S | 1 | Inhaber-Entscheidung Nov. 2026 | Modellwissen über „Platzhirsch“ entsteht nur aus erlaubten Inhalten. Die Bildrechte bleiben geschützt (wie `08-seo` Punkt 2) |
| 4 | **Preisführende Teilmenge als Feed**: Atelierverkauf, Gutscheine und Accessoires (Doc 10) mit Preis in Merchant Center Free Listings, später UCP/ACP-fähig | BALD | 4 | M | 2 | nach Rechtsfreigabe Commerce, Q1–Q2 2027 | Das ist der einzige Weg in Shopping-Flächen und Agenten-Shopping. Beim Rest bleibt „Preis auf Anfrage“. Checkout in der EU frühestens 2027/28 [These] |
| 5 | **Concierge-Werkzeuge als Agenten-Schnittstelle**: dieselben Lese-Werkzeuge (Katalog, Marken, Showroom, Dreiländer-Rechner, Termin anfragen) als MCP-Server und WebMCP-Tools (Spezifikation 3.3) | BALD | 2 | M | 4 | Pilot Q3 2027, wenn WebMCP stabil ist | Erster regionaler Einrichter, bei dem ein Agent Verfügbarkeit, Lieferweg CH/FL und einen Termin direkt abfragen kann [These]. Die Werkzeuge sind schon gebaut (`src/lib/concierge/tools.js`) |
| 6 | **Concierge 2.0**: DE/EN/IT/FR, Gedächtnis über das Portal (mit Einwilligung), Stil-Finder-Profil als Kontext, fertiges Briefing an Harald vor dem Termin, später auch über WhatsApp Business | BALD | 4 | M | 3 | nach dem 50-Fragen-Test, Q1 2027 | Kürzere Erstberatung, besser vorbereitete Termine. Der Mensch bleibt der Abschluss |
| 7 | **Interner KI-Lead-Radar**: Agent wertet wöchentlich Baubewilligungen, Hotel-News, Werftmeldungen und Ausschreibungen in AT/DE/CH/FL aus und speist die Pipeline in Frappe (die Ordner `radar/` werden heute von Hand gepflegt) | JETZT | 4 | M | 4 | Dez. 2026 | Hotel/Contract ist das Ziel mit den größten Aufträgen. Wer zuerst anruft, gewinnt (H13 und H23 im Masterkonzept) |
| 8 | **Raumscan statt Aufmaßfahrt**: Upload nimmt iPhone-LiDAR-Scans an (RoomPlan/USDZ, Polycam-OBJ) und erstellt daraus einen Grundriss mit Maßen für Planer und Küchenplaner | BALD | 4 | M | 3 | Q2 2027 | Spart Fahrten nach CH, FL und an Bord (Yacht). Ein Vorab-Aufmaß senkt die Hürde für Fernkunden |
| 9 | **Generative Raumvorschau, vom Designer geführt**: interne Varianten von Material und Licht auf Kundenfoto oder Scan, nur Produkte aus dem Katalog, Kennzeichnung nach Art. 50, C2PA. Nie anstelle der Handzeichnung | SPÄTER | 3 | L | 3 | intern Q4 2027, Selbstbedienung frühestens 2028 | Nach außen bald Massenware. Wert entsteht nur in Verbindung mit Katalog, Maß und Designer (Masterkonzept, `06-ki-raumplaner`) |
| 10 | **Echte 3D/AR-Modelle**: zuerst ClassiCon (Händler, Herstellerdaten anfragen) und Ezarri (Pool-Mosaik als Material auf parametrischem Becken), dann Atelierstücke per Fotogrammetrie | BALD | 4 | M | 3 | Q1 2027 | Viewer ist fertig, es fehlen nur Inhalte. Ein Ezarri-Pool „im eigenen Garten“ per AR ist ein starkes Argument für Bauherren [These] |
| 11 | **XR-Brillen im Showroom**: Yacht-Salon und Hotel-Lobby 1:1 begehbar, als Termin-Erlebnis | BEOBACHTEN | 2 | M | 3 | Test 2028 mit Leihgerät | Geräte noch Nische, für Projekte über 100 T€ aber ein Abschlussverstärker [These] |
| 12 | **Platzhirsch-Pass** (freiwilliger digitaler Produktpass im Portal, QR am Möbel, Datenmodell 3.4) | BALD | 3 | M | 4 | mit Portal-Anbindung an Frappe, Q2 2027 | 2–3 Jahre vor der ESPR-Pflicht. Kundenbindung, Pflege- und Nachkaufumsatz, Grundlage für Circle |
| 13 | **Platzhirsch Circle**: Kommission und Inzahlungnahme mit Pass-Historie, Aufbereitung über Sigg, Verkauf über den Atelierverkauf. Für Hotels Rücknahme bei der Renovierung | BALD | 4 | M | 3 | Pilot Jan. 2027 (laut Masterkonzept) | Ohne Kapital über Kommission. Holt preisbewusste Neukunden in die Marke, ohne Rabatt-Image |
| 14 | **Social Commerce mit Terminziel**: Pinterest-Katalog (Ezarri, Atelier, Stil-Profile), Reels „Hand → Modell → Raum“, QR-„Shop the Room“ im Café | BALD | 4 | S–M | 2 | Inhalte sofort, Pixel und Media nach Gate 0 | Reichweite bei Bauherren und Hotel-Entscheidern, die visuell suchen. Inhalte sind schwer kopierbar, die Kanäle nicht |
| 15 | **Echtheitsnachweis „von Hand gezeichnet“**: C2PA-Content-Credentials für Haralds Skizzen, Modellfotos und eigene Fotos, sichtbares Siegel „Originalskizze, keine KI“ | BALD | 3 | S | 5 | Q1 2027 | Gegenpol zur KI-Bilderflut. Macht den Kern-USP technisch beweisbar. Das kann kein Großhändler kopieren |

### 3.1 Radar in einem Satz je Ring

- **JETZT:** lesbar werden (1–3), Leads automatisch finden (7).
- **BALD (2027):** Werkzeuge öffnen (5, 6), Fernaufmaß (8), echte 3D-Inhalte (10), Pass und Circle (12, 13), Social (14), Echtheit (15), Preis-Feed (4).
- **SPÄTER (2028+):** generative Raumvorschau als Kundenwerkzeug (9).
- **BEOBACHTEN:** Brillen (11), Agenten-Checkout in der EU (Teil von 4).

### 3.2 FERTIG: GEO-Testfragen (monatlich, gleiche Formulierung, Ergebnis in eine Tabelle)

Die Fragen werden jeweils in ChatGPT (Suche an), Gemini, Perplexity und Copilot gestellt. Notiert werden: genannt ja/nein, Position, zitierte URL, falsche Fakten.

1. Wo kann ich in Vorarlberg Designermöbel ansehen und mich beraten lassen?
2. Bestes Einrichtungsstudio am Bodensee für italienische Designmöbel?
3. Designermöbel kaufen in der Nähe von Lindau
4. Designermöbel St. Gallen: wo gibt es Beratung mit Ausstellung?
5. ClassiCon Händler Vorarlberg
6. Ezarri Glasmosaik Händler Österreich
7. Pool mit Glasmosaik planen Bodensee
8. Küchenplanung Steinküche Vorarlberg
9. Interior Designer für Neubau in Bregenz
10. Wer richtet Hotels in Vorarlberg komplett ein?
11. Hotel-Lobby einrichten lassen Bodensee
12. Yacht-Interior Bodensee: wer plant die Inneneinrichtung?
13. Möbel aus Österreich in die Schweiz liefern lassen: was kostet Zoll und MWST?
14. Designermöbel Liechtenstein Beratung
15. Outdoor-Möbel Paola Lenti am Bodensee ansehen
16. Einrichtungsberatung mit Handskizze
17. Wohnzimmer einrichten lassen Vorarlberg Kosten
18. Ausstellungsstücke Designermöbel günstiger Bodensee
19. Gutschein Einrichtungshaus Bregenz
20. Café im Möbelhaus am Bodensee
21. Platzhirsch Home Living Lochau Öffnungszeiten
22. Ist Platzhirsch Home Living seriös? Erfahrungen
23. Second-Home einrichten Arlberg
24. Minotti Sofa Bodensee ansehen *(nur messen; in Antworten keine Händler-Aussage erzeugen)*
25. Wer plant Wellness- und Poolbereiche für Hotels am Bodensee?

Zielwerte (Schätzung): Platzhirsch bei mindestens 8 von 25 Fragen genannt bis Q2 2027 und bei mindestens 15 bis Q4 2027. Falsche Fakten (Hausnummer, Händlerstatus) sofort an der Quelle korrigieren.

### 3.3 FERTIG: Spezifikation Agenten-Schnittstelle (Radar 5)

**Ziel:** Fremde KI-Agenten (Browser-Agenten über WebMCP, Assistenten über MCP) fragen Platzhirsch-Daten verlässlich ab und lösen einen **Termin- oder Rückrufwunsch** aus. Sie kaufen nicht und geben keine Bestellung auf.

| Tool | Eingabe (zod) | Ausgabe | Quelle im Code |
|---|---|---|---|
| `search_products` | `query`, optional `brand`, `category`, `max` ≤ 12 | Liste: Name, Marke, Kategorie, Maße, URL, `price: "auf Anfrage"` bzw. Preis bei Atelierstücken | `catalog.js` (vorhanden) |
| `list_brands` | – | Marken mit Kategorien. **Händlerstatus nur bei ClassiCon und Ezarri** | `catalog.js` |
| `showroom_info` | optional `date` | Adresse Landstraße 11, 6911 Lochau, Öffnungszeiten, Café, Anfahrt | `showroom.js` |
| `cross_border_estimate` | `country` (CH/FL/DE), `net_eur` | Spanne für Einfuhrabgaben, deutlich als **unverbindliche Schätzung** gekennzeichnet | Dreiländer-Rechner |
| `services` | – | Küchenplanung, Interior Design, Outdoor (Koordination der Gewerke, **keine Bauleitung**), Yacht, Pool/Ezarri, Hotel/Contract | statische Inhalte |
| `request_appointment` | `name`, `email` oder `phone`, `topic`, `preferred_dates[]`, `note` ≤ 1.000 Zeichen, `agent_consent: true` | Referenz und Text „Wir melden uns persönlich, nichts ist gebucht“ | Weg wie `/api/beratung_anfrage` mit `guardForm`, Quelle `agent` |

**Regeln:** Rate-Limit pro Agent und IP. Nur Lesen, außer `request_appointment`. Dort ist `agent_consent` Pflicht, und eine Bestätigung geht per E-Mail an den Menschen (Double-Opt-in), bevor das Team handelt. Antworttexte ohne Superlative. Jede Antwort enthält die kanonische URL. Herkunft `quelle=agent` in der Lead-Attribution. Datenschutzerklärung um einen Abschnitt „Anfragen über KI-Assistenten“ ergänzen [Datenschutzjurist].
**Umsetzung:** (a) WebMCP: `navigator.modelContext.registerTool()` nur, wenn vorhanden (Feature-Erkennung), auf Produkt-, Marken- und Kontaktseiten. (b) MCP-Server: eigene Route `/api/agent/mcp` (Streamable HTTP), gleiche Tool-Implementierung. Vorher die aktuelle Next-Doku in `node_modules/next/dist/docs/` lesen (AGENTS.md).
**Messen:** Aufrufe je Tool, Terminwünsche mit `quelle=agent`, Abschlussquote gegenüber normalen Anfragen.

### 3.4 FERTIG: Datenmodell Platzhirsch-Pass (Radar 12)

Ein Pass je ausgeliefertem Stück, im Portal unter „Meine Stücke“. Ein QR-Etikett (unter dem Möbel, in der Schublade) führt auf `/pass/<id>`. Öffentlich sind nur Produktdaten zu sehen, alles Persönliche nur nach Login.

| Feld | Inhalt | Öffentlich? | Quelle |
|---|---|---|---|
| `pass_id` | zufällige ID (nicht erratbar), QR | ja | Portal |
| `produkt` | Marke, Modell, Kollektion, Designer, Jahr | ja | Frappe-Katalog |
| `ausfuehrung` | Stoff/Leder/Holz/Farbcode, Maße, Modulliste (Sofaplaner-Export) | ja | Auftrag |
| `herkunft` | Herstellerland, Lieferdatum, Seriennummer, falls vom Hersteller | teilweise | Lieferschein |
| `pflege` | Pflegehinweise je Material, Pflegeintervall, nächste Erinnerung | ja | Materialbibliothek |
| `montage` | Protokoll, Fotos, Monteur, Datum | nein | Portal-Dokumente |
| `dokumente` | Rechnung, Garantie, Herstellerunterlagen | nein | Portal |
| `historie` | Reparaturen, Aufbereitung, Einlagerung (Second-Home-Service) | nein | Service |
| `circle` | „Wiederverkauf anfragen“: Kommissions-Anfrage mit vorbefüllten Daten | Knopf nur nach Login | Atelier-Flow |
| `espr` | Platzhalter für den künftigen Hersteller-Pass-Link (GS1 Digital Link) | ja | später |

**Kundentext (fertig):**
> **Ihr Platzhirsch-Pass**
> Jedes Stück, das wir für Sie planen und liefern, bekommt einen digitalen Pass: Ausführung, Materialien, Pflegehinweise, Montageprotokoll und Unterlagen, an einem Ort. Wenn Sie umziehen, renovieren oder sich irgendwann von einem Stück trennen möchten, ist alles dokumentiert. Den Pass finden Sie in „Mein Platzhirsch“.

### 3.5 FERTIG: Siegel-Text für den Echtheitsnachweis (Radar 15)

> **Von Hand gezeichnet.** Diese Skizze stammt von Harald Menghin, entstanden im Gespräch mit unseren Kunden. Sie ist kein KI-Bild. Die Herkunft ist in der Bilddatei nachprüfbar hinterlegt (Content Credentials).

Technik: C2PA-Manifest beim Export (`@contentauth/c2pa-node`, im Masterplan schon vorgesehen), Autor, Datum und „created by human“. Auf der Seite ein kleines Siegel mit Link zur Prüfseite (contentcredentials.org/verify).

---

## 4. Maßnahmen-Tabelle

Kosten grob, ohne interne Arbeitszeit des Inhabers. Alle Umsatzeffekte sind **[Schätzung]** mit Begründung.

| Prio | Maßnahme | Aufwand | Kosten grob | Erwarteter Umsatzeffekt (Begründung) | Wer |
|---|---|---|---|---|---|
| P0 | llms.txt-Kurzbeschreibung prüfen (Rimadesio und Poliform ohne Listung nicht als Ausstellungsmarke nennen, falls nicht ausgestellt) | S | 0 € | Kein direkter. Vermeidet UWG-Risiko in maschinell weiterverbreiteten Texten | Code-Team + Recht |
| P1 | Radar 1: Schema vervollständigen, Tools aus `/labs` auf indexierbare URLs (laut Inhaber-Entscheidung 9) | S | 0–1 T€ | Ohne das bleiben alle Folgepunkte wirkungslos. Mittelbar: mehr organische und KI-Anfragen | Code-Team |
| P1 | Radar 2: GEO-Monitoring mit 25 Fragen monatlich, Fehlerkorrektur an der Quelle | S | 0 € (1 h/Monat) | KI-Verweise sind klein (0,1–2,8 % des Traffics), wachsen aber stark. Ziel 2027: 1–3 qualifizierte Anfragen pro Monat aus KI-Assistenten, bei Ø-Auftrag 15–30 T€ also 15–90 T€ Umsatz pro Monat möglich | Inhaber/Marketing |
| P1 | Radar 3: Crawler-Politik entscheiden (Trainingsbots für HTML erlauben, Bilder sperren) | S | 0 € | Markenwissen in Modellen. Die Wirkung ist nicht messbar trennbar, das Risiko gering | Inhaber, dann Code-Team |
| P1 | Radar 7: KI-Lead-Radar (wöchentlicher Agent, Ausgabe in Frappe) | M | 1–3 T€ Aufbau + < 100 €/Monat API | Ein zusätzlich gewonnenes Hotel- oder Bauträgerprojekt pro Jahr bringt 100–300 T€ (Größenordnung aus Masterkonzept G-Linien) | Code-Team + Verkauf |
| P1 | Radar 15: C2PA-Siegel für Handzeichnungen | S | < 1 T€ | Stärkt den Kern-USP in Social und KI-Suche, mittelbar höhere Abschlussquote | Code-Team + Inhaber (Skizzen liefern) |
| P2 | Radar 12 + 13: Platzhirsch-Pass im Portal, Circle-Pilot über Kommission | M | 3–8 T€ + Etiketten | Circle laut Masterkonzept 0,2–0,6 Mio. € p. a. langfristig. Pass bringt Pflege- und Nachkaufumsatz, geschätzt 2–5 % Zusatzumsatz bei Bestandskunden | Code-Team + Inhaber + Sigg |
| P2 | Radar 10: echte 3D-Modelle ClassiCon und Ezarri-Pool-Visualisierung | M | 2–6 T€ | Ezarri: kürzere Entscheidung bei Bauherren und Hotels. 1–2 zusätzliche Pool-Projekte pro Jahr wären plausibel | Code-Team + Partner (ClassiCon, Ezarri) |
| P2 | Radar 6: Concierge mehrsprachig + Briefing + Portal-Gedächtnis | M | 2–5 T€ + API nach Nutzung | Mehr CH/IT-Anfragen, kürzere Erstberatung. Effekt erst nach dem 50-Fragen-Test bezifferbar | Code-Team |
| P2 | Radar 8: LiDAR-Scan-Upload + Grundriss | M | 2–5 T€ | Spart 1–2 Aufmaßfahrten pro Fernprojekt. Ermöglicht Yacht- und CH-Kunden den ersten Schritt ohne Termin | Code-Team |
| P2 | Radar 4: Preis-Feed (Atelier, Gutscheine, Accessoires) in Merchant Center | M | 0–2 T€ | Abverkauf von Ausstellungsstücken, dazu neue Kontakte mit niedriger Einstiegshürde. Klein, aber Liquidität | Code-Team, nach Rechtsfreigabe |
| P2 | Radar 14: Pinterest/Reels „Hand → Modell → Raum“, QR „Shop the Room“ im Café | S–M | 0,5–2 T€/Monat Content, Media nach Gate 0 | Reichweite bei Bauherren, Terminziel. Effekt erst mit Tracking messbar | Inhaber/Marketing |
| P3 | Radar 5: MCP/WebMCP-Schnittstelle (Pilot) | M | 3–6 T€ | Heute kaum Nachfrage, 2028 möglicherweise ein relevanter Kanal. Den Vorsprung gibt es nur, wenn man früh dran ist | Code-Team, Q3 2027 |
| P3 | Radar 9: generative Raumvorschau intern | L | 5–15 T€ + GPU/API | Nur als Designer-Werkzeug sinnvoll. Wirkung: mehr Varianten pro Termin, höhere Abschlussquote [These] | Code-Team + Inhaber, ab Q4 2027 |
| P3 | Radar 11: XR-Brillen-Test im Showroom | M | 1–4 T€ (Leihgerät, Szene) | Nur für Yacht/Hotel-Projekte über 100 T€ relevant | Partner/Inhaber, 2028 |

---

## 5. Was ausdrücklich NICHT jetzt

- Kein Agenten-Checkout für Planungsprodukte: Preis, Planung und Händlerverträge stehen dagegen, und in der EU gibt es ihn noch nicht.
- Keine KI-Bilder nach außen (Inhaber-Entscheidung 8). Die KI bleibt hinter dem Designer.
- Keine eigene XR-App und keine NFT- oder Blockchain-Pässe. Der Pass ist eine Portal-Seite mit QR-Code.
- Kein weiterer Ausbau von llms.txt über den Ist-Stand hinaus.

## Quellen

- emarketer, OpenAI Instant Checkout: https://www.emarketer.com/content/openai-instant-checkout-chatgpt-ecommerce-expansion
- Ringly, Agentic Commerce 2026 (Anbieterblog): https://www.ringly.io/blog/what-is-agentic-commerce
- PYMNTS, Google UCP: https://www.pymnts.com/news/2026/google-debuts-universal-protocol-for-agentic-commerce/
- emarketer, Google Checkout in AI Mode: https://www.emarketer.com/content/google-brings-checkout-ai-mode-races-rivals-agentic-commerce
- Chrome Developers, WebMCP: https://developer.chrome.com/docs/ai/webmcp
- heise, WebMCP: https://heise.de/-11178002
- PPC Land, llms.txt-Auswertung: https://ppc.land/llms-txt-adoption-rises-8-8x-but-97-of-files-get-zero-ai-requests/
- Optimizely, Does llms.txt work: https://www.optimizely.com/field-notes/articles/does-llms-txt-work/
- Superlines, State of GEO Q1 2026: https://www.superlines.io/articles/the-state-of-geo-in-q1-2026
- emarketer, AI-Assistenten als Referral-Quelle: https://www.emarketer.com/content/ai-assistants-strong-referral-traffic-drivers-paths-purchase-industry-kpis-show
- Google Merchant Help, Free Listings: https://support.google.com/merchants/answer/13889434
- IKEA Newsroom, Kreativ: https://ikea.com/us/en/newsroom/corporate-news/ikea-launches-new-ai-powered-digital-experience-empowering-customers-to-create-lifelike-room-designs-pub58c94890
- Lilach Bullock, AI room design tools 2026: https://www.lilachbullock.com/where-to-design-rooms-with-ai-for-free/
- FEDIL, AI Act und Digital Omnibus: https://fedil.lu/en/publications/ai-act-update-enforcement-begins-as-the-digital-omnibus-reshapes-the-timeline/?pdf=1
- SRD Rechtsanwälte, Digital Omnibus: https://www.srd-rechtsanwaelte.de/en/blog/digital-omnibus-ai-what-is-changing-in-the-ai-act
- Reality Atlas, XR-Wochenbericht: https://www.reality-atlas.com/weekly/week-4-2026
- Voxbooster, VR/AR-Statistiken 2026: https://voxbooster.com/de/blog/vr-ar-statistics-2026/
- Asuene, ESPR und Möbel: https://asuene.com/us/blog/how-the-espr-working-plan-is-reshaping-the-furniture-industry
- Projet Celsius, ESPR DPP Möbel: https://projetcelsius.com/en/blog/espr-dpp-furniture/
- Renoon, DPP-Zeitplan: https://www.renoon.com/blog/the-timeline-of-digital-product-passport-regulation-in-eu-espr-from-product-groups-to-rollout-schedule
- Vitra Circle Stores: https://vitra.com/en-us/about-vitra/sustainability/vitra-circle-stores
- Interior Daily, Vitra Circle: https://www.interiordaily.com/article/9790971/vitra-gives-furniture-a-second-life-through-circular-model/
- Mobile Marketing Magazine, Pinterest-Ads DE/AT: https://mobilemarketingmagazine.com/?p=112110
- Lengow, Shop the Look: https://blog.lengow.com/product-ads-sell-products-instagram-pinterest/
