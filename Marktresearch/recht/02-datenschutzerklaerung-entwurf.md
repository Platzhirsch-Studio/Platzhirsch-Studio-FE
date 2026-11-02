# 02 – Datenschutzerklärung (Entwurf) mit AVV-Liste, Verarbeitungsverzeichnis, Cookie-Banner und Schweiz-Hinweisen

> **Entwurf – vor Verwendung durch eine Rechtsanwältin/einen Rechtsanwalt prüfen lassen.**
> Dieses Dokument ist keine Rechtsberatung. Es übersetzt Normen, Behördenhinweise und den Code-Stand in einen Textvorschlag. Markierungen: **[vom Unternehmen auszufüllen]** = Fakt fehlt, **[anwaltlich prüfen]** = Rechtsfrage nicht abschließend geklärt, **[prüfen]** = Anbieterangabe vor Vertragsschluss im Originaldokument nachlesen.

**Stand:** 26.10.2026 · Rolle: Datenschutzjurist (DSGVO, österr. DSG, TKG 2021, Schweizer revDSG) · Grundlage: Code gelesen, nichts geändert: `src/components/Datenschutz/datenschutz.js`, `src/components/Cookies/cookiecomponent.js`, `ConsentEmbed.js`, `cookieItem.js`, `src/lib/analytics.js`, `src/app/api/*/route.js`, `src/messages/de.json` (Namespace `Cookies`, `newsletter`). Berichte 00, 18, 23, 26, digital/05, 06, 07, 10, 11, 14. Webquellen am Ende.

---

## 0. Kurzfassung: die 10 wichtigsten Befunde

1. **Die heutige Datenschutzerklärung ist in fünf Punkten falsch.** Sie nennt den „Privacy Shield“ (ungültig seit EuGH C-311/18, 16.07.2020), das „TKG 2003 / § 96 Abs 3“ (ersetzt durch § 165 Abs 3 TKG 2021), für GA „berechtigtes Interesse“ (falsch, das Tool fragt korrekt Einwilligung ab), eine GA-Speicherdauer von **26 Monaten** (GA4 kennt nur 2 oder 14 Monate für Ereignisdaten) und Newsletter-Felder (Geburtstag, PLZ, Interessen), die das Formular gar nicht abfragt. Das sind falsche Pflichtinformationen nach Art. 13 DSGVO, kein Schönheitsfehler.
2. **Der Banner-Text widerspricht der Technik.** `Cookies.intro` sagt, Verarbeitung erfolge „auf Grundlage eines berechtigten Interesses, dem Sie widersprechen können“. `thirdCountryNotice` stützt Drittlandtransfers pauschal auf **Art. 49 Abs 1 lit a DSGVO**. Beides passt nicht: Seit 10.07.2023 gibt es den Angemessenheitsbeschluss zum EU-US Data Privacy Framework (DPF). Art. 49 ist Ausnahme, keine Dauerlösung.
3. **Google Tag Manager ist im Banner gelistet, wird aber nicht geladen** (der Code lädt `gtag.js` direkt). Zugleich koppelt der Code die Kategorie „Funktional“ an Maps **und** GTM. Empfehlung: GTM-Eintrag streichen, solange er nicht genutzt wird.
4. **Ohne Einwilligung wird nichts geladen** (gtag erst nach GA-Consent, Maps erst nach Klick). Das ist gut und muss bei allen neuen Diensten genauso bleiben (Meta Pixel, Cal.com, Chat-Widget). **Kein „Advanced Consent Mode“** (cookielose Pings ohne Einwilligung), sonst braucht es eine neue Rechtsgrundlage und einen neuen Textabschnitt.
5. **Es fehlt ein Einwilligungsnachweis** (Art. 7 Abs 1 DSGVO). Heute liegt die Wahl nur im Cookie `cookieConsent` beim Nutzer. Für Ads/Meta empfohlen: serverseitiges Protokoll mit zufälliger ID, Zeitstempel, Banner-Version, Auswahl (ohne IP).
6. **Claude API (KI-Concierge):** Die Erstanbieter-API bietet als Inferenzregion nur `us` oder `global`, keine EU-Region [laut Claude-Doku, Abruf 26.10.2026]. Es kommt also zu einer Übermittlung in die USA (SCC im Anthropic-DPA; DPF-Zertifizierung von Anthropic **nicht verifiziert**). Wer EU-Verarbeitung will, nutzt Claude über **Amazon Bedrock mit EU-Inferenzprofil** oder Google Cloud in einer EU-Region [prüfen, welche Modelle dort verfügbar sind].
7. **Cal.com:** Die EU-Instanz `cal.eu` soll laut Drittquellen zum **01.11.2026 eingestellt** werden [prüfen bei Cal.com]. Damit ist die EU-Datenhaltung, auf die Bericht 05/14 setzen, voraussichtlich nicht mehr verfügbar. Entweder Cal.com mit US-Hosting (DPF/SCC [prüfen]) offenlegen oder einen EU-Anbieter bzw. Microsoft Bookings (falls M365 mit EU Data Boundary vorhanden) wählen.
8. **Meta Pixel = gemeinsame Verantwortlichkeit** für Erhebung und Übermittlung (EuGH C-40/17 *Fashion ID*). Pflicht: Vereinbarung nach Art. 26 DSGVO (Meta „Controller Addendum“) und deren wesentlicher Inhalt in der Datenschutzerklärung. CAPI (serverseitig) nur mit derselben Einwilligung wie der Pixel.
9. **Fünf Verarbeitungen brauchen eine Datenschutz-Folgenabschätzung oder zumindest eine dokumentierte Schwellwertprüfung:** KI-Raumplaner (Wohnungsfotos), KI-Concierge, Meta/Google Ads mit Abgleich gehashter Kundendaten, Videoberatung mit Blick in Privaträume, Event-Fotografie. [anwaltlich prüfen anhand DSFA-V, BGBl II 278/2018]
10. **Verantwortlicher wechselt bald** (Ausgliederung in die Handels-GmbH). Alle Texte, AVV und Einwilligungen hängen am Rechtsträger. Bestehende Newsletter-Einwilligungen gelten gegenüber der MW Immobilienverwaltungs GmbH. Ob sie mit der Ausgliederung (Gesamtrechtsnachfolge nach Spaltungsgesetz) übergehen oder neu eingeholt werden müssen, ist **[anwaltlich prüfen]**.

---

## 1. Ist-Analyse: bestehende Datenschutzerklärung und Cookie-Banner

### 1.1 Datenschutzerklärung (`src/components/Datenschutz/datenschutz.js`)

| # | Stelle (Text heute) | Problem | Norm | Korrektur |
|---|---|---|---|---|
| D1 | „(DSGVO, TKG 2003)“, „§ 96 Abs 3 TKG“ | TKG 2003 außer Kraft seit 01.11.2021 | § 165 Abs 3 TKG 2021 | ersetzen |
| D2 | „Angemessenheitsbeschluss … (Privacy Shield)“ | Beschluss 2016/1250 vom EuGH aufgehoben | EuGH C-311/18; Art. 45 DSGVO | DPF (Durchführungsbeschluss (EU) 2023/1795) + Einwilligung |
| D3 | GA auf „Art 6 Abs 1 lit a und/oder f“ | berechtigtes Interesse trägt Analyse-Cookies nicht; Tool fragt Einwilligung | § 165 Abs 3 TKG 2021; Art. 6 Abs 1 lit a DSGVO; DSB-Entscheidung 2022 zu GA | nur lit a |
| D4 | „verhindern, indem Sie Ihren Browser so einrichten …“ | Verweis auf Browser ersetzt keine Widerrufsmöglichkeit im Tool | Art. 7 Abs 3 DSGVO | Link „Privatsphäre-Einstellungen“ |
| D5 | „Nutzerdaten werden 26 Monate aufbewahrt“ | GA4 bietet 2 oder 14 Monate (Standard-Property) | Art. 13 Abs 2 lit a | tatsächliche Einstellung eintragen, Empfehlung 14 Monate |
| D6 | „IP-Adresse … umgehend pseudonymisiert“ | GA4 speichert laut Google keine IP-Adressen; die Aussage ist veraltet (UA) | Art. 5 Abs 1 lit a | neu formulieren |
| D7 | „Kontakt: Daten sechs Monate gespeichert“ | Formulare gehen ins Frappe-Backoffice; dort kein Löschjob bekannt; bei Auftrag 7 Jahre | Art. 5 Abs 1 lit e; § 132 BAO; § 212 UGB | Fristen je Fall |
| D8 | Newsletter: „Interessengebiete, Geburtstag, PLZ“ | Formular fragt nur E-Mail | Art. 5 Abs 1 lit a, c | an Formular anpassen |
| D9 | Abmeldung „per E-Mail an marketing@“ | Abmeldelink in jeder Mail fehlt im Text; Pflicht | § 174 Abs 4 TKG 2021; Art. 21 Abs 2, 3 | Abmeldelink + E-Mail |
| D10 | Nicht genannt: Hosting, Server-Logs, Frappe, Google Maps, Google Ads, Consent-Cookie, Bild-Proxy, Empfänger, Drittland je Dienst, Beschwerdebehörde mit Adresse, Pflicht/Freiwilligkeit, automatisierte Entscheidungen | Art. 13 Abs 1 lit c–f, Abs 2 lit b–f | vollständig ergänzen |
| D11 | Beschwerde „bei uns … oder der Datenschutzbehörde“ | Beschwerde ist bei der Aufsichtsbehörde einzulegen (Art. 77); Adresse fehlt; DE-, CH-, FL-Kunden haben eigene Behörden | Art. 77; Art. 49 revDSG | Behörden nennen |
| D12 | Text nur Deutsch, auch unter `/en`, `/fr`, `/it` | Information muss „in klarer und einfacher Sprache“ sein; bei fremdsprachiger Ansprache in dieser Sprache | Art. 12 Abs 1 | Übersetzungen in `src/messages/*.json` |
| D13 | Datenschutz-Kontakt `marketing@` | vermischt Werbung und Betroffenenrechte | Art. 12 Abs 2 | eigene Adresse `datenschutz@platzhirsch.studio` [vom Unternehmen anzulegen] |

### 1.2 Cookie-Banner (`src/components/Cookies/*`, `src/messages/de.json` → `Cookies`)

**Gut:** Default „denied“ vor jedem Google-Tag; „Alle akzeptieren“ und „Weiter ohne Einwilligung“ gleich gestaltet auf erster Ebene; Escape/Schließen ist **keine** Einwilligung (`handleClose`); Einzeldienste wählbar; `_ga`-Cookies werden bei Widerruf gelöscht; Consent-Cookie 12 Monate; Maps über `ConsentEmbed` erst nach Klick; `trackEvent` ist ohne gtag ein No-op; Schriften selbst gehostet.

