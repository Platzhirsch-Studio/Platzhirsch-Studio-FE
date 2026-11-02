# R5-leads-perf: Lead-Strecke (TBT /de/kontakt, transaction_id, Selbstauskunft)

Stand 26.10.2026. Branch `feature/neuauftritt`, kein Commit. Kein echter Versand: Alle POSTs in den Tests waren abgefangen (Unit: lokale fetch-Stubs, e2e: `blockFormSends` + `page.route`). Nichts ging ans Backoffice, keine Mail.

## Ergebnis

| Auftrag | Status |
|---|---|
| (1) TBT /de/kontakt ≤ 200 ms | **Ursachen im Code behoben, Budget hier nicht belegbar.** Ohne ICU-Kompilierung beim ersten Rendern, `upload/config` raus aus dem ersten Laden, statische Teile vom Server. Wegen der Maschinenlast nicht messbar (siehe Messung). Die Schlussmessung auf ruhiger Maschine macht R5-release. |
| (2) `trackLead("kontakt", { transaction_id })` | **erledigt**, alle 4 Formulare explizit, Unit- und e2e-Test |
| (3) Selbstauskunft optional | **erledigt** in Kontakt, Beratung (Schritt 4) und Produktanfrage. Nur im Herkunftsblock, Backoffice-Format und API-Allowlist unverändert |

## (1) TBT: was geändert wurde

1. **ICU nur bei Bedarf** (`src/lib/forms/formatText.js`, von `Forms/useFormText.js` genutzt): use-intl kompiliert jede Nachricht mit `intl-messageformat`, sobald Werte übergeben werden. Der Helfer hat immer `{ phone }` übergeben. Auf /kontakt wurden so beim Hydrieren 6 Nachrichten geparst (`requiredHint`, 2× `optional`, 3× Datenschutzhinweis). Jetzt geht ein reiner Text ohne `{ } ' <` unverändert durch, und zwar genau das, was `t(key)` ohne Werte liefert. ICU läuft nur für Fehlertexte mit `{phone}`, für die Zusammenfassung `{count, plural}` und den Stepper, also erst wenn ein Fehler gezeigt wird. Fehlende Schlüssel nehmen wie bisher den Weg über `t()`. Der Unit-Test vergleicht gegen den echten use-intl-Übersetzer, für jeden `forms.*`-Schlüssel in 4 Sprachen, mit und ohne Werte: **gleiche Ausgabe**.
2. **`errorKey` ohne Texttabellen** (`src/lib/forms/errorKey.js`): Bisher kam die 11-KB-Datei `lib/forms/i18n.js` (FORM_TEXT in 4 Sprachen) nur wegen `errorKey` in das Client-Bundle. Ein Test stellt sicher, dass die Zuordnung mit `i18n.js` übereinstimmt.
3. **UploadHandoff lazy** (`src/components/Forms/lazyHandoff.js`): `next/dynamic` für die Karte, `import()` für `handoffFrom` erst nach dem erfolgreichen Senden. Beim ersten Fokus im Formular wird der Chunk vorgeladen. Damit fallen `lib/upload/config.js` (Intl-Formatter beim Modulstart), `lib/upload/messages.js` und die Icons der Karte aus dem ersten Laden von /kontakt, /beratung und der Merkliste. Das gilt für alle drei Formulare. `lib/upload/config.js` selbst ist **unverändert**, weil Upload, Portal und API es weiter direkt importieren.
4. **Kleinere Hydration-Insel**: `Kontakt/kontakt.js` (Server) rendert den Datenschutzhinweis und das Auswahlfeld und gibt beides als Props an `KontaktForm`. Das HTML bleibt gleich, der Client rendert diese Teile nicht mehr.

**Bundle /de/kontakt (Prod-Build, Chunks laut client-reference-manifest):** vorher 198,5 KB in 8 Chunks, darunter ein Chunk mit 27 KB mit Upload-Karte, `tokenTtlDays` und FORM_TEXT. Nachher 187,7 KB. Upload-Code und Konfiguration liegen nur noch im Lazy-Chunk.

### Messung (eigene Kopien, perf.mjs, mobil 4× CPU, Median)

