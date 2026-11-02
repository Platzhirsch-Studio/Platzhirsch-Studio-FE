# 09 – Local SEO und Reputation: Bauplan

**Stand:** 26.10.2026 · **Rolle:** Local-SEO (Google Maps, Google-Unternehmensprofil) für AT, DE, CH und FL
**Grundlage:** Code im Repo (Stand `main`, 96e4f50), Berichte 00, 01, 20, 23 und 25, eigene Prüfung im Web (OpenStreetMap/BEV, Herold, Wanderlog-Spiegel der Google-Daten, Websites der Wettbewerber)
**Regel:** Dieser Bauplan ändert keinen Code. Er sagt, was zu bauen ist und in welcher Reihenfolge.

> **Kurz:** Das Unternehmensprofil, die Bewertungen und eine einheitliche Adresse sind die drei Hebel, an denen Platzhirsch im Local Pack heute verliert. Nichts davon braucht das Backoffice. Ein großer Teil braucht nicht einmal Code, sondern zwei Stunden Arbeit im Profil und bei Herold. Der wichtigste neue Befund: **Die amtliche Adresse des Studios ist Landstraße 9. Landstraße 11 ist das Café.** Google und Herold führen das Studio falsch unter 11.

---

## 1. Ist-Zustand

### 1.1 Im Code

| Thema | Stand | Datei |
|---|---|---|
| Stammdaten (NAP) | `ADDRESS.street = "Landstraße 9"`, Telefon `+43 5574 46255`, Geo-Pin 47.5302782 / 9.7517183, Route-Link. Kommentar: „single source of truth“ | `src/lib/site.js` |
| **Adresse trotzdem hart kodiert** | ca. 25 Stellen schreiben „Landstraße 9“ selbst aus, teils als „Landstrasse 9“: JSON-LD, Impressum, Datenschutz, Kontakt-Karte, Navbar, Landing-Komponente, alle Stadtseiten-FAQs, `homeSeo.js`, `partner.js`, alle 4 Sprachdateien | `src/app/[locale]/layout.js:59`, `src/lib/seo/structuredData.js:155`, `src/components/Kontakt/kontakt.js:243-285`, `src/components/Navbar/navbar.js:1186`, `src/components/Landing/landingPage.js:235`, `src/components/Impressum/impressum.js:32`, `src/components/Datenschutz/datenschutz.js:107`, `src/components/Partner/partner.js:60`, `src/lib/content/homeSeo.js`, `src/app/[locale]/designermoebel-*/page.js`, `src/messages/{de,en,fr,it}.json` |
| LocalBusiness-Schema | `["Organization","FurnitureStore"]` mit `@id`, Adresse, Geo, `hasMap` (cid 10377983053407187294), Öffnungszeiten Di–Fr 10–18, Sa 10–14, `areaServed` (Vorarlberg, AT, DE, CH, FL), 17 Marken als `brand`, `sameAs` (Instagram, LinkedIn, Facebook). **Liest nicht aus `site.js`**, sondern ist ein eigenes Objektliteral | `src/app/[locale]/layout.js:37-130` |
| Stadtseiten | 9 deutsche Landingpages (Bregenz, Dornbirn, Lindau, Friedrichshafen, St. Gallen, Küchen, Wohnzimmer, Interior, Bodensee) mit `WebPage` + `FAQPage`, eine gemeinsame Komponente. **Fehlt:** Vaduz/Liechtenstein, Rheintal CH, Feldkirch | `src/lib/content/landingPages.js`, `src/components/Landing/landingPage.js` |
| Karte | Google-Maps-iframe erst nach Einwilligung (gut), Route-Link | `src/components/Kontakt/kontakt.js` |
| Bewertungen auf der Website | **keine**. Kein Widget, kein `Review`, keine Bewertungsseite, kein Bewertungs-Link | – |
| Tracking | `trackEvent`, `trackLead`, `contact_click` (tel/mailto/WhatsApp) über GA4 mit Consent Mode v2. Kein Event für Klick auf Route, Bewertung oder Profil | `src/lib/analytics.js`, `src/components/Cookies` |
| Termin | Beratungsformular, kein Kalender | `src/app/[locale]/beratung`, `src/components/BeratungClient` |
| UTM-Parameter | keine im Code. Der Website-Link im Unternehmensprofil ist in GA4 deshalb nicht von normalem Google-Traffic zu trennen | – |
| Caching | `cacheComponents` ist in `next.config.js` **nicht** aktiv. Es gilt das alte Modell (`fetch` mit `next: { revalidate, tags }`) plus `revalidatePath` über `src/lib/revalidate.js`. Siehe `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` und `…/02-guides/caching-without-cache-components` | `next.config.js`, `src/lib/revalidate.js` |

### 1.2 Außerhalb des Codes (geprüft am 26.10.2026)

| Quelle | Name | Adresse | Telefon | Befund |
|---|---|---|---|---|
| **Amtliches Adressregister (BEV, über OSM-Import `at_bev:addr_date 2017-10-01`)** | Gebäude „Platzhirsch Home Living“ | **Landstraße 9** | – | Das Studio-Gebäude ist Nr. 9. Nr. 11 ist das Nachbargebäude mit dem Café |
| Google-Unternehmensprofil (über Wanderlog-Spiegel) | Platzhirsch Home Living, Kategorie „Möbelgeschäft“ | **Landstraße 11** | 46255 | **4,2 ★ / 6 Bewertungen**, letzte vom 02.04.2022, eine 1★-Bewertung. Der Pin liegt aber auf Gebäude 9 |
| Herold | „PLATZHIRSCH HOME LIVING – MW Immobilienverwaltungs GmbH“ | **Landstraße 11** | 46255 | **nicht verifiziert**, keine Bewertung |
| Website / Impressum | Platzhirsch Home Living; Impressum: MW Immobilienverwaltungs GmbH, „Sitz: Landstraße 9“ | Landstraße 9 | 46255 | Bericht 01 nennt im Firmenbuch Nr. 11 → Impressum und Firmenbuch widersprechen sich **[prüfen]** |
| OpenStreetMap (speist u. a. Apple Maps teilweise, viele Navi- und Fahrrad-Apps) | Platzhirsch Home Living | 9 | 46255 | **Öffnungszeiten falsch:** „Mo–Fr 09–17“ |
| Café (Google, OSM, bodensee-vorarlberg.com) | Café Lounge Platzhirsch | Landstraße 11 | 46257 | Eigenes Geschäft, eigenes Profil, Betreiber laut OSM dieselbe GmbH. Das ist zulässig, solange Studio und Café getrennt bleiben |
| ClassiCon-Händlersuche | Platzhirsch | **[offen]** | | Händlerseite war nicht abrufbar (404). Von Hand prüfen |
| Apple Maps, Bing Places, HERE, TomTom | | **[offen]** | | Ohne Login nicht prüfbar. HERE und TomTom stecken in den meisten Autonavis (BMW, Mercedes, Audi), also genau bei der Zielgruppe |
| local.ch / search.ch / gelbeseiten.de | | – | | Nehmen in der Regel nur Firmen mit Anschrift im eigenen Land auf **[Annahme, beim Anbieter prüfen]**. Für CH/DE zählen stattdessen Google, Apple und Bing |

