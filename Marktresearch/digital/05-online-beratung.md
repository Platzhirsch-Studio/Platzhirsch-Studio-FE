# 05 – Online-Beratung und Concierge: Bauplan

**Stand:** 26.10.2026 · Rolle: digitale Verkaufsberatung im Luxus-Retail
**Grundlage:** Code in `src/` (gelesen, nicht verändert), Berichte 00, 01, 06, 20, 23 (Abschnitte 1, 4, 9, 10, 13), 25, Next.js-16-Doku in `node_modules/next/dist/docs/`, Web-Prüfung vom 26.10.2026.
**Kennzeichnung:** **[geprüft]** = heute im Code oder im Web nachgesehen. **[Bericht NN]** = aus dem Marktresearch. **[prüfen]** = vor der Umsetzung klären. **[Schätzung]** = eigene Herleitung.

> **Leitlinie.** Platzhirsch hat ca. 5 Leute. Jeder Kanal, den wir öffnen, muss gepflegt und beantwortet werden. Darum bauen wir **wenige Kanäle, die alle im selben Eingang landen** (Backoffice-Anfrage), statt fünf Inseln. Der Kunde soll in jedem Moment wählen können: **selbst buchen, schreiben, anrufen, fragen**. Ein Mensch übernimmt immer.

---

## 1. Ist-Zustand im Code

### 1.1 Beratungsstrecke `src/components/BeratungClient/BeratungClient.js` [geprüft]

Mehrstufiges Formular auf `/[locale]/beratung` (`src/app/[locale]/beratung/page.js`), Absenden an `src/app/api/beratung_anfrage/route.js` → Frappe `…doctype.anfrage.api.create_anfrage`.

| Schritt | Inhalt | Befund |
|---|---|---|
| 1 | „Bei meiner Anfrage geht es um“: Neubau / Renovierung / Anderes | Keine Frage nach **Raum oder Produktwelt** (Wohnen, Küche, Outdoor, Objekt) |
| 2 | „Projekt soll verwirklicht werden“: Einfamilienhaus / Wohnung / Gewerbe | Kein Land (AT/DE/CH/FL), kein Zeitrahmen, kein Budgetrahmen |
| 3 | Freitext, mind. 10 Zeichen | `?produkt=` von der Produktseite füllt den Text vor („Anfrage zu: …“), das ist gut |
| 4 | Vorname, Nachname, E-Mail, **Telefon (Pflicht)** | Telefon als Pflichtfeld kostet Abschlüsse; kein Datenschutzhinweis am Formular |
| 5 | Danke-Meldung, nach 5 s **zurück auf Schritt 1** | Keine nächste Handlung (Termin buchen, WhatsApp, Showroom-Route) |

Weitere Befunde:
- **Es gibt keine Terminbuchung.** Der Knopf „Termin“ in der mobilen Leiste (`src/components/Reusable/MobileCtaBar.js`) führt auf dieses Formular. Bericht 20: nur 4 von 22 Wettbewerbern haben einen echten Kalender.
- **Keine Wahl der Beratungsart** (Showroom, Video, Hausbesuch, Rückruf).
- **Übersetzte Labels werden als Werte gesendet** (`t.raw("step1Options")`): Ein Besucher auf `/en` schickt „a new build“ statt „einen Neubau“. Im Backoffice landen dieselben Antworten in vier Sprachen, Auswertungen werden unsauber.
- **Kein Zurück-Knopf** zwischen den Schritten; ein Klick in Schritt 1 springt nach 500 ms automatisch weiter.
- **Kein Spamschutz** (kein Honeypot, kein Rate-Limit) in allen vier API-Routen (`beratung_anfrage`, `anfrage_produkt`, `kontakt`, `newsletter_subscribe`).
- **Fehlertexte des Backoffice gehen ungefiltert an den Browser** (`error.message`, `details`), z. B. Frappe-Tracebacks.
- **Keine Herkunft und kein Kontext** im Payload: Sprache, Seite, Produkt-URL, Merkliste, Kampagne (UTM/gclid) fehlen. Bericht 23 (8.6) verlangt Lead-Herkunft als Pflichtfeld; das Backoffice hat dafür heute kein Feld.
- Conversion-Tracking ist neu da: `trackLead("beratung")` aus `src/lib/analytics.js` (GA4 `generate_lead`, nur mit Consent).

### 1.2 Andere Formulare [geprüft]
- **Produktanfrage / Merkliste** (`src/components/AnfrageFormProduct/AnfrageFormProduct.js` → `src/app/api/anfrage_produkt/route.js`): **8 Pflichtfelder** inkl. Telefon, Land, Stadt, **Adresse** und Kundentyp; bei „Geschäft“ zusätzlich Firma und **UID-Nummer**. Für eine erste Preis- oder Verfügbarkeitsfrage ist das zu viel. Adresse und UID braucht man erst für das Angebot.
- **Kontakt** (`src/components/Kontakt/kontakt.js` → `src/app/api/kontakt/route.js`): ok, Google Maps korrekt hinter `ConsentEmbed`.
- **Newsletter** (`src/components/Newsletter/newsletter.js`): Double-Opt-in laut Datenschutzerklärung.

### 1.3 Kontaktkanäle [geprüft]
- Telefon und E-Mail zentral in `src/lib/site.js`.
- **WhatsApp: kein Link auf der Website.** `listenForContactClicks()` in `src/lib/analytics.js` würde `wa.me`-Klicks bereits zählen, es gibt aber keinen.
- **Kein Live-Chat, kein Chatbot, keine Video-Beratung.**
- Datenschutzerklärung (`src/components/Datenschutz/datenschutz.js`) nennt Google Analytics und Newsletter, aber keine Kalender-, Chat- oder KI-Dienste. Jeder neue Dienst braucht dort einen Abschnitt.

