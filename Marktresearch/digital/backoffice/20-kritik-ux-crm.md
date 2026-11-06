# 20 – UX-/UI-Kritik Bereich „CRM“ (zu `10-konzept-crm.md`)

**Zweck:** Strenge Prüfung des CRM-Konzepts (Anfragen, Kontakte/Kundenakte, Termine, Gesprächsprotokolle, Aufgaben, Vertriebscockpit) gegen Nielsen-Heuristiken, WCAG 2.2 AA, Mobile-/iPad-Regeln und die Leitlinien 01–05. Ergebnis: Note, Pflichtänderungen vor Umsetzung, Empfehlungen, Widersprüche in den Leitlinien, die CRM erbt, Abnahme-Ergänzungen.
**Stand:** 2026-11-04 · Rolle: UX-/UI-Kritiker · Geprüft: `10-konzept-crm.md` (774 Zeilen, vollständig), `01-benchmark-prinzipien.md` (§0, A3), `02-ux-leitlinien.md` (§0, §2, §4–§11, §13–§16), `03-design-system.md` (§1.5, §1.6, §4, §8.7–§8.19), `04-motion.md` (§1, §2, §3.6–§3.8), `05-informationsarchitektur.md` (§0, §3.3, §5.1, §7.4, Seitenleiste-Akkorde), zum Abgleich `20-kritik-ux-service.md` und `20-kritik-ux-shop.md` (gleiche Lösungen für gleiche Probleme).
**Status:** Prüfbericht, keine Entscheidung des Inhabers. Alle Zahlen in Wireframes sind Beispielwerte aus dem Konzept, keine Messwerte.

---

## 0. Urteil

**Note: 6 / 10.**

**Stark:** Datenmapping mit ehrlich markierten Lücken (§9, §12); Primäraktion je Status in jeder Akte (§2.4, §2.9, §2.10); Kalender mit Slot-Prüfung beim Drag und Tastatur-Alternative `m` (§2.7); Schnell-Triage A-CRM1 mit Zähler und Endzustand (§4.6); Doppelgänger-Hinweis beim Verlassen des E-Mail-Felds (§2.3); Datenschutz in der Oberfläche statt im Handbuch (Widerspruch sperrt Marketing, Token genau einmal sichtbar, §4.3); Kennzahl ohne Daten zeigt „–“ (§2.1); Fehler je Kachel/Tab isoliert (§2.1, §3.4); Akzeptanzkriterien messbar (§10).

**Schwach:**
1. **Zu viele Begriffe und doppelte Zustände für ein Team ohne IT-Hintergrund:** fünf Objekte mit zusammen 25 Statuswerten; „Angebot“ und „Termin vereinbart“ existieren sowohl an der Anfrage als auch an Termin/Gespräch und laufen auseinander (Termin storniert → Anfrage bleibt „Termin vereinbart“); drei Nachfass-Mechanismen (Wiedervorlage, Aufgabe, „Nächster Schritt“ im Gespräch), von denen einer (Wiedervorlage) heute **gar nichts auslöst** (§8.2 R1 selbst: „wird von keinem Task gelesen“).
2. **Bereichsstart und Kundenakte sind überladen:** `/crm` zeigt Heute-Leiste + 8–10 Kennzahlen + Mein Tag + Posteingang + Trichter + 6 Charts; dieselbe Zahl („Anfragen neu“) steht dreimal auf dem Bildschirm. Kundenakte hat **12 Tabs** (03 §8.10 erlaubt 6), Kopf mit bis zu 5 Zeilen inkl. zwei Bändern.
3. **Klickzahlen in §1.2 stimmen in 11 von 17 Zeilen nicht** mit den beschriebenen Wegen (Nachzählung §2.1); T5 und T8 nutzen ⌘K, obwohl §1 „ohne Suche“ misst.
4. **Tastenkürzel kollidieren** mit 02 §9 und untereinander (`c`, `e`, `p`, `m`, `t`, Leertaste, Shift+Klick, `Alt+←/→` = Browser-Zurück unter Windows, `g p` = globaler Akkord Projekte).
5. **Undo nicht durchgängig:** Termin „Erledigt“ und „Nicht erschienen“ sind ohne Rückweg, aber per Kanban-Drag ohne Rückfrage auslösbar; „Qualifizieren“ ist nach 5 s endgültig, weil der Rückübergang fehlt; Einstellungen wirken „sofort für die Website“ ohne Vorschau und ohne Rücknahme.
6. **Touch-Lücke am Hauptgerät iPad:** die Zeilenaktion „Qualifizieren“ erscheint nur bei Hover/Fokus (zweite Zeile, §2.2) – am iPad nicht erreichbar; Kalender-Drag und Langdruck kollidieren mit Scrollen; Wischrichtungen widersprechen 02 §11.2.
7. **Status-Töne weichen in 10 Werten von 03 §1.5 ab**, Token-Namen falsch (`accent` = Sand statt `progress` = Türkis); dasselbe Wort „Angebot“ ist an der Anfrage orange und am Gespräch lila.
8. **Leerzustände fehlen an 23 Stellen**, Fehlerzustände für Autosave (ausgerechnet das iPad-Protokoll), Teilfehler beim Zusammenführen und Mailversand nach Ablauf des Undo-Fensters fehlen ganz; Erstbesuchs-Hinweis und Hilfe-Artikel (02 §8, §16) fehlen im ganzen Bereich.
9. **Kundenansicht am iPad fehlt:** das Protokoll wird vor dem Kunden geschrieben, aber Toasts/Glocke mit Namen anderer Kunden, interne Kommentare und Status bleiben sichtbar.

Gegenüber Service (6,5) etwas schwächer, weil das CRM das Einstiegsmodul für alle Mitarbeiter ist: wer hier die Begriffe und Kürzel lernt, überträgt sie auf elf weitere Bereiche (02 §0.1). Fehler hier werden zu Fehlern überall.

---

## 1. Pflichtänderungen (vor Umsetzung, nach Wirkung sortiert)

