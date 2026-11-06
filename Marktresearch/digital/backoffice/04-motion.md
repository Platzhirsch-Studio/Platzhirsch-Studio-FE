# 04 – Bewegungskonzept Backoffice (UI-Motion)

**Zweck:** Verbindliche Regeln und Katalog für jede Bewegung im eigenen Next-Backoffice (`backoffice/`, Port 3100) inkl. Kiosk-Arbeitsplätze (Kassa, Packtisch, Montage, Technik). Für die Fachbereichs-Agenten und den Fundament-Agenten: Token, Auslöser, Dauer, Easing, Eigenschaften, Code-Skizze je Animation. Kein Spektakel – jede Bewegung beantwortet eine Frage des Benutzers („Was ist passiert?“, „Wo ist es hin?“, „Hat es geklappt?“).

**Stand:** 2026-11-04. Geprüft gegen `backoffice/src/app/globals.css`, `backoffice/src/components/Backoffice/*` (Toast, Kanban, Seitenleiste, Bestaetigen, Kennzahl, Charts, Kiosk/hooks, loading.js), Website-Motion-Fundament `src/app/globals.css` (§8, Token `--ease-quiet` …) und `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` (Next 16.4.1, React 19.2: `import { ViewTransition } from "react"`, `<Link transitionTypes>`, `router.push(href, { transitionTypes })`).

**Umsetzung ausschließlich mit:** CSS-Transitions/-Animations (inkl. `@starting-style`, `transition-behavior: allow-discrete`, `linear()`), View Transitions API über Reacts `<ViewTransition>`, Web Animations API (`element.animate()`). Keine Zusatzbibliothek (kein framer-motion, kein auto-animate, kein GSAP).

---

## 1. Prinzipien

| Nr. | Regel | Begründung / Folge |
|---|---|---|
| P1 | **Jede Animation hat genau einen Zweck**: Herkunft zeigen (woher kam es), Ziel zeigen (wohin ging es), Zustand bestätigen (gespeichert, gescannt, gedruckt) oder Aufmerksamkeit lenken (Fehler). Dekoration ist keiner. | Vor dem Einbau: Zweck in einem Satz benennbar, sonst weglassen. |
| P2 | **Dauer 120–240 ms** für alles, was auf eine Eingabe folgt. Darunter wirkt es wie ein Fehler, darüber wartet der Benutzer. Ausnahmen nur aus Tabelle §2.3. | Backoffice-Mitarbeiter lösen hunderte Aktionen pro Tag aus; 100 ms gespart × 500 Aktionen = fast eine Minute. |
| P3 | **Ankommen langsam, Verschwinden schnell**: Eintritt 160–240 ms ease-out, Austritt 80–120 ms ease-in. Nie symmetrisch. | Neues braucht Zeit zum Erfassen, Altes soll nicht um Aufmerksamkeit konkurrieren (so auch Next-Guide, 150/210 ms). |
| P4 | **Nur `transform`, `opacity`, `clip-path`, `stroke-dashoffset`** werden animiert (Compositor). Farben (`color`, `background-color`, `border-color`, `outline-color`) nur für Hover/Fokus mit ≤ 160 ms. **Nie** `width`, `height`, `top`, `left`, `margin`, `padding` – Ausnahme: Seitenleisten-Breite (ein Element, selten) und Listen-Zeilen-Kollaps über `grid-template-rows`. | 60 fps am iPad der Kassa; keine Layout-Sprünge im Formular. |
| P5 | **Kein Overshoot/Spring außer beim Kanban-Drop** (und dort nur in der Ablage). Kein Bounce, kein Wobble, kein Parallax, keine Konfetti. | Platzhirsch-Sprache ist ruhig (Website: `--ease-pop` nur für das Merk-Herz). |
| P6 | **Stagger ≤ 3 Stufen à 20–30 ms**, Gesamtversatz ≤ 90 ms. Listen mit > 8 Einträgen: kein Stagger. | Sonst fühlt sich eine Liste mit 50 Zeilen „langsam“ an, obwohl die Daten da sind. |
| P7 | **Rückmeldung ≤ 100 ms** nach jedem Klick/Tipp (Druck-Zustand 1 px, Farbe). Was länger dauert, zeigt nach **300 ms** Wartezustand (Spinner-Verzögerung), nie früher. | Vermeidet Flackern bei schnellen Antworten (Mock < 50 ms) und „ist es angekommen?“ bei Frappe-Antworten (200–800 ms). |
| P8 | **Kiosk (Kassa/Packtisch/Montage/Technik): Bewegung halbiert.** Keine Seitenübergänge, keine Listen-Stagger, keine Hover-Transitions (`@media (hover: hover)`). Nur: Scan-Bestätigung, Druck-Feedback, Toast, Dialog, Erfolgsmoment. | Touch, Handschuhe, Zeitdruck an der Kassa; Scanner feuert 2 Codes/Sekunde. |
| P9 | **`prefers-reduced-motion: reduce` ⇒ Bewegung weg, Crossfade bleibt** (Opazität 120 ms). Nichts wird unsichtbar, nichts wartet auf eine Animation, keine Information steckt nur in der Bewegung (Scan-Erfolg hat immer Farbe + Text + Symbol). | WCAG 2.3.3; Mitarbeiter mit Migräne/vestibulären Beschwerden. Kein eigener Schalter im Backoffice; die Systemeinstellung genügt (die Website hat zusätzlich „Ruhige Ansicht“, das Backoffice nicht). |
| P10 | **Server-gerenderter Erstzustand animiert nicht.** Kennzahlen, Charts, Listen erscheinen beim Seitenaufbau fertig (Streaming mit Skeleton, dann Reveal). Hochzählen/Einblenden nur bei **Änderungen nach dem Laden** (Server Action, `router.refresh()`, Live-Daten). | Sonst Flash „Zahl → 0 → Zahl“ bei Hydration (Design-Jury-Fehler der Website beim Herz, P1-1). |
| P11 | **Eine Signatur je Ablauf.** Ein Erfolgsmoment (§3.13) pro abgeschlossenem Vorgang (Rechnung gestellt, Tagesabschluss, Lieferschein übergeben), nicht pro Speichern. | Bedeutung bleibt erhalten. |
| P12 | **Pointer bleibt frei.** `::view-transition { pointer-events: none }`, Toasts `pointer-events: none` außer Knöpfe, Overlays nur bei echten Modalen. | Schnelles Arbeiten (Enter, nächster Klick) darf nie in einer Animation verhungern. |

---

## 2. Token und Kurven

### 2.1 Token (`backoffice/src/app/globals.css`, `@theme static`) – Vorschlag fürs Fundament

```css
@theme static {
  /* Dauer */
  --bo-dur-ack: 50ms;     /* Druck-Zustand Knopf */
  --bo-dur-fast: 120ms;   /* Hover, Fokus, Austritt, Fade */
  --bo-dur-base: 160ms;   /* Eintritt Liste/Menü/Dialog, Seitenwechsel neu */
  --bo-dur-move: 200ms;   /* Seitenleiste, Sheet, Kanban-Rückkehr */
  --bo-dur-slow: 240ms;   /* Chart-Balken, Scan-Bestätigung, Erfolgsmoment Karte */
  --bo-dur-spring: 320ms; /* NUR Kanban-Ablage */
  --bo-dur-draw: 400ms;   /* NUR Häkchen/Linie zeichnen, Zahlen hochzählen */
  --bo-dur-shimmer: 1400ms;
  --bo-stagger: 24ms;
  --bo-spinner-delay: 300ms;

  /* Kurven */
  --bo-ease-out: cubic-bezier(0.22, 1, 0.36, 1);      /* = Website --ease-quiet: alles, was ankommt */
  --bo-ease-in: cubic-bezier(0.4, 0, 1, 1);           /* = --ease-exit: alles, was geht */
  --bo-ease-inout: cubic-bezier(0.65, 0, 0.35, 1);    /* Morph, Seitenleiste, Zeichnen */
  --bo-ease-linear: linear;                            /* Shimmer, Undo-Balken */
  /* Spring (nur Kanban-Drop): gedämpfte Feder, 1 Überschwinger ≈ 4 %, dann Ruhe */
  --bo-ease-spring: linear(0, 0.262 6.9%, 0.587 13.9%, 0.868 21.4%, 1.038 29.6%, 1.064 35.2%,
                           1.041 42.6%, 1.006 52.4%, 0.993 61.2%, 0.999 75%, 1);
  --bo-ease-spring-fallback: cubic-bezier(0.34, 1.3, 0.64, 1); /* falls linear() fehlt */
}
```

