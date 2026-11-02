# R4-leads: Herkunft, lead_ref, Lead-Events, Web Vitals, add_to_wishlist, Termin hinter Schalter

Stand 26.10.2026 · Runde 4 · Branch `feature/neuauftritt` (nicht committet) · Grundlage: Masterplan AP3 Nr. 2, 4, 8 und Recht, Bericht 11 F1 (Kanal-Regel, Textblock), `r2-R2-leads.md`, `r3-R3-inhalt.md` (Lead-Restliste), Next-Docs `instrumentation-client.md` und `use-report-web-vitals.md`

## Ergebnis

### 1. Herkunft erfassen (`src/lib/attribution.js`, `src/instrumentation-client.js`)

- `captureAttribution()` läuft einmal pro Seitenaufruf in `src/instrumentation-client.js`. Das ist nach dem HTML und vor der Hydration, ohne `useSearchParams`. Im Browser geprüft: Die Funktion läuft bei der Modulauswertung des Instrumentation-Chunks, nicht erst im Fallback.
- Erfasst werden `utm_source|medium|campaign|term|content`, der Referrer-Host (die eigene Domain zählt nicht), die Landingpage (nur der Pfad, ohne Query) sowie `gclid`, `gbraid`, `wbraid`, `fbclid` und `msclkid`. Alle Werte sind auf 150 Zeichen gekürzt, Steuerzeichen werden entfernt.
- **Einwilligungsgrenze.** Gelesen wird über das Cookie `cookieConsent` und das Ereignis `ph-consent-change`. `Cookies/**` bleibt unverändert.
  - **Ohne Ads-Einwilligung:** Die Daten liegen nur im Arbeitsspeicher (`window.__phAttribution`). Nichts wird auf dem Gerät gespeichert. Klick-IDs werden nie herausgegeben. Der Kanal darf trotzdem aus dem Vorhandensein einer Klick-ID abgeleitet werden, weil das keine Kennung ist.
  - **Mit Ads-Einwilligung** (`googleAds`): `localStorage.ph_attr = { v: 1, first, last, exp }`, 90 Tage rollierend. First-Touch bleibt stehen. Last-Touch wird nur durch einen Besuch mit Signal ersetzt (UTM, Klick-ID oder externer Referrer), ein Direktbesuch überschreibt ihn nicht. Klick-IDs sind enthalten.
  - Wird die Einwilligung **später** erteilt, wird der Touch im Arbeitsspeicher sofort gespeichert. Wird sie **widerrufen**, löscht das Ereignis `ph_attr` sofort.
- **Kanal-Regel** `channelOf()` nach 11 F1, der erste Treffer gilt:
  1. gclid, gbraid, wbraid ⇒ Google Ads
  2. msclkid ⇒ Microsoft Ads
  3. `utm_medium` cpc, ppc, paid* ⇒ Paid
  4. Newsletter oder `utm_medium=email` ⇒ Newsletter
  5. `qr-*` ⇒ Offline/QR
  6. ChatGPT, Perplexity, Copilot, Gemini, Claude u. a. ⇒ **KI-Suche**, per Referrer oder `utm_source` (zum Beispiel `utm_source=chatgpt.com`). Diese Prüfung kommt **vor** der Suchmaschinen-Prüfung, weil gemini.google.com sonst als Google zählen würde.
  7. Social, per fbclid, UTM oder Referrer ⇒ Social
  8. Suchmaschine ohne UTM ⇒ Organisch
  9. Sonstiger Referrer oder sonstige UTM ⇒ Verweis
  10. Sonst ⇒ Direkt
- Größe: rund 1 KB gzip, keine Abhängigkeit, kein Netzwerk.

### 2. Herkunftsblock und `lead_ref` (`src/lib/forms/leadPayload.js`, `client.js`, `schemas.js`, `forward.js`)

- `postForm()` erkennt die drei Anfrage-Routen: `/api/upload/inquiry/{kontakt,beratung,produkt}`, `/api/kontakt` (für den Adventsabend), `/api/beratung_anfrage` und `/api/anfrage_produkt`. Dann hängt die Funktion an das **bestehende Freitextfeld** (`ihre_nachricht`, `bitte_beschreiben_sie_ihr_vorhaben`, `anfrage_beschreibung`) den Block an:
  ```
  ── Herkunft (automatisch) ──
  Kanal: Paid · Quelle: test / cpc · Kampagne: r4-check
  Einstieg: /de/kontakt · Referrer: www.google.com
  Erster Kontakt: Organisch · 01.10.2026 · /de        (nur mit Ads-Einwilligung, wenn verschieden)
  Klick-ID: gclid=…                                    (nur mit Ads-Einwilligung)
  Sprache: de · Gerät: mobil
  Referenz: <lead_ref>
  ```
  Dazu kommt `lead_ref = crypto.randomUUID()` (mit Fallback ohne `randomUUID`). Der Block wird nie doppelt angehängt, ein älterer Block wird ersetzt. Das Ergebnis enthält `leadRef`.
