# 20 – UX-/UI-Kritik Bereich „Shop“ (Runde 2, zu `10-konzept-shop.md` Fassung 2)

**Zweck:** Strenge Prüfung der überarbeiteten Fassung 2 des Shop-Konzepts gegen Nielsen-Heuristiken, WCAG 2.2 AA, Mobile/Kiosk-Regeln und die Leitlinien 01–05. Ergebnis: Note, Nachprüfung der Pflichtänderungen aus Runde 1 (P1–P22), neue Pflichtänderungen (N1–N20), Empfehlungen, Widersprüche in den Leitlinien, Abnahme-Ergänzungen.
**Stand:** 2026-11-04 · Rolle: UX-/UI-Kritiker · Geprüft: `10-konzept-shop.md` Fassung 2 (§1–§14 vollständig), `02-ux-leitlinien.md` (§6, §9, §10, §11), `04-motion.md` (§3.6), `05-informationsarchitektur.md` (T5, Kiosk-Routen, Druck), `03-design-system.md` (Bewegung, Zoom). Gegengeprüft im Code: `Backend-Import/ph_shop/ph_shop/fixtures/workflow.json`, `ph_bestellung.py` (`abholbereit_melden`, `abgeholt_melden`).
**Status:** Prüfbericht, keine Entscheidung des Inhabers. Ersetzt Runde 1 (Fassung-1-Kritik); deren Nummern P1–P22 bleiben in §1 als Nachweis stehen.

---

## 0. Urteil

**Note: 7,5 / 10** (Runde 1: 6,5).

Deutlich besser: Kürzel ohne Kollision mit den globalen Einzelbuchstaben, ein Undo-Wert für den ganzen Bereich (8 s, verzögerter Commit), Kanban ohne Rückfrage-Dialoge, 6 Pills + „Mehr“, 5 Akte-Tabs, eine Filterzeile in Bestellungen, S1 in zwei Klicks mit Betrag im Knopf, S5 als ein Dialog, Sammel-Storno S8, Glossar, Erstbesuchs-Sätze je Seite, Code-Tastenfeld am Packtisch, Code-Fehler (`normalisiere_abhol`, `zahlung_erfassen`) offen benannt und in der UI abgefangen.

Was noch fehlt, liegt eine Ebene tiefer: **Der verzögerte Commit ist nur als Toast gedacht, nicht als Zustand** (was zeigen Liste, Akte, Kanban während der 8 s; was passiert bei Fehler nach dem Ablauf; was bei Esc oder viertem Toast). **Zwei Primäraktionen können Geld oder Kundentermine falsch bewegen** (`zahlung_ausstehend` → „Zahlung erfassen“; `abholbereit_melden` überschreibt die vereinbarte Reservierungsfrist). **Die Undo-Regel wird im eigenen Dokument nicht durchgehalten** (Rechnung, Retoure, Ware erhalten „sofort“). **Die Vereinfachungen aus der Bestellliste sind nicht auf Zahlungen, Gutscheine und Widerrufe übertragen.** S5 hält mit der Standardwahl „Kassa“ sein eigenes Versprechen (ausstellen **und drucken** in 3 Klicks) nicht.

---

## 1. Nachprüfung Runde 1 (P1–P22)

| Nr. | Stand in Fassung 2 | Rest |
|---|---|---|
| P1 / P2 Kürzel `a`, `z` | erledigt (§2.4) | QA §11.5 prüft noch „`k` öffnet Kundenakte“, §2.4 sagt `Shift+K` → N12 |
| P3 F-Taste Packtisch | erledigt | Wirkung von „An Kassa übergeben“ existiert nicht → N15 |
| P4 Übergeben/Abschließen | erledigt (8 s verzögert) | Zustand während der 8 s fehlt → N1 |
| P5 / P6 Kanban ohne Dialog | erledigt | Toast-Stapel > 3 und Esc nicht geregelt → N2, N3 |
| P7 Neue Reservierung | erledigt | Frist wird später überschrieben, E-Mail-Pflicht ohne Ausweg, kein Bestand → N5, N9 |
| P8 Unternavigation | erledigt | – |
| P9 Akte 5 Tabs | erledigt für Bestellung | Widerrufsakte hat weiter Tab „Mails“, bedingte Tabs in Zahlung/Anzahlung → N11 |
| P10 eine Filterzeile | erledigt für Bestellungen | Zahlungen (7 Reiter + 5 Filter, Reiter = Kanal-Filter), Gutscheine (Tabs + Reiter + Filter) unverändert → N10 |
| P11 Gutschein ein Dialog | teilweise | Standard „Kassa“ liefert keinen Code im Dialog; `ausstellen` nicht whitelisted → N7 |
| P12 S1 ohne Vorschau | erledigt | – |
| P13 Sammel-Storno | erledigt | – |
| P14 Klickzahlen | teilweise | S5 (Kassa-Weg), Widerruf (Toast als einziger Weg), Freigabe in der Akte nicht gezählt → N7, E2.1 |
| P15 Jargon | teilweise | „Refund über Stripe“, „Stripe-Refund-ID“ (S4), „Zahlungsstreit zu PI …“ (§9.1), „(Scheduler)“ im Verlauf, Statuswerte ohne Umlaute → N13 |
| P16 Packtisch ohne Timer | erledigt | – |
| P17 Erstattung nicht rot | erledigt | `storniert`/`widerrufen` sind weiter rot → N14 |
| P18 Donut | erledigt | – |
| P19 Abholfrist inline | erledigt | gleiche Folgewirkung bei Positionen in `reserviert` ungeregelt → N5 |
| P20 Leerzustände | weitgehend | Retourenakte-Tabs, Gutscheinakte „Käufer & Kauf“/„Gestaltung“, Anzahlungen gefiltert leer, Auszahlungs-Akte ohne Zeilen fehlen → N18 |
| P21 Widerrufe-Kanban Tastatur | erledigt | `←/→` (02 §9.3 „Verschieben“) auf einem Board ohne Verschieben nicht definiert → N12 |
| P22 verbotener Zug | erledigt | – |

---

## 2. Neue Pflichtänderungen (vor Umsetzung, nach Wirkung sortiert)

