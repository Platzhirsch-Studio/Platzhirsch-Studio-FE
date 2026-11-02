# Paket „Recht & Texte (Messages)“

**Stand:** 26.10.2026 · **Grundlage:** `Marktresearch/recht/03-uwg-werbe-audit.md` (Sofortmaßnahmen), Design-Bibel §1 Stimme (Sie-Form, Fakten statt Adjektive, kein Ausrufezeichen, ohne „Luxus/exklusiv/Traum/größte/beste“, Marken „gezeigt“ oder „geplant“, nie „offiziell vertreten“).
**Entwurf – die mit [anwaltlich prüfen] / [vom Unternehmen auszufüllen] markierten Punkte aus dem Audit bleiben offen.**

## 1. Ergebnis

- `src/messages/de|en|fr|it.json`: **55 Schlüssel, 206 Einträge** geändert, kein Schlüssel hinzugefügt, entfernt oder umbenannt. Struktur, Reihenfolge, CRLF und Platzhalter (`{count}`, `{brand}` …) bleiben gleich. Alle vier Dateien sind gültiges JSON und wurden per Skript gegen ungewollte Änderungen geprüft (jeder nicht gelistete Schlüssel unverändert).
- `src/lib/content/homeSeo.js`: IT-Titel „Mobili di design **italiani** in Austria …“ → „Mobili di design in Austria …“ (Audit M2).
- `src/lib/content/landingPages.js`: Teaser `kuechen-vorarlberg` „Küchenplanung mit next125 und Poliform.“ → „Küchenplanung in Lochau, u. a. mit next125 und Schüller.“ (H9); Teaser `moebel-bodensee` „Für das gesamte Bodenseeufer – …“ → „Beratung für das gesamte Bodenseeufer – …“ (R-L1). `lastModified` unverändert (betrifft nur Footer-/Teaser-Text, nicht die Seite).
- ESLint `src/lib/content`: sauber. URLs, Canonicals, hreflang, JSON-LD unverändert.

### 1a. Runde 2 – QA-Fixes (Feedback `qa-screenshots/neuauftritt/recht-texte/feedback.md`)

**P2-1 `src/lib/content/homeSeo.js` (live, Startseite „Designermöbel am Bodensee …“ + FAQPage-JSON-LD), alle 4 Sprachen:**
- Absatz 1: „Originalstücke von … Tréca und über 25 weiteren Designmarken“ → „unter anderem Originalstücke von Minotti, Poliform, Rimadesio, Flos, ClassiCon, Paola Lenti und Tréca … Insgesamt planen wir mit über 35 internationalen Designmarken – was aktuell ausgestellt ist, sagen wir Ihnen gern vorab.“ (H11)
- Absatz 2: „Jedes Stück wird … konfiguriert, geliefert und montiert“ → „Jedes Stück planen wir maßgenau für Ihren Raum. Auf Wunsch liefern und montieren wir – in Vorarlberg und ganz Österreich.“ (L2)
- FAQ 1: „insgesamt über 35 internationale Designmarken“ → „Insgesamt planen wir mit über 35 internationalen Designmarken …; einen Teil davon zeigen wir mit Mustern und Katalogen.“
- Zusätzlich L2-konsistent: FAQ 2 „Auf Wunsch liefern und montieren wir …“, FAQ 3 „kümmern uns um die Bestellung – auf Wunsch auch um Lieferung und Montage“.
- Dateikommentar neu (Bezug auf UWG-Audit H11/L2 statt „no new claims“).
- Titel/H2 unverändert, Struktur von `HOME_SEO` unverändert → FAQPage-JSON-LD weiter gültig (geprüft: `/de`, `/en`, `/fr`, `/it` liefern FAQPage, „über 25 weiteren / more than 25 / plus de 25 / oltre 25“ kommt nicht mehr vor).

**P3-1 Messages (alle 4 Sprachen, sofern vorhanden):**
| Schlüssel | neu (DE bzw. EN) |
|---|---|
| `Benefits.description` | „Entdecken Sie, wie wir Ihr Zuhause einrichten – mit persönlichem Service und Betreuung von der Planung bis zur Montage.“ (ohne „erstklassig“, „Rundum-sorglos“, „perfekt“) |
| `partners.headline` | „Gute Partner für gute Projekte“ / „Good Partners for Good Projects“ / „De bons partenaires pour de bons projets“ / „Buoni partner per buoni progetti“ |
| `about.ausstellung.tourDesc2` | DE „eine gute Einstimmung“; EN „particular atmosphere … a good introduction“; FR „atmosphère particulière … une bonne introduction“ (IT war bereits neutral) |
| `services.homeCheckDesc` (nur EN/FR/IT) | EN „Consultation at your home: we look at your rooms on site before we suggest an interior that suits them.“ (FR/IT analog, ohne „parfait/perfetta“) |
| `services.smartCareDesc` (nur EN/FR/IT) | „Live-Chat/E-Commerce“-Behauptung (es gibt keinen Live-Chat) → „Personal advice from our interior team – in the showroom, by phone or by email.“ |
| `ProductsPage.keywords.luxus` | „Design-Gartenmöbel / Designer garden furniture / Meubles de jardin design / Mobili da giardino di design“ (Schlüsselname bleibt) |
| `Home.categoriesLead` (FR) | „D'un simple fauteuil à l'aménagement complet …“ |

**P3-2 Anrede:** `MultiStepForm.thankYou` IT „la sua richiesta. La contatteremo“ (Lei) → „la tua richiesta. Ti contatteremo a breve.“ (tu, wie `contact.formSuccess`; live in `BeratungClient`). FR ist durchgehend „vous“ (geprüft). **Festlegung IT:** „tu“ für alles, was einen Einzelnen anspricht (Formulare, Shop, Bestätigungen); die redaktionellen Pluralanreden „voi“ (`About.*`, `about.*`, `TeamSection.*`, `MarkenSection.paragraphs.4`, `Press.description`, `news.news2Desc`, `Vernissage.popupText`) sind im Italienischen für Publikumsansprache üblich und werden von keiner Komponente gelesen. Ich habe sie nicht umgeschrieben. Falls die Integration sie übernimmt, sollten sie auf „tu“ umgestellt werden.

Nicht geändert: keine Schlüssel hinzugefügt/entfernt, Platzhalter und CRLF unverändert, alle 4 Dateien gültiges JSON.

### 1b. Live-Nutzung je geändertem Schlüssel (Stand 26.10.2026, Suche über `src/**` ohne `messages`)

Live genutzt (ja):
| Schlüssel | Datei |
|---|---|
| `JobsDetails.applySuccess` | `app/[locale]/ueber-uns/karriere/[slug]/jobdetailsclient.js` |
| `MultiStepForm.thankYou` | `components/BeratungClient/BeratungClient.js` |
| `contact.formSuccess`, `contact.welcomeMsg` | `components/Kontakt/kontakt.js` |
| `newsletter.success` | `components/Newsletter/NewsletterContent.js` |
| `enquiry.success.submitted` | `components/AnfrageFormProduct/AnfrageFormProduct.js` |
| `error404.headline` | `app/[locale]/[slug]/page.js`, `components/NotFound/NotFoundContent.js` |
| `Cookies.bannerText` | `components/Cookies/cookiecomponent.js` |
| `partners.<n>.role` (u. a. `partners.1.role`) | `components/Partner/partner.js` (`roles.has(\`${idx}.role\`)`) |
| (kein Messages-Schlüssel) `HOME_SEO` | `components/Home/SeoIntro.js` → `src/lib/content/homeSeo.js` |

Nicht live genutzt (nein – kein Leser außer ggf. Preview): `Home.trust3`, `Home.heroLead` (nur Preview), `Home.brandsLead`, `Home.categoriesLead`, `Home.regionsLead`, `about.first_section.text`, `about.ausstellung.desc`, `about.ausstellung.tourDesc2`, `About.ourMissionDesc`, `About.yourVisionDesc`, `Choice.*`, `FeaturesSection.*`, `MarkenSection.*`, `TeamSection.*`, `KarriereTeam.*`, `KarrierePosition.helmut.bullets.1`, `Press.description`, `partners.description`, `partners.headline`, `newsletter.intro1/intro2/reasons1/reasons3/reasons4/outro` (Newsletter-Seite liest jetzt `inhalt.newsletter.*` über `useInhalt`), `news.news1Desc/news2Desc`, `article.news1Desc/news2Desc`, `brand.officialWebsite`, `marken.officialWebsite`, `ProductsPage.description/twitterDescription/keywords.luxus`, `Benefits.description`, `services.*`.
Hinweis: Die Suche ist heuristisch (Namespace + Schlüssel im selben File); dynamisch zusammengesetzte Schlüssel können fehlen.

### 1c. Übergabeliste an die Integration

1. **`src/components/Home/copy.js` (sichtbare Startseite) muss übernehmen:**
   - Liefergebiet wie `Home.trust3`: „Lieferung & Montage in Österreich · DE, CH, FL auf Anfrage“ (copy.js Z. ~84–87 nennt Lindau/Schweiz/Rheintal – dort „auf Anfrage“ ergänzen, wo es nicht schon „klären wir persönlich“ heißt).
   - Montage „auf Wunsch“ wie `Home.categoriesLead/regionsLead` (copy.js Z. ~39 „Bestellung, Lieferung und Montage begleiten wir bis zum Schluss“, Z. ~84 „Lieferung und Montage in Vorarlberg und ganz Österreich“).
   - Marken-Ausstellung wie `Home.brandsLead`: nie „jede Marke im Showroom“, sondern „unter anderem … / was ausgestellt ist, sagen wir Ihnen gern vorab“.
   - H1 „Italienisches Wohnen am Bodensee.“ relativieren (siehe §3 Punkt 3).
2. **Neue Namespaces übernehmen:** `inhalt.*` aus `Marktresearch/digital/redesign/messages-inhaltsseiten.json` (ersetzt `components/UberUns/inhalt/fallback.js`), `ui.*` aus `messages-fundament.json`, weitere `messages-<paket>.json`. Vorher dieselben Prüfregeln (kein „exklusiv/Luxus/Traum/beste“, kein „nicht Händler“, Montage „auf Wunsch“) anwenden.
3. **Löschkandidaten (verwaist, nach Bestätigung, dass auch keine dynamischen Leser existieren):** `Choice`, `FeaturesSection`, `Benefits`, `services`, `About`, `about`, `MarkenSection`, `TeamSection`, `KarriereTeam`, `news`, `article`, `newsletter.intro1/intro2/reasons*/outro` (falls `inhalt.newsletter` vollständig), `Home.trust*/heroLead/brandsLead/categoriesLead/regionsLead` (falls Preview nicht mehr benötigt), `partners.headline/description`, `brand.officialWebsite`, `marken.officialWebsite`. Die EN/FR/IT-Extra-Schlüssel (Altbestand, nicht in DE) ebenfalls.

## 2. Umgesetzte Sofortmaßnahmen

| Audit | Maßnahme | Schlüssel |
|---|---|---|
| L1 Trust-Leiste | „Lieferung & Montage in AT · DE · CH“ → „… in Österreich · DE, CH, FL auf Anfrage“ (4 Sprachen) | `Home.trust3` |
| L2 | Montage „auf Wunsch“ statt Pauschalzusage | `Home.categoriesLead`, `Home.regionsLead` |
| G1/G2 Green Claims | „überwiegend nachhaltig orientierte Möbelmarken“ und „Nachhaltigkeit“ als Markenkern gestrichen; keine Langlebigkeitsbehauptung ersetzt | `about.ausstellung.desc`, `about.first_section.text`, `MarkenSection.paragraphs.2` |
| G3 | Agenturtext („Markenidentitäten“, „Markenstrategien“) durch Beschreibung der echten Tätigkeit ersetzt | `About.ourMissionDesc`, `About.yourVisionDesc` |
| H8 | „Offizielle Website“ → „Website des Herstellers“ | `brand.officialWebsite`, `marken.officialWebsite` |
| H9 | „arbeiten wir mit [Marke]“ → „planen wir mit [Marke]“ (R-M2) | `MarkenSection.paragraphs.2` |
| H11 | „Jede Marke ist im Showroom …“ → „Die meisten unserer Marken … Was ausgestellt ist, sagen wir Ihnen gern vorab.“ | `Home.brandsLead` |
| M1 | „Italienische Designmöbel …“ → „Designermöbel … internationaler Marken, viele davon aus Italien“ | `Home.heroLead` |
| A3/A5, R-A3 | „exklusiv“, „beste“, „Leading“, „höchste“, „Luxus“ gestrichen, v. a. bei Marken | siehe Tabelle |
| P3 | „Rabatte nur für Newsletter-Abonnenten“ → „Wir informieren Sie, wenn in unserem Showroom eine Aktion läuft.“ | `newsletter.reasons3`, `newsletter.intro2` |
| R-L2 | EN/FR/IT „fast delivery … best offer/miglior prezzo“ → Termin in der Auftragsbestätigung | `services.kitchenPlannerDesc` |
| §10 Presse | „exklusives Bildmaterial“ → „Bildmaterial, soweit wir es weitergeben dürfen“ | `Press.description` |
| Bibel §1 | alle Ausrufezeichen entfernt (9 Schlüssel × 4 Sprachen), „Traum/träumen“ entfernt | siehe Tabelle |
| Konsistenz | `KarriereTeam.*` EN/FR/IT waren inhaltlich andere Texte (u. a. „garantieren“, „das Beste“); an DE angeglichen | `KarriereTeam.*` |

