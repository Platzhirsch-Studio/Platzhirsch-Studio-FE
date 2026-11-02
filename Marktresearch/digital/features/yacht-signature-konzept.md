# Feature: Yacht Interior – Signature-Konzept für /de/yacht-interior

**Stand:** 27.10.2026 · Rolle: Yacht-Interior-Kreativdirektor
**Grundlagen:** [29-geschaeftsfeld-yacht-interior.md](../../29-geschaeftsfeld-yacht-interior.md) · [yacht-landingpage.md](yacht-landingpage.md) · [Design-Bibel](../expertenrat/00-design-bibel.md) · [Rechtspaket](../../recht/00-rechtspaket-uebersicht.md)
**Daten:** `src/lib/yacht/concepts.json` mit 6 Konzepten, 52 Produktzuordnungen, 48 Katalogprodukten und 13 Marken. Jede ID stammt aus dem Backoffice, und alle 48 Produktlinks liefern auf dem Dev-Server HTTP 200 (geprüft am 27.10.2026).

> **Kurzfassung:** Die Seite ist eine **„Werfthalle“**. Ein prozedurales 3D-Boot steht im Mittelpunkt. Man wählt einen der sechs Bootstypen und klickt eine Zone an. Die Kamera fährt dann zur Zone, und ein Konzeptblatt öffnet sich mit Farbwelt, Materialien und echten Produkten aus dem Katalog. Wer die Arbeit macht, steht direkt daneben: Platzhirsch, der Bootssattler oder die Werft. Die Seite gewinnt nicht mit Superlativen. Sie gewinnt, weil keine Bodensee-Seite und kein Superyacht-Studio das Interior **zum Anfassen und Zone für Zone** zeigt.

---

## 1. Recherche: Was die besten Yacht-Studios zeigen und was ihnen fehlt

| Studio / Referenz | Was die Website macht | Was wir lernen | Quelle |
|---|---|---|---|
| **Winch Design** (London) | Ein langer Bild-Scroll mit dem Leitsatz „where imagination meets timeless design“. Das Portfolio ist nach Disziplinen sortiert (Yachten, Aviation, Architektur), dazu kommen Lightbox-Galerien und ein News-Strom | Große Bilder und wenig Text. Das Studio wirkt aktiv, weil der News-Strom laufend neue Projekte zeigt | https://www.winchdesign.com/ |
| **Vripack** (NL) | Projektkacheln mit je einem Leitsatz, etwa „Home, Reimagined at Sea“ oder „The Quiet Revolution“. Dazu eine Dokumentation und „The Voice of the Creators“ | **Ein Satz pro Projekt** macht aus einer Kachel eine Geschichte. Unsere Konzepte bekommen deshalb je einen Leitsatz | https://www.vripack.com/ |
| **Bannenberg & Rowell** | Ein Dialog über Generationen: Ein Zitat von 1975 „PEOPLE HAVE THESE PECULIAR IDEAS.“ beantworten die heutigen Inhaber 2018 mit „WE AGREE“. Die Bildunterschriften nennen nur Name, Länge und Werft | Die Haltung trägt die Seite. Bei uns übernimmt das der Leitsatz „Ein Boot ist ein Wohnraum mit eigenen Regeln“ | https://www.bannenbergandrowell.com/ |
| **Lobanov Design** | Ein persönliches Portfolio mit Slideshow, dreisprachig, wenig Text | Als Negativbeispiel: Template-Reste und ein kaputtes Formular kosten Vertrauen | https://www.lobanov-design.com/ |
| **Studio Piet Boon** | Kein Yacht-Portfolio auf der Website. Es gibt aber das **Wajer-Bootshaus** in Heeg (350 m², Liegeplatz 8 × 27 m, Eiche und belgischer Blaustein) und Hausboote mit Davy & Ørsted, auf der Messe gezeigt mit Film, Materialauswahl und Modellen | **Bootshaus und Hausboot sind ein eigenes Design-Thema.** Das bestätigt Konzept 5. Die Messe-Präsentation aus Film, Materialtisch und Modell ist das Vorbild für die Werfthalle | https://pietboon.com/?p=53130 · https://www.hoog.design/en?p=389429 |
| **Princess Yachts** (Konfigurator, Cannes 2025) | Echtzeit-3D über alle Decks: Layouts lassen sich vergleichen, Optionen ein- und ausschalten, dazu sieben animierte Szenen „Leben an Bord“ | Nur Werften bieten 3D, und nur für ihre eigenen Modelle. **Ein markenneutrales 3D-Boot mit Interior-Zonen hat am Bodensee niemand** | https://www.yachtbuyer.com/en/news/watch-princess-yachts-launches-first-fully-immersive-3d-configurator-at-cannes |
| Veya / Studio 3DX, Twikit, London Dynamics (u. a. Riva) | Browser-Konfiguratoren mit Tag-, Abend- und Nachtlicht, Material- und Layoutwechsel, AR | Der **Licht-Umschalter Tag/Abend** ist ein starkes Erlebnis. Wir übernehmen ihn als „Seelicht“ (Design-Bibel §8.3) | https://www.multihulls-world.com/news-catamaran-trimaran/studio-3dx-un-configurateur-3d-pour-personnaliser-son-futur-multicoque · https://twikit.com/yachting/ |
| **Frauscher** (Gmunden, nur Stilreferenz) | Vollbild-Hero, Modellraster, die Manufaktur als Geschichte, Leitsätze wie „engineers of emotions“ und „Vollendet bis ins Detail“ | Stilreferenz für Alpensee-Runabouts. Kein Logo, kein Modellname, kein Nachbau | https://www.frauscherboats.com/ |
| Riva, Boesch | nur Stilreferenz (lackiertes Holz, Leder, Chrom) | Konzept 1 übernimmt nur die Stimmung. Es entsteht kein erkennbarer Nachbau einer Werft | – |

