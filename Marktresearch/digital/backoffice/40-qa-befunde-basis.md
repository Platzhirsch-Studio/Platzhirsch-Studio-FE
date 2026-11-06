# QA-Befunde Basis – Backoffice-Fundament

Stand 2026-11-04 · Quelle: `backoffice/tools/qa/shoot.mjs` (540 Aufnahmen: 90 Routen × 3 Viewports × hell/dunkel) und eigene Sichtung der Screenshots. Das lokale Bildmodell (qwen2.5vl:7b) gab nur Noten 7–8 und übersah die meisten echten Fehler; diese Liste beruht auf manueller Sichtung. Bilder: `backoffice/qa-screenshots/basis-2026-11-04/<slug>--<viewport>--<schema>.png`.

Technisch sauber: kein horizontaler Seitenüberlauf, keine 4xx/5xx, Fokus-Ring sichtbar in 15 Tab-Schritten.

## Pflicht vor Freigabe (Polish-Team)

| # | Befund | Ort | Hinweis zur Ursache |
|---|---|---|---|
| 1 | Hydration-Fehler, rote Plakette „1 Issue“ | alle Kiosk-Seiten (/kassa, /packtisch, /montage, /technik) | `useUhr()` in `src/components/Backoffice/Kiosk/hooks.js` rendert die Uhrzeit schon auf dem Server |
| 2 | Diagramm-Achsen und Wertbeschriftungen gestaucht/abgeschnitten | Dashboard `/` | SVG-Text, viewBox-Skalierung oder `textLength` |
| 3 | Feste Speicherleiste verdeckt das letzte Feld | Formulare, `/einstellungen` | Platzhalter/Abstand unten fehlt |
| 4 | Speicherleiste ragt am Desktop in die Seitenleiste | Formular, Desktop | Leiste muss an der Inhaltsspalte beginnen |
| 5 | Dashboard-Karten am iPhone zu breit (bis 541 px bei 390 px) | `/`, iPhone | fehlendes `min-w-0`, feste `w-20 shrink-0` |
| 6 | Einstellungen am iPhone zu breit (Select, Hinweis, Kindtabelle) | `/einstellungen`, iPhone | |
| 7 | Kindtabelle im Formular am iPhone zu breit | Anfrage-Formular „Produkte (Merkliste)“ | `overflow-x:auto` wie in Listen |
| 8 | Datensatznummern brechen 3–4-zeilig um | Listen iPhone/iPad, Produktliste Desktop | `whitespace-nowrap`; am Telefon Karten statt Tabelle |
| 9 | Kanban schneidet letzte Spalte ohne Scroll-Hinweis ab | `?ansicht=kanban` | Randverlauf oder Pfeil |
| 10 | Testmodus-Band überdeckt Menüknopf | alle Shell-Seiten, iPhone | Band und Kopfzeile neu anordnen |
| 11 | Kiosk-Kopfzeile am iPhone zu breit (Uhr bei x = 400) | /technik, /montage | Kurzform mit Symbolen |
| 12 | Kiosk-Seiten sind Platzhalter mit Entwicklertexten | alle Kiosk-Seiten, Bereichs-Startseiten | Fachbereiche bauen Inhalt; bis dahin keine internen Texte zeigen |
| 13 | Interne Bezeichner und abgeschnittene Beschreibungen sichtbar; Umschreibungen statt Umlaute (Beratungsgespraech, Verfuegbarkeit, Geprueft) | Listen, Formulare, Startseiten | Metadaten-Beschreibungen nicht ungefiltert anzeigen; Labels statt technischer Namen, Status-Labels mit Umlauten |
| 14 | Benutzer-Seite schwer: je Zeile volles Select + blasser Knopf, ~2500 px | `/benutzer` | Bearbeitung per Zeilenmenü/Dialog, Suche, Filter |
| 15 | Seitenkopf uneinheitlich (Aktionen mal links, mal rechts); Datumsfelder mit Browser-Platzhalter „dd.mm.yyyy“ | Listen, Formulare | ein Seitenkopf-Muster; eigenes deutsches Datumsfeld |

Kleinere Punkte: „Speichern“ und „Anmelden“ wirken im Ausgangszustand deaktiviert; „Arbeitsplatz wählen“ hat am Desktop ~40 % Leerraum oben; Bedienerwechsel-Liste ohne Suche oder Standortfilter.

## Werkzeug-Hinweise

- Bildmodell nur als Zusatz verwenden, nicht als Abnahme. Aufnahme-Bericht (`bericht.md`) ist verlässlich.
- Git Bash: vor `--nur "^/d/..."` `MSYS_NO_PATHCONV=1` setzen.
- Laufzeit Aufnahme ca. 19 min komplett; Bewertung ca. 45 s je Bild (16 Kernseiten Standard).
