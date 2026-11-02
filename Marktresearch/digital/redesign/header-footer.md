# Paket „Header, Navigation, Footer“

**Stand:** 26.10.2026 (Runde 2 nach QA) · **Branch:** feature/neuauftritt · **Grundlage:** Design-Bibel §2 (P2, P4), §3, §4.2, §6, §8.4, §9, §10.1, §14, W6, W7, W13, W16, W21 · Jury-Urteil §3.1–3.3, P0.5, P0.6, P1.13, P1.14 · Fundament (`fundament.md`) · QA-Feedback `qa-screenshots/neuauftritt/header-footer/feedback.md`.

## 0. Runde 2: QA-Befunde umgesetzt

| Befund | Status | Umsetzung |
|---|---|---|
| **P1-1** Header-Überlauf ≤ 375 px | behoben | `navbar.js`: Logo-Link `flex-1 min-w-0` (ab 768 px `flex-none shrink-0`), Wortmarke `w-full max-w-[213px] h-auto` (skaliert, max. 20 px hoch); Abstand Logo–Icons `gap-2` unter 640 px, Icon-Gruppe `gap-0` unter 768 px; Menüknopf unter 640 px ohne `pl-2` und mit `-mr-2.5`, Icon sitzt genau auf dem 20-px-Gutter. **Messung** (`header > div`, `scrollWidth`/`clientWidth`, nicht `innerWidth`), WebKit und Chromium identisch: 320 px → 320/320, Wortmarke 150 × 14 px, Menü-Icon rechts bei 300; 360 px → 360/360, 190 × 18 px, Icon bei 340; 375 px → 375/375, 205 × 19 px, Icon bei 355. Screenshots `fix/messung/{webkit,chromium}-{320,360,375}-header.png`. **Bibel-Abweichung:** Unter 375 px ist die Wortmarke kleiner als 20 px (14 px bei 320 px). Begründung: Erreichbarkeit der Navigation geht vor Logogröße; Lesbarkeit der Wortmarke bleibt gegeben. |
| **P2-1** Mega-Panel durchsichtig | behoben | `Navbar.module.css`: `.panel` hat keine Opacity-Transition mehr, die Fläche ist ab dem ersten Frame deckend. Nur `.panelInner` blendet 280 ms ein und hebt sich 8 px (`@starting-style`). Schließen sofort (keine Durchsicht, kein Überkreuzen beim Nachbarwechsel). Reduced Motion / Ruhige Ansicht: reiner 150-ms-Fade des Inhalts, Fläche deckend. Gemessen (Chromium und WebKit): Panel-Opacity in allen Frames 1, Inhalt 0 → 1. |
| **P2-2** Gutter 1280–1535 px | behoben | `px-gutter` auf allen Breiten (statt `xl:px-10`), Abstand `gap-4`, Trigger `px-2.5` (2xl `px-4`, Unterstrich-Inset passend), Sprachumschalter als reines „DE“ (Chevron erst ab 1536 px). Gemessen 1280 und 1440: Logo x = 80 = H1 x, „Termin“ endet bei Breite − 80, 7 Punkte in einer Zeile, kein Umbruch. |
| **P2-3** Fokus beim Öffnen des Mobilmenüs | behoben | Nach `showModal()` Fokus auf „Menü schließen“. Bei Tap/Klick ohne Fokusring (`focus({ focusVisible: false })`), bei Tastatur mit Ring. Gemessen WebKit/Chromium 320–375: `activeElement` = „Menü schließen“. |
| **P2-4** „Wohnen“ aktiv auf `/produkte` | behoben | `shellNav.js`: Der Link „Alle Produkte ansehen“ (Katalog-Root) ist `shared` und entscheidet keinen Raum mehr. Gegenprobe: `/de/produkte` → kein Raum aktiv, `/de/produkte/sofas-couches` → „Wohnen“ aktiv. |
| **P2-5** Fundament-Abhängigkeiten | Ticket + Patch (§4a) | Nicht im Paket (globals.css, layout.js). Fertiger Patch-Vorschlag unten in §4a. |
| P3-1 doppeltes „Lochau am Bodensee“ | behoben | Footer-Logo mit `tagline={false}`, Overline bleibt. |
| P3-2 Telefon höher als „Termin wählen“ | behoben | Kontaktzeile `sm:items-center`, Telefon `inline-flex min-h-11 items-center`. |
| P3-3 zwei Textgrößen, Loch unter Öffnungszeiten | behoben | Adresse und Öffnungszeiten in `text-ui` (16 px); „Leistungen“ steht unter den Öffnungszeiten; „Das Haus“ eigene Spalte. |
| P3-4 „Deutsch“ eingerückt im Mobilmenü | behoben | Sprachliste `-mx-2`. |
| P3-5 Mittelpunkt „Anrufen · …“ | behoben | Ein Textlauf mit festen Leerzeichen, der Flex-Gap greift nicht mehr am Punkt. |
| P3-6 „Ihre Auswahl“-Label ab `xl` | begründete Abweichung | Bei 1280 px bleiben nach P2-2 zwischen „Das Haus“ und der Suche nur ca. 70 px; das Label (~100 px) würde die Navigation ans Logo drücken. Label weiterhin ab 1536 px, darunter Herz mit Zähler und `aria-label` „Ihre Auswahl, n Stücke“. |
| P3-7 Spalte „Licht“ mit einem Link | behoben | `mergeLoneColumns()` in `shellNav.js` legt einspaltige Gruppen mit dem Nachbarn zusammen: „Licht & Wohnaccessoires“ (Leuchten zuerst), Wohnen hat jetzt 4 Spalten, kein Umbruch bei „Sideboards & Kommoden“. Titel kommen aus den bestehenden `ProductsMenu`-Gruppen, daher kein neuer Text. |
| P3-8 Esc in der Suche, Kastenfeld | behoben | `onKeyDown` Escape schließt sofort. Feld als Unterstrich über die volle Breite (1 px `line-control`), Fokus als 2 px Ink-Unterstrich; der globale (ungelayerte) Fokusring auf dem Input wird über eine Modulregel aufgehoben (Tailwind-Utilities kamen gegen ihn nicht an – das war die Ursache des Kastens). |
| P3-9 14 `nav`-Landmarks | behoben | Footer-Spalten und Regionen als `<div>` + `<h2>` in **einem** `<nav aria-label="Weitere Seiten">`; Besuch/Öffnungszeiten ohne `section`-Region; Footer-Sprachliste und Social-Links als beschriftete Listen (`LanguageList landmark={false}`). Desktop jetzt 8 `nav` (davon 3 im geschlossenen, inerten Mobil-Dialog bzw. der CTA-Leiste). |
| P3-10 EN/FR Termin-Texte | behoben | EN „Book an appointment“ (Leiste „Book“), FR einheitlich „Prendre rendez-vous“ (Kopfzeile bleibt kurz „Rendez-vous“), IT „Prenota un appuntamento“. |
| P3-11 Regionen-Block | behoben | `text-small`, `text-soft`, 4 Spalten, Touch-Ziel 44 px bleibt. |