**Die Lücke:** Alle Studios zeigen **fertige Superyachten** in Bildern. Keines erklärt, *was in welchem Raum an Bord passiert* und *wer es macht*. Kein Händler am Ostufer zeigt Boot und Sortiment zusammen (Bericht 29, Abschnitt 4). Genau hier setzt die Signature an.

---

## 2. Leitidee und Seitendramaturgie

**Leitidee: „Die Werfthalle“.** Im Winterlager steht das Boot an Land, offen und zugänglich, und man geht Raum für Raum durch. Die Seite inszeniert genau diesen Moment. Der Leitsatz bleibt „Leben am See, auch an Bord.“ Die Unterzeile übersetzt den Markensatz „Nehmen Sie Platz.“ aufs Boot: **„Nehmen Sie Platz – an Bord.“** Die Stimme folgt der Design-Bibel: Sie-Form, Fakten, keine Superlative, kein „Luxus“ und kein „exklusiv“.

| # | Kapitel | Inhalt | Form |
|---|---|---|---|
| 0 | **Hero** | H1 „Yacht Interior am Bodensee“, Lead aus page.js, Primärknopf „Termin an Bord oder im Showroom“ | Typografischer Hero auf `ink-deep` mit einer Wasserlinie aus SVG (kein Foto, bis ein freigegebenes Bild vorliegt, `released: false`). Die H1 ist im ersten Frame sichtbar |
| 1 | **Prolog: Drei Regeln an Bord** | Gewicht · Feuchte und UV · Bewegung: Was lose ist, muss sicher stehen | 3 Faktenkarten, keine Zahlenanimation |
| 2 | **Signature: Die Werfthalle** | 3D-Boot, Umschalter für 6 Bootstypen, Zonen-Chips, Kamerafahrt, Konzeptblatt | der einzige Höhepunkt der Seite (Design-Bibel §8.3). Keine Horizontlinie zusätzlich |
| 3 | **Sechs Beispielkonzepte** | Karten mit Leitsatz, Farbstreifen und 3 Produkten. Ein Klick öffnet das Blatt (Farbwelt, Material, Zonen, Produkte, KI-Konzeptbild mit Etikett) | `card-editorial`, Bild-Etikett „KI-generiertes Konzeptbild“, Badge „Beispielkonzept – kein Kundenprojekt“ |
| 4 | **Musterkoffer** | Teak, Outdoor-Gewebe, Schaum, Edelstahl, Kunstleder, jeweils mit ehrlicher Eigenschaft | Swatches als CSS-Flächen. Die Fotos vom echten Musterkoffer folgen (Shotliste Nr. 7 in yacht-landingpage.md) |
| 5 | **Kurs durchs Winterlager** | Sep–Apr als Kurslinie (Abschnitt 6) | horizontal auf Desktop, vertikal mobil |
| 6 | **Wer macht was** | 3 Spalten: Platzhirsch · Bootssattler · Werft | ersetzt den Block „Klare Aufgabenteilung“, jetzt mit drei Beteiligten statt zwei |
| 7 | **Revier** | Bodensee und Mittelmeer (bestehend) | bestehend |
| 8 | **CTA** | Termin an Bord oder im Showroom. Optional: „Konzept als PDF anfordern“ nach dem Muster des Stil-Finders, erst wenn dessen PDF-Strecke steht | 1 Primärknopf |
| 9 | **FAQ** | bestehende 7 Fragen + 2 neue: „Ist das 3D-Boot mein Boot?“ (Nein, ein Schema) · „Sind die Bilder echte Projekte?“ (Nein, gekennzeichnete KI-Konzeptbilder) | FAQPage JSON-LD erweitern |

