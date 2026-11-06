# Übergabe Team P0-9 – Plattform & Abhängigkeiten (Fundament v2)

Stand 04.11.2026 · MASTER § 5.2 P0-9 · Schreibbereich `backoffice/{next.config.js,playwright.config.js,eslint.config.mjs}`, `backoffice/tools/qa/budget.mjs`. Keine neuen Pakete, kein `npm install`, kein Build, kein Commit.

## Gebaut

| Datei | Inhalt |
|---|---|
| `backoffice/playwright.config.js` | Neue Projekte `reducedMotion` (Chrome 1440×900, `reducedMotion: "reduce"`, Q-H6), `ipad-quer` (1180×820) und `ipad-hoch` (820×1180), beide mit den Gerätemerkmalen des bestehenden `ipad`-Projekts (WebKit, Touch, isMobile, DPR 2). `desktop` und `ipad` unverändert, laufen weiter mit allen Specs. Die neuen Projekte filtern per `grep`: `reducedMotion` → `@bewegung`/`@screenshot` (oder das Wort im Datei-/Testnamen), `ipad-quer`/`ipad-hoch` → `@kiosk`/`@tablet` (oder „kiosk“). `PW_ALLE=1` hebt die Filter auf. Die Muster enthalten bewusst keine Teile der Projektnamen, weil Playwright den Projektnamen mit vergleicht. |
| `backoffice/eslint.config.mjs` | Inline-Plugin `platzhirsch` (kein Paket): `keine-hex-farbe` (Fehler in `src/components/**`, `src/app/**`; erkennt `#abc`, `#abcd`, `#aabbcc`, `#aabbccdd` in Strings, Template-Strings und Tailwind-Klassen `text-[#…]`; erlaubt nur `value`/`defaultValue` eines `<input type="color">`; ignoriert `&#123;`) und `kein-datum-input` (Fehler in `src/**`: `<input type="date|datetime-local|month|week">`, auch als `{"date"}`). Meldungen nennen den Ersatz (`--color-bo-*` bzw. `Formular/Datumsfeld`). `qa-screenshots/**` neu in den Ignores. |
| `backoffice/tools/qa/budget.mjs` | Budget-Prüfung Q-L2 über den Netzwerk-Transfer: Login als Demo-Admin, je Route ein Vorlauf (Turbopack kompiliert), dann frischer Chromium-Kontext (leerer Cache), Zählung jeder Antwort bis zur Netzwerkruhe (gzip wie übertragen, unkomprimiert → gzip gerechnet), getrennt nach JS/CSS/Dokument/RSC/Schrift/Bild und im Dev nach Herkunft (Dev-Werkzeug, Framework, App, Bibliothek). Budgets JS 180 kB, Kassa (`/kassa…`) 250 kB, CSS 60 kB (gzip, kB = 1000 Byte). Bericht `budget.json` + `budget.md` (Standard `backoffice/qa-screenshots/budget-<datum>/`), Top-5-JS-Ressourcen je Route, Zeiten TTFB/DCL/load/LCP als Hinweis zu Q-L1, `--vergleich <alt/budget.json>` mit Δ je Route und Markierung ab `--schwelle-kb` (Standard 10), `--streng`. Exportiert `messeSeite`, `bewerte`, `budgetFuer`, `artVon`, `herkunftVon`, `summen`, `BUDGETS` für Specs; liest Routen aus `tools/qa/routen/index.mjs` (nach P0-1) oder `tools/qa/routen.mjs`. |
| `backoffice/src/components/Backoffice/README.md` | Abschnitt „Plattform, Lint-Regeln und Budgets (Team P0-9)“ angehängt. |

Keine neue Komponente, daher keine Demo unter `/einstellungen?tab=system&baustein=…` und kein Eintrag in `lib/backoffice/demo-register.js`.

## Tests

