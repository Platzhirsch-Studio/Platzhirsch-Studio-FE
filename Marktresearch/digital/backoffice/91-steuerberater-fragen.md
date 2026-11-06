# Fragen an den Steuerberater (Kassa und Rechnungswesen)

Stand 2026-11-04 · aus dem Bau von ph_kassa und ph_faktura (Details: 50-backend-luecken-kassa-faktura.md). Das System ist mit der jeweils genannten Annahme gebaut und lässt sich umstellen.

| # | Thema | Frage | Annahme im System |
|---|---|---|---|
| 1 | RKSV | Retoure als negativer Standardbeleg (Umsatzzähler sinkt) statt Stornobeleg zulässig? | negativer Standardbeleg |
| 2 | RKSV | Überweisungsanteile an der Kassa in den Umsatzzähler? | ja |
| 3 | Gutschein | Standard Einzweck oder Mehrzweck; Steuersatz bei Einzweck | Mehrzweck (USt bei Einlösung) |
| 4 | USt | Automatische Anzahlungsrechnung an der Kassa nach Mindest-Ist (§ 19 Abs 2 UStG); Storno-Rückbuchung im Storno-Monat | so gebaut |
| 5 | USt | Skonto: Aufteilung nach Steuersätzen, Korrektur im Zahlungsmonat (§ 16 UStG); Exportzeile Skonto | Aufteilung gebaut, Exportzeile offen |
| 6 | RKSV | Nacherfassung Notbelege: Belegdatum = Erfassungszeitpunkt, Notbeleg-Zeit als Zusatz | so gebaut |
| 7 | CHF | Kursquelle für Barzahlung in Franken | täglich manuell gepflegt |
| 8 | Beleg | Barverkaufsrechnung zusätzlich zum Kassenbeleg; Rundungsdifferenz netto/brutto | zulässig, Kassenbeleg maßgeblich |
| 9 | Mahnwesen | Unternehmer: Basiszins + 9,2 PP und 40 € Pauschale (§ 458 UGB) statt Mahngebühr Stufe 1 | so gebaut |
| 10 | Export | Steuercodes BMD, Spaltenformat RZL, DATEV-Formatversion 12 oder 13 | Vorlagen, unverifiziert |
| 11 | Geldwäsche | Identitätsfeststellung ab 10.000 € bar: Aufbewahrungsdauer, Ausweiskopie ja/nein (DSGVO) | Feld „identitaet“ am Kassenbeleg; Umfang und Frist laut 50-backend-luecken-kassa-faktura.md, zu bestätigen |
| 12 | Export | Form von Ausfuhr- und Gelangensnachweis | Upload-Feld je Rechnung |
| 13 | Gutschein | Mehrzweckgutschein bestätigen (aus Shop-Freigabe Nr. 46) | Mehrzweck |
| 14 | Personal | KV-Einstufung der Stellen (Handel vs. Handwerk) | KV Handel |
| 15 | Buchhaltung | Kontenrahmen, Soll-/Ist-Versteuerung, OSS | offen |

## Weitere Fragen an Kanzlei und Steuerberater (aus CRM, Shop, Service, Personal, Marketing, Kundenkarte)

Details und Annahmen: 52-backend-luecken-crm-shop-service-personal-marketing.md.

