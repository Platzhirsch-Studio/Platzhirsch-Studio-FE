# 15 – Google-Ökosystem: Plan für Search, Unternehmensprofil, Merchant Center, Ads, YouTube, Discover, Lens, GA4

**Stand:** 26.10.2026 · **Rolle:** Google-Experte (Expertenrat) · **Status:** Plan. Nichts davon ist eingerichtet, verknüpft oder im Code geändert.
**Grundlage:** Berichte 00, 23, 26; `digital/08` (SEO), `digital/09` (Local SEO), `digital/10` (Performance Marketing), `digital/14` (Recht); `marketing/google-unternehmensprofil.md` (Content-Paket GBP, Welle 0b); Code-Prüfung am 26.10.2026.
**Kennzeichnung:** **[belegt]** = im Code oder in einer Google-Quelle geprüft · **[Fachwissen, prüfen]** = Google-Verhalten, das sich ändert, vor Umsetzung im Hilfeartikel nachlesen · **[Schätzung]** mit Herleitung · **[vom Unternehmen auszufüllen]** · **[anwaltlich prüfen]**

> Dieser Bericht ist kein Rechtstext. Wo er Rechtsfragen berührt (Preisangaben, Marken, Einwilligung, Bildrechte), gilt `digital/14` und die Prüfung durch eine Rechtsanwältin/einen Rechtsanwalt.

---

## 0. Kurzfassung

1. **Ein Firmenkonto als Eigentümer aller Google-Dienste.** Heute ist unklar, wem Profil, Search Console und GA4 gehören. Alle sieben Dienste (Search Console, Unternehmensprofil, GA4, Merchant Center, Google Ads, YouTube, Tag-Verwaltung) werden auf ein Google-Konto der Firma gelegt, mit zwei Inhabern. Bei der geplanten Ausgliederung in die Handels-GmbH lassen sich die Konten dann übertragen, ohne Daten zu verlieren.
2. **Search Console als Domain-Property per DNS.** Heute gibt es nur das HTML-Tag (`src/app/layout.js`, Z. 11). Die Domain-Property deckt `www`, `http`, alle Sprachpfade und `backoffice.platzhirsch.studio` (Bildhost) ab.
3. **Discover und Lens kosten fast nichts.** Es fehlt `max-image-preview:large` im Robots-Meta (`src/lib/seo/pageMetadata.js`, Z. 85). Ohne diese Angabe zeigt Discover keine großen Bilder. Wichtigster Hebel für Google Lens sind **eigene Fotos** der Ausstellung. Herstellerbilder ordnet Lens dem Hersteller zu, nicht Platzhirsch.
4. **Merchant Center in zwei Stufen.** Zuerst nur Artikel mit echtem, kaufbarem Preis (Atelierverkauf, Accessoires, Gutscheine). Danach das **lokale Inventar mit dem Status „on_display_to_order“** („in der Ausstellung, auf Bestellung“). Google hat diesen Status genau für große Möbel vorgesehen. Er muss beim Support freigeschaltet werden und braucht einen Preis, also eine Herstellerfreigabe für Preise.
5. **AI Overviews brauchen keine Sondertechnik.** Google sagt ausdrücklich: Es gibt keine zusätzlichen Anforderungen. `llms.txt` hilft bei Google nicht. Die Sperre von `Google-Extended` in `robots.js` schadet AI Overviews nicht.
6. **GA4 mit fünf Key Events statt einem.** `generate_lead` gibt es schon. Dazu kommen `book_appointment`, `purchase` (Gutschein und Outlet), `qualified_lead` (aus dem Backoffice) und `contact_click` als Nebenziel. Erst danach wird Google Ads verknüpft und Budget freigegeben.

---

## 1. Ist-Zustand im Code [belegt, 26.10.2026]

| Bereich | Stand | Datei | Bewertung |
|---|---|---|---|
| Search-Console-Verifizierung | HTML-Tag `verification.google` (URL-Präfix-Methode) | `src/app/layout.js` Z. 10–11 | funktioniert, aber nur für eine Property. Domain-Property fehlt |
| Sitemaps | Index `/sitemap.xml` → `sitemap-static`, `-marken`, `-produkte`, `-news` (normales `urlset`, kein Google-News-Format), echte `lastmod` (Commit 78c9ea5) | `src/app/sitemap*.xml/route.js`, `src/lib/seo/sitemapEntries.js` | gut. **Keine Bild-Sitemap** |
| robots.txt | Googlebot alles außer `/api/` (aber `/api/image` erlaubt). `Google-Extended` gesperrt | `src/app/robots.js` | richtig. Google-Extended betrifft nur Training und Grounding in Gemini, **nicht** die Suche und nicht AI Overviews |
| Robots-Meta | `robots: { index, follow: true }`, **kein** `max-image-preview`, `max-snippet`, `max-video-preview` | `src/lib/seo/pageMetadata.js` Z. 85 | **Lücke für Discover** |
| OG-Bild | ohne `width`/`height` | `pageMetadata.js` Z. 97–98 | Discover und Social können die Größe nicht vorab erkennen |
| JSON-LD | `Organization` + `FurnitureStore`, `Product` **ohne** `offers` | `src/app/[locale]/layout.js` Z. 37 ff., `src/lib/seo/structuredData.js` | rechtlich bewusst so (`digital/14`). Folge: Search Console meldet Produkt-Snippets als **ungültig**, weil `offers`, `review` oder `aggregateRating` fehlen. Das ist hinzunehmen, solange keine Preise erlaubt sind |
| Bilder | Next Image (AVIF/WebP), Hosts `backoffice.platzhirsch.studio`, `www.next125.com`, `www.treca-paris.com`, `images.unsplash.com` | `next.config.js` | Hersteller- und Unsplash-Bilder sind für Lens und Bildersuche wertlos (Duplikat) und riskant (Bildrechte, `digital/14` F2) |
| GA4 | `G-1YCM6K57YG`, lädt erst nach Einwilligung, Consent Mode v2 mit Default „denied“ | `src/components/Cookies/cookiecomponent.js` Z. 15, 144–194 | gut. Weil gtag.js erst nach Zustimmung lädt, ist das der **Basic Mode**: ohne Zustimmung gibt es keine Pings und keine Modellierung. Datenschutzfreundlich, aber Google Ads modelliert dann weniger |
| Events | `generate_lead` (alle Formulare, Parameter `form`), `contact_click` (tel/mailto/WhatsApp), `sign_up` (Newsletter), `review_click` (/bewerten) | `src/lib/analytics.js`, Formular-Komponenten | Basis vorhanden. Es fehlen Termin, Kauf, qualifizierter Lead, Wert, `transaction_id` |
| Google Ads | kein `AW-`-Tag, kein Conversion-Label | – | `digital/10` 1.2 |
| YouTube | keine Einbindung im Code gefunden | – | Kanal und Embeds fehlen |
| Merchant Center | kein Feed, kein Preisfeld im Backoffice | – | `digital/10` F7, `digital/08` F6 |

