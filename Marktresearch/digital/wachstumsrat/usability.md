# Wachstumsrat – Website-Nutzungsexperten (Usability und Informationsarchitektur)

> Kürzel: `usability` · Stand 28.10.2026 · Gremium bewertet nur, kein Code geändert, kein Formular abgeschickt.
> Grundlage: Code unter `src/` (gelesen), gerenderte Seiten vom Dev-Server `http://localhost:3000` (per curl und `tools/qa/shoot.mjs`), Inhaber-Entscheidungen (`teamleiter/inhaber-entscheidungen.md`, v. a. Nr. 7 Ezarri und Nr. 9 „Labs integrieren“), Masterkonzept 23 (Abschnitt 8 Hotels/Bauträger/Architekten), Expertenrat 08 (UX/IA), Wachstumsrat `hotel-contract.md`, `yacht.md`, `pool-architektur.md`.
> Screenshots: `qa-screenshots/wachstumsrat/usability/` (Startseite, Suche-Fallback `/de/produkte?q=minoti`, 404).
> **Einschränkung Methode:** Der Dev-Server war während der Prüfung stark ausgelastet (3 andere Workflows; Antwortzeiten 11–160 s pro Seite). Live gerendert und ausgewertet wurden deshalb 10 Seiten (`/de`, `/de/produkte`, `/de/produkte?q=minoti`, `/de/yacht-interior`, `/de/labs`, `/de/portal`, `/de/ezarri`, `/de/hotel-contract`, eine 404-URL). Die übrigen der 30 Seiten sind aus dem Quellcode und den Message-Dateien bewertet und in der Tabelle als „Code“ markiert. Ladezeiten des Dev-Servers sind **kein** Maßstab für Produktion und fließen nicht in die Note ein.
> Kennzeichnung: **[belegt]** = im Code/HTML nachgesehen, **[Quelle]** = externe Studie, **[Schätzung]** = fachliche Annahme, im Test zu prüfen.

---

## 1. Urteil zum Ist-Stand

| Bereich | Note (1–10) | Kurzbegründung |
|---|---|---|
| Kern-Navigation Sortiment (Wohnen, Küche, Schlafen, Outdoor, Marken) | **7** | Raum-zuerst-Logik, Mega-Panels, Hub-Links, aria-current, mobile `<details>`-Akkordeon. Sauber gebaut. |
| Navigation der neuen Geschäftsfelder (Yacht, Pool/Ezarri, Hotel, Planer, Bauträger) | **3** | Hotel und Planer haben keinen Ort, Ezarri liefert 404 und hängt nur im Labs-Menü, Yacht und Outdoor stehen doppelt in zwei Menüs. |
| Suche | **4** | Live-Suche technisch ordentlich (Abbruch, Debounce, 429-Hinweis), aber: nur Produkte/Marken/Kategorien, kein Tippfehler-Ausgleich, und die Enter-Taste ohne Treffer führt in einen Katalog, der die Suchanfrage ignoriert. |
| Fehlermeldungen | **8** | Formular-Infrastruktur (FormAlert mit Fehlerliste, Fokus aufs erste Feld, aria-invalid) und Fehlerseite mit „Erneut versuchen“ + Telefon sind vorbildlich. 404 gut, aber ohne Suche. |
| Ladezustände | **5** | Nur eine `loading.js` (Stil-Finder). Kategorie-, Produkt- und Markenseiten hängen am Backoffice; bei langsamer Antwort passiert nach dem Klick sichtbar nichts. Suche zeigt „…“ als einzigen Ladehinweis. |
| Glaubwürdigkeit der öffentlichen Oberfläche | **4** | `/de/labs` (im Hauptmenü verlinkt) zeigt Kunden Umgebungsvariablen („Schalter: NEXT_PUBLIC_FEATURE_KUECHENPLANER =1“), „Senden erst nach Freigabe“, „Seite entsteht gerade“; die Startseite zeigt „Labs-Prototyp“-Plaketten. |
| **Gesamt Usability/IA** | **6 / 10** | Das Fundament ist gut. Was fehlt, ist die Struktur für die neuen Umsatzfelder und eine Suche, die Leistungen findet. Beides ist mit wenig Kapital lösbar. |

---

## 2. Befunde (Nielsen-Heuristiken, Schweregrad 0–4)

Schweregrad nach Nielsen: 4 = Katastrophe, vor Livegang beheben · 3 = großes Problem, hohe Priorität · 2 = kleines Problem · 1 = kosmetisch.
Heuristiken: H1 Sichtbarkeit des Systemstatus · H2 Übereinstimmung mit der realen Welt · H3 Kontrolle und Freiheit · H4 Konsistenz und Standards · H5 Fehlervermeidung · H6 Wiedererkennen statt Erinnern · H7 Flexibilität und Effizienz · H8 Ästhetik und Minimalismus · H9 Fehler erkennen und beheben · H10 Hilfe und Dokumentation.

