# 06 – Bauplan: KI-Raumplaner „Ihr Raum mit Minotti“ und lokale GPU

**Stand:** 26.10.2026 · Rolle: generative KI für Interior und Retail
**Grundlage:** Website-Code (Next.js 16.2, App Router, next-intl, 4 Sprachen), Berichte 00, 13 (Idee 8), 15, 23 (Abschnitte 1, 4, 9, 10), 25, Web-Recherche Oktober 2026, Prüfung der lokalen Hardware
**Regel:** Dieser Bauplan ändert keinen Code. Nichts wurde installiert. Alle Bibliotheken sind Empfehlungen mit Version und Lizenz.

> **Kurzfassung:** Der Raumplaner ist das sichtbarste „Wow“-Werkzeug der Region. Er darf aber **nicht** als vollautomatischer Selbstbedienungs-Generator starten. Die Modelle können Minotti-Produkte heute nicht zuverlässig originalgetreu darstellen, die Bildrechte der Marken sind ungeklärt, und ab 02.08.2026 gilt die Kennzeichnungspflicht nach Art. 50 AI Act. Der richtige Weg ist **Stufe 1: „Ihr Raum in 48 Stunden“** als Beratungsleistung. Kunden laden ein Foto hoch, das Team erstellt die Visualisierung mit der lokalen GPU als Werkzeug und prüft jedes Bild von Hand. Die Website-Seite dafür ist **sofort und ohne Backoffice baubar**. Die Automatisierung (Stufe 3) kommt erst mit Bildfreigabe, Nachfrage-Nachweis und besserer Hardware.
>
> **Wichtigster Hardware-Befund:** Im PC steckt eine **NVIDIA GeForce RTX 4060 mit 8 GB VRAM** (Treiber 610.88, per `nvidia-smi` geprüft). Das reicht für Freistellen, Upscaling und SDXL. Für die aktuellen Bearbeitungsmodelle (FLUX Kontext, Qwen-Image-Edit) reicht es nur mit starker Quantisierung und 1,5–3 Minuten pro Bild. Für eine produktive Werkstatt empfiehlt sich eine GPU mit 24–32 GB (RTX 4090/5090, ca. 2.000–3.500 €).

---

## 1. Ist-Zustand im Code

| Bereich | Stand | Datei(en) | Bedeutung für den Raumplaner |
|---|---|---|---|
| Produktdaten | Produkte, Marken und Kategorien kommen live aus dem Frappe-Backoffice („Produkte New“), gecacht mit `revalidate: 3600` und dem Tag `products` | `src/lib/api/fetchAllProdukte.js`, `src/lib/apiBaseUrl.js` | Name, Marke, Bilder und Maße sind vorhanden. Eine **Produktauswahl für das Formular** lässt sich ohne neues Backoffice-Feld bauen |
| Maße | `parseDimensions(product.dimensionsRaw)` macht aus Freitext ein Maßdiagramm | `src/components/ShopCatalog/dimensionDiagram.js`, `src/app/[locale]/produkte/[category]/[product]/page.js` | Maße helfen dem Team beim Skalieren im Foto. Sie sind Freitext und nicht immer maschinenlesbar |
| Produktbilder | Werden über `/cmx/...` aus dem Backoffice ausgeliefert (nur `files/`), dazu fremde Hosts in `next.config.js` (next125.com, treca-paris.com, unsplash) | `src/app/cmx/[...path]/route.js`, `next.config.js` (`images.remotePatterns`) | Fast alle Bilder sind **Markenbilder**. Sie als KI-Vorlage zu nutzen, ist ohne Freigabe heikel (Abschnitt 5) |
| Merkliste statt Warenkorb | Liegt in `localStorage` („cart“) und mündet in eine Anfrage | `src/context/CartContext.js`, `src/components/CartPage/CartPage.js`, `src/app/[locale]/merkliste` | Ideal als Brücke: **„Diese Merkliste in meinem Raum sehen“** |
| Anfrage-Formulare | `anfrage_produkt`, `beratung_anfrage`, `kontakt` leiten JSON an Frappe weiter, ohne Datei-Upload | `src/app/api/anfrage_produkt/route.js`, `src/app/api/beratung_anfrage/route.js`, `src/components/BeratungClient/BeratungClient.js`, `src/components/AnfrageFormProduct/AnfrageFormProduct.js` | Für ein Raumfoto fehlt ein **Upload-Weg**. Den einzigen Datei-Upload gibt es im Karriere-Formular (PDF) |
| Bot-Schutz | Kein Captcha und kein Rate-Limit in den API-Routen gefunden | `src/app/api/*` | Vor jedem Upload und jeder KI-Funktion nötig |
| Conversion-Tracking | `trackLead(form, params)` als einheitliches `generate_lead` für GA4 (Consent Mode v2) | `src/lib/analytics.js`, `src/components/Cookies/` | Neuer Wert `form: "raum_48h"` ohne weiteren Aufwand |
| Sicherheits-Header | `Permissions-Policy: camera=()` | `next.config.js` | `<input type="file" accept="image/*" capture="environment">` öffnet die Kamera-App des Handys trotzdem. Live-Kamera im Browser (getUserMedia) wäre gesperrt und ist nicht nötig |
| Upload-Grenzen in Next 16 | Server Actions nehmen standardmäßig nur **1 MB** an (`serverActions.bodySizeLimit`). `proxyClientMaxBodySize` begrenzt Bodies, die durch `proxy.js` laufen | `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`, `.../next-config-js/proxyClientMaxBodySize.md` | Handyfotos (3–8 MB) **nicht** über Server Action oder Route Handler schicken, sondern **direkt in einen Speicher** laden (Presigned URL). Das umgeht auch Body-Limits beim Hoster |
| Seiten und SEO | Lokalisierte Pfade in `STATIC_PAGE_TRANSLATIONS`, Sitemaps, JSON-LD, Stadt-Landingpages | `src/lib/seo/sitemapEntries.js`, `src/lib/seo/structuredData.js`, `src/app/[locale]/designermoebel-*`, `src/messages/{de,en,fr,it}.json` | Eine neue Seite „Ihr Raum in 48 Stunden“ passt in das bestehende Muster |
| KI-Ansätze | Keine. Keine KI-Bibliothek in `package.json` | `package.json` | Start auf der grünen Wiese |