**Zu ändern:** siehe Abschnitt 4.

### 1.3 Was der Code heute an Daten verarbeitet (Grundlage für die Erklärung)

| Datenfluss | Felder (laut Code) | Ziel |
|---|---|---|
| `/api/kontakt` | `name`, `email_address`, `telefon` (optional), `ihre_nachricht` | Frappe `kontakt_form.create_contact` auf `backoffice.platzhirsch.studio` |
| `/api/anfrage_produkt` | `anfrage_vorname`, `_nachname`, `_email`, `_phone`, `_country`, `_city`, `_address`, `_type`, Merkliste | Frappe `anfrage_produkt.create_anfrage` |
| `/api/beratung_anfrage` | Thema, Zeitrahmen, Projektbeschreibung, `vorname`, `nachname`, `email`, `telefon` | Frappe `anfrage.create_anfrage` |
| `/api/newsletter_subscribe` | `email` (+ Honeypot) | Frappe `newsletter_website.subscribe_newsletter` (neue Instanz, `NEW_API_BASE_URL`) |
| `/api/image` | keine Nutzerdaten; Proxy für Bilder vom Backoffice | – |
| GA4 `G-1YCM6K57YG` (nach Consent) | `page_view`, `generate_lead` (`form`: kontakt/produkt_anfrage/beratung, `items`), `contact_click` (`method`: phone/email/whatsapp, `page_path`), `sign_up` (`method`: newsletter) | Google |

---

## 2. ENTWURF: Datenschutzerklärung (Webtext)

> **Entwurf – vor Verwendung durch eine Rechtsanwältin/einen Rechtsanwalt prüfen lassen.**
> Aufbau modular. Abschnitte mit **[MODUL]** nur veröffentlichen, wenn die Funktion live ist; ein Abschnitt für einen nicht genutzten Dienst ist selbst eine falsche Information. Reihenfolge: zuerst, was jede Person betrifft, dann je Funktion.

---

### Datenschutzerklärung

**Stand: [Datum der Veröffentlichung]** · Version [x.y]

#### 1. Wer ist verantwortlich?

Verantwortlich für die Verarbeitung Ihrer personenbezogenen Daten auf platzhirsch.studio und in unserem Showroom ist:

**MW Immobilienverwaltungs GmbH**, Marke „Platzhirsch Home Living“
Landstraße [9 oder 11 – vom Unternehmen auszufüllen, muss mit Impressum identisch sein], 6911 Lochau, Österreich
Firmenbuch: FN 443753 d, Landesgericht Feldkirch
Telefon: +43 5574 46255 · E-Mail für Datenschutzanliegen: **datenschutz@platzhirsch.studio** [vom Unternehmen anzulegen]

*[Nach der Ausgliederung: neuen Rechtsträger eintragen. Falls beide Gesellschaften Kundendaten gemeinsam nutzen (z. B. Café-Gutscheine im Shop), Vereinbarung nach Art. 26 DSGVO – anwaltlich prüfen.]*

Einen Datenschutzbeauftragten haben wir nicht bestellt, weil die Voraussetzungen des Art. 37 DSGVO nicht vorliegen. *[anwaltlich prüfen; bei KI-Profiling oder umfangreichem Ads-Abgleich neu bewerten]*

**Für Personen in der Schweiz:** Diese Erklärung gilt auch nach dem Schweizer Datenschutzgesetz (DSG). Begriffe wie „Verarbeitung“ und „personenbezogene Daten“ entsprechen „Bearbeitung“ und „Personendaten“ im DSG. *[Vertreter in der Schweiz nach Art. 14 DSG: siehe Abschnitt 7 des Arbeitspapiers – voraussichtlich nicht nötig.]*

#### 2. Überblick: Was wir verarbeiten und warum

Wir verarbeiten Daten nur, soweit es für den jeweiligen Zweck nötig ist. Für jede Verarbeitung nennen wir unten Zweck, Rechtsgrundlage, Empfänger, Übermittlung in Drittländer und Speicherdauer. Rechtsgrundlagen sind:

- **Vertrag oder vorvertragliche Anfrage** – Art. 6 Abs 1 lit b DSGVO (z. B. Ihre Anfrage, Ihr Termin, Ihre Bestellung)
- **Rechtliche Pflicht** – Art. 6 Abs 1 lit c DSGVO (z. B. Aufbewahrung von Rechnungen nach § 132 BAO und § 212 UGB)
- **Berechtigtes Interesse** – Art. 6 Abs 1 lit f DSGVO (z. B. sicherer Betrieb der Website, Abwehr von Spam). Dagegen können Sie jederzeit Widerspruch einlegen (Abschnitt 6).
- **Einwilligung** – Art. 6 Abs 1 lit a DSGVO, bei Cookies und ähnlichen Techniken zusätzlich § 165 Abs 3 TKG 2021 (für Besucher aus Deutschland: § 25 TDDDG). Eine Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen, über **„Privatsphäre-Einstellungen“ im Fuß jeder Seite** oder per E-Mail.

Wir treffen **keine automatisierten Entscheidungen** im Sinne von Art. 22 DSGVO bzw. Art. 21 DSG, die Ihnen gegenüber rechtliche Wirkung entfalten.

#### 3. Besuch der Website

**3.1 Hosting und Server-Protokolle.** Die Website läuft auf einem Server von [Hosting-Anbieter, Sitz, Rechenzentrumsstandort – vom Unternehmen auszufüllen]. Bei jedem Aufruf verarbeitet der Server technisch notwendig: IP-Adresse, Datum und Uhrzeit, aufgerufene Adresse, Referrer, Browser und Betriebssystem, Statuscode und Datenmenge. Zweck: Auslieferung der Seite, Sicherheit, Fehlersuche. Rechtsgrundlage: Art. 6 Abs 1 lit f DSGVO (berechtigtes Interesse an einem sicheren, funktionsfähigen Angebot). Speicherdauer der Protokolle: [14] Tage [vom Unternehmen festzulegen und technisch umzusetzen, Logs unter `/var/log`], danach Löschung, außer ein Sicherheitsvorfall erfordert längere Aufbewahrung. Der Hosting-Anbieter ist unser Auftragsverarbeiter.

**3.2 Produktdaten und Bilder.** Produktdaten und Bilder laden wir serverseitig aus unserem eigenen Verwaltungssystem. Dabei werden keine Daten Ihres Browsers an Dritte übermittelt.

**3.3 Schriften.** Wir binden Schriften lokal ein. Es wird keine Verbindung zu Google Fonts oder anderen Schriftdiensten aufgebaut.

**3.4 [MODUL, nur wenn eingesetzt] Spam-Schutz.** Unsere Formulare enthalten ein für Menschen unsichtbares Feld, das automatisierte Eingaben erkennt. Dabei werden keine zusätzlichen Daten erhoben. *[Falls Cloudflare Turnstile o. ä. eingesetzt wird (Bericht 06): Anbieter, Daten (IP, Browsermerkmale), Rechtsgrundlage und Drittland ergänzen; ob Einwilligung nötig ist – anwaltlich prüfen. Datensparsamere Alternative: Honeypot + Rate-Limit ohne Drittanbieter.]*

#### 4. Cookies, Einwilligungen und Ihre Wahl

Wir setzen Cookies und vergleichbare Techniken (Local Storage, Pixel) nur ein, wenn sie für den von Ihnen gewünschten Dienst unbedingt erforderlich sind oder Sie eingewilligt haben (§ 165 Abs 3 TKG 2021). Beim ersten Besuch fragen wir Sie in einem Banner. „Weiter ohne Einwilligung“ ist genauso einfach wie „Alle akzeptieren“. Ohne Einwilligung laden wir keine Analyse-, Werbe- oder Kartendienste.

**Unbedingt erforderlich:** Cookie `cookieConsent` (speichert Ihre Auswahl, 12 Monate, Erstanbieter). *[Bei Shop: Warenkorb-/Session-Cookie ergänzen; bei Sprachwahl ggf. `NEXT_LOCALE`.]* Nach 12 Monaten oder wenn wir neue Dienste einsetzen, fragen wir erneut.

**Einwilligungsnachweis:** [MODUL] Um nachweisen zu können, dass Sie eingewilligt haben (Art. 7 Abs 1 DSGVO), speichern wir auf unserem Server eine zufällige Kennung, Zeitpunkt, Version des Banners und Ihre Auswahl, ohne IP-Adresse, für [3 Jahre] nach Ende der Einwilligung [anwaltlich prüfen: Frist].

Die einzelnen Dienste, Cookie-Namen und Laufzeiten finden Sie jederzeit unter **„Privatsphäre-Einstellungen“ → „Details anzeigen“**.

#### 5. Die einzelnen Verarbeitungen

##### 5.1 Kontaktformular, Produktanfrage, Beratungsanfrage, E-Mail und Telefon

- **Daten:** Name, E-Mail, Telefon (soweit angegeben), Wohnort/Land/Adresse (bei Produktanfragen für Lieferung und Angebot), Inhalt Ihrer Nachricht, Thema, Zeitrahmen und gemerkte Produkte.
- **Zweck:** Beantwortung Ihrer Anfrage, Erstellung eines Angebots, Rückfragen.
- **Rechtsgrundlage:** Art. 6 Abs 1 lit b DSGVO (vorvertragliche Maßnahme auf Ihre Anfrage). Pflichtfelder sind markiert; ohne sie können wir die Anfrage nicht bearbeiten.
- **Empfänger:** Ihre Angaben werden über unseren Server an unser Kunden- und Warenwirtschaftssystem (Frappe/ERPNext) übermittelt, das [von uns selbst auf Servern von … / von … als Auftragsverarbeiter – vom Unternehmen auszufüllen] betrieben wird. Intern erhalten nur die zuständigen Beraterinnen und Berater Zugriff. Bei Küchen- und Möbelprojekten geben wir notwendige Angaben (Maße, Lieferort, ggf. Name) an den jeweiligen Hersteller oder Planungspartner weiter, wenn das für das Angebot erforderlich ist (Art. 6 Abs 1 lit b). *[Hersteller in Drittländern, z. B. Manufakturpartner Binni im Kosovo (kein Angemessenheitsbeschluss): nur Maße und Projektdaten ohne Namen übermitteln oder SCC abschließen – anwaltlich prüfen; siehe Bericht 26.]*
- **Speicherdauer:** Kommt kein Auftrag zustande, löschen wir die Anfrage **[12] Monate nach dem letzten Kontakt** [vom Unternehmen festzulegen; Küchenprojekte haben lange Entscheidungszeiten, die alte Frist „6 Monate“ ist nur zu halten, wenn das Backoffice das auch tut]. Wird ein Auftrag daraus, gelten die Fristen in 5.12.
- **Herkunft der Anfrage (Werbeerfolg):** [MODUL] Wenn Sie in Marketing-Dienste eingewilligt haben, speichern wir zusammen mit der Anfrage, über welche Anzeige oder Kampagne Sie gekommen sind (z. B. `gclid`, `fbclid`, UTM-Parameter). Ohne Einwilligung speichern wir das nicht. Speicherdauer wie die Anfrage.