Händler-/„autorisiert“-Aussagen und „größte Minotti-Ausstellung“ kommen in `src/messages` und `src/lib/content` **nicht** vor (Prüfung per Regex aus R-X2). Sie stehen im Backoffice/CMS (siehe §3).

## 3. Offene Punkte (nicht in meinen Dateien)

1. **Backoffice/CMS (Prio 1):** `dealers_description_*` aller Marken außer ClassiCon („offizieller [Marke] Händler“), News „Grand Opening“ („größte Minotti-Ausstellung Westösterreichs“), 800-m²-Text („größte im Umkreis von 500 km“), Lagerabverkauf-/Sortimentswechsel-News (Preise ohne 30-Tage-Tiefstpreis), „nachhaltig“ in Marken-Metas/Keywords – nur im Backoffice zu ändern.
2. **Meta-Descriptions im Code mit „exklusive Designermöbel“:** `src/app/[locale]/layout.js`, `src/app/[locale]/ueber-uns/platzhirsch/page.js`, `src/app/llms.txt/route.js` (live sichtbar auf `/de`). → SEO-/Integrations-Paket.
3. **Startseiten-H1 „Italienisches Wohnen am Bodensee.“** (`src/components/Home/copy.js`, Bibel-Leitzeile) – Audit M1 mittel. Bei der Binni-Linie wird sie falsch; Vorschlag für das Home-Paket: Herkunft im Lead relativieren (wie `Home.heroLead`) und die Binni-Küchen nie unter dieser Zeile zeigen.
4. `ueber-uns/marken/[title]/page.js` „Paola Lenti Showroom Österreich“ (H4), `kuechen-vorarlberg/page.js` „Unsere Küchenmarken … arbeiten wir mit Poliform“ (H9), `shopSeoCopy.js` „im Showroom erleben“ (H12) – fremde Pakete.
5. **Inhaber bestätigen:** „über 35 Premium-Marken“ (`Home.trust1`), Ausstellungsinventar je Marke (`homeSeo.js` „Originalstücke von …“), Liefergebiet DE/CH/FL, Bezugsweg je Marke, ob es Showroom-Aktionen gibt (`newsletter.reasons3`).
6. Bewusst belassen (niedrig): `Outdoor.desc3` „wetterbeständig … Langlebigkeit“ (Produkteigenschaft, bei Gelegenheit mit Herstellerangabe belegen), `KarrierePosition.helmut.bullets.1` EN/FR/IT weichen inhaltlich von DE ab.
7. `messages-fundament.json` (`ui.leitsatz`, `ui.breadcrumbs`) habe ich **nicht** übernommen – das ist Aufgabe der Integration.
8. **Runde 2 – live sichtbare Restrisiken in fremden Paketen (weitergeben, nicht von mir geändert):**
   - Meta-Description „exklusive Designermöbel / Exclusive / exclusif / esclusivi“: `src/app/[locale]/page.js` (4 Sprachen), `src/app/[locale]/ueber-uns/platzhirsch/page.js`, `src/app/llms.txt/route.js`; weitere Treffer „exklusiv/exclusive“ laut grep in `[locale]/layout.js`, `beratung/page.js`, `news/[title]/page.js`, `ueber-uns/karriere/page.js`, `ueber-uns/partner/page.js`, `ueber-uns/presse/page.js` (je prüfen). → SEO-/Seiten-Pakete.
   - **Neu:** `src/app/[locale]/newsletter/page.js` title „Newsletter | Exclusive Living Ideas“, ogTitle „Exclusive Living Ideas & Offers“, FR „Idées Exclusives“ – widerspricht dem entschärften Newsletter-Text (keine Rabatte/Exklusivität). Vorschlag DE „Newsletter | Neuheiten und Termine aus dem Showroom“.
   - H1 „Italienisches Wohnen am Bodensee.“ (`src/components/Home/copy.js`, 4 Sprachen; auch `Home/Hero.js`) und `src/app/[locale]/designermoebel-kempten/page.js` „Italienisches Wohnen für Haus und Neubau“ (Audit M1) – inkonsistent mit „viele davon aus Italien“.
   - `/de/ueber-uns/platzhirsch` Lead „Wir sind Gastgeber, **nicht Händler**“ (`components/UberUns/inhalt/fallback.js` bzw. `messages-inhaltsseiten.json`): Platzhirsch verkauft Möbel → **[anwaltlich prüfen]** (Irreführung über die Unternehmereigenschaft). Vorschlag: „Wir verstehen uns als Gastgeber: Bei uns sitzen Sie zuerst – …“. Bei der Integration von `inhalt.*` nicht ungeprüft übernehmen.
   - Optik (P3-3, Fundament/Seiten-Pakete): Cookie-Banner-Buttons mit Radius (Bibel „keine Radien“); `/de/ueber-uns/platzhirsch` iPhone ~150 px Leerraum über der Brotkrumennavigation, Desktop leerer grauer Bildplatzhalter „Die Menschen im Haus“ und sehr tief gesetzter H1-Block; Startseite iPhone: Produkt-Links im Sechs-Stücke-Raster 20–27 px hoch → `min-h-11` (Paket Startseite).
9. **Inhaber bestätigen (Basis für `homeSeo.js`):** „über 35 Marken“ (Startseite zählt 36), welche Marken tatsächlich ausgestellt sind (Liste „unter anderem Minotti … Tréca“), dass ein Teil per Muster/Katalog gezeigt wird, Liefergebiet DE/CH/FL, Montage „auf Wunsch“, Showroom-Aktionen (`newsletter.reasons3`).

## 4. Selbsttest

`node tools/qa/shoot.mjs …/qa-screenshots/neuauftritt/recht-texte/selbsttest http://localhost:3000/de http://localhost:3000/de/ueber-uns/platzhirsch`: alle 8 Aufnahmen 200. Zwischendurch kam 500 wegen fremder Baustellen (`MarkenItems/brandData` fehlte kurz). Die Meldung „horizontal overflow“ auf dem iPhone war vorübergehend; eine Nachmessung nach dem Laden zeigt scrollWidth = 393 = clientWidth. Die neuen Texte sind im HTML (`auf Anfrage`, `Website des Herstellers`, `Die meisten unserer Marken`, `nehmen Sie Platz`). Die Startseite und Über-uns rendern inzwischen weitgehend eigene Texte der Seiten-Pakete, meine Schlüssel wirken dort, wo die Komponenten sie noch lesen.

**Runde 2:** `node tools/qa/shoot.mjs …/qa-screenshots/neuauftritt/recht-texte/fix http://localhost:3000/de http://localhost:3000/de/ueber-uns/platzhirsch`: alle 8 Aufnahmen (iPhone, Android, iPad, Desktop) 200, keine Fehler/Überlauf-Meldung im Log. HTML `/de` enthält „unter anderem Originalstücke“, „einen Teil davon zeigen wir“, „Auf Wunsch liefern und montieren wir“; „über 25 weiteren“ (bzw. EN/FR/IT-Pendants) kommt auf `/de|en|fr|it` nicht mehr vor; FAQPage-JSON-LD auf allen vier vorhanden. ESLint `src/lib/content` sauber, alle 4 Messages-Dateien gültiges JSON.

Benötigte Bilder: keine.

## 5. Alle Änderungen (Schlüssel, alt → neu)

#### `Home.trust3` – L1/R-L1 Liefergebiet ehrlich

| Spr. | alt | neu |
|---|---|---|
| de | Lieferung & Montage in AT · DE · CH | Lieferung & Montage in Österreich · DE, CH, FL auf Anfrage |
| en | Delivery & assembly in AT · DE · CH | Delivery & assembly in Austria · DE, CH, FL on request |
| fr | Livraison & montage en AT · DE · CH | Livraison & montage en Autriche · DE, CH, FL sur demande |
| it | Consegna & montaggio in AT · DE · CH | Consegna & montaggio in Austria · DE, CH, FL su richiesta |

#### `Home.heroLead` – M1 Herkunft „italienisch“ relativiert

| Spr. | alt | neu |
|---|---|---|
| de | Italienische Designmöbel, Küchen und Licht – ausgewählt in unserem Showroom am Bodensee, geplant für Ihr Zuhause. | Designermöbel, Küchen und Licht internationaler Marken, viele davon aus Italien – ausgewählt in unserem Showroom am Bodensee, geplant für Ihr Zuhause. |
| en | Italian designer furniture, kitchens and lighting – selected in our showroom on Lake Constance, planned for your home. | Designer furniture, kitchens and lighting from international brands, many of them Italian – selected in our showroom on Lake Constance, planned for your home. |
| fr | Mobilier design italien, cuisines et luminaires – sélectionnés dans notre showroom au bord du lac de Constance, planifiés pour votre intérieur. | Mobilier design, cuisines et luminaires de marques internationales, dont beaucoup d'italiennes – sélectionnés dans notre showroom au bord du lac de Constance, planifiés pour votre intérieur. |
| it | Mobili di design italiani, cucine e luce – selezionati nel nostro showroom sul Lago di Costanza, progettati per la tua casa. | Mobili di design, cucine e luce di marchi internazionali, molti dei quali italiani – selezionati nel nostro showroom sul Lago di Costanza, progettati per la tua casa. |

#### `Home.brandsLead` – H11 „Jede Marke“ unbelegt

| Spr. | alt | neu |
|---|---|---|
| de | Jede Marke ist im Showroom mit Originalstücken, Stoffen und Oberflächen vertreten – nicht nur im Katalog. | Die meisten unserer Marken erleben Sie im Showroom im Original, mit Stoffen und Oberflächen. Was ausgestellt ist, sagen wir Ihnen gern vorab. |
| en | Every brand is present in the showroom with original pieces, fabrics and finishes – not just in a catalogue. | Most of our brands can be seen in the showroom as original pieces, with fabrics and finishes. We are happy to tell you in advance what is on display. |
| fr | Chaque marque est présente au showroom avec des pièces originales, tissus et finitions – pas seulement en catalogue. | La plupart de nos marques sont présentées au showroom en pièces originales, avec tissus et finitions. Nous vous indiquons volontiers à l'avance ce qui est exposé. |
| it | Ogni marchio è presente in showroom con pezzi originali, tessuti e finiture – non solo a catalogo. | La maggior parte dei nostri marchi è presente in showroom con pezzi originali, tessuti e finiture. Saremo lieti di dirti in anticipo che cosa è esposto. |

#### `Home.categoriesLead` – L2 Montage „auf Wunsch“

| Spr. | alt | neu |
|---|---|---|
| de | Vom einzelnen Sessel bis zur kompletten Einrichtung: Alle Stücke planen wir maßgenau für Ihre Räume und liefern sie montiert. | Vom einzelnen Sessel bis zur kompletten Einrichtung: Wir planen jedes Stück maßgenau für Ihre Räume. Möbel liefern und montieren wir auf Wunsch. |
| en | From a single armchair to a complete interior: we plan every piece to measure for your rooms and deliver it assembled. | From a single armchair to a complete interior: we plan every piece to measure for your rooms. Furniture is delivered and assembled on request. |
| fr | Du fauteuil unique à l'aménagement complet : nous planifions chaque pièce sur mesure pour vos espaces et la livrons montée. | Du fauteuil unique à l'aménagement complet : nous planifions chaque pièce sur mesure pour vos espaces. Sur demande, nous livrons et montons les meubles. |
| it | Dalla singola poltrona all'arredo completo: progettiamo ogni pezzo su misura per i tuoi spazi e lo consegniamo montato. | Dalla singola poltrona all'arredo completo: progettiamo ogni pezzo su misura per i tuoi spazi. Su richiesta consegniamo e montiamo i mobili. |

