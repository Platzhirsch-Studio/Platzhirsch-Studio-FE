# Wachstumsrat – Gremium Küchenplanung (Kürzel: kueche)

Rollen: Küchenplaner, Tischlermeister, Gerätefachberater
Geprüft am 28.10.2026: `/de/labs/kuechenplaner` und `src/lib/kuechenplaner/*` (norms.js, checks.js, room.js, layout.js, bom.js) sowie `src/components/Labs/Kuechenplaner/catalog.js`, `geometry.js` und `planState.js`. Wir haben nur gelesen und keinen Code geändert. Ein Screenshot liegt unter `qa-screenshots/wachstumsrat/kueche/`.

Wichtig vorab:
- **DIN 18022 ist zurückgezogen und wurde nicht ersetzt.** Die Nachfolgerin DIN 68935 regelt nur Koordinationsmaße. In der Praxis plant man weiter mit den alten Werten.
- In Österreich gibt es keine eigene ÖNORM mit Küchen-Abständen, die man so übernehmen könnte. Der Konsument-Ratgeber nennt „ÖNORM 90 cm“ und „genormt 120 cm“ vor der Küchenzeile.
- Unser Regelkatalog stützt sich deshalb auf vier Grundlagen:
  - Herstellerangaben (BSH/Neff, Liebherr, Cosentino)
  - die NKBA Kitchen Planning Guidelines (USA, international als Planerstandard genutzt)
  - DIN 18040-2 und DIN 18015-2 bzw. RAL-RG 678
  - Praxiswerte, die als **Planungsannahme** gekennzeichnet sind
- Die Normtexte selbst sind kostenpflichtig und wurden nicht eingesehen. Zahlen aus Sekundärquellen sind gekennzeichnet.

---

## 1. Urteil zum Ist-Stand

| Blickwinkel | Note | Kurzbegründung |
|---|---|---|
| Als Endkunden-Konfigurator (Inspiration, Lead) | **8/10** | Das ist für einen Händler-Planer ungewöhnlich gut: Kollisionsprüfung mit Trennachsen und Öffnungsraum der Fronten, Türschlag, Fenster, Heizkörper, Dachschräge, Arbeitsdreieck, Arbeitshöhe nach Körpergröße, Gangbreiten, Geschirrspüler neben der Spüle, EU- und CH-Raster. Gute Disziplin: Ein Maß steht nur mit Quelle im Code, sonst „Maß fehlt“. |
| Als Profi-Werkzeug (Planung, die man bestellen kann) | **5/10** | Es fehlen Gerätedaten (Nischenhöhe des Geschirrspülers, Schweizer SMS-Höhen), Landeflächen, Regeln für Sitzplätze, Plattenformate und Fugen beim Stein, Kamin/Unterdruck, Elektro-Ausstattung und Installationsplan. Mehrere Regeln haben `source: null`, obwohl es Quellen gibt. |

### Konkrete fachliche Befunde im Code (nach Schwere sortiert)

1. **P1: Die Geschirrspüler-Nische passt mit den Standardwerten zu keinem gängigen Gerät.**
   - `DEFAULT_ERGO` setzt Sockel 15 cm und Korpus 78 cm. Die Nische vom Boden bis zur Plattenunterkante ist damit **93 cm** hoch.
   - Standard-Geräte von Bosch brauchen laut Händlerdaten eine Nische von **81,5–87,5 cm**, XXL-Geräte **86,5–92,5 cm** (Beispiel SBV4ECX32E).
   - 93 cm liegt also über beiden Bereichen.
   - In `bom.js` hat der Geschirrspüler keine Nischen-Zeile, und `checks.js` prüft nichts dazu.
   - Folge: Die Stückliste sieht bestellbar aus, die Planung ist es aber nicht. Der Monteur muss vor Ort den Sockel kürzen oder eine Blende einsetzen.
2. **P1: Im CH-Raster (55 cm) gelten EU-Nischenmaße.**
   - `NICHES.kuehl178` gibt 56 cm Breite an, und zwar für beide Raster. Ein 55-cm-Modul hat aber keine 56-cm-Nische.
   - Schweizer 55-cm-Geschirrspüler sind etwa **75,6 cm** hoch, die empfohlene Nische liegt bei rund **76,5 cm** (V-ZUG laut Fust).
   - Die Korpushöhen 72 und 78 mit einem Sockel ab 6 cm bilden diese Schweizer Höhe nicht ab.
   - Folge: Die CH-Variante ist ein Schweizer Raster mit deutschem Höhensystem. Für Kundschaft in St. Gallen und Rheintal ist das ein Fehler, der Vertrauen kostet.
3. **P1: Die Arbeitsplatte hat keine Längen-Grenze und keine Fugen.**
   - `geometry.js` legt jeden Abschnitt als ein Stück an. Eine Zeile mit 4,20 m erscheint in der Stückliste als *eine* Steinplatte.
   - Die Rohplatten sind kleiner:
     - Silestone: 306 × 140 cm, Jumbo 325 × 159 cm
     - Dekton: 320 × 144 cm, je nach Farbe bis 330 × 150 cm
     - Naturstein: je nach Block, Maß von Binni nötig
   - Die Fugen-Regeln fehlen ganz: Laut Dekton-Montagehinweis (Howdens) gehört keine Fuge in einen Ausschnitt und keine über eine nicht unterstützte Spannweite.
4. **P1: Der Überstand bei Insel und Theke wird nicht nach Material geprüft.**
   - `LIMITS.overhang` erlaubt bis 40 cm, auch bei Keramik mit 12 mm. Es gibt weder einen Hinweis auf eine Stütze noch einen auf Konsolen oder einen Stahlträger.
   - Laut Howdens/Dekton braucht eine Spannweite über **575 mm** ohne Unterstützung einen Stützträger.
   - Sekundärquellen nennen für Quarz und Sinterstein etwa **25 cm** Überstand ohne Stütze. Das ist nicht vom Hersteller bestätigt und muss von Binni bzw. vom Plattenlieferanten bestätigt werden.
5. **P2: Der Sitzplatz an der Insel ist nicht nach Fachregel bemessen.**
   - Standard sind 30 cm Überstand bei 95 cm Arbeitshöhe.
   - Die NKBA nennt **38 cm** Kniefreiheit (15″) bei Thekenhöhe 91 cm und **30 cm** (12″) bei 107 cm. Je Platz rechnet sie **61 cm** Breite (24″).
   - Hinter Sitzenden verlangt sie **81 cm** (32″) ohne Verkehr, **91 cm** (36″) zum Vorbeigehen und **112 cm** (44″) zum Durchgehen.
   - Der Code prüft nur 80 cm „Planungsannahme“, und das nur als ok-Meldung, wenn der Wert ≥ 80 ist.
