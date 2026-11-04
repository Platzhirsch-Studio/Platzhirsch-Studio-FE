# Platzhirsch Shop (`ph_shop`)

Website-Bestellungen, Reservierung/Abholung, Gutscheine, **gemeinsame Zahlungs-DocType PH Zahlung**, Stripe (Webhook, Ereignisse, Rückerstattung, Abgleich), Widerruf, Retoure. Arbeitspaket WP5 in `../PLAN.md`, Regeln in `../CONVENTIONS.md`. Voraussetzungen: `frappe`, `ph_core`, `ph_crm`, `ph_sortiment`. Python-Abhängigkeit: `stripe>=10,<13` (pyproject).

## DocTypes

| DocType | Zweck | Besonderheiten |
|---|---|---|
| **PH Zahlung** (46 Felder, submittable) | jede Geldbewegung aller Apps: Eingang/Ausgang/Erstattung über Stripe Checkout/Terminal/Link, Bar, Karte extern, Überweisung, Gutschein, Verrechnung | Bezahlt = submitted, kein Cancel – Korrektur nur per Gegenbuchung; Kind **PH Zahlung Erstattung**; Vier-Augen ab 1.000 € |
| **PH Bestellung** (94) | Shop-Bestellung/Reservierung, Statuswerte = Website (`offen … pruefen`) | Name = Website-Bestellnummer `PH-S-JJMMTT-XXXXXX` oder Serie; Kinder **Position**, **Steuer** (USt je Satz, OSS-Kennzeichen), **Verlauf** |
| **PH Gutschein** (49) | Mehrzweck-Wertgutschein, Code nur als SHA-256-Hash (wie `codes.js`), Restwert, unbefristet | Kind **PH Gutschein Einloesung**; Klartext nur bei Ausgabe; PDF mit Wortmarke |
| **PH Gutschein Bestellung** (47) | Kaufvorgang `G-XXXX-XXXX` (`voucherOrder.js`) | Kind **Code**; Codes entstehen erst nach bestätigter Zahlung |
| **PH Anzahlung** (38) | Zahlungslink `AZ-XXXX-XXXX` (`deposit.js`) | Kind **Doppelt** (zweite Zahlung → Button „Doppelte Zahlung erstatten“) |
| **PH Stripe Ereignis** (19) | Idempotenz/Audit des Webhooks | `event_id` = Name; Status empfangen/verarbeitet/ignoriert/fehler/wiederholt; Button „Erneut verarbeiten“ |
| **PH Stripe Auszahlung** (18) | Payout-Abgleich | Kind **Zahlung**; Button „Abgleichen“ (Differenz, Gebühren) |
| **PH Widerruf** (41) | § 11/13a FAGG, Fristen 14 Tage | Kind **Position**; Eingangsbestätigung, Retoure, Erstattung |
| **PH Retoure** (24) | Rücksendung/Rückgabe, Prüfung, Wertminderung | Kind **Position** |
| **PH Shop Einstellungen** (31, Single) | Modus, Fristen, Versandpauschalen, OSS-Schalter, Gutschein-Vorgaben, **Rechtstexte** (AGB, Widerrufsbelehrung, Gewährleistungs-Mitteilung) für die Bestellbestätigung | |
| **PH Stripe Einstellungen** (18, Single) | nur Schlüssel-**Namen**, Testmodus, **Simulation** (kein Netz), Webhook-Pfad, Ereignistypen, Vier-Augen-Grenze | |

## Zahlungen buchen – `ph_shop.zahlung` (für ph_faktura, ph_kassa)

```python
from ph_shop.zahlung import buche, erstatte, storniere, finde

zahlung = buche(
    kanal="Stripe Terminal",          # Stripe Checkout | Stripe Terminal | Stripe Link | Bar | Karte extern | Ueberweisung | Gutschein | Verrechnung
    betrag_cent=12990,                # int, Cent, > 0
    art="Eingang",                    # Eingang | Ausgang | Erstattung (Erstattungen über erstatte())
    bezug_doctype="PH Kassenbeleg", bezug="KB-2026-00012",   # Dynamic Link; auch PH Rechnung, PH Bestellung …
    waehrung="EUR", status="Bezahlt", # Angekuendigt | Bezahlt | Fehlgeschlagen; Bezahlt → submit
    zeitpunkt=None, kontakt=None,     # Datetime (Standard jetzt), PH Kontakt
    stripe_payment_intent=None, stripe_charge=None, stripe_session=None, stripe_balance_transaction=None,
    stripe_gebuehr_cent=0, stripe_ereignis=None, stripe_refund=None, livemode=None,
    zahlungsreferenz=None, bank_referenz=None, gutschein=None, notiz=None, ursprung=None,
    idempotency_key=None, quelle="kassa", submit=None,
)
zahlung.name            # PH-ZAH-2026-00001
zahlung.flags.bereits_gebucht   # True, wenn Payment Intent / Refund / idempotency_key schon gebucht war

gegen = erstatte(zahlung, 5000, "Kulanz", stripe_refund=None, von=None)   # Gegenbuchung (art Erstattung), setzt erstattet_cent/status
storniere(zahlung, "Grund")      # nur Angekuendigt (docstatus 0)
finde(stripe_payment_intent="pi_…")  # Name der gebuchten Zahlung oder None
```