**Fazit:** Alles, was die **Anfrage-Seite** braucht (Produktauswahl, Tracking, i18n, SEO-Rahmen), ist vorhanden. Es fehlen ein Upload-Speicher, Bot-Schutz, die Einwilligungstexte und der Arbeitsplatz für das Team.

---

## 2. Benchmark

### 2.1 Was die Besten weltweit machen

| Anbieter | Werkzeug | Wie es funktioniert | Lehre für Platzhirsch |
|---|---|---|---|
| **IKEA Kreativ** | Raum scannen oder fotografieren, Möbel löschen, IKEA-Produkte platzieren (Technik von Geomagical Labs) | Keine generative „Halluzination“. Echte **3D-Modelle** werden in das rekonstruierte Foto gesetzt. Dadurch ist das Produkt originalgetreu | Produkttreue entsteht über 3D-Daten oder echte Fotos, nicht über reines Text-zu-Bild |
| **Wayfair Decorify → Muse** (seit 02/2025) | Foto hochladen, Stil wählen, „shoppable“ Bild | Generativ, Produkte werden danach per Ähnlichkeitssuche verlinkt. Das Bild zeigt **ähnliche**, nicht die exakten Produkte | Für Massenware okay. Bei einem 15.000-€-Sofa wäre „ähnlich“ ein Reklamationsgrund |
| **Havenly** | KI als Einstieg, dann bezahltes Design (159 $ pro Raum online) | Mensch plus KI | Genau das Modell „48 h gegen anrechenbare Pauschale“ |
| **RH (Restoration Hardware)** | Kostenloser Interior-Design-Service in den Galerien, große Raumbilder auf der Website | Menschen planen, Bilder sind professionelle Fotos | Im Luxussegment verkauft der Mensch, das Bild schafft Lust |
| **Minotti** | Händlerverzeichnis, „My Selection“, Kataloge, Videos, **Download-Bereich nur für Händler und Architekten** | Kein Konfigurator, kein AR, kein KI-Werkzeug (minotti.com, geprüft 26.10.2026) | Die Marke selbst bietet die Funktion nicht an. Hochauflösende Bilder und 3D-Daten gibt es nur mit Login |
| **Poliform** | Kataloge, Händler, Downloads für Planer | Kein öffentliches KI- oder AR-Werkzeug gefunden (Bericht 13) | Gleiche Lücke |
| **Connox, AmbienteDirect, Conran Shop** | Viele Bilder pro Produkt, teils AR für einzelne Leuchten | Keine Raum-KI mit eigenem Foto | Auch die Online-Größen haben es nicht |
| **Spezialanbieter** (REimagine Home, Interior AI, RoomGPT-Klone) | Foto hochladen, Stil wählen, ab ca. 14 $/Monat (laut Drittquelle) | Generischer Stil, **keine realen Produkte** aus einem Katalog | Taugt als Moodboard, nicht als Verkaufsbild für Minotti |

### 2.2 Regionale Wettbewerber

| Wettbewerber | Raumplaner/KI | 3D/AR | Online-Termin | Quelle |
|---|---|---|---|---|
| Höttges / Die Einrichter | nein | nein | nur `mailto:` für „Erstberatung 2h“ | hoettges.at, geprüft 26.10.2026 |
| reiter design, Dolce Vita, Hutle, Fretz, Thöny, Gamma | nein (kein Hinweis in den Berichten 16 und 20). Online-Termin nur Gamma und Fretz | nein | teilweise | Berichte 16, 20 (reiter-design.at war am 26.10.2026 per DNS nicht erreichbar) |

**Ergebnis:** In der Region und bei den Marken selbst gibt es **kein** Werkzeug „Ihr Raum mit diesem Produkt“. Wer es zuerst sauber anbietet, besetzt das Thema. Der Vorsprung kommt aber aus **Service plus Bildqualität**, nicht aus der Technik. Die Technik kann jeder kaufen.

---

## 3. Konzept und Zielbild

### 3.1 Ehrliche Bewertung der Technik (Stand Oktober 2026)

