# Marktfunktionen – Nachtrag (Branchen-, AT- und Spezialsysteme)

Stand 2026-11-04 · Ergänzung zu `30-marktfunktionen.md`. Diesmal von Hand recherchiert (WebSearch/WebFetch) statt vom lokalen Modell extrahiert. Gelesen wurden nur öffentliche Seiten, ohne Login und ohne abgeschickte Formulare. Die Roh-JSONs liegen unter `markt/nachtrag-*.json` und haben dasselbe Format wie die übrigen Dateien in `markt/`. In jedem Funktionseintrag nennt `url` die Seite, auf der die Funktion tatsächlich steht.

**Umfang:** 32 Anbieter, 754 Funktionen.

| Bereich | Anzahl |
|---|---|
| faktura | 138 |
| personal | 102 |
| service | 92 |
| logistik | 89 |
| crm | 80 |
| kassa | 62 |
| projekte | 61 |
| zentrale | 60 |
| sortiment | 32 |
| shop | 15 |
| marketing | 14 |
| kundenkarte | 9 |

**Korrekturen zu Datei 30:**
- **marahplus:** Das Produkt ist von Sauter + Held, nicht von SHD. SHDs Möbelhandels-ERP heißt **SHD ECORO**, und SHD gehört auch **KPS.MAX**. Die alten Dateien `shd-marahplus.json` und `moebelpilot.json` enthielten nur vier Platzhalterzeilen. Ersatz sind `nachtrag-marahplus.json`, `nachtrag-shd-ecoro.json` und `nachtrag-moebelpilot.json`.
- **euro-BIS (bewidata):** Das Produkt war nicht auffindbar, und bewidata.de lieferte einen Zertifikatsfehler. bewidata ist Hersteller von MÖBELPILOT, der Bereich ist damit abgedeckt.
- **Tribe/Loco:** Nicht auffindbar. Ersatz ist **KüchenDesk**, eine Cloud-Software für Küchenstudios.

---

## 1  Neu erfasste Anbieter

