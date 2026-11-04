# Anfragen an ph_core

Je App ein Abschnitt, nur anhängen (PLAN.md, Abschnitt 5). **Status je Wunsch vom Core-Agenten (04.11.2026):** ✅ erledigt · ⚠️ erledigt mit Befund (INTEGRATION-BEFUNDE-CORE.md) · ↪ an andere App weitergereicht · ✗ abgelehnt (mit Grund).

## ph_kassa (WP10a, 04.11.2026)

- ✅ Nummernkreise `"PH DEP Export": "PH-DEP-.YYYY.-.####"`, `"PH Kassa Ereignis": "PH-KEV-.YYYY.-.#####"` eingetragen. `PH Kassenbeleg` ohne Serie (Controller-autoname) ist im Register als Kommentar dokumentiert; check.py verlangt dafür keine Serie.

## ph_kassa (WP10b – Oberfläche)

- ✅ `"PH Kassenabschluss": "KA-.YYYY.-.#####"`, `"PH Kassenbuch": "KB-.YYYY.-.#####"` eingetragen.
- ⚠️ QR-Bibliothek: **pyqrcode** ist die gemeinsame Bibliothek (kommt mit Frappe, `frappe/twofactor.py`); ph_core liefert `ph_qr_svg(text, mm)` als Jinja-Helfer mit Rückfall auf `qrcode`. ph_kassa darf `qrcode` für PNG im RKSV-Bon behalten (bleibt in `ph_kassa/pyproject.toml`); für SVG in Druckformaten kann `ph_qr_svg` genutzt werden. Keine Core-Abhängigkeit auf `qrcode`.

## ph_personal (WP8, 04.11.2026)

1. ✅ `PH Bewerbungsgespraech`, `PH Mitarbeiter`, `PH Zeiterfassung` (`PH-ZEIT-.YYYY.-.######`), `PH Abwesenheit` eingetragen. ⚠️ `PH Zeiterfassung` existiert auch in ph_projekte (Serie `#####`) – Besitzer laut PLAN WP8 ist ph_personal; ph_projekte muss umbenennen (Befund).
2. ✅ `ph_core.utils.website.revalidate(pfad | [pfade], sofort=False, grund="")`: POST `<ph_website_revalidate_url>/revalidate/<pfad>`, Header `X-Revalidate-Secret` (genau die Variante, die `src/lib/revalidateAuth.js` prüft), Drosselung je Pfad (PH Einstellungen `website_revalidate_drossel_sekunden`, Standard 30 s), `frappe.enqueue(..., enqueue_after_commit=True)`, Schalter `website_revalidate_aktiv`, Secret-Name konfigurierbar (`website_revalidate_secret_name`). Gültige Pfade: karriere, marken, news, produkte, team. ph_personal kann `ph_personal/website.py` auf `revalidate("karriere")` umstellen (Befund).
3. ✅ `ph_core.utils.feiertage`: `feiertage(jahr, bundesland="Vorarlberg", mit_betriebsruhe=True, zusaetzlich=…)`, `gesetzliche_feiertage(jahr)` (13 nach ARG, für Soll/Zuschläge), `ist_feiertag`, `ist_arbeitstag`, `arbeitstage(von, bis)`, `arbeitstage_addieren(d, n)`, `naechster_arbeitstag`; mit Site: `feiertage_site(jahr)`, `ist_geschlossen(d)`, `arbeitstage_site`, `arbeitstage_addieren_site` (Bundesland + Tabelle „Betriebsruhe“ aus PH Einstellungen, Kindtabelle `PH Betriebsruhe`). Kein eigener Jahres-DocType nötig: `logik.arbeitstage(feiertage=feiertage_site(jahr))` passt direkt.
4. ⚠️ `PH Storniert`, `PH Abgelehnt`, `Stornieren`, `Genehmigen`, `Ablehnen` (+ 21 weitere generische Zustände und 23 Aktionen) sind jetzt **Core-Fixtures** (`ph_core/fixtures/workflow_state.json`, `workflow_action_master.json`). ph_personal und alle anderen Apps sollen diese Namen aus ihren eigenen Fixtures streichen (Integrationsagent).

## ph_crm (04.11.2026)

