# R2-labs-planer – Küchenplaner und Sofaplaner (Runde 2)

Stand: 26.10.2026 · Branch `feature/neuauftritt` (nicht committet) · keine npm-Installationen, keine echten Sendungen

## Ergebnis

Alle beauftragten Restpunkte sind umgesetzt, geprüft und in den Feature-Dokus festgehalten.

**Küchenplaner**
- R4: Die Drehgrenze hängt jetzt von der Grundform ab und bleibt innerhalb der Seitenwände.
- R5: Die Kamera bei „Ich stehe drin“ steht 35 cm weiter zurück und hat ein Sichtfeld von 66°.
- R6: Das Label bleibt beim Fehlerfokus sichtbar, mobil und auf dem Desktop.
- R7: Hochschränke haben Fugenbild und Griffleiste, das Backofenglas ist heller.
- Fehlertexte der Anfrage erscheinen auf Deutsch und werden aus dem `code` gebildet.

**Sofaplaner**
- Restpunkt 1: Keine Überlappung mehr nach Raum kleiner/größer.
- Restpunkt 2: TTL und Aufräumen der Teilen-Pläne.
- Restpunkt 3: Statuszeile korrigiert.
- Restpunkt 4: Palette mit Verlauf und Pfeil.
- Restpunkt 5: 3D-Ausschnitt enger.
- Der Kopfabstand ist an den neuen Sticky-Header angepasst (vorher 212 px).

**Beide Planer**
- Fehlerfälle abgefangen: kein WebGL, Kontextverlust, Chunk-Abbruch, langsames Netz, reduced motion.
- three/R3F werden nur lazy geladen. Die Chunk-Größen stehen in der Doku.

## Prüfung

| Prüfung | Ergebnis |
|---|---|
| `shoot.mjs` → `qa-screenshots/teamleiter/r2-R2-labs-planer/selbst/` | 8× 200, 0 Konsolenfehler, kein Überlauf (iPhone, Android, iPad, Desktop) |
| eslint (alle eigenen Pfade, Tests) | sauber |
| Unit: `node --test tests/unit/labs-kuechenplaner.test.mjs tests/unit/labs-sofaplaner.test.mjs` und `planState.test.mjs` | 42/42 grün |
| e2e: `npx playwright test tests/e2e/labs-*.spec.js --project=desktop` | 11/11 grün |
| Interaktion `qa-screenshots/kuechenplaner/r2/interact.mjs` auf iPhone (WebKit), Android und Desktop | Label sichtbar, API-Fehler deutsch, Raum klein → „3 Konflikte“, groß → „Passt“, keine Konsolenfehler, Screenshots angesehen |
| `netz.mjs` (Android) | slow: Hinweise sichtbar. fail: „3D erneut laden/öffnen“, Grundriss bzw. 2D bleibt |
| Sendungen | Alle POSTs per `route()` abgefangen, nichts gesendet oder gespeichert |

## React-Warnung „hasn't mounted yet“

Die Ursache liegt nicht in den Planer-Dateien.

- **Stack:** Next-Dev-Client `hmrRefresh → dispatchAppRouterAction → dispatchOptimisticSetState` (`qa-screenshots/kuechenplaner/r2/console-stack.mjs`).
- **Auslöser:** HMR-Refresh durch Dateiänderungen anderer Teams.
- **Häufigkeit:** 1/18, tritt auch auf `/de/ueber-uns/team` auf.
- **Betroffen:** nur der Dev-Server.

## Dateien