6. **P2: Für die Landeflächen fehlen Prüfungen.**
   - Die Regel `hobSide` mit 30 cm und `prepZone` mit 60/90 cm stehen mit `source: null` im Code. Die NKBA nennt genau diese Werte: neben dem Kochfeld 30 und 38 cm (12″/15″), Vorbereitungsfläche 91 × 61 cm an der Spüle (36″ × 24″).
   - Ganz fehlen:
     - Spüle: 61 und 46 cm (24″/18″)
     - Kühlschrank auf der Griffseite: 38 cm
     - Backofen: 38 cm
     - Kochfeld auf der Insel: 23 cm Platte dahinter (9″)
7. **P2: Das Kompaktgerät steht zu hoch.**
   - `geometry.js` setzt „Backofen + Mikrowelle (kompakt)“ fest auf **142–187 cm** über dem Boden.
   - Die NKBA empfiehlt die Unterkante der Mikrowelle **höchstens 137 cm** (54″) über dem Boden und 3″ unter der Schulter. Wer heiße Flüssigkeit über Schulterhöhe herausnimmt, riskiert Verbrühungen.
   - Die Einbauhöhe des Backofens (86–148 cm) hängt nicht von der Körpergröße ab, obwohl `ergo.body` vorhanden ist.
8. **P2: Lüftung.**
   - Die Haubenregel (Neff, 55/65 cm) ist eine reine ok-Meldung mit festen 65 cm. Der Flachschirm wird in `geometry.js` richtig auf ≥ 65 cm angehoben, das ist in Ordnung.
   - Folgende Prüfungen fehlen:
     - **Kamin bzw. Feuerstätte im Raum zusammen mit Abluft**: Unterdruck höchstens 4 Pa, Sicherheitsschaltung, Abnahme durch den Rauchfangkehrer bzw. Schornsteinfeger
     - Haubenbreite mindestens so breit wie das Kochfeld. Die Wandhaube ist im 3D-Modell auf 90 cm begrenzt, auch bei einem Kochfeldmodul von 120 cm.
     - Abluftrohr Ø 150 mm (BSH-Datenblatt)
     - Muldenlüfter: Der Unterschrank darunter hat eine kleinere Schubladentiefe, und in der Stückliste fehlt der Hinweis darauf.
     - Umluft: Rückführung über Sockel oder Nischenwand
9. **P2: Elektro.**
   - Geprüft wird nur der Abstand des Kochfelds zum Herdanschluss (≤ 2 m) und ein Hinweis, Steckdosen einzutragen.
   - Es fehlen:
     - Anzahl der Steckdosen nach RAL-RG 678 bzw. DIN 18015-2: Küche mit Ausstattungswert 1 hat 5, AW 2 hat 10, AW 3 hat 12
     - eigene Stromkreise für Herd, Backofen, Geschirrspüler und Kühlgerät
     - Steckdose an der Insel
     - Steckdose für den Geschirrspüler erreichbar im Nachbarschrank statt hinter dem Gerät
10. **P2: Wasser.**
    - Eine Spüle auf der Insel meldet „kein Wasseranschluss an dieser Wand“. Fachlich richtig wäre der Hinweis auf einen Bodenanschluss mit Abfluss und Gefälle.
    - Es fehlt eine Prüfung, ob Geschirrspüler und Spüle beide in Reichweite des Abflusses liegen. Der Geschirrspüler wird im Moment nur zur Spüle geprüft, das reicht in den meisten Fällen.
11. **P3: Die Gangbreite ist fest auf eine Bezugsgröße eingestellt.**
    - Werte heute: 100/120 cm (sanier.de). Laut NKBA sind es 107/122 cm.
    - Es fehlt ein Modus „barrierefrei“: 120 cm mit Gehhilfe bzw. 150 × 150 cm Bewegungsfläche mit Rollstuhl nach DIN 18040-2, unterfahrbare Spüle und unterfahrbares Kochfeld.
    - Für Hotels und Ferienwohnungen ist das ein Verkaufsargument (siehe `hotel-contract.md`).
12. **P3: Der Gang im freien Grundriss wird nicht geprüft.** In der Form `frei` wird nur geprüft, ob die Insel im Raum liegt, nicht der Gang zur Gegenwand. Die offene Tür eines Geräts (Backofen, Geschirrspüler) im Gang wird nicht geprüft.

Gut gelöst und unverändert lassen:
- Blindecke, LeMans (≥ 100 cm) und Karussell (90/90)
- Türanschlag zur Wand mit 4-cm-Blende
- Kochfeld unter dem Fenster und Wandhaube vor dem Fenster
- Hochschrank zwischen Spüle und Kochfeld
- Kochfeld direkt neben dem Kühlschrank
- Fensterbank unter der Platte
- Ecke mit schrägem Winkel (`cornerClearance`)
- Stückliste mit „Maß fehlt“

---

## 2. Befunde und Chancen

**Was fehlt zur Profi-Tauglichkeit (in der Reihenfolge des Nutzens):**

1. **Gerätedaten statt fester Nischen.** Das ist eine kleine Tabelle `APPLIANCE_CLASSES`, keine Modelle und keine Marken im Frontend:
   - Geschirrspüler: Standard 81,5–87,5, XXL 86,5–92,5, SMS etwa 76,5
   - Backofen 60
   - Kompaktgerät 45
   - Kühlgerät: 88, 102, 122, 140, 158 und 178 cm
   - Weinkühler 82, 88 und 178

   Daraus berechnet der Planer, ob Sockel und Korpus passen. Das ist die häufigste Reklamation beim Einbau.
2. **Stein-Modul (Binni):**
   - Plattenformat je Material
   - automatische Fugenplanung
   - Gewicht je Teil
   - Ausschnitte mit Mindeststeg
   - Überstand mit Stütze
   - Kantenbild

   Daraus entsteht ein **Zuschnittplan** als PDF für Binni. Das ist der direkte Nutzen der Kooperation: weniger Rückfragen, weniger Bruch und Fehlschnitt.
3. **Installationsplan Elektro, Wasser, Lüftung** als eigenes Blatt im Druck (`/de/labs/kuechenplaner/druck`):
   - alle Anschlüsse mit Höhe und Abstand zur Wandecke
   - Stromkreise
   - Abluftweg

   Elektriker und Installateur brauchen genau das, und Küchenstudios verlangen dafür oft eine Planungsgebühr.