**Diagnose:** Für Google ist das Studio heute ein Geschäft mit wenigen und alten Bewertungen. Dazu kommt eine Adresse, die nicht zur Website passt, und ein Pin, der nicht zur eigenen Adresse passt. Herold, der wichtigste Datenlieferant in Österreich, übernimmt denselben Fehler und ist nicht einmal verifiziert. Google rechnet Widersprüche bei Name, Adresse und Telefon (NAP) als Unsicherheit. Unsicherheit kostet Plätze im Local Pack.

---

## 2. Benchmark

### 2.1 Was die Besten weltweit machen

| Vorbild | Was sie machen | Übertragbar auf Platzhirsch |
|---|---|---|
| **RH (rh.com) Galleries** | Pro Standort eine eigene Seite mit Öffnungszeiten, Restaurant, Interior-Design-Service und Terminbuchung. Das Google-Profil jeder Galerie verlinkt auf genau diese Seite | Studio-Seite als Ziel des Profils, mit UTM-Parametern, Buchungslink und Café als Erlebnis |
| **The Conran Shop** | Standortseiten mit Events, Bildern des Ladens und Anfahrt. Die Bewertungen laufen über Google und nicht über ein eigenes Siegel | Wöchentliche Beiträge im Profil = Events und Neuheiten aus dem Showroom |
| **Minotti / Poliform Flagship-Stores** | Das Händlerverzeichnis verlinkt auf das Google-Profil des Händlers. Das ist ein starkes Signal für Relevanz | Kein Händlerstatus → wir gleichen mit Bewertungen, Fotos und Produkten im Profil aus |
| **Connox, AmbienteDirect** | Online-Händler mit Trusted Shops bzw. eigener Bewertungsplattform und Sternen in den Shopping-Anzeigen. Für das Local Pack spielen sie keine Rolle | Erst bei Online-Verkauf mit Preisen relevant (gesperrt, kein Preisfeld) |
| Gute US/UK-Showrooms (allgemeine Local-SEO-Praxis) | 100+ Bewertungen, Antwort auf jede Bewertung binnen 48 h, 1 Beitrag pro Woche, 10+ neue Fotos pro Monat, Buchungslink, Produkte im Profil | Das ist der Standard, an dem Google ein Premium-Geschäft misst |

### 2.2 Regionale Wettbewerber (Websites geprüft am 26.10.2026)

| Wettbewerber | Bewertungen auf eigener Website | Online-Termin | Stadtseiten | Google-Bewertungen |
|---|---|---|---|---|
| Höttges (Dornbirn, Wien) | keine | nur E-Mail-Link „Erstberatung“ | keine, beide Standorte auf einer Seite | **[nicht verifiziert]** ~4,7 / 21 (Bericht 20) |
| reiter design (Weiler, Innsbruck) | keine. Nur „klare Nr. 1 mit 400 Top-Marken“ (eigene Aussage, kein Beleg) | nein | keine. Auf der Startseite nicht einmal die Straße | n. e. |
| Fretz (CH) | Elfsight-Widget, vermutlich Google-Bewertungen (Bericht 20). Die Website lieferte am 26.10. ein falsches Zertifikat | – | – | n. e. |
| Dolce Vita, Hutle, Gamma, Thöny, wohngefühl | kein Bewertungs-Widget (Bericht 20) | – | – | Gamma local.ch 5 / 4 |

**Was keiner hat:** echte Bewertungen auf der Website, einen Online-Kalender für Termine, Stadtseiten für die Nachbarländer und gepflegte Google-Profile mit Beiträgen und Produkten. Höttges hat im Profil wohl mehr Bewertungen, sonst aber nichts, was nicht in drei Monaten aufzuholen ist.

**Offen und wichtig:** Die Google-Werte der Wettbewerber lassen sich nicht automatisch abrufen (Google-Nutzungsbedingungen). **20 Minuten Handarbeit im Browser** (Vorlage in Anhang B), danach vierteljährlich wiederholen.

---

## 3. Zielbild (12 Monate)

1. **Eine Wahrheit:** Platzhirsch Home Living, Landstraße 9, 6911 Lochau, +43 5574 46255, überall gleich geschrieben. Die Website zieht alle Angaben aus `site.js`, auch JSON-LD, Impressum und Übersetzungen.
2. **Profil auf Spitzenniveau:** Kategorien passend, Marken als Produkte, Leistungen gepflegt, 100+ Fotos, 1 Beitrag pro Woche, Buchungslink, 360°-Tour.
3. **Bewertungen:** 30+ bis Ende Januar 2027, 100+ bis Oktober 2027, Ø ≥ 4,7, Antwort auf jede Bewertung binnen 48 h. Mehr Bewertungen und neuere als jeder Wettbewerber im Umkreis von 50 km.
4. **Local Pack:** Platz 1–3 für „Designermöbel“, „Möbelgeschäft“, „Einrichtungshaus“, „Minotti“ und „Poliform“ in Bregenz, Lochau und Lindau. Für St. Gallen und Vaduz: organisch Platz 1–3 mit Stadtseiten und bei Markensuchen ohne lokalen Händler (Rimadesio, Paola Lenti, Tuuci) auch auf der Karte.
5. **Website:** Bewertungen werden serverseitig angezeigt, ohne Fremd-Skript, ohne Cookie, rechtssicher gekennzeichnet. Jeder Klick auf Route, Anruf, Termin und Bewertung wird gemessen.
6. **Wenig Pflege:** ca. 1,5 Stunden pro Woche für eine Person (Beiträge, Antworten, Fotos). Der Rest läuft automatisch.

---

## 4. Features

Legende Aufwand: **S** ≤ 1 Tag, **M** 2–5 Tage, **L** > 1 Woche. „Team“ = keine Programmierung.

### F1 – Adresse vereinheitlichen (NAP-Bereinigung) · **S (Team) + S (Code)** · Priorität 1

**Nutzen:** Konsistente NAP-Daten gehören zu den Grundsignalen für das Local Pack. Ein Pin auf Nr. 9 mit Adresse Nr. 11 und ein unverifizierter Herold-Eintrag mit GmbH-Namen schwächen jede andere Maßnahme. Das ist der billigste Hebel im ganzen Plan.

**Entscheidung (Empfehlung): Landstraße 9 für das Studio, Landstraße 11 für das Café.** Gründe: amtliches Adressregister (BEV), Gebäude, Pin und Website stimmen bei 9 überein. Nur Google und Herold weichen ab.

