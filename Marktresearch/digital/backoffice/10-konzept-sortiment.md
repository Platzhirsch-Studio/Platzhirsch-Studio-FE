# 10 – Konzept Bereich „Sortiment“ (Funktion und Oberfläche) · finale Fassung

**Zweck:** Bauvorlage für den Bereich Sortiment im eigenen Next.js-Backoffice (`backoffice/`, Port 3100): Marken mit Händlerstatus, Produkte mit Ausführungen, Bildern und Preisen mit Stand, Lieferanten, Herstellerbestellung mit AB-Abgleich, Wareneingang, Preislisten-Import, Freigaben von Bildern, Preisen und Lieferzeiten. Jede Seite mit Wireframe, Inhalten, Aktionen, Filtern, Tastenkürzeln, Leer-/Fehler-/Ladezustand. Jede UI-Funktion ist auf die Frappe-App `ph_sortiment` abgebildet, Lücken sind markiert, und ein Bauauftrag (§20) beschreibt die Umsetzung.
**Stand:** 2026-11-04 · Rolle: Produktdesigner (Überarbeitung) · Status: **finale Fassung nach UX-Kritik (`20-kritik-ux-sortiment.md`) und Fachkritik (`21-kritik-fach-sortiment.md`)**. Alle Pflichtänderungen beider Kritiken sind eingearbeitet, Widersprüche sind in §0.2 zugunsten von Einfachheit und Rechtskonformität entschieden. Inhaber-Entscheidungen stehen offen in §19.
**Grundlage (gelesen):** `01-benchmark-prinzipien.md`, `02-ux-leitlinien.md`, `03-design-system.md`, `04-motion.md`, `05-informationsarchitektur.md`, `PLAN-NEXT-BACKOFFICE.md`, `10-konzept-personal.md` (Muster verzögerter Commit, Bauauftrag), `20-kritik-ux-sortiment.md`, `21-kritik-fach-sortiment.md`; `Backend-Import/ph_sortiment` (README, 34 DocType-JSONs, Controller `ph_produkt.py`, `ph_marke.py`, `ph_lieferant.py`, `ph_herstellerbestellung.py`, `ph_wareneingang.py`, `ph_preisliste_import.py`, `logik/abgleich.py`, `logik/preise.py`, `logik/kalkulation.py`, `logik/bestellung.py`, `logik/preislisten_format.py`, `api/__init__.py`, `tasks.py`, `ereignisse.py`, `importer/katalog.py`, Fixtures). Methodenliste und Rechte am 2026-11-04 erneut gegen die JSONs geprüft (§16.4). `backoffice/src/lib/backoffice/actions.js`, `frappe/client.js`, `bereiche.js`; `referenz/VORBILD-SHD-sauter-held-2026-11-03.md`.
**Regeln:** Frappe unsichtbar, ein Bedienmuster (02 §0), Token und Komponenten aus 03, Bewegung aus 04 (`--bo-dur-*`, `--bo-ease-*`), Seitentypen T1–T9 aus 05 §2. Beträge in Cent, Datum de-AT, keine Superlative, keine erfundenen Zahlen. **Alle Zahlen in Wireframes sind Platzhalter für die Layoutprüfung, keine Ist-Werte.** Nichts hier ändert `backoffice/` oder `Backend-Import/`. Server-Aktionen des Fundaments: `speichernDokumentAction`, `setzeWertAction`, `workflowAktionAction`, `dokumentMethodeAction`, `massenaktionAction`, `exportCsvAction`, `kommentarAction`, `loescheDokumentAction`. Bereichseigene Aktionen liegen in `lib/backoffice/sortiment/actions.js` (§20.3). Rechtsangaben sind fachliche Hinweise, keine Rechtsberatung; vor Livegang Steuerberater/Anwalt.

---

## 0. Leitsätze und Entscheidungen

### 0.1 Leitsätze

1. **Kein Preis ohne Stand, kein Bild ohne Beleg, kein Händlersatz ohne Beleg, kein Rabatt ohne 30-Tage-Bezugspreis.** Die App erzwingt das (heute teilweise, Lücken §16.3). Die Oberfläche zeigt es **vorher** an: Checkliste, Sperrgrund im Klartext, Freigabe-Schreibtisch. Niemand soll erst beim Speichern scheitern.
2. **„Zu tun“ statt Listen.** Der Bereichsstart zeigt, was zu erledigen ist, als eine Liste mit sichtbarem Knopf je Zeile, gleich bedient wie „Zu tun“ in Faktura und Kundenkarte.
3. **Die Produktakte ist der Lebenslauf eines Artikels:** Bilder, Preis, Lieferzeit, Ausführungen, Texte, Status für Website und Shop, Verwendung in Anfragen, Aufträgen, Bestellungen, Kassa, Service.
4. **Einkauf ist eine Kette** mit genau einer Primäraktion je Zustand: Bestellung → (Anzahlung Kunde geprüft) → Senden → AB einlesen → Abweichungen klären → AB bestätigt → Wareneingang → Rechnung geprüft → Abschluss.
5. **Außenwirkung braucht eine bewusste Handlung.** Veröffentlichen, Bild/Preis/Lieferzeit freigeben, Mail an Hersteller, Preisliste übernehmen: nie per Einzeltaste, nie per stillem Ziehen. Öffentliche Änderungen gehen erst nach Ablauf des Undo-Fensters an den Server (verzögerter Commit, §7). Die Website sieht deshalb nie etwas, das gleich wieder zurückgenommen wird.
6. **Leitung entscheidet über Geld und Außenwirkung.** Mitarbeiter bereiten vor. Gesperrte Knöpfe nennen den Grund und bieten „Leitung bitten“ an (legt eine PH Aufgabe an).
7. **Aufbewahren statt löschen.** Gesendete Bestellungen, übernommene Preislisten und Produkte mit Preisgeschichte werden storniert oder ausgelaufen gesetzt, nie gelöscht (BAO § 132, Beweisführung PrAG/UWG).
8. **Die Website liest nur, sie bestimmt nichts.** Jede Änderung zeigt, ob und wann Website und Shop sie sehen. Gezeigt wird ein Produkt nur bei: Veröffentlicht + nicht ausgeblendet + freigegebenes Bild + gültiger, freigegebener Preis.

### 0.2 Entscheidungen dieser Überarbeitung (Widersprüche aufgelöst)

| # | Widerspruch / offene Stelle | Entscheidung | Grund |
|---|---|---|---|
| E1 | UX P2: Undo kommt nach der Website-Aktualisierung; Lösung über App-Debounce (UX A1) | **Verzögerter Commit (8 s)** für alle Änderungen mit Außenwirkung (Bild-/Preis-/Lieferzeitfreigabe, Veröffentlichen, Pausieren, Ausblenden, Im Shop). Baustein Fundament F2 `useVerzoegerterCommit` + `/api/undo-commit` (wie `10-konzept-personal.md` E1). Die App-Änderung A1 bleibt Wunsch, ist aber keine Voraussetzung mehr | geht ohne Backend-Änderung, die Website sieht vor Ablauf nichts |
| E2 | Glossar UX: Produkt `Geprueft` = „Wartet auf Freigabe“; gleichzeitig kritisiert UX, dass „Freigabe“ fünf Bedeutungen hat | Produkt-Workflow heißt **„Zur Veröffentlichung geben“ / „Wartet auf Veröffentlichung“ / „Veröffentlicht“**. „Freigabe“ bedeutet in der Oberfläche nur noch: Recht oder Bestätigung für Bild, Preis, Lieferzeit (Freigabe-Schreibtisch) | ein Wort, eine Bedeutung; erfüllt das Abnahmekriterium von UX P3 strenger |
| E3 | UX P10 Bewertung „OK · Rückfrage · Ablehnen“ (`1/2/3`) ↔ Fach: `abweichung_klaeren` mit akzeptieren/reklamieren/Kunde rückfragen (`o/r/k/x`) | Segment **OK 1 · Rückfrage 2 · Ablehnen 3**. „Rückfrage“ öffnet ein Menü mit drei Zielen: „beim Hersteller (E-Mail)“ → `abweichung_klaeren(lieferant_reklamieren)` mit Mail-Vorschau, „beim Verkauf/Kunden“ → `abweichung_klaeren(kunde_rueckfragen)`, „nur vermerken“ → `abweichung_bewerten(pruefen)`. „OK“ bei Preis → `abweichung_klaeren(akzeptieren)` (nur Leitung), sonst `abweichung_bewerten(ok)` | drei Tasten statt vier, keine Mail per Einzeltaste |
| E4 | UX P7 Produktakte 5 Tabs (Preis als Abschnitt) ↔ Fach: Tab „Preise“ mit Verkauf, Einkauf, Preismatrix | 5 Tabs: **Produkt · Preise · Ausführungen · Texte & SEO · Verlauf**. „Verwendung“ wird zum Block „Verknüpfungen“ rechts im Tab Produkt (Zähler, Klick öffnet die gefilterte Liste im Zielbereich). Systemdaten unter „Mehr › Systemdaten“ (Leitung) | beide Anforderungen erfüllt, ≤ 5 Tabs |
| E5 | K7 / Fach P3: Wer gibt Preise frei? | Bis zur Inhaber-Entscheidung (§19 O1) gilt die rechtssichere Regel: **Nur die Leitung gibt Preise frei.** Von Mitarbeitern erfasste Preise stehen auf „Freigabe offen“ und erscheinen im Freigabe-Schreibtisch. Ausnahme zur Entscheidung vorgelegt: „Preis bestätigen“ (gleicher Betrag, neuer Stand, Quelle-URL) darf ein Mitarbeiter selbst freigeben | Fach P3, Leitsatz 6 |
| E6 | Fach P1 Anzahlung ↔ UX: wenige Hürden | Senden prüft die Kundenanzahlung nur, wenn die Bestellung aus einem Auftrag kommt (`bezug_doctype = PH Auftragsbestaetigung`). Lagerbestellungen haben keine Hürde | Einfachheit; Risiko liegt nur bei Kundenaufträgen |
| E7 | Fach P13 Löschschutz ↔ Fundament `loescheDokumentAction` | „Löschen“ erscheint nur bei Entwürfen ohne Versand, ohne Übernahme und ohne Preisgeschichte. Sonst „Stornieren“ / „Auslaufen lassen“ / „Verwerfen“ | BAO § 132 |
| E8 | Konzept 10 alt §4.2: Übergänge „Lieferung buchen“ für Leitung mit Grund ↔ Fach §7.7 nie ohne Mengen | Die Übergänge „Teillieferung buchen“ / „Lieferung buchen“ bietet die UI **nie** direkt an. Status folgt aus dem Wareneingang. Einzige Ausnahme: Strecke über „Lieferung beim Kunden bestätigen“ (§5.9) | Datentreue (Mengen) |
| E9 | UX K12 Tabs ↔ andere Bereichskonzepte mit Pills | Unternavigation als **Tabs** nach 02 §2.1 / 03 §8.10 | Leitlinie gilt vor Bereichsgewohnheit (W19) |
| E10 | Schnellanlage (UX P5) ↔ Fach-Pflichtfelder (`kundenspezifisch`, USt-Satz) | Schnellanlage hat 3 Pflichtfelder. USt-Satz und „nach Kundenwunsch gefertigt“ erbt das Produkt von der Kategorie und zeigt sie in der Checkliste. „Veröffentlichen“ sperrt, solange der USt-Satz fehlt | wenig Tipparbeit, Recht über die Checkliste |
| E11 | Kürzel `g o` / Bereichsakkord | Kein Akkord, bis das Fundament die vollständige `G`-Liste vergibt (W20). Bis dahin Palette „> sortiment“ | Kollision `G O` Faktura |
| E12 | Fach P8 USt-Sätze inkl. 19 % Kleinwalsertal | Am Artikel nur **20 / 13 / 10 / 0 %**. 19 % (Mittelberg, Jungholz) hängt vom Lieferort ab und gehört in Faktura/Kassa | Sondersatz ist lieferortabhängig |

---

## 1. Nutzer, Top-Aufgaben, Rechte

### 1.1 Top-Aufgaben mit Klickzahl

Zählweise 02 §1: Klicks/Enter ab Zentrale, ohne Suche, ohne Tippen in Felder; Bestätigen und Speichern zählen mit. Zweiter Weg immer ⌘K („produkt bora“, „HB-2026-00042“, „> neue bestellung“).

| Rolle | Aufgabe | Soll | Weg |
|---|---|---|---|
| Sortiment Mitarbeiter | Preis bestätigen (gleich geblieben) | 3 | Zentrale „Zu tun: Preis läuft ab“ → „Preis bestätigen“ (Sheet, vorbelegt) → Speichern |
| Sortiment Mitarbeiter | Neuen Preis erfassen | 3 | wie oben mit „Preis erfassen“ |
| Sortiment Mitarbeiter | Neues Produkt anlegen | 3 + 3 Felder | Sortiment → „+ Produkt“ → „Anlegen und öffnen“ |
| Sortiment Mitarbeiter | Bilder ablegen | 4 + Ablegen | Sortiment → Produkte → Zeile → Bilder in den Abschnitt „Bilder“ ziehen (Quelle einmal für alle) |
| Sortiment Mitarbeiter | Produkt zur Veröffentlichung geben | 4 (Liste `Shift+Enter`: 3) | Sortiment → Produkte → Zeile → „Zur Veröffentlichung geben“ |
| Sortiment Mitarbeiter | Ausführungen anlegen | 5 | Akte → Tab Ausführungen → „Ausführungen anlegen“ → Weiter → Anlegen |
| Einkauf | Bestellung senden | 4 | Zu tun „Bestellentwurf“ → Zeile → „Senden …“ → „Senden“ im Dialog |
| Einkauf | AB erfassen und abgleichen | 5 | Zentrale „AB einlesen“ → Zeilenknopf → Weiter → „Abgleich erzeugen“ → „AB bestätigen“ (ohne Abweichung) |
| Einkauf | Abweichung klären | 2 + 1 je Zeile | Zentrale „Abweichungen klären“ → Zeile → `1`/`2`/`3` |
| Einkauf | Wareneingang buchen (Büro) | 4 | Zentrale „Wareneingang erwartet“ → „Eingang buchen“ → „Alles in Ordnung“ → „Buchen“ |
| Lager | Lieferung am Packtisch | 2 + Scan | Scan → „Alles in Ordnung“ → „Buchen“ (F6) |
| Leitung | Bilder einer Marke freigeben | 3 | Zentrale „Bilder Bora (12)“ → „Alle 12 freigeben“ → Undo-Toast läuft ab (Markenbeleg vorhanden; ohne Beleg +1 Upload) |
| Leitung | Produkte veröffentlichen | 4 | Zentrale „Wartet auf Veröffentlichung (6)“ → Alle → Veröffentlichen → Dialog bestätigen |
| Leitung | Preisliste übernehmen | 4 | Zu tun „Preisliste abgeglichen“ → Lauf → „Übernehmen …“ → Dialog bestätigen |
| Leitung | Preise freigeben | 3 | Zentrale „Preise warten auf Freigabe (n)“ → markieren (`x`/Alle) → `1` |
| Verkauf | Preis/Lieferzeit im Gespräch | 1 | ⌘K Produktname → Enter (Kopf: Preis mit Stand, Lieferzeit mit Bezugspunkt) |
| GF | Lage Sortiment | 0 | Zentrale-Kacheln (§11.4) |
| Marketing | Freigegebenes Bild für Social | 3 | Freigaben → Filter „Umfang Social“ → Bild → „Herunterladen“ (nur wenn der Umfang Social enthält, §3.9) |

### 1.2 Rechte (Stand der JSONs 2026-11-04, ersetzt den alten Rechte-Hinweis, L1 und B10)

| DocType | Lesen | Schreiben | permlevel 1 (EK, Notizen) | Befund / Pflicht |
|---|---|---|---|---|
| PH Produkt | Sortiment *, GF, Website Integration, Projekte *, Faktura *, Kassa *, Marketing Mitarbeiter, Logistik Mitarbeiter, Service Mitarbeiter | Sortiment Mitarbeiter `rwc`, Leitung `rwcd` | Leitung `rw`, GF `r` (`einkaufspreis_cent`, `einkaufspreise`, `sb_einkauf`, `notizen`) | **PH Shop Mitarbeiter fehlt** (Lücke AS11) |
| PH Produkt Ausfuehrung | Sortiment *, GF, Website, Projekte *, Faktura *, Kassa Mitarbeiter, Shop Mitarbeiter | Sortiment | `ek_aufpreis_cent` Leitung | **Logistik, Marketing, Service fehlen** (AS11) |
| PH Wareneingang | Sortiment *, GF, Logistik * `rwc`, Projekte * `r`, Service Mitarbeiter `r` | Sortiment, Logistik | – | Logistik-Recht vorhanden (alter Befund B10 entfällt) |
| PH Herstellerbestellung | Sortiment *, GF, Projekte * `rwc`, Logistik * `r` | Sortiment, **Projekte `rwc`** | `summe_ek_cent`, `notizen_intern`, Position `ek_cent`, `ab_ek_cent`: Leitung `rw`, GF `r` | **Faktura fehlt** (Rechnungsprüfung kann die Bestellung nicht öffnen); Projekte dürfen anlegen und ändern → Pflicht AS11: Projekte nur `r` + „Bestellung anfragen“ |
| PH Lieferant | Sortiment *, GF, Projekte * `r`, Logistik * `r`, Service Mitarbeiter `r` | Sortiment | `konditionen`, `notizen` Leitung | – |
| PH Preisliste Import | Sortiment *, GF | Sortiment | – | – |
| PH Produkt Preis (Kind) | über PH Produkt | über PH Produkt | – | `freigegeben` ohne permlevel → Mitarbeiter können freigeben (AS3) |
| PH Produkt Bild (Kind) | über PH Produkt | über PH Produkt | – | `freigabe` ohne permlevel → jede Schreibrolle setzt „erteilt“ (AS4) |
| alle oben | – | Leitung `d` (löschen) ohne Statusprüfung | – | AS13 Löschschutz |

UI-Regel bis zur App-Änderung: Die Oberfläche bietet Aktionen nur den Rollen an, die sie laut §5 haben sollen. Für Projekte erscheint in der Bestellakte kein „Bearbeiten“, sondern „Änderung anfragen“ (PH Aufgabe an Sortiment). Faktura erhält bis AS11 nur den Bezug-Chip mit Bestellnummer, Status und Summen aus der Eingangsrechnung, keinen Link in die Akte.

**EK für Sortiment Mitarbeiter (offen, §19 O2):** Position `ek_cent`/`ab_ek_cent` sind permlevel 1. Mitarbeiter können AB-Preise deshalb nicht erfassen; der Preisabgleich greift dann nur, wenn die Leitung erfasst. Bis zur Entscheidung zeigt A10 die EK-Spalte nur der Leitung, und Mitarbeiter sehen in der Spalte den Hinweis „EK erfasst die Leitung“.

---

## 2. Sprache: Glossar und Anzeige-Texte (verbindlich)

Eine Datei `lib/backoffice/sortiment/texte.js` bildet jeden Rohwert auf den Anzeigetext ab. Die Oberfläche zeigt nie einen Rohwert ohne Umlaut, nie Technikwörter. Werte im Code und in Frappe bleiben unverändert. Ausnahme: „Mehr › Systemdaten“ (nur Leitung) zeigt Rohwerte in Klammern.

| Objekt | Wert (Frappe) | Anzeige | Ton (03 §1.5) |
|---|---|---|---|
| Produkt | `Entwurf` | Entwurf | grau |
| Produkt | `Geprueft` | Wartet auf Veröffentlichung | blau |
| Produkt | `Aktiv` | Veröffentlicht | grün |
| Produkt | `Pausiert` | Pausiert | orange |
| Produkt | `Ausgelaufen` | Ausgelaufen | grau (W17) |
| Produkt | `verkauf_online = 1` | Im Shop | Chip |
| Produkt | `website_sichtbar = 0` | Ausgeblendet | Chip |
| Produkt | `preisstand_alt = 1` | Preis veraltet | orange |
| Produkt | `abverkauf = 1` | Abverkauf | Chip |
| Produkt-Workflow | `Prüfen` / `Veröffentlichen` / `Zurück auf Entwurf` / `Pausieren` / `Reaktivieren` / `Auslaufen lassen` | Zur Veröffentlichung geben / Veröffentlichen / Zurück auf Entwurf / Pausieren / Wieder veröffentlichen / Auslaufen lassen | – |
| Bestellung | `Entwurf` · `Gesendet` · `AB erhalten` · `AB geprueft` · `Teilgeliefert` · `Geliefert` · `Abgeschlossen` · `Storniert` | Entwurf · Gesendet · AB erhalten · AB bestätigt · Teilweise geliefert · Geliefert · Abgeschlossen · Storniert | grau · blau · blau · türkis · orange · grün · grau · grau |
| Bestellung (Workflow) | `AB freigeben` | AB bestätigen | – |
| AB-Bewertung | `offen` / `ok` / `pruefen` / `abgelehnt` | offen / OK / Rückfrage / Abgelehnt | grau / grün / orange / rot |
| AB-Klärung | `akzeptieren` / `lieferant_reklamieren` / `kunde_rueckfragen` | OK (Leitung) / Rückfrage beim Hersteller / Rückfrage beim Verkauf | – |
| Wareneingang | `Offen` / `Teilweise` / `Vollstaendig` / `Reklamiert` | nichts erhalten / teilweise / vollständig / Reklamation | grau / orange / grün / rot |
| WE-Position | `ok` / `beschaedigt` / `Transportschaden` / `falsch` / `fehlt` | in Ordnung / beschädigt ab Werk / Transportschaden / falscher Artikel / fehlt | – |
| WE-Mengen | `keine` / `Unterlieferung` / `Ueberlieferung` | – / weniger als erwartet / mehr als erwartet | – / orange / orange |
| Preisliste | `Hochgeladen` / `Geprueft` / `Uebernommen` / `Verworfen` | Eingelesen / Abgeglichen / Übernommen / Verworfen | blau / türkis / grün / grau (ohne Durchstreichen) |
| Preisliste-Methode | `pruefen` / `uebernehmen` | Abgleichen / Übernehmen | – |
| Marke | `Keiner` / `Anfrage laeuft` / `Haendler` / `Vertragshaendler` / `Exklusiv` / `Partner` | kein Händlerstatus / Anfrage läuft / Händler / Vertragshändler / Exklusivhändler / Partner | orange / blau / grün … |
| Bild | `freisteller` / `ambiente` / `detail` / `logo` / `hero` / `story` | Freisteller / Ambiente / Detail / Logo / Titelbild / Geschichte | – |
| Bildfreigabe | `erteilt` / `offen` / `abgelehnt` | Freigegeben / Freigabe offen / Abgelehnt | grün `circle-check` / orange `clock` / rot `circle-x` |
| Welt | `Kueche` usw. | Küche usw. | – |
| Preisart | `Verkaufspreis` / `UVP` / `Herstellerpreis` / `Angebot` / `Auf Anfrage` / `Einkaufspreis` | Verkaufspreis / Unverbindliche Preisempfehlung (UVP) / Herstellerpreis / Aktionspreis / Preis auf Anfrage / Einkaufspreis | – |
| USt | `20` / `13` / `10` / `0` (nach AS8; heute `normal`/`ermaessigt`) | 20 % – Normalsatz / 13 % – z. B. Pflanzen / 10 % – z. B. Bücher / 0 % – steuerfrei | – |
| Technik | Claim-Guard · Slug · Website-Cache erneuern · Revalidate · Workflow | Händlerwort-Prüfung · Web-Adresse · Website jetzt aktualisieren · (nicht anzeigen) · (nicht anzeigen) | – |
| Recht | Freigabe anfragen | Leitung bitten | – |

Ergebnistexte von „Website jetzt aktualisieren“: enqueued „Website wird aktualisiert“ · gedrosselt „Wurde gerade erst angestoßen – in einer Minute erneut möglich“ · aus „Automatische Website-Aktualisierung ist ausgeschaltet (Einstellungen)“ · nicht konfiguriert „Website-Adresse fehlt – Admin informieren“.

Geschlechtsneutral: Rollen erscheinen als „Team Sortiment“ und „Leitung Sortiment“, nicht als „Mitarbeiter“.

---

## 3. Seiten des Bereichs

### 3.0 Sitemap, Unternavigation, gemeinsame Zustände

| Route | Typ (05 §2) | Quelle | Rollen |
|---|---|---|---|
| `/sortiment` | T1 Bereichsstart „Zu tun“ | 4 Kennzahlen + Zu-tun-Gruppen | Sortiment *, GF |
| `/sortiment/produkte` (`?ansicht=liste|kacheln|kanban`) | T2/T3 | PH Produkt | Sortiment *; lesend Verkauf, Kassa, Projekte, Marketing, Logistik, Service |
| `/sortiment/produkte/[slug]` (`?tab=`) | T5 Akte | PH Produkt + Ausführungen + Bezüge | wie oben |
| `/sortiment/marken`, `/sortiment/marken/[marke]` | T2 / T5 | PH Marke | Sortiment *, GF |
| `/sortiment/lieferanten`, `/sortiment/lieferanten/[name]` | T2 / T5 | PH Lieferant | Sortiment *, GF; lesend Projekte, Logistik, Service |
| `/sortiment/bestellungen` (`?ansicht=kanban`) | T2/T3 | PH Herstellerbestellung | Sortiment *; lesend Projekte, Logistik (Faktura nach AS11) |
| `/sortiment/bestellungen/neu` | Formular | PH Herstellerbestellung | Sortiment * |
| `/sortiment/bestellungen/[name]` (`?tab=`) | T5 | PH Herstellerbestellung | wie Liste |
| `/sortiment/bestellungen/[name]/ab` | T6 Assistent A10 | `ab_einlesen`, `ab_abgleich_erzeugen` | Sortiment * |
| `/sortiment/wareneingang`, `/sortiment/wareneingang/[name]` | T2 / T5 | PH Wareneingang | Sortiment *, Logistik * |
| `/sortiment/wareneingang/neu?bestellung=` | T6 Assistent S3 (auch Kiosk) | PH Wareneingang | Sortiment *, Logistik * |
| `/sortiment/freigaben` (`?art=bilder|preise|lieferzeiten`) | T2 Kachelraster | PH Produkt Bild, PH Marke Bild, PH Produkt Preis, PH Produkt | Leitung entscheidet; Team lesend |
| `/sortiment/preislisten`, `/sortiment/preislisten/[name]` | T2 / T6 Assistent A11 | PH Preisliste Import | Team bis „Abgleichen“, Leitung „Übernehmen“ |
| `/sortiment/kategorien`, `/sortiment/merkmale` | T9 | PH Kategorie, PH Merkmal | Sortiment * |
| `/sortiment/import` | T6 | `importer.katalog.importieren_aus_anhang` | Leitung, Admin |
| `/sortiment/berichte`, `/sortiment/berichte/[report]` | T8 | 6 Reports + 4 Charts | Sortiment *, GF |
| `/sortiment/einstellungen` | T9 | PH Sortiment Einstellungen | Leitung (Team lesend) |

Kein eigener Assistent „Produkt anlegen“: „+ Produkt“ öffnet den Schnellanlage-Dialog (§3.3) auf jeder Sortiment-Seite, `?neu=produkt` öffnet ihn per URL.

**Unternavigation** (Tabs mit 2-px-Unterstrich Tinte, 02 §2.1, max. 7): **Übersicht · Produkte · Marken · Bestellungen · Wareneingang · Freigaben · Mehr ▾** (Lieferanten, Preislisten, Kategorien, Merkmale, Berichte, Import, Einstellungen). Zähler-Badge an „Freigaben“ (offene Bilder + Preise + Lieferzeiten, nur Leitung) und „Bestellungen“ (AB ausständig + Abweichungen offen). `ROUTEN`-Register (05 §3): PH Produkt, PH Marke, PH Herstellerbestellung, PH Wareneingang, PH Preisliste Import, PH Lieferant auf die Akten oben; `/d/ph-produkt/<slug>` leitet mit 307 um.

**Gemeinsame Zustände** jeder Route (05 §2.2): `laden` (Skeleton erst nach 300 ms, in Zielhöhe) → `bereit` | `leer` (drei Fälle 02 §7.1: nie / gefiltert / erledigt) | `fehler:<code>` (Block „Nicht geladen · Erneut versuchen“ mit Kennung `#a1b2`, Tabelle 05 §11) | `kein-zugriff` | `nicht-gefunden`. Übergang Skeleton → Inhalt als Crossfade 80/160 ms (04 §3.9). Texte für alle Leer- und Fehlerfälle: §8.

### 3.1 `/sortiment` – Bereichsstart „Zu tun“ (T1)