4. **Aufmaß-Modus:**
   - Wand nicht im Lot oder schief: Toleranz ± x mm
   - Passblenden automatisch berechnen
   - Hinweis „Endmaß nach Aufmaß vor Ort“
5. **Einwilligung zu Normen und Barrierefreiheit:** Schalter „Standard / Komfort / barrierefrei“. Damit gelten andere Grenzwerte.
6. **Freigabe-Status je Plan:** Ampel „Planung bereit zum Aufmaß“ erst, wenn es keinen Fehler und keinen offenen „Maß fehlt“-Punkt bei Geräten gibt. Das ist ein guter Anlass für den Lead (Termin für das Aufmaß).

**Wirkung auf den Umsatz (Schätzung, keine Messung):**
- Ein Planer, der Profi-Fehler findet, ist ein Grund, mit dem eigenen Plan ins Studio zu kommen statt zum Möbelhaus.
- Die Rechnung im Binni-Dokument (26) setzt bis M36 zusätzlich 70–150 T€ pro Monat für die Linie an. Der Planer ist dort der Kanal, der skaliert.
- Ein ungeprüfter Plan erzeugt Nacharbeit: falsche Nische, Stein zu lang. Bei Stein kostet ein Fehlschnitt schnell eine ganze Platte. Den Betrag beziffern wir nicht ohne Einkaufspreise von Binni.

---

## 3. FERTIGER Baustein: Regelkatalog (zur direkten Umsetzung)

### 3.1 Format

Jede Regel bekommt ein Objekt in `norms.js` (`RULES`). `checks.js` liest nur von dort.

```js
// Schema je Regel
{
  id: "K-LAND-03",            // fester Schlüssel, auch für Tests
  cat: "ergonomie" | "kollision" | "anschluss" | "maß" | "lüftung" | "stein" | "elektro",
  level: "error" | "warn" | "hint",   // Stufe bei Verstoß
  value | min | max: Zahl (cm, mm, Pa …),
  unit: "cm",
  label: "Kurztext",
  basis: "norm" | "hersteller" | "richtlinie" | "praxis",  // NEU – praxis = Planungsannahme
  verified: true | false,     // false = Sekundärquelle, Text vor Livegang prüfen
  source: { title, url } | null,
  modes: ["standard","komfort","barrierefrei"], // optional: Grenzwert je Modus
}
```

Damit die Oberfläche unterscheiden kann, braucht es zwei neue Felder:
- `basis` zeigt, ob der Wert aus einer Norm, vom Hersteller, aus einer Richtlinie oder aus der Praxis stammt.
- `verified` zeigt, ob die Quelle geprüft ist. Ist ein Wert nicht geprüft, steht in der Oberfläche „Richtwert, im Gespräch bestätigen“.

Stufen:
- **error**: nicht baubar oder Gefahr
- **warn**: Hinweis
- **hint**: Tipp

Abkürzungen für Status und Quellen:
- Status: **V** = vorhanden, **A** = anpassen, **N** = neu
- Quellen: [Q1]–[Q20] stehen in Abschnitt 3.4.

### 3.2 Regeltabelle

#### A. Ergonomie und Arbeitshöhe

| ID | Regel | Grenzwert | Stufe | Quelle | Status |
|---|---|---|---|---|---|
| K-ERG-01 | Arbeitshöhe zur Körpergröße | 10–15 cm unter dem Ellenbogen, Ellenbogen ≈ 0,633 × Körpergröße | warn | [Q1] Neff, [Q2] AMK | V |
| K-ERG-02 | Spülenbereich darf höher sein (optional getrennte Höhen) | Spülenzone 5–10 cm höher als die Kochzone | hint | praxis, verified:false | N |
| K-ERG-03 | Kochfeld-Oberkante bei Inseln mit Sitzplatz auf gleicher Höhe | Kochfeld auf der Insel: ≥ 23 cm Platte hinter dem Kochfeld, wenn die Plattenhöhe gleich ist | warn | [Q5] NKBA (9″) | N |
| K-ERG-04 | Unterkante Hängeschrank über der Platte | 50–60 cm (Komfort 55) | hint | praxis (Quelle `null` bleibt), basis:"praxis" | A (nur `basis` ergänzen) |
| K-ERG-05 | Oberstes Hängeschrank-Fach erreichbar | Oberkante des Fachs ≤ Körpergröße × 1,05 → sonst Hinweis „Tritt nötig / Liftsystem“ | hint | praxis, verified:false | N |
| K-ERG-06 | Mikrowelle bzw. Kompaktgerät mit Flüssigkeit | Unterkante ≤ 137 cm und ≤ Schulterhöhe − 8 cm (Schulter ≈ 0,82 × Körpergröße, Planungsannahme) | warn | [Q5] NKBA (54″/3″) | N; zusätzlich `geometry.js`: Gerätehöhe aus `ergo.body` statt fest 142 cm |
| K-ERG-07 | Backofen im Hochschrank ergonomisch | Mitte der Backofentür in Ellenbogenhöhe ± 15 cm | hint | praxis, verified:false | N |
| K-ERG-08 | Geschirrspüler hochgebaut (Komfort/barrierefrei) | Angebot „Hochbau-Geschirrspüler“ ab Körpergröße ≥ 185 cm oder im Modus barrierefrei | hint | praxis | N |

#### B. Wege, Gänge, Sitzplätze

