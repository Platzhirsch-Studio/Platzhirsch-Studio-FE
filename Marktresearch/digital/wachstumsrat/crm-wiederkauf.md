# Wachstumsrat: CRM, Wiederkauf und Trigger-Marketing

**Kürzel:** crm-wiederkauf · **Stand:** 28.10.2026 · **Gremium:** CRM-, Retention- und Trigger-Marketing-Experten
**Grundlage:** `23-masterkonzept.md` (Abschn. 10, Idee 3 Circle + Produktpass), `14-ideen-kundenerlebnis-marketing.md` (Ideen 12, 13, 14, 23), `15-ideen-priorisierung.md`, `10-zubehoer-kerzen-duefte-geschenke.md`, `digital/11-crm-automation.md` (F3–F11), `marketing/email-flows.md` (Abschn. 0–8), `digital/features/kundenportal.md`, `recht/06-gutschein-event-bewertung-bedingungen.md`, `digital/teamleiter/inhaber-entscheidungen.md`. Code nur gelesen: `src/lib/forms/newsletter.js`, `src/components/Newsletter/`, `src/components/CartPage/CartPage.js`, `src/app/[locale]/portal/**`, `src/app/[locale]/atelierverkauf`, `src/app/[locale]/adventsabend`, `src/app/[locale]/gutscheine`.
**Live-Prüfung:** Der Dev-Server unter `localhost:3000` war während der Prüfung nicht erreichbar, `localhost:4545` gab für alle Pfade (auch `/de`) 404 zurück, weil parallel umgebaut wird. Deshalb gibt es keine Screenshots. Bewertet wurde auf Basis von Code und Dokumentation.

> **Spielregeln für alle Texte hier:** Sie-Form, de-AT, Gastgeber-Stimme, keine Superlative, keine Ausrufezeichen. Händler-Aussagen nur zu **ClassiCon** und **Ezarri**. Zu Minotti nur „im Showroom in Lochau erleben“. Keine Rabatte in Prozent und keine erfundenen Preise. Zahlen ohne Quelle sind als **[Schätzung]** gekennzeichnet. Rechtliche Punkte mit **[PRÜFEN: Anwalt]** müssen vor dem ersten Versand freigegeben werden.

---

## 1. Urteil zum Ist-Stand

**Note: 4/10.** Die Bausteine für Wiederkauf sind gut, aber das Datenfundament fehlt noch, das sie verbindet.

| Bereich | Stand | Note |
|---|---|---|
| Inhalte für die Zeit nach dem Kauf (`email-flows.md` 3.0–3.4: Danke, Pflege, Bewertung, Jahrestag) | Gute, rechtssaubere Entwürfe, Ton passt | 7 |
| Kundenportal mit Produktpass (`/de/portal/pass`): Kaufdatum, Lieferdatum, Pflege, Garantie, Formular für Neubezug und Inzahlungnahme | Stark und im Markt selten. Läuft aber nur mit dem Mock-Adapter, es gibt keine echten Daten und keine Ereignisse, die eine Automation auslösen | 6 |
| Anlässe vor Ort (Adventsabend mit RSVP und `.ics`, Atelierverkauf mit Reservierung, Gutscheine) | Vorhanden, aber kein Anlass schreibt in eine gemeinsame Kundenakte | 5 |
| Newsletter-Anmeldung (`src/lib/forms/newsletter.js`) | Sendet **nur die E-Mail-Adresse**: keine Interessen, kein Land, kein Kundentyp, kein Geburtstag und keine dokumentierte Version des Einwilligungstexts | 3 |
| Merkliste (`CartPage.js`) | Liegt nur im `localStorage` des Browsers. Es gibt keine E-Mail, kein Konto und damit **keinen Trigger** für Merkliste, Verfügbarkeit oder Preis | 2 |
| Versandwerkzeug und CRM | Brevo-Konto noch nicht angelegt, Frappe-Felder (`lieferdatum`, `pflege_kategorie`, Herkunft) fehlen laut `digital/11` F11 | 2 |
| Kundenclub und Empfehlungsprogramm | Nur als Idee vorhanden (14/12, 14/13), keine Regeln, keine Seite, kein Prozess | 1 |
| Einheitliche Stammdaten | **Fehler:** Alle Marketing-Unterlagen nennen noch **„Landstraße 9“**: `email-flows.md` (Z. 31, 122, 474, 515), `qr-karte-bewertung.md`, `architekten-programm.md`, `firmengeschenke-advent-2026.md`, `google-ads-kampagnen.md`, `ads-csv/07-sitelinks.csv` und der Generator `ads-csv/generator/gen-ads.js`. Laut Inhaber-Entscheidung Nr. 2 gilt **Landstraße 11** | P0 |

**Kern des Problems:** Platzhirsch kennt seine Kunden persönlich, aber das System kennt sie nicht. Kein einziger der unten beschriebenen Trigger kann heute automatisch auslösen, weil Kaufdatum, Produktkategorie, Einwilligung und Interesse nirgends maschinenlesbar zusammenkommen.

---

## 2. Befunde und Chancen

### 2.1 Wie Wiederkauf bei Designmöbeln funktioniert

Ein Sofa kauft man nicht jedes Jahr. Wiederkauf entsteht bei Platzhirsch auf **fünf Wegen**. Jeder braucht einen anderen Auslöser:

| Weg | Was passiert | Typischer Abstand [Schätzung] | Auslöser |
|---|---|---|---|
| **1. Raum für Raum** | Nach dem Wohnzimmer folgen Essplatz, Schlafzimmer, Terrasse und Küche | 6–24 Monate | Projektabschluss, Jahrestag, Portal „Neue Planung“ |
| **2. Raum vollenden** | Leuchte, Teppich, Kissen, Beistelltisch, Kunst, Accessoires | 1–3 Monate nach Lieferung | Lieferung T+45 |
| **3. Verbrauch und Saison** | Kerzen, Raumduft-Nachfüller, Outdoor-Kissen, Schutzhüllen, Pflegemittel | Kerzen 6–10 Wochen, Outdoor jährlich | Kaufdatum Verbrauchsartikel, Saisonkalender |
| **4. Service und zweites Leben** | Pflege-Check, Neubezug, Wintereinlagerung, Inzahlungnahme über Circle | 6 Monate bis 7 Jahre | Produktpass |
| **5. Weitergeben** | Empfehlung an Freunde, Architektin, Hotelier, Bootsnachbarn | jederzeit, am häufigsten 1–3 Monate nach einem guten Einzug | Empfehlungseinladung |

`10-zubehoer` schätzt mit Zubehör und Geschenken im ersten Jahr **60–150 Tsd. € Netto-Umsatz** [S]. Der größere Hebel sind aber die Wege 1, 4 und 5. Sie bringen Aufträge mit fünfstelligem Warenkorb.

### 2.2 Wirtschaftliche Logik [Schätzung, Annahmen offen gelegt]