- **Alle 4 Formulare** (Kontakt, Beratung, Produktanfrage, Adventsabend) laufen über `postForm` und bekommen Block und Referenz automatisch. `KontaktForm.js` gehört nicht zu diesem Paket und ist **unverändert**. Für die Eingabe reicht `postForm`, für `trackLead` greift der Fallback (siehe 3).
- **Routen abwärtskompatibel.**
  - Die Schemas (Allowlist) akzeptieren `lead_ref` (UUID). Ein ungültiger Wert wird verworfen und blockiert nichts.
  - Die Freitextfelder erlauben zusätzlich bis zu `HERKUNFT_MAX` (1.500 Zeichen). Die Mindestlänge von 10 Zeichen zählt nur den Text der Besucherin, der Block allein reicht nicht.
  - `inquiryHandler` entfernt `lead_ref` vor dem Weiterleiten. Das Backoffice bekommt **genau die bisherigen Felder**, die Referenz steht im Text. Bei Backoffice-Fehlern steht `lead_ref` in der Server-Logzeile, damit sich der Fall zuordnen lässt.
  - Alte Aufrufer ohne Block (Küchenplaner, Upload-Route) funktionieren unverändert.

### 3. Messung (`src/lib/analytics.js`, `src/context/**`)

- `trackLead(form, { transaction_id })`: Beratung, Produktanfrage und Adventsabend übergeben `result.leadRef`. Ohne Angabe nimmt `trackLead` **einmalig** die Referenz des zuletzt gesendeten Formulars. So hat auch Kontakt die `transaction_id`, und ein späterer Lead ohne `postForm` (Küchenplaner) erbt sie nicht. Im e2e geprüft: `generate_lead.transaction_id` ist gleich dem `lead_ref` im Body.
- **Web Vitals:** `src/context/WebVitals.js` nutzt `useReportWebVitals` aus dem eingebauten `next/web-vitals`. Es ist **kein npm-Paket** dazugekommen, der Test prüft das in `package.json`.
  - `reportWebVitals()` sendet `trackEvent("web_vitals", { metric_name, metric_id, metric_value, metric_delta, metric_rating, value, page_path })` nur, wenn die **Statistik-Einwilligung** im Cookie steht. Die Prüfung steckt in der Funktion selbst und verlässt sich nicht nur auf gtag.
  - CLS wird ×1000 als `value` gesendet.
  - Eingehängt ist die Komponente über `CartProvider`. Das ist der einzige Client-Provider auf jeder Seite, die Layout-Dateien gehören AP8.
- **`add_to_wishlist`** in `CartContext`: Beim Einzelnen Merken und beim Merken mehrerer Stücke (nur die wirklich neuen) gehen `items[{ item_id, item_name, item_brand }]` mit, ohne Preis. Nebenbei korrigiert: Die Hinweistexte sagten „Markenliste“, jetzt heißt es „Merkliste“.

### 4. Merkliste und Termin

- **Merkliste** (`CartPage`): Zweiter Weg unter dem Primärknopf, als Sekundärknopf **„Diese Auswahl im Showroom ansehen“** mit Hinweis. Er führt zu `/{locale}/beratung?produkt=Marke Name, …` (höchstens 10 Stücke und 400 Zeichen). Das Beratungsformular beginnt dann mit „Anfrage zu: …“, im e2e geprüft.
- **Termin** (`src/components/Booking/{config.js,BookingEmbed.js}`, eingebunden auf `/beratung` nach dem Formular):
  - `BOOKING_PROVIDER` ist standardmäßig `none`, dann wird nichts gerendert.
  - Bei `link` erscheint ein ruhiges Band „Termin online wählen“ mit „Kalender öffnen“. Der Link führt zu `BOOKING_URL` (nur https) und öffnet sich in einem neuen Fenster. Der Hinweis nennt den Anbieter-Host und dessen Datenschutzhinweise.
  - Vor dem Klick gibt es keine Iframe-, Skript- oder Prefetch-Anfrage an den Anbieter.
  - Jeder andere Wert, auch `calcom`, gilt als `none`, bis AVV und Paket da sind.
  - Kein WhatsApp-Link.

