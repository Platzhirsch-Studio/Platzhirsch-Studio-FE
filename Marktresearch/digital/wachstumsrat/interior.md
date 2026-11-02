# Wachstumsrat – Interior Designer & Einrichtungsberater (Kürzel: interior)

**Stand:** 28.10.2026 · **Rolle:** Interior Designerin und Einrichtungsberaterin mit Erfahrung in Showroom, Hausbesuch, Bezugsberatung und Objekt
**Geprüft (nur lesend):** Sofaplaner (`src/components/Labs/Sofaplaner/*`, `src/lib/sofaplaner/*`), Stil-Finder (`src/components/Labs/Stilfinder/*`), Produktseite (`src/components/ShopCatalog/productInfoTabs.js`, kuratierte Texte in `Marktresearch/content/produkte/*.json`), Markenseite (`src/components/MarkenItems/markenitems.js`, `src/messages/de.json` → `marken`), Beratungsseite (`src/components/Beratung/advice.js`, `inhalt.beratung`), bestehende Ratgeber (`Marktresearch/content/ratgeber/*.md`, 8 Stück), Vorarbeit `digital/expertenrat/17-moebelberatung-praxis.md`, Themenplan `digital/12-content-storytelling.md`.
**Screenshots:** nicht möglich. Der Dev-Server auf :3000 lieferte am 28.10.2026 für `/de/labs/sofaplaner` und `/de/labs/stilfinder` HTTP 500, :4545 lieferte 404 (laufende Umbauten anderer Teams). Bewertet wurde deshalb der Code und der Text.
**Kennzeichnung:** [Quelle] belegt · [Praxiswert] übliche Fachwerte aus Planung und Montage, vor Veröffentlichung vom Team bestätigen · [Schätzung] eigene Annahme, keine Messung · [prüfen] Daten fehlen, Inhaber oder Hersteller liefern.
**Händler-Aussagen:** In allen Textvorschlägen nur für ClassiCon und Ezarri. Alle anderen Marken heißen „Marken, die wir planen und liefern“ oder „aus unserem Katalog“.

---

## 1. Urteil zum Ist-Stand

| Bereich | Note (1–10) | Kurzbegründung |
|---|---|---|
| Sofaplaner | **7** | Technisch stark und fachlich sauber: echte Herstellermaße, Laufwege 80–90 cm, Türschwenk, Fensterbrüstung, fehlende Maße werden offen markiert, kein erfundener Wert. Was fehlt, ist die Beratung **vor** der Modellwahl. Der Planer fragt nach Form, Gesamttiefe und Höhe, aber nicht danach, wie jemand sitzt, wer das Sofa nutzt und wo es steht. |
| Stil-Finder | **7** | Bildsprache, Paletten und Profiltexte haben Niveau, die Mischung aus Haupt- und Zweitprofil ist gut gelöst. Es fehlt ein regionales Profil (Alpine Moderne, Vorarlberger Holz). „Seeterrasse“ ist ein Ort und kein Wohnstil. Der nächste Schritt führt pauschal zu `/de/beratung` und nicht in ein passendes Angebot. |
| Produktseiten | **5** | Aufbau, Maßtabelle und Quellen sind gut. Kuratierte Beratungstexte gibt es aber nur für etwa 15 Minotti-Sofas und einige weitere Stücke (4 JSON-Dateien). Beim Rest steht nur der Herstellertext. Pflege, Raumwirkung, Kombinationen, „Steht in Lochau zum Probesitzen“ und Bezugseignung (Haustier, Sonne, Objekt) fehlen fast überall. Von der Produktseite gibt es keinen Link zu Sofaplaner, Stil-Finder oder Ratgeber. |
| Markenseiten | **5** | Sie sind sauber gebaut, aber die Texte sind austauschbar („Sorgfältig gefertigte Stücke, die eine Geschichte erzählen“, „Handwerkliche Disziplinen“). Es fehlt, was eine Beraterin sagen würde: für wen die Marke passt, womit man sie kombiniert, was im Showroom steht und wie die Materialien altern. |
| Beratungsseite | **4** | Sieben Prozessschritte ohne Inhalt („Bedarfsanalyse“, „Wunschanalyse“). Es gibt kein konkretes Angebot, keine Dauer, nicht was der Kunde mitbringt und nicht was er danach in der Hand hat. Genau hier entscheidet sich, ob aus Interesse ein Termin wird. |
| **Gesamt Beratungsqualität online** | **6** | Die Werkzeuge sind besser als bei jedem bekannten regionalen Wettbewerber. Die Beratung zwischen den Werkzeugen fehlt noch. |

---

## 2. Befunde und Chancen

### 2.1 Sofaplaner: fachlich geprüft

**Richtig und gut (bleibt so):**
- Laufweg-Prüfung mit `WALKWAY_MIN = 80` und `WALKWAY_IDEAL = 90` cm (`model.js`). Das ist praxisgerecht. Für einen Hauptdurchgang würde ich 90–100 cm empfehlen, als Mindestwert sind 80 cm korrekt. [Praxiswert]
- Hinweis für Hocker und Tisch: „als Fußablage sind 0–45 cm üblich, als Durchgang ab 80 cm“. Fachlich richtig.
- Fensterbrüstung gegen Lehnenhöhe und Türschwenk als Fehler: genau die Fehlkäufe, die im Alltag passieren.
- Fehlende Herstellermaße heißen „Maß im Showroom bestätigen“. Das ist ehrlich und rechtlich sauber.
- Die Anfrage nennt Elemente, Maße, Bezug und den Wunsch „Stoff- und Ledermuster, Probesitzen, Richtpreis“. So kann die Beraterin gut vorbereitet in den Termin gehen.

**Fachliche Korrekturen:**
1. **Der Filter „Tiefe“ ist die Gesamttiefe, nicht die Sitztiefe.** Für das Sitzgefühl zählt die nutzbare Sitztiefe (Vorderkante bis Rückenkissen). Minotti-Loungemodelle haben teils Sitzkissen um 90 cm (z. B. Lawrence), die mit Rückenkissen deutlich kürzer werden [Quelle: Minotti Technical Sheets, siehe 17-moebelberatung-praxis Nr. 6]. Kunden lesen „Tiefe bis 100 cm“ als „sitzt aufrecht“, und das stimmt nicht. → Den Filter umbenennen in „Gesamttiefe“ und einen Filter **„Wie sitzen Sie am liebsten?“** dazunehmen (siehe 3.4).
2. **„Nubuk / Velours“ sind zwei verschiedene Leder.** Nubuk ist die angeschliffene **Narbenseite**, Velours (Wildleder) die **Fleischseite**. Beide sind matt und samtig, Velours ist offener und fleckempfindlicher. → Hinweistext ändern (siehe 3.4). Das Material im 3D-Modell kann gleich bleiben.
3. **Der Hinweis zu Leder ist richtig, aber zu pauschal.** „Direkte Sonne vermeiden“ gilt vor allem für Anilin- und Semianilinleder. Pigmentiertes (gedecktes) Leder bleicht deutlich weniger aus [Quelle: gusti-leder.ch Lederlexikon; leather-dictionary.com]. Wer am See vor der Südverglasung plant, soll den Unterschied kennen.
4. **Heizkörper fehlen in der Raumprüfung.** Sofas und vor allem Leder brauchen Abstand zum Heizkörper (Lederaustrocknung, Wärmestau). [Praxiswert: mind. 30 cm, besser 50 cm. Vor Veröffentlichung im Team bestätigen.] → Öffnungstyp „Heizkörper“ mit Info-Hinweis ergänzen.
5. **Samt:** Der Hinweis „Glanz je nach Lichteinfall“ ist richtig. Ergänzen: Sitzspiegel und Druckstellen im Flor sind warentypisch, kein Mangel. Das ist die häufigste Samt-Reklamation [Praxiswert].

