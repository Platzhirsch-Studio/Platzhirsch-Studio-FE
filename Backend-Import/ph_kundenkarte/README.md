# Platzhirsch Kundenkarte (`ph_kundenkarte`) – Stufe 1 ohne Geldwert

App Nr. 12 der PH-Familie (Frappe v15, v16-kompatibel). Konventionen: `Backend-Import/CONVENTIONS.md`.

**Inhaber-Entscheidung:** kein Bonusguthaben, keine Punkte mit Geldwert, kein Rabatt in Euro oder Prozent
(Insolvenz-/Steuerfrage offen). Vorteile sind **Leistungen**: Lieferung im Liefergebiet, Montage, Pflegetermin,
Vorab-Zugang zu Events/Adventsabend, Gruß zum Geburtstag, persönliche Beratung, verlängerte Umtauschfrist.
Umsätze werden **nur zur Einstufung** berechnet – und nur mit gesonderter Einwilligung zur Auswertung der Kaufhistorie.

## DocTypes (Modul PH Kundenkarte)

| DocType | Name | Zweck |
|---|---|---|
| PH Kundenkarte | `field:kartennummer` (`KK-7K3QX9`, `ph_core.utils.naming.referenz("KK")`) | Karte eines PH Kontakts: Status (Beantragt/Aktiv/Gesperrt/Gekuendigt + Endzustände Ersetzt/Uebertragen/Zusammengefuehrt), Sperrgrund-Katalog, Vorgänger-/Nachfolgekarte, Stufe, berechneter Umsatz, Wallet, Einwilligung, Berater, Geburtstag (freiwillig), interne Notizen (permlevel 1) |
| PH Kundenkarte Stufe | `field:stufenname` | Stammdaten: Reihenfolge, Schwelle (Cent), Farbe, Kundentext, Kindtabelle **PH Kundenkarte Stufe Vorteil** |
| PH Kundenkarte Vorteil | `PH-KKV-.YYYY.-.#####` | Katalog der Leistungsvorteile: Art, Limit je Kalenderjahr (0 = unbegrenzt), Mindeststufe, Texte – **kein Geldwert-Feld** |
| PH Kundenkarte Einloesung | `PH-KKE-.YYYY.-.#####` | Einlösung mit Bezug (Dynamic Link: PH Kassenbeleg, PH Bestellung, PH Rechnung, PH Serviceauftrag, PH Pflege Abo, PH Event), Storno nur per Status |
| PH Kundenkarte Antrag | `PH-KKA-.YYYY.-.#####` | Website-/Showroom-Antrag, zwei getrennte Einwilligungen, DOI-Token-Hash, Status Neu/Bestaetigt/Angenommen/Abgelehnt/Doppelt |
| PH Kundenkarte Einstellungen | Single | Startstufe, Bewertungszeitraum (12 Monate rollierend), Herabstufung, DOI, Wallet-Kennungen (nur Namen), Texte |
| PH Kundenkarte Ereignis | `hash`, `in_create` | Protokoll: Ausgestellt, Stufenwechsel, Sperrung, Entsperrung, Kündigung, Pass aktualisiert, Umsatz berechnet |

Custom Fields (Fixture, Präfix `ph_kundenkarte_`): **PH Kontakt** `ph_kundenkarte_karte` (Link, read_only) + `ph_kundenkarte_stufe`;
**PH Kassenbeleg** und **PH Bestellung** `ph_kundenkarte_kartennummer` (Data, Scan/Eingabe an Kassa bzw. Packtisch/Website).

### Status statt Workflow
Die Übergänge der Anträge (Annehmen legt PH Kontakt + PH Kundenkarte an) und der Karten (Sperren/Entsperren/Kündigen)
erzeugen Dokumente oder Protokolle; sie laufen deshalb als Dokumentmethoden mit Rollenprüfung, nicht als Workflow-Übergänge.
`status` ist überall read_only. Kanban `PH Kundenkarten Antraege` arbeitet direkt auf `status`.

