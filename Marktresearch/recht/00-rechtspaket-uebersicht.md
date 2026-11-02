# 00 – Rechtspaket Platzhirsch: Übersicht, aufgelöste Widersprüche, Launch-Prioritäten, Fragen an Anwalt und Steuerberater

> **Entwurf – vor Verwendung durch eine Rechtsanwältin/einen Rechtsanwalt prüfen lassen.**
> Diese Übersicht ist keine Rechtsberatung. Sie fasst die Entwürfe `recht/01` bis `recht/06` und `digital/14` zusammen, legt fest, welche Fassung bei Widersprüchen gilt, und bereitet das Mandat für eine echte Kanzlei vor. Platzhalter: **[vom Unternehmen auszufüllen]** = Fakt oder Entscheidung des Inhabers, **[anwaltlich prüfen]** = Rechtsfrage offen, **[Steuerberater]** = steuerliche Frage, **[Schätzung]** = eigene Herleitung, kein belegter Wert.

**Stand:** 26.10.2026 · Rolle: koordinierende Rechtsanwältin (Projektkoordination, kein Mandat) · Grundlage: `recht/01–06`, `digital/14`, `digital/00` (Masterplan inkl. Review-Abschnitt 11), Berichte 00, 23, 26. Am Code wurde nichts geändert, nichts veröffentlicht.

**Hinweis zur Quellenlage:** Die Normen und Urteile in dieser Datei stammen aus den sechs Einzelentwürfen. Dort stehen die Quellen (RIS, gesetze-im-internet, fedlex, WKO, EuGH/OGH). Für diese Übersicht war das Web-Suchkontingent bereits aufgebraucht. Die Kostenschätzung in Abschnitt 7 beruht deshalb auf eigener Kenntnis und ist **nicht** mit aktuellen Honorarquellen abgeglichen. Sie ist als [Schätzung] markiert.

---

## 0. Das Wichtigste auf einer Seite

1. **Das größte Rechtsrisiko ist nicht die Website, sondern das Kundengeld.** Die MW Immobilienverwaltungs GmbH hat ein Eigenkapital von −2,67 Mio. €. Gutscheine (Mo 16.11.), Atelier-Reservierungen mit Anzahlung und Küchenanzahlungen sollen **vor** der dokumentierten Fortbestehensprognose (Entwurf bis 27.11.) und **vor** der Handels-GmbH (Beurkundung bis 09.12.) starten. Bevor Vorauszahlungen von Kunden angenommen werden, muss der Insolvenz-/Gesellschaftsrechtler bestätigen, dass das zulässig ist (Antragspflicht bei Überschuldung nach § 69 IO, Geschäftsführerhaftung, strafrechtliche Risiken bei Vorauszahlungen in der Krise) **[anwaltlich prüfen, höchste Priorität]**. Bis dahin gilt: Gutscheine und Anzahlungen nur mit Freigabe der Kanzlei, Kundengeld nicht zur Tilgung alter Schulden verwenden (so auch `digital/00` AP9).
2. **Heute löschen, ohne auf Features zu warten:** Händlerbehauptungen auf 36 Markenseiten (Backoffice `dealers_description_*`, nur ClassiCon belegt), alte Rabatt-News mit „statt“-Preisen, unbelegte Superlative und pauschale Nachhaltigkeitsaussagen (`recht/03`). Außerdem den Repo-Stand mit den bereinigten Markentiteln und `llms.txt` deployen. Das ist das Risiko mit der höchsten Abmahn-Wahrscheinlichkeit. Es gefährdet auch die Gespräche mit Minotti und Poliform (Gate 0).
3. **Eine Adresse, ein Vertragspartner, eine Datei.** Laut Firmenbuch lautet die Adresse Landstraße 11, die Website nennt 9 (`recht/04`). Bis zur Eintragung der Handels-GmbH ist die **MW Immobilienverwaltungs GmbH** Vertragspartner für alles, was vor Weihnachten verkauft wird. Die AGB brauchen deshalb zuerst eine Übergangsfassung für die MW GmbH (Abschnitt 2, W14).
4. **15 Widersprüche zwischen den Entwürfen** sind in Abschnitt 2 aufgelöst. Die wichtigsten:
   - Auch „Gutschein per Anfrage + Rechnung“ ist ein **Fernabsatzvertrag** mit 14 Tagen Rücktrittsrecht.
   - Für die Binni-Linie keinen Namen „Cucina“ verwenden.
   - Ausstellungsstücke bekommen **keine** Verkürzung der Gewährleistung auf ein Jahr.
   - Den Link zur OS-Plattform überall streichen.
   - Bei der Terminbuchung nicht mit der EU-Region von Cal.com planen.
5. **Beratungskosten** für das ganze Paket ohne Ausgliederung: etwa **22–76 T€ netto** [Schätzung, Abschnitt 7]. Davon fallen ca. 5–18 T€ bis Ende November an. Die Ausgliederung selbst ist im Masterkonzept mit 20–50 T€ angesetzt (23, Abschn. 5.5). *Korrektur 28:* Der Beirat (27, W4) legt dafür verbindlich 45–110 T€ nach wachstum/07 fest. Das Rechtspaket ist im Budget des Beirats bisher nur mit dem AGB-Mandat (3–8 T€) enthalten.

---

## 1. Übersicht der Entwürfe

| Nr. | Datei | Inhalt | Reifegrad | Wichtigste Lücke | Braucht vor Verwendung |
|---|---|---|---|---|---|
| 01 | `recht/01-agb-entwurf.md` | AGB Teil I (Verbraucher, AT/DE/CH/FL), Teil II (B2B), Kurzfassung in 12 Punkten, Prüfliste | Volltext-Entwurf | Vertragspartner (heute MW GmbH, Entwurf auf Handels-GmbH zugeschnitten); Widerrufsbelehrung und Muster-Formular fehlen als eigene Texte; Zahlungsplan in sich widersprüchlich (W6) | Kanzlei AT (Konsumentenrecht), DE-Gegenprüfung §§ 305 ff. BGB, CH-Rückfrage Art. 120 IPRG |
| 02 | `recht/02-datenschutzerklaerung-entwurf.md` | neue Datenschutzerklärung in Modulen, 16 Änderungen am Cookie-Banner, 24 Verträge (AVV usw.), 19 Einträge fürs Verarbeitungsverzeichnis, 5 Prüfungen auf Folgenabschätzung, CH-revDSG | Volltext-Entwurf | Hoster, Backoffice-Standort, GA4-Einstellungen, Anbieter für KI und Termine | Kanzlei IT-/Datenschutzrecht AT; Übersetzung EN/FR/IT |
| 03 | `recht/03-uwg-werbe-audit.md` | Prüfung von Live-Seite und Repo, Fundstellen, verbindliche Texteregeln R-M/R-A/R-P/R-H/R-G/R-B/R-L/R-X, Maßnahmenliste | Audit fertig, Regeln fertig | Belege je Marke (Bezugsweg), m², Liefergebiet | Kanzlei Wettbewerbsrecht AT (Auslegung EmpCo/PBV) |
| 04 | `recht/04-impressum-pflichtangaben.md` | Prüfung Impressum, Varianten A (MW GmbH) und B (Handels-GmbH), BaFG, DSA, Social Media, Newsletter-Fußzeile | Volltext-Entwurf | Hausnummer, GISA/WKO-Auszug, Gesellschafter, Beschäftigtenzahl | Kurze anwaltliche Freigabe |
| 05 | `recht/05-vertragsentwuerfe-partner.md` | Term Sheets: Binni (Alleinvertrieb), Planer-Provision, Kooperation Dolce Vita, Montage-Rahmenvertrag, Musterbrief Bildfreigabe | Eckpunkte, **nicht unterschriftsreif** | Binni-Firmendaten, Prüfberichte, Eigenmarke ja/nein, Planermodell | Kanzlei Vertriebs-/Kartellrecht AT + CH (KG, EntsG); Vertragsentwurf durch Kanzlei |
| 06 | `recht/06-gutschein-event-bewertung-bedingungen.md` | Mustertexte: Gutscheine, Events, Bewertungen, Ausstellungsstücke, Gewinnspiel, KI-Raumplaner, Upload-Checkboxen | Volltext-Entwürfe | ausgebende Gesellschaft, Café ja/nein, Raumplaner-Preis | Kanzlei Verbraucherrecht AT; Steuerberater (Gutschein-USt) |
| d14 | `digital/14-recht-compliance-digital.md` | Bauregeln F1–F17 mit Launch-Checklisten, Risiko-Matrix | Bauplan | teils überholt durch 02/06 (siehe W5, W9, W10) | – (wird durch diese Übersicht präzisiert) |