### 1.4 Technische Voraussetzungen für den Concierge [geprüft]
- Katalog-Endpunkte sind **öffentlich lesbar ohne Zugangsdaten** (`allow_guest`): `get_produkte_by_kategorie`, `get_produkte_by_marke_api`, Produktsuche `searchProdukte` (`src/lib/api/fetchAllProdukte.js`), dazu Kategorien und Marken (`fetchKategorien.js`, `fetchMarkenData.js`). Die Navbar-Suche `src/app/api/shop-search/route.js` nutzt sie schon.
- Hosting: selbst betrieben mit PM2, **eine Instanz**, `max_memory_restart: 1G` (`ecosystem.config.js`). Vorteil: Streaming und lange Anfragen ohne Serverless-Timeouts; ein Rate-Limit im Speicher reicht. Nachteil: Speicher ist begrenzt, keine schweren ML-Modelle im Webprozess.
- Next.js 16: `middleware` heißt jetzt **`proxy.js`** (`03-api-reference/03-file-conventions/proxy.md`); `after()` aus `next/server` erledigt Arbeit nach der Antwort (Lead weiterleiten, Log schreiben) (`04-functions/after.md`); Route Handler können per `ReadableStream` streamen (`route.md`). `@next/third-parties` ist laut Doku weiterhin **experimentell**.
- `next.config.js` setzt `X-Frame-Options: DENY` (betrifft nur das Einbetten *unserer* Seite, nicht das Einbetten von Cal.com). Eine CSP gibt es nicht; wird eine eingeführt, braucht sie `frame-src`/`script-src` für den Kalender.

---

## 2. Benchmark

