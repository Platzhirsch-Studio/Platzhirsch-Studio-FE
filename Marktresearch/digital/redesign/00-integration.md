# Integration Neuauftritt – Gesamtstand

**Stand:** 26.10.2026 · Branch `feature/neuauftritt` (nicht committet) · Integrator

## 1. Gesamtstand

Alle sieben Bereichs-Pakete sind mit Auflagen abgenommen (Noten 8 bis 8,5 von 10). Die Integration hat die Texte zusammengeführt, die kleinen Auflagen aus den Abnahmen umgesetzt, einen Produktions-Build gemacht und eine Gesamt-QA durchgeführt. **Technisch ist die Seite bereit für den Livegang.** Offen sind Freigaben (Inhaber, Anwalt), Fotos und Backoffice-Texte (siehe §6).

## 2. Texte (src/messages)

Zusammengeführt in `src/messages/{de,en,fr,it}.json` (Reihenfolge: fundament, header-footer, startseite, katalog, marken, landing, inhaltsseiten). Das Skript macht ein Deep-Merge, bestehende Schlüssel bleiben erhalten. Format bleibt gleich (2 Leerzeichen, CRLF), alle vier Dateien sind gültiges JSON.

| Vorschlag | Ergebnis |
|---|---|
| `messages-fundament.json` | `ui.*` neu |
| `messages-header-footer.json` | `Shell.*` neu |
| `messages-startseite.json` | `HomePage.*` neu |
| `messages-katalog.json` | `shop.catalog`, `shop.atelier`, `cart.selection` neu (`_hinweis` nicht übernommen) |
| `messages-marken.json` | 52 neue Schlüssel je Sprache unter `marken.*` |
| `messages-landing.json` | `landing.*` neu |
| `messages-inhaltsseiten.json` | `inhalt.*` neu, `error404.*` ergänzt |

**Konflikte:** nur `error404.headline`, `backHome`, `browseBrands` und `contact`, in allen 4 Sprachen. Der Vorschlag hat gewonnen, weil das Paket Inhaltsseiten die 404 neu gestaltet hat: keine Versalien mehr, zum Beispiel „Seite nicht gefunden.“ → „Diese Seite gibt es hier nicht.“, „ZURÜCK ZUR STARTSEITE“ → „Zur Startseite“. Beide Fassungen sind rechtlich unkritisch.

**Bei der Integration geändert** (Übergabeliste Recht & Texte §1c, UWG L2 „Montage auf Wunsch“), in allen 4 Sprachen:
- `HomePage.host.items.finish.text` → „Die Bestellung begleiten wir bis zum Schluss, auf Wunsch auch Lieferung und Montage.“
- `HomePage.region.countries.at.text` → „Beratung und Planung in Vorarlberg und ganz Österreich, auf Wunsch mit Lieferung und Montage.“

Die Prüfwörter (exklusiv, Luxus, Traum, beste, führend, perfekt, offiziell, Händler) kommen in den Vorschlägen nicht vor. „nicht Händler“ steht weder in den Vorschlägen noch im Live-HTML von `/de/ueber-uns/platzhirsch` (geprüft).

**Rohschlüssel:** 21 Pfade × 4 Sprachen per Skript geprüft (sichtbarer Text und alt/aria/title/meta). Ein Fehler wurde gefunden und behoben: `/news` zeigte `inhalt.news.shownOf`, weil eine ICU-Vorlage ohne Werte formatiert wurde. Lösung in `src/components/UberUns/inhalt/useInhalt.js`: Eine Vorlage mit `{…}`, die ohne Werte aufgerufen wird, wird roh übergeben, wie es der Fallback auch tut. Danach gibt es keine Rohschlüssel mehr. Die `t.has`/Fallback-Zweige bleiben vorerst drin, zum Beispiel `UberUns/inhalt/fallback.js` und `Home/copy.js`. Sie sind jetzt toter Code und können in einer Aufräumrunde gelöscht werden.

