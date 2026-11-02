# R6-landing-inhalt – Landing und Inhalt (Runde 6)

Stand 26.10.2026, Branch `feature/neuauftritt`. Nicht committet.

## 1. LandingHero (`src/components/Landing/parts.js`)

- **Leeres Bildband entfernt.** Ohne freigegebenes Hero-Bild (Bildregister `imagery.js`, `released: false`) rendert der Hero kein dekoratives Stein-/See-Band mehr. Wie vom Teamleiter entschieden: Herstellerbilder ohne Freigabe bleiben draußen.
- **Typografischer Abschluss:** Unter dem Text steht jetzt eine Haarlinie (`border-line-strong`, `mt-stack-m`, `aria-hidden`, `data-hero-close`). Hat die Seite eine Faktenzeile (Schweiz-Hub), schließt diese mit ihren eigenen Haarlinien ab, sodass keine Doppellinie entsteht. Der untere Innenabstand ohne Bild beträgt 2 × `stack-m` (48–80 px) statt `section` (96–128 px), damit keine Lücke entsteht.
- **Mobil (Schweiz P3-3):** Ohne Bild steht der Lead im DOM und in der Darstellung vor dem Primärknopf: H1 → Lead → Knopf → Telefon/Fakten. Mit Bild bleibt die Reihenfolge aus QM P2-1 (H1 → Bild → Knopf → Lead). Auf dem Desktop setzt das Raster beide Blöcke explizit, deshalb ist das Layout dort unverändert.
- **LCP/CLS:** Ohne Bild ist der LCP die H1 (Text), und das entfernte Band hatte kein Bild. Mit Bild bleibt genau ein `preload` (per Test belegt). Keine Elemente werden nachträglich eingefügt, also kein zusätzliches CLS-Risiko.
- Betroffen sind Küchen Vorarlberg (`landingPage.js`), Yacht, Outdoor und der Schweiz-Hub. Regionsseiten mit freigegebenem Bild (z. B. Rheintal) bleiben unverändert.

## 2. OG-Locale

`ogLocale(locale)` aus `@/lib/seo/pageMetadata` (nur importiert) ersetzt die eigenen Werte (`de_DE`/`en_US`, `meta?.locale` aus dem CMS) in:
News (Liste, Artikel), Karriere (Liste, Stelle), Partner, Presse, Platzhirsch, Team, Datenschutz, Impressum. Geändert wurden nur die Metadaten, kein Rechtstext.
Zusätzlich verwenden die DE-only-Seiten Ratgeber (Liste, Artikel) und Projekte (Liste, Detail) `ogLocale("de")` statt `"de_AT"`.
`Landing/landingPage.js` fällt jetzt auf `ogLocale("de")` (de_AT) zurück. Die Zielgruppen-Varianten der Regionsseiten (de_CH für Liechtenstein, St. Gallen, Appenzell und Rheintal; de_DE für Lindau, Konstanz, Friedrichshafen, Ravensburg und Kempten, aus QM P3-5) bleiben als `AUDIENCE_OG_LOCALE` erhalten. Der Schweiz-Hub behält `de_CH` (inLanguage de-CH).

Live geprüft (curl): en/news en_GB, de/karriere de_AT, en/partners en_GB, fr/presse fr_FR, it/platzhirsch it_IT, en/team en_GB, en/datenschutz en_GB, de/impressum de_AT.

## 3. Doorway-Stand (Test)

`tests/unit/r6-landing.test.mjs` friert ein:
- den Stand von `REGION_AUDIT` (13 Seiten, Schwelle 4). Indexiert sind nur Appenzell, Arlberg, Feldkirch, Konstanz, Liechtenstein und Rheintal; alle anderen haben `noindex, follow`.
- `landingMetadata` bezieht die Robots weiter aus `regionRobots()`.
- Schweiz-Hub und Projekte (Liste, Detail) stehen auf `index: false, follow: true`. Beim Ratgeber ist `getIndexableRatgeber()` leer; die Robots folgen dem Freigabe-Flag.

Live: lindau `noindex, follow`, rheintal `index, follow`, Schweiz, Ratgeber und Projekte `noindex, follow`.

## Prüfung

- `node --test tests/unit/r6-landing.test.mjs r3-landing r5-shell-seo`: 32/32 grün. `sitemap` und `llms`: 19/19 grün; im ersten Lauf gab es transiente Fehler durch einen kompilierenden Dev-Server, die Wiederholung war grün.
- `npx eslint` auf alle geänderten Dateien: 0 Funde.
- shoot.mjs: `qa-screenshots/teamleiter/r6-R6-landing-inhalt/selbst` (Lauf 1 aller 8 URLs, Bericht `report-lauf1.json`; Lauf 2 der 4 Landingseiten und News nach der Padding-Korrektur, `report.json`) und `…/vorher` (Ausgangsstand mit Bildband). Die Bilder wurden angesehen: Desktop ohne Band und ohne Lücke, iPhone/Android mit dem Lead vor dem Knopf.
- In Lauf 1 traten zwei 500er auf (`/de/news` iPhone, `/de/outdoor-gartenplanung` Desktop). Sie fielen zeitlich mit einem Kompilierfehler in `MarkenItems/markenitems.js` zusammen; die Datei gehört einem anderen Paket und war gerade in Bearbeitung. Im Wiederholungslauf siehe unten.

## Offene Punkte

- Mobil rutscht der Primärknopf auf dem Schweiz-Hub (Entwurfsbanner + langer Lead) unter den ersten Viewport. Das ist die bewusste Folge von P3-3 (Sachinformation vor Aktion). Der sticky „Termin“-Knopf im Header bleibt erreichbar.
- Sobald Hero-Bilder freigegeben sind (`released: false` entfernen), greift automatisch wieder die Bildvariante.

## Fix-Runde nach QM-Feedback (9/10, keine P1/P2)

Feedback: `qa-screenshots/teamleiter/r6-R6-landing-inhalt/feedback.md`.

- **P3-2 Küchen-Hero ohne Lead: behoben.** `LandingPage` reicht jetzt ein optionales `banner.lead` an `LandingHero` durch. Die Küchenseite hat einen einzeiligen Lead ohne Markenbehauptung: „Persönlich geplant in Lochau am Bodensee – abgestimmt auf Ihren Raum, Ihren Alltag und den Wohnbereich daneben.“ Regionsseiten ohne `banner.lead` bleiben unverändert (Rheintal geprüft).
- **P3-1 Schweiz-Hub, Knopf unter dem ersten Viewport:** akzeptiert, offen bis zur Freigabe (Banner kürzen).
- **P3-3 `atelierverkauf`/`gutscheine` mit hartkodiertem `de_AT`:** liegt außerhalb dieses Pakets. Übergabe an das zuständige Paket, auf `ogLocale("de")` umstellen.
- **P3-4 „Poliform und next125“ auf der Küchenseite:** Altlast aus R3 (Bestätigung durch den Inhaber). Bleibt offen und gehört ins Release-/Recht-Paket.
- **P3-5:** Mess-Artefakte, kein Handlungsbedarf.

Prüfung: eslint 0 Funde; `node --test` r6-landing + r3-landing 21/21 grün. `shoot.mjs` → `qa-screenshots/teamleiter/r6-R6-landing-inhalt/fix` (Küchen, Yacht, Rheintal × 4 Geräte): alle 200, 0 Konsolenfehler, kein Overflow. Die Bilder wurden angesehen: Küchen mobil H1 → Lead → Knopf, Desktop Lead links unter der H1 und Haarlinie ohne Lücke, Rheintal unverändert mit Bild.
