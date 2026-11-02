# Ezarri – Werkzeug-Analyse und Paritätsliste

Stand: 28.10.2026 · Produktanalyse für den Ezarri-Bereich (Schalter `EZARRI_PUBLIC`, siehe `src/lib/ezarri/config.js`)
Quelle aller Befunde: https://www.ezarri.com/de (live geprüft mit Playwright/Chromium, Desktop 1440×900 und Pixel 7). Screenshots liegen unter `qa-screenshots/ezarri/analyse/`.
Rechte: Nach Aussage des Inhabers dürfen wir Ezarri-Inhalte (Bilder, Produktdaten, Datenblätter, Kataloge) mit Quellenangabe verwenden (inhaber-entscheidungen.md Nr. 7). Die schriftliche Bestätigung fehlt noch. **Code, Oberfläche und Texte von Ezarri übernehmen wir nicht.** Ezarris Konfigurator-JS ist obfuskiert und bleibt für uns Referenz, keine Vorlage.

---

## 1. Ezarri-Konfigurator (/de/konfigurator)

### 1.1 Technik (aus Netzwerk-Mitschnitt und lesbarem `kernel_AR.js`)
- Die Seite bettet ein iframe `/configurador/index.php?lang=DE` ein. Gebaut ist es mit jQuery 3.7, jQuery UI, SweetAlert2 und lity.
- **2D-Ansicht:** Die Bilder rendert ein externer Dienst, `virtualphotosystem.com/VPS/DOME_EZARRI/virtualbufferV2.php` (POST mit Mischung, Fuge, Kamera `CAM_A`, `CAM_C` …). Er liefert vorgerenderte Fotoszenen mit Textur, z. B. einen Infinity-Pool mit Bergpanorama. Jede Änderung braucht einen Server-Roundtrip.
- **3D-Ansicht:** Google `<model-viewer>` mit **einer** festen Beckengeometrie `Casco_A.glb` (520 kB, für iOS `Casco_A_IOS.glb`). Fest ist auch die Größe von **8 × 4 m** (so steht es im AR-Hinweis).
  - Die Wasserbewegung entsteht aus 10 Normal-Map-JPGs (`Agua_A_Normal_0000-0009`, je ca. 228 kB), die als Flipbook ablaufen.
  - Die „Kaustik“ besteht aus 10 gebackenen Lightmaps (`BakeCasco_0000-0009`) plus einer Variante ohne Kaustik. Es gibt also **keine echte Kaustik-Simulation**.
  - Die Umgebung ist ein festes Environment-JPG `ENV_6.jpg` (3,5 MB, mobil `ENV_6_LW.jpg`). Licht und Tageszeit lassen sich nicht wählen.
  - Für die Fliesen-Normalmaps lädt die Seite `Normal25_5_PLANA.png` (9 MB) und `Normal25_5_MED.png` (13 MB) sowie `GresiteNormalH.jpg` für Hexa.
  - Glanz und Metallic stammen aus den Produktdaten (`Reflection`, `Glossy`, `SpecularTex`: Spec, Gloss, Nacar, Espejo). Bei Mischungen gilt der Wert des Mosaiks mit dem **größten Anteil**. Iridescent und Gold werden deshalb nicht pro Steinchen korrekt gerendert.
  - Für den Wasserzustand gibt es ein Select „Estado del agua“ mit den Werten `MOV` (bewegt), `NO` (ruhig, ohne Kaustik) und `OFF` (Becken leer). Der Listener ist im Code auskommentiert. Für Nutzer ist die Funktion praktisch nicht verfügbar.
- **AR:** model-viewer AR (WebXR, Scene Viewer, Quick Look). Das Becken ist auf 8 × 4 m festgelegt.
- **Daten-API:** `shared/funciones_Ezarri.php` (POST, sessiongebunden) mit `modo=carga_juntas | carga_series | carga_colores | carga_modelos (filtro, formato, esCanal) | carga_iconos_lateral`. Die Antwort ist HTML mit eingebetteten JSON-Objekten pro Mosaik.
  - Felder: `id, categoria, serie, nombre, icono, formato, especiales, DiffuseTex, SpecularTex, Color, TextureLevel, Brightness, Saturation, Hue, Reflection, Glossy, Bump, mezclable, cf_mosaico, percent, filtro_color, orden_*`.
  - Fertige Ezarri-Mischungen (z. B. Cocktail „Mojito“) sind als `cf_mosaico: "66;117;125"` und `percent: "85;10;5"` hinterlegt. Daraus lassen sich die Rezepturen der Mix-Referenzen direkt ableiten.
