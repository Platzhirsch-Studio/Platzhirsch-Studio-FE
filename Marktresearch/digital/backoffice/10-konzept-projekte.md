# 10 – Konzept Bereich „Projekte“ (Auftragsmappe, Planung, Renderings, Montage, Abnahme, Nachträge, Fremdgewerke, Produktpass, Zeiten) – finale Fassung

**Zweck:** Verbindliches Funktions- und Oberflächenkonzept des Bereichs Projekte im eigenen Next.js-Backoffice (`backoffice/`, Port 3100, Route `/projekte`, Kiosk `/montage`) samt Bauauftrag für den Fachbereichs-Agenten „Projekte“. Herzstück ist die **Auftragsmappe** `/projekte/[projekt]` (SHD „Infocenter / digitale Auftragsmappe“). Datenschicht ist die Frappe-App `ph_projekte` (40 DocTypes, 5 Workflows, 5 Script Reports, 5 Druckformate, 4 Scheduler-Läufe) – für Mitarbeiter unsichtbar.
**Stand:** 2026-11-04 · **Fassung 2** (Überarbeitung nach `20-kritik-ux-projekte.md` und `21-kritik-fach-projekte.md`; alle Pflichtänderungen P1–P18 (UX) und P1–P23 (Fach) eingearbeitet, Protokoll in § 18). Status: Vorschlag, keine Entscheidung des Inhabers.
**Grundlage:** 01–05 (Benchmark, UX, Design-System, Motion, IA), `PLAN-NEXT-BACKOFFICE.md`, `Backend-Import/ph_projekte` (README, alle 40 DocType-JSONs im Stand 11:59 inkl. PH Aufmass, PH Nachtrag, PH Fremdgewerk Termin; Controller, `api/__init__.py`, `utils/*`, `fixtures/*`, `tasks.py`, `hooks.py`), Gegenseiten ph_faktura / ph_sortiment / ph_logistik / ph_service / ph_crm, `backoffice/src/lib/backoffice/{bereiche,actions}.js`, `frappe/client.js`, UI-Kit `components/Backoffice`, `VORBILD-SHD-sauter-held-2026-11-03.md`.
**Verbindlich aus 02/03/04/05:** eine Primäraktion je Seite (`⌘/Strg+Enter`), Undo statt Rückfrage (8 s, Mails 10 s), Filter in der URL, Skeleton statt Spinner, Token `--color-bo-*`, Dauern 120/160/200/240 ms mit `--bo-ease-out` (Eintritt) bzw. `--bo-ease-in` (Austritt, 120 ms), `--bo-dur-draw` 400 ms nur für Linien/Häkchen, Seitentypen T1–T9, Fehlercodes `invalid|forbidden|not_found|conflict|rate_limited|unavailable|auth`.
**Darstellungsregeln:** Gespeicherte App-Werte bleiben ASCII, die UI zeigt Umlaute (`Uebergabe` → „Übergabe“, `Kueche` → „Küche“, `Mit Maengeln` → „Mit Mängeln“, `Aenderung gewuenscht` → „Änderung gewünscht“). Beträge sind Cent (`*_cent`, permlevel 1) → `cent()`; ohne Leitungsrecht fehlt der ganze Block (nicht „—“). Datum de-AT. Fristen/Schwellen nur aus `PH Projekte Einstellungen` (Standardwerte dort: Feedback-Erinnerung 3 Tage, Sprachnotiz 5 MB, 120 Fotos je Projekt, Portal-Token 30 Tage, Montage-Tagesstunden 8). Interne Texte in Du-Form, Kundentexte in Sie-Form. Keine Emojis, Icons nur lucide mit Text oder `aria-label`. Klickzahlen sind Zielwerte für die Abnahme, keine Messwerte.
**Rechtlicher Hinweis:** Punkte mit „StB/DS/RA“ sind von Steuerberatung, Datenschutz bzw. Rechtsberatung zu bestätigen; das Konzept ist keine Rechtsberatung.

---

## 0. Entscheidungen dieser Fassung (Widersprüche aufgelöst)

| # | Frage | Entscheidung | Begründung |
|---|---|---|---|
| E1 | Mappe: 12 Tabs (Konzept) vs. 6 (UX P1) vs. zusätzliche Tabs Aufmaß/Nachträge/Kalkulation (Fach §6.1) | **Genau 6 Tabs:** Übersicht · Positionen · Planung · Belege & Lieferung · Montage · Dateien. Aufmaß = Abschnitt in `Planung`, Nachträge = Abschnitt in `Positionen`, Kalkulation = Leitungs-Abschnitt in `Belege & Lieferung` (hinter Schalter). Nachrichten/Zeitleiste/Daten → rechte Spalte „Aktivität \| Details“. Zeitplan → Mini-Gantt in `Übersicht`. | Einfachheit; neue Fachprozesse bekommen ihren Platz dort, wo Mitarbeiter sie fachlich suchen. |
| E2 | Undo bei Workflow-Vorwärtsaktionen ohne Rückweg für Mitarbeiter | **Verzögerter Commit (Variante A, 8 s)** für alle Workflow-Vorwärtsaktionen von Mitarbeitern (Primärknopf, Kanban-Drop, Kiosk-Zustandsknopf). Kein `setzeWert` auf `status`/`workflow_state`. `pagehide`/Seitenwechsel führt sofort aus (sendBeacon). | Umgeht keine Workflow-Rechte, braucht kein Backend. |
| E3 | Zwei Kundenunterschriften (Montagebericht + Abnahme, UX P4) vs. getrennte Rechtsbedeutung (Fach F6) | **Ein Ablauf „Abnahme mit Kunde“, eine Unterschrift** unter **einem** Text, der beide Erklärungen ausdrücklich enthält: „Ich bestätige die Ausführung der aufgeführten Leistungen am … und nehme das Werk ab – mit den genannten Vorbehalten.“ Das Abnahmeprotokoll ist das Beweisdokument; die Signatur wird mit Verweis auf das Protokoll am Montageauftrag hinterlegt. Ohne Werkabnahme (Kunde abwesend, Teilmontage ohne Teilabnahme, reine Regiearbeit) gibt es den Ablauf **„Nur Leistungsnachweis“** (Montagebericht-Unterschrift, eigener Text „Ich bestätige die Arbeitszeiten und Leistungen. Eine Abnahme ist damit nicht erklärt.“). | Kunde unterschreibt nie zweimal für dasselbe; jede Unterschrift hat genau einen lesbaren Erklärungstext (RA prüfen). |
| E4 | Phase folgt der Wirklichkeit (UX P6) vs. „kein stiller Phasensprung“ (Fach P21) | **Operative Fakten schieben die Phase** (Montage „In Arbeit“ → „Montieren“; alle Lieferscheine zugestellt → „Liefern“; Schlussabnahme unterzeichnet → „Übergeben“) mit Zeitleisteneintrag Quelle „System“. **Kaufmännische/rechtliche Schritte nie automatisch**: AB vorhanden → nur Hinweis „AB vorhanden – Beauftragen?“ für die Leitung; Abschließen nur über Prüfliste. Wo die Rolle die Transition nicht darf → Band „Phase anpassen“. | Phasenleiste stimmt; Verantwortung für Vertrag/Geld bleibt bei Menschen. |
| E5 | Kunde informieren: drei Varianten, eine ohne Vorschau | **Ein Muster überall** (§ 3.5): Toast nur für die Änderung, bleibender Chip „Kunde nicht informiert · Informieren …“, Sheet mit Vorschau, Senden mit 10-s-Commit, Rückmeldung des Zustellkanals; Kunde ohne E-Mail → „Nicht zugestellt“ mit Telefon-/Brief-Ausweg. | 02 §4.1, Fach B7 i, §5.6. |
| E6 | Kundensicht-Schalter ohne Vorschau-Methode | **Kein Schalter**, bis `portal_project_vorschau` existiert (Schalter `projekte.kundenvorschau`). Bis dahin Text „Kunde sieht“ / „Intern“ an jedem Element + Filter-Chip „Nur für Kunde sichtbar“. Präsentationsmodus und spätere Vorschau teilen die Komponente `KundenAnsicht`. | Ein Schalter zeigt, was er sagt. |
| E7 | Übergabedatum inline/ziehbar (Konzept) vs. Gewährleistungsbeginn (Fach B6/P6) | `uebergabe_am` ist in der UI **nie editierbar und nie ziehbar**; Chip zeigt Datum + Quelle („aus Abnahme PH-ABN-…“). Korrektur nur Leitung über `uebergabe_korrigieren(datum, grund)` (Anfrage A6); bis dahin gar nicht. | ABGB §§ 924, 933. |
| E8 | Auftragsmappe liest fremde Datensätze (Fach B1) | Das Backoffice nutzt aus `auftragsmappe()` **nur die ph_projekte-eigenen Listen**. Fremdbelege (Faktura, Sortiment, Logistik, Termine) liest es selbst mit **expliziten Bezugsfiltern** (§ 11.2); fehlt ein Filterfeld → Abschnitt „nicht verknüpft“, nie ungefiltert. Zusätzlich Server-Prüfung: jede Fremdzeile mit `kontakt ≠ projekt.kontakt` wird verworfen und geloggt (ohne Personendaten). | DSGVO Art. 5 Abs. 1 lit. f, Art. 32; baubar ohne Backend. |
| E9 | Summen falsch (Fach B2/B3) | **Keine berechneten Projektsummen**, bis A2 geliefert ist (Schalter `projekte.summen`): Karte „Zahlungsstand“ listet die Belege einzeln (Nummer, Art, Status, Betrag in Belegwährung, bezahlt am). Kalkulation erst mit A3 (Schalter `projekte.kalkulation`). | Keine falschen Zahlen. |
| E10 | Mengen sind Ganzzahlen (Fach B4) | Bis A4 Mengen nur ganzzahlig eingeben, Einheit ausgeblendet, Hinweis am Feld „Dezimalmengen folgen – 3,6 lfm vorerst in der Ausführung notieren“. Mit Schalter `projekte.mengen_dezimal`: Dezimal (3 Stellen) + Einheit. | Keine stille Rundung: Eingabe „3,6“ wird abgelehnt statt zu 3. |
| E11 | Unterschrift nachträglich änderbar (Fach B5) | UI ruft `unterschrift_erfassen` **nur**, wenn noch keine Unterschrift vorhanden ist (Server Action prüft vorher per `getValue`). Nach Unterzeichnung ist die Abnahme in der UI vollständig readonly außer `erledigt/erledigt_am/servicefall_ref`. Backend-Sperre A5 ist **Livegang-Blocker** für Abnahmen. | Beweisfunktion des Protokolls. |
| E12 | Tastatur: 45 Kürzel, 14 Kollisionen (UX P10) | Einzelbuchstaben nur für Listen-/Inbox-Navigation (`j/k`, `x`, `n`, `/`); Aktionen `Shift+Buchstabe`; Tabs `Alt+1…6`; Primär `⌘/Strg+Enter`; Aktionsmenü `.`. Registry `lib/backoffice/kuerzel.js` mit Unit-Test; Benutzer-Schalter „Einzeltasten-Kürzel“. | WCAG 2.1.4. |
| E13 | Stoppuhr (Konzept) vs. eine Uhr (UX) vs. Kontrollsystem (Fach R11) | **Stoppuhr gestrichen** (Phase A). Zeit buchen per Popover (`Shift+H`); Montage: eine Arbeitszeit Beginnen → Fertig. Statuszeitstempel werden nicht als Leistungsbewertung ausgewertet; Report nach Mitarbeiter nur Leitung. | Einfacher; ArbVG § 96/§ 96a bzw. AVRAG § 10. |
| E14 | Inkasso beim Kunden (Fach P15) | **Kein Barinkasso im Montage-Kiosk.** Knopf „Zahlung“ zeigt nur offene Rechnung + QR/Überweisungsdaten aus Faktura. Kartenzahlung über Arbeitsplatz Kassa erst nach Inhaber-/StB-Entscheidung (Schalter `projekte.inkasso`). | BAO §§ 131b, 132a (RKSV). |
| E15 | Zeitplan an drei Orten (UX P12) | Nur als Ansicht `/projekte/liste?ansicht=zeitplan`; `/projekte/zeitplan` → 307. Mappe zeigt Mini-Gantt (8 Wochen). | Ein Ort. |
| E16 | Kennzahlen/Charts am Bereichsstart (UX P11) | 4 Kennzahlen je Rolle, keine Charts (→ `/projekte/berichte/uebersicht`), kein Hochzählen beim Erstaufbau. Eine Formel „Rückmeldungen offen“ für Pill, Kennzahl, Inbox, Glocke. | 02 §2.1, 04 §3.7. |
| E17 | Teilmontage, Teilabnahme (Fach P7) | Abnahme je Montageauftrag (`art` Teil/Schluss/Nachabnahme). Bis A7: genau eine Abnahme je Projekt wie heute; Teilmontage nur mit Ablauf „Nur Leistungsnachweis“, Abnahme erst bei Schlussmontage. | Keine Funktion, die der Server ablehnt. |
| E18 | Funktionen, die die App heute nicht kann | **Ausblenden statt scheitern**: jede Funktion mit Backend-Lücke hängt an einem Schalter in `lib/backoffice/projekte/schalter.js` (§ 3.10) und erscheint erst mit der App-Änderung. | Keine Knöpfe, die mit Fehler enden. |
| E19 | Automationen AU9/AU10 (Zufriedenheit, Pflege-Abo) | Nur mit Einwilligung bzw. Bestandskunden-Voraussetzung (TKG 2021 § 174) und `nicht_kontaktieren = 0`, Abmeldelink. AU1–AU8 sind Vertragsabwicklung. Alle Standard aus. | Fach P17. |

---

## 1. Datenbestand und Rechte (`ph_projekte`, Stand 11:59)

| DocType | Nummer | Status (Anzeige) | Steuerung |
|---|---|---|---|
| PH Projekt (+ Team, Raum, Position, Phase) | `PH-PRJ-.YYYY.-.####` | Anfrage · Planung · Angebot · Auftrag · Bestellung · Lieferung · Montage · Übergabe · Abgeschlossen · Abgebrochen | Workflow `PH Projekt` |
| PH Aufmass (+ Raum, Mass, Anschluss, Foto) | `PH-AFM-.YYYY.-.####` | Entwurf · Erfasst · Geprüft | Status |
| PH Planung (+ Position) | `PH-PLN-.YYYY.-.####` | Entwurf · Vorgelegt (Wert `Kunde vorgelegt`) · Änderung gewünscht · Freigegeben · Verworfen | Methoden |
| PH Rendering, PH Rendering Feedback | `PH-REN-…` | Entwurf · Vorgelegt · Rückmeldung offen (Wert `Feedback offen`) · Freigegeben · Verworfen | Workflow `PH Rendering` |
| PH Nachtrag (+ Position) | `PH-NT-.YYYY.-.####` | Entwurf · Vorgelegt · Freigegeben · Abgelehnt · Storniert | Status/Methoden |
| PH Montageauftrag (+ Team, Leistung, Unterlage, Foto, Mangel) | `PH-MON-…` | Geplant · Unterwegs · In Arbeit · Erledigt (Anzeige „Fertig“) · Abgenommen · Abgebrochen | Workflow `PH Montageauftrag` |
| PH Abnahme (+ Position) | `PH-ABN-.YYYY.-.####` | Entwurf · Unterzeichnet · Mit Mängeln · Abgeschlossen | Workflow `PH Abnahme` |
| PH Fremdgewerk (+ Termin) | `PH-GEW-.YYYY.-.####` | Offen · Angefragt · Geplant · In Arbeit · Erledigt · Abgesagt | `status_setzen` |
| PH Projekt Dokument, PH Tagebuch Foto, PH Projekt Nachricht, PH Projekt Aufgabe, PH Projektzeit | – | je DocType | Methoden |
| PH Produktpass (+ Material, Pflege, Dokument) | `PH-PP-…` | Aktiv · Garantie abgelaufen · Verkauft · Entsorgt | `status_setzen` |
| PH Referenz (+ Bild) | – | Eingereicht · Veröffentlicht · Abgelehnt · Widerrufen | Workflow `PH Referenz` |
| PH Projekte Einstellungen | Single | – | – |

| Rolle | Sieht | Darf (UI) |
|---|---|---|
| PH Projekte Leitung | alles inkl. permlevel 1 (Beträge, Kosten, Kalkulation) | Beauftragen, Abschließen, Abbrechen, Zurücksetzen, Referenz veröffentlichen, Zeiten über Faktura abrechnen, Einstellungen |
| PH Projekte Mitarbeiter (Berater, Planer, Montageleiter) | alles ohne Beträge | Vorwärts-Workflow (verzögert), Planung/Rendering/Nachtrag vorlegen, Montage planen, Kunden informieren |
| PH Montage (Monteur) | eigene Aufträge (Team) im Kiosk | Status Losfahren/Beginnen/Fertig, Fotos, Mängel, Abnahme mit Kunde – **erst mit A18** (Workflow-Transitionen, PH Projektzeit, PH Tagebuch Foto); bis dahin Kiosk lesend + Fotos/Mängel |
| PH Faktura, PH Logistik | Mappe lesend | – |
| PH Geschäftsführung | alles lesend inkl. Beträge | – |

---

## 2. Nutzer, Top-Aufgaben und gezählte Wege

Zählregel 02 §0.3: ab Bereichsstart `/projekte` bzw. Arbeitsplatz-Start, ohne Suche, Enter = Klick, Tippen von Text zählt nicht. Suche (⌘K) ist immer der zweite Weg und wird getrennt geführt.

| # | Nutzer | Aufgabe | Weg (gezählt) | Ziel |
|---|---|---|---|---|
| B1 | Berater | Projekt aus Anfrage (Start CRM-Anfrage-Akte) | „Projekt anlegen“ (1) · „Anlegen und öffnen“ (2) | 2 |
| B2 | Berater | Mappe öffnen | Meine Projekte → Zeile (1) | 1 |
| B3 | Berater | Kunden informieren | Mappe (1) · Kopf „Kunden informieren“ (2) · „Senden“ (3) | 3 |
| B4 | Berater | Kundennachricht beantworten | Glocke (1) · Eintrag (2) · `⌘Enter` (3) | 3 |
| B5 | Berater | Liefertermin ändern + informieren | Mappe (1) · Chip (2) · Datum (3); Chip „Informieren …“ (4) · „Senden“ (5) | 3 + 2 |
| B6 | Berater | Aufgabe anlegen | Mappe (1) · Karte Aufgaben „+ Aufgabe“ (2) · Enter (3) | 3 |
| B7 | Berater | Angebot aus Projekt | Mappe (1) · Primär „Angebot erstellen“ (2) → Faktura A2 | 2 |
| P1 | Planer | Planung hochladen | Mappe (1) · Datei auf Mappe ablegen (2) · Auswahl „Planung“ (3) | 3 |
| P2 | Planer | Neue Planungsversion | Planung (1) · „Neue Version“ (2) · Datei wählen (3) | 3 |
| P3 | Planer | Rendering hochladen und vorlegen | Mappe (1) · ablegen (2) · „Rendering“ (3) · „Vorlegen“ (4) · „Vorlegen“ im Sheet (5) | 5 |
| P4 | Planer | Pin beantworten | Rückmeldungen-Zeile fokussiert · `⌘Enter` (1) | 1 je Pin |
| P5 | Planer | Kundenfreigabe übernehmen | Rendering-Banner „Freigabe übernehmen“ (1) | 1 |
| P6 | Planer | Planpositionen ins Projekt | Planung (freigegeben) „Positionen ins Projekt“ (1) | 1 |
| P7 | Planer | Zeit buchen | `Shift+H` (1) · Enter (2) | 2 |
| L1 | Leitung | Wo hängt etwas? | Kennzahl „Braucht Leitung“ sichtbar | 0 |
| L2 | Leitung | Phase zurücksetzen | Phasenpunkt (1) · „Zurücksetzen …“ (2) · Dialog „Zurücksetzen“ (3) | 3 |
| L3 | Leitung | Beauftragen | Mappe (1) · Primär „Beauftragen“ (2) | 2 |
| L4 | Leitung | Projekt abschließen | Mappe (1) · Primär „Abschließen“ (2) · Prüfliste „Abschließen“ (3) | 3 |
| L6 | Leitung | Referenz veröffentlichen | Kennzahl „Braucht Leitung“ (1) · Zeile (2) · „Veröffentlichen“ (3) | 3 |
| M1 | Montageleiter | Montage planen | Mappe (1) · Primär „Montage planen“ (2) · Datum (3) · „Montage anlegen“ (4) | 4 |
| M2 | Montageleiter | Woche überblicken | Pill „Montagen“ (1) | 1 |
| M3 | Montageleiter | Montage verschieben | Block ziehen (1) (+ 2 für Informieren) | 1 |
| M4 | Montageleiter | Mangel an Service | Pill „Mängel“ (1) · Zeilenaktion „→ Servicefall“ (2) · bestätigen (3) | 3 |
| T1–T3 | Monteur | Heute sehen, Navi, Statuswechsel | Start = heute (0) · „Navi“ (1) · Zustandsknopf (1) | 0/1/1 |
| T4 | Monteur | Foto | Kamera (1) · Auslöser (2) (eigene Kamera-Ansicht, Serienaufnahme) | 2 |
| T5 | Monteur | Mangel | „Mangel“ (1) · Foto (2) · „Speichern“ (3) | 3 |
| T7 | Monteur | Abnahme mit Kunde ohne Mängel | „Abnahme mit Kunde“ (1) · „Alles in Ordnung“ (2) · Unterschrift + „Weiter“ (3) · „Als T. Steiner unterschreiben“ (4) · „Abschließen“ (5) | 5 |
| A1 | Backoffice | Stand eines Auftrags am Telefon | Pill „Projekte“ (1) · `/` Name tippen · Zeile (2) | 2 |

Ganzer Montage-Durchlauf (Start → Losfahren → Beginnen → 2 Fotos → Fertig → Zeiten buchen) ≤ 8 Tipps mit eigener Kamera-Ansicht (getUserMedia); Rückfall `<input capture>` ≤ 10 Tipps (QA 27).

---

## 3. Bereichsweite Regeln

### 3.1 Routen und Unternavigation

```
/projekte                              T1  Übersicht
/projekte/liste                        T2  ?ansicht=liste (Standard) | kanban | zeitplan
/projekte/neu                          T6  Projekt anlegen (?anfrage= / ?gespraech= / ?kontakt=)
/projekte/[projekt]                    T5  Auftragsmappe (?tab=uebersicht|positionen|planung|belege|montage|dateien, ?panel=aktivitaet|details, ?ansicht=fotos)
/projekte/[projekt]/planung/[name]     T5  Planung
/projekte/[projekt]/renderings/[name]  T5  Rendering (Bildansicht)
/projekte/[projekt]/aufmass/[name]     T5  Aufmaß
/projekte/[projekt]/nachtraege/[name]  T5  Nachtrag
/projekte/rueckmeldungen               T2  Inbox
/projekte/montagen                     T4  ?ansicht=kalender (Standard) | kanban | liste
/projekte/montagen/[name]              T5  Montageauftrag
/projekte/abnahmen/[name]              T5  Abnahme (iPad-tauglich)
/projekte/aufgaben                     T3  Kanban | T2 Liste
/projekte/maengel                      T2  Mängel (Montage-Mängel + Abnahme-Positionen + Fremdgewerk-Mängel)
/projekte/nachtraege                   T2  Nachträge (alle Projekte)
/projekte/zeiten                       T2
/projekte/fremdgewerke                 T2 | T3   (?gewerk=PH-GEW-… öffnet Drawer)
/projekte/dokumente                    T2  Kacheln
/projekte/produktpaesse, /[name]       T2 / T5
/projekte/referenzen, /[name]          T2 / T5 Prüfseite
/projekte/berichte/[report]            T8  uebersicht | projektstatus | offene-maengel | montagekapazitaet | zeiten | liefertermine
/projekte/einstellungen                T9  (Leitung)
Umleitungen 307: /projekte/zeitplan → /projekte/liste?ansicht=zeitplan · /projekte/[p]/tagebuch → ?tab=dateien&ansicht=fotos ·
  /projekte/[p]/dokumente → ?tab=dateien · /projekte/[p]/nachrichten → ?panel=aktivitaet · /d/ph-projekt/<name> → /projekte/<name>
```

**Pills (max. 7):** Übersicht · Projekte · Rückmeldungen `n` · Montagen · Aufgaben · Mängel · **Mehr ▾** (Nachträge, Zeiten, Fremdgewerke, Dokumente, Produktpässe, Referenzen, Berichte, Einstellungen nur Leitung). Badge nur an Rückmeldungen (Formel § 3.6).
**Kanonische Routen** in `bereiche.js` (`ROUTEN`): PH Projekt → `/projekte/[name]`, PH Montageauftrag → `/projekte/montagen/[name]`, PH Abnahme → `/projekte/abnahmen/[name]`, PH Planung/PH Rendering/PH Aufmass/PH Nachtrag → unter dem Projekt (Projekt per `getValue(projekt)`), PH Fremdgewerk → `/projekte/fremdgewerke?gewerk=…`, PH Produktpass, PH Referenz wie oben.
**Kiosk:** `/montage` (Arbeitsplatz Montage mobil) mit Tabs Heute · Woche · Tour. „Tour“ zeigt Logistik-Touren des Tages (lesend), sobald 10-konzept-logistik sie liefert; bis dahin Tab ausgeblendet.

### 3.2 Glossar (verbindlich, `lib/backoffice/projekte/texte.js`)

| Statt | Immer |
|---|---|
| Feedback, Kundenfeedback | **Rückmeldung** |
| Status senden | **Kunden informieren** |
| Tab „Mappe“ | **Übersicht** |
| Nächster Schritt | **Empfohlen** |
| Erledigt melden, Fertig melden | **Fertig** (Kiosk), „Als fertig melden“ (Desktop-Menü) |
| Abnehmen, Abnahme anlegen/durchführen, Abnahmeprotokoll anlegen | **Abnahme mit Kunde** (Vorgang); „Abnahmeprotokoll“ nur als PDF/Dokument; „Abgenommen“ nur als Status |
| Kunde vorgelegt | **Vorgelegt** (Planung, Rendering, Nachtrag) |
| Summen aktualisieren | **Zahlungsstand aktualisieren** |
| Portal ● sichtbar | **Kunde sieht** / **Intern** |
| Montagebericht-Unterschrift | **Leistungsnachweis** |
| Garantie (allein) | **Herstellergarantie** bzw. **Gewährleistung** (getrennt) |

