# 20 – UX-/UI-Kritik Bereich „Service“, Runde 2 (zu `10-konzept-service.md` Fassung 2)

**Zweck:** Zweite strenge Prüfung des Service-Konzepts (Fassung 2, nach Einarbeitung von P1–P22 aus Runde 1) gegen Nielsen-Heuristiken, WCAG 2.2 AA, Mobile-/Kiosk-Regeln (Technik mobil) und die Leitlinien 01–05, dazu ein Abgleich mit dem aktuellen Code von `ph_service`. Ergebnis: Note, Stand der Pflichtänderungen aus Runde 1, neue Pflichtänderungen N1–N19 (je mit Abnahme), Empfehlungen, Widersprüche in den Leitlinien, Abnahme-Ergänzungen für §10.
**Stand:** 2026-11-04 · Rolle: UX-/UI-Kritiker · Status: Prüfbericht, keine Entscheidung des Inhabers.
**Geprüft:** `10-konzept-service.md` Fassung 2 (993 Zeilen, vollständig); `01-benchmark-prinzipien.md` (A9, C1, C2, C6, D6, D9, D10, E1–E3, F7, H3, I3); `02-ux-leitlinien.md` (§0, §2.1, §3, §5–§7, §9–§11); `03-design-system.md` (§1.3–§1.6, §7, §8.7–§8.14, §8.18–§8.20); `04-motion.md` (§2.1, §3.5, §3.6, §3.13, §4); `05-informationsarchitektur.md` (§1, §2, §3.9, §3.14, §7.4, §12.5, §13). Code: `Backend-Import/ph_service/ph_service/` – `ph_servicefall.py` (Stand 11:57), `ph_serviceeinsatz.py` (Stand 12:00), `ph_lieferantenregress.py`, `utils/schritte.py`, `utils/sla.py`, `utils/kulanz.py`, `utils/regress.py`, `utils/einsatz.py`, `tasks.py`, `install.py`, `kennzahlen.py`, Fixtures `email_template.json`, DocType-JSONs Servicefall/Serviceeinsatz/Lieferantenregress/Service Einstellungen.
**Hinweis:** Diese Datei ersetzt die Fassung von Runde 1. Die Nummern P1–P22 bleiben gültige Bezüge (Tabelle §1); neue Pflichtänderungen heißen **N1–N19**. Der Code von `ph_service` wurde nach Fassung 2 des Konzepts geändert (Dateizeiten 11:57–12:00, Konzept 11:45) – mehrere „fehlt“-Einträge des Konzepts sind damit überholt (N1).

---

## 0. Urteil

**Note: 7,5 / 10** (Runde 1: 6,5).

**Stark (neu oder deutlich besser):** Akte mit 5 Tabs und nur Lesekarten in der Übersicht (§3.1); eine Filterzeile und 7 einzeilige Spalten (§2.2); S1-Schnell als Telefon-Standard mit Entwurf in IndexedDB (§2.3.1); eine Bestätigungsregel für den ganzen Bereich (§4.1); Teilfehler-Regel mit Einzel-„Erneut“ (§4.4); Technik mit genau einem Primärknopf, ohne Querformat-Zwang, 60-min-Sperre ohne Sperre im laufenden Einsatz (§7); Leerzustands-Tabelle als Abnahmeliste (§2.14); Hilfe je Route (§13); Akzeptanzkriterien 26–45 messbar.

**Schwach:**
1. **Das Konzept beschreibt Übergangslösungen für Methoden, die es inzwischen gibt** (`erstreaktion_erfassen`, `kulanz_freigeben/ablehnen/anfordern`, `umplanen`, `abbrechen`, `ersatzteile_bestellen(zeilen)`, Vorlagen „Ablehnung“ und „Nachricht“, Fehlerkatalog-Seed in `install.py`). Die sichtbarste Folge der Übergangslösungen – zwei verschiedene Zahlen für „Reaktion überfällig“ und ein ToDo, das jeden Morgen wiederkommt – entfällt nur, wenn das Konzept nachgezogen wird (N1).
2. **Zwei Regelwerke „Nächster Schritt“** (Client `naechsterSchritt.js` laut §3.4 und Server `utils/schritte.py`) liefern in mindestens 6 Zuständen unterschiedliche Knöpfe (N2).
3. **Die Mitarbeiter-Sperre für „Schließen“ greift nicht:** Jede Kundenmail – auch die Eingangsbestätigung – setzt `kunde_informiert_am`; damit ist der Abschluss ohne Abschlussinfo und ohne Regress möglich (N3).
4. **Neue Zustände der App haben keine Oberfläche:** Lösungsfrist (SLA) mit `sla_status`, Kulanz „Abgelehnt“, Bestätigungsart beim Einsatzabschluss, Pause, Regress-Abgleich mit Unterdeckung/Ausbuchen (N5, N6, N13, N19).
5. **Kleine Regelbrüche, die sich über 12 Bereiche vervielfachen:** Kulanz-Freigabe per 5-s-Zweitklick gegen die eigene Bestätigungsregel (N6); Toasts mit zwei Aktionen und Mail-Vorschau, während der Versand-Timer weiterläuft (N7); bis zu 8 Tinte-Knöpfe auf dem Bereichsstart (N10); 7 Bewegungswerte außerhalb der Token (N15); Kürzel `e`, `t`, `Z` nicht registriert bzw. kollidierend (N16); Kontrast des Fristbands und der Drag-Ziele unter 3:1 (N14).
6. **Lücken im Hauptablauf:** Ersatzteilbedarf erfassen ist nirgends spezifiziert (N12); A14 hat keinen definierten Behälter und keinen Leerzustand ohne Techniker (N18); Klickzahlen messen ab „Akte“ statt ab Zentrale (N17).

Die Bauteile sind richtig gewählt; was fehlt, ist Abgleich (Code, Leitlinien) und Konsequenz in den Einzelregeln. Mit N1–N19 ist der Bereich baureif.

---

## 1. Stand der Pflichtänderungen aus Runde 1

| Nr. | Thema | Stand Fassung 2 | Rest / Bezug |
|---|---|---|---|
| P1 | Telefon ohne E-Mail → falsch überfällig | umgesetzt als Übergang (Kommentar `[erstreaktion]`) | **überholt:** `erstreaktion_erfassen()` und `before_insert` (Kanal Telefon/Showroom + Einstellung `telefon_ist_erstreaktion`) existieren → N1 |
| P2 | Akte 8 Tabs | umgesetzt (5 Tabs, Übersicht nur lesend) | „Nächster Schritt“ steht jetzt dreimal → N9 |
| P3 | Unternavigation | umgesetzt (6 Pills + Mehr) | 05 §3.9 noch mit alten Routen und „7 Tabs“ → §5 |
| P4 | Klickzahlen | teilweise | Startpunkt „Akte“ und ⌘K widersprechen 02 §0.3 → N17 |
| P5 | S1 zu lang | umgesetzt (S1-Schnell) | Fehlercode-Kacheln skalieren nicht auf 12 Bereiche des Seeds → N11 |
| P6 | Mail-Regel | teilweise | Vorschau ohne Pause, Toast mit 2 Aktionen, Fehler nach Ablauf unsichtbar → N7 |
| P7 | Technik zwei Primärknöpfe | umgesetzt | – |
| P8 | Querformat erzwungen | umgesetzt | 02 §11.3 und 03 §8.20 (Canvas 200 px) noch nicht angepasst → §5 |
| P9 | „In Bearbeitung nehmen“ leerer Klick | umgesetzt | – |
| P10 | Kulanz in der Glocke | teilweise | Methode existiert; Zweitklick-Timer widerspricht §4.1; „Ablehnen“ fehlt → N6 |
| P11 | Fehlerkatalog leer | Prämisse falsch | `install.py` legt 12 Bereiche und Codes an (`after_install`); „-99 Sonstiges“ fehlt dort weiterhin → N11 |
| P12 | Leerzustände | umgesetzt (§2.14) | 7 weitere Orte → §3.4 |
| P13 | Kürzel-Kollisionen | teilweise | `e` = CSV vs. 02 §9.1 `E` Bearbeiten; `t`, `Z` nicht registriert → N16 |
| P14 | Status-Töne | umgesetzt | Statusname „Entscheidung“ irreführend; SLA „Verletzt“ fehlt in der Rot-Rangfolge → N5, N9 |
| P15 | Liste überladen | umgesetzt | Reiterzähler sprengen das Aufrufbudget 05 §13 → N4 |
| P16 | Kanban-Verbote nur Tooltip | umgesetzt | weicht von 03 §8.8 ab, Hinweis-Umrandung 2,0:1 → N14, §5 |
| P17 | Teilfehler Mehrschritt | umgesetzt für Assistenten | nicht für verzögerte Mails → N7 |
| P18 | Phasenleiste zu breit | umgesetzt | Schleife In Bearbeitung ⇄ Einsatz geplant linear dargestellt → N9 |
| P19 | Massen-Schließen ohne Undo | umgesetzt | – |
| P20 | Kalender-Drag bestätigter Einsatz | teilweise | `umplanen()` setzt Status auf „Geplant“ – Konzept lässt „Bestätigt“ stehen → N8 |
| P21 | Technik Sperre/Cache/Fotos | umgesetzt | WebKit-Speicherlöschung bei nicht installierter Web-App → N13 |
| P22 | Abnahme in S5 | umgesetzt | Bestätigungsarten der App („Verweigert“, „Kunde abwesend“) fehlen → N13 |

---

## 2. Neue Pflichtänderungen (vor Umsetzung, nach Wirkung sortiert)

