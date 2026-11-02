# 11 – CRM & Marketing-Automation: Bauplan „Keine Anfrage geht mehr verloren“

**Stand:** 26.10.2026 · Rolle: CRM- und Automation-Experte · Grundlage: Code-Audit `src/` (nur gelesen, nichts geändert), Next.js-16.3.4-Doku in `node_modules/next/dist/docs/` (`proxy.md`, `after.md`, `route.md`), schreibgeschützte Prüfung des Backoffice (`backoffice.platzhirsch.studio`), Berichte 00, 20, 22, 23 (Abschn. 1, 4, 8.6, 9, 10, 12.3), 25, Benchmark-Abrufe (hoettges.at, reiter.design, minotti.com, theconranshop.com) und Frappe-/Brevo-Dokumentation.
**Leitsatz:** Jede Anfrage bekommt Herkunft, Besitzer, nächsten Schritt und ein Datum. Alles, was danach wiederkehrend ist (Nachfassen, Bewertung, Pflege, Saison), läuft automatisch. Das Team (ca. 5 Personen) macht nur noch die Gespräche.

> **Spielregeln (aus 23/25):** keine Händler-Behauptungen zu Minotti/Poliform in E-Mails, Vorlagen und Flows („Minotti-Ausstellung in Lochau“, nicht „offizieller Händler“). Herstellerbilder in Newslettern nur mit Freigabe. Werbe-E-Mails nur mit Einwilligung (§ 174 TKG 2021, § 7 UWG DE, Art. 3 lit. o UWG CH). Pflegeaufwand ≈ 0: **eine** Datenquelle (Frappe), **ein** Versandwerkzeug.

---

## 1. Ist-Zustand im Code und im Backoffice

### 1.1 Was heute ans Backoffice geht (Lead-Formulare)

| Formular (Client) | API-Route (Server) | Frappe-Endpunkt | Felder, die heute gesendet werden | Was fehlt |
|---|---|---|---|---|
| Produktanfrage aus der Merkliste `src/components/AnfrageFormProduct/AnfrageFormProduct.js` (Z. 130–145) | `src/app/api/anfrage_produkt/route.js` | `platzhirsch_studio…doctype.anfrage_produkt.api.create_anfrage` (Host fest im Code) | `anfrage_type` (Privat/Geschäft), Vor-/Nachname, E-Mail, Telefon, Land, Stadt, Adresse, `anfrage_beschreibung` (= Lieferadresse!), Firma, UID, `produkte` (Liste `produkte_id`) | Sprache, Seite, Herkunft (UTM/Referrer), Kundentyp (Architekt/Hotel), Wunschtermin, Freitext-Nachricht, Einwilligung Newsletter |
| Beratung (Mehrschritt) `src/components/BeratungClient/BeratungClient.js` (Z. 116–126) | `src/app/api/beratung_anfrage/route.js` | `…doctype.anfrage.api.create_anfrage` (Host fest im Code) | `bei_meiner_anfrage_geht_es_um` (Neubau/Renovierung/Anderes), `das_projekt_soll_verwirklicht_werden` (EFH/Wohnung/Gewerbe), Beschreibung, Vor-/Nachname, E-Mail, Telefon | Land/PLZ (wichtig für CH/FL/DE!), Sparte (Küche/Wohnen/Outdoor), Budgetrahmen, Zeitraum, Sprache, Herkunft, Kundentyp |
| Kontakt `src/components/Kontakt/kontakt.js` (Z. 122–126) | `src/app/api/kontakt/route.js` | `…doctype.kontakt_form.api.create_contact` (Host fest im Code) | `name`, `email_address`, `telefon` (optional), `ihre_nachricht` (ganzes `formData`) | wie oben |
| Newsletter `src/components/Newsletter/newsletter.js` | `src/app/api/newsletter_subscribe/route.js` | `${NEW_API_BASE_URL}…doctype.newsletter_website.api.subscribe_newsletter` (über `src/lib/apiBaseUrl.js`) | **nur `email`** (Honeypot `website` gut gelöst) | Sprache, Interessen, Kundentyp, Land, Quelle, Einwilligungstext/-version, **Double-Opt-in** (Erfolgstext „Sie sind jetzt angemeldet“ ⇒ offenbar kein DOI) |

**Befunde:**
1. **Keine Lead-Herkunft.** Im ganzen `src/` gibt es keine UTM-, `gclid`- oder Referrer-Erfassung (`grep utm|referrer` ⇒ nur `rel="noreferrer"`). Die KPI „Kundenherkunft CH/FL/DE“ und „Kosten pro qualifizierte Anfrage“ aus 23/12.3 sind damit heute **nicht messbar**.
2. **Durchreichen des ganzen Bodys.** Die drei Lead-Routen senden `JSON.stringify(body)` 1:1 weiter. Vorteil: Zusatzfelder kämen sofort an. Nachteil: Ein Angreifer kann beliebige Felder mitschicken (Mass-Assignment, falls die Frappe-Methode `**kwargs` annimmt). Frappes `frappe.call` filtert unbekannte Argumente normalerweise heraus, wenn die Methode keine `**kwargs` hat (`get_newargs`) – **Zusatzfelder würden dann still verworfen** [am Dev-Backend `10.30.70.201` prüfen].
3. **Fehlerdetails an den Browser.** `anfrage_produkt`, `beratung_anfrage` und `kontakt` geben `details: errorData` vom Backend an den Client zurück, ohne Timeout. Die Newsletter-Route macht es bereits richtig (minimale Codes, `AbortSignal.timeout`). Dieses Muster sollte für alle gelten.
4. **Conversion-Events vorhanden (neu, noch nicht committet):** `src/lib/analytics.js` mit `trackLead()` (`generate_lead` + `form`), `trackEvent("sign_up")` und `listenForContactClicks()` (Telefon/E-Mail/WhatsApp), eingebunden in `src/app/[locale]/client-layout.js` und den vier Formularen. Läuft nur mit Consent (Consent Mode v2, Cookie `cookieConsent` mit Schlüssel `googleAnalytics`, `src/components/Cookies/cookiecomponent.js` Z. 125–154, 218, 300). **GA4 kennt also die Anfrage, das Backoffice aber nicht die Quelle** – die beiden Welten sind nicht verbunden.
5. **Termin = Formular.** `MobileCtaBar.js` verlinkt „Termin“ auf `/beratung`, es gibt keinen Kalender (wie in 20 festgestellt).
6. **Merkliste** (`src/context/CartContext.js`) speichert in `localStorage` (`cart`) – gute Basis für „Merkliste per E-Mail senden“ und Warenkorb-Erinnerung (nur mit Einwilligung).
7. **Proxy** `src/proxy.js` (Next 16: `middleware` heißt jetzt `proxy`, läuft standardmäßig in Node.js, `proxy.md`) macht nur Locale-Routing. Er wäre technisch der Ort für serverseitige UTM-Cookies – das scheitert aber an der Einwilligungspflicht (siehe 5.2), daher **nicht** dort.

### 1.2 Backoffice (schreibgeschützt geprüft am 26.10.2026)

