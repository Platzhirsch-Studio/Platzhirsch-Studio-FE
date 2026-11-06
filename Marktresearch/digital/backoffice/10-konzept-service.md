# 10 – Konzept Bereich „Service“ · Fassung 3 (final, mit Bauauftrag)

**Zweck:** Verbindliches Funktions- und Oberflächenkonzept des Bereichs Service im eigenen Next.js-Backoffice (`backoffice/`, Port 3100, Route `/service`, Arbeitsplatz **Technik mobil** `/technik`): Servicefälle (Reklamation/Gewährleistung), Einsätze, Ersatzteile und Bestellungen, Lieferantenregress, Pflege-/Wartungsverträge, Serviceaufträge (Winterlager, Aufarbeitung), Fehlerkatalog, Berichte – plus Bauauftrag (§14) für den Service-Agenten. Datenschicht ist die Frappe-App `ph_service`; Frappe bleibt für Mitarbeiter unsichtbar.
**Stand:** 2026-11-04 · **Fassung 3** (alle Pflichtänderungen aus `20-kritik-ux-service.md` Runde 2 – N1–N19 – und `21-kritik-fach-service.md` – F1–F12, D1–D13, U-01–U-07, R-01–R-15, B-01–B-08, P-R1–P-R8, Randfälle, P-01–P-27 – eingearbeitet; Code-Abgleich `ph_service` Dateistand 04.11. 12:09; Änderungsprotokoll §15) · Rolle: Produktdesigner (Überarbeitung) · Status: Vorschlag zur Umsetzung, keine Inhaber-Entscheidung.
**Gelesen:** Fassung 2 dieses Konzepts; `20-kritik-ux-service.md`; `21-kritik-fach-service.md`; `10-konzept-zentrale.md` (Kürzel-Register §2.4, Bewegung §2.5, Freigaben §3.5.2, Datenschutz §3.16); `10-konzept-faktura.md` (Gutschrift, Mahnsperre); `10-konzept-logistik.md`/`10-konzept-projekte.md` (Übergaben an Service); `PLAN-NEXT-BACKOFFICE.md`; Code `Backend-Import/ph_service/ph_service/`: `ph_servicefall.py`/`.json`, `ph_serviceeinsatz.py`/`.json`, `ph_lieferantenregress.py`/`.json`, `ph_pflege_abo.py`, `ph_serviceauftrag.py`, `ph_ersatzteilbestellung.py`, `ph_servicefall_foto.json`, `ph_servicefall_kosten.json`, `ph_service_einstellungen.json`, `utils/schritte.py`, `api/__init__.py` (Backoffice-Endpunkte `get_next_steps`, `get_service_case_file`, `get_technician_slots`), `install.py`, `fixtures/workflow.json`; Fundament `backoffice/src` (Ordner `app/(kiosk)/technik`, `components/Backoffice`, `lib/backoffice/frappe`).

**Regeln (gelten für jede Zeile dieses Dokuments):**
- Frappe unsichtbar: keine Begriffe „DocType“, „Submit“, „workflow_state“ in der UI. Status-Werte erscheinen mit Umlauten (`Geprueft` → „Geprüft“, `Bestaetigt` → „Bestätigt“, `Benoetigt` → „Benötigt“), gespeichert wird der App-Wert. App-Status `Entscheidung` heißt in der UI **„Entschieden“** (N9).
- Beträge aus Cent über `cent()`; Kostenbeträge im Service sind **netto (ohne USt)** und so beschriftet; Beträge an den Kunden (Kulanz, Preisminderung) sind **brutto** und so beschriftet (B-01, B-03).
- Keine Superlative, keine erfundenen Zahlen: Fristen und Schwellen stammen aus `PH Service Einstellungen` und `fristen.py`; fehlt eine Zahl (z. B. Rügefrist), steht sie als Frage in §12, nicht als Annahme.
- **Stufen-Kennzeichnung:** **[jetzt]** = mit dem heutigen Code baubar · **[Anfrage A-S…]** = braucht Feld/Methode in einer App (§12); die UI erkennt das Vorhandensein über `faehigkeiten.js` (Meta: Feld/Methode vorhanden?) und blendet fehlende Funktionen **aus** (nicht deaktivieren). Wo Recht betroffen ist, nennt der Text die **Übergangsregel**, die ab sofort gilt.
- Bewegung nur über Token (`--bo-dur-*`, `--bo-ease-*`, Werte §2.0.4); keine Millisekunden im Bereichscode (N15).

---

## 0. Leitidee und Entscheidungen

1. **Der Fall führt.** Jede Akte zeigt die Phase (6 Phasen: Gemeldet · Geprüft · Entschieden · In Bearbeitung · Erledigt · Geschlossen) und genau **einen** nächsten Schritt als Primärknopf. Die Regel kommt aus **einer Quelle**: dem Server (`ph_service.utils.schritte`, Endpunkt `get_next_steps`).
2. **Fristen gelten ab Meldung, nicht ab heute.** Das Fristband trennt den **Anspruchsstand bei Meldung** (rechtzeitig gemeldet oder nicht) von der **Warnung ab heute** (Verjährung der Geltendmachung). Ein rechtzeitig gemeldeter Mangel wird nie als „nur Kulanz“ angezeigt.
3. **Der Lieferant erfährt früh vom Mangel.** Nach „Prüfung abschließen“ mit bestätigtem, lieferantenrelevantem Mangel folgt die Mängelanzeige an den Lieferanten – nicht erst nach Erledigung. Die Regressforderung (Betrag) folgt nach Erledigung; eine Meldung allein gilt nicht als Fristwahrung.
4. **Wissen steht am Fehlercode** (Prüfhinweis, Standardlösung, Kundentext) – in der Meldung, in der Entscheidung, beim Techniker.
5. **Der Techniker arbeitet auf dem Telefon, kassiert nicht** und schließt offline ab; Zeiten, Pause, Teile, Bestätigungsart und Fotos landen im Fall.
6. **Geld und Recht laufen über ihre Fachbereiche:** Gutschriften mit USt über Faktura, Rücknahmen über Logistik, Datenschutzauskunft über die Zentrale. Service stößt an, bucht aber nichts an diesen Bereichen vorbei.

### 0.1 Entscheidungen bei Widersprüchen (zugunsten Einfachheit und Rechtskonformität)

| # | Widerspruch | Entscheidung | Grund |
|---|---|---|---|
| E1 | Kulanz-Freigabe: UX N6 „aufgeklappter Eintrag ist die Bestätigung, kein Dialog“ ↔ Zentrale §3.5.2 „geldwirksam → Bestätigen-Dialog mit Betrag“ | **Zentrale-Komponente `FreigabeEintrag`** gilt: Ablehnen mit Pflichtgrund im Eintrag, Freigeben mit Bestätigen-Dialog (Betrag, Fall, Folge). Kein Timer, keine Fortschrittslinie. Klickzahl Glocke 3 (Glocke → Freigeben → Bestätigen), Zentrale-Kachel 2 | ein Muster für alle Freigaben im System; kein Zeitlimit (WCAG 2.2.1) |
| E2 | Undo-Dauer 8 s / Mails 10 s / Kiosk 5 s | **8 s** im Backoffice für alles (auch Mails), **5 s** im Kiosk Technik | Zentrale §2.5 legt 8 s fest; eine Zahl weniger zu lernen |
| E3 | Kürzel: Fassung 2 (`e` CSV, `Shift+S`, `Shift+K/P/A/F`, `t`, `1–6`, `Alt+1…5`) ↔ Zentrale-Register §2.4 | **Zentrale-Register gilt**; Service belegt nur `N`, `/`, `↑↓ J K`, `Enter`, `X`, `A`, `S`, `C`, `M`, `Z`/`Strg+Z`, `Strg+Enter`, `1–6` (Reiter, Kontext Liste, beantragt in `kuerzel.js`). Gestrichen: `e` CSV, `Shift+S`, `Shift+K/P/A/F`, `t`, `Alt+1…5`. Kontext-Aktionen der Akte stehen in der Palette (`Strg+K`, Gruppe „Dieser Fall“) | weniger Einzeltasten; keine Kollision mit `E` = Bearbeiten |
| E4 | Gutschrift: `PH Servicefall.gutschrift_erstellen` bucht 0 % USt (B-01, rechtswidrig) | Service ruft diese Methode **nicht** auf. „Gutschrift erstellen“ nutzt die Faktura-Methode `PH Rechnung.gutschrift_erstellen(art, grund, erstattung_art)` (Entwurf mit Positionen und USt der Rechnung, Prüfung in Faktura) | USt-Berichtigung § 16 UStG; Faktura ist die Stelle für Belege |
| E5 | Erstreaktions-Schalter in S1 ↔ Server setzt bei Telefon/Showroom selbst (`telefon_ist_erstreaktion`) | Schalter nur, wenn Einstellung = 0; sonst Textzeile „Kunde gilt als kontaktiert (Telefon)“. Kein Kommentar-Kennzeichen `[erstreaktion]` mehr | eine Wahrheit (`erstreaktion_am`) für Reiter, Kennzahl, ToDo |
| E6 | Nächster Schritt Client-Tabelle ↔ Server `schritte.py` | Server ist maßgeblich; Client spiegelt nur für optimistische Anzeige; fehlende Schritte (Mängelanzeige, Gutschrift, Termin unbestätigt, Kulanz abgelehnt, Folgeeinsatz, Abschluss mitgeteilt) sind Anfrage A-S2 und erscheinen bis dahin als **Hinweis mit Aktion** (Banner/Karte), nicht als Primärknopf | keine zwei Regelwerke |
| E7 | S5 „Fall gleich schließen“ ↔ offener Regress (N3) | Schließen in S5 nur, wenn kein Lieferantenschritt offen ist und der Abschluss mitgeteilt wurde | Regressfrist läuft sonst still ab |
| E8 | Fotos an Lieferant: Standard `an_lieferant = 1` (R-06) | Backoffice setzt beim Upload `an_lieferant = 0` für Quelle Kunde/Techniker; S4 zeigt den Fotoschritt immer, wenn ein Kundenfoto dabei ist | Datenminimierung Art. 5 DSGVO |
| E9 | Widerruf Nachkauf (R-05): „Widerruf erfassen“ setzte `widerrufen_am` und wurde vom Controller zurückgesetzt | „Widerruf erfassen“ setzt **`nachkauf_einwilligung = 0`**; Wiedererteilung nur über eigenen Dialog mit Textversion + Nachweis (Leitung) | Art. 7 DSGVO |
| E10 | Austausch/Rückabwicklung/Kostenpflicht (P-R1–P-R3) brauchen Methoden in drei Apps | **Stufe 2** des Baus: Konzept vollständig (§4.4 S9, S10, §4.8), Bau erst mit Anfragen A-S6–A-S8; bis dahin führt die Akte per Hinweis in die Fachbereiche (Logistik Rücknahme, Faktura Gutschrift/Rechnung) | Bau nicht blockieren, keine Schattenprozesse |
| E11 | Übersicht-Tab vs. „Mangel & Fristen“ (UX 3.2: evtl. zusammenlegen) | 5 Tabs bleiben; Übersicht ohne Nächster-Schritt-Karte (N9); Entscheidung nach Klicktest mit 2 Mitarbeitern (§12 Inhaber/QA) | keine Umstrukturierung ohne Test |
| E12 | Leerzustand-Icon 24/32/40 px; Seitengröße 25/50 | Komponente `Leer` (03 §8.18) ohne eigene Maße; Seitengröße 50 | Fundament gilt |

### 0.2 Code-Abgleich `ph_service` (Stand 04.11.2026 12:09)

| Bereich | vorhanden (nutzen) | fehlt (Anfrage §12) | anders als Fassung 2 angenommen |
|---|---|---|---|
| Erstreaktion | `erstreaktion_erfassen(kanal, notiz)` (Kanäle Telefon, Vor Ort, Rückruf, E-Mail, Portal; schließt ToDos „Reaktionsfrist“); `before_insert` setzt `erstreaktion_am` bei Kanal Telefon/Showroom, Einstellung `telefon_ist_erstreaktion`, `quelle` leer/backoffice | – | „Showroom“ ist kein Erstreaktionskanal (→ „Vor Ort“) |
| Nächster Schritt | `utils/schritte.naechster_schritt`; whitelisted `ph_service.api.get_next_steps(names)` (max. 200, liefert `schritt, aktion, faellig, rang`) | Zeilen Mängelanzeige, Gutschrift, Termin unbestätigt, Kulanz abgelehnt, Folgeeinsatz, „Abschluss mitgeteilt“ (A-S2) | Server prüft Regress vor Kundeninfo; Rückfall-Fälligkeit `frist_loesung` |
| Akte | `ph_service.api.get_service_case_file(name)` (Fall, Einsätze, Bestellungen, Regresse, nächster Schritt, Fristen, SLA; Kosten nur mit Recht) | – | Aggregat existiert |
| Freie Zeiten | `ph_service.api.get_technician_slots(datum, dauer_min, techniker)` (Technikertag, Puffer, Abwesenheit) | – | Endpunkt existiert |
| SLA | `frist_loesung`, `sla_status` (Im Plan/Gefaehrdet/Verletzt/Erfuellt), `sla_reaktion_verletzt`, `sla_loesung_verletzt`, `sla_eskalationsstufe`, `sla_info()` | Zusammenführen `eskalationsstufe` + `sla_eskalationsstufe` (A-S9) | – |
| Kulanz | `kulanz_anfordern()`, `kulanz_freigeben(kommentar, betrag_cent)`, `kulanz_ablehnen(grund)`, Feld `kulanz_freigabe_status` | – | App benachrichtigt die Leitung selbst (keine PH Aufgabe zusätzlich) |
| Kommunikation | `kunde_informieren(vorlage ∈ eingang/termin/abschluss/ablehnung/frei, zusatz, betreff)`; `ablehnen(grund, begruendung, kunde_informieren)` | Kanal ohne E-Mail `kunde_informiert_erfassen` (A-S3); Feld `abschluss_informiert_am` (A-S3) | jede Vorlage setzt `kunde_informiert_am` (N3) |
| Einsatz | `umplanen(datum, zeit_von, zeit_bis, techniker, grund)` (nur Geplant/Bestätigt, setzt Status Geplant, leert `bestaetigt_kunde_am`, zieht Termin nach), `abbrechen(grund)`, `abschliessen(…, pause_min, unterschrift_art, bericht_senden)`, `bericht_senden()` | Parameter `benoetigt[]` an `abschliessen` (A-S10); Bestandsfehler als Teilfehler (A-S10) | Abbrechen darf jeder mit Schreibrecht |
| Ersatzteile | `ersatzteile_bestellen(lieferant, zeilen, lieferadresse, wunschtermin)` | Bewegungsarten mit Minus (A-S11); Storno nur Rest (A-S11) | Zeilenauswahl existiert |
| Regress | `gutschrift_erfassen(betrag_cent, nummer, datum, beleg, eingangsrechnung)` (setzt Anerkannt/Verrechnet), `differenz_ausbuchen(grund)` (Leitung), `abgleich_status`, `differenz_cent`, `quote_promille` | `rechtsgrundlage`, Anerkenntnis, Verjährungsverzicht, Klage (A-S4); `steuerliche_art` (A-S12); Währung (A-S13) | Workflow „Regress verrechnet“ ohne Zahlung setzt erhalten = anerkannt |
| Fristen | `sachart`, `uebergabe_quelle`, gespeicherte `gewaehrleistung_bis`, `beweislast_bis`, `verjaehrung_bis`, `garantie_bis`, `regress_frist_bis` | `fristen_status_bei_meldung` + `fristen(stichtag)` (A-S1); `fristen_info()` ohne `sachart` (A-S1); Reihenfolge Übergabequelle (A-S5) | Übergabe-Reihenfolge Lieferschein vor Montage-Abnahme |
| Fehlerkatalog | Seed in `install.py` (12 Bereiche), `sonstiges_je_bereich()` legt `<BER>-99 Sonstiges` je Bereich an | – | Katalog ist nach Installation **nicht** leer |
| Serviceauftrag | `uebernahme_erfassen(positionen, unterschrift, name_bestaetigt, lagerort)`, `rueckgabe_erfassen(…)` | `rechnung_erstellen`, Workflow-Bedingung „Abrechnen“ (A-S8) | Übernahme-Methoden existieren |
| Gutschrift | – | `gutschrift_erstellen` mit USt/Währung (A-S7); bis dahin Faktura-Weg (E4) | Methode bucht 0 % USt |
| Fotos | `medientyp` (Bild/Video/PDF) | Standard `an_lieferant = 0` (A-S14) | Standard 1 |

---

## 1. Nutzer und Top-Aufgaben (Klickzahl)

**Zählweise (02 §0.3, §1):** Start **Zentrale**, Seitenleisten-Klick zählt 1; Klick, Tipp und Enter zählen je 1; Tippen von Text, `Tab` und Pfeiltasten zählen 0; Klick in ein Feld zählt 1; vorbelegte unveränderte Werte zählen 0. Zweite Spalte: Weg über `Strg+K`. Werte über 3 sind Assistenten und bewusst so (Folgen in einem Schritt). Jede Zeile ist ein E2E-Schritt (§10 Q-29).

Rollen aus `ph_service`: **PH Service Mitarbeiter**, **PH Service Leitung** (Kulanz über Schwelle, Ablehnen, Wieder öffnen, Differenz ausbuchen, Einstellungen, permlevel 1), **PH Techniker** (liest Fälle ohne Kosten, bearbeitet Einsätze), **PH Geschäftsführung** (lesend), **PH Buchhaltung extern** (Regress lesend).

### 1.1 Sachbearbeitung (Desktop, Telefon am Ohr)

| Top-Aufgabe | ab Zentrale | über `Strg+K` | Weg |
|---|---|---|---|
| Reklamation am Telefon aufnehmen (S1-Schnell) | 5 | 4 | `N` → „Servicefall“ → Kontakt + Enter → Fehler + Enter → `Strg+Enter` (Art Mangel, Kanal Telefon vorbelegt) |
| Eingangsbestätigung senden | 2 | 2 | Service → Zeilenknopf in „Jetzt dran“ (Seite bleibt, Undo 8 s) |
| Telefonat erfassen (Kunde kontaktiert) | 3 | 3 | Service → Zeilenknopf „Telefonat erfassen“ → `Strg+Enter` |
| Prüfen und entscheiden (S2) | 6 | 5 | Service → Zeilenknopf → „Ja“ → Entscheidungs-Kachel → Textbaustein → „Entscheiden und in Bearbeitung nehmen“ |
| Mängelanzeige an Lieferant (S4a) | 4 | 3 | Service → Zeilenknopf „Mängelanzeige senden“ → Fotoschritt „Weiter“ → „Senden“ |
| Einsatz planen (A14, Vollseite) | 6 | 5 | Service → Zeilenknopf → freies Fenster → „Weiter“ → „Weiter ohne Änderungen“ → „Einsatz anlegen“ (Art vorbelegt „Reparatur“) |
| Ersatzteile bestellen (S3) | 4 | 3 | Service → Zeilenknopf → „Weiter“ → „Bestellung senden“ |
| Erledigt melden (S5) | 6 | 5 | Service → Zeilenknopf → „Weiter“ → „Weiter“ (Bestätigung liegt vor) → „Weiter“ (Vorschau) → „Erledigt melden und Kunde informieren“ |
| Regressforderung (S4b) | 4 | 3 | Service → Zeilenknopf „Forderung stellen“ → „Weiter“ → „Senden“ |
| „Was ist mit meiner Reklamation?“ | 4 | 2 | Service → Servicefälle → Suche + Enter → Zeile · bzw. `Strg+K` → Name + Enter |
| Ersatzteil-Wareneingang | 4 | 3 | Service → Ersatzteile → Reiter „Erwartet“ → Zeilenknopf „Wareneingang buchen“ → „Buchen“ (5) |
| Heute fällige Dinge sehen | 1 | – | Service (Bereichsstart) |

### 1.2 Leitung (Desktop/iPad, liest mehr als sie schreibt)

| Top-Aufgabe | ab Zentrale | Weg |
|---|---|---|
| Kulanz freigeben | 2 | Zentrale-Kachel „Freigaben“ → „Freigeben“ → Bestätigen (Dialog mit Betrag) · über Glocke 3 |
| Kulanz ablehnen | 3 | Kachel → „Ablehnen…“ → Grund tippen → „Ablehnen“ (verzögertes Senden 8 s) |
| Fall ablehnen | 6 | Service → Servicefälle → Zeile → `S` → „Ablehnen“ → Grund → „Ablehnen“ (Schalter „Kunde per E-Mail informieren“ vorbelegt an, wenn E-Mail vorhanden) |
| Gutschrift des Lieferanten erfassen | 4 | Service → Regress → Zeilenknopf „Gutschrift erfassen“ → „Erfassen“ (Betrag vorbelegt) |
| Eskalierte Fälle | 3 | Service → Servicefälle → Reiter „Eskaliert“ |
| Reklamationsquote je Marke | 4 | Service → Mehr → Berichte → Bericht |

### 1.3 Techniker (Technik mobil, iPhone/iPad)

| Top-Aufgabe | Tipps | Weg |
|---|---|---|
| Heutige Einsätze | 0 | Start = „Heute“ |
| Navigation | 1 | Adresse antippen |
| Unterwegs / Angekommen | 1 je Schritt | ein Primärknopf, 5 s Undo |
| Foto vorher/nachher | 3 | „Foto vorher“ → Auslöser → „Foto verwenden“ |
| Einsatz abschließen | 7 | „Abschließen“ → Ergebnis-Kachel → „Weiter“ → „Weiter“ (Teile, Pause vorbelegt) → Textbaustein → „Weiter“ → „Fertig“ (Zeichnen zählt 0; Name vorbelegt) |
| Nicht angetroffen | 3 | „Nicht angetroffen“ → Chip „Niemand da“ → „Senden“ |

### 1.4 Geschäftsführung, Buchhaltung extern

| Top-Aufgabe | Weg |
|---|---|
| Lage Service | GF-Zentrale: 4 Kennzahlen (§5), 0 Klicks |
| Servicekosten je Monat | Service → Mehr → Berichte → „Servicekosten“ (4) |
| Regressgutschriften abgleichen (extern) | Startansicht Regress, Reiter „Verrechnet“, „CSV“ (2) |

---

## 2. Seiten des Bereichs

Seitentypen nach 05 §2 (T1 Dashboard, T2 Liste, T3 Kanban, T4 Kalender, T5 Akte, T6 Assistent, T7 Kiosk, T8 Report, T9 Einstellungen). Gemeinsam: Filter in der URL, Skeleton nach 300 ms (mind. 600 ms sichtbar), Leerzustände über `Leer`, Fehler über `Fehler` (02 §7.2), `?`-Hilfe je Route (§13).

### 2.0 Routen, Rollen, Navigation, Kürzel, Bewegung

#### 2.0.1 Routen

| Route | Typ | Datenquelle | Mindestrecht | Primär |
|---|---|---|---|---|
| `/service` | T1 | Kennzahlen (§5), `get_next_steps` | Service *, Techniker (reduziert) | „Servicefall melden“ |
| `/service/faelle` (`?ansicht=kanban`) | T2/T3 | PH Servicefall + `get_next_steps` | Service *, Techniker lesend | „Servicefall melden“ |
| `/service/faelle/neu` | T6 (S1-Vollständig; S1-Schnell ist Sheet über jeder Seite) | `insert`, `aus_dokument` | Service * | „Anlegen“ |
| `/service/faelle/[name]` | T5 | `get_service_case_file` | Service *, Techniker ohne Kosten, GF lesend | nächster Schritt |
| `/service/einsaetze` (`?ansicht=kalender\|kanban\|liste`) | T4/T3/T2 | PH Serviceeinsatz | Service *, Techniker | „Einsatz planen“ |
| `/service/einsaetze/neu?fall=` | T6 (A14, Vollseite, N18) | `get_technician_slots`, `einsatz_anlegen` | Service * | „Einsatz anlegen“ |
| `/service/einsaetze/[name]` | T5 | PH Serviceeinsatz | Service *, Techniker | je Status |
| `/service/ersatzteile` (`?ansicht=teile\|bestellungen`), `/service/ersatzteile/[name]`, `/service/ersatzteile/bestellungen/[name]` | T2/T3/T5 | PH Ersatzteil, PH Ersatzteilbestellung | Service * | „Bewegung buchen“ / „Beim Hersteller bestellen“ |
| `/service/regress`, `/service/regress/[name]` | T2/T3/T5 | PH Lieferantenregress | Service * schreibend (Workflow erlaubt Mitarbeiter), Buchhaltung extern lesend | je Status |
| `/service/vertraege` (`?art=pflege\|auftraege`), `/service/vertraege/pflege/[name]`, `/service/vertraege/auftraege/[name]` | T2/T3/T5 | PH Pflege Abo, PH Serviceauftrag | Service *, Techniker lesend | je Status |
| `/service/fehlerkatalog` | T9 Baum | PH Fehlerbereich, PH Fehlercode | Leitung schreibt, Mitarbeiter liest | „Code anlegen“ |
| `/service/berichte/[report]` | T8 | 5 Script Reports | Service *, GF | „CSV“ (mit `export`) |
| `/service/einstellungen` | T9 | PH Service Einstellungen | Leitung | `Strg+S` |
| `/technik` | T7 | Einsätze des Technikers | Techniker, Service * | Statusknopf |

Alte Routen `/service/ersatzteilbestellungen/*`, `/service/pflege-abos/*`, `/service/auftraege/*` → 307 auf die neue Ansicht (Filter bleiben). Seitentitel: `PH-SRV-2026-00031 · Fam. Huber · Service · Platzhirsch Backoffice`.

#### 2.0.2 Unternavigation (Pills, max. 7)

```
Service  [Übersicht] [Servicefälle] [Einsätze] [Ersatzteile] [Regress] [Verträge] [Mehr ▾]
                                                                                   ├ Fehlerkatalog
                                                                                   ├ Berichte
                                                                                   └ Einstellungen (Leitung)
```

| Rolle | Pills |
|---|---|
| Mitarbeiter | alle, „Mehr“ ohne Einstellungen |
| Leitung | alle |
| Techniker (im Backoffice) | Übersicht · Einsätze · Ersatzteile |
| GF | Übersicht · Servicefälle · Regress · Mehr (Berichte) |
| Buchhaltung extern | Regress (einzige Pill, Startansicht) |

Aktive Pill: Unterstrich 2 px Tinte ohne Gleiten, Farbwechsel `--bo-dur-fast`. Zähler nur an „Servicefälle“: „Reaktion überfällig“ (`danger-soft`, nur > 0).

#### 2.0.3 Kürzel des Bereichs (Kontexte nach Zentrale §2.4; (E) = Einzeltaste, abschaltbar)

| Kontext | Taste | Wirkung |
|---|---|---|
| global | `G` `V` (E) | Service öffnen (Zentrale-Register) |
| global | `N` (E) → `V` | Neu-Menü → Servicefall (S1-Schnell) |
| Liste | `↑↓`/`J K`, `Enter` Akte, `X` Auswahl, `A` Zuweisen, `S` Status, `C` Kommentar, `1–6` Reiter, `/` Suche | `1–6` als Anfrage an `kuerzel.js` (Kontext Liste) |
| Liste/Jetzt dran | `Strg+Enter` | Primär der **fokussierten Zeile**; ohne Zeilenfokus Primär der Seite (Regel im `?`-Overlay) |
| Liste | Leertaste | Side-Peek (Anfrage an `kuerzel.js`; bis dahin Peek über Zeilen-Icon `panel-right`) |
| Kanban | `←→↑↓` Fokus, `M` (E) Verschieben-Menü, `Shift+←/→` verschieben | Techniker: nichts davon |
| Kalender | ein Raster mit Roving-Fokus über 30-min-Zellen **und** Karten (Karte belegt ihre Zellen, bekommt beim Betreten den Fokus); `Enter` auf freier Zelle = A14, auf Karte = öffnen, `M` auf Karte = umplanen; `Shift+←/→` Zeitraum; Knopf „Heute“ ohne Buchstaben | Live-Region nennt Zelle bzw. Karte |
| Akte | `E` (E) erstes Feld, `S` Status-Popover, `Strg+P` Druck, `Alt+↑/↓` vorige/nächste der Liste, `Strg+K` → Gruppe „Dieser Fall“ (Erledigt melden, Einsatz planen, Kunde informieren, Kundenakte, Auftragsmappe) | Tabs per Tab/Pfeil (Tablist), keine eigene Ziffernbelegung |
| Toast | `Z` (E) / `Strg+Z` Rückgängig, `F8` Fokus auf Toast | Ansage enthält „Rückgängig mit Z“ |
| Dialog/Sheet | `Strg+Enter` Primär, `Esc` schließen | – |