- **Weitere Module:** `Modulo_PDF/creandoPDF_Ezarri.js` (→ `fichaPDF_Ezarri.php`), `Modulo_Form` (Angebot), `Modulo_Loca` (Händlersuche), `Modulo_AR`.
- **Ladegewicht:** Die Konfiguratorseite überträgt **ca. 42 MB** in rund 196 Requests. Dazu kommen Tracking-Dienste: GA4, UA, Google Ads, GTM, Meta Pixel, Matomo, Ahrefs, reCAPTCHA und AddToAny. `load` feuert nach 9 s, das iframe auf Pixel 7 erst nach 14,5 s.

### 1.2 Katalog im Konfigurator (API-Abzug 28.10.2026)
| Format | Modelle gesamt | davon mischbar | Serien |
|---|---|---|---|
| 25 mm | 201 | 90 | Gea 8, Aquarelle 8, Terrazzo 6, Zen 19, Gemma 13, Cocktail 18, Iridescent 19, Metal 10, Space 6, Fosfo 10, Gold 12, Lisa 28, Niebla 28, Mix 16 |
| 50 mm | 76 | 42 | Gea, Aquarelle, Terrazzo, Zen, Iridescent, Lisa, Niebla |
| Hexa | 7 | 5 | Gemma, Iridescent, Lisa, Niebla |

- Kategorien: Premium und Classic. Farbfilter: Weiß, Grau, Schwarz, Blau, Grün, Gelb, Braun, Rosa, Rot (Mehrfachzuordnung möglich).
- 7 Fugenfarben (mit Hex-Wert): Bianco Assoluto 100 `#ededed`, Grigio Ardesia 130 `#95a5bb`, Nero Carbonio 145 `#141414`, Azzurro Caraibi 320 `#6c9ca0`, Blue Denim 340 `#2e618c`, Blue Zaffiro 350 `#2a436b`, Verde Pino 430 `#3d4d40`.
- Auf den Produktseiten erscheinen weitere Fugennamen, z. B. „02 Sabbia Bianca“. Die beiden Fugen-Listen stimmen nicht überein.

### 1.3 Ablauf (Screenshots `konf-*.png`)
1. Start: Leeres Szenenbild mit „Wählen Sie ein Mosaik …“ und dem Hinweis, die Farbpalette sei nur eine Annäherung (`konf-01-start`).
2. „+“ öffnet ein Overlay „Visualisieren Sie“ mit drei Checkboxen: *maßgeschneiderter Mix*, *Produktcode von Ezarri*, *Mosaic Pattern* (`konf-02-prefilter`).
3. Darauf folgt eine Auswahl-Palette mit Filtern nach Sammlung (Checkbox), Farbe und Format (25/50/Hexa) und mit Thumbnails (`konf-11-mix`).
4. Bis zu **4 Referenzen** lassen sich mischen. Der Anteil wird pro Referenz mit Slider und Zahlenfeld eingestellt (Start 50/50). Nicht mischbare Referenzen sind nur allein darstellbar (`konf-13-pick2`).
5. **Kanäle:** Bis zu 3 „Canal“-Slots, also Bahnmarkierungen bzw. Streifen mit eigenem Mosaik (Parameter `esCanal`).
6. Akkordeons für **Fugen** (7 Farben), **Format** (25/50/Sechseckig) und **Spezialteile** (Corner, Cove).
7. Die 2D-Szene hat Pfeile links und rechts für Kamera- und Szenenwechsel (`CAM_A`, `CAM_C` …).
8. Umschalter **2D/3D**. In 3D gibt es Orbit, Zoom und einen AR-Button (`konf-17-3d`).
9. Die Buttons lauten **Neu starten**, **PDF herunterladen** und **Angebot anfordern**.
10. Das Angebotsformular fragt Quadratmeter*, Zusatzangebote (Kleber und Fuge, Corner & Cove, Schneidewerkzeuge, andere Werkzeuge), Name, Nachname, Firma, Profil (Bauunternehmer, Händler, Architekt, Innenarchitekt, Landschaftsarchitekt, Privat), Ort, PLZ, Land, Telefon, E-Mail und „Wie haben Sie von uns erfahren?“ ab. Abgesendet wurde es **nicht**.
11. Der PDF-Download läuft über die Funktion `envia_formulario_descargaPDF`. Er ist vermutlich an das Formular gekoppelt (Lead-Gate) und wurde nicht ausgelöst.