| Nr. | Befund | Verstoß gegen | Änderung (konkret) | Abnahme |
|---|---|---|---|---|
| N1 | **Konzept hinkt dem Code hinterher.** Vorhanden (nicht mehr „fehlt“): `PH Servicefall.erstreaktion_erfassen(kanal, notiz)` (Kanäle `Telefon`, `Vor Ort`, `Rückruf`, `E-Mail`, `Portal`; schließt Reaktions-ToDos); `before_insert` setzt `erstreaktion_am` für Kanal Telefon/Showroom bei Einstellung `telefon_ist_erstreaktion`; `kulanz_anfordern()`, `kulanz_freigeben(kommentar, betrag_cent)`, `kulanz_ablehnen(grund)`, Feld `kulanz_freigabe_status` (Nicht nötig/Angefordert/Freigegeben/Abgelehnt); `ersatzteile_bestellen(lieferant, zeilen, lieferadresse, wunschtermin)`; `ablehnen(grund, begruendung, kunde_informieren)`; `kunde_informieren(vorlage ∈ eingang/termin/abschluss/ablehnung/frei, zusatz, betreff)`; `PH Serviceeinsatz.umplanen(datum, zeit_von, zeit_bis, techniker, grund)`, `abbrechen(grund)`, `abschliessen(…, pause_min, unterschrift_art, bericht_senden)`, `bericht_senden()`; Regress `gutschrift_erfassen()`, `differenz_ausbuchen()`, Feld `abgleich_status`; SLA-Felder `frist_loesung`, `sla_status`, `sla_eskalationsstufe`; Fehlerkatalog-Seed in `install.py`. **UX-Folge der veralteten Übergänge:** (a) Kommentar-Kennung `[erstreaktion]` ist von jedem Benutzer per Kommentar auslösbar und löschbar; (b) `tasks._todo` dedupliziert nur **offene** ToDos – ein vom Backoffice geschlossenes Reaktions-ToDo entsteht beim nächsten Lauf 06:30 neu, solange `erstreaktion_am` leer ist → Glocke meldet denselben Fall jeden Morgen; (c) Reiter/Heute-Leiste und Kennzahl/GF-Zentrale zählen verschieden (§3.4 Fußnote). | Nielsen 1, 4, 5; 02 §0.4; 05 §16 „keine Annahmen im Bau“ | Fassung 3 mit §0.2 „Abgleich Code 04.11. 12:00“. Streichen: §3.4 Block „Übergangsregel“, Fußnote „Zählung der App“ (§3.4, §5), Reiter-Ausnahme „ohne Fälle mit Telefon-Erstreaktion“ (§2.1, §2.2), ToDo-Schließen durch den Backoffice-Server (§8), Comment-Abfrage in §9, Glocken-Weg „öffnet Akte mit `?fokus=kulanz`“ (§1.2, §4.5, §10 Nr. 41). Ersetzen: S1-Schalter (siehe N11-Wireframe) nur sichtbar, wenn `telefon_ist_erstreaktion = 0` – sonst Textzeile „Kunde gilt als kontaktiert (Telefon)“; Dialog „Erstreaktion erfassen“ mit Segment `Telefon · Vor Ort · Rückruf` (App-Werte; „Showroom“ ist ein Meldekanal, keine Erstreaktionsart – sonst wirft die Methode „Unbekannter Kanal“). §9/§12 je Methode neu: vorhanden / fehlt / anders als angefragt. Einstellungen §2.13 um die neuen Felder ergänzen (Karte „Service-Zeiten (SLA)“: `sla_reaktion_*`, `sla_loesung_*` je Priorität, `sla_warn_werktage`, `sla_gf_ab_stufe`, `telefon_ist_erstreaktion`; Karte „Einsatzplanung“: `einsatz_takt_min`, `einsatz_puffer_min`, `techniker_tag_von/bis`; Regress: `regress_toleranz_cent`; Portal: `portal_videos_max`, `portal_video_max_mb`; Vorlagen: 8 statt 5). | Grep `[erstreaktion]` im Konzept und in `backoffice/src` = 0; §12 Priorität 1 enthält nur Punkte, die im Code fehlen; E2E: Telefonfall ohne E-Mail erzeugt nach 3 Werktagen (Mock-Uhr) kein ToDo, Reiter, Heute-Leiste, Kennzahl und GF-Zentrale zeigen dieselbe Zahl. |
| N2 | **Zwei Regelwerke „Nächster Schritt“.** §3.4 legt die Regel in den Client; `utils/schritte.py` liefert serverseitig `schritt, aktion, faellig, rang`. Abweichungen: Gemeldet ohne Erstreaktion (Server: „Kunde kontaktieren“, Client: „Eingangsbestätigung senden“ bei E-Mail); Gemeldet ohne Fehlercode (Server: „Fehlercode zuordnen“); Ersatzteile bestellen schon in „Entscheidung“ (Server) vs. nur „In Bearbeitung“ (Client); Einsatz geplant + unbestätigt (Client: „Terminvorschlag senden“, Server: „Einsatz durchführen“); Preisminderung/Kulanz → „Gutschrift erstellen“ und „Folgeeinsatz planen“ nur im Client; Erledigt: Server prüft Regress **vor** Kundeninfo, Client-Tabelle umgekehrt; Fälligkeits-Rückfall `frist_loesung` nur im Server. Die Tabelle §3.4 sagt außerdem nicht, welche Zeile bei mehreren Treffern gewinnt. | 02 §0.1 (ein Muster), Nielsen 4, 01 C6 (Sortierung nach nächstem Schritt) | **Eine Quelle:** Server `schritte.py` ist maßgeblich (sie ist auch der Sortierschlüssel `rang` für Liste und Heute-Leiste); `naechsterSchritt.js` ist eine Spiegelung für optimistische Anzeige. Gemeinsame Testdatei `schritte.faelle.json` (Eingabe-Dict → erwartetes Ergebnis), die Python-Test und JS-Test beide lesen. §3.4 als **geordnete** Liste „erste passende Zeile gewinnt“, Reihenfolge: Kulanz angefordert/abgelehnt → Erstreaktion offen → Fehlercode fehlt → Prüfen → Entscheiden → Ersatzteile benötigt → Ersatzteile erwartet → Gutschrift → Einsatz planen → Einsatz unbestätigt → Einsatz läuft → Folgeeinsatz → Erledigt melden → **Lieferant informieren** → Abschluss mitteilen (N3) → Schließen. Fehlende Zeilen als Anfrage an `ph_service` (Gutschrift, Folgeeinsatz, Terminvorschlag unbestätigt, Kulanz abgelehnt). Primär „Eingangsbestätigung senden“ bleibt **Knopftext**, wenn `kunde_email` vorhanden; Aktion des Servers `erstreaktion_erfassen` bleibt Sekundär („Telefonat erfassen“). Aggregat `naechste_schritte(names[])` als whitelisted API ist weiter Anfrage (Priorität 2), Logik ist da. | Testdatei mit ≥ 1 Fall je Zeile; CI läuft Python und JS gegen dieselben Fälle, 0 Abweichungen; Liste ist nach `rang` sortiert. |
| N3 | **„Schließen“-Sperre und Abschlussinfo greifen nicht.** `kunde_informieren()` setzt `kunde_informiert_am` bei **jeder** Vorlage (auch `eingang`, `termin`). Workflow-Bedingung „Schließen (Mitarbeiter): `kunde_informiert_am` oder `abnahme_bestaetigt`“ ist damit für fast jeden Fall erfüllt; §3.4 „Erledigt, `kunde_informiert_am` leer → Kunde informieren (Abschluss)“ erscheint nach einer Eingangsbestätigung nie. Folge: Kunde erfährt nicht, dass der Fall erledigt ist. Zusätzlich darf S5 optional sofort schließen – bei lieferantenrelevantem Fall ohne Regress verschwindet dann der Schritt „Lieferant informieren“ (Geschlossen hat keinen Primär), die Regressfrist § 933b läuft still ab. | Nielsen 5 (Fehlervermeidung), 02 §3.2 (Blocker sichtbar), 01 E3 | Begriff **„Abschluss mitgeteilt“** = Verlaufseintrag `ereignis=Kommunikation` mit Vorlage `abschluss` nach `erledigt_am` **oder** `abnahme_bestaetigt`. UI-Regel und Knopf-Blocker nutzen diesen Begriff („Schließen – erst nach Abschlussmail oder Abnahme“). Anfrage `ph_service`: Feld `abschluss_informiert_am` (gesetzt nur von Vorlage `abschluss`) und Workflow-Bedingung darauf. S5 Schritt ④: Option „Fall gleich schließen“ nur, wenn kein Regress offen ist; sonst Satz „Schließen nach ‚Lieferant informieren‘ (Regressfrist bis 12.11.)“ und Ergebniskarte mit Primär „Lieferant informieren“. Massen-Schließen: Vorschau schließt Fälle mit offenem Regress aus („2 übersprungen – Regress offen“). | E2E: Fall mit Eingangsbestätigung → Erledigt → Mitarbeiter-„Schließen“ deaktiviert mit Grundtext; nach Abschlussmail aktiv. Lieferantenrelevanter Fall: S5 bietet kein Schließen, Liste zeigt „Lieferant informieren“ mit Fälligkeit. |
| N4 | **Dieselbe Sache, verschiedene Zahlen und Namen.** (a) §10 Nr. 17 verlangt Reiterzahl = Kennzahl, Nr. 26 verlangt, dass Telefonfälle im Reiter fehlen, in der Kennzahl aber mitzählen – unvereinbar (mit N1 auflösbar). (b) „Keine Zahl erscheint zweimal“ (§2.1) gilt nicht für „Einsätze heute“ (Chip **und** Liste „Einsätze heute“ auf derselben Seite). (c) Drei Fristbegriffe auf einer Seite: Chip „Regressfrist ≤ 14 Tage“, Kachel-Liste „Fristen ≤ 14 Tage“ (Gewährleistung), Reiter „Fristen ≤ 60 Tage“, Kachel „Gewährleistung endet ≤ 60 Tage“. (d) §2.1 gibt Technikern die Kennzahlen „Einsätze diese Woche“ **und** „Einsätze heute“, §5 nur „Einsätze diese Woche“. (e) Reiterzähler: 6 `getCount` + Liste + Status-Counts überschreiten 05 §13 „Liste ≤ 3 Frappe-Aufrufe“. | Nielsen 4, 02 §14 (ein Wort je Sache), 05 §13 (Verstoß blockiert Abnahme) | (a) nach N1 eine Definition: `erstreaktion_am` leer, Status Gemeldet, `frist_reaktion < heute` – überall. (b) Chip „Einsätze heute“ entfällt, die Liste rechts trägt die Zahl im Titel („Einsätze heute · 3“). (c) Namen fest: „Gewährleistung endet ≤ 60 Tage“ (Reiter + Kachel), „Gewährleistung endet ≤ 14 Tage“ (Liste rechts), „Regressfrist ≤ 14 Tage“ (Chip); nie „Fristen“ allein. (d) §2.1 an §5 angleichen. (e) Reiterzähler aus **einem** Aufruf: Backoffice-Server zählt per `frappe.client.get_list` mit `group_by` bzw. einer Anfrage `ph_service.api.reiter_zaehler(user)`; bis dahin Zähler nur am aktiven Reiter, übrige ohne Zahl (Linear zeigt Zähler ebenfalls nur bei Bedarf). | Server-Log: `/service/faelle` ≤ 3 Frappe-Aufrufe; Snapshot: kein Begriff „Fristen ≤“ ohne Fristart. |
| N5 | **Lösungsfrist (SLA) ist unsichtbar, zwei Eskalationszähler.** Die App rechnet je Priorität Reaktions- und Lösungsfrist in Werktagen ohne Feiertage (`utils/sla.py`), setzt `sla_status` (Im Plan/Gefährdet/Verletzt/Erfüllt) und `sla_eskalationsstufe`; parallel bleibt `eskalationsstufe` aus `tasks.eskalation` (ohne Bewegung). Das Konzept kennt weder `frist_loesung` noch `sla_status`; „Eskalation n“ ist damit mehrdeutig. | Nielsen 1, 02 §0.5, 03 §1.5 (ein rotes Signal) | Akte-Kopf, Zeile unter der Phasenleiste: „Lösung bis 18.11. · im Plan“ (`muted`), „Lösung bis 18.11. · gefährdet“ (`warning-text` + `clock` 12 px), „Lösungsfrist seit 2 Werktagen überschritten“ (`danger-text` + `triangle-alert`). Liste: kein neuer Spaltenplatz – Fälligkeit „Nächster Schritt“ nutzt `frist_loesung` als Rückfall (wie Server). **Rangfolge des einen roten Signals:** Reaktionsfrist verletzt > Lösungsfrist verletzt > Gewährleistung abgelaufen > Eskalation. Kennzeichen „Eskalation n“ zeigt **eine** Zahl: Anfrage an `ph_service`, die beiden Stufen zusammenzuführen; bis dahin `max(eskalationsstufe, sla_eskalationsstufe)` mit `title` „Ohne Bewegung seit 6 Tagen“ bzw. „Lösungsfrist überschritten“. Status Erledigt/Geschlossen: SLA-Zeile „Lösung in Frist“ bzw. „Lösung 3 Werktage nach Frist“ (für Berichte). Reiter „Eskaliert“ filtert auf denselben Ausdruck. | Parametrisierter Test `sla_status` → Text/Ton; keine Zeile mit > 1 `danger`; Reiter „Eskaliert“ = Kennzeichen-Bedingung. |
| N6 | **Kulanz-Freigabe widerspricht der eigenen Regel und ist einseitig.** §4.1 ordnet „Kulanz freigeben“ den geld-/rechtswirksamen Aktionen mit **Dialog** zu; §4.5 nutzt einen Knopf, der für 5 s zu „bestätigen“ wird (Zeitlimit, WCAG 2.2.1; zweiter Klick auf dieselbe Stelle löst bei Doppelklick sofort aus, 01 I3). Die Leitung kann nur freigeben, nicht ablehnen; Zustand „Kulanz abgelehnt“ (App: `kulanz_freigabe_status=Abgelehnt`, ToDo an Verantwortliche) hat keine Oberfläche. „Freigabe anfragen“ legt eine PH Aufgabe an, obwohl die App selbst ToDo + Glocke an die Leitung erzeugt (doppelte Meldung). | 02 §6.2, 01 E2/I3, WCAG 2.2.1, Nielsen 3, 4 | Glocken-Eintrag klappt inline auf (kein Timer, kein Dialog über der Glocke) – Wireframe §2.1. „Freigeben“ ruft `kulanz_freigeben(kommentar, betrag_cent)` mit dem **angezeigten** Betrag (die App lehnt ab, wenn er sich geändert hat → Text des Servers im Eintrag + „Akte öffnen“). „Ablehnen“ öffnet im Eintrag ein Pflichtfeld Grund → `kulanz_ablehnen(grund)`. Gleicher Block in der Akte, Tab Bearbeitung, Karte Entscheidung (Leitung). Akte bei `Abgelehnt`: Banner `warning-soft` „Kulanz 620,00 € abgelehnt: <Grund> · [Entscheidung ändern]“ (öffnet S2 Teil 2). Mitarbeiter-Blocker: „Kulanz 620,00 € wartet auf Freigabe der Leitung (angefragt 09:12)“ + Textknopf „Erneut anfragen“ = `kulanz_anfordern()`; **keine** zusätzliche PH Aufgabe. Primär im S2 „Entscheiden und Freigabe anfragen“ ruft nur `save`/Workflow (die App benachrichtigt). Bestätigungsregel §4.1 bleibt: der aufgeklappte Eintrag **ist** die Bestätigung (Betrag, Fall, Begründung, Anforderer sichtbar), Knopf mit 600-ms-Sperre nach dem Aufklappen. | Klickzahl Glocke → Freigeben → „620,00 € freigeben“ = 3; Doppelklick auf „Freigeben“ löst nicht aus; Betrag geändert → Fehlertext, kein Aufruf ohne `betrag_cent`; Ablehnen ohne Grund nicht möglich. |
| N7 | **Mail-Undo hat vier Lücken.** (a) „Vorschau öffnet die Vorlage im Sheet, ohne den Timer zu stoppen“ – wer prüft, verschickt währenddessen. (b) Toasts mit zwei Aktionen („Rückgängig · Vorschau“, „Kunde informieren · Rückgängig“) – 03 §8.12 erlaubt eine. (c) Zwei Toasts nacheinander (Termin verschoben → „Kunde informieren“ im Toast → Mail-Toast): `Z` macht den jüngsten rückgängig, also die Mail, nicht die Verschiebung. (d) Scheitert der Versand **nach** Ablauf (Seite verlassen, Server-Fehler), sieht es niemand. Außerdem ist die Adresse im Toast maskiert („h…@…“) – Mitarbeiter können nicht prüfen, wohin die Mail geht. | 02 §6.1, 03 §8.12, 04 §3.6, Nielsen 1, 3, 5, 9 | (a) Vorschau **pausiert** den Timer; Sheet-Fuß „Jetzt senden“ (Primär) · „Nicht senden“ (sekundär); Schließen des Sheets setzt den Timer mit dem Rest fort. (b) Toast trägt nur „Rückgängig“; Vorschau ist ein Link im Toasttext („Eingangsbestätigung an huber@beispiel.at wird gesendet – ansehen“) **oder** über die geplante Zeile in der Zeitleiste („Wird gesendet in 7 s · Ansehen · Nicht senden“). (c) „Kunde informieren“ nicht im Verschiebe-Toast; stattdessen wird es Primärknopf der Einsatzkarte/-akte (Kennzeichen „neu“, N8). (d) Fehler nach Commit: Glocken-Eintrag (Priorität hoch) „Eingangsbestätigung an … nicht gesendet: <Grund>“ + Akte-Kopf-Hinweis (Regel §4.4) + Zeitleisteneintrag mit `circle-x` und „Erneut“. Adresse im Backoffice unmaskiert (Maskierung gilt für Portal/Logs). | E2E: Vorschau öffnen → 30 s warten → kein Aufruf; „Jetzt senden“ → genau ein Aufruf. Kein Toast mit > 1 Aktionsknopf (Grep `undo` + `aktion` im selben Aufruf). Simulierter 500 nach Commit → Glocke + Kopf-Hinweis. |
| N8 | **Umplanen widerspricht der App.** `umplanen()` erlaubt nur Status Geplant/Bestätigt, setzt Status auf **„Geplant“**, löscht `bestaetigt_kunde_am`, zieht den Kalendertermin nach und schreibt Verlauf. Das Konzept lässt den Status „Bestätigt“ mit Zusatz stehen (§2.4), plant `set_value` + Kommentar `[umgeplant]`, sagt nichts zu laufenden Einsätzen und erlaubt „Abbrechen“ nur der Leitung (App: Schreibrecht genügt). Undo der Verschiebung per Gegenaufruf würde die Kundenbestätigung endgültig verlieren. | Nielsen 1, 5; 02 §6.1; 04 §3.6 Variante A | Drag und `m`-Dialog rufen `umplanen(datum, zeit_von, zeit_bis, techniker, grund)` **verzögert** (Variante A, 8 s): Karte optimistisch am neuen Platz, Badge „Geplant“ + Kennzeichen „neu – Kunde informieren“ (`warning-soft`), Toast „Termin auf Do 06.11. 10:00 verschoben · Rückgängig“. Nach Commit: Primär der Einsatz-Akte und Zeile in „Jetzt dran“ = „Terminvorschlag senden“. Karten mit Status Unterwegs/In Arbeit/Erledigt/Nicht angetroffen/Abgebrochen sind **nicht** ziehbar (Cursor normal, Fokus-Hinweis „Läuft – Verschieben nicht möglich“); `m` zeigt denselben Satz deaktiviert mit Text. `m`-Dialog hat Feld „Grund“ (optional, Vorschlagschips „Kunde verschiebt“, „Teil fehlt“, „Techniker krank“). „Einsatz absagen“ (`abbrechen(grund)`) im `⋯` für alle mit Schreibrecht, Dialog rot sm, Grund Pflicht, Satz „Kalendertermin wird storniert. Fall geht zurück in Bearbeitung, wenn kein Einsatz mehr offen ist.“ §4.2-Tabelle und §9 angleichen. | E2E: Drag eines bestätigten Einsatzes → nach 8 s ein `umplanen`-Aufruf, Status Geplant, Kennzeichen sichtbar; `Z` innerhalb 8 s → kein Aufruf, Bestätigung bleibt. Drag eines „Unterwegs“-Einsatzes nicht möglich. |
| N9 | **Akte-Kopf: Begriffe und Phasen.** (a) App-Status `Entscheidung` bedeutet „entschieden, wartet auf Start oder Freigabe“; das Konzept beschreibt ihn als „wartet auf Entscheid“ (Icon `scale`) – falsches Modell. (b) Phasenleiste zeigt „In Bearbeitung → Einsatz geplant“ linear, der Workflow ist eine Schleife (Einsatz erledigt → zurück In Bearbeitung): Punkte würden rückwärts „hohl“. (c) Ein Servicefall mit `projekt` bekommt nach 02 §3.1 zusätzlich die Projekt-Vorgangsleiste – zwei Leisten übereinander. (d) Punkte filtern die Zeitleiste (anderer Tab), 02 §3.1 lässt Punkte das Objekt öffnen – zwei Verhalten für dasselbe Bild. (e) „Nächster Schritt“ steht dreimal (Primärknopf, Textzeile im Kopf, Karte in der Übersicht); im Wireframe sagen Knopf und Zeile Verschiedenes („Prüfen & entscheiden“ / „Entscheidung treffen“); das Wireframe zeigt außerdem das Kulanz-Banner im Status „Geprüft“, in dem es noch keine Kulanz gibt. | Nielsen 2, 4, 8; 02 §3.1; 03 §8.20 | (a) UI-Text für `Entscheidung` = **„Entschieden“** (App-Wert bleibt), bei `kulanz_freigabe_status=Angefordert` Zusatz „wartet auf Freigabe“. (b) **6 Phasen:** Gemeldet · Geprüft · Entschieden · In Bearbeitung · Erledigt · Geschlossen; Status „Einsatz geplant“ ist Unterzeile der Phase 4 („Einsatz Do 07.11., T. Steiner“), Badge bleibt. (c) Projekt nicht als zweite Leiste: Karte „Projekt P-26-0042 · Phase Übergabe →“ oben in der rechten Spalte. (d) Punkt-Klick öffnet Popover „Geprüft am 03.11. 09:12 von Anna · Im Verlauf zeigen“ (Popover 120 ms, 04 §3.5). (e) Kopf zeigt die Textzeile nur als **Blocker** („Kulanz wartet auf Freigabe …“) oder als SLA-Zeile (N5); die Übersichtskarte „Nächster Schritt“ entfällt. Knopftext = Text der Regel (eine Quelle, N2). Wireframe §3.1 korrigiert (§2.1 unten). | Snapshot: genau ein Element mit Text der Regel im Kopf; Phasenleiste 6 Punkte; Fall mit Projekt zeigt eine Leiste. |
| N10 | **Bis zu 9 Tinte-Knöpfe auf dem Bereichsstart.** „Jetzt dran“ zeigt den Primärknopf **in jeder Zeile** (max. 8) plus Seiten-Primär „Servicefall melden“. Wo die Zeilenaktion wirkt (Sheet über der Seite oder Sprung in die Akte), ist offen. | 01 E1 („keine Seite mit zwei Tinte-Buttons“), 02 §0.2 | Zeilenaktion = Knopf `secondary` sm (28 px, Rand `line-control`), Tinte nur für die Seitenaktion. Hover/Fokus der Zeile zeigt `<kbd>⌘↵</kbd>` am Knopf. Wirkung: Aktionen mit Sheet (S2, A14, Erstreaktion) öffnen das Sheet **über** dem Bereichsstart; Ergebnis aktualisiert die Zeile in place (160 ms `--bo-ease-out`, 04 §3.3), erledigte Zeilen verlassen die Liste mit 120 ms; Fokus springt auf die nächste Zeile. Ein-Klick-Aktionen (Eingangsbestätigung) laufen ohne Seitenwechsel mit Undo (N7). | Snapshot: genau ein `variant=primary` je Seite; nach Aktion bleibt die URL `/service`. |
| N11 | **Fehlercode-Wahl im Schnell-Sheet skaliert nicht.** Der Seed hat 12 Bereiche mit je mehreren Codes; „Bereich“-Kacheln mit „…“ und 7 Arten als Segment passen nicht in eine Zeile eines 640-px-Sheets und müssen umbrechen oder scrollen. Telefonfall braucht zwei Kachelwahlen nacheinander. Fallback-Codes `<BER>-99 Sonstiges` fehlen im Seed weiterhin. | 02 §4.3 (Pflicht + 2–3 häufigste), 03 §8.10 (Segment für wenige Werte), Nielsen 6, 7 | **Ein Feld „Fehler“** (Combobox, 03 §8.3): Suche über Code, Bezeichnung, Bereich, typische Ursache; Treffer gruppiert nach Bereich mit Bereichspunkt; leer: Chips der 6 zuletzt im Team genutzten Codes + „Alle Bereiche ▾“ (Baum). Enter wählt, darunter Standardlösung (Einblenden 120 ms). **Art:** Chips Mangel · Transportschaden · Montagefehler + „Weitere ▾“ (Garantie, Kulanz, Pflegefrage, Serviceauftrag). Kopf des Sheets ≤ 1 Bildschirmhöhe bei 1366 × 768 mit eingeklapptem „Weitere Angaben“. Anfrage an `ph_service`: `install.py` legt je Bereich `<BER>-99 Sonstiges` an (`gruppe=Sonstiges`, `lieferantenrelevant=0`); Fallback-Zeile im Combobox-Ergebnis „Sonstiges (Polster)“. Leerzustand §2.11 bleibt für Mandanten, die den Katalog geleert/deaktiviert haben. Klickzahl S1-Schnell = 5 (siehe N17). | E2E: „naht“ tippen → POL-01 erster Treffer → Enter; Sheet ohne Scroll bei 1366 × 768; jeder Bereich hat `-99`. |
| N12 | **Ersatzteilbedarf erfassen ist nicht spezifiziert.** „Ersatzteil hinzufügen“ erscheint nur als Leerzustands-Knopf; Felder, Suche, Status-Wahl (Aus Bestand/Bestellen), Reservierung und Undo fehlen. Techniker-Ergebnis „Ersatzteil nötig“ erzeugt keine Zeile – die Sachbearbeitung muss nachfragen. | Nielsen 7, 02 §4.1 (Positionen = Formular/Dialog), 3.3.7 Redundante Eingabe | Dialog md „Ersatzteil hinzufügen“: Ersatzteil (Link-Suche `bezeichnung`/`hersteller_nr`, Scanner, Zeile zeigt „verfügbar 10 · R2-F3“), Freitext „Nicht im Katalog“ (Bezeichnung, Hersteller-Nr.), Menge (Stepper 44 px), Quelle Segment `Aus Bestand` (nur wenn verfügbar ≥ Menge, sonst deaktiviert mit Text „nur 1 verfügbar“) · `Bestellen`; Primär „Hinzufügen“ (`⌘↵`), sekundär „Hinzufügen und bestellen“ (→ S3 mit dieser Zeile vorgewählt, `zeilen[]`). Zeilenstatus in der Tabelle als Chip-Popover (Benötigt/Aus Bestand/Storniert) mit Undo 8 s. S3 Schritt ①: Checkboxen je Zeile (Methode nimmt `zeilen`), Hinweis zu einzelnen Zeilen streichen. Technik ② „Ersatzteile verbraucht“ bekommt unten „+ Benötigtes Teil notieren“ (Bezeichnung, Foto, Menge) → Zeile Benötigt am Fall (Anfrage: Parameter `benoetigt[]` an `abschliessen`, bis dahin `save` am Fall nach dem Abschluss als eigener Teilschritt). | E2E: Akte → Bearbeitung → „Ersatzteil hinzufügen“ → Bestellen → S3 mit 1 Zeile; Technik-Ergebnis „Ersatzteil nötig“ mit notiertem Teil → Fall zeigt Zeile „Benötigt“. |
| N13 | **Technik mobil: App-Zustände ohne Oberfläche, Fehltipps ohne Rückweg.** (a) `abschliessen` kennt `unterschrift_art` Unterschrift/Name bestätigt/Verweigert/Kunde abwesend – UI kennt nur die ersten zwei. (b) `pause_min` beeinflusst Arbeitszeit und Kosten – kein Feld. (c) `bericht_senden` (Servicebericht an Kunden) – kein Schalter. (d) Fehltipp auf „Angekommen – Einsatz starten“ setzt `ankunft` (abrechnungsrelevant) ohne Undo. (e) Ergebnis-Kachel: ob ein Tipp automatisch weiterschaltet, ist offen; automatisches Weiterschalten bei Auswahl ist eine Kontextänderung (WCAG 3.2.2). (f) Kamera verweigert: kein Zustand. (g) Offline-Puffer liegt in IndexedDB; WebKit löscht skriptgeschriebenen Speicher von Websites nach 7 Tagen ohne Nutzung, Web-Apps auf dem Home-Bildschirm sind ausgenommen. (h) Druck-Feedback `scale(0.98)` 80 ms widerspricht 04 §4 (Kiosk: nur `background-color`). | WCAG 3.2.2, 2.5.8; 02 §6.1; 04 §4; 01 F7; Nielsen 3, 5 | (a) Schirm ④ „Bestätigung“ mit Segment (48 px) `Unterschrift` · `Name bestätigt` · `Kunde abwesend` · `Verweigert` (Wireframe §2.3); bei „Verweigert“ Pflicht-Hinweis 1 Zeile. (b) Schirm ③ „Pause“ als Chips 0 · 15 · 30 · 45 · 60 min (Standard 0) mit Satz „Arbeitszeit 2 h 15 min (08:05–10:50, ohne Pause)“. (c) Fertig-Schirm: Schalter „Servicebericht an Kunden senden“ (nur mit E-Mail, Standard aus) → `bericht_senden=1`. (d) Statusknöpfe Unterwegs/Starten: verzögerter Commit 5 s (04 §4 Kiosk), Toast oben Mitte „Ankunft 08:05 gemeldet · Rückgängig“ (Ankunft = Zeit des Tipps, nicht des Commits); offline gleich, Aktion geht nach Ablauf in die Warteschlange. (e) Kein Auto-Weiter: Kachel wählt (Haken, `aria-checked`), „Weiter“ fest unten 56 px. (f) Kamera verweigert: Karte „Kamera ist nicht freigegeben. iPhone-Einstellungen › Safari › Kamera.“ + Knopf „Foto aus Mediathek“ (`<input accept="image/*">` ohne `capture`). (g) Startprüfung `display-mode: standalone`; sonst Band `info-soft` „Für Arbeiten ohne Netz: Technik zum Home-Bildschirm hinzufügen“ + Anleitung (3 Schritte); Abmelden/Neuladen mit wartender Warteschlange bleibt gesperrt. (h) Druck = `background-color` `surface-3`, 50 ms (`--bo-dur-ack`). | E2E Technik: jede Bestätigungsart erzeugt den App-Wert; Pause 30 → `zeit_pause_min=30`; Fehltipp „Starten“ + Rückgängig → kein `starten`-Aufruf; Abschluss-Klickzahl ≤ 7 (N17); nicht installiert → Band sichtbar. |
| N14 | **Kontrast unter 3:1 bei bedeutungstragenden Grafiken.** Fristband: Segmente in `*-soft` (gegen `surface` nahe 1:1) mit Grenzen 1 px `line-strong` (03 §1.3: 2,0:1, „dekorativ“); erlaubte Kanban-Ziele „gestrichelt 1 px `line-strong`“; Fehlerbereich-Punkt mit `line-strong`-Ring. Zusätzlich verzerrt die Animation `scaleX()` je Segment die Punkt- und Schraffurmuster. | WCAG 1.4.11, 03 §1.3, 03 §8.8 | Fristband: Außenrand und Segmentgrenzen 1 px `line-control` (3,84:1), Muster (Punkte, Schraffur) in `ink-soft`, „Heute“ 2 px `ink`; Animation über die Position der Grenzmarken (`translate`) bzw. `clip-path: inset()` je Segment, 200 ms `--bo-ease-inout`, Muster bleiben unverzerrt. Kanban-Drop-Ziel wie 03 §8.8: 2 px gestrichelt `accent` (4,15:1) + `accent-soft`; nicht erlaubte Spalte zeigt während des Ziehens im Spaltenkopf den Text „Kein Übergang“ (`muted`, 12 px) – Rückfeder + Toast bleiben. Bereichspunkt: Ring `line-control`. Dunkles Schema: Tints und Muster aus 03 §1.4 je Segment angeben. | Kontrastmessung (axe + manuell) aller Fristband-Grenzen ≥ 3:1 hell und dunkel; Video-Snapshot der Animation ohne verzerrtes Muster. |
| N15 | **Bewegung außerhalb der Token.** 150 ms (Pill-Wechsel, Wissen einblenden, Leerzustand, Knopftext Technik), 80 ms Druck-Skalierung, 200 ms Banner-Aufklappen (04: Akkordeon 160 ms), Häkchen 400 ms `--bo-ease-out` (04 §3.13: `--bo-ease-inout`), Sheet 240 ms (04 §3.5: 200 ms), Kulanz-Fortschrittslinie 5 s. | 04 §2.1, §6 (Prüfliste), 02 §0.10 | Tabelle §3.5 unten übernehmen; Konzept nennt nur Token-Namen (`--bo-dur-*`, `--bo-ease-*`), keine Millisekunden. Kulanz-Linie entfällt mit N6. | Grep im Bereich nach `\d+ ?ms` in Klassen/Styles = 0 außerhalb der Token-Datei. |
| N16 | **Kürzel-Rest.** `e` = CSV (§2.2) kollidiert mit 02 §9.1 `E` = Bearbeiten und 05 T5 `e` = bearbeiten; `t` = heute (Kalender) ist nicht in 02 §9 registriert, steht aber in §10 Nr. 35 als erlaubt; `Z` (Undo im Toast) wird benutzt, fehlt in Nr. 35; `⌘Enter` heißt in 02 §9.1 „Primäraktion der Seite“, in der Liste „Primäraktion der Zeile“; Kalender hat zwei Pfeil-Modi (Fokus zwischen Karten und freie 30-min-Zellen) ohne Regel, wie man wechselt. | 02 §9, Nielsen 4, WCAG 2.1.1 | `e` nicht für CSV; CSV nur über Knopf und Palette („Servicefälle als CSV“). `t` als Anfrage an 02 §9 (wie `v`, `w/d`), bis dahin Knopf „Heute“ ohne Buchstaben. Nr. 35 um `z` (laut 04 §3.6) ergänzen, solange 02 `⌘Z` nicht entschieden ist (§5). Regel für 02 §9.2: „Hat eine Zeile Fokus, gilt `⌘↵` für die Zeile; sonst für die Seite“ – im `?`-Overlay so beschreiben. Kalender: ein Raster mit Roving-Fokus über 30-min-Zellen **und** Karten (Karte belegt ihre Zellen und bekommt beim Betreten den Fokus); `Enter` auf freier Zelle = A14, auf Karte = öffnen, `m` auf Karte = verschieben; Live-Region nennt Zelle bzw. Karte. | Kürzel-Grep wie §10 Nr. 35 mit korrigierter Liste; Tastatur-E2E Kalender: Zelle → Karte → Zelle ohne Moduswechsel. |
| N17 | **Klickzahlen messen ab falschem Startpunkt.** 02 §0.3: „gemessen ab Zentrale, ohne Suche“. §1.1 misst 7 von 11 Zeilen ab „Akte“ und eine mit ⌘K; Tab/Pfeiltasten sind in der Zählweise nicht geregelt; Technik-Abschluss zählt das Namensfeld und das Weiterschalten der Ergebnis-Kachel nicht. | 02 §0.3, §1 | Spalte „ab“ = Zentrale (Seitenleiste zählt 1); ⌘K-Weg als zweite Spalte. Zählweise ergänzen: Tab und Pfeiltasten zählen nicht, Fokus per Klick in ein Feld zählt 1. Neu gezählte Wege siehe §3.1; Zielwerte über 3 als bewusst begründet markieren (Assistenten). | §10 Nr. 29 misst ab `/zentrale`. |
| N18 | **A14 ohne Behälter und ohne Leerzustand.** Das Wochenraster mehrerer Techniker steht in einem Assistenten, dessen Größe nicht festgelegt ist (Sheet 640 px reicht für 6 Tage × n Techniker nicht); Tagesgrenzen, Takt und Puffer kommen aus Einstellungen (`techniker_tag_von/bis`, `einsatz_takt_min`, `einsatz_puffer_min`), stehen aber nicht im Konzept; ohne Benutzer mit Rolle PH Techniker ist das Raster leer ohne Text. | 02 §7.1, 03 §8.11, Nielsen 9 | A14 als **Vollseite T6** `/service/einsaetze/neu?fall=<name>` (Krümel zurück zum Fall, Esc mit Inline-Frage), Raster volle Breite ab 1024 px; iPad hoch: Liste je Techniker mit freien Fenstern („Do 06.11. 10:00–12:00 frei“), berechnet wie `utils/einsatz.freie_fenster` (Anfrage: whitelisted Endpunkt; bis dahin gleiche Rechnung im Client). Raster-Zeilen von `techniker_tag_von` bis `techniker_tag_bis`, Zellen 30 min (wie `freie_fenster(raster_min=30)`), Puffer `einsatz_puffer_min` als schraffierter Rand vor/nach Einsätzen. `einsatz_takt_min` ist der Abrechnungstakt (Kosten), nicht das Raster – in Technik ③ als „abgerechnet 2 h 15 min (15-min-Takt)“ zeigen. Leer: „Noch kein Techniker. Techniker sind Benutzer mit der Rolle PH Techniker.“ [Rolle vergeben] (Leitung, Link Personal) – Mitarbeiter: „Leitung bitten“. Alle Techniker abwesend: „Diese Woche ist kein Techniker verfügbar.“ [Nächste Woche ›]. | E2E mit leerem Techniker-Seed: Leerzustand mit Aktion; Raster-Grenzen folgen geänderten Einstellungen. |
| N19 | **Regress-Abgleich fehlt.** Die App führt Soll (anerkannt) gegen Ist (Gutschrift/Zahlung) mit Toleranz und `abgleich_status` Offen/Ausgeglichen/Unterdeckung/Überdeckung/Ausgebucht; Methoden `gutschrift_erfassen(betrag_cent, nummer, datum, beleg, eingangsrechnung)` und `differenz_ausbuchen(grund)`. Das Konzept kennt nur „Regress verrechnet“. | Nielsen 1, 02 §6.2 (geldwirksam) | Regress-Akte, Status Anerkannt: Primär **„Gutschrift erfassen“** (Dialog md: Betrag vorbelegt mit anerkannt, Nummer, Datum, Beleg-Upload oder Eingangsrechnung-Link; Satz „Erwartet 420,00 € · Toleranz 1,00 €“). Danach Kennzeichen Abgleich: Ausgeglichen `gruen`, Unterdeckung `orange` + Banner „Es fehlen 20,00 € gegenüber anerkannt“ [Differenz ausbuchen] (Leitung, Dialog rot, Grund Pflicht, kein Undo), Überdeckung `orange` „12,00 € mehr erhalten – prüfen“, Ausgebucht `grau`. Liste: optionale Spalte „Abgleich“, Reiter „Unterdeckung“. „Regress verrechnet“-Dialog nur noch, wenn die App ihn als eigenen Schritt verlangt (Workflow prüfen). Buchhaltung extern sieht Abgleich und Differenz lesend. | E2E: anerkannt 420 €, Gutschrift 400 € → Unterdeckung + Banner; Ausbuchen ohne Grund nicht möglich; Status-Ton-Test für 5 Abgleichswerte. |

