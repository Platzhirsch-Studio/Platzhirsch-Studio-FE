# USP-Durchdringungsplan „Von der Handzeichnung zum Rendering“

**Stand:** 28.10.2026 · **Für:** Integrationsteam (Umsetzung später, nach Freigabe der jeweiligen Datei-Eigentümer) · **Kein Code in dieser Runde.**
**Grundlagen:** `features/usp-handzeichnung-designprozess.md`, `features/arbeitsweise-konzept.md`, `expertenrat/00-design-bibel.md`, `teamleiter/inhaber-entscheidungen.md` Nr. 1 und 8.

**Wichtig zur Reihenfolge:** Viele Zieldateien gehören derzeit anderen Teams (Home, Navbar, messages, Labs, Yacht, Ezarri). Jede Zeile nennt deshalb Datei, Position und fertigen Text. Umgesetzt wird erst, wenn das Team fertig ist oder zustimmt.

---

## 0. Bausteine (einmal bauen, überall nutzen)

Damit der USP überall gleich klingt, gibt es **drei wiederverwendbare Bausteine** und **eine Textquelle**.

| Baustein | Vorgeschlagene Datei | Varianten | Inhalt |
|---|---|---|---|
| **Textquelle** | `src/lib/arbeitsweise/copy.js` (DE), später `src/messages/*.json` Schlüssel `arbeitsweise.*` (Vorschlag in `features/arbeitsweise-messages-vorschlag.json`) | – | die 7 Schrittnamen, Kurzsätze, Brückensatz, Leitmotiv. **Alle Stellen unten lesen hier**, keine Kopien im Seitencode |
| **`ProcessStrip`** | `src/components/patterns/ProcessStrip.js` (Server Component) | `full` (7 Schritte mit Kurzsatz, für Startseite und Beratung), `compact` (7 Schrittnamen in einer Zeile + 1 Satz + Link, für Landingpages), `line` (ein Satz + Link, für Footer-nahe Stellen) | nummerierte `ol`, Link „Unsere Arbeitsweise“ → `/arbeitsweise`. Keine Bilder, nur Typo und Haarlinie. Nutzt nicht `Horizon` (die Seite hat ihre eigene) |
| **`HandoffNote`** | `src/components/patterns/HandoffNote.js` | `light`, `dark` | Brücke Tool → Mensch für alle Planer: Overline, ein Satz, Textlink. Kein gefüllter Knopf (der Planer hat schon einen Primärknopf) |
| **`ProcessMedia`** | liest `src/lib/arbeitsweise/media.js` | – | ein einzelner Bildslot (z. B. eine Skizze) für Stellen außerhalb der Arbeitsweise-Seite; ist der Slot `null`, rendert er im Livegang **nichts** |

**Die sieben Schrittnamen (überall gleich):** Kennenlernen · Vor Ort · Handzeichnung · Modell · 3D-Planung · Rendering · Umsetzung.

**Standardsätze** (in `copy.js`):
- `kurz`: „Wir lernen Ihre Räume vor Ort kennen. Harald Menghin zeichnet Ihr Konzept von Hand und baut ein Modell. Danach planen wir in 3D, und Sie sehen Ihren Raum fotorealistisch, bevor etwas bestellt wird.“
- `einSatz`: „Bei uns beginnt jede Planung mit einer Handzeichnung, erst danach folgen 3D-Planung und Rendering.“ `[Inhaber: „jede“ nur, wenn das für alle Planungsaufträge gilt; sonst „unsere Planungen beginnen“]`
- `bruecke`: „Online starten. Wenn Sie danach mit uns planen, zeichnet Harald Menghin Ihr Konzept von Hand weiter.“
- `vorOrt`: „Wenn Ihr Projekt es braucht, bleiben wir auch ein, zwei Tage vor Ort.“
- `link`: „Unsere Arbeitsweise“ → `/arbeitsweise`

---

## 1. Startseite

**Datei:** `src/app/[locale]/page.js` (Komposition) · neue Komponente `src/components/Home/Process.js` · Texte `src/messages/*.json` → `HomePage.process.*` · **Eigentümer:** Home-Team (tabu bis Freigabe).

**Dunkles Kapitel:** Die Inhaber-Entscheidung Nr. 1 (Jury §3.3) legt das einzige Walnut-Kapitel auf „Haus & Café“ (`HouseCafe.js`). Die USP-Doku wünscht sich „gern das dunkle Kapitel“. **Empfehlung:** Das USP-Kapitel wird ein **helles Band (`tone="band"`, Stone)** direkt **vor** `HouseCafe`. So erzählt die Seite: Räume → Auswahl → *so arbeiten wir* → *hier sitzen Sie dabei* (dunkel). Wenn der Inhaber das Dunkle für den USP will, tauscht man: `Process` wird `inverse`, `HouseCafe` wird `band`. Nie beide dunkel.

