# 03 – Design-System „Platzhirsch Backoffice“

**Zweck:** Verbindliche Gestaltungs-Spezifikation für die eigene Next.js-Backoffice-App (`backoffice/`, Port 3100): Token, Typografie, Raster, Dichte, Icons, Komponentenkatalog mit Zuständen, Kiosk-Raster, Druck. Alles als Tailwind-4-`@theme`-Vorschlag mit konkreten Werten und gemessenem Kontrast, so dass die Fachbereichs-Agenten (CRM, Faktura, Kassa …) daraus bauen können, ohne Gestaltungsentscheidungen zu treffen.
**Stand:** 2026-11-04. Rolle: Design-System-Lead + Grafiker. Nur lesen in `backoffice/`, `src/`, `Backend-Import/`; diese Datei ist der einzige Schreibort.

**Grundlage (gelesen):** `src/app/globals.css` (Website-Token Level 1/2, Motion-Fundament, Druck), `backoffice/src/app/globals.css` (Stand Fundament: `--color-bo-*` hell/dunkel, `--radius-bo: 6px`, `--shadow-bo`, `.bo-input`, `.bo-skeleton`), `backoffice/src/components/Backoffice/*` (Knopf, StatusBadge, Shell 240/64 px, KioskShell, Charts), `Backend-Import/CONVENTIONS.md` §12 (Statusfarben), alle `fixtures/workflow_state.json` der 12 Apps (Styles Primary/Info/Success/Warning/Danger/Inverse), `PLAN-NEXT-BACKOFFICE.md`, `VORBILD-SHD`.

**Maßstab:** Linear (Dichte, Tastatur, Command Palette), Stripe Dashboard (Zahlen, Tabellen, Zustände), Shopify Admin (Formular-Karten, Statusbadges), Notion (Ruhe, Leerzustände), Square/Lightspeed POS (Kiosk-Ziele, Zahlen-Tastatur), Figma (Sheet/Panel-Logik). Übersetzt in die Platzhirsch-Sprache: Tinte statt Blau, Sand statt Violett, Haarlinien statt Schatten, Bodoni nur als Wortmarke und Kopfzahl.

---

## 0. Leitlinien (10 Regeln, die jede Komponente erfüllt)

1. **Eine Akzentfarbe für Handlung: Tinte.** Primärknopf, aktive Navigation, Fokus, markierte Zeile – alles Tinte `#30373e`. Sand `#8a7a66` ist Zier und Orientierung (Linien, Überschriften-Kicker, Diagramm-Sekundärfarbe), nie Handlung.
2. **Status ist Farbe + Text + Form.** Nie Farbe allein (Badge mit Wort, Punkt mit Label, Icon bei Warnung/Fehler).
3. **Haarlinien vor Schatten.** Flächen trennen sich über `--color-bo-line` (12 %) und Helligkeitsstufen (bg → surface → surface-2). Schatten nur für schwebende Dinge (Menü, Popover, Dialog, Toast, gezogene Karte).
4. **Radius 6 px (Steuerelemente) / 10 px (Karten, Dialog) / Pille (Badge, Avatar).** Die Website hat Radius 0; das Backoffice ist Werkzeug, nicht Magazin – die 6/10 px kommen aus dem Fundament und bleiben.
5. **Tabellenziffern überall, wo Zahlen untereinander stehen** (`font-variant-numeric: tabular-nums lining-nums`). Beträge rechtsbündig, Einheit nach der Zahl, Cent immer zweistellig.
6. **Mindestens 4,5:1 für Text, 3:1 für Steuerelement-Ränder und Icons**, hell und dunkel. Werte stehen unten; was nicht gemessen ist, wird nicht behauptet.
7. **Bewegung erklärt, Bewegung schmückt nicht.** Dauern 50 / 120 / 160 / 240 / 280 ms, nur `transform` und `opacity` (plus Farbwechsel). Alles steht unter `prefers-reduced-motion`.
8. **Touch-Ziele:** Backoffice ≥ 36 px Sichtgröße mit ≥ 44 px Zielfläche; Kiosk ≥ 48 px Sichtgröße, Zahlen-Tastatur ≥ 64 px.
9. **Jeder Zustand ist gezeichnet:** default, hover, active, focus-visible, disabled, loading, error, empty, readonly, selected, dragging.
10. **Texte kurz, deutsch, neutral.** Keine Superlative, keine Ausrufezeichen, kein „Oops“. Fehler sagen, was passiert ist und was man tun kann.

---

## 1. Farb-Token

### 1.1 Prinzip: drei Ebenen (wie die Website)

```
Level 1  Rohfarben      --color-paper, --color-ink, --color-sand …      nur in globals.css
Level 2  Rollen         --color-bo-surface, --color-bo-ink, --color-bo-accent …   das benutzen Komponenten
Level 3  Komponenten    .bo-input, .bo-row, .bo-kiosk-key …             nur wo Utilities nicht reichen
```

Das Fundament nennt die Rollen `--color-bo-*`. Dieser Vorschlag **behält alle vorhandenen Namen** (nichts bricht) und ergänzt die fehlenden semantischen Rollen (`muted`, `info`, `accent-soft`, Status-Tints, Overlay, Ring, Chart). Dunkel wird zusätzlich über `html[data-theme="dark"|"light"]` schaltbar (Benutzermenü), Standard bleibt System (`prefers-color-scheme`).

### 1.2 Level 1 – Rohfarben (hell und dunkel teilen sich diese Liste)

| Token | Hex | Herkunft / Zweck |
|---|---|---|
| `--color-paper` | `#faf8f4` | Website. Heller Text auf Tinte, Druckhintergrund-Nah |
| `--color-bone` | `#f7f5f1` | Website. surface-2 hell |
| `--color-stone` | `#ece8e1` | Website. surface-3 hell, Kanban-Spalten |
| `--color-linen` | `#e6e1d8` | Website. Skeleton-Basis |
| `--color-stone-deep` | `#d8d2c8` | Website. Sand-Sequenz Stufe 1 (Charts), Nav-Text soft |
| `--color-sand-300` | `#b8a78f` | **neu**. Sand-Sequenz Stufe 2, Akzent dunkel |
| `--color-sand` | `#8a7a66` | Vorgabe Inhaber. Akzent (Zier) |
| `--color-sand-700` | `#6b5d4b` | Fundament (`bo-accent-text`). Akzent-Text hell |
| `--color-pebble` | `#8a8174` | Website. Steuerelement-Rand hell (3,84:1) |
| `--color-ink-soft` | `#5c636a` | Website. Zweittext hell |
| `--color-ink-faint` | `#646b72` | Fundament. Dritttext/Platzhalter hell (5,40:1 auf Weiß) |
| `--color-ink` | `#30373e` | Tinte. Text, Handlung, Fokus |
| `--color-ink-deep` | `#1f252b` | Hover auf Tinte; surface dunkel |
| `--color-night` | `#0f1316` | Nav dunkel |
| `--color-see` | `#4f6b68` | Website. Info/„unterwegs“-Ton, Chart-Tertiärfarbe |
| `--color-brass-400` | `#d1b250` | Website. Fokusring + Akzent NUR auf dunklen Flächen |
| `--color-brass-500` | `#9a7a2a` | Website. Chart-Quartärfarbe hell |
| `--color-st-gruen` | `#15803d` | CONVENTIONS §12 |
| `--color-st-orange` | `#b45309` | CONVENTIONS §12 |
| `--color-st-rot` | `#b91c1c` | CONVENTIONS §12 |
| `--color-st-blau` | `#1d4ed8` | CONVENTIONS §12 |
| `--color-st-lila` | `#6d5a86` | **neu** – Frappe-Indikator „Purple“ (z. B. Trainingsmodus Kassa, Entwurf-Varianten) |

### 1.3 Level 2 – Rollen, hell (Standard)

Kontrast = WCAG 2.x, gemessen (sRGB-Luminanz), jeweils auf der angegebenen Fläche.

| Rolle | Wert | Kontrast / Nachweis |
|---|---|---|
| `--color-bo-bg` | `#f3f1ec` | Seitenhintergrund (App-Canvas) |
| `--color-bo-surface` | `#ffffff` | Karten, Tabellen, Eingaben. Gegen bg 1,13:1 – Trennung über Linie, nicht Helligkeit |
| `--color-bo-surface-2` | `#f7f5f1` (bone) | Zeilen-Hover, readonly-Felder, Zebra aus |
| `--color-bo-surface-3` | `#ece8e1` (stone) | Kanban-Spalte, Code, Tastenkappe |
| `--color-bo-surface-inverse` | `#30373e` (ink) | Tooltip, Toast dunkel, Seitenleiste |
| `--color-bo-ink` (= `bo-text`) | `#30373e` | 12,06:1 auf Weiß · 10,68:1 auf bg |
| `--color-bo-ink-soft` (= `bo-text-soft`) | `#5c636a` | 6,09:1 auf Weiß · 4,99:1 auf stone |
| `--color-bo-muted` (= `bo-text-faint`) | `#646b72` | 5,40:1 auf Weiß · 4,96:1 auf bone · 4,42:1 auf stone (nur ≥ 18,66 px dort) |
| `--color-bo-ink-inverse` | `#faf8f4` | 11,37:1 auf ink · 17,60:1 auf night |
| `--color-bo-ink-inverse-soft` | `#d8d2c8` | 8,02:1 auf ink · 12,42:1 auf night |
| `--color-bo-line` | `rgb(48 55 62 / 0.12)` | Haarlinie (dekorativ, kein Kontrastanspruch) |
| `--color-bo-line-strong` | `rgb(48 55 62 / 0.28)` | Trennlinie Tabellenkopf, Karte aktiv (≈ 2,0:1 – dekorativ) |
| `--color-bo-line-control` | `#8a8174` (pebble) | **Rand von Eingabefeldern/Checkbox/Radio** 3,84:1 ≥ 3:1 (WCAG 1.4.11). `line-strong` reicht dafür NICHT (2,0:1) → `.bo-input` auf `line-control` umstellen |
| `--color-bo-accent` | `#8a7a66` (sand) | Zier: Kicker-Linie, Kennzahl-Trennstrich, Chart 2. 4,15:1 – als Text nur ≥ 18,66 px / 14 px fett |
| `--color-bo-accent-text` | `#6b5d4b` | 6,38:1 auf Weiß · 5,42:1 auf accent-soft |
| `--color-bo-accent-soft` | `#f1ece4` | Sand-Tint: Hintergrund „Hinweis sanft“, Lila-Ersatz-Badge, ausgewählte Kachel |
| `--color-bo-action` | `#30373e` | Primärknopf. Weiß darauf 12,06:1 |
| `--color-bo-action-text` | `#faf8f4` | 11,37:1 |
| `--color-bo-action-hover` | `#1f252b` | |
| `--color-bo-action-soft` | `rgb(48 55 62 / 0.06)` | Ghost-Hover, aktiver Tab-Hintergrund |
| `--color-bo-focus` | `#30373e` | Ring 2 px + 2 px Abstand, 12,06:1 |
| `--color-bo-selected` | `#e9e4d9` | Ausgewählte Zeile/Karte (heller als Linen; Tinte auf Linen 9,26:1, hier also ≥ 9,26:1) |
| `--color-bo-nav` | `#30373e` | Seitenleiste hell = Tinte (Marke sichtbar, Inhalt weiß) |
| `--color-bo-nav-text` | `#faf8f4` | 11,37:1 |
| `--color-bo-nav-text-soft` | `#b5b1a8` | 5,64:1 auf ink (vorher stone-deep 8,02:1 – beides zulässig; b5b1a8 liest sich ruhiger als Sekundärebene) |
| `--color-bo-nav-active` | `rgb(250 248 244 / 0.12)` | Hintergrund aktiver Eintrag + 2 px Sand-Balken links |
| `--color-bo-overlay` | `rgb(31 37 43 / 0.40)` | Scrim hinter Dialog/Sheet |
| `--color-bo-success` | `#15803d` | 5,02:1 auf Weiß · 4,44:1 auf bg (→ auf bg nur als Icon/Rand ≥ 3:1 oder Text ≥ 18,66 px; Text auf Weiß/Tint) |
| `--color-bo-success-text` | `#166534` | 6,25:1 auf success-soft |
| `--color-bo-success-soft` | `#e7f3eb` | Badge-/Banner-Hintergrund |
| `--color-bo-warning` | `#b45309` | 5,02:1 auf Weiß · 4,45:1 auf bg (gleiche Regel wie success) |
| `--color-bo-warning-text` | `#8a4b06` | 6,04:1 auf warning-soft |
| `--color-bo-warning-soft` | `#fbf0e1` | |
| `--color-bo-danger` | `#b91c1c` | 6,47:1 auf Weiß · 5,73:1 auf bg. Weiß darauf 6,47:1 (Danger-Primärknopf) |
| `--color-bo-danger-text` | `#8f1d1d` | 7,59:1 auf danger-soft |
| `--color-bo-danger-soft` | `#fbe9e9` | |
| `--color-bo-info` | `#1d4ed8` | 6,70:1 auf Weiß · 5,94:1 auf bg. Weiß darauf 6,70:1 |
| `--color-bo-info-text` | `#1e40af` | 7,50:1 auf info-soft |
| `--color-bo-info-soft` | `#e8eefb` | |
| `--color-bo-progress` | `#4f6b68` (see) | „Unterwegs/in Prüfung“ (Frappe-Style **Info**), 5,78:1 auf Weiß |
| `--color-bo-progress-text` | `#2f5451` | 6,97:1 auf progress-soft |
| `--color-bo-progress-soft` | `#e4ecea` | |
| `--color-bo-special` | `#6d5a86` (lila) | 6,07:1 auf Weiß |
| `--color-bo-special-text` | `#54436b` | 7,36:1 auf special-soft |
| `--color-bo-special-soft` | `#eee9f4` | |
| `--color-bo-neutral-text` | `#5c636a` | 5,07:1 auf neutral-soft |
| `--color-bo-neutral-soft` | `#eceae5` | Badge „Entwurf/Archiviert“ |
| `--color-bo-skeleton` | `#e6e1d8` (linen) | |
| `--color-bo-skeleton-shine` | `rgb(250 248 244 / 0.7)` | |
| `--color-bo-disabled-text` | `#8a9097` | 3,22:1 – bewusst unter 4,5 (WCAG nimmt deaktivierte Elemente aus), aber noch lesbar |

