# Expertenrat 04: Neuromarketing und Wahrnehmung

**Rolle:** Neuromarketing- und Wahrnehmungsforscher
**Schwerpunkt:** Eye-Tracking, Aufmerksamkeit, ästhetische Wahrnehmung (Processing Fluency, Prototypikalität und Neuheit), Gesichter und Blickrichtung, Bildgröße und Wertwahrnehmung, Weißraum und Luxus, haptische Vorstellung, Ton und Video
**Stand:** 26.10.2026. Grundlage sind die Berichte `digital/01`, `02`, `12`, `13`, `14` und `23-masterkonzept.md` (Abschnitt 4). Die Prototypen unter `src/app/[locale]/preview/` gab es beim Schreiben noch nicht. Abschnitt 5 ist deshalb als Prüfraster gebaut, das man auf jeden Prototyp anwenden kann.

**Ein Hinweis vorab:** „Neuromarketing“ ist hier nüchtern gemeint. Gemeint sind replizierte Befunde aus Wahrnehmungspsychologie, Konsumentenforschung und Eye-Tracking. Gemeint sind keine Tricks, die das Unbewusste „steuern“. Wo ein Befund nur aus einer einzelnen Studie, aus dem Laden statt aus dem Web oder aus einem anderen Kontext stammt, steht das dabei.

---

## 1. Die wichtigsten Erkenntnisse für Platzhirsch