---

## 2.1 Korrigierte Wireframes (zu N6, N9, N13)

**Akte-Kopf (N9, N5) – Status Entschieden, Kulanz angefordert, Mitarbeiter-Sicht:**

```
┌ Zentrale › Service › Servicefälle › PH-SRV-2026-00031                                                     ┐
│ PH-SRV-2026-00031 · Mangel: Fam. Huber – Sofa Modell X   ● Entschieden · wartet auf Freigabe  ☆   [⋯]     │
│ Gemeldet ─● Geprüft ─● Entschieden ─◉ In Bearbeitung ─○ Erledigt ─○ Geschlossen                         │
│  02.11.     03.11.     04.11.                                                                          │
│ Lösung bis 18.11. · im Plan                                                                            │
├ (clock) Kulanz 620,00 € wartet auf Freigabe der Leitung (angefragt 09:12) · Erneut anfragen             ┤
├ Übersicht | Mangel & Fristen | Bearbeitung 1 | Regress & Abschluss | Verlauf 9                           ┤
```
Kein Primärknopf, weil der nächste Schritt bei der Leitung liegt; der Blocker steht als einziges Banner. Nach Freigabe: Banner weg, Primär „Einsatz planen“ (Regel N2).

**Glocken-Eintrag Kulanz (N6), Leitung, aufgeklappt:**