### 1.4 Level 2 – Rollen, dunkel

Aktiv bei `@media (prefers-color-scheme: dark)` ohne `data-theme="light"` **und** bei `html[data-theme="dark"]`.

| Rolle | Wert | Kontrast / Nachweis |
|---|---|---|
| `--color-bo-bg` | `#171b1f` | |
| `--color-bo-surface` | `#1f252b` (ink-deep) | |
| `--color-bo-surface-2` | `#262d34` | |
| `--color-bo-surface-3` | `#30373e` | |
| `--color-bo-surface-inverse` | `#f3f1ec` | Tooltip hell auf dunkel |
| `--color-bo-ink` | `#f3f1ec` | 13,70:1 auf surface · 15,34:1 auf bg |
| `--color-bo-ink-soft` | `#c9c4bb` | 8,91:1 auf surface · 6,95:1 auf surface-3 |
| `--color-bo-muted` | `#a19b92` | 5,61:1 auf surface (Fundament hatte 9a958c = 5,19:1, ebenfalls ok) |
| `--color-bo-ink-inverse` | `#1f252b` | auf surface-inverse 13,70:1 |
| `--color-bo-line` | `rgb(250 248 244 / 0.12)` | |
| `--color-bo-line-strong` | `rgb(250 248 244 / 0.28)` | |
| `--color-bo-line-control` | `#8a9097` | 4,80:1 auf surface (≥ 3:1) |
| `--color-bo-accent` | `#b8a78f` (sand-300) | 6,60:1 auf surface |
| `--color-bo-accent-text` | `#d8ccb8` | 9,76:1 |
| `--color-bo-accent-soft` | `rgb(184 167 143 / 0.14)` | |
| `--color-bo-action` | `#f3f1ec` | |
| `--color-bo-action-text` | `#1f252b` | 13,70:1 |
| `--color-bo-action-hover` | `#ffffff` | |
| `--color-bo-action-soft` | `rgb(243 241 236 / 0.08)` | |
| `--color-bo-focus` | `#d1b250` (brass-400) | 7,51:1 auf surface · 8,40:1 auf bg |
| `--color-bo-selected` | `#2c3136` | |
| `--color-bo-nav` | `#0f1316` (night) | gegen surface 1,21:1 – Trennung über Linie |
| `--color-bo-nav-text` | `#f3f1ec` | 17,60:1 |
| `--color-bo-nav-text-soft` | `#a7a39b` | 7,43:1 |
| `--color-bo-nav-active` | `rgb(250 248 244 / 0.10)` | |
| `--color-bo-overlay` | `rgb(0 0 0 / 0.55)` | |
| `--color-bo-success` | `#7fc39b` | 7,50:1 auf surface |
| `--color-bo-success-text` | `#9ad7b3` | 8,30:1 auf success-soft |
| `--color-bo-success-soft` | `#213129` | |
| `--color-bo-warning` | `#e0b35c` | 7,93:1 |
| `--color-bo-warning-text` | `#e8c27a` | 8,43:1 auf warning-soft |
| `--color-bo-warning-soft` | `#33291b` | |
| `--color-bo-danger` | `#e07a7a` | 5,33:1 auf surface; ink-deep darauf 5,33:1 (Danger-Primärknopf dunkel) |
| `--color-bo-danger-text` | `#eea0a0` | 7,09:1 auf danger-soft |
| `--color-bo-danger-soft` | `#3a2224` | |
| `--color-bo-info` | `#93c5fd` | 8,58:1 |
| `--color-bo-info-text` | `#a9cdf7` | 8,76:1 auf info-soft |
| `--color-bo-info-soft` | `#1f2a3d` | |
| `--color-bo-progress` | `#8fbdb8` | 7,47:1 auf surface · 8,36:1 auf bg |
| `--color-bo-progress-text` | `#a3c9c5` | 7,53:1 auf progress-soft |
| `--color-bo-progress-soft` | `#1f3230` | |
| `--color-bo-special` | `#c7b8de` | 8,35:1 |
| `--color-bo-special-text` | `#cdbfe3` | 8,36:1 auf special-soft |
| `--color-bo-special-soft` | `#2c2738` | |
| `--color-bo-neutral-text` | `#c9c4bb` | 6,95:1 auf neutral-soft |
| `--color-bo-neutral-soft` | `#30373e` | |
| `--color-bo-skeleton` | `#262d34` | |
| `--color-bo-skeleton-shine` | `rgb(243 241 236 / 0.08)` | |
| `--color-bo-disabled-text` | `#6f767d` | |
| `--shadow-bo-*` | siehe §4, dunkel mit `rgb(0 0 0 / …)` | |

### 1.5 Status-Abbildung der Frappe-Zustände

Quelle: `workflow_state.json` aller Apps (Styles `Primary`, `Info`, `Success`, `Warning`, `Danger`, `Inverse`) und `DocType.states[].color` (Frappe-Indikatorfarben). `statusTon()` in `lib/backoffice/frappe/meta.js` liefert heute `blau|gruen|orange|rot|lila|grau`; die Tabelle ergänzt `tuerkis` für `Info`, damit „Neu/Offen“ (Primary) und „Unterwegs/In Prüfung“ (Info) unterscheidbar sind.

| Frappe-Style / Indikator | Ton | Rolle (Text / Fläche) | Punkt | Beispiele aus den Fixtures |
|---|---|---|---|---|
| `Primary`, Indikator Blue, Dark Blue | `blau` | `info-text` / `info-soft` | gefüllt | Neu, Offen, Geplant, Gesendet, Erfasst, Gestellt, Angelegt, Eingegangen, Interessent, Phase Anfrage, Vorgelegt, Erstellt, Hochgeladen |
| `Info`, Indikator Light Blue, Cyan | `tuerkis` | `progress-text` / `progress-soft` | halb (Ring) | Freigegeben, Versendet, Qualifiziert, Termin vereinbart, Teilbezahlt, Sachlich geprüft, In Bestellung, Etikett, Übergeben, Abholbereit, Versandbereit, Phase Planung/Auftrag/Lieferung, AB erhalten/geprüft, Beauftragt, Beendet |
| `Success`, Indikator Green | `gruen` | `success-text` / `success-soft` | Haken | Abgeschlossen, Aktiv, Bezahlt, Erledigt, Genehmigt, Veröffentlicht, Gewonnen, Kunde, Bestätigt, Abgerechnet, Angenommen, Zugestellt, Abgeholt, Eingestellt, Abgenommen, Phase Übergabe, Geliefert, Übernommen, Regress verrechnet |
| `Warning`, Indikator Orange, Yellow | `orange` | `warning-text` / `warning-soft` | gefüllt | Beantragt, In Arbeit, Pausiert, Angebot, Unbestätigt, Überfällig, Gepackt, Laufend, Freigabe, Ausgebucht, Eingereicht, Feedback offen, Mit Mängeln, Reserviert, Zahlung ausstehend, Teilerstattet, Teilgeliefert, Einsatz geplant, Eingelagert |
| `Danger`, Indikator Red | `rot` | `danger-text` / `danger-soft` | Dreieck-Icon (`triangle-alert` 12 px) | Abgebrochen, Abgelehnt, Gesperrt, Storniert, Widerrufen, Spam, Gemahnt, Uneinbringlich, Problem, Zurückgezogen, Checkout-Fehler, Fehlgeschlagen, Prüfen, Ausgelaufen, Gekündigt, Regress abgelehnt |
| `Inverse`, Indikator Gray, Darkgray | `grau` | `neutral-text` / `neutral-soft` | Ring leer | Entwurf, Archiviert, Verworfen, Inaktiv, Verloren, Nicht erschienen, Ersetzt, Idee, Abgesagt, Geschlossen, Abgelaufen, Eingelöst, Erstattet |
| Indikator Purple, Pink | `lila` | `special-text` / `special-soft` | gefüllt | Trainingsmodus (Kassa), Sonderfälle |
| `docstatus 2` (storniert) | `rot` + durchgestrichener Titel | | | immer zusätzlich Banner „Storniert am … von …“ |
| `docstatus 1` (gebucht) | Schloss-Icon `lock` 12 px neben Status | | | Formular readonly, Leiste zeigt „Gebucht“ |

Regel: **Workflow-Fortschritt links → rechts = grau → blau → türkis → orange → grün.** Rot ist immer Abbruch/Problem, nie „dringend aber normal“ (dafür orange + Frist-Text).

### 1.6 Chart-Farben

Kategorisch (max. 5 Serien, Reihenfolge fest):