#### `Home.regionsLead` – L2

| Spr. | alt | neu |
|---|---|---|
| de | Wir kommen zu Ihnen – zum Ausmessen, Planen und Montieren. | Auf Wunsch kommen wir zu Ihnen – zum Ausmessen, Planen und Montieren. |
| en | We come to you – to measure, plan and assemble. | On request we come to you – to measure, plan and assemble. |
| fr | Nous venons chez vous – pour mesurer, planifier et monter. | Sur demande, nous venons chez vous – pour mesurer, planifier et monter. |
| it | Veniamo da te – per misurare, progettare e montare. | Su richiesta veniamo da te – per misurare, progettare e montare. |

#### `about.first_section.text` – G2 Nachhaltigkeit, „exklusiv“, „höchstes Niveau“; Leitsatz

| Spr. | alt | neu |
|---|---|---|
| de | Willkommen bei Platzhirsch Home Living, Ihrem Einrichtungsstudio für exklusive Designermöbel und hochwertige Wohnkonzepte am Bodensee. In unserem Showroom in Lochau bei Bregenz – Landstraße 9, nur wenige Minuten von der deutschen und Schweizer Grenze entfernt – erleben Sie internationale Premiummarken, durchdachte Innenarchitektur und persönliche Einrichtungsberatung auf höchstem Niveau. Was uns ausmacht, ist die Leidenschaft für zeitloses Design, handwerkliche Qualität und Nachhaltigkeit: Jedes Möbelstück, jede Leuchte und jedes Accessoire in unserer Ausstellung ist sorgfältig kuratiert. Unser erfahrenes Team begleitet Sie von der ersten Idee über die Planung bis zur Lieferung und Montage – ob einzelnes Lieblingsstück, komplette Wohnungseinrichtung oder anspruchsvolles Interior-Design-Projekt. Lernen Sie uns kennen, entdecken Sie unsere Markenwelt und lassen Sie sich von unserer Begeisterung für schönes Wohnen anstecken. Wir freuen uns auf Ihren Besuch in Vorarlberg. | Willkommen bei Platzhirsch Home Living, Ihrem Einrichtungsstudio für Designermöbel und durchdachte Wohnkonzepte am Bodensee. In unserem Showroom in Lochau bei Bregenz – Landstraße 9, nur wenige Minuten von der deutschen und Schweizer Grenze entfernt – erleben Sie internationale Designmarken, Innenarchitektur und persönliche Einrichtungsberatung. Was uns ausmacht, ist die Freude an zeitlosem Design und handwerklicher Qualität: Jedes Möbelstück, jede Leuchte und jedes Accessoire in unserer Ausstellung ist sorgfältig ausgewählt. Unser Team begleitet Sie von der ersten Idee über die Planung bis zur Lieferung und Montage – ob einzelnes Lieblingsstück, komplette Wohnungseinrichtung oder anspruchsvolles Interior-Design-Projekt. Lernen Sie uns kennen, entdecken Sie unsere Marken und nehmen Sie Platz. Wir freuen uns auf Ihren Besuch in Vorarlberg. |
| en | Welcome to Platzhirsch Home Living, your destination for exclusive designer furniture and refined interior concepts on Lake Constance. In our showroom in Lochau near Bregenz – Landstraße 9, just minutes from the German and Swiss borders – you will discover international premium brands, thoughtful interior design and personal advice at the highest level. What defines us is a passion for timeless design, craftsmanship and sustainability: every piece of furniture, every light and every accessory in our exhibition is carefully curated. Our experienced team accompanies you from the first idea through planning to delivery and installation – whether it is a single favourite piece, a complete home furnishing or an ambitious interior design project. Get to know us, explore our world of brands and let our enthusiasm for beautiful living inspire you. We look forward to welcoming you in Vorarlberg, Austria. | Welcome to Platzhirsch Home Living, your interior studio for designer furniture and considered living concepts on Lake Constance. In our showroom in Lochau near Bregenz – Landstraße 9, just minutes from the German and Swiss borders – you will find international design brands, interior architecture and personal interior advice. What defines us is a love of timeless design and fine craftsmanship: every piece of furniture, every light and every accessory in our exhibition is carefully chosen. Our team accompanies you from the first idea through planning to delivery and installation – whether it is a single favourite piece, a complete home or an ambitious interior design project. Get to know us, explore our brands and take a seat. We look forward to welcoming you in Vorarlberg, Austria. |
| fr | Bienvenue chez Platzhirsch Home Living, votre adresse pour le mobilier design exclusif et les concepts d'aménagement intérieur haut de gamme au bord du lac de Constance. Dans notre showroom de Lochau, près de Bregenz – Landstraße 9, à quelques minutes seulement des frontières allemande et suisse – vous découvrez des marques internationales de prestige, une architecture d'intérieur réfléchie et un conseil personnalisé du plus haut niveau. Ce qui nous définit, c'est la passion du design intemporel, de la qualité artisanale et de la durabilité : chaque meuble, chaque luminaire et chaque accessoire de notre exposition est soigneusement sélectionné. Notre équipe expérimentée vous accompagne de la première idée à la livraison et au montage, en passant par la planification – qu'il s'agisse d'une pièce coup de cœur, de l'aménagement complet d'un logement ou d'un projet de décoration d'intérieur ambitieux. Faites notre connaissance, explorez notre univers de marques et laissez-vous gagner par notre enthousiasme pour l'art de vivre. Nous nous réjouissons de votre visite au Vorarlberg, en Autriche. | Bienvenue chez Platzhirsch Home Living, votre studio d'aménagement pour le mobilier design et des concepts d'intérieur réfléchis au bord du lac de Constance. Dans notre showroom de Lochau, près de Bregenz – Landstraße 9, à quelques minutes des frontières allemande et suisse –, vous découvrez des marques de design internationales, l'architecture d'intérieur et un conseil personnalisé. Ce qui nous définit, c'est le goût du design intemporel et de la qualité artisanale : chaque meuble, chaque luminaire et chaque accessoire de notre exposition est choisi avec soin. Notre équipe vous accompagne de la première idée à la livraison et au montage, en passant par la planification – qu'il s'agisse d'une pièce coup de cœur, de l'aménagement complet d'un logement ou d'un projet d'architecture d'intérieur ambitieux. Faites notre connaissance, découvrez nos marques et prenez place. Nous nous réjouissons de votre visite au Vorarlberg, en Autriche. |
| it | Benvenuti da Platzhirsch Home Living, il vostro punto di riferimento per mobili di design esclusivi e concetti d'arredo di alta gamma sul Lago di Costanza. Nel nostro showroom di Lochau, vicino a Bregenz – Landstraße 9, a pochi minuti dai confini con la Germania e la Svizzera – potete scoprire marchi internazionali di prestigio, un interior design curato nei dettagli e una consulenza personalizzata ai massimi livelli. Ciò che ci contraddistingue è la passione per il design senza tempo, la qualità artigianale e la sostenibilità: ogni mobile, ogni lampada e ogni accessorio della nostra esposizione è selezionato con cura. Il nostro team esperto vi accompagna dalla prima idea alla progettazione, fino alla consegna e al montaggio – che si tratti di un singolo pezzo del cuore, dell'arredamento completo di una casa o di un ambizioso progetto di interior design. Veniteci a conoscere, esplorate il nostro mondo di marchi e lasciatevi contagiare dal nostro entusiasmo per il bello dell'abitare. Vi aspettiamo nel Vorarlberg, in Austria. | Benvenuti da Platzhirsch Home Living, il vostro studio d'arredamento per mobili di design e concetti abitativi ponderati sul Lago di Costanza. Nel nostro showroom di Lochau, vicino a Bregenz – Landstraße 9, a pochi minuti dai confini con la Germania e la Svizzera – trovate marchi di design internazionali, architettura d'interni e una consulenza d'arredo personale. Ciò che ci contraddistingue è la passione per il design senza tempo e la qualità artigianale: ogni mobile, ogni lampada e ogni accessorio della nostra esposizione è scelto con cura. Il nostro team vi accompagna dalla prima idea alla progettazione, fino alla consegna e al montaggio – che si tratti di un singolo pezzo del cuore, dell'arredamento completo di una casa o di un ambizioso progetto di interior design. Veniteci a conoscere, scoprite i nostri marchi e accomodatevi. Vi aspettiamo nel Vorarlberg, in Austria. |

#### `about.ausstellung.desc` – G1 „überwiegend nachhaltig orientiert“, „das Beste“

| Spr. | alt | neu |
|---|---|---|
| de | Am Anfang jeder neuen Einrichtung steht das Sammeln von Inspiration – genau dafür haben wir unseren großzügigen Showroom am Bodensee geschaffen. Auf unserer Ausstellungsfläche in Lochau zeigen wir Wohnideen und Einblicke in die Welt unserer anspruchsvollen, überwiegend nachhaltig orientierten Möbelmarken wie Minotti, Poliform, Rimadesio, ClassiCon, Flos, Eichholtz, Paola Lenti und Treca Paris. Ausgewählte Accessoires, hochwertige Wandfarben, Tapeten und Teppiche runden das Sortiment ab. Und das Beste: Bei uns dürfen Sie nach Herzenslust probesitzen, probeliegen und probeträumen – ganz in Ruhe und mit persönlicher Beratung. | Am Anfang jeder neuen Einrichtung steht das Sammeln von Inspiration – genau dafür haben wir unseren Showroom am Bodensee geschaffen. Auf unserer Ausstellungsfläche in Lochau zeigen wir Wohnideen und Stücke unserer Möbelmarken wie Minotti, Poliform, Rimadesio, ClassiCon, Flos, Eichholtz, Paola Lenti und Tréca. Ausgewählte Accessoires, Wandfarben, Tapeten und Teppiche runden das Sortiment ab. Bei uns dürfen Sie probesitzen und probeliegen – in Ruhe und mit persönlicher Beratung. |
| en | Every new interior starts with gathering inspiration – and that is exactly why we created our spacious showroom on Lake Constance. On our exhibition floor in Lochau we present living ideas and insights into the world of our sophisticated, largely sustainability-oriented furniture brands such as Minotti, Poliform, Rimadesio, ClassiCon, Flos, Eichholtz, Paola Lenti and Treca Paris. Selected accessories, premium wall paints, wallpapers and rugs complete the range. And best of all: here you are welcome to test-sit, test-lie and test-dream to your heart's content – at your own pace and with personal advice. | Every new interior starts with gathering inspiration – and that is why we created our showroom on Lake Constance. On our exhibition floor in Lochau we show living ideas and pieces from our furniture brands such as Minotti, Poliform, Rimadesio, ClassiCon, Flos, Eichholtz, Paola Lenti and Tréca. Selected accessories, wall paints, wallpapers and rugs complete the range. You are welcome to sit and lie down on the pieces – at your own pace and with personal advice. |
| fr | Tout nouvel aménagement commence par la recherche d'inspiration – c'est précisément pour cela que nous avons créé notre vaste showroom au bord du lac de Constance. Sur notre surface d'exposition à Lochau, nous présentons des idées d'aménagement et un aperçu de l'univers de nos marques de mobilier exigeantes et majoritairement orientées vers la durabilité, telles que Minotti, Poliform, Rimadesio, ClassiCon, Flos, Eichholtz, Paola Lenti et Treca Paris. Des accessoires choisis, des peintures murales haut de gamme, des papiers peints et des tapis complètent l'assortiment. Et le meilleur : chez nous, vous pouvez vous asseoir, vous allonger et rêver à volonté – en toute tranquillité et avec un conseil personnalisé. | Tout nouvel aménagement commence par la recherche d'inspiration – c'est pour cela que nous avons créé notre showroom au bord du lac de Constance. Sur notre surface d'exposition à Lochau, nous présentons des idées d'aménagement et des pièces de nos marques de mobilier telles que Minotti, Poliform, Rimadesio, ClassiCon, Flos, Eichholtz, Paola Lenti et Tréca. Des accessoires choisis, des peintures murales, des papiers peints et des tapis complètent l'assortiment. Chez nous, vous pouvez vous asseoir et vous allonger pour essayer – en toute tranquillité et avec un conseil personnalisé. |
| it | Ogni nuovo arredamento inizia con la ricerca di ispirazione – ed è proprio per questo che abbiamo creato il nostro ampio showroom sul Lago di Costanza. Nella nostra esposizione a Lochau presentiamo idee d'arredo e uno sguardo sul mondo dei nostri marchi di mobili raffinati e in gran parte orientati alla sostenibilità, come Minotti, Poliform, Rimadesio, ClassiCon, Flos, Eichholtz, Paola Lenti e Treca Paris. Accessori selezionati, pitture murali di pregio, carte da parati e tappeti completano l'assortimento. E la cosa migliore: da noi potete sedervi, sdraiarvi e sognare in tutta libertà – con calma e con una consulenza personalizzata. | Ogni nuovo arredamento inizia con la ricerca di ispirazione – per questo abbiamo creato il nostro showroom sul Lago di Costanza. Nella nostra esposizione a Lochau presentiamo idee d'arredo e pezzi dei nostri marchi come Minotti, Poliform, Rimadesio, ClassiCon, Flos, Eichholtz, Paola Lenti e Tréca. Accessori selezionati, pitture murali, carte da parati e tappeti completano l'assortimento. Da noi potete sedervi e sdraiarvi per provare – con calma e con una consulenza personale. |

