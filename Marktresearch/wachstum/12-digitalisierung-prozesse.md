# 12 – Digitalisierung der Handelsprozesse: „Ein System, jede Bestellung, jeder Status“

**Stand:** 26.10.2026 · Rolle: Digitalisierungsexperte für Handelsprozesse · Kennzeichnung wie in den übrigen Berichten: **[belegt]** (Quelle), **[Schätzung]** (mit Herleitung), **[prüfen]**, **[vom Unternehmen auszufüllen]**, **[anwaltlich prüfen]**.

> **Rechtliche Hinweise und Textbausteine in diesem Bericht (Abschnitte 7 und 8, Anhang B) sind Entwürfe – vor Verwendung durch eine Rechtsanwältin/einen Rechtsanwalt prüfen lassen.** Steuerliche Punkte (Rechnung, Anzahlung, Registrierkasse, Export CH) zusätzlich mit dem Steuerberater abstimmen.

Bezug: Masterkonzept 23 (8.6 Vertriebsprozess, 13 Organisation), 26 (Binni-Linie: Platzhirsch wird Importeur), 18 (Schweiz), 21 (Finanzierung), digital/07 (E-Commerce, Stripe, Anzahlungslink), digital/11 (CRM, Lead-Pipeline, Nachfassen), digital/14 (Recht). Dieser Bericht setzt **dort an, wo digital/11 aufhört**: beim gewonnenen Auftrag. Lead, Termin und Nachfassen sind in digital/11 geplant und werden hier nur angebunden.

---

## 0. Kurzfassung

1. **Der wichtigste Befund ist technisch: Das Backoffice ist schon Frappe, aber ohne ERPNext.** Die schreibgeschützte Prüfung in digital/11 (1.2) ergab „App erpnext is not installed“, Frappe v15 oder neuer, eigene App `platzhirsch_studio` mit Produkten, Marken und Anfragen. Es gibt also **keine Angebote, Aufträge, Bestellungen, Wareneingänge und Rechnungen im System**. ERPNext ist auf derselben Plattform installierbar. Der Wechsel kostet keinen Systembruch, sondern ist ein Ausbau.
2. **Die größte Zeitersparnis liegt nicht im Angebot, sondern in der Abwicklung danach:** Herstellerbestellung, Abgleich der Auftragsbestätigungen (AB), Lieferterminverfolgung und die Frage „Wann kommt mein Sofa?“. Zusammen [Schätzung] **330–520 Stunden pro Jahr** von insgesamt **≈ 750–1.150 Stunden** (Abschnitt 2). Das sind **0,45–0,7 Vollzeitstellen** und entspricht etwa der Backoffice-Stelle, die das Masterkonzept für M12 einplant (23, Abschn. 13).
3. **Der wertvollste Einzelbaustein ist der AB-Abgleich mit KI.** Hersteller-ABs (PDF, oft Italienisch) werden automatisch gelesen und gegen die eigene Bestellung geprüft: Artikel, Stoff- und Lederkennung, Maße, Preis, Lieferwoche. Ein einziger übersehener Stofffehler bei einem Sofa kostet [Schätzung] 3–10 T€. Der Mensch bestätigt nur die markierten Abweichungen.
4. **Recht und Steuer bestimmen die Reihenfolge mit.** (a) Ein Auftrag, der beim Kunden zu Hause (Aufmaß-Termin) oder aus der Ferne per E-Signatur geschlossen wird, ist ein Auswärts- bzw. Fernabsatzgeschäft mit 14 Tagen Rücktrittsrecht (FAGG); die Ausnahme für Maßanfertigung ist eng (§ 18 Abs 1 Z 3 FAGG). Der Signatur-Workflow muss die Belehrung automatisch beilegen. (b) Kartenzahlungen im Showroom gelten in Österreich als Barumsätze (§ 131b BAO, VfGH 2016); ERPNext-Kasse ist **keine** RKSV-Kasse. Die bestehende Registrierkasse bleibt.
5. **Finanzbuchhaltung bleibt beim Steuerberater.** ERPNext macht Angebote bis Rechnung, Offene Posten und Anzahlungen; die Buchhaltung bekommt einen monatlichen Export. Das spart die aufwendige österreichische Lokalisierung (Kontenrahmen, UVA) im ERP und hält das Projekt in 8–12 Wochen machbar.
6. **Automatisierung zuerst in Frappe selbst** (Notifications, Server Scripts, Assignment Rules, Webhooks). **n8n (selbst betrieben)** nur für Dinge außerhalb des ERP: E-Mail-Postfach lesen, KI-Aufrufe, Brevo, Kalender. Kein Make/Zapier daneben, kein zweites CRM.
7. **Budget [Schätzung]: 25–55 T€ einmalig** (überwiegend Implementierungspartner), **150–600 €/Monat laufend**. Förderung: KMU.DIGITAL läuft laut WKO **ab 2027 nicht weiter** – wenn überhaupt, jetzt noch 2026 beantragen; Alternative go.digital der WK Vorarlberg [prüfen].

---

## 1. Ausgangslage

### 1.1 Was heute bekannt ist

| Thema | Stand | Quelle |
|---|---|---|
| Plattform Backoffice | Frappe Framework v15+, Site `backoffice.platzhirsch.studio`, eigene App `platzhirsch_studio`. Doctypes u. a. Produkte (1.765), Marken, Kategorien, `anfrage`, `anfrage_produkt`, `kontakt_form`, `newsletter_website` | digital/11 Abschn. 1.2; Code `src/app/api/*`, `src/lib/api/*` |
| ERPNext / Frappe CRM | **nicht installiert** („App erpnext is not installed“, „App crm is not installed“) | digital/11 Abschn. 1.2 |
| Sicherheitsbefund | Python-Tracebacks an Gäste (Developer-Mode in Produktion) | digital/11 Abschn. 1.2 |
| Website → Backoffice | einziger Schreibweg sind die Gast-Endpunkte der Formulare | digital/07 Abschn. 1 |
| Team | ≈ 5 FTE: 2 GF, 2–3 Verkauf, Küchenplaner 0–1, Montage über Partner, Backoffice-Stelle „?“ | 23 Abschn. 13 |
| Sortiment/Lieferanten | ca. 36 Marken, davon die meisten aus Italien und Deutschland; Küchen next125/Schüller; neu Binni (Kosovo) mit eigener Importabwicklung | 01, 23, 26 |
| Märkte | AT, DE, CH, FL → Rechnungen mit/ohne AT-USt, CHF-Festpreis, Ausfuhr | 18, 23 |
| Wie heute Angebote, Bestellungen, Rechnungen entstehen | **unbekannt** (vermutlich Word/Excel, Herstellerportale, E-Mail, Buchhaltungssoftware des Steuerberaters) | [vom Unternehmen auszufüllen] |

### 1.2 Was vor dem Start erhoben werden muss (Ist-Aufnahme, 1 Tag)

| # | Frage | Warum |
|---|---|---|
| 1 | Womit werden heute Angebote und Rechnungen geschrieben (Programm, Vorlage, Nummernkreis)? | Nummernkreise müssen lückenlos weiterlaufen (§ 11 Abs 1 Z 3 lit. c UStG: fortlaufende Nummer) |
| 2 | Welche Buchhaltungssoftware nutzt der Steuerberater (BMD, RZL, DATEV, andere)? | bestimmt das Exportformat |
| 3 | Welche Registrierkasse läuft im Showroom/Café? | bleibt bestehen, Schnittstelle prüfen |
| 4 | Welche Küchenplanungssoftware wird verwendet (z. B. Winner/Compusoft, CARAT, KPS) und bestellt sie elektronisch bei Schüller/next125? | Küchenbestellungen laufen oft direkt aus der Planungssoftware; ERPNext soll das nicht doppeln |
| 5 | Welche Hersteller haben ein B2B-Bestellportal, welche nehmen Bestellungen per E-Mail/PDF? | bestimmt, wo der AB-Abgleich ansetzt |
| 6 | Mengengerüst 2025: Angebote, Aufträge, Herstellerbestellungen, Reklamationen, Montagen | ersetzt die Schätzungen in Abschnitt 2 |
| 7 | Server und Betrieb: Wer betreibt das Backoffice heute (eigener Server, Agentur, Frappe Cloud)? Wer hat Administrator-Zugang? | Grundvoraussetzung |
| 8 | M365 oder Google Workspace? | E-Mail-Integration, Kalender, Ablage |

---

## 2. Zeitersparnis: Rangliste der Prozesse [Schätzung]

### 2.1 Mengengerüst (Herleitung)

| Größe | Annahme | Herleitung |
|---|---|---|
| Umsatz Handel | 1,1–1,3 Mio. €/Jahr | 90–110 T€/Monat ohne Café (00, Abschn. 3) |
| Ø Auftrag | 15–25 T€ (Möbel/Küche), dazu Kleinaufträge | 23, digital/11 |
| Aufträge pro Jahr | **60–90** größere plus ≈ 100–200 Kleinaufträge (Zubehör, Leuchten) | 1,2 Mio. € ÷ Ø 18 T€ ≈ 65; Rest Kleinaufträge |
| Angebote pro Jahr | **180–300** | Abschlussquote im Premium-Möbelhandel [Schätzung] 30–40 % |
| Herstellerbestellungen | **250–400** | 3–5 Lieferanten je Auftrag (Sofa, Tisch, Leuchte, Teppich, Outdoor) |
| Reklamationen | **25–45** | [Schätzung] 3–5 % der Positionen; Transportschäden, Stofffehler, Fehllieferungen |
| Montagen/Lieferungen | **60–100** | ≈ 1 je größerem Auftrag, Küchen 2–3 Termine |

### 2.2 Rangliste nach eingesparten Stunden