Vorher-Build `../ph-prod-r5-leads` (:3157), nachher `../ph-prod-r5-leads-nach` (:3158). Gemessen wurde abwechselnd, damit beide Builds dieselbe Last sehen. Rohdaten liegen in `qa-screenshots/teamleiter/r5-leads-perf/{vorher,vorher-m1,vorher-m2,nachher-m1,nachher-m2}/perf.json`.

| Lauf | /de | /de/kontakt |
|---|---|---|
| vorher (3 Läufe) | 856 | 931 |
| vorher-m1 (5) | 516 | 651 |
| nachher-m1 (5) | 701 | 979 |
| vorher-m2 (5) | 664 | 838 |
| nachher-m2 (5) | 1275 | 733 |

**Nicht auswertbar:** Während der Messung liefen 9 Agenten mit Builds, Playwright und dem Dev-Server. Auch `/de` streut ohne jede Änderung zwischen 516 und 1 275 ms, und alle Seiten liegen 2–4× über dem R4-Wert (kontakt 276 ms). Der Unterschied zwischen vorher und nachher liegt im Rauschen. **Bitte an R5-release:** `check:prod --label=r5-ende` auf ruhiger Maschine. Erwartet wird nur ein kleiner Gewinn (weniger JS beim ersten Laden, 6 ICU-Kompilierungen weniger). Ob danach ≤ 200 ms erreicht sind, hängt vor allem an der Hülle und am Layout, siehe R4-shell-perf: `/de` 225 ms ohne Formular.

## (2) transaction_id

`KontaktForm` sendet `trackLead("kontakt", { transaction_id: result.leadRef })`. Beratung, Produktanfrage und Adventsabend hatten das schon. Der Unit-Test prüft alle 4 Quelltexte (kein `trackLead("…")` ohne Parameter mehr) und das `generate_lead`-Ereignis mit genau der `lead_ref` des Requests, auch wenn eine alte Referenz gemerkt war. Der e2e-Test prüft `dataLayer.transaction_id === lead_ref`.

## (3) Selbstauskunft

- **Feld:** `Forms/SelfReportField.js`, ein optionales `<select name="selbstauskunft">` mit „Bitte wählen“ als Vorgabe und 10 Optionen nach Bericht 11. Es steht in Kontakt (nach der Nachricht), in Beratung Schritt 4 (die Wahl bleibt beim Zurückgehen erhalten) und in der Produktanfrage. Adventsabend ist bewusst ohne das Feld (eigenes Formular-Layout, Herkunft ist dort der Abend).
- **Weg:** Der Browser schickt nur einen festen Code. `prepareLead()` macht daraus die deutsche Bezeichnung (`src/lib/forms/selfReport.js`), und `withLead(…, { selfReport })` schreibt sie in den bestehenden Herkunftsblock: `Selbstauskunft: Empfehlung Freund/Kunde · Sprache: de · Gerät: mobil`. Freitext und unbekannte Codes werden verworfen. Ohne Auswahl ist der Block byte-gleich zu R4.
- **API/Backoffice:** Es gibt kein neues JSON-Feld, die Schemas sind unverändert. Ein alter oder fremder Client, der `selbstauskunft` als Feld schickt, wird angenommen, das Feld wird aber nicht weitergeleitet. Ans Backoffice gehen weiter genau 5 Felder (Unit-Test über `inquiryHandler`).
- **Consent:** Die Selbstauskunft ist eine freiwillige Angabe und kein Tracking. Sie geht deshalb auch ohne Einwilligung mit. Die Grenze aus R4 bleibt: Ohne Ads-Einwilligung steht nur der Kanal im Block (geprüft).
- **Texte:** `Marktresearch/digital/teamleiter/messages-r5-leads.json` (`forms.selfReport.*`, 4 Sprachen, IT mit „tu“). Gelesen wird mit `t.has()`, bis zur Übernahme greift `SELF_REPORT_TEXT` mit identischen Werten (per Test geprüft).

## Prüfung

