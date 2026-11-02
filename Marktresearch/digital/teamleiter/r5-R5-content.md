# R5-content – AP7 Qualitätskette: check-facts, Markenstimme, InlineVideo, Projekte-Vorlage

Stand: 26.10.2026 · Branch `feature/neuauftritt` · nichts committet, keine Installation, keine fremde Datei geändert.

## Ergebnis

| Teil | Status | Dateien |
|---|---|---|
| (1) Faktencheck | fertig, nur Bericht | `tools/content/{check-facts.mjs, lib.mjs, build-facts.mjs, facts.core.json, facts.json}` |
| (2) Markenstimme | Entwurf, Freigabe Inhaberin offen | `docs/content/brand-voice.md` |
| (3) InlineVideo + YouTube-Fassade | fertig, nirgends eingebaut | `src/components/Video/{InlineVideo, AmbientPlay, YouTubeFacade, schema}.js` |
| (4) Projekte | fertig, leer, noindex | `src/app/[locale]/projekte/**`, `src/components/Projects/{ProjektArtikel, ProjekteUebersicht}.js`, `src/lib/content/projekte.js` |
| Tests | 15/15 grün, E2E 5/5 grün | `tests/unit/r5-content{,-facts}.test.mjs`, `tests/e2e/r5-content.spec.js` |

## (1) check-facts.mjs

- `node tools/content/check-facts.mjs [--out=<ordner>] [--only=messages|ratgeber|produkte] [--strict]`. Das Skript liest nur und schreibt nur den angeforderten Bericht.
- Es erkennt Zahlen, Jahreszahlen, Daten (auch „4. September 2026“), Uhrzeiten (DE/EN am-pm/FR „17h00“), Prozentwerte, Längen (mm/cm/m werden umgerechnet), Gewichte, Euro- und CHF-Beträge, Telefonnummern und Codes (E27, IP20). Gebietsschemata beachtet es (1.200,50 / 1,200.50 / 1 200,50). ICU-Syntax, Platzhalter, URLs und Pfade ignoriert es.
- Quellenliste `facts.json` wird von `build-facts.mjs` erzeugt: 18 Grundfakten aus `facts.core.json`, jede Zeile mit Quelle (Firmenbuch/Hausnummer 11, PLZ, Telefon, Öffnungszeiten, Vernissage 04.09.2026, USt AT/DE, MWST CH/FL, OSS-Schwelle, Wertfreigrenze, Formulargrenzen aus `schemas.js`). Dazu kommen 111 Produktfakten aus `Marktresearch/content/produkte/*.json`, beschränkt auf das jeweilige Produkt. Ignoriert werden nur Normzitate, Normnamen, 404, 3D, 360-Grad, Web 2.0 sowie die Markennamen next125 und 101 Copenhagen, jeweils mit Begründung.
- Status je Angabe: belegt / inline (nur im Ratgeber: die Zeile nennt selbst eine Quelle) / ausgeblendet (`[prüfen]`, interner Teil) / unbelegt.
- **Lauf 26.10.:** 159 unbelegt · 186 inline · 166 ausgeblendet · 734 belegt. Bericht: `qa-screenshots/teamleiter/r5-content/check-facts.md` und `.json`.
  - Messages (je Sprache 3, FR 4): `Home.trust1` „Über 35 internationale Marken“ (kein Beleg, Markenzahl laut Bericht 01 widersprüchlich), `presse.magazines.3` „2022“, `Vernissage.time` 17:00. FR: Rest „1“ im Normzitat `Cookies.thirdCountryNotice` (gehört ohnehin zum Anwalt).
  - Produkttexte: 31 unbelegt (z. B. Toio-Maße, Goodman 30/75/90°, Kirk, Self Plan). Die Fakten fehlen in der Recherche oder sind dort als `[prüfen]` markiert.
  - Ratgeber: 116 unbelegt, 186 mit Inline-Quelle. Diese Zahlen sollen in `facts.core.json` übernommen werden, bevor der Ratgeber freigegeben wird.