**Nicht gemacht:** Verwaiste Schlüssel (Recht §1c Punkt 3) habe ich nicht gelöscht. Prototypen unter `preview/**` (tabu) und dynamische Leser lesen sie eventuell noch. Das ist eine eigene Aufräumrunde, nach dem Rückbau der Previews.

## 3. Weitere Fixes aus den Abnahmen (im echten Repo)

| Auflage | Datei | Änderung |
|---|---|---|
| Header P2-5 | `src/app/globals.css` | `scroll-padding-top` 88 px (5.5rem) auf allen Breiten statt 192 px auf dem Desktop |
| Landing P1-5 Bodoni bricht in Chrome auf | `src/app/globals.css` | `font-variation-settings: "opsz" 36` für `font-display` mit `text-display-l/m` (nicht für Hero-xl). Im Chrome-Desktop-Shot geprüft: Haarstriche sauber |
| Startseite A2 „Woh-nen“ | `src/components/Home/Hero.js` | `hyphens-auto` → `hyphens-manual` |
| Katalog A1 (Recht) | `src/app/[locale]/produkte/[category]/[product]/page.js` | „Hinter dem Stück“ läuft jetzt durch `cleanProse` (Händler- und Stimm-Filter aus `MarkenItems/showroomText.js`, ClassiCon ausgenommen) und zusätzlich durch einen Filter für Verfügbarkeits- und Liefersätze („Erhältlich bei…“, „Lieferung in ganz Österreich“, 4 Sprachen). `buildFallbackDescription` ist in 4 Sprachen neu: Beratung in Lochau, „Lieferung und Montage auf Wunsch“. Auf 3 Produktseiten geprüft: sauber |
| Landing P1-3 Küchen-Copy | `src/app/[locale]/kuechen-vorarlberg/page.js` | Title/H1 „Exklusive Küchen“ → „Designerküchen in Vorarlberg“. „Premium-Marken … im Showroom erleben“ → „… im Termin vergleichen“. FAQ „führen Sie / arbeiten wir mit“ → „planen wir unter anderem mit“. „perfekt“ und „führender Designmarken“ sind raus, Montage „auf Wunsch“. **URL, Canonical und JSON-LD bleiben unverändert** |
| Recht (Metas) | `src/app/[locale]/page.js` | Fallback-Meta ohne „Exklusive/Exclusive/exclusif/esclusivi“ |
| Recht (JSON-LD) | `src/app/[locale]/layout.js` | LocalBusiness-`description` ohne „exklusive“ und „führender Marken“ |
| Recht (Impressum) | `src/components/Impressum/impressum.js` | „Wohnträume“, „einzigartige“ und „so besonders macht!“ ersetzt bzw. gestrichen. Pflichtangaben unverändert |
| Voice | `src/app/[locale]/interior-design-vorarlberg/page.js` | „führender Designmarken“ → „internationaler Designmarken“ |

ESLint für alle geänderten Dateien: sauber.

## 4. Tabu-Dateien (nur gelesen)

`git status` zeigt Änderungen in `AnfrageFormProduct`, `BeratungClient`, `Kontakt/*`, `app/api/*` sowie neue Dateien unter `labs/portal/upload/preview` und `api/labs|portal`. Keine Paket-Doku unter `redesign/*.md` nennt diese Pfade als geändert. Die Änderungszeiten liegen bei den Formularen um 07:45–07:52 (Feature-Teams), bei der API um 06:06. Die Integration hat dort nichts geändert. Diese Änderungen gehören den Feature-Teams und müssen von ihnen selbst abgenommen werden.

## 5. Lint, Build, QA, Performance

**Lint gesamt (`npx eslint src`):** 3 Fehler und 1 Warnung, alle **vorbestehend und nicht vom Redesign**. Die betroffenen Dateien sind gegenüber HEAD unverändert:
- `react-hooks/set-state-in-effect` in `src/components/Cookies/cookiecomponent.js` (2×, Zeilen 220 und 254)
- dieselbe Regel in `src/context/CartContext.js` (1×, Zeile 22)

