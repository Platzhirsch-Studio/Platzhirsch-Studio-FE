# Wachstumsrat: Marketing-Technologie-Stack (Kürzel: martech)

**Stand:** 28.10.2026 · Gremium: Marketing-Analysten und Marketing-Tool-Entwickler · Nur gelesen, kein Code geändert, kein Formular abgeschickt.
**Grundlage:** Code-Audit (`src/components/Cookies/googleTag.js`, `cookiecomponent.js`, `src/lib/legal/services.js`, `src/lib/attribution.js`, `src/lib/analytics.js`, `src/lib/forms/{forward,leadPayload,newsletter}.js`, `src/app/api/*`, `src/lib/portal/adapters/frappe.js`), Berichte `digital/11` (CRM und Automation), `digital/10` (Performance-Marketing), `wachstumsrat/{sem,funnel,crm-wiederkauf}.md`, `23-masterkonzept.md`, `teamleiter/inhaber-entscheidungen.md`, Webrecherche vom 28.10.2026 (Quellen am Ende).
**Abgrenzung:** Die Flows und Trigger stehen in `crm-wiederkauf.md`, Lead-Scoring und Funnel in `funnel.md`, die Kontostruktur und die Offline-Conversion-Werte in `sem.md`. Dieses Dokument legt fest, **mit welchen Werkzeugen und über welche Schnittstellen** das alles läuft, was es kostet und in welcher Reihenfolge es an das Frappe-Backoffice angebunden wird.

> **Leitsatz:** Ein System führt die Daten (Frappe). Ein Werkzeug versendet (Brevo). Google misst. Looker Studio zeigt an. Jedes weitere Werkzeug muss erst zeigen, dass es Umsatz bringt.

---

## 1. Urteil zum Ist-Stand

**Note: 6/10.** Die Website-Seite ist für ein Studio dieser Größe ungewöhnlich sauber gebaut. Hinter dem Formular endet die Kette aber. Ein Lead wird heute zur E-Mail, nicht zum Datensatz mit Status, Wert und Herkunft.

| Baustein | Ist (belegt im Code) | Bewertung |
|---|---|---|
| Consent | Eigenes Banner, Dienste-Register `services.js` als einzige Quelle für Banner und Datenschutzerklärung, Consent Mode v2 mit Voreinstellung „denied“, gtag.js lädt nur mit Statistik- oder Marketing-Einwilligung, Cookies werden beim Widerruf gelöscht (`googleTag.js`) | **9/10**, rechtlich vorsichtig (Basic Mode) |
| Attribution | `attribution.js`: UTM, Referrer, Einstieg, Klick-IDs (gclid, gbraid, wbraid, fbclid, msclkid). Ohne Ads-Einwilligung bleibt alles im Speicher. Mit Einwilligung 90 Tage First- und Last-Touch. Kanalregel inklusive „KI-Suche“ | **9/10** |
| Lead-Übergabe | `leadPayload.js` hängt einen **Textblock** „Herkunft (automatisch)“ an das Freitextfeld. `lead_ref` (UUID) wird erzeugt, aber **nicht als Feld** an Frappe weitergereicht | **5/10**: Die Daten sind da, aber nicht auswertbar |
| Backoffice | Frappe v15+ mit eigener App `platzhirsch_studio`, getrennte Doctypes (`kontakt_form`, `anfrage`, `anfrage_produkt`, `newsletter_website`). **Kein ERPNext, kein Frappe CRM** (`digital/11` §1.2). Keine Pipeline, kein Status, kein Auftragswert | **3/10** |
| E-Mail | Newsletter landet als Datensatz in Frappe. Kein Versandwerkzeug, kein Double-Opt-in im Code | **2/10** |
| Messung | GA4 `G-1YCM6K57YG` aktiv. Events `generate_lead`, `sign_up`, `contact_click`, `add_to_wishlist`, Web Vitals. Ads-ID fehlt (`NEXT_PUBLIC_GOOGLE_ADS_ID` leer), Meta-Pixel und Terminbuchung „nicht eingesetzt“ | **6/10** |
| Dashboard | Keins. Umsatz pro Kanal ist heute nicht berechenbar | **1/10** |
| Bewertungen | `/bewerten`-Seite mit QR-Karte (Marketing-Ordner `qr/`). Kein automatischer Anstoß nach Lieferung | **4/10** |
| Hosting-Angabe | `services.js` „hosting“: Anbieter und Serverstandort sind noch Platzhalter | offen, P0 für die Datenschutzerklärung |

**Kern-Befund:** Für das 1-Mio-Ziel fehlt nicht die Website-Technik, sondern das **Rückgrat dahinter**: ein Lead-Datensatz mit Status und Wert, der zurück an Google und an das E-Mail-Werkzeug meldet. Ohne ihn lässt sich kein Werbe-Euro steuern, und das Nachfassen der offenen Angebote (laut `00` 50–150 T€) hängt am Gedächtnis.

---

## 2. Befunde und Chancen

### 2.1 Entscheidung CRM: Frappe CRM statt HubSpot oder Pipedrive

