# Übergabe B-CRM – Bereich CRM im Lounge-Stil (04.11.2026)

Team B-CRM („crm“). Grundlage: `10-konzept-crm.md` (finale Fassung + Bauauftrag § 17), `art-direction/lounge.md`, Entwurf `src/app/entwurf/lounge/` (Anfragen, Kundenakte, Zentrale), Fundament v2 (Shell, Akte, Vorgangsleiste, Kalender, Overlay, Toast/Commit, Register). Mock-Modus :3100, Frappe-Pfad über die echten Signaturen aus `Backend-Import/ph_crm` und `ph_microsoft`.

## 1. Gebaute Routen

| Route | Inhalt |
|---|---|
| `/crm` | Übersicht § 3.1: Seitenkopf mit drei leichten Zahlen, Heute-Zeile (Chips als Filterlinks), Bento: **Zu erledigen** (eine Arbeitsliste, Reihenfolge neu → bestätigen → Protokoll → Termin entfallen → Nachfassen/Aufgaben → Datenschutz-Fristen, je Zeile genau ein Knopf, erledigte klappen zu), **Mein Tag** (aktiver Termin als eingelassene Karte wie Lounge-Zentrale, Folgetermine kompakt), zwei Akzentkacheln (Cognac „Neu seit gestern“, Salbei „Nicht zugeordnete E-Mails“ bzw. „Zu bestätigen“), **Verkaufsverlauf** (nur Leitung/GF, Zeitraum 7/30/90 T.), „Zuletzt im CRM“ |
| `/crm/anfragen` | Liste wie entwurf-lounge „Anfragen“: Segment Neue · Meine · Alle offen · Gewonnen · Verloren & Spam (Leitung) mit Zählern, Pillen-Suche, Art-Filter, Liste/Kanban; Tabelle in schwebender Kachel (Zeile 72, Raumbild/Avatar, Kontaktknöpfe, Eingang mit Wort „wartet/überfällig“, Zuständig-Avatar, Nachfassen am, abgeleiteter Status E1, Aktionsknopf + Menü ⋯), **Vorschau** als schwebende Karte rechts (Bild mit Glas-Chips, Aktionskreise, Wunsch, Fakten, Mini-Vorgang, Primärknopf + Pfeil), Auswahl → Massenaktionen-Kapsel (Annehmen, Mir zuweisen, Spam); Telefon: Karten |
| `/crm/anfragen?ansicht=kanban` | Spalten Neu · Angenommen · Termin vereinbart · Angebot · Gewonnen als eingelassene Flächen, Karten mit nächstem Schritt (siehe § 4 Abweichung Ziehen) |
| `/crm/anfragen/[name]` | Anfrage-Akte: Hero (Raumbild im Mock, sonst Travertin) mit Glas-Kacheln Eingang · Budget-Hinweis · Nächster Termin · Erwartet netto, Glas-Aktionen, Band (max. 1: Status passt nicht › Duplikat › Upload offen), Reiter Übersicht · Anliegen & Uploads · Produkte · Herkunft · Aktivität, **Vorgangsleiste** Anfrage → Termin → Gespräch → Angebot → Auftrag, Empfehlung in Tinte (Annehmen / Termin anlegen / Neuer Termin / Termin öffnen / Angebot öffnen) + Menü, Details-Panel mit Autosave je Feld (gesperrt in Endzuständen für Mitarbeiter), Bezüge mit **Kunde zuordnen** (Vorschläge aus der Dublettenprüfung, „Neu anlegen aus dieser Anfrage“) |
| `/crm/anfragen/neu` | 307 → Liste mit offenem Dialog „Neue Anfrage“ |
| `/crm/kontakte` | Kunden & Kontakte: Segment Kunden · Interessenten · Meine · Architekten & Partner · Firmen · Alle, Suche, Tabelle mit Avatar, Kennzeichen „Widerspruch“/„anonymisiert“, Personen je Firma, Letzter Kontakt relativ, Status; „Neuer Kontakt“ mit Dublettenwarnung („Öffnen“ / „Trotzdem anlegen“) |
| `/kunden/[kontakt]` | **Kundenakte wie entwurf-lounge**: Kopf mit Zurück + Pfad + Kundenkarten-Stufe (sonst Status + „Kunde seit“), Hero mit 4 Glas-Kacheln (Auftragswert/Bezahlt mit Balken nur mit Faktura-Recht, sonst offene Vorgänge/letzter Kontakt; Nächster Termin mit Avatar; Stand der Reise), Glas-Aktionen Anrufen · E-Mail · Termin + Menü ⋯, Band (anonymisiert › Widerspruch › gesperrt › Löschung), 6 Reiter (Übersicht · Aktivität · Vorgänge · Projekte & Belege · Service · Mehr), **Kundenreise** (7 Stufen Anfrage → … → Service, verbundene Karten mit Person/Datum, genau eine aktuelle Karte, „Nächster Schritt“), **Verlauf** (Zeitleiste aus allen Bezügen: Anfragen mit Zitat, Termine, Gespräche, Belege mit PDF-Chip, Kommentare/Mails, Tagesgruppen), Offen jetzt, Gesprächsstand, rechte Spalte **Beträge** (große Zahl, Zahlungsbalken bezahlt/offen, nur Leitung/GF/Faktura), **Größte Positionen**, **Details** (Autosave, Intern nur Leitung/GF), **Bezüge** (Firma/Personen, Projekte, Kundenkarte, Datenschutz). Aktivität mit Filter-Chips (Alles · Gespräche & Mails · Status · Geld · Service · Kommentare) und Composer |
| `/kunden` | 307 → `/crm/kontakte` |
| `/crm/termine` | Kalender (Fundament-Kalender: Woche/Monat/Tag, Ziehen = Verschieben mit Slot-Prüfung, Klick öffnet die Akte, freie Zelle öffnet A1; Datum/Ansicht in der URL) und Liste (Diese Woche · Heute · Zu bestätigen · Meine · Ohne Protokoll) |
| `/crm/termine/[name]` | Termin-Akte: Kopf mit Modus-Pille, Nummer, Countdown „reserviert bis“, Status; Primärknopf je Status (Bestätigen · Protokoll schreiben · Raum öffnen · Verschieben · Protokoll anlegen) + Menü (Ohne Mail bestätigen, Verschieben, Ohne Protokoll abschließen, Nicht erschienen, Wieder bestätigen nur Leitung, Raum erzeugen, Aufgabe, Absagen …); Vorgangsleiste; Reiter Übersicht · Kunde · Website-Buchung (nur Website) · Aktivität |
| `/crm/termine/neu` | Assistent A1 direkt (`?anfrage=` / `?kontakt=` füllen vor) |
| `/crm/gespraeche` | Liste Offen · Schritt fällig · Meine · Alle mit Raum-Pillen, Budget (nur Berater des Gesprächs/Leitung), Vereinbart · bis |
| `/crm/gespraeche/[name]` | **Gesprächsprotokoll fürs iPad**: Abschnittsleiste, Raum-Chips (44 px) legen Raumkarten an (Wunsch, Priorität, Budget brutto, Marken, Maße; Entfernen mit Rückgängig), Summe live, Rahmen, Fragen, Ergebnis (Vereinbart + bis → Aufgabe), Intern nur Leitung; **Autosave 1 s** mit Speicheranzeige und Konfliktprüfung; **Kundenansicht** (blendet Internes aus, Beenden per Langdruck 600 ms); **„Wie geht es weiter?“** (Planung beauftragen mit Pflicht-Kostenwahl + Vertragsort + FAGG-Hinweis · Angebot erstellen · Nur abschließen mit Rückgängig) |
| `/crm/datenschutz`, `/crm/datenschutz/[name]` | Liste Offen · Frist ≤ 7 Tage · Erledigt mit Frist-Wort; Akte mit Schritten Identität · Bearbeiten · Prüfen · Versenden · Abschließen, Aktionen nur Leitung (Ablehnen mit Pflichtgrund) |
| `/datenschutz` | 307 → `/crm/datenschutz` |
| `/crm/berichte` | Anfragen je Woche (Balken, laufende Woche schraffiert), Anteile nach Art/Quelle, Termine nach Modus (ohne verfallene Reservierungen), Termine je Berater, Verlustgründe (Leitung); Mitarbeiter sehen nur eigene Vorgänge |
| `/crm/einstellungen` | Verfügbarkeit (Wochenraster Berater × Tag als Text), Terminarten (aktiv/Website), Automationen (Stand der Schalter aus PH Termin Einstellungen); Bearbeiten über die generischen Formulare (Leitung) |
| `/posteingang` | **E-Mails** (Titel ohne das Wort „Posteingang“): Live-Liste nicht zugeordneter Mails (`ph_microsoft.api.mails_unzugeordnet`) mit Grund-Pille (Adresse unbekannt · Mehrere Kontakte möglich · Vertraulich), Zuordnen-Karte rechts: Vorschläge, Kundensuche, „Adresse dauerhaft merken“ (bei vertraulich gesperrt), Kontakt aus Mail anlegen (409 → Vorschläge), Adresse sperren (Rückfrage); erledigte Mails verschwinden sofort |