##### 5.2 Google Analytics 4 (Statistik, nur mit Einwilligung)

- **Anbieter:** Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland (Auftragsverarbeiter); Muttergesellschaft Google LLC, USA.
- **Was:** Seitenaufrufe, Verweildauer, Gerätetyp, Browser, ungefährer Standort (Land/Stadt, aus der IP abgeleitet; GA4 speichert laut Google keine IP-Adressen), Herkunft (Referrer, Kampagne) und folgende Ereignisse: **`generate_lead`** (Absenden eines Anfrageformulars, mit Formulartyp und Anzahl gemerkter Produkte), **`contact_click`** (Klick auf Telefon-, E-Mail- oder WhatsApp-Link, mit Art des Kontakts und Seite), **`sign_up`** (Newsletter-Anmeldung). Wir übermitteln **keine** Namen, E-Mail-Adressen oder Nachrichteninhalte an Google Analytics. *[Bei Shop: `purchase` mit Bestellnummer und Wert ergänzen.]*
- **Cookies:** `_ga`, `_ga_<ID>` (bis 24 Monate).
- **Zweck:** Reichweitenmessung, Verbesserung der Website, Messung, welche Seiten zu Anfragen führen.
- **Rechtsgrundlage:** Einwilligung, Art. 6 Abs 1 lit a DSGVO, § 165 Abs 3 TKG 2021.
- **Speicherdauer bei Google:** [14] Monate [vom Unternehmen in GA4 → Datenaufbewahrung prüfen und eintragen]. Google Signals und Datenfreigabe an Google zu Produktzwecken: [deaktiviert – vom Unternehmen zu bestätigen].
- **Drittland:** Übermittlung an Google LLC in die USA möglich; Google LLC ist nach dem EU-US Data Privacy Framework zertifiziert (Angemessenheitsbeschluss der EU-Kommission vom 10.07.2023, Art. 45 DSGVO); für die Schweiz Swiss-US DPF (seit 15.09.2024 im Anhang 1 der DSV). Ergänzend Standardvertragsklauseln.
- **Widerruf:** „Privatsphäre-Einstellungen“; dabei löschen wir die `_ga`-Cookies in Ihrem Browser.

##### 5.3 Google Ads: Conversion-Messung, Remarketing, erweiterte Conversions (nur mit Einwilligung)

- **Anbieter:** Google Ireland Limited (siehe 5.2).
- **Was:** Ob Sie über eine Google-Anzeige zu uns kamen und danach eine Anfrage, einen Anruf-Klick, eine Newsletter-Anmeldung oder einen Kauf ausgelöst haben; Anzeigenklick-Kennung (`gclid`), Cookies `_gcl_au`, `_gcl_aw` (bis 90 Tage) und Cookies von Google-Domains (z. B. `IDE`, bis 13 Monate).
- **Remarketing:** Mit Ihrer Einwilligung kann Google Ihnen auf anderen Websites Anzeigen von uns zeigen.
- **Erweiterte Conversions [MODUL]:** Wenn Sie in „Google Ads“ eingewilligt haben und ein Formular absenden, übermitteln wir Ihre E-Mail-Adresse und ggf. Telefonnummer **verschlüsselt als Hashwert (SHA-256)** an Google. Google gleicht diesen Wert mit angemeldeten Google-Konten ab, um die Anfrage einer Anzeige zuzuordnen, und löscht ihn danach [prüfen: Frist laut Google Ads-Datenverarbeitungsbedingungen].
- **Offline-Conversions [MODUL]:** Wird aus einer Anfrage ein Auftrag, melden wir Google mit der gespeicherten Klick-Kennung, dass die Anzeige erfolgreich war (ohne Namen).
- **Rechtsgrundlage:** Einwilligung, Art. 6 Abs 1 lit a DSGVO, § 165 Abs 3 TKG 2021. Wir nutzen den Google Consent Mode: Ohne Einwilligung werden keine Google-Ads-Cookies gesetzt und keine Daten an Google übermittelt.
- **Rollen:** Für Conversion-Messung und erweiterte Conversions handelt Google als Auftragsverarbeiter, für Remarketing und eigene Zwecke als eigener Verantwortlicher [anwaltlich prüfen anhand Google Ads Data Processing Terms und Controller-Controller Terms].
- **Drittland:** wie 5.2.

##### 5.4 [MODUL] Meta Pixel und Conversions API (Facebook/Instagram, nur mit Einwilligung)

- **Anbieter:** Meta Platforms Ireland Limited, Merrion Road, Dublin 4, D04 X2K5, Irland; Muttergesellschaft Meta Platforms, Inc., USA.
- **Was:** Seitenaufrufe und Ereignisse (z. B. Anfrage gesendet, Newsletter-Anmeldung), Browser- und Geräteinformationen, IP-Adresse, Cookies `_fbp` (90 Tage), ggf. `fbclid`/`_fbc`; bei serverseitiger Übermittlung (Conversions API) zusätzlich gehashte E-Mail/Telefonnummer und eine Ereignis-ID, damit Meta doppelte Meldungen erkennt.
- **Zweck:** Erfolgsmessung von Anzeigen auf Facebook und Instagram, Bildung von Zielgruppen (z. B. Besucher der Küchenseiten), ähnliche Zielgruppen.
- **Rechtsgrundlage:** Einwilligung, Art. 6 Abs 1 lit a DSGVO, § 165 Abs 3 TKG 2021. Ohne Einwilligung wird der Pixel nicht geladen und die Conversions API sendet nichts.
- **Gemeinsame Verantwortlichkeit:** Für die Erhebung und Übermittlung der Daten an Meta sind wir mit Meta gemeinsam verantwortlich (Art. 26 DSGVO, EuGH C-40/17 *Fashion ID*). Wir haben dazu die Vereinbarung von Meta abgeschlossen (Controller Addendum: [Link vom Unternehmen einzufügen, nach Abschluss im Business Manager]). Meta ist danach für die Erfüllung Ihrer Rechte hinsichtlich der weiteren Verarbeitung bei Meta zuständig; Sie können sich an beide wenden. Für die weitere Verarbeitung (Anzeigenauslieferung, Berichte) ist Meta allein verantwortlich.
- **Drittland:** Meta Platforms, Inc. ist nach dem EU-US DPF zertifiziert [prüfen auf dataprivacyframework.gov]; ergänzend SCC.

##### 5.5 Google Maps (nur nach Klick bzw. Einwilligung)

- **Anbieter:** Google Ireland Limited.
- **Was:** Beim Laden der Karte übermittelt Ihr Browser IP-Adresse, Gerätedaten und die aufgerufene Seite an Google; Google kann Cookies setzen (z. B. `NID`, 6 Monate) und, wenn Sie bei Google angemeldet sind, den Besuch Ihrem Konto zuordnen.
- **Zweck:** Anfahrt zu unserem Showroom.
- **Rechtsgrundlage:** Einwilligung, Art. 6 Abs 1 lit a DSGVO, § 165 Abs 3 TKG 2021 – erteilt über den Banner oder den Knopf „Karte laden“.
- **Verantwortung:** Google verarbeitet die Daten als eigener Verantwortlicher. Drittland wie 5.2.
- **Alternative ohne Datenübermittlung:** Adresse und Link „Route in Google Maps öffnen“ (öffnet die Seite von Google in neuem Fenster).

##### 5.6 Newsletter (Double-Opt-in, Anbieter Brevo)

- **Daten:** E-Mail-Adresse (Pflicht); freiwillig: Sprache, Interessen (z. B. Wohnen, Küche, Outdoor, Licht, Atelierverkauf, Events), „Ich bin Privatkunde/Architekt/Hotel/Bauträger“, Land. *[Nur aufnehmen, was das Formular tatsächlich abfragt. Geburtstag und PLZ nicht erheben, solange sie nicht genutzt werden (Datenminimierung).]*
- **Anmeldung:** Nach dem Absenden erhalten Sie eine E-Mail mit Bestätigungslink. Erst nach Klick sind Sie angemeldet (Double-Opt-in). Wir speichern Zeitpunkt der Anmeldung und Bestätigung, IP-Adresse zu beiden Zeitpunkten, Quelle (Seite) und den Wortlaut der Einwilligung, um die Einwilligung nachzuweisen.
- **Inhalt und Frequenz:** Neuheiten aus dem Showroom, Einladungen zu Veranstaltungen, Atelierverkauf und Angebote von Platzhirsch Home Living, etwa [1–2] Mal im Monat [vom Unternehmen festzulegen].
- **Erfolgsmessung:** [Entscheidung nötig] Wir messen, ob ein Newsletter geöffnet und welche Links angeklickt wurden (Zählpixel und personalisierte Links), um Inhalte zu verbessern. Diese Messung ist Teil Ihrer Einwilligung; sie endet mit der Abmeldung. *[Alternative datensparsam: Öffnungsmessung in Brevo deaktivieren, nur Klicks anonym zählen. Ob die Messung gesondert eingewilligt werden muss – anwaltlich prüfen.]*
- **Rechtsgrundlage:** Einwilligung, Art. 6 Abs 1 lit a DSGVO, § 174 Abs 3 TKG 2021 (für DE: § 7 Abs 2 Nr. 2 UWG). Nachweis-Protokoll: Art. 6 Abs 1 lit c i. V. m. Art. 7 Abs 1 DSGVO.
- **Bestandskunden [MODUL, anwaltlich prüfen]:** Wenn Sie bei uns gekauft haben, dürfen wir Ihnen ohne gesonderte Einwilligung Informationen zu ähnlichen eigenen Produkten an die beim Kauf angegebene E-Mail senden, wenn wir Sie beim Kauf und in jeder E-Mail auf Ihr Widerspruchsrecht hinweisen (§ 174 Abs 4 TKG 2021; DE: § 7 Abs 3 UWG). Rechtsgrundlage dann Art. 6 Abs 1 lit f.
- **Dienstleister:** Brevo (Sendinblue SAS, 106 Boulevard Haussmann, 75008 Paris, Frankreich) als Auftragsverarbeiter [prüfen: Vertragspartner für AT-Kunden ggf. Sendinblue GmbH, Berlin]; die Anmeldung wird zusätzlich in unserem Backoffice (Frappe) gespeichert. Brevo gibt an, Daten in der EU zu speichern [prüfen in der aktuellen Unterauftragsverarbeiterliste].
- **Abmeldung:** jederzeit über den Link in jeder E-Mail oder an datenschutz@platzhirsch.studio. Wir löschen Ihre Adresse dann aus dem Verteiler; den Nachweis der früheren Einwilligung und die Abmeldung bewahren wir [3 Jahre] auf (Abwehr von Ansprüchen, Art. 17 Abs 3 lit e) [anwaltlich prüfen]. Ihre Adresse kommt auf eine Sperrliste, damit Sie nicht erneut angeschrieben werden.

