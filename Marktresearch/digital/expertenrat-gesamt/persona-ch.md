# Expertenrat gesamt – Nutzertest Persona „Architektin aus St. Gallen“

**Kürzel:** persona-ch · **Stand:** 28.10.2026 · **Branch:** feature/neuauftritt (Arbeitsstand, ungecommittet) · **Rolle:** Gutachterin, kein Code geändert, kein Formular abgesendet.

**Persona:** Dipl. Architektin ETH, eigenes Büro in St. Gallen, plant den Umbau einer Attikawohnung für Bauherrschaft. Sie braucht für ihren Plansatz **ein Minotti-Ecksofa** (Maße, Elementliste, Technical Sheet, 2D/3D-Daten), eine **Küchenplanung** (Partner, Ablauf, Planunterlagen austauschen), **CH-Lieferung inkl. Zoll/MWST** (wer ist Importeur, Rechnung netto?) und **eine namentliche Ansprechperson** für Rückfragen. Sie ist kein Endkunde: sie will Unterlagen in Minuten, nicht einen Beratungstermin als ersten Schritt.

**Methode:** Geführter Klickpfad mit Playwright (1 Browser, Desktop 1440 px, locale de-CH), Skript im Scratchpad, Screenshots unter `qa-screenshots/expertenrat-gesamt/persona-ch/` (Schrittprotokoll mit Zeitstempeln: `steps.json`), dazu `tools/qa/shoot.mjs` für iPhone/Android/iPad (`…/persona-ch/shoot/`). Ergänzend Code-Lektüre (Produktseite, Downloads, Schweiz-Hub, St.-Gallen-Landingpage, Küchen, Team, Upload) und direkte Abfrage der Such-API. Wettbewerbs-Check per Websuche.

**Vorbehalt Umgebung:** Der Dev-Server war während des Tests stark ausgelastet (parallel laufende Bauteams, Kompilieren): Seitenladezeiten 21–135 s, Startseite 90 s, eine Produktseite (Powell) mit Backoffice-Timeout → HTTP 500. Die gemessenen Ladezeiten sind **nicht** produktionsrepräsentativ; die „Zeit bis zum Ziel“ unten ist deshalb als **Klicks + geschätzte Netto-Zeit bei normaler Ladezeit** angegeben. Das Fehlerbild „Backoffice-Timeout = 500“ ist aber auch für Produktion relevant (siehe Befund 3).

---

## Note: 5,5 / 10 (für diese Persona)

Gestaltung, Ton und Endkunden-Strecke sind hochwertig, und der versteckte Schweiz-Hub ist inhaltlich das Beste, was ich bei einem Händler im Dreiländereck gesehen habe. **Für eine Architektin scheitert die Seite aber an genau den drei Dingen, für die sie kommt:** (1) die Suche findet kein einziges Produkt, (2) die Minotti-Produktseite liefert weder Maße noch Datenblatt – obwohl das Repo für 90 Minotti-Modelle Elementmaße und 79 Links auf das Technical Sheet des Herstellers enthält (Sofaplaner-Daten), (3) CH-Lieferung/Zoll steht auf der Produktseite nur als „auf Anfrage“, der gute Schweiz-Hub ist noch Entwurf/noindex und von nirgends verlinkt. Es gibt keinen Fach-/Architekten-Einstieg, keine Zuständigkeiten im Team und keinen CAD-Austausch (Upload nur PDF/Bild). Mit den Top-5-Maßnahmen ist 8+ realistisch.

---

## Protokoll: Klickpfad mit Zeit und Unsicherheiten