Nicht behoben, weil Consent/Cart einem anderen Paket gehören. Empfehlung: Lazy-Init bzw. `useSyncExternalStore`.

**Produktions-Build:** Kopie unter `C:/Users/admin.local/Documents/platzhirsch-build-check` (robocopy ohne node_modules/.next/.data/qa-screenshots/Herstellermaterial/.git, node_modules per Junction), Build mit `SERVER=https://backoffice.platzhirsch.studio`.
- 1. Lauf: Turbopack-Panic „Symlink node_modules points out of the filesystem root“. Das ist ein Problem der Junction, nicht des Codes. Lösung **nur in der Kopie**: `turbopack.root` auf den Elternordner gesetzt.
- 2. Lauf (mit allen Fixes aus §3 außer dem opsz-CSS): **Build erfolgreich, Exit 0, 7 753 statische Seiten, keine Fehler und keine Warnungen.** Die einzige Ausgabe ist der Hinweis `[upload] Lokaler Upload-Speicher im Produktivbetrieb` (Upload-Team: vor dem Livegang auf einen echten Speicher umstellen).

**LCP (Produktions-Server in der Kopie, `next start -p 3100`, danach beendet):**

| Seite | Mobil (Pixel 7, 4× CPU, ~1,6 Mbit/s, 150 ms) | Desktop (10 Mbit/s) |
|---|---|---|
| /de | 2,33 s (warm), 6,7 s beim ersten Bildaufruf (Bildoptimierer kalt) | 0,78 s |
| /de/produkte | 1,60 s | 0,44 s |
| /de/ueber-uns/marken/minotti | 2,28 s (warm) | 0,56 s |
| /de/kuechen-vorarlberg | 2,09 s | 0,77 s |
| /de/designermoebel-liechtenstein | 2,38 s | 0,81 s |
| /en | 2,28 s | 0,45 s |

Desktop liegt im Budget. Mobil liegt unter strenger Drosselung 0,1–0,4 s über dem Budget von 2,0 s. Das LCP-Element ist jeweils das Hero-Bild in Breite 1200. Empfehlung: Hero-`sizes` bzw. Qualität für Mobil prüfen und den Bild-Cache nach dem Deploy vorwärmen. Startseiten-Abnahme **A1**: Die Breite 750 lädt im Produktions-Build in 0,78 s. Der Hänger kam nur vom Dev-Server. Liechtenstein: im Produktions-Build keine Konsolenfehler.

**Gesamt-QA (`tools/qa/shoot.mjs`, 7 URLs × 4 Geräte):** `qa-screenshots/neuauftritt/gesamt/`. 28/28 liefern 200, kein Querscroll. Konsole:
- Android `/de/kontakt`: Fehlergrenze durch einen HMR-Modulfehler aus `src/components/Upload/UploadHandoff.js` (tslib). Das kam vom Dev-Server, während das Upload-Team arbeitete. Beim zweiten Lauf (`gesamt/recheck/`) liefen Android, iPad und Desktop fehlerfrei. Auf dem iPhone gab es 21 Timeouts, weil der Dev-Server unter Last stand.
- iPad `/de`: einmal „state update on a component that hasn't mounted yet“ (nicht reproduzierbar).

Visuell sind Header, Hero DE/IT, Küchen-H1 (nach dem opsz-Fix) und Footer sauber. Der Cookie-Banner hat weiter Radien und Navy-Knöpfe und verdeckt mobil den unteren Teil des ersten Bildschirms.

## 6. Offen vor dem Livegang

