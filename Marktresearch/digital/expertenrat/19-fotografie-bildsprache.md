# Expertenrat 19: Fotografie, Bildredaktion und Bildsprache

**Rolle:** Interior-Fotograf und Bildredakteur · **Stand:** 26.10.2026 · **Grundlage:** `digital/01` (Z. 6, 107–111, 299), `digital/02` (F5 Video-Hero), `digital/12` (C5, C6 „Seelicht“), `digital/13` (Bild-Budgets), `digital/14` (F3 Bildrechte, F14 AI Act), `expertenrat/05-farbexperte.md` (Farbtreue-Pipeline), `23-masterkonzept.md` Abschnitt 4, Prototypen-Code unter `src/app/[locale]/preview/` und `src/components/Preview/`.

> **Abgrenzung:** Die Farbtreue-Pipeline (ColorChecker, ΔE2000 ≤ 3, D65-Monitor, P3-Master) steht schon in `expertenrat/05`, Abschnitt 2. Hier wird sie nur referenziert. Neu sind hier Bildkonzept, Shotliste, Licht und Uhrzeiten am Standort, Formate mit Sicherheitszonen, Bildredaktion, Video-Loops, die Mischung aus eigenen und Herstellerbildern sowie Regeln für KI.
>
> Kennzeichnung: **[belegt]** = Quelle oder Code geprüft · **[Schätzung]** = eigene Herleitung · **[prüfen]** = vor Ort oder mit Anwalt klären.

---

## 0. Befund: Welche Bilder die Prototypen heute zeigen [belegt, Code am 26.10.2026]

| Prototyp | Bilder im Code | Problem aus Sicht der Bildredaktion |
|---|---|---|
| **galerie** (`src/components/Preview/galerie/content.js`) | `aboutHome.jpg`, `Wohnen/bannerImage*.jpg`, `Kuche/bannerImageKuche1.jpg`, `Outdoor/bannerImage3/4.jpg`, `Vernissage/minotti-wohnwelt.jpg`; Markenseite: `/cmx/files/minotti-connery-01.webp`, `minotti-lawrence-03/04.webp` | Die Alt-Texte selbst verraten, dass es sich um fremde Orte handelt: „im Hintergrund **Zypressen**“, „unter **Pinien**, dahinter **das Meer**“. Das ist kein Bodensee, also wahrscheinlich Hersteller- oder Stockmaterial. Auf der Startseite eines Hauses, dessen erste Alleinstellung der **Ort** ist (Masterkonzept 4.2, Nr. 1), wirkt das wie Fremdmaterial, und es kann nach UWG irreführen, wenn es wie ein eigenes Projekt aussieht. Die Minotti-Bilder auf der Markenseite brauchen eine Freigabe, und die Bedingungen verbieten Veränderungen (`digital/01`, Z. 208) |
| **buehne** (`preview/buehne/page.js`) | Hero `Home/grey-and-brown-combo-style-room-1.jpg` mit Ken-Burns, `<video>` vorbereitet, Showroom-Bilder 4:3 | Die Herkunft des Hero-Bildes ist unklar (der Dateiname klingt nach Stock, Alt-Text „zum **Garten**“). Ken-Burns auf einem fremden Bild ist eine **Bearbeitung** (Zuschnitt und Bewegung). Die Video-Ebene ist richtig gebaut, es fehlt aber das Material |
| **dreilaendereck** | nur `layout.js`, noch keine Seite | – |

**Folgerung:** Alle drei Prototypen sind gestalterisch auf echte, eigene Bilder angewiesen und zeigen bis jetzt Platzhalter. Ohne eigenes Shooting lässt sich keiner fair bewerten. Deshalb ist das **Shooting die kritische Abhängigkeit des Neuauftritts**, nicht der Code.

---

## 1. Die 9 wichtigsten Erkenntnisse

1. **Nutzer ignorieren dekorative Stockbilder und schauen echte Menschen und echte Produkte lange an.** In den Eyetracking-Studien der Nielsen Norman Group werden „Feel-good“-Bilder und generische Stock-Personen übersprungen. Produktfotos und Fotos echter Mitarbeiter werden dagegen genau angesehen. Bei FreshBooks verbrachten Nutzer **10 % mehr Zeit auf den Porträts als auf den Bio-Texten**, obwohl die Texte **316 % mehr Fläche** hatten. Für Platzhirsch heißt das: Fotos der Gastgeberin, des Teams und des Cafés sind Inhalt, keine Dekoration. *Quelle: NN/g, „Photos as Web Content“, https://www.nngroup.com/articles/photos-as-web-content/*

2. **Die Größe ist online die größte Unsicherheit beim Möbelkauf.** In der Produktseiten-Studie von Baymard versuchten **42 %** der Nutzer, die Größe des Produkts aus den Bildern abzuleiten, und **56 %** begannen auf einer Produktseite zuerst mit den Bildern. „In-Scale“-Bilder (Produkt mit Mensch oder bekanntem Gegenstand) können zugleich als Lifestyle-Bild dienen. Bei einem Sofa für 12.000 € bis 40.000 € ist das Maßstab-Bild die wichtigste Aufnahme überhaupt. *Quelle: Baymard Institute, https://baymard.com/blog/in-scale-product-images*

