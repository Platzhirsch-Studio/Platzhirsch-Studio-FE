# 16 – KI-Suche und Generative Engine Optimization (GEO)

**Stand:** 26.10.2026 · Rolle: Experte für Suchmaschinen und KI-Suche (Bing, Apple, ChatGPT, Perplexity, Gemini, Google AI Mode)
**Grundlage:** Code (`src/app/robots.js`, `src/app/llms.txt/route.js`, `src/app/[locale]/layout.js`), Live-Tests vom 26.10.2026, Berichte 00, 23, 25, digital/08, digital/09, digital/14
**Leitfrage:** Wie wird Platzhirsch genannt, wenn jemand ChatGPT, Perplexity, Copilot, Gemini, Google AI Mode oder Siri fragt: „Wo kann ich Minotti am Bodensee ansehen?“

> **Grundregel für alles hier:** KI-Systeme wiederholen, was im Netz steht. Wenn dort „offizieller Minotti-Händler“ steht, sagt ChatGPT das auch, und Platzhirsch haftet nach UWG für die eigene Aussage. GEO funktioniert nur mit **wahren, belegbaren und überall gleichen Fakten**. Bei Minotti und Poliform heißt das: „in der Ausstellung in Lochau zu sehen“, nie „Händler“, „autorisiert“ oder „offiziell“, solange kein Vertrag und kein Verzeichniseintrag besteht.

---

## 1. Ergebnis in 6 Punkten

1. **Live steht noch die Händler-Behauptung, und genau diese Texte lesen die KI-Crawler.** `https://platzhirsch.studio/llms.txt` sagt live: „**Autorisierter Händler** von über 35 internationalen Premium-Marken wie Minotti, Poliform …“. Auf der Minotti-Markenseite steht: „Platzhirsch Studio ist Ihr **offizieller Minotti Händler** in Vorarlberg“ (Text aus dem CMS) und im Titel „Minotti Händler Vorarlberg“. Die Korrektur in `llms.txt/route.js` ist lokal, aber **nicht deployt**. Der Brand-Text liegt im Backoffice. Das ist P0, vor jeder anderen GEO-Maßnahme.
2. **Platzhirsch ist als Entität in öffentlichen Quellen kaum vorhanden.** Bei Websuchen nach „Platzhirsch Home Living Lochau“ und „Minotti Bodensee kaufen“ erscheint die Website nicht. Die Treffer sind andere „Platzhirsche“ (Hotels, Cafés, ein Magazin, eine Werbeagentur). Bei Bing ist für „Minotti Bodensee kaufen“ m-studio.at mit „Offizieller Minotti Handelspartner in Österreich“ in den Top 10, Platzhirsch nicht. Der Name ist mehrdeutig, deshalb braucht die KI eindeutige Signale (Ort, Branche, gleiche Daten).
3. **Die Technik ist gut, aber die Robots-Regeln widersprechen sich teilweise.** Suchbots der KI-Dienste (OAI-SearchBot, PerplexityBot, Applebot) sind erlaubt. `Google-Extended` ist gesperrt und schränkt damit laut Google auch das **Grounding in Gemini** ein. `Applebot-Extended` und `anthropic-ai` stehen dagegen bei den erlaubten Bots, obwohl es Trainings-Kennungen sind. Der Inhaber muss die Linie festlegen (Abschnitt 5).
4. **Die Daten passen nicht überall zusammen.** In OpenStreetMap (speist unter anderem Apple Karten zum Teil, viele Apps und auch KI-Werkzeuge) hat „Platzhirsch Home Living“, Landstraße **9**, die Zeiten „Mo–Fr 09–17“. Die Website-Schema nennt Di–Fr 10–18 und Sa 10–14. Das **Café** steht in OSM unter Landstraße **11** mit eigener Domain platzhirsch.cafe. Damit ist die Frage 9 oder 11 wohl beantwortbar: **9 = Home Living, 11 = Café** [vom Unternehmen zu bestätigen].
5. **Es gibt kaum zitierfähige Drittquellen.** Gefunden wurde ein Interview in weekend.at (10.11.2020) mit dem Satz „Unser Minotti Schauraum ist der größte Westösterreichs“. Das ist eine Eigenaussage und als Alleinstellungswerbung UWG-heikel, wenn sie nicht belegt ist. Es gibt keinen Wikidata-Eintrag für das Unternehmen (geprüft per API). Sonst existieren nur Verzeichnisse.
6. **Der größte GEO-Hebel ist der Inhalt, den sonst niemand hat.** Für „Rimadesio Bodensee“, „Poliform Ostschweiz“ oder „Minotti Preis Österreich“ findet die Websuche heute **keinen regionalen Anbieter**. Sie verweist auf Wien, Genf, München und Stuttgart. Wer diese Fragen mit einer sachlichen Seite beantwortet (Antwortbox, Tabelle, Datum, Autor), wird von Perplexity, ChatGPT und AI Overviews zitiert, weil es keine Alternative gibt.

---

## 2. Wie die Systeme ihre Antworten bauen (mit Quellen)