### N1 – Verzögerter Commit als sichtbarer Zustand, nicht nur als Toast
**Befund:** §3 „Undo-Regel“ beschreibt Toast und Zeitpunkt des Methodenaufrufs. Offen: Was zeigt die **Liste**, wenn in der Akte „Packen“ läuft? Was zeigt die **Akte**, wenn im Kanban gezogen wurde? Was passiert, wenn die Methode **nach** Ablauf fehlschlägt und die Mitarbeiterin längst in einer anderen Akte ist (Fehler-Toast ohne Zusammenhang, verschwindet)? Bei `pagehide` wird per `sendBeacon` committet (04 §3.6) – das Ergebnis erfährt niemand.
**Verstoß:** Nielsen 1 (Sichtbarkeit des Systemstatus), 02 §7.2, WCAG 4.1.3.
**Änderung:**
- Ein Client-Speicher `ausstehend[]` (je Dokument: Aktion, Startzeit, Toast-ID) im Fundament; jede Sicht liest ihn.
- Zeile/Karte/Akte-Kopf eines ausstehenden Dokuments: Status-Badge zeigt den Zielstatus mit Ring-Spinner 12 px und Untertext „wird gepackt … · Rückgängig“ (Link, gleiche Wirkung wie Toast). Primäraktion dieses Dokuments deaktiviert mit Grund „Läuft noch (5 s)“.
- Fehler nach Ablauf: Toast `danger` **ohne** Zeitablauf (bleibt bis Schließen) mit Dokumentnummer im Text („Packen PH-S-261104-0012 fehlgeschlagen: …“ · „Öffnen“) **und** Eintrag in der Glocke „Für mich“. Live-Region `assertive` (Verlustgefahr, 02 §10 4.1.3).
- Commit über `sendBeacon`: Ergebnis wird beim nächsten Laden als Glocken-Eintrag nachgereicht („2 Aktionen beim Verlassen ausgeführt – 1 Fehler“).

```
│ ☐ │ PH-S-261104-0012 │ Fam. Huber │ 369,00 € │ (◌) Versandbereit        │ wird gepackt … Rückgängig │
│   │                  │            │          │  Ring 12 px, Ton türkis  │ Zeilenknopf deaktiviert   │
```

### N2 – Esc darf keinen ausstehenden Commit auslösen
**Befund:** 04 §3.6: „`Esc` schließt den jüngsten Toast (Commit läuft dann sofort)“. In der Liste heißt `Esc` „Auswahl aufheben“ (02 §9.2), während einer Massenaktion „abbrechen nach dem aktuellen Dokument“ (§3.2). Typischer Ablauf: Auswahl 5 → „Packen“ → Toast läuft → Mitarbeiterin drückt Esc, um die Auswahl zu lösen → **alle 5 Lieferscheine werden sofort erzeugt**, das Undo-Fenster ist weg.
**Verstoß:** Nielsen 5 (Fehlervermeidung), Nielsen 4 (eine Taste, drei Bedeutungen).
**Änderung:** Im Shop schließt `Esc` nie einen Undo-Toast. Reihenfolge der Esc-Bedeutung festschreiben: offenes Menü/Popover → Dialog → Inline-Edit → Auswahl. Toast nur per Klick auf „×“ (Commit sofort, Text „Jetzt ausführen“ statt „×“) oder Ablauf. Nach dem Start einer Massenaktion wird die Auswahl automatisch aufgehoben (dann gibt es nichts mehr per Esc zu lösen). An Fundament/04 melden (§5).

### N3 – Vierter Toast darf keinen Undo verschlucken
**Befund:** 04 §3.6: max. 3 Toasts, „älteste fallen ohne Animation weg“. Im Kanban sind vier Züge in 8 s realistisch (Morgenroutine „Zu packen“). Was mit dem verdrängten ausstehenden Commit geschieht, ist undefiniert.
**Änderung:** Undo-Toasts werden zusammengefasst statt verdrängt: ab dem zweiten gleichartigen Toast ein Sammeltoast „3 Bestellungen werden gepackt · Rückgängig (alle) · Einzeln ▾“ (Aufklapp-Liste mit Undo je Dokument). Balken startet bei jedem Zugang neu (8000 ms). Verdrängt werden dürfen nur Toasts ohne ausstehenden Commit.

### N4 – Primäraktion „Zahlung erfassen“ bei Online-Bestellungen entfernen
**Befund:** §4.1 Tabelle: `offen/zahlung_ausstehend · beide → Primär „Zahlung erfassen (S1)“`. `zahlung_ausstehend` heißt laut §2.2 „Stripe meldet Zahlung angekündigt (z. B. Lastschrift) – unterwegs“. Bucht die Mitarbeiterin hier bar/Überweisung, kommt danach die Stripe-Zahlung zusätzlich → Doppelzahlung, Erstattung nötig. Bei `offen` (Website-Checkout nicht abgeschlossen) gilt dasselbe. §5.1 beschränkt den Nächsten Schritt korrekt auf `zahlung=vorort` – die Akte nicht.
**Verstoß:** Nielsen 5, 01 E3 (Geld nur mit klarer Folge), interne Inkonsistenz §4.1 ↔ §5.1.
**Änderung:**
| Status · Zahlung | Primär | Sekundär |
|---|---|---|
| `offen` · Stripe | – (Band „Kunde hat den Bezahlvorgang nicht abgeschlossen · läuft ab {Zeit}“) | „Zahlungslink erneut senden“ (Lücke §10, falls nicht vorhanden: ausblenden), Stornieren (Leitung) |
| `zahlung_ausstehend` · Stripe | – (Band türkis „Stripe-Zahlung unterwegs – keine Zahlung erfassen“) | Stripe öffnen |
| `offen` · `vorort` | Zahlung erfassen (S1) | Gutschein einlösen |
„Zahlung erfassen“ bleibt für Stripe-Bestellungen nur im `⋯` (Leitung) mit Hinweis im Dialog „Stripe-Zahlung angekündigt über 369,00 € – doppelte Buchung möglich“. Parametrisierter Test §11.5 um `zahlung` erweitern (17 Status × 2 Zahlungswege).