| Prüfung | Ergebnis | Bedeutung |
|---|---|---|
| `GET /api/method/erpnext.www.book_appointment…` | „App erpnext is not installed“ | **Kein ERPNext.** Es gibt keine Doctypes Lead, Opportunity, Quotation, Sales Order, Campaign, Appointment. Alles läuft über die eigene App `platzhirsch_studio` |
| `GET /api/method/crm.api…` | „App crm is not installed“ | **Kein Frappe CRM** |
| `/insights`, `/crm`, `/book_appointment` | 404 | keine Insights, kein Buchungsportal |
| Stacktrace im Fehler | `apps/frappe/frappe/api/v1.py` | Frappe **v15 oder neuer** ⇒ Frappe CRM ist installierbar |
| Fehlermeldungen an Gäste | vollständige Python-Tracebacks | **Sicherheitsbefund:** Developer-Mode/Tracebacks in Produktion abschalten |

Die Pipeline (Anfrage → Termin → Angebot → Auftrag) existiert im Backoffice heute **nicht als System**. Anfragen landen in drei getrennten Doctypes (`anfrage_produkt`, `anfrage`, `kontakt_form`) plus `newsletter_website`.

---

## 2. Benchmark

### 2.1 Die Besten weltweit

| Anbieter | CRM-/Bindungs-Mechanik | Was wir übernehmen |
|---|---|---|
| **RH (Restoration Hardware)** | Mitgliedsprogramm (Jahresgebühr, Rabatt), kostenlose Interior-Design-Beratung als Lead-Magnet, eigenes Trade-Programm für Architekten/Designer [aus Fachwissen; rh.com antwortete beim Abruf mit 403] | Beratung als Termin mit Kalender, Architekten-Programm mit eigenem Segment. **Kein** Rabattclub (Luxus, Preisdisziplin der Marken) |
| **Minotti** (abgerufen) | Login mit Profilen **Händler, Architekt, Presse**, die jeweils andere Bereiche freischalten (Download-Area, „My Selection“, Hi-Res-Bilder). Newsletter ohne sichtbare Profilfelder | Profil-Weiche „Privat / Architekt / Hotel / Bauträger / Presse“ in **jedem** Formular. Architekten bekommen Downloads (Datenblätter, CAD) gegen E-Mail |
| **The Conran Shop** (abgerufen) | Newsletter, „Business/Trade/Wholesale“-Bereich, Produktbewertungen, Geschenk ab Bestellwert | eigener Trade-Einstieg, Bewertungen sichtbar |
| **AmbienteDirect / Connox** | Newsletter mit Gutschein-Anreiz, Bewertungssiegel (Trusted Shops/eKomi), B2B-/Objektprogramm, Warenkorb-Erinnerung [aus Fachwissen, nicht abgerufen] | Merkliste-Erinnerung (mit Einwilligung), Bewertungsprozess. **Keinen** Rabatt-Gutschein für den Newsletter (Preisimage) |
| **Teo Jakob (CH)** | Calendly-Terminbuchung (20) | Kalender-Buchung mit Ansprechperson |

### 2.2 Regionale Wettbewerber

| Wettbewerber | Newsletter | Online-Termin | Formular mit Herkunft/Profil | Bewertungsprozess | Events digital |
|---|---|---|---|---|---|
| **Höttges** (abgerufen) | ✗ | ✗ („Termin“ = `mailto:`) | ✗ (kein Formular) | ✗ | ✗ (nur Sale-Bild) |
| **reiter design** (reiter.design, abgerufen) | ✓ (eigene Seite) | ✗ | ✗ (nur Kontakt) | ✗ | ✗ |
| Dolce Vita, Hutle (23/20) | online fast unsichtbar | ✗ | ✗ | ✗ | ✗ |
| Gamma, Fretz, Bihler (20) | teils | ✓ | einfach | ✗ | teils |

**Fazit:** In der Region hat **niemand** eine sichtbare Lead-Automation: kein Kalender mit Ansprechperson, keine Herkunftsmessung, keine Segment-Newsletter, keine systematische Bewertungsbitte. Wer hier sauber automatisiert, gewinnt nicht durch Technik-Spielerei, sondern durch **Reaktionszeit und Nachfassen** – genau dort verlieren kleine Händler die meisten Aufträge. Laut 00/5 #1 liegen allein in den offenen Angeboten der letzten 12 Monate 50–150 T€.

---

## 3. Konzept und Zielbild

```
 Website (Next.js)                       Backoffice (Frappe v15, Single Source of Truth)          Versand/Analyse
 ─────────────────                       ─────────────────────────────────────────────            ───────────────
 Formulare + Kalender ──► API-Route ──►  Lead (Frappe CRM)  ─► Deal: Termin → Angebot → Auftrag    Brevo (E-Mail-Flows)
  + Attribution (UTM, Referrer,          │  Herkunft, Land, Kundentyp, Sparte, Sprache            ◄── Webhook/Sync
    Landingpage, Selbstauskunft)         │  Besitzer (Assignment Rule), SLA 24 h                   GA4 (Measurement Protocol:
 Newsletter-DOI ───────────────────────► │  Aufgaben +3 / +14 / +45 Tage (Notification/Script)      qualify/close_convert_lead)
 Event-Anmeldung, Bewertungs-QR          │  Auftrag ► Lieferdatum ► Bewertung, Pflege, Saison      Looker Studio + Frappe-Dashboard
                                         ▲
 Projekt-Radar (geplanter Agent, wöchentlich) ── Lead-Vorschläge (Status „Radar – ungeprüft“)
```

**Grundsätze**
1. **Frappe ist das CRM.** Kein HubSpot/Pipedrive daneben (Doppelpflege, Kosten, Datenabfluss). Empfehlung: die offizielle App **Frappe CRM** auf dem bestehenden Backoffice installieren (Kanban-Pipeline, Lead→Deal, E-Mail im Datensatz, Aufgaben, SLA, Zuweisungsregeln, WhatsApp/Twilio-Anbindung). Alternative ohne neue App: eigene Doctypes in `platzhirsch_studio` erweitern – mehr Entwicklungsaufwand, weniger Komfort.
2. **Brevo ist das Versandwerkzeug** für Newsletter und Flows (EU-Anbieter, Sitz Frankreich, DOI eingebaut). Frappe schickt Kontakte und Ereignisse per Webhook dorthin. Persönliche Nachfass-Mails gehen **aus Frappe** (vom Postfach des Beraters), nicht als Newsletter.
3. **Herkunft ist Pflicht** (23/8.6): technisch erfasst (UTM, Referrer, Landingpage) **plus** Selbstauskunft „Wie sind Sie auf uns aufmerksam geworden?“. Die Selbstauskunft funktioniert auch ohne Cookie-Einwilligung und erfasst Empfehlung, Event, Architekt, Instagram – also genau die Kanäle, die UTM nicht sieht.
4. **Automatisch heißt: Aufgabe für einen Menschen**, nicht Massenmail. Bei Ø-Auftragswerten von 15–25 T€ ist der Anruf nach 3 Tagen wertvoller als jede Sequenz.

### 3.1 Pipeline-Stufen (Deal)