**Texte:** `messages-header-footer.json` neu aus `shellCopy.js` erzeugt: jetzt **88 Schlüssel** je Sprache (neu `Shell.footer.nav`: „Weitere Seiten“ / „More pages“ / „Autres pages“ / „Altre pagine“), Schlüssel in allen 4 Sprachen identisch.

**Selbsttest Runde 2:** `node tools/qa/shoot.mjs …/header-footer/fix /de /de/produkte` – Desktop, Android und iPad 200; iPhone `/de` lieferte 500, Ursache fremd (`src/components/Home/Hero.js` → fehlendes `./kern`, `Home/Rooms.js` Syntaxfehler während paralleler Bearbeitung durch das Startseiten-Team). Zusätzliche Messungen per Playwright unter `qa-screenshots/neuauftritt/header-footer/fix/messung/` (Header 320/360/375 WebKit+Chromium, Mobilmenü, Header 1280/1440/1536, Mega-Menü nach 60 ms, Suche, Footer). ESLint eigene Dateien: 0 Probleme.

## 0b. Runde 3 (Paket R3-shell, 26.10.2026)

Nachbesserung (QA R3-shell): /upload-Hülle mit einzeiliger Rechts-Fußzeile (`[data-shell-legal]`, wird bei eigener Rechts-Nav der Seite per `:has()` ausgeblendet). Mobilmenü per Tippen geöffnet zeigt den Fokusring auch in WebKit nicht mehr (`data-pointer-focus`). Consent-Texte C1/C2 als Vorschlag in `teamleiter/messages-r3-shell.json`.


