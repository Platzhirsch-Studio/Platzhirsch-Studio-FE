# Online-Zahlung mit Stripe: Gutscheine und Anzahlungen

**Stand:** 28.10.2026 · Branch `feature/neuauftritt` · **Status:** fertig vorbereitet, **nicht aktiv**

Der Code ist komplett vorbereitet. Nach der Registrierung bei Stripe müssen **nur Umgebungsvariablen gesetzt** und der Server neu gestartet werden. Ohne Schlüssel bleibt alles wie heute: Gutscheine und Anzahlungen laufen per Anfrage und Rechnung.

---

## 1. Was gebaut ist

| Teil | Was passiert | Wo |
|---|---|---|
| **Gutschein online kaufen** | Kundin wählt Wert (Vorschläge 50 bis 1.000 € oder eigener Betrag ab 25 €), Stückzahl (online 1 bis 10, höchstens 5.000 € je Bestellung), Motiv und Widmung. Danach geht es zur Bezahlseite von Stripe. Nach **bestätigter** Zahlung entsteht der Gutscheincode und das PDF geht per E-Mail an sie. | `/de/gutscheine` |
| **Anzahlung** | Mitarbeitende legen zu einer Auftrags- oder Angebotsnummer einen Zahlungslink an. Die Kundin zahlt über den Link (Portal oder E-Mail). Das Backoffice bekommt die Belegdaten als Ereignis. | `/api/payments/anzahlung`, `/de/zahlung/anzahlung/<link>` |
| **Webhook** | Stripe meldet Zahlungen, Lastschrift-Ergebnisse, Abläufe und Erstattungen. Die Signatur wird geprüft, jedes Ereignis zählt nur einmal. | `/api/stripe/webhook` |
| **Gutscheinregister** | Gutschein an der Kasse prüfen, (teil)einlösen, sperren, ersetzen. | `/api/payments/register` |
| **Vertrag widerrufen** | Widerrufsfunktion nach § 13a FAGG (seit 01.10.2026 Pflicht bei Online-Verträgen) mit sofortiger Eingangsbestätigung per E-Mail. | `/de/zahlung/widerruf` |
| **Erfolg / Abbruch** | Rücksprungseiten nach der Bezahlseite, noindex. | `/de/zahlung/erfolg`, `/de/zahlung/abbruch` |
| **Mock** | Simulierte Bezahlseite für Tests, ohne Stripe und ohne Geld. Nie in Produktion. | `/de/zahlung/mock` |

Kartendaten erreichen den Server nie. Stripe Checkout ist eine gehostete Seite von Stripe (PCI-DSS liegt bei Stripe, für uns reicht der Fragebogen SAQ A).

### Schalter

| Variable | Werte | Wirkung |
|---|---|---|
| `VOUCHER_MODE` | `off` · `anfrage` · `stripe` | `stripe` wirkt nur, wenn **alle** Bedingungen erfüllt sind: Gutscheinbedingungen freigegeben (`TERMS_STATUS` in `src/lib/commerce/voucherTerms.js`), Widerrufsbelehrung freigegeben (`WITHDRAWAL_STATUS` in `src/lib/commerce/withdrawalText.js`), `STRIPE_SECRET_KEY` und `STRIPE_WEBHOOK_SECRET` gesetzt, die Inhaberfragen 2 und 3 entschieden (`VOUCHER_TAX`, `VOUCHER_VALIDITY` in `voucherTerms.js`, siehe Freigabe-Checkliste in Abschnitt 8) und **in Produktion ein echter Mail-Anbieter** (`PAYMENTS_MAIL_*`). Fehlt etwas davon, gilt `anfrage`. Sind die Bedingungen Entwurf, gilt `off`. |
| `ANZAHLUNG_MODE` | `off` · `anfrage` · `stripe` | `stripe` wirkt nur mit Stripe-Schlüsseln, `PAYMENTS_ADMIN_SECRET` und (in Produktion) `PAYMENTS_LINK_SECRET` und Mail-Anbieter. Sonst `anfrage`, also Anzahlung per Rechnung wie bisher. |

Im Modus `stripe` bleibt die Gutschein-**Anfrage** für Firmengeschenke und größere Mengen unter dem Kaufformular erhalten.

---

## 2. Schritt für Schritt: Stripe-Konto für die GmbH