| Stufe | Eintritt | Pflichtfelder | Automatik |
|---|---|---|---|
| 0 Neu (Lead) | Formular, Telefon, Event, Radar | Herkunft, Land, Kundentyp, Sparte | Zuweisung nach Sparte/Land; **SLA: Erstkontakt < 24 h** (Werktag), sonst Eskalation an Inhaber |
| 1 Qualifiziert | Gespräch geführt | Budgetrahmen, Zeitraum, Entscheider | GA4-Event `qualify_lead` |
| 2 Termin vereinbart | Kalenderbuchung oder manuell | Datum, Berater | Erinnerung an Kunde 24 h vorher (Anfahrt, Café, Parken) |
| 3 Termin stattgefunden | Berater setzt Status | Notiz, Merkliste/Produkte | Danke-Mail mit Merkliste + nächstem Schritt |
| 4 Angebot gesendet | Angebotsdatum gesetzt | Angebotswert, Komplettierungsliste, Finanzierungsoption (23/8.6) | **Nachfassen +3 / +14 / +45 Tage** (siehe 4.3) |
| 5 Verhandlung | manuell | – | – |
| 6 Auftrag (gewonnen) | Anzahlung/Bestätigung | Auftragswert, Lieferdatum, Produktkategorien | GA4 `close_convert_lead` mit Wert; Lieferung startet Nach-Kauf-Flow |
| 7 Verloren / Ruhend | manuell | **Verlustgrund** (Preis, Lieferzeit, Wettbewerber, Projekt verschoben) | Ruhend: Wiedervorlage +6 Monate; Verloren: Segment „Atelierverkauf-Interesse“ |

---

## 4. Konkrete Features

Aufwand: **S** ≤ 3 Personentage, **M** 1–3 Wochen, **L** > 3 Wochen.

### F1 – Lead-Herkunft in jeder Anfrage (Attribution) ★ sofort baubar
- **Nutzen:** Erst damit lässt sich Budget steuern (Google Ads 3–8 T€/Monat ab Q1 2027 laut 23/9 „nur mit Tracking“), lassen sich Stadtseiten (`src/app/[locale]/designermoebel-*`) am Umsatz bewerten und die KPI „Kundenherkunft CH/FL/DE“ messen. Ranking-Effekt indirekt: Wir sehen, welche Seiten Anfragen bringen, und bauen dort aus.
- **Aufwand:** S (Frontend) + S (Backoffice-Felder, sobald Zugang).
- **Funktion:**
  1. Beim ersten Seitenaufruf der Sitzung liest ein Client-Modul aus `window.location.search` die Parameter `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid` sowie `document.referrer` (nur Hostname) und die Landingpage. **Nicht** `useSearchParams()` verwenden: Das zwingt in Next 16 statische Seiten bis zur nächsten Suspense-Grenze ins Client-Rendering; `window.location` im `useEffect` reicht.
  2. **Ohne Einwilligung:** Wert nur im Arbeitsspeicher halten (Modul-Variable). Das überlebt Client-Navigation im App Router, schreibt nichts aufs Gerät und braucht daher keine Einwilligung nach § 165 Abs. 3 TKG. Ein Neuladen verliert die Herkunft, die Selbstauskunft fängt das auf.
  3. **Mit Einwilligung „Statistik“** (`cookieConsent.googleAnalytics === true`): First-Touch und Last-Touch für 90 Tage in `localStorage` (`ph_attr`), dazu GA4-`client_id` aus dem `_ga`-Cookie. Mit Einwilligung „Marketing“ zusätzlich `gclid` (für den späteren Offline-Conversion-Import in Google Ads).
  4. Jedes Formular hängt `attribution` an den Payload. Die **API-Route** prüft den Wert (Allowlist, Längenbegrenzung 200 Zeichen, keine URLs außer Hostnamen) und
     - schreibt die Felder strukturiert mit (`quelle_kanal`, `quelle_utm_source` …), damit sie ankommen, sobald das Backoffice sie kennt, und
     - **hängt sie heute schon als Textblock an das Freitextfeld** (`bitte_beschreiben_sie_ihr_vorhaben`, `ihre_nachricht`, `anfrage_beschreibung`). So steht die Herkunft **ab Tag 1 ohne Backoffice-Änderung** in jeder Anfrage:
       ```
       ── Herkunft (automatisch) ──
       Kanal: google / cpc · Kampagne: minotti-lindau
       Einstieg: /de/designermoebel-lindau · Referrer: www.google.com
       Selbstauskunft: Empfehlung · Sprache: de · Gerät: mobil
       ```
  5. **Kanal-Regel** (serverseitig, eine Funktion): `gclid` ⇒ Google Ads; `utm_medium=cpc|paid` ⇒ Paid; Referrer Google/Bing/DuckDuckGo/Ecosia ohne UTM ⇒ Organisch; `chatgpt.com|perplexity.ai|copilot.microsoft.com|gemini.google.com` ⇒ **KI-Suche** (wichtig für 25/H-KI); `instagram.com|facebook.com|l.instagram.com` ⇒ Social; `utm_source=newsletter` ⇒ Newsletter; `utm_source=qr-*` ⇒ Offline/QR; sonst Verweis/Direkt.
- **Selbstauskunft** (Pflichtfeld, Dropdown): Google-Suche · Google Maps · KI-Assistent (ChatGPT o. ä.) · Instagram · Empfehlung Freund/Kunde · Architekt/Planer · Event/Café · Vorbeigefahren · Presse · Sonstiges.
- **Abhängigkeiten:** keine für Stufe 1 (Textblock). Für Stufe 2: Custom Fields im Backoffice (siehe Feldliste 4.11).
- **Dateien:** neu `src/lib/attribution.js` (Erfassung, Speicherung, Consent-Prüfung), neu `src/lib/server/leadPayload.js` (Allowlist, Kanal-Regel, Textblock), Änderung `src/app/[locale]/client-layout.js` (einmal `captureAttribution()` im vorhandenen `useEffect`), die vier Formular-Komponenten (je ein Feld + `attribution: getAttribution()`), die vier Routen unter `src/app/api/*/route.js` (Allowlist statt Body-Durchreichen, Fehlerdetails entfernen, Timeout wie in `newsletter_subscribe`).
- **Bibliotheken:** keine Client-Bibliothek (Eigenbau ≈ 80 Zeilen, < 1 KB gzip). Für die serverseitige Prüfung optional **zod 4.1.12** (MIT, nur Server ⇒ 0 KB im Client-Bundle).