**Schritte für das Team:**
1. Google-Profil: Adresse auf „Landstraße 9“ ändern. Den Pin nicht verschieben, er liegt schon richtig. Google verlangt danach unter Umständen eine erneute Bestätigung (Video). **Nicht gleichzeitig Name und Kategorie ändern**, das löst eher eine Sperre aus.
2. Herold: Eintrag übernehmen und verifizieren (kostenlos). Firmenname auf „Platzhirsch Home Living“, Hausnummer 9, Öffnungszeiten, Logo, Fotos. Die GmbH kann im Feld „Rechtsform/Inhaber“ stehen.
3. Firmenbuch: Geschäftsanschrift der MW Immobilienverwaltungs GmbH prüfen. Steht dort 11, entweder per Firmenbuchantrag auf 9 ändern oder das Impressum an das Firmenbuch anpassen. **Impressum und Firmenbuch müssen übereinstimmen** (ECG § 5, UGB § 14). Mit Steuerberater klären; das ist eine Rechtsfrage, kein SEO-Thema.
4. OpenStreetMap: Öffnungszeiten korrigieren (`Tu-Fr 10:00-18:00; Sa 10:00-14:00`). 5 Minuten, kostenloses Konto.
5. **Apple Business Connect** (kostenlos): Ort beanspruchen, NAP, Fotos, Öffnungszeiten, Kategorie „Möbelgeschäft“. iPhone-Nutzer in der Schweiz und in Liechtenstein suchen oft in Apple Karten.
6. **Bing Places** (kostenlos): Import aus dem Google-Profil. Speist auch ChatGPT-Suche und Copilot.
7. HERE (Map Creator / HERE Places) und TomTom (Map Share): NAP melden.
8. Cylex, Firmen ABC, 11880/WKO-Firmen-A-Z, Gelbe Seiten AT (Herold-Partner), Falstaff Living, Houzz, Architonic (Händlerprofil, ohne Händler-Behauptung), Vorarlberg Tourismus (Shopping), Gemeinde Lochau: Einträge prüfen oder anlegen, alle mit derselben Schreibweise.
9. ClassiCon und alle Marken, die Platzhirsch listen: Adresse auf Nr. 9 prüfen lassen.
10. Café-Profil: getrennt halten (eigene Telefonnummer 46257, eigene Website). Im Café-Profil **nicht** „Möbel“ als Kategorie führen, sonst konkurrieren die Profile. Verlinkung im Text („direkter Zugang zum Platzhirsch Studio“) ist gut.

**Code (später, eigener Auftrag):**
- `src/lib/site.js` erweitern: `OPENING_HOURS` (strukturiert), `LEGAL_NAME`, `GBP` (cid, Place ID, Bewertungs-Link), `ADDRESS.display` für die zwei Schreibweisen (AT „ß“, CH „ss“).
- Alle ~25 hart kodierten Stellen aus Abschnitt 1.1 auf `site.js` umstellen. JSON-LD in `layout.js` aus `site.js` erzeugen. In den Sprachdateien Platzhalter `{street}` statt Literal.
- Kleiner Test oder Lint-Regel: `grep "Landstra"` außerhalb von `site.js` schlägt fehl.

**Abhängigkeiten:** keine. **Bibliotheken:** keine. **Neue Dateien:** keine; optional `scripts/check-nap.mjs` (Node, ohne Abhängigkeiten).

---

### F2 – Google-Unternehmensprofil auf Spitzenniveau · **M (Team), danach 1,5 h/Woche** · Priorität 1

**Nutzen:** Das Profil ist die meistgesehene „Seite“ von Platzhirsch. Vollständigkeit und Aktivität (Fotos, Beiträge, Antworten) beeinflussen das Ranking und vor allem die Klickrate aus dem Local Pack.

**Inhalt:**

| Bereich | Empfehlung |
|---|---|
| Name | „Platzhirsch Home Living“, ohne Zusätze wie „Minotti Lochau“. Keyword-Zusätze verstoßen gegen die Google-Richtlinien und führen zur Sperre |
| Hauptkategorie | **Möbelgeschäft** |
| Weitere Kategorien (max. 9) | Küchenstudio (bzw. „Küchengeschäft“), Einrichtungsgeschäft/Wohnaccessoires, Beleuchtungsgeschäft, Gartenmöbelgeschäft, Innenausstatter, Teppichgeschäft (nur wenn Teppiche wirklich ausgestellt sind). **„Innenarchitekt“ nur, wenn eine Person mit dieser Berufsbefugnis im Team ist** (in DE geschützter Titel, auch in AT als Ziviltechniker-Begriff heikel) |
| Beschreibung (750 Zeichen) | Was, wo, für wen: Designermöbel, Küchen und Licht, Showroom in Lochau bei Bregenz, Beratung für Kunden aus AT, DE, CH und FL. Marken nennen als „im Showroom zu sehen“, **nie „Händler“ oder „autorisiert“** |
| Öffnungszeiten | Di–Fr 10–18, Sa 10–14; Sonderzeiten für Feiertage (8.12., 24./31.12.) **immer vorab eintragen**, sonst zeigt Google „Öffnungszeiten evtl. abweichend“ |
| Attribute | Termin erforderlich/empfohlen, rollstuhlgerecht (wenn zutreffend), Parkplatz, Kreditkarten, „Online-Termine“, Sprachen |
| Produkte | Pro Marke bzw. Kollektion eine Karte: Bild (nur eigene Showroom-Fotos, siehe Bildrechte), Kurztext, Link auf die Produkt- oder Markenseite mit UTM. Start mit 20: Minotti (Lawrence, Connery, Daniels …), Poliform (Ventura, Mondrian …), Rimadesio, Paola Lenti, Tuuci, Flos. Ohne Preis oder „Preis auf Anfrage“ |
| Leistungen | Einrichtungsberatung, Küchenplanung, Lieferung und Montage AT, Lieferung DE/CH/FL nach Absprache, Outdoor-Planung, Objekteinrichtung (Hotel), Wintereinlagerung Outdoor, Atelierverkauf |
| Fotos | Start: 50, danach 10 pro Monat. Außen (Tag/Nacht, Eingang, Parkplatz), innen pro Wohnwelt, Team, Café, Lieferungen beim Kunden (mit Erlaubnis), **keine Herstellerbilder**. Geotags in EXIF bringen nichts, gute Dateinamen auch nicht. Wichtig sind echte Motive |
| Video und 360° | Vorhandene 360°-Tour (Seite „Virtueller Rundgang“) als Street-View-Innenansicht veröffentlichen, wenn das Format passt; sonst 360°-Fotos mit Street View Studio. 3–5 kurze Videos (15–30 s) |
| Beiträge | 1 pro Woche: Neuheit im Showroom, Event (Adventsabend 26.11.), Atelierverkauf-Stück, Referenzprojekt. Jeder Beitrag mit Button und UTM-Link |
| Buchungslink | „Termin vereinbaren“ → `https://platzhirsch.studio/de/beratung?utm_source=google&utm_medium=organic&utm_campaign=gbp_booking` (später auf Kalender aus F6) |
| Website-Link | `https://platzhirsch.studio/de?utm_source=google&utm_medium=organic&utm_campaign=gbp` |
| Fragen und Antworten | **Gibt es nicht mehr.** Google hat Q&A Ende 2025/Anfang 2026 eingestellt. Antworten zu Kundenfragen erzeugt jetzt Gemini („Ask Maps“) aus Website, Bewertungen und Profil. **Folge:** Die FAQ auf der Website (`homeSeo.js`, Stadtseiten) und Bewertungen mit konkreten Inhalten („Beratung zu Minotti-Stoffen“, „Lieferung nach St. Gallen“) sind jetzt die Q&A |
| Chat | Google hat den Chat 2024 eingestellt. WhatsApp-Link als Attribut/Beitrag nutzen |
| Manager | Mindestens 2 Inhaber/Manager mit Firmen-Google-Konto, nicht nur ein privates Konto, und keine Agentur als Hauptinhaber |

