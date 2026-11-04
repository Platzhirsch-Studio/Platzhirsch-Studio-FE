# Integrationsbericht PH-App-Familie – 04.11.2026

Integrationsagent. Grundlage: `tools/contracts.py` (neu, statische Vertragsprüfung ohne Frappe), `tools/check.py --streng`, site-freie Unit-Tests, `INTEGRATION-BEFUNDE-CORE.md` des Core-Agenten. ph_core wurde nicht verändert; Wünsche stehen in `ANFRAGEN-AN-CORE.md`.

## 1. Prüfwerkzeug `tools/contracts.py`

`python -I Backend-Import/tools/contracts.py [--warnungen] [--json] [--app ph_x] [--kategorie a,b,…]` – Exit 1 bei Fehlern.

| Kat. | Prüfung |
|---|---|
| a | DocType-Index (204 DocTypes): Link/Table/Table-MultiSelect-Ziele (Familie oder Frappe-Standard), Dynamic-Link-Paare, `fetch_from`, Custom-Field-Fixtures (Ziel-DocType, Kollisionen, `insert_after`), Property Setter, Client Script, Kanban, Chart/Card, Print Format, Workspace-Shortcuts, Report `ref_doctype` |
| b | Cross-App-Aufrufe: hooks (`doc_events`, `scheduler_events`, `jinja`, `after_install`, `ph_stripe_art_handler`/`ph_shop_*`), `frappe.get_attr`/`enqueue`/`call`, Imports (`from ph_x …`), JS `method:`/`frappe.call`/`frm.call` (Dokumentmethoden), Jinja `frappe.call` – Ziel auflösbar, `@frappe.whitelist()` wo aus JS/HTTP gerufen, Signaturprüfung per AST (Positions-/Keyword-/Pflichtargumente, tolerant bei `*args/**kwargs`, JS-Shorthand, Kalender-`get_events`) |
| c | Feldzugriffe: `get_value/get_all/set_value/exists/count/get_doc/new_doc/db.sql`, `doc.feld` nach `get_doc`, `self.feld` im Controller (Methoden/Attribute der Klasse ausgenommen), `doc.append(...)`, JS `frm.doc.x`/`set_value`/`set_query` (auch Kindtabellen), `frappe.db.*` im JS, Workflow `update_field/update_value`, Chart/Card-Filter – gegen DocType-JSON inkl. Custom Fields |
| d | Workflow State / Action Master über alle Apps: Doppelungen, Style-Konflikte, Referenzen in Workflows vorhanden und vor der App installiert |
| e | Rollen aus Permissions, Workflows, Fixtures (`roles[]`), Custom DocPerm, Code-Literalen gegen `role.json` (jetzt nur ph_core) |
| f | `required_apps` vs. Link-Ziele/Imports/Fixtures, Zyklen, Installationsreihenfolge laut PLAN |
| g | pyproject-`dependencies` vs. Drittpaket-Imports (`stripe`, `qrcode`, `cryptography`; Frappe-eigene wie `requests`, `pyqrcode`, `cryptography` gelten als vorhanden; `qrcode` nur ph_kassa) |

## 2. Befunde vorher → nachher

| Kategorie | vorher (Fehler/Warnungen) | nachher |
|---|---|---|
| a Links/Fixtures | 1 / 1 | 0 / 0 |
| b Aufrufe/Signaturen | 83 / 1 (davon ~65 Tool-Falschmeldungen, nach Parser-Korrektur 14 echte) | 0 / 0 |
| c Feldnamen | 253 / 41 (davon ~195 Controller-Methoden als „Feld“ gezählt; echte: 57) | 0 / 0 |
| d Workflow-Fixtures | 52 / 1 (nach Core-Fixtures 60 / 52) | 0 / 3 |
| e Rollen | 0 / 2 | 0 / 0 |
| f required_apps | 1 / 23 | 0 / 23 |
| g pyproject | 4 / 2 | 0 / 1 |
| **gesamt** | **394 / 71** | **0 / 27** |