Dauer: etwa 30 bis 60 Minuten, die Prüfung durch Stripe meist 1 bis 3 Werktage.

### 2.1 Vorher bereitlegen

- **Firmenwortlaut** der Gesellschaft, die verkauft und die Gutscheine ausgibt (laut Inhaber-Entscheidung Nr. 10 noch zu bestätigen, Rechtspaket W14). Konto **auf diese Gesellschaft** eröffnen, nicht auf eine Privatperson und nicht auf die Café-Gesellschaft.
- **Firmenbuchnummer** (FN) und Firmenbuchgericht
- **UID-Nummer** (ATU…)
- **Geschäftsadresse:** Landstraße 11, 6911 Lochau
- **IBAN** des Firmenkontos für die Auszahlungen
- **Geschäftsführung:** Name, Geburtsdatum, Privatadresse, **Lichtbildausweis** (Reisepass oder Personalausweis, Foto beider Seiten). Stripe fragt nach Personen mit mehr als 25 % Anteil (wirtschaftliche Eigentümer). Bei Holding-Strukturen auch diese.
- **Telefonnummer** für SMS-Bestätigung (Zwei-Faktor-Anmeldung, Pflicht)
- **Website-URL** `https://platzhirsch.studio` mit erreichbarem **Impressum, AGB, Datenschutzerklärung, Gutscheinbedingungen und Widerrufsbelehrung**. Stripe prüft die Seite. Fehlen diese Texte, verzögert sich die Freischaltung.
- **Branche:** Einzelhandel Möbel/Einrichtung (MCC 5712). Produktbeschreibung zum Beispiel: „Einrichtungshaus mit Showroom in Lochau. Online: Wertgutscheine und Anzahlungen auf Einrichtungsaufträge.“
- **Abrechnungsbezeichnung** auf dem Kontoauszug der Kundschaft: `PLATZHIRSCH` (max. 22 Zeichen)

### 2.2 Registrierung

1. Auf `https://dashboard.stripe.com/register` mit einer **Firmen-E-Mail** registrieren (nicht privat, z. B. `buchhaltung@platzhirsch.studio`).
2. Land **Österreich**, Unternehmensart **Kapitalgesellschaft (GmbH)**.
3. Firmen- und Personendaten eingeben, Ausweis hochladen, IBAN hinterlegen.
4. **Weitere Nutzer** einladen statt Zugang zu teilen: Einstellungen → Team. Rollen: Inhaber „Administrator“, Buchhaltung „Analyst“ bzw. „Nur Ansicht“, Showroom „Support“ (darf erstatten, sieht keine Schlüssel).
5. Zwei-Faktor-Anmeldung für alle aktivieren.

### 2.3 Zahlungsarten aktivieren (nichts im Code, alles im Dashboard)

Einstellungen → **Zahlungsmethoden**. Der Code übergibt bewusst **keine** Liste von Zahlungsarten: Stripe zeigt jeder Kundin die passenden aus diesem Dashboard an.

| Zahlungsart | Empfehlung | Hinweis |
|---|---|---|
| Karte (Visa, Mastercard) | an | Standard |
| Apple Pay, Google Pay | an | Für Apple Pay die Domain `platzhirsch.studio` unter „Zahlungsmethoden-Domains“ hinzufügen |
| EPS | an | Österreichische Online-Überweisung, sofort bestätigt |
| SEPA-Lastschrift | optional | Bestätigung dauert **mehrere Werktage**. Der Gutschein kommt erst danach (der Code wartet auf `async_payment_succeeded`). Fehlgeschlagene Lastschrift kostet 3,50 €. |
| Klarna | optional | Teurer (siehe Gebühren) |
| TWINT (Schweiz) | optional | **TWINT verarbeitet nur Schweizer Franken.** Unsere Preise sind in Euro, deshalb erscheint TWINT nur, wenn Stripe der Kundin den Preis in CHF anzeigt („Adaptive Pricing“, Einstellungen → Zahlungen). Im Testmodus mit einer Schweizer Adresse prüfen. Ohne Adaptive Pricing zahlen Kundinnen aus der Schweiz mit Karte, Apple Pay oder Google Pay. |