| Nr. | Befund | Verstoß gegen | Änderung (konkret) |
|---|---|---|---|
| P1 | **Doppelte Zustände laufen auseinander.** Anfrage-Status „Termin vereinbart“ wird von `termin_vorschlagen` gesetzt; wird der Termin storniert, abgelehnt oder „Nicht erschienen“, bleibt die Anfrage „Termin vereinbart“ (kein Hook, kein UI-Verhalten beschrieben). Ebenso „Angebot“: Anfrage-Status und Gespräch-Status werden nur über A-CRM2 gemeinsam gesetzt; ein Angebot, das direkt in Faktura entsteht, ändert keinen von beiden. Mitarbeiter sehen in Kanban und Kundenakte widersprüchliche Stände. | Nielsen 1 (Sichtbarkeit), Nielsen 4, 05 §0.3 (ein Lebenszyklus) | **Anfrage ist der Vorgang, ihr Status ist abgeleitet, wo ein Folgeobjekt existiert.** UI-Regel (bis ph_crm-Hook existiert, clientseitig in `lib/backoffice/crm/vorgang.js`): Anzeige-Status der Anfrage = höchster erreichter Zustand aus Folgeobjekten (Termin aktiv → „Termin vereinbart“; Termin storniert/abgelehnt/nicht erschienen und kein weiterer aktiver Termin → Kennzeichen **„Termin entfallen“** `warning-text` + Primäraktion „Neuen Termin anlegen“; Angebot vorhanden → „Angebot“). Abweichung gespeichert ↔ abgeleitet → Band in der Anfrage-Akte „Status passt nicht zum Termin – [Angleichen]“ (Leitung: `apply_workflow`, Mitarbeiter: Aufgabe an Leitung). Anfrage an ph_crm §12 **Priorität 1:** `on_update` von PH Termin (Storniert/Abgelehnt/Nicht erschienen) setzt Anfrage zurück auf „Qualifiziert“ + Kommentar; ph_faktura `PH Angebot.after_insert` mit `anfrage`/`kontakt` setzt Anfrage „Angebot“. Gesprächs-Status „Angebot“ entfällt in der UI (siehe P2). |
| P2 | **Drei Nachfass-Mechanismen, einer davon wirkungslos.** Wiedervorlage (Datum + `naechster_schritt`-Text an der Anfrage), PH Aufgabe, „Nächster Schritt + Bis + [Aufgabe →]“ im Gespräch. R1 (Wiedervorlage-Erinnerung) existiert nicht: wer heute eine Wiedervorlage setzt, wird nie erinnert. Zusätzlich heißt das Freitextfeld „Nächster Schritt“ genauso wie der vom System empfohlene „NÄCHSTER SCHRITT ▸ Qualifizieren (q)“ in der rechten Spalte (§2.4). | Nielsen 1, 2 (Sprache), 5 (Fehlervermeidung), 02 §3.2 | **Ein Mechanismus: Aufgabe.** (a) Inline-Feld „Wiedervorlage“ in Liste und Akte bleibt als Bedienelement, legt aber eine PH Aufgabe an bzw. verschiebt sie (`aufgabe_anlegen(titel=naechster_schritt or "Nachfassen", faellig)`, eine offene Wiedervorlage-Aufgabe je Anfrage, Erkennung über `quelle = wiedervorlage` – Anfrage an ph_crm: Wert in `quelle`). Damit greifen sofort `aufgaben_erinnerungen` (07:00) und Heute-Leiste, R1 wird überflüssig. (b) Freitextfeld umbenennen: **„Vereinbart“** (Platzhalter „z. B. Rückruf Do nachmittags“); die System-Empfehlung heißt in der ganzen App **„Empfohlen“** (Kopf-Primärknopf) – der Abschnitt „NÄCHSTER SCHRITT“ in der rechten Spalte entfällt, weil der Primärknopf im Kopf dasselbe sagt (Doppelanzeige). (c) Gespräch: „Nächster Schritt + Bis“ legt beim Verlassen des Felds Bis automatisch die Aufgabe an (R5-Band „Als Aufgabe übernehmen?“ entfällt), Toast „Aufgabe ‚Rendering Küche vorlegen‘ bis 18.11. angelegt · Rückgängig (Z)“ 8 s. |
| P3 | **Bereichsstart `/crm` überladen und redundant.** Heute-Leiste (5 Chips) + 8 Kennzahlen (Leitung 10) + Mein Tag + Posteingang + Trichter + 6 Charts. „Anfragen neu 4“ steht in Heute-Leiste, Karte „Neu ohne Reaktion 4“ und Posteingang-Zähler; „Termine heute 3“ und „Unbestätigt 2“ je zweimal. 02 §2.1 erlaubt max. 6 Kennzahlen, 03 §8.14 max. 8; 05 §7.4 nennt 4 Heute-Chips. | 02 §2.1, 03 §8.14, 05 §7.4, Nielsen 8 | Neuer Aufbau (Wireframe §2.8 W1): **(1) Heute-Zeile** (4 Chips laut 05 §7.4, eine Zeile, Chips = Filterlinks). **(2) „Zu erledigen“** – eine gemeinsame Arbeitsliste statt Posteingang + Karten: Neue Anfragen (älteste zuerst), Termine zu bestätigen, Termine ohne Protokoll, fällige Aufgaben/Wiedervorlagen; jede Zeile mit genau einer Zeilenaktion; max. 8 Zeilen + „Alle 12 →“. **(3) Mein Tag** rechts (Termine heute). **(4) Kennzahlen: 4 je Rolle** (Mitarbeiter: Offene Anfragen · Termine 7 Tage · Offene Aufgaben · Reaktionszeit eigener Median; Leitung/GF: Offene Anfragen · Reaktionszeit Median · No-Show-Quote · Neue Kunden Monat). **(5) Trichter** nur Leitung/GF, eine Zeile. **Charts ziehen nach `/crm/berichte`** (Bericht „Übersicht“), Bereichsstart hat keine Charts. Zeitraum-Chips nur noch dort, wo Trichter steht. |
| P4 | **Kundenakte: 12 Tabs, Kopf bis 5 Zeilen, Zeitleiste in 1/3-Spalte.** Bei 1024–1279 px (iPad quer, Laptop im Showroom) passen weder die Tabs noch Zeitleiste + Composer; 03 §8.10 schiebt ab > 6 Tabs in `⋯` – unbestimmt, welche. Kein Verhalten der rechten Spalte < 1280 px beschrieben. „Neu ▾“ ist kein Primärknopf (02 §0.2). | 03 §8.10, 02 §0.2, 02 §11.1, WCAG 1.4.10 | **6 Tabs:** `Übersicht` · `Aktivität` (Zeitleiste als Hauptinhalt in voller Breite, Composer unten sticky) · `Vorgänge` (Anfragen, Termine inkl. Montage/Service, Gespräche, Aufgaben) · `Projekte & Belege` (Projekte, Belege, Zahlungen, Lieferungen als Unterabschnitte mit Ankern) · `Service` · `Mehr ▾` (Marketing, Dokumente, Datenschutz). Tab „Daten“ entfällt: Stammdaten werden **rechtes Eigenschaften-Panel** (320 px, inline editierbar wie Attio/Linear: Kontaktart, Berater, Kontaktwege, Sprache, Adressen, Kundenkarte, Portal); < 1280 px wird das Panel ein Sheet hinter Knopf „Details“ (`Shift+D`). **Kopf max. 2 Zeilen:** Z1 Avatar 40 · Name (Instrument Sans 20/500) · Status-Badge · Primärknopf; Z2 Kontaktwege (Icon-Knöpfe `mail`/`phone`/`smartphone` 32 px mit Text) · Chips (Kundenkarte, Architekt, „1 ähnlicher Kontakt“ für Leitung). **Ein Band** maximal: Widerspruch (danger) hat Vorrang. **Primärknopf** = erste Empfehlung aus „Offen jetzt“ (z. B. „Zahlung erfassen“), sonst „Termin anlegen“; `Neu ▾` wird Sekundärknopf. Tabs mit Zähler 0 grau sichtbar (wie §3.3), Kürzel `Alt+1…6`. |
| P5 | **Klickzahlen §1.2 falsch** (Messgröße der E2E-Abnahme Q1). 11 von 17 Wegen erreichen den Zielwert nicht (Nachzählung §2.1), T5/T8 messen mit ⌘K trotz „ohne Suche“, T13/T17 starten nicht in der Zentrale. | 02 §0.3, §16, Nielsen 7 | Tabelle nach P3, P6, P7, P8 neu zählen; Zielwerte, die nach Umbau nicht erreichbar sind, ehrlich erhöhen. E2E zählt den beschriebenen Weg, nicht den Wunsch. Suche-Wege als zweite Spalte „mit ⌘K“ getrennt führen. |
| P6 | **A1 „Termin anlegen“ hat 4 Schritte für den häufigsten Fall** (Kunde am Telefon, Anfrage bekannt). Schritt ② ist nur bei „Kalender-Klick mit Vorwahl“ übersprungen, nicht bei Start aus der Anfrage, obwohl `art`, `ort_der_beratung`, `wunschzeiten` dort stehen. Zwei Ausführungswege mit unterschiedlichem Verhalten: aus Anfrage ist der Mail-Haken deaktiviert („Bitte telefonisch bestätigen“), ohne Anfrage aktiv – derselbe Assistent verhält sich je Herkunft anders. `⇧⏎ zurück` kollidiert in ④ mit dem Textfeld „Anliegen“ (Umschalt+Enter = Zeilenumbruch). | 02 §4.3, Nielsen 4, 7, WCAG 3.3.7 | **Ein Bildschirm statt vier** (Dialog lg 800 laut 03 §8.11, nicht 720): oben eine Zeile „Kunde“ (vorbefüllt, Link-Suche) · „Art“ (Segment der 4 häufigsten Terminarten, vorgewählt aus `art`/`ort_der_beratung`, Rest im Select) · „Berater“ (Egal/Namen) – darunter das Slot-Raster, unten Zusammenfassung in einem Satz + ☐ Bestätigungsmail + Primär „Termin anlegen“ (`⌘/Strg+Enter`). Schrittansicht nur, wenn Kunde fehlt oder Vor Ort ohne Telefon/PLZ (Pflichtprüfung inline unter dem Feld). **Ein Ausführungsweg** für beide Herkünfte, bis `termin_vorschlagen` die Parameter hat: `insert PH Termin` + `bestaetigen(mail)` + `set_value` an der Anfrage (`folgedokument`, Status über Workflow „Termin vereinbaren“); Mail-Haken immer gleich. Kürzel: `Enter` nur im Slot-Raster = Slot wählen; Weiter/Zurück nur in der Schrittansicht über Knöpfe und `Alt+1…4` (rückwärts). |
| P7 | **Irreversible Termin-Übergänge ohne Schutz.** Kanban-Drag Bestätigt → Erledigt und → Nicht erschienen ruft sofort die Methode; Rückweg fehlt (§4.2, §12.5). „Erledigt“ ist am Desktop ein Ziehen um 300 px daneben. Gleichzeitig verlangt 02 §6.2 Dialog bei Unumkehrbarem. | 02 §6.2, Nielsen 3, 5, WCAG 3.3.4 (sinngemäß) | (a) Kanban-Spalten „Erledigt“ und „Nicht erschienen“ sind **keine Drop-Ziele**, bis die Rückübergänge existieren; Drop dort → Karte kehrt 200 ms `--bo-ease-out` zurück + Toast „‚Erledigt‘ bitte im Termin setzen – dort wird das Protokoll angelegt.“ (b) In der Akte: „Nicht erschienen“ = Dialog sm „Hr. Keller als nicht erschienen markieren? Nicht rückgängig zu machen.“ Grund optional, Primär „Markieren“, Fokus auf Abbrechen. (c) „Erledigt“ wird nie allein angeboten: Primärknopf **„Protokoll schreiben“** (setzt Erledigt + legt Protokoll an; Erledigt ohne Protokoll nur im `⋯` „Ohne Protokoll abschließen“ mit Dialog). (d) Nach Einbau der Rückübergänge (§12.5) Variante A (verzögerter Commit, 8 s) statt Dialog. |
| P8 | **„Qualifizieren“ ist nach 5 s endgültig** (Rückweg „fehlt in App ph_crm“), Mitarbeiter können Fehlbedienungen nicht korrigieren. Verzögerter Commit (Variante A) ohne Regel für Folgeaktionen: wer qualifiziert und innerhalb 5 s „Termin anlegen“ drückt, erzeugt `termin_vorschlagen` (Neu → Termin vereinbart) und danach den verspäteten Übergang „Qualifizieren“ auf eine Anfrage, die schon „Termin vereinbart“ ist → Workflow-Fehler. | Nielsen 3, 5, 9, 04 §3.6 | (a) Undo-Dauer **8 s** wie 02 §6.1/03 §8.12 (Konzept nennt fälschlich „5 s aus 01–05“). (b) **Warteschlange je Datensatz:** jede Folgeaktion am selben Datensatz (Primärknopf, A1, Zuweisen, Seitenwechsel) ruft vorher `flush()` der ausstehenden Commits auf; Toast wechselt in „ausgeführt“ (Balken weg, Text bleibt 1,5 s). (c) Anfrage an ph_crm §12.5 auf **Priorität 1**: Übergang „Zurück auf Neu“ aus Qualifiziert für Mitarbeiter (nur ohne Folgedokument). Bis dahin in der Akte für Status Qualifiziert ohne Folgedokument: `⋯` „Zurück auf Neu (Leitung)“ für Leitung sichtbar, für Mitarbeiter Eintrag „Leitung bitten“ (legt Aufgabe an). |
| P9 | **Hover-only Zeilenaktion auf dem Hauptgerät iPad.** §2.2: „zweite Zeile nur bei Fokus/Hover“ mit E-Mail/Telefon und [Qualifizieren]; Zeilenhöhe springt (Layout-Sprung), Touch hat kein Hover. Posteingang „Qualifizieren (secondary, wird Primär bei Fokus)“ – Knopfgewicht wechselt beim Durch-Tabben in jeder Zeile. | 02 §11.2, 02 §7.3 (kein Layout-Sprung), 03 §8.7, Nielsen 4 | Einzeilige Zeilen (36/44 px nach 03 §4). Neue Spalte **„Kontakt“** mit zwei Icon-Knöpfen `mail`/`phone` (Sichtgröße 28, Trefffläche 44 per `::before`), `aria-label` „E-Mail an Familie Muster“, deaktiviert mit Tooltip, wenn leer. Zeilenaktion als **eigene Spalte rechts**, immer sichtbar, Ghost-Knopf mit Text („Annehmen“, „Bestätigen“, „Protokoll“) – ändert sein Gewicht nie. Am iPad zusätzlich Wischen (siehe P15). |
| P10 | **Status-Töne und Token weichen von 03 §1.5 ab.** Konzept: Termin Erledigt `info` (03: grün), Nicht erschienen `special` (03: grau), Storniert `neutral` (03: rot), Gespräch Offen `warning` (03: blau), Gespräch Angebot `special`/lila (03: orange; Lila reserviert für Trainingsmodus), Aufgabe In Arbeit `info` (03: orange); Qualifiziert/Termin vereinbart als `accent` (= Sand-Akzent für „aktuell“, nicht Fortschritt). §2.2 nennt für dieselben Werte wieder andere Farben („türkis“). Bestätigt und Erledigt sind nach 03 beide grün und stehen im Termin-Kanban nebeneinander. | 03 §1.5, 03 §0, 02 §13, WCAG 1.4.1 | Eine Tabelle, Token aus 03: **Anfrage** Neu `blau` · Qualifiziert `tuerkis` · Termin vereinbart `tuerkis` + Icon `calendar-check` 12 px · Angebot `orange` · Gewonnen `gruen` · Verloren `grau` · Spam `rot`. **Termin** Unbestätigt `orange` + gestrichelter Rand · Bestätigt `tuerkis` (Abweichung von 03 beantragen, §4: „Bestätigt = Fortschritt, Erledigt = Abschluss“) · Erledigt `gruen` · Nicht erschienen `grau` · Storniert `rot` · Abgelehnt `rot`. **Kontakt** wie Konzept. **Gespräch** Offen `blau` · Planung beauftragt `tuerkis` · Abgeschlossen `gruen` (Wert „Angebot“ nach P1 nur noch abgeleitet als Kennzeichen „Angebot AN-… offen“). **Aufgabe** Offen `blau` · In Arbeit `orange` · Erledigt `gruen` · Verworfen `grau` durchgestrichen. Rollen-Token `info-*` = blau, `progress-*` = türkis; `accent-*` nie für Status. §2.2-Freitext streichen, auf §4.0 verweisen. |
| P11 | **Tastenkürzel kollidieren** (vollständige Liste §2.2). Kritisch: `Alt+←/→` „Seite“ (§2.2) = Browser-Zurück/Vor unter Windows – Mitarbeiter verlassen die Liste; `c` = Aufgabe (02 §9.2: Kommentar); `e` = CSV (Liste) bzw. Erledigt+Protokoll (Termin) vs. 02 §9.1 Bearbeiten; `m` im Kalender = Monat **und** Verschieben-Dialog; `g p` in der Kundenakte = erstes Projekt vs. 05 `g p` = Bereich Projekte; Leertaste = Peek vs. 02/03 = auswählen; Shift+Klick = Peek vs. 03 §8.7 Bereichsauswahl; `p` = drucken vs. 02 `⌘P`; Tabs: `1–6` (Anfrage), `1–9, 0, -` (Kundenakte), `Alt+1–5` (Gespräch). | 02 §9, 03 §8.7, 05 Seitenleiste, Nielsen 4, WCAG 2.1.4 | Gleiche Lösung wie Shop-/Service-Kritik: **global reserviert** `n / ? x a s j k e z m Enter Esc Leertaste`, `⌘K ⌘Enter ⌘S ⌘P ⌘Z`; **Bereichsaktionen nur mit `Shift+Buchstabe`**: `Shift+Q` Annehmen (Qualifizieren), `Shift+T` Termin anlegen, `Shift+A` Aufgabe (statt `c`), `Shift+B` Bestätigen, `Shift+U` Umbuchen, `Shift+K` Kundenakte öffnen, `Shift+M` E-Mail schreiben, `Shift+E` CSV (Recht). Zeilen-Primäraktion = `⌘/Strg+Enter` auf fokussierter Zeile. Paging = `←/→` bei Tabellenfokus (02 §9.2), `Alt` entfällt. Tabs überall `Alt+1…9` (02 §9.4). Kalender: `d`/`w` = Tag/Woche bleiben, Monat nur über den Segment-Schalter (Fokus + `←/→`, 03 §8.10), `m` = Verschieben (wie Kanban 03 §8.8). Kontextabhängige `g`-Akkorde (`g a`, `g t`, `g p`) streichen; Unterseiten über Palette `> Termine`. Kürzel einzeln abschaltbar (WCAG 2.1.4: Benutzer-Menü „Einzeltasten-Kürzel aus“). |
| P12 | **Undo-Lücken** außerhalb der Termine (Matrix §2.3): Raum-Zeile im Protokoll löschen (`⌘Backspace`, kein Undo), Kontakt aus Anfrage anlegen (falscher Kontakt bleibt), Doppelgänger „Verknüpfen“, Widerspruch erfassen (kein Rückweg, auch nicht für Leitung), Verfügbarkeit löschen, Terminart deaktivieren (Website sofort leer), Einstellungen speichern „gelten sofort“. | 02 §6.1, Nielsen 3, 5 | Undo-Toast 8 s für: Raum-Zeile löschen (Zeile klappt 160 ms per `grid-template-rows` zu, Toast „Raum ‚Küche‘ entfernt · Rückgängig (Z)“), Verknüpfen (Gegenaktion `set_value kontakt = alt`), Verfügbarkeit löschen, Terminart „Website aus“. Kontakt-Anlage aus Anfrage: Toast „Kontakt PH-KON-… angelegt · Rückgängig“ – Undo setzt `kontakt` leer und legt Aufgabe „Kontakt PH-KON-… prüfen/löschen“ an Leitung an (Löschen hat kein Mitarbeiterrecht). Widerspruch: Leitung bekommt `⋯` „Widerspruch aufheben“ (Dialog mit Pflicht-Notiz, protokolliert) – Anfrage an ph_crm (`widerspruch_aufheben(notiz)`). Einstellungen: Speichern zeigt Dialog md „Diese Änderungen gelten sofort für die Website-Buchung“ mit Diff-Liste (Feld: alt → neu) – außenwirksam, daher Dialog laut 02 §6.2; danach Toast mit „Rückgängig“ (stellt Werte zurück). |
| P13 | **Autosave ohne Fehlerzustand** – ausgerechnet im Gesprächsprotokoll am iPad (§2.10, §7), das während der Beratung geschrieben wird. Beschrieben sind nur „gespeichert 10:42“ und „Offline – wird gespeichert“. Was passiert bei `invalid`, `conflict`, `forbidden`, abgelaufener Sitzung, voller IndexedDB, Foto-Upload-Fehler? | 02 §7.2, Nielsen 1, 9, WCAG 4.1.3 | Speicheranzeige im Kopf mit 5 Zuständen (`role="status"`, nur Zustandswechsel werden angesagt): `Speichert …` (ab 300 ms) · `Gespeichert 10:42` · `Offline – auf diesem Gerät gesichert (3 Änderungen)` (`warning-text`) · `Nicht gespeichert – [Erneut]` (`danger-text`, Retry 2/4/8 s automatisch, `role="alert"` erst nach dem 3. Fehlversuch) · `Sitzung abgelaufen – [Anmelden]` (Overlay 02 §7.2 `auth`, Eingaben bleiben). Verlassen der Seite bei „Nicht gespeichert“/„Offline“ → Dialog „3 Änderungen sind noch nicht gespeichert“ [Weiter bearbeiten] [Trotzdem verlassen – bleibt auf dem Gerät]. Foto-Upload: Kachel mit Fortschritt, Fehler-Kachel „Foto nicht hochgeladen · Erneut“; Fotos zählen nicht als „gespeichert“, bis hochgeladen. |
| P14 | **Kundenansicht fehlt.** Das iPad liegt beim Protokoll zwischen Berater und Kunde. Sichtbar bleiben: Toasts und Glocke mit Namen anderer Kunden („Anfrage von Fam. Huber zugewiesen“), Seitenleisten-Badge, Tab „Intern“ (Kaufwahrscheinlichkeit, Marge) als Reiter, Status-Badge, Zeitleiste mit internen Kommentaren. | DSGVO-Grundsatz Vertraulichkeit, Nielsen 8, 02 §11 | Knopf **„Kundenansicht“** im Protokoll-Kopf (Icon `presentation`, Text sichtbar) und automatisch beim Wechsel ins Vollbild: blendet Seitenleiste, Glocke, Badge, Tab „Intern“, Verlauf, Status-Badge aus; Toasts anderer Datensätze werden zurückgehalten und beim Verlassen gesammelt gezeigt („2 Benachrichtigungen während der Kundenansicht“); Kopf zeigt nur Wortmarke (Bodoni, 03: Wortmarke erlaubt im Kundenkontakt) + Datum + Kundenname. Verlassen mit Knopf „Kundenansicht beenden“ + Gerätecode/PIN nicht nötig (Sitzung bleibt), aber Langdruck 600 ms auf den Knopf, damit der Kunde nicht versehentlich tippt; Fortschrittsring 600 ms linear. Einblenden/Ausblenden der Leisten 160 ms Opazität. |
| P15 | **Touch-Gesten widersprechen 02 und kollidieren.** CRM: Wischen links = Primäraktion, rechts = Wiedervorlage +1 Tag; 02 §11.2: links = Zuweisen, rechts = Erledigt. Rückfedern 320 ms `--bo-ease-spring` – 04 P5 erlaubt Spring nur beim Kanban-Drop. Kalender am iPad: Drag (Verschieben) und Langdruck 400 ms (02: Kontextmenü) und Scrollen der Wochenansicht auf derselben Fläche. | 02 §11.2, 04 P5, WCAG 2.5.1, 2.5.7 | Wischregel app-weit (Antrag an 02, §4): **rechts = Primäraktion der Zeile** (grüne Fläche mit Text, z. B. „Annehmen“), **links = Mehr** (öffnet Zeilenmenü als Bottom-Sheet); Schwelle 30 %, Rückfedern 200 ms `--bo-ease-out`. Kalender Touch: **kein Drag**; Tippen → Peek mit Knöpfen „Verschieben“, „Dauer ändern“; Langdruck = Kontextmenü (wie 02). Desktop-Drag bleibt. |
| P16 | **Kanban Anfragen: Drop-Verhalten für 2 von 5 Spalten undefiniert.** „Termin vereinbart“ geht laut §4.1 nur über A1, „Angebot“ nur über A2 – was beim Drop dorthin passiert, steht nicht im Konzept. „Verloren“ ist ausgeblendet, also per Drag unerreichbar. Nicht erlaubte Spalten nur „halbtransparent mit Tooltip“ (am iPad/Screenreader unsichtbar). | Nielsen 1, 5, 03 §8.11 (Tooltip nie einzige Quelle), WCAG 2.5.7 | Drop auf „Termin vereinbart“ öffnet A1 (P6) als Dialog, vorbefüllt; Abbrechen → Karte kehrt 200 ms zurück, kein Statuswechsel. Drop auf „Angebot“ → Sheet „Angebot anlegen“ (A2) mit Übergabe. Unter dem Board eine **Ablagezone** 56 px „Verloren · Spam“ (erscheint 160 ms beim Ziehen), Drop öffnet Verloren-Dialog bzw. Spam mit Undo. Nicht erlaubtes Ziel: Rückkehr + Toast mit Grund (`role="status"`), nicht nur Tooltip. Tastatur laut 03 §8.8 (`Leertaste` greifen, `←→`, `Enter`, `m` Menü) ausdrücklich für beide CRM-Boards nennen – fehlt im Konzept. |
| P17 | **Zusammenführen (A-CRM4) kann Daten verlieren.** Ablauf „Quell-E-Mail leeren → `set_value` → `rename_doc(merge=1)`“ aus dem Client: scheitert Schritt 3, hat der Quellkontakt keine E-Mail mehr und ist nicht zusammengeführt. Kein Teilfehler-Verhalten beschrieben. | Nielsen 5, 9, 02 §7.2 | Ohne serverseitige Methode `zusammenfuehren(quelle, felder)` (ein Transaktionsschritt) **kein Zusammenführen in der UI**; stattdessen „Ähnliche Kontakte“ → „Als Duplikat melden“ (Aufgabe an Admin mit beiden Links). Mit Methode: Ergebnisdialog listet „3 Anfragen, 2 Termine, 1 Rechnung verschoben“; Fehler → „Nichts geändert: <Grund>“. Dialog sm vor Ausführung (irreversibel, 02 §6.2), Titel „Muster Anna in Familie Muster zusammenführen?“. |
| P18 | **Gesprächsprotokoll: Tabs und Wireframe widersprechen sich.** Tabs „Räume & Wünsche | Rahmen | Gespräch | Intern | Verlauf“, Wireframe zeigt RÄUME, RAHMEN, GESPRÄCH untereinander auf einer Seite. Im Gespräch mit dem Kunden versteckt jeder Tab-Wechsel Kontext; Primär nach Status bietet 3 gleichrangige Wege (Planung beauftragen · Angebot · Abschließen). | Nielsen 6, 8, 02 §0.2 | **Eine Scrollseite** mit Abschnitten Räume · Rahmen · Zusammenfassung; links (≥ 1024 px) schmale Abschnittsleiste mit Ankern (aktiver Abschnitt Sand-Strich 2 px, gleitet 160 ms). „Intern“ und „Verlauf“ als Sheet hinter `⋯` (in Kundenansicht P14 ausgeblendet). **Ein Primärknopf**: Offen → „Gespräch abschließen“ öffnet Sheet „Wie geht es weiter?“ mit drei Kacheln **Planung beauftragen** · **Angebot erstellen** · **Nur abschließen** (je ein Satz Folgen, Tasten `1–3`); das ersetzt A-CRM3-Schritt „Folgen anzeigen“ und den Folgen-Dialog. |
| P19 | **Leerzustände fehlen an 23 Stellen** (Liste §2.4), darunter Terminarten leer (= Website zeigt keine Buchung) und Kundenakte-Übersicht ohne Gespräch/Adressen. Erstbesuchs-Hinweis (02 §8) und Hilfe-Artikel (02 §16) fehlen im ganzen Bereich; `?`-Panel nicht beschrieben. Widerspruch in sich: Anfrage-Tab „Produkte“ bei 0 **ausgeblendet**, Kundenakte-Tabs bei 0 **grau sichtbar**. | 02 §7.1, §8, §16, 03 §8.18, Nielsen 10 | Texte §2.4 übernehmen. Regel: **Tabs mit 0 bleiben sichtbar und grau** (auch Anfrage „Produkte“). Erstbesuchs-Band je CRM-Seite (≤ 2 Sätze, „Verstanden“), z. B. Anfragen: „Neue Anfragen von Website und KI-Assistent landen hier, die älteste steht oben. ‚Annehmen‘ heißt: du kümmerst dich darum.“ Hilfe-Artikel `backoffice/hilfe/crm/{start,anfragen,kontakte,kundenakte,termine,gespraeche,aufgaben,berichte,einstellungen}.md` als Liefergegenstand in §10 aufnehmen. |
| P20 | **Begriffe für Nicht-IT-Mitarbeiter.** „Qualifizieren“, „Posteingang“, „Trichter“, „Side-Peek“, „Folgedokument“, „Vertriebscockpit“ (Navigation sagt „Berichte“), „Erledigt + Protokoll“ (kein Verb, 02 §14), „Studio“ (Kalender, Terminart) vs. „Showroom“ (Verfügbarkeit, Ort, Quelle), „Kunden“ (Brotkrumen Kundenakte) vs. „Kontakte“ (Liste). Brotkrume „Zentrale › Kunden › Familie Muster“ führt zu keiner Liste. | Nielsen 2, 4, 02 §14 | Oberflächen-Begriffe: **Annehmen** (statt Qualifizieren; gespeicherter Wert bleibt), **Neue Anfragen** (statt Posteingang), **Protokoll schreiben** (statt Erledigt + Protokoll), **Verkaufsverlauf** (statt Trichter; Tooltip „Wie viele Anfragen im Zeitraum zu Terminen, Gesprächen, Angeboten, Aufträgen wurden“), **Vorschau** (statt Peek, intern bleibt `SidePeek`), **Showroom** überall (Modus-Label, Terminart-Titel im Backoffice; Website-Texte sind Sache der Website). Liste heißt **„Kunden & Kontakte“**, Route `/crm/kontakte`, Brotkrume der Akte „Zentrale › CRM › Kunden & Kontakte › Familie Muster“ (05 §5.1 anpassen). „Vertriebscockpit“ nur als Berichtstitel. |

