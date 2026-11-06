# 8x – Übergabe Team P0-2 (Fundament v2: Lounge-Design ins Fundament)

**Stand:** 2026-11-04 · Auftrag: Lounge-Design (Inhaber-Entscheidungen Nr. 51/53, `art-direction/lounge.md`) in Token und Grundbausteine übertragen. Diese Datei ersetzt die erste P0-2-Übergabe vom selben Tag (sie war nicht in Git und ist überschrieben). Deren Kern bleibt gültig und steckt in den Dateien: Token-Rollen und Status-Tints nach 03 § 1.7, Dichte-Variablen, `Knopf` (`laedt`, `grund`, `kuerzel`), `StatusBadge` (Formen je Ton, `gebucht`/`storniert`), `Kennzahl` + `Zahl`, `Leer` (vier Arten), `Fehler` (Muster je Code, Countdown, Auto-Wiederholen), `Segment` + `DichteSchalter`/`DICHTE_SKRIPT`, `Charts` mit `logik.js`. Die Einzelheiten stehen im README-Abschnitt „Grundbausteine v2 im Lounge-Stil (Team P0-2)“.
Maßstab: `art-direction/lounge.md`, Entwurfscode `backoffice/src/app/entwurf/lounge/` + `src/components/Entwurf/Lounge/`, Screenshots `backoffice/qa-screenshots/entwurf-lounge/`.

## Gebaut

