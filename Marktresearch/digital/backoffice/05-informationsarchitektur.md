# 05 – Informationsarchitektur und Objektmodell des Backoffice

**Zweck:** Verbindliche Karte des eigenen Next.js-Backoffice (`backoffice/`, Port 3100) über alle 12 Frappe-Apps `ph_*`: Routen und Seitentypen, Objekt-Lebenszyklen über Bereichsgrenzen, Akte-Konzept, globale Suche, Benachrichtigungen, Rechte-Sichtbarkeit, Datenladestrategie, Offline-Kassa, Druck/PDF, Fehlerbehandlung, Performance-Budgets. Grundlage für alle Fachbereichs-Agenten (PLAN-NEXT-BACKOFFICE.md §9) und für die UX/UI-Dateien 01–04/06+.
**Stand:** 2026-11-04. Quellen: `Backend-Import/*/README.md` (12 Apps), `Backend-Import/CONVENTIONS.md`, `Backend-Import/referenz/VORBILD-SHD-sauter-held-2026-11-03.md`, `Marktresearch/digital/backoffice/PLAN-NEXT-BACKOFFICE.md`, Fundament `backoffice/src` (bereiche.js, rechte.js, suche.js, errors.js, client.js, UI-Kit-README), DocType-JSONs (autoname, title_field, search_fields, status, links, Tabs).
**Regeln:** Frappe bleibt unsichtbar (Datenschicht). Ein Login, dann Arbeitsplatz. Beträge Cent, Datum de-AT, Texte ohne Superlative. Nichts hier ändert `backoffice/` oder `Backend-Import/` – es beschreibt, was dort gebaut wird.

---

## 0. Leitsätze der Architektur (10 Sätze)

1. **Objekte statt Module.** Mitarbeiter denken in Kunde, Auftrag, Lieferung, Reklamation – nicht in Apps. Die Seitenleiste zeigt Bereiche, aber jede Seite führt per Bezug in die Akte des Objekts.
2. **Zwei Akten tragen alles:** die **Kundenakte** (PH Kontakt) und die **Auftragsmappe** (PH Projekt). Jedes Dokument (Angebot, AB, Rechnung, Lieferschein, Montage, Servicefall, Kundenkarte) ist von dort aus erreichbar und zeigt zurück.
3. **Ein Lebenszyklus, viele Dokumente.** Der Weg Anfrage → … → Service ist eine Kette von Zuständen mit klar benannten Übergabepunkten (§3). Jeder Übergabepunkt hat genau eine Primäraktion in der UI.
4. **Neun Seitentypen** (§2) mit festen Bauplänen; neue Seiten wählen einen Typ, erfinden keinen.
5. **Server lädt, Client bedient.** Server Components holen Daten (Streaming je Block), Client-Komponenten übernehmen Tabelle, Kanban, Formular, Kiosk. Mutationen nur als Server Actions (`{ok, code, message}`).
6. **Rechte dreifach:** Navigation (`darf`), DocType (`darfDoc` aus meta.permissions), Frappe selbst (Benutzer-`sid`). Die UI zeigt nie etwas, das der Server ablehnen würde; der Server prüft trotzdem.
7. **Suche ist der zweite Einstieg** (⌘K/Strg+K): Nummernmuster, Namen, Aktionen, Navigation – überall, auch im Kiosk.
8. **Kiosk = dieselbe App, anderer Rahmen.** Kassa, Packtisch, Montage, Technik laufen ohne Seitenleiste, Touch ≥ 48 px, Tastenkürzel, Scanner, Gerätebindung, Bedienerwechsel per PIN.
9. **Fehler sind Zustände, keine Unfälle.** Jeder der sieben Fehlercodes hat ein festes UI-Muster (§11); keine Seite endet als 500.
10. **Mock-Modus bleibt Pflicht.** Jede Route läuft ohne Frappe (Seed-Daten), damit Abnahmen ohne Staging möglich sind.

---

## 1. Navigationsmodell: Arbeitsplatz → Bereich → Objekt → Akte

```
Login (/login) ── 2FA (OTP) ──► Gerät registriert? ──ja──► Arbeitsplatz des Geräts (Kiosk)
                                     │ nein
                                     ▼
                              /arbeitsplatz  (Kacheln nach Rollen, genau 1 erlaubt → direkt)
        ┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
   Backoffice        Kassa         Packtisch     Montage mobil   Technik mobil
   (Shell)         (Kiosk)         (Kiosk)         (Kiosk)         (Kiosk)
        │
   Seitenleiste: Zentrale · CRM · Projekte · Faktura · Shop · Sortiment · Logistik · Service ·
                 Kundenkarte · Marketing · Personal · Kassa (Verwaltung) · [Einstellungen]
        │
   Bereichsstart (Dashboard) → Unternavigation (Pills) → Liste/Kanban/Kalender → Akte/Detail
        │                                                      ▲
        └── ⌘K Suche ──────────────────────────────────────────┘  (springt direkt in Akte/Detail)
```

**Shell-Elemente (Backoffice-Arbeitsplatz):**

| Element | Inhalt | Verhalten |
|---|---|---|
| Seitenleiste (links, 240 px, einklappbar 56 px) | Wortmarke PLATZHIRSCH (Bodoni Moda), Bereiche nach `sichtbareBereiche(session)`, Badge mit offener Zahl je Bereich (z. B. CRM: Anfragen „Neu“), unten Benutzer-Menü | Zustand (ein-/ausgeklappt) in `localStorage`; aktiver Bereich hervorgehoben (`--color-bo-nav-active`); Tastatur: `g` dann Buchstabe (g c = CRM, g p = Projekte, g f = Faktura, g s = Shop, g l = Logistik, g v = Service, g k = Kundenkarte, g z = Zentrale) |
| Kopfzeile (56 px) | Brotkrumen · Suchfeld (öffnet Palette) · Glocke · Schnellanlage „+“ · Arbeitsplatz-Umschalter · Testmodus-Band darunter | Suchfeld fokussiert mit `/` oder ⌘K; „+“ öffnet Menü der `SCHNELLAKTIONEN` nach Recht |
| Unternavigation (Pills unter dem Seitenkopf) | Seiten des Bereichs (§2.4) | horizontal scrollbar am iPad, aktiv unterstrichen 2 px Sand |
| Inhalt | Seitentyp-Baukasten | max. Breite 1440 px, `breit` für Tabellen/Kanban |
| Rechte Spalte (Akte/Detail, 320 px, ab 1280 px sichtbar, darunter Tab „Bezüge“) | Bezüge, nächste Schritte, Zeitleiste | sticky |

**Reihenfolge der Bereiche** (Nutzung im Tagesgeschäft, nicht App-Nummer): Zentrale, CRM, Projekte, Faktura, Shop, Sortiment, Logistik, Service, Kundenkarte, Marketing, Personal, Kassa-Verwaltung. `bereiche.js` ordnet heute nach App-Nummer – Anpassung der Reihenfolge ist eine Zeile (Fundament-Agent).

---

## 2. Seitentypen (neun Baupläne)

Jede Route hat genau einen Typ. Typ bestimmt Layout, Ladeverhalten, Leer-/Fehlerzustand, Tastenkürzel.

| # | Typ | Zweck | Bausteine (UI-Kit) | Laden | Leer-Zustand | Kürzel |
|---|---|---|---|---|---|---|
| T1 | **Dashboard** (Zentrale, Bereichsstart) | Kennzahlen, Heute-Leiste, offene Arbeit, Charts | `Kennzahl`, `Charts`, Aufgabenliste, Aktivitätsstrom | Server, jede Kachel eigener `<Suspense>` mit Skeleton; Reihenfolge: Heute-Leiste → Kennzahlen → Listen → Charts | Kachel „Noch nichts offen“ mit Primäraktion | `r` = neu laden |
| T2 | **Liste** | Tabelle mit Filter, Sortierung, Spaltenwahl, Massenaktionen, CSV | `Seitenkopf`, `Filterleiste`, `DataTable` | Server-paginiert (25/50/100), URL = Zustand (`?status=&von=&bis=&q=&sort=&r=&seite=`) | Illustration-frei: Titelzeile „Keine <Objekte> für diese Filter“, Knopf „Filter zurücksetzen“, Primäraktion „Neu…“ | `n` neu, `f` Filter-Fokus, `↑↓ Enter` Zeile, `x` auswählen, `e` CSV (mit Recht) |
| T3 | **Kanban** | Status-Spalten mit Drag & Drop, Workflow-gebunden | `Kanban` | Server lädt ≤ 200 Karten je Spalte, mehr per „weitere laden“ | Spalte: „Keine Karten“ (ausgegraut), Board: wie Liste | `←→` Spalte, `↑↓` Karte, `m` Verschieben-Menü, `Enter` öffnen |
| T4 | **Kalender** | Woche/Monat/Tag, mehrere Quellen, Drag zum Umplanen | `Kalender` (neu, §14) | Server lädt Zeitraum, Quellen parallel | Tageszellen leer, Leiste „Keine Termine in dieser Woche“ | `t` heute, `w/m/d` Ansicht, `←→` Zeitraum, `n` neuer Eintrag |
| T5 | **Akte / Detail** | Ein Objekt vollständig: Kopf mit Status/Phasen, Tabs, rechte Spalte | `Seitenkopf`, `WorkflowLeiste`, `Formular` (Tab „Daten“), Bezugskarten, `Zeitleiste` | Kopf + erster Tab sofort, übrige Tabs lazy, rechte Spalte gestreamt | Tab-Leerzustände je Bezug („Noch kein Angebot – Angebot erstellen“) | `e` bearbeiten, `s`/⌘S speichern, `Esc` abbrechen, `p` drucken, `1–9` Tabs, `.` Aktionsmenü |
| T6 | **Assistent** | Mehrschrittige Aktion mit Vorschau und Bestätigung (Angebot→AB, Anzahlung, Teilrechnung, Etikett, Tagesabschluss, Bankzuordnung, Import, Export) | `Assistent` (neu): Schrittleiste, Inhalt, Fußzeile Zurück/Weiter/Ausführen | Schritt 1 Server-vorbefüllt, Folgeschritte Client, Ausführen = eine Server Action (idempotent) | – (Assistent hat immer Kontext) | `Enter` weiter, `Esc` abbrechen (Rückfrage ab Schritt 2) |
| T7 | **Kiosk** | Vollbild-Arbeitsplatz | `KioskShell` + Fach-Komponenten | Client-schwer, Startdaten Server, danach Server Actions | Startkarte „Bereit“ mit großem Scanfeld | je Arbeitsplatz (§4.11–4.14) |
| T8 | **Report** | Auswertung mit Filtern, Tabelle, Chart, Export | `Seitenkopf`, Filterformular, `DataTable` (ohne Paging), `Charts` | `getReport(name, filters)` serverseitig, Zeitlimit 8 s, danach Hinweis „Zeitraum eingrenzen“ | „Keine Daten im Zeitraum“ | `e` Export |
| T9 | **Einstellungen** | Single-DocTypes, Stammdaten-Listen, Benutzer/Rollen, Geräte | `Formular` (Single), kleine Listen | Server | – | ⌘S |

**Gemeinsam für alle Typen:** `requireSession()` zuerst; `Fehler`-Komponente statt 500; `loading.js` mit typgerechtem Skeleton; Fokusring; Seitentitel `<Objekt> · <Bereich> · Platzhirsch Backoffice`.

### 2.1 Baupläne als ASCII

**T2 Liste**
```
┌ Brotkrumen: Zentrale › CRM › Anfragen                               [+ Neue Anfrage] ┐
│ Anfragen                                             Kanban | Liste | Kalender (Tabs) │
├ [Neu 12] [Qualifiziert 4] [Termin 3] [Angebot 2] … | von ▭ bis ▭ | 🔍 Suche | ⋯ Spalten ┤
│ ☐ Nummer        Titel                    Art        Eingang ↓    Zuständig   Status    │
│ ☐ PH-ANF-26-0123 Küche Lochau, Fam. M.   Beratung   heute 09:12  A. Berger   ● Neu     │
│ …                                                                                     │
├ 25 von 312 · Seite 1 2 3 … 13 · [25|50|100]                            [CSV] (Recht) ┤
└ Auswahl (3): [Zuweisen ▾] [Status ▾] [Als Spam]                                       ┘
```

**T5 Akte / Detail**
```
┌ Zentrale › Faktura › Rechnungen › RE-2026-00042                                        ┐
│ RE-2026-00042 · Fam. Muster · 12.480,00 €        ● Gestellt   [Zahlung erfassen] [⋯]  │
│ Entwurf ─● Gestellt ─○ Teilbezahlt ─○ Bezahlt            (Phasenleiste, Endzustände grau)│
├ Tabs: Übersicht | Positionen | Anzahlungen & Zahlung | Steuer | Mahnung | Texte | Verlauf ┤
│                                                             ║ BEZÜGE                   │
│  (Tab-Inhalt: Formular-Abschnitte, Kindtabellen,            ║ Kunde  Fam. Muster → Akte │
│   Summenblock rechtsbündig, Beträge tabellarisch)           ║ Auftrag AB-2026-00017     │
│                                                             ║ Projekt PH-PRJ-26-0009    │
│                                                             ║ Zahlungen 2 · offen 6.240 │
│                                                             ║ NÄCHSTE SCHRITTE          │
│                                                             ║ ▸ Zahlung erfassen        │
│                                                             ║ ▸ Zahlungslink senden     │
│                                                             ║ ZEITLEISTE                │
│                                                             ║ 09:12 gestellt (A. Berger)│
└─────────────────────────────────────────────────────────────╨───────────────────────────┘
```

### 2.2 Zustände einer Seite (für jede Route gleich)

`laden` (Skeleton, max. 400 ms bevor sichtbar) → `bereit` | `leer` | `fehler:<code>` | `kein-zugriff` | `nicht-gefunden`. Übergang laden→bereit: Inhalt blendet 120 ms ein (opacity, `cubic-bezier(0.2,0,0,1)`), kein Layout-Sprung (Skeleton hat Zielhöhe).

---

## 3. Sitemap (vollständig)

Konvention: sprechende Routen je Bereich; die generischen Routen `/d/[doctype]`, `/d/[doctype]/[name]` und `/d/[doctype]/neu` des Fundaments bleiben als Rückfall für alle nicht einzeln gebauten DocTypes und als Ziel der Suche, solange ein Bereich seine Seite noch nicht hat. Eine Tabelle `ROUTEN` (in `bereiche.js`) bildet DocType → kanonische Route ab; `/d/<slug>/<name>` leitet dorthin um (307), sobald eine kanonische Route registriert ist.

Spalten: Route · Typ (§2) · DocType/Quelle · Rollen (Mindestrecht) · Besonderheit.

### 3.1 Zugang und Rahmen

