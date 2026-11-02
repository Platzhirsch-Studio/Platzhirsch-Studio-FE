# R1-legal – Claim-Guard, Claim- und NAP-Prüfskripte (UWG-Sicherung)

Runde 1 · Stand 26.10.2026 · Branch `feature/neuauftritt` (nichts committet, keine Fremddatei geändert, keine npm-Installation)

## Ergebnis in Kürze

- **Claim-Guard** `src/lib/legal/claims.js`: reine Logik, nur relative Imports, kein `server-only`. Damit kann jede Komponente Händler-Behauptungen und Superlative entfernen.
- **Prüfskripte** `tools/checks/check-claims.mjs` (Exit 1 bei Verstoß) und `tools/checks/check-nap.mjs` (Inventur, ändert nichts).
- **Tests:** 58 Fälle mit `node --test` (36 Claim-Guard, 13 Parser, 9 NAP). Alle grün. `npx eslint` auf alle eigenen Dateien: 0 Meldungen.
- **Wichtigster Live-Befund:** 35 Markenseiten × 4 Sprachen zeigen „Platzhirsch Studio ist Ihr [offizieller] X Händler in Vorarlberg.“ Bei 14 Marken steht zusätzlich „offizieller“, darunter Minotti, Poliform, Flos und Rimadesio. Der Satz erscheint auf Deutsch auch auf den EN-, FR- und IT-Seiten. Das ist der Hauptpunkt für das Marken-Team bzw. den Integrator (siehe Abschnitt 4).
- **NAP:** In 49 Dateien außerhalb von `src/lib/site.js` steht die Adresse, die Telefonnummer, die E-Mail oder die Geo-Daten hartcodiert. Die Hausnummer **9 kommt 65-mal vor, die 11 nirgends**. Öffnungszeiten finden sich 203-mal.

## 1. Dateien

| Datei | Zweck |
|---|---|
| `src/lib/legal/claims.js` | `VERIFIED_DEALER_BRANDS`, `CLAIM_REGISTER`, `sanitizeClaims`, `hasDealerClaim`, `neutralDealerText`, `findClaims`, `isVerifiedDealerBrand`, `toBrandSlug`, `splitSentences`, `KNOWN_BRANDS` |
| `tools/checks/lib/parse.mjs` | Parser: JSON-String-Werte mit Zeile/Pfad, JS-String-/Template-Literale und JSX-Text (Kommentare und Regex-Literale werden übersprungen), HTML→Text, Meta-Texte, Sitemap→localhost, Markenslug aus URL, Allowlist |
| `tools/checks/check-claims.mjs` | Claim-Prüfung, statisch und mit `--live` |
| `tools/checks/claims-allowlist.json` | Freigaben für echte Fehlalarme, jeweils mit Begründung |
| `tools/checks/check-nap.mjs` | NAP-Inventur |
| `tests/unit/claims.test.mjs`, `tests/unit/claims-parsers.test.mjs`, `tests/unit/nap.test.mjs` | Unit-Tests |

## 2. Claim-Guard (`src/lib/legal/claims.js`)

