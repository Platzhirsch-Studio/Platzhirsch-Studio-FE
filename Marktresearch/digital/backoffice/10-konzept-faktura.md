# 10 – Konzept Bereich Faktura (Next-Backoffice, `/faktura`)

**Zweck:** Das verbindliche Funktions- und Oberflächenkonzept für den Bereich Faktura im eigenen Next.js-Backoffice (`backoffice/`, Port 3100). Es umfasst Angebot, Auftrag (AB), Anzahlungs-, Teil- und Schlussrechnung, Gutschrift und Rechnungskorrektur, Mahnen, Bank mit Zuordnung, Eingangsrechnungen, Zahllauf, Export an die Kanzlei, UVA-Zuarbeit, Monatsabschluss, Ausfuhrnachweise und Druck. Am Ende steht ein Bauauftrag für den Fachbereichs-Agenten „Faktura“.
**Stand:** 2026-11-04 · Fassung 2: Überarbeitung nach `20-kritik-ux-faktura.md` (P1–P21) und `21-kritik-fach-faktura.md` (R-01–R-19, B-01–B-18, §4–§9). Alle Pflichtänderungen sind eingearbeitet, das Protokoll steht in § 18. Status: Vorschlag, keine Inhaber-Entscheidung, keine Steuerberatung. Mit **StB** markierte Punkte bestätigt die Kanzlei.
**Grundlage:** 01–05 (Benchmark, UX, Design-System, Motion, IA), `PLAN-NEXT-BACKOFFICE.md`, `Backend-Import/ph_faktura` (README, 23 DocType-JSONs, Methoden, `rechenwerk/*`, `kennzahlen.py`, `tasks.py`, Fixtures), `ph_crm` PH Kontakt (`kontaktart`, `anrede`, `kommunikation_bevorzugt`), `ph_kassa`, UI-Kit `backoffice/src/components/Backoffice/README.md`, SHD-Vorbild.
**Verbindlich aus 02/03/04/05:** eine Primäraktion je Seite · Undo statt Rückfrage (8 s) · Filter in der URL · Skeleton statt Spinner (erst nach 300 ms, CLS 0) · Token `--color-bo-*` · Dauer nur `--bo-dur-*`, Kurven nur `--bo-ease-*` · Seitentypen T1–T9 · Fehlercodes `invalid|forbidden|not_found|conflict|rate_limited|unavailable|auth` · Toast unten rechts · Beträge aus Cent (`cent()`) · kein Frappe-Begriff in der Oberfläche.

---

## 0. Entscheidungen dieser Fassung (Widersprüche aufgelöst)

Regel für Widersprüche: Zuerst gilt die **Rechtskonformität**, danach die **Einfachheit**. Wo das Backend eine Funktion nicht korrekt trägt, wird sie **ausgeblendet oder als Hinweis** gezeigt. Eine falsche Zahl oder ein falscher Beleg wird nie in Kauf genommen.

| Nr. | Entscheidung | Löst |
|---|---|---|
| E1 | **Go-Live-Sperre:** Echte Belege werden erst gestellt, wenn das Backend die K-Punkte P-01 bis P-12 (§ 15.1) geliefert hat und die StB-Fragen 1, 2, 3, 5 und 9 (§ 15.4) beantwortet sind. Bis dahin läuft der Bereich im Mock und auf einem Testmandanten. Der Bau beginnt sofort. | Fach § 1, § 8 |
| E2 | **Kassa-Grenze:** Das Backoffice nimmt kein Bargeld, keine Kartenzahlung und keine Gutscheine an. „Zahlung erfassen“ kennt nur **Überweisung** und, sobald der Schalter `stripeLink` aktiv ist (nach StB-Frage 1), **Stripe Link**. Bar und Karte erscheinen als Hinweiszeile „An der Kassa kassieren“, nie als Kanal. Für Erstattungen gilt dasselbe. | UX P12 ↔ Fach R-01/R-02/R-03/B-12/B-13 |
| E3 | **Verzögerter Commit (Variante A, 8 s)** gilt für jeden umkehrbaren Statuswechsel und für **jede Bank-Zuordnung**. Die Methode läuft erst nach Ablauf der Frist oder bei `pagehide`. Damit gibt es Undo, ohne dass das Backend eine Gegenmethode braucht. `Enter` öffnet überall, nie wird damit gebucht. | UX P1/P3 ↔ Fach U-06/B-10 |
| E4 | **Kürzel:** Einzelbuchstaben gehören der Shell und den Listen. Faktura-Aktionen laufen über `Shift+Buchstabe`, die Zeilen-Primäraktion über `Shift+Enter`, die Seiten-Primäraktion über `⌘/Strg+Enter`. Undo ist `⌘/Strg+Z`. Buchstaben-Kürzel lassen sich im Benutzer-Menü abschalten (WCAG 2.1.4). | UX P2, W1–W8 |
| E5 | **Weglassen:** Jede Akte hat 5 Tabs und höchstens 1 Banner, jede Liste genau 1 Filterzeile. „Zu tun“ ist das Hauptelement des Bereichsstarts. Der Rechnungen-Kanban entfällt, die Offenen Posten werden ein Reiter in Rechnungen, und jede Zahl erscheint auf einer Seite nur einmal. | UX P8/P9/P17/P18 |
| E6 | **Schalter statt Halbfunktionen:** Funktionen, die auf fehlenden oder fehlerhaften Backend-Teilen beruhen, hängen an Schaltern in `lib/backoffice/faktura/schalter.js` (§ 2.7). Ist ein Schalter aus, sieht der Benutzer einen ehrlichen Hinweis oder nichts. | Fach § 4 |
| E7 | **Datum:** Das Rechnungsdatum ist der Tag des Stellens. Die Leitung darf ein anderes Datum setzen, aber nie vor die letzte gestellte Rechnung und nie in einen abgeschlossenen Monat. Das **Leistungsdatum wird nie still vorbelegt**: Der Stellen-Dialog zeigt die Quelle, und ohne belastbare Quelle muss der Benutzer es bestätigen. | Fach R-08/B-04 |
| E8 | **Mahnspesen und Verzugszinsen** erscheinen erst, wenn Schalter `mahnspesen` aktiv ist (P-19/P-20). Bis dahin sind Mahnungen ohne Gebühr und Zinsen. | Fach R-15/B-07 |
| E9 | **Nur Euro** (Phase 1). Die Währung wird nur lesend als „EUR“ gezeigt, Fremdwährungskonten und CHF-Eingangsrechnungen werden mit Hinweis abgelehnt. | Fach R-13 |
| E10 | **Dialoge statt Assistenten:** „Angebot anlegen“ ist ein Dialog. „Als Auftrag übernehmen“ ist ein Dialog mit drei Abschnitten. Export und Mahnen sind je ein Sheet. Nur Teil- und Schlussrechnung haben Schritte, weil die Schritte voneinander abhängen. | UX P10/P11 |
| E11 | **Stellen und Senden in einem Dialog** (Checkbox „Danach senden“). Der Dialog nennt die Nummer nie vorab, sie erscheint erst in der Ergebnis-Karte. | UX P5 |
| E12 | **Rechte-Darstellung:** Navigation, Reiter und Massenaktionen werden ohne Recht ausgeblendet. Aktionen im Objekt stehen im `⋯`-Menü als deaktivierte Zeile „Nur Faktura-Leitung“, darunter „Leitung bitten“ (einmal je Beleg). | UX P19 |
| E13 | **Wort „Gutschrift“** bleibt in der Oberfläche, weil das Team es kennt. Den Drucktitel legt die StB fest (Frage 9). Standard bis dahin ist „Rechnungskorrektur“ mit der Unterzeile „Storno zu RE-…“ bzw. „Korrektur zu RE-…“. | Fach § 10 Nr. 9 |
| E14 | **Statustöne** folgen streng 03 § 1.5. „Gemahnt“ ist bei Stufe 1–2 orange mit Stufentext und bei Stufe 3 rot (W14). Ausgänge sind nie rot. | UX P6/P7 |
| E15 | **CSV-Export** gibt es nur für die Leitung, und jeder Export wird protokolliert. Der Präsentationsmodus sperrt Palette, Zentrale und Listen. | Fach R-17 |

---

## 1. Nutzer, Rollen und gezählte Wege

### 1.1 Rollen

| Rolle (Frappe) | Arbeitsplatz | Sieht / darf |
|---|---|---|
| Faktura Mitarbeiter (PH Faktura Mitarbeiter) | Desktop, 2 Monitore | Angebote, Aufträge, Rechnungen, Gutschriften (Entwurf), Mahnungen, ER erfassen/sachlich prüfen. Kein Bank, kein Export, keine UVA, keine Einkaufspreise/Margen (`permlevel 1` wird nicht gerendert und nicht ausgeliefert) |
| Faktura-Leitung (PH Faktura Leitung, 2FA) | Desktop | dazu Bank, Freigeben, Export, UVA, Monatsabschluss, Uneinbringlich, Storno AB, CSV, anderes Rechnungsdatum |
| Berater (Mitarbeiter + CRM) | Laptop/iPad Showroom | Angebote, Stand des Auftrags, Präsentationsmodus, Zahlungslink (Schalter) |
| Geschäftsführung | Laptop/iPad | alles lesend inkl. permlevel 1, Monatsabschluss wiederöffnen |
| Buchhaltung extern (StB) | Browser | Startseite Export-Läufe, Berichte, Belege lesend + PDF. Kein `notiz_intern`, keine Unterschrift, kein `ip_hash` |
| Kassa (via ph_kassa) | Kiosk | keine Faktura-Bedienung, Schnittstellen § 9.3 |

### 1.2 Top-Aufgaben – Ziel und gezählter Weg

Zählregel: Gezählt wird ab der Zentrale ohne Suche. Klick, Tipp, `Enter` und „Weiter“ zählen je 1, Feldeingaben zählen nicht. Hauptweg ist „Zu tun“ (Zentrale oder `/faktura`), wobei jede Zeile die Aktion direkt auslöst. Die E2E-Tests messen genau diese Wege.

| Aufgabe | Ziel | Weg |
|---|---|---|
| Anzahlung anfordern (Rechnung stellen) | 2 | Zu-tun-Zeile „Anzahlung anfordern AB-…17“ → Dialog „Rechnung stellen“ |
| Schlussrechnung | 3 | Zu-tun-Zeile „Schlussrechnung“ → Ablauf Schritt „Prüfen“ (Anzahlungen sichtbar) → „Stellen“ |
| Teilrechnung | 3 | Zu-tun-Zeile → „Alles Gelieferte“ → „Stellen“ |
| Zahlung manuell erfassen | 3 | Faktura → Zeile `Shift+Z` → „6.240,00 € buchen“ (2 über ⌘K) |
| Angebot anlegen und senden | 4 | Projekt → „Angebot anlegen“ → Dialog „Anlegen“ → (Positionen) „Senden“ → „Senden“ |
| Angebot → Auftrag | 3 | Angebot → „Als Auftrag übernehmen“ → „Auftrag anlegen“ |
| Bankumsatz zuordnen (sicher) | 2, danach 1 je Umsatz | Bank-Pill → Zeilenknopf „Zuordnen“ (Undo 8 s) |
| Mahnen | 4 | Faktura → Zu-tun „Mahnen (3)“ → „3 Mahnungen senden“ → Rückfrage „Senden“ |
| ER freigeben | 2 | Zu-tun-Zeile → „Freigeben“ (Undo 8 s) |
| Monatsexport | 3 | Zu-tun „Export Oktober“ → Sheet „Erzeugen“ → Rückfrage „Erzeugen“ |
| Gutschrift/Storno | 4 ab Rechnung | Rechnung → `⋯` „Gutschrift“ → Dialog → Stellen-Dialog |
| Stand eines Auftrags (Kunde fragt) | 2 | ⌘K + Name → Auftrag |
| Monatsabschluss | 3 | Faktura → Mehr ▾ „Monatsabschluss“ → „Oktober abschließen“ → Rückfrage (2FA) |

---

## 2. Bereichsweite Regeln

### 2.1 Bedienmuster

- **Listen (T2):** Zeile 1 enthält die gespeicherten Ansichten als Reiter (`1–9`), Zeile 2 die Filterzeile `[⌕] [Status ▾] [Art ▾] [Zeitraum ▾] [+ Filter]` mit den aktiven Filtern als Chips (03 § 8.9). Eine Status-Chip-Reihe gibt es nicht. Je Liste sind höchstens 8 Standardspalten sichtbar, weitere kommen über die Spaltenwahl. Filter, Sortierung, Seite und Ansicht stehen in der URL (`?r=&status=&art=&von=&bis=&q=&sort=&seite=`), und „Zurück“ fokussiert dieselbe Zeile. Unten steht die Summenzeile für die gefilterte Menge und die Auswahl.
- **Zeilen-Signal:** Je Zeile gibt es das Status-Badge und **höchstens ein** Signal. Rangfolge: überfällig (`triangle-alert` 12 px + „12 Tage überfällig“) vor Frist bald (`clock` 12 px + „in 3 Tagen“) vor Mahnstufe ≥ 2. Fortschritte erscheinen als Zahl. Signaltext steht in `bo-accent-text` `#6b5d4b` (hell, 6,38:1) bzw. `#d8ccb8` (dunkel), nie in Sand `#8a7a66`. Sand bleibt für Flächen, Linien und Icons.
- **Beträge:** tabellarisch und rechtsbündig im Format „9.984,00 €“. Der maßgebliche Betrag (meist „Offen“) steht in 14/500 `ink`, Nebenbeträge in `ink-soft`. Ausgänge haben ein Minuszeichen in `ink` und das Icon `arrow-up-right` 14 px `muted`, Eingänge `arrow-down-left`.
- **Side-Peek:** `Leertaste` oder Klick auf die Zeile öffnet ein Sheet mit 480 px (≥ 1440 px: 640 px), `--bo-dur-move` 200 ms `--bo-ease-out`, `translateX 16px→0` + Fade. Ein Klick auf die Nummer öffnet die Vollseite. Im Peek wechseln `↑↓`/`j k` den Datensatz, `Esc` schließt, `⌘Enter` öffnet die Vollseite. Peek-Zustände: Skeleton in Endmaß nach 300 ms, Fehler „Nicht geladen · Erneut“, gelöscht „Dieser Beleg existiert nicht mehr.“ + „Schließen“.
- **Akten (T5):** Kopf (Nummer 20/500 tabular, Art, Kunde, Status, Betrag rechts `2xl` tabular mit „offen …“ darunter), Vorgangsleiste mit Belegkette, **höchstens 1 Banner** in der Rangfolge Storniert > Monat abgeschlossen > Exportiert > Entwurf-Hinweis (weitere Hinweise als Zeile im Tab Übersicht), dann 5 Tabs (`Alt+1…5`) und die Hängemappe rechts ab 1280 px (darunter Tab-Inhalt „Bezüge“ in der Übersicht). Jede Aktion ist genau 1× sichtbar und zusätzlich 1× im `⋯`. „Nächste Schritte“ zeigt nie die Primäraktion.
- **Bodoni** erscheint nur in der Wortmarke und im Präsentationsmodus, nie in Belegköpfen. Emoji gibt es nicht, Icons kommen aus lucide (`lock`, `triangle-alert`, `clock`, `check`).
- **Karten ohne Rahmen:** Summen- und Zahlungsblöcke sind über 24 px Abstand und die Linie `line` getrennt.

### 2.2 Tastenbelegung (verbindlich, ersetzt alle Kürzel der Fassung 1)

Kürzel wirken nie in Eingabefeldern. Alle Kürzel stehen im Tooltip, rechts im Zeilen-Menü (`muted` 12 mono) und im Hilfe-Panel `?`. Die Registrierung läuft über die Kürzel-Registry des Fundaments (F3), mit Konfliktprüfung je Kontext.

| Kontext | Taste | Wirkung |
|---|---|---|
| Global | `⌘/Strg+K` · `/` · `?` · `g`+Buchstabe · `n` · `e` · `⌘S` · `⌘Enter` · `⌘Z` · `Esc` · `⌘P` · `[` `]` · `Alt+↑↓` | Palette · Suche · Hilfe · Gehe zu · Neu · Bearbeiten · Speichern · Primäraktion der Seite · Rückgängig (solange ein Undo-Toast steht) · Schließen · Drucken (Server-PDF) · Seitenleiste · voriger/nächster Datensatz |
| Liste | `↑↓` `j k` · `Enter` · `Leertaste` · `x` · `Shift+↑↓` · `a` · `s` · `c` · `1–9` · `←→` | Zeile · öffnen · Side-Peek · auswählen · Bereich wählen · zuweisen · Status · Kommentar · Reiter · Seite blättern |
| Liste/Akte Faktura | `Shift+Enter` | Primäraktion der fokussierten Zeile (Tooltip z. B. „Zuordnen · ⇧↵“) |
| | `Shift+Z` · `Shift+M` · `Shift+G` · `Shift+S` · `Shift+L` | Zahlung erfassen · Mahnen (Sheet) · Gutschrift · Senden · Zahlungslink (Schalter) |
| | `Shift+R` · `Shift+F` | Sachlich prüfen · Freigeben (ER, Leitung) |
| | `Shift+I` · `Shift+O` | Ignorieren · Wieder öffnen (Bank) |
| | `Shift+A` · `Shift+P` · `Shift+K` | Auftrag · Projekt · Kundenakte öffnen |
| Angebotsakte | `Shift+F` | Präsentationsmodus (zusätzlich sichtbarer Knopf „Präsentieren“) |
| Akte | `p` · `Alt+1…5` · `.` | Druckvorschau · Tabs · Aktionsmenü `⋯` |
| Kanban (Angebote, ER) | `←→` `↑↓` · `Enter` · `m` | Spalte/Karte · öffnen · Verschieben-Menü (nur erlaubte Ziele) |
| Positions-Tabelle | `Enter` (letzte Zelle) · `⌘Backspace` · `⌘Shift+D` · `⌘Shift+↑↓` | neue Zeile · löschen (Undo) · duplizieren · verschieben |
| Dialog | `Enter` (erst 300 ms nach dem Öffnen, `keydown.repeat` wird ignoriert) · `Esc` | Primär · Abbrechen (bei Danger hat „Abbrechen“ den Fokus) |
| Ablauf mit Schritten | `⌘Enter` | Weiter (`Enter` wirkt nur im Feld) |
| Massenlauf mit Fortschritt | `Esc` | nach dem aktuellen Beleg anhalten |
| Ohne Kürzel | Ablehnen (ER), Stornieren, Uneinbringlich, Rücktritt, Monatsabschluss, CSV | nur über `.`-Menü |

### 2.3 Undo oder Rückfrage

| Aktion | Muster |
|---|---|
| Bank zuordnen (einzeln, jede Sicherheit) | verzögerter Commit 8 s + Undo-Toast. Die Zeile blendet sofort aus (160 ms `--bo-ease-in`, Nachbarn rücken 160 ms), der Fokus springt auf die nächste offene Zeile. Höchstens 3 Commits stehen gleichzeitig aus, beim 4. wird der älteste sofort committet. Bei `pagehide` läuft `sendBeacon` an `/api/undo-commit`. |
| Bank „Sichere zuordnen (n)“ | Rückfrage sm 400 „4 Umsätze über 21.300,00 € zuordnen?“ mit Liste, danach sofort. Eine Korrektur macht die Leitung über „Zuordnung lösen“ (Schalter `zuordnungLoesen`). |
| Bank ignorieren / wieder öffnen | Grund-Popover → Undo 8 s über `wieder_oeffnen` (echte Gegenaktion) |
| ER freigeben, Angebot ablehnen, Mahnung erledigt, Zahllauf vormerken, Mahnsperre, Zuweisen, „Post heute“ markieren | verzögerter Commit 8 s. Der Grund (Ablehnen, Mahnsperre) wird **vor** dem Toast im Popover erfasst. Optimistischer Status mit `aria-live="polite"`. |
| Anzahlungen abziehen (Entwurf) | sofort. Undo setzt den gespeicherten Entwurfsstand zurück (`save` mit vorherigem `modified`-Stand). |
| Neue Version (Angebot), Gutschrift-Entwurf, Korrektur-Entwurf | sofort. Toast „… angelegt · Öffnen · Verwerfen“ (Verwerfen = Entwurf löschen) |
| Stellen, Zahlung buchen, Export erzeugen, UVA übergeben, Monat abschließen, AB stornieren, Uneinbringlich, Rücktritt, Mahnungen senden | Rückfrage. Bei Stellen und Zahlung **ist der Dialog die Rückfrage** (kein zweites Modal). Danger-Dialoge sm 400 mit Fokus auf „Abbrechen“. |
| Undo-Toast | 8 s, Balken 2 px Sand linear (`--bo-ease-linear`), Text „Zuordnung RE-2026-00042 · 6.240,00 € · Rückgängig ⌘Z“. Ein weiterer Toast stapelt sich darüber (max. 3). |

### 2.4 Statustöne (exakt 03 § 1.5)

| Beleg | grau | blau | türkis | orange | grün | rot |
|---|---|---|---|---|---|---|
| Angebot | Entwurf, Abgelaufen, Ersetzt (`<del>` + „ersetzt durch v3“) | Gesendet | – | – | Angenommen | Abgelehnt |
| Auftrag | – | Offen | In Bestellung | Teilgeliefert | Geliefert, Abgerechnet | Storniert |
| Rechnung | Entwurf | Gestellt | Teilbezahlt | Überfällig, Gemahnt Stufe 1–2 | Bezahlt | Gemahnt Stufe 3, Storniert, Uneinbringlich |
| Gutschrift | Entwurf, Erstattet | Gestellt | – | – | Verrechnet | – |
| Mahnung | Entwurf, Storniert (grau: Entwurfsrücknahme) | Gesendet | – | – | Erledigt | – |
| ER | – | Erfasst | Sachlich geprüft, Freigegeben | – | Bezahlt | Abgelehnt |
| Bankumsatz | Ignoriert | Offen | Teilweise | – | Zugeordnet | – |
| Export-Lauf | Entwurf | Erzeugt | Übergeben | – | Bestätigt | – |
| UVA | Entwurf | Berechnet | – | – | Übergeben | – |

Der Status steht immer als Punkt/Form plus Text, nie nur als Farbe. Bei docstatus 1 steht zusätzlich `lock` 12 px daneben.

### 2.5 Texte und Glossar (`lib/backoffice/faktura/texte.js`)

| Intern / alt | Oberfläche |
|---|---|
| Submit / gestellt | „Rechnung stellen“ (Tooltip „Rechnung wird nummeriert und gesperrt“) |
| `T` (12 T) | „12 Tage überfällig“, in schmalen Spalten „12 Tg.“ mit `abbr` |
| Spalte „Mahn“ | „Mahnstufe“ |
| USt-Fall | „Steuerfall“: Inland 20 % · EU-Firma (Steuerschuld Kunde) · EU-Privat (Zielland-Steuer) · Ausfuhr · Montage im Drittland (nicht steuerbar, Schalter `ausfuhr`) · Einkauf EU. „Kleinunternehmer“ wird nie angeboten. |
| igE / igL / RC / OSS / KZ | nur im Tab „Steuer & Texte“ und in der UVA, als Kennzeichen mit Langtext im `abbr title` **und** einem Hilfetext darunter |
| CAMT.053 | „Kontoauszug-Datei (CAMT.053 aus dem Online-Banking)“ |
| EPC-QR / GiroCode | „Zahl-QR-Code“ |
| MIAS | „UID prüfen“ |
| Prüfsumme / Kette prüfen | „Fälschungsschutz“ / „Buchungen auf Veränderung prüfen“ |
| Karenz | „Wartezeit vor Mahnung“ |
| Verrechnen | Knopf „Anzahlung abziehen“, Status „verrechnet“ |
| ENTW-… als Nummer | Spalte Nummer „Entwurf“ (`muted`) + Kurztitel, die Nummer erscheint nie |
| Workflow-Aktionen aus Fixtures („Sachlich pruefen“, „Zurueck an Erfassung“) | Label-Tabelle `AKTION_LABEL` im Adapter. Fixture-Texte werden nie roh angezeigt, alle Umlaute sind korrekt. |
| Anrede in Mails | `{anrede_brief}` aus `PH Kontakt.anrede`: Frau → „Sehr geehrte Frau {nachname}“, Herr → „Sehr geehrter Herr {nachname}“, Divers/leer → „Guten Tag {vorname} {nachname}“, Firma → „Sehr geehrte Damen und Herren“ (R-18) |
| Mailsignatur | Firma laut PH Firma (`firmenname`), Marke „Platzhirsch Home Living“, Sitz, Firmenbuchnummer, Gericht (§ 14 UGB, R-19) |

### 2.6 Rechte-Darstellung