| Route | Typ | Quelle | Rollen | Besonderheit |
|---|---|---|---|---|
| `/login` | Formular | Frappe `login`, 2FA-Schritt | alle | Rate-Limit 5/10 min; Demo-Zugänge nur Mock |
| `/arbeitsplatz` | Kachelwahl | `erlaubteArbeitsplaetze` | alle | Cookie `ph_bo_arbeitsplatz`; genau 1 Arbeitsplatz → Redirect |
| `/wechsel` | Formular | Benutzer des Standorts + PIN | Kiosk | Idle 15 min |
| `/geraet` | T9 | PH Geraet (Anfrage an ph_core) | Admin, Leitung | Gerätetoken-Cookie 1 Jahr |
| `/kein-zugriff`, `/not-found` | Hinweis | – | alle | Erklärung + Rückweg + „Zugriff anfragen“ (legt PH Aufgabe an Admin an) |

### 3.2 Zentrale (`ph_core`, Slug `zentrale`)

| Route | Typ | Quelle | Rollen | Besonderheit |
|---|---|---|---|---|
| `/` | T1 | Kennzahlen aller Bereiche nach Recht (`dashboard.js`), PH Aufgabe (eigene), Aktivität (`ph_core.api.aktivitaet`, Anfrage) | alle | Heute-Leiste (§7.4) ganz oben |
| `/aufgaben` | T2 + T3 | PH Aufgabe | alle (eigene), Leitung (alle) | Filter „Meine / Team / Alle“; Dynamic Link öffnet Akte |
| `/aufgaben/[name]` | T5 | PH Aufgabe | wie oben | |
| `/aktivitaet` | Liste (Strom) | Versionen/Kommentare über DocTypes | Leitung, GF | Filter Bereich/Person/Tag |
| `/einstellungen` | T9 | PH Einstellungen, PH Firma, Betriebsruhe | Admin | Schlüsselregister nur Namen |
| `/einstellungen/nummernkreise` | T9 | `NUMMERNKREISE` (lesend) | Admin | Anzeige der Serien |
| `/benutzer`, `/benutzer/[name]` | T9 | User, Rollenprofile, PIN setzen (Methode, Anfrage ph_core) | Admin | Rollen als Gruppen „Verkauf, Einkauf, Shop und Kassa …“ |
| `/geraete` | T9 | PH Geraet | Admin | |
| `/protokoll` | T2 | PH API Protokoll, Fehlerprotokoll | Admin | |
| `/suche?q=` | Liste | wie Palette, als volle Seite | alle | Rückfall ohne JS |

### 3.3 CRM (`ph_crm`)

| Route | Typ | Quelle | Rollen | Besonderheit |
|---|---|---|---|---|
| `/crm` | T1 | 8 Number Cards des Workspaces, 6 Charts, Kanban-Kurzansicht Anfragen „Neu“ | CRM * | |
| `/crm/anfragen` (+ `?ansicht=kanban`) | T2/T3 | PH Anfrage | CRM * | Kanban-Spalten Neu·Qualifiziert·Termin vereinbart·Angebot; Endzustände per Filter |
| `/crm/anfragen/neu` | Formular | PH Anfrage | CRM * | |
| `/crm/anfragen/[name]` | T5 | PH Anfrage (+ Uploads, Merkliste) | CRM * | Aktionen: Kontakt anlegen · Termin anlegen (Assistent A1) · Aufgabe · Projekt anlegen · Spam |
| `/crm/kontakte` | T2 | PH Kontakt | CRM * | Zeile öffnet Kundenakte |
| `/kunden/[kontakt]` | **T5 Kundenakte** (§5.1) | PH Kontakt + alle Bezüge | CRM *, lesend alle Bereiche, die den Kontakt sehen | kanonische Adresse jeder Person/Firma; `/crm/kontakte/[name]` → 307 |
| `/kunden/[kontakt]/dsgvo` | T8 | Report PH Kontakt Datenauskunft + Druck | CRM Leitung | Art. 15 |
| `/crm/termine` (+ `?ansicht=kalender|kanban`) | T4/T3/T2 | PH Termin | CRM * | Kalender Standard; Quellen: Termine, optional Montagen/Einsätze einblenden |
| `/crm/termine/neu` | Assistent A1 | PH Termin (freie Zeiten aus `get_freie_slots`) | CRM * | Schritte: Kontakt → Terminart/Modus → Zeit (Slot-Raster 30 min) → Bestätigung |
| `/crm/termine/[name]` | T5 | PH Termin | CRM * | Bestätigen · Absagen · Umbuchen · Meet-Link · Erledigt+Protokoll · Nicht erschienen; Reservierungs-Countdown im Kopf |
| `/crm/gespraeche`, `/crm/gespraeche/[name]` | T2/T5 | PH Beratungsgespraech | CRM * | Räume/Wünsche/Budget; „Planung beauftragen“ → Projekt |
| `/crm/verfuegbarkeit` | T4 (Wochenplan) | PH Verfuegbarkeit, PH Terminart, PH Termin Einstellungen | CRM Leitung | Berater × Wochentag Raster |
| `/crm/berichte/[report]` | T8 | Anfragen nach Quelle, Reaktionszeiten, Termine je Berater, Vertriebscockpit | CRM *, GF | |

### 3.4 Projekte (`ph_projekte`)

| Route | Typ | Quelle | Rollen | Besonderheit |
|---|---|---|---|---|
| `/projekte` (+ `?ansicht=kanban`) | T2/T3 | PH Projekt (Phase = status) | Projekte *, Montage (lesend) | Kanban Phasen Anfrage…Übergabe |
| `/projekte/neu` | Formular | PH Projekt | Projekte * | aus Anfrage/Gespräch vorbefüllt (`?anfrage=`) |
| `/projekte/[projekt]` | **T5 Auftragsmappe** (§5.2) | `ph_projekte.api.auftragsmappe` + Nachlader | Projekte *, Montage, Techniker (lesend), Faktura/Logistik (lesend) | Tabs §5.2 |
| `/projekte/[projekt]/planung/[name]` | T5 | PH Planung | Projekte * | Versionen, „Kunden vorlegen“ |
| `/projekte/[projekt]/renderings/[name]` | T5 (Bildansicht mit Pins) | PH Rendering + Feedback | Projekte * | Pins 0–100 %, Antworten, Sprachnotiz-Player |
| `/projekte/[projekt]/dokumente` | T2 (Kacheln) | PH Projekt Dokument | Projekte * | Portal-Freigabe-Schalter je Datei |
| `/projekte/[projekt]/nachrichten` | Faden | PH Projekt Nachricht | Projekte * | ungelesen-Zähler |
| `/projekte/[projekt]/tagebuch` | Galerie | PH Tagebuch Foto | Projekte *, Montage | Phasenfilter |
| `/projekte/montagen` (+ `?ansicht=kalender|kanban`) | T4/T3/T2 | PH Montageauftrag | Projekte *, Montage | Kalender Team-Zeilen |
| `/projekte/montagen/[name]` | T5 | PH Montageauftrag | Projekte *, Montage | Bericht de/en/fr/it, Fotos, Unterschrift, Mängel → Servicefall |
| `/projekte/abnahmen/[name]` | T5 | PH Abnahme | Projekte *, Montage | Positionen ok/Mangel/Nacharbeit, zwei Unterschriften |
| `/projekte/fremdgewerke` | T2/T3 | PH Fremdgewerk | Projekte * | |
| `/projekte/aufgaben`, `/projekte/zeiten` | T3 / T2 | PH Projekt Aufgabe, PH Projektzeit | Projekte * | Zeit buchen aus jeder Projektseite (`.` → „Zeit buchen“) |
| `/projekte/produktpaesse/[name]` | T5 | PH Produktpass | Projekte *, Service (lesend) | QR, Druck A5 |
| `/projekte/referenzen` | T2/T3 | PH Referenz | Projekte Leitung, Marketing (lesend) | Einwilligungsnachweis |
| `/projekte/berichte/[report]` | T8 | Projektstatus, Offene Mängel, Montagekapazität, Zeiten, Liefertermine 30 Tage | Projekte *, GF | |

### 3.5 Faktura (`ph_faktura`)

| Route | Typ | Quelle | Rollen | Besonderheit |
|---|---|---|---|---|
| `/faktura` | T1 | 12 Number Cards (Euro aus `kennzahlen.py`), Charts, OP-Alter | Faktura *, Buchhaltung extern | Cockpit-Umschalter „Buchhaltung / Vertrieb“ |
| `/faktura/angebote` (+ kanban) | T2/T3 | PH Angebot | Faktura *, CRM (lesend eigene Kontakte) | |
| `/faktura/angebote/neu` | Assistent A2 | PH Angebot | Faktura * | Schritte: Kunde/Projekt → Positionen (Produktsuche mit Bild, Freitext, Alternativ) → Konditionen → Vorschau PDF → Speichern/Senden |
| `/faktura/angebote/[name]` | T5 | PH Angebot | Faktura * | Senden · Als AB übernehmen (A3) · Neue Version · Anzahlungslink |
| `/faktura/auftraege` | T2 | PH Auftragsbestaetigung | Faktura *, Projekte/Logistik (lesend) | Spalten: Stand Anzahlung Soll/Ist, geliefert, offen |
| `/faktura/auftraege/[name]` | T5 | PH Auftragsbestaetigung | Faktura * | Anzahlungsrechnung · Teilrechnung (A4) · Schlussrechnung · Herstellerbestellungen erzeugen (A5) · Lieferschein erzeugen (A6) · Lieferung melden · Stornieren (Leitung) |
| `/faktura/rechnungen` (+ kanban) | T2/T3 | PH Rechnung | Faktura *, Buchhaltung extern | Standardfilter „offen“; Mahnstufe als Badge |
| `/faktura/rechnungen/[name]` | T5 | PH Rechnung | Faktura * | Stellen (primär, Rückfrage: Nummer wird vergeben) · Zahlung erfassen · Zahlungslink · Mahnen · Gutschrift · Uneinbringlich (Leitung) |
| `/faktura/gutschriften/[name]`, `/faktura/mahnungen` | T5/T2 | PH Gutschrift, PH Mahnung | Faktura * | Mahnlauf-Vorschlag als Assistent A7 |
| `/faktura/eingangsrechnungen` (+ kanban) | T2/T3 | PH Eingangsrechnung | Faktura * | Freigeben nur Leitung; Zahllauf-Vorschlag |
| `/faktura/bank` | T2 (zweigeteilt) | PH Bankumsatz, PH Bankimport | Faktura Leitung | links offene Umsätze, rechts Vorschlag (Score 100/80/60/40) → Assistent A8 „Zuordnen“ |
| `/faktura/export` | T2 + Assistent A9 | PH Export Lauf | Faktura Leitung | Erzeugen → Protokoll → Übergeben → Bestätigt |
| `/faktura/uva` | T8 + Assistent | PH UVA Auswertung | Faktura Leitung | |
| `/faktura/stammdaten` | T9 | Zahlungsbedingung, Bankkonto, Faktura-/Mahnwesen-Einstellungen | Faktura Leitung | |
| `/faktura/berichte/[report]` | T8 | Offene Posten, Anzahlungsstand, UVA-Zuarbeit, OSS, Nummernlücken, Umsatz nach Marke (Marge Leitung), Vertriebscockpit, Export-Abgleich, Zahllauf, Mahnvorschlag | Faktura *, GF, Buchhaltung extern | |

### 3.6 Shop (`ph_shop`)

| Route | Typ | Quelle | Rollen | Besonderheit |
|---|---|---|---|---|
| `/shop` | T1 | Cards/Charts | Shop * | Stripe-Fehler-Kachel rot ab 1 |
| `/shop/bestellungen` (+ kanban) | T2/T3 | PH Bestellung (Website-Statuswerte) | Shop *, Logistik (lesend) | Spalten bezahlt·versandbereit·abholbereit·versendet; `pruefen` als eigener Filter rot |
| `/shop/bestellungen/[name]` | T5 | PH Bestellung | Shop * | Zahlung erfassen · Gutschein einlösen · Abholbereit · Packen (→ Lieferschein) · Versendet · Rechnung erstellen · Widerruf · Stornieren & erstatten (Leitung) |
| `/shop/zahlungen`, `/shop/zahlungen/[name]` | T2/T5 | PH Zahlung | Shop *, Faktura (lesend) | Rückerstatten (Vier-Augen ≥ Grenze → GF-Freigabe-Zustand) |
| `/shop/gutscheine`, `/shop/gutscheine/[name]` | T2/T5 | PH Gutschein, PH Gutschein Bestellung | Shop * | Code nie im Klartext außer bei Ausgabe |
| `/shop/anzahlungen` | T2 | PH Anzahlung | Shop *, Faktura | Zahlungslink senden |
| `/shop/widerrufe`, `/shop/retouren` (+ kanban) | T2/T3/T5 | PH Widerruf, PH Retoure | Shop * | 14-Tage-Frist als Ampel |
| `/shop/stripe` | T2 | PH Stripe Ereignis, PH Stripe Auszahlung | Shop Leitung, Faktura Leitung | Erneut verarbeiten · Abgleichen |
| `/shop/einstellungen` | T9 | Shop-/Stripe-Einstellungen, Rechtstexte-Stand | Shop Leitung | |
| `/shop/berichte/[report]` | T8 | Umsatz, USt-Satz, Gutschein-Bestand, Rückerstattungen, Stripe-Abgleich, Bestellungen ohne Rechnung | Shop *, GF | |

### 3.7 Sortiment (`ph_sortiment`)

| Route | Typ | Quelle | Rollen | Besonderheit |
|---|---|---|---|---|
| `/sortiment` | T1 | 6 Cards, 4 Charts | Sortiment * | |
| `/sortiment/produkte` (+ kanban, + Kachelansicht) | T2/T3 | PH Produkt | Sortiment *, Faktura/Kassa (lesend für Suche) | Bildspalte, Preisstand-Warnung (älter 3/6 Monate) |
| `/sortiment/produkte/[slug]` | T5 | PH Produkt (8 Tabs der DocType) | Sortiment * | Preis mit Stand · Ausführung · Website-Cache erneuern · Vorschau · Duplizieren · Ausstellungsstück |
| `/sortiment/marken`, `/sortiment/marken/[marke]` | T2/T5 | PH Marke | Sortiment * | Händlerstatus/Claims prüfen, Bildfreigabe; Vertrag permlevel 1 |
| `/sortiment/kategorien`, `/sortiment/merkmale`, `/sortiment/lieferanten` | T9/T2 | PH Kategorie, PH Merkmal, PH Lieferant | Sortiment * | |
| `/sortiment/bestellungen` (+ kanban) | T2/T3 | PH Herstellerbestellung | Sortiment *, Faktura/Projekte (lesend) | Spalten Entwurf·Gesendet·AB erhalten·AB geprüft·Teilgeliefert |
| `/sortiment/bestellungen/[name]` | T5 | PH Herstellerbestellung | Sortiment * | Senden (PDF) · AB einlesen (A10) · AB-Abgleich (Soll/Ist-Tabelle mit Bewertung) · Wareneingang anlegen |
| `/sortiment/wareneingang/[name]` | T5 (auch am Packtisch) | PH Wareneingang | Sortiment *, Logistik * | Fotos, Zustand, Reklamation → Servicefall |
| `/sortiment/preislisten` | T2 + Assistent A11 | PH Preisliste Import | Sortiment Leitung | Hochladen → Prüfen (Abweichungen > Schwelle rot) → Übernehmen |
| `/sortiment/berichte/[report]` | T8 | Preisstand, ohne Bildfreigabe, Bestellungen offen, AB-Abweichungen, Claims, Liefertermintreue | Sortiment *, GF | |

