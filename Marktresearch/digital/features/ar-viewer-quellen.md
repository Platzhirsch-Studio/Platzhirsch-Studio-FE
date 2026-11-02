# AR-Viewer: Inventur der 3D-Quellen für das Sortiment

**Stand:** 27.10.2026 · **Daten:** `src/lib/arviewer/sources.json` (Marke → Quellenstatus, Stufen je Produkt, Dateipfade, zugeordnete 3D-Downloads) · **Bezug:** `ar-viewer.md` (Pipeline, Datenmodell, Frappe-Vorschlag)

## Kurzfassung

Geprüft wurden alle **1.760 aktiven Katalogprodukte aus 22 Marken** (Backoffice, 36 Marken, davon 14 ohne Produkte). Ergebnis je Stufe:

| Stufe | Produkte | Bedeutung |
|---|---:|---|
| **A: echtes 3D, zugeordnet** | **395** | Öffentlicher Hersteller-Download ohne Login wurde dem Katalogprodukt zugeordnet (Minotti 314, ClassiCon 79, Flos 2) |
| **A′: echtes 3D laut Marke, Zuordnung offen** | **519** | Hersteller bietet öffentlich 3D je Produkt (Minotti-Rest 173, Flos 137, Poliform 103 nach Formular, ClassiCon-Rest 47, Sifas 59) |
| **B: AR-Foto mit Maßen** | **485** | Kein 3D, aber Bild und Maße im Backoffice |
| **C: nur Bild** | **221** | Bild ohne verwertbare Maße |
| **D: kein Bild** | **140** | davon 112 mit Maßen (Brand van Egmond 111, Rimadesio 1), 28 ganz ohne Bild und Maße (Next125 13, Quasar 13, Rimadesio 2) |

Zusammengefasst: Für bis zu **914 Produkte (52 %) ist echtes 3D möglich**, für **485 (28 %) eine maßstäbliche AR-Foto-Karte**, und **361 (20 %) haben nur ein Bild oder gar keins**. Bei allen Stufen fehlt noch die **schriftliche Freigabe** des Herstellers. Öffentlich herunterladbar heißt nicht, dass die Nutzung erlaubt ist (siehe `Herstellermaterial/00-INDEX.md`, Abschnitt 1).

## 1. Lokales Herstellermaterial

- In `Herstellermaterial/**` (3.121 Dateien) gibt es **keine einzige 3D-, CAD- oder ZIP-Datei** (gesucht: .glb .gltf .usdz .obj .fbx .3ds .dwg .dxf .skp .3dm .max .zip .stp .ifc .rfa). Die Dateien verteilen sich so: 1.888 JPG, 1.063 PDF, 71 PNG, 35 JPEG, 19 WebP, 4 EPS, 1 AI, 1 TSV, 1 TXT, 38 MD.
- **Maße** stehen lokal nur in Datenblatt-PDFs. Je Marke ist das in `sources.json → marken.<Marke>.lokal.datenblaetterMitMassen` erfasst, mit Beispielpfaden: Tuuci 246, Bullfrog 195, Frost 169, ClassiCon 100, Umbrosa 55, Next125 47, Solpuri 45, Paola Lenti 23, Heatsail 18, Tonon 18, Gloster 16, Tom Dixon 13. Ob ein Dateiname auf ein Datenblatt hindeutet, wurde per Muster (tech/data/sheet/scheda/spec …) erkannt. Die Maße selbst wurden nicht aus den PDFs extrahiert.
- In den `QUELLEN.md` der Marken waren 3D-Angebote bisher **nur als Link** notiert (ClassiCon, Eichholtz, Frost, Sifas, Tonon, Quasar, Tom Dixon, Solpuri). Heruntergeladen wurde nichts.

## 2. Backoffice (Produkte New, nur GET)

