# Expertenrat gesamt – Analytics- & Tracking-Architektur

Gutachter: Analytics- & Tracking-Architekt (Kürzel `analytics`) · Stand 28.10.2026, Branch `feature/neuauftritt` · Es wurde kein Repo-Code geändert und kein Formular abgesendet.

## Note: 6,5 / 10

Das Fundament ist für einen regionalen Händler ungewöhnlich sauber: Consent Mode v2, Herkunft je Lead, lead_ref, Kanalregel inkl. „KI-Suche“, Unit-Tests. Es fehlen aber die Schichten, die Umsatz messbar und Google Ads steuerbar machen: Lead-Wert, Enhanced Conversions, Offline-Rückspielung, strukturierte CRM-Felder. Dazu sind 4 von 7 Labs-Werkzeugen nicht instrumentiert. Heute misst die Seite Formulare, aber keine Euro.

## Laufzeit-Beleg (Chromium, 1 Browser, `/de/kontakt?utm_source=test&utm_medium=cpc&gclid=TEST123`)

| Schritt | Ergebnis |
|---|---|
| Vor Einwilligung | 0 Requests zu Google, `window.gtag` undefined, kein `ph_attr` ✓ |
| SSR-HTML `/de` | kein gtag.js, Search-Console-Meta `google-site-verification` vorhanden ✓ |
| „Alle akzeptieren“ | 1 Request `gtag/js?id=G-1YCM6K57YG`; dataLayer: `consent default (denied)` → `consent update (granted)` → `js` → `config G-1YCM6K57YG` ✓ |
| Attribution | `ph_attr` mit first/last touch, utm und `gclid=TEST123` (nur mit Ads-Consent) ✓ |
| Tel-Klick | `contact_click {method:"phone"}` ✓ |
| Web Vitals | **jedes Metrik-Event doppelt** (FID ×2, LCP ×2, verschiedene `metric_id`). Wahrscheinlich StrictMode im Dev-Modus, im Prod-Build zu prüfen. FID wird noch gesendet, obwohl die Metrik veraltet ist |

Skript lag nur temporär im Scratchpad, die Kopie unter `tools/qa/` wurde wieder gelöscht.

## Top-5-Stärken

1. **Consent-Architektur rechtssauber** (`src/components/Cookies/googleTag.js`): Ohne Einwilligung lädt nichts, Default „denied“ steht vor der Library. Widerruf löscht `_ga*`/`_gcl_*`, Ads und GA4 sind getrennt schaltbar, ohne `AW-`-ID wird kein Ads-Config gesendet.
2. **Attribution mit Consent-Grenze** (`src/lib/attribution.js`): erster URL-Touch vor der Hydration (`instrumentation-client.js`), first/last touch 90 Tage nur mit Ads-Consent, sonst nur im Speicher und ohne Klick-IDs. Eigener Kanal **„KI-Suche“** (ChatGPT, Perplexity, Gemini …) vor „Organisch“. Das ist ein echter Vorsprung vor dem Wettbewerb.
3. **lead_ref als Brücke zwischen Web und Backoffice** (`src/lib/forms/client.js`, `leadPayload.js`): Jede Anfrage trägt eine UUID. Sie geht als `transaction_id` an GA4 (Deduplizierung) und steht im Herkunft-Block im Backoffice. Damit ist ein Offline-Import grundsätzlich möglich.
4. **Ein Key-Event für alle Leads**: `generate_lead` mit `form`-Dimension (kontakt, beratung, produkt_anfrage, adventsabend, atelier_reservierung, gutschein, kuechenplaner), dazu `contact_click` (Telefon, E-Mail, WhatsApp) delegiert, `add_to_wishlist`, `file_download`, `sign_up`, `review_click`, `book_appointment`.
5. **Web Vitals consent-gesteuert** über das eingebaute `useReportWebVitals`, ohne npm-Paket. CLS wird skaliert, die Rohwerte gehen mit. Dazu Selbstauskunft („Wie haben Sie uns gefunden?“), Gerät und Sprache im Lead.

## Befunde

