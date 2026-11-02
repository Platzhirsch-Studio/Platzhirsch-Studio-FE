# 03 – Bauplan: Produktpräsentation, 3D und AR

**Stand:** 26.10.2026 · **Rolle:** digitale Produktpräsentation (Galerie, Zoom, 360°, 3D, AR, Material, Maße, Shop the Look)
**Grundlage:** Code in `src/` (nur gelesen, nicht geändert), Live-Abfrage aller **1.765 aktiven Produkte** über die öffentliche Backoffice-API `get_produkt_by_path_field_api` (26.10.2026), Berichte 13, 15, 23, 25, Web-Recherche (Quellen am Ende).
**Abgrenzung:** KI-Raumplaner und GPU-Bildwerkstatt stehen in `06-ki-raumplaner-gpu.md`, das Designsystem in `01-luxus-design-ux.md`. Hier geht es um die **Produktseite** und die **3D-Pipeline**.

> **Leitplanke aus dem Masterkonzept (23, Abschnitt 9, und 15):** Ein *eigener* 3D/AR-Konfigurator kommt „nicht jetzt“ (20–80 T€, Wirkung unbelegt, Bildrechte offen). Dieser Bauplan hält sich daran: **kein Konfigurator, keine Eigenentwicklung von 3D-Modellen in der Breite.** Gebaut wird (a) was mit vorhandenen Daten sofort geht, (b) ein kleiner AR-Pilot mit **Herstellerdateien oder eigenen Aufnahmen** und nur mit **schriftlicher Freigabe**, (c) Präsentation mit **eigenen Fotos** aus dem Showroom, die keine Markenrechte berühren.

---

## 1. Ist-Zustand im Code

### 1.1 Produktseite

| Baustein | Datei | Befund |
|---|---|---|
| Seite | `src/app/[locale]/produkte/[category]/[product]/page.js` | Server-Komponente, ISR über `generateStaticParams` (alle Pfade, 4 Sprachen). Reihenfolge: Galerie + Info/CTA → Tabs → Kollektions-Slider → Marke/Designer → „Das könnte Ihnen gefallen“. |
| Datenmapping | `src/lib/shop/shopProducts.js` → `toShopProductDetail()` | Übernimmt **nur** `bild_anhangen` (Pfade), Beschreibung, `additional_information[0]` (Maße, Material, Farbe, Gewicht). **`pdf_produkte` wird verworfen**, ebenso `imageName` je Bild und `bannerbild`. |
| Galerie | `src/components/ShopCatalog/productGallery.js` | `react-slick` 0.31 + `slick-carousel` (CSS), Thumbnail-Leiste, eigenes Lightbox-Overlay. Zoom = Klick auf festes `scale-[2]`, Pan per Mausbewegung. **Kein Pinch-Zoom auf dem Handy**, kein Doppeltipp, kein Fokus-Trap im Dialog, ARIA-Texte nur Englisch („Previous image“), Alt-Text für alle Bilder identisch (`Marke Name`). Kein Video, kein 3D-Slot. |
| Maße | `src/components/ShopCatalog/dimensionDiagram.js` | Schematisches SVG (Rechteck/Kreis) aus Freitext `"Width: 242 cm · …"`, ausdrücklich **nicht maßstäblich**. Nur Breite/Höhe, keine Tiefe, keine Drauf-/Seitenansicht. |
| Tabs | `src/components/ShopCatalog/productInfoTabs.js` | Beschreibung, Maße, Material & Pflege, Konfigurationen (`configurations={null}` – nie befüllt). **Kein Download-Tab.** |
| Aktionen | `src/components/ShopCatalog/productActions.js`, `wishlistHeart.js`, `src/context/CartContext.js` | Beratung anfragen (Wizard mit Vorbelegung), Merkliste, Anruf. Kein „Muster anfordern“, kein „Planungsdaten anfordern“. |
| JSON-LD | `src/lib/seo/structuredData.js` → `productSchema()` | `Product` mit `image[]`, `brand`, `material`, `color`, `sku`. Kein `offers` (keine Preise), kein `subjectOf` (3D/Video), keine Bildlizenz-Angaben (`ImageObject.license/creator`). |
| Datei-Proxy | `src/app/cmx/[...path]/route.js` | Erlaubt **nur** Bild-, Video- und PDF-Endungen. `.glb`, `.usdz`, `.dwg`, `.zip` würden 404 liefern – muss für 3D erweitert werden (inkl. korrekter MIME-Typen, für Quick Look Pflicht: `model/vnd.usdz+zip`). |
| Bild-Pipeline | `next.config.js` | `next/image` mit AVIF/WebP, 30 Tage Cache, gute Basis. `Permissions-Policy` setzt `camera=()` – betrifft Scene Viewer/Quick Look nicht (native Apps), **WebXR im Browser** bräuchte ggf. `xr-spatial-tracking=(self)`. |
| Tracking | `src/lib/analytics.js` (neu) | `trackEvent`/`trackLead` mit Consent Mode v2. Noch keine Events für Galerie, Zoom, 3D, AR, Downloads. |
| Bibliotheken | `package.json` | Kein 3D-Paket. `react-slick` zusätzlich in `Home/about.js`, `MarkenItems/markenitems.js`, `UberUns/austellung.js`. |

### 1.2 Was im Backoffice wirklich steckt (Live-Scan aller 1.765 Produkte, 26.10.2026)

