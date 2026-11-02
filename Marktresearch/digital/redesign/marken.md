# Paket „Markenseiten“: Übersicht, Markenseite, Kollektion

**Stand:** 26.10.2026 · **Branch:** feature/neuauftritt · **Grundlage:** Design-Bibel §1, §2, §4–§6, §9, §10.2 „Marke“, §11, §14, §17; Jury-Urteil §3 (Text neben dem Bild, Herstellerbilder unbeschnitten auf `linen`, „gezeigt/geplant“ statt „geführt“); Recht/03.

## 1. Änderungen

- **UWG-Sofortmaßnahme:** Die Händlertexte aus dem Backoffice laufen jetzt alle durch eine zentrale Funktion, `resolveShowroomText()` in `src/components/MarkenItems/showroomText.js`. Gilt für das Feld `dealers_title_*` / `dealers_description_*`.
  - **ClassiCon** (`VERIFIED_DEALER_SLUGS`): Der CMS-Text erscheint unverändert.
  - **Alle anderen Marken:**
    - Die Überschrift ist immer „[Marke] in unserer Ausstellung in Lochau“ (EN/FR/IT entsprechend).
    - Aus der Beschreibung werden nur die Sätze ohne Händler-, „offiziell“- oder „autorisiert“-Formulierung übernommen. Erkannt werden diese Formulierungen in DE, EN, FR und IT.
    - Bleibt kein Satz übrig, steht dort ein neutraler Text.
  - Es wird nur der CMS-Text der aktuellen Sprache verwendet. Auf `/en` erscheint also kein deutscher Text mehr.
  - Dieselbe Prüfung (`hasDealerClaim`) schützt die Meta-Description und die `description` im JSON-LD der Markenseite.
- **Markenseite** `/ueber-uns/marken/[title]`, jetzt eine Server Component. `react-slick` und `slick-carousel` werden hier nicht mehr geladen. Aufbau:
  - Hero mit Text neben dem Bild: Breadcrumb, Overline „Land · seit Jahr“, H1, Lead, 1 Primärknopf „Termin wählen“ und sekundär „Stücke ansehen“. Das Herstellerbild steht unbeschnitten auf `linen`, mit `preload` und Bildnachweis.
  - Faktenzeile als `<dl>`: Herkunft, Gründung, Gründer, Stücke im Katalog, Anzahl Kategorien.
  - „Über [Marke]“ mit dem Zitat zum Design-Ansatz.
  - Produktliste nach Kategorie:
    - Navigation über alle Kategorien mit Anzahl, Links zum Katalog mit Filter `?marke=`.
    - 4 Kapitel mit je 3 Produktkarten, das Wohnen zuerst.
    - Nach 6 Karten folgt ein Raumbild über die volle Breite.
  - Kollektionen und Handwerk, beides aus dem CMS.
  - Abschnitt „Im Showroom“:
    - Überschrift und Text nach der neutralen Formel.
    - Showroom-Stücke aus `SHOWROOM_PIECES`. Solange dort nichts gepflegt ist, steht ein Platzhalter „Foto folgt“.
    - Ansprechperson als Platzhalter (Monogramm, „Beratungsteam Platzhirsch“, „Porträt folgt“) mit Adresse, Telefon und E-Mail.
  - Abschluss-CTA mit „Nehmen Sie Platz.“ und ein rechtlicher Hinweis „zeigt und plant mit Produkten von …“.
- **Markenübersicht** `/ueber-uns/marken`:
  - Typografischer Index A–Z: Name in Bodoni ab 32 px, dazu Land und Gründungsjahr, kein Logo (Bibel §9, card-brand).
  - Neue Texte ohne „exklusiv“, „führen“ und „Luxus“.
  - Das JSON-LD hat jetzt zusätzlich eine `ItemList` mit allen Markenseiten.
  - Die Fallback-Titel und -Descriptions enthalten kein „Exklusiv“ mehr.
- **Kollektionsseite** (`collectionDetail.js`): neu gestaltet als Server Component. Das verschachtelte `<main>` ist entfernt. Weil die Seite bisher gar kein JSON-LD hatte, gibt sie jetzt eine BreadcrumbList aus.
- **SEO:** URLs, Canonical, hreflang, `BRAND_TITLE_OVERRIDES` (ohne Händler-Claim), AboutPage- und Brand-JSON-LD und `revalidate` bleiben erhalten. Alle Inhalte stehen im HTML. Es gibt keine dunkle Fläche, keinen Radius und kein Messing auf Hell.

## 2. Dateien

