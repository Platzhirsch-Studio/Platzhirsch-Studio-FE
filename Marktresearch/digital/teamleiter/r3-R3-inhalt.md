# R3-inhalt: News-Filter, Fallback-Rückbau, Karriere ohne react-share, Lead-Restliste

Stand: 26.10.2026, Runde 3, Branch `feature/neuauftritt`. Nichts wurde committet. Es gab keine echten Absendungen und keine Mails, und die Backoffice-Daten sind unverändert.

## Ergebnis

### 1. News aus dem Backoffice

Neues Modul `src/lib/news/newsCopy.js`. Es nutzt relative Imports, damit es mit `node --test` läuft. Dazu kommt `src/lib/news/package.json` mit `type: module`.

- **Rabatt-News:** `withheldNews.js` greift unverändert, über Slug, Titelmuster und das Schutznetz „bezifferter Rabatt/Statt-Preis“.
  - In der Liste und unter „Weitere Beiträge“ erscheinen sie nicht.
  - Die Detailseite bleibt erreichbar. Sie hat `noindex, follow`, zeigt nur „Diese Aktion ist beendet.“ und gibt kein `NewsArticle`-JSON-LD aus. Geprüft: kein „60 %“ und kein „47.520“ im HTML.
  - In `sitemap-news.xml` fehlen sie (e2e geprüft).
- **`presentNews(item)`** liefert die Anzeige-Kopie eines Beitrags. Händler-Aussagen und Superlative laufen über `sanitizeClaims` (`src/lib/legal`). Danach folgen die Wörter der Hausstimme:

  | Sprache | Ersetzung |
  |---|---|
  | DE | Luxus → Stil, luxuriös → hochwertig, exklusiv entfällt, Einzigartigkeit → Eigenständigkeit |
  | EN, FR, IT | entsprechend, mit Korrektur des Artikels (an→a, gli→i) |

  - Der Slug kommt immer aus dem Roh-Titel, URLs bleiben also gleich. Produkt- und Markennamen, die Datensatz-ID und die Keywords bleiben unberührt.
  - Absätze ohne Fund bleiben byte-gleich, auch das Leerzeichen vor dem Doppelpunkt im Französischen.
  - Eingebaut in Liste, Detail-H1, Text, Meta-Title/Description, JSON-LD und „Weitere Beiträge“.
  - Auf den echten Daten (31 Beiträge, 4 Sprachen) sinken die Treffer in den angezeigten Feldern auf 0. Übrig sind nur nicht ausgegebene Keywords.
- **Für R3-marken-seo (Sitemap):**
  - `newsSitemapEntries(items)` liefert `[{slug, path, lastModified}]`: nur aktive, nicht zurückgehaltene Beiträge mit Slug, ohne Doppelte.
  - `isIndexableNews(item)` prüft einen einzelnen Beitrag.
  - Heute filtert `sitemapEntries.js` schon gleichwertig über `isWithheldNews`. Die Umstellung ist optional und eine Zeile.

### 2. Fallback-Rückbau

- Per Skript und Test belegt: Alle 148 Schlüssel sind in allen 4 Sprachen vorhanden.
- Gelöscht sind `UberUns/inhalt/fallback.js` und `FALLBACK` in `NotFoundContent.js`.
- Nur die in R3 neuen Schlüssel (`inhalt.job.*`, `inhalt.share.*`) liest `proposalR3.js`. Die Datei ist aus `messages-r3-inhalt.json` generiert, ein Test prüft, dass beide gleich sind.

### 3. Karriere

Die Detailseite ist im Neuauftritt neu gebaut (`components/Karriere/JobDetail.js`, Server-Komponente).

- **Teilen** übernimmt `ShareJob.js`:
  - „Teilen …“ über die Web Share API, wo der Browser sie hat,
  - „Link kopieren“ mit Statusmeldung,
  - E-Mail-, WhatsApp- und LinkedIn-Links, die auch ohne JS funktionieren.
- **react-share:** Nur der Import ist entfernt, das Paket bleibt installiert.
- **P1 nebenbei:** Das alte Formular hat nichts gesendet und trotzdem „Vielen Dank für Ihre Bewerbung“ angezeigt. Ersetzt durch eine Bewerbung per E-Mail an den Ansprechpartner.