| Kennzahl | Wert | Bedeutung |
|---|---|---|
| Bilder gesamt | **15.017** (Ø 8,5 je Produkt) | Sehr gute Basis für Galerie/Zoom. Formate: ca. 66 % WebP, 33 % JPG, 1 % PNG. |
| Produkte **ohne Bild** | **152** (davon Brand van Egmond 111 von 111, Next125 13 von 13) | Zeigen heute das Fallback-Banner – schwächste Seiten des Katalogs. |
| Produkte mit nur 1 Bild | 51 | Keine Galerie, kein Thumbnail-Strip. |
| `pdf_produkte` – Feld **`2d`** befüllt | **426** (ClassiCon 194, Eichholtz 150, Rimadesio 42, Flos 40) | Inhalt sind **Datenblätter/Anleitungen als PDF**, keine CAD-Zeichnungen. **Wird nirgends angezeigt.** |
| `pdf_produkte` – Feld **`katalog`** befüllt | **415** (PDF) | Kataloge/Broschüren, z. B. ClassiCon „Original vs. Plagiat“. **Wird nirgends angezeigt.** |
| `pdf_produkte` – Feld **`3d`** befüllt | **0** | Das Feld existiert schon – **kein neues Backoffice-Feld nötig**, nur Befüllung. |
| Produkte mit Maßangabe | **961** von 1.765 | Aber: **Minotti 2 von 487**, **Poliform 0 von 103**, **Paola Lenti 0 von 100**, Umbrosa 0. Genau die Umsatzmarken haben keine Maße. |

**Kernbefund:** Die Präsentation ist bei Bildern schon breiter als bei jedem regionalen Händler. Die größten Lücken sind (1) **841 vorhandene PDFs, die niemand sieht**, (2) **fehlende Maße bei Minotti/Poliform/Paola Lenti**, (3) ein Galerie-Zoom, der auf dem Handy (Hauptgerät für Möbelsuche) nicht funktioniert, (4) kein Ort für 3D/AR/Video.

---

## 2. Benchmark

### 2.1 Was die Besten weltweit machen

| Anbieter | Was sie zeigen | Lehre für Platzhirsch |
|---|---|---|
| **Minotti** (minotti.com, Produkt „Andersen“ geprüft) | Pro Produkt: technisches Datenblatt (PDF), **2D-Datei `ANDERSEN.DWG`**, **zwei 3D-Dateien** (Varianten „Seat H37“, „Daybed“; Format auf der Seite nicht ausgewiesen), Konsumentenkatalog, Bilder in niedriger Auflösung. Login-Bereich „Download Area“ für Händler und Architekten. **Kein** 3D-Viewer, **kein** AR, **kein** Konfigurator, **keine** Stoffmuster-Ansicht (nur Text + „World of Materials“). | Die Marke selbst zeigt kein 3D/AR. Wer es als Erster in der Region zeigt, hat ein echtes Erlebnis-Plus. Die 3D-Daten existieren – Zugang über Händler-/Architektenkonto bzw. Anfrage. |
| **Poliform** (poliform.it) | Konsumentenkataloge als PDF, „Reserved Area“ (`b2b.poliform.it`) für Fachhandel. Auf der Startseite kein 3D/AR/Konfigurator sichtbar. | 3D-Daten nur über B2B-Zugang → ohne Händlerstatus voraussichtlich nicht erhältlich. |
| **Flos** (professional.flos.com) | Eigene „Professional Space“ mit Download-Bereich: **„2D / 3D files (355)“**, Kataloge, Zertifikate, DIALux-Plug-in, Energielabel. Konfiguratoren für Schienensysteme. | Für Leuchten sind offizielle 3D-Dateien öffentlich gelistet – **bester Kandidat für einen AR-Piloten** (Leuchten haben einfache Geometrie, AR „Leuchte über dem Esstisch“ ist ein starker Anwendungsfall). Nutzungsbedingungen prüfen. |
| **ClassiCon** (classicon.com) | Bietet laut eigener Seite 2D-Daten (PDF, DWG, IGS) und 3D-Daten (3DS, DWG) für **Händler, Architekten, Presse**. | **Platzhirsch ist offizieller ClassiCon-Händler** → realistisch der **erste Lieferant freigegebener 3D-Dateien** (Eileen Gray E 1027, Bibendum). |
| **Vitra** | AR-Symbol im Konfigurator, auf dem Desktop QR-Code → Handy scannt Boden → Produkt in Originalgröße platzieren. | Exakt das Muster, das wir mit `model-viewer` + QR ohne App nachbauen können. |
| **IKEA Kreativ, Wayfair, Houzz** | Raum-Scan, Produkt in Originalgröße im Raum, Fotos des eigenen Raums. Houzz berichtet höhere Kaufwahrscheinlichkeit bei AR-Nutzern (Anbieterangabe). | Wirkungszahlen stammen von Anbietern selbst; die oft zitierten „+94 % Conversion mit 3D“ (Shopify) sind **nicht primär belegt**. Darum: Pilot mit Messung statt Großprojekt. |
| **RH, The Conran Shop, AmbienteDirect, Connox** | Große, ruhige Bildwelten, Raum-Szenen, Varianten-/Farbauswahl mit Bildwechsel, Stoffmuster bestellbar (RH), Datenblätter. (RH-Seiten blockten den Abruf mit 403; AR bei Connox/AmbienteDirect **nicht verifiziert**.) | Standard im Premium-E-Commerce: Varianten sichtbar machen, Muster anbieten, Raum-Kontext zeigen. |

### 2.2 Regionale Wettbewerber

| Wettbewerber | Produktpräsentation online |
|---|---|
| **Höttges / Die Einrichter** (hoettges.at, geprüft) | Service-Website ohne Produktseiten: ca. 15 Bilder (Projekte, Team, Markenlogos Minotti/Poliform/Edra), keine Galerie je Produkt, kein Zoom, keine Downloads außer AGB, kein 3D/AR, keine Preise. Termin per E-Mail. |
| **reiter design, Dolce Vita, Hutle, Fretz** | Domains bei der Prüfung nicht erreichbar (DNS/Timeout). Laut 20/23: Dolce Vita „online fast unsichtbar“, Fretz wirbt um CH-Kunden. **Keiner** der in 16/20 geprüften Händler hat Produktseiten mit Maßen, Downloads oder 3D. |

**Fazit:** Gegen die Region reicht schon **Stufe 1** (Galerie 2.0, Downloads, Maße, eigene Raum-Szenen), um uneinholbar vorne zu sein. 3D/AR ist das Sahnehäubchen für Medien, Instagram und Architekten – nicht der Haupthebel.