**Was noch fehlt (kein Entwurf vorhanden):**
- **Widerrufsbelehrung und Muster-Widerrufsformular** (Anhang I FAGG / Anlage 1, 2 zu Art. 246a EGBGB), in einer Fassung für Waren und einer für Dienstleistungen (Planung, Raumplaner). Pflicht für den Gutschein-Verkauf auf Distanz, den Atelierverkauf ohne Besichtigung und E-Mail-Aufträge.
- **Barrierefreiheitsinformation** nach § 14 BaFG für den Fall, dass die Kleinstunternehmen-Ausnahme nicht greift.
- **Übergangs-AGB für die MW GmbH** (W14).
- **Interne Arbeitsanweisungen:** Bestätigungsblatt Naturmaterial, Zustandsblatt Ausstellungsstück, Gesprächsleitfaden Dolce Vita mit Tabuthemen (Gebiete, Preise, Kunden).
- **Datenschutz-Folgenabschätzungen** (KI-Raumplaner, KI-Concierge) und Prüfung der Drittlandübermittlung (TIA) für US-Anbieter.
- **AVV-Ordner** mit den 24 Verträgen aus `recht/02` Abschnitt 5.

---

## 2. Widersprüche zwischen den Entwürfen und ihre Auflösung

Regel: Bei Widersprüchen gilt die Fassung in der Spalte „Gilt ab jetzt“. Die betroffenen Einzeldateien werden bei der Kanzleiprüfung entsprechend angepasst. Diese Datei ändert sie nicht.