| Schritt | Seite / Aktion | Ergebnis | Unsicherheit der Persona | Beleg |
|---|---|---|---|---|
| 1 | Startseite `/de` | Hero „Italienisches Wohnen am Bodensee“, Termin/Showroom, Tel. +43. Edel, klar. | „Ist das für Endkunden oder auch für Planer? Kein Hinweis auf Fachkunden/Objekt.“ | `01-start.png` |
| 2 | Suche „Minotti Sofa“ | **„Keine Ergebnisse gefunden“** | „Die führen doch Minotti? Habe ich mich vertippt?“ | `16-suche-minotti-sofa.png` |
| 3 | Suche „Twiggy“ (bekanntes Modell) | Dauer-Ladeanzeige „…“, nach 12 s kein Treffer; API liefert `products: []` | „Suche ist kaputt – ich navigiere selbst.“ | `17-suche-twiggy.png`, API `/api/shop-search?q=twiggy` |
| 4 | Suche „Minotti“ | Marke + Kategorien (Sessel 96, Sofas 62 …), aber **0 Produkte** | — | API-Antwort, `18-suche-minotti.png` |
| 5 | Marken → Minotti `/de/ueber-uns/marken/minotti` | „487 Stücke, 18 Kategorien“, „Termin wählen / Stücke ansehen“ | Kein Hinweis auf Datenblätter, Händlerstatus wird korrekt **nicht** behauptet. | `04-marke-minotti.png` |
| 6 | Sofas gefiltert `/de/produkte/sofas-couches?marke=minotti` | Liste geladen | URL-Slugs wirken unsauber: `produkt-raphael-variant`, `armchairs-yves-round` und `chairs-torii-bold-chairs` unter **Sofas**, `sofas-white-saddle-hide` (ein Leder, kein Sofa). | `05-sofas-minotti.png`, HTML der Kategorie |
| 7 | Produkt Twiggy | Schöne Seite, Preis „auf Anfrage“, **keine Maße**, Downloads: „Für dieses Stück haben wir keine Unterlagen online“ + „Planungsdaten anfragen“. Beschreibt eine **Dormeuse**, Slug/Kategorie sagt „Sofa“. | „Ohne B×T×H kann ich nicht einmal einen Platzhalter in den Plan setzen. Minotti.com hat das Technical Sheet – warum verlinkt ihr es nicht?“ | `06-twiggy.png`, `06c-twiggy-full.png` |
| 8 | Produkt Powell (Ecksofa-Kandidat) | **HTTP 500** „Diese Seite lässt gerade auf sich warten“ (Backoffice-Timeout) – gute Fehlerseite mit Telefon | „Vertrauen sinkt.“ | `07-powell.png`, `07c-powell-full.png` |
| 9 | Lieferung (Produktseite) | „Deutschland, Schweiz und Liechtenstein auf Anfrage“ | „Wer verzollt? Netto-Rechnung? Wer montiert in CH?“ – keine Verlinkung zu CH-Infos | `06-twiggy.png` |
| 10 | Google-ähnlicher Einstieg `/de/designermoebel-st-gallen` | Gute de-CH-Schreibweise, MWST 8,1 %, BAZG-Verweis, FAQ. **Marken-Block zeigt Poliform und Tréca – nicht Minotti**. Kein Link zum Schweiz-Hub. | „Die Schweiz ist willkommen, aber Details nur persönlich.“ | `08-st-gallen.png`, `08b-st-gallen-full.png`, `shoot/…st-gallen--iphone.png` |
| 11 | Schweiz-Hub `/de/einkaufen-aus-der-schweiz` (nur per Direkt-URL) | **Exzellent:** Weg A/B, Ablauf Ausfuhr/Einfuhr, CHF-Rechner mit EZB-Kurs, Abschnitt „Küchen und Einbauten: andere Regeln“ (Werklieferung → CH-MWST-Registrierung des Anbieters). Banner „Entwurf, Freigabe offen“, `noindex`, nicht in Navigation. | „Genau das hätte ich gebraucht – aber ich hätte es nie gefunden.“ | `09-schweiz-hub.png`, `09b-schweiz-hub-full.png`, `einkaufen-aus-der-schweiz/page.js:2-3,35` |
| 12 | Küche `/de/kuechen-vorarlberg` | Poliform + next125, Ablauf-FAQ, „CH auf Anfrage“. Desktop-Hero rechts leer (großer Weißraum neben CTA). Kein Link zum Küchenplaner, kein Hinweis „Planunterlagen von Architekten“. | „Arbeiten die mit Architekten? Welche Unterlagen bekomme ich (Ansichten, Installationsplan)?“ | `10-kuechen.png`, `10b-kuechen-full.png` |
| 13 | Küchenplaner `/de/labs/kuechenplaner` (nur Direkt-URL) | Starkes Werkzeug (Grundriss, Maßketten, Module). Eyebrow „LABS ·“, nicht von der Küchen-Seite verlinkt. | „Kann ich meinen DWG-Grundriss importieren / die Planung exportieren?“ – Nein. | `11-kuechenplaner.png` |
| 14 | Team `/de/ueber-uns/team` | 5 Personen, 3 nur mit Initialen-Platzhalter, nur 2 mit Rolle („Geschäftsführung“); keine Zuständigkeit (Küche, Objekt/Planer, Schweiz). Mail-Link pro Person vorhanden. | „Wen rufe ich für die Küche an, wen für das Sofa?“ | `12b-team-full.png` |
| 15 | Kontakt `/de/kontakt` | Klar, Formular mit Feld „Unternehmen (optional)“ – gut. Nur `info@`, nur österreichische Nummer. | Keine Angabe zu Antwortzeit. | `13b-kontakt-full.png` |
| 16 | Beratung `/de/beratung?produkt=Minotti Twiggy` | Endkunden-Flow („Neubau/Renovierung“, „Einfamilienhaus/Wohnung“); kein Typ „Architekt/Planer – Unterlagen“. „Architekt oder Planer“ existiert nur als Antwort auf „Wie aufmerksam geworden?“. | „Ich bin nicht die Bauherrin.“ | `14-beratung.png`, `messages/de.json:1639` |
| 17 | Sofaplaner `/de/labs/sofaplaner` | 90 Minotti-Modelle mit Elementmaßen – **die Daten, die auf der Produktseite fehlen**. Nur per Direkt-URL/Menü „Planen & Erleben“, nicht von der Produktseite verlinkt. | — | `15-sofaplaner.png`, `src/lib/sofaplaner/minotti/*.json` |