---

## 3. Konzept / Zielbild

**Ein Satz:** *Jede Produktseite beantwortet ohne Besuch die drei Fragen „Wie sieht es aus der Nähe aus?“, „Passt es in meinen Raum?“ und „Woraus ist es und in welchen Ausführungen?“ – und führt dann zu Termin, Muster oder Planungsdaten.*

### Medienleiter je Produkt (von „immer“ bis „Pilot“)

| Stufe | Medium | Abdeckung | Quelle der Inhalte | Rechte |
|---|---|---|---|---|
| A | Galerie mit Pinch-Zoom, Vollbild, sprechenden Alt-Texten | alle 1.613 Produkte mit Bild | Backoffice `bild_anhangen` | wie heute (Herstellerbilder – Freigabe klären, s. Risiken) |
| B | Downloads: Datenblatt, Katalog, Pflege | 426 + 415 PDFs sofort | Backoffice `pdf_produkte` | PDFs der Hersteller, öffentlich verteilt |
| C | Maße: maßstäbliche Drei-Ansicht + „Passt es?“-Check | 961 sofort, Minotti/Poliform nachpflegen | `additional_information.dimensions` | unkritisch |
| D | Raum-Szenen „Shop the Look“ aus dem **eigenen Showroom** | 20–40 Szenen | eigene Fotos (800 m²) | **eigene Rechte** |
| E | 360°-Dreh für Ausstellungsstücke/Atelierverkauf | 20–50 Stücke | eigene Drehteller-Fotos | **eigene Rechte** |
| F | 3D-Viewer + AR „im eigenen Raum“ | Pilot 10–20 Produkte | Herstellerdateien (ClassiCon, Flos) oder eigene Fotogrammetrie | **nur mit schriftlicher Freigabe** |
| G | Material-/Stoffwelt + „Muster anfordern“ | Top-Marken | eigene Musterfotos, Herstellerkarten | eigene Fotos unkritisch |

### Architektur-Prinzip „wenig Pflege“

- **Ein Medien-Manifest pro Produkt**, nicht pro Seite: Bis das Backoffice Felder hat, liegt eine kleine Datei im Repo (`src/lib/data/productMedia.js`, Schlüssel `path_field`) mit 3D-, 360°- und Szenen-Verweisen. Gleiches Muster wie `staticShopProducts.js`/`importedProducts/`. Später 1:1 in Backoffice-Felder umziehen (`pdf_produkte.3d` existiert schon).
- **Alles Schwere lädt erst auf Klick**: Poster-Bild im ersten Paint, `model-viewer`/360° über `next/dynamic(..., { ssr: false })` in einer Client-Komponente (laut `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` ist `ssr: false` nur in Client Components erlaubt). Kein Einfluss auf LCP der 1.765 Seiten.
- **Keine Drittanbieter-Plattform mit Abo** (Threekit, Emersya, Roomle): zu teuer und Pflege bei Externen. Offene Standards (glTF/GLB, USDZ) und Open-Source-Viewer.

---

## 4. Konkrete Features

Legende Aufwand: **S** ≤ 3 Personentage · **M** 1–3 Wochen · **L** > 3 Wochen.

### F1 – Download-Tab „Datenblätter & Kataloge“ (sofort, ohne Backoffice)

- **Nutzen Umsatz:** Architekten, Planer und Hotels (Abschnitt 8 in 23) erwarten Datenblätter; heute müssen sie zum Hersteller abwandern. 841 PDFs liegen bereits bereit. Jeder Download ist ein Kaufsignal → Event `file_download` (GA4-Standardname) mit `brand`, `product`, `file_type`.
- **Nutzen Ranking:** Mehr Inhaltstiefe pro Produktseite (H1 im SEO-Plan „Downloads“ ausdrücklich gefordert); PDFs selbst werden indexiert und verlinken zurück. ClassiCon-Broschüre „Original vs. Plagiat“ ist zugleich ein Vertrauens-Argument (offizieller Händler).
- **Umsetzung:** `toShopProductDetail()` liest `pdf_produkte` zusätzlich aus (`2d` → „Produktdatenblatt“, `katalog` → „Katalog/Broschüre“, `3d` → später). Neuer Tab in `productInfoTabs.js` mit Dateiname, Typ, Größe (optional per HEAD). Links laufen über `/cmx/files/…` (PDF bereits erlaubt). Daneben Knopf **„CAD-/3D-Daten anfragen“** → Beratungs-Wizard mit Vorbelegung `?anliegen=planungsdaten&produkt=…` (Lead statt Weiterverteilung fremder DWGs).
- **Aufwand:** S · **Abhängigkeiten:** keine · **Bibliotheken:** keine.
- **Dateien:** `src/lib/shop/shopProducts.js`, `src/components/ShopCatalog/productInfoTabs.js`, `src/app/[locale]/produkte/[category]/[product]/page.js`, `src/messages/*.json` (Labels), `src/lib/analytics.js` (`trackDownload`).

### F2 – Galerie 2.0 mit echtem Zoom (sofort, ohne Backoffice)

- **Nutzen:** Mobiler Pinch-Zoom auf Nähte, Stoffe, Holz – das, was Premium von Möbelhaus unterscheidet. Weniger Absprünge; Grundlage für Video/3D/360° als zusätzliche „Slides“.
- **Umsetzung:**
  - `react-slick` auf der Produktseite durch **Embla** ersetzen (leichter, Touch-nativ, ohne jQuery-Erbe und ohne den SSR-Workaround `thumbsMounted`). Lightbox durch **Yet Another React Lightbox** mit Plugins `Zoom` (Pinch, Doppeltipp, Mausrad), `Thumbnails`, `Fullscreen`, `Video`, `Captions`.
  - Alt-Text je Bild aus `imageName` (z. B. „Andersen 2“) + Marke/Kategorie, lokalisiert; ARIA-Labels in 4 Sprachen.
  - Für die Vollbild-Ansicht `next/image` mit `sizes="100vw"` und `quality={90}` (in `next.config.js` bereits freigegeben), damit der Zoom nicht auf ein 1080-px-Bild vergrößert.
  - Medien-Typ-Slots vorbereiten: `image | video | model3d | spin360` – der 3D-Slot zeigt nur ein Poster mit „3D / In Ihrem Raum“-Badge.
  - Events: `gallery_zoom`, `gallery_fullscreen`.
