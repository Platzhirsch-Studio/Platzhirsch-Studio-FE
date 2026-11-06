# 60 – Website: Umschaltung alt (platzhirsch_studio) ↔ ph (Backend-Import/ph_*)

Stand 04.11.2026 · Website-Agent · Grundlage: Website-Code `src/`, App-Code `Backend-Import/ph_*/ph_*/api/**` (Signaturen und Antworten im Python-Code geprüft), `Backend-Import/PLAN.md` §1 und §4, READMEs der Apps, `52-backend-luecken-…md`.

Ziel des Inhabers: Website, Shop, Backoffice und Kassa arbeiten auf **einem** Datenbestand. Dieser Bericht beschreibt, wie die Website gruppenweise auf die neue App-Familie umgestellt wird, was dafür schon gebaut ist und was im Backend noch fehlt.

**Kurzfassung**

- Die Website hat **67 Aufrufstellen** zum Backend (Zeilen der Tabelle in Abschnitt 1, eine Zeile je Website-Funktion × Methode).
  - **47** sind abgebildet: Der ph-Adapter ist gebaut und getestet.
  - **9** brauchen noch Feld-Mapping bzw. einen Umbau auf der Website. Ein Teil davon liegt außerhalb des Schreibbereichs dieses Auftrags.
  - **5** fehlen im Backend.
  - **6** bleiben bewusst alt: CMS, Legacy, Werkzeuge.
- Gesteuert wird die Umschaltung zentral über `BACKEND_GENERATION=alt|ph`, optional je Gruppe über `BACKEND_PH_GRUPPEN` / `BACKEND_ALT_GRUPPEN`.
- Ist die Variable nicht gesetzt, verhält sich die Website wie bisher. Das ist durch Tests abgesichert, die alle bestehenden Tests unverändert grün lassen.
- ph_sortiment hat **gleichwertige** Gast-Lesemethoden für den Katalog. Pflicht-Lücken gibt es nur bei einzelnen Feldern der Produktkarte (siehe Abschnitt 5).

---

## 1. Inventar

Legende Status: **A** = abgebildet (ph-Adapter gebaut + Unit-Test) · **M** = Feld-Mapping/Umbau nötig (nicht umgeschaltet) · **F** = fehlt im Backend · **alt** = bleibt bewusst in `platzhirsch_studio` bzw. lokal.
Methodenpfade alt ohne Präfix `platzhirsch_studio.platzhirsch_studio.doctype.`.

### 1.1 Lesend

| # | Website (Datei) | alt-Methode | neue ph-Methode | Gruppe | Status / Mapping |
|---|---|---|---|---|---|
| 1 | Kategorie-Listing `lib/api/fetchAllProdukte.js` fetchProdukteByKategorie | `produkte_new.api.get_produkte_by_kategorie?kategories` | `ph_sortiment.api.get_produkte_by_kategorie(kategories, limit=500)` GET guest | katalog | **A**. Kartenform gleich (`name`=slug, `marken`=Markenname, `kategories`=Kategorie-Key). Es fehlen die Filterfelder `subCategoryKeys`, `colorKeys`, `materialKeys` und `indoor_and_outdoor` (siehe 5). |
| 2 | Startseite/Marke `fetchProdukteNewByMarke`, `fetchKategorien.js` Bild je Kategorie, `arviewer/catalog.js` fetchMarkeStrict | `produkte_new.api.get_produkte_by_marke_api?marken` | `ph_sortiment.api.get_produkte_by_marke_api(marken, limit=1000)` | katalog | **A** (3 Aufrufer) |
| 3 | Navbar-Suche, Legacy-Redirects, Concierge `searchProdukte` | `produkte_new.api.search_produkte?q&limit` | `ph_sortiment.api.search_produkte(q, limit≤50)` | katalog | **A** |
| 4 | /produkte-Hub, Concierge, AR-Viewer `fetchKategorienWithCounts` | `produkte_new.api.get_all_kategorien` | `ph_sortiment.api.get_all_kategorien()` | katalog | **A** |
| 5 | Produktdetail `fetchProduktNewByPathField` → `produktDetail.js` | `produkte_new.api.get_produkt_by_path_field_api?path_field&lang` | `ph_sortiment.api.get_produkt_by_path_field_api(path_field, lang)` | katalog | **A mit Mapping**: `mapPhProduktDetail()` bildet `additional_information[0].material/farbe` aus `merkmale` (gruppe Material/Oberflaeche/Stoff/Leder/Holz bzw. Farbe). Ein unbekannter Slug liefert `{}`, daraus wird wie bisher `null`. |
| 6 | generateStaticParams, Pfadprüfung `fetchProduktePaths` | `produkte_new.api.get_produkte_paths` | `ph_sortiment.api.get_produkte_paths()` | katalog | **A** |
| 7 | „Das könnte gefallen“ `fetchRelatedProdukteNew` | `produkte_new.api.related_products` | `ph_sortiment.api.related_products(marken, kategories, currentProductPath, limit)` | katalog | **A** (bild_anhangen flach wie bisher) |
| 8 | Markenseite/Navbar `fetchKategorienByMarke`, `fetchMarkeKategorien` | `produkte_new.api.get_kategorien_by_marke?marken` | `ph_sortiment.api.get_kategorien_by_marke(marken)` | katalog | **A**. Hinweis: im Backend ohne `website_sichtbar`-Filter. |
| 9 | Markenseite `fetchCollectionsByMarke` | `produkte_new.api.get_collections?marken` | `ph_sortiment.api.get_collections(marken)` | katalog | **A** |
| 10 | Marken (`fetchMarkenData.js`, Legacy-Redirects, Concierge, AR-Viewer, brandData) | `marken.api.marken_data` | `ph_sortiment.api.marken_data()` (Alias `get_marken`) | katalog | **A**: Feldnamen inkl. Altschreibweisen `bild_anhagen`, `grundungsjahr`. Die Website filtert `status === "Aktiv"` weiter selbst. |
| 11 | Kategorie-Kacheln `fetchKategorien` | `produkte_kategorie.api.get_all_kategorien_api` | `ph_sortiment.api.get_all_kategorien_api()` | katalog | **A** |
| 12 | Filter Unterkategorie `fetchSubKategorien` | `sub_kategorie.api.get_all_sub_kategorien_api` | `ph_sortiment.api.get_all_sub_kategorien_api()` | katalog | **A** (`kategorie` = Eltern-Key). Ohne `website_sichtbar`-Filter. |
| 13 | Filter Farbe `fetchFarben` | `produkte_farbe.api.get_all_farben_api` | `ph_sortiment.api.get_all_farben_api()` | katalog | **A** (`color_key`, `hex_code`, `name_*`) |
| 14 | Filter Material `fetchMaterialien` | `produkte_material.api.get_all_materialien_api` | `ph_sortiment.api.get_all_materialien_api()` | katalog | **A** (`material_key`, `name_*`) |
| 15 | Dateien `/cmx/files/…`, Bildgrößen (`NEW_API_SERVER` in `apiBaseUrl.js`) | `<SERVER>/files/…` | `<BACKEND_PH_URL>/files/…` | katalog | **A**: Bei ph kommt `NEW_API_SERVER` vom ph-Server. Hinweis: Stehen alt und ph auf getrennten Sites, kommen die News-Bilder (CMS) über /cmx dann vom ph-Server. Empfehlung PLAN §2: eine Site. |
| 16 | Karriere `fetchKarrierData.js` | `karriere.api.karriere_data` | `ph_personal.api.karriere_data()` GET guest | karriere | **A**: gleiche Form plus `slug`, `entgelt{…}`, `salary_unit`. „Stunde“ wird jetzt unterstützt (`stellen.js` SALARY_UNIT, `texte.js` 4 Sprachen). |
| 17 | Preise mit Stand (Shop) | – (statischer Katalog `lib/katalog`) | `ph_sortiment.api.get_preise(slugs[])` | katalog | **M**: Methode vorhanden, Website liest Preise heute aus `src/lib/katalog/marken/*.js`. Umbau des Shop-Katalogs auf `get_preise` folgt nach M3. |
| 18 | News `fetchNewsData.js` (2 Aufrufe) | `news.api.news_data` | – | cms | **alt** (PLAN §1 Z. 8) |
| 19 | Homepage `fetchHomepage.js` | `homepage.api.homepage_data` | – | cms | **alt** |
| 20 | Team `fetchTeam.js` | `team_platzhirsch.api.team_platzhirsch_data` | – | cms | **alt** |
| 21 | 9 Keyword-Fetcher `lib/api/Keywords/*` | `*_keywords.api.*_keywords_data` | – | cms | **alt** |
| 22 | Legacy-Produkt-URLs `seo/legacyProductRedirects.js` | `produkte.api` (Altdoctype, Methode entfernt) | – | – | **alt** (wird nicht mehr gerufen, nur Konstante) |
| 23 | SEO-Crawler `seo/audit/crawl.mjs` | `produkte_new.api.*` | – | Werkzeug | **alt** (Werkzeug, liest gegen Produktion nur lesend) |
| 24 | AR-Viewer 3D-Modelle `components/Labs/ArViewer/data/source.js` | `/api/resource/Produkt 3D Modell` (geplant) | Detail `modell_3d[]` | katalog | **M**: Daten sind im Detail vorhanden. Eine eigene Listenmethode fehlt (5). |
| 25 | Dreiländer-Rechner `components/Labs/Dreilaender/store.server.js` | `/api/resource/Dreilaender Rechner Einstellungen` (geplant) | – | – | **F** (PLAN Z. 22: `PH Wechselkurs Einstellungen`, keine Lesemethode) |
| 26 | Sofaplaner `components/Labs/Sofaplaner/server/store.js` | `/api/resource/Sofa Plan` (geplant) | – | – | **F** (ph_projekte `PH Planung` nicht für die Website freigegeben) |
| 27 | Revalidate Frappe → Website (`src/app/revalidate/<pfad>`) | Webhook mit Secret | `ph_core.utils.website.revalidate` (Pfade karriere, marken, news, produkte, team; `X-Revalidate-Secret`) | eingehend | **A** (Pfade existieren auf der Website) |