- Navigation, Reiter und Massenaktionen werden ohne Recht **ausgeblendet** (z. B. Bank-Pill, Reiter „Zur Freigabe“ und „Stornieren“ in der Massenleiste für Mitarbeiter).
- Eine Aktion im Objekt steht im `⋯`-Menü als deaktivierte Zeile mit Text „Nur Faktura-Leitung“, darunter der Menüpunkt „Leitung bitten“. Er legt eine PH Aufgabe an (Kennung `faktura:bitte:<doctype>:<name>:<aktion>`) und meldet „Anfrage an Faktura-Leitung gesendet“. Ein zweiter Versuch zeigt „Bereits angefragt am 04.11. 10:14“.
- Links auf Seiten ohne Recht gibt es nicht. Beispiel: Ein Mitarbeiter sieht statt „Zum Bankumsatz“ den Satz „Passender Bankeingang über 6.240,00 € vom 03.11. liegt vor – Faktura-Leitung ordnet zu“ + „Leitung informieren“.

### 2.7 Schalter (`lib/backoffice/faktura/schalter.js`)

Die Schalter sind Server-Konstanten. Im Mock lassen sie sich einzeln umschalten, damit Abnahmen möglich sind. Der Standard ist „aus“, bis die Voraussetzung erfüllt ist.

| Schalter | Schaltet frei | Ohne Schalter | Voraussetzung |
|---|---|---|---|
| `stripeLink` | Kanal „Stripe Link“, Zahlungslink aus Angebot/Auftrag/Rechnung | Knopf fehlt. In der Zahlungskarte steht „Zahlung per Überweisung (Zahl-QR-Code auf der Rechnung)“ | StB-Frage 1 |
| `zuordnungLoesen` | „Zuordnung lösen“ (Leitung) in Bank und Rechnung, Rücklastschrift-Vorschlag, Import mit „Sichere automatisch zuordnen“ | Import ohne Auto-Zuordnung. Eine Korrektur nach dem Commit läuft über „Leitung bitten“ | P-24 |
| `guthaben` | „Rest als Guthaben“, Kachel „Guthaben offen“, Guthaben im Kontoauszug | Eine Überzahlung wird blockiert: „Höchstens 6.240,00 € – Guthaben folgt“ | P-21 |
| `differenz` | „Skonto/Kleindifferenz buchen“ (§ 5.12) | Die Differenz bleibt offen. Hinweis „Differenz 187,20 € bleibt offen“ | P-15 |
| `mahnspesen` | Gebühr, Zinsen, Spesen-OP, Erlass | Mahnungen ohne Gebühr und Zinsen | P-19, P-20 |
| `uneinbringlich` | „Als uneinbringlich buchen“ | `⋯`-Zeile deaktiviert: „Folgt – Steuerberichtigung fehlt noch“ | P-11 |
| `fagg` | FAGG-Fristdatum, Banner mit Datum, Erinnerung „Frist endet“, Rücktritt mit Fristprüfung | Info-Zeile „Vertrag außerhalb der Geschäftsräume – Rücktrittsrecht 14 Tage ab Lieferung“ ohne Datum. Rücktritt als Teilschritt-Ablauf § 5.14 | P-08, P-13 |
| `korrekturMitZahlung` | „Rechnung korrigieren“ auch bei Rechnungen mit Zahlungen | Nur ohne Zahlungen, sonst deaktiviert mit Grund | P-23 |
| `monatsabschluss` | „Monat abschließen“, Sperrbanner, Datumsprüfung gegen `gesperrt_bis` | Checkliste nur lesend, Knopf deaktiviert: „Sperre folgt mit Backend“ | P-04, P-05 |
| `stichtag` | Stichtagsfeld in OP und Bericht | Feld deaktiviert: „Stichtagsauswertung folgt“, Anzeige „Stand heute“ | P-25 |
| `ausfuhr` | Ausfuhrfelder, `/faktura/ausfuhr`, Steuerfall „Montage im Drittland“ | Warnband + Checkbox im Stellen-Dialog (§ 5.1), Aufgabe „Ausfuhrnachweis RE-…“ | P-18 |
| `restAufloesen` | „Rest auflösen“ in der Schlussrechnung (Variante A) | Die Schlussrechnung blockiert bei nicht vereinnahmter Anzahlung (§ 5.10) | P-10 + StB-Frage 3 |
| `abschlag` | Frage „abgeschlossen und abgenommen?“ in der Teilrechnung mit Weg „Abschlag“ | Teilrechnung wie heute + Hinweis § 5.9 | P-31 + StB-Frage 4 |
| `postVersand` | „Post / Persönlich übergeben“ für alle Belege mit `versandkanal` | Post-Reiter druckt und legt einen Kommentar „Per Post gesendet am …“ an. Nur die Mahnung setzt den Kanal. | P-32 |
| `lieferantenGutschrift` | Segment „Rechnung · Gutschrift“ bei ER | Hinweis „Lieferanten-Gutschrift folgt – als Notiz an der ER ablegen“ | P-30 |
| `angebotAblaufen` | „Ablaufen lassen“ (Leitung) | Aktion fehlt, der Scheduler setzt „Abgelaufen“ | P-34 |
| `uvaKorrektur` | „Korrektur-Auswertung“ nach Übergabe | Liste „nach Übergabe hinzugekommen“ + Hinweis „mit Steuerberater abstimmen“ | P-05 |

### 2.8 Rechtsregeln in der Oberfläche (unabhängig von Schaltern)

| Regel | Umsetzung | Quelle |
|---|---|---|
| Kein Barumsatz im Backoffice | Kanäle laut E2. `zahlungErfassenAction` lehnt jeden anderen Kanal ab (`invalid`), auch bei einem manipulierten Aufruf. | R-01/R-02/R-03 |
| Kassa-Anzahlung nur auf eine Anzahlungsrechnung | Faktura zeigt eine Kassa-Zahlung nur, wenn sie auf einer PH Rechnung gebucht ist. Eine Zahlungsplan-Buchung ohne Rechnung wird im Auftrag als **Datenfehler** gezeigt (Band danger „Kassa-Zahlung ohne Anzahlungsrechnung – Leitung prüfen“ + Aufgabe). | B-01/B-02 |
| Gestellte Belege nur über Methoden | Die Next-DAL schreibt gestellte Belege nie mit `setValue`/`save`, Ausnahme `mahnsperre`, `mahnsperre_grund`, `notiz_intern`. Eine Whitelist steht in `faktura/felder.js`. | B-03 |
| Rechnungsdatum | `stellenAction` setzt `datum = heute` vor `stellen()`. Ein abweichendes Datum ist nur für die Leitung erlaubt und nie vor dem Datum der letzten gestellten RE (Lesen `getList PH Rechnung` docstatus 1, Sortierung `datum desc`, Limit 1) bzw. ≤ `gesperrt_bis`. | B-04 |
| Leistungsdatum | Quelle wird angezeigt: Lieferschein-Zustellung (ph_logistik) · Montage-Abnahme (ph_projekte) · Kassa-Datum · „von Hand“. Ist der Wert nur gleich dem Rechnungsdatum (Backend-Vorbelegung bis P-06), verlangt der Dialog die Checkbox „Leistungsdatum geprüft“. | R-08 |
| UID des Empfängers | Pflicht nur, wenn der Empfänger Unternehmer ist und brutto > 10.000 € liegt, sowie immer bei EU-Firma/igL. „Unternehmer“ wird aus `PH Kontakt.kontaktart in (Geschaeft, Architekt, Partner)` oder einem gesetzten Firmennamen vorbelegt und ist im Entwurf als Schalter „Empfänger ist Unternehmer“ änderbar (Feld `empfaenger_unternehmer`, P-07). | R-04 |
| UID geprüft bei EU-Firma | Fehlt `uid_geprueft_am`, ist Stellen blockiert. Die Leitung kann mit Vermerk übersteuern, der Vermerk geht als Kommentar ins Journal. | Fach 6.20 |
| Späte Rechnung | Leistung liegt mehr als 1 Monat vor dem Rechnungsmonat → Warnband im Stellen-Dialog „Lieferung im August, Rechnung im November – die Umsatzsteuer gehört in die UVA September. Steuerberater informieren.“ `uva_monat` nach P-09. | R-09 |
| FAGG-Belehrung | Ist `vertragsort ≠ Showroom`, ist im Senden-Dialog von Angebot und AB die Checkbox „Widerrufsbelehrung beilegen“ gesetzt und nicht abwählbar. Fehlt die Belehrung, wird nicht gesendet. | R-07 |
| Annahme-Nachweis | `annehmen()` nur mit „Annahme über“ (Unterschrift Showroom · E-Mail · Portal · Telefon · Brief) und optionalem Nachweis. Ein Kanban-Drag öffnet den Dialog. | R-07 |
| Nur EUR | E9 | R-13 |
| Fixierte PDF | Es gibt kein Löschen im Backoffice. „PDF neu rendern“ gibt es nur für die Leitung und nur vor dem Versand und vor dem Export. | R-16 |
| Personendaten | CSV nur für die Leitung, protokolliert. Präsentationsmodus ohne Palette/Listen. Die StB-Rolle bekommt weder `notiz_intern` noch Unterschrift noch `ip_hash` (die Felder werden serverseitig entfernt). | R-17 |

### 2.9 Bewegung (nur Token aus 04)

| Stelle | Token |
|---|---|
| Side-Peek, Sheet öffnen | `--bo-dur-move` 200 ms `--bo-ease-out`, `translateX 16px→0` + Fade. Schließen `--bo-dur-fast` 120 ms `--bo-ease-in` |
| Dialog öffnen / schließen | `--bo-dur-base` 160 ms `--bo-ease-out` (Fade + `translateY 8px→0`) / `--bo-dur-fast` 120 ms `--bo-ease-in` |
| Druckvorschau schließen | `--bo-dur-fast` 120 ms `--bo-ease-in` |
| Stand-Band Auftrag | `--bo-dur-slow` 240 ms `--bo-ease-out`, nur bei Wertänderung nach dem Laden |
| Kennzahl-/Chart-Balken | `--bo-dur-slow` 240 ms einmalig nach dem Skeleton. Filterwechsel `--bo-dur-base` 160 ms ohne Neu-Wachsen |
| Zeile erledigt (Zu tun, Bank) | Ausblenden 160 ms `--bo-ease-in`, Nachbarn rücken 160 ms |
| PDF ersetzt Skeleton | Fade `--bo-dur-fast` 120 ms |
| Kanban unerlaubte Ablage | Rückkehr `--bo-dur-move` 200 ms + Toast mit Grund |
| Erfolgsmoment (Häkchen zeichnet `--bo-dur-draw` 400 ms) | **nur** bei Rechnung gestellt, Schlussrechnung gestellt, Anzahlung vollständig bezahlt. Gutschrift, Export, Import und Mahnlauf zeigen eine Ergebnis-Karte ohne Häkchen-Zeichnen. |
| Undo-Balken | 8 s `--bo-ease-linear` |
| `prefers-reduced-motion` | Dauer 0 für move/slow/draw/spring (04 § 2.4), nur Opazität ≤ 120 ms |

---

## 3. Seiten

**Unternavigation (Pills, Tinte aktiv):** Übersicht · Angebote · Aufträge · Rechnungen · Bank (nur Leitung/StB) · Eingangsrechnungen · Mehr ▾ (Gutschriften, Mahnungen, Zahllauf, Export, UVA, Monatsabschluss, Ausfuhrnachweise [Schalter `ausfuhr`], Berichte, Journal, Stammdaten). Zähler-Pillen gibt es nur bei > 0: Bank (offene Umsätze), Eingangsrechnungen (zur Freigabe, Leitung), Rechnungen (Entwürfe). Ohne Navigationseintrag gibt es keine Route.

**Leerzustände je Liste (Muster):** *nie Daten* (ein Satz + Primäraktion), *Filter leer* („Keine Rechnungen für diese Filter.“ + „Filter zurücksetzen“), *alles erledigt* (Satz + Häkchen-Icon 32 px Sand, ohne Aktion). **Fehler:** Block `Fehler` im Zeilenbereich mit Benutzertext und „Erneut laden“, die Werkzeugleiste bleibt bedienbar.

### 3.1 `/faktura` – Bereichsstart (T1)

```
┌ Zentrale › Faktura                                      Cockpit ( Buchhaltung | Vertrieb )   [Neu ▾] ┐
│ Faktura                                                                                              │
│ ZU TUN · 6                                                                       Alle in Zentrale → │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ ◔ Bank       3 Eingänge mit sicherem Vorschlag                             [Zuordnen ⇧↵]        │ │
│ │ ▲ Mahnen     3 Rechnungen mahnbar · älteste 12 Tage überfällig             [Mahnen]             │ │
│ │ ◷ Freigeben  ER-2026-00018 Bulthaup · Skonto noch 2 Tage · 8.722,00 €      [Freigeben]          │ │
│ │ ○ Anzahlung  AB-2026-00019 Huber · noch nicht angefordert · 2.448,00 €     [Anzahlung anfordern]│ │
│ │ ○ Rechnung   AB-2026-00017 Geliefert, nicht abgerechnet                    [Schlussrechnung]    │ │
│ │ ◷ Export     Oktober noch nicht an Kanzlei                                 [Export erzeugen]    │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌ OFFENE POSTEN ──┐ ┌ ÜBERFÄLLIG ─────┐ ┌ ANZAHLUNGEN OFFEN ┐ ┌ UMSATZ OKTOBER (netto) ┐             │
│ │ 48.230,00 €     │ │ 6.240,00 €      │ │ 12.400,00 €       │ │ 31.900,00 €  ▁▃▅▆      │             │
│ │ 14 Rechnungen → │ │ 3 Rechnungen →  │ │ 4 Aufträge →      │ │ Kein Vergleich          │             │
│ └─────────────────┘ └─────────────────┘ └───────────────────┘ └─────────────────────────┘             │
│ Offene Posten nach Alter  [ 0–7 ▇▇▇▇▇▇ | 8–30 ▇▇▇ | 31–60 ▇ | > 60 ▏ ]   (ein Band, Segment = Filter)  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Zu tun** steht oben über die volle Breite, mit höchstens 8 Zeilen, Zeilenhöhe 44 und Hover `surface-2` 120 ms. Jede Zeile hat eine Icon-Form (nicht nur Farbe), ein Typ-Wort, einen Satz, den Betrag und **eine** Aktion. `Enter` öffnet den Beleg, `Shift+Enter` oder der Knopf führt die Aktion aus. Eine erledigte Zeile blendet aus (§ 2.9). „Alle (n)“ führt zur Zentrale/Aufgaben, gefiltert auf `faktura:*`.
- **Regeln für Zu tun** (`lib/backoffice/faktura/zuTun.js`, auch von der Zentrale genutzt): Bank offen mit Sicherheit „Sicher“ (Leitung) · mahnbar laut Vorschlag (zusammengefasst als eine Zeile) · ER „Sachlich geprüft“ (Leitung) bzw. „Erfasst“ (Mitarbeiter) · AB Offen mit Zahlungsplan-Anzahlung ohne `rechnung`, älter als 1 Tag · AB Geliefert und nicht abgerechnet, älter als 3 Tage · Rechnungs-Entwurf älter als 2 Tage · Export des Vormonats ab dem 5. · UVA berechnet und nicht übergeben · Rückzahlung (Rücktritt/Gutschrift Rückzahlung) fällig in ≤ 3 Tagen, rot ab Tag 12 · Ausfuhrnachweis fällig (Schalter) · Kassa-Datenfehler (§ 2.8) · Monatsabschluss des Vormonats offen (Leitung, ab dem 10.). Die Schwellen sind Konstanten in `zuTun.js` und werden im Stammdaten-Tab lesend angezeigt (Felder in den Einstellungen fehlen, siehe § 15.1 P-35).
- **Kennzahlen:** 4 je Cockpit (§ 7). Heute-Chips gibt es nicht, jede Zahl erscheint nur einmal (die Pill-Zähler zählen als Navigation). Ein frischer Mandant zeigt `0,00 €` in `ink`, und „Zu tun“ zeigt die Erste-Schritte-Karte (Firmendaten prüfen → Zahlungsbedingungen → Bankkonto → erstes Angebot).
- **Cockpit Vertrieb:** Zu tun (Angebote nachfassen, Anzahlung anfordern, Angebote laufen ≤ 7 Tage ab), Kennzahlen Offene Angebote, Auftragsbestand, Angebotsquote, Liefertermine 30 Tage. Primär „Angebot anlegen“. Im Cockpit Buchhaltung gibt es keinen Primärknopf (Zu tun ist die Aktion), sekundär „Neu ▾“ (Angebot · Rechnung · Eingangsrechnung).
- **Charts** stehen unter „Berichte“, auf der Startseite nur das Altersband.
- **Laden:** jede Kachel mit eigenem Suspense. Fehler je Kachel: Wert „–“ + „Nicht geladen · Erneut“.

### 3.2 `/faktura/angebote` (T2, `?ansicht=kanban` T3)

```
┌ Zentrale › Faktura › Angebote                                          [Angebot anlegen]  Liste|Kanban ┐
│ Offene · Meine · Läuft bald ab · Gewonnen · Alle · [+ Ansicht]                                         │
│ [⌕ Nummer, Titel, Kunde]  [Status ▾]  [Berater ▾]  [Zeitraum ▾]  [+ Filter]                            │
│ ☐ Nummer         Titel / Kunde               Projekt    Gültig bis            Berater   Brutto       Status      │
│ ☐ AN-2026-00088  Küche Fam. Muster · Lochau  P-26-0009  02.12.                A.B.     24.960,00 €  ● Gesendet  │
│ ☐ AN-2026-00087  Terrasse Huber              –          27.11. ◷ in 3 Tagen   M.K.      6.120,00 €  ● Gesendet  │
├ 25 von 61 · Summe gefiltert 318.400,00 €                                                                ┤
└ Auswahl (2): [Senden] [Nachfassen] [Zuweisen] [Drucken]                                                 ┘
```

- **Spalten:** Nummer (Entwurf: „Entwurf“ `muted`), Titel mit `kunde_name · ort` in Zeile 2, Projekt (Link), Gültig bis (Signal), Berater (die ganze Zelle ist das Inline-Ziel, Zeilenhöhe ≥ 40), Brutto, Status. Optional: Datum, Version, Vertragsort, Anzahlung %, Quelle, Gesendet am.
- **Reiter:** Offene = `status in (Entwurf, Gesendet)`, sortiert nach Gültig bis aufsteigend. „Läuft bald ab“ = Gesendet und `gueltig_bis ≤ heute + 7`.
- **Inline:** Berater, Gültig bis (nur Entwurf/Gesendet).
- **Kanban** mit den Spalten Entwurf · Gesendet · Angenommen · Abgelehnt. Entwurf→Gesendet geht nur über den Senden-Dialog (kein Drag). Gesendet→Angenommen öffnet den Annehmen-Dialog (§ 5.6). Gesendet→Abgelehnt öffnet das Grund-Popover und läuft als verzögerter Commit. Eine unerlaubte Ablage kehrt zurück, dazu der Toast „Von Entwurf nach Angenommen nur über ‚Annehmen‘“. Das `m`-Menü zeigt nur erlaubte Ziele. Karte: Nummer mono, Titel, Brutto, ein Signal, Avatar, „ruht seit 12 Tagen“ bei Gesendet ohne Bewegung > 10 Tage.
- **Zeilenmenü:** Öffnen, In neuem Tab, PDF, Senden, Als Auftrag übernehmen, Neue Version, Duplizieren, Drucken.
- **Massenaktionen:** Senden (Vorschau „4 von 5 möglich – 1 ohne E-Mail → Post“), Nachfassen (Mailvorlage „Angebot nachfassen“, Vorschau je Empfänger), Zuweisen (verzögerter Commit), Drucken (Sammel-PDF). „Ablaufen lassen“ gibt es nur mit Schalter `angebotAblaufen`.
- **Leer:** nie – „Noch keine Angebote. Angebote entstehen aus einem Projekt oder direkt hier.“ + „Angebot anlegen“ · Filter – „Keine Angebote für diese Filter.“ + „Filter zurücksetzen“ · Läuft bald ab – „Kein Angebot läuft in den nächsten 7 Tagen ab.“

### 3.3 `/faktura/auftraege` (T2)

```
┌ Zentrale › Faktura › Aufträge                                                           ┐
│ Laufend · Anzahlung offen · Lieferbereit · Nicht abgerechnet · Alle                      │
│ [⌕]  [Status ▾]  [Liefer-KW ▾]  [Berater ▾]  [+ Filter]                                  │
│ ☐ Nummer        Kunde / Projekt        Liefertermin   Anzahlung          Stand           Offen        Status         │
│ ☐ AB-2026-00017 Fam. Muster · Küche    KW 48 ✓        9.984 / 9.984 ✓    geliefert 75 %  14.976,00 €  ● In Bestellung│
│ ☐ AB-2026-00019 Huber · Terrasse       KW 50 (geplant) 0 / 2.448          –               6.120,00 €  ● Offen        │
├ 22 Aufträge · Auftragswert 412.300,00 € · Offen 188.900,00 €                              ┤
└ Auswahl: [Anzahlung anfordern] [Drucken]                                                  ┘
```

- **Spalten:** Nummer, Kunde/Projekt, Liefertermin (bestätigt ✓ / „(geplant)“ / „–“; Signal überfällig, wenn bestätigt < heute und Status ≠ Geliefert), Anzahlung als Text „Ist / Soll“ (+ ✓ wenn erfüllt, kein Balken), Stand als ein Wort mit Zahl (Rang: abgerechnet > geliefert), Offen, Status. Optional: Datum, Montage ✓, Montagetermin, Vertragsort, Berater, Angebot.
- **Reiter:** Laufend = Status Offen, In Bestellung, Teilgeliefert, Geliefert. „Anzahlung offen“ = `anzahlung_ist_cent < anzahlung_soll_cent` und Status Offen/In Bestellung. „Lieferbereit“ = In Bestellung (die Bedingung „alle Herstellerbestellungen geliefert“ folgt mit ph_sortiment, bis dahin steht im Reiter-Tooltip „ohne Prüfung der Herstellerbestellungen“). „Nicht abgerechnet“ = Geliefert und `abgerechnet_cent < auftragswert_cent`.
- **Inline:** Liefertermin geplant, Liefer-KW, Montagetermin, Berater. Bei Änderung des Liefertermins kommt der Toast „Kunde informieren?“ → Mailvorlage.
- **Zeilen-Primäraktion** je Zustand: Anzahlung offen → „Anzahlung anfordern“ · Anzahlung erfüllt + Offen → „Herstellerbestellungen erzeugen“ (ph_sortiment) · Teilgeliefert → „Teilrechnung“ · Geliefert → „Schlussrechnung“.
- **Massenaktionen:** Anzahlung anfordern (nur Offen mit offener Anzahlungszeile, öffnet den Dialog § 5.3 im Sammelmodus mit Vorschau), Drucken. „Stornieren“ und „Lieferung melden“ gibt es nur in der Akte.
- **Leer:** „Noch keine Aufträge. Ein Auftrag entsteht aus einem angenommenen Angebot.“ + „Zu den Angeboten“.

### 3.4 `/faktura/rechnungen` (T2) mit Reiter „Offene Posten“

```
┌ Zentrale › Faktura › Rechnungen                                                     [Neu ▾] ┐
│ Offen · Entwürfe 3 · Überfällig · Offene Posten · Anzahlungsrechnungen · Bezahlt · Alle      │
│ [⌕ Nummer, Kunde, Betrag]  [Status ▾]  [Art ▾]  [Zeitraum ▾]  [+ Filter]                     │
│ ☐ Nummer          Kunde · Auftrag        Art        Fällig                    Offen        Status            │
│ ☐ RE-2026-00042   Fam. Muster · AB-…17   Anzahlung  ▲ 12 Tage überfällig     6.240,00 €   ● Gemahnt · Stufe 1│
│ ☐ RE-2026-00044   Beispiel GmbH          Rechnung   ◷ in 9 Tagen             1.560,00 €   ● Gestellt         │
│ ☐ Entwurf         Huber · AB-…19         Schluss    –                       12.240,00 €   ○ Entwurf          │
├ 25 von 1.284 · Zahlbar 214.300,00 € · Offen 48.230,00 € · Auswahl 2 → offen 7.800,00 €      ┤
└ Auswahl (2): [Mahnen] [Senden] [Post heute] [Drucken] [Mehr ▾ Mahnsperre]                    ┘
```

- **Spalten (Standard 6):** Nummer, Kunde · Auftrag, Art (Rechnung · Anzahlung · Teil · Schluss · Barverkauf), Fällig mit Signal, Offen (`ink` 500; 0 → „–“), Status inkl. Mahnstufe als Text. Optional: Datum, Zahlbar, Leistungsdatum, Steuerfall, Exportiert (`lock`), Gesendet am / Versandkanal, Bezahlt am, Zahlungsreferenz, Projekt.
- **Reiter „Entwürfe“** hat immer eine Zähler-Pille. Standard „Offen“ = Gestellt, Teilbezahlt, Überfällig, Gemahnt, sortiert nach Fällig aufsteigend. Gruppierung (C8) nach Monat, Kunde, Art, Status.
- **Reiter „Offene Posten“** (ersetzt die eigene OP-Seite, `/faktura/offene-posten` leitet auf `?r=offene-posten` um): Kopfzeile „Offen gesamt 48.230,00 € · davon überfällig 6.240,00 € · 14 Belege“ (genau diese Zahlen, keine Kacheln) und das Altersband (4 Segmente, Klick filtert `?alter=`). Schalter „Nach Kunde gruppieren“ mit Gruppenkopf (Zähler, Summe, Aktion „Kontoauszug“). Datenquelle `getReport("PH Offene Posten")`. Das Feld **Stichtag** ist bis Schalter `stichtag` deaktiviert mit dem Tooltip „Stichtagsauswertung folgt“ und der Anzeige „Stand heute, 04.11.2026“. Spalten: Rechnung, Kunde, Fällig, Tage, Offen, Mahnstufe, Letzte Mahnung, Auftrag. Primär im Reiter „Mahnen (n)“ öffnet das Mahnen-Sheet.
- **Inline:** Mahnsperre (Switch, Grund im Popover Pflicht, verzögerter Commit).
- **Kein Kanban** für Rechnungen.
- **Zeilenmenü:** Öffnen, Neuer Tab, PDF, Senden, Zahlung erfassen, Zahlungslink (Schalter), Mahnen, Gutschrift, Rechnung korrigieren, Kontoauszug Kunde, Kundenakte, Auftrag.
- **Massenaktionen** (immer mit Vorschau „n von m möglich – k übersprungen (Grund)“): Mahnen (→ Sheet mit Vorauswahl), Senden (nur gestellte, ohne E-Mail → Post-Teil), „Post heute (n)“ (Sammel-PDF in PLZ-Reihenfolge, danach Markierung als verzögerter Commit), Drucken (Sammel-PDF; ab 51 Belegen als Hintergrundauftrag mit Benachrichtigung „Sammel-PDF bereit“), Mahnsperre setzen/aufheben, CSV (nur Leitung, protokolliert). Kein Massen-„Stellen“ und kein Massen-„Zahlung erfassen“.
- **Leer:** nie – „Noch keine Rechnungen. Rechnungen entstehen aus einem Auftrag.“ + „Zu den Aufträgen“ · Überfällig – „Keine überfälligen Rechnungen.“ (Häkchen) · Offene Posten – „Keine offenen Posten.“ (Häkchen) · Filter – „Keine Rechnungen für diese Filter.“ + „Filter zurücksetzen“.

### 3.5 `/faktura/bank` (T2, nur Leitung; StB lesend)

```
┌ Bank · Raiba Lochau ▾                                         Saldo lt. Auszug 31.10.: 42.118,30 €  [Auszug importieren] ┐
│ Offen 12 · Teilweise 1 · Zugeordnet · Ignoriert · Alle                                                                │
│ [⌕ Name, Zweck, Betrag]  [Richtung ▾]  [Zeitraum ▾]  [Sicherheit ▾]  [+ Filter]                                       │
│ ☐ 03.11.  ↙ Muster Max     RE-2026-00042 Anzahlung Küche   6.240,00 €   → RE-2026-00042 · Fam. Muster   Sicher       [Zuordnen] │
│ ☐ 03.11.  ↙ M. Muster      AB-2026-00019 Terrasse          2.448,00 €   → AB-2026-00019 · Anzahlung     Auftrag      [Prüfen]   │
│ ☐ 03.11.  ↙ M. Muster      Kueche                          3.744,00 €   → RE-2026-00046 · Fam. Muster   Wahrscheinlich [Prüfen] │
│ ☐ 02.11.  ↗ BULTHAUP GMBH  RG 4711 / Komm. Muster         −8.900,00 €   → ER-2026-00018 · Bulthaup      Möglich      [Prüfen]   │
│ ☐ 02.11.  ↗ Raiffeisen     Kontoführung                      −12,40 €   kein Vorschlag                  –            [Ignorieren]│
├ 12 offen · Eingang 12.432,00 € · Ausgang −8.912,40 €                                                                   ┤
└ Auswahl (4): [Sichere zuordnen (2)] [Ignorieren] [Wieder öffnen]                                                       ┘
 Toast: ✓ Zuordnung RE-2026-00042 · 6.240,00 €              Rückgängig ⌘Z   ▬▬▬▬▬▬▬▬▬▬ (8 s)