### E1. Das Urteil fällt in 17 bis 50 ms, und es hängt vor allem an geringer visueller Komplexität
- Lindgaard u. a. (2006) zeigen, dass das Urteil über die Anmutung einer Website nach **50 ms** schon weitgehend dem Urteil nach längerem Ansehen entspricht. Quelle: Lindgaard, Fernandes, Dudek, Brown, *Behaviour & Information Technology* 25(2), 115–126.
- Tuch u. a. (Google und Universität Basel, 2012) zeigen 119 Websites für 17, 33 und 50 ms. **Geringe visuelle Komplexität** wirkt schon nach **17 ms**, die **Prototypikalität** (also: sieht die Seite aus wie ihre Kategorie?) kommt kurz danach dazu. Am attraktivsten wirken Seiten mit geringer Komplexität und hoher Prototypikalität. Quelle: *International Journal of Human-Computer Studies* 70(11), 794–811; Kurzfassung im Google-Research-Blog „Users love simple and familiar designs“ (2012), [research.google/pubs/pub38315](https://research.google/pubs/pub38315/).
- Reinecke u. a. (CHI 2013) werten 450 Websites mit 548 Personen aus. Die **Komplexität** sagt die Bewertung nach 500 ms deutlich stärker vorher als die **Farbigkeit**. Der Effekt hängt von Alter und Bildung ab: Ältere und höher Gebildete bevorzugen ruhigere und weniger bunte Seiten. Quelle: Reinecke, Yeh, Miratrix, Mardiko, Zhao, Liu, Gajos, CHI 2013, 2049–2058, [PDF](https://kgajos.seas.harvard.edu/papers/reinecke13aesthetics.pdf).
- **Folgerung für Platzhirsch:** Die Kernzielgruppe (vermögende Bauherren, meist 40 bis 70 Jahre, Architekten) ist genau die Gruppe, die geringe Komplexität und gedämpfte Farbe am stärksten belohnt. Über den ersten Eindruck entscheidet der **erste Viewport**, und zwar bevor jemand den ersten Satz liest. Darauf stützt sich die Regel aus Bericht 01: ein Gedanke pro Bildschirm.

### E2. Leicht verarbeitbar im Gerüst, ein wenig fremd in der Inszenierung (MAYA)
- Processing Fluency bedeutet: Was sich leicht verarbeiten lässt, gefällt besser. Dazu zählen Symmetrie, Kontrast, Klarheit und Vertrautheit. Quelle: Reber, Schwarz, Winkielman (2004), *Personality and Social Psychology Review* 8(4), 364–382.
- Hekkert, Snelders und van Wieringen (2003) beschreiben das MAYA-Prinzip („Most Advanced, Yet Acceptable“). Am besten gefällt, was so neu wie möglich ist und dabei typisch bleibt. Neuheit und Typikalität wirken gemeinsam und unterdrücken sich gegenseitig. Quelle: *British Journal of Psychology* 94(1), 111–124.
- Bei **besonderen, exklusiven** Produkten kann eine leichte Verarbeitungsschwierigkeit den Wert sogar steigern, weil das Produkt dann „ungewöhnlich“ wirkt. Bei Alltagsprodukten schadet sie dagegen. Quelle: Pocheptsova, Labroo, Dhar (2010), *Journal of Marketing Research* 47(6), 1059–1069.
- **Folgerung:** Navigation, Formulare, Buttons und die Lage des Logos bleiben **prototypisch**: Logo oben links, Menü oben, Termin oben rechts, Footer unten. Die **Neuheit** gehört ausschließlich in die Inszenierung: Bildschnitt, Typografie in Display-Größe, Rhythmus, Übergänge. Eine Bodoni ab 56 px darf etwas fordern, denn das ist die „gute“ Disfluenz. Eine Grotesk in 17 px Fließtext muss mühelos lesbar sein.

### E3. Weißraum ist ein Preissignal, und das ist experimentell belegt
- Pracejus, Olsen und O'Guinn (2006) zeigen, dass leerer Raum in Anzeigen als **Prestige, Qualität und Vertrauen** gelesen wird. Das ist ein kulturell gelerntes Signal aus der Luxuswerbung. Quelle: *Journal of Consumer Research* 33(1), 82–90.
- Sevilla und Townsend (2016) belegen den **Space-to-Product-Ratio-Effekt**: Je mehr Raum um ein Produkt bleibt, desto höher werden ästhetischer Reiz, wahrgenommener Wert und Preisbereitschaft eingeschätzt. Laut den Autoren erklärt sich das über leichtere Verarbeitung, und es gilt im Laden wie online. Quelle: *Journal of Marketing Research* 53(5), 665–681; [UGA-Zusammenfassung](https://www.terry.uga.edu/marketing-professor-honored-consumer-behavior-research).
- **Folgerung:** Der heutige Katalog mit 1.765 Produkten im Marktplatz-Raster ist für Wertwahrnehmung das Gegenteil dessen, was die Forschung empfiehlt. Wenige Produkte pro Ansicht, große Abstände, „Galerie statt Marktplatz“ (Bericht 01, F6) ist deshalb keine Stilfrage, sondern ein **Preishebel**.

### E4. Bildgröße steuert Aufmerksamkeit, und das Bild gewinnt vor dem Text
- Pieters und Wedel (2004) haben 1.363 Anzeigen per Eye-Tracking ausgewertet. Das **Bild** zieht Aufmerksamkeit überproportional zu seiner Fläche an, und eine größere Bildfläche steigert die Aufmerksamkeit für die ganze Anzeige. Text gewinnt nur über seine Fläche. Quelle: *Journal of Marketing* 68(2), 36–50.
- Nielsen (NN/g, Eye-Tracking 2010, „Photos as Web Content“) zeigt: Fotos mit **echtem Informationsgehalt** (echte Produkte, echte Menschen) werden betrachtet. Dekorative Stockfotos werden übersprungen wie Werbebanner.
- **Folgerung:** Ein Produkt, das verkauft werden soll, braucht auf dem Desktop mindestens **die halbe Viewport-Breite** (Spalten 7–12), in Hero-Bereichen die volle Breite. Kleine Thumbnails in 4er-Reihen eignen sich nur für die Suche, nicht für die Inszenierung. Stockbilder (`images.unsplash.com` steht noch in `next.config`) sind wahrnehmungspsychologisch wertlos und rechtlich riskant.

### E5. Gesichter ziehen Blicke an, die Blickrichtung lenkt sie weiter
- Cyr, Head, Larios und Pan (2009) vergleichen drei Varianten: Menschenbilder mit Gesicht, Menschen ohne Gesicht und Seiten ohne Menschen. Bilder **mit Gesicht** steigern Anmutung und Wärme in Kanada, Deutschland und Japan. Ein direkter Effekt auf Vertrauen zeigte sich nicht. Quelle: *MIS Quarterly* 33(3), 539–566, [AIS-Eintrag](https://aisel.aisnet.org/misq/vol33/iss3/8).
- Sajjacholapunt und Ball (2014) zeigen per Eye-Tracking: Ein Gesicht mit **abgewandtem Blick** (zum Produkt oder Text hin) lenkt mehr Aufmerksamkeit auf Text und Produkt und verbessert die Erinnerung an Marke und Botschaft. Ein **direkter Blick** bindet die Aufmerksamkeit am Gesicht. Quelle: *Frontiers in Psychology* 5:166, [PMC3941030](https://pmc.ncbi.nlm.nih.gov/articles/PMC3941030). Ähnliche Befunde zu Blickhinweisen in Printanzeigen: Hutton und Nolte (2011), *Applied Cognitive Psychology* 25(6).
- **Folgerung:** Es gibt zwei Bildtypen mit zwei Aufgaben.
  - **„Gastgeber“-Porträt** mit direktem Blick nur dort, wo Beziehung das Ziel ist: Team, Termin, Café, Kontakt.
  - **Szenenbild** mit Person, die **auf das Produkt oder in Richtung Headline/CTA** blickt oder greift: Hand auf dem Minotti-Bouclé, Blick zur Rimadesio-Glastür. Das wird auf Produkt-, Marken- und Projektseiten eingesetzt.
  - Bericht 01 empfiehlt bisher „Menschen nur beiläufig (Hände, Rücken)“. Das ist für Produktseiten richtig. Für die Positionierung „Gastgeber, nicht Händler“ fehlt dann aber genau das Signal, das kein Wettbewerber hat: **erkennbare Gesichter des Teams**. Ergänzung: mindestens ein Porträt mit Gesicht auf Startseite, „Das Haus“ und Termin-Seite.

### E6. Haptische Vorstellung ersetzt teilweise das Anfassen, und Material-Nahaufnahmen lösen sie aus
- Peck und Childers (2003) zeigen: Menschen mit hohem „Need for Touch“ sind beim Kauf ohne Berührung unsicherer. Bei Polstermöbeln, Stoffen, Leder und Stein ist das die zentrale Kaufbarriere online. Quelle: *Journal of Marketing* 67(2), 35–48.
- Peck, Barger und Webb (2013) zeigen: Schon das **Vorstellen** des Berührens erhöht das Gefühl, das Produkt zu besitzen (psychological ownership). Quelle: *Journal of Consumer Psychology* 23(2), 189–196.
- Elder und Krishna (2012) belegen den „Visual Depiction Effect“. Ist ein Produkt so abgebildet, dass man es in Gedanken greifen kann (Griff, Lehne, Kante zur Hand des Betrachters), steigt die Kaufabsicht. Quelle: *Journal of Consumer Research* 38(6), 988–1003.
- Park, Lennon und Stoel (2005) zeigen: **Zoom und Produktbewegung** senken das wahrgenommene Risiko und steigern die Kaufabsicht. Quelle: *Psychology & Marketing* 22(9), 695–719.
- Brasel und Gips (2014) zeigen: Wer ein Produktbild auf dem **Touchscreen** berührt, entwickelt mehr gefühlten Besitz als mit der Maus. Quelle: *Journal of Consumer Psychology* 24(2), 226–233.
- **Folgerung:** Jedes Top-Produkt bekommt mindestens **drei Material-Makros** (Naht, Oberfläche, Mechanik oder Kante) in Streiflicht, dazu Texte mit Tastwörtern („kühler Calacatta, satiniert, 12 mm Kante“), Pinch-Zoom auf Mobilgeräten und das Angebot „Stoffmuster nach Hause“ als konkreten Ersatz für das Berühren. Das ist der direkteste Hebel, um Termine und Muster-Anfragen auszulösen.

### E7. Bewegung im Augenwinkel wird immer bemerkt, deshalb ist sie teuer
- Schon das **Einsetzen** von Bewegung fängt Aufmerksamkeit reflexhaft ein. Quelle: Abrams und Christ (2003), *Psychological Science* 14(5), 427–432.
- Das wirkt in beide Richtungen. Eine Animation am CTA lenkt den Blick dorthin. Zehn gleichzeitige Animationen erzeugen Unruhe und senken die Fluency (siehe E1).
- **Folgerung:** Pro Viewport höchstens **ein** sich bewegendes Element. Loops (Hero-Video) laufen langsam: kein Schnitt unter **3 s**, ruhige Kamerabewegung. Ab dem zweiten Viewport gilt „Stille als Standard“. Das deckt sich mit den Motion-Tokens aus Bericht 02 (Eintritt 500–800 ms, Wege 12–32 px).

### E8. Gedämpfte Farbe signalisiert Exklusivität, Sättigung signalisiert Aktivierung
- Labrecque und Milne (2012) zeigen: **Niedrige Sättigung** und dunkle Werte stehen für Raffinesse und Exklusivität, hohe Sättigung steht für Erregung und Aktivität. Quelle: *Journal of the Academy of Marketing Science* 40(5), 711–727.
- Hagtvedt und Brasel (2017) zeigen: Höhere Sättigung lässt Produkte **größer** wirken. Das ist relevant für Möbel-Retusche: keine übersättigten Bilder, sonst wirkt das Sofa auf der Website größer als im Showroom. Quelle: *Journal of Consumer Research* 44(2), 396–413.
- Berger und Ward (2010) und Han, Nunes und Drèze (2010) zeigen: Kenner bevorzugen **leise Signale**, also kleine Logos und subtile Codes. Laute Markenzeichen sprechen eher Aufsteiger an. Quellen: *Journal of Consumer Research* 37(4), 555–569; *Journal of Marketing* 74(4), 15–30.
- **Folgerung:** Die Palette aus Bericht 01 (Paper `#faf8f4`, Ink `#30373e`, Walnut `#3f3129`, Gold unter 2 % der Fläche) ist wissenschaftlich passend. Gold als Flächenbutton wäre ein „lautes Signal“. Bildlook nach dem Fotostil „Seelicht“ (Bericht 12): Sättigung −10 bis −15 %, Farbtemperatur warm-neutral (5000–5500 K Weißabgleich bei Tageslicht).

### E9. Der Eindruck „schön“ färbt das Urteil „gut bedienbar“ und „vertrauenswürdig“
- Kurosu und Kashimura (1995) und Tractinsky, Katz und Ikar (2000) belegen den Aesthetic-Usability-Effekt: Schöne Oberflächen werden als besser bedienbar eingeschätzt, auch nach der Nutzung. Quelle: *Interacting with Computers* 13(2), 127–145.
- Die Kehrseite: Ein Ladefehler oder ein springendes Layout (CLS) beschädigt das Ästhetikurteil sofort. Für die Wahrnehmung ist Performance deshalb Teil der Ästhetik. Ein Hero, der nach 3,4 s erscheint (heutiger LCP), wird in den ersten 50 ms als **leerer, beiger Kasten** beurteilt.
- **Folgerung:** LCP ≤ 2,0 s (Bericht 13) und ein **sofort sichtbarer Poster-Frame** sind eine Bedingung für den ersten Eindruck, nicht nur für SEO.

### E10. Am Ende zählt der Höhepunkt und der Abschluss (Peak-End)
- Erlebnisse werden rückblickend vor allem nach dem **intensivsten Moment** und dem **Ende** bewertet. Quelle: Kahneman, Fredrickson, Schreiber, Redelmeier (1993), *Psychological Science* 4(6), 401–405.
- **Folgerung:** Die Bestätigungsseite nach einer Terminbuchung ist heute ein toter Punkt. Sie wird zum gestalteten Abschluss: Foto der Person, die den Termin übernimmt (Gesicht, direkter Blick), Name, „Wir stellen Ihnen die Stoffe schon bereit“, Anfahrt mit Parkplatz, Kalender-Datei. Das kostet nichts und prägt die Erinnerung an den ganzen Besuch.

---

## 2. Konkrete Vorgaben für den Neuauftritt

### 2.1 Erster Viewport (die 50-ms-Regel)
| # | Vorgabe | Messwert |
|---|---|---|
| V1 | Höchstens **3 visuelle Einheiten** im ersten Viewport: Bild, Headline, ein CTA, dazu Header | Zählen am Screenshot 1440×900 und 390×844 |
| V2 | Header-Elemente sichtbar maximal **7** (Logo, 5 Hauptpunkte, Termin). Suche, Auswahl und Sprache als Icons zusammen höchstens 3 | Zählen |
| V3 | **Ein** Hauptbild auf mindestens **60 % der Viewport-Fläche** (Desktop), kein Slider im Hero | Fläche messen |
| V4 | Headline höchstens **7 Wörter**, Unterzeile höchstens **20 Wörter** | Zählen |
| V5 | Ein einziger gefüllter Button (Ink `#30373e` auf Paper `#faf8f4`, Kontrast 11,3:1), Zielgröße ≥ 44×44 px | Prüfen |
| V6 | Komplexität im Rahmen: Bilddateigröße des Viewport-Screenshots als JPEG Q80 ≤ 180 KB (grober Proxy für visuelle Komplexität nach Reinecke/Tuch, Schwelle aus Vergleich mit den Benchmarks Minotti und Poliform festlegen) | Screenshot exportieren und vergleichen |
| V7 | Poster-Frame ist das LCP-Element und ist nach **≤ 2,0 s** (p75 mobil) da. Kein Weißblitz, kein eingeblendeter Hero (`opacity: 0` am Anfang verboten) | Lighthouse und Feld-Daten |
| V8 | Das Logo steht oben links, die Navigation bleibt horizontal (Desktop) und Burger rechts (Mobil). Keine experimentelle Navigation | Sichtprüfung (Prototypikalität) |

### 2.2 Raster, Weißraum, Dichte
| # | Vorgabe | Messwert |
|---|---|---|
| V9 | Sektionsabstand **160–200 px** Desktop, **96 px** mobil (Bericht 01). Leerer Raum ≥ **40 %** der Fläche pro Viewport auf Inszenierungsseiten (Start, Marke, Projekt) | Pixel-Anteil der Hintergrundfarbe im Screenshot |
| V10 | Produktgalerien: Desktop höchstens **3 Spalten**, Spaltenabstand ≥ **32 px**, Produktbild 4:5. Mobil **1 bis 2 Spalten**. Ein Raster mit 4 und mehr Spalten nur in der Suchansicht | Prüfen |
| V11 | Pro Galerie-Reihe alle **6 bis 9 Produkte** ein „Atemzug“: ein ganzseitiges Raum- oder Materialbild (Space-to-Product-Effekt) | Prüfen |
| V12 | Text höchstens **68 Zeichen** pro Zeile, Fließtext 17–18 px, Zeilenhöhe 1,6 | Messen |

### 2.3 Bilder: Größe, Blick, Haptik
| # | Vorgabe | Messwert |
|---|---|---|
| V13 | Produktseite Desktop: Hauptbild ≥ **50 % Viewport-Breite** und ≥ **70 % Viewport-Höhe**. Mobil volle Breite, 4:5 | Messen |
| V14 | Pro Top-Produkt mindestens **6 Bilder**: 1 freigestellt, 1 im Raum, **3 Material-Makros** (Bildausschnitt ≤ 20 × 20 cm am Objekt, Streiflicht 20–35° zur Oberfläche), 1 Detail Mechanik oder Kante | Zählen |
| V15 | Zoom: Pinch-Zoom und Doppeltipp auf Mobilgeräten, auf dem Desktop Klick-Lightbox mit **2× bis 3× nativer Auflösung** (Quellbild ≥ 2400 px lange Kante). Kein Hover-Lupen-Effekt, der den Cursor verdeckt | Prüfen |
| V16 | Produktausrichtung: Griffe, Lehnen und Armlehnen zeigen **nach rechts unten** zum Betrachter (Rechtshänder-Mehrheit, Elder und Krishna 2012). Hero-Möbel nicht angeschnitten (Bericht 12) | Sichtprüfung |
| V17 | Szenenbilder mit Person: Blick oder Hand zeigt **auf Produkt, Headline oder CTA**, nie aus dem Bild hinaus. Bild-Text-Paare so platzieren, dass die Blickachse auf den Text trifft (Person links im Bild, Text rechts daneben oder umgekehrt) | Sichtprüfung |
| V18 | Porträts mit direktem Blick nur auf Team, Termin, Café und Bestätigungsseite. Mindestens **1 Gesicht** auf der Startseite, und zwar ein echter Mensch aus dem Team (mit Einwilligung, DSGVO) | Zählen |
| V19 | Bildlook: Sättigung −10 bis −15 % gegen RAW-Standard, keine Vignette, kein HDR, Weißabgleich warm-neutral. Ein gemeinsames Preset für alle | Preset-Datei existiert |
| V20 | Tastwörter in Produkttexten: mindestens **2 haptische Adjektive** pro Produkt (Temperatur, Oberfläche, Gewicht, Nachgeben), konkret und belegt („Feder-Daunen-Polster, gibt etwa 3 cm nach“), keine Floskeln | Textprüfung |
| V21 | Unter jedem Polster-, Stein- und Holzprodukt der CTA **„Muster anfordern“** oder **„Im Showroom anfassen“**. Der haptische Ersatz wird damit zur Handlung | Prüfen |

### 2.4 Bewegung (Wahrnehmungsseite, ergänzt Bericht 02)
| # | Vorgabe | Messwert |
|---|---|---|
| V22 | Pro Viewport höchstens **1** gleichzeitig laufende Animation (Ausnahme: Hover-Rückmeldung) | Prüfen per Screen-Recording |
| V23 | Reveals: 500–800 ms, Weg 12–32 px, Kurve `cubic-bezier(0.22, 1, 0.36, 1)`. Kein Stagger über **4 Elemente**, Abstand zwischen den Elementen 60–80 ms | Prüfen |
| V24 | Hero-Video: 8–12 s Loop, mindestens **3 s** pro Einstellung, Kamerafahrt höchstens 5 % der Bildbreite pro Sekunde, sichtbarer Pause-Knopf | Prüfen |
| V25 | Scroll-Verhalten fühlt sich nativ an. Wird Lenis überhaupt eingesetzt, dann nur mit `lerp` ≥ 0,1 (keine spürbare Trägheit), aus auf Touch-Geräten und bei `prefers-reduced-motion`. Bericht 01 und 02 empfehlen, ganz darauf zu verzichten, und das ist auch aus Wahrnehmungssicht die sichere Wahl, weil Kontrollverlust beim Scrollen die Fluency senkt (NN/g, „Scrolljacking 101“) | Test mit Trackpad und Mausrad |
| V26 | Shared-Element-Übergang Katalog → Produkt (View Transition, 450 ms). Damit bleibt das Objekt im Blick und die Orientierung erhalten (Objektpermanenz) | Prüfen |

### 2.5 Ton
| # | Vorgabe |
|---|---|
| V27 | **Kein** Autoplay mit Ton, nirgends (WCAG 1.4.2, und Ton ohne Zustimmung wird als Übergriff erlebt). |
| V28 | Ton nur auf Klick: zum Beispiel „Ein Abend im Café, 40 s mit Ton“. Leise Raumakustik (Espressomaschine, Gespräche, Schritte auf Eiche) wirkt glaubwürdiger als Musik. Lautstärke der Mischung auf **−16 LUFS** (Webstandard), damit sie nicht erschreckt. |
| V29 | Wenn Musik: italienisch geprägte, ruhige Instrumentalmusik, lizenziert. Musik verschiebt Präferenzen messbar in Richtung des musikalisch angedeuteten Landes (North, Hargreaves, McKendrick 1999, *Journal of Applied Psychology* 84(2), 271–276, Weinregal-Studie im Laden). Online ist das nicht repliziert, deshalb als Test markieren. |
| V30 | Untertitel für jedes Video mit Sprache (WCAG 1.2.2, BaFG/BFSG). |

### 2.6 Preise und Zahlen (Wahrnehmung, rechtlich sauber)
| # | Vorgabe |
|---|---|
| V31 | Preise **gerundet** darstellen, wo es rechtlich zulässig ist („ab 12.400 €“ statt „ab 12.387,90 €“). Runde Zahlen fühlen sich bei emotionalen Käufen „richtig“ an (Wadhwa und Zhang 2015, *Journal of Consumer Research* 41(5), 1172–1185). Endpreis inklusive MWST nach PAngV/PrAG. Der genaue Preis steht im Angebot. |
| V32 | Preise in der Fließtextschrift, gleiche Größe wie der Produkttext, `tabular-nums`. Keine roten Preise, keine Streichpreise außer im Atelierverkauf mit korrekter 30-Tage-Angabe (Omnibus). |

---

## 3. Ideen, die die Konkurrenz alt aussehen lassen

1. **„Fühlen Sie hin“: das haptische Makro-Kapitel auf jeder Produktseite.** Eine vollbreite Sequenz aus drei Makros mit Streiflicht, die beim Scrollen jeweils um höchstens 3 % näher zoomt (Scale 1,00 → 1,03). Darunter stehen ein Satz Tastwörter und der Knopf „Muster nach Hause“. Weder Höttges noch reiter design oder Fretz zeigen Materialien so. Das zielt direkt auf die Kaufbarriere „Need for Touch“ (Peck und Childers 2003).
2. **Ein Gastgeber-Gesicht statt eines Logos auf der Termin-Seite.** Wer einen Termin bucht, sieht, **wer** ihn empfängt (Foto, Name, „Ich koche Ihnen den Espresso“). Laut Cyr u. a. (2009) steigert ein Gesicht die gefühlte Wärme. Kein Wettbewerber in der Region personalisiert seine Buchungsstrecke.
3. **Das „Seelicht“-Video ohne Ton im Hero, mit Ton nur auf Wunsch.** 10 s, drei Einstellungen: Morgenlicht auf dem See → Hand über Minotti-Bouclé → Tasse auf Calacatta-Platte. Die Fassung mit Ton (Café-Atmosphäre, 40 s) gibt es auf Klick. Der Ort wird zum Sinneserlebnis, und das ist Alleinstellung 1 (Gastgeberort).
4. **Galerie-Rhythmus mit Atemzügen.** Der Katalog wirkt wie ein Ausstellungsraum: 3 Spalten, nach jeweils 6 bis 9 Produkten ein Raum- oder Materialbild über die volle Breite. Das ist Sevilla und Townsend (2016) direkt angewandt. Die Wettbewerber zeigen enge Raster oder gar keine Kataloge.
5. **Der „Abschlussmoment“ nach der Buchung (Peak-End).** Eine Bestätigungsseite mit Gesicht, Name, Anfahrt, „Ihre Auswahl liegt bereit“ und einer persönlichen E-Mail mit einem Foto der vorbereiteten Stoffe am Vortag (nur mit Einwilligung). Das ist der intensivste und günstigste Moment, um im Gedächtnis zu bleiben.
6. **Blickachsen-Layout auf Projektseiten.** Jedes Projekt eröffnet mit einer Person im Raum, die zum Fenster und zum See schaut, der Text steht in Blickrichtung. Bei Sajjacholapunt und Ball (2014) steigert abgewandter Blick die Aufmerksamkeit für Text und Marke. Das ist ein subtiles Mittel, das man nicht als Mittel erkennt.
7. **Dreiländer-Vertrauen über Gesichter statt Flaggen.** Auf der Schweiz-Seite erscheinen die Montagepartner aus der Schweiz mit Gesicht und Namen. Flaggen und Siegel wirken laut, Menschen wirken leise und glaubwürdig.
8. **Wahrnehmungstest als Teil des Prozesses.** Jeder neue Seitentyp durchläuft vor dem Launch einen 50-ms-Test (Lindgaard-Methode) und eine Saliency-Vorhersage (z. B. das Open-Source-Modell DeepGaze IIE, MIT/Tübingen Saliency Benchmark). Kein Wettbewerber in der Region arbeitet nachweislich so. Es kostet einen halben Tag pro Seitentyp.

---

## 4. Was man auf keinen Fall tun darf

1. **Keine künstliche Knappheit und kein Zeitdruck.** Gemeint sind „Nur noch 2 verfügbar“ (wenn nicht nachprüfbar wahr), Countdowns, „3 Personen sehen sich das gerade an“. Das ist in der EU unzulässig (UGP-Richtlinie 2005/29/EG Anhang I Nr. 7, § 2 Abs. 4 UWG AT mit Anhang Z 7, § 5 UWG DE, DSA Art. 25 für Plattformen) und zerstört bei Luxus das Signal „Wir haben es nicht nötig“ (Berger und Ward 2010). Dasselbe gilt für Confirmshaming („Nein, ich will kein schönes Zuhause“), vorangekreuzte Kästchen und versteckte Kosten.
2. **Keine Neuheit in der Bedienung.** Keine Navigation nur über Kreise oder Hover-Erkundung, keine versteckten Menüs auf dem Desktop, keine horizontal scrollenden Hauptseiten. Neuheit im Gerüst kostet Prototypikalität, und die wird in 50 ms bestraft (Tuch u. a. 2012).
3. **Kein Bewegungsfeuerwerk.** Keine Parallax-Ebenen in mehreren Schichten, kein Cursor-Follower, keine Text-Scrambles und keine Wort-für-Wort-Reveals in der Headline. Jede davon zieht reflexhaft Aufmerksamkeit (Abrams und Christ 2003) weg von Produkt und CTA.
4. **Kein Autoplay mit Ton.** Auch nicht „nur leise“.
5. **Keine Stockfotos und keine KI-Räume, die wie echte Projekte wirken.** Sie werden ignoriert (NN/g 2010) und täuschen (UWG). KI-Bilder sind nur als erkennbar gekennzeichnete Visualisierung zulässig (AI Act Art. 50).
6. **Keine dichten Raster als Standard.** Keine 4- bis 5-spaltigen Produktwände mit „Neu“-, „-20 %“- und „Bestseller“-Badges. Das ist die Ästhetik von Möbelhäusern und senkt den wahrgenommenen Wert (Sevilla und Townsend 2016).
7. **Keine Gold-Flächen und keine übersättigten Bilder.** Gold-Buttons, Gold-Verläufe und Gold-Linien unter jeder Überschrift sind laute Signale. Übersättigte Retusche lässt Möbel größer wirken, als sie sind (Hagtvedt und Brasel 2017), und das führt zu Enttäuschung im Showroom.
8. **Keine Porträts mit direktem Blick neben Produkten.** Ein Gesicht mit direktem Blick zieht die Aufmerksamkeit vom Produkt ab (Sajjacholapunt und Ball 2014). Neben Produkten gilt deshalb: Blick zum Produkt.
9. **Kein Hero, der eingeblendet wird.** Startet der Hero bei `opacity: 0`, sieht der Besucher in den entscheidenden ersten 50 ms eine leere Fläche.
10. **Kein „Neuro“-Marketingsprech in Texten.** Formeln wie „Unser Design aktiviert Ihr Belohnungszentrum“ sind unseriös und widersprechen der Markenstimme (Bericht 12).

---

## 5. Prüf-Checkliste für die drei Prototypen (galerie, buehne, dreilaendereck)

**Durchführung**, je Prototyp etwa 2 Stunden:
- **A. Screenshots** des ersten Viewports bei 1440×900 und 390×844, außerdem je eine Produktseite oder Detailsektion.
- **B. 50-ms-Test (Lindgaard):** 15 Personen aus der Zielgruppe (ab 40 Jahren, Eigentum, mindestens 3 Architekten). Jeder Screenshot wird 50 ms gezeigt, danach folgt eine Maske. Die Personen bewerten auf einer Skala von 1 bis 9: „hochwertig“, „vertrauenswürdig“, „ruhig“, „würde ich weiter ansehen“. Unter die Prototypen werden zwei Referenzen gemischt (minotti.com, hoettges.at), damit ein Maßstab entsteht. Das Tool kann einfach sein, etwa eine lokale HTML-Seite mit `setTimeout(50)` und Maskenbild.
- **C. 5-Sekunden-Test:** „Was ist das für ein Unternehmen? Wo ist es? Was können Sie hier tun?“
- **D. Saliency-Vorhersage** (DeepGaze IIE oder ein vergleichbares Open-Source-Modell, lokal auf der vorhandenen NVIDIA-GPU) auf jedem Screenshot. Gefragt wird: Liegen die heißesten Zonen auf Produkt, Headline und CTA?
- **E. Screen-Recording** beim Scrollen, um Animationen pro Viewport zu zählen.

**Punkteskala je Kriterium:** 0 = nicht erfüllt oder schädlich · 1 = teilweise · 2 = erfüllt · 3 = vorbildlich, besser als jeder Wettbewerber. Die Gewichtung steht in Klammern.

| # | Kriterium | Prüfmethode | 0 | 3 | Gewicht |
|---|---|---|---|---|---|
| K1 | **Erster Eindruck in 50 ms** (Mittel aus „hochwertig“ und „vertrauenswürdig“) | Test B | unter 5,0 oder schlechter als hoettges.at | ≥ 7,0 und mindestens auf Minotti-Niveau | ×3 |
| K2 | **Geringe visuelle Komplexität** im ersten Viewport | V1–V4, V6 zählen | > 6 Einheiten, Slider, mehrere CTAs | ≤ 3 Einheiten, ein Bild, ein CTA | ×3 |
| K3 | **Prototypisches Gerüst** (Logo, Menü, Termin dort, wo man sie erwartet) | V8, Test C: findet man den Termin in < 5 s? | Navigation ungewohnt, Termin nicht gefunden | alles sofort gefunden, 14 von 15 Personen beschreiben richtig, was das Unternehmen ist | ×2 |
| K4 | **Neuheit am richtigen Ort** (MAYA): unverwechselbar in Bild, Typografie und Rhythmus | Frage nach Test B: „Erinnert Sie das an eine andere Seite?“ | „sieht aus wie jeder Möbelhändler“ | Wiedererkennung ohne Logo, kein Teilnehmer nennt einen Wettbewerber | ×2 |
| K5 | **Weißraum und Dichte** | V9–V11, Pixel-Anteil Hintergrund | < 25 % leer, Raster mit 4+ Spalten | ≥ 40 % leer, 3 Spalten, Atemzüge | ×2 |
| K6 | **Bildgröße und Lenkung der Aufmerksamkeit** | V3, V13, Saliency-Karte (D) | Hotspot auf Deko, Text oder Ränder | die 3 stärksten Hotspots liegen auf Produkt, Headline und CTA | ×2 |
| K7 | **Gesichter und Blickrichtung** | V17, V18 | keine Menschen oder direkter Blick neben Produkten | Gastgeber-Gesicht auf Start und Termin, Blickachsen führen zu Text und CTA | ×1 |
| K8 | **Haptische Vorstellung** | V14–V16, V20, V21 | nur freigestellte Bilder, kein Zoom | ≥ 3 Makros, Pinch-Zoom, Tastwörter, CTA „Muster“ | ×2 |
| K9 | **Bewegung: dosiert und sinnvoll** | Recording (E), V22–V26 | > 2 gleichzeitige Animationen, Scroll fühlt sich fremd an | höchstens 1 Bewegung pro Viewport, Übergänge halten das Objekt, nativer Scroll | ×2 |
| K10 | **Reduced Motion und Ton** | Betriebssystem auf `reduce` stellen, Ton prüfen | Video und Animationen laufen weiter, Ton automatisch an | alles ruhig, Crossfades ≤ 150 ms, Ton nur auf Klick, Pause-Knopf | ×1 |
| K11 | **Farbe und Signalstärke** | Pipette, Gold-Anteil, Bildsättigung | Gold-Flächen, gesättigte Bilder, Badges | Gold < 2 %, eine dunkle Fläche, gedämpfter Bildlook | ×1 |
| K12 | **Wahrgenommene Geschwindigkeit** | Lighthouse mobil, Filmstreifen | Hero erscheint nach > 2,5 s oder wird eingeblendet, CLS sichtbar | Poster ≤ 2,0 s, kein Sprung, kein Weißblitz | ×2 |
| K13 | **Abschlussmoment (Peak-End)** | Termin-Strecke bis zur Bestätigung durchspielen | Standard-„Danke“-Text | Gesicht, Name, Anfahrt, Kalender, nächster Schritt | ×1 |
| K14 | **Keine Dark Patterns** (Ausschlusskriterium) | Durchsicht nach Abschnitt 4, Punkt 1 | auch nur ein Fund = **Prototyp disqualifiziert**, bis behoben | – | Pflicht |

**Auswertung:** Maximal erreichbar sind (3+3+2+2+2+2+1+2+2+1+1+2+1) × 3 = **72 Punkte**.
- **≥ 58 Punkte (80 %):** Der Prototyp ist bereit, als Grundlage zu dienen.
- **43 bis 57 Punkte:** Er hat brauchbare Elemente. Die besten Kriterien werden in den Sieger übernommen.
- **< 43 Punkte oder K1 bzw. K2 mit 0 bewertet:** verwerfen. Der erste Eindruck lässt sich später nicht mehr reparieren.

**Entscheidungsregel bei Gleichstand:** Es gewinnt der Prototyp mit dem höheren K1-Wert bei den **Architekten**. Sie sind die strengsten Betrachter und vervielfachen Aufträge.

---

## Quellen

- Abrams, R. A., & Christ, S. E. (2003). Motion onset captures attention. *Psychological Science*, 14(5), 427–432.
- Berger, J., & Ward, M. (2010). Subtle signals of inconspicuous consumption. *Journal of Consumer Research*, 37(4), 555–569.
- Brasel, S. A., & Gips, J. (2014). Tablets, touchscreens, and touchpads: How varying touch interfaces trigger psychological ownership and endowment. *Journal of Consumer Psychology*, 24(2), 226–233.
- Cyr, D., Head, M., Larios, H., & Pan, B. (2009). Exploring human images in website design: A multi-method approach. *MIS Quarterly*, 33(3), 539–566. [aisel.aisnet.org/misq/vol33/iss3/8](https://aisel.aisnet.org/misq/vol33/iss3/8)
- Elder, R. S., & Krishna, A. (2012). The "visual depiction effect" in advertising. *Journal of Consumer Research*, 38(6), 988–1003. [scholarsarchive.byu.edu/facpub/8438](https://scholarsarchive.byu.edu/facpub/8438)
- Hagtvedt, H., & Brasel, S. A. (2017). Color saturation increases perceived product size. *Journal of Consumer Research*, 44(2), 396–413.
- Han, Y. J., Nunes, J. C., & Drèze, X. (2010). Signaling status with luxury goods: The role of brand prominence. *Journal of Marketing*, 74(4), 15–30.
- Hekkert, P., Snelders, D., & van Wieringen, P. C. W. (2003). "Most advanced, yet acceptable": Typicality and novelty as joint predictors of aesthetic preference. *British Journal of Psychology*, 94(1), 111–124.
- Hutton, S. B., & Nolte, S. (2011). The effect of gaze cues on attention to print advertisements. *Applied Cognitive Psychology*, 25(6), 887–892.
- Kahneman, D., Fredrickson, B. L., Schreiber, C. A., & Redelmeier, D. A. (1993). When more pain is preferred to less: Adding a better end. *Psychological Science*, 4(6), 401–405.
- Labrecque, L. I., & Milne, G. R. (2012). Exciting red and competent blue: The importance of color in marketing. *Journal of the Academy of Marketing Science*, 40(5), 711–727.
- Lindgaard, G., Fernandes, G., Dudek, C., & Brown, J. (2006). Attention web designers: You have 50 milliseconds to make a good first impression! *Behaviour & Information Technology*, 25(2), 115–126.
- Nielsen, J. (2010). Photos as web content. Nielsen Norman Group, nngroup.com.
- North, A. C., Hargreaves, D. J., & McKendrick, J. (1999). The influence of in-store music on wine selections. *Journal of Applied Psychology*, 84(2), 271–276.
- Park, J., Lennon, S. J., & Stoel, L. (2005). On-line product presentation: Effects on mood, perceived risk, and purchase intention. *Psychology & Marketing*, 22(9), 695–719.
- Peck, J., Barger, V. A., & Webb, A. (2013). In search of a surrogate for touch: The effect of haptic imagery on perceived ownership. *Journal of Consumer Psychology*, 23(2), 189–196.
- Peck, J., & Childers, T. L. (2003). Individual differences in haptic information processing: The "need for touch" scale. *Journal of Consumer Research*, 30(3), 430–442. Dazu: To have and to hold: The influence of haptic information on product judgments. *Journal of Marketing*, 67(2), 35–48.
- Pieters, R., & Wedel, M. (2004). Attention capture and transfer in advertising: Brand, pictorial, and text-size effects. *Journal of Marketing*, 68(2), 36–50.
- Pocheptsova, A., Labroo, A. A., & Dhar, R. (2010). Making products feel special: When metacognitive difficulty enhances evaluation. *Journal of Marketing Research*, 47(6), 1059–1069.
- Pracejus, J. W., Olsen, G. D., & O'Guinn, T. C. (2006). How nothing became something: White space, rhetoric, history, and meaning. *Journal of Consumer Research*, 33(1), 82–90.
- Reber, R., Schwarz, N., & Winkielman, P. (2004). Processing fluency and aesthetic pleasure. *Personality and Social Psychology Review*, 8(4), 364–382.
- Reinecke, K., Yeh, T., Miratrix, L., Mardiko, R., Zhao, Y., Liu, J., & Gajos, K. Z. (2013). Predicting users' first impressions of website aesthetics with a quantification of perceived visual complexity and colorfulness. *CHI 2013*, 2049–2058. [PDF](https://kgajos.seas.harvard.edu/papers/reinecke13aesthetics.pdf)
- Sajjacholapunt, P., & Ball, L. J. (2014). The influence of banner advertisements on attention and memory: Human faces with averted gaze can enhance advertising effectiveness. *Frontiers in Psychology*, 5, 166. [PMC3941030](https://pmc.ncbi.nlm.nih.gov/articles/PMC3941030)
- Sevilla, J., & Townsend, C. (2016). The space-to-product ratio effect: How interstitial space influences product aesthetic appeal, store perceptions, and product preference. *Journal of Marketing Research*, 53(5), 665–681.
- Tractinsky, N., Katz, A. S., & Ikar, D. (2000). What is beautiful is usable. *Interacting with Computers*, 13(2), 127–145.
- Tuch, A. N., Presslaber, E. E., Stöcklin, M., Opwis, K., & Bargas-Avila, J. A. (2012). The role of visual complexity and prototypicality regarding first impression of websites. *International Journal of Human-Computer Studies*, 70(11), 794–811. [research.google/pubs/pub38315](https://research.google/pubs/pub38315/)
- Wadhwa, M., & Zhang, K. (2015). This number just feels right: The impact of roundedness of price numbers on product evaluations. *Journal of Consumer Research*, 41(5), 1172–1185.

**Hinweis zur Belegtiefe:** Die Kernbefunde E1, E3, E5 und E6 wurden am 26.10.2026 per Websuche gegen die Abstracts geprüft (Tuch, Reinecke, Sevilla/Townsend, Cyr, Sajjacholapunt/Ball, Peck/Barger/Webb, Elder/Krishna, Pocheptsova). Die übrigen Angaben stammen aus der Fachliteratur, Seitenzahlen sind vor einer Veröffentlichung nachzuprüfen. Die Musik-Studie (North u. a. 1999) bezieht sich auf den Laden, nicht auf das Web. Die Schwellenwerte V6 und V9 sind Arbeitswerte und werden an den Benchmarks kalibriert.