```
┌ Kulanz-Freigabe                                              vor 12 Min. ┐
│ 620,00 €                                     PH-SRV-2026-00031 · Huber  │
│ Entscheidung Verbesserung + Kulanz · angefragt von Anna                  │
│ „Naht nach 14 Monaten, Vermutungsfrist abgelaufen, Stammkunde …“ mehr    │
│ Kommentar (optional) [                                              ]    │
│ [Ablehnen…]                         [Akte]   [620,00 € freigeben]        │
└──────────────────────────────────────────────────────────────────────────┘
```
„Ablehnen…“ ersetzt die Fußzeile durch „Grund* [   ] [Abbrechen] [Ablehnen]“ (Danger-Knopf, Fokus auf Abbrechen). Ohne Timer. Esc klappt zu.

**Technik Schirm ④ Bestätigung (N13), 390 px hoch:**

```
┌ ‹ Zurück        Abschließen · 4 von 4 ┐
│ Bestätigung durch den Kunden           │
│ [Unterschrift][Name bestätigt]         │  Segment 48 px, 2 × 2
│ [Kunde abwesend][Verweigert]           │
│ ┌────────────────────────────────────┐ │
│ │                                    │ │  Canvas 358 × 180, Rand line-control
│ │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │ │
│ └────────────────────────────────────┘ │
│ Name  [Fam. Huber                    ] │
│ Zufriedenheit ☆☆☆☆☆ (optional)         │
│ [ ] Servicebericht an Kunden senden    │  nur mit E-Mail
│ ┌────────────────────────────────────┐ │
│ │               FERTIG               │ │  56 px, einziger Primär
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```
„Kunde abwesend“/„Verweigert“ blenden das Canvas aus (Höhe animiert 160 ms `grid-template-rows`), „Verweigert“ zeigt Pflichtfeld „Hinweis“.