**Was als Beratung fehlt:**
- **Bedarf vor dem Modell.** Wer sitzt (Größe, Alter, Kinder, Hund oder Katze)? Wofür (Lesen, Fernsehen, Liegen, Gäste)? Wo steht es (Südfenster, Sonne, Kamin)? Mit drei Fragen lässt sich die Liste von über 60 Familien auf eine sinnvolle Auswahl kürzen. So arbeitet jede gute Beraterin im Showroom.
- **Bezugseignung.** Je Materialfamilie fehlen Hinweise wie „gut mit Haustieren“, „lichtecht für Sonne“, „pflegeleicht“ und „Objektqualität“. Ohne Minotti-Farbnamen bleibt das rechtlich unproblematisch, weil es nur um allgemeine Materialkunde geht.
- **Ergänzungen zum Sofa.** Nach der Planung sind Couchtisch und Teppich die nächsten Käufe (Cross-Selling). Der Planer kennt das Gesamtmaß und kann Richtgrößen vorschlagen: Teppich etwa 20–30 cm je Seite breiter als das Sofa, Vorderfüße auf dem Teppich [Quelle: Höffner Teppichratgeber], Couchtisch [Praxiswert] etwa halb bis zwei Drittel so lang wie die Sofafront und 40–45 cm Abstand.
- **Lieferweg.** Tür, Lift und Treppe werden nicht abgefragt. Die Checkliste dazu steht schon in 17-moebelberatung-praxis 2.4 und muss nur eingebaut werden.

### 2.2 Stil-Finder: fachlich geprüft

- Die Profiltexte sind treffend und nicht übertrieben. Der Tipp „Pendelleuchte etwa 65 cm über dem Esstisch“ liegt im üblichen Rahmen. Ratgeber nennen 60–80 cm, je nach Leuchte und Blendung [Quelle: hausjournal.net, baur.de]. Die Tipps „Teppich lieber eine Nummer größer“ und „Spiegel gegenüber dem Fenster“ sind richtig.
- **Lücke Region:** Das Einzugsgebiet sind Bregenzerwald, Arlberg, Montafon, Appenzell und Allgäu. Die stärkste regionale Wohnhaltung ist die **Alpine Moderne**: Vorarlberger Holzbau, Eiche und Weißtanne, Loden, Wolle, Naturstein, Kachelofen. Für Chalets, Ferienwohnungen und Hotels ist das das Hauptthema. Ein sechstes Profil (Entwurf in 3.5) passt außerdem zu den Landingpages Arlberg und Appenzell.
- **„Seeterrasse“** führt nur zu Outdoor-Marken. Wer drinnen „hell, Wasser, Leinen“ wählt, bekommt nur Terrassenmöbel. → Profil auf „Seehaus“ erweitern, mit Moodboard innen und außen.
- **Nächster Schritt:** Das Ergebnis kennt den Umfang („Ein Lieblingsstück“, „Ein Raum“, „Mehrere Räume“, „Terrasse & Garten“), führt aber immer zu `/de/beratung`. → Je nach Umfang ein passendes Service-Paket aus Abschnitt 4 anbieten. Außerdem fehlen Links zum Sofaplaner und zu den passenden Ratgebern (die Datei enthält keinen einzigen Verweis darauf).

### 2.3 Produkt- und Markenseiten

- **Kuratierte Beratung erreicht nur einen kleinen Teil des Katalogs.** Die Connery-Beschreibung zeigt, wie es sein soll: Linie, Bauweise, Planung und Polsterung erklärt. Die übrigen Seiten zeigen nur den Herstellertext. → Statt Einzeltexte zu schreiben, **Beratungsbausteine je Kategorie** (Sofa, Sessel, Esstisch, Stuhl, Bett, Teppich, Leuchte, Outdoor), die automatisch unter jedem Produkt dieser Kategorie stehen. Texte in 3.3.
- **Der wichtigste fehlende Satz:** „Dieses Stück steht in Lochau, Probesitzen ohne Termin möglich“ oder „nicht ausgestellt, wir zeigen Ihnen Bezüge und vergleichbare Modelle“. Das braucht ein Feld im Backoffice (`im_showroom: ja/nein/ähnlich`), das der Inhaber pflegt [prüfen]. Es ist der stärkste Grund für einen Besuch. Kein Online-Händler kann ihn liefern.
- **Markenseiten:** Statt „Philosophie & Handwerk“ eine Beraterperspektive in vier Feldern: *Passt zu* · *Wählen Sie eher etwas anderes, wenn* · *Kombiniert gut mit* · *Material und Alterung*. Aus der Sicht der Beratung ist das ehrlich und hilfreich. Es ist auch für SEO und LLM-Antworten wertvoll, weil es Fragen beantwortet, die Herstellerseiten offenlassen. Beispiele in 3.3.
- **Ungenutzter Text mit Risiko:** `marken.serviceText` („österreichweiter Lieferservice“) wird im Code nicht verwendet. Er widerspricht aber Inhaber-Entscheidung Nr. 3 (keine pauschalen Länderversprechen, Markt AT/DE/CH/FL). → Löschen oder ersetzen, damit ihn niemand wieder einbaut.

### 2.4 Was einen Showroom-Besuch unwiderstehlich macht

Ein Online-Händler kann vier Dinge nicht bieten: **Anfassen, Probesitzen, das eigene Licht** (Muster) und **eine Person, die sich vorbereitet hat**. Die Website sollte jeden Besuch als vorbereiteten Termin verkaufen und nicht als „schauen Sie vorbei“.

1. **„Ihr Plan steht schon im Raum.“** Wer mit dem Sofaplaner oder dem Stil-Finder anfragt, findet beim Termin die passenden Bezugsmuster auf dem Tisch, den ausgedruckten Plan und bei ausgestellten Modellen den Platz zum Probesitzen. In der Bestätigungsmail steht: „Wir legen Ihnen bis zu 8 Muster bereit.“
2. **Probesitz-Protokoll.** Zwei bis drei Modelle hintereinander mit Sitzhöhe, Sitztiefe und Härte. Die Beraterin notiert, der Kunde bekommt es per Mail. Das macht den Unterschied zwischen Gefühl und Entscheidung.
3. **Das eigene Licht.** Muster dürfen kostenlos mit nach Hause (siehe Musterbox). Dazu der Satz: „Sehen Sie die Farbe am Abend bei Ihrem Licht, bevor Sie entscheiden.“
4. **Das Café als Gastgeber.** Der Termin beginnt mit einem Kaffee und nicht mit einem Formular. Das ist die eigentliche Besonderheit des Hauses und gehört in jede Terminbestätigung.
5. **Mitbringliste.** Fotos des Raums, Grundriss, Muster von Boden, Vorhang oder Wandfarbe, Lieblingsstück als Foto. Je besser der Kunde vorbereitet ist, desto höher die Abschlussquote [Praxiswert].
6. **Zeitfenster am Abend oder Samstag** für Berufstätige und Kunden aus CH/DE (sofern das Team das abdecken kann [prüfen]).
7. **Die Kinder sind willkommen** (Malset im Café). Paare mit Neubau sind eine Kernzielgruppe.

---

## 3. Fertige Bausteine

### 3.1 Beratungs-Leitfaden: 10 Ratgeber-Themen mit Gliederung

Die Themen ergänzen die 8 bestehenden Ratgeber (Kosten Minotti/Küche, Lieferzeiten, Pflege, Sofa-Checkliste, Arbeitsplatte, Outdoor am See, Schweiz) und decken sich teils mit offenen Nummern aus digital/12 (11, 15, 18, 21, 27). Für jedes Thema: Suchabsicht, Ziel-URL, Gliederung, interne Links, Handlungsaufruf und was vor der Veröffentlichung geprüft werden muss. Maße sind Praxiswerte und vor der Veröffentlichung mit `[prüfen]` zu kennzeichnen, bis das Team sie bestätigt hat (Inhaber-Regel zu Ratgebern mit Prüfstellen).

---