| # | Thema | Frage | Für |
|---|---|---|---|
| 16 | Aufbewahrung | Umfang „Geschäftspapiere“ nach BAO § 132; Nachweisfrist für Datenschutzanfragen und Einwilligungen (angesetzt 3 Jahre); Löschfrist für Interessenten ohne Kauf; Anonymisieren statt Löschen | Kanzlei |
| 17 | Gutschein | Mehrzweck an der Kassa als Satz null (§ 4 Abs 3a UStG); Kulanz-Gutschein ohne Verkauf: Preisnachlass oder Geschenk; USt bei Kundenkarten-Vorteilen | Steuerberater |
| 18 | FAGG | Versandkosten bei Teilwiderruf (§ 15); Rückerstattung auf Gutschein (§ 14 Abs 3); Informationspflichten bei Telefonbestellung (§ 4, § 7) | Kanzlei |
| 19 | Gewährleistung | Einbauküche beweglich (2 Jahre) oder unbeweglich (3 Jahre) nach § 933 ABGB; Abnahme ohne gezeichnete Unterschrift | Kanzlei |
| 20 | Personal | Urlaubsjahr Arbeits- oder Kalenderjahr; Wochenstunden KV Handel; Gleitzeit (§ 4b AZG); Zustimmung Zeiterfassung (ArbVG § 96a); AU-Bestätigung ab welchem Tag; Zeitdaten 7 Jahre | Lohnverrechnung |
| 21 | Marketing | Bestandskunden-Ausnahme TKG § 174; widerruft eine Spam-Beschwerde alle Werbezwecke; Rechtsgrundlage UTM-Attribution | Kanzlei |
| 22 | Kundenkarte | Sperrgrund „Verstorben“; geht die Stufe bei Übertragung mit | Kanzlei |
| 23 | USt | Weiterbelastung von Reklamationskosten an den Hersteller: nicht steuerbarer Schadenersatz oder steuerpflichtiges Entgelt? | Belastungsanzeige ohne USt, mit Hinweis | Steuerberater |
| 24 | Buchhaltung | Konto und Steuerbehandlung für ausgebuchte Regress-Differenzen (Platzhalter Konto 7800) | Konto 7800, ohne USt | Steuerberater |

## Lager und Inventurbewertung (ph_logistik, 04.11.2026)

Details: 51-backend-luecken-projekte-sortiment-logistik.md, Abschnitt „Lager & Inventur Ergänzung“.

| # | Thema | Frage | Annahme | Für |
|---|---|---|---|---|
| 25 | Inventur | Bewertungsmethode Handelswaren: gleitender Durchschnittspreis (UGB § 209 Abs 2) oder letzter Einstandspreis; müssen Anschaffungsnebenkosten (Fracht, Zoll, Verpackung) aktiviert werden; Niederstwert-Vergleich mit Nettoerlös (§ 207) ausreichend? | Gleitender Durchschnitt aus Wareneingängen (EK laut Herstellerbestellung/AB), ohne Nebenkosten, Nettoerlös nur bei bekanntem VK | Steuerberater |
| 26 | Inventur | Abwertungssätze Ausstellungsstücke nach Alter (0/12/24/36 Monate) und B-Ware; Gängigkeitsabschlag Lagerware ohne Abverkauf | Ausstellung 20/40/60/80 %, B-Ware 30 %, Lagerware ab 24 Monaten 50 % (Platzhalter) | Steuerberater |
| 27 | Buchhaltung | Konten für Handelswarenvorrat und Bestandsveränderung; Buchung der Bestandsveränderung als Differenz zum Vorjahr über den BMD-/DATEV-Export | Konto 1600 / 5010, ohne USt, Differenz zur letzten festgeschriebenen Bewertung (Platzhalter) | Steuerberater |
| 28 | Inventur | Zulässigkeit der permanenten (rollierenden) Inventur statt Stichtagsinventur: genügt „jeder Lagerplatz mindestens 1× je Geschäftsjahr“ mit Bestandsfortschreibung; vor-/nachverlegte Stichtagsinventur mit Rückrechnung aus dem Bewegungsjournal | Zulässig bei lückenlosem Bewegungsjournal und Vier-Augen-Freigabe; Rückrechnung bis zu 3 Monate | Steuerberater |
| 29 | Inventur | Kommissionsware (bereits Kunden zugeordnet, Anzahlung erhalten) und Ware beim Kunden zur Ansicht: im Vorrat bewerten oder nicht | Kommissionsware bis zur Lieferung im Vorrat (Hinweis in der Bewertung), Ware beim Kunden (Lagerort Kunde) ebenfalls | Steuerberater |

## Projektnachkalkulation (ph_projekte/ph_faktura, 04.11.2026)