3. **Haptische Bildsprache ersetzt teilweise das Anfassen.** Die Forschung zum Bedürfnis nach Berührung („Need for Touch“, Peck & Childers 2003, *Journal of Consumer Research*) unterscheidet instrumentelles Berühren (Textur, Härte, Temperatur, Gewicht prüfen) von lustvollem Berühren. Studien zu haptischer Bildsprache im Online-Handel zeigen positive Effekte auf die wahrgenommene Qualität und die Kaufabsicht, die bei Menschen mit hohem Berührungsbedürfnis stärker sind (Silva et al. 2021, *Journal of Retailing and Consumer Services*; Peck, Barger & Webb 2013, *Journal of Consumer Psychology*: Berührungs-Vorstellung steigert das Gefühl, etwas zu besitzen). Deshalb braucht es Hand-Material-Bilder: eine Hand auf Bouclé, ein Daumen auf einer Ledernaht, Finger an einer Rimadesio-Glaskante. *Quellen: Peck & Childers 2003, JCR 30(3); Peck/Barger/Webb 2013, JCP 23(2); Silva et al. 2021, JRCS*

4. **Originalität ist auch ein SEO-Faktor.** Google empfiehlt in den Image-SEO-Leitlinien scharfe, hochwertige Bilder nahe am relevanten Text, beschreibende Dateinamen und Alt-Texte sowie responsive Auslieferung. Lizenz-Metadaten (IPTC/Schema `license`, `creator`, `creditText`, `copyrightNotice`) werden in Google Bilder angezeigt. Eigene Fotos von Showroom, Café und Seeblick gibt es sonst nirgends. Sie konkurrieren nicht mit 200 Händlern, die dasselbe Minotti-Pressebild nutzen. *Quellen: https://developers.google.com/search/docs/appearance/google-images · https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata*

5. **Herstellerbilder sind geschützt, und jede Bearbeitung braucht ein eigenes Recht.** Herstellerbilder sind mindestens Lichtbilder (AT § 74 UrhG, DE § 72 UrhG). Erneutes Hochladen braucht eine Erlaubnis (EuGH C-161/17 *Renckhoff*). Zuschnitt, Freistellen, Regrading und KI-Hintergründe sind Bearbeitungen. Die Minotti-Bedingungen verbieten Veränderungen (`digital/14` F3, `digital/01` Z. 208). Ein 21:9-Zuschnitt eines Minotti-Hochformats ist also schon ein Problem. *Quelle: `digital/14`, F3 [belegt im Repo]*

6. **Seit 02.08.2026 gilt Art. 50 AI Act, für Bilder mit doppelter Kennzeichnung.** Anbieter generativer Systeme müssen Ausgaben maschinenlesbar markieren (Abs. 2). Betreiber müssen realistische Darstellungen echter Orte und Gegenstände, die fälschlich echt wirken („Deepfake“), sichtbar kennzeichnen (Abs. 4). Der finale Verhaltenskodex der Kommission zur Kennzeichnung (Juni 2026) setzt auf **mindestens zwei Ebenen** (z. B. Metadaten und Wasserzeichen) und ein einheitliches Symbol. Ein per KI eingesetzter Bodensee-Blick vor einem Fenster ist genau so ein Fall. Ausgenommen sind nur unterstützende Standardbearbeitungen, die den Inhalt nicht wesentlich verändern. *Quellen: Jones Day, 06/2026, https://www.jonesday.com/en/insights/2026/06/european-commission-publishes-final-code-of-practice-on-marking-and-labelling-aigenerated-content · `digital/14` F14*

7. **Google Merchant Center verlangt IPTC-Kennzeichnung für KI-Bilder.** Bilder, die mit generativer KI erstellt wurden, müssen den IPTC-Wert `trainedAlgorithmicMedia` tragen (Composites `compositeSynthetic`), und die Metadaten dürfen nicht entfernt werden. Das gilt für `image_link`, `additional_image_link` und `lifestyle_image_link`. Wichtig für die Pipeline: Next.js entfernt beim Optimieren die Metadaten (`expertenrat/05`, Erkenntnis 7). Die Kennzeichnung muss deshalb zusätzlich **sichtbar** sein und im Feed über die Originaldatei laufen. *Quellen: https://support.google.com/merchants/answer/14743464 · https://iptc.org/news/google-reminds-publishers-and-merchants-not-to-strip-metadata-from-images/*

8. **Das Hero-Bild ist das LCP-Element, und die Bildqualität kostet sonst Ladezeit.** Budget aus `digital/13`: LCP-Bild ≤ 120 KB mobil (AVIF), LCP ≤ 2,0 s; Hero-Video ≤ 2,5 MB Desktop / ≤ 1,2 MB Handy, 8–12 s Loop, erst nach `load` (`digital/02` F5). Fretz zeigt das Gegenbeispiel: 44 MB Seitengewicht und LCP 19,8 s (`digital/13`, Z. 75). Bildredaktion heißt deshalb auch, Motive zu wählen, die gut komprimieren: ruhige Flächen, wenig hochfrequentes Rauschen, kein Gegenlicht-Gewimmel.

9. **Der Standort hat ein seltenes Licht, das niemand sonst fotografieren kann.** Lochau liegt am Ostufer, der Pfänder im Rücken (Osten), der See im Westen. Abends geht die Sonne **über dem See** unter, morgens verschattet der Pfänder den Ort länger [Schätzung, Sonnenstand vor Ort mit PhotoPills prüfen]. An Föhntagen reicht die Fernsicht bis zum Säntis. Für ein Haus, dessen Positionierung „am Bodensee“ lautet, ist das Abendlicht die visuelle Signatur. Höttges (Dornbirn), Fretz und Gamma haben keinen Seeblick.

---

## 2. Konkrete Vorgaben für den Neuauftritt

### 2.1 Bildherkunft: Wo welche Bilder stehen dürfen