### 1.2 Schreibend

| # | Website (Datei) | alt-Methode | neue ph-Methode | Gruppe | Status / Mapping |
|---|---|---|---|---|---|
| 28 | Kontakt, Adventsabend, Empfehlung, Upload-Anfrage Kontakt (`api/kontakt`) | `kontakt_form.api.create_contact` | `ph_crm.api.create_contact(**d)` POST Token, idempotent | formulare | **A**. Gleicher Payload. Die Art wird aus der Kontext-Zeile erkannt. `lead_ref` → `idempotency_key`. Antwort `{referenz,status}` → `data.message.name`. utm_*/klick_id kommen aus dem Herkunftsblock. |
| 29 | Beratung, Küchenplaner, Hotel, Pflege, Winterlager, Architekten (`api/beratung_anfrage`) | `anfrage.api.create_anfrage` | `ph_crm.api.create_anfrage(**d)` | formulare | **A** (wie 28) |
| 30 | Produktanfrage Merkliste (`api/anfrage_produkt`) | `anfrage_produkt.api.create_anfrage` | `ph_crm.api.create_anfrage(**d)` (Art „Produkt“ über `anfrage_*`) | formulare | **A** (`produkte[]` → PH Anfrage Produkt, Zahlen werden Text) |
| 31 | Gutschein-Anfrage (`lib/commerce/handlers.js`) | `kontakt_form.api.create_contact` | `ph_crm.api.create_contact` + `art: "Gutschein"` | formulare | **A** |
| 32 | Atelier-Reservierung (`lib/commerce/handlers.js`) | `kontakt_form.api.create_contact` | `ph_crm.api.create_contact` + `art: "Reservierung"` | formulare | **A** |
| 33 | Ezarri-Anfrage (`api/ezarri/anfrage/handler.js`) | `anfrage.api.create_anfrage` | `ph_crm.api.create_anfrage` + `art: "Ezarri"` | formulare | **A** (Schalter `EZARRI_ANFRAGE_BACKOFFICE` bleibt) |
| 34 | KI-Assistent bestätigt (`lib/agent/deps.js`) | `anfrage.api.create_anfrage` | `ph_crm.api.create_anfrage` + `quelle: "agent"` | formulare | **A** |
| 35 | Upload-Anhänge (`lib/upload/phAdapter.js`) | – (`frappeAdapter.js` gesperrt) | `ph_crm.api.attach_upload(referenz, file \| file_url, file_name, note)` | upload | **A** im Adapter. **M** im Ablauf: `upload/service.js saveNote()` hat einen TODO, die Upload-Sitzung kennt die PH-Referenz noch nicht. |
| 36 | Newsletter (`api/newsletter_subscribe`) | `newsletter_website.api.subscribe_newsletter` (guest, ohne DOI) | `ph_marketing.api.subscribe_newsletter(email, utm_*…)` Token, idempotent, DOI im Backend | newsletter | **A**: Antwort an den Browser bleibt neutral. Website-Lücke: Seiten `/de/newsletter/bestaetigen` und `/de/newsletter/abmelden` fehlen. Vorher nicht umschalten. |
| 37 | One-Click-Abmeldung RFC 8058 (**neu** `api/newsletter/abmelden-1klick`) | – | `ph_marketing.api.unsubscribe_one_click(token, body)` | newsletter | **A**. Alt: Postausgang `.data/newsletter/abmeldungen` (nur Token-Hash), das Team trägt aus. GET zeigt nur eine Rückfrage, noindex. |
| 38 | Termin Slots (`booking/adapters/frappe.js`) | `platzhirsch_studio.termin.api.get_freie_slots` (nie live) | `ph_crm.api.get_freie_slots(terminart, modus, von, bis, zeitzone)` | termin | **A** |
| 39 | Termin buchen | `…create_termin` | `ph_crm.api.create_termin(**d)` idempotent | termin | **A** (+ utm_*/klick_id nur an ph) |
| 40 | Termin bestätigen | `…verify_termin` | `ph_crm.api.verify_termin(referenz, verify_hash)` | termin | **A** (`verify_expired`/`cancelled` 410) |
| 41 | Termin lesen | `…get_termin` | `ph_crm.api.get_termin(referenz)` | termin | **A** (`invalid_token` → null) |
| 42 | Termin absagen | `…cancel_termin` | `ph_crm.api.cancel_termin(referenz, link_version)` | termin | **A** |
| 43 | Termin umbuchen | `…reschedule_termin` | `ph_crm.api.reschedule_termin(referenz, link_version, neuer_start)` | termin | **A** (`slot_taken`, `too_late_to_change`) |
| 44 | Besucher-Einblicke (`einblicke/frappe.server.js`) | `platzhirsch_einblicke.api.tag_speichern` | `ph_marketing.api.tag_speichern(datum, schema, meta, teil, …)` | einblicke | **A** (Teile ≤ 1 MB; Schutz des produktiven Backoffice bleibt) |
| 45 | Zahlungsereignis Gutschein/Anzahlung (`payments/backoffice.js`) | `platzhirsch_studio.api.payment_event` (nie live) | `ph_shop.api.payment_event(event)` Schema v1 unverändert + `idempotency_key` | zahlung | **A** (`PAYMENTS_BACKOFFICE_LIVE=1` bleibt der Schalter) |
| 46 | Gutschein-Widerruf (`payments/withdrawal.js`) | über 45 | `payment_event` mit `zahlungsstatus: widerruf_eingegangen` | zahlung | **A** |
| 47 | Gutschein-Kauf online (`payments/voucherOrder.js`) | lokal | `ph_shop.api.create_voucher_order(record)` | zahlung | **M** (bis M6 lokal + payment_event) |
| 48 | Gutschein-Register prüfen/einlösen/sperren/ersetzen (`api/payments/register`) | lokal | `get_voucher / redeem_voucher / block_voucher / replace_voucher` | zahlung | **M** (Kassa nutzt die ph-Methoden; Website-Register bis M6 lokal) |
| 49 | Anzahlung (`payments/deposit.js`) | lokal | `create_deposit / get_deposit` | zahlung | **M** (bis M6) |
| 50 | Shop-Checkout `store.put("bestellungen")` (`shop/handlers.js`) | lokal (`frappeOrderAdapter` wirft) | `ph_shop.api.create_order(record)` idempotent | shop | **A** als Spiegel (`shop/phMirror.js`). Der lokale Store bleibt bis M6 die Quelle. |
| 51 | Stripe-Session zur Bestellung | lokal | `ph_shop.api.attach_session(referenz, session, payment_intent?)` (ohne idempotency_key, kein **kwargs) | shop | **A** (Spiegel) |
| 52 | Checkout-Fehler | lokal | `attach_session(referenz, status="checkout_fehler")` | shop | **A** (Spiegel) |
| 53 | Stripe-Webhook-Weitergabe bezahlt/ausstehend/fehlgeschlagen/abgelaufen/erstattet (`shop/webhook.js`) | lokal | `ph_shop.api.order_event(referenz, status, zeit, payment_intent, livemode, betrag_bezahlt_cent, erstattet_cent)`; `order_paid` gibt es nicht | shop | **A** (Spiegel; der Stripe-Webhook in Frappe läuft parallel) |
| 54 | Versand angelegt (AWB) | lokal | `order_event(status="versandbereit", sendung{shipmentId,awb,carrier})` | shop | **A** (Spiegel) |
| 55 | Shop-Widerruf (`shop/widerruf.js`) | lokal | `ph_shop.api.request_withdrawal(name, email, bestellung, anschrift, artikel, bestelltAm, erhaltenAm, id, zeit, bestaetigung_senden=0)` | shop | **A** (Spiegel; die Eingangsbestätigung schickt weiter die Website) |
| 56 | Versandtarif/Etikett LetMeShip (`commerce/shipping/letmeship.js`) | direkt LetMeShip | `ph_logistik.api.get_shipping_quote / create_shipment / get_tracking` | – | **M** (eigener Adapter in `shipping/index.js`; nicht Teil dieser Umstellung) |
| 57 | Bestätigungsseite Bestellung | lokal | `ph_shop.api.get_order(referenz, token)` | shop | **M** (erst ab M6 lesend umstellen) |
| 58 | Portal-Login (`api/portal/auth/request`) | – (Platzhalter) | `ph_projekte.api.portal_login_token(email)` → `{found, kontakt, kunde_token, customer}` | portal | **A** (`portal/adapters/ph.js`; Token serverseitig verschlüsselt in `.data/portal/ph-kunde-token.json`) |
| 59 | Portal Kunde/Projekte/Dokumente/Termine/Produktpass/Renderings/Nachrichten/Feedback/Planungswunsch/gelesen/senden (13 Vertragsmethoden) | – | `portal_customer, portal_projects, portal_project, portal_documents(type, projekt), portal_appointments(projekt, von), portal_product_pass(produktpass), portal_renderings, portal_messages, portal_add_feedback(eintrag), portal_request_planning(eintrag), portal_mark_read(message_ids), portal_send_message(body, projekt)` | portal | **A** (Antwortformen = Website-Vertrag; `invalid_token`/`expired` → abgemeldet) |
| 60 | Portal-Kundenkarte | – | `ph_kundenkarte.api.portal_card(kontakt, kunde_token)` | portal | **A** (`found:false` → null) |
| 61 | Rendering-Bild (`api/portal/feedback/rendering/[id]`) | lokale Datei | `ph_projekte.api.portal_file(file_url)` | portal | **A** (`dal.readFile`) |
| 62 | Portal-Dokument-PDF (`components/Portal/Docs/server/files.js`) | `frappe.utils.print_format.download_pdf` (geplant) | `ph_faktura.api.portal_document_pdf(doctype, name)` bzw. `ph_projekte.api.portal_file` | portal | **M** (Datei außerhalb des Schreibbereichs `src/components`) |
| 63 | Bautagebuch + Referenz-Freigabe (`portal/tagebuch/adapter.js`) | `/api/resource/Projekt Tagebuch Foto`, `Projekt Referenz` | `tagebuch_list/add/delete/file`, `referenz_create/list/update/file` | portal | **M**: Umbau nötig. Die Website-Schnittstelle arbeitet als Datei-Store mit Lesen-Ändern-Schreiben, ph arbeitet mit Einzelaufrufen und braucht `kunde_token` bzw. `rolle=team`. |
| 64 | Portal-Loginmail per Frappe (`portal/mailer.js` provider frappe) | `platzhirsch_studio.api.portal_send_login_link` | – | portal | **F** (ph_core `send_transactional` nicht gebaut). Die Website mailt über Resend, das ist der empfohlene Weg. |
| 65 | Kundenkarte Antrag/Bestätigung/Status/Wallet (`kundenkarte/adapters/frappe.js`) | (schon ph_kundenkarte über `FRAPPE_KUNDENKARTE_*`) | `create_card_application, confirm_card_application, get_card_status, portal_wallet_pass` | kundenkarte | **A** (Gruppe nimmt `BACKEND_PH_*`; + utm_*/klick_id) |
| 66 | Wunschliste anlegen/teilen/lesen/ändern/löschen (`wunschliste/frappeAdapter.js`) | `platzhirsch_service.wunschliste.api.create/by_share/get/update/remove` (nie gebaut) | – | wunschliste | **F** (ph_shop „Offen“) |
| 67 | Ideenboard teilen (`lib/ideenboard/*`), Bewertung, Bewerbung | lokal / – | Bewertung nur `ph_service.portal_rate_service_case`; Bewerbung `ph_personal.api.create_bewerbung` + `attach_unterlage` | – | **F**: Ideenboard und Bewertung haben im Backend kein Gegenstück. Für die Bewerbung fehlt das Website-Formular (Initiativbewerbung per Mail). |