| Punkt | Umsetzung | Beleg |
|---|---|---|
| Cookie-Banner im Neuauftritt | `Cookies/cookiecomponent.js` neu: Leiste auf Paper mit einer Haarlinie, keine Radien, keine Schatten, kein Gold. „Alle akzeptieren“ und „Weiter ohne Einwilligung“ sind derselbe Knopf (Rahmen Ink, gleiche Größe), „Individuelle Einstellungen“ ist ein Textknopf im Satz. Titel nur ab 768 px sichtbar (Region trägt den Namen). Die Höhe geht als `--ph-consent-h` an `<html>` (scroll-padding-bottom und Body-Polster, WCAG 2.4.11). Einstellungen als natives `<dialog>` mit `showModal()` (Fokus-Falle, Esc, Fokus zurück an den Auslöser). Detail-Schalter sind jetzt echte Knöpfe mit `aria-expanded` (vorher `<span onClick>`, nicht per Tastatur erreichbar). Unverändert: zugängliche Namen, Cookie `cookieConsent` (gleiche Schlüssel, gleiche Reihenfolge), Ereignis `ph-consent-change` | `tests/e2e/r3-shell.spec.js` |
| `ConsentEmbed` | Platzhalter auf `surface-band`, Icon `text-soft`, Knopf mit Ink-Rahmen, füllt sich bei Hover/Fokus; kein Gold, kein Radius. Liest die Einwilligung per `useSyncExternalStore` | Sichtprüfung `/de/kontakt` |
| Lint `set-state-in-effect` | Banner und Merkliste (`context/CartContext.js`) lesen Cookie bzw. `localStorage` über `useSyncExternalStore` (Server/Hydration leer, danach der gespeicherte Wert – wie vorher). Merkliste: gleicher Schlüssel `cart`, gleiche Reparatur kaputter Werte, Speichern bei jeder Änderung. `npx eslint src`: 0 Probleme | |
| Header 320 px | unverändert ohne Überlauf (WebKit und Chromium 320: `scrollWidth = clientWidth`) | e2e „Header WebKit/Chromium 320“ |
| Mobilmenü-Fokus | „Menü schließen“ steht jetzt im DOM **vor** dem Logo (rechts per `flex-row-reverse`), ist also das erste Element des Dialogs und bekommt beim Öffnen den Fokus. Esc (nativ) → Fokus auf „Menü öffnen“. Wortmarke im Menü skaliert wie im Header | e2e prüft beides in WebKit und Chromium |
| Umbrüche Mega-Menü | Spalten als `repeat(n, auto)`: jede Spalte bekommt zuerst ihre Inhaltsbreite. Wohnen bei 1280 px: 689 px Inhalt + 96 px Lücken in 791 px → „Chaiselongues & Daybeds“, „Sideboards & Kommoden“ einzeilig | `qa-screenshots/teamleiter/r3-shell/megawidths.mjs`, `wraps.mjs` |
| Umbrüche Footer | 2 Spalten mobil, 3 ab 1024 px, ab 1280 px fünf `auto`-Spalten; Wochentage und Zeiten `nowrap`; Telefonnummer rechts bündig am Gutter (`sm:-mr-3` gegen das Ghost-Polster) | `wraps.mjs` |
| `caret-color`-Mismatch | Ursache: Playwrights WebKit-Screenshot schreibt `style="caret-color: transparent"` auf Texteingaben, bei langsamem Dev-Server vor der Hydration. `suppressHydrationWarning` am Suchfeld (nur dieses Element, nur Attribute) | `caret.mjs`: vorher Meldung, nachher keine |
| `scroll-padding-bottom` | war schon 80 px; jetzt `max(5rem, Bannerhöhe + 16 px)` | |
| Bodoni „W“ | gemessen (`kerning.mjs`, Chromium und WebKit): Kerning ist aktiv (AV −10, To −6, Yo −11 bei 100 px), aber die ausgelieferte Bodoni Moda hat **keine Paare für W + Kleinbuchstabe** (We/Wo/Wi = 0) und keine für „Ne“. CSS (`font-kerning`, `font-feature-settings`) kann das nicht beheben. Weg: `Home/kern.js` (`kernDisplay`) als gemeinsamer Baustein nach `components/ui` heben (Fundament/Runde 4) oder eine eigene Schriftdatei mit ergänzten Paaren (Schriftgestalter, OFL) | |
| Öffnungszeiten eine Quelle | `OPENING_HOURS` + Helfer in `src/lib/site.js`; Footer, Mobilmenü (vorher Message `Navbar.hours`), `Kontakt/copy.js` (Re-Export) und JSON-LD (`openingHoursSpecification()`) lesen daraus; Werte unverändert | `tests/unit/r3-shell.test.mjs` |
| `/upload`-Hülle | `client-layout.js` → `Reusable/BareShell.js` für `/<locale>/upload/**`: nur Wortmarke und „Zurück zur Website“ (Verlauf zurück, sonst Startseite), kein Menü, Footer, Banner, CTA-Leiste | e2e „Schlanke Upload-Hülle“ |