---

## 2. Weitere Schwächen (Empfehlungen, keine Blocker)

### 2.1 Komplexität und Klickzahlen (Nachzählung §1.2, Regel 02: ab Zentrale, ohne Suche, Enter = Klick, Tippen zählt nicht)

| # | Aufgabe | Ziel lt. Konzept | Beschriebener Weg | Tatsächlich | Nach Pflichtänderungen |
|---|---|---|---|---|---|
| T1 | Anfrage qualifizieren | 1 | Heute-Chip → Liste → Qualifizieren | **2** | 1 (Zentrale „Zu erledigen“ zeigt Zeile mit „Annehmen“ – Zentrale-Agent muss die Liste übernehmen) |
| T2 | Als Spam | 1 | Liste → `⋯` → Als Spam (ab Zentrale + Chip) | **3** | 2 (Wischen links → „Spam“ bzw. `⋯` in „Zu erledigen“) |
| T3 | Termin anlegen | 3 | Chip → Akte → Termin anlegen → ② Art → ③ Slot → Weiter → ④ Anlegen | **7** | 4 (Chip → Akte → Termin anlegen → Slot → „Termin anlegen“ = 5; ab „Zu erledigen“ Zeilenmenü → Termin = 4) |
| T4 | Termin bestätigen | 2 | Chip → Bestätigen → Dialog „Bestätigen und senden“ | **3** | 2 (Mail mit Undo-Toast statt Dialog, §2.3) |
| T5 | Termin umbuchen | 3 | per ⌘K (nicht zulässig); ohne Suche: CRM → Termine → Ereignis → Umbuchen → Slot → Übernehmen | **6** | 5; mit ⌘K-Weg getrennt ausweisen (3) |
| T6 | Protokoll schreiben | 2 | Chip „Termine heute“ → Termin → Erledigt + Protokoll | **3** | 2 („Mein Tag“ auf Zentrale/CRM hat „Protokoll schreiben“ in der Zeile) |
| T7 | Planung beauftragen | 2 | (Protokoll erreichen ≥ 2) → Planung beauftragen → A-CRM3 4 Schritte | **≥ 7** | 4 (Zu erledigen/Mein Tag → Protokoll → „Gespräch abschließen“ → Kachel „Planung beauftragen“) |
| T8 | „Wie steht es?“ | 1 Tipp + 1 | Suche | 1 (Suche) / ohne Suche **3** | unverändert, Suche-Weg ausweisen |
| T9 | Aufgabe erledigen | 1 | Zentrale „Meine Aufgaben“ → Haken | 1 | 1 |
| T10 | Wiedervorlage setzen | 1 | Zelle → Datum wählen (+ Enter) | **2–3** | 2 |
| T11 | Zuweisen | 1 | `a` → Person → Enter | **2** | 2 |
| T12 | Verfügbarkeit ändern | 2 | CRM → Einstellungen → Verfügbarkeit (nicht in Navigation) → Zelle → Popover Speichern | **5** | 4 (Navigation „Einstellungen“ zeigt Verfügbarkeit als ersten Reiter) |
| T13 | Widerspruch erfassen | 2 | (Kundenakte nur über Suche/Liste) → Datenschutz → Widerspruch → Quelle → Erfassen | **≥ 6** | 5 (Kopf `⋯` „Widerspruch erfassen“ statt Tab) |
| T14 | DSGVO-Auskunft | 2 | wie T13 | **≥ 5** | 4 |
| T15 | Wochenauswertung | 1 | CRM-Start | 1 | 2 (Charts in Berichte, P3) – bewusst |
| T16 | Anfrage per Telefon | 2 | `n` → Anlegen | 2 | 2 |
| T17 | Zusammenführen | 3 | Hinweis → Ziel → Felder (n Radios) → Weiter → Zusammenführen | **≥ 5** | P17 (bis Methode: „Als Duplikat melden“ = 2) |

