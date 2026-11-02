# R4-recht-consent – Bericht

Stand 26.10.2026 · Branch `feature/neuauftritt` (nichts committet, keine npm-Installation). Live-Seiten `/datenschutz` und `/impressum` sind unverändert.

## Ergebnis

| Auftrag | Stand |
|---|---|
| (1) Dienste-Register | `src/lib/legal/services.js` mit 17 Einträgen aus einer Code-Inventur (externe Hosts, iframes, Skript-Injektion, fetch-Ziele, next/font, Anbieter per Umgebungsvariable). Je Dienst: Zweck, Rechtsgrundlage, Empfänger, Drittland, Speicherdauer, Fundstellen im Code, Status (aktiv / labs / nicht eingesetzt), offene Stellen als `[anwaltlich prüfen]` bzw. `[vom Unternehmen …]`. **Aktiv:** Consent-Cookie, Hosting, Schriften (selbst gehostet), Backoffice (Frappe), Google Maps/Street View, Google-Tag-Bibliothek, GA4, Google Ads, Social-Links (nur Links). **Labs:** KI-Concierge (Anthropic), Kundenportal (+ Mail-Anbieter), Handy-Upload, Online-Planer, EZB-Kurse (serverseitig). **Nicht eingesetzt:** YouTube/Vimeo, Terminkalender, Meta Pixel. |
| (2) Eine Quelle | Das Banner baut `cookieServices` mit `buildCookieServices()` aus dem Register. Die Daten sind **bytegleich** mit der R3-Fassung (Unit-Test über sha256-Snapshot). Knopfnamen, Cookie `cookieConsent` (gleiche Schlüssel und Reihenfolge) und das Ereignis `ph-consent-change` sind unverändert, ebenso `ConsentEmbed.js`. DSE-Vorschau: neuer Anhang **„A Eingesetzte Dienste“** (`/de/preview/recht/datenschutz#dienste`), mit Übersichtstabelle und Verweisen auf 5.x und je Dienst einem Datenblock. Ein Unit-Test prüft, dass Banner und Vorschau dieselbe Schlüsselmenge haben. |
| (3) gtag-Ladelogik | Neu ist `src/components/Cookies/googleTag.js` mit `googleTagPlan` (reine Funktion) und `loadGoogleTag`. gtag.js lädt nur bei Statistik **oder** Marketing. Die GA4-config (`G-1YCM6K57YG`) kommt nur mit Statistik, die Ads-config nur mit Marketing **und** einer `NEXT_PUBLIC_GOOGLE_ADS_ID` (noch nicht vorhanden). Beim Widerruf werden `_ga*` bzw. `_gcl_*` gelöscht. **Playwright-Nachweis am Netzwerk:** Google-Requests werden abgefangen und lokal beantwortet, es gehen also keine Hits an das echte GA4. Vor der Wahl und nach „Weiter ohne Einwilligung“ gibt es 0 Requests (geprüft auf /de, /de/kontakt, /de/ueber-uns/platzhirsch). Nur Ads, gewählt im Dialog oder als gespeicherte Wahl, lädt gtag.js genau einmal, ohne GA4-config, mit `analytics_storage: denied`. Nur Statistik ergibt die GA4-config ohne AW. Nur Funktional lädt die Karte, aber kein gtag. |
| (4) Bildregister | `tools/legal/image-audit.mjs` schreibt `Marktresearch/recht/bildrechte.csv` (UTF-8 mit BOM, Trennzeichen `;`) mit **1 269 Zeilen**: public/ 170 + 3 3D-Modelle, src/lib/data 823, remotePatterns 4, Backoffice-Stichprobe 269 (13 Seiten von :3000, nur GET an den eigenen Server). Spalte `freigabe` ist überall „offen“. |
| (5) ReviewNotice | Neu ist `src/components/Legal/ReviewNotice.js` mit den Varianten `summary` („Wir zeigen Google-Bewertungen. Google prüft nicht, ob ein Kauf stattfand.“, für die spätere ReviewSummary) und `link`. **Abweichung mit Absicht:** /bewerten zeigt selbst keine Bewertungen. Dort steht deshalb `link`: „Bewertungen erscheinen öffentlich auf Google. Google prüft nicht, ob ein Kauf stattfand. Für eine Bewertung gibt es von uns keine Gegenleistung.“ Der Hinweis ist per `aria-describedby` am Google-Knopf beschrieben. Der Bewertungslink kommt jetzt aus `site.js` → `GBP.reviewUrl`. |
| (6) Anwalts-Mappe | `anwalt-vorschau.md`, neuer Abschnitt 6 (erzeugt mit `node tools/legal/services-md.mjs`, `--check` im Unit-Test). Er enthält die Ladelogik, `Cookies.intro`/`thirdCountryNotice` live gegenüber dem DPF/SCC-Vorschlag in 4 Sprachen, die Dienstliste, den Stand von C1–C16 und das Bildregister. Die Zählung ist angepasst: Datenschutz 139 (37 anwaltlich), davon 50 (15) im Anhang. |
| Texte | `Marktresearch/digital/teamleiter/messages-r4-recht.json` (`ReviewNotice`, 4 Sprachen). Bis zur Übernahme gilt ein gleichlautender Fallback per `t.has`. Die Consent-Rechtstexte sind bewusst **nicht** enthalten. |

