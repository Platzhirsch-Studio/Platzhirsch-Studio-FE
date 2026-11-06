# 10 – Konzept Bereich „Zentrale & Querschnitt“ (finale Fassung)

**Zweck:** Verbindliches Funktions- und Oberflächenkonzept für den Bereich Zentrale des Next-Backoffice (`backoffice/`, Port 3100) und für alle Querschnittsbausteine, die jeder Fachbereich erbt: Zentrale je Rolle, Befehlspalette, Suche, Glocke/Freigaben, Aufgaben, Verwaltung (Einstellungen, Benutzer, Geräte, Protokoll, Datenschutz), Arbeitsplatz-Wahl, Hilfe, Tastenkürzel, Druck. Grundlage für den Bau-Agenten: Seiten, Komponenten, Felder, Zustände, Kürzel, Bewegung, Datenmapping auf `ph_core` (+ `PH Aufgabe` aus ph_crm, Frappe-`ToDo`), Akzeptanzkriterien, Bauauftrag (§14).
**Stand:** 2026-11-04 · Rolle: Produktdesigner (Überarbeitung) · Status: finale Fassung nach UX-Kritik `20-kritik-ux-zentrale.md` (P1–P23) und Fachkritik `21-kritik-fach-zentrale.md` (F1–F16, PP1–PP7, R1–R11, P1–P12, K1–K9). Offene Inhaber-Entscheidungen sind in §13 markiert; bis dahin gilt der jeweils genannte Standard.
**Gelesen:** `01`–`05`, `PLAN-NEXT-BACKOFFICE.md`, `20-kritik-ux-zentrale.md`, `21-kritik-fach-zentrale.md`, `Backend-Import/ph_core/README.md` und DocType-JSONs `PH Firma`, `PH Einstellungen`, `PH Betriebsruhe`, `PH API Protokoll`, `PH Geraet`; `ph_core/api/{__init__,geraete,bediener,suche,aktivitaet,health}.py`; Querbezüge (Felder/Rechte/Methoden geprüft am 04.11.): `PH Aufgabe`, `PH Rechnung`, `PH Gutschrift`, `PH Zahlung` (`erstattung_freigeben/_ablehnen`), `PH Eingangsrechnung` (`freigeben/ablehnen`), `PH Servicefall` (`kulanz_freigeben/_ablehnen/_anfordern`), `PH Kassenbeleg`, `PH Kassenabschluss`; ToDo-Erzeuger aller Apps (grep); Fundament `backoffice/src/**` (Dateiliste, Exporte von `actions.js`, `frappe/core.js`, `dashboard.js`, `suche.js`, `auth/rechte.js`, `auth/dal.js`); Next 16.4 Doku `01-getting-started/07-mutating-data.md` (`refresh`, `updateTag`, `revalidatePath`), `16-proxy.md`.
**Verbindlich:** Gestaltung nach 03 (Token `--color-bo-*`, Tinte `#30373e`, Sand `#8a7a66` nur Fläche/Großtext, Sand-Text `accent-text #6b5d4b`, Instrument Sans, Bodoni Moda nur Wortmarke), Bewegung nach §2.5 dieses Dokuments (löst 02/03/04-Widersprüche), Bedienregeln nach 02, Seitentypen nach 05 §2. Frappe bleibt unsichtbar; alle Texte deutsch, Du-Form, keine Frappe-Begriffe („Buchen/Stornieren“ statt Submit/Cancel), keine Superlative, keine Ausrufezeichen.

---

## 0. Kurzfassung

### 0.1 Entscheidungen

| Was | Entscheidung |
|---|---|
| Zentrale = ein ruhiger Arbeitsbeginn je Rolle | `/` zeigt Seitenkopf → Heute-Leiste (Handlungen) → Aufgaben + Zuletzt → Kennzahl-Streifen (Bestände, max. 4 Mitarbeiter / 6 GF) → Aktivität eingeklappt. Leitung/GF: Kennzahlen vor Freigaben + Aufgaben, Charts darunter. Regel **„eine Zahl, ein Ort“**. Keine Konfiguration durch Benutzer. |
| Feste Primäraktion je Rolle | Tinte-Knopf rechts im Seitenkopf aus `SCHNELLAKTIONEN` je Rolle (Verkauf „Neue Anfrage“, Faktura „Neue Rechnung“, sonst „Neue Aufgabe“); daneben Sekundärknopf „Neu ▾“. Gelernt wird nur in der Palette-Gruppe „Vorschläge“. |
| Ein Eingabefeld für alles | Palette `Strg+K`: Datensätze zuerst, Enter wartet bis 600 ms auf den ersten Treffer. Präfixe `>` `#` `@` `?` `/` als Token-Chip; Beträge per Muster (`3.744,00`, `3744 €`, `CHF 1200`). |
| Aufgaben = eine Liste aus zwei Quellen | `PH Aufgabe` (anlegbar) + Frappe-`ToDo` der Fach-Apps (Kennzeichen „System“) in einer Liste. Anlegen nur, wo `create` auf `PH Aufgabe` besteht; sonst kein Knopf (nie Schein-Aktion). |
| Freigaben mit Vier-Augen-Regel | Glocke + Zentrale-Kachel zeigen Freigaben mit Antragsteller; eigener Antrag → Knopf gesperrt mit Grund. Geldwirksam → Bestätigen-Dialog mit Betrag. Ablehnen mit Grund, 8 s verzögertes Senden. |
| Verwaltung als ein Ort | Seitenleiste Zentrale: Dashboard · Aufgaben · Verwaltung. `/verwaltung` = Hub mit Karten Benutzer · Geräte · Einstellungen · Protokoll · Druck · Datenschutz (je nach Recht). |
| Ein Speichermodell je Fläche | Einstellungen: Speicherleiste; Schalter mit Außenwirkung (Testmodus, Website-API) sind eigene Aktionen mit Rückfrage. Benutzerakte: alles wirkt sofort mit Rückgängig 8 s, PIN im Dialog, kein Speichern-Knopf. |
| Testmodus ehrlich | Rückfrage nennt die echte Wirkung (Mails umgeleitet, Vermerk TEST, Kartenzahlung simuliert, Belege weiterhin signiert). Auf der Produktiv-Site: Pflichtgrund + rotes, nicht wegklickbares Band. |
| Zahlen buchhalterisch richtig | „Umsatz Monat (netto)“ aus Rechnungen − Gutschriften + Kassenabschluss; „Zahlungseingang Monat“ getrennt; alles in EUR; Anzahlungen getrennt ausgewiesen. |
| Rechte eng | Geräte registrieren je Typ nur die passende Leitung; fremde PIN nur für Mitarbeiter des eigenen Bereichs ohne Leitungs-/Admin-Rolle; `aktiv` am Gerät nur über Sperren/Entsperren. |
| Kein Mitarbeiter-Monitoring ohne Rechtsgrundlage | Person-Filter im Aktivitätsstrom, Team-Erledigt-Chart und `last_active` für Leitung sind aus, bis `mitarbeiterauswertung_freigegeben` mit Rechtsgrundlage gesetzt ist. Abwesenheiten erscheinen ohne Art/Begründung; Krankenstand nie als Freigabe. |
| Pflichtprozesse | Fristen-Chips (UVA, OSS, RKSV-Jahresbeleg, SEE-Ausfall, DEP, Datenschutz, Erstattung), Datenschutzanfragen, Austritt (Assistent Z5), Vertretung, Betriebsbereitschaft (Admin). |
| Hilfe an einer Stelle | Knopf `?` in der Kopfzeile zwischen Glocke und Avatar; Panel 480 px; Kürzel-Dialog `Strg+/`. |
| Bedienbar ohne Maus, ohne Wischen, mit Sprachsteuerung | Kürzel-Register ohne Doppelbelegung (Unit-Test); Schalter „Einzeltasten-Kürzel“ (WCAG 2.1.4); jede Wischgeste hat ein sichtbares Ziel (WCAG 2.5.1). |

### 0.2 Leitregeln für diesen Bereich (gelten für jeden Bau-Schritt)

1. **Eine Zahl, ein Ort.** Was in der Heute-Leiste steht, erscheint nicht als Kennzahl und nicht als zweite Kachel.
2. **Was nicht geht, wird nicht gezeigt** (fehlendes Recht) – oder zeigt seinen Grund als sichtbaren Satz (fehlende Voraussetzung). Tooltips sind nie die einzige Quelle.
3. **Rückgängig vor Rückfrage**, außer bei Geld, Recht, Außenwirkung, Sicherheit (Token, Sperre, Deaktivierung, Standardfirma).
4. **Keine Bewegung unter dem Zeiger:** Zeilen, die durch eine Aktion aus dem Filter fallen, bleiben für die Undo-Dauer stehen.
5. **Keine erfundenen Werte:** ohne Daten „–“ mit sichtbarer Fußzeile „Noch keine Werte“; Beispielwerte nur im Mock mit Testband.
6. **Jede gespeicherte Vorliebe ist je Benutzer getrennt** (`ph-bo:<user-hash>:…`), am geteilten Showroom-PC sieht niemand die Spuren anderer.

---

## 1. Nutzer und Top-Aufgaben (neu gezählt)

Zählregel: jeder Klick/Tipp und jedes Enter zählt; Navigation zu einer Unterseite zählt; Tippen in Felder zählt nicht; `Strg+K` + Text + Enter = „1 K“. Abnahme Z-41 misst jede Zeile als Klickfolge; Ziel und Weg müssen übereinstimmen. Spalte „gilt ab“: Voraussetzung außerhalb der Zentrale.

### 1.1 Alle Mitarbeiter (jede PH-Rolle außer `PH Website Integration`)

| Top-Aufgabe | Ziel | Weg | gilt ab |
|---|---|---|---|
| Was ist heute dran? | **0** | Zentrale: Heute-Leiste + „Meine Aufgaben“ im ersten Bildschirm (auch iPad hoch, Wireframe §3.2.3) | sofort |
| Datensatz öffnen | **1 K** | Palette → tippen → Enter (öffnet Datensatz 1, Enter-Puffer §3.3) | sofort |
| Aufgabe erledigen | **1** | Häkchen in der Aufgabenzeile (Zeile bleibt 8 s, Rückgängig) | sofort (ToDo); PH Aufgabe ab Anfrage A1 für Nicht-CRM |
| Aufgabe aus Datensatz anlegen | **2** | Akte → Knopf „Aufgabe“ → Titel → Enter (Fällig morgen, Zuständig ich) | CRM/GF/Admin sofort; übrige nach A1 |
| Aufgabe an Kollegin geben | **2** | Zuständig-Zelle → Name | wie oben |
| Benachrichtigung lesen und zum Objekt | **2** | Glocke → Eintrag | sofort |
| Zuletzt geöffneten Datensatz öffnen | **1** | Zentrale „Zuletzt“ → Zeile | sofort |
| Hell/Dunkel oder Dichte umschalten | **2** | Avatar → Segment | sofort |
| Hilfe zur Seite | **1** | Knopf `?` in der Kopfzeile oder Taste `?` | sofort |
| Alle Kürzel nachschlagen | **1** | `Strg+/` | sofort |
| Arbeitsplatz wechseln | **2** | Avatar → Menüpunkt „Kassa“ (im offenen Menü auch `1–5`) | sofort |
| Eigene PIN ändern | **3** | Avatar → „Meine PIN ändern“ → (PIN zweimal tippen) → Speichern | sofort |

### 1.2 Bereichsleitung und Geschäftsführung

| Top-Aufgabe | Ziel | Weg | gilt ab |
|---|---|---|---|
| Lage heute | **0** | Zentrale in Leitungs-/GF-Sicht | sofort |
| Freigabe nicht geldwirksam (Urlaubsantrag, Tour, Planung) | **1** | Zentrale-Kachel „Freigaben“ → Genehmigen/Freigeben (Undo 8 s) | sofort |
| Freigabe geldwirksam (Erstattung, Kulanz, Eingangsrechnung) | **2** | Zentrale-Kachel → Freigeben → Bestätigen (Dialog mit Betrag) · über Glocke **3** | Vier-Augen serverseitig ab A4 |
| Aufgabe mit Frist delegieren | **2** | Inline-Zeile „Aufgabe hinzufügen …“ antippen → `Text @lena +3` → Enter | wie 1.1 |
| Überfällige Team-Aufgaben sehen | **1** | Heute-Chip „Team: n überfällig“ | sofort |
| Aktivität eines Bereichs prüfen | **3** | Verwaltung → Protokoll (Reiter Aktivität vorausgewählt) → Bereichs-Chip | sofort |
| Neues Gerät einrichten | **4** | Verwaltung → Geräte → „Gerät registrieren“ → (Name, Typ, Standort) → Registrieren | sofort |
| Verlorenes Gerät sperren | **5** oder **1 K + 2** | Verwaltung → Geräte → `⋯` → Sperren → (Grund) → Sperren · oder Palette „iPad Kassa“ → Akte → Sperren → Sperren | sofort; am Telefon ebenso (§8.2) |
| Bediener-PIN für Mitarbeiter setzen | **5** oder **1 K + 2** | Verwaltung → Benutzer → Person → „PIN neu setzen“ → Speichern | Zielprüfung serverseitig ab A3 |
| Frist prüfen (UVA, Erstattung, Datenschutz) | **1** | Heute-Chip → gefilterte Liste | Chips nach §6.3 |

### 1.3 Backoffice-Admin

| Top-Aufgabe | Ziel | Weg |
|---|---|---|
| Neue Mitarbeiterin anlegen | **6** | Verwaltung → Benutzer → „Benutzer anlegen“ → (Name, E-Mail) Profil-Karte wählen → Weiter → Anlegen |
| Rolle ergänzen | **5** oder **1 K + 3** | Verwaltung → Benutzer → Person → „+ Rolle“ → Rolle |
| Testmodus schalten | **4** | Verwaltung → Einstellungen (Allgemein) → Schalter → Bestätigen |
| Schließtag eintragen | **6** | Verwaltung → Einstellungen → Kalender → „+ Tag“ → Datum → Speichern |
| API-Fehler 24 h sehen | **1** | Admin-Kachel „Integration“ → Zahl |
| Betriebsbereitschaft prüfen | **0** | Admin-Kachel „Betriebsbereitschaft“ auf der Zentrale |
| Nummernkreise nachsehen | **3** | Verwaltung → Einstellungen → System |
| Testseite drucken | **4** | Verwaltung → Druck → Drucker → „Testseite“ |
| Mitarbeiter austragen | **4 + Wahl** | Verwaltung → Benutzer → Person → `⋯` → „Austragen …“ (Assistent Z5) |

### 1.4 Steuerberater extern (`PH Buchhaltung extern`)

| Top-Aufgabe | Ziel | Weg |
|---|---|---|
| Einstieg | **0** | Zentrale: drei große Kacheln (Export-Läufe, Offene Posten, Kassenbuch) + Fristen-Chips UVA/OSS; keine Aufgaben, keine Aktivität |
| Beleg zu Buchung finden | **1 K** | Palette → Nummer → Enter (DocTypes explizit begrenzt, §3.3) |

### 1.5 Kiosk-Rollen (`PH Kassa Mitarbeiter`, `PH Logistik Mitarbeiter`, `PH Montage`, `PH Techniker`)

| Top-Aufgabe | Ziel | Weg |
|---|---|---|
| Nach Login am Arbeitsplatz | **0** | registriertes Gerät → Kiosk; sonst `/arbeitsplatz` mit Vorauswahl → Enter (**1**) |
| Bedienerwechsel | **3** | „Wechsel“ → Kachel → PIN → OK |
| Hilfe am Kiosk | **1** | Hilfe-Knopf 48 px in der Kiosk-Kopfzeile (zweiter Weg `F1`) |
| Anderen Arbeitsplatz am Kiosk-Gerät öffnen | **3** | Tipp auf Arbeitsplatznamen → „Arbeitsplatz wechseln …“ → Kachel (nur Benutzer mit > 1 Arbeitsplatz) |

### 1.6 Selbstservice (`PH Personal Selbstservice` allein)

Zentrale: Heute-Leiste (eigene Abwesenheit/Zeit), Kachel „Meine Zeiten“ mit großem Kommen/Gehen-Knopf, „Mein Urlaub“, Aufgaben an mich (ToDo/PH Aufgabe). Keine Kennzahlen anderer Bereiche, keine Aktivität.

---

## 2. Bereichsstruktur

### 2.1 Routen

| Route | Typ (05 §2) | Quelle | Rollen (Mindestrecht) | Fundament heute |
|---|---|---|---|---|
| `/login` | Formular | Frappe `login` (+ OTP) | alle | vorhanden |
| `/arbeitsplatz` | Kachelwahl | `erlaubteArbeitsplaetze(session)` | alle | vorhanden (ohne `1–5`, ohne Vorauswahl) |
| `/wechsel` | Kiosk-Formular | `list_operators`, `verify_pin` | Kiosk | vorhanden |
| `/` | T1 Zentrale | §3.2, §6 | alle | Referenz ohne Rollenvarianten |
| `/aufgaben` (`?ansicht=karten`, `?sicht=meine\|team\|alle`) | T2/T3 | `PH Aufgabe` + `ToDo` | alle (eigene), Leitung/GF/Admin (Team/Alle) | nur `/d/ph-aufgabe` |
| `/aufgaben/[name]` | T5 | `PH Aufgabe` | Leserecht | generisch |
| `/benachrichtigungen` | Liste | §3.5 | alle | fehlt |
| `/suche?q=` | Liste | wie Palette | alle | fehlt (`/api/suche` vorhanden) |
| `/verwaltung` | Hub | Zähler je Karte | Admin, GF, jede Leitung | fehlt |
| `/protokoll` (`?tab=aktivitaet\|api\|fehler\|anmeldungen`) | T2 | §3.8 | Aktivität: Leitung/GF/Admin; API: Admin/GF; Fehler/Anmeldungen: Admin, GF (Anmeldungen Externer lesend) | nur API |
| `/einstellungen` (`?tab=firma\|allgemein\|website\|kalender\|system`) | T9 | `PH Firma`, `PH Einstellungen` | Admin schreibt; GF schreibt Firma; GF liest Rest | ein Formular |
| `/benutzer`, `/benutzer/neu`, `/benutzer/[name]`, `/benutzer/ich` | T2/T5 | `User`, `Role Profile`, `ph_core.api.bediener.*` | Admin; Leitung lesend + PIN eigener Bereich; jeder das eigene Profil | Liste mit Rollen-Chips |
| `/geraete`, `/geraete/neu`, `/geraete/[name]` | T2/T5 | `PH Geraet`, `ph_core.api.geraete.*` | Admin; Kassa-/Logistik-/Projekte-/Service-Leitung (je Typ, §3.11); GF lesend | nur `/geraet` |
| `/geraet` | T9 dieses Gerät | Cookie `ph_bo_geraet`, `verify_device` | alle | vorhanden |
| `/druck` (`?tab=warteschlange\|formate\|drucker`) | T9 | §3.14 | Warteschlange: alle; Formate/Drucker: Admin/Leitung | fehlt |
| `/druck/[doctype]/[name]` (+ `/pdf`) | Druckansicht | `getPdf` | `print` | vorhanden |
| `/datenschutz`, `/datenschutz/[name]` | T2/T5 | `PH Datenschutzanfrage` (Anfrage A8) | GF, Admin; CRM Leitung lesend | fehlt; baut erst nach A8 |
| `/hilfe`, `/hilfe/[bereich]/[seite]` | Lesen | Markdown `backoffice/hilfe/**` | alle | fehlt |
| `/kein-zugriff`, `not-found` | Hinweis | – | alle | vorhanden |

### 2.2 Navigation

Seitenleiste, Bereich „Zentrale“ (max. 3 Einträge, 02 §2.1):

```js
{ titel: "Dashboard", href: "/" },
{ titel: "Aufgaben", href: "/aufgaben" },
{ titel: "Verwaltung", href: "/verwaltung", recht: "admin|gf|leitung" },
```

- **Benachrichtigungen** erreichbar über Glocke → „Alle anzeigen“ und `G B`.
- **Druck** erreichbar über Drucker-Status (Kiosk-Kopfzeile, Fehlerband, Toast „1 Druckauftrag wartet · Öffnen“), `G D` und Karte in `/verwaltung`.
- **Hilfe** nur in der Kopfzeile (`?`-Knopf) und im Benutzer-Menü (gleiches Ziel); nicht in Seitenleiste oder Seitenkopf.
- `ROUTEN`-Register (05 §3): `PH Aufgabe → /aufgaben`, `ToDo → Bezugsobjekt (reference_type/name)`, `PH Geraet → /geraete`, `PH Firma → /einstellungen?tab=firma`, `PH Einstellungen → /einstellungen`, `PH API Protokoll → /protokoll?tab=api`, `User → /benutzer`, `PH Datenschutzanfrage → /datenschutz`.

`/verwaltung` (Hub):

```
┌ Zentrale › Verwaltung ───────────────────────────────────────────────────────────────┐
│ Verwaltung                                                                           │
│ Benutzer & Rollen           Geräte                       Einstellungen               │
│ 14 aktiv · 2 ohne PIN       5 Geräte · 1 lange nicht     Firma · Allgemein · Website │
│                             gesehen                      Kalender · System            │
│ ───────────────────────────────────────────────────────────────────────────────────  │
│ Protokoll                   Druck                        Datenschutz                  │
│ 3 API-Fehler 24 h           1 Auftrag wartet             1 Anfrage · Frist 12.11.     │
└──────────────────────────────────────────────────────────────────────────────────────┘
```
Karten = Links mit Titel 14/500, Zähler 13 `muted` (aus je einem `count`; Fehler → Zähler entfällt, Karte bleibt). Haarlinien statt Rahmen. Nur Karten mit Recht. Zahlen oben sind Darstellungsbeispiele.

### 2.3 Statusmodell und Farbton (StatusBadge, 03 §1.5)