#### `About.ourMissionDesc` – G3 Agenturtext („Markenidentitäten“)

| Spr. | alt | neu |
|---|---|---|
| de | Bei Platzhirsch Home Living streben wir danach, kreative und durchdachte Lösungen zu entwickeln, die Markenidentitäten stärken und nachhaltig im Gedächtnis bleiben. Unser Ziel ist es, eine Brücke zwischen Design und Strategie zu schlagen, um unsere Kunden langfristig erfolgreich zu positionieren. | Wir richten Räume ein, in denen man gern lebt. Dafür hören wir zuerst zu, zeigen Ihnen im Showroom, was zu Ihnen passt, und planen Möbel, Materialien und Licht für Ihre Räume – bis alles an seinem Platz steht. |
| en | At Platzhirsch Home Living, we strive to develop creative and thoughtful solutions that strengthen brand identities and leave a lasting impression. Our goal is to bridge the gap between design and strategy to position our clients for long-term success. | We furnish rooms that people enjoy living in. To do that, we listen first, show you in the showroom what suits you, and plan furniture, materials and lighting for your rooms – until everything is in its place. |
| fr | Chez Platzhirsch Home Living, nous nous efforçons de développer des solutions créatives et réfléchies qui renforcent l’identité de la marque et laissent une impression durable. Notre objectif est de faire le lien entre le design et la stratégie afin d’assurer le succès à long terme de nos clients. | Nous aménageons des pièces où il fait bon vivre. Pour cela, nous commençons par vous écouter, vous montrons au showroom ce qui vous correspond, puis planifions mobilier, matières et éclairage pour vos espaces – jusqu'à ce que chaque chose soit à sa place. |
| it | In Platzhirsch Home Living ci impegniamo a sviluppare soluzioni creative e ponderate che rafforzino le identità del marchio e rimangano nella memoria. Il nostro obiettivo è colmare il divario tra design e strategia per posizionare con successo i nostri clienti a lungo termine. | Arrediamo ambienti in cui si vive volentieri. Per farlo ascoltiamo prima di tutto, vi mostriamo in showroom ciò che fa per voi e progettiamo mobili, materiali e luce per i vostri spazi – finché ogni cosa è al suo posto. |

#### `About.yourVisionDesc` – G3 Agenturtext („Markenstrategien“)

| Spr. | alt | neu |
|---|---|---|
| de | Platzhirsch Home Living steht für kreatives Design, innovative Lösungen und maßgeschneiderte Markenstrategien. Wir bringen Ideen zum Leben – authentisch, modern und wirkungsvoll. | Platzhirsch Home Living steht für Einrichtungsberatung, Planung und Designermöbel aus einer Hand. Sie bringen Ihre Vorstellung mit, wir machen daraus einen Plan – sorgfältig, persönlich und ohne Eile. |
| en | Platzhirsch Home Living stands for creative design, innovative solutions, and tailor-made brand strategies. We bring ideas to life – authentic, modern, and impactful. | Platzhirsch Home Living stands for interior advice, planning and designer furniture from a single source. You bring your idea, we turn it into a plan – carefully, personally and without haste. |
| fr | Platzhirsch Home Living incarne le design créatif, des solutions innovantes et des stratégies de marque sur mesure. Nous donnons vie aux idées – de manière authentique, moderne et percutante. | Platzhirsch Home Living réunit conseil en aménagement, planification et mobilier design en un seul lieu. Vous apportez votre idée, nous en faisons un plan – avec soin, personnellement et sans précipitation. |
| it | Platzhirsch Home Living rappresenta design creativo, soluzioni innovative e strategie di marca su misura. Diamo vita alle idee – in modo autentico, moderno ed efficace. | Platzhirsch Home Living unisce consulenza d'arredo, progettazione e mobili di design in un unico interlocutore. Voi portate la vostra idea, noi ne facciamo un progetto – con cura, di persona e senza fretta. |

#### `Choice.bestChoice` – A3/Bibel „beste“

| Spr. | alt | neu |
|---|---|---|
| de | IHRE BESTE WAHL | IHR STUDIO AM BODENSEE |
| en | YOUR BEST CHOICE | YOUR STUDIO ON LAKE CONSTANCE |
| fr | VOTRE MEILLEUR CHOIX | VOTRE STUDIO AU BORD DU LAC DE CONSTANCE |
| it | LA TUA SCELTA MIGLIORE | IL TUO STUDIO SUL LAGO DI COSTANZA |

#### `Choice.startProject` – Bibel „Traum“

| Spr. | alt | neu |
|---|---|---|
| de | Lassen Sie uns Ihr neues Traumprojekt starten | Lassen Sie uns über Ihr Projekt sprechen |
| en | Let’s start your new dream project | Let’s talk about your project |
| fr | Commençons votre nouveau projet de rêve | Parlons de votre projet |
| it | Iniziamo il tuo nuovo progetto da sogno | Parliamo del tuo progetto |

#### `FeaturesSection.header.headline` – Bibel „Traum“

| Spr. | alt | neu |
|---|---|---|
| de | Ihr Weg zum Trauminterieur – Unser Beratungsprozess | Ihr Weg zur neuen Einrichtung – unser Beratungsprozess |
| en | Your Path to Dream Interiors – Our Consulting Process | Your path to a new interior – our consulting process |
| fr | Votre chemin vers un intérieur de rêve – Notre démarche conseil | Votre chemin vers un nouvel intérieur – notre démarche conseil |
| it | Il tuo percorso verso un interni da sogno – Il nostro processo di consulenza | Il tuo percorso verso un nuovo arredo – il nostro processo di consulenza |

#### `FeaturesSection.header.subline` – Bibel „einzigartig/träumen“

| Spr. | alt | neu |
|---|---|---|
| de | Sie träumen von einem einzigartigen Interieur? Unser Studio setzt Ihre Ideen mit Stil und Qualität um. | Sie haben eine Vorstellung von Ihrem Interieur? Wir setzen sie mit Ihnen um – Schritt für Schritt. |
| en | Dreaming of a unique interior? Our studio brings your ideas to life with style and quality. | You have an idea for your interior? We realise it with you – step by step. |
| fr | Vous rêvez d’un intérieur unique ? Notre studio réalise vos idées avec style et qualité. | Vous avez une idée de votre intérieur ? Nous la réalisons avec vous – pas à pas. |
| it | Sogni un interni unico? Il nostro studio realizza le tue idee con stile e qualità. | Hai un'idea per i tuoi interni? La realizziamo con te – passo dopo passo. |

#### `FeaturesSection.features.4.description` – Bibel „Traum“

| Spr. | alt | neu |
|---|---|---|
| de | Sie wollen die Kosten für Ihren Traum erfahren? Unser Angebot. | Sie möchten wissen, was Ihr Projekt kostet? Unser Angebot. |
| en | Want to know the cost of your dream? Our offer. | Want to know what your project will cost? Our offer. |
| fr | Vous souhaitez connaître le coût de votre rêve ? Notre offre. | Vous souhaitez connaître le coût de votre projet ? Notre offre. |
| it | Vuoi conoscere i costi del tuo sogno? La nostra offerta. | Vuoi sapere quanto costa il tuo progetto? La nostra offerta. |

#### `MarkenSection.subheadline` – EN „Leading“ (Superlativ), 4 Sprachen vereinheitlicht

| Spr. | alt | neu |
|---|---|---|
| de | Starke Marken | Ausgewählte Marken |
| en | Leading Brands | Selected Brands |
| fr | Marques d'excellence | Marques choisies |
| it | Marchi di prestigio | Marchi selezionati |

#### `MarkenSection.paragraphs.0` – A5 „exklusive Auswahl“, „höchste“

| Spr. | alt | neu |
|---|---|---|
| de | Unser Portfolio umfasst eine exklusive Auswahl an renommierten Marken, die für zeitlose Eleganz, höchste Handwerkskunst und wegweisendes Design stehen. Jede Marke, die wir führen, erzählt ihre eigene Geschichte und bringt ihre einzigartige Handschrift in die Welt des Designs ein. | Unser Sortiment umfasst eine Auswahl renommierter Marken, die für zeitlose Gestaltung, sorgfältige Handwerkskunst und eigenständiges Design stehen. Jede Marke, die wir zeigen, erzählt ihre eigene Geschichte und hat ihre eigene Handschrift. |
| en | Our portfolio brings together an exclusive selection of renowned brands that stand for timeless elegance, exceptional craftsmanship and pioneering design. Every brand we carry tells its own story and brings its unmistakable signature to the world of design. | Our range brings together a selection of renowned brands that stand for timeless design, careful craftsmanship and an independent design language. Every brand we show tells its own story and has its own signature. |
| fr | Notre portfolio réunit une sélection exclusive de marques renommées, synonymes d'élégance intemporelle, d'un artisanat d'excellence et d'un design avant-gardiste. Chaque marque que nous représentons raconte sa propre histoire et apporte sa signature unique à l'univers du design. | Notre assortiment réunit une sélection de marques renommées, synonymes de design intemporel, de savoir-faire soigné et d'une écriture propre. Chaque marque que nous présentons raconte sa propre histoire et a sa propre signature. |
| it | Il nostro portfolio riunisce una selezione esclusiva di marchi rinomati, sinonimo di eleganza senza tempo, artigianato di altissimo livello e design all'avanguardia. Ogni marchio che proponiamo racconta la propria storia e porta la sua firma inconfondibile nel mondo del design. | Il nostro assortimento riunisce una selezione di marchi rinomati, sinonimo di design senza tempo, artigianato accurato e un linguaggio proprio. Ogni marchio che presentiamo racconta la propria storia e ha una firma riconoscibile. |

#### `MarkenSection.paragraphs.2` – H9 „arbeiten mit“ → „planen mit“; Langlebigkeit (R-G3)