- Unit: `node --test "tests/unit/**/*.test.mjs"` → 46/46 grün (keine eigenen Unit-Dateien, Schreibbereich). Reine Funktionen von `budget.mjs` zusätzlich mit 17 Zusicherungen aus dem Scratchpad geprüft (Budget je Route inkl. `/kassa-verwaltung` = 180 kB, Art/Herkunft-Erkennung, Urteil Dev/Build).
- ESLint gesamt: 0 Fehler. Warnungen: 7 × `keine-hex-farbe` im Altbestand (s. u.), 24 × `import/no-anonymous-default-export` in den neuen P0-1-Registerdateien `bereiche/*.js` und `suche/*.js` (nicht mein Bereich). Gegenprobe mit Testdatei: 3 Hex-Fehler, 2 Datumsfeld-Fehler, `#abschnitt`, `&#123;` und `<input type="color" value={v || "#8a7a66"}>` ohne Befund.
- E2E `backoffice.spec.js`: desktop 9/9 grün; `ipad-quer` + `ipad-hoch` je 1/1 (Kiosk-Test, über „Kiosk“ im Titel erfasst); `reducedMotion` mit `PW_ALLE=1` 2/2 (Dashboard inkl. axe, Abmelden). Ohne `PW_ALLE` findet `reducedMotion` heute keinen Test – erwartet, bis Q2/Bereiche `@bewegung`-Specs liefern.
- Budget-Probelauf (Dev, Mock, 04.11.2026; 4 Routen): JS ohne Dev-Werkzeuge 557,8–585,9 kB → „im Build prüfen“; Anteil App + Bibliotheken `/login` 27,8 · `/` 37,3 · `/d/PH%20Anfrage` 64,8 · `/kassa` 33,8 kB; CSS 14,6–15,1 kB → eingehalten (sicher, da Dev nicht minifiziert); Dev-Werkzeuge rund 259 kB je Seite abgezogen. Der größte Block im Dev sind Next-Client (197 kB) und React-DOM-Development (182 kB) – im Build entfallen die Development-Varianten; der verbindliche Q-L2-Wert ist nur gegen `next start` messbar.
- Screenshots: keine UI-Änderung, kein Screenshot-Lauf nötig.

## Offene Punkte

1. **`next.config.js` nicht geändert.** Jede Änderung (auch ein Kommentar) beendet den laufenden Dev-Server: `node_modules/next/dist/server/lib/start-server.js` beobachtet die Config-Dateien und ruft `process.exit(RESTART_EXIT_CODE)`. Das widerspricht der Vorgabe „Dev-Server nicht neu starten“ und hätte parallele E2E-Läufe anderer Agenten abgebrochen. Vorschlag zum Einspielen in einem Fenster ohne laufende Agenten (Inhaber-Frage unten):
   ```js
   // Container: BO_OUTPUT=standalone next build → .next/standalone/server.js (siehe Containerfile-Skizze).
   ...(process.env.BO_OUTPUT === "standalone" ? { output: "standalone" } : {}),
   ```
   Ohne Variable ändert sich nichts (`next dev`/`next start` wie heute). `turbopack.root` zeigt auf das Repo, deshalb liegt `server.js` im Standalone-Ordner unter `backoffice/` (Pfad beim ersten Build prüfen).
2. **Containerfile-Skizze** (nicht als Datei angelegt, kein Schreibrecht; Abhängigkeiten liegen im Eltern-`node_modules` des Repos):
   ```Dockerfile
   # Build-Stufe: ganzes Repo, weil das Backoffice die Pakete aus dem Eltern-node_modules auflöst
   FROM node:24-bookworm-slim AS build
   WORKDIR /repo
   COPY package.json package-lock.json ./
   RUN npm ci
   COPY . .
   RUN cd backoffice && BO_OUTPUT=standalone npx next build
   # Laufzeit-Stufe: nur Standalone-Ausgabe + statische Dateien
   FROM node:24-bookworm-slim
   ENV NODE_ENV=production PORT=3100 HOSTNAME=0.0.0.0
   WORKDIR /app
   COPY --from=build /repo/backoffice/.next/standalone ./
   COPY --from=build /repo/backoffice/.next/static ./backoffice/.next/static
   USER node
   EXPOSE 3100
   CMD ["node", "backoffice/server.js"]
   ```
   Node 24 wie lokal (v24.22.1). Geheimnisse (Frappe-Schlüssel, Sitzungsgeheimnis) nur zur Laufzeit als Umgebungsvariablen, nie im Image. `public/` gibt es im Backoffice derzeit nicht; falls angelegt, mit kopieren.
