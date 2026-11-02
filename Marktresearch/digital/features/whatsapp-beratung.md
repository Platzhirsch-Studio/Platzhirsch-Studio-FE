# WhatsApp-Beratung über die WhatsApp Business Platform und Frappe

Stand 29.10.2026 · Inhaber-Entscheidung Nr. 15 („Offizieller WhatsApp-Business-Kanal mit Anbindung an Frappe. Viele Kunden in der Schweiz und in Vorarlberg schreiben lieber, als dass sie anrufen.“)
Rollen: Messaging-Architekt, Frappe-Entwickler, Datenschutz-Jurist (Recherche). Adressaten: Teil B Website-Team und Frappe-Entwickler des Inhabers, Teil C Inhaber. Die Rechtstexte bleiben unverändert. Die Ergänzung der Datenschutzerklärung geht nur als Vorschlag an die Kanzlei (`whatsapp-dse-vorschlag.md`), die Texte für die Website liegen in `whatsapp-messages.json`.

Noch nicht vorhanden: WhatsApp-Nummer und Meta-Business-Konto. Die Website ist so vorbereitet, dass **ohne `WHATSAPP_NUMBER` kein WhatsApp-Einstieg sichtbar ist**.

---

## Kurzfassung

- **Kanal:** WhatsApp Business Platform mit **Cloud API** (von Meta gehostet). Die WhatsApp-Business-App auf einem Handy ist nicht der richtige Weg, weil Frappe die Gespräche dann nicht vollständig erhält (siehe B5).
- **Kosten:** Meta berechnet seit 01.07.2025 pro zugestellter Nachricht. **Ab 01.10.2026 gilt:** Service-Antworten im 24-h-Fenster sind je Nummer bis **1.000 Nachrichten im Monat frei**, danach kostenpflichtig. Utility-Vorlagen im offenen Fenster sind seit diesem Datum ebenfalls kostenpflichtig. Ein Zahlungsmittel im Meta-Konto ist Pflicht. Österreich (+43) und Schweiz (+41) laufen auf der Ratenkarte unter „Rest of Western Europe“, Deutschland (+49) hat einen eigenen Tarif.
- **Frappe-Anbindung, Empfehlung:** **Frappe CRM + WhatsApp-App** auf dem Backoffice. Welche WhatsApp-App passt, hängt von der Frappe-Version ab, und die muss der Entwickler zuerst mit `bench version` prüfen. Laut früheren Prüfungen läuft das Backoffice auf Frappe v15.
  - **Frappe v15:** `shridarpatil/frappe_whatsapp` (MIT, Frappe 14–17). Das ist die App, die Frappe CRM `main` (v1.90.0 vom 29.10.2026) heute nutzt. Dazu kommt eine kleine Ergänzung in `platzhirsch_studio` mit vier Teilen: Prüfung der Webhook-Signatur (die App prüft sie **nicht**), Lead-Anlage für unbekannte Absender, Begrüßung und Abwesenheitsnachricht sowie Löschfristen.
  - **Frappe v16:** die neue offizielle App `frappe/whatsapp` (MIT, v1.2.0 vom 21.10.2026). Sie prüft die HMAC-Signatur und hat Lead-Anlage über „Append Actions“. Frappe CRM `develop` setzt sie bereits voraus. Noch offen (P1): Die Rechte gelten nur für System Manager, und eine Chat-Ansicht im Desk fehlt. Die Oberfläche für das Team liefert dann Frappe CRM.
- **Website:** nur ein Link `https://wa.me/<nummer>?text=…` mit Hinweis vor dem Wechsel, ohne Skript von Meta und ohne Tracking vor dem Klick. Die vorhandene Klickmessung (`contact_click`, nur mit Statistik-Einwilligung) erkennt `wa.me` schon.
- **Recht:** Bei der Cloud API ist Meta (WhatsApp Ireland) **Auftragsverarbeiter**. Daten gehen weiter an WhatsApp LLC und Meta Platforms in den USA (Datenschutzrahmen EU–USA, hilfsweise Standardvertragsklauseln). Zwischen Kunde und Cloud API gibt es **keine Ende-zu-Ende-Verschlüsselung bis zum Studio**, weil Meta die Schlüssel für das Unternehmen verwaltet. Werbung per WhatsApp nur mit eigener Einwilligung (AT § 174 TKG 2021, DE § 7 UWG, CH Art. 3 Abs. 1 lit. o UWG) und nach der WhatsApp-Richtlinie für jede Nachrichtenkategorie getrennt.

---

## Teil A – Recherche

### A1 WhatsApp Business Platform / Cloud API (Stand Oktober 2026)