Neue Texte: nur `Shell.bare.back` (`shellCopy.js` + `Marktresearch/digital/teamleiter/messages-r3-shell.json`, 4 Sprachen).

## 0c. Runde 4 (Paket R4-shell-perf, 26.10.2026)

Bericht und Messungen: `Marktresearch/digital/teamleiter/r4-R4-shell-perf.md`.

- **Header und Footer sind echte Server Components** (§4a.3 umgesetzt, §4 Punkt 1 erledigt): `[locale]/layout.js` rendert `<Navbar>` und `<Footer>` und reicht sie als Slots `header`/`footer` über `LoaderWrapper` an `ClientLayout`. Der schlanke /upload-Zweig lässt sie weiter weg.
- **Inseln bekommen fertige Texte** (`Navbar/shellLabels.js`, nur Server): `SelectionLink`, `LanguageSwitcher`/`LanguageList`, `MobileMenu`, `SearchDialog`, `MobileCtaBar` rufen `useShellCopy()` nicht mehr auf. `shellCopy.js` und `shellNav.js` sind nicht mehr im Browser-Bundle (Unit-Test). Reine Routen-Helfer liegen in `Navbar/navMatch.js` (`findActiveRoom`, `isCurrent`, `translatePathWith`, `localizeHref`), `shellNav.js` re-exportiert sie.
- **Lazy:** Such-Sheet (`SearchSheet.js`, `next/dynamic`, lädt bei Hover/Fokus, öffnet beim ersten Klick), Inhalt des Mobilmenüs (erst beim Öffnen), Consent-Leiste und -Dialog (`ssr:false`, rendert auf dem Server ohnehin nichts), `BareShell` (nur /upload).
- **Plain Links mit einer delegierten Navigation** (`Reusable/LinkDelegate.js`): Footer und Mega-Panels rendern `<a href="/de/…">` statt je einer `<Link>`-Komponente. Linksklick → `router.push`, Hover/Fokus → `router.prefetch`. Sprachlinks (`hreflang`), Modifier-Klicks, neue Tabs, fremde Hosts bleiben Browser-Standard. Ziel-URLs unverändert (Vergleich alt/neu: /de 140, /en 115 Links identisch).
- **Footer mobil** (Ticket r3-R3-startseite §7): Linkgruppen „Leistungen“, „Sortiment“, „Marken“, „Das Haus“ unter 768 px als `<details>` (Links bleiben im HTML), Sortiment/Marken aufgeklappt zweispaltig, Regionen zweispaltig. Ab 768 px offen: CSS `::details-content` (auch ohne JS) plus Insel `FooterGroupsOpen` für ältere Engines. Höhe iPhone /de 3 413 → 2 018 px, EN 2 443 → 1 529 px.
- **Skip-Link** jetzt auch in der schlanken Hülle (`BareShell`).
- **Client-Messages:** `layout.js` gibt dem `NextIntlClientProvider` nur noch Namespaces, die Browser-Code liest (Deny-list `Reusable/clientMessages.js`, Unit-Test wacht).