| ID | Regel | Grenzwert | Stufe | Quelle | Status |
|---|---|---|---|---|---|
| K-GANG-01 | Arbeitsgang eine Person | < 100 → error; Komfort ≥ 107 | error/warn | [Q3] sanier.de; [Q5] NKBA 42″ | A (NKBA als zweite Quelle) |
| K-GANG-02 | Arbeitsgang zwei Personen | ≥ 120 (NKBA 122) | warn | [Q3], [Q5] 48″ | V |
| K-GANG-03 | Gang im freien Grundriss (Zeile zu Gegenwand / Zeile zu Zeile) | wie K-GANG-01/02, gemessen an Front + 2 cm Griff | error/warn | wie oben | N |
| K-GANG-04 | Gerätetür offen im Gang | Backofen- bzw. Geschirrspülertür (Tiefe ≈ Modulbreite − 0, Planungsannahme 55 cm) + 50 cm Restgang | warn | praxis; [Q5] NKBA 21″ Standfläche Geschirrspüler | N |
| K-GANG-05 | Durchgang (kein Arbeitsplatz) | ≥ 91 cm | warn | [Q5] NKBA 36″ Walkway | A (ersetzt `passage` 80 / `null`) |
| K-SITZ-01 | Breite je Sitzplatz | ≥ 61 cm | warn | [Q5] NKBA 24″ | N |
| K-SITZ-02 | Kniefreiheit bei Thekenhöhe 86–95 cm | Überstand ≥ 38 cm | warn | [Q5] NKBA 15″ @ 36″ | N |
| K-SITZ-03 | Kniefreiheit bei Barhöhe 100–110 cm | Überstand ≥ 30 cm | warn | [Q5] NKBA 12″ @ 42″ | N |
| K-SITZ-04 | Kniefreiheit Tischhöhe 72–76 cm | ≥ 46 cm | warn | [Q5] NKBA 18″ @ 30″ | N |
| K-SITZ-05 | Raum hinter Sitzenden | ohne Verkehr ≥ 81, mit Vorbeigehen ≥ 91, Durchgang ≥ 112 | warn (< 81 = error) | [Q5] NKBA 32″/36″/44″ | A (ersetzt Meldung „80 knapp, besser 100“) |
| K-SITZ-06 | Sitzplatz gegenüber Kochfeld auf gleicher Höhe | Abstand Kochzone bis Plattenkante Sitzseite ≥ 23 cm; sonst Spritzschutz oder Barplatte | warn | [Q5] NKBA 9″ | N |

#### C. Arbeitsdreieck und Landeflächen

| ID | Regel | Grenzwert | Stufe | Quelle | Status |
|---|---|---|---|---|---|
| K-DRE-01 | Seite des Arbeitsdreiecks | 120–270 cm | warn (an einer Wand: hint) | [Q4] NKBA über Wikipedia | V |
| K-DRE-02 | Summe | ≤ 790 cm | warn | [Q4] | V |
| K-DRE-03 | Kein Hochschrank und keine Insel-Ecke schneidet eine Dreiecksseite | Seite schneidet `quad` eines Hochschranks → Hinweis | hint | [Q5] NKBA (Dreieck ohne Hindernis) | N |
| K-LAND-01 | Spüle Landefläche | ≥ 61 cm auf einer Seite und ≥ 46 cm auf der anderen | warn | [Q5] NKBA 24″/18″ | N |
| K-LAND-02 | Vorbereitungsfläche an der Spüle | durchgehend ≥ 91 cm breit (Plattentiefe ≥ 60) zwischen Spüle und Kochfeld oder direkt neben der Spüle; Minimum 60 bleibt error-freie Untergrenze | warn | [Q5] NKBA 36″ × 24″ | A (`prepZone`: `good` 90 → 91, Quelle setzen) |
| K-LAND-03 | Kochfeld Abstellfläche | ≥ 30 cm auf einer Seite **und** ≥ 38 cm auf der anderen | warn | [Q5] NKBA 12″/15″ | A (heute „30 auf beiden Seiten“, Quelle `null`) |
| K-LAND-04 | Kühlschrank Abstellfläche | ≥ 38 cm auf der Griffseite (oder Insel gegenüber ≤ 122 cm) | hint | [Q5] NKBA 15″ / 48″ | N |
| K-LAND-05 | Backofen-Abstellfläche | ≥ 38 cm daneben oder gegenüber ≤ 122 cm | hint | [Q5] NKBA 15″ / 48″ | N |
| K-LAND-06 | Zusammengelegte Landeflächen | Zwei Geräte teilen sich eine Fläche: größere Anforderung + 30 cm | hint | [Q5] NKBA (combining landing areas), verified:false | N |
| K-LAND-07 | Geschirrspüler zur Spüle | direkt daneben ok; ≤ 91 cm Kante zu Kante hint; weiter weg warn | hint/warn | [Q5] NKBA 36″ | A (heute 60,5 cm ohne Quelle → 91 cm mit Quelle) |
| K-LAND-08 | Kochfeld seitlich zum Hochschrank | ≥ 10 cm Kante Kochfeld zu Hochschrank (Herstelleranleitung geht vor) | error | [Q6] Montageanleitung (Höffner-Hausmarke) 100 mm; Gorenje 40 mm | N (heute nur indirekt über 30 cm Abstellfläche) |
| K-LAND-09 | Kochfeld direkt neben dem Kühlgerät | mindestens ein Modul dazwischen | hint | praxis | V |
| K-LAND-10 | Arbeitsplatte gesamt | ≥ 400 cm Front (Tiefe 60), sonst Hinweis „kompakte Küche“ | hint | [Q5] NKBA 158″, verified:false | N |

#### D. Geräte und Nischen (Gerätefachberater)

| ID | Regel | Grenzwert | Stufe | Quelle | Status |
|---|---|---|---|---|---|
| K-GER-01 | Nische Geschirrspüler (EU, Standard) | Sockel + Korpus in 81,5–87,5 cm | error, wenn keine Klasse passt | [Q7] Bosch SMU4EVS08E (Händlerdaten), verified:false | N |
| K-GER-02 | Nische Geschirrspüler XXL | 86,5–92,5 cm | wie oben (automatisch XXL vorschlagen) | [Q8] Bosch SBV4ECX32E (Händlerdaten), verified:false | N |
| K-GER-03 | Nische Geschirrspüler CH 55 | ca. 76,5 cm (Gerät 75,6) | error im CH-Raster bei anderem Höhensystem | [Q9] V-ZUG über Fust, verified:false | N |
| K-GER-04 | Standard-Ergo mit Nische abgleichen | `DEFAULT_ERGO` so wählen, dass Nische = 87 (Sockel 9 + Korpus 78) oder XXL fest einplanen | – | aus K-GER-01/02 abgeleitet | A (`planState.js` Sockel 15 → ≤ 14,5 bei XXL bzw. ≤ 9,5 bei Standard) |
| K-GER-05 | Backofen 60 | Nische 58,5–59,5 × 56–56,8 × ≥ 55 | V | [Q10] Bosch HBA5780S0B | V |
| K-GER-06 | Kompaktgerät 45 | 45,5 × 56 × 55 | V | [Q11] Constructa CC4M61063 | V |
| K-GER-07 | Kühlgerät 178/122 | 177,2–178,8 / 121,6–123,6 × 56–57 × 55 | V | [Q12] Liebherr | V |
| K-GER-08 | Kühlgerät im CH-Raster | Nische nach SMS-Gerätedatenblatt; ohne Daten **„Maß fehlt“** statt 56 cm | hint | [Q13] Bundesrat SMS/EN 1116 | A (NICHES je Raster) |
| K-GER-09 | Weitere Kühl-Nischenhöhen | 88 / 102 / 140 / 158 cm als Klassen; Werte nur mit Herstellerquelle eintragen | – | offen (Gerätefachberater liefert Datenblätter) | N |
| K-GER-10 | Lüftung des Einbau-Kühlgeräts | Lüftungsquerschnitt im Sockel bzw. oben nach Einbauanleitung; ohne Wert Hinweis „Lüftungsgitter einplanen“ | hint | Herstelleranleitung, Wert modellabhängig | N |
| K-GER-11 | Kühlgerät-Tür an der Wand | Türanschlag zur Wand: Passblende ≥ 4 cm (bei Gerätetür mit Griff ≥ 5 cm) | warn | praxis | V/A |
| K-GER-12 | Muldenlüfter | Unterschrank darunter: Schubladen nur in reduzierter Tiefe, Sockel bzw. Rückwand mit Umluft-Kanal; Hinweis in die Stückliste | hint | Herstelleranleitung, modellabhängig | N |
| K-GER-13 | Gaskochfeld | Nur mit Gasanschluss vom Fachbetrieb (AT: ÖVGW-Regeln, DE: TRGI); unter Fenster mit Vorhang = warn | warn | praxis + [Q5] NKBA (kein Kochfeld unter Fenster mit Vorhang) | A |