- **Annahme A:** 150–300 Bestandskunden mit Auftrag aus den letzten 5 Jahren. Die echte Zahl kommt aus Frappe oder der Buchhaltung.
- **Annahme B:** Durchschnittlicher Folgeauftrag „Raum für Raum“ 8.000–20.000 €, „Raum vollenden“ 500–2.500 €.
- **Annahme C:** Wenn die Trigger 1, 5, 7, 8 und 20 sauber laufen, steigt die Wiederkaufquote im Bestand um 2–5 Prozentpunkte pro Jahr. Das deckt sich mit dem Ziel „Basis + 2 Pp.“ im Beiratsplan (`27`, Z. 263).
- **Rechnung:** 200 Kunden × 3 Pp. = 6 zusätzliche Folgeprojekte × 12.000 € ≈ **70 Tsd. € pro Jahr**. Dazu kommen „Raum vollenden“ (200 × 15 % × 1.200 € ≈ 36 Tsd. €) und Empfehlungen (siehe 3.4). **Zusammen etwa 120–250 Tsd. € zusätzlicher Jahresumsatz aus dem Bestand [Schätzung].** Das bringt noch keine Million pro Monat, kostet aber fast kein Kapital und ist der profitabelste Umsatz, weil Werbekosten wegfallen.
- **Hotels und Gastronomie (neues Ziel):** Hier ist Wiederkauf planbar. Textilien, Polster und Bettwäsche-nahe Ausstattung werden in kürzeren Zyklen getauscht als die Möbel [Schätzung: Textilien 3–5 Jahre, Polster und Teppiche 5–7 Jahre, Möbel 10+ Jahre; mit Hotel-Experten prüfen]. Ein eingerichtetes Hotel ist damit ein Kunde mit festem Kalender. Das passt zu Idee 2 im Masterkonzept (Einrichtung gegen Monatsrate mit Auffrischung).
- **Yacht:** Umbauten und Auffrischungen (Refit) finden typischerweise im Winterlager statt [Schätzung]. Daraus folgt ein fester Termin im Herbst.

### 2.3 Rechtlicher Rahmen: vier Grundlagen, sauber getrennt

Jeder Trigger in Abschnitt 3.1 ist genau einer dieser Grundlagen zugeordnet. Das ist wichtig, weil Österreich bei E-Mail-Werbung auch gegenüber Unternehmen keine Ausnahme kennt (§ 174 Abs. 3 TKG 2021, siehe `email-flows.md` 0.1).