Nicht belegt: `e` (CSV nur über Knopf und Palette „Servicefälle als CSV“), `p`, `r`, `t`, `Shift+Buchstabe`.

#### 2.0.4 Bewegungs-Token (Quelle `04-motion.md`, im Code nur Namen)

| Token | Wert | Verwendung im Service |
|---|---|---|
| `--bo-dur-ack` | 50 ms | Druck-Zustand Knopf (Technik: nur `background-color` → `surface-3`) |
| `--bo-dur-fast` | 120 ms | Pill-Farbe, Wissen unter Fehlercode (Opacity), Knopftext-Crossfade Technik, Popover, Zeile verlässt Liste |
| `--bo-dur-base` | 160 ms | Dialog, Zeile aktualisiert in place, Leerzustand nach Skeleton, Akkordeon/Banner `grid-template-rows` (`--bo-ease-inout`) |
| `--bo-dur-move` | 200 ms | Sheet (S1, S2, Peek) `--bo-ease-out`, Kanban-Rückfeder, Fristband-Grenzmarken (`--bo-ease-inout`, `translate`/`clip-path`) |
| `--bo-dur-slow` | 240 ms | Erfolgsmoment-Karte |
| `--bo-dur-draw` | 400 ms | Häkchen zeichnen (`--bo-ease-inout`) |
| `--bo-ease-linear` | linear | Undo-Balken im Toast |

`prefers-reduced-motion`: alles sofort; Undo-Balken wird Countdown-Text („noch 6 s“), ebenso das 30-s-Sperrband der Technik.

### 2.1 Bereichsstart `/service` (T1)

```
┌ Zentrale › Service                                                        [+ Servicefall melden] ┐
│ Heute: [2 Reaktion überfällig] [1 Mängelanzeige offen] [1 Regressfrist ≤ 14 Tage]                │
│        [1 Kulanz-Freigabe] (Leitung) [1 Wartung überfällig]    (Chips nur > 0)                    │
├──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬───────────────────────┤
│ OFFENE FÄLLE │ GEWÄHRLEIST. │ EINSÄTZE     │ REGRESS OFFEN│ ERSATZTEILE  │ Ø DURCHLAUFZEIT       │
│ 14           │ ENDET ≤ 60 T │ DIESE WOCHE 7│ 2.340,00 €   │ UNTER MINDEST│ 9 Tage · aus 31 Fällen│
├──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴───────────────────────┤
│ JETZT DRAN (Rang des Servers)                                  ║ EINSÄTZE HEUTE · 3              │
│ ● PH-SRV-2026-00031 Fam. Huber · Polster Nahtriss  Reaktion seit gestern ║ 08:00 T. Steiner · Lochau │
│   [Eingangsbestätigung senden]   (secondary sm)                ║   Reparatur · Bestätigt          │
│ ● PH-SRV-2026-00029 Hotel Alpenrose · Scharnier    Prüfung bis 05.11.  ║ 10:30 T. Steiner · Bregenz│
│   [Prüfen & entscheiden]                                       ║                                  │
│ ● PH-SRV-2026-00022 Fam. Berg · Transportschaden    Mängelanzeige offen║ GEWÄHRLEISTUNG ENDET ≤ 14 T  │
│   [Mängelanzeige senden]                                       ║ (clock) PH-SRV-2026-00018 09.11.│
│ … Alle offenen Fälle (14) →                                    ║                                  │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Leitung/GF: [Fälle je Monat] [Nach Art] [Nach Fehlerbereich] [Nach Marke] [Regress nach Status]  │
│ Mitarbeiter: Link „Berichte →“                                                                    │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Genau ein Tinte-Knopf** je Seite: „Servicefall melden“. Zeilenaktionen in „Jetzt dran“ sind `secondary` sm (28 px, Rand `line-control`); Fokus/Hover zeigt `<kbd>Strg ↵</kbd>` am Knopf (N10).
- **Wirkung der Zeilenaktion:** Aktionen mit Sheet (S2, Telefonat erfassen, S3, S4) öffnen das Sheet **über** dem Bereichsstart; A14 öffnet die Vollseite mit Krümel zurück; Ein-Klick-Aktionen (Eingangsbestätigung) laufen ohne Seitenwechsel mit Undo. Ergebnis aktualisiert die Zeile in place (`--bo-dur-base`); erledigte Zeilen verlassen die Liste erst nach Ablauf des Undo (Zentrale „keine Bewegung unter dem Zeiger“), danach `--bo-dur-fast`; Fokus springt auf die nächste Zeile. URL bleibt `/service`.
- **Heute-Leiste (Arbeitszähler):** Reaktion überfällig (Definition §3.4 D-1) · Mängelanzeige offen (§3.7) · Regressfrist ≤ 14 Tage · Wartungen überfällig · Leitung zusätzlich Kulanz-Freigaben (`kulanz_freigabe_status = Angefordert`). „Einsätze heute“ ist **kein** Chip; die Liste rechts trägt die Zahl im Titel (N4). Alle 0 → „Heute nichts Dringendes.“ (Icon `check` Sand).
- **Kennzahlen (Bestand/Geld), max. 6 je Rolle:** §5. Keine Zahl doppelt auf der Seite. Ø Durchlaufzeit nennt die Basis („aus 31 Fällen“).
- **Jetzt dran:** offene Fälle, sortiert nach `rang` aus `get_next_steps` (ein Aufruf für max. 200 Namen); max. 8 Zeilen, danach „… und 6 weitere überfällig →“ bzw. „Alle offenen Fälle (14) →“. Knopftext = `schritt`-Text des Servers bzw. Hinweisaktion (§3.4).
- **Listen rechts:** „Einsätze heute · n“ (`datum = heute`, nicht Abgebrochen, nach `zeit_von`); „Gewährleistung endet ≤ 14 Tage“ (Report `PH Gewährleistungsfristen`, `tage=14`). Nie „Fristen“ ohne Fristart.
- **Charts** nur Leitung/GF; Mitarbeiter sehen „Berichte →“.
- **Laden/Leer/Fehler:** jede Kachel eigener `<Suspense>`; Reihenfolge Heute-Leiste → Kennzahlen → Listen → Charts. Nie Fälle: „Noch keine Servicefälle. Fälle entstehen hier, aus Montage, Abnahme und Wareneingang oder über Portal und Website.“ [Servicefall melden]. Alles erledigt: „Alles erledigt – keine offenen Servicefälle.“ Kennzahl ohne Werte: „–“ mit `aria-label="Noch keine Werte"` und sichtbarem Tooltip bei Fokus (kein `title` allein). Fehler je Kachel: „Nicht geladen · Erneut“.
- Techniker: Heute-Leiste nur „Einsätze heute (eigene)“ als Liste, Kennzahl „Einsätze diese Woche (eigene)“.

### 2.2 Servicefälle `/service/faelle` (T2/T3)

```
┌ Zentrale › Service › Servicefälle                                       [+ Servicefall melden] ┐
│ Servicefälle                                                         Liste | Kanban            │
├ Alle · Meine · Neu von Kunden · Reaktion überfällig 2 · Gewährleistung endet ≤ 60 Tage · Eskaliert · + ┤
├ [search Suche /] [Status ▾] [Art ▾] [Verantwortlich ▾] [+ Filter]       Status: Gemeldet ×  Zurücksetzen ┤
│☐│ Nummer   │ Kunde – Titel                 │ Status       │ Gewährleistung   │ Nächster Schritt            │Ver.│Gemeldet│⋯│
│☐│ …00031   │ Fam. Huber – Sofa Polster Naht│ ● Gemeldet   │ noch 612 Tage    │ Reaktion seit gestern       │ AB │ vor 2 T│⋯│
│☐│ …00029   │ Hotel Alpenrose – Scharnier   │ ● Gemeldet   │ noch 401 Tage    │ Prüfung · bis 05.11.        │ LK │ vor 1 T│⋯│
│☐│ …00022   │ Fam. Berg – Transportschaden  │ ● Erledigt   │ noch 690 Tage    │ Forderung stellen · 12.11.  │ LK │ 14.10. │⋯│
│ 50 von 41 · [50|100]                                                        [CSV] (Leitung, GF) [Spalten] │
└ Auswahl (3): [Zuweisen] [Priorität] [Eingangsbestätigung senden] [Drucken] [Schließen] [Mehr ▾] · Esc  ┘
```

- **Filter (eine Zeile):** Reiter-Zeile + `[Suche] [Status ▾ mehrfach] [Art ▾] [Verantwortlich ▾] [+ Filter]`; „+ Filter“: Priorität, Kanal, Kontakt, Produkt, Marke, Fehlerbereich, Fehlercode, Fristenstand, SLA-Status, Entscheidung, Regressstatus, Quelle, Zeitraum `gemeldet_am`. Suche über `kunde_name, produkt_name, marke, fehlercode, seriennummer, name, referenz_website` und Telefonnummer in jeder Schreibweise (`+43 664…`, `0664…` → normalisiert).
- **Spalten (7, einzeilig, 40/44 px):** Nummer (mono, schmal, Ellipsis vorne „…00031“, voller `name` im Peek und in der Suche) · Kunde – Titel · Status (Badge) · Gewährleistung („noch 612 Tage“ / „seit 3 Tagen abgelaufen“ / leer bei Erledigt/Geschlossen; Rechnung clientseitig aus `gewaehrleistung_bis`, nie aus gespeichertem `fristen_status`, D1) · Nächster Schritt (Server-`schritt` + Fälligkeit) · Verantwortlich (Avatar 24 px; Dichte normal „A. Berger“) · Gemeldet (relativ; absolut im Tooltip). Optional: Art, Fehlercode, Ort, Marke, Priorität, Kundentyp, Entscheidung, SLA, Regressstatus, Eskalation, Lieferant, Quelle, Kosten (permlevel 1). iPad ≤ 1180 px: Nummer · Kunde – Titel · Status · Nächster Schritt. < 768 px: Kartenliste (Titel, Status, Nächster Schritt, Fälligkeit).
- **Status-Töne:**

| App-Wert | UI-Text | Ton | Zusatz |
|---|---|---|---|
| `Gemeldet` | Gemeldet | `blau` | – |
| `Geprueft` | Geprüft | `tuerkis` | – |
| `Entscheidung` | Entschieden | `tuerkis` | bei `kulanz_freigabe_status=Angefordert`: „· wartet auf Freigabe“ (Icon `clock`) |
| `In Bearbeitung` | In Bearbeitung | `orange` | – |
| `Einsatz geplant` | Einsatz geplant | `orange` | Icon `wrench` |
| `Erledigt` | Erledigt | `gruen` | – |
| `Geschlossen` | Geschlossen | `grau` | – |
| `Abgelehnt` | Abgelehnt | `rot` | – |
| Priorität `Dringend` | Dringend | `warning-text` | Icon `arrow-up`, nie Rot |

- **Ein rotes Signal je Zeile, Rangfolge:** Reaktionsfrist verletzt > Lösungsfrist verletzt (`sla_status=Verletzt`) > Gewährleistung bei Meldung abgelaufen (§3.2) > Eskalation. Nur das höchste in `danger` (Text + `triangle-alert`), übrige neutral im Peek. Fälligkeit „Nächster Schritt“: überfällig `danger-text` + `arrow-up`, ≤ 3 Tage Sand, später `muted`.
- **Sortierung:** Standard `rang` aus `get_next_steps` je geladener Seite, serverseitige Vorsortierung `frist_reaktion` asc, `frist_loesung` asc, `gemeldet_am` desc (damit Paging stabil bleibt).
- **Reiter:** Alle · Meine (`verantwortlich = ich`, offen) · Neu von Kunden (`quelle in (portal, website)`, `erstreaktion_am` leer) · Reaktion überfällig (`status=Gemeldet`, `erstreaktion_am` leer, `frist_reaktion < heute` – dieselbe Definition wie Kennzahl, Heute-Leiste, GF-Zentrale) · Gewährleistung endet ≤ 60 Tage (`gewaehrleistung_bis <= heute + fristwarnung_tage`, offen) · Eskaliert (`max(eskalationsstufe, sla_eskalationsstufe) > 0`, offen). Vorschläge unter `+`: „Lieferant haftet, ohne Regress“, „SLA gefährdet“, „Erledigt/Geschlossen“. **Zähler nur am aktiven Reiter und an „Reaktion überfällig“** (≤ 3 Frappe-Aufrufe je Seitenaufbau: Liste, `getCount` aktiver Reiter + Reaktion überfällig als ein `get_list` mit `group_by`, `get_next_steps`); alle Zähler aus einem Aufruf erst mit Anfrage A-S15 `reiter_zaehler`.
- **Zeilenaktionen (`⋯`, Rechtsklick, `Shift+F10`):** Öffnen · In neuem Tab · Zuweisen · Status · Priorität · Kunde informieren · Einsatz planen · Reklamationsmeldung drucken · Kommentar · Aufgabe anlegen.
- **Massenaktionen (max. 6 sichtbar):**

| Aktion | Klasse (§4.1) | Server je Zeile | Vorschau |
|---|---|---|---|
| Zuweisen | umkehrbar, Undo 8 s | `set_value verantwortlich` | – |
| Priorität | umkehrbar, Undo 8 s | `set_value prioritaet` (SLA-Fristen rechnet der Server neu; Verlauf „SLA“) | – |
| Eingangsbestätigung senden | Vorlagen-Mail, verzögert 8 s | `kunde_informieren("eingang")` | „5 von 7 möglich – 2 ohne E-Mail“ |
| Drucken Reklamationsmeldung | – | Sammeldruck, max. 50 | – |
| Schließen | verzögerter Commit 8 s | `apply_workflow("Schließen")` | „8 von 12 schließbar – 2 Abschluss nicht mitgeteilt · 2 Lieferantenschritt offen“ (§3.4 D-3) |
| CSV | – | Liste mit Filter | nur mit `export` |

  Zeilen eines verzögerten Massenvorgangs: optimistisch grau 60 % Deckkraft, Toast „10 Fälle werden geschlossen · Rückgängig“, danach Fortschritt „7/10“, Ergebnis „9 geschlossen · 1 nicht: <Servertext> · Anzeigen“. Konflikt (Kollegin ändert innerhalb der 8 s): „Nicht geschlossen – Anna hat den Fall um 14:02 geändert · Anzeigen“.
- **Kanban:** Spalten Gemeldet · Geprüft · Entschieden · In Bearbeitung (Kennzeichen „Einsatz Do 07.11.“ statt eigener Spalte) · Erledigt (Spalte eingeklappt 48 px, aufklappbar); Abgelehnt/Geschlossen über Filter. Karte: Nummer + Gewährleistungs-Punkt · Kunde – Titel (2 Zeilen) · Fehlercode `muted` · nächster Schritt + Avatar · „ruht seit 4 Tagen“ (Icon `clock` + Text) ab `eskalation_tage − 1`. Drag = Workflow-Aktion; fehlt die Bedingung, öffnet der Drop das passende Sheet (S2, S5). Nicht erlaubtes Ziel: während des Ziehens Spaltenkopf-Text „Kein Übergang“ (`muted`, 12 px); Ablage → Rückfeder `--bo-dur-move` + Toast `role="status"` „Von ‚Gemeldet‘ nach ‚Erledigt‘ gibt es keinen Übergang – zuerst prüfen und entscheiden.“ Erlaubte Ziele: 2 px gestrichelt `accent` + `accent-soft` (≥ 3:1, N14). Keine Mehrfachauswahl im Service-Kanban (Masse nur über Liste). Techniker: kein Drag, Kopfhinweis „Nur lesen“.
- **Side-Peek (480 px):** Kopf, Fristband kompakt, nächster Schritt mit Knopf, Fehlercode, Ort, Kennzeichen, letzte 5 Verlaufszeilen; `↑↓` blättert, `Esc` schließt; gelöschter Fall → `not_found`-Text im Peek, Zeile verschwindet.
- **Zustände:** Laden 8 Skeleton-Zeilen; nie Daten wie §2.1; Filter leer „Keine Servicefälle mit <Filtertext>.“ [Filter zurücksetzen]; Meine leer „Alles erledigt – keine offenen Fälle für dich.“; Reaktion überfällig leer „Keine Reaktion überfällig.“ (Icon `check` Sand); Kanban-Spalte leer „–“; Fehler im Zeilenbereich mit „Erneut“, Werkzeugleiste bleibt.

### 2.3 Servicefall melden (S1)

Zwei Wege: **S1-Schnell** (Sheet 640 px rechts, `--bo-dur-move` `--bo-ease-out`) ist Standard für `N V`, „Servicefall melden“ und Palette; **S1-Vollständig** (`/service/faelle/neu`, 4 Schritte) über Link „Vollständig erfassen“ (übernimmt Eingaben) und automatisch bei `?aus=` (Wareneingang, Abnahme, Montage, Lieferschein, Produktpass, Projekt).

#### 2.3.1 S1-Schnell

```
┌ Servicefall melden                                          Vollständig erfassen ›   [x] ┐
│ Kontakt*  [search Huber                       ] [+ neu]  → Fam. Huber, Lochau · Verbraucher│
│ Art       [Mangel] [Transportschaden] [Montagefehler] [Weitere ▾]                          │
│ Bezug     ○ LS-2026-00088 Sofa Modell X · Pos. 2 · 14.03.26  ○ RE-2026-00040  ● ohne Bezug  │
│ Fehler*   [search naht                                                        ]            │
│           POLSTER  ● POL-01 Nahtriss                                                       │
│                      POL-03 Sitzspiegel / Faltenbildung                                    │
│                      POL-99 Sonstiges (Polster)                                            │
│           Standardlösung: Nachnähen durch Polsterei …                                      │
│ Beschreibung* [Naht linke Armlehne offen, seit ca. 2 Wochen                             ] │
│ Kanal     [Telefon ▾]   Kunde gilt als kontaktiert (Telefon)                               │
│           [ ] Eingangsbestätigung senden  (ohne E-Mail ausgeblendet, Text „keine E-Mail“)  │
│ ▸ Weitere Angaben (Stelle, seit wann, Kundenwunsch, Fotos, Seriennummer, Sache, Priorität, │
│                    Mahnsperre)                                                             │
│ Gewährleistung: rechtzeitig gemeldet · bis 14.03.2028 · Vermutung bis 14.03.2027           │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│                                      [Anlegen und öffnen]   [Anlegen  Strg↵]               │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Feld | Frappe | Verhalten |
|---|---|---|
| Kontakt* | `kontakt` | Suche ab 2 Zeichen (Name, Telefon normalisiert, E-Mail); Enter wählt ersten Treffer; 0 Treffer: „Kein Kontakt zu ‚Hubr‘.“ [+ Als neuen Kontakt anlegen] (Name vorbelegt, Kontakt-Sheet gestapelt, neuer Kontakt als **Interessent**); füllt `kundentyp`, `kunde_email`, `kunde_telefon`, `sprache`, Einsatzadresse |
| Art | `art` | Chips Mangel · Transportschaden · Montagefehler + „Weitere ▾“ (Garantie, Kulanz, Pflegefrage, Serviceauftrag) + zwei **Weiterleitungen**, die keinen Servicefall anlegen (P-R6): „Rückgabe ohne Mangel (Widerruf)“ → Satz „Widerruf läuft über die Bestellung.“ [Zur Bestellung] (Shop/Faktura); „Falsche Ware / fehlt etwas“ → Satz „Falschlieferung und Fehlmenge sind kein Mangel – Nachlieferung über Logistik.“ [Nachlieferung anlegen] (Logistik) · [Trotzdem als Servicefall] (sekundär, z. B. wenn zusätzlich beschädigt) |
| Bezug | `lieferschein`/`rechnung`/`produktpass`/`bestellung`/`projekt`/`auftrag` | 5 jüngste Belege des Kontakts als Radio; Position anzeigen, wenn vorhanden („Pos. 2“, Speicherung der Position erst mit Anfrage A-S16 `beleg_position`); keine Belege: „Keine Belege zu Fam. Huber – ohne Bezug weiter.“ (ohne Bezug vorgewählt) |
| Fehler* | `fehlerbereich` + `fehlercode` | **eine Combobox** (03 §8.3): Suche über Code, Bezeichnung, Bereich, typische Ursache; Treffer gruppiert nach Bereich mit 8-px-Bereichspunkt (Ring `line-control`); leer: Chips der 6 zuletzt im Team genutzten Codes + „Alle Bereiche ▾“ (Baum). Jeder Bereich hat `<BER>-99 Sonstiges` (Seed). Unter der Wahl Standardlösung (Opacity `--bo-dur-fast`) |
| Beschreibung* | `beschreibung` | 3 Zeilen, wächst bis 8 |
| Kanal | `kanal` | Standard Telefon. Bei Telefon/Showroom und `telefon_ist_erstreaktion = 1`: Textzeile „Kunde gilt als kontaktiert (Telefon)“ bzw. „(vor Ort)“. Bei Einstellung 0: Schalter „Kunde kontaktiert (Telefonat jetzt)“ → nach `insert` `erstreaktion_erfassen("Telefon")` |
| Eingangsbestätigung | `kunde_informieren("eingang")` | nur mit `kunde_email`; Vorlagen-Mail, verzögert 8 s |
| Weitere Angaben | `ort_am_stueck`, `erstauftreten`, `reproduzierbar`, `kundenwunsch`, `fotos`, `seriennummer`, `menge`, `produkt_name`, `sachart` (Segment „beweglich · fest eingebaut“, Tooltip „Fest eingebaut (z. B. eingemauert) – Gewährleistung 3 Jahre, Abgrenzung Kanzlei“), `prioritaet`, `verantwortlich`, **Mahnsperre** (Schalter, nur mit Bezug Rechnung und Art Mangel/Montagefehler/Transportschaden; Standard laut Inhaber-Frage I2, bis Entscheidung aus) | eingeklappt gemerkt je Benutzer; Fotos per Ablage/Kamera, Upload setzt `quelle = Kunde`, `an_lieferant = 0` |
| Gewährleistungszeile | Client-Vorschau §3.2 | eine Zeile; ohne Übergabe/Kaufdatum: „Gewährleistung erscheint mit Bezug oder Übergabedatum“; Unternehmer: Datumsfelder offen + Hinweis „Mängelrüge des Kunden (§ 377 UGB) prüfen“; Bezug nicht übergeben (Projekt/Auftrag ohne Übergabe): „Übergabe steht aus – Frist beginnt erst mit Übergabe“ (grau) und Art-Vorschlag „Montagefehler/Nacharbeit vor Übergabe“ |

- **Anlegen** (`Strg+Enter`): `insert` (`quelle = backoffice`) → optional `erstreaktion_erfassen` → optional Mahnsperre (Faktura `set_value PH Rechnung mahnsperre=1, mahnsperre_grund="Servicefall PH-SRV-…"`) → optional Eingangsbestätigung (verzögert). Toast „PH-SRV-2026-00032 angelegt · Reaktion bis 06.11. · Öffnen“ (ein Knopf); Sheet leert sich, Fokus Kontakt. Teilfehler nach §4.5.
- **Fehler:** Pflichtfeld leer → Feld rot + Text darunter, Fokus springt, kein Toast. Server `invalid` → Text am Feld. Verbindung weg → Sheet bleibt, Toast „Nicht gespeichert – Verbindung unterbrochen · Erneut“.
- **Entwurf:** alle 2 s in IndexedDB; beim nächsten Öffnen Band „Entwurf von 09:12 (Fam. Huber) wiederherstellen? [Wiederherstellen] [Verwerfen]“. **Esc schließt ohne Rückfrage** (Entwurf bleibt). Sitzungsablauf → Login-Overlay, Eingaben bleiben.
- Höhe: ohne Scroll bei 1366 × 768 mit eingeklappten „Weitere Angaben“.

#### 2.3.2 S1-Vollständig (`/service/faelle/neu`, 4 Schritte)

Schritte ① Kunde & Bezug · ② Mangel · ③ Fristen (nur wenn nötig) · ④ Prüfen & anlegen. Rechte Spalte: Kunde, Bezug, Gewährleistungs-Vorschau, Hinweis aus dem Fehlerkatalog.

| Schritt | Felder | Verhalten |
|---|---|---|
| ① | `kontakt`, `kundentyp`, `kunde_email`, `kunde_telefon`, `sprache`, Einsatzadresse; Bezugsvorschläge (je Art 5: Lieferschein, Rechnung, Produktpass, Bestellung, Projekt, Auftrag) | Wahl übernimmt `produkt`, `marke`, `lieferant`, `kaufdatum`, `uebergabe_datum` (Server `_bezug_uebernehmen`); `kanal` |
| ② | `art` (wie S1-Schnell inkl. Weiterleitungen), Fehler-Combobox, `ort_am_stueck`, `erstauftreten`, `reproduzierbar`, `beschreibung`*, `kundenwunsch`, `seriennummer`, `menge`, `produkt_name`, Fotos (`bild`, `hinweis`, `quelle`, `an_lieferant` Standard aus) | Art Transportschaden/Pflegefrage setzt Bereich (Server) |
| ③ | `kaufdatum`, `uebergabe_datum`, `sachart`, `garantie_monate`, `garantie_bedingungen`, `lieferung_an_haendler` | nur wenn Übergabe **und** Kauf leer, oder Unternehmer; Fristband live |
| ④ | Zusammenfassung, `prioritaet`, `verantwortlich` (ich), Mahnsperre, Eingangsbestätigung | Fuß: Folgen in einem Satz („legt 1 Servicefall an, Reaktion bis 06.11., setzt Mahnsperre auf RE-2026-00040, sendet 1 Eingangsbestätigung“); Ergebniskarte mit Teilschritten, „Akte öffnen“, „Prüfen & entscheiden“, „Nächster Fall“ |

Kürzel: Enter weiter (außer mehrzeilig), `Strg+Enter` anlegen im letzten Schritt, Esc → Inline-Frage ab Schritt 2 („Verwerfen? [Verwerfen] [Weiter bearbeiten]“). Pflicht fehlt → Schrittleiste mit Fehlerpunkt + „1 Angabe fehlt“.


### 2.4 Einsätze `/service/einsaetze` (T4 Kalender, T3 Kanban, T2 Liste)

