# Yacht-Seite: Referenzbilder Minotti × Custom Line Navetta 42 (Inhaber-Vorgabe)

**Stand:** 27.10.2026 · Vorgabe des Inhabers: Die Bilder der Minotti-Referenz „Custom Line Navetta 42“ sollen auf der Yacht-Seite verwendet werden.

- **Quelle:** https://www.minotti.com/de/navetta-42custom-line_2 (9 Bilder, 750–1600 px)
- **Dateien:** `public/labs/yacht/minotti-navetta42/*.jpg` (Originale auch in `Herstellermaterial/Minotti/yacht-navetta42/`)
- **Projekt:** Custom Line Navetta 42 (2018), 41,8 m, Werft Custom Line (Ferretti Group), Exterior Zuccon International Project, Interior Custom Line Atelier, Möbel und Styling Luca Bombassei Studio
- **Minotti-Produkte auf der Yacht:** Outdoor: Rivera, Florida, Bellagio Outdoor, Alison Iroko Outdoor, Cesar Outdoor · Indoor: Lawrence, Lawrence Clan, Jacob, Russell, Freeman, Owens
- **Bildnachweis (Pflicht, sichtbar am Bild):** „Foto: Courtesy of Custom Line · Projekt: Custom Line Navetta 42 · Möbel: Minotti“

## Verwendung auf der Seite
- Als **Referenz „Minotti auf See“**: zeigt, wie die Marken, die wir führen, auf einer Yacht wirken. **Kein Platzhirsch-Projekt** – das muss im Text klar sein („Referenzprojekt von Minotti“), keine Andeutung, Platzhirsch habe die Yacht eingerichtet.
- Bilder **unverändert** (kein Zuschneiden mit Inhaltsverlust, keine Retusche, kein Freistellen – Minotti-Bedingung). Nur proportionales Skalieren und Formatkonvertierung.
- Produkte aus dem Projekt mit unserem Katalog verknüpfen, soweit dort vorhanden.

## Rechte (Rechte-Register)
- Rechteinhaber: Minotti SpA (Website-Bedingungen: Veröffentlichung nur mit schriftlicher Erlaubnis) und Custom Line/Ferretti (Fotos „Courtesy of Custom Line“).
- **Bis zur schriftlichen Freigabe beider bleibt die Seite noindex und Labs-intern.** Der Inhaber holt die Freigaben ein.

## Umsetzung (28.10.2026, Yacht Fix 2)
- **Eingebaut** als Kapitel „Minotti auf See – Custom Line Navetta 42" auf `/de/yacht-interior` (vor den Marken): 5 der 9 Bilder (03 Achterdeck groß, 04 Salon, 05 Lounge, 06 Eignerkabine, 01 Heck von oben). Daten in `src/lib/yacht/navetta.js`.
- Unverändert: `object-contain` im eigenen Seitenverhältnis, nur Skalierung und Formatkonvertierung durch `next/image` (Qualität 90), kein Overlay. Bildnachweis unter jedem Bild, Abgrenzung „Referenzprojekt von Minotti – nicht von Platzhirsch eingerichtet.", kein KI-Etikett.
- Produkte nur als Text („laut Hersteller"), nicht verlinkt: Lawrence, Jacob, Russell, Freeman, Owens, Alison Iroko Outdoor u. a. sind nicht live in `catalog.js` geprüft.
- Seite **noindex**, nicht in Sitemap und llms.txt. Rechte-Register: Status „Freigabe ausstehend".
