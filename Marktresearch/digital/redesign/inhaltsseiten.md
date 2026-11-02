# Paket „Inhaltsseiten“: Über uns, Team, Partner, Presse, News, Karriere, Rechtliches, Newsletter, 404, Beratung

**Stand:** 26.10.2026, Runde 3 (R3-inhalt, siehe Abschnitt R3), davor nach QA-Runde 1 (Note 6/10, `qa-screenshots/neuauftritt/inhaltsseiten/feedback.md`) überarbeitet, siehe §0 · **Branch:** feature/neuauftritt (nicht committet) · **Grundlage:** Design-Bibel (§1, §2, §4–§6, §10.2, §11, §14, §17), Jury-Urteil §3, UWG-Audit `recht/03-uwg-werbe-audit.md` (P1–P3), Fundament-Bausteine `@/components/ui`.

## 0. Runde 2: Umsetzung des QA-Feedbacks

Prüfung danach: `qa-screenshots/neuauftritt/inhaltsseiten/fix/` (shoot.mjs, 5 Seiten × 4 Geräte, alle 200) plus eigene Messung (Chromium 1440 × 900 und 1194 × 834, WebKit 375 × 812, 10 Seiten): kein Überlauf bei 375 px, auf allen Seiten genau eine H1. Die CMS-Textfunde stehen in `fix/news-copy-scan.txt`.