| Rang | Prozess | Heute je Vorgang | Digital je Vorgang | Vorgänge/Jahr | **Ersparnis h/Jahr** | Aufwand Umsetzung | Abschnitt |
|---|---|---|---|---|---|---|---|
| 1 | **Lieferstatus und Kundenrückfragen** („Wann kommt …?“, Liefertermine nachfragen bei Herstellern, Kunde informieren) | 3–6 h/Woche im Team | 0,5–1,5 h/Woche | 50 Wochen | **120–220** | M | 4.6, 6 |
| 2 | **Angebot erstellen** (Positionen, Preise, Texte, Komplettierung, Varianten, PDF) | 60–120 min | 20–40 min | 180–300 | **120–250** | M | 4.2, 9 |
| 3 | **E-Mails, Übersetzungen, Korrespondenz** (IT/EN mit Herstellern, EN/FR/IT mit Kunden) | 30–60 min/Tag im Team | 15–30 min/Tag | 230 Tage | **60–115** (konservativ) | S | 9 |
| 4 | **AB-Abgleich** (Auftragsbestätigung des Herstellers gegen Bestellung prüfen) | 15–30 min | 3–6 min | 250–400 | **60–150** | M | 4.4 |
| 5 | **Herstellerbestellung aus dem Auftrag** (je Lieferant, Stoffcodes, Lieferadresse, Kommission) | 20–30 min | 5–10 min | 250–400 | **60–130** | S (in ERPNext Standard) | 4.3 |
| 6 | **Anzahlung, Rechnung, Zahlungseingang, Mahnung** | 30–45 min je Auftrag | 10–15 min | 60–90 + Kleinaufträge | **40–80** | M | 4.7 |
| 7 | **Montage- und Lieferplanung** (Termin, Team, Fahrzeug, Kunde, Monteur-Unterlagen) | 60–90 min je Montage | 20–30 min | 60–100 | **40–100** | M | 4.5 |
| 8 | **Reklamationen** (Fotos sammeln, Hersteller anschreiben, nachverfolgen, Kunde informieren) | 3–5 h je Fall | 1,5–2,5 h | 25–45 | **40–110** | S–M | 4.8 |
| 9 | **Aufmaß übertragen** (Notizen/Skizzen abtippen, Rückfragen, Fehler) | 30–60 min | 5–10 min | 50–80 | **20–65** | S | 4.9 |
| 10 | **Wareneingang und Fotodokumentation** (Lieferschein prüfen, Schaden dokumentieren, Lagerplatz, Kunde informieren) | 15–20 min | 5–8 min | 250–400 | **40–80** | S | 4.4, 4.10 |
| | **Summe** | | | | **≈ 600–1.300**, Mittelwert **≈ 750–1.150** | | |

**Lesart:** Die Spannbreite ist groß, weil die echten Mengen fehlen (1.2 Frage 6). Selbst die Untergrenze (≈ 600 h) entspricht einem Drittel einer Vollzeitstelle. Dazu kommen Effekte ohne Stunden-Wert: weniger Fehlbestellungen, schnellere Anzahlungen (Liquidität, 23 Gate 0), Lieferantenreklamationen innerhalb der Fristen.

**Bewertung in Geld [Schätzung]:** 900 h × 40–55 € Vollkosten/h ≈ **36–50 T€ pro Jahr** an Arbeitszeit, die in Beratung statt Verwaltung geht. Bei einem Ø-Rohertrag von 33 % (23) ist **ein** zusätzlicher Auftrag à 20 T€ pro Quartal schon ≈ 26 T€ Rohertrag/Jahr.

### 2.3 Umsetzungsreihenfolge (Zeitersparnis ÷ Aufwand, mit Abhängigkeiten)

Rang 1 (Lieferstatus) ist der größte Block, braucht aber Aufträge und Bestellungen im System. Darum ist die Bau-Reihenfolge:

| Welle | Wochen | Inhalt | Ersparnis ab dann [Schätzung] |
|---|---|---|---|
| **W0 Fundament** | 1–2 | Ist-Aufnahme, Staging-Kopie, Backup, Tracebacks abschalten, ERPNext auf Staging, Stammdaten-Mapping | 0 |
| **W1 Auftragskern** | 3–6 | Kunde, Angebot (aus dem Produktkatalog), Auftrag, **Bestellung je Hersteller per Knopfdruck**, Anzahlungsanforderung, Rechnung, Export Steuerberater. KI-Assistent für E-Mails/Übersetzungen parallel (unabhängig vom ERP) | Rang 2, 3, 5, 6 ≈ 280–575 h |
| **W2 Lieferkette** | 7–9 | AB-Eingang mit KI-Abgleich, Lieferwoche je Position, Wareneingang mit Pflichtfotos, automatische Status-Mails an Kunden | Rang 1, 4, 10 ≈ 220–450 h |
| **W3 Außendienst** | 10–12 | Montageplanung (Kalender, Monteur-Ansicht mobil), Aufmaß-Formular, Abnahmeprotokoll mit Unterschrift, Reklamationen | Rang 7, 8, 9 ≈ 100–275 h |
| **W4 Kunde sieht mit** | 13–16 | Kundenportal (Auftragsstatus, Lieferwoche, Dokumente, Reklamation melden), digitale Vertragsunterschrift aus der Ferne | verstärkt Rang 1 |
| **W5 Feinschliff** | ab 17 | Dashboards (Rohertrag je Auftrag, Lieferverzug je Hersteller), Binni-Importprozess, Schweiz-Ausfuhr, CRM-Anbindung digital/11 | Steuerung |

Die CRM-Pipeline aus digital/11 (F2/F3) läuft **parallel ab W1** oder davor; ein gewonnener Deal erzeugt dann direkt Kunde und Angebot in ERPNext (Abschnitt 3.3).

---

## 3. Zielarchitektur

### 3.1 Bild

```
 Kunde                     Platzhirsch-Team (Showroom, Tablet, Handy)              Partner/Lieferanten
 ─────                     ──────────────────────────────────────────              ────────────────────
 Website-Formular ─┐
 Kalender (digital/11) ─┼─► Frappe CRM (Lead → Deal)   ── gewonnen ──► ERPNext
 Telefon/Showroom ─┘                                                    │
                                                                        ├─ Kunde, Angebot (Katalog 1.765 Artikel)
 Signatur-Link ◄──── Angebot als Vertrag (DocuSeal) ◄───────────────────┤
                                                                        ├─ Kundenauftrag + Anzahlungsanforderung ──► Stripe-Link / Überweisung
                                                                        ├─ Bestellung je Hersteller ──────────────────► Minotti, Poliform, Flos …
 Status-Mail / Portal ◄─── Lieferwoche je Position ◄── AB-Abgleich (KI) ◄┤◄──── AB per E-Mail (PDF, IT/DE/EN)
                                                                        ├─ Wareneingang + Fotos (Handy)  ◄──────────── Spedition (CMR)
 Abnahme unterschreiben ◄── Montage-Auftrag (Kalender, Monteur mobil) ──┤
 Reklamation melden ──────► Garantiefall (Fotos, Frist, Hersteller-Nr.) ┤──────────────────────────────────────► Hersteller-Reklamation
                                                                        ├─ Ausgangsrechnung (§ 11 UStG, CH-Ausfuhr) ─► Export an Steuerberater (BMD/RZL/DATEV)
 Registrierkasse (bestehend, RKSV) ─── Tagesumsatz-Import (optional) ───┘
                    n8n (selbst betrieben): Postfach lesen · KI-Aufrufe · Brevo · Kalender · Backups prüfen
```

### 3.2 Grundsätze

1. **Eine Datenbank.** Produkte (heute in `platzhirsch_studio`), Kunden, Aufträge, Bestellungen, Reklamationen liegen in **einer** Frappe-Site. Die Website liest weiter dieselben Produkte (`src/lib/api/*`), keine Doppelpflege.
2. **ERPNext-Standard vor Eigenbau.** Quotation, Sales Order, Purchase Order, Purchase Receipt, Delivery Note, Sales Invoice, Payment Request, Payment Entry, Project/Task, Warranty Claim sind Standard-Doctypes. Eigene Felder per *Custom Field*, eigene Logik per *Server Script*, keine Änderungen am ERPNext-Code (sonst scheitert jedes Update, etwa von v15 auf v16).
3. **Was nicht ins ERP gehört, bleibt draußen:** Finanzbuchhaltung (Steuerberater), Registrierkasse (RKSV), Küchenplanung (Planungssoftware), E-Mail-Newsletter (Brevo, digital/11).
4. **Automatisch heißt: das System bereitet vor, der Mensch bestätigt.** Keine automatische Bestellung beim Hersteller, keine automatische Rechnung an Kunden ohne Klick. Ausnahme: reine Status-Mails.
5. **Mobil zuerst für alles außerhalb des Büros:** Wareneingang, Aufmaß, Montage, Reklamationsfotos laufen im Browser auf Handy/Tablet (Frappe-Oberfläche ist responsiv; eigene Web-Formulare als PWA). Keine App-Store-App.

### 3.3 Frappe CRM und ERPNext zusammen

digital/11 empfiehlt **Frappe CRM** für die Lead-Pipeline. ERPNext hat selbst Lead/Opportunity, aber die Oberfläche von Frappe CRM ist für Verkäufer deutlich angenehmer. Frappe CRM bietet eine ERPNext-Anbindung (Deal gewonnen → Kunde und Angebot in ERPNext) [Funktionsumfang in der installierten Version prüfen]. Entscheidung: **beide Apps auf derselben Site**, Verkauf arbeitet in CRM bis „Auftrag“, ab dann in ERPNext.

### 3.4 Betrieb: drei Varianten

| Variante | Kosten laufend | Vorteil | Nachteil | Urteil |
|---|---|---|---|---|
| **A: ERPNext in die bestehende Site installieren** (gleicher Server) | Server wie heute, ggf. mehr RAM (8–16 GB) | eine Datenbank, Produkte sofort als Artikel nutzbar | Risiko für die Live-Website beim Update → nur nach Test auf Staging-Kopie | **Empfehlung**, mit Staging |
| B: eigene ERPNext-Site, Sync per API | zweite Site | Website-Daten unberührt | Doppelte Produkte, Sync-Pflege, genau das, was digital/11 vermeiden will | nur, wenn A beim Test scheitert |
| C: Umzug auf Frappe Cloud | laut Frappe-Doku Private Bench ab ≈ 25 $/Monat (AWS/OCI); Preise schwanken, aktuelle Seite prüfen [belegt S3, prüfen] | Updates, Backups, Monitoring durch Frappe | Abhängigkeit, Datenstandort wählen (EU-Region), Custom App muss mitziehen | sinnvoll, wenn heute niemand intern den Server pflegt |