- `src/components/MarkenItems/showroomText.js` (neu): die UWG-Logik. Das Modul ist rein und mit Node testbar.
- `src/components/MarkenItems/brandData.js` (neu): Hilfsfunktionen für CMS-Felder, Ländernamen per `Intl`, Kapitel je Kategorie und `SHOWROOM_PIECES`.
- `src/components/MarkenItems/copy.js` (neu): Fallback-Texte und `makeTr()`.
- `src/components/MarkenItems/markenitems.js` und `collectionDetail.js`: neu geschrieben.
- `src/components/MarkenClient/Marken.js`: neu geschrieben.
- `src/app/[locale]/ueber-uns/marken/page.js` und `[title]/page.js` (`[collection]/page.js` ist unverändert).
- `Marktresearch/digital/redesign/messages-marken.json`: neue Schlüssel `marken.*` und den neuen Namespace `markenIndex` in DE/EN/FR/IT. Der Wortlaut ist identisch mit `copy.js`.
- Prüfbilder: `qa-screenshots/neuauftritt/marken/selbsttest/`.

## 3. Test-Beispiele `resolveShowroomText` / `hasDealerClaim`

Geprüft mit Node gegen die Live-Daten aller 36 Marken. Ergebnis: Außer bei ClassiCon steht in keiner ausgegebenen Überschrift und keinem ausgegebenen Text eine Händler-Formulierung.

| Eingabe | Ergebnis |
|---|---|
| Minotti, DE: „Platzhirsch Studio ist Ihr offizieller Minotti Händler in Vorarlberg. In unserer Ausstellung in Lochau erleben Sie …“ | Überschrift „Minotti in unserer Ausstellung in Lochau“, Text: nur der zweite Satz, `source: "filtered"`, der erste Satz steht in `removed` |
| Minotti, EN (CMS leer) | „Minotti in our showroom in Lochau“ und neutraler Text, `source: "neutral"` |
| ClassiCon, DE | CMS-Text unverändert („… Ihr offizieller ClassiCon Händler …“), `source: "cms"` |
| Flos, IT: „Siamo il rivenditore autorizzato Flos. Vi aspettiamo a Lochau.“ | „Flos nella nostra esposizione a Lochau“ / „Vi aspettiamo a Lochau.“ |
| `hasDealerClaim("Your authorised dealer for Flos.")`, `("Revendeur officiel Poliform.")`, `("Rivenditore autorizzato Minotti.")` | jeweils `true` |
| `hasDealerClaim("In unserer Ausstellung in Lochau sehen Sie Sofas.")` | `false` |

Statistik DE: 35 gefiltert, 1 CMS (ClassiCon). EN: 36 neutral, weil das CMS dort leer ist.

## 4. Prüfung

- `/de/ueber-uns/marken`, `/de/…/minotti`, `/de/…/classicon`, `/en/about-us/brands/classicon` und `/de/…/alonpi/alonpi-heritage` liefern 200.
  - Jede Seite hat genau 1 H1 und 0 `data-surface="inverse"`.
  - Canonical und hreflang sind geprüft (FR Minotti).
- Bei 375 px liegt im `main` kein Überlauf vor. Der Überlauf, den die Seite insgesamt zeigt (`scrollWidth` 389), kommt aus dem **Header** (Sprach-Button). Er tritt genauso auf `/de/kontakt` auf, also im Paket Header und nicht hier.
- `shoot.mjs`: Die Desktop-Läufe sind gültig. Die Läufe auf iPhone, Android und iPad brachen mit Status 500 ab. Ursache waren Build-Fehler fremder Pakete: `src/app/fehlerseite-global.preview/probe/page.js` und `produkte/[category]/[product]/page.js` mitten in der Bearbeitung. Ersatzweise liegen Chromium-Aufnahmen mit 375 px bei (`*--375-*.png`).
- ESLint für die eigenen Dateien: 0 Meldungen.

## 5. Offene Punkte

1. `messages-marken.json` übernehmen (Paket „Recht & Texte“). Danach können `copy.js` (`COPY`) und `NEUTRAL_TEXT` schrumpfen, und `MarkenSection.paragraphs` wird nicht mehr verwendet.
2. **CMS-Texte redaktionell überarbeiten.** Folgende Formulierungen widersprechen der Bibel-Stimme oder der Superlativ-Regel:
   - `produkte` (Intro): „luxuriös“, „feinste“.
   - `beschreibung`: „führende Marke“ bei Solpuri, Tuuci, Next125, EMU und Frost.
   - `metadata_description`: „exklusiv“ bei Poliform, ClassiCon, Brand van Egmond und Alonpi.
   - `dealers_*` im Backoffice bereinigen. Der Filter ist nur ein Sicherheitsnetz.
