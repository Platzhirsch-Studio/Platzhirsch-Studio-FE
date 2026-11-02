# 10 – Performance Marketing: Bauplan für bezahlte Reichweite, Tracking und Lead-Maschine

**Stand:** 26.10.2026 · Rolle: Performance-Marketing (Luxus-Interior DACH) · Grundlage: Website-Code (Next.js 16.3.4), Marktresearch 00, 23 (Abschn. 1, 4, 9, 10, 12.3), 25, eigene Prüfung der Wettbewerber-Websites am 26.10.2026
**Kennzeichnung:** [belegt] = im Code oder per Abruf geprüft · [Schätzung] = eigene Herleitung · [prüfen] = vor Umsetzung verifizieren · Keine Rechtsberatung.

> **Vorbedingung aus dem Masterkonzept (23, Abschn. 1 und 9):** Bezahlte Werbung erst **nach Gate 0** (Fortbestehensprognose, Liquiditätsplan) und **nur mit funktionierendem Tracking**. Deshalb ist dieser Bauplan so gebaut, dass zuerst das Mess-Fundament entsteht (kostet fast nur Entwicklungszeit) und das Mediabudget erst danach in Stufen freigegeben wird.

---

## 1. Ist-Zustand im Code

### 1.1 Was schon da ist [belegt]

