# R5-portal-labs: LazyMotion, kein eval (CSP), Lupe Lochau/Bregenz, Portal und Upload über t()

Stand 26.10.2026 · Paket R5-portal-labs (Runde 5). Ich habe nichts committet, nichts installiert und keine Mails, Uploads oder Zahlungen ausgelöst. Es lief kein zweiter Dev-Server. Prod-Builds liefen nur über `tools/qa/prod-check.mjs` in einer eigenen Kopie (`../ph-prod-r5-portal-labs`, Port 3163, Server danach beendet, Junction entfernt).

## Ergebnis

| Auftrag | Status | Nachweis |
|---|---|---|
| **(1) LazyMotion** Dreiländer + Stil-Finder | **erledigt.** Neu ist `Labs/motion.js` mit `<LabsMotion features="animation"|"max">`: `LazyMotion strict`, Features als eigener Chunk (`motionFeatures/{animation,max}.js`). Der Stil-Finder nutzt `max` (domMax wegen `drag`). Alle Elemente sind `m.*`. `useMotionReady()` liefert erst nach dem Laden `true`, vorher gilt `initial={false}`. So bleibt vor dem Nachladen nichts unsichtbar, auch wenn der Chunk ausfällt. reduced motion wie bisher. `AnimatedNumber` nutzt einen eigenen rAF-Tween statt `animate`. **Wichtig:** `motion/react` macht `import * as fm from "framer-motion"` und hält damit alles im Bundle fest. Ein erster Build mit LazyMotion über `motion/react` war deshalb **größer** (+6 bzw. +9 KB). Darum importiere ich jetzt `m` aus `motion/react-m` und den Rest benannt aus `framer-motion` (dieselbe Version 12.43.0, die `motion` mitbringt). | Bundle-Tabelle unten. e2e gegen `next start`: Feature-Chunk blockiert → Intro sichtbar (opacity 1), Quiz geht weiter, Dreiländer-Karte wechselt |
| **(2) eval im Sofaplaner** | **erledigt.** Ursache ist nicht der Sofaplaner selbst, sondern zod 4: Beim ersten Objekt-Parse prüft `allowsEval` per `new Function("")`. Der Fehler wird abgefangen, die CSP meldet aber trotzdem. `Labs/zod.js` setzt `config({ jitless: true })`, damit entfällt die Probe, das Ergebnis bleibt gleich. Gilt für alle Labs-Schemas. | Prod-Build mit dem **echten** Report-Only-Header (ohne `unsafe-eval`): **0 Verstöße** auf dreilaender, stilfinder, sofaplaner (auch `?p=garbage!!`), kuechenplaner, concierge, ar-viewer, upload-demo (`r5-portal-labs/prod-csp/`). Vorher: `r4-release/lauf3-config/csp-console.json` (eval-Verstoß auf sofaplaner) |
| **(3) Dreiländer P3-4** | **erledigt (nur Darstellung).** Rechts unten auf der Karte zeigt eine Lupe Lochau und Bregenz 5-fach vergrößert, mit See-Ausschnitt und der Beschriftung „Ausschnitt 5-fach“. Die Lagen werden aus `project()` der echten Koordinaten berechnet (`geo.js → INSET`), es gibt keine neuen Geodaten. Die Lupe ist `aria-hidden` und für Zeiger durchlässig, Bregenz bleibt über Punkt bzw. Callout wählbar und ist in der Lupe gold markiert, wenn gewählt. Der Lochau-Punkt hat zusätzlich einen Halo. | `r5-portal-labs/karte/{iphone,android,ipad,desktop}-karte*.png`, Unit (Abstand = Kartenabstand × 5, kein Ort unter der Lupe), e2e |
| **(4) Portal/Upload über t()** | **erledigt.** `src/lib/portal/i18n.js → tx(t, key, fallback, values)` liest `t(key)`, wenn `t.has(key)` zutrifft, sonst den bisherigen DE-Text. Umgestellt sind: Portal-Navigation (Tabs, mobile Leiste, Sheet, aria), Dokument-Filter (`Portal.docs.*`, von R5-i18n schon übernommen), Upload-Seite, `UploadFrame`, `not-found`, Labs-Netzfehler (`Labs.net.*` über `netTexts(t)` in Concierge und Sofaplaner). Neue Schlüssel stehen in `messages-r5-portal.json` (4 Sprachen, IT „tu“). | Unit: ohne Schlüssel → DE, mit Schlüsseln (echter next-intl-`createTranslator`) → alle 4 Sprachen. Der DE-Vorschlag ist identisch mit dem Code-Text. Portal mit Demo-Session auf 4 Geräten: `r5-portal-labs/portal/` |

### Bundle je Route (Prod, gzip KiB, `tools/ci/bundle-budget.mjs`, eigene Kopie)