## Logik

- `ph_kundenkarte/utils/*.py` – **ohne Frappe**, per `unittest` testbar: `stufen.py` (Stufe aus Umsatz, nächste Stufe,
  „fehlt noch“, Auf-/Herabstufung mit Bewertungszeitraum, Summen), `vorteile.py` (Limit je Jahr, Stufe, Zuordnung),
  `karte.py` (Kartennummer normalisieren/prüfen/maskieren), `antrag.py` (Pflichtfelder, DOI-Token, Maskierung),
  `wallet_payload.py` (Apple `pass.json`, Google LoyaltyObject/Class, JWT-Claims, Manifest).
- `ph_kundenkarte/ph_kundenkarte/umsatz.py` – Belege je Kontakt: PH Kassenbeleg (docstatus 1, Standard/Stornobeleg, kein
  Training, ohne Rechnungsbezug), PH Bestellung (Zahlung online, bezahlt oder später, `gesamt_cent − erstattet_cent`, Modus live),
  PH Rechnung (docstatus 1, nicht Storniert/Uneinbringlich, ohne Bestellbezug). Doppelzählung vermieden: Kassa-bezahlte
  Rechnungen zählen als Rechnung, Shop-Rechnungen als Bestellung, Vor-Ort-Zahlungen als Kassenbeleg. Jahresumsatz =
  rollierend `bewertungszeitraum_monate`. Aufstufung sofort, Herabstufung nur wenn erlaubt **und** die Stufe einen vollen
  Zeitraum gehalten wurde; `stufe_manuell` friert die Stufe ein. Ohne Einwilligung: keine Berechnung, Felder leer, Startstufe.
- `ereignisse.py` (doc_events): PH Kassenbeleg on_submit/on_cancel, PH Bestellung on_update (Statuswechsel), PH Rechnung
  on_submit/on_cancel → `frappe.enqueue(umsatz.karte_neu_berechnen)`; nie Ausnahmen.
- `tasks.py`: 03:30 Umsatz/Stufen aller aktiven Karten mit Einwilligung + unbestätigte Website-Anträge nach 30 Tagen schließen;
  08:00 Geburtstage heute → **PH Aufgabe** (ph_crm) für Berater (eine je Karte und Tag, kein Mailversand); 08:05 Karten „Beantragt“ > 7 Tage
  → Aufgabe „noch nicht übergeben“; 1. Dezember 08:10 ungenutzte limitierte Vorteile (Pflegetermin) → Aufgabe „anbieten“.