| # | Thema | Fassung A | Fassung B | Gilt ab jetzt (mit Begründung) |
|---|---|---|---|---|
| **W1** | **Hausnummer** | 04: „vom Firmenbuch entschieden: Landstraße 11“ | 01, 02, 03, 06: „9 oder 11, vom Unternehmen auszufüllen“; Code, JSON-LD und Footer: 9 | **Rechtlich maßgeblich ist bis zu einer Änderung die Firmenbuchadresse (11).** In KW 44 die amtliche Adresse bei der Gemeinde Lochau bestätigen lassen. Ist es die 9: Änderung der Geschäftsanschrift im Firmenbuch beantragen und danach die Website unverändert lassen. Ist es die 11: Website, JSON-LD, Google-Profil und Herold auf 11 umstellen. Bis zur Klärung im Impressum die Firmenbuchadresse nennen (§ 5 Abs 1 Z 2 ECG, § 14 UGB). In allen Entwürfen gibt es nur einen Platzhalter, der zentral aus `src/lib/legal/company.js` kommt (04, Abschn. 5). |
| **W2** | **Name der Binni-Linie** | 26 und 05: Beispiel „Platzhirsch Cucina“ | 03 R-H2: kein italienisch klingender Name | **Kein „Cucina“ und kein italienisch klingender Name.** Die Linie steht im selben Showroom wie Minotti und Poliform, deshalb wäre die Irreführungsgefahr über die Herkunft hoch (§ 2 Abs 1 Z 2 UWG AT, § 5 Abs 2 Nr. 1 UWG DE). Der Name bleibt offen. Getrennt davon zu entscheiden ist, ob es eine **Eigenmarke** wird (dann ist Platzhirsch Hersteller nach GPSR und PHG) oder ob Binni als Hersteller auftritt und Platzhirsch nur Einführer ist (05, A.2). Pflichtformel in jedem Fall: „Gefertigt von unserem Manufakturpartner Binni in Kosovo“. |
| **W3** | **Befristung von Gutscheinen** | 03 R-P7: „Befristung kürzer nur sachlich gerechtfertigt“ | 01 § 15, 06, d14 F6, 23: unbefristet | **Gekaufte Gutscheine sind unbefristet.** Nur Gratis- und Aktionsgutscheine dürfen eine Frist haben (06, Punkt 9). R-P7 ist entsprechend zu lesen. Grund: OGH 7 Ob 22/12d. Außerdem hält „unbefristet“ in allen vier Ländern und muss nicht nach Art. 6 Rom-I geprüft werden. |
| **W4** | **Link zur OS-Plattform** | 06, Gutscheinbedingungen Punkt 11: „[Link, sofern noch vorgeschrieben]“ | 01 § 19.3, 04 Abschn. 2.6 und 9, d14: kein Link | **Kein Link, nirgends.** Die Plattform ist seit 20.07.2025 abgeschaltet (VO (EU) 2024/3228). Den Platzhalter in 06 streichen. Den Satz zur Schlichtung nach § 19 AStG aus 01 § 19.3 übernehmen. |
| **W5** | **Ist „Gutschein per Anfrage + Rechnung“ Fernabsatz?** | d14 F6 und digital/00 Abschn. 7 Nr. 6: „kein Fernabsatz-Checkout, keine Widerrufskette“ | 06 Punkt 8, 01 § 15.6, digital/00 Abschn. 11 F (Review): Fernabsatz | **Es ist Fernabsatz.** Der Vertrag kommt nur über Fernkommunikation zustande, über ein organisiertes System (Formular, Rechnung, PDF), § 3 Z 2 FAGG. Deshalb gilt: Informationen nach § 4 FAGG, Bestätigung auf dauerhaftem Datenträger (§ 7), **14 Tage Rücktrittsrecht**, solange der Gutschein nicht eingelöst ist, Widerrufsbelehrung und Muster-Formular in Bestätigungs-Mail und Rechnung. Ohne Belehrung verlängert sich die Frist um 12 Monate (§ 12 FAGG). Ob der **Widerrufsbutton** (§ 13a FAGG) schon bei einem Anfrageformular nötig ist, ist offen **[anwaltlich prüfen]**. Vorsichtige Lösung: eine einfache Seite „Vertrag widerrufen“ mit Formular, die kostet wenig. Auch die Atelier-Reservierung mit Anzahlung ohne Besichtigung ist Fernabsatz. Ausstellungsstücke sind **keine** Maßanfertigung. |
| **W6** | **Anzahlung und Zahlungsplan** | 01 § 5.1, Anmerkung und Kurzfassung: „nie mehr als 50 % vor Lieferung“ | 01 § 5.1, Tabelle: Maßanfertigung 40 % + 50 % „bei Lieferbereitschaft“, Standardware 30 % + 70 % „bei Lieferbereitschaft“ | **Höchstens 50 % bei Auftrag. Die nächste Rate ist erst bei Lieferung fällig (Zug um Zug), nicht schon bei der Anzeige der Lieferbereitschaft. Bei Küchen und Maßanfertigung werden die letzten 10 % nach der Montage fällig.** „Lieferbereitschaft“ heißt, dass die Ware noch beim Händler oder Hersteller steht. Damit liefen bis zu 90 % Vorleistung auf, und das bei negativem Eigenkapital. Das ist nach § 879 Abs 3 ABGB und § 307 BGB angreifbar und verträgt sich nicht mit der eigenen Kurzfassung. Ausnahme: CH und FL, wo nach 01 § 18.3 alles vor der Auslieferung kassiert wird. Dort gibt es keinen Eigentumsvorbehalt ohne Registereintrag (Art. 715 ZGB). In der Kurzfassung (Teil C Nr. 3) „30–40 %“ auf „30–50 % je nach Auftragsart“ angleichen. |
| **W7** | **Gewährleistung bei Ausstellungsstücken** | 01 § 14.3: Verkürzung auf 1 Jahr möglich, wenn im Einzelnen ausgehandelt | 06 Abschn. 4, d14 F5: bei Ausstellungsstücken keine Verkürzung, nur bei echter Gebrauchtware (Circle) | **Keine Verkürzung bei Ausstellungsstücken.** Ob ein Ausstellungsstück „gebraucht“ ist, bleibt unsicher, und eine Verkürzung, die nicht im Einzelnen ausgehandelt wurde, ist unwirksam (§ 10 Abs 4 VGG). Den Vorteil des Ausstellungsstücks bringt die **Zustandsbeschreibung mit gesonderter Zustimmung** (§ 6 Abs 1 Satz 2 VGG). In 01 § 14.3 den Satz „kann verkürzt werden“ durch „wir verkürzen nicht“ ersetzen. |
| **W8** | **Vergleichspreise im Outlet** | 03 R-P3: Bezugspreis ist der eigene frühere Preis, eine UVP nur, wenn sie wirklich besteht | 04 Abschn. 6, 06 Abschn. 4: wurde ein Stück nie zum Normalpreis angeboten, „UVP des Herstellers für Neuware“ mit Datum statt „statt“ | **Zusammengeführt:** (a) Wurde das Stück in den letzten 30 Tagen im selben Kanal angeboten, dann „Niedrigster Preis der letzten 30 Tage: … €“ (§ 9a PrAG, § 11 PAngV). (b) Sonst **kein** „statt“ und keine Prozentangabe. Erlaubt ist nur der sachliche Hinweis „Unverbindliche Preisempfehlung des Herstellers für Neuware: … € (Stand TT.MM.JJJJ)“, und nur wenn es diese UVP wirklich gibt und sie belegbar ist **[anwaltlich prüfen: UVP-Vergleich bei Ausstellungsware]**. (c) Die interne Preisregel „20–55 % nach Alter“ (23) dient nur der Kalkulation und wird nicht als Rabatt beworben. |
| **W9** | **Werkzeug für die Online-Terminbuchung** | digital/00 E7, d14 F8: „Cal.com Cloud mit EU-Region und AVV“ | 02 Befund 7: EU-Instanz `cal.eu` wird laut Drittquellen zum 01.11.2026 eingestellt | **Nicht mit der EU-Region von Cal.com planen,** bis Cal.com schriftlich etwas anderes bestätigt [prüfen]. Für den Start Mo 16.11. reicht eine Link-Variante. Wird ein US-Anbieter gewählt (Cal.com US, auch Google-Terminplanung), dann mit Prüfung von DPF bzw. SCC und Nennung in der Datenschutzerklärung. Das Swiss-US-DPF-Häkchen für CH-Kunden gesondert prüfen. Alternative mit EU-Daten: Microsoft Bookings, falls M365 mit EU Data Boundary vorhanden ist. Der Datenschutztext 02, Abschnitt 5.7 bleibt anbieterneutral, bis entschieden ist. |
| **W10** | **KI-Raumplaner: Speicherort und Löschfrist** | 06 Nutzungsbedingungen 1(2): „läuft auf unserem eigenen Rechner in Lochau, keine Übermittlung an KI-Cloud“, aber 6: „im EU-Speicher X“ | digital/00 W2-6: Upload in einen EU-S3-Speicher, KI-Werkstatt auf der RTX 4060; 02: Löschung „30 oder 90 Tage“ | **Ein Bild für alle Texte:** Der Upload landet verschlüsselt in einem **EU-Objektspeicher** [Anbieter vom Unternehmen auszufüllen, AVV nötig]. Die Bilder werden **lokal in Lochau** auf dem Team-Rechner berechnet, ohne KI-Cloud. Die Fotos werden **30 Tage** nach dem Versand gelöscht (06, d14). 02 wird von „30 oder 90“ auf 30 festgelegt. Der Team-Rechner braucht beschriebene technisch-organisatorische Maßnahmen (Verschlüsselung, Zugriff, automatische Löschung) **[anwaltlich prüfen im Rahmen der DSFA]**. |
| **W11** | **Zeitplan KI-Raumplaner** | d14 F14 / Masterkonzept: „frühestens 2028“ | digital/00 Welle 2 und 06: „Ihr Raum in 48 Stunden“ (manuell) ab Jan. 2027 | **Beides gilt, für zwei Stufen:** Stufe 1 ab Welle 2 als **manuelles Angebot** (das Team erzeugt die Bilder). Selbstbedienung frühestens 2028. Die **KI-Kennzeichnung (Art. 50 Abs 2 und 4 AI Act) gilt schon in Stufe 1.** Eine menschliche Prüfung befreit bei Bildern nicht davon (06, 6.1). |
| **W12** | **KI-Concierge: Anbieter** | d14 F9: EU-Anbieter oder lokales Modell auf der GPU | 02 Abschn. 3.3: lokal ungeeignet für den Kunden-Chat; Claude API direkt = USA; Empfehlung AWS Bedrock in der EU. Im Repo (Labs) ist `@anthropic-ai/sdk` installiert | **Produktion nur über einen Weg mit EU-Verarbeitung (Bedrock-EU-Inferenzprofil) oder offengelegt über die API direkt mit SCC und TIA.** Die Labs-Prototypen nutzen keine echten Kundendaten. Ein lokales Modell kommt für den öffentlichen Chat nicht in Frage. Dazu Ausgabefilter nach 03 R-M4: keine Zusagen zu Händlerstatus, Rabatten, Lieferterminen. Welche Modelle auf Bedrock in welcher EU-Region verfügbar sind, ist vor der Entscheidung zu prüfen [prüfen]. |
| **W13** | **Werbung an Bestandskunden (Newsletter, Bewertungsbitte, Event-Einladung)** | 02 V10: Rechtsgrundlage „Bestandskunden 6/1/f“ | d14 F17, 06: Ausnahme nach § 174 Abs 4 TKG nur, wenn **schon bei der Erhebung** ein Widerspruchshinweis gegeben wurde | **Für heutige Altkunden steht die Bestandskunden-Ausnahme in der Regel nicht zur Verfügung,** weil Formulare und Aufträge bisher keinen Widerspruchshinweis enthalten haben **[anwaltlich prüfen je Kanal]**. Deshalb: Bewertungsbitte per **QR-Karte und persönlich** (keine elektronische Post). Einladungen zum Adventsabend an Altkunden **per Post** oder nur an Kontakte mit Einwilligung. Ab sofort Widerspruchshinweis in Auftragsbestätigung und Formularen. Architekten und Makler sind Unternehmer, auch bei ihnen braucht E-Mail-Werbung eine Einwilligung (§ 174 Abs 3 TKG). |
| **W14** | **Wer verkauft vor Weihnachten?** (Gutscheine 16.11., Atelier KW 47, Adventsabend 26.11.) | 01 Kopf und Impressum Variante B: Handels-GmbH; 06 V1: „Gutscheine erst über die Gesellschaft verkaufen, die sie künftig einlöst“ | 23 und digital/00: Handels-GmbH wird erst nach Gate 0 beurkundet (bis 09.12.). Eintragung und UID folgen danach. Ware gehört bis zur Übertragung der MW GmbH (23, 5.5) | **Bis zur Eintragung der Handels-GmbH ist die MW Immobilienverwaltungs GmbH Vertragspartnerin.** Das betrifft Gutscheine, Atelierverkauf, Aufträge und den Adventsabend. Impressum Variante A und AGB in einer Übergangsfassung mit der MW GmbH. Bei Gutscheinen zwei Optionen, Entscheidung mit der Kanzlei bis KW 45: **(a)** Die MW GmbH gibt aus, und die Übernahme durch die Handels-GmbH wird im Übertragungsvertrag ausdrücklich geregelt (Wert der übernommenen Schuld bei der Bewertung berücksichtigen, Gläubigerschutz, Zustimmung der Bank) **[anwaltlich prüfen]**. **(b)** Der Verkauf startet erst mit der eingetragenen Handels-GmbH, dann entgeht vermutlich ein Teil des Weihnachtsgeschäfts (5–20 T€ laut 00 [Schätzung]). Bei beiden gilt Punkt 0.1 (Fortbestehensprognose, Kundengeld). Auf dem Gutschein steht der tatsächliche Aussteller. Das Wort „abgesichert“ wird nicht verwendet. |
| **W15** | **Gutschein im Café** | 01 § 15.1: Café optional | 06 V2: zwei getrennte Gutscheine; digital/00 E4: Mehrzweckgutschein, falls auch im Café einlösbar | **Zum Start zwei getrennte Gutscheine** („Einrichtung“ und „Café“) oder das Café ausdrücklich ausnehmen (06, Variante A). Ein Gutschein für beide Bereiche wäre ein Mehrzweckgutschein mit zwei Steuersätzen. Nach der Ausgliederung bräuchte er außerdem eine Abrechnung zwischen zwei Gesellschaften **[Steuerberater]**. |