- Abgefragt wurden `marken.api.marken_data` sowie je Marke `get_produkte_by_marke_api` und je Produkt `get_produkt_by_path_field_api` (1.760 Abrufe). Für das erste Produktbild jedes Produkts wurde zusätzlich per Range-Request (64 KB) die Bildgröße gelesen.
- **3D-Feld:** `pdf_produkte[]` hat bereits ein Feld `3d`, das aber bei **allen 662 Einträgen `null`** ist. Es eignet sich als Anker für den Doctype-Vorschlag in `ar-viewer.md`.
- **Maße:** In `additional_information[].dimensions` (Freitext) gibt es bei 957 Produkten einen Eintrag. Verwertbar, also mit mindestens zwei Zahlen, sind davon 721. Weitere Maße stehen nur im Beschreibungstext (z. B. Minotti „176 × 103 × 90 cm“, bei 279 von 487 Produkten). Bei ClassiCon (115×) und Rimadesio (61×) steht im Feld nur „siehe Maßzeichnung/Datenblatt“. **Ein strukturiertes Maßfeld (B/T/H in cm) fehlt.** Die Maße im Freitext sind nicht einheitlich: Sifas in Zoll, Treca „Länge 120 bis …“, Eichholtz mit Sitzhöhe usw.
- **Bilder:** 1.608 der 1.760 Produkte haben ein Bild. Die mittlere Kantenlänge des ersten Bildes liegt je Marke zwischen 690 px (Heatsail) und 6.000 px (Alonpi). Mit 1.600 px oder mehr: Minotti 474/487, ClassiCon 123, Flos 134, Treca 82, Desalto 49. **Zu klein für eine Foto-Karte in AR** (unter 1.000 px): Paola Lenti (720 px), Poliform (meist 960–989 px), Heatsail (690 px), Quasar (768 px). Ein Bild von Rimadesio liefert 404.
- **Ohne Bild:** Brand van Egmond (111, hat aber Maße), Next125 (13), Quasar (13), Minotti 4, Flos 4, Poliform 3, Rimadesio 2, ClassiCon 1, Umbrosa 1.

## 3. Hersteller-Websites (ohne Login, nur lesend)

| Marke | 3D öffentlich? | Formate | Beleg | Hinweis |
|---|---|---|---|---|
| Minotti | **ja**, ZIP je Produktseite | Revit RFA, PDF-Ansichten | https://www.minotti.com/en/connery → `/downloads/16945/17881/MINOTTI_Connery.zip` (353 MB, 178 RFA, Maße im Dateinamen, z. B. „Sofa_Flap_cm313x102 h88“) | Auf 314 von 421 gefundenen Produktseiten. Der Inhalt ist unterschiedlich: Connery, Drake und Allen enthalten RFA, **Jeff nur PDF + Texturen**. DWG/3DS liegen in der Download Area (Login). Für RFA → GLB braucht man Revit (FBX-Export) oder einen Konverter. Nutzung **nur mit schriftlicher Zustimmung**. |
| ClassiCon | **ja**, 96 ZIPs | 3DS, DWG, DXF | https://www.classicon.com/en/2d-3d-data.html (Stichprobe AIXIA: 3DS + DWG) | 79 Produkte über den Namen zugeordnet. Einzige Marke mit belegtem Händlereintrag. |
| Flos | **ja**, Planning Aids | FBX, OBJ, 3DS, 3DM, C4D, DXF | https://professional.flos.com/en/global/product-downloads/planning-aids/ (Arco-3D.zip, 19 MB) | Laut Seite 2.328 Dateien. Nur die erste Seite ist ohne Skript lesbar, daher sind erst 2 Produkte zugeordnet. Die übrigen im Browser zuordnen. |
| Poliform | **ja, nach Formular-Registrierung** (kein Händler-Login) | FBX, OBJ, MAX, SKP, 3DM, DWG | https://www.poliform.it/en/products/sofas/bristol/ | Das Formular muss das Team selbst ausfüllen (danach 30 Tage Zugriff). Die Terms erlauben nur „personal and non-commercial use“, daher ist eine Freigabe nötig. |
| Sifas | **ja**, ZIP je Produkt | OBJ+MTL, SKP | https://sifas.com/medias/3D/Coco/COCOSFP.zip (3,4 MB) | Nur als Stichprobe geprüft. Muster `sifas.com/medias/3D/<Kollektion>/…zip`. |
| Eichholtz | auf Anfrage | 3DS | https://www.eichholtz.com/en/services | „3DS FILES – A curated selection“, kein Direktlink. Alle 150 Produkte haben Bild und Maße (Stufe B). |
| Tuuci | nur Konfigurator | Export SKP/Revit | https://www.tuuci.com/shadestudio/ | Konto nötig. 246 lokale Datenblätter mit Maßen. |
| Solpuri | nur Konfigurator | – | https://planer.solpuri.com/ | – |
| Rimadesio | Login | – | Knopf „2D/3D“ → https://www.rimadesio.it/en/reserved-area | – |
| Brand van Egmond | Login | – | https://brandvanegmond.com/downloads („2D and 3D models“) | – |
| Paola Lenti, Desalto, Quasar (pCon), Next125/Schüller (Extranet), Agape, EMU, Tom Dixon (bimobject/VOCAST) | Login/Konto | – | siehe `sources.json` | – |
| Frost, Tonon | ja (laut QUELLEN.md) | Revit/DWG bzw. 3DM | QUELLEN.md | Keine Produkte im Katalog. |
| 101 Copenhagen, Treca, Alonpi, Livintwist, Baobab, Heatsail, Umbrosa | nicht gefunden | – | Website + QUELLEN.md | – |