| # | Position | Art | Fertiger Text / Komponente |
|---|---|---|---|
| 1.1 | `page.js`: zwischen `<CuratedSelection />` und `<HouseCafe />` | neue Sektion `Process` = `ProcessStrip full` + 1 Bildslot (`media.handzeichnung`, 4:5, Spalten 8–12; im Livegang ohne Bild nur Text) | **Overline:** UNSERE ARBEITSWEISE · **H2:** Von Hand gezeichnet, bevor es digital wird. · **Lead:** Wir lernen Ihre Räume vor Ort kennen. Harald Menghin zeichnet Ihr Konzept von Hand und baut ein Modell. Danach planen wir in 3D, und Sie sehen Ihren Raum fotorealistisch, bevor etwas bestellt wird. · **Schritte 01–07** mit Kurzsätzen: Kennenlernen – „Im Showroom mit Café oder bei Ihnen.“ · Vor Ort – „Licht, Klima, Wege. Wenn nötig, ein, zwei Tage.“ · Handzeichnung – „Grundriss, Perspektiven und Stimmungen von Hand.“ · Modell – „Ein Raummodell zum Anfassen und Umstellen.“ · 3D-Planung – „Exakte Maße, Produkte und Materialien.“ · Rendering – „Ihr Raum, bevor etwas bestellt wird.“ · Umsetzung – „Lieferung, Montage auf Wunsch, bis zum Einzug.“ · **Link:** Unsere Arbeitsweise ansehen |
| 1.2 | `WhyChooseUsSectionHome.js` / `HomePage.host.items.plan` | Text ändern (kein neues Element, die 4 Versprechen bleiben) | **Titel:** Von Hand geplant · **Text:** Harald Menghin zeichnet Ihr Konzept, bevor wir es in 3D planen. Wohnen, Küche, Schlafen, Outdoor und Licht aus einer Hand. |
| 1.3 | `HomePage.host.items.time` | Text ergänzen | **Text:** Ein Gespräch in der Ausstellung oder bei Ihnen vor Ort, gern mit Grundriss, Fotos und Maßen. |
| 1.4 | `src/lib/content/homeSeo.js` → `faq` (DE), Position nach „Wie läuft eine Einrichtungsberatung ab?“ | neue FAQ (sichtbar in `SeoIntro` + FAQPage-JSON-LD automatisch) | **F:** Zeichnen Sie Einrichtungskonzepte wirklich von Hand? **A:** Ja. Harald Menghin skizziert Grundriss, Perspektiven und Stimmungen von Hand und baut bei Bedarf ein Raummodell. Danach planen wir in 3D, und Sie sehen ein fotorealistisches Rendering, bevor etwas bestellt wird. |
| 1.5 | `homeSeo.js` → bestehende Antwort „Wie läuft eine Einrichtungsberatung ab?“ | Satz ersetzen | **A:** Sie beschreiben uns Ihr Vorhaben, wir treffen uns im Showroom oder bei Ihnen zu Hause. Harald Menghin zeichnet das Konzept von Hand, danach folgen 3D-Planung und Rendering. Wir kümmern uns um die Bestellung, auf Wunsch auch um Lieferung und Montage. |
| 1.6 | Meta-Description DE (`FALLBACK_META_BY_LOCALE.de` in `page.js`) | optional, nur nach SEO-Abnahme | Designermöbel und Interior Design in Vorarlberg: von Hand gezeichnet, in 3D geplant. Minotti, Poliform, Rimadesio im Showroom in Lochau am Bodensee. (148) |

Regeln: kein zweiter gefüllter Knopf (Link als `LinkArrow`), keine zweite Horizontlinie (die hat `HostPromises`), Bild nur echt.

---

## 2. Interior Design Vorarlberg

**Datei:** `src/app/[locale]/interior-design-vorarlberg/page.js` (`CONTENT`) · Layout `src/components/Landing/landingPage.js`.

