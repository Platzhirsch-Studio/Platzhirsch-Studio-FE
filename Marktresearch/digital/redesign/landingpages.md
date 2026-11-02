# Paket „Landing- und Regionsseiten“

**Stand:** 26.10.2026 · **Branch:** feature/neuauftritt · **Grundlage:** Design-Bibel §1, §4–§11, §14, §16 (W12, W15, W16), §17; Jury-Urteil §3 (Gerüst Dreiländereck, Look Galerie, Schluss Bühne); Fundament (`fundament.md`).

## 1. Dateien

| Datei | Änderung |
|---|---|
| `src/components/Landing/parts.js` (neu) | Gemeinsame Server-Bausteine: `LandingHero`, `SectionHead`, `CheckList`, `ShowroomFacts`, `FaqSection`, `LandingGallery`, `BrandGroups`, `FactList`, `LandingClosing`, `useLandingCopy`, `isSwiss` |
| `src/components/Landing/landingPage.js` | Template neu auf `@/components/ui`. `landingMetadata` und `landingSchema` **unverändert** |
| `src/components/Landing/Yacht/YachtLanding.js` | Neu auf Tokens. Eigene Palette (Nacht, Teak, Segeltuch, Wellen, Ripples) entfernt. JSON-LD unverändert |
| `src/components/Landing/Outdoor/OutdoorLanding.js` | Neu auf Tokens. Eigene Palette (Moos, Blatt, Dämmerung, Wasser, Konturlinien) entfernt. JSON-LD unverändert |
| `Marktresearch/digital/redesign/messages-landing.json` (neu) | Namespace `landing` (DE/EN/FR/IT) für die Template-Texte |

Die `page.js`-Dateien (19 Seiten) sind nicht angefasst. Sie liefern weiter ihre `CONTENT`-Objekte.

## 2. Was sich ändert

- **Hero hell statt Foto mit Text darauf:** Brotkrumen, Overline, H1 (Bodoni `display-l`), optional Lead, genau ein Primärknopf „Termin wählen“ (W16; Yacht/Outdoor behalten ihr Label aus `cta.primaryLabel`), Telefon als ruhiger Link und eine Faktenzeile (Öffnungszeiten, Adresse). Das Foto steht still darunter: 3:2 mobil/Tablet, 21:9 Desktop, `preload` (kein `priority`). Mobil kommt das Bild direkt nach der H1, damit Bild und Knopf im ersten Viewport liegen. Kein Text auf Bild, daher kein Kontrastproblem (Jury P0.1).
- **Der alte `SinglePageBanner` (Client-Komponente) wird hier nicht mehr genutzt.** Die Seiten sind jetzt reine Server-Komponenten.
- **Asymmetrisches 12er-Raster**, Abschnitte `py-section`, Karten ohne Rahmen/Schatten/Radius, Haarlinien statt Boxen, Nummern in Bodoni ≥ 32 px, Versalien nur in Overlines.
- **Genau eine Walnut-Fläche pro Seite** (geprüft: `data-surface="inverse"` = 1 auf allen 5 Prüfseiten): Template = Showroom-Fakten (`<dl>` Adresse, Öffnungszeiten, Kontakt, „Route planen“-Link), Yacht = Materialien, Outdoor = Pflege & Einlagerung. Der Schluss-CTA ist hell.
- **Horizontlinie** einmal pro Seite (Ablauf bzw. Saison).
- **FAQ vor dem Schluss**, als `<details>` über `Accordion` (exklusiv, erste Frage offen). FAQPage-JSON-LD unverändert.
- **Schluss:** `CTABand` mit dem Leitsatz „Nehmen Sie Platz.“ (1× pro Seite), ein Primärknopf, sekundär „Kontakt“ bzw. „Per E-Mail anfragen“. Das CTA-Hintergrundbild (`cta.image`) wird nicht mehr gezeigt (bleibt im Content, schadet nicht).
- **Marken:** Template mit `Card` (Bild, Name, Satz, ganze Karte verlinkt). Yacht/Outdoor typografisch (Name in Bodoni, Satz, Haarlinie). Keine Logos, keine Händlerformel.
- **de-CH-Seiten** (`inLanguage: "de-CH"`): Template-Texte und Adresse ohne „ß“ (Landstrasse).
- **Saisonfarben** aus `outdoor-gartenplanung/page.js` (`season.items[].color`) werden nicht mehr gezeichnet (§4.3: nur Kampagnenmodule).
- **SEO:** URLs, Canonical, Robots, OpenGraph, WebPage/BreadcrumbList/Service/FAQPage-JSON-LD unverändert; 1 H1 pro Seite; alle Inhalte im Server-HTML. Die sichtbaren Brotkrumen nutzen `Breadcrumbs` **ohne** `schema` (JSON-LD kommt schon aus `landingSchema`).

