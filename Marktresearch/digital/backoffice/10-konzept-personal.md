# 10 – Konzept Bereich „Personal“ (ph_personal) für das Next.js-Backoffice – finale Fassung

**Zweck:** Verbindliches Funktions- und Oberflächenkonzept für den Bereich Personal (Stellen, Bewerbungen, Gespräche, Team mit Zeiten und Abwesenheiten, Personalakte, Selbstservice „Mein Bereich“, Datenschutz-Fristen) mit Bauauftrag für den Fachbereichs-Agenten „Personal“.
**Stand:** 2026-11-04 · Fassung 2 (Überarbeitung nach `20-kritik-ux-personal.md` und `21-kritik-fach-personal.md`; alle Pflichtänderungen eingearbeitet, Protokoll in § 15).
**Grundlage:** 01–05 (Benchmark, UX, Design-System, Motion, IA), `PLAN-NEXT-BACKOFFICE.md`, `Backend-Import/ph_personal` (README, 11 DocType-JSONs, Controller, `api/__init__.py`, `tasks.py`, `fixtures/workflow.json`, Reports, Druckformate), `ph_core/utils/feiertage.py`, `ph_core/api/bediener.py`, UI-Kit `backoffice/src/components/Backoffice/README.md`, SHD-Vorbild.
**Verbindlich aus 02/03/04/05:** eine Primäraktion je Seite, Undo statt Rückfrage (8 s), Filter in der URL, Skeleton statt Spinner, Token `--color-bo-*`, Dauer 120/160/200/240 ms mit `--bo-ease-out`, Seitentypen T1–T9, Fehlercodes `invalid|forbidden|not_found|conflict|rate_limited|unavailable|auth`, Toast unten rechts (Desktop) bzw. oben Mitte (Kiosk).
**Nicht Teil dieses Konzepts:** Lohnverrechnung und Zuschlagsberechnung, AZG-Prüfwerk, Dienstvertrag/Dienstzettel-Erzeugung, Reisekosten/Spesen/Vorschüsse (gehören zu Faktura/Buchhaltung bzw. Lohnverrechnung der Kanzlei), Projekt-/Montagezeiten (gehören zu `PH Projektzeit`, Bereich Projekte).
**Rechtlicher Hinweis:** Punkte mit „StB/AR“ sind vom Steuerberater bzw. Arbeitsrechtler zu bestätigen; das Konzept ist keine Rechtsberatung.

---

## 0. Entscheidungen dieser Fassung (Widersprüche aufgelöst)

| # | Frage | Entscheidung | Begründung |
|---|---|---|---|
| E1 | Undo bei Workflow-Übergängen ohne Rückweg (UX: verzögerter Commit; Fach: neue Rückübergänge oder streichen) | **Verzögerter Commit (Variante A, 8 s)** für alle Übergänge ohne echten Rückweg. Kein `setzeWert` auf `status`/`workflow_state`. Rückübergänge aus Fach-P1 bleiben Anfrage für Korrekturen **nach** dem Undo-Fenster. | Funktioniert ohne Backend-Änderung, umgeht keine Workflow-Rechte, Server sieht vor Ablauf nichts (keine Benachrichtigung, kein `gesichtet_am`). |
| E2 | Sichtbarkeit der Abwesenheitsart | **Zwei Klassen statt vier:** Leitung/GF sehen die Art. Alle anderen (Sachbearbeitung, Backoffice-Admin, Selbstservice) sehen bei fremden Personen nur **„abwesend“** + Zeitraum. Eigene Datensätze: alles. Serverseitig maskiert. | Art. 9 DSGVO, Datenminimierung; eine Regel ist leichter zu prüfen als eine Matrix. Lockerung (z. B. „Urlaub“ namentlich) nur auf Entscheidung des Inhabers. |
| E3 | Zeitsaldo im laufenden Monat (App rechnet Soll des ganzen Monats) | **Kein Saldo für den laufenden Monat**, bis ph_personal einen Zeitraum `bis` annimmt. Angezeigt: „Ist bis gestern“, „Heute bisher“, „Soll Monat“. Saldo nur für abgeschlossene Monate, Beschriftung „Stundensaldo (ohne Zuschläge)“, immer neutral gefärbt. | Keine falschen Zahlen; AZG-Begriffe korrekt. |
| E4 | Saldo, Urlaubstage, Resturlaub trotz bekannter Rechenfehler (Feiertage, Samstag, Zeitausgleich, Kalenderjahr, kein Übertrag) | **Schalter `personal.konten`** (Standard aus). Aus: keine Tageszahlen, kein Resturlaub, kein Saldo – nur Zeiträume, Buchungen, Ist-Stunden. An erst nach ph_personal-Änderungen A5–A8 (§ 12) und ph_core `feiertage`. | Fach-Freigabe: „Zeiten/Abwesenheiten erst nach P4–P12“. Die Oberfläche wird jetzt gebaut, die Zahlen erscheinen erst, wenn sie stimmen. |
| E5 | Krankmeldung (UX: Anzeige-Mapping; Fach: kein Genehmigen/Ablehnen) | Eigener Sheet „Krankmeldung“, Status-Anzeige **„Gemeldet“**, Leitung sieht nur **„Zur Kenntnis genommen“** (ruft bis zur App-Änderung den Workflow „Genehmigen“), **kein Ablehnen** im UI. Verlängern = neue Meldung ab Folgetag. | AngG § 8 / EFZG § 4: Mitteilungspflicht, keine Genehmigung. |
| E6 | Stempeln: wo und wie | **Shell-Stempelpille** in der Kopfzeile jeder Backoffice-Seite (für Benutzer mit PH Mitarbeiter) + Stempelkarte in Mein Bereich + Kiosk-Knopf. Kein Einzeltasten-Kürzel. Kein Projektfeld beim Stempeln (Anwesenheit ≠ Projektzeit). | Ein Muster, 2 Klicks überall; Projektzeit gehört in `PH Projektzeit` (Fach P17). |
| E7 | Selbstkorrektur von Zeiten | Selbstservice korrigiert nur Buchungen **von heute**; ältere über **„Korrektur beantragen“** (bis zur App-Methode als PH Aufgabe an die Leitung). Automatische Pause wird beim Gehen **bestätigt** („30 min Pause genommen?“). | AZG § 26: Aufzeichnungen müssen richtig sein. |
| E8 | Assistenten | Stelle anlegen = **Neu-Dialog (3 Felder) → Akte**; Gespräch planen = **ein Bildschirm**; Urlaub = **ein Sheet**; Einstellen und Austritt bleiben Assistenten mit Teilschritt-Ergebnis. | 05 T6, weniger Klicks, keine doppelte Oberfläche. |
| E9 | Zahlenwand am Bereichsstart | Übersicht = **„Zu erledigen“** + max. 4 Kennzahlen + „Heute im Haus“ (ohne Uhrzeiten) + Charts erst ab 20 Bewerbungen. | 02 § 2.1, ArbVG § 96a / AVRAG § 10 (keine Live-Ankunftszeiten für Kollegen). |
| E10 | Zeiten und Abwesenheiten getrennt | Eine Pill **„Team“** mit Reitern Kalender · Personen · Buchungen · Anträge. Alte Routen leiten um (307). | Gleiche Matrix nicht zweimal; 7 Pills bleiben. |
| E11 | Funktionen, die die App heute ablehnt (Selbstservice-Teamkalender, Vertretungswahl, Selbst-Zeitnachweis, Selbst-Storno genehmigter Anträge, Gleich-genehmigen) | **Ausblenden statt scheitern.** Jede Funktion erscheint erst mit der App-Änderung (Schalter in `schalter.js`); bis dahin ein ehrlicher Weg („Leitung bitten“ → PH Aufgabe). | Keine Knöpfe, die mit Fehler enden. |

---

## 1. Datenbestand und Rechte (aus `ph_personal`, Stand heute)

| DocType | Nummer | Status (Anzeige ← Wert) | Workflow-Aktionen (Rolle) | Dokumentmethoden |
|---|---|---|---|---|
| PH Stelle | `field:slug` | Entwurf · Aktiv · Pausiert · Besetzt · Archiviert | Veröffentlichen (L, Bedingung GlBG), Pausieren (M), Wieder aktivieren (L), Als besetzt schließen (L), Archivieren (L), Zurück auf Entwurf (L) | `website_cache_erneuern`, `duplizieren`, `als_besetzt(bewerbung)`, `pruefen` |
| PH Stelle Aufgabe/Anforderung/Leistung | Kindtabellen je Sprache | – | – | – |
| PH Bewerbung | `PH-BEW-.YYYY.-.#####` | Eingegangen · Gesichtet · Gespräch ← `Gespraech` · Angebot · Eingestellt · Abgesagt · Zurückgezogen ← `Zurueckgezogen` | Sichten (M), Termin vereinbaren (M, nur aus Gesichtet), Angebot erstellen (L), Einstellen (L, nur aus Angebot), Absagen (L), Zurückziehen (M), Zurück auf Gesichtet (L) | `gespraech_anlegen`, `absage_senden(grund, per_mail)`, `einstellen(eintritt, rolle_intern, stelle_schliessen)`, `unterlagen_loeschen`, `evidenz_verlaengern(bis)` |
| PH Bewerbung Unterlage | Kindtabelle | `art`: Lebenslauf · Anschreiben · Zeugnis · Portfolio · Sonstiges | – | – |
| PH Bewerbungsgespraech | `PH-GSP-.YYYY.-.#####` | Geplant · Durchgeführt ← `Durchgefuehrt` · Abgesagt (Anzeige „Termin abgesagt“) · Nicht erschienen; `ergebnis` | – | `kalender_eintragen`, `abschliessen(ergebnis, naechster_schritt)` |
| PH Mitarbeiter | `PH-MA-.####` | Aktiv · Karenz · Ausgetreten | – | `monatsuebersicht(jahr, monat)`, `urlaubskonto(jahr)`, `austritt_erfassen(datum)` |
| PH Zeiterfassung | `PH-ZEIT-.YYYY.-.######` | Offen · Erfasst · Korrigiert | – | `gehen_jetzt` |
| PH Abwesenheit | `PH-ABW-.YYYY.-.#####` | Beantragt (bei Krankenstand Anzeige „Gemeldet“) · Genehmigt (Krankenstand: „Zur Kenntnis genommen“) · Abgelehnt · Storniert | Genehmigen/Ablehnen (L, `allow_self_approval = 0` gegen `owner`), Stornieren (Beantragt: Antragsteller; Genehmigt: L), Erneut beantragen (Selbstservice) | `stornieren` |
| PH Personal Einstellungen | Single | – | – | – |

L = PH Personal Leitung, M = PH Personal Mitarbeiter (Sachbearbeitung).
**App-API:** `stempeln(mitarbeiter?, art, projekt_referenz)` (POST, bucht „jetzt“), `monatsuebersicht(mitarbeiter, jahr, monat)` (ganzer Monat), `anzahl_heute_abwesend`, `abwesenheiten_kalender(start, end, filters)` (`get_list` → für Selbstservice nur eigene), `create_bewerbung`, `attach_unterlage`, `karriere_data`, `get_stellen`.
**Scheduler:** 03:15 Löschlauf, 04:00 abgelaufene Stellen → Pausiert, Mo 07:00 Löschfrist-Vorwarnung (ToDo auf Report), 23:30 Hinweis offene Buchungen (wiederholt sich täglich je Buchung).
**Reports:** PH Bewerbungsstatistik, PH Loeschfristen, PH Monatsstunden, PH Abwesenheiten. **Number Cards (6), Charts (5), Druckformate (5)** wie App-README.

### 1.1 Rollen im Bereich

| Rolle | Sieht | Darf |
|---|---|---|
| PH Personal Leitung | alles inkl. permlevel 1 (Bewertung, Vertrauliches), Art der Abwesenheit | veröffentlichen, entscheiden, genehmigen, löschen, Export |
| PH Geschäftsführung | alles lesend inkl. permlevel 1 und Art | lesen, drucken, Export |
| PH Personal Mitarbeiter (Sachbearbeitung) | Stellen, Bewerbungen (ohne Bewertung), Gespräche, Team ohne Art/Saldo | sichten, Gespräch planen, zurückziehen, pausieren, Buchungen nachtragen |
| PH Backoffice-Admin | Stellen, Team ohne Art, **keine** Bewerbungen/Gespräche | Stammdaten Mitarbeiter, Benutzer; kein Löschen von Zeiten im UI |
| PH Personal Selbstservice | nur „Mein Bereich“ (eigene Daten) | stempeln, Urlaub beantragen, krank melden, eigene Buchung von heute korrigieren |

### 1.2 Sichtbarkeit „Art der Abwesenheit“ (verbindlich, serverseitig)

Umsetzung in `lib/backoffice/personal/sichtbarkeit.js` (reine Funktion, unit-getestet) – jede Server-Funktion, die Abwesenheiten ausliefert, ruft `maskiereAbwesenheit(zeile, session, eigenerMitarbeiter)` **vor** der Serialisierung. Nie per CSS.

| Betrachter | eigene Abwesenheit | fremde Abwesenheit |
|---|---|---|
| Leitung, GF | Art, Grund, Anmerkung, Vertretung | Art, Grund, Anmerkung, Vertretung |
| Sachbearbeitung, Backoffice-Admin | alles | `art = "abwesend"`, Zeitraum, Status; **keine** Anmerkung, kein Ablehnungsgrund, keine Vertretung |
| Selbstservice | alles | nur mit App-Methode `teamkalender` (§ 12 A11a); bis dahin keine fremden Daten |

Darstellung „abwesend“: Ton `neutral-soft`, Schraffur 45°/4 px, Kürzel `AB`. Krankenstand bei Leitung: Ton `neutral` + Icon `thermometer` 12 px, Kürzel `KR`, **nie Rot**. Kennzahl „Heute abwesend“: Aufteilung nach Art nur Leitung/GF, sonst nur Zahl.

---

## 2. Nutzer, Top-Aufgaben und gezählte Wege

Zählregel 02 § 1: ab Zentrale, jeder Klick/Tipp/Enter zählt, Tippen von Text nicht. Datumswahl im Picker = 2 Tipps (Beginn, Ende), getrennt ausgewiesen.

| Nutzer | Aufgabe | Weg (gezählt) | Klicks |
|---|---|---|---|
| Jede Person mit Mitarbeiter-Datensatz | Kommen/Gehen | Stempelpille (1) · „Kommen“ (2) | **2** |
| | Urlaub beantragen | Stempelpille (1) · „Urlaub beantragen“ (2) · Zeitraum (2 Tipps) · „Beantragen“ (3) | **3 + Datum** |
| | Krank melden | Stempelpille (1) · „Krank melden“ (2) · „Melden“ (3) (ab heute vorbelegt) | **3** |
| | Vergessenes Gehen nachtragen | Glocke (1) · Eintrag „Gehen fehlt (gestern)“ (2) · Zeit tippen · Enter (3) | **3** |
| | Eigene Buchungen sehen | Stempelpille (1) · „Meine Zeiten“ (2) | **2** |
| Sachbearbeitung | Neue Bewerbung sichten + Gespräch planen | Personal (1) · Zu erledigen „3 neue Bewerbungen · Sichten“ (2) · Lebenslauf sichtbar, „Gespräch planen“ (3) · Slot (4) · „Gespräch anlegen“ (5) | **5** |
| | Bewerbung manuell erfassen | Personal (1) · Bewerbungen (2) · „+ Bewerbung“ (3) · Pflichtfelder · „Anlegen“ (4) | **4** |
| | Stelle anlegen | Personal (1) · Stellen (2) · „Stelle anlegen“ (3) · 3 Felder · „Anlegen“ (4) → Akte | **4** |
| Leitung | Urlaubsantrag genehmigen | Glocke (1) · „Genehmigen“ (2) (Kontext steht im Eintrag) | **2** |
| | Absage senden | Personal (1) · Bewerbungen (2) · Karte (3) · „Absage senden“ (4) · Grund-Chip (5) · „Absage senden“ (6) | **6** |
| | Stelle veröffentlichen | Personal (1) · Stellen (2) · Zeile (3) · „Veröffentlichen“ (4) | **4** |
| | Daten auf Wunsch der Person sofort löschen | Bewerberakte (über Suche ⌘K, 1–2) · Tab Datenschutz (3) · „Auf Wunsch sofort löschen“ (4) · „löschen“ tippen · „Endgültig löschen“ (5) | **5** |
| | Einstellen | Bewerberakte (Angebot) · „Einstellen“ → Assistent 3 Schritte | Assistent |
| | Austritt erfassen | Personalakte · ⋯ · „Austritt erfassen“ → Assistent 2 Schritte | Assistent |
| GF | Wer ist heute da? | Personal (1) → „Heute im Haus“ | **1** |
| Kassa/Packtisch/Montage/Technik | Stempeln am Kiosk (angemeldete Person) | „Stempeln“ (1) · „Kommen · Anna Berger“ (2) | **2** |

Fristgebundene Routine „Löschfristen abarbeiten“ entfällt als tägliche Aufgabe: der Löschlauf 03:15 arbeitet automatisch; die Leitung sieht nur Ausnahmen.

---

## 3. Bereichsweite Regeln

### 3.1 Routen und Unternavigation

```
/personal                          T1  Übersicht (Leitung, Sachbearbeitung, GF, Admin) | nur Selbstservice → 307 /personal/meins
/personal/meins                    T1  Mein Bereich
/personal/meins/zeiten             T2  Meine Zeiten (Monat)
/personal/meins/urlaub             T2  Meine Abwesenheiten
/personal/meins/daten              T5  Meine Daten (lesend)
/personal/stellen                  T2  Stellen (Liste | Kanban)
/personal/stellen/[slug]           T5  Stellenakte
/personal/bewerbungen              T3  Kanban (Standard) | T2 Liste
/personal/bewerbungen/[name]       T5  Bewerberakte (?modus=sichten → Sichtungsmodus)
/personal/gespraeche               T4  Woche | T2 Liste
/personal/team                     T4  ?ansicht=kalender (Standard) | personen | buchungen | antraege
/personal/mitarbeiter/[name]       T5  Personalakte (?tab=zeiten Standard)
/personal/datenschutz              T2  Löschfristen-Cockpit (Leitung)
/personal/berichte/[report]        T8  bewerbungsstatistik | loeschfristen | monatsstunden | abwesenheiten
/personal/einstellungen            T9  PH Personal Einstellungen (Leitung, Admin)
Umleitungen 307: /personal/mitarbeiter → /personal/team?ansicht=personen · /personal/zeiten → ?ansicht=buchungen ·
                 /personal/abwesenheiten → ?ansicht=kalender · /personal/stellen/neu → /personal/stellen?neu=1
```