---

## 2. Konten und Eigentum (vor allem anderen)

**Problem:** Wer heute Inhaber von Unternehmensprofil, Search Console und GA4 ist, ist nicht dokumentiert (`google-unternehmensprofil.md` Abschn. 1, Frage 3). Hängt ein Dienst an einem privaten Gmail-Konto eines früheren Mitarbeiters oder einer Agentur, ist er im Ernstfall weg.

**Vorgabe:**

| Dienst | Eigentümer | Zweiter Inhaber | Weitere Zugänge |
|---|---|---|---|
| Google-Konto „Platzhirsch Marketing“ (z. B. `google@platzhirsch.studio`, Gruppenadresse, 2-Faktor mit zwei Hardwareschlüsseln oder zwei Telefonen) | Geschäftsführung | Stellvertretung | – |
| Search Console | Firmenkonto (Inhaber, verifiziert) | GF persönlich (Inhaber, delegiert) | Entwickler: „Uneingeschränkt“ |
| Unternehmensprofil | Firmenkonto (Inhaber) | GF (Inhaber) | Team: „Manager“ |
| GA4 (Konto + Property) | Firmenkonto (Administrator) | GF (Administrator) | Agentur: „Bearbeiter“, nie Administrator |
| Merchant Center | Firmenkonto (Administrator) | GF | – |
| Google Ads | Firmenkonto (Administrator). Zahlungsprofil auf den **Rechtsträger, der die Rechnung bekommt** | GF | Agentur über eigenes Verwaltungskonto (MCC), nur Zugriff, nie Eigentum |
| YouTube | **Brand-Kanal** im Firmenkonto | GF als Inhaber | Team: „Manager“ |

**Rechtsträgerwechsel (Handels-GmbH, `digital/14` R9):** Beim Wechsel müssen gleichzeitig angepasst werden: Merchant Center → Unternehmensinformationen und Impressum-URL; Google Ads → Zahlungsprofil (neues Profil anlegen, UID-Nummer, Rechnungsadresse; ein Zahlungsprofil kann man nicht auf eine andere Firma umschreiben [Fachwissen, prüfen]); Unternehmensprofil → keine Namensänderung nötig, solange die Marke „Platzhirsch Home Living“ bleibt. **[vom Unternehmen auszufüllen: Datum der Ausgliederung, neue Firmenbuchnummer, UID]**

---

## 3. Google Search Console

### 3.1 Property-Typen

| Property | Zweck | Verifizierung |
|---|---|---|
| **Domain `platzhirsch.studio`** (neu, Hauptproperty) | alles: `www`, http/https, alle Pfade, Subdomains wie `backoffice.` | DNS-TXT-Eintrag beim Domain-Anbieter **[vom Unternehmen auszufüllen: Registrar/DNS-Zugang]** |
| URL-Präfix `https://platzhirsch.studio/` (besteht) | bleibt als Rückfall (HTML-Tag), Inhaber-Liste prüfen | HTML-Tag im Code, nicht entfernen |
| URL-Präfix `https://platzhirsch.studio/de/`, `/en/`, `/fr/`, `/it/` | getrennte Leistungs- und Indexierungsberichte je Sprache, ohne Filter | über die Domain-Property automatisch verifiziert |
| URL-Präfix `https://backoffice.platzhirsch.studio/` | Crawling-Fehler der Produktbilder (Google empfiehlt, Bildhosts zu verifizieren) | über die Domain-Property |

Die 1.000-Zeilen-Grenze der Oberfläche umgeht man über die Sprach-Properties und den **Bulk-Export nach BigQuery** (bei dem Datenvolumen kostenlos bis gering [Schätzung: < 1 €/Monat bei < 10 GB Speicher]) oder über Looker Studio.

### 3.2 Sitemaps

1. Nur den **Index** `https://platzhirsch.studio/sitemap.xml` einreichen. Die vier Teil-Sitemaps zusätzlich einzeln einreichen, dann zeigt Search Console die Indexierungsquote je Bereich (Produkte gegen Marken gegen Ratgeber).
2. **Neu (Code, später):** Bild-Sitemap oder `<image:image>` in `sitemap-produkte.xml`, **nur für eigene Fotos** (Bildrechte, `digital/08` Risiken). Herstellerbilder nicht aufnehmen.
3. `sitemap-news.xml` heißt nur so, ist aber ein normales `urlset`. Das ist in Ordnung. Nicht bei Google News einreichen: Ein Einrichtungshaus ist kein Nachrichtenverlag.
4. Regionsseiten (`designermoebel-*`) sind neu. Prüfen, ob sie in `sitemap-static` stehen. Ein Eintrag allein sorgt aber nicht für Indexierung. Sie werden nur indexiert, wenn jede Seite eigene Fakten hat (Doorway-Risiko, `digital/08` F7).

### 3.3 Erwartete Fehler und was zu tun ist

| Bericht | Erwartete Meldung | Ursache | Maßnahme |
|---|---|---|---|
| Seitenindexierung | „Gecrawlt – zurzeit nicht indexiert“, viele Produktseiten | 1.765 Produkte, oft mit Herstellertext, kaum Mehrwert | Mehrwert-Block je Produkt (`digital/08` F2). Schwache Seiten bündeln statt indexieren |
| Seitenindexierung | „Alternative Seite mit richtigem kanonischen Tag“ | 4 Sprachen | normal, kein Fehler |
| Seitenindexierung | „Seite mit Weiterleitung“ | alte URLs (vor Next.js 16) | nur prüfen, ob Ziele 200 liefern |
| Produkt-Snippets | „Entweder offers, review oder aggregateRating angeben“ (kritisch, Element ungültig) | `productSchema` bewusst ohne `offers` | **hinnehmen**, bis Preise erlaubt sind. Kein Schein-Offer (`price: 0`), kein `aggregateRating` aus Google-Bewertungen (`digital/14` F11) |
| Händlereinträge | erst relevant mit `offers` | – | ab Merchant-Center-Stufe 1 für Outlet-Seiten |
| hreflang | Hinweise bei FR/IT | Commit 6de7c13 hat 404-Canonicals behoben | nach 4 Wochen prüfen |
| Core Web Vitals | INP/LCP auf Produktseiten mit großen Bildern und GSAP | – | `digital/13` |
| Sicherheit/Manuelle Maßnahmen | sollte leer sein | – | monatlich prüfen |