| Kriterium | **Frappe CRM** (auf dem vorhandenen Bench) | HubSpot Starter | Pipedrive Growth | Brevo Sales CRM | Eigene Doctypes in `platzhirsch_studio` |
|---|---|---|---|---|---|
| Lizenz/Kosten pro Monat | **0 €** (AGPL-3.0, Self-Host). Auf Frappe Cloud ab 5 $ pro Site, Nutzer unbegrenzt | Listenpreis ≈ 20 € pro Platz, Aktionspreise ab 7 $ möglich; 3 Plätze ≈ 60 €. Marketing-Kontakte kosten extra [prüfen] | 39 € pro Nutzer (jährlich); 3 Nutzer ≈ 117 € | im Brevo-Tarif enthalten, Funktionsumfang klein | 0 € Lizenz, aber 5–15 Entwicklertage |
| Doppelpflege mit Frappe | **keine** (gleiche Datenbank) | ja, Synchronisation nötig | ja | ja | keine |
| Kanban, Lead → Deal, SLA, Zuweisungsregeln | ja | ja | ja | eingeschränkt | selbst bauen |
| E-Mail im Datensatz, WhatsApp | ja (WhatsApp Business-Anbindung) | ja | ja (Add-on) | ja | selbst bauen |
| Datenstandort | eigener Server (EU, sobald der Hoster feststeht) | US-Anbieter, EU-Rechenzentrum wählbar [prüfen] | EU-Rechenzentrum wählbar [prüfen] | Frankreich | eigener Server |
| Lock-in | gering (Open Source, gleiche Daten wie Aufträge) | hoch | mittel | mittel | keiner |

**Empfehlung: Frappe CRM.** Es kostet keine Lizenz, liegt in derselben Datenbank wie Produkte und Anfragen und braucht nur einen Admin-Termin. HubSpot und Pipedrive sind bequemer im Marketing-Teil, aber bei angespannter Liquidität sind 60–120 €/Monat plus Synchronisationsaufwand für ein 3-Personen-Team nicht zu rechtfertigen. ERPNext ist für den Vertrieb **nicht** nötig. Es lohnt sich erst, wenn Angebot, Auftrag und Rechnung ins System sollen (Welle 3 laut Masterplan).

### 2.2 Entscheidung E-Mail: Brevo

| Werkzeug | Sitz | Kosten pro Monat [Drittquellen, auf brevo.com bzw. Anbieterseite prüfen] | DOI | Automationen | Transaktionsmail | Urteil |
|---|---|---|---|---|---|---|
| **Brevo** | Frankreich | Free 0 € (300 Mails/Tag), Starter ab ≈ 7–9, **Standard ab ≈ 15–18** (volle Automation, A/B-Tests). Preis steigt mit Versandvolumen | ja | ja (Standard) | ja (SMTP und API) | **Empfehlung** |
| Frappe-Newsletter (Kern) | eigener Server | 0 € | selbst bauen | kaum | ja | Übergang |
| HubSpot Marketing Starter | USA | pro Kontakt-Staffel [prüfen] | ja | ja | ja | zu teuer im Verbund |
| Mailchimp | USA | [prüfen] | ja | ja | Add-on | Drittland, nein |
| listmonk (Self-Host) | eigener Server | 0 € + Betrieb | ja | nein | ja | Team zu klein |

**Tarifwahl:** mit **Free** starten (300 Mails/Tag reichen für Bestätigungen, Willkommens-Mails und einen Newsletter an bis zu 300 Kontakte pro Tag in Tranchen). Auf **Standard** wechseln, sobald (a) mehr als 2.000 Kontakte in Automationen laufen oder (b) A/B-Tests im Newsletter starten. Erwartete Kosten im ersten Jahr: **0–25 €/Monat** [Schätzung].

### 2.3 Entscheidung Messung: Consent Mode v2 Basic beibehalten, Server-Side Tagging erst ab Stufe 3

- **Consent Mode v2 Basic** (heute gebaut): Ohne Einwilligung sendet die Seite nichts an Google. Der „Advanced“-Modus schickt auch ohne Einwilligung cookielose Pings. Ob das in Österreich ohne Einwilligung zulässig ist (§ 165 Abs. 3 TKG 2021, Art. 6 DSGVO), ist umstritten. **Bleibt Basic, bis der Anwalt anders entscheidet.** Der Preis dafür: GA4 sieht nur den Teil der Besucher, der zustimmt. Deshalb ist für das Umsatzziel **Frappe die Wahrheit**, GA4 nur ein Signal.
- **Server-Side Tagging (sGTM)** lohnt sich heute nicht. Es braucht trotzdem eine Einwilligung, kostet Betrieb und bringt bei wenigen tausend Besuchern pro Monat kaum mehr Daten. Für denselben Zweck gibt es zwei Wege für 0 €:
  1. **Serverseitige Ereignisse aus den eigenen Route Handlern** (per `after()` aus `next/server`): Bestätigungsmail an Brevo, später CRM-Status an Google. Das ist „Server-Side light“ ohne Container.
  2. **Google Tag Gateway über Cloudflare** (kostenlos laut Cloudflare-Doku), falls die DNS von `platzhirsch.studio` bei Cloudflare liegt [prüfen]. gtag.js kommt dann von der eigenen Domain, Einwilligung bleibt Pflicht. Nur mit Eintrag in `services.js` und in der Datenschutzerklärung.
- **sGTM über Stape** erst, wenn **beides** gilt: Ads-Budget ≥ 5 T€/Monat **und** Meta Conversions API läuft. Kosten: Pro 17 $/Monat, Business 83 $/Monat (jährlich). Stape nennt „European server GTM hosting“, der genaue EU-Standort ist vor Vertrag zu bestätigen. Alternative: eigener Container auf Google Cloud Run `europe-west3` (Frankfurt) für einige € pro Monat [Schätzung].
- **Zweite Analyse ohne Einwilligung?** Ein selbst gehostetes **Matomo** im cookielosen Modus könnte vollständige Besucherzahlen liefern. Ob das in AT ohne Einwilligung geht, entscheidet der Anwalt. Bis dahin **kein** zweites Tool, weil Pflege und Datenschutzerklärung mitwachsen. Matomo Cloud kostet ab ≈ 23–29 €/Monat (Drittquellen, uneinheitlich).

### 2.4 Bewertungs-Management