### 3.3 Statustöne (03 §1.5, `StatusBadge ton`)

Projekt: Anfrage/Planung `info`, Angebot/Auftrag `accent`, Bestellung/Lieferung `info`, Montage `warning`, Übergabe `success-soft`, Abgeschlossen `success`, Abgebrochen `danger` + Icon `triangle-alert`. Montage: Geplant `info`, Unterwegs `info` + Icon `truck`, In Arbeit `warning`, Fertig/Abgenommen `success`, Abgebrochen `danger` durchgestrichen. Abnahme: Entwurf `neutral`, Unterzeichnet `success`, Mit Mängeln `warning`, Abgeschlossen `success`. Nachtrag: Entwurf `neutral`, Vorgelegt `info`, Freigegeben `success`, Abgelehnt `danger-soft`, Storniert `neutral` durchgestrichen. Farbe nie allein: Badge enthält immer das Wort; Kalenderblöcke 3 px Statusleiste + Statuswort (ab 44 px Breite, sonst Icon). Frist-Texte `warning-text`, nie Sand als Fließtextfarbe (`accent-text` verwenden).

### 3.4 Undo-Regel (E2)

| Aktion | Muster |
|---|---|
| Workflow vorwärts (Mitarbeiter): Primärknopf, Kanban-Drop, Kiosk-Zustandsknopf | verzögerter Commit 8 s; Phasenpunkt bis zum Senden mit gestricheltem Ring, Tooltip „Wird in 6 s gespeichert“; zweite Aktion am selben Datensatz schickt die erste sofort |
| Zuweisen, Priorität, Liefertermin, Montage verschieben, Kunde-sieht-Schalter, Leistungs-Haken, Position in anderen Raum | sofort speichern, Undo 8 s = Gegenwert per `setValue` |
| Rückmeldung „Erledigt“ | verzögerter Commit 8 s (keine Gegenmethode; Anfrage A15 `wieder_oeffnen`) |
| Kunden informieren, Planung/Rendering/Nachtrag vorlegen | Sheet mit Vorschau, danach 10 s verzögerter Commit |
| Phase zurücksetzen (Leitung) | Dialog sm, danach Undo 8 s (= Vorwärtsaktion) |
| Abbrechen, Abschließen | Assistent (PA9/PA8), kein Undo |
| Unterschrift | „Neu zeichnen“ bis „Weiter“; danach unveränderbar |
| Tagebuchfoto löschen | verzögerter Commit 8 s; Kundenfoto nur Leitung mit Dialog „Fam. Muster hat dieses Foto hochgeladen“ |
| Planung verwerfen | Dialog „Planung ‚Insel‘ v3 verwerfen? Der Kunde sieht sie dann nicht mehr.“ (Methode zum Zurücksetzen fehlt) |
| Raum umbenennen | Massen-`save` aller Positionen mit diesem `raum`-Text, Undo 8 s (bis stabile Raum-ID, A21) |
| Referenz-Widerruf | Dialog rot, Fokus auf Abbrechen |

Massen-Undo: ein Sammel-Toast „5 erledigt · Rückgängig“, nie fünf Toasts. Toast-Rückgängig per `Z` oder `⌘Z`.

### 3.5 Muster „Kunden informieren“ (E5)

1. Änderung mit Kundenbezug (Liefertermin, Montagetermin, Montage verschoben, Phase Lieferung/Montage/Übergabe): Toast „Liefertermin auf KW 48 verschoben · Rückgängig“ (8 s).
2. Bleibender Chip im Mappenkopf und auf dem Kalenderblock: `Kunde nicht informiert · Informieren …` (`warning-soft`, Icon `send`), bis gesendet oder „Nicht nötig“ (Menü am Chip, schreibt Zeitleisteneintrag).
3. **Sheet „Kunden informieren“** 480 px rechts (Telefon: Bottom-Sheet): Empfänger (Name, Kanal laut `PH Kontakt.kommunikation_bevorzugt`), Sprache (`PH Kontakt.sprache`, Text-Vorschlag in dieser Sprache, bis A20 nur Deutsch mit Hinweis „Text ist deutsch“), Textfeld (Vorschlag editierbar), Vorschau der Portal-Karte, Primär „Senden“ (`⌘Enter`).
4. Senden → Toast 10 s „Nachricht an Fam. Muster wird gesendet · Rückgängig“; nach Ablauf `portal_status_senden(text)`.
5. Ergebnis: Kanal-Rückgabe (A20) `mail | nur_portal | keiner`. Bis A20 prüft die Server Action vorher `PH Kontakt.email`: leer → **kein Aufruf**, stattdessen Karte „Nicht zugestellt – Fam. Muster hat keine E-Mail. Bevorzugt: Telefon.“ [Aufgabe „Kunde anrufen“] [Brief drucken (Statusbericht)].
6. Versandfehler nach Ablauf → Glocke + roter Zeitleisteneintrag „Nicht gesendet · Erneut senden“.

Kunde ohne E-Mail: Mappenkopf-Chip „Kein Portal – Kunde ohne E-Mail“ (`warning-soft`); alle „Kunde sieht“-Texte lauten „nur intern (kein Portal)“.

### 3.6 Zählformeln (eine Zahl je Sache, `lib/backoffice/projekte/zaehler.js`)

- **Rückmeldungen offen** = PH Rendering Feedback (`von=kunde`, `art≠vote`, `status=Offen`) + PH Projekt Nachricht (`richtung=eingehend`, `status=Ungelesen`) + PH Nachtrag mit Kundenentscheidung seit letzter Sichtung (`entscheidung_am` gesetzt, `uebernommen=0`, Status Freigegeben/Abgelehnt) + PH Planung `kunde_entscheidung in (freigegeben, aenderung)` und Status noch „Vorgelegt“. „Nur meine“ = Projekte mit `berater`/`planer` = Sitzung. Gleiche Funktion für Pill, Kennzahl, Inbox-Kopf, Glocke (Unit-Test).
- **Überfällig** = älter als `feedback_erinnerung_tage`.
- **Offene Mängel** = `ph_projekte.api.anzahl_offene_maengel` + Fremdgewerk-Mängel; „erledigt“ nach `utils/maengel.ist_erledigt` (Groß/klein-unabhängig, bis A9 korrigiert).

### 3.7 Tastatur (E12, Registry `lib/backoffice/kuerzel.js`)

| Kontext | Kürzel |
|---|---|
| Überall | `⌘K` Palette, `⌘/Strg+Enter` Primär, `.` Aktionsmenü, `?` Kürzelhilfe, `Z`/`⌘Z` Rückgängig (Toast) |
| Listen, Inbox | `j/k` Zeile, `x` auswählen, `/` Suche, `n` Neu, `Enter` öffnen, `Shift+E` erledigt, `Shift+R` ins Rendering, `p` zum Projekt, `Shift+U` als ungelesen (sichtbarer Knopf in der Vorschau) |
| Mappe | `Alt+1…6` Tabs, `Shift+K` Kundenakte, `Shift+H` Zeit buchen, `Shift+A` Aufgabe, `Shift+M` Nachricht an Kunden (Composer im Modus „An Kunde“ öffnen – Moduswechsel selbst nie per Taste im Feld), `Shift+U` Datei hochladen, `Shift+D` Aktivität ein/aus, `⌘P` Statusbericht, `Alt+↑/↓` vorheriges/nächstes Projekt der Liste |
| Planung, Rendering | `Shift+←/→` Version/Variante, `Shift+N` neue Version, `Shift+C` vergleichen, `+`/`-`/`0` Zoom, `Leertaste` Sprachnotiz (fokussiert) |
| Kalender, Zeitplan | `t` heute, `←/→` Zeitraum, `w/m/d` Woche/Monat/Tag; fokussierter Block: `Enter` Umplanen, `Shift+←/→` ±1 Tag, `Shift+↑/↓` ±30 min (je mit Undo) |
| Kanban (alle 4 Boards) | Leertaste greifen, `←/→` Spalte, `Enter` ablegen, `Esc` abbrechen, `m` Menü „Verschieben nach …“ |
| Zeitplan (Treegrid) | `→` aufklappen, `←` zuklappen, `Shift+←/→` Woche |

Gestrichen: `1–9` Tabs, `[`/`]`, `t` Zeit, `e`, `a`, `m`, `u`, `k`, `c`, `v`, `g r/m/t`, `1–6` Kennzahlen, `f`/`k` im Kalender, Leertaste im Zeitplan. Benutzer-Menü → „Tastatur“ → Schalter **„Einzeltasten-Kürzel“** (Standard an; aus = nur Kürzel mit Modifikator). In Eingabefeldern wirken Einzelbuchstaben nie. Jedes Kürzel hat einen sichtbaren Knopf.

### 3.8 Laden, Leer, Fehler (02 §7, 03 §8.18)

- Skeleton in Zielhöhe, erst nach 300 ms sichtbar, mind. 600 ms; CLS 0. Jede Karte eigener `<Suspense>`.
- Leer-Zustände je Liste in drei Fällen (noch nie · Filter · alles erledigt), Texte in § 5 an den Seiten. Text Du-Form, eine Aktion.
- Fehler je Karte kompakt „Nicht geladen · Erneut“; Seite bleibt. `forbidden` → `kein-zugriff`; `not_found` → `nicht-gefunden` mit Suche; `unavailable` → Banner „Daten gerade nicht erreichbar – letzte Ansicht von 09:12“, Aktionen deaktiviert; `conflict` → Feld gelb „Von M. K. vor 2 Min. geändert“ [Übernehmen] [Meinen Wert behalten]. Server-Validierungen wörtlich am Feld.
- Upload-Fehler am Ort des Uploads (nie nur Toast): Typ („DWG geht nur als Planung, nicht als Rendering“), Größe (Grenze aus Frappe-Limit nennen), Abbruch (Zeile bleibt mit „Erneut“), Duplikat („Als neue Version von ‚Küchenplan v3‘ ablegen?“ Ja/Nein), Fotogrenze („120 Fotos sind die Grenze dieses Projekts – ältere archivieren oder Leitung fragen“; Wert aus Einstellung). Mehrere Dateien: Fortschrittsring 16 px je Datei; Live-Meldung nur am Ende („3 Fotos hochgeladen“).
- Teilfehler in Ketten (Montage planen, Vorlegen mehrerer Renderings, Abnahme mit Kunde, Abbrechen, mehrstufiges Zurücksetzen): Ergebnis-Drawer „2 erledigt, 1 offen“ mit Einzelknopf „Erneut“ je offenem Schritt; nie doppelt anlegen (vorher „existiert schon?“ prüfen).

### 3.9 Bewegung (04) und Dunkelmodus

| Element | Bewegung |
|---|---|
| Phasenwechsel | Linie füllt 400 ms `--bo-dur-draw` `--bo-ease-out`, Punkt scale 0.8→1 200 ms |
| Kanban-Drop | Spring 320 ms `--bo-ease-spring`; Rückkehr bei Fehler/Abbruch 200 ms `--bo-ease-out` |
| Inbox-Zeile erledigt | height→0 + opacity 120 ms `--bo-ease-in`, Fokus auf nächste Zeile |
| Neuer Pin | scale 0.8→1 + opacity 160 ms `--bo-ease-out` |
| Sheet/Drawer | translateX 24 px → 0 + opacity 200 ms `--bo-ease-out`, raus 120 ms `--bo-ease-in` |
| Kiosk-Bildschirmwechsel | translateX 24 px + opacity 200 ms `--bo-ease-out`, zurück 160 ms `--bo-ease-in` |
| Erfolg (Fertig, Abnahme abgeschlossen) | Häkchen zeichnet 400 ms `--bo-dur-draw` |
| Zeitplan-Zoom | Achse 200 ms `--bo-ease-inout`; Ziehen ohne Easing, Ablage 120 ms |
| Kennzahlen | kein Hochzählen beim Erstaufbau; nur nach Wertänderung (04 §3.7) |
| Skeleton-Puls | 1200 ms, nur wenn > 300 ms |

`prefers-reduced-motion`: keine Bewegung außer Opacity ≤ 80 ms. Dunkelmodus nach 03 §1.4 für Kalender, Gantt, Pins, Bildfläche (`surface-inverse`); **Signaturfeld immer hell mit dunklem Strich**, auch im Dunkelmodus.

### 3.10 Schalter (`lib/backoffice/projekte/schalter.js`, E18)

| Schalter | Standard | Schaltet frei | Voraussetzung |
|---|---|---|---|
| `kundenvorschau` | aus | Schalter „Kundensicht“ `Shift+V` | A12 `portal_project_vorschau` |
| `summen` | aus | berechnete Summen (Auftragswert, Anzahlung Soll/Ist, Bezahlt, Offen) | A2 |
| `kalkulation` | aus | Abschnitt Kalkulation (Leitung) | A3 |
| `mengen_dezimal` | aus | Dezimalmengen + Einheit | A4 |
| `teilabnahme` | aus | Abnahme je Montageauftrag, `art` | A7 |
| `montage_kiosk_status` | aus | Zustandsknopf für Rolle PH Montage | A18 |
| `nachtrag_portal` | aus | Nachtrag im Portal vorlegen | A10 (FAGG-Hinweis) |
| `inkasso` | aus | „Restzahlung über Kassa“ im Kiosk | Inhaber + StB |
| `auto_phase` | an | Regel „Folgeobjekt schiebt Phase“ (E4) | – |
| `automation_au1…au12` | aus | Automationen § 9.2 | Inhaber je Automation |

---

## 4. Auftragsmappe `/projekte/[projekt]` (T5, Herzstück)

### 4.1 Aufbau (1280 px)

```
┌ Projekte › Küche Lochau ─────────────────────────────────────────────────────────────────────────────────────────┐
│ Küche Lochau  [Küche] [● Lieferung]  ↑ Hoch        [Kunde nicht informiert · Informieren…]  [Montage planen ⌘↵] [⋯] │
│ (A) Fam. Muster ↗ · ⌖ Hauptstr. 1, Lochau · (AB)(MK)(TS) · Lieferung KW 47 ✎ · Montage – · Übergabe – · Kunde sieht │
│ ●────●────●────●────●────◉────○────○────○    12.09. 23.09. 02.10. 14.10. 21.10. 03.11.  (12 px muted)             │
│ Empfohlen, weil: 9 Positionen geliefert, noch keine Montage                                      [Aktivität 2]   │
├ Übersicht · Positionen · Planung · Belege & Lieferung · Montage · Dateien ─────────────────────┬─────────────────┤
│                                                                                                 │ Aktivität|Details│
│  (Tab-Inhalt)                                                                                   │ Filter-Chips     │
│                                                                                                 │ Strom …          │
│                                                                                                 │ [Intern ▾] Feld  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┴─────────────────┘
```

**Kopf (≤ 2 Zeilen + Phasenleiste + Empfohlen-Zeile, ≈ 152 px; sticky kompakt 56 px = Titel + Phase-Badge + Primär):**

| Element | Feld/Quelle | Verhalten |
|---|---|---|
| Titel | `titel` | Klick → inline umbenennen, Enter speichert; `--text-bo-xl` 20/500 |
| Art | `projektart` | Chip, Klick → Inline-Popover Select |
| Phase | `status` | StatusBadge |
| Priorität | `prioritaet` | nur Hoch/Niedrig als Icon `arrow-up`/`arrow-down` + Wort |
| Nummer | `name` | im Details-Panel; Klick kopiert („Kopiert“) |
| Kunde | `kontakt`, `kunde_name` | Chip mit Avatar; Klick → Kundenakte `/kunden/[kontakt]`; Hover-Karte Telefon/E-Mail |
| Objekt | `objekt_strasse/plz/ort`, `objekt_land` | Klick → Karten-App; `objekt_land ≠ AT` → zusätzlicher Chip „Montage in CH“ / „in DE“ (§ 12.5) |
| Team | `berater`, `planer`, `montageleiter`, `team[]` | Avatare 20 px, Klick → Team-Popover (inline zuweisen) |
| Liefertermin | `liefertermin_geplant` | Chip, Inline-Datum; danach Muster § 3.5 |
| Montage | `montage_von/bis` (vom Controller geführt) | Chip, nur lesend (Ändern am Montageauftrag) |
| Übergabe | `uebergabe_am` | **nur lesend**, Tooltip Quelle (E7) |
| Portal | `portal_sichtbar` | Text „Kunde sieht“ / „Intern“; Schalter im Details-Panel (Leitung/Berater) |
| Hinweis-Chips | – | „Kunde nicht informiert“ (§ 3.5), „Kein Portal – Kunde ohne E-Mail“, „Rücktrittsfrist bis 18.11.“ (§ 12.3), „Summen: Belege in EUR und CHF“ |
| Aktivität | Ungelesen-Zähler | öffnet/schließt rechte Spalte (< 1280 px Sheet 480 px), `Shift+D` |

Gestrichen im Kopf: Stoppuhr, Kundensicht-Schalter (bis `kundenvorschau`), Präsentieren als Kopfknopf (→ `⋯ Kunde › Präsentieren`, iPad zusätzlich Knopf in Tab Planung).

### 4.2 Phasenleiste (`Vorgangsleiste`, 9 Punkte)

- Punkte: Anfrage · Planung · Angebot · Auftrag · Bestellung · Lieferung · Montage · Übergabe · **Abgeschlossen**. Abgebrochen ersetzt den letzten Punkt als roter Punkt mit Dreieck-Icon + Wort „Abgebrochen“.
- 40 px hoch, Punkte 10 px, Linie 2 px, Datum unter erledigten Punkten = letztes `phasen_verlauf[].datum` dieser Phase.
- Semantik: `<ol>`, aktueller Punkt `aria-current="step"`, jeder Punkt `<button aria-haspopup="dialog">`.
- **Klick/Enter auf jeden Punkt** öffnet Popover „Phase Bestellung“ (320 px): Datum, Person (`von`), Notiz, Quelle (manuell/System), auslösende Objekte als Links (Herstellerbestellungen, Lieferscheine, Montageaufträge, Abnahme – aus den Mappe-Listen nach Datum zugeordnet; mit A13 aus `ausloeser_doctype/name`).
- **Zurücksetzen** (nur Leitung) ganz unten im Popover als Textknopf `danger-text` „Projekt auf Bestellung zurücksetzen …“ → Dialog sm „Projekt von Montage auf Bestellung zurücksetzen? Montageaufträge bleiben bestehen.“, Primär „Zurücksetzen“, Fokus auf „Abbrechen“. Mehrstufig: Fortschritt „2 von 3“, bei Fehler Stopp + „Bei Lieferung angehalten – Grund: …“; Leiste zeigt den echten Stand.
- ◐ „teilweise“ nur in Bestellung/Lieferung (Positionen `lieferstatus` geliefert x/y).
- Band unter der Leiste, wenn Fakt und Phase auseinanderlaufen und die Rolle nicht schieben darf: „Montage läuft seit 08:12 – Phase noch ‚Lieferung‘ [Phase anpassen]“ (Mitarbeiter ohne Recht: Knopf „Leitung bitten“ → PH Projekt Aufgabe).

### 4.3 Empfohlen (Primärknopf, Regeltabelle)

Erste zutreffende Regel je Phase = Primäraktion + Begründungszeile „Empfohlen, weil: …“; alle zutreffenden stehen in der Karte „Empfohlen“ (Übersicht). Berechnung im Backoffice-Server (`lib/backoffice/projekte/empfohlen.js`, rein, unit-getestet) aus Mappe-Daten; später `naechste_schritte[]` (A13).

| Phase | Bedingung (Quelle) | Primäraktion | Hinweis/Blocker |
|---|---|---|---|
| Anfrage | kein PH Termin (`ph_projekte_projekt`) | Termin vereinbaren (CRM A1) | – |
| Anfrage | Termin vorbei | Planung starten (WF) | – |
| Planung | Küche/Bad und kein PH Aufmass `Geprüft` | Aufmaß erfassen | „Ohne geprüftes Aufmaß keine Planung“ (Hinweis, nicht blockierend) |
| Planung | keine PH Planung | Planung hochladen | – |
| Planung | Planung Entwurf | Planung vorlegen | – |
| Planung | Planung „Änderung gewünscht“ | Neue Version | Kundenkommentar zitiert |
| Planung | Rendering Entwurf mit Bild | Rendering vorlegen | – |
| Planung | Rückmeldungen offen | Rückmeldungen beantworten (n) | „seit n Tagen“ ab Erinnerungsgrenze `warning-text` |
| Planung | Planung oder Rendering freigegeben | Angebot erstellen (WF „Angebot erstellen“ + Faktura A2) | – |
| Angebot | AB existiert (Faktura) | Beauftragen (nur Leitung) | Mitarbeiter: „AB vorhanden – wartet auf Beauftragung durch Leitung“ |
| Angebot | Angebot gesendet, keine AB | – | „Angebot seit n Tagen offen“ |
| Auftrag | AB-Rücktrittsfrist läuft (`fagg_frist_ende ≥ heute`) | – (Hinweis) | „Rücktrittsfrist bis 18.11. – Bestellung nur bei Maßanfertigung oder ausdrücklichem Verlangen des Kunden“ + Nachweis-Checkbox (§ 12.3) |
| Auftrag | Anzahlungsrechnung nicht bezahlt | – (Hinweis) | „Anzahlung offen – Bestellung nach Zahlung“; Leitung darf „Bestellen“ mit Pflichtgrund (Zeitleiste) |
| Auftrag | sonst | Bestellen (WF) / Herstellerbestellungen erzeugen (Sortiment A5) | – |
| Auftrag … Montage | Nachtrag „Vorgelegt“ über `freigabe_frist` | Nachtrag nachfassen | „Nachtrag 2 wartet seit …“ |
| Auftrag … Montage | Nachtrag freigegeben, `uebernommen = 0` | AB anpassen (Faktura) | „Nachtrag freigegeben – AB noch nicht angepasst“ |
| Bestellung | Positionen ohne bestätigten Termin | – | „n Bestellungen ohne bestätigten Termin“ |
| Lieferung | alle Eigenmontage-Positionen `lieferstatus in (geliefert, montiert, storniert)`, kein Montageauftrag | Montage planen | – |
| Lieferung | Eigenmontage-Positionen fehlen | Teilmontage planen (sekundär „Warten“) | „3 Positionen fehlen (Nachlieferung KW 49)“ |
| Montage | Montageauftrag Fertig, keine Abnahme | Abnahme mit Kunde | – |
| Montage | Montageauftrag Fertig, Kunde abwesend | Abnahme terminieren | „Leistungsnachweis ohne Unterschrift – Kunde abwesend“ |
| Übergabe | Abnahme „Mit Mängeln“ | Mängel bearbeiten | „n offene Mängel“ |
| Übergabe | Schlussabnahme unterzeichnet, keine Schlussrechnung | Schlussrechnung stellen (Faktura, übernimmt Leistungsdatum § 12.2) | – |
| Übergabe | gelieferte Positionen ohne Produktpass | Produktpässe erzeugen | – |
| Übergabe | Prüfliste PA8 erfüllt | Abschließen (Leitung) | Mitarbeiter: „Bereit zum Abschluss – Leitung informiert“ |
| Abgeschlossen | keine Referenz, `referenz_freigabe_aktiv` | Referenz anregen (sekundär) | – |

Gestrichen als manuelle Primäraktionen: „Montieren“, „Liefern“, „Übergeben“ (E4, Schalter `auto_phase`; bei aus erscheinen sie wieder als Primär).

### 4.4 Tabs (6, `Alt+1…6`, Zustand `?tab=`)

Lazy: Kopf + Übersicht laden mit einem `auftragsmappe`-Aufruf (Cache-Tag `akte:projekt:<name>`, 15 s) plus parallel den Fremdbelegen (§ 11.2, eigener Suspense). Andere Tabs nutzen dieselben Daten oder laden nach.