| Route | Initial vorher | Initial nachher | routeneigen vorher → nachher |
|---|---:|---:|---|
| labs/dreilaender | 285,5 | **262,6** | 155,3 → 132,4 |
| labs/stilfinder | 251,2 | **230,9** | 120,9 → 100,6 |
| labs/stilfinder/ergebnis/[profil] | 213,9 | **205,7** | 83,6 → 75,4 |
| labs/kuechenplaner | 248,3 | 248,5 | unverändert (kein motion) |
| labs/sofaplaner | 245,7 | 245,9 | unverändert |
| labs/concierge | 204,5 | 204,8 | +0,3 (`next-intl`-Leser) |
| labs/ar-viewer / upload-demo | 200,7 / 207,9 | 200,7 / 208,0 | – |
| upload/[token] | 205,5 | 205,6 | – |
| portal (alle Seiten) | 198,0–210,5 | +0,3–0,4 | Leser + Schlüssel |

Der gemeinsame Anteil (rootMainFiles) liegt bei 130,3 KiB. Damit bleibt jede Route über dem Budget von 190 KiB. Das liegt am Layout und nicht an diesem Paket. Dateien: `qa-screenshots/teamleiter/r5-portal-labs/bundle-{vorher,nachher}.{json,md}`, Builds `build-vorher/`, `build-nachher/` (erster Versuch über `motion/react`, verworfen), `build-nachher2/`. **Bei R5-release habe ich keinen Lauf angefordert:** Ich habe in der eigenen Kopie gemessen, mit demselben Skript.

## Prüfung

- **e2e gegen `next start` (eigene Kopie):** `r5-portal-labs.spec.js` und `r4-portal-labs.spec.js` → **22 grün, 0 rot** (`r5-portal-labs/prod-csp/summary.md`).
- **e2e gegen Dev :3000:** dieselben zwei Specs → 21 grün, 1 übersprungen. Der Chunk-Blocktest ist nur im Prod-Build sinnvoll, im Dev-Server hängen die Features am statischen Dev-Chunk. Log: `r5-portal-labs/e2e-dev.log`. Auf Dev filtert der CSP-Test das Framework-eval von React (`react-server-dom`), weil es nur im Dev-Build vorkommt.
- **Unit:** `tests/unit/r5-portal-labs.test.mjs` 8/8. Gesamtsuite: 668/669. Rot ist nur „Footer, Kontakt, Mobilmenü … lib/site.js“, betrifft fremde Dateien. `r4-portal` „Rechtliches“ war kurz rot, weil ich die aria-Beschriftung zuerst übersetzt hatte. Sie bleibt jetzt wörtlich (globals.css hängt daran), danach grün.
- **ESLint** auf alle eigenen Pfade und Tests: 0 Fehler. Eine bekannte Warnung bleibt, ein Fehlalarm in `lib/concierge/systemPrompt.js` (verbietet „offizieller Händler“).
- **check:claims:** 0 Verstöße.
- **shoot.mjs** `r5-R5-portal-labs/selbst/` (10 URLs × 4 Geräte). Während des ersten Laufs war der geteilte Dev-Server weg (ab Desktop `ERR_CONNECTION_REFUSED`, vorher ein 500). Ich habe ihn in `selbst/nachlauf/` wiederholt. `/en/portal` und `/de/upload/ungueltig` liefern wie gewollt 404. Angesehen habe ich: Karte iPhone/Desktop mit Lupe, Stil-Finder iPhone (Collage sichtbar), Portal mit Session (Navigation), Portal-Login.
- Die Warnung „state update on a component that hasn't mounted“ trat auf dem iPhone auch auf `/de/portal/login/dev` auf, also ohne Labs-Code. Sie ist der bekannte N7-Dev-Hinweis.

## Dateien

- **Neu:** `src/components/Labs/motion.js`, `src/components/Labs/motionFeatures/{animation,max}.js`, `src/lib/portal/i18n.js`, `tests/unit/r5-portal-labs.test.mjs`, `tests/e2e/r5-portal-labs.spec.js`, `Marktresearch/digital/teamleiter/messages-r5-portal.json`, `qa-screenshots/teamleiter/r5-portal-labs/**` (Karte, Portal, Bundle, Builds, e2e, Skripte `karte.mjs`, `portal-auth.mjs`, `lazy-debug.mjs`), `qa-screenshots/teamleiter/r5-R5-portal-labs/selbst/**`
- **Geändert:** `src/components/Labs/{zod,net}.js`, `Labs/Dreilaender/{DreilaenderClient,PriceCalculator,AnimatedNumber,DreilaenderMap,geo}.js`, `dreilaender.module.css`, `Labs/Stilfinder/StilfinderQuiz.js`, `Labs/Sofaplaner/ResultPanel.js`, `Labs/Concierge/Concierge.js`, `Portal/Core/{navItems,PortalNav}.js`, `Portal/Docs/FilterSelects.js`, `src/app/[locale]/portal/dokumente/page.js`, `Upload/UploadFrame.js`, `src/app/[locale]/upload/[token]/{page,not-found}.js`, `Marktresearch/digital/features/{dreilaender-rechner,stilfinder,sofaplaner,kundenportal,handy-upload}.md`
- **Nicht angefasst:** `Labs/Dreilaender/{calc,rate,ecb.server}.js` (API für R5-schweiz stabil). Labs bleiben `noindex`, der Hinweis zum Rate-Limit-Speicher bleibt.