Pills (max. 7): **Mein Bereich** (nur mit Mitarbeiter-Datensatz) · **Übersicht** · **Stellen** · **Bewerbungen** · **Gespräche** · **Team** · **Mehr ▾** (Datenschutz, Berichte, Einstellungen). Backoffice-Admin: ohne Bewerbungen/Gespräche (Server filtert; Direktaufruf → `kein-zugriff`). Reiner Selbstservice: keine Pills, nur Mein Bereich mit Unterseiten als Segment „Heute · Zeiten · Abwesenheiten · Daten“.
Zähl-Badges nur an Pills, nie zusätzlich in Kacheln: Bewerbungen = `count(status=Eingegangen)`, Team = offene Anträge + Korrekturanfragen (nur Leitung). Eine Zahl erscheint höchstens zweimal (Badge + Zeile in „Zu erledigen“).
Bereichskürzel: Vorschlag `g t` an Fundament (W7).

### 3.2 Glossar und Anzeigenamen (`lib/backoffice/personal/texte.js`)

Rohwerte aus Fixtures werden nie angezeigt (Test: kein `ae/oe/ue`-Statustext im DOM).

| Intern | Anzeige |
|---|---|
| Absagen (Gespräch) | **Termin absagen** |
| Absagen (Bewerbung) | **Absage senden** (Dialogtitel „Absage an Sarah Beispiel senden?“) |
| `website_cache_erneuern` | **Website aktualisieren** |
| Slug | **Adresse auf der Website** |
| Evidenz verlängern | **Aufbewahrung verlängern** (Hilfe „mit Einwilligung der Person“) |
| pseudonymisiert | **Personendaten gelöscht** |
| Deckblatt | **Bewerbungsblatt drucken** |
| Gutschrift (Zeiten) | **Angerechnet** (Tooltip „Urlaub, Krankenstand u. a. werden mit dem Tagessoll angerechnet“) |
| `einwilligung_datenschutz` | **Datenschutzinformation erhalten** (keine „Einwilligung“; Rechtsgrundlage Art. 6 Abs 1 lit b) |
| `einwilligung_evidenz` | **Einwilligung zur längeren Aufbewahrung** |
| Saldo | **Stundensaldo (ohne Zuschläge)** |
| Beantragt bei Krankenstand | **Gemeldet** |
| Genehmigen bei Krankenstand | **Zur Kenntnis genommen** |
| Relative Zeiten | ausgeschrieben: „vor 2 Tagen“, „in 6 Tagen“, „Rest 4 Tage“ – nie „T.“ |

### 3.3 Statustöne (03 § 1.5; StatusBadge `ton`)

| Objekt | Ton je Status |
|---|---|
| Stelle | Entwurf `grau` · Aktiv `gruen` · Pausiert `orange` · Besetzt `gruen` + Icon `user-check` · Archiviert `grau` · Sonderfall „Aktiv ohne Entgelt“ `rot` (einziges Rot) |
| Bewerbung | Eingegangen `blau` · Gesichtet `tuerkis` · Gespräch `tuerkis` · Angebot `orange` · Eingestellt `gruen` · Abgesagt `grau` · Zurückgezogen `grau` |
| Gespräch | Geplant `blau` · Durchgeführt `gruen` · Termin abgesagt `grau` · Nicht erschienen `grau` + Icon `user-x` |
| Abwesenheit | Beantragt/Gemeldet `orange` · Genehmigt/Zur Kenntnis genommen `gruen` · Abgelehnt `rot` · Storniert `grau` |
| Zeitbuchung | Offen `orange` · Erfasst `grau` · Korrigiert `blau` (Tooltip „von …, am …“) · „offline erfasst“ `neutral-soft` |
| Saldo | immer `ink`, Vorzeichen `−`/`+`, nie Rot/Grün |

Kalenderereignisse tragen immer Text oder Icon, nie Farbe allein. Icons nur lucide (`paperclip`, `star`, `lock`, `timer`, `car`, `search`, `thermometer`, `user-check`, `user-x`); Emoji kommen im Produkt nicht vor.

### 3.4 Undo-Regel (E1)

| Variante | Mechanik | Aktionen im Bereich |
|---|---|---|
| **A – verzögerter Commit** | Oberfläche sofort optimistisch; Toast „… · Rückgängig (Z)“ mit Balken 8000 ms linear; Server-Aufruf erst nach Ablauf; `pagehide`/`visibilitychange:hidden` → sofort per `navigator.sendBeacon` an die Commit-Route; Rückgängig = Aufruf entfällt | Kommen, Sichten, Pausieren, Archivieren, Wieder aktivieren, Genehmigen, Zur Kenntnis genommen, Ablehnen (nach Dialog), Angebot erstellen, Kanban-Züge dieser Übergänge, Massen-Statuswechsel, Termin absagen, Nicht erschienen, Antrag stornieren, Absage senden (Fenster 10 s), „Als besetzt schließen“ ohne Dialog |
| **B – Gegenaktion** | Server sofort; Rückgängig ruft die echte Gegenaktion mit dem alten Wert | Gehen (`gehen` → leer), Zuweisen (alter Wert), Gespräch umplanen (`start` alt), Inline-Korrektur Kommen/Gehen/Pause (alter Wert), Team-Chip, Aufbewahrung verlängern (alter `einwilligung_evidenz_bis`), Duplizieren (löscht den Entwurf) |
| **Kein Undo** | Bestätigung vorher, Ergebnis nachher | Einstellen, Austritt, Monatsabschluss (Phase B), Daten endgültig löschen (Tippfeld) |

Commit-Zeitpunkt: angezeigte Zeit beim Kommen = Klickzeit; Server bucht „jetzt“ beim Commit (Abweichung ≤ 8 s, bekannt; entfällt mit `stempeln(zeitpunkt)`, § 12 A1). Nach Ablauf des Fensters: kein Undo, sondern sichtbare Korrektur (Status „Korrigiert“) bzw. Leitungsweg.

### 3.5 Tastatur

- Primäraktion jeder Seite `⌘Enter`/`Strg+Enter`; Speichern `⌘S`; Druck `⌘P` (Druckformat); Suche `/`; Palette `⌘K`; Undo `Z` (außerhalb von Eingabefeldern) und `⌘Z`.
- Tabs in Akten: laut Fundament T5 (Vorschlag `Alt+1…9`, W3) – einheitlich für Stellen-, Bewerber-, Personalakte.
- Ansicht umschalten (Liste/Kanban, Woche/Monat): Segment-Schalter + Palette „Ansicht: …“, keine Einzeltaste.
- Antrag fokussiert: `⌘Enter` Genehmigen, `Shift+A` Ablehnen … (Dialog). Kanban: laut Fundament (Vorschlag W4: `Leertaste` greifen, `←/→` Spalte, `Enter` ablegen, `m` Menü „Verschieben nach …“).
- **Kein Einzeltasten-Kürzel für Stempeln.** Palette: „> kommen“ / „> gehen“ mit Bestätigungszeile „Kommen jetzt buchen · Enter“.
- Alle Einzeltasten über Benutzer-Menü „Einzeltasten-Kürzel aus“ abschaltbar (WCAG 2.1.4, Fundament). Hilfe-Panel `?` listet die Personal-Kürzel je Seite.

### 3.6 Laden, Leer, Fehler

- Skeleton nach 300 ms, mindestens 600 ms, echte Kopfzeile, 8 Zeilen, CLS 0. Eigene `<Suspense>`-Grenzen: Stempelkarte/Zu erledigen zuerst, dann Kennzahlen, dann Listen, dann Charts.
- Drei Leerzustände je Liste (nie Daten / gefiltert / kein Recht). Texte in den Seitenabschnitten.
- Fehler: `Fehler`-Komponente im Zeilenbereich mit Code und „Erneut laden“; Kopf und Filter bleiben bedienbar. Controller-Meldungen (`_server_messages`) unter dem betroffenen Feld, Zusammenfassung oben, Fokus aufs erste Feld.
- `msgprint` orange/blau (Hinweise) → `warning`/`info`-Toast, Speichern gilt als erfolgt.

### 3.7 Bewegung (04)

| Element | Dauer | Easing | Bei `prefers-reduced-motion` |
|---|---|---|---|
| Toast ein/aus | 200 / 160 ms | `--bo-ease-out` | nur Deckkraft 120 ms |
| Undo-Balken | 8000 ms (Absage 10000 ms) | linear, pausiert bei Hover/Fokus | Restsekunden als Text |
| Sheet (480/640 px) von rechts, Bottom-Sheet mobil | 240 ms | `--bo-ease-out` | Deckkraft 120 ms |
| Kanban-Karte zurück bei verbotenem Ziel | 200 ms | `--bo-ease-out` | sofort |
| Kennzahl-Änderung nach dem Laden | 400 ms | `--bo-ease-out` | sofort |
| Balken-Chart erstes Erscheinen | 240 ms (`--bo-dur-slow`) | `--bo-ease-out` | statisch |
| Ergebniskarte Einstellen (Häkchen zeichnen) | 400 ms | `--bo-ease-out` | Häkchen statisch |
| Kiosk-Bestätigungskarte | sichtbar 2000 ms, ein/aus 200 ms | `--bo-ease-out` | ohne Bewegung |
| Stempelpille Zustandswechsel | 160 ms Farbe | `--bo-ease-out` | sofort |

### 3.8 Dunkelmodus

Nur Token: Schraffur `repeating-linear-gradient(45deg, var(--color-bo-line-strong) 0 1px, transparent 1px 4px)`; Art-Bänder `*-soft` + Kürzel in `*-text`; Kontrast Kürzel ≥ 4,5:1, Band-Rand ≥ 3:1 gegen `surface` in beiden Modi. Hex-Farben aus `abwesenheiten_kalender` werden nie verwendet.

### 3.9 Schalter (`lib/backoffice/personal/schalter.js`)

| Schalter | Standard | Schaltet frei | Voraussetzung |
|---|---|---|---|
| `konten` | aus | Stundensaldo, Urlaubstage, Resturlaub, Konto-Vorschau im Antrag, Monatsabschluss, Lohnvorbereitung | § 12 A4–A8 + ph_core B1 |
| `saldoLaufenderMonat` | aus | „Saldo bis gestern“ | § 12 A3 (`monatsuebersicht(bis)`) |
| `teamSelbstservice` | aus | Team-Abschnitt und Überschneidungshinweis in Mein Bereich | A11a |
| `vertretungSelbstservice` | aus | Feld Vertretung im Urlaubs-Sheet | A11b |
| `zeitnachweisSelbst` | aus | „Zeitnachweis (PDF)“ in Meine Zeiten | A11c |
| `stornoGenehmigtSelbst` | aus | Selbst-Storno genehmigter Anträge vor Beginn | A11e |
| `kioskAnderePerson` | aus | Kiosk Fall B (andere Person mit PIN) | Fundament: PIN-Sitzung je Aktion |
| `gleichGenehmigen` | aus | „Anlegen und genehmigen“ für Leitung | A12 |

Schalter sind Server-Konstanten (keine Umgebungsvariable mit Geheimnis), im Mock einzeln umschaltbar für Abnahmen.

---

## 4. Stempeluhr

### 4.1 Shell-Stempelpille (jede Backoffice-Seite, Kopfzeile links neben der Glocke)

Sichtbar für jeden Benutzer mit verknüpftem PH Mitarbeiter (`mitarbeiter_fuer_user`). Gebaut im Bereich Personal (`StempelPille`, `useStempeluhr`), eingebunden von Fundament in `Shell`.

```
 Nicht im Dienst:  ( ○ Nicht im Dienst )          Im Dienst:  ( ● Im Dienst seit 07:55 · 4:12 h )
                         │ Klick
                         ▼
 ┌ Popover 320 px ─────────────────────────────┐
 │ Mittwoch, 4. November                        │
 │ Heute bisher 4:12 h                          │
 │ ┌──────────────────────────────────────────┐ │
 │ │              Gehen                        │ │  44 px, 18/600, darunter „jetzt 12:07“ 13 px
 │ └──────────────────────────────────────────┘ │
 │ Urlaub beantragen · Krank melden             │
 │ Meine Zeiten →                               │
 └──────────────────────────────────────────────┘
```

- Zustand aus offener Buchung heute; Zeit `tabular-nums`, Aktualisierung minütlich, `aria-live="off"`. Ring `neutral` / Punkt `success`.
- Kommen = Variante A (Toast „Kommen 07:55 · Rückgängig“), Gehen = Variante B. Live-Region `polite` „Kommen 07:55 gebucht“, Fokus bleibt auf dem Knopf, kein `aria-pressed`.
- Nach „Gehen“, wenn der Controller eine Pause eingetragen hat (`msgprint` „Pause von 30 Minuten eingetragen“): Zeile im Toast **„30 min Pause genommen? [Ja] [Andere Dauer]“**. Andere Dauer → Inline-Feld Minuten (`inputmode="numeric"`) → `setzeWert pause_min`. Antwort „keine Pause“ ist nicht speicherbar (Controller setzt die Pause erneut) → Hinweis „Ohne Pause sind mehr als 6 Stunden nicht zulässig. Bitte kurz die Leitung informieren.“ + Kommentar an der Buchung „Pause laut Person nicht genommen“ + PH Aufgabe an Leitung. Unbestätigte Pausen zeigen in Meine Zeiten das Kennzeichen „Pause vorgeschlagen“.
- Fehler aus `stempeln` (`ok:false`, `meldung`) → `warning`-Toast mit Text. Kein Mitarbeiter-Datensatz → Pille fehlt. Doppelklick: Knopf sperrt bis zur Antwort bzw. bis zum Commit.
- Kein Projektfeld (E6).

### 4.2 Kiosk-Stempeln (Kassa, Packtisch, Montage, Technik)

```
┌ KioskShell-Kopfzeile ……………………………………… [ ⏱ Stempeln ] ┐   Knopf ≥ 48 px, Text sichtbar
└───────────────────────────────────────────────────────────┘
          ▼
┌ Overlay ──────────────────────────────────────────────────┐
│                                                            │
│   [        Kommen · Anna Berger        ]   56 px           │
│                                                            │
│   Andere Person          (nur mit Schalter kioskAnderePerson)
│                                                            │
│   ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ Schließt in 10 s · [Offen lassen]        │  ab 20 s Inaktivität
└────────────────────────────────────────────────────────────┘
          ▼ Tipp
┌ Ergebniskarte 2000 ms ─────────────────────────────────────┐
│  ✓  Kommen 07:58 · Anna Berger           (24 px)            │
│     Falsche Person? Rückgängig (8 s)                        │
└────────────────────────────────────────────────────────────┘
```

- **Fall A** (Standard): die am Kiosk angemeldete Person stempelt sich selbst (`stempeln()` ohne `mitarbeiter`, Sitzung der Person).
- **Fall B** (Schalter `kioskAnderePerson`): Bedienerkacheln (Avatar 48) → PIN-Ziffernblock (Tasten 56 px, `ph_core.api.bediener.verify_pin`) → Kommen/Gehen als diese Person. Voraussetzung: Fundament liefert eine kurzlebige Sitzung der Person nur für diese eine Aktion (danach zurück zur Kiosk-Person). Ohne diese Voraussetzung bleibt Fall B ausgeblendet.
- Toast-Position oben Mitte. Offline: Eintrag in IndexedDB-Warteschlange mit lokalem Zeitstempel, Band „1 Buchung wartet“; Einspielen nach Rückkehr per `insert PH Zeiterfassung` (Kommen) bzw. `setzeWert gehen` mit gespeicherter Zeit; Kennzeichen „offline erfasst 07:58“ als Kommentar an der Buchung (bis § 12 A1 `quelle`).
- Montage/Technik: nur Anwesenheit. „Beginn/Ende Montage“ ist Projektzeit und gehört in das Projekte-Konzept (`PH Projektzeit`).

---

## 5. Seiten

### 5.1 `/personal` – Übersicht (T1)