| Seitentyp | Eigene Bilder | Herstellerbilder | Stock | KI-bearbeitet |
|---|---|---|---|---|
| Startseite, Hero, „Das Haus“, Café, Team, Events | **100 %** | 0 | 0 | 0 (nur Retusche, siehe 2.8) |
| Projekte/Referenzen | **100 %** (mit Kundeneinwilligung) | 0 | 0 | 0 |
| Regionsseiten (`designermoebel-*`) | ≥ 80 %, Ortsbild nur echt (Lindau, Arlberg …), eigenes Foto oder lizenziert mit Quellenangabe | ≤ 20 %, mit Freigabe | nur Ortsansicht, als solche erkennbar | 0 |
| Markenseiten | ≥ 1 Modul „Im Showroom Lochau“ mit 3–6 eigenen Fotos | ja, **nur mit schriftlicher Freigabe**, unverändert, mit Credit | 0 | 0 |
| Produktseiten | Ausstellungsstück: ≥ 2 eigene Bilder (Totale 4:5 + Detail) | ja, mit Freigabe (Feed-Recht separat!) | 0 | 0 |
| Ratgeber/Journal | ≥ 60 % | mit Freigabe | nur Symbolbild, nie als „unser Projekt“ | nur mit Etikett |
| Ads, Merchant Center, Pinterest/Meta-Katalog | bevorzugt | **nur** wenn die Freigabe Werbung und Feeds ausdrücklich nennt | nein | nur mit IPTC und Etikett |

**Messbar:** Auf der Startseite stammt 0 Bild aus einer fremden Quelle. Ab Launch steht jedes Bild im Bildregister, ohne Eintrag gibt es keinen Einsatz (Build-Gate, siehe 2.9).

### 2.2 Formate mit Sicherheitszonen

Damit ein Motiv in allen Zuschnitten funktioniert, wird **in 3:2 mit Reserve fotografiert** (45–61 MP Vollformat). Die Zuschnitte entstehen erst in der Bildredaktion.

| Rolle | Seitenverhältnis | Master (px) | Ausgeliefert (Breiten) | Budget | Komposition |
|---|---|---|---|---|---|
| Hero Desktop | **21:9** (2,33:1) | 6000 × 2571 | 1280 / 1920 / 2560 / 3840 | ≤ 180 KB AVIF bei 1920 | Hauptmotiv im mittleren Drittel horizontal, **vertikal zwischen 35 % und 70 %**; obere 30 % ruhig (Decke, Himmel, See) für die Headline; Möbel nicht angeschnitten |
| Hero Laptop (100svh, ~16:10) | wird aus demselben Master geschnitten | – | – | – | Deshalb: Motiv muss in 16:10 **und** 21:9 funktionieren → Sicherheitszone = Schnittmenge, etwa 70 % der Masterbreite × 43 % der Höhe, zentriert [Schätzung] |
| Hero mobil | **4:5** (Art Direction per `<picture>` + `getImageProps()`, `digital/13`) | 3200 × 4000 | 640 / 828 / 1080 | ≤ 120 KB AVIF bei 828 | **Eigenes** Hochformat-Foto, kein Ausschnitt aus 21:9. Motiv im unteren Drittel, oben Luft für H1 |
| Raum/Projekt | **3:2** | 6000 × 4000 | 640 / 1080 / 1600 / 2400 | ≤ 150 KB bei 1600 | Kamerahöhe 1,0–1,2 m (Sitzaugenhöhe), Senkrechte gerade |
| Produkt/Vignette | **4:5** | 3200 × 4000 | 384 / 640 / 828 / 1200 | ≤ 90 KB bei 828 | Produkt füllt 60–75 % der Bildhöhe, 8 % Rand oben, Boden sichtbar (zeigt Füße/Sockel) |
| Detail/Material | **1:1** oder 4:5 | 4000 × 4000 | 384 / 640 / 1080 | ≤ 70 KB | Seitenlicht 30–60° flach zur Oberfläche, damit die Textur plastisch wird; Hand im Bild bei ≥ 50 % der Details |
| Social Reel/Story | **9:16** | 2160 × 3840 (Video 1080 × 1920) | – | – | Obere ~14 % und untere ~20 % frei von Schrift und Gesicht (Plattform-Bedienelemente) [Schätzung, je Plattform prüfen] |
| Pinterest | **2:3** | 2000 × 3000 | – | – | Text nur als Overlay im Asset, nie im Master |
| OG/Share | **1,91:1** | 2400 × 1256 | 1200 × 630 | ≤ 200 KB JPEG | Logo nicht nötig, eigenes Motiv |

**Pflicht pro Bild im Register:** Fokuspunkt als `object-position` (z. B. `62% 55%`), damit der Zuschnitt bei `fill` + `object-cover` nicht den Sessel abschneidet. Kein Bild ohne festes `aspect-ratio` (CLS ≤ 0,05, `digital/02`).

### 2.3 Kamera und Optik

- **Architektur/Raum:** Tilt-Shift 24 mm oder 17 mm (Canon TS-E, Nikon PC-E o. Ä.), Stativ, Senkrechte ±0,5° gerade. **Nicht weitwinkliger als 24 mm KB-äquivalent bei Möbeln im Vordergrund.** Ultraweitwinkel lässt Sofas größer wirken als sie sind, und bei einem Maßstab-Bild ist das eine Irreführung über die Produkteigenschaft.
- **Vignetten/Produkt:** 45–70 mm, Kamerahöhe 0,9–1,1 m, Blende f/8–f/11 für Schärfe über das ganze Möbel.
- **Material/Hände:** 90–100 mm Makro, f/5,6–f/8, Fokus-Stacking bei Nähten.
- **Menschen/Café:** 35/50 mm, f/2–f/2,8, Verschlusszeit ≥ 1/250 s bei Bewegung.
- **Belichtung:** RAW, Belichtungsreihe ±2 EV bei Fensterlicht, **manuelles Blending (Ebenen und Masken), kein HDR-Tonemapping**. Der See vor dem Fenster muss Zeichnung haben, er ist das Motiv.
- **Farbe:** ColorChecker im ersten Bild jeder Lichtsituation, Graukarte, ΔE-Vorgaben nach `expertenrat/05` Z. 120–126.