- **Aufwand:** M (S, wenn nur Lightbox getauscht wird) · **Abhängigkeiten:** keine.
- **Dateien:** `src/components/ShopCatalog/productGallery.js` (neu schreiben), ggf. `src/components/ShopCatalog/galleryLightbox.js` (neu). `react-slick` bleibt für die drei anderen Komponenten, bis diese ebenfalls umziehen (dann `slick-carousel`-CSS ganz entfernen).

| Bibliothek | Version | Lizenz | Größe (min / gzip) | Rolle |
|---|---|---|---|---|
| `embla-carousel-react` | 8.6.0 | MIT | 18 KB / 7 KB | Haupt- und Thumbnail-Slider |
| `yet-another-react-lightbox` | 3.32.2 | MIT | 31 KB / 12 KB (Kern, Plugins einzeln) | Lightbox, Zoom, Video, Vollbild |
| Alternative: `photoswipe` | 5.4.4 | MIT | 58 KB / 17 KB | wenn Vanilla-Lösung gewünscht; letzte Version Mai 2024 |
| Alternative: `react-zoom-pan-pinch` | 4.2.0 | MIT | 51 KB / 15 KB | nur Zoom, falls eigene Lightbox bleibt |
| zum Vergleich heute: `react-slick` | 0.31.0 | MIT | 60 KB / 15 KB + slick-CSS | wird auf der Produktseite ersetzt |

### F3 – Maßzeichnung 2.0 und „Passt es in meinen Raum?“

- **Nutzen:** „Passt es?“ ist der Hauptgrund, warum Kunden vor dem Kauf anrufen oder nicht kaufen. Maße sind Long-Tail-SEO („Minotti Andersen Maße“) und Pflicht für Architekten. Kein regionaler Händler bietet das.
- **Umsetzung (Stufe 1, sofort):**
  - `parseDimensions()` robuster machen (DE/IT/FR-Bezeichner „Breite/Larghezza/Largeur“, „B × T × H“, mm, Bereiche „160–320“, mehrere Varianten).
  - `DimensionDiagram` als **maßstäbliche** Drei-Ansicht (Front, Seite, Draufsicht) mit gemeinsamem Maßstab, Sitzhöhe als Hilfslinie, **Mensch-Silhouette 175 cm** als Größenvergleich.
  - Mini-Rechner „Passt es?“: Eingabe Raumbreite/Türbreite/Treppenhaus → Ampel (Lieferweg ist bei Sofas ab 240 cm ein echtes Thema). Alles clientseitig, keine Daten gespeichert.
  - Druck-/PDF-Ansicht 1:20 per CSS-Print (kein Paket nötig).
  - `additionalProperty` für Breite/Tiefe/Höhe im JSON-LD (`QuantitativeValue`, `unitCode: CMT`) bzw. `width/depth/height` direkt am `Product`.
- **Stufe 2 (Datenlücke):** Maße für **Minotti (485 fehlen), Poliform (103), Paola Lenti (100)** nachpflegen. Ohne Backoffice-Zugang als Übergang: Repo-Datei `src/lib/data/dimensionsOverlay.js` (`path_field → "Width: … cm"`), befüllt aus den öffentlichen Technical Sheets der Hersteller (Minotti verlinkt sie je Produkt). Halbautomatisch: PDF-Text extrahieren, ein Mitarbeiter prüft – ca. 1–2 Min. je Produkt.
- **Aufwand:** M (Stufe 1), M (Datenpflege, ca. 15–20 Std.) · **Abhängigkeiten:** Backoffice nur für dauerhafte Ablage.
- **Dateien:** `src/components/ShopCatalog/dimensionDiagram.js`, `productInfoTabs.js`, `src/lib/seo/structuredData.js`, neu `src/components/ShopCatalog/fitCheck.js`, neu `src/lib/data/dimensionsOverlay.js`.
- **Bibliotheken:** keine (SVG von Hand).

### F4 – 3D-Viewer und AR „Sofa / Leuchte im eigenen Wohnzimmer“ (Pilot)

- **Nutzen Umsatz:** Erlebnis, das weder Händler noch Minotti selbst bieten → Gesprächsanlass, PR („erstes Einrichtungshaus am Bodensee mit AR“), Instagram-Reels. Messbar über `view_3d`, `ar_start` und Leads nach AR-Nutzung. Erwartung ehrlich: **indirekt**, Pilot entscheidet.
- **Nutzen Ranking:** gering direkt; indirekt über Verweildauer, Presse-Links, Bilder-Suche (Poster-Renderings).
- **Technikwahl: Google `<model-viewer>` statt three.js/react-three-fiber.**

| Kriterium | `@google/model-viewer` 4.4.0 | `three` 0.186.1 + `@react-three/fiber` 9.8.2 + `@react-three/drei` 10.7.9 |
|---|---|---|
| Lizenz | Apache-2.0 | MIT / MIT / MIT |
| Größe (bundlephobia) | 230 KB min / **71 KB gzip** zzgl. `three` (≈ 181 KB gzip) → **≈ 250 KB gzip gesamt**, nur bei Klick geladen | three 181 KB + R3F 56 KB + drei (tree-shakebar, voll 509 KB) → **≈ 260–350 KB gzip** |
| AR | **eingebaut**: `ar-modes="webxr scene-viewer quick-look"`, iOS Quick Look (auch automatischer USDZ-Export aus GLB), Android Scene Viewer, WebXR | selbst bauen (WebXR-Session, Hit-Test, kein Quick Look ohne eigenes USDZ) |
| Varianten (Stoffe) | `KHR_materials_variants` über `variant-name` | selbst bauen |
| Pflege | Web-Component, Attribute statt Code | React-Code, Shader, Updates |
| Wann sinnvoll | **Produktseite, AR** | eigener Raumplaner/Konfigurator – laut 23 „nicht jetzt“ |