**Versionsfrage:** ERPNext und Frappe v16 sind seit **12.01.2026** stabil [belegt S1]. ERPNext-Version muss zur Frappe-Version passen. Ist das Backoffice auf v15, zuerst ERPNext v15 installieren und das Update auf v16 als eigenes Projekt mit Staging planen (laut Frappe-Forum manuell, mit Test auf einer Kopie) [belegt S1]. Befehl zur Prüfung: `bench version` [vom Unternehmen/Betreiber auszufüllen].

**Lizenz:** ERPNext GPL-3.0, Frappe CRM und Frappe Helpdesk AGPL-3.0 – für die interne Nutzung ohne Lizenzkosten. Der eigene Code in `platzhirsch_studio` bleibt eigener Code, solange er nicht weitergegeben wird [prüfen, falls die App je an Dritte geht].

---

## 4. Prozesse im Detail

Für jeden Prozess: Ablauf, ERPNext-Bausteine, eigene Felder, Automatik, Ersparnis.

### 4.1 Stammdaten (Voraussetzung für alles)

| Objekt | Quelle heute | Ziel in ERPNext | Hinweise |
|---|---|---|---|
| Artikel | `platzhirsch_studio`-Produkte (1.765) | **Item** (Link vom Produkt auf das Item oder Produkt-Doctype als Item-Erweiterung) | Konfigurierbare Möbel (Sofa mit Stoff, Maß, Modul) als **Item-Vorlage + Freitext-Merkmale** abbilden, nicht als Tausende Varianten. Pflichtfelder je Position: Modell, Maß, Bezug/Stoffcode, Farbe/Oberfläche, Lieferant |
| Lieferanten | – | **Supplier** je Marke (Minotti, Poliform, Flos …), mit Sprache (IT/DE/EN), Bestellweg (Portal/E-Mail), Ø Lieferzeit, Zahlungsbedingung (Vorkasse wegen EK-Lage, 00 Abschn. 2) | Hersteller-Adressen sind zugleich GPSR-Pflichtangaben für Online-Angebote (digital/14 F5) – **einmal pflegen, zweimal nutzen** |
| Kunden | Anfragen in 3 Doctypes | **Customer + Contact + Address**, Land, Sprache, Kundentyp (Privat/Architekt/Hotel/Bauträger), Lieferadresse ≠ Rechnungsadresse | Dubletten über E-Mail/Telefon zusammenführen (digital/11 F2) |
| Preise | keine im Backoffice | **Price List** „Verkauf EUR“, „Verkauf CHF Festpreis“ (18), „Einkauf je Lieferant“ | Einkaufspreise erst eintragen, wenn bestellt wird; nicht 1.765 Preise vorab pflegen |
| Steuer | – | Steuervorlagen: AT 20 %, innergemeinschaftlich B2B steuerfrei (UID geprüft), Ausfuhr CH/FL steuerfrei [mit Steuerberater], Lieferung an Privat DE (Versandhandel/OSS, digital/07) [prüfen] | Vorlage wird anhand Land + Kundentyp automatisch gezogen |

**Aufwand:** M. Das Mapping Produkte → Items ist die einzige echte Migrationsarbeit.

### 4.2 Angebot (Quotation) – Rang 2

**Ablauf heute [vom Unternehmen auszufüllen]**, Ziel:
1. Berater öffnet den Deal (CRM) → „Angebot erstellen“ → ERPNext-Quotation mit Kunde, Sprache, Währung.
2. Positionen aus dem Katalog (Suche nach Marke/Modell), Bezug/Stoff als Freitextfeld, Bild automatisch aus dem Produkt.
3. **Drei Blöcke** nach Bericht 10: Hauptpositionen · Optionen (Gut/Besser/Best, einzeln abwählbar, nichts vorausgewählt) · **Komplettierungsliste** (Masterkonzept 8.6 „immer mit Komplettierungsliste und Finanzierungsoption“).
4. KI-Knopf „Angebotstext“ erzeugt Einleitung und Positionsbeschreibungen aus den **Katalogdaten** (Abschnitt 9). Keine Händler-Aussagen („offizieller Minotti-Händler“) – feste Regel im Prompt und Prüfwortliste.
5. Pflichtangaben automatisch: Gültigkeit (z. B. 30 Tage), Lieferzeit als Spanne mit Hinweis „laut Hersteller, unverbindlich bis AB“, Anzahlungsregel, Zahlungsbedingungen, AGB-Verweis, bei CH der Festpreis „inkl. MWST, Verzollung, Lieferung“ (18).
6. Druckformat in Platzhirsch-Gestaltung (Jinja-Print-Format, DE/EN/IT/FR).
7. Versand als PDF aus ERPNext (E-Mail im Datensatz) **oder** als Signatur-Link (4.11).

**Automatik:** Angebotsdatum setzt die Nachfass-Aufgaben +3/+14/+45 Tage aus digital/11 F3; Status „verloren“ verlangt einen Grund.

**Eigene Felder:** `komplettierung_angeboten` (Ja/Nein, Pflicht), `finanzierung_angeboten`, `quelle` (aus CRM), `kanal_vertragsschluss` (Showroom / außerhalb Geschäftsraum / Fernabsatz – steuert die Rücktrittsbelehrung, Abschnitt 7.1).

### 4.3 Kundenauftrag und Herstellerbestellung – Rang 5

1. Angebot angenommen → **Sales Order** (ein Klick, Positionen werden übernommen).
2. Anzahlungsanforderung (4.7) geht automatisch als Entwurf mit.
3. Knopf **„Bestellungen erzeugen“** (ERPNext-Standard „Make Purchase Order“ aus Sales Order, gruppiert nach Lieferant): je Hersteller eine **Purchase Order** mit Kommissionsnummer = Auftragsnummer, Kundenname nur als Kürzel (Datensparsamkeit gegenüber Herstellern), Lieferadresse Lochau oder Direktlieferung.
4. Bestellung in der Sprache des Lieferanten (Druckformat IT/DE/EN), Versand per E-Mail aus ERPNext. Bei Herstellern mit B2B-Portal: Bestellnummer aus dem Portal in das Feld `hersteller_bestellnr` eintragen (Portal bleibt, ERPNext ist die Klammer).
5. **Küchen:** Bestellung erfolgt meist aus der Planungssoftware (1.2 Frage 4). In ERPNext nur Sammelposition „Küche lt. Planung Nr. …“ mit Einkaufswert und Lieferwoche, damit Rohertrag und Status stimmen.
6. **Binni (26):** eigene Bestellart „Import Drittland“ mit Pflichtfeldern Incoterm, Ursprungsnachweis (EUR.1/Ursprungserklärung), Zollspediteur, Einfuhrumsatzsteuer, GPSR-Unterlagen. Checkliste als Pflicht vor „Bestellung absenden“.

**Rohertrag je Auftrag** ist ab hier automatisch sichtbar (Verkaufswert − Einkaufswerte der Bestellungen − Montage). Das ist die Kennzahl „Rohertrag je Arbeitsstunde“ aus 23/8.6.

### 4.4 Auftragsbestätigung des Herstellers (AB-Abgleich) und Wareneingang – Rang 4 und 10

**Problem:** Die AB kommt als PDF per E-Mail (oft Italienisch), mit eigener Artikelnummer, Stoffkennung und „Liefertermin KW xx“. Heute wird sie wahrscheinlich gelesen, abgelegt und der Termin irgendwo notiert [vom Unternehmen auszufüllen]. Fehler (falscher Stoff, falsches Maß, anderer Preis) fallen erst bei der Lieferung auf.

**Lösung (W2):**
1. Eigenes Postfach `bestellungen@platzhirsch.studio` [Adresse vom Unternehmen festzulegen], an das Hersteller ABs schicken (auf jeder Bestellung als Antwortadresse).
2. **n8n** liest das Postfach (IMAP), erkennt die Bestellnummer (Kommissionsnummer im Betreff/PDF) und schickt das PDF an ein Sprachmodell mit festem Ausgabeschema (JSON): Positionen, Artikelcode, Bezug, Maße, Menge, Einzelpreis, Liefer-KW, Zahlungsbedingung.
3. n8n legt in ERPNext einen Datensatz **„Lieferantenbestätigung“** (eigener Doctype, verknüpft mit der Purchase Order) an, das PDF hängt als Anlage dran.
4. Server Script vergleicht Feld für Feld mit der Bestellung und setzt eine Ampel:
   - **Grün:** alles gleich → Lieferwoche wird in Bestellung und Kundenauftrag übernommen, Kunde bekommt Status-Mail „Ihr Sofa ist bestätigt, voraussichtlich KW 9“.
   - **Gelb:** Lieferwoche später als im Angebot genannt → Aufgabe an den Berater („Kunde anrufen“), Status-Mail erst nach Freigabe.
   - **Rot:** Artikel, Bezug, Maß, Menge oder Preis weichen ab → Aufgabe mit Gegenüberstellung, Frist 24 h (Hersteller produzieren nach AB).
5. Fehlt nach 7 Tagen die AB, erinnert das System an den Hersteller (Aufgabe oder vorbereitete Mail).

**Datenschutz:** In ABs stehen meist keine Endkundendaten außer Kommissionskürzel. KI-Anbieter mit AVV, ohne Training auf Kundendaten, EU-Verarbeitung oder lokales Modell (Abschnitt 9.3).

**Wareneingang (Purchase Receipt) mobil:**
- Lagerist/Verkäufer scannt Lieferschein oder wählt die Bestellung, hakt Positionen ab.
- **Pflichtfotos** bevor die Spedition fährt: Verpackung rundum, Etikett, jeder sichtbare Schaden. Ohne Foto lässt sich der Wareneingang nicht buchen (Server Script).
- Schaden sichtbar → Vorbehalt auf dem Frachtbrief. Nach **CMR Art. 30** müssen äußerlich erkennbare Schäden bei Ablieferung, nicht erkennbare **binnen 7 Tagen** (ohne Sonn- und Feiertage) schriftlich vorbehalten werden, sonst gilt die Vermutung ordnungsgemäßer Ablieferung [belegt S10; für innerösterreichische Transporte gilt AÖSp/UGB, prüfen]. Das System erzeugt dafür automatisch eine Aufgabe mit Frist und Mailvorlage an die Spedition.
- Lagerplatz (Lager Lochau, Ausstellung, Direkt) und automatische Info an den Berater: „Ware für Auftrag A-2026-123 komplett – Montage planen“.

