# Sofaplaner – Original-3D-Modelle von Minotti

Stand 31.10.2026. Der Sofaplaner kann jedes Element, das ein Kunde plant, als **echtes Minotti-3D-Modell** zeigen – Element für Element, an genau der Stelle und in der Drehung aus dem Plan, mit dem gewählten Bezug (Stoff, Struktur/Bouclé, Samt, Leder, Nubuk, Outdoor). Solange für ein Element kein Modell vorliegt, bleibt es wie bisher **schematisch** (Volumen nach Herstellermaßen). Die Legende oben links in der 3D-Vorschau zeigt, was was ist: „Originalmodell Minotti“ bzw. „schematisch“ (bei gespiegelten Hand-Varianten zusätzlich „gespiegelt“).

## 1. Rechtliches – zuerst

- Minottis 3D-Modelle sind **urheberrechtlich geschützt** und nur im Händlerbereich mit Login erhältlich.
- Für die **öffentliche Anzeige auf der Website** braucht es eine **schriftliche Freigabe von Minotti S.p.A.** (E-Mail genügt, bitte ablegen). Die Händler-Lizenz für Planung/Präsentation im Showroom deckt eine Website-Nutzung in der Regel nicht ab.
- Ohne Freigabe kann man konvertieren und intern testen, die Modelle erscheinen aber **nicht** im Planer: das Manifest steht dann auf `"freigabe": false`, und der Planer ignoriert alle Modelle.
- Die Modelle werden nur heruntergeladen und konvertiert – **nicht** nachgebaut, nicht verändert (außer Einheit, Ausrichtung, Polygonreduktion) und nicht als eigene Datei zum Download angeboten.
- Lizenzhinweis je Modell im Manifest: „Minotti S.p.A. – Nutzung mit Freigabe“.
- Vor dem ersten Commit der konvertierten GLB-Dateien (`public/labs/sofaplaner/modelle/**`) klären, ob das Repository öffentlich ist – falls ja, die GLBs nur auf dem Server ablegen und den Ordner in `.gitignore` aufnehmen.

## 2. Was herunterladen?

Die vollständige Liste je Modellfamilie (alle 90 Familien des Planers) steht in **[sofaplaner-3d-downloadliste.md](sofaplaner-3d-downloadliste.md)** – mit Ordnername und Element-Code, zum Abhaken. Sie wird aus den Recherche-Dateien erzeugt:

```
node tools/sofaplaner-3d/download-liste.mjs
```

- Bei 3 Familien (Andersen Slim 103, Andersen Slim 103 „Quilt“, Andersen Slim 90) stammen die Namen direkt aus Minottis CAD-Liste (`cad.modelle_3d`), z. B. „SOFA CM 227“, „ELEMENT WITH 1 ARMREST CM 186“, „CHAISE LONGUE CM 227“.
- Bei den übrigen Familien sind die Namen aus den Elementen abgeleitet; im Händlerbereich können sie leicht anders heißen (gleiche Breite in cm suchen).
- **Format:** bevorzugt **FBX**. OBJ, 3DS, DAE (Collada), STL, GLB/GLTF und ZIP-Archive gehen auch. **DWG** (2D-Zeichnung), **SKP** (SketchUp) und **MAX** (3ds-Max-Szene) werden übersprungen – bitte die FBX-/OBJ-Variante wählen.
- **SX/DX** (links/rechts): eine Hand genügt, die andere wird gespiegelt und in der Legende als „gespiegelt“ markiert. Beide Hände sind besser, wenn das Modell asymmetrische Details hat (Nähte, Flap, Kissen).
- Empfehlung für den Anfang: zuerst die Startfamilie des Planers (**Connery**, öffnet standardmäßig) und die Familien, die im Showroom stehen – jeweils Sofa + Endelemente + Chaiselongue + Ecke.

## 3. Wohin damit?

```
Herstellermaterial/Minotti/3d/
  andersen-slim-103/
    SOFA CM 227.fbx
    ELEMENT WITH 1 ARMREST CM 186.fbx
    CHAISE LONGUE CM 227.zip
  connery/
    …
  zuordnung.json        (nur falls nötig, siehe unten)
```

- Ein Unterordner pro Modellfamilie; Ordnername wie in der Download-Liste (`andersen-slim-103`) oder einfach der Modellname („Andersen Slim 103“).
- Der Ordner `Herstellermaterial/` ist in `.gitignore` – die Originaldateien landen nie im Repository.
- Dateinamen so lassen, wie Minotti sie liefert. Erkannt werden Breite in cm („CM 227“), Typ (SOFA, ELEMENT WITH 1 ARMREST, CHAISE LONGUE, CORNER, BENCH …) und Hand (SX/DX, LEFT/RIGHT).
- Wenn eine Datei nicht eindeutig ist, meldet die Konvertierung das. Dann in `Herstellermaterial/Minotti/3d/zuordnung.json` eintragen:

```json
{
  "andersen-slim-103/Minotti_model_0042.fbx": "AS103-SOFA-227",
  "andersen-slim-103/left element.fbx": { "code": "AS103-EL1ARM-186-SX", "side": "SX" },
  "connery/Rendering-Szene.fbx": { "ignorieren": true }
}
```

Die Element-Codes stehen in der Download-Liste.

## 4. Konvertieren – ein Befehl