## Offene Punkte

1. **Übernahme `messages-r5-portal.json`** (Portal.nav, Upload.*) durch R5-i18n bzw. in Runde 6. Die Leser funktionieren mit und ohne Schlüssel.
2. **Portal/Upload bleiben DE-only.** Für EN/FR/IT fehlen noch die Schlüssel für Dashboard, Projekte, Termine, Nachrichten, Formulare und Upload-Client. Vor der Freigabe muss `nav[aria-label="Rechtliches"]` in `globals.css` auf ein data-Attribut umgestellt werden (Datei von R5-shell bzw. R5-release).
3. **Budget 190 KiB:** Alle Routen liegen darüber, weil der gemeinsame Anteil 130 KiB beträgt. Die Labs-Seiten sind nach dieser Runde 205–263 KiB groß. `tools/ci/bundle-baseline.json` (R5-release) kann die neuen, kleineren Werte übernehmen (`--write-baseline`).
4. **Import aus `framer-motion`:** Das ist eine transitive Abhängigkeit von `motion` (gleiche Version, gelockt). Wenn `motion` aktualisiert wird, muss die Version mitgehen. Alternativ kann R5-release `optimizePackageImports: ["motion"]` in `next.config.js` prüfen.
5. **CSP erzwingen** kann R5-release jetzt in Angriff nehmen. In den Labs gibt es keinen eval-Fund mehr. Andere Seiten habe ich nur im Rahmen von r4-release geprüft (dort 0 Funde). `lib/forms/schemas.js` (fremd) nutzt zod ebenfalls im Browser. Auf `/de/kontakt` gab es bisher keinen Fund, vermutlich weil dort erst beim Absenden geparst wird. Spätestens beim ersten Parse im Browser würde die zod-Probe auch dort einen eval-Verstoß melden. Empfehlung an R5-leads: in `lib/forms/schemas.js` ebenfalls `config({ jitless: true })` setzen und mit einem CSP-Lauf inklusive Absenden prüfen.
6. Unverändert offen aus R4: A3/A4 (Inhaber/Betrieb), A2-Rest (echte Geräte), N7 (Dev-Hinweis).

## Nachbesserung nach QM-Feedback (26.10.2026, Note vorher 8/10)

Bericht: `qa-screenshots/teamleiter/r5-R5-portal-labs/feedback.md`.

- **P2-2 behoben: EN/FR/IT-404 unter /portal und /upload mit deutschem Titel.** Neu `src/lib/portal/metadata.js` (`portalMetadata(meta)`, `notFoundMetadata(locale)`). Alle 15 Portal-Seiten, das Portal-Layout und `upload/[token]` exportieren `generateMetadata = portalMetadata({...})`. DE behält die bisherigen Titel. EN/FR/IT bekommen denselben übersetzten 404-Titel wie der Rest der Seite („This page does not exist here. | Platzhirsch Home Living“, FR/IT entsprechend), `noindex` und `referrer: no-referrer` (Upload-Token). Geprüft im Browser: `/en/portal`, `/en/portal/termine`, `/fr/portal/login`, `/it/portal/projekte`, `/en/upload/abc` → 404 mit Titel in der Seitensprache. `/de/portal/login` bleibt „Anmelden | Mein Platzhirsch“. Ein erster Ansatz (`notFound()` in `generateMetadata`) ergab einen **leeren** `<title>` und ist verworfen.
- **P2-1 abgesichert, Deklaration offen (R5-release):** `package.json` ist nicht meine Datei. `motion/react` als Ersatz scheidet aus (zieht den ganzen Namensraum ins Initial-JS, siehe Bundle-Messung oben). Neu ist ein Wächter in `tests/unit/r5-portal-labs.test.mjs`: Er schlägt fehl, wenn `framer-motion` nicht mehr flach installiert ist, eine zweite Instanz unter `motion/node_modules` liegt, die Versionen von `motion` und `framer-motion` auseinanderlaufen oder ein künftiger Eintrag in `package.json` nicht exakt gepinnt ist. **Auftrag an R5-release:** `"framer-motion": "12.43.0"` exakt in `dependencies` (Lockfile hat die Version schon, keine neue Abhängigkeit).
- **P2-3 offen (fremde Datei, R5-leads):** `src/lib/forms/schemas.js` hat weiterhin kein `config({ jitless: true })`. Vor dem Erzwingen der CSP dort nachziehen und mit einem Absende-Lauf prüfen.
- **Prüfung:** `shoot.mjs` → `qa-screenshots/teamleiter/r5-portal-labs/fix/` (6 URLs × 4 Geräte, Stil-Finder in `fix-stilfinder/` zusammen mit `/en/upload/abc`): 0 Überlauf, 0 fehlgeschlagene Requests. Die einzige Konsolenmeldung ist der erwartete 404-Status der 404-Seiten. Angesehen: EN-404 iPhone, Portal-Login Desktop, Stil-Finder iPhone. Unit gesamt 672/672 grün, ESLint auf die geänderten Pfade 0 Fehler.