3. Die Ausstellungsliste fehlt (Jury, offener Punkt 6). `SHOWROOM_PIECES` in `brandData.js` mit echten `path_field` befüllen. Erst dann erscheinen die Karten mit dem Badge „Im Showroom Lochau“.
4. Die Ansprechperson je Marke ist noch ein Platzhalter. Benötigt werden Name, Porträt 1:1 und Einwilligung.
5. Bildfreigaben der Hersteller und das Bildregister (Bibel §7). Bis dahin stehen die Herstellerbilder unbeschnitten und mit Bildnachweis.
6. `displayBrandName` (`src/lib/content/brands.js`, fremd): „Antoniolupi“ sollte „antoniolupi“ geschrieben werden.
7. Morph Markenindex → H1 (Bibel §8.3, `<ViewTransition>`) ist noch nicht umgesetzt. Dafür braucht es eine Entscheidung zu View Transitions im ganzen Projekt.

## 6. Benötigte Bilder

Je Marke:

- 1 eigenes Raumfoto aus Lochau, 3:2, als Hero-Ersatz für das Herstellerbild.
- 2–3 Fotos von Ausstellungsstücken, 4:5, mit einem Bild, auf dem ein Mensch die Größe zeigt.
- 1 Porträt der Ansprechperson, 1:1.

Vorrang haben die Vignetten aus der Shotliste Tag 1: Minotti, Poliform, Rimadesio, Flos, ClassiCon und Küche.

---

## 7. Runde 2: Umsetzung QA-Feedback (`qa-screenshots/neuauftritt/marken/feedback.md`)

### P1
- **P1-1 Deutsch auf EN/FR/IT:** `localized(obj, key, locale, { fallback })` liefert Prosa nur noch in der Seitensprache (Standard `fallback: false`). Fehlende Blöcke entfallen: Zitat, Handwerk (`localizedCraft`, nur Einträge mit Titel und Text in der Sprache), Story. Gründer per `formatFounders()` mit `Intl.ListFormat` (kein „und“ auf /it). Meta-Description (`brandMetaText`) und JSON-LD-`description` (`brandSchemaText`) nur aus der aktuellen Sprache, sonst neutraler Satz bzw. Feld entfällt. curl-Nachweis: `/en/…/minotti`, `/en/…/classicon`, `/fr/…/minotti`, `/it/…/poliform`, `/it/…/rimadesio` ohne deutschen Fließtext im `<main>` (einziger Treffer: Eigenname „Vereinigte Werkstätten München“ als Gründer).
- **P1-2 Platzhalter:** „Foto folgt“, Monogramm und „Porträt folgt“ werden nur noch gerendert, wenn `NODE_ENV !== "production"` **und** `PH_SHOW_PLACEHOLDERS=1` (Styleguide). Sonst: Linkzeile „Ausstellungsstücke anfragen →“ (`mailto:` mit Betreff) und Ansprechperson nur als Text.