```

- **Sicherheit als Wort** (Zahl nur im Peek): Sicher (100, Zahlungsreferenz im Verwendungszweck) · Wahrscheinlich (80, Betrag und Name) · Möglich (60, Betrag exakt) · Unklar (40, Name/Teilbetrag). Neu ist **Auftrag**: Die AB-Nummer wird im Verwendungszweck erkannt (`bankanker.js`, Muster `AB-\d{4}-\d{5}`). Das gilt solange das Backend keine Vorschläge auf AB liefert (P-24).
- **Aktionen:** „Zuordnen“ (nur bei Sicher, Knopf oder `Shift+Enter`) → verzögerter Commit (§ 2.3). „Prüfen“ öffnet den Side-Peek mit dem Vorschlag. Dort `[Anderen Beleg wählen]` (→ Zuordnen-Dialog § 5.11) und `[Zuordnen ⇧↵]`. Bei „Auftrag“ ist die Peek-Primäraktion „Anzahlungsrechnung stellen und zuordnen“ (§ 5.11). `Enter` öffnet immer nur den Peek.
- **Side-Peek:** oben der Umsatz (Auftraggeber, IBAN, Zweck voll, Valuta, End-to-End, Mandat), unten der Beleg (Nummer, Kunde, Zahlbar, Offen, Fällig, Mahnstufe, Grund des Vorschlags „Rechnungsnummer im Verwendungszweck“, Sicherheit 100).
- **Gleichzeitigkeit:** Antwortet `zuordnen` mit `conflict`, kommt der Toast (Warnung) „Bereits zugeordnet von Anna (10:42) – RE-…42“ + „Ansehen“. Die Zeile verschwindet, eine Doppelbuchung entsteht nicht.
- **Import-Sheet** (480 px): Dropzone für die Kontoauszug-Datei (CAMT.053), Konto vorbelegt. Der Schalter „Sichere Treffer automatisch zuordnen“ ist nur mit Schalter `zuordnungLoesen` sichtbar. Ablauf: „Importieren“ → nach 300 ms Spinner im Knopf → Ergebnis-Karte „38 Umsätze: 31 neu · 7 bereits vorhanden · 18 mit Vorschlag · 9 automatisch zugeordnet“ + „Offene ansehen“. Fehler im Sheet (die Datei bleibt): unlesbar „Die Datei konnte nicht gelesen werden: …“ · Doppelimport „Diese Datei wurde bereits importiert“ + Link · falsches Konto „Die Datei gehört zum Konto AT12 … 3456, gewählt ist Raiba Lochau (… 7890).“ + „Konto wechseln“ / „Andere Datei“ · Fremdwährung „Konto in CHF – Fremdwährung noch nicht freigegeben“.
- **Mehr ▾:** Importe (Liste PH Bankimport), Zuordnung lösen (Schalter).
- **Mobil < 1024 px:** einspaltig (Umsatz, Vorschlag), feste Leiste „Zuordnen“ 48 px unten, `scroll-padding-bottom` = Leistenhöhe + 16 px.
- **Leer:** nie – „Noch kein Kontoauszug importiert. Lade die Kontoauszug-Datei aus dem Online-Banking hoch.“ + „Auszug importieren“ · alles erledigt – „Alle Bankumsätze zugeordnet.“ (Häkchen).

### 3.6 `/faktura/eingangsrechnungen` (T2, `?ansicht=kanban`)

```
┌ Zentrale › Faktura › Eingangsrechnungen                                        [Eingangsrechnung erfassen] ┐
│ Zu prüfen 4 · Zur Freigabe 2 · Zu zahlen 6 · Skonto läuft ab · Bezahlt · Alle                              │
│ [⌕]  [Status ▾]  [Lieferant ▾]  [Fällig ▾]  [+ Filter]                                                      │
│ ☐ Nummer        Lieferant · Rechnungsnr.    Fällig     Skonto bis          Zahlbetrag  Bezug           Status           │
│ ☐ ER-2026-00018 Bulthaup · 4711             27.11.     ◷ 06.11. (2 Tage)   8.722,00 €  HB-…031 · P-…09 ● Sachlich geprüft │
│ ☐ ER-2026-00019 Spedition Lang · 2026-998   13.11.     –                     420,00 €  –               ● Erfasst          │
└ Auswahl (3): [Sachlich prüfen] [Freigeben] [Für Zahllauf vormerken] [Mehr ▾ Ablehnen]                         ┘
```

- **Spalten:** Nummer, Lieferant · Rechnungsnummer, Fällig, Skonto bis (Signal), Zahlbetrag, Bezug (Chips Herstellerbestellung · Projekt · Auftrag), Status. Optional: Datum, Brutto, Steuerfall, Vorsteuer, Zahllauf ✓, Eingang am, Datei, Buchungsmonat, Exportiert.
- **Reiter:** „Zur Freigabe“ gibt es nur für die Leitung. „Skonto läuft ab“ = `skonto_bis ≤ heute + 5` und Status ≠ Bezahlt.
- **Side-Peek (Prüfmodus):** links das PDF (`/api/datei`), rechts Beträge, Steuerfall und Bezug. `↓` nächste, `Shift+R` Sachlich prüfen (Prüfvermerk optional, Antwort „Abweichung: …“ als Warn-Toast), `Shift+F` Freigeben (Leitung, verzögerter Commit, das Undo hält den Zustand „Sachlich geprüft“ mit unverändertem `geprueft_von/am`). Ablehnen gibt es nur im `.`-Menü (Grund Pflicht, Rückfrage).
- **Kanban** mit den Spalten Erfasst · Sachlich geprüft · Freigegeben · Bezahlt. Erlaubte Züge: Erfasst→Sachlich geprüft (Mitarbeiter), Sachlich geprüft→Freigegeben (Leitung, verzögerter Commit), Freigegeben→Bezahlt öffnet den Dialog „Als bezahlt buchen“, rückwärts →Erfasst. Exportierte ER lassen sich nicht ziehen (Rückkehr + Toast „Exportiert – Korrektur nur über Lieferanten-Gutschrift“).
- **Neu-Sheet** (640 px): zuerst die Dropzone, dann Lieferant (Link mit Anlegen), Rechnungsnummer (Doppelerfassung live: „Rechnung 4711 von Bulthaup ist bereits als ER-… erfasst“ + Link), Datum, Fällig, Netto/USt/Brutto (Brutto ≠ Netto + USt → Feldfehler), Steuerfall, Skonto % + bis, Bezug (eine Herstellerbestellung füllt Projekt/Auftrag), IBAN/Referenz. Eingeklappt unter „Weitere Angaben“: Positionen/Steuersätze (`ust_aufteilung`), Konto, Leistungsdatum, Notiz. Checkbox „Rechnung in Fremdwährung“ → Hinweis „Fremdwährung noch nicht freigegeben – Beleg an Steuerberater, Aufgabe angelegt“ (E9). Segment „Rechnung · Gutschrift“ nur mit Schalter `lieferantenGutschrift`. Knöpfe „Anlegen“ / „Anlegen und prüfen“. Eine Belegerkennung (OCR) gibt es nicht, und sie wird nicht versprochen.
- **Nach Export** (`export_status = exportiert`): Beträge, Steuerfall, Datum, „Zurück an Erfassung“ und „Ablehnen“ sind gesperrt. Banner info „Exportiert in EX-… – Korrektur nur über Lieferanten-Gutschrift“ (B-17).
- **Massenaktionen:** Sachlich prüfen, Freigeben (Leitung, verzögerter Commit), Für Zahllauf vormerken (verzögerter Commit), Ablehnen (Grund, unter Mehr). „Als bezahlt“ steht in `/faktura/zahllauf`.
- **Mobil:** Karte mit PDF-Vorschau (erste Seite, Tipp = Vollbild), darunter Knöpfe „Freigeben“ (primär, 48 px) und „Ablehnen“. Die Wischgeste ist nur ein Zusatz.
- **Leer:** nie – „Noch keine Eingangsrechnungen. Lege das PDF des Lieferanten hier ab.“ (die Dropzone ist im Leerzustand aktiv) · Zu prüfen – „Nichts zu prüfen.“ (Häkchen).

### 3.7 `/faktura/export` (T2 + Export-Sheet § 5.15)

```
┌ Zentrale › Faktura › Export an Kanzlei                                             [Neuer Export] ┐
│ Nicht exportiert: 23 Belege (19 bis 31.10.) · Letzter Lauf EX-2026-0010 Oktober · bestätigt 02.11. │
│ ☐ Lauf          Format               Zeitraum        Belege  Summe brutto   Übergeben an    Status      │
│ ☐ EX-2026-0010  BMD CSV              01.10.–31.10.   61      214.300,00 €   Kanzlei · Mail  ● Bestätigt │
│ ☐ EX-2026-0011  DATEV Buchungsstapel 01.11.–04.11.   7        18.400,00 €   –               ○ Entwurf   │
└ Zeile je Status: Entwurf → [Erzeugen] · Erzeugt → [Herunterladen] [Protokoll] [Als übergeben] [Verwerfen] · Übergeben → [Von Kanzlei bestätigt] ┘
```

- Übergebene Läufe lassen sich nicht löschen. „Verwerfen“ (nur Erzeugt) gibt die Belege mit Rückfrage wieder frei.
- **Erzeugen bricht ab:** Banner danger im Lauf „Export nicht erzeugt. Belege sind nicht gesperrt.“ + „Erneut erzeugen“. Das Backend muss das garantieren (§ 15.1 P-36). Bis dahin liest die Action nach dem Fehler `export_status` der Belege neu und zeigt den tatsächlichen Zustand.
- **StB-Rolle:** Startseite; sie darf nur herunterladen, das Protokoll öffnen und lesen.
- **Leer:** nie – „Noch kein Export. Der erste Lauf fasst alle gestellten Belege bis zum gewählten Datum zusammen.“ + „Neuer Export“ · alles exportiert – „Alle gestellten Belege sind übergeben.“ (Häkchen).

### 3.8 `/faktura/uva` (T8 + PH UVA Auswertung)

```
┌ Zentrale › Faktura › UVA                                 [Monat ▾ Oktober 2026]   [An Steuerberater übergeben] ┐
│ ⓘ Zuarbeit für den Steuerberater, keine Meldung. Methode und Steuercodes sind noch nicht bestätigt.              │
│ UVA-2026-010 · 01.10.–31.10.2026 · berechnet 01.11. 06:15 · Sollversteuerung, Anzahlungen nach Vereinnahmung     │
│ Bezeichnung                                   Kennzahl  Bemessung       Steuer        Belege                      │
│ Lieferungen und Leistungen gesamt             000       178.400,00 €    –             61  ▸                       │
│ Inland 20 %                                   022       170.600,00 €    34.120,00 €   58  ▸                       │
│ Anzahlungen vereinnahmt                       –          12.400,00 €     2.066,67 €    4  ▸                       │
│ Zahllast                                                                 …                                        │
│ Nach Übergabe hinzugekommen (Oktober): 2 Belege ▸                                                                 │
└ [Neu berechnen] [Drucken]                                                                                        ┘
```

- Die Bezeichnung steht vorn, die Kennzahl als Nebenspalte mit `abbr`. „▸“ öffnet den Peek mit den Belegen der Kennzahl. Eine strukturierte Liste je Kennzahl fehlt im Backend, bis dahin der Text `belegliste`.
- Der Monat wird am 1. automatisch angelegt. Fehlt er: „Für Oktober 2026 noch keine Auswertung.“ + „Berechnen“.
- **Nach Übergabe** ist die Auswertung nur lesend. Die Zeile „Nach Übergabe hinzugekommen“ = Belege mit `uva_monat` = Monat und `creation > uebergeben_am`. „Korrektur-Auswertung“ gibt es nur mit Schalter `uvaKorrektur`, sonst steht dort der Hinweis „Mit Steuerberater abstimmen“. Der Satz „Für Korrekturen neue Auswertung“ der Fassung 1 entfällt.
- Uneinbringlich-Zeilen (§ 16 Abs 3) und Skonto-Minderungen erscheinen erst mit P-11/P-15.
- Drucken: Ein Druckformat fehlt, bis dahin Report-Druck „PH UVA Zuarbeit“.

### 3.9 `/faktura/abschluss` – Monatsabschluss (T8, Leitung)

```
┌ Zentrale › Faktura › Monatsabschluss                         [Oktober 2026 ▾]   [Oktober abschließen] ┐
│ 1 Entwürfe mit Datum Oktober                         0   ✓                                           │
│ 2 Bankumsätze Oktober offen                          3   ● → Bank                                    │
│ 3 Eingangsrechnungen Oktober nicht freigegeben       2   ● → Eingangsrechnungen                      │
│ 4 Ausfuhrnachweise fällig                            1   ● → Liste            (nur Schalter ausfuhr)  │
│ 5 Kassa-Abgleich Oktober                             ✓   (Report Abgleich Kassa ↔ Faktura, P-02)     │
│ 6 UVA berechnet                                      ✓   UVA-2026-010                                │
│ 7 Export erzeugt                                     ✓   EX-2026-0010                                │
│ Zuletzt abgeschlossen: September 2026 (05.10., A. B.)                                                 │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- Die Punkte ● blockieren nicht, sie werden in der Rückfrage aufgelistet („3 Hinweise trotzdem abschließen“). Rückfrage sm: „Belege bis 31.10. sind danach nicht mehr änderbar. Spätere Korrekturen landen im November.“ + 2FA-Bestätigung (Fundament). Der Abschluss setzt `gesperrt_bis` und übergibt die UVA.
- Wiederöffnen darf nur die Geschäftsführung, mit Grund (Journal „Korrektur“).
- Ohne Schalter `monatsabschluss` ist der Knopf deaktiviert mit dem Text darunter „Sperre folgt mit dem Backend (gesperrt_bis)“. Die Checkliste funktioniert trotzdem.
- **Wirkung in Akten:** Banner info „Oktober abgeschlossen – Korrekturen im November“. Datumsfelder lassen keinen Wert ≤ `gesperrt_bis` zu (Feldfehler).
- **Leer** (erste Nutzung): „Noch kein Monat abgeschlossen. Der erste Abschluss sperrt alle Belege bis zum Monatsende.“

### 3.10 `/faktura/ausfuhr` – Ausfuhrnachweise (Schalter `ausfuhr`)

- **Spalten:** Rechnung, Kunde, Land, Art (Versendung · Abholung Kunde · Montage im Drittland), Betrag, Rechnungsdatum, Nachweis (fehlt ▲ · Ausgangsvermerk · U34 ✓), Frist (`ausfuhrnachweis_tage` laut StB).
- **Zeilenaktion** „Nachweis erfassen“ öffnet das Sheet (Ausgangsvermerk-Nummer, Datum, Datei). Ist die Frist ohne Nachweis abgelaufen, geht eine Aufgabe an die Leitung mit der Aktion „Nachversteuern“ (= Rechnung korrigieren § 5.13 mit Steuerfall Inland 20 %).
- **Leer:** „Keine offenen Ausfuhrnachweise.“ (Häkchen).

### 3.11 Weitere Seiten

| Route | Typ | Inhalt |
|---|---|---|
| `/faktura/gutschriften` | T2 | Nummer, Art (Storno · Teilgutschrift · Retoure · Wertminderung · Kulanz), Rechnung, Kunde, Brutto, Erstattung (Verrechnung · Rückzahlung · Keine), Erstattet, Status. Leer: „Noch keine Gutschriften. Gutschriften entstehen aus einer Rechnung.“ · Filter: „Keine Gutschriften für diese Filter.“ + „Filter zurücksetzen“ |
| `/faktura/mahnungen` | T2 | Nummer, Rechnung, Kunde, Stufe (Text „Stufe 2“), Zahlung bis, Offen, Gesamt (Gebühr/Zinsen nur mit `mahnspesen`), Kanal, Status, gruppiert nach `mahnlauf`. Reiter „Entwürfe aus Mahnlauf“ mit „Senden (n)“ und „Post heute (n)“. Zeile: Senden, Als per Post gesendet markieren (Druck + `pdf_fixieren` nach P-33), Erledigt (verzögerter Commit), Stornieren (nur Entwurf), PDF. Leer: „Noch keine Mahnungen.“ |
| `/faktura/zahllauf` | T8 Arbeitsliste | Report „PH Zahllauf Vorschlag“: ER, Lieferant, Rechnungsnummer, Fällig, Skonto bis, Skonto, Zahlbetrag (zur Laufzeit berechnet), IBAN, Verwendungszweck. Auswahl → „Als bezahlt buchen (n)“ (Datum, Kanal Überweisung, Vorschau, Rückfrage) und „Zahlliste drucken“ (Report-Druck). Eine SEPA-Datei fehlt. Leer: „Keine Eingangsrechnung zur Zahlung fällig.“ |
| `/faktura/journal` | T2 lesend | Zeitpunkt, Vorgang, Beleg, Nummer, Betrag, Benutzer, Fälschungsschutz (mono gekürzt, Tooltip voll). Knopf „Buchungen auf Veränderung prüfen“ (Leitung, nach Whitelist `journal.kette_pruefen`) → Toast „Geprüft: n Einträge, keine Abweichung“ oder Banner danger mit der ersten Bruchstelle. Leer: „Noch keine Buchung. Einträge entstehen beim ersten Stellen.“ |
| `/faktura/berichte/[report]` | T8 | Anzahlungsstand, Offene Posten (Stichtag-Schalter), UVA-Zuarbeit, OSS je Land, Nummernlücken, Umsatz nach Marke (Einkauf/Marge nur permlevel 1), Vertriebscockpit, Export-Abgleich, Mahnvorschlag, Abgleich Kassa ↔ Faktura (P-02). Aus den Report-Filtern entsteht das Filterformular, die Summary wird zu Kennzahlen, Charts mit `<details>`-Tabelle. CSV nur Leitung. Leer: „Keine Daten im Zeitraum 01.10.–31.10.2026.“ + „Zeitraum ändern“ |
| `/faktura/stammdaten` | T9 | Tabs: **Zahlungsbedingungen** (Titel, Anzahlung %, Teilzahlung %, Rest berechnet, Zieltage, Skonto % / Tage, Text, Standard; Live-Fehler „Anzahlung und Teilzahlung dürfen 100 % nicht übersteigen“; Live-Satz „Kunde zahlt 40 % bei Auftrag, 50 % bei Lieferung, 10 % nach Montage“) · **Bankkonten** (IBAN-Prüfung, Standard, Währung lesend, letzter Import) · **Faktura-Einstellungen** (Allgemein, Umsatzsteuer, Konten mit Hinweis „mit Kanzlei abstimmen“, Textvorlagen; OSS nur mit Registrierung) · **Mahnwesen** (Stufen-Tage aufsteigend live geprüft, Wartezeit vor Mahnung, Mindestbetrag, Texte 1–3 mit Vorschau; Gebühren/Zinssätze erst mit `mahnspesen`; Link „Zum Mahnen“, **kein** Mahnlauf-Knopf) · **Erinnerungen** (lesend: Schwellen aus `zuTun.js`). Autosave „Gespeichert 14:02“. |

---

## 4. Akten (T5)

### 4.1 Rechnung `/faktura/rechnungen/[name]`

```
┌ Zentrale › Faktura › Rechnungen › RE-2026-00042                                     [Mahnen (Stufe 2)] [⋯] ┐
│ RE-2026-00042 · Anzahlungsrechnung · Fam. Muster   ● Gemahnt · Stufe 1  [lock]          9.984,00 €        │
│                                                     ▲ 12 Tage überfällig (fällig 28.10.)  offen 6.240,00 € │
│ ●──────●──────●──────◉──────○──────○──────○──────○                                                         │
│ Anfrage Planung Angebot Auftrag Bestellung Lieferung Montage Übergabe                                       │
│              AN-…88  AB-…17 · RE-…42                                                                       │
│ ⓘ Exportiert in EX-2026-0010 – Änderungen nur per Gutschrift                                               │
├ Übersicht | Positionen | Zahlung & Mahnung | Steuer & Texte | Verlauf ────────────────────────────────────┤
│ Netto 8.320,00 € · USt 20 % 1.664,00 € · Brutto 9.984,00 € · Zahlbar 9.984,00 € · Bezahlt 3.744,00 € · Offen 6.240,00 € │
│ Rechnungsadresse · Leistungsdatum (Quelle) · Zahlungsziel · Pflichtangaben ✓          ║ BEZÜGE · NÄCHSTE SCHRITTE · ZEITLEISTE │
```

