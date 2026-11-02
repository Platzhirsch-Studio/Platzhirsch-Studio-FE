# Wachstumsrat: Poolbau und Architektur (Schwimmbad, Wellness, Fassade)

Kürzel: `pool-architektur` · Stand: 28.10.2026 · Gremium: Poolbau-Fachleute, Fliesenleger-Meister (Schwimmbad), Architekten und Innenarchitekten (Wellness, Hotel, Fassade)
Arbeitsweise: Wir haben nur gelesen und keinen Code geändert. Wir haben keine Formulare abgeschickt. Quellen stehen bei jeder Aussage. Schätzungen sind als **[Schätzung]** markiert. Was noch geprüft werden muss, ist als **[prüfen]** markiert.

---

## 0. Ausgangslage zum Prüfzeitpunkt

| Geprüft | Befund |
|---|---|
| `Marktresearch/digital/features/ezarri-*.md` (Analyse, Konzept, Team-Dokus) | **Noch nicht vorhanden.** Der Ezarri-Workflow läuft parallel. |
| `src/lib/ezarri/*.json` (collections, references, gallery), `config.js`, `data.js` | **Noch nicht vorhanden.** |
| `http://localhost:3000/de/ezarri` | **404.** Die Seite wird noch gebaut. |
| Aufträge an die Bauteams (`.data/workflows/ezarri-wf.js`) | Gelesen. Sie sind die einzige prüfbare Grundlage und werden in Kapitel 1 und 2 bewertet. |
| Inhaber-Entscheidung Nr. 7 (`teamleiter/inhaber-entscheidungen.md`) | Ezarri-Vertragshändler ist bestätigt, die Händler-Aussage ist erlaubt, `EZARRI_PUBLIC=true` gilt mit dem Deploy. |
| Primärquellen Ezarri | Technische Datenblätter **Mix, Gold, Zen (Ausgabe 2025)**, Verlegeseite und **Quellcode des Mosaik-Rechners** auf ezarri.com, ausgewertet am 28.10.2026 (Quellen in Kapitel 6). |

Deshalb gilt: Dieses Dokument ist die **fachliche Vorgabe**, an der Konzept, Rechner, Konfigurator und Katalog vor der Abnahme gemessen werden. Die Checkliste in Kapitel 3.3 sollte das Rechner-Team unverändert als Testfälle übernehmen.

---

## 1. Urteil zum Ist-Stand

| Bereich | Note (1–10) | Begründung |
|---|---|---|
| Umgesetzte Seiten | **nicht bewertbar** | Es gibt noch keine Seite und keine Daten. |
| Fachliche Qualität des Bauauftrags | **6/10** | Der Rahmen stimmt: Rechner mit Treppen, Rinne und Verschnitt, Filter „rutschhemmend“, Musteranfrage und keine Preise. Es fehlen aber wichtige Fachpunkte: Barfuß-Bewertungsgruppen statt eines Ja/Nein-Filters, Corner- und Cove-Spezialteile im Rechner, Untergrund und Abdichtung, Gebinde-Logik, Hinweise zum Gold-Mosaik und Unterlagen für Planer. Ein Begriff ist außerdem falsch: Der Auftrag verlangt einen „JointPoint-Bedarf“, aber JointPoint ist die Rückseitenverklebung ab Werk und kein Verbrauchsmaterial (siehe 2.1). |
| Nutzen für Poolbauer und Architekten | **3/10 (geplant)** | Der Plan richtet sich fast nur an Endkunden mit Konfigurator und Rechner. Es fehlen Ausschreibungstexte, Planerdaten (Texturen, CAD/BIM), ein Partnerprogramm, Projektregistrierung und ein Verlegeplan-Service. Gerade hier liegen aber die großen Mengen (siehe 2.4). |

**Kernaussage:** Endkunden finden die Ezarri-Welt über Google. **Gekauft wird aber über Poolbauer, Fliesenleger und Architekten.** Ohne einen Planer- und Partnerbereich bleibt die Ezarri-Welt eine schöne Galerie. Mit einem solchen Bereich wird sie zum Einstieg in Wellness-, Hotel- und Gartenprojekte.

---

## 2. Befunde und Chancen (fachlich)

### 2.1 Verlegung, Kleber, Fugen und Untergrund: Das muss auf der Technikseite und im Rechner stehen

Die folgenden Herstellerangaben stammen aus den Datenblättern Mix, Gold und Zen 2025 und aus der Verlegeseite von Ezarri:

| Thema | Herstellerangabe (Quelle Ezarri) | Folge für die Website |
|---|---|---|
| **Untergrund** | Frei von Staub, Moos und Farbe. Tragfähig, nichts darf sich ablösen. **Restfeuchte < 3 %**. Ebenheit „Toleranz < 1,5/1000 mm“ | Auf der Technikseite als Checkliste zeigen. Die Ebenheitsangabe ist uneindeutig. Wir lesen sie als 1,5 mm auf 1 m **[prüfen bei Ezarri]**. Glasmosaik gleicht keine Unebenheit aus und zeigt jede Welle im Streiflicht. |
| **Kleber auf Beton** | Mindestens **C2TE nach EN 12004**, also zementär, verbessert und ohne Abrutschen. Verarbeitung mit **6-mm-Zahnspachtel** in Abschnitten **< 2 m²**, bei **5–30 °C**, ohne Regen und bei Wind < 50 km/h | Der Rechner nimmt **2,5 kg/m²** an. So steht es in der Materialliste des Ezarri-Rechners (Kleber C2 S1 für Beton). |
| **Kleber auf Polyester- oder GFK-Becken** | Laut Ezarri-Materialliste ein zweikomponentiger PU-Kleber (Klasse R) mit **1,6 kg/m²** | Im Rechner gehört der **Untergrund als Eingabe** dazu (Beton/Zementputz, GFK/Polyester, Sonstiges → Hinweis „Rücksprache“). |
| **Fuge** | **Epoxidfuge Klasse RG nach EN 13888** wird empfohlen. Zementfuge nur nach Rücksprache (in der Ezarri-Liste als CG2). Fugenbreite ab Werk **1,1 mm** | Verbrauch im Ezarri-Rechner: **1,2 kg/m² (25 mm), 0,9 (36 mm), 0,7 (50 mm)**. Unsere Rechnung zur Plausibilität steht in 3.3. |
| **Reihenfolge im Becken** | Erst die **Wände**, dann **Treppen und Rampen**, zuletzt der **Beckenboden**. An Wänden von oben nach unten und von links nach rechts | Als Grafik auf der Seite „Verlegung“ zeigen. Fliesenleger erkennen daran sofort, dass der Händler das Thema beherrscht. |
| **JointPoint®** | Punktverklebung aus PVC und Additiven auf der Rückseite: 1 Punkt bei 25 und 36 mm, 2 Punkte bei 50 mm, 3 Punkte bei Hexa. Laut Hersteller sind **92 % der Rückseite frei** für den Kleber, die Verlegung ist **25 % schneller**, und die Verklebung ist unempfindlich gegen Feuchte | Das ist ein **Produktmerkmal und kein Verbrauch**. Im Rechner gibt es dafür keine Zeile. Im Text immer „laut Hersteller“ schreiben. |
| **Gold** | Zwei Glasschichten (4 mm oben und 0,8 mm unten) mit Blattgold dazwischen. **Nur eine Verlegerichtung möglich.** Keine sauren Reiniger (vor allem keine Fluss- oder Phosphorsäure). Trocken lagern. PEI 2 | Auf der Referenzseite Gold ein **Warnfeld** zeigen und im Rechner einen Hinweis einblenden. Für Gold ist ein Musterstein vor der Bestellung Pflicht. |
| **Pflege** | Haushaltsübliche Reiniger. Keine Scheuermittel, **kein Hochdruckreiniger**. Bei Zen keine säurehaltigen Reiniger | Gehört auf die Seite „Pflege“ und in die PDF-Zusammenfassung des Konfigurators. |
| **Einsatzbereich** | Wand und Decke innen und außen. Boden bei mittlerer Begehung (Wohnung und Hotel), hier **SAFE empfohlen**. Pool und Wellness innen und außen, **geeignet für Salzelektrolyse** | Als Filter „Einsatz“ und als Symbole auf jeder Referenz zeigen. |
| **Frost** | Zen: frostbeständig nach ISO 10545-12. Bei Mix und Gold steht in der Zeile 10545-12 nur „Resist“ ohne Bezeichnung **[prüfen]** | Für Außenbecken und **Fassaden** in den Alpen ist das ein Pflichtfeld. Ist der Wert nicht belegt, steht in den Daten `null` mit dem Vermerk „beim Hersteller anfragen“. |