##### 5.7 [MODUL] Online-Terminbuchung

- **Anbieter:** [Cal.com, Inc., 3500 South DuPont Highway, Dover, Delaware 19901, USA – prüfen] *oder* [Alternative – vom Unternehmen zu entscheiden].
- **Daten:** Name, E-Mail, Telefon (optional), gewählter Termin und Termintyp (Showroom, Video, Hausbesuch, Küchenplanung), Ihre Notiz, Zeitzone; Bestätigungs- und Erinnerungsmails.
- **Zweck:** Vereinbarung und Durchführung des Termins. Die Buchung wird automatisch als Anfrage in unser Backoffice übernommen (siehe 5.1).
- **Rechtsgrundlage:** Art. 6 Abs 1 lit b DSGVO. Das Laden des Buchungskalenders setzt Daten des Anbieters ein; wir laden ihn daher erst nach Ihrem Klick bzw. Ihrer Einwilligung (§ 165 Abs 3 TKG 2021).
- **Speicherdauer:** beim Anbieter [6] Monate nach dem Termin [vom Unternehmen festzulegen, Löschung im Konto einrichten]; im Backoffice wie 5.1.
- **Drittland:** [USA: DPF-Zertifizierung prüfen; sonst SCC] – *Achtung: Laut Drittquellen wird die EU-Instanz cal.eu zum 01.11.2026 eingestellt; vor Vertragsschluss schriftlich bestätigen lassen.*
- Erinnerungen per E-Mail/SMS sind **reine Terminhinweise**, keine Werbung.

##### 5.8 [MODUL] Video-Beratung

- **Dienst:** [Microsoft Teams / Google Meet / Cal Video (Daily.co, USA) / Whereby (Norwegen) – vom Unternehmen zu entscheiden].
- **Daten:** Name, E-Mail, Bild und Ton während des Gesprächs, gezeigte Räume, Chat, technische Verbindungsdaten (IP, Gerät).
- **Rechtsgrundlage:** Art. 6 Abs 1 lit b DSGVO.
- **Keine Aufzeichnung.** Wir zeichnen Gespräche nicht auf. Screenshots von Räumen machen wir nur, wenn Sie das im Gespräch ausdrücklich erlauben, und behandeln sie wie Raumfotos (5.11).
- **Tipp:** Sie können die Kamera ausschalten oder einen Hintergrund verwenden; zeigen Sie keine Dokumente oder Personen, die nicht teilnehmen.
- **Drittland/Auftragsverarbeitung:** [je nach Dienst ergänzen].

##### 5.9 [MODUL] WhatsApp

- Wenn Sie uns über den WhatsApp-Link schreiben, nutzen Sie den Dienst von **WhatsApp Ireland Limited**, Merrion Road, Dublin 4, Irland (Teil von Meta). WhatsApp verarbeitet Ihre Nummer, Ihr Profil und Metadaten als eigener Verantwortlicher nach seinen Bedingungen; Inhalte sind Ende-zu-Ende-verschlüsselt [gilt nicht für die WhatsApp Business Platform/Cloud API – dort ergänzen, dass Meta als Auftragsverarbeiter Nachrichten verarbeitet; anwaltlich prüfen].
- **Wir** verarbeiten Ihre Nummer und Ihre Nachrichten, um Ihre Anfrage zu beantworten (Art. 6 Abs 1 lit b). Wir nutzen WhatsApp auf einem eigenen Geschäftsgerät **ohne Abgleich des Adressbuchs** mit anderen Kundendaten. Relevante Inhalte übernehmen wir in unser Backoffice (5.1); den Chat löschen wir nach [12 Monaten] [vom Unternehmen festzulegen].
- Werbung per WhatsApp senden wir nur mit Ihrer ausdrücklichen Einwilligung.
- Der Link selbst überträgt beim Anzeigen der Seite keine Daten an WhatsApp. Klicken Sie ihn an, wird (mit Ihrer Statistik-Einwilligung) nur das Ereignis „WhatsApp-Klick“ an Google Analytics gemeldet (5.2).
- Wenn Sie WhatsApp nicht nutzen möchten: Telefon, E-Mail oder Formular.

##### 5.10 [MODUL] KI-Concierge (Chat-Assistent)

- **Hinweis:** Sie sprechen mit einem **KI-System**, nicht mit einem Menschen (Art. 50 Abs 1 KI-Verordnung (EU) 2024/1689). Antworten können Fehler enthalten. Verbindlich sind nur Angebote unserer Beraterinnen und Berater.
- **Anbieter des Sprachmodells:** Anthropic [PBC, 548 Market Street, PMB 90375, San Francisco, CA 94104, USA, bzw. Anthropic Ireland, Limited – Vertragspartner laut Commercial Terms prüfen] über die Claude API, *oder* [Amazon Web Services EMEA SARL, Luxemburg, über Amazon Bedrock in der Region Frankfurt (eu-central-1) – Entscheidung nötig, siehe Arbeitspapier 3.3].
- **Daten:** Ihre Eingaben, die Antworten, Zeitpunkt, Sprache und die Seite, auf der Sie den Chat geöffnet haben. Wir verlangen keinen Namen. Wenn Sie im Chat um Rückruf oder Angebot bitten, fragen wir nach Name und Kontaktdaten und übergeben das Gespräch als Anfrage an unser Backoffice (5.1).
- **Zweck:** Beantwortung Ihrer Fragen zu Sortiment, Marken, Lieferung, Schweiz-Service und Terminen; Weitergabe an einen Menschen auf Ihren Wunsch.
- **Rechtsgrundlage:** Art. 6 Abs 1 lit b DSGVO (Ihre Anfrage), für die Auswertung zur Qualitätsverbesserung Art. 6 Abs 1 lit f (berechtigtes Interesse an richtigen Antworten), für die Übergabe an das Backoffice Ihre Bitte darum.
- **Cookies:** Der Chat wird von unserem eigenen Server ausgeliefert und setzt keine Cookies [technisch sicherstellen; sonst Consent-Eintrag].
- **Kein Training:** Der Anbieter verwendet Ihre Eingaben nach unserem Vertrag nicht zum Training seiner Modelle. Speicherung beim Anbieter: [laut Anbieter-Dokumentation keine bzw. bis 30 Tage, u. a. zur Missbrauchserkennung – im Vertrag prüfen und konkrete Zahl eintragen].
- **Speicherdauer bei uns:** Chatprotokolle [30 Tage], danach automatische Löschung; übergebene Anfragen wie 5.1.
- **Bitte keine sensiblen Daten** (Gesundheit, Ausweis- oder Kontonummern) in den Chat eingeben.
- **Drittland:** [Claude API: Übermittlung in die USA; Grundlage Standardvertragsklauseln im Data Processing Addendum von Anthropic; DPF-Zertifizierung nicht verifiziert – prüfen] / [Bedrock EU: Verarbeitung in der EU; Zugriff aus den USA im Supportfall möglich, AWS ist DPF-zertifiziert – prüfen].
- **Widerspruch:** gegen die Auswertung zur Qualitätsverbesserung jederzeit (Abschnitt 6).

##### 5.11 [MODUL] KI-Raumplaner „Ihr Raum in 48 Stunden“ (Fotos Ihrer Räume)

- **Daten:** die Fotos, die Sie hochladen, Ihre Angaben zum Raum (Maße, Stil, Budgetrahmen), Name und E-Mail für die Zusendung. Fotos können zeigen, wie und wo Sie wohnen.
- **Bevor Sie hochladen:** Bitte fotografieren Sie **keine Personen**, Familienfotos, Dokumente oder Bildschirme und nach Möglichkeit keinen Blick aus dem Fenster, der Ihre Adresse verrät.
- **Was wir tun:** Beim Hochladen entfernen wir automatisch Metadaten (EXIF, auch GPS-Standort). Die Fotos speichern wir verschlüsselt bei [Anbieter Objektspeicher, z. B. Hetzner Online GmbH, Gunzenhausen, Rechenzentrum Falkenstein/Nürnberg, oder Exoscale/A1 Digital, Wien – vom Unternehmen auszufüllen] in der EU. Unser Team erstellt die Visualisierung auf **eigenen Rechnern in Lochau** mit KI-Werkzeugen und prüft jedes Bild von Hand. In dieser Stufe verlassen Ihre Fotos die EU nicht und gehen an keinen KI-Cloud-Anbieter.
  *[MODUL Stufe 3 – Cloud-Generierung: Anbieter, Sitz, Drittland, Garantien, Speicherfrist beim Anbieter und „kein Training“ ergänzen; DSFA vor Start.]*
- **Kennzeichnung:** Jede Visualisierung ist als KI-erzeugt gekennzeichnet, sichtbar und maschinenlesbar (Art. 50 Abs 2 und 4 KI-Verordnung). Sie ist nicht maßstabsgetreu; Farben und Maße sind unverbindlich.
- **Rechtsgrundlage:** Art. 6 Abs 1 lit b DSGVO (die von Ihnen bestellte Visualisierung). Sollten auf Ihren Fotos Dritte erkennbar sein, verarbeiten wir diese Bildteile nur, soweit unvermeidbar (Art. 6 Abs 1 lit f) und machen sie auf Wunsch unkenntlich.
- **Training nur mit gesonderter Einwilligung:** Wir verwenden Ihre Fotos **nicht** zum Training oder zur Verbesserung von KI-Modellen und nicht als Referenz auf unserer Website, außer Sie kreuzen das gesondert an (Art. 6 Abs 1 lit a; standardmäßig nicht angekreuzt, jederzeit widerrufbar).
- **Speicherdauer:** Fotos und Ergebnisse löschen wir automatisch [90] Tage nach Zusendung des Ergebnisses [vom Unternehmen zu entscheiden: Bericht 14 empfiehlt 30, Bericht 06 nennt 90 Tage], außer daraus wird ein Auftrag (dann Teil der Projektakte, 5.12).

##### 5.12 [MODUL] Bestellungen, Gutscheine, Outlet, Anzahlungen und Zahlung

