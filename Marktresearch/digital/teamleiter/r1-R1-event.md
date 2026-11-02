# R1-event: Adventsabend 26.11. und /bewerten

Stand: 26.10.2026 · Branch `feature/neuauftritt` · Status: **fertig gebaut, wartet auf Inhaber-Daten**

## Ergebnis

### 1. /de/adventsabend (neu gestaltet)
- `Marktresearch/digital/redesign/fundament.md` und `src/components/ui/*` gibt es noch nicht. Deshalb ist die Seite mit Tailwind und den Rollen-Tokens aus `globals.css` gebaut (surface, surface-band, text, text-accent, action, line, error, success). Keine Radien, keine Schatten, kein Gold auf Hell, kein Walnut (der Footer ist die eine dunkle Fläche).
- Aufbau (mobil zuerst): typografischer Auftakt (Overline, H1 „Adventsabend im Showroom“, Leitsatz „Nehmen Sie Platz.“ in Bodoni kursiv, 2 Sätze, **ein** Primärknopf „Platz reservieren“), danach eine Horizontlinie (`ph-horizon`, steht bei reduced motion still), dann „Der Abend“ mit Termin-Karte und die Anmeldung auf einem Stone-Band.
- Kein Foto im Auftakt: Es gibt noch kein eigenes Showroom- oder Café-Bild im Bildregister. `bannerImage.jpg` ist ein Herstellerbild (Minotti Outdoor), siehe Bibel §7. Das OG-Bild ist unverändert geblieben (siehe offene Punkte).
- Das Programm zeigt keine Platzhalter mehr. Solange `PROGRAMM` leer ist, steht dort ein ehrlicher Satz: „Uhrzeit und Ablauf stellen wir gerade zusammen …“. Die Uhrzeit lautet „Uhrzeit folgt“.
- Formular (`AdventsabendForm.js`):
  - Labels über dem Feld, Felder 52 px hoch, Knopf 48/52 px, Schrift 16 px.
  - Prüfung beim Verlassen des Feldes. Fehler stehen am Feld (`aria-invalid` und `aria-describedby` → `aa-<feld>-fehler`), dazu eine Fehlerzusammenfassung mit Sprunglinks.
  - Nach dem Absenden liegt der Fokus auf der Statusmeldung (`role=alert` bei Fehlern, `role=status` bei Erfolg, `tabIndex=-1`). Statusmeldungen haben Icon und Text.
  - Die Pflicht-Checkbox ist entfernt. Unter dem Knopf steht ein Datenschutzhinweis mit Link auf `/de/datenschutz`.
  - Honeypot `website`: im Wrapper mit `aria-hidden`, `tabIndex -1`, `autocomplete off`. Dazu `_t` (Zeitstempel beim Mount, ms) nach dem Formular-Vertrag aus R1-formulare.
  - Das übrige Payload ist unverändert: `{name, company:"", email_address, telefon, ihre_nachricht:"[Anmeldung Adventsabend 26.11.] N Person(en)…"}`. `trackLead("adventsabend")` feuert nur bei Erfolg.
- Die Eckdaten stehen zentral in `src/app/[locale]/adventsabend/event.js`. Die bestehende Logik bleibt: Ohne `startTime` ist die Seite `noindex, follow` und gibt kein Event-Schema aus.

### 2. „In den Kalender“ (.ics)
- Route `src/app/[locale]/adventsabend/kalender.ics/route.js`. Sie antwortet **404**, solange `EVENT.startTime` null ist. Der Knopf (Termin-Karte und Erfolgsmeldung) ist dann ausgeblendet. Mit Uhrzeit liefert sie `text/calendar` als Anhang mit `X-Robots-Tag: noindex`.
- Inhalt: UTC (`DTSTART:20261126T170000Z` bei 18:00 MEZ), CRLF, Escaping, Zeilenfaltung bei 75 Oktetten. Ohne Endzeit gibt es **kein DTEND**, es wird also nichts erfunden.
- Der Proxy-Matcher schließt Pfade mit Punkt aus, deshalb greift next-intl hier nicht ein. `/en/...` liefert 404.

