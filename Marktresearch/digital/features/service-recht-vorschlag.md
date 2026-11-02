# Services – Vorschläge für Rechtstexte (an die Kanzlei)

**Stand:** 29.10.2026 · Die Rechtstexte der Website sind freigegeben und werden NICHT direkt geändert. Diese Datei sammelt Ergänzungsvorschläge aller Service-Teams zur Prüfung durch die Kanzlei. Jedes Team ergänzt nur seinen Abschnitt.

## Winterlager und Pflege für Outdoor-Möbel (Service 3)

**Stand:** 29.10.2026 · Seite `/de|en/outdoor-winterservice` (noindex). Die Seite sagt heute nur: „Unverbindlich: Sie erhalten zuerst ein Angebot“, „Laufzeit und Kündigung stehen schriftlich in Ihrem Angebot“, keine Preise, keine Versicherungsaussage. Alles Folgende ist **Vorschlag** an die Kanzlei.

### A. Service-AGB „Winterlager und Pflege“ (Verwahrung)
1. **Vertragsart:** Kombination aus Verwahrungsvertrag (§§ 957 ff. ABGB) für die Lagerung und Werk-/Dienstleistung für Reinigung/Pflege, Transport als Nebenleistung. **Kanzlei:** Einordnung und Folgen (Sorgfaltsmaßstab des Verwahrers § 961 ABGB, Rückgabepflicht § 962 ABGB) prüfen.
2. **Übernahme:** Bei der Abholung erstellen wir eine Übernahmeliste (Anzahl, Material, sichtbarer Zustand, Fotos). Vorschäden werden vermerkt; der Kunde erhält die Liste in Textform.
3. **Obhut und Haftung:** Lagerung trocken im eigenen Lager. Haftung für Verlust und Beschädigung nach Gesetz; Beschränkung für leichte Fahrlässigkeit nur soweit nach § 6 Abs 1 Z 9 KSchG zulässig. Material-typische Veränderungen (Patina von Teak, Ausbleichen von Stoffen) sind kein Schaden.
4. **Versicherung:** **Inhaber/Kanzlei:** Deckt die Betriebs- bzw. Inhaltsversicherung fremde eingelagerte Ware (Feuer, Leitungswasser, Einbruch)? Bis zu welchem Wert? Erst danach darf die Seite eine Aussage treffen (`versicherung` in `config.js`). Vorschlag: Kunde nennt bei hochwertigen Stücken den Wert, sonst gilt eine Höchstgrenze je Auftrag.
5. **Pflege und Reparaturen:** Reinigung/Pflege nach Herstellerhinweisen, soweit vorhanden. Reparaturen nur nach Rücksprache in Textform und gegen gesondertes Entgelt; Arbeiten reglementierter Handwerke nur durch befugte Betriebe (vgl. Pflege E).
6. **Rückgabe, Verzug, Pfandrecht:** Rückbringung im vereinbarten Zeitraum. Zurückbehaltungsrecht bei offenen Forderungen (§ 471 ABGB) – **Kanzlei:** gesetzliches Pfand-/Zurückbehaltungsrecht des Verwahrers bzw. Lagerhalters (§§ 1440, 471 ABGB; § 475b UGB nur für Lagerhalter als Gewerbe) prüfen. Nicht abholbare/annahmeverweigerte Möbel: Lagergeld ab [Datum], Verwertung erst nach Mahnung und angemessener Frist (§ 1425 ABGB Hinterlegung als Alternative).
7. **Zugang beim Kunden:** Kunde sorgt für Zugang und Tragewege; Mehraufwand (Stockwerke ohne Lift, Kran) nach Angebot.
8. **Preis:** laut Angebot.