### F2 – Lead-Pipeline im Backoffice (Frappe CRM) ⛔ Backoffice-Zugang
- **Nutzen:** Größter Umsatzhebel des ganzen Plans. Ohne Pipeline gibt es kein Nachfassen, keinen Pipeline-Wert (KPI 2 Mio. € bei M12) und keinen Verlustgrund. Die 50–150 T€ aus offenen Angeboten (00/5) brauchen genau diese Liste.
- **Aufwand:** M (Installation, Felder, Stufen, Zuweisung, Altdaten-Import der letzten 12 Monate aus den drei Anfrage-Doctypes).
- **Umsetzung:**
  - `bench get-app crm` + `bench --site … install-app crm` (Frappe CRM, AGPL-3.0, Release v1.x für Frappe v15). Nur Server, kein Einfluss auf das Website-Bundle.
  - Server-Script (Doc Event „After Insert“) auf `anfrage`, `anfrage_produkt`, `kontakt_form` ⇒ legt einen **CRM Lead** an und verknüpft ihn (die Website-Endpunkte bleiben unverändert). Alternativ später die API-Routen direkt auf `crm.api.…`/`frappe.client.insert` mit API-Key umstellen.
  - **Assignment Rule**: Küche ⇒ Küchenplaner; Hotel/Bauträger ⇒ Inhaber; CH/FL ⇒ Dreiländer-Verantwortlicher; Rest Round-Robin.
  - **SLA** in Frappe CRM: Erstreaktion 24 h (Mo–Sa), Ampel im Kanban.
  - Doppelte Kontakte über E-Mail/Telefon zusammenführen (Frappe CRM „Duplicate“-Prüfung + Server-Script).
- **Abhängigkeiten:** Administrator-Zugang zum Bench/Frappe Cloud, Backup vorher, `server_script_enabled` in der Site-Config.
- **Dateien Website:** keine Pflicht-Änderung.

### F3 – Automatisches Nachfassen 3 / 14 / 45 Tage ⛔ Backoffice
- **Nutzen:** Laut 23/8.6 Pflicht. In Premium-Möbeln dauert die Entscheidung Wochen. Wer sich nach 3 Tagen meldet und nach 14 Tagen mit Referenz/Finanzierung nachlegt, gewinnt gegen Händler, die nie nachfassen (Höttges hat nicht einmal ein Formular).
- **Aufwand:** S–M.
- **Regeln (Frappe „Notification“ mit Ereignis *Days After* auf `angebot_datum` bzw. tägliches Server-Script mit `scheduler_events`):**