- **Google-Unternehmensprofil ist Kanal Nr. 1** im lokalen Suchmarkt. Die Business-Profile-API ist laut Google kostenlos. Antworten auf Bewertungen gehen auch per API, für 3 Personen reicht aber die App.
- **Kein Bezahltool** (ProvenExpert, Trustpilot) in Phase 1–2: Preise steigen laut Testberichten und die Verträge verlängern sich automatisch. Den Umsatz bringen Sterne bei Google, nicht ein zweites Siegel.
- **Automatisch anstoßen, nie filtern:** Frappe-Notification 7 Tage nach `lieferdatum` an **alle** Kunden (Google verbietet Review-Gating). Link = `/bewerten` (vorhanden), von dort weiter zu Google. Parallel eine Frappe-Aufgabe „Zufriedenheit nachfragen“ für den Berater.
- **Wöchentlicher Überblick:** Anzahl und Schnitt der Google-Bewertungen werden manuell (1 Minute) oder per API ins Lead-Ledger übernommen und im Dashboard gezeigt.

### 2.5 Chancen, die kaum Kapital brauchen

1. **Server-Script in Frappe statt Website-Umbau:** Die vier vorhandenen Doctypes bekommen ein `after_insert`-Script, das daraus einen `CRM Lead` macht und den Herkunftsblock aus dem Text in Felder zerlegt. Die Website muss dafür **gar nicht** angefasst werden. Ab Tag 1 gibt es eine Pipeline.
2. **Offline-Conversions über ein Google Sheet:** Upload von `qualified_lead`, `showroom_visit`, `purchase` per Data Manager (Google empfiehlt Enhanced Conversions for Leads statt des alten Imports). Kostet 0 € und ist laut `sem.md` die Voraussetzung, damit Gebote auf Aufträge statt auf Formulare optimieren.
3. **Ein Lead-Ledger ohne Personendaten** als Brücke Frappe → Looker Studio: nur `lead_ref`, Datum, Kanal, Segment, Land, Status und Wert. Damit ist das Dashboard datenschutzarm und für Partner zeigbar.
4. **B2B-Pipeline Hotel/Contract** im selben CRM über das Feld `pipeline` (Privat, Hotel und Gastro, Yacht, Architekt, Ezarri B2B). Ein gewonnenes Hotelprojekt zählt im 1-Mio-Ziel so viel wie 10–30 Wohnzimmer [Schätzung], es braucht deshalb eigene Stufen und eigene Kennzahlen.

---

## 3. Fertige Bausteine

### 3.1 Stack-Empfehlung (verbindlich, drei Stufen)

| Aufgabe | Stufe 1: „Rückgrat“ (ab KW 45, 0–25 €/Monat) | Stufe 2: „Steuern“ (ab Ads-Start, ≈ 25–60 €/Monat) | Stufe 3: „Skalieren“ (ab ≥ 5 T€ Ads, ≈ 60–150 €/Monat) |
|---|---|---|---|
| CRM / System of Record | **Frappe CRM** auf dem vorhandenen Bench | + Assignment Rules und SLA je Segment, Frappe-Mobile für den Außendienst | + Frappe Insights (AGPL, 0 €) für Vertriebsauswertungen |
| Lead-Eingang | vorhandene Routen → vorhandene Doctypes → Server-Script → `CRM Lead` | Routen senden `lead_ref`, `segment`, Klick-IDs als **Felder** (nur mit Ads-Einwilligung) | ein gemeinsamer Endpunkt `create_lead` für alle Quellen |
| E-Mail | **Brevo Free**: DOI für den Newsletter, Bestätigungsmail nach Anfrage, Willkommens-Flow | **Brevo Standard**: Flows aus `crm-wiederkauf.md`, Segmente per Frappe-Webhook | + SMS/WhatsApp nur mit eigener Einwilligung |
| Persönliche Mails | aus Frappe (Postfach des Beraters, IMAP/SMTP) | Vorlagen für 3/14/45 Tage (`digital/11` F3) | – |
| Consent | vorhandenes Banner, Consent Mode v2 Basic | + Eintrag „booking“, „brevo“ (nur Server, kein Tracker), ggf. „metaPixel“ | + Tag Gateway / sGTM-Eintrag |
| Web-Messung | GA4 (vorhanden), Key Events markieren | + Google-Ads-Tag mit Enhanced Conversions | + sGTM (Stape EU oder Cloud Run Frankfurt), Meta CAPI |
| Offline-Conversions | – | **Lead-Ledger (Google Sheet) → Data Manager**, wöchentlich | tägliche Übertragung per API |
| Dashboard | Looker Studio: GA4 + Search Console | + Lead-Ledger und Google Ads | + BigQuery-Export von GA4 (kostenlos im Sandbox-Rahmen [prüfen]) |
| Bewertungen | `/bewerten` + QR-Karte + manuelle Bitte | Frappe-Notification 7 Tage nach Lieferung | Antworten über die GBP-API, Bewertungszahl automatisch im Dashboard |
| Terminbuchung | Formular-Strecke (vorhanden) | Cal.com o. ä. nach Klick, Webhook → Frappe (`funnel.md` §3.4) | – |

### 3.2 Kostenvergleich pro Monat (netto, Schätzung auf Basis der Quellen)