**S1-Schnell, Mitte des Sheets (N11, N1):**

```
│ Art      [Mangel] [Transportschaden] [Montagefehler] [Weitere ▾]           │
│ Fehler*  [⌕ naht                                                        ]  │
│          POLSTER  ● POL-01 Nahtriss                                        │
│                     POL-03 Sitzspiegel / Faltenbildung                     │
│                     POL-99 Sonstiges (Polster)                             │
│          Standardlösung: Nachnähen durch Polsterei …                       │
│ Kanal    [Telefon ▾]   Kunde gilt als kontaktiert (Telefonat jetzt)         │
```

---

## 3. Weitere Schwächen (Empfehlungen, keine Blocker)

### 3.1 Klickzahlen neu gezählt (02 §1: ab Zentrale, ohne Suche; Klick/Tipp/Enter = 1; Tippen, Tab, Pfeile = 0)

| Aufgabe | Konzept | nachgezählt ab Zentrale | Weg | Bemerkung |
|---|---|---|---|---|
| Reklamation am Telefon (S1-Schnell) | 6 | 5 (mit N11) | `+` → „Servicefall“ → Kontakt + Enter → Fehler + Enter → `⌘↵` | heute 6–7 (Bereich + Code; Klick in Beschreibung +1) |
| Eingangsbestätigung senden | 1 ab Akte | 2 | Service → Zeilenknopf in „Jetzt dran“ | mit N10 ohne Seitenwechsel |
| Prüfen und entscheiden | 5 ab Akte | 6 | Service → Zeilenknopf → Ja → Entscheidungs-Kachel → Textbaustein → „Entscheiden und in Bearbeitung nehmen“ | über 3 begründet (Assistent) |
| Einsatz planen (A14) | 5 ab Akte | 6 | Service → Zeilenknopf → Zelle → Weiter → Weiter ohne Änderungen → Anlegen | Art muss vorbelegt sein (`einsatz_anlegen` Standard „Reparatur“ – im Konzept nennen) |
| Ersatzteile bestellen | 4 ab Akte (über Tab) | 5 | Service → Zeilenknopf „Ersatzteile bestellen“ → Weiter → Senden | §1.1 und §3.4 nennen verschiedene Wege – Primär-Weg nehmen |
| Fall ablehnen (Leitung) | 4 ab Akte | 5–6 | Service → Servicefälle → Zeile → `s` → Ablehnen → Grund → Ablehnen | mit `ablehnen(kunde_informieren=1)` Schalter „Kunde per E-Mail informieren“ im Dialog – entfällt der Folgeschritt „Ablehnung mitteilen“ (heute +3) |
| Kulanz freigeben | 3 | 3 | Glocke → Freigeben… → „620,00 € freigeben“ | mit N6 |
| „Was ist mit meiner Reklamation?“ | 2 (⌘K) | 4 ohne Suche | Service → Servicefälle → Suchfeld + Enter → Zeile | ⌘K = 2 als zweiter Weg |
| Technik: Einsatz abschließen | 6 | 7 | Abschließen → Kachel → Weiter → Weiter → Textbaustein → Weiter → Fertig | Namensfeld vorbelegt (sonst +1); ohne Auto-Weiter (N13) |