---

## 3. Signature: interaktives 3D-Boot („Werfthalle“)

### 3.1 Erlebnis

1. **Ruhezustand (Poster):** Ein SVG-Längsriss des gewählten Bootstyps mit den Zonen als Linien, sofort lesbar und 0 KB WebGL. Darüber steht der Knopf „Boot in 3D ansehen“. Ab ≥ 1024 px und wenn das Gerät genug Leistung hat, startet 3D automatisch, sobald die Sektion zu 30 % sichtbar ist.
2. **Bootstyp-Umschalter** (6 Chips, `role="radiogroup"`): Runabout · Daycruiser · Segelyacht · Motoryacht · Hausboot/Bootshaus · Superyacht (Inspiration). Beim Wechsel blendet sich der Rumpf über 400 ms morphend über (`--duration-morph`), mit Reduced Motion als harter Schnitt.
3. **Zonen:** Deck & Cockpit · Flybridge · Salon · Kabine · Bad · Badeplattform · Steg & Bootshaus. Jedes Modell zeigt nur die Zonen, die es wirklich hat (`modelle.*.zonen`). Ein Runabout hat zum Beispiel keine Kabine. Die Zonen sind als **echte DOM-Knöpfe** angelegt (Chips unter der Bühne) und zusätzlich als 3D-Hotspots (`<Html>` von drei mit `<button>`). Beides ist synchron.
4. **Kamerafahrt:** Mit `CameraControls.setLookAt(...position, ...ziel, true)` bewegt sich die Kamera über 900–1200 ms zum Ziel. Das ist eine Atmosphäre-Bewegung und verzögert keine Handlung, denn das Konzeptblatt öffnet sofort. Bei **Innenzonen** (Salon, Kabine, Bad) werden Deck und Aufbau per Clipping-Plane geschnitten (`deckAusblenden: true`). So entsteht ein „Schnittmodell“ wie ein Werftmodell im Messe-Glaskasten. Die Presets liegen in `concepts.json → modelle.*.kamera`.
5. **Konzeptblatt** (Seitenpanel Desktop, Bottom-Sheet mobil per `<dialog>`): Zonen-Text, die Farbwelt als 5 Streifen, die Materialien und die Produkte dieser Zone mit Herstellerbild, Name, Marke, Eignungs-Etikett und Link zur Produktseite. Darunter stehen „Das macht der Sattler / die Werft“.
6. **Seelicht-Schalter Tag/Abend:** Er wechselt Himmel, Sonne und Wasserfarbe und schaltet in Abendstimmung warmes Licht (2.700 K) aus den Fenstern ein. Er greift die Bildsprache „Seelicht“ der Design-Bibel auf.
7. **Freie Rotation** per Ziehen (Orbit begrenzt: Polarwinkel 20–80°, kein Blick unter Wasser) und per Tastatur (Pfeiltasten drehen, +/− zoomen, Esc führt zur Übersicht).

### 3.2 Prozedurales Modell (keine Nachbauten)