- **Unit:** `node --test tests/unit/r5-leads.test.mjs` 11/11. Dazu `r4-leads`, `forms`, `forms-fix`, `forms-leads` grün (zusammen 66). `r4-shell` hat 1 roten Test (`client-layout.js`/Cookie-Import, Besitz R5-shell-seo, nicht von hier).
- **e2e** `tests/e2e/r5-leads.spec.js --project=desktop` gegen :3000: 4/4 grün. Geprüft: Selbstauskunft im Block, kein neues Feld, ohne Wahl keine Zeile, Beratung Zurück/Weiter, `transaction_id`, Lazy-Upload-Karte erscheint, **axe WCAG 2.2 AA** auf Kontaktformular und Beratung Schritt 4 ohne Verstöße.
- **ESLint** auf allen Paketdateien und Tests: 0 Meldungen. **check:claims:** 0 Verstöße.
- **Screenshots** `qa-screenshots/teamleiter/r5-R5-leads-perf/selbst/`: 5 URLs × 4 Geräte, 20/20 mit 200, ohne Konsolenfehler. Dazu `selbst/form/` mit Formularausschnitten Kontakt, IT-Contatto und Beratung Schritt 4 auf allen 4 Geräten (Skript `qa-screenshots/teamleiter/r5-R5-leads-perf/formshots.mjs`, POSTs blockiert). Angesehen: Kontakt iPhone, Contatto iPad, Beratung Desktop, Adventsabend Android. Feld, Label „(optional)“/„(facoltativo)“ und Abstände sind sauber. Der erste shoot-Lauf traf auf einen kurzen globalen 500 des Dev-Servers durch fremde HMR-Änderungen, der Wiederholungslauf war sauber.

## Dateien

Neu: `src/lib/forms/{selfReport,formatText,errorKey}.js`, `src/components/Forms/{SelfReportField,lazyHandoff}.js`, `tests/unit/r5-leads.test.mjs`, `tests/e2e/r5-leads.spec.js`, `Marktresearch/digital/teamleiter/messages-r5-leads.json`.
Geändert: `src/components/Forms/useFormText.js`, `src/lib/forms/client.js` (`prepareLead` mappt `selfReport`), `src/components/Kontakt/{KontaktForm,kontakt}.js`, `src/components/BeratungClient/BeratungClient.js`, `src/components/AnfrageFormProduct/AnfrageFormProduct.js`.
Unverändert: API-Routen, `schemas.js`, `forward.js`, `leadPayload.js`, `lib/upload/config.js`, Newsletter, Adventsabend.

## Nachbesserung nach QM-Feedback (Note 7/10, 3× P2)

Kein Code geändert, weil die Paketdateien schon stimmen. Gearbeitet wurde mit dem fertigen Prod-Build `../ph-prod-r5-leads-nach`. Seine Paketdateien sind byte-gleich zum Repo (`diff -rq` auf Forms, Kontakt, lib/forms, BeratungClient, AnfrageFormProduct, kontakt-Route und lib/upload); nur `layout.js` und `client-layout.js` haben sich seither durch fremde Pakete geändert. `next start` lief auf :3161, die Junction wurde danach mit `rmdir` entfernt, das Repo-node_modules ist unversehrt. Kein Build im Repo, keine POSTs (`/api/*`-POSTs abgebrochen). Ergebnisse liegen in `qa-screenshots/teamleiter/r5-R5-leads-perf/fix/prod/` (`prod-check.json`, `profile.json`, `run.log`, Screenshots).

**P2.2 Lazy-Load im Prod-Build: erledigt, belegt.** Die Chunks mit `lib/upload/config` (Marker `tokenTtlDays`) sind `2rbh6mx_d8nfp.js`, `38-z13ya6msgk.js` und `3b67vgdl6bjyb.js`. Beim ersten Laden von /de/kontakt (Pixel 7 und Desktop, networkidle + 4 s, keine Eingabe) werden 22 Skripte geladen, **keiner davon ist ein Upload-Chunk**. Erst nach Fokus auf `#kontakt-name` kommt `3b67vgdl6bjyb.js` als Vorladen. Was im Dev-Server (:3000) früher geladen wird, ist eine Eigenheit von Turbopack-Dev.