**Abdichtung (fehlt bei Ezarri, ist aber für Planer entscheidend):** Das Glasmosaik dichtet nicht. Unter dem Belag braucht es entweder ein wasserundurchlässiges Becken (WU-Beton) oder eine **Verbundabdichtung**.
- **Deutschland:** **DIN 18535** regelt „Abdichtung von Behältern und Becken“. Die Klassen richten sich nach der Füllhöhe (W1-B bis 5 m, W2-B bis 10 m, W3-B über 10 m). Der **Beckenumgang** innen fällt unter **DIN 18534**. Verbundabdichtungen brauchen ein abP oder eine ETA (Quellen: Schomburg, Rudolf Müller, Heinze).
- **Österreich:** Die **ÖNORM B 3407** legt Mindestanforderungen an den Verleger fest und verweist auf die Merkblätter des Fliesenverbands. Ob es dort ein eigenes Merkblatt für Becken gibt, ist **[prüfen]** ([fliesenverband.at](https://pool.at/wp-content/uploads/2021/09/TechnischeAuskunft-Verbundabdichtung.pdf)).
- **Schweiz:** Hier gelten die SIA-Normen für Plattenarbeiten. Die genaue Norm und die NPK-Kapitel sind **[prüfen]**.
- **Website-Aussage:** „Abdichtung und Untergrund plant Ihr Poolbauer oder Fliesenleger. Wir liefern Mosaik, Systemprodukte und Datenblätter und stimmen das gern mit ihm ab.“ Platzhirsch darf **nicht** als ausführender Betrieb auftreten (vgl. Outdoor-Rechtslage in Bericht 30: Poolbau, Baumeister, keine Bauleitung).

### 2.2 Rutschhemmung: „DIN 51097“ ist überholt, ein Ja/Nein-Filter reicht nicht

1. **Die Norm ist veraltet.** DIN 51097 (Barfuß) und DIN 51130 (Schuh, R-Klassen) sind zurückgezogen. Ersetzt wurden sie **ohne Übergangsfrist** durch **DIN EN 16165**: Anhang A gilt für barfuß, Anhang B für beschuht, Anhang C für das Pendel ([IFA/DGUV FAQ](https://dguv.de/ifa/pruefung-zertifizierung/pruefung-von-bodenbelaegen/faq-zur-din-en-16165/index.jsp)). Die neuen Ezarri-Datenblätter verwenden bereits EN 16165. **Auf der Website deshalb so schreiben:** „Barfuß-Bewertungsgruppe C nach DIN EN 16165 Anhang A (früher DIN 51097)“. Damit finden Suchende mit dem alten Begriff die Seite trotzdem.
2. **Welche Ezarri-Werte belegt sind:** Nur die **SAFE-Ausführungen (Safe-Steps)** haben Prüfwerte. Bei Zen 25 SAFE und 50 SAFE sind das **Barfuß-Gruppe C (> 24°), R10, Pendel Klasse 3 (Rd > 45)**. Corner- und Cove-Teile verhalten sich laut Zen-Datenblatt „ähnlich wie 50 SAFE“. Bei Mix-SAFE ist die Tabelle im Datenblatt **leer** **[bei Ezarri nachfordern]**. Glänzende Standardware hat keine Klassifizierung. Für sie darf auf der Website **nichts** zu Rutschhemmung stehen.
3. **Welche Fläche welche Gruppe braucht** (DGUV Information 207-006, Tabelle 2, [BGN](https://vorschriften.bgn-branchenwissen.de/daten/dguv/207_006/3.htm)). Die Werte sind verbindlich für gewerbliche Bäder in DE und als Planungsmaßstab für Hotels in AT und CH geeignet. Eine neue Ausgabe vom Dezember 2025 ist angekündigt, deshalb die Tabelle vor Livegang gegen den aktuellen Stand **[prüfen]**.

| Gruppe (Winkel) | Typische Flächen im Pool- und Wellnessbereich |
|---|---|
| **A (> 12°)** | Weitgehend trockene Barfußgänge, Umkleiden, Beckenboden im Nichtschwimmerbereich, wenn überall > 80 cm Wassertiefe, trockene Sauna- und Ruhebereiche |
| **B (> 18°)** | **Beckenumgänge**, Duschen, **Dampfbad**, Beckenboden mit Teilbereichen < 80 cm Tiefe, Planschbecken, Rinnenabdeckungen aus Profilen |
| **C (> 24°)** | **Ins Wasser führende Treppen und Leitern**, Durchschreite-, Kneipp- und Tretbecken, **geneigter Beckenrand und begehbarer Beckenkopf**, Rampen > 6 % |

**Vorgabe für Katalog und Konfigurator:** Den Filter „rutschhemmend“ ersetzen durch **„geeignet für: Wand · Boden trocken · Boden nass (B) · Treppe/Beckenrand (C)“**. Diese Zuordnung ergibt sich aus den Prüfwerten der Referenz. Im Konfigurator sind **Treppe, Sitzbank und Beckenrand automatisch mit SAFE belegt**. Wählt der Nutzer eine Glanzreferenz für Treppen, erscheint ein Hinweis mit Vorschlag der SAFE-Variante. **Schweiz:** Dort gelten die bfu-Klassen GB für barfuß und GS für Schuh (Anforderungsliste Bodenbeläge 2.032). Eine Zuordnung zu EN 16165 Anhang A ist **[prüfen]**. Bis dahin steht auf CH-Seiten der Satz „Anforderung nach bfu mit Ihrem Planer abstimmen“.

### 2.3 Wasserfarbe: Was die Simulation darf und was nicht

- Die Wasserfarbe ergibt sich aus der Mosaikfarbe, der **Wassertiefe** (je tiefer, desto dunkler und blau-grüner), dem Himmel und der Spiegelung, der Tageszeit, der Beckenbeleuchtung, der Wasserchemie (z. B. Salz oder Kupfer) und der Fugenfarbe (bei 25 mm rund 8 % der Sichtfläche, siehe 3.3). Diese Wirkungskette ist **Fachpraxis**. Eine zitierfähige Primärquelle haben wir dazu nicht gefunden.
- **Vorgabe Konfigurator:** Die Wasserfarbe aus der **Absorption über die Tiefe** berechnen (Beer-Lambert-Näherung, Rot wird schneller geschluckt als Grün und Blau), mit den Einstellungen Tiefe, Himmel und Tageszeit. Immer gut sichtbar dazuschreiben: „**Simulation. Die tatsächliche Wirkung hängt von Licht, Tiefe und Wasserpflege ab. Prüfen Sie Originalmuster im Wasser.**“ Das erfüllt zugleich die UWG-Vorgaben aus dem Rechtspaket.
- **Fugenfarbe** muss im Konfigurator wählbar sein: weiß, grau, anthrazit und blau. Ezarri bietet farbige Epoxidfugen an, z. B. Blue Denim, Azzurro Caraibi und Blu Zaffiro, sowie Effektzusätze Gold und Spotlight (Ezarri-Materialliste). Die Fugenfarbe verändert den Gesamteindruck bei 25 mm stark.
- **Musterwürfel-Test als Service:** Wir legen ein Originalblatt in eine Wanne mit 30–40 cm Wasser im Tageslicht vor dem Café und machen ein Foto für den Kunden. Das kostet fast nichts und überzeugt mehr als jedes Rendering.

### 2.4 Was Poolbauer, Architekten und Bauherren konkret brauchen

| Zielgruppe | Braucht | Haben Plan und Brief das? |
|---|---|---|
| **Poolbauer / Schwimmbad-Fliesenleger** | Verfügbarkeit und Lieferzeit, **Projektpreis auf Anfrage innerhalb von 24 h**, Mengenauszug nach Gebinden, Datenblätter und Verlegeanleitung als PDF, Systemprodukte (Kleber, Epoxidfuge, Werkzeug) aus einer Hand, Muster am nächsten Tag, **Projektschutz** (wer zuerst registriert, bekommt die Konditionen), Hilfe bei der ersten Verlegung | Nur teilweise vorhanden: Datenblätter und Rechner. Der Rest fehlt. |
| **Architekten / Innenarchitekten / Hotelplaner** | **Ausschreibungstext** (LV-fähig, AT/DE/CH), **Texturen** (nahtlos, maßhaltig, mit PBR-Maps) für Revit, ArchiCAD, Twinmotion, Enscape und SketchUp, Fugenraster in echtem Maß, Rutschhemmungs-Zuordnung je Fläche, Nachweise (Datenblätter, Frost, Chemie, Recyclinganteil für ESG und Hotel-Zertifizierung), **Musterbox**, **Verlegeplan bzw. Custom-Pixel-Datei** für Logos und Verläufe | Fehlt. Ezarri hat selbst einen Dateibereich „Dateien für Architekten und Innenarchitekten“, der eine Anmeldung voraussetzt (im Seitenquelltext sichtbar). Der Inhalt ist **[prüfen]**: Bitte Zugang beim Hersteller beantragen. |
| **Bauherr privat** | Inspiration nach Einsatz und Region, Wasserfarben-Vorschau, grobe Menge, „Wer verlegt das bei mir?“ (**Partnerbetrieb**), Muster nach Hause, Wissen über Ablauf und Zeitfenster (Saison) | Konfigurator und Rechner sind geplant. **„Wer verlegt das?“ fehlt.** Das ist der häufigste Abbruchgrund. |
| **Hotel / Wellness-Betreiber** | Rutschhemmung nach DGUV/bfu, Chemie- und Salzbeständigkeit, Schnelligkeit in der Schließzeit, Nachkauf derselben Charge, Pflegeplan | Fehlt. Nötig ist eine Brücke zur Hotel-Contract-Seite (siehe `wachstumsrat/hotel-contract.md`). |
| **Fassade** | Frostbeständigkeit, Kleber für außen (S1/S2), Bewegungsfugen, Wind- und Sonnenseite, Brandschutzklasse (Glas ist A1 nach Normkenntnis, Kleber und System **[prüfen]**) | Im Brief nur als Einsatzbereich genannt. **Bitte keine Fassade bewerben, solange keine Ezarri-Angaben zu Fassadensystemen vorliegen [prüfen].** |

### 2.5 Markt und Partner in der Region (gefundene Ansatzpunkte)

- **Vorarlberg:** Die Gartenschmiede (Lauterach) macht Poolbau und Garten, Dünser Gartendesign (Ludesch) Schwimmteiche (beides Bericht 30). Dazu kommt MH-Pool OG, die laut Herold auf Polyesterbecken spezialisiert ist ([herold.at](https://www.herold.at/gelbe-seiten/fu%C3%9Fach/khdLm/mh-pool-og/)). Gerade Polyesterbecken lassen sich mit Mosaik und dem passenden PU-Kleber aufwerten. Ein Ezarri-taugliches Betonbecken-Fachunternehmen in Vorarlberg haben wir **nicht gefunden**.
- **Ostschweiz (TG/SG):** Laut local.ch sind das Schwimmbad & Meer GmbH (Aadorf), Perl-Pool AG (Ettenhausen) und Dudler AG Schwimmbadtechnik (Kreuzlingen) ([local.ch](https://www.local.ch/de/q/thurgau-kanton/schwimmbadbau-schwimmbadzubehoer)). SikaBau St. Gallen hat ein Mosaikbecken in Thurgau saniert ([Sika-Referenz](https://bau.sika.com/dam/dms/sikabau/g/SikaBau-Referenz-Schwimmbecken-Beschichtung.pdf)).
- **Bodensee-Nord und Oberschwaben:** Die Reiser GmbH (Bad Saulgau) hat die Fliesen- und Mosaikarbeiten der Therme Lindau ausgeführt (laut Suchergebnis, **[prüfen]**). Damit kommt sie als Verlegepartner für große Projekte infrage.
- **Ezarri-Wettbewerb in der Region:** Die Suche fand **keinen sichtbaren Ezarri-Händler in AT, CH oder am Bodensee** (die Treffer stammen aus AU, NZ und ZA). Ob es Gebietsschutz oder weitere Händler gibt, ist **[beim Hersteller prüfen]**. Wenn nicht, ist „Ezarri am Bodensee“ online fast unbesetzt. Das ist ein klarer SEO-Hebel.
- **Verbände für die Partnergewinnung:** Für Deutschland der bsw (Bundesverband Schwimmbad & Wellness), für Österreich der Fliesenverband und die Landesinnung der Fliesenleger, für die Schweiz ein Schwimmbadbauer-Verband. Die genauen Namen und Mitgliederlisten sind **[prüfen]**, die Suche brachte keine sicheren Treffer.

---

## 3. Fertige Bausteine

### 3.1 Partnerprogramm „Platzhirsch Wasser & Mosaik – Partner“

**Ziel:** Poolbauer, Schwimmbad-Fliesenleger und Planer bestellen Ezarri über Platzhirsch und bringen ihre Bauherren ins Studio. Dort folgen Outdoor-Möbel, Licht, Wellness-Einrichtung und bei Hotels die komplette Ausstattung.
**Startkapital:** gering. Benötigt werden Muster (anfragen, ob Ezarri sie kostenlos oder zum Selbstkostenpreis liefert **[prüfen]**), ein Formular und eine Partnerliste im bestehenden Backoffice oder Portal. Neue Software ist nicht nötig.

#### A. Partnerstufen

| Stufe | Für wen | Aufnahme | Leistungen von Platzhirsch | Gegenleistung des Partners |
|---|---|---|---|---|
| **Verlegepartner** | Schwimmbad-Fliesenleger, Poolbauer (Beton, Edelstahl mit Mosaik, GFK) | Formular, Gewerbenachweis, 2 Referenzfotos von Mosaikbecken, Gespräch | Wiederverkäuferkonditionen auf Mosaik und Systemprodukte (**Höhe legt der Inhaber nach dem Ezarri-Vertrag fest**), Projektschutz 6 Monate, Muster innerhalb von 48 h, Eintrag in der Partnerkarte „Wer verlegt bei mir?“ (nur mit schriftlicher Zustimmung), kostenloser Mengenauszug | Fachgerechte Verlegung nach Ezarri-Datenblatt, Fotos der fertigen Becken für die Galerie (mit Freigabe des Bauherrn), Rückmeldung zum Projektstand |
| **Planerpartner** | Architekten, Innenarchitekten, Hotel- und Wellnessplaner | Formular, Kammer- oder Büronachweis | Planerpaket (Texturen, Ausschreibungstext, Datenblätter), Musterbox, Bemusterung im Studio mit Café, Verlegeplan bzw. Custom-Pixel-Prüfung, Begleitung bei der Bauherrenpräsentation | Nennung von Platzhirsch als Bezugsquelle im LV („oder gleichwertig“ bleibt erlaubt), Projektregistrierung |
| **Projektpartner** (ab dem 3. gemeinsamen Projekt) | beide Gruppen | Einladung | Fester Ansprechpartner, Vorrang bei Lieferterminen, gemeinsame Referenzseite, Einladung zum jährlichen Partnerabend im Café | Gemeinsames Referenzprojekt mit Text und Fotos |

**Rechtliche Leitplanken (Pflicht, bitte vor dem Start [prüfen] lassen):**
- **Keine Provisionen oder geldwerten Vorteile an Architekten.** Das Berufsrecht der Ziviltechniker (AT) und der Architektenkammern (DE) sowie das Vertrauensverhältnis zum Bauherrn sprechen dagegen. Architekten bekommen **Dienstleistung**: Daten, Muster, Planungshilfe. Konditionen erhalten nur ausführende Betriebe, die selbst weiterverkaufen.
- **Partnerkarte:** nur mit Einwilligung des Betriebs. Kein Wort wie „zertifiziert“ oder „geprüft“, solange es keine echte Schulung gibt. Erlaubt ist „Partnerbetrieb von Platzhirsch“.
- **Haftung:** Platzhirsch liefert Material und Beratung. Die Verlegung schuldet der Verleger (vgl. Bericht 30, Modell A: Der Kunde schließt mit jedem Gewerk selbst ab).

#### B. Ablauf (so baut das Code-Team es)

1. **Seite** `/[locale]/ezarri/partner` mit Nutzen, Stufen, Formular und FAQ, außerdem `/ezarri/planer` mit dem Planerpaket. Kein Download ohne E-Mail-Adresse, aber **mit sofortigem Zugang** und doppelter Bestätigung. Das ergibt Leads.
2. **Formular „Partner werden“:** Firma, Ansprechperson, Gewerk (Poolbau / Fliesenleger / Architekt / Innenarchitekt / Hotelplaner / Sonstiges), Region (AT/DE/CH/FL), Referenzlink oder Upload (Handy-Upload wiederverwenden), Anzahl Becken pro Jahr (Spanne), Einwilligung Datenschutz. Die Daten gehen in denselben Postausgang bzw. dasselbe Backoffice wie `api/ezarri/anfrage`, Typ `partner`.
3. **Projektregistrierung** (für eingeloggte Partner im Portal, im ersten Schritt per Formular): Projektname, Ort, Becken (L×B×Tiefe oder m²), Referenzen, geplanter Verlegetermin. Daraus entstehen automatisch ein **Mengenauszug als PDF** (Rechner-Logik aus 3.3) und eine Eingangsbestätigung „Projekt geschützt bis TT.MM.JJJJ“.
4. **Musterbox:** 6–10 Muster im Format 10×10 cm oder halbe Blätter, die Datenblätter und eine Karte „Legen Sie dieses Muster ins Wasser“. Für Partner kostenlos, für Bauherren mit Verrechnung beim Kauf **[Inhaber]**.
5. **Bemusterung „Wasser & Licht“** einmal im Monat am Freitagnachmittag im Café: Wanne mit Wasser, Tageslicht und LED, mit Kaffee. Hierher werden Planer mit ihren Bauherren eingeladen. Der Abend lässt sich mit dem Outdoor-Bereich verbinden.
6. **Kennzahlen:** Anzahl Partner, registrierte Projekte, Muster, Angebote, Aufträge, m² und Folgeumsatz außerhalb von Ezarri (Möbel und Outdoor). Die Erfassung läuft über den Lead-Typ im bestehenden Analytics-Konzept.

#### C. Ansprache: fertige Texte (keine Superlative, Händler-Aussage nur zu Ezarri)

**E-Mail an Poolbauer und Fliesenleger (Erstkontakt):**
> Betreff: Ezarri-Glasmosaik am Bodensee: Muster in 48 Stunden, Mengenauszug inklusive
>
> Guten Tag [Name],
> wir sind Platzhirsch Home Living in Lochau und Ezarri-Vertragshändler. Für Ihre Becken liefern wir Ezarri-Glasmosaik aus 100 % recyceltem Glas sowie die passenden Kleber und Epoxidfugen nach Herstellerempfehlung.
> Für Fachbetriebe bieten wir: Muster innerhalb von 48 Stunden, einen kostenlosen Mengenauszug nach Kartons und Gebinden, Projektschutz für registrierte Projekte und Bemusterungen mit Ihren Kunden in unserem Studio mit Café.
> Hätten Sie im November 20 Minuten Zeit? Wir kommen gern mit der Musterbox vorbei.
> Freundliche Grüße, [Name], Platzhirsch Home Living, Landstraße 11, 6911 Lochau

**Kurztext Seite „Für Planer“:**
> **Für Architektur und Innenarchitektur.** Ausschreibungstexte, Texturen in echtem Maß, Datenblätter und eine Musterbox: alles, was Sie für die Planung mit Ezarri-Glasmosaik brauchen. Bei Logos, Verläufen und Mustern prüfen wir Ihre Vorlage, bevor sie in Produktion geht. Bemusterung mit Ihren Bauherren im Studio in Lochau, gern mit Kaffee.

**Text Partnerkarte (Bauherr):**
> **Wer verlegt das bei mir?** Glasmosaik braucht Erfahrung. Wir nennen Ihnen Fachbetriebe aus Ihrer Region, die mit Ezarri arbeiten. Den Vertrag über die Verlegung schließen Sie direkt mit dem Betrieb.

### 3.2 Ausschreibungstext-Vorlage (LV-Positionen, Glasmosaik im Schwimmbecken)

Nutzung: als Download (DOCX/PDF und **GAEB-X83 [später]**) auf `/ezarri/planer` und als Textbaustein auf jeder Referenzseite. Die Referenz und die Daten werden **aus `references.json` automatisch eingesetzt**. Die Gliederung folgt den üblichen Leistungsbereichen: AT LB-HB LG 24 Fliesen- und Plattenlegearbeiten, DE STLB-Bau LB 024, CH NPK Plattenarbeiten. Die Nummern der Leistungsbereiche sind **[prüfen]**, die Positionen gelten in allen drei Ländern.
Hinweis für öffentliche Auftraggeber: Produktnennung nur mit dem Zusatz **„oder gleichwertig“** und mit Angabe der Gleichwertigkeitskriterien. Private Bauherren dürfen das Produkt fest vorgeben.

```
VORBEMERKUNGEN
Gegenstand: Glasmosaik-Bekleidung eines Schwimmbeckens [innen/außen], Beckenmaße [L x B], Wassertiefe [min–max] m,
Beckenkonstruktion [WU-Stahlbeton / Beton mit Verbundabdichtung / GFK-Polyester].
Mitgeltend: Technisches Datenblatt und Verlegehinweise des Herstellers (Ezarri, Ausgabe [Jahr]),
DIN 18535 bzw. ÖNORM B 3407 samt einschlägigen Merkblättern bzw. SIA-Norm Plattenarbeiten [je Land wählen],
Rutschhemmung nach DIN EN 16165 Anhang A, Zuordnung der Flächen nach DGUV Information 207-006 [bzw. bfu 2.032].
Ausführung nur durch Betriebe mit Referenzen im Glasmosaik-Beckenbau (Nachweis von 2 Referenzen mit dem Angebot).
Umgebungsbedingungen bei Verlegung und Verfugung: +5 °C bis +30 °C, kein Regen, Wind < 50 km/h.
Füllen des Beckens frühestens nach Ablauf der vom Kleber- und Fugenhersteller angegebenen Wartezeit.
Vor Ausführung: Bemusterungsfläche ca. 1 m² inkl. Fugenfarbe, Freigabe durch AG/Planer.

POS 01  Untergrund prüfen und dokumentieren                                       psch
Prüfung auf Tragfähigkeit, Sauberkeit, Restfeuchte (< 3 % lt. Hersteller, CM-Messung, Protokoll)
und Ebenheit (Toleranz lt. Herstellerdatenblatt), Prüfung der Füllprobe/Dichtheit der Beckenkonstruktion
durch AG nachgewiesen. Bedenken schriftlich vor Beginn.

POS 02  Grundierung/Haftbrücke                                                    m²
System lt. Hersteller der Verbundabdichtung, auf Beton bzw. Zementputz.

POS 03  Verbundabdichtung Becken (Wand und Boden)                                 m²
Rissüberbrückende mineralische Dichtschlämme bzw. Reaktionsharz, geprüft für Becken
(abP/ETA bzw. gleichwertiger Nachweis), Wassereinwirkungsklasse [W1-B bis 5 m Füllhöhe], zweilagig, Schichtdicke lt. System.

POS 04  Dichtbänder, Dichtecken, Dichtmanschetten                                 m / St
An Kehlen, Bewegungsfugen, Einbauteilen (Düsen, Scheinwerfer, Bodenablauf, Skimmer, Rinne).
Einbauteile mit Klebe-/Klemmflansch [Anzahl je Typ angeben].

POS 05  Glasmosaik Beckenwände                                                    m²
Fabrikat: Ezarri [oder gleichwertig], Kollektion [..], Referenz [..], Format [25 x 25 / 50 x 50 / Hexa] mm,
Steinmaß [24,7 x 24,7 mm], Dicke [4,6 mm], 100 % Recyclingglas, Wasseraufnahme E ≤ 0,5 % (EN ISO 10545-3),
chemische Beständigkeit Klasse A (EN ISO 10545-13), geeignet für Salzelektrolyse lt. Hersteller,
Blatt [31,2 x 49,5 cm] mit Rückseiten-Punktverklebung (JointPoint) ab Werk,
verlegt im Dünnbett mit zementärem Kleber mind. C2TE (EN 12004) [S1 empfohlen], Zahnung 6 mm, Abschnitte < 2 m²,
Fugenbild durchlaufend, Fugenbreite werkseitig 1,1 mm. Verlegereihenfolge: Wände von oben nach unten.

POS 06  Glasmosaik Treppen, Sitzbänke, Beckenkopf (rutschhemmend)                 m² / m
Wie Pos. 05, jedoch Ausführung SAFE, Bewertungsgruppe C (> 24°) nach DIN EN 16165 Anhang A
[Prüfzeugnis beilegen]. Verlegung nach den Wänden und vor dem Beckenboden.

POS 07  Glasmosaik Beckenboden                                                    m²
Wie Pos. 05. Bei Wassertiefe < 80 cm in Teilbereichen: Ausführung SAFE, mind. Gruppe B (> 18°).

POS 08  Formteil Beckenkante (Corner)                                             m
Ezarri Corner [Farbe passend zu Referenz], an Beckenkante/Treppenkante, Eigenschaften lt. Hersteller ähnlich 50 SAFE.

POS 09  Formteil Hohlkehle (Cove)                                                 m
Ezarri Cove, Übergang Wand/Boden und Wand/Wand.

POS 10  Bewegungs- und Anschlussfugen                                              m
Elastisch, für Dauernassbereich und Schwimmbadwasser geeignet, lage- und konstruktionsgerecht
nach Fugenplan des Planers; Bauwerksfugen sind deckungsgleich zu übernehmen.

POS 11  Verfugung Epoxid                                                           m²
Reaktionsharzfuge Klasse RG (EN 13888), Farbe [..] lt. Bemusterung, Einbringen mit Gummischieber,
Reinigung mit Epoxid-Pad und Schwamm in kreisender Bewegung.

POS 12  Endreinigung                                                               m²
Mit Bauendreiniger lt. Herstellerempfehlung, frühestens nach 24 h. Keine Säure-/Flusssäurereiniger,
keine Scheuermittel, kein Hochdruck.

POS 13  Übergabe                                                                   psch
Übergabe Pflegeanleitung des Herstellers, Verlegeprotokoll (Chargen-Nr. je Referenz!),
Überschussmaterial [ca. 2–3 % bzw. 1 Karton je Referenz] für spätere Reparaturen.

ZULAGEN (wahlweise)
Z1  Zulage Custom-Muster / Logo / Verlauf nach Verlegeplan des Herstellers               m²
Z2  Zulage Überlaufrinne, Rinnenabwicklung [.. m]                                         m
Z3  Zulage Gold-Mosaik (nur eine Verlegerichtung, Lagerung trocken)                       m²
Z4  Zulage Verlegung auf GFK/Polyester mit 2K-PU-Kleber (Reaktionsharz R) lt. Hersteller m²
```

### 3.3 Checkliste für die Rechner-Formeln (Vorgabe für Team „Rechner“, als Unit-Tests übernehmen)

#### a) Was der Ezarri-Rechner tatsächlich rechnet (Quellcode ezarri.com/de/mosaik-rechner, Funktion `form_calculator`, ausgewertet am 28.10.2026)

```
mittlere Tiefe  t = Eingabe oder (t_min + t_max) / 2
Fläche_vor      = (L·B + (2L + 2B)·t) · (1 + Zuschlag%/100)
Kartonmaß       k = 1,45 m² bei 50 mm, sonst 2 m²
Fläche          = Fläche_vor auf das nächste Vielfache von k aufgerundet
Kleber  [kg]    = Fläche · 2,5           (gerundet)
Fuge    [kg]    = Fläche · 1,2 (25 mm) | 0,9 (36 mm) | 0,7 (50 mm)
Filzpads, Schwämme = Fläche / 5   ·   Epoxid-Reiniger = Fläche / 8   (kaufmännisch gerundet)
Corner, Cove    = Eingabe in laufenden Metern (keine Berechnung)
```

**Schwächen, die wir besser machen müssen:**
1. **Kaufmännisches Runden bei Stückzahlen:** 21,2 Pads ergibt 21 Pads. Richtig ist **immer aufrunden**.
2. **Ergebnis nur in kg statt in Gebinden:** Kleber gibt es in Säcken zu 23 bzw. 25 kg, Epoxidfuge in Eimern zu 5 kg (Ezarri-Materialliste). Wir geben **Säcke, Eimer und Kartons** aus.
3. **Kein Untergrund-Schalter:** PU-Kleber 1,6 kg/m² auf GFK fehlt in der Rechnung.
4. **Keine Treppen, Bänke, Rinne oder Beckenkopf. Corner und Cove werden nicht aus den Maßen abgeleitet.**
5. **Schräger Boden:** Er wird als waagerecht gerechnet. Bei 10 m Länge und 1 m Höhenunterschied ist das nur ein Fehler von 0,5 %. Bei einer Sprungbucht mit Knick ist er deutlich größer.
6. **Gleitkomma-Modulo** (`preArea % roundTo`) kann an Grenzen falsch runden. Wir rechnen in **ganzen Blättern**.
7. **Keine Trennung nach Referenzen:** Boden (SAFE), Wände (Glanz) und Mix-Anteile werden nicht getrennt ausgewiesen.

#### b) Unsere Formeln (verbindliche Vorgabe)

| # | Größe | Formel | Prüfpunkt |
|---|---|---|---|
| F1 | Becken **rechteckig**: Boden | `A_Boden = L · B`. Bei Gefälle optional `B · √(L² + (t_max − t_min)²)` | Gefälle ab Δt/L > 10 % verpflichtend |
| F2 | Wände rechteckig | `A_Wand = (2L + 2B) · t_mittel`, mit `t_mittel = (t_min + t_max)/2`. Ist identisch mit L·(t_min+t_max) + B·t_min + B·t_max bei linearem Gefälle | Test T1 |
| F3 | **L-Form** (rechtwinklig) | Fläche = Summe der Teilrechtecke. **Umfang = 2·(L_max + B_max)**, denn bei einer orthogonalen L-Form ist der Umfang gleich dem des umhüllenden Rechtecks | Test T4 |
| F4 | **Rund** | `A_Boden = π·r²`, `A_Wand = 2π·r·t` | Test T3 |
| F5 | **Freiform / Niere** | Eingabe von Wasserfläche (m²) und Umfang (m) laut Plan des Poolbauers. Alternativ Zeichnen im Konfigurator, dann Shoelace-Formel für die Fläche und Summe der Segmentlängen für den Umfang | Kein Schätzen ohne Umfang |
| F6 | **Treppe** (n Stufen, Breite b, Auftritt a, Steigung h) | `A = n · b · (a + h)`. Freistehende Seitenwangen: `+ 2 · a · h · n(n+1)/2`. Die Wandfläche hinter der Treppe wird **nicht** abgezogen (konservativ) | Treppenfläche **eigene Referenz (SAFE)** |
| F7 | Sitzbank / Liegestufe | wie Treppe mit n = 1 | SAFE |
| F8 | **Überlaufrinne** | `A = Umfang_Rinne · Abwicklung` (Eingabe in m, typisch 0,3–0,6 m **[Schätzung]**) | Abwicklung bitte nicht schätzen, sondern abfragen |
| F9 | **Beckenkopf / Rand** mit Mosaik | `A = Umfang · Randbreite` | SAFE, Gruppe C |
| F10 | **Corner** (lfm) | `= Umfang an der Beckenkante + Σ Stufenkanten (n · b)` | Vorschlag mit Möglichkeit zum Überschreiben |
| F11 | **Cove** (lfm) | `= Umfang am Boden + Anzahl senkrechter Innenecken · t_mittel` | Vorschlag mit Möglichkeit zum Überschreiben |
| F12 | Verschnitt | Standard **10 %** (Ezarri empfiehlt 5–10 %), Freiform und viele Einbauteile **12–15 % [Fachpraxis]**, Spanne 0–20 % | Wert in der Ausgabe nennen |
| F13 | **Blätter je Referenz** | `Blätter = ceil(A_netto · (1 + V) / m²_je_Blatt)`, mit `m²_je_Blatt = m²_je_Karton / Blätter_je_Karton` **aus den Daten** (25 mm: 2,0/13 = 0,1538; 50 mm: 1,45/10 = 0,145) | Nicht 0,15 m² aus dem Datenblatt verwenden, sonst passen die Kartons nicht |
| F14 | **Kartons** | `Kartons = ceil(Blätter / Blätter_je_Karton)`, `m²_geliefert = Kartons · m²_je_Karton` | Ausgabe: m² netto, m² inkl. Verschnitt, Blätter, Kartons, m² geliefert |
| F15 | **Mix aus Referenzen** (Custom Mix) | Je Referenz `A_i = A_gesamt · Anteil_i`, dann F13 und F14 **je Referenz** einzeln. Anteile in Summe 100 % (Validierung) | Rundung je Referenz, deshalb ist die Summe größer als bei einer Referenz. Das ist korrekt. |
| F16 | Kleber | Beton/Zement: `2,5 kg/m² · A_inkl.V`. GFK/Polyester: `1,6 kg/m²` (2K-PU). Gebinde: `ceil(kg / Sackgewicht)` | Quelle: Ezarri-Materialliste |
| F17 | Epoxidfuge | `kg = A_inkl.V · {1,2 \| 0,9 \| 0,7}` je Format, Eimer `ceil(kg/5)`. Hexa ist **[bei Ezarri anfragen]**, bis dahin 1,2 mit Hinweis | Siehe Plausibilitätsrechnung unten |
| F18 | Werkzeug | Pads und Schwämme `ceil(A/5)`, Epoxid-Reiniger `ceil(A/8)`, Gummischieber 1 je 2 Verleger **[Schätzung]** | Immer aufrunden |
| F19 | Gewicht und Transport | `kg = A_geliefert · 9,4` (25 mm) bzw. `13,5` (50 mm) plus Kleber und Fuge. Ab ca. 600 kg Hinweis „Lieferung auf Palette“ **[Schätzung]** | Wichtig für Abholung oder Lieferung |
| F20 | Warnregeln | Treppe, Bank oder Rand ohne SAFE gibt eine Warnung aus. Bei Gold erscheinen „Verlegerichtung“ und „keine Säure“. Bei GFK der Hinweis „PU-Kleber“. Bei „außen“ und fehlender Frostangabe der Hinweis „Hersteller fragen“ | Muss als UI-Test vorhanden sein |

**Plausibilität Fugenverbrauch (eigene Rechnung):** Die theoretische Fugenmasse beträgt `(a+b)/(a·b) · Fugenbreite · Fugentiefe · Dichte`. Mit Dichte ≈ 1,55 kg/dm³ (übliche Epoxidfuge **[Schätzung]**) ergibt das:
- 25 mm: (49,4/610,1) · 1,1 · 4,6 · 1,55 ≈ **0,63 kg/m²**. Ezarri rechnet 1,2.
- 50 mm: (101,4/2570,5) · 1,1 · 5,8 · 1,55 ≈ **0,39 kg/m²**. Ezarri rechnet 0,7.
Die Ezarri-Werte liegen jeweils bei etwa dem 1,8- bis 1,9-Fachen. Das ist plausibel, weil beim Einschlämmen von Mosaik viel Material auf der Oberfläche verloren geht. **Wir übernehmen die Ezarri-Werte** und schreiben dazu: „Praxiswert lt. Hersteller inkl. Verlust“. Der Fugenanteil an der Sichtfläche beträgt bei 25 mm 1 − (24,7² / 25,8²) ≈ **8,3 %**. Daraus folgt der Grund für die Fugenfarbe im Konfigurator (2.3).

**Datenfehler, die der Crawler abfangen muss:**
- Beim 25-mm-Blatt ergibt die Rechnung 31,2 × 49,5 cm = 0,1544 m². Im Datenblatt stehen 0,15 m², und 13 Blätter sollen 2 m² ergeben. Beim 50-mm-Blatt ergeben 31,5 × 47,5 cm = 0,1496 m², 10 Blätter sollen aber 1,45 m² sein. **Regel:** Für die Bestellmenge zählen **Blätter je Karton und m² je Karton**, nicht das Blattmaß.
- Bei Gold 50 mm steht das Steinmaß in Zoll falsch (0.94 in). Für die Anzeige nur die mm-Werte verwenden.
- „Hexa“ und „36 mm“ sind bei Mix, Gold und Zen leer. Bei anderen Kollektionen sind sie belegt. Fehlt ein Wert, gilt `null` und der Vermerk „unsicher“ (wie im Crawler-Auftrag vorgesehen).

#### c) Testfälle mit Sollwerten

| Test | Eingabe | Soll |
|---|---|---|
| **T1 Ezarri-Referenz** | 10 × 5 m, t 1,0 bis 2,0 m, 25 mm, Zuschlag 10 %, Beton | netto 95,00 m². Mit Zuschlag 104,50 m². **680 Blätter → 53 Kartons → 106 m²** (wie im Ezarri-Beispiel, 106 m²). Kleber 2,5 · 104,5 = 261,3 kg → **11 Sack à 25 kg**. Fuge 1,2 · 104,5 = 125,4 kg → **26 Eimer à 5 kg**. Pads 21, Schwämme 21, Reiniger 14 (alles aufgerundet, Basis m² inkl. Verschnitt). Gewicht Mosaik ≈ 996 kg |
| **T2 gleiche Wanne, 50 mm** | wie T1, 50 mm | 104,50 m² / 0,145 = 720,7 → **721 Blätter → 73 Kartons → 105,85 m²**. Fuge 0,7 · 104,5 = 73,2 kg → **15 Eimer** (bei Rechnung auf Liefermenge 74,1 kg, ebenfalls 15). Festlegen, ob die Fuge auf m² inkl. Verschnitt oder auf die Liefermenge gerechnet wird. **Vorschlag: auf m² inkl. Verschnitt.** |
| **T3 Rundbecken** | Ø 4 m, t 1,4 m, 25 mm, 10 % | Boden 12,57 + Wand 17,59 = 30,16 m² netto. 33,18 m² inkl. Verschnitt. 216 Blätter → **17 Kartons** (34 m²) |
| **T4 L-Form** | 8 × 4 + 3 × 3 (Außenmaß 11 × 4), t 1,5 m | Fläche 41 m². Umfang 2·(11+4) = 30 m. Wand 45 m², netto 86 m² |
| **T5 Treppe** | 4 Stufen, b 1,5 m, a 0,30 m, h 0,25 m, freistehend | Stufenflächen 4·1,5·0,55 = 3,30 m². Wangen 2·0,30·0,25·10 = 1,50 m². **4,80 m² in SAFE**. Corner zusätzlich 6,0 m |
| **T6 Mix** | 95 m² netto, 10 %, 3 Referenzen 50/30/20 % | 52,25 / 31,35 / 20,90 m² → 340 / 204 / 136 Blätter → **27 / 16 / 11 Kartons**. Mehr als T1, das ist korrekt. |
| **T7 Grenzwert** | Fläche exakt 2,00 m² inkl. Verschnitt, 25 mm | 13 Blätter → **1 Karton** (nicht 2). Achtung Gleitkomma: 2,00 / (2/13) kann 13,0000001 ergeben. Vor `ceil` auf 6 Nachkommastellen runden oder in ganzen Blättern rechnen |
| **T8 Validierung** | t_min > t_max, negative Maße, Anteile ≠ 100 %, Zuschlag > 20 % | Fehlermeldung am Feld, kein Ergebnis |
| **T9 GFK** | wie T1, Untergrund GFK | Kleber 1,6 · 104,5 = 167,2 kg, Gebinde 8 kg → **21 Gebinde**, Hinweis 2K-PU |
| **T10 Warnungen** | Treppe mit Glanzreferenz / Gold / außen ohne Frostwert | jeweils Warntext sichtbar, Screenreader-tauglich (aria-live) |

Ausgabe-Pflichttext unter jedem Ergebnis:
> „Richtwerte nach Herstellerangaben (Ezarri) für die Planung. Sie ersetzen kein Aufmaß. Die verbindliche Menge legt Ihr Verleger nach Aufmaß fest. Restmengen in ganzen Kartons. Bitte bestellen Sie alle Kartons einer Referenz aus einer Charge.“

### 3.4 Fachtexte für die Technikseiten (kurz, sofort nutzbar, Händler-Aussage nur zu Ezarri)

- **Untergrund:** „Glasmosaik zeigt jede Unebenheit. Der Untergrund muss tragfähig, sauber, trocken (Restfeuchte unter 3 %) und sehr eben sein. Wie das Becken abgedichtet wird, legt Ihr Poolbauer oder Fliesenleger fest. Wir stimmen Mosaik, Kleber und Fuge darauf ab.“
- **Kleber und Fuge:** „Ezarri empfiehlt auf Beton mindestens einen Kleber der Klasse C2TE und für Becken eine Epoxidfuge der Klasse RG. Die Epoxidfuge nimmt kaum Wasser auf und ist beständig gegen Beckenchemie. Ihre Farbe prägt das Bild deutlich mit.“
- **Rutschhemmung:** „Für Treppen, Sitzbänke und Beckenränder gibt es Ezarri-Mosaik in rutschhemmender SAFE-Ausführung. Bei Zen SAFE weist der Hersteller die Bewertungsgruppe C nach DIN EN 16165 (früher DIN 51097) aus. Welche Gruppe Ihre Fläche braucht, klären wir mit Ihrem Planer.“
- **Wasserfarbe:** „Unter Wasser wirkt jede Farbe anders: mit der Tiefe dunkler und blauer, mit Sonne lebendiger. Unser Konfigurator zeigt eine Annäherung. Sicher sind Sie erst mit dem Originalmuster im Wasser, und das bekommen Sie bei uns.“

---

## 4. Maßnahmen

| Prio | Maßnahme | Aufwand | Kosten grob | Erwarteter Umsatzeffekt (Begründung) | Wer |
|---|---|---|---|---|---|
| **P0** | Rechner nach **Checkliste 3.3** bauen (F1–F20, Tests T1–T10), Ergebnis in Kartons und Gebinden | M | intern | **Hoch [Schätzung].** Ein fehlerhafter Mengenauszug kostet Glaubwürdigkeit bei Fachbetrieben. Ein korrekter Auszug mit Gebinden ist der Einstieg ins Angebot und erhöht den Warenkorb um Systemprodukte (Kleber und Fuge machen bei 100 m² rund 11 Sack und 26 Eimer aus). | Code-Team (Rechner) |
| **P0** | Rutschhemmung auf **DIN EN 16165 + Flächenzuordnung** umstellen (Filter, Konfigurator-Automatik SAFE, Texte). DIN 51097 nur als „früher“ nennen | S | intern | Mittelbar. Vermeidet Haftungs- und UWG-Risiken. Planer und Hotelbetreiber trauen dem Händler, wenn er die richtige Norm nennt. | Code-Team (Welt + Konfigurator) |
| **P0** | Technikseiten mit Herstellerangaben aus 2.1 (Untergrund, Kleber, Fuge, Reihenfolge, Gold-Warnung, Pflege) und dem Satz zur Abdichtung (Platzhirsch tritt nicht als Ausführender auf) | S | intern | Mittelbar. Senkt Reklamationen und bringt Long-Tail-SEO („Glasmosaik Pool verlegen“, „Epoxidfuge Pool“). | Code-Team (Welt) |
| **P1** | **Partnerprogramm** (3.1): Seiten `/ezarri/partner` und `/ezarri/planer`, Formular, Projektregistrierung, PDF-Mengenauszug | M | intern + Muster | **Hoch [Schätzung].** Ein Poolbauer mit 5–10 Mosaikbecken im Jahr bringt je nach Größe 500–1.000 m² Mosaik. Ein Mosaikpreis ist nicht belegt, deshalb gibt es keine €-Zahl. Hinzu kommt ein Folgeumsatz bei Outdoor-Möbeln (Bericht 30: 50–150 T€ Möbelanteil bei Villenprojekten). | Code-Team + Inhaber (Konditionen) |
| **P1** | **Ausschreibungstext-Vorlage** (3.2) als DOCX/PDF mit automatischem Einsetzen der Referenz | S | intern | **Hoch für Objektgeschäft.** Was im LV steht, wird gekauft. Hotel- und Wellnessprojekte sind die größten Flächen. | Code-Team |
| **P1** | **Musterbox + „Muster im Wasser“-Bemusterung** im Café (monatlich) | S | Muster [Ezarri anfragen], Wanne < 100 € **[Schätzung]** | Hoch. Ein physisches Muster ist der stärkste Kaufauslöser bei Glasmosaik. Der Termin im Café verbindet Planer, Bauherr und das übrige Sortiment. | Inhaber |
| **P1** | 10 Fachbetriebe ansprechen (Vorarlberg, Ostschweiz, Allgäu und Oberschwaben, siehe 2.5) mit E-Mail aus 3.1 C und Besuch mit Musterbox | M | Zeit + Fahrt | Hoch. Schon 2–3 aktive Verlegepartner liefern laufende m²-Mengen ohne Werbebudget. | Inhaber / Verkauf |
| **P1** | Bei Ezarri anfordern: Zugang zum Architektenbereich (Texturen/BIM), Mix-SAFE-Prüfwerte, Frost- und Fassadenangaben, Hexa-Fugenverbrauch, Gebietsschutz und Händlerliste DACH, Musterkonditionen | S | 0 | Schließt Datenlücken und ermöglicht das Planerpaket ohne eigene Texturproduktion. | Inhaber |
| **P1** | Konfigurator: Wasserfarbe über Tiefe und Licht, **Fugenfarbe wählbar**, SAFE-Automatik, Simulationshinweis | M | intern | Mittel. Ein glaubwürdiges Bild führt zur Musteranfrage. Ohne Fugenfarbe wirkt die Vorschau falsch. | Code-Team (Konfigurator) |
| **P2** | Partnerkarte „Wer verlegt bei mir?“ (nur mit Einwilligung der Betriebe) | S | intern | Mittel bis hoch. Beseitigt den häufigsten Abbruchgrund bei Privatkunden. | Code-Team + Inhaber |
| **P2** | Planer-Texturen: nahtlose PBR-Kacheln je Referenz in echtem Maß (1 m², 4k) aus Ezarri-Material oder eigenen Scans, als ZIP gegen E-Mail | M | intern / GPU | Mittel. Planer übernehmen eine Referenz, die schon im Modell ist, mit hoher Wahrscheinlichkeit auch ins LV. | Code-Team (3D) |
| **P2** | Brücke **Ezarri → Hotel-Contract und Outdoor**: Wellness-Seite „Hotel-Spa aus einer Hand“ (Mosaik, Liegen, Licht, Textilien), Links in beide Richtungen | S | intern | Hoch im Objektgeschäft. Ein Hotel-Spa ist ein Einstieg in die FF&E-Gesamtausstattung (siehe `hotel-contract.md`). | Code-Team |
| **P2** | SEO-Seiten „Glasmosaik Pool Vorarlberg / Bodensee / St. Gallen / Allgäu“ mit echten Partnerprojekten, sobald vorhanden | M | intern | Mittel. Laut Recherche gibt es keinen sichtbaren regionalen Ezarri-Wettbewerb. | Code-Team (Content) |
| **P3** | GAEB-Export (X83) der Ausschreibungspositionen | M | intern | Gering bis mittel. Nur für größere Planungsbüros relevant. | Code-Team |
| **P3** | Fassade erst bewerben, wenn Herstellernachweise vorliegen | – | 0 | Vermeidet Haftungsrisiko. | Inhaber |
| **P3** | Verlegeschulung mit einem Kleber- oder Fugenhersteller im Studio („Glasmosaik im Becken“) für Partnerbetriebe | M | Raum + Café, Hersteller trägt Schulung **[prüfen]** | Mittel. Bindet Verleger langfristig. | Inhaber + Partner |

---

## 5. Offene Punkte für die Abnahme der Ezarri-Teams (Prüfliste für QA)

1. Taucht irgendwo „DIN 51097“ **ohne** den Zusatz EN 16165 auf? Wird „rutschhemmend“ bei Referenzen ohne Prüfwert angezeigt? Beides ist ein **P1-Fehler**.
2. Liefert der Rechner für T1 genau 53 Kartons, 11 Sack und 26 Eimer?
3. Sind Treppe und Beckenrand im Konfigurator automatisch SAFE? Erscheint bei Gold die Warnung?
4. Steht in Rechner und Konfigurator ein Simulations- und Richtwerthinweis?
5. Gibt es eine Zeile „JointPoint-Bedarf“? Wenn ja, muss sie entfernt werden.
6. Gibt es einen Weg für Fachbetriebe und Planer (Partner, Planerpaket, Ausschreibungstext)?
7. Behauptet ein Text, dass Platzhirsch Pools baut, abdichtet oder verlegt? Wenn ja, muss er geändert werden.

---

## 6. Quellen

- Ezarri, Technisches Datenblatt **Mix** 2025: https://www.ezarri.com/media/uploads/fichas/ft2025_mix_ezarri_eng1.pdf
- Ezarri, Technisches Datenblatt **Gold** 2025: https://www.ezarri.com/media/uploads/fichas/ft2025_gold_ezarri_eng1.pdf
- Ezarri, Technisches Datenblatt **Zen** 2025 (spanisch, mit SAFE-Werten): https://www.ezarri.com/media/uploads/fichas/ft2025_zen_ezarri_cast2.pdf
- Ezarri, Verlegung: https://www.ezarri.com/en/installation und https://www.ezarri.com/de/how-to-install-Ezarri-mosaics
- Ezarri, Mosaik-Rechner (Formel im Seitenquelltext, Materialliste mit Verbrauchswerten): https://www.ezarri.com/de/mosaik-rechner
- Ezarri, Safe-Steps (2017): https://www.ezarri.com/en/new-antislip-system-safe-steps
- IFA/DGUV, FAQ zur DIN EN 16165: https://dguv.de/ifa/pruefung-zertifizierung/pruefung-von-bodenbelaegen/faq-zur-din-en-16165/index.jsp
- DGUV Information 207-006, Tabellen 1 und 2 (BGN-Branchenwissen): https://vorschriften.bgn-branchenwissen.de/daten/dguv/207_006/3.htm · Neuausgabe 12/2025: https://publikationen.dguv.de/DguvWebcode/index/query/p207006
- DIN 18535/18534, Becken und Verbundabdichtung: Schomburg-Broschüre https://www.schomburg.com/de/de/dateien/prospekt_schwimmbaeder-sicher-planen-und-bauen/Prospekt%20Schwimmbaeder%20sicher%20planen%20und%20bauen%20A4_1324.pdf · Rudolf Müller https://www.presseservice.rudolf-mueller.de/pressreleases/fliesenleger-information-abdichtungen-im-verbund-aiv-2508313.pdf
- Österreich, Fliesenverband (ÖNORM B 3407): https://pool.at/wp-content/uploads/2021/09/TechnischeAuskunft-Verbundabdichtung.pdf
- bfu Schweiz, Bodenbeläge 2.032 (indirekt über USZ): https://www.usz.ch/app/uploads/2025/09/281-Bodenbelaege-Version-1.0.pdf · bfu-Prüfreglement: https://www.bfu.ch/media/2kvknl2n/pruefreglement_bodenbelaege_d.pdf
- Regionale Betriebe: https://www.local.ch/de/q/thurgau-kanton/schwimmbadbau-schwimmbadzubehoer · https://www.herold.at/gelbe-seiten/fu%C3%9Fach/khdLm/mh-pool-og/ · https://bau.sika.com/dam/dms/sikabau/g/SikaBau-Referenz-Schwimmbecken-Beschichtung.pdf
- Intern: `Marktresearch/30-geschaeftsfeld-outdoor-gartenplanung.md` (Partner, Recht, Preisanker), `Marktresearch/23-masterkonzept.md` Kap. 8 (Architektenvertrieb), `Marktresearch/digital/teamleiter/inhaber-entscheidungen.md` Nr. 7, `.data/workflows/ezarri-wf.js`