### N5 – Folgewirkungen beim Kunden: Reservierungsfrist und Positionen
**Befund A (Code):** `abholbereit_melden()` setzt **immer** `abholung_bis = heute + abholung_frist_tage` (`ph_bestellung.py` Z. 222). Eine im Dialog „Neue Reservierung“ vereinbarte Frist („Reserviert bis 25.11.“, bis +30 Tage erlaubt) wird beim Primärschritt „Abholbereit melden“ still auf heute + 7 gesetzt – der Kunde erhält per Mail ein anderes Datum als im Showroom zugesagt. Gleiches bei „Erneut senden und Frist verlängern“ (kann die Frist auch **verkürzen**).
**Befund B:** Positionen sind in `reserviert` bearbeitbar (§4.1), die Reservierungsbestätigung ist aber schon beim Kunden (`after_insert`). Mengen-/Preisänderung ohne Hinweis = gleicher Fall wie P19.
**Verstoß:** Nielsen 1, 02 §1.2 („Kunde informieren?“), 02 §4.1.
**Änderung:**
- Toast beim Abholbereit-Commit nennt **alte und neue** Frist, wenn sie sich ändert: „Abholcode an h…@… · Frist **11.11.** (vereinbart war 25.11.) · Rückgängig (Z)“, Ton `warning`. Wird die Frist kürzer, ist die Aktion kein Undo-Toast, sondern Dialog „Frist verkürzt sich von 25.11. auf 11.11.“ mit „Trotzdem melden“ / „Abbrechen“ – bis ph_shop die Frist erhält (§13 ergänzen: `abholbereit_melden(frist_behalten=True)`).
- Positionen in `reserviert`: nach Speichern Toast „Reservierung geändert · Kunde ist nicht informiert“ + „Bestätigung erneut senden“ (gleiche Mechanik wie Abholfrist §3.2); Hinweis in der Akte bis zur Mail.

### N6 – Massenaktion „Abholbereit melden“ ohne `pruefen`
**Befund:** §3.2 erlaubt die Massenaktion für `bezahlt|reserviert|pruefen & abholung`. Die Server-Methode lässt `pruefen` zu, der Workflow (`workflow.json`) nicht; die Fehlermeldung im Code sagt selbst „nur aus bezahlt oder reserviert“. Damit sendet eine Mitarbeiterin per Sammelaktion einen Abholcode für eine Bestellung, deren Betrag nicht stimmt und die nur die Leitung klären darf.
**Verstoß:** Nielsen 5, Rechte-Modell (Prüfen = Leitung, §1.2).
**Änderung:** Massenaktion und Zeilenknopf nur `bezahlt|reserviert & abholung`; `pruefen` in der Vorschau „übersprungen (zuerst prüfen – Leitung)“. Anfrage an ph_shop: `pruefen` aus der Statusliste der Methode streichen (§13).

### N7 – S5: Standardweg muss das Versprechen „ausstellen und drucken“ halten
**Befund:** Top-Aufgabe §1.1 „Gutschein im Showroom ausstellen und drucken · 3“. Die vorgewählte Option „Kassa (empfohlen)“ stellt laut S5 erst **nach Bezahlung an der Kassa** aus – im Backoffice-Dialog gibt es dann keinen Code und nichts zu drucken; die Übergabe an die Kassa existiert in ph_kassa nicht (§10). Zusätzlich ist `ausstellen` nicht whitelisted – S5 ist in keiner Variante heute baubar, das Konzept beschreibt aber keinen Ersatzzustand.
**Verstoß:** Nielsen 2/4 (Erwartung ≠ Ergebnis), 02 §1 (Klickzahl als Abnahmemaß).
**Änderung:**
- Segment-Standard nach Kontext: im Backoffice „hier kassieren“ (Kanal + Referenz sichtbar, Knopf „100,00 € kassieren und ausstellen“), Option „an der Kassa kassieren“ nur, wenn die Kassa-Übergabe gebaut ist; bis dahin ausgeblendet. Klickzahl dann: Neuer Gutschein (1) → Kanal „Bar“ (2) → „100,00 € kassieren und ausstellen“ (3) → Drucken `p` (4). §1.1 auf 4 korrigieren oder Kanal-Standard „Bar“ vorbelegen (dann 3).
- Solange `ausstellen` fehlt: Knopf „Neuer Gutschein“ deaktiviert mit sichtbarem Satz „Gutscheine im Showroom bitte an der Kassa verkaufen – Ausstellung im Backoffice folgt.“ (kein Klick ins Leere). Gilt sinngemäß für alle ✘-Funktionen → N19.

### N8 – Freigabe-Zwei-Klick-Knopf gegen Doppelklick sichern
**Befund:** „Freigeben“ wird nach dem ersten Klick 5 s lang zu „1.450,00 € freigeben – bestätigen“ (§1.3, §4.2). Ein Doppelklick (zwei Klicks < 300 ms, an Maus und Touchpad häufig) löst beide Stufen aus – die Sicherung ist wirkungslos. 5 s sind für Bedienung mit Hilfsmitteln knapp (WCAG 2.2.1; Ablauf verwirft nur, daher kein Datenverlust, aber Frust).
**Verstoß:** Nielsen 5, WCAG 2.2.1, 02 §6.2 (geldwirksam → Bestätigung; der Zwei-Klick ist eine Abweichung und muss in 02 aufgenommen werden).
**Änderung:** Zweite Stufe nimmt Klicks erst nach **600 ms** an (Knopf zeigt in dieser Zeit `opacity .6`, `aria-disabled`); Bestätigungsfenster **10 s** und pausiert bei Hover/Fokus; Fokus bleibt auf dem Knopf; Text der zweiten Stufe ändert die Breite nicht (Knopfbreite = Breite des längeren Texts, kein Sprung unter dem Zeiger). Live-Region: „Zum Bestätigen erneut drücken. Esc bricht ab.“ Abnahme §11.21 um Doppelklick-Test ergänzen.

```
[ Freigeben ]  →  (0–600 ms)  [ 1.450,00 € freigeben – bestätigen ]  gedimmt
               →  (600 ms–10 s) [ 1.450,00 € freigeben – bestätigen ]  aktiv, Ring Sand 2 px
               →  Ablauf/Esc    [ Freigeben ]  Crossfade 120 ms
```