### 2.4 Licht und Tageszeiten in Lochau (Richtwerte) [Schätzung, vor dem Shooting mit Sonnenstand-App und Ausrichtung des Showrooms prüfen]

| Datum | Sonnenaufgang | Sonnenuntergang | Blaue Stunde | Bestes Fenster für Interior |
|---|---|---|---|---|
| 21.12. | ~08:05 MEZ (am Ort durch den Pfänder später) | ~16:35 | ~16:50–17:15 | 10:30–14:00 weiches Winterlicht; ab 16:40 Abendaufnahme mit Leuchten |
| 20.03. | ~06:25 MEZ | ~18:35 | ~18:50–19:15 | 9:30–11:30 und 16:30–18:30 |
| 21.06. | ~05:25 MESZ | ~21:20 | ~21:35–22:00 | 7:30–10:00 (Seeseite indirekt), 19:30–21:15 Gegenlicht über dem See |
| 22.09. | ~07:10 MESZ | ~19:20 | ~19:35–20:00 | 10:00–12:00 und 17:30–19:15 |

**Regeln für das Licht:**
- **Abendaufnahme („Dämmerungsbild“)**: 15–35 min nach Sonnenuntergang, wenn das Innenlicht (Flos-Leuchten auf 2.700 K) und der Himmel über dem See gleich hell sind. Das ist der Hero-Kandidat Nr. 1. Stativposition auf dem Boden markieren (Klebepunkt), damit dasselbe Motiv in allen Jahreszeiten wiederholt werden kann.
- **Kein Blitzlook:** nur indirekt gegen Decke/Reflektor; Fill höchstens −1,5 EV unter dem Fensterlicht.
- **Mischlicht** (Halogen 2.800 K + Tageslicht 5.600 K): entweder Leuchten auf Tageslicht angleichen oder zwei Aufnahmen mit unterschiedlichem Weißabgleich blenden. Kein grüner Stich von LED-Spots (CRI ≥ 95 für Ausstellungs-Licht anfragen [prüfen]).
- **Föhnlage** (Fernsicht bis Säntis) für Außen- und Seeaufnahmen: Wetterbericht Föhn-Diagramm beobachten, Shooting kurzfristig ansetzen (Bereitschaft 48 h).
- **Kein Mittag mit direkter Sonne auf Stoffen:** harte Schatten, Farbverfälschung, Hotspots auf Leder.

### 2.5 Shotliste (erstes Produktionspaket, 5 Shootingtage) [Schätzung Umfang]

**Tag 1 – Showroom (Haus) · 10:00–17:30 + Dämmerung**

| Nr. | Motiv | Format | Verwendung |
|---|---|---|---|
| S01 | Totale Showroom, Dämmerung, Leuchten an, See im Fenster | 21:9 aus 3:2 + eigenes 4:5 | Hero Startseite |
| S02 | Dasselbe Motiv bei Tageslicht 10:30 | 21:9 + 4:5 | Hero-Variante (Seelicht-Idee, 3.1) |
| S03–S08 | 6 Vignetten (Minotti-Wohnen, Poliform-Essen, Rimadesio-Schrank, Flos-Licht, ClassiCon-Klassiker, Küche) | 3:2 + 4:5 | Marken-Module „Im Showroom“, Kategorie-Köpfe |
| S09 | Eingang/Fassade mit Messingschild, Spätnachmittag | 3:2 + 9:16 | Kontakt, Google-Profil |
| S10 | Wegbeziehung Café → Showroom (Durchblick) | 3:2 | „Das Haus“ |
| S11–S14 | 4 Maßstab-Bilder: Person sitzt (Sofa), steht neben Schrank, öffnet Tür, sitzt am Tisch | 4:5 | Produktseiten (Erkenntnis 2) |

**Tag 2 – Café und Menschen · 08:00–14:00**

| Nr. | Motiv | Format | Verwendung |
|---|---|---|---|
| C01 | Gastgeberin (Susanne Messmer) am Café-Tresen, Blick in die Kamera | 4:5 | Startseite „Ihre Gastgeberin“, Newsletter |
| C02–C05 | Team bei der Arbeit: Planung am Tisch mit Mustern, Stoffbuch, Laptop mit Grundriss, Telefon | 3:2 | Beratung, Termin |
| C06 | Hände: Tasse auf Steinplatte (Binni-Küche), Kaffee wird serviert | 1:1 | Café, Küche |
| C07 | Gäste von hinten/unscharf im Café, Showroom im Hintergrund | 3:2 + 9:16 | „Gastgeberort“, Social |
| C08 | Team-Einzelporträts, gleicher Hintergrund (Stone `#ece8e1`), gleiches Licht | 4:5 | Team-Seite, Ansprechpartner auf Markenseiten |

**Tag 3 – Material und Hände (Studio im Showroom) · ganztags**

| Nr. | Motiv | Format |
|---|---|---|
| M01–M12 | 12 Materialien mit Hand: Bouclé, Leder (Naht), Samt, Leinen, Nussbaum, Eiche geräuchert, Marmor (Binni-Platte), Keramikplatte, Messing, Rimadesio-Glas, Aluminiumprofil, Outdoor-Gewebe | 1:1 + 4:5 |
| M13–M18 | Mechanik in Bewegung (auch als 6-s-Video): Schublade schließt leise, Schiebetür gleitet, Rückenlehne klappt, Leuchte dimmt, Schirm öffnet (Tuuci/Umbrosa), Auszugstisch | 9:16 Video + 1:1 Still |
| M19 | Musterkoffer/Stoffbücher auf Tisch, von oben | 4:5 |

**Tag 4 – Lieferung und Montage (echter Auftrag, Einwilligung!)**

