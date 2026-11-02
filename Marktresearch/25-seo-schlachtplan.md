# 25 – SEO-Schlachtplan: Platz 1 gegen die Vertragshändler

**Stand:** 26.10.2026 · Grundlage: Website-Code, docs/seo-ux/02-implementation-report.md, Berichte 01, 06, 16, 20, 23
**Ziel:** Bei allen Suchen nach Premium-Marken und Einrichtung im Dreiländereck steht Platzhirsch vor Höttges, reiter design, Dolce Vita, Hutle, Fretz, Gamma, Thöny und wohngefühl. Gesucht wird in Google, Google Maps und KI-Suche.

---

## 1. Ausgangslage: Wo die Vertragshändler vorne liegen und wo nicht

| Faktor | Vertragshändler | Platzhirsch heute | Wer gewinnt das |
|---|---|---|---|
| Link aus dem Händlerverzeichnis der Marke (z. B. minotti.com) | ja, sehr starkes Vertrauenssignal | nein (nur ClassiCon) | Händler, bis der Vertrag steht |
| Google-Bewertungen (Maps) | meist Dutzende | 6, die letzte von 2022 | Händler, schnell aufholbar |
| Inhaltstiefe pro Marke | meist eine Markenseite mit Logo und Text | **1.765 Produktseiten**, davon 487 Minotti | **Platzhirsch** |
| Preise, Verfügbarkeit, Outlet | keiner | noch nicht | wer es zuerst macht |
| Technik (Geschwindigkeit, strukturierte Daten, 4 Sprachen) | durchschnittlich | stark (Relaunch 10/2026) | **Platzhirsch** |
| Antworten auf Kauffragen (Preis, Lieferzeit, Schweiz-Import) | kaum | wenig | wer es zuerst macht |
| KI-Suche (ChatGPT, Perplexity, Google AI) | nicht vorbereitet | llms.txt, JSON-LD vorhanden | **Platzhirsch** |

**Kern der Strategie:** Wo die Händler stark sind (Verzeichnis-Link, Bewertungen), holen wir auf. Wo sie strukturell nicht mithalten können (Inhaltsmenge, Daten, Tempo, Automatisierung), ziehen wir davon. Ein Händler mit fünf Leuten schreibt keine 1.765 Produktseiten mit Preisen, Maßen und Schweiz-Rechner. Wir generieren das aus dem Backoffice.

---

## 2. Die 8 Hebel

### H1 – Produktseiten als Long-Tail-Maschine (größter Vorsprung)
Kaufbereite Kunden suchen nach Modellen: „Minotti Lawrence Sofa“, „Minotti Connery Preis“, „Poliform Ventura Kleiderschrank“, „Rimadesio Velaris“. Vertragshändler haben dafür keine eigenen Seiten.
- Jede Produktseite bekommt: einzigartigen Text (Material, Maße, Varianten, Pflege), „ab“-Preis, Verfügbarkeit („in der Ausstellung zu sehen“), Lieferzeit, Downloads, FAQ, strukturierte Daten `Product` mit `Offer`.
- Kollektionsseiten pro Modellreihe (Hub-Seiten), die alle Varianten bündeln.
- **Voraussetzung:** Preisfeld, Ausstellungs-Flag und Lieferzeit im Backoffice (Frappe).

### H2 – Preise und Google Shopping
- Mit Preisen werden Produkte in Google mit Preis-Snippet angezeigt, kostenlos auch im Shopping-Tab (Merchant Center).
- Kein Wettbewerber der Region zeigt Preise. Wer zuerst Preise zeigt, besetzt diese Plätze.
- Mindestens: „ab“-Preise für Hauptmodelle und echte Preise im Outlet (Ausstellungsstücke).
- Vor dem Start mit den Herstellern klären, was erlaubt ist (UVP, Preisangaben).

### H3 – Google Maps (Local Pack) gewinnen
Bei „Minotti in der Nähe“ und „Designermöbel Bregenz“ zählen vor allem das Google-Unternehmensprofil und die Bewertungen.
- Profil vollständig: Kategorien (Möbelgeschäft, Küchenstudio, Innenarchitekt), Marken als Produkte, Öffnungszeiten, 50+ Fotos, wöchentliche Beiträge.
- **Eine einheitliche Adresse überall** (Hausnummer 9 oder 11 festlegen, auch bei Herold, ClassiCon, Firmenbuch).
- Bewertungen: QR-Karte bei jeder Lieferung, automatische Bitte per E-Mail nach Lieferung, Ziel 30 bis Januar, 150+ bis 2029. **Nur echte Kunden, keine gekauften Bewertungen.**

### H4 – Stadt- und Regionsseiten für drei Länder
Vorhanden: Bregenz, Dornbirn, Lindau, Friedrichshafen, St. Gallen, Bodensee, Vorarlberg.
Ausbauen:
- **Neu:** Liechtenstein/Vaduz, Feldkirch, Rheintal CH (Widnau, Altstätten, Heerbrugg), Appenzell, Ravensburg, Kempten/Allgäu, Konstanz, Arlberg/Lech.
- Pro Seite echter Nutzen statt Austauschtext: Fahrzeit, Lieferung und Steuern für dieses Land, Referenzprojekte aus der Gegend, passende Marken, Termin buchen. Ohne echten Nutzen wertet Google solche Seiten als „Doorway Pages“ ab.
- Marke × Region nur für die wichtigsten Kombinationen (z. B. „Minotti Lindau“, „Poliform Küche St. Gallen“) und nur mit eigenständigem Inhalt.