### 4. Lead-Restliste

- **P3-3:** Einheitlich „Zurück zur Merkliste“ (`forms.backToList`).
- **P3-4:** Das Präfix steht jetzt in der Sprache der Seite: „Enquiry about:“, „Demande concernant :“, „Richiesta su:“. Der Formular-Vertrag ist unverändert.
- Die neuen Formulartexte stehen in `FORM_TEXT_R3`. `FORM_TEXT` bleibt gleich `messages-r2-leads.json`.
- **P3-5:** Textvorschlag für `ContactSection.paragraphs[1]` im Gastgeber-Ton, liegt in `messages-r3-inhalt.json`.

### 5. Ratgeber, Adventsabend, Bewerten, 404

- Der obere Abstand stammte noch aus der Zeit des fixierten Headers (bis 224 px). Er ist jetzt angeglichen an den `PageHeader`.
- Ratgeber-Brotkrumen: „Startseite“ statt „Home“.
- Die Ratgeber bleiben `noindex`. Der Filter für [prüfen]-Stellen ist unverändert (Tests grün).
- Die 404-Seite liest ihre Texte aus den Messages (DE/FR per e2e geprüft).

## Dateien

| Bereich | Dateien |
|---|---|
| News | `src/lib/news/{newsCopy.js (neu), withheldNews.js (Import relativ), package.json (neu)}`, `src/components/News/news.js`, `src/app/[locale]/news/[title]/page.js` |
| Fallback-Rückbau | `src/components/UberUns/inhalt/{useInhalt.js, proposalR3.js (neu)}`, `fallback.js` gelöscht, `src/components/NotFound/NotFoundContent.js` |
| Karriere | `src/components/Karriere/{JobDetail.js (neu), ShareJob.js (neu), karriereposition.js}`, `src/app/[locale]/ueber-uns/karriere/[slug]/page.js`, `jobdetailsclient.js` gelöscht |
| Formulare | `src/lib/forms/i18n.js`, `src/components/AnfrageFormProduct/AnfrageFormProduct.js`, `src/components/BeratungClient/BeratungClient.js` |
| Feinschliff | `src/components/Ratgeber/{RatgeberHub.js, RatgeberArticle.js}`, `src/app/[locale]/{adventsabend,bewerten}/page.js` |
| Tests | `tests/unit/r3-inhalt.test.mjs` (neu, 12 Tests), `tests/unit/forms-leads.test.mjs` (Alias-Hook für `@/lib/site`, Merge-Prüfung nach R3-i18n), `tests/e2e/r3-inhalt.spec.js` (neu, 8 Tests) |
| Texte und Doku | `Marktresearch/digital/teamleiter/messages-r3-inhalt.json`, `Marktresearch/digital/redesign/inhaltsseiten.md` (Abschnitt R3) |

## Prüfung

- **Unit-Tests:** `node --test tests/unit/forms*.test.mjs tests/unit/ratgeber*.test.mjs tests/unit/r3-inhalt.test.mjs` ergibt 79 von 79 grün.
  - `forms-leads` war zu Beginn rot, aus zwei fremden Gründen:
    - R3-shell importiert in `Kontakt/copy.js` jetzt `@/lib/site`.
    - R3-i18n hat `messages-r2-leads.json` übernommen.
  - Der Test ist angepasst. Den Vertrag prüft er weiter.
- **e2e:** `npx playwright test tests/e2e/forms-leads.spec.js tests/e2e/r3-inhalt.spec.js --project=desktop` ergibt 11 + 8 grün. Alle POSTs waren abgefangen.
- **ESLint:** auf allen Paketdateien 0 Meldungen.
- **`npm run check:claims`:** 30 Funde, alle in `src/lib/data/**` (R3-produkt), keiner im Paket.
- **Screenshots:** `qa-screenshots/teamleiter/r3-R3-inhalt/selbst/` (10 URLs × 4 Geräte), dazu `selbst/nachlauf/` (8 URLs × 4, darunter eine zeitweilige Job-Vorschau, die wieder gelöscht ist) und `state-job-share-*.png`. Kein horizontaler Überlauf.
  - Im ersten Lauf lieferte Android dreimal 500, weil der Dev-Server gerade neu kompilierte. Im Nachlauf kamen alle mit 200.
  - Restliche Konsolenmeldungen kommen aus der Shell („state update … not mounted“ und ein WebKit-Hydration-Mismatch, `caret-color` bei R3-shell).