| QA | Status | Umsetzung |
|---|---|---|
| P1-1 H1 unter der Falz | behoben | `PageHeader.js`: `lg:items-start`, Bild `lg:max-h-[min(600px,calc(100svh-220px))]`, oberer Abstand `lg:pt-16`. Gemessen bei 1440 × 900: H1-Oberkante überall 229 px, Lead-Ende ≤ 569 px, „Anfrage starten“ endet bei 594 px. iPad quer: H1 201 px, Knopf 537 px. |
| P1-2 Ersatzfoto im Team | behoben | `Team/portraits.js`: Ein Bild, das mehrere aktive Personen teilen, gilt nicht als Porträt. Dann erscheint `PortraitTile` (Stone, 4:5, Initialen in Bodoni display-l, `aria-hidden`), der Name bleibt die H3. Betrifft heute Andreas Wegscheider, Harald Menghin und Stefan Wöginger. **Porträt-Shooting dieser drei ist Launch-Muss** (§8). Sobald eigene Porträts im Backoffice liegen, erscheinen sie automatisch. |
| P2-1 H1-Umbruch | behoben | H1 `hyphens-manual`, `text-pretty`. `hyphenateTitle()` setzt weiche Trennstellen an Kompositafugen (Einrichtungs-, Designer-, Datenschutz-, Wohn-) und bindet „–“ an das Wort davor. Textspalte ab xl `col-span-7` (Bild bleibt in 8–12). Desktop: keine Trennung mehr („Einrichtungsberatung in Lochau“ zweizeilig ohne Strich, „Einrichtungsstudio“ ganz). Auf dem iPhone trennt WebKit sauber „Einrichtungs-/beratung“. |
| P2-2 „exklusiv“ in Metadaten | behoben (Paket) | Team, Partner, Presse, Karriere, Beratung: eigene, sachliche Description in 4 Sprachen gewinnt über das CMS (das CMS liefert weiter Titel, OG-Bild und Typ). Die WebPage-JSON-LD nutzt dieselbe Description. Über uns: „exklusive Designermöbel“ ersetzt. Newsletter: Titel (EN/FR/IT), Description und OG ohne „Exklusiv“ und „Rabatte“. News-Detail: Fallback-Description ohne „exklusives Design“. URLs, Canonicals, hreflang und Titel unverändert. **Offen (global, nicht Paket):** LocalBusiness-Text in `[locale]/layout.js`, siehe §7. |
| P2-3 Werbesprache in CMS-News | gemeldet, Liste in §9 | Nicht still umgeschrieben. `News/copyCheck.js` prüft im Dev-Server einmal pro Prozess alle öffentlichen Beiträge mit `findClaims` und zusätzlich auf exklusiv, Luxus, luxuriös, perfekt, Traum… und einzigartig. Die Fundstellen erscheinen als `[news-copy]` in der Konsole. Die Bereinigungsliste fürs Backoffice steht in §9. |
| P2-4 „Gastgeber, nicht Händler“ | behoben | `inhalt.about.lead` (4 Sprachen): „Ausstellung und Café unter einem Dach, an der Landstraße in Lochau. Bei uns nehmen Sie zuerst Platz – im Café oder auf dem Sofa, das Sie interessiert.“ |
| P2-5 Bilder ohne Menschen, Dubletten | behoben | Team-Kopf: erstes eigenes Porträt aus dem CMS (heute Susanne Messmer, Ausschnitt oben). Ohne Porträt erscheint die Showroom-Totale. Über-uns-Teaser „Die Menschen im Haus“: zweites Porträt (heute Kerstin Gander) statt der Küche. Karriere: „Arbeiten bei uns“ zeigt `unique-workplace.jpg` statt des Schreibtischs aus dem Kopf. Rollen: Fallback `inhalt.team.roles` nach Namen, wenn `member.role` leer ist. Belegt sind nur die beiden Geschäftsführer (Firmenbuch). Die übrigen Rollen sind nicht erfunden, siehe §7. |
| P2-6 Partner | behoben bzw. offen (Recht) | Eigene Einheiten (`own: true`): neues Monogramm und Wortmarke in Ink (`currentColor`) statt des goldenen Hirschkopfs. „SM Immobilienverwaltung GmbH“ zeigt keine Platzhirsch-Telefonnummer und -E-Mail mehr, nur Name und Adresse. Ob SM oder MW richtig ist, klärt der Kunde, siehe §7. |
| P2-7 404 in Versalien | behoben | `NotFoundContent.js`: Solange `error404.eyebrow` in den messages fehlt (keine Integration), gelten für die geänderten Schlüssel (eyebrow, headline, backHome, browseBrands, contact, linksTitle) die Vorschlagswerte. Geprüft: „Zur Startseite“, „Vers l’accueil“. |
| P2-8 Newsletter-Fehler | behoben | Fehlermeldung direkt unter dem Feld, vor dem Knopf, mit `AlertCircle` (16 px, `aria-hidden`). `aria-describedby` und Fokus zurück aufs Feld bleiben. Geprüft auf WebKit 375 px. `trackEvent("sign_up", …)` ist unverändert. |
| P2-9 Fremde Bausteine | gemeldet | Offen bei BeratungClient und ConsentEmbed, siehe §7. |
| P2-10 Galerie Über uns mobil | behoben | Unter lg zwei 4:5-Bilder nebeneinander und das dritte quer in 3:2, ab lg drei Spalten. Auf 375 px ist die Bildstrecke rund 460 px statt 1.250 px hoch. |
| Hinweis „Sommer-Inspiration“ | behoben | In `WITHHELD_NEWS` aufgenommen (Slug und Titelmuster): `noindex, follow`, Hinweis „Diese Aktion ist beendet.“, nicht in Liste, Teasern und Sitemap. Geprüft: 28 statt 29 Beiträge, 0 Treffer in `sitemap-news.xml`. |
| P3-2 Öffnungszeiten | behoben | Format wie im Footer: „10:00–18:00“ in Tabelle und Schluss-CTA, alle 4 Sprachen. |
| P3-3 Brotkrumen | teilweise | Letztes Glied gekürzt: Karriere „Karriere“, News-Detail „Beitrag“. **Offen:** Die Linkhöhe 24 px (`min-h-6`) steckt in `ui/Breadcrumbs.js` (Fundament). |
| P3-5 News-Titel in Versalien | behoben (Anzeige) | `News/displayTitle.js`: Wörter aus 4 oder mehr Großbuchstaben erscheinen in üblicher Schreibung, Markennamen nach `KNOWN_BRANDS` („ClassiCon“, „Tréca“, „next125“). Das gilt für Liste, Detail-H1 und „Weitere Beiträge“. Slug, `<title>` und JSON-LD bleiben wie im CMS. |
| P3-6 Leerraum zurückgehaltene News | behoben | Kopf ohne Bild: `pb-4 md:pb-6`. |
| P3-7 Leerraum vor Team-Teaser | behoben | Team-Teaser `pt-0!`, weil die Fläche dieselbe ist wie beim Besuchsblock. |
| P3-8 BreadcrumbList Über uns | behoben | `PageHeader breadcrumbSchema` → `Breadcrumbs schema`. |
| P3-9 `<title>` News-Detail | behoben | Beim Kürzen fallen Komma, Strich und Doppelpunkt am Ende weg („Küchenkonzepte mit MCR, BORA \| …“). |
| P3-10 Doku Gold-Nummern | präzisiert | Die Schrittnummern bei Beratung sind `text-accent` (brass-700 auf Hell, zulässig). Es gibt keine goldenen Badges oder Flächen. |
| P3-1, P3-4, P3-11, P3-12 | offen | Kerning (Fundament), Presse-Cover, Header-Paket, LCP nach dem Build, siehe §7. |

## R3 (Runde 3, R3-inhalt): News-Filter, Fallback-Rückbau, Karriere, Lead-Restliste

Bericht: `Marktresearch/digital/teamleiter/r3-R3-inhalt.md`. Kurzfassung:

- **News, eine Quelle:** `src/lib/news/newsCopy.js`. `presentNews(item)` liefert die Anzeige-Kopie eines Backoffice-Beitrags: Händler-Claims und Superlative über `sanitizeClaims` (`src/lib/legal`), dazu Hausstimme („Luxus“ → „Stil“, „luxuriös“ → „hochwertig“, „exklusiv“ entfällt, „Einzigartigkeit“ → „Eigenständigkeit“; EN/FR/IT entsprechend). Slug immer aus dem Roh-Titel, URLs bleiben. Rabatt-News bleiben zurückgehalten (`withheldNews.js`, §2). `newsSitemapEntries(items)` und `isIndexableNews(item)` sind das Angebot an R3-marken-seo für `sitemap-news.xml`. Die Backoffice-Daten bleiben unverändert, die Bereinigungsliste (§9) gilt weiter.
- **Fallback-Rückbau:** `UberUns/inhalt/fallback.js` (148 Schlüssel) und `FALLBACK` in `NotFoundContent.js` sind gelöscht. Alle Schlüssel liegen in allen 4 Sprachen in `src/messages` (Test `tests/unit/r3-inhalt.test.mjs`). Nur die in R3 neuen Schlüssel (`inhalt.job.*`, `inhalt.share.*`) kommen bis zur Übernahme aus `UberUns/inhalt/proposalR3.js`, generiert aus `messages-r3-inhalt.json`.
- **Karriere-Detail:** neu im Neuauftritt (`components/Karriere/JobDetail.js`, Server). Teilen über Web Share API, „Link kopieren“ und einfache Links (`ShareJob.js`), ohne `react-share`. Das alte Bewerbungsformular hat nichts gesendet und trotzdem „Vielen Dank für Ihre Bewerbung“ gezeigt; es ist ersetzt durch Bewerbung per E-Mail.

## 1. Was sich geändert hat (Runde 1)

- **Neues Seitengerüst für alle Inhaltsseiten:** Die Seiten beginnen mit einem hellen Kopf (`UberUns/PageHeader.js`). Er enthält Brotkrumen, Overline, die einzige H1 in Bodoni (display-l), einen Lead und rechts ein Foto als LCP-Bild mit `preload`. Text steht neben dem Bild, nie darauf. Das Raster ist asymmetrisch: Text in den Spalten 2–6, Bild in 8–12. Mobil folgt das Bild im Format 3:2 direkt auf den Text.
- Der alte Foto-Banner (`Reusable/singlePageSlider`), Slick-Slider, Gold-Buttons, Radien, Schatten und Blur-Animationen sind auf diesen Seiten entfallen.
- **Server-first:** Alle Paketkomponenten sind Server Components, die Inhalte stehen im HTML. Client-Inseln gibt es nur noch für:
  - `News/NewsMore.js`: „Weitere Beiträge anzeigen“. Alle Karten stehen im HTML, der Fokus springt auf die erste neue Karte.
  - `Newsletter/newsletter.js`: das Formular.
  - `NotFound/NotFoundContent.js`: bleibt Client, weil der globale 404 nur `error404` lädt.
  - `ConsentEmbed`: die Street-View-Ansicht, fremdes Paket und unverändert.