| # | Datei | Produkt | Gelesene Hauptseite(n) | Funktionen | Hinweis |
|---|---|---|---|---|---|
| 1 | nachtrag-marahplus.json | marahplus (Sauter + Held) | https://sauter-held.de/software/marahplus-warenwirtschaft/ · …/einfach-arbeiten/integration-planungssysteme/ · …/einfach-arbeiten/resy/ · …/software/marahplus-auslieferung/ · …/software/marahobjekt/ · …/einfach-arbeiten/moa-onlineauskunft/ | 28 | |
| 2 | nachtrag-shd-ecoro.json | SHD ECORO + hey.kitchen + habino | https://shd.solutions/de/ecoro · https://shd.solutions/de/branchen?branche=kueche-bad · https://software.hey.kitchen · https://habino.com/de | 23 | |
| 3 | nachtrag-kps-max.json | KPS.MAX (SHD) | https://www.kpsmax.de/kps-max · https://www.kpsmax.de | 13 | |
| 4 | nachtrag-moebelpilot.json | MÖBELPILOT (bewidata) | https://www.moebelpilot.com/warenwirtschaftssystem/ · …/edi-bestellung-und-ab-abwicklung/ · …/tourenplanungssoftware-warenwirtschaft/ · …/planungsschnittstellen/ · …/montageprotokoll/ · …/schnittstellen/ | 39 | |
| 5 | nachtrag-carat.json | CARAT (kitchenstox, service, easyroom, planner, one) | https://www.carat.de/produkte/carat-kitchenstox · …/carat-service · …/garantiedatenbank-in-carat · …/carat-easyroom · …/carat-planner · …/carat-one | 23 | |
| 6 | nachtrag-winner-flex.json | Winner Flex / Winner Bizz (Compusoft, jetzt Cyncly) | https://www.compusoftgroup.com/de/ · https://cyncly.com/de/produkte/room-survey · https://cyncly.com/de/produkte/winner-bizz | 13 | dünn, Produktseiten sind wenig konkret |
| 7 | nachtrag-kuechendesk.json | KüchenDesk | https://www.kuechendesk.de/ · https://www.kuechendesk.de/schnittstellen/carat | 13 | Ersatz für Tribe/Loco |
| 8 | nachtrag-idm-dcc.json | IDM-Datenstandard (DCC e.V.) | https://dcc-moebel.org/ · https://docs.roomle.com/rubens/content-creation/idm/idmabout.md · https://www.shd.de/fileadmin/data_news/pdf/MK_07_13_S68.pdf | 12 | Die einzelnen EDI-Nachrichtentypen nennt das DCC nicht. Die Praxis ist über Sauter + Held und MÖBELPILOT belegt. |
| 9 | nachtrag-storis.json | STORIS (US-Möbelhandel) | https://supergood.ai/docs/storis-api · casestudies.com (Stoney Creek, Circle Furniture, Haynes, Furniture Connection) | 17 | storis.com antwortet mit 503, deshalb nur Drittquellen |
| 10 | nachtrag-ready2order.json | ready2order | https://ready2order.com/at/funktionen/ · …/funktionen/gutscheine/ | 27 | Anzahlung nicht belegt |
| 11 | nachtrag-hellocash.json | helloCash | https://hellocash.at/funktionen · …/registrierkasse-funktionen/ (Gutscheine, Signatur, Kunden, Exporte) | 22 | |
| 12 | nachtrag-fiskaly-sign-at.json | fiskaly SIGN AT | https://workspace.fiskaly.com/countries/austria/ · …/austria/faq/ · …/sign-at/integration-guide/ · https://developer.fiskaly.com/sign-at/introduction | 19 | |
| 13 | nachtrag-lightspeed-retail.json | Lightspeed Retail | https://www.lightspeedhq.com/pos/retail/features/ | 32 | |
| 14 | nachtrag-square.json | Square | https://squareup.com/us/en/point-of-sale/features/customer-directory · Square-Hilfeartikel 6581 (Anzahlung/Zahlungsplan) und 7215 (Angebote) | 22 | |
| 15 | nachtrag-shopify-admin.json | Shopify Admin | https://help.shopify.com/en/manual/fulfillment/managing-orders · …/managing-orders/editing-orders · …/managing-orders/create-orders · …/managing-orders/refunding-orders · …/managing-orders/returns · …/fulfilling-orders/fulfill-orders · https://help.shopify.com/en/manual/discounts · https://help.shopify.com/en/manual/products/gift-card-products | 40 | |
| 16 | nachtrag-sendcloud.json | Sendcloud | https://www.sendcloud.com/en-uk/whats-new-spring-2025 | 20 | nur Release-Notes, Help-Center lieferte 403 |
| 17 | nachtrag-letmeship.json | LetMeShip | https://www.letmeship.com/at/ · …/at/versandservices/palettenversand/ | 20 | |
| 18 | nachtrag-attio.json | Attio | https://attio.com/help (managing-your-data, email-calendar, workflows-block-library) | 26 | |
| 19 | nachtrag-pipedrive.json | Pipedrive | https://support.pipedrive.com/en/article/pipeline-view · …/activities · …/scheduler · …/products · …/smart-docs · …/workflow-automation · …/projects-by-pipedrive | 30 | |
| 20 | nachtrag-hubspot-sales.json | HubSpot Sales Hub | https://knowledge.hubspot.com/object-settings/set-up-and-customize-pipelines · …/create-and-edit-sequences · …/create-and-edit-scheduling-pages · …/create-and-send-quotes · …/use-task-queues · …/use-playbooks | 30 | |
| 21 | nachtrag-monday-work-management.json | monday.com Work Management | https://monday.com/work-management · …/features/gantt · …/features/automations · …/features/forms | 27 | nur Feature-Seiten, Support-Seiten lieferten 403 |
| 22 | nachtrag-linear.json | Linear | https://linear.app/docs/triage · …/use-cycles · …/projects · …/parent-and-sub-issues · Changelog 2023-03-16-slas | 25 | |
| 23 | nachtrag-personio.json | Personio | personio.de/funktionen/… (Urlaub, Zeiterfassung, Stempeluhr), support.personio.de | 24 | **Inhalte nur aus Such-Auszügen** (HTTP 429/403), vor Übernahme nachprüfen |
| 24 | nachtrag-factorial.json | Factorial | https://factorialhr.de/ · …/urlaubsverwaltung · …/schichtplanung · …/zeiterfassung-mitarbeiter · …/dokumentenmanagement | 30 | |
| 25 | nachtrag-bmd-lohn-zeit.json | BMD Lohnverrechnung / Zeiterfassung | https://www.bmd.com/at/software/lohnverrechnung · https://www.bmd.com/at/software/zeiterfassung | 26 | |
| 26 | nachtrag-bmd-ntcs.json | BMD NTCS Rechnungswesen | https://www.bmd.com/at/software/buchhaltungssoftware | 18 | |
| 27 | nachtrag-rzl.json | RZL Software | https://rzlsoftware.at/ (fibu-next, personalverrechnung, belegverwaltung-plus, ebics-schnittstelle, schnittstellenpartner) | 17 | |
| 28 | nachtrag-datev.json | DATEV Unternehmen online + DATEV-Format | https://www.datev.de/web/de/loesungen/steuerberater/klassisches-kanzleigeschaeft/belege-und-daten-digital-in-die-kanzlei-uebertragen/datev-unternehmen-online/ · developer.datev.de/datev/platform/en/dtvf (nur Such-Auszug) | 11 | Formatversion (12 oder 13) prüfen |
| 29 | nachtrag-sevdesk.json | sevDesk | https://sevdesk.at/funktionen/ · sevdesk.de/rechnungsprogramm-online/, /mahnungen/, /online-banking/, /zugferd-software/ | 26 | |
| 30 | nachtrag-lexoffice.json | Lexware Office (ehem. lexoffice) | https://testen.lexware.de/online/funktionen-a-z/ · lexware.de/funktionen/mahnung-schreiben/, /funktionen/rechnungen/, /e-rechnung-software/ | 33 | |
| 31 | nachtrag-zendesk.json | Zendesk | https://www.zendesk.com/service/ticketing-system/ · Hilfeartikel 4408829459866 (SLA) und 4408822236058 (Trigger) | 26 | |
| 32 | nachtrag-odoo-field-service.json | Odoo Field Service | https://www.odoo.com/app/field-service-features | 22 | |

---

## 2  Die 60 Pflichtfunktionen für ein Möbel- und Küchenhaus mit Planung und Montage

Grundlage sind Datei 30 und dieser Nachtrag. „Gesehen bei“ nennt die Anbieter aus `markt/`. Ausgewählt wurde nach drei Fragen:
- Bricht ohne die Funktion der Ablauf Beratung → Planung → Kaufvertrag → Bestellung → AB → Wareneingang → Tour/Montage → Abnahme → Rechnung → Service ab?
- Verlangt das Gesetz sie?
- Sieht die Kundschaft sie direkt?

### CRM (7)