| # | Thema | Frage | Annahme | Für |
|---|---|---|---|---|
| 30 | Kostenrechnung | Kosten aus Eingangsrechnungen netto; bei „Keine Vorsteuer“ (nicht abziehbar) brutto als Kosten; Reverse Charge/igE netto (Steuerschuld = Vorsteuer). Kassa-Barausgaben werden mangels Netto-Aufteilung brutto angesetzt – zulässig für die interne Kalkulation? | wie beschrieben (rein intern, keine Buchung) | Steuerberater |
| 31 | Kostenrechnung | Aliquote Aufteilung einer Lieferantenrechnung auf mehrere Projekte und „Gemeinkosten“ ohne Projekt: genügt die interne Zuordnung, oder sollen Kostenstellen/Kostenträger im BMD-/DATEV-Export mitgegeben werden? | nur intern (Export unverändert) | Steuerberater |
| 32 | Bilanz | Dürfen die Daten der Projektnachkalkulation (Ist-Kosten je Projekt, Fertigstellungsgrad) für die Bewertung unfertiger Projekte zum Bilanzstichtag (UGB § 203, Herstellungskosten ohne Gewinn) verwendet werden; sind interne Stundensätze/Gemeinkostenzuschläge dafür ansetzbar? | nur Information, keine Bewertung im System | Steuerberater |

## Unterschrift am Gerät (Backoffice P0-6, 04.11.2026)

| Nr. | Thema | Frage | Vorschlag | An |
|---|---|---|---|---|
| 33 | Recht | Lieferschein, Montageabnahme und Retoure werden am iPad mit Finger/Stift unterschrieben; gespeichert werden Bild (PNG), Zeitpunkt und ein Prüfwert (SHA-256), unveränderbar am Beleg. Reicht das als Ablieferungs-/Abnahmenachweis gegenüber Verbrauchern und Unternehmern (keine qualifizierte elektronische Signatur), und wie lange ist der Nachweis aufzubewahren (Vorschlag: wie der Beleg, 7 Jahre)? | genügt als einfache elektronische Bestätigung; Aufbewahrung wie Beleg | Rechtsanwalt / Steuerberater |

## Zentrale – Kennzahlen und Fristen (Backoffice B-ZEN, 04.11.2026)

| Nr. | Thema | Frage | Vorschlag | An |
|---|---|---|---|---|
| 34 | Umsatz | „Umsatz Monat netto“ der Zentrale = gebuchte Rechnungen (Rechnung, Teil-, Schlussrechnung, Barverkauf; ohne Anzahlungsrechnungen und Stornos) nach Leistungsmonat minus gebuchte Gutschriften nach Datum; CHF über den Kurs am Beleg; Kassa-Umsatz ohne Rechnung noch nicht enthalten („ohne Kassa“). Ist das als interne Steuerungszahl richtig abgegrenzt? | ja, als interne Zahl | Steuerberater |
| 35 | Fristen | Die Zentrale zeigt Fristen als Hinweis: UVA ab 5 Tagen vor dem 15. des zweitfolgenden Monats (bis ein Export-Lauf übergeben ist), OSS ab 10 Tagen vor Monatsende nach Quartal (nur wenn OSS-Rechnungen bestehen), RKSV-Jahresbeleg bis 15.02., SEE-Ausfall-Meldung, DEP-Sicherung je Quartal. Stimmen Termine und Vorlauf für Platzhirsch (z. B. Dauerfristverlängerung, Quartalszahler)? | wie gebaut, Vorlauf anpassbar | Steuerberater |

## Sortiment – Einkauf (Backoffice B-SOR, 04.11.2026)

| Nr. | Thema | Frage | Vorschlag | An |
|---|---|---|---|---|
| 36 | Einkauf Ausland | Herstellerbestellungen gehen an Lieferanten in DE, IT, BE und CH; das Backoffice führt EK immer netto und zeigt bei Lieferung „Kunde direkt“ (Strecke) ins Ausland einen Hinweis „Reihengeschäft/Ausfuhr“. Reicht das als Hinweis, oder muss je Bestellung die UID-Prüfung des Lieferanten (Datum) und die Lieferkondition (Incoterm) dokumentiert sein, bevor gesendet wird? | UID-Prüfdatum am Lieferanten genügt, Incoterm am Lieferanten | Steuerberater |
| 37 | Aufbewahrung | Bestellungen, Auftragsbestätigungen (PDF), Abgleich-Protokolle, Exportdateien (IWOfurn/EDI/CSV) und Wareneingangsprotokolle werden nie gelöscht, nur storniert. Gilt dafür die 7-jährige Frist nach BAO § 132, und dürfen Fotos von Transportschäden (ggf. mit Personen im Bild) nach Abschluss der Reklamation gelöscht werden? | 7 Jahre für Belege; Fotos nach Abschluss Reklamation + Gewährleistung löschen | Steuerberater / Rechtsanwalt |

