# R5-release: /cmx-Cache, remotePatterns/CSP, Pakete, QR-Karten, Prod-Läufe, Gesamtabnahme, Go-live-Liste

Stand: 26.10.2026, 16:55 MEZ, Branch `feature/neuauftritt`. Nichts committet, gepusht oder deployt. Ausgelöst wurde nichts: kein Formular, keine Mail, keine Zahlung, kein Druck. Den Dev-Server :3000 habe ich nicht neu gestartet, er liefert 200.

Alle Zahlen stehen in `release-check.md`, Abschnitt **Runde 5** (R5.1–R5.6). Die Läufe liegen in `qa-screenshots/teamleiter/r5-release/`.

## Ergebnis in Kürze

| Schritt | Ergebnis | Beleg |
|---|---|---|
| 1 Basislauf | `r5-start`: 463 grün / 0 rot, 7 690 vorgerenderte Routen, Claims 0 | `r5-start/summary.md` |
| 2 Config | `/cmx` aus allen Cache-Regeln genommen. Prod: 200 → `immutable`, 404 (webp/mp4) → **kein** Cache-Control. Unsplash aus `remotePatterns` und CSP entfernt (grep 0). Die BvE-, next125- und Treca-Bilder laufen nur über `/cmx`/`/_next/image` oder die neutrale Fläche, im HTML stehen 0 Marken-Host-URLs. Kein neuer Host. CSP bleibt Report-Only, die Portal-Header sind unverändert | `r5-ende/probe.json`, `r5-zwischen/cmx-curl.txt` |
| 3 Pakete | react-icons, react-share, react-slick und slick-carousel entfernt (grep: 0 Importe). Erst isoliert geprüft (`r5-isoliert-pakete`, 139/0), dann im Repo. `qrcode@1.5.4` exakt. `npm ls` ist sauber, :3000 liefert 200. Next 16.4.x erst ab 30.10. | `npm-ls-repo.txt` |
| 4 QR | `scripts/make-review-qr.mjs` erzeugt PNG und SVG plus A6-Karten. Selbsttest mit eigenem Decoder: alle 4 Dateien ergeben `https://platzhirsch.studio/de/bewerten` | `Marktresearch/marketing/qr/manifest.json` |
| 5 Teilläufe | `r5-zwischen` und `r5-ende-nachtest` (Commerce mit Schalter) | – |
| 6 Schlusslauf | `r5-ende` nach Abschluss aller R5-Pakete: **522 grün, 4 rot (nur Specs), 2 flaky**. Claims auf 910 URLs: 0. NAP nur Hausnummer 11. logscan 0 × static-to-dynamic. TBT mobil 184–441 ms, LCP 1,46–2,07 s, CLS 0 | `r5-ende/summary.md` |
| 7 Abnahme | 91 URLs × 4 Geräte = 364 Shots, alle Status wie erwartet, 0 Überlauf. Bilder als Kontaktbögen angesehen | `r5-ende/abnahme/` |
| 8 Go-live | Liste nach Code, Inhaber, Anwalt und Betrieb, mit allen Pflichtpunkten | `release-check.md` §R5.6 |

## Bewusste Abweichung

`qrcode` bleibt in `dependencies` und wird nicht mit `--save-dev` installiert. Grund: Portal-Pass, AR-Viewer und Upload-Handoff nutzen das Paket zur Laufzeit. Als dev-Paket fehlte es nach `npm ci --omit=dev` in Produktion.

## Rote Tests im Schlusslauf (fremde Specs, kein Produktfehler)

- `r5-commerce.spec.js:46/60/90`: In Produktion liefert die Vorschau ohne `COMMERCE_PREVIEW=1` absichtlich 404, mit dem Schalter sind die Tests grün. **An R5-commerce:** ohne Schalter `test.skip`.
- `r5-schweiz.spec.js:32`: `getByText('nicht eingerechnet')` trifft zwei Elemente. **An R5-schweiz:** `{ exact: true }`.

## Mängel aus der Gesamtabnahme nach Besitzer

- **R5-leads-perf (P2):** TBT mobil auf /de/kontakt 316 ms, Ziel ≤ 200 ms.
- **R5-produkt (P2):** TBT mobil auf /de/produkte/lamps 441 ms, auf der Produktseite 246 ms.
- **Inhaber/Landing (P2):** Unter dem Hero von Küchen, Yacht, Outdoor und Schweiz-Hub steht ein leeres Bildband ohne Foto.
- **R5-shell-seo (P3):** TBT /de 218 ms. Die globale 404 zeigt die Systemschrift.
- **R5-portal-labs (P3):** Das Demo-Banner sagt im Prod-Build „lokale Entwicklungsumgebung“. Mobil überlagern sich Tab-Leiste und Cookie-Leiste. Der Küchenplaner hat 2 flaky Tests.

## Selbstprüfung