| # | Funktion | Gesehen bei | Warum Pflicht |
|---|---|---|---|
| 1 | Kundenakte mit Kaufhistorie, Rechnungen, Planungen und Reklamationen über alle Kanäle (Showroom, Shop, Objekt) | Square, Lightspeed, helloCash, marahplus (Infocenter), SHD ECORO | Ein Küchenkunde kauft über Monate. Die Beratung muss alles auf einen Blick sehen. |
| 2 | Mehrere Adressen je Kunde (Rechnung, Lieferung/Baustelle, Objekt) | Odoo CRM, ERPNext Selling | Liefer- und Montageadresse weichen oft von der Rechnungsadresse ab (Neubau, Hotel). |
| 3 | Lead- und Verkaufschancen-Pipeline mit Phasen (Erstberatung, Aufmaß, Planung, Angebot, Kaufvertrag) und Pflichtfeldern je Phase | HubSpot Sales Hub, Pipedrive, Odoo CRM, CARAT kitchenstox | Küchenprojekte laufen über mehrere Termine. Ohne Pipeline gehen offene Planungen verloren. |
| 4 | Liegegeld-Warnung („Rotting“): Hinweis, wenn eine Planung oder ein Angebot X Tage unbearbeitet ist | Pipedrive | Der typische Verlust im Küchenverkauf ist das Angebot, das nicht nachverfolgt wird. |
| 5 | Online-Terminbuchung für Beratung und Aufmaß mit Verfügbarkeit, Puffer und Vorab-Fragen (Raum, Budget) | HubSpot Sales Hub (Meeting-Links), Pipedrive Scheduler | Sie entlastet das Telefon. Die Beratung kommt vorbereitet ins Gespräch. |
| 6 | E-Mail- und Kalender-Synchronisierung am Vorgang | Attio, Pipedrive, Odoo CRM, SHD ECORO (Groupware) | Die Abstimmung mit Kunde und Architekt läuft per E-Mail und muss am Auftrag liegen. |
| 7 | Online-Küchenplaner bzw. Kundenplanung als Lead-Quelle | CARAT planner, KPS.MAX web, Winner (Design@Web) | Ein Lead mit Grobplanung lässt sich sofort in die Fachplanung übernehmen. |

### Sortiment (6)

| # | Funktion | Gesehen bei | Warum Pflicht |
|---|---|---|---|
| 8 | Lieferanten- und Herstellerkatalog-Import (IDM, Verbandskataloge) mit Stammdatenpflege | IDM/DCC, marahplus (Alliance/EMV), KPS.MAX, SHD ECORO | Tausende konfigurierbare Herstellerartikel lassen sich nicht von Hand pflegen. |
| 9 | Variantenartikel und konfigurierte Positionen (Front, Korpus, Griff, Stoff) | MÖBELPILOT, STORIS (Attribut-Dropdowns), IDM, ERPNext/Odoo (Varianten) | Ein Möbelstück ist erst mit seinen Optionen bestellbar. |
| 10 | Lieferantenkonditionen mit Rabattstaffeln, Zu- und Abschlägen, Skonto und Listen-EK | MÖBELPILOT, KPS.MAX (Blockverrechnung) | Der Deckungsbeitrag je Küche hängt an mehrstufigen Herstellerkonditionen. |
| 11 | Sonderbestellartikel (nicht lagernd), die beim Verkauf entstehen | Lightspeed (Special Orders), STORIS | Der Großteil des Möbelumsatzes ist Kommissionsware. |
| 12 | Preisschild- und Etikettendruck für die Ausstellung | MÖBELPILOT, Lightspeed | Preisauszeichnungspflicht im Showroom |
| 13 | Ausstellungsstücke und Abverkauf, Ladenhüterliste | MÖBELPILOT (Ladenhüter/Hitlisten) | Ausstellungsküchen binden Kapital und müssen gezielt abverkauft werden. |

### Projekte, Planung und Montage (12)

| # | Funktion | Gesehen bei | Warum Pflicht |
|---|---|---|---|
| 14 | Planungsimport aus CARAT, KPS, Winner, pCon oder furnplan als Angebots- bzw. Kaufvertragspositionen | MÖBELPILOT, marahplus, KüchenDesk, KPS.MAX, CARAT kitchenstox | Abtippen von 60–150 Positionen je Küche ist die größte Fehlerquelle. |
| 15 | Änderungsabgleich Planung ↔ Auftrag inkl. Storno und Rückmeldung des Bestellstatus an die Planung | MÖBELPILOT, KPS.MAX, CARAT (bidirektional) | Küchen werden nach dem Kaufvertrag oft noch geändert. |
| 16 | Digitale Auftragsmappe mit Planungen, Grundrissen, Fotos und Verträgen am Auftrag | marahplus (Infocenter/Hängemappe), Winner Flex, KüchenDesk | Ersetzt die Papiermappe, auf die Verkauf, Bestellung und Montage zugreifen müssen |
| 17 | Aufmaß vor Ort (App, LiDAR/Laser, Fotos, Anschlüsse) mit Übernahme in die Planung und Abweichungsanzeige | CARAT easyroom, Cyncly Room Survey, KPS.MAX | Fehlmaße kosten Nachbestellungen und Montagetage. |
| 18 | Planungsprüfung vor Bestellung (Kollision, Vollständigkeit) | KPS.MAX protect | Hält Fehlbestellungen vom Hersteller fern |
| 19 | Auftragsstatus grafisch mit Ampel je Teilprozess (bestellt, AB, Wareneingang, Tour, montiert, abgerechnet) | MÖBELPILOT, KüchenDesk | Beantwortet sofort die häufigste Kundenfrage: „Wann kommt meine Küche?“ |
| 20 | Montageauftrag automatisch aus dem Kaufvertrag, mit Grundriss und Montageplan | CARAT service, KPS.MAX (Live-Bemaßung), Odoo Field Service | Der Monteur braucht Plan und Stückliste ohne Zusatzaufwand. |
| 21 | Montage-Einsatzplanung (Kalender/Gantt) nach Qualifikation, Monteuranzahl und Montagezeit | CARAT service, hey.kitchen, Odoo Field Service, monday (Workload) | Montagekapazität ist der Engpass jedes Küchenhauses. |
| 22 | Montage-App offline: Checkliste, Vorschäden, Fotos, Zeit, Material | SHD ECORO/hey.kitchen, MÖBELPILOT, Odoo Field Service, marahplus mex | Ohne Nachweis vor Ort gibt es Streit bei Schäden und Nacharbeit. |
| 23 | Abnahmeprotokoll mit Kundenunterschrift; Liefer- und Montageprotokoll getrennt | CARAT service, MÖBELPILOT, Odoo Field Service, marahplus | Die Abnahme löst Schlussrechnung und Gewährleistungsbeginn aus. |
| 24 | Objektprojekte (Hotel/Objekt) mit Budget, Projektkosten und Meilensteinen | marahobjekt, monday, Linear (Projekte) | Hotel- und Yachtprojekte brauchen eine Kostenkontrolle je Objekt. |
| 25 | Aufgaben und Checklisten für wiederkehrende Abläufe je Auftragstyp | KüchenDesk, Odoo Project, monday, Linear | Standardisiert die Übergabe Verkauf → Innendienst → Montage |