### 3.4 Routine (30 Minuten pro Woche, ein Verantwortlicher)

- Leistung: Klicks und Impressionen je Sprache und Land (AT/DE/CH/LI). Anfragen mit „Minotti“, „Poliform“ und „Küche“ getrennt filtern.
- Neue Fehler in Indexierung und Verbesserungen. E-Mail-Benachrichtigungen an die Gruppenadresse.
- Nach jedem Deploy mit neuen Seiten: URL-Prüfung → „Indexierung beantragen“ für 3–5 wichtige URLs.
- Monatlich: Export in das KPI-Sheet (Bericht 23).

---

## 4. Google-Unternehmensprofil (Abstimmung mit Welle 0b)

Das Content-Paket in `marketing/google-unternehmensprofil.md` gilt (Beschreibung, Kategorien, Leistungen, Produkte, Beiträge, Sonderöffnungszeiten). Ich übernehme es unverändert und ergänze die **Verknüpfungen mit dem Rest des Ökosystems**:

| Verknüpfung | Wozu | Voraussetzung |
|---|---|---|
| Profil ↔ Merchant Center | lokales Inventar, „Im Geschäft erhältlich“ im Profil, Produkte im Profil automatisch aus dem Feed [Fachwissen, prüfen] | Hausnummer geklärt, **Geschäftscode** (`store_code`) festlegen, z. B. `LOCHAU1`. Der Code muss im Feed exakt gleich sein |
| Profil ↔ Google Ads | Standort-Assets (Adresse und Entfernung in der Anzeige), Ladenbesuche als Ziel, sobald die Datenmenge reicht | Profil verifiziert, Ads-Konto |
| Profil-Termin-Link | `/de/beratung?utm_source=google&utm_medium=organic&utm_campaign=gbp_booking` (Paket Abschn. 2) | in GA4 als `book_appointment` messen (Abschn. 10) |
| Profil-Videos | 30-s-Clips aus dem YouTube-Material (Abschn. 7), hochkant und quer | eigene Aufnahmen |
| Profil-Leistungsdaten | Anrufe, Routen, Website-Klicks monatlich ins KPI-Sheet | – |

**Reihenfolge strikt wie im Paket:** Hausnummer klären → Adresse ändern → 1–2 Wochen warten → Kategorien → Beschreibung, Leistungen und Produkte → Beiträge. **Merchant Center erst nach der Adressänderung verknüpfen**, sonst verknüpft man es mit falschen Stammdaten.

**Café:** Das Café hat ein eigenes Profil (Landstraße 11). Es wird nicht mit dem Merchant Center verknüpft und bekommt keinen `store_code`.

---

## 5. Google Merchant Center

### 5.1 Was Merchant Center hier leisten kann und was nicht

| Möglichkeit | Eignung für Platzhirsch | Begründung |
|---|---|---|
| **Kostenlose Produkteinträge** (Shopping-Tab, Bildersuche, Lens) | **ja, aber nur Artikel mit echtem Preis** | Preis, Verfügbarkeit und Kaufmöglichkeit müssen auf der Zielseite stimmen. „Ab“-Preise und „Preis auf Anfrage“ werden abgelehnt (`digital/14` F4) |
| **Kostenlose lokale Einträge** („in der Nähe verfügbar“) | **ja, als Stufe 2** | Österreich ist für kostenlose lokale Einträge und lokale Inventaranzeigen freigegeben, ebenso die Schweiz (Liste Juni 2026, Search Engine Roundtable) |
| **„On display to order“ (ODO)** | **sehr gut passend** | Google beschreibt den Status für Ware, die im Geschäft ausgestellt, aber nicht sofort mitnehmbar ist, etwa große Möbel. Muss für das Land freigeschaltet sein (Support kontaktieren). Die Zielseite muss eine ungefähre Lieferzeit und die Lieferbedingungen samt Kosten nennen |
| Shopping-Anzeigen / Performance Max mit Feed | später | nur mit Tracking und Budget (Abschn. 6) |
| Google-Kundenrezensionen (Shop-Bewertungen) | erst mit Online-Kasse | braucht Bestellbestätigungsseite |

### 5.2 Stufen

**Stufe 1 – Feed mit echten Preisen (sofort nach Rechtsbasis, ohne Herstellerfreigabe):**
- Inhalt: Atelierverkauf/Ausstellungsstücke (eigene Fotos, eigener Preis), Accessoires und Geschenke aus dem Shop, Wertgutscheine.
- Gutscheine: Ob Wertgutscheine als Produkt zulässig sind, regelt die Shopping-Richtlinie. **[Fachwissen, prüfen: Shopping-Richtlinie „Geschenkkarten“]**
- Quelle: zuerst Google Sheet/Repo-JSON (`digital/08` F6 Stufe A). Das Sheet kann Merchant Center **direkt als Feed** einlesen (geplanter Abruf täglich). Ein Code-Feed ist dafür nicht nötig.
- Später: Route `src/app/feeds/merchant.xml/route.js` aus dem Backoffice (Frappe), sobald das Backoffice ein Preisfeld hat (`digital/08` F6 Stufe C).

**Stufe 2 – Lokales Inventar „in der Ausstellung“:**
- Primärfeed: die Ausstellungsmodelle (Minotti, Poliform, Rimadesio, Treca, Paola Lenti …) mit Preis.
- Lokaler Inventarfeed: `store_code` = `LOCHAU1`, `id` = gleiche ID wie im Primärfeed, `availability` = `on_display_to_order` (bzw. `in_stock` für Ausstellungsstücke im Abverkauf).
- **Harte Voraussetzung:** Preisangabe für Herstellerware. Die Hersteller müssen sie freigeben (UVP, selektiver Vertrieb, Online-Regeln, Bericht 11) und der Händlerstatus muss geklärt sein (Gate 0). Ohne Freigabe gibt es keine Stufe 2 für diese Marke. **[vom Unternehmen auszufüllen: welche Marke erlaubt Preis online?]**
- Für die Schweiz erst, wenn der CHF-Festpreis inkl. Verzollung steht (Bericht 18). Merchant Center braucht dann einen eigenen Länder- bzw. Währungsfeed in CHF.

### 5.3 Pflichtfelder und Zuordnung zum Backoffice

