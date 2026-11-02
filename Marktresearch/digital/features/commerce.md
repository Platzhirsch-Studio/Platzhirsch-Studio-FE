# Commerce Welle 1: Gutscheine und Atelierverkauf (AP9, hinter Schalter)

Stand: 26.10.2026, Paket R5-commerce, Branch `feature/neuauftritt`. **Nichts ist live. Es wird kein Geld angenommen.**

## Schalter (Umgebungsvariablen)

| Variable | Werte | Wirkung |
|---|---|---|
| `VOUCHER_MODE` | `off` (Standard) · `anfrage` | `off`: `/de/gutscheine`, `/de/gutscheinbedingungen`, `/api/gutschein_anfrage` liefern 404. `anfrage`: Anfrageformular, Text an das Kontakt-Backoffice. **Wirkt erst, wenn `TERMS_STATUS` in `voucherTerms.js` "freigegeben" ist**, im Entwurf gilt immer `off` |
| `ATELIER_MODE` | `off` (Standard) · `anfrage` | `off`: `/de/atelierverkauf`, `/de/atelierverkauf/<slug>`, `/api/atelier_reservierung` liefern 404. `anfrage`: Liste aus dem Sheet, Reservierungsanfrage |
| `ATELIER_CSV_URL` | `https://…` (veröffentlichter Tab als CSV) | ohne Wert: Leerzustand, keine Anfrage ans Sheet |
| `COMMERCE_PREVIEW` | `1` | Vorschau `/de/preview/commerce` auch in einem Produktions-Build (nie bei `VERCEL_ENV=production`). In der Entwicklung immer sichtbar |

Jeder andere Wert gilt als `off`, auch `stripe_link`: Stripe ist in Welle 1 nicht gebaut. Die Werte werden pro Anfrage gelesen (`connection()`). Eine Änderung braucht also einen Neustart, aber keinen Build. Nur Deutsch, andere Sprachen 404. Kein Eintrag in Navigation, Sitemap oder `llms.txt`, das ergänzt der Integrator nach Freigabe.

**Einschalten erst nach:** Insolvenz-/Gesellschaftsrechtler (Kundengeld, Rechtspaket 0.1), Kanzlei (Aussteller W14, Widerrufsbelehrung W5), Steuerberater (Einzweck/Mehrzweck, Café W15). Atelier zusätzlich nach Inventur und Sheet (E5).

## Gutschein-Anfrage

- Betrag ab 25 € (ganze Euro, technische Obergrenze 5.000 € je Gutschein), Vorschläge 50/100/250/500/1.000 €, eigener Betrag, Stückzahl 1–100, Motiv (Seelicht, Geweih, Schlicht: Namen für die PDF-Vorlage des Teams), Name auf dem Gutschein, Grußtext (300 Zeichen), Firma, Kontakt, Anmerkung.
- `POST /api/gutschein_anfrage` → `guardForm` (Rate-Limit, Größe 12 KB, Honeypot, Zeitfalle, zod-Allowlist) → Payload im Format von `/api/kontakt` (`name, company, email_address, telefon, ihre_nachricht`) an das bestehende Kontakt-Backoffice. Alle Gutschein-Angaben stehen als Text, die erste Zeile lautet „keine Bestellung, keine Zahlung“.
- Der Herkunftsblock und `lead_ref` kommen nur aus `src/lib/forms/leadPayload.js` und `attribution.js`, damit gilt dieselbe Einwilligungsgrenze. `lead_ref` geht nicht ans Backoffice.
- Bestätigung: „Wir melden uns persönlich … Mit dieser Anfrage ist nichts bestellt und nichts zu bezahlen.“ Sie enthält keine Frist, keine Rechnung, keine Zahlung und kein „abgesichert“.
- Event: `trackLead("gutschein", { transaction_id })`.

## Gutscheinbedingungen (Entwurf)

`src/lib/commerce/voucherTerms.js`, Seite `noindex`, solange `TERMS_STATUS = "entwurf"`. Der Entwurf regelt: unbefristet (W3), Teileinlösung mit Restguthaben ohne Gebühren, keine Barablöse (mit gesetzlichen Ausnahmen) und 14 Tage Rücktritt beim Kauf auf Distanz (W5). Er enthält keinen OS-Link (W4). Offene Stellen sind markiert (`[anwaltlich prüfen]`, `[Steuerberater]`, `[vom Unternehmen auszufüllen]`) und auf der Seite hervorgehoben.