### Logistik (10)

| # | Funktion | Gesehen bei | Warum Pflicht |
|---|---|---|---|
| 26 | Bestellung je Hersteller aus dem Kaufvertrag (EDI, E-Mail, Fax) mit Übermittlungsstatus | MÖBELPILOT, marahplus (IWOfurn), KPS.MAX, STORIS | Eine Küche besteht aus Bestellungen bei 3–8 Herstellern. |
| 27 | AB-Abgleich: Herstellerbestätigung gegen Bestellung, Abweichungsprotokoll, AB-Merker je Position | MÖBELPILOT, marahplus | Falsche Fronten oder Termine müssen vor der Lieferung auffallen. |
| 28 | Termintreue-Überwachung und Rückstandslisten (AB fehlt, Wareneingang verspätet) | MÖBELPILOT | Damit wird aktiv nachgefasst, bevor der Montagetermin platzt. |
| 29 | Wareneingang je Position mit Teil- und Nachlieferung, Kommissionslagerplatz | MÖBELPILOT, KüchenDesk (Nachbestellung), Lightspeed, Odoo Inventory | Erst wenn eine Küche vollständig da ist, darf die Tour geplant werden. |
| 30 | Lagerreservierung bzw. Kommissionierung je Kaufvertrag | MÖBELPILOT, STORIS (Reservierungen) | Verhindert, dass Lagerware doppelt verkauft wird |
| 31 | Tourenplanung mehrerer Fahrzeuge auf grafischer Planungstafel mit Liefertermin-Generator | MÖBELPILOT (adelo), SHD ECORO, hey.kitchen, marahplus mex | Auslieferung und Montage sind die teuerste Ressource. |
| 32 | Tourenlisten, Begleitpapiere und Lieferbestätigung mit Unterschrift/Fotos | MÖBELPILOT, marahplus mex | Nachweis bei Transportschäden |
| 33 | Speditions- und Palettenversand (Sperrgut, Hubwagen, Stapelbarkeit) | LetMeShip, Sendcloud (Versandregeln) | Onlineshop-Möbel gehen per Spedition, nicht als Paket. |
| 34 | Erfüllungsmethode je Position (Paket, Spedition, Abholung, Montage) und Bestellung zurückhalten | Shopify Admin | Gemischte Bestellungen sind im Möbelshop die Regel. |
| 35 | Lagerorte, Filialumbuchung und Inventur mit MDE | MÖBELPILOT, Lightspeed, ERPNext Stock | Ausstellung, Lager und Außenlager müssen getrennt gezählt werden. |

### Faktura (10)

| # | Funktion | Gesehen bei | Warum Pflicht |
|---|---|---|---|
| 36 | Belegkette Angebot → Kaufvertrag/AB → Lieferschein → Rechnung ohne Neuerfassung | Lexware Office, sevDesk, SHD Connect, Odoo Sales | Grundablauf |
| 37 | Anzahlung, Abschlagsrechnung und Schlussrechnung mit Verrechnung | Lexware Office, sevDesk, Square (Zahlungsplan), Lightspeed (Deposits) | Küchen werden mit 30–50 % Anzahlung verkauft (siehe Abschnitt 3). |
| 38 | Angebot mit Alternativ- und Optionspositionen, Positions- und Gesamtrabatt, Gültigkeit | Lexware Office, HubSpot, Pipedrive, ERPNext | Küchenangebote enthalten fast immer Geräte-Alternativen. |
| 39 | Online-Annahme bzw. E-Signatur des Angebots mit Zahlungslink für die Anzahlung | HubSpot Sales Hub, Pipedrive Smart Docs, Shopify (Entwurf + Checkout-Link), Winner Bizz (DocuSign) | Beschleunigt den Abschluss nach dem Termin |
| 40 | Offene Posten, mehrstufiges Mahnwesen mit Versandhistorie | BMD NTCS, Lexware Office, sevDesk, RZL | Restzahlungen nach Montage werden sonst vergessen. |
| 41 | Bankabruf (EBICS/finAPI/CAMT) mit automatischem OP-Ausgleich | BMD NTCS, RZL, sevDesk, Lexware Office | Überweisungen von Anzahlungen müssen dem Kaufvertrag zugeordnet werden. |
| 42 | Gutschrift, Teilerstattung (auch als Guthaben) und Storno mit Begründung | Shopify Admin, sevDesk, ready2order | Reklamations-Minderungen und Shop-Retouren |
| 43 | E-Rechnung erzeugen (ebInterface für den Bund; ZUGFeRD/XRechnung für deutsche Objektkunden) mit Validierung | Lexware Office, sevDesk, ready2order (E-Rechnung) | Für Objektaufträge Pflicht (siehe Abschnitt 4) |
| 44 | Buchhaltungsexport an den Steuerberater (BMD/RZL bzw. DATEV-Format) mit Belegbild | ready2order, MÖBELPILOT (FiBu AT), marahplus, Lexware Office, sevDesk | Der Steuerberater in AT arbeitet mit BMD oder RZL. |
| 45 | Verkäuferprovision und Umsatz nach Verkäufer | MÖBELPILOT, Lightspeed | Übliches Vergütungsmodell im Möbelverkauf |