- **Umsetzung:**
  - Neue Client-Komponente `src/components/ShopCatalog/productModelViewer.js`, geladen per `next/dynamic(..., { ssr: false })`. Im Server-HTML nur Poster (AVIF) mit Badge „3D ansehen · In Ihrem Raum“.
  - Attribute: `ar`, `ar-modes="webxr scene-viewer quick-look"`, **`ar-scale="fixed"`** (Kunde darf das Sofa nicht kleiner ziehen – sonst ist „passt es?“ wertlos), `ar-placement="floor"` (Wandleuchten/Spiegel: `wall`), `ios-src` mit eigener optimierter USDZ, `camera-controls`, `touch-action="pan-y"`, `loading="lazy"`, `reveal="interaction"`.
  - **Decoder selbst hosten** (Draco/Meshopt/KTX2 lädt `model-viewer` sonst von `www.gstatic.com` → IP-Übertragung an Google ohne Einwilligung, DSGVO-Thema). Pfade über `ModelViewerElement.dracoDecoderLocation`, `.ktx2TranscoderLocation`, `.meshoptDecoderLocation`.
  - Desktop: QR-Code „Auf dem Handy in AR öffnen“, **serverseitig** als SVG erzeugt (`qrcode` 1.5.4, MIT, 24 KB / 9 KB gzip – landet nicht im Client-Bundle).
  - `src/app/cmx/[...path]/route.js`: Endungen `glb` (`model/gltf-binary`), `usdz` (`model/vnd.usdz+zip`) ergänzen, sobald Dateien aus dem Backoffice kommen; alternativ statisch unter `public/3d/` bzw. CDN-Bucket.
  - JSON-LD: `Product.subjectOf: { "@type": "3DModel", encodingFormat: "model/gltf-binary", contentUrl }`.
  - Events: `view_3d`, `ar_start` (model-viewer-Event `ar-status`), `ar_lead` (Lead innerhalb 30 Min. nach AR).
- **Pilot-Auswahl (10–20 Produkte, nach Rechtelage sortiert):**
  1. **ClassiCon** (offizieller Händler, 3DS/DWG laut ClassiCon für Händler verfügbar): E 1027, Bibendum, Day Bed.
  2. **Flos** (öffentlicher Bereich „2D/3D files (355)“): 4–6 Pendel- und Stehleuchten – AR „über dem Esstisch“.
  3. **Tuuci/Umbrosa** Sonnenschirme – AR im Garten/auf der Terrasse ist der überzeugendste Outdoor-Fall (Größe 3–4 m kann man sich nicht vorstellen). 3D-Quelle offen, beim Hersteller anfragen.
  4. **Minotti** 2–3 Bestseller (Andersen, Lawrence, Connery) **erst nach** schriftlicher Freigabe im Minotti-Gespräch (15: Bildrechte im selben Termin klären).
  5. Eigene **Ausstellungsstücke** per Fotogrammetrie (siehe F8), weil dort Rechte und Preis unkritisch sind.
- **Aufwand:** M (Komponente + Pipeline) + ca. 2–4 Std. Aufbereitung je Modell · **Abhängigkeiten:** **schriftliche Freigabe** je Marke zur Online-Darstellung der 3D-Daten; Herstellerdateien in brauchbarem Format (FBX/OBJ/3DS/GLB; reine `.max`/V-Ray-Dateien brauchen 3ds Max oder ein Export durch den Hersteller); Hosting für GLB/USDZ.
- **Dateien:** neu `src/components/ShopCatalog/productModelViewer.js`, neu `src/lib/data/productMedia.js`, `productGallery.js` (3D-Slot), `src/app/cmx/[...path]/route.js`, `src/lib/seo/structuredData.js`, `src/lib/analytics.js`, `next.config.js` (Cache-Header für `.glb/.usdz`, ggf. `Permissions-Policy: xr-spatial-tracking=(self)`).

### F5 – 3D-Pipeline auf dem eigenen Windows-PC (NVIDIA)

**Geprüfte Hardware:** NVIDIA **GeForce RTX 4060, 8 GB VRAM**, Treiber 610.88. Blender und glTF-Werkzeuge sind **noch nicht installiert**.

| Schritt | Werkzeug (Version, Lizenz) | GPU-Nutzen |
|---|---|---|
| Import Herstellerdatei (FBX/OBJ/3DS/DWG-3D) | **Blender 4.5 LTS oder neuer** (GPL-3.0, Prüfung der aktuellen Version bei Installation) | – |
| Aufräumen, Dezimieren auf ≤ 100 k Dreiecke (Sofa), ≤ 50 k (Leuchte) | Blender (Decimate, Remesh) | gering (CPU) |
| **Texturen backen**: V-Ray/Corona-Materialien → PBR (BaseColor, Normal, ORM) 2048 px | Blender **Cycles mit OptiX** | **hoch** – RTX 4060 backt 2K-Sets in Minuten statt Stunden |
| Poster-/Packshot-Renderings (weiß, 2000 px) und Detail-Renderings | Blender Cycles OptiX + OIDN-Denoiser | **hoch** |
| Export GLB + USDZ | Blender glTF-Exporter, Blender USD-Exporter (`.usdz`) – funktioniert unter Windows; Apple Reality Converter gibt es nur für macOS | – |
| Optimieren | **`@gltf-transform/cli` 4.5.1** (MIT): `gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress webp` bzw. KTX2 über **KTX-Software `toktx`** (Apache-2.0); alternativ **`gltfpack` 1.3.0** (MIT, meshoptimizer) | CPU; KTX2-Kodierung CPU |
| Prüfen | **Khronos glTF-Validator** (`gltf-validator` 2.0.0-dev.3.10, Apache-2.0), model-viewer Editor im Browser, echtes iPhone + Android | – |
| Fotogrammetrie eigener Stücke | **Meshroom/AliceVision** (MPL-2.0, braucht CUDA → RTX 4060 passt); RealityScan/RealityCapture nur nach Lizenzprüfung (Umsatzgrenzen) | **hoch** |