Drittanbieter (3dsky, designconnected, cgtrader, greatcatalog, 3dcadbrowser) bieten Modelle von Minotti, Flos, Poliform und Paola Lenti an, meist gegen Bezahlung und von Dritten modelliert. Sie gelten hier **nur als Hinweis**: Maße und Rechte sind nicht vom Hersteller, daher **nicht verwenden**.

## 4. Je Marke

Spalten: Produkte im Katalog · 3D-Status · A · A′ · B · C · D (kein Bild) · Produkte mit Maßen · mittlere Bildkante des ersten Bildes · lokale Datenblätter.

| Marke | Prod. | 3D-Status | A | A′ | B | C | D | Maße | px | DB lokal |
|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Minotti | 487 | öffentlich | 314 | 173 | 0 | 0 | 0 | 279 | 1920 | 0 |
| Eichholtz | 150 | auf Anfrage | 0 | 0 | 150 | 0 | 0 | 150 | 1200 | 0 |
| Flos | 139 | öffentlich | 2 | 137 | 0 | 0 | 0 | 114 | 2000 | 0 |
| ClassiCon | 126 | öffentlich | 79 | 47 | 0 | 0 | 0 | 15 | 2400 | 100 |
| Brand van Egmond | 111 | nur Login | 0 | 0 | 0 | 0 | 111 | 111 | – | 0 |
| Poliform | 103 | öffentlich nach Formular | 0 | 103 | 0 | 0 | 0 | 0 | 989 | 3 |
| Paola Lenti | 100 | nur Login | 0 | 0 | 5 | 95 | 0 | 5 | 720 | 23 |
| Treca | 96 | nicht gefunden | 0 | 0 | 86 | 10 | 0 | 86 | 1829 | 0 |
| Rimadesio | 63 | nur Login | 0 | 0 | 7 | 54 | 2 | 7 | 1836 | 0 |
| 101 Copenhagen | 62 | nicht gefunden | 0 | 0 | 59 | 3 | 0 | 59 | 2000 | 0 |
| Solpuri | 59 | nur Konfigurator | 0 | 0 | 55 | 4 | 0 | 55 | 1200 | 45 |
| Sifas | 59 | öffentlich | 0 | 59 | 0 | 0 | 0 | 59 | 1500 | 0 |
| Desalto | 50 | nur Login | 0 | 0 | 50 | 0 | 0 | 50 | 1620 | 1 |
| Schüller | 29 | nur Login | 0 | 0 | 0 | 29 | 0 | 0 | 1556 | 2 |
| Baobab | 24 | nicht gefunden | 0 | 0 | 20 | 4 | 0 | 20 | 1750 | 1 |
| Alonpi | 23 | nicht gefunden | 0 | 0 | 23 | 0 | 0 | 23 | 6000 | 0 |
| Umbrosa | 16 | nicht gefunden | 0 | 0 | 0 | 15 | 1 | 1 | 2000 | 55 |
| Tuuci | 15 | nur Konfigurator | 0 | 0 | 15 | 0 | 0 | 15 | 1000 | 246 |
| Quasar | 14 | nur Login | 0 | 0 | 0 | 1 | 13 | 0 | 768 | 0 |
| Next125 | 13 | nur Login | 0 | 0 | 0 | 0 | 13 | 0 | – | 47 |
| Heatsail | 12 | nicht gefunden | 0 | 0 | 8 | 4 | 0 | 8 | 690 | 18 |
| Livintwist | 9 | nicht gefunden | 0 | 0 | 7 | 2 | 0 | 7 | 1280 | 0 |