| Posten | Empfohlener Stack | Alternative „SaaS-Komfort“ (HubSpot) | Alternative Pipedrive + Brevo |
|---|---|---|---|
| CRM | 0 € (Frappe CRM) | ≈ 60 € (3 × Starter-Listenpreis) | ≈ 117 € (3 × Growth) |
| E-Mail | 0–18 € (Brevo Free/Standard) | im Starter-Paket, Kontaktstaffel [prüfen] | 0–18 € |
| Analyse und Dashboard | 0 € (GA4, GSC, Looker Studio, Sheets) | 0 € | 0 € |
| Server-Side | 0 € (Stufe 1–2), 17–83 $ (Stufe 3) | gleich | gleich |
| Terminbuchung | 0–15 € [prüfen] | in HubSpot enthalten | in Pipedrive als Add-on [prüfen] |
| Bewertungen | 0 € | 0 € | 0 € |
| Einmalig | 2–4 Admin-Tage Frappe (Partner, je nach Satz 1–3 T€ [Schätzung]) | 3–5 Tage Einrichtung + Sync | 3–5 Tage + Sync |
| **Summe laufend** | **0–40 € (Stufe 1–2), bis ≈ 120 € (Stufe 3)** | ≈ 60–150 € + Sync-Pflege | ≈ 120–220 € + Sync-Pflege |

### 3.3 Datenfluss-Diagramm

```mermaid
flowchart LR
  subgraph Web["Website (Next.js, eigener Server)"]
    B[Besucher] -->|Einwilligung| CB[Consent-Banner<br/>cookieConsent]
    CB -->|Statistik| GT[gtag.js → GA4]
    CB -->|Marketing| AT[attribution.js<br/>ph_attr 90 T, Klick-IDs]
    F[Formulare: Kontakt, Beratung,<br/>Produkt, Küchen-/Sofaplaner,<br/>Upload, Gutschein, Atelier, Concierge-Übergabe] --> R[Route Handler<br/>guardForm + forward.js]
    AT -->|Herkunftsblock + lead_ref| R
    NL[Newsletter-Formular] --> RN[/api/newsletter_subscribe/]
  end

  subgraph BO["Frappe-Backoffice (System of Record)"]
    R -->|POST create_*| DT[(kontakt_form / anfrage /<br/>anfrage_produkt)]
    RN --> NW[(newsletter_website)]
    DT -->|Server-Script after_insert| L[CRM Lead<br/>lead_ref, segment, kanal, land]
    NW -->|Server-Script| PC[(PH Consent<br/>Zweck, Textversion, DOI)]
    L -->|Assignment Rule + SLA| BE[Berater-Aufgabe]
    L --> D[CRM Deal<br/>Termin → Angebot → Auftrag]
    D -->|Lieferdatum + 7 T| RV[Bewertungsbitte]
    D -->|Stufenwechsel| WH{{Frappe-Webhook<br/>HMAC-signiert}}
    PC --> WH
  end

  subgraph Out["Versand und Messung"]
    WH -->|Kontakt + Attribute| BR[Brevo EU<br/>DOI, Flows, Transaktion]
    BR -->|Abmeldung, Bounce| BO
    R -.->|after(): Bestätigungsmail| BR
    D -->|Apps Script täglich,<br/>ohne Personendaten| LL[(Lead-Ledger<br/>Google Sheet)]
    LL -->|Data Manager wöchentlich,<br/>gehashte E-Mail/gclid nur mit Einwilligung| GA[Google Ads]
    GT --> G4[(GA4)]
    G4 --> LS[Looker Studio]
    GA --> LS
    LL --> LS
    GSC[(Search Console)] --> LS
    RV --> GBP[Google-Unternehmensprofil]
  end
```

**Regeln im Datenfluss:**
1. Frappe ist die einzige Stelle, an der Kontakte geändert werden. Brevo bekommt nur, was Frappe schickt, und meldet nur Abmeldung und Bounce zurück.
2. Klick-IDs und gehashte E-Mails verlassen Frappe nur, wenn `consent_ads = 1` am Lead steht. Ohne Einwilligung geht nur der Kanal (z. B. „Paid“) ins Ledger.
3. Das Lead-Ledger enthält **keine** Namen, E-Mails oder Telefonnummern. Für den Upload werden E-Mails in einer **getrennten**, nur für den Inhaber freigegebenen Tabelle gehasht (SHA-256, kleingeschrieben, getrimmt).
4. Kein Brevo-Tracking-Skript und kein Chat-Widget auf der Website (Ladezeit, zusätzliche Einwilligung).

### 3.4 Integrationsplan mit dem Frappe-Backoffice

#### Phase 0 – Vorbereitung (KW 45, Inhaber + Frappe-Partner, 0,5 Tage)
- Backup der Site, Admin-Zugang zum Bench oder zu Frappe Cloud, `server_script_enabled: 1` in `site_config.json`.
- Hoster und Serverstandort festhalten und in `services.js` → „hosting“ eintragen (Code-Team, danach Datenschutzerklärung).
- Technischer Benutzer `website-api@platzhirsch.studio` mit Rolle „Website Integration“: nur `create` auf den vier Eingangs-Doctypes. Ein **zweiter** Benutzer `ledger-reader` mit nur `read` auf `CRM Deal` und nur den Ledger-Feldern (für Apps Script).
- DNS: SPF, DKIM und DMARC (zuerst `p=none`, nach 4 Wochen `p=quarantine`) für Brevo und für die Frappe-Postfächer.

#### Phase 1 – Pipeline ohne Website-Änderung (KW 45–46, Partner, 1,5 Tage)
1. `bench get-app crm && bench --site backoffice.platzhirsch.studio install-app crm` (Version passend zu Frappe v15, auf dem Dev-Backend `10.30.70.201` zuerst testen).
2. **Custom Fields auf `CRM Lead`** (gleichlautend auf `CRM Deal`, per „Fetch From“ übernommen):