### N9 – Neue Reservierung: Sackgassen und Bestand
**Befund:** (a) Ohne E-Mail ist keine Reservierung möglich – im Showroom reservieren auch Kunden ohne E-Mail (ältere Stammkunden, Telefonkunden); das Konzept nennt nur den Feldfehler, keinen Weg. (b) Die Bestätigung geht **sofort** an die eingetippte Adresse – ein Tippfehler (`gmial.com`) schickt Kundendaten an Dritte, ohne Undo (Widerspruch zur eigenen Undo-Regel „Bestätigung senden = 8 s“). (c) Produktsuche zeigt Preis und Bild, aber **keinen Bestand/Lagerort** – reserviert wird, was nicht da ist. (d) „Freie Position? (Leitung)“ und „Preis auf Anfrage“ sind für Mitarbeiter Sackgassen.
**Verstoß:** Nielsen 3/5/9, 02 §7.2 (Fehler mit Ausweg).
**Änderung:**
- (a) Feldfehler mit Ausweg: „Ohne E-Mail: Reservierung als Aufgabe an die Shop-Leitung“ (Knopf, legt PH Aufgabe mit allen Eingaben an) + Inhaber-Frage in §13 („Reservierung ohne E-Mail mit Abholschein auf Papier?“).
- (b) Tippfehler-Prüfung clientseitig (häufige Domain-Verdreher, fehlende TLD) als `warning` unter dem Feld „Meinten Sie gmail.com?“ [Übernehmen]; E-Mail-Adresse im Fuß fett und mit „ändern“-Link; Anfrage ph_shop: Bestätigung 10 s verzögert senden (wie 02 §6.1 Termin).
- (c) Treffer zeigen „Lager 2 · Showroom 1“ bzw. „nicht lagernd – Lieferzeit 3 Wochen“ (Quelle ph_logistik/ph_sortiment; falls nicht lesbar: Lücke §10). Nicht lagernd = übernehmbar mit `warning`-Hinweis in der Position.
- (d) Statt „(Leitung)“-Text: Knopf „Leitung fragen“ (Aufgabe mit Produkt und Kunde), Dialog bleibt offen.

### N10 – Filterlogik aus Bestellungen auf alle Listen übertragen
**Befund:** P10 gilt nur für Bestellungen. Zahlungen: 7 Reiter (davon „Stripe“, „Bar/Karte“ = Kanal-Filter, „Heute“ = Zeitraum-Filter) **plus** Kanal- und Zeitraum-Filter – Überlappung wie in Fassung 1. Gutscheine: Tabs + 6 Reiter („Test“ als Reiter, anderswo Chip „Testdaten anzeigen“) + Filterzeile = drei Ebenen. Zahlungsliste mit 9 Standardspalten + Checkbox, keine Spaltenregel.
**Verstoß:** 01 C2, Nielsen 4/8, 03 §8.7.
**Änderung:**
- Zahlungen: Reiter = Arbeitsansichten **Alle · Erstattungen · Freigabe nötig · Ohne Auszahlung · +**; Kanal/Zeitraum nur als Filter. Standardspalten 7: Nummer · Zeitpunkt · Art+Kanal (zweizeilig) · Bezug · Betrag · Status · Auszahlung; Gebühr wählbar.
- Gutscheine: Tabs bleiben (zwei verschiedene Objekte), Reiter auf **Alle · Offen · Läuft ab · +**; Status, Ausgabe, Zeitraum als Filter; Test einheitlich als Chip „Testdaten anzeigen“ (§2.3).
- Regel in §3 festschreiben: „Reiter = gespeicherte Ansicht, nie Duplikat eines Filters; max. 5 + ‚+‘.“

### N11 – Akte-Tabs stabil und gleich gebaut
**Befund:** Zahlungsakte Tab „Freigabe (nur wenn angefordert)“, Anzahlungsakte Tab „Doppelt (nur sichtbar, wenn …)“ – Tabs erscheinen/verschwinden, `Alt+n` zeigt je Dokument auf anderen Inhalt. Widerrufsakte behält Tab „Mails“, die Bestellungsakte hat ihn in den Verlauf verschoben (P9). Gutscheinakte hat „Gestaltung“ als eigenen Tab für 3 Felder.
**Verstoß:** Nielsen 4, 03 §8.10, WCAG 3.2.3 (konsistente Navigation).
**Änderung:** Bedingte Inhalte werden **Band im Kopf** mit Aktion (Freigabe: Band mit Betrag/Grund und Zwei-Klick-Knopf nach N8; Doppelt: Band `danger-soft` „2 doppelte Zahlungen · 89,00 €“ + „Doppelte erstatten“), nicht Tab. Widerrufsakte: Tabs **Erklärung · Zuordnung · Abwicklung · Verlauf** (Mails als Chip im Verlauf wie Bestellung). Gutscheinakte: „Gestaltung“ in „Käufer & Kauf“ (Abschnitt). Regel: Tab-Menge je Akte-Typ fix.