Idempotenz: gleicher `stripe_payment_intent` (Eingang), gleicher `stripe_refund` (Erstattung) oder gleicher `idempotency_key` → vorhandenes Dokument, keine zweite Buchung. `buche` schreibt mit `ignore_permissions` (Serverfunktion); die Rechteprüfung macht der Aufrufer (Button, API, Webhook). Rückwärts-Links (`rechnung`, `kassenbeleg`) legen ph_faktura/ph_kassa als Custom Field auf PH Zahlung an.

Stripe-Refund selbst löst `PH Zahlung.rueckerstatten(betrag_cent, grund)` aus (Button „Rückerstatten“): `stripe_client.refund_erstellen` (simuliert bei `PH Stripe Einstellungen.simulation` oder in Tests) → `erstatte(...)` → Statusspiegel am Bezug (`erstattung_vermerken`). Über `vier_augen_ab_cent` (Standard 100000) nur mit Freigabe der Geschäftsführung (Status „Erstattung angefordert“, ToDo).

## Gutscheine einlösen – `ph_shop.gutschein` (für ph_kassa, ph_faktura)

```python
from ph_shop.gutschein import pruefen, einloesen, storniere_einloesung

pruefen("PH-ABCD-EFGH")   # Code oder Name → {gutschein, status, wert_cent, rest_cent, einloesbar, abgelaufen, gueltig_bis, test, letzte4, art}
r = einloesen(gutschein="PH-GS-2026-00001", betrag_cent=2500, kanal="Kassa",      # Showroom | Online | Kassa
              beleg_doctype="PH Kassenbeleg", beleg="SHOWROOM1-000012", kontakt=None,
              hinweis=None, idempotency_key="kassa:SHOWROOM1-000012:2", zahlung_buchen=False)
r["rest_cent"], r["status"], r["bereits_gebucht"]   # gleicher Beleg/Key → keine zweite Einlösung
storniere_einloesung(gutschein=…, beleg_doctype=…, beleg=…, grund="Stornobeleg")  # Restwert zurück, Gegenzeile in Einlösungen
```

`zahlung_buchen=False` ist der Normalfall für die Kassa (die PH Zahlung je Zahlart bucht der Kassenbeleg selbst); `True` legt zusätzlich eine PH Zahlung mit Kanal „Gutschein“ an. Die Fachregeln (Status, Gültigkeit, Testgutschein, Restwert) prüft `PHGutschein.pruefe_einloesbar`.

## Rechtstexte ↔ Website

`PH Shop Einstellungen` führt je Website-Slot aus `src/lib/shop/legal.js` ein Textfeld + Stand: `agb_text/agb_stand`, `widerrufsbelehrung_text/widerrufsbelehrung_stand` + `widerrufsformular_text`, `versandbedingungen_text/_stand`, `datenschutz_text/_stand`, dazu `gewaehrleistung_text` (Anhang II) und `rechtstexte_status` (kanzlei-offen | entwurf | freigegeben = `LEGAL_SLOT_STATUS`). Anhänge an die Bestellbestätigung entstehen nur bei `freigegeben` (`mails.rechtstext_anhaenge`); `PH Bestellung.agb_stand/widerrufsbelehrung_stand` halten den Stand zum Bestellzeitpunkt fest. Quelle der Texte bleibt `src/lib/shop/legalTexte.js` (Kanzlei-Freigabe).

## Stripe-Webhook