Vorhandene Werte angleichen: `Knopf` (`duration-150` → `--bo-dur-fast`), `Seitenleiste` (`duration-200` bleibt, Kurve `--bo-ease-inout`), `.bo-skeleton` (1.4 s bleibt), `Kennzahl`/`Kanban` `transition-colors` → `--bo-dur-fast`.

### 2.2 Kurven im Bild

```
ease-out (0.22,1,0.36,1)        ease-in (0.4,0,1,1)         inout (0.65,0,0.35,1)        spring (linear())
1 ┤      ╭────────────           1 ┤                 ╭─     1 ┤          ╭────────        1 ┤     ╭─╮
  │    ╭─╯                         │               ╭─╯         │        ╭─╯                  │   ╭─╯ ╰──────
  │  ╭─╯                           │            ╭──╯           │      ╭─╯                    │  ╭╯
  │╭─╯                             │      ╭─────╯              │ ╭────╯                      │╭─╯
0 ┼╯─────────────────── t        0 ┼──────╯──────────── t    0 ┼─╯─────────────────── t   0 ┼╯────────────── t
  Eintritt: schnell da,           Austritt: zögert, dann      Morph: weich an beiden        Ablage: landet, federt
  sanft zur Ruhe                  weg                         Enden                         4 % über, ruht bei 320 ms
```

### 2.3 Erlaubte Ausnahmen vom 120–240-ms-Fenster

| Fall | Dauer | Warum |
|---|---|---|
| Kanban-Ablage (Spring) | 320 ms | Feder braucht Zeit zum Ausschwingen; Bewegung endet optisch schon bei ~200 ms. |
| Häkchen zeichnen, Linien-Chart zeichnen | 400 ms | Zeichnen ist Fortschrittsanzeige, kein Ortswechsel. |
| Zahl hochzählen | 400 ms | Unter 300 ms ist der Zählvorgang nicht lesbar; dann lieber gar nicht. |
| Skeleton-Shimmer | 1400 ms Schleife | Lauflicht, nicht Bewegung eines Objekts. |
| Undo-Balken Toast | 5000 ms linear | Fortschrittsbalken (Zeit bis Ausführung), kein Motion-Effekt. |
| Zeilen-Hervorhebung nach Speichern | 1200 ms Ausblenden | Farbe, keine Bewegung; muss nach Scroll noch sichtbar sein. |

### 2.4 Reduzierte Bewegung – zentrale Regel

Die heutige Regel `* { transition-duration: 0.01ms !important }` ersetzen (sie tötet auch Fades und macht Dialoge „ploppend“):

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --bo-dur-ack: 0ms; --bo-dur-move: 0ms; --bo-dur-slow: 0ms;
    --bo-dur-spring: 0ms; --bo-dur-draw: 0ms; --bo-stagger: 0ms;
    /* fast/base bleiben 120 ms: Opazitäts-Crossfades sind erlaubt */
  }
  .bo-skeleton { animation: none; }
  [class*="bo-anim-"], .bo-bewegt { translate: 0 !important; scale: 1 !important; rotate: 0 !important; }
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) {
    animation-duration: 120ms !important; animation-name: bo-vt-fade-only !important;
  }
}
```

JS-Hilfe (ein Ort, `src/components/Backoffice/motion.js`):

```js
"use client";
export const reduziert = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
export const dauer = (ms) => (reduziert() ? 0 : ms);
/** element.animate mit Reduzierung: bei reduce nur Opazität behalten, Transform-Keyframes entfernen. */
export function animiere(el, keyframes, opts) {
  if (!el?.animate) return { finished: Promise.resolve() };
  if (reduziert()) {
    const nurOpazitaet = keyframes.map((k) => ({ opacity: k.opacity ?? 1, offset: k.offset }));
    return el.animate(nurOpazitaet, { ...opts, duration: Math.min(opts.duration ?? 120, 120), easing: "linear" });
  }
  return el.animate(keyframes, opts);
}
```

E2E: Playwright-Projekte mit `reducedMotion: "reduce"` fahren (stabile Screenshots); ein eigener Spec `backoffice-motion.spec.js` prüft im Normalmodus nur, dass Elemente nach ≤ 400 ms Endzustand haben.

---

## 3. Katalog

Jeder Eintrag: **Auslöser → Dauer / Easing → Eigenschaften → Code**. Klassen heißen `bo-anim-*`, Keyframes `bo-*`.

### 3.1 Seitenwechsel (Backoffice, nicht Kiosk)

**Zweck:** Ruhe beim Wechsel zwischen Listen/Formularen; Seitenleiste und Kopfzeile stehen still, nur `<main>` wechselt. Keine Richtungsschübe (Backoffice ist ein Werkzeug mit Baumnavigation, kein Fotobuch); Ausnahme: Morph eines Titels Liste → Formular (opt-in).

**Auslöser:** `<Link>`-Navigation, `router.push`. Nicht: `router.refresh()`, Filterwechsel per searchParams (gleiche Route → kein View Transition, siehe 3.1.3).

**Dauer / Easing:** alt 80 ms `--bo-ease-in` (Fade), neu 160 ms `--bo-ease-out` (Fade + 4 px von unten), Start der neuen nach 40 ms Überlappung.

**Eigenschaften:** `opacity`, `translate`.

**Code (Seite, nicht Layout – Layouts persistieren, dort feuert enter/exit nie):**

```jsx
// src/app/<bereich>/<seite>/page.js – innerhalb <Shell>
import { ViewTransition } from "react";
<ViewTransition enter="bo-seite" exit="bo-seite" default="none">
  <div>{/* Seitenkopf + Inhalt */}</div>
</ViewTransition>
```

```css
::view-transition { pointer-events: none; }                 /* Klicks laufen durch */
::view-transition-old(.bo-seite) { animation: 80ms var(--bo-ease-in) both bo-fade reverse; }
::view-transition-new(.bo-seite) {
  animation: 160ms var(--bo-ease-out) 40ms both bo-fade, 160ms var(--bo-ease-out) 40ms both bo-rise-4;
}
@keyframes bo-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes bo-rise-4 { from { translate: 0 4px } to { translate: 0 0 } }
@keyframes bo-vt-fade-only { from { opacity: 0 } to { opacity: 1 } }

