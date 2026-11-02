# 07 – E-Commerce-Architektur: von „Merkliste + Anfrage“ zum Online-Verkauf

**Stand:** 26.10.2026 · Rolle: E-Commerce-Architekt · Grundlage: Code im Repo (Next.js 16.3.4), Berichte 00, 11, 18, 23 (Abschnitte 1, 4, 9, 10), 25, Web-Recherche (Quellen am Ende)
**Kennzeichnung:** [belegt] = Quelle angegeben · [Code] = im Repo geprüft · [prüfen] = vor Umsetzung mit Steuerberater, Anwalt oder Anbieter klären · [Schätzung] = eigene Herleitung.
**Keine Rechts- oder Steuerberatung.** Punkte zu USt, Gutscheinen, Fernabsatz und Barrierefreiheit gehen vor dem Start zum Steuerberater bzw. Anwalt.

---

## Kurzfassung (eine Seite)

1. **Heute kann die Website nichts verkaufen.** Es gibt kein Preisfeld, keinen Bestand, keine Versandklasse, keinen Checkout, keine AGB und keine Widerrufsbelehrung [Code]. Der „Warenkorb“ ist eine Merkliste in `localStorage`, die in das Anfrageformular mündet.
2. **Empfehlung: kein Shopsystem einführen, sondern ein schlanker eigener Checkout auf Stripe.** Stripe Checkout (gehostete Bezahlseite) liefert Karte, Apple Pay, Google Pay, EPS, Klarna, PayPal und **TWINT** (auch für ein österreichisches Stripe-Konto, bis CHF 5.000 pro Zahlung [belegt S1]) ohne eigene Zahlungsoberfläche und ohne Kunden-JavaScript-Bundle. Shopify Headless und Medusa wären für ein Team von fünf Personen ein zweites Backoffice, das gepflegt werden muss.
3. **Übergangsweise ist Stripe die Datenquelle, später Frappe.** Solange es keinen Schreibzugang und kein Preisfeld im Backoffice gibt, werden Gutscheine, Outlet-Stücke und Anzahlungen **im Stripe-Dashboard gepflegt** (Produkt, Preis in EUR und CHF, Bilder, Metadaten). Die Website liest sie aus Stripe. Sobald das Backoffice die Felder aus Abschnitt 4.9 hat, wandern Katalog und Aufträge nach Frappe/ERPNext, und Stripe bleibt nur Zahlungsabwickler.
4. **Reihenfolge nach Umsatz und Machbarkeit:**
   - **Woche 1 (ohne Code):** Gutschein über einen Stripe Payment Link mit frei wählbarem Betrag, PDF manuell aus einer Designvorlage. Live vor dem Adventsabend am 26.11.
   - **Woche 2–4 (S–M, ohne Backoffice):** Gutschein-Seite mit automatischem PDF, Code und Restwert, Outlet-Seite mit echten Preisen aus Stripe, Pflichtseiten (AGB, Widerruf, Versand und Zahlung), GA4-E-Commerce-Events.
   - **Ab Monat 2 (M):** Anzahlung per Zahlungslink, Accessoires und Kerzen mit Paketversand, Merchant-Center-Feed für Outlet und Accessoires.
   - **Blockiert bis Backoffice-Felder:** Preise und `Offer` auf den 1.765 Katalogseiten, „ab“-Preise, Lagerbestand, lokales Inventar in Google, Aufträge in Frappe.
5. **Umsatzerwartung (aus 11 und 23):** Shop gesamt 0,1–0,3 Mio. € pro Jahr, davon Outlet 100–300 T€ Liquidität in 3–6 Monaten und Gutscheine 5–20 T€ bis Weihnachten [Schätzung]. Der größere Hebel ist indirekt: **Preise und „Ausstellungsstück sofort verfügbar“ sind das einzige SEO- und Shopping-Feld, das kein Wettbewerber der Region besetzt** (25, H1/H2).

---

## 1. Ist-Zustand im Code

