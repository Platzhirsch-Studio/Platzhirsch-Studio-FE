# Übergabe B-SOR – Bereich Sortiment (Welle 1, Lounge)

**Stand:** 04.11.2026 · Team B-SOR (Bereichsteam „sortiment“) · Grundlage: `10-konzept-sortiment.md` (finale Fassung, § 20 Bauauftrag), `00-MASTER.md` §§ 2–6, Fundament v2 (`42-qa-g0.md`), Gestaltung ausschließlich `art-direction/lounge.md` + Entwurf `entwurf/lounge` (Inhaber-Entscheidungen Nr. 51/53).
**Dev-Server:** :3100 Mock, nicht neu gestartet. Der fachliche Sortiment-Seed zieht sich in einer laufenden Mock-Datenbank selbst nach (`mockNachzug`, Seed-Version 5).

## 1. Gebaute Routen (alle im `ROUTEN`-Register, `/d/ph-…` leitet mit 307 um)

| Route | Typ | Inhalt |
|---|---|---|
| `/sortiment` | T1 | Seitenkopf mit 3 leichten Zahlen, „Zu tun“ (14 Gruppen aus § 3.1, je Zeile ein sichtbarer Knopf, max. 3 Zeilen + „alle n“), 2 Akzentkacheln (AB ausständig · Wartet auf dich/Wartet auf Veröffentlichung), Einkaufskette als verbundene Stufen, Kennzahlen, Nachbestellen, „+ Neu ▾“, Erstbesuch |
| `/sortiment/produkte` | T2/T3 | Liste (Bild, Status + 2. Merkmal, Preis mit Stand/läuft ab/veraltet, Bildzustand, Seitenblick-Sheet, Auswahl + Massenaktionen als Material-Kapsel, Tastatur ↑↓/J K/X/Leertaste/Enter) · Kacheln · Kanban „Weg zur Veröffentlichung“ (Ziehen + Menü „Verschieben nach …“); Systemansichten mit Zählern, Filter Marke/Kategorie/Welt/Suche in der URL; Schnellanlage-Dialog (`?neu=produkt`) mit Dublettenhinweis, USt/Grundpreis/Händlerstatus live, Web-Adresse |
| `/sortiment/produkte/[slug]` | T5 | Hero (Raumbild bzw. Travertin bei Freistellern) mit 4 Glas-Kacheln (Preis mit Stand, Lieferzeit, Bilder, Website), Band (Händlerwort, Preis veraltet), Reiter Produkt · Preise · Ausführungen · Texte & SEO · Verlauf; rechts „Bereit für Website“-Checkliste + Verknüpfungen (offene Bestellungen); Aktionen: genau eine Primäraktion je Zustand, Rest im Menü (Workflow mit Sperrgrund, Ein-/Ausblenden, Im Shop, Website aktualisieren, Datenblatt), Preis-Sheet erfassen/bestätigen (`?preis=bestaetigen`), Veröffentlichen-Dialog (`?dialog=veroeffentlichen`) |
| `/sortiment/marken`, `/[marke]` | T2/T5 | Liste · Logos; Akte mit Hero, Händlerstatus, Bildfreigabe, Vertrag (Band ab 60 Tagen), Bestellweg; „Bildfreigabe anfordern …“ (Mail, verzögert) |
| `/sortiment/lieferanten`, `/[name]` | T2/T5 | Bestellweg mit Hinweis „Bestell-E-Mail fehlt“ / „GLN fehlt“, offene Bestellungen, Konditionen nur EK-Rollen (`NurIntern`), Betriebsurlaub |
| `/sortiment/bestellungen` | T2/T3 | Segment Alle · Entwurf · Unterwegs · AB klären · Lieferung · Erledigt, Liste/Kanban, AB-Spalte (ausständig mit Tagen, Abweichungen offen), Übermittlungs-Spalte, EK nur Leitung/GF |
| `/sortiment/bestellungen/neu` | Formular | Lieferant, Kommission, Wunschtermin, Lieferadresse, Positionen (Produkt des Lieferanten oder Freitext, Mengen ganzzahlig, EK nur Leitung) |
| `/sortiment/bestellungen/[name]` | T5 | Kopf mit Primäraktion je Zustand (Senden … · AB einlesen · Abweichungen klären · AB bestätigen · Eingang buchen · Abschließen), Bestellkette, Band (ohne Lieferant, AB überfällig, Abweichungen), Reiter **Positionen (AB-Merker je Position)** · **AB-Abgleich** (Grid OK 1 · Rückfrage 2 · Ablehnen 3, Rückfrage-Ziel Hersteller/Verkauf/vermerken) · **Übermittlung (IWOfurn · EDI · CSV: Vorabprüfung, Dateivorschau, Exportdatei erzeugen, Als übermittelt markieren / Eingang bestätigt / Fehler, Protokoll)** · Lieferung · Verlauf; Senden-Sheet mit Mail-Vorschau (verzögert 8 s), Als gesendet markieren, Termin ändern (Grund), AB nachfragen, Stornieren (Entwurf frei, sonst Leitung mit Grund) |
| `/sortiment/bestellungen/[name]/ab` | T6 A10 | AB-Nummer/-Datum/Datei → Werte je Position (leer = nicht bestätigt, „=“, „Alle wie bestellt“), Abweichung live mit den Serverregeln → Ergebnis |
| `/sortiment/bestellvorschlaege` | T2 | Meldebestand-Vorschläge → „n Vorschläge bestellen“ (je Lieferant ein Entwurf, Leitung) · ehrlicher Zustand ohne Leserecht |
| `/sortiment/wareneingang`, `/neu`, `/kiosk`, `/[name]` | T2/T6/T5 | S3: Bestellung finden (Scan/Eingabe, erwartete Lieferungen), Kopf, Positionen mit Stepper (Rest vorbelegt), Zustand-Chips mit Untertitel, Hinweis-Pflicht bei Schaden, Zusammenfassung „bucht n Stück … Status danach …“, Doppelbuchung über Lieferschein; Kiosk-Variante (KioskShell, Kiosk-Dichte, F2/F6); Akte mit „Schaden melden …“ |
| `/sortiment/freigaben` | T2 | Bilder als Grid (Pfeile, X, Leertaste Lightbox, 1/3), Preise (bisher → neu, Δ %), Lieferzeiten; Markenspalte; Leitung entscheidet, verzögerter Commit |
| `/sortiment/preislisten`, `/neu`, `/[name]` | T2/T6 A11 | Rahmen → Lauf mit Chips (Alle · Über Schwelle · Ohne Produkt · Erster Preis · Wird übernommen), Zeilen-Schalter, Übernehmen (Leitung, Bestätigung + verzögert) |
| `/sortiment/kategorien`, `/merkmale` | T9 | USt-Satz (offen = Sperre), Grundpreispflicht; Merkmale mit Farbe |
| `/sortiment/berichte` | T8 | 4 Kennzahlen, Bestellungen je Monat (Bezugsmonat Tinte, laufender schraffiert), nach Schritt, Produkte je Marke, Termintreue je Lieferant |
| `/sortiment/einstellungen` | T9 | Website, Preise, AB-Toleranzen, eigene GLN (Prüfziffer), Standard-Lieferadresse; Leitung speichert, Team liest |
| `/sortiment/import` | T6 | Katalog-Import (Leitung/Admin) hinter Fähigkeit, im Testmodus gesperrt mit Satz |

