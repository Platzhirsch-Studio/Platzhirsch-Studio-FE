# Wachstumsrat – Interaktion: Animation, Spielgefühl, Konfiguratoren

**Stand:** 28.10.2026 · **Gremium:** Animations-, Spieleentwickler- und Konfigurator-Experten · **Kürzel:** `interaktion`
**Geprüft:** Küchenplaner, Sofaplaner, Stil-Finder, Dreiländer-Preisrechner und Karte, AR-/3D-Viewer, Yacht-Werfthalle, Concierge, Handy-Upload/Portal. Der Ezarri-Konfigurator existiert noch nicht im Code (kein `src/lib/ezarri`, keine Route). Dafür liefert dieses Dokument eine vollständige Spezifikation (Abschnitt 3.10).
**Methode:** (a) Codeprüfung aller Interaktionsdateien (Motion-Tokens, Reduced-Motion-Pfade, Lade- und Fehlerzustände, Gesten, Haptik). (b) Selbst durchgespielt per Playwright (Pixel 7, ein Browser zur Zeit, kein Formular abgeschickt). Screenshots: `qa-screenshots/wachstumsrat/interaktion/`.
**Grundlage:** Motion-Tokens in `src/app/globals.css` (Z. 125–139), `digital/02-animation-motion.md`, `expertenrat/10-spielentwicklung-gamification.md` (Game-Feel-Tokens), `expertenrat/11-motion-choreografie.md` (Übersetzungstabelle Reduced Motion), Inhaber-Entscheidungen Nr. 6–9.

> **Einschränkung beim Durchspielen:** Der Dev-Server auf :3000 war beim Test durch parallele Bau-Teams stark überlastet. Die erste Antwort von `/de/labs/stilfinder` kam nach 329 s. Küchenplaner, AR-Viewer und Yacht brachen beim Laden ab (`ERR_ABORTED`, Timeout 240 s), und `/de` lieferte zeitweise 500 wegen eines Build-Fehlers in `src/lib/stilfinder/curate.js` (`sceneFocus` fehlte). Ladezeiten aus diesem Test sagen deshalb **nichts** über die Produktion aus. Live durchgespielt wurden auf dem Handy (Pixel 7): der Stil-Finder (alle 7 Fragen), der Sofaplaner (Schritt 1) und der Dreiländer-Rechner (Eingabe 8.000 €). Auf jeder Seite meldete die Konsole `SyntaxError: Unexpected end of input`, vermutlich ein halb geschriebener Chunk der parallelen Teams [prüfen auf Prod-Build]. Zwei Befunde aus dem Durchspielen: (1) Der Sofaplaner trägt noch die Kennzeichnung „LABS · PROTOTYP“, das widerspricht Inhaber-Entscheidung 9. (2) Beim Rechner verschwindet das Ergebnis auf dem Handy unter dem Falz (siehe 3.5). Alle anderen Urteile stützen sich auf den Code und frühere QA-Screenshots. Vor der Abnahme gehört jede Zeile der Spezifikation auf einen Prod-Build (`next build && next start`) und auf ein echtes iPhone und Android-Gerät.

---

## 1. Urteil zum Ist-Stand

| Tool | Note (1–10) | Kurzurteil |
|---|---|---|
| **Yacht-Werfthalle** | **8,5** | Das ist die Referenz im Projekt. Kamerafahrten über `CameraControls` mit `smoothTime 0.42`, Schnittanimation 400 ms, `frameloop="demand"`. Reduced Motion **und** der Schalter „Ruhige Ansicht“ werden beachtet (`Werfthalle.js:48`). Tastatur und `aria-live` sind vorhanden. |
| **Stil-Finder** | **8** | Live auf dem Handy gespielt: Die Wahl bestätigt sich sofort mit Haken und Rahmen, der Fortschritt steht als „02 / 07“ mit Linie da, und ein Hinweis erklärt, dass Wischen zurückgeht. Das Timing ist gut gewählt: 380 ms nach der Wahl, Eintritt 500 ms, danach der bewusste Moment „Wir legen Ihr Moodboard aus …“ (900 ms). Schwächen: Framer-`useReducedMotion` kennt „Ruhige Ansicht“ nicht, und das Bild-Hover nutzt `duration-700 ease-out` statt Tokens. |
| **Küchenplaner** | **7** | Fachlich sehr stark: Magnet, Raster, Long-Press 300 ms mit 8-ms-Vibration, Pinch, Undo/Redo, Pfeiltasten (WCAG 2.5.7), Ladekapsel und Hinweis nach 12 s. **Aber:** Beim Wechsel von Rundum zu Draufsicht oder „Ich stehe in der Küche“ **springt** die Kamera hart (`Scene3D.js:796–804`, `camera.position.set`). Ein abgelegtes Modul springt ohne „Einrasten“ an seinen Platz, der Preis springt ohne Rückmeldung, und „Ruhige Ansicht“ wird ignoriert. |
| **Sofaplaner** | **7** | Andockziel grün bzw. rot gestrichelt, Undo-Toast, sauberer Fokus beim Schrittwechsel (auch unter sticky Leisten). **Aber:** Die 3D-Vorschau ist ohne Dämpfung (`enableDamping={false}`) und fühlt sich daher hölzern an. Der Toast erscheint ohne Ein- und Austritt. Der Hinweis verschwindet nach 6 s (bei langem Lesen kritisch, WCAG 2.2.1). Einrasten wird nicht hörbar, fühlbar oder sichtbar „belohnt“. |
| **Dreiländer-Rechner/Karte** | **7** | `AnimatedNumber` (700 ms, eigene Bezier-Kurve, Screenreader liest nur den Endwert) ist vorbildlich und sollte wiederverwendet werden. **Aber:** Der Lochau-Puls läuft **endlos** (`dreilaender.module.css:210`, 2,8 s infinite). Das widerspricht der Hausregel „nichts bewegt sich von selbst“ (globals.css-Kommentar, WCAG 2.2.2) und ignoriert „Ruhige Ansicht“. Die Dauern sind fest im Code (400/900/800 ms, `ease`) statt als Tokens. |
| **AR-/3D-Viewer** | **6,5** | Fortschrittsbalken mit Prozent für Screenreader, Fallbacks und Phone-Handoff sind gut. **Aber:** `auto-rotate` beginnt nach 4 s und dreht **ohne Pause-Knopf** (WCAG 2.2.2) und ohne Rücksicht auf „Ruhige Ansicht“. Beim Farbwechsel tauscht das Material hart, ohne Crossfade. |
| **Concierge** | **7** | Panel und Launcher beachten `data-motion`. Die Tipp-Punkte (`breathe`) prüfen nur die Media Query. Die Labs-Variante prüft nur `prefers-reduced-motion`. |
| **Handy-Upload / Portal** | **7,5** | Upload: Haken-Strich-Animation, Vibration 8/14 ms nur ohne Reduced Motion, sauber. Portal-Sprachnotiz mit Live-Wellenform. Beide prüfen nur die Media Query. |
| **Ezarri-Konfigurator** | – | Gibt es noch nicht. Spezifikation folgt in 3.10. |
| **Gesamt Interaktionsqualität** | **7,3** | Handwerklich weit über dem Händler-Durchschnitt. Für die Stufe „fertig“ (≥ 9) fehlen drei Querschnitts-Punkte: **eine** Bewegungs-Weiche für alle Tools, Kamerafahrten statt Sprüngen und ein durchgängiges Rückmeldungs-Vokabular (Einrasten, Preisänderung, Toast, Abschluss). |