| Option | Produkttreue (Minotti-Sofa erkennbar exakt?) | Raumtreue (Wände, Fenster, Licht bleiben) | Kosten | Latenz | Datenschutz | Lizenz/Recht | Urteil |
|---|---|---|---|---|---|---|---|
| **Gemini 2.5 Flash Image / „Nano Banana“** (Google, über Gemini API oder Vertex AI EU) | mittel bis gut mit 1–3 Referenzbildern. Proportionen und Nähte driften, Stoffe werden „geglättet“ | gut | ca. 0,04–0,08 $ pro Bild (fal listet Nano Banana 2 mit 0,08 $ bei 1K) | 5–20 s | Vertex AI mit EU-Region und AVV möglich. Kundenfotos gehen trotzdem an einen US-Konzern (DPF) | Ausgaben kommerziell nutzbar, SynthID-Wasserzeichen ist schon eingebaut | **Bester Cloud-Kandidat** für Stufe 3 |
| **OpenAI Images (gpt-image-1)** | mittel, verändert oft den ganzen Raum | mittel | ca. 0,04–0,19 $ pro Bild je nach Qualität [nicht verifiziert für 10/2026] | 15–60 s | AVV möglich, US | kommerziell nutzbar, C2PA-Metadaten | Zweite Wahl |
| **FLUX.1 Kontext Pro / FLUX.2 Pro** (BFL, über fal oder Replicate) | gut. FLUX.2 nimmt mehrere Referenzbilder, BFL nennt „Möbel aus verschiedenen Fotos kombinieren“ als Anwendungsfall | gut | ca. 0,04 $ pro Bild (Kontext Pro, Drittquelle) | 5–15 s | fal/Replicate sind US-Firmen. Eine EU-Verarbeitung ist zu prüfen | API-Ausgaben mit vollen kommerziellen Rechten (BFL-Hilfeseite) | Gleichwertig zu Gemini, gut für A/B-Test |
| **Lokal: FLUX.1 Kontext [dev] (GGUF Q4)** in ComfyUI | gut mit Referenzbild und Inpainting-Maske | sehr gut mit Maske | 0 € pro Bild, aber **kommerzielle Lizenz nötig** (Self-Serve bei bfl.ai/licensing, Preis laut Nutzerforum ca. 999 $, nicht bestätigt) | **90–180 s** auf 8 GB | **beste Variante**: Kundenfoto verlässt das Haus nicht | Die Nicht-kommerzielle Lizenz verbietet den Einsatz im Geschäft ohne Kauf | Gut als Teamwerkzeug, nur mit Lizenz |
| **Lokal: Qwen-Image-Edit-2511** (GGUF Q4/Q5, Lightning-LoRA mit 4 Schritten) | gut, kann mehrere Bilder kombinieren | gut | 0 € | 60–150 s auf 8 GB (mit ausgelagertem Text-Encoder), auf 24 GB ca. 10–20 s | lokal | **Apache 2.0** (laut Qwen; vor dem Einsatz auf der Model Card prüfen) | **Empfohlenes lokales Hauptmodell**, weil lizenzfrei kommerziell |
| **Lokal: SDXL + ControlNet (Depth/Canny) + IP-Adapter + Inpainting** | schwach bis mittel. IP-Adapter überträgt Stil und Form, aber keine exakten Details. Mit eigenem **LoRA pro Produkt** (aus 20–40 eigenen Fotos) deutlich besser | sehr gut (Depth hält die Raumgeometrie) | 0 € | 15–40 s auf 8 GB | lokal | SDXL: CreativeML Open RAIL++-M, kommerziell erlaubt | Bewährt und läuft flüssig auf 8 GB. Für Raumgeometrie und LoRA-Training |
| **Spezialanbieter** (REimagine Home, Interior AI usw.) | keine realen Katalogprodukte | gut | 14–50 $/Monat | Sekunden | Fotos beim Anbieter (meist US) | AGB prüfen | **Nicht** für Minotti-Verkaufsbilder. Höchstens Moodboards |
| **3D-Compositing** (echte 3D-Modelle der Marke, z. B. in Blender) | **exakt** | gut, wenn Licht und Perspektive passen | Zeit des Teams | Stunden | lokal | 3D-Daten der Marke nötig (Download-Bereich, Händlerstatus) | Gold-Standard, aber hängt am Händlerstatus |

**Kernaussage zur Produkttreue:** Kein generatives Modell bildet heute ein bestimmtes Minotti-Modell in Bezug auf Proportionen, Nahtbild, Fußdetail und Stoffstruktur **garantiert** exakt ab. Bei 1–3 guten Referenzbildern liegt man nach Erfahrung bei vielleicht 6–8 von 10 Versuchen „erkennbar richtig“ [Einschätzung, im Pilot messen]. Deshalb: **Mensch prüft jedes Bild**, und auf jedem Bild steht „KI-Visualisierung, Abweichungen in Form, Farbe und Material möglich“.

### 3.2 Zielbild in drei Stufen

```
Stufe 1 (sofort, Q4 2026)          Stufe 2 (Q1–Q2 2027)                    Stufe 3 (ab 2028, nur wenn Gates erfüllt)
"Ihr Raum in 48 Stunden"     →     Halbautomatische Werkstatt         →    Selbstbedienungs-Vorschau auf der Website
Kunde: Foto + Merkliste            Team: Bildbibliothek eigener             Kunde: Foto hoch, Produkt wählen,
Team: ComfyUI lokal, prüft         Showroom-Fotos, feste ComfyUI-           1 Vorschau in 20 s (Cloud-API),
Lieferung: 2–3 Bilder per Mail     Workflows, LoRA je Top-Produkt,          Wasserzeichen + Hinweis,
Preis: Pauschale, beim Kauf        Vorher/Nachher-Galerie (mit              danach "Termin buchen"
angerechnet                        Einwilligung) als SEO-Inhalt
```

**Gates für Stufe 3:** (1) schriftliche Bildfreigabe der Marken oder ausschließlich eigene Fotos, (2) mindestens 60 Anfragen über Stufe 1 und eine gemessene Abschlussquote, (3) AVV mit dem Cloud-Anbieter und Datenschutz-Folgenabschätzung, (4) Bot-Schutz und Kostendeckel.

### 3.3 Wer was macht (Team von ca. 5 Personen)

- **Eine Person** (Verkauf oder Marketing) wird „Visualisierungs-Verantwortliche“. Zeitbedarf mit fertigen Workflows: ca. 30–60 Minuten pro Auftrag (2–3 Bilder inkl. Prüfung).
- **Bei mehr als 10 Aufträgen pro Woche** reicht das nicht mehr. Dann entweder Stufe 3 oder Pauschale erhöhen.

---

## 4. Konkrete Features

### F1 – Landingpage und Upload „Ihr Raum in 48 Stunden“ (Stufe 1)