3. **Altbestand Hex-Farben → Team P0-2:** `Charts/index.js` Zeile 22 (`SEQUENZ`, 5 Werte) und `StatusBadge.js` Zeile 14 (`dark:text-[#8fbdb8]`, `dark:bg-[#8fbdb8]`) als Token in `globals.css` führen; danach den Ausnahme-Block in `eslint.config.mjs` löschen (Kommentar steht dort).
4. **Tags für Specs:** Bereichsagenten/Q2 sollen Kiosk-Specs mit `{ tag: "@kiosk" }`, Bewegungs- und Screenshot-Specs mit `@bewegung`/`@screenshot` taggen (README-Abschnitt beschreibt es). `backoffice.spec.js` blieb unverändert (nicht mein Bereich).
5. **Budget-Abnahme Q-L2** braucht einen Build-Lauf (`next build` + `next start` auf eigenem Port, dann `node tools/qa/budget.mjs --basis http://localhost:<port>`). Agenten dürfen nicht bauen → Inhaber-Frage unten.
6. `tools/qa/README.md` gehört nicht zu meinem Bereich; die Doku zu `budget.mjs` steht im Dateikopf und im Komponenten-README. Q3 kann sie dorthin übernehmen.
7. `package.json` (laut MASTER ebenfalls P0-9) blieb unverändert; ein Skript `"qa:budget": "node tools/qa/budget.mjs"` wäre sinnvoll, war aber nicht im zugeteilten Schreibbereich.

## Abweichungen vom Konzept

- MASTER nennt „Dockerfile-Skizze“ und Änderungen an `next.config.js`: nur als Vorschlag im Protokoll (Grund Punkt 1). Freigabe L0 offen.
- `reducedMotion`, `ipad-quer`, `ipad-hoch` laufen nur über Tags statt mit allen Specs (Laufzeit; `PW_ALLE=1` für Vollauf). Freigabe L0 offen.

## Fähigkeiten-Stand

Nicht betroffen (keine Server Actions, keine Backend-Aufrufe).

## Neue Fragen

- Inhaber: 2 Zeilen in `90-inhaber-fragen.md` (Wartungsfenster `next.config.js` + Container, Build-Lauf für Budget-Abnahme).
- Steuerberater: keine.

## Screenshot-/Messordner

- `backoffice/qa-screenshots/p09-budget-probe/` und `p09-budget-probe2/` (Budget-Probeläufe, `budget.md`/`budget.json`; der zweite mit `--vergleich`).

## Nachtrag 04.11.2026, zweiter Lauf (nach Lounge-Freigabe, Inhaber Nr. 51/53)

Der erste Lauf (oben) wurde weiterverwendet und an Lounge angepasst.

### Gebaut

| Datei | Änderung |
|---|---|
| `backoffice/playwright.config.js` | Neues Projekt `kundendisplay`: Chrome 1920×1080, DPR 1, ohne Touch (Lounge §10, zweiter Bildschirm der Kassa). Es filtert auf `@kundendisplay` bzw. „kassa-display“ oder „kunden-display“ im Datei- oder Testnamen. `ipad-hoch` nimmt dieselben Tests zusätzlich auf (Display hochkant 820×1180, wie die Lounge-Screenshots). Filter als Konstanten `KIOSK`/`KUNDENDISPLAY`. Das Muster enthält „kundendisplay“ nur mit `@`, denn Playwright vergleicht den Projektnamen mit, sonst liefe jeder Test im Projekt. |
| `backoffice/eslint.config.mjs` | Neue Regel `platzhirsch/keine-versalien` als **Warnung** in `src/components/**` und `src/app/**`: Tailwind-Klasse `uppercase` (auch `hover:uppercase`) und `textTransform: "uppercase"`. Begründung: Lounge, „nie wieder VERSALIEN-Etiketten“. `normal-case` und Wörter wie „nicht-uppercase-…“ lösen sie nicht aus. Die Warn-Ausnahme für `Charts/index.js`/`StatusBadge.js` ist entfernt, weil P0-2 die Farben umgestellt hat und beide Dateien keine Hex-Werte mehr enthalten. Neu ausgenommen von `keine-hex-farbe` sind die Musterdaten `src/components/Entwurf/**/data.js` (Stoff-/Materialfarben als Daten, analog `src/lib`). Lounge-Farben stehen in `lounge.css`, CSS prüft ESLint nicht. |
| `backoffice/tools/qa/budget.mjs` | Keine Änderung nötig. Das Kundendisplay (`/kassa/display`) fällt unter das Kassa-Budget von 250 kB. |
| `backoffice/next.config.js` | Weiter unverändert. Grund wie Punkt 1 oben: Eine Änderung würde den Dev-Server :3100 beenden. Inhaber-Frage 23 ist noch offen. |
| `backoffice/src/components/Backoffice/README.md` | Abschnitt P0-9 aktualisiert (Projekte, Regeln). |

