# R4-portal-labs: FocusShell weg, N6, Portal-Auflagen, Labs-Feinschliff und Bundle

Stand 26.10.2026 · Paket R4-portal-labs (Runde 4). Keine Commits, keine Installationen, keine echten Mails, Uploads oder Zahlungen. Kein zweiter Dev-Server. Prod-Builds liefen nur über `tools/qa/prod-check.mjs` in einer eigenen Kopie (`../ph-prod-r4-portal-labs`, `--steps=copy,build`, kein Server gestartet).

## Ergebnis

| Auftrag | Status | Nachweis |
|---|---|---|
| **(1) FocusShell unter /upload** (R3-shell P2-2) | **erledigt.** `Upload/FocusShell.js` ist gelöscht. Die Shell liefert `header[data-shell="bare"]` (Wortmarke, „Zurück zur Website“). `UploadFrame` hat kein Cover, kein `inert`, kein zweites Logo und keine eigene Scroll-Fläche mehr. Die eigene Rechts-Nav (mit Telefon) bleibt, die Shell-Fußzeile weicht per `:has()`. `UploadClient` scrollt ohne `[data-upload-scroll]` per `scrollIntoView`. | e2e auf 4 Geräten (siehe unten). Bilder: `qa-screenshots/handy-upload/r4/de-upload-token--*.png` |
| Fokus und Escape auf 4 Geräten | **belegt.** Kein `[inert]`, kein Cover, `html` ohne `overflow:hidden`, kein Querscrollen. „Zurück zur Website“ ist fokussierbar: In Chromium (Android, Desktop) ist es der Tab-Halt nach dem Skip-Link, in WebKit (iPhone, iPad) per `focus()`, weil Safari Links ohne „Tab zu Links“ nicht in die Tab-Folge nimmt. Escape lässt den Fokus stehen und navigiert nicht. Weiteres Tabben erreicht das Rechtliche (Chromium) bzw. das Formular (WebKit). Keine Falle. | `tests/e2e/r4-portal-labs.spec.js` (4 Geräte + 404) |
| **(2) N6 Filter-Chips** | **erledigt.** Es gibt nur noch eine Chip-Reihe (Dokumentart). Zahlung und Projekt sind zwei flache Auswahlfelder in einer Zeile (`Portal/Docs/FilterSelects.js`), mobil in 2 Spalten. Mit JS wirkt die Auswahl sofort (`router.replace`, ohne Sprung), ohne JS greift ein GET-Formular mit „Anwenden“ in `<noscript>`. URL und Serverprüfung sind unverändert. | `qa-screenshots/kundenportal/r4/shots/de-portal-dokumente--*.png`, e2e N6, Unit |
| **(3) Portal-Auflagen** | **A5 erledigt:** Die mobile Portal-Leiste sitzt auf `bottom: var(--ph-consent-h)`, also über der offenen Cookie-Leiste (`r4/shots/de-portal--iphone.png`, e2e A5). **P3-5** (Betrag „siehe PDF“ in Produktion) war bereits umgesetzt. **A3, A4, A2-Rest, N7:** siehe offene Punkte. | `kundenportal.md` Abschnitt 7 |
| **(4a) Studio-HDR im AR-Viewer** | **erledigt.** Die Studio-Umgebung ist selbst errechnet (`ArViewer/studioHdr.js`, keine Drittquelle): Hohlkehle, große weiche Lichtwanne, Aufheller, Decke, Gegenlicht. Ausgeliefert als RGBE (131 KB) unter `/api/labs/ar-viewer/studio-v1.hdr`, beim Build statisch erzeugt, `immutable`, `noindex`. `ModelStage` lädt die Datei vor (6 s Zeitlimit). Offline oder bei Fehler bleibt `neutral`, und es entsteht kein Modell-Fehler. Die Glanzlichter am Sessel sind jetzt breit und ruhig. | `r4-portal-labs/hdr/*-studio.png` vs. `*-blocked.png`, `hdr-probe*.json` |
| **(4b) Geometrie Lindau/Dornbirn** | **erledigt.** Dornbirn ist mobil ein Callout rechts unter Bregenz, ohne Überlappung (Unit). Lindau behält den vollen Trefferkreis. Hit-Test per `elementFromPoint`: beide ≥ 44 px in beiden Achsen (vorher ≈ 40 px). Desktop unverändert. | `r4-portal-labs/karte/*.png`, e2e, `labs-dreilaender-geo.test.mjs` |
| **Fehlerfälle je Labs-Feature** | **geprüft und nachgebessert.** Neu `Labs/net.js` (Zeitlimit und deutsche Netzfehler): Concierge 30 s bis zur ersten Antwort, Sofaplaner-Teilen 15 s, Küchenplaner Plan 15 s und Anfrage 25 s. Vorher blieb „Einen Moment …“ bzw. „Wird gesendet …“ stehen, und offline erschien „Failed to fetch“. Weitere Fälle (Tabelle unten): Dreiländer ungültige Eingaben und Kurs offline, AR-Modell offline, ungültige Freigabe-Codes, ungültige POSTs (400), fremder Origin (403). | `r4-portal-labs/errors/`, `errors-iphone/`, `fehlerfaelle-curl.log`, Unit `labs-r4` |
| **Bundle pro Labs-Route** | **gemessen, zod verkleinert.** Die schweren Teile (3D über model-viewer und three.js bzw. R3F) wurden schon per `next/dynamic` erst nach Klick geladen, die Karte ist reines SVG. Größter Posten war zod: `import { z } from "zod"` zog in Turbopack alle ~50 Sprachpakete mit (90 KB gzip). Neu `Labs/zod.js` mit benannten Re-Exporten, gleiche API: **31 KB**. | `r4-portal-labs/bundle.mjs`, `bundle-basis.json`, `bundle-nachher.json` |