`loading.js` mit Skeletons in Kachelform (Start, Produkte, Bestellungen, Wareneingang, Marken, Lieferanten, Freigaben).

## 2. Code

- **Logik (rein, unit-getestet):** `lib/backoffice/sortiment/regeln.js` (Checkliste, gültig bis mit Monatsende, Preiszustand, Tiefstpreis 30 Tage, brutto/netto, Sperrgründe je Rolle, Vorprüfung, Löschen nur Entwurf, EAN, Slug/Web-Adresse, Händlerwörter, Restmengen, Mengenabgleich, AB-Abgleich wie `logik/abgleich.py`, Bewertungsrechte, Bestell-Sperrgründe/Primäraktion/Kette, Vorschlagsmenge), `uebermittlung.js` (CSV/IWOfurn/EDI-ORDERS wie `logik/uebermittlung.py`, GLN, Übermittlungsschritte, AB-Merker), `berichte.js`, `status.js`, `texte.js` (Glossar § 2, alle Texte), `rollen.js` (Leitung, EK-Sicht, `ohneIntern`), `faehigkeiten.js`.
- **Daten/Aktionen:** `daten.js` (server-only, Feldlisten, Q-L3), `methoden.js` (Frappe-Methoden exakt mit Argumenten + Mock-Pfad), `actions.js` („use server“, je Action Sitzung + DocType-Recht + Rolle + Validierung, nie werfen), Commit-Aktionen `commit/aktionen/sortiment.js` (10 Aktionen: Produkt-Workflow, Sichtbarkeit, Preis, Freigabe, Senden, Übermittlung, Klären, AB nachfragen, Bildfreigabe anfordern, Preisliste übernehmen).
- **Komponenten:** `components/Backoffice/Sortiment/` (Bausteine, ProduktListe, ProduktKanban, Schnellanlage, WorkflowDialog, ProduktAktionen + PreisSheet, BestellAktionen, AbgleichTabelle, Uebermittlung, AbAssistent, BestellFormular, WareneingangAssistent, SchadenMelden, FreigabeSchreibtisch, MarkeAktionen, VorschlaegeListe, PreislisteLauf, PreislisteNeu, EinstellungenFormular, ZuTunListe, NeuMenue, FilterForm, Skelett, SlotBestellungen, `useAktion`, `sortiment.css` mit Präfix `bo-sor-`, nur Token).
- **Register (Teildateien):** `bereiche/sortiment.js` (Navigation 14 Einträge, 8 Routen), `suche/sortiment.js` (Nummernmuster; Schnellaktionen + Hilfe vorbereitet), `kuerzel/sortiment.js` (9 Einträge, Liste/Akte/Kiosk-Packtisch F2/F6; nur gebundene Tasten), `aufgaben/sortiment.js` (5 Quellen), `freigaben/sortiment.js` (Art `sortiment.preis`), `druck/sortiment.js`, `akte/slots/sortiment.js` (2 Slots), `mock/seed/sortiment.js` (Nachlauf), `tools/qa/routen/sortiment.mjs` (28 feste Seiten).

