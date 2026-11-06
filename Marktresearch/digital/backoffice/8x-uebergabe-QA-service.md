# Übergabe QA-service – Q3 Screenshots + Q4 Barrierefreiheit, Bereich Service

**Stand:** 04.11.2026 · Team QA-service · Auftrag: MASTER § 5.5 für „service“ (Abnahme-Kandidat nach `8x-uebergabe-B-SER.md`), Maßstab Lounge (`art-direction/lounge.md`, `qa-screenshots/entwurf-lounge/`). Kein Bereichscode geändert.

## 1. Gebaut / erzeugt

| Ergebnis | Ort |
|---|---|
| axe-/Tastatur-Spec Service (Teil A axe 28 Admin-Routen + Service-Mitarbeiter + Techniker iPhone, je hell/dunkel; Teil B 4 offene Sheets/Dialoge; Teil C 16 Tastatur-/Klickzahl-Tests; Teil D Reflow 320, Fokus nicht verdeckt 2.4.11, Zielgröße 2.5.8 mit Abstandsausnahme, reduzierte Bewegung) | `backoffice/tests/e2e/a11y-service.spec.js` |
| Screenshot-Lauf 28 Routen × Desktop/iPad/iPhone × hell/dunkel = 168 Aufnahmen, `bericht.md`/`bericht.json` | `backoffice/qa-screenshots/q3-service-2026-11-04/` (+ Protokoll `q3-service-2026-11-04-shoot.log`) |
| Vergleich neben Lounge (5 Paare, Desktop) | `backoffice/qa-screenshots/q3-service-2026-11-04/vergleich-lounge/` |
| Befundtabelle (28 Befunde QS-01…QS-28), Klickzahlen, Lounge-Stimmigkeit | `Marktresearch/digital/backoffice/4x-qa-service.md` |

Hilfsskripte (Bildausschnitt, Nebeneinander-Montage) nur im Scratchpad `…/scratchpad/QA-service/`.

## 2. Tests

- **Unit gesamt** (`node --test "tests/unit/**/*.test.mjs"`): 506 Tests, **502 grün, 4 rot** – alle vier fremd (Register/Shell: Marketing-Routen für fremde DocTypes, Navigation „Übersicht + sechs DocTypes“, Hilfe-Kürzel-Reihenfolge, aktiver Unterbereich `/d/ph-aufgabe`). Service-Unit 16/16 grün.
- **ESLint** auf `tests/e2e/a11y-service.spec.js`: 0 Fehler, 0 Warnungen.
- **E2E** `a11y-service.spec.js --project=desktop`: siehe § 7 (Endstand). Bekannte Lücken als `test.fail` mit Befundnummer (QS-01, 02, 03, 04, 05, 06, 07, 10).
- **Screenshots:** 168 Aufnahmen, 1 technischer Befund (Konsolenfehler `/service/berichte/fristen` iPad hell, QS-23).

## 3. Ergebnis

- Desktop hell/dunkel: **wie aus einem Guss mit Lounge** (Fläche, rahmenlose Kacheln, Material-Leiste, Pillen-Reiter, eine Tinte-Hauptaktion, zwei Akzentkacheln, Status Punkt + Wort, Bilder in Zeilen).
- **Nicht abnahmereif (G1-Service):** hoch 4 (QS-02, QS-03 axe critical; QS-08 „Jetzt dran“ am Telefon/iPad unlesbar; QS-09 Akzentzahl 13 als „1…“), mittel 9. Nächster Schritt: Polish-Fenster Q1 für Service mit B-SER, danach Nachlauf nur betroffener Routen (`--nur "^/service$|einsaetze|faelle$"`) und Spec erneut.

## 4. Offene Punkte

1. Screenreader-Durchlauf (Q-I9) und Zoom 200 % nicht durchgeführt – braucht eine Person mit NVDA/VoiceOver.
2. Fähigkeiten „alle an“ nicht abnehmbar (alle 11 Service-Fähigkeiten `erwartet:false`).
3. WebKit-iPad-Projekt nicht gelaufen (nur Chromium-Viewports).
4. Dev-Server während des Laufs stark ausgelastet (parallele Teams); Leistungswerte Q-37 daher nicht gemessen.
5. Testdaten-Verschmutzung durch `service-bereich.spec.js` (jeder Lauf legt „Laura Muster – Naht offen“ an, QS-24) – Hinweis an B-SER.
6. Konzept-Korrektur Q-1 (POL-01 → POL-03, QS-26) an den Konzept-Verantwortlichen.

## 5. Abweichungen vom Konzept

Keine eigenen. In der Spec ist der Wareneingang-Weg mit 5 Klicks als Grenze gesetzt (Konzept-Ziel 4 setzt einen Zeilenknopf voraus, den es nicht gibt; Konzept nennt selbst „(5)“) – Befund QS-11.

## 6. Neue Fragen

- Inhaber: 119–120 in `90-inhaber-fragen.md` (Klicktest/Screenreader-Termin, Pflegetermine an Sonn-/Feiertagen).
- Steuerberater/Kanzlei: 60 in `91-steuerberater-fragen.md` (Barrierefreiheitspflicht für das interne Backoffice).

## 7. E2E-Endstand

(siehe unten, nach Abschluss des letzten Laufs eingetragen)