### 3.8 Logistik (`ph_logistik`)

| Route | Typ | Quelle | Rollen | Besonderheit |
|---|---|---|---|---|
| `/logistik` | T1 | 7 Cards, 5 Charts | Logistik * | Kachel „Zum Packtisch“ (öffnet Kiosk) |
| `/logistik/lieferscheine` (+ kanban) | T2/T3 | PH Lieferschein | Logistik *, Faktura/Projekte (lesend) | |
| `/logistik/lieferscheine/[name]` | T5 | PH Lieferschein | Logistik * | Packtisch öffnen · Pakete vorschlagen · Etikett (A12) · Übergeben · Zugestellt (Unterschrift) · Teilrechnung erstellen · Produktpässe |
| `/logistik/sendungen`, `/logistik/sendungen/[name]` | T2/T5 | PH Sendung | Logistik * | Tracking-Verlauf, Retourenlabel, Problem |
| `/logistik/touren` (+ kalender) | T2/T4/T3 | PH Tour | Logistik *, Montage (lesend) | Stopps sortieren (Drag), Karte-Link |
| `/logistik/touren/[name]` | T5 | PH Tour | Logistik * | Freigeben (Leitung), Tourenblatt |
| `/logistik/bestand` | T2 (gruppiert nach Lagerort) | PH Lagerbestand | Logistik *, Sortiment (lesend) | Umlagern · Reservieren · Ausbuchen · Etikett 62×29 |
| `/logistik/bewegungen` | T2 | PH Lagerbewegung | Logistik * | Journal, Storno = Gegenbuchung |
| `/logistik/inventur`, `/logistik/inventur/[name]` | T2 / Assistent A13 | PH Inventur | Logistik * (Freigabe Leitung) | Zählliste → Zählen (Scan) → Differenzen → Freigeben |
| `/logistik/stammdaten` | T9 | Lagerorte, Fahrzeuge, Paketprofile, Einstellungen | Logistik Leitung | |
| `/logistik/berichte/[report]` | T8 | Versandkosten, Laufzeiten, Zustellprobleme, Bestandsliste, Ausstellungsstücke, Inventurdifferenzen, Touren-Auslastung | Logistik *, GF | |

### 3.9 Service (`ph_service`)

| Route | Typ | Quelle | Rollen | Besonderheit |
|---|---|---|---|---|
| `/service` | T1 | 8 Cards, 4 Charts, Fristen-Ampel-Liste | Service *, Techniker | |
| `/service/faelle` (+ kanban) | T2/T3 | PH Servicefall | Service *, Techniker (lesend) | Spalten Gemeldet·Geprüft·Entscheidung·In Bearbeitung·Einsatz geplant·Erledigt |
| `/service/faelle/neu` | Formular | PH Servicefall | Service * | `?aus=<DocType>:<name>` (Montage, Abnahme, Wareneingang, Lieferschein) vorbefüllt |
| `/service/faelle/[name]` | T5 | PH Servicefall (7 Tabs) | Service *, Techniker (ohne Kosten) | Fristen-Ampel im Kopf; Einsatz planen (A14) · Ersatzteile bestellen · Kunde/Lieferant informieren · Regress · Gutschrift/Kulanz · Erledigt+Bericht · Abnahme · Ablehnen/Wieder öffnen (Leitung) |
| `/service/einsaetze` (+ kalender, „Meine Einsätze“) | T4/T3/T2 | PH Serviceeinsatz | Service *, Techniker | |
| `/service/einsaetze/[name]` | T5 | PH Serviceeinsatz | Service *, Techniker | Statusknöpfe, Fotos, Unterschrift, Ersatzteilverbrauch |
| `/service/auftraege` (+ kanban) | T2/T3/T5 | PH Serviceauftrag | Service * | Winterlager/Pflege: Übernahmeliste |
| `/service/pflege-abos`, `/service/pflege-abos/[name]` | T2/T5 | PH Pflege Abo | Service * | nächster Termin, Protokolle |
| `/service/ersatzteile`, `/service/ersatzteile/[name]` | T2/T5 | PH Ersatzteil (+ Bewegungen) | Service * | unter Mindestbestand rot |
| `/service/ersatzteilbestellungen/[name]` | T5 | PH Ersatzteilbestellung | Service * | |
| `/service/regress` | T2/T5 | PH Lieferantenregress | Service Leitung | Frist § 933b als Ampel |
| `/service/fehlerkatalog` | T9 (Baum) | PH Fehlerbereich → PH Fehlercode | Service Leitung | |
| `/service/berichte/[report]` | T8 | Reklamationsquote je Marke, Fehlercode-Statistik, Regressstatus, Servicekosten, Gewährleistungsfristen | Service *, GF | |

### 3.10 Kundenkarte (`ph_kundenkarte`)

| Route | Typ | Quelle | Rollen | Besonderheit |
|---|---|---|---|---|
| `/kundenkarte` | T1 | 3 Cards, 3 Charts | Kundenkarte * | |
| `/kundenkarte/antraege` (+ kanban) | T2/T3 | PH Kundenkarte Antrag | Kundenkarte * | Spalten Neu·Bestätigt; Annehmen (Kontakt wählen/anlegen) · Ablehnen · Doppelt |
| `/kundenkarte/karten`, `/kundenkarte/karten/[kartennummer]` | T2/T5 | PH Kundenkarte | Kundenkarte *, Kassa (Lookup) | Vorteil einlösen · Umsatz neu berechnen (nur mit Einwilligung) · Wallet-Pass · Sperren/Entsperren (Leitung) · Kündigen; Druck Karte/Begrüßung |
| `/kundenkarte/einloesungen` | T2 | PH Kundenkarte Einloesung | Kundenkarte * | Storno am selben Tag |
| `/kundenkarte/stufen`, `/kundenkarte/vorteile` | T9 | Stufen, Vorteile | Kundenkarte Leitung | Textvalidierung (keine Euro-/Prozentangaben) |
| `/kundenkarte/berichte/[report]` | T8 | Kundenwert (nur mit Einwilligung), Stufenwechsel, Vorteile-Nutzung, ohne Einkauf 12 Monate | Kundenkarte Leitung, GF | |

### 3.11 Marketing (`ph_marketing`)

| Route | Typ | Quelle | Rollen | Besonderheit |
|---|---|---|---|---|
| `/marketing` | T1 | 6 Cards, 5 Charts | Marketing * | |
| `/marketing/newsletter` (+ kanban), `/marketing/newsletter/[name]` | T2/T3/T5 (Block-Editor) | PH Newsletter Ausgabe (+ Blöcke, Versand) | Marketing * (Freigabe Leitung) | Blöcke sortierbar, Vorschau, Testversand, Zielgruppe; Versandprotokoll-Tab |
| `/marketing/abos`, `/marketing/einwilligungen` | T2 | PH Newsletter Abo, PH Einwilligung | Marketing * | Nachweis-PDF; Auskunft Art. 15 |
| `/marketing/events` (+ kanban), `/marketing/events/[name]` | T2/T3/T5 | PH Event (+ Anmeldungen, Warteliste) | Marketing * | Teilnehmerliste/Namensschilder drucken |
| `/marketing/kampagnen` (+ kanban), `/marketing/kampagnen/[name]` | T2/T3/T5 | PH Kampagne | Marketing * | Kennzahlen, Bericht |
| `/marketing/kundenreisen`, `/marketing/kundenreisen/[name]` | T2/T5 | PH Kundenreise (+ Trigger, Versand) | Marketing Leitung | Regel-Editor Auslöser → Wartezeit → Vorlage; Rechtsgrundlage Pflicht |
| `/marketing/social` (+ kalender, kanban) | T4/T3/T5 | PH Social Beitrag | Marketing * | Claim-Guard-Hinweis; Bildquelle Pflicht vor Freigabe |
| `/marketing/empfehlungen` | T2 | PH Empfehlung | Marketing * | |
| `/marketing/vorlagen` | T9 | PH Mail Vorlage | Marketing Leitung | |
| `/marketing/einblicke` | T8 | PH Einblick Tag | Marketing *, GF | Top-Seiten |
| `/marketing/einstellungen` | T9 | Marketing Einstellungen (Kanzlei-Schalter) | Marketing Leitung | |

### 3.12 Personal (`ph_personal`)

| Route | Typ | Quelle | Rollen | Besonderheit |
|---|---|---|---|---|
| `/personal` | T1 | 6 Cards, 5 Charts; Selbstservice-Sicht: nur „Meine Zeiten / Mein Urlaub“ | Personal *, Selbstservice (reduziert) | Backoffice-Admin ohne Bewerbungen |
| `/personal/stellen`, `/personal/stellen/[slug]` | T2/T5 | PH Stelle (Tabs DE/EN/FR/IT/Entgelt) | Personal * (Aktiv nur Leitung) | GlBG-Prüfung im Kopf (Entgelt vollständig?) |
| `/personal/bewerbungen` (+ kanban je Stelle), `/personal/bewerbungen/[name]` | T2/T3/T5 | PH Bewerbung | Personal * (Bewertung Leitung) | Löschfrist-Countdown |
| `/personal/gespraeche` | T4/T2 | PH Bewerbungsgespraech | Personal * | |
| `/personal/mitarbeiter`, `/personal/mitarbeiter/[name]` | T2/T5 | PH Mitarbeiter | Personal * (Vertraulich permlevel 1) | |
| `/personal/zeiten` | T2 + Stempeluhr | PH Zeiterfassung | Selbstservice (eigene), Leitung (alle) | Kommen/Gehen-Knopf groß; Monatsübersicht |
| `/personal/abwesenheiten` (+ kalender Team) | T4/T2 | PH Abwesenheit | Selbstservice (eigene), Leitung | Genehmigen nur Leitung, nie selbst |
| `/personal/berichte/[report]` | T8 | Bewerbungsstatistik, Löschfristen, Monatsstunden, Abwesenheiten | Personal Leitung | |

### 3.13 Kassa-Verwaltung (`ph_kassa`, Backoffice-Teil)

| Route | Typ | Quelle | Rollen | Besonderheit |
|---|---|---|---|---|
| `/kassa/verwaltung` | T1 | Cards (Heute kassiert, Belege heute, offene Abschlüsse, Differenz Monat, Terminals offline) | Kassa *, Buchhaltung extern | Knopf „Kassa öffnen“ (Kiosk) |
| `/kassa/verwaltung/belege`, `/kassa/verwaltung/belege/[name]` | T2/T5 (nur lesen) | PH Kassenbeleg | Kassa *, Buchhaltung extern | Nachdruck, E-Mail, Storno (Leitung) – nie bearbeiten |
| `/kassa/verwaltung/abschluesse`, `/…/abschluesse/[name]` | T2 / Assistent A15 | PH Kassenabschluss | Kassa * (Abschließen Leitung) | Zählprotokoll 500 € … 1 ct |
| `/kassa/verwaltung/kassenbuch` | T2 | PH Kassenbuch | Kassa * | Einlage/Entnahme |
| `/kassa/verwaltung/kassen`, `/…/kassen/[id]` | T9/T5 | PH Kasse, PH Signatureinheit, Checkliste | Kassa Leitung, Admin | Startbeleg, Nullbeleg, Kette prüfen, DEP exportieren |
| `/kassa/verwaltung/terminals` | T9 | PH Terminal | Kassa Leitung | Status abfragen |
| `/kassa/verwaltung/ereignisse` | T2 | PH Kassa Ereignis | Kassa Leitung | Ausfälle, Meldepflicht > 48 h rot |
| `/kassa/verwaltung/dep` | T2 | PH DEP Export | Kassa Leitung, Buchhaltung extern | |
| `/kassa/verwaltung/berichte/[report]` | T8 | Kassenbuch, Tagesumsatz je Zahlart, Umsatz nach Steuersatz, Anzahlungen Kassa, Gutscheinbewegungen, Differenzen, Belege je Mitarbeiter (Leitung) | | |

### 3.14 Kiosk-Arbeitsplätze (`(kiosk)`-Gruppe, `KioskShell`)

| Route | Typ | Quelle | Rollen | Kern |
|---|---|---|---|---|
| `/kassa` | T7 | `ph_kassa.rksv.api.*`, Produkte, Kontakte, AB/Rechnung/Bestellung offen, Gutschein prüfen, Kundenkarte lookup | Kassa * | drei Spalten (Kunde/Auftrag · Positionen · Summe/Zahlarten); Kürzel F2 Kunde · F3 Produkt · F4 Freitext · F6 Anzahlung · F7 Gutschein · F8 Bar · F9 Karte · F10 Überweisung · F12 Buchen · Esc neuer Beleg · Strg+P Nachdruck |
| `/kassa/display?kasse=` | Kundendisplay | Realtime-Kanal `ph_kassa_display_<kasse>` (über SSE-Proxy §9.6) | Gerät | zweites Fenster/Tablet |
| `/packtisch` | T7 | Lieferscheine offen, bezahlte Bestellungen ohne Lieferschein, Wareneingänge offen, Touren heute | Logistik * | Kacheln → Pack-Ansicht: Scanfeld (EAN/Seriennr/Slug/QR), Abhaken, Pakete, Etikett, Übergabe mit Unterschrift/Abholcode; Kürzel F2 Scan-Fokus · F3 nächster Lieferschein · F5 Paket hinzufügen · F8 Etikett · F12 Gepackt · Strg+P |
| `/montage` | T7 (mobil) | Montageaufträge heute/Woche je Team, Tour-Stopps | Montage, Projekte * | Liste → Auftrag: Unterlagen, Fotos vorher/nachher, Leistungen abhaken, Mängel, Bericht, Unterschrift, Abnahme; Navigation-Link; Zeit buchen |
| `/technik` | T7 (mobil) | Serviceeinsätze des Technikers, Ersatzteile im Fahrzeug | Techniker, Service * | Unterwegs → Starten → Bericht → Unterschrift; Ersatzteilverbrauch; Folgeeinsatz |
| `/tour` | T7 (mobil) | PH Tour des Tages | Montage, Logistik * | Stopps in Reihenfolge, Anrufen, Zugestellt mit Unterschrift, km-Stand (Teil des Montage-Kiosks, eigener Tab) |

### 3.15 Querschnitt