- **Kopf:** Die Nummer steht in Instrument Sans 20/500 tabular (Entwurf: „Rechnungsentwurf“ + Kurztitel, `muted`). Rechts der Brutto-Betrag `2xl` tabular und darunter „offen …“. Ein Banner höchstens (§ 2.1). Den Entwurf-Hinweis „Entwurf – noch keine Rechnung im Sinne des § 11 UStG“ zeigt der Entwurf als Banner info.
- **Vorgangsleiste mit Belegkette:** Die Punkte sind `<button>`, der aktuelle trägt `aria-current="step"`. Unter den Punkten stehen die Belegnummern. Bei Korrekturen „RE-…42 → GU-…7 → RE-…51“.
- **Primäraktion je Zustand:** Entwurf → „Rechnung stellen“ (`⌘Enter`) · Gestellt/Teilbezahlt → „Zahlung erfassen“ · Überfällig/Gemahnt → „Mahnen (Stufe n)“ · Bezahlt, Storniert, Uneinbringlich → keine.
- **`⋯`:** Anzahlung abziehen (Entwurf mit Auftrag) · Zahlung erfassen (wenn nicht primär) · Zahlungslink (Schalter) · Senden · PDF · Gutschrift · Rechnung korrigieren · Rest ausbuchen (Schalter `differenz`) · Kontoauszug Kunde · Mahnsperre · Zuordnung lösen (Schalter, Leitung) · Als uneinbringlich buchen (Schalter, Leitung, rot) · PDF neu rendern (Leitung, nur vor Versand und Export) · Duplizieren als Entwurf. Gesperrte Einträge werden nach § 2.6 behandelt.
- **Tab Übersicht:** Summenblock identisch zu `ph_faktura.summenblock` (Netto · davon Rabatt · USt je Satz · Brutto · abzüglich vereinnahmter Anzahlungen · Zahlbar · Bezahlt · Offen), Adress-Snapshot (editierbar nur im Entwurf), Leistungsdatum mit Quelle, **Pflichtangaben-Prüfer** (§ 5.1, Liste mit „Zum Feld →“, im Tab steht dann ein Fehlerpunkt), Schalter „Empfänger ist Unternehmer“ (Entwurf), weitere Hinweise als Zeilen. Rechts die Hängemappe: Bezüge (Kunde `Shift+K`, Auftrag `Shift+A`, Projekt `Shift+P`, Angebot, Zahlungen, Mahnungen, Gutschriften, Export-Lauf, Dateien mit „fixiert 14.10. 09:12“), Nächste Schritte (ohne Primäraktion), Zeitleiste kompakt.
- **Tab Positionen:** Kindtabelle wie eine Tabellenkalkulation: Pos · Art · Produkt (Link-Suche mit Bild 28 px, füllt über `produkt_uebernehmen`) · Ausführung · Bezeichnung · Raum · Menge · Einheit · Einzelpreis netto · Rabatt % · USt % · Netto. Optional: Brutto, Einkaufspreis + Marge (nur permlevel 1). Alternativ-Zeilen grau kursiv „nicht in Summe“. In Teil- und Schlussrechnungen eine kleine Mengenanzeige „geliefert/abgerechnet“. Live-Summenzeile. Server-Fehler unter der Zelle. Gestellt: nur lesen. Kürzel § 2.2. Leer im Entwurf: „Noch keine Positionen. Produkt suchen oder Textzeile anlegen.“ + „Position hinzufügen“. < 1024 px ≥ 768 px: Karten-Editor (eine Position je Karte, Sheet von unten), < 768 px nur lesen.
- **Tab Zahlung & Mahnung:** abgezogene Anzahlungen (Anzahlungsrechnung · gestellt · vereinnahmt · abgezogen netto/USt/brutto), offene Anzahlungen des Auftrags mit „Anzahlung abziehen“ (im Entwurf zusätzlich die Zeile „2 offene Anzahlungen – bitte abziehen“), Zahlungen (Datum · Kanal · Betrag · Art · Hinweis), Zahlungsreferenz, Zahl-QR-Code ✓, Zahlungslink-Status (abgelaufen: „Link vom 20.10. abgelaufen.“ + „Neuen Link senden“). Darunter Mahnung: Stufe, letzte Mahnung, Mahnsperre (Switch + Grund), Liste der Mahnungen, nächste Stufe ab Datum. Leer: „Noch keine Zahlung eingegangen.“ · „Nicht gemahnt. Nächste Stufe frühestens am 11.11.“
- **Tab Steuer & Texte:** Steuerfall (lesend, vom Server bestimmt) mit Langtext, Hinweistext, Kleinbetrag ✓, OSS-Land, Umsatzsteuer fällig (Anzahlung: „fällig mit Vereinnahmung – UVA 2026-10“), UVA-Monat, Sprache, **Währung „EUR“ lesend**, UID Empfänger mit „UID prüfen“ (Platzhalter bis zur Abfrage, `uid_geprueft_am` setzt die Leitung von Hand), Ausfuhrfelder (Schalter). Texte: Einleitung/Schluss (Editor, „Vorlage einfügen“), Versand (gesendet am, Kanal, PDF fixiert, Export-Status), interne Notiz (permlevel 1).
- **Tab Verlauf:** Zeitleiste mit Menschen statt Technik (Kommentare, Statuswechsel, Zahlungen, Mahnungen, Export, Kassa) + eingeklappt „Buchungsjournal (4)“ mit Fälschungsschutz. Leer (neu): „Angelegt von Anna am 04.11.“
- **Zustände:** Entwurf (Autosave 1 s, Speicherleiste bei Positionsänderungen) · Gestellt (Band „Gestellt – Änderungen nur per Gutschrift“) · Storniert (Titel durchgestrichen, Banner danger „Storniert durch GU-… am …“, der Vermerk steht in der Akte und auf der Gutschrift, **nicht** in der fixierten PDF) · Exportiert · Monat abgeschlossen · Konflikt (Dialog D6) · nicht gefunden / kein Recht (404-gleich) · Laden (Kopf < 300 ms, Tabs lazy, Hängemappe gestreamt) · Autosave-Netzfehler „Nicht gespeichert – neuer Versuch in 5 s“ (Eingaben bleiben).
- **Abnahme Layout:** Bei 1280 × 800 ist der Summenblock ohne Scrollen sichtbar.

### 4.2 Angebot `/faktura/angebote/[name]`

- **Kopf:** Titel, Version „v2“ (Link Vorgänger/Nachfolger), Gültig bis mit Signal, Berater, Knopf „Präsentieren“. Banner (höchstens 1): Angenommen „Änderungen nur über ‚Neue Version‘“ · Abgelaufen „Angebot ist abgelaufen (gültig bis …)“. FAGG ist ein Hinweis in der Übersicht (keine Checkbox im Kopf; die Belehrung steht im Senden-Dialog).
- **Primär:** Entwurf → „Senden“ · Gesendet → „Als Auftrag übernehmen“ · Angenommen → „Auftrag öffnen“ · Abgelehnt/Abgelaufen → „Neue Version“.
- **`⋯`:** Annehmen (§ 5.6), Ablehnen (Grund: Preis · Mitbewerber · Kein Bedarf · Zeitplan · Keine Rückmeldung · Sonstiges, verzögerter Commit), Neue Version, Zahlungslink (Schalter), Drucken, Duplizieren, Projekt, Kundenakte. „Ablaufen lassen“ nur mit Schalter.
- **Tabs (5):** Übersicht (Summen inkl. „Alternativpositionen – nicht enthalten“, Zahlungsplan-Vorschau aus `zahlungsplan_vorschau`, Konditionen kurz) · Positionen (+ Alternativ, Lieferzeit, Raum, optional nach Raum gruppiert) · Konditionen (Zahlungsbedingung, Lieferbedingung, Lieferzeit, Sprache, Vertragsort; Währung EUR lesend) · Texte · Verlauf (gesendet am, Annahme über / am / Nachweis, gesendete PDF).
- **Präsentationsmodus** (`Shift+F` oder Knopf): Hängemappe, Einkauf/Marge und `notiz_intern` sind aus. Schrift +1 Stufe, Kopf mit Bodoni-Wortmarke statt Navigation. **Palette, Zentrale, Glocke und Listen sind gesperrt**, sichtbar ist nur die geöffnete Akte. Das Kennzeichen „Präsentation“ steht oben rechts, der Ausstieg über „Präsentation beenden“. Ein PIN für den Ausstieg ist eine Inhaber-Frage (§ 15.5).

### 4.3 Auftrag `/faktura/auftraege/[name]`

```
│ AB-2026-00017 · Küche · Fam. Muster        ● In Bestellung                    24.960,00 € [Herstellerbestellungen erzeugen] [⋯] │
│ ▕██████████▒▒▒▒▒▒░░░░░░┆░░░░░░▏  Bezahlt 40 % · abgerechnet 40 % · geliefert 75 % · Anzahlung ✓   offen 14.976,00 €           │
│ Vorgangsleiste mit Belegen                                                                                                        │
├ Übersicht | Positionen | Zahlungsplan & Rechnungen | Lieferung & Montage | Verlauf ──────────────────────────────────────────────┤
```

- **Stand-Band** (ersetzt `stand_html`) mit 8 px Höhe: Fläche `ink` = bezahlt, Schraffur `ink` 40 % = abgerechnet, Rahmen = geliefert. Daneben der Satz, für Screenreader zusätzlich ein `<dl>` (das Band ist `aria-hidden`). Bewegung nach § 2.9.
- **Primär je Zustand:** Anzahlung offen → „Anzahlung anfordern“ (Dialog § 5.3) · Anzahlung erfüllt + Offen → „Herstellerbestellungen erzeugen“ (ph_sortiment, Vorschau je Lieferant) · In Bestellung → „Lieferschein erzeugen“ (ph_logistik; ohne ph_logistik „Lieferung melden“) · Teilgeliefert → „Teilrechnung“ · Geliefert → „Schlussrechnung“ · Abgerechnet → keine. Blocker in der Vorgangsleiste: „Anzahlung offen 9.984,00 € – Bestellung erst nach Zahlung“. Die Leitung darf übersteuern (Rückfrage).
- **`⋯`:** Anzahlung anfordern, Teilrechnung, Schlussrechnung, Lieferung melden (ohne ph_logistik), Senden, Drucken, Rücktritt (FAGG) (§ 5.14), Stornieren (Leitung, Grund Pflicht, rot; bei gestellter Anzahlungsrechnung führt der Dialog zuerst die Storno-Gutschrift, Einzelheiten unter § 5.14 Kulanz-Weg), Angebot, Projekt, Kundenakte.
- **Tab Übersicht:** Summen, Konditionen, Texte als einklappbarer Abschnitt, FAGG-Zeile (Schalter `fagg`: „Rücktrittsrecht bis 04.12.2026 (14 Tage ab letzter Lieferung)“ bzw. „Frist beginnt mit Lieferung – noch nicht geliefert“ bzw. „Kein Rücktrittsrecht – Maßanfertigung (§ 18 Abs 1 Z 3 FAGG)“; ohne Schalter der Info-Satz aus § 2.7).
- **Tab Zahlungsplan & Rechnungen:** Zahlungsplan-Zeilen (Art · % · Betrag · Fällig bei · Fällig am · Rechnung · Bezahlt · Status) mit Live-Fehler „Zahlungsplan ergibt 24.900,00 € statt 24.960,00 €“, je Zeile die Aktion „Anfordern“. Darunter alle Rechnungen und Gutschriften des Auftrags mit Summenzeile. Leer: „Noch keine Rechnung zu diesem Auftrag.“ + „Anzahlung anfordern“.
- **Tab Lieferung & Montage:** Liefertermin geplant/bestätigt/KW (inline), Montage ✓, Montagetermin, Lieferadresse, Lieferhinweis, Lieferscheine und Herstellerbestellungen mit Status. Leer: „Noch nichts geliefert. Lieferscheine erscheinen hier, sobald die Logistik sie anlegt.“
- **Kassa-Datenfehler** (§ 2.8) erscheint als einziges Banner, Rang vor allen anderen außer Storniert.

### 4.4 Gutschrift, Mahnung, Eingangsrechnung, Export-Lauf

| Akte | Kopf / Primär | Tabs | Besonderheit |
|---|---|---|---|
| Gutschrift | „Gutschrift zu RE-…“, Art-Chip. Entwurf → „Gutschrift stellen“ (Stellen-Dialog). Gestellt + Rückzahlung → „Erstatten“ (§ 5.8) | Übersicht · Positionen (Storno: vorbefüllt und gesperrt; Teil/Retoure: Mengen ≤ fakturiert − bereits gutgeschrieben) · Steuer & Texte · Verlauf | Grenze: Brutto ≤ Rechnungsbrutto − Σ gestellte Gutschriften (Feldfehler). Bei einer Anzahlungsrechnung, die schon in einer Rechnung abgezogen ist, wird gesperrt: „Zuerst Schlussrechnung RE-… korrigieren“ + Link (B-05). Ist die Rechnung bezahlt, kommt nach dem Stellen ein Hinweis (Warnung) „Rückzahlung oder Verrechnung erforderlich“ + „Erstatten“. |
| Mahnung | „Mahnung Stufe 2 · RE-… · Fam. Muster“. Entwurf → „Senden“ (Senden-Dialog, bei Kanal Post „Drucken und als gesendet markieren“). Gesendet → „Erledigt“ (verzögerter Commit) | Übersicht (Offen, Frist, Verzugstage; Gebühr/Zinsen/Spesen mit Schalter) · Text · Verlauf | Stornieren nur im Entwurf |
| Eingangsrechnung | Lieferant · Rechnungsnummer. Erfasst → „Sachlich prüfen“, Sachlich geprüft → „Freigeben“ (Leitung), Freigegeben → „Als bezahlt buchen“ | Übersicht (PDF links 50 %, Beträge rechts) · Positionen & Steuer · Zahlung (Skonto, IBAN, Zahllauf, Bezahlt, genutzter Skonto) · Prüfung & Freigabe · Verlauf | Abweichung zur AB als Zeile in der Übersicht. Sperre nach Export. |
| Export-Lauf | Format · Zeitraum · Status. Entwurf → „Erzeugen“, Erzeugt → „Als übergeben“, Übergeben → „Von Kanzlei bestätigt“ | Übersicht (Anzahl, Summe, Fälschungsschutz, Dateien) · Belege (Übergabeprotokoll) · Verlauf | Jede Protokollzeile öffnet den Beleg (auch für die StB) |

---

## 5. Dialoge und Abläufe

Für alle gilt: Dialog md 560 px (lg 800, sm 400), Bewegung § 2.9, `⌘Enter` = Primär, `Esc` = Abbrechen (Rückfrage, wenn Felder geändert sind). Bei geldwirksamen Aktionen sperrt der Knopf, nach 300 ms erscheint „Bucht …“ bzw. „Stellt …“, sichtbar mindestens 600 ms. Jede Ausführung trägt einen `idempotency_key`. Ergebnis-Karten folgen 04 § 3.13 (Häkchen nur laut § 2.9).

### 5.1 Stellen-Dialog (Rechnung, Teil-/Schlussrechnung, Gutschrift)

```
┌ Rechnung über 9.984,00 € stellen? ──────────────────────── × ┐  Dialog md 560
│ An          Fam. Muster, Landstraße 5, 6911 Lochau            │
│ Art         Anzahlungsrechnung · 40 % zu AB-2026-00017         │
│ Datum       04.11.2026 (heute)            [Anderes Datum]     │  ← nur Leitung
│ Leistung    20.11.2026 · aus Lieferschein LS-2026-00031       │  oder ☐ Leistungsdatum geprüft (ohne Quelle)
│ Fällig      18.11.2026 (14 Tage)                              │
│ Pflichtangaben  ✓ vollständig                                 │
│ Danach      fortlaufende Nummer · PDF wird fixiert ·          │
│             Änderungen nur per Gutschrift                     │
│ ☑ Danach per E-Mail an m.muster@beispiel.invalid senden  Text ansehen ▾ │
│                                [Abbrechen] [Stellen und senden]│
└───────────────────────────────────────────────────────────────┘
```

- **Unvollständig:** Titel „Noch nicht stellbar – 2 Angaben fehlen“, eine Liste mit „Zum Feld →“ (schließt den Dialog, fokussiert das Feld, im Tab erscheint ein Fehlerpunkt), der Primärknopf ist `disabled`, darunter steht sichtbar „Erst alle Pflichtangaben ergänzen.“ (nicht nur als Tooltip).
- **Prüfregeln** (`pflichtangaben.js`, rein und unit-getestet, gleich wie `steuer.pflichtangaben_pruefen` nach P-06/P-07):
  - Name und Anschrift des Empfängers (entfallen bei Kleinbetrag ≤ 400 € brutto)
  - Aussteller und UID (PH Firma)
  - Menge und handelsübliche Bezeichnung je Position
  - Tag der Lieferung bzw. Leistungszeitraum mit Quelle (§ 2.8)
  - UID des Empfängers nur bei Unternehmer und > 10.000 € brutto, bei EU-Firma immer, dazu `uid_geprueft_am` (sonst blockiert, die Leitung übersteuert mit Vermerk)
  - Hinweistext bei steuerfrei, Steuerschuld Kunde, Ausfuhr und OSS
  - Teil- und Schlussrechnung: nur vereinnahmte Anzahlungen abgezogen (§ 5.10)
- **Warnbänder** (sie blockieren nicht): späte Rechnung (R-09) · Ausfuhr ohne Schalter: „Ausfuhr: Der Nachweis (Ausgangsvermerk/U34) muss vorliegen. ☐ Nachweis liegt vor oder wird nachgereicht“ (Pflicht-Checkbox, danach Aufgabe „Ausfuhrnachweis RE-…“) · Lieferadresse CH/LI mit Montage: **blockiert** „Montage in der Schweiz ist keine Ausfuhr – vor dem Stellen Steuerberater fragen“ + „Leitung bitten“ (bis Schalter `ausfuhr`).
- **Anderes Datum** (Leitung): Ein Datumsfeld klappt auf. Es nimmt keinen Wert vor der letzten gestellten RE (Fehler „Vor RE-2026-00041 vom 03.11. nicht möglich“) und keinen ≤ `gesperrt_bis` (Fehler „Oktober ist abgeschlossen“).
- **Senden im selben Dialog:** Die Checkbox ist Standard an, wenn eine E-Mail vorhanden ist. Bei `kommunikation_bevorzugt = Brief` oder ohne E-Mail heißt sie „Danach drucken (Post)“. „Text ansehen“ klappt Betreff und Nachricht im Dialog auf. Der Knopf heißt „Stellen und senden“ bzw. „Stellen“.
- **Ablauf** (`stellenAction`): `save datum=heute` (oder Leitungsdatum) → `stellen()` → bei Checkbox `senden(...)`. Erfolg: Ergebnis-Karte mit Häkchen „Rechnung RE-2026-00043 gestellt · 9.984,00 € · gesendet an …“ + „PDF öffnen“, „Zur Liste“. Schlägt das Senden fehl: „Gestellt. Senden fehlgeschlagen: …“ + „Erneut senden“ (die Rechnung bleibt gestellt).
- **Zeitüberschreitung (> 10 s) / Netzabbruch:** Der Dialog zeigt „Status wird geprüft …“ und liest den Beleg neu (`getDoc`, Abgleich über `idempotency_key`). Ergebnis ist entweder die Ergebnis-Karte oder „Nicht gestellt – erneut versuchen“. Eine Meldung „Fehler“ ohne geklärten Nummernzustand gibt es nicht.
- **Fehler:** `invalid` (Server-Pflichtangaben) → Dialog bleibt mit Liste · `conflict` → Konfliktdialog · `forbidden` → „Nur Faktura-Leitung“ (z. B. anderes Datum).

### 5.2 Zahlung erfassen

```
┌ Zahlung zu RE-2026-00042 ──────────────────────────────── × ┐
│ Betrag   [ 6.240,00 € ]   6.240,00 € offen                   │
│ Kanal    ( Überweisung | Stripe Link )   ← Stripe nur Schalter│
│ Datum    [04.11.2026]     Hinweis [                ]         │
│ Danach offen: 0,00 € → Bezahlt                               │
│ ⓘ Bar oder Karte? An der Kassa kassieren (Beleg).            │
│ ⚠ Bankeingang über 6.240,00 € vom 03.11. liegt vor – die      │
│   Faktura-Leitung ordnet zu.        [Leitung informieren]     │
│                              [Abbrechen] [6.240,00 € buchen] │
└──────────────────────────────────────────────────────────────┘
```

- Der Betrag ist mit `offen_cent` vorbelegt und darf ihn nicht übersteigen: „Höchstens 6.240,00 €“. Mit Schalter `guthaben` steht stattdessen „Rest 120,00 € als Guthaben“. Ist `offen_cent = 0`, öffnet sich der Dialog nicht, sondern es kommt der Hinweis „Rechnung ist bezahlt“ (Fach 6.25).
- **Passender offener Bankumsatz** (`getList PH Bankumsatz` `betrag_cent = …`, Status Offen): Für die Leitung erscheint der Link „Bankeingang verwenden“ (öffnet den Bank-Peek), für Mitarbeiter der Satz + „Leitung informieren“. Beim Buchen trotz Treffer: Rückfrage „Es gibt einen Bankeingang über denselben Betrag. Trotzdem manuell buchen?“.
- **Primär nennt den Betrag.** Der Dialog ist die Rückfrage. Erfolg: Toast „6.240,00 € gebucht · RE-… bezahlt“. Wird die Anzahlung dadurch vollständig, folgt der Erfolgsmoment (§ 2.9).
- Für Gutschein, Verrechnung, Bar, Karte extern und Stripe Terminal gibt es kein UI (E2). Die Action lehnt sie ab.

### 5.3 Anzahlung anfordern (Auftrag)

- Dialog md mit dem Segment **Rechnung stellen · Zahlungslink senden** (das zweite nur mit `stripeLink`). Standard ist die letzte Wahl der Rolle (localStorage, mit try/catch). Der Betrag kommt aus der Zahlungsplan-Zeile (z. B. „9.984,00 € (40 %)“). Bei mehreren offenen Anzahlungszeilen gibt es eine Auswahl.
- **Rechnung stellen:** `anzahlungsrechnung_erstellen(zeile)` → danach derselbe Ablauf wie im Stellen-Dialog (§ 5.1), mit den Fakten im selben Dialog, ohne zweites Modal. Sekundär „Nur Entwurf anlegen“.
- Satz im Dialog: „Kunde zahlt an der Kassa? Dort Auftrag AB-2026-00017 suchen – die Kassa stellt die Anzahlungsrechnung.“ (B-01, mit dem Kassa-Konzept abgestimmt).

### 5.4 Senden (Angebot, AB, Rechnung, Gutschrift, Mahnung)

- **Reiter E-Mail · Post · Persönlich übergeben.** Post und Persönlich als eigener Kanal nur mit Schalter `postVersand`. Ohne Schalter druckt der Reiter Post und legt einen Kommentar an. Bei `kommunikation_bevorzugt = Brief` oder ohne E-Mail öffnet der Dialog direkt den Reiter Post.
- **E-Mail:** An (aus `PH Kontakt.email`, mehrere, Formatprüfung), Kopie an mich ☐, Betreff „{Belegart} {Nummer} – Platzhirsch Home Living“, Nachricht aus der Vorlage je Belegart mit `{anrede_brief}`, `{betrag}`, `{faellig}`, Anhang-Kachel (Klick = Vorschau). Angebot/AB außerhalb des Showrooms: Checkbox „Widerrufsbelehrung beilegen“ gesetzt und gesperrt (§ 2.8). Primär „Senden“ → `senden(empfaenger, betreff, nachricht)`. Erfolg: Toast „Gesendet an …“ ohne Undo.
- **PDF noch nicht fertig:** Die Anhang-Kachel zeigt den Spinner „PDF wird erzeugt …“, der Knopf heißt „Sendet nach PDF …“ und sendet danach. „Abbrechen“ ist möglich.
- **Post:** PDF-Vorschau, „Drucken und als per Post gesendet markieren“.
- **Massen-Senden mit Teilfehlern:** Der Ergebnis-Toast (Fehler) bleibt stehen: „9 gesendet, 3 nicht zustellbar.“ + „Details“ (Drawer mit Liste, „Erneut senden“, „Per Post“).
- Zahlungslink ohne E-Mail: „Kein Zahlungslink ohne E-Mail – Zahl-QR-Code steht auf der Rechnung.“

### 5.5 Angebot anlegen (statt Assistent A2)

- Dialog md: Kunde/Projekt (Link-Suche mit Anlegen, aus dem Projekt vorbefüllt), Titel, Zahlungsbedingung (Standard), Vertragsort (Showroom · Beim Kunden · Fernabsatz). Primär „Anlegen“ → `insert PH Angebot` (Gültig bis = heute + `angebot_gueltig_tage`) → die Akte öffnet sich im Tab Positionen mit fokussierter Produktsuche. „Aus Planung übernehmen“ gibt es erst, wenn ph_projekte Positionen liefert.

### 5.6 Annehmen (Angebot)