| Prio | Seite/Datei | Befund | Beleg | Maßnahme | Aufwand | Wirkung |
|---|---|---|---|---|---|---|
| **P0** | `src/lib/analytics.js` `trackLead` | `generate_lead` ohne `value`/`currency`. GA4 und Ads kennen keinen Wert pro Lead, eine Value-Bidding-Vorbereitung ist unmöglich. Der eigene Plan fordert das (10-performance-marketing F2 Nr. 3) | `trackEvent("generate_lead", { form, ...params, transaction_id })`, kein Aufruf übergibt `value` | Wertetabelle je `form` zentral in `analytics.js` (z. B. beratung 300 €, produkt_anfrage 250 €, kuechenplaner 400 €, kontakt 80 €, gutschein = Gutscheinwert), immer `currency:"EUR"`. Werte nach 3 Monaten aus Abschlussquote × Ø-Auftrag (15 T€) × Rohertrag (34 %) kalibrieren | S | hoch: Ads-Gebote auf Wert statt Anzahl, Grundlage des KPI-Baums |
| **P0** | Backoffice / `src/lib/forms/forward.js` | `lead_ref`, Kanal, Kampagne und gclid landen **nur als Freitext** im Nachrichtenfeld. `lead_ref` wird bewusst nicht als Feld weitergeleitet. Ohne strukturierte Felder gibt es keine Auswertung „Umsatz je Kanal“ und keinen Offline-Import mit Wert | `forward.js:84–86` („lead_ref stays on our side“), `herkunftBlock()` erzeugt nur Text | Im Frappe-Backoffice Felder `lead_ref`, `kanal`, `utm_*`, `gclid/gbraid/wbraid`, `landing`, `status` (neu/qualifiziert/Angebot/Auftrag/verloren), `auftragswert_netto` anlegen. Die Route schickt sie strukturiert mit, der Text-Block bleibt als Fallback | M | sehr hoch: ohne diese Felder ist das 1-Mio-Ziel (bzw. 430 T€ M36) online nicht messbar |
| **P0** | Google Ads | `NEXT_PUBLIC_GOOGLE_ADS_ID` leer. Mit Marketing-Consent lädt bewusst nichts, es gibt also keine Ads-Conversion und kein Remarketing | `services.js:36` | Ads-Konto anlegen, `AW-…` setzen, `generate_lead` als GA4-Key-Event importieren bzw. Ads-Conversion-Label setzen, Primärziel nach 3 Monaten auf `qualified_lead` (offline) umstellen | S | hoch, sobald Ads laufen |
| **P1** | `src/components/Labs/Kuechenplaner/ResultPanel.js:256` | Küchenplaner-Lead ruft `/api/labs/kuechenplaner/plan` direkt per fetch auf, nicht über `postForm`. Er hat **keinen Herkunft-Block, keine lead_ref** und `trackLead("kuechenplaner")` ohne `transaction_id`. Küchen sind laut Masterkonzept der größte Warenkorb | `leadKindOf()` kennt nur kontakt/beratung/produkt (`leadPayload.js:36–42`) | `leadKindOf` um `labs/kuechenplaner/plan` (bzw. die spätere Live-Route) erweitern oder `prepareLead()` im Planer nutzen, `transaction_id: result.leadRef` übergeben | S | hoch: Küchen-Leads sind sonst keinem Kanal zuzuordnen |
| **P1** | `src/components/Labs/Sofaplaner/ResultPanel.js:134` | Sofaplaner sendet noch nicht (fetch auskommentiert, **in Arbeit**). Es gibt kein einziges Event (Start, Modell gewählt, Ecksofa fertig, Anfrage) | Kommentar „Labs: NOT sent“ | Beim Live-Schalten `postForm("/api/beratung_anfrage")` + `trackLead("sofaplaner", {transaction_id})`, dazu Funnel-Events `planner_start` / `planner_step` / `planner_complete` mit `planner:"sofa"` | S | mittel bis hoch |
| **P1** | Stil-Finder, Concierge, Dreiländer-Rechner, Upload, Portal, Suche | Keine Events: kein Moodboard-PDF-Lead (`/api/labs/stilfinder/moodboard` sammelt E-Mail, ohne Event und ohne Herkunft), kein `concierge_open` / `concierge_handoff`, kein `search` (Overlay-Suche, Enhanced Measurement greift nicht), kein Event für den Preisrechner und kein `upload_complete` | grep `trackEvent` in diesen Ordnern: 0 Treffer | Einheitliches Planer-Schema `trackEvent("planner_*", { planner, step, labs })`. Stil-Finder-PDF als `generate_lead {form:"stilfinder_pdf"}` mit niedrigem Wert. `search {search_term}` in `SearchSheet.js` (gekürzt, ohne PII). `concierge_handoff {target}` | M | mittel: zeigt, welche Labs-Features Umsatz bringen (Freigabe-Entscheidung je Feature) |
| **P1** | GA4-Verwaltung (außerhalb Repo) | Ob SPA-Seitenaufrufe nach Client-Navigation gezählt werden, hängt von „Enhanced Measurement → Seitenänderungen im Browserverlauf“ ab. Der Code sendet kein eigenes `page_view` | Kein `page_view` im Code, `config` nur einmal pro Laden | In GA4 prüfen und aktivieren. Außerdem Datenaufbewahrung 14 Monate (D5), interne IP-Filter (Studio), Key-Events markieren, `form` und `labs` als benutzerdefinierte Dimensionen | S | hoch für die Datenqualität |
| **P1** | Enhanced Conversions / Server-Side | Kein `gtag('set','user_data',…)`, kein Measurement Protocol, kein CAPI. Bei Safari/ITP und Adblockern (Zielgruppe wohlhabend, viel iOS) gehen geschätzt 20–35 % der Conversions verloren | grep `user_data` / `sha256` in `src`: nur Consent-Keys | Phase 1: Enhanced Conversions (Web) mit im Browser SHA-256-gehashter E-Mail und Telefon, nur bei Ads-Consent, vor `generate_lead`. Phase 2: serverseitiger Offline-Import über die **Google Data Manager API** (Pflichtweg seit 06/2026) aus dem Backoffice-Status, Schlüssel lead_ref + gclid. sGTM erst ab nennenswertem Ads-Budget | M (Ph. 1) / L (Ph. 2) | sehr hoch für ROAS |
| **P2** | `src/context/WebVitals.js` / `analytics.js` | Doppelte `web_vitals`-Events je Metrik (Dev beobachtet). FID ist veraltet (INP ersetzt es seit 2024). Es fehlt eine Attribution (welches Element verursacht LCP/INP) | Laufzeit-Log oben | Im Prod-Build (`next build && next start`) gegenprüfen. Bei Bedarf über `metric.id` deduplizieren (Set im Modul), `FID` verwerfen, `page_type` (Produkt, Marke, Landing, Labs) mitsenden | S | gering bis mittel (CWV = Ranking-Signal) |
| **P2** | `src/context/CartContext.js`, Produktseiten | Merkliste nur `add_to_wishlist`. Es fehlen `view_item` (Produktseite), `remove_from_wishlist` und `view_item_list` (Kategorie/Marke). Ohne sie gibt es keinen Funnel Produkt → Merkliste → Anfrage | grep | GA4-E-Commerce-Events ohne Preis (SHOW_PRICES aus) mit `item_brand` = Marke, `item_category`. Ermöglicht später Ads-Remarketing-Listen je Marke | M | mittel |
| **P2** | `src/components/Kontakt/kontakt.js:32` | Klick auf „Route/Google Maps“ wird nicht gemessen, obwohl er die wichtigste lokale Offline-Conversion ist (Besuch im Studio + Café) | Maps-Link ohne Event | `listenForContactClicks` um `maps.google`/`google.com/maps` → `get_directions` erweitern | S | mittel (Local-KPI) |
| **P2** | Search Console / Bing | Nur Google verifiziert. Keine Bing-Webmaster-Verifizierung und kein IndexNow, obwohl ChatGPT-Suche und Copilot auf dem Bing-Index aufsetzen (Kanal „KI-Suche“) | `src/app/layout.js:11`, grep `indexnow`/`msvalidate`: 0 | `verification.other["msvalidate.01"]`, IndexNow-Key und Ping beim Revalidate (`src/lib/revalidate.js`). In GSC Domain-Property + Sitemap einreichen, GSC mit GA4 verknüpfen | S | mittel (KI-Sichtbarkeit) |
| **P2** | Atelier / Gutschein | Gutschein-Anfragen sind faktisch Umsatz, laufen aber als `generate_lead` ohne Wert | `VoucherForm.js:159` | `generate_lead {form:"gutschein", value: Gutscheinbetrag}`; ab Online-Verkauf `purchase` | S | gering bis mittel |
| **P3** | `googleTag.js` | `anonymize_ip` ist in GA4 ohne Funktion (IP wird nie gespeichert), harmlos | `config … {anonymize_ip:true}` | Entfernen oder kommentieren, damit niemand Schutz vermutet, wo keiner wirkt | S | keine |
| **P3** | Consent-Modell | Basic Consent Mode (vor Einwilligung keine Pings). Damit gibt es keine Conversion-Modellierung in Ads und GA4. Rechtlich die sichere Variante (Inhaber-/Rechtsentscheidung D3) | `ensureGtag` wird erst mit Banner aufgerufen | So lassen und dokumentieren. Advanced Mode nur nach Freigabe des Rechtspakets | – | – |
| **P3** | Dashboards | Es gibt kein Reporting. Daten liegen verstreut in GA4, GSC und Backoffice | – | Looker-Studio-Bericht „Umsatz-Cockpit“ (GA4 + GSC + Backoffice-Export per Google Sheet), monatlich zur Gate-Prüfung | M | hoch für die Steuerung |

