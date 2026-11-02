# Rechtstexte: Freigabe-Stand und Felder für den Inhaber

Stand 29.10.2026. Grundlage ist die Kanzlei-Freigabe aus Inhaber-Entscheidung Nr. 11. Den Status aller Texte führt `src/components/LegalDrafts/liveStatus.js`. Das Freigabe-Cockpit unter `/de/preview/freigaben#recht` zeigt ihn an.

## Status

| Text | Status | Datei |
|---|---|---|
| Impressum | freigegeben, live (`IMPRESSUM_LIVE_STATUS.lawyerApproved: true`) | `src/components/Impressum/impressum.js` |
| Datenschutz (inkl. Concierge, Upload, Portal, Mailversand, Bewerbungen) | freigegeben, live (`DATENSCHUTZ_LIVE_STATUS.lawyerApproved: true`, `MAIL_SERVICE.lawFirmConfirmed: true`) | `src/components/Datenschutz/datenschutz.js` |
| Datenschutz im Kundenportal (`/de/portal/datenschutz`) | freigegeben, live; Speicherfristen warten auf deine Bestätigung (`OWNER_CONFIRMED = false`) | `src/lib/portal/privacy.js` |
| Cookie-Banner und Einwilligung | freigegeben, live | `src/lib/legal/services.js`, `src/components/Cookies` |
| Gutscheinbedingungen | freigegeben, wartet auf 7 Angaben. `TERMS_STATUS` bleibt `"entwurf"`, die Seite liefert 404 | `src/lib/commerce/voucherTerms.js` |
| Widerrufsbelehrung Gutscheine | freigegeben, wartet auf den Firmenwortlaut. `WITHDRAWAL_STATUS` bleibt `"entwurf"` | `src/lib/commerce/withdrawalText.js` |
| AGB | freigegeben, keine Live-Seite (die Website verkauft nichts online) | `src/components/LegalDrafts/docs/agb.js` |
| Barrierefreiheitserklärung | freigegeben, keine Live-Seite | `src/components/LegalDrafts/docs/barrierefreiheit.js` |

Den Abschnitt zur Online-Zahlung (Stripe) gibt es auf `/datenschutz` erst, wenn die Kaufstrecke live ist. Der Text dazu steht im Kanzlei-Entwurf unter 5.12.

## Was du noch wörtlich einträgst (nichts wird geschätzt)

Solange ein Feld leer ist, fehlt nur die zugehörige Zeile. Ein Platzhalter erscheint nie.

1. **WKO-Auszug**: In `src/components/Impressum/impressum.js` unter `CHAMBER` eintragen: `chamber` (die Kammer, so wie sie im Auszug steht), `groups` (die Fachgruppen laut Auszug), `source` („WKO Firmen A–Z, Auszug vom …“) und `checkedAt` (JJJJ-MM-TT).
2. **Blattlinie**: in derselben Datei unter `BLATTLINIE` eintragen. `text` übernimmst du wörtlich aus dem freigegebenen Dokument, ohne „Blattlinie:“ davor. Dazu kommen `source` und `checkedAt`. Der Vorschlag im Kanzlei-Entwurf gilt nicht automatisch als freigegebener Wortlaut.
3. **Gutscheinbedingungen**: Die 7 Felder stehen in `src/lib/commerce/voucherTermsFields.js` (`TERMS_OWNER_FIELDS`):
   - Aussteller (Firmenwortlaut, FN, Gericht, UID)
   - Einzweck- oder Mehrzweckgutschein (auch `VOUCHER_TAX`)
   - Gültigkeit (auch `VOUCHER_VALIDITY`)
   - Einlösung online
   - Café-Variante
   - Kombinierbarkeit von Aktionsgutscheinen
   - Schlichtungsstelle nach § 19 AStG

   Danach müssen die Absätze in `voucherTerms.js` ohne eckige Klammern stehen. Erst dann wird `TERMS_STATUS = "freigegeben"` gesetzt.
4. **Widerruf**: Der Firmenwortlaut der ausgebenden Gesellschaft entspricht Feld 1. Danach wird `WITHDRAWAL_STATUS = "freigegeben"` gesetzt.
5. **Datenschutz, vor dem Livegang**:
   - AV-Verträge ablegen (Anthropic, Resend, Hoster). Concierge-Schlüssel und Mailversand erst danach in Frappe/Server einschalten
   - Mail-Dienst: Bleibt es nicht bei Resend, müssen `MAIL_SERVICE` und der Abschnitt „E-Mail-Versand“ vorher angepasst und von der Kanzlei bestätigt werden
   - Kundenportal: Speicherfristen und Empfänger in `src/lib/portal/privacy.js` bestätigen, dann `OWNER_CONFIRMED = true`
   - Upload-Löschfrist bestätigen, dann `UPLOAD_CONFIG.retentionConfirmed = true`
   - 7 Monate für Bewerbungen bestätigen, dann `APPLICATION_RETENTION.ownerConfirmed = true`
   - Google-Ads-Abschnitt erst mit Ads-Kennung freischalten
6. **AGB und Barrierefreiheit**: Die Unternehmensangaben aus der Vorschau (`/de/preview/recht/agb`, `/de/preview/recht/barrierefreiheit`) brauchst du erst, wenn online verkauft wird.