- **Daten:** Name, Rechnungs- und Lieferadresse, E-Mail, Telefon, Bestellinhalt, Preis, Zahlungsart und -status, bei Gutscheinen ggf. Name und E-Mail des Beschenkten und Ihr Grußtext; Gutscheincode und Restwert.
- **Zweck und Rechtsgrundlage:** Vertragsabwicklung (Art. 6 Abs 1 lit b), Buchhaltung und Steuer (Art. 6 Abs 1 lit c, § 132 BAO, § 212 UGB), Betrugsabwehr (lit f).
- **Zahlungsdienstleister:** Die Zahlung läuft über die Bezahlseite des Anbieters; Kartendaten erreichen unseren Server nicht.
  - **Stripe Payments Europe, Limited**, 1 Grand Canal Street Lower, Dublin 2, Irland – für Kartenzahlung, Apple Pay/Google Pay, EPS, TWINT [prüfen Verfügbarkeit] und Rechnungen. Stripe verarbeitet Zahlungsdaten zum Teil als eigener Verantwortlicher (Geldwäsche- und Betrugsprävention). Übermittlung an Stripe, Inc. (USA): DPF/SCC [prüfen].
  - **PayPal (Europe) S.à r.l. et Cie, S.C.A.**, 22–24 Boulevard Royal, L-2449 Luxemburg – eigener Verantwortlicher.
  - **TWINT** [TWINT AG, Stauffacherstrasse 31, 3014 Bern, Schweiz – Schweiz mit Angemessenheitsbeschluss der EU] – wenn über Stripe abgewickelt, bei Stripe nennen.
  - *[Klarna, falls Finanzierung angeboten wird: eigener Abschnitt inkl. Bonitätsprüfung durch Klarna – anwaltlich prüfen.]*
- **Gutschein an Dritte:** Wenn Sie einen Gutschein an eine andere Person senden lassen, verwenden wir deren Name und E-Mail nur zur Zustellung und Einlösung. Bitte informieren Sie die Person darüber (Art. 14 DSGVO).
- **Speicherdauer:** Rechnungen und Buchungsbelege 7 Jahre (§ 132 BAO, § 212 UGB), bei Liegenschafts-/Bauleistungen ggf. länger [Steuerberatung]. Gutscheindaten, solange der Gutschein eingelöst werden kann (in Österreich bis zu 30 Jahre, § 1478 ABGB [anwaltlich prüfen anhand der Gutscheinbedingungen]) und danach die Belegfrist. Kundenkonto- und Auftragsdaten bis zum Ende von Gewährleistung und Verjährung [3] Jahre nach Lieferung.
- **Bonitätsprüfung:** findet nicht statt [vom Unternehmen zu bestätigen; bei Vorkasse/Anzahlung entbehrlich].

##### 5.13 [MODUL] Lieferung und Montage, auch in die Schweiz und nach Liechtenstein

Für Lieferung und Montage geben wir Name, Lieferadresse, Telefon und Liefertermin an Spediteure und Montagepartner weiter [Liste vom Unternehmen auszufüllen]. Bei Lieferungen in die Schweiz/nach Liechtenstein übermitteln wir die für Ausfuhr, Einfuhr und Mehrwertsteuer nötigen Daten an den Spediteur, unseren Schweizer Steuervertreter [Name] und die Zollbehörden (österreichisches Zollamt, Bundesamt für Zoll und Grenzsicherheit BAZG). Rechtsgrundlage: Art. 6 Abs 1 lit b und c DSGVO. Die Schweiz hat einen Angemessenheitsbeschluss der EU-Kommission. Spediteure und Steuervertreter sind je nach Vertrag eigene Verantwortliche oder Auftragsverarbeiter.

##### 5.14 [MODUL] Bewertungen

- **Anzeige:** Wir zeigen auf unserer Website die Sterne-Bewertung und Anzahl unserer Google-Bewertungen als Text mit Link zu Google. Dabei wird keine Verbindung zu Google aufgebaut. **Hinweis nach § 2 Abs 6 UWG/ § 5b Abs 3 UWG (DE):** Google prüft nach unserer Kenntnis nicht, ob Bewertende bei uns gekauft haben; wir zeigen alle Bewertungen ungefiltert [Text mit Bericht 14/F11 und Rechtsanwalt abstimmen].
- **Bitte um Bewertung:** Wir bitten Sie per QR-Karte bei der Lieferung um eine Bewertung. Per E-Mail nur, wenn Sie eingewilligt haben oder als Bestandskunde nicht widersprochen haben (§ 174 TKG 2021; BGH VI ZR 225/17).
- **Kundenstimmen/Referenzen auf der Website:** nur mit Ihrer schriftlichen Einwilligung, in der vereinbarten Form (z. B. „Familie M., Lindau“), widerrufbar.
- **Antworten auf Bewertungen:** Wir antworten öffentlich auf Google, ohne Details aus Ihrem Auftrag zu nennen (Art. 6 Abs 1 lit f).

##### 5.15 [MODUL] Veranstaltungen (Vernissagen, Adventsabend, Kochabende)

- **Anmeldung:** Name, E-Mail, Anzahl der Begleitpersonen, ggf. Telefon. Rechtsgrundlage Art. 6 Abs 1 lit b. Löschung [3] Monate nach der Veranstaltung, außer Sie abonnieren den Newsletter (gesonderte Checkbox, nicht vorausgewählt).
- **Unverträglichkeiten/Allergien** (Café, Kochabend): Das sind Gesundheitsdaten (Art. 9 DSGVO). Wir fragen sie nur als **freiwillige** Angabe mit ausdrücklicher Einwilligung (Art. 9 Abs 2 lit a) ab, nutzen sie nur für die Verpflegung und löschen sie unmittelbar nach der Veranstaltung. *[Datensparsame Alternative: „Bitte sprechen Sie unser Café-Team vor Ort an“.]*
- **Fotos und Videos:** Auf Veranstaltungen fotografieren wir für Berichte auf Website, Newsletter und Social Media. Rechtsgrundlage: Art. 6 Abs 1 lit f (Berichterstattung über unsere Veranstaltung). Wir weisen in der Einladung und am Eingang darauf hin; wer nicht fotografiert werden möchte, erhält [einen Anstecker] und wird nicht gezeigt. Porträts und Bilder, auf denen einzelne Personen im Mittelpunkt stehen, veröffentlichen wir nur mit Einwilligung. Kinder fotografieren wir nicht ohne Einwilligung der Eltern. *[§ 78 UrhG (Bildnisschutz AT) und KUG (DE) – anwaltlich prüfen.]*

##### 5.16 Unsere Auftritte in sozialen Netzwerken

Wir betreiben Seiten auf Instagram und Facebook [weitere: Pinterest, LinkedIn – vom Unternehmen auszufüllen]. Für die Seiten-Statistiken („Insights“) sind wir mit Meta gemeinsam verantwortlich (EuGH C-210/16 *Wirtschaftsakademie*; Page Insights Controller Addendum von Meta). Wenn Sie uns dort Nachrichten schreiben, verarbeiten wir diese zur Beantwortung (Art. 6 Abs 1 lit b bzw. f). Für alles Weitere gilt die Datenschutzerklärung des jeweiligen Netzwerks.

##### 5.17 Bewerbungen

[Falls Karriereseite Bewerbungen annimmt: Daten, Zweck (§ 6 Abs 1 lit b; Anbahnung Arbeitsverhältnis), Speicherdauer 7 Monate nach Absage (Frist § 29 GlBG + Puffer) bzw. Evidenz mit Einwilligung – anwaltlich prüfen.]

#### 6. Ihre Rechte

Sie haben das Recht auf **Auskunft** (Art. 15), **Berichtigung** (Art. 16), **Löschung** (Art. 17), **Einschränkung** (Art. 18), **Datenübertragbarkeit** (Art. 20) und **Widerruf** erteilter Einwilligungen (Art. 7 Abs 3). Sie können der Verarbeitung auf Grundlage berechtigter Interessen aus Gründen Ihrer besonderen Situation **widersprechen** (Art. 21 Abs 1) und der Verarbeitung für Direktwerbung **jederzeit ohne Begründung** (Art. 21 Abs 2).

Schreiben Sie an datenschutz@platzhirsch.studio oder an die Postadresse oben. Wir antworten innerhalb eines Monats (Art. 12 Abs 3) und prüfen ggf. Ihre Identität.

**Beschwerde bei einer Aufsichtsbehörde** (Art. 77 DSGVO), insbesondere in Ihrem Wohnsitzland:
- **Österreich:** Österreichische Datenschutzbehörde, Barichgasse 40–42, 1030 Wien, dsb@dsb.gv.at, www.dsb.gv.at
- **Deutschland:** die Aufsichtsbehörde Ihres Bundeslandes, z. B. Bayerisches Landesamt für Datenschutzaufsicht (Ansbach) oder Landesbeauftragter für Datenschutz Baden-Württemberg (Stuttgart)
- **Liechtenstein:** Datenschutzstelle Liechtenstein, Städtle 38, 9490 Vaduz [prüfen]
- **Schweiz:** Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter (EDÖB), Feldeggweg 1, 3003 Bern [prüfen]

#### 7. Hinweise für Personen in der Schweiz

- Wir bearbeiten Ihre Personendaten nach der DSGVO und, soweit anwendbar, nach dem Bundesgesetz über den Datenschutz (DSG, SR 235.1).
- **Länder, in die Daten bekanntgegeben werden** (Art. 19 Abs 4 DSG): EU/EWR (insbesondere Österreich, Irland, Frankreich, Deutschland, Luxemburg) und die USA [ergänzen je nach aktiven Diensten: Google, Meta, Cal.com, Anthropic/AWS, Stripe]. Für die EU/den EWR besteht nach Anhang 1 der Datenschutzverordnung (DSV) ein angemessenes Schutzniveau; für die USA nur bei Empfängern, die nach dem Swiss-US Data Privacy Framework zertifiziert sind (seit 15.09.2024); im Übrigen stützen wir uns auf die vom EDÖB anerkannten Standardvertragsklauseln der EU-Kommission mit Schweizer Anpassungen (Art. 16 Abs 2 lit d DSG) oder Ihre Einwilligung (Art. 17 Abs 1 lit a DSG).
- Ihre Rechte nach Art. 25–29 und 32 DSG (Auskunft, Datenherausgabe, Berichtigung, Löschung, Widerspruch) können Sie bei uns geltend machen; Beschwerde/Anzeige beim EDÖB.

#### 8. Datensicherheit

Wir übertragen Daten verschlüsselt (TLS). Zugriff im Backoffice haben nur berechtigte Mitarbeitende mit eigenem Konto [Zwei-Faktor-Anmeldung – vom Unternehmen zu bestätigen]. Formulardaten gehen nicht direkt aus Ihrem Browser an Dritte, sondern über unseren Server.

#### 9. Änderungen

Wir passen diese Erklärung an, wenn wir neue Dienste einsetzen oder sich die Rechtslage ändert. Es gilt die jeweils hier veröffentlichte Fassung. Bei neuen einwilligungspflichtigen Diensten fragen wir Sie erneut.