**Kleinere Abweichungen, nur zur Kenntnis:**
- **Gerichtsstand B2B:** 01 § 28 nennt „BG Bregenz bzw. LG Feldkirch“, 05 nennt „Feldkirch“. Sachlich zuständig ist für Lochau je nach Streitwert das BG Bregenz oder das LG Feldkirch **[anwaltlich prüfen]**. In allen Verträgen einheitlich „das sachlich zuständige Gericht für 6911 Lochau“ schreiben.
- **Gewährleistungsfrist bei Einbauküchen:** 01 nennt 2 Jahre (VGG). 05 weist auf 3 Jahre für unbewegliche Sachen (§ 933 ABGB) und 5 Jahre in CH hin (Art. 210 Abs 2 OR). Wann eine fest verbaute Küche als unbewegliche Sache gilt, ist **[anwaltlich prüfen]**. Den Regress mit Binni so lange vereinbaren, dass der längste Fall gedeckt ist (05: mindestens 3, bis 5,5 Jahre). Das ist schon so vorgesehen.
- **Newsletter-Einwilligungen bei der Ausgliederung:** 02 Befund 10 spricht von einer Gesamtrechtsnachfolge nach dem Spaltungsgesetz. 23 plant aber einen **Übertragungsvertrag zu Marktwerten**. Das wäre eine Einzelrechtsnachfolge, bei der Einwilligungen vermutlich nicht automatisch übergehen **[anwaltlich prüfen]**. Der Weg der Ausgliederung (Spaltung, Einbringung oder Kauf) entscheidet also auch über die Übernahme des Newsletters und des Kundenstamms.
- **Dolce-Vita-Gespräch:** 23 legt das Gespräch auf den Adventsabend (26.11.), 05 verlangt einen Leitfaden mit Anwalt „vor 26.11.“. Das Gespräch findet **nicht** zwischen Gästen am Abend statt, sondern als eigener Termin mit Leitfaden und Protokoll (05, C.4: schon ein mündliches „Wir kommen uns nicht in die Quere“ wäre ein Kartellverstoß).

---

## 3. Sofort, unabhängig von jedem Feature (KW 44–45)

| # | Maßnahme | Quelle | Wer |
|---|---|---|---|
| S1 | Insolvenz-/Gesellschaftsrechtler und Steuerberater beauftragen (bis 30.10.). Erste Frage: Dürfen Gutscheine und Anzahlungen angenommen werden, solange die Fortbestehensprognose fehlt? | 0.1; 23 Entscheidung 1 | GF |
| S2 | Händlertexte im Backoffice (`dealers_description_*`, 4 Sprachen) auf die Standardformel R-M2 umstellen, außer ClassiCon. Übergangsweise im Code nur eine Allowlist ausgeben | 03 Prio 1 | Backoffice + Dev |
| S3 | Repo-Stand Markentitel und `llms.txt` deployen | 03 Prio 1 | Dev |
| S4 | News „Lagerabverkauf“ und „Sortimentswechsel“ depublizieren. Superlative („größte …“) und pauschale Nachhaltigkeitsaussagen streichen. Trust-Leiste auf „AT · DE/CH/FL auf Anfrage“ ändern | 03 Prio 1–2 | Backoffice + Text |
| S5 | Datenschutzerklärung (Privacy Shield, TKG 2003, GA-Rechtsgrundlage, 26 Monate, Newsletter-Felder) und Banner-Texte C1–C5 korrigieren, ein Hinweis unter jedem Formular | 02 Abschn. 1, 3.2, 4 | Dev nach Kanzlei-Kurzfreigabe |
| S6 | Impressum ergänzen: WKO, GewO-Link, Offenlegung § 25 MedienG, „Landesgericht Feldkirch“, Adresse nach W1. Impressums-Links in Instagram, Facebook und LinkedIn | 04 Abschn. 5, 7 | Dev + GF |
| S7 | Postfach `datenschutz@platzhirsch.studio` anlegen und eine zuständige Person benennen | 02 Abschn. 9 | GF |

---

## 4. „Vor Launch zwingend“ je Feature

Legende: **Muss** = ohne diesen Punkt nicht starten. **Soll** = kurz nach dem Start nachziehen. Zeitangaben aus digital/00 und 23.

### 4.1 Gutschein-Shop (Welle 1: Anfrage + Rechnung ab Mo 16.11.; Welle 2: Stripe)

| Muss | Quelle |
|---|---|
| Freigabe der Kanzlei zu Kundengeld und Fortbestehensprognose (0.1) und Entscheidung, wer ausgibt (W14) | 06 V1 |
| Gutscheinbedingungen 06/1.2: unbefristet, Teileinlösung, keine Gebühren, Ersatz bei Verlust für registrierte Codes, OS-Link gestrichen (W4) | 06, W3 |
| Widerrufsbelehrung + Muster-Formular in Bestätigungs-Mail und Rechnung, Informationen nach § 4 FAGG, Seite „Vertrag widerrufen“ (W5) | 01 § 7, W5 |
| Codes, die man nicht erraten kann (mind. 12 Zeichen), und ein Einlöse-Register (Sheet oder Backoffice), damit kein Gutschein doppelt eingelöst wird | 06 1.3, d14 F6 |
| Steuerberater: Einzweck- oder Mehrzweckgutschein, Café getrennt (W15), Rückstellung für die offene Gutscheinschuld | 06 V2 |
| Pflichtangaben auf jedem PDF (Aussteller mit FN, „gültig ohne Ablaufdatum“, Kurzfassung) | 06 1.3 |
| **Zusätzlich für Welle 2 (Stripe):** Bestellbutton „zahlungspflichtig bestellen“, Widerrufsbutton § 13a FAGG, AVV/Datenschutzabschnitt Stripe, BaFG-Prüfung (Kleinstunternehmen ja/nein, sonst Barrierefreiheitsinformation § 14 BaFG und barrierefreier Checkout) | d14 F5, F10; 04 Abschn. 3 |
| Soll: Rabatt-Gutscheinaktionen („100 € für 90 €“) erst nach anwaltlicher Prüfung | 06 1.4 |