### 3. Event-Bausteine (`src/components/Event/`)
- `EventCard.js`: Termin-Karte als Server-Komponente mit Datum, Uhrzeit, optional Plätzen, Ort (Route), Kontakt und optional „In den Kalender“.
- `ics.js`: reine Helfer `buildIcs`, `zonedTimeToUtc` (Europe/Vienna, Sommer- und Winterzeit), `escapeIcsText`, `foldIcsLine`, `formatIcsUtc`.
- `ics.test.mjs`: `node --test src/components/Event/ics.test.mjs` ergibt **7/7 grün**. Geprüft werden Winter- und Sommerzeit, ungültige Eingaben, CRLF, UTC, DTEND nur mit Endzeit, Escaping und Faltung ohne UTF-8-Bruch. Der Test liegt in diesem Paket, weil `tests/unit/**` anderen Paketen gehört. Die Integration kann ihn nach `tests/unit/` verschieben (Import relativ, ohne `@/`).

### 4. /de/bewerten (geprüft, nicht geändert)
| Prüfpunkt | Ergebnis |
|---|---|
| noindex | ok: `<meta name="robots" content="noindex, nofollow">` |
| Event `review_click` | ok: `ReviewLink.js` mit `trackEvent("review_click", {platform:"google", page_path:"/de/bewerten"})` |
| Anreize / Review-Gating | ok: keine. Alle sehen denselben Google-Link und daneben gleichwertig „Lieber direkt an uns?“. Keine Vorabfrage zur Zufriedenheit, keine Gutscheine, Gewinnspiele oder Sterne |
| Review-URL zentral | **nein**: `GOOGLE_REVIEW_URL` steht lokal in `bewerten/page.js` (Maps-Suche statt direktem Schreib-Link). `site.js` habe ich laut Auftrag nicht geändert, siehe INT-Anfrage |

## Prüfung
- `npx eslint src/app/[locale]/adventsabend src/app/[locale]/bewerten src/components/Event`: 0 Befunde.
- `node tools/qa/shoot.mjs …/qa-screenshots/teamleiter/r1-R1-event/selbst …/de/adventsabend …/de/bewerten`: alle 8 Aufrufe mit HTTP 200 und ohne horizontalen Überlauf. Einmal trat die React-Warnung „state update on a component that hasn't mounted“ auf, und zwar auf /de/bewerten (Android) bzw. im Lauf mit Uhrzeit auf iPhone und iPad. Sie ist sporadisch, tritt auch auf der unveränderten /bewerten-Seite auf und kommt damit aus dem globalen Layout, nicht aus diesem Paket.
- Zusätzlicher Lauf **mit** testweise gesetzter Uhrzeit 18:00 (danach wieder auf `null` gesetzt): `selbst-mit-uhrzeit/`. Dabei: Event-Schema vorhanden, `index, follow`, Kalender-Knopf sichtbar, .ics 200 und korrekt.
- Formulartest mit Playwright auf Pixel 7. `/api/kontakt` wurde per `page.route` abgefangen, **es wurde nichts echt gesendet**.
  - Leeres Absenden: Der Fokus liegt auf der Zusammenfassung (`role=alert`), `aria-invalid` und `aria-describedby` zeigen auf den Fehlertext.
  - Gemockter 500er: Der Fokus liegt auf der Fehlermeldung.
  - Gemockter Erfolg: Der Fokus liegt auf der Bestätigung (`role=status`), `generate_lead {form:"adventsabend"}` feuert genau einmal, das Payload enthält `website:""` und `_t`.
  - Feldhöhen 52 px, Knopf 48 px, kein horizontaler Scroll.
  - Screenshots: `selbst/form-fehler--android.png` und `selbst/form-erfolg--android.png`.