```
┌ Zentrale › Sortiment                                                                [+ Neu ▾] ┐
│ Sortiment      Übersicht  Produkte  Marken  Bestellungen 8  Wareneingang  Freigaben 7  Mehr ▾  │
├───────────────────────┬───────────────────────┬───────────────────────┬──────────────────────┤
│ VERÖFFENTLICHT        │ OFFENE BESTELLUNGEN   │ MARKEN OHNE HÄNDLER-  │ IM SHOP OHNE GÜLTIGEN│
│ 412                   │ 17                    │ STATUS  5             │ PREIS  3             │
│ +6 in 30 Tagen        │                       │                       │                      │
├───────────────────────┴───────────────────────┴───────────────────────┴──────────────────────┤
│ ZU TUN                                                     Meine · Alle          Berichte →  │
│ AB einlesen · 3                                                                              │
│   HB-2026-00041 · Gaggenau · Auftrag AB-2026-00112 · seit 9 Tagen, Frist 5   [AB einlesen]   │
│   HB-2026-00044 · Ezarri · Hotel Seeblick · seit 6 Tagen                     [AB einlesen]   │
│ Abweichungen klären · 5                                                                      │
│   HB-2026-00038 · Bora · 2 offen                                             [Klären]        │
│ Wareneingang erwartet · 2                                                                    │
│   HB-2026-00033 · Ezarri · Termin 05.11.                                     [Eingang buchen]│
│ Preis läuft ab oder veraltet · 12                                                            │
│   Bora X Pure · 2.890,00 € UVP · veraltet seit 12.10.                        [Preis bestätigen]│
│   alle 12 →                                                                                  │
│ Wartet auf Veröffentlichung · 6          Bilder ohne Freigabe · 5 Marken, 38 Bilder           │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Kennzahlen (genau 4, keine Doppelung mit „Zu tun“):** Veröffentlicht (`PH Aktive Produkte`), Offene Bestellungen (`PH Offene Herstellerbestellungen`), Marken ohne Händlerstatus (`PH Marken ohne Haendlerstatus`), Im Shop ohne gültigen Preis (`verkauf_online = 1`, `aktueller_preis_cent` leer, `status = Aktiv`). Klick öffnet die gefilterte Liste. Trendzeile nur bei ableitbarem Vergleich („+n in 30 Tagen“ aus `veroeffentlicht_am`), sonst keine Zeile. Keine Sparkline ohne Zeitreihe (03 §8.14).

**„Zu tun“-Gruppen** (Reihenfolge fest, leere Gruppe entfällt, je Gruppe max. 5 Zeilen + „alle n →“):

| Gruppe | Quelle | Zeilenknopf (sichtbarer Text) | Wer |
|---|---|---|---|
| Bestellung ohne Lieferant | PH Herstellerbestellung `status = Entwurf`, `lieferant` leer | Lieferant zuordnen | Team |
| Bestellentwurf aus Auftrag | `status = Entwurf`, `bezug_doctype` gesetzt | Senden … | Team |
| AB einlesen | `status = Gesendet` + Frist (`ab_erwartet_tage`, Standard 5) | AB einlesen | Team |
| Abweichungen klären | `abweichungen_offen > 0` | Klären | Team (Ablehnen: Leitung) |
| Storno angefragt | `storno_angefragt_am` gesetzt, `storno_bestaetigt_am` leer (AS18) | Storno bestätigen | Team |
| Wareneingang erwartet (7 Tage) | `status in (AB geprueft, Teilgeliefert)`, `bestaetigter_termin ≤ heute + 7` | Eingang buchen | Team, Logistik |
| Lieferung überfällig | `bestaetigter_termin < heute`, nicht geliefert | Termin ändern | Team |
| Reklamation offen | PH Wareneingang `status = Reklamiert` ohne `servicefall_ref` | Schaden melden | Team |
| Preis läuft ab oder veraltet | `preisstand_alt = 1` und (nach AS14) `gueltig_bis ≤ heute + 30` | Preis bestätigen | Team |
| Wartet auf Veröffentlichung | PH Produkt `status = Geprueft` | Veröffentlichen … | Leitung; Team sieht „Leitung entscheidet“ |
| Bilder ohne Freigabe | Report `PH Produkte ohne Bildfreigabe`, gruppiert nach Marke | Freigaben öffnen | Leitung |
| Preise / Lieferzeiten warten auf Freigabe | `PH Produkt Preis.freigegeben = 0`; `lieferzeit_freigegeben = 0` | Freigaben öffnen | Leitung |
| Preisliste abgeglichen | PH Preisliste Import `status = Geprueft` | Übernehmen … | Leitung |
| Händlervertrag läuft aus (60 Tage) | PH Marke `vertrag_gueltig_bis ≤ heute + 60` | Marke öffnen | Leitung |

- **Zeile:** 40 px, Fokus mit `↑↓`, `Enter` öffnet das Objekt, `Shift+Enter` führt den Zeilenknopf aus. Der Knopf ist immer sichtbar (nicht nur bei Hover).
- **„Meine“** = von mir angelegt, mir zugewiesen (ToDo aus `ab_erinnerung`, PH Aufgabe) oder `gesendet_von = ich`.
- **„+ Neu ▾“:** Produkt (Schnellanlage), Bestellung, Marke, Lieferant, Preisliste, Wareneingang (fragt nach der Bestellung).
- **Charts** liegen in `/sortiment/berichte`, nicht hier. Die „Heute“-Leiste gibt es nur in der Zentrale (05 §7.4, W22).
- **Laden:** Kopf echt; Kennzahlen und „Zu tun“ je eigener `<Suspense>`; Skeleton 4 Gruppen × 2 Zeilen. Zahlen stehen sofort, ohne Hochzählen (§9).
- **Leer:** Alle Gruppen leer → „Alles erledigt – nichts zu tun im Sortiment.“ mit `circle-check` 32 px in Sand. Neuer Mandant ohne Marke → Karte „Erste Schritte“ an der Stelle von „Zu tun“: Marke anlegen → Lieferant → Produkt → Bildfreigabe erfassen (abhakbar, 01 H3).
- **Fehler:** je Block einzeln „Nicht geladen · Erneut versuchen“ (Kennung); der Rest der Seite bleibt bedienbar.
- **Kürzel:** `r` neu laden, `n` Neu-Menü, `↑↓`, `Enter`, `Shift+Enter`.

### 3.2 `/sortiment/produkte` – Produkte (Liste · Kacheln · Kanban)

```
┌ Zentrale › Sortiment › Produkte                                                    [+ Produkt] ┐
│ Produkte                                         Liste | Kacheln | Kanban      [CSV] [Spalten] │
│ Ansichten: Alle · Wartet auf Veröffentlichung 6 · Preis veraltet 12 · Ohne Bildfreigabe 38 · Im Shop 97 · Abverkauf · + Ansicht speichern │
├ [Entwurf 23] [Wartet 6] [Veröffentlicht 412] [Pausiert 9] · Marke ▾ · Kategorie ▾ · Welt ▾ · + Filter · Suche (/) ┤
│ ☐ │ Bild │ Produkt                      │ Kategorie   │ Status                   │ Preis ab             │ Bilder       │ Geändert │ ⋯ │
│ ☐ │ [▣]  │ X Pure                       │ Kochfeld m. │ Veröffentlicht           │ 2.890,00 €           │ alle frei    │ vor 2 Std│ ⋯ │
│   │      │ Bora · XPU                   │             │ Preis veraltet           │ veraltet seit 12.10. │              │          │   │
│ ☐ │ [▢]  │ EB 333                       │ Backofen    │ Entwurf                  │ –                    │ 0 von 2 frei │ gestern  │ ⋯ │
│   │      │ Gaggenau · EB333110          │             │                          │                      │              │          │   │
│ ☐ │ [▣]  │ Rote Pampelmuse Kerze 190 g  │ Duftkerze   │ Veröffentlicht · Im Shop │ 79,00 €              │ alle frei    │ 02.11.   │ ⋯ │
│   │      │ Baobab · …                   │             │                          │ läuft ab 02.01.      │              │          │   │
├ 1–50 von 450 · ‹ 1 2 3 … 9 › · [25|50|100]                                                    ┤
└ Auswahl (3): [Zur Veröffentlichung geben] [Veröffentlichen …] [Pausieren] [Kategorie setzen ▾] [Mehr ▾] · Esc ┘
```

**Standardspalten (7, kein horizontaler Scroll bei 1280 px mit offener Seitenleiste):**

| Spalte | Inhalt | Regel |
|---|---|---|
| Bild | `bild_hauptbild` 32 px auf weißer Platte (auch im Dunkelmodus, Rand `line`, Radius 6) | Ecke unten rechts 16-px-Icon für den Bildzustand (§10) |
| Produkt | Zeile 1 `name_herstellerbezeichnung` 14/500; Zeile 2 Marke · `hersteller_artikelnr` 12 `muted` | – |
| Kategorie | `label_de` | – |
| Status | Badge (§2) + höchstens ein zweites Badge: „Preis veraltet“ oder „Im Shop“ oder „Ausgeblendet“ (03 §8.9: max. 2) | – |
| Preis ab | `aktueller_preis_cent` tabular, Preisart als Tooltip; Zeile 2: „Stand 12.04.“, „läuft ab 12.10.“ (`warning-text`, < 30 Tage) oder „veraltet seit …“ (`danger-text` + `triangle-alert`) | Text statt Symbol |
| Bilder | „alle frei“ / „2 von 3 frei“ / „kein Bild“ | aus `bilder_anzahl`, `bilder_offen` |
| Geändert | `modified` relativ | – |

Wählbar zusätzlich: Typ, Welt, Collection, Serie, Designer, EAN, Ausführungen (`ausfuehrungen_anzahl`), Lieferzeit (`lieferzeit_wochen_von–bis` + Freigabezustand), USt-Satz, Nach Kundenwunsch (`kundenspezifisch`, AS12), Importquelle, Veröffentlicht am. Spalte „EK“ (`einkaufspreis_cent`) nur Leitung. **iPad:** 4 Prioritätsspalten Bild · Produkt · Status · Preis ab (02 §11.1).

**Filter (URL-Zustand):** `status[]`, `marke`, `kategorie` (inkl. `kategorien_weitere`), `welt`, `typ`, `bild_freigegeben`, `preisstand_alt`, `verkauf_online`, `website_sichtbar`, `lieferzeit_freigegeben`, `abverkauf`, `ust_klasse`, `import_quelle`, `q` (sucht `name_herstellerbezeichnung`, `titel`, `hersteller_artikelnr`, `ean`, `collection`, `slug`). Standardfilter `status != Ausgelaufen` als entfernbarer Chip.

**Systemansichten:** „Wartet auf Veröffentlichung“ (`status = Geprueft`), „Preis veraltet“ (`preisstand_alt = 1`), „Ohne Bildfreigabe“ (`bild_freigegeben = 0`, nicht ausgelaufen), „Im Shop“ (`verkauf_online = 1`), „Abverkauf“ (`abverkauf = 1`). Eigene Ansichten je Person (Filter + Sortierung + Spalten, stabile ID).

**Kachelansicht** (Standard am iPad): Karte 200 px, Bild 4:3 `contain` auf weißer Platte, Titel 14/500, Marke 12 `muted`, Preis ab tabular, Status-Badge unten links, Bildzustand-Icon mit Text im Tooltip/`aria-label`. Hover `translateY(-1px)` 120 ms `--bo-ease-out`. Checkbox oben links (Touch dauerhaft sichtbar).

**Kanban (nur der Weg zur Veröffentlichung):** Spalten Entwurf · Wartet auf Veröffentlichung · Veröffentlicht (letzte 14 Tage) · Pausiert. In der Spalte „Veröffentlicht“ steht unten „Ältere: Liste öffnen“. Karte: Bild 48 px, Titel, Marke, Preis ab, Bildzustand-Icon.

| Ziehen nach | Wirkung |
|---|---|
| Wartet auf Veröffentlichung | Workflow „Zur Veröffentlichung geben“ direkt mit Undo-Toast; bei Sperrgrund springt die Karte zurück (200 ms `--bo-ease-out`), Toast nennt den Grund („Fehlt: deutscher Text“) |
| Veröffentlicht | öffnet **denselben Dialog wie der Knopf** (Checkliste, „n möglich – m blockiert“). Abbrechen → Karte 200 ms zurück, kein Serveraufruf. Für das Team ist die Spalte halbtransparent; Tooltip „Veröffentlichen: Leitung“ |
| Pausiert | Undo-Toast, verzögerter Commit (Außenwirkung) |
| Entwurf | Workflow „Zurück auf Entwurf“ mit Undo |

Tastatur-Alternative zum Ziehen: Karte fokussieren → `m` → Menü „Verschieben nach …“ mit denselben Regeln (WCAG 2.5.7).

**Zeilenmenü (`⋯`, Rechtsklick, `Shift+F10`, `.`):** Öffnen · In neuem Tab · Seitenblick · Website-Vorschau (de) · Preis erfassen · Preis bestätigen · Duplizieren · Datenblatt drucken · Status ▾ (erlaubte Übergänge) · Als Ausstellungsstück anlegen …

**Massenaktionen** (Leiste unten, §5.7): Zur Veröffentlichung geben · Veröffentlichen … (Leitung) · Pausieren · Wieder veröffentlichen (Leitung) · Auslaufen lassen … (Leitung, Dialog) · Kategorie setzen / weitere Kategorie hinzufügen · Welt/Typ setzen · Ausblenden/Einblenden · Im Shop an/aus · Preis bestätigen · Website jetzt aktualisieren (einmal, nicht n-mal) · Datenblatt drucken (Sammel-PDF ≤ 50) · CSV (Recht `export`).

**Seitenblick (01 D10):** `Leertaste` oder Knopf `panel-right` in der Zeile öffnet die Akte als Sheet 480 px rechts (Kopf, Hauptbild, Preis mit Stand, Bildzustand, Primäraktion); `↑↓` blättert. `Shift+Klick` bleibt Bereichsauswahl.

**Zustände:** Laden = Kopf echt + 8 Skeleton-Zeilen mit Bildquadrat. Rücksprung aus der Akte (`?markiert=<slug>`): Zeile Sand 14 % → transparent in 1200 ms (04 §3.3). Leer- und Fehlertexte §8.

### 3.3 Schnellanlage „Neues Produkt“ (Dialog md 560 px, ersetzt den alten Assistenten S1)

```
┌ Neues Produkt ─────────────────────────────────────────────────── ✕ ┐
│ Marke*        [Bora                    ▾]  Vertragshändler · aktiv  │
│ Kategorie*    [Kochfeld mit Dunstabzug ▾]  USt 20 % · Grundpreis nein│
│ Bezeichnung*  [X Pure                                     ]         │
│ Art.-Nr.      [XPU                 ]                                │
│ ⓘ Gibt es schon: Bora X Pure (Veröffentlicht) · Öffnen →            │
│ Weitere Angaben ▾  (EAN, Typ, Collection, Serie, Designer, Hersteller-Seite) │
│ Web-Adresse: /produkte/kochfeld-mit-dunstabzug/bora-x-pure          │
├─────────────────────────────────────────────────────────────────────┤
│                      [Abbrechen]  [Anlegen]  [Anlegen und öffnen ⌘↵] │
└─────────────────────────────────────────────────────────────────────┘
```

| Feld | PH Produkt | Prüfung live | Fehler |
|---|---|---|---|
| Marke* | `marke` (LinkFeld mit Händlerstatus- und Marken-Status-Badge) | Marke `Inaktiv`/`Pausiert` → Hinweis „Veröffentlichen ist erst möglich, wenn die Marke aktiv ist“ (kein Blocker beim Anlegen) | – |
| Kategorie* | `kategorie` (Baum-Combobox über `uebergeordnet`) | zeigt geerbten USt-Satz und Grundpreispflicht der Kategorie | Kategorie ohne USt-Satz → Hinweis „USt-Satz der Kategorie fehlt – Veröffentlichen gesperrt“ |
| Bezeichnung* | `name_herstellerbezeichnung` | Händlerwort-Prüfung live (§4.1 Texte) | Serverfehler am Feld |
| Art.-Nr. | `hersteller_artikelnr` | Dublette: gleiche Art.-Nr. + Marke **oder** gleiche Web-Adresse → Hinweis mit Link „Öffnen“ (kein Blocker, Varianten mit gleicher Nummer sind möglich) | – |
| Weitere Angaben | `ean` (Prüfziffer), `typ` (Standard Katalog), `collection`, `serie`, `designer`, `hersteller_url` | EAN-Prüfziffer falsch → Feld rot „Prüfziffer passt nicht“ | – |

- **Ausführung:** `speichernDokumentAction` (insert PH Produkt, `status = Entwurf`). „Anlegen“ schließt mit Toast „X Pure angelegt · Öffnen“; „Anlegen und öffnen“ springt in die Akte, Tab Produkt. Die Checkliste „Bereit für Website“ zeigt dort die nächsten Schritte (Bilder, Text, Preis, Lieferzeit).
- **Esc / Abbrechen:** Vor „Anlegen“ entsteht nichts. Eine Rückfrage „Eingaben verwerfen?“ kommt nur, wenn mindestens ein Feld befüllt ist.
- **Doppelklick:** Knopf `pending` bis zur Antwort; `idempotency_key` auf PH Produkt fehlt (AS16). Bis dahin vor dem Insert die Dublettenprüfung erneut am Server: gleiche Web-Adresse → Fehler „Gibt es schon“ statt zweitem Datensatz.
- **„Noch eins, gleiche Marke“:** `⌘⇧↵` legt an und öffnet den Dialog erneut mit vorbelegter Marke und Kategorie.
- **Fehler:** Pflichtfeld leer → Text unter dem Feld, Fokus auf das erste leere Feld. Server lehnt ab → Meldung am Feld, der Dialog bleibt offen und behält alle Eingaben.

### 3.4 `/sortiment/marken` – Marken (Liste · Logos)

```
┌ Marken                                                          Liste | Logos           [+ Marke] ┐
│ Alle · Aktiv · Ohne Händlerstatus · Bildfreigabe offen · Vertrag läuft aus · Pausiert              │
├ ☐ │ Logo │ Marke    │ Welt        │ Händlerstatus      │ Händlerbeleg │ Bildfreigabe    │ Produkte │ ⋯ ┤
│ ☐ │ [▣]  │ Bora     │ Küche       │ Vertragshändler    │ Vertrag      │ Freigegeben     │ n        │   │
│ ☐ │ [▣]  │ Gaggenau │ Küche       │ Anfrage läuft      │ –            │ Freigabe offen  │ n        │   │
│ ☐ │ [▣]  │ Baobab   │ Accessoires │ kein Händlerstatus │ –            │ Abgelehnt       │ n        │   │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Spalten:** `logo` (weiße Platte), `marke`, `welt`, `haendlerstatus` (Badge-Ton §2), „Händlerbeleg“ (Art: Vertrag / Web-Beleg / Notiz; Vertragsdatei nur Leitung), `bildfreigabe_status` (Icon + Text), `produkte_anzahl`; wählbar `lieferant`, `bestellweg`, `vertrag_gueltig_bis` („läuft aus am …“ in `danger-text` < 60 Tage), `status`, `preisart`, `land`.
- **Systemansichten:** „Ohne Händlerstatus“ (= Number Card), „Bildfreigabe offen“ (`bildfreigabe_status != schriftlich erteilt`), „Vertrag läuft aus“ (`vertrag_gueltig_bis ≤ heute + 60`), „Pausiert“.
- **Logo-Ansicht:** Raster 6 Spalten, Logo 120 × 60 `contain` auf Weiß, darunter Händlerstatus als Text und Produktzahl.
- **Massenaktionen:** Status setzen (Pausiert fragt `preise_pausiert_grund`), Ausblenden/Einblenden (verzögerter Commit), Welt setzen, „Bildfreigabe anfordern …“ (ein Dialog, je Marke `bildfreigabe_anfordern`; Marken ohne Empfänger werden als übersprungen gelistet; Haken „In 14 Tagen nachfassen“ legt eine PH Aufgabe an), CSV.
- **Zeilenmenü:** Öffnen · Produkte der Marke · Neue Bestellung · Bildfreigabe anfordern … · Freigabe erhalten … (S4) · Lieferant öffnen/anlegen.
- **Kürzel:** Liste (§6) + `Shift+B` Neue Bestellung, `Shift+L` Lieferant öffnen/anlegen. Bildfreigabe anfordern hat kein Kürzel (Mail).

### 3.5 `/sortiment/lieferanten` – Lieferanten (T2)

Spalten: `firmenname`, Marke(n), `status`, `bestellweg` (Icon + Text), `bestell_email` („fehlt“ in `danger-text`, wenn Bestellweg E-Mail und leer), `land` (ISO, nach AS10), offene Bestellungen (eine Sammelabfrage gruppiert nach `lieferant`), Pünktlich % (Report `PH Liefertermintreue je Lieferant`, `quote_puenktlich`, einmal je Seite). `konditionen`/`notizen` nie in der Liste. Filter: `status`, `bestellweg`, „ohne Bestell-E-Mail“, „mit offenen Abweichungen“, „Drittland“ (`land` nicht EU). Kürzel `n` neu, `Shift+B` neue Bestellung zur fokussierten Zeile.

Neuer Lieferant: Dialog md mit `firmenname`*, `land`*, `bestellweg`*, `bestell_email` (Pflicht bei Bestellweg E-Mail), `uid` (Formatprüfung je Land, nach AS10), Marke. Benennung: Heute ist der Datensatzname = `firmenname` (`autoname field:firmenname`); eine Umfirmierung bricht Links. Bis AS10 (Nummernkreis `LF-.#####`) zeigt die Akte beim Ändern von `firmenname` den Hinweis „Name ist auch die Kennung – Umbenennen über Leitung“, und das Feld ist für das Team gesperrt.

### 3.6 `/sortiment/bestellungen` – Herstellerbestellungen (Liste · Kanban)