**Recht / Inhaber**
- [anwaltlich prüfen] Gesamttexte nach UWG-Audit (`Marktresearch/recht/03-uwg-werbe-audit.md`). Insbesondere: Startseiten-H1 „Italienisches Wohnen am Bodensee.“ (Bibel-Leitzeile, Audit M1) gegen „viele davon aus Italien“. Die H1 bleibt bis zur Entscheidung, ebenso `designermoebel-kempten` „Italienisches Wohnen …“.
- Inhaber: Markenliste bzw. „über 35 Marken“ (`Home.trust1` „Premium-Marken“ ist nicht live, aber noch in den messages), welche Marken ausgestellt sind, Liefergebiet DE/CH/FL, Montage „auf Wunsch“, Leistungsversprechen im Katalog (A2), TrustBlock- und Liechtenstein-Steuertexte, Küchenmarken (Poliform/next125 vs. „next125 und Schüller“ im Teaser von `landingPages.js`).
- Team: drei Porträts, Rollen (Wegscheider „Geschäftsführung“), Initialen SM/MW.

**Backoffice/CMS**
- `dealers_description_*` aller Marken außer ClassiCon. News mit „Luxus/exklusiv/einzigartig/größte“. Metas mit „nachhaltig“ und „exklusiv“. Schreibweise „Antoniolupi“. Kategorie von „Fynn“. Produktbilder.

**Fotos**
- Herstellerbilder ohne Freigabe (Landing-Heros, Marken, Küche). Eigene Aufnahmen: Showroom/Café, Team, Minotti-Story, Teambild (Platzhalter), 404-Vignette, getrennte Kopfbilder für News und Beratung. Listen in den Paket-Dokus (`startseite.md`, `marken.md`, `landingpages.md`, `inhaltsseiten.md`).

**Andere Pakete / Technik**
- Cookie-Banner (`src/components/Cookies/cookiecomponent.js`): Radien, Navy, verdeckt Hero-Knöpfe. Dazu die zwei Lint-Fehler dort und in `CartContext.js`.
- Startseite A3: Seitenhöhe mobil 17 019 px (Ziel < 13 000).
- Restlisten der Abnahmen: Umbrüche im Mega-Menü und Footer, Fokus im Mobilmenü belegen, Minotti-Story ohne Bild, „Brand van Egmond“-Umbruch, Zoom-Knopf im Bühnenbild, doppeltes Raumbild im Katalog, Hero-Foto bei Yacht/Outdoor, `/de/produkte/sofas` 404 (bekannt).
- Italienische Anrede uneinheitlich: Startseite und Teile mit „Lei“, Formulare mit „tu“ (Festlegung Recht: „tu“). Vor dem Livegang vereinheitlichen.
- Upload: lokalen Speicher im Produktivbetrieb ersetzen (Build-Hinweis).
- Aufräumen: Fallback-Dateien (`UberUns/inhalt/fallback.js`, `Home/copy.js` usw.) und verwaiste messages-Schlüssel nach dem Rückbau der Previews.

**Security-Update Next.js**
- Installiert ist **16.3.4**. Auf npm gibt es im 16.3.x-Zweig **16.3.8** (30.09.2026) und im 16.x-Zweig **16.4.3** (23.10.2026). Empfehlung: Vor dem Livegang mindestens auf **16.3.8** (nur Patches, kleines Risiko), besser auf 16.4.3 nach Lektüre der Release-Notes bzw. Advisories. Danach Build und QA wiederholen. Nicht installiert (keine npm-Installationen in diesem Lauf).

## 7. Dateien der Integration

- `src/messages/de.json`, `en.json`, `fr.json`, `it.json`
- `src/components/UberUns/inhalt/useInhalt.js`
- `src/app/globals.css`, `src/components/Home/Hero.js`
- `src/app/[locale]/produkte/[category]/[product]/page.js`
- `src/app/[locale]/kuechen-vorarlberg/page.js`, `src/app/[locale]/interior-design-vorarlberg/page.js`
- `src/app/[locale]/page.js`, `src/app/[locale]/layout.js`, `src/components/Impressum/impressum.js`
- QA: `qa-screenshots/neuauftritt/gesamt/` (inkl. `recheck/`)
- Build-Kopie: `C:/Users/admin.local/Documents/platzhirsch-build-check` (kann gelöscht werden; die Junction `node_modules` vorher mit `rmdir` entfernen, **nicht** rekursiv löschen)