### B. Abo-Bedingungen (jährlicher Winterservice)
1. **Laufzeit/Verlängerung:** Vorschlag: eine Saison (Herbst bis Frühling), verlängert sich um jeweils eine Saison, wenn nicht bis [31. August] gekündigt. Gegenüber Verbrauchern nur wirksam mit **rechtzeitigem Hinweis vor Fristbeginn** auf die Bedeutung des Schweigens (§ 6 Abs 1 Z 2 KSchG) – Pflichtbaustein der Saison-Mail der Kundenbetreuung (Journey `winterlager_saison`, siehe service-pflege-schnittstelle.md §6). DE-Kunden: § 309 Nr. 9 BGB (nach erster Laufzeit jederzeit mit 1 Monat kündbar).
2. **Kündigung:** in Textform (E-Mail genügt); bei Online-Abschluss Kündigungsweg im Kundenportal (§ 312k BGB).
3. **Preisänderung:** nur mit Zustimmung bzw. Sonderkündigungsrecht (§ 6 Abs 1 Z 5 KSchG).
4. **Bis zur Freigabe:** Seite nennt nur „Laufzeit und Kündigung stehen schriftlich in Ihrem Angebot“; der Link „Abo-Bedingungen lesen“ erscheint erst mit `abo.bedingungenPfad`.

### C. FAGG – Widerruf bei Abholung vor Fristende
- Vertragsschluss per Angebot/E-Mail = Fernabsatz, beim Kunden vor Ort = Außergeschäftsraumvertrag. Widerrufsfrist 14 Tage.
- Abholung im Herbst kann vor Fristende liegen: nur auf **ausdrückliches Verlangen** des Kunden (§ 10 FAGG) mit Belehrung über das anteilige Entgelt bei Widerruf (§ 16 FAGG). Vorschlag Wortlaut im Angebot: „Ich verlange ausdrücklich, dass Sie vor Ende der Widerrufsfrist mit der Abholung beginnen. Mir ist bekannt, dass ich bei Widerruf einen anteiligen Betrag für die bis dahin erbrachten Leistungen zahle.“
- Bei Widerruf: Rückbringung der Möbel auf Kosten [Kanzlei/Inhaber].

### D. Datenschutz-Ergänzung „Outdoor-Winterservice“
„Wenn Sie Möbel für den Winterservice anmelden, verarbeiten wir Name, Kontaktdaten, Abholadresse und Zugangshinweise, die Möbelliste sowie freiwillig hochgeladene Fotos, um ein Angebot zu erstellen und Abholung, Lagerung und Rückbringung durchzuführen (Art. 6 Abs 1 lit b DSGVO). Übernahmelisten und Fotos des Zustands bewahren wir bis [6] Monate nach der Rückbringung auf, Rechnungsdaten nach § 132 BAO.“ Lead-Kontext `winterlager`, Versand über das bestehende Beratungsformular.

## Wunschliste für Einzug oder Hochzeit (Service 10)

**Nachbesserung 29.10.2026 (QA Recht):** (1) Die Einwilligung „Name und Gruß anzeigen“ ist jetzt **freiwillig** (Art. 7 Abs 4 DSGVO); ohne Häkchen erscheint der Beitrag ohne Namen und Gruß, mit Häkchen wird der Zeitpunkt gespeichert (`consentAt`); Widerruf per E-Mail an info@platzhirsch.studio. (2) In Produktion ist die Wunschliste aus, bis Abschnitt A in die Datenschutzerklärung übernommen ist (`DATENSCHUTZ_WUNSCHLISTE`). (3) Der Online-Kauf zum Gemeinschafts-Gutschein öffnet sich erst, wenn Ergänzung B freigegeben **und** die Kaufstrecke angebunden ist (`GEMEINSCHAFTS_GUTSCHEIN`); solange Gutscheine nicht freigegeben sind, gibt es in Produktion keinen Beitrags-Abschnitt. (4) Reservierung: Datenschutzhinweis und Satz „keine Reservierung bei Platzhirsch“ ergänzt; der Text nennt jetzt, dass auch das Studio Name/Notiz speichert – **Abschnitt A, Absatz „Reservierungen“ entsprechend anpassen** („…sieht die Person, die die Liste erstellt hat; gespeichert beim Studio“). (5) Neu: „Liste melden“ (E-Mail), Sperre durch das Studio. (6) Google Analytics erhält Teilen-Links nur maskiert (`/wunschliste/:id`); Satz für Abschnitt A: „Für die Statistik ersetzen wir den Schlüssel im Link, Google Analytics erhält ihn nicht.“

