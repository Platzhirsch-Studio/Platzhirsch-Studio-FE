# Wachstumsrat: Plattform, Unicorn und digitale Geschäftsmodelle (Kürzel `unicorn`)

**Gremium:** M&A-Beratung, Unicorn-Builder, Experten für digitale Geschäftsmodelle · **Stand:** 28.10.2026 · **Status:** Gutachten, am Code wurde nichts geändert, keine Formulare abgesendet

**Grundlagen:** 21 (Finanzierung, UiS, aws), 23 (Masterkonzept, §5.5 und §11), 26 (Binni), 27/28 (Beirat, Unicorn-Pfad §3), wachstum/08 (Unicorn-Growth), wachstumsrat/hotel-contract, Inhaber-Entscheidungen vom 26./28.10.2026. Dazu der Code (nur gelesen): `src/lib/kuechenplaner`, `src/lib/sofaplaner`, `src/lib/portal`, `src/lib/concierge`, `package.json`. Neue Webrecherche mit Quellen am Ende.

**Kennzeichnung:** **[belegt]** Quelle verlinkt · **[Schätzung]** eigene Herleitung, Rechenweg daneben · **[prüfen]** offen · **[anwaltlich/steuerlich prüfen]** keine Rechts- oder Steuerberatung. Alle Zahlen zu Platzhirsch selbst sind Schätzungen, solange die Buchhaltung fehlt (Gate 0, 23).

**Regeln für Texte:** Händler-Aussagen nur für **ClassiCon** und **Ezarri**. Keine Superlative, keine „Unicorn“-Kommunikation nach außen.

---

## 1. Urteil zum Ist-Stand

| Bereich | Note (1–10) | Begründung |
|---|---|---|
| Plattform-Reife des Geschäfts | **2** | Ein Standort, ein Team, Umsatz ca. 1,0–2,5 Mio. € p. a. [Schätzung, 01], EK 2024 −2,67 Mio. € (01). Kein Netzwerkeffekt, keine wiederkehrenden Erlöse, keine eigenen Daten mit Wert für Dritte. |
| Wiederverwendbarkeit der Software | **5** | Der Code ist gut geschnitten: Küchenplaner (`bom.js`, `checks.js`, `norms.js`, `planview.js`), Portal (Magic Link, Rate-Limit, Datenschutz-Schicht) und Concierge (Anthropic-SDK) sind **fachlich generisch**. Der Sofaplaner hängt an Minotti-Daten (`minotti-data.js`, `minotti-covers.json`) und ist **nicht lizenzierbar**. Die Ezarri-Inhalte sind für Platzhirsch freigegeben, nicht für Weitergabe an Dritte. Eigentum am Code (wer hat ihn beauftragt, welche Gesellschaft hält die Rechte) ist **nicht dokumentiert** [prüfen]. |
| Finanzierbarkeit einer Plattform | **2** | Die MW GmbH ist sehr wahrscheinlich „Unternehmen in Schwierigkeiten“ (21, B1). Förderungen, Angels und RBF gehen nur über eine **neue, saubere Gesellschaft**, und selbst dort gelten Unabhängigkeitsregeln (Abschnitt 4). |
| Strategische Ausgangslage für eine *kleine* Plattform | **5** | Echte Bausteine: Ezarri und ClassiCon als Vertragshändler, Binni-Manufaktur ohne Bildfreigabe-Hürde (26), Hotel-Pipeline (22), Dreiländereck, Café als Vorzeige-Gastro-Raum, ein Digital-Team, das Werkzeuge schneller baut als jeder regionale Wettbewerber. |
| **Gesamt** | **3/10** | Ein Unicorn ist ausgeschlossen (Rechnung in 27 §3.1, bestätigt in 28: Faktor 400–1.500). Eine **kapitalarme Plattform-Option** ist möglich, aber nur als Netzwerk-/Orchestrierungsmodell und als B2B-Werkzeugdienst für Hersteller, nicht als SaaS für andere Händler und nicht als Marktplatz. |

**Unterschied zu 08 und 27:** Beide nennen den „Software-Spin-off“ Hype. Das Gremium stimmt für **SaaS an Händler** zu. Es sieht aber eine engere, zahlende Variante: **Konfigurator- und Portal-Werkzeuge im Auftrag von Herstellern und Manufakturen**, die ohnehin für Platzhirsch gebaut werden (Binni, Ezarri-ähnliche Hersteller). Das ist Dienstleistung mit Lizenz-Anteil, kein Venture-Case.

---

## 2. Befunde und Chancen

### 2.1 Die vier Plattform-Ideen im Test