- `VERIFIED_DEALER_BRANDS = ['classicon']`.
- `CLAIM_REGISTER`: nur ein Eintrag, nämlich ClassiCon mit Beleg `https://www.classicon.com/de/haendler.html` (geprüft am 26.10.2026, Quelle `Marktresearch/16-markenluecken-verifiziert.md`).
- `sanitizeClaims(text, brandSlug, { locale, brandName, brands })`
  - **Händler-Wörter** in DE/EN/FR/IT: Händler (auch in Komposita), offiziell, autorisiert, Vertrags-/Vertriebspartner, Flagship, dealer/retailer/stockist/official/authorized, revendeur/distributeur/officiel/agréé/autorisé, rivenditore/distributore/ufficiale/autorizzato. Sie werden nur im **Marken-Kontext** behandelt, also wenn ein Markenname im selben Satz steht, `brandSlug` gesetzt ist oder ein Kompositum wie „X-Händler“ vorliegt. Der betroffene Satz wird durch `neutralDealerText(Marke, locale)` ersetzt, pro Text nur einmal. Weitere Händler-Sätze im selben Text entfallen.
  - **Bleiben stehen:** „Offizielle Website“, „offizielle Regeln“ und ihre Entsprechungen in EN/FR/IT. Ebenso Herstellerangaben wie „offizieller Einstiegspreis“ oder „offizielles Datenblatt“ und Meta-Wörter wie Händlerverzeichnis, -status, -behauptung oder -locator. **ClassiCon-Händlersätze bleiben ebenfalls stehen.**
  - **Superlative** werden immer ersetzt, auch bei ClassiCon: größte→große, führend→renommiert, einzigartig→besonders, largest→large, leading→renowned, unique→distinctive, le plus grand→un grand, unique (FR)→remarquable, il più grande→un grande, unico→speciale, leader→specialist/spécialiste/specialista. **Rang-Claims** („Nr. 1“, „number one“, „#1“, „numéro 1“, „numero uno“) entfernen den ganzen Satz. Groß- und Kleinschreibung bleiben erhalten.
- `hasDealerClaim(text, brandSlug?)` erkennt reine Händler-Wörter, ohne die Ausnahmen. Mit dem Slug einer belegten Marke ist das Ergebnis immer `false`.
- `neutralDealerText(brand, locale)` liefert je nach Sprache: „Minotti in unserer Ausstellung in Lochau“ / „… in our showroom in Lochau“ / „… dans notre showroom à Lochau“ / „… nel nostro showroom a Lochau“. Unbekannte Sprachen fallen auf DE zurück.

### Umstellung für den Integrator (MarkenItems, gehört aktuell dem Neuauftritt-Team, nicht geändert)

`src/components/MarkenItems/markenitems.js` liest in Zeile 115–116 `dealers_title` und `dealers_description` aus dem Backoffice und zeigt beide ungefiltert an (Zeile 423–430). Die eigene Hilfsfunktion des Neuauftritt-Teams wird durch Folgendes ersetzt:

```js
import { sanitizeClaims, hasDealerClaim, isVerifiedDealerBrand, neutralDealerText } from "../../lib/legal/claims.js"; // oder "@/lib/legal/claims"
const slug = params.title; // Marken-Slug der Seite
const safeTitle = isVerifiedDealerBrand(slug) ? dealersTitle : sanitizeClaims(dealersTitle, slug, { locale, brandName: marke.name1 });
const safeDescription = isVerifiedDealerBrand(slug)
  ? dealersDescription
  : hasDealerClaim(dealersDescription)
    ? `${neutralDealerText(marke.name1, locale)}.` // ganzer Absatz neutral
    : sanitizeClaims(dealersDescription, slug, { locale, brandName: marke.name1 });
```

Das gilt genauso für alle anderen Texte aus dem Backoffice (Markenbeschreibung, `collectionDetail.js`, Produkttexte). Dort genügt `sanitizeClaims(text, slug, { locale })`. Danach räumt die Prüfung mit `node tools/checks/check-claims.mjs --live --locales=de` die 35 Markenseiten ab. Die Hilfsfunktion des Neuauftritt-Teams kann dann entfallen, sodass `VERIFIED_DEALER_BRANDS` die einzige Quelle ist.

## 3. Prüfskripte

```bash
node tools/checks/check-claims.mjs                 # statisch: src/messages, src/**/*.js (Strings, Templates, JSX-Text), src/content/**/*.md, Marktresearch/content/**
node tools/checks/check-claims.mjs --live          # zusätzlich localhost:3000: sitemap-static.xml + sitemap-marken.xml (auf localhost umgeschrieben) + 10 neue Landingpages
#   Optionen: --locales=de,en  --limit=N  --concurrency=4  --json=out.json  --no-static  --allowlist=…
node tools/checks/check-nap.mjs [--json=out.json] [--only=hausnummer,telefon] [--strict]
node --test tests/unit/claims.test.mjs tests/unit/claims-parsers.test.mjs tests/unit/nap.test.mjs
```

Ausgabeformat: `Datei:Zeile` bzw. URL, dann Regel, Fundstelle und Satz. Beim Live-Lauf ist der Markenslug aus der URL der Marken-Kontext. In Markdown werden die internen Abschnitte (Redaktion, Prüfvermerk) und Marker der Form `[prüfen: …]` übersprungen.

## 4. Befundliste (Lauf vom 26.10.2026)

### 4a. Statisch: 52 Verstöße (0 Händler, 52 Superlative), 12 per Allowlist frei, Exit 1

| Fundstellen | Befund | Zuständig |
|---|---|---|
| `src/messages/de.json` 395, 496, 509 · `en.json` 396, 495 („Leading Brands“), 510, 888 · `fr.json` 396, 497, 510, 846, 884, 926 · `it.json` 396, 510, 884, 926 | einzigartig / unique / unico / Leading | **Team 7 Texte (Neuauftritt Recht & Texte)** |
| `src/app/[locale]/layout.js:75` (Meta-Description „Möbel führender Marken wie Minotti…“), `interior-design-vorarlberg/page.js:16`, `kuechen-vorarlberg/page.js:100`, `wohnzimmer-einrichten-vorarlberg/page.js:32` | „führender (Design)marken“ | **Team 5 Landing/Regionen** (layout.js: **Team 1/Integrator**, SEO-Meta) |
| `src/components/Impressum/impressum.js:52` | „einzigartige Wohnkonzepte“ | **Rechtspaket/Impressum** (wird mit dem Impressum-Entwurf `recht/04` ersetzt) |
| `src/lib/data/importedProducts/brandVanEgmond.js` (18×), `treca.js` (6×), `next125.js` (4×), `staticShopProducts.js` | Herstellertexte mit „unique“ / „unrivalled“ | **Team 4 Katalog/Produktseite**: beim Rendern `sanitizeClaims(text, brandSlug)` anwenden, statt die Daten von Hand zu bearbeiten |

### 4b. Live: 399 URLs, 401 Verstöße (190 Händler, 211 Superlative), 3 HTTP-500, Exit 1

| Befund | Umfang | Zuständig |
|---|---|---|
| **„Platzhirsch Studio ist Ihr offizieller X Händler in Vorarlberg.“** aus dem Backoffice-Feld `dealers_description` | 14 Marken × 4 Sprachen: rimadesio, minotti, flos, poliform, paola-lenti, eichholtz, tonon, gloster, alonpi, quasar, schueller, antoniolupi, agape, baobab | **Team 3 Marken** bzw. Integrator: Umstellung wie in Abschnitt 2. Zusätzlich im Backoffice bereinigen (Inhaber/Redaktion) |
| „Platzhirsch Studio ist Ihr X Händler in Vorarlberg.“ (ohne „offiziell“) | 21 Marken × 4 Sprachen, u. a. tom-dixon, treca, next125, brand-van-egmond, tuuci, emu, qeeboo, desalto, bombyxx | wie oben |
| Der deutsche Händler-Satz erscheint auch auf EN-, FR- und IT-Seiten | alle 35 | Team 3 (Fallback-Sprache) |
| Markentexte aus dem Backoffice: „einer der größten deutschen Küchenhersteller“ (Schüller), „einer der größten Produktionsflächen der Branche“ (EMU), „größter Maßgenauigkeit“ (Poliform), „Einzigartig statt austauschbar“ (Bombyxx), „Einzigartige Veredelung“ (Qeeboo), „einzigartig“ (Desalto, antoniolupi) | je 4 Sprachen | Team 3 (`sanitizeClaims` beim Rendern) |
| **„#1 Arbeitgeberregion“** auf der Karriereseite | /de, /en, /fr, /it Karriere | **Team 6 Karriere**: ohne Beleg streichen |
| News-Teaser „Birds Zyklus“ / Maximilian Fohn: „einzigartig“, „unique“, „unico“ | Startseite und News in 4 Sprachen | **Team 6 News** |
| Über uns: „unique atmosphere“, „atmosfera unica“ usw. | /about-us/platzhirsch in 3 Sprachen | Team 6 / Team 7 (stammt aus messages) |
| HTTP 500 beim Crawl | /en/…/antoniolupi, /de/…/antoniolupi, /it/…/schueller | **Team 3 Marken** prüfen. Vermutlich Last auf dem Dev-Server, ein Einzelaufruf sollte das klären |

**ClassiCon:** In keinem Lauf gab es einen Fund. Der belegte Händler-Hinweis bleibt also erhalten.

### 4c. Allowlist (12 Freigaben, alle begründet)

Freigegeben sind: Belegverweis auf den ClassiCon-Locator, „der größte Teil davon“ (Flos-Gewicht), „größte Hebel“ (Ratgeber), „Nr. 1 (Was kostet…)“ (interne Notiz), „Händler nennen öffentlich“ und „US-Händlers“ (Quellen über Dritte), „Du fauteuil unique“ (bedeutet „einzelner Sessel“).

## 5. NAP-Inventur (`check-nap.mjs`), nichts geändert

Gesamt: 65 Dateien mit Funden. Hausnummer 65× (**alle „Landstraße 9“**), PLZ+Ort 45×, Straße ohne Nummer 11×, Telefon 19×, E-Mail 12×, Geo 8×, Öffnungszeiten 203×, andere Telefonnummern 8× (Partnerseite, Mock).

Dateien mit Hausnummer bzw. Telefon (Spalte „sonst“ = PLZ, Öffnungszeiten, E-Mail, Geo):

| Datei | Hausnr. (Zeilen) | Telefon (Zeilen) | sonst |
|---|---|---|---|
| `src/app/[locale]/designermoebel-appenzell/page.js` | 123, 136 |  | 3 |
| `src/app/[locale]/designermoebel-arlberg/page.js` | 92, 103 |  | 3 |
| `src/app/[locale]/designermoebel-bregenz/page.js` | 93 |  | 3 |
| `src/app/[locale]/designermoebel-dornbirn/page.js` | 94 |  | 3 |
| `src/app/[locale]/designermoebel-feldkirch/page.js` | 101 |  | 3 |
| `src/app/[locale]/designermoebel-friedrichshafen/page.js` | 95 |  | 4 |
| `src/app/[locale]/designermoebel-kempten/page.js` | 89, 100 |  | 3 |
| `src/app/[locale]/designermoebel-konstanz/page.js` | 99 |  | 3 |
| `src/app/[locale]/designermoebel-liechtenstein/page.js` | 121 |  | 7 |
| `src/app/[locale]/designermoebel-lindau/page.js` | 95 |  | 3 |
| `src/app/[locale]/designermoebel-ravensburg/page.js` | 99 |  | 3 |
| `src/app/[locale]/designermoebel-rheintal/page.js` | 124, 137 |  | 9 |
| `src/app/[locale]/designermoebel-st-gallen/page.js` | 97 |  | 3 |
| `src/app/[locale]/layout.js` (JSON-LD) | 80 | 76, 105 | 7 |
| `src/app/[locale]/moebel-bodensee/page.js` | 92 |  | 3 |
| `src/app/[locale]/outdoor-gartenplanung/page.js` | 238 |  | 3 |
| `src/app/[locale]/yacht-interior/page.js` | 179 |  | 3 |
| `src/app/[locale]/portal/login/page.js` |  | 17 | 0 |
| `src/app/[locale]/zz-fundament-check/page.js` |  | 62 | 0 |
| `src/components/Datenschutz/datenschutz.js` | 107 | 112 | 0 |
| `src/components/Impressum/impressum.js` | 32 | 42 | 0 |
| `src/components/Kontakt/kontakt.js` (Maps-iframe, Route) | 248, 249, 250, 290 |  | 0 |
| `src/components/Event/ics.test.mjs` | 12, 52 |  | 0 |
| `src/components/Labs/Kuechenplaner/ResultPanel.js` |  | 143 | 0 |
| `src/components/Landing/landingPage.js` | 235 |  | 4 |
| `src/components/Navbar/navbar.js` | 1186 |  | 0 |
| `src/components/Partner/partner.js` | 60 | 13 | 7 |
| `src/components/Preview/buehne/content.js` | 10 | 12, 13 | 3 |
| `src/components/Preview/dreilaendereck/content.js` | 10 | 13, 14 | 4 |
| `src/components/Preview/galerie/content.js` | 9 | 12, 13 | 2 |
| `src/components/Preview/galerie/MobileMenu.js` |  | 48, 49 | 0 |
| `src/content/ratgeber/*.md` (8 Dateien) | je 1 |  | 0–9 |
| `src/lib/content/homeSeo.js` (FAQ 4 Sprachen) | 20, 33, 46, 59 |  | 13 |
| `src/lib/portal/adapters/mockSeed.js` | 187 | 36 | 1 |
| `src/lib/seo/structuredData.js` | 155 |  | 0 |
| `src/messages/{de,en,fr,it}.json` | je 298, 347, 630/631, 858–876 |  | 9–16 |

Hinweise:
- `src/lib/site.js` kennt keine Öffnungszeiten. Die Zeiten „Di–Fr 10–18, Sa 10–14“ stehen deshalb 203-mal verteilt im Code. Empfehlung an den Integrator: `OPENING_HOURS` in `site.js` aufnehmen (Datei gehört nicht diesem Paket).
- `DIRECTIONS_URL` in `site.js` und die Google-Maps-URLs in `kontakt.js` enthalten die Hausnummer URL-codiert. Das Skript findet auch diese Schreibweise.
- Das Rechtspaket (W1) sieht `src/lib/legal/company.js` als zentrale Quelle für die Impressumsadresse vor. Die Datei ist nicht Teil dieses Auftrags und wurde **nicht** angelegt.

### Frage an den Inhaber: Hausnummer

> Das Firmenbuch und der ClassiCon-Händlerlocator nennen **Landstraße 11**. Website, JSON-LD, Footer, Impressum, Datenschutz, Google-Maps-Links und alle Regionsseiten nennen dagegen **Landstraße 9** (65 Stellen in 49 Dateien, siehe oben). **Welche Hausnummer ist die amtliche?** Bitte bei der Gemeinde Lochau bestätigen lassen (Rechtspaket W1).
> - Ist es die **11**: Dann wird in einem Schritt auf `ADDRESS`/`DIRECTIONS_URL` aus `src/lib/site.js` umgestellt (Liste oben), und das Google-Profil sowie Herold werden angepasst.
> - Ist es die **9**: Dann muss die Geschäftsanschrift im Firmenbuch geändert werden. Bis dahin nennt das Impressum die Firmenbuchadresse (11).

Nachprüfen nach der Umstellung: `node tools/checks/check-nap.mjs --only=hausnummer --strict` muss mit Exit 0 enden.

## 6. Selbstprüfung

- `node --test …`: 58/58 bestanden. `npx eslint src/lib/legal tools/checks tests/unit/claims*.test.mjs tests/unit/nap.test.mjs`: 0 Meldungen.
- Screenshots in `qa-screenshots/teamleiter/r1-R1-legal/selbst/` (Minotti, ClassiCon, /de):
  - iPhone, iPad und Desktop: Status 200, kein horizontaler Overflow, keine Konsolenfehler.
  - Android: Timeout bei /de und Minotti, weil der Dev-Server durch den parallelen Live-Crawl ausgelastet war. Das ist kein Seitenfehler. ClassiCon-Android: 200.
  - Der Desktop-Screenshot von Minotti zeigt den Befund sichtbar im dunklen Showroom-Panel: „Platzhirsch Studio ist Ihr offizieller Minotti Händler in Vorarlberg.“
- Hinweis zu Node: Beim Import von `claims.js` aus `.mjs` erscheint die Warnung `MODULE_TYPELESS_PACKAGE_JSON`, weil `package.json` kein `"type"` hat. Das ist harmlos, mit `--no-warnings` ausblendbar und an `package.json` wurde bewusst nichts geändert.

## 7. Offene Punkte

1. Integrator bzw. Team 3: `markenitems.js` auf `claims.js` umstellen (Abschnitt 2). Erst danach ist der Live-Check für Marken grün.
2. Inhaber/Redaktion: Backoffice-Feld `dealers_description` für 34 Marken bereinigen. Bis dahin filtert der Code.
3. Team 7: 17 Superlative in `src/messages/*.json`. Team 5: „führender“ (4×). Team 6: „#1 Arbeitgeberregion“ und News-Texte.
4. Inhaber: Entscheidung zur Hausnummer (Abschnitt 5).
5. Die Prüfskripte könnten in CI bzw. in `package.json`-Scripts aufgenommen werden (Fremddatei, Entscheidung beim Integrator).

## 8. Nachbesserung nach QM-Feedback (Note 7/10), 26.10.2026

Grundlage: `qa-screenshots/teamleiter/r1-R1-legal/feedback.md`. Geändert wurden nur die eigenen Dateien `src/lib/legal/**`, `tools/checks/**` und `tests/unit/claims*.test.mjs`.

### P2 behoben

| Punkt | Lösung |
|---|---|
| **P2-2 Lücken** | `claims.js` erkennt jetzt auch „exklusive(r) Partner (von)“, „Premium-Partner/Premiumpartner“, „zertifizierter/lizenzierter Partner/Händler/Studio …“, „von Minotti zertifiziert“, „Vertrieb“, reseller, distributor, „certified/licensed/exclusive/premium partner|dealer|retailer|showroom …“, „partenaire exclusif/premium/agréé“, „partner esclusivo/premium/certificato“. Damit ist `claims.js` eine Obermenge der Muster in `showroomText.js`. **Keine Fehlalarme bei Produktangaben:** „FSC-zertifiziert“, „von OEKO-TEX zertifiziert“ und „lizenzierte Neuauflage“ bleiben stehen, weil Prüfzeichen ausgenommen sind und „zertifiziert“ nur als Status-Aussage zählt. |
| **P2-3 HTML** | `sanitizeClaims` erkennt HTML. Block-Tags (`<p>`, `<li>`, `<br>`, `<h1–6>`, `<div>` …) trennen Sätze, und Inline-Tags (`<strong>`, `<a>`, `<em>`) bleiben als Platzhalter erhalten. Kein Tag geht verloren, auch nicht bei einem ersetzten Satz. `"<p>Ihr offizieller Minotti Händler.</p><p>Text</p>"` ergibt `"<p>Minotti in unserer Ausstellung in Lochau.</p><p>Text</p>"`. HTML ohne Claim bleibt byte-gleich. |
| **P2-4 Sinn** | Diese Wendungen bleiben unverändert: „offiziell (1970) gegründet/eröffnet/vorgestellt …“, „officially founded/opened/launched …“ und „official launch/opening“. Ebenso „pièce(s) unique(s)“, „pezzo unico/pezzi unici“, „unique piece“, „taille/prix unique“, „taglia unica“ sowie „team/project/group leader“ und „leader d'équipe“. Echte Superlative werden weiter ersetzt („intérieur unique“ → „remarquable“, „The leader in design“ → „specialist“). |
| **P2-1 zwei Guards** | Neu ist `src/lib/legal/brand.js` mit `resolveShowroomText(marke, locale, neutral, brandName)`. Die Signatur und die neutralen Texte stimmen mit `src/components/MarkenItems/showroomText.js` überein, die Muster kommen aber aus `claims.js`. Team 3 muss in `showroomText.js` nur noch die Zeile `export { resolveShowroomText, NEUTRAL_SHOWROOM_TEXT as NEUTRAL_TEXT } from "../../lib/legal/brand.js"; export { hasDealerClaim, isVerifiedDealerBrand as isVerifiedDealer } from "../../lib/legal/claims.js";` setzen und die eigene Muster-Liste löschen. Die Datei gehört Team 3, sie wurde hier **nicht** geändert. |

### P1, Werkzeug geliefert, Einbau bei Team 3 bzw. Integrator

- **P1-2 Payload-Leak:** `publicBrand(marke, { locale })` aus `src/lib/legal/brand.js` gibt eine bereinigte Kopie zurück. Darin fehlen alle `dealers_title*`/`dealers_description*` in allen Sprachen. Für die aktuelle Sprache werden sie durch den gefilterten bzw. neutralen Showroom-Text ersetzt, damit bestehende Komponenten unverändert weiterlaufen. Alle übrigen Textfelder laufen rekursiv durch `sanitizeClaims`, HTML bleibt dabei erhalten. Namen, Pfade, Bilder und Zahlen bleiben unangetastet. Den Einbau übernimmt Team 3 in `src/app/[locale]/ueber-uns/marken/[title]/page.js`:
  ```js
  import { publicBrand } from "@/lib/legal/brand";
  const safeMarke = publicBrand(marke, { locale });
  <BrandPage marke={safeMarke} … />   // auch für JSON-LD (buildBrandNode) und Metadaten
  ```
  Dasselbe gilt für `collectionDetail.js` und alle Stellen, an denen ein Backoffice-Datensatz an eine `"use client"`-Komponente geht. Das Gegenstück ist `brandRecordHasDealerClaim(obj)`, ein Test-Helfer, der prüft, ob noch ein Claim im Objekt steckt.
- **Live-Prüfung des Payloads:** `check-claims --live` liest jetzt zusätzlich den Next-Flight-Payload (`self.__next_f.push`) und meldet dort Händler-Claims mit der Kennung `[payload]`. Ein Leak wie in P1-2 wird damit automatisch gefunden, auch wenn die Anzeige filtert.
- **P1-1 Minotti-Seite:** Den Einbau kann dieses Paket nicht leisten, weil `markenitems.js` und `page.js` Team 3 gehören und gerade parallel umgebaut werden. Abnahmekriterium bleibt `node tools/checks/check-claims.mjs --live --no-static --locales=de,en` mit **0 Händler-Funden, auch `[payload]`**.

### Prüfung

- `node --test tests/unit/claims.test.mjs tests/unit/claims-parsers.test.mjs tests/unit/claims-fix.test.mjs tests/unit/nap.test.mjs`: **71/71 grün**. Davon sind 13 Tests neu (`claims-fix.test.mjs`, F01–F13), und alle 58 alten Tests sind unverändert grün.
- `npx eslint src/lib/legal tools/checks tests/unit/claims*.test.mjs`: 0 Meldungen.
- Statischer Lauf `check-claims`: 45 Verstöße (dealer 0, superlative 45), 12 Allowlist-Freigaben. Die erweiterten Muster erzeugen also keinen einzigen neuen Händler-Fehlalarm im Code. Die Zahl der Superlative ist von 52 auf 45 gefallen, weil andere Teams Texte bereinigt haben.

- **Live (Dev-Server, 26.10.2026):** Team 3 hat die Showroom-Umstellung inzwischen eingebaut. `/de/ueber-uns/marken/minotti`, `/en/about-us/brands/minotti`, Poliform und Flos liefern 200. Im ausgelieferten HTML stehen weder „Händler“ noch „official … dealer“ noch ein `dealers_*`-Feld im Flight-Payload (per curl geprüft). `check-claims --live --no-static --locales=de` lief über 109 URLs (3 Fehler durch parallele Umbauten): **0 Händler-Funde** in Sichttext und `[payload]`, 24 Superlative (Teams 3/5/6/7). Der einzige Händler-Fund im ersten Lauf, „In exklusiver Partnerschaft mit Trip Trap“ (TRAPA, eine Kooperation zweier Hersteller), war ein Fehlalarm des neuen Musters. Das Muster ist korrigiert (F13), es erkennt jetzt nur noch „Partner“, nicht mehr „Partnerschaft“. Ein Lauf mit EN/FR/IT war wegen 500er durch fremde Dateien (`fonts.js`, `produkte/…/page.js`) zeitweise nicht möglich und steht noch aus.
- **Screenshots** `qa-screenshots/teamleiter/r1-R1-legal/fix/` (Minotti und ClassiCon): Desktop, iPad und ClassiCon-Android liefern 200. Auf dem Minotti-Desktop-Bild zeigt das Showroom-Panel „Minotti in unserer Ausstellung in Lochau“ und keinen Händler-Satz. iPhone und Minotti-Android liefern 500, weil der Dev-Server während des Laufs an einer fremden Datei gescheitert ist (Font-Loader in `fehlerseite-global.preview`). Das ist kein Fehler dieses Pakets.

### Offen

1. Team 3: `showroomText.js` auf den Re-Export aus `src/lib/legal` umstellen (P2-1, eine Zeile, siehe oben). Ob `page.js` noch Rohfelder an andere Client-Komponenten weitergibt (z. B. `collectionDetail.js`), klärt `publicBrand` bzw. der Live-Check mit `[payload]`.
2. `check-claims --live` für alle 4 Sprachen wiederholen, sobald der Dev-Server stabil läuft. Ziel: 0 Händler-Funde.
3. P3 unverändert: Superlative in fremden Dateien, `MODULE_TYPELESS_PACKAGE_JSON` (package.json gehört nicht diesem Paket) und die Option `--changed`.