## CRM – Datenschutz und E-Mails (Backoffice B-CRM, 04.11.2026)

| Nr. | Thema | Frage | Vorschlag | An |
|---|---|---|---|---|
| 38 | E-Mail-Zuordnung | Mails mit eindeutig einem Kontakt zugeordneter Adresse werden automatisch in der Kundenakte gespeichert (Entscheidung Nr. 52), alle anderen bleiben in Outlook. Reicht der Hinweis in der Datenschutzerklärung („Korrespondenz wird der Kundenakte zugeordnet“), oder braucht es für das dauerhafte Merken einer weiteren Adresse („Adresse merken“) eine eigene Information an den Kunden? | Hinweis in der Datenschutzerklärung genügt | Rechtsanwalt |
| 39 | Aufbewahrung Korrespondenz | Zugeordnete Mails und Gesprächsprotokolle bleiben in der Kundenakte; geschäftliche Korrespondenz zu Belegen unterliegt der 7-jährigen Aufbewahrung (BAO § 132). Gilt das auch für Beratungsprotokolle ohne Auftrag, oder sollen diese nach z. B. 36 Monaten ohne Vorgang gelöscht werden (Vorschlag im CRM-Konzept § 7.3)? | ohne Auftrag nach 36 Monaten löschen, mit Auftrag 7 Jahre | Steuerberater / Rechtsanwalt |

## Kundenkarte – Backoffice (B-KKA, 04.11.2026)

| Nr. | Thema | Frage | Vorschlag | An |
|---|---|---|---|---|
| 40 | Kartenleistung ohne Beleg | „Persönliche Beratung“ und „Vorab-Zugang zu Abenden“ dürfen ohne Beleg als Leistung vermerkt werden (Nachweis = Eintrag mit Zeit, Ort, Person); Lieferung, Montage und Pflege nur mit Beleg. Reicht dieser Nachweis für unentgeltliche Leistungen ohne Kauf, und ist für diese Fälle eine Umsatzsteuer (Eigenverbrauch/Zuwendung) zu prüfen? | Nachweis genügt; keine USt, da reine Serviceleistung ohne Sachzuwendung | Steuerberater |
| 41 | Einwilligung Auswertung | Einwilligungstext „kundenkarte-auswertung-v1“ (backoffice/src/lib/backoffice/kundenkarte/texte.js, `EINWILLIGUNG_TEXT`) und Datenschutzinformation Version 2026-11 – bitte Wortlaut prüfen; Nachweis wird als Foto/Datei oder Tablet-Unterschrift (Prüfwert + Zeit) privat an der Karte abgelegt. Reicht das für Art. 7 Abs. 1 DSGVO, und wie lange ist der Nachweis nach einem Widerruf aufzubewahren? | Text freigeben; Nachweis 3 Jahre nach Widerruf | Rechtsanwalt |


## Shop – Backoffice (B-SHO, 04.11.2026)