| Route | Zweck |
|---|---|
| `/druck/[doctype]/[name]` (+ `?format=`) | HTML-Vorschau des Frappe-Druckformats, Knopf Drucken/PDF |
| `/druck/[doctype]/[name]/pdf` | PDF-Stream (§10) |
| `/api/suche?q=` | Palette (Server) |
| `/api/link?doctype=&q=` | Link-Feld-Suche |
| `/api/datei?url=` | private Datei streamen (Rechteprüfung) |
| `/api/ping` | Verbindungsstatus Kiosk |
| `/api/ereignisse` | SSE-Strom Benachrichtigungen (§7) |
| `/api/revalidate` | Frappe-Webhook → Cache-Tags (§9) |
| `/api/kassa/puffer` | Offline-Puffer einspielen (§8) |

---

## 4. Objektmodell und Lebenszyklus über Bereichsgrenzen

### 4.1 Objektlandkarte (wer zeigt auf wen)

```
PH Kontakt ◄────────────────────────────────────────────────────────────────────────┐
   ▲  ▲  ▲  ▲  ▲                                                                   │
   │  │  │  │  └── PH Kundenkarte (kontakt)  ◄── PH Kundenkarte Antrag              │
   │  │  │  └───── PH Servicefall (kontakt, projekt, auftrag, bestellung, rechnung,  │
   │  │  │             lieferschein, wareneingang, produktpass, montageauftrag)      │
   │  │  └──────── PH Bestellung (kontakt) ──► PH Zahlung ──► PH Rechnung (Barverkauf)│
   │  └─────────── PH Termin (kontakt, anfrage) ──► PH Beratungsgespraech            │
   └────────────── PH Anfrage (kontakt) ──► PH Projekt (kontakt, anfrage)            │
                                              │                                      │
                      ┌───────────────────────┴──────────────────────────┐           │
                      ▼                                                  ▼           │
               PH Angebot (projekt, kontakt) ──► PH Auftragsbestaetigung (projekt, angebot)
                                                   │        │        │        │
                        ┌──────────────────────────┘        │        │        └── PH Zahlungsplan (Kind)
                        ▼                                   ▼        ▼
              PH Herstellerbestellung (bezug=AB)   PH Rechnung (auftrag)   PH Lieferschein (auftrag|bestellung)
                        │                                   ▲                  │          │
                        ▼                                   │                  ▼          ▼
              PH Wareneingang (herstellerbestellung)   PH Zahlung (bezug)   PH Sendung   PH Tour (Stopps)
                                                        ▲   ▲                  
              PH Kassenbeleg (auftrag|rechnung|bestellung) ─┘   PH Anzahlung (ph_faktura_auftrag)
              
              PH Montageauftrag (projekt, kontakt, termin) ──► PH Abnahme (projekt, montageauftrag)
                                                                   │ Mängel
              PH Produktpass (projekt, kontakt, montageauftrag)    ▼
                     ▲                                        PH Servicefall ──► PH Serviceeinsatz ──► PH Lieferantenregress
              aus PH Lieferschein (create_product_passes)                    └──► PH Ersatzteilbestellung
```

Regeln: Links **nur abwärts in Installationsreihenfolge** (ph_core → crm → sortiment → projekte → shop → faktura → logistik → personal → marketing → kassa → service → kundenkarte); Rückwärtsbezüge sind Custom Fields (`ph_<app>_*`) oder Dynamic Links. Die UI kennt beide Richtungen über die **Bezugs-Registry** (§5.3) und baut daraus Bezugskarten – nie über Annahmen im Markup.

### 4.2 Zustandsdiagramm des Hauptflusses (Text)

Notation: `[Objekt]` · `Zustand` · `──(Aktion, Rolle)──►` · `⇒ erzeugt/ändert`. Zustände sind die `status`-Werte der DocType-JSONs.

```
[PH Anfrage]  Neu ──(Qualifizieren, CRM)──► Qualifiziert ──(Termin anlegen, A1)──► Termin vereinbart
              ──(Angebot/Projekt anlegen)──► Angebot ──► Gewonnen | Verloren ; Neu ──► Spam
              ⇒ „Kontakt anlegen“ findet/erzeugt [PH Kontakt] Interessent

[PH Termin]   Unbestaetigt ──(Bestätigen | Website-DOI)──► Bestaetigt ──(Erledigt + Protokoll)──► Erledigt
              ──► Nicht erschienen ; ──(Absagen)──► Storniert ; ──(Ablehnen, Leitung | 24 h nach reserviert_bis)──► Abgelehnt
              ⇒ Erledigt erzeugt [PH Beratungsgespraech] Offen

[PH Beratungsgespraech] Offen ──(Planung beauftragen)──► Planung beauftragt ⇒ [PH Projekt] Planung
              ──(Angebot)──► Angebot ──► Abgeschlossen

[PH Projekt]  Anfrage ──► Planung ──► Angebot ──► Auftrag ──► Bestellung ──► Lieferung ──► Montage ──► Uebergabe ──► Abgeschlossen
              (Beauftragen/Abschließen/Abbrechen/Zurück nur Leitung; Abgebrochen von überall)
              Phasenwechsel werden von Belegen ausgelöst (unten „⇒ Projektphase“), manuell nur Leitung.

[PH Planung]  Entwurf ──(Kunden vorlegen)──► vorgelegt ──(Freigeben)──► freigegeben | verworfen ; Neue Version
[PH Rendering] Entwurf ──► Vorgelegt ──► Feedback offen ──► Freigegeben | Verworfen (Freigabe durch Mitarbeiter nur mit Kundenfreigabe)

[PH Angebot]  Entwurf ──(Senden: PDF+Mail)──► Gesendet ──(Annehmen | Als AB übernehmen, A3)──► Angenommen
              ──► Abgelehnt | Abgelaufen (Scheduler 06:00) ; ──(Neue Version)──► Ersetzt
              ⇒ Projektphase Angebot ; Angenommen ⇒ [PH Auftragsbestaetigung] Offen + Zahlungsplan
              ⇒ [PH Kontakt] Interessent → Kunde (als_kunde_markieren bei erster AB)

[PH Auftragsbestaetigung] Offen ──(Herstellerbestellungen erzeugen, A5)──► In Bestellung
              ──(Lieferung melden / Lieferschein verlässt Gepackt)──► Teilgeliefert ──► Geliefert
              ──(Schlussrechnung gestellt)──► Abgerechnet ; ──(Stornieren, Leitung)──► Storniert
              ⇒ Projektphase Auftrag → Bestellung → Lieferung
              ⇒ Anzahlungsrechnung automatisch (anzahlung_automatisch) = [PH Rechnung] Art Anzahlung

[PH Rechnung] Entwurf (ENTW-…) ──(Stellen: Pflichtangaben, Nummer RE- lückenlos, submit, Journal, PDF fixiert)──► Gestellt
              ──(Zahlung: PH Zahlung on_submit)──► Teilbezahlt ──► Bezahlt
              ──(Scheduler 06:00)──► Ueberfaellig ──(Mahnen/Mahnlauf)──► Gemahnt (Mahnstufe 1–3)
              ──(Gutschrift Storno)──► Storniert (kein Cancel) ; ──(Leitung)──► Uneinbringlich
              Anzahlungsrechnung: ust_faelligkeit „nicht faellig“ → „faellig“ mit erster Zahlung

[Anzahlung kassieren – drei Wege, ein Ergebnis]
   Kassa: [PH Kassenbeleg] Standard mit Position „Anzahlung auf Auftrag“ ⇒ on_submit ⇒ ph_shop.zahlung.buche ⇒ [PH Zahlung] Bezahlt
          ⇒ ph_faktura.kassa.kassenbeleg_gebucht ⇒ Zahlungsplan-Zeile Ist, OP der Anzahlungsrechnung, AB-Stand
   Stripe-Link: [PH Anzahlung] offen ──(Link senden)──► zahlung_ausstehend ──(Webhook checkout.session.completed)──► bezahlt
          ⇒ [PH Zahlung] Bezahlt ⇒ doc_events → Rechnung/AB-Stand ; doppelt ⇒ „Doppelte Zahlung erstatten“
   Bank:  [PH Bankimport] ──► [PH Bankumsatz] Vorschlag (100/80/60/40) ──(Zuordnen, A8)──► [PH Zahlung] Bezahlt ⇒ OP

[PH Herstellerbestellung] Entwurf ──(Senden PDF/Mail/IWOfurn-CSV)──► Gesendet ──(AB einlesen, A10)──► AB erhalten
              ──(AB-Abgleich: alle Abweichungen bewertet; Mitarbeiter nur ohne Abweichung)──► AB geprueft
              ──(Wareneingang)──► Teilgeliefert ──► Geliefert ──► Abgeschlossen ; Storniert (Leitung)
              ⇒ AB-Termin → Projekt-Liefertermin (Anzeige „Liefertermine 30 Tage“)

[PH Wareneingang] Offen ──► Teilweise ──► Vollstaendig ; Zustand Transportschaden/beschädigt/falsch/fehlt ──► Reklamiert
              ⇒ Reklamiert ⇒ „Servicefall anlegen“ (aus_dokument) + Reklamation an Lieferant
              ⇒ Mengen in Herstellerbestellung ; ⇒ [PH Lagerbewegung] Wareneingang ⇒ [PH Lagerbestand]

[PH Lieferschein] Entwurf ──(Packtisch: Positionen abhaken, Pakete)──► Gepackt
              ──(Übergeben: Abholung mit Unterschrift/Abholcode | Sendung Etikett | Tour)──► Uebergeben ──► Zugestellt
              ; Storniert (Leitung)
              ⇒ beim Verlassen von Gepackt: AB.lieferung_melden (lieferschein_menge) ⇒ AB Teilgeliefert/Geliefert
              ⇒ „Teilrechnung erstellen“ (create_partial_invoice) ⇒ [PH Rechnung] Teilrechnung
              ⇒ „Produktpässe erzeugen“ ⇒ [PH Produktpass] Aktiv (QR, Garantie ab Übergabe)
              ⇒ [PH Lagerbewegung] Verkauf

[PH Sendung]  Angelegt ──(Buchen)──► Etikett ──(Tracking 2 h)──► Unterwegs ──► Zugestellt | Problem ; Storniert (vor Abholung)
[PH Tour]     Geplant ──(Freigeben, Leitung)──► Freigegeben ──(Tour starten, km)──► Unterwegs ──(Abschließen)──► Abgeschlossen | Abgebrochen
              Stopp erledigt mit Unterschrift ⇒ Lieferschein Zugestellt

[PH Montageauftrag] Geplant ──► Unterwegs ──► In Arbeit ──(Bericht, Unterschrift)──► Erledigt ──(Abnahme unterschrieben)──► Abgenommen ; Abgebrochen
              ⇒ Projektphase Montage ; Mängel ⇒ [PH Servicefall] Gemeldet (quelle Montage)
[PH Abnahme]  Entwurf ──(Unterschriften)──► Unterzeichnet | Mit Maengeln ──(Mängel erledigt)──► Abgeschlossen
              ⇒ Projektphase Uebergabe ; Übergabedatum = Start Gewährleistung (2 Jahre) für Servicefälle

[Schlussrechnung] AB ──(Schlussrechnung erstellen: alle offenen Mengen, Anzahlungen ausgewiesen + verrechnet)──► [PH Rechnung] Gestellt
              ⇒ AB Abgerechnet ⇒ Projektphase Abgeschlossen (nach Abnahme und Bezahlt; sonst Hinweis in Mappe)

[PH Servicefall] Gemeldet ──(Fehlercode + Mangel bewertet)──► Geprueft ──(Entscheidung + Begründung; Kulanz > Schwelle Leitung)──► Entscheidung
              ──► In Bearbeitung ⇄ Einsatz geplant ──(Abschlussbericht)──► Erledigt ──► Geschlossen ; Abgelehnt (Leitung) ; Wieder öffnen (Leitung)
              ⇒ Einsatz planen ⇒ [PH Serviceeinsatz] Geplant ──► Bestaetigt ──► Unterwegs ──► In Arbeit ──► Erledigt | Nicht angetroffen
              ⇒ Ersatzteile ⇒ [PH Ersatzteilbestellung] ; ⇒ Regress ⇒ [PH Lieferantenregress] Offen ──► Gemeldet ──► Anerkannt|Abgelehnt ──► Verrechnet
              ⇒ Gutschrift/Kulanz ⇒ [PH Gutschrift]
              Fristen-Ampel: grün Vermutung (1 J Verbraucher/6 M Unternehmer) · gelb Gewährleistung · orange Verjährung/nur Garantie · rot abgelaufen

[PH Kundenkarte Antrag] Neu ──(DOI)──► Bestaetigt ──(Annehmen; Website-Anträge automatisch)──► Angenommen ⇒ [PH Kundenkarte] Aktiv
              ; Abgelehnt | Doppelt
[PH Kundenkarte] Beantragt ──► Aktiv ⇄ Gesperrt (Leitung) ──► Gekuendigt
              ⇒ Umsatz (nur mit Einwilligung) aus Kassenbeleg/Bestellung/Rechnung ⇒ Stufe (Aufstufung sofort, Herabstufung nach vollem Zeitraum)
              ⇒ Einlösung an Kassa/Packtisch per lookup_card/redeem_benefit ⇒ [PH Kundenkarte Einloesung]
```

### 4.3 Nebenflüsse

```
[PH Bestellung (Shop)] offen ──(Stripe)──► zahlung_ausstehend ──► bezahlt ──(Packen)──► versandbereit ──► versendet ──► abgeschlossen
              bezahlt|reserviert ──(Abholbereit: Abholcode+Mail)──► abholbereit ──(Abgeholt, Kassa oder Packtisch)──► abgeholt ──► abgeschlossen
              ──► fehlgeschlagen | abgelaufen | storniert | widerrufen | erstattet | teilerstattet | checkout_fehler ; Betragsabweichung ──► pruefen (Leitung → bezahlt)
              ⇒ bezahlt ⇒ „Rechnung erstellen“ (create_cash_invoice, Barverkauf) ; Packen ⇒ [PH Lieferschein]
[PH Widerruf] ──► Eingangsbestätigung ──► [PH Retoure] Ware eingegangen ──► Prüfung ──► Erstatten ⇒ [PH Zahlung] Erstattung
[PH Zahlung]  Angekuendigt ──► Bezahlt (submit) ──(Rückerstatten; ≥ Vier-Augen-Grenze: Erstattung angefordert → GF)──► Teilerstattet | Erstattet ; Fehlgeschlagen ; Storniert (nur Angekuendigt)
[PH Gutschein] Erstellt ──(Zahlung)──► Aktiv ──► Teilweise eingeloest ──► Eingeloest ; Gesperrt (Leitung) ; Erstattet
[PH Kassenbeleg] (nur Server) Signiert | Ausfall ──(Sammelbeleg nach SEE-Rückkehr)──► Nachsigniert ; Storno = Gegenbeleg (Leitung)
[PH Kassenabschluss] Offen ──(Zählen)──► Gezaehlt ──(Abschließen, Leitung)──► Abgeschlossen ──(Öffnen, Leitung)──► Korrigiert
[PH Eingangsrechnung] Erfasst ──► Sachlich geprueft ──(Leitung)──► Freigegeben ──► Bezahlt ; Abgelehnt
[PH Export Lauf] Erzeugt (Belege gesperrt) ──► Übergeben ──► Von Kanzlei bestätigt ; Verworfen
[PH Produkt] Entwurf ──(Kategorie, Marke, DE-Text)──► Geprueft ──(Leitung; Bild freigegeben, Marke aktiv)──► Aktiv ──► Pausiert | Ausgelaufen
[PH Preisliste Import] Hochgeladen ──► Geprueft ──(Leitung)──► Uebernommen | Verworfen
[PH Stelle] ──(Leitung; Entgelt vollständig)──► Aktiv ──(gueltig_bis)──► pausiert ; [PH Bewerbung] Kanban je Stelle, Löschfrist Entscheidung + 7 Monate
[PH Abwesenheit] Beantragt ──(Leitung, nie selbst)──► Genehmigt | Abgelehnt ──► Storniert
[PH Newsletter Ausgabe] Entwurf ──► Freigabe ──(Leitung, versandbereit)──► Geplant ──► Wird versendet ──► Versendet | Abgebrochen
[PH Event] Geplant ──(Leitung, Uhrzeit)──► Offen ⇄ Ausgebucht ──► Durchgeführt | Abgesagt
[PH Social Beitrag] Idee ──► Entwurf ──(Leitung, Bildquelle ≠ offen)──► Freigegeben ──► Geplant ──► Veröffentlicht | Verworfen
```