`POST https://<site>/api/method/ph_shop.api.stripe.webhook` – einzige Guest-Methode.
1. Rohbody (≤ 256 KB) + `Stripe-Signature` → `ph_shop/stripe_signatur.py` (HMAC-SHA256, `t=…,v1=…`, Toleranz 300 s, ohne Netz/Paket) → ungültig **400**.
2. `ph_shop/stripe_webhook.py verarbeite(event)`: **PH Stripe Ereignis** (event_id eindeutig; schon verarbeitet/ignoriert → „wiederholt“, nach „fehler“ erneuter Versuch), Livemode im Testmodus → ignoriert.
3. Zuordnung `metadata.art` + `order_id`/`deposit_id`/`client_reference_id`: `shop` → PH Bestellung, `gutschein` → PH Gutschein Bestellung, `anzahlung` → PH Anzahlung; fremde Arten (z. B. `kassa`) über Hook `ph_stripe_art_handler`.
4. Ereignisse: `checkout.session.completed`/`async_payment_succeeded` (paid → `zahlung_eingegangen`: PH Zahlung buchen + submit, Status bezahlt, Codes erzeugen, Mail; unpaid → zahlung_ausstehend), `async_payment_failed`, `expired`, `charge.refunded` (Gegenbuchung je Refund, Bestellung erstattet/teilerstattet, ungenutzte Gutscheine → Erstattet, teilgenutzt → Hinweis + Aufgabe), `payout.*` (PH Stripe Auszahlung), `charge.dispute.created` (ToDo Leitung). `payment_intent.*` nur über fremden Handler.
5. Antwort `{"received": true, "result": …}`; Verarbeitungsfehler → Ereignis „fehler“ + **500** (Stripe wiederholt).

Betragsabweichung Session ↔ Bestellung → Status `pruefen` + ToDo (Zahlung wird trotzdem gebucht; bei Gutschein-Bestellungen keine Codes).

## Buttons

- **PH Bestellung**: Zahlung erfassen (Bar/Karte extern/Überweisung/Terminal), Gutschein einlösen, Abholbereit melden (Abholcode + Mail), Abgeholt, Packen/Lieferschein (Hook `ph_shop_lieferschein_erstellen`), Versendet melden, Abschließen, Bestellbestätigung senden, Widerruf erfassen, Rechnung erstellen (Hook `ph_shop_rechnung_erstellen`), Stornieren & erstatten (Leitung), Stripe-Zahlung öffnen.
- **PH Zahlung**: Rückerstatten (Teil/Voll, Grund), Erstattung freigeben/ablehnen (GF), Beleg (PDF), Auszahlung zuordnen, In Stripe öffnen.
- **PH Gutschein**: Einlösung buchen (Betrag/Kanal/Beleg), Sperren/Entsperren (Leitung), Ersetzen (neuer Code, alter gesperrt), PDF senden.
- **PH Gutschein Bestellung**: Gutschein-Mail erneut senden, Erstatten. **PH Anzahlung**: Zahlungslink senden (braucht `ph_payments_link_secret`), Doppelte Zahlung erstatten.
- **PH Widerruf**: Eingangsbestätigung senden, Retoure anlegen, Ware erhalten, Erstatten, Ablehnen. **PH Retoure**: Ware eingegangen, Prüfung abschließen, Erstatten, Ablehnen.
- **PH Stripe Ereignis**: Erneut verarbeiten. **PH Stripe Auszahlung**: Abgleichen. **PH Stripe Einstellungen**: Schlüssel prüfen.

## Workflows, Kanban, Druck, Mails

- Workflow **PH Bestellung**: bezahlt → versandbereit (Packen) → versendet; bezahlt/reserviert → abholbereit → abgeholt; versendet/abgeholt → abgeschlossen; Stornieren/Widerruf erfassen/Zurück auf Offen (Leitung); pruefen → bezahlt (Leitung). Alles Geld-/Stripe-Getriebene setzt der Server (`ph_shop/ph_shop/status.py`, mit Verlaufszeile).
- Workflow **PH Gutschein**: Aktiv/Teilweise eingeloest → Gesperrt → zurück (Leitung); Einlösungsstände automatisch.
- Kanban: PH Bestellungen, PH Widerrufe, PH Retouren. Print Formats (ph_basis.html, Wortmarke): PH Bestellung Bestätigung, PH Gutschein, PH Zahlungsbeleg (auch Rückerstattungsbeleg), PH Widerruf Bestätigung, PH Retoure Begleitschein.
- Email Templates (Fixtures): PH Shop Bestellbestätigung (mit AGB/Widerrufsbelehrung aus PH Shop Einstellungen als Text + .txt-Anhang), Abholbereit, Zahlung fehlgeschlagen, Reservierung abgelaufen, PH Gutschein Versand (PDFs), PH Widerruf Eingangsbestätigung, PH Anzahlung erhalten/Zahlungslink, Teamhinweis. `shop_modus != live` → nur an `testmodus_mail_an` mit `[TEST]`.

## Reports, Charts, Cards