| # | Tab | Inhalt | Leer |
|---|---|---|---|
| 1 | **Übersicht** | Karten: Empfohlen (alle Regeln) · Termine (PH Termin, Montagen, Fremdgewerk-Termine, Liefertermin, max. 5) · Mini-Gantt 8 Wochen, 120 px („Im Zeitplan öffnen“ → `/projekte/liste?ansicht=zeitplan&projekt=…`) · Aufgaben (offen, Zeile „+ Aufgabe“) · Zeiten (Summe h, „Zeit buchen“) · Zahlungsstand (Leitung, E9) · letzte 6 Fotos · Kurzbeschreibung | je Karte: „Noch keine Termine.“ [Termin vereinbaren] usw. |
| 2 | **Positionen** | Abschnitt **Räume & Positionen**: Räume als Gruppen (`raeume[]`), Position: Bezeichnung, Marke, Menge (+ Einheit mit `mengen_dezimal`), `montage_art` (Eigenmontage/Fremdgewerk/ohne), **Lieferstatus-Chip** (`lieferstatus`: offen · bestellt · bestätigt · teilgeliefert x/y · geliefert · montiert · storniert), Liefertermin, Nachlieferung (Chip „Nachlieferung KW 49 – Grund“), Produktpass-Link, Preis + EK (Leitung). Zeilenmenü: „In Raum verschieben ▸“, „Nachlieferung erfassen …“, „Zurücknehmen …“ (Leitung, § 6.10). Abschnitt **Nachträge** (§ 5.12 Kurzliste mit Status, Differenz ±, „+ Nachtrag“) | „Noch keine Räume. Räume gliedern Positionen und Fotos.“ [Raum hinzufügen] [Aus Planung übernehmen] |
| 3 | **Planung** | Abschnitt **Aufmaß** (Status, geprüft von/am, „Aufmaß erfassen“) · **Planungen** nach Version (Kachel, Status, Quelle, Kundenentscheidung) · **Renderings** als Varianten-Raster A–F × Version mit Status, Votes (Icon `thumbs-up`/`thumbs-down` + Zahl), offene Rückmeldungen · Ablagefläche mit Knopf „Datei wählen“ (`Shift+U`) | „Noch keine Planung. Zieh eine Datei hierher oder wähle eine Datei.“ [Datei wählen] |
| 4 | **Belege & Lieferung** | Abschnitte mit Sprunganker: **Belege** (Angebote, ABs inkl. Storniert ausgegraut, Rechnungen nach Art, Gutschriften; Nummer, Datum, Status, Betrag in Belegwährung (Leitung), PDF) · **Zahlungsplan** (Zeilen aus `PH Auftragsbestaetigung.zahlungsplan`: „Anzahlung · angefordert 14.10. (RE-…) · bezahlt 18.10.“; Prozentsätze nur aus Daten) · **Kalkulation** (Leitung, Schalter) · **Herstellerbestellungen** (Lieferant, Status, `bestaetigter_termin`) · **Lieferscheine & Sendungen** | Fremd-App fehlt: „Faktura ist noch nicht eingerichtet – Belege erscheinen hier, sobald sie existieren.“ (kein Knopf). Nichts vorhanden: „Noch kein Angebot.“ [Angebot erstellen]. Bezug fehlt (E8): „Bestellungen sind mit diesem Projekt nicht verknüpft.“ |
| 5 | **Montage** | **Montageaufträge** (Status, Termin, Team, Leistungen x/y, Mängel, Leistungsnachweis ✓) · **Fremdgewerke** (Gewerk, Partner, Termine, Abnahme-Status, Mängel) · **Abnahmen** (Art, Status, offene Mängel, Protokoll-PDF, Kopie an Kunde ✓) · **Produktpässe** · **Service** (Servicefälle zum Projekt, lesend, Link ph_service) | „Noch keine Montage geplant.“ [Montage planen] |
| 6 | **Dateien** | Segment `Dokumente \| Fotos` (`?ansicht=fotos`): Dokumente als Kacheln nach Kategorie, Text „Kunde sieht“/„Intern“, Versionen ausklappbar, Menü „Neue Version hochladen …“; Fotos = Bautagebuch-Galerie nach Phase, Filter Kunde/Team, Lightbox (`Esc`, `←/→`, Fokus zurück auf Miniatur), „Für Referenz vorschlagen“. Filter-Chip „Nur für Kunde sichtbar“ | „Noch keine Dokumente.“ [Datei hochladen] · „Noch keine Fotos. Kunde und Team füllen das Bautagebuch gemeinsam.“ · `tagebuch_aktiv = 0`: „Bautagebuch ist ausgeschaltet.“ |

**Ablage überall:** Datei auf die ganze Mappe ziehen → Overlay „Hier ablegen“ (Rand 2 px `accent`, 120 ms), danach Auswahl Planung / Rendering / Dokument / Foto (vorgewählt nach Dateityp).

### 4.5 Rechte Spalte „Aktivität | Details“ (360 px ≥ 1280, sonst Sheet 480 px)

**Aktivität** = ein Strom (neueste unten, gruppiert nach Tag): Kundennachrichten, Studio-Nachrichten, interne Kommentare, Phasenwechsel, neue Belege, Kundenaktionen (Rückmeldung, Foto, Freigabe, Nachtragsentscheidung), Montagestatus, Abnahme, Dokument freigegeben, „Kunde informiert“ inkl. Kanal, Systemeinträge. Filter-Chips: Alles · Kunde · Team · Belege · System. Kundeneinträge links mit Avatar, Studio rechts; interne Kommentare grau hinterlegt mit Icon `lock` 12 px + Wort „Intern“. Quelle je Eintrag als Icon mit `aria-label` (Portal `globe`, Mobil `smartphone`, Backoffice `monitor`).

**Composer** (sticky unten): Modus-Schalter `Intern` (Standard, Rahmen `line`) / `An Kunde` (Rahmen 2 px `accent`, Zeile darüber „Fam. Muster sieht das im Portal“, Knopf „An Kunde senden“). Moduswechsel nur per Klick bzw. Fokus auf den Schalter, nie per Taste im Feld; nach jedem Senden zurück auf `Intern`. „An Kunde“ = `PH Projekt Nachricht` ausgehend mit 10-s-Commit; ohne E-Mail/Portal Hinweis § 3.5 Punkt 5. Intern = `kommentarAction`. Öffnen eines eingehenden Eintrags markiert nach 1 s sichtbarer Anzeige als gelesen (`als_gelesen`).

**Details** = Eigenschaften-Panel, inline editierbar: Nummer, Eingang, Kunde, Rechnungsempfänger (A14), Auftraggeber-Art (A14), Objekt/Baustelle (`objekt_*`, `baustelle_kontakt`, `baustelle_telefon`, `objekt_hinweis`), Team, Termine (Übergabe lesend), Kundenportal (`portal_sichtbar`, `portal_positionen_preise` lesend, `ki_generiert_hinweis`, `portal_hinweis`), Budget (Leitung), Aufbewahren bis (A12, lesend), interne Notiz (Leitung), Bezüge (Vorher: Anfrage, Beratungsgespräch; Nachher: Zähler je DocType mit „+“).

**Zeitleiste-Quelle:** bis A16 (`api.zeitleiste`) baut der Server den Strom aus Mappe-Listen (`creation`/`modified`), `docinfo` des Projekts und den Fremdbelegen.

### 4.6 Aktionsmenü `⋯` (`.`), mit Eingabefilter oben

- **Kunde:** Kunden informieren · Präsentieren · Im Portal öffnen · Portal-Link kopieren
- **Anlegen:** Planung · Rendering · Aufmaß · Nachtrag · Dokument · Fremdgewerk · Aufgabe · Zeit · Termin (CRM) · Angebot (Faktura) · Servicefall (Service). Montage nur über „Montage planen“, Abnahme nur über „Abnahme mit Kunde“.
- **Drucken:** Statusbericht · Auftragsmappe als PDF (Sammel-PDF, `utils/mappe.py`, sobald Endpunkt `auftragsmappe_pdf` bestätigt)
- **Phase:** erlaubte Workflow-Aktionen aus `getTransitions` (nie eigene Liste)
- **Leitung** (unten, getrennt): Zahlungsstand aktualisieren · Produktpässe erzeugen · Abbrechen … (rot)

### 4.7 Laden, Fehler, Konflikte

- Kopf + Übersicht aus einem `auftragsmappe`-Aufruf; Skeleton Kopf 152 px, Karten 2-spaltig. Rechte Spalte und Fremdbelege gestreamt.
- `auftragsmappe` wirft „Keine Berechtigung.“ → `kein-zugriff`. Projekt fehlt → `nicht-gefunden`.
- Fremd-App-Fehler → Abschnitt „Belege gerade nicht abrufbar · Erneut“ nur, wenn die App installiert ist; sonst Leer-Zustand.
- Abgeschlossen/Abgebrochen: für Mitarbeiter readonly, Schloss-Icon im Kopf, Tooltip „Abgeschlossen – nur Leitung kann ändern“.
- Sticky-Kopf: `scroll-margin-top: 120px` in der Mappe, Massenaktionsleiste `scroll-margin-bottom: 72px` (WCAG 2.4.11).
- Gleichzeitige Bearbeitung: `modified`-Prüfung bei jedem `save` (Konfliktmuster § 3.8).

---

## 5. Seiten

### 5.1 Übersicht `/projekte` (T1)

```
┌ Projekte                                                         Nur meine ⟷ Alle      [+ Neues Projekt] ┐
│ HEUTE  08:00 Montage Küche Lochau (Team B) → · 3 Rückmeldungen seit > 3 Tagen → · Abnahme-Frist morgen →   │
│ [Meine Rückmeldungen 4 · 2 überfällig] [Fällige Aufgaben 3] [Meine Montagen KW 46: 2] [Offene Mängel 1]     │
│ MEINE PROJEKTE                                        Phase           Empfohlen            Nächster Termin  │
│ Küche Lochau · Fam. Muster      ●●●●●◉○○○ Lieferung   Montage planen →    KW 47                             │
│ Bad Bregenz · Hr. Beispiel      ●●●●●●◉○○ Montage     Abnahme mit Kunde → morgen                            │
└──────────────────────────────────────────────────────────────────────────────────────── Alle meine (14) ┘
```

| Block | Inhalt | Quelle |
|---|---|---|
| Heute-Leiste | Montagen heute (Start, Team, Unterlagen-Haken), Abnahme-Fristen ≤ morgen, Rückmeldungen über Erinnerungsgrenze, eigene fällige Aufgaben, „Montage morgen vorbereiten“ (Aufgabe aus `montage_erinnerung`) | PH Montageauftrag, PH Abnahme Position `frist`, § 3.6, PH Projekt Aufgabe |
| Kennzahlen (4 je Rolle, 03 §8.14: min-h 112, Wert 24/500 tabular) | **Mitarbeiter:** Meine Rückmeldungen offen (davon überfällig) · Meine fälligen Aufgaben · Meine Montagen diese Woche · Offene Mängel meiner Projekte. **Montageleiter:** Montagen diese Woche · Nicht eingeplant · Auslastung KW (Report) · Mängel überfällig. **Leitung/GF:** Aktive Projekte · Rückmeldungen überfällig · Braucht Leitung · Mängel überfällig | Number Cards (`count` mit identischen Filtern), API `anzahl_offene_maengel`, Report Kapazität |
| Meine Projekte (max. 8) | `berater`/`planer`/`montageleiter`/`team.user` = Sitzung, offen; sortiert nach nächstem Termin; Phase-Mini (nicht klickbar, nur `title`), Empfohlen, nächster Termin | PH Projekt + Team |
| Braucht Leitung (Kennzahl öffnet Liste) | AB vorhanden ohne Beauftragung, Referenzen „Eingereicht“, Nachträge freigegeben ohne AB-Anpassung, Montage fertig ohne Leistungsnachweis/Abnahme, Bestellen trotz offener Anzahlung | – |

„Nur meine ⟷ Alle“ als Schalter `role="switch"`, Zustand `localStorage` `bo:projekte:start:umfang` (try/catch), Standard „Nur meine“ für Mitarbeiter, „Alle“ für Leitung/GF. Keine Charts (→ `/projekte/berichte/uebersicht`).
**Leer:** „Noch keine Projekte. Projekte entstehen aus einer Anfrage oder direkt hier.“ [Projekt anlegen] [Zu den Anfragen] · Heute: „Heute keine Montagen, keine fälligen Rückmeldungen.“ (Icon `check` Sand 32 px) · Meine Projekte neu: „Dir ist noch kein Projekt zugeordnet.“ [Alle Projekte] · Braucht Leitung: „Nichts wartet auf dich.“
**Kürzel:** `n` Neues Projekt; Palette „> Rückmeldungen“, „> Montagen“, „> Zeitplan“.

### 5.2 Projekte `/projekte/liste` (Liste · Kanban · Zeitplan)

```
┌ Projekte › Projekte                                            Liste | Kanban | Zeitplan    [+ Neues Projekt] ┐
├ [Laufend 23] [Anfrage 4] [Planung 6] [Angebot 3] [Auftrag 2] … | Art ▾ | Berater ▾ | Ort ▾ | Suche / | Spalten ⋯ ┤
│ ☐ Nummer           Titel / Kunde               Art    Phase        Nächster Termin   Rückm.  Mängel           │
│ ☐ PH-PRJ-2026-0009 Küche Lochau · Fam. Muster  Küche  Lieferung    Mo 17.11 Montage  2       –                │
├ 1–23 von 23 · [25|50|100]                                                                   [CSV] (Leitung) ┤
└ Auswahl (2): [Zuweisen ▾] [Priorität ▾] [Kunden informieren] [Statusbericht] [Mehr ▾]                        ┘
```

- **Spalten** (`?spalten=`): Nummer, Titel + Kunde, Art, Phase (+ Mini), Priorität, Berater, Planer, Montageleiter, Ort, Liefertermin, Montage, Nächster Termin, Rückmeldungen offen, Mängel offen, Aufgaben offen, Nachträge offen, Zeit (h, Leitung), Belegsummen (Leitung, nur mit `summen`), Eingang, „Kunde sieht“.
- **Filter** (URL): Status-Chips mit Zählern, Art, Berater/Planer/Montageleiter, Ort, Priorität, „Mit offenen Rückmeldungen“, „Mit offenen Mängeln“, „Ohne Termin in 14 Tagen“, Zeitraum Eingang, `projekt=` (für Zeitplan aus Mappe). Standard „Laufend“, Sortierung `eingang desc` / „Nächster Termin“.
- **Inline:** Priorität, Berater, Planer, Montageleiter, Liefertermin (danach Chip § 3.5 in der Zeile). Phase nie inline.
- **Massenaktionen:** Zuweisen, Priorität, Kunden informieren (je Projekt eigener Text, Sammel-Sheet mit Vorschau je Empfänger, ein 10-s-Commit), Statusbericht drucken (Sammel-PDF), Portal sichtbar an/aus (Leitung), CSV (Leitung).
- **Kanban** (Board „PH Projekte“): Spalten Anfrage…Übergabe; Abgeschlossen/Abgebrochen eingeklappt rechts. Karte: Titel, Kunde, Art-Icon, nächster Termin, Zähler Rückmeldungen/Mängel (Badge mit Zahl + Wort im `aria-label`), Avatar Berater. Ziehen = Workflow-Aktion des Übergangs (`getTransitions` beim Drag-Start; nicht erlaubte Spalten grau, Cursor `not-allowed`, Tooltip „Nur Leitung“ / „Übergang nicht vorgesehen“), verzögerter Commit (E2). **„Abgeschlossen“ und „Abgebrochen“ sind Drop-Ziele, die nur PA8 bzw. PA9 öffnen**; Abbruch des Assistenten → Karte 200 ms zurück, nichts gespeichert. Mehrfach-Drag dorthin: „Abschließen geht nur einzeln – 3 Karten zurückgelegt“. Teilerfolg sonst: „3 verschoben, 1 übersprungen (nur Leitung)“.
- **Zeitplan** (`?ansicht=zeitplan`, Treegrid):

```
┌ Zeitplan                Nov | Dez | Jan   Zoom: Woche ◉ Monat ○   [Heute]   [Als Liste]   Filter ▾ ┐
│ Projekt                      │ KW45   KW46   KW47   KW48   KW49                                      │
│ ▾ Küche Lochau (Lieferung)   │ ════Bestellung════◆Liefer.  ▓▓Montage▓▓ ◇Abnahme                     │
│     Fremdgewerk Elektro      │            ┄┄┄┄┄┄┄┄ ──► Montage   ⚠ „Elektro endet 19.11. …“          │
│ ▸ Bad Bregenz (Montage)      │   ▓▓▓▓▓▓ ◇                                                          │
│ Kapazität                    │ 72 %   104 % ⚠  …                                                    │
└──────────────────────────────┴───────────────────────────────────────────────────────────────────────┘
```

| Element | Quelle | Bearbeitbar |
|---|---|---|
| Phasenbalken vergangen | `phasen_verlauf[].datum` | nein |
| Liefertermin ◆ (Raute 10 px `accent`) | `liefertermin_geplant`; `bestaetigter_termin` der Herstellerbestellung als zweite Raute hohl | Ziehen bzw. Popover → `setValue liefertermin_geplant` + Chip § 3.5 |
| Montage ▓ (Balken 12 px `ink`) | PH Montageauftrag `start`/`ende` | Ziehen bzw. Popover „Umplanen“ |
| Fremdgewerk ┄ (gestrichelt `line-strong` 1,5 px) | `PH Fremdgewerk.termine[]` (von/bis/art), sonst `termin_von/bis`; Pfeil aus `abhaengig_von` | Popover → Terminzeile |
| Abnahme ◇ (hohl) | PH Abnahme `datum` | nein |
| Übergabe | `uebergabe_am` | **nein** (E7) |
| Aufgaben (optional) | `faellig` | Popover |

Konflikt (`utils/montageplan.abhaengigkeit_konflikt`): Icon `triangle-alert` + Text „Elektro endet 19.11., Montage beginnt 17.11. – Montage verschieben oder Elektro vorziehen“, nie nur rot. Jeder Balken ist `<button>` mit `aria-label` „Montage 17.–18.11., Geplant“; „Als Liste“ zeigt alle Termine chronologisch. Unter 1024 px kein Ziehen, nur Popover. Geplante Phasendaten erst mit A17 (Meilensteine).
- **Leer:** „Noch keine Projekte …“ [Projekt anlegen] · „Keine Projekte in Phase ‚Montage‘ mit Berater A. Berger.“ [Filter zurücksetzen] · „Keine offenen Mängel.“ · Zeitplan: „Keine terminierten Projekte im Zeitraum.“ [Zeitraum erweitern].
- **Kürzel:** § 3.7; Ansicht wechseln über Segment (kein Einzelbuchstabe).

### 5.3 Projekt anlegen `/projekte/neu` (PA1, ein Bildschirm)

```
┌ Neues Projekt ─────────────────────────────────────────────────────────────────────────────┐
│ Kunde *        [ Fam. Muster, Lochau            ▾ ]  (PH Kontakt, „neu anlegen“)              │
│ Aus Anfrage    [ PH-ANF-2026-0123 Küche Lochau  ▾ ]  (optional, gefiltert auf Kunde)          │
│ Projektart *   (Wohnung)(Haus)(●Küche)(Bad)(Hotel)(Objekt)(Yacht)(Outdoor)(Sonstiges)          │
│ Titel          [ Küche Lochau  ]  leer = „<Art> <Kundenname>“                                 │
│ ▸ Objekt & Team (eingeklappt, vorbelegt)   ▸ Räume (Vorschläge je Art)                        │
│ Legt Projekt „Küche Lochau“ für Fam. Muster an (Phase Anfrage) und verknüpft PH-ANF-…         │
│                                                         [Abbrechen]   [Anlegen und öffnen ⌘↵] │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

- Felder: `kontakt`*, `anfrage`, `projektart`*, `titel`, `kurzbeschreibung`, `prioritaet`; eingeklappt: `objekt_strasse/plz/ort/land`, `objekt_hinweis`, `baustelle_kontakt/telefon`, `berater` (Sitzung bzw. `PH Anfrage.zugewiesen_an`), `planer`, `montageleiter`, `team[]`, `raeume[]` (Chips: Küche → Küche; Bad → Bad; Wohnung/Haus → Wohnen, Essen, Schlafen, Kind, Arbeiten, Flur; Hotel → „Zimmertyp …“). „Adresse des Kunden übernehmen“ nur, wenn PH Kontakt eine Adresse hat.
- Mit `anfrage`: `ph_projekte.api.projekt_aus_anfrage(anfrage, projektart, titel)` (idempotent; existiert Folgeprojekt → öffnet es, Toast „Projekt bestand schon“), danach `save` der eingeklappten Felder. Ohne Anfrage: `insert PH Projekt` mit `idempotency_key = projekt-neu:<kontakt>:<sitzungs-uuid>`.
- Fehler „Bitte zuerst einen Kontakt anlegen.“ → Inline-Hinweis mit Knopf „Kontakt aus Anfrage anlegen“ (CRM).
- Ergebnis: Mappe, Toast „Projekt angelegt“, Empfohlen zeigt „Termin vereinbaren“.

### 5.4 Aufmaß `/projekte/[projekt]/aufmass/[name]` (T5, iPad-tauglich)

- Kopf: Status (Entwurf · Erfasst · Geprüft), Termin (PH Termin), aufgenommen von, Datum. Primär je Status: Entwurf → „Als erfasst markieren“, Erfasst → „Prüfen“ (Planer/Leitung, setzt `geprueft_von/am`).
- Abschnitte: Objekt (`objekt_text`, `etage`, `aufzug`, `raumhoehe_standard_mm`, `zugang_hinweis`) · Räume (`raeume[]`) · Maße in mm (`masse[]`, Ziffernfeld, Einheit fest „mm“) · Anschlüsse (`anschluesse[]`) · Skizze (`skizze`, Upload/Foto) · Fotos (`fotos[]`) · Plausibilität (`plausibilitaet`, Server-Text als `warning`-Band, nicht blockierend) · Notiz.
- Planung zeigt im Kopf „Aufmaß PH-AFM-… (geprüft 02.11.)“ (`PH Planung.aufmass`).
- Aufmaß beim Kunden vor Ort → Hinweis im Angebot (Faktura): „Vertragsort ‚Beim Kunden‘ prüfen“ (§ 12.3).
- Leer Räume: „Noch keine Räume erfasst.“ [Raum hinzufügen].

### 5.5 Planung `/projekte/[projekt]/planung/[name]` (T5)

```
┌ … › Küche Lochau › Planung „Küche Variante Insel“ v3                        [● Vorgelegt]  [Freigeben ⌘↵] [⋯] ┐
│ Küchenplaner · Planer M. K. · v3 (v2 verworfen) · Aufmaß PH-AFM-2026-0004 geprüft                          │
├ Vorschau | Positionen 14 | Konfiguration | Versionen 3 | Verlauf                                            ┤
│ ┌ Vorschau / PDF ─────────────────────────────────┐ ║ KUNDE                                                 │
│ │                                                  │ ║ Kunde sieht · vorgelegt 02.11.                        │
│ └──────────────────────────────────────────────────┘ ║ Entscheidung: Änderung gewünscht „Insel 20 cm kürzer“  │
└──────────────────────────────────────────────────────╨───────────────────────────────────────────────────────┘
```

- **Primär je Status:** Entwurf → „Vorlegen“ (Sheet: Text an Kunden, Vorschau, 10-s-Commit; `kunden_vorlegen()`, danach Kundennachricht über `portal_status_senden` bis A11 die Methode selbst schreibt) · Vorgelegt → „Freigeben“ (Dialog: Quelle „Kunde hat im Gespräch freigegeben“ → `freigeben(durch_kunde=1)`; nur Leitung ohne Kundenbezug) · Änderung gewünscht → „Neue Version“ · Freigegeben → „Positionen ins Projekt“. Menü: Neue Version (`neue_version`), Verwerfen (Dialog § 3.4).
- **Portal-Freigabe** (existiert): `kunde_entscheidung` (offen/freigegeben/aenderung), `kunde_kommentar`, `freigabe_quelle`, `vorlage_dokument`; Kundenentscheidung erscheint als Banner + Rückmeldung (§ 3.6) mit Primär „Freigabe übernehmen“ bzw. „Neue Version“. Freigabe gilt nur für diese Version.
- **Tab Vorschau:** Bild groß, Datei mit Herunterladen; Handskizze/Modell: Checkbox „Echtes Original bestätigt“ (`echt_bestaetigt`) Pflicht, Servertext am Feld.
- **Tab Positionen:** `positionen[]` (bezeichnung, produkt mit Bild, ausfuehrung_text, menge, raum aus `PH Projekt.raeume`, Preis netto + USt-Satz nur Leitung und erst mit A3, bis dahin `preis_cent` mit Kennzeichnung „Brutto“). Raum-Gruppierung.
- **Tab Konfiguration:** `daten_json` als einklappbarer Baum (readonly); Leitung „Bearbeiten“ mit JSON-Prüfung („Konfiguration ist kein gültiges JSON.“). Import-Protokoll (`import_format`, `import_protokoll`) lesend.
- **Tab Versionen:** Kette über `vorgaenger`; Vergleich zweier Versionen: Bildregler (`role="slider"`, `←/→` 5 %, `Pos1/Ende`) + Positions-Diff (neu `success`-Text „neu“, entfallen durchgestrichen + „entfällt“, Menge geändert „Menge 2 → 3“). Leer: „Erste Version – Vergleich ist ab Version 2 möglich.“ [Neue Version].
- **Leer Positionen:** „Noch keine Positionen. Sie kommen aus dem Planungsprogramm oder du erfasst sie hier.“ [Zeile hinzufügen].
- **Kürzel:** `⌘Enter` Primär, `Shift+N` neue Version, `Shift+←/→` Version, `Alt+1…5` Tabs.

### 5.6 Rendering `/projekte/[projekt]/renderings/[name]` (Bildansicht)

```
┌ … › Küche Lochau › Rendering B v2 „Insel Eiche“   [KI-gestützt ⓘ]  [● Rückmeldung offen]                   [⋯] ┐
│ Varianten: [A v3 ✓] [● B v2] [C v1]        thumbs-up 4 · thumbs-down 1 · 6 Einträge · 2 offen                   │
├────────────────────────────────────────────────────────────────────┬──────────────────────────────────────────┤
│                                                                    │ RÜCKMELDUNGEN (älteste oben)              │
│        Bild (privat, gestreamt)       (1)                          │ (1) Pin · Fam. Muster · 02.11.    Offen   │
│                       (2)                                          │   „Griffe lieber schwarz?“                │
│                                   (3)                              │   ↳ Studio: „Ja, Variante …“              │
│   ┌ Ansehen | Pin · − 100 % + · Vergleichen · Vollbild ┐           │ (2) Sprachnotiz 0:42 [play] ━━○──  1×/1,5× │
│   └────────────────────────────────────────────────────┘           │ ✓ Freigabe durch Kunde 03.11.             │
├────────────────────────────────────────────────────────────────────┴──────────────────────────────────────────┤
│ Antwort an (1) „Griffe lieber schwarz?“ [                                     ]  [Senden ⌘↵]  [Erledigt ⇧E]   │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Bildfläche** `surface-2` (dunkel `surface-inverse`), Zoom 1–4× (Scrollrad/Pinch nur auf der Bildfläche, `touch-action: none` dort; Browserzoom sonst erlaubt), Zoomstufe als Text.
- **Pins** = `<button>`: sichtbarer Kreis 28 px, Trefferfläche 44 px im iPad/Präsentation, Füllung `ink`, Ziffer weiß 12/600, Außenring 2 px weiß + Schatten `0 0 0 1px rgb(0 0 0 / .35)`; offen = zusätzlicher Ring 2 px `accent`; erledigt = Füllung `ink-soft` + Haken statt Ziffer. Fokus-Reihenfolge = Fadenreihenfolge; `aria-label` „Pin 1 von Fam. Muster: Griffe lieber schwarz? – offen“. Hover/Fokus Pin ↔ Fadeneintrag gegenseitig hervorgehoben (Ring 120 ms).
- **Pin setzen nur im Modus `Pin`** (Segment in der Werkzeugleiste); im Pin-Modus Fadenkreuz per Pfeiltasten (1 %, Shift 5 %), `Enter` setzt; Undo 8 s für neue Pins. Speichern: `insert PH Rendering Feedback art=annotation, von=studio, punkt_x/y`.
- **Varianten-Leiste:** Renderings gleicher Planung nach `variante` (A–F), je höchste `version`, Miniatur 40×28 + Status. Vergleichen (`Shift+C`): nebeneinander oder Regler; eine Variante → Knopf deaktiviert, Tooltip „Vergleich braucht eine zweite Variante“.
- **KI-Kennzeichnung:** `ki_generiert` → Chip „KI-gestützt“; beim Vorlegen Pflicht-Checkbox „Kunde sieht den Hinweis ‚KI-gestützte Visualisierung‘“; Hinweis auch in Statusbericht/Mappe-PDF (KI-VO Art. 50 Abs. 4, Anwendbarkeit RA).
- **Faden:** `feedback_uebersicht()`; Kunde links, Studio rechts; Votes nur als Zähler; Freigabe grüne Systemzeile; Sprachnotiz Player (`getFile`, Fortschrittsbalken, 1×/1,5×, Format nicht abspielbar → „Format hier nicht abspielbar – [Herunterladen]“), optional Feld „Kurzfassung“ (Studio tippt, erscheint im Faden; WCAG 1.2.1). Kunde am iPad: `erfasst_von_user` (A22) bzw. bis dahin Kommentar „erfasst am iPad durch M. K.“.
- **Ein Antwortfeld** unten, `⌘Enter` sendet (`PH Rendering.antworten(text, antwort_auf)`), `Shift+E` erledigt (verzögert, § 3.4). Nach der letzten Antwort setzt der Client die Workflow-Aktion „Beantwortet“ automatisch (verzögerter Commit, Toast „Status auf ‚Vorgelegt‘ · Rückgängig“) – kein Frage-Toast.
- **Freigabe-Banner:** `freigabe_feedback` gesetzt, Status ≠ Freigegeben → „Fam. Muster hat diese Variante am 03.11. freigegeben.“ [Freigabe übernehmen] (WF „Freigeben“). Neue Version übernimmt die Freigabe nicht (QA 22).
- **Vorlegen** (Status Entwurf): Sheet „Renderings vorlegen“ (§ 6.3).
- **Leer:** „Noch keine Rückmeldung. Der Kunde sieht das Rendering seit 02.11. im Portal.“ / Entwurf: „Noch nicht vorgelegt.“ [Vorlegen].
- **Fehler:** Bild fehlt beim Vorlegen → „Bitte zuerst ein Bild hochladen.“, Ablagefläche Rand `accent` einmal 240 ms.

