# Wachstumsrat – Lead-, Sales-Funnel- und A/B-Test-Gremium (Kürzel: funnel)

**Stand:** 28.10.2026 · Gremium: Lead-Management, Sales-Funnel, Conversion/A/B-Tests · Grundlage: 00, 23 (maßgeblich), 25, digital/11 (CRM), marketing/email-flows, features/stilfinder, Code-Stand `feature/neuauftritt` (nur gelesen)

> **Kennzeichnung:** Platzhirsch hat heute **keine gemessenen Funnel-Zahlen** (23/12.3: „nicht gemessen“). Alle Raten und Mengen in diesem Bericht sind deshalb **[Schätzung]**: Branchenerfahrung des Gremiums plus Rechnung rückwärts vom Umsatzziel. Belegte Zahlen haben eine Quelle. Die Schätzungen müssen nach 90 Tagen Messung (Attribution, GA4, Pipeline) durch eigene Werte ersetzt werden.
>
> **Grenze dieser Prüfung:** Der Dev-Server antwortete während der Prüfung auf `/de`, `/de/beratung` und `/de/portal` mit HTTP 500 bzw. Timeout (andere Teams bauen parallel); `/de/labs/stilfinder` mit 200. Bewertet wurde deshalb vor allem am Code und an den Feature-Dokus, Screenshots wurden nicht erstellt.

---

## 1. Urteil zum Ist-Stand

**Note: 5 / 10** (Funnel-Fähigkeit der neuen Website plus Vertrieb dahinter)

| Bereich | Note | Begründung |
|---|---|---|
| Messbarkeit (Attribution, Events) | 7 | `src/lib/attribution.js` und `src/lib/forms/leadPayload.js` hängen Herkunft, Gerät und `lead_ref` an jede Anfrage, consent-sauber. GA4-Events `generate_lead`, `add_to_wishlist`, `contact_click`, `book_appointment` existieren (`src/lib/analytics.js`). Das ist für einen regionalen Händler weit über Durchschnitt. **Es fehlt** die Rückmeldung „Termin / Angebot / Auftrag mit Wert“ aus dem Backoffice zurück an GA4/Google Ads |
| Inspiration und Planer | 7 | Stil-Finder mit 28-seitigem Moodboard-PDF, Sofaplaner, Küchenplaner, AR-Viewer, Dreiländer-Rechner, Yacht- und Outdoor-Seiten. Starke Lead-Magneten, aber noch im Labs-Modus (PDF-Versand nur protokolliert) |
| Lead-Erfassung | 5 | Beratungsformular in 4 Schritten fragt nur Art (Neubau/Renovierung/Anderes), Objekt (EFH/Wohnung/Gewerbe), Freitext, Kontakt, plus Selbstauskunft. **Es fehlen Sparte, PLZ/Land, Budgetrahmen und Zeitpunkt**: genau die Felder, die man für Scoring und Routing braucht |
| Terminbuchung | 3 | `src/components/Booking/config.js` steht standardmäßig auf `none`. „Termin“ in der Mobil-Leiste führt zum Formular. Es gibt keinen Kalender und damit keine Sofortbuchung |
| Pipeline / Nachfassen | 2 | Laut 11/1.2 hat das Backoffice kein CRM, kein Lead/Opportunity/Angebot, keine Stufen und keinen Verlustgrund. Anfragen landen in drei getrennten Doctypes. Die Nachfass-Texte (email-flows §2) sind fertig, aber ohne System dahinter läuft nichts automatisch |
| B2B-Funnel (Hotel, Bauträger, Architekten) | 3 | Es gibt keine Seite für Hotel/Contract und keinen B2B-Lead-Magneten (Referenzmappe, FF&E-Leitfaden). Das Architekten-Programm existiert nur als Marketingtext |
| Nach dem Kauf (Lieferung → Empfehlung) | 5 | Das Kundenportal „Mein Platzhirsch“ steht als Mock (Dokumente, Termine, Produktpass). Danke-, Pflege- und Bewertungsmails sind getextet. Es fehlen ein Empfehlungsprogramm und ein Wiederkauf-Rhythmus |

**Kernaussage:** Das **obere Ende** des Funnels (Inspiration, Planer, Messung) ist auf dem Weg zu sehr gut. Das **untere Ende** (Termin, Angebot, Nachfassen, Auftrag) ist kaum vorhanden. Dort liegt das Geld: Ein Premium-Händler mit Ø 18 T€ pro Auftrag verliert an einem nicht nachgefassten Angebot mehr als an 1.000 verlorenen Website-Besuchen. **Erst unten abdichten, dann oben Traffic kaufen.**

---

## 2. Befunde und Chancen

### 2.1 Engpässe in der Reihenfolge ihres Umsatzeffekts

1. **Kein System zwischen Lead und Auftrag (E1).** Ohne Pipeline gibt es kein Nachfassen, keinen Angebotswert und keinen Verlustgrund, und Google Ads kann nicht auf Aufträge optimieren. Die 50–150 T€ aus offenen Angeboten (00/§5 Nr. 1) hängen genau daran.
2. **Antwortzeit unbekannt (E2).** Belegt ist: Firmen, die innerhalb einer Stunde reagierten, hatten fast 7-mal so oft ein qualifiziertes Gespräch mit dem Entscheider wie Firmen, die eine Stunde länger warteten, und über 60-mal so oft wie solche, die 24 Stunden und länger brauchten (Oldroyd/McElheran/Elkington, HBR 2011, „The Short Life of Online Sales Leads“; US-Daten, B2B-lastig, Richtung übertragbar). Heute gibt es kein SLA und keine Eskalation.
3. **Keine Sofort-Terminbuchung (E3).** Bei einem Showroom-Geschäft ist der Termin die Stufe mit der höchsten Abschlusswahrscheinlichkeit. Der Code ist fertig (Provider `link`), es fehlt nur die Entscheidung E7 und eine Kalender-URL.
4. **Formular ohne Qualifizierung (E4).** Ohne Budget, Zeitpunkt, Sparte und Land landen eine 400-€-Leuchte und eine 250-T€-Villa in derselben Warteschlange.
5. **Kein Hotel-/Contract-Funnel (E5).** Hotels sind ein erklärtes Ziel, haben aber weder Landingpage noch Lead-Magneten. Dazu kommt die Regel aus 23: Contract **unter 20 % des Umsatzes** halten (Klumpenrisiko, Vorkasse).
6. **Stil-Finder-Leads haben keinen nächsten Schritt (E6).** Das PDF enthält zwar einen Termin-QR, aber ohne Newsletter-Einwilligung darf danach keine Werbemail folgen. Der Übergang „PDF → Termin“ muss deshalb im PDF, auf der Erfolgsseite und über die Einwilligung im Formular passieren.
7. **Kein Empfehlungs- und Wiederkaufkreislauf (E7).** Bei 6 Google-Bewertungen fehlt Social Proof, und es gibt kein strukturiertes „Kunden bringen Kunden“.

### 2.2 Chancen, die kaum Kapital brauchen