| Feld | Typ | Zweck / Quelle |
|---|---|---|
| `lead_ref` | Data, unique | UUID aus `leadPayload.js` (zuerst aus dem Textblock geparst, ab Phase 3 als Feld) |
| `quelle_formular` | Select: kontakt, beratung, produkt, kuechenplaner, sofaplaner, upload, gutschein, atelier, concierge, event, telefon, showroom, radar | welches Formular |
| `pipeline` | Select: Privat, Hotel und Gastro, Yacht, Architekt, Ezarri B2B, Ezarri Privat, Outdoor | eigene Kanban-Ansicht je Pipeline |
| `segment` | Select (Schlüssel aus `sem.md` 3.9): wohnen, kueche, hotel, ezarri_privat, ezarri_b2b, outdoor_garten, yacht, produkt, kontakt | Gebote, Routing |
| `kanal`, `utm_source`, `utm_medium`, `utm_campaign`, `einstieg`, `referrer_host` | Data | aus dem Herkunftsblock |
| `herkunft_selbstauskunft` | Select (Liste aus `sem.md` 3.6) | auch für Showroom und Telefon |
| `land` | Select: AT, DE, CH, FL, andere | Dreiländer-Kennzahl |
| `gclid`, `gbraid`, `wbraid`, `msclkid`, `fbclid` | Data | **nur** befüllt, wenn `consent_ads = 1` |
| `consent_ads`, `consent_newsletter` | Check | aus Formular bzw. `PH Consent` |
| `lead_wert_geschaetzt`, `auftragswert_netto` | Currency | Pipeline-Wert und Offline-Conversion |
| `status_datum` | Datetime | Zeitpunkt des letzten Stufenwechsels (für Upload) |
| `verlustgrund` | Select: Preis, Lieferzeit, anderer Anbieter, Projekt verschoben, kein Bedarf, nicht erreicht | Monatsauswertung |
| `lieferdatum`, `pflege_kategorie`, `empfohlen_von` | Date / Select / Data | Trigger aus `crm-wiederkauf.md` D4/D6 |

3. **Deal-Status** (in Frappe CRM „Deal Statuses“): `Qualifiziert` → `Termin vereinbart` → `Termin wahrgenommen` → `Angebot gesendet` → `Verhandlung` → `Gewonnen` / `Verloren`. Wahrscheinlichkeiten für den gewichteten Pipeline-Wert: 10 / 15 / 25 / 35 / 60 / 100 / 0 % [Schätzung, nach 6 Monaten mit echten Quoten ersetzen].
4. **Server-Script „Eingang → CRM Lead“** (Typ DocType Event, `After Insert`, je Eingangs-Doctype). Logik als Pseudocode, vom Partner in Frappe-Python umzusetzen:

```python
# Server Script: DocType Event "After Insert" auf kontakt_form, anfrage, anfrage_produkt
text = doc.get("ihre_nachricht") or doc.get("bitte_beschreiben_sie_ihr_vorhaben") or doc.get("anfrage_beschreibung") or ""
herkunft = {}
if "── Herkunft (automatisch) ──" in text:
    block = text.split("── Herkunft (automatisch) ──", 1)[1]
    for teil in block.replace("\n", " · ").split(" · "):
        if ":" in teil:
            k, v = teil.split(":", 1)
            herkunft[k.strip().lower()] = v.strip()
quelle = herkunft.get("quelle", "")            # "google / cpc"
src, _, med = quelle.partition(" / ")
lead = frappe.get_doc({
    "doctype": "CRM Lead",
    "first_name": doc.get("vorname") or doc.get("name1") or "Website",
    "email": doc.get("email"), "mobile_no": doc.get("telefon"),
    "source": "Website",
    "quelle_formular": {"kontakt_form": "kontakt", "anfrage": "beratung", "anfrage_produkt": "produkt"}[doc.doctype],
    "lead_ref": herkunft.get("referenz"),
    "kanal": herkunft.get("kanal"), "utm_source": src, "utm_medium": med,
    "utm_campaign": herkunft.get("kampagne"), "einstieg": herkunft.get("einstieg"),
    "referrer_host": herkunft.get("referrer"),
})
lead.insert(ignore_permissions=True)
frappe.db.set_value(doc.doctype, doc.name, "crm_lead", lead.name)  # Rückverweis (Custom Field)
```
   Feldnamen der Eingangs-Doctypes (`vorname`, `telefon` …) vorher im Backoffice nachsehen. Dubletten: vor `insert` per `frappe.db.exists("CRM Lead", {"email": …})` prüfen und stattdessen einen Kommentar am vorhandenen Lead anlegen.
5. **Assignment Rules (Lead-Routing)**, Reihenfolge = Priorität:

| Bedingung | Zuständig | SLA Erstreaktion |
|---|---|---|
| `pipeline` in (Hotel und Gastro, Yacht, Architekt, Ezarri B2B) | Inhaber | 4 Std. werktags |
| `segment == "kueche"` oder `quelle_formular == "kuechenplaner"` | Küchenplanung | 24 Std. |
| `segment` in (ezarri_privat, outdoor_garten) | Inhaber (Koordination der Gewerke) | 24 Std. |
| `quelle_formular` in (gutschein, atelier) | Showroom/Café | 24 Std. |
| alles andere | Einrichtungsberatung, Round-Robin | 24 Std. |

   Die Rollen werden auf die Personen der Team-Seite gemappt (Inhaber legt fest). Bei SLA-Verletzung: Frappe-Notification an den Inhaber.
6. **Notifications:** neue A/B-Leads (Scoring aus `funnel.md` §3.2) sofort per E-Mail und Frappe-Push an die zuständige Person. 3/14/45-Tage-Nachfassen auf `Angebot gesendet` (`digital/11` F3, Versand über den täglichen Scheduler, nie 0-Tage-Ereignisse).
7. **Altdaten:** offene Angebote der letzten 12 Monate per Data Import als `CRM Deal` mit Status „Angebot gesendet“ anlegen (P0, damit das Nachfassen sofort startet).