#### E. Lüftung

| ID | Regel | Grenzwert | Stufe | Quelle | Status |
|---|---|---|---|---|---|
| K-LUF-01 | Haube über Induktion/Elektro | ≥ 55 cm (je Haubentyp) | error, wenn kleiner | [Q14] Neff | A (echter Wert statt fest 65) |
| K-LUF-02 | Haube über Gas | ≥ 65 cm | error | [Q14] Neff | A |
| K-LUF-03 | Empfohlene Montagehöhe | 65–75 cm | hint | [Q15] Hauben-Montageanleitung | N |
| K-LUF-04 | Haubenbreite | Haube ≥ Kochfeldbreite (Komfort: + 10 cm) | warn | praxis, verified:false | N (+ `geometry.js` Haubenbreite nicht auf 90 begrenzen) |
| K-LUF-05 | Abluftrohr | Ø 150 mm; Reduzierung auf 125/120 = Leistungsverlust-Hinweis | hint | [Q16] BSH-Datenblatt LC94PBC50 | N |
| K-LUF-06 | Abluftweg | Mauerkasten mit Rückstauklappe; Weg möglichst kurz, wenige Bögen | hint | [Q16] | N |
| K-LUF-07 | Abluft + Feuerstätte (Kamin, Kachelofen) im Raum oder Verbund | Feld „Feuerstätte vorhanden: ja/nein“. Bei ja + Abluft: Sicherheitseinrichtung (Unterdruckwächter oder Fensterkontakt), Unterdruck ≤ 4 Pa, **Abnahme durch Rauchfangkehrer/Schornsteinfeger** | error, bis bestätigt | Feuerungsverordnungen; Wert laut Sekundärquellen [Q17], verified:false | N |
| K-LUF-08 | Umluft | Bei Umluft: Rückführung (Sockel oder Nische) und Filterwechsel im Angebot | hint | praxis | N |
| K-LUF-09 | Inselhaube / Deckenlüfter | Abhängehöhe aus Raumhöhe; Deckenlüfter: Decke ≤ 300 cm sonst hint „Leistung prüfen“ | hint | praxis, verified:false | N |

#### F. Elektro

| ID | Regel | Grenzwert | Stufe | Quelle | Status |
|---|---|---|---|---|---|
| K-ELE-01 | Steckdosen Küche (Mindestausstattung) | ≥ 5 (AW 1), Standard 10 (AW 2), Komfort 12 (AW 3); Kochnische 3/7/8 | hint | [Q18] RAL-RG 678 / DIN 18015-2 (über Hager, Haustechnikdialog), verified:false | N |
| K-ELE-02 | Steckdosen an der Arbeitsfläche | mindestens Doppelsteckdosen | hint | [Q18] | N |
| K-ELE-03 | Eigene Stromkreise | Herd/Kochfeld (400 V), Backofen, Geschirrspüler, je nach Gerät Kühlgerät/Mikrowelle eigener Stromkreis | hint | DIN 18015-2 (DE), OVE E 8015 (AT, Normtext nicht eingesehen), verified:false | N |
| K-ELE-04 | Herdanschluss | Herdanschlussdose ≤ 200 cm vom Kochfeldschrank (heute), Lage hinter Unterschrank, nicht hinter Schublade mit Vollauszug | warn | praxis | V/A |
| K-ELE-05 | Steckdose Geschirrspüler/Kühlgerät | im Nachbarschrank, nach Einbau erreichbar | hint | Herstelleranleitungen BSH (sinngemäß), verified:false | N |
| K-ELE-06 | Insel mit Kochfeld/Steckdose | Bodendose bzw. Leitung im Boden nötig → Hinweis „Estrich/Boden vor Planung prüfen“ | warn | praxis | N |
| K-ELE-07 | Steckdose seitlich zu Spüle und Kochfeld | ≥ 30 cm Abstand von Beckenrand und Kochfeldkante (Planungsannahme) | hint | praxis, verified:false | N |

#### G. Wasser

| ID | Regel | Grenzwert | Stufe | Quelle | Status |
|---|---|---|---|---|---|
| K-WAS-01 | Spüle zu Wasseranschluss (Wand) | ≤ 120 cm | warn | praxis | V |
| K-WAS-02 | Spüle auf der Insel | Meldung „Boden-Anschluss Zu-/Abwasser nötig, Gefälle prüfen“ statt „kein Anschluss an dieser Wand“ | warn | praxis | A |
| K-WAS-03 | Geschirrspüler zum Abfluss | gleiche Zeile wie Spüle, sonst warn | warn | praxis | V (über K-LAND-07) |
| K-WAS-04 | Kochend-Wasser-Hahn / Wasserfilter | Platz im Spülenschrank, Steckdose im Spülenschrank | hint | praxis | N |

#### H. Schränke, Raster, Ecken (Tischlermeister)