### Kassa (5)

| # | Funktion | Gesehen bei | Warum Pflicht |
|---|---|---|---|
| 46 | RKSV-Signatur mit Start-, Monats-, Jahres- und Schlussbeleg, DEP-Export, Ausfallmodus mit Sammelbeleg | fiskaly SIGN AT, ready2order, helloCash | gesetzlich (siehe Abschnitt 4) |
| 47 | Anzahlung an der Kassa auf einen Kaufvertrag, Restzahlung bei Lieferung | Lightspeed (Deposits/Layaway), Square | Häufiger Showroom-Fall |
| 48 | Gutscheine (Einzweck/Mehrzweck) mit Teileinlösung, Restbetrag und Code bzw. Barcode, kanalübergreifend Shop ↔ Kassa | ready2order, helloCash, Shopify (Geschenkkarten, auch POS) | USt-Behandlung je Gutscheintyp ist Pflicht. |
| 49 | Mitarbeiter-PIN, Rollen, Split Payment, Kartenterminal, Tagesabschluss | Lightspeed, ready2order, helloCash, Odoo POS | Grundbetrieb einer Showroom-Kassa |
| 50 | Mobile Kaufvertragserfassung und Artikelauskunft im Ausstellungsraum (Tablet) | SHD ECORO, marahplus (marahmobile), STORIS (Mobile POS), MÖBELPILOT | Der Verkauf findet an der Ausstellungsküche statt, nicht an der Theke. |

### Service (6)

| # | Funktion | Gesehen bei | Warum Pflicht |
|---|---|---|---|
| 51 | Reklamationsvorgang je Position mit Fotos, Fehlercode und Status je Schritt | marahplus resy, MÖBELPILOT (BfQ), CARAT kitchenstox, KüchenDesk | Kern des Service: Jede Reklamation hängt an einem konkreten Teil eines Herstellers. |
| 52 | Hersteller-Rückgriff: Ersatzteilbestellung, Retoure an Hersteller mit Abholaufforderung, Statistik je Lieferant | MÖBELPILOT, marahplus resy, Lightspeed (Lieferantenretoure) | Die Kosten muss der Hersteller tragen, nicht das Haus. |
| 53 | Servicetermin mit Zeitaufwand und Monteuranzahl, Servicetour | MÖBELPILOT, marahplus resy, Odoo Field Service | Reklamationen binden Montagekapazität. |
| 54 | Service-Tickets mit SLA (erste Antwort, Lösung, pausierbar bei „wartet auf Hersteller“) | Zendesk, Linear | Kundenzufriedenheit hängt an der Reaktionszeit. |
| 55 | Kundenportal bzw. -App mit Auftragsstatus, Dokumenten und Reklamationsmeldung mit Fotos | marahplus moa, habino (SHD), Odoo Field Service (Portal) | Entlastet das Telefon; die Fotos kommen direkt vom Kunden. |
| 56 | Garantie- und Geräteerfassung (E-Nummer, Seriennummer) je Küche | CARAT Garantiedatenbank, MÖBELPILOT (E-Geräte), Odoo Field Service (Seriennummer) | Geräte-Gewährleistung und Zuordnung im Servicefall |

### Personal (2)

| # | Funktion | Gesehen bei | Warum Pflicht |
|---|---|---|---|
| 57 | Zeiterfassung (App, Terminal, QR) mit AZG/ARG-Prüfung und Buchung auf Auftrag oder Kostenstelle | BMD Zeiterfassung, Personio, Factorial, SHD perforce | Aufzeichnungspflicht nach § 26 AZG und Nachkalkulation der Montagestunden |
| 58 | Urlaub/Abwesenheit mit Freigabe und Resturlaub, Schicht- bzw. Einsatzplan mit Konfliktprüfung | Factorial, Personio, BMD, Odoo Time Off | Ohne Abwesenheitsplan lässt sich die Montage nicht planen. |

### Zentrale (2)

| # | Funktion | Gesehen bei | Warum Pflicht |
|---|---|---|---|
| 59 | Rollen und Rechte (Verkauf, Innendienst, Monteur, Steuerberater) inkl. eingeschränkter Monteur-Zugänge | KüchenDesk (Teilnutzer), BMD, Lexware Office, Attio | DSGVO und Kalkulationsschutz: Monteure dürfen keine EK-Preise sehen. |
| 60 | Kennzahlen: Umsatz nach Verkauf und Auslieferung, Deckungsbeitrag je Auftrag, Auftragsbestand | MÖBELPILOT, SHD ECORO, marahplus (Vertriebscockpit), Winner (Showroom-Dashboard) | Im Möbelhandel fallen Auftragseingang und Umsatz Monate auseinander. |