---

## 3. Arbeitspapier: Entscheidungen hinter dem Text

### 3.1 Speicherfristen (Vorschlag, im Backoffice technisch umsetzen)

| Daten | Frist (Vorschlag) | Grundlage | Umsetzung |
|---|---|---|---|
| Server-Logs | 14 Tage | Art. 5 Abs 1 lit e; Sicherheit | logrotate auf dem Server |
| Anfrage ohne Auftrag | 12 Monate nach letztem Kontakt | Zweckerreichung; Küchen-Entscheidungszyklen | Frappe: geplanter Job „Lead ohne Aktivität > 12 M → anonymisieren“ |
| Auftrag, Rechnung | 7 Jahre ab Ende des Kalenderjahres | § 132 BAO, § 212 UGB | Frappe-Standard |
| Gewährleistungsunterlagen | 3 Jahre nach Lieferung (2 J. Gewährleistung + Puffer; bei Küchen-Montage ggf. länger) | § 933 ABGB [anwaltlich prüfen] | Frappe |
| Newsletter-Einwilligungsnachweis | Dauer + 3 Jahre | Art. 7 Abs 1; Verjährung § 1489 ABGB | Brevo + Frappe |
| Consent-Protokoll (Banner) | Einwilligungsdauer + 3 Jahre | Art. 7 Abs 1 | eigene Tabelle/Route |
| Chatprotokolle KI | 30 Tage | Datenminimierung | Löschjob |
| Raumfotos | 30 oder 90 Tage nach Ergebnis | Datenminimierung | S3-Lifecycle-Regel |
| Termin beim Anbieter | 6 Monate nach Termin | Zweckerreichung | Einstellung im Kalender-Tool |
| WhatsApp-Chats | 12 Monate | Zweckerreichung | manuell, Kalendererinnerung |
| Event-Anmeldung | 3 Monate nach Event | Zweckerreichung | Frappe |
| Allergie-Angaben | unmittelbar nach Event | Art. 9; Minimierung | manuell |
| gclid/fbclid an Anfrage | wie Anfrage, für Ads-Import max. 90 Tage relevant | Einwilligung | Frappe-Feld leeren |

### 3.2 Einwilligungsgestaltung: Formulare (Mikrotexte für `src/messages/*.json`)

- **Unter jedem Anfrageformular (keine Checkbox):** „Wir verwenden Ihre Angaben, um Ihre Anfrage zu beantworten. Mehr dazu in unserer [Datenschutzerklärung].“ (Art. 13; keine Pflicht-Checkbox, weil Rechtsgrundlage lit b – eine Pflicht-Checkbox „Ich willige ein“ würde eine falsche Rechtsgrundlage suggerieren.)
- **Optionale Checkbox im Anfrageformular (nicht vorausgewählt):** „Ja, ich möchte den Newsletter von Platzhirsch Home Living mit Neuheiten, Einladungen und Angeboten erhalten (ca. 1–2 Mal im Monat, Abmeldung jederzeit).“ → löst Double-Opt-in aus.
- **Newsletter-Formular:** „Mit Ihrer Anmeldung willigen Sie ein, dass wir Ihnen [Inhalte] per E-Mail senden und messen, ob Sie Mails öffnen und Links anklicken. Sie erhalten zuerst eine Bestätigungs-Mail. Abmeldung jederzeit über den Link in jeder Mail. [Datenschutzerklärung]“
- **Raumplaner-Upload:** Pflicht-Hinweis vor dem Upload-Feld (siehe 5.11) + **gesonderte, nicht vorausgewählte** Checkbox „Meine Fotos dürfen anonymisiert zur Verbesserung der Visualisierungen verwendet werden“ – oder diese Option ganz weglassen (empfohlen in Stufe 1).
- **KI-Chat Kopfzeile, vor der ersten Eingabe:** „KI-Assistent · Antworten können Fehler enthalten und sind unverbindlich. Bitte keine sensiblen Daten eingeben. Persönliche Beratung: [Termin buchen]. [Datenschutz]“

### 3.3 KI-Concierge: Architekturentscheidung aus Datenschutzsicht

| Variante | Datenort | Transfergrundlage | Aufwand | Empfehlung |
|---|---|---|---|---|
| A: Claude API direkt (`api.anthropic.com`) | USA/global; `inference_geo` nur `us` oder `global` | SCC im Anthropic-DPA [prüfen]; DPF nicht verifiziert; TIA nötig | gering | zulässig mit Offenlegung, wenn keine EU-Pflicht gewünscht |
| B: Claude über Amazon Bedrock, EU-Inferenzprofil (Frankfurt/Irland/Paris) | EU | AWS-DPA; Restrisiko US-Zugriff, AWS DPF [prüfen] | mittel (AWS-Konto, IAM) | **Empfehlung für Vertrauens-Marke** („Ihre Daten bleiben in der EU“) |
| C: lokales Modell auf eigener GPU | Lochau | kein Transfer | hoch (Qualität, Betrieb) | nicht für Kunden-Chat (Bericht 06: Büro-PC ist kein Server) |

Unabhängig von der Variante: System-Prompt ohne personenbezogene Kundendaten; keine Übergabe von Backoffice-Datensätzen an das Modell; Eingaben serverseitig auf E-Mail/IBAN/Telefon prüfen und vor dem Versand maskieren [technischer Vorschlag]; Protokolle 30 Tage; Prompt-Caching beachten (Speicherdauer im Cache laut Anbieter) [prüfen].

### 3.4 Meta/Google-Abgleich gehashter Daten

Gehashte E-Mail (SHA-256) ist **pseudonymisiert, nicht anonym** – Google/Meta können sie zuordnen. Deshalb: nur bei `ad_user_data: granted` bzw. Meta-Einwilligung senden; Hash serverseitig erzeugen; **keine Kundenlisten-Uploads** (Customer Match / Custom Audiences aus Bestandskunden) ohne Einwilligung der Betroffenen [anwaltlich prüfen; DSB-Praxis kritisch].

---

## 4. Änderungen am Cookie-Banner (konkret, für die Bau-Agenten)

| # | Änderung | Datei/Schlüssel | Warum |
|---|---|---|---|
| C1 | `Cookies.intro` neu: „Wir verwenden Cookies und ähnliche Techniken nur mit Ihrer Einwilligung, außer sie sind für die Website unbedingt nötig. Mit Ihrer Einwilligung übermitteln wir Daten an Google und [Meta], teils in die USA. Sie können Ihre Wahl jederzeit unter ‚Privatsphäre-Einstellungen‘ im Fuß der Seite ändern.“ Satz „berechtigtes Interesse, dem Sie widersprechen können“ **streichen** | `src/messages/{de,en,fr,it}.json` → `Cookies.intro` | Widerspruch zur Technik; § 165 Abs 3 TKG |
| C2 | `thirdCountryNotice` ersetzen: kein pauschales Art. 49; stattdessen „Einige Dienste übermitteln Daten in die USA. Die Anbieter sind nach dem EU-US Data Privacy Framework zertifiziert bzw. es gelten Standardvertragsklauseln. Details je Dienst unter ‚Details anzeigen‘.“ | dito | DPF seit 10.07.2023 |
| C3 | Je Dienst `mechanisms` auf `adequacy` (DPF) **und** `scc` setzen; Länderliste auf tatsächliche Länder kürzen (heute 16 Länder inkl. Katar, Indonesien pauschal) – Google nennt Rechenzentrumsländer; ehrlicher: „USA und weitere Länder laut Google“ | `cookiecomponent.js` `thirdCountries()` | Art. 13 Abs 1 lit f |
| C4 | **Google Tag Manager entfernen**, solange nicht eingesetzt; Kopplung `functional = googleMaps && googleTagManager` in `cookiecomponent.js` und `ConsentEmbed.js` auf nur Maps umstellen | `cookieServices.functional.googleTagManager` | falsche Information, verwirrende Kategorie |
| C5 | Kategorie-Beschreibung „Funktional“: „hübschere Schriftarten, Videowiedergabe, Web-2.0“ streichen; neu: „Karten, Terminkalender und andere eingebettete Dienste von Drittanbietern“ | `Cookies.categories.functional.description` | Text passt nicht zu den Diensten |
| C6 | „Essenziell“ bekommt einen sichtbaren Eintrag `cookieConsent` (12 Monate, Erstanbieter) | `cookieServices.essential` (neu) | Transparenz |
| C7 | Google Ads: Cookie-Liste aktualisieren (`_gcl_au`, `_gcl_aw` 90 Tage; `IDE` 13 Monate; `test_cookie` 15 Min.; `CONSENT` mit 18 Jahren prüfen/streichen); Zweck um „erweiterte Conversions (gehashte E-Mail)“ ergänzen, sobald aktiv | `cookieServices.marketing.googleAds`, `Cookies.services.googleAds.purpose` | Richtigkeit |
| C8 | **Neu: Meta Pixel** (Marketing): Anbieter Meta Platforms Ireland, Zweck, `_fbp` 90 Tage, `fr` 90 Tage (Meta-Domain), USA/DPF, Hinweis gemeinsame Verantwortlichkeit; Pixel erst nach Consent laden; CAPI-Route prüft Consent-Flag | `cookieServices.marketing.metaPixel` | Opt-in |
| C9 | **Neu: Terminkalender** (Funktional) mit Anbieter; `ConsentEmbed` mit `service="booking"` und eigenem Platzhaltertext („Kalender laden“) | `cookieServices.functional.booking` | Drittanbieter-Code |
| C10 | **Neu, nur falls Drittanbieter-Widget:** Chat/Video. Eigenes Chat-Widget ohne Cookies braucht **keinen** Eintrag | – | § 165 Abs 3 Ausnahme |
| C11 | **Banner-Version** im Consent-Objekt (`v: "2026-11"`); bei Versionswechsel (neuer Dienst) Banner erneut zeigen | `saveConsent`, Initial-Load | Informiertheit bei neuen Diensten |
| C12 | **Consent-Protokoll** serverseitig: `POST /api/consent-log` mit zufälliger ID (im Consent-Cookie), Zeit, Version, Auswahl; keine IP speichern | neu | Art. 7 Abs 1 |
| C13 | Kein Advanced Consent Mode, kein Laden von gtag ohne Einwilligung; `gclid`/UTM in Formular-Payload nur mitsenden, wenn `consent.googleAds`/`metaPixel` true | `analytics.js`, Formular-Komponenten | keine Datenübermittlung ohne Einwilligung |
| C14 | `Cookies.embedText` ergänzen: „Dabei werden Daten (u. a. IP-Adresse) an Google übermittelt, auch in die USA.“ | `Cookies.embedText` | informierte Einwilligung |
| C15 | Übersetzungen FR/IT/EN aller Banner- und Dienst-Texte prüfen (CH-Romandie/Tessin, IT-Kunden) | `src/messages/*.json` | Art. 12 |
| C16 | Optional (Feinsteuerung Consent Mode v2): Google Ads in zwei Schalter teilen – „Messung“ (`ad_storage`, `ad_user_data`) und „Personalisierte Werbung“ (`ad_personalization`) | `sendConsentUpdate` | granularere Wahl; nicht zwingend [anwaltlich prüfen] |