| Spr. | alt | neu |
|---|---|---|
| de | In Küche und Bad arbeiten wir mit next125, Schüller und Frost sowie mit antoniolupi und Agape – Marken, die Funktion und Materialqualität gleichermaßen ernst nehmen. Für den Außenbereich stehen Gloster, Paola Lenti, Solpuri, Sifas, EMU, Tuuci und Umbrosa: Möbel, Sonnenschirme und Textilien, die auch nach Jahren im Freien ihren Charakter behalten. Heatsail verlängert mit seinen Heizstrahlern die Saison bis in die kühleren Monate. | In Küche und Bad planen wir mit next125, Schüller und Frost sowie mit antoniolupi und Agape – Marken, die Funktion und Materialqualität gleichermaßen ernst nehmen. Für den Außenbereich stehen Gloster, Paola Lenti, Solpuri, Sifas, EMU, Tuuci und Umbrosa: Möbel, Sonnenschirme und Textilien, die für den Einsatz im Freien gemacht sind. Heatsail verlängert mit seinen Heizstrahlern die Saison bis in die kühleren Monate. |
| en | In the kitchen and bathroom we work with next125, Schüller and Frost, alongside antoniolupi and Agape – brands that take function and material quality equally seriously. For outdoor spaces there are Gloster, Paola Lenti, Solpuri, Sifas, EMU, Tuuci and Umbrosa: furniture, parasols and textiles that keep their character after years in the open air. Heatsail extends the season into the cooler months with its patio heaters. | In the kitchen and bathroom we plan with next125, Schüller and Frost, alongside antoniolupi and Agape – brands that take function and material quality equally seriously. For outdoor spaces there are Gloster, Paola Lenti, Solpuri, Sifas, EMU, Tuuci and Umbrosa: furniture, parasols and textiles made for use in the open air. Heatsail extends the season into the cooler months with its patio heaters. |
| fr | Pour la cuisine et la salle de bains, nous travaillons avec next125, Schüller et Frost, ainsi qu'avec antoniolupi et Agape – des marques qui accordent autant d'importance à la fonction qu'à la qualité des matériaux. Pour l'extérieur, Gloster, Paola Lenti, Solpuri, Sifas, EMU, Tuuci et Umbrosa proposent des meubles, des parasols et des textiles qui conservent leur caractère après des années en plein air. Heatsail prolonge la saison jusqu'aux mois plus frais grâce à ses chauffages d'extérieur. | Pour la cuisine et la salle de bains, nous planifions avec next125, Schüller et Frost, ainsi qu'avec antoniolupi et Agape – des marques qui accordent autant d'importance à la fonction qu'à la qualité des matériaux. Pour l'extérieur, Gloster, Paola Lenti, Solpuri, Sifas, EMU, Tuuci et Umbrosa proposent des meubles, des parasols et des textiles conçus pour le plein air. Heatsail prolonge la saison jusqu'aux mois plus frais grâce à ses chauffages d'extérieur. |
| it | Per cucina e bagno lavoriamo con next125, Schüller e Frost, oltre che con antoniolupi e Agape – marchi che dedicano la stessa attenzione alla funzione e alla qualità dei materiali. Per l'esterno ci sono Gloster, Paola Lenti, Solpuri, Sifas, EMU, Tuuci e Umbrosa: arredi, ombrelloni e tessuti che mantengono il loro carattere anche dopo anni all'aperto. Heatsail prolunga la stagione fino ai mesi più freddi con i suoi riscaldatori da esterno. | Per cucina e bagno progettiamo con next125, Schüller e Frost, oltre che con antoniolupi e Agape – marchi che dedicano la stessa attenzione alla funzione e alla qualità dei materiali. Per l'esterno ci sono Gloster, Paola Lenti, Solpuri, Sifas, EMU, Tuuci e Umbrosa: arredi, ombrelloni e tessuti pensati per l'uso all'aperto. Heatsail prolunga la stagione fino ai mesi più freddi con i suoi riscaldatori da esterno. |

#### `MarkenSection.paragraphs.4` – A5 „Exklusivität“, „Luxus“, „höchste Ansprüche“

| Spr. | alt | neu |
|---|---|---|
| de | Entdecken Sie bei uns die Vielfalt und Exklusivität von Marken, die international für ihren herausragenden Ruf bekannt sind. Wir sind stolz darauf, unseren Kunden Marken zu präsentieren, die höchsten Ansprüchen gerecht werden und die Essenz von Luxus und Innovation verkörpern. In unserem Showroom in Lochau (Vorarlberg) erleben Sie diese Marken im Zusammenspiel – und unsere Einrichtungsberatung hilft Ihnen dabei, aus einzelnen Stücken ein stimmiges Ganzes zu machen. | Bei uns sehen Sie Marken, die international für ihre Gestaltung und Verarbeitung bekannt sind. In unserem Showroom in Lochau (Vorarlberg) erleben Sie diese Marken im Zusammenspiel – und unsere Einrichtungsberatung hilft Ihnen dabei, aus einzelnen Stücken ein stimmiges Ganzes zu machen. |
| en | Discover with us the variety and exclusivity of brands known internationally for their outstanding reputation. We are proud to present our customers with brands that meet the highest standards and embody the essence of luxury and innovation. In our showroom in Lochau (Vorarlberg) you can experience these brands together in one place – and our interior design consultancy helps you turn individual pieces into a coherent whole. | With us you will find brands known internationally for their design and workmanship. In our showroom in Lochau (Vorarlberg) you can experience these brands together in one place – and our interior design consultancy helps you turn individual pieces into a coherent whole. |
| fr | Découvrez chez nous la diversité et l'exclusivité de marques reconnues à l'international pour leur réputation exceptionnelle. Nous sommes fiers de présenter à nos clients des marques qui répondent aux exigences les plus élevées et incarnent l'essence du luxe et de l'innovation. Dans notre showroom à Lochau (Vorarlberg), vous découvrez ces marques réunies en un seul lieu – et notre service de conseil en aménagement vous aide à composer un ensemble harmonieux. | Chez nous, vous trouvez des marques reconnues à l'international pour leur design et leur fabrication. Dans notre showroom à Lochau (Vorarlberg), vous découvrez ces marques réunies en un seul lieu – et notre service de conseil en aménagement vous aide à composer un ensemble harmonieux. |
| it | Scoprite da noi la varietà e l'esclusività di marchi conosciuti a livello internazionale per la loro straordinaria reputazione. Siamo orgogliosi di presentare ai nostri clienti marchi che soddisfano le esigenze più elevate e incarnano l'essenza del lusso e dell'innovazione. Nel nostro showroom di Lochau (Vorarlberg) potete vedere questi marchi in dialogo tra loro – e il nostro servizio di consulenza d'arredo vi aiuta a comporre un insieme armonioso. | Da noi trovate marchi conosciuti a livello internazionale per il loro design e la loro lavorazione. Nel nostro showroom di Lochau (Vorarlberg) potete vedere questi marchi in dialogo tra loro – e il nostro servizio di consulenza d'arredo vi aiuta a comporre un insieme armonioso. |

#### `TeamSection.paragraphs.0` – „exklusive Marken“, „großartig“

| Spr. | alt | neu |
|---|---|---|
| de | Begeisterung für exklusive Marken, ein feines Gespür für Design und ein ausgeprägtes Empfinden für Persönlichkeit – das und mehr eint unser großartiges Team. Jeder einzelne von uns bringt nicht nur Expertise und Leidenschaft für das, was wir tun, mit, sondern auch die Fähigkeit, individuelle Wünsche und Bedürfnisse zu verstehen und umzusetzen. | Begeisterung für gute Marken, ein feines Gespür für Design und ein Sinn für Persönlichkeit – das eint unser Team. Jede und jeder von uns bringt Erfahrung und Freude an der Arbeit mit, vor allem aber die Fähigkeit, Ihre Wünsche zu verstehen und umzusetzen. |
| en | A passion for exclusive brands, a keen sense for design, and a strong feeling for personality – this and more unites our amazing team. Each of us brings not only expertise and passion for what we do, but also the ability to understand and fulfill individual wishes and needs. | A passion for good brands, a keen sense for design and a feeling for personality – this is what unites our team. Each of us brings experience and enjoyment of the work, and above all the ability to understand your wishes and put them into practice. |
| fr | Une passion pour les marques exclusives, un sens aigu du design et une sensibilité particulière à la personnalité – voilà ce qui unit notre formidable équipe. Chacun d’entre nous apporte non seulement son expertise et sa passion pour ce que nous faisons, mais aussi la capacité de comprendre et de réaliser des souhaits et besoins individuels. | La passion des belles marques, un sens aigu du design et une sensibilité à la personnalité – voilà ce qui unit notre équipe. Chacun d’entre nous apporte son expérience et le plaisir de son métier, et surtout la capacité de comprendre vos souhaits et de les réaliser. |
| it | Passione per i marchi esclusivi, un occhio attento al design e una spiccata sensibilità per la personalità – questo e altro unisce il nostro straordinario team. Ognuno di noi porta non solo competenza e passione per ciò che fa, ma anche la capacità di comprendere e realizzare desideri e bisogni individuali. | Passione per i buoni marchi, un occhio attento al design e sensibilità per la personalità – questo unisce il nostro team. Ognuno di noi porta esperienza e piacere per il proprio lavoro, ma soprattutto la capacità di comprendere e realizzare i vostri desideri. |

#### `TeamSection.paragraphs.1` – „einzigartig“, „höchste Qualität“

| Spr. | alt | neu |
|---|---|---|
| de | Unser Team besteht aus erfahrenen Fachleuten, kreativen Köpfen und engagierten Persönlichkeiten, die sich täglich dafür einsetzen, Ihnen ein einzigartiges Erlebnis zu bieten. Gemeinsam arbeiten wir daran, höchste Qualität, innovative Ideen und persönliche Beratung miteinander zu vereinen. | Unser Team besteht aus erfahrenen Fachleuten, kreativen Köpfen und engagierten Persönlichkeiten, die sich jeden Tag Zeit für Sie nehmen. Gemeinsam verbinden wir sorgfältige Arbeit, gute Ideen und persönliche Beratung. |
| en | Our team consists of experienced professionals, creative minds, and dedicated personalities who work every day to offer you a unique experience. Together, we strive to unite the highest quality, innovative ideas, and personal consultation. | Our team consists of experienced professionals, creative minds and committed personalities who take time for you every day. Together we combine careful work, good ideas and personal advice. |
| fr | Notre équipe est composée de professionnels expérimentés, d’esprits créatifs et de personnalités engagées, qui travaillent chaque jour pour vous offrir une expérience unique. Ensemble, nous nous efforçons d’allier la plus haute qualité, des idées innovantes et des conseils personnalisés. | Notre équipe est composée de professionnels expérimentés, d’esprits créatifs et de personnalités engagées qui prennent chaque jour le temps de s’occuper de vous. Ensemble, nous allions travail soigné, bonnes idées et conseil personnalisé. |
| it | Il nostro team è composto da professionisti esperti, menti creative e personalità impegnate che si dedicano ogni giorno a offrirvi un'esperienza unica. Insieme lavoriamo per unire massima qualità, idee innovative e consulenza personale. | Il nostro team è composto da professionisti esperti, menti creative e personalità impegnate che ogni giorno si prendono tempo per voi. Insieme uniamo lavoro accurato, buone idee e consulenza personale. |

#### `TeamSection.paragraphs.2` – „Wohnträume“

| Spr. | alt | neu |
|---|---|---|
| de | Ob es um die Auswahl von Design-Highlights, die Planung Ihrer Wohnträume oder die Umsetzung spezieller Projekte geht – wir sind mit Herz und Verstand für Sie da. Für uns steht nicht nur die Ästhetik im Mittelpunkt, sondern vor allem die Verbindung zwischen Mensch und Raum, die wir mit unserer Arbeit schaffen möchten. | Ob es um die Auswahl einzelner Stücke, die Planung Ihrer Räume oder die Umsetzung besonderer Projekte geht – wir sind mit Herz und Verstand für Sie da. Für uns steht nicht nur die Ästhetik im Mittelpunkt, sondern vor allem die Verbindung zwischen Mensch und Raum, die wir mit unserer Arbeit schaffen möchten. |
| en | Whether it’s selecting design highlights, planning your living dreams, or realizing special projects – we’re here for you with heart and mind. For us, the focus is not only on aesthetics, but above all on the connection between people and space that we create with our work. | Whether it is choosing individual pieces, planning your rooms or realising special projects – we are there for you with heart and mind. For us, the focus is not only on aesthetics, but above all on the connection between people and space that we want to create with our work. |
| fr | Qu’il s’agisse de sélectionner des pièces design, de planifier vos rêves d’intérieur ou de réaliser des projets spéciaux – nous sommes là pour vous, avec cœur et raison. Pour nous, l’accent n’est pas seulement mis sur l’esthétique, mais surtout sur le lien entre l’homme et l’espace que nous souhaitons créer par notre travail. | Qu’il s’agisse de choisir des pièces, de planifier vos espaces ou de réaliser des projets particuliers – nous sommes là pour vous, avec cœur et raison. Pour nous, l’essentiel n’est pas seulement l’esthétique, mais surtout le lien entre l’homme et l’espace que nous souhaitons créer par notre travail. |
| it | Che si tratti di selezionare pezzi di design, pianificare i vostri sogni di arredamento o realizzare progetti speciali – siamo qui per voi con cuore e mente. Per noi il focus non è solo sull'estetica, ma soprattutto sul legame tra persona e spazio che vogliamo creare con il nostro lavoro. | Che si tratti di scegliere singoli pezzi, progettare i vostri spazi o realizzare progetti particolari – siamo qui per voi con cuore e mente. Per noi non conta solo l'estetica, ma soprattutto il legame tra persona e spazio che vogliamo creare con il nostro lavoro. |