**Budgets je Modell:** GLB ≤ 3 MB (Ziel) / ≤ 6 MB (max.), USDZ ≤ 8 MB, Texturen 2048 px, 1 Material-Set je Variante. 8 GB VRAM reichen für Möbel-Einzelobjekte und 2K/4K-Backing problemlos; für große Raum-Renderings ggf. Kacheln/geringere Texturgröße.

**Arbeitszeit realistisch:** 2–4 Std. je Herstellermodell (Import, Bake, Export, Test), 4–6 Std. je Fotogrammetrie-Stück (60–150 Fotos, Drehteller). Ein Mitarbeiter mit Blender-Grundkenntnissen, Einarbeitung ca. 3–5 Tage.
- **Aufwand:** M (Einrichtung + erste 5 Modelle) · **Abhängigkeiten:** Rechte, Quelldateien · **Dateien:** keine im Website-Code; Skript-Ordner außerhalb `src/` (z. B. `tools/3d/optimize.ps1`).

### F6 – Raum-Szenen „Shop the Look“ aus dem eigenen Showroom

- **Nutzen Umsatz:** Verkauft Ensembles statt Einzelstücke (Sofa + Couchtisch + Leuchte + Teppich) → höherer Auftragswert. Passt zu „Shop the Room“ per QR im Showroom (23, Abschnitt 9): **dieselben Szenen** online und als QR-Schild an der Vignette.
- **Nutzen Ranking:** **Eigene, einzigartige Bilder** (Google Bilder, Discover, Pinterest) statt der Herstellerfotos, die jeder Händler hat. Szenenseiten verlinken intern auf 4–8 Produkte. Kein Bildrechte-Risiko gegenüber Marken (Fotograf-Rechte vertraglich übertragen lassen).
- **Umsetzung:** Szenen-Komponente mit Hotspots (Prozent-Koordinaten) → Mini-Karte (Bild, Marke, Name, Merkliste-Herz) → Produktseite. Knopf „Ganzen Look merken“ (alle Produkte in die Merkliste via `CartContext`) und „Diesen Look anfragen“ (Beratungs-Wizard mit Vorbelegung). Eingebunden auf Produktseite („So wirkt es bei uns in Lochau“), Markenseiten und Stadt-Landingpages (lokaler Bezug: „in der Ausstellung in Lochau zu sehen“ – gleichzeitig das vom SEO-Plan geforderte Ausstellungs-Signal).
- **Datenablage:** zuerst `src/lib/data/scenes.js` (id, Bild, Hotspots `{x,y,path_field}`), später Backoffice-Doctype „Szene“.
- **Aufwand:** M (Komponente S, Fotos + Hotspots ca. 1 Std./Szene) · **Abhängigkeiten:** Fotograf/eigene Fotos (vorhandene Showroom-Bilder sichten), Merkliste vorhanden.
- **Dateien:** neu `src/components/ShopCatalog/shopTheLook.js`, neu `src/lib/data/scenes.js`, `page.js` (Produkt), Markenseite `src/app/[locale]/ueber-uns/marken/[title]/page.js`, Stadt-Landingpages `src/app/[locale]/designermoebel-*`, `structuredData.js` (`ImageObject` mit `creator`, `copyrightHolder`, `license`).
- **Bibliotheken:** keine.

### F7 – 360°-Dreh für Ausstellungsstücke und Atelierverkauf

- **Nutzen:** Ausstellungsstücke sind Unikate mit **erlaubten echten Preisen** (Outlet, SEO-Plan H2) und **eigenen Fotos**. Ein 360°-Dreh ersetzt den Besuch zur Zustandsprüfung, besonders für CH/DE-Kunden. Schnellster Weg zu Online-Abverkauf (100–300 T€ Liquiditätsziel aus 23).
- **Umsetzung:** 24–36 Fotos auf Drehteller (oder Kreis um großes Sofa, Stativ, gleiche Höhe), als AVIF-Sequenz; Viewer = eigene kleine Komponente (Pointer-Drag wechselt Frame, Bilder progressiv nachladen, erstes Bild = Poster). Kein Paket nötig (≈ 2 KB eigener Code).
- **Aufwand:** S (Komponente) + 30–45 Min. Aufnahme je Stück · **Abhängigkeiten:** Outlet-Seite/Preisfeld für den vollen Nutzen (blockiert bis Backoffice-Preisfeld; bis dahin „Preis auf Anfrage“).
- **Dateien:** neu `src/components/ShopCatalog/spin360.js`, `src/lib/data/productMedia.js`.

### F8 – Material- und Stoffwelt mit „Muster anfordern“

- **Nutzen Umsatz:** Bei Minotti/Paola Lenti/Poliform entscheidet der Bezug über Preis und Abschluss. Ein Muster-Versand (Vorbild Material Bank, 13) ist ein **qualifizierter Lead mit Adresse** und bringt Kunden zurück in die Ausstellung.
- **Nutzen Ranking:** Seiten wie „Minotti Stoffe und Leder“ / „Paola Lenti Outdoor-Stoffe“ beantworten Fragen, die kein Händler beantwortet (H5).
- **Umsetzung:** Stufe 1: Materialseite je Marke mit **eigenen Makrofotos** der Musterkarten aus dem Showroom (Zoom wie F2), Filter nach Typ (Stoff, Leder, Holz, Metall, Outdoor), Pflegehinweise; Formular „bis zu 5 Muster anfordern“ (`trackLead("sample_request")`). Stufe 2: in 3D-Pilotmodellen Varianten über `KHR_materials_variants` (model-viewer `variant-name`) – nur für 1–2 Modelle, sonst Pflegefalle.
- **Aufwand:** M · **Abhängigkeiten:** Musterkarten vor Ort, Fotos; Materialien-Doctype existiert schon (`src/lib/api/fetchMaterialien.js`, `fetchFarben.js`) – Zuordnung Produkt↔Material im Backoffice wäre Stufe 3.
- **Dateien:** neu `src/app/[locale]/ueber-uns/marken/[title]/materialien/page.js` (oder eigener Abschnitt der Markenseite), neu `src/components/ShopCatalog/materialSwatches.js`, Formular analog `AnfrageFormProduct`.