```
┌ Zentrale › Service › Einsätze                                             [+ Einsatz planen] ┐
│ Einsätze           Woche | Tag | Monat | Kanban | Liste     ‹ KW 45 · 03.–09.11.2026 ›  [Heute]│
├ Techniker: [Alle][T. Steiner][M. Keller] · Art ▾ · Status ▾ · ☐ Nur meine                     ┤
│             Mo 03.        Di 04.          Mi 05.         Do 06.        Fr 07.                  │
│ T. Steiner  ┌Huber Lochau┐               ┌Berg Hard ───────────┐                               │
│ 08–17       │Reparatur   │               │Austausch             │                               │
│             │● Bestätigt │               │○ Geplant             │                               │
│             └────────────┘               │neu – Kunde informieren│                              │
│ M. Keller   ┌Muster Dornbirn · Wartung Whirlpool┐                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Raster:** Ressourcen-Zeitleiste horizontal (je Techniker eine Zeile, Tage × Stunden), von `techniker_tag_von` bis `techniker_tag_bis`, Zellen 30 min, Puffer `einsatz_puffer_min` als schraffierter Rand vor/nach Einsätzen. Techniker = Benutzer mit Rolle PH Techniker + alle in Einsätzen vorkommenden. Karte: Kunde/Ort, Art, Status-Punkt + Text, Kennzeichen „unbestätigt“ (`bestaetigt_kunde_am` leer, Datum ≤ 2 Tage) bzw. „neu – Kunde informieren“ (`umgeplant_am` gesetzt, `bestaetigt_kunde_am` leer).
- **Umplanen (N8, [jetzt]):** Drag oder `M` (Dialog: Datum, Von, Bis, Techniker, Grund optional mit Chips „Kunde verschiebt“, „Teil fehlt“, „Techniker krank“). Karte sofort am neuen Platz, Badge „Geplant“ + Kennzeichen „neu – Kunde informieren“ (`warning-soft`); **verzögerter Commit 8 s** → `umplanen(datum, zeit_von, zeit_bis, techniker, grund)`; Toast „Termin auf Do 06.11. 10:00 verschoben · Rückgängig“ (eine Aktion). `Z` innerhalb 8 s → kein Aufruf, Bestätigung bleibt. Danach Primär der Einsatz-Akte und Zeile in „Jetzt dran“ = „Terminvorschlag senden“. **Nicht ziehbar:** Unterwegs, In Arbeit, Erledigt, Nicht angetroffen, Abgebrochen (Cursor normal, Fokus-Hinweis „Läuft – Verschieben nicht möglich“; `M` zeigt denselben Satz). Überschneidung desselben Technikers: Ablage erlaubt, Karten halbiert, Kennzeichen „Überschneidung“ (Text).
- **Einsatz absagen ([jetzt]):** `⋯` für alle mit Schreibrecht, Dialog rot sm, Grund Pflicht, Satz „Kalendertermin wird storniert. Fall geht zurück in Bearbeitung, wenn kein Einsatz mehr offen ist.“ → `abbrechen(grund)`; kein Undo.
- Optional einblendbar: Montagen (`PH Montageauftrag`) und Touren (`PH Tour`) als graue Hintergrundblöcke; Feld `tour` am Einsatz setzbar.
- **Kanban:** Geplant · Bestätigt · Unterwegs · In Arbeit · Nicht angetroffen. Geplant → Bestätigt = `bestaetigen()`; → Nicht angetroffen = Dialog sm „Hinweis*“ → `nicht_angetroffen(hinweis)`; Unterwegs/In Arbeit sind keine Ablageziele (Kopf „Kein Übergang“, Toast „Unterwegs und In Arbeit meldet der Techniker. Im Notfall: Einsatz öffnen → ⋯ → Status im Namen des Technikers setzen.“).
- **Liste:** Titel · Datum/Zeit · Techniker · Art · Status · Ergebnis · Fall/Vertrag · Ort; Reiter Meine · Unbestätigt · Folgeeinsatz nötig. Massenaktionen: Techniker ändern (je Zeile `umplanen`, verzögert 8 s; laufende Einsätze übersprungen, Vorschau „4 von 5 möglich“) · Tag verschieben (+n Tage, Vorschau, verzögert 8 s) · Kalendertermine anlegen (`termin_anlegen`, nur ohne `termin`) · Servicebericht drucken.
- iPad hoch (≤ 820 px): Standard „Tag“; „Woche“ als Liste nach Tag.
- **Zustände:** „Keine Einsätze in dieser Woche.“ (Leiste über dem Raster, Raster bleibt, Zelle plant); Kanban leer „Keine offenen Einsätze.“ [Einsatz planen]; Reiter leer „Keine Einsätze für dich diese Woche.“ · „Alle Einsätze sind bestätigt.“ · „Kein Folgeeinsatz offen.“; ohne Techniker-Benutzer: „Noch kein Techniker. Techniker sind Benutzer mit der Rolle PH Techniker.“ [Rolle vergeben] (Leitung, Link Benutzer) bzw. „Leitung bitten“; Fehler: Band „Einsätze nicht geladen · Erneut“.

#### 2.4.1 A14 Einsatz planen (Vollseite `/service/einsaetze/neu?fall=<name>`, N18)

Krümel „Servicefälle › PH-SRV-… › Einsatz planen“; Esc → Inline-Frage. Drei Schritte:

| Schritt | Inhalt | Daten |
|---|---|---|
| ① Techniker & Zeit | ab 1024 px Raster volle Breite (wie §2.4) mit freien Fenstern aus `get_technician_slots(datum, dauer_min, techniker)` je Tag der Woche (ein Aufruf je Tag, parallel); iPad hoch: Liste je Techniker („Do 06.11. 10:00–12:00 frei“). Dauer-Chips 60 · 120 · 240 min (vorbelegt Besichtigung 60, sonst 120 – änderbar). Art Segment Besichtigung · Reparatur · Austausch · Nacharbeit · Wartung · Pflege (vorbelegt Reparatur). Zeilen „Anfahrt“ und „2. Techniker“ eingeklappt | `datum`, `zeit_von`, `zeit_bis`, `techniker`, `art` |
| ② Mitnehmen | Ersatzteilzeilen des Falls (Eingetroffen/Aus Bestand) als Checkliste → `mitzubringen`; Prüfhinweis → `hinweis_intern`; „Weiter ohne Änderungen“; ohne Teile: „Keine Ersatzteile am Fall – Freitext möglich.“ | `mitzubringen`, `hinweis_intern` |
| ③ Kunde & Zusammenfassung | Schalter „Terminvorschlag senden“ (Vorlage `termin`, Link „ansehen“), „Kalendertermin für Techniker“. **Kostenhinweis (R-11):** wenn Gewährleistung bei Meldung abgelaufen, Art Serviceauftrag/Pflegefrage oder `kundenwunsch = Beratung` → Pflichtschalter „Kunde über Kosten informiert (Anfahrt/Stunde)“ + Kanal (Telefon/E-Mail/Persönlich) → Kommentar „Kostenhinweis: Telefon 04.11. (Anna)“ (Feld `kosten_hinweis_am` mit Anfrage A-S8). **Ausland (R-W3):** `einsatz_land ≠ Österreich` → Hinweis „Einsatz im Ausland: Leistungsort, USt und Zoll für mitgenommene Teile prüfen (Steuerberatung). Freigabe Leitung nötig.“; Mitarbeiter: Knopf wird „Leitung um Freigabe bitten“ (PH Aufgabe) | Folgen-Satz („legt 1 Einsatz an, setzt Fall auf Einsatz geplant, sendet 1 Terminvorschlag“) |

Ausführung (Server Action, je Teilschritt eigener `idempotency_key`): (1) `einsatz_anlegen(datum, zeit_von, zeit_bis, techniker, hinweis, art)` (2) `set_value mitzubringen, anfahrt_km, anfahrt_min, techniker_2, hinweis_intern, tour` (3) optional `kunde_informieren("termin")` (4) optional `termin_anlegen()` (5) optional Kommentar Kostenhinweis. Ergebniskarte ✓/✗/– je Teilschritt (§4.5). Alle abwesend: „Diese Woche ist kein Techniker verfügbar.“ [Nächste Woche ›].

### 2.5 Einsatz-Akte `/service/einsaetze/[name]` (T5)

- **Kopf:** `titel` · Status-Badge · Phasen Geplant → Bestätigt → Unterwegs → In Arbeit → Erledigt (Nebenausgänge als Badge). **Primär (Backoffice):** Geplant ohne `umgeplant_am` → „Kunde hat bestätigt“ (`bestaetigen`) · Geplant mit `umgeplant_am` → „Terminvorschlag senden“ (`kunde_informieren("termin")` am Fall) · Bestätigt/Unterwegs/In Arbeit → kein Primär, Zeile „Läuft am 07.11. mit T. Steiner“ · Erledigt → „Servicebericht PDF“ (sekundär „Bericht an Kunden senden“ = `bericht_senden()`, wenn `bericht_gesendet_am` leer und E-Mail vorhanden) · Nicht angetroffen → „Folgeeinsatz planen“ (A14).
- `⋯`: Umplanen (`M`) · Einsatz absagen · Kalendertermin anlegen · Folgeeinsatz anlegen · Route · Servicebericht PDF · Fall öffnen · „Status im Namen von T. Steiner setzen“ (Dialog sm „Wird im Verlauf vermerkt.“).
- **Tabs:** Einsatz (Termin, Techniker, Adresse, Anfahrt, `hinweis_intern`, `mitzubringen`) · Durchführung (Ankunft/Abfahrt, `zeit_arbeit_min`, `zeit_pause_min`, `zeit_abrechenbar_min` als „abgerechnet 2 h 15 min (Takt aus Einstellungen)“, Ergebnis, Bericht, Ersatzteile, Fotos vorher/während/nachher) · Abschluss (`unterschrift_art`, Unterschrift/Name, Zufriedenheit; Kosten nur permlevel 1). Leer: „Erscheint, sobald der Techniker den Einsatz startet.“; Fotos leer „Noch keine Fotos.“ [Foto hinzufügen].
- Rechte Spalte: Fall (Gewährleistungs-Punkt, Fehlercode), Pflege-Abo, Kalendertermin, Tour, Folgeeinsatz; Zeitleiste.

### 2.6 Ersatzteile `/service/ersatzteile` (T2) und `/[name]` (T5)

```
┌ Zentrale › Service › Ersatzteile                                  [+ Ersatzteil] [Bewegung buchen] ┐
│ Ansicht: [Teile] [Bestellungen]                                                                    │
│ Reiter: Alle · Unter Mindestbestand 4 · Reserviert · Auslaufend · Ohne Bestandsführung             │
│☐│ Bezeichnung · Hersteller-Nr. │ Marke  │ Bestand │Reserv.│ Verfügbar         │Mindest│ Lagerplatz │⋯│
│☐│ Scharnier 110° · 71B355      │ Blum   │    12   │   2   │ 10                │   6   │ R2-F3      │ │
│☐│ Lampe LED 2700K · 8812-W     │ Occhio │     1   │   1   │ 0 unter Mindest   │   2   │ R1-F1      │ │
└ Auswahl (2): [Beim Hersteller bestellen] [Etikett 62×29] [Inventur zählen]                         ┘
```

- Felder `PH Ersatzteil`: `bezeichnung`, `hersteller_nr`, `marke`, `lieferant`, `produkt`, `kategorie`, `bestand`, `reserviert`, `verfuegbar`, `mindestbestand`, `lagerort`, `lagerplatz`, `einheit`, `vk_cent`, `lieferzeit_tage`, `bild`; `ek_cent` permlevel 1.
- **Abgrenzung Verkaufsware (B-06):** Teile mit `produkt` gesetzt oder Kategorie „Pflegemittel“ führen hier **keinen** Bestand (Kennzeichen „Bestand in Logistik“, Link Lagerbestand); Bestandsbuchungen dafür ausgeblendet (Inhaber-Frage I3; serverseitige Erzwingung A-S11).
- **Bewegung buchen** (Dialog md): Art Zugang · Verbrauch · Inventur (Zählwert) **[jetzt]**; „Rücksendung an Lieferant (−)“, „Schwund/Bruch (−)“, „Rückgabe vom Kunden (+)“ **[Anfrage A-S11]** (bis dahin über Inventur mit Pflicht-Hinweis „Grund: Rücksendung …“). Menge Stepper 44 px, Hinweis, Bezug. Fehler „Bestand … würde negativ“ → Feldfehler Menge.
- Akte: Bild 64 px, Bestandskarte, Tabs Stammdaten · Bewegungen · Verwendung. `⋯`: Beim Hersteller bestellen, Etikett 62×29.
- Scanner: Enter im Suchfeld mit exakter `hersteller_nr` öffnet das Teil.
- Massenaktion „Beim Hersteller bestellen“: je Lieferant eine Bestellung (Menge = `mindestbestand − verfuegbar`, min. 1), Vorschau mit editierbaren Mengen.
- Report „Ersatzteile zum Stichtag (Menge × EK)“ **[Anfrage A-S11]**; bis dahin CSV der Liste mit EK (Leitung).
- Leer: „Noch keine Ersatzteile. Ersatzteile entstehen aus Servicefällen oder hier.“ [Ersatzteil anlegen]; Unter Mindestbestand leer „Alle Teile über Mindestbestand.“

### 2.7 Ersatzteilbestellungen (`?ansicht=bestellungen`, Akte `/service/ersatzteile/bestellungen/[name]`)

- Kanban Entwurf · Gesendet · Bestätigt · Teilgeliefert; Karte Lieferant, Positionen, Kommission, „überfällig seit 2 Tagen“ (`danger-text`). Liste: Titel · Lieferant · Status · Fall · Datum · Erwartet · AB-Referenz · (Summe EK, permlevel 1); Reiter Offen · Erwartet (Inline-Knopf „Wareneingang buchen“, `Strg+Enter`) · Überfällig · Für Lager.
- **Primär je Status:** Entwurf → „Per E-Mail senden“ (`senden(empfaenger, text)`, Dialog mit Vorschau + PDF) · sekundär „Als gesendet markieren“ (`als_gesendet(bestellweg, referenz)`) · Gesendet → „AB erhalten“ (`bestaetigen(referenz, erwartet_am)`) · Bestätigt/Teilgeliefert → „Wareneingang buchen“ (S6).
- **Stornieren (D9):** nur bis Status Bestätigt im `⋯` (Dialog rot, Grund Pflicht, Satz „Fall-Zeilen gehen zurück auf Benötigt“); ab Teilgeliefert ausgeblendet mit Satz „Teilweise geliefert – Reststorno beim Lieferanten anfragen“ (Methode `rest_stornieren` A-S11); Geliefert: kein Storno.
- **S6 Wareneingang** (Dialog md): je Position „Jetzt erhalten“ vorbelegt mit Rest, „Alles“, Scanner +1 → `wareneingang(mengen)`; Satz „Teile für Servicefall – kein Lagerzugang“ bei Kommission; Überlauf „Position bereits vollständig“ (kein Shake); fremder Scan „71B355 ist nicht in dieser Bestellung.“; Toast „Wareneingang gebucht · Fall PH-SRV-… Ersatzteile eingetroffen · Öffnen“.
- Leer: „Noch keine Ersatzteilbestellungen. Sie entstehen aus Servicefällen oder aus der Ersatzteilliste.“; Überfällig leer „Keine Lieferung überfällig.“; Entwurf ohne Position „Noch keine Position.“ [Ersatzteil hinzufügen].

### 2.8 Lieferantenregress `/service/regress` (T2/T3) und `/[name]` (T5)

```
┌ Zentrale › Service › Regress                                                                     ┐
│ Reiter: Offen · Frist ≤ 14 Tage 2 · Gemeldet · Anerkannt · Unterdeckung · Verrechnet · Abgelehnt │
│☐│ Regress    │ Fall · Kunde          │ Lieferant │ Status     │ Gefordert │ Erhalten │ Abgleich      │ Regressfrist        │
│☐│ …REG-00007 │ …SRV-00022 · Fam. Berg│ Z GmbH    │ ● Gemeldet │  420,00 € │    –     │ –             │ 12.11. · in 8 Tagen │
│☐│ …REG-00005 │ …SRV-00011 · Hotel A. │ Y AG      │ ● Anerkannt│1.200,00 € │ 900,00 € │ ● Unterdeckung│ gewahrt (anerkannt) │
└ Auswahl (2): [Lieferant erinnern] [CSV]                                                          ┘
```

- **Felder:** `servicefall`, `lieferant`, `marke`, `status`, `gemeldet_am`, `lieferant_referenz`, `frist_bis`, `frist_hinweis`, `betrag_gefordert_cent`, `betrag_anerkannt_cent`, `betrag_erhalten_cent`, `gutschrift_datum`, `abgleich_status`, `differenz_cent`, `quote_promille`, `ausgebucht_grund`, `form`, `gutschrift_nummer`, `gutschrift_beleg`, `eingangsrechnung`, `verrechnet_am`, `beschreibung`, `antwort_lieferant`, `ablehnungsgrund`, `letzte_erinnerung`; `notiz_intern` permlevel 1.
- **Regressfrist (R-03, Übergangsregel [jetzt]):** Spalte zeigt `frist_bis` (entsteht mit `erledigt_am`; vorher „beginnt mit Erledigung“). Ampel `danger-text` ≤ 14 Tage, solange Status **Offen oder Gemeldet** – „Gemeldet“ gilt **nicht** als gewahrt. Text bei Gemeldet: „Gemeldet 20.11. – Frist gewahrt erst mit Anerkenntnis oder Klage · bis 12.01.“; ab Anerkannt/Verrechnet: „gewahrt (anerkannt)“ `success-text`. Kein § 933b bei Unternehmerkunde (`kundentyp = Unternehmer` am Fall) oder Entscheidung Kulanz: „Kein § 933b – Vertragsansprüche gegen den Lieferanten prüfen“ (Ampel neutral). Felder Rechtsgrundlage, schriftliches Anerkenntnis mit Beleg, Verjährungsverzicht, Klage eingebracht **[Anfrage A-S4]**; dann Knopf „Anerkenntnis erfassen“ (Dialog: Datum*, Beleg* Upload) und Ampel aus diesen Feldern. Wortlaut Kanzlei (K3).
- **Primär je Status:** Offen → „Forderung stellen“ (S4b, §4.4) · Gemeldet → „Gutschrift erfassen“; sekundär „Regress anerkannt“ (Dialog `betrag_anerkannt_cent`*, `form`, `antwort_lieferant`) und „Regress abgelehnt“ (Dialog `ablehnungsgrund`*, `antwort_lieferant`) · Anerkannt → **„Gutschrift erfassen“** (Dialog md: Betrag* vorbelegt mit anerkannt − erhalten, Nummer, Datum*, Beleg-Upload oder Link Eingangsrechnung; Satz „Erwartet 420,00 € · Toleranz 1,00 €“ aus `regress_toleranz_cent`) → `gutschrift_erfassen(...)`; Workflow-Knopf „Regress verrechnet“ erscheint **nur** bei `form in (Ersatzlieferung kostenlos, Reparatur durch Hersteller)` (B-05) · Verrechnet/Abgelehnt → kein Primär; Leitung `⋯` „Wieder öffnen“ (Abgelehnt).
- **Abgleich (N19):** Ausgeglichen `gruen` · Unterdeckung `orange` + Banner „Es fehlen 20,00 € gegenüber anerkannt“ [Differenz ausbuchen] (Leitung, Dialog rot, Grund Pflicht, kein Undo → `differenz_ausbuchen(grund)`) · Überdeckung `orange` „12,00 € mehr erhalten – prüfen“ · Ausgebucht `grau` · Offen `grau`. Akte-Karte „Soll 1.200,00 € · Ist 900,00 € · fehlt 300,00 €“.
- **Steuerliche Art (B-04):** Select Entgeltminderung Einkauf · Schadenersatz · Ersatzlieferung + Vorsteuerkorrektur **[Anfrage A-S12]**, Zuordnung durch Steuerberatung (S1); bis dahin CSV-Spalten Form, Gefordert, Anerkannt, Erhalten, Differenz, Gutschriftnummer, Eingangsrechnung.
- **Währung (R-W2):** `waehrung`/`kurs` **[Anfrage A-S13]**; bis dahin Hinweis „Regress führt EUR – Beträge in Lieferantenwährung umrechnen und im Kommentar festhalten“.
- `⋯`: Lieferant erinnern (`erinnern(empfaenger)`, Vorlagen-Mail verzögert 8 s), Reklamationsmeldung PDF, Fall öffnen.
- **Buchhaltung extern:** Liste und Akte lesen, CSV; rechte Spalte nur aus Regress-Feldern (diese Rolle hat kein Fall-Leserecht, F9) – Fallnummer als Text ohne Link.
- Kanban Offen · Gemeldet · Anerkannt; Drag = Workflow mit Pflichtdialog.
- Leer: „Noch kein Regress. Regress entsteht mit der Mängelanzeige oder Forderung am Fall.“ (kein Anlegen-Knopf); Frist ≤ 14 Tage leer „Keine Regressfristen in den nächsten 14 Tagen.“; Unterdeckung leer „Keine offenen Differenzen.“

### 2.9 Verträge › Pflege und Wartung (`?art=pflege`, Akte `/service/vertraege/pflege/[name]`)

- Liste nach `naechster_termin`: Titel · Art · Bereich · Kunde · Nächste Wartung (`danger-text` wenn `ueberfaellig`, Sand ≤ `erinnerung_tage_vorher`) · Letzte Wartung · Status · Techniker · Nachkauf-Einwilligung. Reiter Aktiv · Fällig · Überfällig · Angefragt/Angeboten · Pausiert/Gekündigt.
- Akte: Primär „Nächsten Termin planen“ (`einsatz_planen(datum, zeit_von, zeit_bis, techniker)` über das A14-Raster); Phasen Angefragt → Angeboten → Aktiv (⇄ Pausiert) → Gekündigt → Beendet. Tabs **Vertrag** (Art, Bereich, Objekt, Intervall, Beginn, nächster Termin, Stücke, Leistungen, Vorschau `geplante_termine(6)`) · **Konditionen** (`preis_cent` – 0 = „auf Anfrage“, `abrechnung`, Mindestlaufzeit, Laufzeit, Kündigungsfrist, `bedingungen_version`, Angebot/Rechnung) · **Einwilligung** · **Protokolle** · **Herkunft & Portal**.
- **Einwilligung (R-05, [jetzt]):** „Widerruf erfassen“ → Dialog sm „Nachkauf-Erinnerung widerrufen? Ab sofort keine Produkthinweise mehr an Fam. Huber. Terminerinnerungen laufen weiter.“ Primär „Widerruf erfassen“ → `set_value nachkauf_einwilligung = 0` (Controller setzt `nachkauf_widerrufen_am`); kein Undo. Die Felder sind nie als Häkchen editierbar. **Einwilligung erfassen** (Leitung, Dialog md): Textversion*, Nachweis* (Upload unterschriebenes Formular oder Verweis Portal-Bestätigung), Quelle; Ausführung `set_value nachkauf_einwilligung = 1, nachkauf_textversion` + Kommentar mit Nachweis-Link; Methode `einwilligung_erfassen` und read-only-Felder **[Anfrage A-S17]**. Satz im Dialog: „Der frühere Widerruf bleibt im Verlauf sichtbar.“
- **Vertragsabschluss (R-09, R-10):** Workflow „Aktivieren“ bei Verbraucher öffnet Dialog „Vertrag aktivieren“: Abschlussweg* Segment Geschäftsraum · Fernabsatz · Außerhalb Geschäftsraum; bei nicht Geschäftsraum Pflicht-Haken „Belehrung über das Rücktrittsrecht übergeben“ + Version, optional „Kunde verlangt Beginn vor Ablauf der Rücktrittsfrist“ (Zeitpunkt). Speicherung als Kommentar mit festem Text, bis Felder `abschlussweg`, `belehrung_am/_version`, `vorzeitiger_beginn_zustimmung_am`, `ruecktritt_am` existieren **[Anfrage A-S17]**; dann sperrt A14 einen ersten Einsatz vor Rücktrittsende ohne Zustimmung. Konditionen: bei Verbraucher und Mindestlaufzeit über 12 Monaten Hinweis `warning-text` „Laufzeit und Kündigung mit der Kanzlei prüfen (§ 15 KSchG)“ – keine eigene Zahl. Texte Kanzlei (K5, K6).
- **Abrechnung (P-R7):** „Abrechnen“ je Termin/Jahr über Faktura **[Anfrage A-S8 `rechnung_erstellen`]**; bis dahin Zeile in Konditionen „Rechnung in Faktura erstellen“ (Link `/faktura/rechnungen/neu?kontakt=…&bezug=PH Pflege Abo:<name>` – Parameter mit Faktura abstimmen).
- `⋯`: Erinnerung senden (`erinnerung_senden`), Protokoll erfassen (S7), Pflegeprotokoll PDF. Bereichswechsel Whirlpool/Sauna/Pool-Technik setzt Intervall-Vorschlag (`pflege_logik.standard_intervall`).
- Kopfhinweis (max. einer): „Wartung überfällig seit …“ · „Preis auf Anfrage“ · „Aktivieren erst mit Intervall und Bedingungsversion“. Ohne E-Mail: Kennzeichen „ohne E-Mail – Erinnerung als Anruf“.
- Leer: „Noch keine Pflege- oder Wartungsverträge.“ [Vertrag anlegen]; Überfällig leer „Keine Wartung überfällig.“; Protokolle leer „Noch kein Protokoll. Es entsteht mit dem ersten abgeschlossenen Wartungseinsatz.“ [Protokoll erfassen].

### 2.10 Verträge › Serviceaufträge (`?art=auftraege`, Akte `/service/vertraege/auftraege/[name]`)

- Kanban Angefragt · Angeboten · Beauftragt · Abgeholt · Eingelagert · In Arbeit · Zurückgebracht; Karte Art-Chip, Kunde, Stücke, Abholung, Lagerort.
- Akte Tabs Auftrag · Übernahmeliste (`PH Serviceauftrag Position` als Kartenliste mit Kamera ≥ 48 px) · Konditionen & Unterschriften. Übernahme/Rückgabe **[jetzt]** über `uebernahme_erfassen(positionen, unterschrift, name_bestaetigt, lagerort)` / `rueckgabe_erfassen(positionen, unterschrift, name_bestaetigt)` (S8).
- **Abrechnen** (Workflow, Leitung): Knopf nur mit verknüpfter Rechnung; ohne Rechnung „Rechnung in Faktura erstellen“; Bedingung serverseitig **[Anfrage A-S8]**. Storno nach Beauftragt mit Rechnung → Hinweis „Rechnung RE-… in Faktura per Storno-Gutschrift ausgleichen“.
- FAGG wie §2.9 beim Übergang „Beauftragen“ (Verbraucher, Fernabsatz/außerhalb Geschäftsraum). Winterlager: Zeile „Verwahrung: Haftung und Versicherung laut Bedingungen (Version …)“ – Text Kanzlei.
- Reiter „Rückgabe fällig“ (`rueckgabe_am ≤ heute + 14`, Eingelagert); Massen-Mail „Rückgabetermin vorschlagen“ ausgeblendet bis Vorlage existiert (A-S8).
- Leer: „Noch keine Serviceaufträge (Winterlager, Reinigung, Aufarbeitung).“ [Serviceauftrag anlegen]; Übernahmeliste leer „Noch keine Stücke. Bei der Abholung je Stück Zustand und Foto erfassen.“ [Stück hinzufügen].

### 2.11 Fehlerkatalog `/service/fehlerkatalog` (T9, Baum)

```
┌ Fehlerkatalog                                                         [+ Code] [+ Bereich] ┐
│ [search Suche Code/Bezeichnung]                                    ☐ Inaktive zeigen       │
│ ▾ OBF Oberfläche (7 Codes · 12 Fälle)                                                      │
│   OBF-01 Kratzer           Material   Lieferant haftet  3 Fälle  Üblich: Verbesserung      │
│ ▸ POL Polster (6 Codes · 9 Fälle)                                                          │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

- Seed aus `install.py` (12 Bereiche) + `<BER>-99 Sonstiges` je Bereich, auch für neu angelegte Bereiche (Server). Kein „Standardkatalog übernehmen“, kein Erstbetriebs-Knopf (F1).
- Baum `role="tree"`: `→` aufklappen, `←` zuklappen/Elternknoten, `Enter` öffnet Code-Sheet, Buchstabe springt zum Eintrag. Code-Sheet mit allen Feldern, Autosave 1 s (Leitung), Statuszeile „Gespeichert 14:05“ / „Nicht gespeichert · Erneut“. Sortierung per Drag + `Alt+↑/↓` + Menü „Nach oben/Nach unten“. Deaktivieren statt löschen.
- Spaltentext „Lieferant haftet“ statt „lieferantenrelevant“ (Feld bleibt).
- Leer (Katalog geleert/alle inaktiv): „Kein aktiver Fehlercode. Fälle können angelegt, aber erst mit Fehlercode geprüft werden.“ [Bereich anlegen] (Leitung) bzw. „Leitung informieren“ (PH Aufgabe). Bereich ohne Codes: „Noch kein Code im Bereich ‚Polster‘.“ [Code anlegen].

### 2.12 Berichte `/service/berichte/[report]` (T8)

| Report | Filter | Spalten (UI-Titel) | Chart |
|---|---|---|---|
| `PH Reklamationsquote je Marke` | von, bis, nach | Gruppe · Fälle · Bestätigt · Abgelehnt · Offen · Transport · Gelieferte Positionen · Quote % · Ø Durchlaufzeit · Kosten netto · Regress erhalten · **Kosten nach Regress** | Balken Quote je Marke |
| `PH Fehlercode-Statistik` | von, bis, marke, bereich | Baum Bereich → Code: Fälle, Anteil, Bestätigt %, Ø Tage, Kosten netto | Balken je Bereich |
| `PH Regressstatus` | status, lieferant, alle | Regress · Fall · Lieferant · Status · Form · Gefordert · Anerkannt · Erhalten · Offen · Abgleich · Frist | Donut Status |
| `PH Servicekosten` | von, bis, nach | Fälle · Intern · Extern · Kulanz/Minderung · Gesamt (netto) · An Kunden · Regress · **Kosten nach Regress** · je Fall | gestapelt je Monat |
| `PH Gewährleistungsfristen` | tage, alle, marke | Ampel · Fall · Kunde · Produkt · Übergabe (Quelle) · Vermutung bis · Gewährleistung bis · Verjährung · Garantie · Regress bis · Nächste Frist | – |

- Kopfzeile jedes Kostenberichts: „Alle Beträge netto (ohne USt). Gruppiert nach Meldedatum.“ (Kostendatum mit A-S12.) Reklamationsquote: Hinweis „Nenner enthält derzeit auch stornierte Rechnungen“ bis A-S12 (B-08).
- **Keine Auswertung je Techniker** (Zeiten, Zufriedenheit) ohne Inhaber-/Kanzlei-Entscheid (R-13, K8); Zufriedenheit nur je Fall/Marke.
- Zeitraum je Benutzer gemerkt (Server, Rückfall localStorage); Leer „Keine Daten im gewählten Zeitraum.“ [Zeitraum: letzte 12 Monate]; Zeilenklick öffnet Akte; CSV mit `export`; €-Spalten nur permlevel 1.
- Bericht „Offene Gewährleistung zum Stichtag“ (B-07) **[Anfrage A-S12]** – nicht gebaut.