#### `KarriereTeam.headline` – „exklusive“; Übersetzungen an DE angeglichen

| Spr. | alt | neu |
|---|---|---|
| de | Gestalten Sie mit uns exklusive Wohnwelten in Vorarlberg. | Gestalten Sie mit uns Wohnräume in Vorarlberg. |
| en | Apply with us as a full-time or part-time team member. | Shape living spaces in Vorarlberg with us. |
| fr | Postulez chez nous en tant qu’employé à temps plein ou à temps partiel. | Aménagez avec nous des intérieurs au Vorarlberg. |
| it | Candidati con noi come collaboratore a tempo pieno o part-time. | Progetta con noi spazi abitativi nel Vorarlberg. |

#### `KarriereTeam.paragraphs.0` – „exklusiv“; Übersetzungen angeglichen

| Spr. | alt | neu |
|---|---|---|
| de | Als exklusives Einrichtungsstudio in Lochau am Bodensee verwirklichen wir mit über 35 Premium-Marken – von Minotti bis Poliform – die Wohnträume anspruchsvoller Bauherren in ganz Vorarlberg und Österreich. | Als Einrichtungsstudio in Lochau am Bodensee planen wir mit über 35 Premium-Marken – von Minotti bis Poliform – Einrichtungen für anspruchsvolle Bauherren in ganz Vorarlberg und Österreich. |
| en | At Platzhirsch Home Living, our mission is to fulfill the interior dreams of discerning clients with a keen sense of style, exclusivity, and quality. | As an interior studio in Lochau on Lake Constance, we plan interiors with more than 35 premium brands – from Minotti to Poliform – for discerning clients across Vorarlberg and Austria. |
| fr | Chez Platzhirsch Home Living, notre objectif est de réaliser les rêves d’aménagement des clients exigeants avec style, exclusivité et qualité. | Studio d’aménagement à Lochau, au bord du lac de Constance, nous planifions des intérieurs avec plus de 35 marques premium – de Minotti à Poliform – pour des clients exigeants dans tout le Vorarlberg et en Autriche. |
| it | Da Platzhirsch Home Living, il nostro obiettivo è realizzare i sogni abitativi dei clienti più esigenti con stile, esclusività e qualità. | Come studio d’arredamento a Lochau sul Lago di Costanza progettiamo interni con oltre 35 marchi premium – da Minotti a Poliform – per clienti esigenti in tutto il Vorarlberg e in Austria. |

#### `KarriereTeam.paragraphs.1` – „exzellent“, EN/FR/IT „garantieren“

| Spr. | alt | neu |
|---|---|---|
| de | Von der ersten Einrichtungsberatung bis zur fertigen Interior-Design-Lösung begleiten wir unsere Kundinnen und Kunden aus einer Hand – mit exzellenter Beratung, maßgeschneiderten Konzepten und einer Leidenschaft für hochwertiges Design. | Von der ersten Einrichtungsberatung bis zur fertigen Interior-Design-Lösung begleiten wir unsere Kundinnen und Kunden aus einer Hand – mit sorgfältiger Beratung, maßgeschneiderten Konzepten und einer Leidenschaft für hochwertiges Design. |
| en | We offer our clients comprehensive support from the first contact to handing over the keys – and beyond. We stand for excellent advice, bespoke solutions, and an unwavering passion for high-quality design. | From the first consultation to the finished interior design solution, we support our clients from a single source – with careful advice, tailored concepts and a passion for high-quality design. |
| fr | Nous offrons à nos clients un accompagnement complet, du premier contact à la remise des clés – et au-delà. Nous garantissons des conseils d’excellence, des solutions sur mesure et une passion sans faille pour le design haut de gamme. | Du premier conseil à la solution d’aménagement aboutie, nous accompagnons nos clients de A à Z – avec un conseil attentif, des concepts sur mesure et la passion du design de qualité. |
| it | Offriamo ai nostri clienti un supporto completo dal primo contatto alla consegna delle chiavi – e oltre. Garantiamo consulenza eccellente, soluzioni su misura e una passione inesauribile per il design di alta qualità. | Dalla prima consulenza alla soluzione d’interior design finita accompagniamo i nostri clienti da un unico interlocutore – con una consulenza accurata, concetti su misura e la passione per il design di qualità. |

#### `KarriereTeam.paragraphs.2` – „exklusive“, EN/FR/IT „das Beste“

| Spr. | alt | neu |
|---|---|---|
| de | Für unser Team in Vorarlberg suchen wir kreative, engagierte Persönlichkeiten, die unsere Begeisterung für Wohnkultur, Designermöbel und exklusive Innenarchitektur teilen – in Voll- oder Teilzeit. | Für unser Team in Vorarlberg suchen wir kreative, engagierte Persönlichkeiten, die unsere Begeisterung für Wohnkultur, Designermöbel und Innenarchitektur teilen – in Voll- oder Teilzeit. |
| en | Our work is based on strong values: team spirit, innovation, and the desire to always achieve the best for our clients. To realize this vision, we are looking for talented, creative, and dedicated personalities who share our passion for home culture and design. | For our team in Vorarlberg we are looking for creative, committed people who share our enthusiasm for living culture, designer furniture and interior architecture – full-time or part-time. |
| fr | Notre travail repose sur des valeurs claires : esprit d’équipe, innovation et volonté d’offrir le meilleur à nos clients. Pour réaliser cette vision, nous recherchons des personnalités talentueuses, créatives et engagées, partageant notre passion pour l’aménagement et le design. | Pour notre équipe au Vorarlberg, nous recherchons des personnalités créatives et engagées qui partagent notre enthousiasme pour l’art de vivre, le mobilier design et l’architecture d’intérieur – à temps plein ou à temps partiel. |
| it | Il nostro lavoro si basa su valori forti: spirito di squadra, innovazione e il desiderio di offrire sempre il meglio ai nostri clienti. Per realizzare questa visione, cerchiamo persone talentuose, creative e motivate che condividano la nostra passione per l’arredo e il design. | Per il nostro team nel Vorarlberg cerchiamo persone creative e motivate che condividano il nostro entusiasmo per la cultura dell’abitare, i mobili di design e l’architettura d’interni – a tempo pieno o part-time. |

#### `KarriereTeam.paragraphs.4` – Ausrufezeichen

| Spr. | alt | neu |
|---|---|---|
| de | Dann freuen wir uns darauf, Sie kennenzulernen! | Dann freuen wir uns darauf, Sie kennenzulernen. |
| en | Then you are exactly right with us! | Then we look forward to meeting you. |
| fr | Alors vous êtes exactement à la bonne adresse ! | Nous serons alors ravis de faire votre connaissance. |
| it | Allora sei nel posto giusto! | Allora saremo lieti di conoscerti. |

#### `KarrierePosition.helmut.bullets.1` – „exklusiv“ bei Marken (R-A3)

| Spr. | alt | neu |
|---|---|---|
| de | Arbeit mit über 35 exklusiven Designmarken in einem modernen Studio | Arbeit mit über 35 internationalen Designmarken in einem modernen Studio |

#### `Press.description` – §10 „exklusives Bildmaterial“, Füllfloskeln

| Spr. | alt | neu |
|---|---|---|
| de | Pressebereich – Immer auf dem neuesten Stand. Hier finden Sie aktuelle Informationen, Pressemitteilungen und spannende Neuigkeiten rund um unser Unternehmen, unsere exklusiven Marken und unsere neuesten Projekte. Ob es sich um Produktinnovationen, besondere Events oder Kooperationen mit renommierten Partnern handelt – wir halten Sie über alles auf dem Laufenden, was bei uns passiert. Unser Ziel ist es, Transparenz zu schaffen und Ihnen einen umfassenden Einblick in unsere Arbeit und unsere Werte zu bieten. Als vertrauenswürdige Quelle für hochwertige Designlösungen und inspirierende Wohnideen teilen wir unsere Vision und Leidenschaft mit der Welt.Unser Pressebereich ist der zentrale Anlaufpunkt für Medienvertreter, Designer und Interessierte, die mehr über unsere Marke erfahren möchten. Hier stellen wir Ihnen nicht nur Pressemitteilungen zur Verfügung, sondern auch exklusives Bildmaterial, weiterführende Informationen und detaillierte Einblicke in unsere Projekte und Partnerschaften. Wir legen großen Wert darauf, die Geschichte hinter unseren Produkten und Projekten zu erzählen. Unsere Pressearbeit spiegelt die Leidenschaft und Kreativität wider, die unser Unternehmen auszeichnet, und wir freuen uns, unsere Reise mit Ihnen zu teilen. Wenn Sie Fragen haben oder zusätzliche Materialien benötigen, stehen wir Ihnen jederzeit gerne zur Verfügung. | Pressebereich. Hier finden Sie Pressemitteilungen und Neuigkeiten zu Platzhirsch Home Living, zu den Marken in unserer Ausstellung und zu unseren Projekten – von neuen Kollektionen über Veranstaltungen bis zur Zusammenarbeit mit unseren Partnerbetrieben. Der Pressebereich richtet sich an Medienvertreter, Designer und alle, die mehr über uns erfahren möchten. Neben Pressemitteilungen stellen wir Bildmaterial bereit, soweit wir es weitergeben dürfen, dazu weiterführende Informationen zu unseren Projekten. Wir erzählen gern die Geschichte hinter unseren Produkten und Projekten. Wenn Sie Fragen haben oder zusätzliche Unterlagen benötigen, sind wir gern für Sie da. |
| en | Press area - Always up to date. Here you will find current information, press releases and exciting news about our company, our exclusive brands and our latest projects. Whether it's product innovations, special events or collaborations with renowned partners - we keep you informed about everything that's happening with us. Our goal is to create transparency and give you a comprehensive insight into our work and our values. As a trusted source for high-quality design solutions and inspiring living ideas, we share our vision and passion with the world.Our press area is the central point of contact for media representatives, designers and anyone interested in learning more about our brand. Here we provide not only press releases but also exclusive images, additional information and detailed insights into our projects and partnerships. We place great emphasis on telling the story behind our products and projects. Our press work reflects the passion and creativity that distinguishes our company, and we look forward to sharing our journey with you. If you have any questions or need additional materials, we are always happy to help. | Press area. Here you will find press releases and news about Platzhirsch Home Living, the brands in our exhibition and our projects – from new collections and events to our work with partner businesses. The press area is for journalists, designers and anyone who would like to learn more about us. Alongside press releases we provide images, where we are permitted to pass them on, and further information about our projects. We are happy to tell the story behind our products and projects. If you have any questions or need additional material, we are glad to help. |
| fr | Espace presse - Toujours à jour. Vous trouverez ici des informations actuelles, des communiqués de presse et des nouvelles passionnantes sur notre entreprise, nos marques exclusives et nos derniers projets. Qu'il s'agisse d'innovations produits, d'événements spéciaux ou de collaborations avec des partenaires renommés, nous vous tenons informés de tout ce qui se passe chez nous. Notre objectif est de créer de la transparence et de vous donner un aperçu complet de notre travail et de nos valeurs. En tant que source fiable de solutions de design de haute qualité et d'idées d'habitation inspirantes, nous partageons notre vision et notre passion avec le monde.Notre espace presse est le point de contact central pour les représentants des médias, les designers et toute personne souhaitant en savoir plus sur notre marque. Nous y mettons à disposition non seulement des communiqués de presse, mais aussi des images exclusives, des informations complémentaires et des aperçus détaillés de nos projets et partenariats. Nous accordons une grande importance à raconter l'histoire derrière nos produits et projets. Notre travail de presse reflète la passion et la créativité qui caractérisent notre entreprise, et nous sommes ravis de partager notre parcours avec vous. Si vous avez des questions ou besoin de documents supplémentaires, nous sommes toujours à votre disposition. | Espace presse. Vous trouverez ici les communiqués de presse et les actualités de Platzhirsch Home Living, des marques de notre exposition et de nos projets – des nouvelles collections aux événements, en passant par notre collaboration avec nos entreprises partenaires. L’espace presse s’adresse aux journalistes, aux designers et à toute personne souhaitant mieux nous connaître. En plus des communiqués, nous mettons à disposition des images, dans la mesure où nous sommes autorisés à les transmettre, ainsi que des informations complémentaires sur nos projets. Nous aimons raconter l’histoire derrière nos produits et nos projets. Pour toute question ou tout document supplémentaire, nous restons à votre disposition. |
| it | Area stampa - Sempre aggiornata. Qui troverete informazioni attuali, comunicati stampa e notizie interessanti sulla nostra azienda, sui nostri marchi esclusivi e sui nostri ultimi progetti. Che si tratti di innovazioni di prodotto, eventi speciali o collaborazioni con partner rinomati, vi terremo informati su tutto ciò che accade da noi. Il nostro obiettivo è creare trasparenza e offrirvi una visione completa del nostro lavoro e dei nostri valori. Come fonte affidabile per soluzioni di design di alta qualità e idee abitative stimolanti, condividiamo la nostra visione e passione con il mondo.La nostra area stampa è il punto di contatto centrale per i rappresentanti dei media, i designer e chiunque sia interessato a saperne di più sul nostro marchio. Qui non solo forniamo comunicati stampa, ma anche immagini esclusive, informazioni aggiuntive e approfondimenti dettagliati sui nostri progetti e partnership. Poniamo grande enfasi nel raccontare la storia dietro i nostri prodotti e progetti. Il nostro lavoro con la stampa riflette la passione e la creatività che contraddistinguono la nostra azienda, e siamo lieti di condividere il nostro percorso con voi. Se avete domande o avete bisogno di materiali aggiuntivi, siamo sempre a vostra disposizione. | Area stampa. Qui trovate comunicati stampa e notizie su Platzhirsch Home Living, sui marchi della nostra esposizione e sui nostri progetti – dalle nuove collezioni agli eventi, fino alla collaborazione con le nostre aziende partner. L’area stampa si rivolge a giornalisti, designer e a chiunque voglia conoscerci meglio. Oltre ai comunicati mettiamo a disposizione immagini, nella misura in cui possiamo cederle, e ulteriori informazioni sui nostri progetti. Raccontiamo volentieri la storia dietro i nostri prodotti e progetti. Per domande o materiale aggiuntivo siamo a vostra disposizione. |