### 4.2 Outlet / Atelierverkauf (Welle 1: Reservierungsanfrage ab KW 47; Welle 2: Anzahlung online)

| Muss | Quelle |
|---|---|
| Verkäufer ist die Eigentümerin der Ware (bis zur Übertragung die MW GmbH). Rechnung, AGB-Übergangsfassung und Impressum passen dazu | 06 4.1, 01 § 14.6, W14 |
| Je Stück eine Zustandsbeschreibung mit Fotos und **gesonderter** Zustimmung (Unterschrift oder eigene, nicht vorausgewählte Checkbox) | 06 4.2, § 6 Abs 1 S 2 VGG |
| Volle Gewährleistung von 2 Jahren, keine Verkürzung (W7). Kein „gekauft wie gesehen“, kein „wie neu“ bei Spuren | 06 4.1/4.3 |
| Preise als Endpreis inkl. USt. Vergleichspreise nur nach W8, kein „bis zu −55 %“ | 03 R-P1–P5, W8 |
| Reservierung mit Anzahlung ohne Besichtigung ist Fernabsatz: Belehrung, 14 Tage, Kostenschätzung für die Rücksendung sperriger Ware (§ 15 FAGG) | 06 4.2 Nr. 6, W5 |
| Keine Händler-Formulierung („Minotti-Ausstellungsstück aus unserem Showroom in Lochau“) | 03 R-M2 |
| GPSR-Angaben (Hersteller mit Anschrift, Warnhinweise) je Artikel bei Online-Angebot | d14 F5 |
| Soll: CH-Käufer: Ausfuhrweg A/B nach 01 § 18, Zahlung vor Auslieferung | 01 § 18 |

### 4.3 Tracking und Ads (Google Ads ab Q1 2027, Meta optional)

| Muss | Quelle |
|---|---|
| Banner C1–C16 umgesetzt, darunter: kein „berechtigtes Interesse“, kein pauschaler Art. 49, GTM-Eintrag weg, Banner-Version, **serverseitiges Consent-Protokoll** ohne IP | 02 Abschn. 4 |
| Kein Advanced Consent Mode, gclid/UTM nur mit Ads-Einwilligung an das Backoffice | 02 C13, d14 F13 |
| Enhanced Conversions und Hash-Abgleich nur mit `ad_user_data: granted` und eigenem Datenschutzabschnitt. **Keine Kundenlisten-Uploads** ohne Einwilligung | 02 3.4 |
| Meta Pixel nur, wenn entschieden, dann Controller Addendum (Art. 26 DSGVO), eigener Banner-Eintrag, CAPI mit demselben Consent | 02 Befund 8, C8 |
| Anzeigentexte, Feeds und Sitelinks durchlaufen das Claims-Register (keine Händler-, Superlativ- oder Rabattaussagen ohne Beleg). Herstellerbilder in Ads nur mit Eintrag im Bildrechte-Register | 03 R-X1, d14 F3 |
| Soll: Ads-Konto, Merchant Center und Werbekonten nach der Ausgliederung auf die Handels-GmbH umschreiben | 04 Abschn. 4 |

### 4.4 Newsletter (Brevo)

| Muss | Quelle |
|---|---|
| Double-Opt-in mit Protokoll (Zeit, IP oder Bestätigungsnachweis, Text der Einwilligung), Einwilligungstext mit Inhalten und Häufigkeit | 02 3.2, d14 F17 |
| Abmeldelink in jeder Mail. Fußzeile mit den Angaben nach § 24 Abs 3 MedienG und § 14 UGB | 04 Abschn. 7 |
| AVV Brevo, Datenschutzabschnitt nur mit tatsächlich erhobenen Feldern (keine Geburtstags- oder PLZ-Felder, solange sie nicht abgefragt werden) | 02 D8 |
| Keine Massenmail an Altkunden ohne Einwilligung (W13). Rabatt im Newsletter nur bewerben, wenn es ihn gibt | W13, 03 Prio 2 |
| Vor der Ausgliederung klären, ob die Einwilligungen übergehen (Abschnitt 2, kleinere Abweichungen) | 02 Befund 10 |

### 4.5 Online-Terminbuchung (und Video-Beratung)

| Muss | Quelle |
|---|---|
| Anbieter entschieden (W9), AVV, Drittland-Garantie (DPF/SCC, Swiss-US-DPF) geprüft, Abschnitt in der Datenschutzerklärung | 02 5.7, W9 |
| Einbettung lädt erst nach Klick (`ConsentEmbed`) mit eigenem Banner-Eintrag (C9), Link-Variante ohne Einbettung als Fallback | 02 C9, d14 F8 |
| Erinnerungs-Mails nur zum Termin, keine Werbung | d14 F8 |
| BaFG: Die Buchung einer Dienstleistung kann den Anwendungsbereich auslösen. Entscheidung „Kleinstunternehmen ja/nein“ dokumentieren | 04 Abschn. 3 |
| Video: keine Aufzeichnung, Hinweis auf den Blick in Privaträume, Anbieter mit AVV | 02 5.8 |

### 4.6 KI-Concierge (Welle 3, Beta)

| Muss | Quelle |
|---|---|
| Hinweis vor der ersten Eingabe: „KI-Assistent, Antworten können Fehler enthalten, unverbindlich, keine sensiblen Daten“ (Art. 50 Abs 1 AI Act, gilt seit 02.08.2026) | 02 3.2, d14 F9 |
| Anbieter nach W12, AVV, keine Nutzung zum Training, Chatprotokolle 30 Tage mit Löschjob | 02 3.3 |
| System-Prompt und Ausgabefilter: keine Zusagen zu Händlerstatus, Preisen, Rabatten, Lieferterminen, keine Superlative. Test mit 50 kritischen Fragen | 03 R-M4, d14 F9 |
| DSFA (empfohlen, ob Pflicht: [anwaltlich prüfen]), Eingaben vor dem Versand auf E-Mail, Telefonnummer und IBAN prüfen und maskieren | 02 Abschn. 7 |
| Übergabe an einen Menschen (Termin, Anfrage) jederzeit möglich | d14 F9 |

### 4.7 KI-Raumplaner „Ihr Raum in 48 Stunden“ (Stufe 1 manuell ab Welle 2)

| Muss | Quelle |
|---|---|
| Sichtbares Etikett **und** C2PA/IPTC auf jedem Bild und PDF (Art. 50 Abs 2/4 AI Act), auch in Stufe 1 (W11) | 06 6.2 Nr. 3, d14 F14 |
| Nutzungsbedingungen 06/6.2 mit Speicherort nach W10, Upload-Checkboxen 06/6.3 getrennt, keine vorausgewählt. Training nur mit gesonderter Einwilligung, Empfehlung: Option in Stufe 1 weglassen | 06, 02 3.2 |
| DSFA vor dem Start, EXIF/GPS beim Upload entfernen, automatische Löschung nach 30 Tagen | 02 Abschn. 7, d14 F14 |
| Lizenz des Modells für kommerzielle Nutzung geprüft. Herstellerbilder als KI-Input nur mit Freigabe der Marke | d14 F3/F14, 05 E |
| Bei 149 €: Fernabsatz-Dienstleistung mit Rücktrittsrecht, Bestätigung für den Sofortbeginn, anteiliges Entgelt (§§ 16, 18 FAGG) | 06 6.1 |
| DSA: Ob die kurzfristige Speicherung der Kundenfotos schon „Hosting“ ist, prüfen. Falls ja: Kontaktstellen nach Art. 11/12 und Meldeweg nach Art. 16 | 04 Abschn. 2.5 |

### 4.8 Binni-Import (Pilot Q1 2027)