```
┌ Zentrale › Personal                                                       [+ Neu ▾] ┐
│ Personal                                                                             │
│ Mein Bereich | Übersicht | Stellen | Bewerbungen 3 | Gespräche | Team 2 | Mehr ▾      │
├ ZU ERLEDIGEN ─────────────────────────────────────────────────────────────────────────┤
│ Anna Berger · Urlaub 23.–27.11. · Vertretung Lena Koch · Verkauf dann 2 von 4 da       │
│                                                       [Genehmigen] [Ablehnen …]        │
│ 3 neue Bewerbungen · älteste vor 2 Tagen                              [Sichten]        │
│ Mira Test · Gespräch heute 10:00 · Vor Ort                            [Öffnen]         │
│ Tom Schmid · Gehen fehlt (gestern)                                    [Nachtragen]     │
│ Küchenplaner:in läuft in 6 Tagen ab                                   [+60 Tage]       │
│ … und 2 weitere                                                                       │
├ KENNZAHLEN (max. 4) ──────────────────────────────────────────────────────────────────┤
│ Aktive Stellen 5      Offene Bewerbungen 9     Heute abwesend 2      Löschfrist fällig 0│
│ 1 ohne Entgelt        älteste vor 2 Tagen      (Art nur Leitung)     nächste in 12 Tagen│
├ HEUTE IM HAUS (Leitung, GF) ──────────────┬ BEWERBUNGEN NACH QUELLE ───────────────────┤
│ ● Anna Berger   im Haus                    │ Zu wenige Daten für ein Diagramm.         │
│ ● Lena Koch     im Haus                    │ Bericht öffnen →                          │
│ ○ Max Muster    abwesend bis 07.11.        │ (ab 20 Bewerbungen: horizontale Balken    │
│ – Tom Schmid    –                          │  mit absoluten Zahlen)                    │
├ KÜRZLICH ─────────────────────────────────┴───────────────────────────────────────────┤
│ Lena Koch hat Sarah Beispiel (Küchenplaner:in) gesichtet · vor 20 Minuten              │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

- **Zu erledigen** (`ZuErledigen`): sortiert nach Fälligkeit, max. 8 Zeilen, dann „… und n weitere“ (aufklappbar). Zeilenquellen und Rollen:
  | Zeile | Quelle | Rolle | Inline-Aktion |
  |---|---|---|---|
  | Antrag (Urlaub, ZA, …) mit Zeitraum, Vertretung, Teamstärke | `PH Abwesenheit` Beantragt, Teamstärke aus Team-Flags und genehmigten Abwesenheiten | Leitung | Genehmigen (A) · Ablehnen … |
  | Krankmeldung „Gemeldet“ | dto. Art Krankenstand | Leitung | Zur Kenntnis genommen (A) |
  | n neue Bewerbungen | Number Card PH Neue Bewerbungen | Leitung, Sachbearbeitung | Sichten → Sichtungsmodus |
  | Gespräch heute/morgen | PH Bewerbungsgespraech Geplant | Leitung, Sachbearbeitung | Öffnen |
  | Gespräch vorbei ohne Ergebnis | Geplant, `start` < jetzt | dto. | Ergebnis erfassen |
  | Gehen fehlt | PH Zeiterfassung Offen, `datum` < heute (eine Zeile je Buchung, Scheduler-Duplikate gruppiert) | Leitung | Nachtragen (Inline-Zeitfeld) |
  | Korrekturanfrage | PH Aufgabe mit Kennung `personal:korrektur` | Leitung | Übernehmen · Ablehnen |
  | Stelle läuft in ≤ 7 Tagen ab / automatisch pausiert | PH Stelle `gueltig_bis` | Leitung | +60 Tage (A) |
  | Bewerbung ohne Entscheidung seit 30 Tagen | `eingang`, offener Status | Leitung | Öffnen (Schwelle: Konstante, Inhaber bestätigt) |
  | Website-Bewerbung ohne Unterlagen (10 min nach Eingang) | `quelle=Website`, `unterlagen` leer | Sachbearbeitung | Unterlagen anfordern (Mail-Dialog) |
  | Ein-/Austritt in 14 Tagen, offene Onboarding-Punkte | PH Mitarbeiter `eintritt`/`austritt` | Leitung | Öffnen |
  Leer: „Alles erledigt“ mit Häkchen in Sand.
- **Kennzahlen:** Aktive Stellen (Card PH Aktive Stellen, Fuß `count(Aktiv, entgelt_vollstaendig=0)`), Offene Bewerbungen (`status in Eingegangen…Angebot`, Fuß „älteste vor n Tagen“), Heute abwesend (`anzahl_heute_abwesend`; Aufteilung nur Leitung/GF, über `getList` mit Maskierung), Löschfrist fällig (Leitung; Card PH Loeschfrist faellig). Ohne Daten „–“ mit Tooltip „Noch keine Werte“; Trend nur mit Vorperiode aus derselben Quelle, sonst „Kein Vergleich“.
- **Heute im Haus** (Leitung, GF): Zustand „im Haus“ / „abwesend bis …“ / „–“. **Keine Uhrzeiten** (E9; Uhrzeiten nur in der Personalakte für Leitung). Leer vor erster Buchung: „Noch niemand gestempelt. Erste Buchungen erscheinen hier.“
- **Charts** nur bei ≥ 20 Bewerbungen im Zeitraum: Bewerbungen nach Quelle (horizontale Balken, absolute Zahlen), Bewerbungen je Woche (12 Wochen). Darunter: Hinweiszeile + „Bericht öffnen“. Daten als `<details>`-Tabelle.
- **Kürzlich:** `aktivitaetsStrom` gefiltert auf Personal-DocTypes, Personen statt Nummern, ohne Inhalte aus permlevel 1. Leer: „Noch keine Aktivität“.
- Primäraktion „+ Neu ▾“: Bewerbung · Stelle · Gespräch · Abwesenheit für eine Person (Leitung) · Buchung nachtragen (Leitung) – nach Recht gefiltert.
- Kürzel: `⌘Enter` öffnet Neu-Menü, `r` neu laden (Fundament-Registry).

### 5.2 `/personal/meins` – Mein Bereich (T1)

```
Telefon 375 px                                    Desktop: zwei Spalten (Heute | Abwesenheiten)
┌─────────────────────────────────────┐
│ Guten Morgen, Lena    Mi 04.11.      │
├ MEINE ABWESENHEITEN ────────────────┤
│ Urlaub 22.–31.12.   Beantragt        │
│                      [Stornieren]    │  Textknopf 44 px, keine Wischgeste
│ Zeitausgleich 31.10. Genehmigt       │
│ Alle anzeigen →                      │
├ DIESE WOCHE ────────────────────────┤
│ [Mo 8:33][Di 8:12][Mi läuft][Do –]→ │  Chips 44×56 px, horizontal scrollbar, heute fokussiert
├─────────────────────────────────────┤
│ Heute bisher        4:12 h           │  Instrument Sans 32/500 tabular
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬░░░░░  (Tagessoll-Anteil, 4 px, accent)
│ Kommen 07:55                         │
│ [            Gehen            ]      │  sticky unten (Daumenzone), Safe-Area
│  jetzt 12:07                         │
│ Urlaub beantragen · Krank melden     │
└─────────────────────────────────────┘
```

- **Stempelkarte** wie Popover § 4.1, auf dem Telefon sticky unten. Ohne Buchung heute: „Noch keine Buchung heute“ + „Kommen“. Kein Mitarbeiter-Datensatz: Fehlerblock „Dein Benutzer ist noch keinem Mitarbeiter zugeordnet.“ + „Leitung bitten“ (PH Aufgabe).
- **Konto-Block** nur mit Schalter `konten`: „Stundensaldo Oktober (ohne Zuschläge) +2:15 h“, ab `saldoLaufenderMonat` zusätzlich „Saldo bis gestern“ + klein „Soll Monat 161:42 · noch 19 Arbeitstage“; Urlaub je Urlaubsjahr „Rest 2026: 9,5 Tage · Rest 2025: 3 Tage (verjährt am …)“. Kein Hinweis auf Verfall oder fehlenden Übertrag. Schalter aus: Block fehlt ganz.
- **Meine Abwesenheiten:** letzte 3 + offene; „Stornieren“ nur bei Beantragt (A); bei Genehmigt vor Beginn ohne Schalter `stornoGenehmigtSelbst`: Text „Bereits genehmigt – die Leitung kann stornieren“ + „Leitung bitten“. Leer: „Noch keine Anträge 2026. Urlaub beantragst du mit einem Zeitraum.“ + „Urlaub beantragen“.
- **Team diese Woche** nur mit `teamSelbstservice`: Namen + „abwesend“ + Zeitraum. Leer: „Diese Woche sind alle im Haus.“
- Laden: Stempelkarte zuerst (eigene Suspense, Skeleton Knopfhöhe 44 px), dann Rest.
- Telefon ist für Mein Bereich ausdrücklich zugelassen (Ausnahme zu 02 § 11.1, W10).

#### Sheet „Urlaub beantragen“ (480 px; Telefon Bottom-Sheet)

| Feld | Typ | Regel |
|---|---|---|
| Art | Segment: **Urlaub** (vorgewählt) · Zeitausgleich · Fortbildung · Weitere ▾ (Pflegefreistellung, Sonderurlaub, Unbezahlt) | Krankenstand nicht hier (eigener Sheet) |
| Zeitraum | ein Bereichsfeld, mobil nativer Picker | Pflicht |
| Halber Tag | Schalter, erscheint nur bei 1 Tag | `halbtags` |
| Vertretung | Link PH Mitarbeiter | nur Leitung/Sachbearbeitung oder Schalter `vertretungSelbstservice` |
| Anmerkung | eingeklappt, Textarea | sichtbar nur für Leitung und Person selbst |

Live-Zeile unter dem Zeitraum: Schalter `konten` an → „5 Arbeitstage · Rest danach 4 Tage“; aus → „23.–27.11. · die Leitung prüft die Tage“. Mit `teamSelbstservice`: „Max Muster ist 24.–27.11. ebenfalls abwesend“.
Primär „Beantragen“ (`⌘Enter`) → `insert PH Abwesenheit` → Toast „Antrag gestellt – die Leitung wird benachrichtigt“. Fehler aus `validate` inline: „Überschneidung mit …“, „Halber Tag nur bei einem einzelnen Tag“, „Der Zeitraum enthält keinen Arbeitstag“, „Vertretung kann nicht die Person selbst sein“. `msgprint` Kontoüberschreitung → `warning`-Band (nur mit `konten`), Antrag bleibt möglich.

#### Sheet „Krankmeldung“

Felder: **Ab** (heute vorbelegt), **Voraussichtlich bis** (optional; leer = 1 Tag, weil `bis` Pflicht ist – Text darunter „Wenn es länger dauert, meldest du einfach eine Verlängerung.“). Hinweis „Die Leitung wird informiert. Eine Bestätigung reichst du nach, wenn sie verlangt wird.“ Primär **„Melden“** → `insert PH Abwesenheit {art: Krankenstand}` → Toast „Krankmeldung an die Leitung gesendet“. In Mein Bereich danach Zeile „Krank seit 04.11. · Gemeldet [Verlängern]“ (Verlängern = neue Meldung ab Folgetag, Sheet vorbelegt).
Fehlerfall Überschneidung mit eigenem genehmigtem Urlaub (App blockiert): Text „Du hast in diesem Zeitraum Urlaub. Die Leitung wird informiert und passt den Urlaub an.“ → PH Aufgabe an Leitung „Krankmeldung während Urlaub (UrlG § 5) – Urlaub anpassen“. Kein Fehler-Toast.

#### `/personal/meins/zeiten` (T2)

Tabelle je Kalendertag des Monats: Tag · Kommen · Gehen · Pause · Netto · Art · Status. Wochenenden `surface-2`. Monatsnavigation `←/→`, „Heute“.
- **Heute:** Inline-Bearbeitung Kommen/Gehen/Pause (B, 8 s). Inline-Zeitfelder: `↑/↓` ±5 min, `Shift+↑/↓` ±1 h, Schnellwahl-Chips „17:00 · 18:00 · wie gestern“.
- **Vergangene Tage:** nur lesend; Zeilenaktion **„Korrektur beantragen“** → Dialog (Kommen, Gehen, Pause, Grund Pflicht) → PH Aufgabe an Leitung mit alten/neuen Werten und Link (bis § 12 A11d). Zeile zeigt danach „Korrektur angefragt“.
- Fußzeile: Ist (Summe Netto), Abwesenheitstage als Liste; Soll/Angerechnet/Saldo nur mit `konten`.
- „Zeitnachweis (PDF)“ nur mit `zeitnachweisSelbst`; sonst „Zeitnachweis anfordern“ → PH Aufgabe an Leitung (AZG § 26 Abs 8: Übermittlung auf Verlangen).
- Leer: „Noch keine Buchungen im November.“ + „Buchung für heute nachtragen“ (nur heute zulässig).

#### `/personal/meins/urlaub` (T2)

Liste aller eigenen Abwesenheiten (Art, Zeitraum, Status, entschieden von/am, Ablehnungsgrund). Kontobalken nur mit `konten`. Primär „Urlaub beantragen“. Leer wie oben; Anspruch 0 (mit `konten`): „Für 2026 ist noch kein Urlaubsanspruch hinterlegt – bitte Leitung fragen.“ + „Leitung bitten“.

#### `/personal/meins/daten` (T5, lesend)

Eigene Stammdaten ohne permlevel 1 (nicht gerendert). „Änderung anfragen“ → PH Aufgabe an Leitung (bis § 12 A13 eigene Kontaktdaten).

### 5.3 `/personal/stellen` – Stellen (T2 | Kanban)

```
┌ Zentrale › Personal › Stellen                                    [+ Stelle anlegen] ┐
│ Stellen                                              Liste | Kanban                  │
├ [Entwurf 2] [Aktiv 5] [Pausiert 1] [Besetzt 3] [Archiviert] · Bereich ▾ · Ausmaß ▾ · /┤
│ Titel                       Bereich  Ausmaß    Entgelt     Gültig bis          Bew. Status      │
│ Küchenplaner:in             Planung  Vollzeit  ✓ 3.100 €   30.11.              7    Aktiv       │
│ Verkaufsberater:in Outdoor  Verkauf  VZ/TZ     ✓ 2.850 €   in 6 Tagen [+60]    2    Aktiv       │
│ Monteur:in                  Montage  Vollzeit  fehlt       –                   0    Entwurf     │
└ Auswahl (2): [Pausieren] [Archivieren] [Website aktualisieren] [Aushang drucken]     ┘
```

- Spalten: Titel, Bereich, Ausmaß, Entgelt (Badge aus `entgelt_vollstaendig` + Betrag), Gültig bis (≤ 7 Tage `warning` mit Inline-Aktion „+60“, überschritten `danger`), Bewerbungen (nicht gelöschte), Status. „Aktiv ohne Entgelt“ → `rot`.
- Standardfilter Entwurf · Aktiv · Pausiert. Kanban-Spalten Entwurf · Aktiv · Pausiert · Besetzt; Drag Entwurf → Aktiv = „Veröffentlichen“ (A); verletzte Bedingung → Karte zurück 200 ms + Dialog mit Checkliste aus `pruefen()` und Sprunglinks. Leere Spalte: „Keine Stellen“ gestrichelt 80 px.
- Zeilenaktionen: Öffnen · Auf Website ansehen · Duplizieren (B: „Kopie angelegt · Öffnen · Rückgängig“) · Aushang drucken · Pausieren/Wieder aktivieren (A) · Archivieren (A). Kein Löschen im UI (Archivieren statt Löschen).
- Sachbearbeitung bei Pausiert: statt „Wieder aktivieren“ Hinweis „Wieder aktivieren darf die Leitung“ + „Leitung bitten“.
- Massenaktionen mit Vorschau „3 von 4 möglich – 1 übersprungen (Entwurf)“.
- **Neu-Dialog „Stelle anlegen“** (`?neu=1`): Titel (Live-Vorschau „Adresse auf der Website: …/karriere/kuechenplanerin“), Bereich, Ausmaß; optional „Von Stelle kopieren ▾“ (= `duplizieren`). „Anlegen“ → `insert PH Stelle` (Entwurf) → Akte. Titelprüfung GlBG § 9 Abs 1 als Warnung (siehe 5.4).
- Leer: „Noch keine Stellen. Stellen erscheinen auf der Karriere-Seite, sobald sie aktiv sind.“ + „Stelle anlegen“. Gefiltert: „Keine Stellen mit Status ‚Archiviert‘“ + „Filter zurücksetzen“.

### 5.4 `/personal/stellen/[slug]` – Stellenakte (T5)

```
┌ Zentrale › Personal › Stellen › Küchenplaner:in                                      ┐
│ Küchenplaner:in · Planung · Vollzeit       Aktiv · GlBG vollständig ✓   [Pausieren] [⋯]│
│ Entwurf ─● Aktiv ─○ Besetzt ─○ Archiviert                                            │
├ Tabs: Stelle | Sprachen | Entgelt | Veröffentlichung | Bewerbungen 7 | Verlauf        ┤
│ STELLE (Formular)                                 ║ WEBSITE                           │
│                                                   ║ …/de/karriere/kuechenplanerin     │
│                                                   ║ gültig bis 30.11.2026 (26 Tage)   │
│                                                   ║ BEWERBUNGEN 7 · neu 2 · Gespräch 1│
│                                                   ║ NÄCHSTE SCHRITTE · ZEITLEISTE     │
└───────────────────────────────────────────────────╨───────────────────────────────────┘
```

- **Checkliste statt Band:** solange unvollständig steht unter dem Kopf die Checkliste aus `pruefen()` + Titelprüfung mit Sprunglinks („Entgelt fehlt → Tab Entgelt“, „Titel nicht erkennbar geschlechtsneutral → Feld Titel“ als gelber Punkt, blockiert nicht). Vollständig → nur Kennzeichen „GlBG vollständig ✓“ neben dem Status. Primär „Veröffentlichen“ deaktiviert mit Grund, wird ohne Neuladen aktiv.
- **Titelprüfung** (`titelpruefung.js`, Client + Server): erkennt `:in`, `*in`, `/in`, `-in`, `(m/w/d)`, `(w/m/d)`, `(d/m/w)` und Paarformen; sonst Warnung. Für `titel_en/fr/it` nur Hinweis.
- **Tabs:**
  - Stelle: `titel`, Adresse auf der Website (readonly, Tooltip „entsteht aus dem Titel und bleibt stabil“), `kategorie`, `beschaeftigungsart`, `positionen_anzahl`, `start`, `standort`, `erfahrung_jahre`, `stellenbeschreibung`, Kindtabellen `aufgaben_de`, `anforderungen_de`, `leistungen_de`, `arbeitszeit_de`.
  - Sprachen: Segment EN · FR · IT; **Übersetzungslayout**: je Feld links Deutsch (lesend, `surface-2`, 13 px), rechts Zielsprache; Kindtabellen zeilenweise nebeneinander. Fortschritt „EN 6/9 Felder“. Kein Kopieren aus Deutsch. Leer: „Französisch ist noch nicht übersetzt. Die Stelle erscheint auf der französischen Seite erst mit Titel und Beschreibung.“ (Anzeigeregel; Website-Prüfung als Anfrage § 12 A14).
  - Entgelt (GlBG § 9 Abs 2): `kv_mindest_brutto_cent` (BetragFeld), `entgelt_zeitraum`, `kollektivvertrag`, `ueberzahlung`/`ueberzahlung_text`; Live-Vorschau des Satzes `entgelt_text`; Feldhilfe zur Pflicht.
  - Veröffentlichung: `veroeffentlicht`, `gueltig_bis` (Schnellwahl +30/+60/+90), Website-Link, `ansprechpartner`, `bewerbung_email`, `seo_title` (Zähler ≤ 60), `besetzt_am`/`besetzt_durch` readonly; „Website aktualisieren“.
  - Bewerbungen: eingebettete Liste, „Kanban dieser Stelle“, „+ Bewerbung“ vorbelegt. Leer: „Noch keine Bewerbungen auf diese Stelle. Website-Bewerbungen landen automatisch hier.“
  - Verlauf: `Zeitleiste`; System-Felder (`quelle`, `sync_quelle`, `beispiel`, `notiz_intern` permlevel 1) eingeklappt nur Leitung. Leer: „Noch keine Einträge.“
- **Speichern:** Entwurf/Pausiert/Archiviert → Autosave 1 s („Gespeichert 14:02“). **Aktiv/Besetzt → kein Autosave**; Speicherleiste oben „Ungespeicherte Änderungen an einer veröffentlichten Stelle · [Vorschau] [Verwerfen] [Veröffentlichen ⌘S]“. Vorschau = Sheet 640 px mit gerenderter Karriere-Karte. Toast danach „Stelle aktualisiert · erscheint in wenigen Minuten auf der Website · Auf Website ansehen“. Ungespeichert verlassen → Rückfrage (einziger Fall im Bereich).
- **Workflow-Knöpfe** nur aus `getTransitions()`. „Als besetzt schließen“: genau eine eingestellte Bewerbung dieser Stelle → ohne Dialog (A) mit `als_besetzt(bewerbung)`; sonst Dialog mit optionalem Link-Feld.
- Konflikt (`modified`): Konfliktdialog mit Feld-Diff. Fehler aus `validate` unter dem Feld.

### 5.5 `/personal/bewerbungen` – Kanban | Liste

```
┌ Zentrale › Personal › Bewerbungen                                       [+ Bewerbung] ┐
│ Bewerbungen        Kanban | Liste     Stelle [Alle ▾] Zuständig [Alle ▾] /             │
│ Sprungleiste: Eingegangen 3 · Gesichtet 4 · Gespräch 2 · Angebot 1 · Eingestellt 2      │
├ EINGEGANGEN 3 [Sichten (3)] ─ GESICHTET 4 ── GESPRÄCH 2 ── ANGEBOT 1 ── EINGESTELLT 2 ─┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐                           │
│ │ Sarah Beispiel  │ │ Jonas Muster    │ │ Mira Test        │                           │
│ │ Küchenplaner:in │ │ Verkauf Outdoor │ │ Küchenplaner:in  │                           │
│ │ · vor 2 Tagen   │ │ · vor 8 Tagen   │ │ · vor 5 Tagen    │                           │
│ │ Website         │ │ Löschung in 9 T…│ │ Do 10:00 Vor Ort │  ← ein Kennzeichen        │
│ │ (AB)  ⧉ 3       │ │ (LK)  ⧉ 2       │ │ (AB)  ⧉ 4        │  ← Avatar + Anhänge       │
│ └─────────────────┘ └─────────────────┘ └──────────────────┘                           │
├ Abgeschlossen (eingeklappt): Abgesagt 14 · Zurückgezogen 3   [anzeigen]                  ┤
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Karte:** Zeile 1 Name (14/500); Zeile 2 Stelle · Alter (ab 7 Tagen `warning-text`); Zeile 3 genau ein Kennzeichen nach Vorrang Gesprächstermin > Löschuhr (ab 14 Tagen vor `loeschfrist`) > Quelle; Fuß Avatar `zugewiesen_an` + Anhangzahl. Nummer nur im Tooltip/Akte. **Keine Sterne auf dem Board.** Website-Bewerbung ohne Unterlagen nach 10 min: Kennzeichen „Keine Unterlagen“.
- **Eingestellt:** letzte 90 Tage, Fuß „Ältere im Bericht“. „Personendaten gelöscht“-Karten nur in Abgeschlossen (grau, nicht öffnenbar, Tooltip mit Datum).
- **Züge** (nur erlaubte Ziele aus Workflow + Rolle):
  | Von → Nach | Aktion | Ausführung |
  |---|---|---|
  | Eingegangen → Gesichtet | Sichten (M) | A |
  | Eingegangen/Gesichtet → Gespräch | Gespräch planen | öffnet Sheet § 6.2; aus Eingegangen führt die Server Action erst „Sichten“, dann `gespraech_anlegen` aus (App kennt keinen Direktübergang) |
  | Gespräch → Angebot | Angebot erstellen (L) | A |
  | Gespräch/Angebot → Eingestellt | Einstellen (L) | Assistent § 6.3; aus Gespräch erst „Angebot erstellen“, dann `einstellen` |
  | offen → Abgeschlossen | Absage senden (L) / Zurückziehen (M) | Dialog § 5.6 / Dialog Grund |
  | Abgeschlossen → Gesichtet | Zurück auf Gesichtet (L, nicht gelöscht) | Dialog mit Pflichtnotiz, Hinweis „Person hat bereits eine Absage erhalten – persönlich kontaktieren“ |