Zählung (67 Zeilen):

- **A = 47:** Zeilen 1–16, 27, 28–35, 36–46, 50–55, 58–61, 65. Zeile 35 zählt als A, der Upload-Ablauf ist ein Website-TODO.
- **M = 9:** Zeilen 17, 24, 47, 48, 49, 56, 57, 62, 63.
- **F = 5:** Zeilen 25, 26, 64, 66, 67. Zeile 67 umfasst Ideenboard, Bewertung und Bewerbungsformular.
- **alt = 6:** Zeilen 18–23. Zeile 21 steht für 9 Keyword-Fetcher.

---

## 2. Umschaltung (gebaut)

### 2.1 Konfiguration – `src/lib/backend/config.js`

| Variable | Wert | Wirkung |
|---|---|---|
| `BACKEND_GENERATION` | `alt` (Standard) \| `ph` | Basis für alle Gruppen. Ungesetzt oder unbekannt = alt. |
| `BACKEND_PH_GRUPPEN` | z. B. `katalog,karriere,termin` oder `alle` | bei Basis alt: diese Gruppen auf ph |
| `BACKEND_ALT_GRUPPEN` | z. B. `shop,portal` | bei Basis ph: diese Gruppen bleiben alt |
| `BACKEND_PH_URL` | `https://staging…` | ph-Site (https; http nur localhost oder mit `BACKEND_PH_ALLOW_HTTP=1` außerhalb der Produktion) |
| `BACKEND_PH_TOKEN` | `key:secret` | API-Schlüssel des Users `website@platzhirsch.studio` (Rolle PH Website Integration), nur Server |
| `BACKEND_PH_LIVE` | `1` | nötig, wenn `BACKEND_PH_URL` auf `backoffice.platzhirsch.studio` zeigt, und nur mit `NODE_ENV=production`. Ohne diesen Schalter bleibt das produktive Backoffice gesperrt. |

Gruppen: `katalog`, `karriere` (lesend), `formulare`, `newsletter`, `termin`, `upload`, `einblicke`, `zahlung`, `shop`, `portal`, `kundenkarte` (schreibend). `cms`, `wunschliste` und `ideenboard` haben kein ph-Gegenstück und bleiben immer alt.

Regeln:

- **Die Generation wählt nur das Backend.** Ob überhaupt gesendet wird, entscheiden weiter die bestehenden Schalter: `BOOKING_PROVIDER=frappe`, `KUNDENKARTE_PROVIDER=frappe`, `PAYMENTS_BACKOFFICE=frappe` + `_LIVE=1`, `PORTAL_ADAPTER=frappe`, `EINBLICKE_FRAPPE_DRYRUN`, `EZARRI_ANFRAGE_BACKOFFICE`, DSE-Sperren.
- Fehlt der ph-Zugang, lesen die lesenden Gruppen weiter alt (Warnung einmal im Log).
- Schreibende Gruppen senden in diesem Fall **nichts**: Die Formulare antworten 503 `not_configured`, Zahlung und Einblicke laufen als Probelauf bzw. Outbox, der Shop-Spiegel ist aus. Eine Anfrage landet so nie still im falschen System.
- Katalog-Lesemethoden sind Gast-Methoden. Die Website schickt dafür **kein** Token, damit der Next-Data-Cache, die Tags und das Revalidate unverändert bleiben.
- Fehlercodes kommen aus `body.message.code` (ph_api: `invalid` 400, `forbidden` 403, `not_found`/`invalid_token` 404, `conflict`/`slot_taken` 409, `expired` 410, `outside_window` 422, `rate_limited` 429, `unavailable` 503).

### 2.2 Adapter je Gruppe

| Gruppe | Datei(en) | Art |
|---|---|---|
| katalog | `lib/backend/katalog.js` (`katalogApi`, `katalogMethod`, `katalogFileServer`, `mapPhProduktDetail`); eingebunden in `lib/api/fetchAllProdukte.js`, `fetchKategorien.js`, `fetchSubKategorien.js`, `fetchFarben.js`, `fetchMaterialien.js`, `fetchCollections.js`, `fetchMarkenData.js`, `arviewer/catalog.js`, `apiBaseUrl.js` | Basis-Tausch + Detail-Mapping |
| karriere | `lib/backend/katalog.js` `karriereUrl`; `lib/api/fetchKarrierData.js` | Basis-Tausch |
| formulare | `lib/backend/forms.js` `forwardInquiry` (+ `forms/forward.js` Option `forward`); Routen `api/kontakt`, `api/beratung_anfrage`, `api/anfrage_produkt`; `commerce/handlers.js`; `api/ezarri/anfrage/handler.js`; `agent/deps.js` | Adapter-Funktion an der Aufrufstelle |
| newsletter | `lib/backend/forms.js` `newsletterPhTarget`; `api/newsletter_subscribe/route.js`; neu `lib/backend/newsletterAbmeldung.js` + `api/newsletter/abmelden-1klick/route.js` | Ziel-Tausch + neue Route |
| termin | `booking/config.js` `frappeCredentials` → Methodenbasis `ph_crm.api` (Adapter unverändert, gleiche Namen/Parameter) | Zugang/Basis |
| kundenkarte | `kundenkarte/config.js` `frappeCredentials` | Zugang |
| einblicke | `einblicke/frappe.server.js` `frappeConfig().method` | Ziel-Tausch |
| zahlung | `payments/backoffice.js` | Ziel-Tausch + idempotency_key |
| shop | neu `shop/phMirror.js` `withPhMirror`, eingebunden in `shop/webhook.js` | Spiegel neben dem lokalen Store |
| upload | neu `upload/phAdapter.js` | Adapter (Ablauf-Hook offen) |
| portal | neu `portal/adapters/ph.js`, `phTokenStore.js`; `adapters/index.js`, `dal.js` (`readFile`), `api/portal/feedback/rendering/[id]` | voller Adapter |

### 2.3 Kampagnenfelder utm_* / klick_id (Auftrag Koordinator)

- `lib/forms/attributionFields.js` ist die Grundlage. Feldnamen wie PH Anfrage: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `klick_id` (Format `gclid=… · fbclid=…`).
- Die Einwilligungsgrenze von `lib/attribution.js` bleibt unverändert. Ohne Google-Ads-Einwilligung werden **keine** utm-Werte und keine Klick-IDs gesendet.
- **Anfrageformulare** (Kontakt, Beratung, Produkt, Gutschein-Anfrage, Atelier, Adventsabend, Empfehlung):
  - Der Server liest die Felder aus dem Herkunftsblock (`fieldsFromHerkunft`). Der Block enthält utm-Werte nur mit Einwilligung.
  - Gesendet werden sie nur an ph. Das alte System bekommt den bisherigen Payload.
