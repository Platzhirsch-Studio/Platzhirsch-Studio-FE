# R3-startseite: Seitenhöhe mobil, LCP mobil, Fallback-Rückbau

**Stand:** 26.10.2026 · Branch `feature/neuauftritt` (nicht committet) · Paket der Runde 3

## Ergebnis

| Ziel | Vorher | Nachher | Status |
|---|---|---|---|
| Seitenhöhe iPhone `/de` < 13 000 px | 17 080 px | **12 777 px** mit Cookie-Leiste, 12 624 px ohne (Nachbesserung, siehe §7) | erreicht, 223 px Puffer |
| Seitenhöhe Android `/de` | – | 12 741 px | erreicht |
| Seitenhöhe iPhone EN / FR / IT | – / – / 15 284 px | 11 561 / 11 605 / 11 584 px | erreicht |
| Hero-Bild mobil | 1200 w, q75, 41,6 KB AVIF | **750 w 1x / 1080 w 2x, q50, 9,4 / 16,2 KB AVIF** | erreicht |
| CLS mobil | 0 | 0 | gehalten |
| LCP mobil ≤ 2,0 s | Dev: Median 6,0 s | Dev: Median 3,3 s (Tendenz, siehe §7) | **offen**, Nachweis nur im Produktions-Build (R3-release) |
| Fallback `Home/copy.js` | 105 Schlüssel × 4 Sprachen | entfernt, Schlüssel belegt | erledigt |
| H1 „Italienisches Wohnen am Bodensee.“ | – | unverändert, per Unit-Test gesichert | gehalten |

Desktop (1440 × 900): 13 594 px. Dafür gibt es keine Vorgabe; das Layout ab `sm` ist praktisch unverändert. Footer mobil `/de`: 3 413 px (fremdes Paket), unverändert.

## 1. Seitenhöhe (mobil, iPhone 15 Pro)

Abschnitte `/de` in px, vorher → nachher:

| Abschnitt | vorher | nachher |
|---|---|---|
| Hero | 1 036 | 971 |
| Gastgeber | 934 | ~760 |
| Räume | 919 | 678 |
| Auswahl | 1 792 | 928 |
| Showroom & Café | 1 443 | ~1 080 |
| Marken | 1 120 | ~915 |
| Dreiländer-Service | 1 788 | ~1 400 |
| Leistungen | 1 404 | ~590 |
| SEO-Text + FAQ | 1 781 | ~860 |
| Neuigkeiten | 819 | 710 |
| Schluss-CTA | 573 | ~460 |

Was sich geändert hat (gilt nur für Phones, ab `sm` gilt das bisherige Layout):
- **Abschnittsabstand:** 40 px statt 96 px. Die Konstante `SECTION_Y` in `Home/row.js` steuert das; ab `sm` gilt das Token 96/128/176 px. Die Abschnitte wechseln die Fläche, deshalb bleiben die Kapitel lesbar.
- **Scroll-Reihen mit sichtbarer Bedienung** (`Home/ScrollRow.js`, Client-Insel, ca. 1 KB):
  - Knöpfe „Zurück/Weiter blättern“ (44 × 44 px) mit `aria-controls`.
  - An den Enden `aria-disabled` statt `disabled`, damit der Fokus nicht verloren geht.
  - Zähler „2 von 4“.
  - Bei `prefers-reduced-motion` springt die Reihe ohne Smooth-Scroll.
  - Wischen, Scrollleiste und Fokus funktionieren ohne JS.
  - Die Karten bleiben Server-HTML.
  - Eingesetzt für: Räume (72 vw, Bild mobil 3:2), Auswahl (44 vw, quadratisch, unbeschnitten), Leistungen (78 vw) und Neuigkeiten (72 vw, Teaser 120 statt 160 Zeichen, Schnitt am Wortende).
- **SEO-Text:**
  - Erster Absatz mobil auf 4 Zeilen begrenzt. Die übrigen Absätze öffnet „Weiterlesen“ (`Home/MoreText.js`, `aria-expanded`/`aria-controls`).
  - Alle Absätze stehen im HTML (Mobile-First-Indexierung). Ab `sm` ist alles sichtbar.
  - Die FAQ startet geschlossen. Alle Antworten bleiben im HTML und im FAQPage-JSON-LD.