| Nr. | Motiv | Format |
|---|---|---|
| L01 | Lkw/Transporter am Haus, Kennzeichen unscharf, keine Hausnummer | 3:2 |
| L02 | Schutzdecke, Handschuhe, Tragen durch Eingangstür | 3:2 + 9:16 |
| L03 | Montage Küche: Steinplatte wird eingesetzt, Wasserwaage | 3:2 |
| L04 | Letzter Handgriff: Kissen richten, Folie ab | 4:5 |
| L05 | Fertiger Raum (Vorher/Nachher aus derselben Stativposition) | 3:2 |

**Tag 5 – Bodensee und Region (Föhn- oder Abendtermin)**

| Nr. | Motiv | Format |
|---|---|---|
| B01 | Outdoor-Möbel auf Terrasse mit See (eigene oder Kundenterrasse), Abendlicht | 21:9 + 4:5 |
| B02 | Lochau Hafen/Ufer, Pfänder, Lindau im Gegenlicht | 21:9 + 9:16 |
| B03 | Arlberg-Chalet (Winter, Referenzprojekt) | 3:2 + 4:5 |
| B04 | Der Weg nach Lochau: Ortsschild, Pfänderstraße, 5 min von Lindau (für Regionsseiten) | 3:2 |

**Saisonal wiederholen:** S01 und B01 je Quartal aus derselben Stativposition (Idee 3.2). Pro Referenzprojekt ein eigener Shootingtag (`digital/12` C3).

**Pflichtausbeute je Shooting** (ergänzt `digital/12` C6): 1 Totale, 3 Details, 1 Mensch im Raum, 1 Maßstab-Bild, 1 × 9:16, 1 × 21:9-tauglich, 1 × 4:5, 1 Video-Loop 8–12 s.

### 2.6 Bildbearbeitung (Look „Seelicht“)

- Ein gemeinsames Preset/LUT für alle Fotografen. Weißabgleich zuerst neutral, dann Raumstimmung höchstens +300 K wärmer (`expertenrat/05`). **Material- und Detailbilder ohne Look**, farbneutral.
- Tonwert: Schwarzpunkt weich angehoben (L\* ~8–10 statt 0), Lichter nie ausgefressen (L\* ≤ 97 außer Fensterflächen), Sättigung global −5 bis −10, **Bezugsstoffe nie gesondert entsättigen** (Farbtreue).
- Erlaubte Retusche: Staub, Kabel, Steckdosen, Kratzer an Wand und Boden, Falten in Kissen, Spiegelungen des Fotografen. **Nicht erlaubt:** Möbel hinzufügen oder entfernen, wenn das Bild als echter Raum gezeigt wird; Proportionen ändern; Fensterblick tauschen; Stofffarbe ändern; Ausstellungsstück-Mängel wegretuschieren (Gewährleistung, `digital/14` Z. 159: Mängel müssen vor Vertragsschluss erkennbar sein).
- Export: Master 16 bit TIFF archivieren. Webquelle sRGB-JPEG q 92 oder AVIF, 3840 px lange Seite; Next.js erzeugt die Derivate (`quality={75}` reicht laut Prototypen). EXIF/GPS bei Kundenwohnungen entfernen, IPTC `Creator`, `Copyright Notice`, `Credit Line`, `Web Statement of Rights` und bei KI `Digital Source Type` setzen.
- Dateiname: `ort-raum-marke-modell-nr.jpg`, z. B. `lochau-showroom-minotti-connery-01.jpg` (`digital/12` C6).

### 2.7 Video-Loops für den Hero

- **Länge 8–12 s**, nahtlos (letztes Bild = erstes Bild oder Überblendung 500 ms im Schnitt), **25 fps**, 10-bit Log aufnehmen, in Rec.709/sRGB gradieren, gleiches Grading wie Poster-Foto.
- **Kamera fest** (Stativ) oder Slider mit ≤ 2 cm/s; kein Gimbal-Schwenk, kein Drohnen-Flug über den Raum (unruhig, schwer zu komprimieren, wirkt nach Immobilienmakler).
- Motive in einer Einstellung mit **einer** Bewegung: Vorhang im Wind am offenen Fenster, Licht wandert über den Sofabezug, Kaffeedampf im Gegenlicht, Rimadesio-Tür gleitet, Schirm öffnet sich vor dem See, Lichtwechsel Dämmerung als Zeitraffer (90 min → 10 s).
- **Poster = erstes Frame = LCP-Bild**, pixelgleich, damit beim Start kein Sprung entsteht. Technik und Budget: `digital/02` F5 (≤ 2,5 MB / ≤ 1,2 MB, AV1 + H.264, `preload="none"`, Pause-Knopf, nicht bei `prefers-reduced-motion` oder `saveData`). Für das Budget: wenig Bildrauschen (ISO ≤ 800), keine feinen Muster in Bewegung.
- Ohne Ton, keine Aussage, die nur im Video steht.

### 2.8 KI-Bearbeitung: nur mit Etikett