### 3.2 Komplexität
- **Übersicht-Tab:** liefert nach N9 (keine Nächster-Schritt-Karte) nur noch Fristen kompakt, Mangel, Kosten, Erstreaktion. Prüfen, ob „Übersicht“ und „Mangel & Fristen“ zu einem Tab „Fall“ zusammengehen (4 Tabs; Stripe-/Linear-Muster: eine Seite, Abschnitte). Entscheidung nach Klicktest mit 2 Mitarbeitern.
- **Bereichsstart für Mitarbeiter ohne Charts:** 5 Charts unter „Jetzt dran“ sind Leitungsinformation; für Mitarbeiter Link „Berichte →“. Seite bleibt bei Heute-Leiste · Kennzahlen · Jetzt dran · Einsätze heute · Gewährleistung ≤ 14 Tage.
- **Kanban Servicefälle mit 6 Spalten** (300 px je Spalte, 03 §8.8) braucht an 1440 px horizontales Scrollen. Spalte „Erledigt“ standardmäßig eingeklappt (48 px, 03 §8.8); mit N9 „Einsatz geplant“ als Kartenkennzeichen statt Spalte erwägen (Workflow-Drag dorthin startet ohnehin A14).
- **Kanban-Mehrfachauswahl** (02 §5 „Ziehen bewegt alle“) mit Workflow-Bedingungen je Karte: im Service deaktivieren; Masse nur über Liste mit Vorschau „3 von 5 möglich“.
- **Esc im S1-Schnell:** Entwurf liegt ohnehin in IndexedDB – Esc schließt ohne Rückfrage, Band „Entwurf von 09:12 wiederherstellen?“ beim nächsten Öffnen genügt (eine Frage weniger, Linear-Muster).
- **Kopf-Kennzeichen:** Status + 1 rotes Signal + max. 2 neutrale Kennzeichen, weitere als „+2“ (03 §8.9 Grenze für Zellen sinngemäß).
- **Kalender:** Technikerzeilen mit eigener Zeitachse je Zeile werden bei 3 Technikern × 9 h hoch; Ressourcen-Zeitleiste horizontal (Tage × Stunden in einer Zeile je Techniker) prüfen.
- **Kontakt aus Anrufernummer:** Suche akzeptiert Telefonnummer in jeder Schreibweise (`+43 664…`, `0664…`) – im Feldverhalten nennen.