| Serie | hell | dunkel | Kontrast auf surface |
|---|---|---|---|
| 1 | `#30373e` ink | `#f3f1ec` | 12,06 / 13,70 |
| 2 | `#8a7a66` sand | `#b8a78f` | 4,15 / 6,60 |
| 3 | `#4f6b68` see | `#8fbdb8` | 5,78 / 7,47 |
| 4 | `#9a7a2a` brass-500 | `#d1b250` | 4,05 / 7,51 |
| 5 | `#5c636a` ink-soft | `#c9c4bb` | 6,09 / 8,91 |

Sequenziell (Anteile, Heatmap, 5 Stufen hell → dunkel): `#d8d2c8 → #b8a78f → #8a7a66 → #5c636a → #30373e` (dunkel umgekehrt: `#30373e → #5c636a → #8a7a66 → #b8a78f → #d8d2c8`). Semantische Charts (bezahlt/offen/überfällig) nehmen die Status-Rollen. Negativwerte: `danger`. Raster/Achsen: `line` 12 %; Achsenbeschriftung `muted` 12 px.

### 1.7 Tailwind-4-`@theme`-Vorschlag (Ergänzung zu `backoffice/src/app/globals.css`)

```css
@import "tailwindcss" source("..");

@theme static {
  /* Level 1 (vorhanden bleibt, neu:) */
  --color-sand-300: #b8a78f;
  --color-sand-700: #6b5d4b;
  --color-ink-faint: #646b72;
  --color-st-lila: #6d5a86;

  /* Level 2, hell – vorhandene bo-Namen bleiben, Aliasse + neue Rollen: */
  --color-bo-ink: var(--color-bo-text);
  --color-bo-ink-soft: var(--color-bo-text-soft);
  --color-bo-muted: var(--color-bo-text-faint);
  --color-bo-ink-inverse: var(--color-paper);
  --color-bo-ink-inverse-soft: var(--color-stone-deep);
  --color-bo-surface-inverse: var(--color-ink);
  --color-bo-line-control: var(--color-pebble);
  --color-bo-accent-soft: #f1ece4;
  --color-bo-action-soft: rgb(48 55 62 / 0.06);
  --color-bo-selected: #e9e4d9;
  --color-bo-overlay: rgb(31 37 43 / 0.40);
  --color-bo-nav-text-soft: #b5b1a8;

  --color-bo-success: var(--color-st-gruen);
  --color-bo-success-text: #166534;
  --color-bo-success-soft: #e7f3eb;
  --color-bo-warning: var(--color-st-orange);
  --color-bo-warning-text: #8a4b06;
  --color-bo-warning-soft: #fbf0e1;
  --color-bo-danger: var(--color-st-rot);
  --color-bo-danger-text: #8f1d1d;
  --color-bo-danger-soft: #fbe9e9;
  --color-bo-info: var(--color-st-blau);
  --color-bo-info-text: #1e40af;
  --color-bo-info-soft: #e8eefb;
  --color-bo-progress: var(--color-see);
  --color-bo-progress-text: #2f5451;
  --color-bo-progress-soft: #e4ecea;
  --color-bo-special: var(--color-st-lila);
  --color-bo-special-text: #54436b;
  --color-bo-special-soft: #eee9f4;
  --color-bo-neutral-text: var(--color-ink-soft);
  --color-bo-neutral-soft: #eceae5;
  --color-bo-skeleton: var(--color-linen);
  --color-bo-skeleton-shine: rgb(250 248 244 / 0.7);
  --color-bo-disabled-text: #8a9097;

  /* Charts */
  --color-chart-1: var(--color-ink);
  --color-chart-2: var(--color-sand);
  --color-chart-3: var(--color-see);
  --color-chart-4: var(--color-brass-500);
  --color-chart-5: var(--color-ink-soft);
  --color-chart-seq-1: #d8d2c8; --color-chart-seq-2: #b8a78f; --color-chart-seq-3: #8a7a66;
  --color-chart-seq-4: #5c636a; --color-chart-seq-5: #30373e;

  /* Alte Namen (Fundament) als Aliasse behalten: */
  --color-bo-ok: var(--color-bo-success);
  --color-bo-warn: var(--color-bo-warning);
}

/* Dunkel: System ODER Schalter. Beide Blöcke identisch (Mixin per PostCSS nicht nötig – doppelt pflegen, 40 Zeilen). */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* Werte aus §1.4 */ }
}
:root[data-theme="dark"] { /* Werte aus §1.4 */ }
```

`color-scheme: light dark` am `:root` bleibt; bei `data-theme` entsprechend `light` bzw. `dark` setzen, damit Scrollbalken, native Selects und `<dialog>`-Backdrop mitgehen.

---

## 2. Typografie

### 2.1 Familien

| Rolle | Familie | Einsatz | Verbot |
|---|---|---|---|
| UI | Instrument Sans (next/font, `--font-sans`), Fallback system-ui | alles | – |
| Wortmarke | Bodoni Moda (`--font-display`), `opsz` 28 (Monitore ≤ 1,49 dppx) / auto | „Platzhirsch“ in Seitenleiste, Login, Arbeitsplatz-Auswahl, Druckkopf | nie als Überschrift im Inhalt |
| Kopfzahl | Bodoni Moda 400, `lining-nums proportional-nums` | **nur** die eine große Zahl der Zentrale (z. B. Tagesumsatz) und Kiosk-Gesamtsumme ≥ 40 px | nie in Tabellen (keine Tabellenziffern) |
| Mono | `ui-monospace, "SF Mono", Consolas` | Belegnummern in Code-Zusammenhängen, DEP-Export, Hashes | nie für Beträge |

Instrument Sans: `font-feature-settings: "ss01" 0, "kern" 1`; Zahlen in Tabellen/Beträgen `tabular-nums lining-nums` (Klasse `.tabular`).

### 2.2 Skala (rem bei 16 px Wurzel; UI-Text im Backoffice ist 14 px, nicht 18 wie auf der Website)

| Token | Größe | Zeile | Gewicht | Tracking | Einsatz |
|---|---|---|---|---|---|
| `--text-bo-xs` | 11 px / 0.6875rem | 16 px | 500 | 0.02em | Tabellenkopf kompakt, Badge klein, Tastenkappe |
| `--text-bo-sm` | 12 px / 0.75rem | 16 px | 400 | 0.01em | Hilfstext, Zeitstempel, Achsen, Krümel |
| `--text-bo-base` | 13 px / 0.8125rem | 20 px | 400 | 0 | **Tabellenzellen kompakt, Formularlabels, Seitenleiste** |
| `--text-bo-md` | 14 px / 0.875rem | 20 px | 400 | 0 | **Fließ-UI (Standard body), Eingabewerte, Knöpfe** |
| `--text-bo-lg` | 16 px / 1rem | 24 px | 500 | -0.005em | Kartentitel, Dialogtitel, Kiosk-Fließtext |
| `--text-bo-xl` | 20 px / 1.25rem | 28 px | 500 | -0.01em | Seitentitel (`Seitenkopf`) |
| `--text-bo-2xl` | 24 px / 1.5rem | 32 px | 500 | -0.015em | Kennzahl-Wert, Kiosk-Position |
| `--text-bo-3xl` | 32 px / 2rem | 38 px | 500 | -0.02em | Kiosk-Zwischensumme, Login-Titel |
| `--text-bo-display` | 44 px / 2.75rem | 48 px | 400 Bodoni | -0.005em | Kopfzahl Zentrale, Kiosk-Gesamtsumme |
| `--text-bo-overline` | 11 px | 14 px | 500 | 0.12em, Versalien | Abschnitts-Kicker über Karten („HEUTE“, „OFFENE POSTEN“) |

Tailwind: `text-bo-md` usw. über `--text-bo-md`, `--text-bo-md--line-height`, `--text-bo-md--font-weight`, `--text-bo-md--letter-spacing` im `@theme`.

### 2.3 Regeln

- Gewicht: 400 Text, 500 Labels/Titel/Knöpfe, 600 nur für den Wert einer Kennzahl und den Gesamtbetrag. Nie 700.
- Überschriften-Hierarchie je Seite: 1× `xl` (Seitentitel), `lg` Karten, `overline` Abschnitte. Kein H-Tag überspringen (`h1` Seitentitel, `h2` Karte, `h3` Abschnitt).
- Textfarbe: Titel `ink`, Werte `ink`, Labels `ink-soft`, Meta `muted`.
- Zeilenlänge Fließtext (Hilfe, Leerzustand) max. 60 ch.
- Datum `04.11.2026`, Zeit `14:05`, relativ nur < 24 h („vor 12 min“) mit `title` = absolut. Betrag `1.234,50 €` (Leerzeichen geschützt, Minus `−1.234,50 €`).

---

## 3. Abstand, Radius, Schatten

### 3.1 Abstand (4-px-Basis, Tailwind `--spacing: 0.25rem` bleibt)

| Name | px | Einsatz |
|---|---|---|
| `1` | 4 | Icon↔Text innen, Badge-Padding vertikal |
| `2` | 8 | Knopf-Innenabstand vertikal, Chip-Abstand, Tabellenzelle kompakt vertikal |
| `3` | 12 | Zelle komfortabel vertikal, Feldgruppe |
| `4` | 16 | Karten-Innenabstand kompakt, Formularzeilen |
| `5` | 20 | Karten-Innenabstand komfortabel |
| `6` | 24 | Abstand Karte↔Karte, Seitenrand ≥ 768 px |
| `8` | 32 | Abschnittsabstand im Formular |
| `10` | 40 | Abstand Seitenkopf↔Inhalt |
| `12` | 48 | Kiosk-Spaltenabstand, Login-Karte Innenabstand |

Seitenrand: 16 px (< 768), 24 px (≥ 768), 32 px (≥ 1280). Kiosk: 16 px fix.

### 3.2 Radius

| Token | Wert | Einsatz |
|---|---|---|
| `--radius-bo-xs` | 4 px | Checkbox, Tastenkappe, kleine Chips, Tabellen-Zeilen-Fokus |
| `--radius-bo` (vorhanden) | 6 px | Knöpfe, Eingaben, Select, Menüpunkte, Toast |
| `--radius-bo-lg` | 10 px | Karten, Dialog, Sheet-Innenkante, Kanban-Karte, Kennzahl-Karte, Kiosk-Taste |
| `--radius-bo-xl` | 16 px | Arbeitsplatz-Kacheln, Login-Karte |
| `--radius-pill` | 9999 px | Badge, Avatar, Zähler, Segment-Schalter |

Verschachtelung: innerer Radius = äußerer − Abstand (Karte 10, Bild darin mit 4 px Rand → 6).

### 3.3 Schatten (hell / dunkel)

| Token | hell | dunkel | Einsatz |
|---|---|---|---|
| `--shadow-bo-xs` | `0 1px 2px rgb(31 37 43 / 0.06)` | `0 1px 2px rgb(0 0 0 / 0.4)` | Eingabefeld-Innenkante optional, Tastenkappe |
| `--shadow-bo` (vorhanden) | `0 1px 2px rgb(31 37 43 / 0.06), 0 4px 16px rgb(31 37 43 / 0.06)` | `0 1px 2px rgb(0 0 0 / 0.3), 0 4px 16px rgb(0 0 0 / 0.3)` | Popover, Menü, Combobox-Liste, Hover-Karte |
| `--shadow-bo-lg` | `0 8px 24px -8px rgb(31 37 43 / 0.18), 0 24px 48px -12px rgb(31 37 43 / 0.14)` | `0 8px 24px -8px rgb(0 0 0 / 0.5), 0 24px 48px -12px rgb(0 0 0 / 0.5)` | Dialog, Sheet, Command Palette, Toast |
| `--shadow-bo-drag` | `0 12px 32px -8px rgb(31 37 43 / 0.28)` + `rotate(1.5deg)` | `0 12px 32px -8px rgb(0 0 0 / 0.6)` | gezogene Kanban-Karte |
| `--shadow-bo-focus` | `0 0 0 4px rgb(48 55 62 / 0.14)` | `0 0 0 4px rgb(209 178 80 / 0.25)` | Eingabe fokussiert (zusätzlich zur Randfarbe) |