**Zeit bis zum Ziel (geschätzt bei normaler Ladezeit, gemessen in Klicks):**

| Ziel | Erreicht? | Klicks / Netto-Zeit | Kommentar |
|---|---|---|---|
| Minotti-Sofa finden | ja, über Umweg | Suche 3× erfolglos, dann 4 Klicks Navigation, ca. 3–4 min | Suche ist der Bruch |
| Maße des Sofas | **nein** | — | Twiggy ohne Maße, Powell 500 |
| Datenblatt / CAD | **nein** | — | nur „Planungsdaten anfragen“ (Formular, Antwort unbekannt) |
| CH-Lieferung/Zoll verstehen | teilweise | St.-Gallen-Seite 1 min; vollständig nur via unauffindbarem Hub | Hub ist Entwurf |
| Küchenplanung: Ablauf & Partner | ja | 1 Klick „Küche“, 2 min | Planer nicht verlinkt |
| Namentliche Ansprechperson | teilweise | Team-Seite, 1 min | keine Zuständigkeiten |

Ergebnis: **2 von 6 Zielen vollständig**. Eine Architektin würde nach ca. 8–10 Minuten zu minotti.com (Download-Bereich) und zum Minotti Concept Store bei Zingg-Lamprecht in Zürich wechseln, der in der Schweiz seit rund 20 Jahren Minotti-Partner ist (laut Websuche, interiordaily.com) – und Platzhirsch höchstens anrufen, wenn Lochau näher liegt als Zürich.

---

## Top-5-Stärken

1. **Schweiz-Kompetenz im Text, korrekt und quellenbelegt.** St.-Gallen-Seite in de-CH-Schreibweise (`ss`), MWST 8,1 %, BAZG; der Schweiz-Hub erklärt Weg A/B, Ausfuhrbestätigung, Werklieferung bei Küchen und rechnet CHF mit EZB-Kurs (`src/lib/ch/content.js`, `ChfRechner`). Das hat kein Wettbewerber der Region.
2. **Produktseite mit Fachkunden-Haltung:** „Für Architektinnen, Planer und Ihre eigene Planung: Wir fragen Zeichnungen und Planungsdaten … an“ + vorbefüllte Anfrage „Planungsdaten (Zeichnungen, CAD)“; Download-Logik für 2D/3D/Katalog-PDFs aus dem Backoffice ist gebaut (`src/lib/shop/downloads.js`). Ehrliches „keine Unterlagen online“ statt toter Links.
3. **Daten-Schatz Minotti im Repo:** 90 Modelle mit Elementcodes, B/T/H/Sitzhöhe je Element, Quellenangaben und 79 Links auf das Minotti Technical Sheet (`src/lib/sofaplaner/minotti/*.json`). Mit wenig Aufwand der stärkste Fachkunden-Inhalt der Region.
4. **Seriöse Fehler- und Vertrauenskultur:** gute 500-Seite mit Telefon, „Preis auf Anfrage – abhängig von Ausführung und Bezug“, keine unbelegten Händleraussagen zu Minotti (Inhaber-Entscheidung eingehalten), Kontaktformular mit „Unternehmen“.
5. **Küchenplaner als echtes Planungswerkzeug** (Maßketten, Raumformen, Prüfen), mobil saubere Darstellung (iPhone-Screens ohne Überlauf).