## 3. Küche: Platz für die Steinküchen-Linie (Binni)

Das Template rendert einen optionalen Block `content.stoneLine` nach den Marken:

```js
stoneLine: {
  eyebrow, heading, text,
  origin,              // PFLICHT – ohne Herkunft rendert der Block nicht (§14, Binni nie „italienisch“)
  points: [],          // optional
  image, imageAlt,     // optional, 4:5
  cta: { href, label } // optional
}
```

Inhaltlich passt er auf `/de/kuechen-vorarlberg` (Küchenplanung, Showroom, Materialien). **Ich habe bewusst keinen Text in `page.js` gesetzt** (fremde Datei, Herkunft und Konditionen offen). Vorschlag zur Freigabe, sobald Herkunft und Partnerstatus bestätigt sind:

> Overline „Stein in der Küche“ · H2 „Arbeitsplatten und Fronten aus Stein“ · Text: „Neben Poliform und next125 planen wir Küchen mit Steinoberflächen unseres Partners Binni. Platten und Muster zeigen wir Ihnen im Showroom in Lochau.“ · Herkunft: „[Land laut Hersteller]“.

Nicht verwenden: „italienisch“, „leistbar/günstig“ als Preisaussage ohne Preisrahmen, „offizieller Partner/Händler“. Die Steinbibliothek (Signature-Feature 2) kommt erst in Phase 2.

## 4. Prüfung

- `/de/kuechen-vorarlberg`, `/de/designermoebel-lindau`, `/de/designermoebel-liechtenstein`, `/de/yacht-interior`, `/de/outdoor-gartenplanung`: 200, je 1 H1, 1 Walnut-Fläche, Canonical korrekt, 4 JSON-LD-Blöcke inkl. FAQPage, Leitsatz 1× sichtbar.
- 375 px: kein Überlauf innerhalb von `<main>`. Ein Zwischenlauf maß einen Überlauf im neuen Header (fremdes Paket); im letzten `shoot.mjs`-Lauf ist kein Überlauf und kein Konsolenfehler mehr gemeldet. Hero-Abstand passt zum neuen, sticky Header (56/72 px).
- ESLint `src/components/Landing`: 0 Fehler, 0 Warnungen.
- Screenshots: `qa-screenshots/neuauftritt/landingpages/selbsttest/` (inkl. `sec/` je Abschnitt, Desktop und 375 px).
- Während der Prüfung lieferte der Dev-Server zeitweise 500, weil fremde Dateien gerade nicht kompilierten (`Labs/Kuechenplaner/*`, `MarkenItems/markenitems.js`, `produkte/[category]/[product]/page.js`). Nicht aus diesem Paket.

## 5. Offene Punkte

1. **Texte in den `page.js` (Inhaltsteam/Recht):** Küche: Titel „Exklusive Küchen“ (Bibel §1: „exklusiv“ vermeiden), FAQ „Welche Küchenmarken führen Sie?“ und „Möbel … führender Designmarken“ (Händler-/Superlativ-Nähe) → „zeigen/planen“. Kommentar dort sagt noch „noindex“, die Seite ist indexierbar. Regionsseiten auf weitere „führen“-Formeln prüfen.
2. **Bilder (Bibel §7, Jury §3.4):** Yacht-Hero und Outdoor-Bilder 4/5 zeigen Meer und Pinien (fremder Ort); Herstellerbilder ohne dokumentierte Freigabe. Liechtenstein-Hero (`Wohnen/bannerImage6.jpg`) hat einen weißen Rand im Bild.
3. **`messages-landing.json`** in `src/messages/*.json` übernehmen (Paket „Recht & Texte“); bis dahin greift der deutsche Fallback.
4. **TrustBlock (§11)** bewusst nicht gebaut: Festpreis CHF, unterschriebener Plan, feste Ansprechperson sind nicht bestätigt (Liechtenstein-Seite verspricht Währung ausdrücklich nicht).
5. **Regionsseiten nach §10.2** (Fahrzeit, Währung, Lieferweg, Referenzprojekt, Ortsbild) brauchen strukturierte Felder pro Seite; heute steht das nur im Fließtext. Vorschlag: `content.facts = [{label, value}]` – Template kann das als Faktenzeile ausgeben, sobald Inhalte belegt sind.
6. `landingMetadata` setzt `og:locale` immer `de_AT`, auch auf de-CH/de-DE-Seiten. Verbesserung möglich, braucht aber einen neuen Parameter aus den `page.js`.
7. Öffnungszeiten stehen als Text im Template (wie bisher). Gehören in `src/lib/site.js` als eine Quelle (Bibel §9 `OpeningLine`).
8. Wenn Tailwind-Radien/-Schatten global abgeschaltet werden: dieses Paket nutzt keine.

## 6. Benötigte Bilder