### N12 – Kürzel: Restwidersprüche und WCAG 2.1.4
**Befund:**
- `p` = Druckpanel (§2.4, „globale Bedeutung“) – 02 §9.1 sagt `⌘P/Strg+P`, 05 T5 sagt `p`. Shop zitiert eine nicht entschiedene Regel als global.
- QA §11.5 „`k` öffnet Kundenakte“ ↔ §2.4 `Shift+K`; 05 (Regel „Kundenakte ↔ Mappe“) nennt `k` (Kunde) in Mappen. Andere Bereiche werden `k` nehmen → der Shop wird zur Ausnahme.
- 02 §9.2 `S` = Status-Popover, `E` = Bearbeiten. Shop hat „kein Inline-Status“ – was tut `s` in der Shop-Liste? Was tut `e` in einer Übersicht aus Lesekarten?
- Widerrufe-Kanban: 02 §9.3 `←/→` = Verschieben-Menü; das Board verschiebt nicht.
- WCAG 2.1.4 (Stufe A): Einzelzeichen-Kürzel (`z`, `n`, `p`, `.`, `1–9`, auch `Shift+Buchstabe`, das ein druckbares Zeichen erzeugt) brauchen eine Möglichkeit zum Abschalten oder Umbelegen. Weder 02 §10 noch der Shop sehen das vor (Spracheingabe-Nutzer lösen sonst Aktionen aus).
**Änderung:** `k` statt `Shift+K` (wie 05; `k` als „nächste Zeile“ gilt nur in Listen, die Kundenakte-Taste nur in Akten – Fokus-Kontext trennt); `p` erst nach Fundament-Entscheidung, bis dahin `⌘/Strg+P` (02). In Shop-Listen: `s` öffnet Menü „Nächster Schritt“ mit den erlaubten Methoden der Zeile (gleiche Undo-Regel), `e` in der Akte springt in den ersten bearbeitbaren Tab. Widerrufe-Kanban: `←/→` wechselt nur den Fokus zwischen Spalten. Benutzereinstellung „Einzeltasten-Kürzel aus“ (Fundament, alle Bereiche; dann wirken nur Kürzel mit `⌘/Strg`).

### N13 – Texte: Glossar konsequent, Statuswerte mit Anzeigenamen
**Befund:** Gegen das eigene Glossar §2.5: S4 „Refund über Stripe“, „Stripe-Refund-ID“; §9.1 Glocke „Zahlungsstreit zu PI … – Stripe-Dashboard“; Verlaufszeile „ohne Zahlung nach 24 h (Scheduler)“. Statuslisten §2.2 für Widerruf, Retoure, Gutschein, Zahlung nennen Rohwerte ohne Umlaute („Bestaetigt“, „Teilweise eingeloest“, „Geprueft“, „Angekuendigt“) und keine Anzeige-Spalte – Umsetzung zeigt sie so.
**Änderung:** S4 „Erstattung über Stripe“, „Stripe-Erstattung (ID mono)“; Glocke „Zahlungsstreit zu Bestellung PH-S-… – im Stripe-Dashboard öffnen“; Verlauf „Automatisch abgelaufen – keine Zahlung nach 24 h“. §2.2 je DocType eine Spalte „Anzeige“ (Bestätigt, Teilweise eingelöst, Geprüft, Angekündigt, Label gesendet …); QA §11.17 grep um „Refund“, „Scheduler“, `ae|oe|ue` in Badge-Texten erweitern.

### N14 – Rot nur bei Problemen: Storno und Widerruf grau
**Befund:** `storniert`, `widerrufen` (Bestellung), `Storniert` (Zahlung) sind rot. Ein auf Kundenwunsch stornierter Auftrag ist ein normaler Endzustand; rote Badges in jeder dritten Zeile der „Alle“-Ansicht stumpfen die Warnfarbe für `pruefen`/`fehlgeschlagen` ab (gleiche Begründung wie P17).
**Verstoß:** 02 §0.10, 03 §1.5.
**Änderung:** `storniert`, `widerrufen`, `erstattet`, `abgelaufen` → grau mit Icon (`circle-slash` / `undo-2` / `clock`); rot bleibt `fehlgeschlagen`, `checkout_fehler`, `pruefen`, Widerruf/Retoure `Abgelehnt`, Zahlung `Fehlgeschlagen`.

### N15 – Packtisch: Knopf ohne Wirkung umbenennen, Suche ohne Code
**Befund:** (a) „An Kassa übergeben“ hat heute keine Wirkung (ph_kassa fehlt die Liste); der Knopf verspricht eine Übergabe, zeigt aber nur eine Nummer. (b) Kein Treffer → „Bestellnummer oder Name an der Kassa suchen“: der Kunde wird wegen eines vergessenen Codes an eine andere Station geschickt.
**Verstoß:** Nielsen 2 (Sprache = Wirkung), Nielsen 9 (Ausweg am Ort).
**Änderung:** (a) Bis ph_kassa liefert: Knopf „Kunde zur Kassa schicken“ → Karte „Bitte an der Kassa bezahlen · Bestellnummer **PH-S-261103-0009**“ (mono 32 px, Kopieren unnötig) + „Fertig“; erst mit ph_kassa-Liste heißt er „An Kassa übergeben“. (b) Unter dem Tastenfeld Sekundärknopf „Ohne Code suchen“ → Suche Name/Bestellnummer (Bildschirmtastatur, 56 px Zeilen), Treffer zeigt Hinweis „Ausweis prüfen – kein Abholcode“ und verlangt vor „Übergeben“ den Tipp „Ausweis geprüft“ (Kästchen 48 px). Verlaufseintrag „Übergabe ohne Code“.

### N16 – Undo-Regel im eigenen Dokument durchhalten
**Befund:** §3 „Undo-Regel“: verzögerter Commit für jede Aktion, die „einen Beleg erzeugt“. §5.2 widerspricht: „Rechnung erstellen – sofort“, „Retoure anlegen – sofort“, „Widerruf erfassen – Dialog“, „Ware erhalten – sofort“ (startet die Rückzahlungsfrist), „Zurück auf Offen – sofort, Undo nicht“. Rechnung ist laut 02 §6.2 sogar Bestätigungspflicht (Nummer wird vergeben, nicht löschbar).
**Änderung:**
| Aktion | Neu |
|---|---|
| Rechnung erstellen | Bestätigung nach 02 §6.2: „Rechnung über 369,00 € an Fam. Huber stellen? Nummer wird vergeben.“ · „Stellen“; solange der Hook in ph_faktura fehlt: Knopf deaktiviert, Grund sichtbar (N19), nicht „Fehlertext der Methode“ |
| Retoure anlegen, Ware erhalten, Retoure eingegangen | verzögerter Commit 8 s |
| Zurück auf Offen | verzögerter Commit 8 s (Workflow-Aktion erst nach Ablauf) |
| Widerruf erfassen | bleibt Dialog (Pflichttext), danach Undo 8 s vor Anlage |
Die Tabelle §5.2 bekommt die Spalte „Undo / Bestätigung / sofort“ mit genau einem Wert je Zeile und einer Begründung für jedes „sofort“ (nur lesende oder idempotente Aktionen).