### Bundle (gzip, Prod-Build, KB)

| Route | Seite vorher | Seite nachher | Initial nachher (inkl. Layout 177) |
|---|---|---|---|
| labs/dreilaender | 150,4 | **90,7** | 267,5 |
| labs/kuechenplaner | 113,7 | **53,3** | 230,1 |
| labs/sofaplaner | 111,3 | **50,8** | 227,6 |
| labs/stilfinder | 56,3 | 56,4 | 233,2 |
| labs/concierge | 8,9 | 9,7 | 186,5 |
| labs/ar-viewer | 7,1 | 5,8 | 182,6 |
| labs/upload-demo | 13,1 | 13,1 | 189,9 |
| upload/[token] | 10,9 | 10,6 | 187,5 |
| portal/dokumente | 5,1 | 5,9 | 182,7 |

Rest über dem Budget von R4-plattform-ci (190 KB): Dreiländer und Stilfinder tragen je 42 KB `motion` (framer-motion). Ein Umbau auf `LazyMotion` ist möglich, braucht beim Stilfinder wegen `drag` aber `domMax`, und vor dem Nachladen der Features stünden Elemente mit `initial` unsichtbar da. Das habe ich bewusst nicht in dieser Runde gemacht, Kandidat für Runde 5. Der Layout-Anteil (177 KB) gehört nicht zu diesem Paket.

### Fehlerfälle

| Feature | Fall | Ergebnis |
|---|---|---|
| Dreiländer | Eingabe −5 / abc / 99 999 999 999 | deutsche Meldung (`role=alert`), keine Laufzeitfehler (Desktop, iPhone) |
| Dreiländer | Wechselkurs-API offline | Seite 200, H1 sichtbar, kein `pageerror` (e2e) |
| AR-Viewer | `.glb` offline | „Das Modell konnte nicht geladen werden.“ – Desktop sofort; **iPhone/iPad (WebKit) zeigten vorher keinen Hinweis** (model-viewer feuert dort kein `error`, nur „TypeError: Load failed“). Neu: Wächter in `ModelStage` (offline-Ereignis bzw. 30 s ohne `progress` → Fehlerpfad); jetzt auf beiden OK |
| AR-Viewer | HDR offline/Zeitüberschreitung | Fallback `neutral`, kein Fehlerhinweis (`hdr-probe`) |
| Sofaplaner | Teilen offline / hängt | „Keine Internetverbindung …“ / nach 15 s „… zu lange gedauert …“ |
| Sofaplaner | `?p=garbage!!` / ungültiger POST | 200 mit Standardplan / 400 |
| Küchenplaner | `?k=%%%garbage`, `?k=eyJ2IjoxfQ` / ungültiger POST | 200 / 400; Anfrage-Zeitlimit 25 s (Unit für `net.js`) |
| Concierge | kaputtes JSON / falsches Schema / fremder Origin | 400 / 400 / 403; Zeitlimit 30 s; ohne echten Schlüssel (Mock) |
| Stil-Finder | `/ergebnis/unbekannt` | 404 |