- **Weitere Straffungen:**
  - Regionslinks (nur DE): zweispaltig, ohne Pfeil. Der Teaser bleibt im HTML, wie schon vorher.
  - Hero-Infozeile: Öffnungszeiten in einer Zeile, Adresse und Telefon nebeneinander.
  - Showroom-Foto unter `lg` im Format 3:2.
  - Abstände in Abschnittsköpfen 16 statt 24 px.
  - Engere Markenzeilen (Bodoni bleibt ≥ 32 px).
- **Nicht entfernt:** Text, Link, Bild, Marke, Region, FAQ und JSON-LD sind vollständig erhalten. Interne Links sind unverändert.

## 2. LCP mobil (Hero)

- `Hero.js`: Art Direction per `getImageProps` + `<picture>`, nach den Next-Docs `image.md` (Abschnitte „Art direction“, „preload“, „quality“).
  - **Unter 640 px:** genau eine Quelle, `w=750&q=50` als `1x`. Der Browser wechselt deshalb nie per DPR auf 1200.
  - **Ab 640 px:** die responsive Quelle wie bisher, `sizes="(min-width: 1024px) 50vw, 100vw"`, q75.
- **Preload:** zwei medienbezogene `<link rel="preload" as="image" fetchPriority="high">` per `react-dom` `preload`. Das ist der Mechanismus, den `next/image` mit `preload` intern nutzt; mit `<picture>` funktioniert der Prop nicht. Das `<img>` hat `fetchPriority="high"` und `loading="eager"`.
- **CLS:** Die Box hat ein festes Seitenverhältnis (3:2, ab `lg` Spaltenhöhe), gemessen 0.
- **Messung** (Playwright, Pixel 7, 4× CPU, 1,6 Mbit/s, 150 ms RTT, gegen den **Dev-Server**; Skript `qa-screenshots/teamleiter/r3-startseite/lcp.mjs`, Ausgaben `lcp-vorher.txt` und `lcp-nachher.txt`):
  - Vorher: Median 6,0 s, Bild 1200 w/q75.
  - Nachher: Median 6,1 s, Bild 750 w/q50.
  - Aufschlüsselung nachher (Lauf 2): TTFB 1,8 s (Dev-Rendering), Bild fertig bei 3,4 s, Dev-CSS fertig bei 3,8 s, FCP = LCP 4,6 s.
  - **Das Bild liegt nicht mehr auf dem kritischen Pfad.** Den Dev-LCP bestimmen TTFB und das unminifizierte Dev-CSS. Deshalb taugt der Wert nur als Tendenz.
- **Erwartung für Produktion:** Im Produktions-Build lag der LCP bei 2,33 s. Davon entfielen ca. 0,2 s auf die 42 KB des Bildes, jetzt sind es ca. 0,05 s, und der Preload startet früher. **Den Wert muss R3-release im Produktions-Build messen.** Liegt er weiter über 2,0 s, bremsen CSS und Fonts im Head, nicht das Bild (fremde Dateien).

## 3. Fallback-Rückbau

- **Beleg:** `qa-screenshots/teamleiter/r3-startseite/fallback-coverage.mjs` (gegen den Snapshot `copy.before-r3.js.txt`). Alle 105 Schlüssel des alten `HOME_COPY` stehen in `src/messages/{de,en,fr,it}.json` unter `HomePage`, fehlend: 0 (`fallback-coverage.txt`). Die Messages hatten bereits Vorrang (`t.has`). Abweichende Texte, z. B. „auf Wunsch Lieferung und Montage“ und die IT-Anrede von R3-i18n, waren also schon live. **Sichtbar ändert sich nichts.**
- **`Home/copy.js`:** nur noch `getHomeT()` mit Fallback auf `Home/pendingCopy.js`, das ausschließlich die neuen R3-Schlüssel enthält: `scroll.prev/next/position`, `seo.more/less`. Ein Schlüssel, der überall fehlt, erscheint wie bei next-intl als Rohschlüssel und fällt so in der QA auf.
- **Neue Texte:** `Marktresearch/digital/teamleiter/messages-r3-startseite.json` (4 Sprachen, Namespace `HomePage`), identisch mit `pendingCopy.js`, per Unit-Test geprüft.