Technik: `src/lib/wunschliste/**`, Doku `qa-screenshots/service/wunschliste-bau.md`. Alles Folgende ist **Vorschlag**, nicht veröffentlicht.

### A. Ergänzung Datenschutzerklärung – Abschnitt „Teilbare Wunschliste“

> **Teilbare Wunschliste.** Sie können Ihre Merkliste als Wunschliste teilen (z. B. zu Einzug oder Hochzeit). Dafür speichern wir Anlass, Titel, optional Datum und Nachricht sowie die ausgewählten Stücke (Produktname, Marke, Bild). Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Bereitstellung der von Ihnen angeforderten Funktion). Die Liste ist nur über einen zufällig erzeugten, nicht erratbaren Link erreichbar, wird nicht in Suchmaschinen aufgenommen und lässt sich über Ihren Verwaltungslink jederzeit widerrufen oder löschen. Den Link gibt nur weiter, wer die Liste erstellt hat. Bitte tragen Sie in Titel und Nachricht keine Adressen oder Telefonnummern ein; sie wären für alle mit dem Link sichtbar.
>
> **Reservierungen.** Wer ein Stück reserviert, kann freiwillig Namen und eine Notiz angeben. Öffentlich erscheint nur „Reserviert“; Name und Notiz sieht ausschließlich die Person, die die Liste erstellt hat. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO bzw. Ihre Einwilligung durch freiwillige Angabe (lit. a). Zum Aufheben der eigenen Reservierung speichert Ihr Browser einen Schlüssel (localStorage, technisch erforderlich, § 165 Abs. 3 TKG 2021).
>
> **Beiträge zu einem Gutschein.** Wenn Sie zu einem gemeinsamen Gutschein beitragen, verarbeiten wir Ihren Namen, Ihre E-Mail-Adresse, Ihren Gruß und den vorgeschlagenen Betrag, um den Gutschein mit Ihnen abzustimmen (Art. 6 Abs. 1 lit. b DSGVO, vorvertragliche Maßnahme). Ihren Namen und Ihren Gruß zeigen wir der Person, die die Liste erstellt hat, nur mit Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, Häkchen im Formular, jederzeit widerrufbar). Ihre E-Mail-Adresse erhält sie nicht. Bei einer Online-Zahlung gelten zusätzlich die Hinweise zu Stripe.
>
> **Speicherdauer.** Wunschlisten werden [12] Monate nach dem angegebenen Anlass bzw. – ohne Datum – nach dem Erstellen gelöscht, auf Wunsch sofort. Beitragsdaten bewahren wir darüber hinaus nur auf, soweit gesetzliche Aufbewahrungspflichten bestehen (z. B. § 132 BAO bei einem Gutscheinkauf).
>
> **Empfänger.** Hosting-Dienstleister; nach Anbindung unser Backoffice (Frappe/ERPNext, Auftragsverarbeitung); bei Online-Zahlung Stripe.

Offene Punkte für die Kanzlei:
1. Reicht lit. b für die Wunschliste selbst, oder wird Einwilligung bevorzugt? (Vorschlag: lit. b, die Person fordert die Funktion an.)
2. Daten Dritter in Titel/Nachricht (Namen des Paares): Hinweis im Formular („keine Adresse“) ausreichend?
3. Speicherfrist bestätigen (Konfiguration `retentionMonths`, heute technischer Standard 12 Monate).
4. Teilen per WhatsApp: Es wird nur ein Link `wa.me/?text=…` geöffnet, keine Einbindung von Meta auf der Seite. Hinweis nötig?

### B. Ergänzung Gutscheinbedingungen – „Gemeinschafts-Gutschein zu einer Wunschliste“

