# R5-commerce: AP9 hinter Schalter

Stand: 26.10.2026, Branch `feature/neuauftritt`. Nichts committet, nichts installiert, kein Build im Repo. Feature-Doku: `Marktresearch/digital/features/commerce.md`.

## Ergebnis

- **Standard aus:** `VOUCHER_MODE` und `ATELIER_MODE` sind ohne Wert `off`. Dann antworten `/de/gutscheine`, `/de/gutscheinbedingungen`, `/de/atelierverkauf`, `/de/atelierverkauf/*`, `/en/gutscheine` und beide APIs (POST und GET) mit 404. Es gibt keinen Eintrag in Navigation, Sitemap oder llms. Ein Unit-Test prüft `src/lib/seo`, Navbar, llms und Sitemap, der E2E-Test prüft `/sitemap.xml` und `/llms.txt`.
- **Vorschau** `/de/preview/commerce`: 200, `noindex, nofollow, nocache`, mit Banner „Entwurf, Freigabe Insolvenzrechtler/Steuerberater offen“ und Anzeige der Schalter. Die Demo-Formulare senden nichts. Erreichbar nur in der Entwicklung oder mit `COMMERCE_PREVIEW=1`.
- **Gutschein-Anfrage:** Betrag ab 25 €, Vorschläge 50–1.000 €, Motiv, Empfänger, Grußtext, Firma, Stückzahl. Die Anfrage läuft über `guardForm`, als Text an das Kontakt-Backoffice. Den Herkunftsblock liefert nur `src/lib/forms`. Die Bestätigung enthält kein Zahlungs- und kein Fristversprechen.
- **Gutscheinbedingungen** als Entwurf: unbefristet, Teileinlösung, keine Barablöse, 14 Tage Rücktritt, kein OS-Link. 11 offene Stellen sind markiert (6 Anwalt, 2 Steuerberater, 3 Unternehmen).
- **Atelier:** CSV-Quelle mit zod, fehlerhafte Zeilen werden protokolliert und übersprungen. Preisregeln mit Pflichtzusätzen, ohne Streichpreise, UVP nur mit Beleg. Die Reservierungsanfrage hat keinen Vertragsschluss und keine Anzahlung, Preis und Titel setzt der Server. JSON-LD gibt es nur bei echten Daten.

## Prüfung

| Prüfung | Ergebnis |
|---|---|
| `node --test tests/unit/r5-commerce.test.mjs` | 19/19 grün (Schalter, API off/anfrage mit gemocktem fetch, Preisregeln, zod-Fehlerzeilen, JSON-LD, Bedingungen, Claims) |
| `npx playwright test tests/e2e/r5-commerce.spec.js --project=desktop` | 11/11 grün im 2. Lauf. Im 1. Lauf gab es 3 Ausfälle durch Timeouts/500 des Dev-Servers, der zeitweise auf allen Seiten 500 lieferte (auch `/de`, nicht paketbezogen). axe (WCAG 2.2 AA) ohne serious/critical, kein horizontales Scrollen bei 375 px |
| `npx eslint` auf alle eigenen Dateien | 0 Fehler, 0 Warnungen |
| `npm run check:claims` | 0 Verstöße (13 per Allowlist, unverändert) |
| `shoot.mjs` (iPhone, Android, iPad, Desktop) | Vorschau 200 auf allen 4 Geräten, `/de/gutscheine` und `/de/atelierverkauf` 404 (einziger Konsolenfehler ist der erwartete 404). Bilder angesehen: Banner, Formular (Betrag 2-spaltig mobil, Motive, Felder 52 px) und Bedingungen lesbar. Siehe `qa-screenshots/teamleiter/r5-R5-commerce/selbst/` (inklusive `m-form.png`, `m-atelier.png`) |

## Offene Punkte