### 5.7 Rückmeldungen `/projekte/rueckmeldungen` (Inbox)

```
┌ Projekte › Rückmeldungen                                    Offen 7 | Beantwortet | Alle                 ┐
├ [Alle 7] [Pins & Kommentare 4] [Sprachnotizen 1] [Freigaben 1] [Nachrichten 1] [Nachträge 0] | Nur meine ⟷ ┤
│ ● Fam. Muster · Küche Lochau · Rendering B · Pin     „Griffe lieber schwarz?“      seit 4 Tagen         │
│ ● Hotel Beispiel · Suite 3 · Nachricht               „Können wir Do statt Mi?“     09:12                │
│ ✓ Hr. Beispiel · Bad Bregenz · Freigabe Variante A                                 gestern              │
├──────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ VORSCHAU 480 px: Bildausschnitt 200×200 um den Pin bzw. Faden · Antwortfeld · [Senden ⌘↵] [Erledigt ⇧E] │
│ [Zum Projekt p] [Ins Rendering ⇧R] [Als ungelesen ⇧U]                                                    │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- Quellen § 3.6; Zähler identisch zur Pill. Zeile 48 px; ungelesen = Punkt 6 px `accent` + Titel 500; Quellen-Icon (`map-pin`, `mic`, `check-check`, `message-square`, `file-diff`) mit Wort im Chip; Alter rechts tabular.
- Sortierung: älteste offene zuerst; über Erinnerungsgrenze „seit 4 Tagen“ `warning-text`.
- Freigaben (Rendering/Planung): Primär „Freigabe übernehmen“. Nachtragsentscheidung: Primär „Nachtrag öffnen“ (Übernahme an Faktura § 5.12). Nachricht: Antworten = `antworten(text)`; Öffnen markiert nach 1 s gelesen.
- „Erledigt“ verzögert (120 ms raus, Fokus nächste Zeile). Als ungelesen: `setValue status=Ungelesen` (bis A15).
- Massenaktionen: „Erledigt“ (nur Rückmeldungen), „Als gelesen“ (nur Nachrichten); gemischt: Dialog „3 von 5 möglich“. Sammel-Toast.
- iPad: ≥ 1024 Liste + Vorschau; 640–1023 Vorschau als Vollseite „‹ Rückmeldungen“; Wischen rechts = Erledigt (Beschriftung sichtbar), links = „Mehr“.
- **Leer:** noch nie „Noch keine Rückmeldungen. Hier landen Pins, Sprachnotizen, Freigaben, Nachtragsentscheidungen und Nachrichten aus dem Kundenportal.“ · Filter „Keine Sprachnotizen in deinen Projekten.“ [Filter zurücksetzen] · alles erledigt „Alles beantwortet – keine offenen Rückmeldungen.“ · Vorschau ohne Auswahl „Wähle links eine Rückmeldung (j/k).“
- Glocke: neue Kundeneinträge benachrichtigen Berater + Planer (Quelle ph_core A23; bis dahin Abfrage „seit Zeitstempel“ im Backoffice alle 60 s).

### 5.8 Montagen `/projekte/montagen` (Kalender · Kanban · Liste)

```
┌ Projekte › Montagen              Woche | Monat | Tag   ‹ KW 46 ›  [Heute]  ☑ Kapazität ☑ Fremdgewerke  [+ Montage] ┐
│ Kapazität: Mo 8/16 h · Di 16/16 h · Mi 20/16 h ⚠ „über Kapazität“ · …   (Tooltip „16 h = 2 Monteure × 8 h“)        │
├──────────────┬──────────────────────┬──────────────────────┬──────────────────────┬─────────────────────────────┤
│ Team         │ Mo 10.11.            │ Di 11.11.            │ Mi 12.11.            │ …                           │
│ T. Steiner   │ ┃Küche Lochau 08–16 Geplant (TS)(JH) ─ ein Block über beide Teamzeilen ─┃                         │
│ J. Huber     │ ┃                                     ┃ ┃Bad Bregenz 07:30 Unterwegs┃ ⚠ doppelt eingeplant      │
│ Elektro Mayr │                      │ ┄ Fremdgewerk Elektro (lesend) ┄                                           │
├──────────────┴──────────────────────┴──────────────────────┴──────────────────────┴─────────────────────────────┤
│ Nicht eingeplant: Küche Hard · Wohnen Dornbirn   → ziehen oder „Planen“                                          │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Blöcke** = PH Montageauftrag: Höhe 32 (Desktop) / 44 (iPad), Radius 6, Fläche `*-soft`, links 3 px Statusleiste, Titel 12/500 + Zeit 12 `muted` + Statuswort; Mehrpersonen-Auftrag = **ein** Block über alle Teamzeilen mit Avataren. Jeder Block ist `<button>`; `Enter`/Antippen öffnet Popover „Montage umplanen“ (360 px): Datum, Start, Ende, Team (Mehrfachauswahl), Kollisionen (`kollisionen` des Auftrags bzw. `utils/montageplan`), „Übernehmen“. Fokus-Kürzel § 3.7.
- **Ziehen achsengebunden:** Richtung nach den ersten 8 px (horizontal = Zeit, vertikal = Person); Geist mit Text „Mi 12.11. · 07:30 · J. Huber statt T. Steiner“; Rand ziehen = Dauer. iPad: Drag erst nach 150 ms Halten; unter 1024 px nur Popover. Speichern `setValue start/ende` bzw. `save team`, Undo 8 s, danach Chip „Kunde nicht informiert“ am Block (§ 3.5).
- **Doppelbuchung:** Drop erlaubt, Block mit Warn-Rand + Text „J. Huber doppelt eingeplant (Bad Bregenz 07:30)“. Abwesenheiten: graue Zeile „Abwesenheiten nicht geprüft“ bis ph_personal sie liefert (10-konzept-personal, Schnittstelle „abwesend“ ohne Art).
- **Kapazität:** je Tag Summe `stunden_geplant` ÷ (**Monteure verfügbar** × `montage_tagesstunden`). „Monteure verfügbar“ = Report-Filter `monteure` (Standard 2, Leitung änderbar, gespeichert je Benutzer), nicht die Zahl der eingeteilten Personen; im Tooltip offengelegt. Über 100 % → `warning` + Icon + Text „20 von 16 h“. Fahrzeug (`fahrzeug`) als Chip im Block, wenn gesetzt.
- **Nicht eingeplant:** Projekte in Lieferung ohne Montageauftrag → Karte ziehen oder Knopf „Planen“ öffnet Sheet § 6.2 mit vorbelegtem Datum.
- **Kanban** (Board „PH Montageaufträge“): Geplant · Unterwegs · In Arbeit · Fertig · Abgenommen (+ Abgebrochen eingeklappt). Drop auf „Abgenommen“ öffnet „Abnahme mit Kunde“ (§ 6.5), nie direkt.
- **Liste:** Nummer, Titel, Status, Start, Ende, Montageleiter, Ort, Team, Leistungen x/y, Mängel offen, Std. geplant/ist, Leistungsnachweis ✓, Abnahme ✓.
- **Leer:** Woche: „Keine Montagen in KW 46.“ [Montage planen] · noch nie: „Noch keine Montagen. Montagen entstehen aus einem Projekt in Lieferung.“ · ohne Teams: „Noch keine Monteure eingeteilt. Teams entstehen beim Planen einer Montage.“ · Nicht eingeplant leer: „Alle Projekte in Lieferung sind eingeplant.“ · Filter: „Keine Montagen mit Status ‚Unterwegs‘.“ [Filter zurücksetzen].

### 5.9 Montageauftrag `/projekte/montagen/[name]` (T5, Desktop)

```
┌ … › Montagen › PH-MON-2026-0031 · Montage 17.11.2026: Küche Lochau      [● Geplant]   [Unterlagen prüfen ⌘↵] [⋯] ┐
│ Geplant ─○ Unterwegs ─○ In Arbeit ─○ Fertig ─○ Abgenommen                                                        │
├ Übersicht | Leistungen 6/9 | Fotos 12 | Mängel 1 | Bericht | Verlauf                                              ┤
│ Termin 17.11. 08:00–16:00 · Ist 08:12–15:40 · Std. 8,0 / 7,5 · Fahrzeug Bus 1                                     │
│ Ort Hauptstr. 1, 6911 Lochau · „Hintereingang, Lift bis 2. OG“ [Karte] · Vor Ort Fr. Muster · 0664 …             │
│ Team T. Steiner (Montageleiter) · J. Huber · [+] · Unterlagen: Küchenplan v3.pdf · [+ aus Projektdokumenten]      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Primär Desktop je Status:** Geplant → „Unterlagen prüfen“ (Checkliste: Unterlagen vorhanden, Team vollständig, Kunde erreichbar, Leistungen aus gelieferten Positionen) · Unterwegs/In Arbeit → keine Primäraktion (Statusknöpfe im `⋯ › Status korrigieren`) · Fertig → „Abnahme mit Kunde“ (bzw. „Leistungsnachweis erfassen“, wenn Teilmontage ohne `teilabnahme`) · Abgenommen → „Protokoll öffnen“.
- **Leistungen:** `leistungen[]` (beschreibung, dauer_h_geplant, dauer_h_ist, erledigt, position) – Checkzeile, Undo 8 s. Leer: „Keine Leistungen – sie kommen aus gelieferten Positionen.“ [Leistung hinzufügen].
- **Fotos:** Raster, Filter Art, Text „Kunde sieht“/„Intern“ je Foto, `foto_hinzufuegen(...)`; Vorher/Nachher-Vergleich. Leer: „Noch keine Fotos.“ [Fotos hochladen].
- **Mängel:** `maengel[]` (beschreibung, foto, frist, verantwortlich Studio/Lieferant/Fremdgewerk + `verantwortlich_ref`, status, servicefall_ref, behoben_am); „→ Servicefall“ (`mangel_an_service`; ohne ph_service deaktiviert „Service-Bereich noch nicht eingerichtet“). Leer: „Keine Mängel.“
- **Bericht:** `sprache_bericht` (vorbelegt aus `PH Kontakt.sprache`), `bericht`, Vorschau „PH Montagebericht“ rechts; Ablage `bericht_als_dokument`. Leistungsnachweis-Unterschrift (E3) als Abschnitt mit Status „unterschrieben / Kunde abwesend / verweigert“ (A23, bis dahin Kommentar mit Grund).
- **Zeiten:** im Verlauf + Übersicht; „Zeit buchen“ (`zeit_buchen`) nur für Teammitglieder; Buchen für andere nur Montageleiter dieses Auftrags oder Leitung (Server Action prüft; A8 serverseitig). Datum = Tag der Leistung (bis A8 nur Tag 1 möglich → mehrtägige Aufträge: Hinweis „Weitere Tage unter Zeiten buchen“, dort `insert PH Projektzeit` mit `montageauftrag` und Datum).
- **Abbrechen** (Leitung, `⋯`): Dialog mit Pflicht `abbruch_grund`.
- **Löschen:** nur Status Geplant und Leitung (A5 `on_trash`; bis dahin UI bietet Löschen nur in Geplant an).

### 5.10 Abnahme `/projekte/abnahmen/[name]` (T5, iPad-tauglich)

```
┌ … › Abnahme PH-ABN-2026-0012 · Schlussabnahme · Küche Lochau · 17.11.2026   [● Mit Mängeln]  [Abschließen] (1 Mangel offen) ┐
│ Entwurf ─● Unterzeichnet / Mit Mängeln ─○ Abgeschlossen       Sprache de · Ort Lochau · Kopie an Kunde: Portal 17.11. 16:02 │
├───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Position                      Zustand     Beschreibung / Foto / Frist / Verantwortlich          erledigt                   │
│ Hochschrank links             ok                                                                                           │
│ Arbeitsplatte Eiche           Mangel      „Kratzer 3 cm“ [Foto] Frist 01.12. · Lieferant        [Mangel erledigt] [→ Service] │
├───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Unterzeichnet 17.11. 15:58 · Fam. Muster (Anna Muster) · Studio T. Steiner · Protokoll PDF · Prüfwert sha256 a3f…          │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Entwurf:** Positionen editierbar (Segment ok/Mangel/Nacharbeit 48 px; Beschreibung Pflicht bei Mangel/Nacharbeit, Servertext an der Zeile), Primär „Abnahme mit Kunde“ (§ 6.5).
- **Ab Unterzeichnet readonly** (E11): nur `erledigt/erledigt_am/servicefall_ref` je Zeile über `mangel_erledigt(zeile)` / `mangel_an_service(zeile)`. „Abschließen“ erst bei `maengel_offen = 0`, sonst deaktiviert mit Grund „1 Mangel offen“. Leer offen: „Keine offenen Mängel – du kannst abschließen.“ [Abschließen].
- **Kopie an Kunden** Pflicht (F8): automatisch nach Unterzeichnen über Portal-Dokument (`protokoll_als_dokument` + `portal_freigeben`) und Mail, wenn E-Mail vorhanden; sonst Pflicht-Auswahl „Papier übergeben“ vor „Abschließen“. Kanal + Zeit stehen im Kopf (Felder A5 `kopie_an_kunde_am`/`kopie_kanal`; bis dahin Kommentar).
- **Zurück** (Leitung) aus Unterzeichnet/Mit Mängeln → Entwurf nur mit Pflichtgrund; neue Unterschrift nötig, altes PDF bleibt (A5; bis dahin Knopf nicht angeboten).
- **Verweigert** (A23): Kunde verweigert → Status „Verweigert“ mit Grund und Zeuge; bis dahin Ablauf § 6.5 Schritt „Kunde verweigert“ legt Leitungsaufgabe + Kommentar an, Abnahme bleibt Entwurf.
- Fremdgewerk-Abnahmen erscheinen in § 5.13, nicht hier.

### 5.11 Mängel `/projekte/maengel` (T2)

- Quellen: PH Montage Mangel, PH Abnahme Position (`zustand ≠ ok`, nicht erledigt), PH Fremdgewerk `maengel[]`. Spalten: Projekt, Kunde, Quelle (Montage/Abnahme/Fremdgewerk), Beschreibung, Foto, Frist (inline), Überfällig (`utils/maengel.tage_ueberfaellig`, Text „seit 3 Tagen“), Verantwortlich (Studio/Lieferant/Fremdgewerk + Name), Servicefall, Status.
- Zeilenaktionen: „Erledigt“ (Montage: `setValue status=behoben` + `behoben_am`; Abnahme: `mangel_erledigt`), „→ Servicefall“, Frist ändern. Verantwortlich = Lieferant → Hinweis „Kunde über Verzögerung informieren“ (§ 3.5) und Regress im Servicefall.
- Filter: Nur überfällig, Quelle, Verantwortlich, Projekt, Nur meine. Leer: „Keine offenen Mängel.“ · Filter „Keine überfälligen Mängel.“ [Filter zurücksetzen].

### 5.12 Nachträge (Abschnitt in Tab Positionen, Liste `/projekte/nachtraege`, Akte `/projekte/[projekt]/nachtraege/[name]`)

```
┌ … › Küche Lochau › Nachtrag 2 „Hochschrank statt Regal“        [● Vorgelegt]   frist 21.11.     [⋯] ┐
│ Grund Kundenwunsch · Termin-Auswirkung „+1 Woche Lieferung“                                          │
├ Positionen ─────────────────────────────────────────────────────────────────────────────────────────┤
│ entfällt  Regal offen 60 cm                    1 Stk      −  (Leitung: Betrag)                       │
│ neu       Hochschrank 60 cm Eiche              1 Stk      +                                          │
│ Differenz (Leitung, netto + USt je Satz mit A3)                                                       │
├ Entscheidung ───────────────────────────────────────────────────────────────────────────────────────┤
│ offen · vorgelegt 14.11. · Kunde entscheidet im Portal oder hier mit Unterschrift                     │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Anlegen** (Sheet 640 px, ein Bildschirm): Projektpositionen wählen (entfällt/ändern; `bezug_zeile`), neue Positionen hinzufügen, Grund (Select), Beschreibung, Termin-Auswirkung, Freigabefrist. Satz über dem Knopf: „Legt Nachtrag 2 an: 1 entfällt, 1 neu.“ Primär „Nachtrag anlegen“. `insert PH Nachtrag` mit `idempotency_key`.
- **Vorlegen:** Sheet mit Text + Vorschau → 10-s-Commit → Status Vorgelegt + Kundennachricht (§ 3.5). **Portal-Vorlage nur mit Schalter `nachtrag_portal`** (A10: Belehrungstext-Version + `fagg_hinweis_bestaetigt` bei Verbrauchern); bis dahin Entscheidung nur „vor Ort/am iPad mit Unterschrift“ (`entscheidung_quelle = backoffice`, `unterschrift_kunde` + `unterschrift_name` Pflicht).
- **Preise im Portal:** Nachtrag ohne Preis kann der Kunde nicht wirksam freigeben → Vorlage zeigt dem Kunden die Differenz, auch wenn `portal_positionen_preise = 0` (Inhaber-Frage F9; bis zur Antwort Vorlage nur vor Ort mit ausgedrucktem Nachtrag).
- **Nach Freigabe:** Band „Nachtrag freigegeben – AB noch nicht angepasst“ [AB in Faktura anpassen] (Faktura-Assistent, Link `PH Nachtrag.auftragsbestaetigung` A10). `uebernommen` setzt erst die Faktura-Rückmeldung; bis A10 setzt die Server Action `uebernommen` nach erfolgreichem Faktura-Aufruf. Positionen fortschreiben nur über `nachtrag.projekt_aenderungen` nach A3-Korrektur.
- **Abgelehnt:** `ablehnung_grund` sichtbar; Storniert durch Studio (Leitung) mit Grund. Nach Unterschrift unveränderbar (A5).
- Leer: „Keine Nachträge. Änderungen nach dem Auftrag legst du hier als Nachtrag an.“ [Nachtrag anlegen].

### 5.13 Fremdgewerke `/projekte/fremdgewerke` (T2/T3, Drawer `?gewerk=`)

- Spalten: Gewerk, Projekt, Partner (`partnerbetrieb` oder `partner_text`), Ansprechpartner/Telefon (`tel:`), Leistung, nächster Termin (aus `termine[]`), Status, Abnahme-Status, Mängel offen, „Kunde sieht“, „Vertrag direkt mit Kunde“, Abhängig von, Kosten (Leitung).
- Kanban (Board „PH Fremdgewerke“): Offen · Angefragt · Geplant · In Arbeit · Erledigt · Abgesagt; Drop ruft `status_setzen(status)`, erlaubte Übergänge exakt (§ 7.5), nicht erlaubte Spalten grau. „Geplant“ ohne Termin → Server „Bitte zuerst einen Termin eintragen.“ → Karte zurück + Popover mit Terminzeile an der Karte.
- Drawer 560 px: Felder, Haftungshinweis (graue Infobox, Vorbelegung aus Einstellungen) · **Termine** (`termine[]`: art Aufmaß/Vorinstallation/Montage/Nacharbeit/Abnahme, von/bis, status, PH Termin, „Termin anlegen“ → `termin_anlegen`) · **Abnahme** (`abnahme_status` offen/abgenommen/mit Mängeln/verweigert, `abgenommen_am/von`, Notiz) · **Mängel** (`maengel[]`, `verantwortlich = Fremdgewerk`) · Status ▾.
- Massenaktion: Kunde sieht an/aus, Status (gemeinsame erlaubte Ziele).
- Leer: „Keine Fremdgewerke. Elektriker, Installateur oder Steinmetz koordinierst du hier.“ [Fremdgewerk anlegen] · Filter „Keine Fremdgewerke mit Status ‚Angefragt‘.“ · „Alle Fremdgewerke erledigt.“

### 5.14 Aufgaben `/projekte/aufgaben` (Kanban · Liste)

- Kanban „PH Projektaufgaben“: Offen · In Arbeit · Erledigt · Verworfen. Karte: Titel, Projekt, fällig (überfällig `danger-text` „überfällig“, heute `warning-text` „heute“), Zuständig, Art-Icon, Priorität, Bezug-Chip.
- Schnellanlage oben: Feld mit Token-Chips beim Tippen (`@` öffnet Personen-Vorschlag, `#` Projekt-Vorschlag, `!hoch`/`!niedrig`, Datumswörter heute/morgen/Mo–So/TT.MM. mit Tooltip-Datum); darunter normale Felder als Rückfall (Projekt Pflicht). `insert PH Projekt Aufgabe`.
- Aktionen: Erledigt (`erledigen`, `Shift+E`), Zeit buchen (`zeit_buchen`, `Shift+H`), Zuweisen (`Shift+A`), Verwerfen.
- Leer: „Noch keine Aufgaben.“ [Schnellanlage fokussieren] · „Keine überfälligen Aufgaben.“ · „Alles erledigt – keine offenen Aufgaben.“

### 5.15 Zeiten `/projekte/zeiten` (T2)

- Hinweis oben (einmalig, schließbar): „Projektzeiten sind keine Arbeitszeitaufzeichnung. Kommen/Gehen buchst du im Bereich Personal.“
- Spalten: Datum, Mitarbeiter, Projekt, Aufgabe, Montage, Tätigkeit, Von–Bis, Dauer (h:mm), abrechenbar, Status (Offen/Abgerechnet/Nicht abrechenbar), Stundensatz/Betrag (Leitung), Rechnung (A8, Link PH Rechnung; bis dahin `beleg_ref` lesend).
- **Zeit buchen** (Popover 360 px, `Shift+H`): Projekt (Kontext), Tätigkeit (nach Rolle vorbelegt), Dauer (Regel: Zahl ≤ 12 ohne Einheit = Stunden, > 12 = Minuten, `h`/`min`/`1:30` erlaubt; Interpretation live „= 1 h 30 min“) oder Von/Bis, Datum, Beschreibung, abrechenbar. `Esc` verwirft, `⌘Enter` speichert. Servertexte wörtlich („Mehr als 24 Stunden an einem Tag sind nicht plausibel.“). Buchen für andere nur Leitung/Montageleiter des Auftrags.
- **Abrechnen:** nicht hier. Abgerechnet wird beim Stellen der Rechnung in Faktura (Faktura liest offene abrechenbare Zeiten des Projekts). Bis A8: Leitung-Massenaktion „Als abgerechnet“ nur mit Auswahl einer **PH Rechnung** des Projekts (LinkFeld), Text als `beleg_ref` = Rechnungsnummer; nur Status Offen + abrechenbar; Bestätigung „n Zeiten werden gesperrt“.
- Gespeicherte Ansicht „Abrechenbar offen“. Report-Link „Zeiten je Projekt“ (Gruppierung nach Mitarbeiter nur Leitung).
- Leer: „Noch keine Zeiten gebucht. Buche Zeit in jedem Projekt mit Shift+H.“ · „Keine Zeiten im Oktober.“ · „Alle abrechenbaren Zeiten sind abgerechnet.“

### 5.16 Dokumente `/projekte/dokumente` (T2 Kacheln)

