# Integrationsbefunde aus Sicht von ph_core (04.11.2026)

Für den Integrationsagenten. Quelle: `python -I tools/check.py` (0 Fehler, 98 Warnungen) plus manuelle Durchsicht. ph_core hat **nichts** in fremden Apps geändert. Nach Abarbeitung soll `python -I tools/check.py --streng` grün sein.

## A. Harte Befunde (brechen Installation oder Zähler)

| # | App | Befund | Vorschlag |
|---|---|---|---|
| A1 | ph_projekte | DocType **`PH Zeiterfassung`** existiert in ph_personal **und** ph_projekte (Serie `######` vs. `#####`). Die zweite Installation (ph_personal, Nr. 8, nach ph_projekte Nr. 4) scheitert an „DocType already exists“. | Besitzer laut PLAN WP8 = ph_personal. ph_projekte umbenennen (z. B. `PH Projekt Zeit`, Serie `PH-PZT-.YYYY.-.#####`) oder Projektbezug als Custom Field `ph_projekte_projekt` an `PH Zeiterfassung` (PLAN WP8 sieht genau das vor). Danach Register in `naming.py` anpassen (Core-Agent oder Integrationsagent). |
| A2 | ph_crm | `PH Anfrage Produkt.produkt` → Link auf `PH Produkt` (ph_sortiment), aber ph_sortiment wird **nach** ph_crm installiert und steht nicht in `required_apps`. Link-Validierung schlägt bei Installation nicht fehl (Frappe prüft Link-Ziele erst beim Speichern), aber Desk/Reports zeigen Fehler, bis ph_sortiment da ist. | Entweder `produkt` als `Data` (Slug) in ph_crm + Custom Field `ph_sortiment_produkt:Link` aus ph_sortiment, oder ph_crm bewusst mit `frappe.db.exists("DocType", "PH Produkt")`-Schutz belassen und in PLAN Abschnitt 2 dokumentieren. |
| A3 | ph_crm / ph_projekte | Nummernkreis **`PH-AUF-.YYYY.-.#####`** von `PH Aufgabe` (crm) **und** `PH Projekt Aufgabe` (projekte) → gemeinsamer Zähler in `tabSeries`, Nummern springen. | ph_projekte auf `PH-PAU-.YYYY.-.#####` umstellen; dann `GETEILTE_SERIEN` in `naming.py` leeren. |

## B. Rollen (alle PH-Rollen gehören jetzt ph_core)

`ph_core/fixtures/role.json` enthält alle 27 Rollen (4 globale, 11×Mitarbeiter/Leitung, PH Montage, PH Techniker, PH Personal Selbstservice). Zu tun in den Apps:

| App | Rollen-Fixture entfernen (Duplikat zu ph_core) | Bemerkung |
|---|---|---|
| ph_crm, ph_sortiment, ph_projekte, ph_shop, ph_faktura, ph_logistik, ph_personal, ph_marketing, ph_kassa, ph_service | `PH <Bereich> Mitarbeiter`, `PH <Bereich> Leitung` | `fixtures/role.json` löschen oder leeren, `{"dt": "Role", …}` aus `hooks.fixtures` streichen |
| ph_logistik | `PH Montage` | jetzt Core |
| ph_service | `PH Techniker` | jetzt Core |
| ph_personal | `PH Personal Selbstservice` | jetzt Core |
| ph_faktura | **`PH Buchhaltung`**, **`PH Verkauf`** – nur dort definiert, nicht in CONVENTIONS 4 | Entweder streichen und durch Rollenprofile `PH Buchhaltung`/`PH Verkauf` (ph_core `role_profile.json`, gleiche Namen!) ersetzen, oder begründen und nach ph_core melden. Achtung: Role Profile `PH Buchhaltung`/`PH Verkauf` und Role gleichen Namens sind verschiedene DocTypes – Verwechslungsgefahr in Workspace-`roles`. |

## C. Workflow States / Actions (Core-Fixtures wiederverwenden)