Optional: Eine eigene **Zahlungsmethoden-Konfiguration** (`pmc_…`) nur für die Website anlegen und als `STRIPE_PAYMENT_METHOD_CONFIGURATION` setzen. Ohne die Variable gilt die Standard-Konfiguration.

### 2.4 Einstellungen im Dashboard

- **Branding** (Einstellungen → Branding): Logo, Farbe `#30373e`, damit die Bezahlseite zu uns passt.
- **Öffentliche Unternehmensdaten:** Support-E-Mail `info@platzhirsch.studio`, Telefon `+43 5574 46255`, Links zu AGB, Datenschutz, Widerrufsbelehrung.
- **E-Mail-Belege** an Kundschaft für erfolgreiche Zahlungen und Erstattungen einschalten (Einstellungen → Kunden-E-Mails). Das ist der Zahlungsbeleg. **Die Rechnung** kommt wie bisher aus der Buchhaltung bzw. dem Backoffice (siehe Abschnitt 6).
- **Rechnungen von Stripe** (kostenpflichtige Funktion „Rechnung nach Zahlung“) sind im Code vorbereitet, aber aus: nur mit `STRIPE_INVOICE_CREATION=1` und Rücksprache mit dem Steuerberater.

### 2.5 Webhook eintragen

Entwicklerbereich → **Webhooks** → Endpunkt hinzufügen:

- **URL:** `https://platzhirsch.studio/api/stripe/webhook`
- **API-Version:** `2026-08-26.dahlia` (dieselbe wie im Code, `src/lib/payments/gateway.js`)
- **Ereignisse:** genau diese fünf
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `checkout.session.expired`
  - `charge.refunded`
- Nach dem Speichern das **Signaturgeheimnis** (`whsec_…`) kopieren → `STRIPE_WEBHOOK_SECRET`.

Testmodus und Livemodus haben **getrennte** Webhooks und getrennte Geheimnisse. Den Endpunkt in beiden Modi anlegen.

### 2.6 Schlüssel

Entwicklerbereich → **API-Schlüssel**. Empfohlen: **eingeschränkter Schlüssel** (`rk_live_…`) mit nur diesen Rechten:

- Checkout Sessions: **Schreiben**
- alle anderen: **keine**

Der veröffentlichbare Schlüssel (`pk_…`) wird **nicht** gebraucht (gehostete Bezahlseite).

---

## 3. Umgebungsvariablen

Gesetzt werden sie auf dem Server in der Umgebung des pm2-Prozesses (`ecosystem.config.js` → `env`, oder eine `.env.production.local` auf dem Server, die nicht im Repo liegt). **Nie** in Git, nie mit `NEXT_PUBLIC_`-Präfix. Nach jeder Änderung: `pm2 restart Platzhirsch-Studio-Website` (kein neuer Build nötig).

| Variable | Pflicht | Beispiel / Format | Zweck |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | ja | `rk_live_…` oder `sk_live_…` | Checkout-Sessions anlegen |
| `STRIPE_WEBHOOK_SECRET` | ja | `whsec_…` | Signatur der Stripe-Ereignisse prüfen |
| `VOUCHER_MODE` | ja | `stripe` | Online-Kauf von Gutscheinen |
| `ANZAHLUNG_MODE` | für Anzahlungen | `stripe` | Zahlungslinks für Anzahlungen |
| `PAYMENTS_ADMIN_SECRET` | für Anzahlungen und Register | zufällig, mind. 32 Zeichen | Zugang der Mitarbeitenden |
| `PAYMENTS_LINK_SECRET` | für Anzahlungen | zufällig, mind. 32 Zeichen | signiert die Anzahlungs-Links. Wechsel macht alle offenen Links ungültig |
| `STRIPE_PAYMENT_METHOD_CONFIGURATION` | nein | `pmc_…` | eigene Zahlungsarten-Konfiguration |
| `PAYMENTS_BASE_URL` | nein | `https://platzhirsch.studio` | Rücksprung-Adresse (Standard: diese) |
| `PAYMENTS_DATA_DIR` | empfohlen | `/var/lib/platzhirsch/payments` | Ablage außerhalb des App-Ordners, damit ein Deploy sie nicht löscht |
| `PAYMENTS_MAIL_PROVIDER` | **ja, in Produktion** | `resend` | Echter Mailversand. **Ohne diese drei Variablen wirkt `stripe` in Produktion nicht** (Rückfall `anfrage`), und der Postausgang ist dort gesperrt: Mails werden nicht auf die Platte geschrieben, die Bestellung zeigt Mail „fehlgeschlagen“. Nur in der Entwicklung landen Mails im Postausgang-Ordner |
| `PAYMENTS_MAIL_API_KEY`, `PAYMENTS_MAIL_FROM` | **ja, in Produktion** | `re_…`, `Platzhirsch Home Living <gutscheine@platzhirsch.studio>` | Absender-Domain bei Resend verifizieren (SPF/DKIM) |
| `PAYMENTS_TEAM_EMAIL` | nein | `info@platzhirsch.studio` (Standard) | Empfänger interner Hinweise, z. B. doppelte Anzahlung |
| `PAYMENTS_BACKOFFICE` | nein | `frappe` | **vorbereitet, aus**: Belegdaten ans Backoffice |
| `PAYMENTS_BACKOFFICE_LIVE` | nein | `1` | erst setzen, wenn die Backoffice-Methode existiert (siehe 6.3) |
| `PAYMENTS_ALLOW_TEST_KEYS` | nein | `1` | Testschlüssel auch auf dem Produktionsserver (nur für einen Probelauf) |
| `PAYMENTS_MOCK` | nein | `1` | simulierte Bezahlseite, **wirkt nie in Produktion** |
| `STRIPE_INVOICE_CREATION` | nein | `1` | Stripe-Rechnung nach Zahlung (kostet extra, Steuerberater) |