| Kürzel | Grundlage | Darf | Darf nicht | Pflicht |
|---|---|---|---|---|
| **V** | Vertrag/Service (Art. 6 Abs. 1 lit. b DSGVO) | Bestätigungen, Liefer- und Termininfos, Pflegehinweise zum gekauften Stück, Gewährleistungshinweis | jede Form von Neuheit, Angebot, Einladung oder Gutschein. Ein einziger Werbeblock macht die Mail zu Werbung | nichts Zusätzliches |
| **B** | Bestandskunde: § 174 Abs. 4 TKG (AT), § 7 Abs. 3 UWG (DE), Art. 3 Abs. 1 lit. o UWG (CH) | Werbung per E-Mail für **eigene, ähnliche** Produkte an Käufer, die nicht widersprochen haben | Fremdangebote, Partnerprodukte ohne eigenen Verkauf, Werbung an reine Interessenten | Widerspruchslink in jeder Mail, **Abgleich mit der ECG-Liste der RTR** vor dem Versand ([BVwG W603 2304292-1](https://gesetzefinden.at/judikatur/bvwg/bvwgt_20250527_w603_2304292_1_00), [BVwG W282 2299749-1](https://gesetzefinden.at/judikatur/bvwg/bvwgt_20241223_w282_2299749_1_00)), Fußzeile B. Bußgeld bis 50.000 € ([WKO](https://www.wko.at/internetrecht/e-mail-fax-telefonwerbung-telekommunikationsgesetz-detail)) |
| **E** | Einwilligung, zweckgebunden (Art. 6 Abs. 1 lit. a DSGVO plus TKG/UWG), mit Double-Opt-in | Newsletter, Event, Merkliste-Erinnerung, Verfügbarkeitsalarm, Geburtstag, WhatsApp | Zweck erweitern ohne neue Einwilligung | Einwilligungstext-Version, Zeitstempel, Quelle protokollieren, Widerruf jederzeit |
| **P** | Brief per Post (berechtigtes Interesse, Art. 6 Abs. 1 lit. f DSGVO) | Einladungen und Briefe an Kunden und frühere Interessenten ohne E-Mail-Einwilligung | an Personen, die widersprochen haben oder auf der Robinsonliste stehen [PRÜFEN: Anwalt, § 151 GewO / Robinsonliste der WKO] | Hinweis auf das Widerspruchsrecht im Brief |

**Telefon:** Werbeanrufe brauchen in Österreich eine vorherige Einwilligung (§ 174 Abs. 1 TKG 2021). Anrufe zur laufenden Anfrage oder zu einem gelieferten Auftrag („Passt alles?“) sind Service. Ein Anruf mit Einladung zum Saisonabend ist Werbung und nur mit Einwilligung erlaubt [PRÜFEN: Anwalt].
**WhatsApp:** nur mit eigener ausdrücklicher Einwilligung, zusätzlich zu den Regeln von Meta ([HubSpot](https://blog.hubspot.de/marketing/whatsapp-newsletter)). Empfehlung: WhatsApp nur als **Antwortkanal** für Kunden, die selbst schreiben. Werbliche Nachrichten über WhatsApp erst ab Phase 3.
**Bewertungen:** Google verbietet Anreize, selektives Anfragen und das Abhalten von negativen Bewertungen ([Google-Richtlinie](https://support.google.com/contributionpolicy/answer/7400114)). Laut Fachberichten zum Update 2026 sind auch Vorgaben an Mitarbeitende (Quoten, Nennung von Mitarbeiternamen) erfasst ([ppc.land](https://ppc.land/google-tightens-maps-review-policy-staff-names-and-quotas-now-banned/); auf der Google-Seite selbst nicht bestätigt). **Folge:** Empfehlungsprogramm und Club dürfen **nie** an eine Bewertung gekoppelt werden. Keine Bewertungsquote fürs Team, keine Bitte „nennen Sie Frau X“.
**Empfehlungen:** Freunde dürfen **nicht** über ein Formular „Freund einladen“ von Platzhirsch angeschrieben werden. Der BGH hat Weiterempfehlungs-Mails im Namen des Unternehmens als unzulässige Werbung eingestuft (I ZR 208/12, 12.09.2013, „Empfehlungs-E-Mail“) [PRÜFEN: Anwalt, Übertragbarkeit auf AT/CH]. Lösung: Der Kunde gibt eine **Karte oder einen persönlichen Link** selbst weiter. Der Freund meldet sich selbst.

### 2.4 Chancen, die im Markt kaum jemand nutzt

1. **Der Produktpass als Wiederkauf-Maschine.** Kein regionaler Wettbewerber zeigt sichtbar eine digitale Akte je Möbelstück (`23`, Idee 3). Jeder Pass trägt Kaufdatum, Material und Pflegekategorie. Daraus folgen die Trigger 7–12 fast von selbst. Außerdem ist der Pass ein Grund, ins Portal zurückzukommen.
2. **Das Café als Bindungsort.** Möbelhändler haben kaum Anlässe für einen Besuch ohne Kaufabsicht. Platzhirsch hat einen. Geburtstag, Jahrestag und Pflege-Check enden mit dem gleichen Satz: „Kommen Sie auf einen Kaffee vorbei.“ Der Besuch im Café ist der Moment, in dem Neuheiten gesehen werden.
3. **Service statt Rabatt.** RH verlangt 200 US$ im Jahr und gibt dafür bis zu 30 % Rabatt ([RH-Bedingungen](https://rh.com/us/en/our-company/members-program-terms-and-conditions), [RH-FAQ](https://rh.com/be/en/customer-experience/frequently-asked-questions)). Für Platzhirsch passt das nicht: Rabatte belasten Markenpreise und die Beziehung zu Herstellern, und das Geld fehlt. Ein Club, dessen Vorteile Zeit, Zugang und Service sind, kostet wenig Bargeld und bindet stärker.
4. **Einmal gefragt, dauerhaft genutzt.** Brevo hat einen fertigen Trigger „Anniversary date“, der jedes Jahr auf ein Datumsfeld reagiert ([Brevo-Hilfe](https://help.brevo.com/hc/en-us/articles/22284425140754)). Damit lassen sich Geburtstag, Kaufjahrestag und Einzugstag ohne Programmierung abbilden. Hinweis aus der Community: Der Trigger vergleicht nur Tag und Monat, nicht das Jahr ([Brevo-Community](https://community.brevo.com/t/incorrect-triggering-of-automation-using-anniversary-trigger/7251)). Für einmalige Fristen (T+22 Monate) deshalb Frappe-Aufgaben oder Brevo-Workflows mit Wartezeit verwenden.

---

## 3. Fertige Bausteine

### 3.1 Automations-Map: 20 Trigger

**Legende Grundlage:** V = Vertrag/Service · B = Bestandskunde ohne Widerspruch (ECG-Abgleich) · E = Einwilligung (DOI) · P = Brief per Post.
**Legende Kanal:** M = E-Mail (Brevo) · F = persönliche Mail des Beraters aus Frappe · A = Frappe-Aufgabe für Berater (Anruf oder Besuch, nur als Service oder mit Einwilligung) · Po = Portal-Hinweis · Br = Brief.
**Phase:** 1 = sofort halbautomatisch (Frappe-Liste plus Vorlage, ab KW 45) · 2 = automatisch, sobald Frappe-Felder und Brevo stehen · 3 = braucht neue Funktionen auf der Website.

| # | Trigger (Ereignis/Datenfeld) | Zeitpunkt | Kanal | Inhalt | Grundlage | Stopp-Regel | Phase |
|---|---|---|---|---|---|---|---|
| 1 | **Auftrag bestätigt** (`deal.stage = Auftrag`) | sofort | F + Po | Auftragsbestätigung (`email-flows` 3.0) plus Einladung ins Portal: „Hier sehen Sie Termine, Dokumente und bald Ihren Produktpass.“ | V | – | 1 |
| 2 | **Lieferung erfolgt** (`lieferdatum`) | T+1 Tag | F + Po | Danke (3.1), Produktpass freigeschaltet, Pflegeanleitung als PDF | V | – | 1 |
| 3 | **Pflegekategorie** (`pflege_kategorie` je Pass) | T+10 Tage | M | Pflege-Modul je Material (3.2), ohne Werbeblock | V | Reklamation offen → nach Erledigung | 2 |
| 4 | **Bewertungsbitte** | T+14 Tage | F | 3.3, an **alle** Kunden, einmal, keine Erinnerung, kein Anreiz, kein Mitarbeitername | B (wegen BGH VI ZR 225/17) | Widerspruch/ECG → nicht senden | 1 |
| 5 | **Raum vollenden** (Projekt mit Wohn- oder Esszimmer) | T+45 Tage | F | Was dem Raum noch fehlt: 2–3 handverlesene Ergänzungen (Leuchte, Teppich, Beistelltisch, Kissen) passend zu den Fotos vom Einzug. **Vorlage A** | B oder E | Anfrage offen → Pause. Kein Versand, wenn Raum laut Berater „komplett“ ist | 1 |
| 6 | **Empfehlung und Hausgäste** (alle Lieferungen) | T+60 Tage | M | Aufnahme bei den Hausgästen (Club 3.3) plus Empfehlungskarten per Post. **Vorlage E** | B oder E | Widerspruch, Reklamation offen | 1 |
| 7 | **Pflege-Check** (Polster, Leder, Outdoor) | T+6 Monate | M + A | Kostenloser Pflege-Check im Haus oder Bringtermin, Buchungslink | B | Kunde hat Termin → stopp | 2 |
| 8 | **Kaufjahrestag** (`lieferdatum` jährlich) | T+12 Monate, danach jährlich | M | „Ein Jahr mit …“: Foto vom Einzug, Pflegehinweis, Einladung ins Café, ein Hinweis auf „Neue Planung“ im Portal. **Vorlage B** | B oder E | max. 1× im Jahr, nicht im selben Monat wie Trigger 19 | 2 |
| 9 | **Gewährleistung läuft aus** (Lieferdatum + 22 Monate; gesetzliche Gewährleistung in AT 2 Jahre) | T+22 Monate | F | Service-Hinweis: „Gibt es etwas, das wir uns ansehen sollen, bevor die zwei Jahre um sind?“ Kein Angebot | V | – | 2 |
| 10 | **Neubezug und zweites Leben** (Polster, Pass älter als 5 Jahre [Schätzung]) | T+5 Jahre, dann alle 2 Jahre | M + Po | Neubezug mit Stoffmustern, Inzahlungnahme über Circle, Formular `?anfrage=neubezug` | B | Circle-Anfrage offen | 2 |
| 11 | **Outdoor-Saisonstart** (Pass mit Outdoor-Produkt oder Interesse Outdoor) | jährlich um den 10.03. | M | Auspacken, Kissen, Aufbau-Service, Neuheiten der Outdoor-Marken. **Vorlage C** | B oder E | – | 2 |
| 12 | **Wintereinlagerung** (Outdoor-Pass) | jährlich um den 01.10. | M + A | Reinigen, Abholen, Einlagern, Rückbringen im Frühjahr (nur wenn der Service eingeführt ist, sonst Pflegehinweis) | B | Einlagerung gebucht | 2 |
| 13 | **Kerzen-/Duft-Nachkauf** (Kaufdatum Verbrauchsartikel, E-Mail an der Kasse mit Häkchen) | T+8 Wochen [Schätzung: 40–60 Brennstunden laut `10-zubehoer`] | M | „Ist Ihre [Duft] bald heruntergebrannt?“ Nachfüller, Abholung im Café, Versand | E (Häkchen an der Kasse) oder B | Nachkauf erfolgt | 2 |
| 14 | **Merkliste gesichert** (neu: „Auswahl per E-Mail sichern“, siehe 3.5) | sofort (Liste, V), T+3 Tage, T+14 Tage | M | Die gemerkten Stücke mit Bild, „im Showroom ansehen“, Termin-Link, ein Satz zur Lieferzeit, wenn bekannt | V für die Liste selbst, E für die Erinnerungen | Anfrage oder Termin → stopp. Max. 2 Erinnerungen | 3 |
| 15 | **Verfügbarkeitsalarm** (Stück oder Kategorie im Atelierverkauf, aus Merkliste oder Interesse) | sofort bei Freigabe; Hausgäste 48 h vor allen anderen | M | „Das Stück, das Sie sich gemerkt haben, steht jetzt im Atelierverkauf“: Foto, Zustand, Reservierungs-Link | E (zweckgebunden pro Alarm) | reserviert/verkauft → stopp | 3 |
| 16 | **Preisanpassung angekündigt** (Hersteller-Preisliste mit Stichtag, nur Marken mit veröffentlichtem Preis) | 21 Tage vor Stichtag | M | „Die Preise von [Marke] ändern sich am [Datum]. Angebote, die bis dahin bestätigt sind, gelten zum bisherigen Preis.“ Nur wenn es wirklich so ist | E (Merkliste) oder B (gleiche Marke gekauft) | – | 3 |
| 17 | **Marken-Neuheit** (gekaufte Marke im Pass oder Interesse) | nach den Messen: Mai (Salone) und Sept./Okt. | M | 3 Neuheiten, die ab [Datum] im Showroom stehen, mit Einladung zum Ansehen. Eigene Fotos, Herstellerbilder nur mit Freigabe | E oder B | Frequenzgrenze | 2 |
| 18 | **Café-Event** (Region, Interesse) | T−21 Einladung, T−7 Erinnerung, sofort Bestätigung mit `.ics`, T+1 Danke | M, Br für Kunden ohne E-Mail-Einwilligung | Adventsabend, Sommerabend, Neuheitenabend, Kochabend Küche/Binni, Ezarri-Abend für Pool- und Badkunden | E oder B, sonst P | Absage → nur noch Danke-Mail entfällt | 1 |
| 19 | **Geburtstag** (freiwillig, nur Tag und Monat) | am Tag, Mail um 08:00 Uhr; Karte per Post 3 Tage vorher (nur Hausgäste) | M oder Br | Glückwunsch, Kaffee und Kuchen im Café für zwei, gültig 30 Tage. Kein Rabatt. **Vorlage D** | E (eigene Einwilligung für Geburtstag) | Widerruf; Feld leer → nie | 2 |
| 20 | **Ruhender Kontakt** (Bestandskunde ohne Kontakt seit 18 Monaten; verlorenes Angebot nach 6 Monaten) | einmalig | Br (Kunden auch M mit B) | Persönlicher Brief von Susanne Meßmer: „Wie geht es Ihrem Zuhause?“, Einladung zum nächsten Abend, Pflege-Check | P, bei Kunden auch B | Widerspruch, Robinsonliste | 1 |

**B2B-Trigger (nur als Frappe-Aufgabe, persönlicher Kontakt; E-Mail-Werbung nur mit Einwilligung oder Kundenbeziehung):**

| # | Trigger | Zeitpunkt | Inhalt |
|---|---|---|---|
| H1 | Hotel/Gastro-Projekt übergeben | T+3 Monate | Begehung mit dem Hotelier: was nutzt sich ab, was fehlt (Terrasse, Lobby, Zimmer der nächsten Etage) |
| H2 | Hotel: Textilzyklus | Übergabe + 3 Jahre [Schätzung], im Jänner (vor der Sommersaison) | Auffrischung Textilien, Kissen, Teppiche; Planung in der Nebensaison |
| H3 | Hotel: Outdoor-Frühbucher | Oktober | wie `email-flows.md` 7 |
| Y1 | Yacht-Kunde | jährlich im September | Termin im Winterlager: Polster, Outdoor-Textilien, Auffrischung |
| A1 | Architekt/Planer mit Projekt | Projektende + 1 Monat | Fotos für die Referenz (mit Freigabe), Frage nach dem nächsten Projekt, Einladung zum Neuheitenabend |
| Z1 | Ezarri-Pool/Bad übergeben | T+12 Monate | Pflege der Fugen und des Mosaiks nach Herstellerangabe, Outdoor-Möbel rund um den Pool (Cross-Selling), Empfehlung an Architekten |

**Globale Regeln (in Brevo und Frappe einstellen):**
1. **Frequenzgrenze:** max. **2 werbliche Mails in 30 Tagen** pro Kontakt (Newsletter zählt mit), max. 3 Mails in 7 Tagen insgesamt. Service-Mails (V) sind ausgenommen, werden aber gebündelt, wenn sie am selben Tag fällig sind.
2. **Ruhe-Regeln:** Reklamation offen → alle B/E-Trigger pausieren (Ausnahme: Trigger 4 bis zu der Frist, die der Anwalt festlegt, damit kein Gating entsteht). Anfrage oder Angebot offen → keine automatischen Werbe-Mails, nur der Berater schreibt. Feld `nicht_kontaktieren` (manuell, z. B. Trauerfall, Streit) sperrt alles außer V.
3. **Absender:** werbliche Mails von „Susanne Meßmer · Platzhirsch“, Service und Projekt vom zuständigen Berater. Antworten landen im Datensatz.
4. **Versandzeit:** wie `email-flows.md` 0.5 (Newsletter Do 18:00, persönlich Di–Do 09:00–11:00). Keine Mails 24.–26.12. und 31.12.–01.01.
5. **Messung:** jede Mail mit UTM (`utm_campaign=trigger-<nr>-<jjjjmm>`). Ziel-KPI je Trigger: Termin gebucht, Anfrage, Atelier-Reservierung, Besuch im Café (Code der Einladung an der Kassa erfassen). Öffnungsraten nur als Tendenz.

### 3.2 Lebenszyklus-Kalender (Jahresrad)

| Monat | Anlass | Trigger | Zielgruppe |
|---|---|---|---|
| Jänner | Neues Jahr, Planungszeit; Hotels planen die Saison | 20, H2 | Bestand, Hotels |
| Februar | Outdoor-Frühbucher Privat | 11 (Vorlauf) | Outdoor-Interesse |
| März | Outdoor-Saisonstart, Ostern | 11 | Outdoor-Pässe |
| April | Salone del Mobile (Mailand) | 17 (Vorbereitung) | – |
| Mai | Neuheiten nach dem Salone, Gartenabend im Café | 17, 18 | E und B |
| Juni/Juli | Sommerabend am See, Yacht-Saison | 18 | Region |
| September | Herbst-Neuheiten, Yacht-Winterlager | 17, Y1 | Bestand, Eigner |
| Oktober | Wintereinlagerung Outdoor, Kerzen-Saison beginnt | 12, 13 | Outdoor, Kerzenkäufer |
| November | Adventsabend (26.11.2026), Firmengeschenke | 18 | alle |
| Dezember | Geschenke, Gutscheine, Kerzen; Bestandskunden-Brief | 13, `email-flows` 4 | Bestand |
| laufend | Lieferung, Jahrestag, Geburtstag, Merkliste, Atelier | 1–10, 14–16, 19 | individuell |

### 3.3 Kundenclub: „Platzhirsch Hausgäste“ (Service statt Rabatt)

*Der Name „Circle“ ist für Inzahlungnahme und Kommission vergeben (`23`, Idee 3). Deshalb heißt der Club anders.*

**Prinzip:** kostenlos, ohne Punkte, ohne Rabatt. Wer bei uns einrichtet, ist Hausgast. Die Vorteile kosten vor allem Zeit und Organisation, wenig Bargeld.

| Stufe | Wer | Vorteile |
|---|---|---|
| **Hausgast** | jede Kundin und jeder Kunde mit Lieferung; auf Einladung auch Architekten und Partner | Produktpass im Portal · Pflege-Check nach 6 Monaten · Einladungen zu den Abenden im Café vor allen anderen (Plätze sind begrenzt) · Atelierverkauf 48 Stunden vor allen anderen · Geburtstagskaffee für zwei (mit Einwilligung) |
| **Stammgast** | zweites Projekt **oder** Auftragssumme ab [Inhaber legt fest, Vorschlag 25.000 €] **oder** eine erfolgreiche Empfehlung | zusätzlich: jährlicher Pflege-Check im Haus · Leihservice für Leuchten und Outdoor-Möbel für private Feste (gegen Transportpauschale, solange verfügbar) · ein Abend im Jahr nur für Stammgäste (z. B. Neuheiten nach dem Salone) · feste Ansprechperson mit Durchwahl · Vorrang bei Einlagerung und Montageterminen |

**Kosten [Schätzung]:** 5–15 € pro Mitglied und Jahr (Druck, Porto, Kaffee) plus die Abende (500–2.000 € pro Abend, teilweise mit Marken gemeinsam finanziert). Pflege-Check: 1–2 Stunden Personalzeit.
**Regeln (Kurz-Bedingungen, Entwurf, [PRÜFEN: Anwalt]):**
1. Die Mitgliedschaft ist kostenlos und endet jederzeit auf Wunsch per Mail.
2. Die Vorteile sind Leistungen von Platzhirsch, kein Anspruch auf Preisnachlass und keine Barablöse.
3. Für die Teilnahme speichern wir Name, Kontakt, gekaufte Produkte und, nur mit Einwilligung, Geburtstag und Interessen. Keine Weitergabe an Dritte.
4. Die Mitgliedschaft hängt nicht von einer Bewertung ab und wird nicht durch eine Bewertung beeinflusst.
5. Leihgaben gegen Leihschein, Transport und Versicherung laut Leihschein.

**Umsetzung im Portal (Code-Team):** Kachel „Hausgäste“ im Dashboard mit Stufe, nächstem Abend, Pflege-Check-Buchung und Einstellungen (Kanäle, Themen, „3 Monate Pause“).

### 3.4 Empfehlungsprogramm: „Unter Freunden“

- **So funktioniert es:** Mit Trigger 6 und bei jeder Lieferung bekommt der Kunde **drei Empfehlungskarten** (Druck, mit persönlichem Code `PH-<Kundennr>-<a/b/c>`) und einen persönlichen Link zum Weitergeben. Wer den Code bei der Anfrage nennt oder über den Link kommt, wird in Frappe der Empfehlung zugeordnet (Feld `empfohlen_von`; Selbstauskunft „Empfehlung Freund/Kunde“ gibt es schon laut `digital/11` F1).
- **Für den neuen Gast:** keine Preisreduktion, sondern bevorzugte Beratung: ein Termin mit Harald Menghin für die erste Handskizze vor Ort (Kern-USP laut Inhaber-Entscheidung Nr. 8) und eine Einladung zum nächsten Abend.
- **Für den Empfehlenden:** erst **nach** dem Auftrag des Freundes (Anzahlung eingegangen, Rücktrittsfrist vorbei) eine Leistung nach Wahl:
  - Stufe 1 (Auftrag des Freundes bis 10.000 €): ein Abend für zwei im Café oder bei einem Partnerrestaurant, oder ein Pflege-Check im Haus.
  - Stufe 2 (ab 10.000 €): eine Saison Wintereinlagerung, ein Kissen-Neubezug, oder ein Objekt aus dem Accessoire-Sortiment im Wert von [Inhaber legt fest, Vorschlag 2 % des Auftrags, höchstens 500 €].
  - Ab der ersten erfolgreichen Empfehlung: Stufe „Stammgast“.
- **Warum Leistungen und kein Bargeld:** Eine Leistung kostet Platzhirsch nur den Einkaufs- oder Personalwert, je nach Leistung grob 40–60 % des Verkaufswerts [Schätzung]. Das schont die Liquidität. Branchenberichte halten bei Möbeln nur spürbare Belohnungen für wirksam (`14`, Idee 13).
- **Erwartung [Schätzung]:** 5–10 % der Aufträge über Empfehlungen (`14`). Bei 200 Kunden und 3 Karten = 600 Karten. Wenn 2 % davon zu einem Auftrag führen, sind das 12 Aufträge × 8.000–15.000 € ≈ **100–180 Tsd. € pro Jahr**.
- **Verboten:** Belohnung für Bewertungen. Ein Formular, in das der Kunde die Adresse des Freundes einträgt. Belohnung für reine Kontakte ohne Auftrag (lädt zu Missbrauch ein). Hinweis „nur für zufriedene Kunden“.
- **B2B-Variante:** Architekten und Planer laufen über `marketing/architekten-programm.md`, nicht über dieses Programm (Provisionen gegenüber Bauherren offenlegen [PRÜFEN: Anwalt]).

### 3.5 Spezifikation für das Code-Team (Daten und Website)

| # | Baustein | Was genau | Wo |
|---|---|---|---|
| D1 | **Einwilligungs-Protokoll** | Jede Einwilligung als eigener Datensatz: `kontakt`, `zweck` (newsletter, event, merkliste_erinnerung, alarm:<id>, geburtstag, whatsapp), `textversion`, `zeitpunkt`, `quelle` (Seite/Formular), `doi_bestaetigt_am`, `widerrufen_am`. Werbe-Trigger prüfen vor dem Versand diesen Datensatz | Frappe-Doctype `PH Consent`; Website sendet `zweck` und `textversion` mit |
| D2 | **Newsletter-Formular erweitern** | Optional: Interessen-Chips (Wohnen, Küche, Outdoor, Licht, Accessoires/Kerzen, Atelierverkauf, Abende im Café, Pool/Ezarri, Yacht, Hotel/Gastro), Land (AT/DE/CH/FL), Kundentyp (Privat/Architekt/Hotel). Danach im Danke-Schritt: „Dürfen wir Ihnen zum Geburtstag schreiben? (Tag/Monat, freiwillig)“ mit eigenem Häkchen | `src/lib/forms/newsletter.js` + `schemas.js` + `components/Newsletter/` (heute nur `email`) |
| D3 | **Merkliste per E-Mail sichern** | Knopf „Auswahl per E-Mail sichern“ auf `/merkliste`: E-Mail-Feld, sofortige Mail mit Liste (Service), **getrenntes, nicht vorangekreuztes** Häkchen „Erinnern Sie mich, falls ich nicht dazukomme“ (E) und „Sagen Sie mir Bescheid, wenn eines dieser Stücke im Atelierverkauf auftaucht“ (E). Neue API-Route mit `guardForm` wie die bestehenden Formulare | neue Route `/api/merkliste_sichern`, `CartPage.js` |
| D4 | **Ereignisse aus dem Portal** | Bei `lieferdatum`, neuem Produktpass, Anfrage `neubezug`/`inzahlungnahme`, Pflege-Check-Buchung: Webhook oder Frappe-Notification an Brevo (Kontakt-Attribute `LIEFERDATUM`, `PFLEGE_KAT`, `OUTDOOR`, `MARKEN`, `STUFE`) | Frappe (`digital/11` F11) + Portal-Adapter |
| D5 | **Einstellungen im Portal** | Seite `/portal/einstellungen`: Kanäle (E-Mail, Post, WhatsApp), Themen, Geburtstag ändern/löschen, „3 Monate Pause“, alle Einwilligungen einsehen und widerrufen | Portal |
| D6 | **Empfehlungs-Link** | `/empfehlung/<code>` setzt einen Hinweis in die nächste Anfrage (ohne Cookie: Code als URL-Parameter ins Formular übernehmen), Feld `empfehlungscode` in allen Anfrage-Formularen | Formulare, Frappe |
| D7 | **Kassa/Café** | Häkchen-Karte an der Kassa für Kerzen/Duft (E-Mail + Einwilligung Nachkauf-Erinnerung), Einlöse-Code der Einladungen erfassen | Prozess Inhaber, Formular-Vorlage |
| D8 | **Fehler beheben** | „Landstraße 9“ in allen Marketing-Unterlagen und im Ads-Generator auf „Landstraße 11“ ändern | `Marktresearch/marketing/**` (siehe 1) |

### 3.6 Fünf E-Mail-Vorlagen im Gastgeber-Ton

*Platzhalter in [eckigen Klammern]. Fußzeile A (Newsletter-Einwilligung) oder B (Bestandskunde) laut `email-flows.md` 0.2, **mit Landstraße 11**. UTM laut 3.1, Regel 5.*

---

#### Vorlage A: Raum vollenden (Trigger 5, T+45, persönlich vom Berater)

- **Betreff:** Ihr [Wohnzimmer] nach sechs Wochen
- **Preheader:** Drei Gedanken, die uns beim Einzug gekommen sind.
- **Text:**

> Guten Tag [Frau/Herr Nachname],
>
> seit gut sechs Wochen steht [Ihr Sofa / Ihr Esstisch] bei Ihnen. Beim Einzug habe ich mir ein paar Notizen gemacht. Ein Raum ist selten am ersten Tag fertig. Meist zeigt sich erst nach einigen Wochen, wo abends Licht fehlt oder wo ein Platz für das Buch und das Glas wäre.
>
> Drei Ideen, die mir für Ihren Raum eingefallen sind:
>
> – [Ergänzung 1, z. B. eine Leseleuchte neben dem Sofa, weil die Ecke am Fenster abends dunkel wird]
> – [Ergänzung 2, z. B. ein Teppich, der die Sitzgruppe zusammenhält]
> – [Ergänzung 3, z. B. ein kleiner Beistelltisch aus dem gleichen Holz wie Ihr Regal]
>
> Das ist kein Muss. Wenn Sie mögen, bringe ich Ihnen zwei, drei Stücke zum Ausprobieren vorbei, oder Sie schauen auf einen Kaffee bei uns in Lochau vorbei und wir legen die Sachen nebeneinander.
>
> Herzliche Grüße
> [Vorname Nachname]
> [Durchwahl]

- **CTA:** „Termin für ein Ausprobieren vereinbaren“ → `/de/beratung?anlass=raum-vollenden` · Textlink „Antworten genügt“
- **Bild:** ein eigenes Foto vom Einzug (nur mit Einverständnis des Kunden) oder ein Showroom-Foto
- **Regeln:** Ergänzungen schreibt der Berater selbst, keine automatische Produktliste. Keine Preise im Text, keine Fristen. Fußzeile B oder A.

---

#### Vorlage B: Ein Jahr zuhause (Trigger 8, Kaufjahrestag)

- **Betreff:** Ein Jahr mit [Produkt]
- **Preheader:** Ein kleiner Gruß aus Lochau und ein Tipp für das zweite Jahr.
- **Text:**

> Guten Tag [Frau/Herr Nachname],
>
> heute vor einem Jahr haben wir [Ihr Sofa / Ihre Küche] zu Ihnen gebracht. Wir denken gern an diesen Tag zurück, [an den Blick auf den See / an das Aufmaß im Rohbau / an Ihre Entscheidung für den hellen Stoff].
>
> Für das zweite Jahr ein Hinweis aus unserer Werkstatt: [Pflege-Modul kurz, z. B. „Polster setzen sich jetzt nicht mehr, aber Kissen danken es, wenn man sie ab und zu wendet. Direkte Mittagssonne hellt Stoffe mit der Zeit auf.“]
>
> Falls Sie im Lauf des Jahres über einen weiteren Raum nachgedacht haben: Im Kundenportal finden Sie unter „Neue Planung“ den kürzesten Weg zu uns. Dort liegen auch Ihr Produktpass und alle Unterlagen.
>
> Und wenn Sie wieder einmal am Bodensee unterwegs sind: Der Kaffee im Café geht auf uns. Zeigen Sie einfach diese Mail.
>
> Herzlich
> Susanne Meßmer

- **CTA:** „Ihren Produktpass öffnen“ → `/de/portal/pass` · Textlink „Neue Planung“ → `/de/portal/anfragen`
- **Regeln:** Einladung auf einen Kaffee ist eine Zugabe ohne Kaufbedingung [PRÜFEN: Anwalt, § 9a UWG AT]. Fußzeile B oder A. Nicht senden, wenn Reklamation offen.

---

#### Vorlage C: Outdoor-Saisonstart (Trigger 11, um den 10.03.)

- **Betreff:** Die Terrasse wartet
- **Preheader:** Was Ihre Outdoor-Möbel nach dem Winter brauchen und wann wir helfen können.
- **Text:**

> Guten Tag [Frau/Herr Nachname],
>
> am See werden die Abende länger. Zeit, die Terrasse aufzuwecken.
>
> Drei Handgriffe für den Saisonstart:
> 1. Gestelle mit einem weichen Tuch und klarem Wasser abwischen, bevor die Kissen draufkommen.
> 2. Kissen vor dem ersten Gebrauch gut lüften. Feuchtigkeit aus dem Winterlager ist der häufigste Grund für Flecken.
> 3. Sonnenschirme vor dem Öffnen auf Schäden prüfen. Die Windgrenzen stehen in der Anleitung des Herstellers.
>
> [Nur wenn eingeführt:] Wenn wir Ihre Möbel eingelagert haben, bringen wir sie ab [Datum] zurück. Den Wunschtermin wählen Sie hier.
>
> Neu bei uns im Garten vor dem Showroom: [2–3 Neuheiten der Outdoor-Marken, eigene Fotos]. Wer seine Terrasse ergänzen will, kann im April in Ruhe Probe sitzen, am liebsten an einem sonnigen Nachmittag mit einem Glas im Café.
>
> Herzliche Grüße
> [Vorname Nachname]

- **CTA:** „Rückliefertermin wählen“ (nur Einlagerungskunden) bzw. „Probesitzen im Garten vereinbaren“ → `/de/beratung?anlass=outdoor`
- **Regeln:** Pflegehinweise allgemein halten, Herstellerangaben gehen vor. Fußzeile B oder A. Variante Hotel → stattdessen Frappe-Aufgabe H3.

---

#### Vorlage D: Geburtstag (Trigger 19, nur mit Geburtstags-Einwilligung)

- **Betreff:** Alles Gute, [Vorname]
- **Preheader:** Ein Kaffee und ein Stück Kuchen warten in Lochau auf Sie.
- **Text:**

> Liebe [Vorname] / Lieber [Vorname],
>
> heute ist Ihr Tag. Wir wünschen Ihnen alles Gute, ein Jahr mit vielen schönen Abenden zuhause und Menschen, die man gern an den eigenen Tisch einlädt.
>
> Wenn Sie in den nächsten Wochen in der Gegend sind: Kaffee und Kuchen für Sie und eine Begleitung gehen auf uns. Sie müssen nichts mitbringen außer dieser Mail und ein bisschen Zeit.
>
> Herzlich aus Lochau
> Susanne Meßmer und das Platzhirsch-Team

- **CTA:** „Öffnungszeiten des Cafés“ → `/de/kontakt`
- **Regeln:** Kein Produkt, kein Angebot, kein Rabatt. Einlösbar 30 Tage, Code `GEB-<jjjj>-<id>` an der Kassa erfassen. Hausgäste (Stammgast) bekommen zusätzlich 3 Tage vorher eine handgeschriebene Karte per Post. Anrede per Du/Vorname nur, wenn der Kunde so angelegt ist, sonst „Guten Tag [Frau/Herr Nachname]“. Fußzeile A mit Hinweis „Sie haben uns erlaubt, Ihnen zum Geburtstag zu schreiben. [Nicht mehr erhalten]“.

---

#### Vorlage E: Willkommen bei den Hausgästen, mit Empfehlungskarten (Trigger 6, T+60)

- **Betreff:** Ab jetzt sind Sie Hausgast
- **Preheader:** Was das für Sie bedeutet und warum wir Ihnen drei Karten schicken.
- **Text:**

> Guten Tag [Frau/Herr Nachname],
>
> wer bei uns eingerichtet hat, gehört für uns zum Haus. Deshalb sind Sie ab heute Hausgast bei Platzhirsch, ganz ohne Anmeldung und ohne Kosten.
>
> Was das heißt:
> – Zu unseren Abenden im Café laden wir Sie ein, bevor die Plätze öffentlich werden.
> – Wenn Stücke aus der Ausstellung in den Atelierverkauf gehen, erfahren Sie es 48 Stunden vor allen anderen.
> – Nach einem halben Jahr schauen wir uns Ihre Polster und Oberflächen an, wenn Sie das möchten.
> – Ihr Produktpass im Kundenportal hält alles fest, was Sie über Ihre Stücke wissen müssen.
>
> In den nächsten Tagen kommt außerdem ein Kuvert mit drei Karten. Sie sind für Menschen gedacht, denen Sie unsere Arbeit gönnen. Wer mit einer Karte zu uns kommt, bekommt einen ersten Termin bei Harald Menghin, der Räume zuerst von Hand skizziert, bevor irgendetwas am Bildschirm entsteht. Wenn daraus ein Auftrag wird, bedanken wir uns bei Ihnen mit einem Abend für zwei oder einem Service für Ihr Zuhause. Sie entscheiden, wem Sie eine Karte geben. Wir schreiben niemanden an.
>
> Danke, dass Sie bei uns sind.
>
> Herzlich
> Susanne Meßmer

- **CTA:** „Was Hausgäste erwartet“ → `/de/hausgaeste` [Seite anlegen] · Textlink „Ihren persönlichen Empfehlungslink kopieren“ → Portal
- **Regeln:** Nicht an eine Bewertung koppeln, nicht im selben Satz wie die Bewertungsbitte. Bedingungen für die Dankeschön-Leistung verlinken. Fußzeile B oder A.

---

## 4. Maßnahmen

| Prio | Maßnahme | Aufwand | Kosten grob | Erwarteter Umsatzeffekt (Begründung) | Wer |
|---|---|---|---|---|---|
| **P0** | „Landstraße 9“ in allen Marketing-Unterlagen, QR-Karte, Ads-CSV und Ads-Generator auf „Landstraße 11“ ändern | S | 0 € | indirekt: falsche Adresse in Mails, Anzeigen und auf der Bewertungskarte schadet der lokalen Auffindbarkeit (gleiche Adresse überall) und dem Vertrauen | Code-Team/Marketing |
| **P0** | Kundenliste der letzten 5 Jahre aus Frappe/Buchhaltung exportieren: Kontakt, Auftragsdatum, Lieferdatum, Produkte, Kategorie, Widerspruch ja/nein; ECG-Abgleich | M | 0 € (1–2 Personentage) | Voraussetzung für alle Bestandskunden-Trigger. Ohne Liste kein Umsatz aus dem Bestand | Inhaber |
| **P0** | Trigger 4, 5, 18, 20 **sofort halbautomatisch** starten: Frappe-Liste „Lieferung vor 14/45 Tagen“, Vorlagen aus 3.6 und `email-flows` | S | 0 € | Raum vollenden: 200 × 15 % × 1.200 € ≈ 36 Tsd. €/Jahr [Schätzung]; Abende und Briefe aktivieren ruhende Kunden | Inhaber/Beratung |
| **P1** | Brevo-Konto, SPF/DKIM/DMARC, AVV, Datenschutzerklärung ergänzen (`digital/11` F5) | S | 0–25 €/Monat | Voraussetzung für die Automation, spart pro Monat etwa 10–20 Stunden Handarbeit [Schätzung] | Inhaber + Code-Team |
| **P1** | Einwilligungs-Protokoll D1 + Newsletter-Erweiterung D2 (Interessen, Land, Kundentyp, Geburtstag optional) | M | Entwicklungszeit | Segmentierte Mails bringen mehr Termine als allgemeine Mails; der Geburtstag schafft Café-Besuche. Rechtssicherheit vermeidet Bußgelder bis 50.000 € | Code-Team |
| **P1** | Frappe-Felder und Ereignisse (D4): `lieferdatum`, `pflege_kategorie`, `outdoor`, `marken`, `stufe`, `empfohlen_von` | M | einmalig Admin-Termin (`digital/11` F11) | macht die Trigger 3, 7–12, 17 automatisch, ohne Personal | Partner (Frappe-Admin) |
| **P1** | Empfehlungsprogramm „Unter Freunden“ (3.4): Karten drucken, Code-Feld in Formularen (D6), Bedingungen vom Anwalt | S–M | 300–600 € Druck + Leistungen nur bei Erfolg | 100–180 Tsd. €/Jahr [Schätzung, 600 Karten × 2 % × 8–15 Tsd. €] | Inhaber + Code-Team + Anwalt |
| **P1** | Club „Hausgäste“ (3.3): Seite `/de/hausgaeste`, Kurz-Bedingungen, Kachel im Portal | M | 5–15 €/Mitglied/Jahr + Abende | Bindung und Folgeprojekte; Teil der +2–5 Pp. Wiederkaufquote ≈ 70 Tsd. €/Jahr [Schätzung] | Code-Team + Inhaber |
| **P1** | Produktpass mit echten Daten befüllen (zuerst die 50 jüngsten Aufträge), QR-Aufkleber beim Einzug | M | Aufkleber < 100 € | Grundlage für Pflege, Neubezug und Circle; Rückkehr ins Portal | Beratung + Code-Team |
| **P2** | Merkliste per E-Mail sichern (D3) + Verfügbarkeitsalarm Atelier (Trigger 15) | M | Entwicklungszeit | holt anonyme Besucher mit Kaufinteresse zurück; Atelierstücke drehen schneller, das bringt Liquidität | Code-Team |
| **P2** | Einstellungen im Portal (D5) | M | Entwicklungszeit | weniger Abmeldungen, weil Kunden Themen wählen und pausieren können statt sich ganz abzumelden | Code-Team |
| **P2** | Outdoor-Saison (Trigger 11/12) mit Wintereinlagerung als bezahltem Service | M | Lagerfläche/Partner | wiederkehrender Service-Umsatz plus Ergänzungskäufe im Frühjahr [Schätzung: 20–40 Tsd. €/Jahr] | Inhaber + Partner (Spedition/Lager) |
| **P2** | Kerzen/Duft-Nachkauf (Trigger 13, Kassa-Karte D7) | S | Druck < 100 € | Frequenz im Café; Teil der 60–150 Tsd. € Zubehör (`10`) | Inhaber |
| **P2** | B2B-Trigger H1–H3, Y1, A1, Z1 als Frappe-Aufgaben | S | 0 € | Hotel-Auffrischung und Refits sind planbare Folgeaufträge im fünf- bis sechsstelligen Bereich [Schätzung] | Inhaber/Verkauf |
| **P3** | Preisanpassungs-Hinweis (Trigger 16), nur mit echten Stichtagen der Hersteller | S | 0 € | zieht Entscheidungen vor; wirkt nur bei Marken mit veröffentlichter Preisliste | Inhaber |
| **P3** | WhatsApp als Antwortkanal (später mit Einwilligung für Termine) | S | Meta-Gebühren je Gespräch | Komfort für Kunden aus CH und Eigner; Umsatz indirekt | Inhaber |
| **P3** | Neubezug und Circle (Trigger 10) nach dem Circle-Pilot (Jänner 2027) | M | Partner Sigg | 0,2–0,6 Mio. € p. a. laut `23` für Circle gesamt [Schätzung aus `15`] | Inhaber + Partner |

---

## Quellen

- WKO, E-Mail-, Fax- und Telefonwerbung nach TKG 2021: https://www.wko.at/internetrecht/e-mail-fax-telefonwerbung-telekommunikationsgesetz-detail · Checkliste: https://news.wko.at/oe/internetrecht/checklistetkg.pdf
- BVwG W603 2304292-1 (ECG-Liste nicht geprüft): https://gesetzefinden.at/judikatur/bvwg/bvwgt_20250527_w603_2304292_1_00
- BVwG W282 2299749-1 (Adressen auf der ECG-Liste gesperrt): https://gesetzefinden.at/judikatur/bvwg/bvwgt_20241223_w282_2299749_1_00
- Google, verbotene und eingeschränkte Inhalte (Anreize, selektives Anfragen): https://support.google.com/contributionpolicy/answer/7400114
- ppc.land zum Google-Update 2026 (Mitarbeiternamen, Quoten; Sekundärquelle): https://ppc.land/google-tightens-maps-review-policy-staff-names-and-quotas-now-banned/
- Brevo-Hilfe, Trigger „Anniversary date“: https://help.brevo.com/hc/en-us/articles/22284425140754 · Community zum Verhalten bei Tag/Monat: https://community.brevo.com/t/incorrect-triggering-of-automation-using-anniversary-trigger/7251
- RH Members Program, Bedingungen: https://rh.com/us/en/our-company/members-program-terms-and-conditions · FAQ: https://rh.com/be/en/customer-experience/frequently-asked-questions
- HubSpot zu WhatsApp-Newslettern und Opt-in: https://blog.hubspot.de/marketing/whatsapp-newsletter
- BGH I ZR 208/12 vom 12.09.2013 (Empfehlungs-E-Mail) und BGH VI ZR 225/17 vom 10.07.2018 (Feedback-Anfrage als Werbung): aus Fachwissen bzw. `email-flows.md` 0.1; vor Verwendung im Volltext prüfen.
- Interne Quellen: siehe Kopf dieses Dokuments.