### 2.1 Was die Besten weltweit machen
| Anbieter | Beratung online | Beleg |
|---|---|---|
| **RH (Restoration Hardware)** | „Design Ateliers“ in den Galerien mit Stoff-/Materialbibliothek und privaten Beratungsräumen; kostenlose Interior-Design-Leistung als Mitglieder-Vorteil (200 $/Jahr USA). Projekte „anywhere in the world“ | [rh.com/interior-design/design-atelier](https://rh.com/interior-design/design-atelier) [geprüft] |
| **Bulgari** (Luxus-Benchmark außerhalb Möbel) | „Book a virtual appointment“: Video-Termin mit Store-Berater | [bulgari.com FAQ](https://www.bulgari.com/en-gb/faq/services/how-does-the-book-a-virtual-appointment-service-work) [geprüft] |
| **Minotti / Poliform** | Händlerverzeichnis, Kontakt über den Showroom. Poliform beschreibt als ersten Schritt ein Treffen mit einem Design Consultant. **Keine öffentliche Online-Buchung gefunden** | Web-Suche [geprüft, ohne Treffer] |
| **The Conran Shop** | Telefonverkauf (Telesales), Help Centre; keine Online-Beratung auf den Service-Seiten | [theconranshop.com/pages/our-services](https://theconranshop.com/pages/our-services) [geprüft] |
| **AmbienteDirect** | Telefon-Hotline DE/AT, Kontaktseite, FAQ; kein Chat, keine Termine sichtbar | [ambientedirect.com](https://www.ambientedirect.com/en/) [geprüft] |
| **Teo Jakob (CH)** | Calendly-Einbindung, Terminformular | Bericht 20 |

**Muster der Besten:** Die Luxusmarken verkaufen den **Termin**, nicht das Produkt. Online gibt es Inspiration und einen sehr kurzen Weg zum Menschen (Video, Showroom, Telefonverkauf). Ein **KI-Berater auf dem echten Sortiment** ist im Premium-Möbelhandel nirgends sichtbar – auch Online-Riesen wie AmbienteDirect setzen auf Telefon. Das ist eine offene Position.

### 2.2 Regionale Wettbewerber
| Wettbewerber | Online-Termin | Video | WhatsApp / Chat | Quelle |
|---|---|---|---|---|
| **Höttges** | ✗ – „Termin“-Knöpfe öffnen eine E-Mail an office@hoettges.at („Ich möchte einen Erst-Termin buchen“). Erstberatung 2 h, Mo–Fr 9:30–18 | ✗ | ✗ | [hoettges.at](https://www.hoettges.at) [geprüft] |
| **reiter design** | Website heute nicht erreichbar (DNS) | – | – | [nicht geprüft], Bericht 20 |
| **Gamma, Fretz, Bihler** | ✓ Online-Termin | k. A. | k. A. | Bericht 20 |
| **Dolce Vita, Hutle, Thöny, wohngefühl** | ✗ (online fast unsichtbar bzw. ohne Kalender) | ✗ | ✗ | Bericht 20, 23 |

**Ergebnis:** Kein Wettbewerber im Dreiländereck verbindet **Kalender + Video + WhatsApp + KI-Berater**. Schon der Kalender allein hebt Platzhirsch über Höttges, Dolce Vita und Hutle. Der Concierge ist ein Vorsprung, den ein 5-Personen-Händler nicht schnell kopiert, weil er den Katalog mit 1.765 Produkten voraussetzt.

---

## 3. Zielbild: „Platzhirsch Concierge“

Ein Beratungs-Erlebnis mit vier Türen und einem gemeinsamen Eingang:

```
 Produktseite / Merkliste / Stadtseite / Ratgeber
              │
   ┌──────────┼──────────────┬───────────────┐
   ▼          ▼              ▼               ▼
 Termin    KI-Concierge   WhatsApp       Telefon/Rückruf
 buchen    (fragt, sucht,  (Click-to-Chat, (bestehend +
 (Cal.com) empfiehlt,      Firmenhandy)    Rückruf-Wunsch)
   │       übergibt) ──────┘               │
   └──────────┴──────────┬─────────────────┘
                         ▼
     /api/beratung_anfrage (bestehend) → Frappe „Anfrage“
     Kanal, Sprache, Produkt, Land im Text, später als Felder
                         ▼
     Verkauf: Termin vorbereiten, Merkliste ansehen, nachfassen (3/14/45 Tage)
```

**Beratungsarten (im Kalender als „Event Types“):**
| Art | Dauer | Für wen | Hinweis |
|---|---|---|---|
| Showroom-Beratung | 60 min | Privatkunden Wohnen/Outdoor | auch Samstag (Bericht 23: Sa bis 17 Uhr testen), Café-Getränk inklusive als Gastgeber-Erlebnis |
| Planungstermin Küche / Gesamtprojekt | 120 min | Bauherren, Projekte | mit Grundriss-Upload (Fragenfeld) |
| **Video-Beratung mit Live-Rundgang** | 30–45 min | CH, FL, DE-Nordufer, Ferienimmobilien, Vorab-Qualifizierung | Link automatisch, Smartphone + Gimbal im Showroom |
| Hausbesuch / Aufmaß | 60–90 min | ab qualifiziertem Projekt | nur nach Videotermin oder Showroom-Besuch; PLZ-Abfrage |
| Rückruf | 15 min | wer nicht schreiben will | „Wir rufen Sie innerhalb von 2 Stunden zurück (Mo–Sa)“ |

**Tonalität:** Gastgeber, nicht Verkäufer. Keine Preise, keine Rabatte, keine Liefertermine, keine Händler-Behauptungen (Minotti/Poliform: „in unserer Ausstellung zu sehen“, „wir beraten Sie zu …“; nur ClassiCon „offizieller Händler“).

---

## 4. Konkrete Features

### F1 – Online-Terminbuchung mit Kalender (Showroom, Video, Hausbesuch, Rückruf)
- **Nutzen Umsatz:** Termine sind im Premium-Möbelhandel die Vorstufe jedes Auftrags. Selbstbuchung senkt die Hürde gegenüber dem 4-Schritt-Formular und verhindert das Ping-Pong per E-Mail. Samstag- und Abendslots sprechen DE/CH/FL-Kunden an (Bericht 20, 23). **Nutzen Ranking:** indirekt; „Termin buchen“ als Ziel auf allen Stadtseiten (Bericht 25, H4 verlangt echten Nutzen statt Austauschtext); Google-Unternehmensprofil kann den Buchungslink tragen [prüfen].
- **Aufwand:** **S–M** (Konto + 5 Event Types + Einbindung + Webhook: 3–5 Personentage).
- **Abhängigkeiten:** Kalender der Berater (Google Workspace oder Microsoft 365) [prüfen, welcher vorhanden ist]; AVV mit dem Anbieter; Datenschutzerklärung ergänzen. **Kein Backoffice-Zugang nötig**: Der Webhook legt die Buchung über den bestehenden Endpunkt `create_anfrage` als Anfrage an (Kanal/Art im Beschreibungstext).
- **Anbieter-Vergleich:**

| Option | Kosten | Datenschutz | Pflege | Urteil |
|---|---|---|---|---|
| **Cal.com Cloud** | Free (1 Nutzer); **Teams 12 $/Nutzer/Monat** (jährlich), Routing Forms erst ab Teams ([cal.com/pricing](https://cal.com/pricing) [geprüft]) | „US & EU hosting“ angeboten, welcher Plan [prüfen]; AVV | gering | **Empfehlung**: Round-Robin über 3–4 Berater, Embed in React, Webhooks, Mehrsprachigkeit |
| Cal.com selbst gehostet | 0 € Lizenz | volle Kontrolle | **hoch** (Postgres, Updates). Das öffentliche Repo heißt jetzt „Cal.diy“ (MIT) und wird ausdrücklich für „personal, non-production use“ empfohlen ([github.com/calcom/cal.com](https://github.com/calcom/cal.com) [geprüft]) | **Nicht** für ein 5-Personen-Team |
| Calendly | ca. 10–16 $/Nutzer [prüfen] | US-Anbieter (EU-US Data Privacy Framework) [prüfen] | gering | Alternative, weniger flexibel beim Einbetten und bei Webhooks im kleinen Plan |
| Frappe/ERPNext „Appointment“ (Appointment Booking Settings, öffentliche Seite `/book_appointment`) [eigene Kenntnis, prüfen] | 0 € | Daten im eigenen Backoffice | mittel | Ideal für die Datenhaltung, **aber blockiert**: braucht Backoffice-Zugang, UX schlicht, keine Round-Robin-Logik, kein Video-Link. Später als Ziel des Webhooks |

- **Umsetzung:**
  - Neue Komponente `src/components/Booking/BookingEmbed.js` (Client): lädt `@calcom/embed-react` erst nach Klick auf „Kalender laden“ bzw. nach Funktional-Consent (gleiches Muster wie `src/components/Cookies/ConsentEmbed.js`, neuer Service `calCom` in `src/components/Cookies/cookiecomponent.js`).
  - Vorbefüllung per URL-Parameter: Name, E-Mail, Sprache, Notiz „Produkt: …“ aus `?produkt=`.
  - Ereignis `bookingSuccessful` des Embeds → `trackLead("termin", { type })` in `src/lib/analytics.js`.
  - Webhook-Route `src/app/api/cal-webhook/route.js`: Signatur prüfen (Secret in `.env`), Buchung in das bestehende Anfrage-Format übersetzen und mit `after()` an `create_anfrage` weiterleiten. Fallback: E-Mail an `info@` macht Cal.com selbst.
  - Einbindung: `src/app/[locale]/beratung/page.js` (Tab „Termin buchen“ vor dem Formular), `src/components/Reusable/MobileCtaBar.js` (Knopf „Termin“ → Kalender), Produktseite `src/app/[locale]/produkte/[category]/[product]/page.js` („Video-Beratung zu diesem Stück“), Stadtseiten `src/app/[locale]/designermoebel-*`, `src/components/CartPage/CartPage.js` („Merkliste im Showroom ansehen – Termin buchen“).
  - Texte in `src/messages/{de,en,fr,it}.json`.
- **Bibliotheken:**

| Paket | Version | Lizenz | Größe |
|---|---|---|---|
| `@calcom/embed-react` | 1.5.3 | „SEE LICENSE IN LICENSE“ (Cal.com-Lizenz) [prüfen] | Wrapper 18 kB entpackt; lädt `embed.js` von Cal.com zur Laufzeit (ca. 30–60 kB gz [Schätzung, messen]) – **nur nach Klick**, damit LCP/INP unberührt bleiben |
| Alternative ohne Paket | – | – | `<iframe>`/Link auf `cal.com/platzhirsch/…` – 0 kB, verliert aber das `bookingSuccessful`-Ereignis |

### F2 – Beratungsstrecke und Formulare überarbeiten
- **Nutzen Umsatz:** mehr abgeschlossene Anfragen, bessere Qualifizierung (Raum, Land, Zeitrahmen), schnelleres Nachfassen. **Nutzen Ranking:** keiner direkt; bessere Conversion verbessert Ads-Kosten pro Anfrage (Bericht 23, 9: Ads nur mit Tracking).
- **Aufwand:** **S** (2–3 Personentage).
- **Abhängigkeiten:** keine für die Oberfläche. Für **echte Felder** (Kanal, Land, Zeitrahmen, Budget, Sprache, Produkt-ID) braucht das Backoffice neue Felder → bis dahin strukturiert im Beschreibungstext übertragen (z. B. Block `--- Kontext ---`).
- **Änderungen:**
  1. Neuer Schritt 0 „Wie möchten Sie beraten werden?“ (Showroom / Video / Hausbesuch / Rückruf / schriftlich). Showroom und Video springen direkt in F1, mit Projektangaben vorausgefüllt.
  2. Schritt 1 um **Wohnbereich** erweitern (Wohnen, Küche, Schlafen/Ankleide, Outdoor, Licht, Gesamtprojekt, Hotel/Objekt).
  3. Schritt 2 um **Land** (AT, DE, CH, FL) und **Zeitrahmen** (sofort / 3 Monate / 6–12 Monate / später). Budget optional und als Spanne.
  4. **Stabile Schlüssel statt übersetzter Labels** senden (`new_build`, `renovation`, …), Anzeige über `t()`. Für das Backoffice deutsch übersetzen, damit die vorhandenen Werte gleich bleiben.
  5. **Telefon optional** („E-Mail oder Telefon“), Zurück-Knopf, keine Auto-Weiterleitung nach 500 ms.
  6. **Kontext automatisch:** Sprache, Seite, Produkt (`?produkt=`), Merkliste aus `src/context/CartContext.js`, `utm_*`/`gclid` (nur mit Consent gespeichert).
  7. **Danke-Seite mit nächstem Schritt:** „Jetzt Termin wählen“, „Per WhatsApp weiterschreiben“, Route zum Showroom; nicht nach 5 s zurücksetzen.
  8. **Datenschutzhinweis** unter dem Absenden-Knopf (Informationspflicht Art. 13 DSGVO, Link auf `/datenschutz`), keine Einwilligungs-Checkbox nötig (Vertragsanbahnung, Art. 6 Abs. 1 lit. b).
  9. **Spamschutz:** unsichtbares Honeypot-Feld + Zeitprüfung (< 3 s = Bot) + IP-Rate-Limit in allen vier API-Routen.
  10. **Backoffice-Fehler nicht durchreichen**, nur eine neutrale Meldung; Details ins Server-Log.
  11. **Produktanfrage entschlacken** (`AnfrageFormProduct.js`, `api/anfrage_produkt/route.js`): Pflicht nur Name, E-Mail **oder** Telefon, Land; Adresse, Stadt, UID optional („für das Angebot später“). Achtung: Die Pflichtprüfung im Backoffice-Endpunkt muss das zulassen [prüfen mit Testanfrage; sonst Platzhalter „wird nachgereicht“].
- **Dateien:** `src/components/BeratungClient/BeratungClient.js`, `src/app/api/beratung_anfrage/route.js`, `src/components/AnfrageFormProduct/AnfrageFormProduct.js`, `src/app/api/anfrage_produkt/route.js`, `src/app/api/kontakt/route.js`, `src/app/api/newsletter_subscribe/route.js`, `src/messages/*.json`; neu `src/lib/leadContext.js` (Kontext sammeln), `src/lib/rateLimit.js`, `src/lib/spamGuard.js`.
- **Bibliotheken:**

| Paket | Version | Lizenz | Größe |
|---|---|---|---|
| `rate-limiter-flexible` | 11.2.3 | ISC | nur Server, 0 kB Client; Speicher-Limiter reicht bei einer PM2-Instanz |
| `zod` (Validierung in den Routen) | 4.6.7 | MIT | nur Server, 0 kB Client |

### F3 – WhatsApp Business (Click-to-Chat)
- **Nutzen Umsatz:** In AT/CH/DE ist WhatsApp der bevorzugte Kanal für schnelle Fragen („Ist das Sofa in der Ausstellung?“, Fotos vom Raum). Niedrige Hürde, hohe Antwortquote, Fotos und Grundrisse kommen direkt. Kein regionaler Wettbewerber bietet es sichtbar an. **Nutzen Ranking:** keiner direkt.
- **Aufwand:** **S** für Stufe 1 (1 Tag), **M** für Stufe 2.
- **Stufe 1 (sofort):** WhatsApp-Business-**App** auf einem **eigenen Firmenhandy** (keine privaten Kontakte darauf, weil die App das Adressbuch abgleicht), Profil mit Adresse/Öffnungszeiten, Kurzantworten, Abwesenheitsnotiz außerhalb der Öffnungszeiten, Label „Neu / Termin / Angebot“. Auf der Website: `https://wa.me/43…?text=` mit vorbefülltem Text („Hallo, ich interessiere mich für Minotti Lawrence – [URL]“). Keine Skripte, keine Cookies, keine Einbettung. Klicks zählt `listenForContactClicks()` schon.
- **Stufe 2 (bei Volumen > ca. 20 Chats/Tag):** WhatsApp Business Platform (Cloud API) über einen EU-Anbieter mit Team-Postfach, damit mehrere Berater parallel antworten und Chats ins Backoffice gehen. Preise: Servicegespräche (Kunde schreibt zuerst) waren laut Meta kostenlos; eine Quelle meldet Änderungen für die EU ab 2026, Marketing ca. 0,06 $/Nachricht in AT ([Meta Pricing](https://developers.facebook.com/docs/whatsapp/pricing), [Übersicht](https://docs.sent.dm/docs/guides/whatsapp-pricing)) [prüfen, Angaben widersprüchlich].
- **Abhängigkeiten:** eigene Telefonnummer (Festnetz +43 5574 46255 ist möglich, wenn sie per Anruf verifiziert wird [prüfen]); Antwortzeit-Regel im Team; Absatz in der Datenschutzerklärung (Meta als eigenständig Verantwortlicher, Nutzer startet den Chat selbst).
- **Dateien:** `src/lib/site.js` (`WHATSAPP_NUMBER`, `whatsappHref(text)`), `src/components/Reusable/MobileCtaBar.js` (drei Knöpfe: Anrufen / WhatsApp / Termin), Produktseite (`src/components/ShopCatalog/productActions.js`), `src/components/Kontakt/kontakt.js`, Footer `src/components/Reusable/Footer`, Danke-Zustände aus F2.
- **Bibliotheken:** keine (0 kB). Kein Widget von Drittanbietern einbauen – die bekannten „WhatsApp-Bubbles“ laden fremdes JavaScript vor dem Consent.

### F4 – Video-Beratung mit Live-Showroom-Rundgang
- **Nutzen Umsatz:** Öffnet Kunden, die nicht nach Lochau fahren (Zürich, St. Gallen, Graubünden, Ferienimmobilien Arlberg, DE-Nordufer). Qualifiziert vor dem teuren Hausbesuch. Luxus-Standard (Bulgari, RH). **Nutzen Ranking:** ein aufgezeichneter Rundgang als Video auf `/beratung` und den Markenseiten liefert Inhalt für Google-Videosuche (JSON-LD `VideoObject`) [Schätzung].
- **Aufwand:** **S** technisch (Video-Link kommt aus F1), **M** organisatorisch (Ablauf, Technik, Übung).
- **Technik:** Cal.com erzeugt den Link (Cal Video, Google Meet oder Microsoft Teams – je nachdem, was der Betrieb nutzt [prüfen]). Kein eigenes Video-SDK einbauen. Hardware ca. 300–500 €: Smartphone-Gimbal, Funk-Ansteckmikrofon, WLAN-Test im ganzen Showroom (inkl. Café), Ringlicht für den Beratertisch [Schätzung].
- **Ablauf (Skript):** Vorab 3 Fragen per Buchungsformular (Raum, Fotos/Grundriss, Wunschmarken) → Berater stellt eine Route durch die passenden Vignetten zusammen → 30–45 min live → Zusammenfassung per E-Mail mit Produktlinks und Merkliste → Angebot oder Showroom-Termin. Keine Kunden anderer Besucher im Bild (Bildrechte, Persönlichkeitsrecht), keine Aufzeichnung ohne Zustimmung.
- **Aufgezeichneter Rundgang (Ergänzung):** 2–3 min Showroom-Film; selbst gehostet als MP4 in `public/` oder YouTube-nocookie hinter `ConsentEmbed`. Herstellerprodukte im eigenen Showroom zu filmen ist in der Regel unproblematisch; Marken-Logos/Kampagnenbilder dagegen nur mit Freigabe [prüfen].
- **Bibliotheken (nur falls später eine eingebettete Videositzung gewünscht ist):** `@whereby.com/browser-sdk` 3.34.1 (MIT, Anbieter in Norwegen/EU) oder `@daily-co/daily-js` 0.94.0 (BSD-2-Clause, US). Beide schwer (> 100 kB gz [Schätzung]) – **heute nicht empfohlen**, ein Link reicht.

### F5 – KI-Concierge auf dem eigenen Katalog
- **Nutzen Umsatz:** Beantwortet rund um die Uhr in 4 Sprachen die Fragen, die heute niemand beantwortet („Welches Minotti-Sofa passt in 3,20 m?“, „Habt ihr Outdoor-Schirme für Seewind?“, „Welche Poliform-Schränke gibt es mit Glasfront?“). Führt zu Produktseiten, Merkliste und **Termin** – der Concierge ist ein Termin-Vermittler, kein Verkäufer. **Nutzen Ranking:** indirekt: längere Verweildauer, mehr interne Klicks; die häufigsten Fragen aus den Protokollen werden Ratgeber-Seiten (Bericht 25, H5). Alleinstellung, die kein Wettbewerber im Benchmark hat.
- **Aufwand:** **M** für die erste Version (8–12 Personentage), **L** mit Übergabe ins Backoffice und Auswertung.
- **Architektur:**
  - **Route** `src/app/api/concierge/route.js` (Node-Runtime, streamt per `ReadableStream`). Modell über das offizielle SDK `@anthropic-ai/sdk`, **`claude-opus-5-5`** mit `output_config.effort: "low"` für Chat. Kostengünstigere Alternativen `claude-sonnet-5-5` oder `claude-haiku-5-5` sind eine Entscheidung des Inhabers nach einem Test mit echten Fragen. Server-seitige `fallbacks` für den Fall einer Ablehnung aktivieren (siehe SDK-Doku).
  - **Werkzeuge (Tool Use), die der Server ausführt** – das Modell sieht nur, was diese liefern:
    - `search_products(query, brand?, category?, max_width_cm?)` → lokaler Suchindex (s. u.), Rückgabe: Name, Marke, Kategorie, Maße, Materialien, URL, Bild.
    - `get_product(slug)` → Produktdetail aus dem bestehenden Endpunkt.
    - `showroom_info()` → statische Fakten aus `src/lib/site.js` + Öffnungszeiten, Anfahrt, Dreiländer-Service-Text (aus Bericht 18/23, freigegeben).
    - `offer_booking(type, note)` → gibt einen vorbefüllten Cal.com-Link zurück (F1).
    - `handover(summary, channel)` → **nur nach ausdrücklicher Zustimmung im Chat** und mit Name + E-Mail/Telefon: Anfrage über `create_anfrage` mit Zusammenfassung und Produktliste; alternativ WhatsApp-Link mit vorbefülltem Text.
  - **Suchindex („RAG“) ohne Vektordatenbank:** Beim Start und stündlich (`revalidate: 3600`, Tag `products`) alle Kategorien über `get_produkte_by_kategorie` laden, kompakte Datensätze bilden (ca. 1.765 × 60–120 Tokens) und in **MiniSearch** (BM25, Fuzzy, Präfix) indexieren. Mehrsprachigkeit übernimmt das Modell: Es formuliert die Suchanfrage selbst in deutsche/italienische Fachbegriffe und Modellnamen um. Das reicht für einen Katalog dieser Größe und kostet keinen Speicher-intensiven ML-Prozess auf dem Server.
  - **Stufe 2 Semantik (nur wenn die Tests Lücken zeigen):** Embeddings **offline auf dem lokalen Windows-PC mit NVIDIA-GPU** berechnen (Modell `BAAI/bge-m3`, MIT, mehrsprachig; Python `sentence-transformers`), als komprimierte JSON-Datei ablegen; Hybrid-Suche mit **Orama**. Für die Anfrage-Embeddings zur Laufzeit wäre ein kleines ONNX-Modell im Server nötig (`@huggingface/transformers` 4.3.1, Apache-2.0) – wegen `max_memory_restart: 1G` vorher Speicher messen, ggf. eigener kleiner Dienst. Anthropic bietet keine eigenen Embeddings an; ein externer Embedding-Dienst wäre ein weiterer Auftragsverarbeiter.
  - **Prompt-Caching:** System-Prompt und Werkzeugliste stabil halten und mit `cache_control` cachen; keine Zeitstempel im System-Prompt (sonst wird der Cache ungültig).
  - **Oberfläche:** eigene, kleine Komponente `src/components/Concierge/ConciergeLauncher.js` (Knopf „Fragen an den Concierge“) und `ConciergePanel.js`, per `next/dynamic` **erst nach Klick** geladen. Produktvorschläge als Karten aus den strukturierten Werkzeug-Ergebnissen (Bild, Name, „Ansehen“, „Auf Merkliste“, „Termin“) – kein Markdown-Renderer nötig. Einbindung in `src/app/[locale]/client-layout.js` neben `MobileCtaBar`.
- **Leitplanken (System-Prompt + Server-Prüfung):**
  1. **Keine Preise, Rabatte, Liefertermine oder Verfügbarkeitszusagen.** Standardantwort: „Preise hängen von Ausführung und Stoff ab – wir erstellen Ihnen gerne ein Angebot“ + Termin/Anfrage. (Das Backoffice hat ohnehin kein Preisfeld.)
  2. **Keine Händler-Behauptungen:** nie „offizieller/autorisierter Händler“ außer ClassiCon; Formulierungen wie „in unserer Ausstellung in Lochau zu sehen“ nur, wenn das Ausstellungs-Flag existiert – bis dahin „wir beraten Sie gerne zu …“. Serverseitiger Filter auf Wortlisten („autorisiert“, „offizieller Händler“, „€“, „CHF“, „Rabatt“) mit Ersatztext und Protokolleintrag.
  3. **Nur Katalogfakten:** Maße, Materialien, Designer nur aus Werkzeug-Ergebnissen; sonst „Das klären wir im Termin“.
  4. **Keine Wettbewerber nennen oder bewerten**, keine Rechts-/Steuerberatung (Zoll/MWST nur mit freigegebenem Text + Hinweis „verbindlich im Angebot“).
  5. **Übergabe an Menschen** bei Kaufabsicht, Beschwerde, Reklamation, Projekten > 1 Raum, Unsicherheit – während der Öffnungszeiten Rückruf/WhatsApp, sonst Termin.
  6. **Prompt-Injection:** Nutzereingaben nie als Anweisung, Werkzeuge nur lesend außer `handover` (das braucht ein Bestätigungs-Klick im UI, nicht nur Modelltext).
  7. **Kostenbremse:** max. 12 Nachrichten pro Sitzung, max. 2.000 Zeichen pro Nachricht, IP-Rate-Limit, Tageslimit für die API-Ausgaben, Abschaltschalter per Umgebungsvariable.
- **Kosten [Schätzung]:** `claude-opus-5-5` kostet 4 $ / 20 $ pro Mio. Tokens (Input/Output), Cache-Lesen 0,20 $. Eine Runde mit ca. 4.000 gecachten + 2.500 neuen Input-Tokens und 400 Output-Tokens ≈ 0,02 $; ein Gespräch mit 5 Runden und Werkzeugaufrufen ≈ 0,10–0,30 $. Bei 500 Gesprächen/Monat ≈ **50–150 $/Monat**. Sonnet 5.5 (2 $/10 $) etwa halb so teuer, Haiku 5.5 (0,10 $/0,50 $) deutlich günstiger – Qualität vorher mit 50 echten Fragen vergleichen.
- **Abhängigkeiten:** Anthropic-API-Konto und AVV (Commercial Terms/DPA), Datenschutz-Folgeabschätzung light, Datenschutzerklärung, KI-Hinweis (s. Risiken), **freigegebene Textbausteine** (Dreiländer-Service, Lieferung, Finanzierung). Für bessere Antworten später Backoffice-Felder **Ausstellungs-Flag, Lieferzeit-Spanne, Pflegehinweise** (dieselben wie in Bericht 25, H1).
- **Qualitätssicherung:** Testsatz mit 100 Fragen (25 je Sprache, inkl. Fangfragen nach Preis, Händlerstatus, Rabatt, Wettbewerbern) – lokal auf dem PC automatisiert gegen die Route laufen lassen, vor jedem Prompt-Update. Wöchentlich 30 min: 10 Protokolle lesen, Lücken in Ratgeber-Ideen übertragen.
- **Bibliotheken:**

| Paket | Version | Lizenz | Größe Client |
|---|---|---|---|
| `@anthropic-ai/sdk` | 1.3.0 | Apache-2.0 | 0 kB (nur Server) |
| `minisearch` | 7.2.0 | MIT | 0 kB (nur Server; 5,8 kB gz laut Bundlephobia) |
| `zod` | 4.6.7 | MIT | 0 kB (nur Server, Tool-Eingaben prüfen) |
| `rate-limiter-flexible` | 11.2.3 | ISC | 0 kB (nur Server) |
| eigene UI-Komponenten | – | – | ca. 8–12 kB gz [Schätzung], erst nach Klick geladen |
| Stufe 2: `@orama/orama` | 3.1.18 | Apache-2.0 | 0 kB (Server) |
| Stufe 2: `@huggingface/transformers` | 4.3.1 | Apache-2.0 | 0 kB Client, aber Modell im Server-Speicher |
| bewusst **nicht**: `ai` (Vercel AI SDK) 7.0.153, Apache-2.0 | – | – | zusätzliche Abstraktion ohne Nutzen bei einem einzigen Anbieter |

### F6 – Live-Chat mit Menschen: bewusst **nicht** als eigenes Widget
- Ein klassisches Live-Chat-Fenster verlangt sofortige Antworten während der Öffnungszeiten. Mit ca. 2–3 Verkaufskräften, die gleichzeitig Showroom-Kunden betreuen, wird es zur Enttäuschung („Wir sind gleich für Sie da …“).
- **Stattdessen:** Concierge (F5) beantwortet sofort, **übergibt** an WhatsApp (F3) oder Rückruf. Damit hat das Team **ein** schriftliches Postfach (WhatsApp) statt zwei.
- **Falls später doch gewünscht** (Volumen, eigene Online-Kraft ab M12 laut Bericht 23, 13): Chatwoot (MIT, Cloud oder selbst gehostet, kann WhatsApp-Cloud-API, E-Mail und Web-Chat in ein Postfach bündeln) oder Crisp (Frankreich, EU). Widget nur als Fassade laden (Knopf, Skript erst nach Klick), Größe der Widget-Skripte typisch 50–150 kB [Schätzung, messen].
- **Aufwand:** S (Einbau), aber **laufend hoch** im Team. **Empfehlung: zurückstellen.**

### F7 – Rückruf-Service und Antwortversprechen
- **Nutzen Umsatz:** Viele Premium-Kunden wollen telefonieren, aber nicht in die Warteschleife. „Rückruf innerhalb von 2 Stunden (Mo–Sa, Öffnungszeiten)“ ist ein Versprechen, das Höttges & Co. nicht geben. **Aufwand:** **S** (Event Type „Rückruf 15 min“ in F1 oder ein Schritt in F2). **Abhängigkeiten:** Teamregel und Vertretung. **Dateien:** wie F1/F2.

### F8 – Messen und Lead-Herkunft
- **Nutzen:** Ohne Messung kein Ads-Budget (Bericht 23, 9). **Aufwand:** **S**.
- GA4-Ereignisse über `src/lib/analytics.js`: `booking_start`, `generate_lead` mit `form: "termin" | "beratung" | "concierge" | "rueckruf"`, `concierge_open`, `concierge_product_click`, `concierge_handover`, `contact_click` (WhatsApp vorhanden).
- In jeder Anfrage ein Kontextblock (Kanal, Sprache, Land, Seite, Kampagne) → später echte Backoffice-Felder **Lead-Herkunft, Land, Kanal** (Bericht 23, 8.6).
- Monatlich: Termine je Art, No-Show-Quote, Anfragen je Kanal, Termine → Angebote → Aufträge.

---

## 5. Risiken

### Performance
- Fremde Skripte (Kalender, Chat, Video) nie beim Seitenaufruf laden, **nur nach Klick** (Fassade). So bleiben LCP/INP aus dem Relaunch erhalten.
- Concierge-Route: Streaming, Zeitlimit für Backoffice-Aufrufe (wie `AbortSignal.timeout(15000)` in `fetchAllProdukte.js`), Index im Speicher klein halten (ca. 1–3 MB [Schätzung]); PM2-Grenze 1 GB beachten.
- Backoffice-Ausfall: Concierge antwortet dann ohne Produktsuche mit Termin-/Telefon-Hinweis statt Fehler.

### Recht (keine Rechtsberatung – mit Anwalt/Datenschutzberater abstimmen)
- **DSGVO:** Für Cal.com, Anthropic und ggf. Chat-Anbieter **AVV** abschließen und im Verzeichnis der Verarbeitungstätigkeiten eintragen. Drittlandübermittlung (USA) über EU-US Data Privacy Framework bzw. Standardvertragsklauseln [prüfen je Anbieter]. EU-Hosting bei Cal.com wählen, wenn im Plan verfügbar [prüfen]. Bei Anthropic prüfen, ob eine Inferenz-Region in der EU wählbar ist und welche Aufbewahrungsfristen gelten [prüfen].
- **Rechtsgrundlagen:** Terminbuchung und Anfrage = Vertragsanbahnung (Art. 6 Abs. 1 lit. b). Concierge = berechtigtes Interesse bzw. vom Nutzer gestartet; vor dem ersten Satz Hinweis „Sie chatten mit einer KI. Bitte keine sensiblen Daten eingeben. [Datenschutz]“. Einbettung des Kalenders vor Klick wäre Cookie-/Endgerätezugriff → nur nach Klick/Consent (§ 165 Abs. 3 TKG 2021 in AT, TDDDG in DE).
- **EU-KI-Verordnung (AI Act), Art. 50:** Transparenzpflicht – Menschen müssen wissen, dass sie mit einer KI interagieren; gilt ab 2. August 2026, also **jetzt**. Kennzeichnung im Chatfenster dauerhaft sichtbar.
- **Protokolle:** Chatverläufe nur so lange speichern wie nötig (Vorschlag: 30 Tage, nur ohne Namen; bei Übergabe die Zusammenfassung in der Anfrage). Auskunfts- und Löschprozess festlegen.
- **UWG/Markenrecht:** Concierge und alle Texte ohne Händler-Behauptung (Bericht 25, Spielregeln). Keine Preis- oder Lieferzusagen durch die KI – eine falsche KI-Aussage kann als Zusage des Unternehmens gelten [prüfen]. Disclaimer allein schützt nicht, darum serverseitige Filter.
- **Bildrechte:** Concierge zeigt nur Bilder, die bereits auf den Produktseiten stehen; wird das Bildrecht einer Marke widerrufen, verschwindet es überall gleichzeitig. Keine KI-generierten Raumbilder mit Markenprodukten (Bericht 23, 10: KI-Raumplaner erst nach Bildfreigabe).
- **Video:** Keine Aufzeichnung ohne Zustimmung; andere Showroom-Besucher nicht filmen.
- **WhatsApp:** Firmenhandy ohne private Kontakte; Marketing-Nachrichten nur mit eigener Einwilligung.

### Pflege und Team
| Kanal | laufender Aufwand [Schätzung] | Verantwortlich |
|---|---|---|
| Kalender | 1 h/Woche (Verfügbarkeiten, Urlaube), Termine vorbereiten | Verkauf |
| Video-Beratung | 45–60 min pro Termin inkl. Nachbereitung | Verkauf |
| WhatsApp | 20–40 min/Tag, Antwort innerhalb von 2 h in den Öffnungszeiten | Verkauf (Rotation) |
| Concierge | 30 min/Woche Protokolle lesen; 1–2 h/Monat Prompt/Textbausteine (Entwickler) | Marketing/Online + Entwicklung |
| Rückruf | nach Volumen | Verkauf |

- **Grenze:** Bericht 23 erlaubt höchstens 3–4 neue Initiativen pro Quartal. Darum F1–F3 + F7 + F8 im Q4 2026, F5 im Q1 2027.
- **Abhängigkeit von Anbietern:** Webhook und Concierge so bauen, dass Kalender- oder Modellanbieter austauschbar bleiben (alles mündet in `create_anfrage`).

---

## 6. Priorisierte Reihenfolge

### Sofort baubar ohne Backoffice-Zugang
| # | Feature | Aufwand | Warum jetzt |
|---|---|---|---|
| 1 | **F2 Beratungsstrecke + Formulare** (Kontext im Text, Spamschutz, Telefon optional, Danke-Seite mit nächstem Schritt, Produktanfrage entschlacken) | S | Sofort mehr und bessere Anfragen, Voraussetzung für alles andere |
| 2 | **F3 WhatsApp Click-to-Chat** (Stufe 1) | S | 1 Tag, 0 kB, kein Wettbewerber hat es |
| 3 | **F1 Online-Terminbuchung** (Cal.com Cloud, Webhook → bestehender `create_anfrage`) inkl. **F7 Rückruf** | S–M | Masterkonzept 9 (4), Vorsprung vor Höttges; vor dem Adventsabend 26.11. und dem Samstag-Test ab KW 46 live |
| 4 | **F8 Messen** (GA4-Ereignisse, Kontextblock) | S | Grundlage für Ads ab Q1 2027 |
| 5 | **F4 Video-Beratung** (Prozess, Technik, Rundgang-Film) | S/M | Hebel für CH/FL/Nordufer, nur Hardware + Übung |
| 6 | **F5 KI-Concierge MVP** (Katalog-Endpunkte sind öffentlich, Suchindex lokal, Übergabe über bestehenden Endpunkt) | M | Q1 2027 nach Testsatz; vorher AVV und KI-Hinweis |

### Blockiert oder verbessert durch Backoffice-Zugang / Dritte
| Was | Blockiert durch |
|---|---|
| Echte Felder **Lead-Herkunft, Kanal, Land, Zeitrahmen, Budget, Sprache, Produkt-ID** in „Anfrage“ | Backoffice-Schreibzugang (heute nur Text-Workaround) |
| Termine als eigener Doctype / Frappe-Appointment, Pipeline-Stufen mit Nachfass-Automatik (3/14/45 Tage) | Backoffice-Zugang |
| Concierge-Aussagen „in der Ausstellung zu sehen“, Lieferzeit-Spannen, Pflegehinweise | Backoffice-Felder Ausstellungs-Flag, Lieferzeit (dieselben wie Bericht 25, H1) |
| Preise oder „ab“-Preise im Concierge | Preisfeld im Backoffice **und** Freigabe der Hersteller – bewusst ausgeschlossen, bis beides da ist |
| Lockerung der Pflichtfelder in `anfrage_produkt` | prüfen, ob der Backoffice-Endpunkt leere Adresse/UID akzeptiert |
| WhatsApp Stufe 2 (Cloud API, Team-Postfach) | Meta-Verifizierung, Anbieterwahl, Volumen |
| KI-Raumplaner mit Bildern | Bildfreigaben der Marken, Wirkungsnachweis (Bericht 23, 10: ab 2028) |
| Händler-Formulierungen „offizieller Partner“ | Verträge mit Minotti/Poliform (Gate 0) |

### Zeitplan-Vorschlag
- **KW 44–45:** F2, F3, F8; Cal.com-Konto, Event Types, AVV.
- **KW 46:** F1 + F7 live (rechtzeitig für Samstag-Test und Adventsabend), Datenschutzerklärung ergänzt.
- **KW 47–50:** F4 Ablauf üben, erste 10 Videotermine, Rundgang-Film.
- **Januar 2027:** F5 Concierge intern testen (100 Fragen, 4 Sprachen), Februar öffentlich als „Beta“.
- **Ab Backoffice-Zugang:** Felder anlegen, Webhook und Formulare auf echte Felder umstellen, Concierge um Ausstellungs-Flag und Lieferzeit erweitern.

---

**Quellen (Web, 26.10.2026):** [hoettges.at](https://www.hoettges.at) · [rh.com Design Atelier](https://rh.com/interior-design/design-atelier) · [Bulgari Virtual Appointment](https://www.bulgari.com/en-gb/faq/services/how-does-the-book-a-virtual-appointment-service-work) · [The Conran Shop Services](https://theconranshop.com/pages/our-services) · [AmbienteDirect](https://www.ambientedirect.com/en/) · [Cal.com Pricing](https://cal.com/pricing) · [Cal.com/Cal.diy GitHub](https://github.com/calcom/cal.com) · [Meta WhatsApp Pricing](https://developers.facebook.com/docs/whatsapp/pricing) · [WhatsApp-Preisübersicht sent.dm](https://docs.sent.dm/docs/guides/whatsapp-pricing) · Paketversionen und Lizenzen aus der npm-Registry (26.10.2026), MiniSearch-Größe von bundlephobia.com.