- **Kundenkarte, Newsletter, Termin:**
  - `forms/client.js` `withAttributionFields` hängt die Felder im Browser an, nur mit Einwilligung.
  - Die Schemas (`newsletterSchema`, `kundenkarte applicationSchema`, `booking bookSchema`) lassen die Felder durch.
  - Die ph-Adapter geben sie weiter: Newsletter `extraFields`, Termin nur bei Methodenbasis `ph_*`, Kundenkarte.
- **Offen (außerhalb des Schreibbereichs):**
  - `components/Newsletter/newsletter.js` und `components/Termin/BookingWizard.js` senden mit eigenem `fetch` statt `postForm`.
  - Beide brauchen je eine Zeile `body = withAttributionFields(url, body)`. Die Kundenkarte läuft schon über `postForm`.

### 2.4 Tests

| Datei | Tests | Inhalt |
|---|---|---|
| `tests/unit/backend-umschaltung.test.mjs` | 26 | Umschaltlogik, Zugang, Fehlercodes, jeder ph-Adapter gegen fetch-Attrappe |
| `tests/unit/backend-kampagne-abmeldung.test.mjs` | 10 | utm_*/klick_id mit/ohne Einwilligung, One-Click ph/alt |
| `tests/unit/karriere-stellen.test.mjs` | +1 Block | Stundenlohn in 4 Sprachen, `salary_unit` HOUR |
| `tests/unit/r9-p1-newsletter-backoffice.test.mjs` | angepasst | Prüft jetzt `ALT_API_SERVER` + `katalogFileServer(ALT_API_SERVER)`. Der Lesestandard selbst ist unverändert. |

Gesamtlauf `npm run test:unit` siehe Abschnitt 7. ESLint auf allen geänderten Dateien: 0.

---

## 3. Umschalt-Anleitung (Staging)

1. **Backend vorbereiten** (Admin, Staging aus M1):
   - Apps in der Reihenfolge aus PLAN §4 installieren.
   - Für `website@platzhirsch.studio` API-Key/Secret erzeugen (User → API Access).
   - In **PH Einstellungen** `api_aktiv = 1` setzen. Sonst antwortet jede Token-Methode mit 503 `unavailable`.
   - Revalidate-URL und Secret in `site_config` (`ph_website_revalidate_url`) eintragen.
2. **Website-Umgebung** (Preview/Staging-Deploy, nie lokal gegen Produktion):
   ```
   BACKEND_PH_URL=https://<staging-site>
   BACKEND_PH_TOKEN=<key>:<secret>
   BACKEND_PH_GRUPPEN=katalog,karriere        # Schritt für Schritt erweitern
   ```
3. Je Gruppe prüfen: Seiten, Formulare, Logs (`[backend]`-Warnungen, `src:"backoffice"`-Zeilen mit Endpunkt `ph_*`).
4. **Zurück** jederzeit: Gruppe aus `BACKEND_PH_GRUPPEN` nehmen (bzw. `BACKEND_ALT_GRUPPEN`) und neu deployen. Katalog-Cache: `revalidateTag("products")` bzw. die /revalidate-Routen.
5. **Livegang:** `BACKEND_PH_URL=https://backoffice.platzhirsch.studio`, `BACKEND_PH_LIVE=1`, `NODE_ENV=production`, danach `BACKEND_GENERATION=ph` mit `BACKEND_ALT_GRUPPEN` für noch nicht abgenommene Gruppen.

---

## 4. Reihenfolge für den Livegang

| Stufe | Gruppen | Voraussetzung | Prüfung |
|---|---|---|---|
| 0 | – | M1 Staging; `api_aktiv=1`; Token | `ph_core.api.health.ping` mit Token = 200 |
| 1 lesend | `katalog`, `karriere` | M2 (Marken, Kategorien, Merkmale), M3 (Produkte, Bildfreigaben „erteilt“), M5 (Stellen, Entgelt vollständig). Lücke 5.1 (Filterfelder) geschlossen, sonst zeigen die Kategoriefilter 0 Treffer | Sitemap-Pfadzahl alt vs. ph, Stichprobe 50 Produktseiten, /cmx-Bilder, Markenseiten, Karriere mit GlBG-Satz |
| 2 Formulare | `formulare`, `upload`, `einblicke` | PH Anfrage-Workflow, Mails an das Team; Duplikat-Regel; Rate-Limit (5.9) | Je Formular eine Testanfrage auf Staging, Referenz im Desk, Upload-Status |
| 3 Termin, Newsletter, Kundenkarte | `termin`, `newsletter`, `kundenkarte` | PH Terminart-Datensätze mit Keys `studio`, `video`, `vor_ort`, `planung` (Website `booking/types.js`), Verfügbarkeiten; Newsletter-Seiten bestätigen/abmelden auf der Website; Kanzlei-Freigaben | Buchen → Mail → bestätigen → absagen; DOI-Mail; One-Click aus Gmail |
| 4 Shop + Zahlung | `shop` (Spiegel), `zahlung` | ph_shop Stripe-Webhook in Frappe (zweiter Endpunkt), Rechtstexte; Testmodus Stripe | Testbestellung: create_order → attach_session → order_event bezahlt; Widerruf; Gutschein-Ereignis |
| 5 Portal | `portal` | PH Kontakt-Felder `portal_aktiv`, `portal_token_hash`, `portal_letzter_login`; `tagebuch_aktiv`/`referenz_freigabe_aktiv` erst nach Kanzlei | Login-Link, Projekte, Dokumente, Feedback, Rendering-Bild |
| 6 M6 | Shop/Zahlung lesend auf ph (Zeilen 47–49, 57) | `import_local_store` (5.5), Stripe-Backfill | Abgleich lokaler Store ↔ PH Bestellung |
| 7 M10 | alt abschalten | `allow_guest` der alten Schreibmethoden entfernen | Kein Aufruf `platzhirsch_studio.*create*` mehr im Log |

## 5. Datenmigration

Verweis auf `Backend-Import/PLAN.md` §4 (M1–M10). Was davon die Website betrifft:

- **M1** Staging-Site: Voraussetzung für jede Stufe.
- **M2/M3** Katalog: Ohne importierte, aktive und `website_sichtbar` gesetzte PH Produkte liefert ph_sortiment leere Listen. Deshalb lesen die lesenden Gruppen bei fehlendem Zugang alt, bei leerem Bestand aber nicht.
  - Vor Stufe 1 die Pfadzahl vergleichen.
  - Werte ändern sich: `name` ist der Slug, `kategories` der Key. Die Website schreibt `kategories` klein und vergleicht sonst über `path_field`, beides passt.
- **M4** Anfragen-Historie: unabhängig von der Website.
- **M5** Karriere: Die statischen Stellen der Website (`lib/karriere/stellen.js`) haben bei gleichem Slug Vorrang vor dem Backoffice.
- **M6** Shop: Bis dahin bleibt der lokale Store die Quelle, der Spiegel füllt ph_shop parallel. Danach Zeilen 47–49 und 57 umstellen.
- **M9** = dieser Bericht.
- **M10** Abschaltung alt (Betreiber).

---

## 6. Backend-Lücken je App (für die Backend-Agenten)

### ph_sortiment

Die Katalog-Lesemethoden sind gleichwertig vorhanden. Dauerhaft gelöst ist Zeile 5 erst mit Punkt 2 (Pflicht), Zeile 1 erst mit Punkt 1.

1. **Pflicht – Filterfelder in der Kartenform `_karte`** für `get_produkte_by_kategorie`, `get_produkte_by_marke_api` und `search_produkte`:
   - `subCategoryKeys: [key]` aus `kategorien_weitere`, nur Unterkategorien
   - `colorKeys: [merkmal]` aus `merkmale`, Gruppe Farbe
   - `materialKeys: [merkmal]` aus den Gruppen Material/Oberflaeche/Stoff/Leder/Holz
   - `indoor_and_outdoor`, Wert wie bisher, z. B. aus `bereich`

   Die Website (`shop/shopProducts.js`) liest diese Felder für die Filter in `/produkte/[category]`. Ohne sie zeigen die Filter überall 0 Treffer.

   Vorgeschlagene Signatur, unverändert, nur die Antwort wird ergänzt: `get_produkte_by_kategorie(kategories, limit=500) → [ {…Karte, subCategoryKeys[], colorKeys[], materialKeys[], indoor_and_outdoor} ]`.
2. **Pflicht – Detail `additional_information[0]`** mit `material` und `farbe` als Freitext, wie im alten Endpunkt. Die Website bildet beide Felder heute im Adapter aus `merkmale`. Im Backend wäre es dauerhaft richtig.
3. `website_sichtbar` einheitlich filtern in `get_all_sub_kategorien_api`, `get_kategorien_by_marke` und `get_all_farben_api`/`get_all_materialien_api`.
4. Nice-to-have: `get_produkt_modelle_3d(marke=None)` → `[{path_field, glb, usdz, massstab}]` für den AR-Viewer (Zeile 24), dazu `get_wechselkurs_einstellungen()` für den Dreiländer-Rechner (Zeile 25).
5. Nice-to-have: Kartenbild nur bei Bildfreigabe „erteilt“ (im Detail schon so).

### ph_crm