Karten im Ruhezustand: **kein** Schatten, nur `border: 1px solid line`.

---

## 4. Dichte-Modi

Umschalter im Benutzermenü (`html[data-dichte="kompakt"|"komfortabel"]`, Standard **kompakt** am Desktop, **komfortabel** auf Touch (`pointer: coarse`) und immer im Kiosk). Gespeichert je Benutzer (Server, Fallback localStorage).

| Variable | kompakt | komfortabel | wirkt auf |
|---|---|---|---|
| `--bo-row-h` | 36 px | 44 px | Tabellenzeile, Listeneintrag, Menüpunkt |
| `--bo-control-h` | 32 px | 40 px | Knopf m, Input, Select |
| `--bo-control-h-l` | 40 px | 48 px | Knopf l, Primärknopf im Formularfuß |
| `--bo-cell-px` | 12 px | 16 px | Zellen horizontal |
| `--bo-card-p` | 16 px | 20 px | Karten-Innenabstand |
| `--bo-font-table` | 13 px | 14 px | Tabellenzellen |
| `--bo-gap` | 16 px | 24 px | Rasterabstand |
| Kiosk (fix) | – | `row 56 · control 48 · key 64–72 · cell-px 16 · font 16` | |

Touch-Ziel bleibt in kompakt ≥ 44 px über `::before`-Erweiterung (`inset: -4px`) bei Icon-Knöpfen; Sichtgröße 32–36 px.

---

## 5. Icons (lucide)

- Bibliothek: `lucide-react` 0.539 (im Fundament vorhanden). Shell-Icons wie auf der Website ohne Runtime kopieren (`components/Backoffice/icons.js`).
- Größen: 16 px (in Text, Knopf s/m, Tabellen), 20 px (Knopf l, Seitenleiste, Kopfzeile), 24 px (Kiosk, Leerzustand klein), 40 px (Leerzustand groß, `stroke-width 1.25`).
- Strichstärke: 1.75 bei 16 px, 1.5 bei 20/24 px, 1.25 ab 32 px.
- Farbe: `currentColor`. Dekorativ → `aria-hidden="true"`; allein stehend → Knopf mit `aria-label`, nie `title` allein.
- Ein Icon = eine Bedeutung, festes Vokabular (Agenten halten sich daran):

| Bedeutung | Icon | Bedeutung | Icon |
|---|---|---|---|
| Neu anlegen | `plus` | Suchen / Palette | `search` / `command` |
| Bearbeiten | `pencil` | Filter | `sliders-horizontal` |
| Löschen (irreversibel) | `trash-2` | Sortieren | `arrow-up-down`, aktiv `arrow-up`/`arrow-down` |
| Speichern | `check` | Spalten | `columns-3` |
| Abbrechen/Schließen | `x` | Export CSV | `download` |
| Drucken | `printer` | Anhang | `paperclip` |
| Gebucht/gesperrt | `lock` | Kommentar | `message-square` |
| Workflow weiter | `arrow-right` | Zurück | `arrow-left` |
| Warnung | `triangle-alert` | Fehler | `circle-x` |
| Erfolg | `circle-check` | Info | `info` |
| Hilfe/Kürzel | `keyboard` | Benachrichtigung | `bell` |
| Scanner | `scan-barcode` | Kasse | `receipt` |
| Lieferung | `truck` | Montage | `wrench` |
| Service | `life-buoy` | Kunde | `user` / Firma `building-2` |
| Betrag/Zahlung | `banknote` | Karte | `credit-card` |
| Termin | `calendar` | Zeit | `clock` |
| Externer Link | `arrow-up-right` | Mehr | `ellipsis` (horizontal) |
| Vollbild | `maximize-2` / `minimize-2` | Verbindung | `wifi` / `wifi-off` |
| Dunkel/Hell | `moon` / `sun` | Dichte | `rows-3` / `rows-4` |

Bereichs-Icons der Seitenleiste: Zentrale `layout-dashboard`, CRM `users`, Sortiment `package`, Projekte `folder-kanban`, Shop `shopping-bag`, Faktura `file-text`, Logistik `truck`, Personal `id-card`, Marketing `megaphone`, Kassa `receipt`, Service `life-buoy`, Kundenkarte `credit-card`, Einstellungen `settings`.

---

## 6. Layout-Raster

### 6.1 Shell (Backoffice-Arbeitsplatz)

```
┌──────────┬─────────────────────────────────────────────────────────────────┐
│ 240 / 64 │ Kopfzeile 56 px: [Krümel]        [⌘K Suche  ·  Glocke · Avatar] │
│ Nav      ├─────────────────────────────────────────────────────────────────┤
│ Tinte    │ Inhalt: max 1440 px, zentriert, Rand 24/32 px                   │
│          │ ┌──────────────────────────────────────────────────────────────┐│
│ Wortmarke│ │ Seitenkopf (Titel xl, Untertitel, Primäraktion rechts)       ││
│ ──────── │ │ 12-Spalten-Raster, gap 16/24                                 ││
│ Zentrale │ │ [Karte 4][Karte 4][Karte 4]                                  ││
│ CRM    ▸ │ │ [Tabelle 12                                               ]  ││
│ Faktura  │ └──────────────────────────────────────────────────────────────┘│
│ …        │                                                                 │
│ ──────── │                                                                 │
│ Einstell.│                                                                 │
│ Benutzer │                                                                 │
└──────────┴─────────────────────────────────────────────────────────────────┘
```

- Seitenleiste: 240 px offen, 64 px eingeklappt (nur Icons, Tooltip rechts nach 400 ms), `Strg+B`/`⌘B` schaltet, Zustand je Benutzer. Unter 1024 px: Off-Canvas (Sheet links, 280 px, Scrim), Öffner in der Kopfzeile. Gruppen: Arbeit (Zentrale, Bereiche nach Rechten), unten fix: Einstellungen, Hilfe (`?`), Benutzer.
- Aktiver Eintrag: Hintergrund `nav-active`, 2 px Sand-Balken links (innen, 8 px Abstand oben/unten), Text `nav-text`, Icon `nav-text`. Hover: Hintergrund `nav-active` ohne Balken, 120 ms.
- Kopfzeile: 56 px, `bg/90 + backdrop-blur 8px`, sticky, Haarlinie unten. Links Krümel (max 3 Ebenen, davor Zurück-Pfeil ab Ebene 2), Mitte/rechts Suchfeld-Attrappe („Suchen oder Befehl … ⌘K“, 320 px, ab 1024 px) → öffnet Palette, Glocke mit Zähler-Pille, Avatar-Menü.
- Inhalt: `max-width: 1440px` Standard, `breit` (Tabellen/Kanban) = volle Breite minus Rand. Raster 12 Spalten, Karte min. 3 Spalten; unter 768 px alles 12.
- Formular-Layout: Hauptspalte 8 + Seitenspalte 4 (Status, Zeitleiste, Verknüpfungen) ab 1024 px; darunter Seitenspalte als Tabs oben.
- Scroll: nur `main` scrollt; Seitenleiste und Kopf stehen. Tabellen mit vielen Spalten scrollen horizontal in ihrer Karte, erste Spalte sticky.
- Z-Skala: sticky 20, Kopfzeile 40, Seitenleiste 50 (mobil 60), Popover 55, Dialog/Sheet 60, Palette 65, Toast 70.

### 6.2 Breakpoints

`sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`. Ziele: 13"-Laptop 1280–1440 (Standard), 24"-Monitor 1920 (Inhalt bleibt ≤ 1440, Tabellen `breit`), iPad 10,9"/11" quer 1180×820 (Kiosk), iPad 13" 1366×1024, iPhone (nur Montage/Technik mobil, 390 px).

### 6.3 Kiosk-Raster (Kassa, Packtisch – 10–13" quer, Vollbild)

```
Kassa (1180×820 iPad 11", Rand 16, gap 16)
┌──────────────────────────────────────────────────────────────────────────┐
│ Kopf 56: [Kassa 1 · Lochau]  [Bediener]  [14:05]  [● online] [⛶] [Wechsel]│
├───────────────────┬─────────────────────────────┬────────────────────────┤
│ Kunde / Auftrag   │ Positionen                  │ Summe                  │
│ 3/12 (≈ 280 px)   │ 5/12 (≈ 480 px)             │ 4/12 (≈ 372 px)        │
│                   │ Zeile 56 px, Betrag rechts  │ Gesamt display 44 px   │
│ [Suche Kunde 48]  │ [Scan-Feld immer fokussiert]│ [Bar][Karte][Gutsch.]  │
│ Karte / Stufe     │                             │ Zahlen-Tastatur        │
│ Offene Aufträge   │                             │ 3×4, Taste 72×64       │
│                   │                             │ [Kassieren 64 primary] │
└───────────────────┴─────────────────────────────┴────────────────────────┘
```

- Spalten 3/5/4 von 12, bei < 1100 px Breite 4/8 mit Summe als untere Leiste (72 px, sticky).
- Tastenhöhen: Zahl 64 px (Breite ≥ 72), Zahlart 56 px, Abschluss 64 px, Listenzeile 56 px, Eingabe 48 px.
- Schrift: Fließtext 16, Position 18/500, Zwischensumme 32/500, Gesamt 44 Bodoni.
- Keine Hover-Zustände nötig (Touch) – aber `:active` sichtbar: Taste wird `surface-3` + 1 px nach unten (50 ms).
- Packtisch: 2 Spalten 7/5 (Positionen abhaken / Pakete + Etikett), Zeile 56 px mit 28-px-Checkbox.
- Montage/Technik mobil (Telefon): eine Spalte, untere Tableiste 64 px + safe-area, Knöpfe volle Breite 52 px.

---

## 7. Bewegung

Token wie Website-Fundament (Namen übernehmen):

| Token | Wert | Einsatz |
|---|---|---|
| `--duration-ack` | 50 ms | Press 1 px, Taste Kiosk |
| `--duration-micro` | 120 ms (Backoffice: 120 statt 160 – Werkzeug reagiert knapper) | Hover-Farbe, Icon-Drehung Chevron, Checkbox-Haken |
| `--duration-swap` | 200 ms | Tab-Unterstrich, Segment-Schalter, Badge-Wechsel |
| `--duration-ui` | 240 ms | Menü/Popover/Sheet/Dialog öffnen, Toast rein, Zeile einfügen |
| `--duration-exit` | 160 ms | alles schließen (`ease-exit`) |
| `--duration-enter` | 400 ms | Seitenwechsel-Fade des Inhalts (nur opacity 0.6 → 1, 0 px Weg) |
| `--ease-quiet` | `cubic-bezier(0.22, 1, 0.36, 1)` | Standard (ankommen) |
| `--ease-quiet-inout` | `cubic-bezier(0.65, 0, 0.35, 1)` | Morph (Sidebar-Breite, Tab-Unterstrich) |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | verlassen |
| `--ease-drift` | `cubic-bezier(0.33, 0, 0.2, 1)` | Skeleton-Schimmer, Fortschrittsbalken |