### 1.4 Schwächen des Ezarri-Konfigurators
- **Ladezeit:** 42 MB, davon allein 22 MB Normal-PNGs. Dazu kommen ein Render-Roundtrip pro Änderung zu einem Drittanbieter und rund 10 Tracker. Mobil braucht das iframe mehr als 14 s.
- **Mobil:** Die Szene ist oben klein, darunter folgt eine große weiße Lücke, das Menü liegt unter dem Fold (`konf-mobil-01`). Der „+“-Button ließ sich in der Pixel-7-Emulation nicht per Tap treffen (Playwright-Klick lief in einen Timeout).
- **Bedienung:** Das Overlay hat 3 Checkboxen, wo eigentlich Radio- oder Tab-Elemente hingehören. Die Panoplia zeigt bis zu 90 kleine Thumbnails ohne Suche. Gemischt wird nur über Prozent-Slider, ein Ziehen der Anteile gibt es nicht. Das „x“ ist ein winziger Text-Button. Weder Rückgängig noch Speichern ist möglich.
- **Kein Teilen-Link und kein URL-State.** Ein Neuladen verwirft die Konfiguration.
- **Ein einziges Becken** (8 × 4 m, Rechteck mit Treppe): keine eigenen Maße, keine Formen (L, Oval, Skimmer- oder Überlaufrinne), kein Whirlpool, keine Dusche und kein Bad, obwohl Ezarri diese Einsätze vermarktet.
- **Licht und Wasser:** keine Tageszeit, keine Nachtbeleuchtung (LED), keine Wassertiefe. Die Wasserfarbe ist nur indirekt sichtbar. Der Wasserzustand ist im UI totgelegt.
- **Material:** Glanz und Iridescence richten sich nach dem dominanten Mosaik und stimmen bei Mischungen nicht. Die Normalmap ist für alle 25-mm-Mosaike gleich.
- **Kein Mengen- oder Kostenbezug:** Die m² werden im Angebotsformular von Hand eingetippt. Der Mosaik-Rechner ist nicht angebunden.
- **Keine Musterbestellung** und keine Fotomontage auf ein eigenes Foto.
- **Barrierefreiheit:** Thumbnails sind `<img>` ohne Alt-Text in `div onclick`. Es gibt keine Tastaturbedienung, keine Fokuszustände und keine ARIA-Labels. Der Text liegt teils unter 12 px. Das iframe hat keinen Titel.
- **DSGVO:** Die Tracking-Requests (GA, Ads, Meta) liefen in der ersten Sitzung schon **vor** der Cookie-Entscheidung. Gemessen wurde das mit einem frischen Kontext.

---

## 2. Mosaik-Rechner (/de/mosaik-rechner)
- **Eingaben:** Format (25 mm oder 50 mm), Länge*, Breite*, max. Tiefe, min. Tiefe, durchschnittliche Tiefe, Marge in % (Default 10).
- **Formel** (laut Seite): Boden = L×B, Längswände = L×Ø-Tiefe×2, flache Stirnwand = B×min-Tiefe, tiefe Stirnwand = B×max-Tiefe, dazu die Marge. Am Ende wird auf volle Boxen gerundet (25 mm: 2 m² je Box).
- **Test** mit 10×5 m, Tiefe 2/1/1,5 m und 10 % Marge: **106 m², Klebstoff 265 kg (≈ 2,5 kg/m²), Fugenmasse 127 kg (≈ 1,2 kg/m²)** (`rechner-ergebnis.png`).
- Darunter folgen die Akkordeons „Werkzeuge und andere Produkte“ und „Kostenvoranschlag anfordern“ (Formular).
- **Schwächen:**
  - Nur Rechteckbecken. Treppen, Bänke, Überlaufrinne und Rundungen fehlen.
  - Die Ø-Tiefe wird nicht automatisch berechnet.
  - Keine Grafik, keine Zahl für die Boxen, keine Spezialteile (Corner, Cove in lfm).
  - Keine Übergabe an Konfigurator oder Angebot. Der Haftungshinweis ist lang.