| Punkt | Befund | Quelle |
|---|---|---|
| Varianten | **Business-App** (Handy, 1 Gerät + verknüpfte Geräte, Funktionen wie Begrüßung, Abwesenheit und Schnellantworten eingebaut) und **Business Platform** (API: Cloud API von Meta gehostet). Nur die Platform lässt sich serverseitig an Frappe anbinden. | [Meta Developer Docs – Pricing/Overview](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing) |
| Einrichtung | Meta-Business-Portfolio (business.facebook.com), darin eine App vom Typ „Business“ mit Produkt WhatsApp. Man notiert App-ID, WhatsApp-Business-Account-ID (WABA) und Phone-Number-ID. Für den Dauerbetrieb braucht es einen **System-User-Token** mit `whatsapp_business_messaging` und `whatsapp_business_management`, weil der Token auf der API-Setup-Seite nach 24 h abläuft. Vor der Freischaltung stellt Meta nur an eingetragene Testnummern zu. | [frappe/whatsapp README](https://github.com/frappe/whatsapp) (Getting Started 1–4) |
| Nummer | Eine Nummer, die per SMS oder Anruf einen Code empfängt. Festnetz geht über Sprachanruf. Eine Nummer, die bereits in der normalen WhatsApp- oder Business-App läuft, muss dort gelöscht werden, außer man nutzt „Coexistence“ (siehe unten). | Meta Cloud API Docs (Registrierung), [Telnyx Coexistence](https://developers.telnyx.com/docs/messaging/whatsapp/coexistence) |
| Coexistence | Eine Nummer gleichzeitig in Business-App und Cloud API, Einrichtung über „Embedded Signup“ mit der Coexistence-Option. Die App muss mindestens alle 13 Tage geöffnet werden. App-Nachrichten kommen als „Echo“ (`smb_message_echoes`) in die API. Kein blaues Abzeichen, keine Anrufe, 5 Nachrichten pro Sekunde. | [Chatwerk](https://developer.chatwerk.de/docs/whatsapp-coexistence-business-app-api), [Wassenger](https://wassenger.com/help/coexistence), [Telnyx Release Note 07.10.2026](https://telnyx.com/release-notes/whatsapp-coexistence) |
| Anzeigename | Meta prüft jeden Anzeigenamen und jede Änderung. Er muss zum Auftritt des Unternehmens passen (Schreibweise wie Website), ohne Emojis, ohne Werbewörter, ohne „Official/Verified“. Ohne verifiziertes Unternehmen muss er dem Registernamen entsprechen, verifiziert sind gängige Varianten erlaubt. Für Platzhirsch: **„Platzhirsch Home Living“** (Marke, so auf Website und Schild). Weil das Unternehmen unter „MW Immobilienverwaltungs GmbH“ eingetragen ist, ist die **Unternehmensverifizierung** nötig, damit der Markenname durchgeht (Firmenbuchauszug, Website mit Impressum, Domain-Nachweis). | [360dialog Display Name Guidelines](https://docs.360dialog.com/partner/waba-management/waba-profile-and-compliance/whatsapp-display-name-guidelines), [WATI](https://support.wati.io/en/articles/11462959-guidelines-for-choosing-your-display-name), [DoubleTick](https://learn.doubletick.io/get-started-with-doubletick/display-name-approval) (Drittanbieter, vor Antrag mit Meta-Hilfe abgleichen) |
| „Offizielles Business-Konto“ (blaues Abzeichen) | Antrag erst nach genehmigtem Anzeigenamen und verifiziertem Unternehmen. Meta verlangt Bekanntheit, belegt durch **unbezahlte** Presseberichte. Nicht garantiert und für den Start nicht nötig. Ohne Abzeichen sehen Kunden den Anzeigenamen trotzdem, sobald Verifizierung und Kontoqualität stimmen. | [360dialog OBA](https://docs.360dialog.com/partner/partner-hub/official-business-account-oba), [AiSensy](https://m.aisensy.com/blog/display-name-for-whatsapp-business-api/) |
| Abrechnung | Seit **01.07.2025 pro Nachricht**. Berechnet wird bei Zustellung und nur von Unternehmen an Nutzer. „Meta does not charge for messages from users to businesses.“ Kategorien: **Marketing, Utility, Authentication** (Vorlagen), **Service** (freie Antworten), neu ab 01.07.2026 „Meta Business Agent“. | [Meta Pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing) |
| **Änderung 01.10.2026** | Service-Nachrichten sind nicht mehr unbegrenzt frei: **1.000 freie Service-Nachrichten je Nummer und Monat**, kein Übertrag, ab der 1.001. kostenpflichtig. Utility-Vorlagen im offenen Fenster sind kostenpflichtig („regular“). Ohne hinterlegtes Zahlungsmittel bis 30.09.2026 werden Service-Nachrichten ab 01.10.2026 unter Umständen nicht mehr zugestellt. | [Meta Pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing) |
| Tarife AT/CH/DE | AT (43) und CH (41) zählen zu **„Rest of Western Europe“**, DE (49) hat einen eigenen Tarif. Die Beträge stehen nur in der CSV-/PDF-Ratenkarte auf der Pricing-Seite. **Vor dem Start die aktuelle Karte laden, hier keine Beträge geschätzt.** | [Meta Pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing) |
| 24-h-Fenster | Das Kundenservice-Fenster öffnet, wenn der Kunde schreibt oder anruft, und beginnt mit jeder neuen Kundennachricht neu. Freie Nachrichten gehen nur im offenen Fenster, außerhalb nur genehmigte Vorlagen. Das „Free Entry Point“-Fenster (bis 7 Tage) gibt es nur nach Click-to-WhatsApp-Werbung und ist für uns nicht relevant. | [Meta Pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing) |
| Vorlagen | Vorlagen werden angelegt und von Meta genehmigt (Status Pending/Approved/Rejected). Jede Vorlage darf nur für ihre Kategorie genutzt werden. Variablen sind erlaubt. Beide Frappe-Apps können Vorlagen anlegen und synchronisieren. | [WhatsApp Business Messaging Policy](https://whatsappbusiness.com/policy/), [frappe/whatsapp README](https://github.com/frappe/whatsapp) |
| Opt-in | „You may only contact people on WhatsApp if: (a) they have given you their mobile phone number … and (b) you have received opt-in permission.“ Empfohlen ist ein **getrenntes Opt-in je Nachrichtenkategorie**. Abmeldungen auf jedem Weg (auch außerhalb von WhatsApp) sind zu beachten. Automatisierung ist erlaubt, braucht aber einen klaren Weg zu einem Menschen (Übergabe, Telefon, E-Mail, Besuch). Richtlinie zuletzt geändert am **23.09.2026**. | [WhatsApp Business Messaging Policy](https://whatsappbusiness.com/policy/) |
| KI-Bots | Seit 15.01.2026 sind **allgemeine KI-Assistenten als Hauptprodukt** auf der Business-Plattform verboten. Unternehmensbezogene KI für Service, Termine und Beratung bleibt erlaubt. Ein späterer Concierge auf WhatsApp wäre zulässig, mit Übergabe an das Team. | [TechCrunch 18.10.2025](https://techcrunch.com/2025/10/18/whatssapp-changes-its-terms-to-bar-general-purpose-chatbots-from-its-platform/), [respond.io](https://respond.io/blog/whatsapp-general-purpose-chatbots-ban) |
| Profil | Für die Cloud API lassen sich im Profil Info-Text, Beschreibung, Adresse, E-Mail, bis zu 2 Websites, Branche und Profilbild pflegen. **Öffnungszeiten, Begrüßung und Abwesenheitsnachricht gibt es nur in der Business-App**, bei der API muss Frappe sie übernehmen (B4). | Meta Cloud API Business Profile (Docs), eigene Prüfung der App-Funktionen |
| Click-to-Chat-Link | `https://wa.me/<Nummer>` mit vollständiger internationaler Nummer **ohne „+“, ohne führende Nullen, ohne Leerzeichen**, optional `?text=` mit URL-codiertem Text. Funktioniert auf Handy (App) und Desktop (WhatsApp Web/Desktop). | [WhatsApp-Hilfebereich Click-to-Chat](https://faq.whatsapp.com/5913398998672934) |

### A2 Frappe-Anbindung

| App | Stand (geprüft 29.10.2026 über GitHub-API) | Bewertung |
|---|---|---|
| **`shridarpatil/frappe_whatsapp`** | MIT, 492 Sterne, letzter Push 04.08.2026, Zweige `master`, `version-15`, `frappe-15-compat`. `frappe >=14.0.0,<=17.0.0-dev`. Doctypes: WhatsApp Account, Settings, Message, Templates, Notification (+Log), Flow, Profiles, Recipient List, Bulk Message. Funktionen: Senden und Empfangen, Medien, Vorlagen mit Sync, Benachrichtigung bei Doctype-Ereignissen, Massenversand, Flows. Webhook: `/api/method/frappe_whatsapp.utils.webhook.webhook`. | Ausgereift und von Frappe CRM `main` genutzt. **Schwächen aus dem Code:** (1) `webhook.post()` prüft die Signatur `X-Hub-Signature-256` **nicht**, jeder kann gefälschte „Kundennachrichten“ einspielen. (2) Jeder Webhook landet vollständig mit Nachrichtentext im `WhatsApp Notification Log`, und es gibt keine automatische Löschung. (3) Keine Verarbeitung von Coexistence-Echos. Alle drei lassen sich in `platzhirsch_studio` lösen (B3). [GitHub](https://github.com/shridarpatil/frappe_whatsapp), [Marketplace](https://cloud.frappe.io/marketplace/apps/frappe_whatsapp) |
| **`frappe/whatsapp`** (offiziell) | MIT, angelegt am 31.07.2026, Release **v1.2.0 am 21.10.2026**. `frappe >=16.0.0-dev,<18`, Python ≥ 3.14. Doctypes WA Account/Settings/Message/Profile/Template/Log. **HMAC-SHA256-Prüfung** jeder Webhook-Lieferung (Feld „Webhook Secret“ = App Secret). WhatsApp als Kanal in der Frappe-Benachrichtigung. „Append Actions“ legen bei neuen Absendern Dokumente an, z. B. CRM Lead. `WA Log` wird nach **60 Tagen** automatisch gelöscht. Webhook: `/api/method/whatsapp.whatsapp.webhook.handler`. | Technisch die sauberste Lösung, aber nur ab Frappe v16. Selbst als offen (P1) markiert: Alle Doctypes nur für System Manager, kein App-Eintrag. Dazu P2: eingehende Medien werden **nicht heruntergeladen** (nur `media_id`), und eine Chat-Ansicht im Desk fehlt (P3). → Allein noch nicht für das Team geeignet, zusammen mit Frappe CRM schon. [GitHub](https://github.com/frappe/whatsapp) |
| **Frappe CRM** | AGPL-3.0, Release v1.90.0 am 29.10.2026. `main` nutzt `frappe_whatsapp` (Doctype „WhatsApp Message“), `develop` setzt bereits `required_apps = ["whatsapp"]` (offizielle App, „WA Message“). WhatsApp-Reiter auf Lead und Deal, Antworten aus dem CRM, Benachrichtigung der **zugewiesenen** Mitarbeitenden, Rollen Sales User/Manager. Gespräche beginnen nur mit Vorlage, freie Nachrichten erst nach Antwort des Kunden. | **Wichtig:** In `main` ordnet `validate()` eine Nachricht nur einem **bestehenden** Lead/Deal/Kontakt mit derselben Nummer zu. Unbekannte Absender bekommen keinen Lead und keine Benachrichtigung, das muss die Ergänzung übernehmen (B3). In `develop` legt CRM über die Append Action selbst einen Lead mit Quelle „WhatsApp“ an. [Docs (29.09.2026)](https://docs.frappe.io/crm/whatsapp), [GitHub](https://github.com/frappe/crm) |
| `shridarpatil/whatsapp_chat` | GPL-2.0, letzter Push 30.03.2026, 26 Sterne. Chat-Oberfläche im Desk für `frappe_whatsapp`. | Möglich, wenn kein CRM gewünscht ist. Weniger gepflegt, keine Zuweisung dokumentiert. [Forum 15.12.2025](https://discuss.frappe.io/t/whatsapp-integration-suite-for-frappe-messaging-chat-ui-chatbot/158000) |
| `shridarpatil/frappe_whatsapp_chatbot` | Lizenz nicht angegeben, letzter Push 30.03.2026. Schlagwort-Antworten, Gesprächsabläufe, KI-Rückfall, Geschäftszeiten. | Nicht empfohlen: Lizenz unklar, und KI-Rückfall auf WhatsApp braucht AVV, Hinweis nach KI-Verordnung (AI Act) Art. 50 und Freigabe. Begrüßung und Abwesenheit lassen sich mit wenigen Zeilen selbst lösen. |
| `Starktail/helpdesk_whatsapp` | MIT, 10 Sterne, Juli 2026. Brücke zu Frappe Helpdesk mit dokumentierten UI-Fehlern (Quelle zeigt „Mail“, unterer Antwortknopf geht nicht). | Nicht empfohlen. Platzhirsch braucht Verkaufsberatung (Lead/Deal), keinen Ticket-Helpdesk. [GitHub](https://github.com/Starktail/helpdesk_whatsapp) |

**Empfehlung mit Begründung**

1. **Frappe CRM als Posteingang.** Platzhirsch braucht keine Ticketverwaltung, sondern einen Verkaufsweg: Anfrage → Beratung → Termin → Angebot. Frappe CRM liefert Lead und Deal, Zuweisung, Benachrichtigung, eine mobile Weboberfläche und den WhatsApp-Reiter. Die Installation ist ohnehin geplant (`digital/11-crm-automation.md`, `wachstumsrat/martech.md`). Lizenz AGPL bei unveränderter Eigennutzung unkritisch.
2. **WhatsApp-App nach Frappe-Version:**
   - **v15 (wahrscheinlich heute):** `frappe_whatsapp` + CRM `main`. **Pflicht** ist die Signaturprüfung vor dem Webhook (B3.1), sonst ist der Kanal angreifbar.
   - **v16:** `frappe/whatsapp` + CRM (sobald die Release-Version die App voraussetzt). Wenn das v16-Upgrade ohnehin ansteht (für Frappe Suite/Meet nötig, siehe `online-termin-video.md`), lohnt es sich, WhatsApp gleich auf der offiziellen App zu starten und eine spätere Umstellung von Daten zu vermeiden.
3. **Kein Zwischenanbieter** (BSP wie 360dialog/Twilio). Beide Apps sprechen direkt mit der Graph API. Das spart einen weiteren Auftragsverarbeiter und zusätzliche Gebühren. Ein BSP wäre nur nötig, wenn Meta-Konto und Registrierung ohne Entwickler laufen sollen.
4. **Installation zuerst auf dem Dev-Backend (10.30.70.201)**, mit Testnummern im Meta-Sandbox-Modus, erst dann produktiv. Das Backoffice ist produktiv. Installation und Konfiguration macht laut Entscheidung Nr. 15 der Frappe-Entwickler des Inhabers.

### A3 Recht AT / DE / CH (keine Rechtsberatung, Vorschlag an die Kanzlei)

1. **Rollen.** Bei der Cloud API verarbeitet WhatsApp Ireland Ltd. die Nachrichten **als Auftragsverarbeiter** des Studios: „Cloud API will only use the messages it processes on behalf of and at the instruction of the business“ ([Meta Data Privacy & Security](https://developers.facebook.com/documentation/business-messaging/whatsapp/data-privacy-and-security)). Grundlage sind die [WhatsApp Business Data Processing Terms](https://www.whatsapp.com/legal/business-data-processing-terms) (Stand 22.08.2025), die mit den Business-Bedingungen akzeptiert werden (Art. 28 DSGVO). Für den eigenen Dienst (Konto, Nummer und Metadaten des Kunden) bleibt WhatsApp gegenüber dem Kunden eigener Verantwortlicher nach dessen Nutzungsbedingungen. Das so in der DSE trennen.
2. **Drittland.** WhatsApp Ireland gibt europäische Daten an WhatsApp LLC und Meta Platforms Inc. (USA) und weitere Unterauftragsverarbeiter weiter. Grundlage ist der **EU-U.S. Data Privacy Framework**, hilfsweise Standardvertragsklauseln (Modul Auftragsverarbeiter an Auftragsverarbeiter) ([Business Data Transfer Addendum](https://www.whatsapp.com/legal/business-data-transfer-addendum-20210927)). Für die Schweiz gilt der Swiss-U.S. DPF bzw. die Anerkennung durch den Bundesrat, ergänzend das revDSG (Art. 16 f., Informationspflicht Art. 19).
3. **Speicherung bei Meta.** Nachrichten höchstens **30 Tage**, Nutzerkennungen werden 30 Tage nach dem letzten Status gelöscht. Verschlüsselt sind der Transport (Signal-Protokoll bis zur Cloud API) und die ruhenden Daten. **Meta verwaltet die Schlüssel für das Unternehmen**, deshalb nicht von „Ende-zu-Ende-verschlüsselt bis zu uns“ sprechen. „Local Storage“ (Speicherung in einem bestimmten Land) gibt es. Die Meta-Seite nennt als Beispiele aber nur BR und IN, und auch dann wird bis zu 60 min international verarbeitet. Eine EU-Region (Deutschland) nennt nur ein Drittanbieter, deshalb **vor Registrierung der Nummer prüfen** und nur bei Bestätigung aktivieren (geht nur bei nicht registrierter Nummer, `storage_configuration`) ([Local Storage](https://developers.facebook.com/documentation/business-messaging/whatsapp/local-storage)).
4. **Rechtsgrundlage.** Der Kunde schreibt von sich aus, um beraten zu werden → Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahme). Für die Ablage in Frappe (Lead) gilt dasselbe. Keine Gesundheits- oder Finanzdaten erfragen, keine Ausweise oder Zahlungsdaten über WhatsApp annehmen.
5. **Hinweis vor dem Chat (Transparenz, Art. 13).** Vor dem Wechsel zu WhatsApp kurz und vollständig: Wer verarbeitet (Platzhirsch, dazu Meta als Dienstleister mit Übermittlung in die USA), wofür (Beantwortung), Alternativen (Telefon, E-Mail, Formular), Link zur DSE. Der Link selbst sendet beim Anzeigen nichts. Erst mit dem Absenden der Nachricht in WhatsApp entsteht die Verarbeitung.
6. **Kein Adressbuchabgleich.** Mit der Cloud API fällt das Problem der Business-App weg, dass das Handy das ganze Adressbuch an WhatsApp hochlädt. Mitarbeitende nutzen **keine privaten Handys** für Kundengespräche.
7. **Werbung nur mit Einwilligung.**
   - **AT:** § 174 Abs. 3 TKG 2021, elektronische Post zur Direktwerbung nur mit vorheriger Einwilligung. WhatsApp fällt nach herrschender Auslegung darunter ([futurezone](https://futurezone.at/apps/amazon-werbung-whatsapp-abmelden-deaktivieren-zustimmung/403106020), [WKO-Checkliste](https://news.wko.at/oe/internetrecht/checklistetkg.pdf)). Die Bestandskunden-Ausnahme (Abs. 4) verlangt Opt-out schon bei der Erhebung und in jeder Nachricht. Für WhatsApp nicht darauf bauen.
   - **DE:** § 7 Abs. 2 Nr. 2 UWG (elektronische Post ohne ausdrückliche Einwilligung = unzumutbare Belästigung), Ausnahme § 7 Abs. 3.
   - **CH:** Art. 3 Abs. 1 lit. o UWG (Massenwerbung über Fernmeldetechnik nur mit Einwilligung, Absender korrekt angeben, Abmeldung einfach und kostenlos).
   - **WhatsApp-Richtlinie:** zusätzlich Opt-in je Kategorie.
   - **Folge:** Zum Start **keine Marketing-Vorlagen**. Falls später gewünscht, braucht es eine eigene Checkbox (nicht vorangekreuzt, getrennt vom Newsletter), einen Nachweis in Frappe (Zeitpunkt, Wortlaut, Quelle) und „STOPP“ in jeder Nachricht.
8. **Utility-Nachrichten** (Terminbestätigung, „Ihr Angebot liegt bereit“) sind Vertragskommunikation und keine Werbung. Sie gehen trotzdem nur an Kunden, die WhatsApp als Kanal gewählt haben, und ohne werbliche Zusätze.
9. **Speicherdauer (Vorschlag, die bestehende Platzhalter-Fassung nennt „[12 Monate]“):** Gespräche ohne Auftrag 12 Monate nach letztem Kontakt löschen, mit Auftrag nach den Aufbewahrungsfristen für Geschäftsbriefe (AT § 212 UGB 7 Jahre, nur soweit Geschäftskorrespondenz). Technische Webhook-Protokolle nach 30 Tagen löschen. Raumfotos aus dem Chat wie Raumfotos aus dem Upload behandeln (DSE 5.11).
10. **Tracking.** Kein Meta-Pixel, kein WhatsApp-Widget-Skript. Der bestehende Klick-Zähler `contact_click` (method `whatsapp`) läuft nur mit Statistik-Einwilligung und erst beim Klick, das ist in der DSE (GA4-Abschnitt) bereits beschrieben.
11. **KI.** Zum Start beantwortet **kein Bot** Fragen, nur die feste Begrüßung und die Abwesenheitsnachricht (keine KI, kein Art.-50-Hinweis nötig). Ein späterer Concierge auf WhatsApp braucht vor der ersten Eingabe den Hinweis „Sie schreiben mit einer KI“, einen AVV mit dem KI-Anbieter und die Übergabe an das Team (WhatsApp-Richtlinie).

---

## Teil B – Architektur Website ↔ WhatsApp ↔ Frappe

```
 Website (Next.js)                       Meta Cloud API                    Backoffice (Frappe, produktiv)
 ┌─────────────────────────┐             ┌──────────────────┐              ┌────────────────────────────────────┐
 │ WhatsAppEinstieg        │  Klick      │ WhatsApp (Kunde) │  Webhook     │ platzhirsch_studio.whatsapp_guard   │
 │  Hinweis → wa.me-Link   │ ─────────▶  │  schreibt selbst │ ───────────▶ │  1 Signatur prüfen (App Secret)     │
 │  ?text=Kontext (Produkt)│             │                  │  HTTPS POST  │  2 an WhatsApp-App weiterreichen    │
 │ kein Skript, kein Pixel │             │                  │              ├────────────────────────────────────┤
 └─────────────────────────┘             │                  │ ◀─────────── │ frappe_whatsapp / frappe/whatsapp   │
          ▲                              │                  │ Graph API    │  WhatsApp Message (Incoming)        │
          │ WHATSAPP_NUMBER (Server-Env) └──────────────────┘ (Antworten,  ├────────────────────────────────────┤
          │ leer = nichts sichtbar                             Vorlagen)    │ Ergänzung (doc_events after_insert) │
                                                                           │  3 CRM Lead suchen/anlegen (Quelle  │
                                                                           │    „WhatsApp“, Kontext aus ?text)   │
                                                                           │  4 Zuweisung + Benachrichtigung     │
                                                                           │  5 Begrüßung / Abwesenheit          │
                                                                           │ Frappe CRM: Lead/Deal-Reiter Chat   │
                                                                           └────────────────────────────────────┘
```

### B1 Website (Next.js 16, nur Link)

**Konfiguration** (nur Server, kein `NEXT_PUBLIC_`, damit sich die Nummer im Deploy ohne neuen Build ändern lässt und nicht im Client-Bundle steht):

| Variable | Pflicht | Bedeutung |
|---|---|---|
| `WHATSAPP_NUMBER` | ja | E.164, z. B. `+43557446255`. Wird geprüft mit `/^\+[1-9]\d{6,14}$/`. **Leer oder ungültig = kein WhatsApp-Einstieg auf der ganzen Seite.** Im Link wird das `+` entfernt (`wa.me/43…`). |
| `WHATSAPP_REPLY_NOTE` | nein | Nur wenn der Inhaber eine Zusage machen will, z. B. ein Wert in Stunden während der Öffnungszeiten. Leer = **keine Antwortzeit-Aussage**, nur der Verweis auf die Öffnungszeiten aus `src/lib/site.js` (`OPENING_HOURS`). Nichts erfinden. |

Vorschlag `src/lib/whatsapp.js` (Server): `getWhatsAppConfig()` liefert `{ enabled, digits }` oder `null`. `buildWhatsAppHref(digits, text)` ergibt `https://wa.me/${digits}?text=${encodeURIComponent(text)}`. Die Seite (Server Component) liest die Konfiguration und gibt nur `href` an die Client-Komponente weiter. Vor dem Bau `node_modules/next/dist/docs` zu Umgebungsvariablen und Server/Client Components lesen (Next 16).

**Komponente `WhatsAppEinstieg`** (zweistufig, ohne Modal):
1. Ein Knopf im Stil `Button secondary` oder `quiet`, nie Primärknopf, weil der Termin primär bleibt: „Per WhatsApp schreiben“, `aria-expanded`, `aria-controls`.
2. Darunter klappt ein Hinweis auf (keine Überlagerung, kein Fokus-Fang, Fokus springt auf die Überschrift des Hinweises): Text aus `whatsapp-messages.json` (Meta als Dienstleister, USA, Alternativen, DSE-Link) und der eigentliche Link „Weiter zu WhatsApp“ (`<a href="https://wa.me/…" target="_blank" rel="noopener noreferrer">`, sichtbarer und vorgelesener Zusatz „öffnet WhatsApp“), daneben Telefon und Formular als gleichwertige Wege.
3. Kein `localStorage`-Zwang. Optional merkt sich die Seite „Hinweis gelesen“ nur für die Sitzung (try/catch).
4. **Barrierefreiheit (WCAG 2.2 AA):** Zielgröße ≥ 24 × 24 px (mobil 44 px), Kontrast nach Design-Bibel §4.5, `prefers-reduced-motion` ohne Aufklapp-Animation, Fokus sichtbar (2.4.11/2.4.13), Text statt reinem Icon, WhatsApp-Logo nur als Kennzeichnung mit `aria-hidden`, kein grünes Fremdfarben-Feld (Design-Bibel: nur Rollen-Tokens).
5. **Desktop:** Der Link öffnet WhatsApp Web oder Desktop. Ein QR-Code ist optional und, falls gewünscht, serverseitig als Inline-SVG ohne externen Dienst.

**Vorbelegter Text** (Kontext für das Team, keine personenbezogenen Daten). Sprache nach `locale`, Muster in `whatsapp-messages.json`:
- Allgemein: „Guten Tag, ich habe eine Frage zur Einrichtung.“
- Produktseite: „Guten Tag, ich interessiere mich für {Produkt} ({Marke}). {Kurz-URL}“, wobei die URL nur den Pfad nennt, ohne Tracking-Parameter.
- Beratung/Termin: „Guten Tag, ich möchte eine Beratung vereinbaren.“
- Merkliste: nur „… zu meiner Merkliste“, **keine** Liste im Link (Länge, Datenschutz). Die Merkliste teilt der Kunde bei Bedarf über die vorhandene Teilen-Funktion.
- Der Kunde kann alles vor dem Senden ändern. Das in der Hinweiszeile sagen.

**Einbau (punktuell, nach frischem Lesen der Dateien, andere Workflows nicht stören):**

| Ort | Form |
|---|---|
| MobileCtaBar | dritter Eintrag neben Termin und Anruf nur, wenn `enabled`, sonst unverändert |
| Kontakt | eigener Block „Schreiben statt anrufen“ neben Telefon/E-Mail |
| Beratung / Termin | Nebenweg unter dem Primärknopf („Lieber schreiben?“) |
| Produktseite | neben „Anfrage“ als Nebenweg mit Produkt-Kontext |
| Footer | Textlink in der Kontaktspalte |
| Concierge | Übergabe „Mit einem Menschen weiterschreiben“ als Link (kein Weiterreichen des Chatverlaufs) |
| JSON-LD | **nicht** ergänzen, solange Meta das Profil nicht freigeschaltet hat |

**Tests:** Unit-Test für `buildWhatsAppHref` (Kodierung von Umlauten, „&“, „#“, kein `+`) und für die Prüfung der Variablen. Ein Playwright-Lauf (`PW_WORKERS=1`) einmal ohne `WHATSAPP_NUMBER` (kein Element, kein `wa.me` im HTML) und einmal mit einer Testnummer (Hinweis per Tastatur erreichbar, `href` korrekt, keine Anfragen an `*.whatsapp.*`/`*.facebook.*` beim Laden). Sichtprüfung mit `node tools/qa/shoot.mjs` auf 360 px und Desktop.

### B2 Meta ↔ Frappe

- Callback-URL (je nach App):
  - v15: `https://<backoffice>/api/method/platzhirsch_studio.whatsapp_guard.webhook`. Das ist der eigene Wächter, der an `frappe_whatsapp.utils.webhook.webhook` weiterreicht.
  - v16: `https://<backoffice>/api/method/whatsapp.whatsapp.webhook.handler` mit gesetztem „Webhook Secret“.
- Webhook-Felder: mindestens `messages` und `message_template_status_update`.
- Das Backoffice muss aus dem Internet per HTTPS erreichbar sein. Die Firewall öffnet **nur diesen Pfad** (Reverse-Proxy-Regel), Rest bleibt wie heute.
- Token als System-User-Token im Passwortfeld der App. Das App Secret liegt nur in `site_config.json` bzw. „Webhook Secret“, nie im Website-Repo.

### B3 Ergänzung in `platzhirsch_studio` (Spezifikation für den Frappe-Entwickler, nicht ausgeführt)

1. **Signaturprüfung (nur v15, Pflicht).** Whitelisted Methode `whatsapp_guard.webhook` (`allow_guest=True`):
   - GET reicht die Verifizierung (`hub.challenge`) an die App durch.
   - POST: `hmac.compare_digest("sha256=" + hmac.new(app_secret, frappe.request.get_data(), sha256).hexdigest(), frappe.get_request_header("X-Hub-Signature-256"))`. Bei Fehlschlag 403 und `frappe.log_error` ohne Nachrichtentext, sonst `frappe_whatsapp.utils.webhook.webhook()` aufrufen.
   - In Meta nur diese URL eintragen.
   - Ein Rate-Limit pro IP schützt den Endpunkt zusätzlich.
2. **Lead-Zuordnung.** `doc_events` auf „WhatsApp Message“ bzw. „WA Message“ `after_insert`, nur Incoming, falls die Nachricht keine Referenz hat:
   - CRM Lead mit `mobile_no` = Absender und Quelle „WhatsApp“ anlegen, Name aus dem WhatsApp-Profil.
   - Kontext aus der ersten Nachricht lesen. Erkennt das System einen Produktpfad `/produkte/<kategorie>/<produkt>`, wird das Produkt im Lead vermerkt.
   - Zuweisung per `frappe.desk.form.assign_to.add` an die zuständige Person (Regel: Standard-Beraterin aus einer Einstellung `PH WhatsApp Einstellungen.standard_zuweisung`, bei Projekten Harald Menghin).
   - Danach die Nachricht verknüpfen, damit CRM die Benachrichtigung auslöst.
   - In v16 übernimmt das die Append Action. Es bleibt nur das Ablesen des Kontexts.
3. **Begrüßung und Abwesenheit** (Doctype `PH WhatsApp Einstellungen`, Single):
   - Felder: `begruessung_aktiv`, `begruessung_text`, `abwesenheit_aktiv`, `abwesenheit_text`, `oeffnungszeiten` (Tabelle Wochentag/von/bis, Vorbelegung wie `OPENING_HOURS`: Di–Fr 10–18, Sa 10–14, So/Mo geschlossen), `feiertagsliste` (Holiday List AT), `ruhe_tage` (Tage ohne erneute Begrüßung, z. B. 30).
   - Logik: erste Nachricht eines Absenders seit `ruhe_tage` → Begrüßung. Außerhalb der Öffnungszeiten → Abwesenheitsnachricht, höchstens 1× pro 12 h je Absender.
   - Beide sind freie Service-Nachrichten im offenen Fenster (keine Vorlage nötig, zählen gegen die 1.000 freien).
   - Sie werden per `frappe.enqueue` nach dem Commit gesendet, damit der Webhook schnell antwortet.
4. **Löschfristen.** Täglicher Job:
   - `WhatsApp Notification Log` (v15) älter als 30 Tage löschen. `WA Log` hat in v16 60 Tage eingebaut, das per „Log Settings“ auf 30 senken.
   - Nachrichten unverknüpfter oder verlorener Leads nach 12 Monaten ohne Kontakt löschen (Frist nach Freigabe der Kanzlei).
5. **Medien (v16).** Weil die offizielle App Medien nicht herunterlädt, holt ein Hintergrundjob Bilder (Raumfotos, Pläne) über die Graph API als privates `File` am Lead. Größere Pläne gehen besser über die Upload-Seite (`/upload`).
6. **Rechte.** Rollen „Sales User“ für Beratung, „Sales Manager“ für Inhaber. Vorlagen anlegen nur Sales Manager. In v16 bis zur Lösung von P1 Rechte per „Role Permission Manager“ auf WA Message/Profile lesen und schreiben.
7. **Vorlagen (Utility, Freigabe durch Meta):**
   - `ph_termin_bestaetigung` („Ihr Termin am {{datum}} um {{uhrzeit}} im Showroom Lochau ist eingetragen. Ändern oder absagen: {{link}}“)
   - `ph_angebot_bereit`
   - `ph_rueckfrage` („Wir haben eine Rückfrage zu Ihrer Anfrage. Antworten Sie einfach auf diese Nachricht.“)
   - Alle in DE und EN. Gesendet wird nur an Kunden, die WhatsApp als Kanal angegeben haben.
   - Anbindung an die Terminbuchung (`online-termin-video.md`) über eine Frappe-Benachrichtigung mit Kanal WhatsApp (v16) bzw. „WhatsApp Notification“ (v15).

### B4 Betrieb

- Posteingang = Frappe CRM (Browser, am Handy als Web-App). Benachrichtigung über die CRM-Glocke und optional per E-Mail.
- Ohne Antwort im 24-h-Fenster geht nur noch eine Vorlage. Darum in CRM eine Ansicht „WhatsApp offen > 20 h“ anlegen, damit nichts verfällt.
- Kontoqualität: Meta drosselt Konten bei Blockierungen und Meldungen. Darum keine unaufgeforderten Vorlagen senden.

### B5 Warum nicht die Business-App oder Coexistence

- **Nur Business-App auf dem Studio-Handy:** kein Frappe, ein Gerät als einzige Ablage, Adressbuch-Upload, keine Zuweisung, keine Löschfristen. Das widerspricht der Entscheidung „Anbindung an Frappe“.
- **Coexistence:** Die App-Antworten erreichen Frappe nur als „Echo“. `frappe_whatsapp` verarbeitet keine Echos (im Code geprüft), `frappe/whatsapp` nennt sie nicht. Dazu kommen kein blaues Abzeichen und eine Pflicht, die App alle 13 Tage zu öffnen. Coexistence ist nur sinnvoll, wenn eine **bereits etablierte** Studio-WhatsApp-Nummer weitergenutzt werden muss. Dann App-Antworten vermeiden und nur in Frappe antworten.

---

## Teil C – Schritte für den Inhaber

| # | Schritt | Hinweise |
|---|---|---|
| 1 | **Nummer festlegen** | Empfehlung: die Festnetznummer **+43 5574 46255** (eine Nummer für Anruf und Chat, steht schon überall). Sie darf nicht in einer WhatsApp-App registriert sein, Bestätigung per Sprachanruf. Alternative: eigene Mobilnummer nur für WhatsApp, nie in einer App nutzen. Die Nummer bleibt Eigentum des Unternehmens, nicht einer Person. |
| 2 | **Meta-Business-Portfolio** anlegen (business.facebook.com) | Mit Unternehmens-E-Mail, mindestens 2 Admins (Inhaber + Vertretung), Zwei-Faktor-Anmeldung für alle. |
| 3 | **Unternehmensverifizierung** | Rechtlicher Name MW Immobilienverwaltungs GmbH, Firmenbuchauszug, Adresse Landstraße 11, Website platzhirsch.studio mit Impressum, Domain-Bestätigung (DNS-Eintrag oder Datei, macht der Website-Betreuer). |
| 4 | **Zahlungsmittel** im WhatsApp-Konto hinterlegen | Seit 01.10.2026 Pflicht für Service-Nachrichten. Aktuelle Ratenkarte (Rest of Western Europe, Germany) ablegen. |
| 5 | **Anzeigename** „Platzhirsch Home Living“ | Genau wie auf Website und Schild, keine Zusätze wie „Lochau“ oder „Design“. |
| 6 | **Profil** | Profilbild 640 × 640 px, quadratisch, Wortmarke oder Geweih **mittig mit Rand** (WhatsApp schneidet rund zu), Ink auf Paper, kein Foto mit Herstellermarken. Info-Zeile (≤ 139 Zeichen), Beschreibung, Adresse, E-Mail info@platzhirsch.studio, Websites `https://platzhirsch.studio` und die Terminseite. Texte siehe unten. |
| 7 | **Öffnungszeiten und Antwortzusage** | Bestätigen, dass die Website-Zeiten (Di–Fr 10–18, Sa 10–14) auch für WhatsApp gelten. Entscheiden, ob es eine Antwortzusage geben soll. Nur dann `WHATSAPP_REPLY_NOTE` setzen, mit einem Wert, den das Team sicher hält. |
| 8 | **Begrüßung und Abwesenheit** freigeben | Texte unten. Sie werden in Frappe eingetragen (`PH WhatsApp Einstellungen`). |
| 9 | **Zuständigkeit** | Wer liest den Posteingang wann, wer vertritt, wer bekommt Projekte (Harald). Mitarbeitende nur über Frappe-Login, keine privaten Handys. |
| 10 | **Frappe-Entwickler beauftragen** | `bench version` prüfen. Dann in dieser Reihenfolge: (a) Dev-Backend: Frappe CRM + passende WhatsApp-App + Ergänzung aus B3. (b) Meta-App, System-User-Token, Webhook. (c) Test mit Meta-Testnummern. (d) Produktiv. Lokale Speicherung (EU) **vor** der Registrierung klären. |
| 11 | **Kanzlei** | `whatsapp-dse-vorschlag.md` freigeben lassen (Meta als Auftragsverarbeiter, USA, Hinweis vor dem Klick, Speicherdauer). Erst danach `WHATSAPP_NUMBER` im Deploy setzen. |
| 12 | **Vorlagen** | `ph_termin_bestaetigung`, `ph_angebot_bereit`, `ph_rueckfrage` in Frappe anlegen und bei Meta einreichen. **Keine Marketing-Vorlagen** ohne eigenes Opt-in. |
| 13 | **Livegang** | `WHATSAPP_NUMBER=+43557446255` (oder die gewählte Nummer) im Deploy setzen. Damit erscheint der Einstieg auf der Website. Danach 1 Woche Kontrolle: Kommt jede Nachricht in Frappe an, wird sie zugewiesen? |

**Profiltexte (Vorschlag):**
- Info (≤ 139 Zeichen): „Einrichtungsstudio mit Café in Lochau am Bodensee. Beratung auf Deutsch und Englisch.“
- Beschreibung: „Platzhirsch Home Living plant Wohnräume, Küchen und Objekte für Vorarlberg, die Ostschweiz, Liechtenstein und den Bodensee. Schreiben Sie uns Ihre Frage, gern mit Fotos und Maßen. Wir antworten während der Öffnungszeiten: Dienstag bis Freitag 10 bis 18 Uhr, Samstag 10 bis 14 Uhr. Für einen Termin im Showroom: platzhirsch.studio“

**Begrüßung (automatisch, erste Nachricht):**
> Guten Tag, hier ist Platzhirsch Home Living in Lochau. Danke für Ihre Nachricht. Wir lesen sie während der Öffnungszeiten und melden uns dann persönlich. Fotos und Maße Ihres Raums helfen uns bei der Antwort. Hinweise zum Datenschutz: platzhirsch.studio/datenschutz

**Abwesenheit (außerhalb der Öffnungszeiten):**
> Guten Tag, das Studio ist gerade geschlossen. Wir sind Dienstag bis Freitag von 10 bis 18 Uhr und Samstag von 10 bis 14 Uhr für Sie da und antworten dann. Einen Termin können Sie jederzeit hier wählen: platzhirsch.studio/termin

(EN-Fassungen in `whatsapp-messages.json`. Die Zeiten werden in Frappe aus der Tabelle eingesetzt, nicht fest im Text.)

---

## Teil D – Gesprächsleitfaden und Schnellantworten

**Haltung:** Gastgeber, nicht Händler. Sie-Form, kurze Sätze, Fakten statt Adjektive, kein Ausrufezeichen, keine Wörter wie „Luxus“, „exklusiv“, „Traum“, „beste“. Emojis nur, wenn der Kunde sie nutzt, höchstens eins. Mit Vornamen unterschreiben („Viele Grüße, Lena“), damit klar ist, dass ein Mensch schreibt.

**Ablauf in fünf Schritten**
1. **Ankommen:** persönlich antworten, auch wenn die Begrüßung schon kam. Auf den Kontext eingehen (Produkt, Raum).
2. **Verstehen:** eine Frage pro Nachricht. Raum, Maße, Fotos, Zeitrahmen, Stil.
3. **Zeigen:** passende Beispiele als Link auf die eigene Website (keine Herstellerbilder schicken, deren Freigabe fehlt).
4. **Einladen:** Termin im Showroom, Videoberatung oder Besuch vor Ort. Handzeichnung und Raummodell erklären, wenn es um ein Projekt geht.
5. **Festhalten:** Wichtiges im CRM-Lead notieren. Verbindliches (Preis, Liefertermin, Auftrag) nur schriftlich per Angebot, nicht im Chat zusagen.

**Grenzen:** keine Zahlungsdaten, Ausweise oder IBAN im Chat. Keine Preise schätzen („auf Anfrage“, bis das Angebot steht). Keine pauschalen Liefer- oder Montageversprechen (Entscheidung Nr. 3: „auf Wunsch“). Reklamationen und heikle Themen telefonisch oder vor Ort. Wenn ein Kunde „STOPP“ oder Ähnliches schreibt: bestätigen und im CRM „kein WhatsApp“ setzen.

**Schnellantworten (in Frappe als Textbausteine, Kürzel in Klammern)**

| Kürzel | Text |
|---|---|
| `/hallo` | Guten Tag {Name}, danke für Ihre Nachricht. Ich bin {Vorname} und kümmere mich darum. |
| `/raum` | Damit ich Sie gut beraten kann: Schicken Sie mir gern zwei, drei Fotos des Raums und die ungefähren Maße. Eine Handskizze reicht. |
| `/upload` | Für Pläne oder viele Fotos ist dieser Weg einfacher: platzhirsch.studio/upload. Die Dateien landen direkt bei uns. |
| `/preis` | Den Preis rechnen wir für Ihre Ausführung, also Maße, Stoff oder Leder und Lieferung. Wenn Sie mir diese Angaben schicken, bekommen Sie ein schriftliches Angebot. |
| `/termin` | Am besten sehen und probieren Sie es bei uns in Lochau, mit einem Espresso im Café. Einen Termin wählen Sie hier: platzhirsch.studio/termin. Wenn es Ihnen lieber ist, schlage ich Ihnen zwei Zeiten vor. |
| `/video` | Wir können uns auch per Video sehen. Sie zeigen mir den Raum, ich zeige Ihnen Muster. Den Termin dafür wählen Sie hier: platzhirsch.studio/termin |
| `/zeichnung` | Bei einem ganzen Raum zeichnet Harald Menghin das Konzept zuerst von Hand und baut ein kleines Raummodell. Danach folgen 3D-Planung und Rendering. Dafür kommt er gern zu Ihnen und nimmt sich die Zeit, die der Raum braucht. |
| `/schweiz` | Viele unserer Kunden wohnen in der Schweiz. Wie Kauf, Verzollung und Lieferung ablaufen, steht hier: platzhirsch.studio/einkaufen-aus-der-schweiz. Ihre Fragen dazu beantworte ich gern. |
| `/lieferung` | Lieferung und Montage übernehmen wir auf Wunsch. Ob und wann das bei Ihnen möglich ist, kläre ich mit Ihnen, sobald wir wissen, was es wird. |
| `/muster` | Stoff- und Ledermuster liegen im Showroom. Ich lege Ihnen eine Auswahl für Ihren Besuch bereit, sagen Sie mir nur Farbe und Nutzung (Kinder, Hund, viel Sonne). |
| `/merkliste` | Danke für Ihre Merkliste. Ich sehe sie mir an und melde mich mit Fragen zu Maßen und Ausführung. |
| `/uebergabe` | Ihre Frage gebe ich an {Kollegin/Kollege} weiter, die oder der sich bei Planungen dieser Art auskennt. Sie oder er meldet sich hier im Chat. |
| `/telefon` | Das bespricht sich am Telefon leichter. Darf ich Sie anrufen? Sagen Sie mir gern, wann es Ihnen passt. Sie erreichen uns auch unter +43 5574 46255. |
| `/geschlossen` | Danke für Ihre Geduld. Das Studio war geschlossen, jetzt bin ich für Sie da. |
| `/datenschutz` | Ihre Nachrichten nutzen wir nur für Ihre Anfrage. WhatsApp gehört zu Meta, das die Nachrichten für uns überträgt. Details: platzhirsch.studio/datenschutz. Wenn Sie lieber per E-Mail schreiben: info@platzhirsch.studio |
| `/stopp` | Verstanden, wir schreiben Ihnen hier nicht mehr. Für Fragen erreichen Sie uns weiter telefonisch oder per E-Mail. |
| `/danke` | Danke für das Gespräch. Ich habe alles notiert. Wenn Ihnen noch etwas einfällt, schreiben Sie einfach hier. |
| `/en-hallo` | Good day {name}, thank you for your message. I'm {first name} and will take care of it. |
| `/en-termin` | The best way is to see and try it in our showroom in Lochau, with an espresso in the café. You can pick a time here: platzhirsch.studio/en/termin |

---

## Offene Punkte

- Frappe-Version des Backoffice (`bench version`) entscheidet über die WhatsApp-App (A2).
- Ob Meta „Local Storage“ für die EU/Deutschland anbietet, ist nicht aus einer Meta-Quelle belegt. Vor der Registrierung der Nummer klären.
- Tarifbeträge „Rest of Western Europe“ und „Germany“ aus der aktuellen Ratenkarte holen.
- Antwortzusage und Zuständigkeiten (C7, C9) legt der Inhaber fest.
- DSE-Ergänzung: Freigabe durch die Kanzlei (`whatsapp-dse-vorschlag.md`) vor `WHATSAPP_NUMBER` im Deploy.