- **Rumpf:** Er wird aus Spantkurven erzeugt (eigene `BufferGeometry`: 24 Spanten × 32 Punkte, Parameter Länge, Breite, Freibord, Sprung, V-Winkel, Spiegelheck). Je Typ gibt es einen Parametersatz (`modelle`), daraus ergeben sich 6 Rümpfe aus *einem* Generator.
- **Aufbau:** Er ist aus abgerundeten Boxen zusammengesetzt (`RoundedBox` von drei). Die Flybridge ist eine zweite Ebene. Mast und Baum (Segelyacht) sind Zylinder, Ponton und Haus (Hausboot) Boxen, und der Steg ist eine Plankenreihe.
- **Möbel im Modell:** Sie bleiben **abstrakte Volumen** (Polsterblöcke, Tischscheiben, Schirmkegel) in den Farben des Konzepts. Designermöbel werden nicht in 3D nachgebaut, weil dafür eine Lizenz nötig wäre (Design-Bibel §14 „Keine Nachbauten von Designermöbeln in 3D ohne Lizenz“, EuGH *Mio/konektra*). Die echten Produkte erscheinen nur als Herstellerbild im Konzeptblatt.
- **Materialien:** Gelcoat als `MeshPhysicalMaterial` (clearcoat 1, roughness 0,25). Teak entsteht aus einer prozeduralen Canvas-Textur mit Fugen (512², einmal erzeugt). Lackholz (Runabout) bekommt clearcoat 1 und warme Farbe. Das Wasser ist eine Ebene mit animiertem Normal-Shader, ohne Reflector auf Mobilgeräten. Bei Reduced Motion steht das Wasser still.
- **Budget:** ≤ 120 k Dreiecke, ≤ 40 Draw-Calls und keine externen Modelle oder HDRIs (Umgebung über `<Environment preset>` ist **nicht** erlaubt, weil das ein CDN-Abruf wäre; stattdessen `<Lightformer>`-Umgebung lokal). `frameloop="demand"`, `dpr={[1, 1.75]}`, `<PerformanceMonitor>` senkt die dpr und schaltet Schatten ab. Ziel: 60 fps auf iPhone 13 und ≤ 300 KB gz für den 3D-Chunk.

### 3.3 Technik (Next 16 / React 19)

- Vor der Umsetzung `node_modules/next/dist/docs` lesen (Lazy Loading, `next/dynamic`, Client Components).
- `three`, `@react-three/fiber` und `@react-three/drei` stehen **nie im Initial-Bundle**. `YachtStage` wird per `dynamic(() => import(...), { ssr: false })` erst bei Sichtbarkeit oder Klick geladen. Die Seite selbst bleibt Server Component.
- Es sind keine neuen npm-Pakete nötig, alles ist installiert (three 0.183, R3F 9, drei 10, motion 12).
- **Kein WebGL / Fehler:** Ein ErrorBoundary zeigt den SVG-Längsriss mit denselben Zonen-Knöpfen. Das Konzeptblatt funktioniert auch ganz ohne 3D.
- **Barrierefreiheit (WCAG 2.2 AA):** Das Canvas ist `aria-hidden`. Die gesamte Bedienung läuft über die DOM-Chips. `aria-live="polite"` meldet „Salon der Motoryacht, 5 Produkte“. Fokus-Ring nach Design-Bibel, Trefferflächen ≥ 44 px, kein Wisch-Zwang (2.5.7: Knöpfe statt Ziehen).
- **Reduced Motion / „Ruhige Ansicht“:** Kamera springt ohne Fahrt, kein Morph, Wasser steht, keine Auto-Rotation.

### 3.4 Dateien (Vorschlag, nicht angelegt)

| Datei | Inhalt |
|---|---|
| `src/lib/yacht/concepts.json` | **angelegt:** Konzepte, Zonen, Modelle, Kamera-Presets, Eignungsregeln, Rechtstexte |
| `src/lib/yacht/catalog.js` | `server-only`-Adapter (Muster: `Labs/Stilfinder/catalog.js`). Er löst die IDs live über `fetchProdukteNewByMarke` auf, übernimmt aktuelle Bilder und Links und **lässt fehlende oder inaktive Produkte still weg** |
| `src/components/Landing/Yacht/YachtStage/` | `YachtStage.js` (Client, lazy), `hull.js` (Spant-Generator), `models.js`, `Zones.js`, `ConceptSheet.js`, `PosterSvg.js` |
| `src/components/Landing/Yacht/YachtConcepts.js` | Konzeptkarten + Blatt (Server, nur `<dialog>` als Client-Insel) |
| `tests/yacht-concepts.spec.*` | Prüft: Schema, jede Produkt-Zone existiert im Modell, keine Außenzone mit `innen-lose`, Pflichtetiketten vorhanden, keine Verbotswörter (claims-check) |