Senden-Dialog über `mail_senden` (eigenes Postfach) aus Kundenakte und Anfrage-Akte; bei Widerspruch nur „vertragsbezogen“.

## 2. Dateien

- Seiten: `src/app/crm/**`, `src/app/kunden/**`, `src/app/posteingang/page.js`, `src/app/datenschutz/page.js`
- Komponenten `src/components/Backoffice/Crm/`: `crm.css` (Präfix `bo-crm-`, nur Token), `Teile.js`, `useCrmAktion.js`, `Dialoge.js` (Verloren, Aufgabe, Neue Anfrage, Neuer Kontakt, E-Mail, Absagen, Widerspruch, Datenschutz), `TerminDialoge.js` (A1, Verschieben, Slot-Raster), `AnfragenListe.js`, `AnfragenKanban.js`, `AnfrageTeile.js`, `KundenakteTeile.js`, `Uebersicht.js`, `TerminKalender.js`, `TerminTeile.js`, `Protokoll.js`, `DatenschutzTeile.js`, `MailsListe.js`, `Kopfknoepfe.js`
- Logik `src/lib/backoffice/crm/`: `texte.js`, `status.js`, `vorgang.js`, `zuErledigen.js`, `zeitleiste.js`, `mails.js`, `bilder.js`, `faehigkeiten.js` (rein); `backend.js` (server-only, Mock-Pfad je Methode), `daten.js` (server-only), `actions.js` („use server“)
- Register-Teildateien: `bereiche/crm.js` (Navigation, Routen), `kuerzel/crm.js`, `aufgaben/crm.js`, `freigaben/crm.js` (bewusst leer), `druck/crm.js`, `akte/slots/crm.js` (Auftragsmappe „Kunde & Gespräch“), `mock/seed/crm.js` (Nachlauf v2), `tools/qa/routen/crm.mjs`
- Tests: `tests/unit/crm-logik.test.mjs`, `tests/unit/crm-register.test.mjs`, `tests/e2e/crm-bereich.spec.js`