| # | Position | Art | Fertiger Text |
|---|---|---|---|
| 2.1 | `CONTENT.intro.paragraphs[1]` ersetzen | Text | „Wir sehen uns Ihre Räume vor Ort an, Licht, Wege und Gewohnheiten eingeschlossen. Harald Menghin zeichnet daraus ein Einrichtungskonzept von Hand und baut ein Raummodell. Danach planen wir in 3D mit Möbeln, Systemen, Leuchten und Accessoires internationaler Designmarken, und Sie sehen das Ergebnis als Rendering, bevor etwas bestellt wird.“ |
| 2.2 | `CONTENT.intro.benefits[0]` ersetzen | Text | „Konzept von Hand gezeichnet, dann in 3D geplant“ |
| 2.3 | `CONTENT.steps` komplett ersetzen | Text (4 → 7 Schritte; Raster `lg:grid-cols-4` zeigt 7 als 4 + 3, ok) | **eyebrow:** „Unsere Arbeitsweise“ · **heading:** „Von der Handzeichnung zum fertigen Raum“ · **items:** Kennenlernen – „Im Showroom mit Café oder bei Ihnen zu Hause. Sie erzählen, wie Sie wohnen.“ · Vor Ort – „Wir sehen uns Licht, Klima und Wege an. Wenn Ihr Projekt es braucht, auch ein, zwei Tage.“ · Handzeichnung – „Harald Menghin skizziert Grundriss, Perspektiven und Stimmungen von Hand.“ · Modell – „Ein Raummodell im Maßstab, zum Anfassen und gemeinsamen Umstellen.“ · 3D-Planung – „Exakte Maße, ausgewählte Produkte und Materialien.“ · Rendering – „Ein fotorealistisches Bild Ihres Raums, bevor etwas bestellt wird.“ · Umsetzung – „Lieferung, Montage auf Wunsch und Begleitung bis zum Einzug.“ |
| 2.4 | `landingPage.js`, Steps-Sektion nach der `ol` | **Komponente** (kleine Erweiterung): optional `steps.link` rendern als `LinkArrow` | `steps.link = { href: "/arbeitsweise", label: "So arbeiten wir im Detail" }` |
| 2.5 | `CONTENT.faq.items[1]` („Wie läuft die Einrichtungsplanung ab?“) ersetzen | Text + JSON-LD automatisch | „Nach einem ersten Gespräch sehen wir uns Ihre Räume vor Ort an. Harald Menghin zeichnet das Konzept von Hand und baut bei Bedarf ein Modell. Danach planen wir in 3D, zeigen Ihnen ein Rendering und wählen mit Ihnen im Showroom aus. Lieferung und Montage koordinieren wir.“ |
| 2.6 | `generateMetadata` → `description` | Text | „Einrichtungsplanung in Vorarlberg: vor Ort aufgenommen, von Hand gezeichnet, in 3D geplant. Möbel, Systeme und Licht internationaler Marken. Showroom in Lochau.“ (152) |

---

## 3. Beratung

**Datei:** `src/app/[locale]/beratung/page.js` · Komponente `src/components/Beratung/advice.js` (`FeaturesSection`) · Texte `src/messages/de.json` → `inhalt.beratung.*`.

| # | Position | Art | Fertiger Text |
|---|---|---|---|
| 3.1 | `inhalt.beratung.processTitle` / `processText` | Text | **processTitle:** „In sieben Schritten von der Handzeichnung zum Raum“ · **processText:** „So läuft ein Projekt bei uns ab: vom ersten Gespräch über die Zeichnung von Hand bis zur Übergabe.“ |
| 3.2 | `inhalt.beratung.process` (Array, 7 Einträge, heute: Erstkontakt, Besuch, Analyse, Planung, Angebot, Umsetzung, Abnahme) | Text ersetzen, Struktur `title/text/points` bleibt | 1 **Kennenlernen** – „Sie erzählen uns, was Sie vorhaben.“ · points: „im Showroom mit Café“, „per Telefon oder E-Mail“, „bei Ihnen zu Hause“ · 2 **Vor Ort** – „Wir lernen Ihre Räume kennen.“ · points: „Licht im Tagesverlauf, Klima, Wege“, „wenn Ihr Projekt es braucht, auch ein, zwei Tage“ · 3 **Handzeichnung** – „Harald Menghin zeichnet Ihr Konzept von Hand.“ · points: „Grundriss“, „Perspektiven und Stimmungen“ · 4 **Modell** – „Ein Raummodell im Maßstab.“ · points: „zum Anfassen“, „gemeinsam umstellen“ · 5 **3D-Planung** – „Wir planen exakt.“ · points: „Maße, Produkte, Materialien“ · 6 **Rendering und Angebot** – „Sie sehen Ihren Raum, bevor etwas bestellt wird.“ · points: „fotorealistisches Rendering“, „Rückmeldung im Kundenportal, auch per Sprachnachricht“, „Angebot“ · 7 **Umsetzung** – „Wir bleiben bis zum Einzug an Ihrer Seite.“ · points: „Lieferung, Montage auf Wunsch“, „Koordination der Gewerke“, „Abnahme“ |
| 3.3 | `advice.js`, `FeaturesSection` unterhalb der Liste | Komponente `ProcessStrip line` (nur Link) | „Wie Harald zeichnet und warum wir Modelle bauen: Unsere Arbeitsweise“ |
| 3.4 | `BeratungClient` / `MultiStepForm` – Feld „Bei meiner Anfrage geht es um“ oder Textarea-Hinweis | Text (Platzhalter des Freitextfelds, `src/messages/de.json` → `MultiStepForm`) | Hilfetext: „Grundriss, Fotos und Maße helfen. Den Rest sehen wir uns gern vor Ort an.“ |

---

## 4. Küchen Vorarlberg