| Muss | Quelle |
|---|---|
| Rollenentscheidung Eigenmarke (Hersteller) oder Binni-Marke (Platzhirsch als Einführer). Name ohne italienischen Klang (W2) | 05 A.2, 03 R-H2 |
| Vertrag durch die Kanzlei: Exklusivität nur gegen **aktive** Verkäufe (Vertikal-GVO Art. 4 lit. b; CH Gaba/Elmex), keine Mindestabnahme in Geld, Regress mindestens 3 Jahre, Ersatzteile, Produkthaftpflicht von Binni mit Mitversicherung, Rechte an Bildern und Daten inkl. KI-Nutzung, CISG-Entscheidung, Schiedsklausel VIAC | 05 A |
| Nachweise vor der ersten Bestellung: Formaldehyd 0,062 mg/m³ (REACH Anhang XVII Eintrag 77, seit 06.08.2026), EN 14749, Steindatenblätter, Lebensmittelkontakt, CE bei Elektrik | 05 A.2 |
| GPSR-Pflichten des Einführers: Name und Postanschrift von Platzhirsch auf Produkt oder Begleitdokument, Anleitung auf Deutsch, Rückverfolgbarkeit | 05 A.2 |
| EUDR-Status klären (vermutlich ab 30.12.2026 für Holzmöbel) [prüfen]. Erste Bestellung zeitlich darauf abstimmen | 05 A.2 |
| Präferenzursprungsnachweis (SAA EU–Kosovo) je Sendung, Zollspediteur | 26 5.2 |
| Datenweitergabe an Binni nur, wenn nötig (Kosovo ohne Angemessenheitsbeschluss → SCC) | 02 Abschn. 5 |
| Werbung: „Gefertigt von unserem Manufakturpartner Binni in Kosovo“, Steinherkunft gesondert, „ab“-Preis nur mit beschriebener Beispielkonfiguration, kein „Made in EU“ | 03 R-H1–H6, R-P6 |
| AGB: Bestätigungsblatt Naturstein, Freigabe der konkreten Platte (Slab) vor dem Zuschnitt | 01 § 13, 05 A.2 |
| Ab 09.12.2026 gilt das neue Produkthaftungsrecht. Eigene Versicherung anpassen | 05 A.2 |

### 4.9 Schweiz- und FL-Lieferung

| Muss | Quelle |
|---|---|
| Lieferweg A (Abholung mit U34) und B (DAP, Kunde ist Importeur) mit Texten, die der Steuerberater bzw. Zollspediteur geprüft hat. Weg C (DDP, Franken-Festpreis) erst nach ESTV-Registrierung und Gate 2 | 01 § 18, 23 Entscheidung 13 |
| Zahlung vor Auslieferung (Art. 715 ZGB), Hinweis auf den Verbraucherschutz im Wohnsitzland (Art. 120 IPRG [anwaltlich prüfen]) | 01 § 11.3, § 18 |
| CHF-Rechner als „unverbindliche Kostenschätzung“, MWST 8,1 % datiert, keine „steuerfrei“- oder Sparversprechen. Prüfen, ob die PBV für einen AT-Anbieter gilt **[CH-Kanzlei]** | 03 R-P1, d14 F7 |
| Montage: Meldung über EasyGov mit 8 Tagen Vorlauf, Nachweise der Subunternehmer zu Mindestlöhnen vor jedem Einsatz (Art. 5 EntsG), Rahmenvertrag Montage nach 05 D | 05 D |
| Datenschutzerklärung mit CH-Abschnitt (Staaten nennen, Art. 19 revDSG), Swiss-US-DPF bei US-Anbietern | 02 Abschn. 8 |
| Trust-Leiste und Regionsseiten versprechen nur, was es wirklich gibt („auf Anfrage“), bis der Prozess steht | 03 R-L1 |

### 4.10 Events (Adventsabend 26.11., Platzhirsch Tafel ab 2027)

| Muss | Quelle |
|---|---|
| Veranstalter festgelegt. Am 26.11. ist es die MW GmbH (Café und Showroom in einer Gesellschaft, W14). Ab 2027 regelt eine Kooperationsvereinbarung mit dem Café | 06 2.1 |
| Foto-Aushang am Eingang, Formular zur Foto-Einwilligung (Porträts, Kinder, Werbung) gedruckt, Möglichkeit, nicht fotografiert zu werden (z. B. Band) | 06 2.2, 2.3 |
| Einladungen an Altkunden per Post oder nur an Kontakte mit Einwilligung (W13) | W13 |
| Allergeninformation (LMIV), Jugendschutz Vorarlberg, Verkehrssicherung (Kerzen, Glas, Stufen), Haftpflicht prüfen | 06 2.1 |
| Kein Gewinnspiel und keine Tombola mit Losverkauf (Glücksspiel), Empfehlung: vorerst gar kein Gewinnspiel | 06 5.1 |
| Bezahlte Tafel: Teilnahmebedingungen mit fairer Stornostaffel (kein gesetzliches Rücktrittsrecht nach § 18 Abs 1 Z 10 FAGG) | 06 2.2 |
| Am Abend keine Gespräche mit Dolce Vita über Gebiete oder Preise | 05 C.4 |

---

## 5. Fragen an eine echte Anwältin / einen echten Anwalt

Empfehlung: **ein federführendes Mandat in Österreich** (Wirtschafts-, Konsumenten-, IT-/Datenschutz- und Kartellrecht, idealerweise mit Insolvenzerfahrung), dazu eine **CH-Kanzlei** für Einzelfragen und eine **DE-Gegenprüfung** der AGB. Die Fragen sind nach Dringlichkeit sortiert.

### 5.1 Sofort (vor 16.11.2026)
1. **Kundengeld in der Krise:** Darf die MW GmbH bei −2,67 Mio. € Eigenkapital vor der dokumentierten Fortbestehensprognose Gutscheine verkaufen und Anzahlungen annehmen? Welche Pflichten hat die Geschäftsführung (§ 69 IO, Haftung, strafrechtliche Risiken)? Braucht es ein Treuhandkonto oder eine Anzahlungsgarantie?
2. **Gutscheine vor der Ausgliederung (W14):** Ausgabe durch die MW GmbH mit Übernahme im Übertragungsvertrag oder Start erst mit der Handels-GmbH? Wie wird die Übernahme bewertet, und braucht es die Zustimmung der Bank oder der Gläubiger?
3. **Ausgliederung:** Spaltung, Einbringung oder Kauf von Einzelteilen? Was folgt daraus für Altaufträge, Altgutscheine, Kundenstamm, Newsletter-Einwilligungen (Art. 6 DSGVO, § 174 TKG), Domain und Werbekonten?
4. **Fernabsatz bei Anfrage + Rechnung (W5):** Bestätigen, dass das Fernabsatz ist. Ist ein Widerrufsbutton nach § 13a FAGG schon bei einem Bestell- oder Anfrageformular Pflicht? Widerrufsbelehrung für Gutscheine und Atelierverkauf erstellen.
5. **Gutscheinbedingungen 06/1.2 freigeben:** Ausschluss des Gutscheinkaufs mit Gutscheinen, Verbot des Weiterverkaufs, Haftung vor einer Sperrmeldung.
6. **Impressum Variante A und Datenschutz-Sofortkorrekturen** kurz freigeben, Offenlegung § 25 MedienG: kleine oder große Fassung?
7. **Dolce Vita:** Gesprächsleitfaden (Tabuthemen, Protokoll, NDA ohne Preisdaten), zulässige Modelle Agentur, Lead-Provision, gemeinsamer Einkauf. Wann wird die Zustimmung von Minotti und Poliform gebraucht?
8. **Event-Fotos:** Reicht für Übersichtsbilder ein Hinweis mit Widerspruchsmöglichkeit (Art. 6 Abs 1 lit f DSGVO, § 78 UrhG)?

