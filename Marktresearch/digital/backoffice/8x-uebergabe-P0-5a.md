# Übergabe Team P0-5a: Akte und Vorgang (Fundament v2, Lounge)

**Stand:** 04.11.2026 · Auftrag: MASTER §4 G-12 Vorgangsleiste, G-14 Akte-Gerüst + Slots, G-16 ErgebnisKarte, G-28 PersonZelle · Maßstab Gestaltung: `art-direction/lounge.md` (Inhaber Nr. 51/53) und die Entwurfs-Kundenakte.

Ein früherer Lauf hatte im Schreibbereich nichts angelegt. Alles ist neu gebaut.

## Gebaut

| Baustein | Datei | Kurz |
|---|---|---|
| G-12 `Vorgangsleiste` | `components/Backoffice/Akte/Vorgangsleiste.js` | Kundenreise wie im Entwurf: Stufen-Spalten auf eingelassener Fläche, Karten mit Person oder „+“, Status-Symbol, der aktuelle Schritt in Tinte, die aktuelle Stufe mit Kontur. SVG-Bezier mit Knoten (ResizeObserver), offene Wege gestrichelt, Linie zeichnet sich. Stufenname mit Belegen ist ein Knopf mit Popover (`aria-current="step"`). „Nächster Schritt“ mit einer Aktion oder einem Blocker-Satz. Am Telefon eine senkrechte Liste mit Knotenlinie. Dazu `kompakt` für Listen. Ein Baustein für Mappe, CRM-Vorgang, Faktura-Belegkette und Service-Phasen. |
| G-14 Gerüst | `Akte/Akte.js`, `Akte/AkteTabs.js` | `AkteGeruest` (Slots), `AkteKopf` (Zurück, Pfad, rechts), `AkteHero` (Bild 440, Glas-Chips, Glas-Aktionen, 2 × 2 Glas-Kacheln, ohne Bild Steinfläche), `Band` (genau eines über `waehleBand`), `AkteTabs` (iOS-Segment, ≤ 6, `?tab=`, `Alt+1…6`), `RechteSpalte` (ab 1280 px sticky, darunter Reiter „Details“ = `?tab=seite`) |
| G-14 Bezüge | `lib/backoffice/bezuege.js`, `Akte/Bezuege.js` | Registry aus den DocType-JSONs (805 Einträge, Link, Custom Field, Dynamic Link, `links`-Gruppen). Drei Gruppen (Gehört zu, Vorher, Folgt daraus), Zähler für höchstens 6 Arten (Q-L3), „+ anlegen“ nur mit Recht, „nicht verknüpft“ (Q-A11), ohne Leserecht ausgeblendet. |
| G-14 Slots | `lib/backoffice/akte/slots.js`, `akte/slots/index.js`, `Akte/Slots.js`, `Akte/SlotListe.js` | **Slot-API v1 eingefroren** (Doku im Dateikopf und im README). Je Akte 6 feste Reiter. Ein Slot, der fehlschlägt oder das Zeitlimit von 4 s überschreitet, zeigt nur seinen eigenen Fehlerblock. Recht falsch oder Fehler im Recht: der Slot ist unsichtbar. Die Sitzung geht nie an die Komponente. Das Register ist leer, bis die Bereiche liefern. |
| G-16 `ErgebnisKarte` | `components/Backoffice/Ergebnis/ErgebnisKarte.js`, `lib/backoffice/akte/ergebnis.js` | Häkchen zeichnet sich, Zahl zuerst (Rückgeld/Betrag), erzeugte Dokumente als Links, höchstens 3 Knöpfe, „Weiter“ rechts in Tinte, `role="status"` |
| G-28 `PersonZelle` | `components/Backoffice/PersonZelle.js`, `lib/backoffice/akte/person.js` | Avatar 24/32 (Material aus dem Namen), Name, Rolle. Bei einer fremden Abwesenheit steht nur „abwesend“, bei der eigenen Art und Ende. Ohne Person „Niemand zugewiesen“. |
| Texte | `lib/backoffice/akte/texte.js` | alle sichtbaren Texte der Bausteine |
| Demos | `Demo/akte.js`, `Demo/vorgangsleiste.js`, `Demo/ergebnis.js`, `Demo/person.js`, `Demo/akte-daten.js` + 4 Zeilen in `lib/backoffice/demo-register.js` | Die Akte-Demo baut die Entwurfs-Kundenakte vollständig aus den Fundament-Bausteinen nach. |
| Doku | `components/Backoffice/README.md` Abschnitt „Akte und Vorgang im Lounge-Stil (Team P0-5a …)“ | API-Tabelle, Slot-Beispiel, Bezüge |

Bestehende Seiten und Aufrufer bleiben unberührt: Kein Fundament-Baustein hat seine API geändert, und bisher nutzt niemand die neuen Bausteine.

## Tests