## 4. Prüfung

- **shoot.mjs** (`qa-screenshots/teamleiter/r3-R3-startseite/selbst/`): 16/16 liefern 200 (DE/EN/FR/IT × iPhone/Android/iPad/Desktop), kein Querscroll, 0 Konsolenfehler. Einziger Request-Fehler: ein abgebrochener RSC-Prefetch (`/en?_rsc`, Android), harmlos.
- **Bilder angesehen:**
  - Hero IT/Android: 750/q50 scharf.
  - iPad: responsive Quelle, Layout unverändert.
  - Mobile Kacheln DE/IT (`r3-startseite/tiles/`): Reihen mit Knöpfen und Zähler, „Weiterlesen“, Regionslinks zweispaltig.
  - Leere Bildflächen in den Kacheln stammen vom Lazy-Loading während der Aufnahme. Gegenprobe `haus.mjs`: Das Showroom-Foto lädt.
- **ESLint** auf alle Paketdateien: 0 Fehler, 0 Warnungen.
- **Unit-Tests** `tests/unit/r3-startseite.test.mjs`: 6/6 grün. Geprüft werden:
  - jeder gelesene Schlüssel in 4 Sprachen
  - Pending = JSON-Vorschlag
  - kein `HOME_COPY`
  - H1 unverändert
- **E2E** `tests/e2e/r3-startseite.spec.js` (Projekt desktop, Pixel-7-Emulation): 9/9 grün. Geprüft werden:
  - Höhe < 13 000 px
  - 750/q50 und Preload
  - CLS ≤ 0,01
  - Knopf blättert und zeigt „2 von 4“
  - „Weiterlesen“
  - Desktop-Quelle
  - je Sprache 1 H1, SEO-Text, FAQ, FAQPage und keine Rohschlüssel

  Ein erster Lauf scheiterte nur an den Trace-Artefakten im gemeinsamen `tests-results`-Ordner (Parallelbetrieb). Neu gelaufen mit eigenem `PW_OUTPUT_DIR`.
- **Claim-Check** (`npm run check:claims`): 0 Funde in Paketdateien. Die 30 Gesamtfunde liegen in `src/lib/data/**` (fremd, vorbestehend).
- **Abnahme:**
  - A1: Im Dev liefern 640/750/828 sofort; im Produktions-Build hat die Integration es bestätigt.
  - A2: `hyphens-manual` war schon gesetzt.
  - A3: erledigt.

## 5. Dateien

- Geändert:
  - `src/components/Home/{Hero,Rooms,HouseCafe,BrandList,DreilaenderService,Services,SeoIntro,Journal,ClosingCta,SectionIntro,copy}.js`
  - `src/components/ProuductSectionHome/ProuductSectionHome.js`
  - `src/components/WhyChooseUsSectionHome/WhyChooseUsSectionHome.js`
  - `Marktresearch/digital/redesign/startseite.md` (§8)
- Neu:
  - `src/components/Home/{ScrollRow,MoreText,row,pendingCopy}.js`
  - `tests/unit/r3-startseite.test.mjs`, `tests/e2e/r3-startseite.spec.js`
  - `Marktresearch/digital/teamleiter/messages-r3-startseite.json`
  - `qa-screenshots/teamleiter/r3-startseite/*` (Mess-Skripte, Snapshot, Kacheln)
- Unverändert: `src/app/[locale]/page.js`, `src/lib/content/homeSeo.js`

## 6. Offene Punkte

1. **LCP Produktion:** R3-release misst `/de` mobil im Produktions-Build. Bleibt der Wert über 2,0 s, liegt es an CSS/Fonts (Hülle bzw. Fundament), nicht am Bild.
2. **Puffer DE:** nach der Nachbesserung 223 px mit Cookie-Leiste bzw. 376 px ohne (§7). Der Footer `/de` misst 3 413 px (EN 2 443 px). Ein schlankerer mobiler Footer (Paket Hülle) gäbe der Startseite Luft.
3. **Runde 4:** `messages-r3-startseite.json` nach `src/messages` übernehmen, danach die Einträge aus `pendingCopy.js` löschen. Der Unit-Test bleibt grün.
4. **Gestaltung:** Abschnittsabstand mobil 40 px, Räume mobil 3:2 und Auswahl mobil quadratisch sind Abweichungen von Bibel §6 bzw. §10.1 (Räume 4:5) zugunsten der Seitenlänge. Bitte in der Abnahme bestätigen.
5. **H1:** bleibt bis zur Entscheidung von Inhaber oder Anwalt.

