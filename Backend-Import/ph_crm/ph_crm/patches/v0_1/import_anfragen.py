"""Migration M4 (PLAN.md Abschnitt 4): Anfragen-Historie aus der alten App `platzhirsch_studio`
(DocTypes `Kontakt Form`, `Anfrage`, `Anfrage Produkt`) nach PH Anfrage übernehmen.

Nur auf der Staging-Site mit Kopie der Produktivdaten; läuft leer, wenn die alten DocTypes fehlen.
Idempotent über referenz_website = "<alter DocType>:<alter name>". Alle Altbestände bekommen
Status „Verloren“ mit Grund „Sonstiges“ und Kommentar „Altbestand“ – die Leitung sichtet im Kanban
(Filter quelle = sonstige, kanal = Altbestand) und setzt per „Zurück auf Neu“ zurück, was noch offen ist.
"""

import frappe
from frappe.utils import cstr, get_datetime

ALT = (
    # (DocType alt, Art, Feldzuordnung)
    ("Kontakt Form", "Kontakt", {"vorname_voll": "name", "firma": "company", "email": "email_address", "telefon": "telefon", "anliegen": "ihre_nachricht"}),
    ("Anfrage", "Beratung", {"vorname": "vorname", "nachname": "nachname", "email": "email", "telefon": "telefon", "anliegen": "bitte_beschreiben_sie_ihr_vorhaben", "projektart": "bei_meiner_anfrage_geht_es_um", "objektart": "das_projekt_soll_verwirklicht_werden"}),
    ("Anfrage Produkt", "Produkt", {"vorname": "anfrage_vorname", "nachname": "anfrage_nachname", "email": "anfrage_email", "telefon": "anfrage_phone", "firma": "anfrage_company", "plz_ort": "anfrage_city", "land": "anfrage_country", "anliegen": "anfrage_beschreibung"}),
)


def execute():
    if not frappe.db.exists("DocType", "PH Anfrage"):
        return
    gesamt = 0
    for alt_dt, art, mapping in ALT:
        if not frappe.db.exists("DocType", alt_dt):
            continue
        felder = ["name", "creation", "owner"] + [f for f in mapping.values() if frappe.get_meta(alt_dt).has_field(f)]
        for alt in frappe.get_all(alt_dt, fields=felder, order_by="creation asc", limit=100000):
            ref = f"{alt_dt}:{alt.name}"
            if frappe.db.exists("PH Anfrage", {"referenz_website": ref}):
                continue
            try:
                werte = {k: cstr(alt.get(v)) for k, v in mapping.items() if alt.get(v) is not None}
                if "vorname_voll" in werte:
                    teile = werte.pop("vorname_voll").split()
                    werte["vorname"], werte["nachname"] = (" ".join(teile[:-1]), teile[-1]) if len(teile) > 1 else ("", teile[0] if teile else "")
                anliegen = frappe.utils.escape_html(werte.pop("anliegen", "") or "")
                doc = frappe.get_doc(
                    {
                        "doctype": "PH Anfrage",
                        "art": art,
                        "quelle": "sonstige",
                        "kanal": "Altbestand",
                        "eingang": get_datetime(alt.creation),
                        "referenz_website": ref,
                        "nachname": werte.get("nachname") or "(ohne Nachname)",
                        "anliegen": anliegen.replace("\n", "<br>") or "–",
                        "status": "Verloren",
                        "verloren_grund": "Sonstiges",
                        **{k: v for k, v in werte.items() if k != "nachname"},
                    }
                )
                if not doc.email and not doc.telefon:
                    doc.telefon = "unbekannt"
                doc.flags.ignore_permissions = True
                doc.flags.ignore_mandatory = True
                doc.insert()
                if art == "Produkt" and frappe.get_meta(alt_dt).has_field("produkte"):
                    for p in frappe.get_all(f"{alt_dt} Item", filters={"parent": alt.name}, fields=["*"]) if frappe.db.exists("DocType", f"{alt_dt} Item") else []:
                        doc.append("produkte", {"produkt_slug": cstr(p.get("produkt") or p.get("slug") or "")[:140], "produkt_name": cstr(p.get("produkt_name") or p.get("produkt") or "")[:140], "menge": 1})
                    doc.save(ignore_permissions=True)
                doc.add_comment("Info", f"Altbestand aus {alt_dt} {alt.name} (Migration M4)")
                gesamt += 1
                if gesamt % 200 == 0:
                    frappe.db.commit()
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"M4 Import {ref} fehlgeschlagen")
    frappe.db.commit()
    if gesamt:
        frappe.logger("ph_crm").info(f"M4: {gesamt} Anfragen importiert")
