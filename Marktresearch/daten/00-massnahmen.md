# Maßnahmenliste aus Daten-, Performance-, SEO- und Marketing-Audits

Stand: 26.10.2026. Grundlage sind die Berichte in `Marktresearch/daten/` und die neuen Dateien in `Marktresearch/marketing/` (Liste am Ende). Diese Datei fasst nur zusammen. Zahlen und Belege stehen in den Einzelberichten.

**Verantwortliche:** Code-Team (Website-Code unter `src/`), Backoffice-Team (Datenpflege in Frappe), Inhaber (Entscheidungen, Freigaben, Verträge, Lieferantenkontakt), Marketing (Content, Kanäle, Kampagnen).
**Aufwand:** S = bis 1 Tag, M = 2–5 Tage, L = mehr als 1 Woche. **Wirkung:** hoch / mittel / gering. Beides ist eine Einschätzung und nicht gemessen.

---

## 1. Sofort (bis Ende KW 45): Rechtsrisiken und Schäden im Google-Index

| # | Maßnahme | Bereich | Verantwortlich | Aufwand | Wirkung | Quelle |
|---|---|---|---|---|---|---|
| 1 | „(Ihr) offizieller Händler“ aus allen Markentexten streichen. Betroffen sind mindestens Minotti, Gloster und alle acht Marken N–R, z. B. Poliform und Rimadesio. Danach alle Marken A–Z per Suche auf „Händler“, „autorisiert“ und „offiziell“ prüfen | Backoffice-Daten | Backoffice-Team, Freigabe Inhaber | S | hoch (Abmahnrisiko) | G-M, N-R, Masterkonzept |
| 2 | Produkte ohne Bild für Google sperren oder deaktivieren, bis Bilder da sind: Brand van Egmond (111), Next125 (13), Quasar (13 von 14), Poliform ohne Bild, Umbrosa Eclipsum, Flos-Altdatensätze (Aim, Taraxacum, Arrangements, Randoo) | Backoffice-Daten + Website-Code | Backoffice-Team (Status), Code-Team (automatisches `noindex` bei 0 Bildern) | S–M | hoch | A-F, N-R, S-Z |
| 3 | Marken mit 0 Produkten aus dem Index nehmen oder ausblenden: Agape, Antoniolupi, Bombyxx, Bullfrog, EMU, Frost, Gloster, Lambert, Papadatos, Pomax, Qeeboo, Tom Dixon, Tonon, Trapa. Tom Dixon hat fälschlich den Status „hat Produkte“. Am besten automatisch über eine Regel „0 Produkte = noindex“ | Website-Code + Backoffice-Daten | Code-Team, Backoffice-Team | S | mittel | alle Katalog-Audits |
| 4 | Treca-Fremdbild (50×50 px) aus 40 Galerien entfernen, die 7 Rimadesio-Bilder mit Fehler 404 entfernen und die Banner von Schüller Varese und Vicenza (404) ersetzen | Backoffice-Daten | Backoffice-Team | S | mittel | N-R, S-Z |
| 5 | Neue Regionsseiten (8) in `landingPages.js` und in die Sitemap eintragen. Presse-Seite `/de/ueber-uns/presse` gegen 500-Fehler absichern | Website-Code | Code-Team | S | mittel | SEO-Audit |
| 6 | Hausnummer Landstraße 9 oder 11 entscheiden und überall gleich führen: Impressum, Google-Profil, Herold, Händlerlisten. Vorher kein neues Material mit Adresse veröffentlichen | Content | Inhaber (mit Steuerberater) | S | hoch (lokales SEO) | google-unternehmensprofil.md |
| 7 | Platzhalter für den Adventsabend am 26.11. füllen: Uhrzeit, öffentlich oder auf Einladung, Anmeldelink, Café-Kooperation. Die Einladung ist für den 05.11. geplant, der Instagram-Plan startet am 02.11. | Content | Inhaber, Marketing | S | hoch (zeitkritisch) | instagram-90-tage-plan.md, email-flows.md, firmengeschenke-advent-2026.md |

## 2. Kurzfristig (November 2026): Katalogqualität und Tracking