- Pro Regionsseite ein eigenes Ortsbild (Weg nach Lochau, Ufer, Pfänder) 3:2 und 21:9.
- Küche: eigene Showroom-Küche 21:9 + 3:2, Steinplatte mit Hand im Streiflicht 4:5/1:1 (für `stoneLine`).
- Yacht: eigenes Boot/Bootshaus am Bodensee (ersetzt Meer-Terrasse), Materialdetails (Teak, Outdoor-Stoff) 1:1.
- Outdoor: eigene Terrasse am See im Abendlicht 21:9 (Shotliste Tag 5).

---

## 7. Runde 2: QM-Fixes (Feedback `qa-screenshots/neuauftritt/landingpages/feedback.md`)

**Stand:** 26.10.2026 · neue Datei `src/components/Landing/imagery.js` (Bildregister der Landingpages). Geändert: `parts.js`, `landingPage.js`, `Yacht/YachtLanding.js`, `Outdoor/OutdoorLanding.js`, `messages-landing.json`. Keine `page.js` angefasst (fremde Dateien).

### Behoben

| Punkt | Lösung |
|---|---|
| **P1-1** Liechtenstein-Hero mit weißem Rand | `imagery.js` sperrt `Wohnen/bannerImage6.jpg` (`BLOCKED_IMAGES`). Hero → `Home/secondAboutHome.jpg` (randlos, kein anderer Landing-Hero). Intro → `Wohnen/bannerImage4.jpg`, weil das bisherige Intro-Bild denselben Raum zeigt. Kein CSS-Zuschnitt. |
| **P1-2** fremde Orte | Gesperrt: `Outdoor/bannerImage3` (Provence), `bannerImage4`/`bannerImage5` (Meer, Kreuzfahrtschiff), `Home/thidImage`, `Home/secondImage`. Neue, seitenexklusive Heros: Lindau `Wohnen/bannerImage10`, Yacht `Outdoor/bannerImage1` (Teak + Outdoor-Polster), Outdoor `Outdoor/bannerImage2` (ohne Zypressen). Lindau-Galerie und Outdoor-Galerie ohne Meer, Alt-Texte neu (kein „Meer“ mehr). Yacht-Regionen „Bodensee/Mittelmeer“ ohne Fotos (Haarlinien-Liste), bis eigene Bilder da sind. `primaryImageOfPage` im JSON-LD folgt dem gezeigten Bild. Die 4 neuen Heros nutzt keine andere Landingpage. Hinweis: Feldkirch und Ravensburg teilen sich weiter `Licht/bannerImageLicht1.jpg` (deren `page.js`, nicht geprüft in Runde 1). |
| **P2-1** Hero Yacht/Outdoor | `LandingHero`: mobil H1 → Bild → Knopf → Lead; Desktop Lead unter der H1 (Spalten 1–7), rechts Knopf + Telefon + Faktenzeile unten bündig, 21:9-Bild darunter. `splitLead()` kürzt den Lead auf 2 Sätze, der Rest wird erster Intro-Absatz (kein Textverlust). 375 × 667: Primärknopf endet bei y = 577 auf allen 5 Seiten. |
| **P2-2** Schlussband | Eigenes `LandingClosing` (statt `CTABand`): Leitsatz einzige Display-Zeile, H2 als `title` (Instrument), Abstand H2 → Text `stack-m`. |
| **P2-3** Galerie | `cleanGallery()` filtert Hero, gesperrte Bilder, Intro-Bild und Dubletten. Komposition: 7 Spalten 3:2 + 4 Spalten 4:5 **unten bündig** (`items-end`), drittes Bild volle Breite 21:9. Küche: Hero nicht mehr in der Galerie, `Poliform-Kitchen.jpg` nur noch 1× sichtbar. Yacht-Leistungsbilder unten bündig. |
| **P2-4** Fakten + TrustBlock | `FactRow` (`<dl>`, unter dem Hero-Bild) aus `content.facts` oder `PAGE_FACTS` in `landingPage.js` – nur Aussagen, die die Seiten schon belegt enthalten (Lindau: Entfernung, kein Zoll, Lieferung auf Anfrage; Liechtenstein: rund 40 min, Schweizer MWST-Gebiet 8,1 %, Lieferung auf Anfrage). Keine Währung, kein Preis, keine Anzahlung. Mini-TrustBlock im Schlussband: „Probesitzen im Showroom in Lochau · Muster und Materialien zum Termin · Ihr Plan vor der Bestellung“ – **Freigabe Inhaber offen**. |
| **P2-5** Herstellerbilder | Markenkarten im Template jetzt typografisch (`BrandGroups`, Name als H3), keine Pressebilder in Markenkarten mehr. `brand.image` bleibt im Content für später. |
| **P2-6** Liechtenstein Recht | Zeile „Stand: 10/2026“ unter „Gut zu wissen“ (`STEPS_AS_OF`). Inhaltliche Freigabe durch „Recht & Texte“/Steuerberater bleibt offen. |
| P3-1 Overline | mobil `overlineShort` „Showroom & Café · Lochau“ (1 Zeile). |
| P3-2 Telefon | Ziffern bündig mit dem Primärknopf (`px-0`, 44 px hoch). |
| P3-5 og:locale | `landingMetadata` setzt `de_CH`/`de_DE` je Pfad (wie `inLanguage`), optional `locale`-Parameter. |
| P3-6 Brotkrumen | „Home“-Link 44 px hoch (`[&_a]:min-h-11`), optisch unverändert. |