## 1. Änderungen

**Header** (`Navbar/navbar.js`, ohne `"use client"`, serverfähig):
- Er ist **sticky** und liegt im Fluss. Seiten brauchen deshalb keinen Abstand nach oben mehr.
- Höhe: 72 px ab 1280 px, 56 px darunter (Token `h-header`).
- Links das Logo: ab 768 px die Lockup-Variante mit 28 px, darunter nur die Wortmarke mit 20 px.
- In der Mitte 7 Raum-Punkte nach Bibel W6: Wohnen, Küche, Schlafen, Outdoor, Marken, Leistungen, Das Haus.
- Rechts stehen:
  - die Suche,
  - „Ihre Auswahl“ mit Zähler,
  - der Sprachumschalter (DE, ohne Flaggen),
  - „Termin“ als `secondary`, sodass auf jeder Ansicht nur ein gefüllter Knopf bleibt.
- Unter 768 px blendet der Header beim Herunterscrollen aus und kommt nach mindestens 8 px Hochscrollen zurück (W7). Solange der Tastaturfokus im Header liegt oder ein Menü offen ist, bleibt er stehen.
- Der Skip-Link ist das erste fokussierbare Element.

**Mega-Menü** (`DesktopNav.js`, ab 1280 px):
- Disclosure-Muster: Button mit `aria-expanded`/`aria-controls`, kein `role="menu"`.
- Öffnen: nach 300 ms Verweilen oder sofort per Klick. Ist schon ein Menü offen, wechselt es ohne Verzögerung.
- Schließen:
  - 400 ms nach Verlassen,
  - mit Esc (Fokus zurück auf den Button),
  - bei Fokusverlust,
  - nach Link-Klick,
  - bei jedem Routenwechsel.
- Alle Panels stehen im Server-HTML (`hidden`), Crawler sehen also alle Links.
- Der aktive Raum ist mit einer Messing-500-Linie unterstrichen, Links der aktuellen Seite tragen `aria-current`.
- Die Raum-Zuordnung läuft über die Kategorie-Keys aus `ProductsMenu.groups`.
- Die Logik `activeCategoryKeys` bleibt erhalten: leere Kategorien und Gruppen entfallen, bei `null` erscheint das volle Menü.
- Yacht-Interior, Outdoor-Planung, Küchenplanung, Interior Design und Ratgeber erscheinen nur auf DE, weil EN/FR/IT dort 404 liefern.

**Mobiles Menü** (`MobileMenu.js`):
- Vollbild-`<dialog>` mit `showModal()`.
- Die Räume sind exklusive `<details>`.
- Darunter: „Termin wählen“ (der einzige Primärknopf), Anrufen, Ihre Auswahl, die vier Sprachen sowie Adresse und Öffnungszeiten.
- Das Menü schließt nach jedem Link-Tap, bei Routenwechsel und ab 1280 px. Der Fokus geht danach zurück auf „Menü“.

**Suche** (`SearchDialog.js`):
- Obere Leiste als `<dialog>`.
- Die Live-Suche über `/api/shop-search` ist unverändert übernommen.
- Enter springt zum besten Treffer, sonst zu `/produkte?q=`.

**Sprachumschalter** (`LanguageSwitcher.js`):
- Echte `<a>` mit `hreflang` und `lang`, übersetzte Pfade aus `ROUTES`.
- Die Query bleibt erhalten.
- Reine DE-Seiten (Regionen, `EXTRA_PAGES`, Yacht, Ratgeber, Advent …) führen auf die Startseite der Zielsprache. Geprüft: `/de/designermoebel-bregenz` → `/en`, `/en/products/beds` → `/fr/produits/beds`.