| Objekt | Status | Ton | Form |
|---|---|---|---|
| PH Aufgabe | Offen / In Arbeit / Erledigt / Verworfen | `orange` / `blau` / `gruen` / `grau` | Punkt / Punkt / Haken / Ring |
| | überfällig (abgeleitet `faellig < heute`, Status offen) | Datum `danger-text` + Text „vor n Tagen“ + `sr-only` „überfällig“ | – |
| ToDo (System) | Open → wie Offen; Closed → Erledigt; Cancelled → Verworfen | wie oben + Kennzeichen „System“ (`neutral-soft`) | – |
| PH Geraet | Aktiv / Gesperrt / Nicht eingerichtet (`token_vorhanden=0`) / Lange nicht gesehen (> 24 h) | `gruen` / `rot` / `orange` / `grau` | Haken / Dreieck / – / – |
| PH API Protokoll | OK, Wiederholt / Fehler, Abgelehnt / Rate-Limit | `gruen`, `grau` / `rot` / `orange` | |
| User | Aktiv / Deaktiviert; PIN gesetzt | `gruen` / `grau`; Kennzeichen „PIN“ `accent-soft` | |
| Benachrichtigung | ungelesen / gelesen | Punkt 8 px `info` + fette Zeile + `sr-only` „ungelesen“ / normal | |
| Freigabe | offen / eigener Antrag / erledigt | `orange` / `grau` mit Satz „Eigener Antrag – zweite Person nötig“ / `gruen` „Freigegeben von dir 09:14“ | |
| PH Datenschutzanfrage | Eingegangen / In Bearbeitung / Beantwortet / Abgelehnt; Frist ≤ 7 Tage | `orange` / `blau` / `gruen` / `grau`; Frist `danger-text` | |

### 2.4 Kürzel-Register (Quelle `src/lib/backoffice/kuerzel.js`)

Windows-Schreibweise; Mac ersetzt `Strg` durch `⌘` (Auflösung in `kuerzel.js`, nie im Text hart kodiert). **(E)** = Einzeltaste, wirkt nie in Eingabefeldern und ist über den Schalter „Einzeltasten-Kürzel“ abschaltbar.

| Kontext | Taste | Wirkung |
|---|---|---|
| global | `Strg+K` | Palette |
| global | `/` (E) | Suche des Kontexts: in Listen Filterfeld, sonst Palette |
| global | `?` (E) | Hilfe-Panel, Reiter „Artikel“; zweites `?` schließt |
| global | `Strg+/` | Alle Tastenkürzel (Dialog) |
| global | `G` + Buchstabe (E) | Gehe zu: `Z` Zentrale · `C` CRM · `P` Projekte · `F` Faktura · `L` Logistik · `S` Shop · `K` Kassa-Verwaltung · `V` Service · `H` Kundenkarte · `A` Aufgaben · `B` Benachrichtigungen · `E` Einstellungen · `D` Druck · `W` Verwaltung. Nach `G` erscheint sofort unten links eine Zeile mit allen Zielen (12 px, `surface-inverse`), Fenster 1,5 s |
| global | `N` (E) | Neu-Menü öffnet **sofort**, Einträge mit Buchstaben (`A` Aufgabe, …); zweiter Buchstabe wählt |
| global | `Strg+Z` und `Z` (E) | Rückgängig des jüngsten Toasts **mit** Rückgängig-Knopf |
| global (nur Backoffice-Shell) | `F8` | Fokus auf jüngsten Toast |
| global | `Strg+B`, `[` `]` (E) | Seitenleiste ein/aus |
| global | `Esc` | schließt oberste Ebene; zweites `Esc` hebt Listen-Auswahl auf |
| Zentrale | `R` (E) | Kacheln neu laden |
| Zentrale | `1–6` (E) | Kennzahl fokussieren, `Enter` öffnet Liste |
| Liste | `↑↓`, `Enter`, `X` Auswahl, `A` Zuweisen, `S` Status, `D` Fällig, `C` Kommentar (alle E) | |
| Aufgabenliste/-akte | `Strg+Enter` | Erledigen (Primär der Zeile/Akte) |
| Akte | `E` (E) | Bearbeiten / erstes Feld |
| Akte | `Alt+↑/↓` | vorige/nächste der Liste |
| Akte | `Strg+P` | Druckvorschau |
| Karten (Kanban) | `←→↑↓` Fokus, `M` (E) Verschieben-Menü, `Shift+←/→` verschieben | |
| Palette | `↑↓`, `Enter`, `Strg+Enter` neuer Tab, `Tab` nächste Gruppe, `→` Vorschau (nur Cursor am Textende), `Backspace` auf leerem Feld entfernt Token | Fehlerzeile: `Enter` = Erneut |
| Glocke | `↑↓`, `Enter`, `←→` Reiter, `R` (E) gelesen, `Shift+R` alle gelesen (mit Rückgängig), `F` (E) Freigeben | |
| Arbeitsplatz-Wahl | `1–5` startet sofort, `Enter` startet Vorauswahl | |
| Benutzer-Menü offen | `1–5` Arbeitsplatz | |
| Kiosk | `F1` Hilfe, `F11` Vollbild, `F12` Bedienerwechsel; Kassa/Packtisch `F2–F10` nach 02 §9.5 | `Strg+L`, `F8`, `F9` sind im Kiosk **nicht** belegt |

Gestrichen gegenüber Vorfassung: `.`-Menü (Aktionen über `⋯` und Palette `>`), `p`, `E` = Erledigt, `R` in der Palette, `Strg+L`, Kiosk-`F9` für Druck. Unit-Test „keine Doppelbelegung je Kontext“ (Kontexte: global, zentrale, liste, karten, akte, palette, glocke, arbeitsplatz, kiosk-kassa, kiosk-packtisch, kiosk-mobil).

**Schalter „Einzeltasten-Kürzel“** (Benutzer-Menü und Profil → Einstellungen; Standard an): aus → nur `Strg`-/`F`-Kürzel und `Esc` wirken; Tooltips, Palette und Kürzel-Dialog blenden Einzeltasten aus. Speicherung wie Dichte (§3.15).

### 2.5 Bewegung und Querschnittswerte (Festlegung; 02/03/04 ziehen nach)

Quelle: `src/lib/backoffice/motion.js` (Token) + CSS-Variablen `--bo-dur-*`, `--bo-ease-out: cubic-bezier(.2,.8,.2,1)`, `--bo-ease-in: cubic-bezier(.4,0,1,1)`.

| Baustein | Öffnen | Schließen | Sonst |
|---|---|---|---|
| Toast | 160 ms `ease-out`, `translateY(8px)→0` + Opazität | 120 ms `ease-in` | Position unten rechts (Desktop), oben Mitte (Kiosk); Undo-Dauer **8 s**; Warn-Toast mit Handlungsbedarf (Sitzung) bleibt bis zur Handlung |
| Palette | 140 ms, `scale(.985)→1` + Opazität; Scrim 0,4 in 160 ms | 120 ms | Ergebnisliste wechselt ohne Animation |
| Dialog | 160 ms `scale(.98)→1` | 120 ms | |
| Sheet (Hilfe, Druckvorschau, Protokolleintrag) | 200 ms `translateX(16px)→0` | 120 ms | |
| Popover/Menü | 120 ms `opacity + translateY(-4px)` | ohne Animation | |
| Tooltip | Verzögerung 400 ms, in Gruppe danach 0 ms | – | |
| Kennzahl | Hochzählen 400 ms nur bei Änderung nach Mount | – | |
| Chart | Zeichnen 240 ms (Balken) / 400 ms (Linie) beim ersten Erscheinen | – | Zeitraumwechsel: Abdunklung 3.1.3 |
| Inline-Speichern | Häkchen 600 ms | – | |
| Erledigt-Zeile | bleibt 8 s, dann Kollaps `grid-template-rows 1fr→0fr` 160 ms `ease-in` | – | |
| Glocke-Zähler | Pop `scale 1→1.15→1` 240 ms nur bei Zunahme nach Mount | – | |
| PIN falsch | Shake 240 ms (`translateX ±6px`, 3 Zyklen) | – | |
| `prefers-reduced-motion` | nur Opazität ≤ 120 ms; kein Shake (Rahmen `danger` + Text), kein Kollaps (Zeile sofort weg, Fokus auf nächste, Live-Region) | | |

Undo-Technik: **Gegenaktion**, wo es eine gibt (Status, Zuweisung, Rolle, Gelesen, Profil, Entsperren). **Verzögertes Senden (8 s)** nur, wenn Dritte benachrichtigt werden (Ablehnen einer Freigabe, Mails).

---

## 3. Seiten

Jede Seite: `requireSession()` zuerst; `export const dynamic = "force-dynamic"`; Skeleton erst nach 300 ms; Leer-/Fehlerzustand nach 02 §7; Titel „`<Seite>` · Zentrale · Platzhirsch Backoffice“.

### 3.1 `/arbeitsplatz`

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                              Platzhirsch      (Bodoni Moda 24, tracking .12em) │
│                              Backoffice       (13 muted)                       │
│                 Guten Morgen, Anna. Wo arbeitest du heute?                     │
│  ┌ ZULETZT ────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│  │ ▦ Backoffice│ │ ▤ Kassa    │ │ ▥ Packtisch│ │ ⚒ Montage  │ │ 🔧 Technik │  │
│  │ Listen,     │ │ Verkauf am │ │ Liefer-    │ │ Aufträge,  │ │ Einsätze,  │  │
│  │ Akten       │ │ Tresen     │ │ scheine    │ │ Fotos      │ │ Ersatzteile│  │
│  │          [1]│ │         [2]│ │         [3]│ │         [4]│ │         [5]│  │
│  └─────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
│  Dieses Gerät: iPad Kassa 1 · Showroom Lochau · startet direkt in Kassa [Ändern]│
│                     Anmelden als jemand anderes · Abmelden                     │
└───────────────────────────────────────────────────────────────────────────────┘
```

640–1023 px: 3 + 2 zentriert (Wireframe):
```
  ┌ ZULETZT ─────┐ ┌──────────────┐ ┌──────────────┐
  │ Backoffice 1 │ │ Kassa      2 │ │ Packtisch  3 │
  └──────────────┘ └──────────────┘ └──────────────┘
         ┌──────────────┐ ┌──────────────┐
         │ Montage    4 │ │ Technik    5 │
         └──────────────┘ └──────────────┘
```

- Raster `repeat(auto-fit, minmax(168px, 1fr))`, max. 5 Spalten; < 640: Liste, Höhe 96, Icon links. Kachel Radius 16, Icon 32 (lucide `layout-dashboard`, `receipt`, `package`, `hammer`, `wrench`), Titel 16/500, Satz 12 `muted`, `<kbd>` unten rechts.
- Nur Kacheln aus `erlaubteArbeitsplaetze(session)`; genau 1 → Weiterleitung ohne Seite.
- Vorauswahl: Cookie `ph_bo_arbeitsplatz` → Kicker „ZULETZT“ in `accent-text` (`#6b5d4b`, ≥ 4,5:1), `aria-current="true"`, Fokus beim Laden.
- Taste `1–5`: Fokusring 120 ms sichtbar, dann Start. `Enter`: Start der Vorauswahl.
- „Dieses Gerät“: nur mit Cookie `ph_bo_geraet` und `verify_device` ok. Gesperrt (`forbidden {gesperrt}`): Band `danger-soft` „Dieses Gerät ist gesperrt. Grund: … Leitung fragen.“ (Grund ab Anfrage A9, vorher ohne Grund); Kiosk-Kacheln `aria-disabled` mit Satz „Gerät gesperrt“ in der Kachel.
- Leer (0 Kacheln): Icon `lock`, „Für deine Rollen ist kein Arbeitsplatz freigegeben.“ + Knopf „Wen frage ich?“ (Popover: Name, Telefon, E-Mail der ersten Admin-Person aus `Has Role` + `User.phone`; „Link kopieren“) + Abmelden.
- Fehler `?fehler=1`: Band `warning-soft` „Dieser Arbeitsplatz ist für deine Rollen nicht freigegeben.“
- Hover: `translateY(-2px)` + Rand `line-strong` 120 ms; keine Eintrittsanimation.
- Registriertes Gerät startet direkt im Kiosk; zurück ins Backoffice über Kiosk-Kopfzeile → Arbeitsplatzname → „Arbeitsplatz wechseln …“ (§8.3).

### 3.2 `/` – Zentrale

#### 3.2.1 Mitarbeiter (Beispiel Verkauf, 1280 × 800)

```
┌ [☰] Zentrale                     [ Suchen oder Befehl …  Strg K ] [🔔 3] [?] [AB ▾] ┐ 56
├────────────────────────────────────────────────────────────────────────────────────┤
│ Guten Morgen, Anna.                                      [Neu ▾]  [Neue Anfrage]   │ 20/500
│ Mittwoch, 4. November 2026 · Verkauf                                               │ 13 muted
│                                                                                    │
│ Heute  (● 1 überfällig) (3 Termine · nächster 10:00) (2 Anfragen neu)              │ Chips 32
│ ────────────────────────────────────────────────────────────────────────────────── │
│ Meine Aufgaben   Meine | Team                      │ Zuletzt · Angeheftet          │ 14/500
│ ☐ Angebot AN-2026-00031 nachfassen  Angebot vor 2 T│ ★ P-26-0042 Küche Fam. Muster │ 40
│ ☐ Rückruf Fam. Huber Liefertermin   Projekt  heute │   AB-2026-00017 ● In Bestellung│
│ ☑ Muster an Küchenstudio senden   Erledigt · Rückgängig │ Fam. Huber · Kontakt gest.│
│ ☐ Lieferschein prüfen   [System]    Lieferschein Fr│   …                  Alle →   │
│ [ Aufgabe hinzufügen …  @Name  +3              ↵ ] │                               │
│                                       Alle (12) → │                               │
│ ────────────────────────────────────────────────────────────────────────────────── │
│ OFFENE ANFRAGEN │ ANGEBOTE GESENDET │ AUFTRÄGE OFFEN │ SERVICEFÄLLE                │ 88
│ 12   ▲ 2 seit gestern │ 7           │ 4              │ –  Noch keine Werte         │
│ ────────────────────────────────────────────────────────────────────────────────── │
│ ▸ Letzte Änderungen im Bereich                                                     │ eingeklappt
└────────────────────────────────────────────────────────────────────────────────────┘
```
Zahlen und Namen sind Darstellungsbeispiele, keine Betriebswerte. Welche vier Kennzahlen ein Bereich zeigt, liefert `lib/backoffice/<bereich>/kennzahlen.js` (Fachkonzept); ohne passende Kennzahl bleibt der Streifen kürzer.

#### 3.2.2 Geschäftsführung (1280 × 800)

```
│ Guten Morgen, Name.                                      [Neu ▾]  [Neue Aufgabe]   │
│ Mittwoch, 4. November 2026 · Geschäftsführung                                      │
│ Heute (● 2 Freigaben) (● Erstattung fällig 1) (● Abschluss offen gestern) (UVA 15.11.) │
│ ────────────────────────────────────────────────────────────────────────────────── │
│ UMSATZ MONAT NETTO │ ZAHLUNGSEINGANG │ OFFENE POSTEN │ ANFRAGEN OFFEN │ SERVICE │ KASSA HEUTE │
│ 0,00 €             │ 0,00 €          │ 0,00 €        │ 0              │ 0       │ 0,00 €     │
│ Vormonat: …        │ davon Anz. …    │ n Rechn. · m überf. │ ▲ …     │ n Fristen│ n Belege  │
│ ────────────────────────────────────────────────────────────────────────────────── │
│ Freigaben (2)                                  │ Meine Aufgaben | Team             │
│ Kulanz 180,00 € · PH-SRV-… · A. Berger         │ …                                 │
│                          [Ablehnen] [Freigeben]│                                   │
│ Urlaubsantrag L. B. 12.–16.12.                 │                                   │
│                          [Ablehnen] [Genehmigen]│                                  │
│ ────────────────────────────────────────────────────────────────────────────────── │
│ Umsatz netto je Monat (6 M | 12 M)             │ Anfragen je Woche (8 W | 12 W)    │
```
Werte „0,00 €“ sind Platzhalter der Darstellung. Freigeben/Genehmigen/Ablehnen sind Sekundärknöpfe (Umrandung); Primäraktion bleibt oben rechts.

#### 3.2.3 iPad hoch (820 × 1180)

```
│ Guten Morgen, Anna.                [Neue Anfrage] │
│ Heute (● 1 überfällig) (3 Termine) (2 Anfr.) →    │ Chips horizontal scrollbar
│ Meine Aufgaben                                    │
│ (☐) Angebot AN-…31 nachfassen        vor 2 Tagen │ Ziel 44 × 44
│ (☐) Rückruf Fam. Huber                    heute  │
│ [ Aufgabe hinzufügen …                       ↵ ] │
│ OFFENE ANFRAGEN 12   │ ANGEBOTE GESENDET 7       │ 2 × 2
│ AUFTRÄGE OFFEN 4     │ SERVICEFÄLLE –            │
│ Zuletzt · Angeheftet                              │
│ ▸ Letzte Änderungen                               │
```

#### 3.2.4 Zonen

| Zone | Inhalt | Regeln |
|---|---|---|
| Seitenkopf | Zeile 1: „Guten Morgen/Tag/Abend, <Vorname>.“ 20/500; Zeile 2: Wochentag, Datum · Profilname ohne „PH “ (aus `role_profile_name`, Rückfall erste Rolle) 13 `muted`. Rechts: Sekundär „Neu ▾“ (alle erlaubten Schnellaktionen mit Buchstaben, = `N`), Primär fest je Rolle. | Primär-Zuordnung in `zentrale/layout.js` (`PRIMAER_JE_PROFIL`). Ohne `create` für die Primäraktion → nächste erlaubte; ohne jede → kein Primärknopf. |
| Heute-Leiste | Chips (32 px, Radius 16) nur mit Wert > 0, max. 6 + „+n“: Rot (überfällig, Fristen ≤ 2 Tage) → Sand-Fläche (heute) → neutral (Hinweise). Quellen §6.3. | Chip = Link mit identischem Filter (Zähler stimmt mit Liste überein). Leer: „Heute nichts Fälliges.“ `muted`, Höhe 40 bleibt. Tooltip bei Fristen-Chips nennt Rechtsgrundlage in einem Satz **und** dieselbe Angabe steht in der Zielliste als Band. |
| Aufgaben (links 2/3) | 5 nächste aus PH Aufgabe + ToDo (§3.6.1), überfällig zuerst, dann `faellig asc`. Titel folgt dem Umschalter („Meine Aufgaben“ / „Team-Aufgaben“; Team nur Leitung/GF). Zeile: Häkchen (Ziel 24 × 24 Desktop, 44 × 44 Touch, `aria-label="Erledigen: <Titel>"`) · Titel · Bezug-Chip · Fällig relativ · Kennzeichen „System“ bei ToDo. Unten: Inline-Zeile „Aufgabe hinzufügen … @Name +3“ (nur mit `create` auf PH Aufgabe), „Alle (n) →“. | Erledigen: Zeile bleibt 8 s durchgestrichen mit „Erledigt · Rückgängig“, danach Kollaps 160 ms; die 6. Aufgabe rückt erst danach nach. Leer: Häkchen-Icon 32, „Alles erledigt.“. Ohne Aufgabenrecht und ohne ToDos: „Keine Aufgaben an dich.“ |
| Zuletzt · Angeheftet (rechts 1/3) | ★ zuerst, dann 8 zuletzt geöffnete (Titel, Nummer, Status-Badge, relative Zeit). | Quelle localStorage `ph-bo:<user-hash>:zuletzt` (max. 50); geräteübergreifend ab Anfrage A6. Leer: „Hier erscheinen Datensätze, die du öffnest. Mit ★ heftest du sie dauerhaft an.“ |
| Kennzahl-Streifen | Ein Streifen, Felder durch Haarlinien getrennt, Höhe 88, keine Einzelkarten. Etikett `overline` 11/500 versal, Wert 24/500 `tabular-nums` (GF „Umsatz Monat netto“ 32/500), Unterzeile 12 `muted`. Max. 4 (Mitarbeiter/Leitung), 6 (GF/Admin). | ≥ 1440: eine Zeile bis 6; 1024–1439: 3 je Zeile (Mitarbeiter 4 in einer Zeile); 768–1023: 2 je Zeile; < 768: horizontal mit `scroll-snap`, nächste Karte angeschnitten. Ohne Recht fehlt die Kennzahl; ohne Daten „–“ + sichtbare Unterzeile „Noch keine Werte“; Fehler: „Nicht geladen · Erneut“. Definitionen §6.1, Tooltip **und** Hilfe-Artikel nennen sie. |
| Freigaben (Leitung/GF) | Einträge nach §3.5.2 mit Antragsteller, Betrag, Frist, Knöpfen. | Bei 0: Zeile 48 px „Keine offenen Freigaben“ mit Häkchen in Sand (kein Layoutsprung). |
| Letzte Änderungen | `recent_activity` 12 Einträge: Zeit · Person · Objekt-Link · Art · Labels · Bereich. Eingeklappt (`<details>`), Zustand je Benutzer gemerkt. | Filter Bereich; **kein Person-Filter**, solange `mitarbeiterauswertung_freigegeben` nicht gesetzt (§3.8). Nur Rollen mit Schreibrecht in mind. einem Bereich. Leer: „Noch keine Änderungen in deinen Bereichen.“ |
| Charts (Leitung/GF/Admin) | §6.2 | Ohne Daten: Fläche in Zielhöhe mit „Noch keine Werte für diesen Zeitraum“ (keine Null-Linie). Datentabelle als `<details>`. |
| Admin-Kacheln | „Integration“ (API-Aufrufe/Fehler/Rate-Limit 24 h, Geräte > 24 h nicht gesehen) und „Betriebsbereitschaft“ (§3.18). | nur Admin, GF sieht Integration lesend |
| Erster Besuch | Statt Checkliste: Band `info-soft` mit einem Satz, solange der Benutzer noch nie eine Aufgabe/einen Beleg angelegt hat („Starte mit Strg+K: Kunde, Nummer oder Aktion eintippen.“) + „Verstanden“. | gemerkt je Benutzer |

#### 3.2.5 Rollenvarianten