### Prüfung Runde 2

- `node tools/qa/shoot.mjs …/landingpages/fix …` (5 Seiten × iPhone/Android/iPad/Desktop): 20 × 200, kein Überlauf. 2 Konsolenmeldungen nur auf dem iPad (Hydration-Mismatch auf Lindau, „state update on a component that hasn't mounted“ auf Outdoor) – aus Client-Komponenten anderer Pakete. Dieses Paket rendert nur Server-Komponenten.
- Eigenes WebKit-Audit 375 × 667 (`fix/m375/`): `scrollWidth = 375` auf allen 5 Seiten (Header-Fix des Header-Pakets greift), Primärknopf im ersten Viewport, „Home“ 44 px.
- HTML: 1 × `data-surface="inverse"` je Seite, `og:locale` Lindau `de_DE`, Liechtenstein `de_CH`, `primaryImageOfPage` = gezeigtes Hero-Bild, Canonical/Robots/Title/H1 unverändert.
- ESLint `src/components/Landing`: 0 Fehler, 0 Warnungen.

### Offen (nicht in diesem Paket)

1. **P1-3 Küchen-Copy** (`kuechen-vorarlberg/page.js`, Owner Inhalte/„Recht & Texte“): H1 + Title „Exklusive Küchen in Vorarlberg“ → „Designerküchen in Vorarlberg“ (Sitemap-Lastmod mitziehen); Benefit „Premium-Marken wie …“ → „Marken wie …“; FAQ „Welche Küchenmarken führen Sie?“ → „Welche Küchenmarken planen Sie?“; „führender Designmarken“ → „internationaler Designmarken“; „perfekt“ streichen (Poliform-Markentext „perfekt integrierten“, „perfekt zusammenpassen“). Lindau-FAQ „Führen Sie auch Outdoor-Möbel?“ → „Zeigen Sie auch Outdoor-Möbel?“.
2. **P1-5 Bodoni in Chrome** (Fundament, `globals.css`): `opsz` deckeln (`font-variation-settings: "opsz" 36` für `display-l/m`) – noch nicht umgesetzt (`font-optical-sizing: auto` steht weiter).
3. **Bild-Werte in den `page.js`** sollten die Owner aus `imagery.js` übernehmen; danach können die Overrides dort entfallen. Bildregister mit Freigabestatus je Datei fehlt weiterhin – auch die neuen Heros sind Herstellerbilder ohne dokumentierte Freigabe (§7.1). **R3-landing-Fix:** Küchen- und Kempten-Hero jetzt `released: false`; ohne Foto zeigt `LandingHero` eine dekorative Materialfläche (nur Desktop).
4. TrustBlock- und Faktentexte: Freigabe durch den Inhaber; `messages-landing.json` (7 neue Schlüssel, 4 Sprachen) in `src/messages/*.json` übernehmen.
5. P3-3 (Outdoor-Leistungen mobil kürzen) – Inhalt der `page.js`; P3-4 (Öffnungszeiten aus `src/lib/site.js`) braucht eine Konstante in `site.js` (fremde Datei); P3-7/P3-8 fremde Pakete.
6. LCP nur im Produktions-Build messbar.

### Benötigte Bilder (unverändert dringend)

Eigene Ortsbilder je Regionsseite; eigenes Boot/Bootshaus am Bodensee (Yacht-Hero und Regionen-Karten); eigene Seeterrasse für Outdoor; zweites eigenes Küchenbild.


---

## 8. Runde 3 (R3-landing, 26.10.2026)

Die Robots der Regionsseiten kommen jetzt aus `regionRobots()` (Doorway-Audit). 7 Seiten stehen auf `noindex, follow`. `/de/kuechen-vorarlberg` bleibt indexiert, der veraltete noindex-Kommentar ist korrigiert. Superlative und unbedingte Lieferzusagen sind ersetzt. Ein Hero ohne Freigabe (`released: false` in `imagery.js`) wird ohne Foto gezeigt, das betrifft Yacht und Outdoor. Die Yacht-Seite verlinkt die Outdoor-Seite. Details: `Marktresearch/digital/teamleiter/r3-R3-landing.md`.