### 5.2 Vor Welle 2 (Jan.–Apr. 2027)
9. **AGB 01:** Fernabsatz nach dem Showroom-Besuch (E-Mail-Annahme), Höhe und Staffel der Stornopauschale (25 %), Zahlungsplan nach W6 (§ 879 Abs 3 ABGB, § 307 BGB), Haftung für leichte Fahrlässigkeit (AT und DE), Nummerierung im KSchG nach der Novelle 2026, Eigentumsvorbehalt bei Einbauküchen, B2B-Gewährleistung und Regress bei Bauträgern (§ 933b ABGB).
10. **Gewährleistung bei Einbauküchen:** 2 Jahre (VGG) oder 3 Jahre (unbewegliche Sache)? Gilt die Verlängerung nach § 10 Abs 2a VGG auch bei Montageleistung?
11. **Outlet-Preisangaben (W8):** Ist ein UVP-Hinweis bei Ausstellungsware zulässig? Gilt das 30-Tage-Tiefstpreis-System getrennt je Kanal?
12. **Datenschutz 02:** Freigabe der Erklärung, Prüfung der Drittlandübermittlung (TIA) für US-Anbieter, Umgang mit Meta (Art. 26), Hash-Abgleich, Notwendigkeit von DSFAs, Speicherfristen.
13. **BaFG:** Wie wird die Kleinstunternehmen-Ausnahme bei der Handels-GmbH gerechnet (Jahresarbeitseinheiten, verbundene Unternehmen)? Wird das BaFG schon durch das Kontaktformular ausgelöst?
14. **EmpCo / Green Claims:** Stand der österreichischen Umsetzung, zulässige konkrete Umweltaussagen mit Herstellerbeleg.
15. **Planer-Provision:** Welches der drei Modelle (05 B.2) trägt bei Hotels und Bauträgern sicher gegen § 309 StGB AT und § 299 StGB DE?

### 5.3 Vor Binni, KI und Schweiz
16. **Binni:** Vertrag entwerfen. CISG ausschließen oder nicht? Durchsetzbarkeit eines VIAC-Schiedsspruchs im Kosovo, Ausgleichsanspruch analog § 24 HVertrG, Herstellerrolle bei Eigenmarke (GPSR Art. 3, § 3 PHG), EUDR-Pflicht ab 30.12.2026.
17. **AI Act:** Ist Platzhirsch beim Raumplaner Anbieter (Art. 50 Abs 2) oder nur Betreiber (Abs 4)? Ist das Raumbild des Kunden ein Deepfake? Ist die kurzfristige Fotospeicherung ein Hostingdienst nach DSA?
18. **KI-Concierge:** Haftung für Antworten des Bots (Zusagen, Preise). Reichen Hinweis und Ausgabefilter?
19. **CH-Kanzlei:** Art. 120 IPRG (Rechtswahl bei Konsumentenverträgen), Anwendbarkeit der PBV auf einen AT-Anbieter, Gebietsklauseln mit Binni nach Art. 5 Abs 4 KG, Sorgfaltsnachweis nach Art. 5 EntsG, Eintragung des Eigentumsvorbehalts, Haftung der Geschäftsführung nach Art. 60 ff. revDSG.
20. **FL:** Zuständigkeit und Vollstreckung ohne LugÜ, Schiedsklausel für B2B.
21. **DE-Gegenprüfung:** AGB nach §§ 305–310 BGB, Pflicht nach § 36 VSBG für einen AT-Unternehmer, PAngV neben PrAG, Handwerksrolle bei Küchenmontage in DE.

---

## 6. Fragen an den Steuerberater

1. **Gutscheine:** Einzweck- oder Mehrzweckgutschein (§ 4 Abs 3a–3c UStG AT, bei DE-Kunden § 3 Abs 13–15 UStG DE), getrennter Café-Gutschein, Rückstellung bzw. Verbindlichkeit für unbefristete Gutscheine, Behandlung bei der Ausgliederung.
2. **Ausgliederung:** Bewertung zu Marktwerten (Ware, Kundenstamm, Marke, übernommene Gutscheinschuld), UmgrStG oder Kauf, Marktmiete für den Showroom per Gutachten, UiS-Prüfung bei verbundenen Unternehmen (aws).
3. **Atelierverkauf:** Wem gehört der Erlös, Rechnungsaussteller, Registrierkasse und Belegpflicht im Showroom.
4. **DE-Lieferungen:** OSS bei loser Ware, **DE-USt-Registrierung für Küchen mit Montage** (Werklieferung), Meldepflichten für Monteure.
5. **CH/FL:** Ausfuhrnachweis U34, Fristen, ESTV-Registrierung und Steuervertretung für Weg C, Sicherheitsleistung, FL-Sonderfälle, Text des CHF-Rechners.
6. **Binni-Import:** Einfuhrumsatzsteuer, Präferenzursprung (SAA EU–Kosovo), Zollspediteur, Kosten der EUDR-Sorgfaltspflicht.
7. **Raumplaner-Pauschale 149 €, anrechenbar:** Behandlung bei späterer Anrechnung auf einen Kauf.
8. **Circle/Inzahlungnahme (später):** Differenzbesteuerung nach § 24 UStG.
9. **Events:** Steuersätze Tafel (Speisen 10 %, Getränke 20 %), Veranstalter und Rechnungsaussteller.
10. **Kreditvermittlung:** Braucht der Händler für die Kundenfinanzierung eine Gewerbeberechtigung (§ 136a GewO)? Klärung gemeinsam mit Bank und Anwalt.

---

## 7. Geschätzte Beratungskosten [Schätzung]

**Herleitung:** Die Stundensätze sind eigene Annahmen, **nicht** mit aktuellen Quellen verifiziert, weil das Web-Suchkontingent erschöpft war. Angenommen sind für AT-Wirtschaftskanzleien in Westösterreich 250–450 € netto je Stunde, für CH-Kanzleien 300–500 CHF und für Steuerberatung 150–250 €. Die Stunden sind geschätzt nach Umfang der Entwürfe und angenommen, dass die Kanzlei die vorhandenen Entwürfe prüft statt neu zu schreiben. **Vor Mandatserteilung Pauschal- oder Deckelangebote einholen.** Zu prüfen sind auch kostenlose Erstauskünfte bei der Rechtsanwaltskammer Vorarlberg und das WKO-Gründerservice für die Handels-GmbH [prüfen].

| Paket | Inhalt | Stunden [Schätzung] | Kosten netto [Schätzung] | Wann |
|---|---|---|---|---|
| P1 Krise und Kundengeld | Fragen 5.1 Nr. 1–3 (Teil des Sanierungsmandats, Abgrenzung zum Budget in 23) | 6–12 | 1,5–5,4 T€ | KW 44 |
| P2 Gutscheine + Widerruf | 06/1, Widerrufsbelehrung, Muster-Formular, W5 | 5–10 | 1,3–4,5 T€ | bis 13.11. |
| P3 Impressum + Datenschutz-Sofortkorrektur | 04 Variante A, 02 Abschn. 1/4 | 4–8 | 1,0–3,6 T€ | KW 45 |
| P4 Dolce-Vita-Leitfaden | 05 C, Kartellrecht | 3–6 | 0,8–2,7 T€ | vor 26.11. |
| P5 Events + Bewertungen | 06/2, 06/3 | 2–4 | 0,5–1,8 T€ | KW 46–47 |
| **Zwischensumme bis Ende November** | | **20–40** | **ca. 5–18 T€** | |
| P6 AGB vollständig (AT) | 01 inkl. Teil II, W6/W7 | 8–16 | 2,0–7,2 T€ | Dez.–Jan. |
| P7 Datenschutz vollständig | 02, AVV-Prüfung, VVZ, DSFA Raumplaner + Concierge, TIA | 12–24 | 3,0–10,8 T€ | Jan.–März |
| P8 Outlet-, Preis- und UWG-Regeln | 03 Regeln, W8, EmpCo | 4–8 | 1,0–3,6 T€ | Jan. |
| P9 KI-Raumplaner-Bedingungen + AI Act | 06/6, Fragen 17–18 | 4–8 | 1,0–3,6 T€ | vor Welle 2 |
| P10 Binni-Vertrag | Entwurf aus Term Sheet 05 A, Kartell, CISG, Schiedsklausel | 15–30 | 3,8–13,5 T€ | Q1 2027 |
| P11 Planer- + Montage-Rahmenvertrag | 05 B, D | 6–12 | 1,5–5,4 T€ | Q1 2027 |
| P12 DE-Gegenprüfung AGB | §§ 305 ff. BGB, VSBG, PAngV | 3–6 | 0,8–2,7 T€ | mit P6 |
| **Summe Kanzlei AT/DE** | | **ca. 72–144** | **ca. 18–65 T€** | |
| P13 CH-Kanzlei | Fragen 19–20 | 6–12 | 1,8–6,0 T CHF | Q1 2027 |
| P14 Steuerberater (nur Rechtspaket) | Abschnitt 6, ohne Jahresabschluss und Sanierung | 10–20 | 1,5–5,0 T€ | laufend |
| **Gesamt** | | | **ca. 22–76 T€** (CHF zum Kurs von etwa 1:1 überschlagen) | |

