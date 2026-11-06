# 8x – Übergabe L0 · Gate G0 „Fundament v2“ (Lounge)

**Stand:** 2026-11-04 · Rolle L0 (Chef-Produktdesign/Integration) + Q3 (QA) + Q4 (A11y) · Maßstab `art-direction/lounge.md` (Nr. 51/53) · Next 16.4.1 (`page.md`: `searchParams` ist ein Promise) · Dev-Server :3100 nicht neu gestartet, kein `npm install`, kein Build, kein Commit.

**Ergebnis:** G0 **bestanden mit Auflagen** – Welle 1 (Zentrale, CRM, Projekte, Sortiment) kann starten. Entscheidung und Schreibsperren: `09-entscheidungslog.md` (E-001, E-002). Prüfbericht: `42-qa-g0.md`.

## Gebaut / geändert

| Datei | Inhalt |
|---|---|
| `backoffice/src/app/einstellungen/page.js` | Demo-Einbindung `?tab=system&baustein=<name>` (Admin + Mock, sonst normale Seite), Übersicht `?tab=system` als Kacheln, Zurück-Knopf, unsichtbare h1 für Demos ohne eigene |
| `backoffice/src/lib/backoffice/demo-register.js` | `DEMOS_MIT_H1`, `DEMO_TEXTE` |
| `backoffice/src/lib/fonts.js` | Inter (opsz) als `--font-inter` |
| `backoffice/src/app/page.js` | Zentrale im Lounge-Stil (Begrüßung „gruss“, Kacheln, Bento-Abstände, Balken mit Bezugswoche); Übergabe an B-ZEN |
| `backoffice/src/app/api/kassa/display/route.js` | Kundendisplay-Kanal eingehängt (neu) |
| `backoffice/src/lib/backoffice/labels.js` | Kern-DocTypes deutsch, DocType-Namen in Hilfetexten verworfen |
| `backoffice/src/components/Backoffice/Formular/Zeitleiste.js` | Verlauf ohne Systemfelder; Zeitangabe hydrationssicher |
| `backoffice/src/components/Backoffice/DataTable/DataTable.js` | relative Zeit hydrationssicher |
| `backoffice/src/components/Backoffice/Charts/Zahl.js` | Wertänderung bricht Hochzählen ab |
| `backoffice/src/components/Backoffice/Akte/Vorgangsleiste.js`, `Akte/akte.css` | Kundenreise-Fläche fokussierbar; Ergebnis-Zahl am Telefon umbrechbar |
| `backoffice/src/app/globals.css` | `.bo-ziel` Touch −4 px (keine überlappenden Trefferflächen) |
| `backoffice/src/components/Backoffice/Demo/{grundbausteine,motion,akte}.js` | iPad-Raster, ARIA-Rolle, Kontrast |
| `backoffice/tests/unit/backoffice-labels.test.mjs` | Erwartungen zu den Label-Änderungen |
| `backoffice/tests/e2e/backoffice-{akte,commit,eingabe-kiosk,grundbausteine,motion,overlay,p05c,seitenmuster,shell}.spec.js` | Warten auf Demo/Hydrierung/Übergang, Touch-Dichte, eindeutige Locator |
| `Marktresearch/digital/backoffice/09-entscheidungslog.md` (neu), `42-qa-g0.md` (neu) | Gate-Entscheidung, Schreibsperren Phase 1, QA-Bericht |

## Tests

- Unit: **258/258** grün. ESLint: **0** auf allen geänderten Dateien.
- E2E desktop + iPad: Gesamtlauf 116 Tests, nach Korrekturen **114 grün**, 2 rot (nur WebKit-iPad, Motion-Demo-Liste und Dialog-Blende; Auflage A7 an Q2).
- axe: 26 Routen × hell/dunkel **0** serious/critical; iPad target-size 0.
- Screenshots: `qa-screenshots/g0-lounge` (678 Aufnahmen, 3 Befunde → behoben), Nachlauf `qa-screenshots/g0-lounge-nachlauf` (42 Aufnahmen, 0 Befunde).

## Offene Punkte

1. Auflagen A1–A7 (`09-entscheidungslog.md`): ScanTor in der Shell (P0-7), `fundament.mail` (P0-3/P0-5c), Vorlieben im Wurzel-Layout (L0), Restbefunde (Q1), Budget gegen `next start` (P0-9), Altmuster/ESLint-Versalien (Q1/P0-9), WebKit-Motion-Tests (Q2).
2. Zentrale-Fachinhalt nach Lounge-Entwurf (Heute, Wartet, Akzentkacheln, Pipeline, Projekte) – B-ZEN, Welle 1. Die Demo-Einbindung in `einstellungen/page.js` muss beim Umbau erhalten bleiben.
3. Next-Entwicklungsanzeige („N“ unten rechts) liegt im Dev über Toasts; im Build nicht vorhanden. Abschalten nur über `next.config.js` (`devIndicators`) im Wartungsfenster.

## Abweichungen vom Konzept

Keine neuen. Bestätigte Abweichungen der P0-Teams: Tabelle in `09-entscheidungslog.md` E-001.

## Fähigkeiten-Stand

Unverändert. Neu erreichbar: Kundendisplay über Gerätegrenzen (SSE `/api/kassa/display`, Mock-Verteiler im Prozess-Speicher; mehrere Instanzen brauchen Redis Pub/Sub).

## Neue Fragen

- Inhaber: Nr. 63 (Begrüßung nur mit Vorname?) in `90-inhaber-fragen.md`.
- Steuerberater: keine.

## Screenshot-Ordner

`backoffice/qa-screenshots/g0-lounge/`, `backoffice/qa-screenshots/g0-lounge-nachlauf/`
