# R1-ratgeber: Ratgeber-Seiten /de/ratgeber und /de/ratgeber/[slug]

Stand: 26.10.2026 · Branch feature/neuauftritt (nicht committet)

## Ergebnis

- **Hub** `/de/ratgeber` (statisch, hat Vorrang vor `[locale]/[slug]`, per curl geprüft: 200 mit Hub-H1). Er enthält Rubriken-Navigation, Teaser, „Stand“ und „Geprüft am“ sowie einen Termin-CTA.
- **8 Artikelseiten** `/de/ratgeber/<slug>`, alle 200. Unbekannte Slugs liefern 404, ebenso `/en|fr|it/ratgeber/...` (`dynamicParams = false`, `generateStaticParams` nur für `de`, `setRequestLocale`).
- Jede Artikelseite hat: eine Antwort-Box („Die kurze Antwort“ = erster Absatz), ein Inhaltsverzeichnis (mobil oben, Desktop als Sticky-Spalte), den Artikeltext, die Liste „Häufige Fragen“, die Quellenliste und „Marken zum Thema“. Markenseiten werden nur verlinkt, wenn sie per curl 200 lieferten. Dazu kommt der Termin-CTA zu `/de/beratung`.
- **Metadaten:** `robots {index:false, follow:true}`, solange `freigegeben !== true`. Der Hub bleibt noindex, bis ein Artikel freigegeben ist. Canonical ist gesetzt, OG ist `article`.
- **JSON-LD:** Article mit `author = Organization` (`@id` #organization), solange `reviewedBy` null ist, dazu WebPage, BreadcrumbList und FAQPage. Die FAQPage entsteht nur aus dem bereits gefilterten FAQ-Abschnitt. Der Hub hat CollectionPage und BreadcrumbList.
- **Nicht** in Sitemap, llms.txt oder Navigation. `src/lib/ratgeber/index.js` stellt `listRatgeber()` und `getIndexableRatgeber()` bereit, heute `[]`.

## Prüf-Filter ([prüfen] wird nie veröffentlicht)

Datei: `src/lib/ratgeber/review.js`

- Interne Teile werden abgeschnitten: HTML-Kommentare und alles ab der ersten Überschrift „Redaktion …“, „Prüfvermerk“, „Interne Link-Vorschläge“ oder „Bildvorschläge“.
- Folgende Marker werden erkannt: `[prüfen]`, `[prüfen: …]`, `[Freigabe …]`, `[Quelle ergänzen …]`, `[Name, Funktion]` und `[… eintragen]`.
- So wird entfernt:
  - Ein Listenpunkt mit Marker fällt ganz weg.
  - Eine Tabellenzeile mit Marker fällt weg, ein Marker im Tabellenkopf entfernt die ganze Tabelle.
  - Steht der Marker am Anfang eines Absatzes, fällt der ganze Absatz weg.
  - Steht ein Marker allein direkt unter einer Überschrift, fällt der ganze Abschnitt weg. Das betrifft zum Beispiel den Binni-Abschnitt in „Was kostet eine Designerküche“.
  - Sonst wird nur der betroffene Satz entfernt.
  - Als Schlussschutz fällt jeder Block weg, in dem noch ein Marker steht.
- - **Sperrbegriffe (neu nach QA-Feedback):** `EMBARGO_RE` in `review.js` (heute „Binni“, Kooperation laut Bericht 26 nicht vereinbart) wirkt wie ein Marker, auch ohne [prüfen]: Satz, Listenpunkt, Tabellenzeile oder die ganze FAQ-Frage fällt weg. Ein Marker direkt hinter der fett gesetzten FAQ-Frage entfernt jetzt die ganze Frage (vorher lief die Antwort in die vorige Frage).
- **Quellen:** Eine Quelle aus `quellen` wird nur ausgegeben (Liste und JSON-LD `citation`), wenn sie keinen Sperrbegriff enthält und nicht ausschließlich in herausgefilterten Passagen verlinkt ist. Dadurch fallen heute binni.biz (2×), der Caesarstone-Link (Arbeitsplatte) und ein Paola-Lenti-Katalog (Outdoor) weg; sie kommen mit der Freigabe ihrer Passagen zurück.
- Unit-Tests: `node --test tests/unit/ratgeber.test.mjs tests/unit/ratgeber-fix.test.mjs`, 32 von 32 bestanden. Er rendert alle 8 Artikel mit react-dom/server und prüft Text, HTML und JSON-LD auf `[prüfen`, Platzhalter und interne Abschnitte. Zusätzlich gibt es Fälle für Satz-, Listen-, Tabellen- und Abschnittsfilter, HTML-Escaping, `rel=noopener`, `javascript:`-Links und Tabellen-`scope`.

## Dateien

- `src/content/ratgeber/*.md`: 8 Kopien. Im Frontmatter ergänzt: `freigegeben: false`, `reviewedBy: null`, `updatedAt: 2026-10-26`.
- `src/lib/ratgeber/`: `frontmatter.js` (eigener YAML-Parser), `markdown.js`, `review.js`, `article.js`, `brands.js`, `schema.js` und `index.js` (Lesen per fs).
- `src/components/Ratgeber/`:
  - `Markdown.js`: Server Component mit createElement, ohne dangerouslySetInnerHTML.
  - `RatgeberHub.js`
  - `RatgeberArticle.js`
  - `RatgeberParts.js`
- `src/app/[locale]/ratgeber/page.js` und `src/app/[locale]/ratgeber/[slug]/page.js`
- `tests/unit/ratgeber.test.mjs`

## Textänderungen gegenüber Marktresearch/content/ratgeber

Zwei Superlative wurden entschärft:

- Küchenarbeitsplatte: „Marmor ist die schönste …“ wurde zu „Marmor wirkt warm und lebendig und ist zugleich die empfindlichste …“.
- Outdoor: Die Überschrift „… am meisten verzeiht“ wurde zu „… viel verzeiht“.

Sonst ist der Text unverändert. Preise erscheinen nur so, wie sie belegt im Artikel stehen.

## Design

- Gebaut nach der Design-Bibel. `redesign/fundament.md` und `src/components/ui/*` gibt es nicht, deshalb sind nur Tailwind-Tokens aus globals.css verwendet.
- Schrift: Bodoni ausschließlich für H1 (display-l) und H2 (display-m ≥ 32 px), sonst Instrument Sans.
- Keine Radien und keine Schatten. Gold nur als brass-700 für Overlines.
- Die Lesespalte ist auf max-w-measure (68ch) begrenzt.
- Tabellen liegen in einem scrollbaren `role=region` mit Caption, damit es auf 375 px keinen Seitenüberlauf gibt.

## QA

- Screenshots: `qa-screenshots/teamleiter/r1-R1-ratgeber/selbst`, 4 URLs × 4 Geräte. Überall Status 200, kein horizontaler Überlauf.
- Ein Konsolenfehler trat auf dem iPad bei der Designerküche-Seite auf („state update on a component that hasn't mounted“). Er kommt aus einer Client-Komponente der Shell, denn der Ratgeber selbst hat keinen Client-Code.
- `npx eslint` auf alle Ratgeber-Dateien: 0 Meldungen.

## Nachbesserung nach QA-Feedback (26.10.2026, Note 7/10)

- **P1 Binni-FAQ** (Designerküche): FAQ „Gibt es bei Ihnen auch günstigere Küchen mit Stein?“ mit [prüfen] markiert und durch den Sperrbegriff doppelt abgesichert. Nicht mehr auf der Seite, nicht im FAQPage-JSON-LD.
- **P1 binni.biz:** aus `quellen` beider Küchenartikel entfernt, zusätzlich Quellenfilter (siehe oben).
- **P2 Poliform:** „Auch Poliform führen wir in der Ausstellung.“ im Sofa-Artikel gestrichen; alle Ausstellungsaussagen zu Poliform sind jetzt einheitlich [prüfen] und damit unsichtbar. Test gegen unbedingte Poliform-Ausstellungsaussagen.
- **P2 Tax-Free:** Weg A heißt „Sie holen selbst ab (Tax-Free, sofern angeboten)“, Text: „Sie kaufen in Österreich … Sofern das verkaufende Geschäft die Rückvergütung anbietet, erstattet es …; fragen Sie vor dem Kauf nach“. Gegenlesen durch Steuerberatung/Spediteur bleibt Freigabebedingung.
- **P2 Titel:** neues Frontmatter-Feld `seoTitle` (44–57 Zeichen) für `<title>`; H1 und OG-Titel bleiben lang. Längster `<title>` jetzt 83 Zeichen inkl. „| Platzhirsch Home Living“.
- **P2 geprueft_am:** geklärt, siehe Punkt 4 unten.
- **P3 Kosovo:** im Schweiz-Artikel durch neutrale Beispiele (Italien/Deutschland) ersetzt.
- Offen (P3, nicht in diesem Lauf): Breadcrumb-Ellipse mobil, Hausnummer als Konstante, Markenliste gegen Backoffice, Cookie-Banner (global).
- Umgebung: Der Kompilierfehler `src/app/fehlerseite-global.preview/probe/fonts.js:11` gehört zu einem anderen Paket; zum Prüfzeitpunkt lieferte der Dev-Server wieder 200.
- Screenshots: `qa-screenshots/teamleiter/r1-R1-ratgeber/fix/` (4 URLs × 4 Geräte). 15 × 200. Bei Android/Sofa-Checkliste kam kein Status zurück, weil der Dev-Server durch parallele Pakete ausgelastet war. Einmal gab es horizontalen Überlauf (iPhone, Hub). Ursache ist ein „Termin“-Button im Header, der aus dem Bild ragt; der Header gehört zu Team 1, nicht zu R1. Die Konsolenfehler (Hydration, „state update … not mounted“, Ressourcen-Timeouts auf dem iPad) kommen aus Client-Komponenten der Shell und aus der Serverlast; der Ratgeber selbst hat keinen Client-Code. Seitentitel live per curl geprüft, keine Binni-Treffer im HTML.

## Offen vor Freigabe (pro Artikel)

1. Die [prüfen]-Stellen fachlich klären, siehe Prüfvermerke in `Marktresearch/content/ratgeber/*.md`. Bis dahin fehlen die betroffenen Sätze und Abschnitte auf der Seite, etwa Ausstellungsstand, Öffnungszeiten, Binni, Tax-Free-Abwicklung, Caesarstone-Link und die Hamilton-Zeile.
2. `reviewedBy` eintragen, dann `freigegeben: true` setzen. Erst danach werden die Seiten indexiert und `author` wird zu Person. Sitemap und llms.txt sollten dann `getIndexableRatgeber()` nutzen, das gehört zu einem anderen Paket.
3. Die Hausnummer „Landstraße 9“ steht in mehreren Artikeln. Sie muss nach der Entscheidung zur Firmenbuch-Adresse (Landstraße 11) angepasst werden.
4. `geprueft_am`: Gültig bei 5 Artikeln (Pflege, Sofa-Checkliste, Lieferzeiten, Outdoor, Designerküche). Kein gültiges Datum bei 3 Artikeln: `was-kostet-ein-minotti-sofa` (Platzhalter), `kuechenarbeitsplatte-marmor-keramik-quarz` und `moebel-aus-oesterreich-in-die-schweiz` (Feld fehlt, Fachprüfung offen). Dort zeigt die Seite nur „Stand“ (= `updatedAt`, bei allen 8 gesetzt). Die QA hatte `updatedAt` mit `geprueft_am` verwechselt; ein Test pinnt die 5 Artikel fest.
5. Die Markenlinks sind eine statische Allowlist in `src/lib/ratgeber/brands.js`. Sie wurde am 26.10.2026 per curl geprüft und muss erneut geprüft werden, wenn Markenseiten entfallen.