**R1 · Sofabezug wählen: Stoff, Leder, Samt oder Bouclé, und was am See mit Kindern und Hund hält**
*Suchabsicht:* „sofa bezug haustiere“, „welcher sofastoff ist robust“, „martindale wert sofa“ · *URL:* `/de/ratgeber/sofabezug-waehlen-stoffkunde`
1. In 30 Sekunden: die drei Fragen, die den Bezug bestimmen (Wer nutzt das Sofa? Wie viel Sonne? Wie viel Pflege wollen Sie?)
2. Stoffkunde in einfachen Worten
   - Scheuerfestigkeit (Martindale, EN ISO 12947-2): was die Touren bedeuten. Übliche Orientierung [Quelle: 17-moebelberatung-praxis Nr. 5, Herstellerdatenblätter]: Wohnbereich ab etwa 15.000, stark genutzt ab etwa 25.000, Objekt ab etwa 40.000
   - Lichtechtheit (EN ISO 105-B02, Skala 1–8): warum am Südfenster ein höherer Wert zählt. Beispiel aus einem Datenblatt mit 5–7 [Quelle: Ludvig Svensson Produktdatenblatt]
   - Pilling (EN ISO 12945-2): Warum Wolle und Bouclé am Anfang Knötchen bilden und warum das normal ist
3. Materialien im Vergleich (Tabelle: Leinen, Baumwolle, Wolle, Bouclé, Samt, Mikrofaser/Polyester, Outdoorstoff) mit den Spalten *Gefühl · Robustheit · Sonne · Haustier · Pflege · Abziehbar?*
4. Leder: Anilin, Semianilin, pigmentiert, Nubuk, Velours. Was jeweils schön ist und was empfindlich [Quelle: gusti-leder.ch, leather-dictionary.com]
5. Sonderfall Bodensee: helle Räume, große Glasflächen, Seeluft. Was das für Farbe und Material heißt
6. Kinder und Haustiere: Krallen gegen Schlingen (glatte, dichte Gewebe statt Bouclé), abziehbare Bezüge, dunklere Melange-Töne
7. So testen Sie ein Muster zu Hause (Tageslicht und Abendlicht, neben Boden und Vorhang, Fingernagel-Test)
8. FAQ (5 Fragen)
*Links:* Musterbox, Sofaplaner, Pflege-Ratgeber, Produktkategorie Sofas · *CTA:* „Bis zu 6 Muster zu Ihrem Projekt, kostenlos zum Anfassen“ · *Prüfen:* Grenzwerte gegen DIN EN 14465 in aktueller Fassung, Fotos eigener Muster

---

**R2 · Was bei Polstermöbeln normal ist und was ein Mangel: Daune, Feder, Schaum ehrlich erklärt**
*Suchabsicht:* „sofa wellen bezug normal“, „daunen sofa aufschütteln“, „sitzkuhle sofa reklamation“ · *URL:* `/de/ratgeber/polstermoebel-was-normal-ist`
1. Warum ein Premium-Sofa lebt (Füllungen formen sich nach dem Körper)
2. Die Füllungen: Kaltschaum, Schaum mit Daunenkammern, Feder-Daunen-Mix. Sitzgefühl, Pflege, Alterung (Tabelle)
3. Was warentypisch ist: Wellen im Bezug, Sitzspiegel bei Samt, Mastfalten und Narben bei Leder, Pilling bei Wolle, Knittern bei Leinen. Hinweis auf die Gebrauchseigenschaften in RAL-GZ 430 [prüfen: aktuelle Fassung zitieren]
4. Was kein Normalfall ist: gebrochenes Gestell, offene Nähte, Farbabrieb über das Übliche hinaus, Geruch nach Wochen. Was dann zu tun ist (Foto, Kontakt, Ablauf)
5. Die 2-Minuten-Pflege pro Woche: aufschütteln, Kissen tauschen, absaugen mit Polsterdüse
6. Der erste Monat: was Sie erwarten dürfen
7. FAQ
*Links:* Pflege-Ratgeber (bestehend), Nachsorge-Termin (Paket P7), Sofa-Checkliste · *CTA:* „Nach 6 Wochen kommen wir vorbei und richten Ihr Sofa ein, kostenlos“ · *Prüfen:* Gewährleistungsablauf mit Anwalt (digital/14)

---

**R3 · Wohnzimmer planen: die Maße, die wir täglich nennen**
*Suchabsicht:* „wohnzimmer einrichten maße“, „abstand sofa couchtisch“, „sitzabstand fernseher“ · *URL:* `/de/ratgeber/wohnzimmer-planen-masse` (digital/12 Nr. 15; Link von `/de/wohnzimmer-einrichten-vorarlberg`)
1. Erst die Wege, dann die Möbel: Laufwege 80–90 cm, Hauptdurchgang 90–100 cm [Praxiswert, wie im Sofaplaner]
2. Wie groß darf das Sofa sein? Verhältnis zur Wand und zum Raum, Sofa frei im Raum oder an der Wand
3. Couchtisch: Höhe etwa auf Sitzhöhe oder bis 10 cm darunter, Abstand 40–45 cm, Länge etwa halb bis zwei Drittel der Sofafront [Praxiswert]
4. Fernseher: Sitzabstand bei 4K etwa das 1,5-Fache der Bilddiagonale in cm, z. B. 65 Zoll ≈ 2,5 m [Quelle: Samsung AT, netzwelt.de]
5. Sessel und Gesprächsabstand: Gruppen nicht weiter als etwa 2,5–3 m auseinander [Praxiswert]
6. Licht, Steckdosen, Teppich: vor dem Kauf an Bodensteckdosen denken
7. Drei Grundrisse mit Bemaßung (klein 4 × 5 m, mittel 5 × 6 m, offen mit Essbereich)
8. FAQ
*Links:* Sofaplaner (Schritt „Im Raum prüfen“), R4, R5 · *CTA:* „Grundriss hochladen, wir zeichnen Ihnen zwei Varianten“ (Paket P4) · *Prüfen:* Praxiswerte durch Team

---

**R4 · Teppich unter dem Sofa: Größe, Lage, Material, Pflege**
*Suchabsicht:* „teppich größe wohnzimmer“, „teppich unter sofa wie groß“ · *URL:* `/de/ratgeber/teppich-groesse-material` (digital/12 Nr. 27)
1. Die drei Lagen: alle Füße auf dem Teppich, nur die Vorderfüße, frei vor dem Sofa. Wann welche passt
2. Faustregeln: mindestens so breit wie das Sofa, besser 20–30 cm je Seite breiter, Vorderfüße auf dem Teppich [Quelle: Höffner Teppichratgeber], Abstand zur Wand 20–40 cm [Praxiswert, Quelle nur Forum]
3. Ecksofa und U-Form: Teppich in die Ecke ziehen und nicht nur einen schmalen Streifen legen
4. Material: Wolle, Seide/Viskose, Leinen, Outdoor-Teppich (Tabelle mit Gefühl, Fleckverhalten, Fußbodenheizung)
5. Unter dem Esstisch: Stühle müssen auch zurückgeschoben auf dem Teppich stehen (Tisch + etwa 60–70 cm je Seite [Praxiswert])
6. Pflege und Unterlage (Rutschschutz, Fußbodenheizung)
7. FAQ
*Links:* Teppich-Kategorie, R3, Sofaplaner · *CTA:* „Teppich zur Probe: Wir bringen zwei Größen zu Ihnen“ (Teil von Paket P2, [prüfen] Machbarkeit) · *Prüfen:* Teppich-Marken im Katalog

---

