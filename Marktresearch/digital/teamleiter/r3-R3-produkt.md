# R3-produkt – Produktseite „Atelier“: geprüfte Produkttexte, Claim-Filter, Katalog-Restliste

Stand: 26.10.2026 · Branch `feature/neuauftritt` · nicht committet · keine npm-Installation

## Ergebnis

| Punkt | Ergebnis |
|---|---|
| (1) Geprüfte Produkttexte | In `produkte/[category]/[product]/page.js` verdrahtet (nur über `@/lib/productCopy/server`). Angezeigt werden **nur Felder mit gültiger Text-Hash-Freigabe**: Lead (`h1` als `<p>` unter der H1), Absätze (vor dem Herstellertext, der bleibt), „Fakten laut Hersteller“ mit Quellen-Link, FAQ als `<details>` + `FAQPage` im JSON-LD-Graph (gleiche Bedingung `showFaq`). Freigegebenes Meta ersetzt Title/Description, Canonical/hreflang bleiben aus der Live-URL. Nur `de`; EN/FR/IT bekommen `null`, nie deutschen Text. |
| Freigabe | Neu in `approvals.js`: Hash (`t1:` + cyrb53×2) über den exakten Text, ganzer Eintrag (`approvalHash`) oder je Feld/FAQ-Antwort (`approvals`). `approved: true` ohne Hash zeigt **nichts**. Text geändert → unsichtbar bis zur neuen Freigabe; `build.mjs` übernimmt die Hashes und meldet veraltete. Werkzeug: `node src/lib/productCopy/approve.mjs --key <kat/slug> --by <Name> [--fields …] [--faq …]` bzw. `--status`. `buildFaqJsonLd`/`metadataOverride` akzeptieren nur die veröffentlichte Sicht (Marker), keine Rohdaten. |
| Stand Daten | `de.json` unverändert, **0 Einträge freigegeben** → live erscheint noch nichts (Inhaber-Frage 7). Dev-Vorschau: `?produkttext=vorschau` (nur Dev, nur `de`, mit Hinweis, ohne Meta/JSON-LD; im Produktionsbetrieb wird `searchParams` nie gelesen → Seiten bleiben statisch). |
| (2) Herstellertexte | Neues Modul `src/lib/shop/manufacturerText.js` mit Regeln aus `src/lib/legal` (`findClaims` aus `claims.js`, `hasVoiceViolation`/`hasDeliveryClaim` aus `legal/manufacturerText.js`, von R3-marken-seo verschoben – Import bereits umgestellt) plus Ergänzungen („most iconic …“, „perfect“, Lieferzeit, konkrete Beträge). Ganze Sätze fallen weg, HTML bleibt gültig. Gilt für CMS-Beschreibung, CMS-Meta-Titel/-Description, Marken-Bio („Hinter dem Stück“, ersetzt die alte `AVAILABILITY_CLAIM`-Regex) und alle Zugriffe auf `staticShopProducts.js` (`getBrandInfo`, `getDesignerInfo`, `getProductDetailFields`, `getProductVariants`, neu `getStaticShopProducts`). Datendateien nicht umgeschrieben. |
| (3) Zoom-Knopf | Bühnenbild randlos, Vergrößern-Knopf als echter Button in der Steuerzeile (auch bei nur einem Bild). |
| Doppeltes Raumbild | Jedes Raumbild je Ansicht höchstens einmal, danach Textbänder. |
| `/de/produkte/sofas` | 308 (permanent) → `/de/produkte/sofas-couches`, alle Sprachen (`/en/products/sofas` geprüft). Eindeutig: einzige Sofa-Kategorie im Katalog. Alias nur, wenn das Ziel existiert. Echter 301 nur über `next.config.js` möglich (nicht meine Datei); 308 ist SEO-gleichwertig. |
| (4) SEO | curl Arco: `<title>`, Canonical, 11 hreflang, Product- und Breadcrumb-JSON-LD unverändert; ohne Freigabe kein FAQPage. Keine Preise/Verfügbarkeiten ergänzt. |

## Prüfung

- `node --test tests/unit/productCopy.test.mjs tests/unit/r3-produkt.test.mjs`: **27/27 grün** (Rich-Results-Struktur FAQPage/Product im Graph, Teilfreigaben, Hash-Bruch, nur DE, Filter auf 124 Datensätzen ohne Restfund, Quelldaten unverändert). Gesamtlauf: 340/347, die 6 roten gehören fremden laufenden Paketen (Landing, Upload, Sitemap, Forms).
- `npx eslint` auf alle eigenen Dateien: 0 Meldungen.
- `check:claims`: 34 → 31 Funde gesamt, in eigenen Dateien **keine neuen** (30 Altfunde = Rohstrings in `importedProducts/*` und `staticShopProducts.js`, werden beim Rendern gefiltert).
- curl: Lawrence ohne „Erhältlich bei“/„einzigartig“/Händler; `/de/produkte/sofas` → 308.
- Screenshots (alle angesehen, 4 Geräte): `qa-screenshots/teamleiter/r3-R3-produkt/selbst/` (Pflicht-URLs) und `…/produkte/` (Arco, Lawrence, Cover mit Produkttext-Vorschau; Izzy ohne Text; Kategorie, EN-Hub, Merkliste). 28/28 HTTP 200. Im ersten Lauf Desktop `/en/products` und `/de/merkliste` 500 durch R3-shell-Zwischenstand (`BareShell` fehlte), im zweiten Lauf 200. Sonst nur Dev-Meldungen („Router action dispatched…“, 1× state update iPad).