| Rollenmenge | Reihenfolge der Zonen | Kennzahlen | Freigaben | Aktivität | Charts |
|---|---|---|---|---|---|
| Mitarbeiter eines Bereichs | Kopf · Heute · Aufgaben + Zuletzt · Kennzahlen · Aktivität | max. 4 des Bereichs | – | Bereich, eingeklappt | – |
| Leitung | Kopf · Heute · Kennzahlen · Freigaben + Aufgaben · Charts · Aktivität | 4 (Bereich) | eigene Art | Bereich | 1–2 des Bereichs |
| GF | wie Leitung | 6: Umsatz Monat netto, Zahlungseingang Monat, Offene Posten, Anfragen offen, Servicefälle offen, Kassa heute | alle Arten | alle | Umsatz netto je Monat, Anfragen je Woche |
| Backoffice-Admin | Kopf · Heute · Betriebsbereitschaft + Integration · Aufgaben · Aktivität | wie GF, ohne Geldzahlen, wenn kein Leserecht | Technik (Geräte) | alle | API-Aufrufe je Tag |
| Buchhaltung extern | Kopf · Fristen-Chips · 3 große Kacheln | – | – | – | – |
| Selbstservice allein | Kopf · Heute · Stempel-Kachel · Mein Urlaub · Aufgaben | – | – | – | – |
| Kiosk-Rolle im Backoffice | Kopf · Heute · Aufgaben + Zuletzt · 2–3 Kennzahlen | 2–3 | – | – | – |

Zustände: jede Zone eigener `<Suspense>` mit Skeleton in Zielhöhe (Streifen 88, Listen 5 × 40); Fehler einer Quelle betrifft nur ihre Zone („Nicht geladen · Erneut“). Sitzung nur mit `PH Website Integration`: Login verweigert („Technisches Konto – kein Zugang zum Backoffice.“).

### 3.3 Befehlspalette (`Shell/Befehlspalette.js`, Ausbau)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐ 880 px ab 1024, oben 15 vh
│ ⌕ [Rechnungen ×] huber                                                        Esc   │ 52 px, 16 px
├────────────────────────────────────────────────────┬─────────────────────────────────┤
│ DATENSÄTZE                                         │ RE-2026-00040                   │ Vorschau 360 px
│ ▸ RE-2026-00040 · Huber Maria  3.744,00 € ● Bezahlt│ ● Bezahlt · 12.10.2026          │ (erst bei →)
│   RE-2026-00031 · Huber Maria  1.200,00 € ● Gestellt│ Huber Maria, Lochau            │
│ AKTIONEN                                           │ 3.744,00 € · fällig 26.10.      │
│   + Neue Aufgabe „huber“                     N A   │ [Öffnen ↵]  [PDF]               │
├────────────────────────────────────────────────────┴─────────────────────────────────┤
│ ↑↓ wählen · ↵ öffnen · Strg ↵ neuer Tab · → Vorschau                                 │ Fuß 32, max. 3–4 Hinweise
└──────────────────────────────────────────────────────────────────────────────────────┘
```
Unter 1024 px: 640 px breit, Vorschau als zweite Ebene. Vor `→` zeigt die rechte Spalte nur „→ Vorschau“ (`muted`); die Breite ändert sich nie.

| Eingabe | Erkennung (`suche.js`) | Gruppen (Reihenfolge) | Server |
|---|---|---|---|
| leer | – | Zuletzt (8) · Vorschläge (5 häufigste eigene Aktionen) · Bereiche. Fuß: „> Aktionen · @ Personen · ? Hilfe“ | kein Aufruf |
| Nummer (`RE-2026-00040`, `re 40`, `re20260040`, `P-26-0042`, `ENTW-…`) | Regex-Register aus `NUMMERNKREISE` + `ENTW`; Bindestriche/Leerzeichen raus, Jahr optional, Nullen ergänzen | **Direkt öffnen** (Zeile 1) · Datensätze | `global_search(q, doctypes=[erkannter])`; RE-Nummer findet zusätzlich Storno-Gutschrift (`PH Gutschrift.rechnung`) |
| Freitext ≥ 2 Zeichen | – | **Datensätze immer oben** (max. 12, je DocType 4) · Aktionen · Seiten · Hilfe | `global_search(q, limit=20)`, Debounce 150 ms, alte Anfrage abbrechen |
| `>` Text | Token „Aktionen“ | Aktionen + Seiten | lokal |
| `#rech huber` | Token „Rechnungen ×“ (Objektart) | Datensätze dieser Art | `global_search(q, doctypes=[…])` |
| `@` Name | Token „Personen“ | „Aufgabe an …“, „Aufgaben von …“, „Profil“ | `getList("User", {enabled:1, full_name like})` |
| `?` Text | Token „Hilfe“ | Hilfe-Artikel, Kürzel | lokal (Index beim Build) |
| `/` Text | Token „Seiten“ | Seiten aus `bereiche.js` | lokal |
| Betragsmuster `3.744,00`, `3744 €`, `€ 3744` | Muster | Belege in EUR: `PH Rechnung.brutto_cent`, `PH Gutschrift.brutto_cent`, `PH Zahlung.betrag_cent` (`waehrung=EUR`), `PH Kassenbeleg.gesamt_cent`, `PH Bankumsatz.betrag_cent` (Betrag und Gegenbetrag) ± 1 ct | n × `getList` (je DocType eigenes Feld; Rechte je DocType) bis Anfrage A5 |
| `CHF 1200` | Muster | nur Belege mit `waehrung=CHF`, Kennzeichen „CHF“ | wie oben |
| Telefon/E-Mail | Regex | Kontakte | `global_search(q, doctypes=["PH Kontakt"])`; Ziffern-Normalisierung ab A5 |
| Datum (`12.11.`, `morgen`) | Regex/Wörter | „Termine am 12.11.“, „Montagen am 12.11.“ | lokal (Links) |
| Scanner-Strom + Enter | `useScanner` (nur außerhalb Feldern) | Palette mit Code; Treffer Produktpass/Lieferschein/Kundenkarte → direkt öffnen | `global_search` + `KK-` |

Verhalten:
- **Enter-Puffer:** Vorauswahl liegt auf Datensatz 1, sobald er da ist. Enter vor Eintreffen der Antwort wird bis 600 ms gepuffert und dann auf Datensatz 1 angewandt; kommt nichts, öffnet Enter `/suche?q=`. Aktionen mit Freitext („Neue Aufgabe ‚huber‘“) sind **nie** vorausgewählt. Bis zur Antwort: leerer Platz 3 × 40 px, ab 300 ms Skeleton.
- Treffer: Icon 16, Haupttext mit `<mark>` (`bg-accent-soft`), Nebentext `muted` (Art · Nummer · Betrag), Status-Badge xs.
- `→` nur bei Cursor am Textende; Vorschau lädt `getDoc` nach 200 ms Haltezeit: Titel, Status, 3 Kennwerte, Primäraktion.
- Rechte: `global_search` prüft serverseitig; Aktionen über `darf()`/`darfDoc()`; Aktionen ohne Recht erscheinen nie. Personal-DocTypes nie (suche.py).
- **Steuerberater** (`PH Buchhaltung extern`): Palette sendet immer `doctypes=[PH Rechnung, PH Gutschrift, PH Kassenbeleg, PH Kassenabschluss, PH Eingangsrechnung, PH Export Lauf, PH Bankumsatz]`.
- Keine Treffer: „Nichts zu ‚xyz‘ gefunden.“ + „Neuen Kontakt ‚xyz‘ anlegen“ (nur mit `create`) + „In allen Listen suchen ↵“.
- Fehler: Gruppe Datensätze zeigt Zeile `danger-text` „Suche gerade nicht erreichbar · Erneut“ (Enter auf der Zeile = Erneut); lokale Gruppen bleiben nutzbar.
- Lernen: Zähler je Aktion in `ph-bo:<user-hash>:palette` (max. 100 Schlüssel, Verfall 60 Tage), ab 3 Nutzungen in „Vorschläge“.
- Kiosk: keine Palette.

### 3.4 `/suche?q=`

Seitenkopf „Suche: ‚huber‘ · n Treffer“; Gruppen als Abschnitte, je Gruppe Tabelle (Titel, Objekt, Status, Geändert), „alle anzeigen“ → Liste des DocTypes mit `?q=`. Leer: „Keine Treffer zu ‚…‘. Versuche die Nummer ohne Präfix oder eine Schreibweise ohne Umlaut.“ Funktioniert ohne JavaScript (Formular GET).

### 3.5 Glocke, Freigaben, `/benachrichtigungen`

#### 3.5.1 Glocke

```
┌ Benachrichtigungen                          Alle gelesen ┐ 380 px (≥ 1024) · Sheet 480 (640–1023) · Bottom-Sheet (< 640)
│ [Für mich 3] [Team 5] [System 1]                         │ Reiterleiste nur, wenn > 1 Reiter erlaubt
│ Heute                                                    │
│ ● 09:12  Freigabe: Kulanz 180,00 € · PH-SRV-2026-00012   │
│          A. Berger bittet um Freigabe                    │
│                             [Ablehnen] [Freigeben]       │ 28 px Desktop, 44 px iPad, Telefon eigene Zeile
│ ● 08:40  Lena hat dich in AB-2026-00017 erwähnt          │
│ ○ 08:05  Aufgabe fällig: Angebot AN-… nachfassen         │
│ Gestern                                                  │
│ ○ 17:20  Termin PH-TER-… vom Kunden bestätigt            │
├──────────────────────────────────────────────────────────┤
│ Alle anzeigen →                                          │
└──────────────────────────────────────────────────────────┘
```

- Knopf: `aria-label="Benachrichtigungen, 3 ungelesen"`; Zähler = ungelesen „Für mich“.
- Quellen bis Anfrage A7: Frappe `Notification Log` (`for_user = ich`), offene `ToDo` an mich (ohne `reference_type = "PH Aufgabe"`, die kommen als Aufgabe), Freigaben (§3.5.2). Reiter „Team“: Ereignisse an Objekten, die ich angelegt habe oder denen ich zugewiesen bin; „System“ nur Admin/Leitung.
- Fokus beim Öffnen auf erstem ungelesenen Eintrag; `←→` Reiter.
- Eintrag anklicken: gelesen + Akte öffnen. `R` schaltet gelesen/ungelesen (Undo). „Alle gelesen“ / `Shift+R`: Toast „12 als gelesen markiert · Rückgängig“ (Gegenaufruf je Name aus der Client-Liste).
- Wischen (Touch): rechts = gelesen (Primär), links = Menü. Sichtbare Alternative: Langdruck 400 ms / `⋯` am Eintrag.
- Leer je Reiter: „Nichts Neues für dich.“ · „Keine Team-Ereignisse seit 7 Tagen.“ · „Keine Systemmeldungen.“
- Fehler: letzter Stand + Zeile „Nicht aktuell · Erneut“.
- Aktualisierung: Polling 60 s, sofort bei Fensterfokus.

#### 3.5.2 Freigaben (Zentrale-Kachel und Glocke, gleiche Komponente `FreigabeEintrag`)

Vertrag je Fachbereich: `lib/backoffice/<bereich>/freigaben.js` exportiert `freigaben(client, session)` →
```js
[{ id, doctype, name, art, titel, betrag_cent, waehrung, antragsteller, antragsteller_name,
   eigener_antrag /* bool, Server-Feld wenn vorhanden, sonst Vergleich mit session.user */,
   frist /* ISO-Datum oder null */, geldwirksam, freigeben: { methode, args }, ablehnen: { methode, grund_pflicht } }]
```

| Art | Freigeben (exakt) | Ablehnen | Geldwirksam | Antragsteller-Feld |
|---|---|---|---|---|
| Erstattung (ph_shop) | `PH Zahlung.erstattung_freigeben()` | `erstattung_ablehnen(grund)` | ja | `erstattung_angefordert_von` |
| Eingangsrechnung (ph_faktura) | `PH Eingangsrechnung.freigeben()` | `ablehnen(grund)` (Pflicht) | ja | `geprueft_von` |
| Kulanz (ph_service) | `PH Servicefall.kulanz_freigeben(kommentar, betrag_cent)` – `betrag_cent` = angezeigter Betrag; Server weist ab, wenn inzwischen geändert | `kulanz_ablehnen(grund)` (Pflicht) | ja | `verantwortlich` |
| Inventur, Tour (ph_logistik) | `PH Inventur.freigeben()`, `PH Tour.freigeben()` | – | nein | `owner` |
| Planung (ph_projekte) | `PH Planung.freigeben(durch_kunde=0, kommentar)` | – | nein | `owner` |
| Social-Beitrag (ph_marketing) | `PH Social Beitrag.freigeben()` | – | nein | `owner` |
| Abwesenheitsantrag (ph_personal) | Workflow-Übergang laut Fachkonzept Personal | laut Fachkonzept | nein | Mitarbeiter |

Regeln:
- **Vier-Augen:** `eigener_antrag = true` → Knopf `aria-disabled="true"`, Satz darunter „Eigener Antrag – zweite Person nötig.“ Serverseitig erzwungen erst mit Anfrage A4 (ph_shop, ph_faktura); bis dahin ist die UI-Sperre die einzige Hürde (in §13 als Risiko markiert).
- **Geldwirksam:** Bestätigen-Dialog „Erstattung 180,00 € an Huber Maria freigeben? Die Rückzahlung wird sofort ausgelöst.“ Primär „Freigeben“. Danach Eintrag grau „Freigegeben von dir 09:14“, 24 h sichtbar.
- **Nicht geldwirksam:** sofort, Undo 8 s nur, wenn der Fachbereich eine Gegenmethode nennt; sonst Bestätigen-Dialog ohne Betrag.
- **Ablehnen:** Textfeld „Grund“ im Eintrag (Pflicht laut Spalte), Primär „Ablehnen“ → Toast „Ablehnung wird in 8 s gesendet · Rückgängig“ (verzögertes Senden, weil der Antragsteller informiert wird).
- **Frist:** Erstattung zeigt „Frist 18.11.“ (aus `PH Widerruf.erstattung_bis`, falls Bezug); ≤ 3 Tage rot.
- **Vertretung:** Freigaben und Aufgaben einer Person mit genehmigter Abwesenheit erscheinen bei der eingetragenen `PH Abwesenheit.vertretung` im Reiter „Für mich“ mit Kennzeichen „Vertretung für A. B.“ (Daten aus ph_personal, ohne Art der Abwesenheit).
- **Abwesenheiten:** Eintrag zeigt „Urlaubsantrag“ nur bei `art = Urlaub`, sonst „Abwesenheitsantrag“; nie `begruendung`. `Krankenstand` erscheint nie als Freigabe (Meldung, keine Genehmigung). In Team-Ansichten nur „abwesend von–bis“.
- **Dublette:** ToDos, die auf ein Objekt mit offener Freigabe zeigen (z. B. `schluessel="Kulanz-Freigabe"`), erscheinen nur als Freigabe, nicht zusätzlich als Aufgabe.

#### 3.5.3 `/benachrichtigungen`

Gleiche Einträge als Liste, gruppiert nach Tag; Filter-Chips Reiter · Art · Bereich · Zeitraum; Massenaktion „Als gelesen“ / „Als ungelesen“ (Undo-Toast). Einstellungen-Sheet: „Tagesübersicht per E-Mail 07:00“ erscheint erst mit Inhaber-Entscheidung und Anfrage A13; Kiosk zeigt nur Toasts hoher Priorität (§8.3).

### 3.6 `/aufgaben`

#### 3.6.1 Zwei Quellen, eine Liste

| | PH Aufgabe (ph_crm) | ToDo (Frappe, Fach-Apps) |
|---|---|---|
| Wer erzeugt | Menschen (Schnellanlage), ph_crm-Scheduler | ph_faktura, ph_kassa (`rksv/buchung.py`), ph_logistik, ph_marketing, ph_service, ph_shop (`mails.aufgabe`), ph_sortiment |
| Abfrage „Meine“ | `zugewiesen_an = ich`, `status in [Offen, In Arbeit]` | `allocated_to = ich`, `status = Open`, `reference_type != "PH Aufgabe"` |
| Felder in der Zeile | `titel`, `referenz_doctype/_name`, `faellig`, `prioritaet`, `status` | `description` (HTML entfernt, 1. Zeile), `reference_type/_name`, `date`, `priority` |
| Erledigen | `status_setzen("Erledigt", ergebnis?)` | `setValue("ToDo", name, "status", "Closed")` |
| Rückgängig | `status_setzen(<alt>)` | `status = "Open"` |
| Anlegen/Zuweisen/Fällig ändern | ja | nein (Kennzeichen „System“, Titel readonly) |
| Status-Mapping | – | Open → Offen, Closed → Erledigt, Cancelled → Verworfen |

Langfristig ein Modell (Anfrage A2: Helfer `ph_core.utils.aufgaben.anlegen()` und Umstellung der ToDo-Erzeuger); die UI bleibt dabei gleich.

#### 3.6.2 Liste

```
┌ Zentrale › Aufgaben                                                    [Neue Aufgabe] ┐
│ Aufgaben                                 Liste | Karten        Meine | Team | Alle    │
├ [Offen 12] [In Arbeit 3] [Erledigt] [Verworfen] · [Überfällig 2] [Heute 4] [Woche] · 🔍 ┤
│ ☐ │ Aufgabe                        │ Bezug               │ Fällig ↑    │ Zuständig │ Status    │
│ ☐ │ Rückruf Fam. Huber Liefertermin│ Projekt P-26-0042   │ heute       │ (AB) Anna │ ● Offen   │
│ ☐ │ Angebot AN-…31 nachfassen      │ Angebot AN-2026-…31 │ vor 2 Tagen │ (AB) Anna │ ● Offen   │
│ ☐ │ Lieferschein prüfen  [System]  │ Lieferschein LS-…   │ Fr. 7.11.   │ (AB) Anna │ ● Offen   │
├ 25 von 31 · ‹ 1 2 ›                                                                    ┤
└ 2 ausgewählt · [Erledigen] [Zuweisen] [Fällig] [Status ▾] · Esc ──────────────────────┘
```

- Standard: „Meine“, Offen + In Arbeit, `faellig asc`. „Team“ (Leitung/GF: Benutzer mit gleichen Bereichsrollen, ⓕ `Has Role`) und „Alle“ (Leitung/GF/Admin) als Reiter.
- Spalten: Aufgabe (2. Zeile Beschreibung 60 Zeichen) · Bezug (Chip → kanonische Route; storniertes Bezugsobjekt: Kennzeichen „Bezug storniert – noch nötig?“ + Knopf „Verwerfen“) · Fällig (Text „heute“/„vor n Tagen“/Datum, Punkt rot/Sand/grau) · Zuständig (Avatar 24 + Kurzname, inline) · Prio (nur „Hoch“ `warning-text`) · Status (Badge, inline Popover).
- Inline (02 §4): Status, Zuständig, Fällig, Prio – optimistisch ≤ 50 ms, Häkchen 600 ms, Undo 8 s; Fehler setzt zurück + Toast; Konflikt gelb „Übernehmen / Behalten“. ToDo-Zeilen: nur Erledigen.
- Erledigte Zeile bleibt 8 s (Leitregel 4).
- Massenaktionen: Erledigen · Zuweisen · Fällig (`+1`, `+7`, Datum) · Status · Mehr: Verwerfen (rot). Vorschau „3 von 5 möglich (2 bereits erledigt)“; Ergebnis-Toast „12 erledigt, 1 übersprungen · Details“ mit Rückgängig. **CSV-Export erst mit Anfrage A12 (Export-Protokoll)**.
- `scroll-padding-bottom` = Höhe Massenaktionsleiste + 16 px; Toasts stapeln 8 px über der Leiste.
- Karten (`?ansicht=karten`): Spalten Offen · In Arbeit · Erledigt (Fixture `PH Aufgaben`); Verschieben = `status_setzen` optimistisch, Rückflug 200 ms bei Fehler, Toast „Nach ‚In Arbeit‘ verschoben · Rückgängig“; „Erledigt“ zeigt nur heute/gestern, eingeklappt ab 20. ToDo-Karten nur in Offen/Erledigt.
- Leerzustände: nie Daten → „Noch keine Aufgaben. Aufgaben entstehen hier oder aus jedem Datensatz (Knopf ‚Aufgabe‘).“ + „Aufgabe anlegen“ (mit Recht) · Filter → „Keine Aufgaben mit Status ‚Verworfen‘ in dieser Woche.“ + „Filter zurücksetzen“ · alles erledigt → „Alles erledigt – keine offenen Aufgaben.“
- Laden: Kopf echt, 8 Skeleton-Zeilen; Karten 3 × 3. Fehler: Tabelle zeigt `Fehler` (Kennung + Erneut), Werkzeugleiste bleibt bedienbar.
- Telefon: Kartenliste mit Häkchen-Ziel 44 × 44 links (`aria-label="Aufgabe erledigen"`), Langdruck 400 ms = Menü (Zuweisen, Fällig, Status); Wischen rechts = Erledigen, links = Menü (Zusatz).

### 3.7 Schnellanlage Aufgabe (Dialog 560 px)

```
┌ Neue Aufgabe                                                   × ┐
│ [ Was ist zu tun?  ·  @Name  ·  +3 Tage                         ] │ Titel, Autofokus, 140 Zeichen
│   Fällig: Mo 9.11. ×    Zuständig: Lena ×                         │ erkannte Token als Chips
│ Fällig [ morgen ▾ ]  Zuständig [ (AB) Anna ▾ ]  Prio [ Normal ▾ ] │ heute · morgen · +3 · Mo · Datum
│ Bezug  ▣ Projekt P-26-0042 Küche Huber  ×                         │ aus Kontext, sonst Link-Suche
│ ▸ Beschreibung                                                    │ eingeklappt
│ ☑ Am Fälligkeitstag erinnern                                      │ erinnerung = 1
│                                        [Abbrechen] [Anlegen ↵]    │ Strg+↵ = Anlegen und öffnen
└───────────────────────────────────────────────────────────────────┘
```

- Aufruf: `N A`, Inline-Zeile der Zentrale, Knopf „Aufgabe“ in jeder Akte (Bezug vorbelegt; `kontakt` übernimmt der Server), Palette (Titel vorbelegt). **Nur mit `create` auf `PH Aufgabe`** – sonst existiert kein Aufruf (kein Knopf, keine Palette-Aktion, keine Inline-Zeile, kein `N A`-Eintrag).
- Token-Erkennung nur **am Titelende** oder als eigenes Wort mit Leerzeichen davor und danach: `@lena` (nur am Wortanfang, nicht in E-Mail-Adressen), `+3`, `mo`/`di`/…, `12.11.`. Datumsangaben mitten im Satz bleiben Text („Lieferung 12.11. bestätigen“ bleibt unverändert). Erkannter Token → Chip unter dem Feld; im Feld bleibt er grau durchgestrichen bis Enter; `Backspace` direkt danach oder `×` am Chip stellt ihn als Text wieder her.
- Speichern: `aufgabeAnlegenAction` → Toast „Aufgabe angelegt · Öffnen“; Dialog schließt 120 ms. Fällig ist Pflicht (Server `reqd`), vorbelegt „morgen“.
- Fehler `invalid` (Titel leer): Text unter dem Feld, Fokus dorthin. `forbidden` (Rechte zwischenzeitlich entzogen): Dialog bleibt, Band „Du darfst keine Aufgaben anlegen.“ + Knopf „Wen frage ich?“ (Kontakt-Popover der Leitung).
- Entwurf: Titel in sessionStorage `ph-bo:<user-hash>:entwurf-aufgabe`, beim Abmelden gelöscht.