## 3. Custom Mix (/de/custom-mix)
Die Seite ist identisch mit dem Konfigurator-Intro: Bis zu 4 Referenzen mischen, Fugenfarbe wählen, Simulation ansehen, Angebot anfordern und Datei herunterladen. Eigene Inhalte hat sie nicht.

## 4. Custom Printed / Custom Pixel / Standard Printed / Standard Pixel
- **Custom Printed Mosaic:** Kunden schicken ein Bild, Ezarri druckt es auf das Mosaik. Gezeigt werden Galerie-Slides (Rosette im Pool, Whirlpool-Boden, Badwand) und ein Kontaktformular. Die Texte sind teilweise englisch, obwohl die Seite deutsch ist.
- **Custom Pixel Mosaic:** Aus einem Bild wird Pixel-Art, ein Steinchen entspricht einem Pixel. Mehrere Oberflächen sind kombinierbar (Nacar, Lisa, Metal). Referenz ist das Hard Rock Hotel Tenerife. Die deutsche URL fehlt, das Menü verlinkt auf `/en/`.
- **Standard Printed:** fertige Motive (Dolphin Family, Happy Dolphins, Sea View …).
- **Standard Pixel:** fertige Pixel-Motive.
- **Schwäche:** Alles läuft über ein Kontaktformular. Es gibt **keine Vorschau, keinen Upload und kein Pixel-Raster live im Browser**.

## 5. Patterns (/de/patterns-collection)
- Pixelmuster im 25-mm-Format aus 100 % recyceltem Glas, mit JointPoint® verklebt, „alle im Konfigurator verfügbar“.
- Die Seite besteht aus Slider (10 Bilder), Video (erst nach Marketing-Cookies sichtbar), Musterslider (4) und Kontaktformular.
- Im Konfigurator laufen die Muster über die Prefilter-Option „Mosaic Pattern“ (`patrones_Ezarri.js`, UV-Tiling 2/0,84).

## 6. Fading out (/de/fading-out)
Es gibt 4 Verlaufsmischungen (Marrón, Gris, Azul, Rock 25), jeweils mit Bild. Erklärt wird nicht, wie der Verlauf über die Beckentiefe verläuft. Eine Simulation fehlt.

## 7. Galerie (/de/galerie) und Kollektionen (/de/kollektionen)
- **Galerie-Filter:**
  - Wasserfarbe (6 Farbfelder ohne Textlabel: himmelblau, grün, graugrün, türkis, blau, „natürliches Flusswasser“)
  - Einsatz (Privatpool, öffentliches Bad, Wellness, Bäder, Küchen)
  - Kollektionen, Mosaikfarbe, Format (25, 50, Hexa)
  - Safe-Steps / Anti-slip, Special Pieces (Corner, Cove)
- Die Galerie hat 64 Seiten mit Paginierung. Die Filter stehen als Query-Parameter in der URL (`?chk_…=on`).
- Gemessen wurden 48 MB Transfer und `load` nach 11 s.
- **Kollektionen:** gleiche Filter plus **Preisklasse €/€€/€€€**. Karten tragen ein „NEW“-Badge. Einige Karten verlinken auf `/de/null` (Fehler).
- **Produktdetail** (z. B. /de/dune, `produkt-dune.png`):
  - Formatumschalter 25/50, Anti-Rutsch 25/50 Safe, Special Pieces (Corner), Angabe der Fuge, Bild „Erhältlich“ und „Deco“
  - Infotabelle (Format, Kollektion, Farbe). Die Kollektion ist leer.
  - Akkordeons „Verfügbaren Bestand konsultieren“, „Kontakt / Budget anfordern“, Packaging, „Das könnte Sie auch interessieren“
  - Kein Datenblatt-Link auf der Seite, kein „im Konfigurator öffnen“, keine Galerie-Referenzen des Produkts

## 8. JointPoint® (/de/jointpoint)
Ezarris eigenes Verklebesystem: Die Steinchen sind punktuell verbunden, ohne Papier oder Netz. Laut Ezarri passt es sich Kurven an, ist leicht zu schneiden, spart bis zu 25 % Verlegezeit gegenüber papierbasierten Systemen und dehnt, schwindet oder bricht nicht durch Feuchte. Die Seite besteht aus Text, Video und Formular.