### 4.4 Übergabepunkte = Primäraktionen (eine je Zustand)

| Objekt im Zustand | Primäraktion (Knopf rechts oben, einziger `primary`) | Assistent |
|---|---|---|
| Anfrage Neu | Qualifizieren | – |
| Anfrage Qualifiziert | Termin anlegen | A1 |
| Termin Erledigt ohne Gespräch | Gesprächsprotokoll | – |
| Gespräch Offen | Planung beauftragen (→ Projekt) | – |
| Projekt Planung ohne Angebot | Angebot erstellen | A2 |
| Angebot Entwurf | Senden | – |
| Angebot Gesendet | Als AB übernehmen | A3 |
| AB Offen, Anzahlung Soll > Ist | Anzahlung kassieren (Kassa) / Zahlungslink | – |
| AB Offen, Anzahlung Ist ≥ Soll | Herstellerbestellungen erzeugen | A5 |
| Herstellerbestellung Gesendet | AB einlesen | A10 |
| Herstellerbestellung AB geprüft, Ware da | Wareneingang anlegen | – |
| AB In Bestellung, Ware vollständig | Lieferschein erzeugen | A6 |
| Lieferschein Entwurf | Am Packtisch packen | Kiosk |
| Lieferschein Gepackt | Übergeben / Etikett / Tour | A12 |
| Projekt Lieferung, Montage nötig | Montageauftrag anlegen | – |
| Montage Erledigt | Abnahme anlegen | – |
| Abnahme Unterzeichnet, AB nicht abgerechnet | Schlussrechnung erstellen | – |
| Rechnung Entwurf | Rechnung stellen | – |
| Rechnung Gestellt | Zahlung erfassen | – |
| Rechnung Überfällig | Mahnen | A7 |
| Servicefall Gemeldet | Prüfen (Fehlercode) | – |
| Servicefall Entscheidung | Einsatz planen / Ersatzteile | A14 |
| Kundenkarte-Antrag Bestätigt | Karte ausstellen | – |

Die Primäraktion erscheint identisch in der Akte, in der Zeile der Liste (Hover/Fokus, Taste `Enter` + `a`) und in der Heute-Leiste.

---

## 5. Akte-Konzept

### 5.1 Kundenakte `/kunden/[kontakt]`

Zeigt **alles zu einer Person/Firma** über alle Apps. Datenquelle: eine Methode `ph_crm.api.kundenakte(kontakt)` (Anfrage an ph_crm; heute existiert das Verknüpfungs-Dashboard „Alle Vorgänge“ in Frappe) – liefert Zähler und die jüngsten 5 je Bezug in einem Aufruf; Tabs laden bei Öffnen vollständig per `getList`. Rückfall Mock/Frappe ohne Methode: n parallele `getList` aus der Bezugs-Registry (§5.3), max. 12 gleichzeitig.

```
┌ Zentrale › Kunden › Familie Muster                                                          ┐
│ Familie Muster  ● Kunde   Lochau · seit 03/2025 · Berater A. Berger        [Neu ▾] [⋯]      │
│ ✉ m…@…  ☎ +43 … (Klick = Aktion)   Kundenkarte KK-7K3QX9 · Stufe (Farbe)   ⚠ Widerspruch (rot, wenn) │
├ Übersicht | Vorgänge | Projekte 2 | Belege 7 | Zahlungen | Lieferungen | Service 1 | Termine | Marketing | Dokumente | Datenschutz | Daten ┤
│ ÜBERSICHT                                                   ║ ZEITLEISTE (alle Apps)         │
│ ┌ Offen ─────────────────────┐ ┌ Zahlen (Leitung) ──────┐   ║ heute 09:12 Rechnung gestellt  │
│ │ ▸ RE-2026-00042 offen 6.240│ │ Auftragswert 12 Mon.  │   ║ gestern Montage erledigt       │
│ │ ▸ Montage 12.11. Team B    │ │ Offene Posten         │   ║ 01.11. Mail: Terminbestätigung │
│ │ ▸ Servicefall PH-SRV-…     │ │ Anzahlungen Ist/Soll  │   ║ … (Communication, Versionen,   │
│ └────────────────────────────┘ └───────────────────────┘   ║   Kommentare, Statuswechsel)   │
│ ┌ Projekte ──────────────────────────────────────────┐      ║ [Kommentar schreiben]          │
│ │ Küche Lochau  ●Montage  → Mappe                     │      ║                                │
│ │ Terrasse      ●Angebot  → Mappe                     │      ║ NÄCHSTE SCHRITTE               │
│ └────────────────────────────────────────────────────┘      ║ ▸ Zahlung erfassen (RE-…42)    │
│ Adressen (Liefer/Rechnung/Objekt) · Portal (aktiv, letzter Login) · Einwilligungen (Zwecke) ║ ▸ Pflegetermin anbieten        │
└──────────────────────────────────────────────────────────────╨────────────────────────────────┘
```

Tabs und Quellen:

| Tab | DocTypes (Filter `kontakt = …` falls nicht anders) | Sicht |
|---|---|---|
| Übersicht | Aggregat | alle mit Kontakt-Leserecht; Zahlen nur Leitung/GF/Faktura |
| Vorgänge | PH Anfrage, PH Termin, PH Beratungsgespraech, PH Aufgabe (`kontakt` oder Dynamic Link) | CRM |
| Projekte | PH Projekt | Projekte (sonst nur Zähler) |
| Belege | PH Angebot, PH Auftragsbestaetigung, PH Rechnung, PH Gutschrift, PH Mahnung, PH Bestellung | Faktura/Shop; Beträge je Recht |
| Zahlungen | PH Zahlung, PH Anzahlung, PH Kassenbeleg (`kontakt`) | Faktura/Shop/Kassa |
| Lieferungen | PH Lieferschein, PH Sendung, PH Tour-Stopps (über Lieferschein) | Logistik |
| Service | PH Servicefall, PH Serviceeinsatz, PH Pflege Abo, PH Serviceauftrag, PH Produktpass | Service |
| Termine | PH Termin, PH Montageauftrag, PH Serviceeinsatz als Kalenderliste | – |
| Marketing | PH Newsletter Abo (per E-Mail), PH Einwilligung, PH Event Anmeldung, PH Empfehlung, PH Kundenkarte | Marketing/Kundenkarte |
| Dokumente | Dateien aller Bezüge (File mit attached_to) + PH Projekt Dokument | je Bezugsrecht |
| Datenschutz | Widerspruch, Einwilligungen, Portal-Zugang, Löschkonzept, Knopf „DSGVO-Auskunft“ | CRM Leitung |
| Daten | Formular PH Kontakt (Tabs Person · Datenschutz und Portal · Intern permlevel 1) | CRM write |

„Neu ▾“ bietet nur, was die Sitzung darf: Anfrage, Termin, Projekt, Angebot, Servicefall, Aufgabe, Kundenkarte-Antrag, Kassenbeleg (öffnet Kassa mit Kunde).

**Doppelgänger:** Kopfhinweis „Ähnliche Kontakte (2)“ bei gleicher E-Mail/Telefon/Name+PLZ → Dialog „Zusammenführen“ (Leitung; Frappe `rename_doc` mit merge). Erkennung serverseitig beim Laden (Suchfelder `email`, `nachname`+`plz`).

### 5.2 Auftragsmappe `/projekte/[projekt]`

Entspricht SHD „Infocenter/digitale Auftragsmappe“ und der Desk-Page `ph-auftragsmappe`. Datenquelle: `ph_projekte.api.auftragsmappe(projekt)` (vorhanden) – ein Aufruf liefert Kopf, Phasen, Belege, Zahlungsstand, Termine, Rückmeldungen, Dokumente, Pläne/Renderings, Galerie, Herstellerbestellungen, Abnahmen, Produktpässe, Servicefälle, Aufgaben, Zeiten, Nachrichten.

```
┌ Zentrale › Projekte › Küche Lochau, Familie Muster                                                  ┐
│ PH-PRJ-2026-0009 · Küche · Familie Muster → Kundenakte · Planer M. K. · Montageleiter T. S.  [Primär] [⋯] │
│ Anfrage ─● Planung ─● Angebot ─● Auftrag ─● Bestellung ─◐ Lieferung ─○ Montage ─○ Übergabe ─○ Fertig │
│   (◐ = teilweise: 2 von 3 Herstellerbestellungen geliefert; Hover zeigt Datum/Person je Phase)       │
├ Mappe | Räume & Positionen | Pläne & Renderings | Belege & Zahlung | Bestellungen | Lieferung & Montage | Service | Dokumente | Nachrichten | Aufgaben & Zeiten | Team & Termine | Daten ┤
│ MAPPE (Übersicht)                                                 ║ TERMINE                           │
│ ┌ Nächste Schritte ───────────────┐ ┌ Zahlungsstand (Leitung) ─┐   ║ 12.11. Montage Team B 08:00       │
│ │ ▸ Lieferschein erzeugen (A6)    │ │ Auftragswert    24.960   │   ║ 14.11. Elektriker (Fremdgewerk)   │
│ │ ▸ Montage planen                │ │ Anzahlung Soll  9.984    │   ║ 20.11. Abnahme (geplant)          │
│ │ ⚠ Rendering B: Feedback offen   │ │ Anzahlung Ist   9.984 ✓  │   ║                                   │
│ └─────────────────────────────────┘ │ Abgerechnet     9.984    │   ║ OFFENE RÜCKMELDUNGEN              │
│ ┌ Belege ─────────────────────────┐ │ Bezahlt         9.984    │   ║ Kunde: 2 Nachrichten ungelesen    │
│ │ AN-2026-00031 Angenommen        │ │ Offen           0        │   ║ Rendering B: 3 Pins, 1 Vote       │
│ │ AB-2026-00017 In Bestellung     │ └──────────────────────────┘   ║                                   │
│ │ RE-2026-00040 Anzahlung Bezahlt │                                ║ ZEITLEISTE (Projekt + Belege)     │
│ └─────────────────────────────────┘                                ║ …                                 │
│ Galerie (Tagebuch, letzte 6) · Herstellerbestellungen (HB-… AB geprüft · Liefertermin KW 45)           │
└────────────────────────────────────────────────────────────────────╨───────────────────────────────────┘
```

Regeln der Mappe:
- **Phasenleiste ist Wahrheit, nicht Deko:** jede Phase zeigt bei Hover/Fokus das Datum des Eintritts (PH Projekt Phase) und das auslösende Dokument.
- **Preise/Summen nur permlevel 1** (Leitung, GF, Faktura); Mitarbeiter sehen Mengen und Status.
- **Alles anlegen von hier:** „Neu ▾“ (Planung, Rendering, Dokument, Fremdgewerk, Aufgabe, Zeit, Montageauftrag, Abnahme, Angebot, Servicefall) – Kontakt und Projekt sind vorbefüllt.
- **Portal-Spiegel:** Tab Dokumente zeigt je Datei, ob der Kunde sie im Portal sieht; Tab Nachrichten ist derselbe Faden wie im Kundenportal.
- **Kundenakte ↔ Mappe:** Kopf verlinkt immer gegenseitig; Tastenkürzel `k` (Kunde) in der Mappe, `p` (Projekt) in Belegen.

### 5.3 Bezugs-Registry (Grundlage beider Akten und aller Bezugskarten)

`src/lib/backoffice/bezuege.js` (neu, Fundament/Zentrale): Tabelle `{ doctype, feld, zielDoctype, richtung: "zeigt_auf"|"wird_gezeigt_von", titel, bereich }`, erzeugt aus den `links`-Abschnitten der DocType-JSONs plus Custom Fields (`ph_<app>_*`) plus Dynamic Links (`bezug_doctype/bezug`, `referenz_doctype/referenz_name`, `folgedokument_doctype`, `reserviert_fuer_doctype`). Im Mock aus den JSONs gelesen, im Frappe-Modus aus `getdoctype` (links, fields). Jede T5-Seite baut die rechte Spalte „Bezüge“ daraus: Gruppen *Vorher* (Quelle) · *Gleichzeitig* (Kunde, Projekt) · *Nachher* (Folgedokumente, mit Zähler und „+ anlegen“).

---

## 6. Globale Suche (Befehlspalette ⌘K / Strg+K, `/`)

### 6.1 Eingabearten und Erkennung (Client, vor dem Server-Aufruf)

| Eingabe | Erkennung | Verhalten |
|---|---|---|
| Nummer | Regex-Register (Tabelle 6.2) | Treffer „Direkt öffnen“ ganz oben, `Enter` springt ohne Liste |
| `>` + Text | Befehl | nur Aktionen/Navigation (z. B. `> neue rechnung`, `> arbeitsplatz`) |
| `#` + Text | nur Datensätze eines DocTypes (`#rechnung muster`) | DocType-Filter |
| `@` + Name | Personen (User, PH Mitarbeiter) | „Meine Aufgaben an …“, Zuweisen |
| `€` + Betrag | Betragssuche (Cent) in Rechnung, Zahlung, Bankumsatz, Kassenbeleg | Toleranz ±0,01 € |
| Telefon/E-Mail-Muster | Kontakt-Suche über `email`, Telefonfelder (normalisiert) | Kundenakte |
| Datum (`12.11.`) | Kalender-Sprung | öffnet Termine/Montagen des Tages |
| Freitext ≥ 2 Zeichen | Volltext über 6.2 | gruppierte Liste |

### 6.2 Durchsuchte DocTypes, Felder, Nummernmuster

Felder = `name` + `title_field` + `search_fields` der JSON (+ `in_global_search`). Reihenfolge = Standard-Gewicht.