### 3.8 `/protokoll`

| Reiter | Quelle | Spalten | Filter | Rollen |
|---|---|---|---|---|
| Aktivität | `recent_activity(limit ≤ 100, bereiche)` | Zeit · Person · Objekt · Art · Labels · Bereich | Bereich, Art, Zeitraum (auf geladenen 100). **Person-Filter nur**, wenn `PH Einstellungen.mitarbeiterauswertung_freigegeben = 1` (Anfrage A10). Hinweiszeile über der Tabelle: „Filter wirkt auf die letzten 100 Einträge.“ (bis Anfrage A11 `seit/bis/start`) | Leitung (eigene Bereiche), GF, Admin |
| API | `PH API Protokoll` | Zeitpunkt · Methode · Benutzer · Ergebnis · HTTP · Dauer · Bezug · Fehler (gekürzt) | Status, Methode, Benutzer, Zeitraum, Volltext | Admin, GF |
| Fehler | ⓕ `Error Log` | Zeit · Titel · erste Zeile · „Details“ (Sheet, Monospace, Kopieren) | Zeitraum, Titel | Admin |
| Anmeldungen | ⓕ `Activity Log` (`operation=Login`) | Zeit · Benutzer · Ergebnis (keine IP) | Benutzer, Zeitraum, Ergebnis, Chip „Externe“ (Rolle Buchhaltung extern) | Admin; GF lesend für Externe |

- API-Kopf: Streifen „Aufrufe 24 h · Fehler 24 h · Rate-Limit 24 h“ + Chart „Aufrufe je Tag (30 T)“.
- API-Eintrag als Sheet 480 px; `anfrage_json`/`antwort_json` nur für System Manager und nur, wenn gespeichert, sonst „Nutzdaten nicht gespeichert (Datensparsamkeit)“. Serverseitige Absicherung über permlevel ab Anfrage K2.
- Leer: „Keine Treffer in den letzten 100 Einträgen.“ (Aktivität) / „Keine Einträge im Zeitraum.“ (andere). Fehler: `Fehler` + Erneut. Kein Export bis A12.

### 3.9 `/einstellungen`

Reiter: **Firma · Allgemein · Website & API · Kalender · System**.

```
┌ Zentrale › Verwaltung › Einstellungen                                                ┐
│ Firma | Allgemein | Website & API | Kalender | System                                │
│ ┌ Schalter mit Wirkung ──────────────────────────────────────────────────────────────┐│
│ │ Testmodus        [● an ]  Mails an Team-Postfach · Vermerk TEST · Karte simuliert  ││ eigene Aktion
│ └────────────────────────────────────────────────────────────────────────────────────┘│
│ Standardfirma   [ Platzhirsch Home Living … ▾ ]     Zeitzone  Europe/Vienna (fest)    │
│ Website         [ https://www.platzhirsch.studio ]   Sprachen  de, en, fr, it (fest)  │
│ Team-Postfach   [ … ]        Fehler-Postfach [ … ]                                    │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ Ungespeichert · [Verwerfen] [Speichern  Strg S]                                        │ erscheint nach 1. Änderung, 160 ms
└──────────────────────────────────────────────────────────────────────────────────────┘
```

| Reiter | Felder | Regeln |
|---|---|---|
| Firma | `PH Firma`: firmenname, marke, kurzname, rechtsform, standard, logo, geschaeftsfuehrung, strasse, plz, ort, land, telefon, email, website, uid, firmenbuchnummer, firmenbuchgericht, waehrung, steuernummer, bank, iban, bic, zahlungsziel_tage, fusszeile; ab A10 zusätzlich `sitz` | Liste links (Standard mit Haken), Formular rechts. Oben Band `warning-soft` „Für Rechnungen fehlt: Sitz, Firmenbuchgericht“ (Pflichtangaben UStG § 11, UGB § 14: Anschrift, UID, Rechtsform, Sitz, Firmenbuchnummer, Firmenbuchgericht). `land` als Auswahl Österreich/Deutschland/Schweiz/Liechtenstein/Andere, gespeichert exakt „Österreich“, damit die UID-Prüfung `ATU` + 8 Ziffern greift (bis `land` Link Country wird, A10). IBAN formatiert angezeigt, ohne Leerzeichen gespeichert. **„Als Standard setzen“**: Rückfrage „Neue Belege werden ab jetzt auf <Firma> ausgestellt. Vorschauen älterer Entwürfe zeigen dann ebenfalls <Firma>.“ – kein Undo. Ein Firmen-Umschalter im Zentrale-Kopf erscheint erst mit > 1 Firma **und** Anfrage A7b (Firma am Beleg). `steuernummer` nur GF/Admin/Faktura Leitung (UI blendet aus; Server ab K1). Leer: Band „Noch keine Firma angelegt – Rechnungen und Druckvorlagen haben ohne sie keinen Briefkopf.“ + „Firma anlegen“. Schreibrecht: GF, Admin. |
| Allgemein | standard_firma, website_url, zeitzone (ro), sprachen (ro), team_email, fehler_email; Karte „Schalter mit Wirkung“: `testmodus` | Testmodus = eigene Aktion (§3.9.1), nicht Teil der Speicherleiste. E-Mail-Validierung; Hinweis „Integrationsfehler gehen an das Fehler-Postfach“. |
| Website & API | Karte „Schalter mit Wirkung“: `api_aktiv`; Felder: api_rate_limit_pro_minute (≥ 1), api_idempotenz_tage, api_protokoll_aufbewahrung_tage (≥ 7), api_protokoll_nutzdaten, website_revalidate_aktiv, website_revalidate_drossel_sekunden, website_revalidate_secret_name (beginnt mit `ph_`, nur Name), website_revalidate_pfade (ro) | `api_aktiv` aus: Rückfrage „Website-API ausschalten? Formulare und Terminbuchung der Website antworten dann mit ‚nicht verfügbar‘.“ → sofort gespeichert → Band `warning-soft` auf der Seite. Nutzdaten-Schalter mit Hinweis „Nur Staging“. Fehlertexte aus `ph_einstellungen.py validate`. |
| Kalender | feiertage_bundesland, Kindtabelle `betriebsruhe` (datum, bezeichnung) | Liste nach Datum, „+ Tag“, doppeltes Datum → „Datum bereits eingetragen.“; Entfernen mit Undo bis Speichern. Feiertage erst mit Anfrage A14 sichtbar, bis dahin nur Betriebsruhe. Leer: „Keine Schließtage eingetragen. Feiertage werden automatisch berücksichtigt.“ + „+ Tag“. |
| System (nur Admin) | Nummernkreise (ro), Zugangsschlüssel (Status) | Nummernkreise: Objekt · Serie · Beispiel · Letzte Nummer (ab A15; vorher Spalte fehlt). Band: „Nummernkreise werden im Code geführt. Änderungen über Entwicklung.“ Zugangsschlüssel: Namen aus README-Register, Kennzeichen gesetzt/fehlt nur ab A16; nie Werte. |

Formularverhalten: Autosave aus; Speicherleiste erscheint 160 ms nach erster Änderung; Verlassen fragt einmal; `Strg+S` speichert. Nicht-Schreibberechtigte: Felder readonly (`surface-2`), keine Speicherleiste, Kopfhinweis „Nur lesend – Änderungen nimmt der Backoffice-Admin vor.“ Konflikt: §3.15.

#### 3.9.1 Testmodus (Aktion `testmodusSchaltenAction`)

| Situation | Dialog | Ergebnis |
|---|---|---|
| Einschalten, Staging | „Testmodus einschalten? Kundenmails gehen an das Team-Postfach, Belege tragen den Vermerk TEST, Kartenzahlungen an der Kassa werden simuliert. Kassenbelege werden weiterhin signiert.“ Primär „Einschalten“ | Speichern sofort; Toast „Testmodus eingeschaltet“; Band orange auf allen Seiten (`refresh()`) |
| Einschalten, Produktiv (`site_rolle = Produktiv`, ab A1) | wie oben + Pflichtfeld „Grund“ (140 Zeichen) + Satz „Auf der Produktiv-Site gehen Bestätigungen nicht an Kunden – das betrifft gesetzliche Vertragsbestätigungen.“ Primär `danger-solid` „Einschalten“ | Band **rot**, nicht wegklickbar: „Testmodus auf der Produktiv-Site: Kartenzahlung wird simuliert, Kundenmails gehen an das Team-Postfach.“; Kassa sperrt Zahlart Karte (Kassa-Konzept) |
| Ausschalten | „Testmodus ausschalten? Ab jetzt gehen Mails an Kunden und Kartenzahlungen sind echt.“ Primär „Ausschalten“ | Band verschwindet |

Bis `site_rolle` existiert, zeigt das Band bei `testmodus = 1` immer den Satz der Produktiv-Variante in Orange (sicherer Standard).

### 3.10 `/benutzer`

Liste: Name (Avatar + Name, 2. Zeile E-Mail; Kiosk-Konten mit Kennzeichen „nur Kiosk“) · Profil/Rollen (2 Chips + „+n“, ohne „PH “) · Arbeitsplätze (Icons) · PIN · Standort · Status. `Zuletzt aktiv` nur für Admin. Filter: Rolle, Profil, Standort, Status, Volltext; Reiter Aktiv · Deaktiviert · Alle. Primär „Benutzer anlegen“ (Admin). Massenaktionen: Rolle zuweisen, Standort setzen (Admin). Leer-Filter: „Keine Benutzer mit Rolle ‚Montage‘ am Standort ‚Lager‘.“ + „Filter zurücksetzen“.

Benutzerakte `/benutzer/[name]` (3 Reiter, kein Speichern-Knopf):

```
┌ Zentrale › Verwaltung › Benutzer › Anna Berger                         ● Aktiv   [⋯] ┐
│ (AB) Anna Berger · anna.berger@… · Verkauf · Showroom Lochau                          │
├ Zugriff | Einstellungen | Verlauf ───────────────────────────────────────────────────┤
│ PROFIL      [ Verkauf ▾ ]                                     ║ BEZÜGE                │
│ ROLLEN      [CRM Mitarbeiter ×] [Faktura Mitarbeiter ×] … [+ Rolle]║ Offene Aufgaben 5 →│
│ WAS DARF ANNA DAMIT?                                          ║ Kontakte als Beraterin│
│   Backoffice: Zentrale · CRM · Faktura · Sortiment · Projekte ║   12 →               │
│   Arbeitsplätze: Backoffice                                   ║ Geräte mit Anmeldung 1│
│   Nicht erlaubt: Löschen, Stornieren, Export, Einstellungen   ║                       │
│   ▸ Alle Rechte (Tabelle)                                     ║                       │
│ BEDIENER                                                      ║                       │
│   Kurzname [ Anna ] ✓   Standort [ Showroom Lochau ▾ ] ✓      ║                       │
│   PIN gesetzt am 01.11.2026        [PIN neu setzen]           ║                       │
└───────────────────────────────────────────────────────────────╨───────────────────────┘
```

- **Ein Modell: Änderung wirkt sofort, Rückgängig 8 s.** Rollen-Chip `×` (Ziel ≥ 24 × 24, `aria-label="Rolle CRM Mitarbeiter entfernen"`; Tastatur: Chip fokussieren → `Entf`/`Backspace`) → `rolleAendernAction` + Undo. Kurzname/Standort: beim Verlassen des Felds speichern (Häkchen 600 ms, Undo) über `save User` (Custom Fields `ph_core_kurzname`, `ph_core_standort`) bis Anfrage A3b (`set_profil`).
- Rückfrage statt Undo beim Entzug von Leitung, Geschäftsführung, Backoffice-Admin, System Manager und der letzten Rolle („Anna verliert Zugriff auf …“). Eigene Admin-Rolle: `aria-disabled` + Satz „Eigene Admin-Rolle kann nur ein anderer Admin entziehen.“
- Profil-Select: Vorschau-Dialog „Setzt 5 Rollen: …, entfernt 1: …“ → Anwenden → Toast „Profil Verkauf angewendet · Rückgängig“ (stellt vorherige Rollenliste her).
- „Was darf … damit?“: Sätze aus `aktionenIn()`/`erlaubteArbeitsplaetze()`; aufklappbare Tabelle.
- **PIN neu setzen** (Dialog): zwei Felder `inputmode="numeric"`, Einfügen erlaubt, Regeln inline („4–6 Ziffern, keine Folge, nicht alle gleich“); `set_pin`; Toast „PIN gesetzt“ (nie die PIN). **Sichtbar nur**, wenn: eigenes Profil, oder Admin, oder Leitung **und** Ziel hat keine Rolle aus Admin/GF/`PH * Leitung` **und** teilt mindestens eine Bereichsrolle (Server erzwingt ab A3).
- Reiter Einstellungen (eigenes Profil oder Admin): Erscheinungsbild, Dichte, Einzeltasten-Kürzel, Erstbesuchs-Hinweise zurücksetzen. Speicherung bis A6 in localStorage je Benutzer mit Hinweis „gilt für dieses Gerät“.
- Reiter Verlauf: `docinfo` (`Zeitleiste`). Leer: „Noch keine Änderungen an diesem Benutzer.“
- `⋯`: Austragen … (Z5) · Deaktivieren (Rückfrage „Anna kann sich nicht mehr anmelden. Offene Aufgaben bleiben bei ihr – zum Umverteilen ‚Austragen‘ nutzen.“) · Reaktivieren · Passwort-Reset-Mail (nicht bei Kiosk-Konten) · Einladung erneut senden · Im Frappe-Desk öffnen (nur System Manager).
- Zustände: ohne PH-Rolle → Band „Ohne PH-Rolle kein Zugriff auf das Backoffice.“; `PH Website Integration` → Band „Technisches Konto der Website – kein Login im Backoffice“, Rollen readonly.

`/benutzer/neu` (Assistent Z2, 2 Schritte):
1. Vorname*, Nachname*, Schalter **„Ohne Postfach (nur Kiosk)“** – aus: E-Mail* + „Einladungsmail senden“ ☑; an: E-Mail wird `vorname.nachname@kiosk.invalid` (nicht zustellbar, sichtbar readonly), kein Passwort, keine Einladung, Profilauswahl auf Kiosk-Profile begrenzt. Profil als Radiokarten (Name ohne „PH “ + ein Satz), Standort (Standard „Showroom Lochau“), Kurzname (vorbelegt Vorname).
2. Zusammenfassung „Legt Anna Berger an, setzt 5 Rollen (…), sendet Einladung.“ + PIN (bei Kiosk-Konto Pflicht, sonst optional) → „Anlegen“ → Akte.
Fehler `invalid {field}` am Feld; doppelte E-Mail: „Diese E-Mail ist bereits vergeben – Benutzer öffnen“ (Link).

### 3.11 `/geraete`, `/geraete/[name]`, `/geraet`

Liste (`list_devices`): Gerät (Icon Typ + `geraetename`, 2. Zeile `PH-GER-…`) · Typ/Arbeitsplatz · Standort · Kasse · Drucker · Zuletzt gesehen (> 24 h mit Kennzeichen) · Status. Filter Standort, Arbeitsplatz, Status; Reiter Aktiv · Gesperrt · Alle. Primär „Gerät registrieren“. Zeilenmenü: Öffnen · Sperren · Entsperren · Token erneuern. Leer: Icon `tablet`, „Noch keine Geräte registriert. Registriere das Kassa-iPad oder den Packtisch-PC, dann startet es direkt am Arbeitsplatz.“ + „Gerät registrieren“ + „Wie funktioniert das?“ (Hilfe-Panel).

**Recht je Gerätetyp** (UI sofort, Server ab Anfrage A3):

| Typ | darf registrieren/sperren |
|---|---|
| Kassa | Admin, PH Kassa Leitung |
| Packtisch | Admin, PH Logistik Leitung |
| Mobil (Montage/Technik) | Admin, PH Projekte Leitung, PH Service Leitung |
| Backoffice | Admin |

Typ-Segment zeigt nur erlaubte Typen; ohne erlaubten Typ kein Knopf „Gerät registrieren“.

Geräteakte: Übersicht (geraetename, typ, arbeitsplatz, standort, kasse, drucker, drucker_typ, notizen – über Speicherleiste; **`aktiv` ist kein Formularfeld**, Status nur über Sperren/Entsperren) · Registrierung (registriert_am, registriert_durch, token_vorhanden, zuletzt_gesehen) · Verlauf.

| Knopf | Methode | Rückfrage | Ergebnis |
|---|---|---|---|
| Token erzeugen (`token_vorhanden=0`) | `registrieren()` | nein | Token-Dialog |
| Token erneuern | `token_erneuern()` | „Das bisherige Token wird sofort ungültig – das Gerät muss neu eingerichtet werden.“ | Token-Dialog |
| Sperren | `sperren(grund)` | Dialog, Grund Pflicht (140), Fokus im Feld, Primär `danger-solid` „Sperren“; bei Kassa-Gerät mit offenen Offline-Belegen (sobald ph_kassa meldet): Band „n Belege noch nicht übertragen – erst übertragen, dann sperren.“ + Vorschlag „Ausfall dokumentieren“ (Kassa-Ereignis) | Status rot, Band „Gesperrt: <Grund>“ |
| Entsperren | `entsperren()` | nein | Undo 8 s ruft `sperren(grund_alt)` |
| Felder speichern | `save` (modified), ohne `aktiv` | Speicherleiste | – |

**Token-Dialog:** Token Monospace 16 px + „Kopieren“ (Häkchen 600 ms); QR 160 px mit `https://<backoffice>/geraet#token=…` (Fragment, nicht an Server; `/geraet` liest es und entfernt es mit `history.replaceState`); Satz „Der Server speichert nur den Hash.“; „Einrichtungsblatt drucken“ (A5). Live-Rückmeldung: „Warte auf das Gerät …“ → „iPad Kassa 1 hat sich verbunden ✓ 09:14“ (Polling `list_devices` → `zuletzt_gesehen` alle 5 s, max. 10 min). Schließen vor Verbindung: einmalige Rückfrage „Token kopiert oder QR gescannt? Es wird nicht noch einmal angezeigt.“; nach Verbindung ohne Rückfrage.

**Registrieren** (`/geraete/neu`, Z1): Schritt 1 Pflicht Name, Typ, Standort; bei Typ Kassa **Kasse Pflicht** (Combobox `PH Kasse`); „Weitere Angaben“ eingeklappt: Arbeitsplatz (aus Typ; bei Mobil Wahl Montage/Technik), Drucker + Druckertyp (Kassa „Bon 80 mm“ vorbelegt), Notizen. Schritt 2 Token-Dialog + Anleitung. Doppelklick-Schutz 600 ms; Idempotenzschlüssel ab A9.

**`/geraet`** (dieses Gerät): A) ohne Cookie: „Token einfügen“ oder `#token=` → `verify_device` → Cookie 1 Jahr → Karte „Dieses Gerät: … startet in Kassa“. B) mit Cookie: Karte + „Registrierung auf diesem Gerät entfernen“ (nur Cookie; Hinweis „Das Token bleibt gültig, bis die Leitung es erneuert.“) + „Verbindung prüfen“ (`touch_device`). Fehler `invalid_token`: „Token unbekannt oder ungültig – die Leitung kann ein neues ausstellen.“; gesperrt: rotes Band mit Grund (ab A9).

### 3.12 Hilfe-Panel und `/hilfe`

```
┌ Hilfe: Aufgaben                                       × ┐ Sheet 480 px, 200 ms
│ [Artikel] [Kürzel dieser Seite] [Was kann ich hier tun?]│
│ Aufgaben sind kleine Erinnerungen mit Frist …           │ Markdown h2/h3, Listen
│ ## Aufgabe aus einem Datensatz                          │
│ Verwandt: Benachrichtigungen · Zentrale                 │
├─────────────────────────────────────────────────────────┤
│ Alle Kürzel (Strg+/) · Fehlt etwas? Admin kontaktieren   │
└─────────────────────────────────────────────────────────┘
```

- Öffnen: Knopf `?` in der Kopfzeile (Icon `circle-help`, Tooltip „Hilfe · ?“) oder Taste `?` → Reiter Artikel. Fokus kehrt beim Schließen zum Auslöser zurück. iPad: Vollbild-Sheet.
- Inhalt: `backoffice/hilfe/<bereich>/<seite>.md` (Frontmatter `titel`, `erstbesuch`, `verwandt`); Auflösung über `ROUTEN`. Fehlt die Datei: „Für diese Seite gibt es noch keinen Hilfetext.“ + Link Bereichsübersicht. Reiter „Kürzel dieser Seite“ aus `kuerzel.js` (nie leer, global als Rückfall). „Was kann ich hier tun?“: Aktionen der Seite mit Recht; gesperrte mit Grund als Satz.
- „Admin kontaktieren“: Popover mit Name/E-Mail/Telefon (kein Anlegen einer Aufgabe ohne Recht).
- Erstbesuch einer Seite: Band `info-soft` mit Frontmatter `erstbesuch` + „Mehr“ + „Verstanden“; gemerkt je Benutzer. Keine Touren.
- `/hilfe`: Inhaltsverzeichnis, Lese-Layout max. 60 ch, `@media print`. Glossar `hilfe/glossar.md`, Komponente `Begriff` (gestrichelter Unterstrich → Popover, per Tastatur fokussierbar).
- Definitionen jeder Kennzahl (§6.1) stehen als Abschnitt in `hilfe/zentrale/dashboard.md`.

### 3.13 Kürzel-Dialog (`Strg+/`)