- **Flächen:** pro Seite Surface, Band und Raised. Es gibt **keine Walnut-Fläche**, weil der alte Footer noch dunkel ist. Es gibt höchstens einen `primary`-Knopf pro Ansicht. Der Leitsatz „Nehmen Sie Platz.“ steht höchstens einmal pro Seite im Schluss-CTA.
- **Seiten im Einzelnen:**
  - **Über uns / Das Haus:**
    - Intro mit H2 „Ihr Einrichtungsstudio für Designermöbel in Vorarlberg“, die SEO-Begriffe bleiben erhalten.
    - Abschnitt „Erst ein Kaffee. Dann das Sofa.“: Showroom und Café, Marken nur „gezeigt“.
    - Abschnitt „Besuch“: Öffnungszeiten als `<dl>` (identisch zum LocalBusiness-JSON-LD), Adresse und Kontakt aus `lib/site.js`, Route, 360°-Ansicht hinter dem Consent.
    - Team-Teaser und Schluss-CTA.
    - Logo-Slider von Herstellern entfernt (kein Herstellerlogo als Siegel).
  - **Team:** Porträts 4:5, Name als H3, Rolle und ein sichtbarer Mail-Link (44 px). Hover-Zoom und Overlay entfallen.
  - **Partner:** Logo-Kachel auf Bone, `<address>`, Links mit Beschriftung und Hinweis „neuer Tab“. Das Café bekommt die Rolle „Das Café im Haus“.
  - **Presse:**
    - Pressekontakt (E-Mail und Telefon aus `lib/site.js`).
    - Titel der Beiträge sichtbar als `figcaption`. Bisher erschienen sie nur bei Hover, also nicht für Touch und Screenreader.
  - **News:**
    - Karten (`Card`) mit 3:2-Bild und Auszug von 160 Zeichen.
    - Detailseite: Kopf, Leadbild 21:9, Text auf 68 Zeichen Zeilenbreite.
    - Herstellerbilder der Produkte werden **unbeschnitten** (`fit="contain"`) gezeigt, Marke als Overline und Link zur Markenseite.
    - Darunter „Weitere Beiträge“ und der CTA.
  - **Karriere:**
    - Stellen als Zeilen mit Fakten-`<dl>` (Ort, Anstellung, Stellen, Gehalt, Datum).
    - Ansprechperson mit Foto und Namen.
    - **Entfernt:** die Badges „+15 % Bewerberzahl“ und „#1 Arbeitgeberregion“ (Superlativ und unbelegt) sowie „über 35 Premium-Marken“.
  - **Impressum und Datenschutz:**
    - Nur Gestaltung: Textkopf ohne Foto, `LegalProse` (18 px, 68 Zeichen, Links in Ink).
    - **Wortlaut unverändert**, per Textvergleich mit HEAD geprüft.
    - Die doppelte H2 („Impressum“ bzw. „Datenschutz“ unter der gleichlautenden H1) ist entfallen. Die H3 wurden zu H2.
  - **Newsletter:**
    - Sichtbares Label, `autocomplete`, Fehler am Feld, Fokus zurück aufs Feld, Statusmeldung.
    - `trackEvent("sign_up", { method: "newsletter" })` ist unverändert erhalten.
    - „Rabatte nur für Abonnenten“ ersetzt durch „Hinweise auf Aktionen im Showroom“ (Audit P3).
  - **Beratung:**
    - Kopf mit Sprung „Anfrage starten“, danach direkt das Formular. `BeratungClient` ist ein fremdes Paket und unverändert, es steht in `#anfrage`.
    - Danach die sieben Schritte als `<ol>`, typografisch, ohne Stockfotos. Die Nummern stehen in `text-accent` (brass-700 auf Hell, zulässig), ohne goldene Badges.
    - „Trauminterieur“ entfernt.
  - **404:** helle Fläche, Text neben dem Bild, ein Primärknopf, drei Wege. Gilt für `[locale]/not-found` und den globalen 404.

## 2. UWG-Sofortmaßnahme: Rabatt-News (zentral)

Die Logik liegt zentral in **`src/lib/news/withheldNews.js`**: `isWithheldNews(item)` und `publicNews(items)`. Ein Beitrag gilt als zurückgehalten, wenn eine der folgenden Regeln greift:

1. Der Slug steht auf der Liste:
   - `platzhirsch-lagerabverkauf-kuechen-betten-und-sofas` (Audit P1: „bis zu 60 %“, „statt € 47.520,- um € 27.000,-“)
   - `sortimentswechsel-stuehle-sessel-und-accessoires` (Audit P2)
   - Beide sind vom 14.01.2025.
2. Das Titelmuster „Lagerabverkauf“ oder „Sortimentswechsel“ trifft zusammen mit dem Monat 2025-01 zu. Das greift auch dann, wenn der Titel im Backoffice leicht geändert wird.
3. **Schutznetz:** Der Beitrag enthält in irgendeinem Feld oder irgendeiner Sprache einen bezifferten Rabatt („60 % reduziert“, „up to 60% off“ …) oder einen Statt-Preis. Freigeben lässt sich ein solcher Beitrag nur über `ALLOWED_SLUGS`, nachdem der 30-Tage-Tiefstpreis ergänzt ist.

Die Logik wirkt an folgenden Stellen:

| Ort | Wirkung |
|---|---|
| `/news` (`News/news.js`) | nicht gelistet (29 statt 31 Beiträge, geprüft) |
| „Weitere Beiträge“ auf Detailseiten | ausgeschlossen |
| Startseiten-Teaser (`fetchSlicedNewsData`) | ausgeschlossen |
| `sitemap-news.xml` und lastmod des News-Hubs (`sitemapEntries.js`) | nicht enthalten (geprüft: 0 Treffer) |
| Detailseite | Die URL bleibt erreichbar (keine 404 für alte Links). `robots: noindex, follow` ist geprüft. Die Meta-Description lautet „Diese Aktion … ist beendet.“ Es gibt kein `NewsArticle`-JSON-LD, nur `BreadcrumbList`. **Der Text mit Preisen wird nicht gerendert**, sondern nur der Hinweis „Diese Aktion ist beendet.“ mit einem Link zur Übersicht (geprüft: kein „60 %“ und kein „47.520“ im HTML) |

Geprüft habe ich alle 31 DE-Beiträge: Nur die beiden Beiträge oben enthalten Prozent- oder Statt-Preise. `sommer-inspiration-fuer-ihren-aussenbereich` kündigt einen „Lagerverkauf … zu stark reduzierten Preisen“ an, ohne Zahl. Er ist **nicht** zurückgehalten, siehe offene Punkte.