| DocType | Nummernmuster (Präfix) | Suchfelder | Gewicht |
|---|---|---|---|
| PH Kontakt | `PH-KON-` | nachname, vorname, firma, email, ort, Telefon | 1,0 |
| PH Projekt | `PH-PRJ-` | titel, kunde_name, objekt_ort, projektart | 1,0 |
| PH Auftragsbestaetigung | `AB-` | kunde_name, projekt, status | 0,9 |
| PH Rechnung | `RE-`, `ENTW-` | nummer, kunde_name, auftrag | 0,9 |
| PH Angebot | `AN-` | kunde_name, projekt | 0,8 |
| PH Anfrage | `PH-ANF-` | nachname, email, firma, art | 0,8 |
| PH Termin | `PH-TER-`, Kundenreferenz `PT-XXXXXX` | referenz, nachname, email, terminart | 0,8 |
| PH Bestellung | `PH-S-JJMMTT-XXXXXX` | kunde_name, kunde_email, bestellnummer, payment_intent | 0,8 |
| PH Lieferschein | Serie laut NUMMERNKREISE | kunde_name, bestellung, auftrag, liefer_ort | 0,7 |
| PH Servicefall | `PH-SRV-` | kunde_name, produkt_name, marke, fehlercode, seriennummer | 0,8 |
| PH Serviceeinsatz | `PH-SRE-` | kunde_name, techniker, servicefall | 0,6 |
| PH Montageauftrag | Serie | projekt, ort, montageleiter | 0,6 |
| PH Herstellerbestellung | `HB-` | lieferant, kommission, ab_nummer | 0,7 |
| PH Wareneingang | `WE-` | herstellerbestellung, lieferant, lieferschein_nr_lieferant | 0,5 |
| PH Produkt | Slug | name_herstellerbezeichnung, marke, kategorie, hersteller_artikelnr, ean | 0,7 (Kassa/Packtisch 1,0) |
| PH Marke / PH Lieferant | Name | marke, slug; firmenname, ort | 0,5 |
| PH Zahlung | `PH-ZAH-` | bezug, stripe_payment_intent, zahlungsreferenz, kanal | 0,6 |
| PH Anzahlung | `AZ-XXXX-XXXX` | auftrag_referenz, kunde_email, payment_intent | 0,6 |
| PH Gutschein | `PH-GS-`, Code-Rest `letzte4` | code_letzte4, kaeufer_name, kaeufer_email, empfaenger | 0,5 (nie Vollcode) |
| PH Kassenbeleg | `<KassenID>-<6 Ziffern>` | kasse, belegnummer, belegart, kunde_name | 0,6 |
| PH Eingangsrechnung | `ER-` | lieferant_name, rechnungsnummer_lieferant | 0,5 |
| PH Sendung | Serie, tracking_nr | tracking_nr, shipment_id, carrier, lieferschein | 0,5 |
| PH Tour | `PH-TOUR-` | region, fahrer, fahrzeug | 0,4 |
| PH Lagerbestand | `PH-LB-` | produkt_name, seriennummer, ean, lagerort | 0,5 |
| PH Produktpass | Serie | produkt_name, marke, seriennummer, kontakt | 0,5 |
| PH Kundenkarte | `KK-XXXXXX` | kartennummer, kunde_name, stufe | 0,7 |
| PH Aufgabe | `PH-AUF-` | titel, zugewiesen_an, referenz_name | 0,6 |
| PH Mitarbeiter | `PH-MA-` | vorname, nachname, rolle_intern | 0,4 (nur Personal) |
| PH Bewerbung | `PH-BEW-` | (nur Personal, pseudonymisiert nach Löschfrist) | 0,4 |
| Weitere (Gutschrift `GU-`, Mahnung `MA-`, Export `EX-`, UVA `UVA-`, Bankumsatz `BU-`, Abschluss `KA-`, Kassenbuch `KB-`, Ersatzteil `PH-ET-`, Regress `PH-REG-`, Pflege `PFL-`, Serviceauftrag `PH-SA-`, Newsletter `PH-NL-`, Social `PH-SOC-`, Empfehlung `EMP-XXXXXX`, Antrag `PH-KKA-`, Einlösung `PH-KKE-`, Inventur `PH-INV-`, Preisliste `PH-PLI-`) | Präfix | name + title | nur per Nummer oder `#` |

### 6.3 Ranking (serverseitig, `ph_core.api.suche` als Anfrage; Rückfall n × `getList like`)

```
score = gewicht_doctype
      × treffer (exakte Nummer 10 · Präfix-Treffer im Titel 4 · Wortanfang 3 · enthält 1)
      × aktualität (modified < 7 Tage 1,5 · < 90 Tage 1,2 · sonst 1,0)
      × zustand (offen/aktiv 1,3 · Endzustand 0,8)
      × kontext (gleicher Bereich wie aktuelle Seite 1,2 · Kiosk Kassa: Produkt/Kontakt/AB 1,5)
      × persönlich (zuletzt von mir geöffnet 1,4 – aus localStorage „zuletzt“, Client-seitig)
```
Gruppen in Reihenfolge: **Direkt öffnen** (Nummer) · **Zuletzt geöffnet** (leere Eingabe, 8 Einträge) · **Datensätze** (max. 12, je DocType max. 4) · **Aktionen** · **Bereiche/Seiten** · **Berichte**. Jeder Treffer: Titel · Untertitel `DocType · Nummer · Status-Badge` · rechts Tastenhinweis. `Enter` öffnet, `⌘Enter` öffnet in neuem Tab, `→` zeigt Vorschau-Karte (Kopf der Akte, 3 Kennzahlen, Primäraktion) ohne zu navigieren. Latenz-Ziel: erste Gruppe < 150 ms (Client), Datensätze < 400 ms (Server, Abbruch bei Tippen, 150 ms Debounce). Rechte: nur DocTypes mit `darfDoc(read)`; permlevel-1-Felder werden nie durchsucht.

### 6.4 Rückfall ohne Palette

`/suche?q=` rendert dieselben Gruppen als Seite (Server). Kiosk-Arbeitsplätze haben ein eigenes, großes Suchfeld (Produkt/Kunde/Beleg) und keine Palette.

---

## 7. Benachrichtigungsmodell

### 7.1 Quellen

| Quelle (Frappe) | Beispiel | Priorität |
|---|---|---|
| PH Aufgabe an mich (ToDo-Spiegel) | „Anfrage > 24 h unbeantwortet“, „Montage morgen“ | normal / hoch (fällig heute, überfällig) |
| Zuweisung / Erwähnung (Comment mit @) | „A. Berger hat dich in RE-… erwähnt“ | normal |
| Workflow-Ereignis an Dokumenten, denen ich folge (Frappe „Document Follow“) oder die ich angelegt habe | „AB-… Teilgeliefert“ | niedrig |
| Freigabe nötig (Leitung) | Kulanz > Schwelle, Erstattung ≥ Vier-Augen-Grenze, Eingangsrechnung freigeben, Stelle aktivieren, Abwesenheit genehmigen, Newsletter freigeben | hoch |
| Systemereignis | SEE-Ausfall, Terminal offline, Stripe-Ereignis fehler, Webhook-Fehler, LetMeShip-Problem, Export-Erinnerung | hoch (Admin/Leitung) |
| Kunde | Portal-Nachricht, Rendering-Feedback, Servicefall gemeldet, Website-Anfrage, Terminbuchung | normal, Team-weit |
| Fristen | Gewährleistung endet ≤ 60 Tage, Regressfrist ≤ 14 Tage, Löschfrist Bewerbung, Angebot läuft ab, Preisstand veraltet | normal |

Technisch: Frappe `Notification Log` + `ToDo` + Kommentare werden über eine Methode `ph_core.api.benachrichtigungen(seit)` (Anfrage) gelesen; bis dahin Polling von `ToDo`/`Notification Log`/`PH Aufgabe` alle 60 s. Zustell-Kanal zum Browser: `/api/ereignisse` (SSE, Server pollt Frappe je Sitzung gebündelt; Fallback Polling 60 s). Kein Browser-Push im Erstbau.

### 7.2 Darstellung

| Ort | Was | Verhalten |
|---|---|---|
| Glocke (Kopfzeile) | Zähler ungelesen (max. „99+“), Panel 380 px: Tabs „Für mich · Team · System“, Gruppen Heute/Gestern/Älter | Eintrag: Icon des Bereichs, Text, Objekt-Chip, relative Zeit; Klick öffnet Akte und markiert gelesen; „Alle gelesen“; Panel-Animation 160 ms (opacity + 4 px translateY) |
| Seitenleiste | Zahl neben Bereich = offene Objekte, für die ich zuständig bin (nicht Benachrichtigungen) | aktualisiert mit SSE |
| Toast (unten rechts, Kiosk oben) | nur Ereignisse hoher Priorität während der Arbeit + Rückmeldungen eigener Aktionen | 4 s (ok), 8 s (fehler), Stapel max. 3, `aria-live=polite` |
| Heute-Leiste (Zentrale, Bereichsstart) | „Heute: 3 Termine · 2 Montagen · 5 Aufgaben fällig · 1 Freigabe“ | Chips verlinken gefiltert |
| Kiosk-Banner | SEE-Ausfall, offline, Trainingsmodus, Abschluss gesperrt | farbiges Band 40 px unter der Kopfzeile, nicht schließbar solange Zustand gilt |
| E-Mail (Frappe) | Tagesübersicht 07:00 (Aufgaben fällig, Freigaben), sonst keine Einzelmails | Einstellung je Benutzer |

### 7.3 Regeln

- Keine Benachrichtigung für eigene Aktionen (außer Fehlschlag im Hintergrund, z. B. PDF-Erzeugung).
- Ein Objekt erzeugt höchstens **eine** ungelesene Benachrichtigung je Empfänger; neuere ersetzen ältere (Zusammenfassung „3 Änderungen an AB-…“).
- Stille Zeiten: Kiosk zeigt nur Kassa-/Logistik-relevante Ereignisse.
- Lesezustand wird in Frappe gespeichert (Notification Log `read`), nicht im Browser.

### 7.4 Heute-Leiste – Quellen je Rolle

| Rolle | Chips |
|---|---|
| CRM | Termine heute, unbestätigte Termine, Anfragen Neu, Aufgaben fällig |
| Projekte/Montage | Montagen heute, Abnahmen offen, Feedback offen, Liefertermine diese Woche |
| Faktura | Rechnungen fällig 7 Tage, Bankumsätze offen, Eingangsrechnungen zur Freigabe, Export fällig |
| Shop/Logistik | Zu packen, abholbereit, Etikett offen, Probleme |
| Service | Reaktion überfällig, Einsätze heute, Fristen ≤ 14 Tage |
| Kassa | Abschluss offen gestern, Terminals offline |
| Leitung/GF | Freigaben (alle Arten), Kulanz, Erstattung, Kassendifferenz |

---

## 8. Rechte-Sichtbarkeit je Rolle

### 8.1 Bereiche × Rollen (Navigation, aus `rechte.js`, ergänzt um Sichtbarkeitsregeln der UI)

| Rolle | Sichtbare Bereiche | Arbeitsplätze | Besonderheiten der Oberfläche |
|---|---|---|---|
| System Manager / Administrator | alle | alle | Frappe-Desk-Link im Benutzer-Menü |
| PH Backoffice-Admin | alle (ohne Bewerbungen/Gespräche – ph_personal verweigert) | alle | `/benutzer`, `/geraete`, `/einstellungen`; keine Buchen/Stornieren-Knöpfe |
| PH Geschäftsführung | alle lesend + Zentrale schreibend | Backoffice | Beträge, Margen (permlevel 1), Freigabe-Knöpfe (Erstattung, Kulanz), Berichte, Export |
| PH <Bereich> Leitung | eigener Bereich voll + Zentrale + Kundenakte/Mappe (Bezüge nur eigener Bereich mit Details) | Backoffice (+ Kiosk des Bereichs) | Rückwärts-Übergänge, Storno, Löschen, Export, permlevel 1, Einstellungen des Bereichs |
| PH <Bereich> Mitarbeiter | eigener Bereich (ohne Export/Löschen) + Zentrale | Backoffice (+ Kiosk des Bereichs) | Primäraktionen; Leitung-pflichtige Knöpfe ausgegraut mit Hinweis „Freigabe durch Leitung – anfragen“ (legt PH Aufgabe an) |
| PH Buchhaltung extern | Faktura, Kassa-Verwaltung lesend | Backoffice | Export-Läufe herunterladen, Berichte; keine Kundenakte außer Belegtabs |
| PH Montage | Projekte (Montage, Abnahme, Tagebuch lesen/schreiben), Logistik lesen | Montage mobil, Backoffice reduziert | Mappe ohne Preise; Kundenakte nur Kopf + Adressen |
| PH Techniker | Service (ohne Kosten/EK), Projekte lesen | Technik mobil | Servicefall-Tabs „Ersatzteile und Kosten“ ohne Beträge |
| PH Personal Selbstservice | Personal: nur eigene Zeiten/Abwesenheiten | Backoffice (Minimal) | Seitenleiste zeigt nur Zentrale + „Meine Zeiten“ |
| PH Kassa Mitarbeiter | Kassa-Kiosk, Kassa-Verwaltung lesend, Kundenkarte-Lookup | Kassa | Storno nur eigene Belege heute |
| PH Website Integration | nichts | – | Login verweigert mit Hinweis |

### 8.2 Feldebene und Datenschutz in der UI

- `permlevel 1`-Felder (Vertrag, EK, Konditionen, Margen, interne Notizen, Vertrauliches Personal) werden **nicht gerendert** (nicht nur ausgegraut) ohne Rolle; Summenblöcke zeigen dann „–“ mit Tooltip „nur Leitung“.
- Kassa-/Packtisch-Lookup der Kundenkarte: nie Kontaktdaten, nie Umsatz (API garantiert, UI zeigt nur Name, Stufe, Vorteile).
- Widerspruch (PH Kontakt): roter Kopf in Kundenakte, Marketing-Tab gesperrt, „Neu ▾“ ohne Marketing-Aktionen.
- Bewerbungen: nach Löschlauf pseudonymisiert – Liste zeigt „(gelöscht)“, kein Detail.
- Exporte (CSV) nur mit `export`-Recht; Export protokolliert Kommentar am DocType „CSV exportiert (n Zeilen)“ (Anfrage ph_core: Audit-Eintrag).

### 8.3 Darstellung fehlender Rechte

| Fall | UI |
|---|---|
| Bereich ohne Recht | nicht in Seitenleiste; direkte URL → `/kein-zugriff` mit „Zugriff anfragen“ |
| Dokument ohne Leserecht | **404-gleich**: Seite „Nicht gefunden oder kein Zugriff“ (dieselbe Darstellung wie `not_found`, damit Belegnummern nicht erraten werden); Knopf „Zugriff anfragen“ legt PH Aufgabe an die Bereichsleitung an. Inhaber-Entscheidung §16 |
| Aktion ohne Recht | Knopf sichtbar, deaktiviert, Tooltip + „Anfragen“ (nur bei Leitung-pflichtigen Aktionen); sonst ausgeblendet |
| Feld ohne Recht | nicht gerendert |
| Workflow-Übergang ohne Rolle | nicht angeboten (`getTransitions`) |