1. **PH Terminart-Datensätze** mit `key` = `studio`, `video`, `vor_ort`, `planung` (Modi, Themen `kueche, wohnen, ezarri, licht, yacht, hotel`) als Fixture oder im Installationsschritt. Ohne sie antwortet `get_freie_slots` 404.
2. `create_termin`: Die Kampagnenfelder `utm_*`/`klick_id` werden angenommen (**kwargs), aber nicht gespeichert. Felder an PH Termin ergänzen oder an die verknüpfte PH Anfrage übergeben.
3. Hinweis: `create_contact`/`create_anfrage` lesen die utm-Felder schon (Payload hat Vorrang vor dem Block). Es ist nichts zu tun.

### ph_marketing

1. Keine API-Lücke. Seiten auf der **Website** fehlen noch: `/de/newsletter/bestaetigen` (confirm_newsletter), `/de/newsletter/abmelden` (unsubscribe), `/de/adventsabend/absagen` (cancel_event_registration). Die Adventsabend-Anmeldung läuft noch über `/api/kontakt` statt `register_event`.
2. `one_click_pfad` (Standard `/api/newsletter/abmelden-1klick`) passt zur neuen Route. Die Einstellung nicht ändern, ohne die Website mitzuziehen.

### ph_shop

1. **Fehlt – Wunschliste** (PLAN Z. 18). Vorgeschlagene Signaturen, alle Token, ph_api, nach der Spezifikation in `src/lib/wunschliste/frappeAdapter.js`:
   - `create_wishlist(record)` → `{list_id, share_hash, admin_hash}`, idempotent
   - `get_wishlist_by_share(share_hash)` → öffentliche Sicht
   - `get_wishlist(list_id, admin_hash)`
   - `update_wishlist(list_id, admin_hash, record, expected_modified)` → 409 `conflict` bei Konkurrenz
   - `remove_wishlist(list_id, admin_hash)`
2. **Fehlt – `import_local_store(bestellungen[], gutscheine[], widerrufe[])`** für M6 (PLAN §4 nennt die Methode, im Code nicht vorhanden).
3. `order_paid` gibt es nicht. `order_event` deckt den Fall ab, es ist nichts zu tun.

### ph_kundenkarte

- `create_card_application`: utm_*/klick_id annehmen und speichern, z. B. an der PH Kontakt-Kontaktpunkt-Zeile von ph_marketing.

### ph_projekte

1. `portal_login_token` überschreibt den Token-Hash bei jedem Login-Wunsch. Ein Dritter, der nur die E-Mail kennt, meldet damit offene Sitzungen ab (kein Datenabfluss).
   - Vorschlag: mehrere gültige Token je Kontakt (Kindtabelle mit Ablauf), oder neuen Token erst bei Einlösung aktivieren.
2. Tagebuch: Für den Website-Adapter fehlt eine Teamliste über alle Projekte (`tagebuch_list_alle(rolle="team")`, Website `listeTagebuecher`).
3. Plannings/Change-Orders (`auftrag.py`) in der README-Tabelle ergänzen. Die Website hat dafür noch keinen Vertrag.

### ph_faktura

1. `portal_document_pdf`: `ApiFehler` aus `_kunde_pruefen` wird nicht gemappt und endet als 500. Mappen auf 404 `invalid_token` bzw. 503.
2. Die Token-Prüfung ohne `portal_aktiv`/Ablauf weicht von ph_core `portal_kontakt_pruefen` ab. Vereinheitlichen.

### ph_core

1. **Rate-Limit pro Methode und User:** Der gesamte Website-Verkehr teilt einen Eimer (120/min, Termine 30–60/min). Bei Last bekommen Besucher 429.
   - Vorschlag: Für die Rolle PH Website Integration den Schlüssel um einen Client-Hash erweitern. Die Website kann `X-PH-Client: <sha256(ip)>` senden, das ist noch nicht gebaut.
   - Alternativ ein höheres `api_rate_limit_pro_minute` nur für diese Rolle.
2. `api_aktiv` steht standardmäßig auf 0. Das ist so gewollt, gehört aber auf die Livegang-Checkliste.
3. `send_transactional` (PLAN Z. 24) ist optional. Die Website mailt über Resend.

### ph_personal

1. `utils/glbg.py` blendet „Stunde“ aus, „bis die Website ‚Stunde‘ übernimmt“. Die Website unterstützt das **jetzt** (`stellen.js` SALARY_UNIT HOUR, `texte.js` 4 Sprachen). Sperre aufheben.
2. Die Methode `create_bewerbung` ist vorhanden, auf der Website fehlt das Formular (Website-Lücke).

### ph_logistik, ph_service, ph_kassa

- ph_logistik: keine API-Lücke. Die Website ruft LetMeShip noch direkt (Website-Adapter fehlt, Zeile 56).
- ph_service: keine API-Lücke. Website-Seite `/service/reklamation` und Portal-Pflege (heute Mock) fehlen.
- ph_kassa: keine Website-Methoden. Nichts zu tun.

---

## 7. Prüfung

- `npm run test:unit` am 04.11.2026: **3046 Tests, 3021 bestanden, 0 fehlgeschlagen, 25 übersprungen**. Ausgangsstand waren 3010 Tests mit 0 Fehlern. Neu sind 36 Tests aus diesem Auftrag und Tests anderer Agenten. Angepasst wurden nur der Quelltext-Check in `r9-p1-newsletter-backoffice` und der Karriere-Block. `r5-produkt` bleibt unverändert grün, weil das Detail weiter `return fetchProduktDetail(` nutzt.
- ESLint auf allen geänderten und neuen Dateien: 0 Meldungen.
- Kein Build, kein Dev-Neustart, keine Verbindung zu einem Backoffice. Alle Tests laufen gegen fetch-Attrappen.

---

## 8. Website-Seiten (Nachtrag 04.11.2026)

Hinweis: Die im Auftrag genannten Abschnitte „Zusatzaufträge“ und „Achtung beim Umschalten“ gab es in diesem Bericht beim Lesen nicht. Grundlage waren die Abschnitte 2.3 und 6 sowie der App-Code in `Backend-Import/ph_*/ph_*/api/`.

### 8.1 Gebaut