> Mehrere Personen können zu einem gemeinsamen Gutschein für die Person beitragen, die eine Wunschliste geteilt hat („Beschenkte“). Jeder Beitrag ist ein eigener Gutscheinkauf der beitragenden Person zu den allgemeinen Gutscheinbedingungen. Auf Wunsch der Beschenkten fasst Platzhirsch die bezahlten Beiträge zu einem Gutschein über die Gesamtsumme zusammen; ab diesem Zeitpunkt steht der Gutschein den Beschenkten zu. Das Widerrufsrecht der beitragenden Person (14 Tage, FAGG) bleibt bis zum Zusammenfassen unberührt; danach [Kanzlei: Regelung]. Ein Anspruch auf ein bestimmtes Stück der Wunschliste entsteht nicht; Verfügbarkeit, Ausführung und Preis klären wir im Gespräch. Eine Reservierung auf der Wunschliste ist eine Absprache unter den Schenkenden und keine Reservierung bei Platzhirsch.

Offene Punkte: Einzweck/Mehrzweck (identisch zur offenen Gutscheinfrage 2), Inhaberschaft nach dem Zusammenfassen, Widerruf nach dem Zusammenfassen, Barablöse/Restwert.

### C. Hinweistexte auf der Seite (bereits als neutrale Hinweise umgesetzt, keine Rechtstexte)
- Merkliste-Formular: „Ich habe verstanden: Jeder mit dem Link sieht Titel, Nachricht und Stücke. Ich kann den Link jederzeit widerrufen.“ (aktive Bestätigung)
- Beitrag: „Kein Kauf: Sie senden eine Anfrage, es wird nichts bezahlt.“ / „Mein Name und mein Gruß dürfen den Beschenkten angezeigt werden.“ (aktive Einwilligung)
- Öffentliche Liste: „Diese Liste ist nur über ihren Link erreichbar und erscheint nicht in Suchmaschinen. Die Person, die sie geteilt hat, kann den Link jederzeit widerrufen.“


## Pflege-Abo Leder, Stoff, Holz (Service 4)

**Stand:** 29.10.2026 · Team Pflege · Nur Vorschlag an die Kanzlei, nichts davon steht als Rechtstext auf der Website. Die Seite `/de|en/pflege-service` sagt heute nur: „Laufzeit, Kündigung und Preis stehen verbindlich in Ihrem Angebot.“

### A. Service-AGB „Pflegeleistungen“ (Ergänzung zu den AGB)
1. **Gegenstand:** Reinigung und Pflege von Möbeln aus Leder, Stoff, Holz/Furnier und Naturstein beim Kunden, nach der Pflegeanleitung des Herstellers. Ausbesserungen nur nach vorheriger Abstimmung im Einzelfall (Textform).
2. **Mitwirkung:** Der Kunde nennt Material und stellt, soweit vorhanden, die Pflegeanleitung und Materialangaben zur Verfügung; er sorgt für Zugang, Licht und Stromanschluss.
3. **Grenzen:** Kein Erfolg im Sinne einer vollständigen Fleck- oder Schadensbeseitigung geschuldet (Dienstleistung, kein Werkerfolg) – **Kanzlei: Abgrenzung Werkvertrag/Dienstvertrag nach ABGB §§ 1151 ff. prüfen**. Material-typische Veränderungen (Patina, Farbnuancen) sind kein Mangel.
4. **Herstellergarantie:** Wir arbeiten nach Herstellervorgabe; ob ein Eingriff die Herstellergarantie berührt, klären wir vorher. Kein Versprechen für die Garantie Dritter. (Beleg: Poliform „Certificate of Origin and Warranty“, poliform.it/en/?p=230841: Schäden durch mangelhafte Pflege und Reparaturen durch nicht autorisierte Personen sind ausgeschlossen.)
5. **Haftung:** Haftung für Schäden am Möbel nach Gesetz; Haftungsbeschränkung für leichte Fahrlässigkeit nur soweit nach KSchG § 6 Abs 1 Z 9 zulässig (nicht bei Personenschäden). **Kanzlei:** Versicherungsdeckung (Betriebshaftpflicht, Obhutsschäden) mit Inhaber klären.
6. **Preis:** laut Angebot; Anfahrt laut Angebot.