### 3.3 Tastatur und Fokus
- **Fokus nach Statuswechsel:** Nach S2/S5/A14 springt der Fokus auf den neuen Primärknopf (oder bei keinem Primär auf die Statuszeile), Live-Region nennt den neuen Status („Fall ist in Bearbeitung“).
- **Fehlerkatalog-Baum:** `role="tree"`, `→` aufklappen, `←` zuklappen/zum Elternknoten, `Enter` öffnet Code-Sheet, Typ-Sprung über Buchstaben – im Konzept fehlt das Tastaturmodell.
- **Befehlspalette-Kontext:** In der Akte listet ⌘K oben die Aktionen dieses Falls („Erledigt melden“, „Einsatz planen“, „Kunde informieren“) – Linear-Muster, ersetzt Einzelbuchstaben.
- **Akte-Tabs:** `Alt+1…5` (02 §9.4) vs. `1–9` (05 T5) – bis zur Entscheidung keine eigene Belegung festschreiben (§5).
- **Phasenleiste:** Punkte als `<button>` brauchen sichtbaren Fokus innerhalb der 6-px/8-px-Punkte: Fokusring um eine 24 × 24-px-Trefferfläche (2.5.8).

### 3.4 Fehlende Leer- und Fehlerzustände
- Kontakt-Suche ohne Treffer: „Kein Kontakt zu ‚Hubr‘.“ [+ Als neuen Kontakt anlegen] (Name vorbelegt).
- Bezugsvorschläge ohne Belege: „Keine Belege zu Fam. Huber – ohne Bezug weiter.“ (Radio „ohne Bezug“ vorgewählt).
- S2 bei Fehlercode ohne `standardloesung`/`kundentext`: Textbaustein-Knöpfe ausblenden, nicht deaktiviert zeigen.
- Ersatzteilbestellung Entwurf ohne Position: „Noch keine Position.“ [Ersatzteil hinzufügen].
- Technik „Ich“ mit leerer Warteschlange: „Alles übertragen · 07:42“ (Häkchen Sand).
- Side-Peek auf gelöschten/umbenannten Fall: `not_found`-Text aus 02 §7.2 im Peek, Zeile wird aus der Liste entfernt.
- Verzögerter Commit trifft Konflikt (Kollegin hat in den 8 s geändert): Toast `fehler` „Nicht geschlossen – Anna hat den Fall um 14:02 geändert · Anzeigen“.
- Ø Durchlaufzeit bei sehr wenigen Fällen: Kennzahl nennt die Basis („9 Tage · aus 2 Fällen“), damit ein Einzelfall nicht als Trend gelesen wird.

### 3.5 Bewegung – Zuordnung zu den Token (zu N15)

| Stelle (Konzept) | heute | richtig |
|---|---|---|
| Pill-Wechsel §2.0 | 150 ms | Unterstrich ohne Gleiten, Farbe `--bo-dur-fast` (04 §3.14) |
| Wissen unter Fehlercode §2.3.1 | 150 ms | `--bo-dur-fast` Opacity |
| Leerzustand §2.14 | 150 ms | `--bo-dur-base` Opacity nach Skeleton-Ende (03 §8.18 nennt 240 ms → §5) |
| Technik Knopftext §7 | 150 ms | Crossfade `--bo-dur-fast` (04 §3.14 Badge-Wechsel) |
| Technik Druck §7 | 80 ms `scale(0.98)` | `background-color`, `--bo-dur-ack` (04 §4) |
| Banner „+ n weitere“ §3.1 | 200 ms | `grid-template-rows` `--bo-dur-base` `--bo-ease-inout` (04 §3.14 Akkordeon) |
| Sheet S1/S2 | 240 ms | 04 §3.5: 200 ms `--bo-ease-out` – Widerspruch 03/04 (§5) |
| Häkchen Technik | 400 ms `--bo-ease-out` | `--bo-dur-draw` `--bo-ease-inout` (04 §3.13) |
| Kulanz-Linie §4.5 | 5 s linear | entfällt (N6) |

### 3.6 Barrierefreiheit (WCAG 2.2)
- **`title` als einzige Quelle** (Phasennamen kompakt, Gemeldet absolut, Kennzahl „Noch keine Werte“): `title` erreicht weder Tastatur noch Touch. Tooltip-Komponente 03 §8.11 mit Fokus-Auslösung oder sichtbarer Text; „–“ der Kennzahl bekommt `aria-label="Noch keine Werte"`.
- **Undo-Fenster** (8 s, Mails 10 s): Pause bei Fokus im Toast ist da; ergänzen: Screenreader-Ansage enthält das Kürzel („Rückgängig mit Z“) und `F8` springt in den Toast (03 §8.12).
- **Reduzierte Bewegung:** Countdown-Text statt Balken (04 §3.6) auch für die 10-s-Mail-Toasts und das 30-s-Sperrband der Technik.
- **Kachel-`radiogroup` S2 Entscheidung:** Rechtlicher Hinweis § 12 VGG mit `aria-describedby` an der Kachel, Pflicht-Haken als echtes `checkbox` mit Fehlertext, nicht nur rote Umrandung.
- **Canvas Unterschrift:** zusätzlich `role="img"` mit `aria-label="Unterschrift erfasst"` nach dem Zeichnen; Knopf „Löschen und neu“ ≥ 48 px.
- **Avatar-Spalte:** Initialen allein sind keine Namen – in der Liste bei Fokus Name per Live-Region oder Spalte „Verantwortlich“ in Dichte normal als „A. Berger“.

### 3.7 Mobile / iPad
- **Akte am iPad hoch (820 px):** Kopf bricht mit Status, Kennzeichen, Stern, `⋯` und Primär in zwei Zeilen – festlegen: Zeile 1 Nummer + Titel (Ellipsis), Zeile 2 Status + Kennzeichen links, Primär + `⋯` rechts.
- **Servicefälle < 768 px:** Karten-Liste nach 03 §8.7 (Titel, Status, Nächster Schritt, Fälligkeit) – im Konzept nicht genannt.
- **Technik im Freien/Keller:** Hell-/Dunkel-Schema folgt dem System, Schalter in „Ich“ (02 §11.3 erlaubt dunkles Schema); Statusschrift 18 px bleibt.
- **Leitung am Telefon** (02 §11.1 nur Lese-Ansicht): Glocken-Freigabe (N6) muss bei 390 px funktionieren – Eintrag als Vollbild-Sheet von unten.

### 3.8 Visuell / Modernität
- **Leerzustand:** §2.14 schreibt Icon 24 px vor, 02 §7.1 32 px, 03 §8.18 40 px im 72-px-Kreis. Service verweist nur auf die Komponente `Leer` (03 §8.18) und gibt Texte an, keine Maße.
- **Spalte „Fristen“ „612 Tage“** ist ohne Richtung mehrdeutig: „noch 612 Tage“ / „seit 3 Tagen abgelaufen“; für Erledigt/Geschlossen leer.
- **Nummernspalte** (`PH-SRV-2026-00031`, mono) braucht die meiste Breite für die geringste Information; Spalte schmal mit Ellipsis vorne („…00031“) und vollem `name` in `title`/Peek prüfen – §10 Nr. 44 dann für Text/Suche beibehalten.
- **Seitengröße:** Liste 25 je Seite (§2.2) vs. 03 §8.7 Standard 50 – angleichen.
- **Wireframes** nutzen weiter `☆`, `⌕`, `✓`, `▲` – im Spec lucide-Namen (`star`, `search`, `check`, `arrow-up`), wie in Runde 1 für die übrigen Zeichen umgesetzt.

### 3.9 Microcopy
- „Erstreaktion“ ist SLA-Sprache; für das Team: „Kunde kontaktiert“ (Schalter, Dialogtitel „Telefonat erfassen“), „Erstreaktion“ nur in Berichten.
- Ein Verb je Schritt: „Prüfen & entscheiden“ (Knopf) vs. „Entscheidung treffen“ (Regel) – Knopf = Regeltext (N2).
- „Regress“, „Vermutungsfrist“, „Beweislast“: je ein Satz im `?`-Artikel (§13) mit Beispiel; im Fristband als Tooltip-Erklärung am Begriff.
- „Lieferantenrelevant“ → „Lieferant haftet“ prüfen (kürzer, sagt die Folge).
- Toast „Fall ist in Bearbeitung“ statt „Entschieden: Verbesserung · Fall ist in Bearbeitung“ – die Entscheidung steht in der Akte.