| Datei | Inhalt |
|---|---|
| `backoffice/src/app/globals.css` | **Alle Lounge-Token**: Kalk-Fläche mit Licht-Verläufen (`--bo-canvas-glow`), Kachel/eingelassen, Tinte, Text 2/3, Linien 8/14 %, Füllungen, Material (`bo-mat`, `-mat-strong`, `-mat-edge`), Glas, Fokus Cognac; Materialpalette (Cognac, Eiche, Salbei, Messing, See, Stein, Nuss, Travertin, Ziegel) je als Punkt/Schrift/Fläche; Status-Rollen auf Materialien abgebildet (alte Namen gültig); Avatar-Verläufe, Akzentkachel-Verläufe; Chart-Token (Tinte, 16 %-Tinte, Hervorhebung); Radien-Hierarchie 32/28/20/16/12/rund (Altnamen auf die neue Skala gelegt) + `corner-shape: superellipse(1.35)`; Schatten-Stufen `--bo-sh-btn|card|tile|lift|float|ink|focus|drag` als Laufzeit-Variablen (hell/dunkel), Theme-Schatten `--shadow-bo*` zeigen darauf (bisher in Dunkel wirkungslos, weil Tailwind sie fest einsetzt); Federn `--ease-feder`/`--ease-feder-weich` + Dauern; Schrift `-apple-system` → Inter → Instrument Sans, `tabular-nums` und Stil-Sets global; Haarlinie 0,5 px auf Retina; Dichte um `--bo-font-body`, `--bo-kachel-p(-dicht)`, `--bo-bento-gap`, `--bo-rund(-s)`, `--bo-pille-h` erweitert (kompakt/komfortabel/Kiosk). Dunkel eigens gewählt (`#121416`/`#1b1e21`), System- und Schalter-Block gleich. Baustein-Klassen `.bo-kachel` (+ `--dicht|--flach|--eingelassen|--lift`), `.bo-akzent`, `.bo-bento` (Staffel 30 ms), `.bo-knopf--*` (Druck-Feder 0,97), `.bo-rund` (+ Badge), `.bo-pfeil` (45°-Drehung beim Kachel-Hover), `.bo-pille`, `.bo-av`/`.bo-avreihe`, `.bo-seg` (Indikator federt), `.bo-schalter__*`, `.bo-material(-stark)`, `.bo-glas`, `.bo-suche`, Typo-Klassen (`bo-gruss`, `bo-titel-gross`, `bo-titel`, `bo-titel-kachel`, `bo-zahl-gross`, `bo-zahl-akzent`), Tooltip als Tinte-Pille mit Feder, Skelett 1,2 s, Dialog-Hintergrund mit Unschärfe, Hochzähl-Platzhalter für `Zahl`, Chart-Tooltip/schraffierter laufender Balken; reduzierte Bewegung und Druck (ohne Schatten/Unschärfe) abgedeckt. Seitenleiste ist über die Token hell (Material), kein dunkler Block mehr. |
| `components/Backoffice/Knopf.js` | Knopf als Pille ohne Rahmen, Druck-Feder, API unverändert. **Neu:** `RundKnopf` (40/44/48, Badge-Zahl oder Punkt, `aktiv`/`umschalter`, `flach`, Tooltip) und `PfeilKnopf` (Tinte bzw. `hell` auf Cognac, `nurOptik` für Link-Kacheln). |
| `components/Backoffice/Kachel.js` (neu) | `Kachel` (Titel 17 + Unterzeile 13, Werkzeuge, Fuß, Pfeil-Knopf bei `href`, `eingelassen`, `dicht`, `flach`, `lift`), `Bento` (12 Spalten, Telefon einspaltig, Staffel), `Akzentkachel` (Cognac/Salbei, große leichte Zahl zählt hoch). |
| `components/Backoffice/Kennzahl.js` + `Charts/Zahl.js` | Kennzahl als Kachel (13/500, Zahl 34/400 bzw. 28 schmal, Trend als weiche Pille, Pfeil-Knopf), `ton` für Akzent; `Zahl` mit `hochzaehlen` (beim Erscheinen im Sichtbereich 900 ms, Endwert bis dahin unsichtbar am Platz – kein Springen, kein Hydrationsfehler; ohne Skript, reduziert, Kiosk sofort). |
| `components/Backoffice/StatusBadge.js` | weiche Material-Pille, Höhe nach Dichte (26/28/32), `groesse="m"`; **neu** `Pille` (Material ohne Status-Bedeutung) + `MATERIALIEN`. |
| `components/Backoffice/Avatar.js` (neu) | `Avatar`, `AvatarReihe` (Überlappung 18 %, Ring, „+n“), `initialen()`, `materialFuer()` (stabil aus dem Namen). |
| `components/Backoffice/Segment.js` | iOS-Segmented-Control: Kapsel, Indikator Tinte (oder `variante="hell"`) federt auf transform + Breite, `anzahl` je Option, `breit`; Link-Gruppe/Auswahl/Tastatur/Dichte-Schalter unverändert. |
| `components/Backoffice/Schalter.js` (neu) | iOS-Schalter 51×31 (`s` 38×23), Feder, Daumen verbreitert sich beim Drücken, `role="switch"`, ganze Zeile klickbar, gesteuert/ungesteuert, `name` für Formulare. |
| `components/Backoffice/Leer.js`, `Fehler.js` | ohne Rahmen: eingelassene Fläche bzw. weiche Ziegel-/Eiche-Fläche, Symbol im runden Kreis, Titel 17/15 · 600. API unverändert. |
| `components/Backoffice/Charts/` | Lounge-Diagramme: Kachel-Rahmen (abschaltbar `kachel={false}`), Balken mit runder Kappe (bei niedrigen Balken begrenzt), `hervorheben` = Bezugszeitraum Tinte + Rest 16 %, **neu** `laufend` (schraffiert), Tooltip-Pille je Balken, Linie 2 px Tinte mit Flächenverlauf und Wertpille am Ende, dünner Donut, leerer Zustand ohne Achsenkreuz, Tabelle als ruhige Aufklappzeile. API sonst unverändert, `FARBEN` um Materialnamen ergänzt. |
| `components/Backoffice/icons.js` | 28 Icons ergänzt (u. a. Phone, Mail, CalendarPlus, Play, Share2, Gift, Nfc, Sparkles, TrendingUp/Down, House); Strichstärke wie Lounge 1,75 bis 24 px. |
| `components/Backoffice/Demo/grundbausteine.js`, `lib/backoffice/demo-register.js` (eine Zeile) | Demo im Lounge-Stil: Bento-Probe (Heute, Braucht deine Antwort, zwei Akzentkacheln, Kennzahlen, Umsatz), Token/Schatten, Dichte, Knöpfe, Status/Pillen, Avatare, Schalter, Kennzahlen, Segmente, Leer, Fehler, Charts. |
| `components/Backoffice/README.md` | Abschnitt „Grundbausteine v2 im Lounge-Stil (Team P0-2)“ neu (Regeln, Token, Bausteine, Muster), Kopf und Kurzregeln auf Lounge umgestellt. |
| `tests/e2e/backoffice-grundbausteine.spec.js` (eigene Spec von P0-2) | **außerhalb des Schreibbereichs, bewusst:** drei Token-Erwartungen auf die freigegebenen Lounge-Werte nachgezogen (`#1b1e21`, `#fbfaf8`, Cognac-Fläche) – sonst wäre die Spec durch den Auftrag selbst rot. |

## Tests