### 2.13 Einstellungen `/service/einstellungen` (T9, Leitung)

| Karte | Felder |
|---|---|
| Fristen (Österreich) | `gewaehrleistung_monate`, `vermutung_verbraucher_monate`, `vermutung_unternehmer_monate`, `fristwarnung_tage`; Lesewerte mit Paragraf `verjaehrung_monate`, `regress_monate`; Banner info „Änderung nur nach Rücksprache mit der Kanzlei“ |
| Service-Zeiten (SLA) | `reaktion_werktage`, `sla_reaktion_*` und `sla_loesung_*` je Priorität (Tabelle 4 × 2), `sla_warn_werktage`, `sla_gf_ab_stufe`, `telefon_ist_erstreaktion` |
| Bearbeitung & Eskalation | `eskalation_tage`, `eskalation_an`, `kulanz_schwelle_cent` (Betragsfeld), `standard_prioritaet`, `techniker_standard` |
| Einsatzplanung | `einsatz_takt_min` (Abrechnungstakt), `einsatz_puffer_min`, `techniker_tag_von`, `techniker_tag_bis` |
| Ersatzteile | `ersatzteil_bestand_fuehren`, `ersatzteil_lagerort`, `mindestbestand_warnung`, `ersatzteil_ueberfaellig_tage` |
| Regress | `regress_toleranz_cent` |
| Kommunikation | 8 Vorlagen (`vorlage_eingang`, `_termin`, `_abschluss`, `_wartung`, `_regress`, `_ablehnung`, `_frei`, `_servicebericht`) mit „Vorschau“ im Sheet; `mail_automatisch` |
| Pflege | `erinnerung_tage_vorher`, `wartung_karenz_tage`, `nachkauf_tage_nach`, `wartung_automatisch`, `wartung_vorlauf_tage` |
| Portal | `portal_sichtbar_standard`, `portal_fotos_max`, `portal_foto_max_mb`, `portal_videos_max`, `portal_video_max_mb` |

Speichern `Strg+S`, Speicherleiste (Fundament). Tab „Aufbewahrung“ (Löschvorschau, R-07) erst mit Anfrage A-S18.

### 2.14 Leerzustände (Abnahmeliste Q-34)

Komponente `Leer` (03 §8.18), ein Satz, max. eine Primär- und eine Sekundäraktion; „Alles erledigt“ mit Icon `check` Sand; Einblenden `--bo-dur-base` nach Skeleton.

| Ort | Text | Aktion |
|---|---|---|
| Bereichsstart nie Fälle | „Noch keine Servicefälle. Fälle entstehen hier, aus Montage, Abnahme und Wareneingang oder über Portal und Website.“ | Servicefall melden |
| Bereichsstart alles erledigt | „Alles erledigt – keine offenen Servicefälle.“ | – |
| Heute-Leiste 0 | „Heute nichts Dringendes.“ | – |
| Einsätze heute | „Heute keine Einsätze.“ | – |
| Gewährleistung ≤ 14 Tage | „Keine Gewährleistung endet in den nächsten 14 Tagen.“ | – |
| Servicefälle Filter | „Keine Servicefälle mit <Filtertext>.“ | Filter zurücksetzen |
| Reiter Meine / Reaktion überfällig | „Alles erledigt – keine offenen Fälle für dich.“ / „Keine Reaktion überfällig.“ | – |
| Kanban-Spalte | „–“ | – |
| Kontakt-Suche 0 | „Kein Kontakt zu ‚Hubr‘.“ | Als neuen Kontakt anlegen |
| Bezugsvorschläge 0 | „Keine Belege zu Fam. Huber – ohne Bezug weiter.“ | – |
| S2 ohne Textbausteine | Bausteinknöpfe ausgeblendet | – |
| Kalender Woche | „Keine Einsätze in dieser Woche.“ | Zelle anklicken |
| Keine Techniker | „Noch kein Techniker. Techniker sind Benutzer mit der Rolle PH Techniker.“ | Rolle vergeben / Leitung bitten |
| A14 alle abwesend | „Diese Woche ist kein Techniker verfügbar.“ | Nächste Woche |
| Einsatz Durchführung vor Start | „Erscheint, sobald der Techniker den Einsatz startet.“ | – |
| Ersatzteile / unter Mindest | „Noch keine Ersatzteile. …“ / „Alle Teile über Mindestbestand.“ | Ersatzteil anlegen |
| Bestellungen / Entwurf ohne Position | „Noch keine Ersatzteilbestellungen. …“ / „Noch keine Position.“ | Beim Hersteller bestellen / Ersatzteil hinzufügen |
| Regress / Unterdeckung | „Noch kein Regress. …“ / „Keine offenen Differenzen.“ | – |
| Pflege / Protokolle | „Noch keine Pflege- oder Wartungsverträge.“ / „Noch kein Protokoll. …“ | Vertrag anlegen / Protokoll erfassen |
| Serviceaufträge / Übernahmeliste | „Noch keine Serviceaufträge …“ / „Noch keine Stücke. …“ | anlegen / Stück hinzufügen |
| Fehlerkatalog ohne aktive Codes | „Kein aktiver Fehlercode. …“ | Bereich anlegen / Leitung informieren |
| Akte Bearbeitung | „Noch kein Einsatz.“ / „Keine Ersatzteile nötig.“ / „Noch keine Kosten gebucht. Kosten entstehen mit dem Einsatzabschluss oder hier.“ | Einsatz planen / Ersatzteil hinzufügen / Kosten hinzufügen |
| Akte Lieferant | „Lieferant haftet nicht laut Fehlercode.“ | Trotzdem Mängelanzeige senden (sekundär) |
| Akte Fotos / Zeitleiste | „Noch keine Fotos.“ / „Noch keine Einträge außer der Anlage.“ | Foto hinzufügen / Kommentar schreiben |
| Side-Peek gelöscht | Text `not_found` (02 §7.2) | – |
| Berichte | „Keine Daten im gewählten Zeitraum.“ | Zeitraum: letzte 12 Monate |
| Kennzahl | „–“ + Tooltip „Noch keine Werte“ | – |
| Technik Heute / Woche / Suche | „Heute keine Einsätze.“ / „Keine Einsätze diese Woche.“ / „Nichts zu ‚xyz‘ – Scanner über Kamera versuchen?“ | Morgen ansehen / Scanner öffnen |
| Technik Warteschlange leer | „Alles übertragen · 07:42“ (Häkchen Sand) | – |

---

## 3. Akte Servicefall `/service/faelle/[name]` (T5)

Daten: **ein** Aufruf `ph_service.api.get_service_case_file(name)` (Fall, Einsätze, Bestellungen, Regresse, `naechsterSchritt`, `fristen`, `sla`); Zeitleiste über `frappe.desk.form.load.get_docinfo` (gestreamt). Budget Akte ≤ 4 Frappe-Aufrufe (Akte, docinfo, Faktura-Bezüge, Meta-Cache).

### 3.1 Aufbau

```
┌ Zentrale › Service › Servicefälle › PH-SRV-2026-00031                                                     ┐
│ PH-SRV-2026-00031 · Mangel: Fam. Huber – Sofa Modell X   ● Entschieden · wartet auf Freigabe  [star] [⋯]  │
│ Gemeldet ─● Geprüft ─● Entschieden ─◉ In Bearbeitung ─○ Erledigt ─○ Geschlossen                         │
│  02.11.     03.11.     04.11.                                                                          │
│ Lösung bis 18.11. · im Plan                                                                            │
├ (clock) Kulanz 620,00 € wartet auf Freigabe der Leitung (angefragt 09:12) · Erneut anfragen             ┤
├ Übersicht | Mangel & Fristen | Bearbeitung 1 | Regress & Abschluss | Verlauf 9                           ┤
│ ÜBERSICHT (nur Lesekarten)                                          ║ KUNDE                             │
│ ┌ Gewährleistung ───────────────────────────────── Bearbeiten → ┐   ║ Fam. Huber → Kundenakte           │
│ │ ●━━━━━━━━◆━━━━◉━━━━━━━━━━━━━○━━━━━○ (kompakt)                  │   ║ (phone) +43 … · (mail) huber@…    │
│ │ rechtzeitig gemeldet · Beweislast Platzhirsch (Vermutung)      │   ║ Verbraucher · Seestraße 3, Lochau │
│ └────────────────────────────────────────────────────────────────┘   ║ PROJEKT P-26-0042 · Übergabe →    │
│ ┌ Mangel ─────────── Bearbeiten → ┐ ┌ Kosten netto (Leitung) ───────┐ ║ BEZÜGE                            │
│ │ POL-01 Nahtriss · Polster        │ │ Intern 0,00 · Extern 0,00     │ ║ Vorher: LS-2026-00088 ● Zugestellt│
│ │ linke Armlehne · seit 10.10.     │ │ Kulanz (brutto an Kunde) 620,00│ ║         RE-2026-00040 ● Bezahlt   │
│ │ Kundenwunsch: Verbesserung       │ │ Kosten nach Regress 620,00     │ ║         Mahnsperre (Servicefall)  │
│ │ [img][img][img] +2               │ └────────────────────────────────┘ ║ Nachher: Einsätze 0 · + planen    │
│ └──────────────────────────────────┘                                    ║ ZEITLEISTE (letzte 5)             │
│ Kunde kontaktiert: Eingangsbestätigung 03.11. 09:40 (Frist 04.11., eingehalten)                         │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Kopf (N9):** Nummer + `titel`; Status-Badge (Töne §2.2); höchstens **ein** rotes Kennzeichen (Rangfolge §2.2); höchstens **zwei** neutrale Kennzeichen, weitere als „+2“ (Popover): Lieferant haftet · Dringend (`warning-text` + `arrow-up`) · Portal · Website · „Zuordnung prüfen“ (§3.8) · „Eskalation 2“ (eine Zahl = `max(eskalationsstufe, sla_eskalationsstufe)`, Tooltip mit Grund „Ohne Bewegung seit 6 Tagen“ bzw. „Lösungsfrist überschritten“). Stern „Anheften“ (Zentrale „Angeheftet“). Primärknopf nach §3.4, `⋯` mit allen erlaubten Aktionen (§4.1).
- **iPad hoch (820 px):** Zeile 1 Nummer + Titel (Ellipsis); Zeile 2 Status + Kennzeichen links, Primär + `⋯` rechts.
- **Phasenleiste:** 6 Punkte (Gemeldet · Geprüft · Entschieden · In Bearbeitung · Erledigt · Geschlossen); Status „Einsatz geplant“ ist Unterzeile der Phase 4 („Einsatz Do 07.11., T. Steiner“), die Schleife Einsatz → In Bearbeitung bleibt in Phase 4 (keine rückwärts hohlen Punkte). Punkte sind `<button>` mit 24 × 24-px-Trefferfläche und Fokusring; Klick öffnet Popover (`--bo-dur-fast`) „Geprüft am 03.11. 09:12 von Anna · Im Verlauf zeigen“. Daten aus `PH Servicefall Verlauf` (`ereignis=Status`). Abgelehnt ersetzt die Leiste durch Band „Abgelehnt am … · Grund …“ (Leitung: „Wieder öffnen“). < 1280 px: Beschriftung nur am aktuellen und nächsten Punkt, übrige im Popover (kein `title` allein); < 640 px: Textzeile „Schritt 4 von 6 · In Bearbeitung“. **Fall mit Projekt:** keine zweite Leiste, sondern Karte „Projekt P-26-0042 · Phase Übergabe →“ oben in der rechten Spalte.
- **SLA-Zeile (N5, U-01)** unter der Phasenleiste, aus `sla_info()`/`frist_loesung`/`sla_status`: „Lösung bis 18.11. · im Plan“ (`muted`) · „Lösung bis 18.11. · gefährdet“ (`warning-text` + `clock` 12 px) · „Lösungsfrist seit 2 Werktagen überschritten“ (`danger-text` + `triangle-alert`, zählt als das eine rote Signal) · Erledigt/Geschlossen: „Lösung in Frist“ bzw. „Lösung 3 Werktage nach Frist“.
- **Banner (max. einer; Rangfolge):** ① Blocker der eigenen Rolle (Kulanz wartet auf Freigabe · Kulanz abgelehnt · Teilschritt nicht ausgeführt) ② Reaktionsfrist überschritten ③ Mängelanzeige an Lieferant offen (§3.7) ④ Regressfrist ≤ 14 Tage ⑤ Gewährleistung **bei Meldung** abgelaufen → „Bei Meldung war die Gewährleistung abgelaufen – Kulanz oder kostenpflichtig prüfen“ (nie, wenn rechtzeitig gemeldet, R-01) ⑥ Mail nach Versand fehlgeschlagen ⑦ Website-Meldung „Zuordnung prüfen“ ⑧ Auftrag/Rechnung storniert (R-S1/R-S3: „Auftrag AB-… storniert – Fall prüfen“). Weitere als „+ 2 weitere Hinweise ▾“ (Akkordeon `--bo-dur-base` `--bo-ease-inout`).
- **Kulanz-Banner je Status (N6, U-02):** Angefordert, Mitarbeiter: „Kulanz 620,00 € wartet auf Freigabe der Leitung (angefragt 09:12)“ + Textknopf „Erneut anfragen“ = `kulanz_anfordern()` (kein Primärknopf, keine PH Aufgabe). Angefordert, Leitung: Banner mit „Freigeben…“ / „Ablehnen…“ (gleiche `FreigabeEintrag`-Logik wie Glocke). Abgelehnt: `warning-soft` „Kulanz 620,00 € abgelehnt: <Grund> · [Entscheidung ändern]“ (öffnet S2 Teil 2). Freigegeben und Betrag danach erhöht: „Neuer Betrag 720,00 € – Freigabe gilt für 620,00 € · Freigabe neu anfragen“.
- **Tabs (5, `?tab=`):**

| Tab | Inhalt |
|---|---|
| Übersicht | nur Lesekarten: Gewährleistung kompakt, Mangel (Code, Stelle, Wunsch, 3 Fotos), Kosten netto (Leitung), Kunde kontaktiert, Kanal/Quelle/Portal; jede Karte „Bearbeiten →“ in ihren Tab; kein Feld editierbar; **keine** Nächster-Schritt-Karte |
| Mangel & Fristen | Fristband groß (§3.2) mit Datumsfeldern `kaufdatum`, `uebergabe_datum`, `sachart`, `lieferung_an_haendler`, `garantie_monate`, `garantie_bedingungen`; Fehler-Combobox + Wissen (Prüfhinweis, Standardlösung, typische Ursache); `ort_am_stueck`, `erstauftreten`, `reproduzierbar`, `beschreibung`; Galerie (Bild/Video/PDF nach `medientyp`: Video-Kachel mit Play-Icon und Dauer, kein Autoplay; PDF-Kachel mit Dateiname), Schalter „an Lieferant“ je Kachel, Upload/Kamera |
| Bearbeitung | Karte Entscheidung (Lesesicht + „Prüfen & entscheiden“/„Entscheidung ändern“ → S2; Kulanzblock) · Einsätze (Liste + „Einsatz planen“) · Ersatzteile (`PH Servicefall Ersatzteil`, Chips Benötigt/Aus Bestand/Bestellt/Eingetroffen/Verbaut/Storniert; „Ersatzteil hinzufügen“ §3.5; „Bestellen“ S3) · Geld (Gutschrift §4.7, Mahnsperre-Chip) · Kosten (Leitung; Mitarbeiter sehen den Abschnitt ohne Beträge nicht – ausgeblendet; Techniker ausgeblendet) |
| Regress & Abschluss | Lieferanten-Leiste (§3.7) + Regressliste; Abschnitt Abschluss ab Erledigt/Abgelehnt (`abschlussbericht`, `erledigt_am`, `geschlossen_am`, `dauer_tage`, „Abschluss mitgeteilt“ §3.4 D-3, Abnahme mit Bild, `zufriedenheit`, `portal_sichtbar`, `ablehnungsgrund`); vorher „Erscheint nach ‚Erledigt melden‘“ |
| Verlauf | Zeitleiste §3.3 |

- **Rechte Spalte:** Projekt-Karte (falls `projekt`), Kunde (Anruf-Link, Mail öffnet „Kunde informieren“), Einsatzadresse, Bezüge *Vorher* (`projekt`, `auftrag`, `bestellung`, `rechnung` mit Mahnsperre-Chip, `lieferschein`, `wareneingang`, `produktpass`, `montageauftrag`), *Stück* (`produkt`, `ausfuehrung`, `marke`, `lieferant`, `seriennummer`, `menge`), *Nachher* (Einsätze, Bestellungen, Regresse, Gutschrift, Aufgaben mit Zähler und „+“), Zeitleiste (letzte 5). < 1280 px: Leiste 48 px „Kunde · Bezüge · Zeitleiste“, öffnet Sheet 400 px.
- **Autosave** für Entwurfsfelder 1 s nach Eingabe („Gespeichert 09:14“); Felder mit Folgewirkung (Entscheidung, Status, Beträge, Abnahme) nur über Assistenten/Dialoge. Abnahme-Felder (`abnahme_unterschrift`, `abnahme_bestaetigt`, `abnahme_name`) sind im UI nie editierbar, nur über `abnahme_erfassen`; zweites Erfassen nur Leitung mit Grund (D11; serverseitig A-S10). `notiz_intern` als Karte „Interne Notiz (Leitung)“ mit Icon `lock`.
- **Fokus nach Statuswechsel:** auf den neuen Primärknopf, sonst auf die Statuszeile; Live-Region „Fall ist in Bearbeitung“.
- **Konflikt:** `modified`-Prüfung, Konfliktdialog (05 §11). Sitzungsablauf in Sheets: Login-Overlay, Entwurf je Fall und Sheet in IndexedDB.
- **Laden/Fehler:** Kopf + Übersicht zuerst, Tabs lazy; Fehler im Kopf → ganze Akte `Fehler` mit „Erneut“/„Zur Liste“; Fehler im Tab → nur Tab.

### 3.2 Komponente `Fristband` (`components/Backoffice/Service/Fristband.js`)

```
●━━━━━━━━━━◆━━━━◉━━━━━━━━━━━━━━━━○━━━━━━○            heute ▾
Gemeldet 10.03.2028 · rechtzeitig gemeldet · innerhalb der Gewährleistung (Beweislast Kunde) · § 10 VGG
Verjährung der Geltendmachung 14.06.2028 · Übergabe 14.03.2026 aus Montageabnahme MA-… ▾
```

- **Eingabe:** gespeicherte Felder des Falls (`gewaehrleistung_bis`, `beweislast_bis` = Ende der Vermutung, `verjaehrung_bis`, `garantie_bis`, `regress_frist_bis`, `uebergabe_datum`, `uebergabe_quelle`, `sachart`, `kundentyp`, `gemeldet_am`, `erstauftreten`). `fristen_info()` wird **nicht** für die Anzeige verwendet (rechnet ohne `sachart`, D2). Live-Vorschau beim Ändern eines Datums: reine Client-Funktion `fristenVorschau()` (Spiegel von `fristen.py` inkl. `sachart`, Einstellungen `gewaehrleistung_monate`, `vermutung_*`); nach Speichern gelten die Serverwerte.
- **Zeile 1 = Anspruchsstand bei Meldung (R-01, [jetzt] als reine Funktion `meldezustand(fall)`):** Stichtag = früheres Datum aus `erstauftreten` und `gemeldet_am`. Stichtag ≤ `beweislast_bis` → „rechtzeitig gemeldet · Vermutung (Beweislast Platzhirsch)“; ≤ `gewaehrleistung_bis` → „rechtzeitig gemeldet · innerhalb der Gewährleistung (Beweislast Kunde)“; danach → „bei Meldung abgelaufen“ (`danger`). Paragraf: Verbraucher § 11 VGG / § 10 VGG, Unternehmer § 924 / § 933 ABGB. Gespeichertes Feld `fristen_status_bei_meldung` mit Änderung nur durch Leitung + Grund **[Anfrage A-S1]**; ab dann liest die Funktion das Feld. Wortlaut Kanzlei K1.
- **Zeile 2 = Warnung ab heute:** „Verjährung der Geltendmachung <Datum>“ – nur `warning-text`, nie `danger`, solange Zeile 1 nicht „abgelaufen“ ist; dazu Übergabequelle („aus Lieferschein LS-… (zugestellt)“, „aus Montageabnahme MA-…“).
- **Übergabequelle umschalten (R-04):** Leitung: `▾` öffnet Popover mit den gefundenen Daten (Montage-Abnahme, Projektübergabe, Zustellung, Produktpass) als Radio – Reihenfolge der Anzeige: Montage-Abnahme > Projektübergabe > Zustellung > Produktpass; Wahl = `set_value uebergabe_datum` + Kommentar „Übergabequelle geändert: … (Grund)“ (Grund Pflicht). Mitarbeiter sehen Text. Serverseitige Reihenfolge und `uebergabe_quelle`-Pflege **[Anfrage A-S5]**; Kanzlei K2.
- **Strahl:** von Übergabe (sonst Kauf) bis max(Verjährung, Garantie). Segmente: Vermutung (Punktmuster), Gewährleistung (voll), Verjährung (schraffiert), Garantie (zweite Zeile, wenn vorhanden). Raute „Meldung“ 8 px Tinte; „Heute“ 2 px `ink` mit Label; Regressfrist als Raute auf eigener Zeile ab `erledigt_am`; absolute 5-Jahres-Grenze gestrichelt bei `lieferung_an_haendler`.
- **Kontrast (N14):** Außenrand und Grenzen 1 px `line-control` (≥ 3:1), Muster in `ink-soft`; dunkles Schema mit Tints aus 03 §1.4 je Segment. **Animation:** Grenzmarken per `translate` bzw. Segmente per `clip-path: inset()`, `--bo-dur-move` `--bo-ease-inout`, Muster unverzerrt; reduziert: sofort.
- **Fehlerzustände:** kein Übergabe-/Kaufdatum → grauer Strahl „Übergabe fehlt – Frist unbekannt · Datum eintragen“ (Link ins Feld); Übergabe steht aus (Projekt/Auftrag nicht übergeben) → grau „Übergabe steht aus – Frist beginnt erst mit Übergabe“ (kein Rot, R-T2).
- **Garantie (R-15):** bei Art Garantie und laufender Gewährleistung Zeile „Gewährleistung läuft daneben – Kunde wählt“.
- **Kompakt (Liste, Kanban, Peek):** Punkt 8 px + „noch 612 Tage“ / „seit 3 Tagen abgelaufen“; Text sichtbar, nicht nur im `title`.
- **Barrierefreiheit:** `<svg role="img" aria-label="…">` mit vollem Satz; darunter `<details>` „Fristen als Liste“ (Frist · bis · Rechtsgrundlage · Stand). Keine Abkürzungen („Gewährleistung“, nie „GWL“). „Vermutungsfrist“, „Beweislast“, „Regress“ mit Tooltip-Erklärung am Begriff (Tooltip-Komponente mit Fokus-Auslösung).

### 3.3 Zeitleiste

Quellen nach Zeit: `PH Servicefall Verlauf` (`zeit`, `ereignis` Status/Kommunikation/Einsatz/Ersatzteil/Regress/Kulanz/SLA/Eskalation/Frist/Notiz, `status`, `von`, `hinweis`), Kommentare (mit @-Erwähnung), Versionen (eingeklappt „n Felder geändert“), Anhänge. Knoten: Status Punkt · Kommunikation `mail` · Einsatz `wrench` · Ersatzteil `package` · Regress `banknote` · Kulanz `scale` · Eskalation `triangle-alert` · Frist `clock`. Filter-Chips Alle · Status · Kommunikation · Einsätze · Kommentare (`←→`). Kommunikationszeilen zeigen „gesendet“ (Zustellstatus mit Anfrage A-S19); **geplante Mail** als Zeile „Wird gesendet in 7 s · Ansehen · Nicht senden“; fehlgeschlagene Mail mit `circle-x` + „Erneut“. Texte menschlich („Anna hat Status auf Geprüft gesetzt“, „Mail ‚Ihre Servicemeldung …‘ an huber@beispiel.at“ – Adresse im Backoffice unmaskiert). Kommentar (`Strg+Enter`) zählt als Bewegung. Leer: „Noch keine Einträge außer der Anlage.“

### 3.4 Nächster Schritt – eine Quelle (N2, F7, P-24)

**Quelle:** Server `utils/schritte.naechster_schritt` über `get_next_steps(names)` (Liste, Heute-Leiste, Kanban) bzw. `get_service_case_file(name).naechsterSchritt` (Akte). `lib/backoffice/service/naechsterSchritt.js` spiegelt die Regel **nur** für die optimistische Anzeige nach einer eigenen Aktion; gemeinsame Testdatei `schritte.faelle.json` (Eingabe → erwartetes Ergebnis) wird vom Python-Test (Anfrage an ph_service, A-S2) und vom JS-Test gelesen; 0 Abweichungen.

**Zielreihenfolge** (erste passende Zeile gewinnt; Spalte „Server“ = heute in `schritte.py`):

| # | Bedingung | Schritt (Knopftext) | Aktion | Server |
|---|---|---|---|---|
| 1 | Entschieden, `kulanz_freigabe_status = Angefordert` | Mitarbeiter: kein Knopf, Blocker-Banner · Leitung: „Kulanz freigeben…“ | `kulanz_freigeben` | ja |
| 2 | Entschieden, Kulanz abgelehnt (`kulanz_abgelehnt_cent = kulanz_cent > 0`) | „Entscheidung ändern“ | S2 Teil 2 | **A-S2** |
| 3 | Gemeldet, `erstreaktion_am` leer, E-Mail vorhanden | „Eingangsbestätigung senden“ (sekundär „Telefonat erfassen“) | `kunde_informieren("eingang")` | ja (Server-Text „Kunde kontaktieren“, Knopftext UI-seitig nach E-Mail) |
| 4 | Gemeldet, `erstreaktion_am` leer, keine E-Mail | „Telefonat erfassen“ | `erstreaktion_erfassen` | ja |
| 5 | Gemeldet, ohne Fehlercode | „Fehler zuordnen und prüfen“ | S2 Teil 1 | ja |
| 6 | Gemeldet mit Fehlercode | „Prüfen & entscheiden“ | S2 | ja |
| 7 | Geprüft | „Entscheiden“ | S2 Teil 2 | ja |
| 8 | Geprüft/Entschieden/In Bearbeitung, Lieferant haftet, `mangel_bestaetigt in (Ja, Teilweise)`, Mängelanzeige offen (§3.7) | „Mängelanzeige senden“ | S4a | **A-S2** (bis dahin Banner ③ + Zeile in „Jetzt dran“ über UI-Regel `maengelanzeigeOffen(fall, regresse)`) |
| 9 | Entschieden/In Bearbeitung, Ersatzteilzeile Benötigt ohne Bestellung | „Ersatzteile bestellen“ | S3 | ja |
| 10 | Ersatzteile bestellt | Blocker „Ersatzteile erwartet am …“ | – | ja |
| 11 | Entscheidung Preisminderung/Kulanz, Rechnung, keine Gutschrift | „Gutschrift erstellen“ | §4.7 | **A-S2** (bis dahin Karte „Geld“ im Tab Bearbeitung mit Knopf + Banner ①) |
| 12 | Entschieden/In Bearbeitung, kein offener Einsatz, Entscheidung Verbesserung/Austausch | „Einsatz planen“ | A14 | ja |
| 13 | Einsatz geplant, Einsatz Geplant mit `umgeplant_am` oder ohne `bestaetigt_kunde_am` | „Terminvorschlag senden“ | `kunde_informieren("termin")` | **A-S2** (Server: „Einsatz durchführen“) |
| 14 | Einsatz geplant, Einsatz läuft | Blocker „Einsatz am 07.11., T. Steiner“ | – | ja |
| 15 | In Bearbeitung, letzter Einsatz „Weiterer Einsatz nötig“/„Ersatzteil nötig“, kein Folgeeinsatz | „Folgeeinsatz planen“ | A14 | **A-S2** |
| 16 | In Bearbeitung (sonst) | „Erledigt melden“ | S5 | ja |
| 17 | Erledigt, Lieferant haftet, kein Regress | „Forderung stellen“ | S4b | ja („Lieferant informieren“) |
| 18 | Erledigt, Abschluss nicht mitgeteilt (D-3) | „Abschluss mitteilen“ | Dialog „Kunde informieren“ (§3.6), Vorlage `abschluss` | ja, aber mit `kunde_informiert_am` (A-S3) |
| 19 | Erledigt, Abschluss mitgeteilt | „Schließen“ | Workflow, verzögert 8 s | ja |
| – | Geschlossen/Abgelehnt | – (Leitung: Wieder öffnen im `⋯`) | – | ja |

Fälligkeit: Server-`faellig` (Rückfall `frist_loesung`); Anzeige überfällig `danger-text`, ≤ 3 Tage Sand. Bis A-S2 erscheinen die Zeilen 2, 8, 11, 13, 15 nicht als Primärknopf, sondern als Hinweis mit Aktion – der Primärknopf zeigt immer den Server-Schritt.

**Definitionen (überall gleich):**
- **D-1 Reaktion überfällig:** `status = Gemeldet` und `erstreaktion_am` leer und `frist_reaktion < heute`. Reiter, Heute-Leiste, Kennzahl `ueberfaellige_reaktion`, GF-Zentrale, Banner und ToDo nutzen dieselbe Bedingung (kein Kommentar-Kennzeichen, kein Schließen von ToDos durch den Backoffice-Server – das macht `erstreaktion_erfassen`).
- **D-2 Mängelanzeige offen:** Lieferant haftet (`lieferantenrelevant` oder Art Transportschaden), `mangel_bestaetigt in (Ja, Teilweise)`, Status Geprüft/Entschieden/In Bearbeitung/Einsatz geplant, kein Regress zum Fall und kein Verlaufseintrag `ereignis=Kommunikation` mit Vorlage `regress` (bis A-S2 `maengelanzeige_am`).
- **D-3 Abschluss mitgeteilt (N3):** Verlaufseintrag `ereignis=Kommunikation` mit Vorlage `abschluss` nach `erledigt_am` **oder** `abnahme_bestaetigt` **oder** erfasster Kanal Brief/Telefon/Persönlich nach `erledigt_am` (§3.6). Eingangsbestätigung oder Terminvorschlag zählen nicht. „Schließen“ für Mitarbeiter ist ohne D-3 deaktiviert mit Grundtext „Schließen – erst nach Abschlussmitteilung oder Abnahme“; zusätzlich gesperrt, solange Zeile 8 oder 17 offen ist („Schließen nach ‚Forderung stellen‘ (Regressfrist bis 12.11.)“). Serverseitig `abschluss_informiert_am` + Workflow-Bedingung **[Anfrage A-S3]** – bis dahin ist die UI-Sperre die Hürde (Risiko in §12).

### 3.5 Dialog „Ersatzteil hinzufügen“ (N12, Dialog md)

```
┌ Ersatzteil hinzufügen                                               [x] ┐
│ Ersatzteil [search Scharnier / Hersteller-Nr. / Scan            ]        │
│            Scharnier 110° · 71B355 · Blum · verfügbar 10 · R2-F3         │
│            ( ) Nicht im Katalog: Bezeichnung [      ] Hersteller-Nr. [  ]│
│ Menge      [ − ] 2 [ + ]                                                 │
│ Quelle     [Aus Bestand] [Bestellen]   („nur 1 verfügbar“ wenn zu wenig)  │
│ Kostenträger [Gewährleistung ▾]                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ [Abbrechen]                     [Hinzufügen und bestellen]  [Hinzufügen Strg↵]│
└──────────────────────────────────────────────────────────────────────────┘
```

- Speichert eine Zeile `PH Servicefall Ersatzteil` (`status` Aus Bestand → Reservierung über `bestand_neu_berechnen`; Bestellen → Benötigt) per `save`. „Hinzufügen und bestellen“ → S3 mit dieser Zeile vorgewählt (`zeilen[]`).
- Zeilenstatus in der Tabelle als Chip-Popover (Benötigt · Aus Bestand · Storniert), umkehrbar mit Undo 8 s. Altteil an Hersteller (R-R1): Spalte „Altteil zurück“ (nicht nötig · offen · gesendet am …) **[Anfrage A-S11]**.
- Fehler: „Aus Bestand“ bei zu wenig Bestand deaktiviert mit Text; Server-Fehler → Feldfehler.

### 3.6 Dialog „Kunde informieren“ mit Kanalwahl (P-09, R-E1, R-E3)

```
┌ Kunde informieren · Abschluss                                          [x] ┐
│ Kanal  (●) E-Mail huber@beispiel.at  ( ) Brief  ( ) Telefon  ( ) Persönlich │
│        ohne E-Mail: E-Mail ausgegraut „keine E-Mail hinterlegt“, Brief gewählt│
│ Vorschau ▸ (Mail bzw. PDF A4 mit Adressfeld für Fensterkuvert)              │
│ Zusatztext (optional) [                                                 ]   │
│ Notiz* (nur Telefon/Persönlich) [                                       ]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Abbrechen]                     [PDF drucken]   [Senden / Als informiert erfassen Strg↵] │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **E-Mail [jetzt]:** `kunde_informieren(vorlage, zusatz, betreff)`; ohne Zusatztext ist das eine Vorlagen-Mail (verzögert 8 s, §4.6), mit Zusatztext/Anhang Bestätigung im Dialog.
- **Brief, Telefon, Persönlich:** Speicherung mit `kunde_informiert_erfassen(kanal, notiz)` **[Anfrage A-S3]**; bis dahin `erstreaktion_erfassen` ist **nicht** geeignet (nur Erstreaktion) → Übergang: Kommentar mit festem Text „Kunde informiert (Abschluss) per Brief am 04.11. (Anna)“; D-3 wertet diesen Kommentar aus (einziger erlaubter Kommentar-Mechanismus, bis A-S3 geliefert ist; Grep-Prüfung entfernt ihn danach). Brief: „PDF drucken“ öffnet Druckvorschau `/druck/PH Servicefall/<name>?format=<Vorlage>` (Brief-Druckformate je Vorlage **[Anfrage A-S3]**; bis dahin „PH Servicefall Abnahmebestätigung“ für den Abschluss); „Als informiert erfassen“ wird erst nach dem Druck aktiv (Knopftext vorher „Erst drucken“).
- Abschluss ohne E-Mail im S5 bietet zusätzlich die Kachel „Ausgedruckt übergeben“ (Abnahmebestätigung).
- Zustellung (R-E3): bis A-S19 „gesendet (Zustellung ungeprüft)“; abgewiesene Mail → Glocke + Kopfhinweis „anderen Kanal wählen“.
- Anrede (R-14): Vorlagen nutzen Rückfall „Guten Tag {Vorname Nachname}“, wenn keine Anrede vorhanden ist (Vorlagentext ph_service/Kanzlei).
- Fehler Server → Feldfehler, Dialog bleibt; Esc schließt ohne Aktion. Öffnen `--bo-dur-base`, Schließen `--bo-dur-fast`.

