# 8x – Übergabe B-FAK „Faktura“ (Lounge)

**Stand:** 04.11.2026 · Team B-FAK · Grundlage: `10-konzept-faktura.md` (Fassung 2 inkl. § 16 Bauauftrag), Fundament v2 (`42-qa-g0.md`, `09-entscheidungslog.md`), Gestaltung ausschließlich `art-direction/lounge.md` (Inhaber Nr. 51/53), Projektnachkalkulation (`51-backend-luecken…` „Kostenzuordnung Eingangsrechnung“).
**Modus:** Mock (Dev-Server :3100, nicht neu gestartet). Kein Commit, kein Paket, keine Änderung in `Backend-Import/`.

## 1. Gebaute Routen (alle unter `backoffice/src/app/faktura/`)

| Route | Typ | Inhalt |
|---|---|---|
| `/faktura` | T1 | Zu tun (≤ 8 Zeilen, je Zeile genau eine Aktion), 4 Kennzahlen je Cockpit (Buchhaltung · Vertrieb), Altersband als Filter, Testbetriebs-Hinweis über Fähigkeit `faktura.echtbelege`, StB → Export |
| `/faktura/angebote` (+`?ansicht=kanban`) | T2/T3 | Reiter Offene · Meine · Läuft bald ab · Gewonnen · Alle, Kanban nur erlaubte Ziele (Annehmen-Dialog, Ablehnen mit Grund + 8 s Undo) |
| `/faktura/angebote/[name]` | T5 | Primär je Zustand, Präsentation über Kundenmodus, Einkauf/Marge nur `NurIntern`, Positionen-Editor im Entwurf (Autosave 1 s), Übernehmen-Dialog (Alternativen, Zahlungsplan = Brutto, Termine) |
| `/faktura/auftraege`, `/[name]`, `/[name]/abrechnen?art=teil|schluss` | T2/T5/Ablauf | Stand-Band (bezahlt · abgerechnet · geliefert + `<dl>`), Blocker Anzahlung, Kassa-Datenfehler als Band, Zahlungsplan, Teil-/Schlussrechnung in Schritten (nur vereinnahmte Anzahlungen, Block bei Rest) |
| `/faktura/rechnungen` (+`?r=offene-posten`), `/[name]` | T2/T5 | Reiter inkl. Offene Posten (Kopfzeile, Altersband, Stichtag als Fähigkeit), Akte mit 5 Reitern, ≤ 1 Band, Belegkette, Summenblock, Pflichtangaben-Prüfer, Zahlung & Mahnung, Steuer & Texte, Verlauf |
| `/faktura/offene-posten` | 307 | → `/faktura/rechnungen?r=offene-posten` |
| `/faktura/gutschriften`, `/[name]` · `/faktura/mahnungen`, `/[name]` | T2/T5 | Drucktitel „Rechnungskorrektur“, Erstatten nur Überweisung; Mahnung Senden/Post/Erledigt (Undo), ohne Gebühr/Zinsen |
| `/faktura/bank`, `/bank/importe` | T2 | Sicherheit als Wort (Pille), Zuordnen = verzögerter Commit 8 s, Enter öffnet nur den Peek, AB-Nummer → „Anzahlungsrechnung stellen und zuordnen“, Sichere zuordnen (n) mit Rückfrage, Ignorieren mit Grund, Import-Sheet (CAMT-Prüfung: unlesbar, doppelt, falsches Konto, CHF) |
| `/faktura/eingangsrechnungen` (+Kanban), `/[name]` | T2/T5 | Reiter inkl. „Kosten offen“, Neu-Sheet (Doppelerfassung, Brutto = Netto + USt, Fremdwährung abgelehnt), **Kostenzuordnung** Ganz · Positionen · Anteilig · Gemeinkosten mit Rundungsrest, Summe/Differenz live, Vorschlag aus Bezug, **Budget-Hinweis** gelb/rot/ohne Budget, Freigabe erst vollständig (Undo 8 s), nach Freigabe nur **Umbuchen** (Leitung, Grund Pflicht, Protokoll alt → neu) |
| `/faktura/zahllauf` | T8 | Freigegebene ER, „Als bezahlt buchen (n)“ mit Rückfrage, SEPA als Fähigkeit (aus), Zahlliste drucken |
| `/faktura/export`, `/[name]` | T2/T5 | Kopfzeile nicht exportiert, Export-Sheet mit automatischer Prüfung + Rückfrage, Lauf-Akte mit Protokoll-Links, Verwerfen |
| `/faktura/uva`, `/[name]` | T8 | Monat-Segment, Bezeichnung vorn, Kennzahl als `abbr`, Berechnen/Übergeben mit Rückfrage |
| `/faktura/abschluss` | T8 | Checkliste (blockiert nicht), „Monat abschließen“ deaktiviert mit Grund (Fähigkeit `monatsabschluss`) |
| `/faktura/ausfuhr` | T2 | nur mit Fähigkeit `ausfuhr` |
| `/faktura/journal` | T2 | Fälschungsschutz gekürzt, „Buchungen auf Veränderung prüfen“ (Leitung) |
| `/faktura/berichte/[report]` | T8 | Übersicht (Umsatz 12 Monate, Donuts mit `<details>`), Anzahlungsstand, Offene Posten, Nummernlücken, Vertrieb, **Projektkosten**, Kassa-Abgleich (Hinweis P-02) – auf `BerichtSeite` |
| `/faktura/stammdaten` | T9 | Zahlungsbedingungen (Live-Satz, 100-%-Prüfung), Bankkonten, Einstellungen, Mahnwesen (kein Mahnlauf-Knopf), Erinnerungen lesend |

