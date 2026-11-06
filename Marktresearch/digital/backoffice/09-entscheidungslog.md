# 09 – Entscheidungslog L0 (Gates, Schreibsperren, Freigaben)

**Geführt von:** L0 (Chef-Produktdesign / Integration) · MASTER § 5.2, § 5.3 Nr. 1
**Maßstab Gestaltung:** `art-direction/lounge.md` (Inhaber-Entscheidungen Nr. 51/53). Wo 03-design-system.md oder MASTER § 2.G abweichen, gilt Lounge.
Einträge sind fortlaufend nummeriert (E-…). Neue Einträge unten anhängen, alte nie umschreiben – Korrekturen als neuer Eintrag.

---

## E-001 · 2026-11-04 · Gate G0 „Fundament v2“ – Ergebnis

**Entscheidung: G0 bestanden mit Auflagen.** Phase 1 (Welle 1: Zentrale, CRM, Projekte, Sortiment) darf starten. Die Auflagen (A1–A6 unten) laufen als Nachlauf-Pakete der P0-Teams parallel und blockieren keinen Bereich.

Grundlage: Prüfbericht `42-qa-g0.md` (Unit, E2E desktop + iPad, axe, Screenshot-Lauf `qa-screenshots/g0-lounge`, Sichtvergleich gegen `qa-screenshots/entwurf-lounge`).

Sichtvergleich (Kern der Abnahme): Zentrale, Liste (Anfragen), Formular (Anfrage) und Kiosk (Kassa-Statuszeile) sehen neben den freigegebenen Lounge-Bildern aus wie aus einem Guss – schwebende Material-Leiste, Pillen-Reiter, Kacheln ohne Rahmen auf Kalk, große leichte Begrüßung, Tinte-Primärknopf, weiche Status-Pillen, Tabellen in Kacheln mit Avatar je Zeile, Kassa-Statuszeile als Material-Kapsel. Hell und dunkel. Keine dunkle Seitenleiste, keine umrandeten Kästen-Raster, keine Versalien-Etiketten mehr auf den geprüften Seiten.

### Während G0 von L0 selbst behoben (Fundament, keine Bereichsordner)