## Prüfung

- **shoot.mjs** (`qa-screenshots/teamleiter/r4-R4-portal-labs/selbst/`): 9 URLs × 4 Geräte. Alle liefern 200, nur `/de/upload` liefert wie gewollt 404 mit schlanker Hülle. Kein Querscrollen. Während des Laufs war der geteilte Dev-Server kurz weg (Connection refused und danach 500 auf **allen** Seiten, auch `/de`). Die betroffenen Seiten habe ich nach der Erholung neu aufgenommen (`selbst/nachlauf-desktop/`, 16 × 200, 0 Konsolenfehler). Angesehen habe ich: Upload-Seite iPhone und Desktop, Upload-404, Upload-Demo, Dokumente Desktop und iPhone, Portal iPhone mit Cookie-Leiste, Karte mobil, HDR-Vergleich.
- **Portal mit Session:** `qa-screenshots/kundenportal/r4/{mint,shoot-auth}.mjs`, Ergebnis in `shots/`.
- **e2e:** `tests/e2e/r4-portal-labs.spec.js` → **11/11** (`r4-portal-labs/e2e-r4.log`). Regression (upload, r3-portal-upload, r3-shell, labs-sofaplaner/-kuechenplaner/-concierge/-arviewer): **44 passed, 1 flaky** (Upload-Kernfluss, im Retry grün, Dev-Server unter Last) – `e2e-regression.log`; labs-dreilaender 6/6, labs-arviewer nach Wächter 2/2.
- **Unit:** `labs-r4` (7), `r4-portal` (4) sowie alle `labs-*`, `upload`, `r3-portal*` und `format`. Alle grün, nur `r3-portal-flat` meldete `rounded-none` als Radius-Klasse. Behoben: Die Klasse ist entfernt, `appearance-none` bleibt, der Radius 0 kommt aus dem Preflight. Das e2e prüft dazu den berechneten Radius `0px`.
- **ESLint** auf alle eigenen Pfade und Tests: 0 Fehler, 1 Warnung. Die Warnung ist ein Fehlalarm der neuen Händler-Regel in `lib/concierge/systemPrompt.js:25`: Die Zeile *verbietet* dem Concierge „offizieller Händler“, sie behauptet es nicht. Unverändert gelassen, weil der Prompt byte-identisch bleiben soll (Cache).
- **check:claims:** 0 Verstöße.

## Dateien

- **Gelöscht:** `src/components/Upload/FocusShell.js`
- **Geändert:**
  - `src/components/Upload/{UploadFrame,UploadClient}.js` (UploadClient nur Kommentar)
  - `src/app/[locale]/upload/[token]/page.js` (Kommentar)
  - `src/app/[locale]/portal/dokumente/page.js`
  - `src/components/Portal/Core/PortalNav.js`
  - `src/components/Labs/ArViewer/ModelStage.js`
  - `src/components/Labs/Dreilaender/{geo,DreilaenderMap,calc,pricing,rate}.js`
  - `src/components/Labs/Kuechenplaner/{planState,ResultPanel}.js`
  - `src/components/Labs/Sofaplaner/{model,ResultPanel}.js`
  - `src/components/Labs/Concierge/Concierge.js`
  - `tests/unit/labs-dreilaender-geo.test.mjs`
  - `Marktresearch/digital/features/{kundenportal,handy-upload,ar-viewer,dreilaender-rechner,kuechenplaner,sofaplaner,concierge}.md`
- **Neu:**
  - `src/components/Portal/Docs/FilterSelects.js`
  - `src/components/Labs/{zod,net}.js`
  - `src/components/Labs/ArViewer/studioHdr.js`
  - `src/app/api/labs/ar-viewer/studio-v1.hdr/route.js`
  - `tests/unit/{labs-r4,r4-portal}.test.mjs`
  - `tests/e2e/r4-portal-labs.spec.js`
  - `Marktresearch/digital/teamleiter/messages-r4-portal.json` (4 Sprachen, Portal-Filter und Netzfehler)
  - `qa-screenshots/{kundenportal/r4,handy-upload/r4,teamleiter/r4-portal-labs,teamleiter/r4-R4-portal-labs}/**`