**Abhängigkeiten:** Profil muss verifiziert sein und das Team Zugriff haben **[offen: wer ist heute Inhaber?]**. Bildrechte: nur eigene Fotos (Ausstellung = eigene Aufnahme der Möbel ist unproblematisch; Kataloge und Pressebilder der Marken nur mit Freigabe).

**Code:** keiner. Optional später: Posts per Business Profile API (siehe F4) automatisch aus News/Events erzeugen. Für 1 Beitrag pro Woche lohnt sich das erst ab Stufe 2.

---

### F3 – Bewertungssystem: rechtssicher, mit wenig Aufwand · **S (Code) + S (Team) + M (Automatik)** · Priorität 1

**Nutzen:** Anzahl, Aktualität und Inhalt der Bewertungen sind der größte einzelne Faktor im Local Pack, nach der Entfernung. Mit 6 Bewertungen von 2022 sieht Platzhirsch für Google und für Kunden inaktiv aus. 30 neue Bewertungen in 3 Monaten sind mit dem vorhandenen Kundenstamm realistisch.

**Bausteine:**

| # | Baustein | Aufwand | Wie |
|---|---|---|---|
| a | **Kurzlink** `platzhirsch.studio/bewerten` | S, Code | Seite (oder Redirect) auf den Google-Schreib-Link `https://search.google.com/local/writereview?placeid=<PLACE_ID>`. Sprachneutral, auf allen Drucksachen nutzbar, misst Klicks (GA4-Event `review_click`). **Seite statt Redirect**, wenn auch Apple/Herold angeboten werden sollen; dann alle Optionen gleichwertig anzeigen |
| b | **QR-Karte** bei jeder Lieferung, Montage und Abholung | S, Team | A6-Karte, persönlich unterschrieben: „Wie war es mit uns? Ihre ehrliche Meinung hilft anderen“ + QR auf `/bewerten`. QR-Code einmal erzeugen (Bibliothek `qrcode` als Dev-Skript, nicht im Bundle) |
| c | **Persönliche Bitte** an die letzten 50–100 Kunden | S, Team | Telefon oder persönliche E-Mail vom Berater, die der Kunde kennt (das ist Einzelkommunikation, keine Werbe-Massenmail). Ziel: 30 bis Ende Januar |
| d | **Automatische Bitte nach Lieferung** | M | Siehe unten: Stufe 1 ohne Backoffice, Stufe 2 mit |
| e | **Antworten** auf jede Bewertung binnen 48 h | Team, 15 min/Woche | Textbausteine in Anhang A. Auch die alte 1★-Bewertung sachlich beantworten |
| f | **Interne Rangliste** | Team | Wer bringt die meisten Bitten an? Belohnung für das Bitten, **nie für die Bewertung selbst** |

**Automatik (d) in zwei Stufen:**

- **Stufe 1, sofort, ohne Backoffice:** Interne, passwortgeschützte Seite `/intern/bewertung` (oder ein Formular in einem bestehenden Tool). Der Monteur oder Berater tippt nach der Lieferung Name und E-Mail ein und bestätigt per Häkchen „Kunde hat zugestimmt, eine Bewertungsanfrage zu erhalten“. Die Route schickt **eine** E-Mail (an Tag 3) und höchstens **eine** Erinnerung (an Tag 10) über einen E-Mail-Dienst. Speicherung nur so lange, bis die Erinnerung raus ist.
  - Technik: Route Handler `src/app/api/review_request/route.js` (POST, Auth über ein Team-Passwort oder Basic Auth in `src/proxy.js`; in Next 16 heißt die Middleware „Proxy“, siehe `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`). Versand sofort plus geplanter Versand über die API des Mail-Dienstes (`scheduledAt`), damit kein eigener Cron nötig ist.
  - Bibliothek: **`resend` 6.34.1 (MIT)**, nur serverseitig, 0 KB im Browser-Bundle; Alternative Brevo (EU-Anbieter, Sitz Paris, Rest-API per `fetch` ohne SDK, weil das SDK ca. 5,7 MB groß ist). **Empfehlung Brevo per `fetch`** wegen EU-Datenhaltung und weil die DSGVO-Prüfung einfacher ist; Resend nur mit EU-Region und AVV.
- **Stufe 2, blockiert (Backoffice):** Das Frappe-Backoffice setzt bei Status „Geliefert“ auf dem Lieferschein selbst die Anfrage ab oder ruft einen Webhook der Website. Dafür braucht es einen Status bzw. ein Lieferdatum am Auftrag, ein Feld `review_consent` (Ja/Nein, Datum) am Kunden und einen ausgehenden Webhook. Das ist ohne Schreibzugang nicht baubar.

**Rechtliche Leitplanken (AT/DE/CH):**