| # | Maßnahme | Bereich | Verantwortlich | Aufwand | Wirkung | Quelle |
|---|---|---|---|---|---|---|
| 8 | Flos-Dubletten bereinigen (5 Datensätze, deren Namen sich nur durch „/“ oder „-“ unterscheiden, z. B. 2097-18 und 2097/18) und die 4 Altdatensätze aufräumen. Dazu 301-Weiterleitungen von den alten Adressen | Backoffice-Daten + Website-Code | Backoffice-Team, Code-Team (Redirects) | M | mittel | A-F |
| 9 | Minotti: die 84 Platzhalternamen wie „Superquadra (Variant)“ nach dem Muster „Modell + Typ“ benennen und die rund 30 falschen Kategorien korrigieren. Das löst auch die 85 doppelten Seitentitel | Backoffice-Daten | Backoffice-Team | M | hoch (größte Marke, 487 Produkte) | G-M |
| 10 | Falsche Kategorien und Stammdaten korrigieren: Heatsail „Leaf“ (Beschattung) aus den Heizstrahlern nehmen, „Graphis light“ (Schiebetürsystem) aus den Leuchten, Designer bei „Mad Queen“ korrigieren, „Dorsoduro“ prüfen, Rimadesio-Namen wie „Rialto (Rialto 3)“ bereinigen. Bei Treca Unterkategorien für Matratzen, Kopfteile und Bettfüße anlegen (80 von 96 Produkten stehen bei „beds“) | Backoffice-Daten | Backoffice-Team | M | mittel | G-M, N-R, S-Z |
| 11 | Maß-Parser für die Formate von Sifas, Solpuri und Tuuci erweitern (133 Produkte ohne Maße-Tab, obwohl Maße hinterlegt sind) | Website-Code | Code-Team | S–M | mittel | S-Z |
| 12 | Maße einheitlich metrisch erfassen. Bei Sifas Zoll- und lbs-Angaben ersetzen (27 Produkte) und unplausible Werte bei Kross, Oskar und Komfy korrigieren | Backoffice-Daten | Backoffice-Team | M | mittel | S-Z |
| 13 | Tracking-Fundament: `gtag.js` auch bei reiner Marketing-Einwilligung laden, Google-Ads-Tag ergänzen, `transaction_id` (= `lead_ref`) an `generate_lead` hängen. Consent-Banner um Meta Pixel und Pinterest Tag erweitern, die erst nach Einwilligung laden. Dies ist Voraussetzung für jede bezahlte Kampagne | Website-Code | Code-Team | M | hoch | google-ads-kampagnen.md, meta-pinterest-kampagnen.md |
| 14 | Alle Links mit UTM-Parametern versehen und die Herkunft jeder Anfrage im Backoffice als Feld erfassen | Backoffice-Daten + Marketing | Backoffice-Team, Marketing | S | hoch (Messbarkeit) | Instagram-Plan, Social-Plan, email-flows.md |
| 15 | Google-Unternehmensprofil nach dem Content-Paket pflegen: Kategorien, Leistungen, Sonderöffnungszeiten, 26 Beiträge, 15 Fragen und Antworten. Bewertungsbitte an alle Kunden, ohne Filter und ohne Anreiz (QR-Karte) | Content | Marketing, Freigabe Inhaber | M | hoch | google-unternehmensprofil.md, qr-karte-bewertung.md |

## 3. Mittelfristig (Dezember 2026 bis Februar 2027): Performance, SEO-Struktur, Inhalte