| Tag | Kanal | Inhalt | Wer |
|---|---|---|---|
| +3 | **Aufgabe (ToDo) + Anruf** | „Ist das Angebot angekommen? Fragen zu Maßen/Stoffen?“ | Berater |
| +14 | persönliche E-Mail aus Frappe (Vorlage, editierbar) | passende Referenz (Region/Sparte), Hinweis abgesicherte Anzahlung + 0-%-Finanzierung (23/10 #1), Einladung ins Café | Berater, Vorlage automatisch vorbefüllt |
| +45 | Aufgabe + E-Mail | „Status Ihres Projekts?“ – bei Ruhepause Wiedervorlage +6 Monate, sonst Verlustgrund erfassen; Hinweis auf Ausstellungsstücke | Berater |
| Anfrage ohne Termin +2 | Aufgabe | zweiter Kontaktversuch per Telefon/WhatsApp | Berater |

  Alle Schritte stoppen automatisch, sobald die Stufe wechselt (Bedingung `doc.status == "Angebot gesendet"`). Hinweis aus der Frappe-Community: Ereignisse mit 0 Tagen feuern teils nicht; daher immer ≥ 1 Tag und Versand über den täglichen Scheduler.
- **Abhängigkeiten:** F2; Feld `angebot_datum`, `angebot_wert`; E-Mail-Konto je Berater in Frappe (IMAP/SMTP, damit Antworten im Datensatz landen).

### F4 – Online-Terminbuchung mit Ansprechperson ★ sofort baubar
- **Nutzen:** Termin ist die Stufe mit der höchsten Abschlusswahrscheinlichkeit. Regional bieten nur Gamma, Fretz, Bihler, Teo Jakob einen Kalender (20), **Höttges nicht**. Zusätzlich lässt sich der lange Samstag/Donnerstag (23/9) direkt buchbar machen.
- **Aufwand:** S (Einbindung) + S (Webhook nach Frappe, später).
- **Umsetzung:** Termintypen „Wohnen (90 min)“, „Küche (120 min)“, „Outdoor/Hotel (60 min)“, „Video-Beratung CH/FL (30 min)“. Pflichtfragen = dieselben wie im Beratungsformular (Sparte, Land, Selbstauskunft). Die Herkunft wird als versteckter Parameter (`metadata[quelle]`) übergeben. Buchungsbestätigung mit Anfahrt, Parken, Café-Hinweis. GA4-Event `book_appointment` (über `trackLead("termin")`).
- **Optionen:**

| Option | Lizenz/Kosten | Datenschutz | Bundle | Empfehlung |
|---|---|---|---|---|
| **Cal.com** mit `@calcom/embed-react` **1.5.3** | Embed MIT; Cloud-Teamplan kostenpflichtig, Self-Host AGPL-3.0 | EU-Datenregion verfügbar [vor Vertrag prüfen], AVV | ≈ 3 KB gzip Wrapper, Iframe lädt erst nach Klick | **Ja**, Webhooks nach Frappe vorhanden |
| Google Kalender „Terminplanung“ (Workspace) | in Workspace enthalten | Google als Auftragsverarbeiter (schon für GA4) | 0 KB (Link/Button) | gute Minimalvariante, falls Workspace genutzt wird |
| Calendly | proprietär | US-Anbieter | Iframe | nein (Datenexport, Preis) |

- **Abhängigkeiten:** Konto beim Anbieter, Kalender der Berater, Datenschutzerklärung ergänzen. Einbindung **nur nach Klick** („Kalender laden“, Zwei-Klick-Lösung wie `ConsentEmbed.js` für Google Maps) ⇒ keine Drittanbieter-Requests ohne Zustimmung.
- **Dateien:** `src/app/[locale]/beratung/page.js` (Tab „Termin buchen“ neben dem Formular), neu `src/components/Booking/BookingEmbed.js` (Client, `next/dynamic`), Wiederverwendung von `src/components/Cookies/ConsentEmbed.js`, `src/components/Reusable/MobileCtaBar.js` (Ziel „Termin“ direkt auf den Kalender-Tab), `src/messages/{de,en,fr,it}.json`.

### F5 – E-Mail-Marketing: Anbieterwahl, Double-Opt-in, Segmente ★ teilweise sofort
- **Ist:** Newsletter landet nur als E-Mail im Frappe-Doctype `newsletter_website`. Ein Versandwerkzeug ist im Code nicht erkennbar (kein Brevo/Mailchimp/Klaviyo im Quelltext). Vermutlich Frappe-Kern-„Newsletter“ oder manueller Versand [im Backoffice prüfen].
- **Anbietervergleich:**

| Anbieter | Sitz/Daten | Preis (Stand 2026, Drittquellen) | Stärken | Schwächen | Urteil |
|---|---|---|---|---|---|
| **Brevo** | Frankreich, EU | Free: 300 Mails/Tag; Starter ab ≈ 9 $/Monat, Standard ab ≈ 18 $/Monat (Kontaktgrenzen je Tarif uneinheitlich angegeben – vor Kauf auf brevo.com prüfen) | DOI eingebaut, Automationen (Workflows), Transaktionsmails, SMS/WhatsApp, REST-API v3 | Editor weniger edel als Klaviyo | **Empfehlung** |
| Klaviyo | USA | ab ≈ 20 $/Monat, schnell teurer | stark für Online-Shops mit Kassen-Daten | wir haben keinen Checkout; US-Transfer | nein |
| Mailchimp | USA (Intuit) | teuer bei Wachstum | bekannt | US-Transfer, Automationen nur in höheren Tarifen | nein |
| Frappe-Newsletter (Kern) | eigener Server | 0 € | keine Doppelpflege | kaum Automationen, Zustellbarkeit/Statistik schwach | nur Übergang |
| listmonk (Self-Host) | eigener Server | 0 € + Betrieb | AGPL-3.0, schnell | Betrieb, keine Flows | nein (Team zu klein) |

- **Double-Opt-in sofort (ohne Backoffice):** Die Route `src/app/api/newsletter_subscribe/route.js` ruft **zusätzlich** zu Frappe die Brevo-API `POST /v3/contacts/doubleOptinConfirmation` auf (mit `after()` aus `next/server`, damit der Nutzer nicht wartet – laut `after.md` in Route Handlers erlaubt). Brevo verschickt die Bestätigungs-Mail und speichert den Einwilligungsnachweis. Attribute: `SPRACHE`, `QUELLE`, `SEITE`, `INTERESSEN`, `KUNDENTYP`, `LAND`. Das Formular bekommt optionale Interessen-Chips (Wohnen, Küche, Outdoor, Licht, Atelierverkauf, Events) und „Ich bin: Privat / Architekt·in / Hotel / Bauträger“.
- **Segmente** (in Brevo als Listen/Attribute, Quelle später Frappe):

| Segment | Definition | Typische Inhalte |
|---|---|---|
| Bestandskunden | ≥ 1 Auftrag (Frappe) | Pflege, Neuheiten der gekauften Marke, Events, Circle/Inzahlungnahme |
| Interessenten | Lead ohne Auftrag | Referenzen, Ratgeber, Termin |
| Architekten/Planer | Kundentyp = Architekt | Neuheiten, Musterservice, „Lochauer Gespräche“, Salone-Reise (23/8.1). **Kein** Endkundenpreis-Mailing |
| Hotels/Gastro | Kundentyp = Hotel | Outdoor-Frühbucher, Wintereinlagerung, ÖHT-fähig planen, Leasing |
| Bauträger/Makler | Kundentyp = Bauträger/Makler | Musterwohnung, Käuferpakete |
| CH/FL-Kunden | Land ∈ {CH, LI} | CHF-Festpreis, Verzollung, Schweizer Begriffe („Offerte“, „Schreiner“), Versand nach CH-Feiertagen planen |
| DE-Nordufer | PLZ 88xxx/87xxx | Lindau-Seite, 5 Minuten, Samstag |
| Sprache | de/en/fr/it | Inhalte je Sprache, mindestens de + en |
| Sparte | Interesse Küche/Outdoor/Wohnen/Licht | sparteneigene Flows |

- **Abhängigkeiten:** Brevo-Konto + AVV, Absender-Domain mit SPF/DKIM/DMARC für `platzhirsch.studio` (DNS), API-Key als Umgebungsvariable (`BREVO_API_KEY`), Datenschutzerklärung `src/app/[locale]/datenschutz/page.js` ergänzen.
- **Bibliotheken:** keine (Brevo-REST per `fetch`; optional SDK `@getbrevo/brevo`, nur Server, 0 KB Client).

### F6 – Flows (Automationen) ⛔ größtenteils Backoffice-Daten
Wer was auslöst: **Brevo-Workflows** für Newsletter-Kontakte; **Frappe-Notifications/Aufgaben** für persönliche Schritte. Trigger kommen per Frappe-Webhook (Doctype „Webhook“, kein Code) an Brevo.

| Flow | Auslöser | Schritte | Sofort? |
|---|---|---|---|
| **Willkommen** | DOI bestätigt | T0: Willkommen + Showroom & Café (Bild vom eigenen Showroom, nicht Herstellerbild) · T+3: Marken & Ratgeber (Links auf Produkt-/Ratgeberseiten mit UTM) · T+10: Einladung Termin/Event · Sprache und Segment steuern Varianten | ✓ (nur Brevo) |
| **Nach Anfrage** | Lead angelegt | sofort Bestätigung mit Foto + Name der Ansprechperson, Kalender-Link, Erwartung („wir melden uns bis morgen 12 Uhr“) | ✓ teilweise (Bestätigungs-Mail über Brevo-Transaktionsmail aus der API-Route) |
| **Nach Kauf** | Auftrag „geliefert“ (Lieferdatum) | T+1 Danke + Pflegeanleitung (PDF je Material) · T+7 **Bewertungsbitte** (F7) · T+30 Zufriedenheit („Passt alles?“ – Aufgabe bei Problem) · T+365 Jahrestag + Pflegecheck | ⛔ Lieferdatum |
| **Pflege-Erinnerung** | Kategorie des Produkts + Kaufdatum | Leder/Stoff: alle 12 Monate · Outdoor: Oktober „Einwintern/Wintereinlagerung“, März „Auswintern“ · Holz/Lack: 12 Monate · mit Service-Termin-Link (Sigg, 23/8.2) | ⛔ Auftragspositionen |
| **Outdoor-Saison** | Datum (Feb/März, Okt) | Frühbucher für Privat und Hotels (160 Hotels ab 4★, 00/5 #7), Tuuci/Umbrosa/Paola Lenti; Okt: Wintereinlagerung als Service | ✓ für Newsletter-Kontakte |
| **Event-Einladung** | Event in Frappe/Brevo | Einladung · Erinnerung T-2 · Danke + Fotos T+1 · „Projekt besprechen?“ T+7. RSVP über eigene Seite | ✓ (Adventsabend 26.11.2026!) |
| **Merkliste-Erinnerung** | Merkliste per E-Mail gesendet, keine Anfrage nach 5 Tagen | einmalig „Ihre Auswahl – Termin zum Probesitzen?“ | ✓ wenn Nutzer die Merkliste aktiv an sich selbst schickt (Einwilligung im Formular) |
| **Reaktivierung** | Verloren/Ruhend ≥ 6 Monate | Atelierverkauf, neue Kollektion, Event | ⛔ |
| **Architekten-Quartal** | Segment Architekt | Neuheiten, Musterbox, Termine „Lochauer Gespräche“ | ✓ |

**Rechtliche Leitplanke:** Flows mit Werbung nur an Kontakte mit Einwilligung **oder** Bestandskunden nach § 174 Abs. 4 TKG (eigene ähnliche Produkte, Widerspruchsmöglichkeit bei Erhebung **und** in jeder Mail). Pflegehinweise und Bestätigungen sind Service, Neuheiten sind Werbung.

### F7 – Bewertungsanfrage (Google) ★ sofort baubar (manuell) / ⛔ automatisch
- **Nutzen:** 25/H3: Bewertungen entscheiden das Local Pack („Minotti in der Nähe“). Ziel 30+ bis Januar, 80 bis M12 (heute 6, letzte 2022).
- **Aufwand:** S.
- **Sofort:**
  1. Kurz-URL `platzhirsch.studio/bewerten` (Redirect auf den Google-Bewertungslink `https://g.page/r/<ID>/review` aus dem Unternehmensprofil) für QR-Karten bei Lieferung, Rechnung, Café-Tisch. Redirect über `next.config` `redirects` oder Route `src/app/bewerten/route.js` mit `utm_source=qr-lieferung` zur Messung.
  2. Einmalige Aktion an die letzten 50–100 Kunden (00/5 #9): persönliche E-Mail aus dem Postfach des Beraters, Vorlage im Anhang dieses Plans.
- **Automatisch (später):** Frappe-Notification „Days After“ = 7 auf `lieferdatum`, **ohne** Filter nach Zufriedenheit – Google verbietet selektives Anfragen („Review Gating“). Alle Kunden bekommen die Bitte; Probleme laufen parallel über den Zufriedenheits-Schritt.
- **Verboten:** Anreize für Bewertungen, Mitarbeiterbewertungen, gekaufte Bewertungen (25/3).
- **Bibliotheken:** keine. QR-Erzeugung einmalig offline.

### F8 – Projekt-Radar (geplanter Agent) ★ MVP sofort, ⛔ Lead-Anlage
- **Nutzen:** Hotels, Bauträger und Firmensitze sind die großen Aufträge (22: Pipeline-Wert der A-Leads 2,0–6,6 Mio. €). Die Liste in 22 veraltet in Wochen. Ein wöchentlicher Radar findet neue Projekte, **bevor** die Einrichtung vergeben ist.
- **Aufwand:** M.
- **Quellen (öffentlich):**
  - CH: Amtsblatt-Portal (amtsblattportal.ch, API für maschinellen Zugriff auf Publikationen, Baugesuche vieler Kantone – Abdeckung St. Gallen/Thurgau/Appenzell [prüfen]), publikationen.sg.ch, leaderdigital.ch (investSG).
  - FL: Amtsblatt Liechtenstein, Baubewilligungen der Gemeinden [prüfen].
  - AT: Gemeinde-Kundmachungen (Lochau, Bregenz, Hard, Lech …), Vorarlberger Nachrichten Immobilien/Wirtschaft, vai-Projekte, Wettbewerbe (architekturwettbewerb.at), Firmenbuch-Neueintragungen (Hotel-/Projektgesellschaften), austria.info B2B Hotel-News.
  - DE: Bauleitplanung/Gemeinderats-Sitzungen Lindau, Wasserburg, Langenargen, Friedrichshafen; Schwäbische Zeitung, hotelier.de.
  - Bezahlt (optional): TOPHOTELPROJECTS (Hotelprojekte mit Entscheidern), Baublatt/Docu Media (CH), ausschreibung.at (öffentliche Vergaben).
- **Ablauf (wöchentlich, Montag 06:00):**
  1. Geplanter Claude-Agent (Claude Code als Cloud-Routine über `/schedule`, oder lokal per Windows-Aufgabenplanung mit `claude -p` im Headless-Modus) mit einer festen Quellenliste und Suchauftrag.
  2. Extraktion je Treffer: Projekt, Ort, Typ (Hotel/Wohnbau/Büro/Gastro), Bauherr/Firma, Architekt, Phase, Zeitfenster, Bedarf (Küche/Lobby/Outdoor), Quelle-URL, Datum.
  3. Abgleich gegen bestehende Liste (Dedupe über Ort + Bauherr + Projektname) und Bewertung A/B/C nach der Logik aus 22/1.
  4. **MVP (sofort):** Ergebnis als Markdown/CSV in `Marktresearch/radar/JJJJ-KW.md` + E-Mail an den Inhaber. **Später:** Anlage als CRM-Lead mit Status „Radar – ungeprüft“ per Frappe-REST-API (API-Key eines technischen Benutzers mit Rechten nur auf „CRM Lead: create“).
  5. Mensch prüft und entscheidet. **Keine automatische Kontaktaufnahme.**
- **Recht (wichtig):**
  - Nur **Unternehmen/Projektgesellschaften** aufnehmen; Privatpersonen aus Baugesuchen (Einfamilienhäuser) **nicht** speichern (DSGVO Art. 6 Abs. 1 lit. f, Interessenabwägung dokumentieren; Art. 14 Informationspflicht beim ersten Kontakt).
  - **Keine Kalt-E-Mails**, auch nicht B2B: § 174 TKG verbietet unerbetene Werbe-E-Mails in AT auch an Unternehmen; DE § 7 UWG ebenso. Erstkontakt per Brief, Telefon (AT B2B mit Vorsicht, DE nur bei mutmaßlicher Einwilligung) oder persönlich über Architekt/Netzwerk.
  - Nutzungsbedingungen der Quellen beachten (kein Massen-Scraping von Bezahlquellen).
- **Hardware:** Die lokale NVIDIA-GPU wird hierfür **nicht** gebraucht; Recherche und Extraktion laufen über den Agenten. Optional: PDF-Amtsblätter lokal mit `pdfplumber` vorfiltern.
- **Bibliotheken (nur Agent-Umgebung, nicht Website):** Python `httpx` 0.28.1 (BSD-3), `feedparser` 6.0.11 (BSD-2), `pdfplumber` 0.11.x (MIT). Alternativ alles über die eingebauten Web-Werkzeuge des Agenten.

### F9 – Reporting-Dashboard ★ teilweise sofort
- **Nutzen:** Monatlicher Review aus 23/8.6 und KPI-Tafel 23/12.3 („qualifizierte Anfragen/Monat 40 bei M12“, „Kundenherkunft“, „Pipeline-Wert“). Ohne Zahlen keine Budgetentscheidung.
- **Aufwand:** S (GA4/Looker) + M (CRM-Dashboard).
- **Zwei Ebenen:**

| Ebene | Werkzeug | Inhalte | Sofort? |
|---|---|---|---|
| Marketing | **Looker Studio** (kostenlos) mit GA4 + Search Console | Sitzungen, `generate_lead` je Formular/Kanal/Landingpage, `contact_click` (Telefon/WhatsApp), `book_appointment`, `sign_up`, Top-Seiten nach Anfragen, KI-Suche als Kanal (benutzerdefinierte Kanalgruppe) | ✓ (GA4 läuft, Events gebaut) |
| Vertrieb | **Frappe** Dashboard-Charts/Number Cards (eingebaut), später **Frappe Insights** (AGPL-3.0) | Leads je Kanal/Land/Sparte, Reaktionszeit, Konversionsrate je Stufe, Pipeline-Wert, Auftragseingang, Verlustgründe, Umsatz je Kanal („Kosten pro Auftrag“) | ⛔ |
| Verknüpfung | **GA4 Measurement Protocol** | Frappe-Webhook bei Stufenwechsel ⇒ neue Route `src/app/api/crm-event/route.js` (mit Secret) ⇒ GA4-Events `qualify_lead`, `close_convert_lead` (mit `value`/`currency`) an die gespeicherte `client_id`. Damit sieht GA4/Google Ads, **welche Anzeige Aufträge bringt**, nicht nur Anfragen | ⛔ (F1 Stufe 2 + Webhook) |

- **Monatsbericht automatisch:** Geplanter Agent zieht am 1. jedes Monats GA4-/Frappe-Zahlen und schreibt einen einseitigen Bericht (Markdown/PDF) an den Inhaber.

### F10 – Event-Anmeldung (RSVP) ★ sofort baubar
- **Nutzen:** Der Adventsabend am 26.11.2026 (00/5 #6, 10–30 T€ + Kontakte) braucht Einladung, Anmeldung und Nachfassen. Jeder Gast wird Lead mit Herkunft „Event“.
- **Aufwand:** S.
- **Umsetzung:** Seite `src/app/[locale]/events/[slug]/page.js` (Inhalt aus `src/lib/content`), Formular Name/E-Mail/Personen/Kundentyp + Newsletter-Checkbox; Versand über die bestehende Route `kontakt` mit Betreff „Event: Adventsabend 2026“ (sofort) bzw. eigene Route mit Brevo-Liste „Event-2026-11“. Kalender-Datei (`.ics`) als Download in der Bestätigung (eigener Route Handler, keine Bibliothek nötig).
- **Abhängigkeiten:** keine für Stufe 1.

### F11 – Benötigte Backoffice-Felder (für den Admin, ein Termin)

| Doctype | Feld | Typ |
|---|---|---|
| alle drei Anfrage-Doctypes + CRM Lead | `quelle_kanal`, `quelle_selbstauskunft`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `landingpage`, `referrer_host`, `gclid`, `ga_client_id`, `sprache`, `land`, `kundentyp`, `sparte` | Data/Select |
| CRM Deal | `angebot_datum`, `angebot_wert`, `auftrag_wert`, `lieferdatum`, `verlustgrund`, `wiedervorlage` | Date/Currency/Select |
| Auftragsposition | `produkt` (Link auf Produkte New), `pflege_kategorie` (Leder, Stoff, Outdoor, Holz, Lack, Stein) | Link/Select |
| Kontakt | `newsletter_einwilligung` (Datum, Text-Version, Quelle), `bestandskunde` | Check/Date |

---

## 5. Risiken

### 5.1 Performance
- Keine neuen Client-Bibliotheken außer optional dem Cal.com-Wrapper (≈ 3 KB, Iframe nur nach Klick). Attribution < 1 KB. Brevo, zod, GA4-Measurement-Protocol laufen **nur serverseitig**.
- Kein Brevo-Tracking-Skript (Conversations/Chat, „Brevo Tracker“) auf der Website: kostet Ladezeit und Einwilligung, Nutzen gering.
- `after()` für Nebenaufrufe (Brevo, Benachrichtigung), damit Formularantworten schnell bleiben.

### 5.2 Recht
| Thema | Risiko | Maßnahme |
|---|---|---|
| Speicherung der Herkunft auf dem Gerät | § 165 Abs. 3 TKG 2021 (AT) / § 25 TDDDG (DE): `localStorage`/Cookie für Attribution ist nicht „unbedingt erforderlich“ | ohne Einwilligung nur Arbeitsspeicher + Selbstauskunft; mit Einwilligung `localStorage` 90 Tage; Cookie-Banner-Text in `src/messages/*` ergänzen |
| Newsletter | ohne DOI kein belastbarer Einwilligungsnachweis | Brevo-DOI, Einwilligungstext + Version + Zeitstempel speichern |
| Werbe-Mails an Bestandskunden | § 174 Abs. 4 TKG nur für eigene ähnliche Produkte, mit Widerspruch | Bestandskunden-Segment sauber pflegen, Abmeldelink überall |
| Projekt-Radar | DSGVO bei Privatpersonen, Kaltakquise per E-Mail verboten | nur Firmen, Interessenabwägung, Erstkontakt nicht per E-Mail |
| Bewertungen | Google-Richtlinien, UWG (Omnibus: Hinweis, ob Bewertungen geprüft sind) | alle Kunden fragen, keine Anreize |
| Auftragsverarbeiter | Brevo, Cal.com, Google | AVV abschließen, Datenschutzerklärung `src/app/[locale]/datenschutz/page.js` aktualisieren |
| Händler-Behauptung in Mails | UWG, Verhandlung mit Minotti/Poliform | Textbausteine zentral prüfen, „Minotti-Ausstellung in Lochau“ |
| Herstellerbilder in Newslettern | Urheberrecht | eigene Showroom-/Projektfotos; Herstellerbilder nur mit schriftlicher Freigabe |
| Frappe CRM AGPL-3.0 | Quellcode-Offenlegung nur bei Weitergabe/Bereitstellung an Dritte als Dienst | interne Nutzung unkritisch; eigene Änderungen am CRM vermeiden, Anpassungen per Custom Fields/Server-Script |

### 5.3 Pflege und Betrieb
- **Ein Datenmodell:** Frappe führt, Brevo folgt per Webhook. Nie Kontakte direkt in Brevo pflegen.
- Vorlagen (Nachfass-Mails, Flows) **einmal** in 4 Sprachen schreiben, danach nur saisonale Inhalte (Outdoor, Event).
- Pflegeaufwand nach Einführung geschätzt 1–2 Std./Woche (Radar prüfen, Event-Mailing). Risiko „niemand pflegt Stufen“ ⇒ SLA-Ampel + Monatsreview mit Inhaber; Stufenwechsel per Kanban-Drag (Frappe CRM) statt Formular.
- **Sicherheit Backoffice:** Tracebacks für Gäste abschalten; API-Routen auf Feld-Allowlist umstellen (F1); technischer API-Benutzer mit minimalen Rechten; Backup vor `install-app`.
- Backend-Hosts der Lead-Routen sind fest im Code (`https://backoffice.platzhirsch.studio/...`), die Newsletter-Route nutzt `NEW_API_BASE_URL`. Beim Umbau vereinheitlichen, damit Tests am Dev-Backend möglich sind.

---

## 6. Priorisierte Reihenfolge

### 6.1 Sofort baubar – ohne Backoffice-Schreibzugang (KW 44–46)

| # | Feature | Aufwand | Abhängigkeit außerhalb des Codes | Ergebnis |
|---|---|---|---|---|
| 1 | **F1 Attribution + Selbstauskunft**, Herkunft als Textblock im Freitextfeld; Routen härten (Allowlist, keine Fehlerdetails, Timeout) | S | keine | Herkunft steht ab sofort in jeder Anfrage im Backoffice |
| 2 | Formulare ergänzen: Land/PLZ + Sparte + Kundentyp im Beratungsformular, Sprache überall (ebenfalls in den Textblock) | S | keine | Segmentierung CH/FL/DE, Architekt/Hotel ab Tag 1 |
| 3 | **F10 Event-Seite Adventsabend 26.11.** mit RSVP über die Kontakt-Route | S | Termin/Text vom Inhaber | Gäste werden Leads |
| 4 | **F7 `/bewerten`-Redirect + QR-Karten** + persönliche Aktion an 50–100 Kunden | S | Google-Bewertungslink aus dem Profil | 30+ Bewertungen bis Januar |
| 5 | **F4 Terminbuchung** (Cal.com oder Google Terminplanung) mit Zwei-Klick-Einbindung | S | Konto, Kalender, AVV | echter Kalender, vor Höttges |
| 6 | **F5 Brevo-DOI** parallel zu Frappe, Interessen/Kundentyp im Newsletter, Willkommens-Flow, Outdoor-Frühbucher-Mailing | S–M | Brevo-Konto, DNS (SPF/DKIM/DMARC), AVV | rechtssicherer, segmentierter Newsletter |
| 7 | **F9 Looker-Studio-Bericht** auf GA4 + Search Console; GA4 Key Events markieren (`generate_lead`, `book_appointment`, `contact_click`) | S | GA4-/GSC-Zugang | Anfragen je Kanal/Seite monatlich |
| 8 | **F8 Projekt-Radar MVP** als geplanter Agent mit Wochenbericht in `Marktresearch/radar/` | M | Quellenliste freigeben | jede Woche neue Hotel-/Bauträger-Projekte |

### 6.2 Blockiert – braucht Backoffice-Zugang (ab Freigabe, 4–8 Wochen)

| # | Feature | Blocker | Aufwand |
|---|---|---|---|
| 9 | **F2 Frappe CRM installieren**, Anfragen per Server-Script in Leads überführen, Altdaten 12 Monate importieren, Zuweisung + SLA | Admin-Zugang, Backup | M |
| 10 | **F11 Felder** anlegen; Routen schicken Herkunft strukturiert (Textblock bleibt als Rückfall) | Admin-Zugang | S |
| 11 | **F3 Nachfassen 3/14/45** + Wiedervorlage + Verlustgrund | F2, Felder `angebot_datum` | S–M |
| 12 | Frappe-Webhooks ⇒ Brevo (Segmente aus echten Kundendaten) | F2, Brevo | S |
| 13 | **F6 Nach-Kauf-, Pflege-, Reaktivierungs-Flows** + automatische Bewertungsbitte | Lieferdatum, Auftragspositionen mit Pflegekategorie | M |
| 14 | **F9 Vertriebs-Dashboard** + GA4 Measurement Protocol (`qualify_lead`, `close_convert_lead`) + Google-Ads-Offline-Conversions | F1 Stufe 2, F2, Webhook | M |
| 15 | **F8 Radar legt Leads direkt an** | technischer API-Benutzer | S |

### 6.3 Erwarteter Effekt [Schätzung]
- Herkunft messbar ab KW 45 ⇒ Ads-Budget (ab Q1 2027) nur auf Kanäle mit Aufträgen.
- Nachfassen + Pipeline: Abschlussquote der Angebote +5–10 Prozentpunkte (Branchenerfahrung, unbelegt; nach 6 Monaten mit eigenen Zahlen prüfen). Bei 40 qualifizierten Anfragen/Monat und Ø 18 T€ ⇒ 1–3 zusätzliche Aufträge/Monat.
- Bewertungen 6 ⇒ 30+ bis Januar ⇒ Voraussetzung für Local-Pack-Plätze (25/H3).
- Radar: 2–5 neue B2B-Projekte/Monat zur Prüfung; ein gewonnenes Hotelprojekt (0,1–0,5 Mio. €) bezahlt den gesamten Plan.

---

## Anhang A – Code-Skizze Attribution (Richtwert für die Umsetzung, nicht eingebaut)

```js
// src/lib/attribution.js (Client) – ohne Einwilligung nur im Arbeitsspeicher
const KEYS = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","gbraid","wbraid","fbclid","msclkid"];
let memo = null;

function hasStatsConsent() {
  try { return JSON.parse(decodeURIComponent(document.cookie.match(/(?:^|; )cookieConsent=([^;]*)/)?.[1] || "{}")).googleAnalytics === true; }
  catch { return false; }
}

export function captureAttribution() {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(KEYS.filter((k) => p.get(k)).map((k) => [k, p.get(k).slice(0, 100)]));
  let ref = "";
  try { const h = new URL(document.referrer).hostname; if (h !== window.location.hostname) ref = h; } catch {}
  const touch = { ...params, referrer_host: ref, landingpage: window.location.pathname, ts: Date.now() };
  if (!memo) memo = { first: touch, last: touch };
  else if (Object.keys(params).length || ref) memo.last = touch;
  if (hasStatsConsent()) {
    try {
      const saved = JSON.parse(localStorage.getItem("ph_attr") || "null");
      const fresh = saved && Date.now() - saved.first.ts < 90 * 864e5 ? saved : null;
      memo = { first: fresh?.first || memo.first, last: memo.last };
      localStorage.setItem("ph_attr", JSON.stringify(memo));
    } catch {}
  }
}

export const getAttribution = () => memo;
```

Serverseitig (`src/lib/server/leadPayload.js`): Allowlist der Formularfelder je Route, `attribution` auf erlaubte Schlüssel und Länge kürzen, Kanal nach der Regel in F1 bestimmen, Textblock an das Freitextfeld anhängen.

## Anhang B – Vorlage Bewertungsbitte (persönlich, DE)

> Betreff: Wie gefällt Ihnen Ihr neues Sofa?
>
> Liebe Frau …, lieber Herr …,
> seit ein paar Wochen steht Ihr [Produkt] bei Ihnen. Wir hoffen, Sie fühlen sich darauf so wohl wie wir bei der Planung mit Ihnen.
> Wenn Sie zufrieden sind, würde uns eine kurze Bewertung auf Google sehr helfen: platzhirsch.studio/bewerten
> Und falls etwas nicht passt, antworten Sie einfach auf diese Mail – ich kümmere mich persönlich darum.
> Herzliche Grüße aus Lochau, [Name] · Platzhirsch Home Living

## Quellen
- Frappe-Notifications „Days Before/After“: [docs.frappe.io/framework/notifications](https://docs.frappe.io/framework/notifications.md), [docs.frappe.io/erpnext/notifications](https://docs.frappe.io/erpnext/notifications.md), Forum-Hinweis zu 0-Tage-Auslösern: [discuss.frappe.io](https://discuss.frappe.io/t/notification-send-alert-on-days-before-after-is-not-working/84984)
- ERPNext Email Campaign (zum Vergleich, hier nicht installiert): [docs.frappe.io/erpnext/email-campaign](https://docs.frappe.io/erpnext/email-campaign.md), [discuss.frappe.io](https://discuss.frappe.io/t/issue-with-email-campaign-scheduling-in-erpnext/133787)
- Frappe CRM (AGPL-3.0, Lead/Deal-Kanban, Integrationen): [cloud.frappe.io/marketplace/apps/crm](https://cloud.frappe.io/marketplace/apps/crm), [linuxlinks.com](https://www.linuxlinks.com/frappe-crm-modern-customer-relationship-management-system/)
- Brevo-Preise (Drittquellen, uneinheitlich): [techradar.com](https://www.techradar.com/pro/software-services/brevo-review), [emailtooltester.com](https://www.emailtooltester.com/en/reviews/brevo/pricing/), [sender.net](https://www.sender.net/reviews/brevo/pricing/)
- Amtsblattportal-API (am Beispiel ZH): [opendata.swiss](https://ckan.opendata.swiss/dataset/baugesuche-im-kanton-zurich)
- Hotelprojekt-Datenbank: [tophotelprojects.com](https://tophotelprojects.com/blog/new-hotel-projects-in-austria)
- Benchmark-Abrufe 26.10.2026: hoettges.at, reiter.design, minotti.com/en, theconranshop.com (rh.com: 403)
- Next.js 16.3.4: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`, `…/04-functions/after.md`