Regeln: Weg ≤ 8 px (Dialog 8 px hoch, Sheet 100 % → 0 seitlich, Toast 8 px hoch), Skalierung 0.98 → 1 (Dialog, Palette), Stagger max. 4 × 40 ms (Kanban-Spalten beim ersten Laden, Kennzahl-Karten). Unter `prefers-reduced-motion` und `html[data-motion="reduced"]`: Transitions auf Farbe beschränkt, Transform/Opacity sofort. **Nicht** `* { transition-duration: 0.01ms !important }` (Fundament) – das zerstört auch Farbübergänge; stattdessen gezielte Regeln je Klasse.

---

## 8. Komponentenkatalog

Jede Komponente: Anatomie, Varianten, Zustände, Tastatur, Fehler/Leer, Bewegung. Klassenvorschläge in Tailwind-Utilities mit den Rollen oben.

### 8.1 Button (`Knopf`)

```
[ icon  Beschriftung ]   Höhen: s 28 · m 32/40 (Dichte) · l 40/48 · kiosk 56/64
```

| Variante | Ruhe | Hover | Active | Fokus | Disabled | Loading |
|---|---|---|---|---|---|---|
| primary (1× je Ansicht) | `bg-action text-action-text` | `bg-action-hover` | + `translateY(1px)` 50 ms | Ring 2 px focus, Offset 2 | opacity .5, cursor not-allowed | Spinner 16 px links, Text bleibt, `aria-busy` |
| secondary (Standard) | `border line-control bg-surface text-ink` | `bg-surface-2` | wie oben | | | |
| ghost | transparent `text-ink` | `bg-action-soft` | | | | |
| danger | `border danger/50 text-danger` | `bg-danger-soft` | | | | |
| danger-solid (Bestätigen im Dialog) | `bg-danger text-white` (6,47:1) | dunkler 8 % | | | | |
| link | Unterstrich `line-strong`, Hover Unterstrich `currentColor` | | | | | |
| icon (quadratisch) | wie ghost/secondary, `aria-label` Pflicht, Tooltip nach 400 ms | | | | | |

- Innenabstand: s 10 px, m 12 px, l 20 px; Icon↔Text 6 px; Icon 16 px (s/m), 20 px (l).
- Gruppen (`ButtonGroup`): gemeinsame Außenkante, Trennlinie 1 px, Radius nur außen. Split-Button: Hauptaktion + Chevron-Teil 32 px breit mit Menü.
- Tastatur: Enter/Leertaste; Primäraktion im Formular `Strg+S`/`⌘S`; Dialog-Primär `Enter`, Danger-Primär nie Enter-Standard (Fokus auf „Abbrechen“).
- Loading: Breite wird vor dem Spinner eingefroren (`min-width` = gemessene Breite), damit nichts springt. Doppelklick-Schutz: `disabled` solange `pending`.
- Text: Verb zuerst („Rechnung erstellen“, „Speichern“, „Verwerfen“), nie „OK“.

### 8.2 Input (Text, Zahl, Textarea, Suche)

```
Label (13/500 ink-soft)      optional: „optional“ 12 muted rechts
┌────────────────────────────────────────┐
│ [icon] Wert                   [Einheit]│  Höhe 32/40, Rand 1 px line-control, Radius 6
└────────────────────────────────────────┘
Hilfetext 12 muted  |  Fehler 12 danger-text mit circle-x 12 px
```

| Zustand | Rand | Hintergrund | Sonstiges |
|---|---|---|---|
| default | `line-control` | `surface` | Platzhalter `muted` (5,40:1) |
| hover | `ink-soft` | | 120 ms |
| focus | `focus` 1 px (Rand färbt) + `shadow-bo-focus` 4 px | | kein outline-Ring doppelt |
| filled | `line-control` | | Text `ink` |
| readonly | `line` | `surface-2` | Cursor text, Text `ink`, kein Hover |
| disabled | `line` | `surface-2` | Text `disabled-text`, cursor not-allowed |
| invalid | `danger` + `shadow 4px danger/14` | | `aria-invalid`, `aria-describedby` = Fehler-ID, Fehlertext erscheint mit 240 ms Höhe-Übergang |
| loading (Async-Prüfung) | | | Spinner 14 px rechts |
| warn (gültig, aber Hinweis, z. B. Nummernkreis-Sprung) | `warning` | | Text `warning-text` |

- Pflichtfelder: kein Sternchen – optionale Felder bekommen „optional“. (Frappe `reqd` → Validierung aus Meta.)
- Zahl: `inputmode="decimal"`, rechtsbündig, Einheit als Suffix außerhalb des Werts (`m²`, `Stk`, `%`), Pfeile des Browsers aus.
- Textarea: min 3 Zeilen, auto-grow bis 12, Zähler bei `max_length` (`120/500`), Zähler wird `warning-text` ab 90 %.
- Suche (Tabelle/Filterleiste): `search` 16 px links, `x` rechts sobald Wert, Debounce 250 ms, `Esc` leert, `/` fokussiert sie außerhalb von Eingaben.
- Label-Position: oben (Standard); „inline“ (Label links 160 px) nur in Einstellungen.
- Mehrsprachige Felder (Personal DE/EN/FR/IT): Tabs im Feldkopf, nicht vier Felder untereinander.

### 8.3 Select / Combobox

- **Select** (≤ 8 feste Optionen, Frappe `Select`): natives `<select>` optisch gestylt (Chevron 16 px rechts, gleiche Höhe wie Input). Im Kiosk: Segment-Schalter statt Select.
- **Combobox** (≥ 9 Optionen oder suchbar): Input + Liste (Popover 320 px max, Zeilen 36/44, max 8 sichtbar, dann Scroll).
  - Öffnen: Klick, `↓`, Tippen. Liste erscheint 240 ms `opacity + translateY(-4px→0)`.
  - Zeile: Haupttext `ink`, Nebentext `muted` rechts, Treffer fett (Markierung `<mark>` mit `bg-accent-soft`).
  - Zustände: aktiv (`bg-surface-2`), gewählt (`check` 16 px rechts), deaktiviert (`disabled-text`), Gruppenkopf (`overline`).
  - Leer: „Keine Treffer für ‚xyz‘“ + ggf. Aktion „‚xyz‘ anlegen“.
  - Laden: 3 Skeleton-Zeilen nach 300 ms Verzögerung.
  - Tastatur: `↑↓` bewegen, `Enter` wählen, `Esc` schließt (Wert bleibt), `Tab` wählt aktive und geht weiter, `Pos1/Ende`.
  - Mehrfach: Chips im Feld (Höhe wächst), `Backspace` entfernt letzten Chip, `x` am Chip.
  - ARIA: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, Liste `role="listbox"`.

### 8.4 Link-Suche (Frappe `Link`, `LinkFeld`)

```
┌──────────────────────────────────────────────┐
│ ⌕ KD-2026-0142 · Muster Max            ↗   ×│
└──────────────────────────────────────────────┘
```

- Wie Combobox, Daten aus `/api/link?doctype=…&q=…` (Debounce 250 ms, min 1 Zeichen, zeigt bei Fokus ohne Eingabe „Zuletzt verwendet“ (5) aus localStorage je DocType).
- Zeile: Titel (`title_field`) fett + Name (`muted`, mono) + bis zu 2 `search_fields` als Nebentext.
- Nach Wahl: Feld zeigt Titel, `title` = Name; rechts `arrow-up-right` öffnet Datensatz in neuem Tab (ghost icon 28 px), `x` leert.
- Fußzeile der Liste: „+ Neu anlegen …“ (öffnet Schnellanlage-Sheet mit Pflichtfeldern, wenn Recht `create`), „Alle anzeigen ↗“.
- Fehler: API nicht erreichbar → Liste zeigt „Suche gerade nicht möglich. Erneut versuchen“ (Knopf), Feld bleibt editierbar; Server validiert beim Speichern.
- Ungültiger Wert (Name existiert nicht mehr): Feld invalid + Hinweis „Datensatz nicht gefunden“.

### 8.5 Date / Datetime / Zeitraum

- Anzeige `TT.MM.JJJJ`, Eingabe frei tippbar (auch `4.11.` → ergänzt Jahr, `+3` → heute + 3 Tage, `mo` → nächster Montag), Kalender-Popover per `calendar`-Icon oder `↓`.
- Kalender: 7×6, Zellen 36 px (Kiosk 44), Wochenstart Montag, KW-Spalte `muted`, heute Ring `line-control`, gewählt `bg-action text-action-text`, außerhalb Monat `muted`, deaktiviert (Vergangenheit bei Terminen) `disabled-text`. Kopf: `‹ November 2026 ›`, Monat/Jahr klickbar → Raster 3×4 Monate.
- Schnellwahl rechts (Zeitraum): Heute, Gestern, Diese Woche, Letzte 7 Tage, Dieser Monat, Letzter Monat, Dieses Quartal, Jahr.
- Datetime: Datum + Zeit-Eingabe `HH:MM` (15-min-Schritte per `↑↓`, Zeitzone Europe/Vienna fest, keine Anzeige).
- Tastatur im Kalender: Pfeile Tag, `PgUp/PgDn` Monat, `Shift+PgUp` Jahr, `Enter` wählen, `Esc` schließen.
- Fehler: ungültig → „Datum im Format TT.MM.JJJJ“; nach Minimum/Maximum → „Frühestens 05.11.2026“.
- Relativanzeige in Tabellen: `heute 14:05`, `gestern`, sonst Datum; Überfälligkeit: Datum in `danger-text` + Badge „3 Tage überfällig“.

### 8.6 Cent-Betrag (`BetragFeld`)

```
Label
┌──────────────────────────┐
│                1.234,50 €│  rechtsbündig, tabular, Höhe 32/40
└──────────────────────────┘
```

- Modell: Integer Cent; Anzeige `de-AT` mit Tausenderpunkt; Eingabe akzeptiert `1234,5`, `1.234,50`, `1234.50`, `12,` → beim Blur normalisiert mit 200 ms Fade des Werts.
- Negativ nur wo erlaubt (Gutschrift) – sonst Fehler „Nur positive Beträge“. Null erlaubt mit Hinweis bei Rechnungspositionen.
- Netto/Brutto-Umschalter als Segment rechts (nur Faktura), USt-Satz als Select daneben, berechnete Gegenseite `readonly` grau darunter in 12 px.
- Kiosk: Betragsfeld 56 px, 32/500, Zahlen-Tastatur mit `00`, `,`, `⌫`, `C`; Eingabe von rechts (Kassen-Logik: `1 2 3 4 5` → `123,45 €`).
- Tabellenanzeige: Spalte rechtsbündig, Summenzeile `font-weight 600` + Linie oben `line-strong`; 0 als `–` (`muted`) wenn fachlich „keine Angabe“, `0,00 €` wenn Betrag wirklich null.

### 8.7 Tabelle (`DataTable`)

```
┌ Werkzeugleiste 44: [Suche] [Status ▾] [Datum ▾] [+ Filter]      [⬇ CSV] [⫿ Spalten] ┐
│ ☐ │ Nummer ↓   │ Kunde            │ Status        │ Betrag      │ Geändert   │ ⋯   │ Kopf 36, sticky
├───┼────────────┼──────────────────┼───────────────┼─────────────┼────────────┼─────┤
│ ☐ │ RE-26-0142 │ Muster Max       │ ● Gestellt    │  1.234,50 € │ heute 14:05│ ⋯   │ Zeile 36/44
│ ☑ │ RE-26-0141 │ Beispiel GmbH    │ ● Überfällig  │    980,00 € │ gestern    │ ⋯   │ selected
└───┴────────────┴──────────────────┴───────────────┴─────────────┴────────────┴─────┘
  2 ausgewählt · [Mahnen] [Exportieren] [×]                 1–50 von 1.284  ‹ 1 2 3 … 26 ›
```