## Prüfung

| Prüfung | Ergebnis |
|---|---|
| Unit `r4-recht` (9), `r3-recht` (10), claims*, nap, r3-shell | 105/105 grün |
| e2e `r4-recht-consent.spec.js --project=desktop` | 9/9 grün (Netzwerk ×4, axe mit offener Leiste auf /de, /de/bewerten, /en: 0 serious/critical; ReviewNotice; DSE-Anhang inkl. axe) |
| Regression e2e `r3-shell` + `r3-recht` | 16/16 grün |
| eslint eigene Dateien | 0 Fehler. 2 Warnungen der neuen warn-Regel von R4-plattform-ci in `LegalDrafts/docs/{agb,impressum}.js`: Kanzlei-Anmerkungen zum Händlerstatus bzw. der Markenhinweis „keine Vertragshändlerschaft“, also Fehlalarme |
| `check:claims` | 0 Verstöße |
| shoot.mjs (`qa-screenshots/teamleiter/r4-R4-recht-consent/selbst`, Nachlauf `selbst-nachlauf`) | 5 Seiten × 4 Geräte mit 200 und ohne Überlauf, Bilder angesehen: Banner unverändert, Hinweis auf /bewerten sauber. Im ersten Lauf gab es iPad-Timeouts und einmalige Dev-Fehler (SyntaxError Android-Vorschau, Hydration iPad /bewerten, „Router action before initialization“, „state update before mount“). Die Gegenprobe `qa-screenshots/teamleiter/r4-recht/probe.mjs` (je 2 Läufe) ergab 0 Fehler. Ursache ist der parallel belastete Dev-Server bzw. HMR anderer Pakete, nicht reproduzierbar |

## Dateien

`src/lib/legal/services.js` (neu), `src/components/Cookies/googleTag.js` (neu), `src/components/Cookies/cookiecomponent.js`, `src/components/Legal/ReviewNotice.js` (neu), `src/components/LegalDrafts/docs/datenschutz.js`, `src/lib/site.js` (`GBP`), `src/app/[locale]/bewerten/page.js`, `tools/legal/{image-audit,services-md}.mjs` (neu), `Marktresearch/recht/{anwalt-vorschau.md,bildrechte.csv}`, `Marktresearch/digital/teamleiter/messages-r4-recht.json`, `tests/unit/r4-recht.test.mjs` (neu), `tests/unit/r3-recht.test.mjs` (Zählung 89 → 139), `tests/e2e/r4-recht-consent.spec.js` (neu), `qa-screenshots/teamleiter/r4-recht/**`, `qa-screenshots/teamleiter/r4-R4-recht-consent/**`.

## Offene Punkte