### 5. Rückbau des i18n-Fallbacks

- R4-i18n hat `forms.*` übernommen, das steht in `_uebernommen` in `messages-r2-leads.json` und `messages-r3-inhalt.json`. Geprüft sind alle 29 Schlüssel in DE/EN/FR/IT.
- `useFormText()` und `formCopy()` lesen deshalb **nur noch die Messages**. Die Tabellen aus `src/lib/forms/i18n.js` kommen nicht mehr ins Client-Bundle. Dadurch erscheint IT jetzt in der tu-Form der Messages statt in der Lei-Form des Fallbacks.
- `FORM_TEXT` und `FORM_TEXT_R3` bleiben nur als dokumentierter Vertrag, weil `tests/unit/r3-inhalt.test.mjs` (fremd) und `forms-leads.test.mjs` sie lesen. Siehe offene Punkte.
- Neue Texte stehen in `Marktresearch/digital/teamleiter/messages-r4-leads.json` (`cart.selection.showroom|showroomNote`, `booking.title|text|cta|note`, 4 Sprachen). Bis zur Übernahme dient `src/lib/forms/leadsCopy.js` als Fallback mit denselben Werten. Ein Test prüft, dass beide gleich sind.

## Dateien

| Bereich | Dateien |
|---|---|
| Herkunft | `src/lib/attribution.js` (neu), `src/instrumentation-client.js` (neu) |
| Formular-Vertrag | `src/lib/forms/{leadPayload.js (neu), leadsCopy.js (neu), client.js, schemas.js, forward.js, i18n.js (nur Kommentar)}` |
| Messung | `src/lib/analytics.js`, `src/context/{CartContext.js, WebVitals.js (neu)}` |
| Formulare | `src/components/BeratungClient/BeratungClient.js`, `src/components/AnfrageFormProduct/AnfrageFormProduct.js`, `src/app/[locale]/adventsabend/AdventsabendForm.js` (je `transaction_id`), `src/components/Forms/useFormText.js` (Fallback-Rückbau) |
| Merkliste/Termin | `src/components/CartPage/CartPage.js`, `src/components/Booking/{config.js, BookingEmbed.js}` (neu), `src/app/[locale]/beratung/page.js` |
| Tests | `tests/unit/r4-leads.test.mjs` (neu, 18 Tests), `tests/e2e/r4-leads.spec.js` (neu, 8 Tests), `tests/e2e/forms-leads.spec.js` (Schlüsselliste Beratung + `lead_ref`) |
| Texte | `Marktresearch/digital/teamleiter/messages-r4-leads.json` (neu) |

Unverändert: die API-Routen-Dateien (die Logik steckt in `lib/forms`), `Kontakt/kontakt.js`, `Newsletter/**` (kein Freitextfeld, `sign_up` wie bisher), `Cookies/**`, `client-layout.js`, `KontaktForm.js`.

## Prüfung

- **Unit:** `node --test tests/unit/r4-leads.test.mjs` ergibt 18/18 grün. Abgedeckt sind die Kanal-Regel (25 Fälle, inkl. KI-Suche, gemini vor Google, eigene Domain = Direkt), die Einwilligungsgrenze mit Fake-Window (ohne Einwilligung kein `ph_attr` und keine Klick-ID, mit Einwilligung First/Last plus gclid, Widerruf löscht, spätere Einwilligung speichert), `mergeStored`, der Block, die Schemas, die Route (ans Backoffice gehen genau die 5 bisherigen Felder, kein `lead_ref`), `trackLead`/Web Vitals/`add_to_wishlist`, der Buchungsschalter, die Texte und der i18n-Rückbau.
- **Bestehende Unit-Tests:** `forms`, `forms-fix`, `forms-leads` und `r3-inhalt` ergeben 47/47 grün. `upload`, `r3-portal-upload`, `r3-i18n`, `r4-i18n`, `r3-shell` und `r4-ci-ratelimit` ergeben 67/67 grün.
- **e2e** (`--project=desktop`):
  - `r4-leads.spec.js` ergibt 8/8 grün. Geprüft sind Block und `lead_ref` in allen 4 Formularen, `transaction_id` gleich `lead_ref`, ohne Einwilligung kein `ph_attr` über zwei Seiten, mit „Alle akzeptieren“ `ph_attr` plus Klick-ID im Block, die Merkliste mit Showroom-Link und Vorbelegung sowie der Termin-Schalter aus ohne Kalender- oder WhatsApp-Anfrage.
  - `forms-leads.spec.js` ergibt 11/11 grün.
  - Alle POSTs waren abgefangen (`blockFormSends` + `page.route`), Google-Hosts abgebrochen. Nichts ging ans Backoffice, keine Mail.