Weitere Komplexität:
- **Fünf Objekte, 25 Statuswerte.** Für 10–15 Personen ist die Trennung Anfrage / Termin / Gespräch / Aufgabe fachlich richtig, aber die Oberfläche muss sie als **einen Vorgang** zeigen. Empfehlung: Anfrage-Akte bekommt oben eine **Vorgangsleiste** (02 §3.1) „Anfrage → Termin Di 14:00 → Gespräch 04.11. → Angebot AN-… → Auftrag“, jede Station klickbar; Termin- und Gesprächsakte zeigen dieselbe Leiste. Die interne Phasenleiste je Objekt (§2.4, §2.9) entfällt (Doppelung).
- **Drei Einstiege, einen Kontakt zu verknüpfen** (Bezüge „[Kontakt anlegen]“, Doppelgänger-Band „Verknüpfen“, `⋯` „Kontakt anlegen/verknüpfen“) → einer: Bezugszeile „Kontakt“ mit Knopf „Zuordnen“ (Link-Suche, erster Vorschlag = Doppelgänger, letzter = „Neu anlegen aus dieser Anfrage“); Band nur, wenn ein Treffer existiert, mit demselben Knopf.
- **Person doppelt:** Anfrage-Tab „Person“ ist editierbar, Kundenakte auch – zwei Quellen. Sobald `kontakt` gesetzt ist: Tab Person zeigt Kontaktdaten lesend + „In Kundenakte ändern“; nur abweichende Anfrage-Angaben (z. B. andere Telefonnummer im Formular) als Hinweis „Anfrage nennt +43 …, Kontakt hat +43 … – [In Kontakt übernehmen]“.
- **Liste Anfragen: 9 Spalten + Checkbox + `⋯`.** iPad-Prioritätsspalten (02 §11.1) fehlen. Vorschlag ≤ 1279 px: Eingang · Anfrage · Status · Zeilenaktion. Fußzeile „Summe sichtbar: –“ streichen (Anfragen haben keinen Betrag). CSV dreifach (Fuß, `e`, Massenaktion) → nur Massenaktion + Palette.
- **Kontaktliste „Letzter Kontakt“ = `modified`** zeigt jede Bearbeitung als Kontakt – falsche Information. Spalte ausblenden, bis die berechnete Größe existiert (§12.12). Gleiches gilt für Kennzahl **„Gewonnen (Quartal)“ über `modified`** (§5.1 selbst: „ungenau“): nicht anzeigen, bis `gewonnen_am` existiert; Karte zeigt „–“ mit Tooltip „Wird verfügbar, sobald das Gewinndatum erfasst wird“ (02 §14: keine erfundenen Zahlen).
- **Seitenleisten-Badge** zählt „mir zugewiesen oder niemandem“, Heute-Leiste zählt alle – zwei Zahlen für „neue Anfragen“ auf demselben Bildschirm. Eine Definition (mir + niemandem) für Badge, Heute-Chip und Liste „Neue Anfragen“; Leitung zusätzlich „Team: 7“ im Tooltip.
- **Unternavigation 8 Einträge** (§2: Übersicht … Einstellungen) > 7 (02 §2.1). „Aufgaben“ existiert zweimal (`/aufgaben` Zentrale, `/crm/aufgaben`). Vorschlag: Übersicht · Anfragen · Kunden & Kontakte · Termine · Gespräche · Mehr ▾ (Aufgaben → Zentrale-Link, Berichte, Einstellungen). `/crm/verfuegbarkeit` → `/crm/einstellungen?tab=verfuegbarkeit` (307), Brotkrume passt dann.
- **„Erledigt“ mit `protokoll=1` als Standard** erzeugt bei jedem kurzen Telefontermin ein leeres Protokoll; Kanban nutzt `protokoll=0`. Mit P7 erledigt: Protokoll nur über „Protokoll schreiben“, sonst „Ohne Protokoll abschließen“.
- **Gespräch-Liste Budget nur für Leitung/GF/Faktura**, aber der Berater tippt das Budget selbst ein und sieht die Summe in der Akte. Regel klären: entweder Berater sieht seine eigenen Summen in der Liste, oder Budget ist auch in der Akte für Mitarbeiter permlevel 1 – aktueller Stand ist widersprüchlich.