### N17 – Gutschein-Einlösung: eine Bestätigung, ein Korrekturweg
**Befund:** In der Gutscheinakte: Dialog „Einlösen“ **plus** Rückfrage „62,50 € einlösen – Rest danach 0,00 €?“ (zwei Bestätigungen). In der Bestellung (S2): keine Rückfrage. Gleiches Geld, zwei Muster. Fehlbuchung ist nicht korrigierbar (`storniere_einloesung` nicht whitelisted) und die UI nennt keinen Weg.
**Verstoß:** Nielsen 4, Nielsen 9, 01 E2.
**Änderung:** Ein Dialog wie S1: Live-Satz „Löst 62,50 € ein · Rest danach 0,00 € · gebucht und gesperrt“, Primärknopf „62,50 € einlösen“, keine zweite Rückfrage – in Akte, Bestellung und Kassa gleich. Einlösungszeile im Tab „Einlösungen“ mit `⋯` „Fehlbuchung melden“ (PH Aufgabe an Leitung mit Betrag/Beleg), bis `storniere_einloesung` whitelisted ist.

### N18 – Restliche Leerzustände
**Fehlen:** Retourenakte Tab „Positionen“ ohne Positionen („Keine Positionen – Retoure aus Widerruf ohne Artikelangabe. Positionen aus Bestellung übernehmen“ [Übernehmen]); Gutscheinakte „Käufer & Kauf“ ohne Käufer („Kein Käufer erfasst – Showroom-Ausgabe ohne Namen.“); Anzahlungen gefiltert leer + Reiter; Auszahlungs-Akte ohne `zahlungen[]` („Noch keine Zeilen – ‚Abgleichen‘ lädt sie von Stripe.“ [Abgleichen]); Berichte ohne Daten im Zeitraum („Keine Live-Bestellungen zwischen 01.10. und 31.10.“ + Zeitraum-Chips); Glocke Freigabe leer (GF: „Keine Freigabe offen.“); Kanban-Bahn „Abholung“ ganz leer.

### N19 – Einheitlicher Zustand für Funktionen, die der Server noch nicht kann
**Befund:** §10 markiert 20+ Lücken (✘/◐). Je Stelle steht ein anderes Verhalten: Knopf mit Fehlertext (Rechnung), Knopf ausgeblendet (Zahlung stornieren), Ersatz über Aufgabe (Angekündigt zurücknehmen), UI-Sperre mit Text (Teilbetrag), gar nichts (S2-Live-Prüfung braucht nicht-whitelisted `pruefen`; S5 braucht `ausstellen`).
**Verstoß:** Nielsen 4, Nielsen 1.
**Änderung:** Eine Regel: Funktion, die fachlich erwartet wird, aber fehlt → Knopf **sichtbar, deaktiviert**, darunter ein Satz `muted` 12 px „Noch nicht verfügbar – {Ersatzweg}“, Ersatzweg als Link (Aufgabe an Leitung / Kassa / Website). Funktion ohne fachliche Erwartung (Zahlung stornieren) → ausgeblendet. S2 ohne `pruefen`: Code-Prüfung erst beim „Einlösen“ (Servertext am Feld), Live-Karte entfällt – Zustand im Wireframe zeigen. Liste der Lücken mit gewählter Variante als Spalte in §10.

### N20 – Einstellungen: Tabs stimmen nicht, „Live schalten“ ohne Bestätigung
**Befund:** §3.9 nennt 5 Tabs (Shop · Versand & Steuer · Gutscheine · Rechtstexte · Stripe), §2.1 die Route `?tab=shop|gutscheine|rechtstexte|stripe` (4). Erstbesuchs-Satz „Änderungen wirken sofort auf Website und Mails“ – `shop_modus` auf `live` stellt echte Zahlungen scharf, ohne Rückfrage, ohne Undo, über `⌘S`.
**Verstoß:** 02 §6.2 (nach außen ohne Verzögerung → Bestätigung), Nielsen 5.
**Änderung:** Route und Tabs angleichen (`versand` ergänzen). `shop_modus` nicht als Feld im Formular, sondern eigener Block „Shop-Modus“ mit Status-Badge und Knopf „Live schalten …“ → Bestätigung mit Prüfliste (Schlüssel vorhanden ✔ · Webhook-Secret ✔ · Simulation aus ✔ · Rechtstexte freigegeben ✔/✘), Primär nur aktiv bei vollständiger Liste, Text „Ab jetzt werden Zahlungen über Stripe ausgeführt.“ Zurück auf Test: verzögerter Commit 8 s. Übrige Felder: Speichern mit Toast „Gespeichert · Rückgängig“ (Variante B, alter Wert).

---

## 3. Empfehlungen (keine Blocker)

### 3.1 Klicks / Einfachheit
- **Zeilenknopf „Nächster Schritt“:** in Arbeitsansichten (Zu packen, Abholung, Prüfen) immer sichtbar, in „Alle“ nur bei Hover/Fokus; auf Touch (`pointer: coarse`) immer – heute „ab 1280 px sichtbar, sonst Hover“ macht ihn am iPad (1180 px, kein Hover) unsichtbar, obwohl §8.1 ihn verspricht.
- **Widerruf-Kette:** „Retoure anlegen“ nur im Ergebnis-Toast ist ein flüchtiger Weg. Nach dem Commit wird der Zeilenknopf der Widerrufsliste selbst zu „Retoure anlegen“ (die Liste braucht ohnehin Zeilenknöpfe wie die Bestellliste – heute nur auf Kanban-Karten beschrieben).
- **Anzahlung:** Folgedialog „Zahlungslink jetzt senden?“ streichen; im Anlage-Dialog Schalter „Link sofort senden“ (Standard an), Primär „Anlegen und Link senden“. Ein Dialog statt zwei.
- **Anzahlungen im Shop:** Mitarbeiter suchen Anzahlungen am Auftrag (SHD-Fluss Auftrag → AB → Anzahlung). Die Liste im Shop ist Kontrolle; der Anlage-Weg gehört zusätzlich als Primär-/Sekundäraktion in die Auftragsakte (Faktura), Shop verlinkt.
- **„Rechnung“ als Bezugstyp in `/shop/zahlungen/neu`:** doppelt zum Zahlungseingang in Faktura. Entweder entfernen oder ausdrücklich als derselbe Dialog wie in Faktura (eine Komponente).
- **Kanban Abholung:** Spaltenreihenfolge „Reserviert · Bezahlt · Abholbereit · Abgeholt“ widerspricht der Phasenleiste Variante 3 (`Reserviert → Abholbereit → Bezahlt → Abgeholt`). Für die Abholbahn Spalten „Reserviert · Abholbereit · Abgeholt“, Zahlstand als Kartenmerkmal („Offen 89,00 €“ `warning`) – eine Spalte „Bezahlt“ in zwei Bahnen verwirrt.