### 3.10 Unklar oder widersprüchlich im Dokument selbst
- §2.0 Regress Mindestrecht „Service *“ vs. 05 §3.9 „Service Leitung“; 05 §3.9 nennt noch 7 Tabs und die alten Routen.
- Kosten: Übersicht „Kosten (Leitung)“, Tab Bearbeitung „permlevel 1; Techniker sieht den Tab ohne Beträge“ – sieht der Mitarbeiter Kosten? Eine Zeile je Rolle in §9 ergänzen; Techniker: Abschnitt Kosten ausblenden statt „ohne Beträge“.
- §4.2 „Abbrechen nur Leitung“ vs. App (Schreibrecht) – N8.
- §1.2 „Freigeben“ öffnet die Akte (Knopftext verspricht eine Handlung, die nicht passiert) – mit N1/N6 erledigt.
- §2.3.1 „Fristen: ● Vermutungsfrist läuft · … · Beweislast Platzhirsch“ – erscheint bevor ein Bezug gewählt ist? Ohne Datum: „Fristen erscheinen mit Bezug oder Übergabedatum“.
- §4.4 S3 „Auswahl einzelner Zeilen fehlt“ – überholt (N12).
- §4.1 Ablehnen „Vorlage Ablehnung fehlt, Betreff ‚Abschluss‘“ – überholt; Dialog mit Schalter „Kunde per E-Mail informieren“ + Vorschau.
- §10 Nr. 25 Seed „Fehlerkatalog mit 3 Bereichen“ – mit Seed aus `install.py` (12 Bereiche) testen, zusätzlich leerer Katalog.

---

## 4. Was gut ist und so bleiben soll
- Bestätigungsregel in fünf Klassen (§4.1) – das Muster sollte 02 §6 übernehmen.
- Teilfehler-Ergebniskarte mit Einzel-„Erneut“ und Kopf-Hinweis bis zur Erledigung (§4.4).
- S1-Schnell leert sich nach „Anlegen“ für den nächsten Anruf, Fokus Kontakt (§2.3.1).
- Kanban-Drop öffnet das fehlende Sheet; verbotene Ziele mit Rückfeder + Text (§2.2).
- Technik: ein Primärknopf je Status, „Nicht angetroffen“ getrennt, Unterschrift ohne Ausrichtungszwang, Fotos ≤ 600 KB mit EXIF-Zeit, Cache heute + morgen inkl. Fehlercode-Wissen (§7).
- Leerzustände als Tabelle mit Abnahmebezug (§2.14), Hilfe je Route (§13).
- Ein rotes Signal je Zeile mit fester Rangfolge (§2.2) – mit N5 um SLA ergänzt.
- Widerruf der Nachkauf-Einwilligung als Dialog ohne Undo mit Satz zu den weiterlaufenden Terminerinnerungen (§2.9).
- Ehrliche Markierung von Lücken und Übergängen – das hat den Abgleich in N1 überhaupt möglich gemacht.

---

## 5. Widersprüche in den Leitlinien, die Service erbt (an Fundament/UX-Lead)

| Thema | 01 | 02 | 03 | 04 | 05 | Service nutzt | Vorschlag |
|---|---|---|---|---|---|---|---|
| Undo-Mechanik | – | sofort + Gegenaktion (§6.1) | – | Variante A verzögert, B sofort (§3.6) | – | beides | A als Standard bei Status ohne Gegenmethode und bei Mails; B nur mit echter Gegenmethode |
| Undo-Dauer | 6 s | 8 s | 8 s | 5 s (Kiosk 5 s) | – | 8 s, Mails 10 s, Technik 5 s (N13) | 8 s Backoffice, 5 s Kiosk, 10 s Mails |
| Undo-Taste | – | ⌘Z | – | `Z` | – | `Z` | `Z` im Toast-Kontext **und** ⌘Z global |
| Aktionen je Toast | – | – | eine (§8.12) | – | – | bis zwei | eine; Zweitaktion über Link im Text oder Zielobjekt |
| Toast-Position | unten links | unten Mitte | unten rechts | unten rechts | unten rechts | nicht genannt | unten rechts (Kiosk oben Mitte) |
| Sheet-Öffnen | 200 ms | – | 240 ms | 200 ms | 200 ms (Druck) | 240 ms | 200 ms `--bo-ease-out` |
| Leerzustand Icon | – | 32 px | 40 px in 72-px-Kreis | – | – | 24 px | 03 §8.18 |
| Phasenleiste Form | – | Punkte (§3.1) | Segmente 8 px (§8.20) | – | – | Punkte | Punkte für Vorgänge mit Status, Segmente nur für Fortschritt ohne Status |
| Phasenpunkt-Klick | – | öffnet Objekt | „springt zur Phase“ | – | – | filtert Zeitleiste | Popover mit Datum/Person + Sprung (N9) |
| Kanban nicht erlaubt | – | – | halbtransparent + Tooltip (§8.8) | Rückfeder + Toast (§3.4) | – | Rückfeder + Toast + Kopftext | 03 §8.8 auf 04 §3.4 + Kopftext umstellen |
| `E`/`e` | – | Bearbeiten (§9.1) | – | – | `e` bearbeiten (T5) | CSV | Bearbeiten; CSV ohne Buchstaben |
| Ziffern | – | `1–9` Status-Chips (§9.2), Alt+1…9 Tabs | – | – | `1–9` Tabs (T5) | `1–6` Reiter, Alt+1…5 Tabs | Liste: Ziffern = Reiter; Akte: Alt+Ziffer |
| `G` + Bereich | – | `G S` Service | – | – | `g v` Service, `g s` Shop | offen | 05 übernehmen (Shop braucht `s`) |
| Leertaste in Listen | Peek | auswählen | auswählen | – | – | offen | Leertaste Peek, `x` auswählen |
| Unterschrift Querformat | – | erzwingen (§11.3 Montage) | Canvas 100 % × 200 | – | – | nie erzwingen, 180 px hoch | 02 §11.3 ändern; Canvas-Mindesthöhe 160 px |
| Idle-Sperre Kiosk | – | 15 min | – | 15 min | 15 min | Technik 60 min, keine bei laufendem Einsatz | Kassa/Packtisch 15, Montage/Technik 60 |
| Kennzahlen je Start | – | max. 6 | max. 8 | – | – | max. 6 je Rolle | 6 |
| Side-Peek-Breite | 420 px | – | 480 px | 480 px | – | 480 px | 480 px |
| Seitengröße Liste | – | – | 50 | – | – | 25 | 50 |
| Regress-Zugang | – | – | – | – | Service Leitung | Service * | Mitarbeiter schreiben (Workflow erlaubt es), 05 anpassen |

---

## 6. Abnahme-Ergänzungen für §10 (Runde 2)

46. **Code-Abgleich (N1):** Jede Methode in §4/§9 existiert im Code mit der genannten Signatur oder steht in §12; Grep `[erstreaktion]` = 0; Telefonfall ohne E-Mail: nach 3 Werktagen (Mock-Uhr) kein offenes Reaktions-ToDo, an zwei Folgetagen keines neu.
47. **Eine Regel (N2):** `schritte.faelle.json` mit ≥ 18 Fällen; Python- und JS-Ergebnis identisch; Liste nach `rang` sortiert.
48. **Abschluss mitgeteilt (N3):** Eingangsbestätigung allein schaltet „Schließen“ für Mitarbeiter nicht frei; lieferantenrelevanter Fall ohne Regress ist weder per S5 noch per Masse schließbar.
49. **Eine Zahl (N4):** „Reaktion überfällig“ identisch in Reiter, Heute-Leiste, Kennzahl, GF-Zentrale; `/service/faelle` ≤ 3 Frappe-Aufrufe.
50. **SLA (N5):** `sla_status` Gefährdet/Verletzt erzeugt Text + Ton laut N5; Rot-Rangfolge mit SLA parametrisiert getestet.
51. **Kulanz (N6):** Freigabe und Ablehnung aus der Glocke ohne Seitenwechsel; Aufruf trägt `betrag_cent`; Akte zeigt Zustand „abgelehnt“ mit „Entscheidung ändern“; keine PH Aufgabe zusätzlich zur App-Benachrichtigung.
52. **Mails (N7):** Vorschau pausiert; ein Aktionsknopf je Toast; Fehler nach Commit in Glocke + Kopf + Zeitleiste; Adresse unmaskiert im Backoffice.
53. **Umplanen (N8):** verzögerter `umplanen`-Aufruf, Status danach Geplant, Primär „Terminvorschlag senden“; laufende Einsätze nicht ziehbar; „Einsatz absagen“ für Mitarbeiter mit Grund.
54. **Kopf (N9):** Statustext „Entschieden“; 6 Phasen; ein Regeltext im Kopf; Fall mit Projekt ohne zweite Leiste.
55. **Bereichsstart (N10):** genau ein `variant=primary`; Zeilenaktion ohne Seitenwechsel, Fokus auf nächste Zeile.
56. **S1 (N11):** Fehler-Combobox findet Code über Wort; Sheet ohne Scroll bei 1366 × 768; Klickzahl 5.
57. **Ersatzteile (N12):** Dialog „Ersatzteil hinzufügen“ mit beiden Quellen; S3 bestellt nur die gewählten Zeilen.
58. **Technik (N13):** 4 Bestätigungsarten, Pause, Bericht senden; Fehltipp-Undo 5 s; kein Auto-Weiter; Kamera verweigert → Mediathek; Band bei nicht installierter Web-App.
59. **Kontrast (N14):** Fristband-Grenzen und Drop-Ziele ≥ 3:1 hell/dunkel; Muster unverzerrt während der Animation.
60. **Motion (N15):** keine Millisekunden-Werte außerhalb der Token im Bereichscode.
61. **Kürzel (N16):** keine Einzelbuchstaben außer `n / j k a s c m x z` und registrierten Anfragen; Kalender mit einem Fokusmodell.
62. **A14 (N18):** Vollseite; Raster folgt Einstellungen; Leerzustand ohne Techniker.
63. **Regress-Abgleich (N19):** Gutschrift erfassen → Abgleichswert sichtbar; Unterdeckung ausbuchen nur Leitung mit Grund.

*Ende 20 – Kritik UX Service, Runde 2.*