### 3.7 Lieferanten-Leiste (Tab „Regress & Abschluss“, ab Geprüft; R-02, R-03, P-03, P-04)

| Zustand | Anzeige | Primär |
|---|---|---|
| Lieferant haftet, Mängelanzeige offen (D-2) | „Mängelanzeige an Z GmbH offen – nach der Prüfung ohne Verzögerung senden“ (`warning-text`; Frist in Tagen erst mit Einstellung `ruege_tage`, Frage K4) | „Mängelanzeige senden“ (S4a) |
| Anzeige gesendet, Fall offen | „Angezeigt am 04.11. an bestellung@z.at · Regress PH-REG-… angelegt“ | – |
| Erledigt, Forderung ohne Betrag oder Regress Offen | „Forderung stellen bis 12.11. (§ 933b)“ bzw. „Kein § 933b – Vertragsansprüche prüfen“ (Unternehmerkunde, Kulanz) | „Forderung stellen“ (S4b) |
| Regress Gemeldet | „Gemeldet 20.11. – Frist gewahrt erst mit Anerkenntnis oder Klage · bis 12.01.“ (`danger-text` ab ≤ 14 Tage) | „Gutschrift erfassen“ / (A-S4) „Anerkenntnis erfassen“ |
| Anerkannt / Verrechnet | „Frist gewahrt (anerkannt 02.12.)“ (`success-text`) + Abgleich | „Gutschrift erfassen“ bis Ausgeglichen |
| Transportschaden mit Fremdspedition (P-R5) | „Schadensanzeige an Frachtführer: sichtbare Schäden bei Ablieferung, sonst laut Vertrag/CMR – prüfen“ | Felder `frachtfuehrer`, `vorbehalt_bei_ablieferung`, `schadensanzeige_am` **[Anfrage A-S20]**; bis dahin Kommentar-Vorlage „Schadensanzeige an … am …“ |
| Lieferant haftet nicht | „Lieferant haftet nicht laut Fehlercode.“ | sekundär „Trotzdem Mängelanzeige senden“ |

### 3.8 Website-Meldungen zuordnen (R-08)

Fälle mit `quelle = website` (nicht angemeldet) tragen das Kennzeichen „Zuordnung prüfen“ (neutral) und Banner ⑦ „Meldung über die Website mit E-Mail huber@… – gehört sie zu Fam. Huber?“ [Zuordnung bestätigen] (`set_value portal_sichtbar = 1` + Kommentar „Zuordnung bestätigt“) · [Anderem Kontakt zuordnen] (Link-Suche → `set_value kontakt`). Bis zur Bestätigung zeigt die Akte das Kennzeichen; `portal_sichtbar = 0` beim Anlegen und neuer Kontakt als Interessent **[Anfrage A-S14]**.

---

## 4. Workflows, Knöpfe, Massenaktionen, Assistenten

### 4.1 PH Servicefall – Workflow (aus `workflow.json`) und Methoden

| Von | Aktion | Nach | Rolle | Bedingung | UI |
|---|---|---|---|---|---|
| Gemeldet | Prüfung abschließen | Geprüft | Mitarbeiter | `fehlercode`, `mangel_bestaetigt != Offen` | S2 Teil 1; Kanban-Drop öffnet S2 |
| Geprüft | Entscheidung treffen | Entscheidung | Mitarbeiter | Entscheidung + Begründung; Kulanz über Schwelle → `kulanz_freigabe_status` Angefordert | S2 Teil 2 |
| Geprüft/Entscheidung | Ablehnen | Abgelehnt | Leitung | Begründung | Methode `ablehnen(grund, begruendung, kunde_informieren)` |
| Entscheidung | In Bearbeitung nehmen | In Bearbeitung | Mitarbeiter | nicht Abgelehnt, Kulanz freigegeben falls nötig | S2 in einem Vorgang; einzeln verzögert 8 s |
| In Bearbeitung | Einsatz planen | Einsatz geplant | Mitarbeiter | – | `einsatz_anlegen` (A14) |
| In Bearbeitung/Einsatz geplant | Erledigt melden | Erledigt | Mitarbeiter | `abschlussbericht` | `erledigt_melden` (S5) |
| Einsatz geplant | In Bearbeitung nehmen | In Bearbeitung | Mitarbeiter | – | automatisch durch `ereignisse.serviceeinsatz_aktualisiert` |
| Erledigt | Schließen | Geschlossen | Mitarbeiter | heute `kunde_informiert_am` oder `abnahme_bestaetigt`; UI zusätzlich D-3 + kein offener Lieferantenschritt | verzögert 8 s |
| Erledigt | Schließen | Geschlossen | Leitung | – | verzögert 8 s; Hinweis bei offenem Lieferantenschritt |
| Erledigt/Geschlossen | Wieder öffnen | In Bearbeitung | Leitung | – | Dialog Grund, `neu_oeffnen(grund)` |
| Abgelehnt | Wieder öffnen | Geprüft | Leitung | – | Workflow-Aktion |

Workflow-Aktionen über `apply_workflow(doc, action)`, vorher `get_transitions(doc)`; Serverfehler → Feldfehler im Sheet.

**Methoden-Knöpfe:**

| Knopf | Methode | Sichtbar wenn | Klasse (§4.2) |
|---|---|---|---|
| Telefonat erfassen | `erstreaktion_erfassen(kanal ∈ Telefon/Vor Ort/Rückruf, notiz)` | Gemeldet, `erstreaktion_am` leer | sofort, Dialog sm „Telefonat erfassen“ (Segment, Notiz 1 Zeile) |
| Einsatz planen | `einsatz_anlegen` | offen | Assistent A14 |
| Ersatzteile bestellen | `ersatzteile_bestellen(lieferant, zeilen, lieferadresse, wunschtermin)` | Zeile Benötigt ohne Bestellung | Assistent S3 |
| Kunde informieren | `kunde_informieren(vorlage, zusatz, betreff)` | E-Mail (sonst Kanalwahl §3.6) | Vorlagen-Mail bzw. Dialog |
| Mängelanzeige senden / Forderung stellen | `lieferant_informieren(empfaenger, zusatz)` (+ `set_value betrag_gefordert_cent` am Regress) | Lieferant gesetzt | Assistent S4a/S4b |
| Gutschrift erstellen | Faktura `PH Rechnung.gutschrift_erstellen(art, grund, erstattung_art)` (E4) | Entscheidung Preisminderung/Kulanz, Rechnung, keine Gutschrift | Dialog geldwirksam §4.7 |
| Erledigt melden | `erledigt_melden(abschlussbericht)` | In Bearbeitung/Einsatz geplant | Assistent S5 |
| Abnahme erfassen | `abnahme_erfassen(name, unterschrift, zufriedenheit, kommentar)` | Erledigt, `abnahme_bestaetigt = 0` | Canvas (§7-Regeln) |
| Ablehnen | `ablehnen(grund, begruendung, kunde_informieren)` | Leitung, Geprüft/Entschieden | Dialog rot; Schalter „Kunde per E-Mail informieren“ (Standard an mit E-Mail; ohne E-Mail: Hinweis „Ablehnung per Brief: nach dem Ablehnen ‚Kunde informieren‘ wählen“); Ablehnungsgrund „Frist abgelaufen“ nur wählbar, wenn `meldezustand = bei Meldung abgelaufen` und keine Garantie läuft (R-01, R-15) |
| Wieder öffnen | `neu_oeffnen(grund)` | Leitung | Dialog Grund |
| Kulanz erneut anfragen | `kulanz_anfordern()` | Angefordert, Mitarbeiter | sofort |
| Servicefall aus Dokument | `aus_dokument(doctype, name, …)` | Montage, Abnahme, Wareneingang, Lieferschein, Bestellung, Rechnung, Produktpass, Projekt | S1-Vollständig ab ② |
| Mahnsperre setzen/aufheben | Faktura `set_value PH Rechnung mahnsperre, mahnsperre_grund` | Bezug Rechnung | umkehrbar, Undo 8 s (P-R4) |
| Drucken | Print Formats §6 | immer | – |
| Storniert / Duplikat (P-R8) | **[Anfrage A-S21]** Endzustand „Storniert“ mit Grund und `duplikat_von` | – | bis dahin Leitung: „Ablehnen“ mit Grund „Sonstiges“ und Begründung „Doppelt angelegt: PH-SRV-…“ + Hinweis, dass der Fall in Quoten zählt |

### 4.2 Bestätigungsregel des Bereichs (eine Regel)

| Klasse | Beispiele | Verhalten |
|---|---|---|
| Umkehrbar intern | Zuweisen, Priorität, Kundenwunsch, Notiz, Foto „an Lieferant“, Ersatzteilzeilen-Status, Mahnsperre | sofort, Undo-Toast 8 s (Gegenaufruf mit altem Wert) |
| Statuswechsel ohne Außenwirkung, ohne Gegenmethode | Schließen (einzeln/Masse), In Bearbeitung nehmen (manuell), Umplanen, Technik Unterwegs/Starten | **verzögerter Commit** (04 §3.6 Variante A): optimistisch, Aufruf nach 8 s (Kiosk 5 s), `Z` bricht ab, `pagehide` committet sofort |
| Vorlagen-Mail ohne Freitext | Eingangsbestätigung, Terminvorschlag, Wartungserinnerung, Lieferant erinnern | verzögerter Versand 8 s (§4.6) |
| Mail mit Freitext/Anhangwahl | Abschluss mit Abnahmebestätigung, Mängelanzeige, Forderung, Ablehnung mit Zusatz, Bestellung senden | Dialog/Assistent mit Vorschau; Bestätigung im Dialog, kein Undo |
| Geld- oder rechtswirksam | Ablehnen, Wieder öffnen, Gutschrift erstellen, Kulanz freigeben/ablehnen (Zentrale-Komponente), Differenz ausbuchen, Widerruf/Einwilligung, Stornieren Bestellung, Einsatz absagen | Dialog (rot bei Ablehnen/Stornieren/Ausbuchen/Absagen) mit Folgen in einem Satz; kein Undo |

### 4.3 PH Serviceeinsatz – Methoden (kein Workflow)

| Knopf | Methode | Von → Nach | Nebenwirkung | Wer |
|---|---|---|---|---|
| Kunde hat bestätigt | `bestaetigen()` | Geplant → Bestätigt | `bestaetigt_kunde_am` | Backoffice, Techniker |
| Unterwegs | `unterwegs()` | Geplant/Bestätigt → Unterwegs | Verlauf | Techniker (verzögert 5 s) |
| Angekommen – Einsatz starten | `starten()` | → In Arbeit | `ankunft` | Techniker (verzögert 5 s, Zeit = Tipp) |
| Nicht angetroffen | `nicht_angetroffen(hinweis)` | → Nicht angetroffen | Folgeeinsatz nötig, Fall zurück | Techniker |
| Abschließen | `abschliessen(ergebnis, bericht, unterschrift, unterschrift_name, zufriedenheit, pause_min, unterschrift_art, bericht_senden)` | → Erledigt | Teile buchen, Kosten, Protokoll, Verlauf | Techniker |
| Bericht senden | `bericht_senden(empfaenger, zusatz)` | – | `bericht_gesendet_am` | Backoffice |
| Umplanen | `umplanen(datum, zeit_von, zeit_bis, techniker, grund)` | Geplant/Bestätigt → Geplant | `bestaetigt_kunde_am` leer, `umgeplant_am`, Termin nachgezogen | Backoffice (verzögert 8 s) |
| Einsatz absagen | `abbrechen(grund)` | → Abgebrochen | Termin storniert, Fall zurück | alle mit Schreibrecht |
| Folgeeinsatz | `folgeeinsatz_anlegen(datum, zeit_von, zeit_bis)` | – | neuer Einsatz | beide |
| Kalendertermin | `termin_anlegen()` | – | PH Termin | Backoffice |
| Status im Namen des Technikers | `unterwegs`/`starten` | – | Kommentar „gesetzt von … im Namen von …“ | Backoffice über `⋯` |

UI setzt **nie** `set_value status` am Einsatz (P-12).

### 4.4 Workflows Regress, Pflege Abo, Serviceauftrag

| Workflow | Übergänge (Aktion: Von → Nach · Rolle · Bedingung) | UI-Abweichung |
|---|---|---|
| PH Lieferantenregress | Beim Lieferanten melden: Offen → Gemeldet · Mitarbeiter · Betrag + Beschreibung · Regress anerkannt: Gemeldet → Anerkannt · `betrag_anerkannt_cent` · Regress abgelehnt: Gemeldet → Abgelehnt · Regress verrechnet: Anerkannt → Verrechnet · Leitung · Nummer/Beleg/Eingangsrechnung oder Form ≠ Gutschrift · Wieder öffnen: Abgelehnt → Gemeldet · Leitung | „Regress verrechnet“ nur bei Form Ersatzlieferung/Reparatur durch Hersteller; sonst `gutschrift_erfassen` (B-05) |
| PH Pflege Abo | Anbieten · Beenden · Aktivieren (Intervall + Bedingungsversion; Leitung ohne) · Pausieren · Fortsetzen · Kündigen (Leitung, `kuendigung_zum`) · Beenden · Wieder öffnen | Aktivieren bei Verbraucher mit Abschlussweg-Dialog (§2.9); Kündigung des Kunden: Datum Eingang + „zum“ im Dialog, frühester Termin mit Anfrage A-S17 |
| PH Serviceauftrag | Anbieten · Beauftragen (Preis oder Angebot) · Abholen (Positionen) · In Arbeit nehmen · Einlagern · Zurückbringen · Abrechnen (Leitung) · Stornieren (Leitung) | Abholen/Zurückbringen über `uebernahme_erfassen`/`rueckgabe_erfassen`; Abrechnen nur mit Rechnung |

Workflow-Leiste (03 §8.20): ein Vollknopf, weitere sekundär, gefährliche im `⋯` rot mit Dialog; fehlende Bedingung → Dialog „Dafür fehlt: Intervall, Bedingungsversion“ mit Sprunglinks.

### 4.5 Assistenten

| # | Assistent | Start | Schritte | Ausführung | Ergebnis |
|---|---|---|---|---|---|
| S1 | Servicefall melden | §2.3 | Schnell (ein Sheet) / Vollständig (4) | `insert` → optional `erstreaktion_erfassen` → optional Mahnsperre → optional Eingangsbestätigung | Toast bzw. Ergebniskarte |
| S2 | Prüfen & entscheiden (Sheet 640 px) | Akte, Zeile, Kanban-Drop | **Teil 1:** `mangel_bestaetigt` Segment Ja/Teilweise/Nein, `ursache`, `pruefergebnis`, Fehler bestätigen. **Teil 2:** Kacheln in VGG-Reihenfolge Verbesserung · Austausch · Preisminderung · Wandlung · Kulanz · Abgelehnt (`radiogroup`); Preisminderung/Wandlung bei Verbraucher + bestätigtem Mangel: Hinweis § 12 VGG per `aria-describedby` + Pflicht-Checkbox „Verbesserung/Austausch unmöglich, unverhältnismäßig oder gescheitert – in Begründung festgehalten“ mit Fehlertext; Abgelehnt nur Leitung; Begründung mit Textbausteinen (ausgeblendet, wenn der Code keine hat); Beträge `preisminderung_cent`/`kulanz_cent` als **„Betrag brutto an den Kunden“**, nur einer von beiden (Validierung UI, B-02); Hinweis Schwelle live; Art Garantie mit laufender Gewährleistung: „Gewährleistung läuft daneben – Kunde wählt“ | Primär „Entscheiden und in Bearbeitung nehmen“ = eine Server Action (`save` → `apply_workflow` Prüfung abschließen → Entscheidung treffen → In Bearbeitung nehmen), sekundär „Nur entscheiden“; mit Freigabebedarf Primär „Entscheiden und Freigabe anfragen“ (nur `save`/Workflow – die App benachrichtigt die Leitung); nur Teil 1: „Prüfung abschließen“ | Toast „Fall ist in Bearbeitung“; Teilfehler bleibt im erreichten Status + „Erneut“; nach Prüfung mit Lieferant haftet erscheint sofort „Mängelanzeige senden“ |
| A14 | Einsatz planen | §2.4.1 | 3 | 5 Teilschritte | Ergebniskarte |
| S3 | Ersatzteile bestellen (Sheet) | Bearbeitung, Zeile, „Hinzufügen und bestellen“ | ① Zeilen mit Checkbox (vorgewählt alle Benötigt bzw. die eine aus §3.5), Lieferant, Kostenträger, Lieferadresse, Wunschtermin ② Senden (Empfänger `bestell_email`, Text-/PDF-Vorschau) | `ersatzteile_bestellen(lieferant, zeilen, lieferadresse, wunschtermin)` → `senden(empfaenger, text)`; Sendefehler: Bestellung bleibt Entwurf | Karte mit Bestellnummer |
| S4a | Mängelanzeige senden (Sheet) | ab Geprüft, D-2 | ① Empfänger ② **Fotos** – immer sichtbar, wenn ein Foto mit `quelle in (Kunde, Techniker)` dabei ist; alle vorab **aus**; Hinweis „Nur das Produkt zeigen – Personen und Wohnungsdetails nicht senden“ ③ Zusatztext + PDF-Vorschau „Reklamationsmeldung“ (ohne Betrag) | `save` (Foto-Häkchen) → `lieferant_informieren(empfaenger, zusatz)` (legt Regress an, Status Gemeldet, Forderung = bisher regressfähige Kosten, kann 0 sein); Methode `maengelanzeige_senden` und Felder `maengelanzeige_am/_an` **[Anfrage A-S2]** | Karte „Mängelanzeige an bestellung@z.at gesendet · Regress PH-REG-… angelegt (Forderung folgt nach Erledigung)“ |
| S4b | Forderung stellen (Sheet) | nach Erledigung | ① Betrag (vorbelegt regressfähige Kosten netto, editierbar) ② Zusatztext + Vorschau | Regress vorhanden: `set_value betrag_gefordert_cent` → `erinnern(empfaenger)` mit Forderungstext (Vorlage „Regressforderung“ **[Anfrage A-S4]**, bis dahin Text im Zusatz); kein Regress: `lieferant_informieren` | Karte „Forderung 420,00 € an Z GmbH · Frist bis 12.11. – gewahrt erst mit Anerkenntnis“ |
| S5 | Erledigt melden & abschließen | In Bearbeitung/Einsatz geplant | ① Abschlussbericht (vorbelegt aus letztem Einsatz, Baustein `kundentext`) ② **Bestätigung durch den Kunden**: „Liegt vor (Einsatz vom 07.11.: Unterschrift/Name bestätigt)“ vorgewählt, wenn der letzte Einsatz `unterschrift_art` Unterschrift oder Name bestätigt hat · „Kunde ist hier – unterschreiben“ (Canvas §7) · „Ausgedruckt übergeben“ (ohne E-Mail) · „Ohne Bestätigung abschließen“; Einsatz mit „Verweigert“/„Kunde abwesend“ wird als Text gezeigt, nicht als Abnahme ③ Kunde informieren (§3.6, Vorlage `abschluss`) ④ Zusammenfassung: offene Ersatzteilzeilen gewarnt; „Fall gleich schließen“ **nur**, wenn D-3 erfüllt wird und keine Zeile 8/17 offen ist – sonst Satz „Schließen nach ‚Forderung stellen‘ (Regressfrist bis 12.11.)“; Mahnsperre gesetzt → Inline-Frage „Mahnsperre auf RE-… aufheben? [Aufheben] [Behalten]“ | `erledigt_melden` → optional `abnahme_erfassen` → optional `kunde_informieren("abschluss")` bzw. Kanal → optional Mahnsperre aufheben → optional `apply_workflow("Schließen")` | Erfolgsmoment „Servicefall erledigt · Durchlaufzeit 9 Tage“; Knöpfe „Forderung stellen“ (wenn offen), „Nächster Fall“ |
| S6 | Ersatzteil-Wareneingang | §2.7 | Mengen → Buchen | `wareneingang(mengen)` | Toast |
| S7 | Protokoll erfassen | Pflege-Abo, Technik | Datum, Leistungen, Messwerte, Pflegemittel, im Portal | `protokoll_erfassen(...)` | Toast „Protokoll gespeichert · nächster Termin …“ |
| S8 | Übernahme/Rückgabe (iPad) | Serviceauftrag | Stücke mit Zustand + Foto → Lagerplatz → Unterschrift (Vollbild-Sheet, Canvas §7) | `uebernahme_erfassen` / `rueckgabe_erfassen` (+ Workflow) | PDF Übernahmeliste |
| S9 | Austausch abwickeln (P-R1) **[Stufe 2, Anfrage A-S6]** | Entscheidung Austausch | ① Ersatzware: Herstellerbestellung (Logistik/Sortiment) mit Kommission Fall ② Lieferung 0 € + Abholung Altware im selben Termin (Tour) ③ Übergabe Ersatzstück dokumentieren (Fristbeginn – Kanzlei K2) | `austausch_bestellen()`, Lieferschein mit `servicefall`, Wareneingang Retoure | Fall bleibt In Bearbeitung bis Altware zurück und Ersatz zugestellt |
| S10 | Rückabwicklung (P-R2) **[Stufe 2, Anfrage A-S7]** | Entscheidung Wandlung | ① Umfang (Rechnung/Positionen, Menge) ② Rücknahme (Abholtermin, Zustand, Wareneingang Retoure) ③ Geld (Gutschrift Storno/Teilgutschrift mit USt, Erstattung Rückzahlung/Verrechnung, Anzahlungen) ④ Folgen-Satz „nimmt 1 Sofa zurück, storniert 2.400,00 € inkl. 400,00 € USt, zahlt 2.400,00 € zurück“; Dialog rot, kein Undo | Faktura + Logistik; Leerzustand ①: „Keine Rechnung verknüpft – Rückabwicklung braucht Rechnung oder Auftrag.“ [Bezug wählen] | Teilfehler-Karte; Erledigt erst nach Rücknahme + Erstattung |

**Bis Stufe 2:** Entscheidung Austausch → Karte „Austausch: Ersatzware über Logistik bestellen“ [Zur Herstellerbestellung] (`/logistik/…?servicefall=`); Wandlung → Karte „Rückabwicklung: Rücknahme in Logistik, Gutschrift in Faktura“ mit zwei Links; Fall wird erst mit beiden Bestätigungen (Kommentar je Schritt) „Erledigt melden“-fähig (Hinweistext, keine Sperre).