**Datei:** `src/app/[locale]/kuechen-vorarlberg/page.js` (`CONTENT`).

| # | Position | Art | Fertiger Text |
|---|---|---|---|
| 4.1 | `CONTENT.steps.items[1]` („Individuelle Planung“) ersetzen | Text | **title:** „Von Hand gezeichnet“ · **text:** „Harald Menghin zeichnet Ihre Küche zuerst von Hand: Wege, Arbeitsdreieck, Stauraum und Licht. Danach planen wir sie in 3D mit exakten Maßen und Anschlüssen.“ |
| 4.2 | `CONTENT.steps.items` neuer Eintrag nach Index 2 | Text | **title:** „Rendering vor der Bestellung“ · **text:** „Sie sehen Fronten, Arbeitsplatte und Licht als fotorealistisches Bild, bevor etwas bestellt wird.“ |
| 4.3 | `CONTENT.steps.link` (s. 2.4) | Komponente | „So arbeiten wir im Detail“ → `/arbeitsweise` |
| 4.4 | `CONTENT.intro.benefits` neuer erster Eintrag | Text | „Küchenplanung von Hand gezeichnet, dann in 3D“ |
| 4.5 | `CONTENT.faq.items` neu | Text | **F:** „Kann ich meine Küche erst online planen?“ **A:** „Ja. Mit dem Küchenplaner legen Sie Grundriss und Zeilen selbst an. Wenn Sie danach mit uns planen, zeichnet Harald Menghin Ihre Küche von Hand weiter, und wir prüfen Maße und Anschlüsse vor Ort.“ `[nur, wenn der Küchenplaner öffentlich ist]` |

---

## 5. Regionsseiten (13 Seiten `designermoebel-*`, dazu `moebel-bodensee`, `wohnzimmer-einrichten-vorarlberg`)

**Dateien:** `src/app/[locale]/designermoebel-{appenzell,arlberg,bregenz,dornbirn,feldkirch,friedrichshafen,kempten,konstanz,liechtenstein,lindau,ravensburg,rheintal,st-gallen}/page.js`, `src/app/[locale]/moebel-bodensee/page.js`, `src/app/[locale]/wohnzimmer-einrichten-vorarlberg/page.js`.

**Regel Doorway-Schutz (Bibel §10.2, `tests/unit/sitemap.test.mjs`):** Keine Textkopie zwischen Regionsseiten. Deshalb **nicht** den gleichen Absatz überall einfügen. Stattdessen:

| # | Position | Art | Text |
|---|---|---|---|
| 5.1 | jede Seite: `CONTENT.steps.link` | Komponente (gleicher Link, kein Fließtext) | „Unsere Arbeitsweise: von der Handzeichnung zum Rendering“ → `/arbeitsweise` |
| 5.2 | jede Seite: `CONTENT.steps.items[2]` („Auswahl & Planung“) | **ortsbezogener** Satz, je Seite eigener Text | Muster: „Wir kommen zu Ihnen nach {Ort}, sehen uns Licht und Räume an, und Harald Menghin zeichnet Ihr Konzept von Hand. {ortsspezifischer Zusatz}.“ Zusätze: **Bregenz** „Mit Blick auf See und Pfänder planen wir das Licht mit.“ · **Dornbirn** „Für Neubauten im Rheintal gern schon zum Rohbau.“ · **Lindau** „Für die Insel und die Uferlagen achten wir auf Zugang und Anlieferung.“ · **Friedrichshafen** „Ein Termin vor Ort lässt sich mit dem Weg über Lindau verbinden.“ · **St. Gallen / Appenzell / Rheintal / Liechtenstein** „Die Offerte erhalten Sie nach der Planung in Franken.“ `[nur, wenn CHF-Offerte gilt, Bibel §10.2]` · **Arlberg** „Für Chalets und Ferienwohnungen planen wir mit den Gewerken vor Ort.“ · **Feldkirch** „Für Altbauten nehmen wir uns die Zeit, den Bestand genau aufzunehmen.“ · **Konstanz / Ravensburg / Kempten** „Bei größeren Projekten bleiben wir, wenn nötig, auch ein, zwei Tage vor Ort.“ (je Ort umformulieren, nicht dreimal identisch) |
| 5.3 | `moebel-bodensee`, `wohnzimmer-einrichten-vorarlberg` | wie 5.1 + ein eigener Satz im Intro | „Bevor wir Möbel vorschlagen, zeichnet Harald Menghin Ihren Raum von Hand.“ |

Die Doorway-Fakten (`facts`) bleiben unverändert; der USP ist kein Ortsfakt.

---

## 6. Team-Seite

**Dateien:** `src/app/[locale]/ueber-uns/team/page.js` · `src/components/Team/team.js` · `src/components/Team/teammember.js` · Texte `inhalt.team.*` · Daten aus dem Backoffice (`fetchTeamData`).