**Footer** (`Reusable/Footer.js`, serverfähig):
- Heller Grund (Stone), die Walnut-Fläche bleibt frei für „Haus & Café“.
- Inhalt:
  - Logo, Angebotszeile, „Termin wählen“ (secondary) und Telefon.
  - Besuch: Adresse aus `lib/site.js`, Route, Telefon, E-Mail.
  - Öffnungszeiten als `<dl>`, Wochentage über `Intl`.
  - Sortiment, Marken, Das Haus und Leistungen.
  - **Regionen** (nur DE): `LANDING_PAGES` plus Regionen aus `EXTRA_PAGES`, ohne Doppelte.
  - Schalter **„Ruhige Ansicht“** (`role="switch"`): setzt `html[data-motion="reduced"]`, Schrift +12,5 % und `text-soft`/`text-accent` auf Ink (≥ 7:1). Gespeichert in `localStorage` mit try/catch.
  - Sprachen, Social-Links als Text, Impressum, Datenschutz und Privatsphäre-Einstellungen.
- Alle internen Links aus dem alten Footer sind erhalten: 8 Kategorien, 10 Marken, Über uns, Kontakt, Beratung, Newsletter, Café und die Regionen. Neu dazu kommen weitere Regionen und Leistungen. Es gibt also keinen SEO-Verlust.

**Mobile CTA-Leiste** (`MobileCtaBar.js`, unter 768 px):
- 64 px hoch plus Safe Area: „Anrufen“ und „Termin wählen“.
- Sie erscheint erst, wenn kein Inhalts-CTA mehr sichtbar ist. Als Inhalts-CTA zählen `[data-cta="primary"]` und der `Button primary` aus `ui` innerhalb von `<main>`. Ohne solchen CTA erscheint sie nach 90 % der Viewport-Höhe.
- Sie tritt zur Seite, sobald der Footer sichtbar ist.
- Ausgeblendet ist sie auf Beratung, Portal, Upload, Labs und Preview. Im ausgeblendeten Zustand ist sie `inert`.

**Shell** (`client-layout.js`): Reihenfolge Header, `<main id="main" tabIndex=-1>`, Footer, CTA-Leiste, Consent. Der Aufruf `listenForContactClicks` ist erhalten.

**Texte:** Alle neuen Texte stehen im Namensraum `Shell`. `useShellCopy()` liest zuerst `Shell.*` aus den Messages und fällt sonst auf die Tabelle in `shellCopy.js` zurück. Der Vorschlag `messages-header-footer.json` ist aus dieser Tabelle generiert: 88 Schlüssel (Runde 2), DE/EN/FR/IT, Schlüssel geprüft identisch.

## 2. Dateien

- `src/components/Navbar/navbar.js`
- `src/components/Navbar/shellCopy.js`
- `src/components/Navbar/shellNav.js`
- `src/components/Navbar/HeaderFrame.js`
- `src/components/Navbar/DesktopNav.js`
- `src/components/Navbar/MobileMenu.js`
- `src/components/Navbar/SearchDialog.js`
- `src/components/Navbar/SelectionLink.js`
- `src/components/Navbar/LanguageSwitcher.js`
- `src/components/Navbar/Navbar.module.css`
- `src/components/Reusable/Footer.js`
- `src/components/Reusable/FooterIslands.js`
- `src/components/Reusable/MobileCtaBar.js`
- `src/app/[locale]/client-layout.js`
- `Marktresearch/digital/redesign/messages-header-footer.json`
- Selbsttest: `qa-screenshots/neuauftritt/header-footer/selbsttest/`

## 3. Prüfung

- ESLint für alle eigenen Dateien: 0 Probleme.
- `/de`, `/de/produkte`, `/en/products`, `/fr/produits` und `/it` liefern 200.
- ~~Bei 375 px gibt es keinen horizontalen Überlauf.~~ Runde 1 falsch gemessen (`innerWidth` wächst auf Mobilgeräten mit). Runde 2 per `scrollWidth`/`clientWidth` der Kopfzeile nachgewiesen, siehe §0.
- Mega-Menü per Klick geprüft: Esc gibt den Fokus an den Button zurück. Das mobile Menü schließt nach einem Tap. Der mobile Header blendet beim Scrollen aus.
- Seitenfehler: keine aus diesem Paket. Die iPhone-Aufnahmen im Selbsttest lieferten 500, weil eine fremde Datei `src/app/fehlerseite-global.preview/probe/fonts.js` den Build brach. Auf dem iPad meldete Next intern „Router action dispatched before initialization“ (HMR).