### 3.2 Tastatur / Fokus
- Side-Peek hat bis zur Fundament-Entscheidung keine Taste; Übergang festlegen: Peek-Knopf ist im Tab-Fluss der Zeile, `Enter` darauf öffnet, Fokus springt in den Peek, `Esc` zurück zur Zeile.
- `1–9` bei 17 Bestellstatus: im Status-Menü die Ziffern neben den ersten 9 Einträgen anzeigen, sonst ist die Belegung unsichtbar.
- Phasenpunkte als `<button>`: nicht erreichte Punkte `disabled` mit `aria-disabled` und Tooltip-Ersatztext im `aria-label` („Versendet – noch nicht erreicht“).
- Code-Tastenfeld Packtisch: physische Tastatur und Scanner parallel zulassen (`keydown` auf dem Feld trotz `inputmode="none"`), sonst kann der Packtisch-PC mit Tastatur den Code nicht tippen.

### 3.3 Barrierefreiheit
- 1.4.10 / 02 §10: 200 % Zoom bei 1280 px = 640 CSS-px → Bestellliste fällt in die Kartenansicht; im Konzept nur „Mobil < 768“ genannt. Kartenansicht an Container-Breite statt Gerät binden.
- Ring-Spinner 16 px auf Kanban-Karten: `role="status"` mit Text „wird ausgeführt“; Haken nach Erfolg nicht nur visuell (Live-Region kurz „Lieferschein erzeugt“).
- Chips mit Wert 0 („Zu packen 0“): kein Link, sondern `<span>` mit `aria-label="Zu packen: keine"`.
- Zeile ausblenden nach Commit (160 ms + 200 ms): bei `prefers-reduced-motion` sofort entfernen und Fokus auf die nächste Zeile setzen (sonst Fokusverlust ins Dokument).
- Glocke am Telefon: Bottom-Sheet mit Fokusfalle, Schließen-Knopf ≥ 44 px, Wischen-zum-Schließen nur zusätzlich (2.5.7).

### 3.4 Mobile / iPad / Breakpoints
- Drei verschiedene Grenzen im Dokument: „Mobil < 768“ (§3.2), „Telefon < 640“ (§8.1), 02 §11.1 (`< 640`, `640–1023`, `1024–1279`). Auf 02 angleichen.
- iPad-Liste mit 5 Prioritätsspalten (§8.1) gegen 02 §11.1 „4 Prioritätsspalten“ – entweder 02 auf 5 ändern (Begründung: Betrag ist für Shop Kerninfo) oder „Nächster Schritt“ unter den Status in dieselbe Zelle.
- Primäraktion sticky unten 52 px am iPad: Abstand zur Home-Leiste (`env(safe-area-inset-bottom)`), Toasts erscheinen **über** der Leiste, nicht darunter.

### 3.5 Visuell / Modernität
- Übersicht hat 5 Chips + 4 Kacheln + 2 Panels + 2 Charts = 13 Blöcke. Für Rolle Mitarbeiter: Charts ausblenden (sie gehören GF/Leitung), Kacheln auf 2 (Bestellungen heute, Zahlung ausstehend). Ruhigere erste Sicht im Linear-/Stripe-Stil: oben Arbeit, unten Zahlen.
- Vier Status in Türkis (Zahlung ausstehend, Versandbereit, Versendet, Abholbereit) – im Kanban unterscheidbar nur über Spalte, in der Liste nur über Text. Akzeptabel; aber Icon je Status (`clock`, `package`, `truck`, `shopping-bag`) im Badge ergänzen (03 §0.2 Form + Farbe).
- Bestellungsakte-Kopf: Primärknopf „Packen ⌘↵“ – Kürzel als `<kbd>` im Tooltip, nicht im Knopftext (Knopfbreite schwankt mit Plattform ⌘/Strg).

### 3.6 Unklar im Dokument
- §3.2.5 „Reserviert bis: Standard leer lassen → Server setzt Frist“, Wireframe zeigt ein Datum. Festlegen: Feld zeigt den berechneten Wert als Platzhalter `muted`, wird nur bei Änderung gesendet.
- §1.1 „Abholbereit 1 ab Kanban“: Kanban muss dafür offen sein; ab `/shop` sind es 2 (Chip → Zeilenknopf). Zeile auf „2 ab /shop“ vereinheitlichen, Kanban als Alternative.
- §4.1 „abholbereit (bezahlt) · Sekundär: Abholcode erneut senden … setzt die Frist neu“ – mit N5 verbunden; Knopftext nennt das neue Datum („Erneut senden · Frist bis 11.11.“).
- §8.3 Kassa: „Übergeben an der Kassa (Knopf)“ und Packtisch „Übergeben“ – zwei Orte für einen Schritt; festlegen, dass die Kassa nach Bezahlung **direkt** übergibt, wenn der Kunde dort steht, und die Packtisch-Kachel „Abholungen heute“ den Eintrag sofort entfernt (Realtime).

---