Reports: **PH Shop Umsatz** (Tag/Monat, Kanäle, Gebühren), **PH Shop Umsatz nach USt-Satz** (UVA-Zuarbeit, OSS getrennt), **PH Gutschein Bestand** (Restwert = Verbindlichkeit), **PH Rueckerstattungen**, **PH Stripe Abgleich** (Payouts vs. Zahlungen, Zahlungen ohne Auszahlung, in Stripe fehlend, Gebühren), **PH Bestellungen ohne Rechnung**.
Charts: Shop Umsatz je Woche, Bestellungen nach Lieferart, Gutscheinverkauf je Monat, Zahlungen nach Kanal, Erstattungen je Monat. Cards: Bestellungen heute, Zahlung ausstehend, Abholbereit, Offene Widerrufe, Umsatz Shop (Monat), Gutschein-Restwert, Stripe-Fehler (7 Tage). Workspace **PH Shop** (sequence 5). Für Charts/Cards gibt es read-only `*_eur`-Spiegelfelder; Rechenbasis bleiben die Cent-Felder.

## Website-API (`ph_shop.api`, Token `website@platzhirsch.studio`)

| Methode | Website-Quelle | Payload |
|---|---|---|
| `create_order(record)` | `shop/handlers.js` checkoutHandler | Datensatz unverändert (id, token, status, lieferart, zahlung, kunde{}, adresse{}, zeilen[], summen{}, versand{}, locale) → `{referenz, status}` |
| `attach_session(referenz, session, payment_intent, status?)` | nach `createCheckoutSession` | |
| `get_order(referenz, token)` | Bestätigungsseite `orderView` | ohne Personendaten außer Vorname |
| `order_event(referenz, typ|status, …)` | `shop/webhook.js` (bis M6) | spiegelt bezahlt/ausstehend/fehlgeschlagen/abgelaufen/erstattet/versandbereit |
| `get_pickup_status(referenz, abholcode)` | Abholung | |
| `create_voucher_order(record)` | `voucherOrder.js newVoucherOrder` | |
| `get_voucher(code)`, `redeem_voucher(code, betrag_cent, kanal, beleg)`, `block_voucher`, `replace_voucher` | `/api/payments/register` pruefen/einloesen/sperren/ersetzen | Hash-Vergleich, Fehler `conflict`/`expired` |
| `create_deposit(record)`, `get_deposit(id|auftrag|kunde)` | `deposit.js` | |
| `payment_event(event)` | `backoffice.js` Schema v1 | `{v, typ, zeit, referenz, art, betrag_cent, waehrung, zahlungsstatus, stripe{}, beleg?}` – alle heutigen Typen (`gutschein.bezahlt/pruefen/fehlgeschlagen/erstattet/teilerstattet/widerruf`, `anzahlung.bezahlt/pruefen/fehlgeschlagen/doppelt/doppelt_erstattet/…`) |
| `request_withdrawal(…)` | `api/shop/widerruf`, `api/payments/widerruf` | Felder beider Formulare; Zuordnung nur bei passender E-Mail |

Website-Umstellung: `PAYMENTS_BACKOFFICE=frappe`, `PAYMENTS_BACKOFFICE_METHOD=ph_shop.api.payment_event`, `FRAPPE_URL/FRAPPE_API_KEY/FRAPPE_API_SECRET`; Stripe-Dashboard: zweiten Webhook-Endpunkt auf Frappe mit eigenem Signaturgeheimnis (`ph_stripe_webhook_secret`). Beide Webhooks laufen parallel bis M6.

## Geheimnisse (nur `site_config.json`)

`ph_stripe_secret_key`, `ph_stripe_webhook_secret`, `ph_stripe_livemode`, `ph_stripe_terminal_location`; optional `ph_payments_link_secret` (= `PAYMENTS_LINK_SECRET` der Website, nur wenn Anzahlungs-Links aus dem Desk gesendet werden sollen; Anfrage in `../ANFRAGEN-AN-CORE.md`).

## Tests

```bash
cd Backend-Import/ph_shop && PYTHONPATH=. python -m unittest discover -s ph_shop/tests -t .   # Signatur, Codes, USt – ohne Site/Netz
bench --site <site> run-tests --app ph_shop                                                   # buche/erstatte, Webhook-Ablauf, Idempotenz, Gutschein, payment_event v1
python ../tools/check.py
```

Site-Tests laufen mit `frappe.flags.in_test` → Stripe-Simulation (kein Netz); Testschlüssel nur `whsec_mock_platzhirsch_*`.

## Offen

Wunschliste (PLAN) nicht gebaut; Checkout-Session-Erzeugung bleibt auf der Website; Lieferschein/Rechnung über Hooks von ph_logistik/ph_faktura; online verkaufte Gutscheine bleiben bis M6 im Website-Register (hier nur Bestellung + Zahlung); USt-Regeln Entwurf (Steuerberater); Rechtstexte in PH Shop Einstellungen eintragen.