Dialog lg 800 px, durchsuchbares Feld oben (filtert Taste und Wirkung), zweispaltig (Tastenkappen links, Wirkung rechts), Gruppen: Diese Seite · Navigation · Global · Palette · Liste · Akte · Karten · Kiosk (nur am Kiosk). Plattformsymbole aus `kuerzel.js`. „Drucken“ → A4 zweispaltig 9 pt. Einzeltasten ausgeblendet, wenn der Schalter aus ist.

### 3.14 `/druck` und Druckvorschau

Reiter **Warteschlange** (IndexedDB `ph_bo_druck`, je Gerät): Zeit · Objekt · Format · Zustand (wartet/druckt/gedruckt/Fehler/PDF) · Erneut · Als PDF · Entfernen; Sammeldruck-Aufträge mit Fortschritt n/m. Leer: „Keine Druckaufträge auf diesem Gerät.“ + „Testseite drucken“. · **Druckformate** (Admin/Leitung): `getList("Print Format", {module like "PH %"})` Objekt · Formate · Standard · Sprachen · Vorschau. Leer: „Keine Druckformate gefunden – Belege werden mit dem Standardformat gedruckt.“ · **Drucker** (Admin/Leitung): Geräte mit `drucker` · „Testseite“ (Bon 80 mm Client-HTML, Etikett 62 × 29 Client-HTML, A4 ab Anfrage A17 „PH Testseite“, vorher A4 als Client-HTML mit Briefkopf-Bild). Leer: „Kein Gerät mit Drucker. Drucker werden in der Geräteakte eingetragen.“ + „Zu den Geräten“.

**Druckvorschau** (überall, `Strg+P` in Akten): Sheet lg **800 px** ab 1280, darunter Vollbild. Kopf: Format-Select (gemerkt je DocType), Sprache (wenn mehrsprachig), Zoom-Segment „Breite · 100 % · Seite“ (Standard Breite), `Strg +/−` in der Vorschau, „Seite 1 von 3“ + `Bild↑/Bild↓`. Knöpfe: Drucken · PDF · Per E-Mail · Link kopieren.
- „Per E-Mail“: ruft die Sende-Methode des Fachbereichs (Name im Fachkonzept, z. B. Faktura); ohne bekannte Methode erscheint der Knopf nicht. Kunde ohne E-Mail: `aria-disabled` + Satz „Keine E-Mail-Adresse – drucken oder per Post senden.“ Ab Anfrage A18 zusätzlich: Rechnung per E-Mail nur mit `PH Kontakt.rechnung_per_email_zugestimmt`.
- Festgeschriebene Rechnung: „PDF“ liefert die angehängte Datei, Kennzeichen „festgeschrieben“.
- Fehler `unavailable`: „PDF konnte nicht erzeugt werden – HTML-Vorschau drucken?“ + Knopf.

Sammeldruck aus jeder `DataTable`: Massenaktion „Drucken (n)“ → Dialog Format + Reihenfolge → „Nacheinander drucken“ (Client-Warteschlange) bzw. „Als eine PDF“ (erst ab Anfrage A19, ≤ 50) → Toast „Druck läuft im Hintergrund“ → Glocke „System“ bei Abschluss.

### 3.15 Benutzer-Menü, Konflikt, Sitzung

Benutzer-Menü (Popover 288 px): Name, E-Mail, Profil · Mein Profil · **Arbeitsplätze als echte Menüpunkte** (Icon + Name + Ziffer `1–5`) · Dieses Gerät · Meine PIN ändern · Erscheinungsbild (Segment Hell/Dunkel/System) · Dichte (Kompakt/Komfortabel; Standard Desktop Komfortabel bis Inhaber-Entscheidung) · Einzeltasten-Kürzel (Schalter) · Tastenkürzel (`Strg+/`) · Hilfe · Frappe-Desk (nur System Manager) · Abmelden. Schalter wirken sofort (`html[data-theme]`, `html[data-dichte]`, `html[data-einzeltasten]`).

Konfliktdialog (05 §11): „Lena hat diesen Datensatz um 14:02 geändert.“ Tabelle Feld · Deine Eingabe · Aktueller Wert (nur Abweichungen). Primär „Neu laden“; „Meine Werte übernehmen“ nur Leitung/Admin. Nach „Neu laden“ bleibt rechts Panel „Deine nicht gespeicherten Eingaben“ (Feld · Wert · „Übernehmen“ je Feld) bis Seitenwechsel + „Alles kopieren“.

Sitzung: Ablauf-Warnung 2 min vorher als Warn-Toast `role="alert"`, bleibt bis zur Handlung, stiehlt keinen Fokus (`F8` springt hin), „Verlängern“ → `/api/ping`. Sitzungsende: Login-Karte über der Seite, Eingaben bleiben, Aktion wird nach Login wiederholt. Abmelden löscht sessionStorage-Entwürfe des Benutzers.

### 3.16 `/datenschutz` – Datenschutzanfragen (baut nach Anfrage A8)

Liste: Nummer `DS-2026-…` · Art · Person (Kontakt oder Freitext) · Eingang · Frist (= Eingang + 1 Monat; verlängert bis …) · Status. Chips: Offen · Frist ≤ 7 Tage · Beantwortet. Primär „Anfrage erfassen“.

Akte: Kopf mit Frist-Countdown („noch 9 Tage“, ≤ 7 rot). Felder: art, eingang, kanal (E-Mail/Brief/Telefon/Showroom/Portal), kontakt, name_freitext, identitaet_geprueft (+ von), frist (ro), verlaengert_bis + verlaengerung_grund (max. + 2 Monate, Art. 12 Abs 3 DSGVO), status, ergebnis (Anhang), beantwortet_am, sperrvermerk.
Aktionen: „Identität geprüft“ (Pflicht vor Auskunft) · „Auskunft erzeugen“ (`auskunft_sammeln()`, sammelt alle Apps über Hook `ph_core_datenauskunft`; Fortschritt je App) · „Frist verlängern“ (Grund Pflicht, Rückfrage) · „Beantwortet“ (Anhang Pflicht) · bei Löschung: Hinweis „Belege unterliegen 7 Jahren Aufbewahrung (BAO § 132) – sperren statt löschen; im Sperrvermerk festhalten, was gesperrt wurde.“
Rechte: GF, Admin; CRM Leitung lesend. Heute-Chip „Datenschutz: n Tage bis Frist“.
Leer: „Keine Datenschutzanfragen. Eingehende Anfragen hier erfassen – die Frist von einem Monat beginnt mit dem Eingang.“

### 3.17 Austritt (Assistent Z5, `/benutzer/[name]` → `⋯` → „Austragen …“)

| Schritt | Inhalt | Server |
|---|---|---|
| 1 Aufgaben | Liste offener `PH Aufgabe` + `ToDo` der Person; Ziel-Combobox Pflicht („alle an …“ oder je Zeile) | `setValue(zugewiesen_an)` / `setValue(ToDo.allocated_to)` |
| 2 Kunden | `PH Kontakt.berater = Person` → Ziel-Combobox (übersprungen bei 0) | `massenaktionAction` |
| 3 Zugang | Zusammenfassung „5 Aufgaben an Lena, 12 Kontakte an Anna, Konto wird deaktiviert, Sitzungen im Backoffice beendet.“ | `save User enabled=0` (PIN-Anmeldung danach unmöglich, `verify_pin` prüft `enabled`); Backoffice-Store beendet Sitzungen des Benutzers; PIN-Hash löschen und Frappe-Sitzungen beenden ab Anfrage A20 `bediener.austragen` |

Fehler in Schritt n: Schritte davor bleiben, Liste der offenen Schritte mit „Erneut“. Rechte: Admin.

### 3.18 Admin-Kachel „Betriebsbereitschaft“

Sechs Prüfpunkte, je Zeile Haken (`gruen`) oder Satz mit Link:

| Prüfpunkt | Quelle | Fehlersatz |
|---|---|---|
| Testmodus | `PH Einstellungen.testmodus` (+ `site_rolle` ab A1) | „Testmodus ist an.“ → Einstellungen |
| Website-API | `api_aktiv` | „Website-API ist aus.“ |
| Standardfirma vollständig | `PH Firma` Pflichtangaben §3.9 | „Für Rechnungen fehlt: …“ |
| Zugangsschlüssel | ab A16 `schluessel_status()` | „n Schlüssel fehlen.“ (bis A16: Zeile „Nicht prüfbar“) |
| Kassa-Geräte mit Kasse | `list_devices` Typ Kassa ohne `kasse` | „iPad Kassa 1 hat keine Kasse.“ |
| Integrationsfehler 24 h | `PH API Protokoll` | „3 Fehler in 24 h.“ |

---

## 4. Akten

### 4.1 Aufgabenakte `/aufgaben/[name]`

```
┌ Zentrale › Aufgaben › PH-AUF-2026-00031                                                ┐
│ ☐ Angebot AN-2026-00031 nachfassen     ● Offen · fällig vor 2 Tagen   [Erledigen] [⋯] │
│ Zuständig (AB) Anna ▾ · Prio Normal ▾ · Fällig 02.11.2026 ▾ (+1 +7) · Erinnern ☑     │
├ Aufgabe | Verlauf ─────────────────────────────────────────────────────────────────────┤
│ BESCHREIBUNG (Autosave 1 s)                                 ║ BEZUG                    │
│ Kunde wollte bis Freitag Rückmeldung geben …                ║ ▣ Angebot AN-2026-00031  │
│ ERGEBNIS (optional)                                         ║   Gesendet · 12.480,00 € │
│ [                                                   ]       ║ 👤 Huber Maria           │
│                                                             ║ NÄCHSTER SCHRITT         │
│                                                             ║ ▸ Anrufen (bevorzugt Tel.)│
│                                                             ║ ZEITLEISTE …             │
└─────────────────────────────────────────────────────────────╨──────────────────────────┘
```

- Erledigen (`Strg+Enter`) öffnet nie einen Dialog; `ergebnis` ist optional. Status-Badge klickbar (Offen · In Arbeit · Erledigt · Verworfen). Fällig `+1`/`+7` = `verschieben(tage)` (rechnet ab max(fällig, heute)), Datum frei = `setValue`.
- `⋯`: Duplizieren · Verwerfen (Undo) · Löschen **nur Admin** (Rückfrage „Aufgabe löschen? Verwerfen reicht meist.“; Wiederherstellen über Frappe-Papierkorb durch Admin). Leitung verwirft, löscht nicht.
- Bezug: Karte mit Titel, Status, Betrag (Recht), Primäraktion des Bezugsobjekts als „Nächster Schritt“. Kontakt mit `kommunikation_bevorzugt ≠ E-Mail` → „Anrufen“ statt Mail-Vorlage; `nicht_kontaktieren = 1` oder `status = Gesperrt` → kein Kontaktvorschlag, Band „Kontakt nicht erwünscht“. Bezug storniert → Badge „Storniert · GU-…“ + Frage „Aufgabe noch nötig?“ mit „Verwerfen“.
- Zeitleiste: `docinfo`, Kommentar mit `@`.
- Erledigt: Kopf grau, Band „Erledigt am 03.11. 09:12 von Anna“, „Wieder öffnen“. Verworfen: Titel durchgestrichen, Band `neutral-soft`. Quelle `scheduler/workflow/api`: Kennzeichen „automatisch“ (Tooltip + Satz im Kopf), Titel readonly für Mitarbeiter.
- Tastatur: `Strg+Enter` Erledigen, `A`, `D`, `S`, `C`, `Enter` auf Bezug, `Alt+↑/↓`, `Esc` zur Liste.
- Mobil: Akkordeon, Sticky-Footer 52 px „Erledigen“.

ToDo-Einträge haben keine eigene Akte; Klick öffnet das Bezugsobjekt, Erledigen in der Zeile.

### 4.2 Weitere

Benutzer §3.10, Gerät §3.11, Datenschutzanfrage §3.16. API-Protokolleintrag: Sheet, „Erzeugter Datensatz“ öffnet die Akte; kein „Wiederholen“.

---

## 5. Aktionen, Massenaktionen, Assistenten

### 5.1 Aktionsmatrix

| Aktion | Objekt | Server (exakt) | Klasse | UI |
|---|---|---|---|---|
| Aufgabe anlegen | PH Aufgabe | `insert` | – | Dialog, Toast „Öffnen“ |
| Erledigen / Status | PH Aufgabe | `status_setzen(status, ergebnis?)` | umkehrbar | sofort, Undo = `status_setzen(alt)` |
| Erledigen | ToDo | `setValue status=Closed` | umkehrbar | Undo `Open` |
| Fällig verschieben | PH Aufgabe | `verschieben(tage)` / `setValue faellig` | umkehrbar | Undo alter Wert |
| Zuweisen | PH Aufgabe | `setValue zugewiesen_an` (Server spiegelt Assignment) | umkehrbar | Undo |
| Karten verschieben | PH Aufgabe | `status_setzen` | umkehrbar | Undo |
| Löschen | PH Aufgabe | `delete` | irreversibel | nur Admin, Rückfrage |
| Rolle zuweisen/entziehen | User | `rolleAendernAction` | umkehrbar | Undo; Ausnahmen §3.10 Rückfrage |
| Profil anwenden | User | `save role_profile_name` | umkehrbar | Vorschau-Dialog + Undo (vorherige Rollen) |
| Kurzname/Standort | User | `save` Custom Fields (bis A3b) | umkehrbar | Undo |
| Benutzer anlegen | User | `insert User` (+ `set_pin`) | – | Z2 |
| Deaktivieren | User | `save enabled=0` | Außenwirkung | Rückfrage |
| Austragen | User + Bezüge | §3.17 | Außenwirkung | Z5 |
| PIN setzen | User | `ph_core.api.bediener.set_pin` | irreversibel | Dialog |
| Gerät registrieren | PH Geraet | `register_device` | – | Z1 |
| Token erzeugen / erneuern | PH Geraet | `registrieren()` / `token_erneuern()` | – / irreversibel | Token-Dialog / Rückfrage |
| Sperren / Entsperren | PH Geraet | `sperren(grund)` / `entsperren()` | Außenwirkung / umkehrbar | Dialog mit Grund / Undo |
| Testmodus | PH Einstellungen | `save testmodus` (+ `testmodus_grund` ab A1) | Außenwirkung | §3.9.1 |
| Website-API | PH Einstellungen | `save api_aktiv` | Außenwirkung | Rückfrage |
| Einstellungen speichern | PH Einstellungen / PH Firma | `save` (modified) | – | Speicherleiste |
| Als Standardfirma | PH Firma | `save standard=1` | Außenwirkung (Rechtsträger) | Rückfrage, kein Undo |
| Schließtag +/− | PH Betriebsruhe | `save` Elternteil | umkehrbar bis Speichern | Speicherleiste |
| Gelesen / alle gelesen | Notification Log | ⓕ `frappe.desk.doctype.notification_log.notification_log.mark_as_read(docname)`; `mark_all_as_read` | umkehrbar | Undo (Einzel und Menge über Gegenaufruf `setValue read=0` je Name) |
| Freigeben | Fachobjekt | §3.5.2 | geldwirksam → Rückfrage | Bestätigen mit Betrag |
| Ablehnen | Fachobjekt | §3.5.2 | Außenwirkung | Grund, verzögertes Senden 8 s |
| Arbeitsplatz wählen | – | `arbeitsplatzWaehlenAction` | – | sofort |
| Bedienerwechsel | – | `bedienerWechselAction` → `verify_pin` | – | Fehler `invalid_pin {verbleibend}` → „PIN stimmt nicht · noch n Versuche“; `rate_limited {sekunden}` → „Gesperrt für 14:58“ |
| Datenschutz: Auskunft | PH Datenschutzanfrage | `auskunft_sammeln()` (A8) | – | Fortschritt |
| CSV-Export | Listen | `exportCsvAction` + Export-Protokoll (A12) | protokollpflichtig | erst ab A12 |
| Sammeldruck | Liste | Client-Warteschlange / `sammel_pdf` (A19) | – | Fortschritt |

### 5.2 Massenaktionen

| Liste | Aktionen | Besonderheit |
|---|---|---|
| Aufgaben | Erledigen · Zuweisen · Fällig · Status · Drucken · Mehr: Verwerfen | Vorschau „n von m möglich“, Undo 8 s |
| Benutzer | Rolle zuweisen · Standort setzen | Admin |
| Geräte | Sperren (ein Grund für alle) · Entsperren | je Typ-Recht |
| Benachrichtigungen | Als gelesen · Als ungelesen | Undo |

### 5.3 Assistenten

| # | Assistent | Schritte |
|---|---|---|
| Z1 | Gerät registrieren | 1 Daten (3 Pflichtfelder + Kasse bei Kassa) → 2 Token/QR + Live-Verbindung |
| Z2 | Benutzer anlegen | 1 Person + Profil + Standort (+ Ohne Postfach) → 2 Zusammenfassung + PIN |
| Z3 | Sammeldruck | 1 Format/Reihenfolge → 2 Fortschritt → 3 Ergebnis |
| Z5 | Austragen | §3.17 |

---

## 6. Kennzahlen, Charts, Heute-Leiste

Regeln: jede Kennzahl prüft `darfDoc(read)` aller beteiligten DocTypes vorab und fängt Fehler selbst; Beträge in **EUR** (Fremdwährung über `kurs`/`betrag_eur`, Kennzeichen „inkl. CHF umgerechnet“ in der Unterzeile, wenn CHF-Belege enthalten sind); Trendpfeil nur mit geladenem Vergleichswert; Definition steht im Tooltip und im Hilfe-Artikel.

### 6.1 Kennzahlen

| Kennzahl | Rollen | Definition (DocType / Filter) | Unterzeile | Link |
|---|---|---|---|---|
| Offene Anfragen | CRM, GF | `PH Anfrage` `status in [Neu, Qualifiziert]` | Δ zu gestern | `/crm/anfragen?…` |
| Offene Posten | Faktura, GF, Buchhaltung extern | Σ `PH Rechnung.offen_cent × kurs`, `status in [Gestellt, Teilbezahlt, Ueberfaellig, Gemahnt]`, `art != Anzahlungsrechnung` | „n Rechnungen · m überfällig · + Anzahlungsanforderungen x €“ (gleiche Abfrage mit `art = Anzahlungsrechnung`) | `/faktura/rechnungen?…` |
| Umsatz Monat (netto) | GF, Faktura Leitung | Σ `PH Rechnung.netto_cent × kurs` mit `docstatus=1`, `status != Storniert`, `art in [Rechnung, Teilrechnung, Schlussrechnung, Barverkauf]`, `leistungsdatum` im Monat (Rückfall `datum`) − Σ `PH Gutschrift.netto_cent` (`docstatus=1`, `datum` im Monat) + Kassa-Umsatz ohne Rechnung aus `PH Kassenabschluss.umsatz_je_satz` (netto je Satz, Monat). **Doppelzählung vermeiden:** Kassa-Belege mit Rechnungsbezug (Barverkauf als `PH Rechnung`) nicht zusätzlich – Abgrenzung legt Kassa-/Faktura-Fachkonzept fest; bis dahin nur Rechnungen − Gutschriften, Unterzeile „ohne Kassa“. | „Vormonat bis gleicher Tag: …“ | `/faktura/berichte/umsatz` |
| Zahlungseingang Monat | GF (Faktura Leitung ab Anfrage A21 Leserecht `PH Zahlung`) | Σ `PH Zahlung.betrag_eur`, `livemode=1`, `art=Eingang`, `status in [Bezahlt, Teilerstattet]`, im Monat − Σ `art=Erstattung` | „davon Anzahlungen x €“ (Bezug Anzahlungsrechnung/AB) | `/shop/zahlungen?…` |
| Offene Bestellungen | Shop, Logistik, GF | `PH Bestellung` `status in [offen, reserviert, zahlung_ausstehend, bezahlt, versandbereit, abholbereit, pruefen]` | „n abholbereit“ | `/shop/bestellungen` |
| Montagen diese Woche | Projekte, Montage | `PH Montageauftrag` `start between [Mo, So]`, `status != Abgebrochen` | Teams | `/projekte/montagen?…` |
| Offene Servicefälle | Service, Techniker, GF | `PH Servicefall` `status not in [Erledigt, Geschlossen, Abgelehnt]` | „n Fristen ≤ 14 Tage“ aus `regress_frist_bis`/`frist_reaktion` | `/service/faelle` |
| Kassa heute | Kassa, GF | Σ `PH Kassenbeleg.gesamt_cent`, heute, `trainings=0`, `belegart in [Standard, Stornobeleg, Sammelbeleg]`, `status in [Signiert, Ausfall, Nachsigniert]` (Stornobeleg negativ) | „n Belege · m Stornos“ | `/kassa/verwaltung` |
| Integration (Kachel) | Admin, GF | `PH API Protokoll` 24 h: Count gesamt / `Fehler` / `Rate-Limit` | „n Geräte > 24 h nicht gesehen“ | `/protokoll?tab=api` |

Gestrichen als Kennzahl (stehen in der Heute-Leiste/Aufgabenliste): „Termine heute“, „Offene Aufgaben (mir)“.
Darstellung „Umsatz Monat netto“ auf der GF-Zentrale: Instrument Sans 32/500 `tabular-nums`. Bodoni-Kopfzahl nur nach Inhaber-Entscheidung (§13), dann nur diese eine Zahl.

### 6.2 Charts (SVG ohne Bibliothek, `<details>`-Datentabelle)

| Chart | Typ | Quelle | Rollen |
|---|---|---|---|
| Umsatz netto je Monat (6/12 M) | Linie | Definition §6.1 je Monat | GF, Faktura Leitung |
| Anfragen je Woche (8/12 W) | Balken | `PH Anfrage.eingang` | CRM Leitung, GF |
| API-Aufrufe je Tag (30 T) | Balken | `PH API Protokoll.zeitpunkt` | Admin |
| Aufgaben erledigt je Woche (Team) | Balken | `PH Aufgabe.erledigt_am` | **nur** wenn `mitarbeiterauswertung_freigegeben = 1`, dann Leitung/GF; nie je Person |

### 6.3 Heute-Leiste – Quellen