**Teilfehler-Regel (alle Assistenten, Technik-Warteschlange):** Ergebniskarte listet jeden Teilschritt (✓ erledigt · ✗ fehlgeschlagen mit Servertext · – übersprungen); angelegte Datensätze werden nie zurückgerollt; „Erneut“ nur am fehlgeschlagenen Schritt (eigener `idempotency_key`, kein zweiter Einsatz/Fall); offene Teilschritte als Banner ① im Akte-Kopf („1 Schritt nicht ausgeführt: Terminvorschlag · Erneut · Verwerfen“). Letzter Schritt jedes Assistenten nennt die Folgen in einem Satz.

### 4.6 Mails: verzögerter Versand (N7)

- Vorlagen-Mail ohne Freitext: Toast „Eingangsbestätigung an huber@beispiel.at wird gesendet – ansehen“ (Link im Text) · **ein** Knopf „Rückgängig“; Balken 8 s `--bo-ease-linear`; Hover/Fokus pausiert; Ansage „Rückgängig mit Z“. Parallel Zeitleisten-Zeile „Wird gesendet in 7 s · Ansehen · Nicht senden“.
- **„Ansehen“ pausiert den Timer** und öffnet die Vorlage im Sheet; Sheet-Fuß „Jetzt senden“ (Primär) · „Nicht senden“; Schließen setzt den Timer mit dem Rest fort.
- Keine Mail aus einem anderen Toast heraus: „Kunde informieren“ nach dem Umplanen ist Primärknopf der Einsatz-Akte bzw. Zeile in „Jetzt dran“, nicht Toast-Aktion.
- Mehrere Toasts: `Z` macht den jüngsten rückgängig; jeder Toast trägt sein Objekt im Text.
- **Fehler nach Ablauf** (Seite verlassen, Server-Fehler): Glocken-Eintrag (hoch) „Eingangsbestätigung an … nicht gesendet: <Grund>“ + Banner ⑥ in der Akte + Zeitleistenzeile `circle-x` mit „Erneut“. Ausführung über den Backoffice-Server (Job mit `idempotency_key`, läuft auch nach Seitenwechsel; `pagehide` committet sofort).
- Adresse im Backoffice unmaskiert (Maskierung nur Portal/Logs).

### 4.7 Gutschrift an den Kunden (B-01, P-07, R-A1, R-S1, R-S2)

- **Knopf „Gutschrift erstellen“** (Karte Geld, Bearbeitung): Dialog geldwirksam: „Gutschrift zu RE-2026-00040 vom 14.03.2026 als Entwurf anlegen? Betrag 120,00 € brutto (an den Kunden). Positionen und USt kommen aus der Rechnung; du prüfst den Entwurf in Faktura.“ Feld Erstattung: Rückzahlung · Verrechnung · keine. Primär „Entwurf anlegen“ → Server Action ruft **Faktura** `PH Rechnung.gutschrift_erstellen(art = Wertminderung|Kulanz, grund = "Servicefall PH-SRV-…: <Begründung>", erstattung_art)` → danach `set_value PH Servicefall gutschrift` (Feld ist read-only; Server Action prüft im Mock/Test, dass das API-Schreiben erlaubt ist, sonst Kommentar mit Link) + Kommentar. Ergebnis: Toast „Gutschrift-Entwurf GU-… angelegt · In Faktura öffnen“.
- Die ph_service-Methode `gutschrift_erstellen` wird nicht aufgerufen, bis A-S7 USt/Währung/Pflichtfelder liefert.
- **Ohne Schlussrechnung (R-A1):** Satz „Noch keine Rechnung – Minderung in der Schlussrechnung abziehen“ + Link „Zum Auftrag AB-…“ (Faktura); Methode `minderung_vormerken` **[Anfrage A-S7]**.
- **Mehrfach:** vor dem Anlegen prüft die Server Action die Summe vorhandener Gutschriften zur Rechnung (Faktura-Liste) und blockiert, wenn Rechnungsbetrag überschritten würde (Text „Gutschriften zu RE-… erreichen den Rechnungsbetrag“). Storno der Gutschrift in Faktura → Chip „Gutschrift storniert“ am Fall (Hook `on_cancel` **[Anfrage A-S7]**; bis dahin liest die Akte den Status der verknüpften Gutschrift).
- **Währung (R-W1):** Beträge in der Akte in der Rechnungswährung der verknüpften Rechnung anzeigen, sobald `PH Servicefall.waehrung` existiert **[Anfrage A-S13]**; bis dahin bei Rechnung in CHF Hinweis „Rechnung in CHF – Betrag in CHF eintragen und im Entwurf prüfen“; Kosten intern immer EUR.

### 4.8 Kostenpflichtige Leistung (P-R3, R-11) – [Stufe 2, Anfrage A-S8]

Entscheidung „Kostenpflichtig“ (neuer Wert), Kostenhinweis Pflicht (`kosten_hinweis_am`, `_kanal`), Kostenvoranschlag als Angebot in Faktura, Abrechnung `kosten_verrechnen()` → Rechnungsentwurf aus Zeiten × `stundensatz_cent`, Anfahrt, Teilen mit Kostenträger Kunde; `kosten_kunde_cent` read-only aus der Rechnung; Schließen erst mit Rechnung. **Bis dahin:** Kostenhinweis in A14 (§2.4.1), Feld `kosten_kunde_cent` read-only im UI mit Satz „Kosten an den Kunden über Faktura verrechnen“ + Link „Rechnung in Faktura erstellen“.

### 4.9 Kulanz-Freigabe (Leitung) – Zentrale-Komponente

Service liefert `lib/backoffice/service/freigaben.js` nach Zentrale §3.5.2: `{ id, doctype: "PH Servicefall", name, art: "Kulanz", titel, betrag_cent: kulanz_cent, waehrung: "EUR", antragsteller: verantwortlich, eigener_antrag, frist: null, geldwirksam: true, freigeben: { methode: "kulanz_freigeben", args: { betrag_cent, kommentar } }, ablehnen: { methode: "kulanz_ablehnen", grund_pflicht: true } }` für alle Fälle mit `kulanz_freigabe_status = Angefordert`. Darstellung, Vier-Augen („Eigener Antrag – zweite Person nötig“), Bestätigen-Dialog mit Betrag, Ablehnen mit Pflichtgrund und verzögertem Senden 8 s, Dubletten-Regel (ToDo „Kulanz-Freigabe“ nur als Freigabe) regelt die Zentrale. Betrag geändert → Servertext im Eintrag + „Akte öffnen“. Bei 390 px Eintrag als Vollbild-Sheet von unten.

---

## 5. Kennzahlen, Charts, GF-Zentrale

| Kachel | Quelle | Berechnung | Rolle | Klickziel |
|---|---|---|---|---|
| Offene Servicefälle | Number Card „PH Offene Servicefälle“ | `status in OFFEN` | Mitarbeiter, Leitung, GF | Liste offen |
| Reaktion überfällig | `kennzahlen.ueberfaellige_reaktion` | D-1 | Heute-Leiste, GF | Reiter |
| Gewährleistung endet ≤ 60 Tage | `kennzahlen.fristen_laufen_ab` | offen, `gewaehrleistung_bis ≤ heute + fristwarnung_tage` | Mitarbeiter, Leitung | Reiter |
| Einsätze diese Woche | `kennzahlen.einsaetze_diese_woche` | Mo–So, nicht Abgebrochen; Techniker: eigene | alle + Techniker | Kalender |
| Regress offen (€) | `kennzahlen.regress_offen_cent` | gefordert (Offen/Gemeldet) bzw. anerkannt − erhalten (Anerkannt) | Leitung, GF | Regress |
| Ersatzteile unter Mindestbestand | `kennzahlen.ersatzteile_unter_mindestbestand` | `verfuegbar < mindestbestand`, Bestand geführt | Mitarbeiter, Leitung | Reiter |
| Wartungen überfällig | `kennzahlen.wartungen_ueberfaellig` | Aktiv, `ueberfaellig` | Heute-Leiste | Reiter |
| Ø Durchlaufzeit (90 Tage) | `kennzahlen.durchlaufzeit_quartal` | Mittel `dauer_tage`, Basis „aus n Fällen“ | Leitung, GF | Erledigt |
| Einsätze unbestätigt | `getCount PH Serviceeinsatz` (Geplant, `bestaetigt_kunde_am` leer, `datum ≥ heute`) | – | Mitarbeiter | Reiter |
| Ersatzteile erwartet diese Woche | `getCount PH Ersatzteilbestellung` (`erwartet_am` in Woche) | – | Mitarbeiter | Reiter |

| Rolle | Heute-Leiste | Kacheln (max. 6) |
|---|---|---|
| Mitarbeiter | Reaktion überfällig · Mängelanzeige offen · Regressfrist ≤ 14 Tage · Wartungen überfällig | Offene Fälle · Gewährleistung endet ≤ 60 Tage · Einsätze diese Woche · Ersatzteile unter Mindest · Einsätze unbestätigt · Ersatzteile erwartet |
| Leitung | wie Mitarbeiter + Kulanz-Freigaben | Offene Fälle · Gewährleistung endet · Einsätze diese Woche · Regress offen € · Ersatzteile unter Mindest · Ø Durchlaufzeit |
| GF | – | Offene Fälle · Regress offen € · Ø Durchlaufzeit · Kosten nach Regress (Monat, netto) |
| Techniker | Einsätze heute (eigene, als Liste) | Einsätze diese Woche (eigene) |

Kennzahl-Karte nach 03 §8.14; Trend nur bei „Offene Servicefälle“ („2 mehr als Vorwoche“, steigend `warning`, `aria-label`); Hochzählen nach Zentrale-Regel. Charts (Leitung/GF): Fälle je Monat (Balken 12), Nach Art (Donut ≤ 5 + „Weitere“), Nach Fehlerbereich (Balken einfarbig `chart-1`, Bereichsfarbe nur als Punkt mit Ring `line-control`), Nach Marke, Regress nach Status (€); je Chart `<details>`-Tabelle. **GF-Zentrale** übernimmt Offene Servicefälle, Reaktion überfällig (D-1), Regress offen €, Kosten nach Regress laufender Monat (Report `PH Servicekosten`).

---

## 6. Druck / PDF

| Dokument | Print Format | Auslöser | Besonderheiten |
|---|---|---|---|
| Reklamationsmeldung an Hersteller | `PH Servicefall Reklamationsmeldung` | S4a/S4b (Anhang), Akte `⋯`, Massendruck | nur Fotos mit `an_lieferant = 1`; Fehlercode, Seriennummer; Betrag nur bei Forderung |
| Abnahmebestätigung | `PH Servicefall Abnahmebestätigung` | S5, Akte, Brief-Kanal | nur de; en/fr/it Inhaber-Entscheid Nr. 14 |
| Servicebericht | `PH Servicebericht` | Einsatz-Akte, `bericht_senden` | Bericht, Fotos, Teile, Zeiten inkl. Pause, Bestätigungsart |
| Ersatzteilbestellung | `PH Ersatzteilbestellung` | `senden`, Akte | Positionen, Kommission |
| Pflegeprotokoll | `PH Pflegeprotokoll` | Pflege-Akte, S7 | `im_portal` |
| Übernahmeliste | `PH Serviceauftrag Übernahmeliste` | S8 | Stücke, Zustand, Fotos, zwei Unterschriften |
| Brief an Kunden (Eingang, Termin, Abschluss, Ablehnung) | **[Anfrage A-S3]** je Vorlage, Adressfeld für Fensterkuvert | Kanal „Brief“ (§3.6) | bis dahin nur Abschluss über Abnahmebestätigung |
| Etikett Ersatzteil 62×29 | Print-Pfad Lager (Logistik) | Akte/Masse | Code 128 `hersteller_nr` |
| Listen/Berichte | `@media print` | `Strg+P` | Filter als Kopfzeile, A4 quer ab 7 Spalten |

Weg `/druck/[doctype]/[name]?format=` (Vorschau im Panel, `--bo-dur-move`), `/druck/…/pdf`. Mails mit PDF nur über App-Methoden. Fehler „PDF konnte nicht erzeugt werden – HTML-Vorschau drucken?“.

---

## 7. Technik mobil `/technik` (T7, Kiosk, Telefon 390 px und iPad)

Arbeitsplatz-Kachel „Technik – Einsätze unterwegs, Fotos, Unterschrift“. Kein Backoffice-Chrome; untere Tableiste 64 px + safe-area: **Heute** · **Woche** · **Suche** · **Ich**. Hoch- und Querformat, nie `screen.orientation.lock`. Touch ≥ 48 px, Schrift 16 px, Status 18 px, keine Hover-Zustände, Bewegung halbiert (04 §4). Hell/dunkel folgt dem System, Schalter in „Ich“.

```
┌ Technik · T. Steiner  ● online  [Aktualisieren] ┐  ┌ ‹ Heute    Einsatz PH-SRE-2026-00044          ┐
│ HEUTE · Di 04.11.    Zuletzt aktualisiert 07:42 │  │ Fam. Huber                    ● Bestätigt     │
│ ┌─────────────────────────────────────────────┐ │  │ Seestraße 3, 6911 Lochau  [(navigation) Route]│
│ │ 08:00–12:00  ● Bestätigt                    │ │  │ +43 …  [(phone) Anrufen]       08:00–12:00    │
│ │ Fam. Huber · Lochau                         │ │  ├───────────────────────────────────────────────┤
│ │ Reparatur · Sofa X · POL-01 Nahtriss        │ │  │ FALL PH-SRV-2026-00031 · Mangel               │
│ │ Mitnehmen: Polsterset, Nähgarn              │ │  │ Prüfhinweis: Naht auf Spannung prüfen …       │
│ └─────────────────────────────────────────────┘ │  │ Mitnehmen: [check] Polsterset [check] Nähgarn │
│ ┌─────────────────────────────────────────────┐ │  │ Fotos Kunde [img][img]                        │
│ │ 14:00–16:00  ○ Geplant · unbestätigt        │ │  ├───────────────────────────────────────────────┤
│ │ Hotel Alpenrose · Bregenz                   │ │  │ [(camera) Foto vorher] [(camera) Foto nachher]│ 64 px
│ └─────────────────────────────────────────────┘ │  │           Nicht angetroffen                   │ Text, 48 px
├───────────┬───────────┬───────────┬─────────────┤  │ ┌───────────────────────────────────────────┐ │
│ Heute     │ Woche     │ Suche     │ Ich         │  │ │             UNTERWEGS (56 px)             │ │ einziger Primär
└───────────┴───────────┴───────────┴─────────────┘  │ └───────────────────────────────────────────┘ │
                                                     └───────────────────────────────────────────────┘
```

- **Erstbesuch:** Satz „Erfasst werden Status-Zeiten, Fotos, Bericht und Bestätigung des Kunden je Einsatz. Ausgewertet wird je Fall, nicht je Person.“ (R-13; Text mit Inhaber/Kanzlei K8 abstimmen.) Startprüfung `display-mode: standalone`; sonst Band `info-soft` „Für Arbeiten ohne Netz: Technik zum Home-Bildschirm hinzufügen“ + Anleitung (3 Schritte) – WebKit löscht Website-Speicher nach 7 Tagen ohne Nutzung, Home-Bildschirm-Apps sind ausgenommen.
- **Technik kassiert nicht (R-12):** Schirm „Ich“ und Einsatz-Karte zeigen bei Fragen nach Zahlung den Satz „Zahlung vor Ort: nur per Rechnung oder über die Kassa“; Verkauf vor Ort → Knopf „Bedarf ans Büro melden“ (Kommentar am Fall + ToDo Verantwortlicher).
- **Heute:** Einsätze mit `techniker = ich or techniker_2 = ich`, `datum = heute`, nach `zeit_von`; Kennzeichen „unbestätigt“ ausgeschrieben; Leer „Heute keine Einsätze.“ [Morgen ansehen]. Aktualisieren: Knopf 44 px + `visibilitychange` + `/api/ereignisse`.
- **Einsatz-Karte:** Route (`maps://` bzw. Google-Maps-Link), Anrufen (`tel:`), Fall lesend (ohne Kosten), Fehlercode-Wissen, `mitzubringen` als lokale Checkliste (IndexedDB je Einsatz), Kundenfotos im Vollbild-Betrachter (Pinch, Wischen, `x` 48 px).
- **Genau ein Primärknopf, 56 px, wechselt mit Status:** Geplant/Bestätigt → „Unterwegs“ · Unterwegs → „Angekommen – Einsatz starten“ · In Arbeit → „Abschließen“ · Erledigt → Zeile „Erledigt 11:40 · Bericht übertragen“. **Unterwegs/Starten verzögert 5 s:** Toast oben Mitte „Ankunft 08:05 gemeldet · Rückgängig“ (Ankunft = Zeit des Tipps, wird als Parameter mitgegeben, sobald `starten(zeit)` existiert **[Anfrage A-S10]**; bis dahin Zeit des Commits, Text „Ankunft gemeldet“ ohne Uhrzeit); offline gleich, Aktion geht nach Ablauf in die Warteschlange. Druck-Zustand `background-color` → `surface-3`, `--bo-dur-ack`; Doppeltipp-Sperre 600 ms; Knopftext-Crossfade `--bo-dur-fast`.
- **„Nicht angetroffen“** nur in Unterwegs/In Arbeit, Textknopf 48 px **über** dem Primär mit 16 px Abstand. Sheet: Hinweis* mit Chips „Niemand da“, „Kein Zugang“, „Kunde verschoben“ → `nicht_angetroffen(hinweis)`; Foto der Tür optional.
- **Fotos:** zwei Knöpfe 64 px; `<input capture="environment">`, Phase vorgewählt (vorher/während/nachher); clientseitig 1600 px längste Kante, ≤ 600 KB, EXIF-Zeit → `PH Serviceeinsatz Foto` (`bild`, `phase`, `zeit`). **Kamera verweigert:** Karte „Kamera ist nicht freigegeben. iPhone-Einstellungen › Safari › Kamera.“ + Knopf „Foto aus Mediathek“ (`<input accept="image/*">` ohne `capture`). Warteschlange „2 Fotos · 1,1 MB warten“; ab 50 MB „Speicher wird knapp – bitte WLAN suchen“.
- **Abschließen (4 Schirme, „2 von 4“ oben, kein Auto-Weiter):**
  ① Ergebnis-Kacheln 64 px (Behoben · Teilweise behoben · Nicht behoben · Weiterer Einsatz nötig · Ersatzteil nötig · Kein Mangel festgestellt) – Tipp wählt (Haken, `aria-checked`), „Weiter“ fest unten 56 px.
  ② Teile & Zeit: verbrauchte Ersatzteile (vorbelegt nur Zeilen mit Status **Aus Bestand** → `aus_bestand = 1`; Zeilen Eingetroffen/Kommission → `aus_bestand = 0`, D10), Menge `−`/`+` 48 px; „+ Benötigtes Teil notieren“ (Bezeichnung, Foto, Menge) → nach dem Abschluss eigener Teilschritt `save` am Fall mit Zeile Benötigt (Parameter `benoetigt[]` **[Anfrage A-S10]**); **Pause** Chips 0 · 15 · 30 · 45 · 60 min (Standard 0) mit Satz „Arbeitszeit 2 h 15 min (08:05–10:50, ohne Pause)“.
  ③ Bericht: Textfeld (Hinweis „Mikrofon-Taste der Tastatur nutzen“), Baustein „Standardlösung übernehmen“, Fotos nachher prüfen.
  ④ Bestätigung (Wireframe unten): Segment 48 px Unterschrift · Name bestätigt · Kunde abwesend · Verweigert; Canvas nur bei Unterschrift (Hochformat 358 × 180, Querformat 640 × 220, Mindesthöhe 160, Rand `line-control`, `aria-label="Unterschriftsfeld"`, nach Zeichnen `role="img"` „Unterschrift erfasst“, „Löschen und neu“ ≥ 48 px); Wechsel blendet Canvas per `grid-template-rows` (`--bo-dur-base`) aus; „Verweigert“ → Pflichtfeld Hinweis; Name vorbelegt; Zufriedenheit optional; Schalter „Servicebericht an Kunden senden“ (nur mit E-Mail, Standard aus). „Fertig“ = `abschliessen(ergebnis, bericht, unterschrift, unterschrift_name, zufriedenheit, pause_min, unterschrift_art, bericht_senden)` → Erfolgsmoment (Häkchen `--bo-dur-draw` `--bo-ease-inout`), Knöpfe „Folgeeinsatz vorschlagen“, „Nächster Einsatz“.