**R5 · Licht planen im Wohnraum: drei Ebenen und ein Beispiel**
*Suchabsicht:* „licht planen wohnzimmer“, „indirektes licht wohnzimmer“, „pendelleuchte höhe esstisch“ · *URL:* `/de/ratgeber/licht-planen-drei-ebenen` (digital/12 Nr. 18)
1. Warum Räume abends fremd wirken (alles hängt an einer Deckenleuchte)
2. Die drei Ebenen: Grundlicht, Zonenlicht (Lesen, Essen, Arbeiten), Akzentlicht (Bild, Regal, Pflanze)
3. Lichtfarbe: warmweiß für den Abend, dimmbar. Warum die Lichtfarbe auch die Farbe von Stoff und Holz verändert (Bezug zu R1: Muster am Abend prüfen)
4. Pendel über dem Esstisch: Mitte des Tisches, Unterkante etwa 60–80 cm über der Platte [Quelle: hausjournal.net, baur.de], Länge der Leuchte etwa halb bis zwei Drittel der Tischlänge [Praxiswert]
5. Leselicht neben dem Sofa: Stehleuchte hinter der Schulter, Höhe des Schirms
6. Vor dem Bau denken: Deckenauslässe, Bodensteckdosen, Schalter
7. Beispiel aus Lochau [prüfen: eigenes Projektfoto, Leuchtenmarken aus dem Katalog]
*Links:* Leuchten-Kategorie, R8 · *CTA:* „Lichtberatung beim Einrichtungs-Check“ (Paket P2) · *Prüfen:* Fotos, Marken

---

**R6 · Farben und Materialien kombinieren: Holz, Metall, Stein und Stoff ohne Stilbruch**
*Suchabsicht:* „holzarten kombinieren“, „farben kombinieren wohnzimmer“, „materialmix einrichtung“ · *URL:* `/de/ratgeber/materialien-kombinieren`
1. Die Grundregel der Beratung: eine Hauptfarbe, eine Begleitfarbe, ein Akzent (Verteilung etwa 60/30/10, als Orientierung, nicht als Gesetz)
2. Holztöne mischen: höchstens zwei bis drei, mit klarem Abstand (hell und dunkel statt fast gleich), Unterton warm oder kühl beachten
3. Metalle: ein Hauptmetall, ein Begleiter. Messing und Bronze wirken warm, Aluminium und Chrom kühl
4. Stein: Travertin, Marmor, Keramik. Was zu welchem Holz passt
5. Stoffe in Schichten: glatt, strukturiert, ein Glanzpunkt (Samt, Seide)
6. Die fünf Stilwelten aus dem Stil-Finder als fertige Kombinationen (jeweils Palette + 5 Materialien), plus Alpine Moderne
7. Fehler, die wir oft sehen: alles gleich hell, zu viele Akzente, Boden und Möbel im fast gleichen Holzton
*Links:* Stil-Finder, Musterbox · *CTA:* „Ihren Stil herausfinden, 2 Minuten“ · *Prüfen:* Fotos

---

**R7 · Raumwirkung: kleine, hohe und offene Räume richtig einrichten**
*Suchabsicht:* „kleines wohnzimmer größer wirken“, „offenen wohnraum zonieren“, „hohe räume gemütlich“ · *URL:* `/de/ratgeber/raumwirkung-einrichten`
1. Wie Möbel einen Raum größer, kleiner, höher oder ruhiger machen
2. Kleine Räume: Möbel auf Füßen (Boden sichtbar), niedrige Lehnen, ein großes Stück statt vieler kleiner, Spiegel
3. Hohe Räume und Altbau: Pendel als Ebene, hohe Regale, Vorhänge bis zum Boden
4. Offener Grundriss: Zonen mit Teppich, Licht und Sofarücken. Das Sofa frei im Raum, die Rückseite sichtbar (warum dann die Rückenansicht im Showroom zählt)
5. Licht und Himmelsrichtung: Nordraum warm, Südraum kühl ausgleichen
6. Akustik: Stoffe, Teppiche, Vorhänge in Räumen mit viel Glas (typisch am See)
7. Vorher-Nachher-Beispiele [prüfen: eigene Projekte]
*Links:* R3, R4, Interior-Design-Seite · *CTA:* „Raumkonzept für einen Raum“ (Paket P4)

---

**R8 · Esszimmer planen: Tischgröße, Stühle, Abstände, Licht**
*Suchabsicht:* „esstisch größe 6 personen“, „abstand esstisch wand“, „runder oder eckiger esstisch“ · *URL:* `/de/ratgeber/esszimmer-planen-tischgroesse`
1. Platz pro Person: etwa 60 cm Breite, 40 cm Tiefe fürs Gedeck, komfortabel 70 cm [Quelle: baur.de Tischgröße, hausjournal.net]
2. Abstand zur Wand: etwa 80–90 cm hinter besetzten Stühlen, mit Durchgang ab 100 cm [Quelle: baur.de, hausjournal.net]
3. Rund, oval oder rechteckig: Gesprächsform, Raumform, Tischbein-Position
4. Ausziehtisch: wann er sich lohnt, wie viel Platz ausgezogen frei sein muss
5. Stühle: Sitzhöhe 45–50 cm, 28–32 cm Abstand zur Tischplatte, Armlehnen unter die Platte? [Quelle: hausjournal.net]
6. Bank oder Stühle, Polster oder Holz, Pflege im Alltag
7. Licht: Pendel nach R5
8. Platten: Holz, Keramik, Marmor, Glas (Verweis auf den Arbeitsplatten-Ratgeber)
*Links:* Esstisch-Kategorie, R5, Arbeitsplatten-Ratgeber · *CTA:* „Tisch und Stühle probesitzen, ohne Termin“ [prüfen: Ausstellung]

---

**R9 · Alpine Moderne: Chalet, Ferienwohnung und Hotelzimmer zeitgemäß einrichten**
*Suchabsicht:* „chalet einrichten modern“, „ferienwohnung einrichten arlberg“, „alpiner wohnstil“ · *URL:* `/de/ratgeber/alpine-moderne-chalet-einrichten` (verbindet digital/12 Nr. 21 mit dem neuen Hotel-Ziel)
1. Was Alpine Moderne ausmacht: Vorarlberger Holzbau, wenig Schnitzwerk, viel Material
2. Materialpalette: Eiche geräuchert, Weißtanne, Altholz, Loden, Wolle, Leder, Naturstein, Kachel
3. Robust für Vermietung: Bezüge in Objektqualität, Brandschutz-Prüfungen für Polster nach EN 1021-1/-2 (Zigarette, Streichholz) für den gewerblichen Einsatz [Quelle: measurlabs.com; landesrechtliche Pflichten prüfen], abziehbare Bezüge, dunkle Melange
4. Ablauf „bezugsfertig“: Aufmaß, Konzept, Bestellung, Montage, Wäsche und Geschirr, Schlüsselübergabe
5. Budget-Spannen je Wohnungsgröße [prüfen: aus eigenen Angeboten, nicht erfinden]
6. Vom Chalet zum Hotelzimmer: Musterzimmer, Wiederholung, FF&E-Liste (Verweis auf `wachstumsrat/hotel-contract.md`)
*Links:* Arlberg-, Appenzell-Landingpage, Interior-Design-Seite, Stil-Finder (neues Profil) · *CTA:* „Ferienwohnung bezugsfertig, Erstgespräch vor Ort“ (Paket P5) · *Prüfen:* Brandschutz-Anforderungen AT/CH durch Sachverständigen

---

**R10 · Mit Bestand einrichten: Erbstücke, Kunst und Lieblingsmöbel einbinden**
*Suchabsicht:* „alte und neue möbel kombinieren“, „erbstück modern einrichten“, „bilder aufhängen höhe“ · *URL:* `/de/ratgeber/mit-bestand-einrichten`
1. Warum gute Einrichtung selten bei null beginnt
2. Was bleibt und was geht: drei Fragen (Bedeutung, Qualität, Maß)
3. Alt und neu kombinieren: ein gemeinsamer Nenner (Holzton, Farbe, Linie)
4. Aufarbeiten oder neu beziehen: wann es sich lohnt [prüfen: Polsterei-Partner]
5. Kunst hängen: Bildmitte etwa auf Augenhöhe (~145–155 cm [Praxiswert]), über dem Sofa 20–30 cm Abstand zur Lehne, Gruppen als Block
6. Das Stück, das alles zusammenhält: Teppich, Leuchte, Farbe
*Links:* Einrichtungs-Check (Paket P2), Inzahlungnahme (falls „Circle“ startet, 23, 10.3) · *CTA:* „Wir schauen uns Ihren Bestand an“ (Paket P2)

---