| Chip | Rollen | Abfrage | Ton |
|---|---|---|---|
| n überfällig / n heute (Aufgaben) | alle | PH Aufgabe + ToDo an mich, `faellig/date < heute` / `= heute` | rot / Sand |
| Team: n überfällig | Leitung, GF | wie oben für Team | rot |
| n Termine · nächster hh:mm | CRM | `PH Termin` heute, `status in [Unbestaetigt, Bestaetigt]` | Sand |
| n Anfragen neu | CRM | `PH Anfrage status = Neu`; rot, wenn eine `eingang < jetzt − 24 h` | Sand/rot |
| Montage heute (erster Stopp) | Projekte, Montage | `PH Montageauftrag start = heute` | Sand |
| n Freigaben | Leitung, GF | Summe §3.5.2 (ohne eigene Anträge) | rot |
| Abschluss offen gestern | Kassa | `PH Kassenabschluss` gestern `status in [Offen, Gezaehlt]` | rot |
| Erstattung fällig n | Shop Leitung, GF | `PH Widerruf.erstattung_bis ≤ heute + 3`, nicht erstattet | rot |
| UVA <Monat> fällig 15.<MM> | Faktura Leitung, GF, Buchhaltung extern | ab 5 Tage vorher, solange kein `PH Export Lauf` mit `zeitraum_bis ≥ Monatsende` und Status übergeben/bestätigt | Sand, ≤ 2 Tage rot |
| OSS Q<n> fällig | dito | ∃ `PH Rechnung.ust_fall = OSS` im Quartal; Frist Monatsende nach Quartal | Sand/rot |
| Jahresbeleg prüfen | Kassa Leitung, GF | Jänner bis 15.02., `PH Kassa Ereignis.art = Jahresbeleg Pruefung` nicht erledigt | rot ab 10.02. |
| SEE-Ausfall melden | Kassa Leitung, GF, Admin | `PH Kassa Ereignis.meldung_finanzonline_noetig = 1`, `gemeldet_am` leer | rot |
| DEP sichern (Quartal) | Kassa Leitung | letzter `PH DEP Export` vor Quartalsbeginn | Sand |
| Datenschutz: n Tage bis Frist | GF, Admin | `PH Datenschutzanfrage.frist`/`verlaengert_bis` (ab A8) | ≤ 7 Tage rot |
| Ausfuhrnachweis fehlt n | Faktura Leitung | `PH Rechnung.ust_fall = Ausfuhr` ohne Nachweis-Anhang (Feld laut Faktura-Konzept) | Sand |
| Restlieferung offen n | Logistik, Projekte | Fachbereich Logistik liefert | Sand |

Vertrag je Fachbereich: `lib/backoffice/<bereich>/heute.js` → `heute(client, session)` → `[{ id, text, anzahl, ton: "rot"|"sand"|"neutral", href, rechtsgrundlage? }]`. Fristen-Chips der Zentrale (UVA, OSS, Jahresbeleg, SEE, DEP, Datenschutz) liegen in `lib/backoffice/zentrale/fristen.js`, solange kein Fachbereich sie übernimmt. Tooltip-Beispiel: „Frist nach FAGG: Erstattung binnen 14 Tagen ab Rücktritt.“ Hover 120 ms `ease-out`, sonst keine Animation.

---

## 7. Druck / PDF

| Ausgabe | Format | Weg |
|---|---|---|
| Aufgabenliste (gefiltert) | A4 hoch, 9 pt, Filter als Kopfzeile | Browser `@media print` |
| Benutzerliste / Geräteliste | A4 quer / hoch | Browser |
| Geräte-Einrichtungsblatt | A5: Name, Standort, Arbeitsplatz, QR (`#token=`), 5 Zeilen Anleitung; nur im Token-Dialog | Browser |
| Kürzel-Übersicht | A4, 2 Spalten | Browser |
| Hilfe-Artikel | A4 | Browser |
| Testseiten | A4 / Bon 80 mm / Etikett 62 × 29 | §3.14 |
| Belege aller Bereiche | A4 | `/druck/[doctype]/[name]` + `/pdf` |
| Datenschutz-Auskunft | PDF/ZIP aus `auskunft_sammeln()` | Anhang an der Anfrage (A8) |

Druckstile 03 §10.

---

## 8. Mobile, iPad, Kiosk

### 8.1 iPad quer (1180)

Seitenleiste eingeklappt 64 px; Palette über Lupe-Knopf; Kennzahlen 3 je Zeile (Mitarbeiter 4 in einer); Aufgabenliste 4 Spalten (Aufgabe, Fällig, Zuständig, Status), Rest im Zeilen-Sheet; Checkboxen dauerhaft sichtbar, Ziel 44 × 44; Langdruck 400 ms = Zeilenmenü; Freigabe-Knöpfe 44 px; Hilfe-Panel und Druckvorschau Vollbild-Sheet.

### 8.2 Telefon (< 640)

Zentrale (Heute, Aufgaben), Aufgaben-Karten, Glocke als Bottom-Sheet (Griff 32 × 4), Profil (PIN, Erscheinungsbild). Verwaltung lesend mit Hinweis „Für Verwaltung bitte Tablet oder Desktop.“ – **Ausnahme: „Gerät sperren“** bleibt im Zeilenmenü der Geräteliste bedienbar.

### 8.3 Kiosk-Querschnitt (`KioskShell`)

| Element | Verhalten |
|---|---|
| Kopfzeile 56 px | Arbeitsplatzname (Tipp → Menü: „Arbeitsplatz wechseln …“ nach PIN des aktuellen Bedieners, nur bei > 1 Arbeitsplatz; bei < 1024 px zusätzlich Uhr und Gerätename) · Gerät · Bediener (Avatar 32, Kurzname) · Uhr · Verbindung (Punkt **und** Text „Verbunden/Langsam/Offline“) · Drucker-Icon mit Zustand · Vollbild · „Wechsel“ (`F12`) · Hilfe-Knopf 48 px (`F1`) |
| Bedienerwechsel `/wechsel` | Kacheln 96 × 96 (Initialen, Kurzname) aus `list_operators`; PIN-Ziffernblock 56 px; „OK“; Fehler: Shake 240 ms + „PIN stimmt nicht · noch n Versuche“ (reduziert: Rahmen + Text); Sperre: Countdown; Erfolg: sofort, offener Bon bleibt (Kassa). Idle 15 min → Sperrbild (240 ms Fade), Countdown 30 s vorher. Zweiter Anmeldeweg per Mitarbeiterkarte (Scan) ab Anfrage A22 (WCAG 3.3.8). |
| Gerät gesperrt | Vollbild `danger-soft` „Dieses Gerät wurde gesperrt. Grund: … Leitung fragen.“, kein Weiter |
| Gerät ohne Token | Weiterleitung `/geraet` mit Band „Gerät ist nicht registriert – Token einfügen oder QR scannen.“ |
| Hilfe | Sheet 480 px: Kürzel des Arbeitsplatzes + 5 häufigste Abläufe (`hilfe/kiosk/<arbeitsplatz>.md`) |
| Druckstatus | Fehler → Band „1 Druckauftrag wartet · [Erneut] · [Als PDF]“ (Knöpfe, kein F-Kürzel) |
| Benachrichtigungen | nur Toasts hoher Priorität (SEE-Ausfall, Terminal offline, Abschluss gesperrt), oben Mitte; keine Glocke |
| Testmodus auf Produktiv | rotes Band wie §3.9.1, Zahlart Karte gesperrt (Kassa) |
| Touch | Ziele ≥ 48 px, Druck-Feedback 50 ms, keine Hover-Abhängigkeit |

---

## 9. Datenmapping UI → Frappe

Legende: ✔ vorhanden · ◐ Umweg · ✘ fehlt (Anfrage-Nr. §13) · ⓕ Frappe-Standard

| UI-Funktion | Methode / DocType / Feld | Stand |
|---|---|---|
| Login, 2FA | ⓕ `login`, `get_logged_user`, `User.roles` | ✔ |
| Arbeitsplatz-Kacheln | `erlaubteArbeitsplaetze(session)` | ✔ |
| Gerät prüfen | `ph_core.api.geraete.verify_device(token)` | ✔ · Sperrgrund in 403 ✘ A9 |
| Lebenszeichen | `touch_device(token)` ≤ 1×/60 s | ✔ |
| Geräteliste | `list_devices(nur_aktive, standort, arbeitsplatz)` | ✔ |
| Gerät registrieren | `register_device(geraetename, typ, standort, arbeitsplatz, kasse, drucker, drucker_typ, notizen)` | ✔ · Recht je Typ ✘ A3 · Idempotenz ✘ A9 · `kasse` Pflicht bei Kassa ✘ A9 (UI erzwingt) |
| Token / Sperren | `PH Geraet.registrieren()`, `.token_erneuern()`, `.sperren(grund)`, `.entsperren()` | ✔ |
| Gerätefelder | `save("PH Geraet")` ohne `aktiv` | ✔ · `aktiv` read_only ✘ A9 |
| Bediener | `list_operators`, `verify_pin` (prüft `enabled`), `set_pin` | ✔ · Zielprüfung fremde PIN ✘ A3 · Admin am Kiosk nur mit `ph_core_kiosk_erlaubt` ✘ A3 |
| Kurzname/Standort ohne PIN | `save User` Custom Fields (Admin) | ◐ · `bediener.set_profil` ✘ A3b |
| Benutzer | ⓕ `User` (`full_name, email, enabled, last_active, role_profile_name, roles, phone`) | ✔ |
| Benutzer ohne Postfach | ⓕ `insert User` mit `@kiosk.invalid`, `send_welcome_email=0` | ✔ |
| Austragen | `setValue`, `massenaktion`, `save enabled=0` | ◐ · `bediener.austragen` ✘ A20 |
| Suche | `global_search(q, limit, doctypes)` | ✔ · Ranking, Normalisierung, Zusatzfelder, Betrag ✘ A5 |
| Betragssuche | `getList` je DocType mit eigenem Betragsfeld | ◐ |
| Zuletzt/Angeheftet, Vorlieben geräteübergreifend | localStorage je Benutzer | ◐ · `benutzer.einstellungen` ✘ A6 |
| Aktivität | `recent_activity(limit, bereiche)` | ✔ · `benutzer/seit/bis/start` ✘ A11 |
| Aufgaben | `PH Aufgabe` (`titel, status, prioritaet, faellig, zugewiesen_an, erinnerung, referenz_doctype, referenz_name, kontakt, quelle, beschreibung, erledigt_am, erledigt_von, ergebnis`), `status_setzen`, `verschieben` | ✔ · Rechte nur CRM/GF/Admin ✘ A1 |
| System-Aufgaben | ⓕ `ToDo` (`allocated_to, status, description, reference_type, reference_name, date, priority`) | ✔ · ein Modell ✘ A2 |
| Glocke | ⓕ `Notification Log` (`for_user, read, document_type, document_name, subject`), `mark_as_read`, `mark_all_as_read` | ✔ · gebündelt ✘ A7 |
| Freigaben | §3.5.2 Methoden | ✔ (Kulanz-Methoden vorhanden) · Vier-Augen Zahlung/Eingangsrechnung ✘ A4 |
| Vertretung | `PH Abwesenheit.vertretung` (ph_personal) | ◐ Personal-Konzept liefert Abfrage |
| Kennzahlen | `count`/`getList` (§6.1) | ✔ · Leserecht `PH Zahlung` für Faktura Leitung ✘ A21 |
| Fristen-Chips | `PH Export Lauf`, `PH Rechnung.ust_fall`, `PH Kassa Ereignis`, `PH DEP Export`, `PH Widerruf.erstattung_bis` | ✔ (Feldnamen im Bau gegen JSON prüfen) |
| Einstellungen | `PH Einstellungen` (Single) | ✔ · `site_rolle`, `testmodus_grund` ✘ A1 · `mitarbeiterauswertung_freigegeben` + `rechtsgrundlage` ✘ A10 |
| Firma | `PH Firma` | ✔ · `sitz`, `land` Link, Pflichtfelder ✘ A10 · `steuernummer` permlevel ✘ K1 |
| Firma am Beleg | `PH Rechnung.firma`, `PH Gutschrift.firma` existieren als **Data**, Druck liest Standardfirma | ✘ A7b (Link `PH Firma`, reqd, Druck aus Beleg) |
| Betriebsruhe | Kindtabelle `betriebsruhe` | ✔ |
| Feiertage | `ph_core.utils.feiertage` nur serverseitig | ✘ A14 |
| Nummernkreise | `NUMMERNKREISE` Konstante | ✘ A15 |
| Schlüsselstatus | – | ✘ A16 |
| Datenschutzanfragen | – | ✘ A8 |
| Druck | ⓕ `printview`, `download_pdf`, `Print Format` | ✔ · Testseite ✘ A17 · Sammel-PDF ✘ A19 |
| E-Mail-Zustimmung Rechnung | – | ✘ A18 |
| CSV-Export-Protokoll | – | ✘ A12 |
| API-Nutzdaten nur System Manager | permlevel | ✘ K2 |
| Backoffice-Cache nach Fremdänderung | – | ✘ A23 |
| Rollenliste | `role.json` 29, `PH_ROLLEN` 27 | ◐ K4 |

---

## 10. Automationen

| Automation | Umsetzung | Stand |
|---|---|---|
| Aufgaben-Erinnerung 07:00 | ph_crm `aufgaben_erinnerungen` → Notification Log | vorhanden |
| API-Protokoll aufräumen | ph_core daily | vorhanden |
| PIN-Sperre 5 Fehlversuche / 15 min | `verify_pin` | vorhanden |
| Gerät lange nicht gesehen | Kennzeichen + Admin-Kachel aus `zuletzt_gesehen` | Client |
| Live-Verbindung nach Token-Ausgabe | Polling 5 s, max. 10 min | Client |
| Glocke-Polling 60 s + Fensterfokus | Client | Client |
| Sitzungswarnung 2 min | Client-Timer | Client |
| Palette lernt Vorschläge | localStorage je Benutzer | Client |
| Fristen-Chips | Abfragen §6.3 bei jedem Laden der Zentrale | Client/Server Component |
| Aufgabe „Bestätigung per Post senden“ bei Widerruf ohne E-Mail | ph_shop (A-Liste Fachbereich) | Anfrage |
| Tagesübersicht 07:00 per E-Mail | ph_core Scheduler + Vorlage | Inhaber-Entscheidung + A13 |
| Hinweis „Gerät gesperrt/entsperrt“ an Standort-Leitung | Hook `PH Geraet.on_update` | Anfrage A9 |

---

## 11. Akzeptanzkriterien

Allgemein: `requireSession()` zuerst; `Fehler`-Komponente statt 500; axe serious/critical = 0 hell und dunkel; Tastatur vollständig; keine Frappe-Begriffe in UI-Strings; Beträge aus Cent; Mock-Modus für jede Route; keine offenen Rückfragen im Spezifikationstext (Grep nach Fragezeichen + Leerzeichen + „nein“ über dieses Dokument und `backoffice/src/**` = 0).

| # | Kriterium | Prüfung |
|---|---|---|
| Z-01 | Arbeitsplatz: Taste `2` startet Kassa sofort (Ring sichtbar), `Enter` startet die Vorauswahl; ein Arbeitsplatz → keine Seite; registriertes Gerät → Kiosk | E2E Rollen Verkauf/Kassa/Admin |
| Z-02 | Gesperrtes Gerät: Band (mit Grund ab A9), Kiosk-Kacheln mit sichtbarem Satz deaktiviert; Kiosk zeigt Sperrbild | Mock `aktiv=0` |
| Z-03 | Zentrale < 2,5 s; jede Zone eigener Suspense; Ausfall einer Quelle lässt die anderen stehen | E2E mit Fehler |
| Z-04 | Rollenvarianten §3.2.5 inkl. Reihenfolge der Zonen | Snapshot je Rolle |
| Z-05 | Kennzahlen ohne Recht fehlen; ohne Daten „–“ + sichtbare Unterzeile; Beispielwerte nur im Mock mit Testband | Unit, E2E |
| Z-06 | Heute-Chips nur > 0, rot zuerst; Chip-Zähler = Zeilenzahl der Zielliste | E2E |
| Z-07 | Palette: lokale Gruppe < 150 ms, Datensätze < 400 ms (Mock); `RE-2026-00040`, `re 40`, `re20260040` öffnen denselben Beleg | E2E, Unit |
| Z-08 | Präfix-Token `>` `#` `@` `?` `/` zeigen nur ihre Gruppe, `Backspace` entfernt Token; `Strg+Enter` neuer Tab; `→` Vorschau nur bei Cursor am Ende, Palette-Breite konstant | E2E |
| Z-09 | Palette zeigt nie DocTypes ohne Leserecht, nie Aktionen ohne Recht, nie Personal | Unit, Server-Test |
| Z-10 | Suche nicht erreichbar: lokale Gruppen nutzbar, Fehlerzeile, `Enter` = Erneut | E2E |
| Z-11 | Glocke: Zähler = ungelesen „Für mich“; Klick liest + öffnet; `R` mit Undo; Pop nur bei Zunahme | E2E |
| Z-12 | Freigabe geldwirksam → Dialog mit Betrag; danach „Freigegeben von dir“ | E2E |
| Z-13 | Häkchen setzt Erledigt sofort, Undo stellt her (Aufrufe beide Richtungen; ToDo ebenso) | E2E, Netzwerk-Log |
| Z-14 | Inline-Änderung ≤ 50 ms sichtbar, Fehler setzt zurück, Konflikt gelb | E2E verzögerter Mock |
| Z-15 | `N` öffnet sofort Neu-Menü, `A` Schnellanlage mit Fokus; `@lena` und `+3` am Ende werden Chips | E2E |
| Z-16 | Aufgabe aus Akte: Bezug vorbelegt, `kontakt` vom Server | E2E |
| Z-17 | Aufgabenliste: drei Leerzustände unterscheidbar; Massenaktion mit Vorschau und Ergebnis-Toast | E2E |
| Z-18 | Einstellungen: Speicherleiste nach erster Änderung; IBAN/UID-Fehler am Feld; Verlassen fragt einmal | E2E |
| Z-19 | Nicht-Admin: Einstellungen readonly; Mitarbeiter sehen „Verwaltung“ nicht | Snapshot |
| Z-20 | Benutzerakte: Rolle entziehen mit Undo; Leitung/Admin-Rolle fragt; eigene Admin-Rolle gesperrt mit Satz; „Was darf …“ = `rechte.js` | Unit, E2E |
| Z-21 | PIN: Regeln inline, Wiederholung, Toast ohne PIN, PIN nur im Request an `set_pin` | E2E, Log |
| Z-22 | Token genau einmal sichtbar, Kopieren, QR mit `#token=`, nach Übernahme nicht in der URL; Live-Meldung „hat sich verbunden“ | E2E zwei Kontexte |
| Z-23 | Token erneuern mit Rückfrage; altes Token → `invalid_token`-Band | E2E |
| Z-24 | Sperren mit Pflichtgrund; Entsperren mit Undo (`sperren(grund_alt)`) | E2E |
| Z-25 | Bedienerwechsel: falsche PIN → Shake + Restversuche; 5 → Countdown; richtige < 3 s; Idle 15 min | E2E Kiosk |
| Z-26 | Protokoll-Reiter nach Rechten; Nutzdaten nur System Manager; Aktivität nie mit Feldwerten | Snapshot |
| Z-27 | Hilfe `?`: Panel 480 px mit Artikel oder Hinweis; Kürzel-Reiter nie leer; `?` im Feld tippt; Fokus kehrt zurück | E2E |
| Z-28 | Tooltip, Palette, Dialog zeigen für „Zuweisen“ dieselbe Taste (eine `id`) | Unit |
| Z-29 | Druckvorschau Sheet 800 px (≥ 1280), Zoom „Breite“, PDF-Route liefert `application/pdf` bzw. `unavailable`-Hinweis | E2E |
| Z-30 | Warteschlange überlebt Neuladen; Erneut/Als PDF; Testseite je Typ | E2E |
| Z-31 | Konflikt zeigt nur Abweichungen; nach „Neu laden“ Panel mit eigenen Eingaben, „Übernehmen“ je Feld | E2E zwei Tabs |
| Z-32 | Sitzungsablauf: Overlay, Eingaben bleiben, Aktion wiederholt; Warn-Toast bleibt bis Handlung | E2E |
| Z-33 | Bewegung laut §2.5; `prefers-reduced-motion` → nur Opazität ≤ 120 ms | Playwright beide Modi |
| Z-34 | Zentrale JS ≤ 180 kB gzip; Palette ohne Zusatzbibliothek; CLS < 0,05 | Build, Lighthouse |
| Z-35 | Texte: keine Superlative, keine Ausrufezeichen, Knöpfe Verben ≤ 3 Wörter | Review, Grep |
| Z-36 | Einzeltasten aus → `Z`, `R`, `G …`, `N …`, `1–6`, `?`, `/` wirken nicht; `Strg+K`, `Strg+Z`, `F8`, `Esc` wirken | E2E |
| Z-37 | `huber` + Enter 50 ms nach letzter Taste (Mock-Latenz 300 ms) öffnet Datensatz 1, nie „Neue Aufgabe“; ohne Treffer `/suche?q=huber` | E2E |
| Z-38 | „Lieferung 12.11. bestätigen“ bleibt unverändert; „Rückruf Huber +3“ → Chip, `Backspace` stellt „+3“ her | Unit, E2E |
| Z-39 | Rolle ohne `create` auf PH Aufgabe: kein Knopf, keine Palette-Aktion, keine Inline-Zeile, kein `N A`; ToDos erscheinen trotzdem | Snapshot Logistik |
| Z-40 | Testmodus speichert nach Rückfrage ohne Speicherleiste; Benutzerakte ohne Speichern-Knopf | E2E |
| Z-41 | Jede Zeile §1 als Klickfolge gemessen = Zielwert | E2E Klickzähler |
| Z-42 | Leerzustände (Geräte, Firma, Betriebsruhe, Zuletzt, Aktivität, Charts, Freigaben, Warteschlange, Formate, Drucker, Verlauf, Benutzer-Filter, Datenschutz) mit leerem Seed: Text + Aktion; Freigaben ohne Höhenwechsel | Snapshot, CLS |
| Z-43 | „Alle gelesen“, Karten-Verschieben, Profil anwenden mit Undo; `Z` trifft nur den jüngsten Toast mit Undo | E2E |
| Z-44 | Erledigte Zeile bleibt 8 s, Zeile darunter bewegt sich nicht; Doppelklick erledigt keine zweite | E2E Zeigerposition |
| Z-45 | Telefon 390 px: Erledigen per Häkchen-Ziel ohne Wischen; Glocke Bottom-Sheet; Wischen rechts = Primär überall | Touch-Emulation |
| Z-46 | Arbeitsplatz bei 820 px ohne horizontalen Scroll (3 + 2); Kicker ≥ 4,5:1; Kiosk-Kopfzeile bietet Wechsel | E2E, axe |
| Z-47 | Hilfe-Knopf an genau einer Stelle der Kopfzeile auf jeder Seite; `Strg+/` öffnet Kürzel-Dialog | Snapshot |
| Z-48 | Druckvorschau: 9-pt-Text bei 100 % lesbar | visueller Test |
| Z-49 | `kuerzel.js`: keine Doppelbelegung je Kontext; Windows `Strg`, Mac `⌘` überall | Unit, E2E |
| Z-50 | Zweiter Benutzer am selben Browser sieht weder Zuletzt noch Vorschläge noch Entwürfe des ersten | E2E zwei Logins |
| Z-51 | Motion-Werte aus `motion.js`, Snapshot gegen §2.5 | Unit |
| Z-52 | Keine Selbstgespräche im Text: Grep nach Fragezeichen + Leerzeichen + „nein“ = 0 | Grep |
| Z-53 | Testmodus-Rückfrage nennt Mails, Vermerk TEST, simulierte Kartenzahlung, weiterhin signierte Belege; bei `site_rolle=Produktiv` Pflichtgrund + rotes Band nicht schließbar (ab A1; vorher orange mit Produktiv-Satz) | E2E |
| Z-54 | „Umsatz Monat netto“: Testdaten mit Anzahlungsrechnung, Gutschrift, CHF-Rechnung, stornierter Rechnung, Gutscheinverkauf → Wert = Rechnungen (ohne Anzahlung/Storno, CHF umgerechnet) − Gutschriften; Zahlungen fließen nicht ein | Unit `zentrale/umsatz.js` |
| Z-55 | „Zahlungseingang“: `livemode=0` und Erstattungen korrekt; Faktura Leitung ohne `PH Zahlung`-Recht sieht die Kennzahl nicht (kein Fehler) | Unit, Snapshot |
| Z-56 | Offene Posten ohne Anzahlungsrechnungen, Unterzeile zeigt sie getrennt; Summe in EUR | Unit |
| Z-57 | „Kassa heute“ zählt keine Trainings-, Null-, Monats-, Jahres-, Start-, Schlussbelege; Storno negativ | Unit |
| Z-58 | Freigabe eigener Antrag: Knopf gesperrt mit sichtbarem Satz; Ablehnen mit Pflichtgrund und verzögertem Senden (Undo verhindert den Aufruf) | E2E |
| Z-59 | Abwesenheit: Glocke/Team zeigen nie `art` außer „Urlaubsantrag“, nie `begruendung`; Krankenstand nie als Freigabe | Snapshot Mock |
| Z-60 | Aktivität ohne Person-Filter und ohne Team-Erledigt-Chart, solange `mitarbeiterauswertung_freigegeben` ≠ 1; `last_active` nur Admin | Snapshot Leitung |
| Z-61 | Geräte: Kassa-Leitung sieht nur Typ Kassa; Marketing-Leitung sieht keinen Registrieren-Knopf; Typ Kassa ohne Kasse nicht absendbar; `aktiv` nicht im Formular | Snapshot, E2E |
| Z-62 | PIN-Knopf für Leitung fehlt bei Ziel mit Admin/GF/Leitung-Rolle und bei Ziel ohne gemeinsame Bereichsrolle | Snapshot |
| Z-63 | „Als Standardfirma“: Rückfrage mit Rechtsträger-Satz, kein Undo-Toast; Firma ohne Pflichtangaben zeigt Liste der fehlenden Angaben | E2E |
| Z-64 | Benutzer ohne Postfach: E-Mail `…@kiosk.invalid`, keine Einladung, PIN Pflicht, nur Kiosk-Profile; kein Passwort-Reset im Menü | E2E |
| Z-65 | Austragen Z5: Aufgaben/ToDos und Kontakte umverteilt, Konto deaktiviert, Backoffice-Sitzungen beendet; Fehler in Schritt 2 lässt Schritt 1 bestehen | E2E Mock |
| Z-66 | Steuerberater: Palette sendet genau die Buchhaltungs-DocTypes; keine Aufgaben/Aktivität; Fristen-Chips UVA/OSS sichtbar | Netzwerk-Log, Snapshot |
| Z-67 | Fristen-Chips: UVA erscheint 5 Tage vor dem 15., rot ab 2 Tagen; verschwindet mit übergebenem Export-Lauf | Unit `fristen.js` mit festem Datum |
| Z-68 | Betragssuche: `3.744,00` findet Rechnung (`brutto_cent`), Zahlung (`betrag_cent`, EUR), Kassenbeleg (`gesamt_cent`); `CHF 1200` nur CHF-Belege | Unit, E2E |
| Z-69 | ToDo mit `reference_type = PH Aufgabe` erscheint nicht doppelt; ToDo zu offener Freigabe nur als Freigabe | Unit `aufgaben/quellen.js` |