## 3. Tests

- Unit CRM: **15/15 grün** (Status/Glossar, E1, Vorgangsleiste, Kundenreise, Zeit, Zu erledigen, Zeitleiste, E-Mails Nr. 52, Bilder, Register, Fähigkeiten gegen Backend-Import, Mock-Methoden gegen Controller-Whitelist, Seed-Fälle).
- Gesamt `node --test "tests/unit/**/*.test.mjs"`: **498/502** (Stand 20:30). Rot ist zusätzlich „QA-Routen … feste Seiten“ (`/montage?ansicht=woche`, anderes Team). **Rot durch B-CRM (gewollt, Fundament-Tests beschreiben den Zustand „CRM noch nicht gebaut“)**:
  1. `backoffice-register.test.mjs` „Bereiche: Navigation – Rückfall …“ erwartet für CRM die Rückfall-Navigation (7 Einträge, `nav[1] = /d/ph-anfrage`). CRM hat jetzt eigene Navigation (8 Einträge). → P0-1/L0: Testfall auf einen Bereich ohne Navigation umstellen.
  2. `backoffice-shell.test.mjs` „Hilfe …“ und „Navigation: aktiver Bereich …“ nutzen `/d/ph-anfrage` als CRM-Pfad; mit eigener Navigation zählt `/d/ph-anfrage` nicht mehr zu CRM (die Route leitet ohnehin per 307 auf `/crm/anfragen`). → P0-7: Beispielpfad auf `/crm/anfragen` umstellen.
  - Nicht von B-CRM: „Bereiche: vierzehn Teildateien …“ meldet `faktura: Route für fremden DocType PH Export Lauf / PH UVA Auswertung` (B-FAK).