**So lassen sich die Kosten senken:**
- Alle sechs Entwürfe **in einem Paket** übergeben, mit dieser Übersicht als Mandatsbrief. Das spart Einarbeitung.
- Prüfen lassen statt neu schreiben, und Festpreise je Paket vereinbaren.
- P10 bis P13 erst nach Gate 1 (Feb. 2027) beauftragen, wenn feststeht, dass Binni und die Schweiz kommen.
- Für die laufende Pflege von AGB, Widerruf und Datenschutz einen Rechtstexte-Dienst mit AT-Fokus und Update-Service prüfen (d14 5.3), Anbieter [prüfen].

---

## 8. Entscheidungen und Lieferungen des Inhabers (konsolidiert aus 01–06)

| # | Punkt | Betrifft | Bis |
|---|---|---|---|
| 1 | Amtliche Hausnummer bei der Gemeinde bestätigen, danach Firmenbuch oder Website angleichen (W1) | alle | KW 44 |
| 2 | Kanzlei(en) und Steuerberater beauftragen, P1–P5 freigeben | alle | 30.10. |
| 3 | Aussteller der Gutscheine und Verkäufer im Atelierverkauf (W14), Café getrennt ja/nein (W15) | 01, 06 | KW 45 |
| 4 | Backoffice-Zugang oder zuständige Person für die Bereinigung der Händlertexte in 4 Sprachen | 03 | sofort |
| 5 | Bezugsweg und Vertragsstatus je Marke. Welche Marken stehen wirklich im Showroom, auf wie vielen m²? | 03, 01 § 8.4 | Gate 0 |
| 6 | GISA- und WKO-Auszug, Gesellschafter und Anteile, Beschäftigte zum 31.12.2025, Umsatz und Bilanzsumme (BaFG, VSBG) | 04 | KW 45 |
| 7 | Schlichtung ja/nein (§ 19 AStG) | 01, 04, 06 | vor Shop |
| 8 | Hoster von Website und Backoffice, GA4-Einstellungen, E-Mail-Anbieter, Liste der Partner (Spediteure, Montage, Fotografen, Binni) | 02 | KW 45 |
| 9 | Termin-Werkzeug (W9), KI-Anbieter (W12), Meta Pixel ja/nein | 02 | vor jeweiligem Feature |
| 10 | Zahlungsplan je Warengruppe nach W6, Anzahlungsgarantie ja/nein, Stornokosten der Hersteller schriftlich | 01 | vor AGB-Freigabe |
| 11 | Preisliste für Anfahrt, Montage, Lagergeld, Planungspauschale, Rücksendekosten sperriger Ware | 01, 06 | vor AGB-Freigabe |
| 12 | Liefergebiet heute (AT/DE/CH/FL), Montagepartner mit Nachweisen | 03, 05 | vor CH-Seite |
| 13 | Binni: Firmendaten, Prüfberichte, Versicherung, Eigenmarke ja/nein, Name (W2), Steinherkunft | 05, 03 | vor Term Sheet |
| 14 | Planermodell (1/2/3), bestehende Absprachen mit Architekten offenlegen | 05 | vor vai-Start KW 46 |
| 15 | Raumplaner kostenlos oder 149 €, Modell und Lizenz, Speicheranbieter (W10) | 06 | Jan. 2027 |
| 16 | Zustandsfotos und Beschreibungen aus der Inventur, Foto-Aushang für den 26.11. | 06 | KW 46–47 |
| 17 | Gewinnspiel: vorerst nein (Empfehlung) | 06 | – |

---

## 9. Auf keinen Fall

- Keine Anzahlungen und keine Gutscheine ohne Freigabe zu Punkt 0.1. Kein „Ihre Anzahlung ist abgesichert“ ohne echte Garantie.
- Kein „Händler“, „offiziell“, „autorisiert“ oder „Partner“ außer bei ClassiCon. Das gilt auch für Backoffice-Texte, Ads, KI-Concierge und Social-Media-Bios.
- Keine „statt“-Preise ohne 30-Tage-Tiefstpreis, kein „bis zu −60 %“, keine Countdown-Timer.
- Kein OS-Plattform-Link, keine befristeten Kaufgutscheine, keine Verkürzung der Gewährleistung bei Ausstellungsstücken.
- Kein italienisch klingender Name für die Binni-Linie, kein „Made in EU“.
- Keine Gebiets-, Preis- oder Kundenabsprachen mit Dolce Vita, auch nicht mündlich am Rande eines Events.
- Kein Tracking ohne Einwilligung, kein Advanced Consent Mode, keine Kundenlisten-Uploads zu Google oder Meta ohne Einwilligung.
- Keine KI-Bilder ohne Etikett, keine Kundenfotos fürs Training ohne gesonderte Einwilligung.
- Kein Rechtstext live ohne anwaltliche Freigabe. Alle Dateien in `recht/` sind Entwürfe.

---

**Prüfvermerk (26.10.2026, Bericht 28 – skeptische Prüfung):** Eine Stichprobe von Normen wurde an der Quelle geprüft (RIS, gesetze-im-internet). Sie ist korrekt zitiert: § 69 IO, § 13a FAGG, § 3 Z 2 FAGG, § 12 FAGG, § 18 Abs 1 Z 10 FAGG, § 356a BGB, § 174 Abs 3 und 4 TKG 2021, § 9a PrAG, § 6 Abs 1 Satz 2 VGG, § 10 Abs 2a und 4 VGG.

Korrigiert wurde in dieser Datei nur Abschnitt 0 Nr. 5: Die Beraterkosten für die Ausgliederung betragen laut 27 W4 45–110 T€, nicht 20–50 T€.

**Ergänzung zu Frage 5.1 Nr. 3:** Die Kanzlei soll zusätzlich die Erwerberhaftung der Handels-GmbH prüfen, nämlich § 1409 ABGB, § 38 UGB, § 14 BAO und § 67 Abs 4–6 ASVG. Bei einer Schwester-GmbH derselben Gesellschafter greift § 67 Abs 6 ASVG unabhängig von der Gestaltung. Außerdem sind der Betriebsübergang nach AVRAG und die Anfechtbarkeit nach §§ 28 ff. IO zu prüfen. Zu klären ist auch, ob ein Kundengeldkonto ohne Treuhand insolvenzfest ist. Einzelheiten stehen in `../28-pruefung-beirat.md`.