- **Nutzen Umsatz:** Lead mit hoher Kaufabsicht (Foto, Raum, Wunschprodukte, Kontakt). Die Pauschale (Vorschlag: 149 € pro Raum, beim Kauf ab 3.000 € angerechnet) filtert Neugierige und finanziert die Zeit. Ein guter Lead kann ein Sofa-Projekt von 15–40 T€ sein [Schätzung].
- **Nutzen Ranking:** Neue Seite für „Raum visualisieren“, „Einrichtung planen lassen Vorarlberg“, „Minotti im eigenen Wohnzimmer sehen“. Interne Links von jeder Produktseite („In Ihrem Raum ansehen“), aus der Merkliste und von den Stadt-Landingpages. JSON-LD `Service` mit `Offer` (Pauschale, also ein **eigener** Preis, unabhängig vom fehlenden Preisfeld).
- **Aufwand:** M (3–5 Entwicklertage).
- **Abhängigkeiten:** EU-Objektspeicher für Fotos (Konto anlegen), Datenschutztext und Einwilligung (Anwalt oder DSB), Entscheid über die Pauschale (Inhaber), optional Zahlungsanbieter für die Pauschale (Stripe/Mollie). Zum Start reicht aber „Rechnung nach Lieferung“. **Kein Backoffice-Feld nötig.** Die Anfrage geht per E-Mail an das Team und landet zusätzlich als normale Beratungsanfrage über den bestehenden Endpunkt `beratung_anfrage` (mit Foto-Links im Nachrichtentext).
- **Ablauf:**
  1. Kunde wählt Raumtyp und Produkte (Suche über die vorhandene Route `src/app/api/shop-search/route.js` oder Übernahme der Merkliste aus `CartContext`).
  2. Er lädt 1–3 Fotos hoch. Das Handy verkleinert sie im Browser auf ca. 2.500 px und 1–2 MB, dann gehen sie per Presigned URL direkt in den Speicher.
  3. Er setzt drei Häkchen: Einwilligung DSGVO, „Ich habe die Rechte am Foto, keine Personen erkennbar“ und optional „Darf anonymisiert als Referenz gezeigt werden“.
  4. Er erhält die Bestätigung. Danach folgt `trackLead("raum_48h", { products: n })`.
- **Betroffene Dateien (bestehend):** `src/lib/seo/sitemapEntries.js` (Pfad je Sprache), `src/messages/{de,en,fr,it}.json`, `src/app/[locale]/produkte/[category]/[product]/page.js` (CTA-Button), `src/components/CartPage/CartPage.js` (CTA „In meinem Raum sehen“), `src/app/llms.txt/route.js` (Leistung nennen), `next.config.js` (CSP/`connect-src` für den Speicher, falls eine CSP hinzukommt).
- **Neue Dateien:** `src/app/[locale]/ihr-raum/page.js` (lokalisiert: `/your-room`, `/votre-piece`, `/la-tua-stanza`), `src/components/RaumAnfrage/RaumAnfrage.js` (Client-Formular), `src/components/RaumAnfrage/PhotoDrop.js`, `src/app/api/raum-anfrage/upload-url/route.js` (gibt Presigned PUT-URL aus, prüft Turnstile, Typ und Größe), `src/app/api/raum-anfrage/route.js` (schickt die Anfrage weiter), `src/lib/storage/s3.js` (`import "server-only"`).
- **Empfohlene Bibliotheken:**

| Paket | Version | Lizenz | Bundle (Client, gzip) | Zweck |
|---|---|---|---|---|
| `browser-image-compression` | 2.0.2 | MIT | ca. 20 kB, nur auf der Formularseite per `dynamic import` | Fotos im Browser verkleinern, EXIF/GPS wird beim Neu-Encodieren über Canvas entfernt |
| `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` | 3.x (aktuelle 3.9xx) | Apache-2.0 | **0 kB** (nur Server) | Presigned URLs für einen S3-kompatiblen EU-Speicher (z. B. Hetzner Object Storage Falkenstein/Nürnberg, Exoscale Wien, Cloudflare R2 mit EU-Jurisdiction) |
| `@marsidev/react-turnstile` | 1.x | MIT | ca. 2 kB plus Cloudflare-Skript | Bot-Schutz ohne Cookie-Banner-Pflicht (Turnstile setzt keine Tracking-Cookies, im Datenschutztext nennen) |
| `zod` (optional) | 3.25.x / 4.x | MIT | 0 kB, wenn nur auf dem Server | Eingaben prüfen |

  Ohne Bibliothek: Drag-and-drop und `<input type="file" accept="image/jpeg,image/png,image/heic" capture="environment" multiple>`. HEIC von iPhones: Safari wandelt bei `accept="image/jpeg"` meist selbst um. Sonst konvertiert das Team lokal.
- **Speicher-Regeln:** Bucket privat, Lebenszyklus-Regel „löschen nach 90 Tagen“, kein öffentlicher Lesezugriff. Das Team lädt die Bilder über kurz gültige Links.

### F2 – KI-Werkstatt auf der lokalen GPU (Werkzeug für das Team, Stufe 1–2)

- **Nutzen Umsatz:** Macht F1 erst wirtschaftlich (30–60 statt 3–4 Stunden pro Raum mit klassischer 3D-Visualisierung). Die gleichen Werkzeuge liefern Angebotsbilder für Hotels, Bauträger und Ferienimmobilien (Masterkonzept 5 und 10).
- **Nutzen Ranking:** indirekt über eigene, einzigartige Bilder (F4, F5).
- **Aufwand:** M (2–4 Tage Einrichtung durch eine technikaffine Person oder einen Freelancer, dann 1 Tag Schulung).
- **Abhängigkeiten:** keine Backoffice-Felder. Lizenzentscheid (Qwen = Apache 2.0, kostenlos; FLUX Kontext dev nur mit kommerzieller BFL-Lizenz). Hardware-Entscheid (siehe unten).
- **Software-Stack (nicht im Website-Repo, eigener Ordner z. B. `C:\KI-Werkstatt`):**