## 7. Nachbesserung nach QA-Feedback (Note 8/10, 26.10.2026)

Feedback: `qa-screenshots/teamleiter/r3-R3-startseite/feedback.md`. Neue Aufnahmen: `qa-screenshots/teamleiter/r3-R3-startseite/fix/`.

### P2-1 LCP ≤ 2,0 s: offen, liegt bei R3-release

- Im Dev-Server lässt sich der Wert nicht belegen. Ein `npm run build` im Repo ist für dieses Paket verboten.
- Neuer Dev-Lauf (`r3-startseite/lcp-fix.txt`, Pixel 7, 4× CPU, 1,6 Mbit/s, 3 Läufe):
  - LCP-Median 3,26 s (3,0 / 3,3 / 4,7 s), CLS 0.
  - Das Herobild (1080 w, 16,2 KB) ist bei 1,6 bis 2,7 s fertig, also vor dem Dev-HTML/CSS-Ende (2,1 bis 4,1 s). In allen Läufen gilt FCP = LCP.
  - Ein Bildtausch kann den Wert deshalb nicht weiter senken.
- **Auftrag an R3-release:**
  - `node qa-screenshots/teamleiter/r3-startseite/lcp.mjs <prod-url>/de 5` gegen den Produktions-Build laufen lassen.
  - Ziel: Median ≤ 2,0 s. Darüber sind CSS und Fonts im Head die Ursache (Hülle/Fundament).
  - Dabei auch den einmaligen Konsolenfehler FR/iPhone gegenprüfen (P3-4).

### P2-2 Höhenpuffer DE: behoben, Footer-Ticket an Team 1

- **Abweichung erklärt:**
  - `scrollHeight` schwankt um 153 px. Grund ist die fixierte Cookie-Leiste: Ist sie sichtbar, reserviert die Hülle ihren Platz.
  - Die QA hat mit sichtbarer Leiste gemessen (12 892 px), mein Bericht ohne (12 792 px). Beide Werte stimmten.
  - Vor der Nachbesserung lagen sie bei 12 945 bzw. 12 792 px, der Hauptinhalt bei 9 321 px.
- **Gekürzt** (nur mobil, kein Inhalt entfernt):
  - Die SEO-H2 mit 13 Wörtern steht mobil in der Rolle `title` (Instrument 22 px, Bibel §5: Bodoni erst ab 32 px). Aus 6 Zeilen wurden 4, das spart 103 px.
  - Showroom: Abstände 32 → 24 px, minus 20 px.
  - Dreiländer-Service: Abstände 32 → 24 px, minus 16 px.
  - Neuigkeiten-Teaser mobil `line-clamp-3`, minus 29 px. Der Text steht vollständig im HTML.
- **Messung** iPhone 15 Pro (`measure.mjs`, jeweils mit / ohne Cookie-Leiste):

| | Hauptinhalt | Footer | Gesamt mit Leiste / ohne | Puffer zu 13 000 |
|---|---|---|---|---|
| DE vorher | 9 321 | 3 413 | 12 945 / 12 792 | 55 px |
| **DE nachher** | **9 154** | 3 413 | **12 777 / 12 624** | **223 / 376 px** |
| EN / FR / IT | – | 2 443 / 2 508 / 2 443 | 11 188 / 11 562 / 11 212 (ohne) | – |
| Android DE | 8 998 | 3 364 | 12 572 (ohne) | – |

- **Neuer E2E-Test** „Hauptinhalt `/de` mobil unter 9 300 px“: Er misst nur `main`. Footer und Cookie-Leiste können den Anteil der Startseite damit nicht mehr verdecken.
- **Ticket Team 1 (Hülle, Footer)**, bitte in Runde 4 übernehmen:
  - Der Footer `/de` misst mobil 3 413 px (EN 2 443 px). Das sind 27 % der Seite.
  - Vorschlag: Linkgruppen mobil als `<details>` (Links bleiben im HTML) und Regionsliste zweispaltig.
  - Ziel ≤ 2 200 px. Ohne das kippt das Höhenziel beim nächsten Inhaltszuwachs.