**Reihenfolge für die Redaktion [Schätzung nach Suchvolumen und Umsatznähe]:** R1, R3, R2 (alle drei stützen den Sofaplaner und das Minotti-Kerngeschäft), dann R9 (Hotel- und Chalet-Ziel), R8, R4, R5, R6, R7, R10.

### 3.2 Service-Pakete mit Ablauf und Texten

**Grundsatz:** Jedes Paket hat einen Namen, eine Dauer, ein Ergebnis zum Mitnehmen und einen nächsten Schritt. Preise sind **Vorschläge des Gremiums**. Laut Inhaber-Entscheidungen sind Preise noch nicht freigegeben, er entscheidet. Bezahlte Pakete werden bei einem Auftrag ab einem festen Wert angerechnet. Das ist üblich, senkt die Hemmschwelle und filtert reine Ideensammler. Bei angespannter Finanzlage gilt: **Kein Paket braucht Investitionen**, nur Teamzeit, einen Kalender und Muster, die ohnehin da sind.

| Paket | Für wen | Dauer | Preisvorschlag [Schätzung, Inhaber entscheidet] |
|---|---|---|---|
| P1 Probesitzen mit Plan | Lieblingsstück, Sofaplaner-Anfrage | 60–90 min, Showroom | kostenlos |
| P2 Einrichtungs-Check zu Hause | ein bis zwei Räume, Neubau, Umzug | 90 min vor Ort + Kurzkonzept | 190 € (Vorarlberg, Lindau), Anfahrt außerhalb nach km; ab 3.000 € Auftrag angerechnet |
| P3 Musterbox | alle, die Bezug oder Oberfläche entscheiden | Versand oder Abholung | kostenlos bis 6 Muster, Rückgabe in 14 Tagen [prüfen: Musterverfügbarkeit je Marke] |
| P4 Raumkonzept | ein Raum, ernsthafte Planung | 2 Termine + Konzept in 10 Werktagen | 590–890 € je Raum; ab 10.000 € Auftrag angerechnet |
| P5 Bezugsfertig (Haus, Ferienwohnung, Chalet) | ganzes Objekt, Second Home | nach Projekt | Honorar nach Aufwand oder Pauschale nach Erstgespräch |
| P6 Video-Beratung | CH, DE, Zweitwohnsitz | 30 min | kostenlos |
| P7 Nachsorge nach 6 Wochen | jeder Möbelkauf ab Sofa | 30 min vor Ort oder per Video | kostenlos (Pflicht-Baustein im Prozess) |
| P8 Musterzimmer für Hotels | Hotel, Pension, Gastronomie | nach Projekt | Angebot (siehe `hotel-contract.md`) |

---

#### P1 · Probesitzen mit Plan

**Ablauf (intern):**
1. Die Anfrage kommt aus dem Sofaplaner, dem Stil-Finder oder vom Produkt. Rückruf oder Mail am selben Werktag [nur zusagen, wenn das Team das halten kann].
2. Vorbereitung (15 min): Plan ausdrucken, passende Bezugsmuster bereitlegen (bis 8), Platz im Showroom freiräumen, ein vergleichbares Modell zum Probesitzen auswählen, falls das gewählte nicht ausgestellt ist.
3. Termin: Kaffee im Café → Probesitzen von zwei bis drei Modellen → Probesitz-Protokoll (Sitzhöhe, Sitztiefe, Härte, Notizen) → Bezug in die Hand → Plan anpassen.
4. Am selben Tag: Protokoll und überarbeiteter Plan per Mail, Richtpreis innerhalb von 3 Werktagen.
5. Nach 7 Tagen: kurzer Anruf mit der Frage, ob die Muster bei Ihrem Licht passen.

**Website-Text:**
> **Probesitzen mit Plan**
> Bringen Sie Ihren Plan mit, wir bereiten alles vor. Wenn Sie ankommen, liegen die passenden Bezugsmuster schon auf dem Tisch. Sie sitzen zwei oder drei Modelle Probe, bei einem Kaffee in unserem Café. Wir notieren, wie Sie am liebsten sitzen, und schicken Ihnen alles noch am selben Tag: Plan, Notizen und die Muster, die Sie gewählt haben.
> *Dauer etwa 60 bis 90 Minuten · kostenlos · in Lochau*
> [Termin wählen] · [Plan mitschicken]

**Bestätigungsmail (Auszug):**
> Wir freuen uns auf Sie am {Datum} um {Uhrzeit}. {Beraterin} legt Ihnen bis zu 8 Muster zu Ihrer Planung bereit. Wenn Sie mögen, bringen Sie Fotos Ihres Raums oder ein Muster Ihres Bodens mit, das hilft bei der Farbwahl. Parken können Sie direkt vor dem Haus [prüfen]. Der Kaffee geht auf uns.

---

#### P2 · Einrichtungs-Check zu Hause

**Ablauf:**
1. Buchung online (Paket wählen, Raum, Fotos optional, Wunschtermin). Bestätigung mit Mitbringliste.
2. Vorbereitung: Fotos und Grundriss ansehen, zwei Stilrichtungen vorschlagen (Stil-Finder-Ergebnis, falls vorhanden), Mustertasche packen (Stoffe, Leder, Holz, Stein).
3. Vor Ort (90 min):
   - 15 min Gespräch: Wer wohnt hier, was stört, was bleibt?
   - 30 min Aufmaß: Raum, Fenster, Türen, Heizkörper, Steckdosen, Lichtauslässe, Lieferweg (Checkliste aus 17-moebelberatung-praxis 2.4)
   - 30 min Muster im eigenen Licht, Laufwege mit Klebeband auf dem Boden markieren, Größen zeigen
   - 15 min Zusammenfassung: drei Empfehlungen, die sofort helfen
4. Innerhalb von 5 Werktagen: **Kurzkonzept als PDF** mit Grundriss und Bemaßung, Stilrichtung, Material- und Farbpalette, Produktvorschlägen in zwei Varianten und Richtpreisen.
5. Nach 10 Tagen: Anruf, Einladung zu P1 im Showroom.

**Website-Text:**
> **Einrichtungs-Check bei Ihnen zu Hause**
> Manches sieht man nur vor Ort: wie das Licht am Nachmittag fällt, wie breit die Tür wirklich ist, welcher Holzton zu Ihrem Boden passt. Wir kommen 90 Minuten zu Ihnen, messen auf, legen Muster in Ihr Licht und markieren auf dem Boden, wie groß das neue Sofa wirklich wäre.
> **Sie bekommen:** einen bemaßten Grundriss, eine Material- und Farbpalette und Vorschläge in zwei Varianten mit Richtpreisen, innerhalb von fünf Werktagen.
> **Das kostet:** {Preis} € in Vorarlberg und Lindau. Wenn Sie bei uns ab {Betrag} € bestellen, rechnen wir den Check voll an.
> [Check buchen]

**Mitbringliste (für den Kunden, „Was Sie vorbereiten können“):**
- Grundriss, wenn vorhanden (Foto vom Plan reicht)
- Was bleiben soll: Lieblingsstücke, Erbstücke, Kunst
- Was Sie stört: zu dunkel, zu voll, zu hallig, zu wenig Platz
- Bilder, die Ihnen gefallen (Stil-Finder-Ergebnis, Pinterest, Zeitschrift)
- Ein Budgetrahmen, gern als Spanne

---

#### P3 · Musterbox

**Ablauf:** Der Kunde wählt im Sofaplaner, auf der Produktseite oder nach P1 bis zu 6 Muster. Die Beraterin prüft, ob sie zum Modell passen, und stellt die Auswahl zusammen. Versand innerhalb von 2 Werktagen [prüfen] oder Abholung im Café. Nach 7 Tagen kommt eine Mail („Welches Muster hat gewonnen?“), nach 14 Tagen die Bitte um Rückgabe (Rücksendeetikett oder Abgabe im Café).

**Website-Text:**
> **Muster zum Anfassen**
> Kein Foto zeigt, wie sich ein Stoff anfühlt und wie seine Farbe am Abend bei Ihrem Licht aussieht. Wählen Sie bis zu sechs Muster, wir stellen sie passend zu Ihrem Modell zusammen. Legen Sie sie neben Boden, Vorhang und Wand, morgens und abends.
> *Kostenlos · Versand nach AT, DE, CH und FL oder Abholung in Lochau · Rückgabe in 14 Tagen*