1. ✅ `"PH Beratungsgespraech": "PH-BG-.YYYY.-.#####"`, `"PH Aufgabe": "PH-AUF-.YYYY.-.#####"` eingetragen. ⚠️ `PH-AUF-` wird auch von `PH Projekt Aufgabe` (ph_projekte) verwendet → gemeinsamer Zähler; Vorschlag ph_projekte `PH-PAU-` (Befund).
2. ✅ Feiertagskalender in ph_core (s. ph_personal 3): `ph_core.utils.feiertage.ist_geschlossen(datum)` existiert mit genau diesem Namen; Osterformel identisch zu `ph_crm/utils/feiertage.py` und `holidays.js`. ph_crm kann `PH Termin Einstellungen.feiertage` als zusätzliche Schließtage behalten oder auf PH Einstellungen → Betriebsruhe umstellen.
3. ✅ `ph_meet_api_token` im Schlüsselregister (README Abschnitt 3, PH Einstellungen → Schlüsselnamen).
4. ✅ `mail.sende(..., vorlage="PH Termin Bestätigung", kontext={...}, sprache=None)`: rendert subject/response(_html) des Email Template mit `frappe.render_template`; mit `sprache` zuerst „<Vorlage> (<sprache>)“. Übergebene betreff/html haben Vorrang.
5. ✅ Bestätigt und dokumentiert (Modul-Docstring `ph_core/api/__init__.py`): `frappe.local.response["http_status_code"]` wird in `frappe.utils.response.build_response → as_json()` methodenunabhängig übernommen, also auch bei GET ohne Body. Zusätzlich bildet `ph_api` Frappe-Ausnahmen jetzt einheitlich ab (ValidationError 400 `invalid` – vorher 422 –, PermissionError 403, DoesNotExistError 404, Duplicate/TimestampMismatch 409).

## ph_marketing (04.11.2026)

1. ✅ `"PH Newsletter Ausgabe": "PH-NL-.YYYY.-.###"`, `"PH Social Beitrag": "PH-SOC-.YYYY.-.####"` eingetragen.
2. ✅ `sende(..., reply_to=, absender_name=, cc=, bcc=)` vorhanden; Testmodus leitet auch cc/bcc um.
3. ✗ `ph_core/api/mail.py send_transactional` (Resend aus ph_core): nicht gebaut – Versandweg (eigener SMTP vs. Resend) ist offene Frage 13 an den Inhaber (PLAN Abschnitt 6). Bis zur Entscheidung bleibt Resend in ph_marketing; `ph_resend_api_key` ist dort registriert. Sobald entschieden, wird `sende()` um einen Resend-Transport erweitert (gleiche Signatur).
4. ✅ `ApiFehler.daten` wird weiterhin flach in den Antwortkörper übernommen (`{"code", "message", **daten}`), dokumentiert im Docstring.

## ph_sortiment (04.11.2026)

1. ✅ `ph_core.utils.website.revalidate(pfad)` (s. ph_personal 2). **Festgelegt:** nur Header `X-Revalidate-Secret`, POST an `/revalidate/<pfad>` ohne Body – die Website prüft weder Bearer noch `{tag}`-Body (`src/lib/revalidateAuth.js`). ⚠️ `ph_sortiment/ereignisse.py revalidate_senden` postet heute `json={"tag"}` an die Basis-URL – mit dem Core-Helfer (`revalidate("produkte")`, `revalidate("marken")`) funktioniert es; der eigene Rückfall ist falsch adressiert (Befund).
2. ✅ `"PH Preisliste Import": "PH-PLI-.YYYY.-.####"` eingetragen.
3. ✅ `cc`/`reply_to` in `sende` (s. ph_marketing 2).

## ph_logistik (04.11.2026)

1. ✅ `PH Lagerbestand`, `PH Lagerbewegung`, `PH Inventur`, `PH Tour` eingetragen.
2. ✅ `sende(..., vorlage=, kontext=, sprache="en")` – Sprachvariante „<Vorlage> (en)“ als Email Template anlegen (de ohne Suffix als Grundvorlage).
3. ✅ Generische Zustände `PH Entwurf`, `PH Storniert`, `PH Geplant`, `PH Abgeschlossen`, `PH Freigegeben` sind Core-Fixtures mit festem Style (Entwurf Inverse, Storniert Danger, Geplant Primary, Abgeschlossen Success, Freigegeben Info). ⚠️ ph_logistik definiert davon abweichende Styles (Befund).

## ph_projekte (04.11.2026)