- Dialog md: **Annahme über** (Pflicht: Unterschrift Showroom · E-Mail · Portal · Telefon · Brief), Datum, Nachweis (Datei, optional; bei E-Mail/Brief empfohlen). Bei „Unterschrift Showroom“ ein Vollbild-Unterschriftsfeld (Strich 2 px Tinte, „Löschen“/„Übernehmen“). Alternative: Checkbox „Kunde hat auf Papier unterschrieben“ + Upload. Bis P-14 werden `annahme_art` und Nachweis als Kommentar + Datei-Anhang gespeichert, danach in die Felder.
- **Ohne Verbindung** bleibt die Unterschrift im Feld, dazu das Band „Keine Verbindung – wird übertragen, sobald online“. Als angenommen gilt das Angebot erst nach dem OK des Servers. „Jetzt erneut“.
- Folge-Toast: „Angenommen · Als Auftrag übernehmen“.

### 5.7 Als Auftrag übernehmen (statt Assistent A3)

- Dialog lg 800 mit drei Abschnitten auf einer Seite. **Alternativen** (je Gruppe genau eine; bis `auftrag_erstellen(alternativen)` steht der Hinweis „Gewählte Alternativen werden als Hauptposition übernommen“, der Client setzt sie vorher per `save` im Angebot, solange es nicht gesperrt ist). **Zahlungsplan** (aus der Zahlungsbedingung, Zeilen editierbar, Summe = Brutto Pflicht). **Termine** (Liefertermin geplant, Montage ✓, Lieferadresse, FAGG-Vertragsart und Ausnahme mit Schalter `fagg`).
- Über dem Knopf steht ein Folgesatz: „Erzeugt AB-…, Anzahlungsrechnung 40 % (Entwurf), Projekt → Auftrag, Kontakt → Kunde.“ Primär „Auftrag anlegen“ → `auftrag_erstellen`. Ergebnis-Karte mit Links und „Anzahlung anfordern“.

### 5.8 Gutschrift und Erstatten

- **Gutschrift** (`Shift+G`): Dialog md mit Art (Storno · Teilgutschrift · Retoure · Wertminderung · Kulanz), Grund (Pflicht), Erstattung (Verrechnung mit offener Rechnung · Rückzahlung · Keine), Servicefall (Link, optional, nach P-22). → `gutschrift_erstellen(...)` → Gutschrift-Entwurf öffnet sich (Toast mit „Verwerfen“). Retoure mit Rücknahme (Link Lieferschein/Retoure, nach P-22).
- **Erstatten:** Betrag = brutto − erstattet, Datum, Kanal **Überweisung** (fest) bzw. „Rückerstattung über Shop“ bei einer ursprünglichen Stripe-Zahlung (ph_shop, GF-Freigabe laut Shop-Konzept). Bar erscheint nur als Hinweis „Barauszahlung an der Kassa (Auszahlungsbeleg zur Gutschrift)“ (R-02). Rückfrage mit Betrag.

### 5.9 Teilrechnung (Schritte)

1. **Mengen:** Tabelle Position · Menge · Geliefert · Abgerechnet · Jetzt abrechnen (gedeckelt auf geliefert − abgerechnet, Hinweis unter der Zelle) mit dem Knopf „Alles Gelieferte“. Zahlungsplan-Zeile wählen (Parameter `zahlungsplan_zeile` nach P-31; ohne passende Zeile der Hinweis „Teilrechnung außerhalb des Zahlungsplans“). Leistungsdatum = Zustellung der abgerechneten Teillieferung (Lieferschein-Auswahl). Mit Schalter `abschlag` zusätzlich die Frage „Ist der gelieferte Teil abgeschlossen und abgenommen?“, bei Nein → „Dann ist es ein Abschlag: Anzahlung anfordern“ + Knopf. Ohne Schalter steht ein Hinweis für Küchen in Etappen: „Bei einer Küche in Etappen vor der Teilrechnung mit der Faktura-Leitung klären (Abschlag oder Teilleistung).“
2. **Prüfen:** Summen (Netto, USt, Brutto, abzüglich vereinnahmter Anzahlung anteilig, Zahlbar) → „Anlegen und stellen“ öffnet direkt die Fakten des Stellen-Dialogs (§ 5.1) als letzten Schritt, ohne weiteres Modal. Sekundär „Als Entwurf anlegen“.
- „Weiter“ mit `⌘Enter`, `Enter` wirkt nur im Feld. Zurück ist ohne Datenverlust möglich. Die Vorschau legt einen **Entwurf** an (es gibt keinen Trockenlauf); bei Abbruch bleibt der Entwurf mit Toast „Entwurf angelegt · Verwerfen“ und erscheint in Zu tun.

### 5.10 Schlussrechnung (Schritte)

1. **Offene Mengen** (lesend; „2 Positionen noch nicht geliefert“, Übersteuerung durch die Leitung mit Grund).
2. **Anzahlungen:** Tabelle Anzahlungsrechnung · gestellt · **vereinnahmt** · abzuziehen. Abgezogen wird nur der vereinnahmte Betrag (R-10). Ist eine Anzahlungsrechnung nicht voll bezahlt, ist der Ablauf blockiert: „RE-2026-00042 ist erst zu 3.744,00 € bezahlt. Schlussrechnung erst nach Zahlung“ + Aktion „Rest auflösen“ (Schalter `restAufloesen`, Leitung: Teil-Storno-Gutschrift über den unbezahlten Rest, danach weiter). Ohne Schalter: „Leitung bitten“. Ist die Anzahlung größer als der Endbetrag: „Überhang 1.200,00 € erstatten“ = Teilgutschrift auf die Anzahlungsrechnung mit Erstattung Rückzahlung, danach weiter.
3. **Prüfen und Stellen** (§ 5.1). Danach: AB → Abgerechnet, Erfolgsmoment, Toast „Projekt → Übergabe folgt nach Abnahme“.

### 5.11 Bank – Zuordnen-Dialog (lg 800, statt A8)

- Wird nur geöffnet über „Anderen Beleg wählen“ oder bei Teilbetrag/Differenz.
- Oben der Vorschlag (Sicherheit als Wort + Grund), darunter Alternativen aus `vorschlaege()` (offene Rechnungen/ER mit Kunde, Offen, Fällig) und die Suche nach Nummer, Name oder Betrag. Ohne Treffer: „Kein offener Beleg passt zu ‚4711‘. Betrag oder Kundennamen versuchen.“ + „Suche leeren“.
- **Betrag:** Der Rest des Umsatzes ist vorbelegt, ein Teilbetrag ist erlaubt (Hinweis „Umsatz bleibt teilweise offen“). Höchstens der Offen-Betrag des Belegs. Mit `guthaben` „Rest als Guthaben“.
- **Differenz:** Ist der Eingang kleiner als „offen“ und liegt er in der Skontofrist (`skonto_tage` der Zahlungsbedingung), kommt mit `differenz` der Vorschlag „Differenz 187,20 € als Skonto buchen (USt-Korrektur 20 %: −31,20 €)“, außerhalb der Frist das Warnband „Skontofrist am 12.10. abgelaufen – Leitung entscheidet“. Ohne Schalter: „Differenz bleibt offen“.
- **Auftrag erkannt** (AB-Nummer, B-11): Primär „Anzahlungsrechnung stellen und zuordnen“ → `anzahlungsrechnung_erstellen(zeile)` → Stellen-Fakten (§ 5.1) → `zuordnen`. Der Ablauf hat einen Idempotenz-Schlüssel und zeigt Teilschritte; scheitert ein Teilschritt, nennt die Ergebnis-Karte den Stand und bietet „Fortsetzen“.
- **Ausgang:** Vorschläge auf ER. Erstattungen zu Gutschriften und Rücklastschriften folgen mit P-24 (bis dahin „Ignorieren“ mit Grund „Rücklastschrift – Leitung klärt“ + Aufgabe).
- Ausführung als verzögerter Commit wie in der Liste. Der Fokus springt auf die nächste offene Zeile.

### 5.12 Rest ausbuchen (Schalter `differenz`)

- Aufruf aus der Rechnungsakte `⋯` oder aus § 5.11. Segment Skonto · Kleindifferenz (≤ `kleindifferenz_cent` der Einstellungen) · Kulanz (→ Gutschrift-Dialog). Betrag höchstens der Rest. Vorschau der USt-Korrektur je Satz. → `differenz_buchen(art, betrag_cent, datum)`. Rückfrage mit Betrag.

### 5.13 Rechnung korrigieren (statt Assistent)

- `⋯` „Rechnung korrigieren“ → Dialog md mit **Grund** (Adresse · Steuerfall · Positionen · Leistungsdatum · Sonstiges + Text). Primär „Korrektur-Entwurf anlegen“.
- Mit P-23: `korrigieren(grund)` → Gutschrift-Entwurf + Rechnungsentwurf (Kopie, `korrektur_von`). Ohne P-23 (der Schalter `korrekturMitZahlung` ist aus): Den Menüpunkt gibt es nur bei Rechnungen **ohne Zahlungen**. Die Action legt die Kopie als Entwurf an (Duplizieren) und merkt sich die Verknüpfung als Kommentar.
- Die Kopie öffnet sich mit dem Banner info „Korrektur zu RE-…42: Beim Stellen wird RE-…42 per Gutschrift aufgehoben“, das geänderte Feld ist links mit Sand 2 px markiert. Der Stellen-Dialog nennt beide Folgen. Reihenfolge in `korrekturStellenAction`: Pflichtangaben der neuen Rechnung prüfen → bei Fehlern wird **nichts** gestellt → Gutschrift stellen → neue Rechnung stellen → (P-23) Zahlungen umbuchen. Scheitert der letzte Schritt, nennt die Ergebnis-Karte den Stand, und es entsteht eine Zu-tun-Zeile „Korrektur fertigstellen“.
- Bei Exportiert stellt die Leitung. Belegkette in der Vorgangsleiste.

### 5.14 Rücktritt (FAGG) und Storno eines Auftrags

```
┌ Rücktritt – AB-2026-00017 · Fam. Muster ─────────────────────────── × ┐
│ Vertragsort   Beim Kunden · Belehrung beigelegt ✓                       │
│ Frist         beginnt mit Lieferung · noch nicht geliefert → läuft      │  (Schalter fagg, sonst Satz ohne Datum)
│ Rücktritt am  [04.11.2026]   Eingang über (E-Mail ▾)  Nachweis [Datei]  │
│ Folgen        RE-2026-00042 (9.984,00 €, bezahlt) → Gutschrift Storno    │
│               Rückzahlung 9.984,00 € bis 18.11.2026 (14 Tage)           │
│               Herstellerbestellung HB-…031 → Storno beim Hersteller anfragen│
│ Montage auf Verlangen begonnen? ☐  → anteiliges Entgelt [ 0,00 € ]      │
│                                        [Abbrechen]  [Rücktritt buchen]  │
└─────────────────────────────────────────────────────────────────────────┘
```

- Mit P-13 (Schalter `fagg`) läuft der Rücktritt über `ruecktritt_fagg(datum, kanal, nachweis, anteil_cent)`. **Ohne P-13** gibt es einen Teilschritt-Ablauf mit Ergebnis-Karte je Schritt: (1) Storno-Gutschrift je gestellter Rechnung mit Erstattung Rückzahlung (`gutschrift_erstellen` + `stellen`) → (2) AB `stornieren("Rücktritt FAGG")` → (3) PH Aufgabe „Rückzahlung Fam. Muster bis 18.11.“ an die Leitung → (4) Kommentar mit Datum, Kanal und Nachweis. Abgebrochene Abläufe lassen sich mit „Fortsetzen“ wieder aufnehmen (Idempotenz je Schritt).
- **Frist abgelaufen** (Schalter): Warnband orange „Frist endete am … – Rücktritt nur als Kulanz-Storno“, der Primärknopf heißt dann „Als Kulanz-Storno buchen“. **Maßanfertigung:** Banner danger „Kein Rücktrittsrecht nach § 18 Abs 1 Z 3 FAGG – trotzdem stornieren?“. Bei einer Anzahlungsrechnung, die schon abgezogen ist, wird gesperrt (B-05).
- **Storno ohne FAGG** (Leitung): derselbe Dialog mit Titel „Auftrag stornieren“, ohne Fristzeile, Grund Pflicht.
- **Zu tun:** „Rückzahlung Fam. Muster fällig in 3 Tagen“ (Leitung), ab Tag 12 rot. Wurde die Ware geliefert: Feld „Ware zurück am“ (Zurückbehaltung bis zur Rückgabe, nach P-13).
- Ein Kürzel gibt es nicht.

### 5.15 Export-Sheet (statt Assistent A9)

- Oben: Zeitraum (Vormonat vorbelegt), Format (Standard aus den Einstellungen), Belegarten, „nur neue“ ✓. Darunter läuft die **Prüfung automatisch** (Report Nummernlücken für RE/GU, Entwürfe im Zeitraum, Rechnungen ohne bestätigtes Leistungsdatum, leere Kontenfelder, Berater-/Mandantennummer bei DATEV). Rot blockiert, orange warnt, jede Zeile mit Link. Dann die Vorschau (Anzahl, Summe brutto, Beispielzeile). Primär „Erzeugen“ → Rückfrage „61 Belege werden gesperrt“ → Ergebnis-Karte ohne Häkchen „EX-2026-0011: 61 Belege“ + „Herunterladen“, „Protokoll“, „Als übergeben“.

### 5.16 Mahnen (ein Sheet für alle Einstiege, statt A7)

```
┌ Mahnen ───────────────────────────────────────────────────────────── × ┐  Sheet lg 640
│ ☑ RE-2026-00042  Fam. Muster   12 Tage  6.240,00 €  Stufe 1 → 2       │ ▸ Vorschau rechts: Text,
│ ☑ RE-2026-00039  Beispiel GmbH 21 Tage  4.680,00 €  0 → 1             │   Frist, (Gebühr/Zinsen
│ ☐ RE-2026-00031  Huber         Mahnsperre: „Reklamation offen“ (grau)  │    nur mit mahnspesen)
│ ☐ RE-2026-00035  Muster        Nicht versandt – zuerst senden (grau)   │
│ Stichtag 04.11.2026 · ☐ Als Entwurf anlegen · 1 ohne E-Mail → Post     │
│                                               [2 Mahnungen senden]    │
└────────────────────────────────────────────────────────────────────────┘
```

- **Quelle:** `mahnlauf_starten(nur_vorschlag=1)`, gefiltert im Client (mit `gesendet_am` bzw. Versandkanal, ohne Mahnsperre). Alle sind vorausgewählt. Einzel-Mahnen aus der Akte öffnet dasselbe Sheet mit einer Zeile. Nicht versandte Rechnungen sind grau. Bei einem Post-Vermerk (Kommentar) steht die Checkbox „Per Post gesendet am … – trotzdem mahnen“.
- **Ausführen** je gewählter Rechnung: `mahnen(stufe)` + `senden` bzw. bei fehlender E-Mail ein Post-Entwurf (nie übersprungen). Das dauert, bis `mahnlauf_starten(rechnungen[], stichtag)` existiert. Rückfrage sm (nach außen): „2 Mahnungen senden? 1 davon per Post.“ Fortschritt im Knopf „1/2“, `Esc` hält an. Ergebnis-Karte „2 Mahnungen angelegt, 1 gesendet, 1 per Post – Sammeldruck öffnen“.
- **Leer:** „Heute ist nichts zu mahnen.“ (Häkchen) + „Mahnregeln ansehen“.
- Die Stammdaten enthalten **keinen** Mahnlauf-Knopf. Der automatische Lauf (Mo–Fr 06:30) legt bei `entwurf_statt_senden` Entwürfe in den Reiter „Entwürfe aus Mahnlauf“.

---

## 6. Massenaktionen (Übersicht)

Vorschau immer „n von m möglich – k übersprungen (Grund)“. Fortschritt im Knopf („12/40“), `Esc` hält an. Ergebnis-Toast mit „Details“ (Drawer mit Liste, CSV nur Leitung).

| Liste | Aktionen |
|---|---|
| Angebote | Senden · Nachfassen · Zuweisen (verzögerter Commit) · Drucken |
| Aufträge | Anzahlung anfordern · Drucken |
| Rechnungen | Mahnen · Senden · Post heute · Drucken · Mahnsperre · CSV (Leitung) |
| Bank | Sichere zuordnen (Rückfrage) · Ignorieren (Undo) · Wieder öffnen |
| Eingangsrechnungen | Sachlich prüfen · Freigeben (Leitung, verzögerter Commit) · Zahllauf vormerken · Ablehnen (Mehr) |
| Zahllauf | Als bezahlt buchen (Rückfrage) · Zahlliste drucken |
| Mahnungen | Senden · Post heute · Erledigt (verzögerter Commit) |

---

## 7. Kennzahlen und Charts

Kachel nach 03 § 8.14: Label `caption` in `bo-accent-text` (nicht Sand), Wert `display-s` tabular, Fußzeile mit Link. Jede Kachel ist ein Link. Ein Vergleich zum Vorjahr erscheint nur mit Daten, sonst „Kein Vergleich“ (nie „0 %“).

| Kachel | Cockpit | Quelle | Ziel |
|---|---|---|---|
| Offene Posten | Buchhaltung | `kennzahlen.op_gesamt` + `count` | Rechnungen `?r=offene-posten` |
| Überfällig | Buchhaltung | `kennzahlen.op_ueberfaellig` | Rechnungen `?r=ueberfaellig` |
| Anzahlungen offen | Buchhaltung | `kennzahlen.anzahlungen_offen`, Tooltip „nur gestellte Anzahlungsrechnungen“ | Bericht Anzahlungsstand |
| Umsatz Monat (netto, Leistung) | Buchhaltung | bis P-29 Report „PH Vertriebscockpit Faktura“ Spalte `umsatz` (netto). Danach `kennzahlen.umsatz_monat` neu (Σ netto Leistungsrechnungen − Σ netto Gutschriften) | Rechnungen `?von=<Monatserster>` |
| Guthaben offen | Buchhaltung (statt „Anzahlungen offen“, wenn > 0) | Schalter `guthaben` | Bericht |
| Offene Angebote · Auftragsbestand · Angebotsquote · Liefertermine 30 Tage | Vertrieb | `kennzahlen.offene_angebote`, `kennzahlen.auftragsbestand`, Report Vertriebscockpit `quote`, `getList` AB `liefertermin_geplant` | jeweilige Liste |

Weitere Werte (Fällig 7 Tage, ER zu zahlen, Zur Freigabe, Bank offen, Nicht exportiert, Mahnstufe ≥ 2) erscheinen als Zu-tun-Zeilen oder Pill-Zähler, nicht als Kachel (eine Zahl je Seite).

**Charts** (unter Berichte): Umsatz je Monat (Balken 12 Monate, netto nach P-29, laufender Monat Sand) · Auftragseingang je Monat · Angebote nach Status (gestapelter Einzelbalken) · Offene Posten nach Alter (Band) · Anzahlungsstand je Auftrag · Mahnstufen · ER nach Status · Umsatz nach Marke (Tabelle mit Inline-Balken, Marge nur permlevel 1). Jedes Chart hat eine `<details>`-Tabelle als Alternative. Leer: Achse + „Noch keine Rechnungen im Zeitraum“. Die Liquiditätsvorschau fehlt im Backend.

---

## 8. Druck und PDF

| Beleg | Druckformat | Fixiert | Hinweise |
|---|---|---|---|
| Angebot | PH Angebot Standard | bei `senden` | Alternativen „nicht im Gesamtpreis enthalten“, FAGG-Belehrung außerhalb des Showrooms |
| Auftrag | PH Auftragsbestaetigung Standard | bei `senden` (`gesendet_am` nach P-14) | Zahlungsplan, Liefertermin, FAGG-Frist (Schalter `fagg`) |
| Rechnung / Teil / Schluss / Barverkauf | PH Rechnung Standard | bei `stellen` | § 11 UStG, abgezogene **vereinnahmte** Anzahlungen netto + USt je Satz, Zahl-QR-Code, Kleinbetragsvariante ≤ 400 € |
| Anzahlungsrechnung | PH Rechnung Anzahlung | bei `stellen` | Hinweis Anzahlungs-USt |
| Gutschrift | PH Gutschrift Standard, **Drucktitel laut StB** (Standard „Rechnungskorrektur“) | bei `stellen` | Bezug Rechnung, Steuerkorrektur je Satz |
| Mahnung | PH Mahnung Standard | bei `senden` (Post: `pdf_fixieren` nach P-33) | Gebühr/Zinsen nur mit Schalter |
| Kontoauszug Kunde | PH Kontoauszug Kunde | nie (Stichtag im Kopf) | Guthaben negativ (Schalter) |
| Export-Lauf | PH Export Uebergabeprotokoll | bei `erzeugen` | – |
| UVA, Zahlliste | fehlen → Report-Druck | – | – |

**Druckvorschau** (`p`, Sheet 640 px): Format, Sprache (nur Deutsch aktiv; en/fr/it deaktiviert „Texte folgen nach Freigabe“), A4 skaliert, Blättern `←→`, „Herunterladen“, „Drucken“ (`⌘P` druckt die Server-PDF), „Senden …“. Entwurf mit Wasserzeichen „ENTWURF – keine Rechnung“. Gestellt: die **fixierte** Datei mit „Fixierte Fassung vom 14.10. 09:12“. Storniert: fixierte Datei + Hinweis über der Vorschau „Storniert durch GU-…“ (nicht in der PDF). Laden: A4-Rahmen als Skeleton. Fehler: „PDF konnte nicht erzeugt werden · Erneut versuchen“, der Beleg bleibt gestellt, für die Leitung zusätzlich „PDF neu rendern“ (vor Versand/Export). Fehlt der QR-Code: PDF ohne QR, Hinweis „Zahl-QR-Code nicht erzeugt“.

---

## 9. Telefon, iPad, Kiosk

| Kontext | Gerät | Faktura | Gestaltung |
|---|---|---|---|
| Showroom | iPad quer/hoch | Angebot zeigen, Positionen anpassen (ab 768 px Karten-Editor), Annehmen mit Unterschrift, Auftrags-Stand | Präsentationsmodus § 4.2, Knopf „Präsentieren“ |
| Geschäftsführung | iPhone/iPad | Cockpit lesend, Rechnungen, PDF, ER freigeben (Leitung) | Kacheln 2 Spalten (< 768 px: 1), Listen als Karten (Kopf `whitespace-nowrap`, Nummer in der Mitte gekürzt „RE-…00042“, voller Wert für Screenreader), Freigeben über den Knopf (48 px) |
| Montage mobil | Smartphone | „Offen bei Übergabe: 6.240,00 €“ (Zahlungsplan „fällig bei Montage“, Datum = `montage_termin`) + **nur Zahl-QR-Code (Überweisung)** der offenen Rechnung. Gibt es noch keine Rechnung: „Zahlung per Überweisung nach Rechnung“. Karte und Bargeld nur über die mobile Kassa (ph_kassa), bis zur StB-Entscheidung keine Bargeldannahme durch Monteure | großer Betrag, ein Knopf „QR zeigen“. Eingang prüfen alle 10 s bis 10 min, danach „Zahlung noch nicht eingegangen. Später in der Akte sichtbar.“ + „Erneut prüfen“. Erfolg: Häkchen 400 ms |
| Kassa (Kiosk) | Kassa | gehört zu `10-konzept-kassa.md` | Schnittstellen: `kassa.kassenbeleg_gebucht(beleg)` (nur auf eine PH Rechnung), `kassa.offene_anzahlung(auftrag)`, `anzahlungsrechnung_erstellen` + `stellen` aus der Kassa, `api.create_cash_invoice(bestellung)` mit `umsatz_quelle = Kassa` (P-02). In der Faktura-Akte nur die Zeitleiste „Kassa: 3.744,00 € auf RE-… · Beleg K1-…“ |
| Packtisch | Kiosk | keine Bedienung. Teilrechnung aus Lieferschein serverseitig über `api.create_partial_invoice` (ph_logistik) | – |

---

## 10. Automationen und Erinnerungen

| Wann | Funktion (vorhanden) | Sichtbar |
|---|---|---|
| täglich 06:00 | `tasks.ueberfaellig_pruefen` | Status, Zeitleiste „System: überfällig“ |
| täglich 06:00 | `tasks.angebote_ablaufen` | Status. Die Benachrichtigung an `zugewiesen_an` „AN-… abgelaufen – Neue Version?“ erzeugt Next aus dem Statuswechsel |
| Mo–Fr 06:30 | `tasks.mahnlauf_automatisch` | Zentrale-Meldung „Mahnlauf: n Mahnungen (k per Post)“ → Reiter „Entwürfe aus Mahnlauf“ |
| Mo 07:00 | `tasks.oss_schwelle_pruefen` | Banner Stammdaten › Umsatzsteuer + Aufgabe |
| 1. 06:15 | `tasks.uva_entwurf_monat` | Zu tun „UVA Oktober prüfen und übergeben“ |
| 5. 08:00 | `tasks.export_erinnerung` | Zu tun „Export Oktober“ |
| Ereignis | `zahlung_gebucht` / `zahlung_storniert` | Akte aktualisiert sich (Realtime, sonst bei Fokus) |
| Ereignis | `importieren(auto_zuordnen)` | Import-Ergebnis-Karte (Auto nur mit `zuordnungLoesen`) |