---

## 4. Die sechs Beispielkonzepte (Daten in `concepts.json`)

Alle Konzepte tragen sichtbar das Etikett **„Beispielkonzept – kein Kundenprojekt“**. Die Paketspannen stammen aus Bericht 29 (Schätzung) und werden **nicht öffentlich** gezeigt.

| # | Bootstyp | Titel · Leitsatz | Farbwelt | Produkte (Auswahl) |
|---|---|---|---|---|
| 1 | Bodensee-Holzrunabout 8–10 m | **Mahagoni und Leinen** · „Ein Abend auf dem See, bei dem nur das Holz glänzt.“ | Mahagoni, Elfenbein, See, Messing (Linie), Dämmerung | Alonpi Luberon (Plaid), Flos In Vitro Unplugged, am Steg: Solpuri JAZZ lounger, Umbrosa Versa UX, Tuuci Bleau Round Side Table |
| 2 | Bodensee-Daycruiser 9–12 m | **Seelicht** · „Tagsüber Badebucht, abends Kajüte.“ | Paper, Teak, Linen, See, Ink | Tuuci Bleau Stacking Side Table, Paola Lenti Wadi, Flos Bellhop Unplugged, Minotti Libra „Throw“, Treca Matratzenauflage Riviera, Minotti Laken, Alonpi Moltrasio |
| 3 | Segelyacht 12–16 m | **Nordwind** · „Unter Deck ruhig, an Deck wetterfest.“ | Wollweiß, Fjordgrau, Eiche, Sturmblau, Stone | Flos Bon Jour Unplugged, Minotti Andersen „Throw“, Treca Matratzenauflage Seine, Alonpi Snow / Region, Tuuci Bleau Stacking Side Table |
| 4 | Mittelmeer-Motoryacht 20–30 m | **Riviera Abend** · „Die Flybridge als Terrasse, der Salon als Wohnzimmer.“ | Sand, Terrakotta, Tabak, Walnut, Paper | Paola Lenti Portofino Sofa + Table, Baia, Asira, Tuuci Bleau Barstool + Double Sun Lounge, Flos In Vitro Unplugged, Minotti Lido, Libra Coffee Table, Wisp, Cachemire, Freeman „Duvet“, Treca Riviera |
| 5 | Hausboot / Bootshaus | **Am Ufer** · „Wo das Boot schläft, beginnt der Abend.“ | Lärche vergraut, Stone, Teak, See, Ink-deep | Solpuri PLATEAU A1, CHARLIE Teak, FOXX, Poliform Ketch, Livintwist Belvedere Canopy, Umbrosa Eclipsum UX, Heatsail Dome Pendant, Flos IC F1 Outdoor, innen: 101 Copenhagen Arc Ø120 + Toe Sheepskin, Flos Tatou Floor |
| 6 | Superyacht-Lounge (Inspiration) | **Beach Club** · „Eine Inspiration, kein Bodensee-Angebot.“ | Kalkweiß, Salbei, Rohleinen, Teak gebleicht, Tiefsee | Paola Lenti Float, Wave, Swell, Harbour, Giro, Tuuci Bleau Sand Sun Lounge + Lounge Chair, Sifas Kalife Daybed (nur Bootshaus), Flos Captain Flint Outdoor |

Für Runabout (1) gilt ehrlich: Das eigentliche Projekt sind **Polster vom Sattler**. Unsere Möbel stehen am Steg, nicht an Bord. Bei der Superyacht (6) verantworten **Designbüro und Werft** das Interior, und Platzhirsch liefert auf Anfrage lose Ausstattung (Bericht 29, Abschnitt 4).

---

## 5. Katalog-Befund (Backoffice, 27.10.2026, alle 36 Marken abgefragt)