| Nr. | Thema | Frage | Vorschlag | An |
|---|---|---|---|---|
| 42 | USt-Bericht Shop | Der Bericht „Eingänge nach USt-Satz“ zählt heute nach Zahlungsmonat (nicht Leistungsmonat), ohne Anzahlungs-Sonderfälle und ohne Kassa; er trägt das Band „Entwurf – nicht für die UVA verwenden“. Welche Abgrenzung brauchen Sie für die UVA (Leistungsmonat, Teilerstattungen je Satz, Gutscheinanrechnung)? | Leistungsmonat = Versand bzw. Übergabe; Erstattungen im Monat der Erstattung | Steuerberater |
| 43 | EU-Fernverkauf | Der Bericht „EU-Versand“ summiert Versandbestellungen ins EU-Ausland netto je Kalenderjahr gegen 10.000 € und warnt ab 80 %; Versand aus Faktura fehlt noch. Reicht die Summe aus Shop + Faktura als Frühwarnung, und wer überwacht die Schwelle? | Summe Shop + Faktura, Warnung an Leitung und GF | Steuerberater |
| 44 | Gutschein-Restwert | Die Kennzahl „Gutschein-Restwert (Verbindlichkeit)“ zählt alle Restwerte außer eingelöst, erstattet und „ersetzt“ – auch abgelaufene Gutscheine mit Rest. Ist das für die Bilanz die richtige Verbindlichkeit, und wann wird ein abgelaufener Rest erfolgswirksam? | so zählen; Ausbuchung erst nach Verjährung (30 Jahre bei unbefristet) | Steuerberater |
| 45 | Kulanz-Gutschein | „Gutschein ohne Verkauf“ (Kulanz, Ersatz, Gewinnspiel) wird als Mehrzweckgutschein ausgegeben, der Grund steht im Verlauf. Braucht es dafür einen Beleg oder eine Buchung beim Ausstellen? | kein Beleg beim Ausstellen; USt bei Einlösung | Steuerberater |
| 46 | Gutschrift Servicefall | Die Service-App bucht Kulanz-/Minderungsgutschriften heute mit 0 % USt; das Backoffice nutzt deshalb nur den Faktura-Weg (Gutschrift aus der Rechnung mit deren USt). Bitte bestätigen: Preisminderung und Kulanz an Verbraucher als Entgeltminderung mit USt-Korrektur der Ursprungsrechnung (§ 16 UStG)? | Faktura-Gutschrift mit USt der Rechnung | Steuerberater |
| 47 | Lieferantenregress | Wie sind Regressgutschriften des Herstellers zu behandeln (Entgeltminderung Einkauf mit Vorsteuerkorrektur oder nicht steuerbarer Schadenersatz)? Bis zur Antwort exportiert der Regress-Bericht Form, Gefordert, Anerkannt, Erhalten und Gutschriftnummer ohne steuerliche Einordnung. | ohne Einordnung im CSV | Steuerberater |
| 48 | Einsatz im Ausland | Techniker-Einsätze in Deutschland/Schweiz (Leistungsort, USt, Zoll für mitgenommene Ersatzteile): das Backoffice verlangt dafür eine Freigabe der Leitung und zeigt einen Hinweis. Welche Regel gilt? | Freigabe Leitung, Prüfung im Einzelfall | Steuerberater |
| 49 | Nachkalkulation netto/brutto | Die Projektnachkalkulation rechnet Erlös und Kosten netto; Kassa-Barausgaben mit Projektnummer gehen brutto ein (kein Vorsteuerausweis am Kassenbuch). Soll das Backoffice diese Beträge als brutto kennzeichnen und unverändert lassen oder pauschal herausrechnen? | brutto kennzeichnen, nicht herausrechnen | Steuerberater |

## Kassa – Backoffice (B-KAS, 04.11.2026)