| Komponente | Version (Stand 10/2026, vor Installation prüfen) | Lizenz | VRAM-Bedarf | Zweck |
|---|---|---|---|---|
| ComfyUI (Desktop oder Portable für Windows) | aktuelle stabile Version | GPL-3.0 (nur intern genutzt, keine Weitergabe, also unproblematisch) | – | Knotenbasierte Workflows, auch per API ansteuerbar |
| ComfyUI-GGUF (city96) | aktuell | Apache-2.0 | – | Quantisierte Modelle auf 8 GB |
| **Qwen-Image-Edit-2511** GGUF Q4_K_M + Lightning-LoRA (4 Schritte) | 2511 | Apache-2.0 (prüfen) | ca. 7–8 GB plus Auslagerung | **Hauptmodell:** Produkt aus Referenzfoto in Kundenraum einsetzen, Möbel entfernen |
| FLUX.1 Kontext [dev] GGUF Q4_K_S | 1.0 | FLUX.1 [dev] Non-Commercial, **kommerziell nur mit Lizenz** | ca. 6,8 GB | Alternative mit sehr guter Raumtreue |
| SDXL 1.0 Base + ControlNet Union (Depth/Canny) + IP-Adapter Plus | 1.0 | Open RAIL++-M bzw. Apache-2.0 | 6–8 GB | Raumgeometrie halten, Stilvarianten, Inpainting |
| Depth Anything V2 Small | v2 | Apache-2.0 (nur Small; Base/Large sind CC BY-NC 4.0!) | < 1 GB | Tiefenkarte des Kundenraums |
| SAM 2.1 (Segment Anything) | 2.1 | Apache-2.0 | 1–2 GB | Maske für das alte Sofa per Klick |
| LaMa / ComfyUI-Inpaint-Nodes | aktuell | Apache-2.0 | < 2 GB | Alte Möbel sauber entfernen |
| Kohya SS / OneTrainer | aktuell | Apache-2.0 / AGPL-3.0 (intern) | SDXL-LoRA geht mit 8 GB, FLUX/Qwen-LoRA braucht 16–24 GB | **LoRA je Top-Produkt** aus eigenen Showroom-Fotos (F3) |

- **Standard-Workflows (als JSON in ComfyUI gespeichert, damit jede Person sie gleich bedient):**
  1. **„Leeren“:** Foto → SAM-Maske auf alte Möbel → LaMa entfernen.
  2. **„Platzieren“:** leerer Raum + freigestelltes Referenzfoto (eigenes Bild, F3) + Maske für den Zielbereich → Qwen-Image-Edit → 4 Varianten.
  3. **„Prüfen“:** Vergleich nebeneinander (Referenz und Ergebnis) mit einer Checkliste: Armlehnen, Füße, Proportion zum Maß aus `dimensionsRaw`, Stofffarbe.
  4. **„Ausliefern“:** Upscaling (F3), Kennzeichnung „KI-Visualisierung“ unten rechts, C2PA-Metadaten, Export als JPEG 2.560 px.
- **Hardware-Empfehlung:**

| Option | VRAM | Zeit pro Qwen-Edit-Bild [Schätzung] | Kosten | Urteil |
|---|---|---|---|---|
| Vorhandene RTX 4060 | 8 GB | 60–180 s, Q4 mit Qualitätsverlust | 0 € | **Reicht für den Pilot** (10–20 Aufträge). Die 128 GB Arbeitsspeicher im PC (geprüft) fangen das Auslagern der Modelle gut ab |
| RTX 4090 (gebraucht) / RTX 5090 | 24 / 32 GB | 10–25 s, FP8 ohne Qualitätsverlust, LoRA-Training möglich | ca. 1.800–3.500 € | Ab Stufe 2. Lohnt sich ab ca. 5 Aufträgen pro Woche |
| Cloud-GPU auf Stunde (RunPod, Vast, Lambda) | 24–80 GB | wie oben | ca. 0,40–2,50 $/h | Für gelegentliches LoRA-Training. Kundenfotos dort nur mit AVV |

### F3 – Eigene Bildbibliothek: Showroom-Fotos, Freistellung und Upscaling

- **Nutzen Umsatz:** Löst das größte Rechtsproblem. **Eigene Fotos der eigenen Ausstellungsstücke** (größte Minotti-Ausstellung Westösterreichs) gehören Platzhirsch, nicht der Marke. Sie sind die sauberste Vorlage für KI, Atelierverkauf (Masterkonzept 5, Punkt 2), Social Media und Google Merchant Center.
- **Nutzen Ranking:** Einzigartige Bilder statt der gleichen Markenfotos wie bei allen Händlern. Google Bilder und Shopping bevorzugen Originale. Dazu `ImageObject` mit `creator` und `copyrightHolder` = Platzhirsch.
- **Aufwand:** M (1 Fototag pro 30–50 Stücke mit Drehteller oder fester Lichtecke, dann je Bild 1–2 Minuten in der Pipeline).
- **Abhängigkeiten:** Keine Backoffice-Felder für das Erstellen. Für die **Anzeige auf der Website** müssen die Bilder ins Backoffice (Bildfeld existiert, Schreibzugang fehlt). Bis dahin per Datei-Übergabe an den Backoffice-Betreiber oder als statische Dateien für den Atelierverkauf (`src/lib/data/` folgt diesem Muster schon).
- **GPU-Pipeline (Batch über einen ComfyUI-Ordner oder ein Python-Skript):**

| Schritt | Modell/Werkzeug | Version | Lizenz | Hinweis |
|---|---|---|---|---|
| Freistellen | **BiRefNet** (ZhengPeng7) bzw. `rembg` mit BiRefNet-Modell | BiRefNet 2024/25, `rembg` 2.0.x | MIT | **Nicht RMBG-2.0 von BRIA** nehmen: CC BY-NC 4.0, kommerziell nur mit Vertrag |
| Kantenverfeinerung | BiRefNet-Matting oder ViTMatte | – | MIT / Apache-2.0 | Für Fransen, Quasten, Outdoor-Geflecht |
| Upscaling | **Real-ESRGAN x4plus** | 0.3.0 | BSD-3-Clause | **Nicht 4x-UltraSharp** (CC BY-NC-SA) und nicht SUPIR (nicht-kommerzielle Bedingungen) für Kundenbilder |
| Weißer Hintergrund und Schatten | ComfyUI-Compositing oder `sharp` | sharp 0.34.x | Apache-2.0 | Merchant-Center-taugliche Bilder (weiß, Produkt ≥ 75 % der Fläche) |
| Batch-Steuerung | Python 3.12 + ComfyUI-API (HTTP/WebSocket) | – | – | Ordner „eingang“ → „fertig“, ohne Programmierkenntnisse bedienbar |