**Tipp-Karte in der Box (Druck A6):**
> 1. Muster bei Tageslicht und abends bei Lampenlicht ansehen.
> 2. Direkt neben Boden und Vorhang legen, nicht auf den weißen Tisch.
> 3. Mit der Hand darüberstreichen, auch gegen den Strich.
> 4. Ein Foto machen und uns schicken, wenn Sie unsicher sind.
> Ihre Beraterin: {Name}, {Telefon}

*Achtung:* Für Minotti und andere Marken keine Farbnamen oder Codes online zeigen, wenn die Unterlagen nur für Händler zugänglich sind (`covers.js` hält das schon so). Die Auswahl der Muster trifft die Beraterin, nicht ein Online-Katalog.

---

#### P4 · Raumkonzept für einen Raum

**Ablauf:** Termin 1 (P2 oder Grundriss-Upload mit Video) → Konzept in 10 Werktagen: Grundriss mit zwei Möblierungsvarianten, Moodboard, Material- und Farbpalette, Produktliste mit Richtpreisen, eine 3D-Ansicht (bestehender Prozess „Visualisierung mit 3D-Rendering“) → Termin 2 im Showroom: Konzept vorstellen, Probesitzen, Muster → Angebot.

**Website-Text:**
> **Raumkonzept**
> Für einen Raum, der von Anfang an stimmt. Wir zeichnen zwei Möblierungsvarianten mit allen Maßen, stellen Materialien und Farben zusammen und zeigen Ihnen den Raum in 3D. Im Showroom sitzen Sie Probe und fühlen die Materialien, bevor Sie entscheiden.
> *Sie bekommen:* Grundriss mit zwei Varianten, Moodboard, Materialpalette, 3D-Ansicht, Produktliste mit Richtpreisen.
> *Zeit:* etwa zwei Wochen vom ersten Termin bis zum Konzept · *Kosten:* {Preis} €, bei Auftrag ab {Betrag} € angerechnet.

---

#### P5 · Bezugsfertig: Haus, Ferienwohnung, Chalet

**Ablauf:** Erstgespräch vor Ort → Konzept für alle Räume (P4 je Raum, mit Mengenrabatt) → ein Angebot mit allem → Koordination von Lieferung und Montage, Textilien, Leuchten, Accessoires (Kerzen, Düfte, Geschirr aus dem Sortiment) → Abnahme mit Fotoprotokoll → Schlüsselübergabe. Nur Koordination der Gewerke, keine Bauleitung (wie bei Outdoor).

**Website-Text:**
> **Bezugsfertig einrichten**
> Für Ferienwohnungen, Chalets und Zweitwohnsitze am See oder in den Bergen. Wir planen alle Räume, bestellen, koordinieren Lieferung und Montage, beziehen die Betten und stellen die Kerzen auf den Tisch. Sie kommen an, und es ist fertig.
> *Ablauf:* Erstgespräch vor Ort · Konzept für alle Räume · ein Angebot · Lieferung und Montage koordiniert · Übergabe mit Fotoprotokoll

---

#### P6 · Video-Beratung (30 Minuten)

> **Video-Beratung**
> Für Kunden aus der Schweiz, aus Deutschland oder mit Zweitwohnsitz: Zeigen Sie uns Ihren Raum per Video, wir zeigen Ihnen Modelle und Bezüge aus dem Showroom. Danach schicken wir Ihnen eine Zusammenfassung und auf Wunsch Muster.
> *30 Minuten · kostenlos · per Link, ohne Installation*

*Hinweis:* Nur ein Tool mit Datenschutzprüfung (digital/14 F8). Kamera-Einwilligung ist nötig, nichts wird aufgezeichnet.

---

#### P7 · Nachsorge nach 6 Wochen

**Warum:** Daunensofas, Leder und Wolle verändern sich in den ersten Wochen. Ein Besuch mit Erklärung verhindert Reklamationen, die eigentlich Warenkunde sind (17-moebelberatung-praxis Nr. 4). Er ist außerdem der natürlichste Moment für Teppich, Leuchte, Kissen, Pflegeset und Weiterempfehlung (Up- und Cross-Selling ohne Druck).

**Ablauf:** Automatischer Termin-Vorschlag 6 Wochen nach Lieferung (CRM, digital/11) → 30 min vor Ort oder per Video: Kissen aufschütteln und richten, Pflege zeigen, Fragen beantworten → Pflegeset zum Mitnehmen oder Kaufen [prüfen: Sortiment] → Frage nach Google-Bewertung (erst nach zufriedenem Termin) → Notiz im Kundenportal.

**Text Erinnerungsmail:**
> Ihr {Modell} wohnt jetzt seit sechs Wochen bei Ihnen. In dieser Zeit setzen sich Daune und Bezug, das ist ganz normal. Wenn Sie mögen, kommen wir kurz vorbei, richten die Kissen und zeigen Ihnen, wie Sie es mit zwei Minuten pro Woche so schön halten wie am ersten Tag. Kostenlos, natürlich.
> [Termin wählen]

---

#### P8 · Musterzimmer für Hotels (Kurzfassung, Details im Gremium Hotel)

> **Ein Zimmer zuerst**
> Bevor 40 Zimmer bestellt werden, richten wir eines fertig ein: mit Bett, Bezug, Licht, Vorhängen und Bad-Mosaik von Ezarri, als deren Vertragshändler wir planen. Sie testen es mit Gästen und Team, dann wiederholen wir es.

*Prüfen:* Objektanforderungen an Bezüge (Brandschutz, Scheuerfestigkeit) und Lieferfähigkeit je Marke für Serien.

### 3.3 Beratungsbausteine für Produkt- und Markenseiten

**A) Kategorie-Baustein „Aus der Beratung“ (automatisch je Kategorie, unter der Maßtabelle)**

*Sofas*
> **Bevor Sie sich entscheiden**
> Die Sitztiefe entscheidet mehr als die Optik. Bis etwa 60 cm sitzen Sie aufrecht, ab etwa 65 cm lehnen Sie sich zurück, tiefe Loungesitze sind zum Liegen gemacht, Rückenkissen machen sie kürzer. Messen Sie Ihr jetziges Sofa: Das ist der beste Vergleich. Im Showroom in Lochau sitzen Sie Probe und nehmen Bezugsmuster mit nach Hause.
> [Im Sofaplaner zusammenstellen] · [Muster anfragen] · [Ratgeber Bezug wählen]

*Sessel*
> Ein Sessel wird zum Lieblingsplatz, wenn Sitzhöhe, Lehne und Licht stimmen. Planen Sie eine Leseleuchte hinter der Schulter und einen Beistelltisch auf Armlehnenhöhe.

*Esstische*
> Rechnen Sie etwa 60 cm Breite pro Person, bequemer sind 70 cm. Hinter den Stühlen braucht es rund 80 bis 90 cm bis zur Wand. Die Pendelleuchte hängt etwa 60 bis 80 cm über der Platte.
> [Ratgeber Esszimmer planen]

*Stühle*
> Zwischen Sitzfläche und Tischplatte sollten 28 bis 32 cm liegen. Prüfen Sie bei Armlehnen, ob sie unter die Platte passen.

*Betten* (Treca und andere)
> Ein Bett entscheidet sich im Liegen. Probeliegen ist im Showroom ohne Termin möglich [prüfen: Ausstellung].

*Teppiche*
> Der Teppich sollte etwa 20 bis 30 cm je Seite breiter sein als das Sofa, die Vorderfüße stehen darauf. Lieber eine Größe größer.

*Leuchten*
> Ein Raum braucht drei Lichtebenen: Grundlicht, Licht zum Lesen und Essen und ein paar Akzente. Warmweiß und dimmbar fühlt sich am Abend am besten an.