#### `partners.1.role` – „exklusiv“

| Spr. | alt | neu |
|---|---|---|
| de | Partner für exklusive Immobilien in Lindau | Partner für hochwertige Immobilien in Lindau |
| en | Partner for exclusive real estate in Lindau | Partner for high-end real estate in Lindau |
| fr | Partenaire pour l'immobilier exclusif à Lindau | Partenaire pour l'immobilier haut de gamme à Lindau |
| it | Partner per immobili esclusivi a Lindau | Partner per immobili di pregio a Lindau |

#### `partners.description` – „exklusiv“

| Spr. | alt | neu |
|---|---|---|
| de | Bei Platzhirsch Home Living planen und gestalten wir exklusive Räume und Orte. Unsere Projekte realisieren wir mit ausgewählten Partnern. | Bei Platzhirsch Home Living planen und gestalten wir Räume und Orte. Unsere Projekte realisieren wir mit ausgewählten Partnerbetrieben. |
| en | At Platzhirsch Home Living, we design exclusive spaces and places. We realize our projects with selected partners. | At Platzhirsch Home Living, we plan and design rooms and places. We realise our projects with selected partner businesses. |
| fr | Chez Platzhirsch Home Living, nous concevons et aménageons des espaces exclusifs. Nos projets sont réalisés avec des partenaires soigneusement sélectionnés. | Chez Platzhirsch Home Living, nous concevons et aménageons des espaces et des lieux. Nous réalisons nos projets avec des entreprises partenaires choisies. |
| it | Da Platzhirsch Home Living progettiamo e realizziamo spazi esclusivi. I nostri progetti sono sviluppati con partner selezionati. | Da Platzhirsch Home Living progettiamo e realizziamo spazi e luoghi. I nostri progetti nascono insieme ad aziende partner selezionate. |

#### `JobsDetails.applySuccess` – Ausrufezeichen (Bibel §1)

| Spr. | alt | neu |
|---|---|---|
| de | Vielen Dank für Ihre Bewerbung! Wir werden uns in Kürze bei Ihnen melden. | Vielen Dank für Ihre Bewerbung. Wir melden uns in Kürze bei Ihnen. |
| en | Thank you for your application! We will contact you shortly. | Thank you for your application. We will be in touch shortly. |
| fr | Merci pour votre candidature ! Nous vous contacterons bientôt. | Merci pour votre candidature. Nous vous contacterons prochainement. |
| it | Grazie per la tua candidatura! Ti contatteremo a breve. | Grazie per la tua candidatura. Ti contatteremo a breve. |

#### `MultiStepForm.thankYou` – Ausrufezeichen (Bibel §1)

| Spr. | alt | neu |
|---|---|---|
| de | Vielen Dank für Ihre Anfrage! Wir melden uns in Kürze bei Ihnen. | Vielen Dank für Ihre Anfrage. Wir melden uns in Kürze bei Ihnen. |
| en | Thank you for your inquiry! We will contact you shortly. | Thank you for your enquiry. We will be in touch shortly. |
| fr | Merci pour votre demande ! Nous vous contacterons bientôt. | Merci pour votre demande. Nous vous contacterons prochainement. |
| it | Grazie per la sua richiesta! La contatteremo a breve. | Grazie per la sua richiesta. La contatteremo a breve. |

#### `contact.formSuccess` – Ausrufezeichen (Bibel §1)

| Spr. | alt | neu |
|---|---|---|
| de | Vielen Dank für Ihre Anfrage! Wir melden uns in Kürze bei Ihnen. | Vielen Dank für Ihre Anfrage. Wir melden uns in Kürze bei Ihnen. |
| en | Thank you for your inquiry! We will contact you shortly. | Thank you for your enquiry. We will be in touch shortly. |
| fr | Merci pour votre demande ! Nous vous contacterons prochainement. | Merci pour votre demande. Nous vous contacterons prochainement. |
| it | Grazie per la tua richiesta! Ti contatteremo al più presto. | Grazie per la tua richiesta. Ti contatteremo al più presto. |

#### `contact.welcomeMsg` – Ausrufezeichen (Bibel §1)

| Spr. | alt | neu |
|---|---|---|
| de | Wir freuen uns auf Ihre Nachricht und stehen Ihnen gerne zur Verfügung! | Wir freuen uns auf Ihre Nachricht und sind gern für Sie da. |
| en | We look forward to your message and are happy to assist you! | We look forward to your message and are happy to help. |
| fr | Nous attendons votre message avec impatience et sommes à votre disposition ! | Nous attendons votre message et restons à votre disposition. |
| it | Attendiamo il tuo messaggio e siamo a tua disposizione! | Attendiamo il tuo messaggio e siamo a tua disposizione. |

#### `newsletter.intro1` – Ausrufezeichen (Bibel §1)

| Spr. | alt | neu |
|---|---|---|
| de | Bleiben Sie informiert – mit dem Platzhirsch Home Living Newsletter! | Bleiben Sie informiert – mit dem Newsletter von Platzhirsch Home Living. |
| en | Stay informed – with the Platzhirsch Home Living Newsletter! | Stay informed – with the Platzhirsch Home Living newsletter. |
| fr | Restez informé – avec la newsletter Platzhirsch Home Living ! | Restez informé – avec la newsletter de Platzhirsch Home Living. |
| it | Rimani informato – con la newsletter di Platzhirsch Home Living! | Rimani informato – con la newsletter di Platzhirsch Home Living. |

#### `newsletter.intro2` – P3 „exklusive Angebote“

| Spr. | alt | neu |
|---|---|---|
| de | Erhalten Sie regelmäßig spannende Einblicke in die Welt des Platzhirsch Home Livings und lassen Sie sich von unseren exklusiven Angeboten, kreativen Wohnideen und inspirierenden Designs begeistern. Ob neue Kollektionen, Events oder spezielle Aktionen – mit unserem Newsletter sind Sie immer einen Schritt voraus. | Erhalten Sie regelmäßig Einblicke in die Welt von Platzhirsch Home Living: neue Kollektionen in unserer Ausstellung, Wohnideen, Veranstaltungen und Hinweise auf Aktionen im Showroom. |
| en | Receive regular insights into the world of Platzhirsch Home Living and be inspired by our exclusive offers, creative living ideas, and inspiring designs. Whether new collections, events, or special promotions – with our newsletter, you are always one step ahead. | Receive regular insights into the world of Platzhirsch Home Living: new collections in our exhibition, living ideas, events and notes on promotions in the showroom. |
| fr | Recevez régulièrement des aperçus passionnants de l'univers du Platzhirsch Home Living et laissez-vous inspirer par nos offres exclusives, nos idées d'aménagement créatives et nos designs inspirants. Nouvelles collections, événements ou promotions spéciales – avec notre newsletter, vous avez toujours une longueur d'avance. | Recevez régulièrement un aperçu de l'univers de Platzhirsch Home Living : nouvelles collections de notre exposition, idées d'aménagement, événements et informations sur les actions au showroom. |
| it | Ricevi regolarmente approfondimenti nel mondo di Platzhirsch Home Living e lasciati ispirare dalle nostre offerte esclusive, idee d’arredo creative e design stimolanti. Nuove collezioni, eventi o promozioni speciali – con la nostra newsletter sei sempre un passo avanti. | Ricevi regolarmente uno sguardo sul mondo di Platzhirsch Home Living: nuove collezioni in esposizione, idee d’arredo, eventi e informazioni sulle iniziative in showroom. |

#### `newsletter.reasons1` – „Exklusive Einblicke“, „Seien Sie die Ersten“

| Spr. | alt | neu |
|---|---|---|
| de | Exklusive Einblicke: Seien Sie die Ersten, die über neue Möbelstücke, Designtrends und unsere beeindruckenden Ausstellungen informiert werden. | Neuheiten: Erfahren Sie früh von neuen Möbelstücken, Designthemen und Ausstellungen in unserem Showroom. |
| en | Exclusive insights: Be the first to learn about new furniture, design trends, and our impressive exhibitions. | New arrivals: Hear early about new pieces, design topics and exhibitions in our showroom. |
| fr | Aperçus exclusifs : Soyez les premiers informés des nouveaux meubles, tendances design et nos expositions impressionnantes. | Nouveautés : soyez informé tôt des nouvelles pièces, des thèmes design et des expositions de notre showroom. |
| it | Anteprime esclusive: Sii il primo a conoscere nuovi mobili, tendenze di design e le nostre mostre impressionanti. | Novità: scopri per tempo nuovi pezzi, temi di design e mostre nel nostro showroom. |

#### `newsletter.reasons3` – P3 Newsletter-Rabatte unbelegt

| Spr. | alt | neu |
|---|---|---|
| de | Attraktive Angebote: Profitieren Sie von Rabatten und Aktionen, die nur für unsere Newsletter-Abonnenten zugänglich sind. | Aktionen im Showroom: Wir informieren Sie, wenn in unserem Showroom eine Aktion läuft. |
| en | Attractive offers: Benefit from discounts and promotions available only to newsletter subscribers. | Showroom promotions: We let you know when a promotion is running in our showroom. |
| fr | Offres attractives : Profitez de réductions et d'offres réservées aux abonnés à la newsletter. | Actions au showroom : nous vous informons lorsqu'une action a lieu dans notre showroom. |
| it | Offerte vantaggiose: Approfitta di sconti e promozioni riservate solo agli iscritti alla newsletter. | Iniziative in showroom: ti informiamo quando nel nostro showroom è in corso un’iniziativa. |

#### `newsletter.reasons4` – „exklusive Veranstaltungen“

| Spr. | alt | neu |
|---|---|---|
| de | Einladungen zu Events: Erhalten Sie persönliche Einladungen zu exklusiven Veranstaltungen und 360-Grad-Touren. | Einladungen zu Events: Erhalten Sie persönliche Einladungen zu Veranstaltungen und 360-Grad-Touren. |
| en | Event invitations: Receive personal invitations to exclusive events and 360-degree tours. | Event invitations: Receive personal invitations to events and 360-degree tours. |
| fr | Invitations à des événements : Recevez des invitations personnelles à des événements exclusifs et des visites à 360°. | Invitations à des événements : recevez des invitations personnelles à nos événements et visites à 360°. |
| it | Inviti a eventi: Ricevi inviti personali a eventi esclusivi e tour a 360 gradi. | Inviti a eventi: ricevi inviti personali a eventi e tour a 360 gradi. |