Geheimnis erzeugen: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`

---

## 4. Testmodus zuerst

1. Im Dashboard oben auf **Testmodus** schalten, Test-Schlüssel (`sk_test_…`) und Test-Webhook (`whsec_…`) holen.
2. **Lokal** testen (empfohlen): in `.env.local` `STRIPE_SECRET_KEY=sk_test_…`, `VOUCHER_MODE=stripe` und für den Webhook die Stripe-CLI:
   `stripe listen --forward-to localhost:3000/api/stripe/webhook` → das angezeigte `whsec_…` als `STRIPE_WEBHOOK_SECRET`. Dev-Server neu starten.
   (Die Gutscheinbedingungen müssen dafür freigegeben sein. Ohne Freigabe zeigt `/de/gutscheine?zahlung=mock` die Strecke im Mock.)
3. **Testkarten** (Stripe-Dokumentation „Testing“):
   - erfolgreich: `4242 4242 4242 4242`, beliebiges künftiges Datum, beliebige CVC
   - 3-D-Secure verlangt: `4000 0000 0000 3220`
   - abgelehnt: `4000 0000 0000 0002`
   - SEPA-Lastschrift erfolgreich: IBAN `AT61 1904 3002 3457 3201`, fehlgeschlagen: `AT86 1904 3002 3547 3202` (Quelle: docs.stripe.com/testing)
4. Prüfen: Erfolgsseite zeigt „Danke, die Zahlung ist angekommen“, im Postausgang liegt die Mail mit PDF (Testgutscheine tragen „TEST-“ und sind nicht einlösbar), im Dashboard ist die Zahlung sichtbar, Erstattung im Dashboard sperrt den Gutschein.
5. Erst dann **Live-Schlüssel** und **Live-Webhook** eintragen. Auf dem Produktionsserver werden Testschlüssel ohne `PAYMENTS_ALLOW_TEST_KEYS=1` ignoriert (Rückfall auf Anfrage).

---

## 5. Gebühren (grob)

Quelle: stripe.com/at/pricing und stripe.com/at/pricing/local-payment-methods, abgerufen am 28.10.2026. Keine Grund- oder Monatsgebühr.

| Zahlungsart | Gebühr je erfolgreicher Zahlung |
|---|---|
| Karten aus dem EWR (Standard), auch Apple/Google Pay | 1,5 % + 0,25 € |
| Premium-Karten aus dem EWR | 2,8 % + 0,25 € |
| Karten aus Großbritannien | 2,5 % + 0,25 € |
| Karten außerhalb des EWR (z. B. Schweiz) | 3,15 % + 0,25 € |
| Währungsumrechnung (z. B. CHF) | zusätzlich 2 % |
| EPS | 1,6 % + 0,25 € |
| SEPA-Lastschrift | 0,35 € (fehlgeschlagen 3,50 €, angefochten 15 €) |
| Klarna | ab 2,99 % + 0,35 € |
| TWINT | 2,6 % + 0,25 € (+ 2 % Umrechnung) |
| Rückbuchung (Dispute) | 20 € |

Beispiel: Gutschein 100 € mit EWR-Karte → 1,75 € Gebühr. Anzahlung 5.000 € mit EPS → 80,25 €.
**Bei Erstattung bekommt man die Gebühr nicht zurück.** Für hohe Anzahlungen ist eine Überweisung auf Rechnung günstiger; der Link ist ein Angebot, kein Muss.

---

## 6. Betriebsablauf

### 6.1 Anzahlungs-Link anlegen

Mit einem Werkzeug wie `curl` oder einem kleinen Formular im Backoffice (Einbau später):

```bash
curl -X POST https://platzhirsch.studio/api/payments/anzahlung \
  -H "Authorization: Bearer $PAYMENTS_ADMIN_SECRET" -H "Content-Type: application/json" \
  -d '{"auftrag":"A-2026-0142","betrag":"1.250,00","beschreibung":"Sofa, 30 % Anzahlung","email":"kundin@example.com","kunde":"CUST-0001","gueltig_tage":14,"senden":true}'