| Regel | Quelle | Umsetzung |
|---|---|---|
| Eine Bewertungsbitte per E-Mail ist **Werbung** | BGH, Urt. v. 10.07.2018 – VI ZR 225/17; in AT gilt § 174 TKG 2021 entsprechend | Nur mit Einwilligung **oder** im Rahmen der Bestandskundenausnahme (§ 7 Abs. 3 UWG DE, § 174 Abs. 4 TKG AT): eigene Kundenadresse aus dem Kauf, Hinweis auf Widerspruchsrecht bei Erhebung **und** in jeder Mail. **Sicherster Weg:** Häkchen auf Auftragsbestätigung/Lieferschein „Ich bin einverstanden, nach der Lieferung um eine Bewertung gebeten zu werden“ |
| Keine Gegenleistung für Bewertungen | Google-Richtlinien; UWG; DE: Pflicht zur Kennzeichnung bezahlter Bewertungen | Kein Gutschein, kein Rabatt, kein Gewinnspiel für Bewertungen. Ein Dankeschön an alle Kunden unabhängig von der Bewertung ist in Ordnung |
| **Kein „Review Gating“** | Google-Richtlinien | Nicht erst fragen „Waren Sie zufrieden?“ und nur Zufriedene zu Google schicken. Alle Kunden bekommen denselben Link. Ein zusätzliches Feld „Direkt an die Inhaberin“ für alle ist erlaubt |
| Keine Bewertungen von Mitarbeitern, Familie, Partnerfirmen | Google-Richtlinien, UWG Anhang Z 23b (AT) / Nr. 23b Anhang UWG (DE) | Auch Architekten-Partner nur, wenn sie echte Kunden sind, und dann mit Offenlegung der Geschäftsbeziehung |
| Keine Bewertungsaktion „in einem Rutsch“ mit 50 Bewertungen an einem Tag | Google-Spamfilter | Bitten über 8–10 Wochen verteilen |
| Negative Bewertungen | Meinungsfreiheit; Löschung nur bei Rechtsverletzung (Beleidigung, falsche Tatsache, kein Kundenkontakt) | Über das Profil „Rechtswidrige Inhalte melden“. Keine Drohungen mit Anwalt in der Antwort |
| Schweiz | UWG CH Art. 3 Abs. 1 lit. b/o (irreführende Angaben; unverlangte Massenwerbung ohne Einwilligung) | Gleiches Verfahren wie DE: Einwilligung einholen |

**Abhängigkeiten:** Place ID des Profils (mit dem Place-ID-Finder von Google ermitteln; die cid ist bekannt). AVV mit dem Mail-Dienst. Datenschutzerklärung ergänzen (`src/components/Datenschutz/datenschutz.js`): Zweck „Bewertungsanfrage“, Rechtsgrundlage, Löschfrist.

**Neue Dateien:** `src/app/[locale]/bewerten/page.js` (oder `src/app/bewerten/route.js` als Redirect), `src/app/api/review_request/route.js`, `src/app/[locale]/intern/bewertung/page.js` (noindex), `scripts/make-review-qr.mjs`. Änderung: `src/lib/site.js` (`GBP.reviewUrl`), `src/lib/analytics.js` (`review_click`), `src/app/robots.js` (`/intern` sperren).

**Bibliotheken:** `qrcode` 1.5.4 (MIT, 135 KB entpackt, nur Dev/Script, 0 KB im Bundle). Mail: Brevo-REST per `fetch` (0 KB) oder `resend` 6.34.1 (MIT, nur Server).

---

### F4 – Bewertungs-Widget auf der Website · **M** · Priorität 2 (nach ca. 15 Bewertungen)

**Nutzen:** Kein Premium-Wettbewerber in der Region zeigt Bewertungen. Vertrauen auf Startseite, Kontakt, Beratung und Stadtseiten erhöht die Anfragequote. **Nicht für Rich-Snippets:** Google zeigt keine Sterne für Bewertungen, die ein Unternehmen über sich selbst auf der eigenen Website auszeichnet, und **Google-Bewertungen dürfen nicht als `Review`/`aggregateRating` im eigenen JSON-LD stehen** (sie wurden nicht auf der eigenen Seite gesammelt). Also: Widget ja, Schema dafür nein.

**Wann:** Erst ab etwa 15 Bewertungen und Ø ≥ 4,5. Mit 6 Bewertungen und 4,2 ★ schadet ein Widget eher.

**Architektur (empfohlen, ohne Fremd-Skript):**

```
Google Business Profile API (v4, accounts.locations.reviews.list)
   └─ src/lib/reviews/getReviews.js    (fetch mit next: { revalidate: 86400, tags: ['reviews'] })
        └─ src/components/Reviews/ReviewStrip.js   (Server Component, 0 KB JS)
             ├─ Startseite, /kontakt, /beratung, Stadtseiten
             └─ Fallback: statische JSON-Datei, wenn die API nicht antwortet
```

- **Server Component**, kein Client-JS, kein Cookie, kein Consent nötig (die Daten kommen vom eigenen Server; Google-Avatare nicht laden, sondern Initialen zeigen).
- Anzeige: Ø, Anzahl, die **neuesten** 3–6 Bewertungen (nicht nach Sternen gefiltert), Vorname + Initial, Datum, Link „Alle Bewertungen auf Google“ und „Bewertung schreiben“.
- **Pflichthinweis (UWG AT Anhang Z 23b, § 5b Abs. 3 UWG DE):** kurzer Text unter dem Widget, ob und wie geprüft wird. Beispiel: „Bewertungen von Google. Google prüft nicht, ob Verfasser bei uns gekauft haben. Wir zeigen die neuesten Bewertungen ungefiltert.“
- Bewertungen mit Inhalten zu Stadt oder Marke („Lieferung nach Lindau“) auf passenden Stadtseiten bevorzugen, aber nur aus der ungefilterten Liste der neuesten 20 und **nie nach Sternen auswählen**.
- Revalidierung: täglich (alt: `fetch(..., { next: { revalidate: 86400, tags: ['reviews'] } })`, weil `cacheComponents` aus ist). Sofort-Update über die vorhandene `src/app/revalidate`-Route mit `revalidateTag('reviews', 'max')`.

**Zugang zur API:** Die Business Profile API ist nicht frei. Google prüft jedes Projekt, Voraussetzung ist ein verifiziertes Profil, das seit ≥ 60 Tagen aktiv ist. OAuth mit dem Firmenkonto des Profil-Inhabers, Refresh-Token als Umgebungsvariable. Antrag **jetzt** stellen, Prüfung dauert Tage bis Wochen.

**Plan B ohne API-Freigabe:** Places API (New) Place Details mit Feldern `rating`, `userRatingCount`, `reviews` (max. 5, von Google ausgewählt). Kosten im Enterprise-+-Atmosphere-Tarif, bei 1×/Tag ca. 30 Aufrufe im Monat und damit im Freikontingent. **Risiko:** Die Maps-Platform-Bedingungen verlangen Google-Attribution und schränken das Zwischenspeichern von Inhalten ein; Place ID darf dauerhaft gespeichert werden. Vor Umsetzung Bedingungen prüfen.

**Plan C (SaaS):** Elfsight, Trustindex oder ProvenExpert. Schnell eingebunden, aber 100–300 KB Fremd-JavaScript, Tracking-Cookies (Consent nötig, also für die meisten Besucher unsichtbar), monatliche Kosten. **Nicht empfohlen.** Ausnahme: ProvenExpert, falls zusätzlich eigene, verifizierte Bewertungen mit Siegel gewünscht sind.