## 2. Komponenten und Logik

- `components/Backoffice/Faktura/`: `FakturaSeite` (Shell + Aktions-Host + Seitenkopf), `Aktionen` (ein Host für alle Dialoge und verzögerten Commits), `FakturaListe` (Lounge-Tabelle in Kachel mit Reiter, Filterzeile, Signal, Zeilen-Primäraktion ⇧↵, Auswahl + „n von m möglich“, Peek, Karten < 768 px, drei Leerfälle), `DialogeBeleg` (Stellen, Zahlung, Senden, Gutschrift, Erstatten, Korrigieren, Mahnen-Sheet), `DialogeVorgang` (Ignorieren, Zuordnen, Import, ER-Neu, ER-Aktion, Angebot anlegen, Annehmen mit Unterschrift, Übernehmen, Anzahlung, Rücktritt/Storno als Teilschritte, Export-Sheet), `Kostenzuordnung`, `AbrechnenAblauf`, `AkteTeile` (Primär + ⋯-Menü mit „Leitung bitten“, Positionen-Editor, Unternehmer-Schalter), `EinfacheAkte`, `Kanbans`, `ZuTunListe`, `Bausteine` (Altersband, Stand-Band, Summenblock, Pflichtliste, Positionen), `KopfAktionen`, `RueckfrageKnopf`, `KettePruefen`, `ZahlungsbedingungFormular`, `DruckenKnopf`, `faktura.css` (nur Token).
- `lib/backoffice/faktura/`: `texte`, `status`, `betraege`, `pflichtangaben`, `regeln` (Kanäle, Datumsregeln, Bankanker, Feld-Whitelist, Mahnvorschlag), `kostenzuordnung` (Spiegel von `rechenwerk/kostenzuordnung.py`), `zuTun`, `zeilen`, `listen`, `akte`, `berichte`, `rolle`, `faehigkeiten` (Schalter § 2.7 als Fähigkeiten mit Probe gegen Backend-Import), `daten` (server-only), `actions` („use server“, 40 Actions), `methoden` + `mock-methoden` (fachliche Mock-Wirkung aller ph_faktura-Methoden), `mock-bestand` (spielt den Faktura-Bestand in einen schon laufenden Dev-Prozess nach), `commit-aktionen` (6 verzögerte Commits).
- Register: `bereiche/faktura.js` (Navigation, kanonische Routen → `/d/ph-rechnung/…` leitet um), `kuerzel/faktura.js` (nur Umschalt+Buchstabe), `aufgaben/faktura.js` (5 Zu-tun-Quellen für die Zentrale), `akte/slots/faktura.js` (Belege in Kundenakte und Auftragsmappe), `druck/faktura.js`, `freigaben/faktura.js` (bewusst leer), `mock/seed/faktura.js` (Nachlauf: 12 Angebote, 8 Aufträge, 29 Rechnungen, 4 Gutschriften, 5 Mahnungen, 15 Bankumsätze, 10 ER mit allen Kostenzuordnungs-Fällen, 3 Export-Läufe, 2 UVA, Journal; `anzahl`/`kern` unverändert), `tools/qa/routen/faktura.mjs` (26 Zusatzrouten).

## 3. Tests