**Abnahme Phase 1:** Testanfrage auf dem Dev-Backend erzeugt genau einen `CRM Lead` mit Kanal und Referenz, er ist der richtigen Person zugewiesen, die SLA-Ampel läuft.

#### Phase 2 – Brevo anbinden (KW 46–47, Code-Team + Partner, 1,5 Tage)
1. **Brevo-Konto** (EU), AVV abschließen, Absenderdomain verifizieren, Listen: `Newsletter-DE/EN/FR/IT`, `Bestandskunden`, `Architekten`, `Hotel-Gastro`, `Event-2026-11`. Attribute: `SPRACHE, LAND, SEGMENT, PIPELINE, KUNDENTYP, LIEFERDATUM, PFLEGE_KAT, MARKEN, STUFE, LEAD_REF`.
2. **Double-Opt-in (Website, Code-Team):** `src/lib/forms/newsletter.js` ruft nach erfolgreichem Frappe-Aufruf per `after()` `POST https://api.brevo.com/v3/contacts/doubleOptinConfirmation` mit `includeListIds`, `templateId` (DOI-Vorlage), `redirectionUrl` = `/{locale}/newsletter/bestaetigt`, Attributen. Umgebungsvariablen: `BREVO_API_KEY`, `BREVO_DOI_TEMPLATE_ID`, `BREVO_LIST_NEWSLETTER_{DE,EN,FR,IT}`. Kein Client-Code, 0 KB Bundle.
3. **Bestätigungsmail nach Anfrage** (Code-Team): in `inquiryHandler` (`forward.js`) nach Erfolg per `after()` `POST /v3/smtp/email` mit Vorlage je Formular und Sprache (Name und Foto der zuständigen Person kommen in Phase 3 aus Frappe; bis dahin Team-Foto). Fehler bei Brevo dürfen die Antwort an den Besucher nie verändern.
4. **Frappe → Brevo** (Partner, ohne Code): Doctype „Webhook“ auf `PH Consent` (`on_update`, Bedingung `doc.zweck == "newsletter" and doc.doi_bestaetigt_am`) und auf `CRM Deal` (`on_update`, Bedingung Statuswechsel auf „Gewonnen“ oder Feld `lieferdatum` gesetzt) → `POST https://api.brevo.com/v3/contacts` mit `updateEnabled: true`, Header `api-key`. Werbliche Listen nur, wenn ein `PH Consent` mit passendem Zweck existiert (Bestandskunden-Ausnahme § 174 Abs. 4 TKG / § 7 Abs. 3 UWG nur nach Prüfung durch den Anwalt).
5. **Brevo → Frappe:** Brevo-Webhook „unsubscribed, hardBounce, spam“ → `https://backoffice.platzhirsch.studio/api/method/platzhirsch_studio.api.brevo_event?token=…` (whitelisted, `allow_guest=True`, Token-Vergleich mit `frappe.conf.brevo_webhook_token`, setzt `widerrufen_am` am `PH Consent`).
6. **Portal-Mails:** `PORTAL_MAIL_PROVIDER=brevo` (SMTP-Relay) statt eines eigenen Mailservers, damit Magic-Links zuverlässig ankommen.

**Abnahme Phase 2:** DOI-Mail kommt an, Bestätigung erzeugt Kontakt in der richtigen Sprachliste, Abmeldung in Brevo setzt `widerrufen_am` in Frappe innerhalb von 1 Minute.

#### Phase 3 – Felder statt Textblock, Offline-Conversions (ab Ads-Start, Code-Team + Partner, 2 Tage)
1. **Website (Code-Team):** `forward.js` reicht `lead_ref`, `segment`, `quelle_formular`, `land`, `consent_ads`, `consent_newsletter` als eigene JSON-Felder weiter und, **nur mit `consent_ads`**, die Klick-IDs. Die Frappe-Methoden `create_*` bekommen die Felder explizit als Parameter (kein `**kwargs`, Allowlist bleibt). Der Textblock bleibt zusätzlich für Menschen lesbar.
2. **Gemeinsamer Endpunkt** (Partner): `platzhirsch_studio.api.create_lead(payload)` für Concierge-Übergabe, Küchen- und Sofaplaner, Upload und Event. Die alten Endpunkte bleiben bestehen.
3. **Lead-Ledger (Google Apps Script, 0 €):** täglich 06:00 `GET /api/resource/CRM Deal?fields=["lead_ref","creation","status","status_datum","segment","pipeline","kanal","utm_campaign","land","auftragswert_netto","lead_wert_geschaetzt","consent_ads"]&limit_page_length=500&filters=[["modified",">","<gestern>"]]` mit `Authorization: token <ledger-reader>` → Tabellenblatt `ledger`. Ein zweites, gesperrtes Blatt `upload` enthält nur Zeilen mit `consent_ads = 1` und die Spalten aus `sem.md` 3.6 (gclid, gbraid, wbraid, gehashte E-Mail, Conversion-Name, Zeit, Wert, Währung, Order-ID = `lead_ref`). Die E-Mail-Hashes erzeugt das Apps Script (`Utilities.computeDigest(SHA_256, …)`), Klartext wird nicht gespeichert.
4. **Google Ads Data Manager:** geplanter Upload aus dem Blatt `upload`, wöchentlich montags. Conversion-Aktionen und Werte wie in `sem.md` 3.9.
5. **Enhanced Conversions im Web-Tag** (Code-Team, `analytics.js`): `gtag("set","user_data",…)` vor dem Ads-Event, nur mit `ad_user_data = granted`. `transaction_id = lead_ref` in jedem `generate_lead`, damit Web- und Offline-Conversion zusammengeführt werden.

**Abnahme Phase 3:** Eine Testanfrage mit `?gclid=TEST` und Ads-Einwilligung erscheint am Folgetag im Ledger, ohne Einwilligung ohne Klick-ID. Der Data Manager meldet die Testzeile als „verarbeitet“.