### P2
- **P2-1/P2-2 Bilder:** neues `imageSize.js` liest Breite/Höhe aus dem Dateikopf (JPEG/PNG/WebP/GIF, Abbruch nach dem Header, kein npm-Paket, kein `no-store` → ISR bleibt). `brandImageSet()` wählt Hero (erstes Querformat ≥ 1,2:1), Storybild (nur 0,78–1,02) und Raumbild (nur ≥ 1600 px breit und ≥ 16:9). `BrandFigure` (lokal in `markenitems.js`) nimmt das echte Seitenverhältnis, Mindestformat 4:5, max. 80 svh hoch. Gemessen: Linen-Anteil 0–1 %. Ohne Storybild läuft der Text 7 Spalten breit.
- **P2-3 Kategorien:** `sm:gap-x-grid`, eigene Haarlinie je Spalte, Zahl „(62)“ direkt am Namen, ab xl 3-spaltig, 6 sichtbar, Rest in `<details>` „Alle 18 Kategorien“.
- **P2-4 Länge mobil:** Produktkapitel als native Scroll-Snap-Reihe (66 %-Karten, nächste Karte angeschnitten, kein JS), auf Phones 2 von 4 Kapiteln (Rest per CSS ausgeblendet, bleibt im HTML und über die Kategorieliste erreichbar), Story 2 Absätze + `<details>` „Weiterlesen“, kompaktere Abstände, Kategorie-Fakt und Katalog-Lead nur ab sm/md. **Minotti 393 px: 8.989 px** (vorher 17.450), davon Footer 3.413 px (fremdes Paket). EN Minotti 7.056 px, ClassiCon DE 10.142 px (Storybild + 4 Handwerk-Einträge).
- **P2-5 Stimme:** `hasVoiceViolation()` + `cleanProse()` in `showroomText.js` (luxus/luxur/lusso/luxe, exklusiv/exclusi/esclusiv, höchste/feinste/größte/beste, führend/leading/leader, frz./ital. Superlative). Wirkt auf Hero-Lead, Story, Zitat, Handwerk, Showroom-Text, Meta, JSON-LD. Fällt der erste Satz eines Leads weg, gilt der neutrale Satz („Minotti aus Italien, gegründet 1948. Wir beraten Sie zu Minotti in Lochau am Bodensee.“). Index: eigene Titel/Description vor CMS. „Platzhirsch Studio“ in CMS-Texten → „Platzhirsch Home Living“ (P3-6).
- **P2-6 Doppelsatz:** `showroomNeutralText` endet in allen 4 Sprachen nach dem ersten Satz (copy.js, `NEUTRAL_TEXT`, messages-marken.json).
- **P2-7 Alt-Texte:** CMS-`alt_text`, sonst „{Marke} – Raumansicht“ / „– Wohnszene“; Nachweis nur in `figcaption`.

### P3
- Erledigt: P3-2 (`text-balance`, gleiche Zeilenhöhe), P3-4 (`mt-stack-m` im Showroom), P3-5 (CMS-Zwischenüberschrift verworfen), P3-6 (Name), P3-7 (Kollektion: „Region – Bedwear“), P3-8 (`ItemList` A–Z), P3-9 (Overline „Stücke“).
- Offen: P3-1 (eigenes Showroom-Foto für Index), P3-3 („antoniolupi“, `displayBrandName` fremd → Paket Content), P3-10 (shoot.mjs, s. u.), P3-11 (Morph/ViewTransition).

### Neue Texte (messages-marken.json neu erzeugt, 51 + 13 Schlüssel je Sprache)
`altHero`, `altScene`, `readMore`, `categoriesAll`, `piecesAsk`, `piecesAskSubject`, `factFounders`, `introOriginYear`, `introOrigin`, `introYear`, `introShowroom`, `chapterLabel`; geändert: `catalogEyebrow`, `showroomNeutralText`.

### Prüfung Runde 2
- ESLint eigene Dateien: 0 Meldungen. SEO per curl: Canonical, hreflang, Titel-Overrides, 1 `<main>`, 1 H1 unverändert.
- `shoot.mjs` → `qa-screenshots/neuauftritt/marken/fix/`: 1. Lauf alle 12 Aufnahmen 200; 2. Lauf (nach letzten Änderungen) iPhone/Android teils 500, weil der Dev-Server zu der Zeit global 500 lieferte (auch Seiten außerhalb des Pakets) – Desktop/iPad 200. Konsolenmeldungen sind Dev-Interna („Router action dispatched before initialization“, Hydration-Attribut im Header/Cookie-Banner), nicht aus Server-Komponenten dieses Pakets. Abschnittsbilder `minotti--{iphone,desktop}--brand-*.png`.

### Offen / Übergabe
- Organisation-JSON-LD im Layout (fremd) enthält „exklusive Designmöbel … führend“ → Paket Fundament/SEO.
- Produktnamen wie `Linha "Dining"` (gemeinsame `cleanProductName`, fremd).
- Bildregister (§7.1): eingebranntes Copyright (z. B. `minotti-dylan-sofa-1200x750.jpg`) markieren. Kein Markenbild ist ≥ 1600 px breit → Vollbreiten-Raumbild entfällt derzeit überall.
- Shotliste: **ohne Storybild** (kein 4:5–1:1-Motiv): Livintwist, Tuuci, Bullfrog, Bombyxx, EMU, Trapa, Pomax, Frost, Lambert, Heatsail, Sifas, Papadatos, Treca, Brand van Egmond, Qeeboo, Minotti, Paola Lenti, Tonon, Gloster, Alonpi, Schueller, Antoniolupi, Agape. **Hero nur Hochformat:** Desalto, Tom Dixon, Treca, Qeeboo, Eichholtz, Alonpi. Benötigt je Marke: 1 Raumbild ≥ 2400 px, 16:9 oder 3:2; 1 Motiv 4:5.
- Pfeile/Zähler „1 / 3“ für die mobile Reihe (§9 Gallery) bräuchten eine Client-Insel – bewusst weggelassen.