```
┌ ‹ Zurück        Abschließen · 4 von 4 ┐
│ Bestätigung durch den Kunden           │
│ [Unterschrift][Name bestätigt]         │  Segment 48 px, 2 × 2
│ [Kunde abwesend][Verweigert]           │
│ ┌────────────────────────────────────┐ │
│ │                                    │ │  Canvas 358 × 180
│ └────────────────────────────────────┘ │
│ Name  [Fam. Huber                    ] │
│ Zufriedenheit (5 Sterne, optional)     │
│ [ ] Servicebericht an Kunden senden    │
│ ┌────────────────────────────────────┐ │
│ │               FERTIG               │ │  56 px, einziger Primär
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

- **Bestandsfehler beim Abschluss (P-20):** Server-Fehler „Bestand … würde negativ“ darf die Warteschlange nicht blockieren: Client sendet bei diesem Fehler den Abschluss erneut ohne die betroffene Teilzeile (`aus_bestand = 0`) und legt ein ToDo an den Verantwortlichen „Ersatzteil … Bestand prüfen“; Ergebnis „Einsatz erledigt · 1 Teil nicht gebucht – Büro prüft“. Serverseitig als Teilfehler **[Anfrage A-S10]**.
- **Woche / Suche / Ich:** Woche Mo–So nach Tag; Suche Fälle und Ersatzteile, Scanner über Kamera mit Hinweis vor der Freigabe; Ich: Bedienerwechsel (PIN), Warteschlange („3 Aktionen warten“ / „Alles übertragen · 07:42“), Dichte, Schema, Abmelden (gesperrt bei wartender Warteschlange mit Warnung; Neuladen ebenfalls gesperrt, solange nicht installiert).
- **Sperre:** 60 min Idle; keine Sperre, solange ein eigener Einsatz „In Arbeit“ ist; 30-s-Band „Sperre in 30 s · Weiterarbeiten“ (reduziert: Countdown-Text).
- **Offline (05 §12.5):** Cache heute + morgen: Einsätze, Fälle mit Fehlercode-Wissen, Ersatzteilzeilen, Kundenfoto-Thumbnails 400 px, Pflege-Leistungen. Aktionen mit `idempotency_key` in Reihenfolge; Band „Offline – 3 Aktionen warten“ (`warning-soft`, `wifi-off`); Rückkehr „Wieder online – übertragen“ 4 s; Teilfehler „2 von 3 übertragen – 1 wartet: Foto 0,6 MB“. Konflikt (umgeplant): Band „Termin geändert: jetzt 14:00 – Backoffice anrufen“ [Anrufen]; `umplanen` des Backoffice wirkt nur vor Abfahrt (Server).
- **Pflege-/Wartungseinsätze:** Vertrag, Stücke, Leistungen als Checkliste, Messwerte; Abschluss schreibt Protokoll.
- **Packtisch (Logistik-Kiosk), Kachel „Ersatzteile“:** Scan → S6 mit Zahlenblock 56 px; Überlauf „Position bereits vollständig“.

---

## 8. Automationen und Erinnerungen

| Auslöser | App-Funktion | Wirkung im Backoffice |
|---|---|---|
| 06:30 täglich | `fristen_pruefen`: Gewährleistung endet ≤ `fristwarnung_tage`, Regress Offen mit Frist ≤ 14 Tage, Reaktionsfrist überschritten → ToDo | Glocke (hoch) mit Primäraktion; Heute-Leiste; Zeile rot. ToDo „Reaktionsfrist“ schließt nur `erstreaktion_erfassen`/Mail (keine Wiederkehr, weil `erstreaktion_am` dann gesetzt ist) |
| 06:30 täglich | `eskalation` (ohne Bewegung > `eskalation_tage`) + SLA-Eskalation | Kennzeichen „Eskalation n“ (eine Zahl, Max beider Stufen), Reiter Eskaliert; Kanban „ruht seit n Tagen“ ab `eskalation_tage − 1` |
| Prioritätswechsel | SLA-Fristen neu, Verlauf „SLA“ | SLA-Zeile aktualisiert |
| 06:45 täglich | `wartungserinnerungen` (Erinnerung, überfällig, Nachkauf nur mit Einwilligung) | Pflege-Reiter, Banner, Glocke |
| Mo 07:00 | `wochenuebersicht` | – |
| Einsatz Erledigt/Nicht angetroffen/Abgebrochen | `serviceeinsatz_aktualisiert` → Fall In Bearbeitung | Primär „Erledigt melden“ bzw. „Folgeeinsatz planen“ |
| Regress gespeichert | `regress_aktualisiert` → Summen/Status in den Fall | Lieferanten-Leiste, Kosten |
| Kulanz angefordert/abgelehnt | ToDo + Benachrichtigung (App) | Freigabe in Zentrale/Glocke; ToDo „Kulanz abgelehnt“ an Verantwortliche → Banner |
| Kommentar | `kommentar_eingefuegt` → `letzte_bewegung` | verhindert falsche Eskalation |
| Mail gesendet | `sende_vorlage` → Verlauf, `kunde_informiert_am`, ggf. `erstreaktion_am` | Zeitleiste, nächster Schritt |
| Portal/Website-Meldung | `portal_create_service_case` / `create_service_case` | Glocke Team; Reiter „Neu von Kunden“; Website: „Zuordnung prüfen“ |
| Portal-Bewertung | `portal_rate_service_case` | Abschluss-Abschnitt |
| Monatlich (Anfrage A-S18) | `aufbewahrung_pruefen` mit Vorschau | Tab „Aufbewahrung“ (Leitung): Tabelle Fall · Aktion · Grund · Frist, „Anonymisieren (n)“ Dialog rot |

Clientseitig: beim Verlassen der Akte mit offener Erstreaktion einmal je Sitzung und Fall Toast `info` 6 s „Kunde noch nicht kontaktiert – Eingangsbestätigung senden oder Telefonat erfassen“ (kein Dialog).

---

## 9. Datenmapping UI → Frappe

| UI-Funktion | Frappe (vorhanden) | Lücke |
|---|---|---|
| Liste Fälle | `get_list PH Servicefall` (Felder: `name,titel,art,status,prioritaet,gemeldet_am,kanal,verantwortlich,frist_reaktion,frist_loesung,sla_status,erstreaktion_am,kontakt,kunde_name,kundentyp,marke,fehlercode,fehlercode_bezeichnung,lieferantenrelevant,mangel_bestaetigt,gewaehrleistung_bis,beweislast_bis,gemeldet_am,erstauftreten,regress_frist_bis,regress_status,entscheidung,kulanz_freigabe_status,eskalationsstufe,sla_eskalationsstufe,letzte_bewegung,einsatz_ort,quelle`) + `get_next_steps(names)` | Reiterzähler in einem Aufruf (A-S15) |
| Akte | `get_service_case_file(name)` + `get_docinfo` | – |
| Nächster Schritt | `get_next_steps` / `naechsterSchritt` | Zeilen 2, 8, 11, 13, 15, 18 (A-S2, A-S3) |
| Fristband | gespeicherte Fristfelder; Einstellungen lesbar | `fristen_status_bei_meldung`, `fristen(stichtag)`, `fristen_info` mit `sachart` (A-S1); Quellen-Reihenfolge (A-S5) |
| Telefonat erfassen | `erstreaktion_erfassen(kanal, notiz)` | – |
| Kulanz | `kulanz_anfordern`, `kulanz_freigeben`, `kulanz_ablehnen` | – |
| Kunde informieren | `kunde_informieren(vorlage, zusatz, betreff)` | Kanal Brief/Telefon/Persönlich, `abschluss_informiert_am`, Brief-Druckformate (A-S3); Zustellstatus (A-S19) |
| Mängelanzeige / Forderung | `lieferant_informieren`, `regress_anlegen`, Regress `set_value betrag_gefordert_cent`, `erinnern` | `maengelanzeige_senden`, Felder, `ruege_tage` (A-S2); Vorlage Forderung, Rechtsgrundlage/Anerkenntnis (A-S4) |
| Regress-Abgleich | `gutschrift_erfassen`, `differenz_ausbuchen` | steuerliche Art (A-S12), Währung (A-S13) |
| Gutschrift an Kunden | Faktura `PH Rechnung.gutschrift_erstellen(art, grund, erstattung_art)`; `set_value PH Servicefall gutschrift` | ph_service `gutschrift_erstellen` mit USt/Währung, `minderung_vormerken`, `on_cancel`-Hook (A-S7) |
| Mahnsperre | Faktura `set_value PH Rechnung mahnsperre, mahnsperre_grund` | `mahnsperre_setzen(an)` am Fall (A-S7, optional) |
| Einsatz planen | `einsatz_anlegen`, `get_technician_slots`, `set_value` Zusatzfelder, `termin_anlegen` | – |
| Umplanen / Absagen | `umplanen`, `abbrechen` | – |
| Einsatz abschließen | `abschliessen(…, pause_min, unterschrift_art, bericht_senden)`, `bericht_senden` | `benoetigt[]`, Teilfehler Bestand, `starten(zeit)` (A-S10) |
| Ersatzteile | `ersatzteile_bestellen(lieferant, zeilen, …)`, `senden`, `als_gesendet`, `bestaetigen`, `wareneingang`, `stornieren`, Ersatzteil `bewegung_buchen` | Minus-Arten, `rest_stornieren`, Storno-Sperre ab Teilgeliefert, Stichtagsreport, Altteil (A-S11) |
| Fotos | `upload_file` (privat) + Zeile `fotos` mit `quelle`, `an_lieferant = 0` | Standard 0 serverseitig (A-S14) |
| Website-Zuordnung | `set_value portal_sichtbar`, `set_value kontakt` | `kontakt_bestaetigt`, Interessent (A-S14) |
| Pflege-Einwilligung | `set_value nachkauf_einwilligung` (0 = Widerruf) | `einwilligung_erfassen`, read-only (A-S17) |
| FAGG/KSchG | Kommentar mit festem Text | Felder Abschlussweg/Belehrung/Rücktritt, `kuendigung_erfassen` (A-S17) |
| Serviceauftrag | `uebernahme_erfassen`, `rueckgabe_erfassen`, Workflow | `rechnung_erstellen`, Bedingung Abrechnen, Vorlage Rückgabetermin (A-S8) |
| Datenschutz-Auskunft | Zentrale `auskunft_sammeln()` über Hook `ph_core_datenauskunft` | Hook-Implementierung ph_service (A-S18) |
| Kosten | Kindtabelle `kosten`; UI-Select ohne Kulanz/Preisminderung | Validierung serverseitig, `kostensatz_intern_cent` (A-S12) |
| Freigaben | `freigaben.js` (Zentrale-Vertrag) | – |
| Reports/Charts | `query_report.run`, `dashboard_chart.get` | – |
| Einstellungen | `get_single`, `set_value` | – |

Rechte vor dem Server: Techniker ohne permlevel-1-Felder und ohne Kosten-Abschnitt; Mitarbeiter ohne `export` ohne CSV; Buchhaltung extern nur Regress-Felder.

---

## 10. Akzeptanzkriterien (QA)

Allgemein 02 §16. Bereichsspezifisch (Mock-Uhr, Seed §14.6):

| Nr | Prüfung | Art |
|---|---|---|
| Q-1 | S1-Schnell mit Tastatur allein von `N V` bis Toast ≤ 60 s; Fehler-Combobox findet „naht“ → POL-01 als ersten Treffer; Sheet ohne Scroll bei 1366 × 768; Entwurf überlebt Tab-Schließen | E2E |
| Q-2 | Telefonfall ohne E-Mail, Einstellung an: `erstreaktion_am` gesetzt, Textzeile sichtbar, kein Schalter; Einstellung aus: Schalter → `erstreaktion_erfassen("Telefon")`; nach 3 Werktagen kein Reaktions-ToDo, an zwei Folgetagen keines neu; Reiter, Heute-Leiste, Kennzahl, GF-Zentrale zeigen dieselbe Zahl | E2E |
| Q-3 | Grep `[erstreaktion]` und `[umgeplant]` in `backoffice/src` = 0 | Grep |
| Q-4 | `schritte.faelle.json` ≥ 1 Fall je Zeile §3.4; JS-Spiegel 0 Abweichungen zum Server-Ergebnis im Mock; Liste nach `rang` | Unit |
| Q-5 | Fall mit Eingangsbestätigung → Erledigt: Mitarbeiter-„Schließen“ deaktiviert mit Grund; nach Abschlussmail aktiv; lieferantenrelevanter Fall ohne Regress weder per S5 noch per Masse schließbar („2 übersprungen – Lieferantenschritt offen“) | E2E |
| Q-6 | `/service/faelle` ≤ 3 Frappe-Aufrufe; Akte ≤ 4 | Server-Log |
| Q-7 | `sla_status` Gefährdet/Verletzt → Text und Ton laut §3.1; keine Zeile/Akte mit > 1 `danger` (parametrisiert inkl. SLA) | Unit |
| Q-8 | Kulanz: Freigabe aus Zentrale-Kachel 2 Klicks, Glocke 3; Aufruf trägt `betrag_cent`; Betrag geändert → Servertext, kein zweiter Aufruf; Ablehnen ohne Grund nicht möglich; eigener Antrag gesperrt; keine PH Aufgabe zusätzlich; Akte zeigt „abgelehnt“ mit „Entscheidung ändern“ | E2E |
| Q-9 | Mails: „Ansehen“ pausiert (30 s warten → kein Aufruf); „Jetzt senden“ genau ein Aufruf; kein Toast mit > 1 Aktionsknopf; simulierter 500 nach Commit → Glocke + Banner + Zeitleiste „Erneut“; Adresse unmaskiert | E2E |
| Q-10 | Umplanen bestätigter Einsatz: nach 8 s ein `umplanen`, Status Geplant, Kennzeichen, Primär „Terminvorschlag senden“; `Z` innerhalb 8 s → kein Aufruf; Unterwegs-Einsatz nicht ziehbar; „Einsatz absagen“ für Mitarbeiter mit Grund | E2E |
| Q-11 | Akte: Statustext „Entschieden“; 6 Phasen; genau ein Regeltext im Kopf; Fall mit Projekt ohne zweite Leiste; Phasen-Popover per Tastatur | Snapshot/E2E |
| Q-12 | Bereichsstart: genau ein `variant=primary`; Zeilenaktion ohne Seitenwechsel, Fokus auf nächster Zeile | E2E |
| Q-13 | Ersatzteil hinzufügen → Bestellen → S3 mit 1 Zeile; S3 bestellt nur gewählte Zeilen; Technik „Benötigtes Teil notieren“ → Fall zeigt Zeile Benötigt | E2E |
| Q-14 | Technik: jede Bestätigungsart erzeugt den App-Wert; Pause 30 → `zeit_pause_min = 30`; Fehltipp „Starten“ + Rückgängig → kein `starten`; kein Auto-Weiter; Kamera verweigert → Mediathek; Band bei nicht installierter Web-App; genau ein Primär je Status; Abschluss ≤ 7 Tipps | E2E Telefon |
| Q-15 | Technik offline (Flugmodus) Unterwegs → Starten → Abschließen; nach Rückkehr Reihenfolge, keine Doppelbuchung; Kommissionsteil erzeugt keinen Bestandsfehler; Bestandsfehler simuliert → Einsatz erledigt + ToDo | E2E |
| Q-16 | Kontrast Fristband-Grenzen, Drop-Ziele, Bereichspunkt ≥ 3:1 hell/dunkel; Animation ohne verzerrtes Muster | axe + manuell |
| Q-17 | Grep im Bereichscode nach `\d+ ?ms` außerhalb `motion.js` = 0 | Grep |
| Q-18 | Kürzel: Einzeltasten nur `N V G J K X A S C M Z E 1–6` und `/`; keine Doppelbelegung je Kontext (Unit „kuerzel“); Kalender Zelle → Karte → Zelle ohne Moduswechsel | Unit/E2E |
| Q-19 | Klickzahlen §1 ab `/zentrale` gemessen ≤ Zielwert | E2E |
| Q-20 | A14 Vollseite; Raster folgt geänderten `techniker_tag_von/bis`, Puffer sichtbar; Seed ohne Techniker → Leerzustand mit Aktion; Fehler im Terminvorschlag → ✗ + „Erneut“ sendet nur die Mail | E2E |
| Q-21 | Regress: anerkannt 420 €, Gutschrift 400 € → Unterdeckung + Banner; Ausbuchen nur Leitung mit Grund; „Regress verrechnet“ nicht sichtbar bei Form Gutschrift; 5 Abgleichswerte mit Ton | E2E/Unit |
| Q-22 | **Fristen bei Meldung:** Übergabe 14.03.2026, gemeldet 10.03.2028, heute 20.06.2028 → kein Banner „abgelaufen“, Ablehnungsgrund „Frist abgelaufen“ nicht wählbar, Zeile 1 „rechtzeitig gemeldet · innerhalb der Gewährleistung“, Zeile 2 nur `warning` | Unit/E2E |
| Q-23 | `sachart = Unbeweglich`: Fristband zeigt die gespeicherten Werte (36 Monate), nicht `fristen_info()` | E2E |
| Q-24 | Lieferant haftet, Prüfung abgeschlossen (Ja): Banner + Zeile „Mängelanzeige senden“; nach S4a Regress Gemeldet, Verlauf Kommunikation; Heute-Leiste „Mängelanzeige offen“ sinkt | E2E |
| Q-25 | Regress Gemeldet: Ampel ≤ 14 Tage `danger` (nicht gewahrt); Anerkannt → `success`; Unternehmerkunde → „Kein § 933b“ | Unit |
| Q-26 | Widerruf Nachkauf → `nachkauf_einwilligung = 0`, `nachkauf_widerrufen_am` gesetzt; erneutes Speichern ändert nichts; kein Nachkauf-Hinweis (Mock-Scheduler); Einwilligung nur über Dialog mit Textversion + Nachweis | E2E |
| Q-27 | Kundenfoto-Upload im Backoffice: `an_lieferant = 0`; S4a zeigt Fotoschritt bei Kundenfotos immer | E2E |
| Q-28 | Gutschrift: Service ruft `PH Servicefall.gutschrift_erstellen` nie auf (Grep/Mock-Protokoll); Faktura-Methode mit `art`, `grund`, `erstattung_art`; Betragsfeld heißt „brutto an den Kunden“; Kulanz und Preisminderung nicht gleichzeitig; Kostenzeile ohne Art Kulanz/Preisminderung | E2E/Grep |
| Q-29 | Kunde ohne E-Mail: Abschluss per Brief (Druck → „Als informiert erfassen“) → Mitarbeiter kann schließen | E2E |
| Q-30 | Website-Meldung mit E-Mail eines bestehenden Kontakts: Kennzeichen „Zuordnung prüfen“; „Zuordnung bestätigen“ setzt `portal_sichtbar = 1` | E2E |
| Q-31 | Pflege-Abo Verbraucher, Fernabsatz: Aktivieren ohne Belehrungs-Haken nicht möglich; Kommentar mit Abschlussweg geschrieben | E2E |
| Q-32 | Serviceauftrag „Abrechnen“ ohne Rechnung nicht sichtbar, Knopf „Rechnung in Faktura erstellen“ | E2E |
| Q-33 | Bestellung Teilgeliefert: Stornieren nicht angeboten; Text Reststorno sichtbar | E2E |
| Q-34 | Leerzustände §2.14 mit leerem Seed: Text + Aktion je Ort (Snapshot + axe); Kennzahl „–“ nie „0 €“ | E2E |
| Q-35 | Texte: keine Frappe-Begriffe; Statuswerte mit Umlauten; Grep UI-Strings nach „Geprueft“, „Benoetigt“, „GWL“, „Fristen ≤“ ohne Fristart = 0; Beträge `1.234,50 €`; Kosten mit „netto“ beschriftet | Grep |
| Q-36 | Barrierefreiheit: axe 0 serious/critical auf Bereichsstart, Liste, Kanban, Akte, S1, S2, A14, S5, Technik; Fristband mit Textalternative; keine Information nur im `title` | axe |
| Q-37 | Leistung (05 §13): Liste < 1,2 s, Akte Kopf < 1,0 s, Technik-Start < 1,5 s | Messung |
| Q-38 | Mock-Modus mit Seed §14.6 und mit leerem Seed lauffähig; alte Routen 307 inkl. Filter; Hilfe je Route (§13) | E2E |
| Q-39 | Keine Auswertung je Techniker in Berichten (Grep Report-Filter `techniker` in Service-Berichten = 0) | Grep |
| Q-40 | Ausland: `einsatz_land = Schweiz` → Hinweis in A14 und Freigabe-Pflicht für Mitarbeiter | E2E |

---

## 11. Was über Branchensoftware hinausgeht

1. Fristband mit Anspruchsstand bei Meldung, Beweislast und Rechtsgrundlage – in Akte, Liste und Kanban.
2. Ein nächster Schritt je Fall aus einer Server-Regel, gleich in Akte, Liste, Kanban, Heute-Leiste.
3. Mängelanzeige an den Lieferanten direkt nach der Prüfung; Regressfrist bleibt sichtbar offen, bis der Lieferant anerkennt; Abgleich Soll/Ist mit Ausbuchen.
4. Kanban-Drop öffnet die fehlende Angabe statt einer Fehlermeldung.
5. Techniker schließt offline ab; Teile, Zeiten mit Pause, Bestätigungsart und Bericht landen im Fall.
6. Fehlercode-Wissen am Arbeitsort (Meldung, Entscheidung, Technik).
7. Rückgängig für Alltägliches (8 s), auch für Kundenmails; Bestätigung nur bei Geld und Recht.
8. Datenschutz eingebaut: Fotos an Lieferanten nur bewusst, Nachkauf nur mit belegter Einwilligung, Auskunft über die Zentrale.

---

## 12. Anfragen und offene Fragen (keine Annahmen im Bau)

### 12.1 Anfragen an Apps (Schwere K = vor Produktivgang rechtlich nötig, H = vor Produktivgang, M = Qualität)

| Nr | An | Schwere | Inhalt | Übergang bis dahin |
|---|---|---|---|---|
| A-S1 | ph_service | K | `fristen_status_bei_meldung` (read-only, beim Insert aus `gemeldet_am`/`erstauftreten`, Änderung Leitung mit Grund); `fristen(stichtag)`; `fristen_info()` mit `sachart` und Einstellungen | UI-Funktion `meldezustand()` aus gespeicherten Feldern (§3.2) |
| A-S2 | ph_service | K | `maengelanzeige_senden(empfaenger, zusatz)`, Felder `maengelanzeige_am/_an`, Einstellung `ruege_tage` (Wert Kanzlei K4); `schritte.py` um Zeilen 2, 8, 11, 13, 15 + gemeinsame Testdatei `schritte.faelle.json` | S4a über `lieferant_informieren`; Hinweise statt Primär |
| A-S3 | ph_service | H | `kunde_informiert_erfassen(kanal, notiz)` + Felder; `abschluss_informiert_am` nur durch Vorlage `abschluss`/Kanal; Workflow-Bedingung „Schließen“ darauf; Brief-Druckformate je Vorlage | UI-Sperre D-3; Kommentar mit festem Text |
| A-S4 | ph_service | K | Regress: `rechtsgrundlage`, `anerkenntnis_schriftlich`, `anerkenntnis_beleg`, `verjaehrungsverzicht_bis`, `klage_eingebracht_am`; `regress_frist_bis` nur bei Verbraucher + Gewährleistungsentscheidung; Vorlage „Regressforderung“ | Ampel bis Anerkannt; Texte |
| A-S5 | ph_service | H | Übergabequelle Reihenfolge Montage-Abnahme > Projektübergabe > Zustellung > Produktpass; Quelle wählbar | Leitung setzt Datum mit Grund |
| A-S6 | ph_service, ph_logistik | H | Austausch: `austausch_bestellen()`, Lieferschein mit `servicefall`, Retoure, `ersatz_uebergabe_datum` | Hinweiskarten |
| A-S7 | ph_service, ph_faktura | K | `gutschrift_erstellen` mit USt aus Rechnungsposition, brutto, Währung, ohne `ignore_mandatory`, Summenprüfung; `minderung_vormerken()`; Hook `PH Gutschrift.on_cancel`; Rückabwicklung; optional `mahnsperre_setzen` | Faktura-Methode (E4) |
| A-S8 | ph_service, ph_faktura | H | Entscheidung „Kostenpflichtig“, `kosten_hinweis_am/_kanal`, `angebot_erstellen`, `kosten_verrechnen`; `PH Pflege Abo.rechnung_erstellen`, `PH Serviceauftrag.rechnung_erstellen`, Bedingung „Abrechnen“; Vorlage Rückgabetermin | Kommentar Kostenhinweis; Links Faktura |
| A-S9 | ph_service | M | eine Eskalationsstufe statt zwei | `max()` in der UI |
| A-S10 | ph_service | H | `abschliessen(benoetigt[])`; Bestandsfehler als Teilfehler; `starten(zeit)`, `unterwegs(zeit)`; Abnahme-Felder read-only, Neuerfassung Leitung | Client-Wiederholung ohne Teil + ToDo |
| A-S11 | ph_service | M | Bewegungsarten Rücksendung (−), Schwund (−), Rückgabe Kunde (+); `rest_stornieren`, Storno-Sperre ab Teilgeliefert; `bestand_fuehren = 0` bei `produkt`; Report Stichtag; `altteil_zurueck` | Inventur mit Grund; UI-Sperre |
| A-S12 | ph_service | M | `steuerliche_art`, `vorsteuer_korrektur_cent` (Regress); `kostensatz_intern_cent`; Kostenreport nach Kostendatum; Nenner ohne Storno; Report Gewährleistung zum Stichtag, `erwartete_kosten_cent` | CSV, Hinweise |
| A-S13 | ph_service | M | Währung Fall/Regress/Bestellung (`waehrung`, `kurs`) | Hinweise |
| A-S14 | ph_service | K | `an_lieferant` Standard 0 für Kunde/Techniker (auch Portal); Website-Fälle `kontakt_bestaetigt = 0`, `portal_sichtbar = 0`, neuer Kontakt Interessent | Backoffice setzt 0; Kennzeichen „Zuordnung prüfen“ |
| A-S15 | ph_service | M | `reiter_zaehler(user)` | Zähler nur aktiver Reiter + Reaktion überfällig |
| A-S16 | ph_service | M | `beleg_position`, `positions_menge` | Anzeige der Position ohne Speicherung |
| A-S17 | ph_service | K | `einwilligung_erfassen(textversion, quelle, nachweis)`, Felder read-only; FAGG-Felder an Pflege Abo/Serviceauftrag + Workflow-Bedingungen; `kuendigung_erfassen(eingang_am, zum)`, Verlängerung | Dialog + Kommentar |
| A-S18 | ph_service, ph_core | H | Hook `ph_core_datenauskunft` (Fälle, Fotos, Unterschriften, Einsätze, Abos, Regress-Mails); Scheduler `aufbewahrung_pruefen` mit Vorschau; Einwilligungsnachweis nicht sofort anonymisieren | Auskunft manuell über Zentrale |
| A-S19 | ph_core, ph_service | M | Zustellstatus je Mail | „gesendet (Zustellung ungeprüft)“ |
| A-S20 | ph_service | M | Transportschaden: `frachtfuehrer`, `vorbehalt_bei_ablieferung`, `schadensanzeige_am`, `versicherung_meldung_am` | Kommentar-Vorlage |
| A-S21 | ph_service | M | Endzustand „Storniert“ mit Grund, `duplikat_von`, zählt in keiner Quote | Ablehnen mit Begründung |
| A-F1 | Fundament | – | `kuerzel.js`: Kontext Liste `1–6`, Leertaste Peek; `FreigabeEintrag`, verzögerter Commit (Variante A) mit Server-Job, `Sheet`, `Popover`, `Tooltip` mit Fokus, `Vorgangsleiste` mit Popover, Kalender-Raster mit Roving-Fokus, `faehigkeiten`-Muster | – |
| A-F2 | Faktura | – | Parameter für „Rechnung neu“ mit Bezug (Pflege Abo, Serviceauftrag, Servicefall); Rückgabe der Gutschrift-ID aus `PH Rechnung.gutschrift_erstellen` | – |
| A-F3 | Logistik | – | „Nachlieferung anlegen“ mit Bezug Servicefall; Lagerbestand-Link für Pflegemittel; Etikett 62×29 | – |

### 12.2 Fragen an Kanzlei, Steuerberatung, Inhaber

| Nr | An | Frage |
|---|---|---|
| K1 | Kanzlei | Stichtag Anspruchsstand und Beweislast: Hervorkommen/Meldung – bestätigt? Absatzzitate VGG gegenlesen |
| K2 | Kanzlei | Fristbeginn bei Lieferung mit Montage (Küche/Bad): Zustellung oder Abnahme? Frist für Ersatzstück nach Austausch? |
| K3 | Kanzlei | § 933b ABGB: gerichtliche Geltendmachung binnen 2 Monaten; reichen Anerkenntnis/Verzicht? Nur nach Verbrauchergewährleistung? |
| K4 | Kanzlei | Rügefrist gegenüber Lieferanten (§ 377 UGB): Standardwert `ruege_tage` |
| K5 | Kanzlei | FAGG für Pflege-/Wartungsverträge und Winterlager; Belehrungstext, Zustimmung vorzeitiger Beginn, Ausnahme dringende Reparatur |
| K6 | Kanzlei | § 15 KSchG: Mindestlaufzeit und Kündigung bei Jahres-Abos |
| K7 | Kanzlei | Aufbewahrung Einwilligungsnachweis nach Widerruf; Löschfristen Fotos/Unterschriften |
| K8 | Kanzlei | Techniker-Zeitstempel und Zufriedenheit: Zustimmung der Mitarbeiter nötig? Text Erstbesuchs-Satz |
| K9 | Kanzlei | Unterschrift-Alternative „Name bestätigt“; Kundentexte aller Vorlagen; Datenschutzhinweis „Fotos an Hersteller“ |
| S1 | StB | Regress: Entgeltminderung vs. Schadenersatz je Form |
| S2 | StB | Minderung vor Schlussrechnung vs. Gutschrift; Kurs CHF |
| S3 | StB | Einsätze in der Schweiz: zulassen oder ausschließen? |
| S4 | StB | Daten für Gewährleistungsrückstellung |
| I1 | Inhaber | Inkasso vor Ort ausschließen (Vorschlag: ja) |
| I2 | Inhaber | Mahnsperre bei Reklamation standardmäßig an? |
| I3 | Inhaber | Pflegemittel nur in Logistik führen? |
| I4 | Inhaber | Kostenpflichtige Anfahrt bei „Kein Mangel festgestellt“: Satz und Hinweistext |
| I5 | Inhaber | Standard-Techniker je Bereich; Portal-Sichtbarkeit neuer Fälle |
| I6 | Inhaber/QA | Klicktest mit 2 Mitarbeitern: Übersicht und „Mangel & Fristen“ zusammenlegen? |

**Risiken bis zur Lieferung:** Schließen-Sperre (D-3) und Vier-Augen bei Kulanz sind bis A-S3 bzw. Zentrale A4 nur UI-seitig; Portal-Fotos kommen bis A-S14 mit `an_lieferant = 1` (S4a zeigt sie deshalb immer zur Auswahl).

---

## 13. Hilfe je Route (Erstbesuchs-Satz und `?`-Artikel)

Erstbesuchs-Satz unter dem Seitentitel (`info-soft`, schließbar, einmal je Benutzer und Route); `?`-Artikel `backoffice/hilfe/service/<seite>.md` im Hilfe-Panel. Begriffe „Regress“, „Vermutungsfrist“, „Beweislast“ je mit einem Satz und Beispiel.

| Route | Erstbesuchs-Satz | Artikel |
|---|---|---|
| `/service` | „Oben steht, was heute zu tun ist. Jede Zeile hat ihren nächsten Schritt als Knopf.“ | Heute-Leiste, Kennzahlen, Jetzt dran |
| `/service/faelle` | „Die Liste beginnt mit dem, was zuerst fällig ist. Ansichten oben merken sich deine Filter.“ | Reiter, Filter, Massenaktionen, Kanban |
| `/service/faelle/neu` | „Am Telefon reicht: Kunde, Fehler, ein Satz. Den Rest kannst du später ergänzen.“ | Schnell/Vollständig, Widerruf und Falschlieferung, Bezug |
| `/service/faelle/[name]` | „Oben steht immer der nächste Schritt. Was du nicht darfst, zeigt der Knopf mit Grund.“ | Phasen, Fristband, Mängelanzeige, Freigaben |
| `/service/einsaetze` | „Ziehe Einsätze zum Verschieben. Danach den Kunden über den neuen Termin informieren.“ | Kalender, Umplanen, Absagen |
| `/service/einsaetze/neu` | „Freie Fenster sind hell. Ein Klick wählt Techniker und Zeit.“ | Raster, Puffer, Kostenhinweis |
| `/service/einsaetze/[name]` | „Unterwegs und Start meldet der Techniker auf dem Telefon.“ | Status, Bericht, Folgeeinsatz |
| `/service/ersatzteile` | „Teile und Bestellungen an einem Ort. Wareneingang buchst du direkt in der Zeile.“ | Bestand, Bestellen, Wareneingang |
| `/service/ersatzteile/bestellungen/[name]` | „Der Knopf oben führt durch die Bestellung.“ | Senden, AB, Wareneingang, Storno |
| `/service/regress` | „Regress entsteht mit der Mängelanzeige. Gewahrt ist die Frist erst, wenn der Lieferant anerkennt.“ | Regressfrist, Abgleich, Gutschrift |
| `/service/regress/[name]` | „Gutschriften des Lieferanten erfasst du hier; Differenzen bucht die Leitung aus.“ | Anerkannt, Abgleich, Ausbuchen |
| `/service/vertraege` | „Pflege- und Wartungsverträge und Serviceaufträge wie Winterlager.“ | Intervall, Einwilligung, Rücktrittsrecht |
| `/service/vertraege/pflege/[name]` | „‚Nächsten Termin planen‘ legt den Einsatz an, das Protokoll entsteht beim Abschluss.“ | Protokolle, Widerruf, Konditionen |
| `/service/vertraege/auftraege/[name]` | „Je Stück Zustand und Foto bei Übernahme und Rückgabe.“ | Übernahme, Lagerplatz, Abrechnung |
| `/service/fehlerkatalog` | „Mit guten Codes füllt sich die Prüfung von selbst. Codes nie löschen, nur deaktivieren.“ | Bereiche, „Sonstiges“, Textbausteine |
| `/service/berichte/[report]` | „Zeilen öffnen den Fall. Beträge sind netto.“ | Definitionen je Bericht |
| `/service/einstellungen` | „Gesetzliche Fristen sind fest. Änderungen an Schwellen nur nach Rücksprache.“ | Felder, Folgen |
| `/technik` | „Ein Knopf führt durch den Einsatz. Ohne Netz geht alles weiter – übertragen wird später.“ | Status, Fotos, Abschluss, Offline |

---

## 14. Bauauftrag (Service-Agent)

**Vor Beginn:** Next-Doku in `backoffice/node_modules/next/dist/docs/` lesen (AGENTS.md): Server Actions, Route Handlers, `loading.js`/`not-found.js`, Intercepting Routes, `redirect`/`permanentRedirect`, `revalidatePath`. Keine Änderung in `Backend-Import/` (nur lesen); Fundament-Dateien (`bereiche.js`, `suche.js`, `kuerzel.js`, `motion.js`, UI-Kit) nur über den Fundament-Agenten bzw. abgestimmt. Jede Seite `requireSession()`/`requireDocRecht()` zuerst, `export const dynamic = "force-dynamic"`; jede Server Action prüft Sitzung + Recht erneut, validiert per zod/`validiere`, liefert `{ ok, code, message, daten? }`; Mock-Modus Pflicht.

### 14.1 Dateien und Routen (`backoffice/src`)

```
app/service/
  layout.js                                  Pills (Rolle), Zähler „Reaktion überfällig“, S1-Schnell-Sheet-Host
  page.js                                    Bereichsstart (Suspense je Block)              + loading.js
  faelle/page.js                             Liste/Kanban (?ansicht=)                        + loading.js
  faelle/neu/page.js                         S1-Vollständig
  faelle/[name]/page.js                      Akte (Tabs ?tab=)                               + loading.js, not-found.js
  einsaetze/page.js                          Kalender/Kanban/Liste
  einsaetze/neu/page.js                      A14 Vollseite (?fall=, ?pflege=)
  einsaetze/[name]/page.js                   Einsatz-Akte                                    + not-found.js
  ersatzteile/page.js                        Teile/Bestellungen (?ansicht=)
  ersatzteile/[name]/page.js                 Ersatzteil-Akte
  ersatzteile/bestellungen/[name]/page.js    Bestellung-Akte
  regress/page.js, regress/[name]/page.js
  vertraege/page.js                          (?art=pflege|auftraege)
  vertraege/pflege/[name]/page.js, vertraege/auftraege/[name]/page.js
  fehlerkatalog/page.js
  berichte/[report]/page.js
  einstellungen/page.js
  ersatzteilbestellungen/[[...rest]]/page.js   307 → ersatzteile?ansicht=bestellungen
  pflege-abos/[[...rest]]/page.js              307 → vertraege?art=pflege
  auftraege/[[...rest]]/page.js                307 → vertraege?art=auftraege