| # | Datei | Änderung | Grund |
|---|---|---|---|
| 1 | `src/app/einstellungen/page.js`, `src/lib/backoffice/demo-register.js` | Demo-Einbindung `/einstellungen?tab=system&baustein=<name>` (nur Admin, nur Mock) + Übersicht „Bausteine“ (`?tab=system`) als Kacheln; unsichtbare h1 für Demos ohne eigene Überschrift | offener Punkt aller P0-Übergaben; ohne Einbindung waren 13 Demos unsichtbar und ihre E2E-Tests übersprungen |
| 2 | `src/lib/fonts.js` | Inter (opsz) als `--font-inter` im Wurzel-Layout | Lounge § 5; vorher fiel Windows auf Instrument Sans zurück (sichtbarer Unterschied zu den Lounge-Bildern) |
| 3 | `src/app/page.js` (Zentrale) | Begrüßung `variante="gruss"` (56/300, zweizeilig), Kacheln statt `rounded-[10px] border`, Bento-Abstände 24, Balken mit Bezugswoche in Tinte + laufende Woche schraffiert, Aufgaben/Änderungen als Kachel mit Rundknopf | Referenzseite muss Lounge zeigen; die Zentrale-Fachseite baut B-ZEN in Welle 1 neu, diese Fassung ist der Ausgangspunkt |
| 4 | `src/lib/backoffice/labels.js` (+ Unit-Test) | `doctypeLabel` übersetzt Frappe-Kern-DocTypes (User → Benutzer, DocType → Dokumentart …); `hilfetext` verwirft Texte mit DocType-Namen („PH Termin, PH Projekt …“) | im Formular stand „DocType suchen …“, „User suchen …“ und ein Entwicklerhinweis |
| 5 | `src/components/Backoffice/Formular/Zeitleiste.js` | Verlauf ohne interne Felder (`name`, `workflow_state`, Systemfelder), leere Werte als „–“, Erstanlage als „Angelegt“ statt Feldliste | Verlauf zeigte „workflow state: „PH Neu““, „name: …“ |
| 6 | `src/components/Backoffice/Charts/Zahl.js` | Wertänderung bricht ein laufendes/wartendes Hochzählen ab | echter Fehler: Klick während des Erscheinens ließ den alten Endwert stehen (E2E rot, sobald die Demo lief) |
| 7 | `src/app/api/kassa/display/route.js` | Kundendisplay-Kanal eingehängt (Re-Export aus `lib/backoffice/kanal/route.js`) | offener Punkt P0-6 Nr. 1; ohne Route nur Kopplung im selben Gerät |
| 7a | `src/app/globals.css` (`.bo-ziel`), `Demo/grundbausteine.js`, `Demo/motion.js`, `Demo/akte.js`, `Akte/Vorgangsleiste.js`, `Akte/akte.css`, `DataTable/DataTable.js` | Touch-Trefferfläche −4 px statt −6 px (Nachbarn überlappten, axe target-size); Lounge-Bento der Demo am iPad hoch zweispaltig statt gequetschter Desktop-Spalten; drei axe-Befunde (Liste ohne Einträge, Kontrast durch `opacity-80`, scrollbare Kundenreise ohne Fokus); Ergebnis-Zahl am Telefon umbrechbar; relative Zeit („vor 15 Min.“) ohne Hydrationsfehler an Minutengrenzen | Screenshot-Lauf, axe, E2E iPad |
| 8 | `tests/e2e/backoffice-{akte,eingabe-kiosk,grundbausteine,overlay,p05c,motion,seitenmuster,commit,shell}.spec.js` | Demo-Erkennung wartet wirklich (`waitFor` statt `isVisible({timeout})`, das nicht wartet); Hydrierung/Animation abwarten; Dev-Anzeige von Next über dem Toast ausblenden; eindeutiger Schließknopf im Sheet-Test | Tests liefen zum ersten Mal gegen die eingebundenen Demos |

### Bestätigte Abweichungen (Freigabe L0)

| Team | Abweichung | Entscheidung |
|---|---|---|
| P0-2 / Q2 | Kennzahlen zählen beim Erscheinen hoch (Lounge § 8) statt nur bei Änderung (Q-H4); nie im Kiosk, nie bei reduzierter Bewegung | **freigegeben** (Lounge hat Vorrang); Inhaber-Frage 42 bleibt zur Bestätigung offen |
| P0-2 / Q2 | Reduzierte Bewegung: Bausteine 1 ms (Lounge § 8), Blenden ≤ 120 ms (Q-H6) | **freigegeben** – beides verträglich, gemeinsame Linie: Transform/Feder aus, Blenden ≤ 120 ms erlaubt |
| P0-5a | Vorgangsleiste als Lounge-Kundenreise (Karten in Stufen-Spalten) statt Punkte-Leiste; „Details“ als Knopf statt 7. Reiter | **freigegeben** |
| P0-9 | `reducedMotion`, `ipad-quer`, `ipad-hoch`, `kundendisplay` nur über Tags; `next.config.js` unverändert (Änderung beendet den Dev-Server) | **freigegeben**; Standalone-Ausgabe im Wartungsfenster (Inhaber-Frage 23) |
| P0-1 | `auth/rechte.js` liest Rollen aus dem Register; Slug `posteingang`, Anzeige „E-Mails“ | **freigegeben** |
| alle P0 | eigene Unit-/E2E-Dateien außerhalb des Schreibbereichs (neue Dateien, nichts Fremdes geändert) | **freigegeben** |

### Auflagen (Nachlauf-Pakete, blockieren Phase 1 nicht)