| ID | Regel | Grenzwert | Stufe | Quelle | Status |
|---|---|---|---|---|---|
| K-SCH-01 | Rasterbreiten EU | 10/15-cm-Raster, Korpustiefe 60 | – | [Q19] Neff, [Q13] EN 1116 | V |
| K-SCH-02 | Rasterbreiten CH | 55-cm-Raster SMS **mit eigener Höhenreihe** (Nischen K-GER-03) | error, wenn Gerät und Höhe nicht passen | [Q13] | A |
| K-SCH-03 | LeMans / Karussell | LeMans ≥ 100 cm, Karussell 90/90 | warn | Beschlaghersteller, modellabhängig | V |
| K-SCH-04 | Auszüge Ecke | Passstück 5–10 cm bei Griffen; grifflos 3 cm (Planungsannahme) | hint | praxis | V/A |
| K-SCH-05 | Wandtoleranz | Passblende an jeder Wandseite ≥ 3 cm, wenn kein Aufmaß vorliegt | hint | praxis | N |
| K-SCH-06 | Sockelhöhe | 6–20 cm erlaubt; < 8 cm Hinweis „Bodenunebenheit/Füße“, > 15 cm Hinweis „Geschirrspüler-Nische prüfen“ | hint | praxis + K-GER-01 | N |
| K-SCH-07 | Hochschrank bis Decke | Abstand Oberkante zu Decke < 5 cm → Blende; 5–30 cm → hint „Staubfläche“ | hint | praxis | N |

#### I. Stein-Arbeitsplatten (Binni)

| ID | Regel | Grenzwert | Stufe | Quelle | Status |
|---|---|---|---|---|---|
| K-STN-01 | Maximale Plattenlänge je Material | Quarz Standard 306 × 140 (Jumbo 325 × 159); Sinterstein 320 × 144 (bis 330 × 150); Naturstein: **Wert von Binni** (Feld `slab: null` → „Fuge wird bei Aufmaß festgelegt“) | warn, wenn Stück > Länge − 2 × 2 cm Schnittrand | [Q20] Cosentino Silestone/Dekton | N |
| K-STN-02 | Fugen-Lage | nicht in oder an einem Ausschnitt; nicht über freier Spannweite; nicht über Geschirrspüler (Dampf, Praxis) | error (Ausschnitt) / warn | [Q21] Howdens/Dekton (Ausschnitt, Spannweite); praxis (Geschirrspüler) | N |
| K-STN-03 | Freie Spannweite ohne Unterstützung | > 57,5 cm → Stützträger nötig | warn | [Q21] Howdens/Dekton 575 mm | N |
| K-STN-04 | Überstand ohne Stütze | Planungsannahme 25 cm (Quarz/Sinterstein 20 mm); 12 mm Sinterstein ohne Trägerplatte: 0 bis Herstellerfreigabe; darüber Konsole/Stahlwinkel | warn | Sekundärquelle (Cambria 10″), verified:false – **Binni bestätigt** | N |
| K-STN-05 | Stärke je Material | Prüfen, dass `topT` ∈ `WORKTOPS[top].mm` (heute Schema 12–60 für alle) | error | Katalog | A |
| K-STN-06 | Unterbau- bzw. flächenbündige Spüle | nur mit Stein/Quarz/Sinterstein ≥ 20 mm (Holz: Hinweis Versiegelung) | warn | praxis, verified:false | N |
| K-STN-07 | Gewicht je Plattenteil | Rechnung Fläche × Stärke × Rohdichte (Granit/Marmor ≈ 2,7 g/cm³ als Planungsannahme; Lieferant gibt echten Wert); > 80 kg je Teil → Hinweis „3–4 Personen, Tragegurt, Zugang/Treppe prüfen“ | hint | Rechnung; Rohdichte von Binni | N |
| K-STN-08 | Ausschnitt-Steg | Abstand Ausschnitt zu Vorderkante, Rückkante und Fuge ≥ Herstellerwert (Feld `minWeb`, ohne Wert „vom Steinmetz festzulegen“) | warn | [Q21] (Mindestabstände genannt, Zahl modellabhängig) | N |
| K-STN-09 | Aufmaß-Pflicht | Steinplatte wird erst nach Montage der Unterschränke aufgemessen (Schablone) – fester Text im Druck | – | praxis | N |
| K-STN-10 | Wasserfall-Wangen | Gehrung 45°, Stärke wie Platte; Boden muss eben sein → Hinweis | hint | praxis | N |

#### J. Barrierefrei-Modus (optional, Hotel/Ferienwohnung/Wohnen im Alter)

| ID | Regel | Grenzwert | Stufe | Quelle | Status |
|---|---|---|---|---|---|
| K-BF-01 | Bewegungsfläche vor Küchenzeile | ≥ 120 cm (Gehhilfe), ≥ 150 × 150 cm (Rollstuhl) | error im Modus | [Q22] DIN 18040-2 über Ratgeber, verified:false | N |
| K-BF-02 | Unterfahrbare Spüle und Kochfeld | Modul „unterfahrbar“ nötig | warn | [Q22] | N |
| K-BF-03 | Hängeschrank-Oberkante | ≤ 140 cm | hint | Ratgeber, verified:false | N |
| K-BF-04 | AT/CH-Entsprechung | AT: ÖNORM B 1600, CH: SIA 500 – Werte vor Livegang aus den Normtexten | – | offen | N |

### 3.3 Umsetzungsreihenfolge im Code (für das Code-Team)

1. **`norms.js`**
   - Felder `basis` und `verified` ergänzen.
   - Quellen Q5 (NKBA) und Q20–Q21 (Stein) ergänzen.
   - `NICHES` je Raster aufteilen (`NICHES[60]`, `NICHES[55]`).
   - Neu: `DISHWASHER_CLASSES = [{id:"std",min:81.5,max:87.5},{id:"xxl",min:86.5,max:92.5},{id:"sms",min:76,max:77}]` mit Quellen.
2. **`checks.js`**
   - neue Abschnitte: 10) Sitzplätze, 11) Landeflächen, 12) Geräte-Nischen, 13) Lüftung/Feuerstätte, 14) Elektro-Ausstattung, 15) Stein
   - Jede Regel bekommt die `id` mit in das Ergebnis (`items[].rule`), damit Tests und Druck darauf verweisen können.
3. **`geometry.js`**
   - Plattenstücke nach `WORKTOPS[top].slab` teilen und Fugen setzen. Die Fugen liegen außerhalb der Ausschnitte, bevorzugt an Modulgrenzen und nicht über dem Geschirrspüler.
   - Höhe des Kompaktgeräts aus `ergo.body` berechnen.
   - Haubenbreite gleich Kochfeldbreite.
4. **`catalog.js`**
   - `WORKTOPS.*.slab` (cm), `maxOverhang` (cm, `null` = Binni) und `density` (`null` = Binni)
   - `OPENINGS.feuerstaette`
   - Plan-Feld `ergo.mode` (`standard` | `komfort` | `barrierefrei`)