| # | Position | Art | Text / Komponente |
|---|---|---|---|
| 6.1 | `page.js`: zwischen `<Teamsecond />` und `<TeamMember />` | neue Sektion `TeamDrawing` (`tone="surface"`, asymmetrisch: Porträt `media.portrait` 4:5 links, Skizze `media.handzeichnung` 1:1 rechts unten versetzt) | **Overline:** DER ZEICHNER · **H2:** Harald Menghin zeichnet Ihre Räume von Hand. · **Text:** „Bevor wir am Bildschirm planen, entsteht Ihr Konzept auf Papier und im Modell. So sehen Sie früh, wohin die Reise geht, und können mit uns am Tisch daran weiterarbeiten.“ · **Rolle:** Designer & Zeichner `[Inhaber]` · **Link:** Unsere Arbeitsweise. Ohne Porträt: Initialen-Kachel (`PortraitTile`), ohne Skizze: nur Text |
| 6.2 | `teammember.js`: Karte von Harald | Daten (Backoffice) | Rolle im Backoffice-Feld eintragen (bestätigter Titel); optional zweites Bild = Skizze. Kein Code nötig, wenn das Feld existiert |
| 6.3 | `inhalt.team.introTitle` „Mit Herz und Verstand für Ihr Zuhause“ | optional | „Mit Zeit, Stift und Verstand für Ihr Zuhause“ |
| 6.4 | Team-JSON-LD (falls vorhanden) | Person | `jobTitle` erst nach Bestätigung |

---

## 7. Online-Planer (Küche, Sofa, Stil-Finder)

**Brückensatz (USP-Doku, angepasst):** „Online starten. Wenn Sie danach mit uns planen, zeichnet Harald Menghin Ihr Konzept von Hand weiter.“ Komponente `HandoffNote`. **Eigentümer:** Labs-Team (tabu bis Freigabe). Labs-Hinweise (Testmodus, nichts gesendet) bleiben unverändert.

| # | Datei | Position | Text |
|---|---|---|---|
| 7.1 | `src/app/[locale]/labs/kuechenplaner/page.js` | unter der H1 „Ihre Küche, in 3D geplant.“ (Zeile ~39), als `small`-Zeile | „Online starten. Harald Menghin zeichnet Ihre Küche danach von Hand weiter.“ + Link „Wie wir arbeiten“ |
| 7.2 | `src/components/Labs/Kuechenplaner/ResultPanel.js` | Abschnitt „Planung anfragen“ (`#kp-req`, Zeile ~401): Absatz unter der H3 ersetzen | „Wir prüfen Ihre Planung, messen auf Wunsch vor Ort auf, und Harald Menghin zeichnet Ihre Küche von Hand weiter. Danach sehen Sie sie als Rendering, bevor etwas bestellt wird.“ |
| 7.3 | `src/components/Labs/Kuechenplaner/ResultPanel.js` | unter dem Hinweis „Unverbindlicher Rahmen …“ (Zeile ~302) | keine Änderung (Preisrahmen bleibt sachlich) |
| 7.4 | `src/app/[locale]/labs/sofaplaner/page.js` | unter der H1 „Sofaplaner“ (Zeile ~43) | „Stellen Sie Ihr Sofa online zusammen. Im Studio zeichnen wir, wie es in Ihrem Raum steht.“ |
| 7.5 | `src/components/Labs/Sofaplaner/ResultPanel.js` | Formular-H4 „Planung im Showroom besprechen“, Absatz darunter (Zeile ~201) | „Wir sehen uns Ihren Plan gemeinsam an, mit Stoff- und Ledermustern und Probesitzen in Lochau. Auf Wunsch zeichnet Harald Menghin, wie das Sofa in Ihrem Raum steht.“ |
| 7.6 | `src/components/Labs/Stilfinder/StilResult.js` | Walnut-Sektion „Nächster Schritt“ (`#sf-next`, Zeile ~215), Absatz unter der H2 | „Zeigen Sie uns Ihr Ergebnis beim Termin. Harald Menghin macht daraus die erste Handzeichnung für Ihre Räume, so beginnen wir bei „{profile.name}“ statt bei null.“ |
| 7.7 | `src/app/[locale]/labs/stilfinder/page.js` bzw. `StilfinderQuiz.js` Startbildschirm | eine `small`-Zeile unter dem Intro | „Ihr Ergebnis nehmen wir in den Termin mit: Harald zeichnet weiter.“ |
| 7.8 | Künftige Ergebnis-E-Mails/PDFs der Planer (`src/lib/stilfinder/*`, Küchenplaner-Druck `labs/kuechenplaner/druck/page.js`) | Fußzeile des Ausdrucks | „Nächster Schritt: Termin in Lochau. Wir sehen uns Ihre Räume an, und Harald Menghin zeichnet Ihr Konzept von Hand.“ |