| Idee | Urteil | Warum |
|---|---|---|
| **A. Planungs-Software als SaaS für andere Händler** | **Nein** | Der Markt ist besetzt und konsolidiert: Cyncly (aus Compusoft und 2020 fusioniert, nach eigenen Angaben > 70.000 Kunden weltweit; Winner Flex im DACH-Küchenhandel) [belegt, Herstellerangabe], pCon (EasternGraphics) im Möbelhandel, Roomle (Linz), 2021 zu 80 % an HOMAG [belegt, 08]. Händler zahlen für Hersteller-Kataloge (IDM-Daten), nicht für eine Oberfläche. Ein Platzhirsch-Planer ohne Katalogdaten der großen Küchenhersteller ist für einen Händler wertlos. Vertrieb an Wettbewerber im eigenen Gebiet ist zudem ein Interessenkonflikt. |
| **B. Marktplatz für Showroom-Händler DACH** | **Nein** | Henne-Ei-Problem in zwei Richtungen; Premium-Marken steuern über Händlerverträge, wer online wie verkauft; selbst 1stDibs verliert nach > 20 Jahren Geld (2025: 89,6 Mio. $ Umsatz, 13,7 Mio. $ Nettoverlust) [belegt, 08]; home24 ging an XXXLutz [belegt, 08]. Mit −2,67 Mio. € EK kein Kapital für den Kaltstart. |
| **C. White-Label-Konfiguratoren und Kundenportal für Hersteller und Manufakturen** | **Ja, als Option 1** | Kunden sind **Hersteller ohne gute Online-Werkzeuge** (Binni, Steinmanufakturen, Pool- und Mosaikverleger, Outdoor-Manufakturen, Tischler mit Serienmöbeln). Sie zahlen für Setup und Betrieb. Der erste Kunde (Binni) ist bereits in Verhandlung (26, 08 Idee D'). Die Werkzeuge entstehen ohnehin für Platzhirsch, die Grenzkosten pro weiterem Kunden sind niedrig. |
| **D. Contract-Plattform (Hotel, Chalet, Yacht, Gastro)** | **Ja, als Option 2 und größter Hebel** | Hotels kaufen keine Software, sondern **einen Ansprechpartner für viele Gewerke**. Ein kuratiertes Netzwerk regionaler Partner mit digitalem Projektraum (vorhandenes Portal) macht Platzhirsch zum Orchestrator. Umsatz wächst mit Projekten der Partner, nicht nur mit eigener Ware. Grenze: **Koordination, keine Bauleitung, kein Generalunternehmer** (hotel-contract §2.3). |

Weiterhin gilt der in 08 §3.2 beschriebene dritte Weg: die **Binni-Eigenmarke über 5–15 Partner-Studios** ab 2029. Option 1 liefert dafür das Partner-Portal und den Konfigurator, Option 2 die Projektnachfrage. Die drei Wege sind **eine Plattform-Logik**: Werkzeuge (1) → Projekte (2) → Marke über Partner (08).

### 2.2 Was die Software wirklich wert ist

| Baustein im Code | Generisch? | Rechte | Einsatz in Option 1 |
|---|---|---|---|
| Küchenplaner (`src/lib/kuechenplaner`: Raum, Layout, Stückliste, Normprüfung, Vergleich, Verlauf) | ja | Code-Eigentum klären [prüfen] | Kern des Binni-Konfigurators und jedes weiteren Küchen-/Möbelherstellers |
| Kundenportal (`src/lib/portal`: Magic Link, Session, Store, Datenschutz, Mailer, Adapter) | ja | wie oben | Projektraum für Contract (Option 2) und Partner-Portal (08 Stufe 3) |
| Concierge (`src/lib/concierge`, Anthropic-SDK) | ja | Modellnutzung pro Mandant, AVV je Kunde | Beratungs-Chat pro Hersteller, nur mit eigener Wissensbasis des Kunden |
| Sofaplaner (`src/lib/sofaplaner/minotti*`) | nein | Minotti-Daten gehören Minotti, kein Händlerstatus Minotti | **nicht** verwerten, nur Geometrie-/Material-Engine (`geometry.js`, `materials.js`) als Muster |
| Ezarri-Konfigurator (entsteht) | Engine ja, Inhalte nein | Nutzungserlaubnis gilt für Platzhirsch | Engine für andere Mosaik-/Fliesen-Hersteller nur mit **eigenem** Content des Kunden; Ezarri selbst als Kunde möglich [prüfen im Gespräch] |
| Dreiländer-Rechner (`src/lib/ch`) | regional | eigener Inhalt | Modul für Partner im Dreiländereck |

**Bewertung [Schätzung]:** Als Asset für einen Käufer ist der Code heute 0–150 T€ wert (Wiederbeschaffung durch Freelancer bzw. Agenten-Team, ohne Kunden, ohne wiederkehrenden Umsatz). Der Wert entsteht erst durch **zahlende Mandanten und Verträge**.

### 2.3 Lehren aus Vergleichsfällen

- **Roomle:** spezialisiertes Team ab 2014, Investoren aws Gründerfonds und OÖ HightechFonds, Exit an HOMAG 2021 mit ca. 20–26 Mitarbeitenden [belegt, 08]. Lehre: Konfigurator-Software wird an **Hersteller-/Maschinenkonzerne** verkauft, nicht an Händler. Ein späterer Exit von Option 1 hätte genau diese Käufergruppe.
- **Havenly:** der bezahlte Designservice wurde zum Vertriebskanal und später zum Käufer von Burrow und Interior Define [belegt, 08]. Lehre: der **Service ist die Plattform**, Software nur das Werkzeug. Das stützt Option 2.
- **Made.com, Interior Define:** Wachstum mit Vorfinanzierung von Fabriken führte in die Liquiditätsfalle [belegt, 08]. Lehre: keine Vorfinanzierung im Contract, Zahlungen über Leasing und Anzahlungsgarantie.

---

## 3. FERTIGE Bausteine

### 3.1 Option 1 – „Werkstatt Digital“: Konfiguratoren und Portale für Hersteller (Arbeitsname)

**Leistungsversprechen (Text für Angebot und Pitch an Hersteller):**
> Wir bauen Ihren Online-Konfigurator und Ihr Kundenportal auf einer Plattform, die im eigenen Einrichtungsstudio täglich im Verkauf läuft: Planung im Browser mit Stückliste und Plausibilitätsprüfung, Preisrahmen nach Ihren Regeln, Anfragen mit vollständigen Plandaten direkt an Sie oder Ihre Händler, mehrsprachig für Österreich, Deutschland, Schweiz und Liechtenstein. Einrichtung in 8–12 Wochen, danach monatlicher Betrieb mit Updates.

**Kunden-Segmente, nach Passung:**

| # | Segment | Beispiel aus dem Umfeld | Schmerz | Passung |
|---|---|---|---|---|
| K1 | Manufaktur mit Exportwunsch | Binni (Kosovo, Steinküchen, 26) | kein Online-Vertrieb in DACH | A, Pilot |
| K2 | Regionale Tischler mit Serienmöbeln | Tischler-Liste aus 19 | keine Online-Planung, Anfragen ohne Maße | A |
| K3 | Mosaik-, Naturstein-, Poolverleger | Ezarri-Verlegepartner der Region [prüfen] | Kunde kann sich Pool/Bad nicht vorstellen | B |
| K4 | Outdoor- und Licht-Manufakturen | aus 30 (Outdoor) | lange Beratung vor jeder Anfrage | B |
| K5 | Hersteller selbst (z. B. Ezarri für DACH-Händler) | nur nach Gespräch | Händler brauchen ein einheitliches Werkzeug | C, Chance [prüfen] |

**Preismodell [Schätzung, im Markt testen]:**

| Paket | Setup einmalig | Betrieb pro Monat | Variabel |
|---|---|---|---|
| Basis (1 Produktfamilie, 2 Sprachen, Anfrage-Weiterleitung) | 12–18 T€ | 400–700 € | – |
| Pro (mehrere Familien, Preisrahmen, Stückliste, Portal, 4 Sprachen) | 25–40 T€ | 900–1.800 € | – |
| Partner (Händlernetz mit Logins, Lead-Routing nach PLZ) | 35–60 T€ | 1.500–3.000 € | optional 1–2 % Erfolgsprovision auf vermittelte Aufträge [anwaltlich prüfen: Maklerrecht/Provisionsregeln] |

**Zahlenlogik Option 1 [Schätzung]:**

| Kennzahl | M12 (Okt. 2027) | M24 (Okt. 2028) | Rechenweg |
|---|---|---|---|
| Zahlende Mandanten | 3 (Binni + 2) | 8 | 1 Abschluss pro Quartal ab Q2 2027, ab 2028 1 pro 6–8 Wochen |
| Setup-Umsatz im Jahr | 50–90 T€ | 120–220 T€ | Ø 20–30 T€ je Neukunde |
| Wiederkehrend (MRR am Periodenende) | 2,5–4 T€ | 8–14 T€ | Ø 1,0–1,7 T€ je Mandant |
| Umsatz im Jahr gesamt | 60–110 T€ | 190–330 T€ | Setup + 12 × Ø MRR |
| Kosten | 70–110 T€ | 160–240 T€ | 1 technische Leitung (0,5 → 1 FTE, 75–95 T€ Vollkosten/FTE), Hosting und KI-Kosten 5–10 % vom Umsatz, Vertrieb durch GF/Inhaber |
| Ergebnis | ca. −20 bis +20 T€ | ca. +10 bis +90 T€ | |
| Nutzen für Platzhirsch selbst | Konfiguratoren für Binni-Linie und eigene Seite zu Teilkosten | Partner-Portal für 08 Stufe 3 | Kostenteilung |
| Unternehmenswert | gering | 0,3–1,0 Mio. € | 3–6 × ARR (96–168 T€) für kleine, profitable B2B-Software in Nischen [Annahme, mit M&A-Vergleichen prüfen] |

**Ehrliche Grenze:** Option 1 bringt **keinen** nennenswerten Beitrag zum Ziel 1 Mio. € pro Monat. Ihr Wert ist: (a) Platzhirsch-Werkzeuge werden mitfinanziert, (b) Bindung von Binni und weiteren Herstellern, (c) ein verkaufbarer Baustein mit eigenem Cap Table, (d) Förderfähigkeit über eine junge, saubere GmbH.

### 3.2 Option 2 – „Bodensee Contract Collective“: Orchestrierungsplattform für Hotel, Chalet, Gastro, Yacht (Arbeitsname)

**Modell:** Platzhirsch kuratiert ein Netzwerk von 10–20 regionalen Partnern (Tischler, Binni für Küchen, Ezarri-Verlegepartner für Pool/Spa, Outdoor-Gewerke, Licht, Textil, Polsterei) und bietet Hotels **einen Ansprechpartner** von Konzept über Handzeichnung, 3D und Musterzimmer bis zur koordinierten Montage. Jeder Partner schließt **seinen Vertrag direkt mit dem Bauherrn** oder als Subunternehmer mit klar begrenzter Haftung [anwaltlich prüfen]. Platzhirsch verkauft lose Möbel (ClassiCon als Vertragshändler, weitere Marken ohne Händler-Aussage), Ezarri-Mosaik (Vertragshändler), Binni-Küchen und das **Koordinationshonorar**. Der Projektraum läuft im bestehenden Portal (Freigaben, Muster, Termine, Dokumente).

**Text für die Seite /de/hotel-contract (Absatz „So arbeiten wir“, fertig):**
> Ein Hotel einzurichten heißt, ein Dutzend Gewerke zum selben Termin fertig zu bekommen. Bei uns haben Sie dafür einen Ansprechpartner. Harald Menghin zeichnet das Konzept von Hand und baut ein Modell, danach folgen 3D-Planung, Musterzimmer und Bemusterung im Showroom mit eigenem Café in Lochau. Für Tischlerarbeiten, Küchen, Pool- und Spa-Flächen mit Ezarri-Glasmosaik, Outdoor und Licht arbeiten wir mit festen Partnern aus der Region. Wir koordinieren Termine, Lieferungen und Montage in Ihrem Saisonfenster. Die Bauleitung bleibt bei Ihrem Architekten oder Baumeister. Alle Freigaben, Muster und Pläne finden Sie jederzeit in Ihrem Projektportal.

**Partnervertrag, Eckpunkte (für Anwalt als Briefing):**
1. Aufnahme nur nach Referenzprüfung, Versicherungsnachweis (Betriebshaftpflicht), Kapazitätszusage für Saisonfenster.
2. Netzwerkbeitrag 0 € im ersten Jahr; danach **Vermittlungsprovision 3–5 %** auf durch das Netzwerk vermittelte Aufträge oder Festbeitrag 150–300 €/Monat, je nach Gewerk [Schätzung, kartellrechtlich prüfen: keine Preisabsprachen, keine Gebietsaufteilung, W2 in 27].
3. Kein Exklusivzwang, aber Vorrang im Netzwerk bei Einhaltung der Servicewerte (Reaktion ≤ 1 Werktag, Termintreue).
4. Datenschutz: Portal-Zugang je Projekt, AVV mit jedem Partner.
5. Haftung: jeder Partner für sein Gewerk; Platzhirsch haftet für Koordination und eigene Lieferungen, Haftungsgrenze im Koordinationsvertrag [anwaltlich prüfen].

**Zahlenlogik Option 2 [Schätzung]:**

| Kennzahl | M12 (Okt. 2027) | M24 (Okt. 2028) | Rechenweg |
|---|---|---|---|
| Projekte im Jahr (Hotel-Bereiche, Chalets, Gastro, Yacht) | 2–4 | 6–10 | hotel-contract §2.2: 35–50 Anlässe p. a. im Einzugsgebiet, Gewinnquote 5–15 % ab Jahr 2 |
| Ø Projektvolumen gesamt (alle Gewerke) | 120–200 T€ | 150–250 T€ | öffentliche Bereiche + Outdoor + Spa (hotel-contract, 05) |
| davon Platzhirsch-Eigenumsatz (Möbel, Ezarri, Binni) | 55 % | 50 % | Rest direkt bei Partnern |
| Eigenumsatz | 0,13–0,44 Mio. € | 0,45–1,25 Mio. € | Projekte × Volumen × Anteil |
| Rohertrag auf Eigenumsatz | 28–33 % | 30–35 % | 23 §5, Contract-Rabatte eingerechnet |
| Koordinationshonorar | 6–8 % vom Gesamtvolumen | 6–10 % | 15–60 T€ bzw. 55–250 T€ |
| Provisionen aus dem Netzwerk | 0 | 3–5 % auf Partneranteil, ca. 10–60 T€ | ab Jahr 2 |
| Kosten zusätzlich | Projektleitung freiberuflich je Projekt, Musterzimmer in Konsignation (Ziel 0 €), Contract-Datenblätter | 1 Projektleiter:in fest (70–90 T€ Vollkosten) ab ≥ 5 Projekten | |
| **Deckungsbeitrag** | **ca. 50–200 T€** | **ca. 200–700 T€** | Rohertrag + Honorar + Provision − zusätzliche Kosten |

**Liquiditätsregel (Pflicht):** Anzahlung 30–50 % mit Anzahlungsgarantie, Möbel nur nach Zahlungseingang bestellen, Hotel-Monatsrate nur über **Vendor-Leasing** (Bank trägt das Kreditrisiko, 21 B4, 08 §4.3). Keine Vorfinanzierung von Partnern.

**Beitrag zum Ziel 1 Mio. €/Monat:** Option 2 kann bei M24 **ca. 40–110 T€ Eigenumsatz pro Monat** beitragen [Schätzung], also 4–11 % des Ziels. Zusammen mit Binni über Partner (08: bis 350 T€/Monat bei M60) und dem Kerngeschäft bleibt das Ziel ein Szenario für 2031 (27 §3.3).

### 3.3 Struktur: Ausgliederung der Software in eine eigene GmbH

**Zielbild [Schätzung, nur mit Anwalt und Steuerberater umsetzen]:**

```
Gesellschafter (Meßmer / Wegscheider)
 ├── MW Immobilienverwaltungs GmbH (Bestand): Immobilie, Café, Altverbindlichkeiten
 ├── Platzhirsch Home Living GmbH (NEU, Handel, 23 §11.1): Möbel, Küchen, Contract (Option 2)
 │     └── Kunde und Lizenznehmerin der Software-GmbH (Marktpreis-Lizenz)
 └── Software-GmbH (NEU, Option 1, Arbeitsname)
       Gesellschafter: technische:r Mitgründer:in (Mehrheit oder starke Minderheit),
       Meßmer/Wegscheider privat (nicht über die MW GmbH), ESOP-Pool 10 %
       Eigentum: Plattform-Code (Küchenplaner-Engine, Portal, Concierge-Rahmen)
```

**Warum so:**
1. **Die MW GmbH darf nicht Gesellschafterin werden.** Bei negativem EK steckt sie die neue Firma über die Zusammenrechnung verbundener Unternehmen womöglich mit dem UiS-Status an (21 B1) [steuerlich prüfen]. Bei aws Seedfinancing dürfen Mehrheitsgesellschafter, die selbst keine jungen Klein-/Kleinstunternehmen sind, **weniger als 25 %** halten [belegt, aws FAQ].
2. **aws Preseed** verlangt, dass Antragsteller bzw. Schlüsselgesellschafter **keine andere Firma im selben oder benachbarten Markt** führen [belegt, aws FAQ]. Meßmer/Wegscheider führen Einrichtungshandel. Preseed ist deshalb nur mit einem/einer neuen Mitgründer:in als Antragsteller:in denkbar, und auch dann nur nach Klärung mit aws [prüfen].
3. **aws schließt die Übernahme der Tätigkeit eines älteren Unternehmens aus** [belegt, aws FAQ]. Der bestehende Code muss deshalb sauber bewertet und **zu Marktwert gekauft oder lizenziert** werden, nicht „mitgenommen“. Das schützt zugleich gegen Anfechtung durch Gläubiger der MW GmbH (23 §11.1, 21 B1) [anwaltlich prüfen].
4. **Wer hat den Code beauftragt und bezahlt?** Wenn die MW GmbH Auftraggeberin war, gehört das Werknutzungsrecht ihr. Dann ist die Übertragung ein Vermögensabfluss, der nur gegen Entgelt (Gutachten) zulässig ist [anwaltlich prüfen]. Code, der nach dem Stichtag für die neue Handels-GmbH entsteht, wird gleich vertraglich der Software-GmbH zugeordnet.
5. **Verrechnungspreise:** Handels-GmbH zahlt der Software-GmbH eine marktübliche Lizenz (z. B. Paket „Pro“) [steuerlich prüfen].

**Gegenargument des Gremiums:** Eine dritte GmbH kostet Gründung, Buchhaltung, Jahresabschluss (geschätzt 4–8 T€ p. a.) und GF-Zeit. **Gegründet wird nur, wenn bis Gate 2 (Apr. 2027) zwei zahlende Mandanten außer Binni unterschrieben sind** oder ein:e technische:r Mitgründer:in mit eigenem Kapital einsteigt. Bis dahin läuft Option 1 als Dienstleistung in der Handels-GmbH.

### 3.4 Finanzierung: was passt, was nicht

| Quelle | Konditionen | Passt für | Urteil |
|---|---|---|---|
| **Kundengeld (Setup-Gebühren)** | 50 % bei Auftrag, 50 % bei Abnahme | Option 1 | **Erste Wahl.** Kein Verwässern, beweist Nachfrage |
| **Vendor-Leasing, Anzahlungsgarantie** | Bank zahlt sofort, trägt Kreditrisiko (21 B4/B5) | Option 2 | **Pflicht** für Hotelprojekte |
| **aws Preseed – Innovative Solutions** | Zuschuss bis 80 %, max. 89.000 € (Genderbonus 90 %/100.000 €), Firma höchstens 6 Monate im Firmenbuch, De-minimis [belegt, aws] | Software-GmbH, nur mit neuem:r Mitgründer:in | **Möglich, aber eng.** Innovationshöhe eines Hersteller-Konfigurators ist fraglich; Antrag sofort nach Gründung |
| **aws Seedfinancing – Innovative Solutions** | bis 80 %, max. 356.000 € (Genderbonus 400.000 €), Firma ≤ 5 Jahre, Klein-/Kleinstunternehmen, AGVO [belegt, aws] | Software-GmbH ab 2028 | **Option**, nur mit Traktion (≥ 5 Mandanten) |
| **FFG Kleinprojekt / Basisprogramm** | Kleinprojekt max. 88.500 € je Projekt, Einreichung 2026 laufend bis 31.12.2026; Basisprogramm bis 3 Mio. € [belegt, FFG-Ausschreibungsseiten, Förderquote nicht verifiziert] | nur echtes F&E-Thema, z. B. „Plausibilitätsprüfung und KI-gestützte Stückliste für Maßküchen aus Naturstein“ mit FH Vorarlberg | **Möglich**, wenn ein F&E-Kern formuliert wird; nicht für die MW GmbH (UiS) |
| **KMU.DIGITAL** | Beratung und Umsetzung, kleine Beträge (27 W12) | Handels-GmbH | Mitnehmen, nicht darauf bauen |
| **Land Vorarlberg / WISTO / Startup Vorarlberg** | Neue Startup Vorarlberg GmbH im Rahmen CAMPUS V; Gründungs- und Jungunternehmerberatung (75 % der Beratungskosten laut Richtlinie 2024) [belegt, WKO; Stand 2026 prüfen] | Software-GmbH | **Termin vereinbaren** (Beratung, Netzwerk, ggf. FH-Kooperation) |
| **Business Angels (aaia/invest.austria, regionale Unternehmer)** | aaia mit 200–250 Mitgliedern, Status nach Fusion mit AVCO zu invest.austria uneinheitlich [belegt, Status prüfen] | Software-GmbH ab 3–5 Mandanten; Option 2 eher strategischer Investor (Hotelier, Bauträger) | **Ab Mitte 2027.** Für Option 2 ist ein Hotelier als stiller Gesellschafter wertvoller (Kapital plus Referenz, 21 B6) |
| **Revenue-based Financing** | Anbieter verlangen wiederkehrende Umsätze, z. B. Lighter Capital ab ca. 200.000 $ ARR [belegt, Sekundärquelle]; DACH: re:cap, Levenue [belegt] | Software-GmbH frühestens 2029 | **Heute nicht anwendbar** |
| **Venture Capital** | 2–3 × Wachstum p. a. erwartet | keines | **Nein** (08, 27) |

---

## 4. Risiken

| # | Risiko | Wirkung | Gegenmittel |
|---|---|---|---|
| R1 | Fokusverlust: GF-Zeit fließt in Software statt in Sanierung und Verkauf | Kerngeschäft leidet, Gate 0/1 gefährdet | Option 1 erst nach Gate 1; Vertrieb an Hersteller max. 1 Tag/Woche; technische Leitung extern |
| R2 | Anfechtung bei Übertragung von Code/IP aus der MW GmbH | Haftung, Rückforderung | Bewertung, Kauf zu Marktwert, Anwalt vor jeder Übertragung |
| R3 | Förderung scheitert an Unabhängigkeit oder UiS | Plan ohne Zuschuss | Finanzierung über Setup-Gebühren, Förderung nur als Bonus |
| R4 | Datenrechte: Hersteller-Inhalte (Minotti, Ezarri) in fremden Mandanten | Vertragsbruch, Urheberrecht | Mandantentrennung; jeder Kunde liefert eigenen Content; Minotti-Daten nie außerhalb Platzhirsch |
| R5 | Haftung als „faktischer Generalunternehmer“ im Contract | Gewährleistung für fremde Gewerke | Direktverträge Bauherr–Partner, Koordinationsvertrag mit Haftungsgrenze, „Koordination statt Bauleitung“ |
| R6 | Kartellrecht im Netzwerk | Bußgeld | keine Preis- oder Gebietsabsprachen, Provisionen transparent (27 W2) |
| R7 | Abhängigkeit von Binni als Ankerkunde | Option 1 bricht weg | Vertrag mit Mindestlaufzeit 24 Monate; zweiter Kunde vor Gründung |
| R8 | KI-Kosten und KI-Haftung im Concierge je Mandant | Margenverlust, falsche Auskünfte | Kostendeckel pro Mandant, Wissensbasis nur aus Kundendaten, Hinweis „KI-Antwort“ (AI Act Art. 50) [anwaltlich prüfen] |
| R9 | Wettbewerb großer Anbieter (Cyncly, Roomle/HOMAG, pCon) | Preisdruck | Nische: Manufakturen ohne IDM-Katalog, Mehrsprachigkeit AT/DE/CH/FL, Service vor Ort |
| R10 | Reputationsrisiko „Unicorn“-Sprache gegenüber Bank und Herstellern | Vertrauensverlust | Kein Plattform- oder Unicorn-Claim nach außen; intern „Werkstatt Digital“ und „Contract Collective“ |

---

## 5. 12-Monats-Fahrplan (Nov. 2026 – Okt. 2027)

Abgestimmt auf die Gates aus 23 §12.2 und 27 (Gate 0 Anfang Dez. 2026, Gate 1 Feb. 2027, Gate 2 Ende Apr. 2027, Gate 3 Okt. 2027).

| Monat | Option 1 (Werkstatt Digital) | Option 2 (Contract Collective) | Struktur und Finanzierung | Meilenstein / Gate |
|---|---|---|---|---|
| **Nov. 2026** | Code-Inventur: welche Module generisch, wer ist Rechteinhaber, Lizenzen der Bibliotheken | Partner-Longlist (Tischler aus 19, Ezarri-Verleger, Outdoor aus 30) | Anwalt: Rechte am Code, Übertragungsweg; Entscheidung „kein VC, kein Marktplatz, kein Händler-SaaS“ bestätigen | Rechte-Gutachten beauftragt |
| **Dez. 2026** | Binni-Konfigurator als Teil des Binni-Vertrags: Lizenzrecht für Platzhirsch, Option auf Nutzung für Binni-Exportpartner | Seite /de/hotel-contract mit Text aus 3.2 (Code-Team) | Handels-GmbH nach Gate 0 (23 §11.2); FFG-Kleinprojekt-Idee mit FH Vorarlberg vorbesprechen (Einreichfrist 31.12.2026) | **Gate 0** |
| **Jan. 2027** | Produktblatt und Preisliste (3.1) fertig; 10 Hersteller-Gespräche terminiert | 5 Partner unterschreiben Rahmenvertrag (Netzwerkbeitrag 0 €) | Leasing-Anfragen Hotelmöbel (Raiffeisen-Leasing, Hypo Vbg. Leasing) | 5 Partner |
| **Feb. 2027** | Binni-Konfigurator live (Mandant 1) | Musterzimmer im Showroom in Konsignation; erste 4 Hotel-Termine aus Pipeline 22 | Termin Startup Vorarlberg / WKV-Förderberatung | **Gate 1** |
| **März 2027** | Abschluss Mandant 2 (Tischler oder Steinmanufaktur) | Projektraum im Portal für erstes Contract-Projekt | – | Mandant 2 |
| **Apr. 2027** | Abschluss Mandant 3; Entscheidung Software-GmbH | erstes Contract-Projekt beauftragt (Ziel ≥ 100 T€ Gesamtvolumen) | **Gründung Software-GmbH nur bei ≥ 2 Mandanten außer Binni** oder Mitgründer:in mit Kapital; danach Antrag aws Preseed binnen 6 Monaten | **Gate 2** |
| **Mai–Juni 2027** | Partner-Portal-Version (Lead-Routing nach PLZ) als Grundlage für 08 Stufe 3 | Montage im Saisonfenster, Fotodokumentation als erste Referenz | Code-Kauf/Lizenz zu Marktwert (Gutachten) | erste Referenz |
| **Juli–Aug. 2027** | MRR ≥ 2,5 T€; Kunden-Case-Studies | Partnerzahl 10–12; Projekt 2 und 3 in Angebot | Gespräche mit 2–3 Hoteliers/Bauträgern über stille Beteiligung an der Handels-GmbH (nach Gate 3, 27 W18) | – |
| **Sept. 2027** | Bewertung: wenn MRR < 2 T€ oder Ergebnis < −30 T€ → Option 1 zurück in die Handels-GmbH, nur noch Eigenbedarf | Netzwerkprovision ab Jahr 2 vertraglich vorbereitet | – | Stopp-Kriterium Option 1 |
| **Okt. 2027** | Ziel 3 Mandanten, 60–110 T€ Umsatz | Ziel 2–4 Projekte, 0,13–0,44 Mio. € Eigenumsatz | Jahresbericht an Beirat; Entscheidung Seedfinancing (Software-GmbH) für 2028 | **Gate 3** |

---

## 6. Maßnahmen-Tabelle

| Prio | Maßnahme | Aufwand | Kosten grob | Erwarteter Umsatzeffekt (Begründung) | Wer |
|---|---|---|---|---|---|
| **P0** | Rechte am bestehenden Code klären (Auftraggeber, Werknutzungsrecht, Bibliothekslizenzen) und dokumentieren | S | 1,5–4 T€ Anwalt | indirekt: Voraussetzung jeder Verwertung, Schutz vor Anfechtung | Inhaber + Anwalt |
| **P0** | Grundsatzentscheidung schriftlich: kein VC, kein Marktplatz, kein Händler-SaaS, keine „Unicorn“-Sprache nach außen | S | 0 € | schützt Bank- und Herstellervertrauen (27 §7) | Inhaber |
| **P0** | Hotel-/Contract-Seite mit Text 3.2, Projektraum-Hinweis, Anfrageweg | M | intern | Voraussetzung für Option 2: 0,13–0,44 Mio. € Eigenumsatz in 12 Monaten [Schätzung] | Code-Team |
| **P1** | Lizenz- und Konfigurator-Klausel in den Binni-Vertrag (Platzhirsch hält Rechte, Binni zahlt Setup/Betrieb für Exportpartner) | S | 0–2 T€ | Mandant 1 Option 1: 15–30 T€ Setup + 1–1,5 T€/Monat [Schätzung] | Inhaber + Anwalt |
| **P1** | Partner-Rahmenvertrag Contract Collective (Eckpunkte 3.2) und 5 erste Partner | M | 2–5 T€ Anwalt | ermöglicht Gesamtprojekte statt Einzelmöbel; Koordinationshonorar 6–8 % | Inhaber + Partner |
| **P1** | Vendor-Leasing und Anzahlungsgarantie für Hotelprojekte abschließen | M | Gebühren projektabhängig (1–2 % p. a. Garantie, 21) | ohne das kein Hotelprojekt finanzierbar | Inhaber + Bank |
| **P1** | Musterzimmer im Showroom (Konsignation, Ziel 0 €) | M | 0–15 T€ | wichtigster Abschlussbeschleuniger für Hoteliers (hotel-contract) | Inhaber + Partner |
| **P1** | Mandantenfähigkeit der Module: Küchenplaner-Engine und Portal von Platzhirsch-Inhalten trennen (Konfiguration je Mandant, eigene Daten, eigene Domain) | L | 15–35 T€ intern/Freelancer | Grundlage für Mandanten 2–8; 190–330 T€ Umsatz in Jahr 2 [Schätzung] | Code-Team |
| **P2** | Produktblatt, Preisliste und Demo „Werkstatt Digital“; 10 Hersteller-Gespräche | M | 2–4 T€ | 2 weitere Mandanten bis Apr. 2027 [Schätzung] | Inhaber + Code-Team |
| **P2** | FFG-Kleinprojekt mit FH Vorarlberg vorbereiten (F&E-Kern: Plausibilitätsprüfung/Stückliste Natursteinküche) | M | 3–6 T€ Antragsaufwand | bis 88.500 € Förderung, Quote prüfen; senkt Entwicklungskosten | Inhaber + Code-Team + FH |
| **P2** | Software-GmbH gründen (nur bei Gate-Bedingung 3.3), Mitgründer:in suchen, ESOP-Pool | M | 3–6 T€ Gründung + 4–8 T€ p. a. | Förderfähigkeit aws Preseed (bis 89 T€) und später Angels | Inhaber + Anwalt + Steuerberater |
| **P2** | Termin Startup Vorarlberg / WKV-Förderberatung / WISTO | S | 0 € | Netzwerk, Beratungsförderung, FH-Kontakte | Inhaber |
| **P3** | Gespräch mit Ezarri über einen Händler-Konfigurator für DACH (Platzhirsch als Entwickler) | S | 0 € | Chance auf Hersteller-Mandat mit Netzwerkeffekt [prüfen, keine Zusage] | Inhaber |
| **P3** | Netzwerkprovision im Contract Collective ab Jahr 2 einführen | S | 0 € | 10–60 T€ p. a. ab 2028 [Schätzung] | Inhaber |
| **P3** | Seedfinancing-Antrag (aws, bis 356 T€) bei ≥ 5 Mandanten | M | 5–10 T€ | Skalierung Option 1 ab 2028 | Software-GmbH |

---

## Quellen (abgerufen 28.10.2026)

- aws Preseed/Seedfinancing – Innovative Solutions, FAQ (Förderhöhen, Firmenalter, Unabhängigkeit, Ausschluss der Übernahme älterer Tätigkeiten): https://www.aws.at/en/faqs-aws-preseed-seedfinancing-modul-innovative-solutions/
- aws Preseed – Innovative Solutions: https://aws.at/en/aws-preseed-innovative-solutions · WKO-Überblick: https://www.wko.at/foerderungen/preseed-innovative-solutions
- aws Programmdokument (Fassung 01.01.2022): https://www.aws.at/fileadmin/user_upload/Downloads/Programmdokument/ab_20220101_Preseed_Seedfinancing_-_Innovative_Solutions_PD.pdf
- FFG Ausschreibungsübersicht 2026 (Kleinprojekt max. 88.500 €, Basisprogramm bis 3 Mio. €), z. B. https://www.ffg.at/kiras_k-pass/ausschreibung-2026 [Förderquote für KMU nicht verifiziert]
- WKO Vorarlberg, Förderungen Start-ups/Scale-ups/Spin-offs: https://www.wko.at/vlbg/foerderungen/gruenden/start-up/start-ups-scale-ups--spin-offs · Jungunternehmer-Richtlinie 2024: https://www.wko.at/vlbg/gruendung/2024-junguntern.richtlininen-land-wkv.pdf · CAMPUS V/Startup Vorarlberg: https://www.wko.at/vlbg/news/vorarlberg-buendelt-kraefte-fuer-wirtschaft-tourismus-und-inn
- Cyncly/Compusoft, Winner Flex (Herstellerangaben): https://www.cyncly.com/en/news/mobelkreis-waldeck-gmbh-chooses-cynclys-winner-flex-to-build-its-future · https://softguide.com/company/compusoft-deutschland-ag
- Revenue-based Financing: https://founderpath.com/compare/best-revenue-based-financing-companies (Anbieterquelle) · https://www.fintechfutures.com/?p=15243427 (Levenue/Requr) · https://techcrunch.com/?p=2248621 (re:cap)
- aaia / invest.austria: https://www.leadersnet.at/news/60429,wir-sind-ein-vertrauensnetzwerk-fuer-business-angels.html · https://www.cbinsights.com/company/austrian-angel-investors-association
- Vergleichsfälle (Roomle, Havenly, Made.com, 1stDibs, home24) mit Quellen in `Marktresearch/wachstum/08-unicorn-growth.md`

*Gutachten des Wachstumsrats, Gremium M&A, Unicorn-Builder, digitale Geschäftsmodelle. Am Code wurde nichts geändert. Alle Zahlen zu Platzhirsch sind Schätzungen mit Rechenweg und vor Entscheidungen mit Buchhaltung, Steuerberater und Anwalt zu prüfen.*