| Feed-Attribut | Pflicht | Backoffice-/Sheet-Feld (Vorschlag) | Hinweis |
|---|---|---|---|
| `id` | ja | `name` (Frappe-ID) oder eigene SKU | im Primär- und Lokalfeed identisch, nie ändern |
| `title` | ja | `marke + modell + typ + material` | z. B. „Minotti Lawson Sofa 3-Sitzer Leder Pelle Natural“. Kein „Händler“, kein „günstig“ |
| `description` | ja | eigener Text (`digital/08` F2) | kein Herstellertext 1:1 |
| `link` | ja | Produkt-URL `/de/produkte/<kategorie>/<produkt>` | Preis muss dort sichtbar sein |
| `image_link` | ja | **eigenes Foto**, mind. 800 × 800 px empfohlen, kein Wasserzeichen, kein Werbetext | Bildregister (`digital/14` F2) |
| `additional_image_link` | nein | Detailfotos | bis 10 |
| `price` | ja | `preis` + `waehrung` (EUR, später CHF) | brutto inkl. USt (PrAG/PAngV) |
| `sale_price` | nein | nur mit dokumentiertem Vorpreis | Omnibus: niedrigster Preis der letzten 30 Tage (`digital/14` F4) |
| `availability` | ja | `in_stock` / `out_of_stock` / `preorder` / `backorder` | für Lokalfeed zusätzlich `on_display_to_order` |
| `brand` | ja (außer Eigenmarken, Filme, Bücher) | `marke` | Binni-Linie: Eigenmarkenname **[vom Unternehmen auszufüllen]** |
| `gtin` | wenn vorhanden | `gtin` | Möbel auf Bestellung haben oft keine GTIN |
| `mpn` | wenn keine GTIN | Hersteller-Artikelnummer | |
| `identifier_exists` | wenn weder GTIN noch MPN | `no` | für Unikate, Binni-Maßanfertigung, Ausstellungsstücke ohne Nummer |
| `condition` | ja bei gebrauchter Ware | `new` / `used` / `refurbished` | **Ausstellungsstück:** ob `new` oder `used` korrekt ist, hängt vom Zustand ab **[anwaltlich prüfen + Shopping-Richtlinie]**. Im Zweifel `used` mit Zustand im Text |
| `google_product_category` | empfohlen | Zuordnung je Kategorie, z. B. „Möbel > Sofas“ | einmalig als Tabelle pflegen |
| `product_type` | empfohlen | eigene Kategorie `Wohnen > Sofas > Minotti` | für Kampagnengliederung |
| `shipping` | ja (oder Kontoeinstellung) | Kontoeinstellung „Versand“: AT, DE, CH getrennt | Möbel: Spedition und Montage, Preise **[vom Unternehmen auszufüllen]** |
| `shipping_weight` / Maße | wenn Versandkosten danach berechnet werden | `gewicht`, `masse` | |
| Rückgaberichtlinie | ja (Kontoeinstellung) | Widerrufsrecht nach FAGG/BGB, Ausschluss für Maßanfertigung | **[anwaltlich prüfen]** |
| `store_code` (Lokalfeed) | ja | `LOCHAU1` | muss exakt dem Profil-Code entsprechen |

**Kontoebene, die Google vor der Freigabe prüft:** Impressum (in AT, DE und CH für lokale Einträge verlangt. Ein Bericht vom 09/2026 meldet, dass das für AT und DE wegfällt. Im Hilfeartikel bestätigen), Datenschutzerklärung, Kontaktmöglichkeit, Rückgabe- und Versandangaben, sichere Kasse (HTTPS). Deshalb erst `digital/14` F1 (Rechtsbasis), dann Merchant Center.

### 5.4 Verbote im Feed

- Kein „offizieller Händler“, „autorisiert“, „Vertragshändler“ in Titel oder Beschreibung (Bericht 23, Gate 0).
- Kein Herstellerbild ohne schriftliche Freigabe. Feed-Bilder erscheinen in Anzeigen und bei Lens.
- Kein Preis, der auf der Seite fehlt oder abweicht. Kein Lockpreis, kein „ab“.
- Binni-Linie: Herkunft „gefertigt im Kosovo“ in der Beschreibung, nichts, was „Made in Italy“ nahelegt (Bericht 26, `digital/14`).

---

## 6. Google Ads (Verknüpfung, nicht Kampagnenplan)

Der Kampagnenplan steht in `digital/10` 4a.2 und `marketing/google-ads-kampagnen.md`. Hier nur die **Verknüpfungen und Voraussetzungen**:

| Verknüpfung | Wozu | Wann |
|---|---|---|
| GA4 ↔ Ads | Key Events als Conversions importieren, GA4-Zielgruppen für Remarketing | nach 2 Wochen „stummem“ Tracking (`digital/10`) |
| Search Console ↔ Ads | Bericht „Bezahlte und organische Suchanfragen“: Wo rankt man ohnehin, wo braucht es Anzeigen? | sofort mit Ads-Konto |
| Merchant Center ↔ Ads | Shopping/PMax mit Feed | erst mit Stufe 1 und Budget |
| Unternehmensprofil ↔ Ads | Standort-Assets | sofort mit Ads-Konto |
| YouTube ↔ Ads | Video-Remarketing, Demand Gen | sobald 10+ Videos online sind |

**Pflicht vor dem ersten Euro:**
1. Consent Mode v2 mit getrennten Signalen `ad_storage`, `ad_user_data`, `ad_personalization` (in `cookiecomponent.js` vorhanden). Der Banner-Text muss Google Ads, Personalisierung und Datenübermittlung in die USA nennen (`digital/14` F13). Google verlangt die Einwilligung nach der EU-Richtlinie zur Nutzereinwilligung für Nutzer im EWR und in der Schweiz [Fachwissen, prüfen].
2. Erweiterte Conversions (gehashte E-Mail) **nur mit Einwilligung** und eigenem Abschnitt in der Datenschutzerklärung (`digital/14` F13).
3. Primäres Gebotsziel: nur `generate_lead` und `book_appointment`. `contact_click` als **sekundär** (Beobachtung). Sonst optimiert Google auf versehentliche Telefon-Klicks.
4. Fremdmarken als Keyword: zulässig nach EuGH *Google France* und *Interflora*, sofern die Anzeige nicht nach Herstellerangebot oder Händlerstatus klingt. Wettbewerbernamen nicht verwenden (`digital/14`).

---

## 7. YouTube-Kanal (Showroom-Videos)

### 7.1 Aufbau