- ESLint auf allen B-CRM-Dateien: **0 Befunde**.
- E2E `tests/e2e/crm-bereich.spec.js` (8 Tests, desktop): Gesamtlauf 6 grün, 1 flaky (Annehmen-Klick vor Hydration → jetzt `networkidle`), 1 rot (E-Mail-Test wählte eine Mail ohne Vorschlag → Test filtert jetzt „Mehrere Kontakte möglich“; Einzellauf danach grün). Läufe waren durch parallel kompilierende Bereiche (Dev-Server „Compiling …“) zeitweise langsam, die Klick-Navigation in die Kundenakte ist deshalb im Test als direkter Aufruf formuliert.

Fundament-E2E, die `PH Anfrage` als generisches Beispiel nutzen (`backoffice.spec.js`, `backoffice-seitenmuster.spec.js`, `backoffice-shell.spec.js`, `backoffice-motion.spec.js`), laufen als Admin auf `/d/ph-anfrage…` und werden jetzt per 307 nach `/crm/anfragen…` umgeleitet; `/crm` ist keine `BereichStart`-Seite mehr. → Besitzer: auf `?generisch=1` (Admin) oder einen anderen DocType umstellen.

## 4. Abweichungen vom Konzept (Freigabe L0 erbeten)

1. **Rückgängig im Mock:** Frappe-Modus plant Workflow/Methoden als verzögerten Commit (`fundament.methode` / `fundament.workflow`, Mail 10 s). Im Mock wirkt die Aktion sofort, der Toast bietet 8 s „Rückgängig“ (Schnappschuss des Datensatzes, `rueckgaengigAction`). Grund: `commit/aktionen/crm.js` liegt nicht im Schreibbereich und `fundament.methode` hat im Mock keine Wirkung. Vorschlag: eine Zeile in `commit/aktionen/crm.js` („crm.methode“ → `docMethode` aus `crm/backend.js`), dann läuft der Mock genauso verzögert.
2. **Kanban ohne Ziehen:** Der Fundament-Kanban zeigt Spaltentitel aus dem gespeicherten Wert („Qualifiziert“, Glossar verbietet das Wort). Bis er Anzeige-Titel annimmt (Anfrage an P0-5b: Prop `titel` je Spalte), zeigt CRM ein eigenes Board mit „nächster Schritt“-Knopf je Karte. Termine-Kanban entfällt bis dahin (Kalender + Liste vorhanden).
3. **Palette:** Die Schnellaktionen sind im Fundament-Test eingefroren; „> anruf“, „> Termine“, „> Gespräche“, „> Berichte“, „> E-Mails“ fehlen deshalb. „Neue Anfrage“ öffnet weiter das generische Formular (`/d/ph-anfrage/neu`); die CRM-Schnellanlage gibt es in der Liste und unter `/crm/anfragen?neu=1`. → P0-1/L0: Einfrierung lösen, Einträge stehen im Konzept § 17.1.
4. **Kürzel:** Annehmen = **Umschalt+W** statt Umschalt+Q (Umschalt+Q belegt der Register-Test). Weitere Listen-Kürzel weggelassen, weil die Hilfe sonst nur 12 Kürzel zeigt und „Vorschau“ herausfällt (Shell-Test).
5. **Kundenakte-Reiter in der Kopfzeile:** `/kunden/...` gehört für die Shell nicht zu CRM (Pillen-Reiter zeigen die der Zentrale). → P0-7: Pfad-Präfix `/kunden` dem Bereich CRM zuordnen.
6. **Raumbilder:** Im Mock zeigen Anfrage-Vorschau, Anfrage-Akte und Kundenakte ein Sortiments-Raumbild nach Projektart (wie entwurf-lounge). Im Frappe-Modus nur echte Bilder aus dem Datensatz, sonst Travertin-Fläche (`crm/bilder.js`). Siehe Frage 72.
7. Nicht gebaut (Rest Phase A): Telefonnotiz-Dialog, Schnell-Triage, Zusammenführen-Dialog, Portal-Zugang, Rücktritt (Fähigkeit aus, Ersatzweg genannt), Auskunft-Druckseite und Löschvorschläge, Browser-Druckseiten `/druck/crm/*` (Route liegt bei Zentrale), Serien-Dialog, Einstellungen-Diff-Dialog (Bearbeiten über generische Formulare), Hilfe-Artikel `hilfe/crm/*.md` (Ordner nicht im Schreibbereich), Marketing-Übergabe (Fähigkeit nicht erwartet).