| System | Woher die Antwort kommt | Was Platzhirsch steuern kann | Quelle |
|---|---|---|---|
| **Google AI Overviews / AI Mode** | Google-Index über **Googlebot**. Laut Google gibt es „no additional requirements“, kein spezielles Schema und keine „AI text files“. Daten erscheinen in der Search Console unter Leistung → „Web“ | Klassisches SEO, Snippet-Fähigkeit (kein `nosnippet`), Unternehmensprofil, strukturierte Daten passend zum sichtbaren Text | [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) |
| **Gemini (App)** | Google-Index plus Grounding. `Google-Extended` steuert laut Google „training and grounding in other Google systems“ | **Robots-Entscheidung Google-Extended** (heute gesperrt) | ebd. |
| **ChatGPT Search** | Eigener Index über **OAI-SearchBot** und mehrere Suchanbieter, darunter Bing. Lokale Fragen nutzen Bing und weitere Ortsdaten (Foursquare, Yelp/TripAdvisor, indirekt Google-Maps-Daten; Anteile umstritten) | OAI-SearchBot erlauben (erledigt), **Bing-Index und Bing Places**, Foursquare-Eintrag, Bewertungen | [OpenAI Bots](https://developers.openai.com/api/docs/bots); [Search Engine Land: How ChatGPT conducts local searches](https://searchengineland.com/how-does-chatgpt-conduct-local-searches-454894); [Peec AI: ChatGPT search result providers](https://docs.peec.ai/research/chatgpt-search-result-providers) |
| | OpenAI: „Sites that are opted out of OAI-SearchBot will not be shown in ChatGPT search answers.“ GPTBot (Training) ist davon unabhängig | | |
| **Perplexity** | Eigener Index über **PerplexityBot**, Live-Abruf über Perplexity-User (beachtet robots.txt in der Regel nicht, weil nutzerausgelöst) | PerplexityBot erlauben (erledigt), klare Fakten-Seiten | [Perplexity Crawlers](https://docs.perplexity.ai/guides/bots) |
| **Microsoft Copilot / Bing** | **Bing-Index**. In Bing Webmaster Tools gibt es seit Februar 2026 den Bericht „AI Performance“ (Zitate in Copilot und Bing-KI-Antworten, Grounding-Queries; Klickdaten laut Quellen uneinheitlich) | Bing Webmaster Tools, **IndexNow**, Bing Places | [Search Engine Land](https://searchengineland.com/bing-webmaster-tools-testing-new-ai-performance-report-468039); [Search Influence](https://www.searchinfluence.com/blog/bing-ai-performance-report-copilot-citations/) |
| **Apple (Siri, Spotlight, Safari, Karten)** | **Applebot** für die Suche; `Applebot-Extended` regelt nur die Nutzung für Apple-KI-Training. Apple: „Webpages that disallow Applebot-Extended can still be included in search results.“ Karten und Siri-Ortsantworten kommen aus Apple Business (Connect) und Datenpartnern | Apple Business Connect beanspruchen, Applebot erlauben (erledigt) | [Apple: About Applebot](https://support.apple.com/en-us/119829); [Apple Business](https://business.apple.com/) |

**Was daraus folgt:**
- Es gibt **kein eigenes GEO-Rezept**, das klassisches SEO ersetzt. Die Systeme greifen auf drei Grundlagen zu: den **Google-Index**, den **Bing-Index** und die **Ortsdatenbanken** (Google-Unternehmensprofil, Bing Places, Apple, Foursquare, OSM). Wer in allen drei sauber und gleich auftritt, wird genannt.
- `llms.txt` ist **kein Ranking-Faktor**. Google sagt ausdrücklich, dass keine solchen Dateien nötig sind. Sie kostet aber wenig und hilft Agenten, die Seite schneller zu verstehen. Gefährlich wird sie nur, wenn Falsches drinsteht, und das ist heute der Fall.

---

## 3. Selbsttest: Was öffentliche Quellen heute über Platzhirsch sagen (26.10.2026)

Methode: WebSearch (Websuche des Agenten), Abrufe von Bing-Ergebnisseiten, Wikidata-API, OpenStreetMap-Nominatim und der eigenen Live-Seite. ChatGPT, Perplexity und Gemini selbst sind ohne Login nicht direkt abfragbar. Weil sie auf genau diese Quellen zugreifen, ist der Test ein gutes Indiz, aber **kein Ersatz für den monatlichen Prompt-Test** (Abschnitt 9).

| # | Abfrage / Quelle | Ergebnis | Bewertung |
|---|---|---|---|
| T1 | Websuche „Minotti kaufen Bodensee Händler“ | Minotti-Flagships Hamburg, Stuttgart, München, Berlin. **Kein Anbieter am Bodensee** | Lücke: niemand beantwortet die Regionsfrage |
| T2 | Websuche „Platzhirsch Home Living Lochau“ | Nur fremde Platzhirsche (Hotel Kelsterbach, Ferienhaus Ybbstal, Mayrhofen). **Platzhirsch.studio fehlt** | Entität schwach, Name mehrdeutig |
| T3 | Websuche „platzhirsch.studio Designermöbel Lochau Vorarlberg“ | Einziger Treffer: weekend.at-Interview 2020 („Minotti Schauraum … größte Westösterreichs“, Café Lounge, 25 Mitarbeitende 2019) | Einzige redaktionelle Drittquelle, veraltet |
| T4 | Websuche „Poliform Ostschweiz Liechtenstein Showroom“ | Poliform Wien, Genf, Mailand. **Keine Ostschweiz/FL** | Lücke, passt zu Bericht 16 |
| T5 | Websuche „Rimadesio Händler Vorarlberg Bodensee“ | Rimadesio Showroom Wien, Genf. **Kein Bodensee** | Lücke |
| T6 | Bing „Minotti Bodensee kaufen“ (cc=AT) | minotti.com (5×), **m-studio.at „Offizieller Minotti Handelspartner in Österreich“**, moebelfirst.de, willhaben, archiproducts. Platzhirsch nicht in den Top 10 | Copilot und ChatGPT würden M-Studio (Altenmarkt, Salzburg) nennen |
| T7 | Bing „Platzhirsch Home Living Lochau“ | 10 fremde Platzhirsche, **kein Ortseintrag (kein Bing-Places-Panel)** | Bing Places fehlt oder ist nicht verknüpft [im Bing-Konto prüfen] |
| T8 | Bing `site:platzhirsch.studio` | Ergebnisseite für Bots unbrauchbar (fremde Treffer). „Ungefähr 56 Ergebnisse“ | **Nicht aussagekräftig**, in Bing Webmaster Tools prüfen. Wenn wirklich nur ~56 Seiten im Index sind, wäre das bei ca. 1.800 Produktseiten ein großes Problem für Copilot und ChatGPT |
| T9 | `platzhirsch.studio/llms.txt` live | „**Autorisierter Händler** von über 35 … Marken wie Minotti, Poliform …“, nennt auch Tom Dixon | **P0-Fehler**, Deploy der lokalen Korrektur fehlt |
| T10 | `/de/ueber-uns/marken/minotti` live | Titel „Minotti Händler Vorarlberg“, Text „Ihr **offizieller Minotti Händler** in Vorarlberg“ | **P0-Fehler**, CMS-Text und Deploy |
| T11 | `/de` als OAI-SearchBot | HTTP 200, Titel „Möbelhaus & Designermöbel Vorarlberg …“, JSON-LD: Organization/FurnitureStore, WebSite, WebPage, FAQPage (4 Fragen), 17 `Brand`, `sameAs` Instagram/LinkedIn/Facebook, `streetAddress` „Landstraße 9“ | Technisch gut. Es fehlen `sameAs` zu Google-Profil, Apple, Bing, Herold, WKO und die eigene Café-Entität |
| T12 | `/de` als GPTBot | HTTP 200 (robots.txt sperrt, Server liefert trotzdem) | Normal, robots.txt ist eine Bitte. Kein Handlungsbedarf |
| T13 | `/indexnow`-Schlüsseldatei, `/llms-full.txt` | beide 404 | Noch nicht vorhanden |
| T14 | Wikidata-Suche „Platzhirsch“ | Nur Q1454780 (Begriff Platzhirsch) und ein Gemälde. **Kein Unternehmenseintrag** | Siehe Abschnitt 7 |
| T15 | OpenStreetMap (Nominatim) | way/956519412 „Platzhirsch Home Living“, Landstraße 9, shop=interior_decoration, **opening_hours Mo–Fr 09:00–17:00**; way/131950416 „Platzhirsch Café Lounge“, Landstraße 11, Di–Sa 09–23 | Zeiten Home Living falsch, Kategorie zu schwach (besser `shop=furniture`) |

**Zwischenfazit:** Heute nennt keine KI Platzhirsch zuverlässig bei Markenfragen. Wenn sie es tut, übernimmt sie die Händler-Behauptung aus `llms.txt` oder der Markenseite. Das ist schlimmer als gar nicht genannt zu werden.

---

## 4. P0 – erst bereinigen, dann sichtbar werden (Woche 1)

| # | Maßnahme | Wo | Wer |
|---|---|---|---|
| 1 | Lokale Korrektur von `src/app/llms.txt/route.js` und `marken/[title]/page.js` committen und deployen | Code (bereits geändert, nur Deploy) | Entwickler |
| 2 | Brand-Texte im Backoffice (`dealers_title`, `dealers_description`, `metadata_description_<locale>`, Bio) für Minotti, Poliform und alle Marken ohne Vertrag umschreiben: „Minotti in unserer Ausstellung in Lochau“ | Backoffice (Frappe) | Inhaber / Backoffice |
| 3 | Claim-Guard aus Bericht digital/08 (F1) einbauen: Filter für „Händler/autorisiert/offiziell/Vertragspartner“ mit Whitelist `classicon` | Code | Entwickler |
| 4 | Nach dem Deploy: Neu-Crawl anstoßen. Google: URL-Prüfung für die Markenseiten. Bing: URL-Übermittlung bzw. IndexNow (Abschnitt 6). KI-Antworten ändern sich erst nach Tagen bis Monaten (Google: „several days to several months“) | GSC, Bing WMT | Marketing |
| 5 | Prüfen, ob Drittseiten die Händler-Behauptung übernommen haben (Herold, Cylex, Social-Media-Bios, Google-Profil-Beschreibung, alte Pressetexte) und korrigieren | Verzeichnisse | Marketing |
| 6 | Die Aussage „größter Minotti-Schauraum Westösterreichs“ nicht mehr selbst verwenden, solange kein Beleg vorliegt (Fläche, Vergleich). Alleinstellungswerbung muss nach § 2 UWG wahr sein [anwaltlich prüfen] | eigene Texte, Presse | Inhaber |

Rechtsgrundlage: Irreführung nach § 2 UWG (AT, [RIS](https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10002665)), § 5 UWG (DE, [gesetze-im-internet](https://www.gesetze-im-internet.de/uwg_2004/__5.html)), Art. 3 Abs. 1 lit. b UWG (CH, [fedlex](https://www.fedlex.admin.ch/eli/cc/1988/223_223_223/de)). Details in digital/14.

---

## 5. robots.txt für KI-Crawler (Entscheidung des Inhabers)

### Ist-Zustand (`src/app/robots.js`, live identisch)

| Gruppe | Bots | Regel |
|---|---|---|
| Klassische Suche | Googlebot, Bingbot, Slurp, DuckDuckBot | alles außer `/api/` |
| KI-Suche | OAI-SearchBot, ChatGPT-User, Claude-Web, Claude-SearchBot, **anthropic-ai**, PerplexityBot, Perplexity-User, Amazonbot, Applebot, **Applebot-Extended**, YouBot | erlaubt, `Crawl-delay: 2` |
| Training gesperrt | GPTBot, ClaudeBot, CCBot, FacebookBot, Meta-ExternalAgent, Bytespider, Omgilibot, Diffbot, **Google-Extended**, cohere-ai, ImagesiftBot | `Disallow: /` |
| Rest | `*` | ohne `/api/`, `/private/`, `/*?*` |

### Probleme
1. **Widerspruch:** `Applebot-Extended` und `anthropic-ai` sind Trainings- bzw. Nutzungskennungen, stehen aber bei „KI-Suche erlaubt“. Entweder bewusst erlauben (dann auch GPTBot/ClaudeBot/Google-Extended konsequent erlauben) oder zu den Gesperrten verschieben.
2. **Google-Extended gesperrt:** AI Overviews und AI Mode sind davon **nicht** betroffen (sie nutzen Googlebot). Laut Google regelt Google-Extended aber Training **und Grounding** in anderen Google-Systemen, also vor allem die Gemini-App. Die Sperre kann Gemini-Antworten mit Platzhirsch-Quelle verhindern.
3. `Claude-Web` ist eine veraltete Kennung. Unschädlich, kann bleiben.
4. Fehlende, heute verbreitete Kennungen für nutzerausgelöste Abrufe: `DuckAssistBot`, `MistralAI-User`, `Meta-ExternalFetcher` [Kennungen vor Einbau bei den Anbietern prüfen]. Geringe Priorität.
5. `Crawl-delay` ignoriert Google ohnehin. Bei den KI-Suchbots ist 2 s für ca. 7.000 URLs vertretbar (ca. 4 Stunden pro Vollcrawl), kann aber entfallen.

### Empfehlung (Variante B)

| Variante | Inhalt | Für | Gegen |
|---|---|---|---|
| A „Status quo bereinigt“ | Training komplett sperren, Applebot-Extended und anthropic-ai zu den Gesperrten | konsequenter Schutz der Texte | Gemini-Grounding fehlt, Marke fehlt im Modellwissen |
| **B „Sichtbarkeit zuerst“ (empfohlen)** | **Google-Extended, GPTBot, ClaudeBot, Applebot-Extended für HTML-Seiten erlauben**, aber `/cmx/`, `/_next/image`, `/api/image` (Herstellerbilder) für Trainingsbots sperren. CCBot, Bytespider, Diffbot, Omgilibot, ImagesiftBot bleiben gesperrt | Präsenz in Gemini und im Modellwissen von ChatGPT/Claude. Die Texte sind Katalog und Werbung, kein Geschäftsgeheimnis. Die Bildrechte der Hersteller bleiben geschützt | Die eigenen Ratgebertexte fließen in Trainingsdaten |
| C „alles offen“ | alles erlaubt | maximale Reichweite | Bildrechte der Hersteller, Last durch Scraper |

Vorschlag für `robots.js` (Variante B, **nicht eingebaut**, nur Entwurf):

```js
// KI-Suche und nutzerausgelöste Abrufe: voll erlaubt
{ userAgent: ["OAI-SearchBot","ChatGPT-User","Claude-SearchBot","Claude-User",
              "PerplexityBot","Perplexity-User","Applebot","Amazonbot","YouBot","DuckAssistBot"],
  allow: ["/api/image", "/"], disallow: ["/api/"] },
// Training/Grounding: Texte ja, Bilder nein
{ userAgent: ["Google-Extended","GPTBot","ClaudeBot","Applebot-Extended"],
  allow: ["/"], disallow: ["/api/", "/cmx/", "/_next/image", "/api/image"] },
// reine Scraper: gesperrt
{ userAgent: ["CCBot","Bytespider","Diffbot","Omgilibot","ImagesiftBot","cohere-ai",
              "Meta-ExternalAgent","FacebookBot","anthropic-ai"], disallow: ["/"] },
```

Hinweis: `Google-Extended` und `Applebot-Extended` sind reine robots.txt-Tokens. Gecrawlt wird mit Googlebot bzw. Applebot. Die Bild-Sperre greift für das Training nur, soweit die Anbieter das Token pfadgenau auswerten [beim Anbieter prüfen].

---

## 6. Bing Webmaster Tools und IndexNow (Copilot und ChatGPT)

Bing ist für Copilot die Grundlage und für ChatGPT eine der wichtigsten. Bericht 25 (H8) nennt Bing Webmaster nur als To-do. Der Test T8 deutet auf eine **schwache Indexierung** hin.

**Schritte (Aufwand: 1–2 Stunden, kostenlos):**
1. Konto unter bing.com/webmasters, Website importieren **aus der Google Search Console** (schnellste Verifizierung).
2. `https://platzhirsch.studio/sitemap.xml` einreichen. Bericht „Indexierte Seiten“ ansehen: Soll ca. 1.800 Produkte + Marken + Stadtseiten × 4 Sprachen. Ziel nach 8 Wochen: > 80 % der DE-Seiten im Index.
3. Bericht **„AI Performance“** wöchentlich als CSV exportieren (Zitate in Copilot/Bing-KI, zitierte Seiten, Grounding-Queries). Das ist die einzige offizielle Messung von KI-Zitaten bei einem großen Anbieter.
4. **IndexNow** einbauen (Entwurf, nicht im Code umgesetzt):
   - Schlüssel erzeugen (32 Hex-Zeichen), Datei `/{key}.txt` mit dem Schlüssel ausliefern, z. B. als Route `src/app/[key].txt/route.js` oder statisch in `public/`. [Achtung: Route darf nicht mit `[locale]` kollidieren, Entwickler prüft]
   - Bei jeder Änderung im Backoffice ruft die bestehende Revalidate-Route (`src/app/revalidate/*`) zusätzlich `POST https://api.indexnow.org/indexnow` mit `{ host, key, keyLocation, urlList }` auf. Bis 10.000 URLs pro Aufruf (laut [IndexNow-Doku](https://www.indexnow.org/documentation)). Antwort 200/202 = angenommen.
   - IndexNow teilt die URLs unter den teilnehmenden Suchmaschinen (u. a. Bing, Yandex, Seznam, Naver [Teilnehmer auf indexnow.org prüfen]). **Google nimmt nicht teil**, dort bleiben Sitemap und `lastmod`.
   - Nutzen: Neue Outlet-Preise, Events und korrigierte Markentexte sind in Stunden statt Wochen bei Bing und damit bei Copilot und ChatGPT.
5. **Bing Places for Business** (kostenlos): Import aus dem Google-Profil, Kategorie Möbelgeschäft, gleiche Daten wie überall (Abschnitt 8).

---

## 7. Entitäten: Wer ist „Platzhirsch“?

Der Name ist mehrdeutig (Test T2, T7). KI-Systeme entscheiden über Entitäten. Ziel: Für jedes System ist eindeutig, dass „Platzhirsch Home Living“ = Einrichtungsstudio in 6911 Lochau, Landstraße 9, mit Café nebenan.

### 7.1 Strukturierte Daten (Ausbau des bestehenden Knotens in `src/app/[locale]/layout.js`)
Vorhanden und gut: `["Organization","FurnitureStore"]`, `@id`, Adresse, Geo, `hasMap`, Öffnungszeiten, `areaServed`, 17 `Brand`, `sameAs` (3 Social-Profile), FAQPage.

Ergänzen (Entwurf):
- `legalName`: [vom Unternehmen auszufüllen: heute MW Immobilienverwaltungs GmbH, nach Ausgliederung die neue Handels-GmbH]. **Erst nach der Ausgliederung pflegen**, sonst entsteht ein Widerspruch zum Impressum.
- `alternateName`: „Platzhirsch Studio“, „platzhirsch.studio“.
- `sameAs` erweitern: Google-Profil (`https://maps.google.com/?cid=10377983053407187294`), Apple-Karten-Link, Bing-Places-Link, Herold, WKO-Firmen-A-Z, Houzz/Architonic, ggf. Wikidata.
- `department` oder eigener Knoten `CafeOrCoffeeShop` „Platzhirsch Café Lounge“, Landstraße 11, `url` https://platzhirsch.cafe/, `parentOrganization` → `#organization`. Damit trennt die KI Café und Studio sauber.
- `brand` → `makesOffer`/`knowsAbout` statt der Andeutung, man vertreibe die Marke offiziell. `brand` an einer `Organization` liest sich für Maschinen wie „das ist unsere Marke“. Neutraler: `knowsAbout: ["Minotti","Poliform",…]` und auf Markenseiten `WebPage.about` → `Brand` mit `sameAs` zur Hersteller-Website [Formulierung UWG-neutral, anwaltlich prüfen falls in Zweifel].
- `founder`/`employee` als `Person` für die Autoren der Ratgeber (E-E-A-T, Autorenseiten).
- Auf Stadtseiten: `WebPage.about` → `#organization`, `areaServed` als `City` mit Wikidata-IDs [IDs vor Einbau prüfen].

### 7.2 Wikidata – nur wenn zulässig
- Wikidata nimmt ein Objekt auf, wenn es „a clearly identifiable conceptual or material entity“ ist, beschreibbar mit „serious and publicly available references“ ([Wikidata:Notability](https://www.wikidata.org/wiki/Wikidata:Notability), Kriterium 2). Für ein Unternehmen mit Firmenbucheintrag reicht formal oft schon der Firmenbuch-/WKO-Beleg.
- **Empfehlung: jetzt nicht selbst anlegen.** Gründe: (1) Die Betreiber-GmbH ändert sich mit der Ausgliederung. Ein Eintrag mit der falschen Rechtsperson schadet. (2) Eigeneinträge mit Interessenkonflikt müssen offengelegt werden (Wikidata-Richtlinie zu bezahltem Bearbeiten), werbliche Einträge werden gelöscht. (3) Der Nutzen ist für ein lokales Geschäft klein gegenüber Google-Profil und Bing Places.
- **Wann ja:** nach der Ausgliederung, mit mindestens zwei unabhängigen Belegen (Firmenbuch + redaktionelle Presse), nur Fakten (instance of: furniture store / company, country, located in Lochau, official website, coordinates), Offenlegung auf der Benutzerseite. Kein Wikipedia-Artikel: Relevanzkriterien der deutschsprachigen Wikipedia sind für das Unternehmen derzeit nicht erfüllt [Schätzung, Herleitung: keine überregionale Berichterstattung gefunden].

### 7.3 Ortsdatenbanken (NAP: Name, Adresse, Telefon gleich überall)

| Quelle | Speist | Stand | Aufgabe |
|---|---|---|---|
| Google-Unternehmensprofil | Google Maps, AI Mode, Gemini, indirekt ChatGPT | vorhanden, 6 Bewertungen (letzte 2022, Bericht 25) | Bericht digital/09 umsetzen |
| **Bing Places** | Bing, Copilot, ChatGPT | fehlt vermutlich (T7) | anlegen, Import aus Google |
| **Apple Business Connect** | Apple Karten, Siri, Spotlight, Safari | [offen, ohne Login nicht prüfbar] | Ort beanspruchen, Logo, Fotos, Zeiten, Kategorie Möbelgeschäft, später „Custom Action“ Termin buchen |
| **OpenStreetMap** | Teile von Apple Karten, viele Apps, KI-Werkzeuge | Zeiten falsch, Kategorie `interior_decoration` | korrigieren: `shop=furniture`, `opening_hours=Tu-Fr 10:00-18:00; Sa 10:00-14:00`, `phone=+43 5574 46255`, `brand`-Tags **nicht** setzen. OSM-Konto, 10 Minuten |
| **Foursquare** | ChatGPT (Anteil umstritten), viele Apps | [offen] | Eintrag beanspruchen (foursquare.com/business) |
| Herold, WKO, Cylex, Gemeinde Lochau, Vorarlberg Tourismus | Google/Bing als Belegquellen | Bericht digital/09 | gleiche Schreibweise |
| Yelp, TripAdvisor (Café!) | ChatGPT (lizenziert laut Peec AI) | [offen] | für das Café prüfen. Für das Studio Yelp nur, falls Eintrag vorhanden |

**Einheitliche Schreibweise (Vorschlag, vom Unternehmen zu bestätigen):**
„Platzhirsch Home Living · Landstraße 9 · 6911 Lochau · Österreich · +43 5574 46255 · Di–Fr 10–18, Sa 10–14 · platzhirsch.studio“ und für das Café „Platzhirsch Café Lounge · Landstraße 11“.

---

## 8. Inhalte, die KI-Antworten zitieren (Zitierfähigkeit)

KI-Antwortsysteme zitieren Seiten, die eine Frage **direkt, eindeutig und aktuell** beantworten. Die Ratgeber-Struktur aus digital/08 (F5) ist richtig. Ergänzend aus GEO-Sicht:

### 8.1 Bauplan einer zitierfähigen Seite
1. **Frage als H1**, so wie Menschen fragen: „Wo kann man Minotti am Bodensee ansehen?“
2. **Antwortbox mit 40–60 Wörtern direkt darunter**, mit Fakten statt Werbung: „Minotti-Möbel sind in der Ausstellung von Platzhirsch Home Living in Lochau (Vorarlberg) zu sehen, 5 Minuten von Bregenz und 15 Minuten von Lindau. Die offiziellen Minotti-Händler der Region stehen im Händlerverzeichnis auf minotti.com. Termin nach Vereinbarung, Di–Fr 10–18, Sa 10–14.“
   Das klingt gegen die eigenen Interessen, ist aber der stärkste Vertrauensbeweis. KI-Systeme bevorzugen ausgewogene Quellen. Es ist rechtlich sauber, und die Händler selbst haben keine solche Seite.
3. **Tabelle** mit Zahlen (Fahrzeiten, Lieferzeiten, Preisspannen „ab“, Steuern CH).
4. **Datum „Stand: …“ und Autor** mit Name, Funktion, Foto (`Article.author` → `Person`, `dateModified`).
5. **Quellen** verlinken (Hersteller, ESTV, BAZG, RIS).
6. Interne Links zu Produkten und Termin.
7. Jede Aussage ist **einzeln zitierbar** (kurze Absätze, ein Fakt pro Satz). KI-Systeme zitieren Satzteile, nicht Seiten.

### 8.2 Die 20 Fragen mit dem größten GEO-Wert
Auswahl nach Lücken aus Test T1, T4, T5 und Bericht 16. Spalte „Lücke“ = heute beantwortet keine regionale Quelle die Frage.

| # | Frage (DE) | Typ | Lücke | Seite |
|---|---|---|---|---|
| 1 | Wo kann ich Minotti am Bodensee ansehen? | Ort | ja | Ratgeber + Markenseite |
| 2 | Wo gibt es Rimadesio in Vorarlberg / am Bodensee / in der Ostschweiz? | Ort | ja (nur Wien, Genf) | Markenseite Rimadesio |
| 3 | Poliform in der Ostschweiz und in Liechtenstein? | Ort | ja | Markenseite + Liechtenstein-Seite |
| 4 | Paola Lenti Outdoor am Bodensee ansehen | Ort | [prüfen] | Markenseite |
| 5 | Was kostet ein Minotti-Sofa? | Preis | ja | Ratgeber (Spannen, Herleitung) |
| 6 | Was kostet eine Poliform-Küche / Schüller / next125? | Preis | ja | Ratgeber Küche |
| 7 | Designermöbel in Österreich kaufen und in die Schweiz liefern: MWST, Zoll | Ablauf | ja | Ratgeber Schweiz (Bericht 18) |
| 8 | Lohnt sich Möbelkauf in Österreich für Schweizer? Preisvergleich | Preis | ja | Ratgeber + CHF-Rechner |
| 9 | Wie lange dauert die Lieferung italienischer Designmöbel? | Ablauf | ja | Ratgeber |
| 10 | Minotti oder B&B Italia: Unterschiede | Vergleich | teilweise | Ratgeber |
| 11 | Welches Outdoor-Material hält am See (Teak, Aluminium, Seil)? | Wissen | teilweise | Ratgeber |
| 12 | Designermöbel Ausstellungsstücke / Outlet Vorarlberg | Kauf | ja | Outlet-Seite mit Preisen |
| 13 | Einrichtungsberatung Ferienwohnung Arlberg / Lech | Leistung | teilweise | Stadtseite Arlberg |
| 14 | Küche mit Natursteinplatte: Kosten und Pflege | Wissen | teilweise | Ratgeber Binni-Linie (Bericht 26) |
| 15 | Möbel in Liechtenstein: Zoll und MWST beim Kauf in Österreich | Ablauf | ja | Ratgeber (FL im Zollgebiet CH) |
| 16 | Einrichtungshaus mit Café am Bodensee | Erlebnis | ja | Über uns / Café |
| 17 | Designermöbel Lindau / Friedrichshafen / Konstanz | Ort | teilweise | Stadtseiten (vorhanden/neu) |
| 18 | Minotti Lawrence / Connery Maße, Bezüge, Preis | Modell | ja | Produktseiten |
| 19 | Was ist der Unterschied zwischen Ausstellung und Händler? | Wissen | ja | Ratgeber (Transparenz) |
| 20 | Wie plane ich ein komplettes Haus mit einem Einrichter? Ablauf und Kosten | Leistung | teilweise | Beratung |

Je Frage auch EN (Gäste, Expats in FL/CH) und für 7, 8, 15 eine de-CH-Fassung (Begriffe „Offerte“, „MWST“, „Schreiner“).

### 8.3 llms.txt und llms-full.txt (Entwurf für die nächste Fassung)
Nach dem P0-Deploy ergänzen (in `src/app/llms.txt/route.js`, Abschnitte):

```markdown
## Fakten
- Name: Platzhirsch Home Living (Einrichtungsstudio); daneben Platzhirsch Café Lounge (Landstraße 11, eigenständig: platzhirsch.cafe)
- Adresse: Landstraße 9, 6911 Lochau, Vorarlberg, Österreich · Telefon +43 5574 46255
- Öffnungszeiten: Di–Fr 10–18, Sa 10–14, Termine nach Vereinbarung [vom Unternehmen zu bestätigen]
- Leistungen: Einrichtungsplanung, Innenarchitektur, Küchenplanung, Lieferung und Montage in AT, DE, CH, FL
- Marken: Viele Marken sind in der Ausstellung zu sehen. Offizielle Händler einer Marke nennt das Händlerverzeichnis des jeweiligen Herstellers.
- Schweiz/Liechtenstein: Lieferung mit Ausfuhr aus Österreich; Schweizer MWST und Verzollung werden [Ablauf aus Bericht 18, vom Unternehmen auszufüllen].
- Stand: {Build-Datum}

## Ratgeber
- [Wo kann man Minotti am Bodensee ansehen?](…): …
## Regionen
- [Designermöbel Liechtenstein](…/de/designermoebel-liechtenstein): …
```

- **Tom Dixon** steht live in der Zusammenfassung, aber laut Bestand [prüfen] womöglich nicht mehr im Sortiment. Die Zusammenfassung nur mit Marken füllen, die wirklich ausgestellt sind.
- `llms-full.txt`: Markdown-Export der Ratgeber und Markenseiten-Eigentexte, gefiltert durch den Claim-Guard. Klein halten (< 500 KB), sonst wird sie ignoriert.
- Dem `marken`-Abschnitt pro Marke einen Halbsatz geben („Sofas, Outdoor; in der Ausstellung“), ohne Händler-Wort.

### 8.4 Drittquellen: Erwähnungen, die KI-Systeme übernehmen
KI-Systeme vertrauen Aussagen, die **mehrere unabhängige Quellen** wiederholen. Heute gibt es eine einzige (weekend.at 2020). Ziel: 10 neue, glaubwürdige Erwähnungen in 12 Monaten.

| Quelle | Hebel | Aufwand |
|---|---|---|
| Regionale Presse: VN, Schwäbische Zeitung, St. Galler Tagblatt, Liechtensteiner Vaterland, Bodensee-Magazin | Anlässe: Binni-Küchenlinie, Schweiz-Lieferservice, Adventsabend, Outlet, Referenzprojekt | Pressemitteilung je Anlass |
| Hersteller-Verzeichnisse (ClassiCon vorhanden; Rimadesio, Tuuci, Paola Lenti, Flos, Treca beantragen, Bericht 16) | stärkstes Signal überhaupt, **nur mit echter Listung** | Inhaber |
| Architekten- und Partnerseiten (vai, Werkraum Bregenzerwald, Partnerhotels, Bauträger) | Referenzprojekt mit Link und Namen | mittel |
| Houzz, Architonic (Profil ohne Händler-Behauptung), Falstaff Living | Fachportale werden von Perplexity häufig zitiert [Schätzung, Herleitung: hohe Domain-Autorität und strukturierte Profile] | gering |
| Reddit/Foren (r/Vorarlberg, r/Switzerland, Schweizer Foren zu Möbelkauf im Ausland) | Perplexity und Google zitieren Reddit häufig. **Nur echte, offengelegte Beiträge** („Ich arbeite bei …“). Kein Astroturfing, das wäre Schleichwerbung (§ 1 Abs. 1 Z 2 i. V. m. Anhang Z 11 UWG AT, ähnlich DE/CH) [anwaltlich prüfen] | gering, laufend |
| Bewertungen (Google, Apple, Bing, ggf. Trusted Shops später) | Sterne und Bewertungstexte gehen in lokale KI-Antworten ein. Nur echte Kunden, kein Kauf | laufend, Bericht digital/09 |
| YouTube (Video-Beratung, Rundgang) | Gemini und AI Overviews nutzen YouTube. Kapitel und Transkript | mittel |

---

## 9. Messung: Prompt-Panel und KPIs

### 9.1 Monatlicher Prompt-Test (30 Minuten pro Monat, ein Mitarbeiter)
Gleiche Prompts, gleiche Systeme, eingeloggt **ohne** Verlauf (privates Fenster), Standort jeweils Österreich (für CH-Fragen VPN/Standort Schweiz wenn möglich). Ergebnis in einer Tabelle: genannt ja/nein, Position, zitierte URL, **Aussage richtig oder falsch** (besonders „Händler“).

| # | Prompt | Systeme |
|---|---|---|
| P1 | Wo kann ich Minotti-Möbel am Bodensee ansehen? | ChatGPT, Perplexity, Gemini, Google AI Mode, Copilot |
| P2 | Gibt es einen Rimadesio-Showroom in Vorarlberg oder der Ostschweiz? | alle |
| P3 | Designermöbel-Geschäft in der Nähe von Bregenz mit italienischen Marken | alle + Siri („Hey Siri, Designermöbel in der Nähe“) |
| P4 | Ich wohne in St. Gallen. Lohnt es sich, ein Sofa in Österreich zu kaufen? | alle |
| P5 | Was kostet ein Minotti-Sofa in Österreich? | alle |
| P6 | Poliform-Küche Liechtenstein | alle |
| P7 | Einrichtungsberater für Ferienwohnung in Lech | alle |
| P8 | Was ist Platzhirsch Home Living? | alle (Entitätstest: richtige Adresse, Zeiten, keine Händler-Behauptung?) |
| P9 | Outdoor-Möbel Paola Lenti am Bodensee | alle |
| P10 | Küche mit Natursteinplatte günstig Vorarlberg | alle |
Weitere 20 Prompts aus Abschnitt 8.2 rotierend.

### 9.2 KPIs

| KPI | Quelle | Basis heute | Ziel 6 Monate | Ziel 12 Monate |
|---|---|---|---|---|
| Nennung in P1–P10 (Anteil Prompts × Systeme) | Prompt-Panel | ≈ 0 % [Schätzung aus Test T1–T7] | 30 % | 50 % |
| **Falsche Aussagen** (Händler, Adresse, Zeiten) | Prompt-Panel | [erste Messung ausstehend] | 0 | 0 |
| Zitate in Copilot/Bing-KI | Bing WMT „AI Performance“ | [nach Einrichtung] | messbar > 0 | Wachstum je Quartal |
| Bing-indexierte Seiten (DE) | Bing WMT | [unklar, T8] | > 80 % | > 90 % |
| Besuche aus KI (Referrer chatgpt.com, perplexity.ai, gemini.google.com, copilot.microsoft.com) | GA4/Analytics (`src/lib/analytics.js`, nur mit Einwilligung) | [messen] | Trend | Trend |
| Anfragen mit Herkunft „KI-Suche“ | Formularfeld „Wie haben Sie uns gefunden?“ mit Option „ChatGPT/KI“ | – | erfassen | erfassen |

Hinweis Datenschutz: Referrer-Auswertung nur im Rahmen der bestehenden Einwilligung (digital/14). Die Formularfrage ist freiwillig.

---

## 10. Plan

| Phase | Zeit | Maßnahmen | Aufwand | Wer |
|---|---|---|---|---|
| **P0 Bereinigen** | Woche 1 | Deploy llms.txt- und Markenseiten-Korrektur, CMS-Texte ohne „Händler“, Claim-Guard, Recrawl anstoßen | S | Entwickler, Inhaber (Backoffice) |
| **P1 Grundlagen** | Woche 1–3 | Bing Webmaster (Import aus GSC), Sitemap, AI-Performance-Bericht; Bing Places; Apple Business Connect; OSM korrigieren; Foursquare; NAP-Schreibweise überall; Robots-Entscheidung umsetzen | S je Punkt | Marketing, Entwickler |
| **P2 Entität und Technik** | Woche 3–6 | Schema-Ausbau (sameAs, Café-Knoten, Person-Autoren, knowsAbout); IndexNow über Revalidate-Routen; llms.txt mit Fakten, Ratgebern, Regionen; `htmlLimitedBots` für KI-Bots (digital/08 F9b) | S–M | Entwickler |
| **P3 Inhalte** | Monat 2–4 | 10 Ratgeber aus 8.2 (zuerst 1, 2, 3, 5, 7), Markenseiten mit Eigentext und „Wo ansehen“-Abschnitt, Outlet mit Preisen | M | Redaktion + Inhaber (Fakten, Preise) |
| **P4 Drittquellen** | laufend ab Monat 2 | 1 Presseanlass pro Monat, Hersteller-Listungen, Houzz/Architonic, Bewertungen, Partnerlinks | laufend | Inhaber, Marketing |
| **P5 Messen** | monatlich | Prompt-Panel, Bing-AI-Bericht, GSC, KI-Referrer, Korrekturen nachziehen | 1–2 h/Monat | Marketing |
| Später | nach Ausgliederung | Wikidata-Eintrag (Abschnitt 7.2), `legalName` aktualisieren, Impressum | S | Inhaber |

Kosten: Alle Werkzeuge sind kostenlos. Externe GEO-Monitoring-Tools (Peec AI, Profound, Semrush AI Toolkit u. a.) erst ab Phase 5 testen, wenn die Handmessung nicht mehr reicht [Preise beim Anbieter prüfen].

**Realistische Erwartung:** Bei Lückenfragen (Rimadesio Bodensee, Poliform Ostschweiz, Schweiz-Ablauf, Preise) sind Nennungen in Perplexity und ChatGPT nach Indexierung in **4–12 Wochen** möglich [Schätzung, Herleitung: kaum konkurrierende Quellen, Perplexity/Bing indexieren neue Seiten in Tagen bis Wochen]. Bei „Minotti Händler“-artigen Fragen werden die KI-Systeme weiter die gelisteten Händler (Höttges, M-Studio, Flagships) nennen, solange kein Vertrag besteht. Das ist richtig so, und Platzhirsch erscheint dann als „Ausstellung, in der man Minotti sehen kann“. Garantien gibt es nicht.

---

## 11. Nicht tun

| Nicht tun | Warum |
|---|---|
| „Offizieller/autorisierter Händler“ in llms.txt, Schema, Meta-Texten, Profilen | UWG-Irreführung, KI verbreitet es tausendfach weiter |
| Versteckter Text für KI („Prompt-Injection“, weißer Text, `display:none`-Fakten nur für Bots) | Cloaking, Verstoß gegen Google-Richtlinien, kann zur Abwertung führen |
| Fake-Bewertungen, eigene Reddit-Beiträge ohne Offenlegung, gekaufte „Best of“-Listen | UWG (Schleichwerbung, Irreführung), Plattformsperre |
| Massenhaft KI-generierte Seiten ohne eigenen Inhalt | Google „scaled content abuse“, keine Zitierfähigkeit |
| Schema-Angaben, die nicht sichtbar auf der Seite stehen (z. B. Bewertungen, Preise) | Google verlangt Übereinstimmung mit sichtbarem Text |
| Wikidata/Wikipedia-Eintrag als Werbung oder ohne Offenlegung | Löschung, Reputationsschaden |
| Alleinstellungsclaims („größter Minotti-Schauraum“) ohne Beleg | UWG |

---

## 12. Was der Inhaber entscheiden oder liefern muss

| # | Entscheidung / Lieferung | Bis |
|---|---|---|
| 1 | **Freigabe Deploy** der Händler-Korrektur und **Backoffice-Zugang** für die Marken-Texte (oder selbst ändern) | sofort |
| 2 | **Robots-Linie:** Variante A, B (empfohlen) oder C | Woche 1 |
| 3 | **Adresse bestätigen:** Landstraße 9 = Home Living, 11 = Café? Öffnungszeiten final? Eine Telefonnummer? | Woche 1 |
| 4 | **Zugänge:** Google-Profil (Inhaberrolle), Bing-Webmaster (über GSC), Apple-ID für Business Connect, ggf. OSM-Konto | Woche 2 |
| 5 | Liste der Marken, die **wirklich ausgestellt** sind (für llms.txt und „Wo ansehen“-Seiten), und Beleg oder Verzicht für „größter Minotti-Schauraum Westösterreichs“ | Woche 2 |
| 6 | Fakten für Ratgeber: Preisspannen, Lieferzeiten, Schweiz-Ablauf (mit Steuerberater/Spediteur, Bericht 18) | Monat 1 |
| 7 | Eine Person, die als **Autor/in** mit Name und Foto auftritt, und eine, die monatlich das Prompt-Panel macht | Monat 1 |
| 8 | Presseanlässe und Referenzprojekte mit Freigabe der Kunden | laufend |
| 9 | Zeitpunkt der Ausgliederung (für `legalName`, Impressum, Wikidata) | [vom Unternehmen auszufüllen] |

---

## Quellen
- Google Search Central: AI features and your website – https://developers.google.com/search/docs/appearance/ai-features
- OpenAI: Overview of OpenAI crawlers – https://developers.openai.com/api/docs/bots
- Perplexity: Perplexity Crawlers – https://docs.perplexity.ai/guides/bots
- Apple: About Applebot – https://support.apple.com/en-us/119829 · Apple Business – https://business.apple.com/
- IndexNow Documentation – https://www.indexnow.org/documentation
- Search Engine Land: Bing Webmaster Tools testing AI Performance report – https://searchengineland.com/bing-webmaster-tools-testing-new-ai-performance-report-468039
- Search Influence: Inside Bing’s AI Performance Report – https://www.searchinfluence.com/blog/bing-ai-performance-report-copilot-citations/
- Search Engine Land: How ChatGPT conducts local searches – https://searchengineland.com/how-does-chatgpt-conduct-local-searches-454894
- Peec AI: ChatGPT search result providers (09/2026) – https://docs.peec.ai/research/chatgpt-search-result-providers
- Steady Demand zur Foursquare-Debatte – https://www.steadydemand.com/?p=4927
- Wikidata: Notability – https://www.wikidata.org/wiki/Wikidata:Notability; Wikidata-API-Suche „Platzhirsch“ (26.10.2026)
- OpenStreetMap Nominatim, Abfrage „Platzhirsch Lochau“ (26.10.2026): way/956519412, way/131950416
- weekend.at, „Platzhirschin Susanne Messmer“, 10.11.2020 – https://www.weekend.at/bundesland/vorarlberg/platzhirschin-susanne-messmer
- UWG AT (RIS), UWG DE (gesetze-im-internet), UWG CH (fedlex) – Links in Abschnitt 4
- Live-Abrufe platzhirsch.studio: /robots.txt, /llms.txt, /de, /de/ueber-uns/marken/minotti (26.10.2026)
- Interne Berichte: 25-seo-schlachtplan, digital/08-seo-technisch-content, digital/09-local-seo-reputation, digital/14-recht-compliance-digital