### F9 – Bilder für die 152 Produkte ohne Foto

- **Nutzen:** 152 Seiten mit Fallback-Banner sind dünner Inhalt und verkaufen nichts. Brand van Egmond (111) und Next125 (13) sind komplett ohne Bilder.
- **Umsetzung:** Kurzfristig im Code: Produkte ohne Bild in Listen nach hinten sortieren und die Fallback-Fläche durch eine ruhige Typo-Karte (Marke, Name, „Bild auf Anfrage – in Lochau ansehen“) ersetzen; `noindex` prüfen, bis Bilder da sind. Mittelfristig: Bildpaket vom Hersteller anfordern (mit Freigabe) oder eigene Fotos.
- **Aufwand:** S (Code) · **Abhängigkeiten:** Bilder ins Backoffice (blockiert ohne Zugang).
- **Dateien:** `page.js` (Produkt), `src/lib/shop/shopProducts.js`, Kategorie-Listing `src/app/[locale]/produkte/[category]/page.js`.

### F10 – Showroom-Rundgang (optional, später)

- **Variante a (sehr wenig Aufwand, hoher Local-SEO-Nutzen):** 360°-Innenaufnahmen des Showrooms ins **Google-Unternehmensprofil** (passt zu H3 „50+ Fotos“). Keine Code-Änderung.
- **Variante b (Experiment mit eigener GPU):** Gaussian-Splatting-Rundgang durch zwei, drei Vignetten (Training auf der RTX 4060, Viewer `@sparkjsdev/spark` 2.4.0 MIT oder `@mkkellogg/gaussian-splats-3d` 0.4.7 MIT, beide auf three.js). Eindrucksvoll, aber Dateien 30–150 MB je Szene und keine Produkt-Hotspots ohne Zusatzarbeit. Laut 23 „virtueller Showroom nicht jetzt“ → nur als Marketing-Experiment, nicht auf Produktseiten.
- **Aufwand:** a = S, b = L.

---

## 5. Risiken

### 5.1 Recht

| Risiko | Bewertung | Gegenmaßnahme |
|---|---|---|
| **Herstellerbilder** (15.017 Bilder) ohne schriftliche Freigabe | hoch, schon heute | Bildrechte im Gespräch mit jeder Marke schriftlich klären (15, 25 „Spielregeln“). Eigene Fotos (F6, F7, F8) bauen eine **rechtefreie Bildbasis** auf. |
| **3D-Dateien** aus Händler-/Architektenbereichen online stellen oder zum Download anbieten | hoch | Nur nach schriftlicher Freigabe **zur Online-Darstellung**. Original-DWG/3DS **nie** öffentlich weitergeben → „Planungsdaten anfragen“ (Lead) statt Download. Minotti/Poliform-Daten setzen eventuell Händlerstatus voraus. |
| **Händler-Behauptung** durch AR/3D-Logos („offizielle Minotti-3D-Ansicht“) | mittel | Formulierung „3D-Ansicht“ ohne Statusbehauptung; offizielle Formulierung nur bei ClassiCon. |
| Designschutz/Urheberrecht an Klassikern (Eileen Gray) bei **eigener** Fotogrammetrie | mittel | Eigene 3D-Scans nur von Stücken, deren Hersteller zustimmt; bei ClassiCon (Lizenznehmer Aram) Freigabe einholen. |
| DSGVO: `model-viewer` lädt Decoder von Google-CDN; Scene Viewer öffnet Google-App | mittel | Decoder selbst hosten; AR erst auf Klick (Nutzeraktion), Hinweis in Datenschutzerklärung (`src/components/Datenschutz`). |
| AR-Maßhaltigkeit („im AR passte es“) | gering–mittel | Hinweis „Darstellung in Originalgröße, Abweichungen möglich – Maße siehe Datenblatt“, `ar-scale="fixed"`. |

### 5.2 Performance

- 3D/360° **nie im ersten Paint**: Poster + dynamischer Import nach Klick, `model-viewer` ≈ 250 KB gzip nur auf Pilotseiten, Modelle ≤ 3 MB. LCP/INP der Produktseite dürfen sich messbar nicht verschlechtern (Lighthouse/CrUX vorher/nachher).
- Galerie: Vollbild-Bilder erst beim Öffnen laden, Thumbnails `sizes="100px"` (wie heute).
- Der `/cmx`-Proxy streamt Dateien durch den Next-Server. Für GLB/USDZ (MB-Bereich) besser ein CDN/Objektspeicher mit `Cache-Control: immutable` – oder zumindest Cache vor nginx.

### 5.3 Pflege (Team von ca. 5)

- Jeder neue Medientyp braucht einen **Eigentümer**. Faustregel: F1–F3 laufen automatisch aus dem Backoffice (null Pflege), F6/F7 ca. 2 Std./Woche, F4 nur im Pilotumfang (max. 20 Modelle, keine Varianten-Flut), F8 einmalig + saisonal.
- Repo-Overlays (`productMedia.js`, `scenes.js`, `dimensionsOverlay.js`) sind eine **Übergangslösung**; spätestens bei > 50 Einträgen in Backoffice-Felder überführen (das Feld `pdf_produkte.3d` existiert bereits).
- Kein Abo-Dienst, keine proprietären Formate → kein Lock-in.

---

## 6. Priorisierte Reihenfolge

### Sofort baubar – ohne Backoffice-Zugang