### 4.5 Montage- und Lieferplanung – Rang 7

| Baustein | Umsetzung |
|---|---|
| Montage-Auftrag | ERPNext **Project** je Auftrag mit **Tasks** (Lieferung, Montage, Elektro, Nacharbeit) oder eigener Doctype „Montage“ verknüpft mit Sales Order/Delivery Note |
| Planungstafel | Kalender- und Gantt-Ansicht der Tasks (Frappe-Standard), Filter nach Team/Fahrzeug |
| Freigabe-Regel | Montage erst planbar, wenn alle Positionen „eingegangen“ sind **und** die Restzahlung geregelt ist (Feld aus 4.7) |
| Kunde | Terminvorschlag per Mail mit 2–3 Optionen, Bestätigung per Link (W4 Portal), Erinnerung 48 h vorher (Zufahrt, Lift, Stockwerk, Parkplatz) |
| Monteur (auch Partner wie Sigg, 23) | mobile Ansicht: Adresse, Kontakt, Positionsliste, Fotos aus Wareneingang, Aufmaß, Montagehinweise; **Partner bekommen nur Gastzugang auf ihre Aufträge** (Rolle mit Benutzerberechtigung) |
| Abnahme | digitales Abnahmeprotokoll auf dem Tablet: Positionen in Ordnung / Mangel, Fotos, Unterschrift Kunde (einfache elektronische Signatur reicht als Nachweis, 7.2) → PDF an Kunde, Mängel erzeugen automatisch einen Garantiefall (4.8) |
| Schweiz/FL | Montage-Task mit Pflichtfeldern für Entsendung/Meldeverfahren und CH-Partner (18) [prüfen] |

### 4.6 Lieferstatus und Kundeninformation – Rang 1

Der größte Zeitfresser ist das Hinterhertelefonieren. Ziel: **Der Kunde erfährt jeden Meilenstein, bevor er fragt.**

| Meilenstein | Auslöser im System | Kunde erhält |
|---|---|---|
| Auftrag bestätigt | Sales Order eingereicht | Auftragsbestätigung (PDF), Anzahlungslink, „so geht es weiter“ |
| Beim Hersteller bestellt | alle Purchase Orders versendet | kurze Mail „bestellt, wir melden uns mit dem Termin“ |
| Hersteller bestätigt | AB grün (4.4) | „voraussichtlich KW …“ |
| Verzögerung | neue Liefer-KW > alte | **Aufgabe an Berater**, Mail erst nach Freigabe (heikle Nachricht persönlich) |
| Ware eingetroffen | Wareneingang vollständig | „Ware ist da – Montagetermin wählen“ |
| Montage geplant | Task terminiert | Termin, Erinnerung 48 h |
| Abgeschlossen | Abnahme | Danke, Pflegeanleitung, später Bewertungsbitte (digital/11 F6, marketing/qr-karte-bewertung) |

Technisch: Frappe **Notification** je Statuswechsel, Vorlagen DE/EN/IT/FR, Absender = zuständiger Berater. Status-Mails sind Vertragskommunikation, keine Werbung (keine Einwilligung nötig); Bewertungsbitte und Pflegeangebote siehe digital/11 (Rechtsrahmen § 174 TKG).

Zusatz: **Lieferverzug-Dashboard** je Hersteller (Ø Abweichung AB-Woche zu Liefertermin) – Argument in den Gesprächen mit Herstellern und ehrliche Lieferzeit-Angaben auf der Website (Ratgeber `lieferzeiten-italienische-designmoebel.md`).

### 4.7 Anzahlung, Rechnung, Zahlung – Rang 6

| Schritt | Umsetzung | Hinweis |
|---|---|---|
| Anzahlungsanforderung | **Payment Request** aus Sales Order (z. B. 30–50 % [vom Unternehmen festzulegen]); Zahlung per Überweisung (QR-Code auf PDF, EPC-QR) oder Stripe-Link (digital/07 Abschn. 4 Anzahlungsseite mit signiertem Link) | Wegen der EK-Lage verlangen Lieferanten Vorkasse (00). Ohne Anzahlung keine Herstellerbestellung: Server Script sperrt „Bestellung absenden“, Override nur durch GF |
| Anzahlungsrechnung | Bei Anzahlungen entsteht die USt in Österreich mit Vereinnahmung (Mindest-Istbesteuerung, § 19 Abs 2 Z 1 lit. a UStG) → Anzahlungsrechnung mit ausgewiesener USt; Druckformat „Anzahlungsrechnung“ [mit Steuerberater abstimmen] | ERPNext verrechnet Anzahlungen (Payment Entry als Advance) in der Schlussrechnung |
| Schlussrechnung | **Sales Invoice** aus Sales Order/Delivery Note, Anzahlungen abgezogen; Pflichtangaben nach § 11 UStG (fortlaufende Nummer, Leistungsdatum, UID bei > 10.000 € brutto auch des Empfängers bei B2B, Steuersatz/Befreiungsgrund) | Nummernkreis aus Altsystem fortführen |
| Schweiz/FL | Ausfuhrlieferung steuerfrei mit Ausfuhrnachweis (Feld + Anlage e-dec/Ausfuhrbescheinigung), CHF-Betrag; Ablauf nach 18 [Steuerberater] | Pflichtanlage, sonst kein Rechnungsabschluss |
| E-Rechnung | AT: keine allgemeine B2B-Pflicht, nur B2G seit 2014; EU-weit strukturierte E-Rechnung für **innergemeinschaftliche B2B-Umsätze ab 01.07.2030** (RL (EU) 2025/516, Norm EN 16931) [belegt S6/S7]. Für Kunden in DE: dort müssen Unternehmen seit 2025 E-Rechnungen empfangen können; ZUGFeRD/XRechnung aus ERPNext über die App **eu_einvoice** (ALYF, CII-Profile inkl. EN 16931, kein Peppol-Versand) [belegt S8] | Jetzt nicht nötig, aber die Architektur ist bereit |
| Zahlungseingang | Bank-CSV/CAMT-Import in ERPNext („Bank Reconciliation“) wöchentlich oder Stripe-Webhook → Payment Entry | Anbindung an die Hausbank per CAMT.053 [prüfen] |
| Mahnung | Dunning (ERPNext) bzw. Notification +7/+14 Tage nach Fälligkeit, Text freundlich, zweite Stufe nur nach Freigabe | |
| Export Buchhaltung | monatlich Ausgangsrechnungen, Zahlungen, Debitoren als CSV im Format der Steuerberater-Software (BMD/RZL/DATEV) | Format mit Steuerberater festlegen; bei DATEV-Formaten gibt es Community-Apps [prüfen] |
| Aufbewahrung | Bücher und Belege 7 Jahre (§ 132 BAO, § 212 UGB); in ERPNext eingereichte Belege sind unveränderlich (Storno/Neuanlage statt Überschreiben) | Backup-Konzept mit Prüfung der Wiederherstellung (Abschnitt 10) |

**Registrierkasse (wichtig):** Kartenzahlungen und Bargeld im Showroom sind Barumsätze; ab 15.000 € Jahresumsatz und 7.500 € Barumsätzen je Betrieb besteht Registrierkassenpflicht mit Sicherheitseinrichtung (§ 131b BAO; VfGH 09.03.2016, G 606/2015 zur Gleichstellung von Karten) [belegt S4/S5]. **Der ERPNext-Point-of-Sale ist keine RKSV-zertifizierte Kasse.** Zahlungen am Terminal im Showroom laufen weiter über die bestehende Kasse (bzw. eine RKSV-Kasse), ERPNext bucht nur die Zahlung zum Auftrag. Überweisungen sind keine Barumsätze. Wie Stripe-Online-Zahlungen einzuordnen sind, mit Steuerberater klären [prüfen].

### 4.8 Reklamationsmanagement – Rang 8

| Baustein | Umsetzung |
|---|---|
| Datensatz | ERPNext **Warranty Claim** (Support-Modul) oder Frappe **Helpdesk** (AGPL, eigenes Ticket-Portal). Für 25–45 Fälle/Jahr reicht Warranty Claim mit eigenen Feldern; Helpdesk erst, wenn das Kundenportal Tickets braucht |
| Eingang | Telefon/Showroom (Berater legt an), Abnahmeprotokoll mit Mangel (automatisch), E-Mail an `service@…` (n8n legt an), Portal-Formular (W4) |
| Pflichtfelder | Auftrag/Position, Lieferant, Art (Transportschaden / Produktionsfehler / Fehllieferung / Montage / Kundenwunsch), Fotos (mind. 2), Entdeckt am, **Fristen** (CMR 7 Tage bei Transport; Rügefrist im Vertrag mit Hersteller [vom Unternehmen auszufüllen]), Hersteller-Reklamationsnummer, Lösung (Nachbesserung, Austausch, Preisminderung, Gutschrift) |
| Hersteller | vorbereitete Reklamationsmail in der Sprache des Herstellers (KI-Übersetzung, 9.2), mit Fotos, Kommission, Artikelcode, Bestell- und AB-Nummer. Wiedervorlage alle 7 Tage bis Antwort |
| Kunde | Eingangsbestätigung sofort, Zwischenstand alle 14 Tage automatisch (Text vom Berater freigegeben), Abschluss mit Unterschrift |
| Recht | Gegenüber Verbrauchern haftet Platzhirsch: Gewährleistung 2 Jahre, Vermutung des Mangels bei Übergabe innerhalb **1 Jahres** (§ 11 VGG) [prüfen]; DE-Kunden § 477 BGB (1 Jahr); Regress gegen den Hersteller (§ 933b ABGB, Vertrag Binni 26) [anwaltlich prüfen]. Feld „Gewährleistung bis“ automatisch aus Übergabedatum |
| Auswertung | Reklamationsquote je Hersteller und Ursache, Kosten je Fall → Sortimentsentscheidungen (23: schwache Marken auslisten) |

### 4.9 Aufmaß-App – Rang 9

**Empfehlung: keine Spezial-App kaufen, sondern ein Frappe-Web-Formular auf dem Tablet plus Bluetooth-Lasermessgerät.**