`tools/check.py`: 0 Fehler bis auf **2 Register-Zeilen in `ph_core/utils/naming.py`** (s. 5). Unit-Tests ohne Site: alle 10 Apps grün (ph_crm 8, ph_sortiment 20, ph_projekte 22, ph_shop 20, ph_faktura 34, ph_logistik 37 + 1 skip, ph_personal 16, ph_marketing 17, ph_kassa 52, ph_service 15).

## 3. Behebungen (Datei → was)

**Zahlung / Kassa / Faktura**
- `ph_kassa/.../ph_kassenbeleg/ph_kassenbeleg.py`, `ph_kassa/schnittstellen.py`, `page/ph_kassa/ph_kassa.py`: `from ph_shop.zahlung import buche` (richtiger Modulpfad) mit Keyword-Signatur, `idempotency_key kassa:<Beleg>:<idx>`, `quelle="kassa"`, Terminal-PaymentIntent, setzt `PH Kassenbeleg Zahlung.zahlung` und `PH Zahlung.kassenbeleg`; Importpfad `ph_kassa.schnittstellen` korrigiert; Produktsuche auf echte PH-Produkt-Felder (`titel`, `aktueller_preis_cent`, `ust_klasse` → Int×100).
- `ph_shop/ph_shop/gutschein.py` NEU (`pruefen`, `einloesen`, `storniere_einloesung`, idempotent) – von ph_kassa genutzt.
- `ph_faktura/ph_faktura/ph_faktura/kassa.py` NEU: `kassenbeleg_gebucht(beleg)` – OP je PH Zahlung an der Rechnung, Zahlungsplan-Zeile der AB erfüllen, Anzahlungsrechnung buchen, AB-Stand; nie werfen.
- `ph_faktura/ph_faktura/zahlung.py`: Fallback entfernt, Wrapper ruft `ph_shop.zahlung.buche` keyword-korrekt; `ereignisse.py`: keine Doppelbuchung (`frappe.flags.ph_faktura_bucht`), Kassenbeleg-Bezug aufgelöst.
- `ph_kassa/terminal.py` + `hooks.py`: `ph_stripe_art_handler = [{"kassa": "ph_kassa.terminal.stripe_ereignis"}]` (Statusspiegel, keine zweite Zahlung). `ph_kassa/pyproject.toml`: `stripe>=10,<13`.

**Logistik / Projekte**
- `ph_logistik/.../ph_lieferschein.py`: feste Positionsfeldnamen (PH Bestellung Position / PH Beleg Position), `lieferschein_menge` + AB-Status über `PH Auftragsbestaetigung.lieferung_melden`, Aufrufe `ph_faktura.api.create_partial_invoice(...)` und `ph_projekte.api.create_product_passes(...)` mit echten Signaturen; `helfer.produkt_info`, `ereignisse.py` (Retoure über `slug`); `hooks.py`: `required_apps` + `ph_crm`, `ph_shop_lieferschein_erstellen`-Hook.
- `ph_faktura/ph_faktura/api/__init__.py`: `create_partial_invoice` NEU (whitelisted, idempotent), `create_cash_invoice` auf echte PH-Bestellung-Felder (Brutto→Netto, OSS, Versand je Satz).
- `ph_projekte`: DocType **`PH Zeiterfassung` → `PH Projektzeit`** (Ordner, Klasse, Serie `PH-PZT-`, alle Verweise), `PH Projekt Aufgabe` Serie `PH-PAU-`; `create_product_passes` NEU + gemeinsamer Helfer `pass_anlegen`; `PH Montageauftrag.abnahme_anlegen` NEU; `PH Lieferant.firmenname`, Herstellerbestellung über `bezug_doctype/bezug_name`, `bestaetigter_termin`; Portal-Token über `ph_core.api.portal_kontakt_pruefen` (Hash jetzt reines sha256 wie Core/Faktura/Service); `utils/qr.py` nur Re-Export von Core `ph_qr_svg`, Jinja-Doppelregistrierung entfernt.