| # | Feature | Aufwand | Warum zuerst |
|---|---|---|---|
| 1 | **F1 Download-Tab** (841 vorhandene PDFs) + „Planungsdaten anfragen“ + `file_download`-Event | S | Daten liegen schon da, null Pflege, B2B-Leads |
| 2 | **F2 Galerie 2.0** (Embla + Lightbox mit Pinch-Zoom, Alt-Texte aus `imageName`, 4-sprachige ARIA) | M | betrifft 1.613 Seiten, mobile Kernerfahrung |
| 3 | **F3 Stufe 1** Maßzeichnung maßstäblich + „Passt es?“ + Maße im JSON-LD | M | 961 Produkte sofort, SEO-Long-Tail |
| 4 | **F9 Code-Teil** (bildlose Produkte nach hinten, bessere Fallback-Karte) | S | entfernt schwächste Seiten aus dem Schaufenster |
| 5 | **F6 Shop the Look** mit 10 eigenen Showroom-Szenen (Repo-Datei) | M | eigene Bildrechte, Ensemble-Verkauf, Local-SEO |
| 6 | **F7 360°-Komponente** + 10 Ausstellungsstücke | S | Vorbereitung Atelierverkauf |
| 7 | **F5 Pipeline einrichten** (Blender, gltf-transform, Validator auf dem RTX-PC) + **F4 Viewer-Komponente** mit 1–2 eigenen Fotogrammetrie-Testobjekten | M | Technik bereit, bevor Freigaben eintreffen |
| 8 | **F3 Stufe 2** Maße Minotti/Poliform/Paola Lenti als Repo-Overlay aus öffentlichen Technical Sheets | M | schließt die größte Datenlücke der Umsatzmarken |

### Blockiert oder bedingt

| Feature | Blockiert durch |
|---|---|
| F4 AR-Pilot mit Markenprodukten | **schriftliche Freigabe** (zuerst ClassiCon, Flos; Minotti erst nach Gespräch), Quelldateien in brauchbarem Format |
| 3D-Dateien dauerhaft im Backoffice (`pdf_produkte.3d`) + Proxy-Freigabe `.glb/.usdz` | Backoffice-Schreibzugang |
| F7 voller Nutzen (Preise, Outlet) | Preisfeld/Ausstellungs-Flag im Backoffice, Herstellerregeln zu Preisangaben |
| F8 Stufe 3 (Material ↔ Produkt verknüpft, Varianten-Bilder) | Backoffice-Felder, Musterfotos |
| F9 Bilder für 152 Produkte | Bildlieferung der Marken + Backoffice-Zugang |
| Herstellerbilder rechtssicher | schriftliche Bildfreigaben je Marke |
| F10b Splat-Rundgang | Entscheidung „nicht jetzt“ (23) |

### Messen (nach 3 Monaten)

- Galerie: Anteil Sitzungen mit `gallery_zoom`, Absprungrate Produktseite mobil.
- Downloads: `file_download` je Marke, Anfragen „Planungsdaten“.
- 3D/AR: `view_3d` → `ar_start` → Lead-Quote vs. Produktseiten ohne 3D (gleiche Marke). **Ausbau über 20 Modelle nur, wenn die Lead-Quote mit AR spürbar höher ist.**
- Shop the Look: Klicks auf Hotspots, „Ganzen Look merken“, Auftragswert der Anfragen.

---

## Quellen

- Minotti, Produktseite Andersen (Downloads: Technical Sheet, `ANDERSEN.DWG`, 3D-Dateien, Login „Download Area“): [minotti.com/en/products/andersen](https://www.minotti.com/en/products/andersen)
- Poliform, Startseite mit „Reserved Area“: [poliform.it/en](https://www.poliform.it/en/), [b2b.poliform.it](https://b2b.poliform.it/)
- Flos Professional, Download-Bereich „2D / 3D files (355)“: [professional.flos.com/en/global/product-downloads](https://professional.flos.com/en/global/product-downloads/)
- ClassiCon (2D: PDF/DWG/IGS, 3D: 3DS/DWG für Händler, Architekten, Presse): [classicon.com/en](https://www.classicon.com/en/), Händlerliste [classicon.com/de/haendler.html](https://www.classicon.com/de/haendler.html)
- Paola Lenti, Konfigurator und Materialien: [paolalenti.it/en/focus/configurator](https://www.paolalenti.it/en/focus/configurator/)
- Vitra, AR-Ablauf mit QR-Code: [vitra.com/en-de/inspirations/augmented-reality](https://vitra.com/en-de/inspirations/augmented-reality)
- Apple AR Quick Look im Web: [developer.apple.com/wwdc19/612](https://developer.apple.com/wwdc19/612)
- Höttges / Die Einrichter: [hoettges.at](https://www.hoettges.at/)
- Houzz AR, Anbieterangaben zur Kaufwahrscheinlichkeit: [furnituretoday.com](https://www.furnituretoday.com/business-news/houzz-updates-ar-app-says-users-11x-more-likely-buy)
- Wayfair Room Planner / View in Room: [engadget.com](https://www.engadget.com/2019/11/14/wayfair-shopping-app-ar/)
- „+94 % Conversion mit 3D“ nur sekundär zitiert, nicht primär belegt: [7cgi.com](https://7cgi.com/blog/3d-product-rendering-for-ecommerce/); Coohom-Fallstudie E-Living (Anbieterangabe): [casestudies.com](https://www.casestudies.com/company/coohom/case-study/e-living-furniture-doubles-checkout-conversion-2x-with-coohom)
- Drittanbieter-3D-Modelle der Marken (Design Connected u. a., Nutzung nur nach Lizenz): [cgtrader.com](https://www.cgtrader.com/3d-models/furniture/sofa/powell), [3dcadbrowser.com](https://3dcadbrowser.com/3d-model/poliform-bali)
- Paketdaten: npm-Registry (Versionen/Lizenzen, abgefragt 26.10.2026), Größen über [bundlephobia.com](https://bundlephobia.com/)
- Next.js-Lazy-Loading (`ssr: false` nur in Client Components): `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`
- Eigene Live-Auswertung der Backoffice-API (1.765 Produkte): `get_produkte_paths`, `get_produkt_by_path_field_api`, 26.10.2026