| Befund | Folge |
|---|---|
| **Gloster: 0 Produkte** im Katalog, obwohl die Landingpage Gloster nennt | Gloster in keinem Konzept. Auf der Landingpage vorerst „auf Anfrage“ oder entfernen (Datei `yacht-interior/page.js`, Gruppe „Bootshaus“) |
| **Tuuci: 15 Produkte, nur Kollektion Bleau** (Stühle, Hocker, Liegen, Tische). **Keine Schirme** (Ocean Master usw.) im Katalog | Der Tuuci-Text auf der Landingpage („Sonnenschirme … Marine“) beschreibt Produkte, die nicht im Katalog sind. Umformulieren auf „Outdoor-Möbel von Tuuci, Schirme auf Anfrage“. Laut Hersteller hat Bleau eine korrosionsbeständige Pulverbeschichtung und eine Grundierung für Küstenumgebungen. Eine Marine-Freigabe für Bleau ist **nicht belegt**, Tuuci zeigte die Möbel aber auf der Monaco Yacht Show 2025 (Quellen unten) |
| **Paola Lenti: 64 Outdoor-Produkte** | Kern für Deck und Flybridge. Der Hersteller zeigt Yachting-Projekte (Beleg in yacht-landingpage.md). Bordfreigabe je Modell anfragen |
| **Minotti: 487 Produkte, alle als Indoor geführt** | Minotti nur in Salon und Kabine (Konzepte 2–4). Eine Minotti-Outdoor-Kollektion ist im Katalog nicht als Outdoor markiert (Datenpflege im Backoffice). Bilder unverändert verwenden |
| **Poliform: 5 Outdoor** (Ketch, Lagoon, Magnolia, Ponte, Shore) | neu für Bootshaus (Konzept 5). Bordeinsatz nicht belegt |
| **Sifas (59) und Livintwist (9)**, beide komplett Outdoor | nur Bootshaus/Terrasse. Sie fehlen bisher auf der Landingpage und sind dort ergänzbar |
| **Flos: 20 Outdoor**, dazu Akku-Leuchten innen (Bellhop/Bon Jour Unplugged) | Akku-Leuchten passen zu Bericht 29 („Wohnleuchten nur lose, mit Akku“). Fest verbaute Leuchten nur mit Elektriker und Werft |
| **Treca** Matratzenauflagen, **Alonpi** Bettwäsche/Decken | Kabine. Kojen sind selten rechteckig, deshalb **Sondermaß beim Hersteller anfragen** |
| **Baobab: nur Duftkerzen** | **bewusst ausgeschlossen**, weil offene Flamme an Bord |
| 152 Produkte ohne Bild | `catalog.js` muss Produkte ohne Bild ausfiltern. Alle 48 gewählten haben ein Bild |

**Eignungsklassen** (Feld `eignung` je Produkt):
- `aussen-marine-hersteller`: Der Hersteller nennt Marine/Yachting allgemein (Tuuci, Paola Lenti). Nur diese stehen auf **Deck, Flybridge und Badeplattform** von Booten. Auch hier wird der Bordeinsatz je Modell schriftlich bestätigt.
- `aussen-katalog`: Outdoor laut Katalog. Für **Bootshaus, Steg, Terrasse, Hausboot-Terrasse**. Ausnahme ist die Flos In Vitro Unplugged als lose Akkuleuchte am Liegeplatz, mit dem Hinweis „nicht während der Fahrt“.
- `innen-lose`: nur unter Deck, lose, trocken, nicht im Nassbereich.

---

## 6. Ablauf Winterlager-Refit und Rollen

| Zeit | Schritt | Platzhirsch | Bootssattler | Werft |
|---|---|---|---|---|
| Sep–Okt | Interboot, Auswassern, Erstgespräch | Termin, Fotos und Pläne sammeln | – | Liegeplatz Winterlager |
| Nov | **Besichtigung an Bord** im Winterlager | Nutzung, Stil, Budget, Zonen | **Aufmaß und Schablonen** | Zugang, Hinweise zu Befestigung/Gewicht |
| Nov–Dez | **Konzept** (Moodboard, Farbwelt, Material, Produktliste je Zone) | Entwurf und Aufstellung, wer was macht | Machbarkeit Polster | Freigabe Gewicht, Stabilität, Brandschutz-Nähe (Motor, Herd) |
| Dez–Jan | **Muster** im Showroom Lochau oder an Bord, Besuch boot Düsseldorf (23.–31.01.2027) | Musterkoffer, Bestellung lose Ausstattung | Stoff- und Schaumauswahl, Datenblätter | – |
| Jan–Mär | **Fertigung** | Termine koordinieren, Lieferung | Polster, Persenning, Bimini | Lack, Holz, Befestigungspunkte, Elektrik |
| Mär–Apr | **Montage und Einwassern** | Übergabe lose Ausstattung, Saisonservice anbieten | Polster einpassen | Montage, Bohrungen, Abnahme |
| Okt | Saisonservice | Kissen und Möbel abholen, reinigen, einlagern | – | – |