- **Verbotenes Ziel:** beim Ablegen Rückkehr 200 ms + Toast `role="status"` „Absagen darf nur die Leitung.“ + „Leitung bitten“. Menü „Verschieben nach …“ und Touch-Sheet listen gesperrte Ziele als deaktivierte Zeile mit sichtbarem Grund (12 px).
- **Touch:** Karte antippen → Sheet mit erlaubten Übergängen; iPad: Sprungleiste oben.
- **Mehrfachauswahl** (⌘/Strg+Klick): Sichten (A) · Zuweisen (B) · Absage senden (n) · Bewerbungsblätter drucken.
- Filter (URL): Stelle, Zuständig, Quelle, Eingang von/bis, Initiativ, Volltext. Gespeicherte Ansichten: Meine · Alle offenen · Löschfrist ≤ 30 Tage.
- **Liste:** Name · Stelle · Quelle · Eingang · Zuständig · Nächstes Gespräch · Löschfrist (Datum + Rest) · Status. CSV nur Leitung, protokolliert.
- **Neu-Dialog „+ Bewerbung“:** Pflicht `nachname`; `fieldset` „Kontakt (eines reicht)“ mit `email` und `telefon` und gemeinsamer Fehlermeldung unter beiden; `stelle` (leer = Initiativ), `quelle` (Standard E-Mail), `eingang` (jetzt); Pflicht-Checkbox **„Datenschutzinformation übermittelt“** + Weg (Select E-Mail · Post · persönlich · Website) – Weg als Kommentar bis § 12 A10; bei Quelle AMS/Empfehlung Hinweis „Art. 14 DSGVO: Information binnen eines Monats“. Checkbox **„Eingangsbestätigung senden“** (Standard an, wenn E-Mail): Mail über `frappe.core.doctype.communication.email.make` mit Vorlage aus `texte.js` inkl. Link zur Datenschutzinformation. „Weitere Angaben“: `anrede`, `vorname`, `sprache`, `verfuegbar_ab`, `plz_ort`, `anschreiben`. Drop-Zone (PDF/JPG/PNG/DOC/DOCX ≤ 10 MB, max. 10, privat). Duplikat-Hinweis bei gleicher E-Mail auch für abgeschlossene, nicht gelöschte Bewerbungen (nur Nummer + Status).
- Leer: „Noch keine Bewerbungen. Website-Bewerbungen landen automatisch hier; E-Mail- und Postbewerbungen erfasst du mit ‚+ Bewerbung‘.“ Gefiltert: „Keine Bewerbungen für Stelle ‚Monteur:in‘“ + „Filter zurücksetzen“. Spalte: „Keine Karten“ gestrichelt.

### 5.6 `/personal/bewerbungen/[name]` – Bewerberakte (T5) und Sichtungsmodus

```
≥ 1280 px
┌ Zentrale › Personal › Bewerbungen › Sarah Beispiel                                          ┐
│ (SB) Sarah Beispiel   [Küchenplaner:in]   Gesichtet    [Gespräch planen] [Absage senden] [⋯] │
│ Website · eingegangen 02.11. 09:12 · zuständig [A. Berger ▾]                                  │
│ Eingegangen ─● Gesichtet ─○ Gespräch ─○ Angebot ─○ Eingestellt     (Endzweig: Abgesagt …)     │
├ Tabs: Übersicht | Unterlagen 3 | Gespräche 0 | Bewertung | Datenschutz | Verlauf              ┤
│ [Lebenslauf] [Zeugnis] [Anschreiben]                 ║ PERSON                                │
│ ┌───────────────────────────────────────────────┐   ║ sarah@beispiel.invalid · +43 …        │
│ │                                               │   ║ 6900 Bregenz · verfügbar ab 01.01.2027 │
│ │        Dokumentansicht (60 %)                  │   ║ ANSCHREIBEN (3 Zeilen … mehr)          │
│ │        PDF/Bild, Seite 1/2                     │   ║ NÄCHSTE SCHRITTE                       │
│ │                                    [⤢] [↗ Tab] │   ║ LÖSCHFRIST offen – entsteht mit der    │
│ └───────────────────────────────────────────────┘   ║   Entscheidung (+ 7 Monate)            │
│                                                      ║ ZEITLEISTE                             │
└──────────────────────────────────────────────────────╨───────────────────────────────────────┘
Sichtungsmodus (?modus=sichten): Fußleiste sticky 56 px
│ 2 von 3   [Absage senden …]  [Später  Alt+↓]  [Gesichtet →  ⌘↵]  [Gespräch planen] │
```

- **Übersicht** = geteilte Ansicht ab 1280 px (Dokument 60 % / Person 40 %); erste Unterlage `art=Lebenslauf`, sonst erste PDF. < 1280 px: Dokument oben 70 vh mit Vollbild-Knopf. Dokumente über `/api/datei` (Rechteprüfung, privat); Knopf „In neuem Tab öffnen“ sichtbar, Dateiname + Seitenzahl als Text. Keine Unterlage: Drop-Zone als Leerfläche „Keine Unterlagen. Nachgereichte Dateien hier ablegen.“
- **Sichtungsmodus:** Start über „Sichten (n)“ (Spalte Eingegangen, Zu erledigen, Pill-Badge). `⌘Enter` = Gesichtet (A) + nächste, `Alt+↓` = Später, Kürzel sichtbar in der Fußleiste. Ende: „Alles gesichtet“ (Häkchen Sand) + „Zum Board“.
- **Primäraktion je Status:** Eingegangen → **Gespräch planen** (sekundär „Gesichtet“); Gesichtet → Gespräch planen; Gespräch → **Ergebnis erfassen**, wenn ein Gespräch vorbei und offen ist, sonst Leitung **Angebot erstellen**, Sachbearbeitung **Neuen Termin planen**; Angebot → **Einstellen** (L), für M kein Primär + Hinweis „Einstellen darf die Leitung“; Abgesagt → **Absagebrief drucken** (falls ohne E-Mail); Eingestellt → **Personalakte öffnen**. „Absage senden“ als sichtbarer Sekundärknopf für Leitung.
- **Menü ⋯:** Zurückziehen · Zuweisen (B) · Bewerbungsblatt drucken · Absagebrief drucken · E-Mail schreiben (Communication mit Referenz) · Unterlagen anfordern · Zurück auf Gesichtet (L). **Zusagebrief** ist ausgeblendet, bis die App ein vereinbartes Entgelt kennt (§ 12 A9; heutiger Brief nennt das KV-Mindestentgelt der Ausschreibung).
- **Tabs:**
  - Unterlagen: Kartenliste (Art, Bezeichnung, Größe, Datum), Nachreichen, Art ändern.
  - Gespräche: Liste mit Zustand; Primär „Gespräch planen“. Leer: „Noch kein Gespräch.“ + „Gespräch planen“.
  - **Bewertung** (nur permlevel 1, sonst nicht gerendert): Sterne als `radiogroup` (5 `radio` „3 von 5 Sternen“, Ziel 24 px, `1–5`/`←→` nur im fokussierten Feld, Zustand „Nicht bewertet“), `eindruck`, `gehaltsvorstellung_cent` (Zeitraum-Hinweis „brutto/Monat“), `notiz_intern`. Feldhilfe an allen Freitexten: **„Nur arbeitsbezogene Beobachtungen zu den Anforderungen der Stelle festhalten.“** (GlBG § 12 Abs 12). Band „Nur Leitung und Geschäftsführung sehen diesen Tab. Inhalte werden beim Löschlauf entfernt.“ Leer: „Noch keine Bewertung. Nach dem Gespräch hier festhalten.“
  - **Datenschutz:** Datenschutzinformation (erhalten am, Weg); **Löschfrist-Karte** groß: „12.06.2027 · in 184 Tagen“ (absolutes Datum immer im Text), Herkunft „Entscheidung 12.11.2026 + 7 Monate (Einstellungen)“; Einwilligung zur längeren Aufbewahrung + bis. Knöpfe: **„Aufbewahrung verlängern“** (B; Dialog Datum Standard +12 Monate, Pflicht-Checkbox „Einwilligung der Person liegt vor (E-Mail/Brief in den Anhängen)“; Datum in Vergangenheit → Feldfehler) und **„Auf Wunsch der Person sofort löschen“** (L; Bestätigung mit Liste der betroffenen Daten, Tippfeld „löschen“ mit sichtbarem Hinweis „Tippe löschen zur Bestätigung“, `autocapitalize="off" autocorrect="off" spellcheck="false"`, Groß/klein egal, Fokus auf Abbrechen, Primär „Endgültig löschen“). Offene Bewerbung → Knopf deaktiviert mit Controller-Text. Nach dem Löschen ergänzt die Server Action, solange § 12 A2 fehlt: verknüpfte Gespräche (`bewerber`, `notiz`, `bewertung`, `weitere_teilnehmer`, `ort` leeren), Kalender-Event und ToDo der Zuweisung löschen; nicht erreichbare Teile (Email Queue) → Ergebniszeile „Teil nicht gelöscht: Mail-Warteschlange – Admin informiert“ + PH Aufgabe.
  - Verlauf: Zeitleiste (Statuswechsel, Mails, Kommentare). System-Felder eingeklappt nur Leitung.
- **Absage-Dialog** (P2-Dialog, Einzel und Serie): Grund als Chips (Qualifikation · Anderer Kandidat · Stelle besetzt · Keine Rückmeldung · Gehaltsvorstellung · Sonstiges); **Versandweg** Segment E-Mail (Standard, wenn `email`) · Post · Telefon · Persönlich; Mailvorschau aus `absage_text` mit Anrede-Logik; bei `sprache ≠ de` Hinweis „Vorlage ist deutsch – Text vor dem Senden prüfen“ und Alternative „Eigene E-Mail schreiben“ (bis § 12 A10 `absage_senden(text)`). Primär „Absage senden“ → Toast „Absage wird in 10 s gesendet · Rückgängig“; nach Commit `absage_senden(grund, per_mail)` + Kommentar „Absage per <Weg> am <Datum>“ → Toast „Absage an Sarah Beispiel gesendet · Löschfrist 12.06.2027“. Post: setzt per_mail = 0 und bietet „Absagebrief drucken“. Mail-Fehler (`msgprint` orange): `warning`-Toast „Status gesetzt, aber die E-Mail konnte nicht gesendet werden“ + „Erneut senden“.
  Serie: eine Vorschau mit Platzhalter „Anrede je Person“ + Empfängerliste mit Anrede-Spalte; Ausreißer oben (Sprache ≠ de, ohne E-Mail → landen im Sammeldruck „Absagebriefe (n)“).
- Zustände: Personendaten gelöscht → reduzierte Akte (Nummer, Stelle, Status, Statistik, Zeitleiste), Band mit Datum, keine Aktionen. `not_found` → 404 mit Suche. `forbidden` → `kein-zugriff`.
- Kopf < 1280 px: Phasenleiste kompakt („Schritt 2 von 5 · Gesichtet“), `aria-current="step"`, Endzweig mit Form + Text.

### 5.7 `/personal/gespraeche` – Woche | Liste

- Woche Mo–Sa, 08–19 Uhr; Ereignis = Gespräch (Zeit, Name, Stelle, Modus, Avatar Gesprächsführung) mit Statuston + Icon. Abwesenheiten der Gesprächsführung als Schraffur **und** Text am Tagesanfang „A. Berger abwesend“ (ohne Art, außer Leitung).
- **Umplanen:** Drag verschiebt `start` (B, Dauer bleibt); Alternative ohne Drag: Panel-Aktion „Verschieben …“ (Datum/Zeit-Dialog). Überschneidungs-`msgprint` → `warning`-Toast, Speichern erfolgt.
- **Panel** (Sheet 480 px; Telefon Vollbild) – Primär nach Zustand: Geplant ohne Kalendereintrag → „In Kalender eintragen“; Geplant, Zukunft → kein Primär, Zeile „Morgen 10:00 · Vor Ort · Bestätigung offen“ + sekundär „Bewerber hat bestätigt“ (`bestaetigt_am`); Geplant, vorbei → **„Ergebnis erfassen“** (Dialog Ergebnis-Segment Weiter im Verfahren · Angebot · Absage · Offen + nächster Schritt → `abschliessen`; „Angebot“ setzt Bewerbung auf Angebot, „Absage“ bietet Absage-Dialog); Durchgeführt → „Bewerbung öffnen“. Im ⋯: Termin absagen (A), Nicht erschienen (A), Verschieben …. Bewertung/Notiz als Abschnitt im Panel (permlevel 1). Leer Teilnehmende: „Nur die Gesprächsführung nimmt teil.“
- Liste: Beginn · Bewerber · Stelle · Modus · Ort · Gesprächsführung · Status · Ergebnis; Standardfilter Geplant ab heute.
- Leer Woche: „Keine Gespräche in KW 45“ + „Gespräch planen“; Liste leer: „Noch keine Gespräche. Gespräche entstehen aus einer Bewerbung.“; gefiltert: „Keine Gespräche mit diesem Filter“ + „Filter zurücksetzen“.
- Tastatur: Zeitraum `←/→`, „Heute“-Knopf; Ereignisse per Tab erreichbar, `Enter` öffnet Panel.

### 5.8 `/personal/team` – Kalender · Personen · Buchungen · Anträge