---

## 3  Branchen-Spezialfunktionen, die generische Systeme nicht haben

Generische Systeme sind hier Odoo, ERPNext, HubSpot, Pipedrive, Shopify, sevDesk und Zendesk. Keines der gelesenen generischen Systeme hat diese Funktionen von Haus aus. Sie sind der Kern dessen, was das Platzhirsch-Backoffice selbst bauen oder anbinden muss.

| # | Spezialfunktion | Was genau | Gesehen bei (Quelle) |
|---|---|---|---|
| S1 | **Planungsimport → Auftragspositionen** | Planungsdatei aus CARAT, KPS, Winner, eOPUS, furnplan oder pCon wird zu Angebot oder Kaufvertrag, inklusive Kommissionsnummer. Änderungen und Storno werden abgeglichen, der Bestellstatus geht zurück an die Planung. | MÖBELPILOT https://www.moebelpilot.com/warenwirtschaft/planungsschnittstellen/ · marahplus https://sauter-held.de/einfach-arbeiten/integration-planungssysteme/ · KPS.MAX https://www.kpsmax.de/kps-max · KüchenDesk https://www.kuechendesk.de/schnittstellen/carat · CARAT kitchenstox |
| S2 | **IDM-Katalogimport** | Herstellerdaten nach IDM (Küche/Bad, Polster, Wohnen) mit Plausibilitätsregeln für gültige Kombinationen; IWOfurn als Drehscheibe | IDM/DCC https://dcc-moebel.org/ · Fachartikel https://www.shd.de/fileadmin/data_news/pdf/MK_07_13_S68.pdf · marahplus (Verbandskataloge Alliance/EMV) |
| S3 | **Elektronische Bestellung und AB über EDI/IWOfurn** | Bestellung je Hersteller, EDI-AB-Rücklauf mit GLN-Stammdaten, Rechnung | marahplus · MÖBELPILOT https://www.moebelpilot.com/warenwirtschaftssystem/edi-bestellung-und-ab-abwicklung/ |
| S4 | **AB-Abgleich mit Hersteller** | Herstellerbestätigung wird automatisch gegen die Bestellung geprüft. Abweichungen (Ausführung, Preis, Termin) landen im AB-Protokoll, ein AB-Merker wird je Position gesetzt. | MÖBELPILOT (s. o.) · marahplus (Hersteller-AB-Übernahme via pCon) |
| S5 | **Termintreue und Rückstand je Position** | Überwachung von AB-Eingang, Wareneingang und Auslieferung; Rückstandslisten | MÖBELPILOT https://www.moebelpilot.com/warenwirtschaftssystem/ |
| S6 | **Teil- und Nachlieferung je Position im Kommissionsauftrag** | Eine Küche gilt erst als „komplett“, wenn alle Herstellerpositionen eingegangen sind. Nachbestellungen werden am selben Auftrag geführt. | MÖBELPILOT, KüchenDesk (Nachbestellungen), CARAT kitchenstox (Kommissionsbaum) |
| S7 | **Montage-Aufmaß** | Geführtes Aufmaß per App oder LiDAR mit Anschlüssen (Wasser, Herd, Heizung) und Fotos; Import in die Planung mit farbiger Abweichungsanzeige | CARAT easyroom https://www.carat.de/produkte/carat-easyroom · KPS.MAX · Cyncly Room Survey https://cyncly.com/de/produkte/room-survey |
| S8 | **Planungsprüfung vor Bestellung** | Kollisionen, Öffnungskollisionen, Ergonomie, Vollständigkeit | KPS.MAX protect https://www.kpsmax.de |
| S9 | **Kalkulation während der Planung** | Blockverrechnung von Endkunden-VK und Händler-EK; Arbeitsplatten-Langteile werden automatisch Bestellartikel. | KPS.MAX |
| S10 | **Montagezeit-Berechnung und Tour mit Montage** | Montagedauer und -kosten werden per Algorithmus aus der Planung berechnet. Der Kunde wird bei Verschiebung automatisch informiert. Liefertermin-Generator über mehrere LKW. | hey.kitchen https://software.hey.kitchen · MÖBELPILOT/adelo https://www.moebelpilot.com/tourenplanungssoftware-warenwirtschaft/ |
| S11 | **Montageprotokoll** | Vorschäden beim Kunden, E-Geräte mit E-Nummer aus der Stückliste, Liefer- und Montageprotokoll getrennt, Retouren vor Ort vorerfasst; Abnahme mit Unterschrift, danach automatischer Rechnungsversand mit Montagebericht | MÖBELPILOT https://www.moebelpilot.com/warenwirtschaftssystem/montageprotokoll/ · CARAT service https://www.carat.de/produkte/carat-service |
| S12 | **Reklamation mit Hersteller-Regress** | Fehlercodesystem, Bewertung nach „Bündnis für Qualität“, Ersatzteildepot, Rücksendung an den Hersteller mit Abholaufforderung und -anmahnung, Reklamationsstatistik je Lieferant für Verhandlungen | marahplus resy https://sauter-held.de/einfach-arbeiten/resy/ · MÖBELPILOT · *Lücke:* Ein eigener Workflow „Kosten an Hersteller weiterbelasten“ ist bei keinem Anbieter ausdrücklich beschrieben. Das ist eine Chance für den Eigenbau. |
| S13 | **Anzahlungslogik** | Anzahlung beim Kaufvertrag, eventuell zweite Rate vor Lieferung, Rest nach Abnahme; Verrechnung auf der Schlussrechnung; Bestand und Umsatz erst bei Vollzahlung | Square (Meilenstein-Zahlungsplan, Umsatz erst bei Vollzahlung), Lightspeed (Deposits/Layaway), Lexware Office/sevDesk (Abschlags- und Schlussrechnung). *Lücke:* Bei keinem Möbel-Branchensystem ist das auf einer öffentlichen Seite explizit belegt, nur „Zahlungswesen“ (CARAT) bzw. „payments/financing“ (STORIS). |
| S14 | **Sonderbestellung aus dem Verkauf** | Vorlagen je Lieferant mit Optionen (Bezugsstoff, Ausführung); die Bestellung beim Lieferanten wird automatisch erzeugt; Liefertermin schon am POS | STORIS (casestudies.com), Lightspeed (Special Orders automatisch bündeln) |
| S15 | **Kauf auf Probe, Reservierung, Überverkauf** | möbelspezifische Vorgangsarten | MÖBELPILOT |
| S16 | **Garantieverlängerung E-Geräte** | Garantieurkunde aus der Planung, Garantiepreis als Unterposition, Gerätedaten automatisch an die Garantiedatenbank | CARAT https://www.carat.de/produkte/garantiedatenbank-in-carat |
| S17 | **Zentralregulierung über Einkaufsverband** | Eingangsrechnungen über den Verband buchen und Zahlung freigeben | MÖBELPILOT https://www.moebelpilot.com/warenwirtschaftssystem/schnittstellen/ |
| S18 | **Objektgeschäft mit Intercompany** | Budget und Projektkosten je Objekt; Warenverkehr zwischen rechtlich selbständigen Filialen mit FiBu je Mandant | marahobjekt https://sauter-held.de/software/marahobjekt/ |
| S19 | **Herstellerkonfiguration als Belegposition** | pCon-Basket bzw. IWOfurn-Konfigurator liefert eine fertig konfigurierte Position samt Bestelldaten. | marahplus, MÖBELPILOT |
| S20 | **Mehrsprachige Monteurberichte** | KI-Übersetzung für Fremdmonteure | marahplus mex https://sauter-held.de/software/marahplus-auslieferung/ |