### P3 (Feinschliff)

| # | Punkt | Stand |
|---|---|---|
| 1 | Hero mobil nur 1x | **behoben:** `srcset="750w-URL 1x, 1080w-URL 2x"` (q50, `deviceSizes` enthält beide). 1080 w hat 16,2 KB statt 9,4 KB AVIF, das sind +6,8 KB, ca. +35 ms bei 1,6 Mbit/s. Preload mit derselben `imagesrcset`. iPhone und Pixel laden 1080/q50, Desktop unverändert die responsive q75-Quelle (`fix/fix-check.json.txt`). Ein q60 ist nicht möglich: `qualities` in `next.config.js` erlaubt nur 50/75/90/100 (fremde Datei) |
| 2 | Zähler ohne Ansage | **behoben:** `ScrollRow` hat eine `sr-only`-Region (`role="status"`, `aria-live="polite"`). Sie wird nur beim Knopfdruck mit der Zielposition gefüllt („2 von 4“), also ohne Zwischenstände beim Smooth-Scroll und ohne Ansage beim Wischen. Geprüft in WebKit und Chromium |
| 3 | Lazy-Bilder beim Blättern leer | **behoben:** Kommt eine Reihe auf einen Bildschirm nahe an den sichtbaren Bereich, stellt ein `IntersectionObserver` ihre Bilder auf `loading="eager"`. Die Hero-LCP bleibt unberührt, weil die Reihen weit darunter liegen. Gemessen: 4 → 0 lazy, alle 4 Raumbilder geladen. Die dritte Karte ist nach einem Klick sichtbar (`fix/x-iphone-row.png`). Die Leinen-Fläche bleibt Platzhalter |
| 4 | Konsolenfehler FR/iPhone | nicht reproduzierbar: Der neue shoot.mjs-Lauf zeigt 16/16 mit 0 Konsolenfehlern. Gegenprüfung im Produktions-Build bei R3-release |
| 5 | „über 35 Marken“ | **teilweise belegt:** Das Backoffice (Marken-Doctype, Status „Aktiv“) führt derzeit 36 aktive Marken. Die Startseite zeigt live „Alle 36 Marken ansehen“, die Zahl ist also gedeckt. Ob „planen mit“ für alle 36 stimmt, bestätigt Team 7 / Inhaber in Runde 4. Die Zahl bleibt unverändert (`homeSeo.js` nicht angefasst) |

### Prüfung der Nachbesserung

- **shoot.mjs** (`fix/`): 16/16 mit Status 200, kein Querscroll, 0 Konsolenfehler, 0 fehlgeschlagene Requests. Angesehen: DE/iPhone, FR/Android (Hero 1080 scharf), DE/Desktop (unverändert), Reihe nach Klick.
- **Kacheln** `r3-startseite/fix-tiles/vor-*` und `nach-*`: SEO-H2 mobil in vier Zeilen. Sonst sind keine Brüche sichtbar.
- **Funktionsprüfung** `r3-startseite/fix-check.mjs` → `fix/fix-check.json.txt`: Herobild-Quelle, Preloads, Live-Region, Eager-Umschaltung, SEO-H2-Rolle und 1 H1, jeweils für iPhone, Android und Desktop.
- **Tests:**
  - E2E `tests/e2e/r3-startseite.spec.js`: 10/10 grün (Hero 1x/2x, Live-Region, Eager, Hauptinhalt < 9 300 px).
  - Unit `r3-startseite`: 6/6 grün.
  - ESLint: Home und Spec ohne Meldung.
- **Geändert:**
  - `Home/{Hero,ScrollRow,SeoIntro,HouseCafe,DreilaenderService,Journal}.js`
  - `tests/e2e/r3-startseite.spec.js`
  - `redesign/startseite.md` §8.1

**Einschätzung nach der Nachbesserung: 9/10.** Fehlt nur noch der LCP-Nachweis im Produktions-Build.