### 2.2 Tastatur (Kollisionen und Lücken)

| Kürzel im Konzept | Ort | Kollidiert mit | Vorschlag |
|---|---|---|---|
| `Alt+←/→` Seite | Anfragen-Liste | Browser Zurück/Vor (Windows, Chrome/Edge) | `←/→` bei Tabellenfokus (02 §9.2) |
| `c` Aufgabe | Liste, Akte, Kundenakte, global „überall“ | 02 §9.2 `C` = Kommentar | `Shift+A` |
| `e` CSV | Anfragen-Liste | 02 §9.1 `E` = Bearbeiten | `Shift+E` oder Palette |
| `e` Erledigt + Protokoll | Termin-Akte | 02 §9.1 `E`, Anfrage-Akte `e` = erstes Feld | `⌘/Strg+Enter` (Primärknopf) |
| `x` Absagen | Termin-Akte | Liste `x` = auswählen (Muskelgedächtnis) | `Shift+X` → Dialog |
| `t` Termin | Liste/Akte | Kalender `t` = heute | Termin anlegen `Shift+T`, Kalender `t` = heute bleibt |
| `m` Monat **und** Verschieben | Kalender | sich selbst; Kundenakte `m` = E-Mail | `m` = Verschieben (03 §8.8), `d`/`w` Tag/Woche, Monat über Segment-Schalter, E-Mail `Shift+M` |
| `p` Drucken | Anfrage/Termin | 02 `⌘P` | `⌘/Strg+P` |
| `k` Kontakt öffnen | Anfrage/Termin-Akte | `j/k` Blättern im Peek | `Shift+K` |
| `g a`, `g t`, `g p` | innerhalb CRM / Kundenakte | 05: `g p` = Projekte; Akkorde sind global | streichen; Palette `> Termine` |
| `1–4` Zeitraum | `/crm` | Liste `1–7` Statuschips | Zeitraum nur per Segment, ohne Ziffern |
| `1–6` / `1–9, 0, -` / `Alt+1–5` | Akten | einander, 02 §9.4 `Alt+1…9` | überall `Alt+1…9` |
| Leertaste Peek | Liste | 02 §9.2/03 §8.7 Leertaste = auswählen | Fundament entscheidet (§4); Konzept schreibt „laut Fundament“ |
| Shift+Klick Peek | Liste | 03 §8.7 Shift+Klick = Bereichsauswahl | Peek nur Leertaste/Knopf `panel-right` in der Zeile |
| `⇧⏎` zurück | A1 | Zeilenumbruch in Textarea | entfällt (P6) |
| `⌘Backspace` Raum löschen | Protokoll | macOS: Zeile im Textfeld löschen; Windows: Strg+Backspace = Wort löschen | Knopf `trash-2` je Raumkarte + `Shift+Entf` bei Fokus auf Karte (nicht im Feld), Undo |
| `+` Raumleiste fokussieren | Protokoll | Zahleneingabe auf Ziffernblock (Budget) | `Alt+R` geht nicht (02: kein Alt+Buchstabe) → `Shift+R` |
| `r` neu laden, `v` Liste/Kanban, `.` Aktionsmenü, `⇧q`, `⇧n` | diverse | nicht in 02 registriert | in 02 §9 aufnehmen oder streichen; `.` = Aktionsmenü global vorschlagen |

Lücken: Kanban-Tastatur (03 §8.8) für beide Boards nicht genannt; Verfügbarkeitsraster ohne Tastaturbedienung (Zelle per Pfeiltaste, `Enter` öffnet Popover, Fenster anlegen per Popover statt Ziehen); Dauer eines Termins nur per Ziehen am unteren Rand – Umbuchen-Dialog muss Dauer enthalten (§2.9 sagt „nur über Umbuchen“, Dialog listet die Dauer nicht); Zeitleiste-Filter-Chips ohne Kürzel (ok, Tab-Reihenfolge reicht – aber Reihenfolge festlegen: Filter → Einträge → Composer).

**Menge:** Das Konzept führt rund 40 Bereichskürzel ein. Für ein Team ohne IT-Hintergrund zählt die sichtbare Hälfte: jeder Knopf zeigt sein Kürzel im Tooltip (02 §9), `?` zeigt die Liste der Seite. Keine Funktion darf nur per Kürzel erreichbar sein (Triage `⇧q` braucht einen sichtbaren Knopf „Der Reihe nach durchgehen“ über der Liste „Neue Anfragen“).

### 2.3 Undo, Rückfragen, Fehlervermeidung (Matrix)

| Aktion | Konzept | Soll (02 §6, 04 §3.6) |
|---|---|---|
| Annehmen (Qualifizieren) | Undo 5 s, danach endgültig | Undo 8 s + Warteschlange (P8) |
| Spam (einzeln / Masse) | 5 s / 8 s | 8 s / 8 s |
| Zuweisen, Wiedervorlage, Priorität | Undo 5 s | 8 s |
| Termin bestätigen mit Mail | Dialog | Undo-Toast 10 s „Bestätigungsmail an f***@… wird gesendet · Rückgängig (Z)“; Knopf als Split-Button „Bestätigen ▾ · Ohne Mail bestätigen“; Massenbestätigung behält Dialog (Anzahl Mails) |
| Termin verschieben (Drag/Dialog) | Undo 5 s, Mail nach Ablauf | Undo 10 s (Mail), sonst gleich – einheitlich mit Bestätigen |
| Termin absagen | Dialog mit Grund | bleibt (Pflichtangabe) |
| Termin erledigt / nicht erschienen | sofort, ohne Rückweg | P7 |
| Gespräch abschließen | Undo (nur Masse genannt) | Undo 8 s auch einzeln |
| Planung beauftragen | Dialog | bleibt (legt Projekt an) – im Sheet „Wie geht es weiter?“ (P18) als Folgen-Satz, Primär „Planung beauftragen“ |
| Raum-Zeile löschen | ohne Undo | P12 |
| Kontakt anlegen aus Anfrage | ohne Undo | P12 |
| Widerspruch erfassen | Dialog, kein Rückweg | P12 |
| Portal-Zugang sperren | nicht beschrieben | Dialog (außenwirksam) |
| Einstellungen speichern | ⌘S, sofort live | P12 |
| Mail nach Ablauf scheitert | nicht beschrieben | Glocke-Eintrag „Bestätigungsmail an Hr. Keller nicht gesendet – [Erneut senden]“ + Zeitleiste rot, weil der Benutzer den Toast nicht mehr sieht |