- Kachel: Vorschau, Titel, Kategorie, Version, Datum, Größe, „Kunde sieht“/„Intern“, Status. Filter: Kategorie, Projekt, nur Kunde sichtbar, Archivierte (aus).
- Aktionen: Portal-Freigabe an/aus (`portal_freigeben`, Undo 8 s = Gegenaufruf), „Neue Version hochladen …“ (`neue_version(datei)`), Herunterladen, In Montage-Unterlagen übernehmen. ZIP-Download über Backoffice-Route (`api/projekte/zip`, Dateien einzeln per `getFile`).
- Löschen: nicht für Kategorien Rechnung, Lieferschein, Abnahmeprotokoll, Montagebericht, Vertrag und nicht ab Projektphase Auftrag (A12; UI bietet es dort nicht an).
- Leer: „Noch keine Dokumente.“ · „Keine Dokumente der Kategorie ‚Plan‘.“ [Filter zurücksetzen].

### 5.17 Produktpässe `/projekte/produktpaesse` (T2) und Akte (T5)

- Liste: Produkt, Marke, Kunde, Projekt, Seriennummer, Lieferdatum, **Gewährleistung bis** (A10b; bis dahin Spalte ausgeblendet), **Herstellergarantie bis** (`garantie_bis`, leer = „keine Angabe“), Status, Pflegekategorie, Outdoor, „Kunde sieht“.
- Akte: QR (`portal_link()`), Abschnitte Produkt · Garantie & Gewährleistung (Garantiegeber, Monate, Hinweis, Beleg; Text bei abgelaufener Garantie, auch im Portal: „Herstellergarantie abgelaufen. Ihre gesetzlichen Gewährleistungsrechte bleiben davon unberührt.“ (KSchG § 9b)) · Materialien · Pflege · Dokumente · Verlauf. Aktionen: Drucken A5, Status, Portal-Link kopieren.
- Erzeugen: § 6.7.
- Leer: „Noch keine Produktpässe. Sie entstehen bei der Übergabe aus gelieferten Positionen.“ [Zu Projekten in Übergabe] · Materialien/Pflege leer: „Keine Materialangaben.“ / „Keine Pflegehinweise.“ [Zeile hinzufügen].

### 5.18 Referenzen `/projekte/referenzen` und Prüfseite

- Liste/Kanban: Eingereicht · Veröffentlicht · Abgelehnt · Widerrufen. Spalten: Titel, Projekt, Kunde, Anzeige, Bilder, eingereicht am, geprüft von/am.
- Prüfseite (Leitung): Bildraster links, rechts Prüfliste = Server-Regeln (eine aktive Freigabe je Projekt · nur Vorname · Ort ohne Straße/PLZ · Titel ohne Adresse · 1–12 Fotos · keine Handskizze/Modell · Fotos gehören zum Projekt · Einwilligungstext freigegeben); Verstöße als Zeile mit Icon + Servertext. Einwilligungsnachweis darunter.
- Aktionen: Veröffentlichen, Ablehnen (Notiz), Zurückziehen (Notiz), Widerruf erfassen (Dialog rot „Widerruf löscht die Bildkopien und kann nicht rückgängig gemacht werden.“, Fokus Abbrechen). UI nutzt die Methoden, nicht nackte Workflow-Aktionen; danach `getTransitions` neu laden (Synchron-Prüfung A1b).
- `referenz_freigabe_aktiv = 0`: Banner „Referenz-Freigabe ist ausgeschaltet (Einwilligungstext im Entwurf).“, Veröffentlichen deaktiviert.
- Leer: „Noch keine Referenzen eingereicht.“ · „Nichts zu prüfen.“

### 5.19 Berichte `/projekte/berichte/[report]` (T8)

| Report | Quelle | Hinweis |
|---|---|---|
| Übersicht (neu, Backoffice) | Dashboard Charts „PH Projekte je Phase“, „je Projektart“, „PH Montagen je Woche“, „PH Kundenfeedback je Woche“ (Titel „Rückmeldungen je Woche“), Report Kapazität | Chart-Palette 03 §1.6, Balken wachsen 240 ms, Stagger 24 ms; leer „Noch keine Daten im Zeitraum.“ |
| Projektstatus | PH Projektstatus | Beträge nur Leitung und nur mit `summen` |
| Offene Mängel | PH Offene Maengel | – |
| Montagekapazität | PH Montagekapazitaet je Woche (Filter Monteure) | – |
| Zeiten | PH Zeiten je Projekt | Gruppieren nach Mitarbeiter nur Leitung (E13) |
| Liefertermine | PH Liefertermine naechste 30 Tage | – |

Zeitlimit 8 s → „Zeitraum eingrenzen“. CSV nur Leitung. Durchlaufzeit je Phase entfällt bis Report A17b.

### 5.20 Einstellungen `/projekte/einstellungen` (T9, Leitung)

Abschnitte: Kundenportal (`portal_basis_url`, `portal_token_tage`) · Rückmeldungen (`feedback_erinnerung_tage`, `max_audio_mb`) · Bautagebuch (`tagebuch_aktiv`, `max_fotos_je_projekt`) · Referenzen (`referenz_freigabe_aktiv` + Hinweis Einwilligungstext) · Montage (`montage_tagesstunden`, `montage_kostensatz_cent` Leitung, `maengel_erinnerung_tage`) · Liefertermine (`liefertermin_kunde_automatisch` – Hinweis „sendet ohne Vorschau“; Standard aus lassen, sonst widerspricht § 3.5) · Texte (`haftungshinweis_fremdgewerke` „gilt für neue Fremdgewerke“, `montagebericht_fusstext`, `abnahme_fusstext` mit Druckvorschau, „Vorherige Fassung wiederherstellen“ aus `docinfo`) · Medien-Löschfrist (A12, Wert durch Inhaber/Datenschutz, kein Standard) · Automationen (Schalter AU1–AU12, § 9.2). `⌘S` speichert.

---

## 6. Sheets und Assistenten

Allgemein: ein Bildschirm, wo möglich; Satz „Legt … an“ über dem Primärknopf statt Zusammenfassungsschritt; `idempotency_key = <aktion>:<projekt>:<sitzungs-uuid>`; Methoden ohne Idempotenz → Doppelklick-Sperre + Vorab-Prüfung „existiert schon“; Teilfehler → Ergebnis-Drawer (§ 3.8); `Esc` mit Rückfrage nur, wenn Eingaben vorhanden.

### 6.1 PA1 Projekt anlegen → § 5.3

### 6.2 Montage planen (Sheet 640 px)