## 3. SEO

- URLs, Canonicals, hreflang, `generateMetadata` und JSON-LD der Seiten sind unverändert. Die einzige Ausnahme sind die zurückgehaltenen News (siehe §2).
- Jede Seite hat genau eine H1, eine saubere H2/H3-Gliederung und die Brotkrumen als `nav` (ohne zweites BreadcrumbList, weil die Seiten eins ausgeben).
- Die H1 der Seiten:
  - Über uns: unverändert, beschreibend.
  - Team: „Unser Team in Lochau“.
  - Partner: „Unsere Partner“.
  - Karriere: „Karriere bei Platzhirsch Home Living“.
  - Beratung: „Einrichtungsberatung in Lochau“.
- Neu indexierbare Inhalte: Öffnungszeiten, Adresse, Pressekontakt und die Prozessschritte als Text.
- Aufgeräumt: In den `page.js` habe ich die unbenutzten Banner-Variablen entfernt.

## 4. Texte (messages)

- Der Vorschlag liegt in **`messages-inhaltsseiten.json`**, alle 4 Sprachen. Er enthält:
  - den neuen Namespace `inhalt.*` (common, about, team, partner, press, news, career, legal, newsletter, beratung),
  - geänderte und neue Schlüssel in `error404` (eyebrow, headline, backHome, browseBrands, contact, linksTitle).
- Bis zur Integration liest `UberUns/inhalt/useInhalt.js` den Text per `t.has()` aus den messages, sonst aus der **generierten** Datei `UberUns/inhalt/fallback.js`. Die Datei hat denselben Inhalt wie das JSON, ist server-only und wird nicht ausgeliefert.
- Nach der Übernahme:
  1. `fallback.js` löschen.
  2. Den Fallback-Zweig in `useInhalt.js` entfernen.
  3. In `NotFoundContent.js` die Konstante `FALLBACK` entfernen.
- Das Regenerieren besorgt ein kleiner Node-Einzeiler: JSON → `FALLBACK`-Objekt, nur `inhalt` je Sprache.
- Alte Schlüssel, die weiter gelesen werden:
  - `partners.<n>.role`
  - `presse.magazines`
  - `newsletter.err*`
  - `error404.*`
- Diese alten Namespaces werden nicht mehr gelesen. Löschen ist erst nach der Integration und einer Suche im ganzen Repo sinnvoll:
  - `about`
  - `TeamSection`, `TeamClient`
  - `Press`, `news`, `article`
  - `KarriereTeam`, `KarrierePosition`
  - `newsletter-banner`, die Texte in `newsletter`
  - `FeaturesSection`
- `findClaims` (`src/lib/legal/claims.js`) meldet für den Vorschlag 0 Treffer.

## 5. Dateien

**Geänderte und neue Paketdateien:**

- `src/components/UberUns/{uberuns.js, austellung.js, PageHeader.js, inhalt/useInhalt.js, inhalt/fallback.js}`
- `src/components/Team/{team.js, teammember.js, portraits.js (neu R2)}`
- `src/components/News/{displayTitle.js, copyCheck.js}` (neu R2)
- `src/components/Partner/partner.js`
- `src/components/Presse/{presse.js, pressearticle.js}`
- `src/components/News/{news.js, NewsMore.js}`
- `src/components/NewsItem/{newsItemBanner.js, newsitem.js}`
- `src/components/Karriere/{karriere.js, karriereposition.js}`; `jobPostingJsonLd.js` ist unverändert
- `src/components/Impressum/{impressum.js, impressumbanner.js, LegalProse.js}`
- `src/components/Datenschutz/{datenschutz.js, datenbanner.js}`
- `src/components/Newsletter/{newsletter.js, newsletterbanner.js, NewsletterContent.js}`
- `src/components/NotFound/NotFoundContent.js`
- `src/components/Beratung/advice.js`

**Komposition (`page.js`):**

- `ueber-uns/{platzhirsch, team, partner, presse, karriere}`
- `news`, `news/[title]` (zusätzlich noindex-Logik)
- `beratung`, `newsletter` (Import)
- R2: Descriptions und JSON-LD-Description ohne „exklusiv“ (Team, Partner, Presse, Karriere, Beratung, Über uns), Newsletter-Metadaten ohne „Rabatte“, Team-Daten an Team-Kopf und Über-uns-Teaser, News-Detail mit Titelkürzung und Fallback-Description

**UWG, zentral:**

- `src/lib/news/withheldNews.js` (neu)
- minimal in `src/lib/seo/sitemapEntries.js` und `src/lib/api/fetchNewsData.js`

## 6. Prüfung