---

## Befunde

Prio: **P0** Blocker vor Livegang · **P1** vor/kurz nach Livegang · **P2** Welle 1/2 · **P3** Feinschliff. Aufwand S ≤ ½ Tag, M ≤ 2 Tage, L > 2 Tage.

| # | Prio | Seite/Datei | Befund | Beleg | Konkrete Maßnahme | Aufwand | Wirkung |
|---|---|---|---|---|---|---|---|
| 1 | **P0** | Navbar-Suche, `src/app/api/shop-search/route.js` → `searchProdukte()` (`src/lib/api/fetchAllProdukte.js:72`) | **Produktsuche liefert nie Produkte.** „Minotti Sofa“ → „Keine Ergebnisse“, „Twiggy“ (existiert: `/de/produkte/sofas-couches/sofas-twiggy-sofas`) → `products: []`, „Minotti“ → nur Marke/Kategorien. `searchProdukte` hat `fallback: []` – ein Fehler/Timeout des Backoffice-Endpunkts `search_produkte` ist unsichtbar. Mehrwort-Suchen (Marke + Typ) werden gar nicht zerlegt. | Screens `16`/`17`, curl `/api/shop-search?q=twiggy` | (a) Endpunkt prüfen/loggen (Fehler ≠ leer), (b) lokaler Fallback-Index aus `fetchProduktePaths` (Name, Marke, Kategorie) mit Token-Suche „minotti sofa“ = Marke ∧ Kategorie, (c) bei 0 Treffern Vorschläge („Minotti Sofas & Couches (62)“, „Sofaplaner“) statt „Keine Ergebnisse“. | M | hoch: Suche ist der Haupteinstieg von Fachkunden mit Modellnamen; jede Null-Antwort = Absprung |
| 2 | **P0** | Produktseite `produkte/[category]/[product]/page.js` + `ShopCatalog` | **Minotti-Produkte ohne Maße und ohne Datenblatt**, obwohl die Daten im Repo liegen (90 Modelle, 79 Technical-Sheet-Links in `src/lib/sofaplaner/minotti/*.json`). Twiggy: kein Maß, „keine Unterlagen online“. | `06c-twiggy-full.png`; Node-Auswertung der JSONs | Mapping Produkt → Sofaplaner-Modell (Slug/Name). Auf der Produktseite: Block „Elemente und Maße“ (Tabelle aus `elemente[]`: Code, B×T×H, Sitzhöhe, Quelle) + Link „Technisches Datenblatt beim Hersteller (minotti.com, PDF)“ + „Im Sofaplaner kombinieren“. Rechtlich: nur verlinken, nicht hosten (wie Downloads über /cmx). | M | sehr hoch für Planer-Leads; zusätzlich Ranking für „Minotti Twiggy Maße“-Longtail |
| 3 | **P0** | Produktseite, `fetchProduktNewByPathField` (timeout 7 s/Budget 15 s) | **Backoffice-Timeout → HTTP 500 auf Produktseite** (Powell). Unter Last (Dev, aber auch Crawler-Spitzen in Prod) fallen echte Produkte aus; Google sieht 5xx. | `07-powell.png`, HTML: `BackofficeError … get_produkt_by_path_field_api: timeout` | ISR mit `stale-while-revalidate`: letzte gute Fassung ausliefern, wenn das Backoffice nicht antwortet; Lasttest mit 20 parallelen Produktaufrufen vor Livegang; Alarm bei 5xx-Quote > 0,5 %. *(Evtl. nur Dev-Last – im Staging verifizieren.)* | M | hoch: Crawl-Budget, Vertrauen, verlorene Sessions |
| 4 | **P1** | `/de/einkaufen-aus-der-schweiz` (noindex, nicht verlinkt), St.-Gallen-/Appenzell-/Rheintal-Seiten, Produktseite „Lieferung“ | Der beste CH-Inhalt ist unsichtbar: Entwurf, `noindex`, nicht in Navigation, nicht verlinkt von St. Gallen oder der Lieferzeile der Produktseite. | `page.js:2-3,35`; `08b-st-gallen-full.png` | Freigabe Steuerberater/Zollspediteur priorisieren (Inhaber); danach: Link „Einkaufen aus der Schweiz: Zoll, MWST, CHF-Rechner“ in St.-Gallen-Steps, in der Lieferzeile aller Produkte (de) und im Footer „Regionen“. | S (nach Freigabe) | hoch: CH ist der kaufkräftigste Markt im Dreiländereck; „Möbel aus Österreich in die Schweiz“ als Ranking-Hub |
| 5 | **P1** | Gesamtauftritt, Beratung (`BeratungClient`), Navigation | **Kein Fachkunden-/Architekten-Einstieg.** Architekt existiert nur als Antwort auf „Wie aufmerksam geworden?“. Beratungsformular fragt Bauherren-Fragen. Keine Aussagen zu Objekt-/Planerkonditionen, Musterversand, Plan-Lieferumfang. | `messages/de.json:1639`, `14-beratung.png` | Seite „Für Architekten & Planer“ (de/en): was es gibt (Datenblätter/CAD auf Anfrage binnen X Werktagen, Stoff-/Ledermuster, Showroom-Termin mit Bauherrschaft, Küchen-Werkplanung, CH-Abwicklung), feste Ansprechperson; im Beratungsformular Anlass „Ich plane für eine Bauherrschaft“ (überspringt Wohnform). Konditionen nur nach Inhaber-Entscheid nennen. | M | hoch: ein Architekt = mehrere Projekte/Jahr; Ostschweizer Büros sind ein direkter Hebel Richtung 1 Mio./Monat |
| 6 | **P1** | `/de/ueber-uns/team` | 3 von 5 Personen nur Initialen, nur 2 Rollen („Geschäftsführung“); keine Zuständigkeiten (Küche, Planer/Objekt, Schweiz). | `12b-team-full.png` | Rollen + Schwerpunkt je Person (z. B. „Küchenplanung“, „Projekte Schweiz“), echte Fotos (Inhaber liefert), direkte Durchwahl wenn gewünscht; auf Küchen-, St.-Gallen- und Produktseite „Ihre Ansprechperson“ **mit Namen** statt anonym. | S (+ Fotos Inhaber) | mittel-hoch: Vertrauen, kürzere Wege für Fachkunden |
| 7 | **P1** | St.-Gallen-Landingpage `designermoebel-st-gallen/page.js` | Marken-Block zeigt Poliform und Tréca – **Minotti** (im FAQ genannt, meistgesuchte Marke) fehlt als Kachel; Hero-Bild am Desktop im Full-Page-Shot leer (Lazy-Load, mobil ok). | `08b-st-gallen-full.png`, `shoot/…st-gallen--iphone.png` | Minotti + Küche (Poliform/next125) als Kacheln; Abschnitt „Für Architekturbüros in der Ostschweiz“. Hero auf `priority`/eager prüfen. | S | mittel: Relevanz für „Minotti St. Gallen“, „Designermöbel Ostschweiz“ |
| 8 | **P1** | Küche `kuechen-vorarlberg/page.js` | Kein Link zum Küchenplaner; keine Aussage zu Planunterlagen (Grundriss, Ansichten, Installationsplan) und zur Zusammenarbeit mit Architekten; CH-Küchen (Werklieferung, MWST-Registrierung) nur „auf Anfrage“. Desktop-Hero: rechte Hälfte leer neben CTA. | `10-kuechen.png`; `src/lib/ch/content.js:98-100` | Abschnitt „Mit Ihrem Architekten“: was wir liefern (Werkplan, Geräteliste, Elektro-/Wasseranschlussplan), welche Formate; Link „Küche selbst skizzieren“ (Planer); CH-Hinweis Werklieferung mit Link zum Hub. **Inhaber klären:** Ist Platzhirsch in CH MWST-registriert? Sonst ist eine montierte Küche in CH faktisch nicht anbietbar. | S (Text) / Entscheid | hoch: Küchen sind das größte Ticket; CH-Küchen ohne Klärung = Risiko |
| 9 | **P2** | Upload `UploadClient.js:848`, Küchenplaner | Plan-Upload nimmt nur PDF/Bild; kein DWG/DXF/IFC; Küchenplaner ohne Import/Export. | Code | DWG/DXF als Datei annehmen (ohne Vorschau, Virenscan, max. Größe), Hinweis „CAD-Dateien willkommen“; Küchenplaner-Export als PDF mit Maßen. | M | mittel: senkt Reibung für Planer deutlich |
| 10 | **P2** | Kategorie/Slugs (Backoffice-Daten) | Unsaubere Zuordnung/Slugs: `armchairs-yves-round` und `chairs-torii-bold-chairs` unter Sofas, `sofas-white-saddle-hide` (Leder), `produkt-…-variant`; Twiggy-Seite beschreibt eine Dormeuse. Deutsche URLs mit englischen Kategorien (`/produkte/armchairs-stools`). | Kategorie-HTML, `06c` | Datenpflege-Liste fürs Backoffice (Kategorie, Name, Slug); 301 bei Slug-Korrektur. Deutsche Kategorie-Slugs als P3 prüfen. | M | mittel: Ranking/Vertrauen bei Kennern |
| 11 | **P2** | Lieferzeile Produktseite (`shop.atelier.deliveryValue`) | „Schweiz … auf Anfrage“ ohne Orientierung (wer ist Importeur, Rechnung ohne AT-USt möglich?). | `06-twiggy.png` | Ergänzen: „Für die Schweiz: Rechnung ohne österreichische USt, Einfuhr per Spedition oder Abholung – so funktioniert’s →“ (nach Hub-Freigabe). | S | mittel |
| 12 | **P2** | Kontakt | Nur `info@` und AT-Nummer; keine Antwortzeit-Zusage. | `13b-kontakt-full.png` | „Antwort innerhalb eines Werktags“ (wenn haltbar); optional Schweizer Rufnummer/WhatsApp Business. | S | niedrig-mittel |
| 13 | **P3** | Suche | „kueche“ findet nichts, „küche“ schon (Umschrift). | API | ae/oe/ue/ss-Normalisierung in der Suche. | S | niedrig |
| 14 | **P3** | Küchenplaner/Sofaplaner | Eyebrow „LABS ·“ und `/labs/`-URL, obwohl Inhaber-Entscheid 9 „keine separate Labs-Welt“ verlangt. *(Laut Workflow in Arbeit.)* | `11-kuechenplaner.png` | Sprechende URLs + Verlinkung von Küche/Produktseite (siehe 2, 8). | S | mittel (Auffindbarkeit) |