---

## 5. Nötige Auftragsverarbeitungs- und sonstige Datenschutzverträge

| Dienst | Vertragspartner | Rolle | Vertrag | Drittland / Garantie | Status |
|---|---|---|---|---|---|
| Webhosting/Server (PM2) | [Hoster – ausfüllen] | AV | AVV Art. 28 | [EU?] | **offen** |
| Frappe-/ERPNext-Backoffice | [eigener Server bei … oder Frappe Cloud (Frappe Technologies Pvt. Ltd., Indien)] | AV | AVV; bei Frappe Cloud zusätzlich SCC (Indien ohne Angemessenheit) + Region EU wählen | [prüfen] | **offen** |
| Entwickler/Agentur mit Backoffice-Zugriff | [Name] | AV | AVV + Vertraulichkeit | – | **offen** |
| E-Mail-Postfächer (info@, Berater) | [M365/Google Workspace/Hoster] | AV | AVV (DPA im Kundenportal) | ggf. USA, DPF | **offen** |
| Google Analytics 4 | Google Ireland | AV | Google Ads Data Processing Terms (in GA-Konto annehmen) | DPF + SCC | prüfen, ob angenommen |
| Google Ads (Conversion, Enhanced Conversions) | Google Ireland | AV bzw. eigener Verantwortlicher | Data Processing Terms + Controller-Controller Terms; „Kundendatenrichtlinien“ für Enhanced Conversions akzeptieren | DPF + SCC | offen |
| Google Maps | Google Ireland | eigener Verantwortlicher | keine AVV; Maps-Nutzungsbedingungen | DPF | – |
| Meta Pixel/CAPI | Meta Platforms Ireland | gemeinsam (Art. 26) + Meta als AV für bestimmte Business-Tools | Business Tools Terms, **Controller Addendum**, Data Processing Terms | DPF + SCC | offen |
| Meta Page Insights | Meta Platforms Ireland | gemeinsam (Art. 26) | Page Insights Controller Addendum | DPF | prüfen |
| Brevo | Sendinblue SAS / GmbH | AV | DPA im Brevo-Konto „Rechtliches“ | EU [Unterauftragsverarbeiter prüfen] | offen |
| Terminbuchung | Cal.com, Inc. oder Alternative | AV | DPA (bei Cal.com auf Anfrage [prüfen]) | USA: DPF? sonst SCC + TIA | offen, **cal.eu-Einstellung klären** |
| Video | Microsoft / Google / Whereby / Daily | AV | DPA | je Anbieter | offen |
| WhatsApp Business App | WhatsApp Ireland | eigener Verantwortlicher | WhatsApp Business Terms | DPF | – |
| WhatsApp Business Platform (Cloud API) | Meta Platforms Ireland | AV | WhatsApp Business Data Processing Terms | DPF + SCC | nur falls genutzt |
| KI-Concierge | Anthropic (Commercial Terms + DPA) **oder** AWS EMEA SARL (Bedrock) | AV | DPA (bei Anthropic in Commercial Terms einbezogen [prüfen]); ggf. ZDR beantragen | USA (SCC) bzw. EU | offen |
| Objektspeicher Raumfotos | Hetzner / Exoscale / Cloudflare R2 EU | AV | AVV | EU | offen |
| KI-Bild-Cloud (Stufe 3) | z. B. Google (Gemini), fal, Replicate, BFL | AV | DPA + „kein Training“ | meist USA | später |
| Spam-Schutz (falls Turnstile) | Cloudflare, Inc. | AV | DPA | DPF + SCC | nur falls genutzt |
| Stripe | Stripe Payments Europe | AV + eigener Verantwortlicher | Stripe Services Agreement inkl. DPA | DPF + SCC | offen |
| PayPal | PayPal (Europe) S.à r.l. | eigener Verantwortlicher | Nutzungsbedingungen | – | – |
| Spediteure, Montagepartner | [Liste] | meist eigene Verantwortliche; Montage-Subunternehmer ggf. AV | Datenschutzklausel im Rahmenvertrag | CH: Angemessenheit | offen |
| Schweizer Steuervertreter | [Name] | eigener Verantwortlicher (Berufspflicht) | Mandatsvertrag mit Vertraulichkeit | CH: Angemessenheit | offen |
| Manufakturpartner Binni (Kosovo) | Binni | eigener Verantwortlicher oder AV | **SCC** (Kosovo ohne Angemessenheitsbeschluss), bevorzugt nur Projektdaten ohne Namen | Kosovo | **offen** |
| Steuerberatung/Buchhaltung | [Kanzlei] | eigener Verantwortlicher | – | – | – |
| Fotograf (Events) | [Name] | AV oder eigener Verantwortlicher | Vertrag mit Rechte- und Datenklausel | – | offen |

---

## 6. Verarbeitungsverzeichnis (Art. 30 DSGVO) – Einträge

Die Ausnahme für Unternehmen unter 250 Beschäftigten (Art. 30 Abs 5) greift **nicht**, weil die Verarbeitung nicht nur gelegentlich erfolgt. Verzeichnis führen; Muster der DSB/WKO verwenden. Technisch-organisatorische Maßnahmen (TOM) einmal zentral beschreiben und je Eintrag verweisen.

| Nr. | Tätigkeit | Zweck | Rechtsgrundlage | Betroffene | Datenkategorien | Empfänger | Drittland | Löschfrist |
|---|---|---|---|---|---|---|---|---|
| V01 | Website-Betrieb, Server-Logs | Auslieferung, Sicherheit | 6/1/f | Besucher | IP, Zeit, URL, User-Agent | Hoster | [–] | 14 T |
| V02 | Consent-Verwaltung | Nachweis Einwilligung | 6/1/c i. V. m. 7/1 | Besucher | Consent-ID, Zeit, Version, Auswahl | Hoster | – | Dauer + 3 J |
| V03 | Webanalyse GA4 | Reichweite, Lead-Messung | 6/1/a; § 165/3 TKG | Besucher | Online-Kennungen, Nutzungsdaten, Ereignisse | Google | USA (DPF) | 14 M |
| V04 | Google Ads | Werbeerfolg, Remarketing | 6/1/a | Besucher, Leads | Kennungen, gclid, Hash-E-Mail | Google | USA (DPF) | lt. Google; gclid wie Anfrage |
| V05 | Meta Pixel/CAPI | Werbeerfolg, Zielgruppen | 6/1/a; Art. 26 | Besucher, Leads | Kennungen, Ereignisse, Hash-E-Mail | Meta | USA (DPF) | lt. Meta |
| V06 | Kartendienst | Anfahrt | 6/1/a | Besucher | IP, Gerät | Google (eig. Verantw.) | USA | – |
| V07 | Anfragen (Kontakt, Produkt, Beratung, Chat-Übergabe, WhatsApp, Telefon) | Anfragebearbeitung, Angebot | 6/1/b | Interessenten | Stammdaten, Kontakt, Projektinfo | Frappe-Host, Hersteller/Planer | [Kosovo: SCC] | 12 M ohne Auftrag |
| V08 | Kundenverwaltung, Aufträge, Montage, Lieferung CH/FL | Vertragserfüllung | 6/1/b, c | Kunden | Stamm-, Vertrags-, Liefer-, Zahlungsdaten | Spediteure, Montage, Steuervertreter, Zoll | CH (Angemessenheit) | 7 J (BAO/UGB) |
| V09 | Zahlungsabwicklung, Gutscheine | Zahlung, Gutscheinverwaltung | 6/1/b, c, f | Käufer, Beschenkte | Zahlungs-, Bestell-, Gutscheindaten | Stripe, PayPal, TWINT | USA (Stripe, DPF/SCC) | 7 J / Gutscheinlaufzeit |
| V10 | Newsletter, E-Mail-Marketing | Direktwerbung | 6/1/a; § 174 TKG; Bestandskunden 6/1/f | Abonnenten | E-Mail, Interessen, Sprache, DOI-Protokoll, Öffnungen/Klicks | Brevo | EU | bis Widerruf + 3 J Nachweis |
| V11 | Terminbuchung | Termin | 6/1/b | Interessenten | Kontakt, Termin, Notiz | Kalender-Anbieter | [USA] | 6 M beim Anbieter |
| V12 | Video-Beratung | Beratung | 6/1/b | Interessenten | Bild/Ton (flüchtig), Kontakt | Video-Anbieter | [je nach Anbieter] | keine Aufzeichnung |
| V13 | KI-Concierge | Fragen beantworten, Übergabe | 6/1/b, f | Besucher | Chat-Inhalte, Metadaten | Anthropic / AWS | USA / EU | 30 T |
| V14 | KI-Raumplaner | Visualisierung | 6/1/b; Training 6/1/a | Kunden, ggf. Dritte auf Fotos | Raumfotos, Maße, Kontakt | Objektspeicher; Stufe 3 KI-Cloud | EU (Stufe 1) | 30/90 T |
| V15 | Bewertungsmanagement, Referenzen | Reputation | 6/1/a, f | Kunden | Name/Kürzel, Zitat | Google (eig. Verantw.) | USA | bis Widerruf |
| V16 | Veranstaltungen | Einladung, Organisation, Berichterstattung | 6/1/b, f; 9/2/a (Allergien) | Gäste | Kontakt, Begleitung, ggf. Allergien, Fotos | Fotograf, Social Media | USA (Meta) bei Veröffentlichung | 3 M / Allergien sofort |
| V17 | Social-Media-Seiten | Kommunikation, Statistik | 6/1/f; Art. 26 | Nutzer | Interaktionen, Nachrichten | Meta u. a. | USA | lt. Plattform |
| V18 | Betroffenenanfragen, Datenschutzvorfälle | Rechtspflichten | 6/1/c | alle | Anfrage, Identitätsnachweis | Rechtsanwalt | – | 3 J |
| V19 | Bewerbungen [falls] | Personalauswahl | 6/1/b; § 29 GlBG | Bewerber | Lebenslauf, Kontakt | – | – | 7 M |

**Daneben (nicht Website, aber Pflicht):** Personalverwaltung, Café-Kasse/Registrierkasse, Videoüberwachung des Showrooms (falls vorhanden: §§ 12, 13 DSG, Kennzeichnung, 72 h), Lieferantenverwaltung.

---

## 7. Datenschutz-Folgenabschätzung (Art. 35 DSGVO) – Schwellwertprüfung