## Offene Punkte

1. **Startseiten-Teaser** (`fetchSlicedNewsData`, R3-startseite/`src/lib/api`): Rabatt-News sind schon gefiltert, die Texte noch nicht entschärft. Empfehlung: `.map(presentNews)`.
2. **R3-marken-seo:** `newsSitemapEntries` optional übernehmen (siehe 1.).
3. **Runde 4 (i18n):**
   - `messages-r3-inhalt.json` übernehmen (`inhalt.job`, `inhalt.share`, `forms.backToList`, `forms.productPrefix`, `ContactSection.paragraphs`). Danach `proposalR3.js` und `FORM_TEXT_R3` löschen.
   - Verwaist: `cart.wishlist`, `cart.noItemsHeadline` („Wunschliste“) und `enquiry.backToWishlist`.
4. **Beratung:** Die Auswahlwerte gehen weiterhin in der Sprache der Seite ans Backoffice (alt, notiert).
5. **Backoffice-Redaktion:** Die Bereinigungsliste in `inhaltsseiten.md` §9 gilt weiter. Der Filter ist eine Absicherung und ersetzt die Redaktion nicht.
6. Für die Job-Detailseite gibt es heute keine offene Stelle. Geprüft wurde sie per Vorschau, ein Prod-Lauf mit echten Daten steht aus.

## Nachbesserung nach QA-Feedback (26.10.2026)

Das Feedback (`qa-screenshots/teamleiter/r3-R3-inhalt/feedback.md`, Note 8,5) hatte keine P1- und keine P2-Punkte. Kleine P3-Punkte im Paket sind behoben:

| P3 | Änderung |
|---|---|
| 2 Brotkrumen | `/kontakt` nimmt die Bezeichnung aus `inhalt.common.home` („Startseite“, FR „Accueil“), sichtbar und im JSON-LD. `/de/adventsabend` hat jetzt sichtbare Brotkrumen „Startseite / Adventsabend“, das JSON-LD sagt ebenfalls „Startseite“. |
| 3 Titel zurückgehaltener News | `<title>`, `og:title` und `twitter:title` lauten neutral „Beendete Aktion \| Platzhirsch Home Living“ (EN, FR, IT entsprechend). |
| 4 Presse-Cover | Die Bilder sind Titelseiten von circe-Ausgaben, zwei Beiträge teilen sich jeweils eine Ausgabe. Der Alt-Text „Seite aus dem Beitrag …“ war deshalb falsch. Das Cover ist jetzt dekorativ (`alt=""`), den Beitrag nennt die sichtbare `figcaption`. |
| 7 EN-Meta `/en/news` | Ersatztext sachlich: „… Current design trends and news from our studio in Lochau.“ |
| Nebenbei | Bei unbekanntem News-Slug schreibt `generateMetadata` keinen Konsolenfehler mehr (404 bleibt). |

**Prüfung:**
- `qa-screenshots/teamleiter/r3-R3-inhalt/fix/` (+ `fix/withheld/`): 7 URLs × 4 Geräte, alle mit Status 200, ohne Überlauf und ohne Konsolenfehler.
- curl: zurückgehaltene News mit `noindex, follow` und neutralem Titel, unbekannter Slug liefert 404.
- Unit-Tests: 79 von 79 grün.

**Offen (nicht im Paket lösbar):**
- P3-1: Konsolenfehler im Dev-Server/HMR, beim Produktions-Build durch den Integrator prüfen.
- P3-5: Kontakt-Text kommt in Runde 4.
- P3-6: Ansprechpartner Helmut Schuster und „faire Bezahlung“ muss die Geschäftsführung bestätigen.
- P3-8: Job-Detail erst mit einer echten Stelle prüfbar.
- P3-9: liegt bei R3-startseite.