| Baustein | Datei | Stand |
|---|---|---|
| GA4-Property `G-1YCM6K57YG` | `src/components/Cookies/cookiecomponent.js` (Konstante `GA_ID`) | Wird per eigenem Loader (`loadGoogleAnalytics`) erst nach Einwilligung eingebunden. |
| Consent Mode v2 | `src/components/Cookies/cookiecomponent.js` (`ensureGtag`, `sendConsentUpdate`) | Default `denied` für `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`, `wait_for_update: 500`. Update wird bei jeder Einwilligung gesendet. |
| Consent-Kategorien | gleiche Datei, `cookieServices` | essential, functional (Maps, GTM), statistics (GA), marketing (**nur Google Ads**). Kein Meta, Pinterest, LinkedIn. |
| Conversion-Events | `src/lib/analytics.js` | `trackEvent`, `trackLead(form)` → `generate_lead` mit `form`, `listenForContactClicks` → `contact_click` (`phone`/`email`/`whatsapp`). |
| Aufrufe der Events | `src/components/AnfrageFormProduct/AnfrageFormProduct.js:174` (`produkt_anfrage`, `items`), `src/components/BeratungClient/BeratungClient.js:137` (`beratung`), `src/components/Kontakt/kontakt.js:138` (`kontakt`), `src/components/Newsletter/newsletter.js:48` (`sign_up`), `src/app/[locale]/client-layout.js:21` (Kontakt-Klicks) | Alle clientseitig, nach erfolgreicher API-Antwort. |
| Lead-Weiterleitung ans Backoffice | `src/app/api/kontakt/route.js`, `src/app/api/anfrage_produkt/route.js`, `src/app/api/beratung_anfrage/route.js`, `src/app/api/newsletter_subscribe/route.js` | Route Handler leiten den Body **unverändert** per `fetch` an Frappe-Methoden weiter (`.../kontakt_form.api.create_contact`, `.../anfrage_produkt.api.create_anfrage`, `.../anfrage.api.create_anfrage`). |
| Merkliste statt Warenkorb | `src/context/CartContext.js` (`addToCart`, `addManyToCart`), `src/components/CartPage/CartPage.js`, `src/app/[locale]/merkliste/page.js` | Kein Event beim Merken. |
| Produktseiten + JSON-LD | `src/app/[locale]/produkte/[category]/[product]/page.js` (Z. 265: „Product (no offers/price — prices aren't published)“) | `Product` ohne `Offer`. |
| Landingpages für Regionen | `src/app/[locale]/designermoebel-{bregenz,dornbirn,lindau,friedrichshafen,st-gallen}`, `moebel-bodensee`, `kuechen-vorarlberg`, `interior-design-vorarlberg`, `wohnzimmer-einrichten-vorarlberg` | Gute Zielseiten für Search-Kampagnen. |
| Proxy (früher Middleware) | `src/proxy.js` | next-intl, Übersetzte Pfade. Läuft in Next 16 standardmäßig im Node-Runtime. |
| Hosting | `ecosystem.config.js` | Eigener Server, PM2, `next start` (damit sind `after()` und Route Handler voll nutzbar, siehe `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md`). |

### 1.2 Was fehlt (Lücken für Performance Marketing) [belegt]

1. **Kein Google-Ads-Tag (`AW-…`)**, kein Conversion-Label, kein Enhanced-Conversions-Signal. Google Ads könnte heute nur GA4-Key-Events importieren.
2. **Ads-Einwilligung ohne Wirkung, wenn Statistik abgelehnt wird:** `gtag.js` wird nur geladen, wenn `googleAnalytics` erlaubt ist. Wer nur „Marketing“ erlaubt, wird gar nicht gemessen.
3. **Keine Klick-IDs** (`gclid`, `gbraid`, `wbraid`, `fbclid`, `epik`, `li_fat_id`) und keine UTM-Parameter werden erfasst oder mit dem Lead ans Backoffice gegeben. Damit ist **kein Offline-Conversion-Import** möglich.
4. **Keine Lead-ID** auf der Client-Seite: `generate_lead` hat weder `transaction_id` noch Wert. Doppelte Zählung bei Doppelklick möglich, kein Abgleich mit Backoffice.
5. **Kein Meta-Pixel, kein Pinterest-Tag, kein LinkedIn Insight Tag**, keine serverseitigen APIs (Meta CAPI, Pinterest CAPI, LinkedIn CAPI).
6. **Kein Produkt-Feed** (Merchant Center, Meta-Katalog, Pinterest-Katalog). Feeds brauchen Preise; das Backoffice hat **kein Preisfeld**.
7. **Kein Event für Mikro-Conversions:** Merkliste, Katalog-/PDF-Download, Terminbuchung, Scrolltiefe auf Landingpages, Konfigurations-/Rechner-Nutzung.
8. **Keine Kampagnen-Landingpages** ohne Navigation-Ablenkung (z. B. „Minotti-Ausstellung Lochau – Termin“) und keine Länder-Zielseiten für CH/FL (in 25 als H4/H6 geplant).

### 1.3 Konsequenz
Das technische Fundament (Consent Mode v2, saubere Event-Funktionen, Route Handler als Server-Schicht) ist **besser als bei allen regionalen Wettbewerbern**. Es fehlt die „Rückkopplung“: welche Anzeige → welcher Lead → welcher Auftrag mit welchem Wert. Ohne diese Schleife optimieren Google und Meta auf Formular-Absender statt auf Käufer, und bei 15 T€ Ø-Auftrag (23, KPI-Tafel) ist das der teuerste Fehler, den man machen kann.

---

## 2. Benchmark

### 2.1 Regionale Wettbewerber (Abruf der Startseiten am 26.10.2026, statisches HTML) [belegt, begrenzt]

| Wettbewerber | Sichtbare Tags im HTML | Preise | Termin online | Bewertung |
|---|---|---|---|---|
| **Höttges** (hoettges.at) | kein GA-, Ads-, Meta- oder Pinterest-Tag im ausgelieferten HTML erkennbar | nein | Terminhinweise im Text, kein Kalender (20) | Kein erkennbares Performance-Marketing |
| **reiter design** (reiter-design.at) | Seite lieferte bei Abruf keinen Inhalt (Timeout/Bot-Schutz) [prüfen] | nein | – | Stark auf Instagram (IG 6.005), Ads unbekannt |
| **Hutle** (hutle.at) | kein Abruf möglich [prüfen] | nein | – | – |
| **Dolce Vita** (dolcevita.at) | GA4 (`G-2ZXM174P56`), TikTok-Hinweis | nein | – | „online fast unsichtbar“ (23) |
| **Fretz** (fretz.de) | GTM (`GTM-T97C6SC`) | nein | ja (20) | Wirbt um CH-Kunden (16) |
| **Gamma** (gamma.ch) | GTM, GA4, **Meta-Pixel** | nein | ja | Einziger regionaler Wettbewerber mit klarem Meta-Retargeting-Setup |

Die Tags können auch erst nach Consent nachgeladen werden. Das prüft man zuverlässig im **Google Ads Transparency Center** (adstransparency.google.com) und in der **Meta Ad Library** (facebook.com/ads/library) – **Aufgabe Woche 1, 30 Minuten**, Ergebnis in diese Tabelle nachtragen.

**Befund:** Kein Vertragshändler im Dreiländereck betreibt sichtbar ein durchgängiges Lead-Tracking mit Offline-Import, kein Händler hat einen Produkt-Feed, keiner zeigt Preise. Die bezahlten Flächen (Search „Minotti Sofa“, „Poliform Küche“, Shopping, Pinterest) sind im Raum Bodensee **weitgehend frei** [Schätzung, im Keyword-Planer und Auktionsdaten-Bericht nach 2 Wochen verifizieren].

### 2.2 Was die Besten weltweit machen

| Vorbild | Was sie tun | Übertragbar auf Platzhirsch |
|---|---|---|
| **Minotti** (minotti.com) | GTM + Meta-Pixel, Store-Locator als Conversion, starke Bewegtbild-Kampagnen pro Kollektion | Marken-Content ist auf Meta/YouTube Pflicht – aber **eigene** Showroom-Aufnahmen statt Markenmaterial (Bildrechte). |
| **RH** (rh.com) | Galerie-Besuch als Haupt-Conversion, Mitgliedschaft, Katalog-Bücher, sehr stark auf Retargeting und „Design Atelier“-Leads | „Showroom-Termin + Café“ als Hauptziel, Planung als Service-Angebot. |
| **Conran Shop / AmbienteDirect / Connox** | Merchant-Feeds mit Tausenden Produkten, Performance Max, dynamisches Retargeting, Usercentrics + GTM (AmbienteDirect `GTM-MKKFLH`, Connox `GTM-NJBGZGT9` + Microsoft Clarity) [belegt] | Feed-Logik ja, aber **kein** Preiskampf um Leuchten-UVP (23: „keine bekannten Leuchten zur UVP gegen Connox“). Feed nur für Atelier/Outlet, Accessoires, Gutscheine. |
| **Poliform / Molteni** | Lead-Formulare für Küchen-Planung, Showroom-Events, Architekten-Programme auf LinkedIn | Küchen-Planungs-Lead als eigenes Conversion-Ziel mit höherem Wert. |
| **Luxus-Immobilien-Makler (z. B. Engel & Völkers)** | Meta Lead Ads mit qualifizierenden Fragen, CRM-Rückmeldung an Meta (Conversion Leads Optimization) | Genau das Modell für Platzhirsch: wenige, teure Leads, Qualität per CRM-Signal trainieren. |

---

## 3. Konzept / Zielbild

**Leitsatz:** *Wir kaufen keine Klicks, wir kaufen Showroom-Termine von Menschen, die in den nächsten 12 Monaten 15–100 T€ ausgeben – und wir sagen den Algorithmen jede Woche, wer davon wirklich gekauft hat.*

### 3.1 Funnel und Kanalrollen

```
             BEKANNTHEIT                 ÜBERLEGUNG                        ENTSCHEIDUNG
Kanal  ┌────────────────────┐   ┌──────────────────────────┐   ┌───────────────────────────────┐
       │ YouTube / Demand   │   │ Pinterest (Ideen, Boards)│   │ Google Search Marke + Region  │
       │ Gen, Meta Reels,   │──▶│ Meta Karussell/Katalog   │──▶│ Performance Max (Lead + Feed) │
       │ Pinterest Video    │   │ Ratgeber-Seiten (25/H5)  │   │ Meta Lead Ads, Retargeting    │
       └────────────────────┘   └──────────────────────────┘   └───────────────────────────────┘
Ziel      Video-Views, Reach       Merken, Ratgeber, Newsletter        Termin, Anfrage, Anruf
                                                                              │
                                                       Backoffice: qualifiziert → Angebot → Auftrag
                                                                              │
                              Rückmeldung (Offline-Conversions mit Wert) ◀────┘  an Google, Meta, Pinterest, LinkedIn
```

### 3.2 Conversion-Architektur (Werte für Gebotsstrategien) [Schätzung, nach 90 Tagen mit echten Zahlen ersetzen]

| Event (GA4 / Ads) | Quelle | Primär für Gebote? | Startwert |
|---|---|---|---|
| `generate_lead` `form=beratung` (Termin/Beratung) | `BeratungClient.js` | ja | 300 € |
| `generate_lead` `form=produkt_anfrage` | `AnfrageFormProduct.js` | ja | 200 € |
| `generate_lead` `form=kontakt` | `kontakt.js` | ja | 120 € |
| `contact_click` `method=phone/whatsapp` | `client-layout.js` | nein (sekundär), ab Anruf-Tracking > 60 s primär | 40 € |
| `sign_up` (Newsletter) | `newsletter.js` | nein | 10 € |
| `add_to_wishlist` (neu) | `CartContext.js` | nein (Retargeting-Zielgruppe) | 0 € |
| **`qualified_lead`** (offline, neu) | Backoffice-Status „qualifiziert“ | **ja, Hauptziel ab Monat 3** | 600 € |
| **`proposal_sent`** (offline, neu) | Backoffice „Angebot“ | ja | 1.500 € |
| **`purchase`** (offline, neu) | Backoffice „Auftrag“, echter Netto-Auftragswert | ja (Value-Based Bidding) | echter Wert |

Herleitung Ø-Auftrag 15 T€, Rohertrag ≥ 33 % → ≈ 5 T€ Deckungsbeitrag je Auftrag; Abschlussquote qualifizierter Leads 15–25 % → ein qualifizierter Lead ist ca. 750–1.250 € DB wert. Die Startwerte liegen bewusst darunter.

### 3.3 Ziel-KPIs

| KPI | Stufe 1 (3 T€/Monat) | Stufe 2 (8 T€/Monat) | Stufe 3 (15 T€/Monat) |
|---|---|---|---|
| Leads gesamt (alle Formulare + Anrufe) | 25–40 | 60–100 | 110–170 |
| Qualifizierte Leads | 10–15 | 22–35 | 40–60 |
| **Ziel-CPL (alle Leads)** | ≤ 90 € | ≤ 100 € | ≤ 110 € |
| **Ziel-Kosten pro qualifiziertem Lead** | ≤ 250 € | ≤ 280 € | ≤ 300 € |
| Showroom-Termine aus Paid | 8–12 | 18–28 | 32–48 |
| Aufträge (Verzögerung 2–6 Monate) | 2–3 | 4–7 | 8–12 |
| **Ziel-ROAS (Auftragsumsatz / Mediakosten, 6-Monats-Fenster)** | ≥ 10 | ≥ 9 | ≥ 8 |
| Break-even-ROAS (bei 33 % Rohertrag, ohne Fixkosten) | 3,0 | 3,0 | 3,0 |

Alle Werte [Schätzung] auf Basis 23/KPI-Tafel (Ziel 40 qualifizierte Anfragen/Monat bei M12). Stufe 2 trägt ungefähr die Hälfte dieses Ziels. **Stufenwechsel nur, wenn die vorige Stufe zwei Monate in Folge die Kosten pro qualifiziertem Lead einhält.**

---

## 4. Konkrete Features

Legende Aufwand: **S** ≤ 2 Entwicklertage · **M** 3–8 Tage · **L** > 8 Tage (inkl. Test).

### F1 – Consent-Erweiterung für Werbe-Plattformen (Fundament)
- **Nutzen:** Ohne Einwilligung für Meta/Pinterest/LinkedIn darf kein Pixel laufen. Gleichzeitig wird der Fehler behoben, dass Ads-Einwilligung ohne Statistik-Einwilligung nichts bewirkt. Ohne das: kein Retargeting, keine Algorithmus-Optimierung, Abmahnrisiko.
- **Umfang:**
  1. `cookieServices.marketing` um `metaPixel`, `pinterestTag`, `linkedinInsight`, optional `microsoftAds` ergänzen (Anbieter, Cookies, Drittland-Angaben; Texte in `src/messages/{de,en,fr,it}.json`, Namespace `Cookies`).
  2. `loadGoogleAnalytics` aufteilen in `loadGoogleTag(consent)`: `gtag.js` laden, sobald **Statistik oder Ads** erlaubt ist; `config` für `G-1YCM6K57YG` nur mit Statistik, `config` für `AW-XXXXXXXX` (neu) nur mit Ads. Consent Mode sorgt für den Rest (cookieless Pings bei `denied` sind in Advanced Mode zulässig – **Entscheidung: Basic oder Advanced Mode mit Datenschutzberater festlegen** [prüfen]; Basic ist die sichere Wahl, Advanced liefert modellierte Conversions).
  3. Neue Funktion `loadMarketingPixels(consent)` mit je einer Loader-Funktion pro Plattform (dynamisches `<script>` wie bei GA, keine npm-Bibliothek).
  4. Datenschutzerklärung `src/app/[locale]/datenschutz/page.js` um die neuen Dienste erweitern.
- **Aufwand:** M
- **Abhängigkeiten:** Konten anlegen (Google Ads, Meta Business Manager, Pinterest Business, LinkedIn Campaign Manager), AVV/Joint-Controller-Vereinbarungen (Meta: Joint Controller Addendum), Datenschutztext durch Berater freigeben.
- **Dateien:** `src/components/Cookies/cookiecomponent.js`, `src/components/Cookies/cookieItem.js`, `src/messages/*.json`, `src/app/[locale]/datenschutz/page.js`.
- **Bibliotheken:** keine neue. Externe Skripte (nur nach Consent, nicht im eigenen Bundle): `gtag.js` (ca. 130–160 kB gz mit Ads-Config), Meta `fbevents.js` (ca. 90–110 kB gz), Pinterest `core.js` (ca. 30 kB), LinkedIn `insight.min.js` (ca. 15 kB) [Größen Schätzung, mit WebPageTest messen]. **Nicht** empfohlen: `react-facebook-pixel` (veraltet, kein Consent-Handling), `@next/third-parties` 16.x (MIT, 15 kB, experimentell, lädt GTM ohne Consent-Gate – passt nicht zum vorhandenen Loader).

### F2 – Attribution: Klick-IDs, UTM und Lead-ID an jeden Lead hängen
- **Nutzen:** Grundlage für Offline-Import, Enhanced Conversions und echte Kanal-Bewertung (Lead-Herkunft ist Pflichtfeld laut 23/8.6). Größter Hebel für ROAS, weil Gebote auf Käufer statt Formulare optimiert werden.
- **Umfang:**
  1. Neue Datei `src/lib/attribution.js`: liest beim ersten Seitenaufruf `gclid`, `gbraid`, `wbraid`, `fbclid`, `epik`, `li_fat_id`, `msclkid`, `utm_*`, `referrer`, Landingpage. **Speichern nur bei Marketing-Einwilligung** (ePrivacy/§ 165 TKG AT, § 25 TDDDG DE) als First-Party-Cookie `ph_attr` (90 Tage). Ohne Einwilligung nur `utm_source/medium/campaign` der aktuellen Sitzung im Speicher (kein persistenter Speicher) [rechtlich prüfen].
  2. Einbindung früh im Client: `src/instrumentation-client.js` (Next 16, läuft vor der Interaktivität, siehe `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md`) oder im bestehenden `useEffect` in `client-layout.js`.
  3. Jedes Formular schickt zusätzlich `attribution` und eine im Client erzeugte `lead_ref` (`crypto.randomUUID()`) mit. `trackLead(form, { transaction_id: lead_ref, value, currency: "EUR" })` – damit dedupliziert GA4/Ads und der Lead ist im Backoffice wiederfindbar.
  4. Route Handler (`src/app/api/*/route.js`) reichen die Felder an Frappe weiter (heute wird der Body ohnehin unverändert weitergeleitet – ob Frappe unbekannte Felder speichert, ist [prüfen]).
- **Aufwand:** M
- **Abhängigkeiten:** **Backoffice-Felder** `lead_ref`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `utm_source`, `utm_medium`, `utm_campaign`, `landing_page`, `consent_ads` (bool), `country` in den Doctypes `kontakt_form`, `anfrage_produkt`, `anfrage` → **blockiert ohne Backoffice-Zugang**. Übergangslösung siehe F4 (Lead-Ledger).
- **Dateien:** neu `src/lib/attribution.js`, neu `src/instrumentation-client.js` (optional), geändert `src/lib/analytics.js`, die drei Formular-Komponenten, die vier Route Handler.
- **Bibliotheken:** keine (Web Crypto, `URLSearchParams`). Optional `zod` 4.6.x (MIT, server-only, 0 kB Client) zur Validierung der Route-Handler-Bodies – passt auch zur Härtung der bisher handgeschriebenen Validierung.

### F3 – Enhanced Conversions (Web) + serverseitige Conversions (Meta CAPI, Pinterest CAPI, LinkedIn CAPI)
- **Nutzen:** Safari/iOS, Adblocker und Consent-Lücken kosten 20–40 % der Conversions [Schätzung]. Gehashte E-Mail/Telefon (nur mit `ad_user_data: granted`) holt einen Teil zurück; Meta empfiehlt Pixel + CAPI mit Deduplizierung über `event_id`. Bessere Datenbasis = niedrigere CPL in Advantage+ und PMax.
- **Umfang:**
  1. **Google Enhanced Conversions (Web):** im Client vor `generate_lead` `gtag('set', 'user_data', { sha256_email_address, sha256_phone_number, address: { country } })` – nur wenn Ads-Consent; Hashing im Browser (`crypto.subtle.digest`).
  2. **Server-Events:** neue Datei `src/lib/conversions/server.js` mit `sendMetaEvent`, `sendPinterestEvent`, `sendLinkedInEvent` (plain `fetch` gegen die REST-APIs: Meta Graph API `/{pixel_id}/events`, Pinterest `v5/ad_accounts/{id}/events`, LinkedIn `rest/conversionEvents`). Aufruf **in den Route Handlern nach erfolgreicher Backoffice-Antwort** über `after()` aus `next/server` (blockiert die Antwort nicht, unter `next start` voll unterstützt – `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md`). Gleiche `event_id` = `lead_ref` wie im Pixel → Deduplizierung.
  3. Consent-Status wird vom Client mitgeschickt; ohne Marketing-Consent **kein** Server-Event.
  4. Normalisierung: E-Mail trim/lowercase, Telefon E.164, SHA-256 mit `node:crypto`.
- **Aufwand:** M
- **Abhängigkeiten:** Pixel-IDs und API-Tokens als Umgebungsvariablen auf dem Server (`META_PIXEL_ID`, `META_CAPI_TOKEN`, `PINTEREST_AD_ACCOUNT_ID`, `PINTEREST_CAPI_TOKEN`, `LINKEDIN_*`), F1, F2. **Nicht** vom Backoffice abhängig.
- **Dateien:** neu `src/lib/conversions/server.js`, neu `src/lib/conversions/hash.js`, geändert `src/app/api/{kontakt,anfrage_produkt,beratung_anfrage,newsletter_subscribe}/route.js`, `src/lib/analytics.js`.
- **Bibliotheken:** `libphonenumber-js` 1.13.x (MIT, Server, Metadaten „min“ ca. 80 kB, nicht im Client-Bundle) für E.164. **Nicht** empfohlen: `facebook-nodejs-business-sdk` 24.0.1 (Facebook Platform License, 31 MB entpackt, für 1 Endpoint überdimensioniert).

### F4 – Offline-Conversion-Import mit Wert (Lead → qualifiziert → Angebot → Auftrag)
- **Nutzen:** Der wichtigste Hebel überhaupt. Google (Enhanced Conversions for Leads), Meta (Conversion Leads Optimization), Pinterest und LinkedIn lernen, **welche** Leads kaufen. Erst damit sind Value-Based Bidding (tROAS) und Stufe 3 wirtschaftlich.
- **Umfang, Variante A (Ziel, braucht Backoffice):**
  - Frappe-Felder aus F2 plus `lead_status` (neu/qualifiziert/Angebot/Auftrag/verloren), `auftragswert_netto`, `status_changed_at`.
  - Neuer Route Handler `src/app/api/conversions/sync/route.js` (per Cron vom Server, z. B. PM2-Cron oder System-Cron, mit Secret im Header): holt per Frappe-API alle Statuswechsel der letzten 24 h, schickt sie an
    - **Google Data Manager API** (seit 15.06.2026 der Pflichtweg für Offline-Import und Enhanced Conversions for Leads; Upload über die Google-Ads-API ist für neue Nutzer blockiert – Google Ads Help 2998031, 15713840),
    - Meta CAPI (`event_name: "Lead"` mit `lead_event_source` bzw. eigene Events `QualifiedLead`, `Purchase` mit `value`),
    - Pinterest/LinkedIn CAPI.
- **Umfang, Variante B (SOFORT, ohne Backoffice): „Lead-Ledger“ in Google Sheets**
  - Die Route Handler schreiben zusätzlich (über `after()`) je Lead **eine Zeile** in ein Google Sheet: `lead_ref`, Zeitstempel, Formular, Land, `gclid/gbraid/wbraid/fbclid`, UTM, Consent-Flag, **gehashte** E-Mail/Telefon (kein Klartext), Spalten `Status` und `Auftragswert` leer.
  - Das Vertriebsteam setzt beim wöchentlichen Pipeline-Termin (23/8.6) den Status per Dropdown. **Pflege: ca. 10 Minuten pro Woche.** Klarname steht weiterhin nur im Backoffice; Zuordnung über `lead_ref` (die im Backoffice in der Nachricht/Notiz mitläuft, z. B. als Zusatz „Ref: …“ im Nachrichtentext – geht ohne neues Feld).
  - Google Ads: **geplanter Import aus Google Sheets** (Standardfunktion in Google Ads, keine Programmierung) oder Upload über Data Manager.
  - Meta/Pinterest: ein kleiner Sync-Job liest das Sheet und sendet Statuswechsel per CAPI.
- **Aufwand:** Variante B: M · Variante A: L (zusätzlich Frappe-Customizing durch Backoffice-Betreuer).
- **Abhängigkeiten:** A: Backoffice-Schreibzugang/Customizing → **blockiert**. B: Google-Workspace-Konto mit AVV, Service-Account, Datenschutz: Verarbeitung der gehashten Daten im Verzeichnis der Verarbeitungstätigkeiten aufnehmen; nur Leads mit `consent_ads = true` hochladen.
- **Dateien:** neu `src/lib/conversions/ledger.js`, neu `src/app/api/conversions/sync/route.js`, geändert die Lead-Route-Handler.
- **Bibliotheken:** `@googleapis/sheets` 18.1.x (Apache-2.0, ca. 0,8 MB entpackt, server-only), `google-auth-library` 11.3.x (Apache-2.0, server-only), `@google-ads/datamanager` 1.4.0 (Apache-2.0, ca. 3,6 MB entpackt, server-only; Version vom 23.10.2026 ist sehr frisch – beim Einbau die letzte ≥ 2 Wochen alte Version pinnen). Client-Bundle: 0 kB.

### F5 – Vollständige Event-Abdeckung (Mikro-Conversions und Zielgruppen-Signale)
- **Nutzen:** Retargeting-Zielgruppen („hat 3 Minotti-Produkte angesehen“, „hat gemerkt, aber nicht angefragt“) und Signale für PMax/Advantage+. Mehr Daten für GA4-Zielgruppen, die in Google Ads importiert werden.
- **Umfang:** neue Events in `src/lib/analytics.js` (GA4-Empfehlungsnamen):
  - `view_item` auf Produktseiten (`item_id`, `item_brand`, `item_category`) – ohne Preis.
  - `add_to_wishlist` in `CartContext.addToCart/addManyToCart`.
  - `begin_checkout`-Äquivalent: `view_wishlist_form` beim Öffnen des Anfrageformulars auf `/merkliste`.
  - `file_download` (Kataloge, Datenblätter), `select_content` für Marken-Hubs, `book_appointment` (sobald Online-Kalender da ist, 23/9 Website Punkt 4).
  - `scroll_75` auf Regions-Landingpages, `video_progress` auf Kampagnenseiten.
  - Für Meta/Pinterest: `ViewContent`, `AddToWishlist`, `Lead`, `Schedule` (Pinterest: `page_visit`, `add_to_cart`→Merkliste, `lead`, `signup`).
- **Aufwand:** S–M
- **Abhängigkeiten:** F1. Keine Backoffice-Abhängigkeit.
- **Dateien:** `src/lib/analytics.js`, `src/context/CartContext.js`, `src/app/[locale]/produkte/[category]/[product]/page.js` (kleiner Client-Wrapper, z. B. neu `src/components/Tracking/ViewItem.js`), `src/components/CartPage/CartPage.js`.
- **Bibliotheken:** keine.

### F6 – Kampagnen-Landingpages (Paid-Zielseiten) mit Lead-Formular
- **Nutzen:** Search- und Social-Traffic auf fokussierte Seiten mit einem Ziel (Termin) bringt erfahrungsgemäß 1,5–3× höhere Conversion-Rate als Produkt- oder Startseite [Schätzung]. Gleichzeitig besserer Qualitätsfaktor in Google Ads (niedrigerer CPC).
- **Umfang:** 6 Seiten in Stufe 1, je DE (CH-Varianten mit Schweizer Begriffen):
  1. `/de/lp/minotti-ausstellung` – „Größte Minotti-Ausstellung Westösterreichs, 5 Min. von Lindau“ (Formulierung ohne Händler-Behauptung, 23/4.2).
  2. `/de/lp/poliform-kueche` – Küchenplanung.
  3. `/de/lp/outdoor-hotel` – Tuuci/Umbrosa/Paola Lenti für Hotels, Frühbucher 2027 (00/5 Punkt 7).
  4. `/de/lp/einkaufen-schweiz-liechtenstein` – erst live, wenn Ablauf mit Steuerberater/Zollspediteur steht (00/5 Punkt 8).
  5. `/de/lp/atelierverkauf` – Ausstellungsstücke mit Preisen (Preise hier manuell gepflegt, unabhängig vom Backoffice).
  6. `/de/lp/architekten` – Architektenprogramm (LinkedIn-Ziel).
  - `robots: noindex` (Duplicate zu SEO-Seiten vermeiden), schlanker Header, Formular über Falz, Bewertungen/Referenzen, Café-Bild, Anfahrt, Samstag-Öffnung.
  - Pfadsegment `lp` muss im `TRANSLATED_PATH`/`proxy.js`-Kontext geprüft werden (nicht übersetzt, nur DE/EN anfangs).
- **Aufwand:** M (Vorlage + 6 Instanzen aus einer Konfigurationsdatei)
- **Abhängigkeiten:** **eigene Fotos/Videos** aus dem Showroom (Bildrechte, siehe 5.2), Texte ohne Händler-Behauptung, Atelier-Inventur mit Preisen (Team).
- **Dateien:** neu `src/app/[locale]/lp/[slug]/page.js`, neu `src/lib/content/landingpages.js`, Wiederverwendung `BeratungClient`/`kontakt`-Formular, `src/proxy.js` (ggf. Matcher).
- **Bibliotheken:** keine (Tailwind 4, `next/image` vorhanden).

### F7 – Produkt-Feeds (Merchant Center, Meta-Katalog, Pinterest-Katalog)
- **Nutzen:** Performance Max mit Feed, Shopping-Anzeigen, kostenlose Produkt-Einträge, dynamisches Retargeting auf Meta/Pinterest. Kein Wettbewerber in der Region hat das (25/H2).
- **Umfang:**
  - **Stufe a (SOFORT):** Feed nur für Produkte mit manuell gepflegtem Preis: Atelierverkauf/Ausstellungsstücke, Gutscheine, Accessoires – gepflegt als JSON in `src/lib/data/` oder (pflegeärmer) als Google Sheet, das der Feed-Route liest.
  - **Stufe b (BLOCKIERT):** alle 1.765 Produkte mit „ab“-Preis, sobald das Backoffice ein Preisfeld hat und die Hersteller Preisangaben erlauben.
  - Route Handler `src/app/feeds/[channel]/route.js` (`google.xml`, `meta.csv`, `pinterest.csv`) mit `revalidate` 1×/Tag; Felder `id`, `title`, `description`, `link`, `image_link`, `price`, `availability`, `brand`, `condition` (`used` bzw. `refurbished` korrekt für Ausstellungsstücke prüfen), `google_product_category`, `custom_label_0..4` (Marke, Raum, Marge-Klasse).
  - Ergänzend `Offer` im JSON-LD der Produktseite, sobald Preise existieren (`src/app/[locale]/produkte/[category]/[product]/page.js`, `src/lib/seo/`).
- **Aufwand:** Stufe a: S–M · Stufe b: M (Code) + L (Datenpflege)
- **Abhängigkeiten:** Preisfeld im Backoffice (Stufe b), Herstellerfreigabe für Preise und **Bildrechte** (Feed-Bilder werden in Anzeigen gezeigt), Merchant-Center-Konto, Versand-/Rückgabe-Angaben, Impressum/AGB im Merchant Center.
- **Dateien:** neu `src/app/feeds/[channel]/route.js`, neu `src/lib/feeds/*.js`, ggf. `src/lib/shop/`.
- **Bibliotheken:** keine nötig (Template-Strings mit XML-Escaping). Optional `xmlbuilder2` (MIT) – nicht erforderlich.

### F8 – Serverseitiges Tagging (sGTM) – optional, Stufe 2+
- **Nutzen:** First-Party-Endpunkt `metrics.platzhirsch.studio`, längere Cookie-Laufzeit in Safari, zentrale Steuerung aller Plattformen, weniger Drittanbieter-JavaScript im Browser (bessere Core Web Vitals).
- **Empfehlung:** **Nicht in Stufe 1.** F3 (direkte CAPI aus den Route Handlern) deckt 80 % des Nutzens ohne zusätzliche Infrastruktur. sGTM erst ab Stufe 2, wenn mehr als zwei Plattformen aktiv sind.
- **Varianten:** (a) Google-Image `gcr.io/cloud-tagging-10302018/gtm-cloud-image` als Docker-Container auf dem eigenen Server (kostenlos, Wartung bei uns), (b) Stape.io mit EU-Hosting (ca. 20–100 €/Monat [prüfen], wenig Pflege – **für 5-Personen-Team empfohlen**), (c) Google Cloud Run (Produktion: mehrere Instanzen, ca. 100–150 €/Monat [Schätzung]).
- **Aufwand:** M
- **Abhängigkeiten:** DNS-Subdomain, F1, Datenschutz (IP-Kürzung im Server-Container, keine Weitergabe ohne Consent).
- **Dateien:** `src/components/Cookies/cookiecomponent.js` (`transport_url`/`server_container_url`), Datenschutzerklärung.

### F9 – Reporting ohne Pflegeaufwand
- **Nutzen:** Ein Blick pro Woche: Kosten, Leads, qualifizierte Leads, Aufträge, ROAS je Kanal und Land.
- **Umfang:** Looker Studio (kostenlos) mit Quellen GA4, Google Ads, Lead-Ledger-Sheet (F4B); Meta/Pinterest per kostenlosem Sheets-Export oder Connector. GA4: `generate_lead`, `qualified_lead`, `purchase` als Key Events; benutzerdefinierte Dimensionen `form`, `country`, `lead_ref`.
- **Aufwand:** S
- **Abhängigkeiten:** F2/F4. Keine Code-Änderung außer Dimensionen.

### F10 – Kreativ-Produktion mit lokaler NVIDIA-Hardware
- **Nutzen:** Die Plattformen verlangen 10–30 frische Motive pro Monat (Reels, Pins, Karussells). Ein 5-Personen-Team schafft das nur mit Werkzeugen.
- **Werkzeuge (alles lokal, keine Daten an Dritte):**
  - DaVinci Resolve (kostenlose Version) mit NVENC-Export für Reels/Shorts in 9:16, 4:5, 1:1, 16:9.
  - `whisper` / `faster-whisper` (MIT) für Untertitel DE/EN/IT – 85 % der Reels laufen stumm.
  - `rembg` (MIT) oder BiRefNet (MIT) für Freisteller **eigener** Fotos (Pinterest-Pins, Katalog-Anzeigen).
  - Real-ESRGAN (BSD-3) für Hochskalierung eigener Handyfotos aus Kundenprojekten.
  - **Keine KI-generierten Produktbilder** von Markenprodukten (Irreführung, Markenrecht, Vertrauen im Luxussegment).
- **Aufwand:** S (Einrichtung), danach laufend 1–2 Tage/Monat.

---

## 4a. Kanalplan im Detail

### 4a.1 Geo-Targeting (alle Kanäle)

| Zone | Gebiet | Sprache | Rolle | Anteil Budget Stufe 1/2/3 |
|---|---|---|---|---|
| **A – Kern AT** | Vorarlberg komplett, Arlberg (Lech, Zürs, St. Anton), Außerfern | DE | Search, Local, Retargeting | 40 % / 30 % / 25 % |
| **B – Nordufer DE** | Landkreis Lindau, Bodenseekreis (Friedrichshafen, Langenargen), Ravensburg, Westallgäu, Kempten/Oberallgäu, Konstanz (nur Search) | DE | Größte Lücke (kein Minotti/Poliform/Rimadesio zwischen Lindau und Ravensburg, 23/4.2) | 35 % / 35 % / 30 % |
| **C – CH/FL** | Liechtenstein, Kantone St. Gallen, Appenzell AR/AI, Thurgau, Graubünden-Nord (Chur, Klosters, Davos), optional Zürich-Goldküste in Stufe 3 | DE (CH-Wortschatz: „Offerte“, „Schreiner“, „Stockwerkeigentum“) | **erst aktiv, wenn der CH/FL-Ablauf steht** (Verzollung, MWST, CHF-Preis). Bis dahin nur Retargeting | 15 % / 25 % / 30 % |
| **D – Ferienimmobilien** | Wohnsitz München, Stuttgart, Zürich + Interesse „Ferienimmobilie Arlberg/Bregenzerwald“ | DE/EN | Second-Home-Service (23/10 Idee 5), nur Meta/YouTube/Pinterest | 10 % / 10 % / 15 % |

Einstellung in Google Ads: „Präsenz: Personen in oder regelmäßig in den Zielgebieten“ (nicht „Interesse“), Ausnahme Zone D. Radius-Targeting um Lochau (60 km) für Local-Ziele.

### 4a.2 Google Ads

| Kampagne | Ziel | Struktur | Gebot | Stufe |
|---|---|---|---|---|
| **S1 Eigene Marke** | Markenschutz, günstigste Leads | „platzhirsch lochau“, „platzhirsch home living“, „platzhirsch studio“ | Max. Conversions, Tagesbudget klein | ab 1 |
| **S2 Marke × Produkt (Hersteller-Keywords)** | Kaufbereite Modellsuchen | Anzeigengruppen je Marke/Modellreihe: „minotti sofa“, „minotti lawrence“, „poliform küche“, „rimadesio schrank“, „paola lenti outdoor“, „tuuci sonnenschirm“; Zielseite = Produkt-/Marken-Hub bzw. LP | Max. Conversions → tCPA ab 30 Conv./Monat | ab 1 |
| **S3 Region × Kategorie** | Lokale Generika | „designermöbel bregenz“, „möbelhaus lindau premium“, „küchenstudio vorarlberg“, „outdoor möbel bodensee“, „einrichtungshaus st. gallen“ (Zone C erst später); Zielseiten = vorhandene Regionsseiten | Max. Conversions | ab 1 |
| **S4 Ratgeber/Preisfragen** | Frühe Phase, günstige Klicks | „was kostet ein minotti sofa“, „poliform küche preis“, „möbel aus österreich in die schweiz“ → Ratgeber aus 25/H5 | Max. Klicks mit CPC-Limit, Ziel Newsletter/Merkliste | ab 2 |
| **PMax Leads (ohne Feed)** | Alle Google-Flächen, Ziel qualifizierter Lead | Asset-Gruppen je Thema (Wohnen italienisch, Küche, Outdoor/Hotel), Zielgruppensignale: Kundenliste (Customer Match, nur mit Einwilligung), Webseitenbesucher, Suchbegriffe aus S2/S3; Brand-Ausschluss (eigene Marke) | tCPA, später tROAS mit Offline-Werten | ab 2, erst wenn F4 läuft |
| **PMax Feed (Atelier/Accessoires)** | Abverkauf Ausstellungsstücke | Feed aus F7 Stufe a | tROAS | ab 1 (klein), wenn Atelier-Seite live |
| **Demand Gen** | YouTube Shorts, Discover, Gmail | Bewegtbild + Karussell, Lookalike auf Kunden/Leads | Max. Conversions | ab 2 |
| **YouTube Reichweite** | Bekanntheit Zone A+B, Ferienimmobilien Zone D | 15–30-s-Spots „Ein Haus am See – italienisches Wohnen im Café“ | CPV/tCPM | ab 3 |
| **Local/Maps** | „In der Nähe“-Suchen, Wegbeschreibung | Standort-Assets aus Google-Unternehmensprofil (Profil muss vereinheitlicht sein, 25/H3) | als Asset in allen Kampagnen | ab 1 |

**Assets:** Standort, Anruf (mit Anruf-Conversion ≥ 60 s), Snippets (Marken), Bilder (eigene Fotos), Preiserweiterung nur für Atelier/Gutscheine. Microsoft Ads (Bing): Import der Search-Kampagnen ab Stufe 2 (geringe Kosten, ältere, vermögende Zielgruppe) [Schätzung].

**Ausschlussliste ab Tag 1:** „gebraucht“, „ebay“, „willhaben“, „ricardo“, „ikea“, „günstig“, „billig“, „replica“, „nachbau“, „dupe“, „job“, „stellenangebot“, „pdf kostenlos“, „lieferant werden“.

### 4a.3 Markenrecht und Keywords (wichtig)

| Fall | Regel | Empfehlung |
|---|---|---|
| **Herstellermarken** (Minotti, Poliform, Rimadesio …) als Keyword | In EU/EFTA darf Google Markennutzung als Keyword einschränken, wenn der Inhaber widerspricht; zulässig ist der Wiederverkauf echter Ware, sofern Anzeige + Zielseite nicht über eine wirtschaftliche Verbindung täuschen [EuGH „Google France“, C-236/08; Google-Richtlinie „Marken“ – prüfen] | **Ja, aber:** Anzeigentext nur sachlich („Minotti-Ausstellung in Lochau“, „Minotti-Sofas live erleben“). **Nie** „offizieller/autorisierter Händler“, „Minotti Store“, „Minotti Vorarlberg“ als Absender. Vor großem Budget auf Minotti mit dem Minotti-Agenten abstimmen (laufende Status-Verhandlung, 00/4) – ein Markenbeschwerde-Verfahren würde die Anzeigen sperren und die Verhandlung belasten. |
| **Wettbewerber-Namen** (Höttges, reiter design, Dolce Vita, Hutle, Fretz, Gamma …) als Keyword | Rechtlich in AT/DE grundsätzlich zulässig, wenn die Anzeige klar als Platzhirsch erkennbar ist und keine Verwechslung entsteht; **Name im Anzeigentext ist unzulässig** (Markenrecht/UWG) | **Phase 1: nicht buchen.** Gründe: kleiner Markt, Dolce Vita ist Wunschpartner (23/4.3), Retourkutschen auf „Platzhirsch“ verteuern unsere Marken-Klicks, Imageschaden im Luxussegment. Frühestens Stufe 3 nach anwaltlicher Prüfung, nur Exact Match, nur generischer Anzeigentext. |
| **Eigene Marke** | Wettbewerber könnten auf „Platzhirsch“ bieten | S1 immer aktiv; Auktionsdaten monatlich prüfen. „Platzhirsch“ ist ein Gattungswort (Wild, Bier, Gastronomie) → negative Keywords gegen Fehlklicks. |
| **Bildmaterial in Anzeigen** | Herstellerbilder nur mit Freigabe | Siehe 5.2 |

### 4a.4 Meta (Instagram/Facebook)

| Kampagne | Ziel | Setup | Stufe |
|---|---|---|---|
| **M1 Lead Ads „Showroom-Termin“** | Leads | Sofortformular mit **höherer Hürde** („Mehr Details“-Formular): Projektart (Wohnen/Küche/Outdoor/Hotel), Zeitraum (< 3 / 3–12 / > 12 Monate), Budget-Rahmen (< 10 / 10–30 / 30–100 / > 100 T€), PLZ/Land. Leads per Webhook/Zapier-freier Lösung → Route Handler `src/app/api/meta-leads/route.js` → Backoffice/Ledger. **Conversion Leads Optimization** einschalten, sobald F4 Statusrückmeldung liefert | ab 1 |
| **M2 Advantage+ (Leads, Website)** | Leads auf LP | Advantage+-Zielgruppe mit Vorschlägen (Interesse Interior Design, Architektur, Luxusimmobilien, Ferienhaus), Geo Zone A–D | ab 2 |
| **M3 Retargeting** | Rückholen | Besucher 30/90/180 Tage, Merkliste ohne Anfrage, Video-Viewer 50 %; Katalog-Anzeigen sobald Feed (F7) | ab 1 (kleines Budget) |
| **M4 Reichweite Events** | Adventsabend, Platzhirsch Tafel, Vernissagen | Lokale Reichweite 25 km, Event-Anmeldung | anlassbezogen |

Pixel + CAPI (F3), Event-Match-Quality ≥ 6 anstreben. **Sonderkategorie:** keine (Möbel). Altersfilter 30+ nur über Signale, nicht hart.

### 4a.5 Pinterest (für Interior überdurchschnittlich stark)
- **Organisch zuerst (Stufe 1, 0 € Media):** Business-Konto, Website verifizieren (Meta-Tag oder DNS), Boards je Marke/Raum („Minotti Wohnzimmer“, „Outdoor am See“, „Küche italienisch“), Rich Pins über das vorhandene JSON-LD/Open Graph der Produktseiten.
- **Paid ab Stufe 2:** Consideration-Kampagnen (Ziel: Traffic auf Ratgeber/Produkte), Conversion-Kampagnen (Ziel `lead`), Katalog-Kampagnen sobald F7 Feed. Geo AT/DE/CH; Liechtenstein-Verfügbarkeit [prüfen].
- Tag + CAPI (F3). Kreativ: 2:3-Hochformat, Text-Overlay „Live in Lochau erleben“, Idea-/Video-Pins.

### 4a.6 LinkedIn (B2B: Architekten, Bauträger, Hotels)
- Zielgruppe: Berufsbezeichnungen Architekt/Innenarchitekt/Projektentwickler/Hoteldirektor/Facility, Firmen-Liste aus 22 (Architekturbüros, Bauträger wie Rhomberg, Hotels) als **Matched Audience** (Firmenliste, keine Personen-Uploads ohne Rechtsgrundlage).
- Formate: Document Ads („Materialbibliothek/Planungsunterlagen Minotti, Poliform, Paola Lenti“ – nur mit Freigabe), Lead Gen Forms „Architekten-Abend“, „Objekt-Konditionen Hotel 2027“.
- Budget: Stufe 1: 0 € (nur organisch durch Geschäftsführung), Stufe 2: 600 €, Stufe 3: 1.200 €/Monat. CPL realistisch 80–200 € [Schätzung], aber ein Architekt bringt mehrere Projekte.
- Insight Tag + Conversions API (F3).

### 4a.7 Budgetstufen (Monat, netto Media, ohne Agentur/Produktion)

| Kanal / Kampagne | Stufe 1: 3 T€ | Stufe 2: 8 T€ | Stufe 3: 15 T€ |
|---|---|---|---|
| Google S1 Eigene Marke | 150 | 250 | 300 |
| Google S2 Marke × Produkt | 900 | 1.800 | 3.000 |
| Google S3 Region × Kategorie | 600 | 1.200 | 2.000 |
| Google S4 Ratgeber | – | 300 | 600 |
| Google PMax Leads | – | 1.200 | 2.500 |
| Google PMax Feed (Atelier/Accessoires) | 200 | 300 | 500 |
| Google Demand Gen / YouTube | – | 600 | 1.600 |
| Microsoft Ads | – | 150 | 300 |
| Meta M1 Lead Ads | 700 | 1.200 | 1.800 |
| Meta M2 Advantage+ | – | 400 | 800 |
| Meta M3 Retargeting | 300 | 300 | 500 |
| Pinterest | 150 (Test) | 300 | 700 |
| LinkedIn | – | 600 | 1.200 |
| Puffer/Tests (Events, Saison Outdoor) | – | – | 200 |
| **Summe** | **3.000** | **8.000** | **15.000** |

Saisonalität: Outdoor-Budget Feb–Mai erhöhen (Verschiebung aus Wohnen), Küchen Jan–März und Sep–Okt, Weihnachten nur Gutscheine/Accessoires/Events.

**Zusätzliche Fixkosten** [Schätzung]: Kreativproduktion 500–1.500 €/Monat (Fotograf/Videograf halbtags), optional sGTM 20–150 €/Monat, Agentur nur für Setup (einmalig 3–6 T€) statt Dauerbetreuung – Betrieb intern ca. 4–6 h/Woche.

### 4a.8 Kreativ-Konzepte pro Kanal

| Kanal | Leitidee | Motive/Formate | Call to Action |
|---|---|---|---|
| Google Search | „Erleben statt bestellen“ | Headlines: „Minotti-Sofas live in Lochau“, „5 Min. von Lindau · Samstag bis 17 Uhr“, „Planung Küche + Wohnen + Outdoor aus einer Hand“, „Ausstellung mit Café“ | „Termin in 2 Minuten buchen“ |
| PMax/Demand Gen | „Ein Haus am See“ | Eigene Fotos: Café mit Minotti-Lounge, Seeblick-Projekte, Hände auf Leder/Stoffproben, Küche bei Abendlicht | „Showroom-Termin“ |
| YouTube | „Kaffee, dann Sofa“ (15/30 s) | Ankunft, Kaffee, Probesitzen, Stoffwahl, fertiges Projekt am See | „Besuchen Sie uns in Lochau“ |
| Meta Reels | „60 Sekunden Projekt“ | Vorher/Nachher Kundenprojekte (mit Freigabe), „3 Sofas unter 30 Sekunden“, Lieferung + Montage-Zeitraffer, Gastgeber-Momente | Lead-Formular |
| Meta Karussell | „Ein Raum, drei Stimmungen“ | gleicher Raum mit drei Stoff-/Farbkombinationen (eigene Aufnahmen) | „Kombination im Showroom ansehen“ |
| Pinterest | „Italienisch wohnen am Bodensee“ | Hochformat-Pins je Raum, Material-Moodboards, Outdoor am Wasser | „Idee merken“ → Ratgeber |
| LinkedIn | „Ihr Objektpartner am Bodensee“ | Hotelprojekt-Case, ÖHT-fähig planen (23/4.2 Nr. 6), Materialabend für Architekten | Lead Gen Form „Einladung“ |
| Retargeting | „Noch an Ihr Lieblingsstück gedacht?“ | Produkt aus Merkliste (dynamisch nur mit Feed), sonst Kategorie-Bilder | „Live probesitzen“ |

Tonalität: leise, gastgebend, keine Rabatt-Sprache (außer Atelier). **Vertrauensargumente erst bewerben, wenn sie existieren:** „Anzahlung abgesichert“, „0 %-Finanzierung“, „Festpreis CHF“ (23/4.2) – sonst Irreführung nach UWG.

---

## 5. Risiken

### 5.1 Performance (Ladezeit, Core Web Vitals)
- Jedes Pixel kostet 15–110 kB JavaScript und Main-Thread-Zeit. **Maßnahmen:** Laden nur nach Consent und nach `requestIdleCallback`/nach `load`; keine Pixel auf Seiten ohne Werbeziel (z. B. Impressum); Server-Events (F3) statt zusätzlicher Client-Events; ab Stufe 2 sGTM (F8) zur Reduktion. INP und LCP in Search Console monatlich beobachten; Budget: max. +150 kB gz Drittanbieter-JS auf Produktseiten.
- Kein eigenes npm-Paket landet im Client-Bundle; alle empfohlenen Bibliotheken sind server-only.

### 5.2 Recht
| Risiko | Gegenmaßnahme |
|---|---|
| Händler-Behauptung in Anzeigen (UWG § 2 AT / § 5 DE) | Freigabeliste verbotener Formulierungen, Anzeigentexte vor Livegang vom Inhaber freigeben |
| Markenbeschwerde Minotti/Poliform | sachliche Texte, Abstimmung mit Agenten, Ausweichen auf generische Keywords möglich |
| Bildrechte | Anzeigen **nur mit eigenen Fotos/Videos** oder schriftlicher Freigabe der Marke. Eigene Fotos von Ausstellungsstücken zum Zweck des Verkaufs sind meist durch Erschöpfung gedeckt, Designer-/Fotografenrechte an Markenkampagnenbildern **nicht** [anwaltlich prüfen]. Kundenprojekte nur mit schriftlicher Einwilligung der Kunden. |
| DSGVO / TKG / TDDDG / CH-DSG | Pixel und Server-Events nur mit Consent; AVV mit Google, Joint-Controller-Vereinbarung mit Meta; Hashing; Verzeichnis der Verarbeitungstätigkeiten; Datenschutzerklärung erweitern; Customer-Match-Listen nur von Kunden mit Werbe-Einwilligung; Löschfristen im Lead-Ledger (z. B. 24 Monate) |
| Drittlandtransfer USA | EU-US Data Privacy Framework (Google, Meta, Pinterest, LinkedIn zertifiziert [prüfen]) – in der Cookie-Beschreibung bereits als Mechanismus „adequacy/scc“ abgebildet |
| Preisangaben (PAngV DE, PrAG AT, PBV CH) | Atelier-Preise als Endpreise inkl. MWST, Streichpreise nur mit Referenz (Omnibus-Richtlinie: niedrigster Preis der letzten 30 Tage) |
| Wettbewerber-Keywords | Phase 1 nicht buchen (4a.3) |

### 5.3 Pflege und Organisation
- **Größtes Risiko: Statuspflege im Lead-Ledger/Backoffice unterbleibt** → Algorithmen lernen falsch. Gegenmaßnahme: Status-Pflege fest im wöchentlichen Pipeline-Termin (23/8.6), Dropdown statt Freitext, Verantwortliche Person benennen.
- Kreativ-Müdigkeit: 4–6 neue Motive pro Monat und Kanal; Produktion an einem fixen Tag im Monat im Showroom bündeln.
- Wissensinseln: Konten im Firmenbesitz (nicht Agentur), zweite Admin-Person, Zugangsdaten im Passwort-Manager.

### 5.4 Wirtschaftlich
- Lange Kaufzyklen (2–6 Monate): Die ersten 8–12 Wochen sehen schlecht aus. Entscheidung über Stufen nur auf Basis **qualifizierter Leads** und Pipeline-Wert, nicht auf Basis von Aufträgen in Woche 4.
- Liquidität (23/1): Budget monatlich kündbar halten, keine Jahresverträge mit Agenturen/Plattformen.
- Lernphase: tCPA/tROAS erst ab ~30 Conversions/Monat je Kampagne; bis dahin „Max. Conversions“ mit Tagesbudget-Deckel.

---

## 6. Priorisierte Reihenfolge

### 6.1 SOFORT baubar – ohne Backoffice-Zugang

| # | Feature | Aufwand | Ergebnis |
|---|---|---|---|
| 1 | **F1 Consent-Erweiterung + Google-Ads-Tag** (inkl. Fix: Ads-Consent lädt gtag auch ohne Statistik) | M | Rechtssichere Basis für alle Kanäle |
| 2 | **F5 Event-Abdeckung** (`view_item`, `add_to_wishlist`, `transaction_id` = `lead_ref`) | S–M | Zielgruppen, Deduplizierung |
| 3 | **F3 Enhanced Conversions Web + Meta/Pinterest CAPI** aus den Route Handlern mit `after()` | M | 20–40 % mehr messbare Conversions [Schätzung] |
| 4 | **F2 Attribution im Client** + **F4 Variante B Lead-Ledger (Google Sheets)** – Klick-IDs landen im Sheet, `lead_ref` im Nachrichtentext ans Backoffice | M | Offline-Import ohne Backoffice-Änderung |
| 5 | **F6 Kampagnen-Landingpages** (zuerst Minotti-Ausstellung, Poliform-Küche, Outdoor-Hotel, Atelierverkauf) | M | Zielseiten für Stufe 1 |
| 6 | **F7 Stufe a Feed** für Atelier/Gutscheine/Accessoires mit manuell gepflegten Preisen | S–M | PMax Feed klein, Meta-Katalog |
| 7 | **F9 Reporting** (Looker Studio) | S | Wöchentliche Steuerung |
| 8 | Konten, Ausschlusslisten, Kampagnen S1–S3 + Meta M1/M3 (kein Code) | S | Stufe 1 startklar |
| 9 | Pinterest organisch, Rich Pins, Website-Verifizierung | S | Kostenlose Reichweite |
| 10 | F10 Kreativ-Werkzeuge auf dem NVIDIA-PC | S | Motive für Stufe 1 |

**Zeitplan-Vorschlag:** Woche 1–2 (KW 44–45): 1, 2, 8 (Konten). Woche 3–4: 3, 4, 7. Woche 5–6: 5, 6, 9, 10. **Mediastart Stufe 1 frühestens KW 49/2026 bzw. Q1 2027** nach Gate 0 (23/1, 23/9: „Budget 3–8 T€ ab Q1 2027, nur mit Tracking“). Vor Mediastart: 2 Wochen „stummes Tracking“ zur Kontrolle (GA4 DebugView, Meta Test Events, Google-Ads-Diagnose).

### 6.2 Blockiert – braucht Backoffice, Hersteller oder externe Klärung

| Feature | Blockiert durch | Wer löst es |
|---|---|---|
| F4 Variante A (Offline-Import direkt aus Frappe, Statusfelder, Auftragswert) | Backoffice-Customizing: Felder `lead_ref`, Klick-IDs, UTM, `consent_ads`, `lead_status`, `auftragswert_netto` | Backoffice-Betreuer (Frappe) |
| F2 vollständig (Klick-IDs im Lead-Datensatz statt im Sheet) | dieselben Felder | Backoffice-Betreuer |
| F7 Stufe b (Feed mit 1.765 Produkten, PMax Feed groß, Shopping, dynamisches Retargeting) | **Preisfeld** im Backoffice, Herstellerfreigabe für Preisangaben, Bildrechte für Feed-Bilder | Backoffice + Inhaber mit Marken |
| `Offer` im JSON-LD | Preisfeld | Backoffice |
| Zone C (CH/FL) aktiv bewerben | Prozess Verzollung/MWST/CHF-Preis (Steuerberater, Zollspediteur, 18) | Inhaber |
| Herstellermarken mit hohem Budget, Herstellerbilder in Anzeigen | Status-Gespräch Minotti/Poliform, Bildfreigaben | Inhaber |
| Vertrauens-Claims (abgesicherte Anzahlung, 0 %-Finanzierung) | Verträge mit Bank/Kreditversicherer (23/10 Idee 1) | Inhaber |
| `book_appointment`-Event + Termin-Kampagnen | Online-Kalender (23/9 Website Punkt 4) | separates Feature |
| Mediabudget überhaupt | Gate 0 (Fortbestehensprognose, Liquiditätsplan) | Inhaber + Steuerberater |

### 6.3 Bibliotheken – Übersicht

| Paket | Version (Stand 26.10.2026) | Lizenz | Größe | Einsatz | Client-Bundle |
|---|---|---|---|---|---|
| `zod` | 4.6.x | MIT | 6,1 MB entpackt | Validierung Route Handler | 0 kB (server-only) |
| `libphonenumber-js` | 1.13.x | MIT | ca. 80 kB (min-Metadaten) | E.164 für Hashing | 0 kB |
| `@googleapis/sheets` | 18.1.x | Apache-2.0 | 0,8 MB entpackt | Lead-Ledger | 0 kB |
| `google-auth-library` | 11.3.x | Apache-2.0 | 0,8 MB entpackt | Service-Account | 0 kB |
| `@google-ads/datamanager` | 1.4.0 (frisch, ältere pinnen) | Apache-2.0 | 3,6 MB entpackt | Offline-Conversions/ECL an Google | 0 kB |
| Meta/Pinterest/LinkedIn CAPI | – (plain `fetch`) | – | 0 | Server-Events | 0 kB |
| `@next/third-parties` | 16.3.x passend zu `next` 16.3.4 (16.4.3 ist neuer als die installierte Next-Version) | MIT | 15 kB | **nicht empfohlen** (kein Consent-Gate) | – |
| `facebook-nodejs-business-sdk` | 24.0.1 | Facebook Platform License | 31 MB entpackt | **nicht empfohlen** | – |

Hinweis: Für diesen Bauplan wurden keine Pakete installiert – das Projekt verlangt keine Codeänderung in `src/`, und alle Pakete werden erst beim Bau des jeweiligen Features gebraucht.

---

## Quellen (Web, abgerufen 26.10.2026)
- Google Ads Help: [About offline conversion imports](https://support.google.com/google-ads/answer/2998031?hl=en-001), [About enhanced conversions for leads](https://support.google.com/google-ads/answer/15713840?hl=en), [Upgrade offline conversion import to enhanced conversions for leads](https://support.google.com/google-ads/answer/14274408?hl=en)
- Google-Markenrichtlinie EU/EFTA (Sekundärquellen, Original prüfen): [brandverity.com](https://www.brandverity.com/blog/google-ads-trademark-rules-101), [karooya.com](https://www.karooya.com/blog/key-elements-of-the-google-ad-trademark-jusgement)
- Pinterest: [Developer Changelog](https://developers.pinterest.com/docs/changelog/changelog/)
- Startseiten-Scans: hoettges.at, gamma.ch, dolcevita.at, fretz.de, connox.at, ambientedirect.com, minotti.com (rh.com: 403, reiter-design.at/hutle.at: keine Antwort)
- Next.js 16 Doku lokal: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md`, `.../03-file-conventions/proxy.md`, `.../03-file-conventions/instrumentation-client.md`, `.../02-guides/third-party-libraries.md`, `.../02-guides/self-hosting.md`