- **ESLint:** auf allen Paketdateien und Tests 0 Meldungen.
- **Screenshots:** `qa-screenshots/teamleiter/r4-R4-leads/selbst/` (6 URLs × 4 Geräte, `report.json`), dazu `merkliste-auswahl--*.png` (Merkliste mit Stück und Showroom-Knopf).

## Offene Punkte

1. **i18n:** `messages-r4-leads.json` übernehmen (R4-i18n oder Runde 5). Danach `leadsCopy.js` auf `selectionLabel` reduzieren. Den Test `r3-inhalt.test.mjs` (Besitzer R3-inhalt/R4-i18n) auf die Messages umstellen, danach `FORM_TEXT`/`FORM_TEXT_R3` und `formText` in `src/lib/forms/i18n.js` löschen.
2. **Termin live** erst nach E7: Tool, AVV, EU-Region und ein DSE-Absatz. Dann `BOOKING_PROVIDER=link` und `BOOKING_URL=https://…` setzen. Cal.com-Embed (`next/dynamic` nach Klick), `booking-webhook` und `trackLead("termin")` brauchen das Paket `@calcom/embed-react` und eine Entscheidung. Das Klick-Event `book_appointment` ist seit der Nachbesserung da (siehe unten).
3. **WhatsApp** bleibt aus, bis E8 die Nummer liefert.
4. **Selbstauskunft** („Wie sind Sie auf uns aufmerksam geworden?“, AP3 Nr. 3) gibt es als Feld noch nicht. `withLead(…, { selfReport })` ist vorbereitet.
5. **Backoffice-Felder** (11 F11: `lead_ref`, `quelle_kanal`, `utm_*` …): Bis dahin steht alles im Text. Sobald es die Felder gibt, reicht es, in `forward.js` statt des Löschens zu mappen.
6. **`KontaktForm.js`** (fremd): Ein expliziter `trackLead("kontakt", { transaction_id: result.leadRef })` wäre sauberer als der Fallback.
7. Die Beratungsauswahl geht weiter in der Sprache der Seite ans Backoffice (alt, aus R3 notiert).

## Nachbesserung nach QM-Feedback (26.10.2026, Note vorher 8/10)

Grundlage: `qa-screenshots/teamleiter/r4-R4-leads/feedback.md`.

### P2-1 Herkunft ohne Einwilligung: jetzt nur der Kanal (behoben im Code)

Entschieden zugunsten des verbindlichen Rechtspakets (02 Z. 130, Checkliste C13, Übersicht Z. 128), nicht der weiteren Lesart von Masterplan-Entscheidung 4. `herkunftBlock()` in `src/lib/forms/leadPayload.js` schreibt **ohne Ads-Einwilligung** nur noch:

```
── Herkunft (automatisch) ──
Kanal: Paid
Sprache: de · Gerät: mobil
Referenz: <lead_ref>
```

Keine `utm_*`-Werte, keine Kampagne, kein Referrer-Host, keine Einstiegsseite. Der Kanal ist eine abgeleitete Kategorie (zum Beispiel „Paid“, „KI-Suche“, „Organisch“) und keine Kennung. Quelle, Kampagne, Einstieg, Referrer, Erster Kontakt und Klick-ID erscheinen nur mit `googleAds`-Einwilligung. Damit passt der DSE-Satz „Ohne Einwilligung speichern wir das nicht“. Für die Kanzlei bleibt ein Satz zu ergänzen (Vorschlag in DSE 4.x „Herkunft der Anfrage“): *„Ohne Einwilligung vermerken wir nur eine grobe Kategorie, wie Sie auf uns gestoßen sind (z. B. Suchmaschine, Anzeige, Newsletter), Rechtsgrundlage Art. 6 Abs. 1 lit. f DSGVO, ohne Speicherung auf Ihrem Gerät, Speicherdauer wie die Anfrage.“*

### P2-2 Neue GA4-Daten in der DSE (Textvorschlag, Freigabe Kanzlei)

Die Datei `Marktresearch/recht/02-datenschutzerklaerung-entwurf.md` gehört nicht zu diesem Paket. Hier steht deshalb der fertige Ersatz für Z. 135 zur Übernahme durch Recht/Anwalt (`anwalt-vorschau.md`):