| Option | Was | Bewertung |
|---|---|---|
| **Frappe-Doctype „Aufmaß“** (eigener Doctype mit Kind-Tabellen Raum → Wand → Öffnungen/Anschlüsse) | Raum, Wandlängen, Höhe, Fenster/Türen, Steckdosen, Wasser/Abfluss, Heizkörper, Bodenaufbau, Zufahrt/Lift/Treppenmaße (für Sofa-Anlieferung!), Fotos und Skizze (Foto der Handskizze reicht), Unterschrift Kunde optional | **Empfehlung.** Daten landen am Auftrag, Monteur sieht sie; Aufwand S–M |
| Lasermessgerät mit Bluetooth (z. B. Leica DISTO, Bosch GLM-Reihe) | Werte per Hersteller-App oder als Tastatureingabe ins Feld [Kompatibilität mit Browser-Feldern testen] | für Küchen sinnvoll, ≈ 200–500 € je Gerät [Schätzung, Marktpreise prüfen] |
| magicplan / LiDAR-Scan (iPad Pro, Apple RoomPlan) | Grundriss aus dem Scan, Export PDF/DXF | als Zusatz für Komplettplanungen und Ferienimmobilien; Cloud-Dienst → AVV, Fotos aus Privatwohnungen (7.4) |
| Küchenplanungssoftware | Feinaufmaß für Küchen kommt dort hinein | ERPNext-Aufmaß verlinkt nur auf die Planung |

**Pflicht-Checkliste Anlieferung** (spart teure Fehlfahrten): Türbreite, Treppenhaus-Wendel, Lift-Innenmaß, Stockwerk, Halteverbot nötig?, Abstellfläche. Bei großen Sofas (Minotti, Poliform) entscheidend.

### 4.10 Fotodokumentation (querschnittlich)

| Wann | Was | Wo gespeichert |
|---|---|---|
| Wareneingang | Verpackung, Etikett, Schäden | Anlage am Purchase Receipt |
| Aufmaß | Raum, Anschlüsse, Zugang | Anlage am Aufmaß |
| Vor Montage | Zustand Boden/Wände (Schutz vor späteren Vorwürfen) | Montage-Task |
| Nach Montage | Ergebnis, Mängel | Abnahmeprotokoll |
| Reklamation | Mangel, Etikett, Seriennummer | Warranty Claim |
| Referenz | schöne Fotos für Website/Social **nur mit gesonderter Einwilligung** | Ordner „Referenzen“ mit Einwilligungsnachweis |

**Technik:** Foto direkt aus dem Browser (Kamera-Upload), automatisch verkleinert (z. B. 2.000 px lange Seite), Dateiname `Auftrag_Ort_Datum_Nr`. Speicher: Frappe-Dateien als **privat** markieren (nicht öffentlich abrufbar), bei Wachstum S3-kompatibler Speicher in der EU. Dokumentationsfotos sind Vertragserfüllung bzw. berechtigtes Interesse (Art. 6 Abs 1 lit. b/f DSGVO), Referenzfotos brauchen Einwilligung (lit. a) – Abschnitt 7.4.

### 4.11 Digitale Unterschrift

| Einsatz | Signaturart | Werkzeug |
|---|---|---|
| Auftrag im Showroom | einfache elektronische Signatur auf dem Tablet (Unterschriftenfeld im Druckformat) oder Papier | Frappe-Signaturfeld (Standard-Feldtyp „Signature“) |
| Auftrag aus der Ferne (Angebot per Link) | einfache oder fortgeschrittene elektronische Signatur mit Protokoll (E-Mail-Bestätigung, Zeitstempel, IP, Hash des PDF) | **DocuSeal** selbst betrieben (AGPL-3.0, Webhooks, API) oder Documenso (AGPL-3.0); kommerziell z. B. Skribble (CH, auch QES) [belegt S9, Funktionsumfang prüfen] |
| Abnahmeprotokoll, Lieferschein | einfache elektronische Signatur | Frappe-Signaturfeld |
| Verträge mit Schriftformgebot (z. B. Verbraucherkredit/Finanzierung über Bank, Bürgschaft) | qualifizierte elektronische Signatur (QES, z. B. ID Austria) oder Papier | über die Bank/den Finanzierungspartner |

Ablauf Fern-Signatur: ERPNext-Angebot → Webhook an DocuSeal mit PDF **und angehängter Rücktrittsbelehrung + Muster-Formular**, wenn `kanal_vertragsschluss` = Fernabsatz/außerhalb Geschäftsraum (7.1) → Kunde unterschreibt → DocuSeal-Webhook setzt Angebot auf „angenommen“, legt das signierte PDF und das Prüfprotokoll an und erzeugt den Kundenauftrag (Entwurf).

---

## 5. Automatisierungen: wo was läuft

### 5.1 Regel

| Ort | Wofür | Beispiele |
|---|---|---|
| **Frappe intern** (Notification, Server Script, Assignment Rule, Auto Repeat, Scheduler, Workflow) | alles, was nur ERP-Daten betrifft | Status-Mails, Nachfassen, Sperre „ohne Anzahlung keine Bestellung“, Pflichtfotos, Fristen, Zuweisung, Mahnungen |
| **n8n selbst betrieben** | alles mit externen Diensten | Postfach lesen (ABs, Reklamationen), KI-Aufrufe, DocuSeal, Brevo (digital/11), Cal.com, Stripe-Ereignisse, Bank-Datei abholen, tägliches Backup-Prüfprotokoll |
| nicht | Make/Zapier parallel | zweiter Ort für Logik, Kosten je Ausführung, Daten bei Drittanbieter |

**n8n-Lizenz:** Sustainable Use License – Nutzung für eigene interne Geschäftszwecke erlaubt, auch Workflows, deren Ergebnisse Kunden sehen; nicht erlaubt ist, n8n als Dienst für Dritte anzubieten [belegt S2]. Betrieb als Docker-Container auf dem Backoffice-Server oder einem zweiten kleinen EU-Server, Zugriff nur über VPN/SSO.

### 5.2 Die 15 Automatisierungen mit dem besten Verhältnis

| # | Auslöser | Aktion | Ort | Welle |
|---|---|---|---|---|
| 1 | Angebot gesendet | Aufgaben +3/+14/+45 Tage (digital/11 F3) | Frappe | W1 |
| 2 | Angebot angenommen (Klick oder Signatur) | Kundenauftrag-Entwurf + Anzahlungsanforderung | Frappe/DocuSeal | W1/W4 |
| 3 | Anzahlung eingegangen | Freigabe „Bestellungen erzeugen“, Aufgabe an Einkauf | Frappe | W1 |
| 4 | Bestellung versendet, keine AB nach 7 Tagen | Erinnerung an Hersteller vorbereiten | Frappe | W2 |
| 5 | AB per Mail | KI-Extraktion, Abgleich, Ampel | n8n + Frappe | W2 |
| 6 | AB grün | Liefer-KW übernehmen, Status-Mail an Kunde | Frappe | W2 |
| 7 | Liefer-KW verschoben | Aufgabe Berater, Mail nach Freigabe | Frappe | W2 |
| 8 | Wareneingang mit Schaden | Frist-Aufgabe CMR 7 Tage, Mail an Spedition, Warranty Claim | Frappe | W2 |
| 9 | Auftrag komplett eingetroffen | Montageplanung anstoßen, Kunde Terminwahl | Frappe | W3 |
| 10 | Montage morgen | Erinnerung an Kunde und Monteur, Unterlagen an Monteur | Frappe | W3 |
| 11 | Abnahme mit Mangel | Garantiefall anlegen, Hersteller-Mail vorbereiten | Frappe | W3 |
| 12 | Rechnung fällig +7 Tage | Zahlungserinnerung (Freigabe ab Stufe 2) | Frappe | W1 |
| 13 | Monatserster | Export an Steuerberater, Dashboard-Mail an GF (Auftragseingang, Rohertrag, offene Anzahlungen, Lieferverzug) | Frappe/n8n | W1 |
| 14 | Garantiefall ohne Hersteller-Antwort 7 Tage | Wiedervorlage | Frappe | W3 |
| 15 | Übergabe +12 Monate | Pflege-Check-Aufgabe/Mail (Service, digital/11 F6) | Frappe/Brevo | W5 |

---

## 6. Kundenportal: Auftragsstatus und Lieferzeit

| Option | Was der Kunde sieht | Aufwand | Bewertung |
|---|---|---|---|
| ERPNext-Standard-Portal | Login, Liste von Aufträgen, Rechnungen, Lieferscheinen; Status nach Buchungen [belegt S11] | S | funktional, aber Frappe-Optik, Login nötig, keine Liefer-KW je Position |
| **Status-Seite auf platzhirsch.studio mit Magic-Link** (z. B. `/de/auftrag/[token]`) | Meilensteine (4.6), Liefer-KW je Position, Montagetermin wählen/bestätigen, Dokumente (AB des Kunden, Rechnung, Pflegeanleitung), „Problem melden“ mit Foto | M | **Empfehlung (W4).** Markenauftritt, kein Passwort, mobil |

Regeln für die Status-Seite (nur Konzept, keine Codeänderung in diesem Schritt):
- Token: zufällig (≥ 128 Bit), pro Auftrag, widerrufbar, Ablauf 90 Tage nach Abschluss; Seite `noindex`, keine Tracker, kein Consent nötig (keine Speicherung auf dem Gerät).
- Daten server-seitig aus Frappe per API-Key mit einer **Lese-Rolle nur für Portalfelder** (keine Einkaufspreise, keine internen Notizen).
- Angezeigte Lieferzeit immer mit Hinweis „laut Hersteller-Bestätigung, Änderungen möglich“ – keine verbindliche Zusage, die nicht vom Hersteller kommt.
- Nach Next.js-16-Konventionen bauen (dynamische Route, `proxy.js` statt `middleware`, Doku `node_modules/next/dist/docs/` lesen) – Umsetzung durch die Bau-Agenten nach Freigabe.

---

## 7. Recht und Datenschutz in den Prozessen

> **Entwurf – vor Verwendung durch eine Rechtsanwältin/einen Rechtsanwalt prüfen lassen.**