#### Phase 4 – Skalieren (nur bei Erfolg der Phasen 1–3)
- sGTM (Stape EU oder Cloud Run Frankfurt) mit Meta Conversions API, Webhook `CRM Deal` → `/api/crm-event` (Route mit `X-Frappe-Webhook-Signature`-Prüfung, HMAC-SHA256 über den Body) für tägliche statt wöchentliche Uploads.
- Frappe Insights für Vertriebsberichte, BigQuery-Export von GA4.
- Bewertungen: GBP-API holt Anzahl und Schnitt täglich ins Ledger.

### 3.5 Dashboard-Spezifikation „1-Mio-Cockpit“ (Looker Studio, 0 €)

**Datenquellen:** GA4 (nativer Connector), Search Console, Google Ads, Google Sheet `ledger`. Zugriff: Inhaber (Bearbeiten), Team (Ansehen). Keine Personendaten im Bericht.

| Seite | Inhalt | Quelle |
|---|---|---|
| 1 Ziel | Auftragseingang Monat vs. 1 Mio. € (Balken), gewichteter Pipeline-Wert, benötigte Aufträge bis Monatsende = (Ziel − Ist) / Ø-Auftragswert der letzten 90 Tage | Ledger |
| 2 Funnel | Leads → qualifiziert → Termin wahrgenommen → Angebot → Gewonnen, je Pipeline; Quoten pro Stufe; SLA-Quote | Ledger |
| 3 Kanäle | Leads, qualifizierte Leads, Aufträge, Umsatz je Kanal und Kampagne; Kosten pro qualifiziertem Lead und ROAS (Ads-Kosten / Auftragswert) | Ledger + Ads |
| 4 Website | Sitzungen mit Einwilligung, `generate_lead` je Formular und Landingpage, `contact_click`, Planer-Starts, Top-Seiten nach Anfragen, KI-Suche als Kanal | GA4 |
| 5 Suche | Klicks und Impressionen je Seitengruppe (Stadtseiten, Marken, Ratgeber, Ezarri, Yacht, Hotel), Marken-Anteil | GSC |
| 6 Märkte | Leads und Umsatz je Land (AT/DE/CH/FL) und Segment | Ledger |
| 7 Reputation | Google-Bewertungen Anzahl und Schnitt (manuell, später API), Anteil angefragter Kunden | Ledger |

**Kennzahlenbaum zum 1-Mio-Ziel (Rechenweg, alle Werte Schätzung):** Umsatz/Monat = Aufträge × Ø-Auftragswert. Mit dem in `digital/11` angenommenen Ø von 18 T€ wären das ≈ 55 Aufträge im Monat. Bei 25 % Abschluss nach Termin bräuchte es ≈ 220 wahrgenommene Termine. Das ist mit Privatkunden allein nicht realistisch. Das Cockpit zeigt deshalb Privat und B2B (Hotel, Yacht, Architekten) getrennt: Schon 2–3 Contract-Projekte im Monat verändern die Rechnung grundlegend. Die echten Werte ersetzen diese Annahmen nach 90 Tagen.

### 3.6 Neue Einträge im Dienste-Register (Vorlage für das Code-Team, `src/lib/legal/services.js`)

| key | name | Kategorie | Banner | Anbieter | Hinweis |
|---|---|---|---|---|---|
| `brevo` | E-Mail-Versand und Newsletter | essential (Transaktion) / Einwilligung (Newsletter per DOI) | nein (kein Skript auf der Website) | Sendinblue SAS (Brevo), Paris | AVV, Datenschutzerklärung-Abschnitt „Newsletter“ |
| `frappeCrm` | Kundenverwaltung (CRM) | essential (Vertragsanbahnung) | nein | eigener Server / Hoster | unter „backoffice“ ergänzen |
| `googleSheetsLedger` | Auswertung von Anfragen ohne Personendaten, Upload an Google Ads nur mit Einwilligung | marketing | nein (Server) | Google Ireland Ltd. | DSE-Abschnitt „Google Ads“ ergänzen [Anwalt] |
| `tagGateway` | Google-Tag über eigene Domain | wie GA4/Ads | ja, unter bestehenden Schaltern | Cloudflare + Google | nur Stufe 3 |

---

## 4. Maßnahmen

