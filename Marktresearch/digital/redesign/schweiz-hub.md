# Schweiz-Hub `/de/einkaufen-aus-der-schweiz` (R5-schweiz, Masterplan AP6 Nr. 2)

**Status:** Entwurf. `noindex,follow`, kein Canonical, kein hreflang, nicht in Sitemap, llms.txt oder Navigation. Nur `de`, andere Locales liefern 404. Banner „Entwurf, Freigabe durch Steuerberater/Zollspediteur offen“.

## Dateien

| Datei | Aufgabe |
|---|---|
| `src/app/[locale]/einkaufen-aus-der-schweiz/page.js` | Server-Seite, `revalidate = 43200` (gleicher Takt wie der EZB-Cache) |
| `src/components/Schweiz/ChfRechner.js` | einzige Client-Insel: Formular mit `useActionState`, zeigt fertige Texte |
| `src/components/Schweiz/DraftBanner.js` | Entwurfs-Hinweis (Server) |
| `src/lib/ch/estimate.js` | dünne Schicht über `Labs/Dreilaender/calc.js`: Wege A/B, de-CH-Labels, Formatierung |
| `src/lib/ch/actions.js` | `"use server"`: Kurs über `ecb.server.js`, Richtwerte über `store.server.js`, Rechnung über `estimate.js` |
| `src/lib/ch/view.js` | Kursanzeige (Kurs, Datum, Quelle) über `rateNotice()` aus `rate.js` |
| `src/lib/ch/content.js` | alle Texte, jede Aussage mit Quelle; `[prüfen]`-Stellen intern |

Labs-Dateien (`calc.js`, `rate.js`, `ecb.server.js`, `store.server.js`, `pricing.js`) werden nur importiert, nicht geändert.

## Rechner

- Rechnet **auf dem Server** (Server Function). Damit kommen weder Rechenkern noch zod in den Browser. Die Insel ist minifiziert 4,1 KB groß, mit gzip 1,5 KB (gemessen mit terser und gzip aus `next/dist/compiled`). Ohne JS funktioniert sie als normales Formular.
- Sichtbar sind: Kurs (1 € = x CHF), Datum, Quelle (EZB, heute oder Fallback), Rundung („ungerundete Zwischenwerte, Anzeige auf den Rappen, BAZG rechnet mit eigenem Devisenkurs des Vortags“), die Zuschläge als „(Schätzung)“ (Verzollungsgebühr CHF 80–150 zzgl. 8,1 %, eigener Transport CHF 150–250 aus Bericht 18, Abschn. 8.1) und die Kennzeichnung „Unverbindliche Kostenschätzung“.
- **Fracht** rechnet nur mit, wenn die Kundin oder der Kunde einen Betrag einträgt. Sonst steht dort „Lieferkosten: nicht eingerechnet“. Den 450-€-Schätzwert der Labs zeigt die Seite nicht als Preis.
- Weg C (verzollt) sowie Küche oder Einbau mit Montage werden nicht gerechnet und nicht beworben.
- Ohne gültigen Kurs zeigt der Rechner keine Frankenbeträge, sondern den Hinweistext aus `rateNotice`.
- Unit-Test `tests/unit/r5-schweiz.test.mjs` bildet Bericht 18, Tabelle 8.1, nach: A ≈ CHF 20’929.97–21’029.97, B ≈ CHF 21’315.30–21’390.97, MWST 1’557.06 bzw. 1’590.69, AT-Brutto in CHF 23’067.50.

## Inhalt (Wege A/B, Ablauf, FAQ)

Quellen sind Bericht 18 und der geprüfte Ratgeber-Entwurf (Prüfvermerk 26.10.2026). Die Quellenliste steht auf der Seite. **Nicht gerendert ([prüfen], nur in `content.js`):**

1. Ob Anhänger oder Mietbus noch als Reisegepäck gelten (keine Quelle, mit dem Zoll klären).
2. Wie Platzhirsch die USt-Rückerstattung abwickelt (selbst oder über einen Dienstleister mit Gebühr).
3. Öffnungszeiten Tisis/Schaanwald: Bericht 18 und Ratgeber widersprechen sich.
4. Quelle § 7 UStG 1994 (Ausfuhrlieferung) ergänzen.
5. FAQ „Liefert Platzhirsch selbst in die Schweiz?“: keine Speditionsangebote, Entscheidung des Inhabers.
6. FAQ „Ersparnis gegenüber einem Kauf in der Schweiz“: Schweizer Listenpreise nicht verifiziert.

Bewusst weggelassen: die Wörter „steuerfrei“, „Tax-Free“ und „Festpreis“, Montagezusagen, Steuerberatung, Händler-Aussagen, Superlative und Markennennungen.

## Freigabe (Schalter)

1. Steuerberater und Zollspediteur lesen `content.js` und die Rechnerlogik gegen und klären die [prüfen]-Punkte.
2. Danach `DraftBanner` entfernen, `robots` auf `index: true`, Canonical setzen.
3. INT bzw. R5-shell-seo nehmen die Seite auf: Sitemap (`src/lib/seo/sitemap/local.js`), llms und Navigation. `og:locale` de_CH.
4. Die Schätzwerte für Gebühr und Transport durch Spediteur-Angebote ersetzen (`.data/dreilaender/config.json` mit `approved: true`).

## INT-Anfragen

- `tools/checks/check-claims.mjs` (R5-release): `/de/einkaufen-aus-der-schweiz` in `EXTRA_PATHS` für den `--live`-Lauf aufnehmen. Bis dahin prüft der Unit-Test alle gerenderten Texte mit `findClaims()` und einer eigenen Verbotsliste. Der statische Lauf `check:claims` erfasst die Quelltexte bereits (0 Funde).