- Kopf: `text-bo-xs` 500 Versalien? Nein – 12 px, 500, `ink-soft`, normale Schreibung; sortierbar mit Pfeil 14 px (erscheint bei Hover, bleibt bei aktiv). Linie unten `line-strong`.
- Zeilen: Linie `line`, Hover `surface-2` (120 ms), fokussiert (Tastatur) Ring innen 2 px `focus` (`outline-offset: -2px`), ausgewählt `selected` + Checkbox gefüllt, aktiv (geöffnet im Side-Peek) `selected` + 2 px Sand links.
- Spaltentypen: Text (links, `truncate` + `title`), Zahl/Betrag (rechts, tabular), Status (Badge), Datum (links, relativ), Link (Titel `ink` unterstrichen bei Hover), Bild (28 px Quadrat Radius 4), Boolean (`check` 16 px `success` / leer), Aktionen (`ellipsis` ghost 28 px, Menü).
- Zeilenklick: öffnet Datensatz; `Strg/⌘+Klick` neuer Tab; `Shift+Klick` Bereichsauswahl; Klick auf Checkbox-Spalte wählt ohne Öffnen.
- Tastatur: `↑↓` Zeile, `Enter` öffnen, `Leertaste` wählen, `Shift+↑↓` Bereich, `Strg+A` alle sichtbaren, `Esc` Auswahl aufheben, `j/k` zusätzlich (Linear), `Pos1/Ende`.
- Massenaktionen: Leiste erscheint unten (sticky, 48 px, `surface` + `shadow-bo-lg`, 240 ms von unten) sobald ≥ 1 gewählt; Zähler links; Aktionen aus `massenaktionen[]`; irreversible fragen nach (Dialog).
- Paging: serverseitig 50 (25/50/100 wählbar), Zähler „1–50 von 1.284“, Seitenzahlen, `←/→` mit `Alt`.
- Spaltenwahl: Popover mit Checkboxen und Drag-Reihenfolge, „Zurücksetzen“; Breite per Ziehen am Kopf-Rand (min 80 px), gespeichert je DocType.
- Gruppierung (optional): Gruppenzeile `surface-3`, Chevron, Summen rechts.
- Dichte folgt §4. Zebra aus; bei > 12 Spalten erste Spalte sticky + Schattenkante 8 px rechts (`linear-gradient`).
- Leer: §8.18 (gefiltert vs. wirklich leer). Fehler: Zeilenbereich zeigt `Fehler`-Komponente (Code, „Erneut laden“), Werkzeugleiste bleibt bedienbar.
- Skeleton: Kopf echt, 8 Zeilen `bo-skeleton` mit Spaltenbreiten der echten Spalten (60/80/40/30 %).
- Mobil (< 768): Karten-Liste (Titel, Status, Betrag, Datum), Werkzeugleiste als Sheet „Filter“.
- Export: nur mit Recht; Toast „CSV wird erzeugt …“ → Download; > 10.000 Zeilen Hinweis „Export läuft im Hintergrund, Datei unter Protokoll“.

### 8.8 Kanban-Karte und -Board

```
Spalte (surface-3, Radius 10, Breite 300, Kopf 40)
┌ ● Offen  12  ─ WIP 15 ─────── [+] ┐
│ ┌──────────────────────────────┐ │  Karte: surface, Radius 10, Rand line, p 12
│ │ AN-26-0088  · vor 2 h        │ │  Kopf: Name mono 11 muted · Alter
│ │ Küche Fam. Muster            │ │  Titel 14/500 ink, max 2 Zeilen
│ │ 12.400,00 €   Lochau         │ │  bis 3 Felder: Betrag tabular, Ort
│ │ [AV] [Planung ▸] ⚠ 3 Tage    │ │  Fuß: Avatar 20, Badge, Frist
│ └──────────────────────────────┘ │
│  …                              │
└──────────────────────────────────┘
```

- Spaltenkopf: Status-Punkt (Ton), Name, Zähler-Pille, WIP-Limit (bei Überschreitung Zähler `warning-text` + Kopfrand `warning`), `+` neue Karte in dieser Spalte, `⋯` (einklappen, sortieren).
- Zustände Karte: hover (Rand `line-strong`, `translateY(-1px)` 120 ms), fokus (Ring), dragging (`shadow-bo-drag`, `rotate(1.5deg)`, Original als gestrichelter Platzhalter `line-strong`), drop-ziel Spalte (`bg accent-soft`-Rand 2 px gestrichelt), nicht erlaubt (Spalte halbtransparent 0.5, Cursor `not-allowed`, Tooltip „Übergang nicht erlaubt: <Rolle/Bedingung>“), optimistisch verschoben (Karte 0.7 opacity + Spinner 12 px bis Antwort), fehlgeschlagen (Karte springt zurück 240 ms `ease-quiet`, Toast Fehler).
- Tastatur: Karte fokussieren, `Leertaste` „greifen“, `←→` Spalte, `↑↓` Position, `Enter` ablegen, `Esc` abbrechen; alternativ Menü „Verschieben nach …“ (`m`). Screenreader: Live-Region „AN-26-0088 nach ‚Qualifiziert‘ verschoben“.
- Spalten eingeklappt: 48 px breit, Name vertikal, Zähler.
- Horizontal-Scroll mit Schattenkanten; Spaltenbreite 300 (Dichte komfortabel 320).
- Leer-Spalte: gestrichelter Bereich 80 px „Keine Einträge“ in `muted`.
- Max. 100 Karten je Spalte, dann „Weitere 40 laden“.

### 8.9 Badge / Status-Badge / Chip

- **StatusBadge**: Pille, Höhe 20 (xs) / 24 (sm), `px 8`, Text 12/500, Hintergrund `*-soft`, Text `*-text`, kein Rand (ruhiger als heute `border */30`), vorne Punkt 6 px in `*`-Farbe (Form nach §1.5: gefüllt / Ring / Haken / Dreieck). Durchgestrichen bei `docstatus 2`. `title` = Status-Beschreibung aus Workflow (falls vorhanden).
- **Zähl-Badge** (Glocke, Tabs): Pille `bg-action text-action-text`, 16 px, min-width 16, ab 100 „99+“; dunkel `bg-action`.
- **Chip** (Filter aktiv, Mehrfach-Combobox): Höhe 28, Radius 6 (nicht Pille – unterscheidet Filter von Status), `bg-surface-3`, Text 13, `x` 14 px rechts, Hover `bg-selected`. Tastatur: Fokus auf Chip, `Backspace/Entf` entfernt.
- **Kennzeichen** (Ausstellungsstück, Testmodus): Rechteck Radius 4, `bg-accent-soft text-accent-text`, 11 px Versalien 0.08em.
- Nie mehr als 2 Badges nebeneinander in einer Tabellenzelle; weitere als „+2“.

### 8.10 Tabs / Segment-Schalter

- **Tabs** (Formular-Reiter, Seitenbereiche): Text 14/500, `ink-soft`, aktiv `ink` + Unterstrich 2 px `ink` (gleitet 200 ms `ease-quiet-inout` zwischen Tabs), Hover `ink` + Hintergrund `action-soft` Radius 6 (nur der Textbereich), Zähler-Badge optional, Fehlerpunkt 6 px `danger` am Tab mit invaliden Feldern. Höhe 40, Linie darunter `line`. Overflow: horizontal scroll mit Pfeilen; > 6 Tabs → `⋯` Menü. Tastatur: `←→` wechseln (automatisch aktivieren), `Pos1/Ende`. URL `?tab=` für Deep-Links. `aria-selected`, `role="tablist"`.
- **Segment-Schalter** (Netto/Brutto, Liste/Kanban, Hell/Dunkel): Rahmen `line`, Hintergrund `surface-2`, Segment aktiv `surface` + `shadow-bo-xs`, Radius 6/4, Höhe 32 (Kiosk 48), Marker gleitet 200 ms. `role="radiogroup"`.

### 8.11 Dialog / Sheet / Popover / Tooltip

- **Dialog** (`<dialog>` nativ): Breiten sm 400 (Bestätigen), md 560 (Formular kurz), lg 800 (Zuordnen-Dialog Bankumsatz), Radius 10, `surface`, `shadow-bo-lg`, Scrim `overlay` mit `backdrop-blur 2px`. Aufbau: Titel 16/500 + `x` rechts oben (36 px) → Inhalt scrollt (max 70 vh) → Fuß rechtsbündig `[Abbrechen] [Primär]`, bei Danger: `[Abbrechen]` fokussiert, Danger-Solid rechts; irreversible Aktionen mit Eingabe des Namens nur bei Löschen gebuchter/mehrerer Datensätze. Öffnen 240 ms `opacity 0→1, scale .98→1, translateY(8px→0)`; schließen 160 ms. Fokusfalle, `Esc` schließt (nicht bei laufendem Vorgang), Rückkehr des Fokus zum Auslöser. Mobil < 640: volle Breite, von unten (Bottom-Sheet), Griff 32×4.
- **Sheet** (seitlich, Side-Peek für Datensatz aus Tabelle, Schnellanlage, Filter mobil): rechts 480 px (lg 640), volle Höhe, Rand links `line`, `shadow-bo-lg`, Scrim 0.2 (Inhalt dahinter bleibt sichtbar/lesbar), Kopf 56 mit Titel + `maximize-2` (zur Vollseite) + `x`. Öffnen 240 ms `translateX(16px→0) + opacity`; `Esc`/Klick außerhalb schließt, bei ungespeicherten Änderungen Rückfrage. Tabelle dahinter markiert Zeile `aktiv`; `↑↓` in der Tabelle blättert durch Datensätze im Sheet (`j/k`).
- **Popover** (Spaltenwahl, Datum, Filter-Menü, Zeilen-Menü): `surface`, Rand `line`, Radius 6, `shadow-bo`, 8 px Abstand zum Auslöser, Pfeil keiner, Position automatisch (Flip). Menüpunkte 36/44, Icon 16 links, Kürzel rechts `muted` 12 mono, Trenner `line`, Gefährlich `danger-text`. Öffnen 160 ms `opacity + translateY(-4px)`. Tastatur: Pfeile, Buchstaben-Sprung, `Esc`. `role="menu"`.
- **Tooltip**: `surface-inverse` + `ink-inverse`, 12 px, Radius 4, `px 8 py 4`, max 240 px, Verzögerung 400 ms (danach in der Gruppe 0 ms), nie interaktiv, nie einzige Quelle einer Info (Icon-Knöpfe haben `aria-label` + Tooltip zeigt Label + Kürzel). Kiosk: keine Tooltips (Touch) – Label sichtbar.

### 8.12 Toast

```
┌──────────────────────────────────────────────┐
│ ✓  Rechnung RE-26-0142 gestellt    [Öffnen] ×│  surface, Rand line, Radius 6, shadow-bo-lg, 360 px
└──────────────────────────────────────────────┘
```