| Nr. | Thema | Frage | Vorschlag | An |
|---|---|---|---|---|
| 50 | Barausgabe an der Kassa | Barausgaben aus der Lade (Zweck „Ausgabe“, z. B. Porto, Blumen) werden als Entnahme mit Grund und optional Foto vom Beleg gebucht – ohne eigenes USt-Feld und ohne Konto. Reicht das für die Buchhaltung (Beleg wird nachgereicht), oder muss die Kassa USt-Satz und Betrag netto je Ausgabe erfassen? | Grund + Foto, Erfassung der USt in der Buchhaltung | Steuerberater |
| 51 | Gutschein aus Rücknahme | Bei Umtausch und Kulanz zahlt die Kassa den Warenwert als Mehrzweckgutschein aus (Retoure-Position mit dem ursprünglichen Steuersatz minus, Gutschein-Verkauf 0 % plus, Beleg 0,00 €). Ist diese Darstellung umsatzsteuerlich und RKSV-seitig korrekt? | so gebaut | Steuerberater |
| 50 | Drucktitel Gutschrift | Bis zur Antwort druckt das Backoffice Gutschriften mit dem Titel „Rechnungskorrektur“ und der Unterzeile „Storno zu RE-…“ bzw. „Korrektur zu RE-…“ (10-konzept-faktura E13, Frage 9). Bitte bestätigen oder Titel vorgeben. | „Rechnungskorrektur“ | Steuerberater |
| 51 | Leistungsdatum ohne Quelle | Ist das Leistungsdatum nur gleich dem Rechnungsdatum (keine Lieferschein- oder Abnahmequelle), verlangt der Stellen-Dialog die Bestätigung „Leistungsdatum geprüft“. Reicht diese Bestätigung als Nachweis, oder soll ohne Quelle gar nicht gestellt werden? | Bestätigung genügt | Steuerberater |
| 52 | Kostenzuordnung Gemeinkosten | Eingangsrechnungen ohne Projekt werden als „Gemeinkosten“ zugeordnet und erscheinen im Bericht Projektkosten als eigene Zeile (netto). Braucht die Kanzlei dafür eine Kostenstelle oder ein eigenes Aufwandskonto im Export? | eigene Zeile ohne Kostenstelle | Steuerberater |
| 53 | Lieferdatum auf der Rechnung (Logistik) | Welches Datum gilt als Liefer-/Leistungsdatum: Versand `übergeben am`, Eigenlieferung/Abholung `zugestellt am`, Werklieferung (Küche/Bad) die Abnahme? | Die Lieferschein-Akte zeigt beide Daten ohne Wertung; keine automatische Übergabe an Faktura. | Steuerberatung |
| 54 | Ausfuhr CH bei Eigenlieferung (Logistik) | Welche Nachweisform reicht bei Eigenlieferung über die Grenze (CH) bzw. Gelangensnachweis bei Eigenlieferung nach DE? | Band „Steuernachweis nötig“ + Aufgabe an Faktura; „Abgestellt laut Absprache“ entfällt in diesen Fällen. | Steuerberatung |
| 55 | Inventurbewertung (Logistik) | Abwertungsstaffel (Ausstellung 20/40/60/80 % ab 0/12/24/36 Monaten, B-Ware 30 %, Lagerware ab 24 Monaten 50 %) und Methode (gleitender Durchschnitt vs. letzter EK) für den Jahresabschluss bestätigen. | Platzhalter-Staffel, Banner „Platzhalter“ auf Akte, Druck und Bericht. | Steuerberatung |
| 56 | Marketing: Kundenreisen mit Werbung (B-MAR) | Fünf werbliche Kundenreisen (u. a. Pflege-Nachkauf, Jahrestag) warten auf die Kanzlei-Freigabe; das Backoffice aktiviert sie erst danach. Bitte je Reise Rechtsgrundlage (Einwilligung vs. Bestandskunden-Ausnahme TKG § 174) und Pflichttexte bestätigen. | bleiben aus bis zur Freigabe | Kanzlei |
| 57 | Marketing: Papier-Einwilligung (B-MAR) | Einwilligung auf Papier (Showroom, Event) wird nur mit hochgeladenem Beleg als bestätigt gespeichert, ohne Bestätigungsmail. Reicht der Scan als Nachweis, und wie lange ist er aufzubewahren? | Scan genügt, Aufbewahrung bis 3 Jahre nach Widerruf | Kanzlei |
| 58 | Aufbewahrungsfristen Ablage (B-ABL) | Die Ablage sperrt Dateien der Klasse „Beleg“ 7 Jahre ab Ende des Belegjahres gegen Löschen (BAO § 132). Für „Personal“ (7 Jahre, nur Personal-Leitung löscht), „Projekt“ (7 Jahre Empfehlung wegen Gewährleistung) und „Marketing“ (3 Jahre Empfehlung) sind es Vorschläge ohne Sperre. Bitte Fristen und ob auch Personal-/Projektunterlagen eine Löschsperre brauchen bestätigen. | Vorschläge wie gebaut, Sperre nur Beleg | Steuerberatung |
| 59 | Mail-Anhänge als Beleg (B-ABL) | Anhänge aus Kunden-Mails landen automatisch im Ordner „00 Mail-Anhänge“ (Klasse Allgemein). Müssen Eingangsrechnungen/Verträge, die per Mail kommen, zwingend in die Klasse „Beleg“ (Löschsperre) umgestellt werden, oder reicht die Ablage in der Buchhaltung? | Allgemein, Umstellen von Hand | Steuerberatung |
| 60 | Barrierefreiheit internes Backoffice (QA-service) | Das Backoffice wird nur von Mitarbeitern genutzt. Das Barrierefreiheitsgesetz (BaFG) gilt für Leistungen an Verbraucher; für interne Software gelten eher Arbeitsplatz-Pflichten (BEinstG, ASchG). Besteht für das interne Backoffice eine rechtliche Pflicht zu WCAG 2.2 AA, oder ist es eine freiwillige Qualitätsvorgabe? Gebaut und geprüft wird ohnehin nach WCAG 2.2 AA. | freiwillig, Prüfung nach WCAG 2.2 AA bleibt | Kanzlei |