`pagehide`-Flush (04 §3.6) ausdrücklich für CRM übernehmen: Tab schließen innerhalb des Undo-Fensters führt die Aktion aus, nie stillschweigend verwerfen.

### 2.4 Fehlende Leerzustände (Text-Muster 02 §7.1, Darstellung 03 §8.18)

| Ort | Fall | Text | Aktion |
|---|---|---|---|
| Heute-Zeile `/crm` | alles 0 | „Heute nichts Dringendes.“ | – |
| „Zu erledigen“ | leer | „Alles erledigt.“ (Häkchen 32 px Sand) | – |
| Anfrage-Akte Zeitleiste | leer | „Noch keine Aktivität.“ (03 §8.16) | – |
| Anfrage-Akte Produkte | 0 | Tab grau sichtbar, Inhalt „Keine Produkte aus der Merkliste.“ | – |
| Kanban Anfragen Spalte | leer | „Keine Einträge“ (03 §8.8) – im Konzept nur für Termine genannt | – |
| Termin-Akte Tab Website-Buchung | Backoffice-Termin | Tab ausblenden (kein Bezug), nicht leer zeigen | – |
| Kalender Tagesansicht | Berater ohne Verfügbarkeit | Spalte grau „Keine Verfügbarkeit hinterlegt“ (Leitung: Link „Verfügbarkeit eintragen“) | Link |
| Kalender Monat | leer | „Keine Termine im November.“ | [Termin anlegen] |
| Termine Liste „Vergangen ohne Protokoll“ | leer | „Alle Protokolle geschrieben.“ (Häkchen) | – |
| Termine Liste gefiltert | 0 | „Keine Termine für diese Filter.“ | [Filter zurücksetzen] |
| Gespräche gefiltert | 0 | „Keine Gesprächsprotokolle für diese Filter.“ | [Filter zurücksetzen] |
| Gespräche „Nächster Schritt fällig“ | leer | „Kein Schritt fällig.“ (Häkchen) | – |
| Aufgaben gefiltert / „Team“ | 0 | „Keine Aufgaben für diese Filter.“ / „Im Team ist nichts offen.“ | [Filter zurücksetzen] |
| Kontakte gefiltert, Suche | 0 | „Kein Kontakt zu ‚Muler‘. Meintest du ‚Müller‘?“ (wenn `api.suche` liefert) | [Kontakt ‚Muler‘ anlegen] (Recht) |
| Kundenakte Übersicht Gesprächsstand | kein Protokoll | „Noch kein Beratungsgespräch.“ | [Termin anlegen] |
| Kundenakte Adressen / Einwilligungen | leer | „Keine Adresse hinterlegt.“ / „Keine Einwilligung erfasst.“ | [Adresse ergänzen] |
| Zeitleiste gefiltert | 0 | „Keine Einträge vom Typ ‚Geld‘.“ | [Alles zeigen] |
| A1 Kunde-Suche | 0 Treffer | „Kein Kontakt gefunden.“ | [Neu: ‚Keller‘] (Felder klappen auf) |
| A1 / Einstellungen Terminarten | keine aktive Terminart | Mitarbeiter: „Es sind noch keine Terminarten eingerichtet – bitte Leitung fragen.“; Leitung/Einstellungen: „Ohne Terminart kann niemand online buchen und kein Termin angelegt werden.“ | [Terminart anlegen] |
| Berichte-Index | Bericht ohne Recht | Kachel ausblenden; alle ausgeblendet → „Für deine Rolle gibt es hier keine Berichte.“ | – |
| Massenaktion-Vorschau | 0 von n möglich | „Für keine der 5 Anfragen möglich: alle schon angenommen.“ Knopf deaktiviert mit Grund | – |
| Side-Peek | Laden / Fehler / nicht gefunden | Skeleton nach 300 ms; Fehlerblock mit Code + „Erneut“; „Gibt es nicht mehr“ + Zeile ausgrauen | – |
| Telefon `/crm` | Mein Tag + Neue Anfragen leer | „Heute keine Termine, keine neuen Anfragen.“ | [Anfrage erfassen] |

### 2.5 Fehlende Fehlerfälle

- **`rate_limited` beim Blättern im Slot-Raster** (60/min, §4.2): Raster zeigt Band „Zu viele Abfragen – in 0:42 wieder möglich“ mit Countdown (02 §7.2), bereits geladene Wochen bleiben bedienbar.
- **Reservierung abgelaufen** (Countdown rot, §2.9): Folgeaktion fehlt. Vorschlag: Band „Reservierung abgelaufen – Zeit ist noch frei“ [Bestätigen] bzw. „… vergeben“ [Neue Zeit anbieten] (prüft `get_freie_slots` beim Ablauf einmal).
- **Kalender-Quellen teilweise nicht ladbar** ist beschrieben; **Verfügbarkeit nicht ladbar** nicht – dann ist „frei“ im Raster falsch. Raster ohne weiße Flächen + Band „Verfügbarkeit nicht geladen – freie Zeiten bitte im Termin-Assistenten prüfen“.
- **Doppelgänger-Prüfung schlägt fehl** (Netz): stiller Ausfall ist hier riskant; Hinweis unter dem Feld „Prüfung auf bestehende Kontakte nicht möglich“ (`muted`), Anlegen bleibt erlaubt.
- **Kanban-Drop während Undo-Fenster** einer vorherigen Aktion an derselben Karte: Warteschlange (P8).
- **Zwei Berater am selben Protokoll** (iPad + Laptop): Konfliktdialog ist genannt; Feldweise statt Dokumentweise (02 §4.2: Zelle gelb, „Übernehmen / Meinen Wert behalten“) für Raum-Zeilen.
- **Portal-Token-Dialog** „schließen nur über ‚Ich habe den Zugang übergeben‘“: `Esc` muss trotzdem wirken (WCAG 2.1.2), dann Zwischenfrage „Zugang wurde nicht angezeigt bestätigt – erneut erzeugen ist jederzeit möglich. Schließen?“.

### 2.6 Barrierefreiheit (WCAG 2.2 AA)

| Kriterium | Befund | Änderung |
|---|---|---|
| 1.4.1 Farbe | Alter-Punkt rot/orange in Spalte Eingang, Fälligkeitspunkt rot/sand/grau, Kalender-Status nur Rand (gestrichelt/voll) + Farbe, Countdown orange/rot, Marker ⊘ nur Symbol + Rot | Text immer daneben: „31 h · überfällig“, „gestern · fällig“; Ereigniskarte trägt Status-Wort in der zweiten Zeile („unbestätigt“); Countdown „reserviert bis 10:42 (abgelaufen)“; ⊘ mit `aria-label` „Widerspruch“ und sichtbarem Text im Peek |
| 1.4.3 Kontrast | Sand `#8a7a66` auf Weiß 4,15:1 (03 §1.6) – im Konzept als Pflichtstern, Fälligkeitspunkt-Text, Häkchen genannt | Sand nur für Nicht-Text (≥ 3:1 ok) oder Text ≥ 18,66 px fett; Fälligkeitstext in `ink-soft`, Punkt in Sand |
| 2.5.8 Zielgröße | Kalender: 15-min-Raster; bei üblichen Stundenhöhen sind 15-min-Blöcke unter 24 px; Avatare 24, Status-Chips im Kopf | Stundenhöhe so wählen, dass 15 min ≥ 24 px (kompakt) bzw. ≥ 44 px (iPad, dann scrollt der Tag); kürzere Blöcke zeigen nur Uhrzeit + Name in einer Zeile; Slot-Chips in A1 ≥ 44 × 44 am iPad |
| 2.5.7 Ziehen | Verfügbarkeit „Ziehen im Zeitraster legt Fenster an“; Termin-Dauer per Ziehen | Popover-Weg ausdrücklich gleichwertig; Dauer im Umbuchen-Dialog (§2.2) |
| 2.5.1 Zeigergesten | Wischen in Listen | sichtbare Alternative (Zeilenaktion-Spalte, `⋯`) – mit P9 erfüllt |
| 4.1.3 Statusmeldungen | Countdown „jede Sekunde“ | `aria-live="off"` am Countdown; Ansage nur bei 5 min, 1 min, abgelaufen |
| 4.1.3 | Zählanimation Kennzahl | `aria-live="off"` am Zähler (04 §3.7), Endwert im Text |
| 2.4.3 Fokusreihenfolge | Side-Peek: Fokus bleibt in der Tabelle (j/k), Peek-Inhalt für Tastatur erreichbar? | Peek = `role="complementary"` mit `aria-label` „Vorschau Anfrage …“; `F6` springt zwischen Tabelle und Vorschau; Öffnen sagt „Vorschau geöffnet“ an |
| 2.4.11 Fokus nicht verdeckt | Auswahlleiste unten (sticky) und Toast-Stapel überdecken letzte Tabellenzeilen | `scroll-padding-bottom` = Höhe Leiste + 16 px |
| 1.3.1 Struktur | Kalender als Raster: Semantik fehlt | `role="grid"` mit Zeilen = Zeitfenster, Spalten = Tage; Ereignisse als Buttons mit dem `aria-label` aus Q21; Alternative Listenansicht bleibt gleichwertig (ist vorhanden – gut) |
| 3.3.1/3.3.3 Fehler | Verloren-Grund Pflicht im Dialog, Fehlertext nicht beschrieben | „Bitte einen Grund wählen“ unter dem Feld, Fokus aufs Feld |
| 2.2.1 Zeitlimit | Undo 5 s | 8 s, Pause bei Hover/Fokus, `F8` fokussiert Toast (03 §8.12) |
| 3.2.6 Hilfe | `?` als Knopf in der Anfragen-Kopfzeile, sonst Benutzer-Menü | Hilfe immer an gleicher Stelle (Benutzer-Menü + `?`), kein zusätzlicher Knopf je Seite |

### 2.7 Mobile / iPad