```
┌ Montage planen · Küche Lochau ──────────────────────────────────────────────────────────┐
│ Datum  Mo 10 · Di 11 · Mi 12 ⚠ · Do 13 · Fr 14 | Mo 17 ● · Di 18 …  (Kapazität je Tag)    │
│ Zeit   [08:00] – [16:00]          Team  (TS Montageleiter) (JH) [+]   Fahrzeug [Bus 1 ▾]   │
│ ▸ 9 Leistungen aus gelieferten Positionen · 14 h   (3 fehlen: Nachlieferung KW 49)         │
│ ▸ Unterlagen: Planung v3 (freigegeben) · Rendering A v3 (freigegeben)                      │
│ Legt Montage am Mo 17.11. 08:00–16:00 für T. Steiner + J. Huber an.                        │
│                                                        [Abbrechen]  [Montage anlegen ⌘↵]   │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

- Kalenderstreifen 2 Wochen mit Kapazität je Tag und Kollisionen der vorbelegten Personen (Text, nicht nur Farbe). Objekt in CH/DE → Prüfliste § 12.5 eingeblendet.
- Leistungen nur aus Positionen `lieferstatus in (geliefert, teilgeliefert)` und `montage_art in ("", "Eigenmontage")`, nie `storniert`; fehlende grau mit Liefertermin (Teilmontage). Bis A7 ruft das Backoffice `montageauftrag_anlegen(start, ende, montageleiter)` und **korrigiert die Leistungen danach per `save`** auf diese Regel (entfernt stornierte/fremd montierte/nicht gelieferte Leistungen).
- Kette: `montageauftrag_anlegen` → `save` (team, leistungen, unterlagen, stunden_geplant, fahrzeug). Teilfehler: Akte öffnet mit Band „Team nicht gespeichert – [Erneut speichern]“.
- Kunde informieren nicht im Sheet; danach Chip (§ 3.5). FAGG-Frist läuft → Hinweis „Montage innerhalb der Rücktrittsfrist nur auf ausdrückliches Verlangen des Kunden“ + Nachweis-Checkbox (§ 12.3).
- Datum wählen + „Montage anlegen“ = 2 Interaktionen bei Standardwerten (QA 53).

### 6.3 Renderings vorlegen (Sheet 560 px)

- Varianten-Häkchen (alle Entwürfe mit Bild vorgewählt), KI-Pflicht-Checkbox nur, wenn eine gewählte Variante `ki_generiert` hat, ein Text für alle (Vorschlag in Kundensprache), Vorschau Portal-Karte, Primär „Vorlegen“ → 10-s-Commit.
- Ausführung je Rendering: Workflow „Kunden vorlegen“, dann `kunden_vorlegen(nachricht)` nur beim **ersten** Rendering mit Text; folgende mit `nachricht` = leer **und** Unterdrückung der Standardnachricht nicht möglich → bis A11b (`renderings_vorlegen(namen[], nachricht)`) legt das Backoffice **eine** Kundennachricht über `portal_status_senden` an und ruft je Rendering nur die Workflow-Aktion + `setValue kunde_sichtbar=1, vorgelegt_am`. Danach `getTransitions` neu (QA 17).
- Kunde ohne E-Mail → § 3.5 Punkt 5.

### 6.4 Kunden informieren (Sheet 480 px) → § 3.5

### 6.5 Abnahme mit Kunde (Kiosk 390 px und iPad identisch, 5 Schritte)

```
┌ ‹ Küche Lochau          Abnahme 2/5 ┐   ┌ ‹ Küche Lochau          Abnahme 3/5 ┐
│ 9 Positionen                         │   │ Ich bestätige die Ausführung der      │
│ ┌──────────────────────────────────┐ │   │ Leistungen am 17.11. und nehme das    │
│ │   ALLES IN ORDNUNG  (56 px)      │ │   │ Werk ab – mit 1 Vorbehalt.            │
│ └──────────────────────────────────┘ │   │ ┌──────────────────────────────────┐ │
│ oder einzeln:                        │   │ │ Unterschrift Fam. Muster (≥240px)│ │
│ Hochschrank links  [ok][Mangel][Nach]│   │ └──────────────────────────────────┘ │
│ Arbeitsplatte      [ok][●Mangel][..] │   │ Name [ Anna Muster ]  Funktion [   ]  │
│   „Kratzer 3 cm“ [Foto] Frist +7     │   │ [Neu zeichnen]   Kunde verweigert ›   │
├──────────────────────────────────────┤   ├──────────────────────────────────────┤
│ [            WEITER            ]     │   │ [            WEITER            ]     │
└──────────────────────────────────────┘   └──────────────────────────────────────┘
```

1. **Leistungen:** offene Leistungen als Hinweis („2 Leistungen nicht abgehakt“), Haken direkt möglich.
2. **Positionen:** „Alles in Ordnung“ (setzt alle `ok`) oder einzeln Mangel/Nacharbeit mit Beschreibung (Pflicht), Foto, Frist-Chips (+3/+7/+14 Tage), Verantwortlich; Vorbehalte, „Abnahme erklärt“ (`abnahme_erklaert`).
3. **Unterschrift Kunde** unter dem Erklärungstext (E3; Sprache aus `sprache`): Feld volle Breite × ≥ 240 px, Hoch- und Querformat (Hinweis „Mehr Platz im Querformat“), `aria-label` „Unterschriftsfeld“, Name Pflicht, Funktion/Vollmacht optional bei Unternehmen (A23b). „Kunde verweigert ›“ → Grund + Zeuge → Ablauf endet mit Leitungsaufgabe.
4. **Unterschrift Studio:** ein Tipp „Als T. Steiner unterschreiben“ (gespeicherte Monteur-Signatur) oder neu zeichnen.
5. **Zusammenfassung:** „1 Mangel, Frist 01.12. – Protokoll ‚Mit Mängeln‘. Kopie an Fam. Muster: Portal + E-Mail“ (oder Auswahl „Papier übergeben“), Primär „Abschließen“ → Häkchen 400 ms.

Technik (bis A4b `abschluss_beim_kunden`): `abnahme_anlegen(montageauftrag)` (idempotent je Projekt; mit `teilabnahme` je Montageauftrag) → `save` Positionen → Prüfung „noch keine Unterschrift“ → `PH Abnahme.unterschrift_erfassen(kunde, name, studio)` → `PH Montageauftrag.unterschrift_erfassen(dieselbe Signatur, name, monteur)` mit Kommentar „Unterschrift aus Abnahme PH-ABN-…“ → Workflow Montage „Abnehmen“ → Workflow Abnahme „Unterzeichnen“/„Mängel feststellen“ → `protokoll_als_dokument` → Portal-Freigabe + Mail. Signatur und Eingaben liegen bis zur Bestätigung jedes Schritts in IndexedDB (Kunde unterschreibt nie zweimal); offline wird die Kette als ein Paket gepuffert, Erfassungszeit + Gerät (A19) bzw. bis dahin als Kommentar. Kiosk-Idle sperrt nicht ohne Sicherung des Entwurfs. Schrittwechsel `translateX 24 px` + Opacity 200 ms, zurück 160 ms. Ohne Mängel ≤ 5 Tipps.

**Variante „Nur Leistungsnachweis“** (Kunde abwesend, Teilmontage ohne `teilabnahme`, Regie): Schritte 1 + Unterschrift unter Leistungsnachweis-Text oder „Kunde abwesend“ (Fotos „nachher“ Pflicht, ≥ 1) → `PH Montageauftrag.unterschrift_erfassen` (nur bei Unterschrift); Workflow „Abnehmen“ entfällt, Montage bleibt „Fertig“, Empfohlen „Abnahme terminieren“.

### 6.6 Nachtrag anlegen/vorlegen → § 5.12

### 6.7 Produktpässe erzeugen (Sheet)

- Vorschau der Positionen, die einen Pass bekommen: nur `lieferstatus in (geliefert, montiert)` und ohne Pass; Positionen „bestellt“ ausgegraut „noch nicht geliefert“. Lieferdatum je Position aus Lieferschein (Logistik), sonst Pflichtfeld (kein Vorbelegen mit heute). Seriennummer optional, „Kunde sieht“ Standard an.
- Bis A10c erzeugt `produktpaesse_erzeugen(lieferdatum)` auch für „bestellt“ → Backoffice ruft die Methode **nur**, wenn keine bestellten Positionen ohne Pass existieren; sonst Hinweis „Erst nach Lieferung aller Positionen erzeugen“ oder Einzel-`insert PH Produktpass` je gewählter Position.
- Ergebnis-Toast „4 Produktpässe angelegt · Ansehen“.

### 6.8 PA8 Projekt abschließen (Leitung, Prüfliste)

Jede Zeile ✓/⚠ mit Link: alle Abnahmen abgeschlossen ohne offene Mängel · alle Montageaufträge Abgenommen/Abgebrochen · Fremdgewerk-Abnahmen erledigt (`abnahme_status`) · Abnahmeprotokoll-Kopie an Kunden übergeben (Kanal) · Nachträge entschieden und in AB übernommen · alle ABs abgerechnet · **Schlussrechnung gestellt und bezahlt** (PH Rechnung `art = Schlussrechnung`, `status = Bezahlt` – nicht `offen_cent` der AB) · Produktpässe für gelieferte Positionen · Rückmeldungen beantwortet · Aufgaben erledigt/verworfen · abrechenbare Zeiten abgerechnet oder nicht abrechenbar · Referenz angefragt (optional). „Abschließen“ mit ⚠ nur mit Begründung (Kommentar). Ausführung: Workflow „Abschließen“ + `kommentar`. Ohne Faktura: Zeilen „Belege in Faktura prüfen“ als ⚠.

### 6.9 PA9 Projekt abbrechen (Leitung)

1. Grund (Pflicht, Auswahl + Freitext) → `setValue abgebrochen_grund`.
2. Folgen (je Zeile Status, Link, Haken): offene Montagen „mit abbrechen“ · Fremdgewerke „absagen“ · Aufgaben „verwerfen“ · PH Termin ab heute „absagen“ · AB ≠ Storniert → „In Faktura stornieren“ (Faktura-Assistent, Grund vorbelegt) · bezahlte Anzahlung → Auswahl „Gutschrift/Rückzahlung“ oder „Stornogebühr laut AGB“ (nur wenn vereinbart; AGB-Klausel anzeigen, kein generierter Text; ABGB § 1336) · Herstellerbestellungen ≠ Entwurf → „Lieferant informieren“ (Aufgabe, Stornokosten erfassen) · Produktpässe → „Storniert“ (A10c; bis dahin `kunde_sichtbar = 0`).
3. Kunde informieren (Sheet § 3.5, optional). Portal bleibt an, Kopf „Projekt abgebrochen am …“.
Ausführung: Workflow „Abbrechen“ → je Haken Workflow/`status_setzen`/Faktura. Teilfehler → Ergebnis-Drawer; Faktura fehlt → Aufgabe „Belege in Faktura prüfen“ an Leitung. „Zurück auf Neu“ nach Abbruch: Dialog-Hinweis „Nur sinnvoll, wenn die AB nicht storniert ist oder eine neue AB folgt“.

### 6.10 Position zurücknehmen (Leitung, Dialog)

Grund (FAGG-Rücktritt / Gewährleistung / Kulanz), Abholtermin (Aufgabe an Logistik), Gutschrift (Faktura-Assistent). Bis A10d (`lieferstatus = retourniert`) setzt das Backoffice `lieferstatus = storniert` + Kommentar „Rücknahme: Grund“; Produktpass `kunde_sichtbar = 0`.

---

## 7. Workflows und Methoden (exakt)

Alle Workflow-Aktionen über `workflowAktionAction({doctype, name, action})`; die UI zeigt nur Aktionen aus `getTransitions`. Dokumentmethoden über `dokumentMethodeAction`, Modulmethoden über `client.call("ph_projekte.api.<name>")`. Workflow-Zustände haben Präfix „PH “; die UI zeigt den `status`-Wert mit Umlauten.

### 7.1 PH Projekt

| Von | Aktion | Nach | Erlaubt | UI |
|---|---|---|---|---|
| Anfrage | Planung starten | Planung | Mitarbeiter | Primär (verzögert) |
| Planung | Angebot erstellen | Angebot | Mitarbeiter | Primär → Faktura A2 |
| Angebot | Beauftragen | Auftrag | Leitung | Primär Leitung; Hinweis bei AB |
| Auftrag | Bestellen | Bestellung | Mitarbeiter | Primär; FAGG-/Anzahlungs-Hinweis |
| Bestellung | Liefern | Lieferung | Mitarbeiter | automatisch nach E4, sonst Primär |
| Lieferung | Montieren | Montage | Mitarbeiter | automatisch bei Montage „In Arbeit“ |
| Montage | Übergeben | Übergabe | Mitarbeiter | automatisch nach Schlussabnahme (Controller setzt `uebergabe_am` = heute = Abnahmetag) |
| Übergabe | Abschließen | Abgeschlossen | Leitung | PA8 |
| Anfrage … Montage | Abbrechen | Abgebrochen | Leitung | PA9 |
| je Phase | Zurück | Vorphase | Leitung | Phasen-Popover § 4.2 |
| Abgebrochen | Zurück auf Neu | Anfrage | Leitung | Banner |

Wieder öffnen nach Abschluss: kein Übergang (Inhaber-Frage F2). Methoden: `montageauftrag_anlegen(start, ende, montageleiter)`, `abnahme_anlegen(montageauftrag)`, `produktpaesse_erzeugen(lieferdatum)`, `portal_status_senden(text)`, `summen_aktualisieren()` (nur mit `summen`), API `projekt_aus_anfrage`, `auftragsmappe`.

### 7.2 PH Rendering

| Von | Aktion | Nach | Erlaubt | Bedingung |
|---|---|---|---|---|
| Entwurf | Kunden vorlegen | Vorgelegt | Mitarbeiter | `doc.bild` |
| Vorgelegt | Feedback erhalten | Rückmeldung offen | Mitarbeiter | meist automatisch |
| Rückmeldung offen | Beantwortet | Vorgelegt | Mitarbeiter | Client nach letzter Antwort |
| Vorgelegt / Rückmeldung offen | Freigeben | Freigegeben | Mitarbeiter | `doc.freigabe_feedback` |
| Vorgelegt / Rückmeldung offen | Freigeben | Freigegeben | Leitung | – |
| Entwurf / Vorgelegt / Rückmeldung offen | Verwerfen | Verworfen | Mitarbeiter | – |
| Verworfen → Entwurf, Freigegeben → Vorgelegt | Zurück | – | Leitung | – |

`kunden_vorlegen` setzt `workflow_state` nicht (A1) → Reihenfolge Workflow-Aktion, dann Methode (§ 6.3). PH Rendering Feedback: `erledigt()`, `antworten(text)`.

### 7.3 PH Montageauftrag

| Von | Aktion (UI-Wort) | Nach | Erlaubt | Controller |
|---|---|---|---|---|
| Geplant | Losfahren | Unterwegs | Mitarbeiter (+ PH Montage mit A18) | – |
| Geplant / Unterwegs | Beginnen | In Arbeit | dto. | `tatsaechlich_start`; schiebt Projekt (E4) |
| In Arbeit | Erledigt melden („Fertig“) | Erledigt | dto. | `tatsaechlich_ende` |
| Erledigt | Abnehmen (nur im Ablauf § 6.5) | Abgenommen | dto. | `doc.unterschrift_kunde`, `abgenommen_am` |
| Geplant / Unterwegs / In Arbeit | Abbrechen | Abgebrochen | Leitung | Pflicht `abbruch_grund` |
| Unterwegs | Zurück | Geplant | Mitarbeiter | – |
| Erledigt | Zurück | In Arbeit | Leitung | – |
| Abgebrochen | Zurück | Geplant | Leitung | – |

Methoden: `abnahme_anlegen()` (vergleicht heute `Behoben/Erledigt` → A9), `unterschrift_erfassen(unterschrift, name_kunde, monteur)`, `foto_hinzufuegen(...)`, `mangel_an_service(zeile)`, `bericht_als_dokument()`, `zeit_buchen(user, dauer_min, taetigkeit, beschreibung)`. `on_update` verkleinert `montage_von/bis` nie (A19b) → Kopf-Chip „Montage“ berechnet das Backoffice aus Min/Max der nicht abgebrochenen Aufträge.

### 7.4 PH Abnahme

| Von | Aktion | Nach | Erlaubt | Bedingung |
|---|---|---|---|---|
| Entwurf | Unterzeichnen | Unterzeichnet | Mitarbeiter (+ PH Montage A18) | `unterschrift_kunde and not maengel_offen` |
| Entwurf | Mängel feststellen | Mit Mängeln | dto. | `unterschrift_kunde and maengel_offen` |
| Unterzeichnet | Abschließen | Abgeschlossen | Mitarbeiter | – |
| Mit Mängeln | Abschließen | Abgeschlossen | Mitarbeiter | `not maengel_offen` |
| Unterzeichnet / Mit Mängeln | Zurück | Entwurf | Leitung | UI erst mit A5 (Pflichtgrund) |

Methoden: `unterschrift_erfassen(unterschrift_kunde, name_kunde, unterschrift_studio)`, `mangel_erledigt(zeile)`, `mangel_an_service(zeile)`, `protokoll_als_dokument()`.

### 7.5 PH Referenz, PH Fremdgewerk, PH Planung, übrige

- **PH Referenz:** Eingereicht → Veröffentlichen (Leitung, `not doc.beispiel`) / Ablehnen; Veröffentlicht → Zurückziehen; Eingereicht/Veröffentlicht → Widerrufen (endgültig). Methoden `veroeffentlichen`, `ablehnen(notiz)`, `zurueckziehen(notiz)`, `widerruf_erfassen(kanal)`.
- **PH Fremdgewerk** `status_setzen`: Offen → Angefragt/Geplant/Abgesagt · Angefragt → Geplant/Offen/Abgesagt · Geplant → In Arbeit/Angefragt/Abgesagt · In Arbeit → Erledigt/Geplant · Erledigt → In Arbeit · Abgesagt → Offen. „Geplant“ nur mit Termin. `termin_anlegen()`.
- **PH Planung:** `kunden_vorlegen()` (nur aus Entwurf), `freigeben(durch_kunde)`, `verwerfen()`, `neue_version()`, `positionen_ins_projekt()`.
- **PH Projekt Dokument:** `portal_freigeben(freigeben)`, `neue_version(datei)`. **PH Projekt Nachricht:** `als_gelesen()`, `antworten(text)`. **PH Projekt Aufgabe:** `erledigen()`, `zeit_buchen(...)`. **PH Projektzeit:** `als_abgerechnet(beleg_ref)` (Leitung). **PH Produktpass:** `portal_link()`, `status_setzen(status)`. **PH Nachtrag:** Status per `save`/Methoden laut Controller (`utils/nachtrag.py`); Freigabe vor Ort setzt `entscheidung_quelle = backoffice`, `entscheidung_am`, Unterschrift.

---

## 8. Mobil, iPad, Kiosk

### 8.1 Montage mobil `/montage` (Kiosk, 390 px und iPad)

```
┌ PLATZHIRSCH · Montage        T. Steiner ▾   online ┐   ┌ ‹ Küche Lochau              Geplant ┐
│ HEUTE · Mo 17.11.            [Heute|Woche|Tour]     │   │ Hauptstr. 1, 6911 Lochau    [Navi]  │
│ ┌──────────────────────────────────────────────┐   │   │ Fr. Muster · 0664 …         [Anruf] │
│ │ [NÄCHSTER] 08:00 Küche Lochau · Fam. Muster  │   │   │ Hinweis: Hintereingang, Lift 2. OG   │
│ │ Hauptstr. 1, Lochau · Team: J. Huber         │   │   ├──────────────────────────────────────┤
│ │ 9 Leistungen · 2 Unterlagen   [Navi] [Anruf] │   │   │ Unterlagen (2)                   ›   │
│ └──────────────────────────────────────────────┘   │   │ Leistungen 0/9                   ›   │
│ 14:00 Bad Bregenz · Abnahme mit Kunde              │   │ Fotos 0      [Kamera]            ›   │
│ Morgen (2) ›                                        │   │ Mängel 0     [+ Mangel]          ›   │
│                                                     │   │ Bericht · Zahlung                ›   │
│                                                     │   ├──────────────────────────────────────┤
│                                                     │   │ [            LOSFAHREN            ]  │
└─────────────────────────────────────────────────────┘   └──────────────────────────────────────┘
```

- `KioskShell`: Kopf 56 px, Ziele ≥ 48 px, Text ≥ 16 px, Flächen weiß, Statusfarbe nur als Rand + Icon + Wort; Primär unten fest 64 px volle Breite. Startkarte ganz = Öffnen; Navi/Anruf eigene 48-px-Knöpfe, Abstand ≥ 8 px; „NÄCHSTER“ als Kennzeichen (03 §8.9).
- **Wortliste:** `Losfahren` · `Beginnen` · `Fertig` · `Abnahme mit Kunde` (bzw. `Leistungsnachweis`). Server-Aktionsnamen bleiben intern.
- **Zustandsknopf** mit verzögertem Commit: Undo-Leiste 56 px über dem Knopf, Text 16 px „Fertig gemeldet · Rückgängig“ (8 s); offline erst nach Ablauf gepuffert. Bis A18 (Rolle PH Montage in Workflow) ist der Knopf für reine PH-Montage-Benutzer ausgeblendet, Text „Status meldet dein Montageleiter“; Montageleiter mit PH Projekte Mitarbeiter sehen ihn.
- **Eine Uhr:** Arbeitszeit = Beginnen → Fertig; „Pause“ im Stopp zieht ab. Beim Fertig-Tipp Sheet „7:28 h buchen?“ mit Stepper je Teammitglied (0,25 h), nur Personen aus `team[]`, „Buchen“ → `zeit_buchen` je Person (Datum = heute; bis A8 nur am ersten Auftragstag möglich, sonst `insert PH Projektzeit` mit Datum).
- **Leistungen:** Checkzeile 56 px, ganze Zeile tippbar, Undo 8 s; Ist-Dauer optional.
- **Fotos:** eigene Kamera-Ansicht (getUserMedia, Auslöser 72 px, Serienaufnahme ohne Rückfrage; Rückfall `<input capture>`), Kamera-Knopf 64 px. Art automatisch (vor Beginnen „vorher“, danach „nachher“, Chips umschaltbar), Upload im Hintergrund (Ring auf Miniatur), „Kunde sieht“ Standard aus; Bild auf lange Kante 2560 px verkleinert, Metadaten/GPS entfernt. Foto löschen = Papierkorb bis Tagesende. Bis A18 Tagebuch-Fotos für PH Montage nicht möglich – Montage-Fotos (`foto_hinzufuegen`) gehen.
- **Mangel:** Foto → Text (Diktat der Tastatur) → Frist-Chips → Speichern (`maengel[]` + `save`).
- **Bericht:** Sprache-Chips, Textfeld; Satzbausteine erst mit API (A20b).
- **Zahlung** (E14): zeigt offene Rechnung (Nummer, Betrag nur wenn Rolle es darf) und Text „Bitte per Überweisung – QR-Code auf der Rechnung“. Kein Bargeld-Feld.
- **Abnahme mit Kunde:** § 6.5.
- **Offline:** IndexedDB-Puffer (Status, Haken, Fotos bis `max_fotos_je_projekt`, Mängel, Unterschriften, Zeiten), Band 40 px `role="status"` „Offline – 5 Änderungen warten“ (Höhe 0→40 px 200 ms); Einspielen in Reihenfolge mit Client-UUID; Konflikte als Karte: „Nicht übertragen: Auftrag wurde abgebrochen“ / „Termin wurde auf Di verlegt – deine Fotos sind gespeichert“ / „Du bist nicht mehr im Team – Daten übertragen“ / „Leistung im Büro gelöscht – Haken verworfen“, je mit Anruf-Knopf Büro (Nummer aus ph_core Firma).
- **Fehler:** `forbidden` → „Kein Zugriff auf Montageaufträge – bitte Büro anrufen“. **Leer:** „Heute keine Montagen.“ + „Morgen (2) ›“ · Woche: „Diese Woche keine Montagen.“ · Unterlagen: „Keine Unterlagen zu diesem Stopp – Büro anrufen“ [Anruf].
- Montage in CH/DE: Startkarte zeigt Chip „CH – Meldung erledigt?“ aus § 12.5 (lesend).

### 8.2 iPad im Showroom – Präsentationsmodus (`KundenAnsicht`)

- Start über `⋯ › Kunde › Präsentieren` oder Knopf in Tab Planung. Band 4 s „Präsentation – Beenden: Wortmarke 1 s halten oder Esc 1 s halten“.
- Zeigt Renderings bildschirmfüllend (Varianten wischen), Planungsvergleich mit Regler; verbirgt Preise (auch `portal_positionen_preise` gilt), interne Notizen, Team, Zeiten, Navigation, Glocke, Seitenleiste, fremde Toasts (gepuffert, nach Verlassen gezeigt). Bildschirmsperre-Idle 15 min.
- Kunde pinnt/stimmt ab im Modus `Pin` (Ziele 44 px) → PH Rendering Feedback `von=kunde`, `quelle=backoffice`, `kontakt` = Projektkunde (+ `erfasst_von_user` A22). Freigabe/Nachtrag mit Unterschrift am iPad möglich (`entscheidung_quelle = backoffice`).
- Beenden: Wortmarke 1 s halten, Esc 1 s halten oder „Beenden“ unten links (40 px, `text-faint`) → **4-stellige Mitarbeiter-PIN** (ph_core `verifyPin`).
- Server weg: Pins lokal gepuffert, Band „Wird gespeichert, sobald die Verbindung zurück ist“ – kein Technikbegriff vor dem Kunden.
- Leer: „Noch nichts zum Zeigen – lege ein Rendering oder eine Planung an.“

### 8.3 iPad und Telefon im Backoffice

- iPad hoch: 6 Tabs passen; rechte Spalte als Sheet über „Aktivität“. Ziele 44 px.
- Telefon (Berater unterwegs, Ausnahme zu 02 §11.1): Mappe einspaltig (Kopf, Phasenleiste kompakt mit aktueller Phase + Empfohlen, Karten untereinander); erlaubt: Kunden informieren (Bottom-Sheet), Nachricht, Aufgabe, Termin-Chip, Zeit buchen. Keine Tabellenbearbeitung.

---

## 9. Automationen

### 9.1 Vorhanden (Scheduler, Europe/Vienna)

| Zeit | Job | Sichtbar als |
|---|---|---|
| Mo–Sa 07:00 | `montage_erinnerung` → Aufgabe „Montage morgen vorbereiten“ an Montageleiter | Heute-Leiste + Checkliste |
| Mo–Fr 08:00 | `feedback_erinnerung` → Aufgabe an Berater/Planer | Rückmeldungen „seit n Tagen“ |
| täglich 02:30 | `garantien_pruefen` → „Garantie abgelaufen“ (Anzeige „Herstellergarantie abgelaufen“) | Produktpass |
| täglich 02:30 | `summen_aktualisieren` | erst mit `summen` angezeigt („Stand 02:30“) |

Ereignisse (Controller): Phasenverlauf, `uebergabe_am`/`abgeschlossen_am`, Montagezeitraum, Rendering-Kennzahlen + „Feedback offen“, `freigabe_feedback`, Votes erledigt, Aufgaben-Benachrichtigung, `folgedokument`. Backoffice-Ereignisse: Regel E4 (Phase schieben), Kopie Abnahmeprotokoll an Kunden.

### 9.2 Vorgeschlagen (alle Standard aus, Schalter je Automation, Inhaber gibt einzeln frei)

| # | Auslöser | Wirkung | Art |
|---|---|---|---|
| AU1 | Montagetermin gesetzt/verschoben | Kundennachricht + ICS – **nur als Vorschlag im Chip** (§ 3.5), nie ohne Vorschau | Vertrag |
| AU2 | Tag vor Montage 16:00 | Erinnerung „Morgen ab 08:00 …“ | Vertrag |
| AU3 | Montage „Unterwegs“ | „Team ist unterwegs“ (Schalter je Projekt) | Vertrag |
| AU4 | Mangelfrist in `maengel_erinnerung_tage`, nicht erledigt | Aufgabe an Montageleiter / Verantwortlichen (`erinnert_am`) | intern |
| AU5 | > 14 Tage in „Angebot“ | Aufgabe „Nachfassen“ an Berater | intern |
| AU6 | Hersteller bestätigt Liefertermin | Hinweis in Mappe „Hersteller bestätigt KW 48 – übernehmen?“ | intern |
| AU7 | alle Eigenmontage-Positionen geliefert | Heute-Leiste „Montage planen“ | intern |
| AU8 | Schlussabnahme ohne Mängel | Empfohlen: Schlussrechnung, Produktpässe | intern |
| AU9 | 3 Monate nach Übergabe | Zufriedenheit + Referenz-Anfrage – **nur mit Einwilligung/TKG § 174, `nicht_kontaktieren = 0`, Abmeldelink** | Werbung |
| AU10 | Herstellergarantie endet in 60 Tagen | Pflegehinweis / Pflege-Abo – **wie AU9** | Werbung |
| AU11 | Kundeneintrag eingegangen | Glocke an Berater + Planer sofort | intern |
| AU12 | Kunde öffnet Rendering im Portal | Zeitleiste „Kunde hat Rendering B angesehen“ (Portal-Ereignis fehlt) | intern |

Jede Automation erscheint in der Aktivität mit Quelle „System“; Kundennachrichten laufen über PH Projekt Nachricht.

---

## 10. Druck / PDF

`getPdf(doctype, name, {format})`, Vorschau-Drawer (200 ms), Knöpfe Drucken · Herunterladen · In Mappe ablegen (wo Methode vorhanden) · An Kunden (= Dokument ablegen + Portal-Freigabe + Muster § 3.5; Anhang an Nachricht fehlt).

| Format | DocType | Inhalt | Sprache | Ablage |
|---|---|---|---|---|
| PH Projekt Statusbericht | PH Projekt | Phase, Termine, Positionen mit Lieferstatus, Montagen, offene Punkte, KI-Hinweis falls `ki_generiert_hinweis`; **ohne Preise**; auch als „Brief“ für Kunden ohne E-Mail | de (A20: Kundensprache) | `statusbericht_als_dokument` fehlt → Backoffice legt PDF per `uploadFile` + `insert PH Projekt Dokument` ab |
| PH Montagebericht | PH Montageauftrag | Termin, Team, Leistungen, Fotos (Kunde sieht), Bericht, Mängel, Leistungsnachweis-Unterschrift mit Text E3 | `sprache_bericht` | `bericht_als_dokument` |
| PH Abnahmeprotokoll | PH Abnahme | Art, Positionen, Fristen, Verantwortlich, Vorbehalte, Erklärungstext E3, Unterschriften, Zeitpunkt, Prüfwert (A5) | `sprache` | `protokoll_als_dokument` (automatisch nach Unterzeichnen) |
| PH Produktpass | PH Produktpass | A5, Materialien, Pflege, Garantie **und** Gewährleistungshinweis, QR | de | – |
| PH Referenz Einwilligung | PH Referenz | Nachweis | de | – |
| Auftragsmappe (Sammel-PDF) | PH Projekt | Inhaltsverzeichnis + gewählte Teile (`utils/mappe.py`) | de | sobald Endpunkt bestätigt; bis dahin Backoffice-Route fügt Einzel-PDFs zusammen |

---

## 11. Datenmapping UI → Frappe

### 11.1 ph_projekte

| UI-Funktion | Frappe | Hinweis |
|---|---|---|
| Mappe laden | API `auftragsmappe(projekt)` | nur ph_projekte-Listen nutzen (E8) |
| Phase wechseln | WF PH Projekt | verzögert (E2) |
| Phase schieben (E4) | WF aus Server Action nach Folgeobjekt-Ereignis | Zeitleiste „System“ |
| Projekt anlegen | API `projekt_aus_anfrage` / `insert` | – |
| Kopf/Details inline | `setValue` / `save` (mit `modified`) | `uebergabe_am` nie |
| Kunden informieren | M `portal_status_senden(text)` | Vorprüfung E-Mail |
| Räume/Positionen | `save` Kindtabellen | `menge` Int bis A4; `raum` Text |
| Lieferstatus, Nachlieferung | `save` Positionsfelder `lieferstatus`, `menge_*`, `nachlieferung_*`, `liefertermin` | Logik `utils/lieferung` serverseitig, bis Controller-Anbindung nur Anzeige + manuelles Erfassen |
| Aufmaß | `insert/save PH Aufmass` | Status per `setValue` |
| Planung | `uploadFile` + `insert PH Planung`; M `kunden_vorlegen`, `freigeben`, `verwerfen`, `neue_version`, `positionen_ins_projekt` | Portal-Entscheidung lesen |
| Rendering | `uploadFile` (privat) + `insert PH Rendering`; WF + M `kunden_vorlegen(nachricht)`, `feedback_uebersicht`, `antworten` | § 6.3 |
| Rückmeldung | `insert PH Rendering Feedback`; M `erledigt`, `antworten` | – |
| Nachricht | M `antworten`, `als_gelesen`; `insert PH Projekt Nachricht richtung=ausgehend` | – |
| Nachtrag | `insert/save PH Nachtrag` (+ Positionen) | Portal erst A10 |
| Montage planen | M `montageauftrag_anlegen` + `save` | Leistungsregel § 6.2 |
| Montage verschieben | `setValue start/ende`, `save team` | – |
| Montage-Status | WF PH Montageauftrag | Rolle PH Montage A18 |
| Foto, Mangel, Bericht, Zeit | M `foto_hinzufuegen`, `save maengel`, `bericht_als_dokument`, `zeit_buchen` | – |
| Abnahme mit Kunde | M `abnahme_anlegen`, `save`, `unterschrift_erfassen` (beide), WF, `protokoll_als_dokument`, `portal_freigeben` | § 6.5 |
| Mangel erledigt / Servicefall | M `mangel_erledigt`, `mangel_an_service`; Montage `setValue status=behoben` | – |
| Fremdgewerk | `insert/save PH Fremdgewerk` (+ `termine`, `maengel`); M `status_setzen`, `termin_anlegen` | – |
| Aufgaben | `insert PH Projekt Aufgabe`; M `erledigen`, `zeit_buchen` | – |
| Zeiten | `insert PH Projektzeit`; M `als_abgerechnet` | § 5.15 |
| Dokumente / Tagebuch | `insert PH Projekt Dokument`, M `portal_freigeben`, `neue_version`; API `tagebuch_list/add/delete/file` (`rolle=team`) | – |
| Produktpässe | M `produktpaesse_erzeugen`, `status_setzen`, `portal_link`; `insert PH Produktpass` | § 6.7 |
| Referenz | M `veroeffentlichen`, `ablehnen`, `zurueckziehen`, `widerruf_erfassen` | – |
| Kennzahlen | `count` mit Number-Card-Filtern; API `anzahl_offene_maengel`, `anzahl_renderings_ohne_antwort` | Formeln § 3.6 |
| Berichte | `getReport` (5) | – |
| Kapazität/Kollision | Report Kapazität; `PH Montageauftrag.kollisionen` | – |
| Einstellungen | `save PH Projekte Einstellungen` | – |
| Suche | `ph_core.api.suche`; Nummernmuster `PH-PRJ-`, `PH-MON-`, `PH-ABN-`, `PH-PP-`, `PH-REN-`, `PH-PLN-`, `PH-GEW-`, `PH-NT-`, `PH-AFM-` | Nummernkreise in `ph_core/utils/naming.py` (A24) |

### 11.2 Fremdbelege (explizite Bezugsfilter, E8)

| Abschnitt | DocType | Filter | Felder |
|---|---|---|---|
| Termine | PH Termin (ph_crm) | `ph_projekte_projekt = projekt` | start, terminart, status |
| Angebote, ABs, Rechnungen, Gutschriften | PH Angebot, PH Auftragsbestaetigung, PH Rechnung, PH Gutschrift (ph_faktura) | `projekt = projekt` (Gutschrift: `rechnung in` Projektrechnungen, falls kein `projekt`) | name, datum, status, art, waehrung, `*_cent` nur Leitung, `vertragsort`, `fagg_frist_ende`, `zahlungsplan` |
| Zahlungen | PH Rechnung Kindtabelle `zahlungen` | über Projektrechnungen | `zeitpunkt`, Betrag (Leitung) |
| Herstellerbestellungen | PH Herstellerbestellung (ph_sortiment) | `bezug_doctype = "PH Projekt" and bezug_name = projekt` | lieferant, status, `bestaetigter_termin` |
| Lieferscheine, Sendungen | ph_logistik | Lieferschein `projekt = projekt`; Sendung über Lieferscheine | – (kein `tracking_nummer`) |
| Servicefälle | PH Servicefall (ph_service) | `projekt = projekt` | – |

Jede Zeile mit `kontakt` ≠ Projektkontakt (wo das Feld existiert) wird verworfen; fehlt ein Filterfeld laut `getMeta` → Abschnitt „nicht verknüpft“. Unit-Test „Projekt A enthält keinen Datensatz mit fremdem Kontakt“ (QA 41).

---

## 12. Recht und Buchhaltung – Umsetzung im UI

### 12.1 Datenschutz und Arbeitsrecht

- E8 (keine fremden Datensätze), Beträge permlevel 1 serverseitig entfernt (nie per CSS).
- Fotos in Privatwohnungen: Hinweis im Kiosk beim ersten Foto je Auftrag „Kunde über Fotos informiert?“ (Checkbox, einmal je Auftrag, Kommentar); Löschfrist für Fotos/Sprachnotizen/Unterschriftsbilder als Einstellung (A12, Wert DS).
- PH Website Integration liest PH Montageauftrag inkl. Unterschrift/Telefon (A18b) – Livegang-Blocker Kundenportal-Montagetermine.
- Monteur-Zeitstempel und Zeiten: keine Ranglisten, keine Auswertung je Person außer Leitung; Info an Mitarbeiter und Zustimmung/Betriebsvereinbarung vor Livegang (Inhaber/DS, F7).

### 12.2 Steuern und Belege (Schnittstelle Faktura)

- Leistungsdatum: „Schlussrechnung stellen“ übergibt `leistungsdatum = Schlussabnahme.unterzeichnet_am` und `leistungszeitraum_von/bis` aus Montageaufträgen (A11c `leistungsdaten()`; bis dahin berechnet das Backoffice die Werte aus den Mappe-Listen und übergibt sie an den Faktura-Assistenten) (UStG § 11 Abs. 1 Z 3 lit. d).
- Anzahlungen: Anzeige Soll (AB-Zahlungsplan) und Ist (bezahlte Anzahlungsrechnungen) getrennt; Schlussrechnung setzt Anzahlungen ab (Faktura-Konzept).
- Währung: jede Summe nur je Währung; mehrere Währungen → Chip „Belege in EUR und CHF – keine Summe“.
- Auftraggeber-Art (A14: Verbraucher/Unternehmer/Generalunternehmer/Öffentliche Hand) + Rechnungsempfänger im Details-Panel; „Montage fest verbunden – § 19 Abs. 1a UStG prüfen“ als Hinweis bei Hotel/Objekt mit Generalunternehmer (StB). Bis A14: Feld ausgeblendet, Hinweis im Faktura-Assistenten.
- Löschen von Belegen der Mappe: nie (BAO § 132); Aufbewahren-bis (A12) lesend im Details-Panel.

### 12.3 FAGG

- AB mit `vertragsort` außerhalb Geschäftsräume/Fernabsatz und `fagg_frist_ende ≥ heute`: Chip „Rücktrittsfrist bis 18.11.“ im Kopf; „Bestellen“ und „Montage planen“ zeigen Hinweis + Pflicht-Checkbox „Kunde hat ausdrücklich verlangt (Nachweis liegt vor)“ oder „Maßanfertigung“; Nachweis → `PH Auftragsbestaetigung.fagg_vorzeitig_verlangt` (ph_faktura, Anfrage F-1); bis dahin Kommentar am Projekt mit Text und Zeitpunkt.
- Portal-Freigaben von Nachträgen: erst mit A10 (Belehrung, `fagg_hinweis_bestaetigt`). Planungsfreigabe im Portal: Freigabe einer Gestaltung, keine Vertragsänderung – bei Preisänderung immer Nachtrag.
- Aufmaß/Beratung beim Kunden → Hinweis im Angebot „Vertragsort ‚Beim Kunden‘ prüfen“.

### 12.4 Gewährleistung, Abnahme, Signatur

- E3, E7, E11; Abnahmeprotokoll-Kopie an Kunden Pflicht; KSchG § 9b-Text im Produktpass; einfache elektronische Signatur am iPad – Zusatzsicherung Prüfwert + Kopie (RA, F8).
- Bestätigung ohne Zeichnung (Kunde kann nicht zeichnen): nur mit Inhaber-/RA-Freigabe (F8); bis dahin Ablauf „Kunde verweigert/abwesend“.

### 12.5 Montage außerhalb Österreichs (CH, DE, Yacht)

Chip „Montage in CH“ und Prüfliste im Sheet „Montage planen“ (Haken, Zeitleiste): Entsendung gemeldet (CH-Meldeverfahren vor Arbeitsbeginn) · A1-Bescheinigung je Teammitglied · Ausfuhr/Einfuhr mit Logistik geklärt · Steuerfall mit Steuerberatung geklärt. Felder `entsendung_gemeldet_am`, `a1_vorhanden` (A14b); bis dahin Checkliste als Kommentar. Yacht: `objekt_land` = Liegeplatz-Land, Hafen in `objekt_hinweis`. Keine Steuerlogik im Backoffice.

---

## 13. Was hier anders ist als in klassischer Branchensoftware

Grundlage `VORBILD-SHD` (Marketingtexte): „nicht beschrieben“ heißt nur „in den gelesenen Seiten nicht erwähnt“.

| # | Hier | Basis |
|---|---|---|
| 1 | Renderings mit Pins, Votes, Sprachnotizen und Freigabe am Bild, beantwortet aus einer Inbox per Tastatur | PH Rendering Feedback |
| 2 | Nachträge mit Kundenentscheidung und Unterschrift, direkt an die AB übergeben | PH Nachtrag |
| 3 | Ein Zeitplan aus Lieferterminen, Montage, Fremdgewerk-Terminen mit Abhängigkeiten und Kapazität | PH Fremdgewerk Termin, Report Kapazität |
| 4 | Eine Kundenunterschrift für Leistungsnachweis und Abnahme, offline, mit automatischer Protokollkopie | PH Abnahme, PH Montageauftrag |
| 5 | Lieferstatus je Position mit Nachlieferung und Teilmontage | `lieferstatus`, `menge_*` |
| 6 | Gemeinsames Bautagebuch Kunde + Team und daraus Referenzen mit Einwilligungsnachweis | PH Tagebuch Foto, PH Referenz |
| 7 | Produktpass mit QR, Garantie und Gewährleistung getrennt | PH Produktpass |
| 8 | Phasenleiste mit genau einer Empfehlung und Begründung über alle Bereiche | Regeln § 4.3 |
| 9 | Rückgängig statt Rückfrage, auch für Workflow-Schritte (verzögerter Commit) | E2 |
| 10 | Präsentationsmodus im Showroom mit PIN-Ausgang | `KundenAnsicht` |

---

## 14. Anfragen an andere Stellen (keine Annahmen im Bau)

| Nr. | An | Anfrage | Prio | Blockiert |
|---|---|---|---|---|
| A1 | ph_projekte | `PH Rendering.kunden_vorlegen` setzt `workflow_state`; A1b gleiche Prüfung für PH-Referenz-Methoden | hoch | – (Reihenfolge-Umgehung § 6.3) |
| A2 | ph_projekte | `summen()`: AB-Filter `status != Storniert`, Rechnungen gebucht und nicht storniert, Gutschriften abziehen, Felder `anzahlung_soll_cent`, `anzahlung_ist_cent`, `abgerechnet_cent`, `gutschrift_cent`, `summen_stand_am`, `waehrung` + `summen_warnung`, `nachtraege_cent` | hoch | Schalter `summen` |
| A3 | ph_projekte | Preise netto + `ust_satz_promille` in Projekt-/Planungs-/Nachtragsposition; `kalkulation.py` netto, Anzahlungsrechnung-Filter, Gutschriften; `nachtrag.projekt_aenderungen` Menge/Preis | hoch | Schalter `kalkulation` |
| A4 | ph_projekte | Mengen `Float` (3) + `einheit` in allen Positionsarten und Utils | hoch | `mengen_dezimal` |
| A4b | ph_projekte | `abschluss_beim_kunden(montageauftrag, positionen, unterschrift_kunde, name_kunde, unterschrift_studio, erfasst_am)` transaktional; Workflow-Bedingung „Abnehmen“ auf unterzeichnete Abnahme | hoch | – (Kette § 6.5) |
| A5 | ph_projekte | Sperre nach Unterschrift (PH Abnahme, PH Montageauftrag, PH Nachtrag), `validate`-Sperre, Felder `protokoll_dokument`, `protokoll_sha256`, `kopie_an_kunde_am`, `kopie_kanal`, Protokoll automatisch, `on_trash` nur Entwurf/Geplant, Zurück nur mit Grund | hoch | **Livegang Abnahmen** |
| A6 | ph_projekte | `uebergabe_am` read-only aus Schlussabnahme bzw. Lieferschein; `uebergabe_korrigieren(datum, grund)` | hoch | Livegang Service-Fristen |
| A7 | ph_projekte | `PH Abnahme.art`, `PH Abnahme Position.projekt_position`, `abnahme_anlegen` je Montageauftrag, `montageauftrag_anlegen` mit Lieferstatus-/`montage_art`-Regel | hoch | `teilabnahme` |
| A8 | ph_projekte | `PH Projektzeit.rechnung`, Sperre aller Felder nach Abgerechnet, `als_abgerechnet` nur mit Rechnung, `user ≠ session` nur Leitung/Montageleiter, `zeit_buchen(…, datum)` | hoch | – |
| A9 | ph_projekte | `abnahme_anlegen` Vergleich `behoben` (klein) | mittel | – |
| A10 | ph_projekte / ph_faktura | Nachtrag: `auftragsbestaetigung`-Link, `uebernommen` erst nach AB-Änderung, `fagg_hinweis_bestaetigt` + Belehrungsversion | hoch | `nachtrag_portal` |
| A10b–d | ph_projekte | Produktpass `gewaehrleistung_bis`, `garantie_geber`, `garantie_monate` vorbelegen; Status Retourniert/Storniert; Erzeugen nur geliefert/montiert, `lieferdatum` aus Lieferschein; Position `lieferstatus = retourniert` + Retoure-Felder | mittel | – |
| A11 | ph_projekte | Planung `kunden_vorlegen` schreibt Kundennachricht; A11b `renderings_vorlegen(namen[], nachricht)`; A11c `leistungsdaten()` | mittel | – |
| A12 | ph_projekte | `aufbewahren_bis`, `on_trash`-Verbote, `medien_loeschen_nach_monaten`; `portal_project_vorschau(projekt)` | mittel | `kundenvorschau` |
| A13 | ph_projekte | `naechste_schritte[]`, Auslöser je Phase in PH Projekt Phase | mittel | – |
| A14 | ph_projekte | `auftraggeber_art`, `rechnungsempfaenger`, `bauleistung_hinweis`; A14b `entsendung_gemeldet_am`, `a1_vorhanden` | mittel | – |
| A15 | ph_projekte | `PH Rendering Feedback.wieder_oeffnen()`, Nachricht „als ungelesen“ | niedrig | – |
| A16 | ph_projekte | `api.zeitleiste(projekt, seit, limit)` | mittel | – |
| A17 | ph_projekte | Meilensteine/geplante Phasendaten; A17b Report Durchlaufzeit | niedrig | – |
| A18 | ph_projekte | Rolle PH Montage in Workflow-Transitionen PH Montageauftrag/PH Abnahme, `create` PH Projektzeit (eigene/Team), PH Tagebuch Foto (`von = team`), User Permission auf eigene Aufträge; A18b PH Website Integration ohne Unterschrift/Telefon/Fotos | hoch | `montage_kiosk_status` |
| A19 | ph_projekte | `unterschrift_erfassen(…, erfasst_am, geraet_id)`; A19b `on_update` Montagezeitraum aus Min/Max inkl. `ende` | mittel | – |
| A20 | ph_projekte | `portal_status_senden`/`kunden_vorlegen`: Sprache aus PH Kontakt, Rückgabe `{nachricht, kanal, grund}`; A20b Satzbausteine Montagebericht als API | mittel | – |
| A21 | ph_projekte | stabile Raum-ID | niedrig | – |
| A22 | ph_projekte | `PH Rendering Feedback.erfasst_von_user` | niedrig | – |
| A23 | ph_projekte | `PH Abnahme.status` „Verweigert“ + Grund; `PH Montageauftrag.unterschrift_status`; A23b `unterschrift_funktion`, `vollmacht_vermerk` | mittel | – |
| A24 | ph_core | Nummernkreise `naming.py`; Benachrichtigungsquelle (A23-Glocke); `verifyPin` für Präsentation | hoch | ⌘K-Nummern |
| A25 | ph_projekte | `doc_event` PH Auftragsbestaetigung → Hinweis „AB vorhanden“ (kein Phasensprung); `on_update`-Hooks Montage/Abnahme/Lieferschein für E4 serverseitig | mittel | – (Backoffice-Regel bis dahin) |
| F-1 | ph_faktura | `fagg_vorzeitig_verlangt` an AB; Faktura stellt Zeiten ab, setzt Rechnung-Link | mittel | – |
| S-1 | ph_sortiment | Feld `projekt` an PH Herstellerbestellung (optional, Filter funktioniert auch über `bezug_*`) | niedrig | – |
| P-1 | ph_personal | Abwesenheiten „abwesend“ ohne Art für Montagekalender | niedrig | – |

---

## 15. Offene Fragen (Inhaber, Steuerberatung, Datenschutz, Rechtsberatung)

| Nr. | An | Frage | Bis zur Antwort |
|---|---|---|---|
| F1 | Inhaber | Dürfen Monteure Bargeld oder Karte annehmen? | kein Inkasso (E14) |
| F2 | Inhaber | Wer darf abgeschlossene Projekte wieder öffnen, mit welchem Grund? | niemand |
| F3 | Inhaber | Stornoregel bei Abbruch nach Auftrag (AGB-Klausel)? | PA9 zeigt nur Auswahl, keine Gebühr vorgeschlagen |
| F4 | StB | § 19 Abs. 1a UStG bei Einbau für Generalunternehmer? Leistungsort/Registrierung CH/DE? | Hinweis, keine Logik |
| F5 | StB | Teilrechnung je Teilabnahme oder Schlussrechnung gesamt? | Schlussrechnung gesamt |
| F6 | DS | Lösch-/Aufbewahrungsfristen Fotos, Unterschriften, Sprachnotizen, Bautagebuch | kein automatisches Löschen |
| F7 | DS/Arbeitsrecht | Betriebsrat? Zustimmung nach AVRAG § 10 für Statuszeitstempel | keine Auswertung je Person außer Leitung |
| F8 | RA | Unterschrift am iPad als Abnahmenachweis; Erklärungstext E3; Bestätigung ohne Zeichnung | Text E3, Prüfwert + Kopie, keine Bestätigung ohne Zeichnung |
| F9 | Inhaber | Preise im Portal für Nachträge zeigen? | Nachtrag nur vor Ort |
| F10 | Inhaber | Automationen AU1–AU12 einzeln freigeben; Einwilligungstext Referenzen | alle aus |

---

## 16. Bauauftrag

### 16.1 Dateien und Routen (`backoffice/`)

```
src/app/projekte/
  layout.js                                  Unternavigation (Pills nach Rechten)
  page.js  loading.js                        Übersicht
  liste/page.js                              Liste | Kanban | Zeitplan
  neu/page.js                                PA1
  zeitplan/page.js                           redirect 307
  [projekt]/page.js  [projekt]/loading.js    Auftragsmappe
  [projekt]/planung/[name]/page.js
  [projekt]/renderings/[name]/page.js
  [projekt]/aufmass/[name]/page.js
  [projekt]/nachtraege/[name]/page.js
  [projekt]/tagebuch/page.js  [projekt]/dokumente/page.js  [projekt]/nachrichten/page.js   redirects 307
  rueckmeldungen/page.js
  montagen/page.js  montagen/[name]/page.js
  abnahmen/[name]/page.js
  maengel/page.js  nachtraege/page.js  aufgaben/page.js  zeiten/page.js
  fremdgewerke/page.js  dokumente/page.js
  produktpaesse/page.js  produktpaesse/[name]/page.js
  referenzen/page.js  referenzen/[name]/page.js
  berichte/[report]/page.js
  einstellungen/page.js