Keine neue Komponente, daher keine Demo.

### Tests (zweiter Lauf)

- **ESLint:** Meine Dateien haben 0 Befunde. Im ganzen Projekt gibt es **3 Fehler, die nicht von mir stammen**: `react-hooks/static-components` in `src/components/Entwurf/Lounge/Kundendisplay.jsx:28` (Komponente wird während des Renderns erzeugt). Das muss der Besitzer des Lounge-Entwurfs bzw. das Kundendisplay-Team beheben. Dazu kommen Warnungen: 11 × `keine-versalien` (Altbestand: `Kennzahl.js`, `Kanban.js`, `Shell/Befehlspalette.js`, `Shell/Glocke.js`, `Shell/Testband.js`, `Kuerzel/KuerzelDialog.js`, `Charts/index.js`, Demos, `auth/microsoft/demo/page.js`) und 8 × `no-img-element`. Gegenprobe mit einer Testdatei im Scratchpad: Hex 2 Fehler, Datum 1 Fehler, Versalien 3 Warnungen, Farbwähler und `normal-case` ohne Befund.
- **Playwright `--list`:** desktop 21, ipad 21, reducedMotion 1, ipad-quer 2, ipad-hoch 2, kundendisplay 0 Tests (es gibt noch keine Display-Specs). Mit `PW_ALLE=1` sind es 21. Die Filter wurden mit simulierten Titeln geprüft: `@kundendisplay` und „Kassa display …“ landen in kundendisplay und ipad-hoch, `@kiosk` landet nicht in kundendisplay.
- **E2E** `backoffice.spec.js` über desktop, ipad-quer, ipad-hoch und kundendisplay: **11/11 grün**.
- **Unit** `node --test "tests/unit/**/*.test.mjs"`: **100/104**. Die 4 Fehler stammen aus fremder, gleichzeitiger Arbeit: `backoffice-register.test.mjs` (erwartet 12 Bereiche, vorhanden sind 14 mit `ablage` und `posteingang`; Palette/Nummernmuster) und `backoffice-session-rechte.test.mjs` (GF sieht 14 statt 12 Bereiche). Keine dieser Dateien liest meine Konfigurationen. Die Tests muss das Team der Bereiche Ablage/Posteingang anpassen.
- **Budget** (Dev, Mock): `/login` JS 555,6 kB („im Build prüfen“), App 34,5 kB, CSS 21,2 kB. `/kassa` JS 569,0 kB, App 39,1 kB, CSS 21,2 kB (eingehalten). Die CSS ist gegenüber dem ersten Lauf (14,6–15,1 kB) gewachsen, wahrscheinlich durch die Lounge-Stile, liegt aber deutlich unter 60 kB. Bericht: `backoffice/qa-screenshots/p09-budget-lounge/`.

### Offen (zusätzlich)

8. Specs für das Kundendisplay mit `{ tag: "@kundendisplay" }` taggen (Team Kassa/Display), Kassa- und Packtisch-Specs mit `@kiosk`.
9. `keine-versalien` auf „error“ stellen, sobald der Altbestand auf Lounge umgestellt ist (11 Stellen, siehe oben).
10. Die 4 roten Unit-Tests (12 → 14 Bereiche) und der Hook-Fehler in `Entwurf/Lounge/Kundendisplay.jsx` gehören zu fremden Bereichen.
11. Ein iPhone-Projekt (Lounge §12) ist noch nicht angelegt, weil es nicht beauftragt war. Es lässt sich bei Bedarf mit `devices["iPhone 15"]` und dem Tag `@iphone` ergänzen.

Neue Inhaber-/Steuerberater-Fragen: keine. Die Fragen 23 und 24 aus dem ersten Lauf stehen weiter offen.