- `qa-screenshots/neuauftritt/inhaltsseiten/selbsttest/` (iPhone, Android, iPad, Desktop und Report): Alle 5 Seiten liefern 200, es gibt keinen Überlauf bei 375 px.
- Der Fehler „duplicate key“ im Team ist behoben. Grund waren gleiche E-Mail-Adressen im Backoffice, der Key enthält jetzt den Index.
- Die Konsolenmeldung „state update on a component that hasn't mounted“ stammt nicht aus dem Paket (Header oder Consent).
- ESLint für alle Paketdateien: 0 Fehler. `newsletter/page.js` hat eine alte Warnung zu `BASE_URL`, die ich nicht angefasst habe.

## 7. Offene Punkte

0. **Neu aus Runde 2 (an Kunde, Recht, Integration und fremde Pakete):**
   - **Kunde/Recht:** Heißt der Partner „SM Immobilienverwaltung GmbH“ oder „MW Immobilienverwaltungs GmbH“ (Impressum, Firmenbuch: MW)? Ist er überhaupt ein Partner oder der eigene Rechtsträger? Bis zur Klärung steht er ohne Telefon und E-Mail. Danach den Eintrag in `Partner/partner.js` korrigieren oder entfernen.
   - **Kunde:** Rollen von Harald Menghin, Stefan Wöginger und Kerstin Gander. Danach im Backoffice (`positionsart`) oder in `inhalt.team.roles` eintragen. Ich habe keine Rollen erfunden. Zur Freigabe vorgeschlagen ist nur „Geschäftsführung“ für Susanne Messmer und Andreas Wegscheider (Firmenbuch).
   - **Launch-Muss:** Porträts von Andreas Wegscheider, Harald Menghin und Stefan Wöginger (4:5, Stone `#ece8e1`). Im Backoffice zeigen alle drei auf `/files/andreas.jpg`, eine Showroom-Aufnahme mit Minotti-Schild.
   - **Integration („Recht & Texte“):** globaler LocalBusiness-Text in `src/app/[locale]/layout.js` („für exklusive Designmöbel“, „Möbel führender Marken“). Vorschlag: „Einrichtungsstudio mit Café in Lochau (Vorarlberg): Designermöbel, Küchen, Interior Design und persönliche Einrichtungsberatung, unter anderem mit Minotti, Poliform und Rimadesio.“
   - **Backoffice-Redaktion:** CMS-News bereinigen (§9). Auch die CMS-Keyword-Descriptions von Team, Partner und Presse enthalten „exklusiv“. Sie werden nicht mehr ausgeliefert, sollten aber trotzdem korrigiert werden.
   - **BeratungClient (Formular-Team):** Karten mit `rounded-xl` und Schatten, goldene Icons auf Hell, H2 „ANFRAGE“ als Overline-Text.
   - **ConsentEmbed (Consent-Paket):** Knopf „KARTE LADEN“ in Versalien mit 3 px Radius. **Weißer Fokusring auf hellem Grund**, der Tastaturfokus ist damit unsichtbar (WCAG 2.4.7/2.4.13).
   - **Fundament:** Brotkrumen-Links sind 24 px hoch (`ui/Breadcrumbs.js`, die Bibel verlangt 44 px). Beim Bodoni-Kerning („W er“, „N ehmen“) prüfen, ob das `next/font`-Subset die GPOS-Tabelle behält.
   - **Header-Paket:** den Überlauf von 14 px bei 375 px aus QA-Lauf 1 gegenprüfen (in meinem Lauf: `scrollWidth` 375 auf allen 10 Seiten). Die mobile CTA-Leiste erscheint sofort statt erst nach dem Inhalts-CTA.
   - **Presse (P3-4):** mag12 und mag14 sind je zweimal vergeben. Magazin, Ausgabe und Jahr fehlen in den Daten (`presse.magazines`). Beides braucht Angaben des Kunden.
   - **News (P3-5):** Archiv-Kennzeichnung alter Beiträge und echte `?page=`-Links sind nicht umgesetzt, weil die Datumsangaben im CMS unzuverlässig sind (Punkt 3).
   - **LCP:** nach dem Build mit Lighthouse mobil messen, Ziel ≤ 2,0 s. Der Team-Kopf lädt jetzt ein CMS-Porträt als LCP-Bild (`preload`).
1. **Integration:** `messages-inhaltsseiten.json` in `src/messages/*.json` übernehmen (Paket „Recht & Texte“). R2 hat dort geändert bzw. ergänzt: `about.lead`, `about.teamPortraitAlt` (neu), `about.teamAlt` (entfernt), `team.heroAlt`, `team.heroPortraitAlt` (neu), `team.roles` (neu), `career.breadcrumb` (neu), `career.introAlt`, `news.articleCrumb` (neu), `common.hours` und `common.closingText` (Zeitformat). `fallback.js` ist neu generiert, `findClaims` meldet 0 Treffer.
2. **Rechtstexte:**
   - Im Impressum stehen „einzigartige Wohnkonzepte“ und „Wohnträume“, im Datenschutz „Privacy Shield“ (ungültig) und „TKG 2003“.
   - Ich habe sie bewusst nicht geändert, sie gehen ans Paket „Recht & Texte“ und an die Freigabe.
   - Die Adresse „Landstraße 9“ und „9/11“ ist noch offen.