1. **Freigaben vor dem Einschalten:** Insolvenzrechtler (Kundengeld), Kanzlei (Aussteller W14, Widerrufsbelehrung und Formular, Seite „Vertrag widerrufen“), Steuerberater (Einzweck/Mehrzweck, Café W15).
2. **Team:** PDF-Vorlage der Motive, Gutscheinregister mit Codes ab 12 Zeichen, Antwortzeit (deshalb keine Frist im Text), Obergrenze 5.000 € bestätigen, Inventur, Veröffentlichungs-Tab des Sheets, eigene Fotos.
3. **Integrator nach Freigabe:** Einträge in Navigation, Sitemap und llms. `messages-r5-commerce.json` entfällt, weil die Seiten nur auf Deutsch laufen und die Texte in der Komponente bzw. in `src/lib/commerce` stehen.
4. **[anwaltlich prüfen]:** `itemCondition` bei Ausstellungsstücken (bewusst weggelassen) und die UVP-Zeile bei Ausstellungsware.
5. **Rate-Limit:** Das Bucket für weitergeleitete Anfragen zählt auch eine Reservierung für ein nicht mehr verfügbares Stück (unkritisch).

## Nachbesserung nach QA-Feedback (26.10.2026)

Grundlage: `qa-screenshots/teamleiter/r5-R5-commerce/feedback.md` (Note 8/10, P1 keine, P2 1).

| Punkt | Status | Umsetzung |
|---|---|---|
| **P2** Entwurfs-Bedingungen mit `VOUCHER_MODE=anfrage` öffentlich | behoben | `src/lib/commerce/mode.js`: `voucherMode()` liefert `off`, solange `TERMS_STATUS` in `voucherTerms.js` nicht `"freigegeben"` ist. Damit liefern `/gutscheine`, `/gutscheinbedingungen` und `/api/gutschein_anfrage` 404, auch wenn der Schalter gesetzt ist. `voucherModeRequested()` dient nur der Anzeige in der Vorschau („anfrage, wirksam off“). Der Handler nimmt `termsStatus` nur für Tests an. Freigabe heißt: Kanzlei gibt frei, Platzhalter sind ersetzt, `TERMS_STATUS = "freigegeben"`. |
| P3 Sheet-Fotos von beliebigen https-Hosts | behoben | `PHOTO_RE` lässt nur `/atelier/…` mit `.jpg/.png/.webp/.avif` zu, ohne `..`. Zeilen mit fremden Hosts werden übersprungen (Feld `foto_url`). Fotos kommen also nach `public/atelier/`. |
| P3 leerer Alt-Text als Ersatz | behoben | `AtelierPhoto` nutzt `foto_alt`, sonst den Titel. |
| P3 „unbefristet“ gegenüber „Verjährungsfrist“ | an die Kanzlei | In Punkt 3 der Bedingungen als `[anwaltlich prüfen: …]` markiert (jetzt 7 Anwalt-Stellen). |
| P3 Hausnummer 11 gegenüber 9 | offen | Die Entscheidung der Geschäftsführung steht aus. Die Bedingungen nennen 11 (Firmenbuch). |
| P3 Obergrenze 5.000 € und Rate-Limit | offen | Bestätigung durch das Team. |

**Prüfung nach dem Fix:**
- `node --test tests/unit/r5-commerce.test.mjs tests/unit/r5-commerce-fix.test.mjs`: 24/24 grün. Neu: 5 Tests zur Kopplung (Modus, API 404 ohne Backoffice-Aufruf, Seiten-Guards), zur Foto-Allowlist und zum Alt-Text-Ersatz. Die Handler-Tests im Modus `anfrage` setzen `termsStatus: "freigegeben"` explizit.
- eslint auf alle geänderten Dateien: 0 Meldungen.
- `shoot.mjs` → `qa-screenshots/teamleiter/r5-commerce/fix/`: Die Vorschau liefert auf allen 4 Geräten 200. `/de/gutscheine` und `/de/gutscheinbedingungen` liefern 404 (Design-404). Ein einmaliger 500 auf dem iPhone kam von einem EPERM beim Umbenennen des Dev-Manifests (`.next/dev`, parallele Agenten) und war nicht paketbezogen. Drei Nachprüfungen per curl ergaben 404, die API liefert bei POST 404. Die Bilder habe ich angesehen.