1. **Kanzlei:** C1/C2-Texte freigeben (Mappe 6.2). Ebenso C3 (Länderliste), C4 (`googleTagManager`-Schalter steuert nichts, ein Container ist nicht im Einsatz) und C7 (Ads-Cookieliste). Hinzu kommt der Widerspruch Concierge/Upload/Planer zwischen Einwilligung und lit b.
2. **Inhaber:** Ads-Kennung `NEXT_PUBLIC_GOOGLE_ADS_ID` anlegen. Bis dahin lädt eine reine Ads-Einwilligung gtag.js ohne Wirkung. Außerdem: GA4-Aufbewahrung (14 Monate), Hoster/AV-Verträge, Place-ID für `GBP.reviewUrl` und die Freigaben im Bildregister.
3. **R4-produkt/R4-release:** 634 Bild-URLs von `brandvanegmond.com` liegen in `src/lib/data`, der Host fehlt aber in `remotePatterns` (Auslieferung prüfen). `images.unsplash.com` wird nirgends genutzt und kann aus `remotePatterns` raus.
4. C6 (`cookieConsent` sichtbar im Banner), C11 (Banner-Version) und C12 (Consent-Protokoll) ändern Banner bzw. Cookie-Format. Sie sind bewusst nicht in dieser Runde.

## Nachbesserung nach QA (Note 8/10, `qa-screenshots/teamleiter/r4-R4-recht-consent/feedback.md`)

Stand 26.10.2026, nichts committet.

| QA-Punkt | Stand |
|---|---|
| P2-1 Nur Ads lädt gtag.js zwecklos | **Behoben.** `googleTag.js`: `load = configs.length > 0`, `src` nur aus einer echten config. „Nur Marketing“ ohne `NEXT_PUBLIC_GOOGLE_ADS_ID` sendet nichts an Google (nur das lokale Consent-Update im dataLayer). Unit-Test: „nur Ads ohne ID → kein Laden“, „keine IDs → kein Laden“. e2e (Dialog und gespeicherte Wahl): 0 Google-Requests, keine config. Register-Texte (GA4/Ads/gtag) und Mappe 6.1 an die Logik angepasst. |
| P2-2 Schalter „Google Tag Manager“ (C4) | **Verhalten und DSE sofort angeglichen, Entfernen aus dem Banner bleibt Kanzlei-Entscheidung (C4).** „Funktional“ hängt jetzt nur an Google Maps (`cookiecomponent.js` `withCategories`, `ConsentEmbed.js`), nicht mehr an Maps **und** GTM. Im Register hat die Bibliothek die echte Kategorie „Statistik oder Marketing (technische Ladebibliothek)“. Die DSE-Tabelle zeigt „ja, unter Funktional (Schalter ohne Wirkung, lädt nur mit Statistik oder Marketing; C4)“. Banner-Daten und Cookie-Format sind unverändert (sha256-Snapshot grün, `r3-shell` grün). |
| P2-3 Live-Texte C1/C2 und Privacy Shield auf `/de/datenschutz` | **Offen, außerhalb dieses Pakets.** Ersatztexte liegen in Mappe 6.2. **Go-live-Blocker** bis zur Kanzlei-Freigabe, muss als Pflichtpunkt in den Release-Plan (R4-release). |
| Zusatzfund | **Behoben.** Die Spalte „Abschnitt“ der Dienste-Tabelle zeigte `[5.2](#google-analytics)` als Rohtext und zählte das als **offene Stelle** (16 Fehlzählungen). `LegalDrafts/inline.js` erkennt jetzt Anker-Links `(#id)`. Die Zählung ist korrigiert: Datenschutz **123 (37)**, davon 34 (15) im Anhang. Angepasst in `r3-recht.test.mjs` und in der Mappe. |

**Prüfung:** Unit r4-recht, r3-recht, claims*, nap 96/96. e2e `r4-recht-consent` + `r3-recht` (desktop, seriell, ohne Retries) 16/16. `r3-shell` 16/16, davon 2 nur parallel flaky (Dev-Last). eslint 0. `shoot.mjs` → `qa-screenshots/teamleiter/r4-R4-recht-consent/fix/`: 4 Seiten × 4 Geräte alle 200, 0 Konsolenfehler. Bilder angesehen: Banner unverändert, Tabelle mit klickbaren Abschnittsnummern (`fix/anhang-tabelle-desktop.png`, Skript `qa-screenshots/teamleiter/r4-recht/fix-tabelle.mjs`).

**Offen (P3, unverändert):** Länderliste Maps ohne SCC (C3), doppelte web_vitals (fremdes Paket), Codepfade nur in der Vorschau, Kartenansicht für die Tabelle mobil, ReviewNotice-Satz zur Freigabe, remotePatterns (R4-produkt/R4-release).