3. **News:**
   - `sommer-inspiration-fuer-ihren-aussenbereich` (Lagerverkauf „zu stark reduzierten Preisen“, „Exklusivität“) ist seit R2 zurückgehalten. Freigabe erst nach rechtlicher Prüfung, dann den Eintrag aus `WITHHELD_NEWS` entfernen.
   - Besser wäre ein Backoffice-Feld „beendet“.
   - Die Daten der Beiträge (viele mit 14.01.2025) sind unzuverlässig, deshalb zeigt die Liste weiterhin kein Datum.
4. **Newsletter-Metadaten:** in R2 erledigt (§0, P2-2).
5. **Dark Footer:** Solange der Footer `bg-ink-deep` ist, nutzt keine Inhaltsseite Walnut. Mit hellem Footer kann „Showroom & Café“ auf „Über uns“ das eine Walnut-Kapitel werden (Bühne-Stimmung, Jury §3.3).
6. **Öffnungszeiten:**
   - Der heutige Tag ist nicht hervorgehoben (ISR-Cache, Bibel §10.2). Lösung: gecachte Komponente nach §12.1 oder eine Inline-Insel unter 1 KB.
   - Café-Zeiten fehlen.
7. **`PageHeader`, `LegalProse`, `useInhalt`** gehören langfristig nach `components/patterns/` (Bibel §9).
8. **Karriere:** Name und Rolle „Helmut Schuster, Ansprechpartner für Bewerbungen“ habe ich aus der bisherigen Bewerbungsadresse abgeleitet. Bitte bestätigen und die Einwilligung für das Foto prüfen.

## 8. Benötigte Bilder (Shotliste §7, eigene Fotos, Bildregister)

| Seite | Motiv | Format |
|---|---|---|
| Über uns, Kopf | Showroom-Totale Lochau im Seelicht (S01/S02) | 4:5 und 3:2 |
| Über uns, Showroom & Café | Durchblick Café → Showroom, Hände mit Tasse, Gastgeberin am Tresen | 4:5 (3 Stück) |
| Über uns und Team | Team am Tisch, Planung mit Mustern | 3:2 und 4:5 |
| Team | **Launch-Muss:** Einzelporträts von Andreas Wegscheider, Harald Menghin und Stefan Wöginger mit direktem Blick, auf Stone `#ece8e1`. Ein Gruppenbild ersetzt danach das Einzelporträt im Team-Kopf, das heute auch im Raster steht | 4:5 |
| Karriere | Arbeitssituation im Studio, Porträt der Ansprechperson | 4:5 und 1:1 |
| Partner | Projektfoto mit Partnern (Baustelle oder Montage, mit Einwilligung) | 3:2 |
| Presse | Pressebild Haus und Fassade, zum Download | 3:2 |
| Newsletter und Beratung | eigenes Abendbild Terrasse und Planungsgespräch statt Herstellerbild (Minotti, Eichholtz) | 3:2 und 4:5 |
| 404 | eigene Vignette statt `minotti-sofas.webp` | 4:5 |

Alle heute genutzten Bilder sind Bestand. Für Herstellerbilder (unter anderem `download.jpg`, `minotti-patio.jpg`, `tomdixon.webp`) fehlt der Nachweis im Bildregister. Die Alt-Texte beschreiben das Motiv und behaupten keinen Ort.

## 9. Bereinigungsliste CMS-News (Backoffice: nur Titel und Texte, Slugs bleiben)

Die vollständige Fundliste aller öffentlichen Beiträge steht in `qa-screenshots/neuauftritt/inhaltsseiten/fix/news-copy-scan.txt`. Der Dev-Server meldet die Funde zusätzlich als `[news-copy]`. Vorrang haben die Funde aus QA P2-3 sowie „Luxus“, „führend“ und „weltbekannt“.