Öffentlich heißen die Beteiligten **„Bootssattler“ und „Werft“** bzw. „Fachbetriebe“. Das Wort „Partner“ steht nur bei ClassiCon (Rechtspaket), und Namen von Werften oder Sattlern erscheinen nur mit schriftlicher Zustimmung.

---

## 7. Rechtliche Formulierungen (aus Bericht 29, Abschnitt 8, und Rechtspaket)

**Erlaubt (Mustertexte für die Seite):**
- „Wir gestalten Cockpit, Salon, Kabinen und Deck Ihres Bootes und liefern Möbel, Textilien und Leuchten. Aufmaß und Polster fertigt ein Bootssattler, alle Arbeiten am Boot selbst übernimmt die Werft. Wir stimmen die Termine ab.“
- „Wir wählen Produkte, die der Hersteller für den Außenbereich vorsieht, und klären vor jedem Angebot schriftlich, ob ein Modell an Bord eingesetzt werden kann.“
- „Beispielkonzept – kein Kundenprojekt.“ · „KI-generiertes Konzeptbild. Zeigt eine Stimmung, kein reales Boot und keine realen Produkte.“
- „Das 3D-Modell ist ein Schema und nicht Ihr Boot.“
- „Modelle von Tuuci, Paola Lenti … aus unserem Sortiment, auf Anfrage.“

**Nicht erlaubt:** „Nr. 1“, „führend“, „die Experten“, „Luxus“, „exklusiv“ · „offizieller/autorisierter Händler/Partner“ · „marine-zertifiziert“, „salzwasserfest“, „schwer entflammbar“ ohne Datenblatt · „Komplett-Refit aus einer Hand“ · „Bauleitung“ (bis GISA/WKO geklärt) · Preise oder Paketpreise · erfundene Referenzen, Kundenstimmen, Werftnamen.

**Technik/Recht im Hintergrund:** Ein Wechsel von Polstern und loser Ausstattung ist in der Regel kein „größerer Umbau“ nach RL 2013/53/EU Art. 3 Nr. 7. Eingriffe in Struktur, Elektrik, Gas, Lüftung, Notausstiege sowie die Freigabe von Gewicht und Stabilität liegen immer bei der Werft. Das steht schriftlich in jedem Angebot (Bericht 29, Abschnitt 5). Für Polster sind die Gewerbe Sattler (Z 53) und Tapezierer (Z 68) reglementiert, deshalb fertigt ein befugter Betrieb.

---

## 8. KI-Konzeptbilder: Prompts und Regeln

Die Prompts stehen je Konzept und Zone in `concepts.json → konzepte[].bildprompts`, 14 Stück, englisch, mit gemeinsamem Negativ-Prompt. Stil: **fotorealistisch, editorial, natürliche Farben, Objektiv 24–50 mm ohne Fisheye, kein HDR** (Bildsprache „Seelicht“, Design-Bibel §7).

Regeln:
1. **Kennzeichnung** nach Art. 50 Abs. 2 und 4 AI Act: ein sichtbares Etikett am Bild **und** C2PA/IPTC-Metadaten („trainedAlgorithmicMedia“). Eine menschliche Prüfung befreit nicht davon (Rechtspaket W11).
2. **Keine Markenlogos, keine erkennbaren Werften oder Yachtmodelle, keine identifizierbaren Designermöbel.** Die Prompts beschreiben generische Formen („low modular outdoor lounge“), nie Produktnamen.
3. **Herstellerbilder nie als KI-Input** (img2img, Referenz) ohne Freigabe der Marke. Minotti-Bilder bleiben unverändert.
4. Erzeugung lokal auf der GPU in Lochau (Pipeline: `Marktresearch/daten/gpu-pipeline.md`), Modelllizenz für kommerzielle Nutzung geprüft. Bis Bilder vorliegen, zeigt das Konzeptblatt die Farbwelt als Fläche (`linen`-Platzhalter, kein Shimmer).
5. Sobald echte, freigegebene Pilotfotos aus dem Winterlager 2026/27 vorliegen, ersetzen sie die KI-Bilder.