ph_core liefert 23 generische Zustände mit festem Style und 28 Aktionen (`ph_core/fixtures/workflow_state.json`, `workflow_action_master.json`; Listen `PH_WORKFLOW_STATES`/`PH_WORKFLOW_ACTIONS` in `ph_core/hooks.py`). Fixtures-Import ist Upsert – doppelte Definitionen überschreiben den Style je nach Installationsreihenfolge (zuletzt installierte App gewinnt). Zu tun:

1. In jeder App die Core-Namen aus `workflow_state.json`/`workflow_action_master.json` und aus den `hooks.fixtures`-Filtern entfernen (Liste je App in den Warnungen unten).
2. Style-Konflikte bei **nicht**-Core-Zuständen zwischen zwei Apps einigen (eine App behält das Fixture, oder nach ph_core melden): `PH Abgeholt` (service Info / shop Success), `PH Abgelaufen` (faktura Warning / shop Inverse), `PH Abgerechnet` (faktura Success / service Inverse), `PH Abgesagt` (marketing Danger / personal Inverse), `PH Beendet` (marketing Info / service Inverse), `PH Geliefert` (faktura Warning / sortiment Success), `PH Teilgeliefert` (faktura Info / sortiment Warning), `PH Unterwegs` (logistik Warning / projekte Info), `PH Geprueft` (gleich, doppelt).
3. Schreibweise: ph_shop nutzt Aktion **`Abschliessen`**, alle anderen `Abschließen` (Core). ph_shop auf `Abschließen` umstellen.
4. ph_projekte: `PH Entwurf` mit leerem Style – entfällt mit Core-Fixture.

## D. `required_apps` vs. tatsächliche Link-Ziele (CONVENTIONS 10)

| App | fehlt in required_apps | Belege |
|---|---|---|
| ph_faktura | `ph_sortiment` (nur transitiv über ph_projekte) | `PH Beleg Position.produkt/ausfuehrung/lieferant`, `PH Eingangsrechnung.lieferant/herstellerbestellung`, Custom Field `ph_faktura_kreditor_nr` an `PH Lieferant` |
| ph_logistik | `ph_crm` (nur transitiv über ph_shop/ph_faktura) | `PH Lieferschein.kontakt`, `PH Sendung.kontakt`, `PH Tour Stopp.kontakt` |
| ph_crm | `ph_sortiment` – **nicht** möglich (Zirkel/Reihenfolge) | s. A2 |

Transitive Abhängigkeiten funktionieren bei der vorgegebenen Reihenfolge, verstoßen aber gegen CONVENTIONS 10 und brechen, sobald jemand `bench install-app` einzeln ausführt. `required_apps` ergänzen (PLAN Abschnitt 2 Tabelle mitziehen).

## E. Helfer umstellen (kein Bruch, aber Doppelcode)

| App | Lokal heute | Core-Ersatz |
|---|---|---|
| ph_personal | `ph_personal/website.py revalidate_career` (eigene Drossel, Einstellungsschalter) | `ph_core.utils.website.revalidate("karriere", sofort=…)`; Schalter `website_revalidate_aktiv` gibt es jetzt in PH Einstellungen (App-Schalter kann bleiben) |
| ph_sortiment | `ereignisse.revalidate_senden` – Rückfall postet `json={"tag"}` an Basis-URL mit Bearer **(Website lehnt ab: 401/404)** | Core-Import ist dort bereits vorbereitet; Rückfall entfernen |
| ph_crm | `utils/feiertage.py`, `PH Termin Einstellungen.feiertage` | `ph_core.utils.feiertage.ist_geschlossen` / `feiertage_site`; Termin-Feiertage als „Betriebsruhe“ in PH Einstellungen |
| ph_personal | `logik.arbeitstage(feiertage=…)` | `feiertage=ph_core.utils.feiertage.feiertage_site(jahr)` |
| ph_logistik | Liefertermin-Berechnung | `arbeitstage_addieren_site(datum, n)` |
| ph_faktura | `druck.ph_satz`, `rechenwerk/epc.epc_svg` (pyqrcode→qrcode) | Jinja `ph_satz` (Core), `ph_qr_svg(text)` für GiroCode-Inline-SVG (Data-URI weiterhin lokal möglich) |
| ph_projekte | `utils/qr.py ph_qr_svg` | Core-Jinja `ph_qr_svg` gleichen Namens – lokale Registrierung in `hooks.jinja` entfernen (sonst doppelte Jinja-Methode, letzte gewinnt) |
| ph_projekte, ph_faktura, ph_service | `_kontakt_pruefen` je App | `ph_core.api.portal_kontakt_pruefen` |
| ph_marketing | `frappe.sendmail` direkt mit eigener Testmodus-Umleitung | `ph_core.utils.mail.sende(..., reply_to=, absender_name=)` |
| ph_logistik, ph_crm | eigene Vorlagen-Renderer | `sende(vorlage=, kontext=, sprache=)` |

