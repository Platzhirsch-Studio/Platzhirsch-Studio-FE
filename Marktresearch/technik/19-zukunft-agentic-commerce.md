# 19 – Nach der Website: Agentic Commerce, KI-Suche, räumliches Computing und Produktpass 2027–2032

**Stand:** 26.10.2026 · **Rolle:** Zukunftsforschung Handel und Technologie
**Ergänzt (wiederholt nicht):** `12-zukunftsforschung.md` (Megatrends, Circle, „Neues Kapitel“, 48-h-Planung), `digital/00-digital-masterplan.md` (Wellen 1–3, Backoffice-Felder Abschn. 8), `digital/08-seo-technisch-content.md` F10 (llms.txt, robots, Prompt-Monitoring), `digital/14-recht-compliance-digital.md` (F3 Bildrechte, F9/F14 KI, F12 Produktpass), `26-binni-kooperation.md`.
**Kennzeichnung:** **[Fakt]** mit Quelle · **[Schätzung]** eigene Herleitung, Annahmen offen · **[These]** begründete Zukunftsannahme · **[anwaltlich prüfen]** · **[vom Unternehmen auszufüllen]**.

> Dies ist keine Rechtsberatung. Rechtliche Hinweise sind Arbeitsstand und vor Umsetzung durch eine Rechtsanwältin oder einen Rechtsanwalt zu prüfen.

---

## 0. Kurzfazit in fünf Sätzen

1. **Der nächste Kunde ist oft eine Software.** OpenAI (Agentic Commerce Protocol, Sept. 2025), Google (Universal Commerce Protocol plus AP2, Jan. 2026) sowie Visa und Mastercard (live Agenten-Zahlungen in Europa 2026) bauen die Schienen, auf denen KI-Agenten suchen, vergleichen, Termine buchen und bezahlen [Fakt]. Bei Möbeln für 15–80 T€ kauft der Agent bis 2030 nicht selbst, aber er **entscheidet, welche drei Studios der Kunde überhaupt kontaktiert** [These].
2. **Agenten lesen Daten, keine Stimmung.** Gewinnen wird, wessen Maße, Lieferzeiten, Ausstellungsstücke, Liefergebiete, Termine und Preise maschinenlesbar, aktuell und **widerspruchsfrei** sind. Heute hat Platzhirsch bei Minotti 2 von 487, bei Poliform 0 von 103 und bei Paola Lenti 0 von 100 Produkten Maße im Datensatz (Masterplan Abschn. 2) [Fakt, intern]. Das ist die größte Lücke für 2030, nicht das Design.
3. **Maschinen prüfen Behauptungen.** Ein Agent gleicht „Händler“-Aussagen gegen die Händlerverzeichnisse der Hersteller ab, Adressen gegen Google/OSM/Firmenbuch. Die Hausnummer 9/11 und der Minotti-Claim sind deshalb nicht nur ein UWG-Risiko, sondern ein **Ranking-Risiko in Agenten** [These].
4. **Produktpass kommt für Möbel etwa 2029/2030**, für die eigene Binni-Küchenlinie trifft er Platzhirsch voraussichtlich als **Importeur bzw. Hersteller** mit vollen Pflichten, nicht nur als Händler [Schätzung, anwaltlich prüfen]. Wer 2027 eine saubere Kundenakte pro verkaufter Position anlegt, hat den Pass 2030 fast geschenkt.
5. **AR-Brillen und generative 3D-Räume sind 2027 noch kein Kanal**, aber ab ca. 2029 ein Planungswerkzeug. Vorbereiten heißt: **3D-Lizenzen und echte Maße sammeln**, nicht Apps bauen.

---

## 1. Was dieser Bericht anders macht als Bericht 12

| Bericht 12 sagt | Dieser Bericht ergänzt |
|---|---|
| KI-Assistent auf der eigenen Website (2027/28) | Fremde Agenten (ChatGPT, Gemini, Perplexity, Bank- und Kartenagenten) kommen **zu** Platzhirsch, über Protokolle und Feeds |
| AR/3D steigert Conversion (Houzz, Shopify) | Was Brillen 2026–2030 können, welche Dateiformate standardisiert werden, welche Rechte fehlen |
| Produktpass „vor der Pflicht“ | Zeitachse, Pflichten nach Rolle (Händler vs. Importeur Binni), GS1 Digital Link, Datenfelder |
| Silver Society, Erben | Die Erben-Generation nutzt Agenten für Nachlass und Neueinrichtung: was daraus technisch folgt |
| Social Commerce | Live-Shopping nüchtern: kaum Belege für Premium-Möbel |

---

## 2. Signale, Stand Oktober 2026 [Fakt]