**Feldnamen / Helfer (ph_faktura, ph_crm, ph_sortiment, ph_marketing, ph_service, ph_personal)**
- `ph_faktura/beleg.py`, `ph_angebot.js/.py`, `ph_auftragsbestaetigung.py`, `ph_eingangsrechnung.py`: PH Produkt (`titel`, `aktueller_preis_cent`+`preisart`, `ust_klasse`→`ph_shop.ust.UST_SAETZE_PROMILLE`, `lieferzeit_text_de`), PH Lieferant `firmenname`, Herstellerbestellung (`bezug_*`, `summe_ek_cent`, Positionen); `hooks.py`: `required_apps` + `ph_sortiment`, Jinja `ph_satz` entfernt (Core); `rechenwerk/epc.py`: nur pyqrcode.
- `ph_crm/.../ph_anfrage_produkt.json`: Link `produkt` entfernt (ph_sortiment nicht installierbar vor ph_crm) → `ph_sortiment/fixtures/custom_field.json` NEU `PH Anfrage Produkt.ph_sortiment_produkt`; `ph_sortiment/hooks.py`: `required_apps` + `ph_crm`; `ph_beratungsgespraech.py` setzt `ph_projekte_projekt`.
- `ph_sortiment/ereignisse.py revalidate_senden`, `ph_personal/website.py`: nur noch `ph_core.utils.website.revalidate`.
- `ph_service`: `kundentyp_manuell` entfernt, `_kontakt_pruefen` → Core, Custom Field `insert_after` korrigiert. `ph_marketing`: Report `ph_kampagnen_roi` (`brutto_cent`, Anfrage über AB.angebot), Einstellungs-Defaults, Test-Import, `versand.py` über `ph_core.utils.mail.sende(reply_to=, absender_name=)`.

**Rollen / Workflows (zentral per Skript)**
- `fixtures/role.json` in allen zehn Apps gelöscht, `{"dt": "Role", …}` aus hooks entfernt (ph_core besitzt alle 27 Rollen). ph_faktura: `"PH Verkauf"` → `"PH Faktura Mitarbeiter"`, `"PH Buchhaltung"` → `"PH Faktura Leitung"` (Permissions vereinigt; Rollenprofile `PH Verkauf`/`PH Buchhaltung` in ph_core bündeln die Zusatzrollen).
- `workflow_state.json`/`workflow_action_master.json`: 23 Core-Zustände und 28 Core-Aktionen aus allen Apps entfernt; nicht-Core-Doppelungen gehören der zuerst installierten App (`PH Geprueft`, `PH Teilgeliefert`, `PH Geliefert`, `PH Abgelaufen` → ph_sortiment/ph_faktura; `PH Unterwegs` → ph_logistik; `PH Abgesagt` → ph_personal; `PH Beendet` → ph_marketing; `PH Abgeholt`, `PH Abgerechnet` → ph_shop/ph_faktura); hooks-Filter entsprechend gekürzt; ph_shop `Abschliessen` → `Abschließen`.

**Shop Rechtstexte ↔ Website**
- `PH Shop Einstellungen`: je Website-Slot (`src/lib/shop/legal.js`: agb, widerruf, widerrufsformular, versand, datenschutz) Text + Stand, `rechtstexte_status` (= `LEGAL_SLOT_STATUS`); `mails.rechtstext_anhaenge` hängt Texte nur bei `freigegeben` an (Muster-Widerrufsformular im Widerrufs-Anhang). README-Abschnitt.

**Dokumente**
- `CONVENTIONS.md` 2: Steuersätze Int×100 (Basispunkte, Suffix `_promille` historisch – ph_shop/ph_faktura/ph_kassa gleich), Rabatte echte Promille. `PLAN.md` 2: `required_apps`-Tabelle und Hinweis Integration. READMEs der Apps (Pfade, Signaturen, Rollen, offene Punkte).

## 4. Verbleibende Warnungen (begründet)