| Bereich | Befund | Datei(en) |
|---|---|---|
| Framework | Next.js **16.3.4**, App Router, JavaScript, React 19.2, Tailwind 4, next-intl 4.13 (de/en/fr/it). Proxy statt Middleware (`src/proxy.js`), Matcher schließt `api`, `revalidate/` und alles mit Punkt (`.xml`) aus. **Cache Components sind nicht aktiv**, Daten werden mit `fetch(…, { next: { revalidate, tags } })` gecacht. | `package.json`, `next.config.js`, `src/proxy.js` |
| Hosting | Selbst gehostet mit PM2, eine Instanz (`next start`, Port 3000), Logs unter `/var/log`. Kein Vercel. Webhooks und Route Handler laufen damit dauerhaft und ohne Funktions-Timeouts. | `ecosystem.config.js` |
| Produktdaten | Doctype „Produkte New“ über Gast-Endpunkte (`get_produkte_by_kategorie`, `…_by_marke_api`, Detail per `path_field`). `toShopProduct()` mappt nur `id, name, brand, categoryKey, indoorOutdoor, image, url_slug, designer, subCategoryKeys, colorKeys, materialKeys`. **Kein Preis, kein Bestand, keine Lieferzeit, kein Gewicht, keine Versandklasse.** | `src/lib/api/fetchAllProdukte.js`, `src/lib/shop/shopProducts.js` |
| Demo-Katalog | `staticShopProducts.js` mit Platzhalterprodukten plus Importen (Brand van Egmond, next125, Tréca) aus CSV. Keine Preise. | `src/lib/data/staticShopProducts.js`, `src/lib/data/importedProducts/*` |
| Merkliste | `CartContext` speichert Positionen in `localStorage` („cart“), Menge, Entfernen. Texte sprechen von „Markenliste“ (Tippfehler für Merkliste, nur Deutsch). | `src/context/CartContext.js` |
| „Warenkorb“-Seite | `CartPage` zeigt die Merkliste und öffnet `AnfrageFormProduct`. Kein Preis, keine Summe, kein Checkout. | `src/components/CartPage/CartPage.js`, `src/app/[locale]/merkliste/page.js` |
| Anfrage | `POST /api/anfrage_produkt` validiert Pflichtfelder und leitet an `backoffice.platzhirsch.studio/…anfrage_produkt.api.create_anfrage` weiter (Gast-Endpunkt, **der einzige Schreibweg ins Backoffice**). | `src/app/api/anfrage_produkt/route.js` |
| API-Schlüssel | `getApiHeaders()` mit `API_KEY`/`API_SECRET` existiert, wird für Produktdaten nicht gebraucht. Ob der Schlüssel Schreibrechte auf neue Doctypes hätte, ist [prüfen]. | `src/lib/apiBaseUrl.js` |
| Strukturierte Daten | `productSchema()` erzeugt `Product` **bewusst ohne `offers`** (Kommentar: „prices aren't published“). Damit gibt es weder Preis-Snippets noch kostenlose Shopping-Einträge. | `src/lib/seo/structuredData.js` |
| Tracking | `trackEvent`/`trackLead` über `window.gtag` mit Consent Mode v2. Genutzt für `generate_lead` (Anfrage, Beratung, Kontakt) und `sign_up` (Newsletter). **Keine E-Commerce-Events** (`view_item`, `add_to_cart`, `begin_checkout`, `purchase`). | `src/lib/analytics.js`, `src/components/Cookies/cookiecomponent.js` |
| Revalidierung | Webhook-Routen `src/app/revalidate/*/route.js` mit `revalidatePath`. Next 16 verlangt bei `revalidateTag` das zweite Argument (`'max'`), die Ein-Argument-Form ist veraltet [Next-Doku `revalidateTag.md`]. | `src/lib/revalidate.js`, `src/lib/revalidateAuth.js` |
| Sitemaps | Eigene Route Handler für Produkte, Marken, News, Statisch. Ein Merchant-Feed lässt sich im selben Muster bauen. | `src/app/sitemap-*.xml/route.js` |
| Rechtsseiten | Impressum und Datenschutz vorhanden. **AGB, Widerrufsbelehrung, Versand und Zahlung, Gutscheinbedingungen fehlen** [Code: keine Treffer für „AGB“/„Widerruf“]. | `src/components/Impressum`, `src/components/Datenschutz` |
| Sicherheitsheader | HSTS, `X-Frame-Options: DENY`, keine CSP. Stripe Checkout als Weiterleitung braucht keine CSP-Ausnahmen. | `next.config.js` |

**Was die Next-16-Doku für die Umsetzung vorgibt** (gelesen in `node_modules/next/dist/docs/01-app/`):
- **Webhooks** gehören in einen Route Handler und lesen den Rohtext mit `await request.text()`, ohne Body-Parser-Konfiguration (`03-api-reference/03-file-conventions/route.md`, Abschnitt „Webhooks“). Das passt genau zur Signaturprüfung von Stripe.
- **`revalidateTag(tag, 'max')`** im Webhook, wenn ein Outlet-Stück verkauft oder geändert ist. `updateTag` geht nur in Server Actions, nicht in Route Handlern (`updateTag.md`).
- **`unstable_cache`** ist in Next 16 durch `use cache` ersetzt (`unstable_cache.md`). Da Cache Components hier nicht aktiv sind, lesen wir Stripe-Daten mit einfachem `fetch` auf die Stripe-REST-API und `next: { revalidate, tags }`, genau wie die bestehenden Fetcher. Das Stripe-SDK nutzen wir nur für Schreibvorgänge und die Webhook-Prüfung.
- **`after()`** (`04-functions/after.md`) eignet sich, um nach dem Webhook-Response PDF und E-Mail zu erzeugen, ohne die Antwort an Stripe zu verzögern. Stripe erwartet eine schnelle 2xx-Antwort.

---

## 2. Benchmark

### 2.1 Was die Besten weltweit machen

| Anbieter | Was sie verkaufen und wie | Übertragbar auf Platzhirsch |
|---|---|---|
| **Minotti, Poliform** (Hersteller) | Kein Endkunden-Shop, nur Händlersuche und Kataloge. Preise nirgends. | Der Hersteller lässt die Lücke „Preis und Verfügbarkeit“ offen. Wer sie füllt, bekommt die Kaufsuchen. |
| **RH (Restoration Hardware)** | Vollsortiment online, Mitgliedschaft mit Preisvorteil, Lieferung mit Montage („white glove“), Design-Beratung in Galerien. [eigene Kenntnis, prüfen] | Montage als Versandklasse; „Beratung + Kauf“ statt reinem Shop. |
| **The Conran Shop** | Shop, „Outlet & Clearance“ bis −70 %, Trade-Programm, Möbel-Abholservice, Gratisversand ab Bestellwert [belegt S6]. | **Outlet als eigener Bereich** und ein Trade-Programm für Architekten (23, 8.1). |
| **Connox, AmbienteDirect** | Großer Online-Shop für Leuchten und Accessoires, Rabatte unter UVP (Flos −15 %, PH5 −27 % laut 11), Gutscheine per E-Mail zum Ausdrucken, 3 % Skonto bei Vorkasse [belegt S7]. | **Nicht** über den Preis gegen sie antreten (23, Abschnitt 9). Gewinnen über Beratung, Montage, Abholung, CHF-Lieferung und Einzelstücke. |
| **Flos (eigener Store DE)** | Offizieller Online-Store mit Klarna, Gratisversand ab 200 € (11, [S4]). | Bei Flos-Bestsellern kein Online-Preisvorteil möglich, nur Zusatznutzen. |
| **Pamono** | Marktplatz für Ausstellungsstücke und Klassiker (11). | Zusatzkanal für teure Outlet-Stücke, nicht Ersatz für die eigene Seite. |

**Muster der Besten:** (1) echte Preise und Lieferzeiten, (2) Outlet als dauerhafter, gepflegter Bereich, (3) Lieferung mit Montage als Leistung, (4) Gutscheine digital und sofort, (5) Ratenkauf (Klarna) bei hohen Warenkörben, (6) Trade-Konten für Profis.

### 2.2 Was die regionalen Wettbewerber (nicht) haben

| Wettbewerber | Shop / Preise | Gutschein online | Outlet online | Termin online | Quelle |
|---|---|---|---|---|---|
| **Höttges** (Dornbirn) | nein | nein | nur ein Bild „Sommer-Sale-2026“, keine Stücke | Mail-Link „Erst-Termin buchen“ | [belegt S5, abgerufen 26.10.2026] |
| **reiter design** | nicht geprüft (Domain `reiter-design.at` und `reiterdesign.at` lösen nicht auf) | – | – | – | [prüfen: richtige Domain] |
| **Dolce Vita, Hutle, Thöny, Gamma, Fretz** | kein Premium-Händler im Umkreis zeigt Preise oder hat eine Kasse; Kalender nur bei Teo Jakob, Bihler, Gamma, Fretz | – | – | teils | 23, Abschnitt 4.2 (Bericht 20) |
| **Lifestyle Haus** (Lochau) | Online-Shop vorhanden (Sortiment unterhalb Premium) | [prüfen] | [prüfen] | – | 23, 4.3 |

**Folgerung:** Ein Platzhirsch-Shop für Gutscheine, Ausstellungsstücke und Accessoires mit echten Preisen in EUR und CHF, TWINT und Montage-Lieferung wäre **in der Premium-Klasse am östlichen Bodensee allein**. Das ist Alleinstellung Nr. 4 aus dem Masterkonzept (23, 4.2). Sie ist kopierbar, wer zuerst kommt, besetzt aber die Suchtreffer und das Shopping-Feld.

---

## 3. Konzept und Zielbild

### 3.1 Drei Verkaufsarten auf einer Seite

Jedes Produkt hat genau eine Verkaufsart. Die Merkliste bleibt, sie wird zum **Hybrid-Warenkorb**.

| Verkaufsart | Für | Ablauf | Zahlung |
|---|---|---|---|
| **A – Sofort kaufen** | Gutscheine, Accessoires, Kerzen, Akkuleuchten, Outlet bis ca. 5.000 € | Warenkorb → Stripe Checkout → Bestätigung, Rechnung, Versand oder Abholung | Karte, Apple/Google Pay, EPS, PayPal, Klarna, TWINT (CHF) |
| **B – Reservieren mit Anzahlung** | Outlet über ca. 5.000 €, Stücke mit Montage | Reservierung gegen Anzahlung (z. B. 20 %, max. 1.000 €) → Termin → Restzahlung bei Lieferung | wie A, Rest per Überweisung oder vor Ort |
| **C – Anfrage** (heute) | Alle 1.765 Katalogprodukte, Küchen, Projekte | Merkliste → Anfrageformular → Angebot → **Anzahlungslink** | Anzahlung per Stripe-Rechnung oder Überweisung |

### 3.2 Architektur

```
                        ┌───────────────────────────────┐
  Besucher ─► Next.js   │ /gutscheine  /outlet  /shop    │
  (de/en/fr/it)         │ Produktseite: Preis | Anfrage   │
                        │ Hybrid-Warenkorb (/merkliste)   │
                        └──────┬───────────────▲─────────┘
            POST /api/checkout │               │ fetch (revalidate 300, tag "outlet")
            (Server: Preis aus │               │
             Quelle, nie aus   ▼               │
             dem Browser)  ┌──────────────────────────────┐
                           │ Stripe                        │
                           │  Checkout (hosted), Tax,      │
                           │  Invoicing, Payment Links,    │
                           │  Produktkatalog (Übergang)    │
                           └──────┬───────────────────────┘
               Webhook (signiert) │ checkout.session.completed …
                                  ▼
                 POST /api/stripe/webhook  ─► after(): Gutschein-PDF, Mail,
                                  │                    revalidateTag('outlet','max')
            Phase 2 (mit Zugang)  ▼
                 Frappe/ERPNext: Sales Order, Sales Invoice, Payment Entry,
                 Gutschein-Doctype, Bestand. Produkte New ↔ Item/Item Price.
```

**Grundsätze**
1. **Preise kommen immer vom Server.** `/api/checkout` erhält nur IDs und Mengen. Preise holt der Server aus Stripe (Übergang) oder Frappe (später). Ein manipulierter Browser kann den Preis nicht ändern.
2. **Gehostete Bezahlseite.** Keine Kartendaten auf unserem Server (PCI-Umfang minimal), keine Zahlungsoberfläche zu pflegen, Apple Pay ohne Domain-Hosting-Aufwand. Kein `@stripe/stripe-js` im Browser nötig: Der Server antwortet mit `session.url`, der Browser leitet weiter.
3. **Eine Quelle für Aufträge.** Übergang: Stripe-Dashboard ist die Auftragsliste (Team bekommt E-Mail pro Zahlung). Später: Webhook legt Sales Order in Frappe an, Stripe bleibt Zahlungsbeleg.
4. **Eine Quelle für Rechnungen.** Übergang: Stripe-Rechnung (Checkout mit Rechnungserstellung). Später: ERPNext Sales Invoice. Nie beide gleichzeitig für denselben Verkauf.
5. **Kein neues Konto, kein Login.** Gast-Checkout. Kundenkonten bringen bei diesem Sortiment keinen Mehrwert und kosten Pflege.

### 3.3 Warum nicht Shopify Headless oder Medusa

| Kriterium | **Eigener Checkout + Stripe** (Empfehlung) | **Shopify Headless** (Storefront API, Hydrogen-React) | **Medusa v2** (Open Source) |
|---|---|---|---|
| Laufende Kosten | nur Transaktionsgebühren (Karte EWR 1,5 % + 0,25 €) [belegt S2] | Abo pro Monat plus Gebühren [prüfen: aktueller AT-Tarif] | Server, Postgres, Redis, Updates |
| Gutscheine | selbst gebaut (S–M), Restwert-Logik einfach | **eingebaut** (ab Basic-Tarif) [prüfen] | Gift-Card-Modul [prüfen: Umfang in v2] |
| TWINT | ja, über Stripe auch mit AT-Konto [belegt S1] | über Shopify Payments / Drittanbieter [prüfen] | über Stripe-Plugin |
| Zweites Backoffice | nein | **ja** (Produkte, Preise doppelt pflegen) | **ja**, selbst betrieben |
| Bezug zu Frappe | direkt (Webhook → Sales Order) | Connector nötig | Connector nötig |
| Showroom-Kasse | bleibt bestehende Registrierkasse | Shopify POS, RKSV-Konformität in AT nur mit Zusatz-App [prüfen] | – |
| Aufwand für 5 Personen | niedrig | mittel (doppelte Datenpflege) | **hoch** (Betrieb, Sicherheit) |
| Wann neu bewerten | – | ab ca. 300 aktiven SKUs mit Lager und Varianten | wenn ein eigenes Dev-Team da ist |

**Entscheidung:** eigener schlanker Checkout auf Stripe. Shopify erst wieder prüfen, wenn das Accessoire-Sortiment auf mehrere hundert lagergeführte Artikel mit Varianten wächst.

### 3.4 Zahlarten (Stripe, Konto in Österreich)

| Zahlart | Gebühr [belegt S2, S3] | Wozu | Hinweis |
|---|---|---|---|
| Karte EWR | 1,5 % + 0,25 € (Premium-Karten 2,8 %) | Standard | Apple Pay und Google Pay laufen als Karte |
| Karte CH/international | 3,15 % + 0,25 €, +2 % bei Währungsumrechnung | Schweizer Kunden | CHF-Preise direkt anlegen, damit nicht umgerechnet wird |
| **EPS** | 1,6 % + 0,25 € | Österreich, Online-Banking | aktivieren |
| **TWINT** | 2,6 % + 0,25 € | Schweiz, **max. CHF 5.000**, nur CHF | Auflagen: vollständiges Impressum, **Schweiz als Lieferziel** bei physischen Waren, Preise in CHF spätestens im Checkout [belegt S1] |
| **Klarna** (AT, DE, CH) | 2,99 % + 0,35 € | Raten, „in 30 Tagen zahlen“ = Kauf auf Rechnung für Privatkunden | Händler bekommt das Geld sofort, Ausfallrisiko trägt Klarna |
| **PayPal** über Stripe | 0,2 % + 0,10 € plus PayPal-Gebühren | Vertrauen bei DE-Kunden | eigenes PayPal-Geschäftskonto nötig |
| Billie (Rechnung B2B) | 3,5 % + 0,30 € | Firmengeschenke, Architekten | optional, ab Firmengeschenk-Aktion |
| SEPA-Lastschrift | 0,35 € | Anzahlungen | Rückbuchung bis 8 Wochen, für Anzahlungen eher Überweisung |
| Stripe Tax | 0,5 % pro Transaktion (No-Code) | OSS-Steuersätze automatisch | erst ab Lieferung in mehrere EU-Länder sinnvoll |
| Stripe Invoicing | 0,4 % pro bezahlter Rechnung | Rechnung + Anzahlungslink | Starter-Tarif |

**Nicht empfohlen:** eigener PayPal-Button (`@paypal/react-paypal-js`, zusätzliches Bundle und zweiter Anbieter), eigene Klarna-Integration. Alles läuft über einen Anbieter und ein Dashboard.

---

## 4. Konkrete Features

### F1 – Gutschein-Shop (sofort, vor Weihnachten)

**Nutzen:** 5–20 T€ bis Weihnachten [Schätzung, 23 Abschnitt 5]. Firmengeschenke (30–50 Firmen) laufen über denselben Weg. Jeder Gutschein bringt einen neuen Besucher in den Showroom und eine E-Mail-Adresse. Keyword „Gutschein Möbel Vorarlberg / Bregenz / Lindau“ ist leicht zu gewinnen [Schätzung].

**Produktregeln (mit Steuerberater bestätigen):**
- Wertgutschein ab 25 €, frei wählbar bis 5.000 € (TWINT-Grenze), Vorschlagsbeträge 50/100/250/500/1.000 €.
- **Unbefristet** ausstellen. In Österreich gilt dann die allgemeine Verjährung von 30 Jahren (23, Abschnitt 5). Befristungen unter 30 Jahren sind in AT nur mit sachlicher Rechtfertigung haltbar [prüfen].
- Einlösbar im Showroom, im Online-Shop und **auch im Café**. Damit ist er ein **Mehrzweckgutschein**: Umsatzsteuer erst bei Einlösung, nicht beim Verkauf [prüfen, AT UStG]. Gilt er nur für Möbel/Accessoires zu 20 %, wäre ein Einzweckgutschein möglich (USt bei Verkauf). Für einfache Buchhaltung Mehrzweck empfohlen.
- Teileinlösung mit Restwert, keine Barauszahlung.
- Widerrufsrecht 14 Tage gilt auch für online gekaufte Gutscheine (Fernabsatz) [prüfen].

**Stufe 0 – ohne Code, in 1–2 Tagen live:**
1. Stripe-Konto für die Handelsgesellschaft eröffnen (Impressumsangaben müssen zum Konto passen, siehe 23, 11.1: ggf. neue Handels-GmbH).
2. **Payment Link** „Platzhirsch Geschenkgutschein“ mit „Kunden wählen den Preis“ (Minimum 25 €), Benutzerfelder „Name des Beschenkten“ und „Grußtext“, Rechnungserstellung an, Zahlarten Karte/Apple/Google Pay/EPS/PayPal/Klarna. Zweiter Link in CHF für TWINT.
3. Gutschein-PDF aus einer Designvorlage (Canva/InDesign), Code fortlaufend `PH-2026-0001`. Das Team schickt das PDF innerhalb von 24 Stunden. Liste der Codes in einer gemeinsamen Tabelle.
4. Statische Seite: Link auf der Startseite, im Footer, im Newsletter, als QR-Aufsteller im Showroom und im Café. Ohne Code-Änderung geht nur der externe Link. Eine eigene Seite unter `/de/gutscheine` braucht einen Deploy (S, siehe Stufe 1).

**Stufe 1 – automatisch (Aufwand S–M, ohne Backoffice):**
- Seite `/[locale]/gutscheine` mit Betragsauswahl, Motivwahl (2–3 Vorlagen), Empfängername, Grußtext, Versand an Käufer oder direkt an Empfänger zu einem Datum.
- `POST /api/checkout/gutschein` → Stripe Checkout Session (EUR oder CHF), Metadaten: Typ, Motiv, Empfänger.
- Webhook `checkout.session.completed` → in `after()`: Code erzeugen (12 Zeichen ohne verwechselbare Zeichen, z. B. `PH7K-M2QX-9TRA`), PDF aus Vorlage stempeln (Betrag, Code, QR-Code, Grußtext), Mail mit PDF an Käufer/Empfänger, Kopie ans Team.
- **Gutschein-Register ohne Backoffice:** Der Gutschein wird als Metadatum am Stripe-Zahlungsvorgang gespeichert (`voucher_code`, `voucher_value`, `voucher_balance`, `voucher_status`). Stripe kann per Search API nach Metadaten suchen. Für ein Volumen von einigen hundert Gutscheinen pro Jahr reicht das, es braucht keine eigene Datenbank.
- **Einlösung im Showroom:** interne Seite `/intern/gutschein` (Route Handler mit HTTP-Basic-Auth über ein Passwort in der Umgebung, `noindex`), Code eingeben → Restwert anzeigen → Betrag abbuchen → Protokoll in den Metadaten. In der Registrierkasse wird die Einlösung als Zahlungsart erfasst.
- **Online-Einlösung** im Checkout erst in Stufe 2: Stripe-Rabattcodes sind feste Abzüge ohne Restwert und passen dafür nicht. Online wird der Gutschein serverseitig geprüft und als Rabattzeile (`discounts` mit einmaligem Coupon in Höhe des eingelösten Betrags) übergeben.

**Abhängigkeiten:** Stripe-Konto, Gutscheinbedingungen (Anwalt), Designvorlage, Absender-Mailbox (SMTP), Steuerberater (Mehrzweck- vs. Einzweckgutschein, Registrierkasse bei Einlösung).
**Neue Dateien:** `src/app/[locale]/gutscheine/page.js`, `src/components/Gutschein/GutscheinForm.js`, `src/app/api/checkout/gutschein/route.js`, `src/app/api/stripe/webhook/route.js`, `src/lib/stripe/server.js` (`import "server-only"`), `src/lib/voucher/code.js`, `src/lib/voucher/pdf.js`, `src/lib/mail/send.js`, `src/app/intern/gutschein/route.js`, `public/vouchers/vorlage-*.pdf` (Designvorlage), Texte in `src/messages/*.json`.
**Betroffene Dateien:** Navbar/Footer (Link), `src/lib/seo/sitemapEntries.js`, `src/lib/analytics.js` (Event `purchase` mit `item_category: "gutschein"`).
**Bibliotheken:** `stripe`, `pdf-lib`, `qrcode`, `zod`, `nodemailer` (Tabelle 4.10).

### F2 – Outlet / Ausstellungsstücke mit echten Preisen

**Nutzen:** 100–300 T€ Liquidität in 3–6 Monaten (23). Stärkster SEO-Hebel ohne Backoffice: Suchen wie „Minotti Sofa Ausstellungsstück“, „Minotti Outlet“, „Designermöbel Abverkauf Vorarlberg“ werden von keinem Wettbewerber bedient. **Eigene Fotos der Stücke lösen das Bildrechte-Problem** (keine Herstellerbilder nötig) und liefern zugleich einzigartigen Inhalt. Grundlage für die ersten Google-Shopping-Einträge (F6).

**Umfang:**
- Seite `/[locale]/outlet` (Übersicht, Filter Marke/Kategorie/Preis/sofort abholbar) und `/[locale]/outlet/[slug]` (Detail).
- Pro Stück: eigene Fotos (6–10), Marke, Modell, Maße, Material/Bezug, Zustand mit ehrlicher Beschreibung, Neupreis (als UVP oder ehemaliger Listenpreis, siehe Risiken), Outlet-Preis in EUR und CHF, Standort, Versandklasse, „1 Stück“.
- Verkaufsart A (bis ca. 5.000 €) oder B (darüber: Reservierung mit Anzahlung 20 %, max. 1.000 €, 7 Tage Rücktritt) [Schätzung, Regel mit Inhaber festlegen].
- Nach Verkauf: Stück verschwindet nicht, sondern wird als „verkauft“ mit Hinweis auf ähnliche Katalogprodukte und Anfrage angezeigt (erhält Rankings und leitet Nachfrage um). Nach 60 Tagen `noindex`.

**Übergangslösung ohne Backoffice: Stripe als Outlet-Katalog.**
- Das Team legt jedes Stück im Stripe-Dashboard als **Produkt** an: Name, Beschreibung, bis 8 Bilder, ein Preis mit `currency_options` (EUR und CHF), Metadaten `slug`, `marke`, `kategorie`, `masse`, `zustand`, `neupreis`, `versandklasse`, `standort`, `outlet=true`.
- Die Website liest die aktiven Outlet-Produkte per `fetch` auf die Stripe-API (`revalidate: 300`, Tag `outlet`). Webhooks `product.updated`, `price.updated`, `checkout.session.completed` lösen `revalidateTag('outlet','max')` aus.
- **Doppelverkauf verhindern:** Beim Erstellen einer Checkout-Session setzt der Server `reserved_until` (30 Minuten) am Produkt und lehnt weitere Sessions ab. Session mit `expires_at` 30 Minuten. Nach Zahlung `active=false` und `sold_at`. Bei Abbruch (`checkout.session.expired`) wird die Reservierung gelöscht.
- Vorteil: keine Deploys, Pflege im Browser, ca. 10 Minuten pro Stück. Nachteil: Bilder liegen bei Stripe (Größe und Qualität für die Website prüfen, ggf. Bild-URL in Metadaten auf eigenen Speicher). Später wird Frappe zur Quelle (Feld `ausstellungsstueck`).

**Optional mit der lokalen NVIDIA-Grafikkarte:** Freisteller und einheitlicher Hintergrund für Outlet-Fotos mit einem lokal laufenden Segmentierungsmodell (z. B. BiRefNet über `rembg`, Python). Läuft offline, keine Bilddaten an Dritte. Nur eigene Fotos bearbeiten.

**Abhängigkeiten:** Inventur und Preisregel nach Alter (20–55 %, 23 Abschnitt 9), Fotos, Stripe-Konto, AGB mit Abschnitt „Ausstellungsstücke“ (Gewährleistung bei gebrauchten/ausgestellten Waren, Widerruf), Versand- und Montagepreise, Klärung mit Minotti/Poliform, ob Online-Abverkauf von Ausstellungsware vertraglich eingeschränkt ist (Platzhirsch hat keinen Händlervertrag, also keine Vertragsauflagen; Markennennung bei Originalware ist durch Erschöpfung gedeckt, aber **keine Händler-Behauptung**) [prüfen].
**Neue Dateien:** `src/app/[locale]/outlet/page.js`, `src/app/[locale]/outlet/[slug]/page.js`, `src/lib/shop/outlet.js` (Stripe-Lesezugriff, Mapping), `src/components/Outlet/*`, `src/app/api/checkout/route.js`, Erweiterung des Webhooks.
**Betroffene Dateien:** `src/proxy.js` (Übersetzte Pfade `outlet` in `TRANSLATED_SECTIONS` und Regex), `src/utils/routing.js` (`ROUTES.outlet`), `src/lib/seo/structuredData.js` (neue Funktion `offerSchema()`), `src/lib/seo/sitemapEntries.js`, `next.config.js` (`images.remotePatterns` für `files.stripe.com`, falls Stripe-Bilder genutzt werden).

### F3 – Hybrid-Warenkorb und Checkout für Accessoires, Kerzen, Leuchten

**Nutzen:** 0,1–0,2 Mio. € pro Jahr Shop-Umsatz (23, Abschnitt 9), höhere Frequenz, Geschenkkäufe. Nur Sortimente ohne Preisvergleichs-Falle: Tom Dixon Scent, Minotti-Textilien, Akkuleuchten, Outdoor-Zubehör, Bettwäsche, Kerzen von Nischenmarken. **Keine bekannten Leuchten unter UVP** (Connox-Falle, 11).

**Umfang:**
- `CartContext` bekommt pro Position `saleType` (`buy` | `reserve` | `inquiry`), `priceId`, `unitAmount`, `currency`. Bestehende Merklisten-Einträge bleiben `inquiry`.
- `CartPage` teilt in zwei Blöcke: „Direkt kaufen“ (Summe, Versand, „Zur Kasse“) und „Anfrage“ (bestehendes `AnfrageFormProduct`). Beide können in einem Besuch genutzt werden.
- Länderwahl vor dem Checkout (AT, DE, CH, FL, IT): bestimmt Währung, Steuer und Versandoptionen.
- `POST /api/checkout`: validiert mit `zod`, lädt Preise serverseitig, baut `line_items`, `shipping_options` je Versandklasse, `shipping_address_collection` (allowed_countries), `invoice_creation`, `locale` passend zur Seite, `consent_collection.terms_of_service = required`.
- Erfolgsseite `/[locale]/bestellung/danke?session_id=…`: Session serverseitig laden, Zusammenfassung zeigen, GA4 `purchase` genau einmal mit `transaction_id` senden.
- Bis das Backoffice Preise hat: Shop-Artikel ebenfalls als Stripe-Produkte (`shop=true`), wie beim Outlet.

**Versandklassen** [Schätzung, Preise mit Spediteur festlegen]:

| Klasse | Inhalt | AT / DE | CH / FL | Abholung Lochau |
|---|---|---|---|---|
| P – Paket | bis 31,5 kg (Kerzen, Akkuleuchten, Textilien) | Pauschale, frei ab Bestellwert | Pauschale + Hinweis Einfuhr (siehe Steuern) | kostenlos |
| S – Sperrgut | Kleinmöbel, Schirmsockel | Pauschale nach Zone | Spedition, Preis nach Zone | kostenlos |
| M – Lieferung + Montage | Möbel, große Schirme, Outlet | Zone 1 (≤ 30 km: Vorarlberg, Lindau) fix, Zone 2 (≤ 100 km) fix, sonst Angebot | wie DE, verzollt nur mit CH-Registrierung | kostenlos |
| D – Digital | Gutscheine | 0 € | 0 € | – |

**Steuern und Preise (mit Steuerberater bestätigen):**
- **AT:** Bruttopreise inkl. 20 % USt.
- **DE und übrige EU an Privatkunden:** Ab 10.000 € EU-weitem Fernverkaufsumsatz gilt der Steuersatz des Ziellands (DE 19 %, IT 22 %) über **OSS** [eigene Kenntnis, prüfen]. Einfachste Lösung: einheitlicher Bruttopreis, Steuer wird je Land herausgerechnet (Marge schwankt um wenige Prozent). Stripe Tax übernimmt Sätze und Berichte ab dem Zeitpunkt, an dem DE-Umsätze relevant werden.
- **B2B mit UID:** Steuerfreie innergemeinschaftliche Lieferung (Reverse Charge), UID-Abfrage im Checkout (`tax_id_collection`).
- **CH/FL:** Ausfuhr aus AT netto (§ 6 Abs. 1 UStG, Ausfuhrnachweis). Ohne Schweizer MWST-Registrierung zahlt der Kunde die 8,1 % Einfuhrsteuer plus Verzollungsgebühr bei der Zustellung (DAP), klar im Checkout ausweisen. **Ziel:** CHF-Preis inkl. 8,1 % MWST, verzollt (DDP) über Unterstellungserklärung und Steuervertreter (18 und 11, Abschnitt 4). Pakete alternativ DHL PDDP (11). Gutscheine (digital) haben kein Zollthema.
- **Preisangaben:** Endpreise inkl. USt, Versandkosten vor dem Checkout sichtbar. Bei Streichpreisen gilt die 30-Tage-Regel für den eigenen früheren Preis (Omnibus). UVP-Vergleiche nur als „UVP des Herstellers“ und nur, wenn die UVP tatsächlich existiert und aktuell ist [prüfen].

**Abhängigkeiten:** Wareneinkauf (23, Abschnitt 5, Nr. 5), Lagerfläche, Versandverträge (Post AT, DHL), AGB/Widerruf/Versandseite, Bildrechte für Produktbilder (Tom Dixon, Minotti-Textilien: schriftliche Freigabe einholen oder eigene Fotos).
**Betroffene Dateien:** `src/context/CartContext.js`, `src/components/CartPage/CartPage.js`, `src/components/ShopCatalog/productActions.js` (Button „In den Warenkorb“ statt nur Herz, wenn `saleType=buy`), `src/lib/analytics.js` (`view_item`, `add_to_cart`, `begin_checkout`, `purchase`), `src/messages/*.json`.
**Neue Dateien:** `src/app/api/checkout/route.js`, `src/app/[locale]/bestellung/danke/page.js`, `src/lib/shop/shipping.js`, `src/lib/shop/tax.js`, `src/lib/shop/catalogSource.js` (Weiche Stripe ↔ Frappe), Rechtsseiten (F7).

### F4 – Anzahlung für Projekte

**Nutzen:** Schnellerer Geldeingang bei Aufträgen von 20–200 T€, weniger Nachfassen, Grundlage für Alleinstellung „abgesicherte Anzahlung“ (23, 4.2 Nr. 3 und 10 Nr. 1). Professioneller Auftritt gegenüber CH-Kunden (Rechnung in CHF, TWINT bis CHF 5.000).

**Umfang (ohne Code möglich):**
- **Stripe Invoicing aus dem Dashboard:** Rechnung „Anzahlung Angebot Nr. …“, Betrag, Fälligkeit, Zahlungslink per Mail. Zahlarten: Überweisung (Standard bei hohen Beträgen), Karte, EPS, TWINT (≤ CHF 5.000), Klarna-Finanzierung für Privatkunden [prüfen Klarna-Obergrenzen]. Gebühr 0,4 % plus Zahlart.
- **Mit Code (S):** Seite `/[locale]/anzahlung` mit Angebotsnummer und Betrag, serverseitig signierter Link (`?ref=A-2026-123&amount=…&sig=…`, HMAC mit Geheimnis aus der Umgebung), damit niemand Beträge verändert. Später liefert Frappe Angebot und Betrag.

**Grenzen und Empfehlung:**
- Karten-Anzahlungen über 5.000 € kosten 1,5–3,2 % (bei 30.000 € also 450–960 €). **Hohe Anzahlungen per Überweisung**, Karte/Klarna nur für kleinere Anzahlungen oder auf Kundenwunsch.
- Lange Lieferzeiten (12–20 Wochen) sind für Stripe ein Risikomerkmal. Stripe kann Rücklagen (Reserve) verlangen, Karten-Rückbuchungen sind Monate später möglich [eigene Kenntnis, prüfen]. Geschäftsmodell und Lieferzeiten bei der Kontoeröffnung offen angeben.
- „Abgesicherte Anzahlung“ ist **keine** Stripe-Funktion. Sie kommt über Bankgarantie/Kreditversicherung (23, Abschnitt 10). Die Website darf sie erst bewerben, wenn sie vertraglich steht (UWG).

**Abhängigkeiten:** Stripe-Konto, Angebotsnummern (Frappe), Liquiditätsplanung, Garantiepartner für die Sicherheits-Aussage.
**Neue Dateien (optional):** `src/app/[locale]/anzahlung/page.js`, `src/app/api/checkout/anzahlung/route.js`, `src/lib/stripe/signedLink.js`.

### F5 – Preise und `Offer` auf Produktseiten („ab“-Preise, Verfügbarkeit)

**Nutzen:** Größter Ranking-Hebel aus dem SEO-Schlachtplan (25, H1/H2): Preis-Snippets, kostenlose Shopping-Einträge, Antworten auf „Was kostet ein Minotti Lawrence?“. Kein Wettbewerber zeigt Preise.

**Umfang:**
- `toShopProduct()`/`toShopProductDetail()` um `price`, `priceType` (`fix` | `ab`), `currency`, `availability`, `deliveryWeeks`, `showroom` erweitern.
- Anzeige nur bei `shop_freigabe` bzw. `preis_freigabe`. Alle anderen Produkte bleiben „Preis auf Anfrage“.
- `productSchema()` bekommt `offers`: bei Fixpreis `Offer` mit `price`, `priceCurrency`, `availability`, `itemCondition`, `shippingDetails`, `hasMerchantReturnPolicy`; bei „ab“-Preis `AggregateOffer` mit `lowPrice`. Für CH eine zweite `Offer` in CHF, sobald CHF-Preise gepflegt sind.
- „In der Ausstellung Lochau zu sehen“ als Badge und als Filter.

**Abhängigkeiten:** **Blockiert** bis Backoffice-Felder (4.9) und Herstellerklärung zur Preisdarstellung (25, H2). **Übergang ohne Backoffice:** für 20–50 Leitmodelle (z. B. Minotti Lawrence, Connery, Poliform Ventura) „ab“-Preise in einer kleinen Datei im Repo (`src/lib/data/fromPrices.js`, Schlüssel `path_field`) oder als Stripe-Preise mit `lookup_key = path_field`. Das Team pflegt die Stripe-Variante ohne Deploy. Nur mit Freigabe des Inhabers und nachweisbarer Preisgrundlage (aktuelle Preisliste).
**Betroffene Dateien:** `src/lib/shop/shopProducts.js`, `src/lib/api/fetchAllProdukte.js`, `src/lib/seo/structuredData.js`, `src/app/[locale]/produkte/[category]/[product]/page.js`, `src/components/ShopCatalog/productActions.js`, `src/components/ShopCatalog/productInfoTabs.js`, `src/components/ShopCatalog/shopCatalog.js` (Preisfilter).

### F6 – Google Merchant Center: kostenlose Produkteinträge und lokales Inventar

**Nutzen:** Kostenlose Einträge im Shopping-Tab, in Google Bilder und bei Produktsuchen. Mit lokalem Inventar erscheint „im Geschäft verfügbar – Platzhirsch Lochau“ in Google Maps und bei „in der Nähe“-Suchen. **Damit lässt sich das Local Pack ohne Händlerverzeichnis-Link angreifen** (25, H3).

**Umfang:**
- Feed als Route Handler `src/app/merchant-feed.xml/route.js` (RSS 2.0 mit `g:`-Namensraum), gleiches Muster wie die Sitemaps, `revalidate` 1 Stunde. Pro Land eigener Feed oder Feed-Regeln: AT/DE in EUR, CH in CHF.
- Pflichtattribute: `id`, `title`, `description`, `link`, `image_link` (**nur eigene oder freigegebene Bilder**), `price`, `availability`, `condition` (`new`, bei Ausstellungsstücken je nach Zustand `used` bzw. `refurbished` [prüfen Google-Definition]), `brand`, `gtin` oder `identifier_exists=no` (Minotti-Stücke haben meist keine GTIN), `mpn` wenn vorhanden, `shipping` (oder Versand im Merchant Center), `google_product_category`.
- Im Merchant Center: Website verifizieren (Search Console vorhanden), Versand- und Rückgaberichtlinien hinterlegen, mit dem Google-Unternehmensprofil verknüpfen. Lokales Inventar (Feed `store_code`, `availability=in_stock`) für Outlet-Stücke im Showroom.
- Strukturierte Daten aus F5 dienen als zweite Quelle für automatische Updates.
- Gutscheine nicht in den Feed (Google-Richtlinie zu Geschenkkarten prüfen), Outlet und Accessoires zuerst.

**Abhängigkeiten:** echte Preise (F2/F3, später F5), Bildrechte, Versand- und Rückgabeseite, Google-Unternehmensprofil mit einheitlicher Adresse (25, H3).
**Neue Dateien:** `src/app/merchant-feed.xml/route.js`, `src/lib/seo/merchantFeed.js`. Matcher in `src/proxy.js` schließt `.xml` schon aus.

### F7 – Rechtliche Pflichtseiten und Checkout-Texte

**Nutzen:** Voraussetzung für jeden Online-Verkauf, für TWINT-Freischaltung (Impressum vollständig [belegt S1]) und für das Merchant Center.
**Umfang:** AGB (Fernabsatz, Ausstellungsstücke, Montage, Eigentumsvorbehalt, Anzahlung), Widerrufsbelehrung mit Muster-Formular (AT FAGG), Versand und Zahlung, Gutscheinbedingungen, Datenschutz-Ergänzung (Stripe, Klarna, PayPal als Empfänger), Impressum mit Firmenbuchnummer und UID der **verkaufenden** Gesellschaft. Vier Sprachen, rechtlich maßgeblich Deutsch.
**Abhängigkeiten:** Anwalt, Entscheidung über die verkaufende Gesellschaft (Handels-GmbH, 23, 11.1).
**Neue Dateien:** `src/app/[locale]/agb/page.js`, `…/widerruf/page.js`, `…/versand-zahlung/page.js`, `…/gutscheinbedingungen/page.js`, Komponenten unter `src/components/Rechtliches/*`, Footer-Links.
**Aufwand:** S (Code), Text durch Anwalt.

### F8 – E-Commerce-Messung

**Nutzen:** Ohne Messung kein Budget für Google Ads (23, Abschnitt 9: „nur mit Tracking“).
**Umfang:** `trackEcommerce(name, { currency, value, items })` in `src/lib/analytics.js`; Events `view_item` (Outlet/Shop-Detail), `add_to_cart`, `begin_checkout`, `purchase` (Erfolgsseite, `transaction_id` = Session-ID, gegen doppelte Zählung per `sessionStorage`-Merker). Gutschein als `item_category`. Import nach Google Ads als Conversion. Bleibt hinter Consent Mode v2.
**Aufwand:** S. **Sofort baubar.**

### F9 – Backoffice-Integration (Phase 2)

**Nutzen:** Ein System für Katalog, Bestand, Aufträge und Rechnungen. Das Team pflegt nur noch Frappe.
**Umfang:**
- Webhook schreibt nach erfolgreicher Zahlung eine **Sales Order** (bzw. „Webshop Bestellung“) und **Payment Entry** nach Frappe. Erst wenn das bestätigt ist, gilt der Auftrag als übergeben. Bei Fehler Wiederholung (Stripe wiederholt Webhooks bis zu 3 Tage) und Mail an das Team.
- Gutscheine als eigener Doctype mit Einlösungen.
- Produkte New verknüpft mit ERPNext **Item** und **Item Price** (Preislisten „Webshop EUR“ und „Webshop CHF“). ERPNext-Standard statt eigener Preisfelder spart Entwicklung im Backoffice [prüfen: ist das Backoffice ein volles ERPNext oder nur Frappe mit eigener App?].
- Endpunkte mit API-Schlüssel (nicht Gast): `create_webshop_order`, `get_voucher`, `redeem_voucher`, `get_shop_products`. Ein Webhook aus Frappe an `src/app/revalidate/produkte/route.js` bei Preisänderung (existiert bereits als Muster).
**Abhängigkeiten:** **Backoffice-Zugang und Entwickler für Frappe.** Bis dahin: Stripe-Dashboard + Monatsexport für die Buchhaltung.
**Aufwand:** L.

### 4.9 Benötigte Backoffice-Felder (Liste für den Frappe-Entwickler)

**Doctype „Produkte New“ (oder verknüpftes Item):**

| Feld | Typ | Zweck |
|---|---|---|
| `verkaufsart` | Select: Anfrage / Online-Kauf / Reservierung | steuert Button und Checkout |
| `preis_freigabe` | Check | Preis darf öffentlich angezeigt werden |
| `preis_typ` | Select: fix / ab | `Offer` vs. `AggregateOffer` |
| `preis_eur_brutto` | Currency | Endpreis AT inkl. 20 % |
| `preis_chf` | Currency | fester CHF-Preis (statt Umrechnung) |
| `uvp_eur` | Currency | UVP des Herstellers (nur wenn belegt) |
| `preis_niedrigster_30_tage` | Currency (oder Preis-Historie) | Streichpreis-Regel |
| `steuerklasse` | Select: Normal 20 % / ermäßigt | Café-/Lebensmittel-Ausnahmen, Gutschein |
| `lagerbestand` | Int | Anzeige, Überverkauf verhindern |
| `verfuegbarkeit` | Select: sofort / in Ausstellung / auf Bestellung / ausverkauft | Anzeige, `availability` |
| `lieferzeit_wochen` | Int (von–bis) | Anzeige, Ratgeber |
| `ausstellungsstueck` | Check | Outlet |
| `zustand` | Select: neu / Ausstellungsstück / gebraucht aufbereitet | `itemCondition` |
| `zustand_beschreibung` | Text | Ehrlichkeit, Gewährleistung |
| `abverkaufspreis_eur`, `abverkaufspreis_chf` | Currency | Outlet |
| `standort` | Select: Showroom Lochau / Lager / Hersteller | lokales Inventar |
| `versandklasse` | Select: P / S / M / D / nur Abholung | Versandkosten |
| `gewicht_kg`, `paketmasse_cm` | Float | Paketversand |
| `versand_laender` | Table MultiSelect | AT/DE/CH/FL/IT |
| `gtin`, `mpn` | Data | Merchant Center |
| `hs_code`, `ursprungsland` | Data | Ausfuhr CH, DDP |
| `bildrechte` | Select: eigen / Marke freigegeben / nicht geklärt | steuert Feed und Shop-Anzeige |
| `google_feed` | Check | in Merchant Center aufnehmen |
| `google_produktkategorie` | Data | Feed |
| `stripe_price_id` | Data (optional) | wenn Preise doppelt in Stripe liegen |

**Neue Doctypes:** `Webshop Bestellung` (+ Positionen; oder ERPNext Sales Order mit Quelle „Webshop“), `Gutschein` (Code, Wert, Restwert, Währung, Status, Käufer, Empfänger, Ausstellungsdatum, Stripe-Zahlungs-ID) + `Gutschein Einlösung` (Datum, Betrag, Kanal Showroom/Online/Café, Mitarbeiter), `Anzahlung` (Angebot/Projekt, Betrag, Währung, Stripe-Rechnungs-ID, Status), `Versandregel` (Klasse, Land, Zone, Preis, frei ab).
**Neue Endpunkte:** siehe F9. Gast-Endpunkte nur zum Lesen öffentlicher Daten, Schreiben nur mit Schlüssel.

### 4.10 Empfohlene Bibliotheken

Stand npm-Registry 26.10.2026. Alle laufen **nur auf dem Server** (`import "server-only"`), der Browser-Bundle wächst dadurch nicht. Gesamtzuwachs im Kunden-Bundle: nur die eigenen Komponenten (Warenkorb-Erweiterung, Gutscheinformular), geschätzt unter 10 KB gzip [Schätzung].

| Bibliothek | Version | Lizenz | Größe | Zweck | Bewertung |
|---|---|---|---|---|---|
| `stripe` (Node-SDK) | 23.0.1 | MIT | 17,4 MB entpackt, keine Abhängigkeiten, 0 KB im Browser | Checkout Sessions, Webhook-Signatur, Rechnungen | **Ja.** API-Version im Code fest pinnen. |
| `zod` | 4.6.7 | MIT | 6,1 MB entpackt, 0 KB im Browser (nur Server) | Eingaben der Checkout-Routen prüfen | **Ja** |
| `pdf-lib` | 1.17.1 | MIT | 19,5 MB entpackt (Schriften), nur Server | Gutschein-PDF: Designvorlage laden und Betrag, Code, QR, Grußtext aufstempeln | **Ja**, letzte Version 2022, aber stabil und ohne native Abhängigkeiten. Vorteil: Designer gestaltet das PDF, wir füllen es nur. |
| `@react-pdf/renderer` | 4.9.0 | MIT | 0,3 MB + pdfkit/Fonts, nur Server | Alternative, wenn PDFs komplett im Code gesetzt werden sollen (z. B. Abholschein) | nur falls `pdf-lib` nicht reicht |
| `qrcode` | 1.5.4 | MIT | 0,14 MB, nur Server | QR-Code auf dem Gutschein (Link zur Restwert-Abfrage) | **Ja** |
| `nodemailer` | 10.2.1 | MIT-0 | 1,8 MB, keine Abhängigkeiten | Mails über die bestehende Firmen-Mailbox (SMTP) | **Ja**, kein neuer Anbieter und kein neuer AV-Vertrag |
| `resend` | 6.34.1 | MIT | 0,4 MB | Alternative: Mail-API mit Zustellstatistik | nur wenn SMTP-Zustellung Probleme macht; AV-Vertrag und Datenstandort prüfen |
| `@stripe/stripe-js` | 10.1.0 | MIT | lädt `js.stripe.com` im Browser | nur für eingebettetes Checkout | **Nein**, gehostete Seite per Weiterleitung reicht |
| `@paypal/react-paypal-js` | 10.6.1 | Apache-2.0 | eigenes SDK im Browser | eigener PayPal-Button | **Nein**, PayPal über Stripe |
| `@medusajs/medusa` | 2.22.1 | MIT | eigener Server + Postgres + Redis | Shopsystem | **Nein** (Betriebsaufwand) |
| `@shopify/hydrogen-react` | 2026.4.4 | MIT | Storefront-Komponenten | Shopify Headless | **Nein**, erst ab ~300 Lagerartikeln neu prüfen |

Kein zusätzliches Paket nötig für: Merchant-Feed (Template-String wie die Sitemaps), signierte Links (`node:crypto` HMAC), Codes (`node:crypto.randomInt`).
Umgebungsvariablen: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_API_VERSION`, `SMTP_HOST/USER/PASS`, `INTERN_PASSWORD`, `SIGNED_LINK_SECRET`. Restricted API Key in Stripe mit nur den nötigen Rechten.

### 4.11 Aufwand und Abhängigkeiten im Überblick

| # | Feature | Aufwand | Blockiert durch | Ohne Backoffice? |
|---|---|---|---|---|
| F1a | Gutschein per Payment Link (ohne Code) | S (1–2 Tage, kein Deploy) | Stripe-Konto, Vorlage | **ja** |
| F1b | Gutschein-Seite, PDF, Register, Einlösung | M (5–8 Tage) | Stripe, SMTP, Bedingungen | **ja** |
| F2 | Outlet mit Stripe als Katalog | M (6–10 Tage) | Inventur, Fotos, AGB | **ja** |
| F3 | Hybrid-Warenkorb + Checkout Accessoires | M (8–12 Tage) | Einkauf, Versandverträge, Bildrechte | **ja** (Artikel in Stripe) |
| F4 | Anzahlung | S (Dashboard sofort; Seite 2 Tage) | Stripe | **ja** |
| F5 | Preise/`Offer` auf Katalogseiten | M (Code) + Datenpflege | **Backoffice-Felder**, Herstellerklärung | nur für 20–50 Leitmodelle übergangsweise |
| F6 | Merchant-Center-Feed | S–M (3–5 Tage) | echte Preise, Bildrechte, GBP | **ja** für Outlet/Accessoires |
| F7 | Rechtsseiten | S (Code) | Anwalt, Gesellschaft | **ja** |
| F8 | E-Commerce-Tracking | S (1–2 Tage) | – | **ja** |
| F9 | Frappe-Integration | L (3–6 Wochen inkl. Backoffice) | **Backoffice-Zugang** | nein |

---

## 5. Risiken

### 5.1 Performance
- **Keine Zahlungs-Skripte auf den Seiten.** Gehostetes Checkout, Weiterleitung per `session.url`. Core Web Vitals bleiben unverändert.
- **Stripe nicht pro Seitenaufruf abfragen.** Outlet- und Shopdaten per `fetch` mit `revalidate` und Tags cachen, invalidiert per Webhook. Stripe-API-Limits (ca. 100 Lesezugriffe pro Sekunde im Live-Modus [eigene Kenntnis]) werden so nie erreicht.
- **Webhook schnell beantworten**, PDF und Mail in `after()`. Bei PM2-Neustart während `after()` könnte eine Mail fehlen: Stripe-Event-ID merken und einen täglichen Abgleich („alle bezahlten Gutscheine ohne `voucher_code`“) laufen lassen.
- **Bilder:** Outlet-Fotos über `next/image` (AVIF/WebP ist konfiguriert). Stripe-Produktbilder sind auf Größe begrenzt, für Detailseiten eigene Bildablage prüfen.

### 5.2 Recht und Steuern
- **Keine Händler-Behauptungen.** Outlet-Texte: „Minotti-Ausstellungsstück aus unserem Showroom in Lochau“, nie „offizieller Minotti-Händler“ (25, Abschnitt 3).
- **Bildrechte:** Im Shop und im Merchant-Feed nur eigene Fotos oder schriftlich freigegebene Herstellerbilder. Feld `bildrechte` steuert das später automatisch.
- **Streichpreise und UVP:** Omnibus-Regel (niedrigster Preis der letzten 30 Tage) für eigene Preise; UVP nur, wenn belegt. Bei Ausstellungsstücken lieber „Neupreis laut Preisliste [Jahr]“ mit Beleg im Ordner [prüfen].
- **Fernabsatz:** 14 Tage Widerruf auch für Outlet und Gutscheine; Ausnahmen nur für Maßanfertigungen. Rücknahmekosten für Möbel in den AGB regeln (Kunde trägt Rücksendekosten, wenn vorher darauf hingewiesen).
- **Gewährleistung** bei Ausstellungsstücken: Verkürzung bei gebrauchten Waren an Verbraucher nur eingeschränkt möglich [prüfen VGG].
- **USt:** OSS ab 10.000 € EU-Fernverkauf; CH-Ausfuhr mit Nachweis; Mehrzweckgutschein-Behandlung; Registrierkasse bei Einlösung im Showroom und im Café. Online bezahlte Umsätze sind nach der Barumsatzverordnung grundsätzlich von der Registrierkassenpflicht ausgenommen [prüfen].
- **Barrierefreiheit:** Das österreichische Barrierefreiheitsgesetz (BaFG, seit 28.06.2025) gilt für Online-Shops. Ausgenommen sind Kleinstunternehmen (unter 10 Beschäftigte **und** Umsatz oder Bilanzsumme bis 2 Mio. €) [eigene Kenntnis, prüfen]. Weil die Grenze nahe liegt: Checkout-Seiten von Anfang an nach WCAG 2.1 AA bauen (Stripe Checkout selbst ist barrierefrei ausgelegt [prüfen]).
- **Stripe-Konto der richtigen Gesellschaft:** Geld fließt an die Gesellschaft im Impressum. Wenn eine neue Handels-GmbH kommt (23, 11.1), Konto gleich auf sie eröffnen oder später umziehen (neues Konto, neue Links).
- **Finanzlage:** Kundengeld aus Gutscheinen und Anzahlungen ist bei negativem Eigenkapital (23, Abschnitt 1) haftungsrelevant. Gutscheine und Anzahlungen nicht zur Deckung alter Verbindlichkeiten verwenden, mit Steuerberater/Anwalt abstimmen (Fortbestehensprognose). **Diese Frage zuerst klären.**

### 5.3 Pflege und Betrieb
- **Doppelte Datenhaltung im Übergang** (Stripe-Katalog + Frappe-Katalog). Regel: Outlet und Shop-Artikel nur in Stripe, Katalog nur in Frappe, bis F9 fertig ist. Dann einmalig migrieren.
- **Wer bearbeitet Bestellungen?** Eine Person als Shop-Verantwortliche (Teilzeit, 23/11): tägliche Mail-Zusammenfassung, Versand, Gutschein-Einlösung. Ohne Zuständigkeit keine Live-Schaltung.
- **Stripe-Risikoprüfung:** Konto kann bei langen Lieferzeiten oder hohen Einzelbeträgen Reserven bekommen. Gegenmittel: hohe Beträge per Überweisung, Geschäftsmodell offen angeben.
- **Abmahnfallen** bei unvollständigen Pflichtangaben: Checkliste vor Livegang (Impressum, AGB, Widerruf, Versandkosten, Lieferzeit, Zahlarten, Gesamtpreis, Button „Zahlungspflichtig bestellen“ in Stripe Checkout entsprechend konfiguriert).
- **Sicherheit:** Webhook-Signatur immer prüfen, Restricted Keys, interne Gutschein-Seite mit Passwort und Ratenbegrenzung, keine Kundendaten in Logs unter `/var/log`.

---

## 6. Priorisierte Reihenfolge

### 6.1 Sofort baubar, ohne Backoffice-Zugang

| Woche | Schritt | Feature | Wer |
|---|---|---|---|
| **KW 44 (diese Woche)** | Steuerberater/Anwalt: verkaufende Gesellschaft, Mehrzweckgutschein, Umgang mit Kundengeld; Stripe-Konto eröffnen; TWINT, EPS, Klarna, PayPal aktivieren | Grundlage | Inhaber |
| KW 44 | Payment Link Gutschein (EUR + CHF), PDF-Vorlage, Code-Tabelle, QR-Aufsteller | **F1a** | Team, kein Entwickler |
| KW 44–45 | Rechtsseiten bauen, Texte vom Anwalt | **F7** | Entwickler + Anwalt |
| KW 45 | E-Commerce-Events in `analytics.js` | **F8** | Entwickler |
| KW 45–46 | Gutschein-Seite mit automatischem PDF, Register in Stripe, interne Einlösung | **F1b** (Livegang spätestens 20.11., vor Adventsabend 26.11. und erstem Adventwochenende) | Entwickler |
| KW 45–47 | Inventur und Fotos der Ausstellungsstücke, Preisregel | F2 Vorbereitung | Team |
| KW 47–48 | Outlet-Seiten mit Stripe-Katalog und Reservierung | **F2** | Entwickler |
| KW 48 | Anzahlungen über Stripe-Rechnung (Dashboard) | **F4** | Team |
| KW 49–50 | Hybrid-Warenkorb + Checkout für das Weihnachtssortiment (Kerzen, Tom Dixon Scent, Textilien) | **F3** | Entwickler |
| KW 50–51 | Merchant-Feed für Outlet + Accessoires, Merchant Center mit GBP verknüpfen | **F6** | Entwickler + Team |
| Jan. 2027 | „ab“-Preise für 20–50 Leitmodelle (nur mit Freigabe und Preisbeleg) | F5 Übergang | Inhaber + Entwickler |

### 6.2 Blockiert (braucht Backoffice-Zugang oder Dritte)

| Blockade | Betrifft | Was es freischaltet |
|---|---|---|
| **Backoffice-Felder (4.9) + Frappe-Entwickler** | F5 vollständig, F9 | Preise, Verfügbarkeit, Lieferzeit und `Offer` auf 1.765 Seiten; Bestand; Aufträge und Rechnungen in Frappe |
| **Herstellerklärung zu Preisen** (Minotti, Poliform, Rimadesio) | F5 | Öffentliche „ab“-Preise im Katalog |
| **Bildrechte der Marken** | F3, F5, F6 für Katalogprodukte | Herstellerbilder in Shop und Shopping-Feed |
| **CH-MWST-Registrierung + Steuervertreter** (18) | F3 für CH | CHF-Preise verzollt (DDP) inkl. 8,1 % |
| **Garantiepartner** (Bank/Kreditversicherer) | F4 Werbeaussage | „Ihre Anzahlung ist abgesichert“ |
| **Versandverträge** (Post AT, DHL, Spedition) | F3 | Paket- und Sperrgut-Preise |

### 6.3 Was das bringt
- **Bis Weihnachten 2026:** Gutscheine online (5–20 T€), Outlet live (erste Stücke, Ziel 100–300 T€ in 3–6 Monaten), erste kostenlose Shopping-Einträge, saubere Messung [alle Schätzung aus 23].
- **Bis Ende Q1 2027:** Accessoire-Shop mit TWINT und CHF, Anzahlungslinks, „ab“-Preise für Leitmodelle.
- **Mit Backoffice:** Preise und Verfügbarkeit auf dem gesamten Katalog. Damit ist der in 25 beschriebene Vorsprung bei Modell- und Preissuchen gegen die Vertragshändler erreichbar.

---

## Quellen

- [S1] Stripe: TWINT-Zahlungen (Geschäftsstandorte inkl. AT, CHF, max. CHF 5.000, Onboarding-Auflagen, Checkout und Payment Links): https://docs.stripe.com/payments/twint (abgerufen 26.10.2026)
- [S2] Stripe Preise Österreich (Karten, Klarna, Stripe Tax, Invoicing): https://stripe.com/at/pricing (abgerufen 26.10.2026)
- [S3] Stripe lokale Zahlungsmethoden (EPS, TWINT, PayPal, Klarna, Billie, SEPA): https://stripe.com/at/pricing/local-payment-methods (abgerufen 26.10.2026)
- [S5] Höttges Startseite (kein Shop, Termin per Mail-Link): https://www.hoettges.at (abgerufen 26.10.2026)
- [S6] The Conran Shop (Outlet & Clearance bis −70 %, Trade, Abholservice): https://theconranshop.com/ (abgerufen 26.10.2026)
- [S7] Connox-Gutscheine (Zustellung per E-Mail, Einlösung im Warenkorb): https://www.connox.com/connox-voucher.html ; Händlerinfo: https://geizhals.at/merchants/connox-at
- Medusa (MIT, v2): https://github.com/medusajs/medusa · https://npmjs.com/package/@medusajs/medusa
- npm-Registry (Versionen, Lizenzen, Größen), abgefragt 26.10.2026 mit `npm view`
- Next.js 16.3.4 Doku im Repo: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` (Webhooks), `…/04-functions/revalidateTag.md`, `…/updateTag.md`, `…/after.md`, `…/unstable_cache.md`
- Interne Berichte: 11 (Shop-Sortiment, CH-Export, Code-Vorschlag), 18 (Schweiz Recht/Steuer), 23 (Masterkonzept), 25 (SEO-Schlachtplan)