---

## 2. Befunde und Chancen

### 2.1 Querschnitt (betrifft alle Tools)

**B1 – „Ruhige Ansicht“ ist in den Tools wirkungslos (P0, Barrierefreiheit/BaFG).**
Der Footer-Schalter setzt `html[data-motion="reduced"]` (`FooterIslands.js:58`). Shell, Videos, Galerie, Yacht und Concierge-Panel beachten ihn. Diese Stellen prüfen **nur** `prefers-reduced-motion`:
`Labs/Kuechenplaner/Viewer.js:35`, `KuechenplanerApp.js:758`, `Labs/Sofaplaner/Planner.js:206/289`, `Labs/ArViewer/ArViewerApp.js:55`, `ProductViewer.js:44`, `ModelStage.js` (auto-rotate), `Labs/Concierge/Concierge.js:85`, `ProductCards.js:38`, `Labs/Dreilaender/AnimatedNumber.js` und `.pulse`, `Labs/Stilfinder/*` (über Framer `useReducedMotion`), `Portal/Planung/client.js:19`, `Upload/UploadClient.js:200`, `Concierge/panel.module.css` (`.dots`), `Concierge/core/ActionCard.js:42`, `SiteProductCards.js:55`.
Folge: Wer den Schalter nutzt, bekommt in genau den bewegungsreichsten Teilen der Seite weiter Kamerafahrten, Auto-Rotate, Puls und Zähl-Animationen. Ein Schalter, der nur halb wirkt, ist schlechter als gar keiner, weil er Vertrauen kostet.
→ Lösung: ein Hook `useCalmMotion()` plus eine CSS-Regel (Baustein 3.1).

**B2 – Token-Drift.** Neben den Tokens stehen feste Werte: `duration-150/200/500/700`, `ease-out`, `ease-in-out` sowie in `dreilaender.module.css` 250/300/400/800/900 ms mit `ease`. Das ergibt vier Kurven in einem Tool. Dem Nutzer fällt das nicht bewusst auf, es wirkt aber „unruhig“. Im Vergleich dazu fühlt sich die Werfthalle einheitlich an, weil alles auf einer Kurve läuft.

**B3 – Kamera springt (Küchenplaner) bzw. fühlt sich hölzern an (Sofaplaner).** In Spielen ist ein harter Kamerasprung ohne Überblende ein bekannter Orientierungskiller: Der Spieler verliert den Bezug zum Raum. Bei der Küche heißt das, der Kunde weiß nach „Ich stehe in der Küche“ nicht mehr, wo die Insel ist. Die Lösung liegt schon im Projekt (`CameraControls` aus drei, siehe `Yacht/Stage3D.js:298–306`).

**B4 – Dauerbewegung ohne Pause:** Dreiländer-Puls (endlos), AR-Auto-Rotate (ab 4 s, endlos bis zur Interaktion), Concierge-Tipp-Punkte (nur solange „tippt“, das ist in Ordnung). WCAG 2.2.2 verlangt für automatisch startende Bewegung, die länger als 5 s läuft, einen Mechanismus zum Anhalten. Der Puls ist zudem rein dekorativ.

**B5 – Preisänderungen ohne Rückmeldung.** Der Küchenplaner zeigt „min – max €“ und springt bei jedem Modul (`KuechenplanerApp.js:474`). In Spielen ist die Änderung der Ressourcenanzeige das wichtigste Feedback, und ein Konfigurator verhält sich hier genauso. Ein Kunde, der eine Insel hinzufügt und den Preis nur „irgendwie anders“ sieht, verliert Vertrauen. Ein Kunde, der „+ 4.200 – 5.100 €“ kurz aufleuchten sieht, versteht die Wirkung seiner Wahl. `AnimatedNumber` existiert schon.