```

Antwort: `link` (für Portal, Mail oder WhatsApp), `anzahlung.id`. `senden: true` schickt den Link per Mail. `kunde` ist die Portal-Kundennummer.
Status abfragen: `GET /api/payments/anzahlung?auftrag=A-2026-0142` (gleicher Header).
Der Link gilt `gueltig_tage` lang (1 bis 60, Standard 14). Bezahlte Links lassen sich nicht noch einmal bezahlen.

**Doppelte Anzahlung:** Startet die Kundin eine neue Bezahlseite, beendet der Server vorher die alte (Stripe `expire`). Lässt sich die alte nicht mehr beenden, weil sie gerade bezahlt wird, entsteht keine neue. Wird trotzdem eine zweite Session bezahlt (z. B. zwei Tabs), bleibt die Anzahlung „bezahlt“, die zweite Zahlung steht unter `doppelt`, das Backoffice bekommt das Ereignis `anzahlung.doppelt`, und an `PAYMENTS_TEAM_EMAIL` geht ein Hinweis mit der Zahlungs-Id. **Dann im Stripe-Dashboard genau diese Zahlung erstatten** und die Kundin kurz informieren. Die Erstattung wird als `anzahlung.doppelt_erstattet` vermerkt, die eigentliche Anzahlung bleibt bezahlt.

### 6.2 Gutschein im Showroom einlösen

```bash
# prüfen
curl -X POST https://platzhirsch.studio/api/payments/register -H "Authorization: Bearer $PAYMENTS_ADMIN_SECRET" \
  -H "Content-Type: application/json" -d '{"aktion":"pruefen","code":"PH-XXXX-XXXX-XXXX-XXXX"}'
# 60 € einlösen, mit Belegnummer der Kasse
  -d '{"aktion":"einloesen","code":"PH-…","betrag":"60","beleg":"K-2026-1234"}'