- **iPad quer ist Hauptgerät, aber Listen sind für Desktop beschrieben.** Je Liste die 4 Prioritätsspalten nennen (02 §11.1); Rest in die Vorschau.
- **Protokoll am iPad:** Raum-Chips „[+ Wohnen] … [+ Pool] …“ (10+ Chips, umbrechend) → 6 häufigste als Chips (Küche, Wohnen, Essen, Schlafen, Bad, Outdoor) + „Weitere ▾“; Reihenfolge je Berater lernen ist nicht nötig. Chips 44 px, Abstand 8 px.
- **Diktat** ist iOS-Tastatur – gut, keine eigene Lösung. Hinweis unter `wunsch`: „Mikrofon auf der Tastatur zum Diktieren“ beim ersten Mal.
- **Kamera:** `capture` öffnet direkt die Kamera; zusätzlich „Aus Fotos wählen“ (Grundrisse kommen oft vom Kunden-Handy per AirDrop).
- **Telefon < 640:** 02 §11.1 sieht Backoffice auf dem Telefon nur lesend vor; CRM erlaubt Anfrage-Anlage, Protokoll, Erledigt. Fachlich richtig für Berater unterwegs – als **Ausnahme in 02 eintragen**, nicht still abweichen.
- **Bottom-Sheet** statt Popover unter 640 px ist richtig; Griff 32 × 4 und Schließen per Wischen nach unten + Knopf „Fertig“ (nicht nur Wischen).
- **Navigation am Telefon** (Termin-Karte): „Navigation“ öffnet Karten-App mit `plz_ort` – mit Straße aus Objektadresse, sonst führt sie in die Ortsmitte; Text „Route (nur Ort bekannt)“ wenn Straße fehlt.

### 2.8 Visuell / Modernität

Maßstab Linear/Attio/Stripe: eine Arbeitsliste im Mittelpunkt, Eigenschaften rechts, wenig Rahmen, Status als ruhige Pillen, Zahlen klein und selten. Das Konzept ist funktional reich, optisch aber eine Sammlung von Kästen (Karten in Karten, Bänder übereinander, Tabs + Phasenleiste + Bezüge + Zeitleiste gleichzeitig).

**W1 – `/crm` nach P3** (Desktop ≥ 1280, Beispielwerte):