- `wallet.py`: Apple `.pkpass` (PKCS#7 über `cryptography`, optional), Google Save-URL (JWT RS256). Fehlende Kennungen,
  Zertifikate oder Paket → `ApiFehler("unavailable", 503)`. Bilder optional unter `public/wallet/icon.png`, `logo.png`.

## Buttons (Desk, Gruppe „Aktionen“)

- **PH Kundenkarte:** Vorteil einlösen (Dialog), Umsatz neu berechnen, Wallet-Pass erneuern, Karte sperren / entsperren
  (Leitung), Karte aktivieren (Beantragt), Karte kündigen; Drucken: Karte, Begrüßungsschreiben.
- **PH Kundenkarte Antrag:** Annehmen (Kontakt/Stufe wählbar), Ablehnen (Begründung), Doppelt, Kontakt suchen (maskiert).
- **PH Kundenkarte Einloesung:** Stornieren (Leitung oder einlösende Person am selben Tag).
- **PH Kundenkarte Stufe:** Vorteilsübersicht drucken.

## Kanban, Druck, Dashboard, Berichte

- Kanban `PH Kundenkarten Antraege` (Neu, Bestaetigt).
- Druckformate (Jinja, erben `templates/print/ph_basis.html`; Teilvorlagen in `templates/print/`): `PH Kundenkarte Karte`
  (85,6 × 54 mm, Vorder-/Rückseite, QR über `ph_qr_svg`, Kopf/Fuß der Basis per CSS ausgeblendet – damit keine Ausnahme von
  CONVENTIONS 9 nötig), `PH Kundenkarte Begruessung` (A4 mit Leistungen der Stufe), `PH Kundenkarte Vorteilsuebersicht` (A4, alle Stufen).
- Dashboard Charts: `PH Karten je Stufe`, `PH Neue Karten je Monat`, `PH Einloesungen je Vorteil`.
  Number Cards: `PH Aktive Kundenkarten`, `PH Offene Antraege`, `PH Einloesungen 30 Tage`.
- Script Reports: `PH Kundenwert`, `PH Stufenwechsel`, `PH Vorteile Nutzung` (nur Anzahl, kein Euro), `PH Karten ohne Einkauf 12 Monate`.
- Workspace `PH Kundenkarte` (sequence_id 12).

## API (`ph_kundenkarte.api`, Token `website@platzhirsch.studio`, Decorator `ph_api`)

Alle Methoden POST, Antworten flache dicts, Cent als Int, Zeiten ISO 8601, keine Klartext-E-Mail/Telefon.

| Methode | Parameter | Antwort | Fehler |
|---|---|---|---|
| `create_card_application(**d)` (idempotent) | `vorname, nachname, email, vertragsdaten_akzeptiert` (Pflicht); `anrede, telefon, plz, ort, sprache, interessen, geburtstag, nachricht, einwilligung_auswertung, einwilligung_textversion, einwilligung_newsletter, newsletter_textversion, bedingungen_version`, `utm_source, utm_medium, utm_campaign, utm_term, utm_content, klick_id` (nur mit Ads-Einwilligung; gespeichert am Antrag, Abschnitt „Kampagne (UTM)“, `klick_id` wird beim Anonymisieren geleert) | `{referenz, status, doi, doi_token, email_maskiert, bereits_vorhanden}` – **Website verschickt die DOI-Mail**: entweder mit `doi_token` (Backend-erzeugt) oder sie übergibt `confirm_hash` (SHA-256 ihres eigenen Link-Geheimnisses, dann `doi_token=None`); gespeichert wird nur der Hash. `idempotency_key` wird übernommen | `invalid` 400 (`field`), `conflict` 409 (Karte besteht) |
| `confirm_card_application(token)` **oder** `(antrag, confirm_hash)` | DOI-Token (Backend-erzeugt) oder Antragsnummer + SHA-256 des Website-Link-Geheimnisses | `{status: bestaetigt|bereits_bestaetigt|ungueltig|aktiv, referenz, kartennummer?}` – bei „Website-Anträge automatisch annehmen“ (Standard an) wird die Karte sofort ausgestellt und `status=aktiv` | `invalid_token` 404, `expired` 410 |
| `get_card_status(email)` | E-Mail | `{found, status: beantragt|bestaetigt|aktiv|gesperrt|keine}` | `invalid` 400 |
| `portal_card(kontakt, kunde_token)` | Portal-Zugang | `{found, kartennummer, status, stufe, stufe_text, stufe_farbe, stufe_seit, naechste_stufe, fehlt_noch_cent, jahresumsatz_cent (nur mit Einwilligung), vorteile[{vorteil, titel, art, beschreibung, einloesbar_pro_jahr, genutzt_im_jahr, verbleibend, verfuegbar}], einloesungen[], wallet{apple, google}}` | `invalid` 400, `not_found`/`invalid_token` 404, `unavailable` 503 |
| `portal_wallet_pass(kontakt, kunde_token, plattform)` | `apple` / `google` | apple: `{plattform, dateiname, mime, inhalt_base64}`; google: `{plattform, url}` | `invalid` 400, `not_found` 404, `unavailable` 503 |
| `lookup_card(kartennummer)` (Rolle PH Kassa Mitarbeiter / PH Kundenkarte Mitarbeiter) | Nummer, tolerant (`kk 7k3qx9`) | `{kartennummer, status, name, stufe, stufe_farbe, stufe_seit, vorteile[]}` – keine Kontaktdaten, kein Umsatz | `forbidden` 403, `invalid` 400, `not_found` 404 |
| `redeem_benefit(kartennummer, vorteil, bezug_doctype?, bezug?, kommentar?, ort?)` (idempotent per `idempotency_key` **und** je Karte+Vorteil+Bezug, gleiche Rollen) | – | `{referenz, vorteil, titel, verbleibend, bereits_eingeloest, kartennummer, weitergeleitet_von}` | 409 mit `card_pending`, `card_blocked`, `card_replaced`, `card_transferred`, `card_cancelled`, `benefit_inactive`, `tier_too_low`, `benefit_not_in_tier`, `limit_reached` |
| `cancel_redemption(referenz \| bezug_doctype+bezug, grund?)` (Kassa-Rollen) | Einlösung oder alle Einlösungen eines Belegs | `{storniert: [namen]}` | `forbidden` 403 (nicht eigene/heute, keine Leitung), `not_found` 404 |
| `hand_over_card(kartennummer, ort?)` (Kassa-Rollen) | beantragte Karte bei Übergabe aktivieren | `{kartennummer, status}` | `conflict` 409 (nicht beantragt) |

`lookup_card` liefert zusätzlich `code` (`ok`, `card_pending`, `card_blocked`, `card_replaced`, `card_transferred`, `card_cancelled`),
`hinweis` (Kiosk-Text aus dem Sperrgrund-Katalog) und `weitergeleitet_von`: eine zusammengeführte Dublette wird automatisch auf die
Hauptkarte geleitet; ersetzte/übertragene Karten **nicht** (alte Karte kann in fremder Hand sein). Bei `code ≠ ok` ist `vorteile` leer.
`KASSA_ROLLEN` umfasst jetzt auch PH Logistik Mitarbeiter/Leitung (Packtisch).

### Direkter Python-Aufruf aus ph_kassa (ohne Decorator, ohne Commit)

`ph_kundenkarte.ph_kundenkarte.kassa`: `karte_pruefen(kartennummer)`, `einloesen(kartennummer, vorteil, bezug_doctype=None, bezug=None,
kommentar=None, ort="Kassa")`, `einloesung_zuruecknehmen(referenz=None, bezug_doctype=None, bezug=None, grund=None)`,
`karte_uebergeben(kartennummer, ort="Kassa")` – gleiche Rückgaben wie die HTTP-Methoden, Fehler als `ph_core.api.ApiFehler` (`.code`).
Die HTTP-Methoden (`lookup_card`, `redeem_benefit`, `cancel_redemption`, `hand_over_card`) laufen mit `ph_api(intern=True)`:
Desk-Sitzung genügt, kein Website-Token, Website-Schalter `api_aktiv` greift nicht. Sie committen und setzen `frappe.local.response` –
deshalb aus fremdem Python-Code die Funktionen in `kassa.py` verwenden.

### Backoffice-Methoden (`ph_kundenkarte.api.backoffice`, Desk-/Next-Sitzung, Leitung)

`wallet_status()` · `umsatz_alle_neu_berechnen()` (enqueue long) · `stufenplan_vorschau(stufen?)` („n Karten würden auf-/absteigen“) ·
`stammdaten_anlegen()` · `dubletten_finden(limit)` · `sperrgruende()` (Katalog für Dialoge, alle Rollen) · `karten_zusammenfuehren(karten, nur_plan)`.
Dokumentmethoden PH Kundenkarte: `sperren(grund, sperrgrund_art)`, `ersatzkarte_ausstellen(sperrgrund_art, grund)`, `uebertragen(ziel_kontakt,
grund_art, grund, einwilligung_auswertung, einwilligung_textversion)` (Leitung), `zusammenfuehren_mit(andere_karte, nur_plan,
trotz_verschiedener_kontakte)` (Leitung), `karte_uebergeben(ort)`. PH Kundenkarte Antrag: `annehmen(kontakt, stufe, aktiv, sofort_aktiv)`.

`fehlt_noch_cent` ist die Differenz zur Schwelle der nächsten Stufe – ein Einstufungswert, kein Guthaben.

## Lebenszyklus (Sperrgrund, Ersatz, Übertragung, Dubletten) – Entscheidungen

Regeln ohne Frappe in `utils/kartenregeln.py` (Tests `tests/test_kartenregeln.py`), Datenbankteil in `ph_kundenkarte/lebenszyklus.py`.

- **Sperrgrund-Katalog** = Select `sperrgrund_art` (Verlust, Diebstahl, Beschaedigt, Missbrauch, Kundenwunsch, Dublette, Datenschutz,
  Verstorben, Sonstiges) + Freitext `sperrgrund`. Pflicht beim Sperren; „Sonstiges“ nur mit Text. Kein DocType: die Gründe steuern
  Programmlogik (Ersatzkarte vorschlagen, entsperrbar, Kiosk-Text) und dürfen nicht frei wachsen. Diebstahl/Dublette/Datenschutz/
  Verstorben sind endgültig (kein Entsperren). Alte Aufrufer `sperren(grund)` werden auf den Katalog abgebildet.
- **Ersatzkarte** (Verlust/Diebstahl/Beschädigung): neue Nummer, alle Daten (Stufe, Einwilligung, Berater, Umsatzfelder) übernommen,
  alte Karte → `Ersetzt` mit `nachfolger_karte`. Jahreslimits der Vorteile zählen über `vorgaenger_karte` weiter (`kette.py`).
- **Übertragen** (Leitung; Partner/Haushalt, Erbe, Firmennachfolge, Sonstiges): ebenfalls **neue Nummer** für die neue Person – die Karte
  ist personengebunden (Begrüßungstext), Plastikkarte und Wallet-Pass der bisherigen Person bleiben im Umlauf. Stufe bleibt, `stufe_seit`
  = heute (Herabstufung frühestens nach einem vollen Zeitraum). Einwilligung zur Auswertung und Umsätze gehen **nicht** über.
- **Zusammenführen** (Leitung oder automatisch nach Kontakt-Zusammenführung in ph_crm): Ziel = aktiv > gesperrt > beantragt, dann höhere
  Stufe, dann ältere Karte. Höhere Stufe (frühestes `stufe_seit`) und jüngste Einwilligungserklärung bleiben; Einlösungen werden umgehängt
  (`umgehaengt_von`), Ereignisse bleiben als Protokoll an der Quelle; Quelle → `Zusammengefuehrt` mit `zusammengefuehrt_in` (Kiosk leitet weiter).
- **Übergabe**: Showroom/Kassa-Antrag mit `sofort_aktiv=0` → Karte `Beantragt`; `karte_uebergeben`/`hand_over_card` aktiviert.
- **Storno**: Kassen-Stornobeleg (`storno_von`), Cancel eines Kassenbelegs/einer Rechnung, Bestellung `storniert` → Einlösungen mit diesem
  Bezug werden automatisch storniert (doc_events). Widerruf/Erstattung nach Lieferung lässt die Einlösung bestehen (Leistung erbracht).
- **Geburtstag ohne Jahr**: `geburtstag_tag_monat` (MM-TT) an Antrag und Karte; API akzeptiert `--MM-TT`; Aufgabe am 28.02. für 29.02.
- **Einwilligung/Widerruf** werden als Ereignis protokolliert.

## Hook-Vertrag Kundenakte (ph_crm)

`hooks.py`: `ph_kontakt_zeitleiste`, `ph_kontakt_zeitleiste_ersetzt`, `ph_kontakt_datenauskunft`, `ph_kontakt_anonymisieren`,
`ph_kontakt_zusammengefuehrt` → `ph_kundenkarte/kontakt.py`. Anonymisieren statt Löschen (kein Geldwert, keine BAO-Pflicht in dieser App):
Name, Geburtstag, Notizen, QR/Wallet, Kontaktdaten des Antrags, Nachweis-Datei, Ereignis-Hinweise werden entfernt; Karte → Gekuendigt
(Sperrgrund Datenschutz). Einwilligungszeitpunkt/-textversion bleiben ohne Personenbezug.

## Rollen

`PH Kundenkarte Mitarbeiter` (lesen, anlegen, bearbeiten, einlösen, sperren, Ersatzkarte), `PH Kundenkarte Leitung` (zusätzlich löschen, entsperren,
Annahme ohne DOI, Storno fremder Einlösungen, interne Notizen, übertragen, zusammenführen), `PH Kassa Mitarbeiter` (Karten lesen, einlösen,
Antrag anlegen/annehmen, Übergabe), `PH Logistik Mitarbeiter` (Packtisch: lookup/redeem), `PH Website Integration`
(API), `PH Geschäftsführung` (lesen). Rollen liegen in `ph_core/fixtures/role.json`.

## site_config-Schlüssel (nur Namen, Werte nie in Dateien)

`ph_wallet_apple_cert`, `ph_wallet_apple_key`, `ph_wallet_apple_wwdr` (optional), `ph_wallet_google_issuer_id`,
`ph_wallet_google_service_account` (JSON mit `client_email`, `private_key`). Pass Type ID, Team ID, Organisationsname,
Class-Suffix und Origins stehen in PH Kundenkarte Einstellungen.

## Rechtliche Leitplanken (umgesetzt)

- Einwilligung zur Kaufhistorien-Auswertung und Newsletter sind **zwei getrennte, optionale Checkboxen**; nur die
  Teilnahmebedingungen (Vertragsdaten) sind Pflicht. Widerruf der Auswertung leert die Umsatzfelder und setzt die Startstufe.
- Kundentexte in Stufe und Vorteil werden validiert: keine Euro-/Prozentangaben, kein „Rabatt/Bonus/Guthaben/Punkte“, keine Superlative; Sie-Form.
- Geburtstag nur freiwillig; Gruß als Aufgabe für den Berater, kein automatischer Versand.
- Lookup an Kassa/Packtisch liefert keine Kontaktdaten und keinen Umsatz.
- Einwilligungs-Nachweis in ph_marketing (PH Einwilligung) wird angelegt, sobald dort der Zweck `kundenkarte_auswertung`
  existiert (`frappe.db.exists`/`ZWECKE` geprüft) – **Wunsch an ph_marketing**, siehe Offene Punkte. Bis dahin ist der
  Nachweis der bestätigte Antrag (Textversion, Zeitpunkt, IP-Hash, DOI) plus Felder der Karte.

## Stufe 2 – Erweiterungspunkte (nicht gebaut)

Guthaben oder Rabatt in Euro/Prozent wären eine **verbindliche Zusage mit Geldwert**: Passivierung/Rückstellung,
umsatzsteuerliche Behandlung (Entgeltminderung vs. Gutschein, Mehrzweck-/Einzweckgutschein § 3 Abs 13 ff UStG),
Insolvenzrisiko für Kundenguthaben, Verjährung/Verfall, Preisangaben- und Lauterkeitsrecht; Kaufhistorien-Auswertung für
personalisierte Rabatte braucht eine eigene, vom Newsletter getrennte Einwilligung (Art. 7 DSGVO) und ggf. eine
Datenschutz-Folgenabschätzung (Profiling). Vor dem Bau: Kanzlei- und Steuerberater-Freigabe.
Technische Ansatzpunkte: eigener DocType `PH Kundenkarte Guthaben Buchung` (Cent, Bezug, Verfall) statt Felder an der Karte;
Vorteil-Art „Guthaben“ mit `wert_cent` **nicht** in PH Kundenkarte Vorteil einführen, sondern getrennt; Kassa/Shop bräuchten
eine Zahlart „Kundenguthaben“ (ph_kassa `PH Kassenbeleg Zahlung`, ph_shop Checkout) und RKSV-konforme Belegzeilen.

## Installation (Staging) und Tests

```bash
bench get-app ph_kundenkarte <pfad> && bench --site <site> install-app ph_kundenkarte   # after_install: Stufen, Vorteile, Einstellungen
bench --site <site> run-tests --app ph_kundenkarte
cd Backend-Import/ph_kundenkarte && PYTHONPATH=. python -m unittest discover -s ph_kundenkarte/tests -t .   # ohne Site
python -I Backend-Import/tools/check.py --streng && python -I Backend-Import/tools/contracts.py
```

Migrationshinweise: Custom Fields werden beim `migrate` angelegt; `PH Kundenkarte._kontakt_spiegeln` prüft `has_field`
und bleibt vor der Migration still. Bestehende Kunden erhalten Karten über Antrag (quelle showroom) oder direkt „Neue Karte“;
Umsatz historisch per Button „Umsatz neu berechnen“ bzw. nächtlich. Website: Formular ruft `create_card_application`,
mailt den DOI-Link (`/kundenkarte/bestaetigen?token=…` → `confirm_card_application`), Portal-Seite nutzt `portal_card`/`portal_wallet_pass`.

## Offene Punkte / Annahmen

- Schwellen der Stufen Plus (10.000 €) und Privé (50.000 €) im Bewertungszeitraum sind **Platzhalter** (`install.py`), Inhaber-Entscheidung offen; Stufennamen neutral, änderbar.
- ph_marketing: Zweck `kundenkarte_auswertung` in `PH Einwilligung.zweck` und `utils/regeln.ZWECKE` ergänzen (ohne DOI, Nachweis Antrag).
- Teilnahmebedingungen (Verbindlichkeit der Leistungen, Kündigung, Umtauschfrist, Liefergebiet) brauchen Kanzlei-Freigabe; Version in Einstellungen.
- Wallet: Apple-Pass-Bilder (`public/wallet/*.png`) und Web-Service für Push-Updates fehlen; Pässe werden beim Abruf neu gebaut.
- PH Rechnung hat kein Kartennummer-Feld (bewusst: Rechnungen hängen am Kontakt); Dashboard-Links der Karte zeigen Kassenbelege und Bestellungen über die Custom Fields.
- Kassa-Oberfläche (ph_kassa Page) muss `lookup_card`/`redeem_benefit` noch aufrufen (Scan-Feld `ph_kundenkarte_kartennummer` ist vorhanden).
- **Bedarf ph_kassa:** `page.beleg_buchen` soll `ph_kundenkarte_kartennummer` am Beleg setzen und vorgemerkte Vorteile nach dem Buchen mit
  `redeem_benefit(…, "PH Kassenbeleg", beleg)` einlösen; Kiosk-Codes `card_*` aus `lookup_card` anzeigen; Bonzeile „Kundenkarte: <Vorteil>“
  ohne Betrag; Stornobeleg muss `storno_von` setzen (vorhanden) – dann storniert ph_kundenkarte die Einlösungen selbst.
- **Bedarf ph_core:** `PH Kundenkarte Einloesung` in `api/suche.py BEREICHE["kundenkarte"]` (Aktivitätsstrom).
- **Bedarf ph_crm:** beim Zusammenführen von Kontakten `ph_kontakt_zusammengefuehrt(alt, neu)` aufrufen (Kontakt-Links dürfen vorher oder
  nachher umgehängt werden – der Hook hängt verbleibende Karten/Einlösungen/Anträge selbst um).
- Bewusst nicht: DOI-Mail erneut senden (Mailversand ist Website-Sache – Kundin stellt den Antrag erneut); Pass-Download/Mail aus dem
  Backoffice (Portal-only); Ersatzkarte mit gleicher Nummer (Sicherheit, s. Lebenszyklus).