- Unit: `node --test "tests/unit/**/*.test.mjs"` → **106/106 grün** (u. a. Dunkel-Blöcke gleich, Dichte vollständig, nur definierte Token und keine Hex-Werte in den Grundbausteinen).
- ESLint: **0** auf allen eigenen Dateien (inkl. Demo, Register-Zeile, Spec).
- E2E `--project=desktop`: `backoffice-grundbausteine.spec.js` + `backoffice.spec.js` + `backoffice-motion.spec.js` → **16/16 bzw. 9/9 grün**, Demo-Tests übersprungen (Demo noch nicht in `/einstellungen` eingebunden). Ein Motion-Test war während der parallelen Q2-Arbeit einmal rot und danach ohne Änderung meinerseits grün.
- Screenshots: `node tools/qa/shoot.mjs qa-screenshots/p0-2-lounge --nur …` für `/`, `/kassa`, `/einstellungen` → 18 Aufnahmen, **0 Befunde** (kein Überlauf, keine Konsolenfehler, Fokus sichtbar). Kontraste nachgerechnet (Text 3 4,6:1 auf Fläche, alle Pillen-Texte ≥ 6,6:1, Ziegel 5,3:1, Akzentkachel-Bezeichnung 4,7:1).
- Demo ohne Route: eigene SSR-Vorschau (Scratchpad) mit dem CSS des Dev-Servers, Desktop + iPhone, hell + dunkel, 0 Überlauf; Teilbilder als `qa-screenshots/p0-2-lounge/teil-*.png`, neben die Lounge-Screenshots gelegt: Kacheln, Akzentkacheln, Rundknöpfe, Pfeil, Pillen, Segment, Balken mit Bezugsmonat und schraffiertem laufendem Monat stimmen mit `1-zentrale--desktop--*.png` / `2-anfragen--desktop--*.png` überein.

## Offene Punkte

1. **Schrift Inter fehlt im Wurzel-Layout:** `lib/fonts.js` lädt nur Bodoni + Instrument Sans. Lounge verlangt SF/Inter. `globals.css` ist vorbereitet (`var(--font-inter, "Inter")`); nötig ist in `lib/fonts.js` ein `Inter({ subsets: ["latin"], axes: ["opsz"], display: "swap", variable: "--font-inter" })` und die Variable in `FONT_VARIABLES` (Besitzer Plattform/L0, nicht P0-2). Bis dahin erscheint auf Windows Instrument Sans – sichtbarer Unterschied zu den Lounge-Screenshots.
2. **Demo-Einbindung** in `/einstellungen?tab=system&baustein=…` (Besitzer Zentrale/L0) – bis dahin sind 4 E2E-Demo-Tests übersprungen.
3. **Shell (P0-7):** Seitenleiste ist über Token hell/Material, aber noch keine schwebende Leiste 72 px mit Rundsymbolen, keine Pillen-Reiter, Kopfzeile ohne Material beim Scrollen. Bausteine dafür liegen bereit (`.bo-material`, `RundKnopf`, `Segment`, `Avatar`). `border-white/10` in der Seitenleiste ist im hellen Zustand unsichtbar und kann weg.
4. **Fremde Altmuster** (`rounded-[10px] border border-bo-line`, `text-[11px] uppercase tracking`) in Seiten/Komponenten anderer Teams (z. B. `Demo/register.js`, Zentrale-Kacheln „Meine Aufgaben“/„Letzte Änderungen“, DataTable) – laut README nicht mehr neu verwenden; Umstellung durch die Besitzer bzw. Polish-Fenster.
5. **P0-9:** die Warnungs-Ausnahme für `Charts/index.js` und `StatusBadge.js` in `eslint.config.mjs` kann auf Fehler gestellt werden (keine Hex-Werte mehr).
6. **Q2 (`bo-motion.css`):** gemeinsame Namen abgestimmt – Q2 verweist auf `--ease-feder`/`--bo-dauer-*` und überlässt `.bo-tip`, `.bo-seg__ind`, `.bo-schalter__daumen`, `.bo-bento`, `.bo-chart-*` den Bausteinen. Eine zwischenzeitliche Doppel-Definition von `.bo-tip` (machte Icon-Knöpfe unsichtbar) hat Q2 während des Laufs entfernt; bitte so lassen.
7. **Regelabweichung zur Freigabe L0:** Kennzahlen zählen jetzt beim Erscheinen hoch (Lounge § 8) statt nur bei Änderung (Q-H4); Kiosk und reduzierte Bewegung nie. Inhaber-Frage Nr. 42 (von Q2 gestellt).

## Abweichungen vom Konzept (03/MASTER → Lounge)

Radien 6/10/16 → 12/20/28/32; Karten ohne Rahmen; Statusfarben Blau/Grün/Orange/Lila → Materialtöne; Fokus Tinte/Gold → Cognac; Body 14 → 14/15/16 nach Dichte; Segment-Höhe 32/40 → 40/44 (Kapsel); Strichstärke 1,5 bei 20/24 px → 1,75; Bento-Staffel und Hochzählen beim Seitenaufbau (Lounge § 8, entgegen 04 P10/Q-H4).

## Fähigkeiten-Stand

Keine Fachaktionen gebaut; keine neuen Fähigkeiten. Alle Bausteine sind rein darstellend, Server Actions gibt es keine.

## Neue Fragen

- Inhaber: Nr. 43 (Statusfarben aus den Materialtönen); das Hochzählen fragt Nr. 42 (Q2).
- Steuerberater: keine.

## Screenshot-Ordner

`backoffice/qa-screenshots/p0-2-lounge/` (Zentrale, Kassa, Einstellungen je Desktop/iPad/iPhone hell/dunkel; `teil-*.png` = Demo-Abschnitte hell/dunkel).
