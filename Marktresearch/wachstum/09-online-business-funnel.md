# 09 – Online-Business: Funnel, Unit Economics und 12-Monats-Ziele für platzhirsch.studio

**Stand:** 26.10.2026 · Rolle: Online-Business- und E-Commerce-Stratege · Baut auf 23 (Masterkonzept), 26 (Binni), 06, 11, digital/07, 10, 11 und 14 auf.
**Kennzeichnung:** **[belegt]** mit Quelle · **[Schätzung]** mit Herleitung · **[prüfen]** offen · **[vom Unternehmen auszufüllen]** echte Zahl fehlt.

> **Wichtigster Vorbehalt:** Es gibt heute **keine einzige gemessene Funnel-Zahl** (Sitzungen je Kanal, Leads, Abschlussquote, Ø-Auftrag, Rohertrag je Sparte). Alle Platzhirsch-Werte unten sind Startannahmen und werden nach 90 Tagen Messung ersetzt. Benchmarks stammen überwiegend aus US- oder globalen Datensätzen und sind für einen regionalen Premium-Showroom nur als Richtung brauchbar.

---

## 0. Kurzfassung

1. **platzhirsch.studio ist ein Termin-Generator, kein Shop.** 90–95 % des online angestoßenen Umsatzes entstehen über Beratung im Showroom (Ø-Auftrag 15–18 T€). Der eigentliche Online-Verkauf (Gutscheine, Accessoires, Outlet) bringt im Jahr 1 realistisch 0,1–0,3 Mio. € (07, 11). Optimiert wird deshalb auf **Kosten pro qualifiziertem Lead (CPQL)** und **Auftragswert pro Media-Euro**, nicht auf Shop-Conversion-Rate.
2. **Die Rechnung trägt Werbung klar, aber nur mit Rückmeldung aus dem Backoffice.** Ein Auftrag bringt nach variablen Kosten ca. 5 T€ Deckungsbeitrag [Schätzung]. Bei 20 % Abschluss darf ein qualifizierter Lead bis ca. 1.000 € kosten, bevor Werbung Geld verliert. Ziel ist ≤ 280 € (Faktor 3,5 Sicherheit). Ohne Offline-Conversion-Import (digital/10 F4) ist das aber nicht steuerbar.
3. **Bezahlte Werbung für Kleinware lohnt nicht.** Ein Accessoire-Warenkorb von 150 € kostet über Google bei Benchmark-Werten ca. 60–90 € Media pro Bestellung und verliert Geld. Kleinware lebt von Showroom, Bestandskunden, Newsletter, Gutscheinen und kostenlosen Google-Einträgen.
4. **Die Binni-Küchenlinie ist der einzige echte Online-Motor.** Nur dort sind Preise, Konfigurator, Shopping-Anzeigen und Bildrechte ohne Herstellerfreigabe möglich (26). Ein Küchen-Lead mit Preisrahmen ist ca. 3–5 × so viel wert wie ein Sofa-Lead.
5. **Marktplätze: nur für Einzelstücke.** Pamono, 1stDibs, Deesup und willhaben/Ricardo für Ausstellungsstücke ja. Amazon und Otto nein. Galaxus erst prüfen, wenn es eine eigene Linie mit Preisen und CH-Logistik gibt.
6. **Werbebudget nur aus eigenem Deckungsbeitrag.** Wegen der Bilanzlage (EK −2,67 Mio. €) gilt eine Budgetregel: Media des nächsten Monats ≤ 25 % des Deckungsbeitrags aus Aufträgen mit belegter Online-Herkunft der letzten 3 Monate, Startbudget 3 T€/Monat ab Januar 2027 (Abschnitt 6).

---

## 1. Ist-Zustand und Datenlage

| Thema | Stand | Folge |
|---|---|---|
| Verkauf über die Website | Keine Preise, kein Checkout; Merkliste → Anfrageformular (digital/07) | Funnel endet heute am Formular |
| Messung | `src/lib/analytics.js` neu (ungetrackt im Git), GA4 mit Consent Mode v2 (digital/14) | Lead-Events vorhanden bzw. in Arbeit; **keine Rückmeldung Lead → Auftrag** |
| Lead-Herkunft | Formulare gehen ins Backoffice (Frappe), ohne Kanal-/UTM-Feld (digital/11 F1) | CAC je Kanal heute **nicht berechenbar** |
| Bezahlte Werbung | keine laufende Kampagne bekannt [vom Unternehmen auszufüllen] | Startpunkt 0 |
| Google-Bewertungen | 6 (23) | Local-Pack und Vertrauen schwach |
| Instagram | 772 Follower (23) | organische Reichweite klein |
| Echte Kennzahlen | Umsatz je Sparte, Rohertrag, Ø-Auftrag, Kundenherkunft fehlen (00) | **Voraussetzung für jede Ziel-Kalibrierung** |

---

## 2. Benchmarks mit Quelle (und wie weit sie tragen)