```
┌ Zentrale › Personal › Team                                         [+ Abwesenheit ▾] ┐
│ Team     Kalender | Personen | Buchungen | Anträge 2                                  │
│ Anwesenheit | Stunden        Woche | Monat      ‹ KW 45 · 02.–08.11. ›  Team ▾        │
├──────────────┬────────┬────────┬────────┬────────┬────────┬────────┬────────╥─────────┤
│ Person       │ Mo 02  │ Di 03  │ Mi 04 ┃│ Do 05  │ Fr 06  │ Sa 07  │ So 08  ║ Ist     │
│ Anna Berger  │ 8:33   │ 8:12   │ läuft ┃│        │        │        │        ║ 16:45   │
│ Lena Koch    │ ═UR════════════════════╪════════╡        │        │        ║ 0:00    │
│ Max Muster   │ ░AB░░░░░░░░░░░░ (Sachbearbeitung)│        │        │        ║ –       │
│ Tom Schmid   │ 6:10   │ ●offen │        │        │        │        │        ║ 6:10    │
├──────────────┴────────┴────────┴────────┴────────┴────────┴────────┴────────╨─────────┤
│ Verkauf: heute 2 von 4 im Haus                                                         │
└───────────────────────────────────────────────────────────────────────────────────────┘
  Spalte Person sticky links · Summen sticky rechts (Schattenkante 8 px) · heute = 2-px-Linie accent
```

- **Kalender:** `role="grid"`, Zellen `<button>` mit `aria-label` „Anna Berger, Dienstag 3. November, 8 Stunden 12 Minuten“; Pfeiltasten Zelle zu Zelle, `Pos1/Ende`, `Strg+Pos1`, `Enter` Tagespanel. Woche: 7 Spalten à 96 px mit Zahl + Band; Monat: Zellen 28 px ohne Zahl (Farbe + Kürzel), Zahl im Tagespanel; iPad quer nur Woche. Bänder durchgehend, Radius 4, Kürzel einmal am Bandanfang: `UR` Urlaub · `ZA` Zeitausgleich · `FB` Fortbildung · `PF` Pflege · `SU` Sonderurlaub · `UB` unbezahlt · `KR` Krankenstand (nur Leitung) · `AB` abwesend · `BR` Betriebsruhe; beantragt = gleiches Kürzel + Schraffur + `aria-label` „…, beantragt“. Feiertage erst mit ph_core B1 (bis dahin keine Markierung und für Leitung Band „Feiertage sind noch nicht hinterlegt“, je Monat schließbar).
- **Summenspalten:** Schalter `konten` aus → nur **Ist**; an → Soll bis gestern · Ist · Angerechnet · Stundensaldo · Offen. Teamzeile „Verkauf: heute 2 von 4 im Haus“ aus Team-Flags (`team_verkauf/planung/montage`).
- **Tagespanel** (Sheet 480 px): Buchungen des Tages mit Inline-Korrektur (Leitung, B), „Gehen jetzt“ (`gehen_jetzt`, nur heute), „Buchung nachtragen“ (Dialog Datum ≤ heute, Kommen, Gehen, Pause, Art, Notiz Pflicht bei Nachtrag durch Leitung). Fehler aus `validate` inline („Zeitbuchungen in der Zukunft sind nicht möglich“, „Überschneidung mit Buchung …“, „Es gibt bereits eine offene Buchung …“). > 10 h → `warning`-Band „mehr als 10 Stunden – AZG prüfen“ (Lehrling: Hinweis ab 8 h, sobald § 12 A15 Jugendschutz liefert).
- **Personen:** Karten/Tabelle: Name + Foto, Rolle, Teams, Ausmaß, h/Woche, Eintritt, Status, heute (im Haus/abwesend/–). Saldo/Resturlaub-Spalten nur Leitung **und** `konten`. Zeilenaktionen: Öffnen · Abwesenheit anlegen (L) · Austritt erfassen (L). Neu-Dialog Mitarbeiter: Pflicht `vorname`, `nachname`, `rolle_intern`, `eintritt`; häufig `beschaeftigungsart`, `wochenstunden`, `urlaubsanspruch_tage`, `user` (Hinweis „Ohne Benutzer keine Zeiterfassung und kein Selbstservice“), Teams, dienstliche Kontakte. Leer: „Noch keine Mitarbeiter. Lege das Team an, damit Zeiterfassung und Urlaub funktionieren.“
- **Buchungen:** Liste PH Zeiterfassung (Standard aktueller Monat): Datum · Person · Kommen · Gehen · Pause · Netto · Art · Status · Kennzeichen (offline, Pause vorgeschlagen, Korrektur angefragt). Chips Offen/Erfasst/Korrigiert. Offene: Inline „Gehen“ mit Schnellwahl. Massenaktion „Pause 30 min setzen“ (A; nur Erfasst ohne Pause, Brutto > 6 h, Vorschau). Kein Löschen im UI. Leer: „Noch keine Buchungen im November.“; gefiltert: „Keine Buchungen mit diesem Filter“.
- **Anträge:** Beantragt/Gemeldet zuerst; Zeile 2-zeilig „Anna Berger · Urlaub · 23.–27.11. · Vertretung Lena Koch“ / „Verkauf dann 2 von 4 im Haus“ (`warning-text` unter der Hälfte), Tage/Rest nur mit `konten`. Aktionen: Genehmigen (A, `⌘Enter`), Ablehnen … (`Shift+A`, Pflicht `ablehnungsgrund`, Primär deaktiviert bis Text), bei Krankenstand nur „Zur Kenntnis genommen“ (A). **Eigener Antrag und Antrag der eigenen Person** (Mitarbeiter.user = Sitzung, auch wenn jemand anderes ihn angelegt hat): kein Knopf, Text „Eine andere Person mit Leitungsrecht entscheidet“. Von der Leitung selbst angelegte Anträge für andere: kein Knopf, Text „Von dir angelegt – eine andere Person mit Leitungsrecht entscheidet“ (App-Regel `owner`, bis § 12 A12). Hover/Fokus hebt die Tage im Kalender hervor. Massen: Genehmigen (n) mit Überspringen-Vorschau. Leer: „Alles erledigt – keine offenen Anträge“ (Häkchen Sand).
- **„+ Abwesenheit ▾“** (Leitung): für eine Person anlegen (Sheet wie Urlaub, mit Person-Feld und Art inkl. Krankenstand für telefonische Meldungen) – Hinweis im Sheet „Du kannst diesen Eintrag danach nicht selbst bestätigen.“ solange `gleichGenehmigen` aus.
- Druck: Monatsblatt A4 quer (`@media print`), Legende, Stand/Benutzer in der Fußzeile; Art-Sichtbarkeit wie am Bildschirm.

### 5.9 `/personal/mitarbeiter/[name]` – Personalakte (T5)

- Kopf: Foto 64, Name 20/500, Rolle · Ausmaß, Status, „seit 01.03.2024 · Benutzer verknüpft (Selbstservice aktiv)“; offene Onboarding-Punkte als Chips (sobald § 12 A16). Primär **„Abwesenheit anlegen“** (L). ⋯: Zeitnachweis drucken (Monat-Dialog; bis § 12 A11c setzt die Server Action `zeitnachweis_monat` und druckt – nur Leitung), Austritt erfassen, Bewerbung öffnen, Benutzer öffnen.
- **Tabs** (Standard `?tab=zeiten`):
  - Zeiten: Monatstabelle wie Meine Zeiten, Leitung korrigiert inline (B; Status „Korrigiert“ mit `korrigiert_von/_am` als Tooltip), Uhrzeiten sichtbar (Leitung, GF). Summen nach Schalter `konten`. Leer: „Keine Buchungen im November.“
  - Stammdaten: Felder wie App (`vorname` … `user`), `wochenstunden`/`urlaubsanspruch_tage` mit Platzhalter „Standard aus Einstellungen“. Hinweis bei Änderung von `wochenstunden`: „Die App rechnet heute alle Monate mit dem neuen Wert – abgeschlossene Zeitnachweise vorher drucken.“ (bis § 12 A5 Arbeitszeitmodell mit Gültigkeit).
  - Urlaub & Abwesenheit: Liste aller Abwesenheiten mit Aktionen wie § 5.8; Jahresstreifen (12 Zeilen). Konto nur mit `konten`. Leer: „Noch keine Abwesenheiten.“
  - Vertraulich (permlevel 1; sonst nicht gerendert): Geburtsdatum, private Kontakte, Notfallkontakt, Hinweise; Band „Nur Leitung und Geschäftsführung. Änderungen werden protokolliert.“ Leer: „Keine vertraulichen Angaben hinterlegt.“
  - Dokumente: Anhänge (privat) mit Art-Präfix im Dateinamen (bis § 12 A13). Leer: „Noch keine Dokumente – Dienstzettel, Führerschein, Schulungen hier ablegen.“
  - Verlauf: Zeitleiste; Versionen vertraulicher Felder nur permlevel 1.
- Fehler aus `validate` als Feldfehler („Austritt liegt vor dem Eintritt“, „Für ‚Ausgetreten‘ bitte das Austrittsdatum eintragen“, „Wochenstunden können nicht negativ sein“).

### 5.10 `/personal/datenschutz` – Löschfristen-Cockpit (Leitung)

- Kopf: „Löschfristen Bewerberdaten · Der Löschlauf arbeitet täglich um 03:15 automatisch.“ Ansicht (Offen · Mit Aufbewahrung · Gelöscht · Alle), Horizont (30 Tage).
- Kennzahlen: Fällig (Card; 0 = Häkchen) · In 14 Tagen · Mit Aufbewahrung (Filter `einwilligung_evidenz = 1`) · Gelöscht im Jahr.
- Tabelle aus Report PH Loeschfristen: Person – Stelle · Status · Entschieden · Löschfrist (Datum + Rest) · Unterlagen · Zustand. Ansicht „Gelöscht“: ohne Personennamen.
- Primär „Fällige jetzt löschen (n)“ – deaktiviert bei 0 mit Tooltip „Nichts fällig – nächster Löschlauf heute 03:15“; Tippfeld-Bestätigung; Fortschritt im Knopf „2/2“. Zeilen: Aufbewahrung verlängern (B) · Bewerbungsblatt drucken.
- Reiter **„Beschäftigte“** erscheint mit § 12 A17 (Aufbewahrung Zeit-/Stammdaten); bis dahin Zeile „Für Beschäftigtendaten ist noch keine Frist hinterlegt (Steuerberater klärt)“.
- Leer: „Keine Löschfristen in den nächsten 30 Tagen“ + Häkchen.

### 5.11 `/personal/berichte/[report]` (T8)

| Route | Report | Filter | Besonderheit |
|---|---|---|---|
| bewerbungsstatistik | PH Bewerbungsstatistik | von/bis (12 Monate), nach Stelle/Quelle | Quoten „–“ bei n < 5 je Gruppe |
| loeschfristen | PH Loeschfristen | ansicht, tage | ohne Aktionen |
| monatsstunden | PH Monatsstunden | jahr, monat, mitarbeiter, mit_ausgetretenen | **nur mit `konten`**; Saldo neutral (kein Rot/Grün), Spalte „Angerechnet“ |
| abwesenheiten | PH Abwesenheiten | jahr, mitarbeiter | **nur mit `konten`**; Krank-Spalte nur Leitung/GF |

Gemeinsam: Enter führt aus, Summenzeile, CSV nur Leitung (protokolliert), Druck A4 quer ab > 6 Spalten mit Filterzeile. Report > 8 s: „Bitte Person oder Team wählen“. Leer: „Keine Daten im Zeitraum“. Ohne Schalter: Route zeigt „Dieser Bericht wird freigeschaltet, sobald Feiertage und Arbeitszeitmodelle hinterlegt sind.“

### 5.12 `/personal/einstellungen` (T9)

Abschnitte Bewerbungen (`loeschfrist_monate` mit Hilfe „mindestens 6 Monate – GlBG § 15“, `bewerbung_email`, `standard_ansprechpartner`, `absage_text`/`zusage_text` mit Vorschau), Arbeitszeit (`standard_wochenstunden`, `urlaubsanspruch_tage`, `pause_ab_minuten`, `pause_minuten`), Website (`standort`, `website_revalidate_aktiv`). `⌘S`; Feldfehler aus `validate`.

---

## 6. Dialoge und Assistenten

### 6.1 Neu-Dialoge (ein Bildschirm)
Stelle (§ 5.3), Bewerbung (§ 5.5), Mitarbeiter (§ 5.8), Urlaub/Krankmeldung (§ 5.2), Abwesenheit für eine Person (§ 5.8), Buchung nachtragen (§ 5.8). Alle: `Esc` schließt ohne Rückfrage, wenn nichts eingegeben wurde; sonst Rückfrage.

### 6.2 Sheet „Gespräch planen“ (640 px, ein Bildschirm)

```
┌ Gespräch mit Sarah Beispiel planen ──────────────────────────────────────┐
│ Gesprächsführung [A. Berger ▾]  Modus [Vor Ort|Video|Telefon]  Dauer [30|45|60|90] │
│ ‹ KW 45 ›   Mo 03   Di 04   Mi 05   Do 06   Fr 07   Sa 08              │
│ 09:00        ○       ●       ○       ○       ○      –                  │  ○ frei · belegt = Text „belegt“
│ 10:00        ○      belegt   ○       ○      abw.    –                  │
│ …                                                                      │
│ Ort / Video-Link [ Showroom Lochau ]   Weitere Teilnehmende [ … ]       │
│ [x] In Kalender eintragen                                              │
│                                              [Abbrechen] [Gespräch anlegen] │
└────────────────────────────────────────────────────────────────────────┘
```
- Slots (`slots.js`, rein): frei = keine geplanten Gespräche der Gesprächsführung, keine genehmigte Abwesenheit, innerhalb der Öffnungszeit (PH Einstellungen ph_core), Betriebsruhe ausgeblendet. Raster aktualisiert live bei Änderung oben. `radiogroup`, Pfeiltasten über freie Slots, belegte nicht fokussierbar, Text vorgelesen.
- Aus Kalender `n`/„+ Gespräch planen“: zusätzlich Feld „Bewerbung“ oben (Link, nur offene).
- Ausführung: (Eingegangen → `Sichten`), `gespraech_anlegen(start, dauer_min, modus, ort, verantwortlich)`, optional `kalender_eintragen`. Ergebnis-Toast „Gespräch Do 10:00 angelegt · Öffnen“ + „Einladung per E-Mail schreiben“ (Mail-Dialog mit Vorschlagstext, bis § 12 A10 `gespraech_einladen`).
- Kein freier Slot: „Keine freie Zeit für A. Berger in KW 45.“ + [Nächste Woche] [Andere Gesprächsführung] [Zeit frei eingeben] (mit Überschneidungs-Warnung).

### 6.3 Assistent „Einstellen“ (3 Schritte, Leitung)

1. **Eintritt und Ausmaß:** Eintritt (Standard `verfuegbar_ab`), Rolle, Ausmaß, Wochenstunden, Urlaubsanspruch. Hinweis „ÖGK-Anmeldung vor Arbeitsantritt (ASVG § 33), Dienstzettel unverzüglich (AVRAG § 2)“ als Checkliste ohne Speicherung bis § 12 A16.
2. **Zugang:** Benutzer anlegen (E-Mail dienstlich) – Rollen als Checkboxen **ohne Vorauswahl außer PH Personal Selbstservice**. Fehlt das Recht `User create` → Teilschritt wird als PH Aufgabe an Backoffice-Admin angelegt. Ohne E-Mail: Hinweis „Ohne Benutzer keine Zeiterfassung“ (Entscheidung Inhaber offen, § 12 D).
3. **Stelle und übrige Bewerbungen:** Stelle als besetzt schließen? Weitere offene Bewerbungen dieser Stelle anzeigen („4 weitere offen – danach absagen?“). Zusammenfassung.

Ausführung (Server Action `einstellenAction`, idempotent `personal:einstellen:<bewerbung>:<uuid>`): (a) aus Gespräch zuerst Workflow „Angebot erstellen“; (b) **Schutz gegen Doppelanlage**: `getList PH Mitarbeiter {bewerbung}` – existiert schon einer, wird `einstellen` nicht erneut aufgerufen, sondern Workflow „Einstellen“ + `setValue mitarbeiter`; (c) sonst `einstellen(eintritt, rolle_intern, stelle_schliessen)`; (d) `setValue` Ausmaß/Wochenstunden/Urlaub; (e) Benutzer.
**Ergebniskarte** mit Teilschritten: ✓ „Personalakte PH-MA-0013 angelegt“ · ✓ „Bewerbung auf Eingestellt“ · ✗ „Benutzer nicht angelegt: E-Mail bereits vergeben“ [Erneut] · – „Stelle offen gelassen“. Kein Rollback der Personalakte. Folgeaktionen: „Übrige Bewerbungen absagen (4)“, „Onboarding-Aufgaben anlegen“ (Vorlage `onboarding.js`: ÖGK-Anmeldung, Dienstzettel, Datenschutzinformation Beschäftigte, Unterweisung, Schlüssel, Einweisung Kassa, Erstgespräch nach 4 Wochen). Kein Zusagebrief (§ 5.6).

### 6.4 Assistent „Austritt erfassen“ (2 Schritte, Leitung)

1. Austrittsdatum, Grund (nur Kommentar). Anzeige offene Buchungen; Resturlaub/Saldo nur mit `konten` (dann aus `austritt_konto`, § 12 A7).
2. Checkliste (echte Aufgaben, nicht nur Haken): Benutzer deaktivieren und Kassa-PIN löschen **am Austrittstag** (PH Aufgabe an Backoffice-Admin mit Fälligkeit; hat die Sitzung Admin-Recht, Knopf „Jetzt deaktivieren“ bei Datum ≤ heute), Arbeitsmittel zurück (Schlüssel, Fahrzeug, Tablet – frei, bis § 12 A7), ÖGK-Abmeldung binnen 7 Tagen, Dienstzeugnis, Endabrechnung an Kanzlei.
Ausführung: `austritt_erfassen(datum)` + Aufgaben. Ergebniskarte: „Austritt am 30.11. erfasst · Benutzer wird am 30.11. deaktiviert (Aufgabe an Admin)“. Zukunftsdatum: Hinweis „Die App setzt den Status nicht automatisch – die Aufgabe am Stichtag erinnert daran.“ (bis § 12 A7 Scheduler).