### 7.1 Wo der Vertrag geschlossen wird, entscheidet über das Rücktrittsrecht

| Situation | Einordnung | Folge für den Prozess |
|---|---|---|
| Kunde unterschreibt im Showroom Lochau | Geschäftsraum | kein gesetzliches Rücktrittsrecht nach FAGG |
| Berater nimmt beim Aufmaß-Termin in der Wohnung des Kunden den Auftrag auf | **außerhalb von Geschäftsräumen** geschlossener Vertrag (§ 3 Z 1 FAGG) | Informationspflichten, 14 Tage Rücktrittsrecht, Belehrung + Muster-Widerrufsformular; ohne Belehrung verlängert sich die Frist um bis zu 12 Monate (§ 12 FAGG) [anwaltlich prüfen] |
| Angebot per E-Mail/Signatur-Link, Kunde unterschreibt zu Hause | Fernabsatzvertrag | wie oben |
| Ware nach Kundenspezifikation angefertigt / eindeutig auf persönliche Bedürfnisse zugeschnitten | Ausnahme § 18 Abs 1 Z 3 FAGG | **eng auszulegen:** Auswahl aus Standardoptionen (Stoff, Farbe, Module) reicht nach WKO-Hinweisen und Rechtsprechung (LG Feldkirch 2015) eher **nicht**; Maßküche, Sondermaß eher ja [belegt S12, anwaltlich prüfen je Produktgruppe] |
| Kunde in DE | § 312g BGB, Ausnahme § 312g Abs 2 Nr 1 BGB; EuGH: Ausschluss gilt bei Maßanfertigung auch vor Produktionsbeginn [belegt S12] | gleiche Prozesslogik |

**Umsetzung:** Pflichtfeld `kanal_vertragsschluss` am Angebot/Auftrag. Bei „außerhalb/Fernabsatz“ hängt das System automatisch Belehrung und Formular an, setzt eine Frist „Rücktrittsfrist endet am …“ und sperrt die Herstellerbestellung bis Fristende, **außer** der Kunde verlangt ausdrücklich vorzeitigen Beginn bzw. die Ware fällt unter die Ausnahme (Entscheidung dokumentiert) [anwaltlich prüfen, wie der vorzeitige Beginn bei Waren rechtssicher geregelt wird]. Ohne diese Sperre trägt Platzhirsch das Risiko eines Rücktritts nach erfolgter Herstellerbestellung.

### 7.2 Elektronische Signatur

- Kaufverträge über Möbel sind formfrei (§ 883 ABGB). Eine einfache oder fortgeschrittene elektronische Signatur ist wirksam; ihre Beweiskraft hängt am Protokoll (eIDAS-VO (EU) Nr. 910/2014, Art. 25 Abs 1: einer elektronischen Signatur darf die Rechtswirkung nicht allein wegen ihrer elektronischen Form abgesprochen werden) [anwaltlich prüfen].
- Wo Gesetz oder Vertrag Schriftform verlangt, ersetzt nur die **qualifizierte** elektronische Signatur die Unterschrift (§ 4 Abs 1 SVG) – betrifft eher Finanzierung/Bürgschaft als den Kaufvertrag.
- AGB müssen vor Vertragsschluss zugänglich sein und im Signatur-Dokument enthalten sein bzw. verlinkt und als PDF beigefügt (recht/…, digital/14).

### 7.3 Auftragsverarbeitung und Verzeichnis

| Dienst | Rolle | Was zu tun ist |
|---|---|---|
| Server/Hosting Backoffice (oder Frappe Cloud) | Auftragsverarbeiter | AVV (Art. 28 DSGVO), EU-Standort |
| DocuSeal/Documenso selbst betrieben | eigenes System | TOMs dokumentieren |
| KI-Anbieter (9.3) | Auftragsverarbeiter | AVV, keine Nutzung zum Training, Speicherdauer, Drittland (Art. 44 ff. DSGVO) |
| n8n selbst betrieben | eigenes System | Zugang absichern, Logs mit personenbezogenen Daten begrenzen (Ausführungsdaten nach 14 Tagen löschen) |
| Montagepartner (Sigg, CH-Schreinereien) | eigene Verantwortliche oder Auftragsverarbeiter [anwaltlich prüfen] | Vereinbarung, Gastzugang nur auf eigene Aufträge |
| Hersteller | Empfänger (Lieferadresse bei Direktlieferung) | nur nötige Daten, Kommissionskürzel |
| CH-Kunden | revDSG gilt zusätzlich | Datenschutzerklärung nennt Länder der Übermittlung (digital/14 R4) |

Das **Verzeichnis der Verarbeitungstätigkeiten** (Art. 30 DSGVO) bekommt die Einträge Auftragsabwicklung, Montage/Fotodokumentation, Reklamation, Kundenportal, KI-Assistenz. Die Datenschutzerklärung auf der Website (src/components/Datenschutz) muss Kundenportal und Signatur-Dienst nennen, sobald sie live sind (Hinweis an das Rechts-Team aus digital/14, keine Änderung in diesem Schritt).

### 7.4 Fotos in Kundenwohnungen

- Dokumentationsfotos: nur, was für Aufmaß/Montage/Mangel nötig ist; keine Personen, keine Familienfotos, Wertgegenstände im Bild vermeiden. Zugriff nur für Auftragsbeteiligte. Löschung nach Ende der Gewährleistung + Reserve, z. B. 3 Jahre nach Übergabe [Frist anwaltlich prüfen].
- Referenzfotos (Website, Social, Award): **gesonderte, freiwillige Einwilligung** mit Wahl „anonym/ohne Ort“; Widerruf jederzeit.
- KI-Raumplaner mit Kundenfotos: eigener Rahmen in digital/06 und digital/14 F14; die Fotos aus der Auftragsabwicklung werden **nicht** automatisch für KI-Visualisierung oder Training verwendet.

### 7.5 KI im Backoffice

- **AI Act Art. 4 (seit 02.02.2025):** Betreiber von KI-Systemen müssen Maßnahmen für ausreichende KI-Kompetenz ihres Personals treffen, ohne festen Lehrplan; gilt auch für kleine Unternehmen [belegt S13]. Eine Quelle meldet, dass die Digital-Omnibus-VO (EU) 2026/1744 Art. 4 abgeschwächt hat [nicht aus Primärquelle bestätigt, prüfen]. Die Schulung in Abschnitt 11 deckt das in jedem Fall ab und wird dokumentiert.
- Interne Entwürfe (E-Mail, Angebotstext) sind keine Fälle des Art. 50 AI Act (Kennzeichnung gilt für KI-Interaktion mit Personen und veröffentlichte KI-Inhalte); ein Mensch prüft und versendet. Den Chatbot auf der Website regelt digital/14 F9.
- Keine Kundendaten in private Chat-Konten (ChatGPT/Claude privat) – nur über den freigegebenen Firmenzugang.

---

## 8. Textbausteine

> **Entwurf – vor Verwendung durch eine Rechtsanwältin/einen Rechtsanwalt prüfen lassen.**

**8.1 Hinweis im Aufmaß-Formular (vor dem ersten Foto)**
> „Für Planung, Lieferung und Montage fotografieren wir die betroffenen Räume, Anschlüsse und Zugänge. Die Fotos verwenden wir nur für Ihren Auftrag, sie sind nur für das Projektteam und die beauftragten Montagepartner sichtbar und werden [3 Jahre nach Übergabe – anwaltlich prüfen] gelöscht. Weitere Informationen: platzhirsch.studio/datenschutz.“

**8.2 Einwilligung Referenzfoto (gesondert, nicht vorangekreuzt)**
> „☐ Ich bin einverstanden, dass Platzhirsch Home Living Fotos meiner eingerichteten Räume als Referenz auf der Website und in sozialen Medien zeigt – ☐ mit Ortsangabe ☐ ohne Ortsangabe. Personen und persönliche Gegenstände werden nicht gezeigt. Ich kann die Einwilligung jederzeit per E-Mail an [Adresse – vom Unternehmen auszufüllen] widerrufen.“

**8.3 Hinweis im Signatur-Link (Fernabsatz)**
> „Sie schließen diesen Vertrag außerhalb unserer Geschäftsräume bzw. im Fernabsatz. Bitte lesen Sie die beigefügte Belehrung über Ihr Rücktrittsrecht [anwaltlich prüfen: Ausnahme bei Maßanfertigung je Position kennzeichnen]. Wir bestellen bei den Herstellern erst nach Ablauf der Rücktrittsfrist am [Datum], es sei denn, Sie wünschen ausdrücklich einen früheren Beginn.“

**8.4 Status-Mail „Hersteller hat bestätigt“** (kein Rechtstext, Vorlage)
> „Guten Tag [Name], gute Nachricht: [Hersteller] hat Ihre Bestellung bestätigt. Voraussichtliche Anlieferung in Lochau: KW [xx]. Sobald alles da ist, melden wir uns für den Montagetermin. Den aktuellen Stand sehen Sie jederzeit hier: [Link]. Herzliche Grüße, [Berater]“

---

## 9. KI-Assistenz im Backoffice

### 9.1 Anwendungsfälle nach Nutzen

| # | Anwendung | Eingabe | Ausgabe | Mensch | Ersparnis |
|---|---|---|---|---|---|
| 1 | **AB-Extraktion** | PDF des Herstellers | JSON nach festem Schema | prüft nur Abweichungen | Rang 4 |
| 2 | **E-Mail-Entwürfe** | Mail des Kunden/Herstellers + Datensatz (Auftrag, Status) | Antwortentwurf im Ton von Platzhirsch | liest, ändert, sendet | Rang 3 |
| 3 | **Übersetzung** DE↔IT/EN/FR | Bestellung, Reklamation, Kundenmail | Übersetzung mit Fachglossar (Stoff, Bezug, Gestell, Nussbaum canaletto …) | Stichprobe | Rang 3 |
| 4 | **Angebotstexte** | Positionen + Katalogdaten (Material, Maße, Designer) | Einleitung, Positionsbeschreibungen, Pflegehinweis | liest | Rang 2 |
| 5 | Zusammenfassung | lange Mailverläufe, Gesprächsnotiz (Diktat) | 5-Punkte-Notiz am Deal | – | indirekt |
| 6 | Reklamationsmail an Hersteller | Fotos + Beschreibung | strukturierte Meldung in Landessprache | prüft | Rang 8 |