**P2.1 TBT-Nachweis: hier weiter nicht belegbar, aber unabhängig von der Last eingegrenzt.**
- `perf.mjs`, 7 Läufe, Median (Minimum): mobil `/de` 939 (598) ms, `/de/kontakt` 1772 (1044) ms. Desktop: `/de` 17 ms, `/de/kontakt` 67 ms, beide im Budget. Mobil streut `/de` zwischen 598 und 2499 ms, ohne dass sich etwas geändert hat. Zur gleichen Zeit liefen 6 Agenten. Die Mobilwerte sind deshalb **nicht** auswertbar.
- **CPU-Profil** (CDP-Sampling, 5 Ladevorgänge je Seite, ohne Drosselung, weniger lastabhängig als TBT): Das JavaScript auf dem Main-Thread dauert für `/de` und `/de/kontakt` gleich lang, **je 175 ms**. Der Formular-Chunk (`2q0qt7bn9viow.js`, mit `kontakt-name` und `selbstauskunft`) braucht davon **etwa 2 ms**. Der Rest verteilt sich auf die gemeinsame Hülle: Turbopack-Runtime mit Modulstart rund 46 ms, react-dom rund 60 ms, ein Framework-Chunk rund 30 ms und die Hülle `client-layout` (`1w2azryyiu0ka.js`) rund 6 ms.
- **Folgerung:** Was dieses Paket zur Kontaktseite beiträgt, liegt bei etwa 1 % des JavaScripts. Den Rest können die Paketdateien nicht weiter senken. Ob 200 ms erreicht werden, entscheidet sich an der Hülle bzw. am Layout (siehe R4: `/de` 225 ms ohne Formular). **An R5-release:** `check:prod` auf ruhiger Maschine. Liegt `/de/kontakt` dann etwa auf dem Wert von `/de` und über 200 ms, braucht die Hülle ein eigenes Paket (Runtime-/react-dom-Anteil, Hydration der Hülle). Den Lead-Teil betrifft das nicht.

**P2.3 Datenschutzerklärung: Entwurf für die Kanzlei.** Die DSE ist keine Paketdatei, deshalb nur dieser Entwurf zur Übergabe:
> „In unseren Anfrageformularen können Sie freiwillig angeben, wie Sie auf uns aufmerksam geworden sind (Auswahl aus einer festen Liste). Wir nutzen diese Angabe nur, um Ihre Anfrage zuzuordnen und unsere Werbemaßnahmen auszuwerten. Rechtsgrundlage ist unser berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO). Die Angabe wird zusammen mit Ihrer Anfrage gespeichert und mit ihr gelöscht. Wenn Sie nichts auswählen, hat das keine Nachteile.“

Gehört zum Rechtspaket (`Marktresearch/recht/`), Freigabe durch die Kanzlei vor Go-live.

**Erneute Prüfung:** `shoot.mjs` → `qa-screenshots/teamleiter/r5-R5-leads-perf/fix/`. 5 URLs × 4 Geräte = 20/20 mit Status 200, 0 Konsolenfehler, 0 fehlgeschlagene Requests, kein Überlauf. Angesehen: Kontakt iPhone, Contatto iPad und das Prod-Formular mobil mit Fokusrahmen am Namen. Layout sauber.

## Offene Punkte

1. **TBT-Nachweis:** R5-release misst `/de/kontakt` auf ruhiger Maschine. Laut CPU-Profil ist der JavaScript-Anteil gleich wie bei `/de`, das Formular macht etwa 2 von 175 ms aus. Was über 200 ms liegt, gehört zur Hülle bzw. zum Layout.
2. **Masterplan Nr. 19:** Dort ist die Selbstauskunft in der Beratung als **Pflicht** vorgesehen. Laut Auftrag ist sie hier überall optional. Die Umstellung wäre eine Zeile (`required` plus Validierung in Schritt 4), braucht aber eine Entscheidung des Inhabers. Die Ausfüllquote ist erst messbar, wenn die Backoffice-Felder (`quelle_selbstauskunft`) da sind.
3. **i18n:** `messages-r5-leads.json` übernehmen (Runde 6). Danach kann `SELF_REPORT_TEXT` auf den Fallback reduziert werden.
4. **DSE:** Ein Satz zur freiwilligen Angabe „Wie sind Sie auf uns aufmerksam geworden?“ (Zweck: Zuordnung der Anfrage, Speicherdauer wie die Anfrage) gehört zur Kanzlei.
5. Aufräumen: Die Build-Kopien `../ph-prod-r5-leads` und `../ph-prod-r5-leads-nach` liegen außerhalb des Repos und können gelöscht werden.