## 4a. Ticket an Fundament / Integration (QA P2-5) mit Patch-Vorschlag

**1. `scroll-padding` (globals.css, Fundament)** – heute 96 px bzw. 192 px ab 1024 px, für den alten Fixed-Header. Neu nach Bibel §6:

```css
html {
  scroll-padding-top: 5.5rem;    /* 88 px: 72 px Header + 16 px Luft */
  scroll-padding-bottom: 5rem;   /* 80 px: mobile CTA-Leiste */
}
/* den Block @media (min-width: 1024px) { html { scroll-padding-top: 12rem } } entfernen */
```

**2. Ruhige Ansicht vor dem ersten Paint (globals.css + layout.js)**

```css
/* globals.css – nach den :root-Tokens */
:root[data-view="calm"] {
  font-size: 112.5%;
  --color-text-soft: var(--color-ink);
  --color-text-accent: var(--color-ink);
}
```

```jsx
// layout.js – im <head>; next/script statt rohem <script>, weil ein rohes
// Script-Tag beim Sprachwechsel von React neu erzeugt wurde (Kommentar dort).
import Script from "next/script";
<Script id="ph-calm-view" strategy="beforeInteractive">
  {`try{if(localStorage.getItem("ph-calm-view")==="on"){var r=document.documentElement;r.dataset.motion="reduced";r.dataset.view="calm"}}catch(e){}`}
</Script>
// und <html … suppressHydrationWarning>, weil die data-Attribute vor der Hydration gesetzt werden.
```

Danach in `FooterIslands.js` (dieses Paket) die Inline-Stile in `applyCalmView` streichen und nur noch die beiden `data-`Attribute setzen – erst nach Merge des CSS, sonst fehlt der Effekt.

**3. Header und Footer als echte Server Components (layout.js, LoaderWrapper.js, Integration)** – heute rendert `client-layout.js` (`"use client"`) beide, also laufen sie im Client-Bundle mit. `navbar.js` und `Footer.js` haben kein `"use client"` und nutzen nur `useLocale`/`useTranslations`/`useMemo`, die in Server Components erlaubt sind.

```jsx
// layout.js
<LoaderWrapper messages={messages} locale={locale}>
  <Navbar activeCategoryKeys={activeCategoryKeys} />
  <main id="main" tabIndex={-1} className="overflow-x-clip focus:shadow-none focus:outline-none">{children}</main>
  <Footer activeCategoryKeys={activeCategoryKeys} />
</LoaderWrapper>

// client-layout.js → nur noch Provider + Inseln:
export default function ClientLayout({ children }) {
  useEffect(() => listenForContactClicks(), []);
  return (
    <CartProvider>
      {children}
      <MobileCtaBar />
      <CookieComponent />
    </CartProvider>
  );
}
```

Voraussetzung: `setRequestLocale(locale)` in `layout.js` (für `useTranslations` auf dem Server). Die Inseln (`SelectionLink` braucht `CartProvider`) liegen weiterhin unterhalb von `ClientLayout`, weil Navbar/Footer als `children` hineingereicht werden. `client-layout.js` gehört diesem Paket; die Umstellung erfolgt zusammen mit dem layout.js-Patch, damit die Seite zu keinem Zeitpunkt ohne Header ist.

## 4. Offene Punkte

1. ~~**Integration:** `Navbar` und `Footer` direkt in `layout.js` rendern~~ – erledigt in R4-shell-perf (§0c).
2. **Altes Offset entfernen:** `breadcrumbBar.js` (`pt-28 lg:pt-56`) und `Home/Hero.js` (`pt-28 … lg:pt-56`) polstern noch für den alten Fixed-Header. Mit dem Sticky-Header entsteht dort Leerraum. Das müssen die jeweiligen Eigentümer anpassen.
3. **`globals.css` (Fundament):**
   - `scroll-padding-top` auf 88 px setzen.
   - Ein Pre-Paint-Script in `layout.js` ergänzen, das `ph-calm-view` vor dem ersten Paint anwendet. Heute greift die Einstellung erst nach der Hydration, und die Schrift springt kurz.
   - Regeln für die Ruhige Ansicht besser zentral in `:root[data-view="calm"]` statt als Inline-Stil.