> **Ereignisse in Google Analytics (nur mit Einwilligung „Statistik“):** Wir messen, ob ein Formular abgeschickt wurde (`generate_lead`, mit Formulartyp), Klicks auf Telefon-, E-Mail- und Terminlinks (`contact_click`, `book_appointment`), Newsletter-Anmeldungen (`sign_up`), das Merken von Produkten (`add_to_wishlist`: Produkt-ID, Produktname, Marke, kein Preis) und die Ladegeschwindigkeit der Seiten (`web_vitals`: Messwert, Bewertung, Seitenpfad). Namen, E-Mail-Adressen, Telefonnummern oder Nachrichtentexte übermitteln wir nicht an Google. **Verknüpfung mit Ihrer Anfrage:** Jede Anfrage erhält eine zufällige Referenznummer. Dieselbe Nummer senden wir als Transaktions-ID an Google Analytics und vermerken sie in Ihrer Anfrage. Damit können wir intern nachvollziehen, über welchen Weg eine Anfrage zustande kam. Google erhält dadurch keine Namen; wir selbst können die Analytics-Daten zu dieser Anfrage aber Ihrer Person zuordnen. Rechtsgrundlage: Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, § 165 Abs. 3 TKG 2021), jederzeit widerrufbar.

Technisch unverändert: Alle Ereignisse laufen nur mit Statistik-Einwilligung (`web_vitals` prüft das selbst). Die Checkliste C13 braucht zusätzlich die Zeile „`transaction_id = lead_ref` nur mit Statistik-Einwilligung, DSE nennt die Verknüpfung“.

### P3, mit behoben

- **P3-1:** `postForm()` (`src/lib/forms/client.js`) merkt `lead_ref` erst nach `result.ok`. Ein gescheiterter Versand (Fehlerstatus oder offline) löscht eine gemerkte Referenz. Ein späterer Lead (Küchenplaner) erbt keine `transaction_id` mehr. Neuer Unit-Test.
- **P3-2:** Im Termin-Band hängt der Hinweis „Öffnet … in einem neuen Fenster“ jetzt per `aria-describedby="termin-online-hinweis"` am Link (WCAG 3.2.5 / G201). Dazu kommt `book_appointment` über den bestehenden delegierten Klick-Listener in `analytics.js` (`a[data-booking-provider]`), ohne Client-Insel. Das Band bleibt standardmäßig aus (`BOOKING_PROVIDER=none`).

### Offen

- P3-3 (`?produkt=` in `page_location`), P3-4 (Hydration-Mismatch im Integrator-Build prüfen), P3-5 (Brotkrumen „Home“/„Startseite“, Shell/i18n) und P3-6 (Übernahme der Messages, `KontaktForm.js` mit explizitem `transaction_id`, Selbstauskunft) wie oben.
- Die DSE-Texte (P2-1 Zusatzsatz, P2-2 Ersatz Z. 135) müssen von Recht/Kanzlei übernommen werden.

### Prüfung nach dem Fix

- Unit: `node --test tests/unit/r4-leads.test.mjs tests/unit/forms*.test.mjs` ergibt 54/54 grün. `r4-leads` hat jetzt 19 Tests: einen neuen für `lead_ref` bei Fehlschlag, verschärfte Prüfungen beim Block ohne und mit Einwilligung und bei `aria-describedby` / `book_appointment`.
- e2e: `r4-leads.spec.js --project=desktop` ergibt 8/8 grün (2,1 min). Ohne Einwilligung prüft der Test jetzt, dass weder Quelle, Kampagne, Einstieg, Referrer noch `r4-check` im Block stehen. Mit Einwilligung sind Quelle, Kampagne und Einstieg da. Alle POSTs abgefangen.
- Screenshots `qa-screenshots/teamleiter/r4-leads/fix/`: 4 URLs (Beratung, Merkliste, Kontakt, Newsletter) × 4 Geräte. 14 Aufnahmen mit Status 200 und ohne Überlauf. Desktop Kontakt/Newsletter brachen ab, weil der Dev-Server mitten im Lauf neu startete (`ERR_CONNECTION_REFUSED`). Danach lieferte er auf allen Seiten 500, weil der Dev-Cache `.next/dev/prerender-manifest.json` kaputt ist (`Unexpected non-whitespace character after JSON at position 417131`). Das kommt nicht aus diesem Paket und braucht einen Neustart des Dev-Servers durch die Leitung. Angesehen: Beratung und Kontakt auf dem iPhone, Merkliste auf dem Desktop. Ruhig, kein Überlauf, keine sichtbare Änderung, da Termin-Band aus.