### 6.5 Assistent „Monatsabschluss“ (Phase B, Schalter `konten`)

Start: Zeile in „Zu erledigen“ am 1. des Monats mit Fortschritt „2 von 4“. Schritte: 1 Offene Buchungen des Vormonats schließen · 2 Hinweise > 10 h und unbestätigte Pausen · 3 Übersicht je Person · 4 **Abschließen** (sperrt den Monat, § 12 A4) und „Für Kanzlei exportieren (CSV/PDF)“ aus Report PH Lohnvorbereitung (§ 12 A8). Kein Undo; Zusammenfassung vorher. Ohne A4 ist der Assistent nicht sichtbar.

Alle Assistenten: Fortschritt oben, `Enter` weiter, `Esc` abbrechen (Rückfrage ab Schritt 2), Ergebnisseite mit Links und nächster Primäraktion.

---

## 7. Druck

| Dokument | Druckformat | Auslöser | Regel |
|---|---|---|---|
| Stellenaushang | PH Stelle Aushang | Akte ⋯, Liste, Sammeldruck | – |
| Bewerbungsblatt | PH Bewerbung Deckblatt | Akte, Massenaktion, Gespräch-Panel | keine Bewertung |
| Absagebrief | PH Bewerbung Absage | Abgesagt, Versandweg Post | Kommentar „Absage per Post am …“ |
| Zusagebrief | PH Bewerbung Zusage | **ausgeblendet** bis § 12 A9 | nennt heute KV-Mindestentgelt |
| Zeitnachweis Monat | PH Mitarbeiter Zeitnachweis | Personalakte (Leitung); Selbstservice mit `zeitnachweisSelbst` | bis A11c setzt die Server Action `zeitnachweis_monat` (nur Leitung) |
| Teamkalender Monat | Browser-Druck A4 quer | Team | Art-Sichtbarkeit wie Bildschirm |
| Berichte | Browser-Druck + CSV | Bericht | Filter als Kopfzeile |

Vorschau als Sheet **640 px** oder Vollbild-Knopf (A4 ist in 480 px nicht lesbar); PDF-Fehler: „PDF konnte nicht erzeugt werden – HTML-Vorschau drucken?“. Sammeldruck ≤ 50.

---

## 8. Telefon, iPad, Kiosk

- **Telefon (< 640 px):** nur Mein Bereich voll bedienbar (Ausnahme W10), übrige Seiten lesend. Stempelknopf unten (Daumenzone, Safe-Area), Ziele ≥ 44 px, keine Wischgesten, Bottom-Sheets, `enterkeyhint="done"`, `inputmode="numeric"` für Minuten.
- **iPad quer (1024–1279):** Seitenleiste 56 px; Kanban mit Sprungleiste; Tabellen mit 4 Prioritätsspalten (Bewerbungen: Name, Stelle, Status, Eingang); Team nur Woche; Bewerberakte Dokument oben 70 vh.
- **Kiosk:** § 4.2.

---

## 9. Automationen und Benachrichtigungen

| Auslöser | Was passiert | Anzeige |
|---|---|---|
| 03:15 Löschlauf | App löscht Bewerberdaten nach Frist | Zeitleiste; Kennzahl „Gelöscht“; keine Glocke (keine Pflichtaufgabe) |
| 04:00 Stelle abgelaufen | App pausiert | Glocke an Ansprechperson „Stelle automatisch pausiert“ + „+60 Tage und wieder aktivieren“ (Leitung) |
| Mo 07:00 Vorwarnung | ToDo auf Report an Leitung | Glocke mit Link Cockpit (Glocke liest ToDo `reference_type = Report`) |
| 23:30 offene Buchungen | App kommentiert täglich jede offene Buchung | Glocke **eine Zeile je Buchung** (gruppiert), an die Person und Leitung |
| Website-Bewerbung | `create_bewerbung` | Glocke an Ansprechperson; Badge am Pill (Realtime oder Poll ≤ 30 s) |
| Zuweisung | ToDo | Glocke „Dir zugewiesen: Sarah Beispiel (Küchenplaner:in)“ |
| Antrag entschieden | App teilt Dokument + Kommentar (erst nach Commit, E1) | Glocke an Antragsteller |
| Antrag/Krankmeldung neu | – | Glocke an Leitung mit Kontext (Zeitraum, Vertretung, Teamstärke) + Inline-Knöpfe |
| Gespräch morgen | fehlt in App (§ 12 A10) | Zu erledigen zeigt heute/morgen |
| Korrekturanfrage, Zeitnachweis-Anfrage, Änderungsanfrage | PH Aufgabe (ph_crm) mit Kennung `personal:*` | Zu erledigen + Glocke Leitung |
| Austritt Stichtag | PH Aufgabe an Admin mit Fälligkeit | Zentrale „Meine Aufgaben“ |

Benachrichtigungen folgen 05 § 7. Mails nur über App-Methoden bzw. `communication.email.make`.

---

## 10. Datenmapping UI → Frappe

✔ vorhanden · ◐ im Backoffice gelöst (mit Standardaufrufen) · ✘ fehlt in der App (Anfrage § 12) – Funktion bis dahin ausgeblendet oder Ersatzweg.

| UI-Funktion | Aufruf | Status |
|---|---|---|
| Stempeln Pille/Mein Bereich/Kiosk A | `ph_personal.api.stempeln()` | ✔ |
| Kommen-Undo | verzögerter Commit, kein Löschen | ◐ |
| Stempeln mit Klickzeit, offline mit Zeitstempel, `quelle` | `insert`/`setValue` als Rückfall | ◐ / ✘ A1 |
| Pause bestätigen | `setValue pause_min`; „keine Pause“ nicht speicherbar | ◐ / ✘ A1 |
| Selbstkorrektur heute | `setValue` eigene Buchung (Server Action prüft `datum = heute`) | ◐ |
| Korrektur beantragen (Vergangenheit) | `insert PH Aufgabe` | ◐ / ✘ A11d |
| Ist-Stunden, Buchungslisten | `getList PH Zeiterfassung` | ✔ |
| Saldo laufender Monat | – | ✘ A3 |
| Saldo/Urlaubstage/Resturlaub korrekt | `monatsuebersicht`, `urlaubskonto` (fehlerhaft) | ✘ A5–A8 + ph_core B1 → Schalter `konten` |
| Kanban Bewerbungen | `getKanban`, `workflowAction` | ✔ |
| Gespräch aus Eingegangen | `workflowAction Sichten` + `runDocMethod gespraech_anlegen` | ◐ (✘ A6-Übergang optional) |
| Einstellen aus Gespräch | `workflowAction Angebot erstellen` + `einstellen` | ◐ |
| Einstellen atomar | Doppelanlage-Schutz in Action | ◐ / ✘ A2 |
| Absage mit Versandweg | `absage_senden` + `kommentar` | ◐ / ✘ A10 |
| Absage eigener Text/Sprache | `communication.email.make` | ◐ / ✘ A10 |
| Eingangsbestätigung | `communication.email.make` | ◐ |
| Löschung vollständig | `unterlagen_loeschen` + Action räumt Gespräche/Event/ToDo | ◐ / ✘ A2 (Löschlauf nachts) |
| GlBG-Titelprüfung | `titelpruefung.js` | ◐ / ✘ A14 |
| Veröffentlichen/Prüfliste | Workflow + `pruefen` | ✔ |
| Teamkalender Leitung/Sachbearbeitung | `abwesenheiten_kalender` + Maskierung | ✔ / ◐ |
| Teamkalender Selbstservice, Vertretung Selbstservice | – | ✘ A11a/b |
| Heute abwesend ohne Art | `anzahl_heute_abwesend` | ✔ |
| Genehmigen/Ablehnen/Zur Kenntnis | `workflowAction` (verzögert) | ✔ / ◐ |
| Krankmeldung ohne Genehmigung, „bis auf Weiteres“, Bestätigung | Anzeige-Mapping | ◐ / ✘ A9 |
| Selbstgenehmigung gegen Antragsteller | Action-Prüfung `mitarbeiter.user ≠ Sitzung` | ◐ / ✘ A12 |
| Storno genehmigt durch Antragsteller | – | ✘ A11e |
| Zeitnachweis Selbstservice | – | ✘ A11c |
| Austritt vollständig | `austritt_erfassen` + Aufgaben | ◐ / ✘ A7 |
| Monatsabschluss, Lohnvorbereitung | – | ✘ A4, A8 |
| Feiertage im Kalender | – | ✘ ph_core B1 |
| Kiosk andere Person | `verify_pin` + Personensitzung | ✘ Fundament F4 |
| Slots | `getList PH Bewerbungsgespraech`, `abwesenheiten_kalender`, Öffnungszeiten | ◐ |
| Aktivität | `ph_core.api.aktivitaet.recent_activity` | ✔ |
| Suche `@lena` | `ph_core.api.suche.global_search` | ✔ |

---

## 11. Was hier anders ist als in klassischer Branchensoftware

1. Stelle und Karriere-Seite sind ein Datensatz: GlBG-Checkliste mit Sprunglinks, Vorschau vor dem Veröffentlichen, Übersetzungslayout, automatische Pausierung bei Ablauf.
2. Bewerberakte zeigt den Lebenslauf ohne Klick; Sichtungsmodus arbeitet neue Bewerbungen nacheinander ab.
3. Löschfrist sichtbar mit Herkunft; der Löschlauf arbeitet automatisch, die Leitung sieht nur Ausnahmen.
4. Stempeln ist auf jeder Seite 2 Klicks entfernt, am Kiosk ebenso; Rückgängig innerhalb von 8 Sekunden ohne Spuren.
5. Genehmigen mit Kontext (Vertretung, Teamstärke) direkt aus der Glocke.
6. Gesundheitsdaten bleiben bei der Leitung; Kolleginnen sehen „abwesend“.
7. Zahlen erscheinen erst, wenn sie rechtlich stimmen (Schalter), statt vorläufige Salden zu zeigen.

---

## 12. Anfragen (an andere Stellen)

**A – ph_personal (Backend):**
| # | Inhalt | Schaltet frei |
|---|---|---|
| A1 | `stempeln(zeitpunkt, quelle)`; Doppel-Buchung < 60 s → `ok:false`; Merker `hinweis_gesendet_am` für 23:30; Pause „bestätigt“/„nicht genommen“ speicherbar | genaue Kommen-Zeit, Offline-Kennzeichen |
| A2 | `einstellen` atomar mit Ausmaß/Wochenstunden/Urlaub/`user`; Löschlauf vollständig (Gespräche, Event, ToDo, Email Queue, `referenz_website`, `idempotency_key`) | Wegfall Ersatzlogik |
| A3 | `monatsuebersicht(…, bis)` | `saldoLaufenderMonat` |
| A4 | DocType `PH Zeitabschluss` mit Sperre + Nachtrag | Monatsabschluss |
| A5 | Arbeitszeitmodell je Person mit Wochentagen und `gueltig_ab` | `konten` |
| A6 | Gutschrift-Matrix (Zeitausgleich ohne Gutschrift, Unbezahlt Soll 0); Feiertage in Soll/Urlaubstage; Workflow-Übergänge Eingegangen→Gespraech, Gespraech→Eingestellt, Rückwege für Korrekturen nach dem Undo-Fenster (Gesichtet→Eingegangen, Angebot→Gespraech, Genehmigt→Beantragt vor Beginn) | `konten` |
| A7 | Austritt-Scheduler (Status, Benutzer, PIN, Sitzungen), `austritt_konto(datum)`, Kindtabelle Arbeitsmittel, `nichtantritt()` + Übergang Eingestellt→Zurueckgezogen | Austritt ohne Admin-Aufgabe |
| A8 | `PH Urlaubsanspruch` (Urlaubsjahr, Aliquotierung, Übertrag, Verjährung, Pflegefreistellungs-Kontingent); Report `PH Lohnvorbereitung` | `konten`, Export |
| A9 | Krankenstand-Ablauf (Gemeldet → Bestätigung → Beendet, `bis_offen`, Arbeitsunfall, Bestätigung als Anhang permlevel 1, `urlaub_unterbrechen`); neue Arten Berufsschule, Karenz, Mutterschutz, Präsenz-/Zivildienst; Zusage mit `angebot_brutto_cent`/`angebot_zeitraum` (permlevel 1) | Zusagebrief, Krankenstand vollständig |
| A10 | Felder `absage_versand`, `absage_versand_am`; Frist ab Versand; `absage_senden(text, sprache)`; `gespraech_einladen`; Scheduler Gesprächs-Erinnerung; Feld Datenschutzinfo Weg/Datum; Gespräch `absagen(grund, benachrichtigen)` | Absage-Nachweis |
| A11 | (a) `teamkalender(start, end)` mit fester Feldliste; (b) `vertretung_vorschlaege` + `ignore_user_permissions` am Feld; (c) `zeitnachweis_pdf(mitarbeiter, jahr, monat)`; (d) `korrektur_beantragen` + Feld `korrektur_status`; (e) Übergang Genehmigt→Storniert für Antragsteller vor Beginn | Schalter Selbstservice |
| A12 | Selbstgenehmigung gegen Antragsteller statt `owner`; `genehmiger_fuer_leitung` | `gleichGenehmigen` |
| A13 | eigene Kontaktdaten/Foto für Selbstservice; Kindtabelle Mitarbeiter-Dokumente mit Art/Ablauf | Meine Daten, Dokumente |
| A14 | Titelprüfung GlBG § 9 Abs 1 in `fehlende_angaben`; Sprache auf Website nur bei Titel + Beschreibung + 1 Aufgabe | – |
| A15 | Jugendschutz (Pause ab 4,5 h, Hinweis ab 8 h) aus `geburtsdatum` serverseitig | Lehrlings-Hinweise |
| A16 | Onboarding-Felder (`oegk_anmeldung_am`, `dienstzettel_am`, `datenschutzinfo_am`, `unterweisung_am`, Personalnummer permlevel 1) | Onboarding-Chips |
| A17 | Löschkonzept Beschäftigte; Backoffice-Admin ohne `delete` auf Zeiten/Abwesenheiten und ohne Krankenstand-Lesen; `on_trash` PH Stelle mit Bewerbungen sperren; `heute_abwesend` ohne Art für Nicht-Leitung | Reiter „Beschäftigte“ |

**B – ph_core:** B1 whitelisted `feiertage(jahr)` mit Art (gesetzlich/Land/Betriebsruhe); B2 PIN für Personen ohne Firmen-E-Mail (oder Inhaber-Entscheidung interne Benutzer); B3 `User.ph_core_pin_hash` nicht an die eigene Sitzung ausliefern (permlevel/Password).

**C – Fundament/Shell:** F1 Stempelpille-Slot in `Shell`-Kopfzeile und `KioskShell`; F2 `useVerzoegerterCommit` + Route `/api/undo-commit` (sendBeacon, Origin-Prüfung); F3 Kürzel-Registry mit Abschalter „Einzeltasten aus“, Bereichskürzel `g t`, Entscheidungen W1–W13; F4 kurzlebige Personensitzung nach PIN für Kiosk-Einzelaktion; F5 Glocken-Einträge mit Inline-Aktionen und Gruppierung; F6 Komponenten `Kalender` (Zeilen = Personen, `role="grid"`), `Slotraster`, `Sheet`, `Ergebniskarte` als gemeinsame Bausteine; F7 Ausnahme Telefon für Selbstservice in 02 § 11.1.

**D – Inhaber:** Sichtbarkeit von „Urlaub“ für Kolleginnen (Standard: nur „abwesend“); Urlaubsjahr (Arbeitsjahr oder Kalenderjahr mit Betriebsvereinbarung); Arbeitszeitmodell (Gleitzeit mit Vereinbarung AZG § 4b oder fixe Normalarbeitszeit); Behandlung 24./31.12. und Josefstag; wer genehmigt Anträge der Leitung; ob jede Person einen Benutzer erhält; Betriebsrat/Zustimmung Zeiterfassung (ArbVG § 96a, AVRAG § 10); Schwelle „Bewerbung ohne Entscheidung“ (Vorschlag 30 Tage); Löschfrist 7 Monate bestätigen.

**E – StB/AR:** Spalten Lohnvorbereitung; Aufbewahrungsfristen Zeit-/Stammdaten; Zeitguthaben bei Austritt (AZG § 19e); Resturlaub bei Teilzeitwechsel; Auslandsmontage CH/DE (A1, Meldeverfahren, Taggeld); KV-Einstufung.

**F – andere Bereiche:** Projekte: Montage-/Tätigkeitszeit in `PH Projektzeit` inkl. `einsatzland`, Plausibilität Σ Projektzeit ≤ Anwesenheit (liest PH Zeiterfassung); CRM: genehmigte Abwesenheiten sperren Beratertermine (`PH Verfuegbarkeit`), `PH Aufgabe` mit Kennungsfeld/Tag `personal:*`; Marketing: „Stelle teilen“ → `PH Social Beitrag`; Zentrale: Personal liefert Zeilen für „Zu erledigen“ der Zentrale (gleiche Funktion `zuErledigen(session)`); Faktura/Buchhaltung: Spesen, CHF-Belege, Vorschüsse.

---

## 13. Bauauftrag

### 13.1 Dateien und Routen (`backoffice/`)

