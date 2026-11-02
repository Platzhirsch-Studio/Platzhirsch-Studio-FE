# Teamleiter – Runde 1: Plan

Stand: 26.10.2026, Branch `feature/neuauftritt`. Es wird nicht committet, nicht gepusht und nicht deployt.

## 1. Lage (Monitor localhost:4545)

| Workflow | Status | Gesperrte Dateien (tabu für Runde 1) |
|---|---|---|
| platzhirsch-neuauftritt-bau | läuft (Fundament, danach 7 Bereiche und Integration) | `src/app/globals.css`, `src/app/[locale]/layout.js`, `src/components/ui/**`, `src/components/Brand/**`, `src/components/Reusable/**` (FadeInView, Footer, MobileCtaBar), `src/components/Navbar/**`, `src/app/[locale]/client-layout.js`, `src/app/[locale]/page.js`, `src/components/{Home,ProuductSectionHome,WhyChooseUsSectionHome}/**`, `src/components/{MarkenItems,MarkenClient}/**`, `src/app/[locale]/ueber-uns/**`, `src/app/[locale]/produkte/**`, `src/components/{ShopCatalog,CartPage}/**`, `src/components/Landing/**`, `src/components/{UberUns,Team,Partner,Presse,News,NewsItem,Karriere,Impressum,Datenschutz,Newsletter,NotFound,Beratung}/**` und deren page.js (news, impressum, datenschutz, beratung …), **`src/messages/*.json`**, **`src/lib/content/**`**, `Marktresearch/digital/redesign/**`, `qa-screenshots/neuauftritt/**` |
| platzhirsch-feature-teams | läuft (QA und Nachbessern) | `src/app/[locale]/{labs,portal,upload}/**`, `src/components/{Labs,Portal,Upload}/**`, `src/lib/{portal,upload,concierge}/**`, `src/app/api/{labs,portal,upload}/**`, `public/labs/**`, `src/components/{AnfrageFormProduct,BeratungClient,Kontakt}/**`, `Marktresearch/digital/features/**`, `qa-screenshots/<feature>/**` |
| platzhirsch-design-jury | läuft (Jury, danach Urteil) | `qa-screenshots/jury/**`, `src/app/[locale]/preview/**`, `src/components/Preview/**` (nur lesen) |
| platzhirsch-welle-0c | läuft (nur Audits) | `Marktresearch/daten/**`, `Marktresearch/marketing/**`; ändert keinen Code |

**Folgen:**
- Texte in `src/messages` kann diese Runde niemand ändern. Neue Seiten bekommen ihre Texte deshalb aus eigenen Datenmodulen (DE). EN/FR/IT folgen in einer späteren Runde nach der Integration.
- Labs-Features produktionsreif machen, Produktseite verdrahten, Marke × Kategorie als Route und alle Shell- und Design-Aufgaben warten auf das Ende der beiden Bau-Workflows. Bis dahin legt Runde 1 die Daten- und Logikschichten an, auf die diese Aufgaben in Runde 2 aufsetzen.
- Offene Abnahmen mit Auflagen: Outdoor 7,5/10 und Yacht 7/10. Beide hängen vor allem an fehlenden Fotos (Inhaber). Der Code liegt in `Landing/**` und ist gesperrt. Dreiländer, Handy-Upload und Sofaplaner werden gerade vom Feature-Team nachgebessert.

## 2. Pakete Runde 1 (alle Dateien exklusiv)

| ID | Paket | Wirkung | Dateien |
|---|---|---|---|
| R1-ratgeber | Ratgeber-Seiten `/de/ratgeber` + `/de/ratgeber/[slug]` (noindex bis Freigabe) | AP7, Content-Grundlage, KI-Sichtbarkeit | `src/app/[locale]/ratgeber/**`, `src/components/Ratgeber/**`, `src/content/ratgeber/**`, `src/lib/ratgeber/**`, `tests/unit/ratgeber*.test.mjs` |
| R1-produkttexte | Lokale Datenquelle für geprüfte Produkttexte | AP4 Nr. 3, Long-Tail | `src/content/productCopy/**`, `src/lib/productCopy/**`, `tests/unit/productCopy*.test.mjs` |
| R1-seo | Sitemap und llms.txt für neue Seiten, Doorway-Audit, Logik Marke × Kategorie, `/api/image` entfernen | AP0 Nr. 3, AP5, AP6 Nr. 1 | `src/lib/seo/sitemapEntries.js`, `src/lib/seo/sitemap/**`, `src/lib/seo/brandCategory*.js`, `src/lib/marken/brandCategory*.js`, `src/app/sitemap*.xml/**`, `src/app/llms.txt/**`, `src/app/robots.js`, `src/app/api/image/**`, `tests/unit/{sitemap,brandCategory}*.test.mjs` |
| R1-tests | Playwright-Smoke- und A11y-Tests, Test-Skripte (**darf installieren:** `@axe-core/playwright@4.13.0`) | Qualitätsnetz für alle Runden | `playwright.config.js`, `tests/e2e/**`, `tests/README.md`, `package.json`, `package-lock.json` |
| R1-legal | Claim-Guard, Claim- und NAP-Prüfskripte | AP0 Nr. 2, AP2, UWG | `src/lib/legal/**`, `tools/checks/**`, `tests/unit/{claims,nap}*.test.mjs` |
| R1-plattform | Fehlerseiten, `backofficeFetch` mit Timeout und Retry, Fehler-Logging | AP1 Nr. 1, 2 und 5 (ohne externen Dienst) | `src/app/[locale]/error.js`, `src/app/global-error.js`, `src/instrumentation.js`, `src/lib/api/**`, `tests/unit/http*.test.mjs` |
| R1-formulare | Härtung der Formular-APIs (zod, Honeypot, Zeitfalle, Rate-Limit, Größenlimit), abwärtskompatibel | AP3 Nr. 1, Spam- und Missbrauchsschutz | `src/app/api/{kontakt,beratung_anfrage,anfrage_produkt,newsletter_subscribe}/**`, `src/lib/forms/**`, `tests/unit/forms*.test.mjs` |
| R1-event | Adventsabend 26.11. fertig machen, `/bewerten` prüfen | AP3 Nr. 6, AP6 Nr. 4, Termin 26.11. | `src/app/[locale]/adventsabend/**`, `src/app/[locale]/bewerten/**`, `src/components/Event/**` |