| Stufe | Beispiel | Erlaubt? | Kennzeichnung |
|---|---|---|---|
| 0 Standardbearbeitung | Rauschminderung, Objektivkorrektur, Hochskalierung eigener Bilder (Real-ESRGAN), Freistellen eigener Bilder (`rembg`), Staub/Kabel-Retusche, auch wenn ein KI-Werkzeug sie macht | Ja | Keine Pflicht (Ausnahme „unterstützende Standardbearbeitung“, Art. 50 Abs. 2). Im Register vermerken |
| 1 Generative Ergänzung ohne Aussage | Wand verlängert, damit 21:9 entsteht (Outpainting), Boden ergänzt | Nur bei eigenen Bildern, nicht im Hero, **nie** bei Herstellerbildern | IPTC `compositeWithTrainedAlgorithmicMedia` (Google: `compositeSynthetic`), Register; sichtbarer Vermerk in der Bildunterschrift „Bild mit KI erweitert“ |
| 2 Inhaltlich verändernd | Möbel hinzugefügt, Raum umgestaltet, Blick getauscht, Visualisierung „So könnte Ihr Raum aussehen“ | Nur als **Visualisierung**, nie als Referenz oder Ausstellungsstück | **Sichtbares Etikett im Bild** („KI-Visualisierung“, unten links, ≥ 12 px auf 375 px Breite, Kontrast ≥ 4,5:1) **und** IPTC `trainedAlgorithmicMedia` + C2PA, wo das Werkzeug es kann (Art. 50 Abs. 4, Kodex: zwei Ebenen) |
| 3 Vollständig generiert | Raum, Mensch, Ort | **Nicht** auf der Website, in Ads oder auf Social | – |

Weil Next.js Metadaten entfernt, muss die Kennzeichnung bei Stufe 1 und 2 **im HTML** stehen (`<figcaption>`, Etikett-Komponente), nicht nur in der Datei.

### 2.9 Bildregister (Pflichtfelder)

`docs/content/bildrechte.csv` (`digital/12`) bzw. später Backoffice-Feld `image_license` (`digital/14`):

`datei · motiv · quelle (eigen/hersteller/stock/kunde) · urheber · rechteinhaber · lizenz-umfang (web/social/print/ads/feed/presse) · bearbeitung erlaubt (j/n) · ki-input erlaubt (j/n) · ki-stufe (0–3) · personen (einwilligung-id) · ort anonymisiert (j/n) · freigabe-datum · ablauf · credit-text · fokuspunkt · alt-text DE/EN/FR/IT`

Fotografenvertrag: unbefristet, alle Medien, räumlich unbeschränkt, inkl. Bearbeitung und KI-Nutzung, Recht zur Unterlizenz an Hersteller und Presse (für Gegengeschäfte, Idee 3.6), Namensnennung als Credit `Foto: Name / Platzhirsch` (`digital/14` F3). Kosten Interior-Fotograf in AT/CH: grob 1.500–3.000 € pro Tag inkl. Postproduktion [Schätzung, Angebote einholen].

### 2.10 Bildredaktion auf der Seite

- **Jedes Bild hat eine Aufgabe**: Produkt zeigen, Maßstab zeigen, Material zeigen, Menschen zeigen oder Ort zeigen. Ein Bild ohne Aufgabe fliegt raus (Erkenntnis 1).
- **Bildpaare**: Totale + Detail nebeneinander (Hand auf demselben Stoff), gleiche Lichtrichtung.
- **Rhythmus**: Auf der Startseite höchstens ein Vollbild (Hero) und ein weiteres randabfallendes Bild; dazwischen Raster. Höchstens zwei Seitenverhältnisse pro Modul.
- **Konsistenz in Rastern**: Eigene und Herstellerbilder nicht im selben Raster mischen, weil Herstellerbilder nicht nachgegradet werden dürfen und dann der Look bricht. Herstellerbilder bekommen eigene Module (z. B. „Aus der Kollektion“) mit Credit.
- **Bildunterschrift** für eigene Bilder: Ort + Stück, z. B. „Im Showroom Lochau: Minotti Connery, Bezug Bouclé Écru, 17.10.2026“. Für Herstellerbilder: „Foto: Minotti“. Das Datum belegt die Echtheit.
- **Alt-Text** beschreibt, was zu sehen ist, ohne Keyword-Stapel, max. ~125 Zeichen; Ort nur, wenn er wirklich zu sehen ist (nicht „Bodensee“ bei Zypressen).

---

## 3. Ideen, die die Konkurrenz alt aussehen lassen

1. **Seelicht-Hero (Tageszeit).** Ein Motiv (S01/S02) aus fixer Stativposition, echt fotografiert bei Morgen, Mittag, Abend und Nacht (Flos-Leuchten an). Welche Variante erscheint, hängt von der Ortszeit in Lochau ab (serverseitig, keine Animation, kein LCP-Nachteil). Die Farbregeln stehen in `expertenrat/05` Idee 3. Fotografisch wichtig: gleiche Brennweite, gleiche Position, Möbel nicht bewegen, alle 4 Aufnahmen am selben Tag. Kein Wettbewerber kann das, weil keiner diesen Ort hat.

2. **„Ein Jahr am Fenster“.** Dasselbe Bild (Sofa vor dem See) einmal pro Monat aus derselben Position. Auf der Website als ruhige 12-Bild-Reihe auf „Das Haus“, auf Instagram als Zeitraffer-Reel. Das erzählt Ort, Beständigkeit und Saison ohne ein einziges Werbewort.

3. **Maßstab-Bild zu jedem Ausstellungsstück.** Eine echte Person (Team), 1,70 m, sitzt oder steht daneben; in der Bildunterschrift die Maße und die Körpergröße. Das beantwortet die größte Online-Unsicherheit (42 %, Baymard), und Minotti-Pressebilder zeigen fast nie Menschen.

4. **Hand-Archiv „Anfassen erlaubt“.** 1:1-Serie mit derselben Hand und demselben Seitenlicht auf jedem Material im Showroom, inklusive Muster-Bestellung per Post (`expertenrat/05` Idee 1). Daraus entsteht ein visueller Materialindex, nach dem man filtern kann („Bouclé“, „Nussbaum“).

5. **Ausstellungsstück-Pass.** Für den Atelierverkauf (Masterkonzept 4.2, Nr. 4): 6 Pflichtbilder je Stück (Front, 45°, Seite, Rücken, Detail, **jede Gebrauchsspur in Nahaufnahme mit Lineal**). Das ist ehrlich, deckt die Gewährleistungspflicht ab (`digital/14`) und schafft Vertrauen, das kein Rabatt-Banner erzeugt.