**Bibliotheken:** `google-auth-library` 11.3.1 (Apache-2.0, 778 KB entpackt, **nur Server**, 0 KB im Bundle). Alternative ohne Abhängigkeit: Token-Refresh per `fetch` an `oauth2.googleapis.com/token` (ca. 20 Zeilen). **Empfehlung: ohne Bibliothek**, weil nur ein Endpunkt gebraucht wird. `@googleapis/mybusinessbusinessinformation` 13.0.1 ist **nicht** nötig (enthält keine Reviews; die liegen noch in v4).

**Neue Dateien:** `src/lib/reviews/getReviews.js`, `src/lib/reviews/fallback.json`, `src/components/Reviews/ReviewStrip.js`, Einbindung in `src/app/[locale]/page.js`, `src/components/Kontakt/kontakt.js`, `src/components/Landing/landingPage.js`, `src/components/BeratungClient/BeratungClient.js`. Texte in `src/messages/*.json`.

**Abhängigkeiten:** API-Freigabe (Plan A) oder Maps-API-Schlüssel mit Abrechnung (Plan B); ≥ 15 Bewertungen.

---

### F5 – Local Pack für Lindau, St. Gallen und Vaduz trotz Standort Lochau · **M (Code) + laufend** · Priorität 2

**Ehrliche Einordnung:** Im Local Pack entscheidet zuerst die Entfernung zum Suchenden bzw. zum Ort in der Suche. Ein Standort in Lochau kann sich nicht nach St. Gallen „verlegen“. Profil-Tricks (Adressen ohne Personal, Briefkasten, Co-Working) sind Richtlinienverstöße und führen zur Sperre.

| Ort | Entfernung (Straße) | Local Pack realistisch? | Strategie |
|---|---|---|---|
| Bregenz, Lochau, Hörbranz | 0–4 km | **ja, Platz 1** | F1–F3 genügen |
| **Lindau** | ca. 6–8 km | **ja, Platz 1–3**, Lindau grenzt an | Stadtseite Lindau (vorhanden) stärken, Bewertungen von Lindauer Kunden, Beiträge zu Lindau. Kategorie- und Markensuchen („Minotti Lindau“, „Designermöbel Lindau“) |
| Dornbirn | ca. 15 km | gegen Höttges schwer, bei Markensuchen ohne Höttges-Marken ja | Stadtseite (vorhanden) |
| Friedrichshafen, Wangen | 25–30 km | nur bei Nischen-Marken | Organisch über Stadtseite |
| **St. Gallen / Rheintal CH** | ca. 40–45 km | **nein** bei Kategorie-Suchen; **möglich** bei Marken ohne Händler in der Ostschweiz (Rimadesio, Poliform laut Bericht 16) | Organisch Platz 1–3 mit Stadtseite (vorhanden) + neue Seite Rheintal CH, Google Ads mit Standorterweiterung |
| **Vaduz / Liechtenstein** | ca. 45–50 km | **nein** bei Kategorie-Suchen | **Neue Seite** `designermoebel-liechtenstein` (Vaduz, Schaan, Balzers), Liechtenstein-spezifisch: CHF, Zoll über die Schweiz (Zollvertrag), Lieferung, keine Wartefrist bei Montage (Bericht 23) |

**Maßnahmen:**
1. **Profil-Relevanz:** Marken als Produkte (F2) und Bewertungstexte mit Marken- und Ortsnamen machen das Profil bei Markensuchen über größere Entfernung sichtbar, wenn dort niemand anderes die Marke führt.
2. **Einzugsgebiet im Profil:** Ein Geschäft mit Ladenlokal darf zusätzlich Einzugsgebiete eintragen (bis 20). Lindau, Bregenz, Dornbirn, St. Gallen, Vaduz, Friedrichshafen, Feldkirch. Das verbessert das Ranking kaum, wird aber angezeigt und von Gemini für „Liefert ihr nach …?“ genutzt.
3. **Stadtseiten (Code):** neu `designermoebel-liechtenstein`, `designermoebel-rheintal` (Widnau, Heerbrugg, Altstätten), `designermoebel-feldkirch`. Jede mit echtem Nutzen: Fahrzeit und Route (Link mit `origin=<Stadt>`), Ablauf Zoll/MWST für das Land, Lieferung und Montage, Referenzprojekt aus der Gegend (wenn vorhanden), Bewertungen von Kunden aus der Gegend (F4), FAQ. **Keine Austauschtexte**, sonst Doorway Pages.
4. **Schema auf Stadtseiten:** `WebPage.about` → `#organization` (statt eigenes LocalBusiness ohne Adresse in der Stadt); im Organisationsknoten `areaServed` um `City`-Einträge mit `sameAs` auf Wikidata erweitern (Lindau Q4057, St. Gallen Q25607, Vaduz Q1844) **[IDs vor Einbau prüfen]**.
5. **Google Ads (optional, kostet):** Standorterweiterung + Umkreis-Targeting auf St. Gallen/Vaduz, Kampagne „Designermöbel Schweiz“. Gehört in den Ads-Plan, nicht hier.
6. **Langfristig echte Präsenz:** Ein Planungsstudio in St. Gallen oder Vaduz (Moonshot in Bericht 23) wäre der einzige Weg ins dortige Local Pack, mit eigenem Profil, Personal und Öffnungszeiten.

**Neue/geänderte Dateien:** `src/app/[locale]/designermoebel-liechtenstein/page.js`, `…-rheintal/page.js`, `…-feldkirch/page.js`, `src/lib/content/landingPages.js`, `src/app/[locale]/layout.js` (areaServed), Sitemap folgt automatisch über `landingPages.js`.

**Abhängigkeiten:** inhaltliche Freigabe der Zoll-/MWST-Aussagen (Bericht 18, Steuerberater), Referenzfotos mit Erlaubnis der Kunden. **Bibliotheken:** keine.

---

### F6 – Messen und Termin aus Maps · **S–M** · Priorität 2

**Nutzen:** Ohne Messung ist „Nr. 1 in Maps“ nicht steuerbar. Heute ist der Profil-Verkehr in GA4 nicht von normalem Google-Verkehr zu trennen.

1. **UTM-Links** im Profil (Website, Termin, Beiträge, Produkte), siehe F2. **S, Team**
2. **Neue Events** in `src/lib/analytics.js`: `directions_click` (Link auf google.com/maps/dir), `review_click`, `map_consent` (Karte geladen), `booking_start`. Der vorhandene delegierte Listener `listenForContactClicks` lässt sich um das Muster `google.com/maps` erweitern. **S, Code**
3. **Profil-Leistungsdaten** (Anrufe, Routen, Website-Klicks, Suchbegriffe) monatlich exportieren; später automatisch über die Business Profile Performance API. **Team**
4. **Rank-Tracking im Raster** (Geo-Grid) für 10 Begriffe in Lochau, Lindau, Bregenz, Dornbirn, St. Gallen, Vaduz: Local Falcon, BrightLocal oder Local Viking, ca. 20–40 €/Monat. **Team**
5. **Online-Termin:** ein Kalender mit festen Beratungsslots als Buchungslink im Profil. Cal.com (gehostet, EU-Region) oder Microsoft Bookings (falls M365 vorhanden). Einbindung als **Link** (kein Embed-Skript) auf `/beratung`; Embed `@calcom/embed-react` 1.5.3 nur, wenn nötig (eigene Lizenz, Fremd-Skript, Consent). **M**