*Outdoor*
> Am See zählen Lichtechtheit, schnelles Trocknen und Pflege im Winter. Lesen Sie unseren Ratgeber zu Materialien am See.

**B) Feld „Im Showroom“ (Backoffice, je Produkt, Inhaber pflegt)**
- `ausgestellt`: „Steht in Lochau, Probesitzen ohne Termin.“
- `aehnlich`: „Nicht ausgestellt. Wir zeigen Ihnen ein vergleichbares Modell und die Bezüge.“
- `nein`: „Wir zeigen Ihnen Bezüge und Unterlagen und planen mit Ihnen.“
Ohne gepflegtes Feld steht nichts da. Kein Satz wird geraten.

**C) Markenseiten: vier Felder statt „Philosophie & Handwerk“ (Beispiele zur Freigabe)**

*ClassiCon* (Vertragshändler, Aussage erlaubt)
> **Passt zu:** Räumen, in denen ein Klassiker der Moderne neben neuen Stücken stehen soll. Eileen Gray, Konstantin Grcic und andere Entwürfe [prüfen: Liste im Katalog].
> **Kombiniert gut mit:** ruhigen, großen Sofas und Naturmaterialien.
> **Material und Alterung:** Stahlrohr, Glas, Leder. Langlebig, pflegeleicht.
> **In Lochau:** Wir sind ClassiCon-Vertragshändler und zeigen ausgewählte Stücke [prüfen: welche].

*Minotti* (keine Händler-Aussage)
> **Passt zu:** großen, ruhigen Wohnräumen, offenen Grundrissen und Sofas frei im Raum. Viele Modelle sind modular und sehr tief, zum Liegen gemacht.
> **Wählen Sie eher ein anderes Modell, wenn:** Sie aufrecht sitzen möchten oder wenig Raumtiefe haben. Dann helfen Modelle mit geringerer Sitztiefe oder zusätzliche Rückenkissen. Wir zeigen Ihnen den Unterschied.
> **Material und Alterung:** Daunen und Feder formen sich nach, Bezüge oft abziehbar. Siehe Ratgeber „Was bei Polstermöbeln normal ist“.
> **Planen:** Im Sofaplaner mit allen Elementen und Herstellermaßen.

*Ezarri* (Vertragshändler, Aussage erlaubt)
> **Passt zu:** Pools, Wellnessbereichen, Bädern und Duschen, innen und außen.
> **Kombiniert gut mit:** Naturstein, hellem Holz, Outdoor-Möbeln in Kalk- und Seetönen.
> **In Lochau:** Wir sind Ezarri-Vertragshändler und zeigen Muster in unserem Showroom [prüfen: Mosaik-Muster vorhanden].

### 3.4 Texte und Spezifikation für den Sofaplaner

**Neuer Vorschritt „Wie sitzen Sie?“ (optional, überspringbar, vor Schritt 1)**

| Frage | Optionen | Wirkung |
|---|---|---|
| Wie sitzen Sie am liebsten? | Aufrecht (lesen, reden) · Entspannt angelehnt · Liegen und lümmeln · Von allem etwas | Filter auf veröffentlichte Sitztiefe (`sd`): bis 60 · 60–70 · über 70 cm · alle [Praxiswerte, Grenzen im Team bestätigen]. Ohne `sd` bleibt die Familie sichtbar und trägt den Hinweis „Sitztiefe im Showroom bestätigen“ |
| Wer nutzt das Sofa? | Erwachsene · Kinder · Hund oder Katze · Gäste zum Übernachten | Bezugs-Hinweise in Schritt 4; „Gäste“ setzt den Filter Sofabett |
| Wo steht es? | An der Wand · Frei im Raum · Am großen Fenster · Draußen | „Frei im Raum“: Hinweis Rückenansicht und Insel-Formen; „Fenster“: Hinweis Lichtechtheit, Leder pigmentiert; „Draußen“: Filter Outdoor |

Text über den Fragen:
> **Drei Fragen, dann passt die Auswahl.** So würden wir auch im Showroom beginnen. Sie können jede Frage überspringen.

**Geänderte Material-Hinweise (`materials.js`, Feld `hint`)**
- stoff: „Fein gewebter Möbelstoff, große Farbauswahl. Dicht gewebte Stoffe sind gut mit Haustieren.“
- struktur: „Bouclé, Wolle oder Leinen-Optik zum Fühlen. Bildet anfangs kleine Knötchen, das ist normal. Mit Katzen eher nicht wählen.“
- samt: „Weicher Flor mit Glanz je nach Licht. Sitzspiegel und Druckstellen gehören dazu.“
- leder: „Langlebig, bekommt Patina. Naturbelassenes Leder bleicht in der Sonne aus, gedecktes Leder ist robuster.“
- nubuk: „Nubuk (angeschliffene Oberseite) und Velours (Wildleder): matt und samtig, empfindlicher gegen Flecken.“
- outdoor: „Lichtecht und schnell trocknend. Über den Winter trocken lagern oder abdecken.“

**Öffnungstyp „Heizkörper“ (Schritt 5):** Info, wenn ein Element näher als {X} cm steht [Praxiswert, X mit dem Team festlegen]: „{Element} steht nah am Heizkörper. Leder und Daune mögen keine direkte Wärme, wir empfehlen etwas Abstand.“

**Schritt 6 „Übersicht“, Block „Passt dazu“:**
> **Passt dazu**
> Teppich: etwa {Sofabreite + 40 bis 60} cm breit, die Vorderfüße stehen darauf.
> Couchtisch: etwa {½ bis ⅔ der Sofafront} cm lang, 40 bis 45 cm Abstand zum Sofa, Höhe auf Sitzhöhe oder bis 10 cm darunter.
> [Teppiche ansehen] · [Couchtische ansehen] · [Ratgeber Wohnzimmer-Maße]

### 3.5 Stil-Finder: sechstes Profil (Entwurf)

```
key: "alpin", slug: "alpine-moderne", name: "Alpine Moderne"
tagline: "Holz, Wolle, Stein – und das Feuer am Abend."
text: "Sie mögen Räume, die nach Material riechen: geräucherte Eiche, Weißtanne,
  Loden und Wolle, ein Stein, der kühl bleibt, und ein Ofen, der wärmt. Nichts
  Rustikales, nichts Verspieltes – klare Formen aus ehrlichem Material, wie in
  den Häusern des Vorarlberger Holzbaus."
keywords: ["Eiche geräuchert", "Weißtanne", "Loden", "Wolle", "Naturstein"]
palette: Schnee #EEEAE2 · Weißtanne #D9C7A8 · Eiche #9A7650 · Loden #5E6450 · Kaminschwarz #2B2826
brands: [prüfen: nur Marken aus dem Online-Katalog, die Holz und Wolle führen]
tip: "Ein Material im Raum zweimal wiederholen – Holz am Boden und am Tisch,
  Wolle am Sofa und am Plaid – und der Raum wirkt ruhig."
```
Dazu je Frage eine Antwortoption mit eigenem Foto [prüfen: Bildrechte, eigenes Projektfoto]. „Seeterrasse“ wird zu **„Seehaus“** mit einem Moodboard aus zwei Dritteln innen und einem Drittel außen.

**Nächster Schritt nach Umfang (`StilResult.js`, Bereich „Next steps“):**

| Antwort „Wie groß ist Ihr Vorhaben?“ | Hauptbutton | Zweitbutton |
|---|---|---|
| Ein Lieblingsstück | „Probesitzen mit Plan“ (P1) | „Im Sofaplaner zusammenstellen“ |
| Ein Raum | „Einrichtungs-Check zu Hause“ (P2) | „Muster zu Ihrem Stil“ (P3) |
| Mehrere Räume | „Raumkonzept anfragen“ (P4/P5) | „Video-Beratung“ (P6) |
| Terrasse & Garten | „Outdoor planen“ (`/de/outdoor-gartenplanung`) | Ratgeber Outdoor am See |

Darunter: zwei passende Ratgeber je Profil (z. B. Ruhe → R1, R4; Warm → R8, R5; Alpin → R9, R6).