```
npm run sofaplaner:3d                    # konvertieren, Freigabe-Status bleibt
npm run sofaplaner:3d -- --freigabe      # erst wenn die schriftliche Freigabe vorliegt
npm run sofaplaner:3d -- --nur-pruefen   # nur zeigen, welche Datei welchem Element zugeordnet wird
```

Voraussetzung: **Blender 4.x** (kostenlos, blender.org) für FBX/OBJ/3DS/DAE – wird unter „Programme\Blender Foundation“ automatisch gefunden, sonst `--blender "C:\Pfad\blender.exe"` oder Umgebungsvariable `SOFAPLANER_BLENDER`. Hinweis Windows: Blender nicht in einem sehr tief verschachtelten Ordner entpacken (Pfadlänge > 260 Zeichen lässt Blender-Add-ons scheitern). GLB/GLTF-Dateien brauchen kein Blender. Blender läuft dabei headless und nur auf der CPU (kein Rendern).

Was die Konvertierung macht (`tools/sofaplaner-3d/convert.mjs`, `lib.mjs`, `blender_export.py`):

1. Format → GLB (Blender), ZIPs werden entpackt.
2. Familie aus dem Ordnernamen, Element aus dem Dateinamen (oder `zuordnung.json`).
3. **Einheit** (m, cm, mm, inch, ft) anhand der Herstellermaße der JSON erkannt; Ergebnis in Metern (glTF).
4. **Ausrichtung** wie im Planer: Breite entlang X, Rücken hinten (−Z), Sitzseite vorne (+Z), **Ursprung = Mitte der Grundfläche auf Bodenhöhe** (so platziert der Planer jedes Element; die Draufsicht hat dieselbe Front nach +y). Bei Endelementen wird die Hand aus der Geometrie erkannt (höhere Armlehne links = SX), wenn der Dateiname sie nicht nennt; Ecken werden nach der Hand ausgerichtet.
5. **Maßprüfung:** Breite, Tiefe und Höhe der Bounding Box gegen die JSON, Toleranz **±2 cm**. Weicht ein Modell mehr ab, wird es konvertiert, aber mit `"ok": false` markiert und **nicht** angezeigt (Meldung „Maße weichen ab“) – dann Datei/Zuordnung prüfen.
6. **Teile zusammenfassen** nach Material: `upholstery` (Polster/Korpus – bekommt den gewählten Bezug), `base` (Sockel/Füße – bekommt die gewählte Sockelfarbe, mitgelieferte Holz-/Metalltexturen bleiben), `piping` (Keder). Unbekannte Materialien: bodennahe Teile = Sockel, sonst Polster.
7. **LODs:** `desktop` (≤ 120 000 Dreiecke, Ziel 100 000) und `mobile` (≤ 30 000, Ziel 25 000), reduziert mit dem meshopt-Simplifier, komprimiert mit **meshopt** (`EXT_meshopt_compression`, Decoder im Bundle, kein CDN). Texturen nur, wenn die Quelle welche hat – dann als WebP (KTX2 bräuchte das KTX-Software-Werkzeug `toktx`, das hier nicht installiert ist).
8. **Manifest** `public/labs/sofaplaner/modelle/manifest.json`: je Modell und LOD Familie, Element-Code, Hand, Minottis Modellname (aus `cad.modelle_3d`), Datei, Bounding Box, Soll-Maße, Abweichung, Dreiecke, Quelldatei, Lizenzhinweis. Dazu ein Bericht `Herstellermaterial/Minotti/3d/konvertierung-bericht.json` mit allen übersprungenen Dateien und Gründen.

Die Website muss dafür nicht neu gebaut werden, die Dateien liegen unter `public/`. Nach dem nächsten Deploy (bzw. sofort im Dev-Server) erscheinen die Modelle.

## 5. So zeigt der Planer die Modelle

- `src/lib/sofaplaner/modelle3d.js` sucht zu jedem Planelement (Familie + Element-Code + Hand) das passende GLB; fehlt die Hand, wird das Modell der anderen Hand gespiegelt. Ohne Freigabe oder bei `"ok": false` → `null` → schematisch.
- `Preview3D.js` lädt das Modell erst, wenn die 3D-Vorschau offen ist (GLTFLoader + meshopt-Decoder aus three.js, selbst gehostet), stellt es exakt an die Planposition und legt den gewählten Bezug mit echten CC0-Stoff-/Lederscans (Normal- + Rauheitskarte, Poly Haven) auf die Polster. Bis es geladen ist, steht das schematische Element da.
- Mobil bzw. auf schwachen Geräten (Qualitätsstufe „low“) wird das `mobile`-LOD geladen, sonst `desktop`. Demand-Rendering, reduzierte Bewegung und die automatische Qualitätsabstufung bleiben unverändert.

## 6. Tests

- `node --test tests/unit/sofaplaner-3d-modelle.test.mjs` – Pipeline (Einheit, Drehung, Ursprung, Hand, Maßprüfung, LODs, Manifest) mit einem **Test-Dummy** (`tests/fixtures/sofaplaner-3d/`, Klötzchen-Attrappe, ausdrücklich KEIN Minotti-Modell, wird nie ausgeliefert) und die Zuordnung (SX/DX, Spiegelung, Freigabe).
- Konvertierung aus FBX wurde am 31.10.2026 mit Blender 4.5 und dem Test-Dummy durchgespielt (mm-FBX → erkannt, SX, Maße ±0 cm).