| # | Maßnahme | Bereich | Verantwortlich | Aufwand | Wirkung | Quelle |
|---|---|---|---|---|---|---|
| 16 | Navbar und Footer als Server Components rendern, nur die interaktiven Teile im Client (`client-layout.js`, `navbar.js`, `Footer.js`). Das ist der Hauptgrund für den mobilen LCP von 3,2–4,0 s | Technik | Code-Team | M | hoch (mobile Leistung) | performance-live.md |
| 17 | Nur die benötigten Übersetzungen an den Client geben, statt die ganze `de.json` (55 KB) auf jeder Seite. Schriften verschlanken (173 KB): Bodoni-Achse, `latin-ext`, Preload | Technik | Code-Team | M | mittel | performance-live.md |
| 18 | Auslöser für `no-store` beim HTML trotz `revalidate` finden (`detectLocale.js`, `fetchAllProdukte.js`) und die erste Kachel auf `/de/produkte` nicht lazy laden (`shopCategoryGrid.js`, Z. 48) | Technik | Code-Team | S–M | mittel | performance-live.md |
| 19 | Globalen React-Fehler „state update … hasn't mounted“ im gemeinsamen Layout beheben | Technik | Code-Team | S | gering bis mittel | performance-neu.md |
| 20 | Kategorien crawlbar über eigene Pfade paginieren statt über `?`-Parameter (`shopCatalog.js`, Z. 72). Heute haben 60 von 104 geprüften Produktseiten keinen internen Link | Website-Code | Code-Team | M | hoch (Indexierung der rund 1.760 Produktseiten) | seo-audit-bestand.md |
| 21 | Kategorien und Beratungsseite um 150–300 Wörter Text, Marken-Links und FAQ ergänzen (`shopSeoCopy.js`). Kollektionsseiten ausbauen oder auf `noindex` setzen (`collectionPage.js`) | Website-Code + Content | Code-Team, Marketing (Texte) | M | hoch | seo-audit-bestand.md |
| 22 | Titel kürzen (107 von 314 sind länger als 60 Zeichen, `shopSeoCopy.js` Z. 84–85, `productMetaTitle`). Kontextlinks setzen: News zu Marken, Marken zu News und Produkten, Landingpages zu Ratgebern | Website-Code + Content | Code-Team, Marketing | S–M | mittel | seo-audit-bestand.md |
| 23 | Ratgeber-Bereich `/de/ratgeber/` mit den 8 Ratgebern veröffentlichen. 19 Pins und 7 Videos verlinken darauf, die Seite gibt es live noch nicht | Content + Website-Code | Marketing, Code-Team | M–L | hoch | social-linkedin-pinterest-youtube.md |
| 24 | Bilder: Paola Lenti ein großes Bild an erste Stelle setzen (alle 100 beginnen mit 720 px). Poliform (72 % unter 1.200 px) und Rimadesio (60 %) in voller Auflösung neu hochladen. Heatsail auf mindestens 2.000 px mit mehreren Ansichten bringen, Bilder für Brand van Egmond, Next125, Quasar und Eclipsum beschaffen | Backoffice-Daten | Backoffice-Team, Inhaber (Anfrage bei Herstellern) | L | hoch | A-F, G-M, N-R, S-Z |
| 25 | Poliform: die richtigen Datenblätter zuordnen. Heute hängt dasselbe PDF an 32 Produkten, nur 5 haben ein eigenes | Backoffice-Daten | Backoffice-Team | M | mittel | N-R |
| 26 | Varianten zusammenführen: Eichholtz Lounge Club (11), ClassiCon Bow/Cypris (5), Farbvarianten von 101 Copenhagen. Dazu Weiterleitungen | Backoffice-Daten + Website-Code | Backoffice-Team, Code-Team | M | mittel | A-F |
| 27 | Eigene Texte statt kopierter Herstellertexte: 22 Eichholtz-Texte („Wir präsentieren …“), 113 wortgleiche Beschreibungen, Minotti-Langtexte (20–57 % wortgleich mit minotti.com). Technische Daten von 77 Eichholtz-Produkten auf EN/FR/IT übersetzen | Content | Marketing, Backoffice-Team (Eingabe) | L | mittel | A-F, G-M |
| 28 | Top-50-Modelle von Minotti pflegen (u. a. Lawrence, Connery, Hamilton, Andersen, Torii): Designer, Maße, Material, eigener Text. Heute fehlt bei 94 % der Designer und bei 99,6 % fehlen Maße | Backoffice-Daten + Content | Backoffice-Team, Marketing | L | hoch | G-M |
| 29 | Heatsail-Leistungsdaten ergänzen (vor der Wintersaison), bei Umbrosa die Schirmgrößen ergänzen und klären, ob ältere Modelle ohne UX/PX noch lieferbar sind. Flos Rosy Angelis und Ray beim Vertrieb klären | Backoffice-Daten | Backoffice-Team, Inhaber (Lieferantenfrage) | M | mittel | G-M, S-Z, A-F |