- **Brand-Kanal** „Platzhirsch Home Living“, Handle `@platzhirschhomeliving` **[Verfügbarkeit prüfen]**. Banner und Profilbild aus der Design-Bibel. Kanal-Links: Website mit UTM, Beratung, Instagram. Den Kanal in `sameAs` des Organization-JSON-LD aufnehmen (`src/app/[locale]/layout.js` Z. 111, Code später).
- Kanalsprache Deutsch. Untertitel DE/EN als Datei hochladen (nicht nur Auto-Untertitel). Titel und Beschreibung zusätzlich EN/IT über „Übersetzungen“.

### 7.2 Formate [Schätzung Aufwand: mit Smartphone-Gimbal und Ansteckmikro 2–4 h pro Langvideo inkl. Schnitt, Shorts 20–40 min]

| Reihe | Länge | Takt | Beispiel | Ziel |
|---|---|---|---|---|
| Showroom-Rundgang | 4–8 min | einmalig + bei Umbau | „Rundgang durch unsere Ausstellung in Lochau“ | Vertrauen, Kanal-Trailer |
| Material im Detail | 1–3 min | 2× pro Monat | „Lederqualitäten im Vergleich“, „Keramik oder Naturstein für die Arbeitsplatte?“ | Suchanfragen, Ratgeber-Einbettung |
| Küche geplant | 5–10 min | monatlich | „Vom Grundriss zur Küche: so planen wir“, Binni-Linie erst nach Freigabe | Küchen-Leads |
| Shorts | 15–45 s, 9:16 | 2× pro Woche | neues Ausstellungsstück, Atelierverkauf, Café-Moment | Reichweite, Profil-Videos |
| Projekt-Vorher/Nachher | 2–4 min | quartalsweise | nur mit schriftlicher Zustimmung der Kunden | Referenz |

### 7.3 Regeln

- Nur **eigene Aufnahmen**. Hersteller-Imagefilme nur mit schriftlicher Freigabe.
- Musik nur aus der YouTube-Audio-Mediathek oder mit Lizenz, die YouTube und Ads abdeckt. Sonst gibt es Content-ID-Ansprüche oder die Werbefreigabe fällt weg.
- Erkennbare Personen (Team, Kunden, Café-Gäste) nur mit schriftlicher Einwilligung (Recht am eigenen Bild, § 78 UrhG AT; DSGVO). **[anwaltlich prüfen: Vorlage Einwilligung]**
- Marken im Titel beschreibend („Minotti-Sofa im Showroom“), nicht „offizieller Minotti-Partner“.
- **Einbettung auf der Website nur über `ConsentEmbed`** (Vorschaubild + Klick), auch `youtube-nocookie.com` setzt Speicher und überträgt Daten.
- **Video-SEO:** Google indexiert ein Video nur, wenn eine Seite das Video als Hauptinhalt zeigt. Pro wichtigem Video gehört also eine eigene Ratgeber-Seite mit `VideoObject` (`name`, `description`, `thumbnailUrl`, `uploadDate`, `contentUrl`/`embedUrl`) dazu. Die Klick-Vorschau muss im HTML einen Verweis auf das Video haben, sonst findet Google es nicht [Fachwissen, prüfen: Video-Best-Practices].

---

## 8. Google Discover

**Was Google verlangt [belegt, Discover-Doku, Stand 09.03.2026]:** große Bilder mind. **1200 px breit**, mehr als 300.000 Pixel, Seitenverhältnis 16:9, und große Vorschauen über **`max-image-preview:large`** freigegeben. Keine reißerischen Titel, aktuelle oder einzigartige Inhalte.