Ohne Produkte im Katalog sind Bullfrog, Bombyxx, EMU, Trapa, Pomax, Frost, Lambert, Tom Dixon, Papadatos, Qeeboo, Tonon, Gloster, Antoniolupi und Agape. Ihr Status steht trotzdem in `sources.json`.

## 5. Nächste Schritte (Reihenfolge nach Wirkung)

1. **Freigaben einholen** bei Minotti, ClassiCon, Flos, Poliform und Sifas. Ohne Freigabe bleibt alles intern bzw. in den Labs (noindex). ClassiCon zuerst, weil dort der Händlereintrag belegt ist.
2. **Pipeline A:** ZIP holen, CAD in Blender importieren (3DS/FBX/OBJ; RFA erst über Revit nach FBX), auf 1 Einheit = 1 m normieren, nach GLB exportieren, mit `gltf-transform` (Draco) optimieren. Danach Eintrag in `.data/ar-viewer/models.json` (siehe `ar-viewer.md`). Die Maße kommen dann aus dem Modell und werden gegen das Hersteller-Datenblatt geprüft.
3. **Zuordnung A′ abschließen:** Flos-Planning-Aids im Browser je Produkt abgleichen, Poliform-Formular ausfüllen, Minotti-Seiten der übrigen 173 Produkte prüfen (Namensabweichungen; 66 Namen ohne eigene Seite).
4. **Stufe B (AR-Foto-Karte):** freigestelltes Produktbild als Ebene in Originalgröße, mit Maßen aus `additional_information`. **Minotti verbietet die Veränderung von Bildern.** Freistellungen von Minotti-Bildern deshalb nur intern bzw. in den Labs und im Rechte-Register vermerken. Bilder unter 1.000 px (Paola Lenti, Poliform, Heatsail, Quasar) reichen für eine Karte nicht.
5. **Backoffice:** ein strukturiertes Feld `masse_cm {b,t,h}` mit `masse_quelle` (URL) ergänzen und `pdf_produkte.3d` füllen. Bis dahin gilt: **Maße nur mit Hersteller-URL anzeigen, sonst als fehlend kennzeichnen.** Maße aus dem Freitext sind keine geprüfte Quelle.

## Methode und Grenzen

- Alle Zugriffe waren nur lesend (GET, HEAD, Range). ZIP-Inhalte wurden nur über das zentrale Verzeichnis gelesen (Range-Request auf das Dateiende), nichts wurde entpackt oder ausgeführt. Login-Bereiche wurden weder betreten noch umgangen. Ein Versuch, die Flos-Liste seitenweise auszulesen, wurde abgebrochen.
- Maße wurden per Muster erkannt: mindestens zwei Zahlen im Feld `dimensions`, „a × b (× c)“ im Text, oder mindestens zwei beschriftete Maße. Fehltreffer sind möglich, z. B. bei Kissenmaßen.
- Die Zuordnung Produkt → 3D-Datei erfolgte über den Produktnamen (Slug). Vor der Verwendung muss sie manuell geprüft werden.
- Skripte (nicht im Repo): Scratchpad `inv-scripts/details.mjs`, `dims.mjs`, `minotti.mjs`, `ziplist.mjs`, `classify.mjs`.