Bedingung: Die Brücke verspricht nur, was gilt. Wenn die Handzeichnung nicht bei jedem Sofa- oder Einzelstück-Auftrag dabei ist, gilt die „auf Wunsch“-Fassung (7.5).

---

## 8. Hotel / Contract

**Stand:** Es gibt noch keine Hotel-/Contract-Seite im Baum (geprüft 28.10.2026). Die Startseiten-Weiche „Ich plane … ein Hotel“ (Bibel §10.2) und der Wachstumsrat sehen eine vor.

| # | Datei | Position | Text |
|---|---|---|---|
| 8.1 | künftige Seite (Vorschlag `src/app/[locale]/hotel-contract/page.js`, `OutdoorLanding`-Muster) | Kapitel „So arbeiten wir“ nach dem Intro | **H2:** „Gezeichnet für Ihre Gäste.“ · **Text:** „Wir verbringen Zeit in Ihrem Haus, bevor wir planen: Wege der Gäste und des Personals, Licht, Lärm, Reinigung. Harald Menghin zeichnet die Zimmer und öffentlichen Bereiche von Hand und baut ein Modell eines Musterzimmers. Danach planen wir in 3D und zeigen Renderings, bevor bestellt wird. Für größere Häuser bleiben wir auch ein, zwei Tage vor Ort.“ · `ProcessStrip compact` |
| 8.2 | gleiche Seite, FAQ | Text | **F:** „Planen Sie ein Musterzimmer, bevor alle Zimmer bestellt werden?“ **A:** „Das empfehlen wir. Zuerst als Zeichnung und Modell, dann als Rendering. Ob ein gebautes Musterzimmer sinnvoll ist, besprechen wir mit Ihnen.“ `[Inhaber]` |
| 8.3 | Rahmenvertrag Hotel (Wachstumsrat/Recht) | Leistungsbeschreibung | Phasen = die 7 Schritte, Abnahme je Phase (Skizze, Modell, Rendering) schriftlich |

---

## 9. Yacht-Interior

**Datei:** `src/app/[locale]/yacht-interior/page.js` (`CONTENT.course`, `CONTENT.concepts`) · `src/components/Landing/Yacht/YachtLanding.js` · **Eigentümer:** Yacht-Team (tabu).

**Achtung Kennzeichnung:** Die Yacht-Konzeptbilder sind teilweise KI-Visualisierungen (`content.concepts.aiNote`). Sie dürfen **nicht** als Haralds Rendering oder Skizze bezeichnet werden. Der USP-Text spricht deshalb vom künftigen, echten Prozess.

| # | Position | Art | Text |
|---|---|---|---|
| 9.1 | `CONTENT.course.items[2]` („Konzept“, Nov.–Dez.) → Feld `us` | Text | „Harald Menghin zeichnet die Zonen von Hand, danach Farbwelt, Material und Produktliste je Zone in 3D, mit klarer Aufstellung, wer was macht“ |
| 9.2 | `CONTENT.course.items[1]` („Besichtigung an Bord“) → `us` | Text | „Zeit an Bord: Nutzung, Licht, Stil und Zonen besprechen, wenn nötig auch einen ganzen Tag“ |
| 9.3 | `CONTENT.course.text` letzter Satz anhängen | Text | „Wie an Land beginnt die Planung mit dem Stift und endet mit einem Rendering vor der Bestellung.“ |
| 9.4 | `CONTENT.concepts.aiNote` | unverändert lassen | – (KI-Kennzeichnung bleibt Pflicht) |

---

## 10. Outdoor / Gartenplanung

**Datei:** `src/app/[locale]/outdoor-gartenplanung/page.js` (`CONTENT.season`) · Layout `OutdoorLanding.js` (Walnut ist dort schon „Pflege & Einlagerung“, also kein zweites Dunkel).

| # | Position | Art | Text |
|---|---|---|---|
| 10.1 | `CONTENT.season.items[0]` („Erstgespräch & Aufnahme“) → `text` | Text | „Wir lernen Ihr Grundstück kennen: Wünsche, Nutzung, Sonnenstand, Wind, Blick, Budgetrahmen. Gern im Showroom-Café in Lochau, besser noch bei Ihnen vor Ort, wenn nötig über einen ganzen Tag, damit wir Morgen- und Abendlicht sehen.“ |
| 10.2 | `CONTENT.season.items[1]` („Konzept & Bemusterung“) → `text` | Text | „Harald Menghin zeichnet das Outdoor-Konzept von Hand, danach folgt die 3D-Visualisierung. Stoffe und Materialien sehen Sie im Showroom. Der Gartenplan entsteht beim Fachbetrieb, die Angebote kommen von jedem Betrieb einzeln.“ |
| 10.3 | nach `season`-Sektion | `ProcessStrip line` | „Unsere Arbeitsweise: von der Handzeichnung zum Rendering“ |