### 3.6 Neuer Text für die Beratungsseite (ersetzt die sieben Schritte ohne Inhalt)

> **So beraten wir**
> Gute Einrichtung beginnt mit Fragen, nicht mit Katalogen. Wer wohnt hier, wie sitzen Sie, wann fällt das Licht? Danach zeigen wir Ihnen drei Möglichkeiten statt dreißig, lassen Sie Probe sitzen und Muster mit nach Hause nehmen und zeichnen alles, bevor wir bestellen.
>
> **Wählen Sie, wie Sie beginnen möchten:**
> Probesitzen mit Plan · Einrichtungs-Check zu Hause · Muster zum Anfassen · Raumkonzept · Bezugsfertig einrichten · Video-Beratung
>
> **Was Sie sich darauf verlassen können**
> Wir zeichnen jede Zusammenstellung, bevor wir bestellen. Sie unterschreiben erst, wenn Maße, Bezug und Lieferweg stimmen. Nach der Lieferung kommen wir noch einmal vorbei.

---

## 4. Maßnahmen-Tabelle

| Prio | Maßnahme | Aufwand | Kosten grob | Erwarteter Umsatzeffekt (Begründung) | Wer |
|---|---|---|---|---|---|
| P0 | Service-Pakete P1, P2, P3, P7 auf `/de/beratung` mit Texten aus 3.2/3.6, Buchung über bestehendes Formular | M | Teamzeit; Preise entscheidet der Inhaber | Hoch [Schätzung]: macht aus „Beratung anfragen“ ein konkretes Angebot. Der Hausbesuch ist im Premium-Möbelhandel der Schritt mit dem höchsten Auftragswert pro Kontakt [Praxiswert]. Bezahlte Checks filtern Ideensammler | Code-Team + Inhaber |
| P0 | Feld „Im Showroom“ (ausgestellt/ähnlich/nein) im Backoffice + Anzeige auf Produktseite | S (Code) / M (Pflege) | keine | Hoch: stärkster Besuchsgrund, kein Online-Händler kann ihn bieten | Inhaber pflegt, Code-Team zeigt an |
| P0 | Querverweise: Produktseite (Sofa) → Sofaplaner, Muster, Ratgeber; Stil-Finder → Paket nach Umfang (Tabelle 3.5) | S | keine | Mittel bis hoch: die Werkzeuge existieren, führen aber nicht zum Termin. Jeder fehlende Link verliert vorhandene Interessenten | Code-Team |
| P1 | Sofaplaner: Vorschritt „Wie sitzen Sie?“ + Filter Sitztiefe, Filter „Tiefe“ in „Gesamttiefe“ umbenennen | M | keine | Mittel: weniger falsche Modellwahl, bessere Anfragen, weniger Enttäuschung beim Probesitzen | Code-Team |
| P1 | Material-Hinweise korrigieren (Nubuk/Velours, Leder, Samt, Bouclé) | S | keine | Gering direkt, hoch für Vertrauen und weniger Reklamationen | Code-Team |
| P1 | Kategorie-Bausteine „Aus der Beratung“ (3.3 A) für alle Produktseiten | S–M | keine | Mittel: Beratungsinhalt auf allen Produktseiten statt nur bei den kuratierten, bringt SEO-Text und Antworten auf Kaufhindernisse | Code-Team, Texte freigeben: Inhaber |
| P1 | Ratgeber R1, R2, R3 schreiben und veröffentlichen | M | Redaktion intern oder etwa 300–600 € je Text extern [Schätzung] | Mittel: Suchanfragen mit Kaufabsicht vor dem Sofakauf, stützt das Minotti-Kerngeschäft | Redaktion + Inhaber-Freigabe |
| P1 | Musterbox (P3) mit Tipp-Karte | S | Versand und Druck, gering; Muster [prüfen] | Mittel: die Verbindung zwischen Website und Termin, holt CH/DE-Kunden ab | Inhaber + Team |
| P1 | Nachsorge-Termin P7 als fester Schritt im CRM | S | Teamzeit | Mittel: Folgekäufe (Teppich, Leuchte, Kissen), Bewertungen, weniger Reklamationen | Inhaber + Code-Team (CRM) |
| P2 | Stil-Finder: Profil „Alpine Moderne“, „Seeterrasse“ → „Seehaus“ | M | Fotos [prüfen] | Mittel: Chalet-, Ferienwohnungs- und Hotelkunden aus Arlberg, Bregenzerwald und Appenzell finden sich wieder | Code-Team + Inhaber (Bilder) |
| P2 | Ratgeber R9 (Alpine Moderne, Chalet, Hotel) | M | wie oben | Mittel bis hoch bei Hotels: Einstieg ins Objektgeschäft mit großen Auftragswerten | Redaktion |
| P2 | Markenseiten: vier Beratungsfelder (3.3 C) für die 10 wichtigsten Marken | M | keine | Mittel: einzigartiger Inhalt statt Herstellertext (SEO, LLM-Antworten), ehrliche Einordnung schafft Vertrauen | Redaktion + Inhaber |
| P2 | Sofaplaner: Heizkörper, Lieferweg-Check, Block „Passt dazu“ (Teppich, Couchtisch) | M | keine | Mittel: Cross-Selling direkt im Planer, weniger Lieferprobleme | Code-Team |
| P2 | `marken.serviceText` („österreichweiter Lieferservice“) löschen oder ersetzen | S | keine | Risiko-Vermeidung (Inhaber-Entscheidung Nr. 3) | Code-Team |
| P3 | Ratgeber R4–R8, R10 | L | wie oben | Gering bis mittel je Text, zusammen Sichtbarkeit für Einrichtungsthemen | Redaktion |
| P3 | Pakete P4, P5, P6, P8 ausformulieren und mit Preisen veröffentlichen | M | Teamzeit | Hoch pro Auftrag, wenige Fälle; P8 hängt am Hotel-Konzept | Inhaber |

---

## Quellen

- [Höffner Teppichratgeber Wohnzimmer](https://www.hoeffner.de/teppichratgeber/wohnzimmer) – Teppich 20–30 cm breiter als das Sofa
- [baur.de – Tischgröße](https://www.baur.de/magazin/tisch-groesse) · [hausjournal.net – Platz pro Person](https://www.hausjournal.net/esstisch-platz-pro-person) · [hausjournal.net – Tischgröße](https://www.hausjournal.net/tischgroesse) – 60 cm pro Person, 80–90 cm zur Wand, Pendel 70–80 cm
- [Samsung AT – Abstand zum TV](https://www.samsung.com/at/explore/entertainment/calculate-distance-to-the-tv/) · [netzwelt.de](https://www.netzwelt.de/fernseher/richtige-tv-groesse.html) – Faktor 1,5 bei 4K
- [gusti-leder.ch – Semianilinleder](https://gusti-leder.ch/en/blogs/lederlexikon/semianilinleder) · [leather-dictionary.com – Semi-aniline](https://www.leather-dictionary.com/index.php/Semi-aniline) – Lederarten, UV-Empfindlichkeit
- [ISO 12945-2:2020](https://www.iso.org/standard/75375.html) – Pilling, modifizierte Martindale-Methode
- [Ludvig Svensson Produktdatenblatt (Beispiel)](https://www.ludvigsvensson.com/Temp/ACCESSOIREBOK_ITProductsheet_de-DE.pdf) – Martindale nach EN ISO 12947-2, Lichtechtheit EN ISO 105-B02 Skala 1–8
- [measurlabs – EN 1021-1/-2](https://measurlabs.com/de/produkte/entflammbarkeit-von-polstermobeln--en-1021/) – Zigaretten- und Streichholzprüfung, Objektbereich
- [DIN EN 14465](https://www.dinmedia.de/de/norm/din-en-14465/90850969) – Anforderungen an Möbelbezugsstoffe (über 17-moebelberatung-praxis)
- Interne Vorarbeit: `Marktresearch/digital/expertenrat/17-moebelberatung-praxis.md` (Sitzmaße, Warenkunde, Aufmaß-Checkliste, Widerruf bei Maßanfertigung)