### B. Abo-Bedingungen (Jahres-Abo mit Erinnerung)
1. **Laufzeit:** Vorschlag 12 Monate ab dem ersten Termin; danach unbefristet, kündbar zum Ende jedes Abo-Jahres mit einer Frist von 1 Monat, per E-Mail. **Kanzlei:** Zulässigkeit der automatischen Verlängerung gegenüber Verbrauchern (KSchG § 6 Abs 1 Z 2: rechtzeitiger Hinweis auf die Bedeutung des Schweigens vor Fristbeginn) – die Erinnerungs-Mail kann diesen Hinweis tragen. Für Kunden in DE: § 309 Nr. 9 BGB (nach Mindestlaufzeit jederzeit mit 1 Monat kündbar) – Bedingungen so fassen, dass beide Rechtsordnungen erfüllt sind.
2. **Fernabsatz/Außergeschäftsraum:** Abschluss per Angebot/E-Mail = Fernabsatz (FAGG). Widerrufsbelehrung 14 Tage; **Beginn vor Ablauf der Frist nur auf ausdrücklichen Wunsch** (FAGG § 10, § 16: anteiliges Entgelt). Abschluss beim Termin vor Ort = Außergeschäftsraumvertrag (FAGG), ggf. Bagatellgrenze § 1 Abs 2 Z 1 (50 €) prüfen.
3. **Kündigungsbutton:** Für online geschlossene Abos Pflicht in DE (§ 312k BGB) – falls künftig online abschließbar, Kündigungsweg im Kundenportal vorsehen.
4. **Preisänderung:** nur mit Zustimmung bzw. Sonderkündigungsrecht (KSchG § 6 Abs 1 Z 5, Indexklausel nur zweiseitig).
5. **Pausieren:** Vorschlag: einmal je Abo-Jahr möglich, ohne Kosten.

### C. Nachkauf-Erinnerung (Pflegemittel) – Einwilligung
Formulartext (umgesetzt, Version `pflege-nachkauf-v1-2026-10-29`): „Bitte erinnern Sie mich nach dem Pflegetermin per E-Mail an passende Pflegemittel. Freiwillig. Sie können das jederzeit abbestellen.“
- Rechtsgrundlage: Einwilligung (TKG 2021 § 174 Abs 3; DSGVO Art. 6 Abs 1 lit a). **Kanzlei:** Alternativ Bestandskunden-Ausnahme § 174 Abs 4 TKG (eigene ähnliche Produkte, Widerspruchsmöglichkeit bei Erhebung und jeder Nachricht) – wir haben die strengere Variante gewählt.
- Nachweis bis zur Installation des Doctypes (Nachbesserung 29.10.2026): eigene maschinenlesbare Zeile im Anfragetext `Einwilligungsnachweis: zweck=pflege_nachkauf; version=…; zeitpunkt=<ISO, UTC>; sprache=de; wortlaut="…"` (`anfrage.js` `nachkaufNachweis`/`parseNachkaufNachweis`), unveränderlich im Backoffice-Datensatz „Anfrage“ gespeichert.
- Nachweis: Textversion, Zeitpunkt, Widerruf im Frappe-Doctype `Pflege Abo` (Felder `nachkauf_*`); Versand nur über die Kundenbetreuung (Abmeldelink, Testmodus). Vorschlag Zweck `pflege_nachkauf` in `PH Einwilligung`.
- Die **Termin-Erinnerung** im Abo ist Vertragsinhalt (DSGVO Art. 6 Abs 1 lit b), keine Werbung.

### D. Datenschutz-Ergänzung „Pflege-Service“
„Wenn Sie einen Pflegetermin anfragen, verarbeiten wir Name, Kontaktdaten, Ort der Möbel (Postleitzahl und Ort), Angaben zu Möbelstücken und Material sowie freiwillig hochgeladene Fotos, um Ihre Anfrage zu beantworten, ein Angebot zu erstellen und den Termin durchzuführen (Art. 6 Abs 1 lit b DSGVO). Fotos laden Sie über einen persönlichen Link hoch; bei JPEG-Fotos entfernen wir Standortdaten automatisch. Bei einem Pflege-Abo speichern wir Termine und Pflegeprotokolle für die Dauer des Abos und danach nach den gesetzlichen Aufbewahrungsfristen. Erinnerungen an Pflegemittel senden wir nur mit Ihrer Einwilligung; Sie können sie jederzeit widerrufen.“ – **Kanzlei:** Speicherdauer der Fotos (Vorschlag: Löschung 6 Monate nach Angebot ohne Auftrag), HEIC-Fotos (GPS heute nur bei JPEG entfernt, Upload-Paket).