## Offene Punkte
1. **Inhaber, Frist 30.10.2026: Uhrzeit, Programm und Kapazität** für den 26.11. liefern. Eintragen in `src/app/[locale]/adventsabend/event.js` (`startTime`, optional `endTime`, `capacity`, `PROGRAMM`). Erst danach gilt: indexiert, Event-Schema, .ics aktiv. Nichts schätzen.
2. **Inhaber:** Ist der Abend kostenlos? Das Event-Schema setzt `isAccessibleForFree: true` (bestehende Logik). Falls nicht, auf false setzen.
3. **Inhaber/INT:** Google Place-ID für den direkten Schreib-Link `https://search.google.com/local/writereview?placeid=<ID>` ermitteln. **INT-Anfrage:** `GOOGLE_REVIEW_URL` nach `src/lib/site.js` verschieben (das ist die zentrale Quelle; auch für QR-Karte und Mails), dann `bewerten/page.js` darauf umstellen.
4. **Bild:** Ein eigenes Foto von Café oder Showroom im Advent (4:5 mobil, 21:9 Desktop, im Bildregister) würde Auftakt und OG-Bild tragen. Bis dahin bleibt das OG-Bild `bannerImage.jpg`, ein Herstellerbild ohne dokumentierte Freigabe. Die Integration bzw. der Inhaber soll das prüfen.
5. **Dev-Overlay:** Beim gemockten 500er zeigt Next „1 Issue“. Das ist das bestehende `console.error` im Fehlerpfad, also gewollt und kein Defekt.

## Dateien
- `src/app/[locale]/adventsabend/page.js` (neu gestaltet)
- `src/app/[locale]/adventsabend/AdventsabendForm.js` (neu gestaltet, A11y, Honeypot, `_t`)
- `src/app/[locale]/adventsabend/event.js` (neu, Eckdaten)
- `src/app/[locale]/adventsabend/kalender.ics/route.js` (neu)
- `src/components/Event/EventCard.js`, `src/components/Event/ics.js`, `src/components/Event/ics.test.mjs` (neu)
- `src/app/[locale]/bewerten/*`: unverändert, nur geprüft

---

## Fix-Runde nach QM-Feedback (26.10.2026, Note vorher 8/10)