| Beitrag (Slug) | Feld | alt | neu (Vorschlag) |
|---|---|---|---|
| minotti-exklusives-moebeldesign-fuer-draussen | Titel (name1, alle Sprachen) | MINOTTI – Exklusives Möbeldesign für Draußen | Minotti – Möbeldesign für draußen |
| minotti-exklusives-moebeldesign-fuer-draussen | Beschreibung | Genießen Sie den Luxus des MINOTTI-Designs nicht nur in Ihrem Zuhause, sondern auch im Freien. Mit der exklusiven Kollektion an Outdoor-Möbeln … | Minotti-Design gibt es auch für draußen. Mit der Outdoor-Kollektion … |
| minotti-exklusives-moebeldesign-fuer-draussen | Text und Meta | … zu einem luxuriösen Rückzugsort machen. / Luxuriös, wetterfest und stilvoll … | … zu einem Rückzugsort machen. / Wetterfest, für Garten, Terrasse und Außenbereich. |
| kuechenkonzepte-mit-mcr-bora-next125-und-frost | Beschreibung | die einzigartigen Küchengeräte von Bora | die Küchengeräte von Bora |
| kuechenkonzepte-mit-mcr-bora-next125-und-frost | Beschreibung | Freuen Sie sich auf exklusive Einblicke … in perfekter Balance stehen. | Freuen Sie sich auf Einblicke … ausgewogen zusammenkommen. |
| kuechenkonzepte-mit-mcr-bora-next125-und-frost | Artikeltext | durch ihre Einzigartigkeit und Eleganz / Dieses exklusive Duo | durch ihre Eigenständigkeit und Eleganz / Dieses Duo |
| kuechenkonzepte-mit-mcr-bora-next125-und-frost | Meta-Description | … in Ihrer Traumküche. | … in Ihrer Küche. |
| minotti-flos-alonpi-fuer-ihr-wohnzimmer | Beschreibung, Text, Meta | die einzigartigen Cashmere-Decken / luxuriöser Handwerkskunst / perfekte Symbiose / exklusive ALONPI Cashmere-Decken | die Cashmere-Decken / sorgfältiger Handwerkskunst / Verbindung / Cashmere-Decken von Alonpi |
| salone-del-mobile-2024-outdoor | Beschreibung und Meta | stellen exklusive Gartenmöbel von SOLPURI vor / exklusive Outdoor-Möbel | stellen Gartenmöbel von Solpuri vor / Outdoor-Möbel |
| platzhirsch-home-living-grand-opening | Beschreibung und Meta | Eröffnung des exklusiven Möbelhauses / mit exklusiven Möbeln von … | Eröffnung des Einrichtungsstudios / mit Möbeln von … |
| platzhirsch-unsere-broschuere-2022-ist-da | Text und Meta | unser exklusives Wohnstudio / exklusive Designmöbel führender Marken | unser Wohnstudio / Designmöbel von Minotti, Poliform und weiteren Marken |
| der-platzhirsch-laeutet-die-gartensaison-2023-ein | Beschreibung | einige der führenden Designer und Hersteller | einige Designer und Hersteller |
| flos-ausdrucksstarke-leuchten-designs | Beschreibung | die weltbekannte italienische Marke FLOS | die italienische Marke Flos |
| minotti-wir-praesentieren-die-neue-2022-collection | Text und Meta | Essenz von Luxus / luxuriöse Materialien / höchstem Stil / einzigartigen Kollektion / zeitlosen Luxus | Essenz der Marke / hochwertige Materialien / Stil / Kollektion / zeitloses Design |
| minotti-auszeichnung-als-historische-marke | Text und Meta | luxuriösen Möbeln / Luxusmöbel-Design | Möbeln / Möbeldesign |
| paola-lenti-technologie-und-nachhaltigkeit | Text und Meta | Luxus und Umweltbewusstsein perfekt / nachhaltigen Luxus / exklusive Möbel / einzigartige Kombination | Design und Umweltbewusstsein / Nachhaltigkeit / Möbel / Kombination |
| poliform-day-…, poliform-night-…, poliform-cucine-… | Text und Meta | luxuriöse Wohlfühloase, modernem Luxus, Inbegriff von Luxus, Exklusive Designmöbel, auf höchstem Niveau | Wohlfühloase, modernem Design, Inbegriff von Innovation, Designmöbel, „auf höchstem Niveau“ streichen |
| garten-als-erweiterung-des-wohnraums | Beschreibung und Meta | luxuriöse Erweiterung / luxuriösen Wohnraum | Erweiterung / Wohnraum im Freien |
| platzhirsch-es-weihnachtet-schon-sehr | Text | exklusive Auswahl / einzigartigen Möbelstücken / Gefühl von Luxus | Auswahl / Möbelstücken / weihnachtliches Gefühl |
| inspiration-fuer-einen-unvergesslichen-sommer, quasar-…, treca-paris-…, solpuri-…, paola-lenti-fuer-garten-…, vernissage-birds-zyklus-…, oeffnungszeiten-jahreswechsel-2023-2024 | Text und Meta | „exklusive(n)“, „einzigartig“, „Luxuriöser Schlafkomfort“, „exklusive Angebote“, „eine unserer exklusiven Marken“ | streichen bzw. „besondere“, „Schlafkomfort“, „Angebote“, „eine unserer Marken“ |

„perfekt“ im Sinne von „passt gut“ (etwa „die perfekte Ergänzung“) ist nachrangig. Nach der Bereinigung sollte der Dev-Server ohne `[news-copy]`-Meldung starten.