| Prüfung | Ergebnis |
|---|---|
| Unit Faktura (`tests/unit/faktura-logik.test.mjs`, `faktura-mock.test.mjs`) | **31 / 31 grün** |
| Unit gesamt (`node --test "tests/unit/**/*.test.mjs"`) | **448 / 451** – 3 rot, nicht Faktura: CRM-Navigation (Register „Übersicht + sechs DocTypes“, Shell „Hilfe … Liste vor global“, „Navigation längster Treffer“); mit leerer Faktura-Kürzel-Datei identisch rot |
| ESLint auf allen B-FAK-Dateien | **0** Fehler, 0 Warnungen |
| E2E `tests/e2e/faktura-kernwege.spec.js` (desktop) | **6 / 6 grün** (Einzelläufe; Stellen-Test braucht einen noch nicht gestellten Beispiel-Entwurf im Dev-Prozess, sonst `skip`). Hinweis: parallel laufende Teams löschen `test-results/` – Lauf mit `--trace=off --output=<eigener Ordner>` |
| Screenshot-Lauf | `qa-screenshots/faktura-lounge/` (41 Routen × 3 Viewports × hell/dunkel = 246) – bei Übergabe 33 Aufnahmen fertig, alle HTTP 200, 0 Befunde im Protokoll; Rest nachholen mit `MSYS_NO_PATHCONV=1 node tools/qa/shoot.mjs qa-screenshots/faktura-lounge --nur "^/faktura"`. Eigene Sichtung Desktop hell/dunkel und iPhone 390: Lounge-Optik wie Entwurf (Tabelle in Kachel, Pillen-Reiter, Material-Leiste, Akte mit Glas-loser Kopfzeile, Fakten-Karten), kein Überlauf, keine Konsolenfehler |

## 4. Abweichungen vom Konzept (Freigabe L0 erbeten)

1. **Commit-Register:** `lib/backoffice/commit/aktionen/faktura.js` steht nicht in der Schreibbereichsliste dieses Auftrags, ist aber laut E-002 Bereichsdatei („Nur dieser Bereich schreibt hier“). Inhalt ist ein einzeiliger Re-Export von `faktura/commit-aktionen.js`. Ohne diese Zeile gäbe es keinen verzögerten Commit für Bank, ER-Freigabe, Ablehnen, Erledigt, Mahnsperre und Zahllauf.
2. **Palette:** `suche/faktura.js` unverändert – der Fundament-Test „Schnellaktionen in alter Reihenfolge“ fixiert die Liste. „Angebot anlegen“ steht als Primäraktion in `/faktura/angebote` (`?panel=angebot`). L0/P0-1 bitte Test lockern, dann Einträge „> zahlung“, „> mahnen“, „> bank“, „> eingangsrechnung“.
3. **Schalter = Fähigkeiten** (MASTER § 3.5): IDs in kebab-case (`faktura.stripe-link` …), umschaltbar über das Cookie `ph_bo_faehigkeiten`. Mit Backend-Probe an: `korrektur-mit-zahlung`, `uneinbringlich`, `post-versand`, `ausfuhr`, `kostenzuordnung`, `umbuchen`, `kette-pruefen`; aus: `stripe-link`, `zuordnung-loesen`, `guthaben`, `differenz`, `mahnspesen`, `fagg`, `monatsabschluss`, `stichtag`, `rest-aufloesen`, `abschlag`, `angebot-ablaufen`, `uva-korrektur`, `sepa`, `echtbelege`.
4. **Listen:** Phase A lädt bis 500 Belege je Liste und blättert im Server (Q-L3 eingehalten, echte Server-Paginierung offen). Gruppierung „Nach Kunde“ im OP-Reiter und Sammel-PDF/Post heute fehlen noch.
5. **Belegkette:** Vorgangsleiste `kompakt mitText` (statt großer Kundenreise-Karte) – ruhiger Kopf in Akten.
6. **Präsentationsmodus** = Kundenmodus des Fundaments (DoD Faktura), kein eigener Sperrmodus.
7. **Mock-Bestand:** `stelleMockBestandSicher` spielt einmal je Prozess nur die Faktura-Tabellen nach, wenn der Dev-Server vor dem Nachlauf gestartet wurde.

## 5. Offene Punkte

- Index-Zeilen eintragen (Besitzer P0-5/L0): `aufgaben/index.js`, `akte/slots/index.js`, `freigaben/index.js` (leer), `druck` (Regeln nur informativ).
- Noch nicht gebaut: Zahlungslink (Schalter), Rest ausbuchen (Schalter), Ausfuhr-Nachweis-Sheet, Massen-Senden mit Teilfehler-Drawer, Sammeldruck, Mobile-Karten-Editor für Positionen < 1024 px, Montage-Baustein `MontageOffenKarte`, Konfliktdialog D6 bei `modified` (Positionen-Editor meldet Konflikt als Text), 2FA beim Monatsabschluss (F8).
- E2E iPad und axe-Lauf für Faktura stehen aus; Klickwege § 1.2 nur teilweise gemessen (Bank, Zahlung, Stellen).
- Frappe-Pfad nicht gegen einen Testmandanten geprüft (keine Verbindung erlaubt); Methodennamen und Argumente aus Backend-Import übernommen.

## 6. Fragen

- Inhaber: Nr. 95–99 in `90-inhaber-fragen.md` (PIN Präsentation, Bargeld Montage, Monat wieder öffnen, Freigabe echter Belege, Budget-Begründung).
- Steuerberatung: Nr. 50–52 in `91-steuerberater-fragen.md` (Drucktitel, Leistungsdatum ohne Quelle, Gemeinkosten im Export).