### E. Gewerberecht (Frage an die Kanzlei / WKO)
Reinigung und Pflege beim Kunden: freies Gewerbe oder Teil des Handelsgewerbes? **Ausbesserungen** an Polstern/Leder (Tapezierer/Sattler), Holz (Tischler) und Stein (Steinmetz) sind reglementierte Handwerke. Vorschlag wie bei Outdoor: Ausbesserungen über einfache Pflege hinaus nur durch befugte Partnerbetriebe; die Seite sagt bereits „Größere Schäden sind Tischlerarbeit“ und „Arbeit für den Steinmetz“.

**Nachbesserung 29.10.2026 (QA Recht P1-2/P1-3/P2):** Überschrift jetzt „mit Rücksicht auf Ihre Garantie“ (kein Garantie-Versprechen); „Ausbesserungen“ und „Farbauffrischung“ erscheinen erst nach Antwort auf E (`ausbesserungenFreigegeben`); „statutory warranty“ statt „statutory guarantee“; keine Zusage „melden wir beim Hersteller“; keine automatische Erinnerung zugesagt, bis die Journeys laufen. Absatz A.4 entsprechend: „Wo der Hersteller eine Pflegeanleitung vorgibt, arbeiten wir danach.“

## Projekt-Tagebuch und Referenz-Freigabe (Service 12)

**Nachbesserung 29.10.2026:** Handzeichnungen und Modellfotos sind von Referenzen ausgenommen (Grundriss einer Privatwohnung); Einwilligung jetzt Version `tagebuch-referenz-2026-10-29-v2` mit neuem Absatz dazu und Link zur Datenschutzerklärung. Das Tagebuch läuft in Produktion erst, wenn Abschnitt B in der Datenschutzerklärung steht (`DATENSCHUTZ_TAGEBUCH`). `TAGEBUCH_PREVIEW=1` wirkt nur mit dem Datei-Adapter, nie mit dem echten Speicher.

Technik: `src/lib/portal/tagebuch/**`, Doku `qa-screenshots/service/tagebuch-bau.md`. Alles Folgende ist **Vorschlag**. Der Einwilligungstext steht im Code als `EINWILLIGUNG` (`src/lib/portal/tagebuch/config.js`, Version `tagebuch-referenz-2026-10-29-v1`, Status `entwurf`); solange er nicht freigegeben ist, ist die Referenz-Freigabe in Produktion abgeschaltet.

### A. Einwilligung „Als Referenz freigeben“ (Wortlaut im Portal, Entwurf)

> 1. Ich bin damit einverstanden, dass die Platzhirsch Home Living die ausgewählten Fotos meines Projekts auf ihrer Website unter /projekte als Referenzprojekt zeigt, zusammen mit einer kurzen Projektbeschreibung, die das Studio verfasst.
> 2. Gezeigt werden nur die Fotos, die ich ausgewählt habe, und die Nennung, die ich gewählt habe. Eine Adresse wird nie veröffentlicht. Metadaten wie GPS-Koordinaten sind aus den Bildern entfernt.
> 3. Ich habe darauf geachtet, dass auf den Fotos keine Personen, Hausnummern, Autokennzeichen oder Dokumente erkennbar sind, oder dass die abgebildeten Personen ebenfalls zugestimmt haben.
> 4. Vor der Veröffentlichung prüft das Studio den Eintrag. Ich kann meine Einwilligung jederzeit ohne Angabe von Gründen im Kundenportal oder per E-Mail an info@platzhirsch.studio widerrufen. Die Seite wird dann entfernt. Der Widerruf berührt nicht die Rechtmäßigkeit der Veröffentlichung bis dahin.

Gespeichert werden: Version, Textstatus, Wortlaut, Zeitpunkt (ISO), Kanal, Auswahl der Bilder, Nennung (anonym oder Vorname + Gemeinde/Region). Nach Widerruf: Bildkopien gelöscht, Datensatz bleibt als Nachweis (Art. 7 Abs. 1 DSGVO).