```
src/app/personal/
  layout.js                         Unternavigation (Pills nach Rechten; keine Sitzungsprüfung im Layout)
  page.js  loading.js               Übersicht (Selbstservice → redirect /personal/meins)
  meins/page.js  meins/zeiten/page.js  meins/urlaub/page.js  meins/daten/page.js
  stellen/page.js  stellen/[slug]/page.js  stellen/neu/page.js (redirect ?neu=1)
  bewerbungen/page.js  bewerbungen/[name]/page.js
  gespraeche/page.js
  team/page.js
  mitarbeiter/page.js (redirect)  mitarbeiter/[name]/page.js
  zeiten/page.js (redirect)  abwesenheiten/page.js (redirect)
  datenschutz/page.js
  berichte/[report]/page.js
  einstellungen/page.js
src/app/api/undo-commit/route.js    nur falls Fundament F2 nicht rechtzeitig liefert (dann als personal/commit, später verschoben)
src/components/Backoffice/Personal/ (Liste 13.2)
src/lib/backoffice/personal/
  actions.js        "use server" – alle Mutationen (13.3)
  daten.js          server-only Lesefunktionen (Kennzahlen, Zu erledigen, Team, Slots-Rohdaten)
  sichtbarkeit.js   maskiereAbwesenheit, darfArtSehen (rein, unit-getestet)
  texte.js          Glossar, Status-Anzeige, Mail-Vorlagen (Eingangsbestätigung, Einladung)
  status.js         Statustöne je DocType
  slots.js          freieSlots(gespraeche, abwesenheiten, oeffnung, dauer) (rein)
  zeit.js           h:mm, Vorzeichen, Ist-Summen, "heute bisher" (rein)
  titelpruefung.js  GlBG-Titel (rein)
  schalter.js       Freischalt-Schalter § 3.9
  onboarding.js     Aufgaben-Vorlagen Ein-/Austritt
  zuErledigen.js    Zeilen-Bausteine (auch für Zentrale)
src/lib/backoffice/mock/  seed-Ergänzungen Personal (über bestehende seed.js-Erweiterungsstelle)
tests/unit/backoffice-personal-*.test.mjs   tests/e2e/personal.spec.js
```
Einträge: `bereiche.js` (Pills/Unterseiten Personal), `suche.js` (Palette: „> kommen“, „> gehen“, „> urlaub“, „> krank“, „> stelle“, „> bewerbung“).

### 13.2 Komponenten (`components/Backoffice/Personal/`)

| Komponente | Art | Zweck |
|---|---|---|
| `PersonalPills` | Server | Unternavigation mit Badges |
| `StempelPille`, `StempelPopover`, `useStempeluhr` | Client | § 4.1 (Einbindung durch Fundament) |
| `StempelKarte` | Client | Mein Bereich |
| `KioskStempeln` | Client | § 4.2 inkl. Countdown und Ergebniskarte |
| `PauseBestaetigung` | Client | Toast-Zeile nach Gehen |
| `UrlaubSheet`, `KrankmeldungSheet`, `AbwesenheitFuerPersonSheet` | Client | § 5.2 / § 5.8 |
| `AntragZeile` | Client | Antrag mit Kontext + Inline-Aktionen (Team, Zu erledigen, Glocke) |
| `ZuErledigen` | Server + Client-Zeilen | § 5.1 |
| `HeuteImHaus` | Server | ohne Uhrzeiten |
| `MonatsTabelle` | Client | Meine Zeiten, Personalakte Zeiten |
| `InlineZeitFeld` | Client | ±5 min, Schnellwahl |
| `KorrekturDialog` | Client | Korrektur beantragen |
| `TeamKalender`, `Tagespanel` | Client | `role="grid"`, Woche/Monat, Bänder |
| `BuchungenListe`, `PersonenListe`, `AntraegeListe` | Client (DataTable) | Team-Reiter |
| `StellenListe` (DataTable + Kanban) , `NeueStelleDialog` | Client | § 5.3 |
| `GlbgCheckliste`, `EntgeltVorschau`, `UebersetzungsLayout`, `SpeicherLeiste`, `KarriereVorschau` | Client | § 5.4 |
| `BewerbungsKanban`, `BewerbungKarte`, `VerschiebenSheet` | Client | § 5.5 (auf `Kanban`) |
| `NeueBewerbungDialog` | Client | inkl. Duplikat-Hinweis, Eingangsbestätigung |
| `BewerberKopf`, `DokumentAnsicht`, `Sichtungsleiste` | Client | § 5.6 |
| `AbsageDialog` (einzeln/Serie) | Client | Versandweg, Vorschau, 10-s-Commit |
| `BewertungSterne` | Client | `radiogroup` |
| `LoeschfristKarte`, `AufbewahrungDialog`, `LoeschBestaetigung` | Client | Tippfeld |
| `GespraechSheet`, `Slotraster`, `GespraechsKalender`, `GespraechPanel`, `ErgebnisDialog` | Client | § 5.7 / § 6.2 |
| `EinstellenAssistent`, `AustrittAssistent`, `TeilschrittErgebnis` | Client | § 6.3 / § 6.4 |
| `DatenschutzCockpit` | Client | § 5.10 |
| `PersonalBericht` | Server | Report-Tabelle + Chart, Schalter-Hinweis |

Wiederverwendet: `Shell`, `Seitenkopf`, `DataTable`, `Filterleiste`, `Kanban`, `Formular`, `Kindtabelle`, `LinkFeld`, `Datumsfeld`, `WorkflowLeiste`, `Zeitleiste`, `Kennzahl`, `Charts`, `StatusBadge`, `Leer`, `Fehler`, `Bestaetigen`, `Toast`, `Segment`, `Knopf`.

### 13.3 Server Actions (`lib/backoffice/personal/actions.js`)

Alle: `requireSession()`, Recht (`darfDoc`) und Rolle erneut prüfen, Eingaben per zod, Rückgabe `{ ok, code, message, fehler? }`, Idempotenz-Schlüssel bei mehrstufigen Aktionen, keine Personendaten im Log.

| Action | Prüfung | Frappe |
|---|---|---|
| `stempelnAction({ zeitpunktClient })` | eigener Mitarbeiter | `call ph_personal.api.stempeln` |
| `pauseSetzenAction({ buchung, minuten })` | eigene Buchung heute oder Leitung | `setValue pause_min` |
| `buchungKorrigierenAction({ buchung, kommen, gehen, pause })` | Selbstservice: eigene + `datum = heute`; Leitung: alle | `save PH Zeiterfassung` (mit `modified`) |
| `buchungNachtragenAction({ mitarbeiter, datum, … , notiz })` | Leitung oder eigene heute | `insert PH Zeiterfassung` |
| `gehenJetztAction({ buchung })` | Leitung | `runDocMethod gehen_jetzt` |
| `korrekturBeantragenAction({ buchung, werte, grund })` | eigene Buchung | `insert PH Aufgabe` |
| `anfrageAnLeitungAction({ art, bezug, text })` | Sitzung | `insert PH Aufgabe` (Zeitnachweis, Daten, Storno, Zuordnung) |
| `abwesenheitBeantragenAction({ art, von, bis, halbtags, vertretung?, anmerkung? })` | eigene oder Leitung; Vertretung nur mit Recht/Schalter | `insert PH Abwesenheit` |
| `krankMeldenAction({ ab, bis? , mitarbeiter? })` | eigene oder Leitung/Sachbearbeitung | `insert PH Abwesenheit`; Überschneidung → `insert PH Aufgabe` |
| `antragEntscheidenAction({ name, aktion, grund? })` (nach Commit) | Leitung, Antragsteller ≠ Sitzung, `owner` ≠ Sitzung | `workflowAction Genehmigen|Ablehnen` (`ablehnungsgrund` vorher `setValue`) |
| `antragStornierenAction({ name })` | Beantragt: Antragsteller; Genehmigt: Leitung | `runDocMethod stornieren` |
| `stelleAnlegenAction({ titel, kategorie, beschaeftigungsart, vorlage? })` | create | `insert PH Stelle` oder `runDocMethod duplizieren` |
| `stelleSpeichernAction({ doc, modified })` | write | `save PH Stelle` |
| `stelleWorkflowAction({ name, aktion })` | Transition erlaubt | `workflowAction` |
| `stelleVerlaengernAction({ name, tage })` | Leitung | `setValue gueltig_bis` + ggf. `workflowAction Wieder aktivieren` |
| `stelleMethodeAction({ name, methode, args })` | Whitelist `pruefen|website_cache_erneuern|duplizieren|als_besetzt` | `runDocMethod` |
| `bewerbungAnlegenAction({ felder, dateien, datenschutzWeg, eingangsbestaetigung })` | create | `insert PH Bewerbung`, `uploadFile`, `kommentar`, `call frappe.core.doctype.communication.email.make` |
| `bewerbungWorkflowAction({ name, aktion })` | Transition erlaubt | `workflowAction` |
| `bewerbungZuweisenAction({ name, user })` | write | `setValue zugewiesen_an` |
| `gespraechAnlegenAction({ bewerbung, start, dauer, modus, ort, verantwortlich, kalender })` | Recht | ggf. `workflowAction Sichten`, `runDocMethod gespraech_anlegen`, `runDocMethod kalender_eintragen` |
| `gespraechAendernAction({ name, start?, status?, bestaetigt_am? })` | write | `setValue` |
| `gespraechAbschliessenAction({ name, ergebnis, naechster_schritt })` | write | `runDocMethod abschliessen` |
| `absageSendenAction({ namen[], grund, versandweg })` (nach 10-s-Commit) | Leitung | `runDocMethod absage_senden` je Name, `kommentar` |
| `mailSchreibenAction({ doctype, name, betreff, text })` | email-Recht | `call communication.email.make` |
| `einstellenAction({ bewerbung, eintritt, rolle, ausmass, wochenstunden, urlaub, benutzer?, rollen[], stelleSchliessen, idempotency })` | Leitung | § 6.3 Ablauf: `workflowAction`, `getList PH Mitarbeiter`, `runDocMethod einstellen`, `setValue`, `hasPermission User create`, `insert User`, `insert PH Aufgabe` |
| `bewerberDatenLoeschenAction({ namen[] })` | Leitung, Tippfeld-Token | `runDocMethod unterlagen_loeschen`, Nachräumen `getList`/`setValue`/`delete` (Gespräch, Event, ToDo) |
| `aufbewahrungVerlaengernAction({ name, bis, bestaetigt })` | Leitung | `runDocMethod evidenz_verlaengern` |
| `mitarbeiterAnlegenAction`, `mitarbeiterSpeichernAction` | create/write | `insert`/`save PH Mitarbeiter` |
| `austrittAction({ mitarbeiter, datum, grund, aufgaben[] })` | Leitung | `runDocMethod austritt_erfassen`, `kommentar`, `insert PH Aufgabe`; optional `setValue User enabled 0` bei Admin-Recht |
| `zeitnachweisAction({ mitarbeiter, jahr, monat })` | Leitung (bis A11c) | `setValue zeitnachweis_monat`, `getPdf` |
| `commitAction({ token })` | Sitzung, Token aus Undo-Registry | führt die hinterlegte Action genau einmal aus |

### 13.4 Frappe-Aufrufe (Lesen, `daten.js`)

`getList`/`count`: PH Stelle, PH Bewerbung, PH Bewerbungsgespraech, PH Mitarbeiter, PH Zeiterfassung, PH Abwesenheit, PH Aufgabe (Kennung `personal:*`), ToDo (`reference_type = Report`). `getKanban PH Bewerbung` (Board „PH Bewerbungen“), `getKanban PH Stelle`. `getDocMitInfo` für Akten. `getTransitions` für Knöpfe. `call ph_personal.api.anzahl_heute_abwesend`, `abwesenheiten_kalender(start, end)`, `monatsuebersicht` (nur mit `konten`). Number Cards über `count` mit identischen Filtern. `getReport` PH Bewerbungsstatistik, PH Loeschfristen, PH Monatsstunden, PH Abwesenheiten. `getPdf` für Druckformate. `searchLink` für Link-Felder. `ph_core`: `recentActivity`, `globalSearch`, `verifyPin` (Kiosk B). Öffnungszeiten aus PH Einstellungen (`getDoc`). Alle Abwesenheitsdaten laufen durch `maskiereAbwesenheit`.

### 13.5 Reihenfolge

| Schritt | Inhalt | Ergebnis |
|---|---|---|
| 1 | Grundlagen: `texte.js`, `status.js`, `sichtbarkeit.js`, `zeit.js`, `slots.js`, `titelpruefung.js`, `schalter.js` + Unit-Tests; Mock-Seed (8 Stellen, 25 Bewerbungen inkl. 2 gelöscht, 6 Gespräche, 12 Mitarbeiter inkl. Leitung mit Mitarbeiter-Datensatz und Lehrling, 1 Monat Buchungen, 20 Abwesenheiten inkl. Krankenstand) | reine Module grün |
| 2 | Layout/Pills, Routen, Umleitungen, Rechte-Weichen (Selbstservice, Admin) | Navigation vollständig |
| 3 | Stempeluhr: Pille/Popover/Karte, `stempelnAction`, verzögerter Commit (mit Fundament F1/F2), Pause-Bestätigung | Stempeln 2 Klicks |
| 4 | Mein Bereich inkl. Sheets Urlaub/Krankmeldung, Meine Zeiten (heute bearbeitbar, Korrektur beantragen), Meine Abwesenheiten, Meine Daten | Selbstservice benutzbar |
| 5 | Stellen: Liste/Kanban, Neu-Dialog, Akte mit Checkliste, Übersetzungslayout, Speicherleiste, Vorschau | Stellen live-fähig |
| 6 | Bewerbungen: Kanban/Liste, Neu-Dialog, Bewerberakte mit Dokumentansicht, Sichtungsmodus, Absage-Dialog, Datenschutz-Tab | Bewerbungen live-fähig nach A2 (Löschlauf) |
| 7 | Gespräche: Sheet mit Slotraster, Kalender, Panel, Ergebnis | – |
| 8 | Einstellen-Assistent mit Teilschritten | – |
| 9 | Team: Kalender (grid), Tagespanel, Personen, Buchungen, Anträge mit Kontext; Personalakte | Leitung arbeitet ohne Desk |
| 10 | Übersicht: Zu erledigen, Kennzahlen, Heute im Haus, Charts-Schwelle, Kürzlich; Glocken-Einträge (F5) | Bereichsstart |
| 11 | Datenschutz-Cockpit, Berichte, Einstellungen, Druck | – |
| 12 | Kiosk-Stempeln Fall A (+ Offline-Warteschlange) | Kiosk |
| 13 | Austritt-Assistent | – |
| 14 (Phase B) | Schalter einzeln aktivieren, sobald A3–A12/B1 geliefert sind; Monatsabschluss, Lohnvorbereitung | Konten sichtbar |

### 13.6 Aufwand (Agent-Stunden, Schätzung)

| Schritt | h |
|---|---|
| 1 Grundlagen + Seed + Unit-Tests | 5 |
| 2 Navigation/Routen/Rechte | 2 |
| 3 Stempeluhr + Commit | 5 |
| 4 Mein Bereich | 6 |
| 5 Stellen | 6 |
| 6 Bewerbungen + Akte + Sichtung + Absage | 9 |
| 7 Gespräche | 5 |
| 8 Einstellen | 3 |
| 9 Team + Personalakte | 8 |
| 10 Übersicht + Glocke | 4 |
| 11 Datenschutz, Berichte, Einstellungen, Druck | 4 |
| 12 Kiosk-Stempeln | 3 |
| 13 Austritt | 2 |
| E2E, axe hell/dunkel, Screenshots Leerzustände | 6 |
| **Phase A gesamt** | **68** |
| 14 Phase B (Schalter, Monatsabschluss, Lohnvorbereitung, Konten-Anzeigen) | 10 (nach Backend) |

### 13.7 Abhängigkeiten

| Von | Was | Blockiert | Ersatz bis dahin |
|---|---|---|---|
| Fundament F1 | Stempelpille-Slot in Shell/KioskShell | Schritt 3/12 Einbindung | Pille nur auf Personal-Seiten im Seitenkopf (vorübergehend) |
| Fundament F2 | verzögerter Commit + Route | alle Variante-A-Aktionen | eigene Route `api/undo-commit` im Bereich, später übergeben |
| Fundament F3 | Kürzel-Registry, Abschalter | Tastatur-QA | lokale Registrierung über `useTastenkuerzel` |
| Fundament F5/F6 | Glocken-Inline-Aktionen, Kalender/Slotraster/Sheet | Schritt 9/10 | Bausteine im Bereich bauen, Fundament übernimmt |
| ph_personal A2 | vollständiger Löschlauf | Livegang Bewerbungen | Nachräumen in `bewerberDatenLoeschenAction` deckt nur manuelle Löschung |
| ph_personal A3–A8, ph_core B1 | korrekte Konten | Schalter `konten` | keine Salden/Tage |
| ph_personal A11/A12 | Selbstservice-Methoden, Genehmiger-Regel | jeweilige Schalter | „Leitung bitten“ |
| Projekte | `PH Projektzeit` für Montage | – | Personal bucht nur Anwesenheit |
| CRM | `PH Aufgabe` als Anfrage-Kanal | Anfragen an Leitung | – (DocType vorhanden) |
| Zentrale | Einbindung `zuErledigen` | – | Personal-Übersicht |
| Inhaber (D) | Sichtbarkeit, Urlaubsjahr, Arbeitszeitmodell, Betriebsrat | Livegang Zeiterfassung | Standard: strengste Variante |

### 13.8 QA-Checkliste (Abnahme)

**Allgemein:** Primäraktion eindeutig mit `⌘Enter` · Filter in URL, Zurück stellt wieder her · Skeleton ≥ 300/600 ms, CLS 0 · drei Leerzustände je Liste, jeder Leerzustand aus § 5/§ 6 als Mock-Fall mit Screenshot hell/dunkel · Fehlertexte ohne Technikbegriffe · axe serious/critical = 0 hell und dunkel (Team-Kalender, Gesprächskalender, Kanban gemessen; Schraffur-Kontrast ≥ 3:1) · Desktop, iPad quer/hoch, Telefon 375×667 · Mock-Modus vollständig.