### 9.2 Leitplanken (in jedem Prompt fest)

1. **Nur Fakten aus dem Datensatz.** Keine Preise, Lieferzeiten, Materialangaben erfinden; fehlt etwas → Platzhalter `[fehlt]`.
2. **Verbotene Aussagen:** „offizieller Händler/Vertragshändler“ für Minotti, Poliform und alle Marken ohne belegten Status (00, 23); „Made in Italy“ für die Binni-Linie (26). Ausgabe läuft durch eine Wortliste, Treffer blockieren den Entwurf.
3. Keine Rechtsauskünfte an Kunden (Gewährleistung, Rücktritt) – Vorlage mit freigegebenem Text verwenden.
4. Ton: Sie-Form, ruhig, präzise, keine Superlative.
5. Fachglossar DE/IT/EN/FR als Datei im System (wird mit der Zeit vom Team ergänzt).

### 9.3 Anbieter und Datenschutz

| Option | Für | Hinweis |
|---|---|---|
| Großes Sprachmodell per API (z. B. Anthropic Claude, OpenAI, Mistral) über Firmenkonto | E-Mails, Angebotstexte, AB-Extraktion (PDF-Verständnis) | AVV, keine Trainingsnutzung, EU-Datenverarbeitung soweit angeboten, Speicherdauer prüfen; Mistral mit Sitz in Frankreich als EU-Option [Konditionen prüfen] |
| Lokales Modell auf der eigenen NVIDIA-GPU (digital/06) | Übersetzung, einfache Extraktion, alles mit sensiblen Kundendaten | kein Datenabfluss; Qualität bei PDF-Tabellen vorher testen |
| Integration | n8n-Knoten bzw. Frappe-Server-Script, Knopf im Formular („Entwurf erstellen“) | Protokoll: welche Ausgabe wurde von wem übernommen |

**Kosten [Schätzung]:** bei ≈ 3.000–6.000 KI-Aufrufen/Jahr (ABs, Mails, Texte) mit je wenigen tausend Token im unteren dreistelligen Euro-Bereich pro Jahr; aktuelle API-Preise vor Entscheidung prüfen.

---

## 10. Betrieb, Sicherheit, Kosten

### 10.1 Sicherheit (vor Go-live)

| Punkt | Maßnahme |
|---|---|
| Developer-Mode/Tracebacks | in Produktion abschalten (digital/11 Befund) |
| Rollen | Verkauf (Angebote, Aufträge), Einkauf (Bestellungen, AB), Montage (nur Tasks), Partner (Gast, nur eigene Aufträge), GF (alles, Einkaufspreise, Rohertrag), Steuerberater (Lesezugriff Rechnungen) |
| Zwei-Faktor-Anmeldung | für alle internen Konten (Frappe-Standard) |
| Backups | täglich verschlüsselt außer Haus (EU), **monatlicher Wiederherstellungstest** auf Staging; 7 Jahre Aufbewahrung der Belege sicherstellen |
| API-Keys | je Integration eigener Benutzer mit minimalen Rechten (Website-Formulare, Portal, n8n) |
| Updates | monatliches Minor-Update auf Staging, dann Produktion; Major-Update (v15→v16) als eigenes Projekt |

### 10.2 Kosten [Schätzung]

| Posten | einmalig | laufend/Monat | Herleitung |
|---|---|---|---|
| Implementierungspartner ERPNext (Ist-Aufnahme, Installation, Stammdaten-Mapping, Druckformate, Workflows, Export, Schulung) | 20–45 T€ | – | 25–45 Personentage × 800–1.000 €/Tag (übliche Tagessätze von ERPNext-Partnern im DACH-Raum, Angebote einholen) |
| n8n, DocuSeal, Status-Seite, KI-Integration | 5–10 T€ | – | 6–12 Personentage, teils durch die Bau-Agenten vorbereitbar |
| Server/Frappe Cloud, Speicher, Backup | – | 50–200 € | Frappe Cloud ab ≈ 25 $ Private Bench [belegt S3]; realistisch größerer Plan wegen ERPNext |
| KI-API | – | 20–80 € | 9.3 |
| Signatur (selbst betrieben) | – | 0–30 € | Server-Anteil; kommerzielle Anbieter teurer |
| Lasermessgerät/Tablet | 0,5–2 T€ | – | 1–2 Geräte |
| Support-Vertrag Partner (optional) | – | 300–600 € | 3–6 h/Monat |
| **Summe** | **≈ 25–55 T€** | **≈ 150–600 €** (ohne Support 70–300 €) | |

Das Masterkonzept sieht für „Website, CRM, Shop, Kalender …“ im ersten Jahr 15–25 T€ vor (23, Tabelle Investitionen). **ERPNext ist darin nicht enthalten** – das Budget muss erweitert oder in Phasen verteilt werden (W1+W2 zuerst ≈ 15–30 T€).

**Amortisation [Schätzung]:** 36–50 T€ Arbeitszeitwert/Jahr (2.2) gegen 25–55 T€ einmalig → 7–18 Monate, ohne die vermiedenen Fehlbestellungen.

### 10.3 Förderung

- **KMU.DIGITAL** (BMWET/WKÖ): Beratungs- und Umsetzungsförderung; eine 2026-Quelle nennt bis 3.000 € Beratung + bis 6.000 € Umsetzung (30 % bei Projekten 2.000–30.000 €), Umsetzung nur nach Beratung durch Certified Digital Consultant [Beträge prüfen]. Laut WKO Steiermark (FAQ 23.09.2026) wird KMU.DIGITAL **ab 2027 nicht fortgeführt** [belegt S14]. → Inhaber muss **sofort** klären, ob 2026 noch Mittel und Antragsfristen offen sind.
- **go.digital** der WK Vorarlberg (für Vorarlberger Mitglieder) und Landesprogramm „Projekte im Rahmen der Digitalisierung“ [Konditionen prüfen, S14].
- aws-Programme (23, 21): Digitalisierung als Teil des Wachstumsvorhabens der neuen Handels-GmbH, **vor** Projektbeginn beantragen.
- Wichtig für die Ausgliederung: Verträge, Lizenzen und Förderanträge gleich auf die **neue Handels-GmbH** ausstellen (23, 21), sonst doppelte Arbeit.

---

## 11. Schulung und Einführung

| Wann | Wer | Inhalt | Dauer |
|---|---|---|---|
| W0 | GF + 1 „ERP-Pate“ (die Person mit dem meisten Abwicklungswissen) | Ist-Prozess aufzeichnen, Zielprozess abnehmen, Rollen | 1 Tag |
| W1 | alle | Grundlagen: Suche, Kunde, Angebot, Auftrag, Bestellung, Anzahlung; Übung mit 3 echten Aufträgen auf Staging | 2 × 3 h |
| W1 | alle | **KI-Kompetenz (AI Act Art. 4):** was KI kann und nicht kann, Leitplanken 9.2, Datenschutz, Prüfen vor Senden, Beispiele für Fehler | 1,5 h, dokumentiert (Teilnehmerliste, Unterlagen) |
| W2 | Einkauf/Backoffice | AB-Abgleich, Ampel, Wareneingang mit Fotos, CMR-Fristen | 2 h |
| W3 | Verkauf, Montage, Partner | Montageplanung, Aufmaß, Abnahme, Reklamation; Partner mit Gastzugang | 2 h + 30 min je Partner |
| W4 | Verkauf | Fern-Signatur, Rücktrittslogik (7.1), Kundenportal | 1 h |
| laufend | alle | Kurzvideos (2–3 min) je Vorgang im internen Wiki; „Frag den Paten“; monatlich 30 min „Was nervt?“ mit Verbesserungsliste | |

**Einführungsregeln:**
1. **Stichtag statt Parallelbetrieb:** Ab Tag X entstehen alle neuen Angebote und Aufträge nur noch in ERPNext. Laufende Aufträge werden nur mit Status und offenen Bestellungen übernommen (keine Historie nachtippen).
2. **Pilot mit echten Fällen:** 2 Wochen mit 5–10 laufenden Aufträgen auf der Produktivsite, dann Stichtag.
3. **Eine Person entscheidet über Felder und Abläufe** (ERP-Pate + GF), sonst wächst das System in 5 Richtungen.
4. **Messen:** vor Start 2 Wochen grob Zeit je Vorgang notieren (Strichliste), nach 3 Monaten wiederholen. Damit werden die Schätzungen in Abschnitt 2 durch echte Zahlen ersetzt.

**KPIs (monatlich, automatisch):** Angebote erstellt / Ø Erstellungszeit, Anteil Angebote mit Komplettierung, Zeit Auftrag → alle Bestellungen raus, Anteil ABs ohne Abweichung, Ø Lieferverzug je Hersteller, Kundenrückfragen „Wo ist meine Ware?“ (Strichliste/Telefon-Notiz), offene Anzahlungen, Reklamationsquote und -dauer, Rohertrag je Auftrag.

---

## 12. Was nicht empfohlen wird

| Idee | Warum nicht |
|---|---|
| Zweites System (Odoo, Branchen-ERP für Möbelhandel, HubSpot) neben Frappe | Backoffice und Website-Katalog laufen bereits auf Frappe; ein Wechsel wäre ein Systembruch mit Datenmigration der 1.765 Produkte und neuen Schnittstellen. Branchenlösungen für Küchen-/Möbelhandel lohnen sich nur, wenn Küchen > 50 % des Umsatzes werden – dann neu bewerten [prüfen] |
| Vollbuchhaltung in ERPNext ab Tag 1 | österreichische Lokalisierung (Kontenrahmen, UVA, Anlagen) ist Mehrarbeit ohne Zeitersparnis; Steuerberater arbeitet mit eigener Software |
| ERPNext-Kasse im Showroom | nicht RKSV-zertifiziert (4.7) |
| Vollautomatische Bestellung beim Hersteller | ein Fehler kostet mehr als die eingesparte Minute |
| Make/Zapier zusätzlich zu n8n | zweiter Ort für Logik |
| Eigene native App für Monteure | Browser/PWA reicht, keine App-Store-Pflege |
| Kundenportal mit Passwort-Login | Hürde für Kunden mit 1–2 Käufen im Leben; Magic-Link genügt |
| KI-Antworten ohne menschliche Freigabe an Kunden | Haftung, Händler-Aussagen, Tonalität |