**Maßnahmen:**
1. **Code (klein, `pageMetadata.js` Z. 85):** Robots-Meta auf
   `robots: { index, follow: true, googleBot: { index, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } }`
   setzen. Die Schreibweise steht so in der Next.js-Doku im Projekt (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`, Z. 566 ff.). Gilt für alle Seiten. Bei `noindex`-Seiten (Preview) bleibt `NOINDEX`.
2. OG-Bild mit `width: 1200, height: 675` (16:9) für Ratgeber, News und Regionsseiten. Produkt-OG bleibt flexibel.
3. **Discover-Kandidaten** sind Ratgeber und News, keine Produktseiten: „Salone del Mobile 2027: was wir mitbringen“, „Einrichten einer Ferienwohnung am Arlberg“, Adventsabend-Rückblick, Material-Ratgeber. Jeder mit eigenem Querformatbild in 1920 × 1080.
4. `Article`-JSON-LD mit `author` (echte Person aus dem Team), `datePublished`, `dateModified`, `image` (1200+). Nur echte Daten.
5. Erwartung: Discover-Verkehr ist unregelmäßig. Ziel ist, im Discover-Bericht der Search Console überhaupt aufzutauchen. Der Bericht erscheint erst ab einer Mindestzahl an Impressionen. [Schätzung: realistisch 0–2.000 Klicks/Monat im ersten Jahr. Herleitung: regionales Nischenthema, deutschsprachig, wenige Artikel pro Monat]

---

## 9. AI Overviews und AI Mode

**Was Google sagt [belegt, Doku „AI features and your website“, Stand 10.12.2025]:** keine zusätzlichen Anforderungen. Die Seite muss indexiert und mit Snippet anzeigbar sein. Keine KI-Textdateien, kein Sonder-Schema nötig. Gesteuert wird über `nosnippet`, `data-nosnippet`, `max-snippet`, `noindex`. **Google-Extended** begrenzt nur die Nutzung in anderen Google-KI-Systemen. Gemessen wird in der Search Console unter Leistung → „Web“ (keine eigene Spalte für AI Overviews).

**Folgen für Platzhirsch:**
- `robots.js` bleibt so (Googlebot erlaubt, Google-Extended gesperrt). Diese Entscheidung kostet bei der Google-Suche nichts. **[vom Unternehmen zu entscheiden:** Soll Gemini die Inhalte zum Grounding nutzen dürfen? Dann müsste die Google-Extended-Sperre fallen. Empfehlung: gesperrt lassen, bis Bildrechte geklärt sind.]
- `max-snippet: -1` (Abschn. 8) erlaubt längere Zitate.
- Inhalte, die zitiert werden: konkrete Antworten mit Fakten aus erster Hand. Zum Beispiel: „Was kostet eine Küche mit Natursteinplatte in Vorarlberg?“ (nur mit echten Preisspannen), „Lieferung von Möbeln in die Schweiz: Ablauf, Zoll, MWST“ (Bericht 18, freigegeben vom Steuerberater), „Leder-Sofa pflegen“. Format: Frage als H2, Antwort in den ersten 2 Sätzen, dann Details (`digital/08` F5, F10).
- Unternehmensprofil und Merchant Center aktuell halten. Google nennt beides ausdrücklich als Quelle.
- `llms.txt` (`src/app/llms.txt/route.js`) schadet nicht, bringt bei Google aber nichts. Bitte keine Arbeit hineinstecken, um Google zu erreichen.

---

## 10. Google Lens und Bildersuche (Möbel per Foto finden)

**Warum das zählt:** Wer ein Sofa in einem Hotel, auf Instagram oder bei Freunden sieht, fotografiert es mit Lens. Lens zeigt (a) **Shopping-Ergebnisse aus Merchant-Center-Feeds** und (b) **visuell passende Webseiten**. Bei (b) gewinnt in der Regel die Quelle des Originalbilds [Fachwissen, prüfen]. Mit Herstellerfotos landet der Klick beim Hersteller oder bei Connox und AmbienteDirect, die dieselben Bilder nutzen.

**Maßnahmen, nach Wirkung sortiert:**
1. **Eigene Fotos jedes Ausstellungsstücks**, in drei Einstellungen: freigestellt vor ruhigem Hintergrund (für Feed/Lens), im Raum (für Bildersuche/Discover), Detail (Material, Naht, Fuß). [Schätzung Aufwand: 150 Ausstellungsstücke × 10 min = 25 h Fotografie + Bearbeitung, Herleitung: Ausstellungsfläche, nicht Katalog mit 1.765 Produkten]
2. Diese Fotos ins **Merchant Center** (Stufe 1/2). Das ist der direkte Weg in die Lens-Shopping-Ergebnisse.
3. Auf der Produktseite als normales `<img>` mit `src` (Next Image erfüllt das), nah am Produkttext, mit **Alt-Text**: „Minotti Lawson Sofa in cognacfarbenem Leder in der Ausstellung von Platzhirsch in Lochau“. Kein Keyword-Stapeln.
4. **Dateinamen sprechend**, im Backoffice beim Upload: `minotti-lawson-sofa-leder-cognac-lochau.jpg` statt `IMG_4021.jpg`.
5. `Product.image` im JSON-LD auf die eigenen Fotos zuerst sortieren (Code: `structuredData.js` nimmt `product.images` der Reihe nach).
6. **Bild-Lizenz-Metadaten** (`ImageObject` mit `license`, `creator`, `copyrightNotice`, `creditText`) für eigene Fotos. Das schafft eine Lizenz-Kennzeichnung in Google Bilder und belegt Urheberschaft.
7. Bild-Sitemap nur mit eigenen Fotos (Abschn. 3.2).
8. `backoffice.platzhirsch.studio` in Search Console verifizieren (Abschn. 3.1), um Crawling-Fehler der Bilder zu sehen.
9. Test: monatlich 10 eigene Ausstellungsstücke vor Ort mit Lens fotografieren. Notieren, ob Platzhirsch unter den ersten Treffern ist (KPI „Lens-Trefferquote“).

---

## 11. Google Analytics 4: Key Events und Einstellungen

### 11.1 Property-Einstellungen

- Datenaufbewahrung auf **14 Monate** (Standard sind 2 Monate). Sonst fehlen Vorjahresvergleiche.
- Google-Signale: **aus**, solange der Banner sie nicht nennt **[anwaltlich prüfen]**.
- Interne Zugriffe ausschließen (IP des Showrooms/Büros als „intern“ definieren, Datenfilter aktivieren). **[vom Unternehmen auszufüllen: feste IP?]**
- Referral-Ausschluss: Zahlungsanbieter (Stripe/Mollie, sobald Kasse kommt), damit Käufe nicht als „stripe.com“ zählen.
- Länder-Bericht: AT/DE/CH/LI als Vergleichsgruppen anlegen.
- Verknüpfungen: Search Console, Google Ads, Merchant Center (ab Feed), BigQuery-Export (kostenlos in Standard-GA4).

### 11.2 Key Events (Conversions)

| Event | Key Event? | Auslöser | Parameter | Wert [Schätzung] | Stand |
|---|---|---|---|---|---|
| `generate_lead` | **ja (primär)** | jedes Formular | `form` (kontakt, produkt, beratung, adventsabend), `transaction_id` = `lead_ref`, `value`, `currency` | Kontakt 50 €, Produktanfrage 80 €, Beratung 150 € (Herleitung `digital/10` 3.2; nach 90 Tagen durch echte Abschlussquote ersetzen) | vorhanden, Parameter `transaction_id`/`value` fehlen |
| `book_appointment` | **ja (primär)** | erfolgreiche Online-Terminbuchung (geplant) | `appointment_type` (showroom, video, vor_ort), `location` | 200 € | neu |
| `purchase` | **ja** | Gutschein- oder Outlet-Kauf bestätigt | `transaction_id`, `value`, `currency`, `items[]` | echter Umsatz | neu, mit Kasse |
| `qualified_lead` | **ja (für Ads-Gebote später)** | im Backoffice als qualifiziert markiert → Measurement Protocol oder Offline-Import | `lead_ref` | 400 € | neu, braucht Backoffice (`digital/10` F4) |
| `contact_click` | ja, **sekundär** | tel/mailto/WhatsApp | `method` | 20 € | vorhanden |
| `sign_up` | nein (nur Event) | Newsletter | `method` | – | vorhanden |
| `review_click` | nein | /bewerten | – | – | vorhanden. **Nicht** als Ads-Ziel (Bewertungs-Anreize, `digital/14` F11) |
| `view_item`, `select_content`, `add_to_wishlist` (Merkliste), `video_start` | nein | Produkt, Marke × Kategorie, Merkliste, YouTube-Klick | `item_brand`, `item_category` | – | neu (`digital/10` F5) |
| `generate_lead` mit `form: "ki_concierge"` / `"raumplaner"` | ja (über `generate_lead`) | geplante KI-Funktionen | – | wie Beratung | später |

Grundsatz: **ein** Event-Name je Ziel, unterschieden über Parameter. Das bleibt deutlich unter der Grenze von 30 Key Events je Standard-Property [Fachwissen, prüfen]. Benutzerdefinierte Dimensionen: `form`, `method`, `appointment_type` (ereignisbezogen).

### 11.3 Abnahme

- GA4 DebugView: jedes Formular einmal abschicken, Event + Parameter prüfen.
- Ohne Einwilligung darf **kein** Request an `google-analytics.com` oder `googletagmanager.com` gehen (Browser-Netzwerk-Tab).
- Nach Widerruf: `_ga*`-Cookies gelöscht (vorhanden laut `cookiecomponent.js` Z. 161).

---

## 12. Weitere Google-Dienste (kurz)

| Dienst | Empfehlung |
|---|---|
| Google Tag Manager | **nicht nötig.** Der eigene Loader ist schlanker und rechtlich kontrolliert. Erst bei mehreren Werbe-Pixeln oder serverseitigem Tagging (`digital/10` F8) |
| Looker Studio | kostenloses Dashboard aus GSC, GA4, Ads, Profil (über Sheet). Eine Seite pro Monat für die Geschäftsführung |
| Bing Webmaster Tools | Import aus der Search Console mit einem Klick. Bing speist ChatGPT-Suche und Copilot |
| Google Maps (Website) | weiter nur über `ConsentEmbed` |
| Google Workspace | sinnvoll für das Firmenkonto und die Gruppenadresse, nicht Pflicht **[vom Unternehmen zu entscheiden]** |
| Google-Kundenrezensionen | erst mit Online-Kasse. Ersetzt keine Profil-Bewertungen |

---

## 13. Was man auf keinen Fall tun darf

1. Google-Konten auf private Gmail-Adressen oder ins Eigentum einer Agentur legen.
2. Name, Adresse und Kategorie im Profil gleichzeitig ändern (Sperrgefahr).
3. Schein-Preise (`price: 0`, „Preis auf Anfrage“ als Offer) oder `aggregateRating` aus Google-Bewertungen ins JSON-LD schreiben.
4. Herstellerbilder in Feed, Ads, YouTube oder Discover ohne schriftliche Freigabe.
5. „Offizieller Händler“ o. Ä. in Feed, Anzeige, Video oder Profil, solange kein Vertrag mit Eintrag im Händlerverzeichnis vorliegt.
6. Google Ads auf `contact_click` oder `review_click` optimieren.
7. Tracking ohne Einwilligung „zum Testen“ einschalten.
8. Für jede Stadt eine fast gleiche Seite bauen und in die Sitemap stellen (Doorway).
9. KI-Texte ohne Prüfung in Masse veröffentlichen (Google-Richtlinie zu skalierten Inhalten).
10. Bewertungen kaufen, nur zufriedene Kunden fragen oder Gutscheine für Bewertungen geben.

---

## 14. Checkliste mit Reihenfolge

**Phase 0 – Woche 1 (KW 44): Eigentum und Basis, ohne Code**
- [ ] Firmen-Google-Konto anlegen, 2-Faktor, zwei Inhaber (Abschn. 2)
- [ ] Inhaber von Profil, Search Console (URL-Präfix) und GA4 ermitteln und auf das Firmenkonto übertragen
- [ ] Hausnummer 9/11 entscheiden (Voraussetzung für Profil und Merchant Center)
- [ ] Search Console: Domain-Property per DNS-TXT verifizieren, Sprach-Properties und `backoffice.` anlegen
- [ ] Sitemap-Index und vier Teil-Sitemaps einreichen
- [ ] Bing Webmaster: Import aus Search Console
- [ ] GA4: Aufbewahrung 14 Monate, interne IP, Google-Signale aus, Search-Console-Verknüpfung

**Phase 1 – Woche 2–3 (KW 45–46): Profil und kleine Code-Änderungen**
- [ ] Profil: Adressänderung allein (Paket Abschn. 1), danach 1–2 Wochen Pause
- [ ] Code: `max-image-preview:large`, `max-snippet:-1`, `max-video-preview:-1` (Abschn. 8)
- [ ] Code: `generate_lead` mit `transaction_id`, `value`, `currency` (`digital/10` F2)
- [ ] GA4: `generate_lead` und `contact_click` als Key Events markieren
- [ ] YouTube: Brand-Kanal im Firmenkonto anlegen, Handle sichern, Einwilligungsvorlage Bildrechte vom Anwalt
- [ ] Foto-Produktion der Ausstellungsstücke starten (Abschn. 10), Dateinamen-Regel ans Team

**Phase 2 – Woche 3–6 (KW 46–49): Rechtsbasis, dann Merchant Center Stufe 1**
- [ ] Rechtsbasis `digital/14` F1 live (Impressum, Datenschutz mit Google-Diensten, AGB/Widerruf, Versand- und Rückgabeseite) **[anwaltlich prüfen]**
- [ ] Profil: Kategorien, danach Beschreibung, Leistungen und Produkte (Paket)
- [ ] Merchant Center: Konto, Website verifizieren (über Search Console), Impressum-URL, Versand AT/DE (CH später), Rückgaberichtlinie
- [ ] Sheet-Feed: Atelierverkauf + Accessoires + Gutscheine (nur mit Preis auf der Seite), Bilder nur eigene
- [ ] Kostenlose Produkteinträge aktivieren, Diagnose auf 0 Fehler bringen
- [ ] Ratgeber-Artikel mit 16:9-Bildern und `Article`-JSON-LD (Discover, AI Overviews)
- [ ] YouTube: Rundgang + 4 Shorts, Kanal-Trailer, `sameAs` im JSON-LD

**Phase 3 – Woche 6–10 (KW 49 – Jan. 2027): Ads verknüpfen**
- [ ] Banner-Text für Google Ads, Personalisierung und Drittland ergänzen **[anwaltlich prüfen]**
- [ ] Google-Ads-Konto (Zahlungsprofil auf den richtigen Rechtsträger), Verknüpfung mit GA4, GSC, Profil
- [ ] 2 Wochen „stummes“ Tracking, DebugView-Abnahme
- [ ] Key Events importieren: primär `generate_lead`, `book_appointment`. Sekundär `contact_click`
- [ ] Mediastart frühestens nach Gate 0 (Budget 3–8 T€/Monat ab Q1 2027, Bericht 23)

**Phase 4 – Q1–Q2 2027: Lokales Inventar und Ausbau**
- [ ] Profil ↔ Merchant Center verknüpfen, `store_code` `LOCHAU1` festlegen
- [ ] Herstellerfreigaben für Online-Preise einholen (je Marke schriftlich)
- [ ] ODO für Österreich beim Merchant-Center-Support beantragen. Zielseiten mit Lieferzeit und Lieferkosten
- [ ] Lokaler Inventarfeed mit `on_display_to_order` für freigegebene Marken
- [ ] Online-Terminbuchung live → `book_appointment`. Gutschein-/Outlet-Kasse live → `purchase`
- [ ] Backoffice: Preisfeld, `in_ausstellung`, `lieferzeit` → Feed aus dem Code (`/feeds/merchant.xml`)
- [ ] `qualified_lead` per Offline-Import (`digital/10` F4)
- [ ] Bild-Sitemap mit eigenen Fotos, `ImageObject`-Lizenzangaben
- [ ] Merchant Center Merkposten Schweiz: CHF-Feed erst mit Festpreis inkl. Verzollung (Bericht 18)

**Laufend:** GSC 30 min/Woche · Profil 1,5 h/Woche (`digital/09`) · YouTube 2 Shorts/Woche + 1 Langvideo/Monat · Lens-Test monatlich · Looker-Bericht monatlich.

---

## 15. KPIs (monatlich ins KPI-Sheet, Bericht 23)

| KPI | Quelle | Start | Ziel M6 [Schätzung] | Ziel M12 [Schätzung] |
|---|---|---|---|---|
| Organische Klicks (Web) | GSC | **[Ist-Wert ziehen]** | +50 % | +120 % |
| Indexierte Produktseiten / eingereicht | GSC | **[Ist-Wert ziehen]** | 60 % | 75 % |
| Discover-Klicks | GSC | 0 | Bericht erscheint | 500/Monat |
| Kostenlose Produkteinträge: Klicks | Merchant Center | 0 | 100/Monat | 400/Monat |
| Profil: Routen + Anrufe + Website | Profil-Leistung | **[Ist-Wert ziehen]** | +40 % | +100 % |
| `generate_lead` + `book_appointment` | GA4 | **[Ist-Wert ziehen]** | +50 % | ×2 |
| YouTube-Abonnenten / Aufrufe | YouTube Studio | 0 | 150 / 10.000 | 500 / 50.000 |
| Lens-Trefferquote (10 Testfotos) | eigener Test | **[messen]** | 3/10 | 6/10 |

Herleitung der Ziele: Die Ausgangswerte fehlen, die Ziele sind Richtwerte. Die Steigerungen ergeben sich aus der Behebung technischer Lücken und aus neuen Inhalten, ohne Ads. Sie werden nach den ersten 90 Tagen anhand echter Werte neu gesetzt.

---

## 16. Was der Inhaber entscheiden oder liefern muss

| # | Punkt | Art |
|---|---|---|
| 1 | Wer ist Eigentümer der Google-Konten (Firmenkonto, zwei Inhaber)? Zugang zu bestehendem Profil, GSC, GA4 | liefern |
| 2 | Hausnummer 9 oder 11 | entscheiden |
| 3 | DNS-Zugang für die Domain-Verifizierung | liefern |
| 4 | Welche Artikel mit echtem Preis online dürfen: Atelierverkauf-Liste mit Preis und Zustand, Accessoires, Gutscheinwerte | liefern |
| 5 | Je Marke: schriftliche Freigabe für Online-Preise und für Bildnutzung (sonst kein lokales Inventar für diese Marke) | einholen |
| 6 | Versandkosten und Lieferzeiten AT/DE/CH, Rückgaberegeln (mit Anwalt) | liefern |
| 7 | Rechtsträger für Ads-Zahlungsprofil und Merchant Center (heute MW Immobilienverwaltungs GmbH oder künftige Handels-GmbH?) | entscheiden |
| 8 | Wer filmt und fotografiert (intern oder extern, Budget), Einwilligungen des Teams | entscheiden |
| 9 | Google-Extended weiter sperren? (Empfehlung: ja) | entscheiden |
| 10 | Feste IP des Showrooms für den GA4-Filter | liefern |

---

## Quellen

**Im Rahmen dieses Berichts abgerufen (26.10.2026):**
- Google Search Central – Google Discover (Stand 09.03.2026): https://developers.google.com/search/docs/appearance/google-discover
- Google Search Central – AI features and your website (Stand 10.12.2025): https://developers.google.com/search/docs/appearance/ai-features
- Google Search Central – Image SEO best practices (Stand 02.03.2026): https://developers.google.com/search/docs/appearance/google-images
- Merchant Center – Verfügbarkeit im lokalen Inventar (inkl. „On display to order“): https://support.google.com/merchants/answer/7371390
- Merchant Center – On display to order (Anforderungen Zielseite, Freischaltung): https://support.google.com/merchants/answer/7029575
- Merchant Center – Impressum bestätigen (AT, DE, CH): https://support.google.com/merchants/answer/14675634
- Search Engine Roundtable – Länder für lokale Inventaranzeigen und kostenlose lokale Einträge (06/2026): https://www.seroundtable.com/google-local-inventory-ads-and-free-local-listings-regions-41578.html
- PPC News Feed – Impressum-Pflicht für lokale Einträge in AT/DE entfällt (09/2026, nicht bei Google bestätigt): https://ppcnewsfeed.com/ppc-news/2026-09/merchant-center-drops-impressum-requirement-for-local-listings/
- Next.js-Doku im Projekt: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` (robots/googleBot, Z. 560–579)

**Fachwissen, vor Umsetzung im jeweiligen Hilfeartikel prüfen:**
- Produktdatenspezifikation Merchant Center: https://support.google.com/merchants/answer/7052112
- Lokale Inventardaten-Spezifikation: https://support.google.com/merchants/answer/14819809
- Search Console – Domain-Property und Verifizierung: https://support.google.com/webmasters/answer/9008080
- Search Console – Bulk-Export nach BigQuery: https://support.google.com/webmasters/answer/12918484
- Strukturierte Daten Produkt / Händlereinträge: https://developers.google.com/search/docs/appearance/structured-data/product
- Video-SEO-Best-Practices und `VideoObject`: https://developers.google.com/search/docs/appearance/video
- Bild-Lizenz-Metadaten: https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata
- Google-Richtlinie zur EU-Nutzereinwilligung: https://www.google.com/about/company/user-consent-policy/
- GA4 Key Events und Grenzen: https://support.google.com/analytics/answer/12844695
- Google-Ads-Richtlinie Marken: https://support.google.com/adspolicy/answer/6118
- Spam-Richtlinien (skalierte Inhalte, Doorway): https://developers.google.com/search/docs/essentials/spam-policies
- EuGH C-236/08 bis C-238/08 *Google France*, C-323/09 *Interflora* (über `digital/14`)
- Interne Berichte: 00, 11, 18, 23, 26; `digital/08`, `09`, `10`, `13`, `14`; `marketing/google-unternehmensprofil.md`, `marketing/google-ads-kampagnen.md`