| Seite / Stelle | Sprachen, Index | Backend ph | alt |
|---|---|---|---|
| Kampagnenfelder in `components/Newsletter/newsletter.js` und `components/Termin/BookingWizard.js` | – | `withAttributionFields(url, body)` je eine Zeile (Abschnitt 2.3). utm_*/klick_id nur mit Ads-Einwilligung | unverändert (Server gibt sie nur an ph weiter) |
| `/newsletter/bestaetigen?token=` | DE/EN/FR/IT, noindex, no-referrer | `ph_marketing.api.confirm_newsletter(token)` → bestätigt / bereits bestätigt / abgelaufen (410) / ungültig (404) | `not_available`: das alte System verschickt keine DOI-Mails. Die Seite nennt die Kontaktadresse |
| `/newsletter/abmelden?token=` bzw. ohne Token mit E-Mail-Feld | DE/EN/FR/IT, noindex, no-referrer | `ph_marketing.api.unsubscribe(token \| email)`. Mit Adresse antwortet die Seite immer gleich (keine Auskunft über den Verteiler) | Postausgang `.data/newsletter/abmeldungen` wie bei der One-Click-Route: Token nur als SHA-256, beim Formular die Adresse |
| `/adventsabend/absagen?token=` | nur DE (der Adventsabend ist deutsch, `/en|fr|it/adventsabend` → 404 im Proxy), noindex | `ph_marketing.api.cancel_event_registration(token)` → abgesagt / bereits abgesagt | Postausgang `.data/adventsabend/absagen` (nur Token-Hash) |
| `/service/reklamation` | DE/EN/FR/IT, index, follow, hreflang; Sitemap (`MULTILINGUAL_PAGES`), Footer-Spalte Service, Link auf `/pflege-service` | `ph_service.api.create_service_case(nachname, vorname, email, telefon, bestellnummer, produkt_name, art, beschreibung, sprache, lead_ref, idempotency_key)` | bestehender Anfrageweg `forwardInquiry("kontakt")` = `create_contact`. Der Text beginnt mit „Art: Reklamation“ und trägt eine Kontext-Zeile (das alte `create_contact` nimmt keine Zusatzfelder an). Steht `formulare` schon auf ph, geht es an `ph_crm.api.create_contact` |
| Bewerbungsformular auf `ueber-uns/karriere/[slug]` (#bewerbung) | DE/EN/FR/IT | nur sichtbar mit Gruppe `bewerbung` auf ph **und** Zugang: `ph_personal.api.create_bewerbung` und je PDF `attach_unterlage(referenz, dateiname, inhalt_base64, art=Lebenslauf\|Anschreiben)`. Ist die Stelle unbekannt (404, z. B. eine statische Website-Stelle), wird ein zweites Mal ohne `stelle` gesendet, mit dem Titel im Anschreiben | kein Formular. Der bisherige Weg (E-Mail-Knopf, Ansprechperson, Telefon) bleibt immer sichtbar |

- **Absende-Ziel:** `src/app/[locale]/service/senden/[art]/route.js` (POST, no-store, X-Robots-Tag noindex). Arten: `newsletter-bestaetigen`, `newsletter-abmelden`, `adventsabend-absagen`, `reklamation`, `bewerbung`.
  - Die Route liegt unter `[locale]`, weil der Schreibbereich `src/app/api` nicht umfasst. Sie läuft deshalb durch den Proxy. Der Proxy puffert höchstens 10 MB (`proxyClientMaxBodySize`).
  - Prüfungen: Herkunft (`origin.js`), Rate-Limit je IP, Größe, Honeypot und Zeitfalle (`guardForm`), Feldprüfung mit demselben Schema wie im Browser.
- **Token-Seiten** senden das Token erst nach einem Klick (Muster `/kundenkarte/bestaetigen`). Mail-Scanner lösen so nichts aus.
- **Bewerbung:** nur PDF (Dateikopf `%PDF-` wird geprüft), je Datei höchstens 4 MB. Das ist `UPLOAD_CONFIG.chunkSize`, die Grenze je Anfrage der Upload-Bibliothek unter dem 10-MB-Puffer des Proxys.
  - Datenschutz-Hinweis im Formular: Löschung sechs Monate nach einer Absage (Frist für Ansprüche nach § 15 GlBG), dazu ein Link auf `/datenschutz#bewerbungen`.
  - Die Gehaltsvorstellung steht im Anschreiben, der Starttermin in `verfuegbar_ab`.
- **Reklamation, Fotos und Videos:** nach dem Absenden über den Handy-Upload (`lazyHandoff`, Ticket Art `kontakt` mit der Referenz). Das gilt nur auf DE und nur, solange `uploadsAccepting()` gilt.
  - Heute gilt es nicht (`retentionConfirmed: false`). Die Seite nennt dann die E-Mail-Adresse mit dem Hinweis, die Referenz anzugeben.
- **Neue Gruppen** in `lib/backend/config.js`: `service` (ph_service) und `bewerbung` (ph_personal), beide schreibend. Standard ist alt. Einschalten mit z. B. `BACKEND_PH_GRUPPEN=…,service,bewerbung`. Die Link-Seiten hängen an der Gruppe `newsletter`.
- **Routen:** `lib/einblicke/routes.js` STATIC enthält die vier Seiten. In die Sitemap kommt nur `/service/reklamation`.
- **Stufe 3 (Abschnitt 4):** Die Bedingung „Newsletter-Seiten bestätigen/abmelden auf der Website“ ist erfüllt. Die Pfade passen zu den Standardwerten `bestaetigen_pfad` = `/de/newsletter/bestaetigen` und `abmelden_pfad` = `/de/newsletter/abmelden`.

### 8.2 Neue Lücken / offene Punkte

1. **ph_service, Pflicht für Fotos:** Es fehlt eine Website-Methode, die Dateien ohne Portal-Login an einen PH Servicefall hängt.
   - Vorschlag: `add_service_photo(referenz, email, foto{name, content})`, mit Prüfung Referenz + E-Mail wie `get_service_status`.
   - `create_service_case` nimmt `fotos[]` als base64 an. Die Website schickt keine, weil Videos bis 300 MB nicht durch den 10-MB-Puffer passen.
   - Der Handy-Upload legt Dateien lokal ab. Die Übertragung an den Servicefall fehlt, wie bei `ph_crm.attach_upload` (Zeile 35).
2. **ph_personal:** PH Bewerbung hat kein Feld `gehaltsvorstellung`. Heute steht der Wert im Anschreiben-Text. Ein eigenes Feld wäre auswertbar.
3. **ph_marketing / Website:** Die Adventsabend-Anmeldung läuft weiter über `/api/kontakt` statt `register_event`. Absage-Token gibt es also erst, wenn die Anmeldung umgestellt ist. Bis dahin bleibt `/adventsabend/absagen` ohne echte Links.
4. **alt-Modus, Betreiber:** Abmeldungen und Absagen landen als Dateien in `.data/newsletter/abmeldungen` und `.data/adventsabend/absagen` (Log-Zeile `[service] … vorgemerkt`). Das Team muss sie von Hand austragen.
5. **Achtung beim Umschalten:** Im alt-Modus geht eine Reklamation wie das Kontaktformular an das produktive `create_contact`. Das ist gewollt, es ist der bestehende Anfrageweg. Die Gruppe `service` erst auf ph stellen, wenn `PH Kontakt` und `PH Servicefall` auf der Ziel-Site installiert sind. Sonst antwortet die Site mit 503 `unavailable`.

### 8.3 Prüfung

- Unit: neu `tests/unit/website-service-seiten.test.mjs` mit 17 Tests (Validierung, Adapter alt/ph gegen fetch-Attrappe, Postausgang, Texte in vier Sprachen, Routen, Footer, Sitemap, Kampagnenfelder). `npm run test:unit` gesamt: **3063 Tests, 3038 bestanden, 0 fehlgeschlagen, 25 übersprungen**.
- E2E: `PW_WORKERS=1 npx playwright test tests/e2e/website-service-seiten.spec.js --project=desktop` → **10/10 bestanden**. Geprüft: vier Sprachen, noindex/index, hreflang, Klick-vor-POST, Zustände, Validierung, 375 px ohne Überlauf, axe WCAG 2.2 AA. Jeder POST wurde im Browser abgefangen, es ging nichts an ein Backend.
- ESLint auf allen neuen und geänderten Dateien: 0 Meldungen. Kein Build, kein Dev-Neustart.

---

## 8. Website-Restlücken (Backend-Agent, 04.11.2026)

Stand 04.11.2026 · Backend-Agent (ph_core, ph_crm, ph_sortiment, ph_shop, ph_kundenkarte, ph_personal, ph_marketing). Für jede Lücke aus Abschnitt 6 und jede Zeile **F** bzw. **M** in Abschnitt 1, die im Backend lag, steht unten, was umgesetzt ist und mit welcher Methode und Signatur. Alle Token-Methoden laufen über `ph_api`: Rolle PH Website Integration, `api_aktiv`, Rate-Limit, Protokoll, Fehlerbild wie 2.1.

Prüfung: `python -I tools/check.py --streng` OK · `tools/contracts.py` 0 Fehler · Unit-Tests ohne Site grün (ph_core, ph_crm, ph_sortiment, ph_shop, ph_kundenkarte, ph_personal, ph_marketing). Die Frappe-Site-Tests (`test_<dt>.py`) sind geschrieben, aber ohne Bench nicht gelaufen.

| Lücke (Zeile / Abschnitt 6) | Umgesetzt | Methode / Signatur |
|---|---|---|
| Z. 1, ph_sortiment 1: Filterfelder der Karte | `subCategoryKeys` (nur sichtbare Unterkategorien aus `kategorien_weitere`), `colorKeys` (Gruppe Farbe), `materialKeys` (Material/Oberflaeche/Stoff/Leder/Holz), `indoor_and_outdoor` (`Outdoor` bei Bereich „outdoor“ oder Welt „Outdoor“, sonst `Indoor`); Keys = `color_key`/`material_key`/`category_key` der Filterlisten; gebündelt geladen | `get_produkte_by_kategorie(kategories, limit=500)`, `get_produkte_by_marke_api(marken, limit=1000)`, `search_produkte(q, limit≤50)` → Karte + 4 Felder; Detail ebenfalls |
| Z. 5, ph_sortiment 2: Detail `additional_information[0]` | `material`/`farbe` als Freitext aus den Merkmalen (dieselbe Regel wie `mapPhProduktDetail`, der Adapter darf bleiben) | `get_produkt_by_path_field_api(path_field, lang)` |
| Z. 8/12/13/14, ph_sortiment 3: `website_sichtbar` | einheitlich gefiltert; neues Feld `website_sichtbar` (Standard 1) an PH Merkmal | `get_all_sub_kategorien_api()`, `get_kategorien_by_marke(marken)`, `get_all_farben_api()`, `get_all_materialien_api()` |
| Z. 24, ph_sortiment 4: AR-Viewer 3D | Listenmethode, guest, Cache/ETag wie der Katalog | `get_produkt_modelle_3d(marke=None)` → `[{path_field, glb, usdz, massstab, id, name, category, src, iosSrc, poster, marken}]` |
| Z. 25: Dreiländer-Rechner Einstellungen | neuer Single **PH Wechselkurs Einstellungen** (aktiv, oss_aktiv, Rückfall-Kurs EUR→CHF + Datum, Kindtabelle Posten Lieferung CH/FL/DE/AT, Verzollung CH, Eigentransport CH in Cent, freigegeben, Kundentext) | `get_wechselkurs_einstellungen()` → `{version: 1, deliveryEur{CH,FL,DE,AT}, customsFeeChf, selfTransportChf, ossActive, fallbackRate{rate,date}}` im Schema von `pricing.js configSchema` (Beträge in Einheiten); `{}` wenn nicht aktiv |
| ph_crm 1: PH Terminart `studio`, `video`, `vor_ort`, `planung` | vorhanden in `install.py`, jetzt als Daten `ph_crm/utils/terminarten.py` + Patch `v0_2.terminarten_website` (fehlende Datensätze anlegen, leere Texte aus `copy.js` nachtragen). Der Test vergleicht direkt mit `types.js` (Dauer, Puffer, vorher, Startzeiten, Wochentage, Themen, Bestätigung). Bewusst kein Fixture: ein Fixture-Sync ersetzt den Datensatz samt Berater-Tabelle | – (`get_terminarten`, `get_freie_slots` unverändert) |
| Z. 39, ph_crm 2: `create_termin` utm | Felder `utm_source, utm_medium, utm_campaign, utm_term, utm_content, klick_id` an **PH Termin**, gespeichert aus dem Payload | `create_termin(**d)` – Signatur unverändert, die Felder sind optional |
| Z. 26: Sofaplaner-Konfiguration | als Anfrage-Anhang in ph_crm (ph_projekte bleibt gesperrt): Feld `planer_konfiguration` (JSON), `planer`, `planer_link`, privater Anhang `planer_datei`, Zeile „Planer: …“ im Anliegen | `create_anfrage(**d)` / `create_contact(**d)` + `planer="sofaplaner"`, `planer_konfiguration=<planSchema v2, Objekt oder JSON-Text ≤ 64 KB>`, `planer_link=<shareUrl https *.platzhirsch.studio>`; Fehler 400 `invalid` mit `field` |
| Dreiländer-Rechner-Anfrage | wie Sofaplaner | `create_anfrage(**d)` + `planer="dreilaender"`, `planer_konfiguration={land, wert, lieferart?, …}` |
| Z. 66, ph_shop 1: Wunschliste | DocType **PH Wunschliste** (+ Positionen, Beiträge), an PH Kontakt oder anonym; gespeichert wird der ganze `model.js`-Datensatz (v1); `share_hash` = sha256(shareId), der Link selbst kommt nie ans Backend; E-Mails von Beitragenden maskiert; tägliches Aufräumen nach `laeuft_ab_am` | `create_wishlist(record)` → `{referenz, list_id, ref, share_hash, modified, bereits_vorhanden?}` (idempotent) · `get_wishlist(list_id, admin_hash=None)` → `{found, record, modified, referenz}` · `get_wishlist_by_share(share_hash)` → wie get · `update_wishlist(list_id, record, expected_modified=None, admin_hash=None)` → 409 `conflict` bei Konkurrenz, 404 `not_found` · `remove_wishlist(list_id, admin_hash=None)` → `{deleted}` |
| Z. 47–49/57, ph_shop 2: M6 `import_local_store` | idempotent über die Website-Kennung (vorhanden = übersprungen, nie überschrieben), ≤ 500 Einträge je Aufruf, Savepoint je Eintrag, keine Kundenmails, keine PH Zahlung; Schalter `PH Shop Einstellungen.import_local_store_aktiv` (Standard 0 → 403) | `import_local_store(bestellungen=[], gutschein_bestellungen=[], gutscheine=[], anzahlungen=[], widerrufe=[], probelauf=0)` → `{probelauf, angelegt{art:n}, uebersprungen{art:n}, fehler[{art,id,code,meldung}]}` |
| Z. 65, ph_kundenkarte: utm | Felder utm_*/klick_id am **PH Kundenkarte Antrag**, `klick_id` wird beim Anonymisieren geleert | `create_card_application(**d)` – Signatur unverändert, die Felder sind optional |
| Z. 67: Ideenboard | DocTypes **PH Ideenboard** (+ Karten); Name = `boardId` (`ids.js`); gespeichert werden nur `boardId`, `shareHash` und `adminHash`, keine Personendaten; Löschung 12 Monate nach der letzten Änderung | `create_ideenboard(record)` → `{record}` (idempotent; 400 `invalid`/`empty`, 409 `conflict`) · `get_ideenboard(board_id)` → `{record}` oder `{record: null}` · `get_ideenboard_by_share(share_hash oder share_id)` · `update_ideenboard(board_id, record, expected_updated_at?)` → 404/409 · `remove_ideenboard(board_id)` → `{removed}` · `sweep_ideenboards()` → `{checked, removed, orphans}` |
| Z. 67: Bewertung (`/bewerten`) | DocType **PH Bewertung**; keine Auswahl nach Sternen; Ausblenden nur aus festen Gründen und nur durch die Leitung; veröffentlicht wird nur mit Einwilligung; Name gekürzt, Kontaktdaten aus dem Text entfernt | `create_bewertung(sterne?, text?, name?, email?, anlass?, quelle?, einwilligung_veroeffentlichung?, textversion?, seite?)` → `{referenz, status, email(maskiert)}` · `get_bewertungen(limit≤100, quelle?)` → `{count, average, reviews[{id, author, rating, text, date, source, occasion, reply}]}` |
| ph_core 1: Rate-Limit | Zählung je Methode + Benutzer + **Client**: Header `X-PH-Client` (sha256 der Besucher-IP, nur für die Website-Rolle), sonst IP-Hash. Dazu eine Obergrenze je Methode und Benutzer. Gast-Methoden zählen je IP. Grenzen in PH Einstellungen: `api_rate_limit_pro_minute` (120), `api_rate_limit_gesamt_pro_minute` (2400), `api_rate_limit_gast_pro_minute` (600) | Decorator `ph_api` (unverändert) + `gast_rate_limit` an allen Katalog- und Karriere-Gastmethoden; 429 `rate_limited` |
| ph_core 2: `api_aktiv` | Standard bleibt 0. Hinweis zu Install und Livegang in `ph_core/README.md` (Staging: `deploy/staging/scripts/ph_staging.py` setzt 1, Produktion 0 bis zur Freigabe laut `deploy/CHECKLISTE-LIVEGANG.md`) | – |
| ph_core (Koordinator): mehrere Portal-Sitzungen | `portal_kontakt_pruefen` prüft zuerst **PH Portal Sitzung**: über den Hook `ph_portal_token_pruefen`, sonst rein lesend, solange der DocType existiert. Erst danach greift der Rückfall `portal_token_hash`. Damit akzeptieren ph_service und ph_kundenkarte jede aktive Sitzung | `portal_kontakt_pruefen(kontakt, kunde_token)` → Kontakt; 404 `invalid_token`, 410 `expired` |
| ph_personal 1: Stundenlohn | Im Code gab es keine Sperre mehr, nur einen veralteten Hinweis in `utils/glbg.py`. Der Hinweis ist korrigiert, ein Test sichert ab, dass Stundenlohn-Stellen veröffentlicht werden (`salary_unit` HOUR) | `karriere_data()`, `get_stellen(sprache)` (jetzt mit Gast-Rate-Limit) |
| Bewerbungsformular: Gehaltsvorstellung | Feld `gehaltsvorstellung` (Data ≤ 140, permlevel 1: nur Personal-Leitung und Geschäftsführung) an **PH Bewerbung**, wird beim Pseudonymisieren geleert | `ph_personal.api.create_bewerbung(**d)` + `gehaltsvorstellung` (optional) |
| Reklamation ohne Login: Foto nachreichen | Servicefall per Referenz + E-Mail-Hash (keine Auskunft bei Abweichung), Dateikopf-Prüfung wie im Portal-Upload, privat, ≤ 10 Dateien je Fall, nur 14 Tage nach der Meldung, Rate-Limit je Client und je Fall | `ph_service.api.add_service_photo(referenz, email, foto_base64, mime?, dateiname?, hinweis?)` → `{referenz, fotos, medientyp, datei}`; 404 `not_found`, 400 `invalid` (`field: mime`), 409 `conflict`, 410 `expired`, 429 `rate_limited` |

**Offen auf der Website** (außerhalb des Backend-Schreibbereichs):

1. **Rate-Limit:** Header `X-PH-Client: sha256(ip)` in den ph-Adaptern senden (`src/lib/backend/*`, `booking/adapters/frappe.js`, `kundenkarte/adapters/frappe.js`).
2. **Wunschliste:** `wunschliste/frappeAdapter.js` auf die fünf Methoden umstellen. Dabei shareId vor `get_wishlist_by_share` hashen und `expected_modified` aus der letzten Antwort mitschicken.
3. **Ideenboard:** Frappe-Store neben `localStore.js`, `updatedAt` als `expected_updated_at` mitschicken.
4. **Bewertungen:** Formular und Übersicht auf `/bewerten` fehlen noch.
5. **Planer:**
   - Sofaplaner `ResultPanel.js` sendet heute nicht. Im Livebetrieb `planer`, `planer_konfiguration` und `planer_link` an `/api/beratung_anfrage` mitgeben.
   - Für den Dreiländer-Rechner `planer=dreilaender` aus `withContext` übernehmen.
6. **Labs:** `ArViewer/data/source.js fetchFromFrappe` und `Dreilaender/store.server.js getConfig` an die zwei neuen Gast-Methoden anbinden.
7. **M6:** Ein Skript, das die `.data`-Sammlungen in Teilen an `import_local_store` schickt.

**Offen im Backend:**

- ph_projekte: `ph_portal_token_pruefen = ["ph_projekte.api.basis.sitzung_pruefen"]` in `hooks.py` eintragen (Schreibbereich des anderen Agenten). Bis dahin greift die lesende Prüfung in ph_core.
- Die Site-Tests müssen auf Staging laufen: `bench --site <site> run-tests --app <app>`.

---

## 9. Website-Anbindung Runde 2 (Website-Agent, 04.11.2026)

Grundlage: Abschnitt 8 „Website-Restlücken“, offene Punkte 1–7. Jeder Weg ist ein ph-Adapter neben dem bestehenden alt-Weg. Ohne Schalter verhält sich die Website exakt wie vorher. Alle Signaturen sind im App-Code nachgelesen.

| Punkt | Website | Backend-Methode | Schalter / Verhalten |
|---|---|---|---|
| 1. Rate-Limit je Besucher | `lib/backend/config.js`: `phClientHeaders`, `phClientId`, `visitorIpFrom`, `requestVisitorIp`. Eingebunden in `phCall` (alle Token-Aufrufe), `forms.js forwardInquiry`, Newsletter-Route, Termin- und Kundenkarten-Adapter (nur Methodenbasis `ph_*`) | Header `X-PH-Client` = sha256(Besucher-IP + Salz), hex (ph_core `utils/ratelimit.py`) | `BACKEND_PH_CLIENT_SALT` (nur Server). Ohne Salz kein Header. IP aus `UPLOAD_TRUSTED_IP_HEADER`, sonst letzter X-Forwarded-For-Eintrag bzw. X-Real-IP. Außerhalb eines Requests kein Header. Nie bei Gast-Methoden, beim Shop-Spiegel (Stripe-Webhook) und beim M6-Skript (`client: false`) |
| 2. Wunschliste | neu `lib/wunschliste/phAdapter.js`. Dazu `mode.js` (`phWunschlisteTarget`, `storageKind` "ph"), `service.js`, `http.js`. Hinweis bei Konflikt in `PublicItems.js`, `ManageClient.js`, `ContributionForm.js`. Text `errors.conflict` in vier Sprachen | `ph_shop.api.create_wishlist`, `get_wishlist`, `get_wishlist_by_share(share_hash=sha256(shareId))`, `update_wishlist(expected_modified)`, `remove_wishlist` | `WUNSCHLISTE_STORAGE=frappe\|ph` **und** Gruppe `wunschliste` auf ph. Fehlt der Zugang, ist die Wunschliste aus, nichts landet still lokal. Bei 409: neu laden, Änderung erneut anwenden, höchstens 3 Versuche, danach 409 mit aktuellem Stand und Hinweis |
| 3. Ideenboard | neu `lib/ideenboard/phAdapter.js`, `mode.js` (`phIdeenboardTarget`, `storageKind`), `service.js`. Die Routen `api/ideenboard/*` sind unverändert | `ph_marketing.api.create_ideenboard`, `get_ideenboard`, `get_ideenboard_by_share(share_hash)`, `update_ideenboard(expected_updated_at)`, `remove_ideenboard`. `sweep` läuft im Backend | `IDEENBOARD_STORAGE=ph` **und** Gruppe `ideenboard` auf ph |
| 4. `/bewerten` | neu `lib/bewertungen/` (`schema.js`, `backend.js`, `copy.js`), `components/Bewerten/BewertungForm.js` + `BewertungListe.js`, Route `[locale]/bewerten/senden` (Herkunft, Rate-Limit 5 je 10 min, 12 KB, Honeypot, Zeitfalle, Schema) | `ph_marketing.api.create_bewertung(sterne, text, name, email, anlass, quelle, einwilligung_veroeffentlichung, textversion, seite)`, `get_bewertungen(limit, quelle)` | Gruppe `bewertung` (neu, schreibend). Formular nur auf ph mit Zugang. Sonst zeigt die Übersicht einen Leerzustand ohne Zahlen. Keine erfundenen Bewertungen. Die Einwilligung zur Veröffentlichung ist ein eigenes Häkchen ohne Vorauswahl. Die Liste wird 300 s gecacht und ohne X-PH-Client geholt |
| 5. Planer | neu `lib/forms/planerFields.js` (Regeln aus `ph_crm/utils/planer.py`: JSON ≤ 64 KB, Tiefe ≤ 12, Link nur `https://*.platzhirsch.studio`). `beratungSchema` mit `planer`, `planer_konfiguration`, `planer_link`. Sofaplaner `ResultPanel.js` → `sofaplaner/handoff.js` → `forms/draft.js` → `BeratungClient.js`. Dreiländer: `planer=dreilaender` mit `{land, wert}` | `ph_crm.api.create_anfrage` / `create_contact` + `planer`, `planer_konfiguration`, `planer_link` | Gruppe `formulare`. alt bekommt die planer-Felder nie, der Payload ist exakt der alte. Ungültige Teile fallen weg, die Anfrage scheitert nicht an 400. Im Browser bis 16 KB, größere Pläne nur als Link |
| 6. AR-Viewer, Dreiländer | neu `lib/backend/labs.js`. Eingebunden in `Labs/ArViewer/data/source.js` und `Labs/Dreilaender/store.server.js` | Gast-GET `ph_sortiment.api.get_produkt_modelle_3d(marke)`, `get_wechselkurs_einstellungen()`. Ohne Token, ohne X-PH-Client, `revalidate` 3600 | Gruppe `katalog`. AR: ph ersetzt nur die Dateien bekannter Website-Modelle (gleiche id/path_field), alles läuft weiter durch `ArModelSchema`. Wechselkurse: `mergeConfig(DEFAULT_CONFIG, …)`. `{}`, Fehler oder eine leere Liste → heutiger Weg |
| 7. Adventsabend | neu `lib/backend/adventsabend.js`, Route `api/adventsabend/anmelden`, `adventSchema` (4 KB). `page.js` gibt `submitUrl` mit, dazu `AdventsabendForm.js` | `ph_marketing.api.register_event`. Die Bestätigung mit Absage-Link verschickt das Backend, damit funktioniert `/adventsabend/absagen` | Gruppe `formulare` auf ph **und** `ADVENTSABEND_EVENT_ID` (Name des PH Event, nur Server). Sonst exakt wie bisher über `/api/kontakt`. 409 → „ausgebucht“, 410/422 → „geschlossen“, 404 → 503 `not_configured` |
| 8. M6-Datenmigration | neu `tools/migration/m6-import.mjs` | `ph_shop.api.import_local_store(bestellungen, gutschein_bestellungen, gutscheine, anzahlungen, widerrufe, probelauf)` | Standard ist der Trockenlauf. `--wirklich` sendet, `--wirklich --probelauf` schickt `probelauf=1`. Das Ziel kommt nur aus `BACKEND_PH_URL`/`BACKEND_PH_TOKEN` über `phAccess`, der Schutz des produktiven Backoffice gilt. Stapel ≤ 500, je Stapel ein fester `idempotency_key`. Abbruch beim ersten Aufruffehler. Bericht als JSON (stdout, `--bericht`) |

**M6-Quellen:**

- Shop (`SHOP_DATA_DIR` bzw. `.data/shop`):
  - `bestellungen.json` → `bestellungen`
  - `widerrufe.json` → `widerrufe`
- Zahlungen (`PAYMENTS_DATA_DIR` bzw. `.data/payments`):
  - `orders.json` → `gutschein_bestellungen`
  - `register.json` → `gutscheine` (nur Code-Hash)
  - `deposits.json` → `anzahlungen`
  - `withdrawals.json` → `widerrufe`

Trockenlauf am 04.11.2026 gegen das lokale `.data` (nur gelesen): 81 Einträge in 1 Stapel, die Vorprüfung ist ohne Befund.

| Art | Einträge |
|---|---|
| Bestellungen | 21 |
| Gutschein-Bestellungen | 22 |
| Gutscheine | 36 |
| Anzahlungen | 0 |
| Widerrufe | 2 |

Alle Daten stammen aus Testmodus-Läufen.

**Gruppen** (`lib/backend/config.js`):

- `wunschliste` und `ideenboard` haben jetzt einen ph-Adapter. Neu ist die Gruppe `bewertung`.
- Die Gruppe wählt nur das Backend. Die Speicherschalter aus den Punkten 2 und 3 bleiben nötig.
- Neue Server-Env: `BACKEND_PH_CLIENT_SALT`, `IDEENBOARD_STORAGE`, `ADVENTSABEND_EVENT_ID`.

**Offen:**

1. **`/cmx`-Datei-Proxy:** Er liefert noch keine `.glb`/`.usdz` aus und liest vom alten Dateiserver. Die AR-Modelle aus ph laden deshalb erst nach einer Erweiterung. Sie betrifft auch alt und ist hier nicht geändert.
2. **Datenschutzerklärung:** Es fehlt ein Abschnitt „Bewertungen“. Er sollte vor dem Einschalten von `bewertung` in Produktion stehen, ebenso eine DSE-Sperre. Zusätzlich muss der Satz zur Kaufprüfung im Hinweis inhaltlich bestätigt werden.
3. **QR-Karte:** Sie sendet noch `quelle=direkt` statt `qr`.
4. **Adventsabend:** Die Route steht nicht in `ATTRIBUTION_URLS` (`forms/client.js`). Es gehen keine utm-Felder mit.
5. **Ideenboard:** Für Konflikte gibt es keinen eigenen Text, der Client zeigt den allgemeinen Fehler. Erneutes Teilen gleicht das Board wieder ab.
6. **M6:** Im Backend muss `PH Shop Einstellungen.import_local_store_aktiv` gesetzt sein, sonst antwortet es mit 403. Ob die Testmodus-Daten migriert werden, entscheidet der Inhaber.
7. **Vorlage außerhalb von `src/`:** `Marktresearch/digital/features/service-wunschliste-messages.json` hat je Sprache eine Zeile `conflict` bekommen. Die Datei ist aus `copy.js` erzeugt. Ohne die Zeile schlägt der bestehende Abgleichtest fehl.

**Prüfung:**

- **Unit, neu:** 52 Tests.

  | Datei | Tests |
  |---|---|
  | `backend-ph-client` | 6 |
  | `wunschliste-ph` | 9 |
  | `ideenboard-ph` | 5 |
  | `bewertungen` | 11 |
  | `planer-labs-advent-ph` | 15 |
  | `m6-import` | 6 |

- **Unit, angepasst:** `backend-umschaltung` (die Wunschliste hat jetzt einen ph-Adapter).
- **`npm run test:unit` gesamt:** 3115 Tests, 3089 bestanden, 0 fehlgeschlagen, 26 übersprungen.
- **E2E:** `PW_WORKERS=1 npx playwright test tests/e2e/bewerten.spec.js --project=desktop` → 3/3 bestanden. Geprüft wurden der Leerzustand, kein Formular auf alt, keine Sendung über die Absende-Route, axe WCAG 2.2 AA und 375 px Breite.
- **ESLint:** 0 Meldungen auf allen geänderten und neuen Dateien.
- Kein Build, kein Dev-Neustart, keine Verbindung zu einem Backend. Alle Tests laufen gegen fetch-Attrappen.