- `src/components/Labs/Kuechenplaner/{geometry.js, Scene3D.js, Viewer.js, ResultPanel.js, Kuechenplaner.module.css}`, neu: `requestErrors.js`, `SceneBoundary.js`
- `src/app/[locale]/labs/kuechenplaner/page.js`
- `src/components/Labs/Sofaplaner/{model.js, Planner.js, Preview3D.js, sofaplaner.module.css, server/store.js}`, neu: `server/retention.js`
- `src/app/[locale]/labs/sofaplaner/teilen/route.js`
- Tests: `tests/unit/labs-{kuechenplaner,sofaplaner}.test.mjs`, `tests/e2e/labs-{kuechenplaner,sofaplaner}.spec.js`
- Dokus: `Marktresearch/digital/features/{kuechenplaner,sofaplaner}.md` (Abschnitt „Runde 2“)
- Belege: `qa-screenshots/{kuechenplaner,sofaplaner}/r2/**`

## Offene Punkte

- **Inhaber:** echte Preistabelle (A2), Breiten 27,5/41,25 (R1), Datenschutz-Abschnitt (A1).
- **Integrator:** Chunk-Größen im Production-Build nachtragen und die React-Warnung dort gegenprüfen.
- **Betrieb:** Rate-Limiter beider Planer über Redis. Env-Variablen `LABS_IP_HEADER` bzw. `KUECHENPLANER_IP_HEADER` und `SOFAPLANER_TTL_DAYS` setzen.
- **Website-Team:** A3 (Header-Überlauf 375 px), R2 (Schalter für die MobileCtaBar).
- **Gerätetest:** iOS-Touch-Ziehen nur auf echtem Gerät prüfbar.
- **Bekannte Abweichung:** `Sofaplaner` importiert `SceneBoundary` aus dem Küchenplaner-Ordner (beide gehören diesem Paket).

## Fix nach QM-Feedback (Note 8/10, P2-1 bis P2-3)

| Punkt | Status | Umsetzung |
|---|---|---|
| P2-1 Platzhalter-Preise | **behoben** | `release.js → pricesPublic()`: Ohne `placeholder: false` erscheint kein Betrag und kein Klammertext. Das gilt für die Preisleiste, die Positionstabelle, den Anfragetext und die Sofa-Karte. Angezeigt wird „Richtpreis im Gespräch“. Der Live-Link bleibt trotzdem aus, bis die Tabelle A2 freigegeben ist. Es gibt keine Verlinkung aus der Navigation (geprüft per grep) |
| P2-2 Datenschutz | **im Code behoben, Text offen (A1)** | Der Produktions-Build sendet und speichert erst mit `NEXT_PUBLIC_LABS_PLANER_SENDEN=1`. Server: `liveBlocker()` antwortet sonst mit 503. Die Seitentexte verweisen nicht mehr auf den fehlenden Abschnitt, die Einwilligung nennt die 180 Tage. Der Entwurf für Abschnitt 5.x „Online-Planer“ steht in `features/kuechenplaner.md` und muss zum Anwalt bzw. ins Rechtspaket |
| P2-3 Redis | **im Code behoben, Env offen (Betrieb)** | `server/rateLimit.js`: Redis per REST ohne Paket, IP gehasht, Ersatz im Arbeitsspeicher. Beide Routen nutzen ihn. Ohne Redis bleibt Speichern/Teilen in Produktion gesperrt. Die Env-Liste steht in der Feature-Doku |

**Prüfung:** Unit 52/52 (neu: `tests/unit/labs-kuechenplaner-release.test.mjs`), e2e 13/13 (`--project=desktop`, neu: „keine Beträge“ je Planer). eslint ist sauber. `shoot.mjs` → `qa-screenshots/kuechenplaner/r2/fix/` ergibt 12× 200, 0 Konsolenfehler, kein Überlauf. Die Screenshots (Desktop Küche und Sofa, iPhone) habe ich angesehen.

**Weiterhin offen:** Inhaber A2 (Preistabelle) und A1 (Abschnitt in der Datenschutzerklärung), Betrieb (Redis- und IP-Env, danach zuletzt `NEXT_PUBLIC_LABS_PLANER_SENDEN=1`). Die P3-Punkte sind unverändert, außer dass das Sofa jetzt auch den gemeinsamen Limiter aus dem Küchenplaner-Ordner importiert. `Labs/shared/` liegt außerhalb der Paketdateien.