---

## 4  Österreichische Pflichtfunktionen

| # | Pflicht | Was das System können muss | Rechtsquelle / Beleg |
|---|---|---|---|
| A1 | **Registrierkassenpflicht** ab 15.000 € Jahresumsatz je Betrieb **und** über 7.500 € Barumsätzen (beide netto); Beginn mit dem viertfolgenden Monat | Kassa mit Sicherheitseinrichtung. Kartenzahlungen gelten auch als Barumsätze. | https://www.usp.gv.at/steuern-finanzen/steuerliche-rechte-und-pflichten/registrierkassen.html · https://www.wko.at/steuern/registrierkassenpflicht-faq |
| A2 | **Startbeleg** (§ 6 RKSV) | Erster Beleg mit Betrag 0 und Kassen-ID; Registrierung von Kassa und Signatureinheit in FinanzOnline binnen einer Woche; Startbeleg prüfen (BMF-Belegcheck-App) und das Ergebnis aufbewahren | RKSV https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20009390 · fiskaly SIGN AT (automatische Registrierung) |
| A3 | **Signatur je Beleg, Belegpflichtinhalt, QR-Code** | Unternehmen, fortlaufende Nummer, Datum und Uhrzeit, Menge und Bezeichnung, Betrag je Steuersatz, Kassen-ID, maschinenlesbarer Code; AES-256-Umsatzzähler | USP (s. A1) · fiskaly receipt-data |
| A4 | **Belegerteilungspflicht** ab dem ersten Barumsatz; Aufbewahrung 7 Jahre | Beleg drucken oder digital übergeben. Laut USP sind elektronische Belege seit 1.10.2026 möglich; der Kunde kann am selben Tag einen Papierbeleg verlangen. *Vor Umsetzung nachlesen.* | USP (s. A1) |
| A5 | **Monats- und Jahresbeleg** (§ 8 RKSV) | Monatlicher signierter Nullbeleg; der Dezember-Beleg ist der Jahresbeleg und muss gedruckt bzw. gesichert und bis 15.2. geprüft werden. | RKSV · WKO-FAQ · fiskaly (automatisch) |
| A6 | **DEP** (§ 7 RKSV) | Datenerfassungsprotokoll, mindestens vierteljährlich unveränderbar extern sichern; jederzeit als DEP7 exportierbar | RKSV · fiskaly (DEP7-Export) |
| A7 | **Ausfall der Signatureinheit bzw. Kassa** (§ 17 RKSV) | Belege mit Vermerk „Sicherheitseinrichtung ausgefallen“, danach Nacherfassung und signierter Sammelbeleg; Ausfall über 48 h binnen einer Woche in FinanzOnline melden | RKSV · BMF-Handbuch https://finanzonline.bmf.gv.at/eLearning/BMF_Handbuch_Registrierkassen.pdf · fiskaly (Ersatzsignatur, Sammelbeleg) |
| A8 | **Schlussbeleg** bei Außerbetriebnahme (§ 17 Abs. 8 RKSV) | Nullbeleg, Ausdruck, Meldung binnen einer Woche | RKSV · BMF-Handbuch |
| A9 | **Gutscheine: Einzweck vs. Mehrzweck** (seit 1.1.2019) | Einzweckgutschein: USt bei Ausgabe. Mehrzweckgutschein: USt erst bei Einlösung. Rabattgutschein mindert das Entgelt. Der Gutscheintyp muss je Gutschein speicherbar sein. | https://www.wko.at/steuern/umsatzsteuerliche-behandlung-von-gutscheinen · ready2order (Einzweck/Mehrzweck) |
| A10 | **E-Rechnung an den Bund** (Pflicht seit 1.1.2014) | Strukturierte Rechnung im Format **ebInterface 6.1** (angenommen werden auch 6.0, 5.0 und 4.3; Version 7.0 ist für das 4. Quartal 2026 angekündigt) oder über PEPPOL, eingebracht über USP/e-rechnung.gv.at. Pflichtfelder: **Lieferantennummer** und **Auftragsreferenz**; bei 10-stelliger Bestellnummer Bestellpositionsnummer je Zeile. UID Rechnungssteller über 400 €, UID Empfänger ab 10.000 €. | https://www.usp.gv.at/themen/steuern-finanzen/umsatzsteuer-ueberblick/weitere-informationen-zur-umsatzsteuer/vorsteuerabzug-und-rechnung/e-rechnung-an-die-oeffentliche-verwaltung.html · https://www.erechnung.gv.at/erb/de_AT/tec_formats_ebinterface · https://www.erechnung.gv.at/erb/de_AT/content · https://www.wko.at/service/netzwerke/was-ist-ebinterface.html · *Lücke im Markt:* Keiner der gelesenen Faktura-Anbieter (sevDesk, Lexware) bewirbt ebInterface; sie bieten nur ZUGFeRD/XRechnung. |
| A11 | **Rechnungsmerkmale § 11 UStG**, Kleinbetragsrechnung bis 400 € brutto | Pflichtfelder prüfen. Die Vereinfachung gilt **nicht im Versandhandel**, also nicht für den Onlineshop. | https://www.usp.gv.at/…/vorsteuerabzug-und-rechnung/formerfordernisse.html · https://www.usp.gv.at/…/vorsteuerabzug-und-rechnung/kleinbetragsrechnungen.html |
| A12 | **UVA** | Bis 15. des zweitfolgenden Monats, Zahllast am selben Tag fällig. Vorjahresumsatz bis 100.000 €: quartalsweise, sonst monatlich. Übermittlung über FinanzOnline (BMD NTCS) oder Export an den Steuerberater. | https://www.usp.gv.at/themen/steuern-finanzen/umsatzsteuer-ueberblick/umsatzsteuervoranmeldung-und-umsatzsteuererklaerung.html · BMD NTCS (UVA + FinanzOnline) |
| A13 | **Aufbewahrung 7 Jahre** (§ 132 BAO) | Bücher, Belege und DEP 7 Jahre ab Ende des Kalenderjahres, länger bei anhängigem Verfahren. Löschsperre gegen DSGVO-Löschung. | https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10003940&Paragraf=132 |
| A14 | **DSGVO-Löschfristen** | Löschfrist je Datenkategorie (Leads, Bewerbungen, Kundenkarte, Kamerabilder …), Speicherdauer im Verarbeitungsverzeichnis, Löschantrag unverzüglich bearbeiten. Gesetzliche Aufbewahrung (A13) geht vor (Art. 17 Abs. 3 DSGVO; Wortlaut nicht gelesen). | https://www.usp.gv.at/themen/betrieb-und-umwelt/laufender-betrieb/datenschutz.html · https://dsb.gv.at/rechte-pflichten/ihre-rechte-als-betroffene-person |
| A15 | **GlBG § 9 Abs. 2: Gehaltsangabe im Stelleninserat** | Pflichtfeld „KV- bzw. gesetzliches Mindestentgelt“ plus „Bereitschaft zur Überzahlung“ im Stellen-Editor. *Bei keinem HR-Anbieter als Pflichtfeld gesehen.* | https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20003395&Paragraf=9 |
| A16 | **Arbeitszeitaufzeichnung** (§ 26 AZG) | Geleistete Stunden und Durchrechnungszeiträume erfassen; die Aufzeichnungen einmal im Monat auf Verlangen kostenlos an Beschäftigte übermitteln; Höchstarbeitszeit und Ruhezeit prüfen (BMD: AZG/ARG-Prüfung) | https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10008238&Paragraf=26 · BMD Zeiterfassung |
| A17 | **Lohnmeldungen ELDA/ÖGK, Kollektivvertrag** | Wird über BMD Lohn oder RZL bzw. den Steuerberater erledigt; das Backoffice liefert nur Zeit- und Abwesenheitsdaten. | BMD Lohn https://www.bmd.com/at/software/lohnverrechnung · RZL |

---

## 5  Belegqualität und offene Prüfpunkte

- **Nur Drittquellen oder Such-Auszüge:** Personio (Such-Auszüge), STORIS (Fallstudien und API-Doku Dritter), DATEV-Format (Such-Auszug, Version 12/13 unklar). Diese Dateien haben ein Feld `hinweis` bzw. eine entsprechende Anmerkung.
- **Nicht belegt:**
  - Lieferavis als IDM-Nachricht
  - ein ausdrücklicher Hersteller-Regress-Workflow
  - eine Anzahlungslogik bei den Möbel-Branchensystemen
  - ebInterface bei den Faktura-SaaS-Anbietern
  - ein GlBG-Pflichtfeld bei den HR-Anbietern
- **Die Feldzahl `zeichen`** in den Nachtrag-JSONs ist eine Schätzung, kein Messwert.