/* Seitenleiste + Kopfzeile verankern (sonst flackern sie mit) */
::view-transition-group(bo-nav), ::view-transition-group(bo-kopf) { animation: none; z-index: 100; }
::view-transition-old(bo-nav), ::view-transition-old(bo-kopf) { display: none; }
::view-transition-new(bo-nav), ::view-transition-new(bo-kopf) { animation: none; }
```

```jsx
// Shell.js: <nav style={{ viewTransitionName: "bo-nav" }}>, <header style={{ viewTransitionName: "bo-kopf" }}>
```

**3.1.1 Morph Titel (opt-in, Liste/Kanban → Formular):** `<ViewTransition name={`doc-${name}`} share="bo-morph" default="none">` um den Titel der Karte/Zeile **und** um `<h1>` im Formularkopf. Nur Titeltext, nie die ganze Karte (Hit-Testing ist für benannte Elemente während der Transition aus). 200 ms `--bo-ease-inout`:

```css
::view-transition-group(.bo-morph) { animation-duration: 200ms; animation-timing-function: var(--bo-ease-inout); }
```

Greift nur, wenn das Ziel bereits im Cache ist (Prefetch); sonst Fallback = 3.1 ohne Morph. Kein Fehlerfall sichtbar.

**3.1.2 Zurück (Browser-Back):** kein Transition-Typ ⇒ `default="none"` ⇒ sofortiger Wechsel. Gewollt.

**3.1.3 Gleiche Route, neue Daten (Filter, Sortierung, Seite 2):** kein View Transition. Stattdessen `useTransition`: während `isPending` nach 300 ms `<main data-wartet>` → Inhalt `opacity: .6` (120 ms), Cursor `progress`. Verschwindet mit den neuen Daten (120 ms). Keine Skelette (die alte Tabelle bleibt lesbar).

**3.1.4 Kiosk:** kein `<ViewTransition>`. Wechsel Kassa-Teilansichten (Kunde → Positionen → Zahlung) per `display` ohne Animation; einzig der Fokus wandert (3.11).

**Leer-/Fehlerzustand:** `Leer`- und `Fehler`-Komponente erscheinen wie Inhalt (3.1), nicht gesondert.

### 3.2 Seitenleiste auf/zu

**Zweck:** Mehr Platz für breite Tabellen; Benutzer sieht, dass die Beschriftungen „eingeklappt“ sind, nicht verschwunden.

**Auslöser:** Knopf „Einklappen“ (`aria-pressed`), Tastenkürzel `[` (wie Linear/Notion `⌘\` – hier ohne Modifier nur außerhalb von Eingaben; Kürzel über `useTastenkuerzel`), localStorage beim Laden (kein Animieren beim ersten Rendern: Klasse `bo-nav-bereit` erst nach Mount setzen).

**Dauer / Easing:** Breite 200 ms `--bo-ease-inout` (240 → 64 px, einzige erlaubte Breiten-Transition). Beschriftungen: beim Einklappen 80 ms `--bo-ease-in` Opazität aus **vor** der Breite (Start 0 ms), beim Ausklappen 120 ms `--bo-ease-out` **nach** der Breite (Verzögerung 120 ms). Untereinträge (aktiver Bereich): `grid-template-rows 0fr→1fr` 160 ms.

**Eigenschaften:** `width` (Ausnahme), `opacity`, `grid-template-rows`.

**Code:**

```css
nav#bo-nav { transition: width var(--bo-dur-move) var(--bo-ease-inout); }
nav#bo-nav:not(.bo-nav-bereit) { transition: none; }
nav#bo-nav .bo-nav-label { transition: opacity 120ms var(--bo-ease-out) 120ms; }
nav#bo-nav[data-eingeklappt="true"] .bo-nav-label { opacity: 0; transition: opacity 80ms var(--bo-ease-in); }
.bo-subnav { display: grid; grid-template-rows: 1fr; transition: grid-template-rows 160ms var(--bo-ease-inout); }
.bo-subnav[hidden] { display: grid; grid-template-rows: 0fr; }
.bo-subnav > ul { overflow: hidden; min-height: 0; }
```

Hinweis zur Umsetzung: heute wird `md:sr-only` genutzt (sofortiger Sprung). Für die Transition die Beschriftung im DOM lassen (`.bo-nav-label`, `aria-hidden` wenn eingeklappt) und `title` am Link behalten.

**Mobil (Schublade < md):** Öffnen: `translate: -100% → 0` 200 ms `--bo-ease-out`, Hintergrund-Abdunklung `opacity 0→1` 160 ms. Schließen: 160 ms `--bo-ease-in`, Abdunklung 120 ms. Fokus beim Öffnen auf erstes Link, Esc schließt (vorhanden). Abdunklung mit `@starting-style` + `transition-behavior: allow-discrete`, damit das Element auch beim Austritt animiert und dann entfernt wird (siehe 3.5 für das Muster).

**Aktiver Eintrag:** Hintergrund `--color-bo-nav-active` 120 ms; kein wandernder Balken (Linear macht keinen, Notion auch nicht; weniger Zustand).

### 3.3 Listen-Einträge erscheinen / verschwinden

**Zweck:** Nach einer Aktion (Datensatz angelegt, Zeile aus Kanban zurück in Liste, Massenaktion, Filter löscht Zeilen) zeigt die Bewegung, **welche** Zeile neu ist oder weg ist.

**Gilt für:** `DataTable`-Zeilen (`<tr>`), Kanban-Karten in einer Spalte, Zeitleisten-Einträge, Glocke-Einträge, Positionszeilen Kassa/Packtisch. Nicht für den Erstaufbau (P10) und nicht beim Seitenwechsel (Seite 1 → 2).

**Erscheinen – Auslöser:** Eintrag kommt nach Mount ins DOM. **Dauer:** 160 ms `--bo-ease-out`, Stagger 24 ms, max. 3 Stufen. **Eigenschaften:** `opacity 0→1`, `translate 0 -4px → 0`. Hintergrund-Hervorhebung (siehe unten) zusätzlich.

```css
.bo-anim-eintrag { transition: opacity var(--bo-dur-base) var(--bo-ease-out), translate var(--bo-dur-base) var(--bo-ease-out); }
@starting-style { .bo-anim-eintrag { opacity: 0; translate: 0 -4px; } }
.bo-anim-eintrag:nth-child(2) { transition-delay: var(--bo-stagger); }
.bo-anim-eintrag:nth-child(3) { transition-delay: calc(2 * var(--bo-stagger)); }
```

Die Klasse erst **nach** der Hydration an neue Einträge geben (Komponente merkt sich `mountedAt`; Einträge mit `creation`/lokalem Flag `neu: true` bekommen `.bo-anim-eintrag`). Tabellenzeilen: `translate` auf `<tr>` funktioniert in Chromium/Safari; für Firefox-Sicherheit die Zellen (`td > div`) animieren oder nur Opazität + Hervorhebung.

**Hervorhebung „das ist deine Zeile“ (nach Speichern/Anlegen, nach Rücksprung aus dem Formular mit `?markiert=<name>`):** Hintergrund Sand 14 % → transparent über 1200 ms linear, Start nach 200 ms (erst da sein, dann abklingen). `scrollIntoView({ block: "nearest" })` ohne `smooth` (Scroll-Animation ist Bewegung, die bei reduce stört; `nearest` scrollt meist gar nicht).

```css
@keyframes bo-markiert { from { background-color: rgb(138 122 102 / 0.14) } to { background-color: transparent } }
.bo-row[data-markiert="true"] { animation: bo-markiert 1200ms linear 200ms both; }
```

**Verschwinden – Auslöser:** Löschen, Massenaktion „Archivieren“, Karte verlässt Spalte, Position aus Bon entfernen. React entfernt sofort; deshalb WAAPI vor dem Unmount:

```js
// motion.js
export async function abgang(el) {
  if (!el) return;
  const h = el.getBoundingClientRect().height;
  el.style.overflow = "hidden";
  await animiere(el, [
    { opacity: 1, height: `${h}px`, offset: 0 },
    { opacity: 0, height: `${h}px`, offset: 0.5 },
    { opacity: 0, height: "0px", paddingTop: 0, paddingBottom: 0, marginBottom: 0, offset: 1 },
  ], { duration: 200, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" }).finished;
}
// Verwendung: await abgang(zeilenRef.current); setListe(l => l.filter(...));
```

Reihenfolge Zustand: erst Opazität (0–100 ms), dann Höhe (100–200 ms) – die Nachbarn rücken nach, **nachdem** klar ist, was weg ist. Bei `reduce`: nur Opazität 120 ms, dann entfernen (Nachbarn springen, akzeptiert). Bei Serverfehler nach optimistischem Entfernen: Zeile kommt als 3.3-Eintritt zurück + Fehler-Toast; kein „Zurückwachsen“.

**Leer-Zustand nach letzter Zeile:** `Leer` erscheint mit 160 ms Fade (Klasse `bo-anim-eintrag` ohne translate), **erst nachdem** der Abgang fertig ist (`await`).

### 3.4 Kanban-Drag mit Spring

**Zweck:** Karte fühlt sich angehoben an, Zielspalte ist eindeutig, Ablage „setzt sich“, ungültige Ablage kehrt sichtbar zurück. Heute (Kanban.js): Karte wird mit `opacity-40` markiert, kein sichtbarer Geist – das ergänzen.

**Zustände:** `ruhe` → `greifen` (Pointer down + 4 px Bewegung mit Maus / 150 ms Halten mit Touch – vorher ist es ein Klick auf den Link) → `ziehen` → `ablegen-gueltig` | `ablegen-ungueltig` | `abbrechen` (Esc, Pointer cancel) → `ruhe`.

| Phase | Dauer / Easing | Eigenschaften | Beschreibung |
|---|---|---|---|
| Greifen | 120 ms `--bo-ease-out` | `scale 1→1.02`, `box-shadow` Ebene 2 (`0 8px 24px rgb(31 37 43/.18)`), `rotate 0→0.6deg` (nur Maus; Touch 0) | Platzhalter in der Spalte bleibt (Original bei `opacity .35`, gestrichelter Rand). Cursor `grabbing`. `will-change: transform` **nur** jetzt setzen. |
| Ziehen | 0 ms (folgt Pointer) | `translate3d(dx, dy, 0)` am Geist (`position: fixed`, `pointer-events: none`) | Geist = Klon der Karte (`cloneNode(true)`, gleiche Breite). Pointer-Position über `requestAnimationFrame` gedrosselt (eine Transform-Schreibung je Frame). Zielspalte: Rahmen `--color-bo-text` 120 ms; nicht erlaubte Spalte: Rahmen `--color-bo-danger/50` + Cursor `not-allowed`. |
| Ablage gültig | 320 ms `--bo-ease-spring` (Fallback `--bo-ease-spring-fallback` 240 ms) | `translate` vom Loslasspunkt zum Slot (FLIP), `scale 1.02→1`, `rotate→0`, Schatten → Ebene 1 in 160 ms | Optimistisch: Karte steht logisch sofort in der neuen Spalte (`useOptimistic` vorhanden); Geist fliegt in den neuen Slot, dann Geist entfernen und echte Karte zeigen. Spaltenzähler ändert sich mit 3.9 (ohne Hochzählen: Direktwechsel, 1 Schritt). |
| Ablage ungültig / Abbruch | 200 ms `--bo-ease-out` | `translate` zurück zum Ursprung, `scale→1` | Kein Spring beim Zurück (Rückkehr ist keine „Landung“). Danach Toast „Von A nach B gibt es keinen Übergang.“ (Text vorhanden). |
| Serverfehler nach Ablage | 200 ms `--bo-ease-out` | Karte fliegt vom neuen Slot zurück in den alten (FLIP) | plus Fehler-Toast, `router.refresh()` (vorhanden). |

**Code-Skizze (Ergänzung zu Kanban.js, nur Pointer-Events + WAAPI):**

```js
// Ablage gültig: FLIP vom Geist zum Zielslot
async function lande(geist, zielEl) {
  const a = geist.getBoundingClientRect(), b = zielEl.getBoundingClientRect();
  const springOk = CSS.supports("animation-timing-function", "linear(0, 1)");
  await animiere(geist, [
    { transform: `translate(${a.left}px, ${a.top}px) scale(1.02) rotate(0.6deg)` },
    { transform: `translate(${b.left}px, ${b.top}px) scale(1) rotate(0deg)` },
  ], { duration: springOk ? 320 : 240,
       easing: springOk ? "var(--bo-ease-spring)" : "cubic-bezier(0.34, 1.3, 0.64, 1)", fill: "forwards" }).finished;
  geist.remove();              // echte Karte war unter dem Geist schon da (opacity 0 → 1 ohne Transition)
}
```

Hinweis: `easing` in WAAPI akzeptiert keine `var()`; den `linear(...)`-String aus `getComputedStyle(document.documentElement).getPropertyValue("--bo-ease-spring")` lesen oder als JS-Konstante doppelt halten (eine Quelle: `motion.js` exportiert `SPRING`, CSS-Token bleibt Doku).

**Tastatur-Alternative** („Verschieben nach …“-Menü, vorhanden): Karte verlässt Spalte mit 3.3-Abgang (200 ms) und erscheint in der Zielspalte oben mit 3.3-Eintritt; **kein** Spring (es gibt keine Hand, die loslässt). Fokus wandert auf die Karte in der neuen Spalte.

**Autoscroll** beim Ziehen an den Rand des Boards: 8 px/Frame linear, ohne Easing (Easing bei Scroll verursacht Überschießen).

**Leer-Zustand Spalte:** `min-height 80px` (vorhanden); als Ziel erhält die leere Fläche denselben Rahmen wie die Spalte, kein „Einfügen hier“-Platzhalter-Sprung.

### 3.5 Dialog und Sheet

**Dialog (`Bestaetigen`, natives `<dialog>`):**
- Öffnen: 160 ms `--bo-ease-out`; `opacity 0→1`, `scale .98→1` (Ursprung Mitte); `::backdrop` `opacity 0→1` 160 ms.
- Schließen: 120 ms `--bo-ease-in`; `opacity 1→0`, `scale 1→.98`; Backdrop 120 ms.
- Fokus: `autoFocus` auf Primärknopf (vorhanden); bei `gefaehrlich` auf **Abbrechen** (Enter darf nichts Irreversibles auslösen).
- Während `laeuft`: Knöpfe `disabled`, Primärtext „Bitte warten …“ erst nach 300 ms (P7), Dialog bleibt bis Antwort.

```css
dialog.bo-dialog {
  opacity: 0; scale: .98;
  transition: opacity var(--bo-dur-fast) var(--bo-ease-in), scale var(--bo-dur-fast) var(--bo-ease-in),
              overlay var(--bo-dur-fast) allow-discrete, display var(--bo-dur-fast) allow-discrete;
}
dialog.bo-dialog[open] { opacity: 1; scale: 1; transition-duration: var(--bo-dur-base); transition-timing-function: var(--bo-ease-out); }
@starting-style { dialog.bo-dialog[open] { opacity: 0; scale: .98; } }
dialog.bo-dialog::backdrop { background: rgb(15 22 36 / 0); transition: background var(--bo-dur-fast) var(--bo-ease-in), overlay var(--bo-dur-fast) allow-discrete, display var(--bo-dur-fast) allow-discrete; }
dialog.bo-dialog[open]::backdrop { background: rgb(15 22 36 / .4); }
@starting-style { dialog.bo-dialog[open]::backdrop { background: rgb(15 22 36 / 0); } }
```

Browser ohne `allow-discrete` (ältere Safari): Dialog erscheint/verschwindet ohne Animation – korrekt, kein Fehlerbild.

**Sheet (Seitenpanel rechts, 480 px: Schnellansicht eines Datensatzes aus Liste/Kanban, Filter-Erweiterung, Hilfe/Tastenkürzel `?`):**
- Öffnen: 200 ms `--bo-ease-out`; `translate 16px→0` + `opacity 0→1` (**kein** voller Slide von 480 px – zu viel Bewegung, zu langsam). Hintergrund-Abdunklung 160 ms wie Dialog, aber nur `rgb(15 22 36 / .2)`.
- Schließen: 120 ms `--bo-ease-in`; `translate 0→8px`, `opacity→0`.
- Inhalt im Sheet: kein Stagger. Skeleton → Inhalt nach 3.10.
- Esc schließt; Fokus kehrt zum Auslöser zurück (`<dialog>` erledigt das). Mobil/iPad hochkant: Sheet wird Vollbild, gleiche Werte.

**Menüs (Benutzer-Menü, Glocke, „Verschieben nach“, Spaltenwahl):** 120 ms `--bo-ease-out`, `opacity 0→1`, `translate 0 -4px → 0`, Ursprung oben; Schließen ohne Animation (`display:none` sofort – Menüs müssen weg sein, wenn der nächste Klick kommt). Befehlspalette (⌘K): wie Dialog, aber `scale .985`, 140 ms; Ergebnisliste wechselt **ohne** Animation (Tippen → sofort).

### 3.6 Toast mit Undo-Balken

**Zweck:** Bestätigen ohne Unterbrechung; bei rückgängig-fähigen Aktionen (Löschen, Archivieren, Status ändern, Position aus Bon entfernen) läuft sichtbar die Zeit, bis die Aktion endgültig ist.

**Zustände:** `eintritt` → `laeuft` (Balken) → `pausiert` (Hover/Fokus im Toast) → `ausgefuehrt` (Zeit abgelaufen) | `rueckgaengig` (Undo gedrückt) → `austritt`.

| Teil | Dauer / Easing | Eigenschaften |
|---|---|---|
| Eintritt | 160 ms `--bo-ease-out` | `opacity 0→1`, `translate 0 8px → 0` (unten rechts, Desktop) / `0 -8px` (oben Mitte, Kiosk) |
| Undo-Balken | 5000 ms `linear` (Fehler ohne Undo: kein Balken, 8 s) | `scale 1→0` auf X, `transform-origin: left`, 2 px hoch, Farbe `--color-bo-accent` |
| Pause | sofort | `animation-play-state: paused` (Balken) + Timer-Rest merken |
| Undo gedrückt | 120 ms | Balken `opacity→0`, Text wechselt „Wiederhergestellt“, Symbol `Undo2`→`Check` ohne Animation, Toast bleibt 1500 ms |
| Austritt | 120 ms `--bo-ease-in` | `opacity 1→0`, `translate 0→0 4px`; Nachbarn rücken per `grid-template-rows` 160 ms nach (oder: Liste hat feste Reihenfolge von unten, neuer Toast schiebt alte nach oben mit 160 ms `translate` via FLIP) |

**Semantik:** Die eigentliche Aktion wird **beim Ablauf** des Balkens an den Server gesendet (Variante A: verzögerter Commit, sicher und einfach) – bei optimistischer Oberfläche. Variante B (Server-Action sofort, „Rückgängig“ ruft Gegenaktion) nur dort, wo es eine echte Gegenaktion gibt (Status zurück). Variante A beim Verlassen der Seite: `pagehide`/`visibilitychange` → ausstehende Commits sofort per `navigator.sendBeacon` an eine Route (`/api/undo-commit`) oder vor Navigation `flush()` aufrufen; nie stillschweigend verwerfen.

**Code (Erweiterung `Toast.js`):**

```jsx
zeige("Lieferschein LS-00123 archiviert", { art: "ok", undo: { text: "Rückgängig", ms: 5000, onAblauf: commit, onUndo: wiederherstellen } });

// Element
<div className="bo-toast bo-anim-eintrag" onMouseEnter={pause} onMouseLeave={weiter} onFocus={pause} onBlur={weiter}>
  … <button onClick={undo}>Rückgängig <kbd>Z</kbd></button>
  <span className="bo-toast-balken" ref={balken} onAnimationEnd={() => onAblauf()} aria-hidden="true" />
</div>
```

```css
.bo-toast { transition: opacity var(--bo-dur-base) var(--bo-ease-out), translate var(--bo-dur-base) var(--bo-ease-out); }
@starting-style { .bo-toast { opacity: 0; translate: 0 8px; } }
.bo-toast-balken { position: absolute; left: 0; bottom: 0; height: 2px; width: 100%; background: var(--color-bo-accent);
  transform-origin: left; animation: bo-balken var(--undo-ms, 5000ms) linear forwards; }
.bo-toast:is(:hover, :focus-within) .bo-toast-balken { animation-play-state: paused; }
@keyframes bo-balken { from { scale: 1 1 } to { scale: 0 1 } }
@media (prefers-reduced-motion: reduce) { .bo-toast-balken { animation: none; scale: 1 1; } }
```

Bei `reduce`: Balken steht; stattdessen Text „Rückgängig (5 s)“ zählt sekündlich herunter (`setInterval`), Ablauf über `setTimeout` statt `animationend` (bei `reduce` feuert kein `animationend`; deshalb **immer** den Timer als Quelle nehmen und `animationend` nur ignorieren – eine Wahrheit). Pause bei Hover gilt auch für den Timer.

**Tastatur:** `Z` (ohne Modifier, außerhalb Eingaben) löst Undo des jüngsten Toasts aus; `Esc` schließt den jüngsten Toast (Commit läuft dann sofort).

**Stapel:** max. 3 sichtbar (heute 5); älteste fallen ohne Animation weg, wenn ein 4. kommt.

### 3.7 Zahlen hochzählen bei Kennzahlen

**Zweck:** Eine Änderung einer Kennzahl nach dem Laden (Live-Aktualisierung, `router.refresh()`, Umschalten Zeitraum) wird als Änderung wahrgenommen – „hat sich bewegt, in welche Richtung“.

**Nicht:** beim Erstaufbau (P10), nicht bei Datum/Uhrzeit, nicht bei Zählern > 4 Stellen Unterschied (dann Direktwechsel + Hervorhebung), nicht im Kiosk außer Bon-Summe.

**Auslöser:** `wert`-Prop ändert sich nach Mount. **Dauer:** 400 ms `--bo-ease-out` (ease-out: große Schritte zuerst, letzte Ziffern laufen aus). **Eigenschaften:** Textinhalt (JS, `requestAnimationFrame`), plus `color` 120 ms auf `--color-bo-text` nach kurzer Hervorhebung in `--color-bo-accent-text` (160 ms).

**Code (`Kennzahl` bekommt Client-Kind `Zahl`):**

```jsx
"use client";
function Zahl({ wert, format = (n) => n.toLocaleString("de-AT") }) {
  const [anzeige, setAnzeige] = useState(wert);
  const vorher = useRef(wert);
  useEffect(() => {
    const von = vorher.current, nach = wert; vorher.current = wert;
    if (von === nach || reduziert() || typeof von !== "number" || typeof nach !== "number") { setAnzeige(nach); return; }
    const start = performance.now(), d = 400, ease = (t) => 1 - Math.pow(1 - t, 3);
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / d);
      setAnzeige(Math.round(von + (nach - von) * ease(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [wert]);
  return <span className="tabular-nums" aria-live="off">{format(anzeige)}</span>;
}
```

Cent-Beträge: in Cent zählen, mit `cent()` formatieren; `tabular-nums` ist Pflicht (vorhanden), sonst zittert die Breite. Screenreader: `aria-live="off"` am Zähler, Endwert steht im `<p>` – kein 40-faches Vorlesen. Bon-Summe Kassa: 240 ms statt 400 (Scanner-Takt).

### 3.8 Chart-Einblendung

**Zweck:** Zeichnen zeigt Richtung und Reihenfolge der Daten; nur beim Erscheinen (Seitenaufbau nach Skeleton, Sheet öffnen, Zeitraum wechseln). Charts sind Server-Komponenten (SVG ohne JS) → reine CSS-Keyframes beim Einfügen, einmalig.

| Chart | Dauer / Easing | Eigenschaften | Detail |
|---|---|---|---|
| Balken | 240 ms `--bo-ease-out`, Stagger 20 ms, max. 12 Balken (ab 13: alle gleichzeitig) | `transform: scaleY(0→1)`, `transform-origin: bottom` (`transform-box: fill-box`) | Werte-Beschriftung `opacity 0→1` 120 ms, Start 160 ms |
| Linie | 400 ms `--bo-ease-inout` | `stroke-dashoffset 1→0` mit `pathLength="1"` | Fläche darunter `opacity 0→.12` 240 ms, Start 200 ms; Punkte `scale 0→1` 120 ms ab 320 ms |
| Donut | 400 ms `--bo-ease-inout`, Segmente nacheinander (Stagger = Anteil, nicht fix) | `stroke-dashoffset` je Segment | Zahl in der Mitte: Direktwert (kein Hochzählen) |
| Sparkline (in Kennzahl) | 240 ms `--bo-ease-out` | `clip-path: inset(0 100% 0 0 → 0 0 0 0)` | Billiger als dashoffset bei vielen Karten |

```css
.bo-chart-balken rect { transform-box: fill-box; transform-origin: bottom; animation: bo-wachsen var(--bo-dur-slow) var(--bo-ease-out) both; animation-delay: calc(var(--i, 0) * 20ms); }
@keyframes bo-wachsen { from { transform: scaleY(0) } }
.bo-chart-linie path.linie { stroke-dasharray: 1; stroke-dashoffset: 1; animation: bo-zeichnen var(--bo-dur-draw) var(--bo-ease-inout) forwards; }
@keyframes bo-zeichnen { to { stroke-dashoffset: 0 } }
```

`--i` als `style={{"--i": i}}` je `<rect>` im Server-Markup. Bei `reduce`: `--bo-dur-slow/draw = 0ms` ⇒ steht sofort. Tooltips (`<title>`) und `<details>`-Tabelle bleiben unberührt. Hover auf Balken: `fill` 120 ms heller, kein Scale.

Wechsel von Daten bei gleicher Route (Zeitraum-Chips): ganze `<figure>` 3.1.3 (abdunkeln bei Wartezeit), neue SVG zeichnet erneut – gewollt, weil es eine neue Antwort auf eine Frage ist.

### 3.9 Skeleton → Inhalt

**Zweck:** Wartezeit erträglich, Umschalten ohne Sprung. Gilt für `loading.js`, `DataTableSkeleton`, Sheet-Inhalt, Zeitleiste.

**Regeln:**
1. Skeleton hat **dieselbe Geometrie** wie der Inhalt (Zeilenhöhe 40 px Tabelle, Kennzahl-Karte 80 px, Seitenkopf 28 px). Sonst springt die Seite beim Tausch – keine Animation repariert das.
2. Shimmer: 1400 ms `linear` Schleife (vorhanden `bo-shimmer`), Lauflicht von links nach rechts, Farben `--color-bo-surface-3 → -2 → -3`. Bei `reduce`: statisch (vorhanden).
3. Skeleton erscheint **nicht** vor 300 ms – nicht möglich mit Streaming? Doch: Skeleton rendert mit `opacity: 0` und `animation: bo-fade 120ms 300ms forwards` – bei schneller Antwort (< 300 ms) sieht der Benutzer nie ein Skelett, nur den Inhalt.
4. Tausch: Skeleton `opacity 1→0` 80 ms `--bo-ease-in`; Inhalt `opacity 0→1` 160 ms `--bo-ease-out` mit 40 ms Überlappung, **ohne** translate (Geometrie ist identisch, also keine Bewegung nötig). Mit React `<ViewTransition>` um Suspense-Fallback und Inhalt (Muster aus Next-Guide Schritt 2, aber ohne `slide`):

```jsx
<Suspense fallback={<ViewTransition exit="bo-skelett" default="none"><DataTableSkeleton zeilen={10} /></ViewTransition>}>
  <ViewTransition enter="bo-inhalt" default="none"><Tabelle … /></ViewTransition>
</Suspense>
```

```css
::view-transition-old(.bo-skelett) { animation: 80ms var(--bo-ease-in) both bo-fade reverse; }
::view-transition-new(.bo-inhalt)  { animation: 160ms var(--bo-ease-out) 40ms both bo-fade; }
.bo-skeleton { opacity: 0; animation: bo-shimmer 1400ms linear infinite, bo-fade 120ms var(--bo-ease-out) var(--bo-spinner-delay) forwards; }
```

5. Kennzahlen-Zeile: alle 6 Karten gleichzeitig (kein Stagger, P6). Tabelle: alle Zeilen gleichzeitig.
6. Fehler statt Inhalt (`Fehler`-Komponente): Tausch identisch, zusätzlich linker Rand `--color-bo-danger` ohne Animation.

**Knopf-Wartezustand:** sofort `disabled` + `aria-busy`; nach 300 ms Text „Speichert …“ und ein 12-px-Kreis (SVG `stroke-dasharray`, 900 ms `linear` Rotation – die einzige rotierende Animation im System). Mindestanzeige 600 ms, sobald sichtbar (kein 20-ms-Flackern). Bei `reduce`: Kreis steht als Dreiviertel-Ring, nur Text.

### 3.10 Fokus-Ring

**Zweck:** Tastaturbenutzer sehen sofort, wo sie sind; der Ring „setzt sich“ kurz, damit das Auge ihn bei Tab-Sprüngen über große Distanz findet.

**Auslöser:** `:focus-visible` (nie `:focus` – Maus-Klick bekommt keinen Ring außer bei Eingabefeldern). **Dauer:** 120 ms `--bo-ease-out`. **Eigenschaften:** `outline-offset 0→2px`, `outline-color` von transparent → `--color-bo-focus`. Kein Scale, kein Pulsieren.

```css
:where(a, button, input, select, textarea, [tabindex], [role="row"], [role="option"]) {
  outline: 2px solid transparent; outline-offset: 0;
  transition: outline-color var(--bo-dur-fast) var(--bo-ease-out), outline-offset var(--bo-dur-fast) var(--bo-ease-out);
}
:where(…):focus-visible { outline-color: var(--color-bo-focus); outline-offset: 2px; }
.bo-input:focus-visible { outline-offset: 0; border-color: var(--color-bo-focus); }  /* Felder: Rand statt Abstand */
```

Dunkel: `--color-bo-focus` = Messing `#d1b250` (vorhanden). Kiosk: `outline-width: 3px` (Abstand zum Finger, Blick aus 70 cm). Tabellen-Zeilenfokus (`.bo-row[data-aktiv]`): Hintergrund `--color-bo-surface-2` 120 ms **plus** linker 2-px-Balken in `--color-bo-text` (kein Ring um die ganze Zeile – der flackert beim Scrollen). Fokus-Verlagerung nach Aktionen (Dialog zu → Auslöser; Karte verschoben → Karte; Zeile gelöscht → nächste Zeile) ist Teil der Bewegung: immer programmatisch setzen, nie dem Browser überlassen (`document.body`).

### 3.11 Kassa-Bon-Druck-Feedback

**Zweck:** An der Kassa ist der Drucker 1–3 s entfernt; die Oberfläche muss „Druckauftrag ist raus“ und „Bon fertig“ unterscheidbar zeigen, auch wenn der Drucker stumm bleibt.

**Zustände des Knopfs „Bon drucken“ (`F9`):** `bereit` → `sendet` (0–300 ms, nur `aria-busy`, Druck-Zustand 1 px) → `druckt` (ab 300 ms sichtbar) → `fertig` (1500 ms, dann zurück) | `fehler` (bleibt bis Klick).

| Zustand | Dauer / Easing | Eigenschaften | Bild |
|---|---|---|---|
| druckt | Schleife 900 ms `--bo-ease-inout` | im Drucker-Symbol (`Printer`, lucide) fährt ein 8×6-px-„Blatt“ über `clip-path: inset(100% 0 0 0 → 0 0 0 0)` nach oben heraus; Knopftext „Druckt …“ | `[▭] Druckt …` |
| fertig | 240 ms `--bo-ease-out`, Haken 400 ms (3.13) | Symbol wechselt zu `Check` mit Zeichnen; Bon-Vorschau rechts bekommt 1 px heller Rand und `translate 0 -2px → 0` (als ob er abgerissen wurde) | `[✓] Gedruckt` |
| fehler | 240 ms Shake wie 3.12, dann Ruhe | Rand `--color-bo-danger`, Text „Drucker antwortet nicht – nochmals (F9) oder A4 (Strg+P)“ | `[!] Druck fehlgeschlagen` |

Technisch: heute `window.print()` (synchron, blockiert) – dann gibt es nur `bereit → fertig` beim Rückkehren aus dem Druckdialog (`afterprint`-Ereignis). Mit Druckdienst (ESC/POS, später): Zustände aus der Antwort. Vorschau-Bereich Bon (80 mm Spalte): neue Position erscheint oben mit 3.3-Eintritt 120 ms (schneller als Backoffice: Scanner-Takt), Summe zählt 240 ms (3.7). Trainingsmodus: Band „TRAINING“ ohne Blinken (ein ruhiger, farbiger Streifen; Blinken ist nach 30 Minuten unerträglich).

```css
.bo-druck-blatt { clip-path: inset(100% 0 0 0); }
[data-druck="druckt"] .bo-druck-blatt { animation: bo-blatt 900ms var(--bo-ease-inout) infinite; }
@keyframes bo-blatt { 0% { clip-path: inset(100% 0 0 0) } 60%, 100% { clip-path: inset(0 0 0 0) } }
@media (prefers-reduced-motion: reduce) { [data-druck="druckt"] .bo-druck-blatt { animation: none; clip-path: inset(0 0 0 0); } }
```

### 3.12 Scan-Bestätigung (Kassa, Packtisch, Inventur, Montage-Produktpass)

**Zweck:** Der Blick ist beim Artikel, nicht am Bildschirm; die Rückmeldung muss aus dem Augenwinkel lesbar sein und drei Fälle trennen: **erkannt**, **unbekannt**, **schon abgehakt/doppelt**.

**Auslöser:** `useScanner` liefert Code (vorhanden) → Server Action / lokale Suche → Ergebnis innerhalb ~100 ms (Mock) bis 500 ms (Frappe). Rückmeldung sofort für „Code empfangen“ (Phase 1), Ergebnis in Phase 2.

| Phase / Fall | Dauer / Easing | Eigenschaften | Beschreibung |
|---|---|---|---|
| 1 Empfangen | 120 ms `--bo-ease-out` | Fußzeile „Letzter Scan: 4006…“ `opacity .6→1` | Nur Text – sagt „gehört“. |
| 2a Erkannt | 240 ms `--bo-ease-out` | Zeile erscheint (3.3, ohne Stagger), linker 3-px-Balken `--color-bo-ok` steht 1500 ms und blendet 400 ms aus; Scan-Feld (groß, oben) bekommt für 240 ms Rand `--color-bo-ok` | Zusätzlich Symbol `Check` + Text „Hinzugefügt: Artikelname“ – Farbe ist nie allein. Optionaler kurzer Ton (Web Audio, 60 ms Sinus 880 Hz) **nur** Packtisch/Inventur, pro Gerät einstellbar, Standard aus. |
| 2b Unbekannt | 240 ms `--bo-ease-inout`, danach Ruhe | Scan-Feld `translate` ±4 px, 3 Halbwellen (Shake); Rand `--color-bo-danger` bleibt bis zum nächsten Scan | Text „Unbekannter Code 4006… – Artikel suchen (F3)“, Fokus bleibt im Scan-Fluss. Bei `reduce`: kein Shake, Rand + Text + Symbol `AlertTriangle`. |
| 2c Doppelt / schon vollständig | 240 ms `--bo-ease-out` | Bestehende Zeile: Hintergrund `--color-bo-warn` 14 % → transparent 1200 ms (3.3-Hervorhebung in Warnfarbe), `scrollIntoView` ohne smooth; Menge zählt 1 Schritt (Direktwechsel, kein 3.7) | Text „Menge erhöht auf 3“ oder „Position bereits vollständig“. Kein Shake (es ist kein Fehler). |
| Packtisch: alle Positionen abgehakt | 3.13 Erfolgsmoment | | Knopf „Etikett drucken (F9)“ wird Primär-Knopf (Farbe 160 ms). |

```css
@keyframes bo-shake { 0%,100% { translate: 0 } 20% { translate: -4px } 50% { translate: 4px } 80% { translate: -2px } }
.bo-scan[data-ergebnis="unbekannt"] { animation: bo-shake 240ms var(--bo-ease-inout); border-color: var(--color-bo-danger); }
.bo-scan[data-ergebnis="erkannt"]   { border-color: var(--color-bo-ok); transition: border-color 120ms var(--bo-ease-out); }
@media (prefers-reduced-motion: reduce) { .bo-scan[data-ergebnis="unbekannt"] { animation: none; } }
```

`data-ergebnis` nach 1500 ms zurücksetzen (sonst läuft die Shake-Animation beim zweiten gleichen Ergebnis nicht erneut); alternativ `key={scanZaehler}` am Element.

Scanner-Takt: Wenn der nächste Code kommt, bevor die Animation fertig ist, wird sie **nicht** abgewartet – neuer Zustand ersetzt den alten sofort (keine Warteschlange von Animationen).

### 3.13 Erfolgsmoment nach Abschluss (dezent)

**Zweck:** Ein abgeschlossener Vorgang (nicht jedes Speichern) bekommt eine einzige, ruhige Bestätigung – das Gegenstück zum „Tischkarten“-Moment der Website (`.ph-arrive-card`, `.ph-tick`).

**Gilt für:** Rechnung gestellt / gebucht, Tagesabschluss gebucht, Bon abgeschlossen (Zahlung vollständig), Lieferschein „Zugestellt“ mit Unterschrift, Montageabnahme unterschrieben, Servicefall geschlossen, Bewerbung → Zusage gesendet, Inventur abgeschlossen. **Nicht für:** Speichern, Statuswechsel im Kanban, Kommentar.

**Form:** Eine Ergebnis-Karte (Belegnummer, Betrag, nächste Schritte als Knöpfe) ersetzt das Formular/die Zahlmaske.

| Teil | Dauer / Easing | Eigenschaften |
|---|---|---|
| Karte kommt | 240 ms `--bo-ease-out` | `opacity .6→1`, `translate 0 6px → 0` (6 px wie Website-Tischkarte) |
| Häkchen | 400 ms `--bo-ease-inout`, Start 120 ms nach Karte | Kreis steht, Haken zeichnet (`stroke-dashoffset 16→0`, `pathLength` 16) |
| Betrag/Belegnummer | ohne Animation | steht sofort (Belegnummer ist das Wichtigste – kein Hochzählen, keine Verzögerung) |
| Nächste Schritte (Knöpfe) | 160 ms `--bo-ease-out`, Start 200 ms | `opacity 0→1`, kein translate; Fokus auf den ersten Knopf („Bon drucken“, „Nächster Kunde (F2)“) nach 240 ms |

```jsx
<section className="bo-erfolg" role="status" aria-live="polite">
  <svg className="bo-tick" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 12.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" pathLength="16" />
  </svg>
  <h2>Rechnung RE-2026-00184 gestellt</h2> …
</section>
```

```css
.bo-erfolg { transition: opacity var(--bo-dur-slow) var(--bo-ease-out), translate var(--bo-dur-slow) var(--bo-ease-out); }
@starting-style { .bo-erfolg { opacity: .6; translate: 0 6px; } }
.bo-tick > path { stroke-dasharray: 16; stroke-dashoffset: 0; transition: stroke-dashoffset var(--bo-dur-draw) var(--bo-ease-inout) 120ms; }
@starting-style { .bo-tick > path { stroke-dashoffset: 16; } }
```

Kein Konfetti, kein Sound, keine Farbfläche. Farbe des Hakens: `--color-bo-ok`. Bei `reduce`: alles steht sofort, `aria-live` liest den Titel. Kassa: Karte bleibt bis `F2`/Tipp „Nächster Kunde“; Backoffice: Karte bleibt, Knöpfe führen weiter.

### 3.14 Kleinteile (vollständigkeitshalber, alle 120 ms)

| Element | Hover | Druck (`:active`) | Zustand |
|---|---|---|---|
| Knopf | `background-color` 120 ms `--bo-ease-out` (nur `@media (hover: hover)`) | `translate 0 1px` sofort, 50 ms zurück (wie `.ph-press`) | `disabled`: `opacity .5` ohne Transition |
| Tabellenzeile | `background-color` 120 ms | – | Auswahl-Checkbox: Häkchen `scale .8→1` 120 ms |
| Status-Badge Wechsel | – | – | Crossfade 120 ms über `key={status}` + `bo-anim-eintrag` ohne translate |
| Tabs (Formular) | Textfarbe 120 ms | – | Unterstrich: **kein** Gleiten; aktiver Tab setzt Rand sofort; Tab-Inhalt crossfade 120 ms (3.1.3-Logik) |
| Akkordeon/Abschnitt | – | – | `grid-template-rows 0fr↔1fr` 160 ms `--bo-ease-inout`, Chevron `rotate 0→90deg` 160 ms |
| Tooltip (`title`-Ersatz nur, wo nötig) | erscheint nach 600 ms Haltezeit, 120 ms Fade; verschwindet sofort | | |
| Verbindungsstatus Kiosk | – | – | Wechsel `verbunden↔offline`: Symboltausch ohne Animation, roter Hinweisbalken `grid-template-rows` 160 ms; **kein** Blinken |
| Glocke-Zähler | – | – | neuer Wert: `scale 1→1.15→1` 240 ms `--bo-ease-inout` einmal (einziger weiterer „Pop“, nur bei Zunahme nach Mount) |

---

## 4. Kiosk-Sonderregeln (Zusammenfassung)

- Keine View Transitions, kein Stagger, keine Hover-Transitions, keine Seitenleisten-Animation (es gibt keine).
- Erlaubt: 3.3 (Positionszeilen, 120 ms), 3.5 Dialog, 3.6 Toast (oben Mitte, 160 ms, Undo-Balken 5 s – bei Kassa-Storno einer Position), 3.7 nur Bon-Summe (240 ms), 3.10 Fokus 3 px, 3.11, 3.12, 3.13.
- Touch-Ziele ≥ 48 px: Druck-Zustand ist `background-color` (kein 1-px-Versatz; am Glas nicht sichtbar).
- Bildschirmschoner/Idle-Timeout (15 min): Sperrbild erscheint mit 240 ms Fade, verschwindet nach PIN sofort.

---

## 5. Umsetzungsordnung (Empfehlung an den Fundament-Agenten)

1. `backoffice/src/app/globals.css`: Token §2.1, Reduced-Motion-Regel §2.4 (ersetzt den `*`-Hammer), `::view-transition { pointer-events: none }`, Keyframes `bo-fade`, `bo-rise-4`, `bo-vt-fade-only`, `bo-markiert`, `bo-shake`, `bo-wachsen`, `bo-zeichnen`, `bo-balken`, `bo-blatt`; Klassen `.bo-anim-eintrag`, `.bo-toast*`, `.bo-dialog`, `.bo-erfolg`, `.bo-tick`, `.bo-scan`, `.bo-subnav`. Eine Datei, keine Streuung in Komponenten-CSS.
2. `backoffice/src/components/Backoffice/motion.js`: `reduziert()`, `dauer()`, `animiere()`, `abgang()`, `lande()`/FLIP, `SPRING`-Konstante.
3. Komponenten anpassen: `Toast.js` (Undo, Pause, Stapel 3), `Bestaetigen.js` (Klasse `bo-dialog`), `Kanban.js` (Geist, FLIP, Spring, Rückkehr), `Seitenleiste.js` (`bo-nav-bereit`, Label-Transition, `viewTransitionName`), `Shell.js` (`bo-kopf`), `Kennzahl.js` (`Zahl`), `Charts/index.js` (`--i`, Klassen), `DataTable.js` (`data-markiert`, Eintritt neuer Zeilen), `loading.js` (300-ms-Verzögerung), `KioskShell.js` (Toast-Position oben).
4. Seiten: `<ViewTransition enter/exit="bo-seite" default="none">` in jeder `page.js` unter `Shell`; Suspense-Grenzen mit `bo-skelett`/`bo-inhalt`.
5. Tests: Playwright `reducedMotion: "reduce"` in `playwright.config.js` für Screenshot-Stabilität; ein Normalmodus-Spec prüft Endzustände (Dialog sichtbar ≤ 200 ms, Toast weg ≤ 5,5 s, Kanban-Karte nach Drop in Zielspalte ≤ 400 ms); axe unverändert (keine neuen Regeln verletzt: `aria-live` am Zähler `off`, Shake nur mit Text).

## 6. Prüfliste je neuer Animation (vor dem Merge)

- [ ] Zweck in einem Satz (P1)? Dauer im Fenster oder in §2.3 gelistet?
- [ ] Nur `transform/opacity/clip-path/stroke-dashoffset` (+ Farbe bei Hover/Fokus)?
- [ ] Verhalten bei `prefers-reduced-motion: reduce` beschrieben und getestet – Information auch ohne Bewegung vorhanden (Farbe + Text + Symbol)?
- [ ] Erstaufbau nach SSR animiert nicht (P10)?
- [ ] Nächster Klick/Scan während der Animation funktioniert (P12)? Animation wird abgebrochen, nicht gestapelt?
- [ ] Fokus landet nach der Bewegung am richtigen Ort?
- [ ] Kiosk: in der Liste §4 erlaubt?
- [ ] Token statt Zahlen (`var(--bo-dur-*)`, `var(--bo-ease-*)`)?