- `shoot.mjs` → `qa-screenshots/teamleiter/r5-R5-release/selbst/`: /de, /de/kontakt, /de/produkte/lamps und /de/bewerten liefern auf iPhone, Android, iPad und Desktop 200, ohne Konsolenfehler, ohne fehlgeschlagene Requests und ohne Überlauf. `/cmx/files/does-not-exist-qa.webp` und `/wp-login.php` liefern 404. Die einzige Konsolenmeldung dort ist die 404 selbst. Dev-curl: 404 von /cmx ohne Cache-Control, 200 mit `immutable`. Bilder angesehen: Die globale 404 hat Links zu EN, FR und IT.
- `npx eslint` auf `next.config.js`, `playwright.config.js`, `eslint.config.mjs`, `scripts/`, `tools/{qa,checks,ci}/` und `tests/e2e/*` ohne `r5-*`: 0 Fehler, 0 Warnungen.
- `node scripts/make-review-qr.mjs --check`: grün.

## Geänderte Dateien

`next.config.js`, `package.json`, `package-lock.json`, `tools/qa/prod-check.mjs`, `tools/qa/abnahme-urls.txt`, `tools/ci/bundle-baseline.json` (gesenkt, plus 9 neue R5-Routen), `scripts/make-review-qr.mjs`, `scripts/lib/qr-decode.mjs`, `Marktresearch/marketing/qr/*`, `Marktresearch/digital/teamleiter/release-check.md`. Rückbau: `qa-screenshots/teamleiter/r5-release/rueckbau/`.

## Offene Punkte

- Ab 30.10.: Next 16.4.2 einspielen (isoliert, Repo, `check:prod`, Neustart).
- Die 2 Spec-Fixes oben, danach `check:prod` mit 0 rot.
- Go-live-Blocker: DSE-Live-Texte mit Privacy Shield (Kanzlei), Bildfreigaben, Secrets von Portal und Upload, nginx-Vorlage.

## Nachbesserung nach QM-Feedback (26.10.2026, 16:10 MEZ)

Grundlage ist `qa-screenshots/teamleiter/r5-R5-release/feedback.md` (8/10). Geändert wurden nur Dateien des Pakets: `playwright.config.js`, `tools/qa/prod-check.mjs`, `tests/README.md` und `release-check.md` (§R5.6, neu §R5.7).

| QM-Punkt | Stand |
|---|---|
| P2-1 `check:prod` rot | **Teilweise behoben.** Commerce: `check:prod` setzt `COMMERCE_PREVIEW_EXPECT=off`, und die Config lässt den Vorschau-Block aus. Die neue Probe prüft `/de/preview/commerce` → 404, mit `--commerce-preview` laufen die Vorschau-Tests mit. Die Specs selbst sind unverändert. Neuer Lauf `r5-fix`: **519 grün, 2 rot, 2 flaky**, die 3 Commerce-Tests sind nicht mehr rot. **Offen 1:** `r5-schweiz.spec.js:39` braucht `{ exact: true }`, auf Dev ebenso rot. Die Datei gehört R5-schweiz, Frist 28.10. **Offen 2:** `labs-kuechenplaner.spec.js:42` war diesmal auch in der Wiederholung rot (Cookie-Leiste, Timeout). Besitzer ist R5-portal-labs |
| P2-2 TBT ohne Frist | **Frist und Besitzer stehen in §R5.6:** 03.11.2026, R5-produkt (lamps 460 ms, Produkt 296 ms), R5-leads-perf (kontakt 366 ms), R5-shell-seo (/de 214 ms). Mit Konfiguration und Werkzeug des Release-Pakets ist TBT nicht zu senken, das Budget ist weiter rot |
| P2-3 leeres Bildband | **Offen.** Auf Dev noch sichtbar (`r5-R5-release/fix/de-kuechen-vorarlberg--desktop.png`). In §R5.6 stehen Besitzer (Landing-Team mit `LandingHero`, Foto vom Inhaber) und Frist 03.11. |
| P2-4 Go-live-Blocker | **Offen.** Sie liegen außerhalb des Codes. Jeder Blocker hat jetzt Frist und Besitzer: DSE/Privacy Shield (Kanzlei), Bildfreigaben (Inhaber, 03.11.), Secrets (Betrieb, vor dem ersten Deploy), Place-ID vor dem Druck, Next 16.4.2 ab 30.10. |
| P3 /cmx-404 `no-store` | Übergeben: Der Header gehört in die Route (`notFound()`), die nicht zum Paket gehört. Über `next.config.js` funktioniert das nachweislich nicht (§R5.2). Bis dahin schützt nginx |
| P3 QR-Schriften | Druckvorgabe in §R5.6: PDF mit eingebetteten Hausschriften (OFL) oder Text in Pfaden. Text in Pfaden geht nicht ohne neues Paket (opentype.js). In dieser Runde ist keine Installation freigegeben |
| P3 globale 404, `nofollow`, Cookie-Leiste, Portal-Banner | Nicht im Paket, Besitzer stehen in §R5.5 |

**Prüfung:**
- `shoot.mjs` → `qa-screenshots/teamleiter/r5-R5-release/fix/`: 7 URLs × 4 Geräte. /de, /de/kontakt, /de/produkte/lamps, /de/bewerten und /de/kuechen-vorarlberg liefern 200. `/cmx/…`-404 und `/wp-login.php` liefern 404. Kein Überlauf, keine fehlgeschlagenen Requests. Die Screenshots habe ich angesehen.
- `check:prod` `r5-fix`: Probe 34/0, logscan 0, 7 706 Routen.
- eslint auf `playwright.config.js` und `tools/qa/prod-check.mjs`: 0 Fehler, 0 Warnungen.
