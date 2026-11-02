# R2-leads: Lead-Strecke im Neuauftritt, Formular-Vertrag im Frontend

Stand 26.10.2026 · Runde 2 · Branch `feature/neuauftritt` (nicht committet) · Grundlage: `runde-2-plan.md`, `r1-R1-formulare.md` (offene Punkte 3 und 7), `redesign/fundament.md`, Design-Bibel §1, §2, §4–§6, §9, §14

## Ergebnis

- **Kontaktseite im neuen Designsystem.** Kopf wie bei den Inhaltsseiten (`UberUns/PageHeader`, nur importiert): Brotkrumen, eine H1 „Kontakt und Anfahrt“ in Bodoni, Lead im Gastgeber-Ton, ein Primärknopf „Nachricht schreiben“ (#nachricht) und ein Sekundärknopf „Anrufen“. Danach folgen drei Abschnitte. **Besuch** (Band): Adresse als `<address>`, Telefon, E-Mail, Öffnungszeiten als `<dl>` (gleiche Tabelle wie der Footer) und „Route planen“. Daneben die Karte mit festem Seitenverhältnis hinter `ConsentEmbed`. **Formular** und **Gespräch** (bestehender Text, Leitsatz, „Beratung anfragen“). Keine Radien, keine Schatten, kein Gold auf Hell, keine Walnut-Fläche. Das Fragezeichen-Stockbild, die Hover-Unschärfe, der springende Marker und die Gold-Knöpfe sind entfallen. Alles steht serverseitig im HTML (die Komponente `kontakt.js` ist jetzt eine Server-Komponente, nur das Formular ist eine Insel). Adresse, Koordinaten, Route, Telefon und E-Mail kommen aus `src/lib/site.js`. Die Hausnummer wurde **nicht** geändert, die feste „Landstraße 9“ im Karten-Iframe ist entfernt.
- **SEO:** `generateMetadata`, Canonical, hreflang (de/en/fr/it/x-default) und das `ContactPage`-JSON-LD sind unverändert. Die Seite hat eine H1 und die Gliederung H2/H2/H2. Geprüft: `/de/kontakt`, `/en/contact`, `/fr/contact`, `/it/contatto` liefern 200 mit Canonical und hreflang.
- **Formular-Vertrag in allen vier Formularen** (Kontakt, Beratung, Produktanfrage, Adventsabend):
  - Honeypot `website`: `components/Forms/Honeypot`, aus dem Bild geschoben (nicht `display:none`), `aria-hidden`, `tabIndex=-1`, `autoComplete="off"`.
  - `_t`: Millisekunden seit dem Rendern (`performance.now()` nach dem Mount). Damit ist R1-formulare Nr. 7 (Adventsabend) erledigt.
  - Fehler: Angezeigt wird der übersetzte `code` (`src/lib/forms/i18n.js`, DE/EN/FR/IT), nie der englische `error`. Beim Timeout steht ehrlich da, dass die Anfrage vielleicht trotzdem angekommen ist. Bei 400 mit `field` erscheint der Fehler am genannten Feld.
  - Am Feld: `aria-invalid`, `aria-describedby` und ein Fehlertext mit Icon. Der Fokus springt auf das erste fehlerhafte Feld. Die Zusammenfassung mit Sprunglinks steht in einer **höflichen** Live-Region, die immer im DOM liegt.
  - Nach Erfolg bekommt die Bestätigung den Fokus. Der Knopf nutzt `aria-disabled` statt `disabled`, damit der Fokus beim Senden nicht verloren geht.
- **`FormPrivacyNote`** (neu) steht in allen Formularen: „Informationen zur Verarbeitung Ihrer Daten finden Sie in unserer Datenschutzerklärung.“ Das ist kein eigener Rechtstext, ohne Zweck und ohne Zusage. Der Adventsabend-Satz „Wir verwenden Ihre Angaben nur …“ ist dadurch ersetzt.
- **Beratung:** Die Auswahlkarten sind jetzt `fieldset`/Radio. Das automatische Weiterspringen nach 500 ms ist entfallen (§14), dafür gibt es „Zurück“/„Weiter“ und „Schritt n von 4“. Beim Schrittwechsel geht der Fokus auf die Frage. Die Bestätigung bleibt stehen (vorher wurde nach 5 s zurückgesetzt).
- **Produktanfrage:** Neu sind die Felder mit Label oben, die Auswahl Person/Geschäft als Radio und das Label der Adresse (vorher falsches `htmlFor`). Die immer grünen Häkchen-Icons, die vor jeder Eingabe „gültig“ signalisierten, sind entfernt. Der Erfolgstext kommt aus den Messages, nicht mehr aus der englischen API-`message`. „Weiter zu den Produkten“ ist übersetzt, die Rückleitung führt auf die lokalisierte Katalog-URL.
- **API-Routen:** keine Änderung nötig. Antwortformat und Statuscodes sind gleich, Upload-Wrapper und Küchenplaner sind unberührt. `UploadHandoff` wird unverändert verwendet (`handoffFrom(kind, { email, result })`).

## Dateien

| Datei | Änderung |
|---|---|
| `src/app/[locale]/kontakt/page.js` | `PageHeader` statt Foto-Banner, Texte per `t.has()`/Fallback; Metadaten/JSON-LD unverändert |
| `src/components/Kontakt/kontakt.js` | Server-Komponente: Besuch, Karte, Formularabschnitt |
| `src/components/Kontakt/KontaktForm.js` | neu, Formular-Insel |
| `src/components/Kontakt/KontaktLastSection.js` | Server, Textspalte, Leitsatz, „Beratung anfragen“ |
| `src/components/Kontakt/copy.js` | neu: Fallback-Texte `contact.*` (4 Sprachen), Öffnungszeiten-Tabelle |
| `src/components/BeratungClient/BeratungClient.js` | neu gebaut (Stepper, RadioCards, Vertrag) |
| `src/components/AnfrageFormProduct/AnfrageFormProduct.js` | neu gebaut (Felder, Vertrag) |
| `src/app/[locale]/adventsabend/AdventsabendForm.js` | `_t` als Dauer, gemeinsamer Honeypot, Fehler-Codes, Fokus aufs Feld, FormPrivacyNote |
| `src/components/Forms/*` | neu: `FormField`, `RadioCards`, `FormAlert`, `FormSuccess`, `Honeypot`, `FormPrivacyNote`, `useFormGuard`, `focusField`, `useFormText` |
| `src/lib/forms/i18n.js` | neu: Texte der Codes, Feldmeldungen, Stepper, Datenschutzhinweis (DE/EN/FR/IT) |
| `src/lib/forms/client.js` | neu: `withGuardFields`, `elapsedSince`, `postForm`, `readFormResponse`, `codeFromStatus` |
| `Marktresearch/digital/teamleiter/messages-r2-leads.json` | Vorschlag `forms.*` (neuer Namespace) und `contact.*` (nur neue Schlüssel), aus den Modulen erzeugt; der Unit-Test prüft den Gleichlauf |
| `tests/unit/forms-leads.test.mjs` | 11 Tests |
| `tests/e2e/forms-leads.spec.js` | 10 Tests (Desktop-Projekt) |

## Prüfung

- `node --test tests/unit/forms*.test.mjs`: **35/35 grün** (24 alt, 11 neu). Der Volllauf `tests/unit/*.test.mjs` hat einen Fehlschlag in fremdem Code: der Live-Sitemap-Test („region pages … doorway audit“).
- `npx playwright test tests/e2e/forms-leads.spec.js --project=desktop`: **10/10 grün**. Alle POSTs sind per `page.route` abgefangen. Live gingen nur schema-ungültige Bodys an `/api/kontakt`, `/api/beratung_anfrage` und `/api/anfrage_produkt` (400 `invalid`, keine Weiterleitung). **Keine Anfrage ging ans Backoffice.**
- Abgedeckt sind:
  - leeres Absenden: Fokus, `aria-invalid`/`describedby`, Zusammenfassung, Sprunglink;
  - Payload mit `website: ""` und `_t` < 1e11;
  - 429/502/504 übersetzt, kein englischer Text im `main`;
  - 400 mit `field` am richtigen Feld;
  - Erfolg mit Fokus auf der Bestätigung;
  - EN-Seite mit englischem Code und Link `/en/datenschutz`;
  - Beratung per Tastatur (Leertaste, Pfeiltasten), ohne Auto-Weiter, Payload-Schlüssel unverändert;
  - Produktanfrage als „Geschäft“;
  - Adventsabend;
  - 375 px ohne Überlauf, Honeypot `tabindex=-1`, eine H1, Adresse und Öffnungszeiten im Server-HTML.
- ESLint auf alle eigenen Dateien: 0 Fehler, 0 Warnungen.
- `node tools/qa/shoot.mjs qa-screenshots/teamleiter/r2-R2-leads/selbst …` (/de/kontakt, /en/contact, /de/beratung, /de/produkte/sofas/sofas-lawrence, /de/adventsabend): 20 Aufnahmen, alle mit 200, ohne horizontalen Überlauf und ohne Konsolenfehler. Zusätzlich gibt es Zustandsaufnahmen `state-*` (Kontakt-Fehler, Kontakt-429, Produktanfrage-Fehler, Beratung Schritt 2) mit abgefangenen APIs. Nach Sichtung wurden nachgebessert: Öffnungszeiten brachen auf dem Desktop um (jetzt volle Breite, `nowrap`), und die Zusammenfassung zeigte neunmal „Bitte füllen Sie dieses Feld aus“ (jetzt mit Feldname).

## Offene Punkte

1. **Messages:** `messages-r2-leads.json` (`forms.*`, `contact.*` neu) übernimmt das i18n-Paket in Runde 3. Bis dahin greifen die Fallbacks. Die Adventsabend-Seite ist nur deutsch, ihre Feldtexte bleiben im Code.
2. **Hausnummer:** Laut Firmenbuch Landstraße 11, `site.js` nennt 9. Die Entscheidung liegt beim Inhaber. Die Kontaktseite folgt `site.js` automatisch.
3. **Öffnungszeiten** liegen jetzt dreimal vor: Footer, `Kontakt/copy.js` und `layout.js` (JSON-LD). Sie gehören in Runde 3 als eine Quelle nach `site.js`.
4. **Pflichtfelder:** Beratung hat 7 und Produktanfrage 8 Pflichtfelder. Die Bibel sieht 4 für eine Anfrage vor. Die Schemas verlangen sie, und eine Lockerung braucht eine Absprache mit dem Backoffice (Frappe-Pflichtfelder).
5. **Backoffice Kontakt `500 {}`** (R1 P2-1) ist weiter ungeklärt. Bis dahin ist nicht sicher, dass Kontaktanfragen ankommen.
6. `ConsentEmbed` (Platzhalter noch im alten Stil mit Gold-Hover) und `UploadHandoff` (Radien und Schatten, gehört R2-upload) passen optisch noch nicht zum Neuauftritt.
7. **Mobile CTA-Leiste:** Sie überdeckt beim Scrollen bis zu 80 px unten. `focusField` zentriert das Feld, sodass der Fokus sichtbar bleibt. Das globale `scroll-padding-bottom: 80px` (Fundament Nr. 3) fehlt noch.
8. **Newsletter** (`components/Newsletter`, nicht mein Paket) sendet noch kein `_t`.

## Nachbesserung nach QA (feedback.md, Note 8/10)

Stand 26.10.2026 · Fix-Runde · alle POSTs abgefangen, nichts ging ans Backoffice.

| Punkt | Behebung |
|---|---|
| **P2-1 Daten in der URL** | Alle vier Formulare (Kontakt, Beratung, Produktanfrage, Adventsabend) tragen `method="post"`. Der Senden-Knopf ist im Server-HTML `disabled` und wird erst nach der Hydrierung frei (`useHydrated()` in `Forms/useFormGuard.js`, `useSyncExternalStore`, kein Effekt). Ein Absenden vor der Hydrierung ist damit nicht mehr möglich, auch nicht per Enter (implizites Absenden scheitert am gesperrten Standardknopf). Name, E-Mail und Nachricht können nicht mehr in einer URL landen. |
| **P2-2 Löschzusage Adventsabend** | `adventsabend/page.js` (Block „Ihre Daten“): Der Satz „nur für diesen Abend … löschen spätestens drei Monate danach“ ist entfernt. Dort steht jetzt nur der neutrale Hinweis wie in `FormPrivacyNote`. Der Import `LOESCHFRIST_LABEL` ist aus der Seite entfernt. Die Konstante in `event.js` bleibt (Checkliste für den Anwalt). Hinweis: Die Datei liegt außerhalb der Paket-Dateiliste, die Änderung ist auf diesen Satz beschränkt, da das Feedback sie ausdrücklich diesem Paket zuweist. |
| **P3-1 Serverfehler am Feld** | Ein 400 mit `field` zeigt jetzt „Bitte prüfen Sie dieses Feld.“ (`forms.field.check`, neu in DE/EN/FR/IT, auch in `messages-r2-leads.json`) statt „Bitte füllen Sie dieses Feld aus“. Der Fehler bleibt beim Verlassen des Feldes stehen, solange der Wert unverändert ist (`useServerFieldError()`). Der Knopf springt nicht mehr, der nächste Klick auf „Senden“ sendet. Gilt in allen vier Formularen. |
| **P3-2 Hover auf Fehlerrahmen** | `hover:border-ink` gilt nur noch für den normalen Rahmen (`FormField`, `RadioCards`). Geprüft: Fehlerfeld bleibt beim Überfahren `rgb(155, 44, 44)`. |

Offen bleiben die P3-Punkte 3 bis 7 aus dem Feedback (Begriff Merkliste/Wunschliste, deutsches Präfix in der Beratung, Bestandstext für Team 7, alte Optik von `ConsentEmbed`/`UploadHandoff`/Cookie-Banner, sowie die schon gelisteten offenen Punkte 3 bis 8 oben).

**Prüfung der Fix-Runde**

- `node --test tests/unit/forms*.test.mjs`: 35/35 grün (Gleichlauf Module ↔ `messages-r2-leads.json` inklusive `field.check`).
- `npx playwright test tests/e2e/forms-leads.spec.js --project=desktop`: 11/11 grün (eine Wiederholung durch Dev-Server-Last). Neu: Test „no data in the URL before hydration“ (Server-HTML von Kontakt, Beratung, Adventsabend: `method="post"`, Senden-Knopf `disabled`, keine Löschzusage). Erweitert: 400-Test prüft Feldtext, Fehler nach Blur und zweiten POST beim nächsten Klick.
- ESLint auf allen geänderten Dateien: 0 Fehler, 0 Warnungen.
- `node tools/qa/shoot.mjs qa-screenshots/teamleiter/r2-R2-leads/fix …` (5 Seiten × 4 Geräte): 20 × 200, kein Überlauf. Ein einmaliger Dev-Konsolenfehler auf Kontakt/Desktop (abgebrochener RSC-Prefetch) trat im Nachlauf `fix/nachlauf/` nicht mehr auf. Nach der Hydrierung ist der Senden-Knopf sichtbar aktiv (Screenshots gesichtet). Zustandsbild: `fix/state-kontakt-fehler-hover.png`.