## 9. Verlegung (/de/verlegung)
- Anleitung je Beckentyp: Beton, verzinkter Stahl, Polystyrol, Polypropylen, Polyester.
- Neun Schritte mit Weiter- und Zurück-Buttons:
  1. Untergrund vorbereiten (Restfeuchte < 3 %)
  2. Kleber mindestens C2TE wählen
  3. Mit 6-mm-Zahnkelle auftragen
  4. Platten mit JointPoint® ansetzen
  5. Mit Gummibrett ausrichten
  6. Epoxid-Fuge der Klasse RG wählen
  7. Fugen
  8. Mit Schwammbrett reinigen
  9. Nach 24 h Bauschlussreinigung
- Das Video erscheint erst nach Marketing-Cookies. Die Texte sind teils englisch.

## 10. Pflege (/de/pflege-des-Mosaiks)
Acht Artikel (englische Titel): Epoxid-Reste entfernen, warum Epoxidfuge, Kalk entfernen, Wirkung von Chemikalien auf Glas, Zementfugen-Reste, Mosaik unter Wasser verlegen, Bad reinigen, Mosaik schneiden.

## 11. FAQ (/de/faqs)
- 18 Fragen in einem Akkordeon, darunter:
  - JointPoint®: was es ist und warum es besser hält
  - Umwelt und recyceltes Glas (Anteil), Material
  - Fabrikstandort (Spanien), Export
  - Lebensdauer, Wasserfarbe je Mosaik, Installation
  - Kleber und Fugen, Polyester- und Fertigbecken, Lebensdauer der Zementfuge, Ablösen von Fliesen
  - Lieferzeiten, Formate
  - Händlersuche, Kauf als Privatperson nur über Händler, Online-Verfügbarkeit
- Fehlerhafte Zeichen: „¿“ steht vor deutschen Fragen.
- Für uns wichtig: **Privatkunden kaufen über Händler.** Das ist der Hebel für Platzhirsch als Vertragshändler.

## 12. Sonstiges
- Downloads: Kataloge, Produktblätter (/de/data-sheets), Zertifizierungen, Ressourcen für Architekten (Login), Multimedia-Portal, Outlet (Login), Händlersuche (`localizador`).
- Anwendungsseiten: Privatpools, Großprojekte, Innendekoration, Wellness, Architekten.

---

## 13. Vergleich mit Mitbewerbern (Recherche 28.10.2026)
| Anbieter | Werkzeug | Was dort besser ist |
|---|---|---|
| Hisbalit | Mixtures-Konfigurator (hisbalit.es/en/mixtures-configurator) | Mehr als 200 Farben, 4 Formate (auch Kreise), 3 Oberflächen (glänzend, rutschhemmend B und C), Mischung auf großer Fläche, **druckbares realistisches Bild**, eigene Mixe ab 2 m², Lieferzeit ca. 3 Wochen genannt; Art-Factory-Service für Motive (archiweb.cz, Pressetexte) |
| Bisazza | Image-to-Mosaic-Service, App mit Raumansichten | Bild wird automatisch in 10- und 20-mm-Raster „pixelisiert“, Verlegepläne werden mitgeliefert; App zeigt Kollektion, Format und Farbe in mehreren Umgebungen inkl. Pool |
| Trend Group | App „I-Trend“ (älter) | Raum mit eigenen Farben und Materialien gestalten |
| Magic Mosaic (FR) | Web-Konfigurator | **Fotobasierte Visualisierung** des eigenen Projekts inkl. Pool |
| Villeroy & Boch | Online-Badplaner, AR-App | **Eigener Grundriss**, Fenster und Türen, 3D-Rundgang, AR auf dem Handy |
| Roomle / Rako | Raumplaner, Fliesenvisualisierer | Eigene Raummaße, Fliesen-Verlegemuster, Teilen-Link (Roomle). Einzelheiten konnten wir nicht live prüfen. |

Alttoglass und Mosaico+: Wir haben keinen öffentlichen Konfigurator gefunden. Beide bieten Motive nur auf Anfrage an.
**Fazit:** Kein Mitbewerber bietet alles zusammen: eigenes Becken, echte Wasser-Optik, Foto-Montage, Menge und Muster. Mit diesem Paket hebt sich Platzhirsch deutlich ab.

---