**Next-Regeln** (`zuTun.js`, nur auf vorhandenen Feldern): siehe § 3.1. Dazu Benachrichtigungen (Glocke) „Anzahlung Fam. Muster eingegangen – Bestellung möglich“ (Berater) und „Rücktrittsfrist endet morgen“ (Berater, nur mit Schalter `fagg`). Jeder Eintrag erscheint nur einmal (nicht zusätzlich zur Zähler-Pille).

---

## 11. Datenmapping UI → Frappe

Konvention: `methode()` = `runDocMethod`, `api.x` = `ph_faktura.api.x`, Listen über `getList`/`count`, Reports über `getReport`. **(P-nn)** = erst mit Backend-Änderung § 15.1.

### 11.1 Listen und Seiten

| UI | DocType / Report | Felder |
|---|---|---|
| Angebote | PH Angebot | `name`, `titel`, `kunde_name`, `kontakt`, `projekt`, `datum`, `gueltig_bis`, `brutto_cent`, `status`, `zugewiesen_an`, `version`, `vertragsort`, `gesendet_am` |
| Aufträge | PH Auftragsbestaetigung | `titel`, `kunde_name`, `projekt`, `datum`, `liefertermin_geplant`, `liefertermin_bestaetigt`, `liefer_kw`, `auftragswert_cent`, `anzahlung_soll_cent`, `anzahlung_ist_cent`, `geliefert_cent`, `abgerechnet_cent`, `offen_cent`, `status`, `vertragsort`, `fagg_*` (P-08) |
| Rechnungen / OP | PH Rechnung; Report „PH Offene Posten“ | `nummer`, `art`, `kunde_name`, `kontakt`, `datum`, `leistungsdatum`, `faellig`, `zahlbar_cent`, `bezahlt_cent`, `offen_cent`, `status`, `mahnstufe`, `mahnsperre`, `export_status`, `auftrag`, `gesendet_am`, `ust_fall`, `empfaenger_unternehmer` (P-07), `umsatz_quelle` (P-02) |
| Bank | PH Bankumsatz, PH Bankimport, PH Bankkonto | `buchungsdatum`, `valuta`, `betrag_cent`, `richtung`, `auftraggeber`, `iban_gegen`, `verwendungszweck`, `status`, `vorschlag_doctype`, `vorschlag_beleg`, `vorschlag_grund`, `vorschlag_sicherheit`, `zugeordnet_cent`, `konto`; Import `anzahl_*`, `status`; Konto `waehrung`, `letzter_import` |
| Eingangsrechnungen | PH Eingangsrechnung | `lieferant_name`, `rechnungsnummer_lieferant`, `datum`, `faellig`, `brutto_cent`, `skonto_bis`, `skonto_cent`, `zahlbetrag_cent`, `status`, `auftrag`, `projekt`, `herstellerbestellung`, `abweichung_zur_ab`, `export_status`, `ust_aufteilung`, `buchungsmonat` (P-04), `belegart` (P-30) |
| Gutschriften, Mahnungen | PH Gutschrift, PH Mahnung | wie Fassung 1, dazu `bezug_art`, `ruecknahme`, `servicefall` (P-22); `spesen_*` (P-20) |
| Export, UVA, Journal | PH Export Lauf/Protokoll, PH UVA Auswertung/Zeile, PH Buchungsjournal | wie Fassung 1, dazu `korrektur_zu` (P-05) |
| Abschluss | PH Faktura Einstellungen `gesperrt_bis` (P-04); Zählungen über `count` je Punkt | – |
| Ausfuhr | PH Rechnung `ausfuhr_*` (P-18) | – |
| Kontakt | PH Kontakt | `kontaktart`, `anrede`, `vorname`, `nachname`, `firma`, `email`, `kommunikation_bevorzugt`, `uid` |

### 11.2 Aktionen

| UI-Aktion | Aufruf | Bis dahin |
|---|---|---|
| Angebot anlegen | `insert PH Angebot` | – |
| Senden (alle Belege) | `senden(empfaenger, betreff, nachricht)` | Post: Kommentar (P-32) |
| Annehmen / Ablehnen | `annehmen(unterschrift)` / `ablehnen(grund)` nach Commit | `annahme_art` als Kommentar (P-14) |
| Neue Version | `neue_version()` | – |
| Als Auftrag übernehmen | `auftrag_erstellen()` | Alternativen per `save` vorab |
| Zahlungslink | `anzahlungslink(betrag_cent)` / `zahlungslink()` | Schalter `stripeLink` |
| Anzahlung anfordern | `anzahlungsrechnung_erstellen(zeile)` → `stellen()` | – |
| Teil-/Schlussrechnung | `rechnung_erstellen(art, mengen[, zahlungsplan_zeile])` → `stellen()` | `zahlungsplan_zeile` (P-31) |
| Herstellerbestellungen / Lieferschein / Lieferung melden | `herstellerbestellungen_erzeugen()` / ph_logistik / `lieferung_melden(mengen, vollstaendig)` | – |
| Stellen | `save` (`datum`) → `stellen()` | Datumsregel UI-seitig (P-04) |
| Anzahlung abziehen | `anzahlungen_verrechnen(speichern=1)` | nur vereinnahmt (P-10) |
| Zahlung erfassen | `zahlung_erfassen(betrag_cent, "Überweisung"\|"Stripe Link", datum, hinweis)` | Backend-Sperre (P-01) |
| Mahnen | `mahnen(stufe)` → `PH Mahnung.senden(...)` | Auswahl/Stichtag (Fassung 1 §12 Nr. 2) |
| Mahnsperre | `setValue mahnsperre`, `mahnsperre_grund` nach Commit | – |
| Gutschrift / Erstatten | `gutschrift_erstellen(art, grund, erstattung_art)` → `stellen()` / `erstatten("Überweisung", datum, betrag_cent)` | Sperren (P-01, P-12, P-22) |
| Rechnung korrigieren | `korrigieren(grund)` (P-23) | Duplizieren + Gutschrift, nur ohne Zahlungen |
| Rest ausbuchen | `differenz_buchen(art, betrag_cent, datum)` (P-15) | Schalter |
| Uneinbringlich | `uneinbringlich(grund)` (mit P-11) | Schalter |
| Rücktritt | `ruecktritt_fagg(...)` (P-13) | Teilschritte § 5.14 |
| Bank zuordnen | `vorschlaege()` → `zuordnen(beleg_doctype, beleg, betrag_cent)` nach Commit | – |
| Zuordnung lösen | `zuordnung_loesen(zeile)` (P-24) | Schalter |
| Ignorieren / Wieder öffnen | `ignorieren(grund)` / `wieder_oeffnen()` | – |
| Bankimport | `insert PH Bankimport` → `importieren(auto_zuordnen)` | Kontoprüfung IBAN/Währung im Client vor dem Import |
| ER | `insert`; `pruefen(vermerk)`, `freigeben()` (nach Commit), `ablehnen(grund)`, `zurueck_an_erfassung()`, `als_bezahlt_buchen(datum, kanal, betrag_cent)` | Exportsperre UI-seitig (P-30) |
| Export | `insert PH Export Lauf` → `erzeugen()`, `als_uebergeben(an)`, `bestaetigen(datum)`, `verwerfen()` | Prüfung über Reports |
| UVA | `berechnen()`, `als_uebergeben()` | Korrektur (P-05) |
| Monat abschließen | `setValue PH Faktura Einstellungen.gesperrt_bis` + `PH UVA Auswertung.als_uebergeben()` (P-04/P-05) | Knopf deaktiviert |
| Kette prüfen | `journal.kette_pruefen` (Whitelist fehlt) | Knopf deaktiviert |
| Listenexport | CSV im Next + Journal „Listenexport“ (P-27) | Eintrag im Backoffice-Protokoll (`/protokoll`) |
| Suche ⌘K | `ph_core.api.suche.global_search` mit Faktura-DocTypes; Betrag „6240“ → `brutto_cent`/`offen_cent` = 624000 | Registrierung der DocTypes in ph_core prüfen |
| Zeitleiste | `getDocMitInfo` + PH Buchungsjournal | Sätze im Adapter (`texte.js`) |

---

## 12. Fehlerfälle (Sammeltabelle)

| Fall | Anzeige | Weg |
|---|---|---|
| Netzabbruch beim Stellen | „Status wird geprüft …“ → Karte oder „Nicht gestellt“ | § 5.1 |
| Netzabbruch beim Autosave | „Nicht gespeichert – neuer Versuch in 5 s“ | automatisch |
| Gleichzeitige Bearbeitung | Konfliktdialog (D6) | Vergleichen / Neu laden |
| Bank: schon zugeordnet von anderer Person | Toast (Warnung) mit Name/Uhrzeit | „Ansehen“ |
| Bank: Datei falsches Konto / Fremdwährung / doppelt / unlesbar | im Sheet, Datei bleibt | § 3.5 |
| Zahlung erfassen bei passendem Bankeingang | Rückfrage | § 5.2 |
| Zahlung auf bezahlte Rechnung | „Rechnung ist bezahlt“ | – |
| Massen-Senden teilweise fehlgeschlagen | Toast bleibt + Details | § 5.4 |
| Sammel-PDF > 50 | Hintergrundauftrag + Benachrichtigung | § 3.4 |
| Export bricht ab | Banner danger, Belege neu gelesen | § 3.7 |
| Zahlungslink abgelaufen | Zahlungskarte | „Neuen Link senden“ |
| Unterschrift offline | Band, Übertragung später | § 5.6 |
| PDF noch nicht fertig beim Senden | „Sendet nach PDF …“ | § 5.4 |
| PDF-Erzeugung fehlgeschlagen | Fläche + „Erneut“ | § 8 |
| Korrektur/Rücktritt/„stellen und zuordnen“ teilweise ausgeführt | Ergebnis-Karte mit Stand + „Fortsetzen“, Zu-tun-Zeile | § 5.11/5.13/5.14 |
| Kassa-Zahlung ohne Anzahlungsrechnung | Banner danger im Auftrag + Aufgabe | § 2.8 |
| Datum in abgeschlossenem Monat | Feldfehler „Oktober ist abgeschlossen“ | § 3.9 |
| Kein Recht | `⋯`-Zeile „Nur Faktura-Leitung“ + „Leitung bitten“ | § 2.6 |
| Server `unavailable` / `rate_limited` | Banner warning „Verbindung zum Server gestört – Eingaben bleiben erhalten“ / „Zu viele Anfragen – in n s erneut“ | automatisch |

---

## 13. Akzeptanzkriterien

Desktop 1440 px, 1280 × 800, iPad quer/hoch, Telefon 375 × 667. Aktuelles Chrome, Safari und Firefox. Tastaturkriterien ohne Maus. Alle Kriterien gelten auch im Mock-Modus (Schalter einzeln an/aus).

### 13.1 Fachlich

| ID | Kriterium |
|---|---|
| F-01 | Entwurf, Leistungsdatum nur = Rechnungsdatum ohne Quelle · Stellen-Dialog verlangt „Leistungsdatum geprüft“. Nach P-06: leeres Leistungsdatum → „Noch nicht stellbar“, keine Nummer, Status Entwurf. |
| F-02 | Zwei Rechnungen nacheinander gestellt · Nummern fortlaufend, Report Nummernlücken 0. |
| F-03 | Gestellte Rechnung · nur Mahnsperre/Notiz änderbar. Kein „Stornieren“, nur „Gutschrift“/„Korrigieren“. Next schreibt keine anderen Felder (DAL-Test). |
| F-04 | Auftrag mit 40 % · „Anzahlung anfordern“ → Anzahlungsrechnung über 40 % brutto, Zahlungsplan-Zeile verknüpft, USt „fällig mit Vereinnahmung“. |
| F-05 | Schlussrechnung mit vollständig bezahlter Anzahlung · Druck zeigt die abgezogene Anzahlung netto + USt je Satz. `zahlbar_cent` = Brutto − **vereinnahmte** Anzahlung. AB → Abgerechnet. |
| F-06 | Teilrechnung · „Jetzt abrechnen“ nie über geliefert − abgerechnet. |
| F-07 | Zahlung über den offenen Betrag · Eingabe blockiert („Höchstens …“), mit `guthaben` als Guthaben. Zahlung = offen → Bezahlt, Kachel aktualisiert ohne Neuladen. |
| F-08 | Dieselbe Kontoauszug-Datei zweimal · „bereits importiert“, keine neuen Umsätze. |
| F-09 | Rechnungsnummer im Verwendungszweck · „Sicher“, Grund im Peek. Auto-Zuordnung nur mit Schalter. |
| F-10 | Teilbetrag zugeordnet · Umsatz „Teilweise“ mit Rest, Rechnung Teilbezahlt. |
| F-11 | Mahnvorschlag · ohne Mahnsperre, Mindestbetrag, Wartezeit, nicht versandte. Doppelte Stufe verhindert. |
| F-12 | Storno-Gutschrift gestellt · Rechnung Storniert. Der Vermerk steht in der Akte und auf der Gutschrift, die fixierte Rechnungs-PDF bleibt unverändert (Zeitstempel = `pdf`). Keine Lücke im RE-Nummernkreis. |
| F-13 | Mitarbeiter · „Freigeben“ im `⋯` deaktiviert mit „Nur Faktura-Leitung“ + „Leitung bitten“. Leitung gibt frei → Undo in 8 s → Status „Sachlich geprüft“, `geprueft_von/am` unverändert, kein `freigeben`-Aufruf. |
| F-14 | Export erzeugt · Belege gesperrt, Banner „Exportiert …“. ER exportiert → Beträge/Zurück/Ablehnen gesperrt. |
| F-15 | > 10.000 € brutto, **Unternehmer**, ohne UID → „UID des Leistungsempfängers“. Privat → keine Meldung. Kleinbetrag ≤ 400 € ohne Anschrift stellbar. |
| F-16 | Rolle Mitarbeiter · `einkauf_cent`, Marge, `notiz_intern` weder im DOM noch in der Netzwerkantwort. StB: kein `notiz_intern`, keine Unterschrift, kein `ip_hash`. |
| F-17 | Kassa bucht eine Anzahlung auf die Anzahlungsrechnung · Zeitleiste und `anzahlung_ist_cent` aktualisiert. |
| F-18 | Angebot Angenommen · Positionen gesperrt, Banner „Neue Version“. |
| F-19 | „Zahlung erfassen“ bietet nur Überweisung (+ Stripe Link mit Schalter). Ein Action-Aufruf mit `kanal=Bar` → `invalid`. Nach P-01 lehnt auch die API ab. Erstatten bietet kein Bar. |
| F-20 | Kassa-Anzahlung zu einer AB ohne Anzahlungsrechnung · die Kassa stellt die Anzahlungsrechnung und bucht darauf. Die Schlussrechnung zieht sie ab. Die USt steht genau einmal (Report Abgleich, P-02). Ohne Anzahlungsrechnung → Banner danger im Auftrag. |
| F-21 | REST `set_value` auf `offen_cent` einer gestellten Rechnung → „Feld ist gesperrt“ (P-03, Backend-Test). |
| F-22 | Entwurf mit Datum 28.10., gestellt am 04.11. → Rechnungsdatum 04.11. Ist Oktober abgeschlossen (Schalter), ist eine Gutschrift mit Datum 30.10. unmöglich. Die Leitung kann kein Datum vor der letzten RE setzen. |
| F-23 | Privatkunde 24.960,00 € ohne UID → Stellen erfolgreich. Geschäftskunde → Meldung. |
| F-24 | (Schalter `fagg`) Vertragsort „Beim Kunden“, Ware, letzte Lieferung 20.11. → Frist bis 04.12. Ohne Belehrung + 12 Monate. Maßanfertigung → kein Fristbanner, Hinweis § 18. Ohne Schalter: Satz ohne Datum, keine Erinnerung. |
| F-25 | Lieferung 15.08., Rechnung 04.11. → Warnband, `uva_monat` 2026-09 (P-09). |
| F-26 | Anzahlungsrechnung 9.984,00 €, bezahlt 3.744,00 € · die Schlussrechnung blockiert. Mit `restAufloesen`: nach „Rest auflösen“ wird nur der vereinnahmte Betrag abgezogen. |
| F-27 | Storno-Gutschrift auf eine abgezogene Anzahlungsrechnung → Fehler mit Link auf die Schlussrechnung. |
| F-28 | (Schalter `uneinbringlich`) Uneinbringlich → UVA mit negativer USt-Zeile. Ein späterer Eingang ist zuordenbar und erzeugt die positive Zeile. Ohne Schalter: Aktion deaktiviert. |
| F-29 | (Schalter `differenz`) Eingang 187,20 € unter offen, innerhalb der Skontofrist → „Als Skonto buchen“, Rechnung bezahlt, Bemessung gemindert. |
| F-30 | CHF-Bankkonto → Importfehler „Fremdwährung noch nicht freigegeben“. Akte zeigt nur „EUR“. ER-Checkbox Fremdwährung legt eine Aufgabe an. |
| F-31 | Kunde ohne E-Mail → Senden öffnet „Post“. Der Mahnlauf überspringt keine Rechnung, sondern legt Post-Mahnungen an. |
| F-32 | Mitarbeiter: kein CSV in Bank/OP/ER. Leitung: CSV → Protokoll-Eintrag „Listenexport“. |
| F-33 | Bank: Zuordnen → Undo innerhalb 8 s → kein `zuordnen`-Aufruf, keine PH Zahlung. Seitenwechsel innerhalb der Frist → genau eine PH Zahlung. `Enter` auf einer Bankzeile bucht nie. |
| F-34 | Bankumsatz mit „AB-2026-00019“ im Zweck → Vorschlag „Auftrag“, „Anzahlungsrechnung stellen und zuordnen“ ergibt eine gestellte Anzahlungsrechnung und eine Zuordnung. Ein zweiter Klick erzeugt nichts doppelt. |
| F-35 | Senden von Angebot/AB mit Vertragsort ≠ Showroom → Belehrung gesetzt und nicht abwählbar. Annehmen ohne „Annahme über“ unmöglich. |
| F-36 | Rechnung korrigieren mit Pflichtangaben-Fehler in der Kopie → keine Gutschrift gestellt. Ohne P-23 bei Rechnung mit Zahlung → Menüpunkt deaktiviert mit Grund. |
| F-37 | Lieferadresse CH + Montage → Stellen blockiert mit Hinweis Steuerberater (ohne Schalter `ausfuhr`). |
| F-38 | Mahnung ohne Schalter `mahnspesen` → keine Gebühr und keine Zinsen in Vorschau, PDF und Summe. |

### 13.2 Oberfläche und Bedienung

| ID | Kriterium |
|---|---|
| U-01 | Die Wege aus § 1.2 erreichen im E2E genau die Zielzahl. |
| U-02 | Kein Frappe-Begriff (Submit, Cancel, DocType, Draft, Amend, Naming Series). Kein Wort ohne korrekte Umlaute. Keine unerklärte Abkürzung außerhalb Steuer/UVA (DOM-Textsuche aller Routen als Leitung). |
| U-03 | Filter, Sortierung, Seite und Ansicht stehen in der URL. „Zurück“ fokussiert dieselbe Zeile. |
| U-04 | Kürzel § 2.2 funktionieren, in Eingabefeldern löst keines aus. Die Registry hat keine Taste doppelt je Kontext. `x` wählt in jeder Liste aus. Buchstaben-Kürzel sind abschaltbar und danach wirkungslos. |
| U-05 | Jede Liste, jeder Akte-Tab, Peek, Dialog mit Suche und Bericht hat die Leerzustände dieser Datei mit genau einer oder keiner Aktion (Screenshot hell/dunkel im Mock). |
| U-06 | Umkehrbar → Undo 8 s ohne Modal (§ 2.3). Geldwirksam/irreversibel → Rückfrage mit Betrag und Folgen. Stellen und Zahlung ohne zweites Modal. |
| U-07 | Doppelklick oder Tastenwiederholung auf „Stellen“/„Buchen“ erzeugt genau einen Vorgang. `Enter` in den ersten 300 ms nach dem Öffnen eines Dialogs bewirkt nichts. |
| U-08 | Skeleton erst nach 300 ms, CLS 0. |
| U-09 | Token-Lint: keine ms-Zahl außerhalb `--bo-dur-*`. Bei `prefers-reduced-motion` Dauer 0 für move/slow/draw/spring, Opazität ≤ 120 ms. Häkchen-Zeichnen nur bei den drei Ereignissen aus § 2.9. |
| U-10 | Beträge tabellarisch und rechtsbündig. Rot nur für Gemahnt Stufe 3, Storniert, Uneinbringlich, Abgelehnt und Fehler. Ausgänge in `ink`. |
| U-11 | Gleichzeitige Bearbeitung → Konfliktdialog. |
| U-12 | Autosave-Netzabbruch → Hinweis, Eingaben bleiben. |
| U-13 | axe serious/critical = 0 hell und dunkel. Kein Text in Sand `#8a7a66`. Zeit-Signal im Graustufen-Screenshot unterscheidbar. Status nie nur über Farbe. VoiceOver liest die Bankzeile als „Sicher: Zahlungsreferenz im Verwendungszweck“. |
| U-14 | Präsentationsmodus: interne Felder unsichtbar, Palette/Zentrale/Listen gesperrt, Unterschrift landet im Angebot. Am iPad hochkant lässt sich eine Menge ändern. |
| U-15 | Die Druckvorschau einer gestellten Rechnung zeigt die fixierte Datei (gleicher Zeitstempel), es wird nicht neu gerendert. |
| U-16 | Akte bei 1280 × 800: Summenblock ohne Scrollen sichtbar. 5 Tabs, ≤ 1 Banner, jede Aktion 1× sichtbar + 1× im `⋯`. |
| U-17 | Auf `/faktura` erscheint jede Zahl genau einmal. Kein Rechnungen-Kanban. Kein Kanban mit einer Spalte, die nie Ziel sein kann. |
| U-18 | Ein Mitarbeiter sieht keinen Link auf eine Seite ohne Recht. „Leitung bitten“ ein zweites Mal → „Bereits angefragt …“. |
| U-19 | Stellen-Dialog: Die Nummer erscheint nie vor der Ergebnis-Karte. Bei fehlenden Angaben ist der Knopf `disabled` mit sichtbarem Grund. |
| U-20 | iPhone: Freigeben ohne Wischgeste möglich. Kartenköpfe einzeilig. |

---

## 14. Was hier anders ist als in klassischer Branchensoftware

| Hier | Üblich (marahplus/marahrw7 laut Vorbild-Datei, vergleichbare Systeme) |
|---|---|
| Bankumsatz mit einem Klick zuordnen, 8 s rückgängig, Fokus springt weiter, Anzahlungen werden auch über die AB-Nummer erkannt | Auszug-Import, Ausgleich je Posten in einer FiBu-Maske |
| Stand-Band im Auftrag mit dem nächsten Schritt als einzigem Primärknopf | Status als Kennziffer, Folgebeleg über das Menü |
| Pflichtangaben-Prüfer live im Entwurf, Leistungsdatum mit Quelle, UID-Regel nach Empfängerart | Prüfung erst beim Buchen/Drucken |
| Stellen und Senden in einem Dialog. Rechnungskorrektur als ein Ablauf mit Belegkette | Storno, Neuanlage und Versand getrennt |
| Kassa-Grenze in der Oberfläche: kein Barumsatz am Schreibtisch | Bar-/Kartenzahlungen lassen sich oft im Faktura-Modul erfassen |
| Monatsabschluss als Checkliste mit Sperre | Periodensperre in der FiBu, für die Auftragsabwicklung unsichtbar |
| Steuerberater als eigener Benutzer mit Lesezugriff auf Belege und Protokoll | Dateiübergabe, Rückfragen per Telefon |
| „Zu tun“ als Startpunkt, jede Zeile ist eine Aktion | Menüs je Programmteil |

---

## 15. Anfragen

### 15.1 Backend `ph_faktura` und Nachbarn (aus Fachkritik § 8.1, übernommen; K = vor dem ersten echten Beleg)