| # | Auflage | Besitzer | Frist |
|---|---|---|---|
| A1 | `<ScanTor />` (Modus backoffice) in `Shell` einhängen, damit Scans außerhalb von Feldern die Palette öffnen; E2E dazu | P0-7 | vor Welle 2 (Kassa/Logistik) |
| A2 | `"fundament.mail": mailSendenCommit` im Commit-Register (`commit/aktionen/fundament.js`) – Exchange-Weg für „Kunden informieren“; vorher Kreisimport prüfen | P0-3 mit P0-5c | vor Welle 1-Abnahme CRM |
| A3 | Wurzel-Layout: `vorliebenSkript`/`vorliebenHtmlAttribute` (P0-8) in `<html>`/`<head>`, damit auch Login/Kiosk die Benutzer-Vorliebe hell/dunkel ohne Flackern zeigen | L0 im Wartungsfenster (macht alle Seiten dynamisch – vorher Budget messen) | vor G2 |
| A4 | Restbefunde aus `42-qa-g0.md` Abschnitt „Befunde“ (Schwere mittel/klein) | je Zeile genannter Besitzer | nächstes Polish-Fenster Q1 |
| A5 | Budgets gegen `next start` verbindlich messen (`tools/qa/budget.mjs --streng`) – im Dev nur Vergleichswerte | P0-9 | mit Inhaber-Frage 23 (Build-Fenster) |
| A7 | Zwei Motion-Tests nur im WebKit-iPad-Projekt rot (Listen-Einblendung bleibt im Testlauf bei Deckkraft 0, Dialog-Blende misst 0 ms, Letzteres wechselhaft); von Hand im selben WebKit-Profil läuft die Einblendung in ≈ 440 ms durch. Ursache klären (Bildtakt/`@starting-style` in headless WebKit), Spec oder CSS anpassen | Q2 | vor Welle 2 (Kassa/Packtisch laufen auf dem iPad) |
| A6 | Alte Altmuster (`rounded-[10px] border border-bo-line`, `uppercase`) außerhalb der geprüften Kernseiten; ESLint-Regel `keine-versalien` auf Fehler stellen, sobald 0 Treffer | Q1 + P0-9 | vor G3 |

---

## E-002 · 2026-11-04 · Schreibsperren Phase 1 (Welle 1, ab sofort)

Regel (MASTER § 5.3): Jede Datei hat genau einen Besitzer. Fundament-Dateien sind ab G0 **gesperrt** für Bereichsagenten; Wünsche gehen an L0 (Nachlauf-Paket an das P0-Team), kein Ersatzbau im eigenen Ordner.

### Bereiche (Welle 1 aktiv, Welle 2/3 reserviert)

| Bereich | Agent | Schreibbereich (zusätzlich zum gemeinsamen Muster) | Status |
|---|---|---|---|
| Zentrale | B-ZEN | `src/app/{page.js,aufgaben/,verwaltung/,benutzer/,geraete/,geraet/,einstellungen/,protokoll/,benachrichtigungen/,suche/,druck/page.js,arbeitsplatz/,wechsel/,login/,kein-zugriff/}` | **aktiv** · Übernahme von L0: `page.js` (Lounge-Fassung G0), `einstellungen/page.js` (Demo-Einbindung muss erhalten bleiben) |
| CRM | B-CRM | `src/app/{kunden/,datenschutz/}` | **aktiv** |
| Projekte | B-PRJ | `src/app/(kiosk)/montage/` | **aktiv** |
| Sortiment | B-SOR | – | **aktiv** |
| Faktura, Logistik, Shop, Kassa | B-FAK, B-LOG, B-SHO, B-KAS | laut MASTER § 5.2 | reserviert (Start, sobald Slot-API G-14 von CRM/Projekte genutzt wird) |
| Service, Kundenkarte, Marketing, Personal | B-SER, B-KKA, B-MAR, B-PER | laut MASTER § 5.2 | reserviert (Welle 3); Kundenkarte-Lookup-Stub darf in Welle 2 vorgezogen werden |
| Ablage, E-Mails (posteingang) | B-ABL, B-MAI | `src/app/{ablage,posteingang}/`, `lib/backoffice/{ablage,posteingang}/` | reserviert (mit CRM abstimmen, Mail-Zuordnungsregeln Nr. 52) |