| Kennzahl | Wert | Quelle | Übertragbarkeit auf Platzhirsch |
|---|---|---|---|
| E-Commerce-Conversion-Rate Home & Furniture | **1,41 %** (global, Jan–Dez 2025); Luxury & Jewelry **0,94 %**; Durchschnitt aller Branchen 2,95 % | Dynamic Yield Benchmarks, zitiert nach [Smart Insights](https://www.smartinsights.com/ecommerce/ecommerce-analytics/ecommerce-conversion-rates/) und [ontapgroup](https://www.ontapgroup.com/blog/ecommerce-conversion-rate) (Originalseite marketing.dynamicyield.com am 26.10.2026 nicht erreichbar, HTTP 503) [belegt, Sekundärquelle] | Gilt für Shops mit Warenkorb und Kleinpreis-Anteil. Für Accessoires ist 1,0–1,4 % ein vernünftiger Startwert, für Ausstellungsstücke > 2.000 € eher 0,2–0,5 % [Schätzung] |
| Weitere CR-Werte Home & Furniture | 1,22 % (Sept. 2025), 1,24 % (Nov. 2024) | [Nudge](https://www.nudgenow.com/blogs/e-commerce-conversion-rates-benchmark), [InMotion](https://www.inmotionhosting.com/blog/ecommerce-conversion-rates-by-industry.md) [belegt, Anbieter-Blogs] | bestätigt die Spanne 1,2–1,4 % |
| Google Ads Furniture: Conversion-Rate (Lead/Kauf je Klick) | **2,73 %** | LocaliQ/WordStream Search Advertising Benchmarks 2025 (16.446 Kampagnen, Apr. 2024–März 2025), zitiert nach [Search Engine Land](https://searchengineland.com/google-ads-costs-rise-again-but-conversions-improve-report-455663) und [WordStream](https://www.wordstream.com/blog/2025-google-ads-benchmarks) [belegt, US] | US-Kampagnen, Conversion = jede Aktion (auch Anrufe). Für AT/DE realistisch 2–4 % auf Lead-Landingpages [Schätzung] |
| Google Ads Furniture: Cost per Lead | **121,51 $** (zweithöchster Wert aller Branchen; Durchschnitt 70,11 $) | ebd. [belegt, US] | deckt sich mit Ziel-CPL ≤ 90–110 € (digital/10). DACH-CPC liegen im Möbelbereich meist unter US-Niveau [Schätzung] |
| Online-Retourenquote Möbel/Home | ca. **22,7 %** online (alle Kategorien 19,3 %) | NRF + Happy Returns 2025, zitiert nach [ColorWhistle](https://colorwhistle.com/furniture-ecommerce-market-statistics/) / [eightx](https://eightx.co/blog/average-furniture-and-home-return-rate-benchmarks) [belegt, US, Sekundärquelle] | US mit Gratis-Retouren-Kultur. Für Premium-Einzelstücke mit Beratung deutlich niedriger [Schätzung 3–8 %]. DACH-Möbelhandel laut Sekundärquelle „unter 10 %“ (EHI, ohne Jahr, [prüfen]) [xictron](https://www.xictron.com/de/blog/retourenmanagement-e-commerce-retouren-senken/) |
| Retouren Deutschland gesamt | fast jedes vierte Paket, höchste Quote Europas (411 Händler befragt) | [Uni Bamberg, European Return-o-Meter](https://www.uni-bamberg.de/presse/pm/artikel/erste-europaeische-haendlerbefragung-retourenmanagement/) [belegt] | DE-Kunden erwarten einfache Rückgabe, Retourenregel muss vor Shop-Start stehen |
| Onlineanteil Einzelhandel AT | 12,3 Mrd. € = 13 % der handelsrelevanten Konsumausgaben; 87,5 % der Käufe stationär; Möbel als Wachstumstreiber genannt | Handelsverband / KMU Forschung Austria, Kreutzer Fischer & Partner 2026, zitiert nach [leadersnet](https://www.leadersnet.at/news/101244,onlinehandel-waechst-auf-rekordwert-von-123-milliarden-euro.html) [belegt, Sekundärquelle] | Bestätigt: stationärer Abschluss bleibt Normalfall, Website = Vorbereitung |
| Onlineanteil Einzelhandel DE | 13,4 % (2024), 88,8 Mrd. € | HDE Online-Monitor 2025, zitiert nach [onlinemarktplatz.de](https://onlinemarktplatz.de/255935/onlinehandel-waechst-wieder/) [belegt] | Möbel-spezifischer Wert nicht frei verfügbar (Statista-Paywall) [prüfen] |

**Was es nicht gibt:** belastbare öffentliche Benchmarks für „Lead → Auftrag“ im Premium-Einrichtungshandel. Die 15–25 % aus 10/23 sind Branchenerfahrung, keine Studie. Sie werden durch eigene Daten ersetzt (Abschnitt 9).

---

## 3. Der Funnel: drei Wege, drei Rechnungen

```
                        TRAFFIC (Sitzungen)
   Google organisch · Google-Profil · Ads · Meta/Pinterest · Newsletter · Direkt/QR im Showroom · Partner
                                   │
        ┌──────────────────────────┼──────────────────────────────┐
        ▼                          ▼                              ▼
  A  SOFORT KAUFEN           B  RESERVIEREN                  C  BERATUNG (Kern)
  Gutschein, Accessoire,     Outlet > 5 T€,                  Katalog 1.765 Produkte,
  Outlet ≤ 5 T€              Stücke mit Montage              Küchen, Projekte, Binni
  CR 1,0–1,4 %               Anzahlung 20 %, max. 1 T€       Lead-CR 0,6–1,2 % der Sitzungen
  Ø 120–250 €                Ø 3–8 T€                        → qualifiziert → Termin → Angebot → Auftrag
                                                             Ø 15–18 T€ (Küche Binni ≈ 22 T€, Poliform 55–60 T€)
```

### 3.1 Funnel C (Beratung): Startwerte und Ziel M12 [Schätzung]

| Stufe | Quote Start | Ziel M12 | Herleitung |
|---|---|---|---|
| Sitzungen/Monat | [vom Unternehmen auszufüllen, GA4] | 12.000–15.000 | Regionsseiten (8 neu), Ratgeber, Outlet, SEO-Plan 25; Annahme heute 4.000–8.000 |
| Sitzung → Lead (Formular, Anruf, WhatsApp, Termin) | 0,5 % | 0,8 % | Lead-Gen-Seiten im Möbelbereich: Formular-CR deutlich unter Google-Ads-CR (2,73 % je Klick, nur kaufnahe Klicks); Gesamtseite inkl. Inspirations-Traffic eher 0,5–1 % |
| Leads/Monat | 25–40 | 90–120 | |
| Lead → qualifiziert (Budget, Zeitraum, Gebiet passen) | 40 % | 40–45 % | Meta Lead Ads schlechter (25–35 %), Termin-Formular besser (60–70 %) |
| **Qualifizierte Leads/Monat** | 10–15 | **40** | = KPI-Tafel 23 |
| qualifiziert → Showroom-/Video-Termin | 60 % | 70 % | Online-Terminbuchung (digital/11 F4) |
| Termin → Angebot | 60 % | 65 % | |
| Angebot → Auftrag | 30 % | 40 % | Nachfassen 3/14/45 Tage (digital/11 F3), Anzahlungsgarantie, Finanzierung |
| **qualifiziert → Auftrag** | **≈ 11 %** | **≈ 18–20 %** | Spanne 15–25 % aus 10/23 |
| Aufträge aus Online-Leads/Monat | 1–2 | 7–8 | |
| Ø Auftrag | 15 T€ | 18 T€ | 23, KPI-Tafel |
| **Online angestoßener Auftragseingang/Monat** | 15–30 T€ | **≈ 130–145 T€** | ≈ 60–65 % der 215 T€ Run-Rate M12 (Rest: Bestandskunden, Projekte, Laufkundschaft) |

> **Achtung Doppelzählung:** Viele Kunden sehen erst die Website und kommen dann „direkt“. Ein Auftrag zählt als „online angestoßen“, wenn eine Lead-ID oder ein dokumentierter Erstkontakt über Website/Anzeige existiert. Dazu muss das Verkaufsteam bei jedem Erstkontakt die Frage „Wie sind Sie auf uns gekommen?“ ins Backoffice eintragen (Pflichtfeld).

### 3.2 Funnel A (Sofort kaufen) [Schätzung]

| | Gutscheine | Accessoires/Kerzen/Akkuleuchten | Outlet ≤ 5 T€ |
|---|---|---|---|
| Ø Warenkorb | 150–250 € | 120–180 € | 1.500–3.500 € |
| Conversion-Rate (Sitzungen der Shopseiten) | 2–4 % (Anlasskauf, Q4) | 1,0–1,4 % (Benchmark Home & Furniture) | 0,3–0,8 % |
| Rohertrag | Liquidität sofort, Marge erst bei Einlösung; Nichteinlösung ist kein einplanbarer Gewinn | 40–50 % (UVP-Verkauf, 11) | abhängig vom Buchwert; Preisregel 20–55 % unter Neupreis (23) |
| Zahlungsgebühr | 1,5–3 % (Stripe-Mix, 07) | 1,5–3 % | 1,5–3 % |
| Versand/Verpackung | 0 (PDF) | 8–15 € je Paket, CH zzgl. PDDP 2 € (11) | Spedition 150–400 € (an Kunden weiterverrechnen) |
| Retouren | keine Ware; Widerruf aber möglich [anwaltlich prüfen] | 5–10 % | 3–8 % (Einzelstück, eigene Fotos, Zustand ehrlich beschrieben) |

---

## 4. Unit Economics je Auftrag

### 4.1 Beratungsauftrag Wohnen (Ø 18 T€) [Schätzung]

| Position | Wert | Herleitung |
|---|---|---|
| Netto-Auftrag | 18.000 € | Ziel-Ø M12 (23) |
| Rohertrag 33 % | 5.940 € | KPI-Ziel ≥ 33 % (23) |
| − Zahlungs-/Finanzierungskosten (Anteil Kundenfinanzierung, Karte bei Anzahlung) | −150 € | ca. 0,8 % [Schätzung] |
| − nicht weiterverrechnete Lieferung/Montage | −300 € | Montage soll als eigene Position laufen (23, Margenprogramm); Rest-Risiko |
| − Beratungszeit über das normale Maß (Planung, 2. Termin, Angebot) | −400 € | ca. 8 h × 50 € interne Kosten [Schätzung] |
| **Deckungsbeitrag vor Marketing (DB I)** | **≈ 5.100 €** | |
| **Netto-DB-Quote** | **≈ 28 %** | |
| **Break-even-ROAS** (Auftragswert ÷ Media) | **≈ 3,6** | 1 ÷ 0,28; strenger als die 3,0 in digital/10, weil variable Kosten enthalten sind |
| **Maximaler CAC (Media je Auftrag) bis Break-even** | ≈ 5.100 € | |
| **Maximale Kosten pro qualifiziertem Lead** | ≈ 1.000 € (bei 20 % Abschluss) · ≈ 560 € (bei 11 % Start-Abschluss) | |
| Ziel-CPQL (digital/10) | ≤ 250–300 € | → Sicherheitsfaktor 2–4 |

### 4.2 Küche Binni-Linie (Ø 22 T€) [Schätzung, vor Prüfung der Einkaufspreise]

| Position | Wert | Herleitung |
|---|---|---|
| Netto-Auftrag | 22.000 € | 26: 15–35 T€ |
| Rohertrag | 35–40 % = 7,7–8,8 T€ | Fabrikpreis, eigene Linie; Geräte mit geringerer Marge separat [vom Unternehmen auszufüllen nach Binni-Preisliste] |
| − Fracht Kosovo → Lochau, Bruchrisiko Stein, Montage (falls nicht verrechnet) | −1,5–2,5 T€ | [Schätzung, vom Spediteur anfragen] |
| − Planung (Aufmaß, 2–3 Termine, CAD) | −0,6 T€ | 12 h × 50 € |
| **DB I** | **≈ 5–6,5 T€** | |
| Max. CPQL bei 25 % Abschluss (Festpreis vorab bekannt → höhere Abschlussquote) | ≈ 1.250–1.600 € | |

### 4.3 Accessoire-Bestellung (Ø 150 €) – warum Paid hier nicht funktioniert

| Position | Wert |
|---|---|
| Rohertrag 45 % | 67 € |
| − Versand, Verpackung, Zahlung (≈ 15 €), Retourenanteil (≈ 4 €), Kommissionierung (≈ 5 €) | −24 € |
| **DB I** | **≈ 43 €** |
| Media je Bestellung bei CPC 0,80 € und CR 1,2 % | ≈ 67 € → **Verlust ca. 24 € je Bestellung** [Schätzung; DACH-CPC für Shopping-Anzeigen [prüfen]] |

**Regel:** Paid-Media nur für (1) Beratungs-Leads, (2) Binni-Küchen, (3) Outlet-Stücke über 1.000 € und (4) Gutscheine im Q4 auf Bestandskunden-Listen (mit Einwilligung). Accessoires laufen über kostenlose Google-Produkteinträge (digital/07 F6), Showroom-QR, Newsletter und als Komplettierung in jedem Angebot.

### 4.4 Outlet-Stück über Marktplatz vs. eigener Shop (Beispiel 4.000 € netto)

| | Eigener Shop | Pamono / 1stDibs / Deesup |
|---|---|---|
| Gebühr | Zahlung ≈ 2 % = 80 € | Provision 12–30 % + ca. 3 % Zahlung = 600–1.320 € (11; Sätze nicht verifiziert, [beim Anbieter anfragen]) |
| Reichweite | regional, braucht eigenen Traffic | international, kaufkräftige Sammler |
| Logistik | eigene Spedition | teils über Plattform (Deesup übernimmt EU-Logistik, 11) |
| Empfehlung | **erst 21 Tage eigener Shop + Bestandskunden-Mailing, danach Marktplatz** | für Stücke ohne regionale Nachfrage |

---

## 5. Kanäle: Rolle, CAC und Steuerung

Alle CAC-Werte [Schätzung]; CAC = Kosten je gewonnenem Auftrag (Media oder Aufwand), DB je Auftrag ≈ 5,1 T€.

| Kanal | Rolle im Funnel | Kosten | Erwartete Qualität | CAC-Spanne | Entscheidung |
|---|---|---|---|---|---|
| **Google-Unternehmensprofil + Bewertungen** | Entscheidung, „in der Nähe“ | Zeit (2 h/Woche) | sehr hoch | 50–200 € | Priorität 1, sofort; 80 Bewertungen bis M12 |
| **SEO organisch** (Regionsseiten, Ratgeber, Outlet) | Überlegung | Content 1–2 T€/Monat intern/extern | hoch | 300–800 € (nach 6–12 Monaten) | Priorität 1 (Plan 25) |
| **Google Search Eigene Marke** | Entscheidung | 150–300 €/Monat | sehr hoch | 100–300 € | ab Stufe 1 |
| **Google Search Marke × Produkt / Region × Kategorie** | Entscheidung | 1,5–5 T€/Monat | hoch | 1.000–2.000 € | ab Stufe 1; Markenrecht-Regeln digital/10 4a.3 (keine Händler-Behauptung) |
| **Google PMax Leads** | alle Stufen | ab Stufe 2 | mittel, nur mit Offline-Werten | 1.500–3.000 € | erst wenn Offline-Import läuft |
| **Meta Lead Ads** (Formular mit Hürde) | Überlegung → Lead | 0,7–1,8 T€ | mittel (viele „Träumer“) | 1.500–3.500 € | ab Stufe 1, nur mit Qualifizierungsfragen |
| **Pinterest** | Inspiration | 150–700 € | niedrig bis mittel, lange Verzögerung | 2.000–5.000 € | organisch ja, Paid nur Test |
| **LinkedIn** (Architekten, Bauträger, Hotels) | B2B | 0–1,2 T€ | hoch, aber wenige Abschlüsse; ein Architekt = mehrere Projekte | 1.000–4.000 € (je Erstprojekt) | ab Stufe 2 |
| **Newsletter / Bestandskunden** | Wiederkauf | Tool 30–100 €/Monat + 4 h/Monat | sehr hoch | 50–300 € | sofort; Double-Opt-in (digital/14 F17) |
| **Events (Advent, Platzhirsch Tafel)** | Bindung, Empfehlung | 1,5–3 T€ je Abend | sehr hoch | 1.000–3.000 € | 1 pro Monat ab Feb. 2027, nach 6 Monaten messen |
| **Architekten/Tischler/Makler** | Empfehlung | Zeit + ggf. Tippgeberprovision | sehr hoch, große Tickets | je nach Provision 3–10 % des Auftrags | Programm 23/8; Provision nur transparent und schriftlich [anwaltlich prüfen: Offenlegung gegenüber Endkunden] |
| **Marktplätze (Outlet)** | Abverkauf | Provision 10–30 % | – | = Provision | nur Einzelstücke |

**Steuerungsregel:** Ein Kanal bekommt mehr Budget, wenn seine **Kosten pro qualifiziertem Lead zwei Monate in Folge im Ziel** liegen (digital/10). Nach 6 Monaten zählt **Auftragswert ÷ Media im 6-Monats-Fenster** (Ziel ≥ 8, Break-even ≈ 3,6).

---

## 6. Break-even des Werbebudgets und Budgetregel

### 6.1 Wie viele Aufträge braucht welches Budget? [Schätzung]

Formel: **Benötigte Aufträge/Monat = (Media + kanalbezogene Fixkosten) ÷ DB I je Auftrag (5,1 T€)**

| Stufe | Media | Fixkosten (Kreativ, Tools, interne Stunden ≈ 5 h/Woche) | Summe | **Break-even-Aufträge/Monat** | Erwartet (digital/10) | Sicherheitsfaktor |
|---|---|---|---|---|---|---|
| 1 | 3 T€ | 1,5 T€ | 4,5 T€ | **0,9** | 2–3 | 2–3 × |
| 2 | 8 T€ | 2,0 T€ | 10 T€ | **2,0** | 4–7 | 2–3,5 × |
| 3 | 15 T€ | 2,5 T€ | 17,5 T€ | **3,4** | 8–12 | 2,4–3,5 × |

### 6.2 Liquidität: der eigentliche Engpass

- Zwischen Klick und Zahlung liegen **2–6 Monate** (Kaufzyklus) plus Lieferzeit der Hersteller. Die Media-Kosten fallen sofort an.
- Ausgleich: **Anzahlung 30–50 %** bei Auftrag (23), Anzahlungslink per Stripe (digital/07 F4), Kundenfinanzierung ab 5 T€.
- **Budgetregel (Vorschlag):** Media im Monat n+1 ≤ 25 % des DB I aus Aufträgen mit belegter Online-Herkunft der Monate n−2 bis n, mindestens aber 3 T€ (Startbudget, in der Fortbestehensprognose ausweisen). Kein Agenturvertrag mit Laufzeit, alle Plattformen monatlich kündbar.
- **Start:** Stufe 1 ab Januar 2027, **nur wenn** Lead-Herkunft (digital/11 F1), Consent-Erweiterung und Pflichtfeld „Herkunft“ im Backoffice live sind. Stufe 2 frühestens April 2027.

---

## 7. LTV: was ein Kunde über 5 Jahre wert ist

### 7.1 Modell Privatkunde Wohnen [Schätzung, mit Backoffice-Daten 2021–2026 prüfen]

| Baustein | Wahrscheinlichkeit in 5 Jahren | Wert | Erwartungswert Umsatz |
|---|---|---|---|
| Erstkauf (z. B. Sofa) | 100 % | 15.000 € | 15.000 € |
| Komplettierung (Teppich, Leuchte, Beistelltisch) innerhalb 12 Monate | 35 % | 4.000 € | 1.400 € |
| Zweiter Raum / Schlafzimmer (Treca, Poliform) | 20 % | 10.000 € | 2.000 € |
| Outdoor (Seegrundstück, Terrasse) | 15 % | 12.000 € | 1.800 € |
| **Küche nach Sofa** (Umbau, Zweitwohnung) | 5–8 % | 25.000–55.000 € | 1.500–4.000 € |
| Accessoires, Gutscheine, Pflege | 50 % | 500 € | 250 € |
| Empfehlung eines Neukunden | 15 % | 15.000 € | 2.250 € (nicht in DB einrechnen, nur als Bonus) |
| **LTV Umsatz (ohne Empfehlung)** | | | **≈ 22–24 T€** |
| **LTV Deckungsbeitrag (≈ 28 %)** | | | **≈ 6,2–6,8 T€** |

Folgerung: Der Erstauftrag allein trägt den CAC bereits (5,1 T€ DB > Ziel-CAC 1–2 T€). Der LTV zusätzlich rechtfertigt **Bindungsarbeit** (Newsletter, Events, Pflege-Service, Circle/Inzahlungnahme), nicht mehr Akquise-Budget.

### 7.2 Cross- und Upselling-Hebel (keine Dark Patterns)

| Hebel | Wo | Wirkung [Schätzung] |
|---|---|---|
| **Komplettierungsliste** in jedem Angebot (Teppich, Leuchte, Pflege) | Angebot, Backoffice-Vorlage | +8–12 % Ø-Auftrag (23: G8 = 10–15 % auf G1) |
| „Dazu passt“ auf Produktseiten (gleiche Kollektion, gleiche Raumszene) | Website | mehr Merkliste-Positionen je Anfrage |
| Küche-Trigger: Frage im Erstgespräch „Planen Sie in den nächsten 3 Jahren Küche oder Umbau?“ | Backoffice-Feld | Küchen-Pipeline aus Bestandskunden |
| Pflege- und Service-Paket (Lederpflege, Wintereinlagerung Outdoor) | Angebot, nach Lieferung | Wiederkontakt jedes Jahr |
| Bestandskunden-Vorschau Outlet (48 h vor Freischaltung) | Newsletter | Abverkauf ohne Rabattdruck |
| Zufriedenheits-Mail nach 14 Tagen + Bewertungsbitte | Automation (digital/11 F7) | Bewertungen, Empfehlungen |

**Verboten:** vorangekreuzte Zusatzleistungen, künstliche Verknappung („nur noch heute“), gefälschte Countdown-Timer, versteckte Zusatzkosten im Checkout, irreführende „statt“-Preise. Bei Preisermäßigungen gilt die 30-Tage-Regel (AT § 9a PrAG, DE § 11 PAngV); bei Ausstellungsstücken den Vergleichspreis klar als „Neupreis/UVP des Herstellers“ bezeichnen [anwaltlich prüfen].

---

## 8. Online-Sortiment vs. Beratungssortiment

| Kategorie | Verkaufsart | Preis online? | Begründung |
|---|---|---|---|
| Gutscheine | A sofort | ja | kein Markenrecht, Liquidität, Q4 |
| Kerzen, Düfte, Accessoires, Akkuleuchten | A sofort | ja, UVP | Frequenz, Geschenk; Leuchten nicht gegen Connox-Rabatte (11) |
| Ausstellungsstücke ≤ 5 T€ | A sofort | ja | eigene Fotos, Einzelstück, keine Händler-Behauptung |
| Ausstellungsstücke > 5 T€ | B Reservierung (Anzahlung 20 %, max. 1 T€) | ja | Montage, Besichtigung |
| **Binni-Küchenlinie** | C mit **Festpreis-Beispielen** und Konfigurator-Preisrahmen | **ja („ab“-Preise, Pakete)** | eigene Linie, keine Herstellerfreigabe nötig (26); Herkunft offen nennen |
| Minotti, Poliform, Rimadesio, Paola Lenti | C Beratung | **nein** (bis Händlerstatus geklärt) | Verhandlung nicht belasten, Bildrechte offen; Textbausteine „Ausstellung in Lochau“ |
| ClassiCon (gelistet), Flos, Treca | C, später „ab“-Preise | nach Absprache | Status und Online-Auflagen klären |
| next125/Schüller | C | „ab“-Preise möglich [prüfen Händlervertrag] | Überschneidung mit Binni klären (26) |
| Projekte (Hotel, Bauträger, Ferienimmobilie) | C, B2B | nein | Einzelkalkulation |

**Regel für den Katalog (1.765 Produkte):** keine 1.765 Preise pflegen. Zuerst die **Top 50 Produkte nach Merklisten-Häufigkeit** mit „ab“-Preisen versehen, sobald Status und Backoffice-Felder es erlauben (digital/07 F5). Alles andere bleibt Anfrage.

---

## 9. Marktplätze

| Plattform | Markt | Eignung | Konditionen | Empfehlung |
|---|---|---|---|---|
| **Amazon.de** | DE/AT | Neuware Premium: nein | Möbel: 15 % bis 200 €, 10 % auf den Anteil darüber (seit Juni 2019, [t3n](https://t3n.de/news/amazon-mindestverkaufsgebuehr-eingefuehrt-1155506/), aktuell in Seller Central [prüfen]) | **Nein.** Plattformverbote für Luxusware sind zulässig (EuGH C-230/16 *Coty*, 11), Markenschaden, Preiskampf |
| **Otto Market** | DE | mittlere bis gehobene Möbel | kuratiert; Grundgebühr 99,90 €/Monat, Provision je Kategorie 7–18 % (Anbieter-Blog [edesk](https://www.edesk.com/de/blog/die-besten-online-marktplaetze-zum-verkauf-von-moebeln-in-deutschland/), nicht offiziell [prüfen]) | **Nein** für Premiummarken; frühestens für eine eigene Accessoire-/Binni-Linie, nicht in 12 Monaten |
| **Galaxus** | CH (auch DE) | Möbel als Kategorie vorhanden; Kaufvertrag direkt Händler–Kunde; Galaxus übernimmt Kundendienst und Retouren, für EU-Händler auf Wunsch Verzollung; Händler kuratiert, keine Grundgebühr, Provision je Kategorie (Sätze nicht öffentlich) ([channelpartner](https://www.channelpartner.de/article/3958896/so-will-galaxus-in-deutschland-weiter-wachsen.html), [Horizont](https://www.horizont.net/schweiz/nachrichten/e--commerce-galaxus-startet-marktplatz-in-deutschland-205281), [itreseller](https://www.itreseller.ch/Artikel/102245/Galaxus_meldet_ueber_1000_Haendler_auf_Marktplatz.html)) | **Prüfen ab M6**, nur für Ware mit eigenen Preisrechten (Accessoires mit Freigabe, später Binni-Kleinmöbel). Vorteil: CH-Reichweite und Verzollung. Nachteil: Preisvergleich, Platzhirsch-Marke tritt zurück. Provision beim Partnerteam anfragen [vom Unternehmen auszufüllen] |
| **Pamono** | EU/international | Ausstellungsstücke, Designklassiker | nur Profi-Verkäufer; Provision nicht öffentlich (11) | **Ja**, ab Outlet-Start |
| **1stDibs** | international | Stücke > 5 T€ | Abo- und Provisionsmodelle; 2024 Wechsel zu Modell ohne Abo mit höherer Provision, Abo-Preise ab Okt. 2025 angepasst ([1stDibs Investor Deck Q4 2025](https://s203.q4cdn.com/756296962/files/doc_financials/2025/q4/FINAL_1stDibs-Q4-2025-Investor-Deck_2026-02-27.pdf), über Suchergebnis) | optional, nur Spitzenstücke |
| **Deesup** | IT/EU | Ex-Display Minotti/Poliform | übernimmt EU-Logistik; Käufer verhandeln bis −30 % (11) | **Ja** |
| **Vinterior** | UK/EU | mittlere Stücke | 17 % bis £2.500, 10 % darüber (11) | optional |
| **willhaben** (AT), **Ricardo** (CH) | regional | Ausstellungsstücke, regionale Abholer | Händlerkonditionen [prüfen] | **Ja, Test** für Stücke, die regional abgeholt werden; immer mit Link zum eigenen Outlet |
| **Google kostenlose Produkteinträge / lokales Inventar** | AT/DE/CH | Outlet, Accessoires, Binni | kostenlos (digital/07 F6) | **Ja, Priorität** |

---

## 10. Retourenlogik

### 10.1 Recht (Kurzfassung, Details digital/14 F5) [anwaltlich prüfen]

| Fall | AT | DE | CH |
|---|---|---|---|
| Widerruf Fernabsatz Standardware (Accessoire, Outlet-Stück) | 14 Tage, FAGG § 11 ([RIS](https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20008847)) | 14 Tage, § 355 BGB ([gesetze-im-internet](https://www.gesetze-im-internet.de/bgb/__355.html)) | kein gesetzliches Widerrufsrecht im Online-Handel |
| Maßanfertigung / nach Kundenspezifikation (Küche, Sofa in Wunschstoff) | kein Widerruf, FAGG § 18 Abs 1 Z 3 | kein Widerruf, § 312g Abs 2 Nr 1 BGB | – |
| Rücksendekosten | trägt Kunde, wenn vorher belehrt (FAGG § 15 Abs 2); bei Speditionsware geschätzte Kosten vorab angeben | trägt Kunde, wenn vorher informiert (§ 357 BGB) | Vertragsfrage |
| Widerrufsbutton „Vertrag widerrufen“ | Pflicht für Verträge ab 01.10.2026 (§ 13a FAGG, digital/14) | Pflicht seit 19.06.2026 (§ 356a BGB) | – |
| Gewährleistung Ausstellungsstück | 2 Jahre; Verkürzung bei gebrauchter Ware nur in engen Grenzen [anwaltlich prüfen]; „neuwertig“ ≠ „gebraucht“ | wie AT, § 476 BGB [anwaltlich prüfen] | OR, vertraglich |
| Beratungsauftrag im Showroom | kein Fernabsatz, kein Widerruf | wie AT | – |

**Wichtig:** Ein Beratungsauftrag, der **nur per E-Mail/Telefon** geschlossen wird (z. B. CH-/DE-Kunde nach Video-Beratung), kann ein Fernabsatzvertrag sein. Bei Standardware ohne Maßanfertigung besteht dann Widerrufsrecht. Ablauf: Unterschrift im Showroom oder klare Belehrung im Angebot [anwaltlich prüfen].

### 10.2 Retourenkosten und Gegenmittel [Schätzung]

| Ware | Kosten je Retoure | Ziel-Quote | Gegenmittel |
|---|---|---|---|
| Paket (Kerze, Accessoire) | 8–15 € + Wiederaufbereitung | ≤ 6 % | ehrliche Fotos, Maße, Duftbeschreibung, Probe im Showroom |
| Outlet-Stück per Spedition | 250–600 € (Hin- und Rücktransport, Handling) | ≤ 5 % | 6–10 eigene Fotos, Zustandsprotokoll, Video-Besichtigung, Stoff-/Lederfoto, Maßskizze; Abholung im Showroom aktiv anbieten; Rücksendekosten vorab nennen |
| Binni-Küche | Widerruf ausgeschlossen (Maßanfertigung) – Risiko liegt bei Reklamationen | Reklamationsquote ≤ 3 % | Aufmaß durch Platzhirsch, Abnahmeprotokoll, Muster der Steinplatte vor Bestellung, Rückgriff auf Binni vertraglich (26) |

**Kennzahl:** Retourenquote nach Stück und nach Wert, getrennt nach Ware; Retourengrund als Pflichtfeld.

---

## 11. Kennzahlen-Dashboard

Eine Seite, monatlich in der GF-Runde, Datenquellen GA4, Google Ads/Meta, Stripe, Backoffice (Frappe). Umsetzung erst als Tabelle (digital/11 F9), später automatisiert.

| # | KPI | Definition | Quelle | Start | **Ziel M12 (Okt. 2027)** |
|---|---|---|---|---|---|
| 1 | Sitzungen je Kanal | GA4, ohne Bots | GA4 | [vom Unternehmen auszufüllen] | 12–15 T/Monat |
| 2 | Lead-Conversion-Rate | Leads ÷ Sitzungen | GA4 + Backoffice | – | ≥ 0,8 % |
| 3 | Leads gesamt | Formular + Anruf > 60 s + WhatsApp + Termin | Backoffice | – | 90–120/Monat |
| 4 | **Qualifizierte Leads** | Budget, Zeitraum, Gebiet passend (Backoffice-Status) | Backoffice | nicht gemessen | **40/Monat** |
| 5 | **CPQL** | Media ÷ qualifizierte Leads aus Paid | Ads + Backoffice | – | **≤ 280 €** |
| 6 | Termin-Quote | Termine ÷ qualifizierte Leads | Kalender | – | ≥ 70 % |
| 7 | **Abschlussquote** | Aufträge ÷ qualifizierte Leads (Kohorte nach Lead-Monat) | Backoffice | – | **≥ 18 %** |
| 8 | Ø Auftragswert | netto | Backoffice | ≈ 15 T€ | 18 T€ |
| 9 | Rohertrag je Auftrag | % | Backoffice | unbekannt | ≥ 33 % |
| 10 | **Auftragswert ÷ Media (6 Monate)** | Paid-Aufträge ÷ Media | Backoffice + Ads | – | **≥ 8** (Break-even ≈ 3,6) |
| 11 | CAC je Kanal | Kosten ÷ Aufträge je Kanal | Backoffice | – | ≤ 2 T€ (Paid), ≤ 0,8 T€ (organisch) |
| 12 | Herkunft bekannt | Aufträge mit Kanal-Eintrag ÷ alle | Backoffice | ≈ 0 % | ≥ 90 % |
| 13 | Shop-Umsatz A (Gutschein, Accessoire, Outlet ≤ 5 T€) | Stripe netto | Stripe | 0 | 8–15 T€/Monat (Q4 mehr) |
| 14 | Shop-Conversion-Rate | Bestellungen ÷ Sitzungen der Shopseiten | GA4 | – | ≥ 1,0 % |
| 15 | Outlet-Abverkauf | Stücke, Erlös, Tage bis Verkauf | Stripe/Backoffice | – | 100–300 T€ kumuliert, Ø ≤ 60 Tage |
| 16 | Retourenquote | nach Stück und Wert | Stripe/Backoffice | – | Paket ≤ 6 %, Spedition ≤ 5 % |
| 17 | Wiederkaufrate | Kunden mit 2. Auftrag in 24 Monaten | Backoffice | [vom Unternehmen auszufüllen] | ≥ 25 % |
| 18 | Newsletter | Abonnenten (DOI), Öffnungs-/Klickrate | E-Mail-Tool | [vom Unternehmen auszufüllen] | 1.500 Abonnenten |
| 19 | Google-Bewertungen | Anzahl, Ø | Google | 6 | 80, Ø ≥ 4,7 |
| 20 | Binni-Küchen | Leads, Angebote, Aufträge | Backoffice | 0 | 30 Leads, 8–12 Aufträge kumuliert |
| 21 | Anteil CH/FL und DE | an Aufträgen | Backoffice | unbekannt | 10 % / 12 % (23) |
| 22 | Liquidität Marketing | Media ÷ DB I Online-Aufträge (3 Monate) | Buchhaltung | – | ≤ 25 % |

**Consent-Hinweis:** Mit Consent Mode v2 fehlen Nutzer ohne Einwilligung in GA4 und Ads. Für Entscheidungen zählen deshalb die **Backoffice-Zahlen** (Leads, Aufträge mit Herkunftsfeld), nicht die modellierten Ads-Conversions.

---

## 12. Konkrete Ziele und Fahrplan für 12 Monate (Nov. 2026 – Okt. 2027)

| Zeitraum | Ziel | Messpunkt |
|---|---|---|
| **Nov.–Dez. 2026** | Lead-Herkunft (UTM, Klick-IDs, Pflichtfeld „Herkunft“) live; Gutschein-Shop vor 26.11.; Outlet-Seite mit 20+ Stücken; Bewertungsaktion | 30+ Bewertungen; 5–20 T€ Gutscheine; Herkunft bei ≥ 70 % der neuen Leads |
| **Jan.–März 2027 (Q1)** | Paid **Stufe 1** (3 T€); Online-Terminbuchung; Nachfass-Flows; erste Pamono/Deesup-Listings; Binni-Landingpage, sobald Preise vorliegen | 15–20 qualifizierte Leads/Monat; CPQL ≤ 250 €; 100 T€ Outlet-Erlös kumuliert |
| **Apr.–Juni 2027 (Q2)** | Stufe 2 (8 T€) **nur wenn** CPQL zwei Monate im Ziel; Offline-Conversion-Import; Binni-Konfigurator mit Preisrahmen; Outdoor-Saison | 25–30 qualifizierte Leads; erste 3–5 Binni-Aufträge; Auftragswert ÷ Media ≥ 6 |
| **Juli–Sept. 2027 (Q3)** | Value-Based Bidding; Galaxus-Prüfung abgeschlossen; Newsletter-Segmente (Küche, Outdoor, CH) | 35 qualifizierte Leads; Abschlussquote ≥ 16 % |
| **Okt. 2027 (M12)** | Zielbild erreicht | **40 qualifizierte Leads/Monat · CPQL ≤ 280 € · Abschluss ≥ 18 % · Ø 18 T€ · ≈ 130–145 T€ online angestoßener Auftragseingang/Monat · Auftragswert ÷ Media ≥ 8 · 80 Bewertungen · 8–12 Binni-Küchen kumuliert · Shop A 8–15 T€/Monat** |

**Abbruchkriterien (ehrlich):** Liegt der CPQL nach 3 Monaten Stufe 1 über 500 € oder die Abschlussquote nach 6 Monaten unter 10 %, wird Paid auf Marke + Retargeting reduziert und das Geld in Bewertungen, SEO und Architekten-Programm verschoben.

---

## 13. Was der Inhaber entscheiden oder liefern muss

| # | Punkt | Bis |
|---|---|---|
| 1 | **Echte Zahlen 2024–2026:** Aufträge, Ø-Auftrag, Rohertrag je Sparte, Anteil Wiederkäufer, Kundenherkunft (PLZ/Land) | 30.11.2026 |
| 2 | **Pflichtfeld „Herkunft“** im Backoffice und Regel fürs Verkaufsteam, es bei jedem Erstkontakt auszufüllen | KW 45 |
| 3 | **Budgetregel** (Media ≤ 25 % des Online-DB, Start 3 T€ ab Jan. 2027) in die Fortbestehensprognose aufnehmen | mit Steuerberater, Gate 0 |
| 4 | **Binni-Preisliste, Daten- und Bildrechte** (ohne sie kein Online-Motor) | so früh wie möglich |
| 5 | Inventur Ausstellungsstücke mit Buchwert und Preisregel; Freigabe Marktplätze (Pamono, Deesup, willhaben/Ricardo) | KW 46 |
| 6 | Entscheidung: keine Preise für Minotti/Poliform online bis Status geklärt | jetzt |
| 7 | Retourenregel festlegen (Abholung, Rücksendekosten, Ausstellungsstück-Gewährleistung) – Texte anwaltlich prüfen lassen | vor Shop-Start |
| 8 | Zuständige Person für das Dashboard (2 h/Woche) | KW 45 |

---

## Quellen (abgerufen 26.10.2026)

- Dynamic Yield E-Commerce Benchmarks 2025 (Home & Furniture 1,41 %, Luxury & Jewelry 0,94 %), über [Smart Insights](https://www.smartinsights.com/ecommerce/ecommerce-analytics/ecommerce-conversion-rates/) und [ontapgroup](https://www.ontapgroup.com/blog/ecommerce-conversion-rate); Originalseite nicht erreichbar
- [Nudge – E-Commerce Conversion Rates Benchmark](https://www.nudgenow.com/blogs/e-commerce-conversion-rates-benchmark); [InMotion – Conversion Rates by Industry](https://www.inmotionhosting.com/blog/ecommerce-conversion-rates-by-industry.md)
- LocaliQ/WordStream Search Advertising Benchmarks 2025: [Search Engine Land](https://searchengineland.com/google-ads-costs-rise-again-but-conversions-improve-report-455663), [WordStream](https://www.wordstream.com/blog/2025-google-ads-benchmarks) (direkter Abruf HTTP 403, Werte aus Suchergebnis)
- NRF + Happy Returns 2025 über [ColorWhistle](https://colorwhistle.com/furniture-ecommerce-market-statistics/) und [eightx](https://eightx.co/blog/average-furniture-and-home-return-rate-benchmarks)
- [Universität Bamberg – Europäische Händlerbefragung Retourenmanagement](https://www.uni-bamberg.de/presse/pm/artikel/erste-europaeische-haendlerbefragung-retourenmanagement/); [xictron – EHI-Wert Möbel](https://www.xictron.com/de/blog/retourenmanagement-e-commerce-retouren-senken/)
- [leadersnet – Onlinehandel Österreich 12,3 Mrd. €](https://www.leadersnet.at/news/101244,onlinehandel-waechst-auf-rekordwert-von-123-milliarden-euro.html); [onlinemarktplatz.de – HDE Online-Monitor](https://onlinemarktplatz.de/255935/onlinehandel-waechst-wieder/)
- [t3n – Amazon Verkaufsgebühren Möbel](https://t3n.de/news/amazon-mindestverkaufsgebuehr-eingefuehrt-1155506/); [edesk – Möbel-Marktplätze DE (Otto)](https://www.edesk.com/de/blog/die-besten-online-marktplaetze-zum-verkauf-von-moebeln-in-deutschland/)
- Galaxus: [channelpartner](https://www.channelpartner.de/article/3958896/so-will-galaxus-in-deutschland-weiter-wachsen.html), [Horizont](https://www.horizont.net/schweiz/nachrichten/e--commerce-galaxus-startet-marktplatz-in-deutschland-205281), [itreseller](https://www.itreseller.ch/Artikel/102245/Galaxus_meldet_ueber_1000_Haendler_auf_Marktplatz.html)
- [1stDibs Investor Deck Q4 2025](https://s203.q4cdn.com/756296962/files/doc_financials/2025/q4/FINAL_1stDibs-Q4-2025-Investor-Deck_2026-02-27.pdf)
- Gesetze: [FAGG (RIS)](https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20008847); [§ 355 BGB](https://www.gesetze-im-internet.de/bgb/__355.html), § 312g, § 356a, § 357 BGB; PrAG § 9a, PAngV § 11 – Fundstellen vor Verwendung [anwaltlich prüfen]
- Interne Berichte: 00, 06, 11, 23, 26, digital/07, digital/10, digital/11, digital/14