**Rechte und Datenschutz**
1. Nur Selbstservice → `/personal` leitet auf `/personal/meins`; Bewerbungen/Team → `kein-zugriff`; Palette nur Stempeln/Urlaub/Krank.
2. Backoffice-Admin: Pills Bewerbungen/Gespräche fehlen, Direktaufruf → `kein-zugriff`.
3. Bewertung, Vertraulich, Gesprächs-`notiz` ohne permlevel 1 nicht im DOM (Snapshot).
4. Als Selbstservice, Sachbearbeitung, Admin: DOM und Server-Action-Antworten von `/personal`, `/personal/meins`, `/personal/team` enthalten für fremde Personen weder „Krank“, „Pflege“, „Sonderurlaub“ noch `KR`; `art` ist „abwesend“.
5. Heute im Haus enthält keine Uhrzeiten.
6. Löschfrist 14 Tage vorher Kennzeichen; „Sofort löschen“ bei offener Bewerbung deaktiviert mit Controller-Text; Tippfeld ignoriert Groß/klein; nach Löschung sind Gesprächs-Notiz, Event und ToDo der Bewerbung entfernt (Mock).
7. Aufbewahrung verlängern nur mit Checkbox; Datum in der Vergangenheit → Feldfehler.
8. Neu-Dialog Bewerbung ohne „Datenschutzinformation übermittelt“ nicht speicherbar; Eingangsbestätigung erzeugt eine Mail (Mock protokolliert).

**Stempeln und Zeiten**
9. Stempeln von `/crm` und `/faktura` aus = 2 Klicks (Leitung mit Mitarbeiter-Datensatz sieht Pille und Pill „Mein Bereich“).
10. Kommen → Rückgängig innerhalb 8 s: kein `stempeln`-Aufruf; Seite schließen innerhalb 8 s: genau ein Aufruf (sendBeacon); Taste `s` bucht nichts.
11. Gehen → Rückgängig setzt `gehen` leer. Nach Gehen > 6 h erscheint „30 min Pause genommen?“; „Andere Dauer 20“ speichert 20.
12. Selbstservice: Buchung von gestern nicht editierbar, „Korrektur beantragen“ erzeugt PH Aufgabe; Server Action lehnt Änderung an gestriger Buchung ab, auch bei manipuliertem Aufruf.
13. Mit `konten` aus: nirgends Saldo, Urlaubstage oder Resturlaub im DOM; mit `konten` an und Mock 04.11.2026, Vollzeit 38,5 h, 02.–03.11. je 8:00 netto, `saldoLaufenderMonat` an: „Saldo bis gestern +0:36“.
14. Saldo nie rot/grün (Snapshot der Tonklassen).
15. Zukunftsbuchung → Feldfehler; Gehen vor Kommen → Controller-Text; > 10 h → `warning`-Band, Speichern erfolgt.
16. Kiosk Fall A: Bestätigung ≥ 2000 ms, Countdown vor dem Schließen, Rückgängig verhindert den Aufruf; Fall B ohne Schalter nicht im DOM; offline → „1 Buchung wartet“, nach Rückkehr übertragen mit Kennzeichen.

**Abwesenheiten**
17. Urlaub: 1 Sheet, Weg 3 Klicks + Datum; Halbtag erscheint nur bei 1 Tag; Fehlertexte inline.
18. Krankmeldung: 1 Sheet, Primär „Melden“; Leitung sieht „Gemeldet“ und „Zur Kenntnis genommen“, kein „Ablehnen“ im DOM; Krankmeldung in genehmigtem Urlaub erzeugt Aufgabe statt Fehler.
19. Genehmigen → Rückgängig innerhalb 8 s: kein Workflow-Aufruf, keine Benachrichtigung (Mock). Antrag der eigenen Person (auch von Sachbearbeitung angelegt) und von der Leitung selbst angelegte Anträge: kein Entscheidungsknopf, Text sichtbar.
20. Glocken-Eintrag Antrag enthält Zeitraum, Vertretung, Teamstärke; Genehmigen = 2 Klicks ab Zentrale.
21. Stornieren: Beantragt durch Antragsteller möglich (A); Genehmigt ohne Schalter → kein Knopf, „Leitung bitten“.
22. Team-Kalender Woche bei 1280 px ohne horizontalen Scroll; Monat mit sticky Spalten; 200 % Zoom erste Spalte sichtbar; Zelle per Pfeiltasten erreichbar, Screenreader liest Person, Datum, Stunden.

**Stellen**
23. Veröffentlichen deaktiviert bis Checkliste leer, wird ohne Neuladen aktiv; Titel ohne neutrale Form → gelbe Warnung, Veröffentlichen bleibt möglich.
24. Aktive Stelle: Tippen löst innerhalb 10 s keinen Speicheraufruf aus; Speicherleiste erscheint; `⌘S` speichert einmal; kein „Aus Deutsch kopieren“ im DOM.
25. Sachbearbeitung: Pausieren → Rückgängig → Stelle Aktiv, kein Workflow-Aufruf. Leitung: Archivieren → Rückgängig → Status vorher.
26. Kanban Entwurf → Aktiv ohne Entgelt: Rückkehr 200 ms, Dialog mit Sprunglinks. Duplizieren → Rückgängig löscht die Kopie.

**Bewerbungen und Gespräche**
27. Website-Bewerbung (Mock-Insert) erscheint ≤ 30 s mit Badge.
28. Sachbearbeitung zieht Karte auf Abgesagt → Rückkehr ≤ 200 ms + Statusmeldung mit Rollenhinweis; Menü zeigt gesperrte Ziele mit Grund; Eingestellt zeigt nur ≤ 90 Tage; keine Sterne auf Karten.
29. Gespräch planen aus Eingegangen: Mock protokolliert `Sichten` vor `gespraech_anlegen`; Ergebnis Status Gespräch. Slot mit Kollision nicht wählbar; ohne freien Slot erscheinen drei Auswege.
30. Bewerberakte ≥ 1280 px zeigt Lebenslauf ohne Klick; Sichtungsmodus: 3 Eingegangene mit `⌘Enter` nacheinander auf Gesichtet, Ende „Alles gesichtet“.
31. Absage: Undo innerhalb 10 s verhindert Aufruf; Versandweg Post erzeugt Kommentar und bietet Brief; ohne E-Mail ist E-Mail-Versand deaktiviert; Serie listet Ausreißer oben.
32. Einstellen mit simuliertem Fehler bei `insert User`: Personalakte existiert, Ergebniskarte ✗ + „Erneut“; zweiter Versuch legt keine zweite Personalakte an; aus Status Gespräch läuft „Angebot erstellen“ vorher. Zusagebrief nicht im DOM.
33. Gespräch vorbei → Primär „Ergebnis erfassen“; Ergebnis Angebot setzt Bewerbung auf Angebot ohne Neuladen. Umplanen ohne Drag über „Verschieben …“ möglich.

**Texte, Tastatur, Übersicht**
34. Kein sichtbarer Text „Cache“, „Slug“, „Evidenz“, „pseudonymisiert“, „Gespraech“, „Zurueckgezogen“, „Durchgefuehrt“, „Einwilligung Datenschutz“, Abkürzung „T.“ (DOM-Textsuche aller Routen als Leitung).
35. Kürzel-Registry: keine Taste je Route doppelt; Einzeltasten abschaltbar und danach wirkungslos.
36. `/personal` zeigt ≤ 4 Kennzahlen; eine Zahl höchstens zweimal; < 20 Bewerbungen → keine Charts, Hinweiszeile.
37. E2E misst jede Zeile der Tabelle § 2 über genau den beschriebenen Weg; Abweichung = Fehler.
38. Austritt: Feldfehler bei Datum < Eintritt; Ergebnis legt Aufgabe „Benutzer deaktivieren und PIN löschen“ mit Fälligkeit = Austrittsdatum an.
39. Statuston-Snapshot je Status gegen § 3.3; „Nicht erschienen“ und „Zurückgezogen“ grau, Krankenstand nie rot.
40. Phase B (je Schalter): Zeitausgleich 1 Tag senkt Saldo um Tagessoll; Urlaub über Feiertag zählt den Feiertag nicht; Samstagskraft: Urlaub Sa zählt 1, freier Mi 0; ausgetretene Person kann sich am Folgetag nicht anmelden; Monat abgeschlossen → Änderung abgelehnt mit Text.

---

## 14. Nicht mehr enthalten (bewusst gestrichen)

Zentrale-Chip „Stempeln“, Kopfknopf „Stempeln“ auf Personal-Seiten, Einzeltaste `s`, Projektfeld beim Stempeln, „Beginn/Ende Montage“ als Zeiterfassung, Assistent „Stelle anlegen“ (5 Schritte), „Aus Deutsch kopieren“, Autosave bei aktiven Stellen, Undo per `setzeWert` auf Status, „Gleich genehmigen“ (bis A12), Genehmigen/Ablehnen bei Krankenstand, Hinweis „kein Übertrag konfiguriert“, Saldo des laufenden Monats, Donut nach Quelle, 8 Kennzahlen, Heute-Chips, Uhrzeiten in „Heute im Haus“, Sterne auf Kanban-Karten, Wisch-Aktion Stornieren, getrennte Pills Zeiten/Abwesenheiten/Mitarbeiter, Druckvorschau 480 px, Zusagebrief (bis A9).

---

## 15. Änderungsprotokoll (Fassung 1 → Fassung 2, 2026-11-04)

**Aus UX-Kritik (20):**
| Nr. | Umsetzung |
|---|---|
| P1 Krankenstand-Sichtbarkeit | § 1.2 Sichtbarkeit (zwei Klassen, serverseitig), Kürzel `AB`/`KR`, nie Rot; QA 4 |
| P2 Saldo falsch | E3/E4, § 3.9 Schalter, „Ist bis gestern“, Saldo neutral, Wireframes ohne widersprüchliche Zahlen; QA 13/14 |
| P3 Stempeln Undo/Einzeltaste | § 3.4 Variante A für Kommen, B für Gehen, keine Einzeltaste, Palette mit Bestätigung; QA 10 |
| P4 Mein Bereich/Shell-Pille | § 4.1 Stempelpille, Pill „Mein Bereich“, Kopfknopf/Zentrale-Chip gestrichen; QA 9 |
| P5 Klickzahlen | § 2 neu gezählt; QA 37 |
| P6 Urlaub/Krankmeldung | Sheets § 5.2, „Gemeldet“/„Zur Kenntnis genommen“; QA 17/18 |
| P7 Undo-Gegenaktionen | § 3.4 Tabelle A/B, fehlende Undos ergänzt; QA 19/25/26 |
| P8 Autosave aktive Stelle, Kopieren | § 5.4 Speicherleiste + Vorschau, Übersetzungslayout; QA 24 |
| P9 Begriffe | § 3.2 Glossar, `texte.js`; QA 34 |
| P10 Tastenkürzel | § 3.5; QA 35 |
| P11 Sichten mit Dokument | § 5.6 geteilte Ansicht, Sichtungsmodus, Primär „Gespräch planen“; QA 30 |
| P12 Zahlenwand | § 5.1 Zu erledigen, 4 Kennzahlen, Chart-Schwelle; QA 36 |
| P13 Matrix/Kürzel | § 5.8 Team-Seite, Woche/Monat, zweistellige Kürzel, sticky Spalten, `role="grid"`; QA 22 |
| P14 Leerzustände | in jedem Abschnitt § 5/§ 6 ergänzt; QA Allgemein |
| P15 Kanban | § 5.5 Karte 3 Zeilen, 90 Tage, gesperrte Ziele sichtbar begründet, lucide; QA 28 |
| P16 Assistenten | § 6: Neu-Dialog Stelle, Gespräch ein Bildschirm, Einstellen mit Teilschritten; QA 32 |
| P17 Statustöne | § 3.3; QA 39 |
| P18 Kiosk | § 4.2 Fall A/B, 2000 ms, Countdown, Rückgängig; QA 16 |
| P19 Glocke mit Kontext | § 5.8 AntragZeile, § 9; QA 20 |
| P20 Gespräch-Panel | § 5.7 Primär nach Zustand; QA 33 |
| P21 Mobil | § 5.2 sticky unten, keine Wischgeste, Chips 44×56, § 8 |
| P22 Dunkelmodus | § 3.8; QA Allgemein |
| Empfehlungen § 2 | GlBG-Kennzeichen statt Band, Standard-Tab Zeiten, „Als besetzt“ ohne Dialog, Serien-Vorschau kompakt, Monatsabschluss in Zu erledigen, Inline „+60“, Kontakt-`fieldset`, Grid-/Slot-/Zeitfeld-Tastatur, „Gehen“ ohne Sperrschrift, Live-Region, Sterne-`radiogroup`, Tippfeld-Attribute, Phasenleiste kompakt, absolutes Datum bei Countdown, Schraffur mit Text, Verschieben ohne Drag, PDF in neuem Tab, Sprungleiste iPad, Projektfeld entfällt, Toast-Position Kiosk, Stempelkarte ruhig, Bänder im Kalender, Avatar-Kopf, Wort „Team/Mitarbeiter/Personalakte“, Absage-Toast erst nach Commit, Löschung „auf Wunsch der Person“, Druckvorschau 640 px, Bericht-Fehlertext |
| W1–W13 | als Anfragen an Fundament (§ 12 C); Personal folgt den Vorschlägen (8 s, Toast unten rechts/oben Mitte, `g t`, Balken 240 ms) |

**Aus Fachkritik (21):**
| Nr. | Umsetzung |
|---|---|
| F1/F2 Undo per setzeWert | E1 verzögerter Commit; Rückwege als Anfrage A6 |
| F3 Self-Approval `owner` | Action-Prüfung Antragsteller + Owner, Hinweistexte, „Gleich genehmigen“ hinter Schalter; A12 |
| F4 Gespräch aus Eingegangen | Server Action „Sichten“ vorher; QA 29 |
| F5 Einstellen aus Gespräch / Doppelanlage | „Angebot erstellen“ vorher, Doppelanlage-Schutz; QA 32; A2 |
| F6 Selbstservice Team/Vertretung | ausgeblendet hinter Schaltern; A11a/b |
| F7 Zeitnachweis Selbstservice | „Zeitnachweis anfordern“; A11c |
| F8 Storno genehmigt | nur Beantragt selbst; A11e |
| F9/F10/B9/P17 Montage, Projektreferenz | Stempeln ohne Projekt; Montage → Projekte (`PH Projektzeit`) |
| F11/F12/R10/B10/P10 Austritt | Assistent § 6.4 mit Aufgaben am Stichtag; A7 |
| F13/R1/D3 Art sichtbar | § 1.2 |
| F14/R6/P7 Zeitausgleich | Schalter `konten`; A6 |
| F15/R7/P5 Wochenstunden rückwirkend | Hinweis in Stammdaten; A5 |
| F16/P3 Löschung unvollständig | Nachräumen bei manueller Löschung, Livegang Bewerbungen nach A2; QA 6 |
| F17/R8/B15/D8 Datenschutzinformation | Pflicht-Checkbox + Weg, Eingangsbestätigung, Begriff ohne „Einwilligung“; QA 8 |
| F18/P3 Absage-Versandweg | Absage-Dialog mit Versandweg + Kommentar; A10 |
| F19 23:30-Duplikate | Gruppierung in Glocke/Zu erledigen; A1 |
| F20 Mitarbeiter ohne E-Mail | Hinweis, Inhaber-Frage D, ph_core B2 |
| F21 Betriebsruhe-Quelle | Feiertage/Betriebsruhe nur über ph_core B1 |
| B1/R4 Arbeitszeitmodell, Samstag | Schalter `konten`; A5; QA 40 |
| B2/P6 Feiertage vs. Betriebsruhe | ph_core B1, Inhaber-Frage; kein stilles Einmischen |
| B3/R3/P9 Krankmeldung | E5, § 5.2; A9 |
| B4/R2/P8 Urlaubsjahr, Verjährung | Hinweis gestrichen, Konto erst mit A8 |
| B5 Krank im Urlaub | Aufgabe an Leitung statt Fehler; A9 |
| B6/P4 Monatsabschluss | § 6.5 Phase B; A4 |
| B7/P15 Lohnvorbereitung | Phase B Export; A8; StB-Frage |
| B8/P14 Onboarding | Checkliste + Aufgaben-Vorlage; A16 |
| B11/P16 Beschäftigtendaten | Cockpit-Reiter mit A17; StB-Frage |
| B12 Karenz | Arten in A9; Soll bis dahin hinter `konten` |
| B13 Lehrlinge | A15 |
| B14 Pflegefreistellung | Kontingent in A8 |
| B16 offene Bewerbungen ohne Ende | Zeile „ohne Entscheidung seit 30 Tagen“; Inhaber bestätigt Schwelle |
| B17 Leitungs-Vertretung | A12, Inhaber-Frage |
| R5 Saldo-Begriff | „Stundensaldo (ohne Zuschläge)“, Modell-Frage an Inhaber/StB |
| R9 Selbstkorrektur, Auto-Pause | E7, Pause-Bestätigung; QA 11/12 |
| R11 Live-Anwesenheit | Heute im Haus ohne Uhrzeiten; Betriebsrat-Frage; QA 5 |
| R12 Zusagebrief | ausgeblendet bis A9 |
| R13/P13 GlBG-Titel | `titelpruefung.js` Warnung; A14; QA 23 |
| R14 Bewertung | Feldhilfe; strukturierte Bewertung als Anfrage (A9-Umfeld, Feedback je Anforderung) |
| Randfälle § 5 | Storno/Absage nach Versand/Gespräch abgesagt/Teil-Abwesenheit/Jahreswechsel/ZA stundenweise/Vorgriff/Nichtantritt/CHF/ohne E-Mail/Doppelstempeln/Mitternacht/Lehrling/Stelle löschen/Doppelbewerbung/Upload fehlt → in § 5, § 12 (A1, A6–A10, A17) und Ausschlüssen (Spesen, Vorschüsse) abgebildet |
| D1–D11 | D1/D3/D4 → A17 und UI ohne Löschen; D2 → Kiosk-Regel § 4.2; D6 → § 9; D7 → Cockpit-Filter; D8 → Glossar; D9 → A11c; D10 → Nummernkreise unverändert Anfrage; D11 → Berichte „–“ bei n < 5 |

**Strukturell:** Assistent P1 entfernt, P5 auf Sheets reduziert, P6/P7 überarbeitet; Seiten Zeiten/Abwesenheiten/Mitarbeiter zu Team zusammengeführt; neuer Abschnitt Schalter (§ 3.9), Entscheidungen (§ 0), Bauauftrag (§ 13), Gestrichenes (§ 14).