---

## 12. Was hier anders ist als in SHD marahplus und typischer Branchensoftware

1. Ein Eingabefeld für Datensätze, Seiten, Aktionen und Hilfe mit Nummern-, Telefon-, Betrags- und Datumserkennung; Enter öffnet zuverlässig den ersten Treffer.
2. Rückgängig statt Rückfrage für Alltagsaktionen (8 s, `Strg+Z`/`Z`), Rückfrage nur bei Geld, Recht, Außenwirkung.
3. Ein Login, danach Arbeitsplatz; gerätegebundener Start mit Token-Hash, Sperren aus der Ferne mit sichtbarem Grund, Bedienerwechsel per PIN – Kassa, Packtisch, Montage und Backoffice in einer Anwendung mit einer Rechteverwaltung.
4. Zentrale je Rolle ohne Konfiguration: Steuerberater drei Kacheln und Fristen, GF Freigaben und Nettoumsatz, Monteur seine Stopps.
5. Freigaben mit Vier-Augen-Regel, Betrag und Frist direkt in Zentrale und Glocke.
6. Gesetzliche Fristen (UVA, OSS, RKSV, DSGVO, FAGG) als Chips am Arbeitsbeginn statt im Kalender des Steuerberaters.
7. Hilfe und Kürzel aus einer Quelle am Ort der Arbeit, abschaltbare Einzeltasten.
8. Aufgaben aus Menschen- und Systemquelle in einer Liste; Erledigtes bleibt stehen, bis Rückgängig abgelaufen ist.
9. Datensparsamer Aktivitätsstrom; Mitarbeiterauswertung nur mit dokumentierter Rechtsgrundlage.
10. Geräte- und Benutzerverwaltung samt Austritt in wenigen Schritten, ohne Admin-Konsole.

---

## 13. Offene Punkte und Anfragen

### 13.1 Anfragen an Backend (Priorität 1 = blockiert Zusagen oder Recht/Sicherheit)

| Nr. | Prio | An | Punkt |
|---|---|---|---|
| A1 | 1 | ph_crm | `PH Aufgabe` Rechte für alle PH-Rollen (read/write/create eigene; User Permission `zugewiesen_an` für Mitarbeiter; Leitung alle); Server-Default `faellig = morgen` (K5) · ph_core: `PH Einstellungen.site_rolle` (Staging/Produktiv, aus `site_config`), `testmodus_grund`, `ping` liefert `site_rolle`; `after_install` überschreibt `testmodus` auf Produktiv nicht (K3) |
| A2 | 2 | ph_core + alle Apps | Ein Aufgabenmodell: `PH Aufgabe` nach ph_core, Helfer `ph_core.utils.aufgaben.anlegen(...)`, ToDo-Erzeuger umstellen |
| A3 | 1 | ph_core | `register_device` Rollen je Typ; `set_pin(user≠ich)` Zielprüfung; `list_operators` Admins nur mit `User.ph_core_kiosk_erlaubt`; `ph_core_pin_hash` permlevel 1/Password (PLAN §9) · A3b: `bediener.set_profil(user, standort, kurzname)` |
| A4 | 1 | ph_shop, ph_faktura | Vier-Augen: `erstattung_freigeben` prüft `session.user != erstattung_angefordert_von`; `PH Eingangsrechnung.freigeben` prüft `!= geprueft_von`; Ausnahmegrenze `PH Einstellungen.vier_augen_ausnahme_bis_cent` (Default 0); Feld „eigener Antrag“ oder Antragsteller in der Liste lesbar |
| A5 | 2 | ph_core | `global_search`: Score, Normalisierung (Umlaute, Nummern, Telefon), Zusatzfelder, Betragssuche je DocType mit Währung |
| A6 | 3 | ph_core | `benutzer.einstellungen(get/set)` (Zuletzt, Angeheftet, Erscheinungsbild, Dichte, Einzeltasten, Erstbesuch, Palette) |
| A7 | 3 | ph_core | `benachrichtigungen(seit, reiter)` + `markiere_gelesen(namen, gelesen)` |
| A7b | 1 sobald 2. Firma | ph_faktura | `firma` (heute Data) → Link `PH Firma`, reqd, Default Standardfirma, read_only nach Buchen, an Rechnung, Gutschrift, AB, Angebot, Mahnung; Druck `ph_firma(doc.firma)`; Firma nicht löschbar bei Referenz |
| A8 | 1 | ph_core | DocType `PH Datenschutzanfrage` (Felder §3.16, Serie `DS-.YYYY.-.####`), `auskunft_sammeln()`, Hook `ph_core_datenauskunft` |
| A9 | 1 | ph_core | `PH Geraet.aktiv` read_only + Änderung nur über Methoden; `kasse` Pflicht bei Typ Kassa; `gesperrt_grund` in 403; `register_device` mit `idempotency_key`; Hook Benachrichtigung bei Sperre |
| A10 | 1 | ph_core | `PH Firma.sitz`, `land` Link Country, Pflichtfelder bei `standard=1`; `PH Einstellungen.mitarbeiterauswertung_freigegeben` + `rechtsgrundlage` + `freigegeben_am` |
| A11 | 3 | ph_core | `recent_activity`: `benutzer` (nur mit A10-Freigabe), `seit`, `bis`, `start` |
| A12 | 2 | ph_core | `audit.export_protokoll(doctype, anzahl, filter_hash)` – Voraussetzung für jeden CSV-Export der Zentrale |
| A13 | 3 | ph_core | Tagesübersicht 07:00 (nach Inhaber-Entscheidung) |
| A14 | 3 | ph_core | `api.kalender.feiertage(jahr)`, `ist_geschlossen(datum)` |
| A15 | 3 | ph_core | `api.nummernkreise()` |
| A16 | 2 | ph_core | `api.schluessel_status()` (nie Werte) |
| A17 | 3 | ph_core | Print Format „PH Testseite“ |
| A18 | 2 | ph_crm | `PH Kontakt.rechnung_per_email_zugestimmt` (+ Datum), § 11 Abs 2 UStG |
| A19 | 3 | ph_core | `api.druck.sammel_pdf(doctype, namen, format)` ≤ 50 |
| A20 | 2 | ph_core | `bediener.austragen(user, ziel_user)` (PIN-Hash löschen, Frappe-Sitzungen beenden) |
| A21 | 2 | ph_shop | `PH Zahlung` read/report für `PH Faktura Leitung` |
| A22 | 3 | ph_core | `verify_badge` (Kiosk-Anmeldung per Mitarbeiterkarte) |
| A23 | 3 | ph_core | `revalidate_backoffice(tags)` + Webhook |
| K1/K2 | 2 | ph_core | `PH Firma.steuernummer` permlevel 1; `PH API Protokoll.anfrage_json/antwort_json` permlevel 1 nur System Manager |
| K4 | 3 | ph_core | `PH_ROLLEN` um Kundenkarte-Rollen ergänzen, README mitziehen |
| – | 2 | ph_shop | `PH Widerruf`: `kunde_email` nur Pflicht bei Kanal Formular/E-Mail, Feld `auftrag` (Link AB), `bestaetigung_kanal`; Aufgabe „Bestätigung per Post“ |
| – | 2 | ph_kassa | Abgrenzung Kassa-Umsatz ohne Rechnung für „Umsatz netto“; offene Offline-Belege beim Sperren melden; Karte sperren bei Testmodus auf Produktiv |
| – | 2 | ph_personal | Abfrage Abwesenheit „abwesend von–bis“ + `vertretung` ohne Art/Begründung |

Erledigt seit Fachkritik (geprüft 04.11.): `PH Servicefall.kulanz_freigeben(kommentar, betrag_cent)` und `kulanz_ablehnen(grund)` existieren (Fach-P6/F5 entfällt).

### 13.2 Inhaber / Steuerberater

| Frage | Standard bis zur Entscheidung |
|---|---|
| Bodoni-Kopfzahl „Umsatz Monat netto“ auf GF-Zentrale | nein (Instrument Sans 32/500) |
| Mitarbeiterauswertung (Person-Filter, Team-Chart, `last_active` für Leitung) und Rechtsgrundlage (Betriebsvereinbarung / Einzelzustimmungen AVRAG § 10) | aus |
| Kursverfahren CHF (EZB-Tageskurs / BMF-Durchschnittskurs, UStG § 20 Abs 6) | Kurs am Beleg (`kurs`) |
| Vier-Augen-Ausnahmegrenze | 0 € (immer zwei Personen) |
| Zweite Firma (Yacht/Hotel) geplant | Firmen-Umschalter aus |
| Tagesübersicht per E-Mail | aus |
| Kiosk-Rollen dürfen Aufgaben anlegen | ja, sobald A1 (eigene + Bezug) |
| Standard-Dichte Desktop | Komfortabel |
| 404-gleich bei fehlendem Recht (05 §8.3) | `/kein-zugriff` mit Kontakt der Leitung |

### 13.3 Leitlinien nachziehen (Querschnitt besitzt die Entscheidung)

02 §2.2/03 §8.13 `#` = Objektart · 02 §9.1 `/` = Kontext-Suche · 02 §6/04 §3.6 Undo 8 s, `Strg+Z` und `Z` · 04 §3.6 Gegenaktion als Standard · 03 Toast 160/120 ms, Palette 140 ms, Dialog 160 ms, Sheet 200 ms, Popover 120 ms, Tooltip 400 ms · 02 §13 Kennzahl zählt hoch (nach 04) · 03 §8.14 max. 6 Kennzahlen, Streifen · 02 §8/§10 Hilfe-Panel 480 px in der Kopfzeile · 02 §11.2 Wischen rechts = Primär, links = Menü.

---

## 14. Bauauftrag

### 14.1 Dateien und Routen (alle in `backoffice/`)

| Pfad | Art | Inhalt |
|---|---|---|
| `src/app/page.js` | ändern | Zentrale: liest `zentraleLayout(session)`, rendert Zonen je in `<Suspense>` |
| `src/app/arbeitsplatz/page.js` | ändern | Raster, Vorauswahl, `1–5`, Kontakt-Popover |
| `src/app/arbeitsplatz/ArbeitsplatzTasten.js` | neu (client) | Ziffern-Handler |
| `src/app/aufgaben/page.js`, `AufgabenListe.js`, `AufgabenKarten.js` | neu | §3.6 |
| `src/app/aufgaben/[name]/page.js` | neu | §4.1 |
| `src/app/benachrichtigungen/page.js` | neu | §3.5.3 |
| `src/app/suche/page.js` | neu | §3.4 (GET-Formular) |
| `src/app/verwaltung/page.js` | neu | Hub §2.2 |
| `src/app/protokoll/page.js` | ändern | Reiter §3.8 |
| `src/app/einstellungen/page.js` + `FirmaReiter.js`, `AllgemeinReiter.js`, `WebsiteReiter.js`, `KalenderReiter.js`, `SystemReiter.js`, `SchalterMitWirkung.js` | ändern/neu | §3.9 |
| `src/app/benutzer/page.js` | ändern | Liste |
| `src/app/benutzer/neu/page.js`, `BenutzerAssistent.js` | neu | Z2 |
| `src/app/benutzer/[name]/page.js`, `ZugriffReiter.js`, `AustragenAssistent.js` | neu | §3.10, Z5 |
| `src/app/benutzer/ich/page.js` | neu | Weiterleitung auf eigenes Profil |
| `src/app/geraete/page.js`, `neu/page.js`, `[name]/page.js`, `TokenDialog.js` | neu | §3.11 (bestehende `geraet/GeraeteTabelle.js` hierher verschieben) |
| `src/app/geraet/page.js`, `GeraetForm.js` | ändern | `#token=` lesen + `replaceState` |
| `src/app/druck/page.js` | neu | Druckzentrale §3.14 |
| `src/app/hilfe/page.js`, `src/app/hilfe/[bereich]/[seite]/page.js` | neu | §3.12 |
| `src/app/datenschutz/page.js`, `[name]/page.js` | neu, Phase 6 | §3.16 (nach A8) |
| `hilfe/zentrale/*.md`, `hilfe/glossar.md`, `hilfe/kiosk/*.md` | neu | Inhalte Zentrale (Dashboard inkl. Kennzahl-Definitionen, Aufgaben, Verwaltung, Geräte, Benutzer, Palette) |
| `src/lib/backoffice/kuerzel.js` | neu | Register §2.4 + `taste(id, plattform)` + `istEinzeltaste` |
| `src/lib/backoffice/motion.js` | neu | Token §2.5 |
| `src/lib/backoffice/benutzerSpeicher.js` | neu | `schluessel(session, name)` → `ph-bo:<sha256(user)[0..12]>:<name>`; try/catch je Zugriff; Abmelden löscht Entwürfe |
| `src/lib/backoffice/zentrale/layout.js` | neu | Rollenvarianten → Zonen, `PRIMAER_JE_PROFIL` |
| `src/lib/backoffice/zentrale/kennzahlen.js` | neu | §6.1 (ersetzt Teile von `dashboard.js`) |
| `src/lib/backoffice/zentrale/umsatz.js` | neu | Umsatz netto, Zahlungseingang, EUR-Umrechnung |
| `src/lib/backoffice/zentrale/heute.js`, `fristen.js` | neu | §6.3 |
| `src/lib/backoffice/zentrale/freigaben.js` | neu | sammelt `freigaben()` der Bereiche, Vier-Augen-Merkmal, Dubletten-Filter |
| `src/lib/backoffice/zentrale/actions.js` | neu (`"use server"`) | §14.3 |
| `src/lib/backoffice/aufgaben/quellen.js` | neu | PH Aufgabe + ToDo zusammenführen, Mapping §3.6.1 |
| `src/lib/backoffice/aufgaben/titelParser.js` | neu | Token-Erkennung §3.7 |
| `src/lib/backoffice/suche.js` | ändern | Enter-Puffer-Logik (Client-Teil in Palette), Betragsmuster, CHF, `ENTW`, Steuerberater-DocTypes |
| `src/lib/backoffice/bereiche.js` | ändern | Navigation Zentrale §2.2, `ROUTEN` |
| `tests/unit/backoffice-kuerzel.test.mjs`, `-titelparser.test.mjs`, `-umsatz.test.mjs`, `-fristen.test.mjs`, `-aufgabenquellen.test.mjs`, `-suche-betrag.test.mjs` | neu | Z-28, Z-38, Z-49, Z-54–57, Z-67–69 |
| `tests/e2e/zentrale.spec.js`, `verwaltung.spec.js`, `palette.spec.js`, `kiosk-querschnitt.spec.js` | neu | §11 |

### 14.2 Komponenten (`src/components/Backoffice/…`)

| Komponente | Ort | Zweck / Props |
|---|---|---|
| `Shell/Kopfzeile` | ändern `Shell.js` | Suchfeld (Tastenkappe aus `kuerzel.js`), Glocke, `HilfeKnopf`, Avatar |
| `Shell/HilfeKnopf`, `Hilfe/HilfePanel` | neu | Sheet 480, Reiter, Markdown-Rendering (ohne Fremdbibliothek: eigener Mini-Renderer für h2/h3/Listen/Links) |
| `Shell/KuerzelDialog` | neu | `Strg+/` |
| `Shell/Befehlspalette` | ändern | Token-Chips, Enter-Puffer, Vorschau-Spalte fest 880 |
| `Shell/Glocke` | ändern | Reiter nach Recht, Bottom-Sheet < 640, Undo „alle gelesen“ |
| `Shell/BenutzerMenu` | ändern | Arbeitsplätze als Menüpunkte `1–5`, PIN ändern, Einzeltasten-Schalter |
| `Shell/GehZuHinweis` | neu | Zeile mit Zielen nach `G` |
| `Shell/NeuMenue` | neu | `N` sofort, Buchstaben |
| `Shell/Systemband` | ändern `Testband.js` | orange/rot nach §3.9.1 |
| `Toast` | ändern | Undo-Register (nur jüngster mit Undo reagiert auf `Z`), `role="alert"` für Warnungen, Platz über Massenaktionsleiste |
| `Zentrale/Seitenkopf`, `HeuteLeiste`, `KennzahlStreifen`, `AufgabenKachel`, `ZuletztKachel`, `FreigabenKachel`, `AktivitaetKachel`, `ChartsZone`, `IntegrationKachel`, `BetriebsbereitschaftKachel`, `ExternKacheln`, `StempelKachel` (Personal liefert Inhalt) | neu | §3.2 |
| `Aufgabe/AufgabeZeile` | neu | Häkchen-Ziel, „Erledigt · Rückgängig“-Zustand, Kollaps 160 ms |
| `Aufgabe/Schnellanlage`, `Aufgabe/TokenChips` | neu | §3.7 |
| `Freigabe/FreigabeEintrag` | neu | gemeinsam für Zentrale und Glocke |
| `KontaktPopover` | neu | „Wen frage ich?“ |
| `Druck/Druckvorschau` | neu | Sheet 800, Zoom, Seiten |
| `Konflikt/KonfliktDialog`, `Konflikt/EigeneEingabenPanel` | neu | §3.15 |
| `Speicherleiste` | neu (falls Fundament nicht liefert) | Ungespeichert · Verwerfen · Speichern |
| `Sheet`, `Popover`, `Tabs`, `Dialog` | Fundament (03 §12); falls fehlend in Phase 0 bauen | |
| `Begriff` | neu | Glossar-Popover |

### 14.3 Server Actions (`src/lib/backoffice/zentrale/actions.js`, `"use server"`)