| Prio | Maßnahme | Aufwand | Kosten grob | Erwarteter Umsatzeffekt (Begründung) | Wer |
|---|---|---|---|---|---|
| **P0** | Frappe CRM installieren, Custom Fields, Deal-Status, Server-Script „Eingang → CRM Lead“, Assignment Rules und SLA (Phase 1) | M | 1–2 T€ einmalig (Partner, Schätzung), 0 €/Monat | Keine Anfrage geht verloren, Reaktion < 24 Std. Laut `digital/11` +5–10 Prozentpunkte Abschlussquote, bei 40 Anfragen/Monat und Ø 18 T€ 1–3 Aufträge mehr pro Monat [Schätzung] | Partner (Frappe-Admin) + Inhaber |
| **P0** | Offene Angebote der letzten 12 Monate als Deals importieren und 3/14/45-Tage-Nachfassen aktivieren | S | 0 € | 50–150 T€ offene Angebote (`00`); schon 10 % Rückgewinnung = 5–15 T€ [Schätzung] | Inhaber + Partner |
| **P0** | Hoster/Serverstandort festlegen und in `services.js` + Datenschutzerklärung eintragen; SPF/DKIM/DMARC | S | 0 € | indirekt: Voraussetzung für Livegang und Zustellbarkeit aller Mails | Inhaber + Code-Team |
| **P1** | Brevo Free mit DOI, Bestätigungsmail nach Anfrage, Frappe ↔ Brevo-Webhooks (Phase 2) | M | 0–18 €/Monat | rechtssicherer Newsletter, Grundlage für Wiederkauf-Trigger (`crm-wiederkauf.md`: ≈ 36 T€/Jahr allein „Raum vollenden“ [Schätzung]) | Code-Team + Partner |
| **P1** | Looker-Studio-Cockpit Seiten 1–5 mit Lead-Ledger (Apps Script) | S | 0 € | Budget fließt in Kanäle mit Aufträgen statt Klicks; ohne Cockpit ist jeder Ads-Euro geraten | Code-Team / Analyst |
| **P1** | Bewertungsbitte 7 Tage nach Lieferung als Frappe-Notification (ohne Filter) | S | 0 € | mehr und frischere Google-Bewertungen stärken das lokale Ranking und die Klickrate im Maps-Pack [qualitativ, keine belastbare Zahl] | Partner |
| **P1** | Felder statt Textblock: `lead_ref`, `segment`, Consent-Flags, Klick-IDs (nur mit Einwilligung) an Frappe (Phase 3, Schritt 1–2) | M | 0 € | saubere Daten für Routing, Scoring und Offline-Conversions | Code-Team + Partner |
| **P2** | Offline-Conversions per Data Manager (`qualified_lead`, `showroom_visit`, `purchase`) + Enhanced Conversions im Web-Tag | M | 0 € | Gebote optimieren auf Termine statt Formulare; laut `sem.md` Voraussetzung für Stufe 2 der Ads-Budgets | Code-Team + Inhaber |
| **P2** | Brevo Standard und Flows aus `crm-wiederkauf.md` | S | ≈ 15–18 €/Monat | Wiederkauf und Empfehlung automatisch statt per Hand, spart 10–20 Std./Monat [Schätzung] | Inhaber |
| **P2** | Getrennte Kanban-Pipelines Hotel/Gastro, Yacht, Architekt mit eigenen Stufen (Ausschreibung, Bemusterung, Muster-Zimmer, FF&E-Angebot) | S | 0 € | ein Hotelprojekt (0,1–0,5 Mio. € laut `digital/11`) bewegt das 1-Mio-Ziel mehr als jede Kampagne | Partner + Inhaber |
| **P3** | Google Tag Gateway (Cloudflare) prüfen | S | 0 € | mehr verwertbare Ads-Signale bei Nutzern mit Einwilligung [Schätzung, Effekt klein] | Code-Team |
| **P3** | sGTM (Stape EU / Cloud Run Frankfurt) + Meta CAPI + `/api/crm-event` | L | 17–83 $/Monat + 2–3 Tage | erst ab ≥ 5 T€ Ads/Monat sinnvoll; bessere Zuordnung bei Meta | Code-Team |
| **P3** | Cookieloses Matomo (self-hosted) nach Anwaltsprüfung | M | 0 € + Betrieb | vollständige Besucherzahlen für Conversion-Raten, kein direkter Umsatz | Anwalt + Code-Team |

**Bewusst nicht empfohlen:** HubSpot oder Pipedrive neben Frappe (Doppelpflege, 60–220 €/Monat), ERPNext nur für den Vertrieb, Bezahl-Bewertungsportale, Chat-Widgets und Tracking-Skripte von Brevo/HubSpot auf der Website, Consent Mode Advanced ohne Anwaltsfreigabe.

---

## Quellen (abgerufen 28.10.2026)
- Frappe CRM, Open Source (AGPL-3.0), Frappe Cloud ab 5 $ pro Site, Kanban, SLA, Zuweisung, WhatsApp: https://frappe.io/crm
- Stape-Tarife (Free, Pro 17 $, Business 83 $, Enterprise 167 $, jährlich), Custom Loader, Cookie Keeper: https://stape.io/price
- Brevo-Preise (Drittquellen, uneinheitlich): https://www.techradar.com/pro/software-services/brevo-review · https://moosend.com/blog/brevo-pricing/ · https://www.sendx.io/blog/brevo-pricing-plans-costs-alternatives-2026 · https://chatarmin.com/en/blog/brevo-pricing · https://automationatlas.io/answers/brevo-pricing-explained-2026/
- HubSpot vs. Pipedrive, Preise 2026 (Drittquellen): https://www.softwares.com/compare/hubspot-vs-pipedrive · https://resources.rework.com/tools/crm/pipedrive-vs-hubspot · https://meetergo.com/blog/pipedrive-preise · https://gigradar.io/blog/hubspot-vs-pipedrive
- Google Ads, Enhanced Conversions for Leads und Data Manager: https://support.google.com/google-ads/answer/15713840 · Offline-Conversion-Import: https://support.google.com/google-ads/answer/2998031 · Data-Manager-API (Drittquelle): https://docs.addingwell.com/data-manager-api/conversions
- Google Tag Gateway über Cloudflare (kostenlos): https://developers.cloudflare.com/google-tag-gateway · https://www.trackingplan.com/blog/google-tag-gateway-cloudflare
- Google Business Profile API, kostenlos: https://developers.google.com/my-business/content/pricing · Antworten per API (Drittquelle): https://wiserreview.com/blog/google-business-reviews-api/
- ProvenExpert-Testbericht 2026 (Preisanstieg, Vertragsverlängerung): https://ecom-tools.de/provenexpert/
- Matomo-Preise (Drittquellen, uneinheitlich): https://frontdeskreview.com/software/web-analytics/matomo/ · https://subger.com/en/service/matomo
- Interne Grundlagen: `Marktresearch/digital/11-crm-automation.md`, `Marktresearch/digital/wachstumsrat/{sem,funnel,crm-wiederkauf}.md`, `Marktresearch/23-masterkonzept.md`