- Position unten rechts (Kiosk: oben Mitte, 480 px, 18 px Text), Stapel max 3, neue unten, ältere rücken 8 px hoch (240 ms).
- Arten: `ok` (Icon `circle-check` success), `fehler` (`circle-x` danger, bleibt bis geschlossen, mit „Details“ → Code), `info` (`info` info), `warnung` (`triangle-alert` warning), `laden` (Spinner, wird ersetzt).
- Dauer: ok/info 4 s, warnung 6 s, fehler ∞; Hover/Fokus pausiert; Fortschrittslinie 2 px unten in `line-strong` (läuft linear).
- Eine optionale Aktion („Öffnen“, „Rückgängig“ 8 s bei Löschen/Verschieben), `x` 28 px.
- Bewegung: rein 240 ms `translateY(8px→0) + opacity`, raus 160 ms `opacity`.
- ARIA: ok/info `role="status"` (`aria-live="polite"`), fehler `role="alert"`. Tastatur: `F8` fokussiert jüngsten Toast (wie VS Code), `Esc` schließt.
- Nie für Validierungsfehler (die stehen am Feld) und nie für „gespeichert“ bei Autosave (dort Inline-Status „Gespeichert 14:05“ im Formularkopf).

### 8.13 Command Palette (`Befehlspalette`, `⌘K` / `Strg+K`)

```
┌────────────────────────────────────────────────────────────────┐  640 px, oben 15 vh
│ ⌕  Suchen, springen, anlegen …                           esc   │  Eingabe 52 px, 16 px Text
├────────────────────────────────────────────────────────────────┤
│ ZULETZT                                                        │  overline
│  ⎙ RE-26-0142 · Muster Max                      Rechnung  ↵   │  Zeile 40
│ AKTIONEN                                                       │
│  + Neue Anfrage                                    N A         │  Kürzel rechts, Tastenkappen
│  + Neue Rechnung                                   N R         │
│ SPRINGEN                                                       │
│  ▸ Faktura › Offene Posten                         G O         │
│ SUCHE „muster“ in Kontakte (3) · Projekte (1) · Rechnungen (7) │  Treffergruppen, max 5 je Gruppe + „alle …“
├────────────────────────────────────────────────────────────────┤
│ ↑↓ wählen  ↵ öffnen  ⌘↵ neuer Tab  tab Bereich wechseln         │  Fuß 32 px, 12 px muted
└────────────────────────────────────────────────────────────────┘
```

- Modi per Präfix: ohne = alles; `>` nur Aktionen; `#` Nummer direkt (RE-, AN-, KD- erkennt DocType); `?` Hilfe/Kürzel; `@` Person; `/` Bereich.
- Zeile: Icon 16, Haupttext, Nebentext `muted`, Gruppe rechts `muted` 12, Kürzel als Tastenkappen (`bg-surface-3`, Radius 4, 11 px mono, Rand `line`).
- Zustände: Eingabe leer (Zuletzt + Vorschläge aus Rolle), tippend (Ergebnisse nach 150 ms Debounce, Skeleton 3 Zeilen bei > 300 ms), keine Treffer („Nichts gefunden für ‚xyz‘ – `↵` sucht in allen Listen“), Fehler (Zeile `danger-text` „Suche nicht erreichbar“, Aktionen lokal weiter nutzbar).
- Bewegung: Scrim 0.4 160 ms, Fenster 200 ms `scale .98→1 + opacity`; schließen 120 ms.
- Tastatur: `↑↓`, `Enter`, `⌘/Strg+Enter` neuer Tab, `Tab` nächste Gruppe, `Esc` schließt (zweites `Esc` bei Eingabe: erst leeren), `Backspace` auf leerem Feld entfernt Präfix.
- Rechte: nur Aktionen mit `darf()`; DocTypes ohne `read` erscheinen nicht.
- Kiosk: Palette nicht verfügbar (Scanner-Feld hat Fokus); dort `F1` Hilfe-Sheet mit Kürzeln.

### 8.14 Kennzahl-Karte (`Kennzahl`)

```
┌───────────────────────────────┐  surface, Rand line, Radius 10, p 16/20, min-h 112
│ OFFENE POSTEN         ⓘ   ↗   │  overline muted · Info-Tooltip · Link
│ 48.230,00 €                   │  2xl 500 tabular (Zentrale-Hauptzahl: display Bodoni)
│ ▲ 4,2 % zum Vormonat  ▁▂▃▅▆▇  │  Trend: Pfeil + Wert 12 (success/danger je Richtung UND Vorzeichen-Semantik) · Sparkline 64×20 ink-soft
└───────────────────────────────┘
```

- Trendfarbe richtet sich nach Bedeutung, nicht Richtung: Umsatz ↑ grün, Überfällig ↑ rot. Ohne Vergleichswert: „Kein Vergleich“ `muted`.
- Zustände: Laden (Skeleton Wert 120×28 + Trend 80×12), Fehler (Wert „–“, Fußzeile „Nicht geladen · Erneut“), Null („0“ in `ink`, nicht leer), klickbar (ganze Karte Link, Hover Rand `line-strong` + `translateY(-1px)`), Ziel/Grenze (dünner Fortschrittsbalken 4 px unter Wert, `accent`).
- Raster: 4 je Zeile ab 1280, 2 ab 768, 1 darunter. Max. 8 Kennzahlen je Startseite; Primär-Kennzahl der Zentrale 2 Spalten breit mit Bodoni-Zahl 44 px.

### 8.15 Chart-Stile (`Charts`: Balken, Linie, Donut, Sparkline)

- Rahmen: in Karte (§8.14-Stil), Titel 14/500, Untertitel/Zeitraum `muted` 12, Legende als Text-Chips über dem Chart (Punkt 8 px + Label), Werte direkt an der Marke (Balkenende, Linienende), Achsen `line` 12 %, Beschriftung `muted` 12 tabular, keine Rahmenlinie, keine vertikalen Gitterlinien.
- Balken: Breite ≤ 32 px, Abstand ≥ 40 % Balkenbreite, Radius 2 oben, Farbe Serie 1, Hervorhebung „aktuell“ Serie 2; gestapelt max 4 Teile mit 1 px `surface`-Trennung. Negativ unter Nulllinie `danger`.
- Linie: 1,5 px, Punkte nur bei ≤ 12 Werten (4 px), Fläche darunter 8 % Serienfarbe optional, letzter Wert mit Punkt + Label.
- Donut: nur ≤ 5 Anteile, Ring 12 px, Mitte Gesamtwert 2xl, Lücke 2 px `surface`, Legende rechts mit Prozent tabular.
- Sparkline: 64×20 oder 120×32, 1,25 px, `ink-soft`, Endpunkt 3 px, kein Rahmen.
- Hover: Marke dunkler 10 %, Tooltip (§8.11) mit Label + Wert; Tastatur: Chart fokussierbar, `←→` wandert durch Marken (Live-Region). Daten immer als `<details>Tabelle`.
- Leer: Fläche mit gestricheltem Achsenkreuz + „Noch keine Daten im Zeitraum“. Laden: Skeleton-Balken 5 Stück in `skeleton`.
- Bewegung: Balken wachsen 400 ms `ease-quiet` beim ersten Erscheinen (transform scaleY, origin bottom), Linie zeichnet 600 ms (`stroke-dashoffset`); keine Dauerbewegung.

### 8.16 Timeline (`Zeitleiste`: Kommentare, Versionen, Anhänge)

```
 ●  Max Muster hat Status Entwurf → Gesendet gesetzt           heute 14:05
 │
 ○  Anna Beispiel: „Kunde möchte Lieferung erst KW 48.“         gestern 09:12
 │    [Bearbeiten] [Löschen]
 ◇  Anhang angebot-v2.pdf (240 KB)                              03.11.2026
 │
 ○  Erstellt von Max Muster                                     01.11.2026
```

- Linie 1 px `line`, links 12 px Abstand zum Knoten; Knoten 20 px: Avatar (Kommentar), gefüllter Punkt `ink` (Statuswechsel), Ring (Feldänderung), Raute (Anhang), Icon `lock` (gebucht), `circle-x` `danger` (storniert).
- Einträge: Kopf 13 (Name 500 + Handlung 400 `ink-soft`), Zeit rechts `muted` 12 (`title` absolut), Inhalt 14 `ink`; Feldänderungen als `Feld: alt → neu` (alt durchgestrichen `muted`). > 5 Feldänderungen eingeklappt „12 Felder geändert ▾“.
- Filter-Chips oben: Alle · Kommentare · Änderungen · Anhänge. Gruppierung nach Tag (Kopf `overline` „HEUTE“, „GESTERN“, „03.11.2026“).
- Neuer Kommentar: Textarea unten (sticky in der Seitenspalte), `⌘/Strg+Enter` sendet, `@`-Erwähnung über Combobox, Anhang per Drag auf die Textarea (Rand gestrichelt `accent` beim Überfahren). Optimistisch einfügen (0.6 → 1 opacity 240 ms), bei Fehler rot markiert mit „Erneut senden“.
- Leer: „Noch keine Aktivität“ `muted`, ohne Grafik.
- Kiosk/Mobil: gleiche Komponente, Zeit unter dem Namen.

### 8.17 Avatar

- Größen 20 (Kanban-Fuß), 24 (Tabelle, Zeitleiste), 32 (Kopfzeile, Menü), 48 (Bedienerwechsel-Liste), 64 (Profil). Pille.
- Ohne Bild: Initialen (1–2 Zeichen, 500, Größe 40 % des Durchmessers) auf einer von 6 festen Flächen aus der Sand/Tinte-Familie, bestimmt aus Hash des Namens: `#e9e4d9/ink`, `#d8d2c8/ink`, `#b8a78f/ink-deep` (9,76:1), `#8a7a66/paper` (4,15:1 → Initialen ≥ 12 px fett ok), `#5c636a/paper` (6,09:1), `#30373e/paper` (11,37:1). Dunkel identisch (alle Paare gemessen gegen eigenen Hintergrund, nicht gegen Seite).
- Status-Punkt (online/Arbeitsplatz) 8 px unten rechts mit 2 px `surface`-Rand: `success` online, `muted` offline, `warning` abwesend.
- Gruppe: überlappend −8 px, max 3 + „+4“-Pille, Rand 2 px `surface`.
- Immer `alt` = Name bzw. `aria-hidden` wenn Name daneben steht.

### 8.18 Leerzustand (`Leer`)

```
            ┌─ Illustration: 1 lucide-Icon 40 px, stroke 1.25, in Kreis 72 px bg surface-3 ─┐
                             Noch keine Anfragen
         Anfragen kommen von der Website oder werden hier angelegt.
                    [ + Anfrage anlegen ]   Mehr zu Anfragen ↗
```

- Drei Arten, drei Texte: **wirklich leer** (Titel „Noch keine …“, 1 Satz, Primäraktion), **gefiltert leer** (Titel „Keine Treffer“, „Für die gewählten Filter gibt es nichts.“, Aktion „Filter zurücksetzen“ secondary), **kein Recht** (Icon `lock`, „Kein Zugriff auf …“, „Bitte Leitung fragen“, keine Aktion).
- Maße: vertikal zentriert in min-h 320 (Tabelle) / 160 (Karte, ohne Icon-Kreis, nur Text), Titel 16/500, Text 14 `ink-soft`, max 44 ch, Abstand 12/8/16.
- Kein Bild, keine Illustration außer dem Icon; keine Ausrufezeichen; keine Zahlen.
- Erscheinen 240 ms `opacity` nach Ende des Skeletons (nie Skeleton → Leer flackern: Skeleton min 300 ms).

### 8.19 Skeleton