---

## 9. Datenladestrategie

### 9.1 Grundsatz

- **Server Components** laden über `backoffice(session)`; der Browser spricht nie mit Frappe.
- **Streaming je Block:** jede T1-Kachel, jede T5-Spalte/Tab und jede Bezugskarte ist eigener `<Suspense>` mit Skeleton; Reihenfolge: Kopf (blocking, < 300 ms) → Hauptinhalt → rechte Spalte → Charts. Alles, was ein `await` auf Frappe braucht, hängt an einer Suspense-Grenze; der Rahmen (Shell) kommt sofort.
- **Parallelität:** Promise.all je Block; Obergrenze 6 gleichzeitige Frappe-Aufrufe je Anfrage (Semaphore in `client.js`), Akten nutzen die Aggregat-Methoden (`auftragsmappe`, `kundenakte`).
- **Timeouts:** 8 s je Aufruf (Fundament), Listen 5 s, Suche 3 s, Kennzahlen 4 s – Überschreitung = Block „nicht geladen – erneut versuchen“, nie die ganze Seite.

### 9.2 Cache-Schichten

Heute: alle Seiten `force-dynamic` (Fundament). Ziel: `cacheComponents: true` in `next.config.js` und `"use cache"` + `cacheTag`/`cacheLife` für die unten genannten Schichten (Next 16 API; Dokumentation `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cacheTag.md`, `revalidateTag.md`, `updateTag.md`). Sitzungs-/rechteabhängige Daten werden **nie** über Sitzungen hinweg gecacht; der Cache-Schlüssel enthält die Rollenmenge (Hash) bei Listen und Kennzahlen, Dokumente werden nicht gecacht (nur Meta).

| Schicht | Beispiele | `cacheLife` | Tags |
|---|---|---|---|
| Meta | DocType-Meta, Workflows, Kanban-Definitionen, Rollen | 5 min (Frappe), 60 s (Mock) | `meta:<DocType>`, `meta:*` |
| Stammdaten | Marken, Kategorien, Merkmale, Terminarten, Stufen/Vorteile, Zahlungsbedingungen, Lagerorte, Fehlerkatalog, Paketprofile | 1 h | `stamm:<DocType>` |
| Produktsuche (Kassa/Angebot) | Produktliste mit Bild/Preis | 5 min | `liste:PH Produkt`, `preise` |
| Listen | Seitenweise `getList`-Ergebnisse | 30 s, stale-while-revalidate | `liste:<DocType>`, `liste:<DocType>:<rollenhash>` |
| Kennzahlen/Charts | Number-Card-Zähler, Chart-Reihen | 60 s | `kennzahl:<bereich>`, `liste:<DocType>` |
| Berichte | `getReport` | 5 min je Filter-Hash | `report:<name>` |
| Dokument + docinfo | `getDocMitInfo` | **kein Cache** (immer frisch, Konflikt über `modified`) | – |
| Akte-Aggregate | `auftragsmappe`, `kundenakte` | 15 s | `akte:projekt:<name>`, `akte:kunde:<kontakt>` |
| Dateien/PDF | private Dateien, fixierte Rechnungs-PDFs | PDF gestellter Rechnungen 24 h; sonst kein Cache | `datei:<file_url>` |

### 9.3 Invalidierung

1. **Eigene Schreibvorgänge (Server Actions):** nach erfolgreichem `insert/save/submit/workflowAction/runDocMethod` ruft die Action `updateTag(…)` für `liste:<DocType>`, `kennzahl:<bereich>`, `akte:kunde:<kontakt>` und `akte:projekt:<projekt>` (aus den Feldern des Dokuments) – Read-your-own-writes, nächste Anfrage wartet auf frische Daten.
2. **Fremde Schreibvorgänge (Frappe-Webhooks):** Frappe `Webhook`-Datensätze (Admin legt sie im Desk an; Secret nur dort) auf `on_update`, `on_submit`, `on_cancel`, `on_change` der Haupt-DocTypes → `POST /api/revalidate` mit Header `X-Revalidate-Secret` (gleiche Konvention wie Website) und Body `{doctype, name, kontakt?, projekt?}` → Route Handler ruft `revalidateTag(tag, { expire: 0 })` für `liste:<DocType>`, `kennzahl:<bereich>`, Akte-Tags; bei `DocType`/`Workflow`/`Custom Field` zusätzlich `meta:*`. Rate: Webhooks werden serverseitig 2 s entprellt je Tag.
3. **Scheduler-Ergebnisse** (Überfällig setzen 06:00, Preisstand, Fristen) → derselbe Webhook-Weg (Frappe-Job ruft `ph_core.utils.website.revalidate`-analog eine Backoffice-Revalidate-Funktion – Anfrage an ph_core: `revalidate_backoffice(tags)`).
4. **Live-Daten im Kiosk** (Kassa, Packtisch): kein Cache, Server Actions direkt; Status-Polling (Terminal 2 s, Verbindung 30 s).
5. **Sitzungsende/Logout:** keine Cache-Aktion nötig (Dokumente ungecacht; Listen mit Rollenhash).

### 9.4 Client-Zustand

- URL ist Zustand für Listen/Kanban/Kalender (teilbar, Zurück-Taste korrekt).
- `localStorage` nur für Komfort: Spaltenwahl, Seitenleiste, zuletzt geöffnet (max. 50), Kiosk-Lautstärke.
- Formularentwürfe (ungespeichert) in `sessionStorage` je `doctype:name`, Wiederherstellung mit Hinweisband „Entwurf von 09:41 wiederhergestellt – verwerfen?“.
- Optimistische Updates nur für Kanban-Verschieben, Abhaken (Aufgaben, Packpositionen), Kommentar – mit Rücknahme bei Fehler (Toast + Rücksprung-Animation 200 ms).

### 9.5 Mock-Modus

Gleiche Tags, gleiche Actions; `MockClient` hält Daten im Speicher; Webhook-Route antwortet 200 und invalidiert ebenso. Seed-Daten je Bereich müssen die Akten füllen (ein zusammenhängender Musterfall „Küche Lochau“ durch alle Objekte, siehe `mock/seed.js`).

### 9.6 Realtime

Frappe `frappe.realtime` (Socket.IO) erreicht der Browser nicht. Der Server abonniert je Kanal (Kassa-Kundendisplay, Terminal-Status, Benachrichtigungen) und reicht über SSE `/api/ereignisse?kanal=` weiter; Rückfall Polling. Erstbau: Polling, SSE als Ausbau.

---

## 10. Druck/PDF-Pfad

| Ausgabe | Quelle | Weg | Format |
|---|---|---|---|
| Geschäftsbelege (Angebot, AB, Rechnung, Gutschrift, Mahnung, Lieferschein, Montagebericht, Abnahme, Servicebericht, Reklamationsmeldung, Bestätigungen, Kontoauszug, Protokolle) | Frappe Print Format (Jinja, `ph_basis.html`) | `/druck/[doctype]/[name]?format=` Vorschau (HTML aus `frappe.www.printview` über Server) → `/druck/…/pdf` (Server: `getPdf` = `frappe.utils.print_format.download_pdf`, Stream `application/pdf`, `Content-Disposition: inline; filename="<Nummer>.pdf"`) | A4, Sprache aus Dokument (`sprache_bericht`) oder Kontakt |
| Fixierte Rechnungs-PDF | beim „Stellen“ von ph_faktura erzeugt und als Datei angehängt | Knopf „PDF“ liefert **die angehängte Datei**, nicht eine Neuerzeugung (Beweiskraft) | – |
| Bon 80 mm | `ph_kassa/druck` (ESC/POS) | Server Action `bonDrucken(beleg)` → `drucker.py` (Druckserver HTTP→USB, QZ Tray oder PDF 80 mm); Kiosk `useDruck()` wählt Modus aus `PH Kasse.bon_drucker`; Nachdruck Strg+P | ESC/POS |
| Etiketten (Versand A6/Lieferschein, Lager 62×29, Namensschilder 85×54, Kundenkarte 85,6×54) | LetMeShip-PDF (privater Anhang) bzw. Frappe Print Format | `/api/datei?url=` (Rechte) → Browser-Druckdialog mit `@page`-Maß; Kiosk: Druckserver-Profil „Etikett“ | PDF |
| Listen/Reports | DataTable | Browser-Druck (`@media print`: ohne Shell, Filter als Kopfzeile) + CSV | – |
| Sammeldruck | Auswahl in Liste → „Drucken (n)“ | Server fügt PDFs zusammen (`frappe.utils.pdf.get_pdf` je Beleg, Zusammenführen serverseitig; Obergrenze 50) | PDF |

Regeln: Druck ist eine Aktion in der `WorkflowLeiste` (Symbol Drucker, `p`); Vorschau öffnet in Seitenpanel (480 px, von rechts, 200 ms) statt neuem Tab; „Als PDF senden“ nutzt die Dokumentmethode der App (`senden`) – nie Mail aus dem Backoffice-Server. Fehler (wkhtmltopdf fehlt, QR-Bibliothek fehlt) → `unavailable` mit Text „PDF konnte nicht erzeugt werden – HTML-Vorschau drucken?“. Druckjobs im Kiosk werden in einer Warteschlange (IndexedDB) gehalten, bis der Druckserver bestätigt; Band „1 Druckauftrag wartet“.

---

## 11. Fehlerbehandlung Frappe → UI

Fehlerbild: `BackofficeError{code}` aus `errors.js` (`invalid | forbidden | not_found | conflict | rate_limited | unavailable | auth`), Benutzertext aus `_server_messages` ohne HTML.

| Code | Seite (T1–T5, T8) | Formular/Action | Kiosk | Wiederholen |
|---|---|---|---|---|
| `invalid` | – | Feldfehler inline (Feldname aus `MandatoryError`/Text-Parsing), Zusammenfassung oben, Fokus auf erstes Feld; Toast nur bei Action ohne Formular | Dialog mit Text + „Verstanden“ | – |
| `forbidden` | `/kein-zugriff`-Block an Ort der Komponente | Toast „Dafür fehlt die Berechtigung“ + Knopf „Freigabe anfragen“ | Dialog, PIN-Wechsel anbieten (Leitung) | – |
| `not_found` | 404-Seite mit Suche vorbefüllt | Toast + Liste neu laden | Dialog | – |
| `conflict` | – | **Konfliktdialog**: „Von <Person> um <Zeit> geändert“, Felder-Diff (meine Werte / aktuelle), Knöpfe „Neu laden“ / „Meine Änderungen überschreiben“ (nur Leitung) | Kassa: Beleg trotzdem idempotent prüfen (`idempotency_key`), Ergebnis anzeigen | – |
| `rate_limited` | Hinweisband | Toast mit Countdown (Retry-After) | Band | automatisch nach Countdown |
| `unavailable` | Block „nicht geladen“ mit „Erneut versuchen“; bei Seite insgesamt Fehlerseite ohne Shell-Verlust | Toast + Entwurf bleibt (sessionStorage) | **Offline-Modus** (§12) | Backoff 1 s · 2 s · 4 s · 8 s, max. 3 automatisch, danach manuell |
| `auth` | Overlay „Sitzung abgelaufen“ mit Login-Formular **über** der Seite (Formularinhalt bleibt), danach Action erneut | wie links | PIN-Dialog (Kiosk-Sitzung) | nach erfolgreicher Anmeldung automatisch |

Weitere Regeln:
- Server Actions geben immer `{ ok:false, code, message, feld? }` zurück; die Komponente entscheidet die Darstellung nach Tabelle.
- Hintergrundfehler (PDF, Mail, Webhook) erscheinen als Kommentar am Dokument (macht Frappe) **und** als Benachrichtigung „System“.
- Jede Fehleranzeige trägt eine kurze Kennung (`#a1b2c3`, Server-Log-Korrelation ohne Werte), damit Mitarbeiter sie nennen können.
- Keine englischen Frappe-Texte: unbekannte `exc_type` → Standardtext des Codes; Originaltext nur im Admin-Protokoll.
- Formulare validieren vorab mit `validiere(meta, …)` (zod aus Meta): Pflicht, Typ, Länge, Link-Existenz – Frappe bleibt letzte Instanz.
- Leer vs. Fehler sind getrennte Zustände: leere Liste ist kein Fehler; Zähler „0“ ist eine Zahl.

---

## 12. Offline-Konzept Kassa

Zwei getrennte Ausfallklassen (README ph_kassa, PLAN §8). Rechtliche Einordnung (Belegerteilung bei Kassenausfall, Nacherfassung, Meldepflicht) ist vor Produktivbetrieb mit dem Steuerberater zu bestätigen; das Konzept bereitet beide Wege technisch vor.

| Klasse | Erkennung | Verhalten |
|---|---|---|
| **A: SEE-Ausfall, Server erreichbar** | Server meldet `see_status = ausgefallen` in `kassen_status` | Server bucht normal mit Ausfallsignatur („Sicherheitseinrichtung ausgefallen“), `PH Kassa Ereignis` läuft; Kiosk zeigt orangefarbenes Band „Signatureinheit ausgefallen seit 09:12 – Belege gültig, Nachsignatur automatisch“; Bon trägt den Vermerk; nach Rückkehr Sammelbeleg (Server) → Band grün 5 s |
| **B: Backoffice/Frappe nicht erreichbar** | `/api/ping` 2 × hintereinander fehlgeschlagen oder Server Action `unavailable` | **Notbetrieb** (rotes Band „Keine Verbindung – Notbetrieb seit 09:12, 3 Vorgänge warten“) |

### 12.1 Notbetrieb (Klasse B) – was geht, was nicht

| Funktion | Offline | Begründung |
|---|---|---|
| Positionen aus Produktkatalog (Name, Preis, Steuersatz, Bild klein) | ja | Katalog-Cache (IndexedDB `katalog`, Stand ≤ 24 h, nur Aktiv + Ausstellungsstücke, Preise mit Stand) |
| Freitextposition mit Steuersatz | ja | lokal |
| Kunde zuordnen | nur aus Cache (`kunden`: zuletzt 500 bediente Kontakte, Name/Nummer, keine Adressen) | Datenschutz, Größe |
| Zahlart Bar, Karte extern, Überweisung | ja | kein Serverbedarf |
| Stripe Terminal | nein (Reader braucht Server) → Hinweis „Karte extern“ nutzen | Server-gesteuert |
| Gutschein einlösen/verkaufen | nein | Restwert nur serverseitig verlässlich |
| Anzahlung auf Auftrag | nur wenn AB im Cache `auftraege` (offene ABs mit Anzahlungs-Soll, Stand ≤ 24 h), als Vorgang gekennzeichnet | Zahlungsplan-Prüfung erfolgt beim Einspielen |
| Kundenkarte Vorteil | nein | Limit je Jahr serverseitig |
| Storno | nein | Leitung + Gegenbeleg serverseitig |
| Belegdruck | **Notbeleg**: Bon mit Kennzeichnung „NOTBELEG – Kassenausfall – gültiger Beleg folgt / Beleg-Nr. folgt“, vorläufige Nr. `N-<Gerät>-<lfd>`, Positionen, Summen, Zahlart, Zeitpunkt; **ohne QR** | kein RKSV-Beleg möglich ohne Serverkette |
| Tagesabschluss, Einlage/Entnahme | nein (Einlage/Entnahme wird als Vorgang gepuffert) | |