## 4. Sortiment und neue Felder (ab Januar 2027, nach Entscheidung Inhaber)

| # | Maßnahme | Bereich | Verantwortlich | Aufwand | Wirkung | Quelle |
|---|---|---|---|---|---|---|
| 30 | Outdoor-Lücke schließen: Minotti Outdoor, Tuuci-Sonnenschirme (Marine-Linie für Yacht-Interior), Gloster. Nur aufnehmen, was tatsächlich bezogen wird | Backoffice-Daten | Inhaber (Entscheidung), Backoffice-Team | L | hoch (Outdoor-Saison 2027) | G-M, S-Z |
| 31 | Leere Marken mit einer Kernkollektion füllen (z. B. Tom-Dixon-Leuchten) oder deaktivieren | Backoffice-Daten | Inhaber, Backoffice-Team | L | mittel | A-F, S-Z |
| 32 | Binni: Modellliste mit eindeutiger Bildzuordnung, Front, Oberfläche, Farbcodes, Raster und Beschläge anfordern. Für den Stein Sortennamen, Formate, Stärken und Preise pro m² anfordern. Schriftliche Bildfreigabe für Web, Print und KI einholen, CAD- und 3D-Daten anfordern. Klären, welche Möbel Binni selbst baut. Ohne diese Daten gibt es keinen Konfigurator, keine Landingpage und keine Binni-Anzeigen | Inhaber-Aufgabe | Inhaber | M | hoch (Voraussetzung für die Binni-Linie) | binni-produkte.json |
| 33 | Labs vor dem Livegang verschlanken: 3D im Küchenplaner erst nach Klick laden (+928 KB), zod nur auf dem Server einsetzen, motion durch CSS ersetzen oder erst bei Bedarf laden. Automatische Größenprüfung einbauen (Produktions-Build und Bundle-Analyse, Abbruch bei mehr als 190 KB bzw. mehr als 10 KB je Feature). Bei Vorschau-Designs die Schriften ersetzen statt neue hinzuzufügen | Technik | Code-Team | M–L | hoch für die Labs | performance-neu.md |
| 34 | Bildpipeline nutzbar machen: Visual-C++-Runtime einmal per Admin installieren, Bodenschatten und AVIF/WebP-Ausgabe ins Freistell-Skript einbauen. Pro Marke klären, ob Herstellerbilder bearbeitet werden dürfen. Höchstens 2x hochskalieren und jedes Ergebnis vor der Übernahme prüfen | Technik | Inhaber (Admin, Rechte), Code-Team | S–M | mittel | gpu-pipeline.md |

## 5. Marketing (Kanäle und Kampagnen)