## 5. Fähigkeiten-Stand (`crm/faehigkeiten.js`)

| ID | Stand | Grund / Ersatz |
|---|---|---|
| crm.mails, mail-zuordnen, adresse-sperren, kontakt-aus-mail, mail-senden | an (Mock: Probe gegen `ph_microsoft/api`), Frappe: Freigabe durch den Betrieb (schreibende Methoden) | ohne Verbindung: Satz „Outlook ist noch nicht verbunden …“, Knöpfe deaktiviert mit Grund |
| crm.dubletten, crm.slots | an | Frappe: lesend probiert |
| crm.zusammenfuehren, crm.anonymisieren | an für Leitung | Dialoge noch nicht gebaut (Menüpunkt deaktiviert mit Grund) |
| crm.ruecktritt | aus (DocType `PH Ruecktritt` fehlt, Anfrage I4) | Kommentar + Aufgabe an die Faktura |
| crm.kundenakte / zeitleiste (`get_kundenakte`, `get_zeitleiste`) | nicht erwartet | Backoffice setzt Akte und Zeitleiste aus Einzellisten zusammen (E13: Beträge direkt aus ph_faktura) |
| crm.termin-dauer, crm.marketing | nicht erwartet | B7 / Zielgruppen-Übergabe |

## 6. Hinweise für andere Teams

- **Zentrale (B-ZEN):** `zuErledigen(session, client)` aus `lib/backoffice/crm/daten.js` liefert die CRM-Zeilen (Typ, Titel, Wort, genau ein Knopf mit `aktion` oder `href`); die Knöpfe lösen `annehmenAction`, `terminBestaetigenAction`, `protokollSchreibenAction`, `aufgabeStatusAction` aus (`components/Backoffice/Crm/Uebersicht.js` → `ZuErledigen` ist wiederverwendbar).
- **L0 – Importzeilen:** `aufgaben/index.js` (`crm`), `akte/slots/index.js` (`...crm`), `freigaben/index.js` (`crm`, leer).
- **Seed:** CRM-Nachlauf v2 ergänzt nur Felder (nie vorname/nachname/titel der ersten Kontakte) und legt zwei Personen einer Firma sowie Verfügbarkeiten an. Eine schon laufende Mock-Datenbank wird beim ersten CRM-Aufruf einmalig nachgezogen (`crmSeedSicherstellen`).
- **ph_microsoft:** Mock-Pfad für `mails_unzugeordnet` liegt in `crm/backend.js` (B-MAI kann ihn übernehmen).

## 7. Screenshots

`backoffice/qa-screenshots/b-crm/` (Desktop/iPad/iPhone, hell/dunkel, über `tools/qa/shoot.mjs --nur "^/(crm|kunden|posteingang)"`), neben `entwurf-lounge/` gesichtet: Kachelradien, Schatten, Pillen-Reiter, Glas-Kacheln, Kundenreise und Tabellenzeilen entsprechen dem Entwurf.