### H5 – Ratgeber: die Fragen beantworten, die die Händler nicht beantworten
Seiten mit hoher Kaufabsicht, die heute niemand gut beantwortet:
- „Was kostet ein Minotti-Sofa?“ / „Was kostet eine Poliform-Küche?“
- „Möbel in Österreich kaufen und in die Schweiz liefern: MWST, Zoll, Ablauf“ (Grundlage: Bericht 18)
- „Minotti oder B&B Italia?“, „Outdoor-Möbel am See: welches Material?“
- „Lieferzeiten italienischer Designmöbel“
Jede Seite verlinkt auf Produkte und Termin.

### H6 – Schweiz und Liechtenstein gezielt
- Seite mit CHF-Rechner (Endpreis inkl. 8,1 % MWST, Verzollung, Lieferung), Wege A/B aus Bericht 18.
- Schweizer Begriffe verwenden („Stockwerkeigentum“, „Schreiner“, „Offerte“).
- Später prüfen: eigene de-CH-Fassung der wichtigsten Seiten mit hreflang.

### H7 – Autorität aufbauen (Backlinks)
- Händlerverzeichnisse: Listung bei Rimadesio, Tuuci, Paola Lenti, Flos, Treca beantragen (Bericht 16). Jede Listung bringt einen starken Link.
- Architekten-Partner verlinken Referenzprojekte, vai-Mitgliedschaft, Werkraum Bregenzerwald, Partnerhotels, regionale Presse (VN, Schwäbische Zeitung, Tagblatt), Events.
- Eigene Referenzprojekte als Seiten, die Architekten und Hotels gern verlinken.

### H8 – Messen und nachsteuern
- Google Search Console und Bing Webmaster einrichten bzw. prüfen, Rank-Tracking für 50 Kernbegriffe in AT, DE und CH.
- Conversion-Tracking (Anfrage, Anruf, Merkliste, Termin) mit Herkunft im Backoffice.
- Monatlicher Bericht: Rankings, Klicks, Anfragen, Aufträge je Kanal.

---

## 3. Spielregeln (damit uns nichts zurückwirft)

| Nicht tun | Warum |
|---|---|
| „Offizieller/autorisierter Händler“ behaupten ohne Vertrag | Irreführende Werbung nach UWG, Abmahnrisiko, gefährdet die Verhandlung mit Minotti und Poliform |
| Bewertungen kaufen, Mitarbeiter bewerten lassen, Wettbewerber schlecht bewerten | Verstoß gegen Google-Richtlinien und UWG, Profilsperre |
| Markennamen der Wettbewerber als Google-Ads-Keywords mit irreführendem Anzeigentext | Markenrecht |
| Massenhaft gleichartige Stadtseiten | Google wertet sie als Doorway Pages ab |
| Herstellerbilder ohne Freigabe in großem Stil | Urheberrecht; Bildrechte mit den Marken klären |

---

## 4. Umsetzung

### Sprint 1 (diese Woche, im Code)
- [x] Seitentitel der Markenseiten ohne Händler-Behauptung, Suchbegriffe bleiben (Minotti, Poliform, Tonon, next125)
- [x] llms.txt: „Autorisierter Händler“ entfernt
- [ ] Texte aus dem Backoffice prüfen: Felder `dealers_title`/`dealers_description` der Marken (CMS, braucht Backoffice-Zugang)
- [ ] Conversion-Tracking für Formulare, Anrufe, Merkliste
- [ ] Neue Regionsseite Liechtenstein/Vaduz und Rheintal CH

### Sprint 2–3
- [ ] Preisfeld, Ausstellungs-Flag, Lieferzeit im Backoffice; Anzeige auf Produktseiten; `Offer` in JSON-LD
- [ ] Outlet-Seite mit echten Preisen
- [ ] Schweiz-Seite mit CHF-Rechner
- [ ] Erste 5 Ratgeber-Seiten

### Laufend (nicht im Code, Aufgabe für das Team)
- Google-Unternehmensprofil vervollständigen, Bewertungsaktion, Adresse vereinheitlichen
- Listungen bei den Marken beantragen
- Architekten und Presse für Links

**Realistische Erwartung:** Bei Modell- und Ratgeber-Suchen sind erste Plätze in 2–4 Monaten möglich, weil dort kaum Konkurrenz besteht. Bei „Minotti Vorarlberg“ und im Google-Maps-Pack gegen gelistete Händler dauert es eher 6–12 Monate und hängt stark an Bewertungen und am Händlerstatus. Garantien für Platz 1 gibt es bei Google nicht. Mit diesem Plan haben wir aber in jeder Disziplin außer dem Verzeichnis-Link den besseren Auftritt.