## F. Python-Abhängigkeiten / QR

- `qrcode` nur in ph_kassa (pyproject) – bleibt für PNG im RKSV-Bon. `pyqrcode` ist die gemeinsame SVG-Bibliothek (Frappe-Abhängigkeit). ph_faktura versucht beide – auf `ph_qr_svg` bzw. nur pyqrcode reduzieren.
- `stripe` in ph_shop (pyproject) und ph_kassa (Import, Terminal) – ph_kassa hat `stripe` **nicht** in `pyproject.dependencies`; da ph_shop Pflichtabhängigkeit ist, reicht das, aber ein Eintrag in ph_kassa wäre sauberer.
- `requests` wird von sechs Apps importiert; ist Frappe-Abhängigkeit, kein Eintrag nötig.

## G. Druckformate

- Alle 48 Druckformate erben `templates/print/ph_basis.html` direkt oder über Teilvorlagen (ph_faktura `include` → extends). Ausnahmen bewusst ohne Basis: `PH Lagerbestand Etikett` (62×29 mm), `PH Event Namensschilder`, Kassa-Bon (80 mm, kein Fixture vorhanden – ph_kassa hat **keine** `print_format.json`, Bon läuft über Desk-Page; prüfen, ob ein Print Format für Nachdruck/PDF fehlt).
- Letter Head `PLATZHIRSCH` ist `is_default: 1`; ph_basis.html rendert den Kopf selbst – Druckformate mit `custom_format: 1` dürfen keinen zusätzlichen Letter Head wählen (sonst doppelt). Pfad `templates/print/ph_basis.html` ist in allen Apps korrekt.

## H. API-Verhalten geändert (bitte Tests der Apps prüfen)

- `ph_api`: `frappe.ValidationError` liefert jetzt **400 `invalid`** (vorher 422). Explizite `ApiFehler("outside_window", 422)` bleiben 422. Kein App-Test erwartet 422 für ValidationError (grep), aber bitte bei `run-tests` beachten.
- Neu: PermissionError → 403, DoesNotExistError → 404, DuplicateEntry/TimestampMismatch → 409.

## I. Sonstiges

- ph_faktura hat einen zweiten Workspace `PH Vertriebscockpit` (sequence 6.5) – zulässig, in PLAN Abschnitt 7 vermerkt.
- ph_kassa `fixtures/` ohne `role.json`-Duplikat-Problem hinaus: `workflow*.json` fehlen, obwohl `hooks.fixtures` Workflow/Workflow State/Action listet – harmlos (Export liefert leere Listen), aber prüfen, ob Kassenabschluss-Workflow geplant war (PLAN WP10b).
- `ph_core.install.after_install` läuft jetzt auch als `after_migrate` (idempotent) – Apps, die in `after_install` eine Standardfirma voraussetzen, sind damit auch nach Core-Updates versorgt.

## Rohliste `tools/check.py` (Warnungen, Stand 04.11.2026)