6. **„Wir liefern“ als Bildstrecke.** Echte Lieferung (L01–L05) bis zur Schweiz, inklusive Zollpapier-Mappe (anonymisiert), als Belegbild für den Dreiländer-Festpreis (Alleinstellung 5). Bilder beweisen den Service, den andere nur behaupten.

7. **Referenzen „ein halbes Jahr später“.** Projekte zweimal fotografieren: bei Übergabe und nach 6 Monaten, gelebt, mit Büchern und Blumen des Kunden. Das zeigt Qualität über die Zeit, und Hotels und Bauträger sehen, wie die Möbel altern.

8. **Bildtausch mit den Herstellern.** Eigene Showroom- und Projektfotos werden Minotti, Poliform, Rimadesio und Flos zur Nutzung angeboten (Unterlizenz-Recht im Fotografenvertrag). Im Gegenzug kommen die Freigaben für Herstellerbilder und vielleicht eine Nennung auf deren Kanälen. Das macht aus dem Rechteproblem ein Beziehungsthema (passt zu `digital/14` F3, Freigaben bündeln).

9. **Vernissage der eigenen Bilder.** Ein Fotograf aus der Region zeigt die Seelicht-Serie als Ausstellung im Café (passt zum Format „Vernissage“, Masterkonzept 4.2, Nr. 1), dazu Presse und Backlinks.

---

## 4. Was man auf keinen Fall tun darf

1. **Kein fremder Ort als eigener**: keine Zypressen, kein Meer, keine Pinien auf Seiten, die „Bodensee“ heißen; kein Stockfoto mit dem Alt-Text „Terrasse mit Meerblick“ (`digital/12` Z. 47). Das wäre irreführend (UWG § 2 AT / § 5 DE) und zerstört die Alleinstellung Ort.
2. **Keine KI-generierten Räume, Menschen oder Referenzen**, auch nicht „nur als Stimmung“ ohne Etikett. Kein KI-Seeblick vor echten Fenstern.
3. **Herstellerbilder nicht beschneiden, freistellen, umfärben, animieren (Ken-Burns) oder als KI-Input verwenden**, wenn die Freigabe es nicht ausdrücklich erlaubt. Kein Hotlinking von Herstellerservern als Ersatz für eine Lizenz (`digital/14` F3).
4. **Keine Herstellerbilder in Ads, Merchant Center oder Pinterest-Katalog** ohne Freigabe, die Werbung und Feeds nennt.
5. **Keine Markenlogos als Siegel und keine Bildunterschrift „offizieller Partner“** (Regel „keine Händler-Behauptungen“, `digital/01` Z. 6).
6. **Kein Ultraweitwinkel unter 24 mm** bei Produkten, keine gestreckten Proportionen, kein verfälschter Farbton bei Bezügen (Irreführung über Produkteigenschaften, Reklamationen, `expertenrat/05` Erkenntnis 9).
7. **Keine erkennbaren Personen ohne schriftliche Einwilligung** (§ 78 UrhG AT, § 22 KUG DE, DSGVO), keine Kinder von Kunden, keine Hausnummern, Kennzeichen, Familienfotos oder Post auf Projektfotos; EXIF/GPS entfernen.
8. **Kein HDR-Look, keine Blitzoptik, kein übersättigter Sonnenuntergang**, kein Drohnen-Pathos im Hero.
9. **Keine Dark Patterns mit Bildern**: kein „Nur noch 1 Stück“-Overlay auf Fotos, kein „Sale“-Stempel, keine Fake-Social-Proof-Bilder (gestellte „Kundenfotos“ mit Models), keine Bewertungsbilder, die nicht von Kunden stammen (DSA Art. 25, UGP-Richtlinie Anhang I).
10. **Kein Video mit Autoplay ohne Pause-Knopf** (WCAG 2.2.2), kein Video als LCP-Element, keine Hersteller-Kampagnenfilme ohne Freigabe (`digital/02` F5).

---

## 5. Prüf-Checkliste für die drei Prototypen

**Skala je Kriterium:** 0 = fehlt/verstößt · 1 = vorhanden, aber schwach · 2 = gut · 3 = vorbildlich. **Gewicht** in Klammern. Höchstwert: 3 × Summe der Gewichte (31) = **93 Punkte**. Ein **K.-o.-Kriterium** (markiert mit ★) mit 0 Punkten bedeutet: nicht launchfähig, egal wie hoch die Summe ist.