---

## 13. Entscheidungen und Lieferungen des Inhabers

| # | Entscheidung / Lieferung | Bis | Warum |
|---|---|---|---|
| 1 | **Administrator-Zugang zum Backoffice** und Auskunft, wer den Server betreibt (`bench version`, Hosting) | KW 45 | ohne Zugang kein Schritt möglich (auch digital/11 F2 blockiert) |
| 2 | **Freigabe ERPNext auf der bestehenden Site** (Variante A) inkl. Staging-Kopie, oder Umzug Frappe Cloud (C) | KW 45 | Architektur |
| 3 | **Budget W1+W2** ≈ 15–30 T€ und Auswahl eines ERPNext-Implementierungspartners (2–3 Angebote) | KW 46 | Umsetzung |
| 4 | **KMU.DIGITAL/go.digital** bei der WK Vorarlberg sofort anfragen (Programm endet 2026) | KW 44–45 | Förderung |
| 5 | Ist-Aufnahme (1.2): Mengengerüst 2025, Angebots-/Rechnungsprogramm, Nummernkreise, Steuerberater-Software, Kasse, Küchenplanungssoftware, Herstellerportale | KW 46 | ersetzt Schätzungen |
| 6 | **ERP-Pate** benennen (≈ 20 % Arbeitszeit für 3 Monate) | KW 46 | Einführung |
| 7 | Anzahlungsregel (Prozent, Ausnahmen) und Regel „ohne Anzahlung keine Bestellung“ | W1 | Liquidität |
| 8 | Abstimmung mit Steuerberater: Anzahlungsrechnung, Export, CH-Ausfuhrnachweis, Stripe/Barumsatz | W1 | Steuer |
| 9 | Anwaltliche Prüfung: Rücktrittslogik je Produktgruppe (7.1), Textbausteine (8), Löschfristen Fotos, Partner-Verträge | vor W4 | Recht |
| 10 | Auftragsadresse für ABs und Service (z. B. `bestellungen@`, `service@`) und KI-Anbieter (Cloud mit AVV oder lokal) | W2 | Automatik |
| 11 | Rechtsträger: alles auf die **neue Handels-GmbH** (Verträge, Lizenzen, Nummernkreise ab Ausgliederung) | vor Stichtag | Ausgliederung |

---

## Anhang A – Eigene Felder (Auszug)

| Doctype | Feld | Typ | Zweck |
|---|---|---|---|
| Quotation | `kanal_vertragsschluss` | Select (Showroom / außerhalb Geschäftsraum / Fernabsatz) | Rücktrittslogik |
| Quotation | `komplettierung_angeboten`, `finanzierung_angeboten` | Check | 23/8.6 |
| Quotation/Sales Order | `quelle`, `land_kunde`, `kundentyp` | Link/Select | aus CRM, KPI |
| Sales Order | `ruecktrittsfrist_bis`, `vorzeitiger_beginn_verlangt` | Date/Check | 7.1 |
| Sales Order Item | `bezug_stoffcode`, `masse`, `oberflaeche` | Data | Bestellung, AB-Abgleich |
| Purchase Order | `hersteller_bestellnr`, `ab_status` (offen/grün/gelb/rot), `liefer_kw_bestaetigt` | Data/Select | 4.4 |
| Purchase Order | `import_drittland`, `incoterm`, `ursprungsnachweis` | Check/Data/Attach | Binni (26) |
| Lieferantenbestätigung (neu) | Positionen, Abweichungen, PDF | Child Table/Attach | 4.4 |
| Purchase Receipt | `fotos_pflicht`, `schaden`, `vorbehalt_bis` | Attach/Check/Date | CMR |
| Warranty Claim | `lieferant`, `hersteller_reklamationsnr`, `art`, `gewaehrleistung_bis` | Link/Data/Select/Date | 4.8 |
| Aufmaß (neu) | Räume, Wände, Öffnungen, Anschlüsse, Zugang, Fotos | Child Tables | 4.9 |
| Sales Order | `portal_token`, `portal_aktiv_bis` | Data/Date | 6 |

## Anhang B – Checkliste Go-live W1

- [ ] Staging-Test bestanden (Installation, Update, Website-Formulare funktionieren weiter)
- [ ] Backup + Wiederherstellung getestet
- [ ] Tracebacks aus, Zwei-Faktor an, Rollen vergeben
- [ ] Nummernkreise Angebot/Auftrag/Rechnung fortgeführt
- [ ] Steuervorlagen AT/EU/CH vom Steuerberater abgenommen
- [ ] Druckformate DE/EN (IT/FR folgen), Pflichtangaben § 11 UStG geprüft
- [ ] Export an Steuerberater einmal probeweise eingespielt
- [ ] Team geschult (inkl. KI-Kompetenz, dokumentiert)
- [ ] Stichtag kommuniziert

---

## Quellen

- S1 – Frappe: ERPNext/Frappe v16 Release 12.01.2026 und Upgrade-Hinweise: [frappe.io/releases/version-16](https://frappe.io/releases/version-16), [frappe.io/times/january-2026](https://frappe.io/times/january-2026), [discuss.frappe.io – v16 Release Dates](https://discuss.frappe.io/t/erpnext-hrms-frappe-framework-v16-release-dates/156349)
- S2 – n8n Sustainable Use License und FAQ: [docs.n8n.io/sustainable-use-license](https://docs.n8n.io/privacy-and-security/sustainable-use-license), [docs.n8n.io – License FAQ](https://docs.n8n.io/n8n-community-license/community-license/license-faq)
- S3 – Frappe Cloud Preise: [docs.frappe.io/customer-guide – Pricing](https://docs.frappe.io/customer-guide/pricing/frappe-cloud-pricing), [frappecloud.com/pricing](https://frappecloud.com/pricing)
- S4 – § 131b BAO (Registrierkassenpflicht): [RIS – BAO](https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10003940), [WKO – Grundlagen Registrierkassenpflicht](https://www.wko.at/oe/information-consulting/unternehmensberatung-buchhaltung-informationstechnologie/it-dienstleistung/technisch-rechtliche-grundlagen-zur-registrierkassenpflicht.pdf)
- S5 – VfGH 09.03.2016, G 606/2015 u. a. (Karten = Barumsätze): [gesetzefinden.at – VfGH](https://gesetzefinden.at/judikatur/vfgh/jfr_20160309_15g00606_01)
- S6 – ViDA/E-Rechnung: [KPMG Österreich 03/2026](https://kpmg.com/at/de/insights/2026/03/vida-herausforderungen-und-chancen-in-der-umsatzsteuer.html), [EY Österreich – E-Rechnungspflicht](https://www.ey.com/de_at/insights/tax/e-rechnungspflicht)
- S7 – WKO: E-Rechnung Umsatzsteuer, Detailinfos 31.3.2026: [wko.at PDF](https://www.wko.at/oe/news/e-rechnung-umsatzsteuer-detailinfos-31-3-2026.pdf)
- S8 – ALYF eu_einvoice (ZUGFeRD/XRechnung für ERPNext): [github.com/alyf-de/eu_einvoice](https://github.com/alyf-de/eu_einvoice)
- S9 – DocuSeal/Documenso (AGPL, Self-Hosting): [openalternative.co – Vergleich](https://openalternative.co/compare/documenso/vs/docuseal), [docs.documenso.com](https://docs.documenso.com/)
- S10 – CMR (Übereinkommen über den Beförderungsvertrag im internationalen Straßengüterverkehr), Art. 30: [RIS – CMR](https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10011934) [Fundstelle prüfen]
- S11 – ERPNext Kundenportal: [docs.frappe.io – Customer Orders, Invoices and Shipping Status](https://docs.frappe.io/erpnext/user/manual/en/customer-orders-invoices-and-shipping-status), [docs.frappe.io – Customer Portal](https://docs.frappe.io/erpnext/customer-portal.md)
- S12 – § 18 FAGG und Auslegung: [gesetzefinden.at – § 18 FAGG](https://gesetzefinden.at/bundesrecht/bundesgesetze/fagg/para-18), [WKO – E-Commerce-FAQ Rücktrittsrecht](https://www.wko.at/noe/e-commerce/e-commerce-recht-faq4-ruecktrittsrecht), [LG Feldkirch 14.07.2015, 2 R 195/15i](https://gesetzefinden.at/judikatur/lg-feldkirch/jjt_20150714_lg00929_00200r00195_15i0000_000), [IT-Recht-Kanzlei – EuGH zur Maßanfertigung](https://www.it-recht-kanzlei.de/Kommentar/18197/Frau.php); Gesetzestext FAGG: [RIS – FAGG](https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20008847)
- S13 – AI Act Art. 4 KI-Kompetenz: [AI Act Service Desk der EU-Kommission](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-4), [RTR KI-Servicestelle – AI Literacy](https://rtr.at/rtr/service/ki-servicestelle/ai-act/ai_literacy.en.html)
- S14 – Förderungen: [WKO Steiermark – FAQ KMU.DIGITAL 2027](https://www.wko.at/stmk/bank-versicherung/faqs-zu-kmu.digital2027), [selbststaendig-machen.at – KMU.DIGITAL 2026](https://www.selbststaendig-machen.at/kmu-digital-2026-foerderung/), [WK Vorarlberg – go.digital](https://www.wko.at/vlbg/foerderung/go.digital-digitalfoerderung-wkv.pdf)
- Weitere Normen ohne gesonderten Abruf (Fundstellen im RIS bzw. EUR-Lex prüfen): § 11, § 19 UStG 1994; § 132 BAO; § 212 UGB; § 883, § 933b ABGB; § 11 VGG; § 4 SVG; § 3, § 12 FAGG; § 312g, § 477 BGB; VO (EU) Nr. 910/2014 (eIDAS) Art. 25; DSGVO Art. 6, 28, 30, 44 ff.; VO (EU) 2024/1689 (AI Act) Art. 4, 50; RL (EU) 2025/516.
- Interne Grundlagen: Marktresearch 00, 18, 21, 23, 26; digital/07, digital/11, digital/14; wachstum/10.