**B6 – Haptik uneinheitlich.** Es gibt drei eigene Lösungen (Küchenplaner 8 ms, Upload 8/14 ms, sonst nichts). iOS Safari kennt `navigator.vibrate` nicht. Der bekannte Trick über `<input type="checkbox" switch>` löst zwar den Taptic-Effekt aus ([azukiazusa.dev](https://azukiazusa.dev/en/blog/ios-safari-web-haptics), [Ionic-Issue #29942](https://github.com/ionic-team/ionic-framework/issues/29942)). Er ist aber nicht standardisiert, und laut einer einzelnen Quelle hat Apple ihn mit iOS 26.5 geschlossen ([rapidtoolset](https://rapidtoolset.com/en/tool/ios-haptics-tester), auf echtem Gerät [prüfen]). **Empfehlung: nicht einsetzen.** Haptik bleibt Zugabe für Android, nie das einzige Signal.

**B7 – Momente des Einrastens fehlen.** Beim Andocken (Sofa), Ablegen (Küche) oder Erreichen eines gültigen Plans gibt es keinen kurzen „Klick“-Moment. Swink beschreibt diese Politur als Kern des Game-Feel ([Game feel](https://en.wikipedia.org/wiki/Game_feel)). Ohne sie fühlt sich ein Planer wie ein Formular an.

**B8 – Toasts und Hinweise ohne Ein- und Austritt, Auto-Dismiss ohne Pause.** Der Sofa-Hinweis verschwindet nach 6 s, der Toast erscheint hart. WCAG 2.2.1 (Timing Adjustable): Text, der verschwindet, muss sich anhalten lassen, zum Beispiel per Hover oder Fokus.

**B9 – Kein Abschluss-Höhepunkt in den Planern.** Der Stil-Finder hat ihn („Wir legen Ihr Moodboard aus …“). Küche und Sofa enden in einem Reiter „Ergebnis“ bzw. „Übersicht“ ohne Moment. Laut Peak-End-Regel bewerten Menschen eine Erfahrung vor allem nach dem Höhepunkt und dem Ende ([Fredrickson & Kahneman 1993, JPSP 65(1)](https://doi.org/10.1037/0022-3514.65.1.45)). Der Abschluss ist genau die Stelle, an der die Anfrage passiert. **Hier liegt der größte Umsatzhebel dieses Gremiums.**

**B10 – Gamification ohne Kitsch fehlt als System.** Punkte, Abzeichen und Ranglisten sind zu Recht verboten (`expertenrat/10`, Hanus & Fox 2015). Erlaubt und wirksam ist der **Fortschritt als Werkstück**: Der Plan wird sichtbar „vollständiger“, und genau das ist es, was Harald Menghin für ein Angebot braucht (Raummaß, Fotos, Budgetrahmen, Wunschtermin). Der Endowed-Progress-Effekt zeigt, dass Menschen eine begonnene, sichtbar fortgeschrittene Aufgabe eher abschließen ([Nunes & Drèze 2006, J. Consumer Research 32(4)](https://doi.org/10.1086/500480)). Das hebt Abschlussquote **und** Lead-Qualität. Es ist ehrlich, weil jeder Punkt wirklich gebraucht wird.

**B11 – Labs werden integriert (Inhaber-Entscheidung 9).** Mit dem Umzug weg von `/labs` sehen die Planer ganz normale Besucher und nicht mehr nur Neugierige. Alle Spezifikationen unten gelten für die integrierten Routen.

### 2.2 Chancen (Vorsprung gegenüber dem Markt)

- **„Kamera als Gastgeber“:** Jede Ansicht wird angefahren und nicht geschnitten. Das kann kein Händlerplaner in der Region. Bei IKEA- und Herstellerplanern ist der Kamerasprung üblich [Stichprobe nicht systematisch geprüft].
- **Preis, der sich erklärt:** Jede Änderung zeigt ihr Delta. Das schafft Vertrauen gerade bei fehlenden Listenpreisen („Preisrahmen“).
- **Abschluss als Übergabe an Menschen:** Der Plan „wandert“ in eine Mappe mit Haralds Handskizzen-Stil (Linie zeichnet sich). Das ist der USP aus Inhaber-Entscheidung 8, in Bewegung übersetzt. Es werden nur echte Skizzen oder abstrakte Linien gezeigt, keine KI-Skizze.
- **Ezarri-Wasser-Simulation** als Signature-Moment im Pool-Bereich, mit ruhigem Licht-Kaustik-Loop, der standardmäßig **steht** und erst auf Wunsch läuft.

---

## 3. FERTIGE Bausteine: Interaktions-Spezifikation je Tool

### 3.0 Gemeinsame Konventionen (gelten für alle Tabellen)

**Tokens** (vorhanden in `globals.css`, keine neuen außer `--duration-settle` und `--duration-delta`):

| Token | Wert | Verwendung in Tools |
|---|---|---|
| `--duration-ack` | 50 ms | erste sichtbare Reaktion auf Tippen/Klick (Pressed, Ring) |
| `--duration-micro` | 160 ms | Hover, Fokus, Chip an/aus, Einrast-Ring |
| `--duration-swap` | 240 ms | Material-/Farbwechsel (Crossfade), Preis-Delta erscheint |
| `--duration-ui` | 280 ms | Panel, Bottom-Sheet, Toast rein, Reiterinhalt |
| `--duration-morph` | 400 ms | Modul gleitet an Platz, Element wechselt Liste |
| `--duration-enter` | 600 ms | Kamerafahrt kurz, Abschlussmoment Teil 1 |
| `--duration-exit` | 180 ms | alles, was geht |
| `--duration-slow` | 1200 ms | Kamerafahrt lang (Ansichtswechsel), Abschluss gesamt |
| **neu** `--duration-settle` | 120 ms | Einrasten (Scale 1 → 1.015 → 1 bzw. Linien-Flash) |
| **neu** `--duration-delta` | 2000 ms | Standzeit des Preis-Deltas |
| `--ease-quiet` | `cubic-bezier(0.22,1,0.36,1)` | alles Eintretende |
| `--ease-quiet-inout` | `cubic-bezier(0.65,0,0.35,1)` | Kamera, Morph |
| `--ease-exit` | `cubic-bezier(0.4,0,1,1)` | Austritte |
| `--ease-pop` | `cubic-bezier(0.34,1.4,0.64,1)` | **nur** Merkliste-Herz und Zähler, **nicht** in Planern |

**Reduced-Motion-Regel (R):** Gilt bei `prefers-reduced-motion: reduce` **oder** `html[data-motion="reduced"]`. Wege, Skalierungen, Kamerafahrten und Stagger werden zu einem Crossfade ≤ 150 ms oder zu einem Schnitt. Farbe, Haken, Text und Ring bleiben immer. Dauerbewegung entfällt, Haptik entfällt.

**Lade-Leiter (L)**, für jedes Tool gleich:

| Zeit seit Auslösen | Anzeige |
|---|---|
| 0–50 ms | Knopf im Zustand „gedrückt“ (`aria-busy="true"`), sonst nichts |
| ab 300 ms (`--spinner-delay`) | ruhige Kapsel „3D wird vorbereitet …“ mit Fortschrittslinie (`scaleX`, nicht `width`). Wenn sie erscheint, steht sie mindestens 600 ms. |
| ab 1 s | Prozentwert, falls bekannt, sonst die Linie im unbestimmten Modus (bei R: statische Linie plus Text) |
| ab 10–12 s | Hinweis „Langsame Verbindung – [2D/Plan] ist schon nutzbar“ (Küche hat ihn, auf alle übertragen) |
| Fehler | Rückfall auf 2D/Poster plus Knopf „Erneut laden“, `role="status"` |

**Haptik (H):** ein Helper `haptic(kind)` mit den Arten `tick` (6 ms), `snap` (8 ms) und `done` (14 ms). Er wirkt nur wenn `navigator.vibrate` existiert, **nicht** R gilt **und** `pointerType` touch war. Kein iOS-Trick. Nie das einzige Signal.

### 3.1 Fundament (vor allen Tools umzusetzen)

**`src/lib/motion/useCalmMotion.js`** (neu, Code-Team):
```js
// true, wenn Bewegung reduziert werden soll: System ODER Footer-Schalter.
// useSyncExternalStore: abonniert matchMedia("(prefers-reduced-motion: reduce)")
// und einen MutationObserver auf <html data-motion>. Server-Snapshot: false.
export function useCalmMotion() { … }
export function isCalmMotion() { … } // für Event-Handler außerhalb von React
```
- Ersetzt **alle** oben in B1 gelisteten `matchMedia`-Aufrufe. Im Stil-Finder und im Dreiländer-Rechner wird das `useReducedMotion` aus `Labs/motion.js` durch einen Re-Export ersetzt, der `useCalmMotion` nutzt. Für Framer zusätzlich `<MotionConfig reducedMotion={calm ? "always" : "never"}>` in `LabsMotion`.
- **CSS** in `globals.css`: Die Tools nutzen CSS Modules mit `@media (prefers-reduced-motion: reduce) {…}`. Jeder solche Block bekommt den Zwilling `:global(html[data-motion="reduced"]) …`. Prüfung per Grep im CI: Jede Datei, die `prefers-reduced-motion` enthält, muss auch `data-motion` enthalten.
- Tailwind: Die Variante `calm:` als `@custom-variant calm (@media (prefers-reduced-motion: reduce), html[data-motion=reduced] &);` ersetzt `motion-reduce:` in Tools.

**`src/lib/motion/haptic.js`:** siehe (H). **`src/components/Motion/PriceDelta.js`:** siehe 3.2, Zeile „Preis“. **`src/components/Motion/Toast.js`:** siehe 3.3, Zeile „Toast“, für alle Tools gleich.

### 3.2 Küchenplaner

| Prio | Zustand / Auslöser | Verhalten normal | Dauer / Easing | R-Variante |
|---|---|---|---|---|
| **P0** | Ansichtswechsel Rundum ↔ Draufsicht ↔ „Ich stehe in der Küche“ | Kamera fährt per `CameraControls.setLookAt(…, true)` (wie Yacht); FOV-Wechsel 45 → stand-FOV linear mitlaufend; während der Fahrt `controls.enabled=false`, Bedienleiste bleibt bedienbar (Klick bricht ab und springt ans Ziel) | `smoothTime 0.45` (≈ 1,0–1,2 s bis Ruhe); Draufsicht: zuerst hochziehen, dann drehen (zwei `await`-Schritte à 0.3) | Schnitt: Ziel sofort, Bild 150 ms Crossfade über Canvas-Overlay (`opacity`) |
| **P0** | Preis ändert sich | Zahl rollt (vorhandenes `AnimatedNumber`), daneben Delta-Chip „+ 1.240 – 1.480 €“ (bzw. „– …“) in `text-ink-soft`, rein `translateY(4px)→0` | Zahl 700 ms `--ease-quiet`; Chip rein 240 ms, steht 2000 ms, raus 180 ms `--ease-exit`; `aria-live="polite"` nur Endwert nach 800 ms Ruhe | Endwert sofort; Chip erscheint/geht per 150 ms Opacity, bleibt bis zur nächsten Änderung |
| P1 | Modul abgelegt (Drag-Ende, gültig) | Modul gleitet vom Fingerpunkt in die Rasterposition, dann Einrasten: Kontur 1 × Flash in Ink (Strichstärke 1 → 2 → 1) | Gleiten 160 ms `--ease-quiet`; Einrasten 120 ms; Haptik `snap` | Sofort an Position; Kontur 150 ms Farbwechsel |
| P1 | Drag ungültig („Kein Platz“) | Vorschau rot schraffiert (vorhanden); beim Loslassen: Geist fährt zurück zur Palette | 240 ms `--ease-exit` | Geist verschwindet (Opacity 150 ms); Text bleibt |
| P1 | Long-Press scharf (Palette, Touch) | vorhanden (Ring + 8 ms) → auf `haptic("tick")` umstellen, Ring per `scale 0.97→1` | 160 ms | Ring ohne Scale |
| P1 | „Vorschlag“ / „Neu auffüllen“ (Zauberstab) | Neue Module erscheinen **nacheinander** von links nach rechts (Stagger), sodass der Kunde sieht, was das System tut | je 60 ms Stagger, max. 240 ms gesamt; je Modul Opacity + `translateY(6px)` 280 ms | alle gleichzeitig, 150 ms Opacity |
| P1 | Reiterwechsel Raum → Möbel → … | Inhalt Crossfade + 8 px; Scroll zum Planer-Anfang (vorhanden) | rein 280 ms, raus 120 ms | nur Opacity 120 ms; Scroll `auto` |
| P1 | 3D laden | Lade-Leiter (L) – vorhanden, nur auf Tokens umstellen; nach erstem Frame: Canvas blendet über die 2D-Ansicht | 400 ms Crossfade | Schnitt |
| P1 | Prüfen: neue Warnung | Warnung rutscht in die Liste, Reiter „Prüfen“ bekommt Zähler-Punkt (ocker) | 280 ms | Punkt ohne Bewegung |
| P2 | Undo / Redo | Betroffenes Modul blinkt 1 × (Kontur), Status „Rückgängig: Unterschrank 60 entfernt“ | 160 ms | Farbwechsel ohne Blinken |
| P2 | Licht Tag ↔ Abend | Lichtwerte interpolieren | 600 ms `--ease-quiet-inout`, `invalidate()` je Frame nur während der Blende | Schnitt |
| P2 | „Foto der Ansicht“ | Weißer Blitz über Canvas (Opacity 0 → 0,6 → 0), danach Vorschau-Thumbnail fliegt in „Ergebnis“ | Blitz 160 ms; Flug 400 ms `--ease-quiet-inout` | kein Blitz; Toast „Foto gespeichert“ |
| **P0** | **Abschluss** (Reiter Ergebnis, Plan gültig) | siehe 3.9 „Abschlussmoment“ | | |
| P2 | Orbit-Dämpfung | vorhanden (`enableDamping={!reduced}`) → auf `useCalmMotion` | | keine Dämpfung |

### 3.3 Sofaplaner

| Prio | Zustand / Auslöser | Verhalten normal | Dauer / Easing | R-Variante |
|---|---|---|---|---|
| P1 | Element dockt an (gültig) | Grüne Kontur (vorhanden), **plus** beim Loslassen: Fuge zwischen den Elementen zeichnet sich als 2-px-Linie (`stroke-dashoffset`) | Linie 240 ms `--ease-quiet`; `haptic("snap")` | Linie sofort |
| P1 | Andocken blockiert | Rot gestrichelt (vorhanden) + Element gleitet zur letzten gültigen Position | 240 ms `--ease-exit` | Sprung |
| **P0** | 3D-Vorschau | `enableDamping` an (`dampingFactor 0.08`); beim Öffnen fährt die Kamera von der Draufsicht in die 3/4-Ansicht | Fahrt 900 ms `--ease-quiet-inout` | keine Dämpfung, keine Fahrt |
| P1 | Toast (Undo) | rein von unten `translateY(8px)` + Opacity; Fortschrittslinie zeigt Restzeit; Hover/Fokus pausiert | rein 280 ms, raus 180 ms; Standzeit 6 s → **pausierbar** | Opacity 150 ms; **kein Auto-Dismiss** |
| P1 | Hinweis (6 s) | wie Toast: Pausieren bei Hover/Fokus; Schließen-Knopf | – | bleibt bis zur nächsten Aktion (vorhanden) |
| P1 | Schritt 1–6 Wechsel | Schrittleiste: aktive Linie gleitet zum neuen Schritt (`translateX` + `scaleX`) | 280 ms | Schnitt |
| P1 | Bezug/Farbe wählen | Swatch: Pressed `scale 0.97` 50 ms; Sofa in 2D und 3D: Farbe Crossfade | Pressed 160 ms gesamt; Farbe 240 ms (3D: Farbe lerpen, `invalidate`) | Farbe sofort, Ring bleibt |
| P2 | Element drehen / spiegeln | Drehung animiert um Mittelpunkt | 280 ms `--ease-quiet-inout` | Sprung |
| P2 | „Im Raum prüfen“: Laufweg zu knapp | Laufweg-Band pulsiert **einmal** ocker (keine Schleife) | 600 ms | Farbe ohne Puls |
| **P0** | Abschluss (Übersicht) | 3.9 | | |

### 3.4 Stil-Finder

| Prio | Zustand / Auslöser | Verhalten normal | Dauer / Easing | R-Variante |
|---|---|---|---|---|
| P1 | Wahl einer Karte | vorhanden: Haken, Rahmen, 380 ms bis zur nächsten Frage → behalten | – | 60 ms (vorhanden) |
| P1 | Bild-Hover | `duration-700 ease-out` → `--duration-slow`/`--ease-drift`, nur `(hover:hover)` | 1200 ms | keiner |
| P1 | Fortschritt | Linie über `scaleX` (prüfen: kein `width`) | 600 ms | Sprung |
| P1 | „Wir legen Ihr Moodboard aus …“ | vorhanden. Die Farbleiste füllt sich Feld für Feld, **nur so lange wie die Navigation dauert**, und läuft nie künstlich länger | 5 × 80 ms Stagger | Leiste steht |
| P2 | Moodboard-Aufbau | Stagger max. 9 Kacheln à 80 ms (laut Rat 10); heute 0,1 + i × 0,12 s → auf 80 ms kürzen | gesamt ≤ 1,2 s | alles sofort |
| P2 | Zurück-Wischen | Karte folgt dem Finger 1:1, ab 30 % Breite zurück | Ausrollen 280 ms | Wischen als Geste bleibt, ohne Folgebewegung |
| P2 | Ergebnis gespeichert/PDF | Häkchen-Strich (wie Upload) + `haptic("done")` | 400 ms | Haken statisch |

### 3.5 Dreiländer-Rechner und Karte

| Prio | Zustand / Auslöser | Verhalten normal | Dauer / Easing | R-Variante |
|---|---|---|---|---|
| **P0** | Lochau-Puls | **Endlosschleife entfernen.** Stattdessen 2 Pulse beim ersten Sichtbarwerden (IntersectionObserver), dann Ruhe | 2 × 1400 ms `--ease-quiet` | kein Puls |
| P1 | Ort wählen | Route zeichnet sich (vorhanden, 900 ms) → auf `--duration-slow`/`--ease-quiet` umstellen; Text erscheint **sofort** (Rat 11, G9) | Route 900 ms; Punkt `r` 160 ms | Route sofort sichtbar |
| P1 | Betrag tippen | `AnimatedNumber` (vorhanden) | 700 ms | sofort |
| **P1** | Betrag tippen **auf dem Handy** (Befund aus dem Durchspielen, Screenshot `dreilaender-ergebnis--phone.png`) | Nach der Eingabe liegt das Ergebnis unterhalb des Falzes, und die Tastatur bzw. der Cookie-Banner verdeckt es: Der Nutzer sieht **keine** Rückmeldung. Lösung: Unter dem Feld eine angeheftete Ergebnis-Kapsel „≈ CHF 7.4xx inkl. MWST ↓“ (Wert live) mit Sprung zum Rechenweg. Sie erscheint, sobald das Ergebnis nicht im Viewport ist (IntersectionObserver) | Kapsel rein 280 ms `translateY(8px)`, Wert per `AnimatedNumber` | Opacity 150 ms, Wert sofort |
| P1 | Vergleichsbalken | `transform 800ms` → `--duration-enter` + Token-Kurve | 600 ms | sofort |
| P2 | Preset-Chip | Pressed 50 ms, aktiv Ink | 160 ms | Farbe |

### 3.6 AR-/3D-Viewer

| Prio | Zustand / Auslöser | Verhalten normal | Dauer / Easing | R-Variante |
|---|---|---|---|---|
| **P0** | Auto-Rotate | Nur **eine** Umdrehung nach 4 s, dann Stopp. Dazu sichtbarer Knopf „Drehung anhalten/fortsetzen“ (WCAG 2.2.2) | `rotation-per-second="18deg"` → eine Runde ≈ 20 s | `auto-rotate` aus (auch bei `data-motion`) |
| P1 | Farbe/Variante wechseln | `variantName` tauschen, davor 120 ms Opacity-Dip des Stage-Overlays (verdeckt den harten Materialwechsel) | 120 ms aus, 240 ms ein | Schnitt |
| P1 | Maße einblenden | Linien zeichnen sich nacheinander (Breite, Tiefe, Höhe) | je 240 ms, Stagger 80 ms | sofort |
| P1 | „In meinem Raum ansehen“ (AR) | Knopf: Pressed; ohne AR → Handoff-QR gleitet ein (vorhanden) | 280 ms | Opacity |
| P2 | Interaktions-Hinweis | `interaction-prompt` nur einmal pro Sitzung | – | aus (vorhanden) |

### 3.7 Yacht-Werfthalle (Referenz, nur Feinschliff)

| Prio | Punkt | Vorgabe |
|---|---|---|
| P2 | Bootstyp-Wechsel | Rumpf-Morph wie Schnitt (400 ms) plus Kamera; vorhanden. Halten. |
| P2 | Muster für andere | `Animator`/`smoothTime`-Logik als `src/lib/motion/cameraTween.js` herauslösen und im Küchenplaner und Sofaplaner nutzen (3.2/3.3 P0) |

### 3.8 Concierge, Upload, Portal

| Prio | Punkt | Vorgabe | R |
|---|---|---|---|
| P1 | Tipp-Punkte `.dots` | `breathe` 1,2 s, nur solange gestreamt wird; `data-motion`-Zwilling ergänzen | drei statische Punkte 70 % |
| P1 | Aktionskarte erscheint | Opacity + 8 px, 280 ms | Opacity 150 ms |
| P1 | Upload-Datei fertig | vorhanden (Haken 400 ms, 8 ms Haptik) → auf `haptic()` und `useCalmMotion` | vorhanden |
| P2 | Portal-Sprachnotiz-Wellenform | live (rAF) ist Rückmeldung, darf bleiben; bei R: Pegel als ruhiger Balken (Höhe in 4 Stufen, ohne Fluss) | |

### 3.9 Abschlussmoment für alle Planer („Übergabe an Harald“) – P0, größter Umsatzhebel

**Ziel:** Das Ende des Planens wird zum Höhepunkt und führt in die Anfrage. Keine Konfetti-Effekte, keine Punkte. Ehrlich: Es wird nur gezeigt, was danach wirklich passiert.

**Ablauf (Küche, Sofa; analog Ezarri):**
1. **Vollständigkeits-Leiste** (ab Schritt 1 sichtbar, oben rechts im Planer, Text plus feine Linie): „Für ein Angebot fehlen noch: Raummaß ✓ · Fotos des Raums · Wunschtermin“. Jeder Punkt hakt sich ab (Haken-Strich 400 ms). Die Leiste ist als **Checkliste** gestaltet, nicht in Prozent und nicht als Level.
2. **Plan gültig + Reiter Ergebnis:** Die Planansicht verkleinert sich in eine „Mappe“ (Karte mit Papierton, Stilmittel Haarlinie). Eine einzelne Bleistiftlinie zeichnet sich einmal um den Grundriss (SVG `stroke-dashoffset`). Das ist die Andeutung der Handzeichnung, abstrakt und ausdrücklich keine KI-Skizze.
   Dauer: Verkleinern 600 ms `--ease-quiet-inout`, Linie 900 ms `--ease-drift`, gesamt ≤ 1,5 s, klickbar ab 0 ms.
3. **Text (Vorschlag, frei von Superlativen und Händler-Aussagen):**
   > **Ihr Plan ist bereit für den nächsten Schritt.**
   > Harald Menghin und das Platzhirsch-Team sehen sich Ihre Planung an. Auf Wunsch kommen wir zu Ihnen, messen auf und zeichnen die Einrichtung von Hand, bevor wir sie in 3D planen.
   > [Plan senden und Termin vorschlagen] · [Plan speichern und später weitermachen]
   *(„zeichnen von Hand“ deckt sich mit Inhaber-Entscheidung 8. Vor Livegang mit dem Inhaber bestätigen, dass das für Online-Anfragen gilt.)*
4. **Nach dem Absenden:** Häkchen 400 ms, `haptic("done")`, `role="status"`: „Danke. Ihr Plan ist bei uns angekommen. Wir melden uns innerhalb von [X] Werktagen.“ [X vom Inhaber festlegen, keine erfundene Zusage]
5. **R-Variante:** Mappe erscheint per Opacity 150 ms, Linie steht fertig da, Text und Knöpfe identisch.

**Messung:** Event `planner_complete_view` → `planner_lead_submit` (je Tool), A/B: Abschlussmoment an/aus über 4 Wochen (Funnel-Gremium).

### 3.10 Ezarri-Konfigurator (neu, Spezifikation für das Bau-Team)

Fachvorgaben aus `wachstumsrat/pool-architektur.md` (SAFE auf Treppe/Bank/Rand automatisch, Fugenfarbe wählbar, Wasserfarbe nach Tiefe, Simulationshinweis) sind Pflicht. Hier nur Interaktion:

| Prio | Zustand / Auslöser | Verhalten normal | Dauer / Easing | R-Variante |
|---|---|---|---|---|
| P0 | Start | Becken-Grundform wählen (4 Kacheln: Rechteck, Freiform, Skimmer, Überlauf) → Becken erscheint in 2,5D-Ansicht (CSS 3D oder SVG, **kein three.js im Initial-Bundle**) | Kachel Pressed 50 ms; Ansicht rein 600 ms | Opacity 150 ms |
| P0 | Mosaik wählen | Swatch-Leiste (horizontal wischbar, `scroll-snap`); Auswahl: Beckenfläche Crossfade zur neuen Textur | **≤ 100 ms** bis zur ersten Reaktion; Crossfade 240 ms | Crossfade 150 ms |
| P0 | Wassertiefe/Licht (Tag/Abend/Unterwasserlicht) | Wasserfarbe interpoliert (Beer-Lambert, siehe Pool-Gremium), Schieberegler 1:1 ohne Verzögerung | Lerp 240 ms nach Loslassen; während Ziehen sofort | sofort |
| P1 | Kaustik/Wellen | **Standardmäßig stehend.** Knopf „Wasser bewegen“ startet einen ruhigen Loop (Shader oder CSS-Maske), Pause-Knopf sichtbar | Loop 6–8 s, sehr geringe Amplitude | Knopf ausgeblendet |
| P1 | Fugenfarbe | 4 Chips; Zoom-Lupe zeigt 25-mm-Raster 1:1 auf der Fläche | Lupe 280 ms | Opacity |
| P1 | Treppe gewählt mit Glanz-Referenz | Hinweis ocker gleitet ein: „Für Treppen empfehlen wir die SAFE-Ausführung.“ + Knopf „SAFE übernehmen“ (Fläche wechselt per Crossfade) | 280 ms / 240 ms | Opacity |
| P1 | Vergleich A/B | Trennlinie ziehbar (vor/nach), Pfeiltasten 5 % | 1:1 | 1:1 |
| P0 | Simulations-Hinweis | dauerhaft sichtbar unter der Ansicht, nicht animiert | – | – |
| P0 | Abschluss | 3.9 mit „Muster bestellen“ als Primärknopf (Muster = echter haptischer Schritt) | | |
| P1 | Laden der Texturen | Lade-Leiter (L); Texturen ≤ 150 KB je Swatch (AVIF), Vorladen der Nachbarn in der Leiste | | |

### 3.11 Prüfplan (Playwright, direkt übernehmbar)

1. **Weiche:** Für jedes Tool `page.emulateMedia({ reducedMotion: "reduce" })` **und** getrennt `document.documentElement.dataset.motion="reduced"`. Nach jeder Hauptaktion `document.getAnimations().filter(a => a.playState === "running" && a.effect.getTiming().iterations === Infinity).length === 0`.
2. **Kamera:** Küche „Draufsicht“ klicken, Screenshots bei 120 ms und 1500 ms. Normal unterscheiden sie sich, bei R sind sie gleich.
3. **INP:** Swatch, Modul-Drop und Tabwechsel ≤ 150 ms (Chrome Trace, Moto-G-Profil, Prod-Build).
4. **Auto-Rotate:** Nach 30 s ohne Interaktion steht das Modell still. Der Pause-Knopf ist per Tastatur erreichbar.
5. **Toast:** Fokus im Toast → kein Auto-Dismiss.
6. **CI-Grep:** `prefers-reduced-motion` ohne `data-motion` in derselben Datei → Fehler. `duration-[0-9]` und `ease-(out|in-out)` in `src/components/Labs/**` → Warnung.

---

## 4. Maßnahmen-Tabelle

Kosten sind interne Stunden des Code-Teams (geschätzt), ohne Fremdkosten, sofern nicht anders angegeben. Umsatzeffekte sind **Schätzungen bzw. Hypothesen** und werden über die genannten Events gemessen.

| Prio | Maßnahme | Aufwand | Kosten grob | Erwarteter Umsatzeffekt (Begründung) | Wer |
|---|---|---|---|---|---|
| **P0** | `useCalmMotion` + `haptic` + CSS-Zwillinge für `data-motion` in allen Tools (B1, 3.1) | M | 8–12 h | Indirekt: BaFG/WCAG-Risiko weg, Release-Gate „fertig“ erreichbar. Ohne das kein Livegang der Tools → Voraussetzung für jeden Planer-Umsatz | Code-Team |
| **P0** | Abschlussmoment „Übergabe an Harald“ + Vollständigkeits-Checkliste in Küche und Sofa (3.9) | M | 16–24 h + 1 h Inhaber (Text, Antwortzeit) | **Höchster Hebel.** Hypothese: mehr Planer-Abschlüsse werden zur Anfrage, und die Anfragen sind vollständiger (Maß, Fotos, Termin). Bei Küchen mit fünfstelligen Auftragswerten bringt schon ein zusätzlicher Auftrag pro Monat mehr als der Aufwand kostet [Schätzung, messen über `planner_lead_submit`] | Code-Team, Inhaber |
| **P0** | Kamerafahrten Küchenplaner (`cameraTween` aus Yacht) + Dämpfung Sofa-3D (B3) | S–M | 6–10 h | Orientierung im 3D-Raum → längere Verweildauer, weniger Abbrüche nach 3D-Klick [Hypothese, messen: `kp_3d_mode_change` → `kp_result_view`] | Code-Team |
| **P0** | Preis-Delta-Chip + `AnimatedNumber` im Küchenplaner (B5) | S | 4–6 h | Vertrauen in Preisrahmen → mehr Anfragen mit realistischem Budget, weniger Erstgespräche ohne Basis | Code-Team |
| **P0** | Dreiländer-Puls endlich machen, AR-Auto-Rotate auf 1 Runde + Pause-Knopf (B4) | S | 2–3 h | Indirekt: WCAG 2.2.2 erfüllt, Release-Gate | Code-Team |
| **P0** | Ezarri-Konfigurator nach 3.10 bauen (Interaktionsteil) | L | 40–60 h (Interaktion; Fachlogik separat) | Ezarri-Vertragshändler + Pool-/Hotelprojekte; Musterbestellung als greifbarer nächster Schritt. Größenordnung je Pool-Projekt vom Pool-Gremium übernehmen [keine eigene Zahl] | Code-Team, Partner Ezarri (Texturen) |
| P1 | Einrast-Momente (Modul-Drop, Andocken, Fugen-Linie) + Haptik vereinheitlichen (B6, B7) | M | 8–12 h | Game-Feel → Planer fühlt sich „wertig“ an; wirkt auf Markenbild und Weiterempfehlung [nicht direkt messbar, Nutzertest] | Code-Team |
| P1 | Einheitlicher `Toast` mit Pause bei Hover/Fokus, Ein-/Austritt (B8) | S | 3–4 h | WCAG 2.2.1; weniger verpasste Undo-Möglichkeiten → weniger Frust-Abbrüche | Code-Team |
| P1 | Token-Bereinigung (`duration-150/200/500/700`, `ease-out`, feste ms in Dreiländer-CSS) (B2) | S | 3–5 h | Konsistenz; kein direkter Umsatz, senkt Pflegekosten | Code-Team |
| P1 | „Vorschlag“-Stagger, Reiter-Crossfade, Licht-Interpolation Küche | S | 4–6 h | Verständnis, was das System tut → weniger „falsche“ Pläne, bessere Leads | Code-Team |
| P1 | Prüfplan 3.11 als Playwright-Suite + CI-Grep | M | 8 h | Sichert alle obigen Punkte gegen Regression | Code-Team |
| P2 | AR-Varianten-Dip, Maßlinien zeichnen, Sofa-Schrittleiste gleitet | S | 4 h | Politur | Code-Team |
| P2 | „Foto der Ansicht“-Blitz und Flug in Ergebnis | S | 3 h | Fördert Teilen/Speichern → Wiederkehr | Code-Team |
| P2 | Stil-Finder: Hover/Stagger auf Tokens, Speichern-Haken | S | 2 h | Politur | Code-Team |
| P3 | Ton (optional, ein leiser Holz-/Stoffklang beim Abschluss, standardmäßig aus) | S | 2 h + Ton-Lizenz | Gering; nur testen, wenn alles andere steht | Code-Team, Inhaber |
| P3 | Nutzertest: 5 Personen (2 Bauherren, 1 Architektin, 1 Hotelier, 1 Ü60), je Planer 10 min, Thinking aloud | M | 0–500 € (Gutscheine/Café) | Findet die Stellen, die kein Code-Review sieht | Inhaber, Code-Team |

---

## 5. Quellen

- Nielsen Norman Group: Response Time Limits – https://www.nngroup.com/articles/response-times-3-important-limits/
- W3C WCAG 2.2, 2.2.2 Pause, Stop, Hide – https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
- W3C WCAG 2.2, 2.2.1 Timing Adjustable – https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html
- W3C WCAG 2.2, 2.3.3 Animation from Interactions – https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- W3C WCAG 2.2, 2.5.7 Dragging Movements – https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- MDN: prefers-reduced-motion – https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- MDN: Vibration API (kein Safari-Support) – https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
- iOS-Web-Haptik über `switch`-Checkbox: https://azukiazusa.dev/en/blog/ios-safari-web-haptics · https://github.com/ionic-team/ionic-framework/issues/29942 · Hinweis auf Schließung in iOS 26.5 (Einzelquelle): https://rapidtoolset.com/en/tool/ios-haptics-tester
- camera-controls (smoothTime, setLookAt mit Transition): https://www.npmjs.com/package/camera-controls · Forum zur Dauersteuerung: https://discourse.threejs.org/t/solved-how-to-add-smooth-transition-to-three-js-orbital-camera/657
- Swink, *Game Feel* (2008), Zusammenfassung: https://en.wikipedia.org/wiki/Game_feel · Pichlmair & Johansen, Designing Game Feel: https://arxiv.org/abs/2011.09201
- Nunes, J. C. & Drèze, X. (2006): The Endowed Progress Effect. *Journal of Consumer Research* 32(4), 504–512 – https://doi.org/10.1086/500480
- Fredrickson, B. L. & Kahneman, D. (1993): Duration neglect in retrospective evaluations of affective episodes. *JPSP* 65(1), 45–55 – https://doi.org/10.1037/0022-3514.65.1.45
- Hanus, M. D. & Fox, J. (2015): Assessing the effects of gamification in the classroom. *Computers & Education* 80, 152–161 (via expertenrat/10)
- Projektintern: `src/app/globals.css` (Motion-Tokens), `Marktresearch/digital/02-animation-motion.md`, `expertenrat/10-…`, `expertenrat/11-…`, `wachstumsrat/pool-architektur.md`, `teamleiter/inhaber-entscheidungen.md`