```

Antwort zeigt Restguthaben und Status (`aktiv`, `eingeloest`, `gesperrt`, `ersetzt`, `test`). Teileinlösung ist möglich, der Rest bleibt erhalten (Gutscheinbedingungen Punkt 5).
**Verloren?** `{"aktion":"ersetzen","code":"PH-…","grund":"verloren"}` sperrt den alten Code und schickt der Käuferin einen neuen mit dem Restwert.
Codes stehen im Register nur als Hash. Wer die Datei liest, kann keine Gutscheine einlösen.

**Vorschlag für später:** eine kleine Kassen-Seite im Portal mit Mitarbeitenden-Rolle statt `curl`. Einbaupunkt: `authorizeAdmin` in `src/lib/payments/admin.js` kann zusätzlich eine Portal-Sitzung mit Rolle „team“ zulassen. Das Portal hat heute keine Rollen.

### 6.3 Erstattung

1. Im Stripe-Dashboard die Zahlung öffnen → **Erstatten** (ganz oder teilweise).
2. Stripe meldet `charge.refunded`. Bei voller Erstattung werden alle noch **nicht eingelösten** Gutscheine der Bestellung automatisch gesperrt. Wurde schon etwas eingelöst, steht im Register „prüfen“ und das Team entscheidet.
3. Die Stornorechnung erstellt die Buchhaltung wie gewohnt.

### 6.4 Widerruf

Kundinnen widerrufen über `/de/zahlung/widerruf` („Vertrag widerrufen“), per E-Mail oder Brief. Die Seite bestätigt sofort per E-Mail mit Eingangsnummer, Datum und Uhrzeit (§ 13a FAGG) und sperrt nicht eingelöste Codes, wenn E-Mail und Bestellnummer zusammenpassen. Das Team erstattet dann **binnen 14 Tagen** im Stripe-Dashboard (6.3).
Passen E-Mail und Bestellnummer **nicht** zusammen, enthält die Bestätigung nur Eingangsnummer, Datum und Uhrzeit, ohne Namen, Freitext oder Angaben aus dem Formular (Schutz vor Missbrauch als Mail-Relay). Der volle Inhalt steht in der Ablage (`withdrawals`), das Team ordnet ihn zu. Je Empfängeradresse gehen höchstens 3 solcher Bestätigungen in 24 Stunden hinaus.
**Der Integrator muss den Link „Vertrag widerrufen“ in den Footer setzen**, sobald Online-Verkauf läuft (die Funktion muss während der ganzen Frist leicht auffindbar sein). Die Seite bleibt 30 Tage nach der letzten echten Bestellung erreichbar, auch wenn der Verkauf ausgeschaltet wird.

### 6.5 Belegdaten für das Backoffice

Jede Zahlung, Erstattung, Einlösung und jeder Widerruf erzeugt ein Ereignis (Schema v1, `src/lib/payments/backoffice.js`):
`typ`, `zeit`, `referenz` (Bestell- oder Auftragsnummer), `betrag_cent`, `waehrung`, `zahlungsstatus`, Stripe-Ids, bei Zahlungen `beleg` (Name, Firma, Adresse für die Rechnung). Keine E-Mail-Adresse.

- **Heute:** Ablage als JSON in `<PAYMENTS_DATA_DIR>/backoffice-events/`. Die Buchhaltung kann daraus Rechnungen schreiben.
- **Vorbereitet:** Frappe-Adapter. Das Backoffice ist produktiv, deshalb sendet er erst, wenn dort die Methode `platzhirsch_studio.api.payment_event` gebaut ist **und** `PAYMENTS_BACKOFFICE=frappe` **und** `PAYMENTS_BACKOFFICE_LIVE=1` gesetzt sind. Bis dahin schreibt er nur einen Probelauf in denselben Ordner.

### 6.6 E-Mails

In der **Entwicklung** gehen alle Mails (Gutschein-PDF, Anzahlungs-Link, Bestätigungen, Lastschrift fehlgeschlagen, Widerruf, Team-Hinweise) nur in den **Postausgang** `<PAYMENTS_DATA_DIR>/outbox/<Zeit>/` (mail.txt, mail.html, PDF). In **Produktion** ist der Postausgang gesperrt: Ohne Resend-Konto, verifizierte Absender-Domain und die drei Variablen aus Abschnitt 3 bleibt `stripe` automatisch auf `anfrage`, und es liegen keine Codes oder PDFs ungeschützt auf dem Server. Schlägt ein Versand fehl, zeigt die Erfolgsseite das an („noch nicht verschickt“) statt „PDF unterwegs“.

### 6.7 Datensicherung und Aufbewahrung

`PAYMENTS_DATA_DIR` enthält Bestellungen, Register, Ereignisse und Widerrufe. In die tägliche Server-Sicherung aufnehmen. Aufbewahrung: Buchhaltungsunterlagen 7 Jahre (§ 132 BAO). Das Register muss bestehen bleiben, solange Gutscheine einlösbar sind. Die Datenschutzerklärung um „Zahlungsabwicklung durch Stripe Payments Europe Ltd., Irland“ ergänzen (Auftragsverarbeitung bzw. eigenständige Verantwortung laut Stripe-DPA) **[anwaltlich prüfen]**.

---

## 7. Sicherheit

- **Keine Kartendaten bei uns:** gehostete Bezahlseite von Stripe.
- **Preise nur vom Server:** Betrag und Stückzahl werden auf dem Server geprüft (zod-Allowlist), der Preis kommt nie aus dem Browser. Beim Webhook wird der bezahlte Betrag mit der Bestellung verglichen. Bei Abweichung gibt es keinen Code, sondern Status „prüfen“.
- **Webhook:** Rohtext + Signaturprüfung mit `STRIPE_WEBHOOK_SECRET` (300 s Toleranz), max. 256 KB, Idempotenz über die Event-Id. Ohne Schlüssel antwortet der Endpunkt mit 404.
- **Gutscheincode erst nach bestätigter Zahlung**, kryptografisch zufällig (80 bit, `crypto.randomBytes`), eindeutig geprüft, im Register nur als SHA-256-Hash.
- **Testzahlungen** (livemode false) erzeugen „TEST-“-Codes, die nicht einlösbar sind.
- **Geheimnisse nur auf dem Server:** Das Stripe-Paket wird nur in `src/lib/payments/gateway.js` geladen, der Einstieg `server.js` trägt `server-only`. Ein Test (`tests/unit/stripe-bundle.test.mjs`) prüft, dass keine Client-Komponente die Zahlungsdateien erreicht und kein Schlüssel in den gebauten Browser-Dateien steht (`.next/dev/static` des Dev-Servers und `.next/static` eines Builds, nur Dateien neuer als `package.json`).
- **Admin-Zugang:** Bearer-Geheimnis (mind. 32 Zeichen, zeitkonstanter Vergleich), nach 10 Fehlversuchen je IP 10 Minuten gesperrt. Nur über HTTPS verwenden, nicht in Chats oder E-Mails teilen.
- **Anzahlungs-Links:** HMAC-signiert, nichts Geheimes gespeichert, Betrag aus der Ablage. Eine Link-Vorschau im Mailprogramm löst nichts aus, erst der Klick auf „Anzahlung bezahlen“.
- **Herkunftsprüfung:** Browser-Anfragen nur von der eigenen Seite (Origin), Rate-Limit, Honeypot und Zeitfalle wie bei allen Formularen.
- **Logs ohne Personendaten:** nur Ereignistyp, Event-Id, Bestellnummer und Hash-Bezüge, nie Name, E-Mail, Adresse oder Code.
- **Mock** (`PAYMENTS_MOCK`, `?zahlung=mock`, Kopfzeile `x-payments-mock`) ist in Produktion immer aus.

---

## 8. Recht (umgesetzt, teils noch zu prüfen)

- **Button-Lösung** (§ 8 Abs 2 FAGG, § 312j Abs 3 BGB): Schaltfläche „Zahlungspflichtig kaufen“. Direkt darüber die Zusammenfassung: Wert, Stückzahl, Zustellung 0 €, **Gesamtpreis** (USt-Zusatz je nach Einzweck/Mehrzweck, siehe Checkliste).
- **Bestätigung** der Gutscheinbedingungen und Kenntnis der Widerrufsbelehrung als Checkbox, **nicht vorangekreuzt**, beide verlinkt. Zeitpunkt und Textstand werden mit der Bestellung gespeichert.
- **Widerrufsbelehrung** auf der Gutschein-Seite vor dem Kauf, Muster-Formular, Funktion „Vertrag widerrufen“ (§ 13a FAGG).
- **Rechnung/Beleg-Hinweis** im Formular, in der Mail und auf der Erfolgsseite.
- **Offen [anwaltlich prüfen]:**
  1. Widerrufsbelehrung (`src/lib/commerce/withdrawalText.js`) ist **Entwurf**: Fristbeginn „ab Erhalt“ und Erlöschen bei Einlösung, Firmenwortlaut. Danach `WITHDRAWAL_STATUS = "freigegeben"`.
  2. Kommt der Vertrag mit „Zahlungspflichtig kaufen“ auf unserer Seite zustande? Auf der Stripe-Seite steht danach „Bezahlen“ (Hinweistext dort: Gutschein nach Zahlung als PDF).
  3. **[Steuerberater]** Einzweck- oder Mehrzweckgutschein: entscheidet, ob beim Verkauf USt auf der Rechnung steht. Die Texte hängen an `VOUCHER_TAX` (siehe Checkliste), nichts steht fest im Code.

### Freigabe-Checkliste vor `VOUCHER_MODE=stripe`

In `src/lib/commerce/voucherTerms.js` gemeinsam setzen (ein Commit, mit der Freigabe):

| Konstante | Werte | Wirkung auf der Seite |
|---|---|---|
| `TERMS_STATUS` | `"freigegeben"` | Seiten und Bedingungen öffentlich |
| `VOUCHER_TAX` (Frage 2) | `"einzweck"` → „Gesamtpreis inkl. USt“ · `"mehrzweck"` → „Gesamtpreis“ + „Die Umsatzsteuer wird bei der Einlösung berechnet.“ | Formular und Erfolgsseite |
| `VOUCHER_VALIDITY` (Frage 3) | `"unbefristet"` → „Gültig ohne Ablaufdatum“ · `"30_jahre"` → „Einlösbar innerhalb der gesetzlichen Frist von 30 Jahren“ | PDF, Mail, Gutschein-Seite |
| Abschnitt 3 der Bedingungen | Text passend zu `VOUCHER_VALIDITY` | Gutscheinbedingungen |
| `WITHDRAWAL_STATUS` (`withdrawalText.js`) | `"freigegeben"` | Online-Kauf |

Solange `VOUCHER_TAX` oder `VOUCHER_VALIDITY` `null` ist, bleibt `stripe` auf `anfrage`, und die Texte sind neutral („Gesamtpreis“, „Gültigkeit laut Gutscheinbedingungen“). Anzahlungen zeigen weiter „inkl. USt“: Sie sind mit dem Zahlungseingang umsatzsteuerpflichtig, unabhängig von der Gutscheinfrage.
- Die 7 offenen Punkte der Gutscheinbedingungen (Inhaber-Entscheidung Nr. 10) gelten unverändert.

---

## 9. Portal: Einbaupunkt (Vorschlag, nicht gebaut)

Das Portal-Team kann offene Anzahlungen der eingeloggten Kundin anzeigen:

```js
import { depositsForCustomer } from "@/lib/payments/server";
import PaymentLinkCard from "@/components/Payments/PaymentLinkCard";
const deposits = await depositsForCustomer(portal.customer.id); // [] wenn keine
{deposits.map((d) => <PaymentLinkCard key={d.id} {...d} />)}
```

Ort: z. B. `src/app/[locale]/portal/projekte/[id]/page.js`. Voraussetzung: Beim Anlegen der Anzahlung `kunde` = Portal-Kundennummer.

---

## 10. Für Entwickler

- Code: `src/lib/payments/` (config, gateway, handlers, webhook, voucherOrder, deposit, register, withdrawal, store, mailer, backoffice, pdf, codes, server), Schalter in `src/lib/commerce/mode.js`.
- Routen: `src/app/api/payments/**`, `src/app/api/stripe/webhook`, Seiten `src/app/[locale]/zahlung/**`.
- **Stripe-SDK:** npm-Paket `stripe` **22.6.2**, exakt gepinnt. Begründung: am 28.10.2026 49 Tage alt (veröffentlicht 09.09.2026), letzte Patch-Version der stabilen 22er-Reihe. 23.0.1 ist erst 6 Tage alt, 23.0.0 ist ein Major-Sprung ohne Patch-Erfahrung. Keine Abhängigkeiten. API-Version `2026-08-26.dahlia` ist im Code fest eingestellt.
- Tests: `node --test tests/unit/stripe-payments.test.mjs tests/unit/stripe-bundle.test.mjs`, Playwright `PW_WORKERS=1 npx playwright test tests/e2e/stripe-payments.spec.js --project=desktop`.
- **Mock im laufenden Dev-Server** (ohne Neustart): `http://localhost:3000/de/gutscheine?zahlung=mock` → Formular → simulierte Bezahlseite → Erfolgsseite. Das Formular schickt dabei `x-payments-mock: 1`. Ablage in `.data/payments/` (gitignored), Mails in `.data/payments/outbox/`. Für Anzahlungen im Mock: `ANZAHLUNG_MODE=stripe`, `PAYMENTS_MOCK=1`, `PAYMENTS_ADMIN_SECRET` setzen und neu starten.
- Vorschau aller Zustände: `/de/preview/commerce#online-kauf`.
- Textvorschläge für die Übersetzung: `Marktresearch/digital/features/stripe-messages-vorschlag.json`.