---

## 9. Abnahmekriterien

- 3D lädt nicht im Initial-Bundle. Die Seite ist ohne JS und ohne WebGL vollständig nutzbar (Poster + Konzeptkarten). LCP ≤ 2,5 s mobil.
- Alle Zonen sind per Tastatur erreichbar, der Screenreader meldet Zone und Produktanzahl, und Reduced Motion wirkt.
- Jedes Konzept zeigt die Badges „Beispielkonzept“ und, bei Bildern, „KI-generiert“.
- Keine Außenzone an Bord zeigt ein Produkt mit `innen-lose` oder `aussen-katalog` (Ausnahme In Vitro Unplugged mit Hinweis). Das sichert ein Test ab.
- `tools/checks/check-claims.mjs` läuft ohne Befund. Produktlinks liefern 200, und fehlende Produkte verschwinden still.
- Screenshots mit `node tools/qa/shoot.mjs` auf 375 / 768 / 1440 px, jeweils Tag und Abend.

## 10. Offene Punkte

1. Gloster ist nicht im Katalog: auf der Landingpage anpassen (siehe Abschnitt 5).
2. Tuuci-Text auf der Landingpage nennt Schirme, im Katalog gibt es nur Bleau-Möbel: Text anpassen oder Schirme ins Backoffice aufnehmen.
3. Minotti Outdoor im Backoffice als Outdoor kennzeichnen. Erst dann kann Minotti Outdoor auf Konzept 5 erscheinen.
4. Herstelleranfragen (Bordeinsatz je Modell, Gewicht, Datenblätter Entflammbarkeit): Tuuci Bleau, Paola Lenti (Portofino, Baia, Asira, Wadi, Float, Wave, Swell, Harbour, Giro), Flos In Vitro Unplugged (Schutzart), Treca (Sondermaß Koje).
5. Die Konzept-PDF („Konzept als PDF anfordern“) erst nach der PDF-Strecke des Stil-Finders und dem Rechtstext für die Einwilligung.
6. Weiter offen aus yacht-landingpage.md: schriftliche Zusage von Sattler und Werft vor der Bewerbung der Seite, Haftpflicht für Obhutsschäden, Eintrag in `landingPages.js`.

## Quellen

- Winch Design: https://www.winchdesign.com/
- Vripack: https://www.vripack.com/
- Bannenberg & Rowell: https://www.bannenbergandrowell.com/
- Lobanov Design: https://www.lobanov-design.com/
- Studio Piet Boon, Wajer-Bootshaus: https://pietboon.com/?p=53130 · https://www.hoog.design/en?p=389429 · https://www.pietboon.com/
- Princess Yachts 3D-Konfigurator (YachtBuyer): https://www.yachtbuyer.com/en/news/watch-princess-yachts-launches-first-fully-immersive-3d-configurator-at-cannes
- Studio 3DX / Veya: https://www.multihulls-world.com/news-catamaran-trimaran/studio-3dx-un-configurateur-3d-pour-personnaliser-son-futur-multicoque
- Twikit Yachting: https://twikit.com/yachting/
- London Dynamics: https://londondynamics.com/?p=1287
- Frauscher: https://www.frauscherboats.com/
- Tuuci Bleau: https://www.tuuci.com/products/furniture/bleau/ · https://landscapearchitect.com/ladetails/landscape-product/patio-furniture/tuuci/bleau-collection
- Tuuci auf der Monaco Yacht Show 2025: https://www.tuuci.com/in-the-news/tuuci-sets-sail-with-award-winning-furniture-collections-at-monaco-yacht-show-2025/
- Katalog: backoffice.platzhirsch.studio, `marken.api.marken_data` und `produkte_new.api.get_produkte_by_marke_api` (27.10.2026)