1. ✅ Alle elf Serien eingetragen (`PH Planung` … `PH Abnahme`, `PH Projekt Aufgabe`). ⚠️ `PH Projekt Aufgabe` teilt `PH-AUF-` mit `PH Aufgabe` (ph_crm) → Vorschlag `PH-PAU-.YYYY.-.#####`; ⚠️ `PH Zeiterfassung` kollidiert als **DocType-Name** mit ph_personal (Besitzer laut PLAN WP8: ph_personal; ph_projekte z. B. `PH Projekt Zeit`). Beides Befund.
2. ↪ PH Kontakt Portal-Felder: in ph_crm bereits vorhanden (`portal_aktiv`, `portal_token_hash`, `portal_token_erzeugt_am`, `portal_letzter_login`). Zentral: `ph_core.api.portal_kontakt_pruefen(kontakt, kunde_token)`.
3. ✅ `ph_qr_svg(text, groesse_mm=22, farbe="#30373e")` in `ph_core/utils/druck.py` (pyqrcode, Rückfall qrcode, sonst Text) – `ph_projekte/utils/qr.py` kann entfallen.
4. (Integration 04.11.) Umbenennung erledigt: DocType heißt jetzt **`PH Projektzeit`** (ph_projekte), Serie `PH-PZT-.YYYY.-.#####`; `PH Projekt Aufgabe` nutzt jetzt `PH-PAU-.YYYY.-.#####`. Bitte `NUMMERNKREISE` ergänzen: `"PH Projektzeit": "PH-PZT-.YYYY.-.#####"`, `"PH Projekt Aufgabe": "PH-PAU-.YYYY.-.#####"`; `PH Zeiterfassung` bleibt ph_personal (`PH-ZEIT-.YYYY.-.######`); `GETEILTE_SERIEN` leeren. `ph_projekte/utils/qr.py` ist nur noch Re-Export von `ph_core.utils.druck.ph_qr_svg`, die Jinja-Registrierung in ph_projekte ist entfernt.

## ph_service

1. ✅ Alle sieben Serien eingetragen (`PH Servicefall` … `PH Serviceauftrag`, `PH Pflege Abo` = `PFL-.YYYY.-.#####`).
2. ✅ `ph_core.api.portal_kontakt_pruefen(kontakt, kunde_token)` (+ `token_hash(token)`) – gleiche Prüfung wie `_kontakt_pruefen`, Fehlercodes invalid 400 / unavailable 503 / not_found 404 / invalid_token 404. ph_projekte, ph_faktura, ph_service können umstellen.
3. ✅ Im Docstring von `sende` bestätigt: `anhaenge` wird unverändert an `frappe.sendmail(attachments=…)` gereicht – `{"fid": …}`, `{"fname", "fcontent"}` und `print_format_attachment`-Dicts.

## ph_shop

- ✅ `"PH Widerruf": "PH-WID-.YYYY.-.#####"`, `"PH Retoure": "PH-RET-.YYYY.-.#####"` eingetragen.
- ✅ `ph_payments_link_secret` im Schlüsselregister.
- ✅ Hook-Konvention dokumentiert (README Abschnitt 8, `ph_core/hooks.py` Kommentarblock): Anbieter deklariert leere Liste, Nutzer tragen dotted paths ein, Namen `ph_<anbieter>_<zweck>` / `ph_stripe_<zweck>`; Register `ph_stripe_art_handler`, `ph_shop_rechnung_erstellen`, `ph_shop_lieferschein_erstellen`. (CONVENTIONS.md schreibt der Core-Agent nicht – der Integrationsagent kann den Absatz nach CONVENTIONS 10 übernehmen.)

## ph_faktura (04.11.2026)

1. ✅ `PH Eingangsrechnung`, `PH Export Lauf`, `PH Bankimport`, `PH Bankumsatz`, `PH UVA Auswertung` eingetragen; `PH Rechnung`/`PH Gutschrift` bleiben mit `RE-`/`GU-` registriert (Entwurf `format:ENTW-…`, Serie beim Stellen) – check.py akzeptiert das.
2. ✅ Anhangsformat `[{"fname", "fcontent"}]` bleibt (Docstring).
3. ✅ `ph_satz(promille)` als Core-Jinja-Helfer (`ph_core/utils/druck.py`, Logik in `ph_core/utils/zahlen.py satz_text`: 2000 → „20 %“, 1950 → „19,5 %“) – `ph_faktura.druck.ph_satz` kann entfallen (gleiche Ausgabe wie `steuer.satz_prozent_text`).
4. ✅ `ph_core.install.FIRMA` enthält FN 443753 d, Landesgericht Feldkirch, ATU70035339, Landstraße 11, 6911 Lochau; vorhandene Firma wird um leere Felder ergänzt (`after_install` und `after_migrate`). Bank/IBAN/BIC bleiben Eingabe des Inhabers.