Offene Punkte für die Kanzlei:
1. Rechtsgrundlage Veröffentlichung: Art. 6 Abs. 1 lit. a DSGVO; Bildnisschutz § 78 UrhG für erkennbare Personen; Hausrecht/Privatsphäre (§ 1328a ABGB) für Innenräume – reicht die Einwilligung des Auftraggebers, wenn mehrere Personen im Haushalt wohnen? (Vorschlag: Satz 3 deckt Abgebildete, ergänzend „im Namen aller Bewohner“?)
2. Nutzungsrecht an Fotos, die der Kunde selbst gemacht hat (Lichtbildschutz § 74 UrhG): Genügt Satz 1 als Werknutzungsbewilligung (Website, unentgeltlich, widerruflich), oder braucht es eine eigene Klausel? Social Media/Print sind bewusst NICHT umfasst.
3. Widerruf: Wirkung auf bereits verbreitete Kopien (Caches, Screenshots Dritter) – Hinweis nötig? Technisch: Bilder werden mit 60 s Cache ausgeliefert und ohne Bildoptimierer, damit der Widerruf sofort greift.
4. Formerfordernis: Reicht die elektronische Einwilligung im Portal (Checkbox + Protokoll), oder soll weiterhin ein unterschriebenes Formular abgelegt werden (projekte.js verlangt bisher `einwilligung.ablage`)? Vorschlag: Portal-Protokoll ist die Ablage.
5. Handzeichnungen/Modelle von Harald in Referenzen: Urheberrecht liegt beim Studio/Harald – nur Zustimmung des Kunden zur Darstellung seiner Räume nötig?

### B. Ergänzung Datenschutzerklärung – Abschnitt „Kundenportal: Projekt-Tagebuch“

> **Projekt-Tagebuch.** Im Kundenportal können Sie und unser Team Fotos Ihres Projekts hochladen (z. B. Lieferung, Montage, Vorher/Nachher). Wir speichern die Bilder, den Bildtitel, wer sie hochgeladen hat und wann. Beim Hochladen wird jedes Bild neu berechnet; dabei entfernen wir alle Metadaten, insbesondere Standortdaten (GPS), Kameradaten und Namen. Das Original speichern wir nicht. Die Fotos sind nur für Sie und unser Team sichtbar. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Durchführung Ihres Einrichtungsprojekts). Sie können eigene Fotos jederzeit löschen. Speicherdauer: [Kanzlei/Inhaber: z. B. bis zum Ende der Gewährleistung, danach Löschung].
>
> **Referenzprojekt.** Wenn Sie ausdrücklich einwilligen, zeigen wir ausgewählte Fotos mit einer kurzen Beschreibung auf unserer Website, anonym oder mit Vorname und Gemeinde nach Ihrer Wahl, nie mit Adresse (Art. 6 Abs. 1 lit. a DSGVO). Vor der Veröffentlichung prüfen wir jeden Eintrag. Sie können die Einwilligung jederzeit im Portal oder per E-Mail widerrufen; die Seite und die Bildkopien werden dann sofort entfernt. Den Nachweis Ihrer Einwilligung und des Widerrufs (Datum, Textversion) bewahren wir auf, solange wir ihn zur Rechenschaft benötigen (Art. 5 Abs. 2, Art. 7 Abs. 1 DSGVO).
>
> **Empfänger.** Hosting-Dienstleister; nach Anbindung unser Backoffice (Frappe/ERPNext, Auftragsverarbeitung).

### C. Hinweistexte (bereits als neutrale Hinweise umgesetzt, keine Rechtstexte)
- Bei jedem Upload: „Bitte achten Sie darauf, dass keine Gesichter, Hausnummern, Autokennzeichen oder Dokumente zu sehen sind. Standortdaten (GPS) und andere Metadaten entfernen wir beim Hochladen automatisch.“ + Pflicht-Häkchen „Habe ich geprüft …“.
- Handzeichnung/Modell (nur Team): Pflicht-Häkchen „Scan oder Foto des echten Originals (keine KI, kein Rendering)“.