### F4 – Vorher/Nachher-Referenzen als SEO-Inhalt („Räume aus der Region“)

- **Nutzen Umsatz:** Social Proof aus dem Einzugsgebiet („Wohnzimmer in Lindau mit Minotti Connery“) und ein Schaufenster für F1.
- **Nutzen Ranking:** Echte, ortsbezogene Inhalte für die Stadt-Landingpages (Bericht 25, H4: „Referenzprojekte aus der Gegend“ gegen Doorway-Pages). Die KI-Visualisierungen nur **gekennzeichnet** zeigen. Am stärksten wirkt das Paar „Visualisierung → Foto nach Lieferung“.
- **Aufwand:** S (Galerie-Komponente plus Datenstruktur), M mit eigener Seite je Referenz.
- **Abhängigkeiten:** schriftliche Einwilligung des Kunden (Foto, Ort nur auf Gemeindeebene, keine Hausnummer), Kennzeichnung nach Art. 50 AI Act. Kein Backoffice-Feld nötig, wenn die ersten 5–10 Referenzen als statische Daten im Repo liegen (`src/lib/content/` folgt diesem Muster schon). Später als Doctype „Referenz“ im Backoffice.
- **Dateien:** neu `src/lib/content/raumReferenzen.js`, `src/components/RaumAnfrage/BeforeAfter.js`, Abschnitt auf `src/app/[locale]/ihr-raum/page.js`, Einbindung in `src/app/[locale]/designermoebel-*/page.js` (bzw. die gemeinsame Vorlage über `src/lib/content/landingPages.js`).
- **Bibliothek:** `react-compare-slider` 3.1.x, MIT, ca. 3 kB gzip, ohne Abhängigkeiten, React 19-tauglich (vor Einbau mit `npm view react-compare-slider peerDependencies` prüfen). Alternativ ohne Bibliothek: `<input type="range">` mit `clip-path`, ca. 40 Zeilen.

### F5 – „Diese Merkliste in meinem Raum“ und Produkt-CTA

- **Nutzen Umsatz:** Die Merkliste ist heute ein Endpunkt. So wird sie zum Einstieg in die Beratung. Erwartet wird eine höhere Anfragequote aus der Merkliste [im A/B-Test messen].
- **Nutzen Ranking:** gering direkt, höhere Verweildauer.
- **Aufwand:** S (1 Tag).
- **Abhängigkeiten:** F1.
- **Dateien:** `src/components/CartPage/CartPage.js` (Button, übergibt `cartItems` per Query oder `sessionStorage`), `src/app/[locale]/produkte/[category]/[product]/page.js` (sekundärer CTA unter „Anfrage“), `src/lib/analytics.js` (Event `select_content` mit `content_type: "raum_48h_cta"`).
- **Bibliotheken:** keine.

### F6 – Social-Media- und Kampagnenbilder aus eigenen Fotos

- **Nutzen Umsatz:** Wöchentliche Beiträge für Instagram und das Google-Unternehmensprofil (Masterkonzept 9: 3.000 → 6.500 Follower, Bericht 25 H3: „wöchentliche Beiträge“) ohne Fotoshooting. Beispiele: ein freigestelltes Showroom-Stück vor einer Bodensee-Szene oder ein Outdoor-Schirm von Tuuci auf einer Hotelterrasse, saisonal (Advent, Frühbucher Outdoor 2027).
- **Aufwand:** S (Workflow „Hintergrund generieren + Produkt einsetzen + Relight“), danach 10 Minuten pro Bild.
- **Abhängigkeiten:** F3 (eigene Fotos). Kennzeichnung „KI-generierter Hintergrund“. Ob das für Werbebilder Pflicht ist, hängt vom Einzelfall ab (Art. 50 Abs. 4: Pflicht bei Darstellungen, die fälschlich echt wirken). Wir kennzeichnen **immer**, so ist man auf der sicheren Seite und es passt zur Marke.
- **Werkzeuge:** SDXL oder Qwen-Image (Apache-2.0) für Hintergründe, IC-Light (Apache-2.0) für passendes Licht am Produkt.

### F7 – Selbstbedienungs-KI-Vorschau auf der Website (Stufe 3, blockiert)