## Atelierverkauf

- **Quelle:** `atelierSource.js` liest `ATELIER_CSV_URL` (`revalidate: 3600`, Tag `atelier`, 8 s Timeout). CSV-Spalten: `slug, titel, marke, kategorie, preis_eur, zustand, masse, status, foto_url, foto_alt, uvp_eur, uvp_stand, uvp_quelle, ausstellung_von, ausstellung_bis, hersteller, preis_gueltig_bis`.
- **zod je Zeile.** Fehlerhafte Zeilen werden übersprungen und protokolliert (`[atelier] Zeile N übersprungen (feld: grund)`, ohne Inhalte). Übersprungen wird bei ungültigem Preis, fehlender Zustandsbeschreibung, UVP ohne Stand/Quelle, Foto ohne Bildbeschreibung, Foto nicht unter `/atelier/` (keine fremden Hosts), doppeltem slug und verbotenen Wörtern („statt“, %, Rabatt, „bis zu“, „wie neu“, „neuwertig“, „abgesichert“, „nur noch“).
- **Sichtbar** ist nur `status = verfuegbar`. Reservierte und verkaufte Stücke verschwinden mit der Revalidierung. Fällt das Sheet aus, gilt die zuletzt gute Version des Prozesses, sonst der Leerzustand.
- **Preisregeln** (`priceRules.js`): „1.290 €“ plus Pflichtzusätze „inkl. USt · zzgl. Lieferung nach Aufwand · Standort: Showroom Lochau“. Es gibt keine Streichpreise. Die UVP erscheint nur mit Betrag, Stand und Quelle als sachliche Zeile, ohne Differenz und ohne Prozent. Ein 30-Tage-Tiefstpreis wird nicht erzeugt, weil keine Historie vorliegt.
- **Reservierungsanfrage** `POST /api/atelier_reservierung`: Das Stück muss im Sheet verfügbar sein, Titel und Preis setzt der Server. Abholung oder Lieferung, Wunsch auf Besichtigung. Text: „noch nicht reserviert, nichts zu bezahlen“. Kein Online-Vertrag, keine Anzahlung.
- **Detailseite:** Hinweis auf die gesonderte Zustimmung zur Zustandsbeschreibung (§ 6 Abs 1 S 2 VGG), 2 Jahre Gewährleistung (W7) und keine Händler-Formulierung („Ausstellungsstück aus unserem Showroom in Lochau“).
- **JSON-LD** `Product` + `Offer` (`offerSchema.js`) gibt es nur für Sheet-Daten mit Status `verfuegbar` und gültigem Preis. Ohne `aggregateRating` und ohne `itemCondition`, weil die Einordnung „gebraucht“ bei Ausstellungsstücken offen ist [anwaltlich prüfen].
- **Testdaten** stehen nur in `tests/unit/r5-commerce.test.mjs`, nie auf der Seite.

## Vorschau

`/de/preview/commerce` (`noindex, nofollow`) zeigt das Banner „Entwurf, Freigabe Insolvenzrechtler/Steuerberater offen“ mit dem aktuellen Stand der Schalter. Darunter folgen beide Strecken mit Demo-Formularen (senden nichts), der Bedingungen-Entwurf, der Atelier-Leerzustand bzw. echte Sheet-Daten und die offenen Punkte.

## Dateien

`src/lib/commerce/{mode,priceRules,atelierSource,offerSchema,voucher,voucherConfig,reservation,reservationConfig,voucherTerms,handlers,client}.js`, `src/components/Gutschein/{VoucherSection,VoucherForm,VoucherTerms}.js`, `src/components/Atelier/{AtelierIntro,AtelierList,AtelierPhoto,AtelierPrice,AtelierDetail,ReservationForm}.js`, Seiten unter `src/app/[locale]/{gutscheine,gutscheinbedingungen,atelierverkauf,atelierverkauf/[slug],preview/commerce}/page.js`, Routen `src/app/api/{gutschein_anfrage,atelier_reservierung}/route.js`. Tests: `tests/unit/r5-commerce.test.mjs`, `tests/e2e/r5-commerce.spec.js`.