### 12.2 Puffer

IndexedDB `ph_kassa_puffer` (Objekte `vorgaenge`): `{ lokaleNr, geraet, kasse, bediener, zeitpunkt, positionen[], zahlarten[], kontakt?, auftrag?, kundenbelegEmail?, idempotencyKey: "offline:<geraet>:<lokaleNr>", status: "wartet"|"gesendet"|"gebucht"|"fehler", belegName?, fehlerText? }`. Verschlüsselt mit Sitzungsschlüssel (WebCrypto AES-GCM, Schlüssel aus Server-Sitzung abgeleitet; Puffer ohne Sitzung unlesbar). Maximal 500 Vorgänge; darüber Hinweis „Notbetrieb beenden“.

### 12.3 Einspielen

Bei Rückkehr (Ping ok): Band „Verbindung wieder da – 3 Vorgänge werden gebucht“ → Server Action `pufferEinspielen(vorgaenge)` → `/api/kassa/puffer` → je Vorgang in Reihenfolge `erzeuge_beleg(..., idempotency_key, quelle="Kassa-Notbetrieb", notiz="Notbeleg N-… vom <Zeit>")`; Belegzeitpunkt ist der Buchungszeitpunkt (RKSV-Kette), der ursprüngliche Zeitpunkt steht in der Notiz; `PH Kassa Ereignis` „Kassenausfall“ mit Dauer wird vom Server angelegt (> 48 h → Aufgabe „FinanzOnline melden“). Ergebnis je Vorgang: gebucht (Belegnummer, Bon nachdrucken / per E-Mail an Kunde, wenn Adresse erfasst) oder Fehler (bleibt im Puffer, Liste „Zu klären“ für Leitung). Der Puffer wird erst nach Server-Bestätigung geleert.

### 12.4 Zustände des Kiosk-Verbindungsbands

`online` (kein Band) → `instabil` (grau, 1 Fehlschlag) → `offline` (rot, Notbetrieb aktiv) → `einspielen` (blau, Fortschritt n/m) → `online`. Übergänge animiert 200 ms Höhe 0→40 px; Ton (optional, Einstellung) bei Wechsel zu offline.

### 12.5 Packtisch/Montage/Technik offline

Kein Notbetrieb: Nur-Lesen-Cache der heute geöffneten Lieferscheine/Aufträge (Unterlagen-PDF, Positionen) zum Anzeigen; Abhaken/Fotos/Unterschrift werden als Entwurf lokal gehalten (IndexedDB) und beim nächsten Online-Zustand gesendet (gleiche Puffer-Mechanik, `idempotency_key`). Hinweisband wie Kassa.

---

## 13. Performance-Budgets (Zielwerte für Abnahme, gemessen auf iPad 9. Gen Safari und Desktop Chrome, Staging über VPN)

| Messgröße | Ziel | Messung |
|---|---|---|
| Shell sichtbar (Seitenleiste, Kopf) | < 300 ms TTFB + < 500 ms First Paint | Playwright-Trace |
| Liste (25 Zeilen) vollständig | < 1,2 s (Frappe), < 400 ms (Mock) | E2E |
| Akte Kopf + erster Tab | < 1,0 s; rechte Spalte gestreamt < 2,0 s | E2E |
| Dashboard alle Kacheln | < 2,5 s; jede Kachel einzeln sichtbar sobald fertig | E2E |
| Suche Datensätze | < 400 ms p50, < 900 ms p95 | Server-Log |
| Kassa: Position hinzufügen → Summe aktualisiert | < 100 ms (rein Client) | Manuell/Trace |
| Kassa: Beleg buchen → Bon-Druckauftrag | < 1,5 s (Server inkl. Signatur) | Server-Log |
| Kanban Drag → Rückmeldung | sofort optimistisch, Server < 800 ms | |
| JavaScript je Route (gzip) | Backoffice-Seiten ≤ 180 kB, Kiosk Kassa ≤ 250 kB, keine Chart-Bibliothek (SVG eigen) | `next build`-Ausgabe |
| CSS gesamt | ≤ 60 kB gzip | |
| Bilder | Produktbilder in Listen 96 px WebP/AVIF, Detail 640 px; `next/image` mit Remote-Pattern Frappe-Dateien über `/api/datei` | |
| Frappe-Aufrufe je Seite | Liste ≤ 3, Akte ≤ 6 (mit Aggregat) / ≤ 12 (Rückfall), Dashboard ≤ 12 parallel in 2 Wellen | Server-Log zählt |
| Layout-Sprünge (CLS) | < 0,05 (Skeletons mit Zielhöhen) | Lighthouse |
| Barrierefreiheit | axe serious/critical = 0; Tastatur für Tabelle, Kanban, Palette, Formular, Kiosk | E2E |
| Speicher Kiosk (12 h Betrieb) | kein Wachstum > 100 MB; Katalog-Cache ≤ 30 MB | DevTools |

Verstöße blockieren die Abnahme der betroffenen Seite.

---

## 14. Gemeinsame Bausteine, die aus dieser Architektur folgen (Aufträge an Fundament/Fachbereiche)

| Baustein | Ort | Zweck |
|---|---|---|
| `ROUTEN`-Register + Redirect `/d/*` | `lib/backoffice/bereiche.js` | kanonische Routen je DocType |
| `bezuege.js` + Komponente `Bezuege` | `lib/backoffice/`, `components/Backoffice/Akte/` | rechte Spalte, Zähler, „+ anlegen“ |
| `Akte`-Layout (`AkteKopf`, `Phasenleiste`, `AkteTabs`, `RechteSpalte`) | `components/Backoffice/Akte/` | T5 |
| `Assistent` (Schrittleiste, Fußzeile, idempotente Ausführung) | `components/Backoffice/Assistent/` | T6, A1–A15 |
| `Kalender` (Woche/Monat/Tag, Quellen, Drag) | `components/Backoffice/Kalender/` | T4 (Termine, Montagen, Einsätze, Touren, Abwesenheiten, Social, Events) |
| `HeuteLeiste`, `Aktivitaet` | `components/Backoffice/Zentrale/` | T1 |
| `Suche`-Erkennung (Nummernregister, Präfixe `> # @ €`) | `lib/backoffice/suche.js` | §6 |
| `Benachrichtigungen` (SSE-Client, Glocke-Panel) | `components/Backoffice/Shell/Glocke.js` erweitern | §7 |
| `Konfliktdialog`, `SitzungOverlay`, `Fehlerblock` | `components/Backoffice/` | §11 |
| `Puffer` (IndexedDB, Verschlüsselung, Einspielen) | `components/Backoffice/Kiosk/puffer.js`, `/api/kassa/puffer` | §12 |
| Cache-Tags-Helfer (`tagsFuer(doctype, doc)`), `/api/revalidate` | `lib/backoffice/cache.js`, `app/api/revalidate/route.js` | §9 |
| Druckpanel (`DruckPanel`, Warteschlange) | `components/Backoffice/Druck/` | §10 |

### 14.1 Assistenten-Katalog (A1–A15)

| # | Assistent | Start | Schritte | Ausführung (Server) |
|---|---|---|---|---|
| A1 | Termin anlegen | Anfrage, Kundenakte, Kalender | Kontakt → Terminart/Modus/Berater → freie Zeit (Slot-Raster) → Bestätigung/Mail | `create_termin`-Logik intern, Anfrage → Termin vereinbart |
| A2 | Angebot erstellen | Projekt, Gespräch, Kundenakte | Kunde/Projekt → Positionen (Produkt/Freitext/Alternativ, Planungsleistung) → Konditionen (Zahlungsbedingung, Gültigkeit, Rabatt) → Vorschau | `insert` PH Angebot (+ optional `senden`) |
| A3 | Als AB übernehmen | Angebot Gesendet | Positionen bestätigen (Alternativen wählen) → Zahlungsplan prüfen → Liefertermin → Zusammenfassung | `auftrag_erstellen` |
| A4 | Teilrechnung | AB, Lieferschein | Mengen (gedeckelt geliefert − abgerechnet) → Anzahlung anteilig → Vorschau | `create_partial_invoice` |
| A5 | Herstellerbestellungen erzeugen | AB | Positionen je Lieferant gruppiert → Wunschtermin/Lieferadresse → Bestellweg → Senden? | Dokumentmethode AB |
| A6 | Lieferschein erzeugen | AB, Bestellung | Teilmengen → Lieferart (Abholung/Versand/Tour) → Adresse | `lieferschein_aus_auftrag/_bestellung` |
| A7 | Mahnlauf | Faktura | Vorschlag (Report) → Auswahl → Texte/Stufe → Senden | `PH Mahnung` je Rechnung |
| A8 | Bankumsatz zuordnen | Bank | Vorschlag mit Score → Bezug wählen/suchen → Teilbetrag/Skonto → Buchen | `zuordnen` |
| A9 | Export-Lauf | Faktura Leitung | Zeitraum/Format → Prüfung (Nummernlücken, nicht gestellte) → Erzeugen → Protokoll | `erzeugen` |
| A10 | AB einlesen | Herstellerbestellung Gesendet | AB-Nummer/Datum/Datei → je Position Soll/Ist (Preis, Menge, Termin, Artikel) → Abgleich bewerten | `ab_einlesen`, `ab_abgleich_erzeugen` |
| A11 | Preisliste importieren | Sortiment Leitung | Datei → Zuordnung Spalten → Prüfung (Abweichung > Schwelle) → Übernehmen | Dokumentmethoden |
| A12 | Etikett erzeugen | Lieferschein Gepackt | Pakete prüfen → Tarife (günstigster/schnellster/bevorzugt) → Versicherung → Buchen → PDF | `etikett_erzeugen` |
| A13 | Inventur | Logistik | Lagerort/Umfang → Zählliste → Zählen (Scan) → Differenzen → Freigeben (Leitung) | Dokumentmethoden |
| A14 | Einsatz planen | Servicefall | Techniker/Zeitfenster (Kalender frei) → Adresse/Anfahrt → Ersatzteile mitnehmen → Kunde informieren | `einsatz_planen` |
| A15 | Tagesabschluss | Kassa | Soll-Übersicht → Zählprotokoll (500 € … 1 ct, große Tasten) → Differenz/Grund → Unterschrift → Abschließen (Leitung) | PH Kassenabschluss-Methoden |

Alle Assistenten: letzter Schritt zeigt eine Zusammenfassung mit allen Folgen („erzeugt 1 AB, 1 Anzahlungsrechnung, setzt Projekt auf Auftrag“), Ausführung idempotent (`idempotency_key = <assistent>:<quelle>:<uuid der Sitzung>`), Ergebnisseite mit Links auf alle erzeugten Dokumente und „Weiter mit …“ (nächste Primäraktion).

---

## 15. Bewegung, Dauer, Easing (gilt für alle Seitentypen)

| Element | Animation | Dauer | Easing |
|---|---|---|---|
| Seitenwechsel (Inhalt) | opacity 0→1, kein Verschieben | 120 ms | `cubic-bezier(0.2, 0, 0, 1)` |
| Skeleton → Inhalt | Crossfade | 120 ms | gleich |
| Panel/Drawer (Druckvorschau, Bezüge mobil) | translateX 24 px → 0 + opacity | 200 ms | gleich; schließen 160 ms `ease-in` |
| Dialog/Palette | scale 0,98→1 + opacity | 160 ms | gleich |
| Toast | translateY 8 px → 0 + opacity | 160 ms ein / 120 ms aus | gleich |
| Kanban-Karte Drop | Position weich | 200 ms | `cubic-bezier(0.2, 0, 0, 1)`; Rücknahme bei Fehler 200 ms zurück |
| Statuswechsel (Badge) | Farbwechsel | 200 ms | linear |
| Phasenleiste Fortschritt | Linie füllt | 280 ms | `ease-out` |
| Zahlenwechsel (Kassa Summe) | kein Zählen, sofortiger Wechsel mit 80 ms Hervorhebung | 80 ms | – |
| Verbindungsband | Höhe 0→40 px | 200 ms | gleich |
| Fokusring | sofort | 0 ms | – |

`prefers-reduced-motion: reduce` → alle Dauern 0 ms außer Opacity 80 ms. Keine Bewegung ohne Bedeutung (kein Hintergrundparallax, keine Lade-Spinner länger als 400 ms – danach Skeleton oder Fortschrittsbalken mit Zahl).

---

## 16. Offene Punkte und Anfragen (keine Annahmen im Bau)

| An | Punkt |
|---|---|
| ph_core | `ph_core.api.suche(q, doctypes[], limit)` (Palette, Ranking serverseitig); `ph_core.api.aktivitaet(seit, bereiche[])`; `ph_core.api.benachrichtigungen(seit)`; `PH Geraet`; PIN am User; `revalidate_backoffice(tags)` analog `website.revalidate`; Audit-Eintrag bei CSV-Export |
| ph_crm | `ph_crm.api.kundenakte(kontakt)` (Aggregat wie `auftragsmappe`); Doppelgänger-Erkennung serverseitig; Zusammenführen (merge) als Methode mit Rechteprüfung |
| ph_projekte | `auftragsmappe` um `naechste_schritte[]` (berechnete Primäraktionen) erweitern; Phasen-Eintrittsdaten mit auslösendem Dokument |
| ph_faktura | Status→Projektphase-Kopplung dokumentieren (wer setzt „Abgeschlossen“ nach Schlussrechnung + Abnahme) |
| ph_kassa | Notbetrieb (Klasse B): `erzeuge_beleg(..., quelle="Kassa-Notbetrieb")` akzeptieren, Kassenausfall-Ereignis aus Puffer-Einspielung; Katalog-/Kunden-Cache-Endpunkte (`kassen_katalog(stand)`, `kassen_kunden()`); Steuerberater-Freigabe des Notbeleg-Textes |
| ph_kundenkarte | Kassa-Oberfläche ruft `lookup_card`/`redeem_benefit` (laut README offen) |
| Inhaber | Reihenfolge der Bereiche in der Seitenleiste (Vorschlag §1); 404-gleich bei fehlendem Recht (§8.3); E-Mail-Tagesübersicht ja/nein |
| Fundament | `cacheComponents` einschalten und `force-dynamic` schrittweise durch `"use cache"`-Schichten ersetzen (§9.2); Semaphore 6 in `client.js`; `/api/revalidate` |

---

*Ende 05 – Informationsarchitektur. Nächste Dateien bauen hierauf auf: 06 (Komponentenbibliothek/UI-Kit-Spezifikation), 07 (Kiosk Kassa/Packtisch im Detail), 08 (Akte-Screens je Bereich).*