Gemeinsames Muster je Bereich `<b>`: `src/app/<b>/`, `src/components/Backoffice/<B>/`, `src/lib/backoffice/<b>/` (Texte in `texte.js`), Teildateien `lib/backoffice/{bereiche,suche,kuerzel,freigaben,aufgaben,druck,akte/slots}/<b>.js`, `commit/aktionen/<b>.js`, `mock/seed/<b>.js`, `tests/unit/<b>-*.test.mjs`, `tests/e2e/<b>-*.spec.js`, `tools/qa/routen/<b>.mjs`.

### Fundament (gesperrt; Nachlauf nur durch den genannten Besitzer)

| Bereich der Dateien | Besitzer |
|---|---|
| `lib/backoffice/{bereiche/index.js,suche/index.js,kuerzel/index.js,faehigkeiten.js,arbeitsplaetze.js,config.js,codes.js}`, `mock/seed/index.js`, `tools/qa/routen/index.mjs` | P0-1 |
| `src/app/globals.css`, `Knopf`, `StatusBadge`, `Kennzahl`, `Leer`, `Fehler`, `Segment`, `Kachel`, `Avatar`, `Schalter`, `icons.js`, `Charts/` | P0-2 |
| `Toast`, `Ausstehend`, `lib/backoffice/commit/` (außer `aktionen/<b>.js`), `app/api/undo-commit/` | P0-3 |
| `Overlay/`, `Bestaetigen.js` | P0-4 |
| `Akte/`, `ZuTun/`, `Bericht/`, `Ergebnis/`, `Druck/`, `Informieren/`, `Seitenkopf`, `BereichStart`, `LeitungBitten`, `AnDieKassa`, `PersonZelle`, `ZweiKlickKnopf`, `Formular/`, `DataTable/`, `Kanban/`, `lib/backoffice/{bezuege.js,akte/ (außer slots/<b>.js),druck/index.js,aufgaben/index.js}` | P0-5 (a/b/c wie Übergaben) |
| `Kiosk/`, `Kalender/`, `Eingabe/`, `lib/backoffice/datum.js`, `lib/backoffice/kanal/` | P0-6 |
| `Shell/`, `Kundenmodus/`, `Erstbesuch.js`, `lib/backoffice/{freigaben/index.js,hilfe.js,benachrichtigungen.js}`, `app/api/ereignisse/`, `app/hilfe/` | P0-7 |
| `lib/backoffice/auth/` | P0-8 |
| `next.config.js`, `playwright.config.js`, `eslint.config.mjs`, `package.json`, `tools/qa/budget.mjs` | P0-9 |
| `bo-motion.css`, `motion.js`, `tests/e2e/backoffice-motion.spec.js` | Q2 |
| `tools/qa/` (außer `routen/<b>.mjs`), `qa-screenshots/` | Q3 |
| `src/app/layout.js`, `src/lib/fonts.js`, `src/app/api/**` (außer Bereichs-APIs mit Freigabe), `lib/backoffice/demo-register.js` (je Team eine Zeile), `src/app/entwurf/**` (Referenz, unverändert lassen) | L0 |

### Polish-/A11y-/Motion-Fenster

Keine Fenster offen. Q1/Q4/Q2 arbeiten in Bereichsdateien nur nach Eintrag hier (Bereich, Zeitraum, Agent); der Bereichsagent pausiert so lange.

| Fenster | Bereich | Agent | Von | Bis |
|---|---|---|---|---|
| – | – | – | – | – |