5. **`planState.js`**
   - `DEFAULT_ERGO.plinth` auf 10 setzen (Nische 88 → XXL passt).
   - Alternativ Sockel 15 lassen und Korpus 72 nehmen: Nische 87 cm, Standard-Geschirrspüler passt. (15 + 78 = 93 cm passt zu keiner Klasse, auch nicht XXL bis 92,5 cm.)
   - Die Entscheidung trifft der Inhaber zusammen mit Binni, je nach deren Korpushöhen.
6. **`bom.js`** neue Zeilen:
   - „Geschirrspüler-Klasse (Standard/XXL/SMS)“
   - Fugen und Plattenteile mit Gewicht
   - Stützträger
   - Mauerkasten oder Umluft-Set
   - Installationsliste
7. **Druckseite:** neues Blatt „Installationsplan“ mit allen Anschlüssen (Höhe und Abstand zur Ecke), Stromkreisen und Abluftweg. Dazu der feste Text zum Aufmaß (K-STN-09).
8. **Tests** je Regel-ID (`tests/unit/labs-kuechenplaner-regeln.test.mjs`). Jede Vorlage startet ohne `error`.

### 3.4 Quellen

| Nr. | Quelle |
|---|---|
| Q1 | Neff Ergonomie: https://www.neff-home.com/at/neff-entdecken/kuechenplanung/schritte/ergonomie |
| Q2 | AMK/woodworker: https://www.woodworker.de/news/weiter/ideale-arbeitshoehe-richtet-sich-nach-dem-ellenbogen |
| Q3 | sanier.de Maße: https://www.sanier.de/kueche/die-wichtigsten-masse-und-abstaende-in-der-kueche |
| Q4 | Arbeitsdreieck: https://en.wikipedia.org/wiki/Kitchen_work_triangle |
| Q5 | NKBA Kitchen Planning Guidelines (PDF): https://kb.nkba.org/uploads/2022/05/Kitchen-Planning-Guidelines.pdf. Die Werte wurden über die Zusammenfassung https://www.thewcsupply.com/pages/kitchen-design-guidelines-standard-clearances abgeglichen, weil das PDF maschinell nicht lesbar war. **Vor Livegang mit dem PDF gegenprüfen.** |
| Q6 | Kochfeld-Abstand zum Hochschrank: Montageanleitung https://media.hoeffner.de/medias/pdf/16561_9-202411142349.pdf (100 mm); Gorenje https://partners.gorenje.com/fts/htmlNavodila/899682de.html (40 mm). Die Anleitung des jeweiligen Geräts geht vor. |
| Q7 | Bosch-Standard-Geschirrspüler, Nische 81,5–87,5 (Händlerdaten): https://www.coolblue.de/spuelmaschinen/einbau/unterbau |
| Q8 | Bosch XXL 86,5–92,5 (Händlerdaten): https://www.coolblue.de/spuelmaschinen/einbau/integrierte-spuelmaschinen |
| Q9 | V-ZUG 55 cm (Gerät 75,6 cm, Nische etwa 76,5 cm): https://www.fust.ch/p/10786521 und https://www.fust.ch/fr/appareils-de-cuisine/appareils-de-cuisine-encastrables/lave-vaisselle-encastrable/lave-vaisselle-encastrable-55-cm-integre/v-zug-adoraspuelen-v4000-4109500019-standard-3m-/p/10651545 |
| Q10 | Bosch HBA5780S0B: https://bosch-home.co.uk/customer-service/HBA5780S0B/04 |
| Q11 | Constructa CC4M61063: https://media3.bsh-group.com/Documents/specsheet/de-DE/CC4M61063.pdf |
| Q12 | Liebherr-Nischen: https://www.liebherr.com/de-ch/gefrier-kuehlschraenke/einbaukuehlschraenke-3069014 |
| Q13 | Bundesrat CH, SMS und EN 1116: https://www.newsd.admin.ch/newsd/message/attachments/6127.pdf |
| Q14 | Neff, Höhe der Haube: https://www.neff-home.com/at/de/c/spotlight/bltf94ee40e0269825b/hoehe-dunstabzugshaube |
| Q15 | Hauben-Montageanleitung 65–75 cm: https://res.cloudinary.com/chal-tec/image/upload/bbg/10035190/bda/10035190.pdf |
| Q16 | BSH-Datenblatt LC94PBC50 (Ø 150, Rückstauklappe): https://media3.bsh-group.com/Documents/specsheet/de-LU/LC94PBC50.pdf |
| Q17 | 4 Pa / Fensterkontakt (Sekundärquelle, Forum): https://bau.de/forum/kachelofen/11797.php. Verbindlich sind die Landes-Feuerungsverordnung (DE) bzw. die Vorgaben des Rauchfangkehrers (AT). |
| Q18 | Ausstattungswerte für Steckdosen: https://www.haustechnikdialog.de/News/9774/Planung-nach-Rezept-Elektroinstallation-in-der-Kueche-So-planen-Sie-fachgerecht und https://assets.hager.com/step-content/P/HA_39676155/Document/std.lang.all/23DE0014-TIP-HAGERTIPP-21-WEB.pdf. Für AT gilt OVE E 8015:2022 (https://austrian-standards.at/en/shop/ove-e-8015-2022-07-01~p2626290, nicht eingesehen). |
| Q19 | Neff-Raster: https://www.neff-home.com/at/neff-entdecken/kuechenplanung/schritte/korpushoehe-und-rastermasse |
| Q20 | Cosentino-Formate Silestone/Dekton: https://ivettandreed.co.uk/site/assets/files/8297/cosentino_dhx_promotion_2025.pdf und https://riostones.com/wp-content/uploads/2025/05/dekton-catalog-2025.pdf |
| Q21 | Howdens Dekton Reference Guide (575 mm, keine Fuge über Spannweite oder Ausschnitt): https://www.howdens.com/-/media/howdens/assets/clh_asset_products/clh_asset_levela_108973/clh_asset_levelb_110606/clh_asset_levelc_25289478/ass_25574714.pdf |
| Q22 | DIN 18040-2 (über Ratgeber): https://www.aroundhome.de/kueche/barrierefrei-planen/ und https://www.pflege.de/barrierefreies-wohnen/kueche/ |
| Q23 | DIN 18022 zurückgezogen, ÖNORM 90 cm: https://konsument.at/system/files/2022-02/Leseprobe_K%C3%BCchen%20planen%20und%20einrichten.pdf und https://www.aroundhome.de/kueche/barrierefrei-planen/ |

### 3.5 Daten, die Binni und der Inhaber liefern müssen

Ohne diese Werte bleibt `source: null`:

1. Korpushöhen und Sockelsystem der Binni-Linie, also welche Geschirrspüler-Klasse passt
2. Plattenformate je Steinsorte und Stärke (Rohplatte und nutzbare Länge)
3. Überstand ohne Stütze je Material und Stärke, Art der Stütze
4. Mindeststeg bei Ausschnitten, Innenradien, Kantenbilder
5. Rohdichte je Stein, Bruchrisiko beim Transport, Fugenbreite und Farbe der Fuge
6. Lieferzeit ab Aufmaß, damit der Druck „Lieferzeit ca. … nach Aufmaß“ zeigen kann

---

## 4. Maßnahmen

| Prio | Maßnahme | Aufwand | Kosten grob | Erwarteter Umsatzeffekt (Begründung) | Wer |
|---|---|---|---|---|---|
| P0 | Geschirrspüler-Nische korrigieren (K-GER-01–04): Standard-Ergo bzw. XXL-Klasse, Prüfung und Zeile in der Stückliste | S | intern, ca. 0,5–1 Tag | Verhindert, dass ein Plan, der als bestellbar wirkt, beim Einbau scheitert. Das schützt Marge und Bewertungen. Ohne die Korrektur ist praktisch jede Standardplanung betroffen. | Code-Team, Inhaber (Entscheidung zur Höhe) |
| P0 | CH-Raster mit eigener Höhen- und Nischenreihe, bis dahin bei CH „Maß fehlt“ statt EU-Maß (K-GER-03/08, K-SCH-02) | S–M | 1–2 Tage | Die Schweiz hat höhere Budgets, und das Vertrauen der Planer dort hängt an korrekten SMS-Maßen. Ein falsches Maß ist ein K.-o.-Kriterium bei Architekten in St. Gallen. | Code-Team, Gerätefachberater (Datenblätter) |
| P1 | Stein-Modul: Plattenlänge, Fugen, Spannweite, Überstand, Gewicht (K-STN-01–08) plus Zuschnittplan im Druck | M | 3–5 Tage plus Binni-Daten | Kern der Binni-Linie: weniger Fehlschnitt und Rückfragen, schnellere Angebote. Hebel für die geschätzten 70–150 T€ pro Monat bis M36 (Doku 26, Schätzung). | Code-Team, Binni, Inhaber |
| P1 | Landeflächen und Sitzplätze nach NKBA (K-LAND-01–07, K-SITZ-01–06), `source: null` durch Quellen ersetzen | S–M | 1–2 Tage | Macht aus der „Spielerei“ einen Planer, dem Fachleute folgen. Ein besserer Plan vor dem Termin verkürzt die Planungsgespräche, und das Studio kann mehr Projekte je Planer betreuen (Schätzung). | Code-Team |
| P1 | Lüftung mit Feuerstätte (K-LUF-07) und echte Haubenhöhe bzw. -breite (K-LUF-01–04) | S | 1 Tag | Am Bodensee haben viele Neubauten einen Kaminofen. Das ist ein Sicherheits- und Haftungsthema, und wer es richtig löst, wirkt kompetent. Umsatz indirekt über Vertrauen. | Code-Team |
| P1 | NKBA-PDF und Normtexte (DIN 18040-2, DIN 18015-2, OVE E 8015, SIA 500) beschaffen und alle `verified:false` prüfen | S | Normtexte zusammen grob 150–400 € (Schätzung) | Voraussetzung, um Prüfregeln öffentlich zu zeigen, ohne gegen das UWG zu verstoßen (keine falschen Angaben „nach Norm“). | Inhaber |
| P2 | Installationsplan als eigenes Druckblatt (Elektro, Wasser, Abluft mit Höhen) plus Elektro-Regeln K-ELE-01–07 | M | 2–3 Tage | Kann als Zusatzleistung Geld bringen (Planungspauschale, die bei Auftrag angerechnet wird) und macht den Partner-Elektriker zum Lead-Kanal. Effekt pro Projekt klein, aber bei jedem Projekt. | Code-Team, Partner (Elektro, Installateur) |
| P2 | Ergonomie-Geräteposition aus der Körpergröße (K-ERG-06/07), getrennte Höhen für die Zonen (K-ERG-02) | S | 1 Tag | Premium-Argument „auf Sie gemessen“ in der Beratung. Fördert den Verkauf von Geräte-Hochschränken (höhere Marge als Unterbau). | Code-Team |
| P2 | Ampel „Planung bereit zum Aufmaß“ plus Knopf „Aufmaß-Termin anfragen“ | S | 0,5 Tage | Der natürliche Moment für einen Lead mit hoher Abschlusswahrscheinlichkeit, weil der Plan schon fertig ist. | Code-Team, Inhaber (Preis für das Aufmaß) |
| P3 | Barrierefrei-Modus (K-BF-01–04) | M | 2 Tage plus Normtexte | Öffnet Hotel- und Ferienwohnungs-Contract sowie „Wohnen im Alter“. Passt zum Contract-Ziel (siehe `hotel-contract.md`). | Code-Team, Inhaber |
| P3 | Gänge im freien Grundriss und Gerätetür im Gang (K-GANG-03/04), Aufmaß-Toleranzen (K-SCH-05) | M | 2 Tage | Weniger Fehler bei Altbau und Sondergrundrissen. Indirekter Effekt. | Code-Team |

---

## Top 5 (Kurzfassung)

1. **Geschirrspüler-Nische (P0).** Mit den Standardwerten 15 + 78 ist die Nische 93 cm hoch, passend für keinen Standard- und keinen XXL-Geschirrspüler. Die Korrektur verhindert Fehlplanungen, die als bestellbar wirken.
2. **Schweizer Maße (P0).** Das 55-cm-Raster braucht eine eigene Höhen- und Nischenreihe: Geschirrspüler etwa 76,5 cm, keine 56-cm-Nische. Das ist Pflicht für das Vertrauen in CH.
3. **Stein-Modul mit Zuschnittplan (P1).** Plattenlänge, Fugen, Stützen, Überstand, Gewicht. Hebel für die Binni-Linie mit geschätzt 70–150 T€ pro Monat bis M36.
4. **Landeflächen und Sitzplätze nach NKBA (P1)** mit echten Quellen. Ein Plan mit Profi-Qualität verkürzt die Beratung, und das Studio kann mehr Projekte je Planer betreuen.
5. **Kamin/Abluft und Installationsplan (P1/P2).** Sicherheit, Kompetenz und eine bezahlte Planungsleistung. Partner aus Elektro und Installation werden zum Lead-Kanal.