- **Bestandskunden und offene Angebote** sind der billigste Funnel: sie sind schon an Stufe 6 bzw. 7. Eine Telefonliste reicht, Kosten 0 €.
- **Google Terminplanung oder Microsoft Bookings**, falls Workspace oder M365 schon bezahlt ist: Kosten 0 €, der Schalter existiert im Code.
- **Frappe CRM** ist Open Source (AGPL) und auf dem vorhandenen Frappe v15 installierbar (11/F2). Lizenzkosten 0 €, Aufwand M.
- **Musterboxen** für Ezarri-Mosaik und Stein- und Stoffmuster sind physische Lead-Magneten mit hoher Kaufabsicht. Kosten: Porto und Muster, mit Rücksendung bzw. Anrechnung.
- **Enhanced Conversions for Leads** (Google Ads): CRM-Stufen mit Wert zurückspielen, damit Ads auf Aufträge statt Formulare bietet. Google empfiehlt das für neue Setups statt des alten Offline-Imports; Uploads laufen seit 15.06.2026 über die Data Manager API ([Google Ads Hilfe](https://support.google.com/google-ads/answer/14274408?hl=en), [Einrichtung](https://support.google.com/google-ads/answer/11021502?hl=en)). Vor Start AVV und Einwilligungstext prüfen [anwaltlich prüfen].

---

## 3. FERTIGE Bausteine

### 3.1 Funnel-Blueprint (9 Stufen) mit Ziel-KPIs

**Definitionen (verbindlich für GA4, CRM und Reporting):**

| # | Stufe | Messpunkt (Event / CRM-Status) | Definition |
|---|---|---|---|
| 1 | Erstkontakt | GA4 `session_start`, Showroom-Zähler, Café-Gäste | jede Sitzung bzw. jeder Showroom-Besuch, getrennt nach Kanal (Attribution) |
| 2 | Inspiration | GA4 „engagierte Sitzung“ + neues Event `inspiration_view` (Ratgeber, Projekt, Marke, Kollektion ≥ 30 s) | Besucher, die echte Inhalte ansehen |
| 3 | Planer / Stil-Finder | neue Events `tool_start`, `tool_complete` mit `tool` = stilfinder · sofaplaner · kuechenplaner · ezarri · dreilaender · ar | Interaktion mit einem Werkzeug |
| 4 | Lead | `generate_lead` (alle Formulare, PDF, Musterbox) + `contact_click` Telefon/WhatsApp + Walk-in im CRM | erste Kontaktdaten mit Bezug zu einem Vorhaben |
| 4a | Qualifizierter Lead (MQL/SQL) | CRM-Status „Qualifiziert“ (Score ≥ 40, siehe 3.2) | Bedarf, Region, Rahmen und Zeitraum passen |
| 5 | Termin | `book_appointment` / CRM „Termin vereinbart“ → „Termin stattgefunden“ | Termin im Studio, vor Ort oder per Video |
| 6 | Angebot | CRM „Angebot gesendet“ mit `angebot_wert` | schriftliches Angebot oder Planungsvertrag |
| 7 | Auftrag | CRM „Gewonnen“ mit Auftragswert, Anzahlung eingegangen | Auftrag mit Anzahlung |
| 8 | Lieferung | CRM/Portal „Geliefert“, Reklamationsfeld | pünktlich, vollständig, ohne Reklamation |
| 9 | Empfehlung | Google-Bewertung, CRM-Feld `empfohlen_von`, Wiederkauf | Bewertung, Empfehlungs-Lead oder Folgeauftrag |

#### 3.1.1 Rückwärtsrechnung zum Ziel 1 Mio. € pro Monat [Schätzung]

Das Masterkonzept (23/§3.3) nennt 1 Mio. €/Monat eine **Vision 2030/31**, erreichbar nur mit Sprung (Gebiet, Allianz, Studio, Investor). Der Funnel muss deshalb **zwei Zielpunkte** tragen: **M36 = 430 T€/Monat** (realistisch, 23/§5.2) und **Vision = 1.000 T€/Monat**. Umsatzmix der Vision in Anlehnung an die Sprung-Spalte von 23/§5.2, ergänzt um Ezarri und Yacht:

| Feld | Ø Ticket | Aufträge/Monat Vision | Umsatz/Monat Vision | Aufträge/Monat M36 | Umsatz M36 (23) |
|---|---|---|---|---|---|
| G1 Wohnen / Einzelmöbel | 18 T€ (23-KPI M12; 25 T€ M36) | 15 | 270 T€ | 10 × 15 T€ | 150 T€ |
| G2+G3 Küchen AT/DE/CH/FL | 60 T€ | 3,3 (≈ 40/Jahr) | 200 T€ | 1,7 | 96 T€ |
| G4 Komplett / Ferienimmobilie | 250 T€ | 0,5 (6/Jahr) | 125 T€ | 0,2 | 50 T€ |
| G5 Bauträger / Penthouse | 150 T€ | 0,5 | 75 T€ | 0,2 | 30 T€ |
| G6 Hotel / Contract (< 20 %) | 180 T€ | 0,67 (8/Jahr) | 120 T€ | 0,1 | 20 T€ |
| G7 Outdoor privat | 12 T€ | 5 | 60 T€ | 3 | 36 T€ |
| Ezarri Pool/Wellness/Bad [neue Annahme, Ticket ungeprüft] | 10 T€ | 4 | 40 T€ | 1 | 10 T€ |
| Yacht-Interior [neue Annahme] | 100 T€ | 0,2 | 20 T€ | – | – |
| G8–G10 Add-ons, Online, Service | – | – | 90 T€ | – | 45 T€ |
| **Summe** | | **≈ 29 Projekte + B2B** | **≈ 1.000 T€** | | **≈ 437 T€** |

**Stufen-Raten privat (B2C), Zielwerte [Schätzung, nach 90 Tagen mit eigenen Zahlen ersetzen]:**

| Übergang | Wohnen G1 | Küche G2/3 | Outdoor / Ezarri | Komplett / Yacht | Benchmark / Begründung |
|---|---|---|---|---|---|
| Sitzung → engagierte Sitzung | 45 % | 45 % | 45 % | 45 % | GA4-Standard; Premium-Bildseiten liegen typischerweise bei 40–60 % |
| Sitzung → Werkzeug-Start | 4 % | 6 % (Küchenplaner) | 6 % (Konfigurator) | 2 % | Annahme |
| Werkzeug-Start → Abschluss | 55 % | 40 % | 50 % | – | Annahme; Stil-Finder ist kurz, der Küchenplaner lang |
| Sitzung → Lead (alle Wege) | **1,2 %** | 1,2 % | 1,5 % | 0,3 % | Online-*Kauf*quote Home & Furniture ≈ 1,2–1,6 % ([Shopify/Dynamic Yield, 2026](https://firework.com/blog/average-e-commerce-conversion-rate-for-high-ticket-sales); [VividWorks](https://www.vividworks.com/blog/furniture-ecommerce-conversion-rate)). Ein Lead ist eine kleinere Hürde als ein Kauf, 1,2 % ist deshalb konservativ |
| Lead → qualifiziert | 55 % | 60 % | 55 % | 40 % | Annahme; Scoring 3.2 |
| qualifiziert → Termin stattgefunden | 55 % | 70 % | 50 % | 70 % | gebucht 65 %, No-Show 15 % |
| Termin → Angebot | 55 % | 75 % (nach Planungsgespräch) | 70 % | 80 % | Annahme |
| Angebot → Auftrag | **30 %** | **25 %** | 35 % | 25 % | 23/§5.2 rechnet mit 15–25 % bei Projekten. Nachfassen +5–10 Pp. (11/6.3, unbelegt) |
| Lieferung ohne Reklamation | 90 % | 90 % | 90 % | 90 % | Zielwert |
| Lieferung → Bewertung | 40 % | 50 % | 40 % | 30 % | mit persönlicher Bitte, 11/F7 |
| Kunde → Empfehlungs-Lead in 12 Mon. | 0,3 | 0,5 | 0,3 | 0,5 | Annahme |

**Ergebnis: benötigte Mengen pro Monat [Schätzung]**

| Stufe | M36 (430 T€) | Vision (1 Mio. €) | Heute |
|---|---|---|---|
| Aufträge privat (G1, Küche, Outdoor, Ezarri, Komplett) | ≈ 16 | ≈ 28 | nicht gemessen (≈ 7–8 bei 110 T€/15 T€) |
| Angebote | ≈ 55 | ≈ 93 | nicht gemessen |
| Termine stattgefunden | ≈ 95 | ≈ 165 | nicht gemessen |
| Qualifizierte Leads (alle Kanäle) | **≈ 175** | **≈ 300** | nicht gemessen |
| Leads gesamt | ≈ 310 | ≈ 540 | nicht gemessen |
| davon Website (≈ 55 %; Rest Walk-in, Telefon, Bestand, Architekten) | ≈ 170 | ≈ 300 | nicht gemessen |
| Website-Sitzungen bei 1,2 % Lead-Quote | **≈ 14.000** | **≈ 25.000** | in GA4 ablesen |
| Google-Bewertungen (kumuliert) | 150+ | 300+ | 6 |

**Befund zum Masterkonzept:** Die KPI-Tafel 23/12.3 nennt **85 qualifizierte Anfragen/Monat bei M36**. Mit den Raten oben ergeben 85 qualifizierte Leads nur ≈ 8 Privataufträge, also ≈ 200 T€ statt 430 T€. Entweder sind die Raten deutlich besser (Angebot → Auftrag ≥ 45 %), oder die KPI muss **alle Kanäle** zählen (Walk-in, Telefon, Bestandskunden). **Empfehlung:** KPI auf „qualifizierte Leads alle Kanäle ≈ 175 bei M36“ umstellen und nach 90 Tagen mit echten Raten neu rechnen.

**B2B-Funnel (G5, G6, Architekten), Vision [Schätzung]:**

| Stufe | Hotel/Contract (8 Aufträge/Jahr) | Bauträger/Penthouse (6/Jahr) | Architekten-Programm |
|---|---|---|---|
| Zielkonten im Radar | 150 Hotels ab 4★ (AT/DE/CH/FL) + 22-Leadliste | 40 Bauträger | 50 Büros (23) |
| Erstgespräch | 60/Jahr (5/Monat) | 30/Jahr | 25 aktiv |
| Qualifizierte Opportunity (Budget, Zeitpunkt, Entscheider) | 40/Jahr | 20/Jahr | – |
| Konzept / Angebot | 32/Jahr | 15/Jahr | – |
| Auftrag | **8 (25 %)** | **6 (40 %, Paket)** | 1 Projekt pro aktivem Büro und Jahr ≈ 25 Leads |

#### 3.1.2 Engpass-Ampel (Pflicht im Monatsreport)

Rot, wenn eine Stufe mehr als 25 % unter Ziel liegt. Dann wird nur diese Stufe optimiert (keine parallelen Baustellen):

| Rot bei | Typische Ursache | Erste Maßnahme |
|---|---|---|
| Sitzungen | Sichtbarkeit | SEO-Schlachtplan 25, Google-Profil |
| Lead-Quote < 0,8 % | Angebot unklar, CTA schwach | Tests H02, H06, H09 |
| Lead → qualifiziert < 45 % | falsche Kanäle, Ads ohne Ausschlüsse | Kanalbericht aus Attribution, Ads auf Aufträge optimieren |
| qualifiziert → Termin < 45 % | Antwortzeit, kein Kalender | SLA 3.4, Kalender |
| Termin → Angebot < 45 % | Beratung ohne Plan | Vorbereitung mit Stil-Finder- und Merkliste-Daten |
| Angebot → Auftrag < 20 % | kein Nachfassen, Preis, Vertrauen | Sequenz 3.5.B, abgesicherte Anzahlung (23/§10 #1) |

---

### 3.2 Lead-Scoring (0–100), direkt in Frappe CRM umsetzbar

**Fit (max. 50 Punkte, aus Formular und Recherche)**

| Merkmal | Punkte |
|---|---|
| Vorhaben: Komplett-/Neubau/Villa/Ferienimmobilie | 20 |
| Küche komplett | 18 |
| Hotel/Gastro/Bauträger (B2B) | 20 (geht immer an den Inhaber, siehe Routing) |
| Mehrere Räume / Renovierung | 12 |
| Einzelstück / Accessoire | 3 |
| Budgetrahmen ≥ 100 T€ | 15 · 30–100 T€: 10 · 10–30 T€: 6 · < 10 T€: 2 · „weiß noch nicht“: 4 |
| Region im Kerngebiet (Vorarlberg, FL, Bodensee DE, SG/TG/AR/AI) | 10 · übriges AT/DE/CH: 5 · sonst: 0 |
| Kundentyp Architekt/Planer | +5 (Multiplikator) |

**Absicht (max. 35 Punkte, aus Zeitpunkt und Verhalten)**

| Merkmal | Punkte |
|---|---|
| Zeitpunkt: in 0–3 Monaten | 15 · 3–6 Monate: 10 · 6–12: 5 · > 12 / offen: 2 |
| Termin selbst gebucht | 10 |
| Planer abgeschlossen (Küchen-/Sofaplaner, Ezarri-Konfigurator) mit gespeichertem Ergebnis | 8 |
| Merkliste ≥ 3 Stücke oder Produktanfrage | 6 |
| Musterbox angefordert | 6 |
| Grundriss/Fotos hochgeladen (Upload) | 6 |
| *(Summe auf 35 gekappt)* | |

**Beziehung (max. 15 Punkte)**

| Merkmal | Punkte |
|---|---|
| Bestandskunde | 10 |
| Empfehlung durch Kunde/Architekt | 8 |
| Event/Café-Gast | 4 |
| Newsletter mit DOI | 2 |

**Abzüge:** Wegwerf-Mail oder Fake-Daten −30 · Wettbewerber/Händler −50 · Bewerbung/Lieferant → Status „Kein Lead“.

**Klassen und Reaktion**

| Klasse | Score | Antwort-SLA (Mo–Sa) | Kanal | Wer |
|---|---|---|---|---|
| **A** | ≥ 70 oder B2B | **≤ 1 Stunde** in Öffnungszeiten, sonst nächster Morgen 9:00 | Anruf, dann persönliche Mail | Inhaber / Senior-Berater / Küchenplaner |
| **B** | 40–69 | ≤ 4 Stunden | Anruf oder WhatsApp, Terminvorschlag mit 2 Zeiten | Berater nach Sparte |
| **C** | 20–39 | ≤ 1 Werktag | Mail mit passendem Lead-Magneten + Kalenderlink | Berater |
| **D** | < 20 | ≤ 2 Werktage | Antwort-Mail, bei Einwilligung Newsletter | Assistenz |

**Routing:** Küche → Küchenplaner · Hotel/Gastro/Bauträger → Inhaber · CH/FL → Dreiländer-Verantwortlicher · Yacht → Inhaber · Ezarri/Pool → Ezarri-Verantwortlicher · Rest Round-Robin. Ohne Erstkontakt nach Ablauf des SLA geht eine Eskalation per Mail/Push an den Inhaber.

**Erforderliche Formular-Ergänzung (Beratung, neuer optionaler Schritt „Rahmen“ zwischen Schritt 2 und 3, Texte fertig):**

> **Ihr Rahmen** *(freiwillig – hilft uns, das passende Gespräch vorzubereiten)*
> **Worum geht es vor allem?** Wohnen · Küche · Komplette Einrichtung · Outdoor & Garten · Pool, Wellness & Bad (Ezarri) · Yacht & Boot · Hotel & Gastronomie
> **Wo liegt das Projekt?** PLZ oder Ort · Land (Österreich, Deutschland, Schweiz, Liechtenstein, anderes)
> **Wann soll es fertig sein?** in den nächsten 3 Monaten · in 3–6 Monaten · in 6–12 Monaten · später / noch offen
> **Welchen Rahmen haben Sie grob im Kopf?** bis 10.000 € · 10.000–30.000 € · 30.000–100.000 € · über 100.000 € · weiß ich noch nicht
> *Hinweis unter dem Budget:* „Eine ehrliche Spanne hilft uns, Ihnen Stücke und Lösungen zu zeigen, die passen. Sie bleibt unverbindlich.“

Ob der zusätzliche Schritt die Abschlussquote des Formulars senkt, prüft **Test H01** (Nicht-Unterlegenheit). Bis dahin ist alles freiwillig.

---

### 3.3 Lead-Magneten (Spezifikationen)

| # | Magnet | Zielgruppe / Stufe | Inhalt | Erfassung | Übergang zum Termin | Status |
|---|---|---|---|---|---|---|
| LM1 | **Stil-Finder-Moodboard-PDF** (28 Seiten) | B2C, Stufe 3→4 | vorhanden (features/stilfinder) | E-Mail Pflicht, Name/Vorhaben/Region optional; **neu: Feld „Zeitpunkt“ optional** und Checkbox „Ich möchte zum Moodboard beraten werden“ (= Einwilligung zur Kontaktaufnahme, nicht vorangekreuzt) | Seite 26 Termin-QR (vorhanden) + Erfolgsseite mit Kalenderknopf „Moodboard im Studio besprechen – 60 Min., mit Espresso im Café“ | Labs; Versand freischalten nach Bildrechte-Prüfung |
| LM2 | **Planungsleitfaden Küche** „Küche planen am Bodensee: 9 Entscheidungen vor dem ersten Termin“ (PDF, 16 S.) | Küche, Stufe 2→4 | Grundriss und Laufwege · Arbeitshöhe · Material (Stein, Holz, Lack, Binni-Stein in Kooperation) · Geräte · Licht · Stauraum · Zeitplan Neubau (wann der Küchenplaner ins Projekt muss) · CH/FL-Besonderheiten (Normmaße, Geräte) · **Checkliste fürs Erstgespräch** (Grundriss, Fotos, Budgetrahmen) | E-Mail + Projekt-PLZ + Zeitpunkt | letzte Seite: „Bringen Sie diese Checkliste mit – das Erstgespräch dauert 120 Minuten“ + Kalender-QR | neu, Text: Content-Team, Fachprüfung Küchenplaner |
| LM3 | **Planungsleitfaden Komplett-/Ferienimmobilie** „Vom Rohbau zum Einzug: Einrichtungsplan in 6 Phasen“ | Komplett, Second Home, Stufe 2→4 | Phasen, wer wann entscheidet, typische Fehler, Gewerke-Koordination (nur Koordination, keine Bauleitung), Zeitplan Lieferzeiten italienischer Möbel [Lieferzeiten je Marke prüfen] | E-Mail, Ort, Zeitpunkt, Rolle (Bauherr, Architekt, Makler) | Angebot „Erstgespräch mit Grundriss, 90 Min.“ | neu |
| LM4 | **Ezarri-Musterbox** | Pool/Wellness/Bad, Stufe 3→5 | 6–8 Glasmosaik-Muster nach Auswahl im Konfigurator + Farbkarte + Verlegeinfo | Name, Lieferadresse, Projektart (Pool privat, Hotel-Spa, Bad), Fläche m², Zeitpunkt | Anruf 3 Werktage nach Zustellung: „Sind die Muster angekommen? Passen die Töne zu Ihrem Wasser und Licht?“ | Preis-/Rücksende-Regel vom Inhaber; **keine Online-Zahlung** (nicht entschieden) → kostenlos bis 8 Muster, ab Projekt > X m² auch Großmuster [Inhaber] |
| LM5 | **Material-Musterbox Wohnen/Küche** (Stein-, Holz-, Stoffmuster) | Küche/Wohnen nach Termin 1 | 5–10 Muster aus der Planung | aus CRM nach Termin | Muster mit Rückgabe beim Folgetermin = eingebauter zweiter Termin | intern, Kosten nur Porto |
| LM6 | **Hotel-/Gastro-Referenzmappe + FF&E-Leitfaden** „Hotelzimmer, Lobby, Terrasse: Einrichten mit einem Partner“ (PDF, B2B) | Hotels/Gastro, Stufe 1→4 | Leistungsumfang (Planung, Beschaffung, Koordination der Gewerke, Lieferung, Montage auf Anfrage), Ablauf, Zeitplan pro Saison, Outdoor als Einstieg, Pflege und Second-Life-Service. **Nur echte Referenzen mit Freigabe**, keine erfundenen Projekte | Firma, Funktion, Haus/Zimmerzahl, Eröffnung/Renovierung bis, E-Mail, Telefon | persönlicher Anruf ≤ 1 h (A-Lead) + „Projekt-Call 20 Min.“ | neu, braucht Seite `/de/hotel-gastronomie-einrichten` |
| LM7 | **Dreiländer-Rechner-Ergebnis per Mail** (CHF-Preis-Logik) | CH/FL, Stufe 3→4 | Ergebnis des Rechners als PDF mit Annahmen | E-Mail, PLZ | „Video-Beratung CH/FL 30 Min.“ | Rechner vorhanden, Mailversand neu |
| LM8 | **Sofaplaner-Konfiguration speichern/teilen** | Wohnen, Stufe 3→5 | Link/PDF der Konfiguration | E-Mail | „Probesitzen im Studio“ – Terminart 45 Min. | Konfigurator vorhanden |

**Regel für alle Magneten:** Der Versand ist die angefragte Leistung. **Werbliche Folgemails gibt es nur mit separater, nicht vorangekreuzter Einwilligung und Double-Opt-in** (§ 174 TKG AT, § 7 UWG DE; email-flows §0.1) [anwaltlich prüfen]. Die Rückfrage zum konkreten Vorhaben (Anruf/Mail zur Anfrage) ist Teil der Anfragebearbeitung, wenn der Kunde sie im Formular wünscht.

---

### 3.4 Terminbuchung (Spezifikation)

**Stufe 1 – sofort, 0 € (falls Google Workspace oder M365 vorhanden):** `BOOKING_PROVIDER=link`, `BOOKING_URL=<Google Terminplanung bzw. Microsoft Bookings>`. Der Code ist fertig; die Mobil-Leiste „Termin“ zeigt dann auf den Kalender. Klicks laufen als `book_appointment` (vorhanden).

**Terminarten:**

| Terminart | Dauer | Puffer | Vorab-Fragen (Pflicht) | Bestätigungstext (fertig) |
|---|---|---|---|---|
| Wohnen & Einzelstücke im Studio | 60 Min. | 15 | Sparte, PLZ, „Welche Stücke interessieren Sie?“ | „Wir freuen uns auf Sie am {Datum} um {Zeit} in der Landstraße 11, 6911 Lochau. Parkplätze direkt vor dem Haus [prüfen]. Bringen Sie gern Fotos und Maße Ihres Raums mit – der Espresso im Café geht auf uns.“ |
| Küchen-Erstgespräch | 120 Min. | 30 | PLZ, Neubau/Umbau, Zeitpunkt, „Haben Sie einen Grundriss?“ (Upload-Link) | „Für Ihr Küchengespräch haben wir zwei Stunden reserviert. Wenn vorhanden: Grundriss, Fotos, Wunschgeräte. Die Checkliste aus unserem Planungsleitfaden hilft.“ |
| Komplette Einrichtung / Architekt | 90 Min. | 30 | Rolle, Ort, Zeitpunkt, Budgetrahmen | wie oben + „Plan und Bemusterung bereiten wir nach Ihrem Grundriss vor.“ |
| Outdoor, Pool & Ezarri | 60 Min. | 15 | Projektart, Fläche, Zeitpunkt | „Wir zeigen Ihnen Muster bei Tageslicht.“ |
| Video-Beratung CH/FL/DE | 30 Min. | 10 | PLZ, Thema | Link + „Auf Wunsch zeigen wir Ihnen Stücke live aus dem Studio.“ |
| Hotel & Gastronomie (Projekt-Call) | 20 Min. | 10 | Haus, Zimmer, Zeitpunkt | „Danke für Ihr Interesse. {Inhaber} ruft Sie zur vereinbarten Zeit an.“ |

**Slots:** Mo–Fr zur Öffnungszeit, **Do bis 20 Uhr und Sa bis 17 Uhr als Test** (23/§9). Höchstens 3 Küchentermine pro Tag. **Erinnerungen:** 24 h vorher (Mail) und 2 h vorher (SMS/WhatsApp, nur mit Einwilligung). **No-Show-Regel:** am selben Tag anrufen, 2 neue Zeiten anbieten.

**Stufe 2 (mit CRM):** Webhook Kalender → Frappe CRM legt einen Deal auf Stufe 2 an, mit `lead_ref` als verstecktem Parameter. Optional Cal.com (EU-Region, AVV), wenn Round-Robin nach Sparte nötig wird.

---

### 3.5 Nachfass-Sequenzen (ergänzen email-flows §2 und §3)

Grundsatz: **Telefon zuerst, Mail als Begleitung.** Jede Sequenz stoppt automatisch beim Statuswechsel.

**A. Neuer Lead ohne Termin**

| Zeit | Kanal | Inhalt |
|---|---|---|
| ≤ SLA (1 h / 4 h / 1 Tag) | Anruf | Bedarf klären, Score ergänzen, Termin mit 2 Zeitvorschlägen |
| sofort danach | Mail | „Danke für das Gespräch, Ihr Termin am …“ bzw. bei Nichterreichen: „Wir haben Sie leider nicht erreicht. Hier können Sie direkt einen Termin wählen: {Kalender}. Oder rufen Sie uns an: {Telefon}.“ |
| +2 Werktage | Anruf/WhatsApp (falls gewünscht) | zweiter Versuch (email-flows §2.0) |
| +7 Tage | Mail | passender Lead-Magnet (LM2/LM3/LM4) + Kalenderlink. Danach Ende; bei Einwilligung weiter im Newsletter |

**B. Angebot offen** (vorhanden: email-flows §2.1–2.3, Tag 3/14/45) – **Ergänzungen:**
- Angebot **persönlich präsentieren** (Studio oder Video), nicht nur per Mail schicken. Termin für die Präsentation schon im Planungsgespräch vereinbaren.
- **Tag 7:** Muster oder Stoffe zum Anfassen nach Hause (LM5), mit Rückgabe beim Folgetermin.
- **Tag 21 (nur Küche/Komplett):** Einladung „Ihre Küche in echt sehen“: Live-Küche oder Referenzobjekt (nur mit Zustimmung der Eigentümer).
- **Tag 45:** Verlustgrund **Pflichtfeld** (Preis · Lieferzeit · Wettbewerber · Projekt verschoben · Finanzierung · kein Bedarf). Bei „verschoben“: Wiedervorlage zum genannten Monat.
- **Tag 90 (ruhend):** Hinweis auf passende Ausstellungsstücke (Atelierverkauf) – nur bei Einwilligung oder als Antwort auf das konkrete Angebot [anwaltlich prüfen].

**C. Nach Auftrag bis Empfehlung** (email-flows §3 vorhanden) – **Ergänzungen:**
- **Portal-Einladung** mit Auftragsbestätigung: Liefertermin, Dokumente, Produktpass (Kundenportal).
- **Lieferung −7 Tage:** Anruf „Alles bereit? Zugang, Lift, Parkplatz?“ (senkt Reklamationen).
- **+14 Tage:** Bewertungsbitte (vorhanden) mit direktem Google-Link, persönlich unterschrieben.
- **+30 Tage:** **Empfehlungskarte** (fertiger Text): „Wenn Ihnen Ihr neues Zuhause gefällt, freuen wir uns, wenn Sie uns weiterempfehlen. Wer mit Ihrer Karte zu uns kommt, ist zu einem Abend in unserer Küche eingeladen – und Sie auch.“ Ein Erlebnis statt Rabatt, damit es zur Premium-Marke passt. Nachverfolgung über das CRM-Feld `empfohlen_von`.
- **+6 Monate:** Pflege-Check („Ihr Sofa ist ein halbes Jahr alt – kommen Sie zur Stoffpflege?“) → Anlass für Add-ons (G8).
- **+12 Monate:** Jahrestag + Outdoor/Textilwechsel zur Saison → Wiederkauf.

**D. B2B Hotel/Gastro**
- Tag 0: Anruf ≤ 1 h, Referenzmappe (LM6) persönlich senden.
- Tag 7: Vorschlag Ortstermin im Haus (Begehung 60 Min.).
- Tag 30: kurzes Konzept „Erste Zimmerkategorie oder Terrasse als Pilot“: kleiner Einstieg, wenig Risiko für beide Seiten, Vorkasse/Anzahlung 30–50 % (23).
- Danach Rhythmus nach Saisonplan des Hauses (Renovierung in der Nebensaison).

---

### 3.6 Test-Roadmap: 20 A/B-Hypothesen

**Methode:** Zweiseitiger Test, α = 5 %, Power 80 %. Stichprobe je Variante n = 7,85 × [p₁(1−p₁) + p₂(1−p₂)] / (p₂ − p₁)², gerechnet wie im Rechner von [Evan Miller](https://evanmiller.org/ab-testing/sample-size.html). **Dauer = 2n ÷ Besucher pro Tag auf der Testseite**; mindestens 14 Tage (zwei volle Wochen, wegen Wochentagseffekt). **Basisraten und Tagesbesucher sind Annahmen** [Schätzung] und werden vor jedem Test durch die GA4-Werte der letzten 28 Tage ersetzt; die Dauer ist dann neu zu rechnen.

**Wichtige Einschränkung:** Bei regionalem Traffic sind Tests auf die *Lead-Quote* oft zu langsam. Deshalb messen wir zuerst **Mikro-Conversions** mit hoher Basisrate (Schrittabschluss, CTA-Klick) und setzen **große Effekte** an (+20–60 % relativ). Kleine Optimierungen erkennt man auf diesem Volumen nicht. Es läuft immer nur **ein Test pro Seite**. Werkzeug: eigene Aufteilung im Code (Cookie-frei, Zuordnung je Sitzung im Arbeitsspeicher bzw. mit Statistik-Einwilligung in `localStorage`), Auswertung über einen GA4-Parameter `exp_variant`. **Keine** Drittanbieter-Testtools ohne Einwilligung [Datenschutz prüfen].

| # | Hypothese („Wenn … dann …, weil …“) | Seite | Primäre Metrik (Leitplanke) | Basis [Ann.] | MDE rel. | n je Variante | Besucher/Tag [Ann.] | Dauer | Welle |
|---|---|---|---|---|---|---|---|---|---|
| H01 | Ein **optionaler Schritt „Rahmen“** (Budget, Zeitpunkt, PLZ) senkt die Abschlussquote **nicht** spürbar, steigert aber die qualifizierten Leads, weil Interessenten mit echtem Vorhaben gern Rahmen nennen | /beratung | Formularabschluss je Start (Leitplanke: Anteil Score ≥ 40) | 35 % | ±20 % | 755 | 120 Starts | 13 T. (→ 14) | 1 |
| H02 | Hero-CTA **„Termin im Studio wählen“** statt „Beratung anfragen“ steigert die Klicks, weil ein konkreter Schritt weniger Aufwand verspricht | Startseite | CTA-Klickrate (Leitplanke: Leads) | 3 % | +25 % | 9.097 | 400 | 46 T. | 2 (nach Kalender) |
| H03 | **Kalender direkt** neben dem Formular (Tab „Termin buchen“) erhöht die Termine, weil Sofortbuchung den Rückruf-Umweg spart | /beratung | Termine + Anfragen je Besucher | 8 % | +30 % | 2.273 | 120 | 38 T. | 2 |
| H04 | Stil-Finder: **Ergebnis sofort, PDF danach** (heute) vs. **E-Mail vor dem Ergebnis** – gated bringt mehr Leads, aber weniger Abschlüsse; wir testen, was mehr *Termine* bringt | /labs/stilfinder | PDF-Anforderungen je Start (Leitplanke: Abschlussquote Quiz, Termine) | 15 % | +30 % | 1.103 | 40 | 56 T. | 2 |
| H05 | Erfolgsseite Stil-Finder mit **Termin-Knopf „Moodboard im Studio besprechen“** zuerst (statt Teilen/Neustart) steigert Termine | Stil-Finder-Ergebnis | Klick auf Termin | 6 % | +40 % | 1.818 | 40 | 91 T. | 3 |
| H06 | Produktseite mit **„Im Studio ansehen – Termin wählen“** neben „Auf die Merkliste“ steigert Leads, weil Premium-Käufer vor dem Kauf sitzen und anfassen wollen | Produktdetail | Leads je Produktseiten-Sitzung | 0,8 % | +50 % | 9.710 | 600 | 33 T. | 2 |
| H07 | **„Merkliste per E-Mail an mich senden“** steigert wiederkehrende Besuche und Anfragen, weil die Auswahl mit nach Hause geht | /merkliste | Merkliste-Versand bzw. Anfrage je Merkliste-Besucher | 10 % | +40 % | 1.033 | 25 | 83 T. | 3 |
| H08 | Mobil-Leiste **„Anrufen · WhatsApp · Termin“** statt „Termin · Kontakt“ steigert direkte Kontakte | alle (mobil) | contact_click + book_appointment je mobiler Sitzung | 4 % | +30 % | 4.781 | 250 | 39 T. | 1 |
| H09 | **Google-Bewertungen** (Sterne + 2 Zitate) direkt über dem Absende-Knopf steigern den Abschluss, weil Vertrauen am Entscheidungspunkt fehlt (erst ab ≥ 30 Bewertungen) | /beratung, /kontakt | Abschluss je Formularansicht | 10 % | +25 % | 2.504 | 120 | 42 T. | 3 |
| H10 | **Projektbeispiele mit Investitionsrahmen** („Küche, 28 m², Rahmen 60–80 T€“) auf der Küchenseite steigern *qualifizierte* Leads – **erst nach Inhaber-Freigabe zu Preisangaben** | /kuechen-vorarlberg | qualifizierte Leads je Sitzung | 2 % | +40 % | 5.742 | 60 | 192 T. → nur mit mehr Traffic oder als Vorher/Nachher | 4 |
| H11 | **Planungsleitfaden Küche (LM2)** als Block nach dem 2. Abschnitt statt am Seitenende steigert Downloads | Küchen- und Ratgeberseiten | Leitfaden-Anforderungen je Sitzung | 1,5 % | +60 % | 3.702 | 150 | 50 T. | 2 |
| H12 | Ezarri-Konfigurator: primärer CTA **„Musterbox anfordern“** statt „Angebot anfragen“ steigert Leads, weil Farbe von Glasmosaik nur am Muster entschieden wird | /ezarri | Leads je Konfigurator-Abschluss (Leitplanke: Angebote nach 30 T.) | 5 % | +40 % | 2.210 | 60 | 74 T. | 2 |
| H13 | **Telefon optional** statt Pflicht im Kontaktschritt steigert den Abschluss, ohne die Terminquote zu senken | /beratung Schritt 4 | Abschluss je Schritt-4-Ansicht (Leitplanke: Termine je Lead) | 35 % | +20 % | 755 | 120 | 14 T. | 1 |
| H14 | Zusage **„Wir melden uns innerhalb eines Werktags – meist am selben Tag“** am Absende-Knopf steigert den Abschluss (nur, wenn das SLA intern steht!) | alle Formulare | Abschluss je letztem Schritt | 35 % | +15 % | 1.333 | 120 | 23 T. | 1 |
| H15 | Hotel-Seite: **„Projekt-Call 20 Min.“** vs. **„Referenzmappe anfordern“** als Haupt-CTA – die Mappe bringt mehr Kontakte, der Call mehr Opportunities | /hotel-gastronomie (neu) | Leads je Sitzung (Leitplanke: Opportunities) | 5 % | +60 % | 1.057 | 15 | 141 T. → im ersten Jahr Bayes-Auswertung bzw. abwechselnd je Monat | 3 |
| H16 | Nachfassen Tag 14 mit **konkretem Referenzprojekt** vs. **Muster-/Stoffbox-Angebot** – die Box bringt mehr Folgetermine | E-Mail (CRM) | Folgetermin je Mail | 10 % | +60 % | 490 | 6 Mails/Tag | 164 T. → als Vertriebsexperiment über 6 Monate, abwechselnde Zuordnung | 3 |
| H17 | Newsletter-Betreff **persönlich/konkret** („Drei Sofas, die wir gerade im Studio stehen haben“) vs. editorial – höhere Klickrate | Newsletter | Klicks je Zustellung (Öffnungsrate wegen Apple-Datenschutz nur Nebenmetrik) | 40 % Öffnung | +12 % | 1.661 | je Versand | ein Versand ab Liste ≥ 3.400 Empfänger; sonst über 3 Versände kumulieren | 3 |
| H18 | Stadtseiten (z. B. /designermoebel-lindau): Block **„In 15 Minuten bei uns – Anfahrt, Parken, Termin“** oberhalb der Falz steigert Leads aus DE/CH | Stadtseiten | Leads je Sitzung | 1 % | +60 % | 5.592 | 150 (alle Stadtseiten zusammen) | 75 T. | 2 |
| H19 | CH/FL-Seiten mit **Dreiländer-Rechner als Einstieg** („Was kostet mein Sofa in CHF, geliefert?“) steigern Leads aus CH/FL | /einkaufen-aus-der-schweiz | Rechner-Abschluss → Lead | 6 % | +40 % | 1.818 | 40 | 91 T. | 3 |
| H20 | Terminbestätigung mit **persönlicher Café-Einladung und Namen des Beraters** senkt No-Shows | Termin-Mails | No-Show-Quote | 15 % | −40 % (auf 9 %) | 640 | 4 Termine/Tag | 320 T. → als Vorher/Nachher über 3 Monate mit Saisonvergleich | 2 |

**Reihenfolge der Wellen:**
- **Welle 1 (ab Livegang, ohne neue Features):** H01, H13, H14, H08. Das sind Formular und Mobil-Leiste mit hohen Basisraten, also schnell auswertbar.
- **Welle 2 (nach Kalender und Lead-Magneten):** H02, H03, H04, H06, H11, H12, H18, H20.
- **Welle 3 (ab ≥ 30 Bewertungen und mit CRM):** H05, H07, H09, H15, H16, H17, H19.
- **Welle 4 (nach Inhaber-Freigabe zu Preisen):** H10.

**Test-Regeln:** Hypothese, Metrik und Stichprobe **vor** dem Start ins Test-Log schreiben. Nicht vorzeitig abbrechen, wenn es „gut aussieht“ (nur bei klarem Schaden). Gewinner nur bei p < 0,05 **und** wenn die Leitplanke hält. Ohne Signifikanz gilt die einfachere bzw. markenkonformere Variante. Jeder Test braucht ein Abnahmekriterium der Design-Bibel (keine Pop-ups, keine Countdown-Zähler, kein künstlicher Zeitdruck: unlauter nach UWG und schädlich für eine Premium-Marke).

---

### 3.7 Dashboard „Funnel-Wochenblick“ (Spezifikation)

Eine Seite im Backoffice oder ein Looker-Studio-Bericht, **jeden Montag** im Vertriebsmeeting (15 Minuten):

1. Leads der Woche nach Kanal (Attribution) und Klasse A–D
2. **SLA-Quote** (Anteil A/B-Leads, die in der Frist kontaktiert wurden), Ziel ≥ 90 %
3. Termine gebucht / stattgefunden / No-Show
4. Offene Angebote: Anzahl, Wert, Alter (> 14 Tage rot)
5. Gewonnen / verloren mit Verlustgründen
6. Pipeline-Wert gewichtet (Stufe × Wahrscheinlichkeit: Termin 10 %, Angebot 30 %, Verhandlung 60 %)
7. Laufender A/B-Test: Stand, Tage bis zur Auswertung

---

## 4. Maßnahmen

| Prio | Maßnahme | Aufwand | Kosten grob | Erwarteter Umsatzeffekt [Schätzung] mit Begründung | Wer |
|---|---|---|---|---|---|
| **P0** | **Offene Angebote der letzten 12 Monate anrufen**, Liste mit Wert, Status und Verlustgrund (Tabelle reicht, bis das CRM steht) | S | 0 € | 50–150 T€ Auftragseingang in 90 Tagen (00/§5 Nr. 1). Diese Kunden stehen schon an Stufe 6 | Inhaber + Verkauf |
| **P0** | **Antwort-SLA** (A ≤ 1 h, B ≤ 4 h, C ≤ 1 Tag) + Verantwortliche je Sparte + Eskalation an den Inhaber; erst danach H14 | S | 0 € | Lead → Termin +10–20 Pp. Belegt ist der starke Zeiteffekt (HBR 2011: ≈ 7× in der ersten Stunde). Bei 40 qual. Leads/Monat ≈ +1–2 Aufträge ≈ +20–35 T€/Monat | Inhaber |
| **P0** | **Online-Termin freischalten** (`BOOKING_PROVIDER=link`, Terminarten 3.4) | S | 0 € mit Workspace/M365, sonst ≈ 10–15 €/Nutzer/Monat | Termine +15–30 % (H03 misst es). Termin ist die Stufe mit dem höchsten Abschluss | Inhaber (E7) + Code-Team (env) |
| **P0** | **Frappe CRM installieren**: Pipeline-Stufen 11/3.1, Lead-Scoring 3.2, Routing, Pflicht-Verlustgrund, Angebot mit Wert | M | 0 € Lizenz, ≈ 5–10 PT Admin | Abschluss Angebot → Auftrag +5–10 Pp. (11/6.3, unbelegt). Bei 50 Angeboten/Monat ≈ +3–5 Aufträge ≈ +50–90 T€/Monat bei M24. Voraussetzung für alles Weitere | Partner (Frappe-Admin) + Inhaber |
| **P1** | **Formular-Schritt „Rahmen“** (Sparte, PLZ/Land, Zeitpunkt, Budget, optional) + Test H01 | S | Code-Team 1–2 PT | ermöglicht Scoring und Routing. Schnellere Reaktion auf A-Leads, weniger Beratungszeit für D-Leads | Code-Team |
| **P1** | **Nachfass-Sequenzen A–D** in Frappe (Aufgaben + Vorlagen) | S–M | 0 € | in den CRM-Effekt oben eingerechnet. Ohne Automatik verliert man im Alltag die Hälfte der Nachfass-Schritte | Partner + Verkauf |
| **P1** | **Stil-Finder-PDF live** + Kontakt-Checkbox + Kalenderknopf auf der Erfolgsseite | S | Bildrechte klären | ein neuer Lead-Strom ohne Mediakosten; bei 40 Starts/Tag und 15 % ≈ 180 PDF-Leads/Monat, davon 5–10 % Termine ≈ 9–18 Termine | Code-Team + Inhaber (Bildrechte) |
| **P1** | **Ezarri-Musterbox (LM4)** als Haupt-CTA im Ezarri-Konfigurator + Anruf 3 Tage nach Zustellung | S–M | Muster + Porto ≈ 10–20 € je Box | Musteranforderer haben hohe Kaufabsicht. Bei 4 Ezarri-Aufträgen/Monat à 10 T€ ≈ 40 T€/Monat Ziel (Ticket ungeprüft) | Code-Team + Inhaber (Regel) |
| **P1** | **Rückmeldung CRM → Google Ads** (Enhanced Conversions for Leads: Stufen „Qualifiziert“, „Angebot“, „Auftrag“ mit Wert) | M | 0 € Tool, 3–5 PT | Ads-Budget (3–8 T€/Monat ab Q1 2027, 23) optimiert auf Aufträge statt Formulare. Weniger Fehlbudget, typischerweise besser qualifizierte Leads | Code-Team + Partner, Anwalt (AVV) |
| **P1** | **Hotel-/Gastro-Landingpage + Referenzmappe/FF&E-Leitfaden (LM6)** + B2B-Sequenz D | M | Text/Design intern, Druck optional | 1 gewonnenes Hotel = 100–200 T€ (23/§5.1). Der Funnel macht die Outbound-Akquise (Radar, Leadliste 22) messbar und anfragefähig | Code-Team + Inhaber (Referenzen) |
| **P1** | **Funnel-KPI in 23/12.3 korrigieren**: „qualifizierte Leads alle Kanäle“ ≈ 175 bei M36 statt 85; Wochenblick 3.7 einführen | S | 0 € | keine direkte Wirkung, verhindert aber, dass das Team auf zu wenig Leads plant | Inhaber |
| **P2** | **Planungsleitfaden Küche (LM2)** + Komplett (LM3) als PDF mit E-Mail-Erfassung | M | intern | Küche: 1 zusätzlicher Auftrag pro Quartal ≈ +20 T€/Monat (Ø 60 T€) | Content-Team + Küchenplaner |
| **P2** | **Empfehlungskarte + Bewertungsbitte** nach jeder Lieferung (3.5.C) | S | Druck ≈ 200 € | 0,3 Empfehlungs-Leads je Kunde und Jahr. Bei 15 Kunden/Monat ≈ 4–5 warme Leads/Monat mit hoher Abschlussquote | Verkauf |
| **P2** | **A/B-Rahmen im Code** (Variante je Sitzung, GA4-Parameter `exp_variant`, Test-Log) + Welle 1 | M | 3–5 PT | jeder gewonnene Formular-Test +15–20 % Leads auf der Seite. Bei 1,2 % Lead-Quote rechnerisch ≈ +1 Auftrag/Monat je erfolgreichem Test (Annahme) | Code-Team |
| **P2** | **Merkliste per E-Mail** + Sofaplaner/Rechner-Ergebnis speichern (LM7, LM8) | M | intern | mehr wiederkehrende Besuche, Termin mit vorbereiteter Auswahl (kürzere Beratung, höherer Warenkorb) | Code-Team |
| **P2** | **Portal-Einladung mit Auftrag**, Lieferanruf −7 Tage, Pflege-Check +6 Monate | M | intern | weniger Reklamationen; Add-ons/Wiederkauf (G8 ≈ 25 T€/Monat bei M36 laut 23) | Code-Team + Verkauf |
| **P3** | Cal.com mit Round-Robin und Webhook ins CRM (wenn > 3 Berater) | S | ≈ 15 $/Nutzer/Monat [prüfen] | Komfort, weniger Doppelbuchungen | Code-Team |
| **P3** | Wellen 3–4 der Test-Roadmap, inklusive Preis-Rahmen-Test (nach Inhaber-Freigabe) | M | intern | je Test klein, in Summe +10–25 % Lead-Quote über 12 Monate (Annahme) | Code-Team |

---

## Quellen

- Oldroyd, McElheran, Elkington: „The Short Life of Online Sales Leads“, HBR 03/2011, zitiert über [HubSpot](https://blog.hubspot.com/sales/how-to-handle-the-ticking-time-bomb-that-is-an-inbound-lead) und [Venture Harbour](https://ventureharbour.com/how-fast-do-marketing-leads-turn-cold-and-how-to-stop-it-happening/) (Original nicht direkt eingesehen)
- Google Ads Hilfe: [Upgrade Offline-Import → Enhanced Conversions for Leads](https://support.google.com/google-ads/answer/14274408?hl=en), [Google-Tag für Enhanced Conversions for Leads](https://support.google.com/google-ads/answer/11021502?hl=en)
- Conversion-Benchmarks Home & Furniture: [Firework (zitiert Shopify/Dynamic Yield)](https://firework.com/blog/average-e-commerce-conversion-rate-for-high-ticket-sales), [VividWorks](https://www.vividworks.com/blog/furniture-ecommerce-conversion-rate). Das sind Kaufquoten, keine Lead-Quoten; es gibt keine belastbare Branchenzahl für Lead-Formulare
- Stichprobenrechnung: [Evan Miller, Sample Size Calculator](https://evanmiller.org/ab-testing/sample-size.html)
- Intern: 23-masterkonzept (§3.3, §5, §12.3), 00-uebersicht, digital/11-crm-automation, marketing/email-flows, digital/features/stilfinder, `src/lib/attribution.js`, `src/lib/forms/leadPayload.js`, `src/lib/analytics.js`, `src/components/Booking/config.js`, `src/components/BeratungClient/BeratungClient.js`, `src/messages/de.json` (MultiStepForm)