---

## Quick-Wins (je ≤ ½ Tag)

1. **Produktseite → Sofaplaner-Daten:** Link „Technisches Datenblatt (minotti.com)“ aus `quellen[]` und „Elemente & Maße im Sofaplaner“ für die 90 gemappten Modelle (Befund 2, Minimalversion ohne Tabelle).
2. **Suche: 0-Treffer-Fallback** mit Marke+Kategorie-Vorschlägen und Fehler-Logging statt stillem `[]` (Befund 1a/c).
3. **Team-Rollen/Zuständigkeiten** ergänzen (Befund 6).
4. **St. Gallen: Minotti- und Küchen-Kachel** + Absatz für Architekturbüros (Befund 7).
5. **Küche → Küchenplaner verlinken** + Absatz „Mit Ihrem Architekten“ (Befund 8).
6. **Beratung: Anlass „Ich plane für eine Bauherrschaft“** als Option, Wohnform überspringen (Befund 5, Minimalversion).

---

## Offene Inhaber-Fragen (nicht eigenmächtig umsetzen)

- Ist Platzhirsch in der Schweiz MWST-registriert bzw. mit Fiskalvertreter? (entscheidet, ob montierte Küchen/Einbauten in CH angeboten werden können)
- Gibt es Architekten-/Objektkonditionen, Musterversand, Leihstellungen? Was darf öffentlich stehen?
- Freigabe Schweiz-Hub durch Steuerberater/Zollspediteur – Termin?

## Belegbilder

`C:/Users/admin.local/Documents/Platzhirsch-Studio-Website/qa-screenshots/expertenrat-gesamt/persona-ch/` – `01-start` bis `19-suche-datenblatt`, Full-Page-Shots `*b-*-full.png`, `steps.json` (Zeitstempel je Schritt), Geräte-Shots in `shoot/`.