| Nr | Schwere | Inhalt | Schalter / Abschnitt |
|---|---|---|---|
| P-01 | K | Kanalsperre in `zahlung_erfassen`/`erstatten` (nur Überweisung, Stripe Link; sonst nur `flags.ph_kassa`/System) | E2, F-19 |
| P-02 | K | Kassa-Anzahlung nur auf eine Anzahlungsrechnung, `PH Rechnung.umsatz_quelle`, Report „Abgleich Kassa ↔ Faktura“ | § 2.8, § 9, F-20 |
| P-03 | K | Whitelist `update_after_submit` (`mahnsperre`, `mahnsperre_grund`, `notiz_intern`) | F-21 |
| P-04 | K | `gesperrt_bis`; `stellen()` setzt `datum = heute`; Prüfung gegen die letzte RE; `PH Eingangsrechnung.buchungsmonat` | `monatsabschluss`, F-22 |
| P-05 | K | UVA `korrektur_zu`; `als_uebergeben` setzt `gesperrt_bis` | `uvaKorrektur` |
| P-06 | K | Keine Leistungsdatum-Vorbelegung; Teilrechnung-Datum aus der Teillieferung | F-01 |
| P-07 | K | `empfaenger_unternehmer`, `pflichtangaben_pruefen(unternehmer=…)` | F-15, F-23 |
| P-08 | K | FAGG-Felder und Fristberechnung (§§ 11, 12, 18) | `fagg`, F-24 |
| P-09 | K | `uva_monat` = min(Rechnungsmonat, Leistungsmonat + 1) | F-25 |
| P-10 | K | Nur vereinnahmte Anzahlungen abziehen (bzw. UVA-Nachzug, laut StB) | `restAufloesen`, F-26 |
| P-11 | K | Uneinbringlich mit § 16-Berichtigung, Zuordenbarkeit | `uneinbringlich`, F-28 |
| P-12 | K | Gutschrift-Sperre bei abgezogener Anzahlungsrechnung; UVA nur der vereinnahmte Teil | F-27 |
| P-13 | H | `ruecktritt_fagg(...)` + Felder inkl. `ware_zurueck_am` | `fagg`, § 5.14 |
| P-14 | H | `gesendet_am` (AB), `annahme_art`, `annahme_nachweis`, Belehrungspflicht in `senden` | § 5.6, F-35 |
| P-15 | H | `PH Rechnung Zahlung.art` + Steueranteil, `differenz_buchen()`, `kleindifferenz_cent` | `differenz`, F-29 |
| P-16 | H | ER `skonto_genutzt_cent`, Vorsteuerkorrektur, `zahlbetrag_cent` nicht zeitabhängig | § 3.11 Zahllauf |
| P-17 | H | Fremdwährung sperren (Konto/Import/Rechnung) | E9, F-30 |
| P-18 | H | Ausfuhr-Felder, Steuerfall „Montage im Drittland“, `ausfuhrnachweis_tage` | `ausfuhr`, F-37 |
| P-19 | H | Basiszinssatz mit Gültigkeit, B2B-Pauschale, Gebühr Verbraucher nur mit AGB, Unternehmer aus `kontaktart` | `mahnspesen` |
| P-20 | H | Mahnspesen als Forderung (`spesen_offen_cent`, `spesen_status`, Konto) | `mahnspesen`, F-38 |
| P-21 | H | PH Kundenguthaben (oder `ueberzahlt_cent`) | `guthaben`, F-07 |
| P-22 | H | Gutschrift-Grenze, Art Retoure, `ruecknahme`, `servicefall`, AB-Mengen und `abgerechnet_cent` | § 5.8 |
| P-23 | H | `korrigieren(grund)`, `zahlungen_umbuchen(nach)`, `korrektur_von` | `korrekturMitZahlung`, F-36 |
| P-24 | H | `zuordnung_loesen(zeile)`, Rücklastschrift, Vorschlag auf AB-Nummer, Rest als Guthaben | `zuordnungLoesen`, F-34 |
| P-25 | H | Report OP mit echter Stichtagsberechnung | `stichtag` |
| P-26 | H | PDF-Hash im Journal, Löschsperre fixierter PDFs, Kontakt „Sperren statt Löschen“ | § 2.8 |
| P-27 | H | CSV-Recht Bank/OP/ER nur Leitung, Journal-Vorgang „Listenexport“ | E15, F-32 |
| P-28 | M | Export `anzahlung_export`, ER je `ust_aufteilung` | – |
| P-29 | M | `umsatz_monat` und Chart netto Leistungsumsatz | § 7 |
| P-30 | M | ER-Sperre nach Export, Lieferanten-Gutschrift, CHF/Zollbescheid (Phase 2) | `lieferantenGutschrift` |
| P-31 | M | `rechnung_erstellen(zahlungsplan_zeile)`, Art „Abschlagsrechnung“ | `abschlag` |
| P-32 | M | `als_gesendet_markieren(kanal)`, `versandkanal`, `zustellung_nachweis`, Mahnvorschlag nur zugestellte | `postVersand` |
| P-33 | M | `PH Mahnung.pdf_fixieren()` bei Post, Sammeldruck | § 3.11 |
| P-34 | M | `PH Angebot.ablaufen()`, `wiederherstellen()` | `angebotAblaufen` |
| P-35 | M | Erinnerungs-Schwellen in PH Faktura Einstellungen; Benachrichtigung bei Angebotsablauf | § 3.1 |
| P-36 | H | Garantie: ein Abbruch von `erzeugen()` sperrt keine Belege (eine Transaktion) | § 3.7 |
| P-37 | M | Rückübergang ER „Freigegeben → Sachlich geprüft“ (für Korrekturen nach dem Commit) | § 3.6 |
| P-38 | M | Lesende Methoden: Pflichtangaben-Prüfung ohne Stellen, Mahnvorschau (Gebühr/Zinsen/Frist), Trockenlauf Teil-/Schlussrechnung, Export-Vorprüfung; `mahnlauf_starten(rechnungen[], stichtag)`; `auftrag_erstellen(alternativen)`; Whitelist `journal.kette_pruefen`; Schalter „Methode/Steuercodes vom Steuerberater bestätigt“; Druckformate UVA/Zahlliste; Belegliste je UVA-Kennzahl; Report Liquiditätsvorschau; Anzahl neben Summe in Kennzahlen; Zahlungsreferenz/QR auf Auftragsebene; SEPA pain.001; E-Rechnung-Eingang | übernommen aus Fassung 1 § 12 |

### 15.2 Fundament / 02–05

- **F2** `useVerzoegerterCommit` + Route `/api/undo-commit` (sendBeacon, Origin-Prüfung, Stapel max. 3), dieselbe Anfrage wie Personal.
- **F3** Kürzel-Registry mit Konfliktprüfung je Kontext und Abschalter „Buchstaben-Kürzel aus“ (inkl. `Shift+Buchstabe`).
- **F6** Bausteine `Sheet`, `Ergebniskarte`, `SidePeek`, `Vorgangsleiste` (T5 mit `<button>`-Punkten), `Unterschriftsfeld`.
- **F8** 2FA-Bestätigung für einzelne Aktionen (Monatsabschluss).
- Widersprüche W1–W15 auflösen wie in `20-kritik-ux-faktura.md` § 7. Davon weicht Faktura in einem Punkt ab: Undo-Taste ist `⌘/Strg+Z`, nicht `Z` (sonst Kollision mit `Shift+Z`). 04 § 3.6 auf 8000 ms ändern. 03 § 8.11/§ 8.15 auf 04-Dauern ziehen. Gemahnt Stufe 1–2 orange (W14).
- Label-Tabelle für Workflow-Aktionen (Umlaute) zentral in `labels.js`.

### 15.3 Nachbarbereiche

| An | Anfrage |
|---|---|
| Kassa | Anzahlung nur auf eine Anzahlungsrechnung (die Kassa stellt sie bei Bedarf), Bon als Zahlungsbeleg zur Rechnung, Barauszahlung zu einer Gutschrift, Suchweg „Auftrag suchen“, mobile Kassa für die Montage |
| Shop | Zahlungslink/Anzahlung (ph_shop), Rückerstattung über Stripe mit GF-Freigabe, Gutschein-Einlösung nur Kassa/Shop |
| Logistik | Zustelldatum je Lieferschein als Leistungsdatum-Quelle, `create_partial_invoice`, Rücknahme bei Retoure |
| Sortiment | Bedingung „alle Herstellerbestellungen geliefert“ für den Reiter Lieferbereit, Storno-Anfrage beim Hersteller |
| Projekte | Vorgangsleiste, Positionen aus der Planung, Montage-Abnahme als Leistungsdatum, Montage mobil (QR) |
| CRM | `kontaktart`, `anrede`, `kommunikation_bevorzugt`, `uid` gepflegt. PH Aufgabe als Kanal für „Leitung bitten“ |
| Service | Servicefall → Gutschrift „Wertminderung“ mit Bezug |
| Zentrale | Einbindung `faktura/zuTun.js` |
| ph_core | Faktura-DocTypes in `global_search` registrieren, Firmendaten (Firmenname, FN, Gericht) für die Mailsignatur |

### 15.4 Steuerberatung (vor dem ersten echten Beleg: 1, 2, 3, 5, 9)

1. Stripe Link: Barumsatz im Sinn des § 131b BAO, wenn der Kunde zu Hause bzw. vor Ort zahlt?
2. Anzahlung an der Kassa: Bon als Zahlungsbeleg zur Anzahlungsrechnung oder Bon mit USt? Welche Quelle meldet?
3. Schlussrechnung bei unbezahlter Anzahlungsrechnung: Variante A (Rest auflösen) oder B (UVA-Nachzug)?
4. Küche in Etappen: Teilrechnung oder Abschlag? Kriterium „abgeschlossen und abgenommen“?
5. Späte Rechnung: Umsetzung „Leistungsmonat + 1“ bestätigen.
6. CHF: Kursquelle, Kursdifferenzen-Konto, Montage in CH (Registrierung, Fiskalvertreter).
7. Ausfuhrnachweis: Frist, Touristenexport (U34) beim Abholen im Showroom anbieten?
8. Export der Anzahlungsrechnungen (bei Zahlung/bei Rechnung); Konten für Mahnspesen, Forderungsabschreibung, Skonto.
9. Drucktitel für Rechnungskorrekturen („Gutschrift“ vs. „Rechnungskorrektur/Storno“).
10. Gutscheine: Einzweck oder Mehrzweck.

### 15.5 Inhaber

- PIN für das Beenden des Präsentationsmodus: ja/nein.
- Bargeld bei der Montage: mobile Kassa oder gar nicht (nach StB-Frage 1/2).
- Wer darf Monatsabschlüsse wieder öffnen (Vorschlag: nur Geschäftsführung)?

---

## 16. Bauauftrag

### 16.1 Dateien und Routen (`backoffice/`)

```
src/app/faktura/
  layout.js                         Unternavigation (Pills nach Rechten; keine Sitzungsprüfung im Layout)
  page.js  loading.js               Bereichsstart (Cockpit ?cockpit=buchhaltung|vertrieb; StB → redirect /faktura/export)
  angebote/page.js                  Liste/Kanban (?ansicht=kanban)
  angebote/[name]/page.js           Akte (+ ?praesentation=1)
  auftraege/page.js  auftraege/[name]/page.js
  auftraege/[name]/abrechnen/page.js   Teil-/Schlussrechnung (?art=teil|schluss), Schritte
  rechnungen/page.js                Liste inkl. Reiter Offene Posten (?r=offene-posten)
  rechnungen/[name]/page.js
  offene-posten/page.js             redirect → /faktura/rechnungen?r=offene-posten
  gutschriften/page.js  gutschriften/[name]/page.js
  mahnungen/page.js  mahnungen/[name]/page.js
  bank/page.js  bank/importe/page.js
  eingangsrechnungen/page.js  eingangsrechnungen/[name]/page.js
  zahllauf/page.js
  export/page.js  export/[name]/page.js
  uva/page.js  uva/[name]/page.js
  abschluss/page.js
  ausfuhr/page.js                   nur Schalter ausfuhr (sonst notFound)
  journal/page.js
  berichte/[report]/page.js
  stammdaten/page.js                Tabs ?tab=zahlungsbedingungen|bankkonten|einstellungen|mahnwesen|erinnerungen
src/app/api/undo-commit/route.js    nur falls Fundament F2 nicht rechtzeitig liefert (gemeinsam mit Personal, eine Route)
src/components/Backoffice/Faktura/  (Liste 16.2)
src/lib/backoffice/faktura/
  actions.js        "use server" – alle Mutationen (16.3)
  daten.js          server-only Lesefunktionen (Listen, Akten, Kennzahlen, Zu tun, Bank-Vorschläge, Abschluss-Zählungen)
  schalter.js       § 2.7 (Server-Konstanten, Mock umschaltbar)
  texte.js          Glossar, Workflow-Labels, Zeitleisten-Sätze, Mailvorlagen, {anrede_brief}
  status.js         Statustöne § 2.4 inkl. Gemahnt-Stufe
  pflichtangaben.js pruefePflichtangaben(beleg, kontakt, firma, einstellungen) (rein)
  betraege.js       Summen, Anteile, vereinnahmte Anzahlungen, Zahlungsplan-Summe (rein, Cent)
  kanaele.js        erlaubte Zahl-/Erstattungskanäle je Rolle/Schalter (rein)
  datumsregeln.js   Rechnungsdatum, gesperrt_bis, späte Rechnung, uva_monat-Vorschau (rein)
  bankanker.js      Nummern aus Verwendungszweck (RE/AB/ER), Sicherheitswort (rein)
  zuTun.js          Regeln § 3.1 (Bausteine auch für Zentrale)
  felder.js         Whitelist schreibbarer Felder gestellter Belege (B-03)
  kuerzel.js        Registrierung § 2.2
  mahnvorschlag.js  Client-Filter (versandt, Mahnsperre, Post-Vermerk) (rein)
src/lib/backoffice/mock/  seed-Ergänzungen Faktura (über die Erweiterungsstelle in seed.js)
tests/unit/backoffice-faktura-*.test.mjs   tests/e2e/faktura.spec.js
```

Einträge: `bereiche.js` (Navigation Faktura, `startseite: "/faktura"`, `kanban: ["PH Angebot", "PH Eingangsrechnung"]` statt PH Rechnung) und `suche.js` (Palette: „> angebot“, „> zahlung“, „> mahnen“, „> bank“, „> eingangsrechnung“, Betragssuche).

### 16.2 Komponenten (`components/Backoffice/Faktura/`)

| Komponente | Art | Zweck |
|---|---|---|
| `FakturaPills` | Server | Unternavigation mit Zählern |
| `ZuTunListe`, `ZuTunZeile` | Server + Client | § 3.1, Aktion je Zeile |
| `KennzahlReihe`, `AltersBand` | Server | § 7, Band mit Segment-Filter |
| `AngeboteListe`, `AuftraegeListe`, `RechnungenListe`, `GutschriftenListe`, `MahnungenListe`, `ErListe`, `ExportListe` | Client (Konfiguration auf `DataTable`) | Spalten, Reiter, Massenaktionen |
| `OffenePostenReiter` | Client | Kopfzeile, Band, Gruppierung, Stichtag-Schalter |
| `BankListe`, `BankPeek`, `ZuordnenDialog`, `ImportSheet` | Client | § 3.5, § 5.11 |
| `ErPruefPeek`, `ErNeuSheet` | Client | § 3.6 |
| `BelegKopf`, `StandBand`, `Summenblock`, `Zahlungskarte` | Server/Client | Akten-Kopf, § 4 |
| `PflichtangabenPruefer` | Client | Liste mit Sprunglinks, Fehlerpunkt am Tab |
| `PositionenTabelle` (auf `Kindtabelle`), `PositionKartenEditor` | Client | Positionen Desktop / iPad |
| `StellenDialog` | Client | § 5.1 inkl. Datum, Leistungsquelle, Warnbänder, Senden-Checkbox, Statusprüfung |
| `ZahlungDialog` | Client | § 5.2 |
| `AnzahlungDialog` | Client | § 5.3 |
| `SendenDialog` | Client | § 5.4 (E-Mail/Post/Persönlich) |
| `AngebotAnlegenDialog`, `AnnehmenDialog`, `Unterschriftsfeld` | Client | § 5.5/5.6 (Unterschrift, falls F6 nicht liefert) |
| `AuftragUebernehmenDialog` | Client | § 5.7 |
| `GutschriftDialog`, `ErstattenDialog` | Client | § 5.8 |
| `AbrechnenAblauf` | Client | § 5.9/5.10 Schritte |
| `KorrigierenDialog`, `DifferenzDialog` | Client | § 5.12/5.13 |
| `RuecktrittDialog`, `TeilschrittErgebnis` | Client | § 5.14, Fortsetzen |
| `ExportSheet` | Client | § 5.15 mit Prüfliste |
| `MahnenSheet` | Client | § 5.16 |
| `UvaTabelle` | Server | § 3.8 |
| `AbschlussListe` | Server + Client | § 3.9 |
| `AusfuhrListe`, `AusfuhrNachweisSheet` | Client | § 3.10 |
| `Druckvorschau` | Client | § 8 |
| `Praesentationsmodus` | Client | Sperre Palette/Listen, Wortmarke |
| `LeitungBitten` | Client | § 2.6 inkl. Mehrfachschutz |
| `FakturaBericht` | Server | Report-Tabelle + Chart + `<details>` |
| `ZahlungsbedingungFormular` | Client | Live-Satz, 100-%-Prüfung |
| `MontageOffenKarte` | Client | Baustein für den Arbeitsplatz Montage (eingebunden von Projekte) |

Wiederverwendet: `Shell`, `Seitenkopf`, `DataTable`, `Filterleiste`, `Kanban`, `Formular`, `Kindtabelle`, `LinkFeld`, `Datumsfeld`, `WorkflowLeiste`, `Zeitleiste`, `Kennzahl`, `Charts`, `StatusBadge`, `Leer`, `Fehler`, `Bestaetigen`, `Toast`, `Segment`, `Knopf`, `KioskShell` (Montage).

### 16.3 Server Actions (`lib/backoffice/faktura/actions.js`)

Für alle gilt: `requireSession()`, `darfDoc` und Rolle erneut prüfen, Eingaben per zod, Rückgabe `{ ok, code, message, fehler? }`, `idempotency_key` bei geldwirksamen und mehrstufigen Aktionen, gestellte Belege nur über Methoden (`felder.js`), kein Betrag und kein Name im Log.

| Action | Prüfung | Frappe |
|---|---|---|
| `angebotAnlegenAction({ kontakt, projekt?, titel, zahlungsbedingung, vertragsort })` | create | `insert PH Angebot` |
| `belegSpeichernAction({ doctype, doc, modified })` | write, docstatus 0 | `save` (Konflikt über `modified`) |
| `positionUebernehmenAction({ doctype, name, zeile, produkt })` | write, Entwurf | `runDocMethod produkt_uebernehmen` |
| `sendenAction({ doctype, name, kanal, empfaenger?, betreff?, nachricht?, belehrung? })` | Recht, Belehrungsregel § 2.8 | `runDocMethod senden`; Post: `getPdf` + `kommentar` bzw. `als_gesendet_markieren` (Schalter) |
| `annehmenAction({ name, annahmeArt, datum, unterschrift?, nachweis? })` | write | `uploadFile`, `runDocMethod annehmen`, `kommentar` (bis P-14) |
| `angebotStatusAction({ name, aktion: "ablehnen", grund })` (nach Commit) | Transition erlaubt | `runDocMethod ablehnen` |
| `neueVersionAction({ name })` | Recht | `runDocMethod neue_version` |
| `auftragUebernehmenAction({ angebot, alternativen[], zahlungsplan[], termine, fagg? })` | create | `save PH Angebot` (Alternativen), `runDocMethod auftrag_erstellen`, `save PH Auftragsbestaetigung` |
| `anzahlungAnfordernAction({ auftrag, zeile, modus: "rechnung"\|"link", stellen, senden })` | Recht, Schalter | `runDocMethod anzahlungsrechnung_erstellen` → `stellenAction`-Kern; `anzahlungslink` |
| `abrechnenEntwurfAction({ auftrag, art, mengen, zahlungsplanZeile?, lieferschein? })` | create | `runDocMethod rechnung_erstellen` |
| `stellenAction({ doctype, name, datum?, leistungGeprueft, senden?, idempotency })` | submit-Recht; Datum nur Leitung; `datumsregeln.js`; `pflichtangaben.js` | `save datum`, `runDocMethod stellen`, optional `senden`; bei Timeout `getDoc` |
| `anzahlungenAbziehenAction({ name })` | write, Entwurf | `runDocMethod anzahlungen_verrechnen` |
| `zahlungErfassenAction({ rechnung, betragCent, kanal, datum, hinweis })` | Kanal laut `kanaele.js`, Betrag ≤ offen | `runDocMethod zahlung_erfassen` |
| `mahnenAction({ rechnungen[], stichtag, entwurf })` | Recht | je Rechnung `runDocMethod mahnen` + `PH Mahnung.senden` bzw. Post-Entwurf |
| `mahnungStatusAction({ name, aktion: "erledigen"\|"stornieren" })` (erledigen nach Commit) | Recht | `runDocMethod erledigen|stornieren` |
| `mahnsperreAction({ rechnung, wert, grund })` (nach Commit) | write | `setValue mahnsperre`, `mahnsperre_grund` |
| `gutschriftAnlegenAction({ rechnung, art, grund, erstattung })` | create, B-05-Prüfung im Client | `runDocMethod gutschrift_erstellen` |
| `erstattenAction({ gutschrift, betragCent, datum })` | Kanal fest Überweisung | `runDocMethod erstatten` |
| `korrigierenAction({ rechnung, grund })` | Recht; ohne P-23 nur ohne Zahlungen | `runDocMethod korrigieren` oder Duplizieren + `gutschrift_erstellen` |
| `korrekturStellenAction({ neu, gutschrift, idempotency })` | Reihenfolge § 5.13 | `stellen` ×2, `zahlungen_umbuchen` (P-23) |
| `differenzBuchenAction(...)` | Schalter `differenz` | `runDocMethod differenz_buchen` |
| `uneinbringlichAction({ rechnung, grund })` | Leitung, Schalter | `runDocMethod uneinbringlich` |
| `ruecktrittAction({ auftrag, datum, kanal, nachweis?, anteilCent, kulanz, schritt?, idempotency })` | Leitung/Mitarbeiter laut Recht | P-13 `ruecktritt_fagg` oder Teilschritte `gutschrift_erstellen`/`stellen`/`stornieren`/`insert PH Aufgabe`/`kommentar` |
| `auftragStornierenAction({ auftrag, grund })` | Leitung | wie Rücktritt ohne Frist |
| `lieferungMeldenAction({ auftrag, mengen, vollstaendig })` | Recht, nur ohne ph_logistik | `runDocMethod lieferung_melden` |
| `herstellerbestellungenAction({ auftrag })` | Recht | `runDocMethod herstellerbestellungen_erzeugen` |
| `bankImportAction({ konto, datei, autoZuordnen })` | Leitung; IBAN/Währung vorab | `uploadFile`, `insert PH Bankimport`, `runDocMethod importieren` |
| `bankZuordnenAction({ umsatz, belegDoctype, beleg, betragCent })` (nach Commit) | Leitung, Betrag ≤ Rest/offen | `runDocMethod zuordnen` |
| `bankAnzahlungZuordnenAction({ umsatz, auftrag, zeile, idempotency })` | Leitung | `anzahlungsrechnung_erstellen` → `stellen` → `zuordnen` |
| `bankSicherZuordnenAction({ umsaetze[] })` | Leitung, nur Sicher | je Umsatz `zuordnen` |
| `bankIgnorierenAction({ umsatz, grund })` / `bankWiederOeffnenAction` | Leitung | `runDocMethod ignorieren|wieder_oeffnen` |
| `zuordnungLoesenAction({ umsatz, zeile })` | Leitung, Schalter | `runDocMethod zuordnung_loesen` |
| `erAnlegenAction({ felder, datei, pruefen })` | create, Doppelprüfung | `uploadFile`, `insert PH Eingangsrechnung`, optional `pruefen` |
| `erAktionAction({ name, aktion, vermerk?, grund?, zahlung? })` (freigeben nach Commit) | Rolle je Aktion, Exportsperre | `runDocMethod pruefen|freigeben|ablehnen|zurueck_an_erfassung|als_bezahlt_buchen` |
| `zahllaufVormerkenAction({ namen[], wert })` (nach Commit) | Recht | `setValue` (Zahllauf-Feld) |
| `zahllaufBuchenAction({ namen[], datum })` | Leitung | je ER `als_bezahlt_buchen` |
| `exportErzeugenAction({ zeitraum, format, belegarten, nurNeue, idempotency })` | Leitung | `insert PH Export Lauf`, `runDocMethod erzeugen`; bei Fehler `getList export_status` |
| `exportStatusAction({ name, aktion, an?, datum? })` | Leitung | `als_uebergeben|bestaetigen|verwerfen` |
| `uvaAction({ name?, monat, aktion: "berechnen"\|"uebergeben" })` | Leitung | `insert` + `berechnen` / `als_uebergeben` |
| `monatAbschliessenAction({ monat, bestaetigung2fa })` | Leitung, Schalter | `setValue gesperrt_bis`, `als_uebergeben` |
| `ausfuhrNachweisAction({ rechnung, art, mrn?, datum, datei })` | Schalter | `uploadFile`, `setValue ausfuhr_*` (allow_on_submit laut P-18) |
| `stammdatenSpeichernAction({ doctype, doc, modified })` | Leitung | `save` |
| `leitungBittenAction({ doctype, name, aktion })` | Sitzung | `getList PH Aufgabe` (Kennung) → `insert PH Aufgabe` |
| `listenexportAction({ liste, params })` | Leitung | `getList` (alle Seiten), CSV, Protokoll-Eintrag |
| `commitAction({ token })` | Sitzung, Token aus Undo-Registry | führt die hinterlegte Action genau einmal aus (gemeinsam mit F2) |