---

## 11. Ezarri / Pool

**Stand:** Die Ezarri-Welt wird parallel gebaut, im Baum gibt es noch keine Ezarri-Dateien (geprüft 28.10.2026). Einfügen, sobald das Ezarri-Team die Seite fertig hat. Ezarri-Inhalte (Bilder, Daten) sind Herstellermaterial, **keine** Platzhirsch-Skizzen.

| # | Datei (voraussichtlich, laut Ezarri-Team bestätigen) | Position | Text |
|---|---|---|---|
| 11.1 | Ezarri-Startseite der Welt | Kapitel nach dem Sortiment, vor dem Konfigurator | **Overline:** PLANUNG MIT PLATZHIRSCH · **H2:** „Ihr Pool, zuerst von Hand gezeichnet.“ · **Text:** „Mosaik wirkt erst im Licht und am Ort. Wir sehen uns Ihren Pool oder Ihr Bad vor Ort an. Harald Menghin zeichnet Muster, Farbverläufe und Übergänge von Hand. Danach planen wir in 3D und zeigen Ihnen ein Rendering mit den Ezarri-Farben, bevor bestellt wird.“ |
| 11.2 | Ezarri-Konfigurator, Ergebnis-Bereich | `HandoffNote` | „Online gestalten. Wenn Sie danach mit uns planen, zeichnet Harald Menghin Ihr Mosaik von Hand weiter und prüft es vor Ort.“ |
| 11.3 | Ezarri-FAQ | Text | **F:** „Sehe ich das Mosaik vor der Bestellung?“ **A:** „Ja, als Muster im Showroom und als Rendering Ihrer Planung. Muster vor Ort am Pool sind auf Anfrage möglich.“ `[Ezarri-Team: Musterverfügbarkeit prüfen]` |

---

## 12. Navigation, Footer, Sitemap

**Eigentümer:** Navbar-Team (tabu) · SEO-Team.

| # | Datei | Position | Text |
|---|---|---|---|
| 12.1 | `src/components/Navbar/shellNav.js` → Menü `services`, Spalte `nav.planning` | zweiter Link nach `consultation` (nur DE, bis EN/FR/IT übersetzt) | Label `nav.approach`: „Unsere Arbeitsweise“ → `/arbeitsweise` |
| 12.2 | `shellNav.js` → Menü `house`, Spalte `nav.houseGroup` | nach `nav.about` | „Arbeitsweise“ → `/arbeitsweise` |
| 12.3 | `src/messages/de.json` → `Navbar.servicesIntro` | Text ergänzen | „Von der Handzeichnung bis zur Montage: Küche, Interior, Outdoor und Yacht.“ |
| 12.4 | `src/components/Reusable/Footer.js` | Link-Spalte „Das Haus“ | „Arbeitsweise“ |
| 12.5 | `src/utils/routing.js` → `ROUTES.arbeitsweise` und `src/proxy.js` Slug-Liste | neu | de `/arbeitsweise`, en `/approach`, fr `/demarche`, it `/metodo` |
| 12.6 | `src/lib/seo/sitemap/extraPages.js` | neuer Eintrag, erst mit `index: true` | llms: „Arbeitsweise von Platzhirsch: Termin vor Ort, Handzeichnung und Raummodell von Harald Menghin, danach 3D-Planung und fotorealistisches Rendering vor der Bestellung.“ |
| 12.7 | `src/app/llms.txt/route.js` | Abschnitt „Über uns“ | gleiche Zeile wie 12.6 |
| 12.8 | `src/lib/seo/structuredData.js` → Organization | `knowsAbout` ergänzen | „Einrichtungsplanung mit Handzeichnung“, „Raummodell“, „3D-Einrichtungsplanung“, „fotorealistisches Rendering“ |

---

## 13. Kampagnen, Ads, Newsletter, Social, Print

**Leitmotiv:** Inhaber-Vorschlag „Von Hand gezeichnet. Digital perfektioniert.“; Empfehlung des Konzepts: **„Von Hand gezeichnet. Im Raum gebaut.“** (keine Superlativ-Nähe). Die Werbetexter entscheiden. Alle Anzeigentexte laufen durch das Claims-Register (Rechtspaket §4, keine Superlative, keine Händler-Formeln).