- **[f] 23×** „Abhängigkeit ohne required_apps / später installierte App“: ausschließlich Code-Zugriffe hinter `frappe.db.exists("DocType", …)`/try (Auftragsmappe, Vertriebscockpit, Servicefall-Buttons, JS-Routen). Gewollt laut PLAN (keine Zirkel), zur Laufzeit abgefangen. ph_core → PH Kontakt (`portal_kontakt_pruefen`) ist Core-intern mit exists-Schutz.
- **[d] 3×** Workflow-States fremder Apps ohne required_apps (`PH Abgesagt` ph_personal→ph_marketing, `PH Angebot` ph_crm→ph_personal, `PH Beendet` ph_marketing→ph_service): Installationsreihenfolge laut PLAN reicht; alternativ nach ph_core melden (Wunsch in ANFRAGEN-AN-CORE).
- **[g] 1×** ph_core `druck.py` optionaler `qrcode`-Import (Fallback) – Core-Sache, harmlos.
- `PH Zahlung.kassenbeleg` heißt nicht `ph_kassa_kassenbeleg` (CONVENTIONS 10) – Code und Fixture konsistent, bewusst belassen.

## 5. Offen – nur Core kann schließen

`tools/check.py` meldet 2 Fehler, beide im Register `ph_core/ph_core/utils/naming.py` (ph_core war tabu): `"PH Projektzeit": "PH-PZT-.YYYY.-.#####"` fehlt, `"PH Projekt Aufgabe"` steht noch mit `PH-AUF-` statt `PH-PAU-`; dazu `GETEILTE_SERIEN` leeren. Eingetragen in `ANFRAGEN-AN-CORE.md` (ph_projekte Punkt 4). Nach diesen zwei Zeilen ist `check.py --streng` grün.

## 6. Nur auf einer Staging-Bench prüfbar

Reihenfolge `bench --site <staging> install-app`: ph_core → ph_crm → ph_sortiment → ph_projekte → ph_shop → ph_faktura → ph_logistik → ph_personal → ph_marketing → ph_kassa → ph_service, danach `bench --site <staging> migrate` und je App `run-tests --app <app>`:

| App | Site-Tests / Abläufe |
|---|---|
| ph_crm | Slot-Kollision, Idempotenz, verify_expired; `test_ph_termin` (422 für `outside_window` bleibt) |
| ph_sortiment | Custom Field `ph_sortiment_produkt` an PH Anfrage Produkt, Revalidate über Core |
| ph_projekte | `test_ph_projektzeit`, Produktpass-/Abnahme-Fluss, Portal-Token (sha256 ohne Präfix) |
| ph_shop | buche/erstatte, Webhook inkl. fremdem Handler `kassa`, `gutschein.einloesen`, Rechtstexte-Anhänge nur bei `freigegeben` |
| ph_faktura | Rechnung lückenlos, Anzahlungsfluss, `create_partial_invoice`, `kassenbeleg_gebucht`, Zahlung via ph_shop ohne Doppelbuchung |
| ph_logistik | Lieferschein aus Bestellung/AB mit festen Feldern, `lieferschein_menge` → AB Teilgeliefert/Geliefert, Hook `ph_shop_lieferschein_erstellen` |
| ph_personal | Zeiterfassung (Besitzer), Revalidate `karriere` |
| ph_marketing | Report Kampagnen-ROI über AB.angebot, Versand über Core-Mail |
| ph_kassa | Kassenbeleg on_submit → PH Zahlung/Gutschein/Zahlungsplan, Terminal-Webhook, Startbeleg mit BMF Belegcheck-App |
| ph_service | Portal-Token über Core, Custom Fields auf PH Tour Stopp/Wareneingang nach Installation |

Zusätzlich: Fixture-Import-Reihenfolge (Core-States vor App-Workflows), Workspace-`roles` nach Rollen-Mapping in ph_faktura, Druck `ph_qr_svg` (pyqrcode) in Produktpass/EPC-QR.