- Unit: `node --test "tests/unit/**/*.test.mjs"` ergibt **235/235 grün**, davon 25 neu in `tests/unit/backoffice-akte.test.mjs`. Sie decken Zustände, Fortschritt, Linien-Geometrie, Slot-Prüfung, Recht und Zeitlimit, Band-Wahl, Reiter-URL, die Bezüge gegen den echten Backend-Import, die PersonZelle-Abwesenheit, die Knopf-Grenze der ErgebnisKarte, die Texte und die CSS-Token ab.
- ESLint: **0** auf allen eigenen Dateien.
- E2E: `tests/e2e/backoffice-akte.spec.js` mit 4 Tests, Ergebnis `--project=desktop`: **4 übersprungen**. Der Grund: Die Demos sind in `/einstellungen` nicht eingebunden (Besitzer Zentrale/L0, wie bei P0-2/-4/-7). Login und Server :3100 liefen beim Lauf.
- Ersatzprüfung ohne Next-Route: eigene Vorschau im Scratchpad `P0-5a/` (`bau.mjs` bündelt mit Nexts SWC, kompiliert Tailwind, `foto.mjs`). Ergebnis: **57 Prüfungen ok, 0 Befunde**. Geprüft wurden waagrechter Überlauf und Konsolenfehler je Aufnahme, 6 Linien und genau eine aktuelle Stufe, die rechte Spalte ab bzw. unter 1280 px, `?reiter=seite`, der Reiter in der URL mit erhaltenen Parametern und das Popover mit den Belegen einer Stufe.

## Sichtprüfung neben Lounge

Die Akte (Desktop hell und dunkel) liegt neben `entwurf-lounge/3-kundenakte--desktop--*`: Hero, Glasplatte, Pillen-Reiter mit Stufen-Pille, Kundenreise mit Knoten, Verlauf/Positionen, Beträge und Bezüge sehen wie aus einem Guss aus. Nach der Sichtung korrigiert:

- Die 7. Reise-Spalte war abgeschnitten (max-content); jetzt gibt es eine feste Mindestbreite je Spalte und waagrechtes Blättern erst bei Platzmangel.
- In den Bezügen stand die Anzahl doppelt (Chip und Text).
- Am iPhone lagen die Glas-Aktionen über dem Titel, und die Reiter waren abgeschnitten. Jetzt stehen sie im Fluss bzw. lassen sich waagrecht blättern.
- Der aktuelle Schritt in der Telefon-Liste war unsichtbar (helle Schrift auf heller Fläche).
- Abgeleitete Karten tragen ein Belegsymbol statt „+“.
- Den irreführenden Text „Weiter mit“ in der ErgebnisKarte gibt es nicht mehr.

## Screenshot-Ordner

`backoffice/qa-screenshots/p0-5a-akte/`, 21 Aufnahmen:

- akte: Desktop, iPad und iPhone, jeweils hell und dunkel
- akte-seite: iPad
- vorgangsleiste: Desktop und iPhone, dazu das Popover
- ergebnis und person: Desktop und iPhone

## Offene Punkte

1. **Demo-Einbindung** in `/einstellungen?tab=system&baustein=…` (Zentrale/L0). Danach die E2E-Spec ohne Überspringen laufen lassen und `tools/qa/shoot.mjs` (Routen kommen automatisch aus dem Demo-Register).
2. **Turbopack-Kompilierung** ist ungeprüft, weil keine Route die Bausteine lädt. `akte.css` wird wie `shell.css`/`overlay.css` als globales CSS aus Komponenten importiert.
3. **Slots der Bereiche** (Welle 2): Faktura, Projekte, Service, Kundenkarte, Marketing und Shop legen `akte/slots/<bereich>.js` an. CRM und Projekte binden `<AkteSlots>` in ihre Reiter ein.
4. **Hero-Bild** der Mappe: Die Quelle (Rendering oder Titelfoto) ist offen, siehe Inhaber-Frage 54. Die Kundenakte einer Person nutzt AkteKopf mit Titel und kein Hero.
5. **Kundenkarten-Stufe im Kopf:** In der Demo ist sie eine einfache `Pille`. Der echte Stufen-Chip mit Bodoni-Monogramm gehört Kundenkarte (`StufenKennzeichen`) und kommt über `AkteKopf rechts`.
6. **`LeitungBitten`, `Speicherleiste`, `Unternav`** gehören nicht zu P0-5a (P0-5b/c).

## Abweichungen vom Konzept (Lounge hat Vorrang, Nr. 51/53)

- G-12 „Punkte erledigt Tinte / aktuell Ring Sand“ wird zur **Lounge-Kundenreise** (Karten in Spalten, aktueller Schritt als Tinte-Karte, Stufenkontur). Das Popover der Objekte sitzt am Stufennamen statt an einem Punkt. Die Kurzform bleibt bei Punkten von 6 px, die aktuelle Stufe ist dort eine Cognac-Pille.
- Linie und Bewegung: Die Linie zeichnet sich in 400 ms, die Knoten federn (Lounge §8). Die Spalten erscheinen gestaffelt (`bo-staffel`). Bei reduzierter Bewegung gibt es nichts davon.
- Q-B6 „darunter als Tab“: Unter 1280 px gibt es neben den Reitern einen Knopf „Details“ (`?tab=seite`), der die rechte Spalte an die Stelle des Inhalts setzt. Die Unternavigation hat damit nicht 7 Reiter.
- AkteKopf: Ohne Hero bleibt das Konzept mit Titel, Status, Betrag rechts, Primärknopf und ⋯. Mit Hero steht der Titel im Bild (Entwurf).
- Demo-Register: Statt einer Zeile je Team hat P0-5a 4 Zeilen, eine je Baustein, so wie es der Auftrag verlangt.

## Fähigkeiten-Stand

Es gibt keine Server Actions und keine Fachaktionen; alles ist darstellend oder lesend. `ladeBezuege` nutzt nur `client.count` (Mock und Frappe gleich) und wirft nie. „+ anlegen“ erscheint nur mit `create`-Recht auf den Ziel-DocType. Ohne Leserecht ist das Folgedokument ausgeblendet.

## Neue Fragen

- Inhaber: Nr. 53 (7 Stufen statt 9 Phasen in der Kundenreise), Nr. 54 (Quelle des Hero-Bilds).
- Steuerberater: keine.