| # | Kanal / Datei | Position | Text |
|---|---|---|---|
| 13.1 | Newsletter-Anmeldung `src/components/Newsletter/NewsletterContent.js` / `newsletterbanner.js` | Lead über dem Formular | „Einmal im Monat aus dem Studio: neue Stücke in Lochau, Termine und ein Blick auf den Zeichentisch.“ `[nur, wenn das Format so kommt]` |
| 13.2 | Newsletter-Rubrik (redaktionell) | fester Block je Ausgabe | **„Vom Zeichentisch“:** eine echte Skizze, ein Satz, was sie zeigt, Link zur Arbeitsweise. Nur mit Projekt-Einwilligung |
| 13.3 | Google Ads, Suchanzeigen | Headlines (≤ 30 Z.) | „Von Hand gezeichnet“ · „Interior Designer Vorarlberg“ · „Raumkonzept mit Modell“ · „Erst Skizze, dann 3D“ · „Rendering vor der Bestellung“ · Beschreibung (≤ 90 Z.): „Wir kommen zu Ihnen, zeichnen Ihr Konzept von Hand und planen es in 3D. Showroom in Lochau.“ |
| 13.4 | Meta/Instagram/Pinterest | Serie 9:16 | Reel „Vom Strich zum Raum“: echte Hand → Skizze → Modell → Rendering → Foto, 12–20 s, Untertitel. Kein KI-Material |
| 13.5 | Print / Schaufenster / Fahrzeug | Zeile unter dem Logo | „Von Hand gezeichnet. Im Raum gebaut.“ |
| 13.6 | Showroom | Zeichentisch als Station mit echten Skizzen und einem Modell, QR auf `/arbeitsweise` | Tischkarte: „Hier entstehen unsere Entwürfe. Fragen Sie Harald.“ `[Inhaber]` |
| 13.7 | Angebots-PDF / Auftragsbestätigung | Deckblatt | Skizze des Kundenraums als Titelbild (Kunde sieht „sein“ Blatt) |
| 13.8 | Google-Unternehmensprofil (Inhaber pflegt) | Beschreibung | Satz `einSatz` ergänzen; Fotos „Zeichentisch“ und „Modell“ hochladen |

---

## 14. Weitere Stellen (empfohlen)

| # | Datei | Position | Text |
|---|---|---|---|
| 14.1 | `src/app/[locale]/ueber-uns/platzhirsch/page.js` („Das Haus“) | nach dem Kapitel zum Showroom | `ProcessStrip compact` mit Satz: „Im Showroom sitzen Sie bei Kaffee am Tisch, an dem Harald Menghin auch zeichnet.“ `[nur wenn zutreffend]` |
| 14.2 | `src/app/[locale]/projekte/[slug]/page.js` (Projektseite, Bibel §10.2) | Faktenzeile + neues Kapitel „Vom Strich zum Raum“ | Vorher-Nachher-Kette (wie Konzept K8) je Projekt, wenn Material vorliegt |
| 14.3 | `src/app/[locale]/portal/projekte/[id]` (Kundenportal) | Projektzeitachse | Phasen = die 7 Schritte; Skizze, Modell, Rendering als Freigabe-Stationen |
| 14.4 | Terminbestätigung (Tischkarte, Bibel §8.3) | Zusatzfrage | „Haben Sie Grundriss oder Fotos? Dann kann Harald schon vor dem Termin einen Blick darauf werfen.“ |
| 14.5 | Ratgeber (`src/content/ratgeber/*`) | neuer Artikel | „Warum wir Räume zuerst von Hand zeichnen“ (nur echte Beispiele) |

---

## 15. Abnahmekriterien für das Integrationsteam

1. Jede Stelle nutzt die Texte aus `src/lib/arbeitsweise/copy.js` bzw. den messages-Schlüsseln, keine abweichenden Schrittnamen.
2. Keine Stelle zeigt ein Bild als Haralds Arbeit, das nicht aus `media.js` mit `credit` und `einwilligung` kommt. Kein KI-Bild als Skizze, Modell oder Rendering.
3. Im Livegang 0 sichtbare „Bild folgt“-Platzhalter auf allen Seiten.
4. Pro Seite weiterhin höchstens 1 Walnut-Fläche und 1 Horizontlinie (bestehende Tests grün).
5. Regionsseiten: Doorway-Test grün, kein identischer USP-Absatz auf zwei Regionsseiten.
6. Versprechen nur in der bestätigten Fassung: „ein, zwei Tage“ nur mit „wenn Ihr Projekt es braucht“, kein Preis, „jede Planung“ nur nach Inhaber-OK.
7. FAQ-Änderungen spiegeln sich im FAQPage-JSON-LD derselben Seite.

## 16. Reihenfolge (Vorschlag)

1. `copy.js` + `media.js` + Bausteine `ProcessStrip` und `HandoffNote` (Arbeitsweise-Team)
2. Seite `/arbeitsweise` (noindex)
3. Landingpages Interior, Küchen, Beratung (Texte, `steps.link`)
4. Planer-Brücken (nach Freigabe Labs-Team)
5. Startseite-Kapitel (nach Freigabe Home-Team)
6. Team-Seite, sobald Porträt da ist
7. Navigation, Footer, Sitemap mit dem Indexieren der Seite
8. Yacht, Outdoor, Ezarri, Hotel mit den jeweiligen Teams
9. Kampagnen nach Entscheidung über das Leitmotiv