```
┌ CRM                                                                 [Neue Anfrage]  ⌘↵ ┐
│ Heute  3 Termine · 2 zu bestätigen · 4 neue Anfragen · 1 Aufgabe überfällig            │  13 px ink-soft, Chips = Links
├────────────────────────────────────────────────────────────┬────────────────────────────┤
│ ZU ERLEDIGEN                                       12      │ MEIN TAG          Di 4. Nov │
│ ● Neue Anfrage   Küche Lochau · Fam. Muster   31 h  [Annehmen]│ 09:00 Showroom · Huber     │
│ ● Bestätigen     Di 10:30 Video · Hr. Keller        [Bestätigen]│       [Protokoll schreiben]│
│ ● Protokoll      gestern 16:00 · Fam. Berger        [Schreiben]│ 10:30 Video · Keller       │
│ ● Wiedervorlage  Fr. Schmid · Angebot nachfassen    [Erledigt] │       [Raum öffnen ab 10:15]│
│   Alle 12 →                                                 │ 14:00 Vor Ort · Lindau     │
├────────────────────────────────────────────────────────────┴────────────────────────────┤
│ Offene Anfragen 23   ·   Termine 7 Tage 14   ·   Offene Aufgaben 5   ·   Reaktion Median – │  4 Zahlen, eine Zeile, 20/500 tabular
│ Verkaufsverlauf (30 Tage)  Anfragen 48 → Termine 21 → Gespräche 17 → Angebote 12 → Aufträge 6   (Leitung/GF) │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

- Zeilen 44 px, keine Kartenrahmen, Trennlinie `line`; Typ-Spalte als Text in `ink-soft` 12 px statt Badge (ruhiger); Zeilenaktion Ghost-Knopf, Hover `surface-2` 120 ms.
- Erledigte Zeile (Annehmen/Bestätigen): Zeile klappt per `grid-template-rows` 160 ms `--bo-ease-in` zu (04 P4-Ausnahme), Nachbarn rücken nach; Toast mit Undo; bei `reduce` sofort.
- Kennzahlen als **Textzeile** statt 8 Karten (Stripe-Home-Stil); Klick = Liste. Kein Hochzählen beim Laden (04 P10), nur nach eigener Aktion 400 ms.

**W2 – Kundenakte nach P4** (≥ 1280):

```
┌ Zentrale › CRM › Kunden & Kontakte › Familie Muster                                         ┐
│ (FM) Familie Muster  ● Kunde                                        [Neu ▾]  [Zahlung erfassen] │
│ [✉ E-Mail] [☎ Anrufen] · bevorzugt Telefon · Lochau · seit 03/2025 · [KK · Stufe] [1 ähnlicher]│
│ ⊘ Widerspruch seit 12.10.2026 – nur vertragsbezogene Kommunikation                              │  nur wenn gesetzt
├ Übersicht | Aktivität | Vorgänge 6 | Projekte & Belege 9 | Service 1 | Mehr ▾ ──┬ DETAILS ─────────┤
│ OFFEN JETZT                                                                     │ Berater  A. Berger▾│
│ ▸ RE-2026-00042 offen · fällig 10.11.                      [Zahlung erfassen]   │ Kontaktart Privat │
│ ▸ Termin Do 06.11. 14:00 Vor Ort · bestätigt                [Öffnen]            │ Sprache  DE       │
│ ▸ Rendering Küche vorlegen · bis 18.11. · A. Berger         [Erledigt]          │ Adressen 3 ▾      │
│ GESPRÄCHSSTAND 04.11.  Küche (hoch) · Wohnen · Budget 47.000,00 € · 3–6 Monate  │ Portal ● aktiv    │
│ LETZTE AKTIVITÄT (3)  heute ✉ Mail eingegangen · gestern ✓ Termin erledigt …  → │ Einwilligungen 2  │
└──────────────────────────────────────────────────────────────────────────────────┴──────────────────┘
```

- Wortmarke nur in Seitenleiste (02 §13); Name Instrument Sans 20/500; Avatar-Initialen nach 03 §8.17.
- Icons in Wireframes des Konzepts sind Emoji (✉ ☎ 📱 💬 ⏱ ⚠ ℹ) – 02 §14 verbietet Emoji; im Bau ausschließlich lucide (`mail`, `phone`, `smartphone`, `message-square`, `timer`, `triangle-alert`, `info`), 16 px, Strich 1,5, mit Textlabel.
- **Bänder:** Termin-Akte stapelt bis zu drei (⚠ Bestätigen, ⏱ Countdown, Website-Mail-Info) + Phasenleiste über dem Inhalt. Regel: max. 1 Band; Countdown in den Kopf neben das Status-Badge („reserviert bis 10:42“), Website-Mail-Info als Zeile im Abschnitt „Website-Buchung“, nicht als Band.
- **Charts:** Donut „Anfragen nach Art … max 6 + Weitere“ = 7 Anteile, 03 §8.15 erlaubt 5. In Berichten horizontale Balken statt Donut (leichter vergleichbar, Beschriftung direkt am Balken).
- **Bewegung:** Chart-Balken 400 ms (§5.2) vs. 04 §3.8 240 ms → 240 ms `--bo-ease-out`, Stagger 20 ms, ab 13 Balken gleichzeitig. Kalender-Puls „0.98 → 1, 320 ms `--bo-ease-spring`“ verstößt gegen 04 P5 → Hervorhebung `sand-soft`-Hintergrund 1200 ms ausblenden (04 §2.3-Ausnahme), keine Skalierung. A1 schließt „240 ms ease-out“ → Austritt 120 ms `--bo-ease-in` (04 P3). Triage-Karte „gleitet 200 ms nach links“ → 160 ms `--bo-ease-out`, Versatz ≤ 16 px + Opazität (02 §13: Bewegung ≤ 16 px), nicht ganze Kartenbreite. Zeitleiste „Höhe 0 → auto“ → `grid-template-rows 0fr → 1fr` 160 ms (04 P4).
- **Dichte:** Konzept nennt keine Zeilenhöhen; 03 §4 (36/44) übernehmen, 02 §13 (40/52) ist veraltet (§4).

### 2.9 Microcopy

- Toast „Anfrage PH-ANF-2026-00124 angelegt · Öffnen“: Nummer ist für Mitarbeiter bedeutungslos → „Anfrage von Familie Muster angelegt · Öffnen“; Nummer im Tooltip.
- „Alles gesichtet.“ / „Alles gesichtet – keine neuen Anfragen.“ (zwei Varianten) → eine: „Keine neuen Anfragen.“
- „Noch kein Raum – Chip antippen.“ → „Noch kein Raum. Tippe oben auf einen Raum, um Wünsche zu notieren.“
- „Nicht geladen · Erneut“ ok; „Zeitraum eingrenzen“ → „Dauert zu lange – bitte kürzeren Zeitraum wählen.“
- „Umbuchung nicht möglich: Zeit belegt“ → „Di 14:00 ist schon belegt – nächste freie Zeit 14:30.“ (Server liefert Slots).
- Dialog Verloren: Titel „Anfrage Küche Lochau als verloren markieren?“ (02 §14: Frage mit Fakten).
- „Prompt“ (Nicht erschienen, Als Kunde markieren) ist keine definierte Komponente → Dialog sm oder Popover mit einem Feld benennen.
- Restsatz §2.11 „Verwerfen (Dialog? nein – Undo)“ ist Arbeitsnotiz → „Verwerfen (Undo 8 s)“.
- Du-Form intern einhalten: „Für diese Terminart ist niemand buchbar – Verfügbarkeit prüfen“ ok; „Bitte telefonisch bestätigen – Mail aus Anfrage folgt mit Update“ (Entwicklersprache) entfällt mit P6.

### 2.10 Unklar oder widersprüchlich im Dokument selbst

| Stelle | Widerspruch | Klärung |
|---|---|---|
| Kopf „Verbindlich aus 01–05: Toast mit Undo 5 s“ | 02/03 sagen 8 s, nur 04 sagt 5 s | 8 s (§4) |
| §2.2 Badge-Farben vs. §4.0 Töne | verschiedene Farbnamen | nur §4.0 nach P10 |
| §2.4 Phasenleiste vs. 02 §3.1 Vorgangsleiste | zwei Leisten-Typen | Vorgangsleiste (§2.1) |
| §2.4 Produkte-Tab ausgeblendet vs. §3.3 Tabs mit 0 sichtbar | – | sichtbar (P19) |
| §2.9 „`start/dauer_min` nur über Umbuchen“ vs. Kalender „Ziehen am unteren Rand = Dauer“ | Dauer zweimal anders | beide rufen `umbuchen` mit neuer Dauer; Parameter `dauer_min` fehlt in `umbuchen(neuer_start, berater)` → Lücke §12 ergänzen |
| §2.12 Breadcrumb „Einstellungen › Verfügbarkeit“ vs. Route `/crm/verfuegbarkeit` | – | §2.1 Komplexität |
| §2.7 „Klick → Peek“, §2.2 „Leertaste/Shift+Klick → Peek, Klick → Akte“ | Klick verhält sich in Kalender und Liste anders | Kalender: Klick = Vorschau ist richtig (Ereignisse sind klein); in §2.7 begründen |
| §4.1 A1 legt Termin **Bestätigt** an, §4.5 ohne Anfrage **Unbestätigt → bestaetigen()** | zwei Wege | P6 |
| §4.6 A-CRM3 4 Schritte vs. §2.10 „Dialog listet Folgen“ | Dialog oder Assistent | P18 |
| §7 Swipe vs. 02 §11.2 | Richtung | P15 |
| 05 §3.3: `/crm` zeigt „Kanban-Kurzansicht Anfragen Neu“, Konzept zeigt Liste „Posteingang“ | – | Liste „Zu erledigen“ (P3), 05 anpassen |
| 05 §5.1 Datenschutz-Tab nennt „Löschkonzept“, Konzept nicht | DSGVO Art. 17 fehlt in der UI | Abschnitt „Löschung“ im Datenschutz: Status der Löschfristen + Knopf „Löschung beantragen“ (Leitung, Dialog laut 02 §6.2 mit Tippfeld) – Anfrage an ph_crm, ob `anonymisieren()` existiert |

---

## 3. Was gut ist und so bleiben soll

1. Primäraktion nach Status in Anfrage-, Termin- und Gesprächsakte (§2.4, §2.9, §2.10) – genau 02 §0.2.
2. Deaktivierte Knöpfe mit Grund („Keine Kontaktmöglichkeit – zuerst ergänzen“, §2.2) – 02 §8.
3. Doppelgänger-Hinweis beim Verlassen des E-Mail-Felds statt nach dem Speichern (§2.3) – Fehlervermeidung vor dem Fehler.
4. Kalender: Slot-Prüfung beim Drag, Rücksprung 200 ms + Toast mit Grund, Mail erst nach Undo-Ablauf (§2.7) – nur Dauer 8/10 s angleichen.
5. Schnell-Triage A-CRM1 mit Zähler „3 von 7“ und Endzustand (§4.6) – mit sichtbarem Startknopf (§2.2).
6. Portal-Token einmal sichtbar, nie in URL/Log/Speicher (§4.3, Q12).
7. Widerspruch sperrt Marketing in „Neu ▾“, Composer verlangt „vertragsbezogen“ (§3.4, Q11).
8. Fehler je Kachel/Tab isoliert, Rest bleibt (§2.1, §3.4, Q17).
9. Kennzahl ohne Daten „–“, kein erfundener Vorperioden-Vergleich (§5.1, Q15).
10. Offline-Entwurf des Protokolls in IndexedDB mit `modified`-Prüfung (§7) – mit P13 vollständig.
11. Datenmapping §9 und Lückenliste §12 – Grundlage für ehrliche Abnahme.

---

## 4. Widersprüche in den Leitlinien, die CRM erbt (an Fundament/UX-Lead)

| Thema | 01 | 02 | 03 | 04 | 05 | CRM nutzt | Vorschlag (wie Service-/Shop-Kritik) |
|---|---|---|---|---|---|---|---|
| Undo-Dauer | 6 s | 8 s | 8 s | 5 s | – | 5 s / 8 s | 8 s; Mails 10 s |
| Undo-Technik | – | sofort + Gegenaktion | – | verzögerter Commit (A), B nur mit Gegenaktion | – | A | A, mit Warteschlange je Datensatz (P8) in 04 §3.6 ergänzen |
| Undo-Taste | – | ⌘Z | – | `Z` | – | `Z` | beide: `Z` außerhalb Felder, ⌘Z überall |
| Leertaste in Listen | Peek (D10) | auswählen | auswählen | – | – | Peek | Leertaste = Vorschau, `x` = auswählen |
| Shift+Klick | – | Bereich wählen | Bereich wählen | – | – | Peek | Bereich wählen |
| Paging | – | `←/→` | `Alt+←/→` | – | – | `Alt+←/→` | `←/→` (Alt = Browser-Zurück) |
| G-Akkorde | `G S` Service, `G K` Kassa, 800 ms | `G S` Service, 1,5 s | – | – | `g s` Shop, `g v` Service, `g k` Kundenkarte | `g c` + eigene `g a/t/p` | 05 gilt; Fenster 1,5 s; keine bereichseigenen Akkorde |
| Tab-Kürzel | – | `Alt+1…9` | – | – | `1–9` | gemischt | `Alt+1…9` |
| Max. Tabs | – | 7 + Mehr (Unternavigation) | > 6 → `⋯` | – | Kundenakte 12 | 12 | Akte ≤ 6 inkl. „Mehr“ |
| Kennzahlen Bereichsstart | – | max. 6 | max. 8 | – | 8 Cards | 8–10 | 4 je Rolle (P3) |
| Zeilenhöhe | – | 40 / 52 | 36 / 44 | – | – | – | 03 |
| Hochzählen | – | verboten | – | erlaubt nach Änderung, 400 ms | – | 400 ms | 04 (nur nach Änderung) |
| Animationsfenster | – | ≤ 200 ms, `cubic-bezier(.2,.8,.2,1)` | Dialog 240 ms | 120–240 ms, `--bo-ease-out (0.22,1,0.36,1)` | – | gemischt | 04 ist Quelle; 02 §0.10/§13 auf 04 verweisen |
| Toast-Position | unten links | unten Mitte | unten rechts | unten rechts | unten rechts | – | unten rechts |
| Wischgesten | – | links Zuweisen, rechts Erledigt | – | – | – | links Primär, rechts Wiedervorlage | rechts Primär, links Mehr (P15) |
| Telefon < 640 im Backoffice | – | nur lesen | Karten-Liste | – | – | anlegen/protokollieren | Ausnahme für CRM-Berater in 02 eintragen |
| Status Bestätigt/Erledigt (Termin) | – | – | beide grün | – | – | – | Bestätigt türkis (P10) |

---

## 5. Abnahme-Ergänzungen für §10 (nach Umsetzung der Pflichtänderungen)

| # | Kriterium | Prüfung |
|---|---|---|
| Q25 | Termin storniert/abgelehnt/nicht erschienen → Anfrage zeigt „Termin entfallen“ + Primär „Neuen Termin anlegen“; keine Anfrage bleibt sichtbar „Termin vereinbart“ ohne aktiven Termin | E2E Mock |
| Q26 | Wiedervorlage setzen legt genau eine offene Aufgabe an bzw. verschiebt sie; Erinnerung erscheint am Fälligkeitstag in Heute-Zeile und Glocke | E2E + Staging (07:00-Lauf) |
| Q27 | `/crm` zeigt je Rolle ≤ 4 Kennzahlen, keine Charts, jede Zahl genau einmal | Snapshot je Rolle |
| Q28 | Kundenakte ≤ 6 Tabs, Kopf ≤ 2 Zeilen + ≤ 1 Band, Details-Panel < 1280 px als Sheet | Visueller Test 1024/1280/1440 |
| Q29 | Klickzahlen §2.1 Spalte „nach Pflichtänderungen“ erreicht; Suche-Wege separat | E2E zählt |
| Q30 | A1 aus Anfrage: Kunde + Art vorbelegt, Termin in ≤ 2 Interaktionen im Dialog (Slot, Anlegen); Mail-Haken verhält sich aus Anfrage und Kalender gleich | E2E |
| Q31 | Kanban Termine: Drop auf Erledigt/Nicht erschienen löst keinen Serveraufruf aus; Kanban Anfragen: Drop auf „Termin vereinbart“ öffnet A1, Abbrechen ändert nichts | E2E |
| Q32 | Annehmen, dann innerhalb 8 s „Termin anlegen“: kein Workflow-Fehler, Reihenfolge der Serveraufrufe Annehmen → Termin | E2E mit Netz-Mitschnitt |
| Q33 | Keine Zeilenaktion ist nur per Hover erreichbar; iPad-Simulation (`pointer: coarse`) zeigt Zeilenaktion und Kontakt-Knöpfe | E2E Touch-Projekt |
| Q34 | Alle Status-Badges nutzen Töne aus 03 §1.5 (Ausnahme Termin Bestätigt nach Freigabe); kein `accent`-Token an Status | Unit auf Ton-Tabelle |
| Q35 | Kein Bereichskürzel überschreibt ein globales (Liste §2.2); `Alt+←/→` ohne Wirkung in der App; Einzeltasten abschaltbar | Unit Kürzel-Registry + E2E |
| Q36 | Protokoll-Speicheranzeige durchläuft alle 5 Zustände (Mock-Fehlerinjektion), Verlassen bei ungespeicherten Änderungen fragt nach | E2E + iPad manuell |
| Q37 | Kundenansicht blendet Seitenleiste, Glocke, Badges, Intern, Verlauf, Status aus; Toasts anderer Datensätze erscheinen erst nach Verlassen | E2E |
| Q38 | Alle 23 Leerzustände aus §2.4 vorhanden; Erstbesuchs-Band je Seite einmal, „Verstanden“ merkt sich | Snapshot |
| Q39 | Zusammenführen ist ohne Servermethode nicht angeboten; mit Methode entweder vollständig oder „Nichts geändert“ | Staging |
| Q40 | Keine Emoji in der Oberfläche; Icons lucide mit Textlabel oder `aria-label` + Tooltip | Lint-Regel auf JSX-Texte |
| Q41 | Countdown und Zähler sind nicht `aria-live`; Screenreader hört Reservierung nur bei 5 min, 1 min, abgelaufen | VoiceOver iPad |
| Q42 | Kalender-Ereignisse ≥ 24 px hoch (kompakt) bzw. ≥ 44 px (iPad); Status-Wort sichtbar auf der Karte | Visueller Test + axe |