## 3. Tests

- Unit: `tests/unit/sortiment-regeln.test.mjs`, `sortiment-uebermittlung.test.mjs`, `sortiment-methoden.test.mjs` – **32/32 grün**. Gesamtlauf siehe § 7.
- E2E: `tests/e2e/sortiment-bereich.spec.js` (8 Tests, desktop) – Ergebnis siehe § 7.
- ESLint auf allen B-SOR-Dateien: **0 Fehler, 0 Warnungen**.
- Screenshots: `backoffice/qa-screenshots/b-sor-sortiment/` (Desktop/iPad/iPhone × hell/dunkel) + eigene Sichtung neben `entwurf-lounge/2-anfragen`, `3-kundenakte`, `1-zentrale`.

## 4. Fähigkeiten (G-04) und „bis dahin“-Verhalten

| ID | Stand (Mock/Probe) | Verhalten |
|---|---|---|
| `sortiment.exportieren`, `.uebermittlung`, `.ab-merker` | an (Backend vorhanden) | IWOfurn/EDI/CSV-Export, Übermittlung, AB-Merker |
| `sortiment.storno` (AS18), `.rest-stornieren` (AS19), `.strecke` (AS23), `.ruecksendung` (AS20) | aus | Menüpunkt gesperrt mit Satz („Noch nicht verfügbar – Leitung bitten“), Strecke-Primärknopf gesperrt mit Grund |
| `sortiment.preisbasis` (AS5), `.tiefstpreis` (AS24), `.ust-saetze` (AS8) | aus | Preisliste: Hinweis statt Feld; Tiefstpreis in der Oberfläche berechnet; USt-Klasse normal/ermäßigt, „ermäßigt“ = Satz offen = Sperre |
| `sortiment.katalogimport` | an (Probe), im Mock gesperrt | Import nur gegen Frappe |
| `sortiment.vorschlaege` | Leserecht fehlt | Seite erklärt den Zustand, Bestellung von Hand als Ausweg |

## 5. Abweichungen vom Konzept (Freigabe L0 erbeten)

1. **Unternavigation als Pillen-Reiter der Shell** (Lounge, Nr. 51/53) statt Tabs mit Unterstrich (§ 3.0, E9) – Lounge gilt vor 03/02.
2. **Workflow-Übergänge „Zur Veröffentlichung geben“/„Zurück auf Entwurf“ ebenfalls als verzögerter Commit** (MASTER Q-C3) statt „sofort + Undo“ (§ 7).
3. **Bestellvorschläge** als eigene Route im Sortiment (Auftrag „Meldebestand/Bestellvorschläge“); Daten bleiben ph_logistik.
4. **Wareneingang-Kiosk** als Route `/sortiment/wareneingang/kiosk` (KioskShell) – Einhängen in `(kiosk)/packtisch` bleibt beim Logistik-Bauauftrag (Kachel „Wareneingang“ → diese Route).
5. **Schnellaktionen der Palette und Hilfe-Artikel vorbereitet, aber nicht aktiv** (`suche/sortiment.js` exportiert `SCHNELLAKTIONEN`, `HILFE_ARTIKEL`): `backoffice-register.test.mjs` friert die P0-1-Liste ein und würde rot. L0/P0-1: Schnappschuss auf Bereichseinträge umstellen, dann `schnellaktionen: SCHNELLAKTIONEN`.
6. Lieferant ist beim Anlegen Pflicht (Pflichtfeld im DocType); „Bestellung ohne Lieferant“ entsteht nur aus Faktura (`ignore_mandatory`) und wird in „Zu tun“ gezeigt.