**Neue/geänderte Dateien:** `src/lib/analytics.js`, `src/app/[locale]/client-layout.js` (Listener), ggf. `src/components/BeratungClient/BeratungClient.js`.

---

### F7 – LocalBusiness-Schema ausbauen · **S** · Priorität 2

**Nutzen:** Klare Entität für Google, Bing und KI-Suche. Kein direkter Ranking-Sprung, aber weniger Widersprüche und bessere Antworten in „Ask Maps“ und KI-Suchen.

Änderungen am Knoten `#organization` in `src/app/[locale]/layout.js` (aus `site.js` erzeugt, siehe F1):
- `legalName`: Firmenwortlaut aus dem Firmenbuch; `vatID` und `identifier` (FN) wie im Impressum.
- `sameAs`: ergänzen um Google-Profil (`https://maps.google.com/?cid=10377983053407187294`), Herold-Detailseite, Apple-Maps-Link, Houzz/Architonic, sobald vorhanden.
- `openingHoursSpecification` und `specialOpeningHoursSpecification` (Feiertage) aus `site.js`.
- `knowsLanguage`, `paymentAccepted`, `currenciesAccepted: "EUR, CHF"` nur wenn CHF wirklich angenommen wird.
- `makesOffer` → `Offer` mit `itemOffered: Service` (Einrichtungsplanung, Küchenplanung, Lieferung und Montage) **ohne Preis**: bei Diensten ohne Preis zulässig; alternativ `hasOfferCatalog` mit Services. Kein `Product` ohne Preis (siehe Kommentar im Code zur alten OfferCatalog-Warnung).
- `areaServed`: Städte ergänzen (F5).
- **Kein** `aggregateRating`/`review` aus Google-Bewertungen (siehe F4).
- Café **nicht** als `department` aufnehmen, solange es eigene Website und Telefon hat; höchstens `containsPlace`/`subOrganization` mit eigenem `@id`, wenn beide Betriebe bewusst verbunden werden sollen.

Prüfen mit dem Rich-Results-Test und dem Schema-Validator. **Bibliotheken:** keine (`schema-dts` bringt nur TypeScript-Typen, für das JS-Projekt ohne Nutzen).

---

### F8 – Lokale Links und Erwähnungen (Citations mit Autorität) · **laufend, Team** · Priorität 3

Kurz, weil Bericht 25 (H7) das abdeckt: Gemeinde Lochau (Wirtschaft), Vorarlberg Tourismus/Bodensee-Vorarlberg (Shopping), WKO-Firmen-A-Z, VN/Vorarlberg Online, Schwäbische Zeitung Lindau, St. Galler Tagblatt, Liechtensteiner Vaterland, Architekten-Partner, Werkraum Bregenzerwald, Events (Adventsabend) auf regionalen Eventkalendern. **Eine einheitliche NAP in jeder Erwähnung.**

---

## 5. Risiken

| Risiko | Wahrscheinlichkeit | Wirkung | Gegenmaßnahme |
|---|---|---|---|
| **Profilsperre** durch gleichzeitige Änderung von Adresse, Name und Kategorie oder durch Keyword im Namen | mittel | sehr hoch | Änderungen einzeln, Abstand 1–2 Wochen; Name ohne Zusätze; Belege bereithalten (Gewerbeschein, Foto Eingang mit Hausnummer, Rechnung mit Adresse) |
| Bewertungen werden von Google gefiltert (zu viele an einem Tag, gleiche IP im Showroom-WLAN) | mittel | mittel | Bitten zeitlich verteilen; Kunden nicht im Showroom am Studio-Tablet bewerten lassen |
| Abmahnung wegen Bewertungsmail ohne Einwilligung (DE) | niedrig–mittel | mittel | Einwilligung auf Auftrag/Lieferschein; ein Erinnerungsversuch; Abmeldelink |
| Irreführung durch gefiltertes Widget (UWG) | niedrig | mittel | Neueste ungefiltert, Hinweis zur Prüfung, Link zu allen |
| „Händler“-Behauptung im Profil (Beschreibung, Produkte, Beiträge) | mittel | hoch | Redaktionsregel: „im Showroom zu sehen“, „Beratung zu“, nie „offizieller/autorisierter Händler“, bis Verträge stehen |
| **Bildrechte**: Herstellerfotos im Profil oder Widget | mittel | mittel | Nur eigene Fotos; Hersteller-Bildmaterial nur mit schriftlicher Freigabe |
| Datenschutz Widget (Namen der Verfasser) | niedrig | niedrig | Vorname + Initial, keine Avatare, keine Google-Skripte; Hinweis in der Datenschutzerklärung |
| Performance | niedrig | niedrig | Server Component, 0 KB JS, tägliche Revalidierung; kein SaaS-Widget |
| API-Freigabe dauert oder wird abgelehnt | mittel | niedrig | Plan B (Places API) oder statische JSON, die einmal im Monat von Hand aktualisiert wird |
| Pflege schläft ein (5 Personen, 0 FTE Marketing) | **hoch** | hoch | Feste Person, 1,5 h/Woche im Kalender (Di 9:00); Beiträge im Monatsvoraus planen; Automatik Stufe 1 übernimmt die Bewertungsbitten |
| Café-Profil konkurriert mit Studio-Profil | niedrig | mittel | Getrennte Kategorien, Telefonnummern, Websites |
| Firmenbuch/Impressum-Abweichung | mittel | mittel (rechtlich) | Mit Steuerberater klären (F1, Schritt 3) |

---

## 6. Reihenfolge

### 6.1 Sofort, ohne Backoffice und ohne Code (Woche 1–2, Team)

1. Profil-Zugang klären, 2. Manager anlegen.
2. **Adresse im Google-Profil auf Landstraße 9** (allein, ohne andere Änderung).
3. Herold übernehmen und verifizieren; OSM-Öffnungszeiten korrigieren.
4. Apple Business Connect, Bing Places anlegen.
5. Place ID ermitteln, Bewertungslink erzeugen, QR-Karten drucken.
6. Persönliche Bewertungsbitte an die letzten 50–100 Kunden (über 8 Wochen).
7. Alte Bewertungen beantworten (auch die 1★).
8. Erste 30 eigene Fotos, Sonderöffnungszeiten Dezember, Beitrag Adventsabend.
9. Wettbewerber-Tabelle von Hand ausfüllen (Anhang B).
10. Antrag auf Business Profile API stellen.