### 16.4 Frappe-Aufrufe (Lesen, `daten.js`)

- `getList`/`count`: PH Angebot, PH Auftragsbestaetigung, PH Rechnung, PH Gutschrift, PH Mahnung, PH Bankumsatz, PH Bankimport, PH Bankkonto, PH Eingangsrechnung, PH Export Lauf, PH UVA Auswertung, PH Buchungsjournal, PH Zahlungsbedingung, PH Aufgabe (Kennung `faktura:*`).
- `getDocMitInfo` für Akten (Zeitleiste), `getTransitions` für Knöpfe, `getKanban` PH Angebot / PH Eingangsrechnung.
- `getReport`: PH Offene Posten, PH Anzahlungsstand, PH UVA Zuarbeit, PH OSS Umsaetze je Land, PH Nummernluecken, PH Umsatz nach Marke, PH Vertriebscockpit Faktura, PH Export-Abgleich, PH Zahllauf Vorschlag, PH Mahnvorschlag.
- `call`: `kennzahlen.op_gesamt`, `op_ueberfaellig`, `anzahlungen_offen`, `offene_angebote`, `auftragsbestand`, `nicht_exportiert`; `mahnlauf_starten(nur_vorschlag=1)`; `PH Bankumsatz.vorschlaege()`; `zahlungsplan_vorschau()`; `onload offene_anzahlungen`.
- `getPdf` (Druckformate § 8), `getFile` (fixierte PDF, ER-Datei über `/api/datei`), `searchLink` (Link-Felder), `getDoc` PH Faktura Einstellungen / PH Mahnwesen Einstellungen / PH Firma.
- Nachbarn lesend: PH Kontakt (`kontaktart`, `anrede`, `kommunikation_bevorzugt`, `email`, `uid`), PH Lieferschein (Zustelldatum), PH Herstellerbestellung (Status), PH Projekt (Phase), PH Kassenbeleg (Zeitleiste).
- ph_core: `globalSearch`, `recentActivity`.
- Felder mit permlevel 1 lädt `daten.js` nur für berechtigte Rollen (nicht nur ausblenden). Für die StB-Rolle entfernt `daten.js` `notiz_intern`, `unterschrift_kunde` und `ip_hash` vor der Serialisierung.

### 16.5 Reihenfolge

| Schritt | Inhalt | Ergebnis |
|---|---|---|
| 1 | Reine Module (`pflichtangaben`, `betraege`, `kanaele`, `datumsregeln`, `bankanker`, `status`, `texte`, `felder`, `schalter`, `mahnvorschlag`, `zuTun`) + Unit-Tests. Mock-Seed: 12 Angebote, 8 Aufträge (alle Zustände inkl. Kassa-Datenfehler), 30 Rechnungen (alle Arten/Status, Privat > 10.000 €, Geschäftskunde, CH-Montage, ohne E-Mail), 4 Gutschriften, 5 Mahnungen, 1 Bankimport mit 15 Umsätzen (alle Sicherheiten, AB-Nummer, Ausgang), 10 ER, 2 Export-Läufe, 2 UVA | Regeln grün |
| 2 | Layout/Pills, Routen, Umleitungen, Rechte-Weichen (StB-Startseite), `bereiche.js`, `suche.js`, Kürzel-Registrierung | Navigation vollständig |
| 3 | Listen Angebote/Aufträge/Rechnungen inkl. Reiter OP, Filterzeile, Summenzeile, Massenleisten, Leerzustände | Listen nutzbar |
| 4 | Akte Rechnung (5 Tabs, Kopf, Vorgangsleiste, Pflichtangaben-Prüfer, Positionen, Druckvorschau) | Rechnung lesbar/bearbeitbar |
| 5 | Stellen-Dialog, Zahlung-Dialog, Senden-Dialog, Gutschrift/Erstatten | Kernvorgänge |
| 6 | Akte Auftrag (Stand-Band, Zahlungsplan), Anzahlung anfordern, Teil-/Schlussrechnung | Belegkette AB → RE |
| 7 | Akte Angebot, Angebot anlegen, Annehmen (Unterschrift), Als Auftrag übernehmen, Präsentationsmodus, Kanban | Vertrieb |
| 8 | Bank: Liste, Peek, verzögerter Commit (F2), Zuordnen-Dialog, Import, AB-Erkennung | Tagesroutine |
| 9 | Eingangsrechnungen: Liste/Kanban, Prüf-Peek, Neu-Sheet, Zahllauf | Einkauf |
| 10 | Bereichsstart: Zu tun, Kennzahlen, Altersband, Cockpit Vertrieb | Startseite |
| 11 | Mahnen-Sheet, Mahnungen-Liste, Export-Sheet + Liste, UVA, Journal, Berichte | Monatsroutine |
| 12 | Monatsabschluss (Checkliste), Rechnung korrigieren, Rücktritt (Teilschritte), Stammdaten | Rechtsprozesse |
| 13 | Mobil/iPad: Karten, Karten-Editor, Montage-Baustein | Geräte |
| 14 (Phase B) | Schalter einzeln aktivieren, sobald P-xx geliefert sind: `monatsabschluss`, `fagg`, `restAufloesen`, `zuordnungLoesen`, `guthaben`, `differenz`, `mahnspesen`, `uneinbringlich`, `stichtag`, `ausfuhr` (+ Seite), `postVersand`, `korrekturMitZahlung`, `lieferantenGutschrift`, `abschlag`, `angebotAblaufen`, `uvaKorrektur`, `stripeLink` | Vollumfang |

### 16.6 Aufwand (Agent-Stunden, Schätzung)

| Schritt | h |
|---|---|
| 1 Reine Module + Seed + Unit-Tests | 8 |
| 2 Navigation/Routen/Rechte/Kürzel | 3 |
| 3 Listen (3) inkl. OP-Reiter | 7 |
| 4 Akte Rechnung + Positionen + Druckvorschau | 9 |
| 5 Stellen, Zahlung, Senden, Gutschrift/Erstatten | 8 |
| 6 Akte Auftrag, Anzahlung, Teil-/Schlussrechnung | 8 |
| 7 Angebot, Annehmen, Übernehmen, Präsentation, Kanban | 7 |
| 8 Bank | 8 |
| 9 Eingangsrechnungen + Zahllauf | 6 |
| 10 Bereichsstart | 4 |
| 11 Mahnen, Export, UVA, Journal, Berichte | 8 |
| 12 Abschluss, Korrektur, Rücktritt, Stammdaten | 7 |
| 13 Mobil/iPad/Montage-Baustein | 4 |
| E2E (Klickwege, Kürzel, Undo, Rechte), axe hell/dunkel, Screenshots Leerzustände | 8 |
| **Phase A gesamt** | **95** |
| 14 Phase B (je Schalter 0,5–2 h, nach Backend) | 18 |

### 16.7 Abhängigkeiten

| Von | Was | Blockiert | Ersatz bis dahin |
|---|---|---|---|
| Fundament F2 | verzögerter Commit + Route | Bank, Freigeben, Ablehnen, Erledigt, Mahnsperre, Zuweisen | gemeinsame Route `api/undo-commit` (mit Personal abgestimmt, eine Implementierung) |
| Fundament F3 | Kürzel-Registry + Abschalter | Tastatur-QA | lokale Registrierung über `useTastenkuerzel` |
| Fundament F6 | Sheet, Ergebniskarte, SidePeek, Vorgangsleiste, Unterschriftsfeld | Schritte 4–8 | Bausteine im Bereich bauen, das Fundament übernimmt sie |
| Fundament F8 | 2FA je Aktion | Monatsabschluss | Knopf deaktiviert |
| Backend K (P-01–P-12) | Recht/Geld | **Go-Live echter Belege (E1)** | Mock, Testmandant, UI-seitige Regeln § 2.8 |
| Backend H/M (P-13–P-38) | Schalter § 2.7 | jeweiliger Schalter | Hinweise/Teilschritte laut § 2.7 |
| StB (1, 2, 3, 5, 9) | Kanäle, Kassa-Quelle, Schlussrechnung, UVA-Monat, Drucktitel | Go-Live | Standard laut E2/E13, Schalter aus |
| Kassa | Anzahlungsrechnung aus der Kassa, Bon als Zahlungsbeleg, Barauszahlung | F-20 | Datenfehler-Banner |
| Shop | Zahlungslink, Stripe-Rückerstattung | `stripeLink` | Überweisung/QR |
| Logistik | Zustelldatum, Teilrechnung aus Lieferschein | Leistungsdatum-Quelle | Bestätigung „Leistungsdatum geprüft“ |
| Sortiment | Herstellerbestellungen, Lieferbereit-Bedingung | Reiter Lieferbereit | Tooltip „ohne Prüfung“ |
| Projekte | Vorgangsleiste, Planung, Abnahme, Montage-Arbeitsplatz | Belegkette, Positionen aus Planung | eigene Vorgangsleiste, manuelle Positionen |
| CRM | Kontaktfelder gepflegt, PH Aufgabe | UID-Regel, Anrede | Vorbelegung „Privat“, Schalter im Entwurf |
| Zentrale | Einbindung Zu tun | Klickziele ab Zentrale | Zu tun auf `/faktura` |
| ph_core | Suche-Registrierung, Firmendaten | ⌘K, Mailsignatur | getList-Rückfall der Suche |

### 16.8 QA-Checkliste (Abnahme)

**Allgemein:** Alle Kriterien § 13 · Mock-Modus vollständig, jeder Schalter einzeln an/aus geprüft · Primäraktion eindeutig mit `⌘Enter` · Filter in URL · Skeleton ≥ 300 ms, CLS 0 · alle Leerzustände als Mock-Fall mit Screenshot hell/dunkel · Fehlertexte ohne Technikbegriffe · axe serious/critical = 0 hell und dunkel (Bank, Rechnungsakte, Stellen-Dialog, Mahnen-Sheet, Kanban Angebote) · Desktop 1440, 1280 × 800, iPad quer/hoch, Telefon 375 × 667 · ESLint 0 Fehler · keine Änderung in `Backend-Import/`.

**Recht und Geld**
1. „Zahlung erfassen“ und „Erstatten“ bieten weder Bar noch Karte, Gutschein oder Verrechnung. Ein manipulierter Action-Aufruf → `invalid` (F-19).
2. Rechnungsdatum = heute nach dem Stellen. Die Leitung kann kein Datum vor der letzten RE setzen (F-22).
3. Leistungsdatum ohne Quelle → Pflicht-Checkbox (F-01).
4. UID-Regel Privat/Unternehmer, Kleinbetrag, EU-Firma ohne `uid_geprueft_am` blockiert (F-15, F-23).
5. Schlussrechnung zieht nur vereinnahmte Anzahlungen ab und blockiert bei Rest (F-05, F-26).
6. Gutschrift-Grenzen und Sperre bei abgezogener Anzahlungsrechnung (F-27).
7. Angebot/AB außerhalb des Showrooms nur mit Belehrung, Annahme nur mit „Annahme über“ (F-35).
8. CH-Montage blockiert, Ausfuhr mit Pflicht-Checkbox (F-37).
9. Mahnungen ohne Gebühr/Zinsen ohne Schalter (F-38). Nicht versandte Rechnungen sind im Mahnen-Sheet grau.
10. Gestellte Belege: DAL-Test, Next schreibt nur Whitelist-Felder (F-03).
11. Kassa-Zahlung ohne Anzahlungsrechnung → Banner danger + Aufgabe.
12. Rechnung korrigieren: Fehler in der Kopie → nichts gestellt (F-36).
13. Fremdwährung abgelehnt (F-30).
14. StB-Rolle: kein `notiz_intern`, keine Unterschrift, kein `ip_hash` in Antworten. Mitarbeiter ohne permlevel-1-Felder in Antworten (F-16).

**Bedienung**
15. Bank: `Enter` bucht nie. Zuordnen → Undo → kein Aufruf. Seitenwechsel → genau ein Aufruf. Stapel max. 3 (F-33).
16. AB-Nummer im Zweck → „Anzahlungsrechnung stellen und zuordnen“, idempotent (F-34).
17. Stellen-Dialog: keine Nummer vorab, Knopf `disabled` mit Grund, `Enter` < 300 ms ohne Wirkung, Netztrennung → eindeutiger Endzustand (U-07, U-19).
18. Stellen und Senden in einem Dialog. Senden-Fehler nach dem Stellen → „Gestellt. Senden fehlgeschlagen“ + „Erneut senden“.
19. Klickwege § 1.2 im E2E exakt (U-01).
20. Kürzel-Registry ohne Doppelbelegung; `x` = Auswahl, `Leertaste` = Peek, Abschalter wirkt (U-04).
21. Akte 1280 × 800 (U-16). Jede Zahl auf `/faktura` einmal (U-17).
22. Rechte: kein Link ohne Recht, „Leitung bitten“ mit Mehrfachschutz (U-18).
23. Statuston-Snapshot je Status gegen § 2.4. Kein Text in Sand. Ausgänge `ink` (U-10, U-13).
24. Token-Lint und reduced motion (U-09). Häkchen nur bei den drei Ereignissen.
25. Präsentationsmodus: Palette/Listen gesperrt, iPad hochkant Mengenänderung möglich (U-14).
26. Druckvorschau gestellter Rechnung = fixierte Datei; Storno-Vermerk nicht in der PDF (U-15, F-12).
27. Mobil: ER-Freigabe per Knopf, Bankleiste verdeckt die Fokuszeile nicht, Kartenköpfe einzeilig (U-20).
28. Schalter aus: kein DOM-Element der jeweiligen Funktion außer dem Hinweistext aus § 2.7.

---

## 17. Nicht mehr enthalten (bewusst gestrichen)

Kanal Bar · Karte extern · Gutschein · Verrechnung in „Zahlung erfassen“, Bar-Erstattung, Stripe-Link bei der Montage, `Enter` = Zuordnen, Zuordnen ohne Undo, Rechnungen-Kanban, eigene Seite Offene Posten (jetzt Reiter), Status-Chip-Reihen, Heute-Chips, Split-Button „Rechnung anlegen ▾“ mit 5 Belegarten, Assistent A2 (jetzt Dialog), A3 als 4 Schritte, A7 als 4 Schritte, A9 als 4 Schritte, Mahnlauf-Knöpfe in Stammdaten, Nummernvorschau im Stellen-Dialog, zweites Modal „Senden“ nach dem Stellen, 7 Tabs je Akte, vier Stand-Balken, Mini-Balken Anzahlung, Sicherheitspunkte „●●●○“, FAGG-Checkbox im Akten-Kopf, FAGG-Fristdatum ab Vertragsdatum, Banner „Stand zum Stichtag – spätere Zahlungen nicht berücksichtigt“, „Für Korrekturen neue UVA-Auswertung“, „Überzahlung wird als Guthaben vermerkt“, „Umsatz Monat (brutto, nach Gutschriften)“, Storno-Vermerk in der fixierten PDF, Steuerfall „Kleinunternehmer“, Währung/Kurs editierbar, Einzeltasten-Kürzel `a s x z g m f` für Faktura-Aktionen, „An Kassa übergeben“ als Menüpunkt, Kennzahl-Werte „–“ beim frischen Mandanten, Emoji in Wireframes.

---

## 18. Änderungsprotokoll (Fassung 1 → Fassung 2, 2026-11-04)

**Aus UX-Kritik (`20-kritik-ux-faktura.md`):**

| Nr. | Umsetzung |
|---|---|
| P1 Bank `Enter` bucht | E3, § 2.3, § 3.5: `Enter` = Peek, Zuordnen per Knopf/`Shift+Enter` als verzögerter Commit, Stapel 3, Massen-Rückfrage; F-33 |
| P2 Kürzel-Kollisionen | E4, § 2.2 vollständige Belegung; `⌘Z` statt `Z` als Undo (Abweichung gemeldet § 15.2); U-04 |
| P3 Undo falsch | § 2.3: Variante A für Ablehnen, Erledigt, Freigeben, Zuweisen, Mahnsperre; 8 s einheitlich; F-13; „Ablaufen lassen“ hinter Schalter (Methode fehlt) |
| P4 Klickzahlen | § 1.2 Zählregel und neue Wege, einheitlich „Anzahlung anfordern“; U-01 |
| P5 Stellen-Dialog | E11, § 5.1: keine Nummer vorab, `disabled` mit Grund, Senden-Checkbox, Entprellung 300 ms, Statusprüfung bei Timeout; U-07/U-19 |
| P6 Statusfarben | E14, § 2.4 exakt 03 § 1.5, Ausgänge `ink` mit Pfeil-Icon |
| P7 Sand als Text | § 2.1 `bo-accent-text`, Zeit-Signal mit Icon-Form; § 7 Kennzahl-Label; U-13 |
| P8 Akten zu voll | § 2.1, § 4.1, § 4.3: 5 Tabs, Belegkette in der Vorgangsleiste, Stand-Band, 1 Banner, jede Aktion einmal; U-16 |
| P9 Filter doppelt / OP | § 2.1 eine Filterzeile, § 3.4 OP als Reiter, Pills neu, Zahllauf/Journal in „Mehr“ |
| P10 Mahnen sechs Einstiege | § 5.16 ein Sheet für alle Einstiege, Stammdaten ohne Mahnlauf-Knopf |
| P11 Assistenten | E10, § 5.5, § 5.7, § 5.15; Schritte nur § 5.9/5.10 mit `⌘Enter`; Entwürfe auf dem Server statt sessionStorage |
| P12 Zahlung erfassen | § 5.2 (Kanalfrage zugunsten der Fachkritik entschieden, E2), Satz statt Link für Mitarbeiter, Primär mit Betrag |
| P13 Leerzustände | in jedem Abschnitt § 3–§ 5, Kennzahlen `0,00 €`; U-05 |
| P14 Fehlerfälle | § 12 Sammeltabelle, § 3.5, § 5.4, § 5.6 |
| P15 Fachkürzel | § 2.5 Glossar, Label-Tabelle, keine ENTW-Nummer; U-02 |
| P16 Mobil | § 3.6 ER-Karte mit Knopf, § 4.1 Karten-Editor ab 768 px, § 3.5 `scroll-padding`; U-20 |
| P17 Kanban Rechnungen | gestrichen; Angebote/ER mit erlaubten Zielen; U-17 |
| P18 Zahlen mehrfach | § 3.1 Zu tun oben, 4 Kennzahlen, keine Heute-Chips; U-17 |
| P19 Rechte inkonsistent | E12, § 2.6; U-18 |
| P20 Barrierefreiheit | Sicherheit als Wort, `<del>` + Text, Anzahlung als Text, Unterschrift-Alternative, `<details>`-Tabellen, ganze Zelle als Inline-Ziel, `scroll-margin` |
| P21 Motion-Token | § 2.9 Tabelle; U-09 |
| Empfehlungen § 2.1–§ 2.8 | „Anzahlung anfordern“-Dialog mit Segment; kein Split-Button; „Anlegen und stellen“ ohne Zusatzmodal; Entwurf statt stillem Löschen; FAGG-Checkbox in den Senden-Dialog; Live-Satz Zahlungsbedingung; Tastatur Tabelle/Peek/Massenlauf; Stripe-Muster für Beträge; Präsentationsmodus mit Knopf und Kennzeichen; Montage-Ablauf nach 10 min; Kartenköpfe einzeilig |
| W1–W15 | als Anfragen an das Fundament (§ 15.2); Faktura folgt den Vorschlägen (Leertaste = Peek, `x` = Auswahl, `Shift+Enter`, 8 s, Toast unten rechts, 03-Dialoggrößen, 04-Dauern, Gemahnt orange/rot) |

**Aus Fachkritik (`21-kritik-fach-faktura.md`):**

| Nr. | Umsetzung |
|---|---|
| R-01/R-02/R-03 Barumsatz | E2, § 2.8, § 5.2, § 5.8, § 9 Montage nur QR; P-01; F-19 |
| R-04 UID nur Unternehmer | § 2.8, § 5.1, Schalter im Entwurf; P-07; F-15/F-23 |
| R-05/R-06 FAGG-Frist, Rücktritt | Schalter `fagg`, § 4.3, § 5.14; P-08/P-13; F-24 |
| R-07 Nachweis Versand/Annahme | § 2.8, § 5.4, § 5.6; P-14; F-35 |
| R-08 Leistungsdatum | E7, § 2.8, § 5.1, § 5.9; P-06; F-01 |
| R-09 späte Rechnung | § 2.8 Warnband; P-09; F-25 |
| R-10 vereinnahmte Anzahlungen | § 5.10, Schalter `restAufloesen`; P-10; F-05/F-26 |
| R-11 Uneinbringlich | Schalter `uneinbringlich`; P-11; F-28 |
| R-12 Skonto | § 5.11, § 5.12, Schalter `differenz`; P-15/P-16; F-29 |
| R-13 Fremdwährung | E9, § 3.5, § 3.6, § 4.1; P-17; F-30 |
| R-14 Ausfuhr/Montage CH | § 5.1, § 3.10, Schalter `ausfuhr`; P-18; F-37 |
| R-15 Mahnspesen-Recht | E8, Schalter `mahnspesen`; P-19 |
| R-16 Aufbewahrung | § 2.8 (kein Löschen, Neu-Rendern begrenzt); P-26 |
| R-17 Datenschutz CSV/Präsentation | E15, § 4.2, § 16.4; P-27; F-32 |
| R-18 Anrede | § 2.5 `{anrede_brief}` |
| R-19 Firmenbuchangaben | § 2.5 Mailsignatur, Anfrage ph_core |
| B-01/B-02 Kassa-Anzahlung, doppelte USt | § 2.8, § 5.3, § 9; P-02; F-20 |
| B-03 Änderbarkeit gestellter Belege | § 2.8, `felder.js`; P-03; F-03/F-21 |
| B-04 Datum/Periodensperre | E7, § 3.9, § 5.1; P-04/P-05; F-22 |
| B-05 Storno Anzahlungsrechnung | § 4.4, § 5.14; P-12; F-27 |
| B-06 Guthaben | Schalter `guthaben`, Überzahlung blockiert; P-21; F-07 |
| B-07 Mahnspesen als Forderung | E8; P-20; F-38 |
| B-08 Teilgutschrift/Retoure | § 4.4, § 5.8; P-22 |
| B-09 Storno + Neuausstellung | § 5.13; P-23; F-36 |
| B-10 Zuordnung lösen | E3 (verzögerter Commit), Schalter `zuordnungLoesen`; P-24 |
| B-11 Anzahlung per Überweisung ohne AR | § 3.5 „Auftrag“, § 5.11; P-24; F-34 |
| B-12/B-13 Gutschein, Verrechnung | E2, § 5.2 |
| B-14/B-15 Export Anzahlung, ER-Steuersätze | P-28; ER-Neu-Sheet mit `ust_aufteilung` |
| B-16 Umsatz Monat | § 7 netto; P-29 |
| B-17 ER nach Export | § 3.6, § 4.4; P-30 |
| B-18 mehrere Teilrechnungen | § 5.9 Zahlungsplan-Zeile; P-31 |
| Fach § 4 (UI ohne Feld) | Schalter § 2.7: Stichtag, Guthaben-Text, UVA-Korrektur, Kleinunternehmer, FAGG, Post-Nachweis, „fällig bei Montage“, Mahnung nur versandt, Ablaufen lassen, Lieferanten-Gutschrift, EUSt, Export-Vorprüfung, Umsatz Monat, Storno-Vermerk |
| Fach § 5 Pflichtprozesse | § 5.14 Rücktritt, § 5.13 Korrektur, § 5.12 Differenz, § 3.9 Monatsabschluss, § 3.10 Ausfuhr, § 3.6 Lieferanten-Gutschrift, § 5.4 Post/Persönlich |
| Fach § 6 Randfälle | 6.1–6.25 abgedeckt über die genannten Abschnitte; 6.6 Schalter `abschlag`; 6.20 UID-Prüfung blockiert; 6.25 Zahlung auf bezahlte Rechnung blockiert |
| Fach § 7 Textkorrekturen | alle übernommen (§ 3.4, § 3.8, § 4.1, § 5.1, § 5.2, § 7, § 9, § 13) |
| Fach § 9 F-19–F-32 | § 13.1 übernommen, ergänzt um F-33–F-38 |
| Fach § 10 StB-Fragen | § 15.4, Go-Live-Sperre E1 |

**Strukturell:** neue Abschnitte Entscheidungen (§ 0), Schalter (§ 2.7), Rechtsregeln (§ 2.8), Motion (§ 2.9), Monatsabschluss (§ 3.9), Ausfuhr (§ 3.10), Fehlerfälle (§ 12), Bauauftrag (§ 16), Gestrichenes (§ 17). Die Sammelliste „fehlt in App“ der Fassung 1 ist in § 15.1 aufgegangen (P-38).