## 4. Was gut ist und so bleiben soll
- Kürzel-Regel „keine globalen Einzelbuchstaben, Bereich nur mit Shift, Primär ⌘↵ / ⇧↵“ mit automatischer Registry-Prüfung (§2.4, §11.18).
- Eine Undo-Zahl (8 s) für den Bereich, Commit erst nach Ablauf, Kanban ohne Rückfrage-Dialog (§3, §3.3).
- S1: Betrag im Knopf, Live-Satz mit `aria-live`, Teilbeträge ehrlich gesperrt mit Begründung statt falsch zu buchen (§5.3).
- Einmaliger Code: Schließen nur über „Fertig“ mit Nachfrage, „Kopieren“ mit Live-Region (§4.3).
- Code-Tastenfeld mit genau dem 32-Zeichen-Alphabet, keine Systemtastatur, automatische Suche nach dem 6. Zeichen (§8.2).
- „Ein Ort je Schritt“ bei Widerruf/Retoure (§4.6).
- Erstbesuchs-Sätze je Seite, kurz und handlungsbezogen (§2.6).
- Offene Benennung der Code-Fehler in ph_shop mit Testfall `K7PL3Q` (§8.2, §13).

---

## 5. Widersprüche in den Leitlinien (an Fundament/UX-Lead, Stand Runde 2)

| Thema | 02 | 04 | 05 | Shop F2 | Vorschlag |
|---|---|---|---|---|---|
| Undo-Technik | sofort ausführen, Undo = Gegenaktion (§6.1) | verzögerter Commit (Variante A) bevorzugt (§3.6) | – | Variante A | Regel: Variante A für alles mit Mail/Beleg, Variante B für Feldwerte (Zuweisen, Notiz) |
| Undo-Taste | ⌘Z / Strg+Z (§6.1, §9.1) | `Z` ohne Modifier (§3.6) | – | `Z` | `Z` und ⌘Z beide; ⌘Z in Eingabefeldern bleibt Text-Undo |
| Undo-Dauer | 8 s | 5 s | – | 8 s | 8 s |
| Esc bei offenem Undo-Toast | – | schließt + commit sofort | – | Massenaktion-Abbruch | Esc berührt Undo-Toasts nie (N2) |
| Toast-Überlauf | 3, älteste weg | 3, älteste ohne Animation weg | – | – | Sammeltoast statt Verdrängen bei ausstehendem Commit (N3) |
| Drucken | ⌘P | – | `p` (T5) | `p` | `p` in Akten, ⌘P überall (Browser-Druck abfangen) |
| Kundenakte | – | – | `k` | `Shift+K` | `k` in Akten |
| Akte-Tabs | Alt+1…9 | – | 1–9 | Alt+1…5 | Alt+1…9 |
| WCAG 2.1.4 | fehlt in §10 | – | – | – | Einstellung „Einzeltasten-Kürzel aus“ (N12) |
| Zwei-Klick-Bestätigung | nicht vorgesehen (§6.2 nur Dialog) | – | – | Freigabe | in 02 §6.2 als zweites Muster aufnehmen, mit N8-Regeln |
| Toast-Position | unten Mitte | unten rechts | unten rechts | unten rechts | unten rechts |
| F-Tasten Packtisch | F4 Etikett | – | F8 Etikett | keine | eine Tabelle im Logistik-Konzept |

---

## 6. Abnahme-Ergänzungen für §11

1. **N1:** Kanban-Zug nach „Versandbereit“, sofort Bestellliste öffnen → Zeile zeigt Zielstatus mit Spinner und „Rückgängig“; Mock lässt `packen` fehlschlagen → Toast ohne Ablauf mit Nummer + Glocken-Eintrag; Tab schließen während 8 s → beim nächsten Laden Glocke „1 Aktion beim Verlassen ausgeführt“.
2. **N2:** Auswahl 3 → „Packen“ → `Esc` → Mock-Protokoll 0 Aufrufe vor Ablauf von 8 s; Auswahl ist nach Start bereits leer.
3. **N3:** 4 Kanban-Züge in 4 s → ein Sammeltoast „4 … · Rückgängig (alle)“, Einzel-Undo je Dokument; kein Commit ohne Ablauf.
4. **N4:** Parametrisierter Test Primäraktion × `zahlung` (Stripe/vorort): bei `zahlung_ausstehend`/`offen` mit Stripe keine Primäraktion, Band sichtbar.
5. **N5:** Reservierung mit Frist +20 Tage → „Abholbereit melden“ → Toast nennt alte und neue Frist bzw. Dialog bei Verkürzung; Positionsänderung in `reserviert` → Hinweis „Kunde nicht informiert“.
6. **N6:** Massenaktion „Abholbereit melden“ mit einer `pruefen`-Bestellung → „übersprungen (zuerst prüfen)“, kein Methodenaufruf.
7. **N8:** Doppelklick auf „Freigeben“ → kein `erstattung_freigeben`; zweiter Klick nach 700 ms → genau ein Aufruf; Hover hält das 10-s-Fenster an.
8. **N10/N11:** Zahlungen und Gutscheine: Reiter ≤ 5 + „+“, kein Reiter dupliziert einen Filter; Zahlungsliste 7 Spalten ohne horizontalen Scroll bei 1180 px; jede Akte hat unabhängig vom Dokument dieselben Tabs.
9. **N12:** Einstellung „Einzeltasten-Kürzel aus“ → `z`, `n`, `p`, `.`, `1–9`, `Shift+…` wirken nicht, `⌘/Strg`-Kürzel weiter; `k` in Bestellungsakte öffnet Kundenakte; `s` in der Liste öffnet „Nächster Schritt“.
10. **N13:** grep UI-Strings nach „Refund“, „Scheduler“, „PI “ = 0; alle Status-Badges ohne `ae/oe/ue`-Ersatzschreibung.
11. **N15:** Packtisch „Ohne Code suchen“ → Übergabe erst nach „Ausweis geprüft“; Verlaufseintrag „Übergabe ohne Code“.
12. **N16:** „Rechnung erstellen“ öffnet Bestätigung mit Betrag und Nummernhinweis; ohne Hook deaktiviert mit Satz; „Retoure anlegen“/„Ware erhalten“ mit 8-s-Undo, kein Aufruf vor Ablauf.
13. **N19:** Jede ✘-Funktion aus §10 hat in der UI genau einen der zwei Zustände (deaktiviert + Ersatzweg / ausgeblendet) – Checkliste je Zeile.
14. **N20:** „Live schalten“ nur mit vollständiger Prüfliste; `⌘S` im Einstellungsformular ändert `shop_modus` nie.

*Ende 20 – Kritik UX Shop (Runde 2).*