| # | Maßnahme | Verantwortlich | Aufwand | Wirkung | Quelle |
|---|---|---|---|---|---|
| 35 | Drehtage bündeln: ein Drehtag pro Monat im Showroom, der Material für Instagram, Pinterest, YouTube und Meta liefert. Für den Instagram-Plan sieben Drehtage, der erste in KW 44 | Marketing, Inhaber | M | hoch | Instagram-Plan, Social-Plan, meta-pinterest-kampagnen.md |
| 36 | LinkedIn-Posts L01–L04 sofort veröffentlichen, der Inhaber teilt sie. Der Instagram-Plan startet am 02.11. Am 14.12. die Hooks auswerten | Marketing, Inhaber | S | mittel | social-linkedin-pinterest-youtube.md, Instagram-Plan |
| 37 | Freigaben vor Veröffentlichung: Binni-Beiträge erst nach Vertrag und Bildfreigabe, Beiträge zu Garten und Yacht erst nach der jeweiligen Rechts- bzw. Marktrecherche, Referenzen nur mit Zustimmung, Einwilligungen des Teams einholen | Inhaber | S | hoch (Risiko) | Instagram-Plan, Social-Plan |
| 38 | E-Mail-Flows (Willkommensserie, Nachfassen, Bewertungsbitte, Adventsmailing) vor dem ersten Versand mit dem Anwalt abstimmen. Gilt besonders für § 174 TKG ohne B2B-Ausnahme und den ECG-Listenabgleich. Danach im Newsletter-Werkzeug anlegen | Marketing, Inhaber (Anwalt) | M | hoch | email-flows.md |
| 39 | Firmengeschenke Advent: Konten bei Ankorstore und Faire anlegen, EK und Lieferzeit je Position eintragen, Minotti-Kissen bis 10.12. bestätigen, erst dann die Preise im PDF festlegen. Die Ansprache der 40 Zielfirmen rechtlich prüfen | Inhaber, Marketing | M | mittel (zeitkritisch) | firmengeschenke-advent-2026.md |
| 40 | Bezahlte Kampagnen (Google Ads: 11 Kampagnen, Stufe 1 1.650 €/Monat; Meta 1.000 €; Pinterest 150 €) erst nach Gate 0 (Liquidität), funktionierendem Tracking (#13), Konten im Firmenbesitz und Freigabe aller Anzeigentexte durch den Inhaber. CH-Ost und FL bleiben pausiert, bis Zoll, MWST und CHF-Preise geklärt sind. Die Binni-Anzeigengruppe startet erst mit eigener Landingpage | Inhaber, Marketing, Code-Team | M | hoch (nach Gate 0) | google-ads-kampagnen.md, meta-pinterest-kampagnen.md |
| 41 | Architektenprogramm: Antrag auf vai-Mitgliedschaft in KW 46, Unterlagen fertigstellen, Welle 1 der 50 Büros ab Januar 2027, Lochauer Gespräche 2027, Einladung zur Salone-Reise im Dezember. Die Partnerseite `/architekten` geht erst nach Gate 0 live. Konditionen legt der Inhaber fest | Inhaber, Marketing, Code-Team (Seite) | L | hoch (B2B) | architekten-programm.md |
| 42 | Lieferablauf für Schweiz und Liechtenstein (Zoll, MWST, CHF, Rechnung ohne USt.) mit Steuerberater und Zollspediteur klären. Davon hängen Anzeigen, Google-Profil, Firmengeschenke und Social-Inhalte ab | Inhaber | M | hoch | mehrere |

---

## Reihenfolge in einem Satz

Zuerst Rechtsrisiken und Index-Schäden beseitigen (#1–#7). Danach Katalogdaten und Tracking in Ordnung bringen (#8–#15). Dann folgen Performance und SEO-Struktur im Code (#16–#23) parallel zur Bildbeschaffung und Datenpflege (#24–#29). Bezahlte Kampagnen starten erst nach Gate 0 und #13.

## Hinweise zur Belastbarkeit

- Die SEO-Prioritäten (Umbrosa, Tuuci-Schirme, Treca-Matratzen) beruhen auf Einschätzung. Suchvolumina wurden nicht erhoben.
- Lighthouse lief je URL nur einmal, die Werte schwanken. Die Messung der Labs lief im Dev-Modus, dort sind nur relative Werte aussagekräftig.
- Die Follower-Prognose für Instagram (1.100–1.300) ist eine Schätzung.
- Eindeutig ausgelaufene Modelle wurden in keinem Audit gefunden.

## Quelldateien

Daten: `katalog-audit-A-F.md`, `katalog-audit-G-M.md`, `katalog-audit-N-R.md`, `katalog-audit-S-Z.md`, `performance-live.md`, `performance-neu.md` (+ `performance-neu-messskript.mjs`), `seo-audit-bestand.md`, `binni-produkte.json`, `gpu-pipeline.md` (Skripte unter `C:/Users/admin.local/Documents/platzhirsch-gpu-tools/scripts/`).

Marketing (`Marktresearch/marketing/`): `instagram-90-tage-plan.md`/`.csv`, `social-linkedin-pinterest-youtube.md`, `google-ads-kampagnen.md` (+ `ads-csv/`), `meta-pinterest-kampagnen.md`, `google-unternehmensprofil.md`, `email-flows.md`, `firmengeschenke-advent-2026.md`, `architekten-programm.md`, `qr-karte-bewertung.md`.