| Verarbeitung | Kriterien (EDSA WP 248 / DSFA-V) | Ergebnis (Vorschlag) |
|---|---|---|
| KI-Raumplaner | neue Technologie, Daten aus dem privaten Wohnbereich, Dritte betroffen | **DSFA durchführen** vor Stufe 3; für Stufe 1 (lokal, manuell geprüft) kurze dokumentierte Prüfung |
| KI-Concierge | neue Technologie, Drittland, ggf. sensible Freitexte | **DSFA empfohlen** [anwaltlich prüfen, ob Pflicht] |
| Meta/Google Ads mit Hash-Abgleich | Zusammenführen von Datensätzen, Tracking über Websites | dokumentierte Schwellwertprüfung; DSFA empfohlen, falls Kundenlisten hochgeladen werden |
| Video-Beratung | Einblick in Privaträume, aber keine Aufzeichnung | Schwellwertprüfung, voraussichtlich keine DSFA |
| Events mit Fotos | Veröffentlichung, Kinder möglich | Schwellwertprüfung |

---

## 8. Schweizer Datenschutzgesetz (revDSG, in Kraft seit 01.09.2023) – was konkret gilt

1. **Anwendbarkeit:** Das DSG gilt auch für Sachverhalte im Ausland, die sich in der Schweiz auswirken (Art. 3 Abs 1 DSG). Platzhirsch spricht CH-Kunden gezielt an (CHF-Preise, Schweiz-Lieferservice, Regionsseiten Appenzell/Rheintal) → **DSG ist zusätzlich zur DSGVO zu beachten.** Inhaltlich deckt eine saubere DSGVO-Erklärung das meiste ab.
2. **Informationspflicht (Art. 19 DSG):** zusätzlich zur DSGVO ausdrücklich die **Staaten** nennen, in die Daten bekanntgegeben werden, und die Garantie (Art. 16 Abs 2) bzw. Ausnahme (Art. 17) – siehe Abschnitt 7 der Erklärung.
3. **Strafrecht – das ist der Unterschied zur DSGVO:** Vorsätzliche Verletzung der Informations- und Auskunftspflichten, Missachtung der Mindestanforderungen an die Datensicherheit oder Bekanntgabe ins Ausland entgegen Art. 16 können mit **Busse bis CHF 250.000 gegen die verantwortliche natürliche Person** (Geschäftsführung) geahndet werden (Art. 60–61 DSG). Für die Durchsetzung gegen eine Person mit Sitz in Österreich gibt es praktische Grenzen, das Risiko bei Einreise/Geschäft in der CH bleibt [anwaltlich prüfen].
4. **Vertreter in der Schweiz (Art. 14 DSG):** nur Pflicht, wenn **kumulativ** regelmäßige Bearbeitung, umfangreich **und** mit hohem Risiko für die Persönlichkeit, im Zusammenhang mit Angeboten in der CH. Für ein Einrichtungsstudio mit Anfrage-/Bestellverarbeitung voraussichtlich **nicht** erfüllt [anwaltlich prüfen, neu bewerten bei großem KI-Raumplaner-Betrieb].
5. **USA-Transfers:** USA seit 15.09.2024 in Anhang 1 DSV nur für **Swiss-US-DPF-zertifizierte** Empfänger. Bei jedem US-Anbieter prüfen, ob die Zertifizierung auch das **Swiss-US DPF** umfasst (separates Häkchen auf dataprivacyframework.gov). Sonst SCC mit Schweizer Anpassungen (EDÖB-Anerkennung 27.08.2021).
6. **Cookies in der Schweiz:** Art. 45c FMG verlangt nur Information und Ablehnungsmöglichkeit (Opt-out). Da Platzhirsch der DSGVO und dem TKG 2021 unterliegt, gilt ohnehin Opt-in – **ein Banner für alle**, keine eigene CH-Variante nötig.
7. **Verarbeitungsverzeichnis (Art. 12 DSG):** Ausnahme für Unternehmen < 250 Mitarbeitende, wenn kein hohes Risiko (Art. 24 DSV). Wegen DSGVO-Pflicht ohnehin vorhanden – Einträge um Spalte „Bekanntgabe ins Ausland (Staat)“ ergänzen.
8. **Datensicherheitsverletzungen:** Meldung an den EDÖB „so rasch als möglich“, wenn voraussichtlich hohes Risiko für CH-Personen (Art. 24 DSG) – zusätzlich zur 72-h-Meldung an die DSB. Ein gemeinsamer Notfallplan.
9. **Auskunft (Art. 25 DSG):** 30 Tage, kostenlos; Inhalt u. a. Herkunft der Daten, Aufbewahrungsdauer, Empfängerstaaten.
10. **Liechtenstein:** EWR → DSGVO direkt; Datenschutzstelle FL zuständig für Beschwerden von FL-Personen; keine Sonderregeln für die Website.

---

## 9. Was der Inhaber entscheiden oder liefern muss

**Liefern:**
1. Hausnummer (9 oder 11) und eine einheitliche Adresse.
2. Hosting-Anbieter der Website und des Frappe-Backoffice (Firma, Sitz, Rechenzentrum) und ob Frappe Cloud genutzt wird.
3. GA4: eingestellte Aufbewahrungsdauer, Status Google Signals, ob die Google-Datenverarbeitungsbedingungen angenommen sind.
4. Liste der Spediteure, Montagepartner, Steuervertreter CH, Fotografen; welche Daten an Binni gehen.
5. E-Mail-Anbieter (M365/Google/Hoster) und ob M365 mit EU Data Boundary vorhanden ist (wäre Alternative für Termine und Video).
6. Social-Media-Kanäle.
7. Postfach `datenschutz@platzhirsch.studio` anlegen, zuständige Person benennen.

**Entscheiden:**
1. Speicherfrist für Anfragen ohne Auftrag (Vorschlag 12 Monate) und ob das Backoffice automatisch löscht.
2. KI-Concierge: Claude API direkt (USA) oder über AWS Bedrock in der EU (empfohlen).
3. Terminbuchung: Cal.com mit US-Hosting oder EU-Alternative/Microsoft Bookings.
4. Newsletter: Öffnungs-/Klickmessung ja/nein; Bestandskunden-Werbung ja/nein.
5. Raumfotos: Löschfrist 30 oder 90 Tage; Trainingsoption weglassen (empfohlen).
6. Meta Pixel überhaupt ja/nein (erst mit Kampagnenstart einbauen).
7. Rechtsträger-Wechsel: Termin, und ob Newsletter-Einwilligungen neu eingeholt werden müssen (Anwalt).

**Beauftragen:** Rechtsanwalt/Rechtsanwältin für IT-/Datenschutzrecht (AT) zur Prüfung dieses Entwurfs, der Gutscheinbedingungen und der CH-Punkte; danach Übersetzung EN/FR/IT.

---

## Quellen (abgerufen 26.10.2026)

**Gesetze und Behörden**
- DSGVO (VO (EU) 2016/679), insb. Art. 6, 7, 9, 12–22, 26, 28, 30, 35, 44–49, 77 – <https://eur-lex.europa.eu/eli/reg/2016/679/oj>
- TKG 2021, BGBl I 190/2021, § 165 (Cookies), § 174 (unerbetene Nachrichten) – RIS: <https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20011678>
- österr. DSG (§§ 12, 13 Bildverarbeitung) – RIS: <https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10001597>
- DSFA-V, BGBl II 278/2018 – RIS
- BAO § 132, UGB § 212, ABGB §§ 933, 1478, 1489 – RIS
- TDDDG § 25; UWG (DE) §§ 5b, 7 – <https://www.gesetze-im-internet.de/ttdsg/__25.html>, <https://www.gesetze-im-internet.de/uwg_2004/__7.html>
- Schweiz: DSG SR 235.1 (Art. 3, 12, 14, 16, 17, 19, 21, 24, 25, 60, 61) – <https://www.fedlex.admin.ch/eli/cc/2022/491/de>; DSV SR 235.11 Anhang 1 – <https://www.fedlex.admin.ch/eli/cc/2022/568/de>; FMG Art. 45c
- EDÖB: Swiss-US Data Privacy Framework ab 15.09.2024 – <https://www.edoeb.admin.ch/en/15082024-new-swiss-us-data-privacy-framework>; Walder Wyss – <https://www.walderwyss.com/en/news/2024-08-14_federal-council-swiss-us-data-privacy-framework-in-force-on-15-september-2024>; Homburger – <https://homburger.ch/en/insights/new-swiss-u-s-data-privacy-framework>
- EU-Kommission: Angemessenheitsbeschluss EU-US DPF, Durchführungsbeschluss (EU) 2023/1795 vom 10.07.2023
- KI-Verordnung (EU) 2024/1689, Art. 50 – <https://eur-lex.europa.eu/eli/reg/2024/1689/oj>
- Österreichische Datenschutzbehörde – <https://www.dsb.gv.at>

**Rechtsprechung (Volltext in Curia/RIS/dejure prüfen)**
- EuGH C-311/18 *Schrems II* (16.07.2020); C-40/17 *Fashion ID* (29.07.2019); C-210/16 *Wirtschaftsakademie* (05.06.2018); C-673/17 *Planet49* (01.10.2019, Opt-in für Cookies); BGH VI ZR 225/17 (Feedback-Mail = Werbung)

**Anbieter**
- Anthropic: API und Datenaufbewahrung, ZDR – <https://platform.claude.com/docs/en/manage-claude/api-and-data-retention>; Datenresidenz/`inference_geo` – <https://platform.claude.com/docs/en/manage-claude/data-residency>; Aufbewahrung kommerziell – <https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data>
- AWS: Datenresidenz mit Claude auf Bedrock – <https://aws.amazon.com/blogs/machine-learning/enforcing-data-residency-with-single-region-claude-code-on-amazon-bedrock>
- Cal.com: <https://www.cal.eu/>; Hinweis zur Einstellung von cal.eu (Drittquelle) – <https://meetergo.com/en/magazine/cal-com-eu-hosting>; <https://cal.com/blog/gdpr-compliant-scheduling>
- Brevo: Double-Opt-in für externe Formulare – <https://help.brevo.com/hc/en-us/articles/27353832123026>; AVV-Muster – <https://www.brevo.com/de/wp-content/uploads/sites/3/2022/11/DPA-Sendinblue-Version-10.pdf>
- DPF-Liste (Zertifizierungen Google, Meta, Stripe, Cal.com, Anthropic, AWS prüfen) – <https://www.dataprivacyframework.gov/list>

**Interne Berichte:** 00, 18, 23, 26, digital/05 (Online-Beratung), 06 (KI-Raumplaner), 07 (E-Commerce), 10 (Performance-Marketing), 11 (CRM/Brevo), 14 (Recht & Compliance).