### 6.2 Sofort baubar im Code, ohne Backoffice (Sprint 1–2)

| # | Feature | Aufwand |
|---|---|---|
| 1 | F1 Code: alle NAP-Angaben aus `site.js`, JSON-LD aus `site.js` | S |
| 2 | F3a `/bewerten` + Event `review_click` | S |
| 3 | F6 Events `directions_click`, `review_click`, UTM-Konzept | S |
| 4 | F7 Schema-Ausbau (legalName, sameAs, Feiertage, Services, Städte) | S |
| 5 | F5 Stadtseiten Liechtenstein, Rheintal CH, Feldkirch | M |
| 6 | F3d Stufe 1: interne Bewertungsanfrage mit Einwilligung + Mail-Dienst | M |
| 7 | F4 Widget mit statischer JSON (ab ca. 15 Bewertungen), später API | M |

### 6.3 Blockiert

| Feature | Blockiert durch |
|---|---|
| F3d Stufe 2: Bewertungsbitte automatisch bei Status „Geliefert“ | Backoffice: Lieferstatus/-datum, Feld `review_consent`, ausgehender Webhook (kein Schreibzugang) |
| Bewertungsquote je Berater, Herkunft der Anfrage im CRM | Backoffice-Felder |
| F4 mit Live-Daten | Freigabe Business Profile API (Google) oder Maps-API-Abrechnung |
| Produkte im Profil mit Preis | Preisfeld im Backoffice + Freigabe der Hersteller |
| Händler-Signale (Link aus minotti.com/poliform.it in das Profil) | Händlerverträge |
| Local Pack St. Gallen/Vaduz bei Kategorie-Suchen | Physischer Standort dort (Moonshot) |

### 6.4 KPI (monatlich, in die KPI-Tafel aus Bericht 23)

Bewertungen gesamt und neu, Ø, Antwortquote/-zeit · Profil: Anrufe, Routen, Website-Klicks, Buchungsklicks · GA4: Sitzungen `utm_campaign=gbp*`, `generate_lead` aus Profil-Sitzungen · Geo-Grid-Rang für 10 Begriffe · Anzahl konsistenter Einträge (Ziel 15/15).

---

## Anhang A – Antwort-Bausteine (anpassen, nie wörtlich wiederholen)

- **5★:** „Liebe Frau M., danke für Ihre Worte. Es hat uns Freude gemacht, Ihr Wohnzimmer mit dem Minotti-Sofa zu planen. Viel Freude damit, und schauen Sie gern auf einen Kaffee vorbei. Herzlich, [Name], Platzhirsch Home Living“
- **3★:** „Danke für Ihre ehrliche Rückmeldung. Dass die Lieferung länger gedauert hat als angekündigt, tut uns leid. Wir haben die Abstimmung mit dem Hersteller geändert. Ich melde mich gern persönlich: [Telefon].“
- **1★ ohne erkennbaren Kunden:** „Wir können Ihren Besuch oder Auftrag leider nicht zuordnen. Bitte melden Sie sich unter info@platzhirsch.studio, damit wir das klären können.“ (Danach prüfen, ob die Bewertung gemeldet werden kann.)

Regeln: binnen 48 h, mit Namen unterschreiben, keine Kundendaten nennen, keine Marken-Behauptungen, keine Rabatte anbieten.

## Anhang B – Wettbewerber-Tabelle (von Hand, vierteljährlich)

| Anbieter | Ø | Anzahl | Neueste Bewertung | Kategorie | Beiträge letzte 30 Tage | Fotos (ca.) | Buchungslink |
|---|---|---|---|---|---|---|---|
| Platzhirsch | 4,2 | 6 | 02.04.2022 | Möbelgeschäft | 0 | ? | nein |
| Höttges Dornbirn | | | | | | | |
| reiter design Weiler | | | | | | | |
| Dolce Vita | | | | | | | |
| Hutle | | | | | | | |
| Fretz | | | | | | | |
| Gamma | | | | | | | |
| Thöny (FL) | | | | | | | |
| wohngefühl / Kocherhans | | | | | | | |

## Quellen

- Amtliche Adresse (BEV-Import in OSM): [Nominatim Landstraße 9](https://nominatim.openstreetmap.org/search?street=Landstra%C3%9Fe%209&city=Lochau&country=Austria&format=json&extratags=1), [Nominatim Landstraße 11](https://nominatim.openstreetmap.org/search?street=Landstra%C3%9Fe%2011&city=Lochau&country=Austria&format=json&extratags=1)
- Herold: [Platzhirsch Home Living – MW Immobilienverwaltungs GmbH](https://www.herold.at/gelbe-seiten/lochau/5cN3g/platzhirsch-home-living-mw-immobilienverwaltungs-gmbh/)
- Google-Daten (Spiegel): [Wanderlog](https://wanderlog.com/place/details/12184081/platzhirsch-home-living)
- Café: [bodensee-vorarlberg.com – Café Lounge Platzhirsch](https://www.bodensee-vorarlberg.com/en/cafe-lounge-platzhirsch)
- Wettbewerber: [hoettges.at](https://www.hoettges.at/), [reiter.design](https://www.reiter.design/); Bericht 20
- Ende von GBP-Q&A: [Slashpost](https://slashpost.ai/blogs/google-business-profile/google-business-profile-qa-removed-2026), [Footbridge Media](https://www.footbridgemedia.com/marketing-tips/google-shutting-down-gbp-q-a), [BrightLocal](https://www.brightlocal.com/learn/google-business-profile-qa)
- Business Profile API: [Google v4 reviews.list](https://developers.google.cn/my-business/reference/rest/v4/accounts.locations.reviews/list?hl=hi), [Zugangsvoraussetzungen (Anbieter-Leitfaden)](https://www.upload-post.com/google-business-profile-api/)
- Places API Preise: [Google Maps Platform Pricing](https://developers.google.com/maps/billing-and-pricing/pricing), [openplacesapi.com](https://openplacesapi.com/blog/google-places-api-pricing)
- Bibliotheken: npm-Registry am 26.10.2026 (`qrcode` 1.5.4 MIT, `google-auth-library` 11.3.1 Apache-2.0, `resend` 6.34.1 MIT, `@calcom/embed-react` 1.5.3)
- Next.js 16: `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`, `09-revalidating.md`, `16-proxy.md`
- Recht: BGH VI ZR 225/17 (Feedback-Mail = Werbung), § 7 Abs. 3 UWG DE, § 174 TKG 2021 AT, UWG AT Anhang Z 23b/23c und § 5b Abs. 3 UWG DE (Bewertungs-Transparenz), UWG CH Art. 3. **Vor Umsetzung von F3d durch Anwalt bestätigen lassen.**