## KPI-Baum (Messbarkeit des Umsatzziels)

Laut 23-Masterkonzept ist 1 Mio. €/Monat eine Vision für 2030/31, Plan sind ≥ 430 T€/Monat bis M36 (Ø-Auftrag 25 T€, also ca. 17 Aufträge pro Monat).

```
Umsatz/Monat (Backoffice: Σ auftragswert_netto, Status=Auftrag)          ← fehlt strukturiert
├─ Aufträge = qualifizierte Anfragen × Abschlussquote                     ← Status-Feld fehlt
│   ├─ Qualifizierte Anfragen (Ziel 85/Monat M36)                         ← Status „qualifiziert“ fehlt
│   │   └─ Anfragen = generate_lead (GA4, je form)                        ✓ gemessen
│   │       ├─ Sitzungen je Kanal (GA4 + Herkunft-Kanal im Lead)          ✓ (Lead nur als Text)
│   │       │   ├─ Organisch / GSC-Klicks je Landing                      ✓ GSC verifiziert
│   │       │   ├─ KI-Suche                                               ✓ eigener Kanal
│   │       │   ├─ Google Ads (gclid)                                     ✗ kein AW-Tag
│   │       │   └─ Offline/QR, Newsletter, Social                         ✓ Kanalregel
│   │       └─ Conversion-Rate je Seitentyp / Planer                      ~ Planer-Events lückenhaft
│   │   + Telefon/WhatsApp (contact_click)                                ✓ Klick, ✗ Anruf-Ergebnis
│   │   + Studio-Besuch (get_directions, Selbstauskunft)                  ✗ / ✓
│   └─ Abschlussquote je Kanal                                            ✗ braucht lead_ref-Join
└─ Ø Auftragswert (15 → 25 T€) und Rohertrag (≥ 34 %, KPI Nr. 1)          ✗ nur Backoffice
```

Die Website-Seite ist zu etwa 60 % fertig. Was fehlt, liegt vor allem im Backoffice (Status- und Wertfelder) und in der Rückspielung zu Google.

## Quick-Wins (je ≤ ½ Tag)

1. `value` + `currency:"EUR"` je `form` in `trackLead` (eine Tabelle in `analytics.js`).
2. Küchenplaner über `prepareLead`/`leadKindOf` an Herkunft und lead_ref anbinden.
3. `get_directions` und `search` in den bestehenden Listener bzw. `SearchSheet` aufnehmen.
4. In GA4: Enhanced Measurement „Browserverlauf“ an, 14 Monate Aufbewahrung, internen Traffic filtern, Key-Event `generate_lead`, Dimensionen `form` und `labs`.
5. Bing-Verifizierung und IndexNow, GSC mit GA4 verknüpfen.
6. Web Vitals: im Prod-Build auf Doppelungen prüfen, FID verwerfen.