| P2 | Status | Umsetzung |
|---|---|---|
| 1 Datenschutz/Pflichtinfos | **teilweise behoben** | Neuer Block „Gut zu wissen“ im Anmeldebereich der Seite (mobil nach dem Formular, auf dem Desktop unter dem Einleitungstext). Er nennt Fotos (nur Übersichtsbilder, Widerspruch beim Team, Porträts nur mit Einwilligung, Kinder nicht erkennbar), die Hausordnung im Showroom (empfindliche Stücke, Getränke, Kinder) und den Datenschutz („löschen spätestens drei Monate danach“, Link auf /datenschutz). Die Löschfrist steht in `event.js` (`LOESCHFRIST_MONATE`/`_LABEL`) und folgt dem Entwurf recht/06 §2.2 Nr. 8. **Offen (R1-legal):** Der Abschnitt „Veranstaltungen“ in der Datenschutzerklärung liegt außerhalb dieses Pakets. Löschfrist und Foto-Text müssen anwaltlich bestätigt werden. |
| 2 Herstellerbild | **behoben** | `bannerImage.jpg` ist aus `og:image` und dem Event-Schema entfernt. Neu sind `adventsabend/opengraph-image.js` (typografisches PNG 1200×630, Tokens paper/ink/brass, keine fremden Bildrechte) und `twitter-image.js`. Das Event-Schema nimmt `image` nur noch aus `EVENT.image`, also aus einem eigenen Foto des Bildregisters, sonst bleibt es ohne Bild. `isAccessibleForFree` liest jetzt `EVENT.free`. |
| 3 Auffindbarkeit | **vorbereitet, offen (INT)** | Checkliste in `event.js` als Pflichtschritte vor dem Setzen von `startTime`: Datenschutzabschnitt, Anwalt, Bild, Teaser bzw. interner Link, Sitemap-Eintrag (nur DE), `free`. Startseite, Footer und `sitemapEntries.js` gehören nicht zu diesem Paket. **INT-Anfrage:** Teaser bzw. Footer-Link „Service → Adventsabend“ und Sitemap-Eintrag erst zusammen mit `startTime` setzen, damit keine noindex-URL in der Sitemap steht. |
| 4 /bewerten Design | **behoben** | Umgestellt auf die Rollen-Tokens (`bg-surface`, `text-text`, `text-text-accent`, `bg-action`, `text-ui`, `line-strong`). Raster links ausgerichtet wie /adventsabend, Knöpfe in Satzschreibung (48/52 px), ein Primärknopf, zwei `secondary` mit 1-px-Rahmen, Horizontlinie. Oberer Abstand `pt-28 sm:pt-36 lg:pt-52`: Auf dem Desktop steht die Overline rund 215 px unter dem Header statt 11 px. E-Mail- und Telefon-Link haben eine Trefferfläche von 44 px. Der Hinweis zum Google-Link hängt per `aria-describedby` am Link (`ReviewLink` reicht dafür Props durch). |
| 5 Review-Link | **verbessert, offen (Inhaber/INT)** | Statt der Maps-Suche öffnet der Link jetzt direkt das Profil über die cid (`maps.google.com/?cid=10377983053407187294`, dieselbe cid wie `hasMap` in layout.js). Der Hinweistext passt sich automatisch an, sobald ein `writereview?placeid=`-Link eingetragen ist. **Offen:** Die Place-ID muss der Inhaber ermitteln. Danach soll INT `GOOGLE_REVIEW_URL` nach `src/lib/site.js` verschieben, weil die Datei nicht zu diesem Paket gehört. |

P3: Das Feld „Personen“ hat jetzt den Hinweis „Mehr als 10? Bitte rufen Sie uns an.“ (per `aria-describedby`). Die übrigen P3-Punkte sind unverändert: die Sticky-Leiste ist global, Bewirtungstext und Veranstalter klärt der Inhaber.

### Prüfung Fix
- `npx eslint` auf die drei Paketordner: 0 Befunde.
- curl: `/de/adventsabend` 200 mit `noindex, follow`. `og:image` und `twitter:image` zeigen auf das generierte Bild (`og:image:alt` gesetzt). `/de/adventsabend/opengraph-image` 200 `image/png`, `/en/...` 404, `kalender.ics` weiterhin 404. `/de/bewerten` 200.
- `node tools/qa/shoot.mjs qa-screenshots/teamleiter/r1-R1-event/fix …`: Der gemeinsame Dev-Server lieferte während der Läufe zeitweise 500er. Ursache waren Build-Fehler in fremden Dateien (`Labs/Kuechenplaner/planState.js`, `MarkenItems/markenitems.js` mit fehlendem `./brandData`, `produkte/[category]/[product]/page.js`), nicht dieses Paket. Der saubere Lauf `fix/run1/` brachte alle 8 Aufrufe mit 200, auf Android, iPad und Desktop ohne Überlauf und ohne Konsolenfehler. Den iPhone-Überlauf aus diesem Lauf habe ich mit Playwright (iPhone 13) nachgeprüft: `scrollWidth` 390 = `clientWidth`, kein überstehendes Element. Er war vorübergehend, im Screenshot ragt der globale Header-Knopf „Termin“ über den Rand (Team 1).
- Screenshots angesehen: `fix/run1/*`, `fix/de-*--desktop*.png`, `fix/og-adventsabend.png`.

### Dateien dieser Runde
- geändert: `adventsabend/page.js`, `adventsabend/event.js`, `adventsabend/AdventsabendForm.js`, `bewerten/page.js`, `bewerten/ReviewLink.js`
- neu: `adventsabend/opengraph-image.js`, `adventsabend/twitter-image.js`