| ID | Sev | Heur. | Befund | Beleg | Folge |
|---|---|---|---|---|---|
| **B1** | **4** | H1, H9 | **Suche ins Leere.** Enter ohne Live-Treffer schickt auf `/produkte?q=<Begriff>`. Der Katalog liest `q` nicht aus (keine Filtergruppe `q` in `FILTER_GROUPS`, `shopCatalog.js` Z. 56–64). Ergebnis: alle Produkte, ungefiltert, ohne Hinweis. Live geprüft: `/de/produkte?q=minoti` ist bis auf 45 Byte Router-Payload identisch mit `/de/produkte`. | `SearchSheet.js` `onSubmit`; HTML-Vergleich [belegt] | Wer sich vertippt („minoti“, „poliforme“) oder eine Leistung sucht, bekommt 1.700+ Kacheln und glaubt, die Suche sei kaputt. |
| **B2** | **3** | H2, H7 | **Suche kennt keine Leistungen und Inhalte.** `/api/shop-search` durchsucht nur Marken, Kategorien, Produkte. „Küchenplanung“, „Yacht“, „Pool“, „Mosaik“, „Hotel“, „Öffnungszeiten“, „Gutschein“, „Zoll Schweiz“, „Termin“ liefern nichts. Der Platzhalter verspricht „Marke, Stück oder Raum“ – Räume („Wohnzimmer“, „Bad“, „Terrasse“) werden aber nicht gefunden. Baymard: 34 % der Nutzer suchen nach Nicht-Produkt-Inhalten, 15 % der Shops scheitern daran. | `api/shop-search/route.js`; `Shell.header.searchPlaceholder` [belegt]; [Baymard „Support Non-Product Search“](https://baymard.com/research-articles/support-non-product-search) [Quelle] | Genau die margenstarken Felder (Küche, Interior, Hotel, Pool) sind über die Suche unsichtbar. |
| **B3** | **3** | H5, H9 | **Kein Tippfehler-Ausgleich.** Abgleich ist reines `includes()` (Teilstring). Markennamen sind italienisch und werden häufig falsch geschrieben. | `route.js` (`m.name1.toLowerCase().includes(needle)`) [belegt] | Null-Treffer bei Marken, die im Sortiment sind. |
| **B4** | **4** | H2, H8, Vertrauen | **Interne Entwicklersprache vor Kunden.** `/de/labs` ist im Hauptmenü („Planen & Erleben → Alle Werkzeuge im Überblick“) und zeigt „Schalter: NEXT_PUBLIC_FEATURE_… =1“, „Richtpreise erst nach Freigabe der Preistabelle, Senden erst nach Freigabe“, „Seite entsteht gerade“, Plaketten „Labs-Prototyp“ / „Im Aufbau“. Die Startseite („Vorab ausprobieren“) zeigt dieselben Plaketten. Widerspricht Inhaber-Entscheidung Nr. 9 (keine separate Labs-Welt, eigene URLs außerhalb `/labs`). | `de_labs.html`, `de.html` (3× „Labs-Prototyp“) [belegt] | Ein Luxuskunde liest „Prototyp“ als „unfertig“. Kostet Vertrauen genau dort, wo die Planer überzeugen sollen. |
| **B5** | **3** | H4, H6 | **8 Hauptpunkte, zwei davon überlappen.** Wohnen · Küche · Schlafen · Outdoor · Marken · Leistungen · Planen & Erleben · Das Haus. Yacht und Outdoor-Planung stehen sowohl unter „Leistungen“ als auch unter „Planen & Erleben“ (`alsoIn`). „Leistungen“ vs. „Planen & Erleben“ ist für Nutzer nicht unterscheidbar (beides „planen“). | `shellNav.js`, `features.js` [belegt]; Expertenrat 08: max. 7 Punkte | Nutzer müssen raten, unter welchem Punkt ein Planer steckt (H6). |
| **B6** | **3** | H2 | **Die neuen Umsatzfelder haben keinen Platz.** Hotel/Gastronomie: keine Seite (`/de/hotel-contract` → 404), kein Menüpunkt. Architekten/Planer und Bauträger: nichts. Ezarri/Pool: `/de/ezarri` → 404 (entsteht), nur im Labs-Menü unter „Erleben“. Yacht: nur unter „Leistungen“. | curl-Status [belegt]; Masterkonzept 23 §8 (Hotels, Bauträger, Architekten als Vertriebskanäle) | Ein Hotelier oder Architekt erkennt in 5 Sekunden nicht, dass Platzhirsch für ihn arbeitet. |
| **B7** | **3** | H4 | **„Leistungen“ hat keine Übersichtsseite.** Der Hub-Link „all“ führt auf `/beratung`. NN/g: jeder Hauptpunkt braucht eine echte Übersichtsseite. | `shellNav.js` (`all: consultation`) [belegt]; [NN/g Mega Menus](https://www.nngroup.com/articles/mega-menus-work-well/) [Quelle] | Kein Ort, an dem alle Leistungen auf einen Blick stehen; schwach für SEO-Hub-Struktur. |
| **B8** | **2** | H8 | **Doppelte Etiketten in Panels.** Leistungen: „Beratung & Termin“ als Hub-Link und als erster Link der Spalte „Planung“; Spalte „Ratgeber“ mit genau einem Link „Ratgeber“. Küche: „Küchen ansehen“, Spaltentitel „Küchen“, Link „Küchen“. | gerendertes Menü `de.html` [belegt] | Rauschen, wirkt unfertig. |
| **B9** | **2** | H3 | **Sprachwechsel verliert den Kontext.** Auf deutschsprachigen Seiten führt EN/FR/IT zur Startseite. In EN/FR/IT zeigt „Leistungen“ nur „Beratung & Termin“; Interior, Küchenplanung, Yacht fehlen ganz. | `navMatch.js` `translatePathWith`, `shellNav.js` (`isDe ? … : []`) [belegt] | Schweizer Romands, Tessiner und Arlberg-Investoren finden keine Leistung. |
| **B10** | **2** | H6, H4 | **Bezeichnungen und Orte passen nicht zusammen.** „Marken“ ist Hauptpunkt, URL liegt unter `/ueber-uns/marken`. Menü sagt „Ihre Auswahl“, URL `/merkliste`. „Mein Platzhirsch“ (Portal) steht nur im Labs-Menü, nicht in der Kopfleiste, wo Bestandskunden ihn suchen. | `routing.js`, `features.js` [belegt] | Wiederkehrende Kunden (Portal = Wiederkauf) brauchen zu viele Klicks. |
| **B11** | **2** | H1 | **Ladezustände fehlen bei Seitenwechseln.** Nur `labs/stilfinder/ergebnis/[profil]/loading.js`. Kategorie, Produkt, Marke, Kollektion holen Daten vom Backoffice; ohne `loading.js` bleibt die alte Seite stehen, bis die neue fertig ist. Suche zeigt nur „…“. | `find src/app -name loading.js` [belegt] | Doppelklicks, Abbrüche auf Mobilfunk. |
| **B12** | **2** | H4 | **Brotkrumen lückenhaft.** Vorhanden u. a. auf Produkt, Katalog, Marke, Kontakt, Beratung, Merkliste, Regionsseiten, Yacht. Fehlen auf Outdoor-Gartenplanung, Ratgeber, Projekte, Sofaplaner, Stil-Finder, Arbeitsweise, Portal. | Import-Analyse der `page.js` [belegt, Code] | Orientierung in den neuen Bereichen schwächer als im Shop. |
| **B13** | **2** | H9 | **404 ohne Suche.** Gute Seite (H1, Startseite, 3 Auswege), aber kein Suchfeld und keine Wege zu Leistungen/Termin. Seitentitel nur „Platzhirsch Home Living“. | `NotFoundContent.js`, `de_gibtsnicht.html` [belegt] | Alte Google-Links (WordPress-Ära) landen in einer Sackgasse ohne Suche. |
| **B14** | **1** | H4 | **Verwaiste generische Fehlertexte** in `de.json`: „Fehler beim Absenden der Nachricht.“ (`MultiStepForm.notification.submitError`), „Fehler beim Senden der Anfrage“ (`enquiry.error.apiFailed`). In keiner Komponente mehr verwendet. | grep [belegt] | Gefahr, dass sie bei neuen Formularen (Hotel, Ezarri) wieder genutzt werden. |
| **B15** | **1** | H2 | **„Projekte“ ist leer und noindex**, Yacht steht auf Inhaber-Entscheidung noindex. Beides ist korrekt, solange Referenzen/Bildfreigaben fehlen. Projekte darf erst ab ≥ 6 Referenzen in die Hauptnavigation. | `hotel-contract.md` Z. 15; `yacht-interior/page.js` Z. 7–34 [belegt] | Kein Fehler, aber Abhängigkeit für das neue Menü (s. 3.1). |

**Was gut ist (bleibt so):** Skip-Link, `<dialog>` mit nativer Fokusfalle für Suche und Menü, Esc schließt sofort, aria-live für Suchfehler und 429, Formular-Fehlerliste mit Sprunglinks, Fehlerseite ohne technische Details mit Telefon, 404 mit H1 statt „404“, exklusive `<details>` im Mobilmenü, Mobile-CTA-Leiste, Hinweis „nur auf Deutsch“ im Sprachmenü.

### 2.1 Heuristische Kurzbewertung der 30 wichtigsten Seiten

„Live“ = gerendertes HTML geprüft, „Code“ = aus Quelltext. Note 1–10 nur für Usability (nicht Design, nicht Inhalt).

| # | Seite | Prüfung | Note | Wichtigster Befund |
|---|---|---|---|---|
| 1 | `/de` Startseite | Live | 7 | Klarer Aufbau (H1, 11 Abschnitte). „Labs-Prototyp“-Plaketten im Block „Vorab ausprobieren“ (B4). Hotel/Pool fehlen als Einstieg (B6). |
| 2 | `/de/produkte` Katalog | Live | 7 | Gute Filter (7 Gruppen), Brotkrumen. Ignoriert `?q=` (B1). |
| 3 | `/de/produkte/<kategorie>` | Code | 7 | Filter, Leerzustand „Mit diesen Filtern finden wir nichts.“ gut. Kein `loading.js` (B11). |
| 4 | Produktdetail | Code | 7 | Brotkrumen, Anfrage. Kein `loading.js`. |
| 5 | `/de/ueber-uns/marken` | Code | 7 | Gute Übersicht; URL-Ort widerspricht Menü (B10). |
| 6 | Markenseite | Code | 7 | Brotkrumen; Kategorien je Marke. |
| 7 | Kollektion | Code | 7 | Brotkrumen. |
| 8 | `/de/beratung` | Code | 8 | Termin-Fluss mit Suspense, Brotkrumen. |
| 9 | `/de/kontakt` | Code | 8 | Formular-Infrastruktur vorbildlich. |
| 10 | `/de/merkliste` („Ihre Auswahl“) | Code | 7 | Etikett/URL-Bruch (B10). |
| 11 | `/de/interior-design-vorarlberg` | Code | 7 | Landingpage-Baukasten mit Brotkrumen. |
| 12 | `/de/kuechen-vorarlberg` | Code | 7 | Kein Link zum Küchenplaner im Menü der Küche (nur Labs-Menü). |
| 13 | `/de/wohnzimmer-einrichten-vorarlberg` | Code | 7 | Nur als „extra“ im Wohnen-Panel. |
| 14 | `/de/outdoor-gartenplanung` | Code | 6 | Doppelt im Menü (B5), keine Brotkrumen (B12). |
| 15 | `/de/yacht-interior` | Live | 7 | Starke Seite (Brotkrumen, FAQ, CTA). Doppelt im Menü (B5). noindex nach Inhaber-Entscheidung. |
| 16 | `/de/ezarri` | Live | – | 404 (entsteht gerade, Ezarri-Workflow). Nur im Labs-Menü vorgesehen (B6). |
| 17 | `/de/hotel-contract` | Live | 1 | Existiert nicht (B6). |
| 18 | Architekten/Planer-Seite | – | 1 | Existiert nicht (B6). |
| 19 | `/de/labs` | Live | 3 | Entwicklersprache vor Kunden (B4). |
| 20 | Küchenplaner | Code | 6 | Brotkrumen ja; Plakette „Prototyp“; URL unter `/labs`. |
| 21 | Sofaplaner | Code | 6 | Keine Brotkrumen; URL unter `/labs`. |
| 22 | Stil-Finder | Code | 7 | Einzige Strecke mit Skeletons/`loading.js` – Vorbild für B11. |
| 23 | Dreiländer-Rechner | Code | 6 | Doppelt zur Seite „Einkaufen aus der Schweiz“ (zwei Rechner, zwei Orte). |
| 24 | AR-Viewer | Code | 6 | Als Menüpunkt falsch platziert: gehört an das Produkt, nicht ins Menü. |
| 25 | KI-Concierge | Code | 7 | KI-Kennzeichnung vorhanden; gehört als schwebender Knopf auf jede Seite, nicht als Menüpunkt. |
| 26 | `/de/portal` | Live | 6 | 307 auf Login korrekt; Zugang nur über Labs-Menü (B10). |
| 27 | `/de/ratgeber` | Code | 6 | Keine Brotkrumen; im Menü als Spalte mit einem einzigen Link (B8). |
| 28 | `/de/einkaufen-aus-der-schweiz` | Code | 7 | Brotkrumen, CHF-Rechner. Im Hauptmenü nicht erreichbar. |
| 29 | Regionsseite (z. B. Lindau) | Code | 7 | Nur Footer – richtig so. |
| 30 | 404 | Live | 7 | Gute Auswege, keine Suche (B13). |

---

## 3. FERTIG: Neue Informationsarchitektur

### 3.1 Menübaum (Desktop, Deutsch)

Grundsätze (Card-Sorting-Logik, s. 3.2): **Raum zuerst** für Privatkunden · **ein eigener Einstieg für Profis** (Hotel, Bauträger, Architekten, Yacht), weil deren Aufgaben völlig anders sind · **jede Option genau einmal** im Menü · **Werkzeuge dort, wo die Aufgabe ist** (Küchenplaner bei Küche), nicht in einem Werkzeug-Sammelpunkt · höchstens **7 Hauptpunkte** · jeder Hauptpunkt hat eine echte Hub-Seite.

```
[PLATZHIRSCH]  Wohnen  Küche  Outdoor & Pool  Marken  Objekte  Service  Das Haus     ⌕ Suche   ♡ Auswahl (n)   ◯ Mein Platzhirsch   DE ▾   [ Termin ]
```

```
1  WOHNEN                                   Hub: /produkte
   ├─ Sofas & Sessel        Sofas & Couches · Chaiselongues & Daybeds · Sessel & Hocker · → Sofa zusammenstellen (Sofaplaner)
   ├─ Stühle & Tische       Esszimmerstühle · Barhocker · Schreibtischstühle · Esstische · Couchtische · Beistelltische
   ├─ Aufbewahrung          Sideboards & Kommoden · Regale · TV- & Lowboards · Vitrinen · Kleinmöbel
   ├─ Schlafzimmer          Betten · Nachttische · Kleiderschränke · Bettwäsche          (bisher eigener Hauptpunkt „Schlafen“)
   ├─ Licht & Accessoires   Leuchten · Teppiche · Deko · Spiegel · Kerzen
   └─ Ideen                 Wohnzimmer einrichten · Stil-Finder · Ausstellungsstücke (Atelierverkauf)

2  KÜCHE                                    Hub: /kuechen-vorarlberg
   ├─ Küchen                Küchen ansehen · Küchenzubehör · Steinküchen (Binni, Kooperation)
   ├─ Planen                Küchenplanung im Studio · Küchenplaner online · Fotos & Grundriss senden
   └─ Marken                Küchen-Marken aus dem Sortiment (z. B. next125 – nur Markennamen, keine Händlerangabe)

3  OUTDOOR & POOL                           Hub: /outdoor-gartenplanung
   ├─ Möbel für draußen     Gartentische · Gartenstühle · Loungemöbel & Daybeds · Gartenliegen · Sonnenschirme · Heizstrahler
   ├─ Garten & Terrasse     Outdoor- und Gartenplanung (Koordination der Gewerke)
   └─ Pool, Bad & Wellness  Ezarri Glasmosaik (Vertragshändler) · Mosaik-Übersicht · Pool-Konfigurator · Bad & Wellness

4  MARKEN                                   Hub: /marken  (301 von /ueber-uns/marken)
   └─ 3 Spalten Leitmarken typografisch · „Alle Marken A–Z“ · Händler-Hinweis nur bei ClassiCon und Ezarri

5  OBJEKTE   (NEU)                          Hub: /objekte
   ├─ Hotel & Gastronomie   Hotel komplett einrichten · Restaurant & Bar · Hotel-Outdoor · „ÖHT-fähig planen“
   ├─ Yacht & Bootshaus     Yacht-Interior                                   (zieht aus „Leistungen“ hierher)
   ├─ Wohnprojekte          Für Bauträger: Penthouse- und Musterwohnungs-Pakete
   ├─ Für Architekten & Planer  Muster & Datenblätter · Ezarri-Technik · Zusammenarbeit
   └─ Referenzen            (erst sichtbar ab ≥ 6 freigegebenen Projekten; bis dahin ausgeblendet)

6  SERVICE                                  Hub: /leistungen (NEU, listet ALLE Leistungen inkl. Küche, Outdoor, Objekte)
   ├─ Beraten & Planen      Beratung & Termin · Interior Design · So arbeiten wir (Arbeitsweise)
   ├─ Digital vorbereiten   3D & AR ansehen · Fotos & Pläne per Handy senden · Stil-Finder (Zweitverweis nur auf Hub, nicht im Menü)
   ├─ Kaufen über die Grenze  Einkaufen aus der Schweiz & FL (mit Dreiländer-Rechner, ein Ort statt zwei)
   └─ Mehr                  Ratgeber · Gutscheine

7  DAS HAUS                                 Hub: /ueber-uns/platzhirsch
   ├─ Das Haus              Über Platzhirsch · Team · Presse · Partner · Karriere · Neuigkeiten · Veranstaltungen
   └─ Besuch                Kontakt & Anfahrt · Öffnungszeiten · Café ↗ · Newsletter

Utility (immer sichtbar): Suche · Ihre Auswahl · Mein Platzhirsch (Portal) · Sprache · [Termin]
Schwebend (jede Seite, rechts unten): KI-Concierge (gekennzeichnet „Sie schreiben mit einer KI“)
Nur am Produkt: „In 3D/AR ansehen“ (AR-Viewer) · „Sofa zusammenstellen“ bei passenden Modellen
Nur im Footer: Regionsseiten · Rechtliches · Gutscheinbedingungen
```

**Begründung der wichtigsten Entscheidungen**

| Entscheidung | Warum |
|---|---|
| „Schlafen“ wird Spalte in „Wohnen“ | Schlafen hat nur 4 Kategorien (gerendertes Menü: Betten, Nachttische, Kleiderschränke, Bettwäsche). Ein Hauptpunkt mit 4 Links ist der dünnste Punkt und gibt den Platz für „Objekte“ frei. B&B Italia und Minotti führen Betten ebenfalls unter Indoor/Products, nicht als eigenen Hauptpunkt ([bebitalia.com](https://www.bebitalia.com/en-it), [minotti.com](https://www.minotti.com/en)). Risiko: Suchende nach „Betten“ – deshalb Betten als erste Zeile der Spalte und in der Suche als Synonym. Im Tree-Test prüfen (3.2). |
| „Outdoor“ wird „Outdoor & Pool“ mit Ezarri | Im Denkmodell des Bauherrn gehören Pool, Terrasse und Garten zusammen („draußen am Haus“). Ezarri ist Vertragsmarke mit eigenem Konfigurator – er braucht einen festen, sichtbaren Ort. Bad & Wellness hängt als Unterpunkt dran, weil Platzhirsch keine eigene Bad-Kategorie hat. |
| Neuer Hauptpunkt „Objekte“ | NN/g rät von Zielgruppen-Navigation ab, **außer** die Zielgruppen haben völlig andere Aufgaben ([NN/g Audience-Based Navigation](https://www.nngroup.com/videos/audience-based-website-navigation/), [GOV.UK](https://insidegovuk.blog.gov.uk/2014/07/18/hey-you-there-the-trouble-with-audience-based-navigation/)). Das trifft hier zu: Hotelier, Bauträger und Architekt suchen FF&E-Pakete, Muster, Datenblätter, Förderung – keine einzelnen Sofas. Branchenstandard: B&B Italia hat „Contract“ und „A&D Area“ als Hauptpunkte, Minotti filtert „Projects“ nach Hotel & Resort und Yachting. „Objekt“ ist im DACH-Fachjargon eingeführt („Objekteinrichtung“). |
| Yacht unter „Objekte“ statt „Leistungen“ | Im Card-Sort-Sinn ist eine Yacht „ein Ort außerhalb des Zuhauses, der komplett eingerichtet wird“ – wie Hotel oder Ferienwohnung. Minotti ordnet Yachting genauso ein. Damit steht Yacht nur noch **einmal** im Menü (heute zweimal). Ausgleich für Privat-Eigner: Teaser auf der Startseite und Synonyme „Boot“, „Bootspolster“ in der Suche. |
| „Planen & Erleben“ (Labs) wird aufgelöst | Inhaber-Entscheidung Nr. 9. Jedes Werkzeug zieht dorthin, wo die Aufgabe entsteht: Küchenplaner → Küche, Sofaplaner → Sofas, Ezarri-Konfigurator → Pool, AR → Produktseite, Upload → Service, Portal → Kopfleiste, Concierge → schwebend. Das senkt die Hauptpunkte von 8 auf 7 und beseitigt die Doppelung (B5). |
| „Leistungen“ heißt „Service“ und bekommt Hub `/leistungen` | Küche, Outdoor und Objekte haben ihre Planung jetzt im eigenen Panel. Übrig bleiben die bereichsübergreifenden Leistungen. „Service“ ist kürzer und grenzt sich von „Planen“ in den Raum-Panels ab. Die Hub-Seite `/leistungen` listet trotzdem **alle** Leistungen (Hub darf wiederholen, das Menü nicht). |
| „Mein Platzhirsch“ in die Kopfleiste | Das Portal ist das Wiederkauf-Werkzeug. Bestandskunden erwarten das Konto oben rechts (Konvention, H4). |
| Marken-URL `/marken` | Ort im Menü = Ort in der URL = Brotkrume (H6). Nur mit 301 und Abstimmung mit dem SEO-Team (P2, nicht vor Livegang). |

**Andere Sprachen (EN/FR/IT):** gleicher Baum. Deutsch-only-Seiten werden **nicht** ausgeblendet, sondern mit Zusatz „(Deutsch)“ verlinkt (z. B. „Hotel & Hospitality (German)“). Sprachwechsel auf einer Deutsch-only-Seite führt zur Hub-Seite des Abschnitts statt zur Startseite. So bleibt der Kontext erhalten (B9).

**Mobil:** Menü-Sheet von oben nach unten: Suchfeld (direkt tippbar, nicht erst Lupe) · 7 Abschnitte als Akkordeon (wie heute) · „Termin wählen“ (primär) · Anrufen · Besuch/Anfahrt. Untere Leiste bleibt: Auswahl · Termin · Anrufen.

**Footer-Spalten:** Sortiment · Marken · Objekte (neu) · Service · Das Haus · Regionen · Rechtliches.

### 3.2 Card-Sorting- und Tree-Test-Plan (sofort durchführbar, fast ohne Budget)

Der Baum oben ist eine begründete Hypothese. Vor dem Umbau (oder parallel, Umbau ist reversibel) wird er geprüft.

**Schritt 1 – Offenes Card-Sorting im Café (Woche 1)**
- 15–20 Teilnehmende: Café-Gäste (Privatkunden) gegen einen Kaffee-Gutschein, dazu 5 Profis aus der Leadliste (2 Hoteliers, 2 Architekten, 1 Bauträger). Für Card-Sorting gelten 10–15 Personen als ausreichend, um Gruppen zu erkennen ([Lantz et al. 2019, zitiert in arXiv 2509.03232](https://arxiv.org/html/2509.03232v1)).
- 40 Karten auf Papier: Sofas, Betten, Esstische, Leuchten, Küchenplanung, Küchenplaner online, Steinküchen, Gartenmöbel, Gartenplanung, Pool-Mosaik, Bad-Mosaik, Pool-Konfigurator, Yacht-Interior, Bootspolster, Hotel einrichten, Restaurant einrichten, Musterwohnung für Bauträger, Muster für Architekten, Datenblätter, Interior Design, Beratungstermin, Stil-Test, 3D-Ansicht, Fotos senden, Einkaufen aus der Schweiz, Zoll-Rechner, Gutscheine, Ratgeber, Ausstellungsstücke, Kundenkonto, Projekte/Referenzen, Team, Karriere, Presse, Café, Anfahrt, Öffnungszeiten, Newsletter, Marken A–Z, Veranstaltungen.
- Auswertung: Ähnlichkeitsmatrix in einer Tabelle (Paare, die ≥ 60 % der Personen zusammenlegen, gehören in eine Gruppe). Gruppennamen der Teilnehmenden notieren – sie liefern die Etiketten.

**Schritt 2 – Tree-Test online (Woche 2–3)**
- 30–50 Teilnehmende (Empfehlung für belastbare Erfolgsquoten: [UserTesting](https://help.usertesting.com/hc/en-us/articles/11880307135773)), Rekrutierung über Newsletter und Instagram. Werkzeug: Lyssna oder Optimal Workshop (Testzugang/Monatslizenz – Preis vor Kauf prüfen) oder kostenlos als Google-Formular mit verschachtelten Fragen.
- Zwei Varianten des Etiketts für Punkt 5 testen: **A „Objekte“** · **B „Hotel & Yacht“** · (optional C „Für Profis“).
- 10 Aufgaben, Erfolgsziel je Aufgabe ≥ 80 % direkter Erfolg:

| # | Aufgabe | Richtiges Ziel |
|---|---|---|
| T1 | „Sie führen ein Hotel und wollen die Lobby neu einrichten lassen.“ | Objekte → Hotel & Gastronomie |
| T2 | „Sie suchen Glasmosaik für Ihren neuen Pool.“ | Outdoor & Pool → Pool, Bad & Wellness |
| T3 | „Sie möchten Ihre Küche selbst am Bildschirm vorplanen.“ | Küche → Planen → Küchenplaner online |
| T4 | „Sie wollen neue Polster für Ihr Motorboot.“ | Objekte → Yacht & Bootshaus |
| T5 | „Sie sind Architektin und brauchen ein Muster und ein Datenblatt.“ | Objekte → Für Architekten & Planer |
| T6 | „Sie suchen ein neues Bett.“ | Wohnen → Schlafzimmer → Betten (prüft die Zusammenlegung) |
| T7 | „Sie wohnen in St. Gallen und wollen wissen, was der Kauf in Österreich kostet.“ | Service → Einkaufen aus der Schweiz & FL |
| T8 | „Sie haben schon bestellt und wollen den Liefertermin sehen.“ | Mein Platzhirsch |
| T9 | „Sie wollen einen Beratungstermin vereinbaren.“ | Termin / Service → Beratung & Termin |
| T10 | „Sie planen als Bauträger 12 Wohnungen und suchen Einrichtungspakete.“ | Objekte → Wohnprojekte |

- Entscheidungsregel: Variante mit höherer Erfolgsquote bei T1, T4, T5, T10 gewinnt. Fällt T6 unter 70 %, bleibt „Schlafen“ eigener Hauptpunkt und „Service“ wandert in „Das Haus“.

### 3.3 Spezifikation Suche (für das Code-Team)

| # | Anforderung | Umsetzung |
|---|---|---|
| S1 | **Eigene Ergebnisseite statt Katalog-Fallback** | Neue Route `/suche?q=` (DE; EN `/search`). Enter ohne eindeutigen Top-Treffer → `/suche?q=…`. Zeigt Gruppen: Leistungen & Seiten · Marken · Kategorien · Produkte. `noindex, follow`. Alternativ Minimal-Fix vor Livegang: Katalog liest `q` und filtert Name/Marke/Designer, mit Zeile „12 Ergebnisse für ‚minoti‘ – meinten Sie Minotti?“ |
| S2 | **Inhaltsindex** | Statische Liste `src/lib/search/pages.js` (Titel, URL, Typ, Synonyme, Sprache), beim Build aus `ROUTES`, `LANDING_PAGE_SLUGS`, `EXTRA_PAGES`, Features und Ratgeber erzeugt. Kein externer Dienst nötig. |
| S3 | **Synonyme** (Startliste) | Pool, Schwimmbad, Mosaik, Fliesen, Glasmosaik, Wellness, Bad → Ezarri/Pool · Hotel, Gastro, Restaurant, Contract, FF&E, Objekt → Hotel & Gastronomie · Boot, Yacht, Bootspolster, Bootshaus → Yacht · Architekt, Planer, Datenblatt, Muster, BIM → Architekten & Planer · Bauträger, Musterwohnung, Penthouse → Wohnprojekte · Steinküche, Naturstein → Binni · Küche planen, Küchenplaner → Küchenplaner · Couch → Sofa · Terrasse, Garten → Outdoor · Öffnungszeiten, Anfahrt, Adresse, Parken → Kontakt · Zoll, MwSt, Schweiz, CHF, Liechtenstein → Einkaufen aus der Schweiz · Gutschein, Geschenk → Gutscheine · Termin, Beratung → Beratung · Konto, Bestellung, Lieferung → Mein Platzhirsch. |
| S4 | **Tippfehler** | Für Marken und Inhaltsseiten unscharfer Abgleich (z. B. Bibliothek Fuse.js, ~6 kB gz, oder eigene Damerau-Levenshtein-Distanz: ≤ 1 bei ≤ 5 Zeichen, ≤ 2 darüber). Produkte weiter über Backoffice; bei 0 Treffern zweiter Versuch mit korrigiertem Markennamen. |
| S5 | **Leerzustand (vor dem Tippen)** | „Häufig gesucht“: 6 Leitmarken · Küchenplanung · Pool & Ezarri · Hotel einrichten · Termin vereinbaren · Öffnungszeiten. |
| S6 | **Null-Treffer** | Text (s. 3.5) + drei Auswege: Termin · Concierge fragen · Anrufen, plus „Häufig gesucht“. Null-Treffer-Begriffe anonym zählen (ohne Personenbezug) – das ist die Liste für neue Synonyme und Sortiment. |
| S7 | **Ladezustand** | Statt „…“: „Suche läuft …“ (aria-live polite) und dezente Linie unter dem Feld; erst nach 300 ms zeigen, damit es bei schnellen Antworten nicht flackert. |
| S8 | **Platzhalter** | „Marke, Möbel oder Leistung – z. B. Pool, Küche, Hotel“ (löst das Versprechen ein). |

### 3.4 Spezifikation Ladezustände

| # | Wo | Was |
|---|---|---|
| L1 | `produkte/[category]/loading.js`, `produkte/[category]/[product]/loading.js`, `ueber-uns/marken/[title]/loading.js` | Skelett im Raster der echten Seite (Kopf + 8 Kachelflächen in `bg-surface-raised`), `aria-busy="true"`, Text für Screenreader „Seite wird geladen“. Vorbild: `Labs/Stilfinder/Skeletons.js`. |
| L2 | Globale Navigation | 2 px Fortschrittslinie oben, erscheint nur, wenn ein Seitenwechsel > 300 ms dauert, respektiert `prefers-reduced-motion` (dann ohne Animation, nur statisch). |
| L3 | Planer (Küche, Sofa, Pool) | Beim Laden der 3D-Szene: Fortschritt in Worten („3D-Ansicht wird vorbereitet“), daneben sofort nutzbare 2D-Ansicht. Nie leerer Kasten. |
| L4 | Formulare | Absende-Knopf: Text wechselt auf „Wird gesendet …“, Knopf gesperrt gegen Doppelklick, Dauer > 8 s → Hinweis mit Telefonnummer. |

### 3.5 Fertige Texte (Fehler, Leer- und Ladezustände)

| Ort | Text (DE) |
|---|---|
| Suche, Platzhalter | Marke, Möbel oder Leistung – z. B. Pool, Küche, Hotel |
| Suche, leer, Überschrift | Häufig gesucht |
| Suche, läuft | Suche läuft … |
| Suche, 0 Treffer | Zu „{Begriff}“ haben wir online nichts gefunden. Vieles zeigen wir nur im Showroom. Fragen Sie uns direkt – wir sagen Ihnen, ob wir es für Sie beschaffen können. |
| Suche, 0 Treffer, Knöpfe | Termin vereinbaren · Concierge fragen · Anrufen |
| Suche, Tippfehler | Meinten Sie {Vorschlag}? |
| Suchergebnisseite, Kopf | {n} Ergebnisse für „{Begriff}“ |
| 404, Ergänzung unter dem Text | Suchen Sie etwas Bestimmtes? [Suchfeld] |
| 404, Auswege (neu) | Wohnen · Küche · Outdoor & Pool · Objekte · Termin vereinbaren |
| 404, Seitentitel | Seite nicht gefunden – Platzhirsch Home Living |
| Formular, Netzwerkfehler (ersetzt B14-Texte) | Ihre Nachricht ist nicht bei uns angekommen. Ihre Eingaben bleiben erhalten. Versuchen Sie es bitte noch einmal oder rufen Sie uns an: {Telefon}. |
| Formular, zu lange | Das dauert länger als üblich. Bitte schließen Sie die Seite noch nicht. |
| Ladezustand, Screenreader | Seite wird geladen |
| 3D-Planer, Laden | 3D-Ansicht wird vorbereitet. Sie können in der Draufsicht schon weiterplanen. |
| Deutsch-only-Link in EN | {Seitenname} (in German) |
| Objekte-Panel, Intro | Hotels, Restaurants, Yachten und Wohnprojekte – geplant und eingerichtet aus einer Hand, mit Partnern für Einbau und Montage. |
| Outdoor & Pool, Intro | Möbel, Schatten und Licht für draußen, dazu Glasmosaik von Ezarri für Pool, Bad und Wellness. |
| Service, Intro | Beratung, Interior Design und digitale Wege zu uns – vor oder nach Ihrem Besuch in Lochau. |

### 3.6 URL-Plan für die aufgelösten Labs (Vorschlag, mit Ezarri-/Feinschliff-Team abstimmen)

| Heute | Neu | Menüort |
|---|---|---|
| `/labs/kuechenplaner` | `/kuechenplaner` | Küche → Planen |
| `/labs/sofaplaner` | `/sofaplaner` | Wohnen → Sofas & Sessel |
| `/labs/stilfinder` | `/stilfinder` | Wohnen → Ideen |
| `/labs/dreilaender` | in `/einkaufen-aus-der-schweiz` integrieren (ein Rechner) | Service |
| `/labs/ar-viewer` | `/3d-ansicht` (Hub) + Knopf am Produkt | Service → Digital vorbereiten |
| `/labs/concierge` | schwebender Knopf; Seite `/concierge` als Fallback | – |
| `/labs/upload-demo` | `/fotos-senden` | Service + Küche → Planen |
| `/labs` | 301 → `/leistungen` | – |
| – | `/objekte`, `/hotel-contract` (wie `hotel-contract.md`), `/architekten-planer`, `/wohnprojekte`, `/leistungen` | Objekte / Service |

Alle alten `/labs/*`-URLs per 301 in `next.config.js` `redirects()`.

---

## 4. Maßnahmen

| Prio | Maßnahme | Aufwand | Kosten grob | Erwarteter Umsatzeffekt (Begründung) | Wer |
|---|---|---|---|---|---|
| **P0** | B4: Entwicklertexte und „Prototyp“-Plaketten aus allen öffentlichen Seiten entfernen (Schalternamen, „Senden erst nach Freigabe“, „entsteht gerade“) | S | intern | Mittel, indirekt: schützt Vertrauen beim Erstbesuch. Ohne Fix wirkt jeder Planer unfertig [Schätzung]. | Code-Team |
| **P0** | B1: Suche-Fallback reparieren (Minimal: Katalog filtert `q`; Ziel: `/suche`, S1) | S–M | intern | Mittel: jede gescheiterte Suche ist ein verlorener Interessent. Suchende kaufen nach Branchenerfahrung überdurchschnittlich oft [Schätzung, mit Analytics messen]. | Code-Team |
| **P1** | Neuer Menübaum 3.1 (7 Punkte, „Objekte“, „Outdoor & Pool“, Labs aufgelöst, Portal in Kopfleiste) | M | intern | Hoch: macht Hotel, Pool/Ezarri, Yacht und Bauträger sichtbar. Ein Hotelauftrag liegt laut Masterkonzept bei 100–200 T€ (23, G6) – eine einzige zusätzliche Anfrage bezahlt den Umbau. | Code-Team |
| **P1** | Hub-Seiten `/objekte` und `/leistungen` | M | intern | Hoch für B2B, Hubs bündeln interne Links (SEO) und geben Profis einen Einstieg. | Code-Team |
| **P1** | Inhaltsindex + Synonyme + Tippfehler (S2–S4, S8) | M | intern (Fuse.js frei) | Mittel–hoch: Leistungen (Küche, Interior, Pool, Hotel) mit hoher Marge werden über die Suche auffindbar. | Code-Team |
| **P1** | 301 `/labs/*` → neue URLs (3.6) | S | intern | Gering direkt, verhindert tote Links aus Newsletter/Social. | Code-Team |
| **P1** | Card-Sorting im Café + Tree-Test (3.2) | S | ~20 Kaffee-Gutscheine; Tool-Lizenz optional | Indirekt hoch: sichert, dass der neue Baum funktioniert, bevor Werbebudget auf Hotel/Pool fließt. | Inhaber + Code-Team (Auswertung) |
| **P2** | Ladezustände L1–L4 | S–M | intern | Gering–mittel: weniger Abbrüche auf Mobilfunk bei Kategorie/Produkt. | Code-Team |
| **P2** | Null-Treffer- und Leerzustand der Suche (S5–S7) + anonyme Null-Treffer-Zählung | S | intern | Mittel: Null-Treffer-Liste zeigt echte Nachfrage (Sortiment, Synonyme). | Code-Team |
| **P2** | 404 mit Suchfeld, neuen Auswegen und Titel (3.5) | S | intern | Gering–mittel: fängt alte WordPress-Links auf. | Code-Team |
| **P2** | Sprachversionen: Deutsch-only-Seiten verlinken statt ausblenden, Sprachwechsel auf Abschnitts-Hub (B9) | S | intern | Mittel für CH-Romandie/Tessin und Arlberg-Investoren. | Code-Team |
| **P2** | Doppelte Etiketten in Panels entfernen (B8), Brotkrumen ergänzen (B12) | S | intern | Gering, Qualitätseindruck. | Code-Team |
| **P2** | Marken-URL `/marken` mit 301 (nach Livegang, mit SEO-Team) | S | intern | Gering; Konsistenz Menü/URL/Brotkrume. | Code-Team + SEO |
| **P3** | Verwaiste Fehlertexte löschen, Formularfehler-Text aus 3.5 als Standard (B14) | S | intern | Gering. | Code-Team |
| **P3** | „Referenzen“ in „Objekte“ und „Das Haus“ einblenden, sobald ≥ 6 Projekte freigegeben | S | intern | Mittel ab Verfügbarkeit: Beweis vor Behauptung für Hoteliers. | Inhaber (Freigaben) + Code-Team |

---

## 5. Quellen

- Baymard Institute, „Support Non-Product Search“ – https://baymard.com/research-articles/support-non-product-search · Leitlinie 342 – https://baymard.com/guidelines/342-non-product-search
- Baymard, E-Commerce Search Benchmark – https://baymard.com/research-articles/ecommerce-search-report-and-benchmark
- NN/g, „Mega Menus Work Well for Site Navigation“ – https://www.nngroup.com/articles/mega-menus-work-well/
- NN/g, „Audience-Based Website Navigation“ – https://www.nngroup.com/videos/audience-based-website-navigation/
- GOV.UK, „Hey, you there: the trouble with audience-based navigation“ – https://insidegovuk.blog.gov.uk/2014/07/18/hey-you-there-the-trouble-with-audience-based-navigation/
- NN/g, „Card Sorting vs. Tree Testing“ – https://nngroup.com/articles/card-sorting-tree-testing-differences
- arXiv 2509.03232 (Stichprobengröße Card-Sorting, zitiert Lantz et al. 2019) – https://arxiv.org/html/2509.03232v1
- UserTesting, Best Practices Card Sorting/Tree Testing – https://help.usertesting.com/hc/en-us/articles/11880307135773
- B&B Italia Navigation (Contract, A&D Area) – https://www.bebitalia.com/en-it
- Minotti Navigation (Projects mit Filter Hotel & Resort, Yachting) – https://www.minotti.com/en