```
WARNUNG DocType 'PH Zeiterfassung' in mehreren Apps definiert: ['ph_personal', 'ph_projekte'] – PLAN.md entscheidet den Besitzer
WARNUNG Rolle 'PH Buchhaltung' nur in ph_faktura definiert – nach ph_core/fixtures/role.json übernehmen oder streichen
WARNUNG Rolle 'PH CRM Leitung' als Fixture in mehreren Apps: ['ph_core', 'ph_crm'] – nur ph_core behalten
WARNUNG Rolle 'PH CRM Mitarbeiter' als Fixture in mehreren Apps: ['ph_core', 'ph_crm'] – nur ph_core behalten
WARNUNG Rolle 'PH Faktura Leitung' als Fixture in mehreren Apps: ['ph_core', 'ph_faktura'] – nur ph_core behalten
WARNUNG Rolle 'PH Faktura Mitarbeiter' als Fixture in mehreren Apps: ['ph_core', 'ph_faktura'] – nur ph_core behalten
WARNUNG Rolle 'PH Kassa Leitung' als Fixture in mehreren Apps: ['ph_core', 'ph_kassa'] – nur ph_core behalten
WARNUNG Rolle 'PH Kassa Mitarbeiter' als Fixture in mehreren Apps: ['ph_core', 'ph_kassa'] – nur ph_core behalten
WARNUNG Rolle 'PH Logistik Leitung' als Fixture in mehreren Apps: ['ph_core', 'ph_logistik'] – nur ph_core behalten
WARNUNG Rolle 'PH Logistik Mitarbeiter' als Fixture in mehreren Apps: ['ph_core', 'ph_logistik'] – nur ph_core behalten
WARNUNG Rolle 'PH Marketing Leitung' als Fixture in mehreren Apps: ['ph_core', 'ph_marketing'] – nur ph_core behalten
WARNUNG Rolle 'PH Marketing Mitarbeiter' als Fixture in mehreren Apps: ['ph_core', 'ph_marketing'] – nur ph_core behalten
WARNUNG Rolle 'PH Montage' als Fixture in mehreren Apps: ['ph_core', 'ph_logistik'] – nur ph_core behalten
WARNUNG Rolle 'PH Personal Leitung' als Fixture in mehreren Apps: ['ph_core', 'ph_personal'] – nur ph_core behalten
WARNUNG Rolle 'PH Personal Mitarbeiter' als Fixture in mehreren Apps: ['ph_core', 'ph_personal'] – nur ph_core behalten
WARNUNG Rolle 'PH Personal Selbstservice' als Fixture in mehreren Apps: ['ph_core', 'ph_personal'] – nur ph_core behalten
WARNUNG Rolle 'PH Projekte Leitung' als Fixture in mehreren Apps: ['ph_core', 'ph_projekte'] – nur ph_core behalten
WARNUNG Rolle 'PH Projekte Mitarbeiter' als Fixture in mehreren Apps: ['ph_core', 'ph_projekte'] – nur ph_core behalten
WARNUNG Rolle 'PH Service Leitung' als Fixture in mehreren Apps: ['ph_core', 'ph_service'] – nur ph_core behalten
WARNUNG Rolle 'PH Service Mitarbeiter' als Fixture in mehreren Apps: ['ph_core', 'ph_service'] – nur ph_core behalten
WARNUNG Rolle 'PH Shop Leitung' als Fixture in mehreren Apps: ['ph_core', 'ph_shop'] – nur ph_core behalten
WARNUNG Rolle 'PH Shop Mitarbeiter' als Fixture in mehreren Apps: ['ph_core', 'ph_shop'] – nur ph_core behalten
WARNUNG Rolle 'PH Sortiment Leitung' als Fixture in mehreren Apps: ['ph_core', 'ph_sortiment'] – nur ph_core behalten
WARNUNG Rolle 'PH Sortiment Mitarbeiter' als Fixture in mehreren Apps: ['ph_core', 'ph_sortiment'] – nur ph_core behalten
WARNUNG Rolle 'PH Techniker' als Fixture in mehreren Apps: ['ph_core', 'ph_service'] – nur ph_core behalten
WARNUNG Rolle 'PH Verkauf' nur in ph_faktura definiert – nach ph_core/fixtures/role.json übernehmen oder streichen
WARNUNG ph_projekte\ph_projekte\ph_projekte\doctype\ph_zeiterfassung\ph_zeiterfassung.json: Serie 'PH-ZEIT-.YYYY.-.#####' weicht vom Register ab ('PH-ZEIT-.YYYY.-.######') – DocType 'PH Zeiterfassung' ist doppelt definiert, Register folgt dem Besitzer laut PLAN.md
WARNUNG Nummernkreis 'PH-AUF-.YYYY.-.#####' von mehreren DocTypes genutzt: ['PH Aufgabe', 'PH Projekt Aufgabe'] (gemeinsamer Zähler) – PH Projekt Aufgabe → PH-PAU-.YYYY.-.#####
WARNUNG Workflow State 'PH Abgebrochen' ist Core-Fixture, zusätzlich definiert in ['ph_logistik', 'ph_marketing', 'ph_projekte'] – dort entfernen (Style-Konflikt: ['Danger', 'Inverse'])
WARNUNG Workflow State 'PH Abgeholt' in mehreren Apps: ['ph_service', 'ph_shop'] mit Style-Konflikt ['Info', 'Success']
WARNUNG Workflow State 'PH Abgelaufen' in mehreren Apps: ['ph_faktura', 'ph_shop'] mit Style-Konflikt ['Inverse', 'Warning']
WARNUNG Workflow State 'PH Abgelehnt' ist Core-Fixture, zusätzlich definiert in ['ph_crm', 'ph_faktura', 'ph_personal', 'ph_projekte', 'ph_service'] – dort entfernen (Style-Konflikt: ['Danger', 'Inverse'])
WARNUNG Workflow State 'PH Abgerechnet' in mehreren Apps: ['ph_faktura', 'ph_service'] mit Style-Konflikt ['Inverse', 'Success']
WARNUNG Workflow State 'PH Abgesagt' in mehreren Apps: ['ph_marketing', 'ph_personal'] mit Style-Konflikt ['Danger', 'Inverse']
WARNUNG Workflow State 'PH Abgeschlossen' ist Core-Fixture, zusätzlich definiert in ['ph_logistik', 'ph_projekte', 'ph_shop', 'ph_sortiment'] – dort entfernen (Style-Konflikt: ['Inverse', 'Success'])
WARNUNG Workflow State 'PH Aktiv' ist Core-Fixture, zusätzlich definiert in ['ph_marketing', 'ph_personal', 'ph_service', 'ph_shop', 'ph_sortiment'] – dort entfernen
WARNUNG Workflow State 'PH Archiviert' ist Core-Fixture, zusätzlich definiert in ['ph_personal'] – dort entfernen
WARNUNG Workflow State 'PH Beantragt' ist Core-Fixture, zusätzlich definiert in ['ph_personal'] – dort entfernen
WARNUNG Workflow State 'PH Beendet' in mehreren Apps: ['ph_marketing', 'ph_service'] mit Style-Konflikt ['Info', 'Inverse']
WARNUNG Workflow State 'PH Bezahlt' ist Core-Fixture, zusätzlich definiert in ['ph_faktura', 'ph_shop'] – dort entfernen
WARNUNG Workflow State 'PH Entwurf' ist Core-Fixture, zusätzlich definiert in ['ph_faktura', 'ph_logistik', 'ph_marketing', 'ph_personal', 'ph_projekte', 'ph_sortiment'] – dort entfernen (Style-Konflikt: ['', 'Inverse', 'Primary'])
WARNUNG Workflow State 'PH Erledigt' ist Core-Fixture, zusätzlich definiert in ['ph_crm', 'ph_projekte', 'ph_service'] – dort entfernen (Style-Konflikt: ['Primary', 'Success'])
WARNUNG Workflow State 'PH Freigegeben' ist Core-Fixture, zusätzlich definiert in ['ph_faktura', 'ph_logistik', 'ph_marketing', 'ph_projekte'] – dort entfernen (Style-Konflikt: ['Info', 'Success', 'Warning'])
WARNUNG Workflow State 'PH Geliefert' in mehreren Apps: ['ph_faktura', 'ph_sortiment'] mit Style-Konflikt ['Success', 'Warning']
WARNUNG Workflow State 'PH Genehmigt' ist Core-Fixture, zusätzlich definiert in ['ph_personal'] – dort entfernen
WARNUNG Workflow State 'PH Geplant' ist Core-Fixture, zusätzlich definiert in ['ph_logistik', 'ph_marketing', 'ph_projekte'] – dort entfernen (Style-Konflikt: ['Info', 'Primary'])
WARNUNG Workflow State 'PH Geprueft' in mehreren Apps: ['ph_service', 'ph_sortiment'] (gleicher Style – eine App behält ihn, oder nach ph_core)
WARNUNG Workflow State 'PH Gesendet' ist Core-Fixture, zusätzlich definiert in ['ph_faktura', 'ph_sortiment'] – dort entfernen
WARNUNG Workflow State 'PH Gesperrt' ist Core-Fixture, zusätzlich definiert in ['ph_crm', 'ph_shop'] – dort entfernen
WARNUNG Workflow State 'PH In Arbeit' ist Core-Fixture, zusätzlich definiert in ['ph_projekte', 'ph_service'] – dort entfernen
WARNUNG Workflow State 'PH Neu' ist Core-Fixture, zusätzlich definiert in ['ph_crm'] – dort entfernen
WARNUNG Workflow State 'PH Offen' ist Core-Fixture, zusätzlich definiert in ['ph_faktura', 'ph_marketing', 'ph_shop'] – dort entfernen (Style-Konflikt: ['Primary', 'Success'])
WARNUNG Workflow State 'PH Pausiert' ist Core-Fixture, zusätzlich definiert in ['ph_marketing', 'ph_personal', 'ph_service', 'ph_sortiment'] – dort entfernen
WARNUNG Workflow State 'PH Storniert' ist Core-Fixture, zusätzlich definiert in ['ph_crm', 'ph_faktura', 'ph_logistik', 'ph_personal', 'ph_service', 'ph_shop', 'ph_sortiment'] – dort entfernen (Style-Konflikt: ['Danger', 'Inverse'])
WARNUNG Workflow State 'PH Teilgeliefert' in mehreren Apps: ['ph_faktura', 'ph_sortiment'] mit Style-Konflikt ['Info', 'Warning']
WARNUNG Workflow State 'PH Unterwegs' in mehreren Apps: ['ph_logistik', 'ph_projekte'] mit Style-Konflikt ['Info', 'Warning']
WARNUNG Workflow State 'PH Veroeffentlicht' ist Core-Fixture, zusätzlich definiert in ['ph_marketing', 'ph_projekte'] – dort entfernen
WARNUNG Workflow State 'PH Versendet' ist Core-Fixture, zusätzlich definiert in ['ph_marketing', 'ph_shop'] – dort entfernen (Style-Konflikt: ['Info', 'Success'])
WARNUNG Workflow State 'PH Verworfen' ist Core-Fixture, zusätzlich definiert in ['ph_logistik', 'ph_marketing', 'ph_projekte', 'ph_sortiment'] – dort entfernen (Style-Konflikt: ['Danger', 'Inverse'])
WARNUNG Workflow State 'PH Widerrufen' ist Core-Fixture, zusätzlich definiert in ['ph_projekte', 'ph_shop'] – dort entfernen
WARNUNG Workflow Action 'Abbrechen' ist Core-Fixture, zusätzlich definiert in ['ph_logistik', 'ph_marketing', 'ph_projekte'] – dort entfernen
WARNUNG Workflow Action 'Ablehnen' ist Core-Fixture, zusätzlich definiert in ['ph_crm', 'ph_faktura', 'ph_personal', 'ph_projekte', 'ph_service'] – dort entfernen
WARNUNG Workflow Action 'Abrechnen' ist Core-Fixture, zusätzlich definiert in ['ph_faktura', 'ph_service'] – dort entfernen
WARNUNG Workflow Action 'Absagen' ist Core-Fixture, zusätzlich definiert in ['ph_marketing', 'ph_personal'] – dort entfernen
WARNUNG Workflow Action 'Abschließen' ist Core-Fixture, zusätzlich definiert in ['ph_logistik', 'ph_projekte', 'ph_sortiment'] – dort entfernen
WARNUNG Workflow Action 'Aktivieren' ist Core-Fixture, zusätzlich definiert in ['ph_marketing', 'ph_service'] – dort entfernen
WARNUNG Workflow Action 'Archivieren' ist Core-Fixture, zusätzlich definiert in ['ph_personal'] – dort entfernen
WARNUNG Workflow Action 'Beauftragen' ist Core-Fixture, zusätzlich definiert in ['ph_projekte', 'ph_service'] – dort entfernen
WARNUNG Workflow Action 'Beenden' ist Core-Fixture, zusätzlich definiert in ['ph_marketing', 'ph_service'] – dort entfernen
WARNUNG Workflow Action 'Entsperren' ist Core-Fixture, zusätzlich definiert in ['ph_shop'] – dort entfernen
WARNUNG Workflow Action 'Erledigt melden' ist Core-Fixture, zusätzlich definiert in ['ph_projekte', 'ph_service'] – dort entfernen
WARNUNG Workflow Action 'Fortsetzen' ist Core-Fixture, zusätzlich definiert in ['ph_marketing', 'ph_service'] – dort entfernen
WARNUNG Workflow Action 'Freigeben' ist Core-Fixture, zusätzlich definiert in ['ph_faktura', 'ph_logistik', 'ph_marketing', 'ph_projekte'] – dort entfernen
WARNUNG Workflow Action 'Genehmigen' ist Core-Fixture, zusätzlich definiert in ['ph_personal'] – dort entfernen
WARNUNG Workflow Action 'Packen' ist Core-Fixture, zusätzlich definiert in ['ph_logistik', 'ph_shop'] – dort entfernen
WARNUNG Workflow Action 'Pausieren' ist Core-Fixture, zusätzlich definiert in ['ph_marketing', 'ph_personal', 'ph_service', 'ph_sortiment'] – dort entfernen
WARNUNG Workflow Action 'Reaktivieren' ist Core-Fixture, zusätzlich definiert in ['ph_crm', 'ph_sortiment'] – dort entfernen
WARNUNG Workflow Action 'Senden' ist Core-Fixture, zusätzlich definiert in ['ph_faktura', 'ph_sortiment'] – dort entfernen
WARNUNG Workflow Action 'Sperren' ist Core-Fixture, zusätzlich definiert in ['ph_crm', 'ph_shop'] – dort entfernen
WARNUNG Workflow Action 'Stornieren' ist Core-Fixture, zusätzlich definiert in ['ph_crm', 'ph_faktura', 'ph_logistik', 'ph_personal', 'ph_service', 'ph_shop', 'ph_sortiment'] – dort entfernen
WARNUNG Workflow Action 'Versenden' ist Core-Fixture, zusätzlich definiert in ['ph_logistik', 'ph_marketing', 'ph_shop'] – dort entfernen
WARNUNG Workflow Action 'Verwerfen' ist Core-Fixture, zusätzlich definiert in ['ph_logistik', 'ph_marketing', 'ph_projekte', 'ph_sortiment'] – dort entfernen
WARNUNG Workflow Action 'Veröffentlichen' ist Core-Fixture, zusätzlich definiert in ['ph_marketing', 'ph_personal', 'ph_projekte', 'ph_sortiment'] – dort entfernen
WARNUNG Workflow Action 'Widerrufen' ist Core-Fixture, zusätzlich definiert in ['ph_projekte'] – dort entfernen
WARNUNG Workflow Action 'Wieder öffnen' ist Core-Fixture, zusätzlich definiert in ['ph_marketing', 'ph_service'] – dort entfernen
WARNUNG Workflow Action 'Zurück auf Entwurf' ist Core-Fixture, zusätzlich definiert in ['ph_logistik', 'ph_marketing', 'ph_personal', 'ph_sortiment'] – dort entfernen
WARNUNG Workflow Action 'Zurückziehen' ist Core-Fixture, zusätzlich definiert in ['ph_personal', 'ph_projekte'] – dort entfernen
WARNUNG Workflow Action 'Übergeben' ist Core-Fixture, zusätzlich definiert in ['ph_logistik', 'ph_projekte'] – dort entfernen
WARNUNG ph_crm\ph_crm\ph_crm\doctype\ph_anfrage_produkt\ph_anfrage_produkt.json: 'produkt' → 'PH Produkt' (ph_sortiment) – HART: App nicht in required_apps von ph_crm ['ph_core'] und wird später installiert
WARNUNG ph_faktura\ph_faktura\fixtures\custom_field.json: 'CustomField:ph_faktura_kreditor_nr@dt' → 'PH Lieferant' (ph_sortiment) – nur transitiv erreichbar; App in required_apps von ph_faktura aufnehmen (CONVENTIONS 10)
WARNUNG ph_faktura\ph_faktura\ph_faktura\doctype\ph_beleg_position\ph_beleg_position.json: 'produkt' → 'PH Produkt' (ph_sortiment) – nur transitiv erreichbar; App in required_apps von ph_faktura aufnehmen (CONVENTIONS 10)
WARNUNG ph_faktura\ph_faktura\ph_faktura\doctype\ph_beleg_position\ph_beleg_position.json: 'ausfuehrung' → 'PH Produkt Ausfuehrung' (ph_sortiment) – nur transitiv erreichbar; App in required_apps von ph_faktura aufnehmen (CONVENTIONS 10)
WARNUNG ph_faktura\ph_faktura\ph_faktura\doctype\ph_beleg_position\ph_beleg_position.json: 'lieferant' → 'PH Lieferant' (ph_sortiment) – nur transitiv erreichbar; App in required_apps von ph_faktura aufnehmen (CONVENTIONS 10)
WARNUNG ph_faktura\ph_faktura\ph_faktura\doctype\ph_eingangsrechnung\ph_eingangsrechnung.json: 'lieferant' → 'PH Lieferant' (ph_sortiment) – nur transitiv erreichbar; App in required_apps von ph_faktura aufnehmen (CONVENTIONS 10)
WARNUNG ph_faktura\ph_faktura\ph_faktura\doctype\ph_eingangsrechnung\ph_eingangsrechnung.json: 'herstellerbestellung' → 'PH Herstellerbestellung' (ph_sortiment) – nur transitiv erreichbar; App in required_apps von ph_faktura aufnehmen (CONVENTIONS 10)
WARNUNG ph_logistik\ph_logistik\ph_logistik\doctype\ph_lieferschein\ph_lieferschein.json: 'kontakt' → 'PH Kontakt' (ph_crm) – nur transitiv erreichbar; App in required_apps von ph_logistik aufnehmen (CONVENTIONS 10)
WARNUNG ph_logistik\ph_logistik\ph_logistik\doctype\ph_sendung\ph_sendung.json: 'kontakt' → 'PH Kontakt' (ph_crm) – nur transitiv erreichbar; App in required_apps von ph_logistik aufnehmen (CONVENTIONS 10)
WARNUNG ph_logistik\ph_logistik\ph_logistik\doctype\ph_tour_stopp\ph_tour_stopp.json: 'kontakt' → 'PH Kontakt' (ph_crm) – nur transitiv erreichbar; App in required_apps von ph_logistik aufnehmen (CONVENTIONS 10)
```