## (2) Markenstimme

`docs/content/brand-voice.md`: Kern „Der Gastgeber“, Regeln (Sie/you/vous/**tu**), Verbotsliste in 4 Sprachen (Händler/autorisiert/Partner/Store, Superlative, Rabatt- und Druckwerbung, „abgesicherte Anzahlung“, Erfundenes). Das Glossar übernimmt die EN/FR/IT-Begriffe, die heute schon in den Messages stehen, nichts ist neu übersetzt. Wo es noch keinen Begriff gibt, steht „[offen]“. Jede Regel nennt ihre Quelle (Bibel §, Bericht 12 §).

## (3) Video

- `InlineVideo` ist eine Server-Komponente: natives `<video controls preload="none" playsInline>`, Poster, Pflicht-Untertitelspur, `aspect-ratio` gegen CLS, Name per `aria-label`, Transkript per `<details>`, optional VideoObject-JSON-LD (nur mit Name, Poster und uploadDate). Bei fehlenden Pflichtangaben bricht der Build ab.
- Ohne Autoplay. Nur `ambient` startet einen stummen Loop, und das nur, wenn Bewegung erlaubt ist: kein `prefers-reduced-motion`, kein `data-motion="reduced"`, Tab sichtbar. Pausiert jemand selbst, bleibt das Video pausiert.
- `YouTubeFacade`: eigenes Poster (ytimg wird abgewiesen). ConsentEmbed (`service="youtube"`, importiert) entscheidet über die Einwilligung. Das iframe auf youtube-nocookie lädt erst nach dem Klick auf „Video abspielen“. Die Texte bekommt ConsentEmbed über einen verschachtelten `NextIntlClientProvider`.
- Demo nur unter `/de/projekte/vorlage`: ein neutraler Testclip (Text auf Linen, 26 KB, eigene Route mit Byte-Ranges für Safari), VTT und SVG-Poster.

## (4) Projekte

- `/de/projekte` zeigt einen Leerzustand „Noch keine Projekte veröffentlicht“. `/de/projekte/[slug]` rendert nur freigegebene Einträge, sonst 404. `/de/projekte/vorlage` ist die Formatvorschau aus Bericht 12 C3, nur mit Platzhaltern in eckigen Klammern. Alle drei Seiten sind noindex (die Vorlage auch nofollow), nicht verlinkt und nicht in Sitemap oder llms.txt. EN/FR/IT liefern 404, geprüft.
- `projekte.js`: `PROJEKTE = []`. Das zod-Schema verlangt `freigegeben: true`, reviewedBy/updatedAt, die Einwilligung der Bauherren (Datum, Umfang, Ablage), `ohneAdresse` und einen Ort ohne Straße, Hausnummer oder PLZ. Außerdem `exifEntfernt` für Projekt und jedes Bild, eigene Bilder unter `/projekte/<slug>/` mit Fotograf und Nutzungsrecht, `ki: keine|retusche`, Freigaben für Architekt und Zitat und höchstens 600 Wörter.

## Prüfung

- shoot.mjs: `/de/projekte` und `/de/projekte/vorlage` auf iPhone, Android, iPad und Desktop, Bilder angesehen (`qa-screenshots/teamleiter/r5-R5-content/selbst`, iPad-Vorlage in `selbst-ipad`). Layout sauber, keine Konsolenfehler. Zwei Screenshot-Timeouts kamen vom Kompilieren im Dev-Server und waren beim zweiten Lauf weg.
- axe (wcag2a/aa/21aa/22aa): 0 serious/critical auf beiden Seiten (E2E). eslint auf allen eigenen Dateien: 0. `check:claims`: 0 Verstöße. `build-facts --check`: aktuell.
- Unit-Suite gesamt: 656/659. Die 3 roten Tests gehören zu anderen Paketen (site.js-Zeiten, Upload-Shell, R5-produkt-Ersatzbild, alle in Arbeit).

## Offene Punkte / INT-Anfragen

1. **YouTube vor dem ersten Einsatz:** Banner-Eintrag „youtube“ im Dienste-Register (`src/lib/legal/services.js`, AP2), `frame-src https://www.youtube-nocookie.com` in der CSP (R5-release). ConsentEmbed zeigt im Platzhalter noch das Karten-Symbol. Sinnvoll wären Text- und Icon-Props (R5-shell-seo).
2. `next.config.js` überschreibt die Cache-Header der Demo-Routen (1 Jahr). Für eine Vorschau ist das unkritisch.
3. Messages-Funde an R5-i18n bzw. die Inhaberin: Beleg für „über 35 Marken“ und „Minotti 2022 Collection“, Uhrzeit der Vernissage. Die Ratgeber-Inline-Quellen gehören nach `facts.core.json`.
4. CI-Anbindung von `check-facts.mjs --strict` erst, wenn die Funde abgearbeitet sind (R5-release/INT).
5. Freigaben: Markenstimme (Inhaberin), FR/IT-Gegenlesen, Einwilligungsformular für Projekte (Anwalt).

## Nachbesserung nach Teamleiter-Feedback (26.10.2026, Note vorher 8/10)

| P2 | Status | Änderung |
|---|---|---|
| 1 Video blockiert `load` in WebKit | **behoben** | Neuer Testclip als MP4 (H.264 baseline `avc1.42001f`, 10,6 KB, gleicher Inhalt, mit Edge-MediaRecorder aus einem Canvas erzeugt): `src/app/[locale]/projekte/vorlage/_demo/clip-mp4.js` und Route `demo.mp4/route.js` (nur DE, Byte-Ranges 206, noindex). Die Vorlage bietet jetzt `demo.mp4` als erste Quelle und `demo.webm` als zweite an. WebKit (iPhone und iPad, je 2 Läufe): `readyState complete`, `currentSrc` = demo.mp4, die Wiedergabe läuft. Chromium spielt ebenfalls MP4. |
| 2 Sprachumschaltung → 404 | **offen, INT** | Header und Footer gehören nicht zu diesem Paket. Bei reinen DE-Seiten (Projekte, Ratgeber) sollen EN/FR/IT auf die jeweilige Startseite zeigen oder ausgeblendet werden. |
| 3 check-facts kein Gate | **Teil behoben** | `--strict` ist jetzt das Release-Gate: Exit 1 bei unbelegten Angaben in `src/messages/*.json`. `--strict=all` gilt für alle Quellen. Ein Tippfehler im Modus wirft einen Fehler, damit das Gate nicht stillschweigend ausfällt. Die Funde stehen mit Datei und Zeile auf stderr. Der Lauf endet heute mit **Exit 1** (12 Funde = 3 Lücken × 4 Sprachen). **Offen (INT):** `"check:facts": "node tools/content/check-facts.mjs --strict"` in `package.json`, das nicht zu diesem Paket gehört. **Offen (R5-i18n bzw. Inhaberin):** „Über 35 Marken“ (`Home.trust1`), „Minotti 2022 Collection“ (`presse.magazines.3`) und Vernissage 17:00 (`Vernissage.time`) belegen (`facts.core.json` → `build-facts.mjs`) oder entfernen. |

Außerdem P3.3: VTT und Transkript sagen einheitlich „Text zum Video“.

Prüfung nach dem Fix:
- shoot.mjs `qa-screenshots/teamleiter/r5-R5-content/fix` und `fix-lauf2`: alle 4 Geräte liefern 200, ohne Timeout, ohne Konsolenfehler und ohne Überlauf. Die Bilder sind angesehen, das Video-Poster und die Steuerleiste sind sichtbar.
- Unit `r5-content*.test.mjs` 17/17 (neu: Gate-Logik und Exit-Code).
- E2E `r5-content.spec.js` desktop 5/5 (neu: Reihenfolge der Quellen MP4 → WebM, Byte-Ranges für beide Clips, EN 404).
- eslint auf den Paketdateien: 0.