4. **`messages-header-footer.json` übernehmen** (Paket „Recht & Texte“). Danach kann die Fallback-Tabelle bis auf `LANGUAGES` entfallen. Die alten Schlüssel `Navbar.*` außer `search*`/`hours` und `Footer.*` außer `imprint`/`privacy`/`privacySettings`/`address.country` werden dann nicht mehr genutzt.
5. ~~**Öffnungszeiten:** doppelt~~ → erledigt in Runde 3: `OPENING_HOURS` in `lib/site.js` ist die einzige Quelle (§0b).
6. **Noch nicht umgesetzt:**
   - Seiten für „Projekte“ und „Schweiz & Liechtenstein“ fehlen, darum gibt es im Menü „Leistungen“ statt „Projekte“.
   - Region- und Währungswahl im Footer (§10.1).
   - Link zur Barrierefreiheitserklärung (Pflicht ab Shop-Start).
   - „Ihre Auswahl“ teilen und ins Terminmodul übergeben (Jury P1.11).
   - Das Terminmodul selbst. „Termin“ verlinkt bis dahin auf `/beratung`.
7. **Für die Seiten-Teams:** Den Hauptknopf der Seite mit `Button variant="primary"` oder `data-cta="primary"` setzen, dann steuert er die CTA-Leiste.
8. **Logo:** Die Wortmarke und das Lockup aus `@/components/Brand` sind Platzhalter bis zur Markenrecherche und Reinzeichnung.

## 5. Bilder

Header und Footer brauchen keine Bilder. Die alten Teaser-Fotos im Mega-Menü sind bewusst entfallen, weil ihre Rechte nicht geklärt sind und sie die Performance belasten. Später, nach Eintrag im Bildregister, ist je ein Raum-Foto (3:2, eigenes Shooting) pro Mega-Panel denkbar.

## 6. Stand Runde 5 (R5-shell-seo, 26.10.2026)

- **Site-Schema:** Das Layout rendert `siteSchema()` (`src/lib/seo/siteSchema.js`). Alle Fakten kommen aus `src/lib/site.js`: `LEGAL_NAME`, Adresse, Öffnungszeiten, `AREA_SERVED` (Region, Länder, die 5 indexierten Regionsstädte), `SOCIAL` plus Google-Profil als `sameAs`. `brand` nur über den Händler-Filter (ClassiCon), kein `aggregateRating`. `og:locale` überall aus `OG_LOCALE` in `pageMetadata.js` (de_AT, en_GB, fr_FR, it_IT).
- **Brotkrumen:** `ui/Breadcrumbs` setzt die erste Stufe einheitlich („Startseite“/„Home“/„Accueil“/„Home“, `src/lib/seo/breadcrumbs.js`). Zwischenstufen ohne eigene Seite (z. B. „Über uns“) bleiben sichtbar, fallen aber aus dem BreadcrumbList-JSON-LD.
- **Suche:** Bei HTTP 429 oder Fehler sagt der `aria-live`-Bereich des Suchblatts einen Hinweis an (Texte in `messages-r5-shell.json`).
- **Cookie-Leiste:** auf dem Handy kompakter (145 statt 153 px, Knöpfe weiter ≥ 44 px). Im Kundenportal reserviert `globals.css` Platz für beide Leisten, die Fußzeile liegt nicht mehr unter der Portal-Leiste.
- **Sprachwahl:** Der Name des Knopfs beginnt mit dem sichtbaren Kürzel („DE – Sprache wählen, aktuell Deutsch“, WCAG 2.5.3).
- **Entfernt:** `Reusable/breadcrumbBar.js` und die ungenutzte `.marquee`-Animation. Auf der Seite bewegt sich nichts mehr von selbst (WCAG 2.2.2).