**Schnittstellen zwischen den Paketen:**
- Formular-Vertrag (R1-formulare ↔ R1-event): Clients dürfen optional `website` (Honeypot, leer) und `_t` (Zeitstempel beim Rendern, ms) senden. Die Routen behandeln beide als optional und entfernen sie vor der Weiterleitung. Antwortformat und Statuscodes bleiben wie heute, weil Handy-Upload und Küchenplaner davon abhängen.
- Ratgeber → Sitemap: `src/lib/ratgeber/index.js` exportiert `getIndexableRatgeber()`. Die Funktion liefert `[]`, solange kein Artikel `freigegeben: true` hat. In Runde 2 wird sie an die Sitemap angeschlossen. Diese Runde nicht, denn heute gäbe sie nichts zurück.
- Unit-Tests laufen mit `node --test tests/unit` (Node 24, ohne neues Paket). Getestete Module importieren relativ und ohne `@/` und `server-only`. Andernfalls kapselt man die reine Logik in eine eigene Datei.
- Design: Die Bau-Agenten lesen zuerst `Marktresearch/digital/redesign/fundament.md`. Gibt es die Datei, importieren sie die Bausteine aus `src/components/ui/*` und ändern sie nicht. Gibt es sie nicht, bauen sie mit Tailwind und den Tokens der Bibel.

## 3. Bewusst nicht in Runde 1 (mit Grund)

- Gutscheine (AP9): Laut Beirat zuerst die Frage zum Kundengeld durch den Insolvenzrechtler klären.
- Atelierverkauf: Inventur und Preisregel fehlen (E5).
- Schweiz-Hub mit CHF-Rechner: Der Steuerberater muss die Texte freigeben, und die Rechner-Logik liegt beim Feature-Team in Arbeit.
- `setRequestLocale`/ISR (AP0 Nr. 4): betrifft gesperrte page.js-Dateien. Kommt in der Runde nach der Neuauftritt-Integration.
- Übersetzungen EN/FR/IT neuer Seiten: Die Messages sind gesperrt. Kommt in Runde 2 oder 3 als eigenes Paket, das die Messages allein besitzt.
- Performance-Audits: macht Welle 0c bereits.

## 4. Vorschau Runde 2 (sobald Neuauftritt und Feature-Teams fertig sind)

Produktseite: Produkttexte und FAQ verdrahten. Route Marke × Kategorie bauen. Ratgeber an Sitemap und llms.txt anschließen, sobald freigegeben. Labs: Fehlerfälle, Tests und Performance. Portal-Härtung. `setRequestLocale` in allen page.js. Übersetzungen. Die Smoke-Tests aus R1-tests laufen in jeder Runde als Abnahme-Netz.

## 5. Fragen an den Inhaber

Siehe die strukturierte Rückgabe `ownerQuestions` (gleiche Liste).

1. **Hausnummer:** Laut Firmenbuch Landstraße 11. Website, Footer und Schema nennen 9 (BEV: Studio 9, Café 11). Welche Nummer soll im Impressum stehen, welche in Schema und Google? R1-legal erstellt dazu die Liste aller Fundstellen.
2. **Kundengeld:** Bei negativem Eigenkapital zuerst einen Insolvenzrechtler fragen, ob Gutscheine und Anzahlungen angenommen werden dürfen. Bis dahin baut das Team keinen Gutschein-Shop.
3. **Rechtstexte** (`Marktresearch/recht/`) an den Anwalt geben. Impressum und Datenschutz werden erst nach der Freigabe ausgetauscht.
4. **Adventsabend 26.11.:** Uhrzeit, Programm und Kapazität bis 30.10. Ohne Uhrzeit bleibt die Seite `noindex` und hat kein Event-Schema.
5. **Stadtseiten (E15):** Welche der 13 sollen indexiert werden (Empfehlung: höchstens 8)? R1-seo liefert dazu das Doorway-Audit.
6. **Ratgeber-Freigabe:** Wer prüft fachlich die [prüfen]-Stellen und steht als Autor bzw. Prüfer namentlich darunter?
7. **Produkttexte:** Wer gibt die Eigentexte frei (Feld `approved`)?
8. **Deploy des Händler-Hotfix (R0):** Wann darf deployt werden? Live stehen weiterhin „Händler“-Texte.
9. **KI-Bots in robots.txt (E10)**, **Monitoring-Dienst (E11)**, **Termin-Werkzeug (E7)**, **WhatsApp (E8)**.
10. **Fotoshooting (E6):** Yacht- und Outdoor-Seiten bleiben ohne eigene Bilder bei 7 bis 7,5/10.
11. **Google-Bewertungslink** für `/bewerten` und die QR-Karte.
12. **Superlative (E12):** Gibt es einen Beleg, oder bleiben sie gestrichen?