Jede Action: `requireSession()` → Rechte (`darf`/`darfDoc`) → Aufruf über `backoffice(session)` bzw. `phCore()` → Rückgabe `{ ok, daten?, undo?, fehler? }` (`undo` = Argumente der Gegenaktion) → `refresh()` aus `next/cache` für die aktuelle Ansicht; `updateTag("zentrale:<user>")`, falls Kacheln getaggt gecacht werden. Vorhandene Actions in `actions.js` werden wiederverwendet, nicht dupliziert.

| Action | nutzt | Rückgabe/Undo |
|---|---|---|
| `aufgabeAnlegenAction({titel, faellig, zugewiesen_an, prioritaet, referenz_doctype, referenz_name, beschreibung, erinnerung})` | `speichernDokumentAction`-Logik | `{name}` |
| `aufgabeStatusAction({quelle:"aufgabe"\|"todo", name, status, ergebnis})` | `runDocMethod("PH Aufgabe", name, "status_setzen")` / `setValue("ToDo")` | `undo: {status: alt}` |
| `aufgabeVerschiebenAction({name, tage \| datum})` | `verschieben` / `setValue` | `undo: {datum: alt}` |
| `aufgabeZuweisenAction({name, user})` | `setzeWertAction` | `undo: {user: alt}` |
| `aufgabenMassenAction({namen, aktion, wert})` | je Name, Ergebnisliste | `{ok:n, uebersprungen:[…], undo:[…]}` |
| `gelesenAction({namen, gelesen})` | `mark_as_read` / `setValue read` | `undo: {namen, gelesen: !gelesen}` |
| `freigabeAction({doctype, name, methode, args})` | `dokumentMethodeAction`; prüft vorab `eigener_antrag` serverseitig erneut | `{ok}`; kein Undo |
| `ablehnenAction({doctype, name, methode, grund})` | wird vom Client erst nach 8 s ohne Undo aufgerufen | `{ok}` |
| `testmodusSchaltenAction({an, grund})` | `save PH Einstellungen` | `{ok}` |
| `apiSchaltenAction({an})` | dito | `{ok}` |
| `einstellungenSpeichernAction({doctype, name, werte, modified})` | `save` | Konflikt → `{fehler:{code:"conflict", felder}}` |
| `firmaStandardSetzenAction({name})` | `save PH Firma standard=1` | – |
| `profilAnwendenAction({user, profil})` | `save User role_profile_name` | `undo: {rollen: vorher}` |
| `rollenSetzenAction({user, rollen})` | Gegenaktion für Profil-Undo | – |
| `benutzerFeldAction({user, feld:"ph_core_kurzname"\|"ph_core_standort", wert})` | `save User` | `undo` |
| `benutzerAnlegenAction({…, ohnePostfach, pin})` | `insert User`, optional `setPin` | `{name}` |
| `benutzerDeaktivierenAction({user, aktiv})` | `save enabled` + Store `endeSitzungenVon(user)` | – |
| `benutzerAustragenAction({user, ziel_aufgaben, ziel_kontakte})` | Schrittfolge §3.17, Ergebnis je Schritt | `{schritte:[{id, ok, fehler}]}` |
| `pinSetzenAction({user, pin, wiederholung})` | `setPin` (vorhanden in `frappe/core.js`) | nie PIN in Antwort |
| `geraetRegistrierenAction` | vorhanden, erweitern (Typ-Recht, Kasse Pflicht) | `{token, geraet}` |
| `geraetMethodeAction({name, methode:"registrieren"\|"token_erneuern"\|"sperren"\|"entsperren", grund})` | `dokumentMethodeAction` | Entsperren: `undo:{methode:"sperren", grund: alt}` |
| `geraetVerbundenAction({name, seit})` | `listDevices` → `zuletzt_gesehen > seit` | `{verbunden, zeit}` (für Polling) |
| `betriebsruheAction` | über `einstellungenSpeichernAction` | – |
| `datenschutzAction({name, aktion, …})` | Phase 6, nach A8 | – |

### 14.4 Frappe-Aufrufe (zusammengefasst, alle serverseitig mit Benutzer-Sitzung)

- `frappe.client.get_list` / `get_count` / `get` / `set_value` / `save` / `insert` (über `FrappeClient`): PH Aufgabe, ToDo, Notification Log, User, Role Profile, Has Role, PH Firma, PH Einstellungen, PH Geraet, PH API Protokoll, Error Log, Activity Log, Print Format, PH Anfrage, PH Termin, PH Rechnung, PH Gutschrift, PH Zahlung, PH Bestellung, PH Montageauftrag, PH Servicefall, PH Kassenbeleg, PH Kassenabschluss, PH Kassa Ereignis, PH DEP Export, PH Export Lauf, PH Widerruf, PH Kontakt (berater), PH Abwesenheit (über Personal-Helfer).
- `run_doc_method`: `PH Aufgabe.status_setzen/verschieben`, `PH Geraet.registrieren/token_erneuern/sperren/entsperren`, Freigabemethoden §3.5.2.
- `ph_core.api.geraete.*`, `ph_core.api.bediener.*`, `ph_core.api.suche.global_search`, `ph_core.api.aktivitaet.recent_activity` über `phCore()` (vorhanden).
- ⓕ `frappe.desk.doctype.notification_log.notification_log.mark_as_read`, `mark_all_as_read`; `frappe.core.doctype.user.user.reset_password`; `frappe.www.printview`, `frappe.utils.print_format.download_pdf`.
- Service-Token nur für `verify_device`/`touch_device`/`verify_pin` (wie Fundament), nie für Benutzeraktionen.

### 14.5 Reihenfolge und Aufwand (Schätzung in Agent-Stunden, inkl. Unit-Tests der Phase)

| Phase | Inhalt | Agent-h | Voraussetzung |
|---|---|---|---|
| 0 Querschnitt-Grundlagen | `kuerzel.js` + Test, `motion.js`, `benutzerSpeicher.js`, Toast-Undo-Register, Sheet/Popover/Tabs/Dialog/Speicherleiste falls fehlend | 8 | Fundament-Komponenten prüfen |
| 1 Shell | Kopfzeile mit Hilfe-Knopf, Benutzer-Menü, Neu-Menü, G-Hinweis, Einzeltasten-Schalter, Systemband, Palette-Ausbau (Token, Enter-Puffer, Betrag, Vorschau), Glocke (Notification Log + ToDo + Reiter + Undo) | 14 | Phase 0 |
| 2 Zentrale | Layout je Rolle, Heute-Leiste, Fristen, Kennzahl-Streifen, Umsatz/Zahlungseingang/OP/Kassa-Definitionen, Aufgaben- und Zuletzt-Kachel, Freigaben (Vertrag + Eintrag), Aktivität, Charts, Admin-Kacheln, Extern/Selbstservice | 16 | Phase 1; Fachbereiche liefern `freigaben()`/`heute()`/`kennzahlen()` (bis dahin Zentrale-eigene Abfragen §6) |
| 3 Aufgaben | Quellen-Zusammenführung, Liste, Karten, Schnellanlage + Parser, Akte, Massenaktionen | 12 | Phase 0/1 |
| 4 Verwaltung | Hub, Einstellungen (5 Reiter, Testmodus), Benutzer (Liste, Akte, Z2, PIN, Z5 ohne Server-Teil), Geräte (Liste, Akte, Z1, Token-Dialog, Live-Verbindung, `/geraet`-Fragment), Protokoll-Reiter | 18 | Phase 0 |
| 5 Druck, Hilfe, Suche | Druckzentrale, Druckvorschau 800, `/suche`, Hilfe-Panel + Seiten + Inhalte Zentrale, Kürzel-Dialog, Konfliktdialog | 10 | Phase 1 |
| 6 Server-abhängig | Datenschutz (A8), Vier-Augen-Serverfehler anzeigen (A4), `site_rolle` (A1), Sperrgrund (A9), PIN-Zielprüfung (A3), Austragen-Servermethode (A20), Export mit Protokoll (A12) | 8 | Anfragen geliefert |
| 7 QA | E2E §11, axe hell/dunkel, Reduced Motion, Touch-Emulation, Klickzähler, Budget | 10 | alle |
| **Summe** | | **96** | |

Parallelisierbar: Phase 3 und 4 nach Phase 0; Phase 5 nach Phase 1.

### 14.6 Abhängigkeiten zu anderen Bereichen

| Bereich | liefert an Zentrale | erhält von Zentrale |
|---|---|---|
| Fundament | Sheet/Popover/Tabs/Dialog, `ROUTEN`, `useScanner` in Shell, Suspense-Muster, Session-Store `endeSitzungenVon` | `kuerzel.js`, `motion.js`, Toast-Undo, Speicherleiste, Konfliktdialog, Druckvorschau |
| CRM | `kennzahlen`, `heute` (Termine, Anfragen), Kontakt-Felder `berater`, `kommunikation_bevorzugt`, `nicht_kontaktieren`; A1, A18 | Aufgaben-Knopf in Akten, Schnellanlage |
| Faktura | `freigaben` (Eingangsrechnung), Sende-Methode für Druckvorschau, Ausfuhrnachweis-Feld, Umrechnungsrichtung `kurs`; A4, A7b | Umsatz-/OP-Definition (abstimmen) |
| Shop | `freigaben` (Erstattung), Widerruf-Fristen; A4, A21, Widerruf-Änderungen | Erstattung-fällig-Chip |
| Kassa | Kassa-heute-Abgrenzung, Offline-Belege beim Sperren, Karte sperren bei Produktiv-Testmodus, `useDruck`-Schnittstelle | Bedienerwechsel-Kacheln, Druckwarteschlange, Systemband |
| Logistik / Projekte / Marketing | `freigaben` (Inventur, Tour, Planung, Social), `heute` (Restlieferung, Montage) | – |
| Service | `freigaben` (Kulanz, Methoden vorhanden), Fristen-Unterzeile | – |
| Personal | Stempel-Kachel, Abwesenheit „abwesend“ + Vertretung, Abwesenheitsantrag-Übergang | Freigabe-Eintrag mit Datenschutzregeln |
| Kundenkarte | `KK-`-Erkennung in Palette | – |
| Alle | Hilfe-Markdown je Seite, Kürzel in `kuerzel.js` eintragen, `freigaben()`/`heute()`/`kennzahlen()` nach Vertrag §3.5.2/§6.3 | Querschnittsbausteine |

### 14.7 QA-Checkliste (vor Übergabe abhaken)

- [ ] Jede Route: `requireSession()` zuerst, `dynamic = "force-dynamic"`, Mock-Modus läuft, Fehler als `Fehler`-Komponente.
- [ ] Kein Knopf, Menüpunkt oder Palette-Eintrag ohne Recht; gesperrte Aktionen mit sichtbarem Grund (`aria-disabled` + `aria-describedby`).
- [ ] Leerzustände aller Flächen aus Z-42 mit leerem Seed geprüft.
- [ ] Undo: Status, Zuweisung, Fällig, Rolle, Profil, Gelesen (einzeln/alle), Karten, Entsperren; `Z` nur auf jüngsten Toast mit Undo.
- [ ] Rückfrage: Token erneuern, Sperren, Deaktivieren, Austragen, Testmodus, Website-API, Standardfirma, Entzug Leitungs-/Admin-Rollen, geldwirksame Freigabe.
- [ ] Ablehnen sendet erst nach 8 s; Undo verhindert den Aufruf (Netzwerk-Log).
- [ ] Erledigte Zeile bleibt 8 s, keine Bewegung unter dem Zeiger.
- [ ] Kürzel: Unit-Test ohne Doppelbelegung grün; Einzeltasten-Schalter wirkt; Windows `Strg`, Mac `⌘`.
- [ ] Palette: Enter-Puffer (Z-37), Betragssuche (Z-68), Steuerberater-DocTypes (Z-66).
- [ ] Kennzahlen: Unit-Tests Umsatz/Zahlungseingang/OP/Kassa grün (Z-54–57); keine Kennzahl ohne Leserecht; EUR.
- [ ] Datenschutz/Arbeitsrecht: kein Person-Filter, kein Team-Chart, kein `last_active` für Leitung ohne Freigabe; Abwesenheiten ohne Art/Begründung; Krankenstand nie Freigabe.
- [ ] Sicherheit: Token nur einmal, QR mit Fragment, PIN nie in Antwort/Log/Toast; Typ-Rechte Geräte; PIN-Ziel-Regel; `aktiv` nicht im Formular.
- [ ] localStorage/sessionStorage nur mit Benutzer-Schlüssel, jeder Zugriff in try/catch, Abmelden löscht Entwürfe.
- [ ] axe 0 serious/critical hell und dunkel; Kontrast Sand-Text ≥ 4,5:1 (`accent-text`); Ziele ≥ 24 px Desktop, ≥ 44 px Touch, ≥ 48 px Kiosk.
- [ ] Reduced Motion: nur Opazität ≤ 120 ms, kein Shake, kein Kollaps.
- [ ] Reflow: 320 px ohne horizontalen Seiten-Scroll (außer Kennzahl-Streifen mit `scroll-snap`); Arbeitsplatz 820 px 3 + 2.
- [ ] Budget: Zentrale JS ≤ 180 kB gzip, CLS < 0,05, keine Zusatzbibliothek für Palette/Charts/Markdown.
- [ ] Texte: keine Superlative, keine Ausrufezeichen, keine Frappe-Begriffe, Knöpfe als Verben, keine Selbstgespräche (Z-52).
- [ ] Klickzähler-E2E für jede Zeile §1 grün.
- [ ] Offene Anfragen (§13.1), die eine Funktion blockieren, sind im UI als fehlende Funktion behandelt (nicht gezeigt), nie als Schein-Aktion.

---

## 15. Änderungsprotokoll (Fassung 04.11.2026 nach Kritik 20/21)

| Quelle | Änderung | Abschnitt |
|---|---|---|
| UX P1 | Zentrale entschlackt, „eine Zahl, ein Ort“; Kennzahlen „Termine heute“, „Offene Aufgaben“ gestrichen; Reihenfolge je Rolle; Streifen statt 6 Karten; Charts nur Leitung/GF/Admin | §0.2, §3.2, §6.1 |
| UX P2 | Primäraktion fest je Rolle; „Neu ▾“ Sekundär; Aufgabenkachel nur Inline-Zeile; Lernen nur in Palette | §3.2.4 |
| UX P3 | Kürzel-Register neu, Kollisionen aufgelöst, `.`/`p`/`Strg+L`/Kiosk-`F8`/`F9` gestrichen, `Strg+/` neu, `N` sofort | §2.4 |
| UX P4 | Schalter „Einzeltasten-Kürzel“ | §2.4, §3.15, Z-36 |
| UX P5 | Palette: Datensätze oben, Enter-Puffer 600 ms, Freitext-Aktion nie vorausgewählt | §3.3, Z-37 |
| UX P6 | Titel-Parser nur am Ende/als Wort, Chips, wiederherstellbar | §3.7, Z-38 |
| UX P7 + Fach F1/P3 | Kein Anlegen ohne Recht; ToDo als zweite Aufgabenquelle (statt Glocke-Ersatz); Kontakt-Popover statt Schein-Aktion; Spalte „gilt ab“ | §1, §3.6.1, §3.7, Z-39, Z-69 |
| UX P8 | Einstellungen: Schalter mit Wirkung als eigene Aktionen; Benutzerakte ohne Speichern-Knopf | §3.9, §3.10, Z-40 |
| UX P9 | Klickzahlen neu gezählt, Wege gekürzt (Freigabe aus Zentrale, Arbeitsplätze im Menü, PIN im Menü) | §1, Z-41 |
| UX P10 | Benutzerakte 3 Reiter, Chips ohne „PH “, Entfernen-Ziel und Tastatur | §3.10 |
| UX P11 | 13 Leerzustände ergänzt | §3.x, Z-42 |
| UX P12 + Fach K9 | Undo für alle gelesen, Karten, Profil; `Z` nur Toast mit Undo; Löschen nur Admin, „30 Tage“ gestrichen | §2.5, §3.5, §3.6, §4.1, Z-43 |
| UX P13 | Erledigte Zeile bleibt 8 s, Kollaps danach | §0.2, §2.5, Z-44 |
| UX P14 | Häkchen-Ziel am Telefon, eine Wischregel | §3.6.2, §3.5.1, Z-45 |
| UX P15 | Arbeitsplatz-Raster, Ziffer startet sofort, Kicker `accent-text`, Kiosk-Wechsel | §3.1, §8.3, Z-46 |
| UX P16 | Hilfe nur Kopfzeile, Panel 480, Kürzel-Dialog `Strg+/` | §3.12, §3.13, Z-47 |
| UX P17 | Druckvorschau 800 px mit Zoom und Seiten | §3.14, Z-48 |
| UX P18 | Navigation Dashboard · Aufgaben · Verwaltung (Hub) | §2.2 |
| UX P19 | Konfliktdialog mit Panel eigener Eingaben | §3.15 |
| UX P20 | Speicherschlüssel je Benutzer | §0.2, `benutzerSpeicher.js`, Z-50 |
| UX P21 | Kennzahlen max. 4/6, Raster je Breite | §3.2.4 |
| UX P22 | Gründe sichtbar statt nur Tooltip | §0.2, §3.1, §3.5.2 |
| UX P23 | Selbstgespräche ersetzt durch Aussagesätze | §3.7, §4.1, Z-52 |
| UX §2 (Empfehlungen) | `€`-Präfix gestrichen, Token-Chips, Einstellungen 5 Reiter, Geräte 3 Pflichtfelder + Live-Verbindung, Glocke-Reiter nach Recht, G-Hinweiszeile, Erste-Schritte als Band, Palette feste Breite, Fokus Glocke, Kanban-Tasten, Plattform-Tasten, `scroll-padding`, Glocke-ARIA, Ziele 24/44, Warn-Toast bleibt, Reduced-Motion-PIN, Bottom-Sheet, Telefon-Sperren, Icons lucide, Begrüßung zweizeilig, „Erledigen“ als Verb, Ablehnen definiert, QR-Fragment, Protokoll-Hinweis „letzte 100“ | §2–§8 |
| UX §4 | Querschnittswerte festgelegt (Undo 8 s, Bewegung, Toast-Position, Tooltip, Hochzählen) | §2.5, §13.3 |
| Fach P1/F6/R2/K3 | Testmodus-Text korrigiert, `site_rolle`, Pflichtgrund, rotes Band, Kassa sperrt Karte | §3.9.1, §8.3, A1, Z-53 |
| Fach P2/F2/F13/R1/R10 | Umsatz netto neu definiert, Zahlungseingang getrennt, OP ohne Anzahlungen, EUR-Umrechnung, Faktura-Leitung-Recht | §6.1, §6.2, A21, Z-54–56 |
| Fach §5.2 | „Kassa heute“-Definition, Bestellungen inkl. `reserviert`, Servicefristen direkt | §6.1, Z-57 |
| Fach F3 | Betragssuche je DocType mit eigenem Feld, CHF getrennt | §3.3, Z-68 |
| Fach F4/R6-Randfall | „Per E-Mail“ nur mit Fachmethode, Kunde ohne E-Mail, Zustimmung (A18) | §3.14 |
| Fach F5/P6 | geprüft: Kulanz-Methoden existieren inzwischen – eingebunden | §3.5.2, §13.1 |
| Fach P5/R6/PP7 | Vier-Augen in UI, Server-Anfrage A4 | §3.5.2, Z-58 |
| Fach F7/P9 | `aktiv` nicht im Formular, `kasse` Pflicht bei Kassa, Offline-Belege beim Sperren | §3.11, Z-61 |
| Fach F8/F9/P4 | Geräte-Recht je Typ, PIN-Zielregel, Admin am Kiosk | §3.10, §3.11, A3, Z-61/62 |
| Fach F11/P10/R4/K1 | Firma-Pflichtangaben, `sitz`, Land-Auswahl, `steuernummer` begrenzt | §3.9, A10, K1 |
| Fach F12/P7/R3 | Standardfirma ohne Undo mit Rückfrage; Firma am Beleg (Feld `firma` existiert als Data → Link) | §3.9, A7b, Z-63 |
| Fach F14/P11/R5/PP5 | Widerruf-Fristen-Chip, Widerruf ohne E-Mail als Anfrage | §6.3, §13.1 |
| Fach F15 | Benutzer ohne Postfach (`@kiosk.invalid`) | §3.10, Z-64 |
| Fach F16/P12/R7 | Mitarbeiterauswertung standardmäßig aus, `last_active` nur Admin | §3.8, §3.10, §6.2, A10, Z-60 |
| Fach R8/P12 | Abwesenheiten ohne Art/Begründung, Krankenstand nie Freigabe | §3.5.2, Z-59 |
| Fach R9 | CSV-Export erst mit Export-Protokoll | §3.6.2, §3.8, A12 |
| Fach R11 | Steuerberater-DocTypes explizit, Anmeldungen Externer für GF | §3.3, §3.8, Z-66 |
| Fach PP1 | Fristen-Chips UVA, OSS, Jahresbeleg, SEE, DEP | §6.3, Z-67 |
| Fach PP2/P8 | Datenschutzanfragen | §3.16, A8 |
| Fach PP3 | Assistent Z5 Austragen | §3.17, Z-65 |
| Fach PP4 | Vertretung bei Abwesenheit | §3.5.2 |
| Fach PP6 | Admin-Kachel Betriebsbereitschaft | §3.18 |
| Fach K2/K4/K5/K6/K8 | Nutzdaten permlevel, Rollenzahl, `faellig`-Default, `ENTW` in Palette, Servicefristen-Feld | §3.8, §3.3, §6.1, §13.1 |
| Fach §5.2 Randfälle | Storno-Bezug in Aufgaben, Kontakt nicht erwünscht/Anrufen, zweite Firma, Gerät verloren mit Offline-Belegen | §3.6.2, §4.1, §3.9, §3.11 |
| neu | Abschnitt Bauauftrag | §14 |
| entfernt | Erste-Schritte-Checkliste (Z4), Kennzahl „Montagen Woche“ für GF, Seitenleisten-Einträge Benachrichtigungen/Protokoll/Einstellungen/Benutzer/Geräte/Druck, Reiter „Benachrichtigungen“ und „Schlüsselnamen“ in Einstellungen (in Allgemein/System aufgegangen) | – |

*Ende 10 – Konzept Zentrale & Querschnitt (finale Fassung).*