src/app/(kiosk)/montage/page.js  + montage/[auftrag]/page.js  montage/[auftrag]/abnahme/page.js   (ersetzt Platzhalter)
src/app/api/projekte/zip/route.js            Dokumente als ZIP
src/app/api/projekte/mappe-pdf/route.js      Sammel-PDF (bis Endpunkt auftragsmappe_pdf)
src/components/Backoffice/Projekte/          (16.2)
src/lib/backoffice/projekte/
  actions.js        "use server" – alle Mutationen (16.3)
  daten.js          server-only Lesen: Mappe, Fremdbelege mit Bezugsfiltern + Kontaktprüfung, Listen, Kennzahlen
  bezug.js          Bezugsfilter je Fremd-DocType, verwirftFremdeKontakte (rein, unit-getestet)
  empfohlen.js      Regeltabelle § 4.3 (rein)
  phase.js          Folgeobjekt-schiebt-Phase-Regeln E4 (rein)
  zaehler.js        Formeln § 3.6 (rein)
  texte.js          Glossar, Statusanzeige, Kundentext-Vorlagen (de; Sprache vorbereitet), Erklärungstexte E3
  status.js         Statustöne § 3.3
  zeit.js           Dauer-Parser, h:mm (rein)
  mengen.js         Menge/Einheit-Format, Ganzzahl-Sperre bis A4 (rein)
  montage.js        Leistungsregel § 6.2, Kapazität, Montagezeitraum Min/Max (rein)
  maengel.js        Zusammenführung der drei Mangelquellen, ist_erledigt (rein)
  schalter.js       § 3.10
  kiosk-puffer.js   IndexedDB-Warteschlange Montage (Client)