- Flächen `skeleton` (linen) mit Schimmer `skeleton-shine` 1600 ms `ease-drift` (Fundament-Klasse `.ph-skeleton`-Logik; bestehendes `.bo-skeleton` auf Linen und Dauer 1600 umstellen), Radius: Text 4, Karte 10, Avatar Pille.
- Erscheint erst nach 300 ms Wartezeit (`--spinner-delay`), bleibt min 600 ms (`--spinner-min`), damit nichts blitzt.
- Formen spiegeln das Ziel: Tabelle (§8.7), Kennzahl (§8.14), Formular (Label 80×12 + Feld 100 %×32 je Feld, 2 Spalten), Kanban (3 Spalten × 3 Karten 100×88).
- `aria-busy="true"` am Container + `role="status"` mit sr-only „Wird geladen“. Unter reduzierter Bewegung: statisch.
- Spinner (nur in Knöpfen/Inline): 16 px Ring, 1,5 px, `currentColor`, 800 ms linear.

### 8.20 Weitere Bausteine (kurz, gleiche Regeln)

| Baustein | Spezifikation |
|---|---|
| Checkbox / Radio / Switch | 16 px (komfortabel 18, Kiosk 28), Radius 4 / Pille, Rand `line-control`, gewählt `bg-action` + Haken `action-text` (Haken zeichnet 120 ms), indeterminate Strich, Fokusring 2 px. Switch 36×20, Knauf 16, 160 ms, Label rechts, Zustandstext nur wenn nicht offensichtlich |
| Formularkarte | Abschnitt = Karte (Radius 10, p 20) mit Titel 16/500 + Hilfstext; Felder 2 Spalten ab 768 (Column Break aus Meta), 1 darunter; Pflicht-Fehler scrollen zum ersten Feld (`scroll-margin-top 96`) |
| Formularkopf (sticky) | 56 px: Zurück, Titel (Name + `title_field`), StatusBadge, Autosave-Status („Gespeichert 14:05“ / „Nicht gespeichert“ `warning-text`), rechts Workflow-Leiste + `⋯` |
| Workflow-Leiste | Status-Badge → erlaubte Übergänge als secondary-Knöpfe (max 2 sichtbar + `⋯`), Primär = Haupt-Fortschritt (z. B. „Senden“), gefährliche in `⋯` mit `danger-text`; Buchen = primary mit Schloss-Icon; nach Übergang Badge-Wechsel 200 ms Crossfade |
| Banner (Seite) | volle Breite über Inhalt, Radius 6, `*-soft` + Icon + Text + Aktion rechts; Arten info/warning/danger/success; schließbar nur info; Beispiele: „Testmodus – Belege werden nicht signiert“ (`special-soft`), „Storniert am …“ (`danger-soft`), „Offline – 3 Belege warten“ (`warning-soft`) |
| Krümel | 12 px `muted`, Trenner `chevron-right` 12, letzte Ebene `ink` 500, max 3 Ebenen, davor `arrow-left` Zurück |
| Tastenkappe `<kbd>` | 11 px mono, `bg-surface-3`, Rand `line`, Radius 4, min 20×20, `shadow-bo-xs`; Mac/Windows-Symbole je `navigator.platform` (⌘ / Strg) |
| Fortschrittsbalken / Phasenleiste (Projekt) | Phasen als Segmente 8 px hoch, Radius 4, fertig `ink`, aktuell `accent` mit Puls 0 (keine Dauerbewegung) + Label darunter 12, offen `surface-3`; Klick springt zur Phase |
| Datei-Upload | Dropzone gestrichelt `line-control` Radius 10, Hover/Drag `accent` + `accent-soft`, Liste mit Icon je Typ, Fortschritt 2 px, Fehler je Datei; max 25 MB (aus Frappe), Bildvorschau 64 px |
| Unterschrift (Lieferung/Montage) | Canvas 100 %×200, Rand `line-control`, Linie 2 px `ink`, Knöpfe „Löschen“ ghost, „Übernehmen“ primary 48 px; Grundlinie gestrichelt |
| Zahlen-Tastatur (Kiosk) | 3×4 + Spalte (⌫, C, 00, ↵), Taste 72×64 Radius 10 `surface` Rand `line`, Ziffer 24/500, aktiv `surface-3` + 1 px, Haptik via `navigator.vibrate(10)` wenn verfügbar |

---

## 9. Arbeitsplatz-Auswahl und Login (Gestaltung)

```
Login (zentriert, Karte 400 px, Radius 16, p 32, surface, Rand line; Hintergrund bg)
            Platzhirsch           ← Bodoni Wortmarke 24, tracking .12em
            Backoffice            ← 13 muted
  E-Mail  [                    ]
  Passwort[                 👁 ]
  [ Anmelden ]  (primary, volle Breite, 40)
  Hinweis bei Rate-Limit: Banner warning „Zu viele Versuche. In 9 Min. erneut.“
```

Arbeitsplatz-Kacheln: 5 Kacheln 200×160 (Radius 16, Icon 32, Titel 16/500, Untertitel 12 muted: „Vollbild, iPad“), Hover `translateY(-2px)` + Rand `line-strong`, gewählte zuletzt mit Sand-Kicker „Zuletzt“; Tastatur `1–5`.

---

## 10. Druck-Styles

Grundlage: Website-`@media print` (A4, Ränder 18/16/20 mm, Randboxen Titel/Datum/URL/Seitenzahl, Umbruchregeln) – übernehmen, Hülle-Selektoren auf `.bo-no-print`, Seitenleiste, Kopfzeile, Toasts, Dialoge erweitern.

| Format | Seite | Besonderheiten |
|---|---|---|
| A4 Beleg (Angebot, AB, Rechnung, Lieferschein, Gutschrift) | `@page { size: A4; margin: 18mm 16mm 20mm }`, Falzmarken bei 105/148/210 mm links 5 mm lang 0,2 pt `#999` | Kopf: Wortmarke Bodoni 18 pt + Adresse 8 pt; Anschriftfeld 85×45 mm bei 20 mm von oben, 20 mm links (DIN 5008 Form B, Fensterkuvert); Positionstabelle 9,5 pt, Kopf wiederholt (`thead`), Summenblock rechts 60 mm; Fuß: Bank/UID/Gericht 7,5 pt `#555` (7,46:1); „Seite n von m“; Farben nur Schwarz/Grau, Status-Badges als Text |
| Bon 80 mm (Kassa) | `@page { size: 80mm auto; margin: 4mm }` Vorschau; Produktion über ESC/POS-Druckdienst | Mono 10 pt, Breite 42 Zeichen, Wortmarke als Text zentriert, Positionen Name/Menge×Preis/Betrag, Summen, USt-Tabelle, RKSV-QR 30×30 mm, Kassen-ID, Belegnummer, Zeit |
| Etikett 62×29 mm (Lager) | `@page { size: 62mm 29mm; margin: 2mm }` | Code 128/QR 24 mm, Artikelname 8 pt max 2 Zeilen, Lagerplatz 10 pt fett |
| A6 Etikett Paket / A5 Produktpass | `size: A6` bzw. `A5`, margin 8 mm | Pass: QR 30 mm, Marke Bodoni 14 pt, Daten als Definitionsliste 9 pt |
| Tourenblatt / Zählliste / Teilnehmerliste | A4 quer `size: A4 landscape` | Tabelle 9 pt, Zeilenhöhe ≥ 7 mm für Handschrift, Checkbox-Kästchen 4 mm |
| Listen-Export „Drucken“ (jede DataTable) | A4 hoch/quer automatisch nach Spaltenzahl (> 6 → quer) | Filter als Kopfzeile, Summen, Datum/Benutzer in Fußzeile |

Allgemein: `html { font-size: 10pt }`, `body` weiß, Text `#111`, Links ohne Unterstreichung, Bilder ≤ 160 mm hoch, `break-inside: avoid` für Zeilen/Blöcke, `orphans/widows 3`, Hintergrundfarben nur mit `print-color-adjust: exact` für Status-Punkte (sonst Text), Sticky aufgehoben. Druck-Routen `/druck/[doctype]/[name]` rendern ohne Shell (kein `.bo-no-print` nötig); `window.print()` erst nach `fonts.ready`.

---

## 11. Barrierefreiheit (Prüfliste je Komponente)

- Kontrast Text ≥ 4,5:1, große Schrift/Icons/Ränder ≥ 3:1 (Werte §1); Prüfung hell + dunkel in E2E (axe serious/critical = 0).
- Fokusring immer sichtbar (2 px `focus`, Offset 2; in Tabellenzeilen Offset −2), Reihenfolge = visuelle Reihenfolge, Fokusfalle in Dialog/Sheet/Palette, Rückgabe an Auslöser.
- Jede Icon-Schaltfläche `aria-label`; jede Tabelle `caption` (sr-only) und `scope`; Statusänderungen in `aria-live="polite"`; Fehler `role="alert"`.
- Tastatur vollständig (§8), Kürzel dokumentiert unter `?` und in Tooltips; keine Einzel-Buchstaben-Kürzel während Eingabe.
- Zoom 200 % ohne Verlust (Tabellen scrollen, Shell bricht auf Off-Canvas), `prefers-reduced-motion`, `forced-colors` (Ränder statt Farbflächen: `outline` bei Badges, `appearance: auto` bei Checkbox/Radio).
- Zielgrößen §0.8; Abstände zwischen Zielen ≥ 8 px.

---

## 12. Übernahme ins Fundament (Reihenfolge für den Design-Umsetzungs-Agenten)

1. `globals.css`: §1.7 ergänzen (Aliasse, neue Rollen, Charts, Dunkel-Doppelblock mit `data-theme`), `.bo-input` Rand auf `line-control`, `.bo-skeleton` auf Linen/1600 ms, `* { transition-duration }`-Regel durch gezielte Reduced-Motion-Regeln ersetzen, Typo-Token §2.2 und Dichte-Variablen §4 einführen.
2. `StatusBadge`: Ton `tuerkis` ergänzen, Hintergrund `*-soft` + Text `*-text`, Punktform je Ton, Rand entfernen. `statusTon()`: `Info` → `tuerkis`, `Primary` → `blau`.
3. `Knopf`: Varianten `danger-solid`, `icon`, Loading mit Breitenfixierung, Größen nach Dichte.
4. `Seitenleiste`: Sand-Balken aktiv, `nav-text-soft` neu, Kürzel `⌘B`, Tooltips eingeklappt.
5. `DataTable`: Massenaktionsleiste unten, `j/k`, sticky erste Spalte, Zeile aktiv (Side-Peek).
6. `Kanban`: Drag-Schatten/Rotation, Drop-Verbote mit Tooltip, Live-Region.
7. Neue Bausteine: `Sheet`, `Popover/Menu`, `Tooltip`, `Tabs`, `Segment`, `Combobox`, `DatumFeld`, `BetragFeld`, `Banner`, `Kbd`, `Avatar`, `Phasenleiste`, `Zahlentastatur`, `Unterschrift`, `Upload`.
8. Druck: `/druck`-Layouts nach §10, Website-Druckregeln übernehmen.
9. Benutzermenü: Dunkel/Hell/System, Dichte, Ruhige Ansicht, Kürzel-Übersicht.

Offene Entscheidungen für den Inhaber (keine Blocker): (a) Seitenleiste hell = Tinte (Vorschlag) oder hell = Paper mit Tinte-Text; (b) Standard-Dichte Desktop kompakt (Vorschlag) oder komfortabel; (c) Bodoni-Kopfzahl auf der Zentrale ja (Vorschlag) oder durchgehend Instrument Sans.