## 6. Für andere Bereiche / L0 (Stub statt Warten)

- **Import-Zeilen in die Index-Register** (nur L0/P0): `aufgaben/index.js` → `sortiment`, `freigaben/index.js` → `sortiment`, `akte/slots/index.js` → `...sortiment`.
- **Logistik:** Packtisch-Kachel „Wareneingang“ auf `/sortiment/wareneingang/kiosk`; **Leserecht `PH Bestellvorschlag`/`PH Meldebestand` für PH Sortiment Mitarbeiter/Leitung** fehlt in ph_logistik (Backend-Anfrage); `bestellungen_aus_vorschlaegen` erlaubt heute nur Logistik-Leitung/Admin.
- **Seed:** Der Sortiment-Nachlauf füllt offene `PH Bestellvorschlag` ohne Produkt mit Lagerartikeln (falls der Logistik-Seed sie leer lässt).
- **Commit-Teildatei** `commit/aktionen/sortiment.js` beschrieben (laut Kopfzeile Bereichsdatei).

## 7. Prüfergebnisse (Abschluss)

| Prüfung | Ergebnis |
|---|---|
| Unit Sortiment (`tests/unit/sortiment-*.test.mjs`) | **32/32 grün** |
| Unit gesamt (`node --test "tests/unit/**/*.test.mjs"`) | 473/477 – die 4 roten gehören anderen Teams (Register-Schnappschuss CRM-Navigation, Faktura-Routen „PH Export Lauf/UVA Auswertung“, Faktura-Kürzel Umschalt+P/K in „akte“, Hilfe/Navigation-Schnappschuss); keiner betrifft Sortiment |
| ESLint (alle B-SOR-Dateien inkl. Tests, QA-Routen) | 0 Fehler, 0 Warnungen |
| E2E `tests/e2e/sortiment-bereich.spec.js` desktop | **8/8 grün** |
| E2E iPad (WebKit) | 7 grün + 1 im Wiederholungslauf grün (Schnellanlage, Kompilierzeit des Dev-Servers) |
| Screenshots `qa-screenshots/b-sor-sortiment` | 42 Routen × 3 Viewports × hell/dunkel = **252 Aufnahmen**; Befunde (Kacheln-Überlauf im Kartenfuß, Kiosk-Kontext am iPhone, 1 Hydrationshinweis) behoben, Nachlauf `qa-screenshots/b-sor-sortiment-nachlauf` 18 Aufnahmen **0 Befunde** |
| Sichtung | neben `entwurf-lounge/1-zentrale`, `2-anfragen`, `3-kundenakte` gelegt (hell, dunkel, iPhone): Tabelle in Kachel mit Bild je Zeile, Hero mit 2×2-Glas-Kacheln, Pillen-Reiter, Akzentkacheln Cognac/Salbei, verbundene Stufen, keine Rahmen/Versalien |

## 8. Offene Punkte

- Massenaktionen Kategorie/Welt setzen, Datenblatt-Sammeldruck, eigene Ansichten speichern (§ 3.2) – nicht gebaut.
- Ausführungen-Assistent S2, Bild-Upload/Reihenfolge, Texte bearbeiten (Formular) – Akte zeigt lesend; Bearbeiten über das generische Formular (`/d/ph-produkt/<name>?generisch=1`, Admin).
- Bildfreigabe der Marke erfassen (S4, Beleg-Upload) und Nachtrag/Storno-Dialoge hinter Fähigkeiten nur als gesperrte Menüpunkte.
- Rollen-E2E (Team ohne Leitung, Projekte nur lesen): es gibt keinen Demo-Benutzer „nur PH Sortiment Mitarbeiter“; Rollenregeln sind unit-getestet.
- **Befund Fundament (P0-5a):** `AkteKopf` bricht Betrag und Aktionen am Telefon nicht um (Container neben dem Titel ohne `flex-wrap`) – im Sortiment über `className="bo-sor-kopf"` gelöst, gehört in `Akte/akte.css` für alle Akten.
- axe- und Screenreader-Durchlauf für den Bereich (Q4), Budget-Messung (P0-9).
- 4 rote Unit-Tests im Gesamtlauf gehören anderen Teams (CRM-Navigation, Faktura-Routen, Hilfe-/Navigations-Schnappschuss) – keiner betrifft Sortiment.

## 9. Neue Fragen

Inhaber: 90-inhaber-fragen.md Nr. 68–71 · Steuerberater/Recht: 91-steuerberater-fragen.md Nr. 36–37.