## 14. Paritätsliste (Pflichtumfang für Platzhirsch)
- [ ] Vollsortiment: 14 Serien, 201 Modelle à 25 mm, 76 à 50 mm, 7 Hexa, Kategorien Premium und Classic
- [ ] Filter: Serie, Farbe (9), Format, Einsatz, Wasserfarbe, Anti-Rutsch, Spezialteile, Preisklasse (bei uns „auf Anfrage“, ohne €-Stufen)
- [ ] Produktseite: Formate, Safe-Varianten, Spezialteile (Corner, Cove), Fuge, Bilder, Infotabelle, Verfügbarkeit anfragen, Anfrageformular, Verpackung, Ähnliche
- [ ] Konfigurator mit drei Einstiegen: eigener Mix, Ezarri-Referenz, Pattern
- [ ] Mischung aus bis zu 4 Referenzen mit Prozentanteilen, Regel „nicht mischbar“ (`mezclable`), Rezepte der Mix-Referenzen
- [ ] Kanäle und Streifen (bis zu 3)
- [ ] 7 Fugenfarben
- [ ] Format 25/50/Hexa
- [ ] Spezialteile
- [ ] Fotoszenen (≥ 2 Kameras) und 3D-Becken mit Orbit und Zoom
- [ ] Wasser bewegt, ruhig oder leer
- [ ] AR
- [ ] Neu starten
- [ ] PDF-Datenblatt der Konfiguration
- [ ] Angebot anfordern (m², Zusatzprodukte, Profil)
- [ ] Mosaik-Rechner: Format, L, B, Tiefen, Marge, Ergebnis in m², Kleber (kg), Fuge (kg), Rundung auf Boxen
- [ ] Custom Printed, Custom Pixel, Standard Printed, Standard Pixel, Patterns, Fading out
- [ ] Galerie mit Filtern und Paginierung
- [ ] JointPoint®, Verlegung (5 Beckentypen, 9 Schritte), Pflege (8 Themen), FAQ (18 Fragen)
- [ ] Downloads: Kataloge, Datenblätter, Zertifikate

## 15. Top-10-Verbesserungen
1. **Echte Echtzeit-3D (three.js, R3F):** prozedurale Wasser-Kaustik als Shader statt Flipbook, Fresnel, Tiefenfarbe, Glanz und Iridescence pro Steinchen über ein Instancing- oder Atlas-Raster. KTX2- oder AVIF-Texturen statt 22 MB PNG. Ziel: Erstansicht unter 2 MB, LCP ≤ 2,0 s mit Poster-Bild.
2. **Eigenes Becken:** Länge, Breite, Tiefe flach/tief, Form (Rechteck, L, römische Treppe, Freiform-Ecken), Überlauf oder Skimmer, Sitzbank. Dazu Whirlpool, Dusche und Bad als Szenen.
3. **Licht:** Tageszeit-Slider (Morgen, Mittag, Abend), Bewölkung, Unterwasser-LED in Weiß oder Farbe, Wassertiefe mit Farbverlauf.
4. **Verknüpfte Mengenberechnung:** Die Maße aus dem Konfigurator ergeben automatisch m², Boxen, Corner und Cove in lfm, Kleber und Fuge. Eine Skizze zeigt die Flächen.
5. **Teilen-Link und URL-State,** Merkliste und Wiederherstellen. Rückgängig und Wiederholen.
6. **PDF-Zusammenfassung ohne Lead-Gate:** Renderings, Rezept (Referenzen und %), Fuge, Mengen, Verlegehinweis, Quellenangabe Ezarri, QR-Code zum Teilen-Link.
7. **Fotomontage auf ein Kundenfoto** (eigener Pool oder Bad, perspektivische Fläche mit 4 Punkten) und ein **Vorher/Nachher-Slider**.
8. **Live-Pixel-Mosaik-Generator:** Bild hochladen, im Browser auf 25-mm-Raster und Ezarri-Palette quantisieren, Steinchen pro Farbe zählen, dann anfragen.
9. **Musterbestellung:** bis zu n Referenzen als Handmuster anfragen, dazu Termin im Studio Lochau mit Café-Beratung.
10. **Mobil zuerst und WCAG 2.2 AA:** Bottom-Sheet-Auswahl mit Suche und Farbfilter, Drag-Anteile mit Tastatur, Alt-Texte, Fokus, reduced motion (statisches Wasser), keine Tracker vor Einwilligung.