```
┌ Bestellungen                                             Liste | Kanban     [+ Bestellung] [CSV] ┐
│ Offen n · Entwurf · Lieferant fehlt n · AB ausständig n · Abweichungen offen n · Lieferung überfällig n · Storno angefragt n │
├ ☐ │ Nummer        │ Lieferant  │ Kommission        │ Status                  │ AB                    │ Termin │ Geliefert │ ⋯ ┤
│ ☐ │ HB-2026-00041 │ Gaggenau   │ AB-2026-00112     │ Gesendet                │ seit 9 Tagen, Frist 5 │ –      │ 0 von 3   │   │
│ ☐ │ HB-2026-00038 │ Bora       │ Lager             │ AB erhalten · 2 offen   │ AB-7712               │ 18.12. │ 0 von 2   │   │
│ ☐ │ HB-2026-00033 │ Ezarri     │ Hotel Seeblick    │ Teilweise geliefert     │ AB-551                │ 05.11. │ 1 von 2   │   │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Spalten (Standard 7):** `name`, `lieferant` (leer → „fehlt“ in `danger-text`), `kommission`, Status (Badge + Zusatz „n offen“ / „Storno angefragt“ / „Vorkasse offen“), AB (`ab_nummer`; bei Gesendet ohne AB „seit n Tagen“, ab Frist `danger-text` „n Tage, Frist m“), `bestaetigter_termin` (`danger-text`, wenn vergangen und nicht geliefert), Geliefert („1 von 2“ aus `menge_erhalten`/`menge_bestellt` + Balken 48 px). Wählbar: `marke`, `datum`, `gesendet_am`, `wunschtermin`, `bestellweg`, `lieferadresse`, Bezug (Chip in den Zielbereich), `waehrung`, `summe_ek_cent` (Leitung, „EK netto“), `summe_vk_cent` („VK netto“, nach AS9), `export_am`.
- **Systemansichten:** Offen (= Number Card), Lieferant fehlt (`lieferant` leer), AB ausständig (`status = Gesendet` + Frist; serverseitig filterbar erst mit `ab_faellig_am`, AS14 – bis dahin clientseitig über die Sammelabfrage), Abweichungen offen (= Number Card `PH AB mit Abweichung`), Lieferung überfällig, Storno angefragt (AS18), Geliefert – Rechnung offen (`status = Geliefert`).
- **Kanban:** Spalten Entwurf · Gesendet · AB erhalten · AB bestätigt · Teilweise geliefert · Geliefert (Abgeschlossen/Storniert nur per Filter). Karte: Nummer, Lieferant, Kommission, Termin, Abweichungszähler als Text, Lieferbalken. Ziehen setzt den Status nie still:

| Ziehen nach | Wirkung |
|---|---|
| Gesendet | öffnet den Senden-Dialog (§5.2, inkl. Anzahlungsprüfung) |
| AB erhalten | öffnet A10 |
| AB bestätigt | ohne offene Abweichung: „AB bestätigen“ mit Undo; sonst Karte 200 ms `--bo-ease-out` zurück, Toast „2 Abweichungen offen – Klären“ mit Link |
| Teilweise geliefert / Geliefert | öffnet S3 Wareneingang (bei „Kunde direkt“ den Dialog „Lieferung beim Kunden bestätigen“) |

- **Massenaktionen:** Senden … (nur Entwürfe mit Bestellweg E-Mail, Empfänger und ohne Anzahlungssperre; Dialogtitel „5 Bestellungen an 3 Hersteller senden?“, Liste der Empfänger und PDFs je Lieferant; übersprungene mit Grund), Als gesendet markieren … (Portal/Fax/Telefon, Pflichtfeld „Gesendet über“), Für IWOfurn/pCon exportieren (`export_schnittstelle`), Sammel-PDF, Stornieren … (Leitung; Entwürfe auch Team, §5.2), CSV.
- **Kürzel:** Liste (§6) + `Shift+S` Senden (Dialog), `Shift+A` AB einlesen, `Shift+W` Wareneingang buchen, `p` PDF-Vorschau.

### 3.7 `/sortiment/bestellungen/neu` – Bestellung erfassen (Formular)

```
┌ Neue Bestellung                                                 [Entwurf speichern ⌘S] [Senden … ⌘⏎] ┐
│ Lieferant* [Gaggenau Hausgeräte ▾]  Marke [Gaggenau]  Datum [04.11.2026]  Währung EUR                  │
│ Kommission [AB-2026-00112        ]  Bestellweg: E-Mail · bestellung@… (aus Lieferant)                  │
│ Wunschtermin [15.12.2026]  Vorschlag: frühestens KW 51 (Lieferzeit 6–8 Wo., Betriebsurlaub 22.12.–06.01.) │
│ Lieferadresse (● Lager ○ Showroom ○ Kunde direkt)  Lieferland [AT]   Bezug [Auftrag AB-2026-00112 ✕]   │
│ ⚠ Anzahlung Kunde: 0 von 3.000,00 € eingegangen – Senden nur durch Leitung                              │
├ Pos │ Produkt / Freitext      │ Ausführung    │ Art.-Nr.  │ Raum   │ Menge │ Einh. │ EK netto¹ │ VK netto │ Wunsch │ ⋯ ┤
│ 1   │ [Gaggenau EB 333   ▾]   │ [Edelstahl ▾] │ EB333110  │ Küche  │ 1     │ Stk   │ …         │ …        │ 15.12. │   │
│ +   │ Produkt suchen oder Freitext (Enter = neue Zeile) …                                                │
├ Summe EK netto¹ …   Summe VK netto …   Menge 1      Hinweis: unter Mindestbestellwert des Lieferanten     ┤
│ Notiz an Hersteller [ … ]                     Interne Notiz¹ [ … ]                                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
¹ nur Leitung (permlevel 1)
```

- **Vorbefüllung:** Lieferant füllt `marke`, `bestellweg`, `gesendet_an`, `waehrung`. Produktzeile füllt `bezeichnung`, `hersteller_artikelnr`, `ausfuehrung_text`, `kundenspezifisch` (ro, nach AS12); Wunschtermin und Kommission erben vom Kopf.
- **Wunschtermin-Vorschlag:** aus `PH Lieferant.liefertermin(marke, kategorie, bestelldatum)` (Lieferzeiten je Marke/Kategorie + `betriebsurlaub`). Ohne Eingabe setzt der Server beim Speichern `wunschtermin_schaetzen()`. Die UI zeigt den Vorschlag als Satz und übernimmt ihn per Klick.
- **VK netto:** Die Spalte heißt „VK netto“. Aus einem Auftrag kommt der Wert netto (`einzel_netto_cent`). Bei Vorbefüllung aus dem Produkt rechnet die UI brutto ÷ (1 + USt-Satz) und zeigt „aus Bruttopreis umgerechnet“. Eine Umbenennung zu `vk_netto_cent` ist angefragt (AS9); bis dahin gilt: `vk_cent` ist immer netto, die UI schreibt nie brutto hinein.
- **Währung:** Betragsfelder zeigen das Kürzel des Dokuments („CHF 1.250,00“), nie fest „€“. Bei Währung ≠ EUR: Felder „Kurs“ und „Kursdatum“ und daneben grau „≈ 1.312,50 € (Kurs 04.11.)“. Senden ist gesperrt, solange der Kurs fehlt. Die Felder `kurs`, `kurs_datum`, `summe_ek_eur_cent` fehlen in der App (AS1-W) → bis dahin sind Bestellungen in Fremdwährung gesperrt mit Text „Fremdwährung ist noch nicht freigeschaltet – bitte in EUR bestellen oder Leitung bitten“.
- **Kunde direkt:** `lieferadresse_text` wird Pflicht (Feld vorher rot markiert); Lieferland Pflicht (nach AS10). Ist das Lieferland nicht AT und weicht es vom Land des Lieferanten ab → Band „Reihengeschäft/Ausfuhr – Steuerbehandlung mit Buchhaltung klären“. Der Senden-Dialog weist auf Kundendaten im PDF hin (§5.2).
- **Mindestbestellwert:** Hinweis, wenn `summe_ek_cent < lieferant.mindestbestellwert_cent` (keine Sperre; nur Leitung sieht die Beträge, das Team sieht nur den Satz).
- **Bezugskosten:** Abschnitt „Zusatzkosten“ (Fracht, Verpackung, Zoll, Mindermengenzuschlag, Montage) erscheint erst mit AS15 (Kindtabelle `PH Herstellerbestellung Kosten`). Bis dahin: Freitext in „Interne Notiz“ und Hinweis „Zusatzkosten bitte in der internen Notiz vermerken“.
- **Positionen tastaturgeführt** (02 §9.4). Menge ≤ 0 → Zeile rot „Menge muss größer als 0 sein“. Autosave des Entwurfs 1,5 s nach der letzten Eingabe, Anzeige „Gespeichert · vor 2 s“. `idempotency_key` ist vorhanden und wird beim ersten Speichern gesetzt.
- **Projekte-Rolle:** sieht statt dieses Formulars „Bestellung anfragen“ (Positionen auswählen → PH Aufgabe an Sortiment). Bestehende API `ph_sortiment.api.bestellungen_sammeln` bleibt für Projekte → Sortiment (je Lieferant ein Entwurf, idempotent je `bezug_zeile`).

### 3.8 `/sortiment/wareneingang` – Wareneingänge (T2)

Spalten: `name`, `herstellerbestellung`, `lieferant`, `kommission`, `datum`, Status (§2: nichts erhalten grau · teilweise orange · vollständig grün · Reklamation rot), Mengen (Text „weniger als erwartet“ / „mehr als erwartet“ aus `unterlieferung`/`ueberlieferung`), `lieferschein_nr_lieferant`, `erfasst_von`, Fotos-Zähler. Ansichten: „Heute“, „Reklamation offen“, „Mehrmenge offen“. Kopfband „Erwartet diese Woche“ (Bestellungen AB bestätigt/Teilweise geliefert mit Termin ≤ heute + 7, je Zeile „Eingang buchen“); leer → Band entfällt. „+ Wareneingang“ = Assistent S3 (§5.8), auch im Packtisch-Kiosk.

Gebuchte Eingänge sind nicht löschbar (`on_trash`). Korrektur: bis AS14-K („Korrektur-Wareneingang“ mit negativer Menge, nur Leitung) zeigt die Akte „Fehler gemeldet? Korrektur anfragen“ (PH Aufgabe an Leitung mit Positionen und Grund).

### 3.9 `/sortiment/freigaben` – Freigabe-Schreibtisch

Hier wird über Außenwirkung entschieden: Bilder (Produkt und Marke), Preise, Lieferzeiten.

```
┌ Freigaben                     Bilder n · Preise n · Lieferzeiten n                                   ┐
├ MARKEN ─────────────────────────┬─────────────────────────────────────────────────────────────────────┤
│ Bora      Freigegeben       n   │ Bora · Bildfreigabe schriftlich erteilt am 12.03.2026 · Beleg →      │
│ Gaggenau  Freigabe offen    n   │ Umfang: Website, Social · gültig bis –                               │
│ Baobab    Abgelehnt         n   │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │
│ Ezarri    Freigabe offen    n   │ │ [▣]  ◷ │ │ [▣]  ◷ │ │ [▣] ☑◷ │ │ [▣] ☑◷ │ │ [▣]  ◷ │  168 px       │
│ …                               │ │X Pure  │ │X Pure  │ │S Pure  │ │S Pure  │ │Classic │              │
│                                 │ │Freist. │ │Ambiente│ │Freist. │ │Detail  │ │Freist. │              │
│                                 │ │bora.com│ │bora.com│ │bora.com│ │bora.com│ │bora.com│              │
├─────────────────────────────────┴─────────────────────────────────────────────────────────────────────┤
│ 2 markiert · Gilt mit Bildfreigabe Bora vom 12.03.2026 (Beleg →)          [Ablehnen 3] [Freigeben 1] · Esc │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
Fuß ohne Markenbeleg:
│ 2 markiert · Gaggenau hat keine Bildfreigabe – Beleg für diese Bilder: [Beleg hochladen]  [Freigeben] (gesperrt) │
```

- **Quelle Bilder:** `PH Produkt Bild` mit `freigabe != erteilt` (Produkte mit `bilder_offen > 0`) und `PH Marke Bild` mit `freigabe != erteilt`; links gruppiert nach Marke mit Bildfreigabe-Status als Text. Bis AS11-M (`offene_bildfreigaben(marke)`) lädt die UI je Marke höchstens 50 Produkte nach (getDoc je Produkt, parallel 6) und zeigt „weitere laden“.
- **Regel:** „Freigeben“ nur, wenn (a) die Marke `bildfreigabe_status = schriftlich erteilt` hat und der Umfang „Website“ enthält, **oder** (b) für die Auswahl ein eigener Beleg hochgeladen wird. Eine Quelle-URL allein ist kein Nutzungsrecht und genügt nicht. Die App prüft das heute nicht (AS4: `freigabe` permlevel 1, Markenprüfung in `bilder_auswerten`).
- **Schreiben:** verzögerter Commit 8 s (§7). Danach je Produkt `speichernDokumentAction` mit den geänderten Bildzeilen (`freigabe`, `freigabe_datum` = heute, `freigabe_beleg` = Markenbeleg oder hochgeladener Beleg), bei vielen Produkten über `massenaktionAction` mit Fortschritt. Sammelmethode `bilder_freigeben(produkte, beleg)` fehlt (AS11-M).
- **Ablehnen** (`3`): öffnet ein kleines Feld „Grund“ (Pflicht, Vorschläge: „kein Nutzungsrecht“, „schlechte Qualität“, „falsches Produkt“) → `freigabe = abgelehnt`, Grund als Kommentar.
- **Tab Preise:** `PH Produkt Preis` mit `freigegeben = 0`, je Zeile Produkt, Preisart, Betrag, Stand, Quelle (Link), erfasst von. Bei Aktionspreis zusätzlich „Bezugspreis 30 Tage: …“ (§15.1). „Freigeben“ setzt `freigegeben = 1` (Server setzt `freigegeben_von/am`; verzögerter Commit).
- **Tab Lieferzeiten:** Produkte mit `lieferzeit_wochen_von` und `lieferzeit_freigegeben = 0`, je Zeile „6–8 Wochen ab Bestellung“ (Bezugspunkt `lieferzeit_ab`, nach AS7). „Freigeben“ setzt `lieferzeit_freigegeben = 1`, `lieferzeit_freigabe_datum` = heute, `lieferzeit_freigabe_durch` = angemeldete Person (heute `Data`, nach AS7 Link User, serverseitig gesetzt).
- **Marketing-Download:** Filter „Umfang Social/Druck“ zeigt nur Bilder von Marken mit passendem Umfang (`bildfreigabe_umfang`, AS10-B). Bis dahin ist der Download für Marketing gesperrt mit Text „Umfang der Bildfreigabe ist nicht erfasst – Leitung fragen“.
- **Team-Ansicht:** Band „Nur ansehen – Freigeben darf die Leitung · Leitung bitten“. Knöpfe deaktiviert, Grund als Text.
- **Kürzel** (nur bei Fokus im Raster, `role="grid"`): Pfeile Kachel · `x` markieren · `Leertaste` Lightbox · `1` Freigeben · `3` Ablehnen · `Shift+Q` Quelle öffnen · `Alt+↑/↓` vorige/nächste Marke · `Enter` Lightbox. `Backspace` hat keine Wirkung.
- **Fokus nach Entscheidung:** nächste Kachel derselben Marke → erste Kachel der nächsten Marke → Leerzustand (WCAG 2.4.3).
- **Bewegung:** §9 (Rand 120 ms → Opazität 100 ms → Nachbarn FLIP 200 ms).

### 3.10 `/sortiment/preislisten` – Preislisten-Läufe (T2)

Spalten: `name` (PH-PLI-…), `titel`, `marke`, `lieferant`, `stand`, Preisart, Preisbasis (nach AS5), Status (§2), `zeilen_anzahl`, `zeilen_auffaellig` („n über Schwelle“), `zeilen_ohne_produkt`, `uebernommen_von/am`. „+ Preisliste“ startet A11. Löschen nur bei Eingelesen/Verworfen ohne Übernahme; sonst kein Menüpunkt (AS13).

### 3.11 `/sortiment/kategorien`, `/sortiment/merkmale` (T9)

- **Kategorien:** links Baum (`uebergeordnet`, `sortierung`). Verschieben per Ziehen **oder** Menü „Verschieben nach … (Elternkategorie)“, „Nach oben / Nach unten“ (`⌘⇧↑/↓` bei Fokus), Undo 8 s. Rechts Formular: `key`* („Web-Adresse“; nach Anlage nur Leitung änderbar, Bestätigung „Ändert die Website-Adressen von n Produkten“), `label_de`* … `label_it`, `status`, `welt`, `bereiche`, `website_sichtbar`, `bild` + `alt_*`, **USt-Satz** (Auswahl mit Klartext §2; heute `normal|ermaessigt`, nach AS8 `20|13|10|0`), `grundpreis_pflicht` („Grundpreis je kg/l/m nötig – z. B. Kerzen, Düfte, Pflegemittel“), `zerbrechlich_standard`, `pakettyp_standard`, „Nach Kundenwunsch gefertigt“ als Vorgabe (nach AS12), `produkte_anzahl` (lesend). Fehler „Web-Adresse gibt es schon“ inline.
- **Merkmale:** Tabelle gruppiert nach `gruppe` (Farbe, Material, Oberfläche, Stoff, Leder, Holz, Duftfamilie, Sonstige), Farbfeld aus `farbe_hex`, `bild`, `code`, `key`, `marke`, Labels je Sprache; Inline-Bearbeitung (02 §4.1).

### 3.12 `/sortiment/import` – Katalog-Import (T6, Leitung/Admin)

Datei (`ph-katalog.json`) hochladen → Option „nur Marke“ → **Probelauf** `importieren_aus_anhang(file_url, trockenlauf=1, nur_marke)` → Protokoll mit vier Zählern (neu / aktualisiert / übersprungen / Fehler), Listen aufklappbar, CSV → „Jetzt importieren“ (`trockenlauf=0`), nur aktiv nach einem Probelauf derselben Datei in dieser Sitzung. Hinweis: Produkte entstehen als Entwurf; Freigaben und Preisgeschichte bleiben bei Wiederholung erhalten. Bildfreigaben laufen nie über den Import, nur über den Freigabe-Schreibtisch mit Beleg. Fortschritt als unbestimmter Balken; Abbruch nicht möglich (Hinweis vor dem Start).

### 3.13 `/sortiment/berichte` (T8)

Startseite „Berichte“: Karten mit den 4 Charts (§11.3) und Links zu den Berichten.

| Route | Report | Filter (aus Report-JS) | Zusatz in der UI |
|---|---|---|---|
| `preisstand` | PH Preisstand aelter als 3 Monate | `monate` (3), `marke`, `nur_aktiv` (1) | Zeilenknopf „Preis bestätigen“; Massenaktion „Preise nacheinander erfassen“ |
| `ohne-bildfreigabe` | PH Produkte ohne Bildfreigabe | `marke`, `status` | Sprung in Freigaben je Marke, Spalte Grund |
| `bestellungen-offen` | PH Lieferantenbestellungen offen | `lieferant` | Zeilenknopf „AB nachfragen …“ (`ab_nachfragen`) |
| `ab-abweichungen` | PH AB Abweichungen | `von` (−6 Monate), `bis`, `lieferant`, `feld`, `bewertung` | Klären direkt im Bericht (Segment §4.3) |
| `claims` | PH Claims-Pruefung | `nur_befunde` (1) | Ampel als Badge mit Text; Zeile → Marke Tab Händlerstatus |
| `liefertermintreue` | PH Liefertermintreue je Lieferant | `von` (−12 Monate), `bis`, `lieferant` | Chart Ø Verspätung + AB mit Abweichung % |
| `preise-laufen-ab` | PH Preise laufen ab (AS14) | `tage` (30), `marke` | erscheint erst mit AS14 |
| `wareneingaenge-ohne-rechnung` | PH Wareneingaenge ohne Eingangsrechnung (AS15) | Stichtag | Wert nur Leitung; erscheint erst mit AS15 |

Export je Bericht: CSV (`exportCsvAction`). PDF eines Berichts fehlt im Fundament (F-Anfrage §20.7).

### 3.14 `/sortiment/einstellungen` (T9, Leitung; Team lesend)

Gruppen aus PH Sortiment Einstellungen, je Feld eine Erklärzeile, Standardwerte aus `STANDARD`:
- **Website:** automatische Aktualisierung (`website_revalidate_aktiv`, 1), Mindestabstand in Sekunden (`revalidate_drossel_sekunden`, 60), Website-Adresse (`website_basis_url`), Zwischenspeicher in Sekunden (`api_cache_sekunden`, 3600), maximale Bildgröße (`bild_max_px`, 1600).
- **Rechtliches:** Händlerwort-Prüfung (`claim_guard_aktiv`, 1; Ausschalten nur mit Bestätigung „Produkt- und Markentexte werden dann nicht mehr auf Händlerwörter geprüft“). Kommission auf Herstellerbelegen (`kommission_format`, AS21: Auftragsnummer / Kürzel / Kundenname; Standard Auftragsnummer).
- **Preise:** Anzeigedauer Verkaufspreis Monate (3), UVP Monate (6), Prüfschwelle Preisliste % (15).
- **Lieferzeit:** Standardtexte de–it.
- **Einkauf:** Toleranz Preis % (0), Toleranz Termin Tage (0), Bestell-E-Mail-Vorlage, Standard-Lieferadresse, Druckformat Bestellung.
- **Status (lesend):** „Preisstand zuletzt geprüft: heute 05:10“ (AS11-T, `preisstand_letzter_lauf`; bis dahin entfällt die Zeile).

Hinweis neben „Speichern“: „Wirkt spätestens nach 10 Minuten“ (Cache 600 s, wird beim Speichern geleert).

---

## 4. Akten (Detailansichten, T5)

Gemeinsamer Aufbau (05 §5): **Kopf einzeilig 56 px** (Bild/Logo 40 px, Titel, höchstens 2 Badges, **genau ein Primärknopf** rechts, `⋯ Mehr`), darunter höchstens ein Hinweisband (Text + **Text-Link**, nie ein zweiter Primärknopf), Tabs (≤ 5, `Alt+1…5`, URL `?tab=`), rechte Spalte 320 px ab 1280 px; darunter rutscht sie unter den ersten Abschnitt. **Zeitleiste** (03 §8.16): Feldänderungen, Statuswechsel mit Person, Kommentare inkl. der `add_comment("Info")`-Einträge der Methoden, gesendete Mails mit Empfänger, Anhänge. Neue Einträge 160 ms `--bo-ease-out`. Die Bestellakte aktualisiert sich live über `notify_update`. Jede Aktion hat überall dieselbe Bezeichnung. Symbole in Wireframes stehen für lucide-Icons (03 §5), immer mit Text daneben; kein Emoji.

### 4.1 Produktakte `/sortiment/produkte/[slug]`

```
┌ Sortiment › Produkte › Bora X Pure                                                                     ┐
│ [▣] Bora X Pure   Veröffentlicht · Im Shop                                [Preis bestätigen ⇧P]  ⋯ Mehr │
├ ⚠ Preis veraltet seit 12.10. – die Website zeigt keinen Preis.  Preis erfassen →                         ┤
│ Produkt · Preise · Ausführungen 12 · Texte & SEO · Verlauf                                              │
├──────────────────────────────────────────────────────────────┬──────────────────────────────────────────┤
│ BILDER                                        [+ Bilder]      │ STATUS & WEBSITE                         │
│ ┌────┐ ┌────┐ ┌────┐ ┌ ─ ┐                                    │ ✓ Marke aktiv · Vertragshändler          │
│ │[▣]✓│ │[▣]✓│ │[▣]◷│   +   ◷ = Freigabe offen                 │ ✓ Kategorie · USt 20 %                   │
│ └────┘ └────┘ └────┘ └ ─ ┘ Reihenfolge: Menü oder ⌘⇧←/→        │ ✓ 2 Bilder freigegeben · 1 offen         │
│ Quelle für alle neuen Bilder [https://bora.com/…      ]       │ ✕ Preis veraltet → Preis bestätigen      │
│ PREIS                                                         │ ✓ Deutscher Text · en fr it fehlen       │
│ ab 2.890,00 € · Unverbindliche Preisempfehlung · Stand 12.04. │ ○ Lieferzeit nicht freigegeben           │
│ veraltet seit 12.10.   [Preis erfassen]  Verlauf → Tab Preise │ ○ 2 Bilder ohne Bildbeschreibung         │
│ LIEFERZEIT & SHOP                                             │ Website: aktualisiert vor 2 Min.         │
│ 6–8 Wochen ab Bestellung · nicht freigegeben [Freigeben]      │ Vorschau ▾ de en fr it                   │
│ Im Shop ja · Reservierung nein · Nach Kundenwunsch nein       ├──────────────────────────────────────────┤
│ STAMMDATEN (inline)                                           │ ZUORDNUNG                                │
│ Art.-Nr. · EAN · Collection · Serie · Designer · Herst.-Seite │ Marke Bora → · Kategorie · Welt · Typ    │
│ Maße · Gewicht · Versandmaße · Pakettyp · zerbrechlich        │ VERKNÜPFUNGEN                            │
│                                                               │ Anfragen 4 → · Angebote/Aufträge 2 →     │
│                                                               │ Bestellungen 1 → · Wareneingänge 1 →     │
│                                                               │ Kassa 3 Stk · Shop 0 · Projekte 1 →      │
│                                                               │ Servicefälle 0 · Retouren (30 T.) 0      │
└──────────────────────────────────────────────────────────────┴──────────────────────────────────────────┘
```

**Kopf:** `bild_hauptbild`, `titel`, Status-Badge + ein Zusatz-Badge (Im Shop / Ausgeblendet / Abverkauf / Preis veraltet), Primärknopf, `⋯ Mehr`. Preis, Web-Adresse und Vorschau stehen im Inhalt, nicht im Kopf.

**Primäraktion je Zustand (genau eine):**

| Zustand | Primär | Team ohne Recht |
|---|---|---|
| Entwurf | Zur Veröffentlichung geben (gesperrt mit Liste „Fehlt: Kategorie / Marke / deutscher Text“) | – |
| Wartet auf Veröffentlichung | Veröffentlichen … (Leitung, Dialog §5.1) | „Leitung bitten“ |
| Veröffentlicht, Preis veraltet oder läuft in ≤ 30 Tagen ab | Preis bestätigen | – |
| Veröffentlicht | Website-Vorschau | – |
| Pausiert | Wieder veröffentlichen (Leitung) | „Leitung bitten“ |
| Ausgelaufen | keine | – |

**`⋯ Mehr`:** Preis erfassen · Ausführungen anlegen · Website jetzt aktualisieren · Website-Vorschau ▸ de/en/fr/it · Duplizieren · Als Ausstellungsstück anlegen … · Datenblatt drucken · In Bestellung übernehmen · Statuswechsel (erlaubte Übergänge, §5.1) · Systemdaten (Leitung) · Löschen (nur Entwurf ohne Preisgeschichte und ohne Verwendung, AS13).

**„Status & Website“ (Checkliste)** spiegelt `pruefe_veroeffentlichung` (Kategorie, Marke aktiv, freigegebenes Bild, deutscher Text), den Website-Filter (Veröffentlicht, nicht ausgeblendet) und die Regeln für Preis und Lieferzeit. Zusätzlich:
- „USt-Satz fehlt“ – Blocker für Veröffentlichen (E10; UI-Prüfung, serverseitig mit AS8).
- „Grundpreis fehlt“ – Blocker, wenn die Kategorie `grundpreis_pflicht = 1` hat und `grundpreis_einheit`/`grundpreis_menge` leer sind (serverseitig mit AS6).
- „Ohne Bildbeschreibung“ – Hinweis, kein Blocker.
- „Im Shop ohne gültigen Preis“ / „Im Shop ohne freigegebene Lieferzeit“ – Hinweis; der Shop zeigt den Artikel dann nicht.

Jeder Punkt springt in den Abschnitt bzw. Tab. Die Website-Zeile zeigt das letzte Ergebnis von `website_aktualisieren` (Texte §2).

| Tab | Inhalt (Felder) | Aktionen | Leer / Fehler |
|---|---|---|---|
| **Produkt** | **Bilder** (`bilder`: Bildzustand Icon + Text, `typ`, `ausfuehrung`, `breite×hoehe`, `quelle_url`, `abgerufen`, `alt_*`; `dokumente`; `modell_3d`) · **Preis** (aktueller Preis, Preisart im Klartext, Stand, „läuft ab“/„veraltet“) · **Lieferzeit & Shop** (`lieferzeit_wochen_von/bis`, `lieferzeit_ab` (AS7), `sofort_lieferbar`, `lagerartikel`, Freigabe mit Datum und Person, `lieferzeit_text_*`; `verkauf_online`, `reservierung_online`, `ust_klasse`, `grundpreis_einheit/menge` + berechneter Grundpreis (AS6), `kundenspezifisch` (AS12, Erklärtext „Nach Kundenwunsch gefertigt: kein Rücktrittsrecht im Fernabsatz (FAGG § 18) – der Shop zeigt den Hinweis vor der Bestellung“), `gewicht_g`, `versand_*_cm`, `pakettyp`, `zerbrechlich`, `gefahrgut_pruefen`, `versand_gesperrt_grund`, Paketprofil) · **Ausstellungsstück** (nur `typ = Ausstellungsstueck`: `abverkauf`, `abverkauf_preis_cent`, `abverkauf_seit`, `zustand_text` (AS12, Pflicht bei Abverkauf), Fotos) · **Stammdaten** inline (`hersteller_artikelnr`, `ean`, `collection`, `serie`, `designer`, `hersteller_url`, `ausgewaehlt`, `stand`, `masse`); rechts Status & Website, Zuordnung (`marke`, `kategorie`, `kategorien_weitere`, `welt`, `typ`, `bereich`), Verknüpfungen | Bilder ablegen (Dropzone; `⌘V`; Ziehen aus dem Browser liest `text/uri-list` → `quelle_url`, `abgerufen` = heute; Feld „Quelle für alle neuen Bilder“); je Bild Menü „Als Hauptbild“ · „Nach vorn“ · „Nach hinten“ · „Entfernen“ (je Undo 8 s), Tastatur `⌘⇧←/→`; Inline-Edit (Enter speichert, Esc verwirft, Undo-Toast); „Lieferzeit freigeben“ (Leitung) | „Noch kein Bild. Ohne freigegebenes Bild kann das Produkt nicht veröffentlicht werden.“; Upload-Fehler je Kachel (§8.2) |
| **Preise** | **Verkauf (mit Stand):** aktueller Preis groß; Stufenlinie Brutto über `ab` je Preisart, Band bis `gueltig_bis`, Linie „heute“ (mit Tabellen-Umschalter); Tabelle `preise` (`ab`, `brutto_cent`, Preisart, `ausfuehrung`/`variante_name`, `sku`, `stand`, `gueltig_bis`, `quelle`, `quelle_url`, `beleg`, Land der Empfehlung (AS5), Freigabe mit Person/Datum, `zusatz_de`); Zeile „Bezugspreis für Rabattangaben (niedrigster der letzten 30 Tage)“ (AS24). **Einkauf (nur Leitung):** `einkaufspreise` (`lieferant`, `listen_cent`, `rabatt_promille`, `rabatt2_promille`, `netto_ek_cent`, `waehrung`, `ab`, `bis`, `quelle`, `preisliste`, `ausfuehrung`, `hinweis`) + EK-Linie neben VK; `einkaufspreis_cent`. **Preismatrix** (nur wenn `variantenpreise` vorhanden): `kombination` lesbar („Bezug PG3 · Breite 200“), `vk_cent`, `ek_cent` (Leitung), `ab`, `bis`, `hinweis` | Preis erfassen · Preis bestätigen · Freigeben (Leitung) · VK aus EK vorschlagen (Leitung; `vk_vorschlag(anlegen=1)` legt einen **nicht freigegebenen** Preis mit Quelle „Eigen“ an) | „Kein Preis. Auf der Website steht ‚Preis auf Anfrage‘.“ Band bis AS2: „Matrixpreise haben noch keinen Stand und keine Freigabe, die Website zeigt sie trotzdem – nur nach Rücksprache mit der Leitung pflegen.“ Matrix bis dahin nur lesend |
| **Ausführungen** | Gruppen `ausfuehrungen` (`gruppe_key`, `gruppe_de…it`, `pflicht`, `reihenfolge`); darin PH Produkt Ausfuehrung (`farbe_hex`/`bild`, `name_de…it`, `code`, `standard` (Stern + Text), `status`, `sku`, `ean`, `preisgruppe`, `nicht_kombinierbar_mit`, `kundenspezifisch` (AS12), `gewicht_g`, `zerbrechlich`, Preis mit Stand je Ausführung aus `preise`; `aufpreis_cent`/`preis_cent`/`ek_aufpreis_cent` grau als „Kalkulationshilfe – nicht für die Website“); `zubehoer`, `verwandt` | Gruppe hinzufügen · Option anlegen (`ausfuehrung_anlegen`) · Ausführungen anlegen (S2) · Standard setzen (Undo; der Server setzt die anderen der Gruppe auf 0) · Inaktiv setzen (Undo) · Konfiguration prüfen (`variante_berechnen(auswahl)` → Preis und „nicht kombinierbar mit …“) | „Keine Ausführungen – das Produkt wird ohne Auswahl angezeigt.“ |
| **Texte & SEO** | Sprachspalten (≥ 1440 px nebeneinander, sonst Umschalter de/en/fr/it): `kurz_*`, `beschreibung_*`, `seo_title_*` (Zähler 60), `seo_description_*` (Zähler 160); `merkmale` (Text je Sprache + PH Merkmal), `quellen` | Händlerwort-Prüfung live: Fundstelle gelb unterstrichen + Text unter dem Feld „Händlerwörter gehören nicht in Produktdaten“ bzw. „Kein Preis im Kurztext“ (Regel `DEALER_WORDS`/`PRICE_WORDS` aus `ph_produkt.py`); Filter „fehlende Sprachen“ | Leere Übersetzung zeigt DE grau als Platzhalter; über dem Limit „12 Zeichen zu lang“ (`warning-text`, `aria-describedby`); Serverfehler der Händlerwort-Prüfung als Text am Feld |
| **Verlauf** | Zeitleiste, Kommentare | Kommentar (`c`) | „Noch keine Änderungen.“ |

**Verknüpfungen (rechte Spalte):** Zähler je Ziel, Klick öffnet die gefilterte Liste im Zielbereich. Quellen: `PH Anfrage Produkt.ph_sortiment_produkt`, `PH Beleg Position`, `PH Kassenbeleg Position` (Stück, ohne Umsatz für das Team), `PH Bestellung Position`, Bestell- und Wareneingangspositionen, `PH Lagerbestand`, `PH Planung Position`/`PH Projekt Position`/`PH Produktpass`, `PH Servicefall`/`PH Ersatzteil`, Retouren (Logistik/Shop). Ein Block entfällt, wenn die Ziel-App oder das Leserecht fehlt. Bis AS11-M (`produkt_verwendung`) laufen bis zu 11 `count`-Abfragen parallel, je Block ein eigener `<Suspense>`; ein Fehler zeigt „–“ mit Tooltip „nicht geladen“.

**Sheet „Preis erfassen“** (480 px; Öffnen 200 ms `--bo-ease-out`, Schließen 120 ms `--bo-ease-in`; Smartphone Vollbild, `inputmode="decimal"`, natives Datumsfeld):

| Sichtbar | Feld | Regel |
|---|---|---|
| immer | Brutto* (€, speichert Cent) | > 0 |
| immer | Preisart* | Vorbelegung aus der letzten Zeile; Verkaufspreis / UVP / Herstellerpreis / Aktionspreis |
| immer | Stand* (heute) | nicht in der Zukunft |
| immer | Quelle* + Quelle-URL | URL Pflicht bei Herstellershop/Herstellerliste, nicht bei Inhaber-Preisliste/Eigen („Quelle (URL) fehlt – nie schätzen“); nicht erreichbare Adresse nur Hinweis |
| bei UVP | Land der Empfehlung* (AT/DE/CH, AS5) | nur AT wird als UVP angezeigt. DE/CH → Hinweis „Nur österreichische Herstellerempfehlungen dürfen als UVP erscheinen“ und Speichern als Herstellerpreis (intern). Bis AS5 steht das Land in `zusatz_de` |
| bei Aktionspreis | Live-Zeile „Bezugspreis für die Rabattangabe: 2.890,00 € (niedrigster seit 05.10.)“ | ohne 30 Tage Preisgeschichte Warnung „Ermäßigung nicht bewerbbar – kein Vergleichspreis der letzten 30 Tage“ (PrAG § 9a). Bis AS24 rechnet die UI aus `preise` (freigegeben, gleiche Ausführung, Verkaufspreis/Aktionspreis, `ab` in [heute−30, heute]) |
| „Weitere Angaben ▾“ | gilt ab (heute), Ausführung (nur dieses Produkt), Variante, Beleg, Zusatztext | doppelter Eintrag (gleiches `ab`, Preisart, Ausführung, Variante) wird vor dem Senden markiert |
| nur Leitung | Freigeben (Haken, Standard an) | Team: Haken nicht sichtbar, Text „Freigabe: Leitung“ (E5) |

- Live-Zeile: „Wird angezeigt bis 04.02.2027 (3 Monate, Verkaufspreis)“ (Logik `gueltig_bis`, Monatsende gekappt).
- Server: `preis_hinzufuegen(brutto_cent, stand, preisart, quelle, quelle_url, ab, ausfuehrung, variante_name, freigegeben)`. **Das Team sendet immer `freigegeben=0`**, weil der Server-Standard heute `1` ist (AS3). Mit Beleg oder Zusatztext: `speichernDokumentAction` (neue Zeile in `preise`), bis `preis_hinzufuegen` die Parameter kennt (AS3).
- Toast: „Preis gespeichert · ab 2.890,00 € · Website folgt“ (Leitung, freigegeben; verzögerter Commit 8 s) bzw. „Preis gespeichert · wartet auf Freigabe der Leitung“ (Team; sofort, Undo entfernt die Zeile).

**Sheet „Preis bestätigen“:** zeigt den letzten Preis; Stand = heute; Quelle und URL aus der letzten Zeile (änderbar); Speichern → `preis_hinzufuegen` mit altem Betrag und neuem Stand. Freigabe wie oben (E5).

**Dialog „Als Ausstellungsstück anlegen“:** Zustand* (`zustand_text`, z. B. „leichte Gebrauchsspuren an der Armlehne“), Fotos (optional), Abverkauf ja/nein + Preis. Text: „Der Zustand steht später auf Kassenbon und Rechnung (Gewährleistung).“ → `ausstellungsstueck_anlegen()` (Kopie mit `typ = Ausstellungsstueck`, `lagerartikel = 1`, `verkauf_online = 0`), danach Save mit Zustand (Feld AS12; bis dahin als `kurz_de`-Zusatz „Ausstellungsstück: …“ und Kommentar). Hinweis „Bestand in Logistik anlegen“ mit Link. Rückläufer aus einer Kundenretoure nutzen denselben Dialog („Als B-Ware anlegen“). Ein Abverkaufspreis wird nur mit 30-Tage-Bezugspreis beworben (§15.1).

### 4.2 Markenakte `/sortiment/marken/[marke]`

Kopf: Logo, `marke`, Status-Badge, Händlerstatus-Badge, Primärknopf. Ein Hinweisband (Priorität von oben): „Händlervertrag abgelaufen – Händlersätze sind ausgeblendet.“ (rot) · „Händlervertrag läuft am … aus.“ (rot, < 60 Tage) · „Kein belegter Händlerstatus – die Website darf keinen Händlersatz zeigen.“ (orange).

Primär: ohne Lieferant „Lieferant anlegen“ · Bildfreigabe offen „Bildfreigabe anfordern …“ · sonst „Neue Bestellung“.

| Tab | Felder | Aktionen |
|---|---|---|
| **Marke** | `marke`, `slug` (Web-Adresse), `status`, `welt`, `sortierung`, `logo`, `website`, `land`, `gruendungsjahr` (1500–2100), `stand`; Texte `kurz_*`, `story_*`, `produkte_text_*`; Abschnitt **Website**: `website_sichtbar`, `es_gibt_produkte`, `produkte_anzahl`, `preise_pausiert_grund`, `querverweise` | Inline; Händlerwort-Prüfung live (`HAENDLER_RE`: Händlerwörter nur bei Händler/Vertragshändler/Exklusiv/Partner); Vorschau Markenseite (Pfad clientseitig aus `website_basis_url` + Web-Adresse; Methode fehlt, AS28) |
| **Händlerstatus & Claims** | `haendlerstatus`*, `haendler_wortlaut` (nur bei Status mit Händlerrecht), `haendler_beleg_url`, `haendler_geprueft_am`, `haendlervertrag` (Leitung), `vertrag_gueltig_von/bis`, `haendler_notiz`, `claims_erlaubt` (`claim_text`, `sprache`, `wortlaut`, `freigegeben_von/am`, `quelle`, `beleg`) | „Händlerstatus prüfen“ (`produkte_ohne_freigabe` → Sheet mit Status, Bildfreigabe, Produkten ohne Bild); Belegpflicht vor dem Speichern sichtbar („Ohne Vertrag, Beleg-Adresse oder Notiz lässt sich dieser Status nicht speichern“) |
| **Bilder** | Bildfreigabe der Marke: Status (nicht direkt editierbar), Beleg, Datum, Umfang + gültig bis (AS10-B); `bild_anhagen`; `bilder` (`typ`, `alt_*`, `quelle_url`, `abgerufen`, Bildzustand, `freigabe_datum`, `freigabe_beleg`, `reihenfolge`) | „Bildfreigabe anfordern …“ (Dialog Empfänger/Nachricht + Haken „In 14 Tagen nachfassen“) · „Freigabe erhalten …“ (S4, einziger Weg zum Status „schriftlich erteilt“) · Reihenfolge per Menü/Tastatur |
| **Produkte** | eingebettete Liste `marke = <name>` (kompakt, Massenaktionen wie §3.2) | „+ Produkt“ (Marke vorbelegt) |
| **Einkauf** | Lieferant und Bestellung (`lieferant`, `bestellweg`, `bestell_email`, `kundennummer_bei_lieferant`, `lieferzeit_wochen_standard`, `preisart`, `ansprechpartner`); offene Bestellungen; Liefertermintreue; letzte Preislisten; Abschnitt **Kalkulation (nur Leitung)**: `kalkulationsfaktor_promille` (Anzeige „Faktor 2,10“), `vk_rundung`, `kalkulation_kategorien` (`kategorie`, `faktor_promille`, `rundung`) | Lieferant anlegen/öffnen · Neue Bestellung · Preisliste einlesen (A11, Marke vorbelegt) |

Die Zeitleiste der Marke steht in der rechten Spalte (≥ 1280 px), darunter unter `⋯ Mehr › Verlauf`; Systemdaten (`sync_quelle`, `import_stand`, `notizen` Leitung) unter `⋯ Mehr › Systemdaten`. So bleibt es bei 5 Tabs.

### 4.3 Bestellakte `/sortiment/bestellungen/[name]`

```
┌ Sortiment › Bestellungen › HB-2026-00038                                                              ┐
│ HB-2026-00038 · Bora GmbH   AB erhalten · 2 offen                            [Abweichungen klären] ⋯   │
│ Entwurf ✓ ─ Gesendet ✓ 20.10. ─ AB erhalten ● 24.10. ─ AB bestätigt ○ ─ Geliefert ○ ─ Abgeschlossen ○    │
│ aus Auftrag AB-2026-00112 → · Anzahlung Kunde 3.000 von 3.000 € eingegangen · Kommission AB-2026-00112  │
├ Positionen · Auftragsbestätigung 2 · Lieferung · Dokumente · Verlauf                                    ┤
│ ┌ AB-PDF 40 % ──────────┐ AB-7712 vom 24.10.2026                 Toleranz Preis 0 % · Termin 0 Tage     │
│ │                       │ Pos│ Bezeichnung      │ Feld  │ Bestellt   │ AB         │ Abweichung        │ Bewertung                          │
│ │                       │ 1  │ X Pure Edelstahl │ Termin│ 01.12.2026 │ 18.12.2026 │ +17 Tage          │ [ OK 1 | Rückfrage 2 | Ablehnen 3 ] │
│ │                       │ 3  │ Umluftfilter     │ Preis │ 189,00 €   │ 199,00 €   │ +10,00 € (+5,3 %) │ [ OK | ●Rückfrage | Ablehnen ]      │
│ │                       │    │ Rückfrage beim Hersteller · Lena · vor 2 Tagen · „Bitte Preis prüfen“                       │
│ └───────────────────────┘ 2 offen (Rückfrage zählt als offen)                                          │
│                           [Abgleich neu erzeugen] [Protokoll drucken]   [AB bestätigen] gesperrt: „2 offen“ │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Kopf:** Nummer, Lieferant, Status-Badge + Zusatz („n offen“ / „Storno angefragt“ / „Vorkasse offen“), Primärknopf. **Vorgangsleiste** (02 §3) mit Daten (`gesendet_am`, `ab_eingang`, `ab_geprueft_am`, `geliefert_am`). Darunter: Bezug-Chip „aus Auftrag … →“, Anzahlungsstand (AS1; bis dahin Link „Anzahlung im Auftrag ansehen →“), Kommission.

| Status | Primär | Gesperrt wenn (Text) |
|---|---|---|
| Entwurf, ohne Lieferant | Lieferant zuordnen (Vorschlag aus `PH Marke.lieferant`) | – |
| Entwurf | Senden … | „Keine Positionen“ · „Keine Bestell-E-Mail beim Lieferanten – Als gesendet markieren“ · „Anzahlung Kunde offen – Leitung“ · „Kurs fehlt“ |
| Gesendet | AB einlesen | – |
| AB erhalten, offene Abweichungen | Abweichungen klären (springt in den Tab, Fokus auf die erste offene Zeile) | – |
| AB erhalten, keine offen | AB bestätigen | Team bei vorhandenen Abweichungen: „Eine AB mit Abweichungen bestätigt die Leitung“ (Workflow-Bedingung `abweichungen_anzahl == 0` für das Team) |
| AB bestätigt / Teilweise geliefert | Wareneingang buchen (Kunde direkt: Lieferung beim Kunden bestätigen) | – |
| Geliefert | Abschließen | heute nur Hinweis „Keine sachlich geprüfte Eingangsrechnung“; mit AS25 gesperrt außer Leitung mit Grund („Rechnung folgt nicht – Kulanz/Muster“) |
| Abgeschlossen / Storniert | keine | – |

- **„AB bestätigen“** ist im Tab ein sekundärer Knopf und gesperrt, solange „Abweichungen klären“ primär ist. Ist der letzte offene Punkt geklärt, wird er primär (Farbwechsel 160 ms `--bo-ease-out`, kein Puls).
- **`⋯ Mehr` je Status:** AB nachfragen … (Gesendet; `ab_nachfragen(nachricht)` mit Mail-Vorschau; ohne Bestell-E-Mail gesperrt „Keine E-Mail – Portal öffnen / anrufen“) · Termin ändern … (`termin_aendern`) · Positionen ändern (ab Gesendet nur Leitung → Nachtrag §5.4) · Rest stornieren … (Teilweise geliefert, Leitung, §5.5) · Storno anfragen … (ab Gesendet, §5.3) · Stornieren (Entwurf: Team mit Undo; ab Gesendet nur nach bestätigtem Storno) · Für IWOfurn/pCon exportieren · Drucken · Löschen (nur Entwurf ohne `gesendet_am`, AS13).

| Tab | Inhalt | Aktionen |
|---|---|---|
| **Positionen** | wie §3.7; ab AB zusätzlich `ab_menge`, `ab_ek_cent` (Leitung), `bestaetigter_termin`, `ab_artikelnr`, `ab_ausfuehrung_text`, Abweichung als Text, Positionsstatus, `menge_erhalten`, `hinweis`, „nach Kundenwunsch“ (AS12) | je Position: Termin ändern, Rest stornieren (Leitung) |
| **Auftragsbestätigung** | volle Breite (rechte Spalte aus): AB-PDF links 40 %, Abgleich rechts 60 %; unter 1280 px Umschalter „PDF · Tabelle“. `ab_nummer`, `ab_datum`, `ab_eingang`, `ab_datei`; `ab_abgleich` (`position`, `bezeichnung`, `feld` Menge/Preis/Termin/Artikelnummer/Ausführung, `bestellt`, `bestaetigt`, `abweichung_text`, `bewertung`, `kommentar`, `klaerung`, `geklaert_am`, `geprueft_von/am`); `ab_hinweis`; `ab_geprueft_von/am` | Bewerten (Segment), Abgleich neu erzeugen (Rückfrage nur, wenn Bewertungen verloren gehen: „2 Bewertungen gehen verloren (geänderte Werte)“), Protokoll drucken, AB bestätigen |
| **Lieferung** | `lieferadresse`, `lieferadresse_text`, Lieferland (AS10), `wunschtermin`, `bestaetigter_termin`, `liefertermin_ist`, `geliefert_am`, Abweichung in Tagen; **Terminänderungen** (`terminaenderungen`: `geaendert_am`, `position`, `termin_alt → termin_neu`, `quelle` AB/Lieferant/Manuell, `grund`, `projekt_informiert`, `kunde_informiert`) als Zeitleiste; **Wareneingänge** dieser Bestellung | Termin ändern …; je Terminänderung Haken „Kunde informiert“ mit Kanal (Telefon/Brief/E-Mail/persönlich; Felder AS31, bis dahin Kanal als Kommentar) und „Projekt informiert“; Wareneingang buchen |
| **Dokumente** | Bestell-PDF (je Nachtrag), AB-Datei, Export-CSV mit `export_am`, Stornobeleg (AS18), Rücklieferscheine (AS20) | Herunterladen, Drucken |
| **Verlauf** | Zeitleiste | Kommentar |

**Bewerten** (Segment je Zeile, `role="radiogroup"`, Höhe ≥ 32 px, Tastenkappe im Segment): `1` OK · `2` Rückfrage · `3` Ablehnen (E3).
- **OK:** Feld Preis → `abweichung_klaeren(zeile, "akzeptieren")`, nur Leitung (Team: Segment bei Preiszeilen gesperrt, Text „Preisabweichungen akzeptiert die Leitung“). Andere Felder → `abweichung_bewerten(zeile, "ok")`. Preiszeile mit Bezug Auftrag zeigt der Leitung „Kundenpreis im Auftrag ist fest – Rohertrag sinkt um x %“ (`logik/kalkulation`).
- **Rückfrage:** Menü an der Zeile – „Beim Hersteller (E-Mail) …“ → Mail-Vorschau (Text aus `reklamation_text`) → Senden → `abweichung_klaeren(zeile, "lieferant_reklamieren", text)`; ohne Bestell-E-Mail gesperrt. „Beim Verkauf/Kunden“ → `abweichung_klaeren(zeile, "kunde_rueckfragen", text)` (ToDo an den Besteller). „Nur vermerken“ → `abweichung_bewerten(zeile, "pruefen", kommentar)`. Rückfrage zählt weiter als offen.
- **Ablehnen:** nur Leitung (Team: gesperrt, Text „nur Leitung“). Öffnet das Kommentarfeld der Zeile, Pflicht (UI; serverseitig AS22) → `abweichung_bewerten(zeile, "abgelehnt", kommentar)`.
- Fokus springt danach auf die nächste offene Zeile. Undo 8 s und `⌘Z` (Gegenaufruf mit altem Wert). Mails lassen sich nicht zurückholen, deshalb hat „Beim Hersteller“ eine Vorschau statt Undo.
- Zähler „n offen“ mit `aria-live="polite"`, direkter Wechsel ohne Herunterzählen.

**Positionen nach dem Senden:** für das Team gesperrt; die Leitung ändert über „Positionen ändern“ → Nachtrag (§5.4). Serverseitig fehlt die Sperre (`allow_edit` bis Geliefert, AS22).

### 4.4 Wareneingangsakte `/sortiment/wareneingang/[name]`

Kopf: Titel, Status-Badge, Bestellung-Chip, Lieferant, Kommission, erfasst von, Datum. Band und Primär je Zustand:
- **Reklamation:** „Reklamation nötig – Schaden melden. Die Fotos sind gesichert.“ Primär **„Schaden melden …“** → Dialog: Beschreibung (vorbefüllt aus allen Positionen ≠ in Ordnung), Haken „Regress gegen Lieferant anlegen“, Anzahl Fotos → `schaden_melden(beschreibung, regress)` (PH Servicefall mit Fotos, optional PH Lieferantenregress; ohne ph_service oder ohne Kunde bei Lagerware: ToDo + Kommentar, der Ergebnistext nennt den Grund). Danach Chips „Servicefall … →“, „Regress … →“. `reklamation_melden()` bleibt als „Nur Reklamation an Lieferant senden …“ im `⋯ Mehr` (Mail-Vorschau mit Empfänger).
- **Mehrmenge ohne Entscheidung:** „2 Stück mehr als bestellt – annehmen oder zurücksenden?“ Primär „Entscheiden …“ (§5.8; Feld fehlt, AS26 → bis dahin Kommentar + PH Aufgabe an Sortiment).
- **Falscher Artikel:** Primär „Rücksendung an Lieferant …“ (AS20; bis dahin „Rücksendung anfragen“ = PH Aufgabe an Sortiment mit Positionen und Foto).

Tabs: **Positionen** (`position`, `bezeichnung`, `menge_erwartet`, `menge_erhalten`, `differenz`, `mengen_abweichung` als Text, `zustand`, `foto`, `seriennummer`, `lagerort_text`/`ph_logistik_lagerort`, `hinweis`) · **Fotos** (`fotos`: `bild`, `hinweis`; Lightbox) · **Lieferung** (`lieferschein_nr_lieferant`, `spediteur`, `packstuecke`, `lagerort_text`, `reklamation_text`, `servicefall_hinweis`, `kontakt`, `projekt`, `servicefall_ref`, `regress_ref`) · **Verlauf**. Mengen sind nach dem Buchen schreibgeschützt (der Server verbucht nur in `after_insert`). `⋯ Mehr`: Protokoll drucken · Korrektur anfragen (bis AS14-K) · Nur Reklamation an Lieferant senden …

### 4.5 Lieferantenakte `/sortiment/lieferanten/[name]`

Kopf: `firmenname`, Status, Bestellweg als Text, Primär „Neue Bestellung“. Band „n offene Bestellungen · m mit offenen Abweichungen“ (`offene_bestellungen`). Drittland (z. B. CH): Band „Drittland: Einfuhr, Zoll und Einfuhrumsatzsteuer beachten“.

| Tab | Felder | Regeln |
|---|---|---|
| **Stammdaten** | `firmenname`, `marke`, `uid` (+ `uid_geprueft_am`, AS10), `strasse`, `plz`, `ort`, `land` (heute Text; die UI bietet eine ISO-Auswahl und schreibt den Code; Link Country mit AS10), `bestellweg`, `bestell_email`, `portal_url`, `kundennummer_bei_lieferant`, Kreditor `ph_faktura_kreditor_nr`; **Ansprechpartner** (`ansprechpartner`, `rolle`, `email`, `telefon`, `hinweis`; Mail/Telefon als Links) | E-Mail-Format; UID-Format je Land als Hinweis („ATU“ + 8 Ziffern, „DE“ + 9, „IT“ + 11) |
| **Konditionen** | `lieferzeit_wochen_standard`, `lieferzeiten` (je Marke/Kategorie), `betriebsurlaub` (`von`/`bis`), `ab_erwartet_tage`, `waehrung`, `zahlungsziel_tage`, `skonto_promille` (Anzeige „2,0 %“), `skonto_tage`, `incoterm`, `mindestbestellwert_cent`; Preislisten-Format (`preisliste_format`, `_trennzeichen`, `_kodierung`, `_mapping_json`); Abschnitt **Konditionen & Notizen** (`konditionen`, `notizen`, nur Leitung) | Werte ≥ 0, Skonto ≤ 100 ‰; Probe „Liefertermin berechnen“ (`liefertermin(marke, kategorie, bestelldatum)`) |
| **Bestellungen** | offene zuerst | Leer: „Noch keine Bestellung bei …“ + „Neue Bestellung“ |
| **Leistung** | Liefertermintreue (Report gefiltert), Eingangsrechnungen (ph_faktura, mit Skontofrist), Regressfälle (`PH Lieferantenregress`), reklamierte Wareneingänge 12 Monate | – |
| **Verlauf** | Zeitleiste | – |

`firmenname` ist heute zugleich die Kennung (`autoname field:firmenname`). Bis AS10 (Nummernkreis `LF-.#####`) ist das Feld für das Team gesperrt mit Text „Name ist zugleich die Kennung – Umfirmierung über die Leitung“. Lieferant auf „Inaktiv“ → Aufgabe „Ansprechpartner prüfen, nicht mehr benötigte Kontaktdaten löschen“ (DSGVO).

### 4.6 Preislisten-Lauf `/sortiment/preislisten/[name]`

Dauerhafte Seite für Schritt 3/4 von A11: Kopf (`titel`, Status, `marke`, `lieferant`, `stand`, Preisart, Preisbasis, `schwelle_prozent`), Band „n Zeilen über der Prüfschwelle (x %) – werden nur übernommen, wenn ‚übernehmen‘ gesetzt ist.“ Zeilentabelle wie A11 Schritt 3. Primär je Status: Eingelesen „Abgleichen“ · Abgeglichen „Übernehmen …“ (Leitung; Team „Zur Übernahme an Leitung“) · sonst keine. `⋯ Mehr`: Datei neu einlesen (Bestätigung „Zeilen werden ersetzt“) · Verwerfen (Bestätigung) · Löschen (nur Eingelesen/Verworfen ohne Übernahme).

### 4.7 Verknüpfungen zu anderen Bereichen

| Von | Nach | Feld / Weg | Darstellung |
|---|---|---|---|
| Produkt | CRM | `PH Anfrage Produkt.ph_sortiment_produkt` (doc_event `anfrage_produkt_verknuepfen`) | „Anfragen n“ |
| Produkt | Faktura | `PH Beleg Position` | Angebote/Aufträge/Rechnungen n |
| Produkt | Kassa / Shop | `PH Kassenbeleg Position`, `PH Bestellung Position` | Stück (ohne Umsatz für das Team) |
| Produkt | Kassa (Preis) | Kassa liest Preise ungecacht oder mit Versionsstempel `get_katalog_version` (RKSV: Preis zum Buchungszeitpunkt) | Abhängigkeit (§20.7) |
| Produkt | Logistik | `PH Lagerbestand`, `PH Lagerbewegung`, Paketprofil | Bestand je Lagerort |
| Produkt | Projekte | `PH Planung Position`, `PH Projekt Position`, `PH Produktpass` | „in n Projekten“ |
| Produkt | Service | `PH Servicefall`, `PH Ersatzteil` | Servicefälle n |
| Produkt | Logistik/Shop (Kundenretoure) | Kundenretoure, FAGG-Rücktritt, Umtausch gehören zu Logistik/Shop (`PH Wareneingang.herstellerbestellung` ist Pflicht) | „Retouren (30 Tage) n“; Rückläufer als B-Ware über „Als Ausstellungsstück anlegen“ |
| Bestellung | Faktura | `bezug_doctype/bezug_name` (Auftragsbestätigung mit `anzahlung_soll_cent`/`anzahlung_ist_cent`), `PH Eingangsrechnung.herstellerbestellung` | Anzahlungsstand im Kopf; „Eingangsrechnung sachlich geprüft“, mit AS25 „berechnet n von m Stück“ |
| Bestellung | Faktura (Kundenstorno) | doc_event aus Faktura-Storno (AS18) | Aufgabe „Storno beim Hersteller anfragen“ je verknüpfter Bestellung |
| Bestellung | Projekte | `bezug_doctype = PH Projekt`; API `bestellungen_sammeln`; Report `PH Liefertermine naechste 30 Tage` | Termin in der Auftragsmappe; Terminänderung → „Projekt informiert“ |
| Wareneingang | Logistik | doc_event `wareneingang_aktualisiert` → `PH Lagerbewegung` (idempotent) | „Bestand gebucht“ |
| Wareneingang | Service | `schaden_melden` → `PH Servicefall`, `PH Lieferantenregress` | Chips |
| Lieferant | Service / Faktura | `PH Lieferantenregress.lieferant`, `PH Servicefall.lieferant`, `PH Eingangsrechnung.lieferant` | offene Regresse, offene Rechnungen mit Skontofrist |

---

## 5. Workflows, Knöpfe, Massenaktionen, Assistenten

Darstellung aller Übergänge: genau ein Primärknopf je Zustand, weitere Übergänge im `⋯ Mehr`, nicht erlaubte Übergänge sichtbar, aber gesperrt mit Grund im Klartext (Tooltip am Desktop, Text darunter am iPad/Kiosk). Ausführung über `workflowAktionAction(doctype, name, aktion)`; der Server prüft Rolle und Bedingung erneut. Vorprüfung im Client mit `darfUebergang` (Fundament) + Nachbildung der Bedingung. Destruktive oder nach außen wirkende Übergänge mit Bestätigungsdialog (02 §6.2); alle übrigen mit Undo-Toast (§7).

### 5.1 PH Produkt (Workflow „PH Produkt“, setzt `status`)

| Von | Aktion (Wert) | Anzeige | Nach | Rolle | Bedingung (exakt) | Sperrtext | Undo / Rückfrage |
|---|---|---|---|---|---|---|---|
| PH Entwurf | Prüfen | Zur Veröffentlichung geben | PH Geprueft | Sortiment Mitarbeiter | `doc.kategorie and doc.marke and (doc.kurz_de or doc.beschreibung_de)` | „Fehlt: Kategorie / Marke / deutscher Text“ | Undo (Zurück auf Entwurf) |
| PH Geprueft | Veröffentlichen | Veröffentlichen … | PH Aktiv | Sortiment Leitung | `doc.bild_freigegeben == 1 and doc.kategorie and frappe.db.get_value('PH Marke', doc.marke, 'status') == 'Aktiv'` | „Fehlt: freigegebenes Bild / Marke nicht aktiv“ + UI-Blocker USt-Satz, Grundpreis, deutscher Text (`pruefe_veroeffentlichung`) | Dialog, danach verzögerter Commit 8 s |
| PH Geprueft | Zurück auf Entwurf | Zurück auf Entwurf | PH Entwurf | Sortiment Mitarbeiter | – | – | Undo |
| PH Aktiv | Pausieren | Pausieren | PH Pausiert | Sortiment Mitarbeiter | – | – | verzögerter Commit 8 s (Außenwirkung) |
| PH Aktiv | Auslaufen lassen | Auslaufen lassen … | PH Ausgelaufen | Sortiment Leitung | – | – | Dialog „Verschwindet von Website und Shop · offene Bestellungen n · offene Kundenaufträge m“; bei m > 0 gesperrt „In offenen Kundenaufträgen enthalten“ (Prüfung über Verknüpfungen, serverseitig AS11-M) |
| PH Pausiert | Reaktivieren | Wieder veröffentlichen | PH Aktiv | Sortiment Leitung | `doc.bild_freigegeben == 1` | „Kein freigegebenes Bild“ | verzögerter Commit 8 s |
| PH Pausiert | Auslaufen lassen | Auslaufen lassen … | PH Ausgelaufen | Sortiment Leitung | – | – | Dialog |
| PH Pausiert / PH Ausgelaufen | Zurück auf Entwurf | Zurück auf Entwurf | PH Entwurf | Sortiment Leitung | – | – | Undo |

**Dialog „Veröffentlichen“** (einzeln, Liste, Kanban-Drop): Titel „6 Produkte veröffentlichen?“; Liste „4 möglich · 2 gesperrt“ mit Grund je Zeile und Sprunglink; Hinweis „Website und Shop zeigen die Produkte nach etwa 10 Sekunden“. Knöpfe „Abbrechen“ / „4 veröffentlichen“. Danach Toast „4 Produkte veröffentlicht · Rückgängig“ (8 s Balken), erst nach Ablauf der Server-Aufruf (§7). Lehnt der Server trotz Vorprüfung ab: Toast `warning` „2 Produkte nicht veröffentlicht: Marke Gaggenau ist nicht aktiv“ mit Liste; die übrigen bleiben veröffentlicht.

### 5.2 PH Herstellerbestellung (Workflow „PH Herstellerbestellung“)

| Von | Aktion (Wert) | Anzeige | Nach | Rolle | Bedingung | UI |
|---|---|---|---|---|---|---|
| PH Entwurf | Senden | Senden … | PH Gesendet | Sortiment Mitarbeiter | `doc.positionen and doc.lieferant` | Senden-Dialog (unten). Andere Bestellwege: „Als gesendet markieren …“ = Workflow `Senden` + Pflichtfeld „Gesendet über“ (Portal/Fax/Telefon/persönlich) → Kommentar |
| PH Entwurf | Stornieren | Stornieren | PH Storniert | Sortiment Mitarbeiter | – | **Undo 8 s** (Entwurf ist intern), kein Dialog |
| PH Gesendet | AB erfassen | – | PH AB erhalten | Sortiment Mitarbeiter | `doc.ab_nummer` | nie direkt; A10 setzt den Status über `ab_einlesen` |
| PH Gesendet / AB erhalten / AB geprueft | Stornieren | Stornieren … | PH Storniert | Sortiment Leitung | – | erst nach „Storno bestätigt“ (§5.3); Dialog mit Grund* und Beleg; bis AS18 Haken „Hersteller hat Storno bestätigt“* + Beleg als Anhang |
| PH AB erhalten | AB freigeben | AB bestätigen | PH AB geprueft | Sortiment Mitarbeiter | `doc.abweichungen_anzahl == 0` | Team nur ohne jede Abweichung |
| PH AB erhalten | AB freigeben | AB bestätigen | PH AB geprueft | Sortiment Leitung | `doc.abweichungen_offen == 0` | Sperrtext „n Abweichungen offen“ |
| PH AB geprueft / PH Teilgeliefert | Teillieferung buchen / Lieferung buchen | – | PH Teilgeliefert / PH Geliefert | Sortiment Mitarbeiter | – | **nie als Knopf** (E8): der Status folgt aus dem Wareneingang (`lieferung_verbuchen`); Ausnahme Strecke §5.9 |
| PH Teilgeliefert | Rest stornieren (AS19) | Rest stornieren … | PH Geliefert | Sortiment Leitung | – | §5.5; erscheint erst mit AS19 |
| PH Geliefert | Abschließen | Abschließen | PH Abgeschlossen | Sortiment Mitarbeiter | `doc.abweichungen_offen == 0` | Primär; Rechnungsbedingung mit AS25 |
| PH Storniert | Zurück auf Entwurf | Zurück auf Entwurf | PH Entwurf | Sortiment Leitung | – | nur wenn nie gesendet (sonst neue Bestellung anlegen) |

**Senden-Dialog** (Sheet 640 px, Bestellweg E-Mail):
```
┌ Bestellung HB-2026-00041 senden ──────────────────────────────────────────── ✕ ┐
│ An        [bestellung@gaggenau…        ]  (aus Lieferant)                        │
│ Nachricht [ leer = Standardtext                                              ]   │
│ ⓘ Enthält Kundendaten: Kommission „AB-2026-00112“ · Lieferadresse Kunde (Strecke) │
│ ⚠ Anzahlung Kunde 0 von 3.000,00 € – Senden nur durch Leitung                     │
│   Leitung: Grund* [Stammkunde / Objektgeschäft / …       ]                        │
│ ┌ PDF-Vorschau (Druckformat aus Einstellungen) ┐                                  │
│ └───────────────────────────────────────────────┘                                 │
│                                     [Abbrechen]  [Senden (PDF anhängen)]          │
└──────────────────────────────────────────────────────────────────────────────────┘
```
- `per_email_senden(empfaenger, nachricht)` setzt den Status selbst; Fortschritt „PDF wird erzeugt und gesendet …“; Erfolg: Toast „Gesendet an …“, Zeitleiste „Bestellung per E-Mail an … gesendet“.
- **Anzahlung (E6, PP1):** nur bei `bezug_doctype = PH Auftragsbestaetigung`. Liest `anzahlung_soll_cent`/`anzahlung_ist_cent` des Auftrags (Leserecht Sortiment auf Faktura nötig; bis AS1 über `getValue`, fehlt das Recht → Band „Anzahlungsstand nicht lesbar – im Auftrag prüfen“ und Haken „Anzahlung geprüft“* für das Team). Ist < Soll → Team gesperrt; Leitung mit Pflichtgrund → Kommentar „Gesendet trotz offener Anzahlung: <Grund>“ (Feld `senden_trotz_anzahlung_grund`, AS1).
- **Kundendaten (DSGVO):** Hinweiszeile, wenn das PDF Kundenname oder Kundenadresse enthält. Die Kommission richtet sich nach `kommission_format` (AS21; bis dahin zeigt die UI beim Bezug Auftrag die Auftragsnummer als Vorbelegung statt des Kundennamens).
- **Fremdwährung:** gesperrt ohne Kurs (§3.7).
- **Fehler:** Mailserver antwortet nicht → Dialog bleibt offen: „Nicht gesendet: Der Mailserver hat nicht geantwortet. Status bleibt ‚Entwurf‘.“ · „Erneut senden“ · „Als gesendet markieren (anderer Weg)“. PDF scheitert → „PDF nicht erzeugt · Erneut versuchen“ (Kennung); „Senden“ bleibt gesperrt, bis die Vorschau geladen ist.

### 5.3 Storno einer gesendeten Bestellung (Kundenstorno, PP2)

1. Auslöser: Faktura storniert den Auftrag → Aufgabe „Storno beim Hersteller anfragen“ je verknüpfter Bestellung (doc_event AS18; bis dahin legt Faktura die Aufgabe nicht an → „Zu tun“ zeigt Bestellungen, deren Bezug-Auftrag storniert ist, über eine Abfrage auf `PH Auftragsbestaetigung.status`).
2. Bestellakte `⋯ Mehr › Storno anfragen …` → Mail-Vorschau an Bestell-E-Mail → `storno_anfragen(nachricht)` (AS18). Status bleibt, Chip „Storno angefragt“, „Zu tun: Storno angefragt“. Bis AS18: Mail über `ab_nachfragen`-ähnlichen Weg ist nicht vorhanden → Aufgabe „Storno telefonisch/per Mail anfragen“ + Kommentar.
3. Antwort des Herstellers → „Storno bestätigen …“: Beleg-Upload*, Stornokosten (Betrag, Währung, 0 erlaubt), Haken „an Kunden weiterverrechnen“ → Felder `storno_bestaetigt_am`, `storno_beleg`, `stornokosten_cent`, `storno_weiterverrechnen` (AS18) → Workflow `Stornieren` (Leitung). Weiterverrechnen erzeugt eine Aufgabe an Faktura.
4. Hersteller lehnt ab → „Storno abgelehnt“ (Kommentar), Chip entfällt, Aufgabe an Verkauf „Kunde informieren“.

### 5.4 Nachtrag (Positionen ändern nach dem Senden, PP4)

Leitung: `⋯ Mehr › Positionen ändern` → Positionstabelle bearbeitbar, Band „Änderung nach dem Senden – der Hersteller muss informiert werden“. Speichern → Dialog „Nachtrag senden“ mit Unterschieden (alt → neu je Position) und PDF „Nachtrag 1 zu HB-…“ → Mail. Bis AS22 (`nachtrag_noetig`, `nachtrag_nr`, Rücksprung der Position auf „AB erwartet“) erzeugt die UI den Unterschied clientseitig, sendet über `per_email_senden` nicht (Status wäre falsch), sondern legt den Mailtext als Kommentar an und öffnet „AB nachfragen …“ mit vorbefülltem Text. Positionen mit AB werden auf `abweichung` zurückgesetzt, indem „Abgleich neu erzeugen“ angeboten wird.

### 5.5 Rest stornieren (Teillieferung, PP3)

Bestellakte (Teilweise geliefert) → Position-Menü oder `⋯ Mehr › Rest stornieren …` (Leitung): Positionen mit Rest (Haken), Grund*, Haken „Hersteller hat bestätigt“* + Beleg → `rest_stornieren(positionen, grund)` (AS19) → Position `Storniert`, Bestellung `Geliefert`. Anzeige an der Position: „1 von 2 geliefert · Rest storniert“. Eingangsrechnungs-Soll = gelieferte Menge (AS25). Bis AS19 erscheint der Menüpunkt nicht; „Zu tun“ zeigt bei Teillieferung ohne Fortschritt > 30 Tage „Rest offen – Leitung klärt“.

### 5.6 Knöpfe je Dokument (Methoden exakt, Stand 2026-11-04)

| DocType | Methode | Rechte (Server) | UI-Ort | Rückmeldung |
|---|---|---|---|---|
| PH Produkt | `preis_hinzufuegen(brutto_cent, stand, preisart, quelle, quelle_url, ab, ausfuehrung, variante_name, freigegeben=1)` | write | Preis erfassen / bestätigen, Liste `Shift+P` | Toast mit neuem Preis; Team sendet `freigegeben=0` |
| PH Produkt | `ausfuehrung_anlegen(gruppe_key, option_id, name_de, name_en, name_fr, name_it, code, farbe_hex, standard, aufpreis_cent, preis_cent)` | write | Tab Ausführungen, S2 | „Ausführung … angelegt“; `aufpreis_cent`/`preis_cent` sendet die UI nicht (AS2) |
| PH Produkt | `variante_berechnen(auswahl)` | read | Tab Ausführungen „Konfiguration prüfen“ | Preis/Ausschluss |
| PH Produkt | `vk_vorschlag(anlegen, lieferant)` | write + Leitung (UI) | Tab Preise | nicht freigegebener Preis |
| PH Produkt | `website_cache_erneuern()` | read | `⋯ Mehr`, Massenaktion (einmal) | Ergebnistexte §2 |
| PH Produkt | `website_url(sprache)` | read | Vorschau ▾, `Shift+V` | neuer Tab; nicht veröffentlicht → Hinweis „Die Website zeigt eine leere Seite, solange das Produkt nicht veröffentlicht ist“ |
| PH Produkt | `duplizieren(neuer_name)` | create | `⋯ Mehr` | Sprung in die Kopie (Entwurf); Bildzustände der Kopie zeigt die UI so, wie der Server sie liefert (§19 O4) |
| PH Produkt | `ausstellungsstueck_anlegen()` | create | `⋯ Mehr` (Dialog §4.1) | Kopie Ausstellungsstück |
| PH Marke | `produkte_ohne_freigabe()` | read | Tab Händlerstatus | Sheet |
| PH Marke | `bildfreigabe_anfordern(empfaenger, nachricht)` | write | Primär (offen), Tab Bilder, Massenaktion | „Anfrage an … gesendet“ |
| PH Marke | `lieferant_anlegen()` | write | Primär (ohne Lieferant) | Link auf Lieferant |
| PH Lieferant | `offene_bestellungen()` | read | Kopf-Band | – |
| PH Lieferant | `liefertermin(marke, kategorie, bestelldatum)` | read | Bestellformular, Konditionen | Termin früh/spät |
| PH Herstellerbestellung | `per_email_senden(empfaenger, nachricht)` | write | Senden-Dialog | „Gesendet an …“ |
| PH Herstellerbestellung | `ab_nachfragen(nachricht)` | write, nur Status Gesendet | `⋯ Mehr`, Bericht offene Bestellungen | „Nachfrage an … gesendet“ |
| PH Herstellerbestellung | `ab_einlesen(ab_nummer, ab_datum, positionen, ab_datei)` | write | A10 | `{abweichungen}`; übernimmt auch `ab_ausfuehrung_text` |
| PH Herstellerbestellung | `ab_abgleich_erzeugen(speichern)` | write | „Abgleich neu erzeugen“ | „n Abweichungen, m offen“; Bewertungen gleicher Werte bleiben |
| PH Herstellerbestellung | `abweichung_bewerten(zeile, bewertung, kommentar)` | write; abgelehnt nur Leitung/GF/System Manager | Segment | Zähler |
| PH Herstellerbestellung | `abweichung_klaeren(zeile, aktion, text)` | write; `akzeptieren` bei Preis nur Leitung | Segment „OK“ (Preis), „Rückfrage ▸“ | Mail/ToDo, `klaerung`, `geklaert_am` |
| PH Herstellerbestellung | `termin_aendern(termin, position, grund, quelle)` | write; Grund Pflicht | Termin ändern … | Eintrag in `terminaenderungen`, ToDo an Besteller |
| PH Herstellerbestellung | `wareneingang_anlegen()` | write | **nicht verwendet** (bucht sofort alle Restmengen; S3 nutzt Insert) | – |
| PH Herstellerbestellung | `export_schnittstelle(format)` | read | `⋯ Mehr`, Massenaktion | CSV, `export_am` |
| (API) | `ph_sortiment.api.bestellungen_sammeln(positionen, bezug_doctype, bezug_name, kommission, idempotency_key)` | create | Projekte/Faktura → Entwürfe je Lieferant | Toast „3 Bestellentwürfe angelegt · Ansehen“; `ohne_lieferant` → „Zu tun: Bestellung ohne Lieferant“ |
| PH Wareneingang | `schaden_melden(beschreibung, regress)` | write | Primär (Reklamation) | Servicefall/Regress-Chips oder Hinweis |
| PH Wareneingang | `reklamation_melden()` | write | `⋯ Mehr` | „Gesendet an …“ |
| PH Preisliste Import | `datei_einlesen()` | write | A11 Schritt 1→2, „Datei neu einlesen“ | Zeilenzahl |
| PH Preisliste Import | `vorschau()` | read | A11 Schritt 2 | erste Zeilen + erkannte Spalten |
| PH Preisliste Import | `mapping_speichern()` | write | A11 Schritt 2 | Zuordnung gespeichert (auch am Lieferanten) |
| PH Preisliste Import | `pruefen(speichern)` | write | A11 Schritt 3 („Abgleichen“) | „n Zeilen, m über Schwelle“ |
| PH Preisliste Import | `uebernehmen()` | write + Leitung/GF/System Manager, nur Status Geprueft | A11 Schritt 4 | „n Preise übernommen“ |
| (Modul) | `importer.katalog.importieren_aus_anhang(file_url, trockenlauf, nur_marke)` | Leitung/Admin | `/sortiment/import` | Protokoll |

### 5.7 Massenaktionen

Muster (02 §5): Auswahl → Leiste unten (slide-up 160 ms `--bo-ease-out`) → **Vorschau-Dialog nur, wenn Zeilen übersprungen werden oder die Aktion nach außen wirkt** („n von m möglich – k übersprungen, Grund je Zeile“) → Ausführung über `massenaktionAction` (sequenziell, Fortschritt „12/40“ mit `role="status"`, Abbruch möglich, Fehlerzeilen bleiben markiert) → Ergebnis-Toast + Undo, wo eine Gegenaktion existiert.

| Liste | Aktion | Server je Dokument | Vorprüfung | Undo / Commit |
|---|---|---|---|---|
| Produkte | Zur Veröffentlichung geben | Workflow `Prüfen` | §5.1 | Undo |
| Produkte | Veröffentlichen … (Leitung) | Workflow `Veröffentlichen` | Bild, Marke aktiv, Kategorie, DE-Text, USt, Grundpreis | Dialog + verzögerter Commit |
| Produkte | Pausieren / Wieder veröffentlichen | Workflow | Bild | verzögerter Commit |
| Produkte | Auslaufen lassen … (Leitung) | Workflow | offene Kundenaufträge | Dialog, kein Undo |
| Produkte | Kategorie / weitere Kategorie / Welt / Typ | `setzeWertAction` | – | Undo (alter Wert) |
| Produkte | Ausblenden / Einblenden, Im Shop an/aus | `setzeWertAction` | Im Shop ohne Preis/Lieferzeit → Warnung | verzögerter Commit |
| Produkte | Preis bestätigen (gleicher Betrag, Stand heute, eine Quelle für alle) | `preis_hinzufuegen` | nur Produkte mit genau einem gültigen oder zuletzt gültigen Preis je Art | Team: Undo; Leitung (freigegeben): verzögerter Commit |
| Produkte | Website jetzt aktualisieren | **einmal** `website_cache_erneuern` am ersten Dokument (gilt für alle) | – | – |
| Produkte | Datenblatt drucken | Druckroute, Sammel-PDF ≤ 50 | – | – |
| Marken | Bildfreigabe anfordern … | `bildfreigabe_anfordern` | Empfänger vorhanden | Dialog (Mail) |
| Bestellungen | Senden … / Als gesendet markieren … | `per_email_senden` / Workflow `Senden` | Bestell-E-Mail, Positionen, Anzahlung, Kurs | Dialog mit Empfängern je Lieferant |
| Bestellungen | Für IWOfurn/pCon exportieren | `export_schnittstelle` | – | – |
| Bestellungen | Stornieren (Entwürfe) | Workflow `Stornieren` | nur Entwürfe | Undo |
| Freigaben | Freigeben / Ablehnen | Save der Bild-/Preiszeilen | Markenbeleg oder eigener Beleg; Ablehnen: Grund | verzögerter Commit |
| Bericht Preisstand | Preise nacheinander erfassen | Sheet-Folge `preis_hinzufuegen` | – | je Zeile |

### 5.8 Assistenten

**S2 Ausführungen anlegen** (Produktakte → Tab Ausführungen):
```
┌ Ausführungen anlegen · Bora X Pure                                       Schritt 2 von 3 ┐
│ Gruppen: [Farbe ✕] [Glas ✕] [+ Gruppe]                                                   │
│ Optionen „Farbe“ – eine pro Zeile:  Code;Bezeichnung;Preisgruppe   (aus Herstellerliste einfügen) │
│ ┌──────────────────────────────────────┐  Vorschau                                         │
│ │ INOX;Edelstahl;PG1                   │  INOX  Edelstahl   PG1  Standard  #______ [Bild]   │
│ │ SW;Schwarz;PG2                       │  SW    Schwarz     PG2            #1D1D1B [Bild]   │
│ └──────────────────────────────────────┘  Schlüssel: inox, sw                              │
│ Nicht kombinierbar: [SW] mit [Glas: Klar] [+]                                              │
│ [Zurück]                                                      [2 Optionen anlegen ⌘⏎]      │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```
Schritte: 1 Gruppen (`gruppe_key` per Slug aus `gruppe_de`, `pflicht`, Übersetzungen) → 2 Optionen je Gruppe (Einfügen, Trenner `;` oder Tab; `option_id` = Slug des Codes, sonst der Bezeichnung; Dubletten rot mit Text „doppelt“; `farbe_hex` im Format `#RRGGBB` geprüft; höchstens ein Standard; Spalten Preisgruppe, „nach Kundenwunsch“ (AS12), Ausschlüsse `nicht_kombinierbar_mit`) → 3 Zusammenfassung „legt 2 Gruppen und 9 Optionen an“. Ausführung: `speichernDokumentAction` (Gruppen), dann n × `ausfuehrung_anlegen` mit Fortschritt; bei Fehler Stopp mit Liste „angelegt / nicht angelegt“ und „Fehlende erneut anlegen“ (Name `produkt::gruppe::option` macht das idempotent). Preise je Option werden **nicht** hier erfasst, sondern als Preis mit Stand je Ausführung. Sammelmethode `ausfuehrungen_anlegen` fehlt (AS11-M, ab > 50 Optionen empfohlen).

**A10 AB einlesen** (Bestellung Gesendet → Primär; Kanban-Drop):
```
┌ AB einlesen · HB-2026-00038 · Bora GmbH                                     Schritt 2 von 3 ┐
├ AB-PDF ─────────────────────┬──────────────────────────────────────────────────────────────┤
│                             │ AB-Nr. [AB-7712]  AB-Datum [24.10.2026]                      │
│  (PDF-Vorschau, zoombar,    │ Pos│ Bezeichnung  │ Bestellt   │ AB Menge│ AB EK¹ │ AB Termin  │ AB Art.-Nr.│ AB Ausführung │            │
│   Seite 1/2)                │ 1  │ X Pure       │ 1 · 01.12. │ [1   ]  │ […]    │ [18.12.26] │ [        ] │ [Edelstahl  ] │ Termin +17 Tage │
│                             │ 2  │ Umluftfilter │ 2 · 01.12. │ [=]     │ [=]    │ [=]        │ [=]        │ [=]           │ wie bestellt │
│                             │ [Alle wie bestellt]            Toleranz Preis 0 % · Termin 0 Tage  │
├─────────────────────────────┴──────────────────────────────────────────────────────────────┤
│ [Zurück]                                                       [Abgleich erzeugen ⌘⏎]        │
└────────────────────────────────────────────────────────────────────────────────────────────┘
¹ nur Leitung (§1.2, §19 O2)
```
1. **AB-Datei** (PDF ablegen oder aus einem Mail-Anhang der Kommunikation wählen) + `ab_nummer`* + `ab_datum`* (heute).
2. **Werte je Position:** leer = „nicht bestätigt, wird nicht verglichen“ (Regel `abweichungen_positionen`); `=` in einer leeren Zelle übernimmt den Sollwert; Knopf „Alle wie bestellt“ (ohne Kürzel). Abweichung live mit denselben Toleranzen und Texten wie der Server („+17 Tage“, „+10,00 € (+5,3 %)“, „Artikelnummer weicht ab“, „Ausführung weicht ab“). Spalte „AB Ausführung“ (`ab_ausfuehrung_text`) – ein falscher Bezug oder eine falsche Farbe fällt sonst erst beim Wareneingang auf.
3. **Klären:** nur Zeilen mit Abweichung, Segment wie §4.3. Team ohne Abweichung → „AB bestätigen“ direkt; mit Abweichungen → „An Leitung übergeben“ (PH Aufgabe).

Ausführung: `ab_einlesen(…)` (setzt AB erhalten, erzeugt Abgleich) → je Bewertung `abweichung_bewerten`/`abweichung_klaeren` → optional Workflow `AB freigeben`. Ergebnis: „AB erfasst · 2 Abweichungen · 1 offen · Protokoll drucken · Zur Bestellung“. Fehler: AB-Nummer fehlt → Feld rot; Konflikt (Bestellung zwischenzeitlich geändert) → „Die Bestellung wurde von … geändert – Ihre Werte bleiben stehen. Neu laden und erneut senden.“; AB-Termin später als Wunschtermin bei Bezug Auftrag/Projekt → Hinweis „Kundentermin betroffen – Verkauf/Projekt informieren“ mit Haken (legt Aufgabe an).

**A11 Preisliste importieren** (Preislisten → „+ Preisliste“; Markenakte):
1. **Rahmen:** `marke`*, `lieferant` (Vorbelegung aus Marke), Preisart* (Verkaufspreis / UVP / Herstellerpreis / Einkaufspreis), **Preisbasis*** (`preisbasis`, AS5: „brutto Österreich 20 %“ / „brutto Deutschland 19 %“ / „netto“ / „brutto Schweiz“), `stand`* (Datum der Liste, nicht heute), `waehrung` (EUR; CHF nur bei Preisart Einkaufspreis), `quelle` (URL oder Text), `schwelle_prozent` (15 aus Einstellungen), Haken „VK vorschlagen“ (`vk_vorschlag`, nur bei Einkaufspreis), Datei (CSV, DataNorm, IDM-XML, XML; `format` Auto). Server: insert PH Preisliste Import → `datei_einlesen`. Excel → Hinweis „Bitte als CSV (UTF-8) speichern“ (AS33).
2. **Spalten:** `vorschau()` zeigt die ersten Zeilen und erkannte Spalten (grün). Nicht erkannt → Zuordnung per Auswahl (Artikelnummer, Preis, Bezeichnung, EAN, Ausführung, Preiskennzeichen), `trennzeichen`, `kodierung`, `dezimal` → `mapping_speichern()` (wird am Lieferanten für die nächste Liste gespeichert).
3. **Abgleichen:** `pruefen` → Tabelle `zeilen` (`hersteller_artikelnr`, `produkt`, `bezeichnung`, `ean`, `ausfuehrung`, `zuordnung`, `preiskennzeichen`, `alt_cent`, `neu_cent`, `abweichung_prozent`, `vk_vorschlag_cent`, `uebernehmen`, `hinweis`); Chips Alle · Über Schwelle · Ohne Produkt · Erster Preis · Wird übernommen; Δ % unter der Schwelle in `ink-soft`, darüber `danger-text` + `triangle-alert`. „Ohne Produkt“ zuordnen per LinkFeld (nur Produkte der Marke) → erneut `pruefen`. `uebernehmen` je Zeile umschaltbar; über der Schwelle nur Leitung (UI; serverseitig nicht beschränkt).
4. **Übernehmen (Leitung):** Zusammenfassung „n Preise mit Stand dd.mm.yyyy, Quelle Herstellerliste, Beleg = Datei · m Zeilen übersprungen (Gründe)“. Sperren: Preisart UVP und Preisbasis ≠ brutto Österreich → „Eine UVP gilt nur als österreichische Herstellerempfehlung inkl. 20 % USt – als Herstellerpreis übernehmen?“ (Umschalter); Währung ≠ EUR bei Verkaufspreis/UVP → gesperrt. Vorprüfung auf doppelte Einträge (gleiches `ab`/Preisart/Ausführung schon vorhanden → Server würde komplett abbrechen) → „Für 3 Produkte gibt es schon einen Preis mit diesem Datum · Diese Zeilen auslassen und übernehmen“ (setzt `uebernehmen = 0` für diese Zeilen). → `uebernehmen`. Ergebnis: geänderte Produkte, „Website folgt“. Übernommene Preise sind freigegeben (Leitung). Team endet bei Schritt 3 mit „Zur Übernahme an Leitung“ (PH Aufgabe). Einkaufspreis-Listen erzeugen EK-Zeilen und nicht freigegebene VK-Vorschläge.

**S3 Wareneingang buchen** (Bestellung, „Zu tun“, Packtisch-Kiosk):
1. **Bestellung finden:** Scan/Eingabe `HB-…`, Suche in `kommission`, `ab_nummer`, `lieferschein_nr_lieferant`; zweiter Weg „Lieferant wählen“ (Kacheln mit Logo und Zahl offener Bestellungen). Kiosk zeigt die heute erwarteten Lieferungen als große Kacheln. Unbekannt → §8.2.
2. **Kopf:** `datum` (heute), `lieferschein_nr_lieferant`, `spediteur`, `packstuecke`.
3. **Positionen:** je Position Rest = `(ab_menge or menge) − menge_erhalten` (stornierte ausgelassen; Formel clientseitig bis AS23 `wareneingang_vorschlag()`), Stepper `menge_erhalten` (Vorbelegung = Rest), Differenz live („1 weniger“, „2 mehr als bestellt“). Zustand-Chips mit Untertitel: **in Ordnung** · **Transportschaden** („beim Transport beschädigt“) · **beschädigt ab Werk** („Ware fehlerhaft geliefert“) · **falscher Artikel** · **fehlt**. Bei Schaden/falsch Foto oder Hinweis Pflicht (Serverregel); Kamerahinweis „Bitte keine Personen fotografieren“. `seriennummer`, Lagerort. Hilfetext: „Beschädigt und Transportschaden zählen als erhalten (die Ware ist da) – die Reklamation läuft getrennt.“ Mehrmenge → Pflichtentscheidung „annehmen (Rechnung/Nachbestellung)“ oder „zurücksenden“ (bucht nur die Sollmenge; AS26/AS20, bis dahin Hinweis + Aufgabe). „Alles in Ordnung“ setzt alle Zeilen auf Rest/in Ordnung.
4. **Buchen:** Zusammenfassung „bucht n Stück in HB-… · Status danach Teilweise geliefert/Geliefert · Bestand Lager“ → insert PH Wareneingang (`speichernDokumentAction`). Doppelbuchung (zwei Geräte): gleiche `lieferschein_nr_lieferant` + Bestellung bereits vorhanden → vor dem Insert Abfrage, Fehler „Schon gebucht als WE-…“ (serverseitig AS16). Danach bei Reklamation sofort „Schaden melden …“. Scan-Bestätigung 240 ms (04 §3.12), Erfolgsmoment 400 ms (04 §3.13). Nach dem Buchen: „Fehler gemeldet? Korrektur anfragen“ (bis AS14-K).

**S4 Bildfreigabe der Marke erfassen** (Markenakte Tab Bilder / Freigabe-Schreibtisch → „Freigabe erhalten …“): Beleg hochladen* (Mail als PDF oder Screenshot) → Umfang (Haken Website* · Social · Druck · gültig bis; Felder `bildfreigabe_umfang`/`bildfreigabe_bis` AS10-B, bis dahin als Kommentar) → `bildfreigabe_status = schriftlich erteilt`, `bildfreigabe_beleg`, `bildfreigabe_datum` → Angebot „12 offene Produktbilder und 3 Markenbilder dieser Marke jetzt freigeben“ (Massenfreigabe mit Markenbeleg, verzögerter Commit).

### 5.9 Strecke „Kunde direkt“ (Lieferung beim Kunden bestätigen)

Ware kommt nie ins Haus, also kein Wareneingang. Bestellakte (Lieferadresse Kunde direkt, AB bestätigt) Primär „Lieferung beim Kunden bestätigen …“ → Dialog: Datum, Mengen je Position, Nachweis (Foto/Lieferschein des Spediteurs, optional; Hinweis „keine Personen und möglichst keine Wohnräume fotografieren“) → `lieferung_bestaetigen(mengen, datum, nachweis)` (AS23, ruft `lieferung_verbuchen` ohne Lagerbewegung; `PH Wareneingang.direktlieferung`). Bis AS23 ist der Knopf gesperrt mit Text „Streckenlieferungen werden noch nicht unterstützt – Leitung bitten“; die Leitung bucht dann ausnahmsweise im Frappe-Desk (bewusst nicht in der UI, damit kein Bestand gebucht wird).

### 5.10 Rücksendung an Lieferant (PP6)

Wareneingang (falscher Artikel, beschädigt, Mehrmenge zurück) → „Rücksendung an Lieferant …“: Positionen, Grund, Abholung (ph_logistik `PH Speditionsauftrag`), erwartete Gutschrift → DocType `PH Lieferantenretoure` mit Status Offen/Abgeholt/Gutgeschrieben, Druckformat Rücklieferschein (AS20). Die Bestellposition bleibt offen (Ersatz erwartet). Bis AS20: PH Aufgabe an Sortiment.

### 5.11 Einstieg aus Faktura und Projekte

„Herstellerbestellungen erzeugen“ an der Auftragsbestätigung (ph_faktura `herstellerbestellungen_erzeugen`) bzw. Projekte über `bestellungen_sammeln` → je Lieferant ein Entwurf mit `bezug_doctype/bezug_name`. Sortiment zeigt den Toast „3 Bestellentwürfe angelegt · Ansehen“ und die Liste gefiltert auf diesen Bezug. Entwürfe ohne Lieferant (Faktura setzt `ignore_mandatory`) landen in „Zu tun: Bestellung ohne Lieferant“.

---

## 6. Tastatur (verbindliche Belegung)

Grundregel: Einzelbuchstaben gehören Shell und DataTable und bedeuten überall dasselbe; Bereichsaktionen = `Shift+Buchstabe`; Primäraktion der fokussierten Zeile = `Shift+Enter`; Aktionen mit Mail oder öffentlicher Wirkung haben **kein** Einzelkürzel (nur Knopf, Palette oder `Shift+…` mit Dialog). In `input`, `textarea`, `contenteditable`, `[role=combobox]` wirken Einzeltasten nie. Entscheidungstasten `1`/`2`/`3` wirken nur bei Fokus in einem `role="grid"` (Freigabe-Raster, Abgleich-Tabelle). Jeder Knopf zeigt sein Kürzel im Tooltip; `?` zeigt die Kürzel der Seite. Alle Einzeltasten sind im Benutzer-Menü abschaltbar (Fundament F3, WCAG 2.1.4).

| Kontext | Taste | Wirkung |
|---|---|---|
| Global | wie 02 §9.1 (`⌘K`, `/`, `?`, `n`, `e`, `⌘S`, `⌘Enter`, `⌘Z`, `Esc`, `⌘P`, `[` `]` Seitenleiste, `Alt+↑/↓`) | unverändert; kein `G`-Akkord für Sortiment bis zur Fundament-Entscheidung (E11) |
| Liste (alle) | `↑↓` `j k` · `Enter` · `Leertaste` · `x` · `Shift+↑↓` · `s` · `c` · `1–9` · `←→` · `Shift+Enter` · `.` | Zeile · öffnen · Seitenblick · auswählen · Bereich · Status · Kommentar · Ansicht/Chip · Seite blättern · Zeilen-Primäraktion · Zeilenmenü |
| Produkte | `Shift+P` · `Shift+V` · `Shift+B` | Preis erfassen · Website-Vorschau (de) · in Bestellung übernehmen |
| Marken / Lieferanten | `Shift+B` · `Shift+L` | Neue Bestellung · Lieferant öffnen/anlegen |
| Bestellungen | `Shift+S` · `Shift+A` · `Shift+W` · `p` | Senden (Dialog) · AB einlesen · Wareneingang buchen · PDF-Vorschau |
| Abgleich (Grid) | `↑↓` · `1` `2` `3` · `c` · `⌘Z` | Zeile · OK / Rückfrage (Menü) / Ablehnen · Kommentar · letzte Bewertung zurück |
| Freigaben (Grid) | Pfeile · `x` · `Leertaste`/`Enter` · `1` · `3` · `Shift+Q` · `Alt+↑/↓` | Kachel · markieren · Lightbox · Freigeben · Ablehnen (Grund) · Quelle öffnen · Marke wechseln |
| Akte | `Alt+1…5` · `p` · `.` · `⌘Enter` · `c` | Tab · Drucken · Aktionsmenü · Primäraktion · Kommentar |
| Bilder (Fokus auf Bild) | `⌘⇧←/→` · `Entf` | Reihenfolge · Entfernen (Undo) |
| Kategorienbaum | `⌘⇧↑/↓` · `m` | nach oben/unten · Verschieben nach … |
| Kanban | Pfeile · `Enter` · `m` | Karte · öffnen · Verschieben-Menü (öffnet bei Zielen mit Dialog denselben Dialog wie das Ziehen) |
| Assistent | `Enter` · `⌘Enter` · `⌘⇧Enter` · `Esc` | weiter (außerhalb mehrzeiliger Felder) · weiter (überall) · ausführen (nur letzter Schritt) · abbrechen (Rückfrage ab Schritt 2); Zurück nur per Knopf/Schrittleiste |
| Schnellanlage | `⌘Enter` · `⌘⇧Enter` · `Esc` | Anlegen und öffnen · Anlegen und noch eins · abbrechen |
| Packtisch | F2 · F6 · F7 · F8 · Scan | Bestellung suchen · Buchen · Foto · Problem melden · Bestellung öffnen |

Nicht belegt (bewusst): `Alt+←/→` (Browser-Zurück), `Backspace` im Raster, `⇧=`, `Shift+Enter` als „zurück“, `Shift+Klick` als Seitenblick, Einzeltaste für Bildfreigabe anfordern, AB nachfragen, Senden, Veröffentlichen.

---

## 7. Undo, Rückfragen, verzögerter Commit

Grundsatz: umkehrbar → Undo-Toast 8 s (02 §6.1); nach außen wirkend → verzögerter Commit 8 s; endgültig oder mit Mail → Bestätigungsdialog. Toast-Balken 8000 ms linear, Taste `⌘Z` solange sichtbar.

**Verzögerter Commit (E1):** Oberfläche ändert sich sofort (optimistisch); Toast „… · Website folgt · Rückgängig“; der Server-Aufruf startet erst nach Ablauf. `pagehide`/`visibilitychange:hidden` → sofort per `navigator.sendBeacon` an `/api/undo-commit` (Fundament F2). Rückgängig = Aufruf entfällt, die Website hat nie etwas gesehen. Schlägt der Commit fehl → `warning`-Toast „Nicht gespeichert: …“ und der alte Zustand kehrt zurück (Zeile 120 ms Opazität).

| Aktion | Muster |
|---|---|
| Bild/Preis/Lieferzeit freigeben oder ablehnen (einzeln, Masse) | verzögerter Commit |
| Veröffentlichen | Dialog + verzögerter Commit |
| Pausieren, Wieder veröffentlichen, Ausblenden/Einblenden, Im Shop an/aus | verzögerter Commit |
| Preis erfassen/bestätigen (Leitung, freigegeben) | verzögerter Commit |
| Preis erfassen/bestätigen (Team, Freigabe offen) | sofort + Undo (entfernt die Zeile) |
| Zur Veröffentlichung geben, Zurück auf Entwurf | sofort + Undo (Gegenübergang) |
| Stammdaten inline, Kategorie/Welt/Typ setzen | sofort + Undo (alter Wert) |
| Bild entfernen | sofort + Undo; bei freigegebenem Bild: „Die Website zeigt es nach dem Rückgängig wieder“ |
| Bilder-Reihenfolge, Hauptbild | sofort + Undo (alte Reihenfolge) |
| Ausführung inaktiv / Standard setzen | sofort + Undo (bei Standard: der vorherige Standard der Gruppe) |
| Kategorie verschieben | sofort + Undo; ändert sich die Web-Adresse → vorher Bestätigung |
| AB-Bewertung OK/Rückfrage (vermerken)/Ablehnen | sofort + Undo + `⌘Z` |
| Rückfrage beim Hersteller, AB nachfragen, Bildfreigabe anfordern, Senden, Storno anfragen, Reklamation | Dialog mit Mail-Vorschau, kein Undo |
| Abgleich neu erzeugen | Rückfrage nur, wenn Bewertungen verloren gehen |
| Bestellentwurf stornieren | sofort + Undo |
| Stornieren ab Gesendet, Rest stornieren, Auslaufen lassen, Preisliste übernehmen/verwerfen | Dialog |
| Wareneingang buchen | Zusammenfassungsschritt (02 §6.2 Buchung); danach „Korrektur anfragen“ |
| Massenaktion Status ohne übersprungene Zeilen | sofort + Undo (kein Vorschau-Dialog) |

---

## 8. Leer- und Fehlerzustände

### 8.1 Leerzustände (Titel · Text · eine Aktion; 02 §7.1, 03 §8.18)

| Ort | Fall | Text | Aktion |
|---|---|---|---|
| Bereichsstart | alles erledigt | „Alles erledigt – nichts zu tun im Sortiment.“ | – |
| Bereichsstart | neuer Mandant | „Erste Schritte“ (Marke → Lieferant → Produkt → Bildfreigabe) | je Schritt |
| Produkte | nie | „Noch keine Produkte. Produkte entstehen aus dem Katalog-Import oder hier.“ | „+ Produkt“, „Import öffnen“ |
| Produkte | gefiltert | „Keine Produkte für diese Filter.“ | „Filter zurücksetzen“ |
| Marken | nie | „Noch keine Marken. Marken entstehen beim Katalog-Import oder hier.“ | „+ Marke“ |
| Lieferanten | nie | „Noch keine Lieferanten. Am schnellsten aus einer Marke: Marke öffnen → Lieferant anlegen.“ | „+ Lieferant“ |
| Bestellungen | nie | „Noch keine Bestellungen. Sie entstehen aus einem Auftrag (Faktura) oder hier.“ | „+ Bestellung“ |
| Bestellungen „AB ausständig“ | erledigt | „Keine Bestellung wartet auf eine AB.“ | – |
| Wareneingänge | nie | „Noch keine Wareneingänge. Sie entstehen aus einer Bestellung oder am Packtisch.“ | „Erwartete Lieferungen ansehen“ |
| Wareneingänge „Reklamation offen“ | erledigt | „Keine offenen Reklamationen.“ | – |
| Kopfband „Erwartet diese Woche“ | leer | Band entfällt | – |
| Packtisch „Heute erwartet“ | leer | „Heute ist keine Lieferung angekündigt. Kommt trotzdem etwas: Lieferschein scannen.“ | „Lieferant wählen“ |
| Freigaben › Bilder / Preise / Lieferzeiten | erledigt | „Alles erledigt“ · „Keine Bilder (Preise, Lieferzeiten) warten auf Freigabe.“ | – |
| Freigaben, Marke gewählt | gefiltert | „Keine offenen Bilder bei Bora.“ | „Alle Marken zeigen“ |
| Preislisten | nie | „Noch keine Preisliste eingelesen.“ | „+ Preisliste“, „Vorlage herunterladen“ |
| Preislisten-Lauf „Über Schwelle“ | gefiltert | „Keine Zeile über 15 %.“ | „Alle Zeilen“ |
| Preislisten-Lauf, 0 Zeilen | fehlerähnlich | „Die Datei enthält keine lesbaren Zeilen.“ · „Erwartet: Artikelnummer und Preis je Zeile.“ | „Andere Datei wählen“, „Vorlage herunterladen“ |
| Kategorien | nie | „Noch keine Kategorien. Kategorien bestimmen die Website-Adressen.“ | „Kategorie anlegen“ |
| Merkmale, Gruppe | nie | „Noch keine Farben.“ (je Gruppe) | „Farbe anlegen“ |
| Produktakte, Verknüpfungen | nie | „Noch nirgends verwendet – kein Angebot, keine Bestellung, kein Verkauf.“ | – |
| Produktakte, Bilder | nie | „Noch kein Bild. Ohne freigegebenes Bild kann das Produkt nicht veröffentlicht werden.“ | „+ Bilder“ |
| Produktakte, Preise | nie | „Kein Preis. Auf der Website steht ‚Preis auf Anfrage‘.“ | „Preis erfassen“ |
| Markenakte › Produkte | nie | „Noch keine Produkte von Bora.“ | „+ Produkt“ |
| Lieferantenakte › Bestellungen | nie | „Noch keine Bestellung bei Bora GmbH.“ | „Neue Bestellung“ |
| Bestellakte › Lieferung, Wareneingänge | nie | „Noch nichts eingegangen. Termin laut AB: 18.12.2026.“ | „Wareneingang buchen“ (ab AB bestätigt) |
| Bestellakte › Auftragsbestätigung | nie | „Noch keine AB. Gesendet am 20.10.2026, Frist 5 Tage.“ | „AB einlesen“ |
| Abgleich ohne Abweichung | erledigt | „Keine Abweichung – die AB entspricht der Bestellung.“ | „AB bestätigen“ (Primär) |
| Berichte | gefiltert | „Keine Daten im Zeitraum.“ · Preisstand: „Alle Preise sind aktuell.“ | „Zeitraum ändern“ |
| Palette ⌘K | 0 Treffer | „Nichts zu ‚xyz‘ gefunden.“ | „Produkt ‚xyz‘ anlegen“ (mit Recht) |
| Seitenblick | gelöscht | „Dieser Datensatz existiert nicht mehr.“ | „Schließen“ |

### 8.2 Fehlerfälle (Text + Weg, 02 §7.2)

| Fall | Ort | Text | Weg |
|---|---|---|---|
| Mailversand scheitert (Bestellung, Nachfrage, Bildfreigabe, Reklamation, Rückfrage) | Dialog | „Nicht gesendet: Der Mailserver hat nicht geantwortet. Status bleibt ‚…‘.“ | Dialog bleibt, „Erneut senden“, „Als gesendet markieren (anderer Weg)“ |
| Lieferant ohne Bestell-E-Mail | Senden, Nachfrage, Rückfrage | „Keine Bestell-E-Mail beim Lieferanten.“ | „Als gesendet markieren …“, „Portal öffnen“, „Lieferant öffnen“ |
| Upload zu groß / falsches Format | Bildkachel | „Datei zu groß (max. … MB)“ / „Nur JPG, PNG, WebP“ | Kachel rot, „Andere Datei“; übrige Uploads laufen weiter |
| Bild größer als `bild_max_px` | Bildkachel | Hinweis „Wird für die Website verkleinert“ (Verkleinerung AS32; Inhalt bleibt unverändert) | – |
| Quelle-URL nicht erreichbar | Bild-/Preisfeld | „Adresse nicht erreichbar – trotzdem speichern?“ | Speichern möglich, Vermerk im Verlauf |
| Preisliste Kodierung/Trennzeichen | A11 Schritt 1/2 | „Umlaute unlesbar – Kodierung wählen oder Datei als CSV UTF-8 speichern.“ | Auswahl Kodierung, „Andere Datei“ |
| Preisliste Übernehmen bricht ab | A11 Schritt 4 | „Nicht übernommen: Für 3 Produkte gibt es schon einen Preis mit diesem Datum.“ | „Diese Zeilen auslassen und übernehmen“ |
| UVP aus DE/CH | A11 Schritt 4, Preis-Sheet | „Eine UVP gilt nur als österreichische Herstellerempfehlung.“ | „Als Herstellerpreis übernehmen“ |
| Fremdwährung ohne Kurs | Bestellung | „Kurs fehlt – ohne Kurs kann nicht gesendet werden.“ | Kursfeld fokussieren |
| Anzahlung offen | Senden | „Anzahlung Kunde 0 von 3.000,00 € – Senden nur durch Leitung.“ | „Leitung bitten“ |
| Freigabe gleichzeitig durch zweite Person | Freigaben | „Lena hat 4 dieser Bilder vor 1 Min. bearbeitet.“ | Kacheln aktualisieren, Auswahl bleibt für die übrigen |
| Speichern-Konflikt (`modified`) | Akten | „Von … vor 2 Min. geändert. Ihre Eingaben bleiben stehen.“ | „Neu laden und vergleichen“ |
| Scan unbekannt / keine offene Bestellung | Packtisch | „Keine offene Bestellung zu HB-2026-00099.“ | „Lieferant wählen“, „Ohne Bestellung melden“ (Aufgabe an Sortiment, Foto Lieferschein) |
| Lieferschein schon gebucht | S3 | „Schon gebucht als WE-2026-00017 (heute 09:12, Gerät Packtisch 1).“ | „Wareneingang öffnen“ |
| Offline beim Buchen | Packtisch | Band „Offline – Eingang wird gebucht, sobald Verbindung da ist (1 wartend)“ (05 §12.5) | „Buchen“ bleibt aktiv, Status „wartet“; danach „WE-… gebucht“ |
| Server lehnt Veröffentlichen ab | Dialog | „2 Produkte nicht veröffentlicht: Marke Gaggenau ist nicht aktiv.“ | Liste mit Sprunglinks |
| Löschen über API bei Aufbewahrungspflicht | Akte | „Stornieren statt Löschen (Aufbewahrungspflicht).“ | „Stornieren“ |
| PDF-Erzeugung scheitert | Druck-Sheet | „PDF nicht erzeugt · Erneut versuchen“ (Kennung) | Senden gesperrt bis Vorschau geladen |
| Recht fehlt | jede Aktion | „Dafür fehlt die Berechtigung.“ | „Leitung bitten“ (PH Aufgabe) |

---

## 9. Bewegung (04, verbindlich)

| Stelle | Dauer / Easing | Reduzierte Bewegung |
|---|---|---|
| Kennzahl beim ersten Erscheinen | steht sofort, kein Hochzählen | – |
| Kennzahl ändert sich nach einer Aktion | 400 ms `--bo-ease-out` (≤ 4 Stellen Unterschied: direkter Wechsel) | direkter Wechsel |
| Zähler „n offen“, „n Bilder offen“ | direkter Wechsel + `aria-live="polite"` | gleich |
| Skeleton → Inhalt | Crossfade 80/160 ms | 120 ms Opazität |
| Kanban gültige Ablage | 320 ms `--bo-ease-spring` (einzige Feder im Bereich) | 120 ms Opazität |
| Kanban ungültiger Drop / Abbruch des Dialogs | 200 ms `--bo-ease-out` zurück | sofort |
| Freigegebene/abgelehnte Kachel | Rand 120 ms → Opazität 100 ms `--bo-ease-in` → Nachbarn FLIP 200 ms `--bo-ease-out` (keine Höhenanimation im Grid) | nur Opazität 120 ms |
| „AB bestätigen“ wird primär | Farbwechsel 160 ms `--bo-ease-out`, kein Puls | sofort |
| Sheet (Preis erfassen, Senden, Seitenblick) | öffnen 200 ms `--bo-ease-out`, schließen 120 ms `--bo-ease-in` | 120 ms Opazität |
| Massenaktionsleiste | slide-up 160 ms `--bo-ease-out` (03 §8.7 nachziehen, W11) | Opazität |
| Assistent Schrittwechsel | 160 ms `--bo-ease-out`, 8 px x-Versatz, rückwärts gespiegelt; Fuß ohne Versatz | nur Opazität |
| Hover Kachel | `translateY(-1px)` 120 ms | kein Versatz |
| Markierte Zeile nach Rücksprung | Sand 14 % → transparent 1200 ms | gleich (nur Farbe) |
| Neue Zeitleisteneinträge | 160 ms `--bo-ease-out` | Opazität |
| Undo-Balken | 8000 ms linear | gleich |
| Packtisch Scan-Bestätigung / Erfolg | 240 ms (04 §3.12) / 400 ms (04 §3.13; „Wareneingang gebucht“ ergänzen) | Häkchen ohne Bewegung |
| Balken in Berichten | wachsen 240 ms `--bo-ease-out` nur beim ersten Erscheinen | keine |

Im Kiosk nur Scan-Bestätigung und Erfolgsmoment; keine Seitenübergänge, keine Stagger. Kein Endzustand später als 400 ms (außer Undo-Balken und Rücksprung-Markierung).

---

## 10. Barrierefreiheit (WCAG 2.2 AA)

- **Status nie nur über Farbe:** Bildzustand als 16-px-Icon unten rechts (`circle-check` freigegeben, `clock` offen, `circle-x` abgelehnt) mit `aria-label`, in Akte und Raster zusätzlich Text. Stand/Preis-Zustände als Text („läuft ab 12.10.“, „veraltet seit …“). Badges immer mit Text.
- **Ziehen hat immer eine Alternative (2.5.7):** Bilder-Reihenfolge (Menü + `⌘⇧←/→`), Kategorienbaum (Menü „Verschieben nach …“ + `⌘⇧↑/↓`), Kanban (`m`-Menü), Wischen am iPad (Knöpfe 44 px).
- **Kontrast:** Sand `#8a7a66` auf Weiß hat 4,15:1 und ist für normalen Text nicht zulässig; nur für Flächen ≥ 3:1, Icons und Text ≥ 18,66 px fett. Δ % unter der Schwelle `ink-soft`, darüber `danger-text` + Icon.
- **Grids:** Freigabe-Raster und Abgleich-Tabelle `role="grid"`; Kachel `role="gridcell"`, `aria-selected`, Name „X Pure, Freisteller, Freigabe offen, Quelle bora.com“. Segment „OK · Rückfrage · Ablehnen“ als `radiogroup`, Screenreader liest „Zeile 1, Termin, plus 17 Tage, Bewertung OK, ausgewählt“.
- **Fokus:** nach Freigabe/Bewertung auf die nächste offene Einheit (2.4.3); nach Dialog/Sheet zurück zum Auslöser; Lightbox `<dialog>` mit Fokusfalle, Alt-Text sichtbar unter dem Bild.
- **Live-Regionen:** Zähler `aria-live="polite"`; Massenfortschritt `role="status"`.
- **Zielgrößen:** `⋯` in Tabellenzeilen 28 px Sicht, 44 px Trefferfläche am iPad; Segment ≥ 32 px hoch; Kiosk-Stepper 64 px.
- **Formulare:** Zähler (SEO 60/160) mit `aria-describedby` und Text bei Überschreitung; Fehlermeldungen am Feld (`aria-invalid`, `aria-describedby`).
- **Bilder der Website:** „Ohne Bildbeschreibung“ als Hinweis in der Checkliste.
- **Charts:** Tabellen-Umschalter je Chart.
- **Dunkelmodus:** Produktbilder und Logos auf weißer Platte `#ffffff` mit Rand `line`, Radius 6.

---

## 11. Kennzahlen, Berichte, Charts

### 11.1 Kennzahl-Karten (Number Cards aus `fixtures/number_card.json`)

| Karte (Anzeige) | Name | DocType | Filter | Wo |
|---|---|---|---|---|
| Veröffentlicht | `PH Aktive Produkte` | PH Produkt | `status = Aktiv` | Bereichsstart |
| Produkte ohne freigegebenes Bild | `PH Produkte ohne Bildfreigabe` | PH Produkt | `bild_freigegeben = 0`, `status != Ausgelaufen` | „Zu tun“-Gruppe, Zentrale |
| Preis veraltet | `PH Preisstand veraltet` | PH Produkt | `preisstand_alt = 1`, `status = Aktiv` | „Zu tun“-Gruppe, Zentrale |
| Offene Bestellungen | `PH Offene Herstellerbestellungen` | PH Herstellerbestellung | `status in (Gesendet, AB erhalten, AB geprueft, Teilgeliefert)` | Bereichsstart |
| AB mit offenen Abweichungen | `PH AB mit Abweichung` | PH Herstellerbestellung | `abweichungen_offen > 0`, nicht abgeschlossen/storniert | „Zu tun“-Gruppe, Zentrale |
| Marken ohne Händlerstatus | `PH Marken ohne Haendlerstatus` | PH Marke | `status = Aktiv`, `haendlerstatus in (Keiner, Anfrage laeuft)` | Bereichsstart, Zentrale |

Laden über `kennzahlen()` (Fundament, `count` je Filter, identische Filter wie die Fixtures). Jede Zahl erscheint auf einer Seite genau einmal.

### 11.2 Abgeleitete Kennzahlen (aus vorhandenen Feldern)

| Kennzahl | Quelle | Wo |
|---|---|---|
| Im Shop ohne gültigen Preis | `verkauf_online = 1`, `aktueller_preis_cent` leer, `status = Aktiv` | Bereichsstart |
| Im Shop ohne freigegebene Lieferzeit | `verkauf_online = 1`, `lieferzeit_freigegeben = 0` | Berichte (FAGG) |
| AB ausständig | `status = Gesendet` + Frist (`ab_ueberfaellig`) | „Zu tun“, Zentrale |
| Lieferung überfällig | `bestaetigter_termin < heute`, AB bestätigt/Teilweise geliefert | „Zu tun“ |
| Wareneingang erwartet (7 Tage) | `bestaetigter_termin` in [heute, heute + 7] | „Zu tun“, Packtisch |
| Bestellungen ohne Lieferant | `lieferant` leer | „Zu tun“ |
| Storno angefragt | `storno_angefragt_am` gesetzt (AS18) | „Zu tun“ |
| Vorkasse offen | `zahlungsbedingung in (Vorkasse, Anzahlung)`, `anzahlung_bezahlt_am` leer (AS17) | „Zu tun“ (Leitung) |
| Wareneingänge ohne Rechnung (Wert) | Report AS15 | Berichte (Leitung) |
| Reklamierte Wareneingänge (30 Tage) | `status = Reklamiert`, `datum ≥ heute − 30` | Berichte |
| Händlerverträge laufen aus (60 Tage) | `vertrag_gueltig_bis` | „Zu tun“ (Leitung) |
| Fehlende Übersetzungen | `status = Aktiv`, `kurz_en`/`kurz_fr`/`kurz_it` leer | Berichte |

### 11.3 Charts (`fixtures/dashboard_chart.json`, nur auf `/sortiment/berichte`)

| Chart | Daten | Darstellung |
|---|---|---|
| `PH Produkte je Marke` | Group By `marke`, `status = Aktiv` | horizontale Balken, Top 12 + „weitere“, Klick filtert Produkte |
| `PH Herstellerbestellungen nach Status` | Group By `status` ohne Abgeschlossen/Storniert | gestapelter Balken in Workflow-Reihenfolge (statt Donut) |
| `PH Bestellungen je Monat` | monatlich auf `datum`, ohne Storniert | 12 Monate, Linie „heute“ |
| `PH Lieferterminabweichung je Lieferant` | Report Liefertermintreue | zwei Reihen: Ø Verspätung (Tage) Tinte, AB mit Abweichung % Sand (Fläche), sortiert nach Verspätung |

Farben aus 03 §1.6 (Tinte `#30373e`, Sand `#8a7a66`, Status-Rollen); Report-eigene Farben werden nicht übernommen. Tooltip mit exaktem Wert und Einheit; Tabellen-Umschalter je Chart.

### 11.4 Beitrag zur Zentrale

Für Sortiment * und GF: Kacheln „Preis veraltet“, „AB mit offenen Abweichungen“, „Marken ohne Händlerstatus“; Heute-Leiste (05 §7.4): AB ausständig, Abweichungen offen, Wareneingang erwartet, Freigaben offen (nur Leitung). „Zu tun“-Zeilen liefert der Bereich als Bausteine (`zuTun.js`) auch an die Zentrale.

---

## 12. Druck und PDF

Weg (05 §10): Knopf „Drucken“ / `p` / ⌘P → `/druck/[doctype]/[name]?format=<Print Format>`, PDF von Frappe (Jinja, `ph_basis.html`), Vorschau im Sheet (A4, 100 % / Seitenbreite), Aktionen Herunterladen · Drucken · per E-Mail (nur Bestellung, über den Senden-Dialog).

| Druckformat | DocType | Inhalt | Regeln |
|---|---|---|---|
| PH Herstellerbestellung Standard | PH Herstellerbestellung | Firmenkopf, Lieferant mit Adresse, Bestellnummer, Datum, „Unsere Kundennr.“, Kommission (nach `kommission_format`), Incoterm, Positionen (Pos., Artikelnr., Bezeichnung/Ausführung, Menge, Einheit, Wunschtermin), Lieferadresse | **ohne VK**; EK nur, wenn das Format ihn zeigt – vor Livegang auf Staging prüfen; Währungskürzel aus dem Dokument; Kundenadresse nur bei Kunde direkt; Nachtrag mit Kennzeichen „Nachtrag n“ |
| PH AB Abgleich Protokoll | PH Herstellerbestellung | AB-Nummer/Datum, Status, Abweichungen gesamt/offen, geprüft von/am, Soll/Ist je Position, Protokollzeilen mit Bewertung und Klärung | Ablage-Beleg für Rückfragen |
| PH Wareneingang Protokoll | PH Wareneingang | Bestellung, Kommission, Lieferant, Lieferschein, Spediteur, Packstücke, erfasst von, Positionen (erwartet, erhalten, Differenz, Zustand, Hinweis, Seriennummer), Fotos, Unterschriften, Vorbehaltshinweis | A4 Bürodrucker (nicht Bondrucker); als Anhang der Reklamationsmail fehlt (AS28) |
| PH Produkt Datenblatt | PH Produkt | Titel, Marke, Kategorie, Art.-Nr., freigegebene Bilder, Kurztext, Serie, Design, Maße, Preis „ab … inkl. 20 % USt · Stand …“ | nur freigegebene Bilder; Preis nur mit gültigem, freigegebenem Preis; UVP mit Text „Unverbindliche Preisempfehlung des Herstellers, Stand …“; Aktionspreis nur mit Bezugspreis 30 Tage; Grundpreis, wenn Pflicht; Sprache de (en/fr/it AS28) |
| Rücklieferschein (AS20) | PH Lieferantenretoure | Positionen, Grund, Bezug Bestellung/Wareneingang | erscheint mit AS20 |

Druck-Styles 03 §10 (Bodoni-Moda-Wortmarke im Kopf, Instrument Sans, Tinte). Fehler: „PDF nicht erzeugt · Erneut versuchen“ mit Kennung.

---

## 13. Mobile, iPad, Kiosk

| Kontext | Gerät | Umfang | Besonderheiten |
|---|---|---|---|
| **Showroom-iPad** (Arbeitsplatz Backoffice) | iPad quer/hoch | Produkte als Kacheln (Standard ≥ 768 px Touch), Produktakte lesend: Bilder (Lightbox: Wischen + Pfeilknöpfe 44 px, Schließen oben rechts 44 px), Ausführungen als Farbfelder, Preis mit Stand, Lieferzeit (nur freigegeben, mit Bezugspunkt), Datenblatt drucken/teilen, „In Merkliste des Kunden“ (CRM) | **Kundenansicht** beim Start des Showroom-Geräts an: Kennzeichen „Kundenansicht“ im Kopf, EK, Notizen, Konditionen und Systemdaten nicht im DOM. Zurück zur Mitarbeiteransicht nur per Tippen + Bestätigung + Neuladen. Touch-Ziele ≥ 44 px, keine Hover-Abhängigkeit (`⋯`-Knopf) |
| **Packtisch-Kiosk** (`(kiosk)/packtisch`, Kachel „Wareneingang“) | 10–13″ quer, Scanner, Kamera | S3 im Kiosk-Raster (03 §6.3): „Heute erwartet“, Scan `HB-…`, „Lieferant wählen“, Positionen als große Zeilen mit Stepper (− / Menge / +, 64 px), Zustand-Chips mit Untertitel, Kamera-Knopf je Position, „Alles in Ordnung“, „Buchen“ (F6) | Scanner-Eingabe Enter-terminiert, nie in Textfelder (02 §9.5); F2 suchen, F6 Buchen, F7 Foto, F8 Problem melden (Abstimmung Logistik, W21); Begründungen gesperrter Knöpfe als Text unter dem Knopf („Foto fehlt bei Position 2“); Mehrmenge als `warning` „mehr als bestellt (Rest 2)“, nicht gesperrt; Verbindungsband 05 §12.4; offline: Erfassung lokal puffern, Buchen erst online (05 §12.5), Fotos lokal halten |
| **Montage mobil** | Smartphone | „Lieferung beim Kunden bestätigen“ (§5.9), Foto als Nachweis | erst mit AS23; sonst ausgeblendet |
| **Smartphone Backoffice** | < 768 px | Sortiment lesend, Freigaben (ansehen, Knöpfe „Freigeben“/„Ablehnen“; Wischen legt nur die Knöpfe frei, entscheiden braucht einen Tipp), Preis erfassen (Vollbild-Sheet), Abweichung klären (Segment) | Tabellen als Karten (03 §8.7), Tabs als Segment-Scroller, Seitenleiste als Sheet |

---

## 14. Automationen und Erinnerungen

### 14.1 Vorhanden (Scheduler `hooks.py`, Europe/Vienna)

| Wann | Funktion | Wirkung | UI |
|---|---|---|---|
| täglich 05:10 | `tasks.preisstand_pruefen` | rechnet `aktueller_preis_cent`, `aktueller_preis_stand`, `preisstand_alt` neu; bei Änderung Website-Aktualisierung | „Zu tun: Preis veraltet“ ändert sich morgens; Zeitpunkt des Laufs fehlt (AS11-T) |
| Mo–Fr 08:00 | `tasks.ab_erinnerung` | je überfälliger Bestellung ein ToDo an jede aktive Leitung (einmal, solange offen) | Glocke, „Zu tun – Meine“ |
| täglich 02:30 | `tasks.zaehler_aktualisieren` | `produkte_anzahl`/`es_gibt_produkte` je Marke und Kategorie | Zähler |
| jede Änderung Produkt/Marke/Ausführung | `ereignisse.website_aktualisieren` | Cache leeren, Version hochzählen, Aktualisierung gedrosselt (60 s) | durch verzögerten Commit erst nach dem Undo-Fenster |
| PH Anfrage gespeichert (ph_crm) | `ereignisse.anfrage_produkt_verknuepfen` | Merklisten-Slug → Link PH Produkt | Verknüpfungen |
| Wareneingang angelegt | `verbuchen` → `lieferung_verbuchen` | Mengen + Status der Bestellung | Bestellung live |
| Wareneingang gespeichert (ph_logistik) | `wareneingang_aktualisiert` | Lagerbewegung je Position | „Bestand gebucht“ |
| Bestellung gespeichert | `terminaenderungen_protokollieren`, `wunschtermin_schaetzen` | Terminänderungs-Zeilen, ToDo an Besteller; Wunschtermin-Vorschlag | Tab Lieferung |

### 14.2 Vorgeschlagen (fehlt in ph_sortiment)

| Automation | Auslöser | Wirkung | Anfrage |
|---|---|---|---|
| AB automatisch nachfragen | Frist + 0 Tage, nach Einstellung | `ab_nachfragen` mit Standardtext; Kommentar | AS14 |
| Preis läuft ab | 30 und 7 Tage vor `gueltig_bis` | Aufgabe an Team mit Link „Preis bestätigen“ | AS14 |
| Händlervertrag läuft aus | 60 und 14 Tage vor `vertrag_gueltig_bis` | Aufgabe an Leitung; Claims-Ampel gelb | AS14 |
| Liefertermin überschritten | `bestaetigter_termin < heute`, nicht geliefert | Aufgabe an Ersteller + Hinweis an Auftrag/Projekt | AS14 |
| Bildfreigabe nachfassen | 14 Tage nach `bildfreigabe_anfordern`, Status offen | Aufgabe „nachfassen“ (bis dahin legt die UI die Aufgabe beim Anfordern an) | AS14 |
| Reklamation ohne Antwort | 5 Werktage nach `reklamation_melden`/`schaden_melden`, kein Fortschritt | Aufgabe an Leitung | AS14 |
| Bildfreigabe abgelaufen | `bildfreigabe_bis < heute` | Bilder der Marke auf „Freigabe offen“, Aufgabe an Leitung | AS10-B |
| Fotos mit Personenbezug löschen | Ende Gewährleistung/Regress | Löschlauf | AS30 |

Alle Erinnerungen erscheinen in der Glocke (05 §7) mit Direktaktion; „Später (morgen 8:00)“ verschiebt das ToDo-Datum.

---

## 15. Recht und Buchhaltung (Regeln in der Oberfläche)

Fachliche Hinweise, keine Rechtsberatung; vor Livegang Steuerberater/Anwalt.

### 15.1 Preisauszeichnung (PrAG, UWG)

| Regel | Umsetzung | App |
|---|---|---|
| Preisermäßigung nur mit niedrigstem Preis der letzten 30 Tage (PrAG § 9a) | Preis-Sheet Live-Zeile, Freigabe-Tab Preise zeigt den Bezugspreis, Datenblatt/Website zeigen Aktionspreis nur mit Bezugspreis; ohne 30 Tage Geschichte Warnung „Ermäßigung nicht bewerbbar“ | `tiefstpreis_30_tage_cent` + API (AS24) |
| UVP nur als österreichische Herstellerempfehlung inkl. 20 % USt | Preisbasis Pflicht im Import, Land der Empfehlung am Preis; DE/CH → Herstellerpreis intern | `preisbasis`, `land_der_empfehlung` (AS5) |
| UVP-Kennzeichnung | fester Text „Unverbindliche Preisempfehlung des Herstellers, Stand {stand}“ in Akte, Datenblatt, Website | – |
| Grundpreis bei Pflicht-Kategorien | Checkliste-Blocker, berechneter Grundpreis | `grundpreis_cent`, Prüfung in `pruefe_veroeffentlichung` (AS6) |
| Kein Preis ohne Stand – auch Varianten | Ausführungs-Aufpreise nicht auf die Website, Matrixpreise mit Stand und Freigabe | AS2 |
| Preisfreigabe durch die Leitung | Team sendet `freigegeben=0` | `freigegeben` permlevel 1, Standard 0 (AS3) |
| Ausstellungsstück-Abverkauf | Zustand Pflicht, Bezugspreis bei Rabattwerbung | `zustand_text` (AS12) |

### 15.2 Umsatzsteuer, RKSV

- USt-Satz am Artikel/Kategorie: **20 / 13 / 10 / 0 %** mit Klartext (E12, AS8; Migration `normal → 20`, `ermaessigt` je Kategorie manuell mit Liste). 19 % (Mittelberg PLZ 6991–6993, Jungholz 6691) entscheidet Faktura/Kassa nach Lieferort.
- Bestellung: EK und VK immer **netto** (AS9). UI-Labels „EK netto“, „VK netto“.
- Lieferant: Land als ISO-Code, UID mit Formatprüfung und Prüfdatum (Vorsteuerabzug § 11 UStG); Strecke ins Ausland → Band „Reihengeschäft/Ausfuhr“ (AS10).
- Kassa (RKSV): bekommt eindeutigen Satz, `titel` als handelsübliche Bezeichnung und `ausfuehrung_text` als Zusatz; liest Preise ungecacht oder mit `get_katalog_version` (Abhängigkeit Kassa).

### 15.3 Fernabsatz, Gewährleistung (FAGG, VGG)

- „Nach Kundenwunsch gefertigt“ (`kundenspezifisch`) an Produkt und Ausführung, weiter an die Bestellposition (AS12); Shop zeigt den Hinweis zum fehlenden Rücktrittsrecht.
- Lieferzeit-Freigabe: Person als Link User, serverseitig gesetzt, nur Leitung; Bezugspunkt `lieferzeit_ab` (Bestellung / Zahlungseingang / Aufmaß-Planfreigabe) in Text und Standardtext (AS7).
- Ausstellungsstück: Zustandsbeschreibung auf Bon und Rechnung.

### 15.4 Buchhaltung, Warenwirtschaft

| Regel | Umsetzung | App |
|---|---|---|
| Fremdwährung | Kürzel aus dem Dokument, Kurs + Kursdatum Pflicht beim Senden, EUR-Gegenwert grau; Verkaufspreise nur EUR; bis AS1-W Fremdwährung gesperrt | AS1-W |
| Bezugskosten | Abschnitt „Zusatzkosten“ an Bestellung und AB-Abgleich | AS15 |
| Wert des Wareneingangs | EK netto je Position (Leitung), Report „Wareneingänge ohne Rechnung“ zum Stichtag | AS15 |
| Rechnung ↔ Wareneingang ↔ Bestellung | „berechnet n von m Stück“; Abschließen erst bei gedeckter Menge oder Leitung mit Grund | AS25 (ph_faktura) |
| Lieferanten-Vorkasse | Zahlungsbedingung, Betrag, bezahlt am; Chip „Vorkasse offen“; „Termin ab Zahlung“ | AS17 |
| Skonto | Lieferantenakte verlinkt offene Rechnungen mit Skontofrist | ph_faktura |
| Aufbewahren statt löschen (BAO § 132) | Löschen nur bei Entwürfen (E7) | `on_trash`-Sperren (AS13) |

### 15.5 Datenschutz (DSGVO)

- Kommission auf Herstellerbelegen nach `kommission_format` (Standard Auftragsnummer, Kundenname nur bei Kunde direkt); Hinweis „enthält Kundendaten“ im Senden-Dialog (AS21). Datenschutzerklärung/AGB: Weitergabe an Hersteller/Spedition prüfen (Inhaber, §19 O7).
- Fotos (Wareneingang, Strecke): Hinweis an der Kamera „Keine Personen fotografieren“; Kennzeichen `personenbezug` + Löschfrist (AS30).
- Ansprechpartner von Lieferanten: Aufgabe zum Prüfen, wenn der Lieferant inaktiv wird.

---

## 16. Datenmapping UI → Frappe

Lesen über das Fundament (`getList`/`getDoc`/`count`/`getReport`/`getKanban` mit Feldlisten, kein `*`), Schreiben über die Server-Aktionen. „ASn“ = Anfrage an die App (§16.3).

### 16.1 Lesen

| UI | DocType / Report / Methode | Felder / Filter |
|---|---|---|
| Bereichsstart Kennzahlen | 3 Number Cards + abgeleitete Zählung | §3.1 |
| „Zu tun“ | PH Herstellerbestellung (`status`, `lieferant`, `gesendet_am`, `abweichungen_offen`, `bestaetigter_termin`, `bezug_*`), PH Lieferant (`ab_erwartet_tage`, Sammelabfrage), Report `PH Preisstand aelter als 3 Monate`, PH Produkt (`status = Geprueft`), Report `PH Produkte ohne Bildfreigabe`, PH Produkt Preis (`freigegeben = 0`, über Elternabfrage), PH Preisliste Import (`status = Geprueft`), PH Marke (`vertrag_gueltig_bis`), PH Wareneingang (`status = Reklamiert`, `servicefall_ref`) | §3.1 |
| Produktliste | PH Produkt | §3.2 |
| Produktakte | `getDocMitInfo PH Produkt` (mit Kindtabellen) + `getList PH Produkt Ausfuehrung {produkt}` | §4.1 |
| Verknüpfungen | `count` auf PH Anfrage Produkt, PH Beleg Position, PH Kassenbeleg Position, PH Bestellung Position, PH Herstellerbestellung Position, PH Wareneingang Position, PH Lagerbestand, PH Planung Position, PH Projekt Position, PH Produktpass, PH Servicefall | bis AS11-M |
| Marken / Akte | PH Marke (+ `produkte_ohne_freigabe`) | §3.4, §4.2 |
| Lieferanten / Akte | PH Lieferant (+ `offene_bestellungen`, `liefertermin`), Report Liefertermintreue | §3.5, §4.5 |
| Bestellungen / Akte | PH Herstellerbestellung (+ `terminaenderungen`, `ab_abgleich`), `getKanban`, `getTransitions` | §3.6, §4.3 |
| Anzahlung Kunde | `getValue PH Auftragsbestaetigung (anzahlung_soll_cent, anzahlung_ist_cent, status)` | Leserecht prüfen (AS1/AS11) |
| Wareneingänge / Akte | PH Wareneingang | §3.8, §4.4 |
| Freigaben | PH Produkt (`bilder_offen > 0`) → `getDoc` je Produkt; PH Marke `bilder`; PH Produkt Preis; PH Produkt (`lieferzeit_freigegeben = 0`) | bis AS11-M höchstens 50 je Marke |
| Preislisten | PH Preisliste Import (+ `vorschau`) | §3.10, A11 |
| Berichte | 6 Reports (+ 2 mit AS14/AS15), 4 Charts | §3.13 |
| Einstellungen | Single PH Sortiment Einstellungen | §3.14 |
| Suche ⌘K | `ph_core.api.suche` Bereich `sortiment`: PH Produkt, PH Marke, PH Herstellerbestellung, PH Wareneingang | Muster `HB-YYYY-#####`, `WE-YYYY-#####`; `PH-PLI-…` (AS29) |

### 16.2 Schreiben

| UI-Funktion | Server-Aktion | DocType.Feld / Methode | Anfrage |
|---|---|---|---|
| Produkt anlegen (Schnellanlage) | `speichernDokumentAction` | insert PH Produkt | AS16 |
| Inline-Edit | `setzeWertAction` | PH Produkt Feld | – |
| Produkt-Workflow | `workflowAktionAction` (verzögert, wo §7) | Workflow „PH Produkt“ | – |
| Preis erfassen / bestätigen | `dokumentMethodeAction` | `preis_hinzufuegen` (Team `freigegeben=0`) | AS3 |
| Preis freigeben | `speichernDokumentAction` (verzögert) | `preise[i].freigegeben` | AS3 |
| VK aus EK vorschlagen | `dokumentMethodeAction` | `vk_vorschlag(anlegen=1)` | – |
| Bild hochladen | `/api/datei` + Save | `bilder[i].bild`, `quelle_url`, `abgerufen`, `typ` | AS32 |
| Bild freigeben/ablehnen | `speichernDokumentAction` / `massenaktionAction` (verzögert) | `bilder[i].freigabe`, `freigabe_datum`, `freigabe_beleg` | AS4, AS11-M |
| Lieferzeit freigeben | `setzeWertAction` × 3 (verzögert) | `lieferzeit_freigegeben`, `_datum`, `_durch` | AS7 |
| Ausführung anlegen / ändern | `dokumentMethodeAction` / `speichernDokumentAction` | `ausfuehrung_anlegen` / PH Produkt Ausfuehrung | AS11-M |
| Konfiguration prüfen | `dokumentMethodeAction` | `variante_berechnen(auswahl)` | – |
| Website jetzt aktualisieren / Vorschau | `dokumentMethodeAction` | `website_cache_erneuern` / `website_url(sprache)` | AS28 (Marke) |
| Duplizieren / Ausstellungsstück | `dokumentMethodeAction` + Save | `duplizieren`, `ausstellungsstueck_anlegen`, `zustand_text` | AS12 |
| Marke speichern | `speichernDokumentAction` | PH Marke (Server prüft Händlerstatus, Claims, Bilder) | – |
| Bildfreigabe anfordern / Freigabe erhalten (S4) | `dokumentMethodeAction` / `speichernDokumentAction` | `bildfreigabe_anfordern` / `bildfreigabe_status`, `_beleg`, `_datum` | AS10-B |
| Lieferant anlegen / speichern | `dokumentMethodeAction` / `speichernDokumentAction` | `lieferant_anlegen` / PH Lieferant | AS10 |
| Bestellung anlegen/ändern | `speichernDokumentAction` | PH Herstellerbestellung + `positionen` (`idempotency_key`) | AS9, AS22 |
| Senden | `dokumentMethodeAction` | `per_email_senden` | AS1, AS21 |
| Als gesendet markieren | `workflowAktionAction` + `kommentarAction` | `Senden` | – |
| AB nachfragen | `dokumentMethodeAction` | `ab_nachfragen(nachricht)` | – |
| AB einlesen | `dokumentMethodeAction` | `ab_einlesen(...)` | §19 O2 |
| Abgleich neu erzeugen | `dokumentMethodeAction` | `ab_abgleich_erzeugen` | – |
| Bewerten / Klären | `dokumentMethodeAction` | `abweichung_bewerten` / `abweichung_klaeren` | AS22 |
| Termin ändern | `dokumentMethodeAction` | `termin_aendern(termin, position, grund, quelle)` | AS31 |
| AB bestätigen / Abschließen / Stornieren | `workflowAktionAction` | Workflow „PH Herstellerbestellung“ | AS25 |
| Storno anfragen / bestätigen | `dokumentMethodeAction` / `speichernDokumentAction` | `storno_anfragen` / Storno-Felder | AS18 |
| Rest stornieren | `dokumentMethodeAction` | `rest_stornieren(positionen, grund)` | AS19 |
| Lieferung beim Kunden bestätigen | `dokumentMethodeAction` | `lieferung_bestaetigen(mengen, datum, nachweis)` | AS23 |
| Export | `dokumentMethodeAction` | `export_schnittstelle(format)` | – |
| Wareneingang buchen (S3) | `speichernDokumentAction` (insert) | PH Wareneingang + `positionen`, `fotos` | AS16, AS23, AS26 |
| Schaden melden / Reklamation | `dokumentMethodeAction` | `schaden_melden(beschreibung, regress)` / `reklamation_melden` | AS28 |
| Korrektur Wareneingang | – (Aufgabe) | – | AS14-K |
| Rücksendung | – (Aufgabe) | – | AS20 |
| Preisliste anlegen/einlesen/Spalten | `speichernDokumentAction` + `dokumentMethodeAction` | insert, `datei_einlesen`, `vorschau`, `mapping_speichern` | AS5, AS33 |
| Abgleichen / Übernehmen / Verwerfen | `dokumentMethodeAction` / `workflowAktionAction` | `pruefen`, `uebernehmen` / `Verwerfen` | – |
| Katalog-Import | Bereichs-Action → `client.call` | `importer.katalog.importieren_aus_anhang` | – |
| Kategorie/Merkmal | `speichernDokumentAction` / `setzeWertAction` | PH Kategorie, PH Merkmal | AS8, AS12 |
| Einstellungen | `speichernDokumentAction` | PH Sortiment Einstellungen | AS11-T, AS21 |
| Kommentar / CSV | `kommentarAction` / `exportCsvAction` (ohne permlevel 1 für das Team) | – | – |
| Leitung bitten / anfragen | Bereichs-Action | insert PH Aufgabe | – |

### 16.3 Anfragen an die App `ph_sortiment` (neu nummeriert, ersetzt L1–L16)

Prio **A** = vor Livegang des Bereichs, **B** = vor Shop-/Kassa-Anbindung, **C** = danach. Spalte „bis dahin“ = Verhalten der Oberfläche ohne die Änderung (Schalter in `schalter.js`, §20.3).

| # | Änderung | Prio | Grund | Bis dahin |
|---|---|---|---|---|
| AS1 | `anzahlung_pruefen()`, `anzahlung_kunde_soll/ist_cent` (ro), `senden_trotz_anzahlung_grund` | A | Bestellung erst nach Kundenanzahlung | UI liest den Auftrag per `getValue`; ohne Recht Haken „Anzahlung geprüft“ |
| AS1-W | Fremdwährung: `kurs`, `kurs_datum`, `summe_ek_eur_cent`; `netto_ek_eur_cent`; Preise nur EUR; `abgleich._cent(v, waehrung)`; `gueltiger_preis` filtert Währung | A | falsche Preise und Summen | Fremdwährung in Bestellung und Verkaufspreis gesperrt |
| AS2 | Variantenpreise mit `stand`, `quelle`, `quelle_url`, `freigegeben*`, `gueltig_bis`; API nur freigegebene; `aufpreis_cent`/`preis_cent` nicht mehr in der API | A | kein Preis ohne Stand | Matrix lesend + Band; UI sendet keine Aufpreise |
| AS3 | `PH Produkt Preis.freigegeben` permlevel 1; `preis_hinzufuegen` Standard 0, 1 nur Leitung; Parameter `beleg`, `zusatz_*` | A | Preisfreigabe wirksam | Team sendet `freigegeben=0` |
| AS4 | `PH Produkt Bild.freigabe` permlevel 1; `erteilt` nur mit Beleg oder Markenfreigabe | A | Urheberrecht | Regel nur in der UI |
| AS5 | `PH Preisliste Import.preisbasis` (Pflicht), `PH Produkt Preis.land_der_empfehlung`; `uebernehmen` sperrt UVP ≠ AT-brutto | A | DE-UVP nicht als AT-Preis | UI-Sperre in A11, Land in `zusatz_de` |
| AS6 | Grundpreis-Prüfung in `pruefe_veroeffentlichung`, `grundpreis_cent` (ro) | B | Preisauszeichnung | UI-Blocker, Grundpreis clientseitig |
| AS7 | `lieferzeit_freigabe_durch` → Link User, ro, serverseitig; Freigabe nur Leitung; `lieferzeit_ab` | A | FAGG-Nachweis | UI setzt die angemeldete Person, nur Leitung sieht den Knopf |
| AS8 | `ust_klasse` → `20|13|10|0` an Produkt und Kategorie (Migration) | B | eindeutiger Satz für Kassa/Faktura | Anzeige „normal = 20 %“, „ermäßigt = Satz unklar – Leitung prüft“ |
| AS9 | Position `vk_cent` → `vk_netto_cent`, `summe_vk_cent` netto; Label „EK netto“ | A | Netto/Brutto vermischt | UI rechnet brutto → netto vor dem Schreiben |
| AS10 | `PH Lieferant.land` → Link Country, `uid`-Prüfung + `uid_geprueft_am`, Nummernkreis `LF-.#####`; `PH Herstellerbestellung.lieferland`, `reihengeschaeft` (ro) | B | UStG, Umfirmierung | ISO-Auswahl schreibt Text; Name für Team gesperrt |
| AS10-B | `PH Marke.bildfreigabe_umfang` (MultiSelect), `bildfreigabe_bis` | B | Umfang Website/Social/Druck | Kommentar; Marketing-Download gesperrt |
| AS11 | Rechte: Bestellung + Faktura `r` (Leitung pl1 `r`); Projekte nur `r` + „Bestellung anfragen“; Ausführung + Logistik/Marketing/Service `r`; Produkt + Shop Mitarbeiter `r` | A | Rollen konsistent | UI blendet Schreibwege für Projekte aus |
| AS11-M | Sammelmethoden `bilder_freigeben(produkte, beleg)`, `offene_bildfreigaben(marke)`, `produkt_verwendung(name)`, `ausfuehrungen_anlegen` | B | Last + ein Protokolleintrag | n Aufrufe, max. 50 je Marke |
| AS11-T | `PH Sortiment Einstellungen.preisstand_letzter_lauf` | C | Sichtbarkeit Scheduler | Zeile entfällt |
| AS12 | `kundenspezifisch` an Produkt, Ausführung, Bestellposition (ro); `zustand_text` (Pflicht bei Abverkauf) | B | FAGG § 18, VGG | Felder nicht angezeigt; Zustand als Text in `kurz_de` + Kommentar |
| AS13 | `on_trash`: Bestellung nur Entwurf ohne `gesendet_am`; Preisliste nur ohne Übernahme; Produkt nur Entwurf ohne Preisgeschichte und Verwendung | A | BAO § 132 | UI zeigt Löschen nur in diesen Fällen |
| AS14 | Report „Preise laufen ab“, `ab_faellig_am` beim Senden; Automationen §14.2 | B | vorausschauend arbeiten | clientseitige Fristberechnung; Nachfass-Aufgabe beim Anfordern |
| AS14-K | `PH Wareneingang.korrektur_von`, `art` (Eingang/Korrektur), negative Mengen nur Leitung mit Grund | B | Fehlbuchung umkehrbar | „Korrektur anfragen“ (Aufgabe) |
| AS15 | Kindtabelle `PH Herstellerbestellung Kosten`; WE-Position `ek_netto_cent` (pl1), `wert_cent`; Report „Wareneingänge ohne Eingangsrechnung“ | B | Anschaffungskosten, Stichtag | Hinweis interne Notiz |
| AS16 | `idempotency_key` auf PH Produkt und PH Wareneingang; Sperre doppelter Lieferschein | A | Doppelanlage | Vorabprüfung im Client |
| AS17 | `zahlungsbedingung`, `anzahlung_lieferant_cent`, `anzahlung_bezahlt_am` | C | Lieferanten-Vorkasse | Kommentar |
| AS18 | Storno-Felder, `storno_anfragen(nachricht)`, doc_event aus Faktura-Storno | A | Kundenstorno | Aufgabe + Haken/Beleg im Storno-Dialog |
| AS19 | Workflow `Teilgeliefert → Rest stornieren → Geliefert` (Leitung), `rest_stornieren` | A | Teillieferung abschließbar | Menüpunkt fehlt; „Zu tun“-Hinweis |
| AS20 | DocType `PH Lieferantenretoure` + Rücklieferschein | C | Retoure | Aufgabe |
| AS21 | `kommission_format` in Einstellungen | B | Datenminimierung | Vorbelegung Auftragsnummer |
| AS22 | Kommentarpflicht bei `abgelehnt`; Positionssperre ab Gesendet + `nachtrag_noetig`/`nachtrag_nr` | A | Nachvollziehbarkeit | UI-Sperre, Nachtrag als Kommentar + Nachfrage |
| AS23 | `wareneingang_vorschlag()`; `wareneingang_anlegen` nur mit `bestaetigt=1`; `direktlieferung` + `lieferung_bestaetigen` | B | keine Fehlbuchung, Strecke | Restformel im Client; Strecke gesperrt |
| AS24 | `tiefstpreis_30_tage_cent` (ro) + API, Validierung Aktionspreis/Abverkauf | B | PrAG § 9a | Berechnung im Client, nur Warnung |
| AS25 | Eingangsrechnung je Wareneingang/Position (ph_faktura), Abschließen-Bedingung | B | sachliche Prüfung bei Teilrechnung | Hinweis statt Sperre |
| AS26 | `PH Wareneingang Position.ueberlieferung_entscheidung` | B | Mehrmenge | Kommentar + Aufgabe |
| AS27 | Website-Aktualisierung frühestens 10 s nach Speichern, zusammengefasst (optional, E1) | C | Entlastung | verzögerter Commit |
| AS28 | Datenblatt mehrsprachig; Protokoll-PDF als Reklamationsanhang; `website_url` für Marken | C | Kundenkommunikation | de; Pfad clientseitig |
| AS29 | Nummernkreis `PH-PLI` in ph_core, Suchmuster | C | README „offen“ | Suche über Titel |
| AS30 | `PH Wareneingang Foto.personenbezug` + Löschfrist | C | DSGVO | Hinweis an der Kamera |
| AS31 | Terminänderung `kunde_informiert_kanal`, `kunde_informiert_am` | B | Kunde ohne E-Mail | Kanal als Kommentar |
| AS32 | Verkleinerung auf `bild_max_px` beim Upload (Inhalt unverändert) | C | Ladezeit Website | Hinweis |
| AS33 | Excel-Import in `datei_einlesen` | C | uneinheitliche Herstellerlisten | Hinweis „als CSV speichern“ |

### 16.4 Korrigierte Befunde gegenüber der ersten Fassung

Bereits in der App (am 2026-11-04 gegen die JSONs und `@frappe.whitelist`-Methoden geprüft), daher keine Lücke mehr: Leserechte Faktura/Kassa/Projekte/Marketing/Logistik/Service auf PH Produkt; Logistik auf PH Wareneingang (alte L1, B10) · `ab_nachfragen` (alte L10 teilweise) · `vorschau`, `mapping_speichern`, Formate DataNorm/IDM-XML/XML, Mapping je Lieferant (alte L9 bis auf Excel) · `schaden_melden`, `differenz`, `mengen_abweichung`, `unterlieferung`/`ueberlieferung` · `abweichung_klaeren` · `termin_aendern` + `terminaenderungen` · `wunschtermin_schaetzen`, `liefertermin`, `lieferzeiten`, `betriebsurlaub` · `ab_ausfuehrung_text` · `idempotency_key` auf PH Herstellerbestellung · `einkaufspreise`, `vk_vorschlag`, Kalkulation der Marke, `variantenpreise`, `variante_berechnen`, `preisgruppe`, `nicht_kombinierbar_mit`, `abverkauf_*` · API `bestellungen_sammeln`.

---

## 17. Akzeptanzkriterien (QA)

Prüfung auf Staging mit Mock- und Frappe-Adapter; Rollen: Team Sortiment, Leitung Sortiment, GF, Logistik, Verkauf (Faktura), Projekte, Marketing. Fälle mit „(ASn)“ gelten erst, wenn die App-Änderung geliefert ist; davor wird das „bis dahin“-Verhalten aus §16.3 geprüft.

**Außenwirkung und Undo**
1. Kein Einzelzeichen außer `1`/`3` bei Fokus im Freigabe-Raster ändert eine Bildfreigabe; `Enter` und `Backspace` dort ohne Schreibwirkung.
2. Kanban-Drop nach „Veröffentlicht“ öffnet den Veröffentlichen-Dialog; Abbrechen → Karte 200 ms zurück, kein Serveraufruf (Netzwerk-Mock).
3. Bildfreigabe, Rückgängig nach 3 s: kein Serveraufruf, die Website-API liefert das Bild zu keinem Zeitpunkt. Tab schließen während des Fensters → Commit per `sendBeacon` genau einmal.
4. Wischen am Smartphone allein ändert keinen Datensatz.
5. Mails (Senden, AB nachfragen, Rückfrage beim Hersteller, Bildfreigabe anfordern, Storno anfragen, Reklamation) laufen nur über einen Dialog mit Vorschau; kein Einzelkürzel löst sie aus.

**Produkte**
6. Produkt ohne freigegebenes Bild: „Veröffentlichen“ gesperrt mit „Fehlt: freigegebenes Bild“; Kanban-Drop springt 200 ms zurück mit Toast; kein Serveraufruf.
7. Entwurf ohne Kategorie/Marke/deutschen Text: „Zur Veröffentlichung geben“ zeigt die fehlenden Punkte; nach dem Ergänzen wird der Knopf ohne Neuladen aktiv.
8. Kategorie ohne USt-Satz oder mit Grundpreispflicht ohne Grundpreis: Veröffentlichen gesperrt mit Text.
9. Kurztext mit „Vertragshändler“ oder „€“: Fundstelle wird beim Tippen markiert; die Servermeldung erscheint am Feld, ohne Eingabeverlust und ohne das Wort „Claim-Guard“.
10. Preis mit Quelle Herstellershop ohne URL: Speichern gesperrt mit „Quelle (URL) fehlt – nie schätzen“.
11. Team erfasst einen Preis: Haken „Freigeben“ nicht sichtbar, gesendet wird `freigegeben=0`; der Preis erscheint in Freigaben › Preise. Per API mit `freigegeben=1` → Serverfehler (AS3).
12. Nach „Preis erfassen“ zeigen Kopf, Liste und „Zu tun“ den neuen Stand ohne Neuladen; Undo (Team) entfernt die Zeile.
13. „Wird angezeigt bis“ = Stand + 3 Monate (Verkaufspreis) bzw. + 6 (UVP), Monatsende gekappt (31.08. + 6 → 28./29.02.).
14. Aktionspreis ohne Vorpreis in den letzten 30 Tagen: Warnung „Ermäßigung nicht bewerbbar“; mit Vorpreis zeigt die Live-Zeile den niedrigsten Preis und sein Datum.
15. UVP mit Land DE: wird nicht als UVP angezeigt; Speichern als Herstellerpreis mit Hinweis.
16. Variante mit Matrixpreis ohne Stand: Website zeigt für diese Kombination „Preis auf Anfrage“ (AS2); bis dahin Band in der Akte, Matrix lesend.
17. Team sieht nirgends `einkaufspreis_cent`, `einkaufspreise`, `notizen`, `haendlervertrag`, `konditionen`, `summe_ek_cent`, `ek_cent` – auch nicht in CSV, Seitenblick, Druck, Suche oder DOM.
18. Vorschau öffnet für Welt Küche + Importquelle Katalog `/<sprache>/kuechengeraete/produkte/<slug>`, sonst `/<sprache>/produkte/<kategorie>/<slug>`.
19. Duplizieren erzeugt einen Entwurf mit neuer Web-Adresse; die Bildzustände der Kopie entsprechen der Serverantwort.
20. Schnellanlage: Esc vor „Anlegen“ legt nichts an (Rückfrage nur mit befüllten Feldern); nach „Anlegen“ existiert genau ein Entwurf, auch bei Doppelklick.
21. Ausstellungsstück mit Abverkauf ohne Zustandsbeschreibung: Speichern gesperrt (AS12; bis dahin Pflichtfeld im Dialog).
22. Auslaufen lassen eines Produkts in einem offenen Kundenauftrag: gesperrt mit Text.

**Marken, Lieferanten**
23. Händlerstatus „Vertragshändler“ ohne Vertrag, Beleg-Adresse und Notiz: Speichern gesperrt, Hinweis vor dem Senden.
24. „autorisiert“ in `story_de` ohne Händlerstatus: Markierung live, Serverfehler am Feld.
25. Vertrag endet in < 60 Tagen: rotes Band, Zeile in „Vertrag läuft aus“, „Zu tun“-Zeile für die Leitung.
26. Lieferant ohne Bestell-E-Mail: Senden, AB nachfragen und Rückfrage beim Hersteller gesperrt mit „Keine Bestell-E-Mail – Portal öffnen / anrufen“; „Als gesendet markieren“ verlangt „Gesendet über“.

**Bestellung, AB, Wareneingang**
27. Senden-Dialog zeigt die PDF-Vorschau des Formats aus den Einstellungen; danach Status Gesendet, Zeitleiste „Bestellung per E-Mail an … gesendet“, `gesendet_am` gesetzt.
28. Bestellung aus Auftrag mit offener Anzahlung: Team kann nicht senden; Leitung nur mit Grund → Kommentar in der Zeitleiste.
29. Bestellung in CHF ohne Kurs: Senden gesperrt („Kurs fehlt“); Beträge zeigen „CHF“, nie „€“ (AS1-W; bis dahin Fremdwährung gesperrt).
30. Senden-Dialog zeigt „enthält Kundendaten“, wenn Kundenname oder -adresse im PDF stehen.
31. A10 mit AB-Termin 17 Tage nach Wunsch und Toleranz 0: genau eine Zeile „Termin · +17 Tage“; leere AB-Felder erzeugen keine Zeile; abweichende Ausführung erzeugt „Ausführung weicht ab“.
32. Team bei einer Abweichung: „AB bestätigen“ gesperrt („Eine AB mit Abweichungen bestätigt die Leitung“); Rückfrage zählt als offen.
33. Bewerten: 5 Zeilen mit `1`/`2`/`↓` in ≤ 10 Tastendrücken; `⌘Z` stellt die letzte Bewertung her; Fokus springt auf die nächste offene Zeile; Screenreader liest Zeile, Feld, Abweichung und Bewertung.
34. Team: „Ablehnen“ gesperrt mit sichtbarem Grund; „OK“ bei Preiszeilen gesperrt; Leitung ohne Kommentar beim Ablehnen: Feld Pflicht.
35. „Rückfrage › Beim Hersteller“ zeigt eine Mail-Vorschau; nach dem Senden steht `klaerung` und `geklaert_am` in der Zeile.
36. „Abgleich neu erzeugen“ behält Bewertungen unveränderter Zeilen; fragt nur nach, wenn Bewertungen verloren gehen.
37. Termin ändern ohne Grund: gesperrt; mit Grund: Zeile in „Terminänderungen“; „Kunde informiert“ verlangt den Kanal.
38. S3 bucht erst bei „Buchen“; Abbrechen vorher erzeugt keinen Wareneingang und ändert `menge_erhalten` nicht.
39. Zustand „beschädigt ab Werk“ ohne Foto/Hinweis: Buchen gesperrt; mit Foto: Status Reklamation, Menge zählt als erhalten, Primär „Schaden melden …“.
40. Mehrmenge 3 statt 2: Buchen verlangt die Entscheidung annehmen/zurücksenden.
41. Teilmenge 1 von 2: Bestellung Teilweise geliefert, „1 von 2“; zweite Buchung: Geliefert, `geliefert_am` gesetzt.
42. Zweite Buchung desselben Lieferscheins an einem zweiten Gerät: Fehler „Schon gebucht als WE-…“, keine Doppelmenge.
43. Packtisch: Scan `HB-2026-00038` öffnet die Bestellung in ≤ 1 s (05 §13); Scannerzeichen landen nie in Textfeldern; Scan ohne offene Bestellung zeigt „Lieferant wählen“ und „Ohne Bestellung melden“; offline bleibt „Buchen“ mit Status „wartet“.
44. Gebuchter Wareneingang: Mengen schreibgeschützt; „Löschen“ fehlt; „Korrektur anfragen“ legt eine Aufgabe an.
45. Teilweise geliefert, Leitung „Rest stornieren“: Bestellung Geliefert, Position „Rest storniert“ (AS19).
46. Gesendete Bestellung: „Löschen“ fehlt im Menü; API-Aufruf → „Stornieren statt Löschen (Aufbewahrungspflicht)“ (AS13).
47. Stornieren ab Gesendet nur mit bestätigtem Storno und Beleg; Bestellentwurf stornieren mit Undo, ohne Dialog.
48. Die Übergänge „Teillieferung buchen“/„Lieferung buchen“ erscheinen nirgends als Knopf.

**Freigaben, Preislisten, Import**
49. Marke ohne schriftliche Bildfreigabe: „Freigeben“ erst nach Beleg-Upload aktiv; eine Quelle-URL allein reicht nicht.
50. Freigabe von 10 Bildern: eine Bestätigung über den Toast, Fortschritt, Undo stellt alle 10 zurück (kein Serveraufruf).
51. Team sieht Freigaben nur lesend mit „Leitung bitten“.
52. Preisliste mit +20 % bei Schwelle 15: Zeile `danger-text` + Icon, `uebernehmen` aus; Team kann „Übernehmen“ nicht auslösen.
53. Preisliste mit Preisbasis „brutto Deutschland 19 %“ und Preisart UVP: Übernehmen als UVP gesperrt mit Text.
54. Doppelte Preiszeile beim Übernehmen: Vorprüfung listet die Zeilen, „auslassen und übernehmen“ funktioniert.
55. Unbekannte Spalten: Zuordnung per Auswahl, `mapping_speichern`; die nächste Liste desselben Lieferanten erkennt sie.
56. Katalog-Import „Jetzt importieren“ ist vor einem Probelauf derselben Datei gesperrt.

**Allgemein, Sprache, Barrierefreiheit, Bewegung**
57. Kein sichtbarer Rohwert (`Geprueft`, `Uebernommen`, `beschaedigt`, `Kueche`, `freisteller`, `Anfrage laeuft`) und keine Technikwörter (Claim-Guard, Slug, Website-Cache, Revalidate) – Text-Snapshot aller Routen; Ausnahme Systemdaten (Leitung).
58. Kein UI-Text verwendet „prüfen“ oder „Freigabe“ in mehr als einer Bedeutung (Glossar §2).
59. Übersicht: jede Zahl genau einmal, ≤ 10 Blöcke, leere Gruppe erscheint nicht; 1280 × 800 zeigt mindestens 3 Gruppen „Zu tun“ mit Knöpfen.
60. Keine Akte mit mehr als 5 Tabs; je Region höchstens ein Primärknopf (axe-/Unit-Regel).
61. Produktliste bei 1280 × 800 mit offener Seitenleiste ohne horizontalen Scroll; bei 200 % Zoom erste Spalte fixiert.
62. Bildreihenfolge, Hauptbild und Kategorienbaum vollständig per Tastatur änderbar; Undo stellt den alten Stand her.
63. Graustufen-Screenshot: alle Bildzustände und Preiszustände unterscheidbar.
64. Kein Text in Sand unter 18,66 px fett; Δ % unter der Schwelle in `ink-soft` (Kontrast-Scan hell/dunkel).
65. Kürzel-Registry: kein Bereichskürzel überschreibt ein globales; `Alt+←/→` ohne App-Wirkung; Einzeltasten abschaltbar; Einzelbuchstaben wirken nicht in Eingabefeldern.
66. Erstaufbau ohne Zahlenanimation; Kennzahländerung nach einer Aktion 400 ms; kein `--bo-ease-spring` außer gültiger Kanban-Ablage; reduzierte Bewegung = Opazität ≤ 120 ms.
67. Jede Liste unterscheidet Leer nie / gefiltert / erledigt, Fehler (mit Kennung) und Laden (Skeleton nach 300 ms); alle Texte aus §8 sind als Mock-Szenario abrufbar.
68. Tastatur allein: Produkt anlegen, Preis erfassen, AB einlesen (A10) und Bewerten vollständig ohne Maus; Fokus nach Dialog zurück auf den Auslöser.
69. Showroom-iPad: Kundenansicht beim Start an; nach Umschalten auf Mitarbeiteransicht steht kein EK im DOM vor dem Neuladen.
70. Badges hell/dunkel mit Kontrast AA; Status nie nur über Farbe.
71. Kategorie „Bücher“ mit USt 10 %: Produkt zeigt „10 % – z. B. Bücher“, die Kassa-Position zeigt 10 % (AS8, Abhängigkeit Kassa); vor AS8 zeigt „ermäßigt“ den Hinweis „Satz unklar – Leitung prüft“.

---

## 18. Was hier geht und in SHD/Branchensoftware nicht

| # | Fähigkeit | Wie es dort üblich ist | Umsetzung hier |
|---|---|---|---|
| 1 | „Status & Website“-Checkliste je Produkt mit Sprung zur Lücke | Warenwirtschaft und Webshop getrennt, Sync; was online steht, sieht man erst im Shop | gleiche Regeln wie `pruefe_veroeffentlichung`, Vorschau in 4 Sprachen |
| 2 | Preis mit Stand und Ablaufdatum, „Preis bestätigen“, 30-Tage-Bezugspreis | Preise als Stammdatum ohne Prüfdatum | `preise`-Historie, `gueltig_bis`, Scheduler, Live-Zeile PrAG § 9a |
| 3 | Händlerwort-Prüfung beim Tippen, Händlerstatus mit Beleg | keine Prüfung von Texten | `DEALER_WORDS`/`HAENDLER_RE`, Claims-Bericht |
| 4 | Freigabe-Schreibtisch für Herstellerbilder mit Beleg und Umfang | Bilder als Anhänge ohne Rechtsstatus | Kachelraster, Markenbeleg, verzögerter Commit |
| 5 | AB-Abgleich neben dem PDF mit Tasten 1/2/3 und Klärungswegen | in SHD über das Zusatzmodul kiwi (Referenzdatei), sonst Sichtprüfung | A10, `abweichung_klaeren`, Protokoll-PDF |
| 6 | Bestellung erst nach Kundenanzahlung, Storno und Reststorno als geführte Wege | Prüfung per Hand | Senden-Dialog, §5.3–§5.5 |
| 7 | Wareneingang am Kiosk mit Pflichtfoto und „Schaden melden“ (Servicefall + Regress) | getrennte Masken | S3, `schaden_melden` |
| 8 | Nachfrage am Produkt: Merklisten/Anfragen der Website neben Bestellungen und Verkäufen | Webshop-Merklisten erreichen die Warenwirtschaft selten | `ph_sortiment_produkt` aus ph_crm |

---

## 19. Offene Entscheidungen (Inhaber / Fundament)

| # | Frage | Vorschlag | Bis zur Entscheidung |
|---|---|---|---|
| O1 | Darf das Team „Preis bestätigen“ (gleicher Betrag, neuer Stand, Quelle-URL) selbst freigeben? | ja – Betrag unverändert, Quelle belegt; neue Beträge gibt die Leitung frei | nur die Leitung gibt frei (E5) |
| O2 | Erhält das Team Lese-/Schreibrecht auf EK (permlevel 1) in Bestellung und AB? | ja für Bestellung/AB (Preisabgleich), nein für Produkt-EK und Kalkulation | EK erfasst die Leitung |
| O3 | Anzahlungsregel: Prozentsatz oder voller Sollbetrag? Ausnahmen (Stammkunde, Objekt) als feste Gründe? | Sollbetrag aus dem Auftrag, Gründe als Auswahl + Freitext | Sollbetrag, Freitext |
| O4 | `duplizieren`: Bildfreigaben behalten (Code) oder zurücksetzen (Docstring)? | behalten, wenn Marke schriftlich erteilt; sonst zurücksetzen | UI zeigt den Serverstand |
| O5 | Fremdwährung jetzt bauen (AS1-W) oder bis auf Weiteres sperren? | sperren, bis ein CHF-Lieferant aktiv ist | gesperrt |
| O6 | Abschließen nur nach Rechnungsprüfung (AS25)? | ja, Leitung mit Grund als Ausnahme | Hinweis |
| O7 | Datenschutzerklärung/AGB: Weitergabe von Name/Adresse an Hersteller und Spedition | prüfen lassen | Kommission = Auftragsnummer |
| O8 | Fundament: `G`-Akkord für Sortiment (W20), Report-PDF `/druck/report/[name]`, Kürzel-Registry F3, verzögerter Commit F2 | `G A` (Artikel) | Palette, CSV |

---

## 20. Bauauftrag

Vor dem Bau: `AGENTS.md` beachten – die Next.js-Version weicht ab; die Leitfäden in `backoffice/node_modules/next/dist/docs/` (Routen, `params`/`searchParams`, Server Actions, Caching) lesen und Deprecation-Hinweise befolgen. Muster der vorhandenen Fundament-Seiten (`src/app/[bereich]`, `src/app/d/[doctype]`, `src/app/druck/[doctype]/[name]`) übernehmen.

### 20.1 Dateien und Routen (`backoffice/`)

```
src/app/sortiment/
  layout.js                         Unternavigation (Tabs nach Rechten, Zähler-Badges), keine Sitzungsprüfung im Layout
  page.js  loading.js               Bereichsstart „Zu tun“ + 4 Kennzahlen
  produkte/page.js  loading.js      Liste | Kacheln | Kanban (?ansicht=), ?neu=produkt öffnet Schnellanlage
  produkte/[slug]/page.js  loading.js   Produktakte (?tab=produkt|preise|ausfuehrungen|texte|verlauf)
  marken/page.js  marken/[marke]/page.js
  lieferanten/page.js  lieferanten/[name]/page.js
  bestellungen/page.js  bestellungen/neu/page.js  bestellungen/[name]/page.js
  bestellungen/[name]/ab/page.js    Assistent A10
  wareneingang/page.js  wareneingang/neu/page.js (S3, ?bestellung=)  wareneingang/[name]/page.js
  freigaben/page.js                 ?art=bilder|preise|lieferzeiten&marke=
  preislisten/page.js  preislisten/neu/page.js (A11 Schritt 1–2)  preislisten/[name]/page.js (Schritt 3–4)
  kategorien/page.js  merkmale/page.js
  import/page.js
  berichte/page.js  berichte/[report]/page.js
  einstellungen/page.js
src/components/Backoffice/Sortiment/      (Liste 20.2)
src/lib/backoffice/sortiment/
  actions.js        "use server" – alle Mutationen (20.3)
  daten.js          server-only Lesefunktionen (Zu tun, Kennzahlen, Akten, Verknüpfungen, Freigaben)
  texte.js          Glossar §2, Ergebnistexte, Leer-/Fehlertexte §8, Mailvorlagen-Vorschau
  status.js         Badge-Töne je DocType/Wert
  regeln.js         rein: checkliste(produkt, marke, kategorie), gueltigBis(stand, preisart, einst), tiefstpreis30(preise, ausfuehrung, heute),
                    bruttoZuNetto(cent, satz), restmengen(bestellung), abweichungLive(soll, ist, toleranz), sperrgrund(doc, aktion, rollen),
                    darfLoeschen(doc), anzahlungOffen(auftrag), ustAnzeige(klasse)
  schalter.js       Fähigkeiten je AS-Nummer (vorhanden ja/nein, aus Meta-Feldern/Methoden erkannt) → „bis dahin“-Verhalten §16.3
  zuTun.js          Gruppen-Bausteine (auch für die Zentrale)
  kuerzel.js        Belegung §6 für die Kürzel-Registry
src/lib/backoffice/mock/   Seed-Ergänzung Sortiment über die bestehende Erweiterungsstelle
tests/unit/backoffice-sortiment-*.test.mjs    tests/e2e/sortiment.spec.js, sortiment-kiosk.spec.js
```
Einträge: `bereiche.js` (Unterseiten Sortiment), `ROUTEN`-Register (6 DocTypes), `suche.js` (Palette „> neues produkt“, „> neue bestellung“, „> ab einlesen“, „> preisliste“, Nummernmuster `HB-`, `WE-`). Packtisch: Sortiment liefert die Komponente `KioskWareneingang`; eingehängt wird sie von der Packtisch-Seite `(kiosk)/packtisch` (Logistik-Bauauftrag).

### 20.2 Komponenten (`components/Backoffice/Sortiment/`)

| Komponente | Art | Zweck |
|---|---|---|
| `SortimentTabs` | Server | Unternavigation mit Zähler-Badges |
| `ZuTunListe`, `ZuTunZeile` | Server + Client-Zeilen | §3.1, auch Zentrale |
| `ProduktListe` (DataTable), `ProduktKacheln`, `ProduktKanban` (auf `Kanban`), `BildZelle`, `PreisZelle` | Client | §3.2 |
| `SchnellanlageProdukt` | Client | §3.3 inkl. Dublettenhinweis |
| `Seitenblick` | Client | Sheet 480 px (Produkt, Bestellung) |
| `ProduktKopf`, `StatusWebsiteCheckliste`, `Verknuepfungen` | Server/Client | §4.1 |
| `BilderAbschnitt`, `BildKachel`, `BildZustand` | Client | Dropzone, `text/uri-list`, Reihenfolge per Menü/Tastatur, Icon + Text |
| `PreisSheet` (erfassen/bestätigen), `PreisVerlauf` (Stufenlinie + Tabelle), `EinkaufTabelle`, `PreisMatrix` | Client | §4.1 Tab Preise |
| `AusfuehrungenTab`, `AusfuehrungenAssistent` (S2), `KonfigurationPruefen` | Client | §4.1, §5.8 |
| `TexteSeo`, `HaendlerwortMarkierung` | Client | live-Prüfung, Zähler |
| `AusstellungsstueckDialog`, `VeroeffentlichenDialog` | Client | §4.1, §5.1 |
| `MarkenListe`, `MarkenLogos`, `MarkeKopf`, `HaendlerstatusTab`, `KalkulationAbschnitt`, `BildfreigabeErhalten` (S4), `BildfreigabeAnfordern` | Client | §3.4, §4.2 |
| `LieferantenListe`, `LieferantDialog`, `LieferantAkte` | Client | §3.5, §4.5 |
| `BestellungenListe`, `BestellungenKanban`, `BestellFormular`, `PositionenTabelle`, `WunschterminVorschlag` | Client | §3.6, §3.7 |
| `SendenDialog`, `AnzahlungBand`, `KundendatenHinweis`, `MailVorschauDialog` (Nachfrage, Rückfrage, Storno, Reklamation) | Client | §5.2–§5.3 |
| `BestellKopf`, `Vorgangsleiste` (auf `WorkflowLeiste`), `AbgleichTabelle` (`role="grid"`), `BewertungSegment` (`radiogroup`), `RueckfrageMenue`, `TerminAendernDialog`, `Terminaenderungen` | Client | §4.3 |
| `AbEinlesenAssistent` (A10), `PdfSplit` | Client | §5.8 |
| `StornoDialog`, `RestStornierenDialog`, `NachtragDialog`, `StreckeBestaetigenDialog` | Client | §5.3–§5.5, §5.9 (hinter Schaltern) |
| `WareneingangAssistent` (S3), `MengenStepper`, `ZustandChips`, `KioskWareneingang`, `SchadenMeldenDialog`, `WareneingangAkte` | Client | §5.8, §4.4, §13 |
| `FreigabeSchreibtisch`, `MarkenSpalte`, `FreigabeRaster` (`role="grid"`), `FreigabeFuss`, `Lightbox`, `PreisFreigaben`, `LieferzeitFreigaben` | Client | §3.9 |
| `PreislistenListe`, `PreislisteAssistent` (A11), `SpaltenZuordnung`, `PreislisteZeilen` | Client | §3.10, §5.8 |
| `KategorienBaum` (Menü-Verschieben), `KategorieFormular`, `MerkmaleTabelle` | Client | §3.11 |
| `KatalogImport`, `SortimentBericht`, `SortimentEinstellungen` | Client/Server | §3.12–§3.14 |
| `LeitungBitten` | Client | Knopf + Dialog → PH Aufgabe |

Wiederverwendet: `Shell`, `Seitenkopf`, `DataTable`, `Filterleiste`, `Kanban`, `Formular`, `Kindtabelle`, `LinkFeld`, `Datumsfeld`, `WorkflowLeiste`, `Zeitleiste`, `Kennzahl`, `Charts`, `StatusBadge`, `Leer`, `Fehler`, `Bestaetigen`, `Toast`, `Segment`, `Knopf`, `KioskShell`. Neu im Fundament benötigt (F-Anfragen §20.7): `Sheet`, `useVerzoegerterCommit`, Kürzel-Registry, `Lightbox`.

### 20.3 Server Actions (`lib/backoffice/sortiment/actions.js`)

Alle: `requireSession()`, Recht (`darfDoc`) und Rolle erneut prüfen, Eingaben per zod, Rückgabe `{ ok, code, message, fehler?, undo? }`, `modified` bei Saves (Konfliktmeldung §8.2), Idempotenz-Schlüssel bei mehrstufigen Aktionen, keine Personen- oder EK-Daten im Log. Aktionen mit Außenwirkung laufen über die Commit-Registry (`commitAction({ token })` des Fundaments).

| Action | Prüfung | Frappe |
|---|---|---|
| `produktAnlegenAction({ marke, kategorie, name, artikelnr, weitere })` | create; Dublette erneut | `getList PH Produkt` (slug/artikelnr) → `insert PH Produkt` |
| `produktFeldAction({ name, feld, wert, modified })` | write; Feld-Whitelist | `setValue` |
| `produktWorkflowAction({ name, aktion })` (verzögert bei Veröffentlichen/Pausieren/Reaktivieren) | Transition erlaubt, `regeln.sperrgrund` | `workflowAction` |
| `produkteMassenAction({ namen[], aktion, wert? })` | je Dokument wie oben | `massenaktionAction` |
| `preisErfassenAction({ produkt, brutto_cent, stand, preisart, quelle, quelle_url, ab?, ausfuehrung?, variante?, beleg?, zusatz?, land? })` | write; Team → `freigegeben=0`; URL-Pflicht; Dublette | `runDocMethod preis_hinzufuegen` bzw. `save PH Produkt` (Beleg/Zusatz) |
| `preisBestaetigenAction({ produkte[], quelle, quelle_url })` | wie oben | `runDocMethod preis_hinzufuegen` je Produkt |
| `freigabeAction({ art: bild|preis|lieferzeit, ziele[], entscheidung, beleg?, grund? })` (verzögert) | Leitung; Markenbeleg oder Beleg; Grund bei Ablehnen | `getDoc` + `save PH Produkt` / `save PH Marke` je Ziel; `uploadFile` für Beleg; `kommentar` |
| `bildHochladenAction({ produkt, dateien[], quelle_url, typ })` | write | `uploadFile` + `save` |
| `bildReihenfolgeAction({ produkt, reihenfolge[] })` | write | `save` |
| `ausfuehrungenAnlegenAction({ produkt, gruppen[], optionen[] })` | write | `save` (Gruppen) + `runDocMethod ausfuehrung_anlegen` je Option |
| `produktMethodeAction({ name, methode, args })` | Whitelist `website_cache_erneuern|website_url|duplizieren|ausstellungsstueck_anlegen|vk_vorschlag|variante_berechnen` | `runDocMethod` |
| `markeSpeichernAction`, `markeMethodeAction({ methode: bildfreigabe_anfordern|lieferant_anlegen|produkte_ohne_freigabe })`, `bildfreigabeErhaltenAction({ marke, beleg, umfang[], bis? })` | write; Leitung für Freigabe | `save`/`runDocMethod`/`uploadFile`/`kommentar`; optional `insert PH Aufgabe` (nachfassen) |
| `lieferantSpeichernAction` | write; Format-Prüfungen | `insert`/`save PH Lieferant` |
| `bestellungSpeichernAction({ doc, modified })` | write; Team ab Gesendet keine Positionsänderung | `save`/`insert PH Herstellerbestellung` |
| `bestellungSendenAction({ name, empfaenger, nachricht, anzahlungGrund? })` | Positionen, Lieferant, E-Mail, Anzahlung (`getValue PH Auftragsbestaetigung`), Kurs | `kommentar` (Grund) → `runDocMethod per_email_senden` |
| `alsGesendetMarkierenAction({ name, weg })` | write | `workflowAction Senden` + `kommentar` |
| `bestellungMethodeAction({ name, methode, args })` | Whitelist `ab_nachfragen|ab_einlesen|ab_abgleich_erzeugen|abweichung_bewerten|abweichung_klaeren|termin_aendern|export_schnittstelle` + Rollenregeln (Ablehnen, Preis akzeptieren) | `runDocMethod` |
| `bestellungWorkflowAction({ name, aktion, grund?, beleg? })` | Transition erlaubt; nie `Lieferung buchen`/`Teillieferung buchen` | `workflowAction` (+ `uploadFile`, `kommentar`) |
| `wareneingangBuchenAction({ bestellung, kopf, positionen[], fotos[], idempotency })` | write; Restmengen neu berechnet; Doppelbuchung; Foto/Hinweis-Pflicht; Mehrmenge entschieden | `getDoc PH Herstellerbestellung` → `getList PH Wareneingang` (Lieferschein) → `uploadFile` → `insert PH Wareneingang` |
| `wareneingangMethodeAction({ name, methode: schaden_melden|reklamation_melden, args })` | write | `runDocMethod` |
| `preislisteAnlegenAction({ rahmen, datei })`, `preislisteMethodeAction({ name, methode: datei_einlesen|vorschau|mapping_speichern|pruefen|uebernehmen })`, `preislisteZeileAction({ name, zeile, produkt?, uebernehmen? })` | write; `uebernehmen` nur Leitung; UVP/Basis-Sperre; Dublettenvorprüfung | `uploadFile`, `insert`, `runDocMethod`, `save` |
| `katalogImportAction({ file_url, trockenlauf, nur_marke })` | Leitung/Admin; Probelauf derselben Datei | `call ph_sortiment.importer.katalog.importieren_aus_anhang` |
| `kategorieAction`, `merkmalAction`, `einstellungenAction` | write / Leitung | `insert`/`save`/`setValue` |
| `leitungBittenAction({ doctype, name, anliegen, text })` | Sitzung | `insert PH Aufgabe` |
| `anfrageAction({ art: korrektur|ruecksendung|bestellung|storno, bezug, text, positionen? })` | Sitzung | `insert PH Aufgabe` |

### 20.4 Frappe-Aufrufe (Lesen, `daten.js`)

`getList`/`count`: PH Produkt, PH Produkt Ausfuehrung, PH Marke, PH Lieferant, PH Herstellerbestellung (+ Position über Parent-Filter), PH Wareneingang, PH Preisliste Import, PH Kategorie, PH Merkmal, PH Aufgabe/ToDo (Zu tun „Meine“); Verknüpfungen: PH Anfrage Produkt, PH Beleg Position, PH Kassenbeleg Position, PH Bestellung Position, PH Lagerbestand, PH Planung Position, PH Projekt Position, PH Produktpass, PH Servicefall (je `hasPermission` vorher, fehlend → Block entfällt). `getDocMitInfo` für Akten (Zeitleiste). `getTransitions` für Knöpfe. `getKanban` (Boards `PH Produkte`, `PH Herstellerbestellungen`). `getValue PH Auftragsbestaetigung` (Anzahlung, Status). `getReport`: 6 Reports (+ AS14/AS15). Number Cards über `count` mit identischen Filtern. `runDocMethod` lesend: `offene_bestellungen`, `liefertermin`, `produkte_ohne_freigabe`, `vorschau`, `website_url`. `getPdf` für Druckformate. `searchLink` für Link-Felder. `getMeta` für `schalter.js` (Feld vorhanden?). `ph_core`: `globalSearch`, `recentActivity`.

### 20.5 Reihenfolge

| Schritt | Inhalt | Ergebnis |
|---|---|---|
| 0 | Next-Doku im Paket lesen (AGENTS.md); Fundament-Stand prüfen: F2 verzögerter Commit, F3 Kürzel-Registry, Sheet | Bauweise geklärt |
| 1 | `texte.js`, `status.js`, `regeln.js`, `schalter.js`, `kuerzel.js` + Unit-Tests; Mock-Seed (12 Marken inkl. ohne Händlerstatus und ohne Bildfreigabe, 4 Lieferanten inkl. ohne E-Mail und CH, 60 Produkte in allen Zuständen inkl. Ausstellungsstück und Grundpreis-Kategorie, 15 Bestellungen über alle Status inkl. Strecke, Teillieferung, Abweichungen, ohne Lieferant, 6 Wareneingänge inkl. Reklamation und Mehrmenge, 3 Preislisten) | reine Module grün |
| 2 | Layout/Tabs, Routen, `ROUTEN`, Suche, Rechte-Weichen | Navigation vollständig |
| 3 | Produktliste (Liste/Kacheln/Kanban, Filter, Ansichten, Massenaktionen, Seitenblick) + Schnellanlage | Produkte finden und anlegen |
| 4 | Produktakte Tab Produkt (Bilder, Checkliste, Lieferzeit & Shop, Stammdaten, Verknüpfungen) + Veröffentlichen-Dialog | Produkt bis Veröffentlichung |
| 5 | Preise: Sheets, Tab Preise, Stufenlinie, Tiefstpreis 30 Tage, Einkauf, Matrix lesend | „Kein Preis ohne Stand“ sichtbar |
| 6 | Ausführungen + S2, Texte & SEO mit Händlerwort-Prüfung, Verlauf | Akte vollständig |
| 7 | Freigabe-Schreibtisch (Bilder, Preise, Lieferzeiten) mit verzögertem Commit | Außenwirkung gesichert |
| 8 | Marken (Liste, Logos, Akte, S4, Bildfreigabe anfordern), Lieferanten (Liste, Dialog, Akte) | Stammdaten Einkauf |
| 9 | Bestellungen: Liste/Kanban, Formular, Senden-Dialog mit Anzahlung, Kundendaten, Als gesendet markieren | Bestellung bis Gesendet |
| 10 | Bestellakte, A10, Bewerten/Klären, Termin ändern, AB nachfragen, Abschließen | Kette bis AB bestätigt |
| 11 | S3 Wareneingang (Büro), Akte, Schaden melden; danach `KioskWareneingang` | Wareneingang Büro + Kiosk |
| 12 | Preislisten A11 + Lauf | Preislisten-Import |
| 13 | Bereichsstart „Zu tun“ + Kennzahlen + Zentrale-Bausteine | Bereichsstart |
| 14 | Kategorien/Merkmale, Katalog-Import, Einstellungen, Berichte + Charts, Druck-Anbindung | Rest Phase A |
| 15 | Storno-, Reststorno-, Nachtrag-, Strecke-Dialoge hinter Schaltern (Fallback „Leitung bitten“/Aufgabe) | Schalter vorbereitet |
| 16 | E2E zwei Rollen, axe hell/dunkel, Text-Snapshots (Glossar), Motion-Spec, Screenshots Leer-/Fehlerzustände | Abnahme |
| 17 (Phase B) | Schalter einzeln aktivieren, sobald AS-Nummern geliefert sind (Reihenfolge Prio A → B → C) | Fallbacks entfallen |

### 20.6 Aufwand (Agent-Stunden, Schätzung)

| Schritt | h |
|---|---|
| 0 Vorbereitung | 1 |
| 1 Grundlagen + Seed + Unit-Tests | 6 |
| 2 Navigation/Routen/Rechte | 2 |
| 3 Produktliste + Schnellanlage | 9 |
| 4 Produktakte Tab Produkt | 8 |
| 5 Preise | 6 |
| 6 Ausführungen, Texte, Verlauf | 7 |
| 7 Freigabe-Schreibtisch | 6 |
| 8 Marken + Lieferanten | 7 |
| 9 Bestellliste, Formular, Senden | 8 |
| 10 Bestellakte + A10 + Klären | 9 |
| 11 Wareneingang Büro + Kiosk | 9 |
| 12 Preislisten A11 | 5 |
| 13 Bereichsstart + Zentrale | 4 |
| 14 Kategorien, Import, Einstellungen, Berichte, Druck | 6 |
| 15 Storno/Rest/Nachtrag/Strecke hinter Schaltern | 3 |
| 16 E2E, axe, Snapshots, Motion | 8 |
| **Phase A gesamt** | **104** |
| Phase B (je geliefertem AS 0,5–2 h, alle zusammen) | ca. 20 |

### 20.7 Abhängigkeiten zu anderen Bereichen

| Bereich | Braucht Sortiment | Liefert Sortiment | Ohne Lieferung |
|---|---|---|---|
| Fundament | F2 `useVerzoegerterCommit` + `/api/undo-commit`; F3 Kürzel-Registry mit Abschalter und Grid-Scope; `Sheet`, `Lightbox`; `G`-Akkordliste (W20); `/druck/report/[name]`; W16–W19, W22 in 02/03/04 nachziehen | – | Commit-Route im Bereich (wie Personal), Palette statt Akkord, Bericht nur CSV |
| Zentrale | Platz für Kacheln und „Zu tun“ | `zuTun.js`, 3 Kacheln, Heute-Chips | – |
| Faktura | Leserecht Auftragsbestätigung (Anzahlung, Status); doc_event Kundenstorno (AS18); Eingangsrechnung je Wareneingang/Position (AS25); Leserecht auf Bestellung (AS11); Weiterverrechnung Stornokosten | Bestellstatus, „berechnet n von m“, VK netto | Haken „Anzahlung geprüft“, Hinweis statt Sperre |
| Projekte | `bestellungen_sammeln` aufrufen; „Bestellung anfragen“ statt Schreibrecht | Termine, Terminänderungen „Projekt informiert“ | – |
| Logistik / Packtisch | Einhängen von `KioskWareneingang`; F-Tasten (F7 Foto, W21); Lagerort; `PH Speditionsauftrag` für Rücksendung; Kundenretouren | Wareneingang → Lagerbewegung | Aufgabe statt Rücksendung |
| Service | `ph_service` `aus_dokument` für `schaden_melden`; Regress | Servicefall-Chips | ToDo-Weg der Methode |
| Kassa | Preise ungecacht oder mit `get_katalog_version`; USt-Satz 20/13/10/0 (AS8); Zustandstext bei Ausstellungsstück | Produkt, Ausführung, Preis | – |
| Shop | Hinweis „nach Kundenwunsch“, `tiefstpreis_30_tage_cent` aus der API, nur freigegebene Preise, Grundpreis | Produktdaten | Shop zeigt keine Aktionspreise ohne Bezugspreis |
| CRM | Merklisten-Verknüpfung (vorhanden) | Produkt-Links | – |
| Marketing | Bild-Download nach Umfang (AS10-B) | freigegebene Bilder | Download gesperrt |
| App ph_sortiment | AS1–AS33 (§16.3) | – | „bis dahin“-Verhalten |

### 20.8 QA-Checkliste (Abnahme des Bauauftrags)

- [ ] Alle Fälle aus §17 (1–71) grün; Fälle mit „(ASn)“ im „bis dahin“-Verhalten geprüft.
- [ ] Unit: `regeln.js` (Checkliste, `gueltigBis` mit Monatsende, `tiefstpreis30`, `bruttoZuNetto` mit 20/13/10 %, `restmengen` mit stornierten Positionen, `abweichungLive` mit Toleranzen 0 und > 0, `sperrgrund` je Rolle, `darfLoeschen`), `texte.js` (jeder Rohwert hat eine Anzeige), `schalter.js` (Meta mit/ohne Feld).
- [ ] Text-Snapshot aller Routen gegen Glossar §2 (keine Rohwerte, keine Technikwörter, „prüfen“/„Freigabe“ eindeutig).
- [ ] Rollen-E2E: Team, Leitung, Logistik (Kiosk), Projekte (nur lesen + anfragen), Verkauf (lesen), Marketing.
- [ ] Netzwerk-Mock: kein Serveraufruf vor Ablauf des Commit-Fensters; `sendBeacon` bei Tab-Schließen.
- [ ] Keine EK-/Notiz-Daten im DOM, in CSV, Druck, Suche, Seitenblick für das Team und in der Kundenansicht.
- [ ] axe hell und dunkel: 0 serious; Kontrast-Scan Sand; Graustufen-Screenshot Bildzustände.
- [ ] Tastatur-Durchlauf: Schnellanlage, Preis erfassen, A10 + Bewerten, Freigabe-Raster, Kategorienbaum, Bilder-Reihenfolge.
- [ ] Viewports 1280 × 800 (Seitenleiste offen, kein horizontaler Scroll), iPad quer/hoch, Smartphone 390 px, Kiosk 1280 × 800 Touch.
- [ ] Motion-Spec: Dauern/Easing laut §9; reduzierte Bewegung.
- [ ] Leer-/Fehlerzustände §8 als Mock-Szenarien mit Screenshot.
- [ ] Offline-Emulation Packtisch: Buchen wartet und wird genau einmal gebucht.
- [ ] Performance: Bereichsstart und Produktliste ≤ Budget 05 §13; Scan → Bestellung ≤ 1 s.
- [ ] Kein Schreibweg für Projekte auf Bestellungen; kein Knopf „Lieferung buchen“; Löschen nur bei Entwürfen.

---

## 21. Änderungsprotokoll (Überarbeitung 2026-11-04)

### 21.1 Pflichtänderungen UX-Kritik (`20-kritik-ux-sortiment.md` §1)

| # | Pflichtänderung | Umgesetzt in |
|---|---|---|
| P1 | Außenwirkung nicht per Einzeltaste/Drop/Wischen | §3.9 (`1`/`3`, `Enter` = Lightbox, `Backspace` ohne Wirkung), §3.2 Kanban-Dialog, §13 Smartphone, §6 |
| P2 | Undo vor Website-Aktualisierung | E1 verzögerter Commit §7 (statt App-Debounce; AS27 optional) |
| P3 | Glossar „Prüfen/Freigabe/Aktiv“ | §2; E2: Produkt „Zur Veröffentlichung geben / Wartet auf Veröffentlichung“ statt „Wartet auf Freigabe“, damit „Freigabe“ eindeutig bleibt |
| P4 | Tastenkollisionen | §6 (vollständige Belegung, Liste der bewusst nicht belegten Tasten) |
| P5 | Schnellanlage statt Assistent S1 | §3.3; S1 entfällt, `/produkte/neu` entfällt (`?neu=produkt`) |
| P6 | Übersicht als „Zu tun“, 4 Kennzahlen, Charts in Berichte, keine Heute-Leiste im Bereich | §3.1, §11 |
| P7 | Akten ≤ 5 Tabs, ein Primärknopf, einheitliche Bezeichnungen | §4 (E4), Bestellakte „AB bestätigen“ sekundär |
| P8 | Bewegung nach 04 | §9 |
| P9 | Status nicht nur Farbe, Ziehen mit Alternative | §10, §3.2, §3.11, §4.1 |
| P10 | AB-Bewertung als Segment mit Undo | §4.3 (E3 mit `abweichung_klaeren`) |
| P11 | Leer- und Fehlerzustände | §8 (übernommen und ergänzt um Fachfälle) |
| P12 | Rohwerte/Technikwörter | §2 `texte.js`, QA 57 |
| K1–K18 | Klickzählung (§1.1), 7 Spalten (§3.2), Text statt Symbol (§3.2), „n von m frei“, Kanban nur Veröffentlichungsweg, Preis-Sheet 4 sichtbare Felder + „Weitere Angaben“, Freigabe-Haken Team (E5), Quelle für alle Bilder/`text/uri-list`/`⌘V`, „seit n Tagen“, Rollenetikett entfernt, kein `g o` (E11), Tabs (E9), Nachtrag (§5.4), Wareneingang-Texte, Zustand-Untertitel, „Händlerbeleg“, Markentext „5 Marken, 38 Bilder“, S4 einziger Weg | jeweilige Abschnitte |
| §2.2–§2.9 | Tastatur-, Undo-, Leerzustands-, A11y-, Modernitäts-, Mobile-, Motion-Ergänzungen | §6, §7, §8, §10, §3/§4, §13, §9 |
| §8 QS1–QS14 | QA-Ergänzungen | §17 (1–5, 20, 33, 43, 57–70) |
| §9 A1–A6 | Anfragen | A1 → AS27 (optional dank E1); A2/A3/A5 → §20.7 Fundament; A4 → §19 O1; A6 → §20.7 Logistik |

### 21.2 Pflichtänderungen Fachkritik (`21-kritik-fach-sortiment.md` §6, §7)

| # | Pflichtänderung | Umgesetzt in |
|---|---|---|
| §1.1 | falsch gemeldete Lücken korrigiert | §1.2, §16.4 (L1, B10, AB-Nachfrage, Spaltenzuordnung gestrichen bzw. umgebaut) |
| §1.2 | vorhandene Daten in die UI | Einkaufspreise, `vk_vorschlag`, Kalkulation Marke, Preismatrix, Preisgruppe/Ausschlüsse, Abverkauf, Preisart „Auf Anfrage“, Preislisten-Felder, Währung/Raum/Einheit, `terminaenderungen`, `wunschtermin_schaetzen`, `ab_ausfuehrung_text`, `idempotency_key` (§3.7, §4.1–§4.5, §5.8) |
| §1.3 | Rechte-Befunde | §1.2 neu, AS11 |
| P1 | Anzahlung vor Senden | §5.2 (E6), AS1 |
| P1-W | Fremdwährung | §3.7, §15.4, AS1-W, §19 O5 |
| P2 | Variantenpreise mit Stand | §4.1 Tab Preise/Ausführungen, AS2 |
| P3 | Preisfreigabe Leitung | E5, §4.1 Preis-Sheet, AS3 |
| P4 | 30-Tage-Tiefstpreis | §4.1, §15.1, AS24 |
| P5 | Preisbasis / DE-UVP | §5.8 A11, §4.1, AS5 |
| P6 | Grundpreis | §4.1 Checkliste, AS6 |
| P7 | Lieferzeit-Freigabe Link User, `lieferzeit_ab` | §3.9, §4.1, AS7 |
| P8 | USt 20/13/10/0 | E12, §3.11, §15.2, AS8 |
| P9 | Netto-Semantik Bestellung | §3.7, AS9 |
| P10 | Land/UID/Nummernkreis/Lieferland | §3.5, §4.5, §3.7, AS10 |
| P11 | Rechte konsistent | §1.2, §3.7 (Projekte „Bestellung anfragen“), AS11 |
| P12 | kundenspezifisch, `zustand_text` | §4.1, §15.3, AS12 |
| P13 | Löschschutz BAO | E7, §4, AS13 |
| P14 | Korrektur-Wareneingang | §3.8, §4.4, AS14-K |
| P15 | Bezugskosten, WE-Wert, Report | §3.7, §3.13, §15.4, AS15 |
| P16 | Rechnung je Wareneingang, Abschluss | §4.3, §15.4, AS25, §19 O6 |
| P17 | Lieferanten-Vorkasse | §11.2, AS17 |
| P18 | Kundenstorno | §5.3, AS18 |
| P19 | Rest stornieren | §5.5, AS19 |
| P20 | Lieferantenretoure | §5.10, AS20 |
| P21 | `kommission_format`, Kundendaten-Hinweis | §5.2, §15.5, AS21 |
| P22 | Bildfreigabe nur mit Beleg | §3.9, AS4 |
| P23 | Kommentarpflicht, Positionssperre | §4.3, §5.4, AS22 |
| P24 | `wareneingang_vorschlag`, `idempotency_key` WE, Strecke | §5.8 S3, §5.9, AS16, AS23 |
| §4 PP1–PP10 | Pflichtprozesse | PP1 §5.2 · PP2 §5.3 · PP3 §5.5 · PP4 §5.4 · PP5 §5.8/§4.4 (AS26) · PP6 §5.10 · PP7 §4.7 · PP8 §3.1/§4.3 · PP9 §4.4 · PP10 §4.3 |
| §5 R1–R17 | Randfälle | §5, §8.2, §17 (R1 → 47, R2 → §5.3, R3 → 45, R4 → 37, R5 → 28, R6 → §11.2, R7 → §5.10, R8 → 29, R9 → §4.3/AS31, R10 → 26, R11 → §3.7, R12 → E12, R13 → §4.3, R14 → 54, R15 → 42, R16 → §4.2, R17 → 22) |
| §3.6 R-D1–R-D3 | Datenschutz | §15.5, AS21, AS30, §4.5 |
| §3.7 RKSV | Kassa-Preis ungecacht, Ausführung in Position | §15.2, §20.7 |
| §7 1–10 | Redaktion | Kopfzeile (34 JSONs, `logik/*`), §1.2, §3.7, §4.1 Preise, §4.3, §4.4, §5.2 (E8), §5.8 A11, §11.2, §16.3 neu nummeriert |
| §8 33–45 | QA-Fälle | §17 (14, 11, 16, 53, 29, 28, 45, 46, 37, 40, 42, 71, 21) |

### 21.3 Weitere Änderungen

- Neu: §0.2 Entscheidungen E1–E12, §19 offene Entscheidungen, §20 Bauauftrag.
- Gestrichen: Assistent S1, Heute-Leiste im Bereich, Charts auf der Übersicht, Tab „System“ (→ `⋯ Mehr › Systemdaten`), Tab „Verwendung“ (→ Verknüpfungen), Donut, Hochzählen beim Laden, Feder beim Rücksprung, Sand-Puls, `Alt+←/→`, `[`/`]`, `⇧=`, `Backspace`-Ablehnen.
- Ersetzt: Lückenliste L1–L16 und Befunde B1–B10 durch AS1–AS33 (§16.3) mit „bis dahin“-Verhalten; B2 (S3 nutzt `wareneingang_anlegen` nicht) bleibt als Regel in §5.6; B4 → §19 O4; B8/B9 → §20.7.