---

## 8. Runde 3 (R3-marken-seo, 26.10.2026)

- **Filter zentral:** Händler-, Stimm- und Liefersatz-Filter liegen jetzt in `src/lib/legal/manufacturerText.js` (`cleanProse`, `leadProse`, `cleanCraftEntries`, `resolveShowroomText`, neu `sanitizeManufacturerText`, `hasDeliveryClaim`, `auditManufacturerText`). Belegte Händler kommen aus `claims.js` (nur ClassiCon). `showroomText.js` ist nur noch ein Re-Export. Superlative erkennt der Filter jetzt zusätzlich über den Claim-Guard (z. B. „einzigartig“, „unique“, „Nr. 1“).
- **Marke × Kategorie angeschlossen:** `[title]/[collection]` löst Collection → Kategorie → eindeutiges Kurz-Alias (308, z. B. `minotti/sofas` → `minotti/sofas-couches`) → 404 auf. Die Kategorieliste der Markenseite verlinkt indexierbare Kombinationen auf diese Seiten, die übrigen auf den gefilterten Katalog.
- **Restliste:** (1) Story ohne Bild: Text bündig auf Spalten 1–7, Zitat rechts (Spalten 9–12), Abstand `md:py-16`. (2) Index: Namen über 14 Zeichen ab `sm` 32 px, „Brand van Egmond“ einzeilig. (3) Marke × Kategorie: Hero-Bild im eigenen Seitenverhältnis (geklemmt 4:5 bis 16:9) auf `linen`, erstes Querformat unter den ersten 4 Bildern, keine Graubalken.
- Bericht: `Marktresearch/digital/teamleiter/r3-R3-marken-seo.md`.

## 9. Runde 4 (R4-seo, 26.10.2026)

- **`indexableBrandCategoryHref(categories, brand, category, locale)`** (rein, `src/lib/marken/brandCategory.js`) und **`getIndexableBrandCategoryHref(brandName, categoryKey, locale)`** (Server, `brandCategoryLoader.js`) für die Brotkrume der Produktseite (R4-produkt). Sie liefern den Pfad nur, wenn die Kombination indexierbar ist, sonst `null`. Dann verlinkt die Brotkrume die Markenseite. `brandCategoryHref(brand, category, locale)` bleibt unverändert exportiert.
- **Organization-JSON-LD:** Die Markenliste läuft über den Händler-Filter. Als `brand` steht nur ClassiCon, alle anderen 16 Showroom-Marken stehen neutral unter `knowsAbout` (`src/lib/seo/siteSchema.js`). Das Layout (R4-shell-perf) muss nur noch auf `siteSchema()` umstellen. Damit ist auch Restpunkt 10 („exklusiv“ im Layout-JSON-LD) erledigt, denn der Text dort enthält das Wort schon nicht mehr.
- **Restliste ohne Backoffice:** Graubalken und Bildreste habe ich auf Index, Minotti und Minotti × Sofas auf 4 Geräten geprüft (`qa-screenshots/teamleiter/r4-R4-seo/selbst/`). Offen bleiben die CMS-Texte (Punkt 5: „Minotti live“, „perfekte Proportionen“ stehen in `beschreibung`/`metadata_description` im Backoffice), Fynn und Bézier (Kategoriezuordnung), Produktbilder und Storybilder (Bildregister/Shotliste).
- Bericht: `Marktresearch/digital/teamleiter/r4-R4-seo.md`.

## Stand Runde 5 (R5-shell-seo, 26.10.2026)

- Das Layout nutzt jetzt `siteSchema()`. Live steht auf jeder Seite nur noch **ein** `brand` (ClassiCon), die übrigen 16 Marken stehen unter `knowsAbout`. Die Liste mit 17 `brand` ist weg.
- Brotkrumen auf Marken-Index, Marke, Marke × Kategorie und Kollektion heißen auf Deutsch „Startseite“, sowohl sichtbar als auch im JSON-LD. `og:locale` ist auf den Markenseiten einheitlich (de_AT/en_GB/fr_FR/it_IT, der CMS-Wert „en_EN“ wird nicht mehr genutzt).
- Für Runde 6 (R5-i18n): `marken.breadcrumbHome`, `brandCategory.breadcrumbHome` und `landing.home` auf DE „Startseite“ setzen (`messages-r5-shell.json`). Bis dahin gleicht `ui/Breadcrumbs` den Wert an.