src/lib/backoffice/kuerzel.js                Registry (falls Fundament F3 nicht liefert; sonst dort eintragen)
src/lib/backoffice/mock/                     Seed Projekte (über bestehende Erweiterungsstelle)
tests/unit/backoffice-projekte-*.test.mjs   tests/e2e/projekte*.spec.js
```
Einträge: `bereiche.js` Slug `projekte` – `navigation` (Pills § 3.1), `doctypes` um PH Aufmass, PH Nachtrag, PH Fremdgewerk, PH Projekt Aufgabe, PH Projektzeit, PH Projekt Dokument, PH Tagebuch Foto, PH Projekt Nachricht, PH Rendering Feedback; `kanban` um PH Fremdgewerk, PH Projekt Aufgabe; `ROUTEN` § 3.1. `suche.js`: Nummernmuster § 11.1, Palette „> Rückmeldungen“, „> Montagen“, „> Zeitplan“, „> Zeit buchen“, „> Neues Projekt“.

### 16.2 Komponenten (`components/Backoffice/Projekte/`)

| Komponente | Art | Zweck |
|---|---|---|
| `ProjektePills` | Server | Unternavigation mit Rückmeldungs-Badge |
| `MappeKopf`, `EigenschaftChip`, `HinweisChip` | Client | § 4.1 |
| `Vorgangsleiste`, `PhasenPopover`, `ZuruecksetzenDialog` | Client | § 4.2 (Basis `WorkflowLeiste`) |
| `EmpfohlenZeile`, `EmpfohlenKarte` | Server + Client | § 4.3 |
| `MappeTabs` + `TabUebersicht`, `TabPositionen`, `TabPlanung`, `TabBelege`, `TabMontage`, `TabDateien` | Server/Client | § 4.4 |
| `AktivitaetPanel`, `Composer` (Modus Intern/An Kunde), `DetailsPanel` | Client | § 4.5 |
| `AktionsMenue` (mit Filter) | Client | § 4.6 |
| `AblageOverlay`, `DateiAblage` (mit „Datei wählen“) | Client | Uploads § 3.8 |
| `KundenInformierenSheet`, `KundeNichtInformiertChip`, `ZustellErgebnis` | Client | § 3.5 |
| `ProjektListe`, `ProjektKanban`, `Zeitplan` (Treegrid), `MiniGantt`, `TerminPopover` | Client | § 5.2 |
| `ProjektNeu` | Client | § 5.3 |
| `AufmassAkte`, `MassTabelle` | Client | § 5.4 |
| `PlanungAkte`, `VersionsVergleich`, `Bildvergleich` (slider) | Client | § 5.5 |
| `RenderingAnsicht`, `BildPins`, `PinWerkzeug`, `RueckmeldungsFaden`, `Sprachnotiz`, `VariantenLeiste`, `FreigabeBanner` | Client | § 5.6 |
| `RenderingsVorlegenSheet` | Client | § 6.3 |
| `Rueckmeldungen` (Inbox + Vorschau) | Client | § 5.7 |
| `MontageKalender`, `KalenderBlock`, `UmplanenPopover`, `KapazitaetsBand`, `NichtEingeplant` | Client | § 5.8 (Basis Fundament-Kalender) |
| `MontagePlanenSheet`, `KalenderStreifen`, `AuslandPruefliste` | Client | § 6.2 |
| `MontageAkte` | Client | § 5.9 |
| `AbnahmeAkte`, `AbnahmeMitKunde` (Schritte, Kiosk + iPad), `Signatur`, `LeistungsnachweisAblauf` | Client | § 5.10, § 6.5 |
| `MaengelListe` | Client | § 5.11 |
| `NachtragAkte`, `NachtragSheet`, `NachtragEntscheidung` | Client | § 5.12 |
| `FremdgewerkListe`, `FremdgewerkDrawer` | Client | § 5.13 |
| `AufgabenBoard`, `Schnellanlage` (Token-Chips) | Client | § 5.14 |
| `ZeitBuchenPopover`, `ZeitenListe`, `AbrechnenDialog` | Client | § 5.15 |
| `DokumentKacheln`, `TagebuchGalerie`, `Lightbox` | Client | § 5.16, Tab Dateien |
| `ProduktpassListe`, `ProduktpassAkte`, `ProduktpaesseSheet` | Client | § 5.17, § 6.7 |
| `ReferenzPruefseite` | Client | § 5.18 |
| `AbschliessenPruefliste`, `AbbrechenAssistent`, `RuecknahmeDialog`, `ErgebnisDrawer` | Client | § 6.8–6.10 |
| `KundenAnsicht` (Präsentation, später Vorschau), `PinAusgang` | Client | § 8.2 |
| `MontageKiosk`: `HeuteListe`, `StoppSeite`, `Zustandsknopf` (+ Undo-Leiste), `KameraAnsicht`, `MangelErfassen`, `ZeitenBuchenSheet`, `OfflineBand`, `KonfliktKarte` | Client | § 8.1 |

Wiederverwendet: `Shell`, `Seitenkopf`, `DataTable`, `Filterleiste`, `Kanban`, `Formular`, `Kindtabelle`, `LinkFeld`, `Datumsfeld`, `WorkflowLeiste`, `Zeitleiste`, `Kennzahl`, `Charts`, `StatusBadge`, `Leer`, `Fehler`, `Bestaetigen`, `Toast`, `Segment`, `Knopf`, `KioskShell`.

### 16.3 Server Actions (`lib/backoffice/projekte/actions.js`)

Alle: `requireSession()`, Recht (`darfDoc`) und Rolle prüfen, zod-Eingaben, Rückgabe `{ ok, code, message, fehler? }`, `modified` bei `save`, Idempotenz-Schlüssel bei Ketten, keine Personendaten im Log, Beträge nur mit permlevel 1 in der Antwort.

| Action | Prüfung | Frappe |
|---|---|---|
| `projektAnlegenAction({ kontakt, anfrage?, projektart, titel?, … , idempotency })` | create | `call projekt_aus_anfrage` oder `insert PH Projekt`, danach `save` |
| `projektFeldAction({ name, feld, wert, modified })` | write; Feld-Whitelist (nie `uebergabe_am`, `status`) | `setValue` |
| `phaseAction({ name, aktion })` (nach Commit) | Transition in `getTransitions` | `workflowAction PH Projekt` |
| `phaseSchiebenAction({ name, ausloeser })` | Regel `phase.js` erfüllt, Recht | `workflowAction` + `kommentar` „System: …“ |
| `phaseZuruecksetzenAction({ name, ziel })` | Leitung; schrittweise mit Stopp | `workflowAction Zurück` n-mal |
| `kundenInformierenAction({ projekt, text })` (nach 10-s-Commit) | write; E-Mail-Vorprüfung | `runDocMethod portal_status_senden` bzw. Ergebnis `keiner` |
| `nichtNoetigAction({ projekt, anlass })` | write | `kommentar` |
| `nachrichtAction({ projekt, text, modus })` | write | Kunde: `insert PH Projekt Nachricht`; intern: `kommentar` |
| `nachrichtGelesenAction({ name, gelesen })` | write | `runDocMethod als_gelesen` / `setValue status` |
| `positionenSpeichernAction({ projekt, positionen, raeume, modified })` | write; Mengenregel `mengen.js` | `save PH Projekt` |
| `raumUmbenennenAction({ projekt, alt, neu })` | write | `save` (alle Positionen) |
| `aufmassAction({ … })` | create/write | `insert/save PH Aufmass` |
| `planungAction({ name, methode, args })` | Whitelist `kunden_vorlegen|freigeben|verwerfen|neue_version|positionen_ins_projekt` | `runDocMethod` (+ `portal_status_senden` bei Vorlage) |
| `dateiAblegenAction({ projekt, ziel, datei, meta })` | create; Typ/Größe | `uploadFile` + `insert` (Planung/Rendering/Dokument) bzw. `call tagebuch_add` |
| `renderingsVorlegenAction({ namen[], text, kiBestaetigt })` (nach Commit) | write | je Name `workflowAction Kunden vorlegen`, `setValue`; eine Nachricht |
| `rueckmeldungAction({ name, aktion, text?, antwortAuf? })` | write | `runDocMethod antworten|erledigt` bzw. `insert PH Rendering Feedback` (Pin) |
| `renderingStatusAction({ name, aktion })` | Transition erlaubt | `workflowAction` |
| `nachtragAction({ … })`, `nachtragVorlegenAction`, `nachtragEntscheidenAction({ name, entscheidung, unterschrift, name_kunde })` | write; Unterschrift Pflicht vor Ort; Portal nur mit Schalter | `insert/save PH Nachtrag`, `portal_status_senden` |
| `nachtragAnFakturaAction({ name })` | Leitung/Faktura | Faktura-Assistent (Aufruf laut 10-konzept-faktura), danach `setValue uebernommen` |
| `montagePlanenAction({ projekt, start, ende, team, leistungen, unterlagen, fahrzeug, faggNachweis?, idempotency })` | write; Leistungsregel | `runDocMethod montageauftrag_anlegen` + `save PH Montageauftrag` |
| `montageUmplanenAction({ name, start, ende, team?, modified })` | write | `setValue`/`save` |
| `montageStatusAction({ name, aktion, zeitpunktClient })` (nach Commit) | Transition erlaubt | `workflowAction PH Montageauftrag` + ggf. `phaseSchiebenAction` |
| `montageFotoAction`, `montageMangelAction`, `montageLeistungAction`, `montageBerichtAction` | write | `runDocMethod foto_hinzufuegen`, `save`, `bericht_als_dokument` |
| `zeitBuchenAction({ projekt, user, dauer, datum, taetigkeit, montageauftrag?, aufgabe? })` | eigene oder Leitung/Montageleiter des Auftrags; Team-Prüfung | `runDocMethod zeit_buchen` bzw. `insert PH Projektzeit` |
| `zeitenAbrechnenAction({ namen[], rechnung })` | Leitung; Status Offen + abrechenbar; Rechnung gehört zum Projekt | `runDocMethod als_abgerechnet(beleg_ref)` je Name |
| `abnahmeMitKundeAction({ montageauftrag, positionen, unterschriftKunde, nameKunde, unterschriftStudio, kopieKanal, erfasstAm, idempotency })` | write; „noch keine Unterschrift“ je Doc | Kette § 6.5 (später `abschluss_beim_kunden`) |
| `leistungsnachweisAction({ montageauftrag, unterschrift?, abwesendGrund? })` | write | `runDocMethod unterschrift_erfassen` / `kommentar` |
| `abnahmeMangelAction({ abnahme, zeile, aktion })` | write | `runDocMethod mangel_erledigt|mangel_an_service` |
| `abnahmeAbschliessenAction({ name, kopieKanal? })` | `maengel_offen = 0`, Kopie dokumentiert | `workflowAction Abschließen` |
| `mangelAction({ quelle, doc, zeile, aktion, wert? })` | write | je Quelle `setValue`/`save`/Methode |
| `fremdgewerkAction({ … })`, `fremdgewerkStatusAction({ name, status })` | write; Übergang erlaubt | `insert/save`, `runDocMethod status_setzen|termin_anlegen` |
| `aufgabeAction({ … })` | create/write | `insert PH Projekt Aufgabe`, `runDocMethod erledigen` |
| `dokumentAction({ name, aktion, datei? })` | write; Löschverbot § 5.16 | `runDocMethod portal_freigeben|neue_version` |
| `tagebuchLoeschenAction({ foto })` (nach Commit) | write; Kundenfoto nur Leitung | `call tagebuch_delete` |
| `produktpaesseAction({ projekt, positionen, lieferdaten })` | write; nur geliefert/montiert | `runDocMethod produktpaesse_erzeugen` oder `insert PH Produktpass` |
| `referenzAction({ name, methode, notiz?, kanal? })` | Whitelist; Leitung für Veröffentlichen | `runDocMethod` |
| `abschliessenAction({ projekt, begruendung? })` | Leitung; Prüfliste serverseitig neu berechnet | `workflowAction Abschließen` + `kommentar` |
| `abbrechenAction({ projekt, grund, folgen[] , idempotency })` | Leitung | `setValue abgebrochen_grund`, `workflowAction Abbrechen`, je Folge Workflow/`status_setzen`/`insert PH Projekt Aufgabe` |
| `positionZuruecknehmenAction({ projekt, zeile, grund })` | Leitung | `save` Position + `kommentar` + Aufgabe Logistik |
| `einstellungenAction({ doc, modified })` | Leitung | `save PH Projekte Einstellungen` |
| `commitAction({ token })` | Token aus Undo-Registry (Fundament F2) | führt hinterlegte Action genau einmal aus |

### 16.4 Frappe-Aufrufe (Lesen, `daten.js`)

`call ph_projekte.api.auftragsmappe` (nur eigene Listen), `anzahl_offene_maengel`, `anzahl_renderings_ohne_antwort`, `tagebuch_list/file`; `getList`/`count` für alle ph_projekte-DocTypes und Fremdbelege mit Filtern § 11.2; `getMeta` zur Filterfeld-Prüfung; `getDocMitInfo` für Akten; `getTransitions`; `getKanban` (PH Projekt, PH Montageauftrag, PH Fremdgewerk, PH Projekt Aufgabe); `getReport` (5); `getPdf`; `getFile` (Bild, Audio, Unterlagen); `searchLink`; `getValue` (Unterschrift vorhanden?, Projekt eines Unterobjekts). Cache-Tags `akte:projekt:<name>`, `liste:projekte`, `kalender:montagen:<kw>`; `revalidateTag` nach jeder Mutation.

### 16.5 Reihenfolge

| Schritt | Inhalt | Ergebnis |
|---|---|---|
| 1 | Reine Module (`bezug`, `empfohlen`, `phase`, `zaehler`, `texte`, `status`, `zeit`, `mengen`, `montage`, `maengel`, `schalter`) + Unit-Tests; Mock-Seed (12 Projekte je Phase inkl. Abgebrochen, CH-Projekt, Kunde ohne E-Mail, 2 Währungen; 8 Planungen inkl. Änderung gewünscht; 10 Renderings mit Pins/Votes/Sprachnotiz/Freigabe; 3 Nachträge; 6 Montageaufträge inkl. mehrtägig und Teilmontage; 3 Abnahmen; 5 Fremdgewerke mit Terminen/Abhängigkeit; Positionen mit allen Lieferstatus; fremde Datensätze ohne Projektbezug für den Leck-Test) | Regeln grün |
| 2 | Layout/Pills, Routen, Umleitungen, `bereiche.js`, Kürzel-Registry-Einträge | Navigation |
| 3 | Auftragsmappe: Kopf, Vorgangsleiste, Empfohlen, 6 Tabs (lesend), Fremdbelege mit Bezugsfiltern, Aktivität/Details, Aktionsmenü | Mappe lesend, kein Leck |
| 4 | Mappe schreibend: Inline-Felder, verzögerter Commit für Phase, Kunden-informieren-Muster, Composer, Positionen/Räume, Ablage-Overlay | Mappe benutzbar |
| 5 | Übersicht + Projektliste/Kanban + PA1 | Bereichsstart |
| 6 | Planung, Aufmaß, Rendering (Pins, Faden, Vorlegen-Sheet), Rückmeldungen-Inbox | Planungsabstimmung |
| 7 | Montagekalender, Montage planen, Montage-Akte | Montageplanung |
| 8 | Abnahme mit Kunde (iPad), Leistungsnachweis, Abnahme-Akte, Mängel-Liste | Abnahme (Livegang erst mit A5) |
| 9 | Montage-Kiosk inkl. Kamera, Offline-Puffer, Konfliktkarten | Montage mobil |
| 10 | Nachträge, Fremdgewerke, Zeitplan-Ansicht + Mini-Gantt | Objekt-/Küchenabwicklung |
| 11 | Aufgaben, Zeiten, Dokumente, Produktpässe, Referenzen | Rest |
| 12 | PA8, PA9, Rücknahme, Druck/Sammel-PDF, ZIP, Berichte, Einstellungen | Abschluss-Ketten |
| 13 | Präsentationsmodus (`KundenAnsicht`, PIN-Ausgang) | Showroom |
| 14 (Phase B) | Schalter je Backend-Lieferung: `summen`, `kalkulation` (Abschnitt Kalkulation: Soll/Ist netto, DB, Marge – Leitung), `mengen_dezimal`, `teilabnahme`, `montage_kiosk_status`, `nachtrag_portal`, `kundenvorschau` | volle Tiefe |

### 16.6 Aufwand (Agent-Stunden, Schätzung)

| Schritt | h |
|---|---|
| 1 Reine Module + Seed + Unit-Tests | 7 |
| 2 Navigation/Routen | 2 |
| 3 Mappe lesend inkl. Fremdbelege | 9 |
| 4 Mappe schreibend inkl. Commit, Informieren, Composer | 8 |
| 5 Übersicht, Liste, Kanban, PA1 | 6 |
| 6 Planung, Aufmaß, Rendering, Inbox | 12 |
| 7 Kalender, Montage planen, Montage-Akte | 10 |
| 8 Abnahme mit Kunde, Abnahme-Akte, Mängel | 8 |
| 9 Montage-Kiosk + Offline | 10 |
| 10 Nachträge, Fremdgewerke, Zeitplan | 9 |
| 11 Aufgaben, Zeiten, Dokumente, Produktpässe, Referenzen | 8 |
| 12 PA8, PA9, Rücknahme, Druck, Berichte, Einstellungen | 6 |
| 13 Präsentationsmodus | 3 |
| E2E, axe hell/dunkel, Klickzählung, Screenshots Leerzustände | 8 |
| **Phase A gesamt** | **106** |
| 14 Phase B (je Schalter 1–4 h, Kalkulation 5 h) | 16 (nach Backend) |

### 16.7 Abhängigkeiten

| Von | Was | Blockiert | Ersatz bis dahin |
|---|---|---|---|
| Fundament F1 | `KioskShell`, Arbeitsplatz Montage | Schritt 9 | – (vorhanden als Platzhalter) |
| Fundament F2 | verzögerter Commit + `commitAction`-Route | E2 überall | bereichseigene Registry, später übergeben |
| Fundament F3 | Kürzel-Registry + Abschalter | Tastatur-QA | lokale Registrierung |
| Fundament F5/F6 | Glocke mit Inline-Aktionen; Kalender-, Sheet-, Gantt-Bausteine | Schritt 6/7/10 | Bausteine im Bereich, Fundament übernimmt |
| ph_projekte A1–A25 | siehe § 14 | Schalter; A5 Livegang Abnahmen; A18 Kiosk-Status | Umgehungen in § 6 |
| CRM | Kundenakte-Route, Termin-Assistent A1, Anfrage-Akte „Projekt anlegen“, PH Kontakt `sprache`, `email`, `nicht_kontaktieren` | B1, Empfohlen Anfrage | Link auf `/d/ph-kontakt/…` |
| Faktura | Angebot-Assistent A2, Schlussrechnung mit Leistungsdaten, AB-Anpassung aus Nachtrag, AB-Storno, Zeiten abrechnen, `fagg_*`, `zahlungsplan` | Tab Belege, PA8/PA9, Nachtrag-Übernahme | Hinweis „in Faktura erledigen“ + Aufgabe |
| Sortiment | Herstellerbestellungen erzeugen (A5), Produktbilder | Empfohlen Auftrag | Link |
| Logistik | Lieferscheine/Sendungen, Touren (Kiosk-Tab), Abholung bei Rücknahme | Tab Belege & Lieferung, Kiosk Tour | Abschnitt leer/ausgeblendet |
| Service | Servicefall aus Mangel, Gewährleistungslogik für Produktpass | „→ Servicefall“, `gewaehrleistung_bis` | Knopf deaktiviert |
| Personal | Abwesenheiten „abwesend“, Hinweis Projektzeit ≠ Arbeitszeit | Kalender | „Abwesenheiten nicht geprüft“ |
| Kassa | Kartenzahlung im Kiosk | Schalter `inkasso` | kein Inkasso |
| Marketing | Referenz → Website | – | – |
| Zentrale | Einbindung Heute-Leiste/Empfohlen | – | Projekte-Übersicht |

### 16.8 QA-Checkliste (Abnahme)

**Allgemein:** Primäraktion je Seite eindeutig mit `⌘Enter` · Filter in URL · Skeleton ≥ 300/600 ms, CLS 0 · alle Leer-Zustände (§ 5, je Liste drei Fälle) als Mock-Fall mit Screenshot hell/dunkel · axe serious/critical = 0 hell und dunkel auf Übersicht, Mappe, Rendering, Kalender, Zeitplan, Abnahme, Kiosk · Desktop 1280/1440, iPad quer/hoch, Telefon 390 · Mock-Modus vollständig.

**Datenschutz und Rechte**
1. (41) Mappe Projekt A enthält in DOM und Server-Antwort keinen Datensatz mit `kontakt ≠ A.kontakt` (Seed mit fremden Zahlungen, Terminen, Herstellerbestellungen ohne Bezug).
2. Beträge erscheinen für PH Projekte Mitarbeiter in keiner Spalte, keinem Tooltip, keinem CSV, keiner Netzwerkantwort.
3. Mitarbeiter sehen weder „Beauftragen“, „Abschließen“, „Abbrechen“ noch den Textknopf „Zurücksetzen“; Leitung sieht sie.
4. Abgeschlossenes Projekt ist für Mitarbeiter readonly.
5. Report „Zeiten“ gruppiert nach Mitarbeiter nur als Leitung verfügbar.

**Mappe**
6. (Q41) Genau 6 Tabs; Kopf ≤ 2 Zeilen + Phasenleiste + Empfohlen ≈ ≤ 160 px bei 1280; keine Information in Tab und rechter Spalte zugleich.
7. Kopf + Übersicht laden mit genau einem `auftragsmappe`-Aufruf plus Fremdbelegen.
8. Empfohlen entspricht § 4.3 für je ein Seed-Projekt je Regelzeile; Begründungszeile vorhanden.
9. (Q45) Klick auf jeden Phasenpunkt öffnet Info-Popover mit Objekten; 9 Punkte, „Abgeschlossen“ als letzter.
10. (Q43) Mitarbeiter schaltet Phase vor und macht innerhalb 8 s rückgängig: kein `apply_workflow`-Aufruf; Tab schließen im Fenster: genau ein Aufruf.
11. (Q46) Montage „In Arbeit“ (Seed) schiebt das Projekt auf „Montage“ mit Zeitleisteneintrag „System“; ohne Recht erscheint das Band „Phase anpassen“. AB vorhanden schiebt **nicht** auf Auftrag.
12. `uebergabe_am` ist nirgends editierbar oder ziehbar (Kopf, Details, Zeitplan).
13. (Q42) Composer steht nach jedem Senden auf „Intern“; „An Kunde“ zeigt Sand-Rahmen und Empfängerzeile; keine Taste schaltet den Modus.
14. (Q47) Termin-/Montageänderung erzeugt nie eine Kundennachricht ohne Sheet-Vorschau; Chip bleibt bis Senden oder „Nicht nötig“; Senden ist 10 s rückgängig zu machen.
15. (45) Kunde ohne E-Mail: „Kunden informieren“ ruft `portal_status_senden` nicht auf und zeigt „Nicht zugestellt“ mit Telefon-/Brief-Ausweg; Kopf-Chip „Kein Portal“.
16. Unter 1280 px ist die rechte Spalte ein Sheet; bei 768 px keine horizontale Seiten-Scrollleiste; Sticky-Kopf verdeckt nie das fokussierte Element (Tab-Durchlauf 40 Positionen).
17. (42) Stornierte AB erscheint ausgegraut und fließt in keine Summe; ohne Schalter `summen` steht keine berechnete Projektsumme im DOM; zwei Währungen → Chip „keine Summe“.
18. (44) Ohne `mengen_dezimal` wird „3,6“ mit Feldfehler abgelehnt (keine stille 3); mit Schalter bleibt 2,5 lfm 2,5.

**Planung, Rendering, Rückmeldungen**
19. Datei auf die Mappe ziehen → Auswahl Planung/Rendering; „Datei wählen“ als Alternative vorhanden; Handskizze ohne Bestätigung zeigt Servertext am Feld.
20. Renderings vorlegen (3 Varianten): genau eine Kundennachricht; danach bietet keine Akte mehr „Kunden vorlegen“ an.
21. Pins sitzen an `punkt_x/y` (±1 %) bei 1280/1920 und Zoom 2×; Kontrast ≥ 3:1 auf hellem und dunklem Seed-Bild; Studio-Pin per Tastatur setzbar; Klick im Modus „Ansehen“ setzt keinen Pin.
22. Neue Rendering-Version übernimmt `freigabe_feedback` nicht.
23. (Q51) Rückmeldungen-Zahl identisch in Pill, Kennzahl, Inbox-Kopf, Glocke (gemischter Seed inkl. Nachtragsentscheidung).
24. Inbox: `j/k`, `⌘Enter`, `Shift+E` funktionieren; „Erledigt“ innerhalb 8 s rückgängig ohne Serveraufruf; Fokus springt auf die nächste Zeile.
25. Planung mit Kundenentscheidung „Änderung gewünscht“ zeigt Banner + Empfohlen „Neue Version“.

**Montage und Abnahme**
26. (Q53) Montage planen mit Standardwerten = 2 Interaktionen im Sheet; Leistungen enthalten keine stornierten, fremd montierten oder nicht gelieferten Positionen; Teilfehler zeigt Band ohne Doppelanlage.
27. (Q48) Jeder Kalender- und Gantt-Block per Tastatur fokussierbar; `Enter` öffnet „Umplanen“, `Shift+←/→` ±1 Tag mit Undo; Drag achsengebunden; Doppelbuchung zeigt Text.
28. Kapazität nutzt „Monteure verfügbar“ × `montage_tagesstunden` (Tooltip), nicht die Zahl eingeteilter Personen.
29. (Q44) Abnahme mit Kunde: Kunde unterschreibt genau einmal unter dem Erklärungstext E3; danach Montage „Abgenommen“, Abnahme „Unterzeichnet“/„Mit Mängeln“, Protokoll-PDF abgelegt und Kopie an Kunden (Kanal sichtbar); ohne Mängel ≤ 5 Tipps; Unterschrift im Hochformat möglich.
30. (43) Unterschriebene Abnahme: UI bietet keine Änderung an Positionen/Vorbehalten/Datum; Server Action lehnt einen zweiten `unterschrift_erfassen`-Versuch ab (auch bei manipuliertem Aufruf).
31. Kanban-Drop auf „Abgenommen“ öffnet den Ablauf, nie die nackte Workflow-Aktion; (Q49) Drop auf „Abgebrochen“/„Abgeschlossen“ öffnet PA9/PA8, Abbrechen lässt die Karte unverändert.
32. Leistungsnachweis bei abwesendem Kunden: Fotos „nachher“ Pflicht, Montage bleibt „Fertig“, Empfohlen „Abnahme terminieren“.
33. Mängel-Liste zeigt alle drei Quellen; `behoben` (klein) gilt als erledigt.
34. Kiosk (Q57): Wortliste nur Losfahren/Beginnen/Fertig/Abnahme mit Kunde/Leistungsnachweis; eine Arbeitszeit-Uhr; Zeiten nur für Teammitglieder buchbar; Undo-Leiste 8 s verhindert den Aufruf.
35. Kiosk offline (Flugmodus): Haken, Foto, Mangel, Unterschrift, Status werden gepuffert und nach Wiederverbindung genau einmal übertragen; Konfliktfälle zeigen die vier Karten.
36. Kiosk ohne A18: reine PH-Montage-Benutzer sehen keinen Zustandsknopf, Text „Status meldet dein Montageleiter“; kein Knopf endet mit Rechtefehler.
37. Kein Bargeld-Feld im Kiosk.
38. Montagebericht-PDF mit `sprache_bericht = en` hat englische Überschriften.

**Nachträge, Recht, Abschluss**
39. Nachtrag vor Ort ohne Unterschrift nicht als freigegeben speicherbar; ohne `nachtrag_portal` keine Portal-Vorlage im DOM; freigegebener Nachtrag ohne AB-Anpassung zeigt Band und Empfohlen „AB anpassen“.
40. FAGG-Seed (Frist läuft): „Bestellen“ und „Montage planen“ verlangen die Nachweis-Checkbox; Nachweis steht in der Zeitleiste.
41. PA8 prüft Schlussrechnung über PH Rechnung `art = Schlussrechnung, status = Bezahlt`; ⚠ nur mit Begründung.
42. PA9 listet AB, Anzahlung, Herstellerbestellungen, Termine, Produktpässe; Teilfehler im Ergebnis-Drawer mit „Erneut“.
43. Produktpässe werden nicht für „bestellt“ erzeugt; Lieferdatum nie automatisch „heute“; Portal-Text bei abgelaufener Garantie enthält den Gewährleistungshinweis.
44. Zeiten „Als abgerechnet“ nur mit gewählter Projekt-Rechnung; abgerechnete Zeiten nicht bearbeitbar.
45. AU9/AU10 senden nicht an Kontakte mit `nicht_kontaktieren = 1` oder ohne Einwilligung (Mock-Protokoll).

**Texte, Tastatur, Bewegung**
46. (Q50) Kürzel-Registry ohne Doppelbelegung je Seitentyp; kein Bereichskürzel überschreibt 02 §9.1; Schalter „Einzeltasten aus“ deaktiviert alle Einzelbuchstaben.
47. (Q52) `/projekte` zeigt je Rolle 4 Kennzahlen, keine Charts; nichts zählt beim Erstaufbau hoch.
48. (Q58) DOM-Textsuche aller Routen: kein „Uebergabe“, „Kueche“, „Maengel“, „Feedback“, „Status senden“, „Abnehmen“, kein Emoji, keine Sie-Form in internen Texten; Kundentexte in Sie-Form.
49. Alle Animationen nutzen Token aus 04 §2.1; `prefers-reduced-motion` nur Opacity ≤ 80 ms; Signaturfeld im Dunkelmodus hell.
50. (Q55) Präsentationsmodus: keine Toasts/Glocke anderer Projekte; Beenden per PIN, Esc-Halten und Wortmarke-Halten; keine Preise.
51. (Q56) Ohne `kundenvorschau` gibt es keinen Kundensicht-Schalter; „Kunde sieht“/„Intern“ steht als Text an jedem Element.
52. (Q59) Upload-Fehlerfälle (Typ, Größe, Abbruch, Duplikat, Fotogrenze) zeigen Text am Ort des Uploads.
53. (Q61) E2E misst jede Zeile der Tabelle § 2 über genau den beschriebenen Weg; Abweichung = Fehler.
54. Kein Produkttext mit Superlativen; keine Zahl ohne Datenquelle (Review).

---

## 17. Nicht mehr enthalten (bewusst gestrichen)

Tabs Zeitplan, Tagebuch, Nachrichten, Aufgaben & Zeiten, Daten, „Mappe“; Route `/projekte/zeitplan` als eigene Seite; Stoppuhr und Shell-Anzeige „● 0:42“; Kundensicht-Schalter ohne Vorschau-Methode; Toast „Kunde informieren?“ → „Ja“ ohne Vorschau; automatische Kundeninfo nach Undo-Ablauf (M3 alt); Undo per Gegen-Workflow für Mitarbeiter; Klick auf Phasenpunkt = Zurück; 8 Phasen + separater Endzustand; manuelle Primäraktionen „Montieren“, „Liefern“, „Übergeben“ (bei `auto_phase`); Übergabe inline/ziehbar; zweite Kundenunterschrift; Knopf „Abnehmen“; Zustand „Unterschrift“ im Kiosk; separater Zeit-Knopf im Kiosk; Unterschrift „Vollbild quer“ als Zwang; PA5 mit einer Karte je Position als Pflicht; PA2 in 5 Schritten; Zusammenfassung als eigener Assistentenschritt; Kennzahl-Hochzählen; 6 Kennzahlen + 5 Charts am Bereichsstart; Kennzahlen „Offene Feedbacks“, „Renderings ohne Antwort“, „Ungelesene Nachrichten“ getrennt; Bereichs-Akkorde `g r/m/t`, Tasten `1–9`, `[`/`]`, `t`/`e`/`a`/`m`/`u`/`k`/`c`/`v`, `f`/`k` im Kalender; Emojis in Oberfläche; „Als abgerechnet“ mit Freitext-Belegnummer; Produktpass für bestellte Ware und Lieferdatum „heute“; berechnete Projektsummen vor A2; Barinkasso; Präsentation beenden nur per Langdruck; Chart „Durchlaufzeit“ ohne Report; Sammelvorlage mit doppelter Kundennachricht.

---

## 18. Änderungsprotokoll (Fassung 1 → Fassung 2, 2026-11-04)

**Aus UX-Kritik (20-kritik-ux-projekte.md):**

| Nr. | Umsetzung |
|---|---|
| P1 Mappe 12 Tabs | E1, § 4.1, § 4.4: 6 Tabs, Kopf ≤ 2 Zeilen, Tagebuch-Route 307, Zeitplan als Mini-Gantt; QA 6 |
| P2 zwei Eingabefelder | § 4.5 ein Aktivitätsstrom, Composer mit Modus Intern/An Kunde, Modus nie gemerkt; QA 13 |
| P3 Undo ohne Rechte | E2, § 3.4 verzögerter Commit inkl. Kiosk-Undo-Leiste, `pagehide`-Flush, Erledigt verzögert; QA 10, 24, 34 |
| P4 doppelte Unterschrift | E3, § 6.5 „Abnahme mit Kunde“ mit „Alles in Ordnung“, eine Unterschrift, Glossar § 3.2; QA 29 |
| P5 Phasenleiste | § 4.2: 9 Punkte, Klick = Info-Popover, Zurücksetzen nur per Dialog (Leitung), Mehrstufig mit Stopp, `<ol>`-Semantik; QA 9 |
| P6 Phase folgt Wirklichkeit | E4, § 4.3 (Regeln gestrichen), `phase.js`, Band „Phase anpassen“; QA 11 |
| P7 Kunde informieren | E5, § 3.5 ein Muster mit Chip, Sheet, 10-s-Commit, Fehler in Glocke; § 1 M3/B5 korrigiert; QA 14 |
| P8 Ziehen ohne Alternative | § 5.8 Block = Button + Umplanen-Popover + Fokus-Kürzel, achsengebundenes Drag; § 4.4 „In Raum verschieben“, „Neue Version hochladen …“, „Datei wählen“; § 5.5 Regler `role="slider"`; § 5.6 Pin-Modus per Tastatur; QA 21, 27 |
| P9 Kanban umgeht Assistenten | § 5.2 Drop auf Abgeschlossen/Abgebrochen öffnet PA8/PA9, Mehrfach-Drag zurückgelegt; § 5.8 Abgenommen → Ablauf; QA 31 |
| P10 Kürzel-Kollisionen | E12, § 3.7 neue Belegung, Registry, Schalter Einzeltasten; QA 46 |
| P11 Bereichsstart überladen | E16, § 3.6 eine Formel, § 5.1 4 Kennzahlen je Rolle, Charts → Berichte, kein Hochzählen; QA 23, 47 |
| P12 Navigation | § 3.1 Pills mit „Mehr ▾“, Liste Mängel (§ 5.11), Zeitplan nur als Ansicht, 307-Umleitungen alter Routen, Kiosk-Tab „Tour“ |
| P13 Assistenten zu lang | § 6.2 Montage planen als Sheet (2 Interaktionen), § 6.3 Vorlegen-Sheet, § 5.3 PA1 ein Bildschirm, Zusammenfassung als Satz; QA 26 |
| P14 Pins | § 5.6 Pin-Button 28/44 px, Ringe + Schatten, Form statt nur Farbe, `aria-label`, Pin nur im Modus „Pin“, Undo; QA 21 |
| P15 Präsentationsmodus | § 8.2 Band, PIN-Ausgang, Esc-Halten, Ausblendregeln, gemeinsame `KundenAnsicht`; QA 50 |
| P16 Kundensicht ohne Vorschau | E6, Schalter `kundenvorschau`, Text „Kunde sieht“/„Intern“, Filter-Chip; QA 51 |
| P17 Montage mobil | § 8.1 Wortliste, eine Uhr, Unterschrift beide Ausrichtungen, Undo-Leiste, Foto-Papierkorb; QA 34 |
| P18 Microcopy | § 3.2 Glossar, Du-Form, lucide-Icons statt Emojis, Lint; QA 48 |
| Empfehlungen §2.1–2.10 | Klickzahlen § 2 neu gezählt (Kamera-Ansicht für ≤ 8 Tipps), `⋯`-Menü gruppiert mit Filter (§ 4.6), Leer-Zustände L1–L22 an den Seiten, Fehlerfälle § 3.8/§ 8.1, WCAG-Tabelle umgesetzt (Statusleiste + Wort, `warning-text`, `scroll-margin`, Treegrid, `role="status"`, Kurzfassung Sprachnotiz), iPad-Regeln, Kalenderblock über Teamzeilen, Inbox-Zeile 120 ms, Sammel-Toast, Zeit-Eingaberegel, Token-Chips Schnellanlage, `?gewerk=`-Deep-Link, Desktop-Primär Montage-Akte, Kapazität aus „Monteure verfügbar“, Dunkelmodus Signaturfeld |

**Aus Fachkritik (21-kritik-fach-projekte.md):**

| Nr. | Umsetzung |
|---|---|
| B1 / P1 Datenleck | E8, § 11.2 explizite Bezugsfilter + Kontaktprüfung, `bezug.js`; Anfrage A2-Kontext in § 14; QA 1 |
| B2 / P2 Summen | E9 Schalter `summen`, Belege einzeln, Zahlungsplan Soll/Ist, Währung je Beleg; A2; QA 17 |
| B3 / P3 Netto/Brutto, Kalkulation | Kalkulation hinter `kalkulation`, Preis-Kennzeichnung „Brutto“ bis A3; A3 |
| B4 / P4 Mengen | E10, `mengen.js`, Schalter `mengen_dezimal`; A4; QA 18 |
| B5 / P5 Unterschrift änderbar | E11, § 5.10 readonly, Vorprüfung in Actions, Protokoll automatisch, Kopie an Kunden, Löschen nur Entwurf/Geplant; A5 Livegang-Blocker; QA 30 |
| B6 / P6 Gewährleistungsbeginn | E7, Übergabe nie editierbar/ziehbar, Auto-Übergeben am Abnahmetag (§ 7.1); A6; QA 12 |
| B7 a–j | a: Leistungsregel § 6.2 + A7 · b: § 6.7 + A10c · c: E17 + A7 · d: Kopf-Montagezeitraum aus Min/Max + A19b · e: Datum/Team-Prüfung § 8.1/§ 5.15 + A8 · f: Abrechnen nur mit Rechnung § 5.15 + A8 · g: Rollentabelle § 1, Schalter `montage_kiosk_status`, A18 · h: A18b · i: § 3.5 E-Mail-Vorprüfung + A20 · j: E4/§ 4.3 Hinweis statt Automatik + A25 |
| §2 Funktionen ohne Feld | § 11.2 (Zahlungen über Rechnungen, Gutschriften, Termine `ph_projekte_projekt`, Herstellerbestellung `bezug_*`), Zustellkanal, `erfasst_von_user` (A22), Erfassungszeit (A19), Teilabnahme; vorhandene App-Funktionen genutzt: Planung-Portal-Freigabe (§ 5.5), `liefertermin_kunde_automatisch`, `maengel_erinnerung_tage`, `montage_kostensatz_cent` (§ 5.20), `fahrzeug`/`kollisionen` (§ 5.8), Mangel-Verantwortlich (§ 5.11), `utils/mappe.py` (§ 10) |
| F1 Aufmaß | § 5.4, Empfohlen-Regel, Planungskopf |
| F2 Nachtrag | § 5.12, Inbox-Quelle, Empfohlen-Regeln, Übergabe an Faktura (A10) |
| F3 Lieferstatus/Nachlieferung | Tab Positionen Lieferstatus-Chips, Nachlieferung, Teilmontage-Regel § 4.3/§ 6.2 |
| F4 Fremdgewerk-Abnahme | § 5.13 Termine, Abnahme, Mängel; PA8-Zeile |
| F5 Geldfluss | Tab Belege & Lieferung, Zahlungsplan, Schlussrechnung mit Leistungsdatum (§ 12.2) |
| F6 Leistungsnachweis | E3, Variante „Nur Leistungsnachweis“ |
| F7 Kalkulation | Schalter `kalkulation`, Phase B |
| F8 Übergabe-Unterlagen | Protokoll-Kopie Pflicht (§ 5.10), Produktpass-Hinweise |
| F9 Archiv/Aufbewahrung | Löschverbote § 5.16/§ 12.2, A12 |
| R1–R16 | § 12 (Datenschutz, Steuern, FAGG, Gewährleistung, Ausland), E13/E14/E19; R15 KI-Hinweis in Druck (§ 5.6, § 10); R16 kein Befund |
| §5 Randfälle | 5.1 PA9 erweitert (§ 6.9) · 5.2 Teilmontage/Teilabnahme (E17, § 4.3, § 6.2, § 6.5) · 5.3 Anzahlung (§ 4.3, § 4.4) · 5.4 Rücknahme (§ 6.10, A10d) · 5.5 CH/DE/Yacht (§ 12.5, Währung) · 5.6 Kunde ohne E-Mail (§ 3.5, § 5.10) · 5.7 Verweigerung, Abwesenheit, Dritter unterschreibt, Rechnungsempfänger, Lieferanten-Mangel, Rendering-Version, mehrere ABs (§ 5.10, § 6.5, A14, A23, § 5.11, QA 22, § 4.4) |
| P7–P23 | P7 → A7/E17 · P8 → A8/§ 5.15 · P9 → § 5.12/A10 · P10 → § 5.17/A10b · P11 → § 12.2/A11c · P12 → § 5.16/A12 · P13 → § 12.3/F-1 · P14 → § 12.2/A14 · P15 → E14 · P16 → E13/§ 5.15 · P17 → E19/§ 9.2 · P18 → A18/A18b · P19 → A19b · P20 → A20 · P21 → E4/A25 · P22 → A22 · P23 → A23 |
| §6.1 Textkorrekturen | alle Stellen übernommen (L3 ohne Automatik, Planung-Portal-Lücke gestrichen, Rolle PH Montage aktualisiert, `utils/mappe.py` vorhanden, AU9/AU10 Einwilligung, neue QA 41–45 als QA 1, 17, 30, 18, 15) |
| §7 Offene Fragen | § 15 F1–F10 |

**Widersprüche zwischen den Kritiken und ihre Auflösung:** Tabs (6 vs. zusätzliche Fach-Tabs) → E1 · eine vs. zwei Unterschriften → E3 · automatische Phase vs. kein stiller Sprung → E4 · Stoppuhr serverseitig vs. Kontrollsystem → E13 (gestrichen) · Pill „Nachträge“ (Fach) vs. max. 7 Pills (UX) → Nachträge unter „Mehr ▾“, Inbox-Quelle und Mappe-Abschnitt.

*Ende 10 – Konzept Projekte, Fassung 2. Schnittstellen: 10-konzept-crm (Anfrage → Projekt, Termin, Kontakt), 10-konzept-faktura (Belege, Schlussrechnung, Nachtrag-AB, Zeiten), 10-konzept-sortiment (Herstellerbestellung), 10-konzept-logistik (Lieferschein, Tour), 10-konzept-service (Mangel → Servicefall, Gewährleistung), 10-konzept-personal (Abwesenheit, Arbeitszeit ≠ Projektzeit), 10-konzept-kassa (Inkasso).*