- **Nutzen Umsatz/Ranking:** hoher Wow-Effekt und Presse („erster Einrichter der Region mit KI-Raumvorschau“), Leads rund um die Uhr. Risiko: Bilder mit schlechter Produkttreue schaden der Marke.
- **Aufwand:** L (3–5 Wochen inkl. Moderation, Kostendeckel, Rechtstexte).
- **Abhängigkeiten (alle blockierend):** Bildfreigabe der Marken oder nur eigene Referenzfotos (F3), AVV und Datenschutz-Folgenabschätzung mit Google (Vertex AI, Region `europe-west`) oder BFL/fal, Bot-Schutz, Budget von ca. 100–300 € pro Monat bei 2.000–4.000 Vorschauen, Kennzeichnung im Bild und als Metadaten, Inhaltsfilter (Kundenfotos mit Personen ablehnen).
- **Architektur:** Upload wie F1 → Route Handler startet einen Job beim Anbieter (Webhook oder Polling, da 5–20 s) → Ergebnis in den Speicher → Anzeige mit Hinweis → CTA „Exakte Visualisierung durch unser Team (48 h)“. **Ein Bild pro Sitzung**, nur mit E-Mail-Bestätigung. Der Next-16-Helfer `after()` (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md`) eignet sich zum Protokollieren nach der Antwort, nicht für die eigentliche Generierung (Laufzeitgrenzen des Hosters).
- **Bibliotheken:** `@google/genai` 1.x (Apache-2.0, nur Server) oder `@fal-ai/client` 1.x (MIT, nur Server), `c2pa-node` bzw. `c2patool` (Apache-2.0/MIT) für Herkunftsmetadaten.
- **Lokale GPU als Server?** **Nein.** Ein Büro-PC als öffentlicher Endpunkt (Verfügbarkeit, Sicherheit, Upload-Bandbreite, 8 GB) passt nicht zu einem Team von 5 Personen. Die lokale GPU bleibt Werkzeug, die Cloud übernimmt die Selbstbedienung.

---

## 5. Risiken

### 5.1 Recht

| Risiko | Einordnung | Maßnahme |
|---|---|---|
| **Markenbilder als KI-Vorlage** | Markenfotos sind urheberrechtlich geschützt (Lichtbildschutz § 74 UrhG AT). Einspeisen, Bearbeiten und Veröffentlichen sind Vervielfältigung bzw. Bearbeitung. Der Download-Bereich von Minotti ist Händlern und Architekten vorbehalten. Platzhirsch ist **kein** gelisteter Händler | **Nur eigene Fotos der Ausstellungsstücke** als Referenz (F3). Markenfotos erst mit schriftlicher Freigabe. Das Thema in die Gespräche mit Minotti/Poliform mitnehmen (Masterkonzept Gate 0) |
| **Design- und Markenrecht** | Ein reales Produkt, das tatsächlich verkauft wird, im Raum zu zeigen, ist naheliegend zulässig. Eine **verfälschte** Darstellung mit Markennamen kann irreführend sein (UWG) | Hinweis „Abweichungen möglich“, Produktname nur, wenn das Team die Treue geprüft hat. Keine Formulierungen wie „offizieller Minotti-Händler“ oder „Minotti Visualizer“, sondern „Ihr Raum mit Möbeln aus unserer Ausstellung“ |
| **AI Act Art. 50** (gilt seit 02.08.2026) | Abs. 4: Wer als Betreiber KI-Bilder veröffentlicht, die reale Orte oder Gegenstände täuschend echt zeigen („Deepfake“), muss sie sichtbar kennzeichnen. Abs. 2: Wer selbst ein KI-System anbietet (Stufe 3), muss maschinenlesbar markieren. Der Verhaltenskodex der EU (Entwurf 12/2025) sieht ein einheitliches Symbol vor | **Immer** sichtbarer Hinweis im Bild und im Text. C2PA-Metadaten. Interne Liste der eingesetzten Modelle |
| **DSGVO / Schweizer DSG bei Kundenfotos** | Raumfotos zeigen oft Personen, Familienfotos, Dokumente und durch Fenster die Lage des Hauses. EXIF enthält GPS | Einwilligung mit Zweck, Löschung nach 90 Tagen, EXIF entfernen, Speicher in der EU, Verarbeitung in Stufe 1–2 **lokal**. Bei Cloud (Stufe 3) AVV, Prüfung des Drittlandtransfers (DPF), Opt-out aus dem Modelltraining, Datenschutz-Folgenabschätzung. Datenschutzerklärung `src/components/Datenschutz` ergänzen |
| **Lizenzen der Modelle** | FLUX.1 [dev] Kontext, RMBG-2.0, Depth Anything Base/Large, 4x-UltraSharp und SUPIR sind nicht-kommerziell | Nur die Positivliste aus F2/F3 verwenden, Lizenz-Tabelle im Werkstatt-Ordner pflegen |
| **Haftung und Erwartung** | Kunde kauft wegen des Bildes, das gelieferte Sofa wirkt anders | Hinweis im Angebot, Stoffmuster und Showroom-Termin als Pflichtschritt vor der Bestellung |

### 5.2 Performance

- Die Landingpage bleibt Server-gerendert. Upload-Komponente, Kompression und Turnstile werden **nur dort** und erst bei Interaktion geladen (`next/dynamic`). Das sind ca. 25 kB gzip und nur auf dieser Seite. Auf Produktseiten kommt nur ein Link dazu, also 0 kB.
- Vorher/Nachher-Bilder über `next/image` (AVIF/WebP ist in `next.config.js` schon aktiv) mit `sizes`, damit LCP und CLS stabil bleiben.
- Keine Uploads durch Route Handler oder Server Actions (1-MB-Grenze bei Server Actions, Body-Limits beim Hoster).

### 5.3 Pflege (Team von 5)

- **Stufe 1** hat nahezu keinen Pflegeaufwand an der Website. Der Aufwand liegt beim Erstellen der Bilder (30–60 Minuten pro Auftrag).
- ComfyUI und Custom Nodes nur **eingefroren** betreiben (feste Versionen, Portable-Ordner sichern, Updates einmal pro Quartal). Unkontrollierte Node-Updates sind die häufigste Ursache für kaputte Workflows. Custom Nodes nur aus bekannten Repos, weil sie beliebigen Python-Code ausführen.
- Modelle ändern sich alle 3–6 Monate. Die Werkstatt ist so gebaut, dass das Modell im Workflow austauschbar ist. Website und Kundenprozess bleiben gleich.
- Kostendeckel und Monitoring für Stufe 3 (Budget-Alarm beim Anbieter, Rate-Limit pro IP und E-Mail).

---

## 6. Priorisierte Reihenfolge

### Sofort baubar, ohne Backoffice-Zugang

| # | Feature | Aufwand | Wann | Voraussetzung außerhalb des Codes |
|---|---|---|---|---|
| 1 | **F2 Werkstatt auf der vorhandenen RTX 4060** mit Qwen-Image-Edit (Apache-2.0), SAM 2.1, LaMa, BiRefNet, Real-ESRGAN | M | KW 45–46 | Ordner und Installation auf dem PC, 1 Tag Schulung |
| 2 | **F3 Fototag Showroom:** 30–50 Top-Stücke (Minotti, Poliform, Rimadesio, Outdoor) fotografieren und freistellen | M | KW 46–47 | Lichtecke oder Fotograf (ca. 500–1.000 € pro Tag) |
| 3 | **F1 Landingpage + Upload „Ihr Raum in 48 Stunden“** in 4 Sprachen, Turnstile, EU-Speicher, `trackLead("raum_48h")` | M | KW 46–48, live vor dem Adventsabend (26.11.) | EU-Speicher-Konto, Datenschutztext, Entscheid über die Pauschale |
| 4 | **F5 CTA aus Merkliste und Produktseite** | S | mit F1 | – |
| 5 | **F6 Social-Bilder** aus eigenen Fotos (wöchentlich) | S | ab KW 48 | F3 |
| 6 | **F4 Vorher/Nachher-Galerie** mit den ersten 3–5 freigegebenen Kundenprojekten als statische Daten | S | Januar 2027 | Einwilligungen der Kunden |

### Blockiert oder bedingt

| Feature | Blockiert durch | Ersatz bis dahin |
|---|---|---|
| Eigene Showroom-Fotos auf den **Produktseiten** | Schreibzugang Backoffice (Bildfeld) | Übergabe der Dateien an den Backoffice-Betreiber. Für den Atelierverkauf statisch im Repo |
| Preis in der Visualisierung oder auf der Landingpage („Raum ab … €“) | fehlendes Preisfeld im Backoffice, Freigabe der Marken für Preisangaben | nur die Pauschale als eigener Preis |
| Markenfotos und 3D-Daten als Vorlage | Bildfreigabe bzw. Händlerstatus Minotti/Poliform | eigene Fotos (F3) |
| Online-Zahlung der Pauschale | Zahlungsanbieter (Stripe/Mollie: Vertrag, AGB, Widerrufsbelehrung für Dienstleistungen) | Rechnung nach Lieferung |
| Referenzen als Backoffice-Doctype | Schreibzugang Backoffice | statische Datei `src/lib/content/raumReferenzen.js` |
| **F7 Selbstbedienungs-KI** | Bildfreigabe, AVV/DSFA, Nachfrage-Nachweis (≥ 60 Anfragen aus Stufe 1), Budget | Stufe 1 |
| Schnelle Werkstatt (10–20 s pro Bild), LoRA-Training für FLUX/Qwen | GPU mit 24–32 GB | 8 GB mit Q4 und Geduld, LoRA-Training stundenweise in der Cloud |

### Messgrößen für die Entscheidung über Stufe 3 (nach 6 Monaten)

- Anfragen „raum_48h“ pro Monat (GA4-Key-Event), Anteil mit bezahlter Pauschale
- Abschlussquote und Ø-Auftrag dieser Leads im Vergleich zu normalen Beratungsanfragen (Lead-Herkunft im Backoffice)
- Zeit pro Auftrag im Team, Anteil der Bilder, die bei der Prüfung durchfallen (Produkttreue)

---

## Quellen

- Lokale Prüfung: `nvidia-smi` (RTX 4060, 8.188 MiB), Next.js-16-Doku in `node_modules/next/dist/docs/` (server-actions.md, proxyClientMaxBodySize.md, after.md)
- minotti.com (Download-Bereich nur für Händler/Architekten, kein Konfigurator/AR), hoettges.at (Termin nur per E-Mail), beide geprüft 26.10.2026
- [Wayfair ersetzt Decorify durch Muse (Furniture Today)](https://www.furnituretoday.com/e-commerce/wayfair-retools-its-consumer-ideation-experience-replacing-decorify-with-muse), [Wayfair Decorify](https://www.aboutwayfair.com/category/company-news/wayfair-launches-decorify-a-virtual-room-styler-powered-by-generative-ai), [IKEA Kreativ](https://www.globalbrandsmagazine.com/?p=56875), [REimagine Home Preise (Drittquelle)](https://www.meltflexai.com/blog/how-to-design-your-home-with-ai)
- [fal.ai Preise (Aggregator)](https://pricepertoken.com/fal-ai-pricing), [CostBench fal.ai](https://www.costbench.com/software/ai-media-apis/fal-ai/), [FLUX.2 Developer Guide (fal)](https://fal.ai/learn/devs/flux-2-developer-guide), [BFL Prompting/Editing](https://docs.bfl.ai/guides/prompting_editing_overview)
- [FLUX.1 Kontext dev (BFL)](https://bfl.ai/blog/flux-1-kontext-dev), [BFL: kommerzielle Nutzung](https://help.bfl.ai/articles/3670520907-can-i-use-the-api-for-a-commercial-application), [HF-Diskussion zur Lizenz](https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev/discussions/6)
- [Flux auf 8 GB VRAM mit GGUF](https://evezone.evetech.co.za/build-lab/how-to-run-flux-on-8gb-vram-using-gguf-quantised-models), [ComfyUI Low-VRAM](https://eastondev.com/blog/de/posts/ai/20260721-comfyui-low-vram-acceleration/), [Qwen-Image-Edit-2511 GGUF in ComfyUI](https://www.kombitz.com/2025/12/23/how-to-use-qwen-image-edit-2511-gguf-in-comfyui/), [Comfy-Doku Qwen-Image-Edit-2511](https://docs.comfy.org/zh/tutorials/image/qwen/qwen-image-edit-2511.md)
- [RMBG-2.0 Lizenz (BRIA)](https://github.com/Bria-AI/RMBG-2.0)
- [AI Act Art. 50 erklärt](https://www.learnsignal.com/blog/eu-ai-act-article-50-transparency-labelling-obligations-explained/), [Jones Day zum Entwurf des Verhaltenskodex](https://jonesday.com/en/insights/2026/01/european-commission-publishes-draft-code-of-practice-on-ai-labelling-and-transparency), [medialaws.eu](https://www.medialaws.eu/eu-publishes-the-first-draft-of-code-of-practice-on-marking-and-labelling-of-ai-generated-content/)
- Interne Berichte: 13 (Idee 8, Havenly 159 $/Raum), 15, 23 (Abschnitte 1, 4, 9, 10), 25

**Nicht verifiziert und vor Einsatz zu prüfen:** genaue API-Preise für 10/2026, Lizenztext der Qwen-Image-Edit-2511-Model-Card, Preis der kommerziellen BFL-Lizenz, Lizenzen von BiRefNet und Real-ESRGAN (nach Kenntnis MIT bzw. BSD-3), aktuelle Paketversionen (`npm view <paket> version`).