#### `newsletter.outro` – Ausrufezeichen (Bibel §1)

| Spr. | alt | neu |
|---|---|---|
| de | Lassen Sie sich inspirieren und werden Sie Teil der Platzhirsch Home Living Community – wir freuen uns darauf, Sie in unserem Newsletter begrüßen zu dürfen! | Lassen Sie sich inspirieren – wir freuen uns, Sie in unserem Newsletter begrüßen zu dürfen. |
| en | Get inspired and become part of the Platzhirsch Home Living community – we look forward to welcoming you to our newsletter! | Get inspired – we look forward to welcoming you to our newsletter. |
| fr | Laissez-vous inspirer et rejoignez la communauté Platzhirsch Home Living – nous nous réjouissons de vous accueillir dans notre newsletter ! | Laissez-vous inspirer – nous nous réjouissons de vous accueillir dans notre newsletter. |
| it | Lasciati ispirare ed entra a far parte della community di Platzhirsch Home Living – saremo lieti di darti il benvenuto nella nostra newsletter! | Lasciati ispirare – saremo lieti di darti il benvenuto nella nostra newsletter. |

#### `newsletter.success` – Ausrufezeichen (Bibel §1)

| Spr. | alt | neu |
|---|---|---|
| de | Danke! Sie sind jetzt für unseren Newsletter angemeldet. | Danke. Sie sind jetzt für unseren Newsletter angemeldet. |
| en | Thank you! You are now subscribed to our newsletter. | Thank you. You are now subscribed to our newsletter. |
| fr | Merci ! Vous êtes maintenant abonné à notre newsletter. | Merci. Vous êtes maintenant abonné à notre newsletter. |
| it | Grazie! Ora sei iscritto alla nostra newsletter. | Grazie. Ora sei iscritto alla nostra newsletter. |

#### `enquiry.success.submitted` – Ausrufezeichen (Bibel §1)

| Spr. | alt | neu |
|---|---|---|
| de | Ihre Anfrage wurde erfolgreich gesendet! | Ihre Anfrage wurde gesendet. |
| en | Your request has been submitted successfully! | Your request has been sent. |
| fr | Votre demande a été envoyée avec succès ! | Votre demande a été envoyée. |
| it | La tua richiesta è stata inviata con successo! | La tua richiesta è stata inviata. |

#### `error404.headline` – Ausrufezeichen (Bibel §1)

| Spr. | alt | neu |
|---|---|---|
| de | Hoppla! Seite nicht gefunden. | Seite nicht gefunden. |
| en | Oops! Page not found. | Page not found. |
| fr | Oups ! Page non trouvée. | Page introuvable. |
| it | Ops! Pagina non trovata. | Pagina non trovata. |

#### `news.news1Desc` – A5 „exklusive Outdoor-Kollektionen von Minotti“

| Spr. | alt | neu |
|---|---|---|
| de | Erweitern Sie Ihren Innenbereich mit den exklusiven Outdoor-Kollektionen von Minotti, Solpuri und EMU. | Erweitern Sie Ihren Wohnraum nach draußen – mit den Outdoor-Kollektionen von Minotti, Solpuri und EMU. |
| en | Expand your indoor space with the exclusive outdoor collections from Minotti, Solpuri and EMU. | Extend your living space outdoors – with the outdoor collections by Minotti, Solpuri and EMU. |
| fr | Agrandissez votre espace intérieur avec les collections extérieures exclusives de Minotti, Solpuri et EMU. | Prolongez votre espace de vie à l'extérieur – avec les collections outdoor de Minotti, Solpuri et EMU. |
| it | Amplia il tuo spazio interno con le esclusive collezioni da esterno di Minotti, Solpuri e EMU. | Porta il tuo spazio abitativo all'esterno – con le collezioni outdoor di Minotti, Solpuri ed EMU. |

#### `news.news2Desc` – A5

| Spr. | alt | neu |
|---|---|---|
| de | Wir berichten von der Salone del Mobile 2024 und stellen Ihnen exklusive Möbel für den Außenbereich vor. | Wir berichten von der Salone del Mobile 2024 und stellen Ihnen neue Möbel für den Außenbereich vor. |
| en | We report from Salone del Mobile 2024 and present you exclusive outdoor furniture. | We report from Salone del Mobile 2024 and present new outdoor furniture. |
| fr | Nous rapportons du Salone del Mobile 2024 et vous présentons des meubles d'extérieur exclusifs. | Nous revenons sur le Salone del Mobile 2024 et vous présentons de nouveaux meubles d'extérieur. |
| it | Vi raccontiamo il Salone del Mobile 2024 e vi presentiamo esclusivi mobili da esterno. | Vi raccontiamo il Salone del Mobile 2024 e vi presentiamo nuovi mobili da esterno. |

#### `brand.officialWebsite` – H8 klarer: Herstellerseite

| Spr. | alt | neu |
|---|---|---|
| de | Offizielle Website | Website des Herstellers |
| en | Official Website | Manufacturer's website |
| fr | Site officiel | Site du fabricant |
| it | Sito ufficiale | Sito del produttore |

#### `marken.officialWebsite` – H8

| Spr. | alt | neu |
|---|---|---|
| de | Offizielle Website | Website des Herstellers |
| en | Official Website | Manufacturer's website |
| fr | Site officiel | Site du fabricant |
| it | Sito ufficiale | Sito del produttore |

#### `ProductsPage.description` – „exklusiv“ bei Marken

| Spr. | alt | neu |
|---|---|---|
| de | Verlängern Sie Ihr Wohnzimmer nach draußen mit exklusiven Outdoormöbeln von Minotti, Paola Lenti, Solpuri & mehr. Stil, Komfort und Wetterbeständigkeit vereint. | Verlängern Sie Ihr Wohnzimmer nach draußen – mit Outdoormöbeln von Minotti, Paola Lenti, Solpuri und weiteren Marken. Stil, Komfort und Materialien für den Außenbereich. |
| en | Extend your living room outdoors with exclusive furniture from Minotti, Paola Lenti, Solpuri & more. Style, comfort, and weather resistance combined. | Extend your living room outdoors – with outdoor furniture by Minotti, Paola Lenti, Solpuri and other brands. Style, comfort and materials made for outdoor use. |
| fr | Prolongez votre salon à l'extérieur avec des meubles exclusifs de Minotti, Paola Lenti, Solpuri et plus encore. Style, confort et résistance aux intempéries combinés. | Prolongez votre salon à l'extérieur – avec des meubles d'extérieur de Minotti, Paola Lenti, Solpuri et d'autres marques. Style, confort et matériaux pensés pour l'extérieur. |
| it | Estendi il tuo soggiorno all'esterno con mobili esclusivi di Minotti, Paola Lenti, Solpuri e altri. Stile, comfort e resistenza agli agenti atmosferici combinati. | Porta il tuo soggiorno all'esterno – con mobili da esterno di Minotti, Paola Lenti, Solpuri e altri marchi. Stile, comfort e materiali pensati per l'esterno. |

#### `ProductsPage.twitterDescription` – „exklusiv“

| Spr. | alt | neu |
|---|---|---|
| de | Exklusive Terrassen- & Gartenmöbel – entdecken Sie unsere Outdoor-Welten. | Terrassen- & Gartenmöbel – entdecken Sie unsere Outdoor-Welten. |
| en | Exclusive terrace & garden furniture – discover our outdoor worlds. | Terrace & garden furniture – discover our outdoor worlds. |
| fr | Meubles exclusifs pour terrasses et jardins – découvrez nos mondes extérieurs. | Meubles de terrasse et de jardin – découvrez nos univers extérieurs. |
| it | Mobili esclusivi per terrazze e giardini – scopri i nostri mondi esterni. | Mobili per terrazze e giardini – scopri i nostri mondi outdoor. |

#### `Cookies.bannerText` – Superlativ „das beste“

| Spr. | alt | neu |
|---|---|---|
| de | Wir verwenden Cookies, um Ihnen das beste Nutzererlebnis bieten zu können. | Wir verwenden Cookies, um Ihnen ein gutes Nutzererlebnis bieten zu können. |
| en | We use cookies to give you the best possible user experience. | We use cookies to give you a good user experience. |
| fr | Nous utilisons des cookies afin de vous offrir la meilleure expérience utilisateur possible. | Nous utilisons des cookies afin de vous offrir une bonne expérience utilisateur. |
| it | Utilizziamo i cookie per offrirti la migliore esperienza di navigazione possibile. | Utilizziamo i cookie per offrirti una buona esperienza di navigazione. |

#### `KarriereTeam.paragraphs.3` – Übersetzungen an DE angeglichen

| Spr. | alt | neu |
|---|---|---|
| en | Are you creative, experienced in kitchen planning, and want to pursue your passion for beautiful interiors? | Interior consulting, interior design or kitchen planning: if you bring experience in high-end furniture and interiors and love beautiful rooms, you will feel at home with us. |
| fr | Vous êtes créatif, avez de l’expérience dans la conception de cuisines et souhaitez vivre pleinement votre passion pour les intérieurs élégants ? | Conseil en aménagement, architecture d’intérieur ou conception de cuisines : si vous avez de l’expérience dans l’ameublement haut de gamme et aimez les beaux intérieurs, vous êtes à la bonne adresse. |
| it | Sei creativo, hai esperienza nella progettazione di cucine e vuoi vivere la tua passione per gli interni eleganti? | Consulenza d’arredo, interior design o progettazione di cucine: se hai esperienza nell’arredamento di alta gamma e ami gli interni belli, sei nel posto giusto. |

#### `article.news1Desc` – A5 (EN-Zwilling)

| Spr. | alt | neu |
|---|---|---|
| en | Expand your indoor space with the exclusive outdoor collections from Minotti, Solpuri and EMU. | Extend your living space outdoors – with the outdoor collections by Minotti, Solpuri and EMU. |

#### `article.news2Desc` – A5 (EN-Zwilling)

| Spr. | alt | neu |
|---|---|---|
| en | We report from Salone del Mobile 2024 and present you exclusive outdoor furniture. | We report from Salone del Mobile 2024 and present new outdoor furniture. |

#### `about.ausstellung.tourDesc2` – IT „più esclusivi“, „unica“, „perfetta“

| Spr. | alt | neu |
|---|---|---|
| it | Muovetevi liberamente nei nostri spazi curati nei minimi dettagli, osservate da vicino i nostri pezzi di design più esclusivi e percepite l'atmosfera unica del nostro studio sul Lago di Costanza. Che siate alla ricerca di nuove idee d'arredo, di un'anteprima delle nostre collezioni o semplicemente di ispirazione – il tour a 360° è l'introduzione perfetta alla vostra visita nel Vorarlberg, in Austria. | Muovetevi liberamente nei nostri spazi curati nei minimi dettagli, osservate da vicino i nostri pezzi di design e percepite l'atmosfera del nostro studio sul Lago di Costanza. Che siate alla ricerca di nuove idee d'arredo, di un'anteprima delle nostre collezioni o semplicemente di ispirazione – il tour a 360° è un buon modo per prepararvi alla vostra visita nel Vorarlberg, in Austria. |

#### `services.kitchenPlannerDesc` – R-L2 „schnelle Lieferung“, „bestes Angebot/miglior prezzo“ (nur EN/FR/IT vorhanden, im Code ungenutzt)

| Spr. | alt | neu |
|---|---|---|
| en | Enjoy fast delivery with our service. Receive interior/exterior furniture for house as quickly as you want with the best offer. | Kitchen planning in Lochau: we plan your kitchen with you, from measuring the room to assembly. Delivery times are confirmed in the order confirmation. |
| fr | Profitez d'une livraison rapide avec notre service. Recevez vos meubles d'intérieur/extérieur aussi vite que vous le souhaitez avec la meilleure offre. | Conception de cuisine à Lochau : nous planifions votre cuisine avec vous, de la prise de mesures au montage. Les délais de livraison sont confirmés dans la confirmation de commande. |
| it | Goditi una consegna veloce con il nostro servizio. Ricevi mobili per interni/esterni per la casa rapidamente e al miglior prezzo. | Progettazione cucine a Lochau: progettiamo la tua cucina con te, dal rilievo delle misure al montaggio. I tempi di consegna vengono confermati nella conferma d'ordine. |