## Dateien

`src/app/[locale]/produkte/[category]/[product]/page.js`, `src/app/[locale]/produkte/[category]/page.js`, `src/components/ShopCatalog/{productInfoTabs,productGallery,shopCatalog,copy}.js`, `src/lib/shop/{manufacturerText,categoryAliases}.js` (neu), `src/lib/data/staticShopProducts.js`, `src/lib/productCopy/{approvals,core,index,server,build}.js|mjs`, `approve.mjs` + `package.json` (neu), `tests/unit/productCopy.test.mjs`, `tests/unit/r3-produkt.test.mjs` (neu), `Marktresearch/digital/teamleiter/messages-r3-produkt.json` (6 Schlüssel `shop.atelier.*`, 4 Sprachen; bis zur Übernahme Fallback in `ShopCatalog/copy.js`), `redesign/{katalog,produkte}.md`.

## Offene Punkte

1. Inhaber: Produkttexte lesen und mit `approve.mjs` freigeben (sonst bleibt alles unsichtbar).
2. FAQPage ist korrekt ausgezeichnet, Google zeigt FAQ-Rich-Results aber seit 2023 nur noch für Behörden-/Gesundheitsseiten – Nutzen v. a. Inhalt/KI-Suche.
3. `check:claims` meldet die Rohstrings der Datendateien weiter; Vorschlag an R3-release: Allowlist-Eintrag „beim Rendern gefiltert“ für `src/lib/data/**` oder Prüfung über die Accessoren.
4. Restliste nicht in diesem Auftrag: H1/Primärknopf mobil erst nach der Galerie (Abnahme R2), doppelte Stückzahl im Katalog (R4), Backoffice-Duplikate (R7).
5. `messages-r3-produkt.json` in Runde 4 übernehmen.

## Nachbesserung nach QM-Feedback (8/10) – 26.10.2026

| QM-Punkt | Stand |
|---|---|
| **P2-1 Doppelte Stücke** | **Behoben (Absicherung beim Rendern).** Neues Modul `src/lib/shop/dedupe.js`, das in `buildShopProducts()` eingehängt ist. Gleiche Marke, gleicher Name (normalisiert) und gleiches Hauptbild zählen als ein Stück. Der erste Eintrag bleibt, die Reihenfolge aus dem Backoffice bleibt erhalten. Stücke ohne Bild oder mit anderem Bild bleiben getrennt, zum Beispiel Reeves Lounge und Semi-round. `/de/produkte/sofas-couches` hat jetzt 98 statt 105 Stücke. Torii, Side, Tape, Saki, West und Coupé erscheinen je einmal, auch in ItemList, Suche, Concierge und Kollektionen. Die doppelten Produktseiten liefern weiter 200, deshalb gibt es keinen SEO-Verlust. **Zuständigkeit:** Die Absicherung liegt bei R3-produkt. Die doppelten Datensätze im Backoffice zu bereinigen, bleibt bei R7. |
| **P2-2 Feature unsichtbar** | **Startliste geliefert, Freigabe bleibt beim Inhaber.** Die Liste steht in `src/lib/productCopy/startList.js`: 4 × ClassiCon (Bell Side Table, E1027, Bibendum, Day Bed), Flos Arco und 5 × Minotti (Lawrence, Hamilton, Yves, Twiggy Armchair, Torii Armchair). Alle 10 Seiten liefern 200. Im Repo gibt es keine Besucherstatistik, deshalb ist die Auswahl ausdrücklich **nicht** „meistbesucht“. Sie folgt nachvollziehbaren Kriterien: ClassiCon ist die einzige gelistete Händler-Marke, Bell steht auf der Startseite, die Sofa-Kategorie hat das QM geprüft. Der Befehl `node src/lib/productCopy/approve.mjs --startliste` gibt je Stück den Stand, den Vorschau-Link und den Freigabebefehl aus. Er gehört in die Inhaber-Fragenliste (Frage 7). |
| P3-1 Zoom leer beim Laden | **Behoben.** Unter dem Lightbox-Bild liegt das bereits geladene Bühnenbild (gleiche URL, aus dem Cache, `aria-hidden`). Playwright: Der Platzhalter ist sofort geladen (665 px), das Großbild folgt. |
| P3-2 Zwei gleichnamige Tab-Stopps | **Behoben.** Das Bühnenbild hat `tabIndex=-1` und bleibt Ziel für Maus und Touch. Einziger Tab-Stopp ist der Knopf in der Steuerzeile. Nach Escape kehrt der Fokus dorthin zurück (geprüft). |
| P3-3 bis P3-6 | Offen bzw. nicht meine Datei: FAQ-Überschrift bleibt, Screenshot-Artefakt, 301 in `next.config.js`, Allowlist für `check:claims` (R3-release). |

**Prüfung:** `node --test` ergibt 29/29 grün, neu sind Test 14 (Dedupe) und Test 15 (Startliste). eslint meldet 0. shoot.mjs `qa-screenshots/teamleiter/r3-R3-produkt/fix/` mit 4 URLs × 4 Geräten: 16/16 mit HTTP 200, kein Überlauf. Ein Konsolenfehler auf dem iPad bei Lawrence war ein Turbopack-HMR-Zwischenstand. Beim Nachlauf in `fix/recheck/` gab es 4/4 ohne Fehler. Die Screenshots habe ich angesehen: Die Kategorie zeigt 98 Stücke ohne Doppel, Bell, Arco (Vorschau) und Lawrence sind sauber.