app/(kiosk)/technik/
  page.js (vorhanden, ersetzen)              Heute/Woche/Suche/Ich (Client-Shell)
  einsatz/[name]/page.js                     Einsatz-Karte + Abschluss-Assistent
  manifest-Hinweis über KioskShell (Fundament)
components/Backoffice/Service/
  ServiceNav.js  HeuteLeiste.js  JetztDran.js  EinsaetzeHeute.js  KennzahlenService.js
  FaelleTabelle.js  FaelleKanban.js  FallPeek.js  StatusBadgeService.js  RotesSignal.js
  S1Schnell.js  S1Vollstaendig.js  FehlerCombobox.js  KontaktSuche.js  BezugsVorschlaege.js  ArtWeiterleitung.js
  AkteKopf.js  Phasenleiste.js  SlaZeile.js  BannerStapel.js  Fristband.js  FristbandKompakt.js
  TabUebersicht.js  TabMangelFristen.js  TabBearbeitung.js  TabRegressAbschluss.js  Zeitleiste.js  HaengeMappe.js
  S2Entscheiden.js  TelefonatDialog.js  ErsatzteilDialog.js  S3Bestellen.js  S4Maengelanzeige.js  S4Forderung.js
  S5Erledigt.js  KundeInformierenDialog.js  GutschriftDialog.js  AblehnenDialog.js  MahnsperreChip.js
  LieferantenLeiste.js  ZuordnungBanner.js  Galerie.js  ErgebnisKarte.js
  EinsatzKalender.js (Raster, Roving-Fokus)  EinsatzKanban.js  UmplanenDialog.js  AbsagenDialog.js  A14Planen.js  EinsatzAkte.js
  ErsatzteilTabelle.js  BewegungDialog.js  BestellungAkte.js  WareneingangDialog.js
  RegressTabelle.js  RegressAkte.js  GutschriftErfassenDialog.js  AusbuchenDialog.js  AbgleichKarte.js
  PflegeAkte.js  EinwilligungTab.js  AktivierenDialog.js  ServiceauftragAkte.js  UebernahmeAssistent.js
  FehlerkatalogBaum.js  CodeSheet.js  BerichtSeite.js  EinstellungenService.js
  technik/ TechnikShell.js  HeuteListe.js  EinsatzKarte.js  StatusKnopf.js  FotoKnoepfe.js  Abschluss.js
           Bestaetigung.js  Unterschrift.js  Warteschlange.js  InstallBand.js  KameraVerweigert.js
lib/backoffice/service/
  labels.js        rein: Statuswerte ↔ UI-Text (Entschieden), Töne, Icons, Kanäle
  regeln.js        rein: meldezustand(), rotesSignal(), bannerRang(), abschlussMitgeteilt() (D-3), maengelanzeigeOffen() (D-2),
                   schliessbar(), reaktionUeberfaellig() (D-1), kostenhinweisNoetig(), eskalationsstufe()
  naechsterSchritt.js  rein: Spiegel von schritte.py (nur optimistische Anzeige)
  fristen.js       rein: fristenVorschau() (Spiegel fristen.py inkl. sachart), monateDazu()
  telefon.js       rein: normalisiereTelefon()
  bild.js          Client: verkleinern(1600 px, ≤ 600 KB), exifZeit()
  faehigkeiten.js  server-only: Feld/Methode vorhanden? (Meta, Cache 10 min) – steuert [Anfrage]-Funktionen
  daten.js         server-only: ladeStart, ladeFaelle, ladeAkte, ladeEinsaetze, ladeSlots, ladeErsatzteile, ladeRegresse, ladeVertraege, ladeBericht
  freigaben.js     server-only: Zentrale-Vertrag §4.9
  actions.js       "use server" (§14.3)
  verzoegert.js    server-only: Job-Queue für verzögerte Commits/Mails (idempotency_key, Status abfragbar)
  technik-sw.js    Service Worker/Offline-Warteschlange (IndexedDB), Reihenfolge, Wiederholung
  mock-seed.js     Seed-Ergänzung für mock/seed.js
backoffice/hilfe/service/*.md (18 Artikel, §13)
backoffice/tests/unit/service-{regeln,naechsterSchritt,fristen,labels,telefon}.test.mjs
backoffice/tests/fixtures/schritte.faelle.json   (gemeinsam mit ph_service-Test, Anfrage A-S2)
backoffice/tests/e2e/service-{start,faelle,akte,s1,s2,a14,s5,regress,vertraege,technik}.spec.js (desktop + ipad + telefon)
```

Navigation: `bereiche.js` Slug `service` (vorhanden) – Kanban-Einträge auf Servicefall/Serviceeinsatz/Regress setzen; Palette-Einträge in `suche.js` (`> servicefall melden`, `> einsatz planen`, `? service`, Gruppe „Dieser Fall“).

### 14.2 Komponenten-Abhängigkeiten

Aus dem Fundament (vorhanden): `Shell`, `Seitenkopf`, `Segment`, `DataTable`, `Kanban`, `Formular`, `Kennzahl`, `Charts`, `StatusBadge`, `Toast`, `Bestaetigen`, `Leer`, `Fehler`, `Knopf`, `Kiosk`. **Neu benötigt vom Fundament (A-F1):** `Sheet` (640/480/400 px), `Popover`, `Tooltip` mit Fokus-Auslösung, `Vorgangsleiste` mit Punkt-Popover, verzögerter Commit (Variante A) mit Server-Job und `flush()` bei `pagehide`, `FreigabeEintrag` (Zentrale), `Speicherleiste`, Zeitleiste, Kalender-Raster mit Roving-Fokus, `kuerzel.js`-Einträge, Druckpanel. Fehlt eine davon beim Start, baut der Service-Agent sie **nicht** selbst, sondern nutzt die einfache Variante (z. B. Dialog statt Sheet) und markiert die Stelle mit `// TODO Fundament A-F1`.

### 14.3 Server Actions (`lib/backoffice/service/actions.js`)

| Action | Frappe-Aufrufe (in Reihenfolge) | Rückgabe / Revalidate |
|---|---|---|
| `fallAnlegen(eingabe, optionen)` | `insert PH Servicefall` (`quelle=backoffice`) → opt. `erstreaktion_erfassen` → opt. Faktura `set_value PH Rechnung mahnsperre` → opt. `planeMail(eingang)` | Teilschritte, `name`; `/service`, `/service/faelle` |
| `telefonatErfassen(name, kanal, notiz)` | `run_doc_method erstreaktion_erfassen` | Akte, Start |
| `pruefenEntscheiden(name, daten, modus)` | `save` → `apply_workflow` × 1–3 (je eigener Schlüssel) | erreichter Status, Teilfehler |
| `kulanzAnfordern(name)` | `kulanz_anfordern` | – |
| `planeMail(name, vorlage, zusatz)` | Job in `verzoegert.js` → nach 8 s `kunde_informieren` | Job-ID; `abbrechen(jobId)`, `jetzt(jobId)` |
| `kundeInformiert(name, kanal, notiz)` | E-Mail: `kunde_informieren`; sonst A-S3 oder Kommentar | – |
| `maengelanzeigeSenden(name, empfaenger, zusatz, fotos)` | `save` (Foto-Häkchen) → `lieferant_informieren` (→ A-S2 `maengelanzeige_senden`) | Regress-Name |
| `forderungStellen(name, betrag, zusatz)` | Regress `set_value betrag_gefordert_cent` → `erinnern` bzw. `lieferant_informieren` | – |
| `ersatzteilHinzufuegen(name, zeile)` | `save` Kindtabelle | – |
| `ersatzteileBestellen(name, zeilen, lieferant, adresse, termin, empfaenger, text)` | `ersatzteile_bestellen` → `PH Ersatzteilbestellung.senden` | Teilschritte |
| `gutschriftErstellen(name, art, betragBrutto, erstattung)` | Summenprüfung (Faktura `get_list PH Gutschrift`) → Faktura `PH Rechnung.gutschrift_erstellen(art, grund, erstattung_art)` → `set_value PH Servicefall gutschrift` (sonst Kommentar) | Gutschrift-ID |
| `erledigtMelden(name, bericht, bestaetigung, info, schliessen, mahnsperreAufheben)` | `erledigt_melden` → opt. `abnahme_erfassen` → opt. Mail/Kanal → opt. Mahnsperre → opt. `apply_workflow("Schließen")` nach Regel `schliessbar()` | Teilschritte |
| `schliessen(names[])` | Vorschau `schliessbar()` → Job 8 s → `apply_workflow("Schließen")` je Name | Fortschritt |
| `ablehnen(name, grund, begruendung, informieren)` | `ablehnen(grund, begruendung, kunde_informieren)` | – |
| `wiederOeffnen(name, grund)` | `neu_oeffnen` bzw. Workflow | – |
| `zuweisen/prioritaet(names, wert)` | `set_value` je Name; Undo = alter Wert | – |
| `einsatzPlanen(fall, eingabe)` | `einsatz_anlegen` → `set_value` → opt. `kunde_informieren("termin")` → opt. `termin_anlegen` → opt. Kommentar Kostenhinweis | Teilschritte |
| `einsatzUmplanen(name, eingabe)` | Job 8 s → `umplanen` | – |
| `einsatzAbsagen(name, grund)` | `abbrechen` | – |
| `einsatzStatus(name, methode, zeit)` | `bestaetigen` / `unterwegs` / `starten` / `nicht_angetroffen` | – |
| `einsatzAbschliessen(name, daten)` (Technik, idempotent) | `abschliessen(...)`; bei Bestandsfehler Wiederholung ohne Teil + ToDo; opt. `save` Fall Benötigt | Teilschritte |
| `berichtSenden(name)` | `bericht_senden` | – |
| `bewegungBuchen(teil, art, menge, hinweis)` | `bewegung_buchen` | – |
| `bestellung*(name, …)` | `senden`, `als_gesendet`, `bestaetigen`, `wareneingang`, `stornieren` | – |
| `regressGutschrift(name, betrag, nummer, datum, beleg, er)` | `gutschrift_erfassen` | Abgleich |
| `regressAusbuchen(name, grund)` | `differenz_ausbuchen` | – |
| `regressWorkflow(name, aktion, werte)` | `save` Pflichtwerte → `apply_workflow` | – |
| `widerrufErfassen(abo)` / `einwilligungErfassen(abo, version, nachweis)` | `set_value nachkauf_einwilligung` (+ Kommentar) | – |
| `vertragAktivieren(abo, abschlussweg, belehrung)` | Kommentar → `apply_workflow("Aktivieren")` | – |
| `pflegeTerminPlanen(abo, eingabe)` | `einsatz_planen` | – |
| `uebernahme/rueckgabe(auftrag, daten)` | `uebernahme_erfassen` / `rueckgabe_erfassen` → Workflow | – |
| `zuordnungBestaetigen(name)` / `kontaktZuordnen(name, kontakt)` | `set_value portal_sichtbar` / `kontakt` + Kommentar | – |
| `fehlercodeSpeichern(code, felder)` / `bereichAnlegen` / `sortieren` | `set_value` / `insert` | – |
| `einstellungenSpeichern(felder)` | `set_value` Single | – |

Lesend (Server Components, `daten.js`): `get_next_steps`, `get_service_case_file`, `get_technician_slots`, `get_list`/`get_count`, `get_docinfo`, `query_report.run`, `dashboard_chart.get`, Kennzahl-Methoden aus `kennzahlen.py`, `get_single`.

### 14.4 Reihenfolge und Aufwand (Schätzung in Agent-Stunden)

| Paket | Inhalt | Aufwand | Abhängigkeit |
|---|---|---|---|
| P0 | Reine Module (`labels`, `regeln`, `naechsterSchritt`, `fristen`, `telefon`) + Unit-Tests + `schritte.faelle.json`; `faehigkeiten.js`; Mock-Seed | 6 | – |
| P1 | Layout, Pills, Bereichsstart (Heute-Leiste, Kennzahlen, Jetzt dran, Listen, Charts) | 6 | P0 |
| P2 | Servicefälle Liste + Kanban + Peek + Massenaktionen (inkl. verzögerter Commit) | 9 | P0, A-F1 (verzögerter Commit) |
| P3 | S1-Schnell + S1-Vollständig (Combobox, Kontakt, Bezug, Weiterleitungen, Entwurf) | 8 | P0 |
| P4 | Akte: Kopf, Phasen, SLA, Banner, Tabs, Fristband, Zeitleiste, Hängemappe | 12 | P0, A-F1 (Sheet, Popover, Vorgangsleiste) |
| P5 | S2, Telefonat, Ersatzteil-Dialog, S3, S4a/S4b, Lieferanten-Leiste, Gutschrift-Dialog, Mahnsperre, Kunde informieren, S5, Ablehnen | 14 | P4; Faktura-Methoden (A-F2) |
| P6 | Mails verzögert (Job, Pause, Fehler nach Commit → Glocke) | 4 | A-F1 |
| P7 | Einsätze: Kalender-Raster, Umplanen, Absagen, Kanban, Liste, A14 Vollseite, Einsatz-Akte | 12 | P0, A-F1 (Raster) |
| P8 | Ersatzteile, Bestellungen, S6 | 6 | P0 |
| P9 | Regress Liste/Akte, Abgleich, Gutschrift erfassen, Ausbuchen | 5 | P0 |
| P10 | Verträge Pflege + Serviceaufträge (Einwilligung, Aktivieren, S7, S8) | 7 | P7 (A14-Raster) |
| P11 | Fehlerkatalog, Berichte, Einstellungen, Freigaben-Vertrag | 6 | Zentrale `FreigabeEintrag` |
| P12 | Technik mobil (Shell, Heute, Karte, Statusknopf verzögert, Fotos, Abschluss 4 Schirme, Offline, Install-Band, Sperre) | 14 | P0, Kiosk-Fundament |
| P13 | Hilfe-Artikel, Leerzustände, Barrierefreiheit, E2E-Suite, Klickzähler, Leistungsmessung | 9 | alle |
| **Summe Stufe 1** | | **118** | |
| Stufe 2 | S9 Austausch, S10 Rückabwicklung, Kostenpflichtig, Anerkenntnis-Felder, Brief-Kanal mit Druckformaten, Aufbewahrung-Tab, Storniert/Duplikat, Währung | 25–35 (abhängig vom Umfang der Anfragen) | A-S2–A-S8, A-S13, A-S17, A-S18, A-S21 |

Reihenfolge Stufe 1: P0 → (P1, P3, P8, P9 parallel) → P2 → P4 → P5 → P6 → P7 → P10 → P11 → P12 → P13. Nach jedem Paket: Unit + ESLint 0 Fehler + E2E des Pakets im Mock. Mit jeder gelieferten Anfrage: `faehigkeiten.js` schaltet die Funktion frei; Übergangscode (Kommentar-Mechanismus D-3, Gutschrift-Faktura-Weg) wird im selben Paket entfernt und per Grep geprüft.

### 14.5 Abhängigkeiten zu anderen Bereichen

| Bereich | Service braucht | Service liefert |
|---|---|---|
| Fundament | A-F1 (Komponenten, `kuerzel.js`, `motion.js`, verzögerter Commit, Kiosk-Shell) | – |
| Zentrale | `FreigabeEintrag`, Glocke, „Angeheftet“, Palette, Datenschutz `/datenschutz` | `service/freigaben.js`; Kennzahlen für GF-Zentrale; Datenauskunft über Hook (A-S18) |
| Faktura | `PH Rechnung.gutschrift_erstellen`, Mahnsperre, „Rechnung neu“ mit Bezug (A-F2), Gutschrift-Status | Bezug Servicefall in Gutschrift-Grund |
| Logistik | Nachlieferung mit Bezug, Lagerbestand-Link, Packtisch-Kachel „Ersatzteile“, Etikett, Touren | Servicefall aus Lieferschein/Wareneingang (`?aus=`) |
| Projekte | Mangel → Servicefall (`mangel_an_service`), Projektphase für die Karte | Servicefall-Bezug in Auftragsmappe |
| CRM | Kontakt-Suche/-Anlage (Interessent), Kundenakte-Bezüge, Termine (`PH Termin`) | Servicefälle in der Kundenakte |
| Personal | `PH Abwesenheit` (über `get_technician_slots`), Rollenvergabe Techniker | – |
| Shop | Widerruf-Weg (Ziel des Links „Zur Bestellung“) | – |
| Kanzlei/StB/Inhaber | Antworten §12.2 | – |

### 14.6 Mock-Seed

12 Fälle über alle Status (inkl. Kulanz angefordert/abgelehnt, Telefonfall ohne E-Mail, Website-Fall, Fall mit Projekt, Fall „bei Meldung abgelaufen“, Fall „rechtzeitig gemeldet, heute nach Gewährleistung“, Unternehmerkunde, Rechnung in CHF), 3 Techniker (+ Variante ohne Techniker), 8 Einsätze (inkl. umgeplant, unterwegs, Kommissionsteil), Fehlerkatalog aus `install.py`-Seed (12 Bereiche inkl. `-99`), 10 Ersatzteile (1 Pflegemittel mit `produkt`), 3 Bestellungen (Entwurf, Teilgeliefert, Überfällig), 3 Regresse (Gemeldet, Anerkannt mit Unterdeckung, Verrechnet), 3 Pflege-Abos (eins mit Widerruf), 2 Serviceaufträge; Namen „Max Muster“ u. ä., E-Mails `@beispiel.invalid`. Zusätzlich leerer Seed.

### 14.7 QA-Checkliste (Abnahme des Bauauftrags)

- [ ] Q-1 bis Q-40 (§10) grün im Mock (desktop, iPad, Telefon für `/technik`).
- [ ] Unit: `regeln`, `naechsterSchritt` (gegen `schritte.faelle.json`), `fristen` (Monatsende, `sachart`, Stichtag), `labels`, `telefon`, Kürzel-Doppelbelegung.
- [ ] Grep: `[erstreaktion]`, `[umgeplant]`, `gutschrift_erstellen` am Servicefall, Millisekunden außerhalb `motion.js`, Frappe-Begriffe, „GWL“, „Fristen ≤“ ohne Fristart, `set_value` auf `status` des Einsatzes, Report-Filter `techniker` = 0 Treffer.
- [ ] axe 0 serious/critical auf allen Service-Routen; Fokusreihenfolge und sichtbarer Fokusring; keine Information nur in `title`.
- [ ] Server-Log: Liste ≤ 3, Akte ≤ 4 Frappe-Aufrufe; Leistung 05 §13.
- [ ] Jede `[Anfrage]`-Funktion ist ohne Feld/Methode ausgeblendet (nicht deaktiviert) und mit Feld/Methode sichtbar (Meta-Mock beider Varianten).
- [ ] Rechtliche Übergangsregeln aktiv: Meldezustand (Q-22), Regressfrist erst ab Anerkannt gewahrt (Q-25), Fotos `an_lieferant = 0` (Q-27), Widerruf `= 0` (Q-26), keine 0-%-Gutschrift (Q-28), Schließen-Sperre D-3 (Q-5), Technik kassiert nicht (Text sichtbar).
- [ ] Leerzustände §2.14 mit leerem Seed; Hilfe je Route.
- [ ] ESLint 0 Fehler; keine Laufzeit-Importe aus `../src/`; keine Geheimnisse im Code.

---

## 15. Änderungsprotokoll Fassung 3 (gegen Fassung 2)

**Struktur:** Phasen 7 → 6 („Entschieden“ statt „Entscheidung“, Einsatz geplant als Unterzeile); Nächster Schritt von Client-Regel auf Server-Quelle; A14 von Sheet auf Vollseite; Kulanz-Freigabe auf Zentrale-Komponente; Gutschrift auf Faktura-Weg; neue Abschnitte §0.1 Entscheidungen, §0.2 Code-Abgleich, §3.5–§3.8, §4.6–§4.9, §14 Bauauftrag; §12 als Anfragenliste A-S1–A-S21 mit Übergangsregeln; QA neu nummeriert Q-1–Q-40.

| Bezug | Umsetzung |
|---|---|
| N1 Code-Abgleich | §0.2; Kommentar-Kennzeichen `[erstreaktion]`, Fußnote „Zählung der App“, ToDo-Schließen durch Backoffice, Glocken-Weg `?fokus=kulanz` gestrichen; Telefonat-Dialog mit App-Kanälen; Einstellungen um SLA/Einsatzplanung/Regress/Portal/8 Vorlagen ergänzt (§2.13) |
| N2 eine Regel | §3.4 Server maßgeblich, geordnete Zielliste, gemeinsame Testdatei, fehlende Zeilen als A-S2 |
| N3 Abschluss mitgeteilt | D-3, S5 ohne Schließen bei offenem Lieferantenschritt, Massen-Vorschau, A-S3 |
| N4 eine Zahl | D-1 überall; Chip „Einsätze heute“ entfällt; Fristnamen fest; Reiterzähler ≤ 3 Aufrufe |
| N5 SLA | SLA-Zeile, Rot-Rangfolge mit SLA, eine Eskalationszahl (A-S9) |
| N6 Kulanz | Ablehnen, Zustand abgelehnt, keine PH Aufgabe, kein Timer; Bestätigung nach Zentrale (E1) |
| N7 Mail-Undo | §4.6: Vorschau pausiert, ein Knopf je Toast, Fehler nach Commit sichtbar, Adresse unmaskiert |
| N8 Umplanen | `umplanen` verzögert, Status Geplant, laufende nicht ziehbar, Absagen für alle mit Schreibrecht |
| N9 Akte-Kopf | „Entschieden“, 6 Phasen, Projekt als Karte, Punkt-Popover, keine Nächster-Schritt-Karte |
| N10 Bereichsstart | ein Tinte-Knopf, Zeilenaktion secondary, Wirkung ohne Seitenwechsel |
| N11 Fehlerwahl | eine Combobox, Art-Chips + Weitere; Seed mit `-99` vorhanden |
| N12 Ersatzteilbedarf | §3.5 Dialog, S3 Zeilenauswahl, Technik „Benötigtes Teil notieren“ |
| N13 Technik | 4 Bestätigungsarten, Pause, Bericht senden, verzögerte Statusknöpfe, kein Auto-Weiter, Kamera verweigert, Install-Band, Druck ohne Skalierung |
| N14 Kontrast | Fristband `line-control`, Muster `ink-soft`, Animation ohne Verzerrung, Drop-Ziele `accent` |
| N15 Bewegung | §2.0.4 Token-Tabelle; Konzept nennt nur Token |
| N16 Kürzel | E3: Zentrale-Register, `e`/`t`/Shift-Kürzel gestrichen, Kalender ein Fokusmodell, `Strg+Enter`-Regel |
| N17 Klickzahlen | §1 ab Zentrale, `Strg+K` als zweite Spalte, Zählweise ergänzt |
| N18 A14 | Vollseite, Raster aus Einstellungen, Leerzustände ohne Techniker/alle abwesend |
| N19 Regress-Abgleich | §2.8 Gutschrift erfassen, Abgleich, Ausbuchen, Reiter Unterdeckung |
| UX §3 Empfehlungen | übernommen: Mitarbeiter ohne Charts, Kanban „Erledigt“ eingeklappt und ohne Spalte „Einsatz geplant“, keine Kanban-Mehrfachauswahl, Esc ohne Rückfrage in S1-Schnell, max. 2 neutrale Kennzeichen, Ressourcen-Zeitleiste, Telefonnummern-Suche, Fokus nach Statuswechsel, Baum-Tastaturmodell, Palette „Dieser Fall“, zusätzliche Leer-/Fehlerzustände, „noch/seit“-Texte, schmale Nummernspalte, Seitengröße 50, Microcopy („Kunde kontaktiert“, „Lieferant haftet“, Knopf = Regeltext), iPad-Kopf, Karten < 768 px, Leitung-Freigabe bei 390 px. Offen: Tab-Zusammenlegung (I6) |
| F1–F12 | §0.2 und §2.11 (Seed), §3.4/§2.3 (Erstreaktion, Kanal Vor Ort), §4.9 (Kulanz), §3.6/§4.1 (Vorlagen ablehnung/frei), §3.1/§2.13 (SLA), §3.4 (Server-Regel), §2.6 (Bewegungsarten), §2.8 (Buchhaltung extern), §2.8 (Gutschrift erfassen statt Workflow), §2.4/§4.3 (Methoden statt `set_value`, Bestätigungsarten), §2.13 (Einstellungen) |
| D1–D13 | D1 Spalte aus `gewaehrleistung_bis`; D2/D3 Fristband aus gespeicherten Feldern, `sachart` sichtbar; D4/D5 §4.8, §2.9, §2.10 (Stufe 2/A-S8); D6 Position (A-S16); D7 §3.6; D8 Art-Weiterleitungen; D9 §2.7; D10 §7 Vorbelegung `aus_bestand`; D11 §3.1 Abnahme nicht editierbar; D12 §7 Pause; D13 `get_technician_slots` |
| U-01–U-07 | SLA-Zeile; Kulanz-Status-Texte; Abgleich; Galerie Video/PDF; Aufbewahrung (A-S18); Übergabequelle im Fristband; Kennzeichen Portal/Website + Zuordnung |
| R-01–R-15 | R-01 §3.2 Meldezustand; R-02 §3.7 Mängelanzeige S4a; R-03 §2.8 Ampel bis Anerkannt, kein § 933b bei Unternehmer/Kulanz; R-04 Übergabequelle umschaltbar; R-05 §2.9 Widerruf = 0; R-06 E8, S4a; R-07 A-S18 + Zentrale-Auskunft; R-08 §3.8; R-09/R-10 §2.9 Aktivieren-Dialog, Hinweis § 15 KSchG; R-11 A14 Kostenhinweis; R-12 §7 kassiert nicht; R-13 keine Techniker-Berichte, Erstbesuchs-Satz; R-14 Anrede-Rückfall; R-15 Garantie-Hinweis, Ablehnungsgrund-Sperre |
| B-01–B-08 | B-01 E4/§4.7; B-02 Kostenarten-Select, ein Betrag; B-03 „netto“, „Kosten nach Regress“; B-04 A-S12; B-05 „Regress verrechnet“ nur ohne Geldfluss; B-06 Pflegemittel in Logistik; B-07/B-08 A-S12 mit Hinweis |
| P-R1–P-R8 | S9/S10/§4.8 als Stufe 2 mit Übergangskarten; P-R4 Mahnsperre in S1/S5/Hängemappe; P-R5 Lieferanten-Leiste (A-S20); P-R6 Art-Weiterleitungen; P-R7 §2.9/§2.10; P-R8 A-S21 mit Übergang |
| Randfälle | R-S1/R-S2 §4.7; R-S3 Banner ⑧; R-S4 §2.7; R-S5 Absagen; R-T1 A-S16 + Fehlmenge-Weiterleitung; R-T2 Fristband „Übergabe steht aus“; R-A1–R-A3 §4.7, Mahnsperre; R-R1 Altteil (A-S11); R-R2/R-R3 S9/S10, Weiterleitung; R-W1–R-W3 §4.7, §2.8, A14 Ausland; R-E1–R-E3 §3.6; R-U1 Unternehmer: Fristband-Paragrafen, kein § 933b (vertragliche Gewährleistungsmonate als Anfrage in A-S1); R-U2 wie R-W3; R-K1 Kulanz-Banner; R-K2 §4.7 |
| P-01–P-27 | P-01/P-02 A-S1 + §3.2; P-03 A-S2 + S4a; P-04 A-S4; P-05 §2.9 + A-S17; P-06 E8 + A-S14; P-07 E4 + A-S7; P-08 B-02/B-03 + A-S12; P-09 §3.6 + A-S3; P-10 Stufe 2; P-11 Mahnsperre; P-12 §4.3; P-13 §2.8 + A-S12/A-S13; P-14 E5; P-15 §2.9 + A-S17; P-16 A-S18; P-17 §3.8 + A-S14; P-18 A-S5; P-19 A-S8; P-20 §7 + A-S10; P-21/P-22 §2.6/§2.7 + A-S11; P-23 §3.1 + A-S10; P-24 §3.4; P-25 dieses Protokoll; P-26 A-S21; P-27 A-S13 |
| Gestrichen | Kommentar-Kennzeichen `[erstreaktion]`/`[umgeplant]`; Erstbetriebs-Knopf „Fehlerkatalog einrichten“; Kulanz-Zweitklick mit 5-s-Timer; Toast mit zwei Aktionen; Kürzel `e`, `t`, `Shift+S/K/P/A/F`, `Alt+1…5`; 10-s-Mail-Undo; Übersichtskarte „Nächster Schritt“; Kanban-Spalte „Einsatz geplant“; „Regress verrechnet“ als Standardweg; PH Aufgabe bei Kulanz-Anfrage |

*Ende 10 – Konzept Service (Fassung 3, final).*