| # | Kriterium | Prüfmethode | Gewicht |
|---|---|---|---|
| 1 ★ | **Bildherkunft geklärt**: Jedes Bild steht im Register, kein unfreigegebenes Herstellerbild, kein Stock als „eigen“ | `grep -rhoE "src=..." src/app/[locale]/preview src/components/Preview` gegen Register abgleichen | ×3 |
| 2 ★ | **Hero zeigt den eigenen Ort** (Showroom, Café oder See, wiedererkennbar Lochau) | Sichtprüfung: Würde ein Kunde den Raum beim Besuch wiedererkennen? | ×3 |
| 3 | **Zuschnitt funktioniert in 21:9, 16:10 und 4:5** ohne angeschnittene Möbel; mobiler Hero ist eigenes Hochformat (Art Direction) | DevTools 1920×823, 1440×900, 390×844; `object-position` gesetzt? | ×2 |
| 4 | **Maßstab sichtbar**: Produktseite hat ≥ 1 Bild mit Mensch oder Maßangabe im Bild | Produktseite `preview/*/produkt/[slug]` öffnen | ×2 |
| 5 | **Material/Haptik**: ≥ 1 Detail- oder Hand-Material-Bild auf Marken- und Produktseiten | Sichtprüfung | ×2 |
| 6 | **Menschen echt**: Team/Gastgeberin mit Foto, keine Stock-Personen | Sichtprüfung | ×2 |
| 7 | **Look konsistent** (Weißabgleich, Kontrast, Schwarzpunkt) über alle eigenen Bilder einer Seite; Herstellerbilder in getrennten Modulen | Screenshot der Seite auf 25 % verkleinern: wirkt es wie ein Fotograf? Neutralfläche a\*, b\* ±3 (`expertenrat/05` Nr. 9) | ×2 |
| 8 | **Jedes Bild hat eine Aufgabe** (Produkt, Maßstab, Material, Mensch, Ort); keine dekorativen Füller | Bild für Bild aufzählen, Anteil Füller ≤ 10 % | ×2 |
| 9 | **LCP-Bild**: ≤ 120 KB mobil / ≤ 180 KB Desktop, `preload` + `fetchPriority="high"`, nicht animiert eingeblendet; LCP ≤ 2,0 s | Lighthouse mobil, Network-Tab | ×2 |
| 10 | **Video-Loop** (falls vorhanden): eigenes Material, 8–12 s, nahtlos, ≤ 2,5/1,2 MB, Poster = erstes Frame, Pause-Knopf, aus bei reduced motion | Network-Tab, `prefers-reduced-motion` emulieren | ×1 |
| 11 | **Feste Seitenverhältnisse**, CLS ≤ 0,05, max. 2 Formate pro Modul | Lighthouse, Sichtprüfung | ×1 |
| 12 ★ | **KI-Kennzeichnung**: kein unetikettiertes KI-Bild; Etikett sichtbar im HTML | Register-Spalte `ki-stufe` ≥ 1 → Etikett vorhanden? | ×2 |
| 13 | **Alt-Texte** wahr und beschreibend (Ort nur, wenn sichtbar), Bildunterschriften mit Ort/Stück/Credit | Alt-Texte gegen Bild lesen | ×1 |
| 14 | **Keine Händler-Behauptung und kein Druck im Bild** (Logos als Siegel, Sale-Stempel, Knappheits-Overlays) | Sichtprüfung | ×2 |
| 15 | **Datenschutz im Bild**: keine erkennbaren Personen ohne Einwilligung, keine Adressen/Kennzeichen | Sichtprüfung + Einwilligungs-IDs im Register | ×1 |
| 16 | **Ortslicht als Signatur**: mindestens ein Bild mit Bodensee-Licht (Abend, Föhn, Dämmerung) | Sichtprüfung | ×1 |
| 17 | **Social-Tauglichkeit**: Motive sind als 9:16 und 2:3 vorhanden bzw. im Master angelegt | Register-Spalte Formate | ×1 |
| 18 | **Unterscheidbarkeit**: Würde man die Seite mit verdecktem Logo von Höttges, Fretz, Gamma oder der Minotti-Seite unterscheiden? | Blindtest mit 5 Personen (Screenshots ohne Logo zuordnen, Ziel ≥ 4 von 5 richtig) | ×1 |

**Summe der Gewichte:** 31 → max. 93 Punkte. **Bewertung:** ≥ 73 sehr gut · 56–72 brauchbar, Bildnachproduktion nötig · < 56 oder ein ★ mit 0: nicht launchfähig.

**Stand heute (Platzhalter-Bilder, 26.10.2026) [Schätzung]:** *galerie* und *buehne* erreichen bei Kriterium 1 und 2 voraussichtlich 0 Punkte, weil die Bilder nicht eigen bzw. nicht nachgewiesen sind („Zypressen“, „Pinien, Meer“, Minotti-`cmx`-Bilder ohne nachgewiesene Freigabe, `grey-and-brown-combo-style-room-1.jpg` unbekannter Herkunft). Das ist kein Urteil über das Layout. Die Prototypen sollten **nach dem ersten Shooting mit denselben eigenen Bildern** verglichen werden, sonst bewertet man die Bilder statt das Design. *dreilaendereck* hat noch keine Seite.

---

## Quellen

- Nielsen Norman Group: Photos as Web Content. https://www.nngroup.com/articles/photos-as-web-content/
- Baymard Institute: In-Scale Product Images. https://baymard.com/blog/in-scale-product-images · https://baymard.com/research-articles/scale-mobile-product-images-in-landscape
- Peck, J. & Childers, T. L. (2003): Individual Differences in Haptic Information Processing: The „Need for Touch“ Scale. *Journal of Consumer Research* 30(3).
- Peck, J., Barger, V. & Webb, A. (2013): In search of a surrogate for touch. *Journal of Consumer Psychology* 23(2).
- Silva, S. C. et al. (2021): Pictorial and verbal product information and online purchase. *Journal of Retailing and Consumer Services* (Fassung über https://repositorio.ucp.pt).
- Google Search Central: Image SEO best practices. https://developers.google.com/search/docs/appearance/google-images · Image license metadata: https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata
- Google Merchant Center: AI-generated content (IPTC). https://support.google.com/merchants/answer/14743464 · IPTC: https://iptc.org/news/google-reminds-publishers-and-merchants-not-to-strip-metadata-from-images/
- EU AI Act Art. 50; Verhaltenskodex Kennzeichnung KI-Inhalte (final 06/2026): https://www.jonesday.com/en/insights/2026/06/european-commission-publishes-final-code-of-practice-on-marking-and-labelling-aigenerated-content · Entwürfe: https://www.scl.org/european-commission-publishes-second-draft-of-code-of-practice-on-marking-and-labelling-of-ai-generated-content/
- W3C WCAG 2.2, SC 2.2.2 Pause, Stop, Hide.
- Projektintern: `digital/01`, `02`, `12`, `13`, `14`, `expertenrat/05`, `23-masterkonzept.md` Abschnitt 4.