Die Build-Berichte von `prod-check.mjs` landen automatisch unter `teamleiter/r4-release/<label>`. Ich habe sie nach `teamleiter/r4-portal-labs/build-{basis,nachher}/` verschoben. Am Ordner `r4-release` selbst habe ich nichts geändert.

## Offene Punkte (brauchen Inhaber oder Betrieb)

1. **A3:** Abschnitt „Kundenportal“ in `/de/datenschutz` (Live-Rechtstext, Anwalt) und die Fristen in `lib/portal/privacy.js` bestätigen, danach `OWNER_CONFIRMED = true`.
2. **A4:** `PORTAL_SESSION_SECRET` (≥ 32 Zeichen), `PORTAL_BASE_URL`, `PORTAL_MAIL_FROM`, `PORTAL_MAIL_PROVIDER` mit Schlüssel, SPF/DKIM. Danach eine echte Login-Mail testen.
3. **A2-Rest und AR-Auflagen 2/3:** Sprachaufnahme, Quick Look und Scene Viewer auf einem echten iPhone und Android-Gerät.
4. **N7:** Die React-Warnungen „Router action dispatched before initialization“ und „state update … not mounted“ treten im Dev-Modus unter Last auf, auch beim Concierge (iPhone). Sie stammen nicht aus Portal-Code, weiter beobachten.
5. **Bundle:** `motion` (42 KB) bei Dreiländer und Stil-Finder → `LazyMotion` in Runde 5. Dreiländer liegt danach weiter über 190 KB initial, solange das Layout 177 KB wiegt.
6. **Inhaber Dreiländer:** `ossActive`, Weitergabe der DE-USt, echte Liefer- und Verzollungspreise (unverändert gekennzeichnet).
7. Die Übernahme von `messages-r4-portal.json` folgt in Runde 5. Portal und Upload sind heute nur auf Deutsch.

## Nachbesserung nach QM-Feedback (Note 9/10, keine P1/P2)

Das QM-Feedback (`qa-screenshots/teamleiter/r4-R4-portal-labs/feedback.md`) enthält keine P1 und keine P2. Vier P3 habe ich trotzdem behoben:

- **P3-2 AR-Viewer:** Wenn nur das Laden scheitert, lautet die Überschrift jetzt „3D konnte gerade nicht geladen werden.“. Der Satz „… auf diesem Gerät nicht verfügbar“ erscheint nur noch, wenn WebGL fehlt (`ArViewerApp.js`).
- **P3-3 Referenz:** Die Demo-Zeile wird als ein einziger String gerendert. Im HTML stand nie ein Leerzeichen, der Abstand kam von den React-Textknoten beim Auslesen.
- **P3-5 Portal-Titel:** `title: { absolute: "Übersicht | Mein Platzhirsch" }`. Das Template des Layouts greift nicht im eigenen Segment. Ich habe es per curl geprüft.
- **P3-6 Küchenplaner:** Unter der Ansicht steht jetzt eine Legende der verwendeten Kürzel, zum Beispiel „**US** Unterschrank · **SP** Spüle …“, mit `<abbr title>`. Die Kürzel brechen mobil um. Der Mobil-Grid hat dazu `grid-cols-[minmax(0,1fr)]` bekommen, damit Inhalte die Spalte nicht mehr verbreitern können (`Viewer.js`, `KuechenplanerApp.js`).

**Prüfung:**
- Screenshots: `qa-screenshots/teamleiter/r4-portal-labs/fix/` (Portal, Dokumente, Küchenplaner, AR-Viewer, Upload-Demo) sowie `fix/k4` (Küchenplaner mit Legende). Auf 4 Geräten alles Status 200, kein seitliches Scrollen.
- Ein einzelner Hydration-Hinweis trat direkt nach dem Neukompilieren auf. Ich konnte ihn in 4 gezielten Läufen nicht reproduzieren, er hängt am Dev-HMR.
- e2e `r4-portal-labs.spec.js`: 11/11 grün. ESLint ohne Befund.

**Weiter offen (P3):**
- P3-1: Cookie-Leiste und Portal-Leiste auf dem iPhone. Das betrifft die Consent-Komponente und liegt nicht in meinen Dateien.
- P3-4: Abstand zwischen Lochau und Bregenz auf der Dreiländer-Karte.
- P3-7: Dev-Server unter Last (N7).