| # | Signal | Was belegt ist | Quelle |
|---|---|---|---|
| S1 | **Agentic Commerce Protocol (ACP)** | OpenAI und Stripe, Sept. 2025, Open Source (Apache 2.0). Treibt „Instant Checkout“ in ChatGPT. Händler bleibt Verkäufer (Merchant of Record), nimmt Bestellung an oder lehnt ab, wickelt über eigenen Zahlungsdienst ab. Start mit Etsy (USA), danach Shopify-Händler; Gebühr pro Kauf (für Shopify-Händler berichtet 4 % ab 26.01.2026, Sekundärquelle) | eesel.ai, traveldailynews, channelengine (s. Quellen) |
| S2 | **OpenAI Product Feed Spec** | Pflichtfelder: `item_id`, `title`, `description`, `url`, `brand`, `seller_name`, `image_url`, `availability`, `price`. Optional u. a. `gtin`, `mpn`, `material`, `color`, `dimensions`/`length`/`width`/`height`, `weight`, `shipping_price`, `accepts_returns`, `return_policy`, `review_count`, `star_rating`. Flags `is_eligible_search`, `is_eligible_checkout` (Checkout nur mit `seller_privacy_policy` und `seller_tos`). **Standard-Upload zielt derzeit auf USA**; weitere Märkte nur nach Freigabe durch OpenAI | [developers.openai.com/commerce/specs/feed](https://developers.openai.com/commerce/specs/feed) (primär) |
| S3 | **Google Universal Commerce Protocol (UCP) + AP2** | Jan. 2026, mit Shopify, Etsy, Wayfair, Target, Walmart. UCP: Entdeckung, Warenkorb; AP2: signiertes „Mandat“ als Nachweis, dass ein Mensch den Kauf freigegeben hat. Händler veröffentlicht ein maschinenlesbares Profil unter `/.well-known/ucp`; Anbindung per REST, MCP oder A2A. Live in AI Mode/Gemini für US-Händler | InfoQ, datasolution.fr, juspay (Sekundär; Google-Doku vor Bau prüfen) |
| S4 | **Google agentic checkout und „Let Google Call“** | Nov. 2025, USA: Agent kauft nach Freigabe mit Preisgrenze; KI ruft lokale Geschäfte an und fragt Verfügbarkeit, Preis, Aktionen ab. Voraussetzung für Anrufe: **aktuelle Öffnungszeiten und Kontaktdaten im Unternehmensprofil** | [TechCrunch 13.11.2025](https://techcrunch.com/2025/11/13/google-expands-ai-shopping-with-conversational-search-agentic-checkout-and-an-ai-that-calls-stores-for-you) |
| S5 | **Agenten-Zahlungen Europa** | Visa „Agentic Ready“ (März 2026, London), Live-Transaktionen über Agenten in Europa angekündigt Juli 2026 (Paris); Mastercard Agent Pay, erste europäische Live-Zahlung mit Santander März 2026 (Sekundärquelle) | [Visa Pressemitteilung](https://www.visa.co.uk/about-visa/newsroom/press-releases.3457328.html), ibsintelligence, ai2.work |
| S6 | **Agenten-Identität** | Visa „Trusted Agent Protocol“ mit Cloudflare auf Basis „Web Bot Auth“: Händler erkennen signierte, legitime Agenten und blocken den Rest. Mastercard und Amex nutzen denselben Ansatz | [Business Wire 14.10.2025](https://www.businesswire.com/news/home/20251014144421/en) |
| S7 | **Marktprognose** | McKinsey: bis 2030 bis zu 1 Bio. $ „orchestrierter“ B2C-Umsatz in den USA, global 3–5 Bio. $ (nur Waren) | [McKinsey](https://www.mckinsey.com/industries/retail/our-insights/the-agentic-commerce-opportunity-how-ai-agents-are-ushering-in-a-new-era-for-consumers-and-merchants) |
| S8 | **KI-Suche in DACH** | Google AI Mode („KI-Modus“) seit Oktober 2025 in Deutschland, der Schweiz und weiteren EU-Ländern | [onlinemarketing.de](https://onlinemarketing.de/technologie/google-ai-mode-deutschland-start-eu-rollout), [retail-news.de](https://retail-news.de/google-ai-mode-deutschland-start-alle-nutzer/) |
| S9 | **Weniger Klicks** | Pew (900 US-Erwachsene, März 2025): bei KI-Zusammenfassung seltener Klicks auf Ergebnisse, Klick auf zitierte Quelle „sehr selten“ (Sekundärquellen: 8 % vs. 15 %, 1 % Quellenklick) | [Pew Research 22.07.2025](https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/) |
| S10 | **Smart Glasses** | IDC: Q1/2026 ca. 2,25 Mio. Brillen ohne Display (+167 %), 2026 ca. 13,6 Mio., 2030 ca. 27,3 Mio.; Meta 69 % Marktanteil. Android-XR-Brillen (Samsung, ohne Display, mit Gemini) Start Herbst 2026 | [IDC 15.06.2026](https://www.idc.com/resource-center/blog/smart-glasses-surge-the-xr-market-is-rewriting-its-own-rules/), [Android Authority](https://androidauthority.com/samsung-smart-glasses-launch-date-3717873) |
| S11 | **Generative 3D-Räume** | World Labs Marble 1.1 (April 2026): begehbare 3D-Welten aus Text, Fotos, 360°-Panoramen, Export als Gaussian Splats (.spz/.ply) oder Mesh. Khronos: glTF-Erweiterung `KHR_gaussian_splatting` als Release Candidate (Feb. 2026), noch nicht ratifiziert; Unterstützung in Babylon.js, PlayCanvas, Cesium | [radiancefields.com](https://radiancefields.com/world-labs-formally-launches-marble-a-generative-world-model), [Khronos](https://www.khronos.org/news/press/gltf-gaussian-splatting-press-release) |
| S12 | **Ökodesign/Produktpass** | ESPR = VO (EU) 2024/1781. Arbeitsplan 2025–2030 am 16.04.2025: Möbel Priorität, delegierter Rechtsakt **indikativ 2028**, Matratzen 2029; Zwischenbewertung 2028. Branchenübliche Übergangsfrist nach Erlass ca. 18 Monate (Sekundär). Zentrales DPP-Register für Juli 2026 geplant, Inkrafttreten nicht bestätigt | [SGS](https://www.sgs.com/en/news/2025/06/safeguards-07325-eu-releases-espr-working-plan-2025-2030-prioritizing-textiles-for-sustainability), [One Click LCA](https://oneclicklca.com/en-gb/resources/articles/first-espr-working-plan), [Renoon](https://www.renoon.com/blog/the-timeline-of-digital-product-passport-regulation-in-eu-espr-from-product-groups-to-rollout-schedule) |
| S13 | **GS1 Sunrise 2027** | Branchenziel (kein Gesetz): Kassen weltweit sollen bis Ende 2027 2D-Codes (GS1 Digital Link QR) lesen; ein Code kann Kasse, Kundeninfo und später Produktpass bedienen | [QR Planet](https://qrplanet.com/blog/article/sunrise-2027-and-gs1-qr-codes) (Anbieterquelle) |
| S14 | **Umweltaussagen** | RL (EU) 2024/825 („Empowering Consumers“), in AT über UWG-Novelle, anzuwenden ab **27.09.2026**: allgemeine Umweltaussagen ohne anerkannte Spitzenleistung/Siegel unzulässig, neue Verbote zu Obsoleszenz und irrelevanten Vorteilen | [BMWET](https://www.bmwet.gv.at/Themen/Europa/Wettbewerbspolitik/EU-Verbraucherschutz-und-Lauterkeitsrecht.html), [WKO](https://www.wko.at/oe/oesterreich/uwg-verbraucherrecht-umwelt-nachhaltigkeit) |
| S15 | **Alterung** | Statistik Austria (Prognose Nov. 2025): Anteil 65+ in Österreich von 20,0 % auf 26,2 % bis 2040; Vorarlberg wächst bis 2040 auf ca. 426 T Einwohner (+3,7 %) | [Statistik Austria](https://www.statistik.at/fileadmin/announcement/2025/11/20251112Bevoelkerungsprognose.pdf) |

**Lesart:** Alle Protokolle (S1–S6) sind 2026 **US-first**. Für Platzhirsch heißt das: 2027 ist Vorbereitungsjahr, nicht Einsatzjahr. Die Zahlungsseite (Visa, Mastercard) ist in Europa schon weiter als die Shop-Seite.

---

## 3. Was das für Premium-Einrichtung im Dreiländereck bedeutet

### 3.1 Agentic Commerce: Der Agent als Vorfilter, nicht als Käufer

**These:** Bis 2030 kaufen Agenten selbstständig **Standardware mit klarem Preis** (Gutscheine, Kerzen, Leuchten, Ersatzbezüge, Outdoor-Kissen). Ein Minotti-Sofa oder eine Küche kauft niemand per Agent. Dort übernimmt der Agent die **Vorauswahl**: „Finde mir drei Studios zwischen Lindau und St. Gallen, die den Minotti Lawrence ausgestellt haben, in die Schweiz verzollt liefern und am Samstag einen Termin frei haben.“

**Was ein Agent dafür von Platzhirsch abfragen können muss** [Schätzung, abgeleitet aus S2–S4]:

| Frage des Agenten | Datenquelle 2030 | Stand heute |
|---|---|---|
| Ist Modell X in Lochau zu sehen? | Feld `in_ausstellung` + Ausstellungsfläche | fehlt (Masterplan Abschn. 8 geplant) |
| Maße, Sitzhöhe, passt es durch 80 cm Tür? | `masse_*`, `paketmasse_cm` | Minotti 2/487, Poliform 0/103 |
| Lieferzeit bis Rorschach? | `lieferzeit_wochen_*`, `versand_laender` | fehlt |
| Preis oder Preisrahmen in CHF? | `preis_*` nur bei `preis_freigabe` | fehlt, Herstellerfreigabe offen (E13) |
| Freier Beratungstermin? | Kalender-API (Cal.com o. ä.) | Entscheidung E7 offen |
| Ist der Händler autorisiert? | **Händlerverzeichnis des Herstellers**, nicht die Website | nur ClassiCon gelistet |
| Seriös? Bewertungen? | Google-Profil, Bewertungsanzahl | Aufbau läuft (09) |

**Folgen für Platzhirsch:**
- **Ehrlichkeit wird maschinell durchgesetzt** [These]. Ein Agent, der „Minotti-Händler Bodensee“ beantworten soll, liest die Herstellerseite. Eine Website, die etwas anderes sagt, verliert Vertrauenspunkte. Die Claim-Bereinigung aus AP0 ist also auch Agenten-Optimierung.
- **Die eigene Binni-Linie ist der natürliche Agenten-Kanal.** Nur dort darf Platzhirsch Preise, Konfigurationen und Bilder frei ausspielen (26, Abschn. 2.1). Ein Agent kann eine Küche „Festpreis ab X € mit Steinplatte, Lieferung FL/CH“ vergleichen. Bei Minotti kann er das nicht.
- **Termin ist die Conversion.** Bei Premium-Möbeln ist das Ziel eines Agenten-Kontakts ein gebuchter Showroom- oder Video-Termin, kein Warenkorb. Die Termin-Schnittstelle (E7) ist deshalb wichtiger als ein Agenten-Checkout.
- **Gebühren-Risiko:** Plattform-Checkouts kosten Provision (S1: berichtet 4 %). Bei Accessoires mit 40–50 % Rohertrag tragbar, bei Möbeln nicht [Schätzung]. Für hochpreisige Ware also: Agent bringt Lead, Abschluss im Haus.

### 3.2 KI-Suche statt Google-Klicks: was über 08 F10 hinaus nötig ist

Bericht 08 F10 regelt llms.txt, robots und ein monatliches Prompt-Monitoring. Ergänzend:

1. **Vom Klick zum „Antwortanteil“.** Wenn nur noch wenige auf Quellen klicken (S9), zählt, ob Platzhirsch **in der Antwort genannt** wird. KPI ab 2027: Anteil der 30 Monitoring-Prompts, in denen Platzhirsch mit korrekter Adresse und korrekter Rolle (ohne Händler-Behauptung) erscheint. Ziel Ende 2027: ≥ 40 % [Schätzung, Basiswert in KW 46 messen].
2. **Eine Wahrheit pro Fakt (Entitäten-Hygiene).** KI-Systeme verschmelzen Quellen. Widersprüche (Landstraße 9 vs. 11, „Platzhirsch Home Living“ vs. „Platzhirsch Studio“ vs. Firmenbuchname, alte Öffnungszeiten auf Herold) erzeugen falsche Antworten. Nach der geplanten Ausgliederung in die Handels-GmbH ändert sich der Rechtsträger: **an einem Tag überall** umstellen (Impressum, `Organization`-Schema, Google, Apple Business Connect, Bing Places, Herold, Firmen-ABC, WKO-Firmen-A–Z, Stripe, Merchant Center) [Schätzung: 1 Arbeitstag mit Checkliste].
3. **Das Google-Unternehmensprofil wird zur API.** „Let Google Call“ (S4) und lokale KI-Antworten lesen Öffnungszeiten, Kategorien, Produkte und Q&A direkt aus dem Profil. Pflege nicht als Marketing, sondern als **Datenpflege mit Verantwortlichem** behandeln. Wichtig: Wenn ein Agent im Studio anruft, muss das Team wissen, wie es reagiert (Leitfaden: freundlich, nur gesicherte Auskünfte zu Preis und Verfügbarkeit, Rückruf anbieten).
4. **Strukturierte Antworten statt Prosa.** Jede Produktseite braucht eine kurze, faktische Datentabelle (Maße, Materialien, Lieferzeit-Spanne, Liefergebiete, „ausgestellt: ja/nein/auf Anfrage“). Das deckt AP4 teilweise ab. Für Agenten zusätzlich als JSON unter einer stabilen URL (Abschn. 5.3).
5. **Messung von Agenten-Verkehr.** In den Server-Logs die Nutzer-Kennungen `ChatGPT-User`, `OAI-SearchBot`, `PerplexityBot`, `Perplexity-User`, `Claude-User`, `Google-Agent`-Varianten u. a. getrennt zählen (ohne personenbezogene Daten). In GA4 eine Kanalgruppe „KI-Assistenten“ (Referrer chatgpt.com, perplexity.ai, gemini.google.com, copilot.microsoft.com). Bot-Namen ändern sich: Liste halbjährlich prüfen.

### 3.3 Räumliches Computing und AR-Brillen

**Stand:** Brillen verkaufen sich 2026 stark, aber überwiegend **ohne Display** (S10): Kamera, Mikrofon, KI-Assistent. Brillen mit Display sind teuer und selten.

**These für 2027–2032:**
- **2026–2028:** Die Brille ist ein **Suchgerät**. Kunde schaut im Hotel am Arlberg auf einen Sessel und fragt „Was ist das, wo gibt es das?“. Die Antwort kommt aus Produkterkennung plus Websuche. Gewinner: wer saubere Produktbilder, Modellnamen und Lagerorte im Netz hat. Das ist dieselbe Datenarbeit wie 3.1.
- **2029–2032:** Brillen mit Display und Handy-AR machen **maßstabsgetreues Platzieren** im eigenen Wohnzimmer normal. Dafür braucht es lizenzierte 3D-Modelle (GLB/USDZ) mit echten Maßen. Ohne Herstellerlizenz darf Platzhirsch keine eigenen 3D-Modelle geschützter Designs erstellen (14 F3, EuGH *Mio/konektra*).
- **Showroom als digitaler Zwilling:** Ein Gaussian-Splat-Scan des Showrooms (S11) ist technisch billig. Rechtlich zeigt er aber geschützte Möbelwerke in einer neuen, begehbaren Form. Ob die Ausstellungs- oder Katalogbildfreiheit das deckt, ist offen **[anwaltlich prüfen: §§ 54, 56 UrhG AT; Art. 5 Abs. 3 lit. j InfoSoc-RL]**. Bis dahin nur mit schriftlicher Zustimmung der Marken, sinnvoll zuerst für Räume mit eigener Binni-Küche.

**Empfehlung:** 2027 keine App und kein „Metaverse-Showroom“. Stattdessen bei jedem Gespräch mit Marken (Gate 0) die Frage stellen: „Gibt es 3D-Daten (GLB/USDZ/Roomle) mit Lizenz für Händler-Websites und AR?“ Antworten im Marken-Doctype ablegen (`3d_lizenz`, Abschn. 5.1).

### 3.4 Generative 3D-Räume und KI-Raumplanung

Bericht 12 und digital/06 planen „Ihr Raum in 48 h“ und einen KI-Raumplaner. Neu ab 2026 ist, dass Modelle wie Marble aus **einem Foto einen begehbaren Raum** erzeugen (S11). Bis 2030 wird das in Endkunden-Apps und Agenten eingebaut sein [These].

**Was das bedeutet:**
- **Die Bildkraft wird billig, die Wahrheit nicht.** Jeder Kunde kann sich 2030 seinen Raum „mit Minotti“ generieren lassen. Ob die Kombination lieferbar ist, ob der Stoff für das Modell freigegeben ist, ob das Sofa durchs Treppenhaus passt, weiß nur der Händler mit echten Daten. **Platzhirschs Rolle: der „Realitäts-Check“ für generierte Räume** [These].
- **Konkretes Angebot ab 2028:** „Bringen Sie Ihre KI-Bilder mit.“ Kunde lädt ein generiertes Bild hoch, Platzhirsch liefert eine Stückliste realer, lieferbarer Produkte mit Maßen, Preisrahmen und Lieferzeit. Technisch: Bildsuche gegen den eigenen Katalog (Bild-Embeddings auf der eigenen GPU, digital/06), Ergebnis von einer Beraterin geprüft.
- **Haftung:** Generierte Raumbilder sind nach Art. 50 AI Act zu kennzeichnen (14 F14). Zusätzlich im Angebot: „Visualisierung, nicht maßstabsgetreu; verbindlich sind Planung und Maße im Angebot“.

### 3.5 Digitaler Produktpass: Zeitachse und Rolle

**Zeitachse [Schätzung aus S12]:**

| Jahr | Ereignis |
|---|---|
| 2026 | Registry- und IT-Rahmen der Kommission; Normung (CEN/CENELEC) läuft |
| 2028 | Delegierter Rechtsakt Möbel (indikativ); Zwischenbewertung des Arbeitsplans kann verschieben |
| 2029–2030 | Anwendung für neu in Verkehr gebrachte Möbel (ca. 18 Monate nach Erlass) |
| ab 2030 | Pass-Zugang für Kunden im Laden und online Pflicht, soweit der Rechtsakt es vorsieht |

**Rolle entscheidet die Pflicht [anwaltlich prüfen, ESPR Kapitel zu den Pflichten der Wirtschaftsakteure]:**
- **Als Händler** (Minotti, Poliform, Flos usw.): Pass kommt vom Hersteller. Platzhirsch muss voraussichtlich sicherstellen, dass Kunden den Pass erreichen, auch online (Link oder QR auf der Produktseite) und keine Ware ohne Pass anbieten.
- **Als Importeur oder Hersteller der Binni-Linie:** Binni sitzt im Kosovo, also außerhalb der EU. Wer ein Produkt aus einem Drittland in der EU in Verkehr bringt, ist Importeur; wer es **unter eigenem Namen** („Platzhirsch Cucina“) vertreibt, gilt nach GPSR (Art. 3 Nr. 8 VO 2023/988) als Hersteller, und ESPR folgt einer ähnlichen Logik [anwaltlich prüfen]. Dann muss Platzhirsch den Pass **selbst erstellen**: Materialien, Herkunft, Reparierbarkeit, Ersatzteile, ggf. CO2-Angaben. Das geht nur, wenn Binni die Daten liefert. **Vertragsklausel jetzt verhandeln** (Datenlieferpflicht, Format, Prüfrecht).
- Möbel aus dem Kosovo fallen unter das Stabilisierungs- und Assoziierungsabkommen EU–Kosovo (Ursprungsregeln); Zoll und Ursprungsnachweis sind Sache des Steuerberaters und Spediteurs (18) [vom Unternehmen auszufüllen].

**Technischer Kern:** Pass = eine stabile URL pro Produkt (Modell) bzw. Einzelstück mit Datensatz dahinter. Die Kommission bevorzugt offene Standards; GS1 Digital Link ist ein wahrscheinlicher Träger (S13) [These]. Daraus folgt für die eigene Linie: **GS1-Austria-Mitgliedschaft und eigene GTINs** vor dem ersten Online-Verkauf; sie werden ohnehin für Google Merchant Center und OpenAI-Feed (`gtin`) gebraucht.

### 3.6 Kreislauf-Möbel: was nach Circle (12, 4.1) kommt

- **Herkunft hebt den Wiederverkaufswert.** Ein Sessel mit lückenloser Akte (Kaufdatum, Stoff, Pflege, Reparaturen) ist im Wiederverkauf mehr wert als einer ohne [These, Analogie Uhren- und Automarkt]. Die Kundenakte (12, 4.8) wird so zum Circle-Motor: Platzhirsch kann 2030 Rückkaufangebote machen, weil es weiß, was wo steht.
- **Neue Werberegeln seit 27.09.2026 (S14):** „nachhaltig“, „umweltfreundlich“, „klimaneutral“ ohne anerkannten Nachweis sind unzulässig. Circle-Texte müssen konkret sein („aufbereitet von Polsterei X, neuer Bezug, 12 Monate Gewährleistung“). Aussagen zur Lebensdauer brauchen Belege. Das Claims-Register (14 F2) um Umweltaussagen erweitern.
- **Agenten-Fähigkeit von Gebrauchtware:** Jedes Circle-Stück als eigener Datensatz mit `zustand`, Fotos, Maßen, Preis. Gebrauchtware ist für Agenten ideal: Einzelstück, fester Preis, keine Herstellerfreigabe nötig (Erschöpfung, 14 F12).

### 3.7 Hyperpersonalisierung: der Kunde bringt seinen Agenten mit

**These:** Ab ca. 2028 speichern persönliche Assistenten Wohnungsgrundriss, Stilvorlieben, Budget und Maße. Nicht die Website personalisiert, sondern **der Agent des Kunden fragt mit diesem Kontext an**.

Folgen:
- Platzhirsch braucht weniger eigene Tracking-Personalisierung und mehr **Fähigkeit, strukturierte Anfragen anzunehmen** (Grundriss als PDF/Bild, Maße, Budget, Zeitrahmen). Die Anfrage-Felder aus Masterplan Abschn. 8.2 sind dafür die richtige Basis.
- **Keine personalisierten Preise.** Seit der Omnibus-RL muss ein auf automatisierter Entscheidung personalisierter Preis offengelegt werden (Art. 6 Abs. 1 lit. ea VRRL; AT § 4 FAGG) [anwaltlich prüfen]. Für eine Premiummarke ist das ein Vertrauensrisiko ohne Nutzen. Regel: gleicher Preis für alle, Rabatte nur nach offenen Regeln.
- Personalisierung im Haus ja, aber **mit Einwilligung und sichtbar**: „Ihre Merkliste und Raumdaten sind in Ihrer Kundenakte, Sie können sie jederzeit löschen.“

### 3.8 Live-Shopping: niedrige Priorität

Belege für Premium-Möbel fehlen. In Deutschland ist Live-Shopping ein kleiner Kanal, Schwerpunkt Mode und Kosmetik; Simon-Kucher (2023): zwei Drittel offen, aber nur 8 % hatten gekauft [Fakt, älter] ([Simon-Kucher](https://www.simon-kucher.com/de/who-we-are/newsroom/live-shopping-studie-mehrheit-der-deutschen-offen-fuer-online-kauf-events)). **Empfehlung:** kein Live-Shopping-Format. Stattdessen Event-Aufzeichnungen (Adventsabend, Marken-Talks) als Video mit Kapitelmarken und Produktlinks. Video-Beratung 1:1 regelt digital/05.

### 3.9 Wohnen im Alter und Erben: die digitale Seite

Ergänzend zu 12, 2.1 und 4.6:
- **Entscheider sitzen woanders.** Bei Downsizing der Eltern (65+, Anteil steigt auf 26 % bis 2040, S15) entscheiden oft erwachsene Kinder aus Zürich, München oder Wien mit. Sie arbeiten remote und mit Agenten. Bedarf: Video-Begehung, geteilte Planungsmappe, digitale Freigabe, Festpreis.
- **Nachlass-Inventar per Foto.** Erben fotografieren ein Haus und lassen KI erkennen, was wertvoll ist. Platzhirsch kann 2028 einen Dienst anbieten: „Schicken Sie uns Fotos, wir erkennen Designklassiker und machen ein Kommissionsangebot“ (Circle). Technisch dieselbe Bildsuche wie 3.4, Wertangabe nur nach Begutachtung durch einen Menschen.
- **Barrierefreiheit als Produkt.** Altersgerechte Höhen (Sitzhöhe, Aufstehhilfe, Bettenhöhe) als **filterbare Daten**: `sitzhoehe` steht schon in der Feldliste; ergänzen um `aufstehhilfe`, `armlehne` (ja/nein). Agenten werden „Sofa mit Sitzhöhe ≥ 46 cm“ suchen [These].

---

## 4. Szenarien 2030

| Szenario | Beschreibung | Wahrscheinlichkeit [Schätzung] | Was Platzhirsch dann braucht |
|---|---|---|---|
| **A „Agent als Vorfilter“** | Agenten in ChatGPT, Gemini, Apple, Bank-Apps erstellen Shortlists und buchen Termine; Kauf großer Möbel bleibt im Showroom; Standardware wird teils per Agent gekauft | ca. 55 % | Saubere Daten, Termin-API, Bewertungen, Feeds für Accessoires und Binni-Linie |
| **B „Plattform und Hersteller direkt“** | Hersteller (Minotti, Poliform) verbinden ihre Kataloge direkt mit Agenten, Händler werden nur noch nach Händlerverzeichnis verteilt | ca. 25 % | Offizieller Händlerstatus wird überlebenswichtig; eigene Linie (Binni) und Service (Planung, Montage, Circle) als Absicherung |
| **C „Europa bremst“** | Haftung, Zahlungsregeln (PSD2/PSD3, starke Kundenauthentifizierung), AI Act und Vertrauen verlangsamen Agenten-Kauf in der EU um 3–5 Jahre | ca. 20 % | Gleiche Datenbasis, nur später genutzt; kein Schaden, weil die Arbeit auch SEO, Ads und Merchant Center dient |

**Wichtig:** Alle drei Szenarien verlangen **dieselbe Vorbereitung**. Datenqualität ist eine „No-Regret“-Investition.

**Frühindikatoren (halbjährlich prüfen):**
1. Instant Checkout oder UCP für Händler in AT/DE/CH freigeschaltet (OpenAI-Feed `target_countries`, Google Merchant Center).
2. Stripe: Shared Payment Token / agentische Zahlungen für EU-Konten.
3. Minotti oder Poliform liefern Produktdaten an KI-Plattformen oder bieten „Find a dealer“-API.
4. Anteil Agenten-Verkehr in den eigenen Logs > 2 % der Sitzungen.
5. Delegierter Rechtsakt Möbel im Amtsblatt (Entwurf in „Have your say“ der Kommission).
6. Display-Brillen unter 800 € in DACH im Handel.

---

## 5. Was Platzhirsch 2027 technisch vorbereiten muss

Grundsatz: **Ein Datensatz, viele Ausgänge.** Das Backoffice (Frappe) ist die einzige Quelle. Website, Google Merchant Center, OpenAI-Feed, spätere UCP-Schnittstelle, Produktpass und Kundenakte lesen alle daraus. Nichts wird doppelt gepflegt.

### 5.1 Produktdaten-Kanon: Felder, die zum Masterplan (Abschn. 8) **dazukommen**

| Feld (neu) | Typ | Wofür | Ausgang |
|---|---|---|---|
| `material_haupt`, `material_details` (strukturiert: Holzart, Metall, Stein, Stoffgruppe) | Select / Table | Filter, Agentenfrage „Massivholz?“, Produktpass | Schema `material`, OpenAI `material`, DPP |
| `farbe_normiert` | Select (feste Liste) | Filter, Bildsuche | Schema `color`, OpenAI `color` |
| `stoff_codes_freigegeben` | Table (Kollektion, Kategorie) | „Ist Stoff X für Modell Y möglich?“ | Concierge, Planung |
| `sitzhoehe`, `aufstehhilfe`, `armlehne` | Float / Check | Wohnen im Alter | Filter, Agent |
| `pflegeklasse`, `pflegehinweis_url` | Select / URL | Kundenakte, Wiederkauf | Kundenakte, DPP |
| `reparierbar`, `ersatzteile_verfuegbar_bis`, `neubezug_moeglich` | Check / Date / Check | Circle, ESPR-Logik | DPP, Circle |
| `ursprungsland_fertigung` | Data | Ehrlichkeit (Binni: Kosovo), Zoll, DPP | Seite, Feed, DPP |
| `dpp_url` | URL | Link zum Herstellerpass, sobald vorhanden | Produktseite, QR |
| `3d_lizenz` (keine / Web / AR / KI-Input), `3d_quelle` | Select / Data | Rechte für AR, generative Planung | Welle 3, AR |
| `ki_input_freigabe` | Check | Darf das Bild in KI-Raumplanung? | digital/06 |
| `agent_feed` | Check | Darf das Produkt in KI-Feeds (OpenAI, Google)? | Feed-Export |
| `daten_geprueft_am`, `daten_geprueft_von` | Date / Link | Aktualität, Haftung | intern, `dateModified` |

**Marken-Doctype zusätzlich:** `haendlerverzeichnis_url` (Link zur Herstellerseite, auf der Platzhirsch steht oder nicht), `daten_feed_hersteller` (gibt es einen offiziellen Datenfeed?), `3d_lizenz_marke`, `ki_richtlinie_marke` (erlaubt die Marke KI-Visualisierung?).

**Binni-Linie zusätzlich:** `gtin` (eigene GS1-Nummern), `stein_herkunft`, `stein_art`, `oberflaeche`, `korpus_material`, `beschlag_marke`, `geraete_marken`, `festpreis_eur`, `festpreis_chf`, `konfig_regeln` (JSON).

### 5.2 Datenqualität messbar machen

| Kennzahl | Heute | Ziel 31.12.2027 [Schätzung] | Ziel 2030 |
|---|---|---|---|
| Top-300-Produkte mit vollständigen Maßen (B/T/H, Sitzhöhe wo relevant) | Minotti 0,4 %, Poliform 0 %, Paola Lenti 0 % | 95 % | 100 % aller aktiven |
| Produkte ohne Bild | 152 | < 20 | 0 |
| Produkte mit Bildrechte-Status ≠ „nicht geklärt“ | unbekannt [vom Unternehmen auszufüllen] | 80 % der Top 300 | 100 % im Feed |
| Produkte mit `lieferzeit_wochen_*` | 0 | 100 % der Top 300 | alle |
| Produkte mit `in_ausstellung` korrekt | 0 | 100 % (Inventur 2× jährlich) | tagesaktuell |
| Binni-Linie: Datensatz komplett inkl. GTIN, Ursprung, Materialien | – | 100 % vor Online-Start | DPP-fähig |
| NAP-Widersprüche in Verzeichnissen | mehrere (9/11) | 0 | 0 |

**Aufwand [Schätzung]:** Maße und Lieferzeit für 300 Produkte aus Herstellerdatenblättern (841 PDFs liegen schon im Backoffice): ca. 8–12 Minuten pro Produkt = 40–60 Stunden. Teilautomatisierbar: KI liest die PDFs aus, ein Mensch prüft jede Zeile (Stichprobe reicht nicht, weil falsche Maße Haftung bedeuten). Kosten ca. 2–4 T€ intern oder durch eine Werkstudentin.

**Prüfregel im CI:** Ein nächtlicher Job zählt die Kennzahlen und meldet Rückschritte (passt zu „Regeln in CI, nicht im Wiki“, Masterplan Abschn. 1).

### 5.3 Schnittstellen: von der Website zur „Agenten-Oberfläche“

Stufenplan, jede Stufe nur bei Erfüllung des Frühindikators:

| Stufe | Wann | Was | Technik |
|---|---|---|---|
| **1 Lesbar** | 2027 | Öffentlicher, schreibgeschützter Katalog-Endpunkt `GET /api/katalog/v1/produkte` (JSON, nur freigegebene Felder, ohne Preise ohne Freigabe); Produktseiten mit vollständigem `Product`/`Offer`-Schema; `Organization`/`FurnitureStore`-Schema mit `sameAs` | Next.js Route Handler mit Cache, Daten aus Frappe; Rate-Limit; Versionierung `v1` |
| **2 Buchbar** | 2027/28 | Termin-Verfügbarkeit maschinenlesbar (freie Slots, Beratungsart), Anfrage-Endpunkt mit strukturierten Feldern (Grundriss, Maße, Budget) | Kalender-API (E7), Anfrage-API mit Schema-Validierung (zod), Honeypot/Rate-Limit |
| **3 Feeds** | sobald Märkte offen | Google Merchant Center (lokales Inventar, Atelier, Accessoires, Binni), **OpenAI-Feed** (Felder aus S2) für Accessoires, Gutscheine, Atelier, Binni; Möbel nur `is_eligible_search`, nie Checkout | Ein Feed-Generator, mehrere Formate (XML/TSV für Google, JSONL für OpenAI) |
| **4 Kaufbar für Agenten** | ab EU-Freigabe, frühestens 2028 [These] | Agenten-Checkout für Gutscheine und Standardware über Stripe (ACP-kompatibel) bzw. UCP-Profil unter `/.well-known/ucp` | Nur mit Rechtsträger Handels-GmbH, AGB, Widerrufsprozess, BaFG-Prüfung |
| **5 Dialogfähig** | 2028–2030 | MCP-Server mit Werkzeugen `suche_produkt`, `pruefe_masse`, `freie_termine`, `stelle_anfrage` für fremde Agenten und den eigenen Concierge | Gleicher Code wie Concierge (Masterplan Welle 3), keine Preis- oder Rabattverhandlung durch Agenten |

**Sicherheit und Kontrolle:**
- **Agenten erkennen statt raten:** Signierte Agenten (Web Bot Auth, S6) bevorzugt bedienen; unbekannter Massenabruf wird gedrosselt. Cloudflare oder ein vergleichbares Gateway vor der Seite prüfen [Schätzung: 0–25 $/Monat].
- **Keine Bilder an Agenten ohne Rechte:** Der Katalog-Endpunkt liefert nur Bilder mit Status „eigen“ oder „Marke freigegeben inkl. Drittplattformen“. Sonst nur Link zur Produktseite.
- **Datenschutz:** Anfragen von Agenten enthalten personenbezogene Daten des Kunden. Rechtsgrundlage, Informationspflicht und Herkunft im Datensatz vermerken (`quelle_kanal = agent:<name>`) [anwaltlich prüfen].
- **Vertragsschluss durch Agenten:** Wer haftet, wenn ein Agent falsch bestellt? AP2-Mandate (S3) sollen das belegen. Für Platzhirsch bis zur Klärung: Agenten-Bestellungen nur bis zu einer Wertgrenze (z. B. 500 €) und mit Bestätigungsmail an den Kunden **[anwaltlich prüfen: Zurechnung von Agentenerklärungen, FAGG-Pflichten, Widerrufsbelehrung]**.

### 5.4 Kundenakte und Produktpass-Bereitschaft

Pro verkaufter Position ab 2027 (Doctype „Kundenakte Position“, verknüpft mit Sales Order):
`produkt`, `modell`, `ausfuehrung`, `stoff_code`, `seriennummer_oder_charge` (falls vom Hersteller vorhanden), `lieferdatum`, `montiert_von`, `pflegeklasse`, `garantie_bis`, `reparaturen` (Child Table), `dpp_url`, `foto_einbausituation` (nur mit Einwilligung), `rueckkauf_einwilligung` (Check: darf Platzhirsch später ein Rückkaufangebot machen?).

Ausgang für den Kunden: eine persönliche, passwortlose Seite „Meine Möbel“ (Magic Link), später QR-Aufkleber im Möbel („Möbelpass Platzhirsch“, im Format GS1 Digital Link, damit er später mit dem amtlichen Pass zusammenpasst). Achtung: nicht „Digitaler Produktpass“ nennen, solange es kein amtlicher Pass ist (Irreführung, UWG) [anwaltlich prüfen].

**Aufwand [Schätzung]:** Doctype und Kundenseite 5–8 PT; Nachpflege der Aufträge 2024–2026 nur für Kunden mit Auftrag > 10 T€.

### 5.5 Rechte-Register für Daten, nicht nur Bilder

Das Bildrechte-Register (14 F3) um drei Spalten erweitern: **Feed** (Google/OpenAI/Pinterest), **KI-Input** (darf in Bildsuche und Raumgenerierung), **3D/AR**. Ohne diesen Status verlässt kein Asset die Website. So skaliert Platzhirsch in Agenten-Kanäle, ohne Abmahnrisiko zu vervielfachen.

### 5.6 Organisation

- **Rolle „Datenverantwortliche/r“** (0,2–0,3 VZÄ, Teil einer bestehenden Stelle): pflegt Kennzahlen 5.2, Unternehmensprofil, Verzeichnisse, Feed-Fehler. Ohne Person verfällt jede Datenqualität in 6 Monaten [Schätzung, Erfahrungswert aus PIM-Projekten].
- **Halbjährlicher Zukunftscheck** (2 Stunden, Inhaber + Datenverantwortliche/r): Frühindikatoren aus Abschn. 4 durchgehen, Stufe in 5.3 freigeben oder nicht.

---

## 6. Fahrplan 2027–2032

| Zeitraum | Meilenstein | Kosten [Schätzung] | Messgröße |
|---|---|---|---|
| **Q1–Q2 2027** | Felder 5.1 im Backoffice; Maße/Lieferzeit Top 300; NAP-Bereinigung; Agenten-Kanal in GA4 und Logs; Binni-Vertrag mit Datenlieferpflicht; GS1-Mitgliedschaft | 3–6 T€ + interne Zeit; GS1 Austria Jahresbeitrag [vom Unternehmen auszufüllen] | Kennzahlen 5.2, Antwortanteil |
| **Q3–Q4 2027** | Katalog-Endpunkt v1, Termin-API, Merchant Center mit lokalem Inventar; Kundenakte-Doctype; Feed-Generator (Google zuerst) | 5–10 T€ | Termine aus KI-Kanälen, Feed-Fehlerquote < 2 % |
| **2028** | OpenAI-/Gemini-Feed für Accessoires, Atelier, Binni sobald für AT/DE/CH offen; Concierge = MCP-fähig; „Bringen Sie Ihre KI-Bilder mit“; erste 3D-Modelle mit Lizenz (ClassiCon, Flos, Binni) | 10–25 T€ | Leads aus Agenten, Anteil KI-Bild-Anfragen |
| **2029** | Agenten-Checkout für Standardware (Wertgrenze); Produktpass-Prozess für Binni-Linie fertig vor Anwendung des Rechtsakts; Circle-Stücke im Feed | 10–20 T€ | Umsatz Agenten-Checkout, DPP-Abdeckung Binni 100 % |
| **2030–2032** | AR-Platzierung über Brillen/Handy für lizenzierte Modelle; Kundenakte als Rückkauf- und Wiederkaufmotor; Showroom-Zwilling nur mit Rechten | nach Wirkung | Wiederkaufquote, Rückkäufe |

Alle Beträge sind grobe Schätzungen auf Basis der Aufwandsangaben im Masterplan (PT-Sätze extern) und müssen vor Freigabe angeboten werden.

---

## 7. Was Platzhirsch nicht tun sollte

1. **Keine eigene App** und **kein Metaverse- oder VR-Showroom** vor 2029. Reichweite null, Pflegeaufwand hoch.
2. **Keine Blockchain/NFT-Produktpässe.** Der amtliche Pass wird webbasiert; Blockchain bringt Kosten ohne Nutzen.
3. **Keine personalisierten Preise** und kein Preisverhandeln durch KI-Agenten (Abschn. 3.7).
4. **Keine eigenen 3D-Scans oder Rekonstruktionen geschützter Designs** (14 F3).
5. **Keine Möbel über Plattform-Checkouts** mit Provision; Agenten führen zum Termin.
6. **Keine Umwelt-Pauschalclaims** („nachhaltig“, „klimaneutral“) seit 27.09.2026 ohne Beleg.
7. **Kein Live-Shopping-Format.**
8. **Keine „Agenten-Optimierung“ durch versteckte Texte** für KI (Prompt-Injection in Seiten, unsichtbare Anweisungen). Das ist Täuschung, wird von Plattformen bestraft und kann unlauter sein.
9. **Nicht auf ein Protokoll wetten.** ACP und UCP konkurrieren. Die eigene Datenbasis bleibt neutral; Adapter sind dünn und austauschbar.

---

## 8. Was der Inhaber entscheiden oder liefern muss

| # | Entscheidung / Lieferung | Bis | Empfehlung |
|---|---|---|---|
| Z1 | **Datenqualität als Projekt 2027** mit verantwortlicher Person (0,2–0,3 VZÄ) und Budget 3–6 T€ | Jan. 2027 | Ja. Größter Hebel für SEO, Ads, Feeds und Agenten zugleich |
| Z2 | **Binni-Vertrag:** Datenlieferpflicht (Materialien, Herkunft, Stein, Beschläge, Ersatzteile), Format, Prüfrecht; Rolle Importeur/Hersteller klären | vor Vertragsschluss | Ja, mit Anwalt [anwaltlich prüfen] |
| Z3 | **GS1-Austria-Mitgliedschaft** für eigene GTINs der Binni-Linie | vor Online-Start Binni | Ja |
| Z4 | **Marken-Fragen in Gate 0 ergänzen:** 3D-Lizenz, Datenfeed, KI-Richtlinie, Erlaubnis für KI-Feeds | Gate 0 (04.12.2026) | Ja, eine Zeile mehr pro Gespräch |
| Z5 | **Robots- und Agenten-Politik:** Agenten erlauben, signierte bevorzugen, Bilder schützen (ergänzt E10) | KW 46 | Erlauben, mit Rechte-Filter |
| Z6 | **Rechtsträger-Wechsel** an einem Stichtag überall umstellen | mit Ausgliederung | Checkliste aus Abschn. 3.2 |
| Z7 | **Wertgrenze und Regeln für Agenten-Bestellungen** | vor Stufe 4 (frühestens 2028) | 500 €, nur Standardware, Bestätigungsmail |
| Z8 | **Inventur „ausgestellt“** zweimal jährlich mit Verantwortlichem | ab Q1 2027 | Ja |
| Z9 | Liefern: Liste der Aufträge > 10 T€ seit 2024 für die Kundenakte; Bildrechte-Status je Marke | Q2 2027 | [vom Unternehmen auszufüllen] |

---

## 9. Grenzen dieser Analyse

- Protokolle und Plattformen ändern sich monatlich. Die meisten Angaben zu ACP, UCP und Agenten-Zahlungen stammen aus Sekundärquellen; primär geprüft ist nur die OpenAI-Feed-Spezifikation. Vor jedem Bau die aktuelle Entwicklerdokumentation lesen.
- Daten zum Delegierten Rechtsakt Möbel sind indikativ. Inhalt (welche Felder Pflicht werden) ist unbekannt; die Felder in 5.1 sind eine plausible Obermenge.
- Wahrscheinlichkeiten in Abschn. 4 sind begründete Schätzungen ohne Modell.
- Keine Zahlen zu Agenten-Verkehr bei Möbelhändlern in DACH gefunden; deshalb eigene Messung ab KW 46.
- Rechtliche Hinweise (Rolle nach ESPR/GPSR, Zurechnung von Agentenerklärungen, Showroom-Scans, personalisierte Preise) sind Arbeitsstand und anwaltlich zu prüfen.

---

## Quellen (abgerufen 26.10.2026)

**Agentic Commerce**
- OpenAI Product Feed Spec: https://developers.openai.com/commerce/specs/feed
- ACP/Instant Checkout: https://www.eesel.ai/de/blog/agentic-commerce-protocol-stripe , https://www.traveldailynews.com/technology/chatgpt-launches-instant-checkout-with-the-agentic-commerce-protocol/ , https://retail-insider.com/retail-insider/2025/10/salesforce-stripe-and-openai-partner-to-power-instant-checkout/
- Shopify-Gebühr (Sekundär): https://www.channelengine.com/nl/blog/marketplace-talk-january?hsLang=nl
- Europa-Status Instant Checkout: https://www.retaildetail.eu/news/general/is-chatgpts-instant-checkout-revolutionizing-e-commerce
- Google UCP/AP2: https://www.infoq.com/news/2026/01/google-ucp , https://www.datasolution.fr/en/google-universal-commerce-protocol/ , https://juspay.io/blog/google-s-universal-commerce-protocol-what-it-means-for-payment-orchestration
- Google agentic checkout / Let Google Call: https://techcrunch.com/2025/11/13/google-expands-ai-shopping-with-conversational-search-agentic-checkout-and-an-ai-that-calls-stores-for-you
- Visa Europa: https://www.visa.co.uk/about-visa/newsroom/press-releases.3457328.html , https://ibsintelligence.com/ibsi-news/visa-launches-agentic-payments-programme-in-europe/
- Mastercard/Santander (Sekundär): https://ai2.work/blog/santander-and-mastercard-complete-europe-s-first-live-ai-agent-payment
- Trusted Agent Protocol / Web Bot Auth: https://www.businesswire.com/news/home/20251014144421/en
- McKinsey: https://www.mckinsey.com/industries/retail/our-insights/the-agentic-commerce-opportunity-how-ai-agents-are-ushering-in-a-new-era-for-consumers-and-merchants

**KI-Suche**
- Pew Research: https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/
- AI Mode Deutschland: https://onlinemarketing.de/technologie/google-ai-mode-deutschland-start-eu-rollout , https://retail-news.de/google-ai-mode-deutschland-start-alle-nutzer/ , https://winfuture.de/news,154115.html

**Räumliches Computing, 3D**
- IDC Smart Glasses: https://www.idc.com/resource-center/blog/smart-glasses-surge-the-xr-market-is-rewriting-its-own-rules/
- Samsung/Android XR: https://androidauthority.com/samsung-smart-glasses-launch-date-3717873 , https://www.droid-life.com/2026/05/19/android-xr-launch-fall-2026/
- Khronos Gaussian Splatting: https://www.khronos.org/news/press/gltf-gaussian-splatting-press-release , https://radiancefields.com/the-khronos-group-introduces-a-gltf-baseline-for-gaussian-splatting
- World Labs Marble: https://radiancefields.com/world-labs-formally-launches-marble-a-generative-world-model , https://rits.shanghai.nyu.edu/ai/world-labs-releases-marble-1-1-auto-expanding-3d-world-generation

**Regulierung, Standards**
- ESPR-Arbeitsplan: https://www.sgs.com/en/news/2025/06/safeguards-07325-eu-releases-espr-working-plan-2025-2030-prioritizing-textiles-for-sustainability , https://oneclicklca.com/en-gb/resources/articles/first-espr-working-plan
- DPP-Zeitachse: https://www.renoon.com/blog/the-timeline-of-digital-product-passport-regulation-in-eu-espr-from-product-groups-to-rollout-schedule
- ESPR Volltext: VO (EU) 2024/1781, EUR-Lex https://eur-lex.europa.eu/eli/reg/2024/1781/oj
- GPSR: VO (EU) 2023/988, EUR-Lex https://eur-lex.europa.eu/eli/reg/2023/988/oj
- GS1 Sunrise 2027: https://qrplanet.com/blog/article/sunrise-2027-and-gs1-qr-codes
- RL (EU) 2024/825 / UWG-Novelle: https://www.bmwet.gv.at/Themen/Europa/Wettbewerbspolitik/EU-Verbraucherschutz-und-Lauterkeitsrecht.html , https://www.wko.at/oe/oesterreich/uwg-verbraucherrecht-umwelt-nachhaltigkeit

**Gesellschaft, Handel**
- Statistik Austria Bevölkerungsprognose 2025: https://www.statistik.at/fileadmin/announcement/2025/11/20251112Bevoelkerungsprognose.pdf
- Live-Shopping: https://www.simon-kucher.com/de/who-we-are/newsroom/live-shopping-studie-mehrheit-der-deutschen-offen-fuer-online-kauf-events , https://ecommercegermany.com/blog/live-shopping-in-dach/

**Intern:** `12-zukunftsforschung.md`, `23-masterkonzept.md`, `26-binni-kooperation.md`, `digital/00-digital-masterplan.md` (Abschn. 2, 5, 6, 8), `digital/08-seo-technisch-content.md` (F10), `digital/14-recht-compliance-digital.md` (F2, F3, F12, F14).
